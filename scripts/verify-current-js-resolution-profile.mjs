#!/usr/bin/env node

import {execFile} from "node:child_process";
import {createHash} from "node:crypto";
import {mkdir, readFile, writeFile} from "node:fs/promises";
import path from "node:path";
import {promisify} from "node:util";
import {fileURLToPath, pathToFileURL} from "node:url";

const execFileAsync = promisify(execFile);

export const DEFAULT_V1_PROFILE =
  "apps/web/config/current-js-production-assets.v1.json";
export const DEFAULT_V2_PROFILE =
  "apps/web/config/current-js-production-assets.v2.json";
export const DEFAULT_REPORT =
  "reports/canvas-resolution/verification/current-js-resolution-profile.v2.json";
export const DEFAULT_BASELINE_REF =
  "ea16deba447b5876043d9991af87c39878eacb1c";

const V1_PROFILE_ID = "current-js-production-assets-v1";
const V2_PROFILE_ID = "current-js-production-assets-v2";
const V1_CHECKSUM_SET =
  "52dd1d51335523dc097b0c1a428e897960425ad184069fb023e98e0fcef7ae25";
const V1_PROFILE_FILE_SHA256 =
  "ccd832025b2df2c69615872645944b5bcfab18628d4d69df71ea0341925f9eca";
const APPROVAL_SCOPE = "five-lesson-current-js-production-closure";
const APPROVED_RELEASE_IDS = Object.freeze([
  "lesson-g03-l02-addition-subtraction-page-only-current-js",
  "lesson-g04-l03-negative-numbers",
  "lesson-g05-l03-exponents-prime-factorizations-page-only",
  "lesson-g05-l04-number-lines",
  "lesson-g05-l05-add-subtract-negative-numbers",
]);
const EXPECTED_COUNTS = Object.freeze({public: 929, serverAudio: 185, total: 1114});
const PAGE_RENDERER = /^courses\/course-g(?:03|04|05)-l\d{2}-[^/]+\/canvas-renderer\.js$/u;
const CANDIDATE_LESSON = /^courses\/course-g04-l(?:05|10|11)-/u;
const IR001_LOADED_HOST =
  "courses/shell-course-g04-l03-index-local/host-composite-assets/" +
  "course-g04-l03-ir-001-loaded-swf-canvas-renderer.js";
const SHA256 = /^[a-f0-9]{64}$/u;
const COMPLETE_BITMAP_DATA_URI =
  /data:(image\/[a-z0-9.+-]+);base64,([a-z0-9+/]+={0,2})/giu;

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) =>
      `${JSON.stringify(key)}:${stableJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function exactKeys(value, expected, label) {
  invariant(value && typeof value === "object" && !Array.isArray(value),
    `${label} must be an object`);
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  invariant(
    actual.length === wanted.length &&
      actual.every((key, index) => key === wanted[index]),
    `${label} keys changed: ${actual.join(",")}`,
  );
}

function validateCounts(counts, expected, label) {
  exactKeys(counts, ["public", "serverAudio", "total"], `${label}.counts`);
  invariant(
    counts.public === expected.public &&
      counts.serverAudio === expected.serverAudio &&
      counts.total === expected.total,
    `${label} counts changed`,
  );
}

function validateEntry(entry, label) {
  exactKeys(
    entry,
    ["assetPath", "relativePath", "storageRoot", "releaseId", "bytes", "sha256"],
    label,
  );
  invariant(typeof entry.assetPath === "string" && entry.assetPath.startsWith("courses/"),
    `${label}.assetPath is invalid`);
  invariant(entry.assetPath === `courses/${entry.relativePath}`,
    `${label}.relativePath does not match assetPath`);
  invariant(entry.storageRoot === "public" || entry.storageRoot === "server-audio",
    `${label}.storageRoot is invalid`);
  invariant(APPROVED_RELEASE_IDS.includes(entry.releaseId),
    `${label}.releaseId is outside the five production Lessons`);
  invariant(Number.isSafeInteger(entry.bytes) && entry.bytes >= 0,
    `${label}.bytes is invalid`);
  invariant(typeof entry.sha256 === "string" && SHA256.test(entry.sha256),
    `${label}.sha256 is invalid`);
  invariant(!CANDIDATE_LESSON.test(entry.assetPath),
    `${label} leaked a G4 L5/L10/L11 candidate asset`);
}

function checksumSet(entries) {
  const rows = entries
    .map((entry) => `${entry.sha256} ${entry.bytes} ${entry.relativePath}`)
    .sort((left, right) => {
      const leftPath = left.slice(left.indexOf(" ", left.indexOf(" ") + 1) + 1);
      const rightPath = right.slice(right.indexOf(" ", right.indexOf(" ") + 1) + 1);
      return leftPath.localeCompare(rightPath, "en");
    });
  return sha256(Buffer.from(rows.join("\n")));
}

export function validateProfileDocument(profile, {
  version,
  expectedCounts = EXPECTED_COUNTS,
} = {}) {
  const profileKeys = version === 2
    ? [
        "schemaVersion", "profileId", "parentProfileId",
        "parentChecksumSetSha256", "generatedBy", "approvalScope",
        "approvedReleaseIds", "counts", "checksumSetSha256", "entries",
      ]
    : [
        "schemaVersion", "profileId", "generatedBy", "approvalScope",
        "approvedReleaseIds", "counts", "checksumSetSha256", "entries",
      ];
  exactKeys(profile, profileKeys, `v${version} profile`);
  invariant(profile.schemaVersion === version, `v${version} schemaVersion changed`);
  invariant(profile.profileId === (version === 2 ? V2_PROFILE_ID : V1_PROFILE_ID),
    `v${version} profileId changed`);
  invariant(typeof profile.generatedBy === "string" && profile.generatedBy.length > 0,
    `v${version} generatedBy is missing`);
  invariant(profile.approvalScope === APPROVAL_SCOPE,
    `v${version} approvalScope changed`);
  invariant(
    Array.isArray(profile.approvedReleaseIds) &&
      profile.approvedReleaseIds.length === APPROVED_RELEASE_IDS.length &&
      profile.approvedReleaseIds.every((id, index) => id === APPROVED_RELEASE_IDS[index]),
    `v${version} approvedReleaseIds changed`,
  );
  if (version === 2) {
    invariant(profile.parentProfileId === V1_PROFILE_ID,
      "v2 parentProfileId changed");
    invariant(profile.parentChecksumSetSha256 === V1_CHECKSUM_SET,
      "v2 parent checksum changed");
  }
  validateCounts(profile.counts, expectedCounts, `v${version}`);
  invariant(Array.isArray(profile.entries), `v${version}.entries must be an array`);
  invariant(profile.entries.length === expectedCounts.total,
    `v${version} entry count changed`);
  const paths = new Set();
  const storagePaths = new Set();
  for (const [index, entry] of profile.entries.entries()) {
    validateEntry(entry, `v${version}.entries[${index}]`);
    invariant(!paths.has(entry.assetPath), `v${version} duplicate assetPath ${entry.assetPath}`);
    const storagePath = `${entry.storageRoot}\0${entry.relativePath}`;
    invariant(!storagePaths.has(storagePath),
      `v${version} duplicate storage path ${entry.relativePath}`);
    paths.add(entry.assetPath);
    storagePaths.add(storagePath);
  }
  const publicCount = profile.entries.filter((entry) => entry.storageRoot === "public").length;
  const serverAudioCount = profile.entries.length - publicCount;
  invariant(publicCount === expectedCounts.public && serverAudioCount === expectedCounts.serverAudio,
    `v${version} storage-root counts changed`);
  invariant(SHA256.test(profile.checksumSetSha256),
    `v${version} checksumSetSha256 is invalid`);
  invariant(checksumSet(profile.entries) === profile.checksumSetSha256,
    `v${version} checksum-set bytes do not close`);
  return profile;
}

function storagePathFor(workspaceRoot, entry) {
  const root = entry.storageRoot === "public"
    ? "apps/web/public/flash-assets/courses"
    : "apps/web/server-assets/flash-assets/courses";
  return path.join(workspaceRoot, root, entry.relativePath);
}

async function mapLimit(values, limit, mapper) {
  const result = new Array(values.length);
  let cursor = 0;
  const workers = Array.from({length: Math.min(limit, values.length)}, async () => {
    while (true) {
      const index = cursor;
      cursor += 1;
      if (index >= values.length) return;
      result[index] = await mapper(values[index], index);
    }
  });
  await Promise.all(workers);
  return result;
}

function extractEmbeddedBitmapInventory(bytes, label) {
  const text = bytes.toString("utf8");
  const inventory = [];
  for (const match of text.matchAll(COMPLETE_BITMAP_DATA_URI)) {
    const decoded = Buffer.from(match[2], "base64");
    invariant(decoded.length > 0, `${label} contains an empty embedded bitmap`);
    invariant(decoded.toString("base64") === match[2],
      `${label} contains non-canonical embedded bitmap base64`);
    inventory.push(`${match[1].toLowerCase()} ${decoded.length} ${sha256(decoded)}`);
  }
  return inventory.sort();
}

function assertAdaptiveRuntime(bytes, assetPath) {
  const text = bytes.toString("utf8");
  invariant(/mode\s*:\s*["']adaptive-integer["']/u.test(text),
    `${assetPath} is missing adaptive-integer metadata`);
  invariant(/nativeWidth\s*:\s*800\b/u.test(text),
    `${assetPath} is missing nativeWidth 800`);
  invariant(/nativeHeight\s*:\s*600\b/u.test(text),
    `${assetPath} is missing nativeHeight 600`);
  invariant(/supportedRenderScales/u.test(text) && /\[\s*1\s*,\s*2\s*\]/u.test(text),
    `${assetPath} is missing exact [1,2] support`);
  invariant(/request\.renderScale/u.test(text),
    `${assetPath} does not consume request.renderScale`);
  invariant(!/supportedRenderScales[^\n]*\b3\b/u.test(text),
    `${assetPath} advertises an unapproved 3x scale`);
}

async function readBaselineRenderer({
  workspaceRoot,
  baselinePublicRoot,
  baselineRef,
  relativePath,
}) {
  if (baselinePublicRoot) {
    return readFile(path.join(baselinePublicRoot, relativePath));
  }
  const gitPath = `apps/web/public/flash-assets/courses/${relativePath}`;
  const {stdout} = await execFileAsync(
    "git",
    ["show", `${baselineRef}:${gitPath}`],
    {cwd: workspaceRoot, encoding: "buffer", maxBuffer: 64 * 1024 * 1024},
  );
  return Buffer.isBuffer(stdout) ? stdout : Buffer.from(stdout);
}

function compareProfileShape(v1, v2, {
  expectedCanonicalRendererCount = 283,
  expectedChangedAssetCount = 284,
} = {}) {
  invariant(v1.entries.length === v2.entries.length,
    "v2 changed the production resource count");
  const changed = [];
  const rendererPaths = [];
  for (let index = 0; index < v1.entries.length; index += 1) {
    const parent = v1.entries[index];
    const candidate = v2.entries[index];
    invariant(parent.assetPath === candidate.assetPath,
      `v2 reordered or replaced ${parent.assetPath}`);
    invariant(parent.relativePath === candidate.relativePath,
      `v2 relativePath changed for ${parent.assetPath}`);
    invariant(parent.storageRoot === candidate.storageRoot,
      `v2 storageRoot changed for ${parent.assetPath}`);
    invariant(parent.releaseId === candidate.releaseId,
      `v2 releaseId changed for ${parent.assetPath}`);
    if (PAGE_RENDERER.test(parent.assetPath)) rendererPaths.push(parent.assetPath);
    if (parent.bytes !== candidate.bytes || parent.sha256 !== candidate.sha256) {
      changed.push(parent.assetPath);
    }
  }
  invariant(rendererPaths.length === expectedCanonicalRendererCount,
    `canonical renderer count is ${rendererPaths.length}, expected ${expectedCanonicalRendererCount}`);
  const allowed = new Set([...rendererPaths, IR001_LOADED_HOST]);
  invariant(changed.length === expectedChangedAssetCount,
    `changed asset count is ${changed.length}, expected ${expectedChangedAssetCount}`);
  invariant(changed.every((assetPath) => allowed.has(assetPath)),
    "v2 changed a non-renderer production asset");
  invariant([...allowed].every((assetPath) => changed.includes(assetPath)),
    "v2 left an approved Canvas runtime at v1 bytes");
  return {changed, rendererPaths};
}

export async function verifyCurrentJsResolutionProfile({
  workspaceRoot,
  v1ProfilePath = DEFAULT_V1_PROFILE,
  v2ProfilePath = DEFAULT_V2_PROFILE,
  baselineRef = DEFAULT_BASELINE_REF,
  baselinePublicRoot = null,
  expectedCounts = EXPECTED_COUNTS,
  expectedCanonicalRendererCount = 283,
  expectedChangedAssetCount = 284,
  expectedBitmapClosure = Object.freeze({
    rendererCount: 114,
    occurrenceCount: 583,
    uniqueBitmapCount: 147,
    uniqueDecodedBytes: 29_136_917,
  }),
  hashConcurrency = 8,
}) {
  const [v1Bytes, v2Bytes] = await Promise.all([
    readFile(path.resolve(workspaceRoot, v1ProfilePath)),
    readFile(path.resolve(workspaceRoot, v2ProfilePath)),
  ]);
  const v1 = validateProfileDocument(JSON.parse(v1Bytes), {
    version: 1,
    expectedCounts,
  });
  const v2 = validateProfileDocument(JSON.parse(v2Bytes), {
    version: 2,
    expectedCounts,
  });
  invariant(v1.checksumSetSha256 === V1_CHECKSUM_SET,
    "the parent profile is not the immutable production v1 checksum");
  invariant(sha256(v1Bytes) === V1_PROFILE_FILE_SHA256,
    "the parent profile file is not the immutable production v1 bytes");
  invariant(v2.parentChecksumSetSha256 === v1.checksumSetSha256,
    "v2 does not bind the loaded v1 profile");
  const shape = compareProfileShape(v1, v2, {
    expectedCanonicalRendererCount,
    expectedChangedAssetCount,
  });

  const hashed = await mapLimit(v2.entries, hashConcurrency, async (entry) => {
    const bytes = await readFile(storagePathFor(workspaceRoot, entry));
    invariant(bytes.length === entry.bytes, `${entry.assetPath} byte length mismatch`);
    invariant(sha256(bytes) === entry.sha256, `${entry.assetPath} SHA-256 mismatch`);
    return bytes.length;
  });

  let bitmapRendererCount = 0;
  let bitmapOccurrenceCount = 0;
  let uniqueBitmapBytes = 0;
  const uniqueBitmaps = new Map();
  for (const assetPath of shape.changed) {
    const candidate = v2.entries.find((entry) => entry.assetPath === assetPath);
    invariant(candidate, `missing v2 entry for ${assetPath}`);
    const candidateBytes = await readFile(storagePathFor(workspaceRoot, candidate));
    assertAdaptiveRuntime(candidateBytes, assetPath);
    const baselineBytes = await readBaselineRenderer({
      workspaceRoot,
      baselinePublicRoot,
      baselineRef,
      relativePath: candidate.relativePath,
    });
    const baselineEntry = v1.entries.find((entry) => entry.assetPath === assetPath);
    invariant(baselineEntry, `missing v1 entry for ${assetPath}`);
    invariant(baselineBytes.length === baselineEntry.bytes,
      `${assetPath} baseline bytes do not match v1`);
    invariant(sha256(baselineBytes) === baselineEntry.sha256,
      `${assetPath} baseline SHA-256 does not match v1`);
    const before = extractEmbeddedBitmapInventory(baselineBytes, `${assetPath} v1`);
    const after = extractEmbeddedBitmapInventory(candidateBytes, `${assetPath} v2`);
    invariant(before.length === after.length && before.every((row, index) => row === after[index]),
      `${assetPath} changed embedded bitmap bytes or MIME bindings`);
    if (PAGE_RENDERER.test(assetPath)) {
      if (after.length > 0) bitmapRendererCount += 1;
      bitmapOccurrenceCount += after.length;
      for (const row of after) {
        const [, bytes, digest] = row.split(" ");
        uniqueBitmaps.set(digest, Number(bytes));
      }
    }
  }
  for (const bytes of uniqueBitmaps.values()) uniqueBitmapBytes += bytes;
  invariant(bitmapRendererCount === expectedBitmapClosure.rendererCount,
    `bitmap renderer count is ${bitmapRendererCount}, expected ${expectedBitmapClosure.rendererCount}`);
  invariant(bitmapOccurrenceCount === expectedBitmapClosure.occurrenceCount,
    `bitmap occurrence count is ${bitmapOccurrenceCount}, expected ${expectedBitmapClosure.occurrenceCount}`);
  invariant(uniqueBitmaps.size === expectedBitmapClosure.uniqueBitmapCount,
    `unique bitmap count is ${uniqueBitmaps.size}, expected ${expectedBitmapClosure.uniqueBitmapCount}`);
  invariant(uniqueBitmapBytes === expectedBitmapClosure.uniqueDecodedBytes,
    `unique decoded bitmap bytes are ${uniqueBitmapBytes}, expected ${expectedBitmapClosure.uniqueDecodedBytes}`);

  return Object.freeze({
    schemaVersion: 1,
    verifier: "verify-current-js-resolution-profile.mjs",
    status: "passed",
    baselineRef,
    profiles: {
      v1: {path: v1ProfilePath, fileSha256: sha256(v1Bytes), checksumSetSha256: v1.checksumSetSha256},
      v2: {path: v2ProfilePath, fileSha256: sha256(v2Bytes), checksumSetSha256: v2.checksumSetSha256},
    },
    counts: {
      ...v2.counts,
      canonicalRendererEntries: shape.rendererPaths.length,
      changedCanvasRuntimeEntries: shape.changed.length,
      unchangedEntries: v2.entries.length - shape.changed.length,
      verifiedResourceBytes: hashed.reduce((sum, bytes) => sum + bytes, 0),
    },
    bitmapClosure: {
      rendererCount: bitmapRendererCount,
      occurrenceCount: bitmapOccurrenceCount,
      uniqueBitmapCount: uniqueBitmaps.size,
      uniqueDecodedBytes: uniqueBitmapBytes,
      disposition: "source-bytes-unchanged-no-ai-no-sharpen-no-redraw",
    },
    changedAssetPathsSha256: sha256(Buffer.from([...shape.changed].sort().join("\n"))),
  });
}

function parseArgs(argv) {
  const options = {
    workspaceRoot: path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."),
    v1ProfilePath: DEFAULT_V1_PROFILE,
    v2ProfilePath: DEFAULT_V2_PROFILE,
    baselineRef: DEFAULT_BASELINE_REF,
    baselinePublicRoot: null,
    reportPath: DEFAULT_REPORT,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const name = argv[index];
    const value = argv[index + 1];
    invariant(value !== undefined, `${name} requires a value`);
    if (name === "--workspace-root") options.workspaceRoot = path.resolve(value);
    else if (name === "--v1-profile") options.v1ProfilePath = value;
    else if (name === "--v2-profile") options.v2ProfilePath = value;
    else if (name === "--baseline-ref") options.baselineRef = value;
    else if (name === "--baseline-public-root") options.baselinePublicRoot = path.resolve(value);
    else if (name === "--report") options.reportPath = value;
    else throw new Error(`unknown argument ${name}`);
    index += 1;
  }
  return options;
}

async function writeBoundReport(workspaceRoot, reportPath, report) {
  const body = {
    ...report,
    evidenceSha256: sha256(Buffer.from(stableJson(report))),
  };
  const bytes = Buffer.from(`${JSON.stringify(body, null, 2)}\n`);
  const absolute = path.resolve(workspaceRoot, reportPath);
  await mkdir(path.dirname(absolute), {recursive: true});
  await writeFile(absolute, bytes);
  return {absolute, fileSha256: sha256(bytes)};
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  try {
    const result = await verifyCurrentJsResolutionProfile(options);
    const receipt = await writeBoundReport(options.workspaceRoot, options.reportPath, result);
    console.log(JSON.stringify({status: "passed", report: receipt.absolute, reportSha256: receipt.fileSha256}));
  } catch (error) {
    const failure = {
      schemaVersion: 1,
      verifier: "verify-current-js-resolution-profile.mjs",
      status: "failed",
      error: error instanceof Error ? error.message : String(error),
    };
    const receipt = await writeBoundReport(options.workspaceRoot, options.reportPath, failure);
    console.error(JSON.stringify({status: "failed", report: receipt.absolute, reportSha256: receipt.fileSha256, error: failure.error}));
    process.exitCode = 2;
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  await main();
}
