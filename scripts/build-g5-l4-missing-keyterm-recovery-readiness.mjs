#!/usr/bin/env node

import {createHash, randomUUID} from "node:crypto";
import {
  lstat,
  mkdir,
  readFile,
  realpath,
  rename,
  unlink,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {gunzipSync} from "node:zlib";

const scriptPath = fileURLToPath(import.meta.url);
const defaultProjectRoot = path.resolve(path.dirname(scriptPath), "..");
const GENERATOR_PATH =
  "scripts/build-g5-l4-missing-keyterm-recovery-readiness.mjs";
const RELEASE_ID = "lesson-g05-l04-number-lines";
const DEFAULT_OUTPUT_PREFIX =
  "reports/g5-l4-missing-keyterm-recovery-readiness";
const PRIVATE_ARCHIVE_ROOT =
  "/Volumes/WestWorld/HELP MATH Related Files/Historical Office Documents of HELP MATH Program";
const SQL_AGGREGATE_PATH =
  "/Volumes/WestWorld/HELP MATH Related Files/Extracted_NewHelpProgram_20210203/analysis/analysis_results.json";
const SHA256 = /^[a-f0-9]{64}$/;
const PRESERVED_SOURCE_ROOT =
  "source-assets/flash/HELP MATH_ORIGINAL FILES";
const COURSE_XML_ARCHIVE_PATH = "HELP_COURSES/ELMGR5/L4/index.xml";
const SHELL_SWF_ARCHIVE_PATH =
  "HELP_COURSES/ELMGR5/L4/index_local.swf";
const SHELL_ANIMATION_ID = "shell-course-g05-l04-index-local";
const SHELL_ASSET_ID =
  "swf-7865195a07666e8123bef33f52aea36e06b7e0a9987fbbea605bc92cbe9b0301";
const MASTER_GLOSSARY_SOURCES = Object.freeze([
  {
    language: "english",
    basename: "ELKTEG4.xml",
    archivePath: "HELP_KEYTERMS/KT/ELEMENTARY/XML/ELKTEG4.xml",
    recordCount: 761,
  },
  {
    language: "spanish",
    basename: "ELKTSG4.xml",
    archivePath: "HELP_KEYTERMS/KT/ELEMENTARY/XML/ELKTSG4.xml",
    recordCount: 753,
  },
]);
const AUTHORIZED_COMBINED_REFERENCE_SOURCES = Object.freeze([
  Object.freeze({
    language: "english",
    basename: "ELKTEG4.xml",
    path:
      "source-assets/flash/intake/2026-07-30-venky-combined-keyterms/ELM/ELKTEG4.xml",
    bytes: 398191,
    sha256:
      "d39fab547dde0476c27caa01c8e3e2443d71cc40eb2df725e7a50102d01ab42c",
    recordCount: 814,
    knownUnrelatedMalformedRecordCount: 0,
  }),
  Object.freeze({
    language: "spanish",
    basename: "ELKTSG4.xml",
    path:
      "source-assets/flash/intake/2026-07-30-venky-combined-keyterms/ELM/ELKTSG4.xml",
    bytes: 396776,
    sha256:
      "a3aab5a75cd635f88ba5883a5fc2715ea144f51ac5efedac0341c5801c672c6d",
    recordCount: 812,
    knownUnrelatedMalformedRecordCount: 1,
  }),
]);
const COMBINED_REFERENCE_DIRECTION = Object.freeze({
  evidenceClass: "owner-relayed-content-manager-email",
  contentManager: "Venky",
  relayedByOwner: "Dr. Peter Hu",
  recordedDate: "2026-07-30",
  scope: "combined-elementary-keyterms-product-reference-only",
  messageHeadersVerified: false,
});

const PROJECT_INPUTS = Object.freeze({
  sourceCatalog: "catalog/source-files.json",
  lessonReleaseCatalog: "catalog/lesson-releases.json",
  sourceGap: "reports/g5-l4-source-gap-forensics.json",
  courseXml: `${PRESERVED_SOURCE_ROOT}/${COURSE_XML_ARCHIVE_PATH}`,
  shellSwf: `${PRESERVED_SOURCE_ROOT}/${SHELL_SWF_ARCHIVE_PATH}`,
  shellMachineAudit:
    "migrations/shell-course-g05-l04-index-local/audit/machine/report.json",
  shellFfdecScripts:
    "migrations/shell-course-g05-l04-index-local/audit/machine/ffdec-scripts.txt.gz",
  shellFfdecScriptInventory:
    "migrations/shell-course-g05-l04-index-local/audit/machine/g5-l4-pre-runtime-ffdec-script-inventory-candidate.json",
  masterGlossaryEnglish:
    `${PRESERVED_SOURCE_ROOT}/${MASTER_GLOSSARY_SOURCES[0].archivePath}`,
  masterGlossarySpanish:
    `${PRESERVED_SOURCE_ROOT}/${MASTER_GLOSSARY_SOURCES[1].archivePath}`,
  authorizedCombinedReferenceEnglish:
    AUTHORIZED_COMBINED_REFERENCE_SOURCES[0].path,
  authorizedCombinedReferenceSpanish:
    AUTHORIZED_COMBINED_REFERENCE_SOURCES[1].path,
  authorizedCombinedReferenceIntakeReceipt:
    "source-assets/flash/intake/2026-07-30-venky-combined-keyterms/INTAKE_RECEIPT.json",
  technicalCrosswalk:
    "private-archive/historical-office-catalog-2026-07-25/technical-source-crosswalk.json",
  historicalFileCatalog:
    "private-archive/historical-office-catalog-2026-07-25/files.jsonl",
  sqlCatalog: "catalog/NEWHELPPROGRAM_20210203.md",
  sqlFileCatalog: "catalog/newhelpprogram-20210203-files.csv",
  sqlTableCatalog: "catalog/newhelpprogram-20210203-tables.csv",
});

const TARGETS = Object.freeze([
  {language: "english", basename: "L4KTE01.xml"},
  {language: "spanish", basename: "L4KTS01.xml"},
]);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.keys(value).sort().map((key) => [key, stable(value[key])]),
  );
}

export function stableJson(value) {
  return `${JSON.stringify(stable(value), null, 2)}\n`;
}

function sha256Bytes(value) {
  return createHash("sha256").update(value).digest("hex");
}

function isWithin(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return relative === "" ||
    (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function normalizedBasename(value) {
  return path.basename(value).toLowerCase().replace(/[^a-z0-9]/g, "");
}

function resolveProjectPath(projectRoot, relativePath, label) {
  invariant(
    typeof relativePath === "string" && relativePath.length > 0,
    `${label}: path is empty`,
  );
  invariant(
    !path.isAbsolute(relativePath) && !relativePath.includes("\\"),
    `${label}: path must be project-relative and portable`,
  );
  const absolutePath = path.resolve(projectRoot, relativePath);
  invariant(
    isWithin(projectRoot, absolutePath),
    `${label}: path escapes the project root`,
  );
  invariant(
    portable(path.relative(projectRoot, absolutePath)) === relativePath,
    `${label}: path is not normalized`,
  );
  return absolutePath;
}

async function assertOrdinaryFile(absolutePath, label) {
  const metadata = await lstat(absolutePath).catch((error) => {
    throw new Error(`${label}: unavailable (${error.message})`);
  });
  invariant(
    metadata.isFile() &&
      !metadata.isSymbolicLink() &&
      metadata.nlink === 1,
    `${label}: expected one ordinary non-linked file`,
  );
  return metadata;
}

async function readAbsoluteFileRecord(absolutePath, allowedRoot, label) {
  const resolvedRoot = path.resolve(allowedRoot);
  const resolvedPath = path.resolve(absolutePath);
  invariant(
    isWithin(resolvedRoot, resolvedPath),
    `${label}: path escapes its allowed root`,
  );
  const before = await assertOrdinaryFile(resolvedPath, label);
  const [contents, realRoot, realFile] = await Promise.all([
    readFile(resolvedPath),
    realpath(resolvedRoot),
    realpath(resolvedPath),
  ]);
  invariant(
    isWithin(realRoot, realFile),
    `${label}: resolves outside its allowed root`,
  );
  const after = await assertOrdinaryFile(resolvedPath, label);
  invariant(
    before.dev === after.dev &&
      before.ino === after.ino &&
      before.mtimeMs === after.mtimeMs &&
      after.size === contents.length,
    `${label}: changed during read`,
  );
  return {
    absolutePath: resolvedPath,
    bytes: contents.length,
    sha256: sha256Bytes(contents),
    contents,
  };
}

export async function readFileRecord(
  projectRoot,
  relativePath,
  label = relativePath,
) {
  const resolvedRoot = path.resolve(projectRoot);
  const absolutePath = resolveProjectPath(resolvedRoot, relativePath, label);
  const record = await readAbsoluteFileRecord(
    absolutePath,
    resolvedRoot,
    label,
  );
  return {...record, path: relativePath};
}

async function readJsonRecord(projectRoot, relativePath, label) {
  const record = await readFileRecord(projectRoot, relativePath, label);
  try {
    return {
      ...record,
      document: JSON.parse(record.contents.toString("utf8")),
    };
  } catch (error) {
    throw new Error(`${label}: invalid JSON (${error.message})`);
  }
}

function publicDescriptor(record, sourceId, extra = {}) {
  return {
    sourceId,
    bytes: record.bytes,
    sha256: record.sha256,
    ...extra,
  };
}

function countToken(contents, token) {
  const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return (contents.toString("utf8").match(new RegExp(escaped, "gi")) || [])
    .length;
}

function catalogSourceEntry(sourceCatalog, archivePath, record, label) {
  const matches = sourceCatalog.files.filter(
    (entry) => entry.path === archivePath,
  );
  invariant(
    matches.length === 1 &&
      matches[0].bytes === record.bytes &&
      matches[0].sha256 === record.sha256,
    `${label}: preserved source-catalog binding drifted`,
  );
  return matches[0];
}

function gunzipRecord(record, label) {
  let expanded;
  try {
    expanded = gunzipSync(record.contents);
  } catch (error) {
    throw new Error(`${label}: invalid gzip (${error.message})`);
  }
  return {
    bytes: expanded.length,
    sha256: sha256Bytes(expanded),
    contents: expanded,
  };
}

function validateFingerprint(document, label) {
  const fingerprint = document?.artifactFingerprintSha256;
  invariant(
    SHA256.test(fingerprint || "") &&
      document.generatedMarker === `sha256:${fingerprint}`,
    `${label}: fingerprint marker drifted`,
  );
  const projected = {...document};
  delete projected.artifactFingerprintSha256;
  delete projected.generatedMarker;
  invariant(
    fingerprint === sha256Bytes(Buffer.from(stableJson(projected))),
    `${label}: fingerprint drifted`,
  );
}

function parseCourseKeytermDeclarations(contents) {
  const text = contents.toString("utf8");
  const block = text.match(/<Keyterms>([\s\S]*?)<\/Keyterms>/);
  invariant(block, "course XML Keyterms block is missing or ambiguous");
  const findings = TARGETS.map((target) => {
    const tag = target.language === "english" ? "English" : "Spanish";
    const matches = [...block[1].matchAll(
      new RegExp(`<${tag}>([^<]+)<\\/${tag}>`, "g"),
    )];
    invariant(
      matches.length === 1 &&
        matches[0][1].trim() ===
          `HELP_KEYTERMS/KT/ELEMENTARY/XML/${target.basename}`,
      `${target.basename}: course XML declaration drifted`,
    );
    invariant(
      countToken(contents, target.basename) === 1,
      `${target.basename}: course XML declaration multiplicity drifted`,
    );
    return {
      language: target.language,
      basename: target.basename,
      declaredPath: matches[0][1].trim(),
      declarationCount: 1,
    };
  });
  const digMatches = [...block[1].matchAll(/<DigDir>([^<]+)<\/DigDir>/g)];
  invariant(
    digMatches.length === 1 &&
      digMatches[0][1].trim() ===
        "HELP_KEYTERMS/KT/ELEMENTARY/DIG",
    "course XML KeyTerm illustration directory drifted",
  );
  return {
    declarations: findings,
    illustrationDirectory: digMatches[0][1].trim(),
  };
}

function parseMasterGlossary(contents, label) {
  const text = contents.toString("utf8");
  const records = [];
  for (const match of text.matchAll(
    /<[^>]*\bScreenkeyTerm\s*=\s*"[^"]*"[^>]*>/gi,
  )) {
    const tag = match[0];
    const screenkeyTerm = tag.match(
      /\bScreenkeyTerm\s*=\s*"([^"]*)"/i,
    )?.[1];
    const illustrationBasename = tag.match(
      /\bExFileName\s*=\s*"([^"]*)"/i,
    )?.[1];
    invariant(
      typeof screenkeyTerm === "string" &&
        screenkeyTerm.trim().length > 0 &&
        typeof illustrationBasename === "string" &&
        illustrationBasename.trim().length > 0,
      `${label}: malformed ScreenkeyTerm or ExFileName record`,
    );
    records.push({
      screenkeyTerm: screenkeyTerm.trim(),
      illustrationBasename: illustrationBasename.trim(),
    });
  }
  invariant(records.length > 0, `${label}: no glossary records found`);
  return records;
}

function normalizeTerm(value) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function extractLessonTermLinks(contents) {
  const text = contents.toString("utf8");
  return [...text.matchAll(
    /asfunction:DoHyperLinksTemp,([^\\'"<&]+?)(?=\\?['"]|&apos;|&quot;|<)/gi,
  )].map((match) => match[1].trim());
}

function descriptorSetSha256(descriptors) {
  return sha256Bytes(Buffer.from(stableJson(descriptors)));
}

function parseJsonLines(contents, label) {
  return contents.toString("utf8").split(/\r?\n/).filter(Boolean).map(
    (line, index) => {
      try {
        return JSON.parse(line);
      } catch (error) {
        throw new Error(
          `${label}: invalid JSONL row ${index + 1} (${error.message})`,
        );
      }
    },
  );
}

function validateSourceCatalog(document) {
  invariant(
    document?.schemaVersion === 1 &&
      document.fileCount === 7919 &&
      document.totalBytes === 2779928841 &&
      Array.isArray(document.files) &&
      document.files.length === document.fileCount &&
      SHA256.test(document.checksumSetSha256 || ""),
    "source catalog identity or completeness drifted",
  );
}

function validateLessonRelease(document, courseXmlRecord) {
  invariant(
    document?.schemaVersion === 1 && Array.isArray(document.releases),
    "lesson-release catalog identity drifted",
  );
  const releases = document.releases.filter(
    (entry) => entry.releaseId === RELEASE_ID,
  );
  invariant(releases.length === 1, "G5 L4 release identity drifted");
  const release = releases[0];
  invariant(
    release.releaseType === "complete-lesson" &&
      release.publicationMode === "atomic" &&
      release.grade === 5 &&
      release.lesson === 4 &&
      release.titleDisplay === "Number Lines" &&
      release.sourceLesson?.path === COURSE_XML_ARCHIVE_PATH &&
      release.sourceLesson.bytes === courseXmlRecord.bytes &&
      release.sourceLesson.sha256 === courseXmlRecord.sha256 &&
      release.expectedCounts?.activeXmlReferencedPages === 54 &&
      release.expectedCounts.courseShells === 1 &&
      release.expectedCounts.members === 55 &&
      Array.isArray(release.members) &&
      release.members.length === 55,
    "G5 L4 lesson-release scope drifted",
  );
  const activityMembers = release.members.filter(
    (member) => member.releaseRole === "active-xml-referenced-page",
  );
  const shellMembers = release.members.filter(
    (member) => member.releaseRole === "course-shell",
  );
  invariant(
    activityMembers.length === 54 &&
      shellMembers.length === 1 &&
      shellMembers[0].animationId === SHELL_ANIMATION_ID &&
      shellMembers[0].assetId === SHELL_ASSET_ID &&
      shellMembers[0].source?.path === SHELL_SWF_ARCHIVE_PATH,
    "G5 L4 activity/shell release membership drifted",
  );
  return {release, activityMembers, shellMember: shellMembers[0]};
}

function validateSourceGap(
  document,
  sourceCatalogRecord,
  courseXmlRecord,
) {
  invariant(
    document?.schemaVersion === 1 &&
      document.reportType === "lesson-release-source-gap-forensics" &&
      document.releaseId === RELEASE_ID &&
      document.evidenceState ===
        "static-source-forensics-only-runtime-and-content-gaps-fail-closed",
    "G5 L4 source-gap identity drifted",
  );
  invariant(
    document.inputs?.sourceCatalog?.bytes === sourceCatalogRecord.bytes &&
      document.inputs.sourceCatalog.sha256 === sourceCatalogRecord.sha256 &&
      document.inputs?.courseXml?.bytes === courseXmlRecord.bytes &&
      document.inputs.courseXml.sha256 === courseXmlRecord.sha256 &&
      document.inputs.courseXml.archivePath === COURSE_XML_ARCHIVE_PATH &&
      document.inputs.courseXml.physicalPath === PROJECT_INPUTS.courseXml,
    "source-gap source-catalog or course-XML binding drifted",
  );
  const declarations = document.keytermGap?.declarations;
  invariant(
    document.keytermGap?.status ===
      "declared-dependencies-missing-from-current-preserved-source-catalog-and-physical-source-root" &&
      Array.isArray(declarations) &&
      declarations.length === 2,
    "source-gap keyterm state drifted",
  );
  for (const target of TARGETS) {
    const matches = declarations.filter(
      (entry) =>
        entry.language === target.language &&
        path.basename(entry.path) === target.basename,
    );
    invariant(
      matches.length === 1 &&
        matches[0].physicalPresence === false &&
        Array.isArray(matches[0].exactCatalogMatches) &&
        matches[0].exactCatalogMatches.length === 0 &&
        Array.isArray(matches[0].basenameCatalogMatches) &&
        matches[0].basenameCatalogMatches.length === 0,
      `${target.basename}: source-gap evidence drifted`,
    );
  }
  invariant(
    Object.values(document.acceptanceEffects || {}).every(
      (value) => value === false,
    ),
    "source-gap report was promoted",
  );
  return declarations;
}

function validateMachineAudit(document, member, machineAuditRecord) {
  invariant(
    document?.schemaVersion === 1 &&
      document.animationId === member.animationId &&
      document.auditStatus === "partial" &&
      document.migrationStatus === "preserved" &&
      document.migrationStatusUnchanged === true,
    `${member.animationId}: machine-audit identity drifted`,
  );
  const expectedProjectPath =
    `${PRESERVED_SOURCE_ROOT}/${member.source.path}`;
  invariant(
    document.source?.path === expectedProjectPath &&
      document.source.expectedSha256 === member.source.sha256 &&
      document.source.observedSha256Before === member.source.sha256 &&
      document.source.observedSha256After === member.source.sha256 &&
      document.source.hashMatches === true &&
      document.source.bytesBefore === document.source.bytesAfter &&
      document.source.bytesAfter > 0 &&
      document.commands?.ffdecScripts?.status === "success" &&
      document.commands.ffdecScripts.exitCode === 0 &&
      document.commands.ffdecScripts.timedOut === false &&
      document.commands.ffdecScripts.evidence ===
        "audit/machine/ffdec-scripts.txt.gz",
    `${member.animationId}: machine-audit source or FFDec binding drifted`,
  );
  return {
    path: machineAuditRecord.path,
    bytes: machineAuditRecord.bytes,
    sha256: machineAuditRecord.sha256,
  };
}

function validateFfdecScriptInventory({
  document,
  member,
  inventoryRecord,
  machineAuditRecord,
  ffdecScriptsRecord,
  expandedBundle,
  lessonReleaseCatalogRecord,
}) {
  validateFingerprint(document, `${member.animationId}: script inventory`);
  invariant(
    document.schemaVersion === 1 &&
      document.artifactType ===
        "g5-l4-ffdec-script-inventory-candidate" &&
      document.releaseId === RELEASE_ID &&
      document.animationId === member.animationId &&
      document.assetId === member.assetId &&
      document.inputs?.lessonReleaseCatalog?.path ===
        lessonReleaseCatalogRecord.path &&
      document.inputs.lessonReleaseCatalog.bytes ===
        lessonReleaseCatalogRecord.bytes &&
      document.inputs.lessonReleaseCatalog.sha256 ===
        lessonReleaseCatalogRecord.sha256 &&
      document.inputs?.machineAudit?.path === machineAuditRecord.path &&
      document.inputs.machineAudit.bytes === machineAuditRecord.bytes &&
      document.inputs.machineAudit.sha256 === machineAuditRecord.sha256 &&
      document.inputs?.ffdecScripts?.path === ffdecScriptsRecord.path &&
      document.inputs.ffdecScripts.bytes === ffdecScriptsRecord.bytes &&
      document.inputs.ffdecScripts.sha256 === ffdecScriptsRecord.sha256 &&
      document.expandedBundle?.bytes === expandedBundle.bytes &&
      document.expandedBundle.sha256 === expandedBundle.sha256 &&
      Array.isArray(document.scripts) &&
      document.summary?.scriptCount === document.scripts.length &&
      Object.values(document.acceptanceEffects || {}).every(
        (value) => value === false,
      ),
    `${member.animationId}: FFDec script inventory binding drifted`,
  );
  return {
    path: inventoryRecord.path,
    bytes: inventoryRecord.bytes,
    sha256: inventoryRecord.sha256,
  };
}

function validateTechnicalCrosswalk(document, sourceCatalogRecord) {
  invariant(
    document?.schemaVersion === 1 &&
      Array.isArray(document.files) &&
      document.summary?.fileCount === 1455 &&
      document.files.length === document.summary.fileCount &&
      document.summary.families?.XML === 11 &&
      document.summary.sourceCatalog?.sha256 === sourceCatalogRecord.sha256,
    "historical technical-source crosswalk identity or completeness drifted",
  );
  const familyCounts = Object.fromEntries(
    Object.keys(document.summary.families).map((family) => [family, 0]),
  );
  for (const entry of document.files) {
    invariant(
      typeof entry.historicalPath === "string" &&
        entry.historicalPath.length > 0 &&
        Number.isInteger(entry.bytes) &&
        entry.bytes >= 0 &&
        SHA256.test(entry.sha256 || ""),
      "historical technical-source entry is malformed",
    );
    invariant(
      Object.hasOwn(familyCounts, entry.family),
      "historical technical-source family drifted",
    );
    familyCounts[entry.family] += 1;
  }
  invariant(
    JSON.stringify(familyCounts) ===
      JSON.stringify(document.summary.families),
    "historical technical-source family counts drifted",
  );
}

function safeReportBoundary(report) {
  const serialized = stableJson(report);
  for (const forbidden of [
    "/Volumes/",
    "historicalPath",
    "physicalPath",
    "Extracted_NewHelpProgram",
    "Historical Office Documents",
  ]) {
    invariant(
      !serialized.includes(forbidden),
      `public report leaked forbidden private path data: ${forbidden}`,
    );
  }
  invariant(
    !/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(serialized),
    "public report leaked an email-like identifier",
  );
}

async function buildLessonTermLinkAudit({
  projectRoot,
  sourceCatalog,
  lessonReleaseCatalogRecord,
  activityMembers,
  courseKeyterms,
  glossarySources,
}) {
  const scans = await Promise.all(activityMembers.map(async (member) => {
    const base = `migrations/${member.animationId}/audit/machine`;
    const [machineAudit, scriptInventory, ffdecScripts] = await Promise.all([
      readJsonRecord(
        projectRoot,
        `${base}/report.json`,
        `${member.animationId}: machine audit`,
      ),
      readJsonRecord(
        projectRoot,
        `${base}/g5-l4-pre-runtime-ffdec-script-inventory-candidate.json`,
        `${member.animationId}: FFDec script inventory`,
      ),
      readFileRecord(
        projectRoot,
        `${base}/ffdec-scripts.txt.gz`,
        `${member.animationId}: FFDec script bundle`,
      ),
    ]);
    const expandedBundle = gunzipRecord(
      ffdecScripts,
      `${member.animationId}: FFDec script bundle`,
    );
    const machineAuditBinding = validateMachineAudit(
      machineAudit.document,
      member,
      machineAudit,
    );
    const inventoryBinding = validateFfdecScriptInventory({
      document: scriptInventory.document,
      member,
      inventoryRecord: scriptInventory,
      machineAuditRecord: machineAudit,
      ffdecScriptsRecord: ffdecScripts,
      expandedBundle,
      lessonReleaseCatalogRecord,
    });
    invariant(
      machineAudit.document.findings?.exportedScriptFileCount ===
        scriptInventory.document.scripts.length,
      `${member.animationId}: machine and inventory script counts differ`,
    );
    const links = extractLessonTermLinks(expandedBundle.contents);
    return {
      animationId: member.animationId,
      source: {
        path: `${PRESERVED_SOURCE_ROOT}/${member.source.path}`,
        bytes: machineAudit.document.source.bytesAfter,
        sha256: member.source.sha256,
      },
      machineAudit: machineAuditBinding,
      ffdecScriptInventory: inventoryBinding,
      ffdecScripts: {
        path: ffdecScripts.path,
        bytes: ffdecScripts.bytes,
        sha256: ffdecScripts.sha256,
        expandedBytes: expandedBundle.bytes,
        expandedSha256: expandedBundle.sha256,
      },
      linkOccurrences: links.length,
      links,
    };
  }));

  const flatLinks = scans.flatMap(({animationId, links}) =>
    links.map((term) => ({animationId, term})));
  const uniqueTermKeys = [...new Set(flatLinks.map(({term}) =>
    normalizeTerm(term)))];
  invariant(
    scans.length === 54 &&
      flatLinks.length === 16 &&
      uniqueTermKeys.length === 7,
    "lesson FFDec term-link scan cardinality drifted",
  );

  const terms = [];
  for (const termKey of uniqueTermKeys) {
    const occurrences = flatLinks.filter(
      ({term}) => normalizeTerm(term) === termKey,
    );
    const glossaryMatches = glossarySources.map((source) => {
      const matches = source.records.filter(
        ({screenkeyTerm}) => normalizeTerm(screenkeyTerm) === termKey,
      );
      invariant(
        matches.length === 1,
        `${source.language} master glossary: ${termKey} match count drifted`,
      );
      return {source, match: matches[0]};
    });
    const illustrationBasenames = new Set(
      glossaryMatches.map(({match}) =>
        match.illustrationBasename.toLowerCase()),
    );
    invariant(
      illustrationBasenames.size === 1,
      `${termKey}: bilingual master-glossary illustration disagreement`,
    );
    const illustrationBasename = glossaryMatches[0].match.illustrationBasename;
    const expectedArchivePath =
      `${courseKeyterms.illustrationDirectory}/${illustrationBasename}`;
    const catalogMatches = sourceCatalog.files.filter(
      (entry) => entry.path.toLowerCase() ===
        expectedArchivePath.toLowerCase(),
    );
    invariant(
      catalogMatches.length <= 1,
      `${termKey}: ambiguous illustration source match`,
    );
    let illustrationSource = null;
    if (catalogMatches.length === 1) {
      const entry = catalogMatches[0];
      const record = await readFileRecord(
        projectRoot,
        `${PRESERVED_SOURCE_ROOT}/${entry.path}`,
        `${termKey}: glossary illustration`,
      );
      invariant(
        record.bytes === entry.bytes && record.sha256 === entry.sha256,
        `${termKey}: glossary illustration physical identity drifted`,
      );
      illustrationSource = {
        path: record.path,
        bytes: record.bytes,
        sha256: record.sha256,
      };
    }
    terms.push({
      term: glossaryMatches[0].match.screenkeyTerm,
      observedVariants: [...new Set(occurrences.map(({term}) => term))],
      occurrenceCount: occurrences.length,
      memberIds: [...new Set(occurrences.map(({animationId}) => animationId))],
      masterGlossaryMatches: Object.fromEntries(
        glossaryMatches.map(({source, match}) => [source.language, {
          matchCount: 1,
          screenkeyTerm: match.screenkeyTerm,
          illustrationBasename: match.illustrationBasename,
        }]),
      ),
      illustration: {
        declaredBasename: illustrationBasename,
        expectedArchivePath,
        currentSourceCatalogMatchCount: catalogMatches.length,
        physicalPresence: illustrationSource !== null,
        source: illustrationSource,
      },
    });
  }

  const presentTerms = terms.filter(
    ({illustration}) => illustration.physicalPresence,
  );
  const presentOccurrences = presentTerms.reduce(
    (sum, {occurrenceCount}) => sum + occurrenceCount,
    0,
  );
  invariant(
    presentTerms.length === 2 &&
      presentOccurrences === 6 &&
      terms.length - presentTerms.length === 5 &&
      flatLinks.length - presentOccurrences === 10,
    "lesson glossary illustration availability drifted",
  );

  const scannedMemberBindings = scans.map(({links: ignored, ...scan}) => scan);
  return {
    evidenceClass:
      "hash-bound-static-ffdec-lesson-link-and-master-glossary-corroboration-only",
    authority:
      "The scan proves only literal link targets in hash-bound FFDec exports, exact records in both preserved grade-wide glossary XML files, and present or absent referenced SWF illustration bytes. It does not prove runtime reachability, successful XML loading, link causality, language behavior, visual fidelity, or an authorized substitution for the missing lesson-local XML files.",
    scope: {
      releaseActivityMembers: activityMembers.length,
      ffdecScriptBundlesScanned: scans.length,
      scannedMemberBindingSetSha256:
        descriptorSetSha256(scannedMemberBindings),
      linkedMemberCount: scans.filter(({links}) => links.length > 0).length,
      linkOccurrenceCount: flatLinks.length,
      uniqueLinkedTermCount: terms.length,
    },
    masterGlossaries: Object.fromEntries(glossarySources.map((source) => [
      source.language,
      {
        path: source.record.path,
        bytes: source.record.bytes,
        sha256: source.record.sha256,
        parsedRecordCount: source.records.length,
      },
    ])),
    scannedMemberBindings,
    linkedMemberSources: scans.filter(({links}) => links.length > 0).map(
      ({links: ignored, ...scan}) => scan,
    ),
    terms,
    summary: {
      allLinksResolveInEnglishMasterGlossary: true,
      allLinksResolveInSpanishMasterGlossary: true,
      uniqueIllustrationsDeclared: terms.length,
      uniqueIllustrationsPhysicallyPresent: presentTerms.length,
      uniqueIllustrationsMissing: terms.length - presentTerms.length,
      linkOccurrencesWithIllustrationPresent: presentOccurrences,
      linkOccurrencesWithIllustrationMissing:
        flatLinks.length - presentOccurrences,
      allIllustrationsPhysicallyPresent: false,
      targetXmlRecovered: false,
      substitutionAuthorized: false,
      authoritativeOriginalRuntime: false,
      runtimeLoadSuccessProven: false,
      linkCausalityProven: false,
    },
  };
}

export async function buildG5L4MissingKeytermRecoveryReadiness({
  projectRoot: projectRootOption = defaultProjectRoot,
  privateArchiveRoot: privateArchiveRootOption = PRIVATE_ARCHIVE_ROOT,
  sqlAggregatePath: sqlAggregatePathOption = SQL_AGGREGATE_PATH,
} = {}) {
  const projectRoot = path.resolve(projectRootOption);
  const records = {
    generator: await readFileRecord(projectRoot, GENERATOR_PATH, "generator"),
    sourceCatalog: await readJsonRecord(
      projectRoot,
      PROJECT_INPUTS.sourceCatalog,
      "source catalog",
    ),
    lessonReleaseCatalog: await readJsonRecord(
      projectRoot,
      PROJECT_INPUTS.lessonReleaseCatalog,
      "lesson-release catalog",
    ),
    sourceGap: await readJsonRecord(
      projectRoot,
      PROJECT_INPUTS.sourceGap,
      "G5 L4 source-gap report",
    ),
    courseXml: await readFileRecord(
      projectRoot,
      PROJECT_INPUTS.courseXml,
      "G5 L4 course XML",
    ),
    shellSwf: await readFileRecord(
      projectRoot,
      PROJECT_INPUTS.shellSwf,
      "G5 L4 shipped shell SWF",
    ),
    shellMachineAudit: await readJsonRecord(
      projectRoot,
      PROJECT_INPUTS.shellMachineAudit,
      "G5 L4 shell machine audit",
    ),
    shellFfdecScripts: await readFileRecord(
      projectRoot,
      PROJECT_INPUTS.shellFfdecScripts,
      "G5 L4 shell FFDec script bundle",
    ),
    shellFfdecScriptInventory: await readJsonRecord(
      projectRoot,
      PROJECT_INPUTS.shellFfdecScriptInventory,
      "G5 L4 shell FFDec script inventory",
    ),
    masterGlossaryEnglish: await readFileRecord(
      projectRoot,
      PROJECT_INPUTS.masterGlossaryEnglish,
      "preserved English master glossary",
    ),
    masterGlossarySpanish: await readFileRecord(
      projectRoot,
      PROJECT_INPUTS.masterGlossarySpanish,
      "preserved Spanish master glossary",
    ),
    authorizedCombinedReferenceEnglish: await readFileRecord(
      projectRoot,
      PROJECT_INPUTS.authorizedCombinedReferenceEnglish,
      "authorized combined English KeyTerm reference",
    ),
    authorizedCombinedReferenceSpanish: await readFileRecord(
      projectRoot,
      PROJECT_INPUTS.authorizedCombinedReferenceSpanish,
      "authorized combined Spanish KeyTerm reference",
    ),
    authorizedCombinedReferenceIntakeReceipt: await readJsonRecord(
      projectRoot,
      PROJECT_INPUTS.authorizedCombinedReferenceIntakeReceipt,
      "authorized combined KeyTerm reference intake receipt",
    ),
    technicalCrosswalk: await readJsonRecord(
      projectRoot,
      PROJECT_INPUTS.technicalCrosswalk,
      "historical technical-source crosswalk",
    ),
    historicalFileCatalog: await readFileRecord(
      projectRoot,
      PROJECT_INPUTS.historicalFileCatalog,
      "historical file authority catalog",
    ),
    sqlCatalog: await readFileRecord(
      projectRoot,
      PROJECT_INPUTS.sqlCatalog,
      "privacy-safe SQL catalog",
    ),
    sqlFileCatalog: await readFileRecord(
      projectRoot,
      PROJECT_INPUTS.sqlFileCatalog,
      "privacy-safe SQL file catalog",
    ),
    sqlTableCatalog: await readFileRecord(
      projectRoot,
      PROJECT_INPUTS.sqlTableCatalog,
      "privacy-safe SQL table catalog",
    ),
  };
  records.sqlAggregate = await readAbsoluteFileRecord(
    path.resolve(sqlAggregatePathOption),
    path.dirname(path.resolve(sqlAggregatePathOption)),
    "privacy-safe SQL aggregate",
  );

  validateSourceCatalog(records.sourceCatalog.document);
  catalogSourceEntry(
    records.sourceCatalog.document,
    COURSE_XML_ARCHIVE_PATH,
    records.courseXml,
    "G5 L4 course XML",
  );
  catalogSourceEntry(
    records.sourceCatalog.document,
    SHELL_SWF_ARCHIVE_PATH,
    records.shellSwf,
    "G5 L4 shipped shell SWF",
  );
  const courseKeyterms = parseCourseKeytermDeclarations(
    records.courseXml.contents,
  );
  const {activityMembers, shellMember} = validateLessonRelease(
    records.lessonReleaseCatalog.document,
    records.courseXml,
  );
  const declarations = validateSourceGap(
    records.sourceGap.document,
    records.sourceCatalog,
    records.courseXml,
  );
  validateTechnicalCrosswalk(
    records.technicalCrosswalk.document,
    records.sourceCatalog,
  );

  const shellExpandedBundle = gunzipRecord(
    records.shellFfdecScripts,
    "G5 L4 shell FFDec script bundle",
  );
  validateMachineAudit(
    records.shellMachineAudit.document,
    shellMember,
    records.shellMachineAudit,
  );
  validateFfdecScriptInventory({
    document: records.shellFfdecScriptInventory.document,
    member: shellMember,
    inventoryRecord: records.shellFfdecScriptInventory,
    machineAuditRecord: records.shellMachineAudit,
    ffdecScriptsRecord: records.shellFfdecScripts,
    expandedBundle: shellExpandedBundle,
    lessonReleaseCatalogRecord: records.lessonReleaseCatalog,
  });
  invariant(
    records.shellMachineAudit.document.findings?.exportedScriptFileCount ===
      records.shellFfdecScriptInventory.document.scripts.length,
    "G5 L4 shell machine and inventory script counts differ",
  );
  const shellStaticXmlTargets = [...shellExpandedBundle.contents
    .toString("utf8")
    .matchAll(/XML\/([A-Za-z0-9_.-]+\.xml)/gi)]
    .map((match) => match[1]);
  const shellTargetReferences = Object.fromEntries(TARGETS.map((target) => [
    target.basename,
    countToken(shellExpandedBundle.contents, target.basename),
  ]));
  const shellMasterGlossaryReferences = Object.fromEntries(
    MASTER_GLOSSARY_SOURCES.map((source) => [
      source.basename,
      countToken(shellExpandedBundle.contents, source.basename),
    ]),
  );
  invariant(
    shellStaticXmlTargets.length === 3 &&
      shellMasterGlossaryReferences["ELKTEG4.xml"] === 2 &&
      shellMasterGlossaryReferences["ELKTSG4.xml"] === 1 &&
      Object.values(shellTargetReferences).every((count) => count === 0) &&
      countToken(
        shellExpandedBundle.contents,
        "F_X.load(_loc2_.KeyTermVar)",
      ) === 2,
    "G5 L4 shipped-shell static KeyTerm routing drifted",
  );

  const glossarySources = MASTER_GLOSSARY_SOURCES.map((source, index) => {
    const record = index === 0
      ? records.masterGlossaryEnglish
      : records.masterGlossarySpanish;
    catalogSourceEntry(
      records.sourceCatalog.document,
      source.archivePath,
      record,
      `${source.language} master glossary`,
    );
    const parsedRecords = parseMasterGlossary(
      record.contents,
      `${source.language} master glossary`,
    );
    invariant(
      parsedRecords.length === source.recordCount,
      `${source.language} master glossary record count drifted`,
    );
    return {...source, record, records: parsedRecords};
  });
  const lessonTermLinkAudit = await buildLessonTermLinkAudit({
    projectRoot,
    sourceCatalog: records.sourceCatalog.document,
    lessonReleaseCatalogRecord: records.lessonReleaseCatalog,
    activityMembers,
    courseKeyterms,
    glossarySources,
  });
  const intakeReceipt =
    records.authorizedCombinedReferenceIntakeReceipt.document;
  const receiptDirection = intakeReceipt.custody?.contentManagerDirection;
  invariant(
    intakeReceipt.schemaVersion === 1 &&
      intakeReceipt.receiptType ===
        "owner-directed-combined-elementary-keyterms-intake" &&
      intakeReceipt.recordedDate === "2026-07-30" &&
      intakeReceipt.custody?.destinationDirectory ===
        "source-assets/flash/intake/2026-07-30-venky-combined-keyterms/ELM" &&
      intakeReceipt.custody.copyPolicy ===
        "exact-bytes-read-only-no-canonical-overwrite" &&
      receiptDirection?.evidenceClass ===
        COMBINED_REFERENCE_DIRECTION.evidenceClass &&
      receiptDirection.contentManager ===
        COMBINED_REFERENCE_DIRECTION.contentManager &&
      receiptDirection.relayedByOwner ===
        COMBINED_REFERENCE_DIRECTION.relayedByOwner &&
      receiptDirection.messageHeadersVerified === false &&
      receiptDirection.scope === COMBINED_REFERENCE_DIRECTION.scope &&
      typeof receiptDirection.message === "string" &&
      receiptDirection.message.includes(
        "please use that file for the key term reference",
      ) &&
      Array.isArray(intakeReceipt.files) &&
      intakeReceipt.files.length === 2 &&
      intakeReceipt.selection?.referenceUseAuthorized === true &&
      intakeReceipt.selection.canonical2008MasterSelectedForClient === true &&
      intakeReceipt.selection.ownerIntake2015SelectedForClient === false &&
      intakeReceipt.selection.ownerIntake2015FullImportBlocked === true &&
      intakeReceipt.selection.ownerIntake2015FullImportBlocker ===
        "malformed-source-record" &&
      Object.values(intakeReceipt.authority || {}).every(
        (value) => value === false,
      ),
    "authorized combined reference intake receipt drifted",
  );
  const combinedReferenceSources = AUTHORIZED_COMBINED_REFERENCE_SOURCES.map(
    (source, index) => {
      const record = index === 0
        ? records.authorizedCombinedReferenceEnglish
        : records.authorizedCombinedReferenceSpanish;
      invariant(
        record.path === source.path &&
          record.bytes === source.bytes &&
          record.sha256 === source.sha256,
        `${source.language} authorized combined reference identity drifted`,
      );
      const parsedRecords = parseMasterGlossary(
        record.contents,
        `${source.language} authorized combined reference`,
      );
      invariant(
        parsedRecords.length === source.recordCount,
        `${source.language} authorized combined reference record count drifted`,
      );
      const receiptFile = intakeReceipt.files[index];
      invariant(
        receiptFile.language === (source.language === "english" ? "en" : "es") &&
          receiptFile.filename === source.basename &&
          path.basename(receiptFile.sourcePath) === source.basename &&
          receiptFile.destinationPath === source.path &&
          receiptFile.bytes === source.bytes &&
          receiptFile.sha256 === source.sha256 &&
          receiptFile.logicalRecordCount === source.recordCount &&
          receiptFile.malformedDefinitionSeparatorRecordCount ===
            source.knownUnrelatedMalformedRecordCount &&
          receiptFile.destinationMode === "0444" &&
          receiptFile.exactByteCopyVerified === true,
        `${source.language} authorized combined reference receipt file drifted`,
      );
      const linkedTermExactMatchCount = lessonTermLinkAudit.terms.filter(
        ({term}) => parsedRecords.filter(
          ({screenkeyTerm}) =>
            normalizeTerm(screenkeyTerm) === normalizeTerm(term),
        ).length === 1,
      ).length;
      invariant(
        linkedTermExactMatchCount ===
          lessonTermLinkAudit.scope.uniqueLinkedTermCount,
        `${source.language} authorized combined reference linked-term coverage drifted`,
      );
      return {
        ...source,
        record,
        parsedRecords,
        linkedTermExactMatchCount,
      };
    },
  );
  invariant(
    combinedReferenceSources.reduce(
      (sum, source) => sum + source.knownUnrelatedMalformedRecordCount,
      0,
    ) === 1,
    "authorized combined reference malformed-record boundary drifted",
  );

  const authorityRows = parseJsonLines(
    records.historicalFileCatalog.contents,
    "historical file authority catalog",
  );
  invariant(
    authorityRows.length === 3713,
    "historical file authority catalog completeness drifted",
  );

  const crosswalkFiles = records.technicalCrosswalk.document.files;
  const leadEntries = crosswalkFiles.filter(
    (entry) =>
      normalizedBasename(entry.historicalPath) === "l1kte01xml" &&
      entry.family === "XML",
  );
  invariant(
    leadEntries.length === 1,
    "different-basename master-glossary lead identity drifted",
  );
  const lead = leadEntries[0];
  invariant(
    lead.archivePresence === "present" &&
      lead.sourceAssetsExactMatchCount === 0 &&
      lead.matchStatus === "no-exact-source-assets-match",
    "master-glossary lead source-match boundary drifted",
  );
  const authorityMatches = authorityRows.filter(
    (entry) => entry.sha256 === lead.sha256,
  );
  invariant(
    authorityMatches.length === 1 &&
      authorityMatches[0].archivePresence === "present" &&
      authorityMatches[0].authority === "technical-source-file" &&
      authorityMatches[0].authorityConfidence === "high",
    "master-glossary lead authority drifted",
  );

  const archiveRoot = path.resolve(privateArchiveRootOption);
  const leadAbsolutePath = path.resolve(archiveRoot, lead.historicalPath);
  invariant(
    isWithin(archiveRoot, leadAbsolutePath),
    "master-glossary lead escapes the read-only archive",
  );
  const leadRecord = await readAbsoluteFileRecord(
    leadAbsolutePath,
    archiveRoot,
    "different-basename master-glossary lead",
  );
  invariant(
    leadRecord.bytes === lead.bytes &&
      leadRecord.sha256 === lead.sha256,
    "master-glossary lead physical identity drifted",
  );
  const leadText = leadRecord.contents.toString("utf8");
  const keyTermRecordCount = (leadText.match(/<KeyTerm\b/g) || []).length;
  invariant(
    keyTermRecordCount === 659,
    "master-glossary lead KeyTerm record count drifted",
  );
  const targetNameReferences = TARGETS.reduce(
    (sum, target) => sum + countToken(leadRecord.contents, target.basename),
    0,
  );
  invariant(
    targetNameReferences === 0,
    "master-glossary lead unexpectedly claims an exact target identity",
  );

  const sqlCatalogRecords = [
    records.sqlCatalog,
    records.sqlFileCatalog,
    records.sqlTableCatalog,
  ];
  const targetFindings = TARGETS.map((target) => {
    const sourceMatches = records.sourceCatalog.document.files.filter(
      (entry) =>
        path.basename(entry.path).toLowerCase() ===
          target.basename.toLowerCase(),
    );
    const historicalExactMatches = crosswalkFiles.filter(
      (entry) =>
        path.basename(entry.historicalPath).toLowerCase() ===
          target.basename.toLowerCase(),
    );
    const historicalNormalizedMatches = crosswalkFiles.filter(
      (entry) =>
        normalizedBasename(entry.historicalPath) ===
          normalizedBasename(target.basename),
    );
    const declaration = declarations.find(
      (entry) =>
        entry.language === target.language &&
        path.basename(entry.path) === target.basename,
    );
    const sqlCatalogReferenceCount = sqlCatalogRecords.reduce(
      (sum, record) => sum + countToken(record.contents, target.basename),
      0,
    );
    const sqlAggregateReferenceCount = countToken(
      records.sqlAggregate.contents,
      target.basename,
    );
    invariant(
      sourceMatches.length === 0 &&
        historicalExactMatches.length === 0 &&
        historicalNormalizedMatches.length === 0 &&
        declaration.exactCatalogMatches.length === 0 &&
        declaration.basenameCatalogMatches.length === 0 &&
        declaration.physicalPresence === false &&
        sqlCatalogReferenceCount === 0 &&
        sqlAggregateReferenceCount === 0,
      `${target.basename}: an exact or alias candidate appeared`,
    );
    return {
      language: target.language,
      basename: target.basename,
      currentSourceCatalogExactBasenameCount: sourceMatches.length,
      sourceGapExactCatalogMatchCount:
        declaration.exactCatalogMatches.length,
      sourceGapBasenameMatchCount:
        declaration.basenameCatalogMatches.length,
      currentPreservedPhysicalPresence: false,
      historicalTechnicalCrosswalkExactBasenameCount:
        historicalExactMatches.length,
      historicalTechnicalCrosswalkNormalizedAliasCount:
        historicalNormalizedMatches.length,
      sqlPrivacySafeCatalogReferenceCount: sqlCatalogReferenceCount,
      sqlPrivacySafeAggregateReferenceCount:
        sqlAggregateReferenceCount,
      exactCandidateCount: 0,
      exactCandidateSha256: [],
      contentRecovered: false,
      importAuthorized: false,
      reviewedExceptionEstablished: false,
    };
  });
  const authorizedCombinedReferencePublicSources = Object.fromEntries(
    combinedReferenceSources.map((source, index) => {
      const preservedMaster = glossarySources[index];
      invariant(
        source.record.sha256 !== preservedMaster.record.sha256,
        `${source.language} authorized combined reference unexpectedly became byte-identical to the preserved master`,
      );
      return [source.language, {
        basename: source.basename,
        path: source.record.path,
        bytes: source.record.bytes,
        sha256: source.record.sha256,
        parsedRecordCount: source.parsedRecords.length,
        knownUnrelatedMalformedRecordCount:
          source.knownUnrelatedMalformedRecordCount,
        linkedG5L4TermExactMatchCount: source.linkedTermExactMatchCount,
        byteIdenticalToCurrentPreservedMaster: false,
        currentPreservedSourceCatalogMember: false,
      }];
    }),
  );
  const authorizedCombinedReferenceSourceSetSha256 = descriptorSetSha256(
    Object.values(authorizedCombinedReferencePublicSources),
  );

  const report = {
    schemaVersion: 1,
    reportType: "g5-l4-missing-keyterm-recovery-readiness",
    releaseId: RELEASE_ID,
    evidenceState:
      "hash-bound-public-safe-recovery-search-complete-no-exact-candidate",
    authority:
      "This deterministic report exposes only public-safe source identifiers, hashes, counts, and acceptance-neutral conclusions. It reads but does not copy or modify preserved sources or the separately hash-bound 2015 combined-reference intake. It distinguishes the missing lesson-local XML declarations from shipped-shell static FFDec routing and from the Owner-relayed content-manager authorization to use the combined elementary files as a product reference. That reference authorization is not lesson-local source recovery, substitution authority, a verified runtime byte variant, runtime reachability, successful loading, fidelity acceptance, strict completion, or publication. It discloses no historical archive raw path or personal data.",
    generator: {
      path: GENERATOR_PATH,
      bytes: records.generator.bytes,
      sha256: records.generator.sha256,
    },
    identity: {
      grade: 5,
      lesson: 4,
      titleDisplay: "Number Lines",
      expectedReleaseMembers: 55,
      publicationMode: "atomic",
    },
    sourceBindings: {
      currentSourceCatalog: publicDescriptor(
        records.sourceCatalog,
        "current-preserved-source-catalog",
        {
          schemaVersion: records.sourceCatalog.document.schemaVersion,
          fileCount: records.sourceCatalog.document.fileCount,
          totalBytes: records.sourceCatalog.document.totalBytes,
          checksumSetSha256:
            records.sourceCatalog.document.checksumSetSha256,
        },
      ),
      lessonReleaseCatalog: publicDescriptor(
        records.lessonReleaseCatalog,
        "lesson-release-catalog",
        {
          path: records.lessonReleaseCatalog.path,
          schemaVersion: records.lessonReleaseCatalog.document.schemaVersion,
        },
      ),
      g5L4SourceGap: publicDescriptor(
        records.sourceGap,
        "g5-l4-source-gap-forensics",
        {
          schemaVersion: records.sourceGap.document.schemaVersion,
          reportType: records.sourceGap.document.reportType,
        },
      ),
      courseXmlDeclarationSource: publicDescriptor(
        records.courseXml,
        "g5-l4-preserved-course-xml",
        {path: records.courseXml.path},
      ),
      shippedShellSwf: publicDescriptor(
        records.shellSwf,
        "g5-l4-shipped-shell-swf",
        {path: records.shellSwf.path},
      ),
      shippedShellMachineAudit: publicDescriptor(
        records.shellMachineAudit,
        "g5-l4-shipped-shell-machine-audit",
        {
          path: records.shellMachineAudit.path,
          schemaVersion: records.shellMachineAudit.document.schemaVersion,
        },
      ),
      shippedShellFfdecScripts: publicDescriptor(
        records.shellFfdecScripts,
        "g5-l4-shipped-shell-ffdec-scripts",
        {
          path: records.shellFfdecScripts.path,
          expandedBytes: shellExpandedBundle.bytes,
          expandedSha256: shellExpandedBundle.sha256,
        },
      ),
      shippedShellFfdecScriptInventory: publicDescriptor(
        records.shellFfdecScriptInventory,
        "g5-l4-shipped-shell-ffdec-script-inventory",
        {
          path: records.shellFfdecScriptInventory.path,
          schemaVersion:
            records.shellFfdecScriptInventory.document.schemaVersion,
        },
      ),
      englishGradeWideMasterGlossary: publicDescriptor(
        records.masterGlossaryEnglish,
        "elementary-grade-wide-master-glossary-english",
        {path: records.masterGlossaryEnglish.path},
      ),
      spanishGradeWideMasterGlossary: publicDescriptor(
        records.masterGlossarySpanish,
        "elementary-grade-wide-master-glossary-spanish",
        {path: records.masterGlossarySpanish.path},
      ),
      authorizedCombinedReferenceEnglish2015: publicDescriptor(
        records.authorizedCombinedReferenceEnglish,
        "content-manager-authorized-combined-elementary-keyterms-reference-english-2015",
        {
          path: records.authorizedCombinedReferenceEnglish.path,
          recordCount: AUTHORIZED_COMBINED_REFERENCE_SOURCES[0].recordCount,
          knownUnrelatedMalformedRecordCount:
            AUTHORIZED_COMBINED_REFERENCE_SOURCES[0]
              .knownUnrelatedMalformedRecordCount,
        },
      ),
      authorizedCombinedReferenceSpanish2015: publicDescriptor(
        records.authorizedCombinedReferenceSpanish,
        "content-manager-authorized-combined-elementary-keyterms-reference-spanish-2015",
        {
          path: records.authorizedCombinedReferenceSpanish.path,
          recordCount: AUTHORIZED_COMBINED_REFERENCE_SOURCES[1].recordCount,
          knownUnrelatedMalformedRecordCount:
            AUTHORIZED_COMBINED_REFERENCE_SOURCES[1]
              .knownUnrelatedMalformedRecordCount,
        },
      ),
      authorizedCombinedReferenceIntakeReceipt: publicDescriptor(
        records.authorizedCombinedReferenceIntakeReceipt,
        "owner-directed-combined-elementary-keyterms-intake-receipt",
        {
          path: records.authorizedCombinedReferenceIntakeReceipt.path,
          schemaVersion: intakeReceipt.schemaVersion,
          receiptType: intakeReceipt.receiptType,
        },
      ),
      historicalTechnicalCrosswalk: publicDescriptor(
        records.technicalCrosswalk,
        "historical-office-technical-source-crosswalk-2026-07-25",
        {
          schemaVersion:
            records.technicalCrosswalk.document.schemaVersion,
          fileCount:
            records.technicalCrosswalk.document.summary.fileCount,
          xmlFileCount:
            records.technicalCrosswalk.document.summary.families.XML,
          completeCatalogBound: true,
        },
      ),
      historicalAuthorityCatalog: publicDescriptor(
        records.historicalFileCatalog,
        "historical-office-file-authority-catalog-2026-07-25",
        {fileCount: authorityRows.length},
      ),
      sqlPrivacySafeCatalog: publicDescriptor(
        records.sqlCatalog,
        "newhelpprogram-20210203-privacy-safe-catalog",
      ),
      sqlPrivacySafeFileCatalog: publicDescriptor(
        records.sqlFileCatalog,
        "newhelpprogram-20210203-privacy-safe-file-catalog",
      ),
      sqlPrivacySafeTableCatalog: publicDescriptor(
        records.sqlTableCatalog,
        "newhelpprogram-20210203-privacy-safe-table-catalog",
      ),
      sqlPrivacySafeAggregate: publicDescriptor(
        records.sqlAggregate,
        "newhelpprogram-20210203-privacy-safe-aggregate-analysis",
      ),
    },
    declaredVsShippedShellStaticDependency: {
      evidenceClass:
        "preserved-course-xml-declaration-versus-hash-bound-shipped-shell-static-ffdec-code",
      courseXmlDeclarations: {
        sourcePath: records.courseXml.path,
        sourceBytes: records.courseXml.bytes,
        sourceSha256: records.courseXml.sha256,
        declarations: courseKeyterms.declarations,
        illustrationDirectory: courseKeyterms.illustrationDirectory,
        declaredTargetCount: courseKeyterms.declarations.length,
        bothDeclaredTargetsPhysicallyMissing: true,
      },
      shippedShellStaticRouting: {
        animationId: SHELL_ANIMATION_ID,
        assetId: SHELL_ASSET_ID,
        shellSourcePath: records.shellSwf.path,
        shellSourceBytes: records.shellSwf.bytes,
        shellSourceSha256: records.shellSwf.sha256,
        machineAuditPath: records.shellMachineAudit.path,
        machineAuditBytes: records.shellMachineAudit.bytes,
        machineAuditSha256: records.shellMachineAudit.sha256,
        ffdecScriptsPath: records.shellFfdecScripts.path,
        ffdecScriptsBytes: records.shellFfdecScripts.bytes,
        ffdecScriptsSha256: records.shellFfdecScripts.sha256,
        expandedScriptBytes: shellExpandedBundle.bytes,
        expandedScriptSha256: shellExpandedBundle.sha256,
        staticXmlTargetOccurrences: shellStaticXmlTargets,
        masterGlossaryReferenceCounts: shellMasterGlossaryReferences,
        missingLessonLocalTargetReferenceCounts: shellTargetReferences,
        xmlLoadViaKeyTermVarCallCount: 2,
        staticDirectReferenceToMissingLessonLocalTargets: false,
        staticGradeWideMasterGlossaryRoutingPresent: true,
        runtimeReachabilityProven: false,
        runtimeLoadSuccessProven: false,
        originalRuntimeAuthority: false,
      },
      disposition:
        "The preserved course XML still creates a two-file declared source gap. Separately, the shipped shell's hash-bound FFDec code contains no literal reference to either missing lesson-local basename and instead assigns ELKTEG4.xml or ELKTSG4.xml before generic XML.load(KeyTermVar) calls. This narrows the shipped-shell static dependency finding but cannot prove that the declarations are stale, that either grade-wide XML loads successfully at runtime, or that the source gap or any fidelity gate is closed.",
      declaredSourceGapStillOpen: true,
      shippedShellStaticDirectTargetDependencyPresent: false,
      sourceGapClosed: false,
      substitutionAuthorized: false,
    },
    lessonTermLinkAudit,
    authorizedCombinedElementaryKeytermsReference: {
      evidenceClass:
        "owner-relayed-content-manager-authorized-combined-elementary-reference",
      direction: {
        ...COMBINED_REFERENCE_DIRECTION,
        direction:
          "Use the combined elementary KeyTerm files as the G5 L4 product key-term reference.",
        referenceUseAuthorized: true,
      },
      intakeVariant: {
        sourceYear: 2015,
        sourceClass:
          "owner-intake-combined-elementary-keyterms-reference-variant",
        sourceSetSha256: authorizedCombinedReferenceSourceSetSha256,
        sources: authorizedCombinedReferencePublicSources,
        sourceCount: combinedReferenceSources.length,
        parsedRecordCount:
          combinedReferenceSources.reduce(
            (sum, source) => sum + source.parsedRecords.length,
            0,
          ),
        knownUnrelatedMalformedRecordCount:
          combinedReferenceSources.reduce(
            (sum, source) =>
              sum + source.knownUnrelatedMalformedRecordCount,
            0,
          ),
      },
      clientSelection: {
        canonical2008MasterSelected: true,
        ownerIntake2015Selected: false,
        ownerIntake2015FullImportBlocked: true,
        ownerIntake2015FullImportBlocker: "malformed-source-record",
      },
      linkedG5L4TermCoverage: {
        uniqueLinkedTermCount:
          lessonTermLinkAudit.scope.uniqueLinkedTermCount,
        englishExactMatchCount:
          combinedReferenceSources[0].linkedTermExactMatchCount,
        spanishExactMatchCount:
          combinedReferenceSources[1].linkedTermExactMatchCount,
        allLinkedTermsResolveExactlyOnce: true,
        knownMalformedRecordAffectsLinkedG5L4Terms: false,
      },
      disposition: {
        referenceUseAuthorized: true,
        exactTargetCandidates: 0,
        recoveredTargets: 0,
        missingLessonSourcesRecovered: false,
        sourceGapClosed: false,
        substitutionAuthorized: false,
        runtimeByteVariantVerified: false,
        runtimeLoadSuccessProven: false,
        authoritativeOriginalRuntime: false,
        fidelityAccepted: false,
        strictComplete: false,
        published: false,
      },
      boundary:
        "The Owner-relayed content-manager direction authorizes these exact 2015 combined elementary files as a product reference only. Their different basenames and bytes do not recover L4KTE01.xml or L4KTS01.xml, authorize renaming or lesson-specific substitution, establish a runtime byte variant, or change any fidelity, strict-completion, or publication gate.",
    },
    targets: targetFindings,
    differentBasenameMasterGlossaryLead: {
      leadCount: 1,
      leadClass: "different-basename-master-glossary-lead",
      sha256: leadRecord.sha256,
      bytes: leadRecord.bytes,
      physicalPresence: true,
      authority: "technical-source-file",
      authorityConfidence: "high",
      keyTermRecordCount,
      exactTargetBasenameReferenceCount: targetNameReferences,
      sourceAssetsExactMatchCount: 0,
      migrationWorkspaceMatchCount: 0,
      exactTargetCandidate: false,
      substitutionAuthorized: false,
      importAuthorized: false,
      interpretation:
        "A content-structure lead only. Its different basename and lack of an exact current-source match prohibit renaming, substitution, or target recovery claims.",
    },
    recoveryGate: {
      state:
        "closed-no-exact-hash-bound-target-candidate-and-no-reviewed-exception",
      exactTargetCandidates: 0,
      recoveredTargets: 0,
      requiredTargets: 2,
      sourceGapClosed: false,
      importAuthorized: false,
      substitutionAuthorized: false,
      implementationAuthorized: false,
      reviewedExceptionEstablished: false,
    },
    nextSteps: [
      "Use the exact hash-bound 2015 combined English and Spanish intake only as the content-manager-authorized product KeyTerm reference; do not rename it or represent it as either missing lesson-local source or as a runtime-verified byte variant.",
      "Ask the owner or designated source custodian to search original KeyTerm build outputs or deployment backups for the two exact target basenames.",
      "For any recovered file, record physical custody, bytes, and SHA-256 before comparing schema or content; do not overwrite preserved sources.",
      "Use an authorized original-runtime trace to determine whether the shipped shell actually reaches and successfully loads the grade-wide ELKTEG4.xml or ELKTSG4.xml routes; static FFDec code cannot make that decision.",
      "Treat the seven hash-bound lesson link terms and the two present versus five missing referenced illustration SWFs as static planning evidence only, not as permission to substitute either missing lesson-local XML file.",
      "Use the different-basename master-glossary lead only to guide format and provenance questions; never rename or substitute it for either target.",
      "If recovery is exhausted, record a validator-supported reviewed exception without inventing English or Spanish content.",
    ],
    strictCompletion: {
      completeMembers: 0,
      expectedMembers: 55,
      fraction: "0/55",
      complete: false,
    },
    publication: {
      published: false,
      publicationCount: 0,
      atomicReleaseEligible: false,
    },
    acceptanceEffects: {
      authoritativeOriginalRuntime: false,
      audioAccepted: false,
      behaviorAccepted: false,
      humanReviewAccepted: false,
      implementationAuthorized: false,
      ownerFidelityAccepted: false,
      published: false,
      recoveryAccepted: false,
      sourceGapClosed: false,
      strictComplete: false,
    },
    strictAcceptanceEffect:
      "none; the authorized combined-reference intake remains distinct from both missing lesson-local KeyTerm targets, and the hash-bound search still records zero exact candidates and zero recovered targets without import, substitution, implementation, fidelity, strict-completion, or publication authority",
  };

  report.reportFingerprintSha256 = sha256Bytes(
    Buffer.from(stableJson(report)),
  );
  validateG5L4MissingKeytermRecoveryReadiness(report);
  safeReportBoundary(report);
  return report;
}

export function validateG5L4MissingKeytermRecoveryReadiness(report) {
  invariant(
    report?.schemaVersion === 1 &&
      report.reportType ===
        "g5-l4-missing-keyterm-recovery-readiness" &&
      report.releaseId === RELEASE_ID &&
      report.evidenceState ===
        "hash-bound-public-safe-recovery-search-complete-no-exact-candidate",
    "recovery-readiness report identity drifted",
  );
  invariant(
    report.identity?.grade === 5 &&
      report.identity.lesson === 4 &&
      report.identity.titleDisplay ===
        "Number Lines" &&
      report.identity.expectedReleaseMembers === 55 &&
      report.identity.publicationMode === "atomic",
    "recovery-readiness lesson identity drifted",
  );
  invariant(
    report.generator?.path === GENERATOR_PATH &&
      Number.isInteger(report.generator.bytes) &&
      report.generator.bytes > 0 &&
      SHA256.test(report.generator.sha256 || ""),
    "recovery-readiness generator binding drifted",
  );
  const bindings = report.sourceBindings;
  invariant(
    bindings?.currentSourceCatalog?.sourceId ===
        "current-preserved-source-catalog" &&
      bindings.currentSourceCatalog.fileCount === 7919 &&
      bindings.g5L4SourceGap?.sourceId ===
        "g5-l4-source-gap-forensics" &&
      bindings.historicalTechnicalCrosswalk?.sourceId ===
        "historical-office-technical-source-crosswalk-2026-07-25" &&
      bindings.historicalTechnicalCrosswalk.fileCount === 1455 &&
      bindings.historicalTechnicalCrosswalk.xmlFileCount === 11 &&
      bindings.historicalTechnicalCrosswalk.completeCatalogBound === true &&
      bindings.historicalAuthorityCatalog?.fileCount === 3713 &&
      bindings.sqlPrivacySafeCatalog?.sourceId ===
        "newhelpprogram-20210203-privacy-safe-catalog" &&
      bindings.sqlPrivacySafeAggregate?.sourceId ===
        "newhelpprogram-20210203-privacy-safe-aggregate-analysis" &&
      Object.values(bindings).every(
        (binding) =>
          Number.isInteger(binding.bytes) &&
          binding.bytes > 0 &&
          SHA256.test(binding.sha256 || ""),
      ),
    "recovery-readiness source bindings drifted",
  );
  invariant(
    bindings.lessonReleaseCatalog?.sourceId === "lesson-release-catalog" &&
      bindings.lessonReleaseCatalog.path ===
        PROJECT_INPUTS.lessonReleaseCatalog &&
      bindings.courseXmlDeclarationSource?.sourceId ===
        "g5-l4-preserved-course-xml" &&
      bindings.courseXmlDeclarationSource.path === PROJECT_INPUTS.courseXml &&
      bindings.courseXmlDeclarationSource.sha256 ===
        "b6f1718da8f5e909cb96c883902009887eb965d41e41588318b4bfb36c8f7a36" &&
      bindings.shippedShellSwf?.sourceId ===
        "g5-l4-shipped-shell-swf" &&
      bindings.shippedShellSwf.path === PROJECT_INPUTS.shellSwf &&
      bindings.shippedShellSwf.sha256 ===
        "7865195a07666e8123bef33f52aea36e06b7e0a9987fbbea605bc92cbe9b0301" &&
      bindings.shippedShellMachineAudit?.sourceId ===
        "g5-l4-shipped-shell-machine-audit" &&
      bindings.shippedShellMachineAudit.path ===
        PROJECT_INPUTS.shellMachineAudit &&
      bindings.shippedShellFfdecScripts?.sourceId ===
        "g5-l4-shipped-shell-ffdec-scripts" &&
      bindings.shippedShellFfdecScripts.path ===
        PROJECT_INPUTS.shellFfdecScripts &&
      bindings.shippedShellFfdecScripts.expandedBytes === 229313 &&
      bindings.shippedShellFfdecScripts.expandedSha256 ===
        "dc415e19f79adbb64a4e9073c1342532082495f30b124a2cf90ec2325a4586b0" &&
      bindings.shippedShellFfdecScriptInventory?.sourceId ===
        "g5-l4-shipped-shell-ffdec-script-inventory" &&
      bindings.shippedShellFfdecScriptInventory.path ===
        PROJECT_INPUTS.shellFfdecScriptInventory &&
      bindings.englishGradeWideMasterGlossary?.sourceId ===
        "elementary-grade-wide-master-glossary-english" &&
      bindings.englishGradeWideMasterGlossary.path ===
        PROJECT_INPUTS.masterGlossaryEnglish &&
      bindings.englishGradeWideMasterGlossary.sha256 ===
        "bec389ce286b9a113297dfd87e052f28cf1da2640d93a277f91f669dfb3ef749" &&
      bindings.spanishGradeWideMasterGlossary?.sourceId ===
        "elementary-grade-wide-master-glossary-spanish" &&
      bindings.spanishGradeWideMasterGlossary.path ===
        PROJECT_INPUTS.masterGlossarySpanish &&
      bindings.spanishGradeWideMasterGlossary.sha256 ===
        "7f12ce833f1429073a11a3ea0dd9d9964eb773804c18c025bde12552b3be5a00",
    "direct course, shell, FFDec, or master-glossary binding drifted",
  );
  invariant(
    bindings.authorizedCombinedReferenceEnglish2015?.sourceId ===
        "content-manager-authorized-combined-elementary-keyterms-reference-english-2015" &&
      bindings.authorizedCombinedReferenceEnglish2015.path ===
        PROJECT_INPUTS.authorizedCombinedReferenceEnglish &&
      bindings.authorizedCombinedReferenceEnglish2015.bytes === 398191 &&
      bindings.authorizedCombinedReferenceEnglish2015.sha256 ===
        "d39fab547dde0476c27caa01c8e3e2443d71cc40eb2df725e7a50102d01ab42c" &&
      bindings.authorizedCombinedReferenceEnglish2015.recordCount === 814 &&
      bindings.authorizedCombinedReferenceEnglish2015
        .knownUnrelatedMalformedRecordCount === 0 &&
      bindings.authorizedCombinedReferenceSpanish2015?.sourceId ===
        "content-manager-authorized-combined-elementary-keyterms-reference-spanish-2015" &&
      bindings.authorizedCombinedReferenceSpanish2015.path ===
        PROJECT_INPUTS.authorizedCombinedReferenceSpanish &&
      bindings.authorizedCombinedReferenceSpanish2015.bytes === 396776 &&
      bindings.authorizedCombinedReferenceSpanish2015.sha256 ===
        "a3aab5a75cd635f88ba5883a5fc2715ea144f51ac5efedac0341c5801c672c6d" &&
      bindings.authorizedCombinedReferenceSpanish2015.recordCount === 812 &&
      bindings.authorizedCombinedReferenceSpanish2015
        .knownUnrelatedMalformedRecordCount === 1 &&
      bindings.authorizedCombinedReferenceIntakeReceipt?.sourceId ===
        "owner-directed-combined-elementary-keyterms-intake-receipt" &&
      bindings.authorizedCombinedReferenceIntakeReceipt.path ===
        PROJECT_INPUTS.authorizedCombinedReferenceIntakeReceipt &&
      bindings.authorizedCombinedReferenceIntakeReceipt.schemaVersion === 1 &&
      bindings.authorizedCombinedReferenceIntakeReceipt.receiptType ===
        "owner-directed-combined-elementary-keyterms-intake",
    "authorized combined-reference intake binding drifted",
  );
  const dependency = report.declaredVsShippedShellStaticDependency;
  invariant(
    dependency?.evidenceClass ===
        "preserved-course-xml-declaration-versus-hash-bound-shipped-shell-static-ffdec-code" &&
      dependency.courseXmlDeclarations?.sourcePath ===
        PROJECT_INPUTS.courseXml &&
      dependency.courseXmlDeclarations.sourceSha256 ===
        bindings.courseXmlDeclarationSource.sha256 &&
      dependency.courseXmlDeclarations.declaredTargetCount === 2 &&
      dependency.courseXmlDeclarations.bothDeclaredTargetsPhysicallyMissing ===
        true &&
      Array.isArray(dependency.courseXmlDeclarations.declarations) &&
      dependency.courseXmlDeclarations.declarations.length === 2 &&
      dependency.courseXmlDeclarations.declarations.every(
        (entry, index) =>
          entry.language === TARGETS[index].language &&
          entry.basename === TARGETS[index].basename &&
          entry.declaredPath ===
            `HELP_KEYTERMS/KT/ELEMENTARY/XML/${TARGETS[index].basename}` &&
          entry.declarationCount === 1,
      ) &&
      dependency.shippedShellStaticRouting?.animationId ===
        SHELL_ANIMATION_ID &&
      dependency.shippedShellStaticRouting.assetId === SHELL_ASSET_ID &&
      dependency.shippedShellStaticRouting.shellSourceSha256 ===
        bindings.shippedShellSwf.sha256 &&
      dependency.shippedShellStaticRouting.machineAuditSha256 ===
        bindings.shippedShellMachineAudit.sha256 &&
      dependency.shippedShellStaticRouting.ffdecScriptsSha256 ===
        bindings.shippedShellFfdecScripts.sha256 &&
      dependency.shippedShellStaticRouting.expandedScriptSha256 ===
        bindings.shippedShellFfdecScripts.expandedSha256 &&
      JSON.stringify(
        dependency.shippedShellStaticRouting.staticXmlTargetOccurrences,
      ) === JSON.stringify([
        "ELKTEG4.xml",
        "ELKTSG4.xml",
        "ELKTEG4.xml",
      ]) &&
      dependency.shippedShellStaticRouting.masterGlossaryReferenceCounts
        ?.["ELKTEG4.xml"] === 2 &&
      dependency.shippedShellStaticRouting.masterGlossaryReferenceCounts
        ?.["ELKTSG4.xml"] === 1 &&
      dependency.shippedShellStaticRouting
        .missingLessonLocalTargetReferenceCounts?.["L4KTE01.xml"] === 0 &&
      dependency.shippedShellStaticRouting
        .missingLessonLocalTargetReferenceCounts?.["L4KTS01.xml"] === 0 &&
      dependency.shippedShellStaticRouting.xmlLoadViaKeyTermVarCallCount === 2 &&
      dependency.shippedShellStaticRouting
        .staticDirectReferenceToMissingLessonLocalTargets === false &&
      dependency.shippedShellStaticRouting
        .staticGradeWideMasterGlossaryRoutingPresent === true &&
      dependency.shippedShellStaticRouting.runtimeReachabilityProven ===
        false &&
      dependency.shippedShellStaticRouting.runtimeLoadSuccessProven === false &&
      dependency.shippedShellStaticRouting.originalRuntimeAuthority === false &&
      dependency.declaredSourceGapStillOpen === true &&
      dependency.shippedShellStaticDirectTargetDependencyPresent === false &&
      dependency.sourceGapClosed === false &&
      dependency.substitutionAuthorized === false,
    "declared-versus-shipped-shell static dependency boundary drifted",
  );
  const termAudit = report.lessonTermLinkAudit;
  invariant(
    termAudit?.evidenceClass ===
        "hash-bound-static-ffdec-lesson-link-and-master-glossary-corroboration-only" &&
      termAudit.scope?.releaseActivityMembers === 54 &&
      termAudit.scope.ffdecScriptBundlesScanned === 54 &&
      SHA256.test(termAudit.scope.scannedMemberBindingSetSha256 || "") &&
      termAudit.scope.linkedMemberCount === 3 &&
      termAudit.scope.linkOccurrenceCount === 16 &&
      termAudit.scope.uniqueLinkedTermCount === 7 &&
      termAudit.masterGlossaries?.english?.path ===
        PROJECT_INPUTS.masterGlossaryEnglish &&
      termAudit.masterGlossaries.english.sha256 ===
        bindings.englishGradeWideMasterGlossary.sha256 &&
      termAudit.masterGlossaries.english.parsedRecordCount === 761 &&
      termAudit.masterGlossaries?.spanish?.path ===
        PROJECT_INPUTS.masterGlossarySpanish &&
      termAudit.masterGlossaries.spanish.sha256 ===
        bindings.spanishGradeWideMasterGlossary.sha256 &&
      termAudit.masterGlossaries.spanish.parsedRecordCount === 753 &&
      Array.isArray(termAudit.scannedMemberBindings) &&
      termAudit.scannedMemberBindings.length === 54 &&
      new Set(termAudit.scannedMemberBindings.map(({animationId}) => animationId))
        .size === 54 &&
      descriptorSetSha256(termAudit.scannedMemberBindings) ===
        termAudit.scope.scannedMemberBindingSetSha256 &&
      termAudit.scannedMemberBindings.every((entry) =>
        entry.source?.path?.startsWith(
          `${PRESERVED_SOURCE_ROOT}/HELP_COURSES/ELMGR5/L4/`,
        ) &&
        Number.isInteger(entry.source.bytes) && entry.source.bytes > 0 &&
        SHA256.test(entry.source.sha256 || "") &&
        Number.isInteger(entry.linkOccurrences) &&
        entry.linkOccurrences >= 0 &&
        [entry.machineAudit, entry.ffdecScriptInventory, entry.ffdecScripts]
          .every((binding) =>
            typeof binding.path === "string" &&
            Number.isInteger(binding.bytes) && binding.bytes > 0 &&
            SHA256.test(binding.sha256 || ""))) &&
      Array.isArray(termAudit.linkedMemberSources) &&
      termAudit.linkedMemberSources.length === 3 &&
      termAudit.linkedMemberSources.reduce(
        (sum, entry) => sum + entry.linkOccurrences,
        0,
      ) === 16 &&
      Array.isArray(termAudit.terms) &&
      termAudit.terms.length === 7 &&
      termAudit.terms.reduce(
        (sum, term) => sum + term.occurrenceCount,
        0,
      ) === 16 &&
      termAudit.terms.every((term) =>
        term.masterGlossaryMatches?.english?.matchCount === 1 &&
        term.masterGlossaryMatches?.spanish?.matchCount === 1 &&
        term.masterGlossaryMatches.english.illustrationBasename.toLowerCase() ===
          term.masterGlossaryMatches.spanish.illustrationBasename.toLowerCase() &&
        term.illustration?.currentSourceCatalogMatchCount ===
          (term.illustration.physicalPresence ? 1 : 0) &&
        (term.illustration.physicalPresence
          ? Number.isInteger(term.illustration.source?.bytes) &&
            term.illustration.source.bytes > 0 &&
            SHA256.test(term.illustration.source.sha256 || "")
          : term.illustration.source === null)) &&
      termAudit.summary?.allLinksResolveInEnglishMasterGlossary === true &&
      termAudit.summary.allLinksResolveInSpanishMasterGlossary === true &&
      termAudit.summary.uniqueIllustrationsDeclared === 7 &&
      termAudit.summary.uniqueIllustrationsPhysicallyPresent === 2 &&
      termAudit.summary.uniqueIllustrationsMissing === 5 &&
      termAudit.summary.linkOccurrencesWithIllustrationPresent === 6 &&
      termAudit.summary.linkOccurrencesWithIllustrationMissing === 10 &&
      termAudit.summary.allIllustrationsPhysicallyPresent === false &&
      termAudit.summary.targetXmlRecovered === false &&
      termAudit.summary.substitutionAuthorized === false &&
      termAudit.summary.authoritativeOriginalRuntime === false &&
      termAudit.summary.runtimeLoadSuccessProven === false &&
      termAudit.summary.linkCausalityProven === false,
    "lesson term-link or master-glossary static evidence drifted",
  );
  const combinedReference =
    report.authorizedCombinedElementaryKeytermsReference;
  const combinedSources = combinedReference?.intakeVariant?.sources;
  invariant(
    combinedReference?.evidenceClass ===
        "owner-relayed-content-manager-authorized-combined-elementary-reference" &&
      combinedReference.direction?.evidenceClass ===
        COMBINED_REFERENCE_DIRECTION.evidenceClass &&
      combinedReference.direction.contentManager ===
        COMBINED_REFERENCE_DIRECTION.contentManager &&
      combinedReference.direction.relayedByOwner ===
        COMBINED_REFERENCE_DIRECTION.relayedByOwner &&
      combinedReference.direction.recordedDate ===
        COMBINED_REFERENCE_DIRECTION.recordedDate &&
      combinedReference.direction.scope === COMBINED_REFERENCE_DIRECTION.scope &&
      combinedReference.direction.messageHeadersVerified === false &&
      combinedReference.direction.referenceUseAuthorized === true &&
      combinedReference.intakeVariant?.sourceYear === 2015 &&
      combinedReference.intakeVariant.sourceClass ===
        "owner-intake-combined-elementary-keyterms-reference-variant" &&
      combinedReference.intakeVariant.sourceCount === 2 &&
      combinedReference.intakeVariant.parsedRecordCount === 1626 &&
      combinedReference.intakeVariant.knownUnrelatedMalformedRecordCount === 1 &&
      combinedReference.clientSelection?.canonical2008MasterSelected === true &&
      combinedReference.clientSelection.ownerIntake2015Selected === false &&
      combinedReference.clientSelection.ownerIntake2015FullImportBlocked ===
        true &&
      combinedReference.clientSelection.ownerIntake2015FullImportBlocker ===
        "malformed-source-record" &&
      combinedSources?.english?.basename === "ELKTEG4.xml" &&
      combinedSources.english.path ===
        PROJECT_INPUTS.authorizedCombinedReferenceEnglish &&
      combinedSources.english.bytes === 398191 &&
      combinedSources.english.sha256 ===
        bindings.authorizedCombinedReferenceEnglish2015.sha256 &&
      combinedSources.english.parsedRecordCount === 814 &&
      combinedSources.english.knownUnrelatedMalformedRecordCount === 0 &&
      combinedSources.english.linkedG5L4TermExactMatchCount === 7 &&
      combinedSources.english.byteIdenticalToCurrentPreservedMaster === false &&
      combinedSources.english.currentPreservedSourceCatalogMember === false &&
      combinedSources?.spanish?.basename === "ELKTSG4.xml" &&
      combinedSources.spanish.path ===
        PROJECT_INPUTS.authorizedCombinedReferenceSpanish &&
      combinedSources.spanish.bytes === 396776 &&
      combinedSources.spanish.sha256 ===
        bindings.authorizedCombinedReferenceSpanish2015.sha256 &&
      combinedSources.spanish.parsedRecordCount === 812 &&
      combinedSources.spanish.knownUnrelatedMalformedRecordCount === 1 &&
      combinedSources.spanish.linkedG5L4TermExactMatchCount === 7 &&
      combinedSources.spanish.byteIdenticalToCurrentPreservedMaster === false &&
      combinedSources.spanish.currentPreservedSourceCatalogMember === false &&
      combinedReference.intakeVariant.sourceSetSha256 ===
        descriptorSetSha256(Object.values(combinedSources)) &&
      combinedReference.linkedG5L4TermCoverage?.uniqueLinkedTermCount === 7 &&
      combinedReference.linkedG5L4TermCoverage.englishExactMatchCount === 7 &&
      combinedReference.linkedG5L4TermCoverage.spanishExactMatchCount === 7 &&
      combinedReference.linkedG5L4TermCoverage
        .allLinkedTermsResolveExactlyOnce === true &&
      combinedReference.linkedG5L4TermCoverage
        .knownMalformedRecordAffectsLinkedG5L4Terms === false &&
      combinedReference.disposition?.referenceUseAuthorized === true &&
      combinedReference.disposition.exactTargetCandidates === 0 &&
      combinedReference.disposition.recoveredTargets === 0 &&
      combinedReference.disposition.missingLessonSourcesRecovered === false &&
      combinedReference.disposition.sourceGapClosed === false &&
      combinedReference.disposition.substitutionAuthorized === false &&
      combinedReference.disposition.runtimeByteVariantVerified === false &&
      combinedReference.disposition.runtimeLoadSuccessProven === false &&
      combinedReference.disposition.authoritativeOriginalRuntime === false &&
      combinedReference.disposition.fidelityAccepted === false &&
      combinedReference.disposition.strictComplete === false &&
      combinedReference.disposition.published === false &&
      typeof combinedReference.boundary === "string" &&
      combinedReference.boundary.startsWith(
        "The Owner-relayed content-manager direction authorizes",
      ),
    "authorized combined-reference boundary drifted",
  );
  invariant(
    Array.isArray(report.targets) &&
      report.targets.length === 2 &&
      report.targets.every((target, index) =>
        target.language === TARGETS[index].language &&
        target.basename === TARGETS[index].basename &&
        target.currentSourceCatalogExactBasenameCount === 0 &&
        target.sourceGapExactCatalogMatchCount === 0 &&
        target.sourceGapBasenameMatchCount === 0 &&
        target.currentPreservedPhysicalPresence === false &&
        target.historicalTechnicalCrosswalkExactBasenameCount === 0 &&
        target.historicalTechnicalCrosswalkNormalizedAliasCount === 0 &&
        target.sqlPrivacySafeCatalogReferenceCount === 0 &&
        target.sqlPrivacySafeAggregateReferenceCount === 0 &&
        target.exactCandidateCount === 0 &&
        Array.isArray(target.exactCandidateSha256) &&
        target.exactCandidateSha256.length === 0 &&
        target.contentRecovered === false &&
        target.importAuthorized === false &&
        target.reviewedExceptionEstablished === false),
    "a missing KeyTerm target was promoted or drifted",
  );
  const lead = report.differentBasenameMasterGlossaryLead;
  invariant(
    lead?.leadCount === 1 &&
      lead.leadClass === "different-basename-master-glossary-lead" &&
      lead.sha256 ===
        "c7d92527369fe98f3cba813acc2ea421a1a5de955465a565c2081dcebcdd1adf" &&
      lead.bytes === 342317 &&
      lead.physicalPresence === true &&
      lead.authority === "technical-source-file" &&
      lead.authorityConfidence === "high" &&
      lead.keyTermRecordCount === 659 &&
      lead.exactTargetBasenameReferenceCount === 0 &&
      lead.sourceAssetsExactMatchCount === 0 &&
      lead.migrationWorkspaceMatchCount === 0 &&
      lead.exactTargetCandidate === false &&
      lead.substitutionAuthorized === false &&
      lead.importAuthorized === false,
    "different-basename master-glossary lead was promoted or drifted",
  );
  invariant(
    report.recoveryGate?.state ===
        "closed-no-exact-hash-bound-target-candidate-and-no-reviewed-exception" &&
      report.recoveryGate.exactTargetCandidates === 0 &&
      report.recoveryGate.recoveredTargets === 0 &&
      report.recoveryGate.requiredTargets === 2 &&
      report.recoveryGate.sourceGapClosed === false &&
      report.recoveryGate.importAuthorized === false &&
      report.recoveryGate.substitutionAuthorized === false &&
      report.recoveryGate.implementationAuthorized === false &&
      report.recoveryGate.reviewedExceptionEstablished === false,
    "recovery gate was opened",
  );
  invariant(
    report.strictCompletion?.completeMembers === 0 &&
      report.strictCompletion.expectedMembers === 55 &&
      report.strictCompletion.fraction === "0/55" &&
      report.strictCompletion.complete === false,
    "strict completion was promoted",
  );
  invariant(
    report.publication?.published === false &&
      report.publication.publicationCount === 0 &&
      report.publication.atomicReleaseEligible === false,
    "publication was promoted",
  );
  invariant(
    Object.values(report.acceptanceEffects || {}).every(
      (value) => value === false,
    ),
    "recovery-readiness report changed an acceptance gate",
  );
  invariant(
    typeof report.strictAcceptanceEffect === "string" &&
      report.strictAcceptanceEffect.startsWith("none;"),
    "recovery-readiness report claims strict acceptance",
  );
  const fingerprint = report.reportFingerprintSha256;
  invariant(
    SHA256.test(fingerprint || ""),
    "recovery-readiness report fingerprint is missing",
  );
  const copy = {...report};
  delete copy.reportFingerprintSha256;
  invariant(
    fingerprint === sha256Bytes(Buffer.from(stableJson(copy))),
    "recovery-readiness report fingerprint drifted",
  );
  safeReportBoundary(report);
  return report;
}

export function renderMarkdown(report) {
  validateG5L4MissingKeytermRecoveryReadiness(report);
  const targetRows = report.targets.map((target) =>
    `| ${target.language} | \`${target.basename}\` | ${target.exactCandidateCount} | ${target.currentPreservedPhysicalPresence ? "yes" : "no"} | no |`)
    .join("\n");
  const dependency = report.declaredVsShippedShellStaticDependency;
  const shellStatic = dependency.shippedShellStaticRouting;
  const termAudit = report.lessonTermLinkAudit;
  const linkedMemberRows = termAudit.linkedMemberSources.map((member) =>
    `| \`${member.animationId}\` | ${member.linkOccurrences} | \`${member.ffdecScripts.path}\` | \`${member.ffdecScripts.sha256}\` |`)
    .join("\n");
  const termRows = termAudit.terms.map((term) => {
    const illustration = term.illustration;
    const source = illustration.source;
    return `| ${term.term} | ${term.occurrenceCount} | yes / yes | ${illustration.physicalPresence ? "present" : "missing"} | \`${source?.path || illustration.expectedArchivePath}\` | ${source ? `\`${source.sha256}\`` : "—"} |`;
  }).join("\n");
  const combinedReference =
    report.authorizedCombinedElementaryKeytermsReference;
  const combinedReferenceRows = Object.entries(
    combinedReference.intakeVariant.sources,
  ).map(([language, source]) =>
    `| ${language} | \`${source.path}\` | ${source.bytes} | \`${source.sha256}\` | ${source.parsedRecordCount} | ${source.knownUnrelatedMalformedRecordCount} |`)
    .join("\n");
  return `# G5 L4 Missing KeyTerm Recovery Readiness

Release: \`${report.releaseId}\` — **Number Lines**  
State: **public-safe, hash-bound, fail-closed; no exact recovery candidate**

This acceptance-neutral report binds the complete current source catalog, G5 L4
course XML and shipped shell, shell FFDec export and machine reports, both
preserved grade-wide glossary XML files, the separately authorized 2015
combined-reference intake, the G5 L4 source-gap report, complete
historical technical-source crosswalk and authority catalog, and privacy-safe
SQL catalog/aggregate. It exposes no historical raw path or personal data and
copies or modifies no preserved source.

## Missing targets

| Language | Target basename | Exact candidates | Physically present | Import authorized |
| --- | --- | ---: | --- | --- |
${targetRows}

Both targets also have **0** normalized historical filename aliases and **0**
privacy-safe SQL catalog or aggregate references.

## Declared source gap versus shipped-shell static routing

- Preserved declaration: \`${dependency.courseXmlDeclarations.sourcePath}\`
  (${dependency.courseXmlDeclarations.sourceBytes} bytes; SHA-256
  \`${dependency.courseXmlDeclarations.sourceSha256}\`)
- Shipped shell: \`${shellStatic.shellSourcePath}\`
  (${shellStatic.shellSourceBytes} bytes; SHA-256
  \`${shellStatic.shellSourceSha256}\`)
- Shell machine report: \`${shellStatic.machineAuditPath}\` — SHA-256
  \`${shellStatic.machineAuditSha256}\`
- Shell FFDec script bundle: \`${shellStatic.ffdecScriptsPath}\` — SHA-256
  \`${shellStatic.ffdecScriptsSha256}\`; expanded SHA-256
  \`${shellStatic.expandedScriptSha256}\`
- Course XML declarations: **L4KTE01.xml 1 / L4KTS01.xml 1**
- Shipped-shell literal references: **L4KTE01.xml 0 / L4KTS01.xml 0**
- Shipped-shell grade-wide targets: **ELKTEG4.xml 2 / ELKTSG4.xml 1**
- Generic \`XML.load(KeyTermVar)\` calls: **${shellStatic.xmlLoadViaKeyTermVarCallCount}**

These are two different evidence statements. The lesson-local files remain a
declared and unresolved source gap. The shipped SWF's static ActionScript instead
points to the grade-wide files, but FFDec code cannot prove runtime reachability,
successful loading, interaction causality, or that the XML declarations are
stale. Original-runtime authority remains **false**.

## Authorized combined elementary KeyTerm reference

The Owner relayed Content Manager Venky's direction on **2026-07-30** to use
the combined elementary KeyTerm files as the G5 L4 product reference. That
direction is recorded as **reference use authorized: true**; independent email
header verification remains **false**.

| Language | 2015 intake path | Bytes | SHA-256 | Parsed records | Known unrelated malformed records |
| --- | --- | ---: | --- | ---: | ---: |
${combinedReferenceRows}

Both intake files resolve all **${combinedReference.linkedG5L4TermCoverage.uniqueLinkedTermCount}**
statically linked G5 L4 terms exactly once. The one known malformed Spanish
record is unrelated to those seven terms. The intake files are not byte-identical
to the current preserved master pair and are **not** verified runtime byte
variants. The client selection remains the canonical preserved 2008 master;
the 2015 intake is unselected for full import and blocked by the malformed
source record.

This authorization is intentionally narrow: exact lesson-local recovery remains
**0/2**, \`L4KTE01.xml\` and \`L4KTS01.xml\` remain missing,
lesson-specific substitution remains **false**, source-gap closure remains
**false**, and no fidelity, strict-completion, or publication gate changes.

## Static lesson term links and illustration availability

The exact 54 activity-member FFDec bundles were scanned and hash-bound to their
machine reports, script-inventory reports, release identities, and source SWFs.
Binding-set SHA-256: \`${termAudit.scope.scannedMemberBindingSetSha256}\`.

| Linked member | Link occurrences | FFDec bundle | SHA-256 |
| --- | ---: | --- | --- |
${linkedMemberRows}

| Linked term | Occurrences | EN / ES master record | Illustration SWF | Path | SHA-256 |
| --- | ---: | --- | --- | --- | --- |
${termRows}

Static totals: **${termAudit.scope.linkOccurrenceCount}** link occurrences,
**${termAudit.scope.uniqueLinkedTermCount}** unique terms, all with one exact
record in each grade-wide master glossary. Referenced illustration SWFs are
physically present for **${termAudit.summary.uniqueIllustrationsPhysicallyPresent}**
of **${termAudit.summary.uniqueIllustrationsDeclared}** unique terms
(**${termAudit.summary.linkOccurrencesWithIllustrationPresent}** of
**${termAudit.scope.linkOccurrenceCount}** occurrences); the other
**${termAudit.summary.uniqueIllustrationsMissing}** unique illustration SWFs are
missing. This is planning evidence only and authorizes neither XML substitution
nor runtime/fidelity acceptance.

## Different-basename master-glossary lead

- Class: **different-basename master-glossary lead only**
- SHA-256: \`${report.differentBasenameMasterGlossaryLead.sha256}\`
- Bytes: **${report.differentBasenameMasterGlossaryLead.bytes}**
- Physical presence: **true**
- Authority: **technical-source-file / high confidence**
- KeyTerm records: **${report.differentBasenameMasterGlossaryLead.keyTermRecordCount}**
- Exact current source matches: **0**
- Exact target basename references: **0**
- Exact target candidate / substitution / import: **false / false / false**

The lead may inform format and provenance questions only. It must not be
renamed, copied, or substituted for either missing target.

## Recovery and acceptance boundary

- Exact recovered targets: **0/2**
- Combined elementary product-reference use authorized: **true**
- Runtime byte variant verified: **false**
- Source gap closed: **false**
- Implementation or import authorized: **false**
- Strict completion: **0/55**
- Published: **false**

Next action: the owner or designated source custodian should search original
KeyTerm build outputs or deployment backups for the two exact basenames and
hash-bind any recovered file before review. If recovery is exhausted, use a
validator-supported reviewed exception without inventing bilingual content.
`;
}

function outputPaths(projectRoot, outputPrefix) {
  invariant(
    typeof outputPrefix === "string" &&
      outputPrefix.startsWith("reports/") &&
      outputPrefix !== "reports/" &&
      !outputPrefix.includes("\\") &&
      !path.posix.isAbsolute(outputPrefix) &&
      path.posix.normalize(outputPrefix) === outputPrefix &&
      path.posix.extname(outputPrefix) === "",
    "--output-prefix must be a normalized extensionless path below reports/",
  );
  return {
    json: resolveProjectPath(projectRoot, `${outputPrefix}.json`, "JSON output"),
    markdown: resolveProjectPath(
      projectRoot,
      `${outputPrefix}.md`,
      "Markdown output",
    ),
  };
}

async function ensureSafeOutputDirectory(projectRoot, directory, create) {
  invariant(isWithin(projectRoot, directory), "output directory escapes project root");
  const relative = path.relative(projectRoot, directory);
  let cursor = projectRoot;
  for (const component of relative.split(path.sep).filter(Boolean)) {
    cursor = path.join(cursor, component);
    let metadata = await lstat(cursor).catch((error) => {
      if (error?.code === "ENOENT") return null;
      throw error;
    });
    if (!metadata && create) {
      await mkdir(cursor);
      metadata = await lstat(cursor);
    }
    invariant(
      metadata?.isDirectory() && !metadata.isSymbolicLink(),
      `${portable(path.relative(projectRoot, cursor))}: output ancestor must be an ordinary directory`,
    );
  }
  const [realRoot, realDirectory] = await Promise.all([
    realpath(projectRoot),
    realpath(directory),
  ]);
  invariant(
    isWithin(realRoot, realDirectory),
    "output directory resolves outside project root",
  );
}

async function existingOutput(file, projectRoot) {
  const metadata = await lstat(file).catch((error) => {
    if (error?.code === "ENOENT") return null;
    throw error;
  });
  if (!metadata) return null;
  invariant(
    metadata.isFile() && !metadata.isSymbolicLink() && metadata.nlink === 1,
    `${portable(path.relative(projectRoot, file))}: output target must be one ordinary non-linked file`,
  );
  const contents = await readFile(file);
  return {
    bytes: contents.length,
    sha256: sha256Bytes(contents),
    contents,
  };
}

async function unlinkExpected(file, expectedSha256, projectRoot) {
  const state = await existingOutput(file, projectRoot);
  if (!state) return;
  invariant(
    state.sha256 === expectedSha256,
    `${portable(path.relative(projectRoot, file))}: refusing to remove an unowned file`,
  );
  await unlink(file);
}

export async function writeOrCheck({
  report,
  projectRoot: projectRootOption = defaultProjectRoot,
  outputPrefix = DEFAULT_OUTPUT_PREFIX,
  check = false,
} = {}) {
  validateG5L4MissingKeytermRecoveryReadiness(report);
  const projectRoot = path.resolve(projectRootOption);
  const outputs = outputPaths(projectRoot, outputPrefix);
  await ensureSafeOutputDirectory(
    projectRoot,
    path.dirname(outputs.json),
    !check,
  );
  const expected = {
    json: stableJson(report),
    markdown: renderMarkdown(report),
  };
  if (check) {
    const [json, markdown] = await Promise.all([
      readFile(outputs.json, "utf8"),
      readFile(outputs.markdown, "utf8"),
    ]);
    invariant(json === expected.json, "recovery-readiness JSON output is stale");
    invariant(
      markdown === expected.markdown,
      "recovery-readiness Markdown output is stale",
    );
    return {action: "verified"};
  }

  const transactionId = randomUUID();
  const entries = [
    {file: outputs.json, contents: expected.json},
    {file: outputs.markdown, contents: expected.markdown},
  ].map((entry) => ({
    ...entry,
    temporary: `${entry.file}.tmp-${transactionId}`,
    backup: `${entry.file}.bak-${transactionId}`,
    expectedSha256: sha256Bytes(Buffer.from(entry.contents)),
  }));
  let installed = 0;
  try {
    for (const entry of entries) {
      invariant(
        await existingOutput(entry.temporary, projectRoot) === null &&
          await existingOutput(entry.backup, projectRoot) === null,
        "transaction scratch path already exists",
      );
      entry.prior = await existingOutput(entry.file, projectRoot);
      await writeFile(entry.temporary, entry.contents, {
        encoding: "utf8",
        flag: "wx",
        mode: 0o644,
      });
    }
    for (const entry of entries) {
      if (entry.prior) await rename(entry.file, entry.backup);
    }
    for (const entry of entries) {
      await rename(entry.temporary, entry.file);
      installed += 1;
    }
    for (const entry of entries) {
      const current = await existingOutput(entry.file, projectRoot);
      invariant(
        current?.sha256 === entry.expectedSha256,
        "post-write verification failed",
      );
      if (entry.prior) {
        await unlinkExpected(entry.backup, entry.prior.sha256, projectRoot);
      }
    }
  } catch (error) {
    for (let index = installed - 1; index >= 0; index -= 1) {
      const entry = entries[index];
      await unlinkExpected(entry.file, entry.expectedSha256, projectRoot)
        .catch(() => {});
    }
    for (const entry of [...entries].reverse()) {
      const backup = await existingOutput(entry.backup, projectRoot)
        .catch(() => null);
      if (backup && entry.prior?.sha256 === backup.sha256) {
        await rename(entry.backup, entry.file).catch(() => {});
      }
      await unlinkExpected(entry.temporary, entry.expectedSha256, projectRoot)
        .catch(() => {});
    }
    throw error;
  }
  return {
    action: "written",
    outputs: entries.map((entry) => ({
      bytes: Buffer.byteLength(entry.contents),
      sha256: entry.expectedSha256,
    })),
  };
}

export function parseArguments(argv) {
  const options = {
    check: false,
    outputPrefix: DEFAULT_OUTPUT_PREFIX,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--check") options.check = true;
    else if (argument === "--output-prefix") {
      const value = argv[index + 1];
      invariant(
        value && !value.startsWith("--"),
        "--output-prefix requires a value",
      );
      options.outputPrefix = value;
      index += 1;
    } else if (argument === "--help" || argument === "-h") {
      options.help = true;
    } else {
      throw new Error(`Unknown option: ${argument}`);
    }
  }
  outputPaths(defaultProjectRoot, options.outputPrefix);
  return options;
}

function usage() {
  return `Usage: node scripts/build-g5-l4-missing-keyterm-recovery-readiness.mjs [options]

Options:
  --check                    Verify JSON and Markdown without writing
  --output-prefix <path>     Extensionless project-relative prefix below reports/
  --help                     Show this help

The command performs a public-safe, read-only, hash-bound recovery search. It
copies no source, exposes no historical raw path or personal data, authorizes no
import or substitution, and changes no acceptance or publication gate.`;
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(`${usage()}\n`);
  } else {
    const report = await buildG5L4MissingKeytermRecoveryReadiness();
    const result = await writeOrCheck({report, ...options});
    process.stdout.write(`${JSON.stringify({
      action: result.action,
      releaseId: RELEASE_ID,
      targets: report.targets.map(({basename, exactCandidateCount}) => ({
        basename,
        exactCandidateCount,
      })),
      importAuthorized: report.recoveryGate.importAuthorized,
      strictCompletion: report.strictCompletion.fraction,
      published: report.publication.published,
    }, null, 2)}\n`);
  }
}
