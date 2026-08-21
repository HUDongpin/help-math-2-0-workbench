#!/usr/bin/env node

import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {constants as fsConstants} from "node:fs";
import {
  lstat,
  open,
  readFile,
  realpath,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import {TextDecoder} from "node:util";
import {fileURLToPath} from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
export const PROJECT_ROOT = path.resolve(path.dirname(scriptPath), "..");
export const OUTPUT_PREFIX =
  "catalog/source-promotions/g4-missing-mp3-resolution-plan-v2";

const OUTPUT_MODE = 0o444;
const NOFOLLOW = fsConstants.O_NOFOLLOW ?? 0;
const UTF8 = new TextDecoder("utf-8", {fatal: true});
const SHA256 = /^[a-f0-9]{64}$/u;

const RELATED_ROOT = "/Volumes/WestWorld/HELP MATH Related Files";
const DRIVE_INTAKE_ROOT = path.join(RELATED_ROOT, "Google Drive Source Intake");
const QUARANTINE_ROOT = path.join(
  DRIVE_INTAKE_ROOT,
  "2026-08-02-HELP-ELM-FINAL-Dec21-2015",
);
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
  predecessorBuilder: {
    path: "scripts/build-g4-missing-mp3-resolution-plan-v1.mjs",
    bytes: 44_727,
    sha256: "d66f099bbcccf7e939914f184532eff9f4023880b20e7e20dacf7456fc96c8e8",
    mode: "0644",
    kind: "text",
    publicPath: true,
  },
  predecessorTest: {
    path: "scripts/build-g4-missing-mp3-resolution-plan-v1.test.mjs",
    bytes: 11_219,
    sha256: "9245b4bde23a8af5e9a81c5419b696ce431b9a474c02dfd4a4435ef327b29778",
    mode: "0644",
    kind: "text",
    publicPath: true,
  },
  predecessorJson: {
    path: "catalog/source-promotions/g4-missing-mp3-resolution-plan-v1.json",
    bytes: 41_768,
    sha256: "1ae71b2ef098dde37885c89f351e55d29e2ee6d80140b2c6335c99e238b649fd",
    mode: "0644",
    kind: "json",
    publicPath: true,
  },
  predecessorMarkdown: {
    path: "catalog/source-promotions/g4-missing-mp3-resolution-plan-v1.md",
    bytes: 7_685,
    sha256: "e3e5eb78fa96ceb2230afc2f1d13aabfeff16dc61ac2120eeff47159b36655a7",
    mode: "0644",
    kind: "text",
    publicPath: true,
  },
  runtimeAlignment: {
    path: "catalog/alignments/g4-curriculum-runtime-dependency-map-v1.json",
    bytes: 2_272_953,
    sha256: "05357658e7c5f70b9d305ea64063130f1b1d816663748af45cfa1950319a670b",
    mode: "0644",
    kind: "json",
    publicPath: true,
  },
  successorV3: {
    path: "catalog/source-promotions/g4-runtime-dependency-successor-v3-2026-08-04.json",
    bytes: 23_456,
    sha256: "789ddbd809b8fb8a8d8e3d7ab4b5d3c7c5cddb81cb6f358133575dd63e8ad07f",
    mode: "0644",
    kind: "json",
    publicPath: true,
  },
  sourceCatalog: {
    path: "catalog/source-files.json",
    bytes: 1_894_761,
    sha256: "c5ba348ea968b4ae7292d86f7624a77ec105bc8f929bd61b4837c59623f33b29",
    mode: "0644",
    kind: "json",
    publicPath: true,
  },
  historicalTechnicalCrosswalk: {
    path: "private-archive/historical-office-catalog-2026-07-25/technical-source-crosswalk.json",
    bytes: 891_921,
    sha256: "43f7d983a0b81b85e3f4e0ff682cae876936409f3a65ae58e3a5bfa49a70f1e4",
    mode: "0400",
    kind: "json",
    publicPath: false,
    artifactToken: "historical-technical-crosswalk-2026-07-25",
  },
});

const EXTERNAL_INPUTS = Object.freeze({
  quarantineReadme: {
    absolutePath: path.join(QUARANTINE_ROOT, "README.md"),
    name: "README.md",
    bytes: 9_784,
    sha256: "fd3f300739e63e84b9a263d724fdbeda55dd3a1b4eee077b472de5228cc76f5e",
    mode: "0444",
    kind: "text",
    artifactToken: "grade4-quarantine-readme-2026-08-02",
  },
  quarantineReceipt: {
    absolutePath: path.join(QUARANTINE_ROOT, "manifests", "intake-receipt.json"),
    name: "manifests/intake-receipt.json",
    bytes: 7_858,
    sha256: "3633334999488f1df0c95fc7bece4669d7d9db86845f1aeab1924fd560802fd4",
    mode: "0444",
    kind: "json",
    artifactToken: "grade4-quarantine-intake-receipt-2026-08-02",
  },
  quarantineGrade4Manifest: {
    absolutePath: path.join(QUARANTINE_ROOT, "manifests", "elmgr4-files.json"),
    name: "manifests/elmgr4-files.json",
    bytes: 798_533,
    sha256: "27c0dc167ed771ffa4f560d71f03f4e373c0d08ff3a52d2868db2bdef11ede4c",
    mode: "0444",
    kind: "json",
    artifactToken: "grade4-quarantine-file-manifest-2026-08-02",
  },
  closureReceipt: {
    absolutePath: path.join(CLOSURE_ROOT, "combined-freeze-applied-receipt-v1.json"),
    name: "combined-freeze-applied-receipt-v1.json",
    bytes: 8_375,
    sha256: "fd0ae61d347ab71abdc68581a2fb89761358f7d9fb1f7e5f8dc8326a54d8f751",
    mode: "0400",
    kind: "json",
    artifactToken: "frozen-v7-v8-combined-closure-receipt",
  },
  closureManifest: {
    absolutePath: path.join(CLOSURE_ROOT, "combined-freeze-manifest-v1.jsonl"),
    name: "combined-freeze-manifest-v1.jsonl",
    bytes: 3_231_021,
    sha256: "1be3672f9a9337982b6b37cb2bce4a298a2f855a95ac3ba5f31e9443372926a4",
    mode: "0400",
    kind: "text",
    artifactToken: "frozen-v7-v8-combined-content-manifest",
  },
});

const EXPECTED = Object.freeze({
  obligationCount: 16,
  englishFinalQuizCount: 8,
  spanishOrdinaryCount: 8,
  lessonCounts: Object.freeze({L2: 14, L6: 1, L8: 1}),
  predecessorMissingPathSetSha256:
    "439fce1e41ef10591c165f0eed65638d1a7afc81080db182770911bd1d8c4286",
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
  sourceDependencyClosure: false,
  javascriptImplementation: false,
  authoritativeOriginalRuntimeEvidence: false,
  runtimeFidelity: false,
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
  return Object.fromEntries(Object.keys(value).sort()
    .map((key) => [key, stable(value[key])]));
}

export function stableJson(value) {
  return `${JSON.stringify(stable(value), null, 2)}\n`;
}

function assertNoUndefined(value, location = "$") {
  assert.notEqual(value, undefined, `Undefined value at ${location}`);
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
    `${label}: expected an ordinary directory`);
  assert.equal(await realpath(lexical), lexical,
    `${label}: directory resolves through a symlink`);
  return {absolutePath: lexical, info};
}

async function readStableBoundFile(absolutePath, expected, label) {
  const lexical = path.resolve(absolutePath);
  const before = await lstat(lexical, {bigint: true});
  assert.ok(before.isFile() && !before.isSymbolicLink() && before.nlink === 1n,
    `${label}: expected one ordinary non-linked file`);
  assert.equal(await realpath(lexical), lexical,
    `${label}: file resolves through a symlink`);
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
  const canonicalRoot = (await canonicalDirectory(projectRoot, "project root")).absolutePath;
  const absolute = path.resolve(canonicalRoot, specification.path);
  assert.ok(isWithin(canonicalRoot, absolute), `${key}: project path escapes root`);
  assert.equal(path.relative(canonicalRoot, absolute).split(path.sep).join("/"),
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

function publicBinding(record) {
  const base = {
    role: record.key,
    bytes: record.bytes,
    sha256: record.sha256,
    mode: record.mode,
  };
  if (record.specification.publicPath) {
    return {...base, path: record.specification.path};
  }
  return {
    ...base,
    artifactToken: record.specification.artifactToken,
    name: record.specification.name ?? path.posix.basename(record.specification.path),
  };
}

function validatePredecessor(plan) {
  assert.equal(plan.schemaVersion,
    "help-math-g4-missing-mp3-resolution-plan/v1");
  assert.equal(plan.artifactType, "g4-missing-mp3-resolution-plan-v1");
  assert.equal(plan.status, "acceptance-neutral-required-sources-unresolved");
  assert.equal(plan.mode, "resolution-plan-only-no-executor");
  assert.equal(plan.summary.obligationCount, EXPECTED.obligationCount);
  assert.equal(plan.summary.expectedSha256KnownCount, 0);
  assert.equal(plan.summary.expectedSha256UnknownCount, EXPECTED.obligationCount);
  assert.equal(plan.summary.selectedCandidateCount, 0);
  assert.equal(plan.summary.promotionRecordCount, 0);
  assert.deepEqual(plan.summary.lessonCounts, EXPECTED.lessonCounts);
  assert.equal(plan.summary.englishFinalQuizCount, EXPECTED.englishFinalQuizCount);
  assert.equal(plan.summary.spanishOrdinaryCount, EXPECTED.spanishOrdinaryCount);
  assert.equal(plan.obligations.length, EXPECTED.obligationCount);
  assert.equal(missingPathSetSha256(plan.obligations),
    EXPECTED.predecessorMissingPathSetSha256);
  assert.ok(plan.obligations.every((item) =>
    item.expectedSha256 === null && item.expectedBytes === null &&
    item.selectedCandidate === null && item.exactSha256CandidateCount === 0));
  assert.equal(plan.controls.executable, false);
  assert.equal(plan.controls.executorPresent, false);
  assert.equal(plan.controls.writeOrApplySupported, false);
  assert.deepEqual(plan.promotionRecords, []);
  assert.ok(Object.values(plan.acceptanceEffects).every((value) => value === false));
  return true;
}

function missingPathSetSha256(records) {
  const paths = records.map(({canonicalPath}) => canonicalPath).sort(compareText);
  return sha256(`${paths.join("\n")}\n`);
}

function validateV1SourceBindings(plan, records) {
  const expected = {
    runtimeAlignment: records.runtimeAlignment,
    successorV3: records.successorV3,
    currentSourceCatalog: records.sourceCatalog,
  };
  for (const [bindingKey, record] of Object.entries(expected)) {
    assert.equal(plan.sourceBindings[bindingKey].bytes, record.bytes, bindingKey);
    assert.equal(plan.sourceBindings[bindingKey].sha256, record.sha256, bindingKey);
  }
  assert.equal(plan.sourceBindings.historicalTechnicalCrosswalk.bytes,
    records.historicalTechnicalCrosswalk.bytes);
  assert.equal(plan.sourceBindings.historicalTechnicalCrosswalk.sha256,
    records.historicalTechnicalCrosswalk.sha256);
  return true;
}

function decodeManifestPath(encoded, label) {
  assert.equal(typeof encoded, "string", `${label}: missing Base64 path`);
  const bytes = Buffer.from(encoded, "base64");
  assert.equal(bytes.toString("base64"), encoded, `${label}: non-canonical Base64 path`);
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
    assert.ok(SHA256.test(value.sha256));
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
    assert.equal(keySet.has(key), false, `duplicate closure path: ${index + 1}`);
    if (priorKey !== null) assert.ok(compareText(priorKey, key) < 0,
      `closure manifest ordering drifted at row ${index + 1}`);
    keySet.add(key);
    priorKey = key;
    records.push({...value, relativePath});
  }
  const rootCounts = Object.fromEntries(["v7", "v8"].map((root) => [
    root,
    records.filter((recordItem) => recordItem.root === root).length,
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
  }, `${rootLabel} frozen root identity drifted`);
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
  const candidateLower = candidatePath.toLowerCase();
  const targetLower = canonicalTarget.toLowerCase();
  const caseInsensitiveSuffix = candidateLower === targetLower ||
    candidateLower.endsWith(`/${targetLower}`);
  const basename = path.posix.basename(candidateLower) ===
    path.posix.basename(targetLower);
  return {exactSuffix, caseInsensitiveSuffix, basename};
}

async function readLedgerRecord({rootLabel, root, manifestRecord, targetRows}) {
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
  for (const target of targetRows) {
    for (const [field, candidatePath] of [
      ["drive-root-relative", drivePath],
      ["source-relative", sourcePath],
    ]) {
      const projection = pathMatchProjection(candidatePath, target.canonicalPath);
      if (projection.exactSuffix || projection.caseInsensitiveSuffix ||
          projection.basename) {
        matches.push({
          obligationId: target.obligationId,
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
    sourcePathBytesBase64: document.firstObservedSource.relativePathBytesBase64,
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
  const ledgerRecords = parsedManifest.records.filter((record) =>
    record.relativePath.startsWith(ROOT_EXPECTATIONS[record.root].ledgerPrefix));
  const byRootCounts = Object.fromEntries(["v7", "v8"].map((rootLabel) => [
    rootLabel,
    ledgerRecords.filter((record) => record.root === rootLabel).length,
  ]));
  assert.deepEqual(byRootCounts, {
    v7: EXPECTED.v7LedgerCount,
    v8: EXPECTED.v8LedgerCount,
  });
  const rows = await mapConcurrent(ledgerRecords, 16, async (manifestRecord) =>
    readLedgerRecord({
      rootLabel: manifestRecord.root,
      root: rootStates[manifestRecord.root].absolutePath,
      manifestRecord,
      targetRows: targets,
    }));
  verifyObjectManifestBindings(rows, manifestMap);
  const v7 = summarizeRootLedger("v7", rows.filter(({root}) => root === "v7"));
  const v8 = summarizeRootLedger("v8", rows.filter(({root}) => root === "v8"));
  const union = summarizeUnion(v7, v8);
  const receiptLedger = closureReceipt.ledgerClosure;
  assert.deepEqual({
    ledgerCount: v7.ledgerCount,
    objectCount: v7.objectCount,
    objectBytes: v7.objectBytes,
    digestSetSha256: v7.digestSetSha256,
    ledgerBindingSetSha256: v7.ledgerBindingSetSha256,
    rootedObjectSetSha256: v7.rootedObjectSetSha256,
    rootedObjectAndLedgerSetSha256: v7.rootedObjectAndLedgerSetSha256,
  }, {
    ledgerCount: receiptLedger.v7.ledgerCount,
    objectCount: receiptLedger.v7.objectCount,
    objectBytes: receiptLedger.v7.objectBytes,
    digestSetSha256: receiptLedger.v7.digestSetSha256,
    ledgerBindingSetSha256: receiptLedger.v7.ledgerBindingSetSha256,
    rootedObjectSetSha256: receiptLedger.v7.rootedObjectSetSha256,
    rootedObjectAndLedgerSetSha256:
      receiptLedger.v7.rootedObjectAndLedgerSetSha256,
  });
  assert.deepEqual({
    ledgerCount: v8.ledgerCount,
    objectCount: v8.objectCount,
    objectBytes: v8.objectBytes,
    digestSetSha256: v8.digestSetSha256,
    ledgerBindingSetSha256: v8.ledgerBindingSetSha256,
    rootedObjectSetSha256: v8.rootedObjectSetSha256,
    rootedObjectAndLedgerSetSha256: v8.rootedObjectAndLedgerSetSha256,
  }, {
    ledgerCount: receiptLedger.v8.ledgerCount,
    objectCount: receiptLedger.v8.objectCount,
    objectBytes: receiptLedger.v8.objectBytes,
    digestSetSha256: receiptLedger.v8.digestSetSha256,
    ledgerBindingSetSha256: receiptLedger.v8.ledgerBindingSetSha256,
    rootedObjectSetSha256: receiptLedger.v8.rootedObjectSetSha256,
    rootedObjectAndLedgerSetSha256:
      receiptLedger.v8.rootedObjectAndLedgerSetSha256,
  });
  assert.deepEqual(union, {
    v7ObjectCount: receiptLedger.union.v7ObjectCount,
    v8ObjectCount: receiptLedger.union.v8ObjectCount,
    overlapCount: receiptLedger.union.overlapCount,
    uniqueSha256Count: receiptLedger.union.uniqueSha256Count,
    digestSetSha256: receiptLedger.union.digestSetSha256,
    rootedObjectSetSha256: receiptLedger.union.rootedObjectSetSha256,
    rootedObjectAndLedgerSetSha256:
      receiptLedger.union.rootedObjectAndLedgerSetSha256,
  });

  const matches = rows.flatMap(({matches: rowMatches}) => rowMatches);
  const privatePathProjectionSha256 = sha256(`${rows
    .map((row) => `${row.root}\t${row.sha256}\t${row.privatePathProjectionSha256}`)
    .join("\n")}\n`);
  const {publicRows: _v7PublicRows, ...v7Summary} = v7;
  const {publicRows: _v8PublicRows, ...v8Summary} = v8;
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
  assert.equal(receipt.unresolved.grade4MissingMp3Count, EXPECTED.obligationCount);
  assert.equal(receipt.claims.canonicalPromotion, false);
  assert.equal(receipt.claims.audioCorrectnessOrAcceptance, false);
  return true;
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
  const predecessor = projectRecords.predecessorJson.document;
  validatePredecessor(predecessor);
  validateV1SourceBindings(predecessor, projectRecords);
  assert.equal(predecessor.sourceBindings.quarantine20260802.readme.sha256,
    externalRecords.quarantineReadme.sha256);
  assert.equal(predecessor.sourceBindings.quarantine20260802.intakeReceipt.sha256,
    externalRecords.quarantineReceipt.sha256);
  assert.equal(predecessor.sourceBindings.quarantine20260802.grade4Manifest.sha256,
    externalRecords.quarantineGrade4Manifest.sha256);
  assert.equal(predecessor.sourceBindings.frozenV7V8Closure.sha256,
    externalRecords.closureReceipt.sha256);
  const closureReceipt = externalRecords.closureReceipt.document;
  validateClosureReceipt(closureReceipt, externalRecords.closureManifest);
  const targets = predecessor.obligations.map((item) => ({
    obligationId: item.obligationId,
    canonicalPath: item.canonicalPath,
  }));
  const ledgerScan = await scanFrozenLedgers({
    closureManifest: externalRecords.closureManifest,
    closureReceipt,
    targets,
  });
  return {
    projectRoot,
    projectRecords,
    externalRecords,
    predecessor,
    closureReceipt,
    ledgerScan,
  };
}

function inputSetSha256(report) {
  return sha256(canonicalJson({
    sourceBindings: report.sourceBindings,
    predecessorSha256: report.successorOf.sha256,
    closureManifestSha256: report.frozenLedgerEvidence.closureManifest.sha256,
    unionDigestSetSha256: report.frozenLedgerEvidence.union.digestSetSha256,
    privatePathProjectionSha256:
      report.frozenLedgerEvidence.privatePathProjectionSha256,
  }));
}

function obligationRows(predecessor, scan) {
  return predecessor.obligations.map((item) => {
    const matches = scan.matches.filter((match) =>
      match.obligationId === item.obligationId);
    const exactSuffixMatches = matches.filter(({exactSuffix}) => exactSuffix);
    const caseInsensitiveSuffixMatches = matches.filter(({caseInsensitiveSuffix}) =>
      caseInsensitiveSuffix);
    const basenameMatches = matches.filter(({basename}) => basename);
    return {
      obligationId: item.obligationId,
      lesson: item.lesson,
      language: item.language,
      audioBindingKind: item.audioBindingKind,
      canonicalPath: item.canonicalPath,
      requiredBy: item.requiredBy,
      predecessorDisposition: item.disposition,
      expectedSha256: null,
      expectedBytes: null,
      predecessorCheckedScopeBasenameObserved:
        item.basenameDiscoveryOnly.observed,
      frozenV7V8LedgerDiscovery: {
        exactCanonicalSuffixCaseSensitiveMatchCount: exactSuffixMatches.length,
        exactCanonicalSuffixCaseInsensitiveMatchCount:
          caseInsensitiveSuffixMatches.length,
        basenameCaseInsensitiveMatchCount: basenameMatches.length,
        candidateObjectCount: new Set(matches.map(({objectSha256}) =>
          objectSha256)).size,
        selectedCandidate: null,
        admissionAuthority: false,
      },
      disposition:
        "blocked-expected-identity-unknown-and-no-v7-v8-ledger-path-candidate",
      nextRequiredAuthority:
        "owner-authorized hash-bound Grade 4 source evidence establishing the exact expected SHA-256 and byte count; filename or path similarity is insufficient",
    };
  });
}

export function deriveReport(snapshot) {
  const projectBindings = Object.fromEntries(Object.keys(snapshot.projectRecords).sort()
    .map((key) => [key, publicBinding(snapshot.projectRecords[key])]));
  const externalBindings = Object.fromEntries(Object.keys(snapshot.externalRecords).sort()
    .map((key) => [key, publicBinding(snapshot.externalRecords[key])]));
  const obligations = obligationRows(snapshot.predecessor, snapshot.ledgerScan);
  const report = {
    schemaVersion: 2,
    artifactType: "g4-missing-mp3-resolution-plan-v2",
    planDate: "2026-08-07",
    status: "acceptance-neutral-v7-v8-ledger-exhausted-missing-16-unresolved",
    mode: "resolution-plan-successor-only-no-executor",
    successorOf: {
      path: PROJECT_INPUTS.predecessorJson.path,
      bytes: snapshot.projectRecords.predecessorJson.bytes,
      sha256: snapshot.projectRecords.predecessorJson.sha256,
      artifactType: snapshot.predecessor.artifactType,
      status: snapshot.predecessor.status,
      missingPathSetSha256: missingPathSetSha256(snapshot.predecessor.obligations),
    },
    summary: {
      obligationCount: obligations.length,
      expectedSha256KnownCount: 0,
      expectedSha256UnknownCount: obligations.length,
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
      sourceDependencyClosure: false,
      outcome:
        "all-16-obligations-remain-unresolved-and-the-frozen-6060-object-ledger-adds-zero-path-candidates",
    },
    distribution: structuredClone(snapshot.predecessor.distribution),
    controls: {
      planOnly: true,
      executable: false,
      executorPresent: false,
      applySupported: false,
      sourceAssetsMutationAuthorized: false,
      sourceAssetsMutationPerformed: false,
      quarantineMutationPerformed: false,
      frozenV7V8MutationPerformed: false,
      frozenObjectBytesReadByThisSuccessor: false,
      allFrozenLedgerFilesRehashed: true,
      allFrozenLedgerPathFieldsParsedFromRetainedBuffers: true,
      rawPrivatePathsEmitted: 0,
      filenameOrPathAdmissionUsed: false,
      reviewTaskCreated: false,
      phaseAOrPhaseBRun: false,
      originalRuntimeLaunched: false,
      helperExecuted: false,
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
        "This successor rehashes all 6,060 ledger JSON files and checks their frozen object manifest bindings. It does not rehash the 6,060 object payload files and does not replace the closure's still-missing independent review receipt.",
    },
    obligations,
    recoveryProtocol: structuredClone(snapshot.predecessor.recoveryProtocol),
    promotionRecords: [],
    sourceBindings: {
      project: projectBindings,
      externalPrivateTokens: externalBindings,
    },
    inputSetSha256: null,
    acceptanceEffects: structuredClone(ACCEPTANCE_EFFECTS),
  };
  report.inputSetSha256 = inputSetSha256(report);
  report.reportFingerprintSha256 = reportFingerprint(report);
  validateResolutionPlanV2(report);
  return report;
}

export function validateResolutionPlanV2(report) {
  assertNoUndefined(report);
  assert.equal(report.schemaVersion, 2);
  assert.equal(report.artifactType, "g4-missing-mp3-resolution-plan-v2");
  assert.equal(report.status,
    "acceptance-neutral-v7-v8-ledger-exhausted-missing-16-unresolved");
  assert.equal(report.mode, "resolution-plan-successor-only-no-executor");
  assert.equal(report.successorOf.sha256, PROJECT_INPUTS.predecessorJson.sha256);
  assert.equal(report.successorOf.missingPathSetSha256,
    EXPECTED.predecessorMissingPathSetSha256);
  assert.equal(report.summary.obligationCount, EXPECTED.obligationCount);
  assert.equal(report.summary.expectedSha256KnownCount, 0);
  assert.equal(report.summary.expectedSha256UnknownCount, EXPECTED.obligationCount);
  assert.equal(report.summary.v7V8LedgerFileCount, EXPECTED.unionLedgerCount);
  assert.equal(report.summary.v7V8PathFieldCount, EXPECTED.pathFieldCount);
  assert.equal(report.summary.exactCanonicalSuffixMatchCount, 0);
  assert.equal(report.summary.caseInsensitiveCanonicalSuffixMatchCount, 0);
  assert.equal(report.summary.basenameMatchCount, 0);
  assert.equal(report.summary.candidateObjectCount, 0);
  assert.equal(report.summary.selectedCandidateCount, 0);
  assert.equal(report.summary.promotionRecordCount, 0);
  assert.equal(report.summary.sourceDependencyClosure, false);
  assert.deepEqual(report.distribution.byLesson, EXPECTED.lessonCounts);
  assert.equal(report.obligations.length, EXPECTED.obligationCount);
  assert.ok(report.obligations.every((item) =>
    item.expectedSha256 === null && item.expectedBytes === null &&
    item.frozenV7V8LedgerDiscovery
      .exactCanonicalSuffixCaseSensitiveMatchCount === 0 &&
    item.frozenV7V8LedgerDiscovery
      .exactCanonicalSuffixCaseInsensitiveMatchCount === 0 &&
    item.frozenV7V8LedgerDiscovery.basenameCaseInsensitiveMatchCount === 0 &&
    item.frozenV7V8LedgerDiscovery.candidateObjectCount === 0 &&
    item.frozenV7V8LedgerDiscovery.selectedCandidate === null &&
    item.frozenV7V8LedgerDiscovery.admissionAuthority === false));
  assert.deepEqual(report.promotionRecords, []);
  assert.equal(report.controls.executable, false);
  assert.equal(report.controls.executorPresent, false);
  assert.equal(report.controls.applySupported, false);
  assert.equal(report.controls.frozenObjectBytesReadByThisSuccessor, false);
  assert.equal(report.controls.allFrozenLedgerFilesRehashed, true);
  assert.equal(report.controls.rawPrivatePathsEmitted, 0);
  assert.equal(report.controls.filenameOrPathAdmissionUsed, false);
  assert.equal(report.frozenLedgerEvidence.manifestRecordCount,
    EXPECTED.manifestRecordCount);
  assert.deepEqual(report.frozenLedgerEvidence.manifestRootCounts,
    EXPECTED.manifestRootCounts);
  assert.equal(report.frozenLedgerEvidence.objectManifestBindingsChecked,
    EXPECTED.unionLedgerCount);
  assert.equal(report.frozenLedgerEvidence.pathFieldCount, EXPECTED.pathFieldCount);
  assert.equal(report.frozenLedgerEvidence.v7.ledgerCount, EXPECTED.v7LedgerCount);
  assert.equal(report.frozenLedgerEvidence.v7.objectBytes, EXPECTED.v7ObjectBytes);
  assert.equal(report.frozenLedgerEvidence.v7.digestSetSha256,
    EXPECTED.v7DigestSetSha256);
  assert.equal(report.frozenLedgerEvidence.v7.ledgerBindingSetSha256,
    EXPECTED.v7LedgerBindingSetSha256);
  assert.equal(report.frozenLedgerEvidence.v8.ledgerCount, EXPECTED.v8LedgerCount);
  assert.equal(report.frozenLedgerEvidence.v8.objectBytes, EXPECTED.v8ObjectBytes);
  assert.equal(report.frozenLedgerEvidence.v8.digestSetSha256,
    EXPECTED.v8DigestSetSha256);
  assert.equal(report.frozenLedgerEvidence.v8.ledgerBindingSetSha256,
    EXPECTED.v8LedgerBindingSetSha256);
  assert.equal(report.frozenLedgerEvidence.union.uniqueSha256Count,
    EXPECTED.unionLedgerCount);
  assert.equal(report.frozenLedgerEvidence.union.overlapCount, 0);
  assert.equal(report.frozenLedgerEvidence.union.digestSetSha256,
    EXPECTED.unionDigestSetSha256);
  assert.equal(report.frozenLedgerEvidence.union.rootedObjectSetSha256,
    EXPECTED.unionRootedObjectSetSha256);
  assert.equal(report.frozenLedgerEvidence.union.rootedObjectAndLedgerSetSha256,
    EXPECTED.unionRootedObjectAndLedgerSetSha256);
  assert.ok(SHA256.test(report.frozenLedgerEvidence.privatePathProjectionSha256));
  assert.ok(Object.values(report.acceptanceEffects).every((value) => value === false));
  assert.equal(report.inputSetSha256, inputSetSha256(report));
  assert.ok(SHA256.test(report.reportFingerprintSha256));
  assert.equal(report.reportFingerprintSha256, reportFingerprint(report));
  const serialized = stableJson(report);
  assert.doesNotMatch(serialized, /\/Volumes\//u);
  assert.doesNotMatch(serialized, /firstObserved|relativePathBytesBase64|DriveFolderId/u);
  assert.doesNotMatch(serialized, /private-archive\//u);
  assert.doesNotMatch(serialized,
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/iu);
  assert.deepEqual(JSON.parse(serialized), stable(report));
  return true;
}

export function renderMarkdown(report) {
  validateResolutionPlanV2(report);
  return `# Grade 4 Missing MP3 Resolution Plan v2\n\n` +
    `- Status: \`${report.status}\`\n` +
    `- Missing obligations: ${report.summary.obligationCount}\n` +
    `- Frozen ledgers rehashed: ${report.summary.v7V8LedgerFileCount}\n` +
    `- Private path fields scanned: ${report.summary.v7V8PathFieldCount}\n` +
    `- Exact canonical-suffix matches: ${report.summary.exactCanonicalSuffixMatchCount}\n` +
    `- Case-insensitive canonical-suffix matches: ${report.summary.caseInsensitiveCanonicalSuffixMatchCount}\n` +
    `- Basename matches: ${report.summary.basenameMatchCount}\n` +
    `- Candidate objects: ${report.summary.candidateObjectCount}\n` +
    `- Selected candidates: ${report.summary.selectedCandidateCount}\n` +
    `- Promotion records: ${report.summary.promotionRecordCount}\n` +
    `- Union digest-set SHA-256: \`${report.frozenLedgerEvidence.union.digestSetSha256}\`\n` +
    `- Private path-projection SHA-256: \`${report.frozenLedgerEvidence.privatePathProjectionSha256}\`\n` +
    `- Report fingerprint SHA-256: \`${report.reportFingerprintSha256}\`\n\n` +
    `## Result\n\n` +
    `All ${report.summary.obligationCount} required Grade 4 MP3 identities remain ` +
    `unknown. Rehashing all ${report.summary.v7V8LedgerFileCount} frozen v7/v8 ` +
    `ledger files and scanning ${report.summary.v7V8PathFieldCount} bound private ` +
    `path fields produced zero suffix or basename candidates. This is bounded ` +
    `evidence for the frozen ledger universe, not proof of universal nonexistence.\n\n` +
    `## Boundary\n\n` +
    `No object payload was read, copied, selected, or promoted. Filename and path ` +
    `discovery provide no admission authority. A future candidate requires ` +
    `owner-authorized Grade 4 source evidence that establishes the exact expected ` +
    `SHA-256 and byte count, followed by a new reviewed successor plan. This report ` +
    `creates no runtime, audio acceptance, human, owner, strict-completion, ` +
    `integration, release, or publication effect.\n`;
}

function snapshotProjection(snapshot) {
  return {
    project: Object.fromEntries(Object.entries(snapshot.projectRecords)
      .map(([key, record]) => [key, publicBinding(record)])),
    external: Object.fromEntries(Object.entries(snapshot.externalRecords)
      .map(([key, record]) => [key, publicBinding(record)])),
    ledgerScan: snapshot.ledgerScan,
  };
}

async function assertSnapshotCurrent(snapshot) {
  const current = await readSnapshot(snapshot.projectRoot);
  assert.deepEqual(snapshotProjection(current), snapshotProjection(snapshot),
    "missing-MP3 successor inputs or frozen ledger scan changed after snapshot");
}

export function parseArguments(args) {
  assert.equal(args.length, 1, "choose exactly one: --write or --check");
  assert.ok(["--write", "--check"].includes(args[0]),
    `Unknown option ${args[0]}; apply and runtime modes are unsupported`);
  return args[0];
}

async function resolveOutput(projectRoot, suffix) {
  const canonicalRoot = (await canonicalDirectory(projectRoot, "project root")).absolutePath;
  const relative = `${OUTPUT_PREFIX}.${suffix}`;
  const absolute = path.resolve(canonicalRoot, relative);
  assert.ok(isWithin(canonicalRoot, absolute));
  const parent = path.dirname(absolute);
  assert.equal(await realpath(parent), parent, "output parent resolves through a symlink");
  try {
    const info = await lstat(absolute, {bigint: true});
    assert.ok(info.isFile() && !info.isSymbolicLink() && info.nlink === 1n,
      `${relative}: existing output is not one ordinary file`);
    assert.equal(await realpath(absolute), absolute,
      `${relative}: existing output resolves through a symlink`);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  return {relative, absolute};
}

export async function writeNoClobber(absolute, contents) {
  await writeFile(absolute, Buffer.from(contents, "utf8"), {
    flag: "wx",
    mode: OUTPUT_MODE,
  });
  const info = await lstat(absolute, {bigint: true});
  assert.ok(info.isFile() && !info.isSymbolicLink() && info.nlink === 1n);
  assert.equal(modeString(info), "0444");
  assert.equal(await realpath(absolute), absolute);
  assert.deepEqual(await readFile(absolute), Buffer.from(contents, "utf8"));
}

async function checkOutput(absolute, contents) {
  const info = await lstat(absolute, {bigint: true});
  assert.ok(info.isFile() && !info.isSymbolicLink() && info.nlink === 1n);
  assert.equal(modeString(info), "0444");
  assert.equal(await realpath(absolute), absolute);
  assert.deepEqual(await readFile(absolute), Buffer.from(contents, "utf8"));
}

export async function runCli(args = process.argv.slice(2), projectRoot = PROJECT_ROOT) {
  const mode = parseArguments(args);
  const snapshot = await readSnapshot(projectRoot);
  const report = deriveReport(snapshot);
  const json = stableJson(report);
  const markdown = renderMarkdown(report);
  await assertSnapshotCurrent(snapshot);
  const jsonOutput = await resolveOutput(projectRoot, "json");
  const markdownOutput = await resolveOutput(projectRoot, "md");
  if (mode === "--write") {
    await writeNoClobber(markdownOutput.absolute, markdown);
    await writeNoClobber(jsonOutput.absolute, json);
    await assertSnapshotCurrent(snapshot);
    return {mode, report, outputs: [jsonOutput.relative, markdownOutput.relative]};
  }
  await checkOutput(markdownOutput.absolute, markdown);
  await checkOutput(jsonOutput.absolute, json);
  await assertSnapshotCurrent(snapshot);
  return {mode, report, outputs: [jsonOutput.relative, markdownOutput.relative]};
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  runCli().then((result) => {
    process.stdout.write(`${result.mode === "--write" ? "WROTE" : "CHECKED"} ` +
      `${result.outputs.join(" ")}\n`);
  }).catch((error) => {
    process.stderr.write(`FAIL-CLOSED: ${error.stack ?? error.message}\n`);
    process.exitCode = 1;
  });
}
