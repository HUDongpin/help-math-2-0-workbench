#!/usr/bin/env node

import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import {
  access,
  lstat,
  mkdir,
  readFile,
  readdir,
  stat,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");
const defaultCatalogPath = path.join(projectRoot, "catalog", "source-files.json");

const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const MD5_PATTERN = /^[a-f0-9]{32}$/;
const DRIVE_ID_PATTERN = /^[A-Za-z0-9_-]+$/;
const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f]/;

const GRADE4_COURSE_PATTERN = /^HELP_COURSES\/ELMGR4\/L(?:[1-9]|1[0-2])(?:\/|$)/;
const GRADE4_EMBEDDED_ANCHOR = "/HELP_COURSES/ELMGR4/";
const SHARED_KEYTERMS_PATTERN = /^HELP_KEYTERMS\/KT\/ELEMENTARY\/DIG(?:\/|$)/;
const SHARED_KEYTERMS_EMBEDDED_ANCHOR = "/HELP_KEYTERMS/KT/ELEMENTARY/DIG/";

const TECHNICAL_EXTENSIONS = new Set([
  "aac",
  "as",
  "fla",
  "flv",
  "gif",
  "jpeg",
  "jpg",
  "jsfl",
  "m4a",
  "mp3",
  "mp4",
  "otf",
  "png",
  "svg",
  "swf",
  "ttf",
  "wav",
  "woff",
  "woff2",
  "xml",
]);

const MIME_EXTENSION = new Map([
  ["application/x-shockwave-flash", "swf"],
  ["application/xml", "xml"],
  ["text/xml", "xml"],
  ["audio/mpeg", "mp3"],
  ["audio/mp4", "m4a"],
  ["audio/wav", "wav"],
  ["audio/x-wav", "wav"],
  ["image/gif", "gif"],
  ["image/jpeg", "jpg-or-jpeg"],
  ["image/png", "png"],
  ["image/svg+xml", "svg"],
  ["video/mp4", "mp4"],
]);

const FIELD_ALIASES = {
  driveId: ["driveid", "id", "fileid", "googlefileid"],
  relativePath: ["relativepath", "path", "filepath", "drivepath"],
  type: ["type", "mimetype", "filetype"],
  bytes: ["size", "bytes", "sizebytes", "filesize"],
  sha256: ["sha256", "sha256checksum", "sha256hash"],
  md5: ["md5", "md5checksum", "md5hash"],
};

function usage() {
  return `Usage:
  node scripts/reconcile-drive-source-intake.mjs \\
    --inventory /outside/repo/drive-inventory.json \\
    --output-json /outside/repo/drive-intake-plan.json \\
    --output-csv /outside/repo/drive-intake-plan.csv \\
    [--catalog catalog/source-files.json] \\
    [--historical-root /read-only/technical/archive/root] \\
    [--strip-prefix HELP_ELM_FINAL_Dec21_2015] \\
    [--include-shared-keyterms] [--force]

The Drive inventory may be JSON (an array or {"files": [...]}) or RFC-4180
CSV. Required fields are Drive ID, relative path, type, and size. Optional
fields are SHA-256 and MD5. Common spellings such as drive_id, mimeType,
sizeBytes, sha256Checksum, and md5Checksum are accepted.

Safety boundaries:
  - this command writes plans only; it never copies or modifies source files;
  - output files must be outside the HELP Math repository and outside any
    supplied historical root;
  - only Grade 4 course technical paths are emitted by default;
  - shared elementary KeyTerms require --include-shared-keyterms;
  - all other rows are counted but path/ID-redacted;
  - ambiguous, traversal, case-colliding, or type-conflicting paths abort.

Use --strip-prefix only when every inventory path is relative to the same
exported Drive root. Existing output plans are not overwritten unless --force.`;
}

function sha256Text(value) {
  return createHash("sha256").update(value).digest("hex");
}

function normalizeHeader(value) {
  return String(value).replace(/^\uFEFF/, "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function parseCsv(content) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  let closedQuote = false;

  function pushField() {
    row.push(field);
    field = "";
    closedQuote = false;
  }

  function pushRow() {
    pushField();
    if (row.some((value) => value !== "")) rows.push(row);
    row = [];
  }

  for (let index = 0; index < content.length; index += 1) {
    const character = content[index];
    if (inQuotes) {
      if (character === '"') {
        if (content[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          inQuotes = false;
          closedQuote = true;
        }
      } else {
        field += character;
      }
      continue;
    }

    if (closedQuote && character !== "," && character !== "\n" && character !== "\r") {
      throw new Error(`Invalid CSV character after a closing quote at offset ${index}`);
    }
    if (character === '"') {
      if (field !== "") throw new Error(`Invalid CSV quote at offset ${index}`);
      inQuotes = true;
    } else if (character === ",") {
      pushField();
    } else if (character === "\n") {
      pushRow();
    } else if (character === "\r") {
      if (content[index + 1] === "\n") index += 1;
      pushRow();
    } else {
      field += character;
    }
  }

  if (inQuotes) throw new Error("Unterminated quoted CSV field");
  if (field !== "" || row.length > 0) pushRow();
  if (rows.length === 0) throw new Error("Drive inventory CSV is empty");

  const headers = rows[0].map(normalizeHeader);
  if (headers.some((header) => !header)) throw new Error("Drive inventory CSV has an empty header");
  if (new Set(headers).size !== headers.length) {
    throw new Error("Drive inventory CSV has duplicate normalized headers");
  }

  return rows.slice(1).map((values, index) => {
    if (values.length !== headers.length) {
      throw new Error(
        `Drive inventory CSV row ${index + 2} has ${values.length} field(s); expected ${headers.length}`,
      );
    }
    return Object.fromEntries(headers.map((header, fieldIndex) => [header, values[fieldIndex]]));
  });
}

function parseInventory(content, formatHint = "") {
  const trimmed = content.trimStart();
  const looksJson =
    formatHint.toLowerCase().endsWith(".json") || trimmed.startsWith("[") || trimmed.startsWith("{");
  if (!looksJson) return parseCsv(content);

  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch (error) {
    throw new Error(`Invalid Drive inventory JSON: ${error.message}`);
  }
  const rows = Array.isArray(parsed) ? parsed : parsed?.files;
  if (!Array.isArray(rows)) {
    throw new Error('Drive inventory JSON must be an array or an object with a "files" array');
  }
  if (rows.some((row) => !row || typeof row !== "object" || Array.isArray(row))) {
    throw new Error("Every Drive inventory JSON row must be an object");
  }
  return rows;
}

function valuesByNormalizedKey(row) {
  const result = new Map();
  for (const [key, value] of Object.entries(row)) {
    const normalized = normalizeHeader(key);
    const current = result.get(normalized) ?? [];
    current.push(value);
    result.set(normalized, current);
  }
  return result;
}

function fieldValue(row, logicalName, rowNumber, required = false) {
  const values = valuesByNormalizedKey(row);
  const candidates = FIELD_ALIASES[logicalName]
    .flatMap((alias) => values.get(alias) ?? [])
    .filter((value) => value !== null && value !== undefined && String(value) !== "");
  const distinct = [...new Set(candidates.map((value) => String(value)))];
  if (distinct.length > 1) {
    throw new Error(`Drive inventory row ${rowNumber} has conflicting ${logicalName} fields`);
  }
  if (candidates.length === 0) {
    if (required) throw new Error(`Drive inventory row ${rowNumber} is missing ${logicalName}`);
    return null;
  }
  return candidates[0];
}

function normalizeRelativePath(value, label = "relative path") {
  if (typeof value !== "string") throw new Error(`${label} must be a string`);
  if (value === "" || value !== value.trim()) throw new Error(`${label} is empty or has outer whitespace`);
  if (value !== value.normalize("NFC")) throw new Error(`${label} is not Unicode NFC-normalized`);
  if (value.startsWith("/") || value.includes("\\") || CONTROL_CHARACTER_PATTERN.test(value)) {
    throw new Error(`${label} is absolute, contains a backslash, or contains a control character`);
  }
  const segments = value.split("/");
  if (
    segments.some(
      (segment) =>
        segment === "" ||
        segment === "." ||
        segment === ".." ||
        segment !== segment.trim(),
    )
  ) {
    throw new Error(`${label} contains an empty, traversal, dot, or whitespace-ambiguous segment`);
  }
  return segments.join("/");
}

function normalizePrefix(value) {
  if (value === null || value === undefined) return null;
  return normalizeRelativePath(value, "strip prefix").replace(/\/$/, "");
}

function parseBytes(value, rowNumber) {
  const text = String(value);
  if (!/^(0|[1-9][0-9]*)$/.test(text)) {
    throw new Error(`Drive inventory row ${rowNumber} has an invalid non-negative integer size`);
  }
  const bytes = Number(text);
  if (!Number.isSafeInteger(bytes)) {
    throw new Error(`Drive inventory row ${rowNumber} size exceeds the safe integer range`);
  }
  return bytes;
}

function normalizeOptionalHash(value, pattern, label, rowNumber) {
  if (value === null || value === undefined || String(value) === "") return null;
  const normalized = String(value).toLowerCase();
  if (!pattern.test(normalized)) {
    throw new Error(`Drive inventory row ${rowNumber} has an invalid ${label}`);
  }
  return normalized;
}

function extensionForPath(relativePath) {
  const extension = path.posix.extname(relativePath).toLowerCase();
  return extension.startsWith(".") ? extension.slice(1) : extension;
}

function validateType(type, extension, rowNumber) {
  if (typeof type !== "string" || type === "" || type !== type.trim()) {
    throw new Error(`Drive inventory row ${rowNumber} has an invalid type`);
  }
  const normalized = type.toLowerCase().replace(/^\./, "");
  if (
    normalized === "folder" ||
    normalized === "directory" ||
    normalized === "application/vnd.google-apps.folder"
  ) {
    throw new Error(`Drive inventory row ${rowNumber} describes a folder; a file-only export is required`);
  }
  if (TECHNICAL_EXTENSIONS.has(normalized) && normalized !== extension) {
    throw new Error(
      `Drive inventory row ${rowNumber} type ${type} conflicts with .${extension || "(none)"}`,
    );
  }
  const expected = MIME_EXTENSION.get(normalized);
  if (expected && expected !== extension && !(expected === "jpg-or-jpeg" && ["jpg", "jpeg"].includes(extension))) {
    throw new Error(
      `Drive inventory row ${rowNumber} MIME type ${type} conflicts with .${extension || "(none)"}`,
    );
  }
  return normalized;
}

function normalizeInventoryRows(rows, { stripPrefix = null } = {}) {
  const normalizedPrefix = normalizePrefix(stripPrefix);
  const byPathCaseFold = new Map();
  const byDriveId = new Map();
  const records = [];
  let collapsedExactDuplicateRows = 0;

  rows.forEach((row, index) => {
    const rowNumber = index + 1;
    const rawDriveId = fieldValue(row, "driveId", rowNumber, true);
    const driveId = String(rawDriveId);
    if (driveId !== driveId.trim() || !DRIVE_ID_PATTERN.test(driveId)) {
      throw new Error(`Drive inventory row ${rowNumber} has an invalid Drive ID`);
    }

    const rawPath = normalizeRelativePath(
      fieldValue(row, "relativePath", rowNumber, true),
      `Drive inventory row ${rowNumber} relative path`,
    );
    let canonicalPath = rawPath;
    if (normalizedPrefix) {
      if (!rawPath.startsWith(`${normalizedPrefix}/`)) {
        throw new Error(
          `Drive inventory row ${rowNumber} is outside the declared strip prefix`,
        );
      }
      canonicalPath = rawPath.slice(normalizedPrefix.length + 1);
    } else if (
      rawPath.includes(GRADE4_EMBEDDED_ANCHOR) ||
      rawPath.includes(SHARED_KEYTERMS_EMBEDDED_ANCHOR)
    ) {
      throw new Error(
        `Drive inventory row ${rowNumber} embeds a known technical root; declare --strip-prefix explicitly`,
      );
    }
    canonicalPath = normalizeRelativePath(
      canonicalPath,
      `Drive inventory row ${rowNumber} canonical path`,
    );

    const bytes = parseBytes(fieldValue(row, "bytes", rowNumber, true), rowNumber);
    const extension = extensionForPath(canonicalPath);
    const type = validateType(String(fieldValue(row, "type", rowNumber, true)), extension, rowNumber);
    const sha256 = normalizeOptionalHash(
      fieldValue(row, "sha256", rowNumber),
      SHA256_PATTERN,
      "SHA-256",
      rowNumber,
    );
    const md5 = normalizeOptionalHash(
      fieldValue(row, "md5", rowNumber),
      MD5_PATTERN,
      "MD5",
      rowNumber,
    );
    const record = {
      driveId,
      driveRelativePath: rawPath,
      canonicalPath,
      type,
      extension,
      bytes,
      sha256,
      md5,
    };
    const signature = JSON.stringify(record);
    const foldedPath = canonicalPath.toLocaleLowerCase("en-US");
    const existingPath = byPathCaseFold.get(foldedPath);
    if (existingPath) {
      if (existingPath.signature === signature) {
        collapsedExactDuplicateRows += 1;
        return;
      }
      throw new Error(
        `Ambiguous Drive inventory rows ${existingPath.rowNumber} and ${rowNumber} collide by case or placement`,
      );
    }
    const existingDriveId = byDriveId.get(driveId);
    if (existingDriveId && existingDriveId.signature !== signature) {
      throw new Error(
        `Drive inventory rows ${existingDriveId.rowNumber} and ${rowNumber} reuse one Drive ID with differing metadata`,
      );
    }
    byPathCaseFold.set(foldedPath, { rowNumber, signature });
    byDriveId.set(driveId, { rowNumber, signature });
    records.push(record);
  });

  records.sort(
    (left, right) =>
      left.canonicalPath.localeCompare(right.canonicalPath, "en") ||
      left.driveId.localeCompare(right.driveId, "en"),
  );
  return { records, collapsedExactDuplicateRows };
}

function parseCatalog(content) {
  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch (error) {
    throw new Error(`Invalid canonical source catalog JSON: ${error.message}`);
  }
  if (!parsed || !Array.isArray(parsed.files)) {
    throw new Error('Canonical source catalog must contain a "files" array');
  }

  const records = parsed.files.map((file, index) => {
    const rowNumber = index + 1;
    if (!file || typeof file !== "object" || Array.isArray(file)) {
      throw new Error(`Canonical source catalog row ${rowNumber} must be an object`);
    }
    const relativePath = normalizeRelativePath(
      file.path,
      `Canonical source catalog row ${rowNumber} path`,
    );
    if (!Number.isSafeInteger(file.bytes) || file.bytes < 0) {
      throw new Error(`Canonical source catalog row ${rowNumber} has invalid bytes`);
    }
    const sha256 = String(file.sha256 ?? "").toLowerCase();
    if (!SHA256_PATTERN.test(sha256)) {
      throw new Error(`Canonical source catalog row ${rowNumber} has invalid SHA-256`);
    }
    const md5 = file.md5 === null || file.md5 === undefined || file.md5 === ""
      ? null
      : String(file.md5).toLowerCase();
    if (md5 && !MD5_PATTERN.test(md5)) {
      throw new Error(`Canonical source catalog row ${rowNumber} has invalid MD5`);
    }
    return {
      path: relativePath,
      bytes: file.bytes,
      sha256,
      md5,
      extension: extensionForPath(relativePath),
    };
  });

  const byPath = new Map();
  const byPathCaseFold = new Map();
  const bySha256 = new Map();
  const byMd5 = new Map();
  for (const record of records) {
    if (byPath.has(record.path)) throw new Error(`Canonical source catalog repeats ${record.path}`);
    const folded = record.path.toLocaleLowerCase("en-US");
    if (byPathCaseFold.has(folded)) {
      throw new Error(
        `Canonical source catalog has a case-colliding path: ${byPathCaseFold.get(folded).path} and ${record.path}`,
      );
    }
    byPath.set(record.path, record);
    byPathCaseFold.set(folded, record);
    const hashMatches = bySha256.get(record.sha256) ?? [];
    hashMatches.push(record);
    bySha256.set(record.sha256, hashMatches);
    if (record.md5) {
      const md5Matches = byMd5.get(record.md5) ?? [];
      md5Matches.push(record);
      byMd5.set(record.md5, md5Matches);
    }
  }
  for (const matches of bySha256.values()) {
    matches.sort((left, right) => left.path.localeCompare(right.path, "en"));
  }
  for (const matches of byMd5.values()) {
    matches.sort((left, right) => left.path.localeCompare(right.path, "en"));
  }
  return { records, byPath, byPathCaseFold, bySha256, byMd5 };
}

function scopeForRecord(record, includeSharedKeyterms) {
  if (GRADE4_COURSE_PATTERN.test(record.canonicalPath)) return "grade4-course";
  if (includeSharedKeyterms && SHARED_KEYTERMS_PATTERN.test(record.canonicalPath)) {
    return "shared-elementary-keyterms";
  }
  return null;
}

function createCounter() {
  const values = new Map();
  return {
    add(key) {
      values.set(key, (values.get(key) ?? 0) + 1);
    },
    object() {
      return Object.fromEntries([...values].sort(([left], [right]) => left.localeCompare(right, "en")));
    },
  };
}

function classifyRecord(record, scope, catalog, historicalBySha256, historicalByMd5) {
  const exact = catalog.byPath.get(record.canonicalPath) ?? null;
  const caseVariant = exact
    ? null
    : catalog.byPathCaseFold.get(record.canonicalPath.toLocaleLowerCase("en-US")) ?? null;
  const canonicalHashMatches = record.sha256 ? catalog.bySha256.get(record.sha256) ?? [] : [];
  const historicalMatches = record.sha256 ? historicalBySha256.get(record.sha256) ?? [] : [];
  const canonicalMd5Matches = !record.sha256 && record.md5
    ? catalog.byMd5.get(record.md5) ?? []
    : [];
  const historicalMd5Matches = !record.sha256 && record.md5
    ? historicalByMd5.get(record.md5) ?? []
    : [];

  let pathStatus = exact ? "canonical-path-present" : "canonical-exact-path-missing";
  let identityStatus = "remote-sha256-unavailable";
  let conflictStatus = "none";
  let downloadDecision = "hold";
  let disposition = "hold-for-review";
  const reasons = [];

  if (caseVariant) {
    pathStatus = "canonical-path-case-variant";
    conflictStatus = "path-case-variant";
    disposition = "hold-path-variant";
    reasons.push("A canonical path differs only by case; placement identity must be resolved.");
  } else if (exact) {
    if (record.sha256) {
      if (record.sha256 === exact.sha256) {
        identityStatus = "canonical-exact-hash";
        downloadDecision = "skip";
        disposition = "skip-byte-identical-canonical";
        reasons.push("The exact canonical path has the same SHA-256.");
      } else {
        identityStatus = canonicalHashMatches.length
          ? "canonical-hash-at-different-placement"
          : historicalMatches.length
            ? "historical-hash-duplicate"
            : "sha256-not-in-local-evidence";
        conflictStatus = "exact-path-content-variant";
        disposition = "hold-content-variant";
        reasons.push("The exact canonical path exists with a different SHA-256.");
      }
    } else if (record.bytes !== exact.bytes) {
      conflictStatus = "exact-path-size-variant";
      disposition = "hold-size-variant";
      reasons.push("The exact canonical path exists with a different byte count and no remote SHA-256.");
    } else {
      if (record.md5 && exact.md5 === record.md5) {
        identityStatus = "canonical-md5-candidate-needs-sha256";
        reasons.push("The optional MD5 agrees, but project identity still requires SHA-256 verification.");
      }
      downloadDecision = "download";
      disposition = "download-to-quarantine-for-hash-verification";
      reasons.push("Path and size agree, but byte identity cannot be proven without a remote SHA-256.");
    }
  } else if (!caseVariant) {
    if (record.sha256 && canonicalHashMatches.length) {
      identityStatus = "canonical-hash-duplicate";
      disposition = "hold-placement-alias-review";
      reasons.push("The bytes already exist at another canonical placement; do not collapse placement identity.");
    } else if (record.sha256 && historicalMatches.length) {
      identityStatus = "historical-hash-duplicate";
      disposition = "use-local-historical-candidate-after-custody-review";
      reasons.push("The bytes exist in the optional read-only historical root; custody review is still required.");
    } else if (record.sha256) {
      identityStatus = "sha256-not-in-local-evidence";
      downloadDecision = "download";
      disposition = "download-to-quarantine";
      reasons.push("The exact path is missing and the remote SHA-256 is not present in local evidence.");
    } else if (canonicalMd5Matches.length) {
      identityStatus = "canonical-md5-candidate-needs-sha256";
      downloadDecision = "download";
      disposition = "download-to-quarantine-for-sha256-verification";
      reasons.push("MD5 suggests canonical bytes may exist, but SHA-256 is required before identity claims.");
    } else if (historicalMd5Matches.length) {
      identityStatus = "historical-md5-candidate-needs-sha256";
      downloadDecision = "download";
      disposition = "download-to-quarantine-for-sha256-verification";
      reasons.push("MD5 suggests historical bytes may exist, but SHA-256 is required before identity claims.");
    } else {
      downloadDecision = "download";
      disposition = "download-to-quarantine-for-hashing";
      reasons.push("The exact path is missing and the Drive export did not provide SHA-256.");
    }
  }

  return {
    driveId: record.driveId,
    driveRelativePath: record.driveRelativePath,
    canonicalPath: record.canonicalPath,
    scope,
    extension: record.extension,
    type: record.type,
    bytes: record.bytes,
    sha256: record.sha256,
    md5: record.md5,
    pathStatus,
    identityStatus,
    conflictStatus,
    downloadDecision,
    disposition,
    canonicalExact: exact
      ? { path: exact.path, bytes: exact.bytes, sha256: exact.sha256 }
      : null,
    canonicalCaseVariantPath: caseVariant?.path ?? null,
    canonicalHashMatchPaths: canonicalHashMatches.map((match) => match.path),
    canonicalMd5MatchPaths: canonicalMd5Matches.map((match) => match.path),
    historicalHashMatches: historicalMatches,
    historicalMd5Matches,
    reasons,
  };
}

function reconcileInventory(
  inventoryRows,
  catalog,
  {
    stripPrefix = null,
    includeSharedKeyterms = false,
    historicalBySha256 = new Map(),
    historicalByMd5 = new Map(),
    inputSha256 = null,
    catalogSha256 = null,
    historicalScan = null,
  } = {},
) {
  const normalized = normalizeInventoryRows(inventoryRows, { stripPrefix });
  const scopeCounts = createCounter();
  const pathCounts = createCounter();
  const identityCounts = createCounter();
  const conflictCounts = createCounter();
  const decisionCounts = createCounter();
  const dispositionCounts = createCounter();
  let redactedOutOfScopeRows = 0;
  let redactedNonTechnicalRows = 0;
  let redactedSharedKeytermsRows = 0;
  const records = [];

  for (const record of normalized.records) {
    const sharedKeyterm = SHARED_KEYTERMS_PATTERN.test(record.canonicalPath);
    const scope = scopeForRecord(record, includeSharedKeyterms);
    if (!scope) {
      redactedOutOfScopeRows += 1;
      if (sharedKeyterm) redactedSharedKeytermsRows += 1;
      continue;
    }
    if (!TECHNICAL_EXTENSIONS.has(record.extension)) {
      redactedNonTechnicalRows += 1;
      continue;
    }
    const classified = classifyRecord(
      record,
      scope,
      catalog,
      historicalBySha256,
      historicalByMd5,
    );
    records.push(classified);
    scopeCounts.add(classified.scope);
    pathCounts.add(classified.pathStatus);
    identityCounts.add(classified.identityStatus);
    conflictCounts.add(classified.conflictStatus);
    decisionCounts.add(classified.downloadDecision);
    dispositionCounts.add(classified.disposition);
  }

  records.sort(
    (left, right) =>
      left.canonicalPath.localeCompare(right.canonicalPath, "en") ||
      left.driveId.localeCompare(right.driveId, "en"),
  );

  return {
    schemaVersion: 1,
    artifactType: "help-math-drive-source-intake-plan",
    mode: "plan-only-no-source-mutation",
    evidenceBoundary:
      "Path and hash results support intake triage only; they do not prove Flash fidelity, acceptance, strict completion, or release readiness.",
    inputs: {
      inventorySha256: inputSha256,
      canonicalCatalogSha256: catalogSha256,
      historicalScan,
    },
    policy: {
      grade4CoursePattern: GRADE4_COURSE_PATTERN.source,
      includeSharedKeyterms,
      sharedKeytermsPattern: SHARED_KEYTERMS_PATTERN.source,
      stripPrefix: normalizePrefix(stripPrefix),
      technicalExtensions: [...TECHNICAL_EXTENSIONS].sort((left, right) => left.localeCompare(right, "en")),
      outOfScopeRows: "counted-but-path-and-drive-id-redacted",
      historicalPaths: "opaque-reference-only",
    },
    counts: {
      inputRows: inventoryRows.length,
      normalizedUniqueRows: normalized.records.length,
      collapsedExactDuplicateRows: normalized.collapsedExactDuplicateRows,
      selectedTechnicalRows: records.length,
      redactedOutOfScopeRows,
      redactedNonTechnicalRows,
      redactedSharedKeytermsRows,
      byScope: scopeCounts.object(),
      byPathStatus: pathCounts.object(),
      byIdentityStatus: identityCounts.object(),
      byConflictStatus: conflictCounts.object(),
      byDownloadDecision: decisionCounts.object(),
      byDisposition: dispositionCounts.object(),
    },
    records,
  };
}

async function sha256File(filePath) {
  return new Promise((resolve, reject) => {
    const hash = createHash("sha256");
    const input = createReadStream(filePath);
    input.on("error", reject);
    input.on("data", (chunk) => hash.update(chunk));
    input.on("end", () => resolve(hash.digest("hex")));
  });
}

async function listHistoricalTechnicalFiles(root, directory = root, result = [], summary = { skippedSymlinkCount: 0 }) {
  const entries = await readdir(directory, { withFileTypes: true });
  entries.sort((left, right) => left.name.localeCompare(right.name, "en"));
  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) {
      summary.skippedSymlinkCount += 1;
    } else if (entry.isDirectory()) {
      await listHistoricalTechnicalFiles(root, entryPath, result, summary);
    } else if (entry.isFile()) {
      const extension = extensionForPath(entry.name);
      if (TECHNICAL_EXTENSIONS.has(extension)) result.push(entryPath);
    }
  }
  return { files: result, summary };
}

async function mapConcurrent(values, limit, mapper) {
  const results = new Array(values.length);
  let nextIndex = 0;
  async function worker() {
    while (nextIndex < values.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await mapper(values[index], index);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(limit, Math.max(values.length, 1)) }, () => worker()),
  );
  return results;
}

async function scanHistoricalRoot(root, normalizedRecords) {
  const resolvedRoot = path.resolve(root);
  const rootInfo = await lstat(resolvedRoot);
  if (rootInfo.isSymbolicLink() || !rootInfo.isDirectory()) {
    throw new Error("Historical root must be a real read-only directory, not a symlink or file");
  }
  const requiredSizes = new Set(
    normalizedRecords
      .filter((record) => record.sha256 || record.md5)
      .map((record) => record.bytes),
  );
  const { files, summary } = await listHistoricalTechnicalFiles(resolvedRoot);
  const sized = [];
  for (const filePath of files) {
    const info = await stat(filePath);
    if (requiredSizes.has(info.size)) sized.push({ filePath, bytes: info.size });
  }
  const rootSalt = sha256Text(resolvedRoot);
  const hashed = await mapConcurrent(sized, 6, async ({ filePath, bytes }) => {
    const relativePath = path.relative(resolvedRoot, filePath).split(path.sep).join("/");
    return {
      bytes,
      sha256: await sha256File(filePath),
      md5: await new Promise((resolve, reject) => {
        const hash = createHash("md5");
        const input = createReadStream(filePath);
        input.on("error", reject);
        input.on("data", (chunk) => hash.update(chunk));
        input.on("end", () => resolve(hash.digest("hex")));
      }),
      ref: `historical-${sha256Text(`${rootSalt}\0${relativePath}`).slice(0, 20)}`,
    };
  });
  const bySha256 = new Map();
  const byMd5 = new Map();
  for (const record of hashed) {
    const matches = bySha256.get(record.sha256) ?? [];
    matches.push(record.ref);
    bySha256.set(record.sha256, matches);
    const md5Matches = byMd5.get(record.md5) ?? [];
    md5Matches.push(record.ref);
    byMd5.set(record.md5, md5Matches);
  }
  for (const refs of bySha256.values()) refs.sort((left, right) => left.localeCompare(right, "en"));
  for (const refs of byMd5.values()) refs.sort((left, right) => left.localeCompare(right, "en"));
  return {
    bySha256,
    byMd5,
    summary: {
      rootRef: `historical-root-${rootSalt.slice(0, 20)}`,
      technicalFileCount: files.length,
      hashCandidateFileCount: sized.length,
      skippedSymlinkCount: summary.skippedSymlinkCount,
    },
  };
}

function csvCell(value) {
  const string = value === null || value === undefined ? "" : String(value);
  if (!/[",\r\n]/.test(string)) return string;
  return `"${string.replace(/"/g, '""')}"`;
}

function serializePlanCsv(plan) {
  const headers = [
    "drive_id",
    "drive_relative_path",
    "canonical_path",
    "scope",
    "extension",
    "type",
    "bytes",
    "sha256",
    "md5",
    "path_status",
    "identity_status",
    "conflict_status",
    "download_decision",
    "disposition",
    "canonical_exact_path",
    "canonical_exact_bytes",
    "canonical_exact_sha256",
    "canonical_case_variant_path",
    "canonical_hash_match_paths",
    "canonical_md5_match_paths",
    "historical_hash_match_refs",
    "historical_md5_match_refs",
    "reasons",
  ];
  const rows = plan.records.map((record) => [
    record.driveId,
    record.driveRelativePath,
    record.canonicalPath,
    record.scope,
    record.extension,
    record.type,
    record.bytes,
    record.sha256,
    record.md5,
    record.pathStatus,
    record.identityStatus,
    record.conflictStatus,
    record.downloadDecision,
    record.disposition,
    record.canonicalExact?.path,
    record.canonicalExact?.bytes,
    record.canonicalExact?.sha256,
    record.canonicalCaseVariantPath,
    record.canonicalHashMatchPaths.join("|"),
    record.canonicalMd5MatchPaths.join("|"),
    record.historicalHashMatches.join("|"),
    record.historicalMd5Matches.join("|"),
    record.reasons.join(" "),
  ]);
  return `${[headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\n")}\n`;
}

function isWithin(parent, candidate) {
  const relative = path.relative(path.resolve(parent), path.resolve(candidate));
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function validateOutputPaths({ inventoryPath, catalogPath, historicalRoot, outputJson, outputCsv }) {
  const resolvedJson = path.resolve(outputJson);
  const resolvedCsv = path.resolve(outputCsv);
  if (resolvedJson === resolvedCsv) throw new Error("JSON and CSV output paths must differ");
  const protectedExact = new Set([path.resolve(inventoryPath), path.resolve(catalogPath)]);
  for (const output of [resolvedJson, resolvedCsv]) {
    if (protectedExact.has(output)) throw new Error("Refusing to overwrite an input or canonical catalog");
    if (isWithin(projectRoot, output)) {
      throw new Error("Drive intake plans must be written outside the HELP Math repository");
    }
    if (historicalRoot && isWithin(historicalRoot, output)) {
      throw new Error("Drive intake plans must not be written inside the historical root");
    }
  }
  return { outputJson: resolvedJson, outputCsv: resolvedCsv };
}

function parseArgs(argv) {
  const options = {
    catalogPath: defaultCatalogPath,
    historicalRoot: null,
    stripPrefix: null,
    includeSharedKeyterms: false,
    force: false,
    help: false,
  };
  const valueOptions = new Map([
    ["--inventory", "inventoryPath"],
    ["--catalog", "catalogPath"],
    ["--historical-root", "historicalRoot"],
    ["--strip-prefix", "stripPrefix"],
    ["--output-json", "outputJson"],
    ["--output-csv", "outputCsv"],
  ]);
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--help" || argument === "-h") options.help = true;
    else if (argument === "--include-shared-keyterms") options.includeSharedKeyterms = true;
    else if (argument === "--force") options.force = true;
    else if (valueOptions.has(argument)) {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) throw new Error(`${argument} requires a value`);
      options[valueOptions.get(argument)] = value;
      index += 1;
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }
  return options;
}

async function ensureOutputsAvailable(outputs, force) {
  if (force) return;
  for (const output of Object.values(outputs)) {
    try {
      await access(output);
      throw new Error(`Output already exists; use --force only after review: ${output}`);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
}

async function main(argv = process.argv.slice(2)) {
  const options = parseArgs(argv);
  if (options.help) {
    console.log(usage());
    return;
  }
  for (const required of ["inventoryPath", "outputJson", "outputCsv"]) {
    if (!options[required]) throw new Error(`Missing required option: ${required}`);
  }

  const inventoryPath = path.resolve(options.inventoryPath);
  const catalogPath = path.resolve(options.catalogPath);
  const historicalRoot = options.historicalRoot ? path.resolve(options.historicalRoot) : null;
  const outputs = validateOutputPaths({
    inventoryPath,
    catalogPath,
    historicalRoot,
    outputJson: options.outputJson,
    outputCsv: options.outputCsv,
  });
  await ensureOutputsAvailable(outputs, options.force);

  const [inventoryContent, catalogContent] = await Promise.all([
    readFile(inventoryPath, "utf8"),
    readFile(catalogPath, "utf8"),
  ]);
  const inventoryRows = parseInventory(inventoryContent, inventoryPath);
  const normalized = normalizeInventoryRows(inventoryRows, { stripPrefix: options.stripPrefix });
  const catalog = parseCatalog(catalogContent);
  const historical = historicalRoot
    ? await scanHistoricalRoot(historicalRoot, normalized.records)
    : { bySha256: new Map(), byMd5: new Map(), summary: null };
  const plan = reconcileInventory(inventoryRows, catalog, {
    stripPrefix: options.stripPrefix,
    includeSharedKeyterms: options.includeSharedKeyterms,
    historicalBySha256: historical.bySha256,
    historicalByMd5: historical.byMd5,
    inputSha256: sha256Text(inventoryContent),
    catalogSha256: sha256Text(catalogContent),
    historicalScan: historical.summary,
  });

  await Promise.all([
    mkdir(path.dirname(outputs.outputJson), { recursive: true }),
    mkdir(path.dirname(outputs.outputCsv), { recursive: true }),
  ]);
  await Promise.all([
    writeFile(outputs.outputJson, `${JSON.stringify(plan, null, 2)}\n`, "utf8"),
    writeFile(outputs.outputCsv, serializePlanCsv(plan), "utf8"),
  ]);
  console.log(
    JSON.stringify(
      {
        mode: plan.mode,
        selectedTechnicalRows: plan.counts.selectedTechnicalRows,
        downloadRows: plan.counts.byDownloadDecision.download ?? 0,
        holdRows: plan.counts.byDownloadDecision.hold ?? 0,
        skipRows: plan.counts.byDownloadDecision.skip ?? 0,
        redactedOutOfScopeRows: plan.counts.redactedOutOfScopeRows,
        outputJson: outputs.outputJson,
        outputCsv: outputs.outputCsv,
      },
      null,
      2,
    ),
  );
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === scriptPath;
if (isMain) {
  main().catch((error) => {
    console.error(`Drive intake reconciliation failed: ${error.message}`);
    process.exitCode = 1;
  });
}

export {
  TECHNICAL_EXTENSIONS,
  normalizeInventoryRows,
  parseCatalog,
  parseCsv,
  parseInventory,
  reconcileInventory,
  scanHistoricalRoot,
  serializePlanCsv,
  validateOutputPaths,
};
