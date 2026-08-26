#!/usr/bin/env node

import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {constants as fsConstants} from "node:fs";
import {
  chmod,
  lstat,
  open,
  readFile,
  realpath,
} from "node:fs/promises";
import path from "node:path";
import {TextDecoder} from "node:util";
import {fileURLToPath} from "node:url";

import {
  deriveReport as deriveV1Report,
  readSnapshot as readV1Snapshot,
  stableJson as stableV1Json,
  validateResolutionPlanV1,
} from "./build-g4-key-term-runtime-resolution-plan-v1.mjs";

const scriptPath = fileURLToPath(import.meta.url);
export const PROJECT_ROOT = path.resolve(path.dirname(scriptPath), "..");
export const OUTPUT_PREFIX =
  "catalog/source-promotions/g4-key-term-runtime-resolution-plan-v2";

const OUTPUT_MODE = 0o444;
const NOFOLLOW = fsConstants.O_NOFOLLOW ?? 0;
const UTF8 = new TextDecoder("utf-8", {fatal: true});
const SHA256_PATTERN = /^[a-f0-9]{64}$/u;
const KEY_TERM_PREFIX = "HELP_KEYTERMS/KT/ELEMENTARY/DIG/";

const DRIVE_INTAKE_ROOT =
  "/Volumes/WestWorld/HELP MATH Related Files/Google Drive Source Intake";
const FROZEN_ROOTS = Object.freeze({
  v7: path.join(
    DRIVE_INTAKE_ROOT,
    "2026-08-02-BOULDER-LEARNING-HELP-MATH-1-HISTORICAL",
  ),
  v8: path.join(
    DRIVE_INTAKE_ROOT,
    "2026-08-03-BOULDER-LEARNING-HELP-MATH-1-HISTORICAL-SUCCESSOR-V8",
  ),
});
const CLOSURE_ROOT = path.join(
  DRIVE_INTAKE_ROOT,
  "2026-08-04-BOULDER-LEARNING-V7-V8-COMBINED-FREEZE-CLOSURE",
);

const PROJECT_INPUTS = Object.freeze({
  predecessorBuilder: Object.freeze({
    path: "scripts/build-g4-key-term-runtime-resolution-plan-v1.mjs",
    bytes: 54_320,
    sha256: "19f19d9fe6909076414988e823ff436a9d56903bd9732b86d907c6d073ac64a4",
    mode: "0644",
    kind: "text",
  }),
  predecessorTest: Object.freeze({
    path: "scripts/build-g4-key-term-runtime-resolution-plan-v1.test.mjs",
    bytes: 10_521,
    sha256: "1b589ffd8c0707e75eca57d449229aab10a3d2794e35f90785b1135492d95b6f",
    mode: "0644",
    kind: "text",
  }),
  predecessorJson: Object.freeze({
    path: "catalog/source-promotions/g4-key-term-runtime-resolution-plan-v1.json",
    bytes: 314_850,
    sha256: "66b47caf4822b213066a39885d1258f99054e4c00186835b1086dd303f69faaa",
    mode: "0444",
    kind: "json",
  }),
  predecessorMarkdown: Object.freeze({
    path: "catalog/source-promotions/g4-key-term-runtime-resolution-plan-v1.md",
    bytes: 1_657,
    sha256: "3cc3da06e390c1cbbc91553984feaf87250ae0265ea349819d8149c7eab8fc71",
    mode: "0444",
    kind: "text",
  }),
});

const EXTERNAL_INPUTS = Object.freeze({
  closureReceipt: Object.freeze({
    absolutePath: path.join(CLOSURE_ROOT, "combined-freeze-applied-receipt-v1.json"),
    bytes: 8_375,
    sha256: "fd0ae61d347ab71abdc68581a2fb89761358f7d9fb1f7e5f8dc8326a54d8f751",
    mode: "0400",
    kind: "json",
    artifactToken: "frozen-v7-v8-combined-closure-receipt",
  }),
  closureManifest: Object.freeze({
    absolutePath: path.join(CLOSURE_ROOT, "combined-freeze-manifest-v1.jsonl"),
    bytes: 3_231_021,
    sha256: "1be3672f9a9337982b6b37cb2bce4a298a2f855a95ac3ba5f31e9443372926a4",
    mode: "0400",
    kind: "text",
    artifactToken: "frozen-v7-v8-combined-content-manifest",
  }),
});

const EXPECTED = Object.freeze({
  targetCount: 317,
  quarantineCandidateCount: 316,
  exactPlacementReviewCount: 17,
  caseVariantReviewCount: 299,
  unresolvedRuntimeCount: 1,
  manifestRecordCount: 12_323,
  manifestRootCounts: Object.freeze({v7: 11_761, v8: 562}),
  v7LedgerCount: 5_793,
  v8LedgerCount: 267,
  unionLedgerCount: 6_060,
  pathFieldCount: 12_120,
  v7ObjectBytes: 6_185_764_941,
  v8ObjectBytes: 5_876_648_196,
  v7DigestSetSha256:
    "79e833ace96a921bc3791b55269388c76846cfe5fc97ce1c87d55b2151117f5b",
  v8DigestSetSha256:
    "8ea2d700f0ccb8d7eec33b8ae20ee07c0df6133dab96991e833725168022e7bc",
  unionDigestSetSha256:
    "705c93bd496e8979e14a10b66e3cb376c1f00d9d417a6c4a6acc4790169ac9ed",
  v7LedgerBindingSetSha256:
    "87fc25a75e7f0a52f8af377966c71331d0157044aa013ccb29e7ac5539d5c734",
  v8LedgerBindingSetSha256:
    "e1cca49d20754b8bf78089ccb1530cf2dee6601175034c33440dffa9b8326668",
  unionRootedObjectSetSha256:
    "4c788433c8c8a3ceaf1f3b17e709adf1a30f3d4dd607f9e524c7479d0047801d",
  unionRootedObjectAndLedgerSetSha256:
    "3349bf069781367a07612e988767970f65ae452c5343ca9beb1b916ee0a0ccbd",
  missingPathSetSha256:
    "10a4fb0f80281395066ef730d2f5fe4d0a504a43b70f4a2cb95f2e42c856dc99",
  v1ReportFingerprintSha256:
    "ca67ea117c084ab543d18ffcbf7a1afcee25b645bfbffefcdba42509afa14b11",
});

const ROOT_EXPECTATIONS = Object.freeze({
  v7: Object.freeze({
    device: "16777244",
    inode: "3908052",
    ownerUid: "501",
    groupGid: "20",
    mode: "0500",
    ledgerPrefix: "manifests/drive-dedupe-ledger/sha256/",
  }),
  v8: Object.freeze({
    device: "16777244",
    inode: "4235735",
    ownerUid: "501",
    groupGid: "20",
    mode: "0500",
    ledgerPrefix: "manifests/drive-dedupe-ledger-v8/sha256/",
  }),
});

const ACCEPTANCE_EFFECTS = Object.freeze({
  canonicalSourcePromotion: false,
  runtimeDependencyClosure: false,
  javascriptImplementation: false,
  authoritativeOriginalRuntimeEvidence: false,
  runtimeFidelity: false,
  keyTermLanguageOrDiagramAcceptance: false,
  audioCorrectnessOrAcceptance: false,
  humanVisualAcceptance: false,
  ownerAcceptance: false,
  strictCompletion: false,
  wholeCourseIntegration: false,
  publication: false,
});

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function compareText(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) =>
      `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort(compareText)
    .map((key) => [key, stable(value[key])]));
}

export function stableJson(value) {
  return `${JSON.stringify(stable(value), null, 2)}\n`;
}

function assertNoUndefined(value, location = "$") {
  assert.notEqual(value, undefined, `undefined value at ${location}`);
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoUndefined(item, `${location}[${index}]`));
  } else if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) {
      assertNoUndefined(item, `${location}.${key}`);
    }
  }
}

function reportFingerprint(report) {
  const projection = structuredClone(report);
  delete projection.reportFingerprintSha256;
  assertNoUndefined(projection);
  return sha256(canonicalJson(projection));
}

function modeString(info) {
  return Number(info.mode & 0o777n).toString(8).padStart(4, "0");
}

function nodeIdentity(info) {
  return `${info.dev}:${info.ino}`;
}

function statIdentity(info) {
  return [info.dev, info.ino, info.size, info.mtimeNs, info.ctimeNs]
    .map(String).join(":");
}

function isWithin(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return relative === "" ||
    (!relative.startsWith("..") && !path.isAbsolute(relative));
}

async function canonicalDirectory(absolutePath, label) {
  const lexical = path.resolve(absolutePath);
  const info = await lstat(lexical, {bigint: true});
  assert.ok(info.isDirectory() && !info.isSymbolicLink(),
    `${label}: expected ordinary directory`);
  assert.equal(await realpath(lexical), lexical,
    `${label}: directory resolves through symlink`);
  return {absolutePath: lexical, info};
}

async function readStableBoundFile(absolutePath, expected, label) {
  const lexical = path.resolve(absolutePath);
  const before = await lstat(lexical, {bigint: true});
  assert.ok(before.isFile() && !before.isSymbolicLink() && before.nlink === 1n,
    `${label}: expected one ordinary non-linked file`);
  assert.equal(await realpath(lexical), lexical,
    `${label}: file resolves through symlink`);
  const handle = await open(lexical, fsConstants.O_RDONLY | NOFOLLOW);
  try {
    const opened = await handle.stat({bigint: true});
    assert.equal(nodeIdentity(opened), nodeIdentity(before),
      `${label}: path identity changed before read`);
    const bytes = await handle.readFile();
    const [afterOpen, afterPath] = await Promise.all([
      handle.stat({bigint: true}),
      lstat(lexical, {bigint: true}),
    ]);
    assert.equal(statIdentity(afterOpen), statIdentity(opened),
      `${label}: descriptor changed while read`);
    assert.equal(statIdentity(afterPath), statIdentity(opened),
      `${label}: pathname changed while read`);
    assert.equal(BigInt(bytes.length), afterOpen.size,
      `${label}: byte count changed while read`);
    const record = {
      bytes: bytes.length,
      sha256: sha256(bytes),
      mode: modeString(afterOpen),
      contents: bytes,
    };
    assert.equal(record.bytes, expected.bytes, `${label}: byte count drifted`);
    assert.equal(record.sha256, expected.sha256, `${label}: SHA-256 drifted`);
    assert.equal(record.mode, expected.mode, `${label}: mode drifted`);
    if (expected.kind === "json") {
      record.document = JSON.parse(UTF8.decode(bytes));
    }
    return record;
  } finally {
    await handle.close();
  }
}

async function readProjectInput(projectRoot, key, specification) {
  const root = (await canonicalDirectory(projectRoot, "project root")).absolutePath;
  const absolute = path.resolve(root, specification.path);
  assert.ok(isWithin(root, absolute), `${key}: project path escapes root`);
  assert.equal(path.relative(root, absolute).split(path.sep).join("/"),
    specification.path, `${key}: project path is not normalized`);
  return {
    key,
    specification,
    ...(await readStableBoundFile(absolute, specification, key)),
  };
}

async function readExternalInput(key, specification) {
  return {
    key,
    specification,
    ...(await readStableBoundFile(specification.absolutePath, specification, key)),
  };
}

function publicBinding(record, external = false) {
  const base = {
    role: record.key,
    bytes: record.bytes,
    sha256: record.sha256,
    mode: record.mode,
  };
  return external
    ? {...base, artifactToken: record.specification.artifactToken}
    : {...base, path: record.specification.path};
}

function pathSetSha256(paths) {
  return sha256(`${[...paths].sort(compareText).join("\n")}\n`);
}

function decodeManifestPath(encoded, label) {
  assert.equal(typeof encoded, "string", `${label}: missing Base64 path`);
  const bytes = Buffer.from(encoded, "base64");
  assert.equal(bytes.toString("base64"), encoded,
    `${label}: non-canonical Base64 path`);
  const decoded = UTF8.decode(bytes);
  assert.equal(decoded.includes("\0"), false, `${label}: NUL in path`);
  return decoded;
}

function parseClosureManifest(record) {
  const text = UTF8.decode(record.contents);
  assert.ok(text.endsWith("\n"), "closure manifest lacks final LF");
  assert.equal(text.includes("\r"), false, "closure manifest contains CR bytes");
  const lines = text.slice(0, -1).split("\n");
  assert.equal(lines.length, EXPECTED.manifestRecordCount,
    "closure manifest record count drifted");
  const records = [];
  const keySet = new Set();
  let priorKey = null;
  for (let index = 0; index < lines.length; index += 1) {
    const value = JSON.parse(lines[index]);
    assert.deepEqual(Object.keys(value), [
      "root", "relativePathBytesBase64", "bytes", "sha256",
    ], `closure manifest row ${index + 1} shape drifted`);
    assert.ok(["v7", "v8"].includes(value.root));
    assert.ok(Number.isSafeInteger(value.bytes) && value.bytes >= 0);
    assert.match(value.sha256, SHA256_PATTERN);
    const relativePath = decodeManifestPath(
      value.relativePathBytesBase64,
      `closure manifest row ${index + 1}`,
    );
    assert.equal(path.posix.isAbsolute(relativePath), false);
    assert.equal(relativePath.includes("\\"), false);
    assert.equal(path.posix.normalize(relativePath), relativePath);
    assert.ok(relativePath !== "." && relativePath !== ".." &&
      !relativePath.startsWith("../"));
    const key = `${value.root}\0${relativePath}`;
    assert.equal(keySet.has(key), false, `duplicate closure path ${index + 1}`);
    if (priorKey !== null) assert.ok(compareText(priorKey, key) < 0,
      `closure manifest ordering drifted at row ${index + 1}`);
    keySet.add(key);
    priorKey = key;
    records.push({...value, relativePath});
  }
  const rootCounts = Object.fromEntries(["v7", "v8"].map((root) => [
    root,
    records.filter((item) => item.root === root).length,
  ]));
  assert.deepEqual(rootCounts, EXPECTED.manifestRootCounts);
  return {records, rootCounts};
}

async function validateFrozenRoot(rootLabel) {
  const expected = ROOT_EXPECTATIONS[rootLabel];
  const {absolutePath, info} = await canonicalDirectory(
    FROZEN_ROOTS[rootLabel],
    `${rootLabel} frozen root`,
  );
  const identity = {
    device: String(info.dev),
    inode: String(info.ino),
    ownerUid: String(info.uid),
    groupGid: String(info.gid),
    mode: modeString(info),
  };
  assert.deepEqual(identity, {
    device: expected.device,
    inode: expected.inode,
    ownerUid: expected.ownerUid,
    groupGid: expected.groupGid,
    mode: expected.mode,
  }, `${rootLabel}: frozen root identity drifted`);
  return {absolutePath, identity};
}

function validatePathBinding(value, label) {
  assert.equal(typeof value?.relativePath, "string", `${label}: missing path`);
  const decoded = decodeManifestPath(value.relativePathBytesBase64, label);
  assert.equal(decoded, value.relativePath, `${label}: path/Base64 mismatch`);
  return value.relativePath.replaceAll("\\", "/");
}

function pathMatchProjection(candidatePath, canonicalTarget) {
  const exactSuffix = candidatePath === canonicalTarget ||
    candidatePath.endsWith(`/${canonicalTarget}`);
  const candidateLower = candidatePath.toLocaleLowerCase("en-US");
  const targetLower = canonicalTarget.toLocaleLowerCase("en-US");
  const caseInsensitiveSuffix = candidateLower === targetLower ||
    candidateLower.endsWith(`/${targetLower}`);
  const basename = path.posix.basename(candidateLower) ===
    path.posix.basename(targetLower);
  return {exactSuffix, caseInsensitiveSuffix, basename};
}

async function readLedgerRecord({rootLabel, root, manifestRecord, targetByBasename}) {
  const expectedRoot = ROOT_EXPECTATIONS[rootLabel];
  const relative = manifestRecord.relativePath;
  assert.ok(relative.startsWith(expectedRoot.ledgerPrefix));
  const remainder = relative.slice(expectedRoot.ledgerPrefix.length);
  const match = /^([a-f0-9]{2})\/([a-f0-9]{64})\.json$/u.exec(remainder);
  assert.ok(match, `${rootLabel}: invalid ledger path in frozen manifest`);
  const [, shard, objectSha256] = match;
  assert.equal(shard, objectSha256.slice(0, 2));
  const absolute = path.resolve(root, relative);
  assert.ok(isWithin(root, absolute));
  const observed = await readStableBoundFile(absolute, {
    bytes: manifestRecord.bytes,
    sha256: manifestRecord.sha256,
    mode: "0400",
  }, `${rootLabel} ledger ${objectSha256}`);
  const document = JSON.parse(UTF8.decode(observed.contents));
  assert.equal(document.schemaVersion, "help-math-drive-dedupe-object-ledger/v1");
  assert.equal(document.state, "installed-and-verified");
  assert.equal(document.sha256, objectSha256);
  assert.ok(Number.isSafeInteger(document.bytes) && document.bytes >= 0);
  assert.equal(document.objectMode, "0600");
  assert.equal(document.policy.identity, "complete SHA-256 plus byte count");
  assert.deepEqual(document.claims, {
    acceptance: false,
    byteIdentityOnly: true,
    canonicalPromotion: false,
    publication: false,
    runtimeFidelity: false,
  });
  const expectedObjectPath =
    `downloads/sha256/${objectSha256.slice(0, 2)}/${objectSha256}`;
  assert.equal(document.objectRelativePath, expectedObjectPath);

  const drivePath = validatePathBinding(
    document.firstObservedDriveRootRelativePath,
    `${rootLabel} ${objectSha256} Drive path`,
  );
  const sourcePath = validatePathBinding(
    document.firstObservedSource,
    `${rootLabel} ${objectSha256} source path`,
  );
  const matches = [];
  for (const [field, candidatePath] of [
    ["drive-root-relative", drivePath],
    ["source-relative", sourcePath],
  ]) {
    const candidates = targetByBasename.get(
      path.posix.basename(candidatePath).toLocaleLowerCase("en-US"),
    ) ?? [];
    for (const target of candidates) {
      const projection = pathMatchProjection(candidatePath, target.expectedRuntimePath);
      if (projection.exactSuffix || projection.caseInsensitiveSuffix ||
          projection.basename) {
        matches.push({
          expectedRuntimePath: target.expectedRuntimePath,
          root: rootLabel,
          field,
          objectSha256,
          bytes: document.bytes,
          ...projection,
        });
      }
    }
  }
  const privatePathProjectionSha256 = sha256(canonicalJson({
    root: rootLabel,
    objectSha256,
    drivePathBytesBase64:
      document.firstObservedDriveRootRelativePath.relativePathBytesBase64,
    sourcePathBytesBase64:
      document.firstObservedSource.relativePathBytesBase64,
  }));
  return {
    root: rootLabel,
    sha256: objectSha256,
    bytes: document.bytes,
    objectRelativePath: document.objectRelativePath,
    ledgerSha256: observed.sha256,
    privatePathProjectionSha256,
    pathFieldCount: 2,
    matches,
  };
}

async function mapConcurrent(values, limit, mapper) {
  const results = new Array(values.length);
  let next = 0;
  async function worker() {
    while (next < values.length) {
      const index = next;
      next += 1;
      results[index] = await mapper(values[index], index);
    }
  }
  await Promise.all(Array.from({length: Math.min(limit, values.length)}, worker));
  return results;
}

function summarizeRootLedger(rootLabel, rows) {
  const publicRows = rows.map((row) => ({
    sha256: row.sha256,
    bytes: row.bytes,
    objectRelativePath: row.objectRelativePath,
    ledgerSha256: row.ledgerSha256,
  })).sort((left, right) => compareText(left.sha256, right.sha256));
  assert.equal(new Set(publicRows.map(({sha256: digest}) => digest)).size,
    publicRows.length, `${rootLabel}: duplicate object digest`);
  const digests = publicRows.map(({sha256: digest}) => digest);
  const rowText = `${publicRows.map((row) => JSON.stringify(row)).join("\n")}\n`;
  const rootedObjectText = `${publicRows.map((row) =>
    `${rootLabel}\t${row.sha256}\t${row.bytes}`).join("\n")}\n`;
  const rootedLedgerText = `${publicRows.map((row) =>
    `${rootLabel}\t${row.sha256}\t${row.bytes}\t${row.ledgerSha256}`)
    .join("\n")}\n`;
  return {
    root: rootLabel,
    ledgerCount: publicRows.length,
    objectCount: publicRows.length,
    objectBytes: publicRows.reduce((sum, row) => sum + row.bytes, 0),
    digestSetSha256: sha256(`${digests.join("\n")}\n`),
    ledgerBindingSetSha256: sha256(rowText),
    rootedObjectSetSha256: sha256(rootedObjectText),
    rootedObjectAndLedgerSetSha256: sha256(rootedLedgerText),
    publicRows,
  };
}

function summarizeUnion(v7, v8) {
  const v7Set = new Set(v7.publicRows.map(({sha256: digest}) => digest));
  const v8Set = new Set(v8.publicRows.map(({sha256: digest}) => digest));
  const overlap = [...v7Set].filter((digest) => v8Set.has(digest));
  assert.equal(overlap.length, 0, "v7/v8 ledger SHA-256 sets overlap");
  const combinedRows = [
    ...v7.publicRows.map((row) => ({root: "v7", ...row})),
    ...v8.publicRows.map((row) => ({root: "v8", ...row})),
  ].sort((left, right) => compareText(left.root, right.root) ||
    compareText(left.sha256, right.sha256));
  const unionDigests = [...new Set(combinedRows.map(({sha256: digest}) => digest))]
    .sort(compareText);
  const rootedObjectText = `${combinedRows.map((row) =>
    `${row.root}\t${row.sha256}\t${row.bytes}`).join("\n")}\n`;
  const rootedLedgerText = `${combinedRows.map((row) =>
    `${row.root}\t${row.sha256}\t${row.bytes}\t${row.ledgerSha256}`)
    .join("\n")}\n`;
  return {
    v7ObjectCount: v7.objectCount,
    v8ObjectCount: v8.objectCount,
    overlapCount: overlap.length,
    uniqueSha256Count: unionDigests.length,
    digestSetSha256: sha256(`${unionDigests.join("\n")}\n`),
    rootedObjectSetSha256: sha256(rootedObjectText),
    rootedObjectAndLedgerSetSha256: sha256(rootedLedgerText),
  };
}

function verifyObjectManifestBindings(rows, manifestMap) {
  for (const row of rows) {
    const record = manifestMap.get(`${row.root}\0${row.objectRelativePath}`);
    assert.ok(record, `${row.root}: frozen object manifest binding is absent`);
    assert.equal(record.sha256, row.sha256,
      `${row.root}: object SHA-256 differs from frozen manifest`);
    assert.equal(record.bytes, row.bytes,
      `${row.root}: object bytes differ from frozen manifest`);
  }
}

function validateClosureReceipt(receipt, closureManifest) {
  assert.equal(receipt.schemaVersion,
    "help-math-drive-intake-combined-freeze-applied/v1");
  assert.equal(receipt.outcome,
    "frozen-read-only-with-unresolved-independent-review");
  assert.equal(receipt.recordManifest.bytes, closureManifest.bytes);
  assert.equal(receipt.recordManifest.sha256, closureManifest.sha256);
  assert.equal(receipt.ledgerClosure.v7.ledgerCount, EXPECTED.v7LedgerCount);
  assert.equal(receipt.ledgerClosure.v8.ledgerCount, EXPECTED.v8LedgerCount);
  assert.equal(receipt.ledgerClosure.union.uniqueSha256Count,
    EXPECTED.unionLedgerCount);
  assert.equal(receipt.ledgerClosure.union.digestSetSha256,
    EXPECTED.unionDigestSetSha256);
  assert.equal(receipt.lifecycle.independentReviewReceiptPresent, false);
  assert.equal(receipt.lifecycle.futureWritesRequireNewSuccessorRoot, true);
  assert.equal(receipt.claims.canonicalPromotion, false);
  assert.equal(receipt.claims.audioCorrectnessOrAcceptance, false);
}

async function scanFrozenLedgers({closureManifest, closureReceipt, targets}) {
  const parsedManifest = parseClosureManifest(closureManifest);
  const manifestMap = new Map(parsedManifest.records.map((record) => [
    `${record.root}\0${record.relativePath}`,
    record,
  ]));
  const rootStates = {
    v7: await validateFrozenRoot("v7"),
    v8: await validateFrozenRoot("v8"),
  };
  const targetByBasename = new Map();
  for (const target of targets) {
    const basename = path.posix.basename(target.expectedRuntimePath)
      .toLocaleLowerCase("en-US");
    const values = targetByBasename.get(basename) ?? [];
    values.push(target);
    targetByBasename.set(basename, values);
  }
  assert.equal(targetByBasename.size, targets.length,
    "Key Term target basenames are not unique");

  const ledgerRecords = parsedManifest.records.filter((record) =>
    record.relativePath.startsWith(ROOT_EXPECTATIONS[record.root].ledgerPrefix));
  assert.deepEqual(Object.fromEntries(["v7", "v8"].map((rootLabel) => [
    rootLabel,
    ledgerRecords.filter(({root}) => root === rootLabel).length,
  ])), {v7: EXPECTED.v7LedgerCount, v8: EXPECTED.v8LedgerCount});
  const rows = await mapConcurrent(ledgerRecords, 16, async (manifestRecord) =>
    readLedgerRecord({
      rootLabel: manifestRecord.root,
      root: rootStates[manifestRecord.root].absolutePath,
      manifestRecord,
      targetByBasename,
    }));
  verifyObjectManifestBindings(rows, manifestMap);
  const v7 = summarizeRootLedger("v7", rows.filter(({root}) => root === "v7"));
  const v8 = summarizeRootLedger("v8", rows.filter(({root}) => root === "v8"));
  const union = summarizeUnion(v7, v8);
  const receiptLedger = closureReceipt.ledgerClosure;
  for (const [rootLabel, summary] of [["v7", v7], ["v8", v8]]) {
    assert.deepEqual({
      root: summary.root,
      ledgerCount: summary.ledgerCount,
      objectCount: summary.objectCount,
      objectBytes: summary.objectBytes,
      digestSetSha256: summary.digestSetSha256,
      ledgerBindingSetSha256: summary.ledgerBindingSetSha256,
      rootedObjectSetSha256: summary.rootedObjectSetSha256,
      rootedObjectAndLedgerSetSha256: summary.rootedObjectAndLedgerSetSha256,
    }, receiptLedger[rootLabel]);
  }
  assert.deepEqual(union, receiptLedger.union);
  assert.equal(v7.objectBytes, EXPECTED.v7ObjectBytes);
  assert.equal(v8.objectBytes, EXPECTED.v8ObjectBytes);
  assert.equal(v7.digestSetSha256, EXPECTED.v7DigestSetSha256);
  assert.equal(v8.digestSetSha256, EXPECTED.v8DigestSetSha256);
  assert.equal(v7.ledgerBindingSetSha256, EXPECTED.v7LedgerBindingSetSha256);
  assert.equal(v8.ledgerBindingSetSha256, EXPECTED.v8LedgerBindingSetSha256);
  assert.equal(union.rootedObjectSetSha256, EXPECTED.unionRootedObjectSetSha256);
  assert.equal(union.rootedObjectAndLedgerSetSha256,
    EXPECTED.unionRootedObjectAndLedgerSetSha256);

  const matches = rows.flatMap(({matches: rowMatches}) => rowMatches);
  const privatePathProjectionSha256 = sha256(`${rows
    .map((row) => `${row.root}\t${row.sha256}\t${row.privatePathProjectionSha256}`)
    .join("\n")}\n`);
  const {publicRows: _v7Rows, ...v7Summary} = v7;
  const {publicRows: _v8Rows, ...v8Summary} = v8;
  return {
    rootIdentities: Object.fromEntries(Object.entries(rootStates)
      .map(([key, value]) => [key, value.identity])),
    manifestRecordCount: parsedManifest.records.length,
    manifestRootCounts: parsedManifest.rootCounts,
    ledgerFileCount: rows.length,
    pathFieldCount: rows.reduce((sum, row) => sum + row.pathFieldCount, 0),
    allLedgerFilesRehashed: true,
    objectFilesRehashedByThisSuccessor: 0,
    objectManifestBindingsChecked: rows.length,
    privatePathProjectionSha256,
    v7: v7Summary,
    v8: v8Summary,
    union,
    matches,
  };
}

function targetsFromV1(v1) {
  const reviewTargets = [
    ...v1.reviewBatches.exactPlacement.records,
    ...v1.reviewBatches.caseVariantPlacement.records,
  ].map((record) => ({
    expectedRuntimePath: record.expectedRuntimePath,
    occurrenceCount: record.occurrenceCount,
    v1Disposition: record.reviewClass,
    expectedSha256: record.expectedSha256,
    quarantineCandidate: {
      bytes: record.candidateRuntime.bytes,
      sha256: record.candidateRuntime.sha256,
      sameExactPlacement: record.candidateRuntime.sameExactPlacement,
    },
  }));
  const unresolvedTargets = v1.reviewBatches.unresolvedRuntime.records.map((record) => ({
    expectedRuntimePath: record.expectedRuntimePath,
    occurrenceCount: record.occurrenceCount,
    v1Disposition: record.status,
    expectedSha256: record.expectedSha256,
    quarantineCandidate: null,
  }));
  const targets = [...reviewTargets, ...unresolvedTargets]
    .sort((left, right) => compareText(left.expectedRuntimePath,
      right.expectedRuntimePath));
  assert.equal(targets.length, EXPECTED.targetCount);
  assert.equal(new Set(targets.map(({expectedRuntimePath}) => expectedRuntimePath)).size,
    EXPECTED.targetCount);
  assert.equal(pathSetSha256(targets.map(({expectedRuntimePath}) => expectedRuntimePath)),
    "2edaba9358fc008c0677e4fedf879dde3a3f3fb3b8ead68094b44e08b892437e");
  assert.equal(targets.filter(({quarantineCandidate}) => quarantineCandidate).length,
    EXPECTED.quarantineCandidateCount);
  assert.ok(targets.every(({expectedSha256}) => expectedSha256 === null));
  return targets;
}

export async function readSnapshot(projectRoot = PROJECT_ROOT) {
  const projectRecords = {};
  for (const [key, specification] of Object.entries(PROJECT_INPUTS)) {
    projectRecords[key] = await readProjectInput(projectRoot, key, specification);
  }
  const externalRecords = {};
  for (const [key, specification] of Object.entries(EXTERNAL_INPUTS)) {
    externalRecords[key] = await readExternalInput(key, specification);
  }

  const v1Snapshot = await readV1Snapshot(projectRoot);
  const liveV1 = deriveV1Report(v1Snapshot);
  assert.equal(validateResolutionPlanV1(liveV1), true);
  assert.equal(liveV1.reportFingerprintSha256,
    EXPECTED.v1ReportFingerprintSha256);
  assert.equal(stableV1Json(liveV1),
    `${JSON.stringify(projectRecords.predecessorJson.document, null, 2)}\n`,
    "checked-in Key Term v1 differs from live deterministic derivation");
  const predecessor = projectRecords.predecessorJson.document;
  const targets = targetsFromV1(predecessor);
  validateClosureReceipt(
    externalRecords.closureReceipt.document,
    externalRecords.closureManifest,
  );
  const ledgerScan = await scanFrozenLedgers({
    closureManifest: externalRecords.closureManifest,
    closureReceipt: externalRecords.closureReceipt.document,
    targets,
  });
  return {
    projectRoot,
    projectRecords,
    externalRecords,
    predecessor,
    targets,
    ledgerScan,
  };
}

function inputSetSha256(report) {
  return sha256(canonicalJson({
    sourceBindings: report.sourceBindings,
    predecessorFingerprint: report.successorOf.reportFingerprintSha256,
    closureManifestSha256: report.frozenLedgerEvidence.closureManifest.sha256,
    unionDigestSetSha256: report.frozenLedgerEvidence.union.digestSetSha256,
    privatePathProjectionSha256:
      report.frozenLedgerEvidence.privatePathProjectionSha256,
  }));
}

function obligationRows(targets, matches) {
  return targets.map((target) => {
    const targetMatches = matches.filter(({expectedRuntimePath}) =>
      expectedRuntimePath === target.expectedRuntimePath);
    const exact = targetMatches.filter(({exactSuffix}) => exactSuffix);
    const caseInsensitive = targetMatches.filter(({caseInsensitiveSuffix}) =>
      caseInsensitiveSuffix);
    const basename = targetMatches.filter(({basename: matched}) => matched);
    return {
      expectedRuntimePath: target.expectedRuntimePath,
      occurrenceCount: target.occurrenceCount,
      expectedSha256: null,
      v1Disposition: target.v1Disposition,
      quarantineCandidate: target.quarantineCandidate,
      frozenV7V8LedgerDiscovery: {
        exactCanonicalSuffixCaseSensitiveMatchCount: exact.length,
        exactCanonicalSuffixCaseInsensitiveMatchCount: caseInsensitive.length,
        basenameCaseInsensitiveMatchCount: basename.length,
        candidateObjectCount: new Set(targetMatches.map(({objectSha256}) =>
          objectSha256)).size,
        selectedCandidate: null,
        admissionAuthority: false,
      },
      disposition: target.quarantineCandidate
        ? "retain-v1-quarantine-review-hold-no-frozen-ledger-path-candidate"
        : "required-runtime-source-unresolved-no-frozen-ledger-path-candidate",
    };
  });
}

export function deriveReport(snapshot) {
  const projectBindings = Object.fromEntries(Object.keys(snapshot.projectRecords).sort()
    .map((key) => [key, publicBinding(snapshot.projectRecords[key])]));
  const externalBindings = Object.fromEntries(Object.keys(snapshot.externalRecords).sort()
    .map((key) => [key, publicBinding(snapshot.externalRecords[key], true)]));
  const obligations = obligationRows(snapshot.targets, snapshot.ledgerScan.matches);
  const report = {
    schemaVersion: "help-math-g4-key-term-runtime-resolution-plan/v2",
    artifactType: "g4-key-term-runtime-resolution-plan-v2",
    planDate: "2026-08-07",
    status:
      "acceptance-neutral-v7-v8-ledger-exhausted-316-holds-polynomial-runtime-unresolved",
    mode: "read-only-resolution-successor-no-executor",
    successorOf: {
      path: PROJECT_INPUTS.predecessorJson.path,
      bytes: snapshot.projectRecords.predecessorJson.bytes,
      sha256: snapshot.projectRecords.predecessorJson.sha256,
      artifactType: snapshot.predecessor.artifactType,
      status: snapshot.predecessor.status,
      reportFingerprintSha256: snapshot.predecessor.reportFingerprintSha256,
      missingPathSetSha256: snapshot.predecessor.resolutionSummary.missingPathSetSha256,
    },
    summary: {
      obligationCount: obligations.length,
      expectedRuntimeSha256AcceptedCount: 0,
      expectedRuntimeSha256UnacceptedCount: obligations.length,
      existingQuarantineReviewCandidateCount:
        obligations.filter(({quarantineCandidate}) => quarantineCandidate).length,
      v7V8LedgerFileCount: snapshot.ledgerScan.ledgerFileCount,
      v7V8PathFieldCount: snapshot.ledgerScan.pathFieldCount,
      exactCanonicalSuffixMatchCount: obligations.reduce((sum, item) => sum +
        item.frozenV7V8LedgerDiscovery
          .exactCanonicalSuffixCaseSensitiveMatchCount, 0),
      caseInsensitiveCanonicalSuffixMatchCount: obligations.reduce((sum, item) =>
        sum + item.frozenV7V8LedgerDiscovery
          .exactCanonicalSuffixCaseInsensitiveMatchCount, 0),
      basenameMatchCount: obligations.reduce((sum, item) => sum +
        item.frozenV7V8LedgerDiscovery.basenameCaseInsensitiveMatchCount, 0),
      candidateObjectCount: obligations.reduce((sum, item) => sum +
        item.frozenV7V8LedgerDiscovery.candidateObjectCount, 0),
      selectedCandidateCount: 0,
      promotionRecordCount: 0,
      exactPlacementReviewHolds: EXPECTED.exactPlacementReviewCount,
      caseVariantPlacementReviewHolds: EXPECTED.caseVariantReviewCount,
      unresolvedRuntimeSwfCount: EXPECTED.unresolvedRuntimeCount,
      sourceDependencyClosure: false,
      outcome:
        "all-317-key-term-gaps-add-zero-v7-v8-ledger-path-candidates-and-remain-unaccepted-or-unresolved",
    },
    controls: {
      planOnly: true,
      executable: false,
      executorPresent: false,
      applySupported: false,
      sourceAssetsMutationAuthorized: false,
      sourceAssetsMutationPerformed: false,
      frozenV7V8MutationPerformed: false,
      frozenObjectPayloadBytesReadByThisSuccessor: false,
      allFrozenLedgerFilesRehashed: true,
      allFrozenLedgerPathFieldsParsedFromRetainedBuffers: true,
      rawPrivatePathsEmitted: 0,
      filenameOrPathAdmissionUsed: false,
      automaticCaseNormalizationAuthorized: false,
      reviewTaskCreated: false,
      phaseAOrPhaseBRun: false,
      helperImplementedOrExecuted: false,
      originalRuntimeLaunched: false,
      promotionIntegrationReleaseOrPublicationPerformed: false,
    },
    frozenLedgerEvidence: {
      closureReceipt: externalBindings.closureReceipt,
      closureManifest: externalBindings.closureManifest,
      rootIdentities: snapshot.ledgerScan.rootIdentities,
      manifestRecordCount: snapshot.ledgerScan.manifestRecordCount,
      manifestRootCounts: snapshot.ledgerScan.manifestRootCounts,
      allLedgerFilesRehashed: snapshot.ledgerScan.allLedgerFilesRehashed,
      objectFilesRehashedByThisSuccessor:
        snapshot.ledgerScan.objectFilesRehashedByThisSuccessor,
      objectManifestBindingsChecked:
        snapshot.ledgerScan.objectManifestBindingsChecked,
      pathFieldCount: snapshot.ledgerScan.pathFieldCount,
      privatePathProjectionSha256:
        snapshot.ledgerScan.privatePathProjectionSha256,
      v7: snapshot.ledgerScan.v7,
      v8: snapshot.ledgerScan.v8,
      union: snapshot.ledgerScan.union,
      scopeBoundary:
        "This successor rehashes all 6,060 ledger JSON files and checks each ledger's frozen object-manifest binding. It does not read or rehash the 6,060 object payload files, does not admit by filename or path, and does not replace the closure's missing independent-review receipt.",
    },
    obligations,
    polynomialDisposition: {
      expectedRuntimePath: `${KEY_TERM_PREFIX}Polynomial.swf`,
      expectedSha256: null,
      v1QuarantineRuntimeCandidate: null,
      v7V8LedgerPathCandidateCount: 0,
      companionFlaSha256:
        "4281f3dbde526f0f7e8e445efd4f61893566ad6308c0236816d07baa16a89263",
      companionFlaDoesNotSubstituteForShippedRuntime: true,
      status: "required-runtime-source-unresolved",
    },
    promotionRecords: [],
    sourceBindings: {
      project: projectBindings,
      externalPrivateTokens: externalBindings,
    },
    inputSetSha256: null,
    acceptanceEffects: ACCEPTANCE_EFFECTS,
  };
  report.inputSetSha256 = inputSetSha256(report);
  report.reportFingerprintSha256 = reportFingerprint(report);
  validateResolutionPlanV2(report);
  return report;
}

export function validateResolutionPlanV2(report) {
  assertNoUndefined(report);
  assert.equal(report.schemaVersion,
    "help-math-g4-key-term-runtime-resolution-plan/v2");
  assert.equal(report.artifactType, "g4-key-term-runtime-resolution-plan-v2");
  assert.equal(report.mode, "read-only-resolution-successor-no-executor");
  assert.equal(report.successorOf.sha256, PROJECT_INPUTS.predecessorJson.sha256);
  assert.equal(report.successorOf.reportFingerprintSha256,
    EXPECTED.v1ReportFingerprintSha256);
  assert.equal(report.successorOf.missingPathSetSha256,
    EXPECTED.missingPathSetSha256);
  assert.equal(report.summary.obligationCount, EXPECTED.targetCount);
  assert.equal(report.summary.expectedRuntimeSha256AcceptedCount, 0);
  assert.equal(report.summary.expectedRuntimeSha256UnacceptedCount,
    EXPECTED.targetCount);
  assert.equal(report.summary.existingQuarantineReviewCandidateCount,
    EXPECTED.quarantineCandidateCount);
  assert.equal(report.summary.v7V8LedgerFileCount, EXPECTED.unionLedgerCount);
  assert.equal(report.summary.v7V8PathFieldCount, EXPECTED.pathFieldCount);
  assert.equal(report.summary.exactCanonicalSuffixMatchCount, 0);
  assert.equal(report.summary.caseInsensitiveCanonicalSuffixMatchCount, 0);
  assert.equal(report.summary.basenameMatchCount, 0);
  assert.equal(report.summary.candidateObjectCount, 0);
  assert.equal(report.summary.selectedCandidateCount, 0);
  assert.equal(report.summary.promotionRecordCount, 0);
  assert.equal(report.summary.exactPlacementReviewHolds,
    EXPECTED.exactPlacementReviewCount);
  assert.equal(report.summary.caseVariantPlacementReviewHolds,
    EXPECTED.caseVariantReviewCount);
  assert.equal(report.summary.unresolvedRuntimeSwfCount,
    EXPECTED.unresolvedRuntimeCount);
  assert.equal(report.summary.sourceDependencyClosure, false);
  assert.equal(report.obligations.length, EXPECTED.targetCount);
  assert.equal(report.obligations.filter(({quarantineCandidate}) =>
    quarantineCandidate).length, EXPECTED.quarantineCandidateCount);
  assert.ok(report.obligations.every((item) =>
    item.expectedSha256 === null &&
    item.frozenV7V8LedgerDiscovery
      .exactCanonicalSuffixCaseSensitiveMatchCount === 0 &&
    item.frozenV7V8LedgerDiscovery
      .exactCanonicalSuffixCaseInsensitiveMatchCount === 0 &&
    item.frozenV7V8LedgerDiscovery.basenameCaseInsensitiveMatchCount === 0 &&
    item.frozenV7V8LedgerDiscovery.candidateObjectCount === 0 &&
    item.frozenV7V8LedgerDiscovery.selectedCandidate === null &&
    item.frozenV7V8LedgerDiscovery.admissionAuthority === false));
  assert.equal(report.frozenLedgerEvidence.v7.ledgerCount, EXPECTED.v7LedgerCount);
  assert.equal(report.frozenLedgerEvidence.v8.ledgerCount, EXPECTED.v8LedgerCount);
  assert.equal(report.frozenLedgerEvidence.union.uniqueSha256Count,
    EXPECTED.unionLedgerCount);
  assert.equal(report.frozenLedgerEvidence.union.digestSetSha256,
    EXPECTED.unionDigestSetSha256);
  assert.equal(report.frozenLedgerEvidence.objectFilesRehashedByThisSuccessor, 0);
  assert.equal(report.controls.executable, false);
  assert.equal(report.controls.executorPresent, false);
  assert.equal(report.controls.applySupported, false);
  assert.equal(report.controls.filenameOrPathAdmissionUsed, false);
  assert.equal(report.controls.originalRuntimeLaunched, false);
  assert.deepEqual(report.promotionRecords, []);
  assert.ok(Object.values(report.acceptanceEffects).every((value) => value === false));
  assert.equal(report.inputSetSha256, inputSetSha256(report));
  assert.equal(report.reportFingerprintSha256, reportFingerprint(report));
  assert.deepEqual(JSON.parse(JSON.stringify(report)), report);
  return true;
}

export function renderMarkdown(report) {
  validateResolutionPlanV2(report);
  return `# Grade 4 Key Term runtime resolution plan v2\n\n` +
    `Status: **${report.status}**. This is a read-only successor with no executor ` +
    `and no promotion records.\n\n` +
    `## Frozen-ledger result\n\n` +
    `- Rehashed ${report.summary.v7V8LedgerFileCount.toLocaleString("en-US")} ` +
    `ledger JSON files and parsed ${report.summary.v7V8PathFieldCount.toLocaleString("en-US")} ` +
    `retained path fields.\n` +
    `- Checked all ${report.summary.obligationCount} currently missing Key Term ` +
    `runtime paths.\n` +
    `- Exact suffix matches: ${report.summary.exactCanonicalSuffixMatchCount}.\n` +
    `- Case-insensitive suffix matches: ` +
    `${report.summary.caseInsensitiveCanonicalSuffixMatchCount}.\n` +
    `- Case-insensitive basename matches: ${report.summary.basenameMatchCount}.\n` +
    `- Candidate objects: ${report.summary.candidateObjectCount}.\n\n` +
    `## Remaining disposition\n\n` +
    `- The 316 DIG quarantine candidates retain their v1 placement/SHA/receipt ` +
    `review holds; their known candidate hashes are not accepted expected-runtime identities.\n` +
    `- \`Polynomial.swf\` has neither a DIG runtime candidate nor a frozen-ledger ` +
    `path candidate. Its companion FLA is not a shipped-runtime substitute.\n` +
    `- Source dependency closure remains \`false\`.\n\n` +
    `## Authority boundary\n\n` +
    `No frozen payload object was read, no filename/path admission was used, and no ` +
    `review task, helper, original-runtime session, source mutation, promotion, ` +
    `acceptance, integration, release, or publication was performed. Report fingerprint: ` +
    `\`${report.reportFingerprintSha256}\`.\n`;
}

export async function writeNoClobber(absolutePath, contents) {
  const handle = await open(
    absolutePath,
    fsConstants.O_WRONLY | fsConstants.O_CREAT | fsConstants.O_EXCL | NOFOLLOW,
    OUTPUT_MODE,
  );
  try {
    await handle.writeFile(contents, {encoding: "utf8"});
    await handle.sync();
  } finally {
    await handle.close();
  }
  await chmod(absolutePath, OUTPUT_MODE);
  const info = await lstat(absolutePath, {bigint: true});
  assert.ok(info.isFile() && !info.isSymbolicLink() && info.nlink === 1n);
  assert.equal(modeString(info), "0444");
}

export function parseArguments(args) {
  assert.equal(args.length, 1,
    "choose exactly one of --write or --check; operational modes are unsupported");
  assert.ok(["--write", "--check"].includes(args[0]),
    "choose exactly one of --write or --check; operational modes are unsupported");
  return args[0];
}

export async function runCli(args = process.argv.slice(2), projectRoot = PROJECT_ROOT) {
  const mode = parseArguments(args);
  const snapshot = await readSnapshot(projectRoot);
  const report = deriveReport(snapshot);
  const json = stableJson(report);
  const markdown = renderMarkdown(report);
  const outputs = [`${OUTPUT_PREFIX}.json`, `${OUTPUT_PREFIX}.md`];
  const absoluteOutputs = outputs.map((output) => path.resolve(projectRoot, output));
  if (mode === "--write") {
    for (const output of absoluteOutputs) {
      await assert.rejects(readFile(output), (error) => error?.code === "ENOENT",
        `output already exists: ${output}`);
    }
    await writeNoClobber(absoluteOutputs[0], json);
    await writeNoClobber(absoluteOutputs[1], markdown);
  } else {
    assert.equal(await readFile(absoluteOutputs[0], "utf8"), json,
      "checked-in JSON differs from live deterministic report");
    assert.equal(await readFile(absoluteOutputs[1], "utf8"), markdown,
      "checked-in Markdown differs from live deterministic report");
  }
  return {mode, outputs, report};
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  runCli().then(({mode, outputs, report}) => {
    console.log(JSON.stringify({
      status: mode === "--write" ? "written" : "checked",
      outputs,
      targetCount: report.summary.obligationCount,
      ledgerCount: report.summary.v7V8LedgerFileCount,
      pathFieldCount: report.summary.v7V8PathFieldCount,
      candidateObjectCount: report.summary.candidateObjectCount,
      reportFingerprintSha256: report.reportFingerprintSha256,
    }, null, 2));
  }).catch((error) => {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  });
}
