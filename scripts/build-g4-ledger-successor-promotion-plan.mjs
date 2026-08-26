#!/usr/bin/env node

import { constants as fsConstants } from "node:fs";
import {
  chmod,
  link,
  lstat,
  open,
  readFile,
  unlink,
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  CLOSURE,
  DEFAULT_CLOSURE_ROOT,
  DEFAULT_ROOTS,
  parseRecordManifest,
  sha256Bytes,
} from "./freeze-drive-intake-v7-v8.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");
const defaultDigIntakeRoot = path.resolve(
  projectRoot,
  "..",
  "HELP MATH Related Files",
  "Google Drive Source Intake",
  "2026-08-02-HELP-ELM-FINAL-Dec21-2015",
);

export const OUTPUT_RELATIVE_PATH =
  "catalog/source-promotions/g4-runtime-dependency-successor-v3-2026-08-04.json";

export const REJECTED_V1_RELATIVE_PATH =
  "catalog/source-promotions/g4-runtime-dependency-successor-2026-08-04.json";

export const SUPERSEDED_V2_RELATIVE_PATH =
  "catalog/source-promotions/g4-runtime-dependency-successor-v2-2026-08-04.json";

const REPOSITORY_INPUTS = Object.freeze({
  sourceCatalog: "catalog/source-files.json",
  sourceChecksumSet: "catalog/source-files.sha256",
  sourceManifest: "catalog/source-manifest.sha256",
  sourceFreeze: "catalog/source-freeze.json",
  predecessorPlan: "catalog/source-promotions/g4-active-source-promotion-2026-08-02.json",
  predecessorApplied:
    "catalog/source-promotions/g4-active-source-promotion-2026-08-02-applied.json",
});

const EPOCH_INPUTS = Object.freeze({
  runtimeAlignment: "catalog/alignments/g4-curriculum-runtime-dependency-map-v1.json",
  sqlAggregate: "reports/g4-sql-course-aggregate.json",
  rejectedV1: REJECTED_V1_RELATIVE_PATH,
  supersededV2: SUPERSEDED_V2_RELATIVE_PATH,
});

const LEDGER_CONFIG = Object.freeze({
  v7: {
    ledgerPrefix: "manifests/drive-dedupe-ledger/sha256/",
    expectedCount: 5_793,
  },
  v8: {
    ledgerPrefix: "manifests/drive-dedupe-ledger-v8/sha256/",
    expectedCount: 267,
  },
});

const EXPECTED = Object.freeze({
  ledgerUnionCount: 6_060,
  canonicalFileCount: 9_147,
  canonicalTotalBytes: 3_214_585_414,
  canonicalManifestSha256:
    "f0a33c8a3d15afd7340e9ea5523385428bae7546bd8d4227a3a8977ab8914318",
  canonicalChecksumSetSha256:
    "30dfa12b7cd76e7200fb89115155e7d32af1356247c07e3a4f79227e93f34875",
  predecessorPlanSha256:
    "61fbb021fbab57c427e1c0459c30cf94a88b449d0080c125d616213687833a87",
  predecessorAppliedSha256:
    "df23e474a6a8ab632b5e7ed6928a485427ed8d1873fb846c2f79d06dfd0c0f72",
  predecessorCopyCount: 1_228,
  predecessorExistingCount: 883,
  missingCount: 16,
  missingPathSetSha256:
    "439fce1e41ef10591c165f0eed65638d1a7afc81080db182770911bd1d8c4286",
  runtimeAlignmentSha256:
    "05357658e7c5f70b9d305ea64063130f1b1d816663748af45cfa1950319a670b",
  sqlAggregateSha256:
    "7c8343e920cf3326125597bc905400952123942b1c77b383fd4fee07fe21e8b2",
  rejectedV1Sha256:
    "8bd2d9a721566ec511325f6dfae4ad0e3638093b0cdf25810ad8eb3dc0d4dabf",
  rejectedV1Bytes: 16_276,
  supersededV2Sha256:
    "5b6b743fb7c317812026352f67cfc0696a060a661d6c996ad85a3bcf59dd2226",
  supersededV2Bytes: 20_909,
  frozenAppliedReceiptSha256:
    "fd0ae61d347ab71abdc68581a2fb89761358f7d9fb1f7e5f8dc8326a54d8f751",
  frozenAppliedReceiptBytes: 8_375,
  frozenRecordManifestSha256:
    "1be3672f9a9337982b6b37cb2bce4a298a2f855a95ac3ba5f31e9443372926a4",
  frozenRecordManifestBytes: 3_231_021,
  frozenAppliedReceiptSidecarSha256:
    "fb8c00a90926b2ae2ae6d371781e9dc66e491dab10d2e6b99ea19a1c0c32c750",
  frozenAppliedReceiptSidecarBytes: 106,
  alignmentLessonCount: 12,
  alignmentPageCount: 645,
  alignmentShellCount: 12,
  alignmentSourceMemberCount: 657,
  alignmentQuizWrapperCount: 36,
  alignmentAudioExpected: 2_086,
  alignmentAudioPresent: 2_070,
  alignmentAudioMissing: 16,
  alignmentRuntimeIdentityRecordCount: 2_739,
  alignmentRuntimeIdentityUniqueSha256Count: 2_620,
  keyTermCaseVariantHolds: 299,
  keyTermExactPlacementHolds: 17,
  keyTermTotalCandidateHolds: 316,
  polynomialRuntimePath: "HELP_KEYTERMS/KT/ELEMENTARY/DIG/Polynomial.swf",
  polynomialCompanionFlaPath: "HELP_KEYTERMS/KT/ELEMENTARY/DIG/polynomial.fla",
  polynomialCompanionFlaBytes: 19_456,
  polynomialCompanionFlaSha256:
    "4281f3dbde526f0f7e8e445efd4f61893566ad6308c0236816d07baa16a89263",
  digIntakePlanPath: "private-quarantine/dig-intake-plan.json",
  digIntakePlanBytes: 1_975_727,
  digIntakePlanSha256:
    "2ab69de16a2ef27772e034bf951c53b09e28a58c1b93c88f0ec219243f2f2868",
});

const FALSE_ACCEPTANCE_EFFECTS = Object.freeze({
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

const NOFOLLOW = fsConstants.O_NOFOLLOW ?? 0;
const DIRECTORY = fsConstants.O_DIRECTORY ?? 0;

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function compareText(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function nodeIdentity(info) {
  return { dev: String(info.dev), ino: String(info.ino) };
}

function sameNode(left, right) {
  return left.dev === right.dev && left.ino === right.ino;
}

function portableRelative(value, label = "path") {
  invariant(typeof value === "string" && value.length > 0, `${label} must be non-empty`);
  invariant(!value.includes("\0") && !value.includes("\\"), `${label} contains a forbidden character`);
  invariant(!path.posix.isAbsolute(value), `${label} must be relative`);
  invariant(path.posix.normalize(value) === value, `${label} must already be normalized`);
  invariant(value !== "." && value !== ".." && !value.startsWith("../"), `${label} escapes its root`);
  return value;
}

function exactKeys(value, expectedKeys, label) {
  invariant(value && typeof value === "object" && !Array.isArray(value), `${label} must be an object`);
  invariant(
    JSON.stringify(Object.keys(value).sort(compareText))
      === JSON.stringify([...expectedKeys].sort(compareText)),
    `${label} fields changed`,
  );
}

function assertAllFalse(value, expected, label) {
  exactKeys(value, Object.keys(expected), label);
  for (const key of Object.keys(expected)) {
    invariant(value[key] === false, `${label}.${key} must remain false`);
  }
}

async function lstatOrNull(filePath) {
  try {
    return await lstat(filePath, { bigint: true });
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

async function readStableFile(filePath, label, { expectedMode } = {}) {
  const before = await lstat(filePath, { bigint: true });
  invariant(before.isFile() && !before.isSymbolicLink(), `${label} is not a regular file`);
  invariant(before.nlink === 1n, `${label} must not be hard-linked`);
  if (expectedMode !== undefined) {
    invariant(Number(before.mode & 0o777n) === expectedMode, `${label} mode changed`);
  }
  const handle = await open(filePath, fsConstants.O_RDONLY | NOFOLLOW);
  try {
    const opened = await handle.stat({ bigint: true });
    invariant(sameNode(nodeIdentity(before), nodeIdentity(opened)), `${label} identity changed before read`);
    const bytes = await handle.readFile();
    const afterOpen = await handle.stat({ bigint: true });
    const afterPath = await lstat(filePath, { bigint: true });
    invariant(
      sameNode(nodeIdentity(opened), nodeIdentity(afterOpen))
        && sameNode(nodeIdentity(opened), nodeIdentity(afterPath))
        && opened.size === afterOpen.size
        && opened.mtimeNs === afterOpen.mtimeNs,
      `${label} changed while read`,
    );
    invariant(BigInt(bytes.length) === afterOpen.size, `${label} byte count changed`);
    return {
      bytes,
      byteCount: bytes.length,
      sha256: sha256Bytes(bytes),
      mode: Number(afterOpen.mode & 0o777n),
    };
  } finally {
    await handle.close();
  }
}

function parseJson(bytes, label) {
  try {
    return JSON.parse(bytes.toString("utf8"));
  } catch {
    throw new Error(`${label} is not valid JSON`);
  }
}

function safeDescriptor(relativePath, inspected) {
  return {
    path: portableRelative(relativePath),
    bytes: inspected.byteCount,
    sha256: inspected.sha256,
  };
}

function validateInspectedIdentity(inspected, expected, label) {
  invariant(Buffer.isBuffer(inspected?.bytes), `${label} bytes are unavailable`);
  invariant(
    Number.isSafeInteger(inspected.byteCount)
      && inspected.byteCount === inspected.bytes.length,
    `${label} inspected byte count does not match its bytes`,
  );
  invariant(
    /^[0-9a-f]{64}$/.test(inspected.sha256)
      && inspected.sha256 === sha256Bytes(inspected.bytes),
    `${label} inspected SHA-256 does not match its bytes`,
  );
  invariant(inspected.mode === expected.mode, `${label} mode changed`);
  invariant(inspected.byteCount === expected.bytes, `${label} byte count changed`);
  invariant(inspected.sha256 === expected.sha256, `${label} SHA-256 changed`);
}

function frozenClosureExpectedIdentities() {
  return {
    appliedReceipt: {
      name: CLOSURE.appliedName,
      bytes: EXPECTED.frozenAppliedReceiptBytes,
      sha256: EXPECTED.frozenAppliedReceiptSha256,
      mode: 0o400,
    },
    recordManifest: {
      name: CLOSURE.recordsName,
      bytes: EXPECTED.frozenRecordManifestBytes,
      sha256: EXPECTED.frozenRecordManifestSha256,
      mode: 0o400,
    },
    appliedReceiptSidecar: {
      name: CLOSURE.sidecarName,
      bytes: EXPECTED.frozenAppliedReceiptSidecarBytes,
      sha256: EXPECTED.frozenAppliedReceiptSidecarSha256,
      mode: 0o400,
    },
  };
}

export function validateFrozenClosureTripleIdentity({
  appliedReceipt,
  recordManifest,
  appliedReceiptSidecar,
  expectedIdentities = frozenClosureExpectedIdentities(),
}) {
  exactKeys(
    expectedIdentities,
    ["appliedReceipt", "recordManifest", "appliedReceiptSidecar"],
    "Frozen closure expected identities",
  );
  validateInspectedIdentity(
    appliedReceipt,
    expectedIdentities.appliedReceipt,
    "Frozen applied receipt",
  );
  validateInspectedIdentity(
    recordManifest,
    expectedIdentities.recordManifest,
    "Frozen record manifest",
  );
  validateInspectedIdentity(
    appliedReceiptSidecar,
    expectedIdentities.appliedReceiptSidecar,
    "Frozen applied-receipt sidecar",
  );

  const expectedSidecar = `${appliedReceipt.sha256}  ${expectedIdentities.appliedReceipt.name}\n`;
  invariant(
    appliedReceiptSidecar.bytes.toString("utf8") === expectedSidecar,
    "Frozen applied-receipt sidecar changed",
  );
  const applied = parseJson(appliedReceipt.bytes, "Frozen applied receipt");
  invariant(
    applied.schemaVersion === "help-math-drive-intake-combined-freeze-applied/v1",
    "Frozen applied receipt schema changed",
  );
  invariant(
    applied.outcome === "frozen-read-only-with-unresolved-independent-review",
    "Frozen applied outcome changed",
  );
  invariant(
    applied.recordManifest?.name === expectedIdentities.recordManifest.name,
    "Frozen manifest name changed",
  );
  invariant(
    applied.recordManifest?.bytes === recordManifest.byteCount,
    "Frozen manifest byte count changed",
  );
  invariant(
    applied.recordManifest?.sha256 === recordManifest.sha256,
    "Frozen manifest digest changed",
  );
  return applied;
}

function assertFrozenClosurePlanIdentity(input, label = "Successor frozen-closure input") {
  exactKeys(
    input,
    ["appliedReceipt", "recordManifest", "appliedReceiptSidecar"],
    label,
  );
  const expected = frozenClosureExpectedIdentities();
  for (const key of ["appliedReceipt", "recordManifest", "appliedReceiptSidecar"]) {
    const descriptor = input[key];
    const expectedDescriptor = expected[key];
    invariant(
      descriptor?.artifactToken === "frozen-v7-v8-combined-closure"
        && descriptor?.name === expectedDescriptor.name
        && descriptor?.bytes === expectedDescriptor.bytes
        && descriptor?.sha256 === expectedDescriptor.sha256,
      `${label} ${key} identity changed`,
    );
  }
  invariant(
    input.appliedReceipt.outcome
      === "frozen-read-only-with-unresolved-independent-review",
    `${label} applied outcome changed`,
  );
}

function manifestRecordMap(records) {
  const map = new Map();
  for (const record of records) {
    const key = `${record.root}\0${record.path}`;
    invariant(!map.has(key), "Frozen manifest contains a duplicate record");
    map.set(key, record);
  }
  return map;
}

function setDigest(values) {
  return sha256Bytes(`${[...values].sort(compareText).join("\n")}\n`);
}

function intersectionCount(left, right) {
  let count = 0;
  const smaller = left.size <= right.size ? left : right;
  const larger = smaller === left ? right : left;
  for (const value of smaller) if (larger.has(value)) count += 1;
  return count;
}

function validateEncodedPrivatePath(value, label) {
  exactKeys(value, ["relativePath", "relativePathBytesBase64"], label);
  invariant(typeof value.relativePath === "string" && value.relativePath.length > 0, `${label} is empty`);
  invariant(
    Buffer.from(value.relativePath, "utf8").toString("base64") === value.relativePathBytesBase64,
    `${label} Base64 binding changed`,
  );
  return value.relativePath;
}

async function validateFrozenLedgerRoot({
  rootLabel,
  rootPath,
  records,
  recordMap,
  receiptSummary,
  ledgerPrefix,
  expectedCount,
}) {
  const ledgerPattern = new RegExp(
    `^${ledgerPrefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([0-9a-f]{2})/([0-9a-f]{64})\\.json$`,
  );
  const objectPattern = /^downloads\/sha256\/([0-9a-f]{2})\/([0-9a-f]{64})$/;
  const ledgerRecords = [];
  const objectRecords = [];
  for (const record of records) {
    if (record.root !== rootLabel) continue;
    if (record.path.startsWith(ledgerPrefix)) {
      invariant(ledgerPattern.test(record.path), `${rootLabel} frozen ledger tree contains a malformed file`);
      ledgerRecords.push(record);
    }
    if (record.path.startsWith("downloads/sha256/")) {
      invariant(objectPattern.test(record.path), `${rootLabel} frozen object tree contains a malformed file`);
      objectRecords.push(record);
    }
  }
  invariant(ledgerRecords.length === expectedCount, `${rootLabel} ledger count changed`);
  invariant(objectRecords.length === expectedCount, `${rootLabel} object count changed`);

  const publicRows = [];
  const digests = new Set();
  const privatePlacementMetadata = new Set();
  ledgerRecords.sort((left, right) => compareText(left.path, right.path));
  for (const ledgerRecord of ledgerRecords) {
    const match = ledgerRecord.path.match(ledgerPattern);
    const digest = match[2];
    invariant(match[1] === digest.slice(0, 2), `${rootLabel} ledger bucket changed`);
    const inspected = await readStableFile(
      path.join(rootPath, ...ledgerRecord.path.split("/")),
      `${rootLabel} ledger ${digest}`,
      { expectedMode: 0o400 },
    );
    invariant(inspected.byteCount === ledgerRecord.bytes, `${rootLabel} ledger byte count changed`);
    invariant(inspected.sha256 === ledgerRecord.sha256, `${rootLabel} ledger digest changed`);
    const ledger = parseJson(inspected.bytes, `${rootLabel} ledger ${digest}`);
    invariant(ledger.schemaVersion === "help-math-drive-dedupe-object-ledger/v1", `${rootLabel} ledger schema changed`);
    invariant(ledger.state === "installed-and-verified", `${rootLabel} ledger state changed`);
    invariant(ledger.sha256 === digest, `${rootLabel} ledger SHA-256 binding changed`);
    invariant(Number.isSafeInteger(ledger.bytes) && ledger.bytes >= 0, `${rootLabel} ledger bytes are invalid`);
    const objectRelativePath = `downloads/sha256/${digest.slice(0, 2)}/${digest}`;
    invariant(ledger.objectRelativePath === objectRelativePath, `${rootLabel} object placement changed`);
    invariant(ledger.objectMode === "0600", `${rootLabel} intake-time object mode changed`);
    invariant(ledger.policy?.identity === "complete SHA-256 plus byte count", `${rootLabel} identity policy changed`);
    invariant(ledger.policy?.intakeExcludedFromLocalIndex === true, `${rootLabel} local-index policy changed`);
    invariant(ledger.localIndex?.exactMatchFound === false, `${rootLabel} ledger unexpectedly reports a prior local exact match`);
    invariant(ledger.claims?.byteIdentityOnly === true, `${rootLabel} byte-identity boundary changed`);
    for (const claim of ["canonicalPromotion", "acceptance", "runtimeFidelity", "publication"]) {
      invariant(ledger.claims?.[claim] === false, `${rootLabel} ledger acceptance boundary changed`);
    }

    privatePlacementMetadata.add(
      validateEncodedPrivatePath(ledger.firstObservedSource, `${rootLabel} private source metadata`),
    );
    privatePlacementMetadata.add(
      validateEncodedPrivatePath(
        ledger.firstObservedDriveRootRelativePath,
        `${rootLabel} private Drive-root metadata`,
      ),
    );

    const objectRecord = recordMap.get(`${rootLabel}\0${objectRelativePath}`);
    invariant(objectRecord, `${rootLabel} object is absent from the frozen manifest`);
    invariant(objectRecord.sha256 === digest, `${rootLabel} frozen object SHA-256 changed`);
    invariant(objectRecord.bytes === ledger.bytes, `${rootLabel} frozen object byte count changed`);
    const objectInfo = await lstat(path.join(rootPath, ...objectRelativePath.split("/")), { bigint: true });
    invariant(objectInfo.isFile() && !objectInfo.isSymbolicLink(), `${rootLabel} object is not a regular file`);
    invariant(objectInfo.nlink === 1n, `${rootLabel} object is hard-linked`);
    invariant(Number(objectInfo.mode & 0o777n) === 0o400, `${rootLabel} object mode changed`);
    invariant(objectInfo.size === BigInt(ledger.bytes), `${rootLabel} object size changed`);
    invariant(!digests.has(digest), `${rootLabel} ledger contains a duplicate SHA-256`);
    digests.add(digest);
    publicRows.push({
      sha256: digest,
      bytes: ledger.bytes,
      objectRelativePath,
      ledgerSha256: ledgerRecord.sha256,
    });
  }

  const knownObjectPaths = new Set(publicRows.map((row) => row.objectRelativePath));
  for (const objectRecord of objectRecords) {
    invariant(knownObjectPaths.has(objectRecord.path), `${rootLabel} frozen object has no ledger`);
  }
  const rowText = `${publicRows.map((row) => JSON.stringify(row)).join("\n")}\n`;
  const rootedObjectText = `${publicRows
    .map((row) => `${rootLabel}\t${row.sha256}\t${row.bytes}`)
    .join("\n")}\n`;
  const rootedLedgerText = `${publicRows
    .map((row) => `${rootLabel}\t${row.sha256}\t${row.bytes}\t${row.ledgerSha256}`)
    .join("\n")}\n`;
  const summary = {
    root: rootLabel,
    ledgerCount: publicRows.length,
    objectCount: publicRows.length,
    objectBytes: publicRows.reduce((sum, row) => sum + row.bytes, 0),
    digestSetSha256: setDigest(digests),
    ledgerBindingSetSha256: sha256Bytes(rowText),
    rootedObjectSetSha256: sha256Bytes(rootedObjectText),
    rootedObjectAndLedgerSetSha256: sha256Bytes(rootedLedgerText),
  };
  invariant(JSON.stringify(summary) === JSON.stringify(receiptSummary), `${rootLabel} ledger closure differs from the frozen receipt`);
  return { summary, digests, publicRows, privatePlacementMetadata };
}

export async function validateFrozenClosure({
  roots = DEFAULT_ROOTS,
  closureRoot = DEFAULT_CLOSURE_ROOT,
} = {}) {
  const closureInfo = await lstat(closureRoot, { bigint: true });
  invariant(closureInfo.isDirectory() && !closureInfo.isSymbolicLink(), "Frozen closure root is not a real directory");
  invariant(Number(closureInfo.mode & 0o777n) === 0o500, "Frozen closure root mode changed");
  for (const [rootLabel, rootPath] of Object.entries(roots)) {
    const info = await lstat(rootPath, { bigint: true });
    invariant(info.isDirectory() && !info.isSymbolicLink(), `${rootLabel} frozen root is not a real directory`);
    invariant(Number(info.mode & 0o777n) === 0o500, `${rootLabel} frozen root mode changed`);
  }

  const appliedInspected = await readStableFile(
    path.join(closureRoot, CLOSURE.appliedName),
    "Frozen applied receipt",
    { expectedMode: 0o400 },
  );
  const manifestInspected = await readStableFile(
    path.join(closureRoot, CLOSURE.recordsName),
    "Frozen record manifest",
    { expectedMode: 0o400 },
  );
  const sidecarInspected = await readStableFile(
    path.join(closureRoot, CLOSURE.sidecarName),
    "Frozen applied-receipt sidecar",
    { expectedMode: 0o400 },
  );
  const applied = validateFrozenClosureTripleIdentity({
    appliedReceipt: appliedInspected,
    recordManifest: manifestInspected,
    appliedReceiptSidecar: sidecarInspected,
  });
  invariant(applied.ledgerClosure?.union?.uniqueSha256Count === EXPECTED.ledgerUnionCount, "Frozen ledger union count changed");
  invariant(applied.ledgerClosure?.union?.overlapCount === 0, "Frozen ledger roots now overlap");
  invariant(applied.postcheck?.writableEntries === 0 && applied.postcheck?.wrongModes === 0, "Frozen mode postcheck changed");
  invariant(applied.postcheck?.contentManifestMatched === true, "Frozen content-manifest postcheck changed");
  invariant(applied.postcheck?.unexpectedFiles === 0 && applied.postcheck?.missingFiles === 0, "Frozen file-set postcheck changed");
  invariant(applied.postcheck?.directoryPathSetDrift === 0 && applied.postcheck?.stagingEntryCount === 0, "Frozen path/staging postcheck changed");
  invariant(applied.lifecycle?.futureWritesRequireNewSuccessorRoot === true, "Frozen successor-root boundary changed");
  invariant(applied.lifecycle?.independentReviewReceiptPresent === false, "Independent-review state changed");
  invariant(applied.lifecycle?.v7IndependentlyFinalized === false, "v7 finality boundary changed");
  invariant(applied.unresolved?.successorPromotionPlanApplied === false, "Frozen receipt already claims a successor promotion");
  invariant(applied.unresolved?.grade4MissingMp3Count === EXPECTED.missingCount, "Frozen missing-MP3 count changed");
  const expectedFreezeClaims = {
    quarantineFrozen: true,
    canonicalPromotion: false,
    javascriptImplementation: false,
    originalRuntimeFidelity: false,
    audioCorrectnessOrAcceptance: false,
    humanVisualAcceptance: false,
    ownerAcceptance: false,
    strictCompletion: false,
    wholeCourseIntegration: false,
    publication: false,
  };
  exactKeys(applied.claims, Object.keys(expectedFreezeClaims), "Frozen applied claims");
  for (const [key, value] of Object.entries(expectedFreezeClaims)) {
    invariant(applied.claims[key] === value, `Frozen applied claim ${key} changed`);
  }

  const manifestText = manifestInspected.bytes.toString("utf8");
  const records = parseRecordManifest(manifestText);
  invariant(records.length === applied.tree?.combinedBeforeClosureArtifacts?.fileCount, "Frozen manifest file count changed");
  invariant(
    records.reduce((sum, record) => sum + record.bytes, 0)
      === applied.tree?.combinedBeforeClosureArtifacts?.totalBytes,
    "Frozen manifest total bytes changed",
  );
  const recordMap = manifestRecordMap(records);
  const [v7, v8] = await Promise.all([
    validateFrozenLedgerRoot({
      rootLabel: "v7",
      rootPath: roots.v7,
      records,
      recordMap,
      receiptSummary: applied.ledgerClosure.v7,
      ...LEDGER_CONFIG.v7,
    }),
    validateFrozenLedgerRoot({
      rootLabel: "v8",
      rootPath: roots.v8,
      records,
      recordMap,
      receiptSummary: applied.ledgerClosure.v8,
      ...LEDGER_CONFIG.v8,
    }),
  ]);
  let overlapCount = 0;
  for (const digest of v7.digests) if (v8.digests.has(digest)) overlapCount += 1;
  invariant(overlapCount === 0, "Frozen v7/v8 ledger sets overlap");
  const ledgerSha256 = new Set([...v7.digests, ...v8.digests]);
  invariant(ledgerSha256.size === EXPECTED.ledgerUnionCount, "Frozen ledger union is not exactly 6,060 SHA-256 objects");
  const combinedRows = [
    ...v7.publicRows.map((row) => ({ root: "v7", ...row })),
    ...v8.publicRows.map((row) => ({ root: "v8", ...row })),
  ].sort((left, right) => compareText(left.root, right.root) || compareText(left.sha256, right.sha256));
  const rootedObjectText = `${combinedRows.map((row) => `${row.root}\t${row.sha256}\t${row.bytes}`).join("\n")}\n`;
  const rootedLedgerText = `${combinedRows
    .map((row) => `${row.root}\t${row.sha256}\t${row.bytes}\t${row.ledgerSha256}`)
    .join("\n")}\n`;
  invariant(setDigest(ledgerSha256) === applied.ledgerClosure.union.digestSetSha256, "Frozen union digest changed");
  invariant(sha256Bytes(rootedObjectText) === applied.ledgerClosure.union.rootedObjectSetSha256, "Frozen rooted-object set changed");
  invariant(
    sha256Bytes(rootedLedgerText) === applied.ledgerClosure.union.rootedObjectAndLedgerSetSha256,
    "Frozen rooted object/ledger set changed",
  );
  return {
    ledgerSha256,
    privatePlacementMetadata: new Set([
      ...v7.privatePlacementMetadata,
      ...v8.privatePlacementMetadata,
    ]),
    input: {
      appliedReceipt: {
        artifactToken: "frozen-v7-v8-combined-closure",
        name: CLOSURE.appliedName,
        bytes: appliedInspected.byteCount,
        sha256: appliedInspected.sha256,
        outcome: applied.outcome,
      },
      recordManifest: {
        artifactToken: "frozen-v7-v8-combined-closure",
        name: CLOSURE.recordsName,
        bytes: manifestInspected.byteCount,
        sha256: manifestInspected.sha256,
      },
      appliedReceiptSidecar: {
        artifactToken: "frozen-v7-v8-combined-closure",
        name: CLOSURE.sidecarName,
        bytes: sidecarInspected.byteCount,
        sha256: sidecarInspected.sha256,
      },
    },
    summary: {
      v7ObjectCount: v7.digests.size,
      v8ObjectCount: v8.digests.size,
      overlapCount,
      uniqueSha256Count: ledgerSha256.size,
      digestSetSha256: setDigest(ledgerSha256),
      rootedObjectSetSha256: applied.ledgerClosure.union.rootedObjectSetSha256,
      rootedObjectAndLedgerSetSha256:
        applied.ledgerClosure.union.rootedObjectAndLedgerSetSha256,
      byteAuthority: "hash-bound frozen record manifest; no object bytes copied",
    },
  };
}

function parseChecksumFile(contents, label) {
  invariant(contents.endsWith("\n"), `${label} must end with a newline`);
  const rows = contents.slice(0, -1).split("\n").map((line, index) => {
    const match = line.match(/^([0-9a-f]{64})  (.+)$/);
    invariant(match, `${label} line ${index + 1} is invalid`);
    return {
      sha256: match[1],
      path: portableRelative(match[2], `${label} path`),
    };
  });
  const byPath = new Map();
  for (const row of rows) {
    invariant(!byPath.has(row.path), `${label} contains a duplicate path`);
    byPath.set(row.path, row.sha256);
  }
  return { rows, byPath };
}

export async function validateCanonicalCatalog({ root = projectRoot } = {}) {
  const inspected = {};
  for (const [name, relativePath] of Object.entries(REPOSITORY_INPUTS)) {
    if (name.startsWith("predecessor")) continue;
    inspected[name] = await readStableFile(path.join(root, relativePath), name);
  }
  const sourceCatalog = parseJson(inspected.sourceCatalog.bytes, "Canonical source catalog");
  invariant(sourceCatalog.schemaVersion === 1, "Canonical source catalog schema changed");
  invariant(sourceCatalog.fileCount === EXPECTED.canonicalFileCount, "Canonical source file count changed");
  invariant(sourceCatalog.totalBytes === EXPECTED.canonicalTotalBytes, "Canonical source byte count changed");
  invariant(sourceCatalog.checksumSetSha256 === EXPECTED.canonicalChecksumSetSha256, "Canonical checksum-set digest changed");
  invariant(Array.isArray(sourceCatalog.files) && sourceCatalog.files.length === sourceCatalog.fileCount, "Canonical file rows changed");

  const catalogByPath = new Map();
  const canonicalSha256 = new Set();
  let catalogBytes = 0;
  for (const row of sourceCatalog.files) {
    const canonicalPath = portableRelative(row.path, "Canonical catalog path");
    invariant(!catalogByPath.has(canonicalPath), "Canonical catalog contains a duplicate path");
    invariant(Number.isSafeInteger(row.bytes) && row.bytes >= 0, "Canonical catalog contains an invalid byte count");
    invariant(/^[0-9a-f]{64}$/.test(row.sha256), "Canonical catalog contains an invalid SHA-256");
    catalogByPath.set(canonicalPath, { bytes: row.bytes, sha256: row.sha256 });
    canonicalSha256.add(row.sha256);
    catalogBytes += row.bytes;
  }
  invariant(catalogByPath.size === sourceCatalog.fileCount, "Canonical catalog path count changed");
  invariant(catalogBytes === sourceCatalog.totalBytes, "Canonical catalog row bytes changed");

  const checksumText = inspected.sourceChecksumSet.bytes.toString("utf8");
  const checksumRows = parseChecksumFile(checksumText, "Canonical checksum set");
  invariant(inspected.sourceChecksumSet.sha256 === sourceCatalog.checksumSetSha256, "Canonical checksum-set file digest changed");
  const expectedChecksumText = `${sourceCatalog.files.map((row) => `${row.sha256}  ${row.path}`).join("\n")}\n`;
  invariant(checksumText === expectedChecksumText, "Canonical catalog/checksum-set ordering or bytes changed");

  const manifestRows = parseChecksumFile(
    inspected.sourceManifest.bytes.toString("utf8"),
    "Canonical source manifest",
  );
  invariant(manifestRows.byPath.size === catalogByPath.size, "Canonical manifest path count changed");
  for (const [canonicalPath, record] of catalogByPath) {
    invariant(manifestRows.byPath.get(canonicalPath) === record.sha256, "Canonical catalog/manifest binding changed");
  }
  invariant(checksumRows.byPath.size === catalogByPath.size, "Canonical checksum path count changed");

  const sourceFreeze = parseJson(inspected.sourceFreeze.bytes, "Canonical source freeze receipt");
  invariant(sourceFreeze.schemaVersion === 1, "Canonical source freeze schema changed");
  invariant(sourceFreeze.fileCount === sourceCatalog.fileCount, "Canonical freeze file count changed");
  invariant(sourceFreeze.totalBytes === sourceCatalog.totalBytes, "Canonical freeze byte count changed");
  invariant(sourceFreeze.manifestSha256 === inspected.sourceManifest.sha256, "Canonical freeze manifest digest changed");
  invariant(sourceFreeze.manifestSha256 === EXPECTED.canonicalManifestSha256, "Canonical manifest expected digest changed");
  invariant(sourceFreeze.readOnlyEnforced === true && sourceFreeze.writableEntriesAfterFreeze === 0, "Canonical read-only freeze boundary changed");

  return {
    canonicalSha256,
    catalogByPath,
    input: {
      sourceCatalog: safeDescriptor(REPOSITORY_INPUTS.sourceCatalog, inspected.sourceCatalog),
      sourceChecksumSet: safeDescriptor(
        REPOSITORY_INPUTS.sourceChecksumSet,
        inspected.sourceChecksumSet,
      ),
      sourceManifest: safeDescriptor(REPOSITORY_INPUTS.sourceManifest, inspected.sourceManifest),
      sourceFreeze: safeDescriptor(REPOSITORY_INPUTS.sourceFreeze, inspected.sourceFreeze),
    },
    summary: {
      fileCount: sourceCatalog.fileCount,
      totalBytes: sourceCatalog.totalBytes,
      uniqueSha256Count: canonicalSha256.size,
      uniqueSha256SetSha256: setDigest(canonicalSha256),
      manifestSha256: inspected.sourceManifest.sha256,
      checksumSetSha256: sourceCatalog.checksumSetSha256,
      catalogManifestExact: true,
      readOnlyEnforced: true,
    },
  };
}

function validateKnownG4Record(record, canonical, label) {
  const canonicalPath = portableRelative(record.canonicalPath, `${label} canonical path`);
  invariant(canonicalPath.startsWith("HELP_COURSES/ELMGR4/"), `${label} escaped Grade 4 scope`);
  invariant(Number.isSafeInteger(record.bytes) && record.bytes >= 0, `${label} bytes are invalid`);
  invariant(/^[0-9a-f]{64}$/.test(record.sha256), `${label} SHA-256 is invalid`);
  const current = canonical.catalogByPath.get(canonicalPath);
  invariant(current, `${label} is absent from the current canonical catalog`);
  invariant(current.bytes === record.bytes && current.sha256 === record.sha256, `${label} differs from current canonical bytes`);
  return canonicalPath;
}

function recordSetDigest(records) {
  return sha256Bytes(`${records
    .map((record) => `${record.canonicalPath}\t${record.bytes}\t${record.sha256}`)
    .sort(compareText)
    .join("\n")}\n`);
}

function pathSetDigest(paths) {
  return sha256Bytes(`${[...paths].sort(compareText).join("\n")}\n`);
}

function compareAlignmentText(left, right) {
  return String(left).localeCompare(String(right), "en", { sensitivity: "variant" });
}

function alignmentPathSetDigest(paths) {
  return sha256Bytes(`${[...paths].sort(compareAlignmentText).join("\n")}\n`);
}

function alignmentRecordSetDigest(records) {
  return sha256Bytes(`${[...records]
    .sort((left, right) => compareAlignmentText(left.canonicalPath, right.canonicalPath))
    .map((record) => `${record.canonicalPath}\t${record.bytes}\t${record.sha256}`)
    .join("\n")}\n`);
}

function missingPathSetDigest(records) {
  return pathSetDigest(records.map((record) => record.canonicalPath));
}

export function assertEpochSha256({ runtimeAlignment, sqlAggregate, rejectedV1 }) {
  invariant(
    runtimeAlignment?.sha256 === EXPECTED.runtimeAlignmentSha256,
    "Runtime-alignment epoch SHA-256 changed",
  );
  invariant(
    sqlAggregate?.sha256 === EXPECTED.sqlAggregateSha256,
    "SQL-aggregate epoch SHA-256 changed",
  );
  invariant(
    rejectedV1?.sha256 === EXPECTED.rejectedV1Sha256,
    "Rejected v1 successor-candidate SHA-256 changed",
  );
}

export async function validateSqlAggregate({ root = projectRoot } = {}) {
  const inspected = await readStableFile(
    path.join(root, EPOCH_INPUTS.sqlAggregate),
    "Grade 4 SQL aggregate",
  );
  assertEpochSha256({
    runtimeAlignment: { sha256: EXPECTED.runtimeAlignmentSha256 },
    sqlAggregate: inspected,
    rejectedV1: { sha256: EXPECTED.rejectedV1Sha256 },
  });
  const report = parseJson(inspected.bytes, "Grade 4 SQL aggregate");
  invariant(report.schemaVersion === 1, "SQL aggregate schema changed");
  invariant(
    report.reportType === "g4-privacy-safe-historical-sql-course-aggregate",
    "SQL aggregate report type changed",
  );
  invariant(
    report.status === "historical-aggregate-context-only-current-xml-sequence-authority",
    "SQL aggregate authority status changed",
  );
  invariant(report.sourceSnapshotDate === "2021-02-03", "SQL aggregate snapshot date changed");
  invariant(
    report.identity?.grade === 4
      && report.identity?.historicalCourseId === 5
      && report.identity?.lessonCount === EXPECTED.alignmentLessonCount,
    "SQL aggregate course identity changed",
  );
  invariant(
    Array.isArray(report.lessons)
      && report.lessons.length === EXPECTED.alignmentLessonCount,
    "SQL aggregate lesson count changed",
  );
  const lessonNumbers = report.lessons.map((lesson) => lesson.lessonNumber);
  invariant(
    JSON.stringify(lessonNumbers)
      === JSON.stringify(Array.from({ length: EXPECTED.alignmentLessonCount }, (_, index) => index + 1)),
    "SQL aggregate lesson order changed",
  );
  invariant(
    report.totals?.activeHistoricalLessons === EXPECTED.alignmentLessonCount
      && report.totals?.currentXmlPageReferences === EXPECTED.alignmentPageCount,
    "SQL aggregate Grade 4 totals changed",
  );
  invariant(
    report.alignmentSummary?.historicalTitlesMatchingCurrentCatalog
      === EXPECTED.alignmentLessonCount
      && report.alignmentSummary?.historicalUrlsMatchingCurrentXml
        === EXPECTED.alignmentLessonCount
      && report.alignmentSummary?.placementPathMatchIsByteIdentity === false,
    "SQL aggregate alignment boundary changed",
  );
  invariant(
    report.sequenceAuthority?.historicalSqlIsSequenceAuthority === false
      && JSON.stringify(report.sequenceAuthority?.lessonNumbers) === JSON.stringify(lessonNumbers),
    "SQL aggregate sequence-authority boundary changed",
  );
  invariant(
    report.authorityBoundary?.historicalAggregateContext === true
      && report.authorityBoundary?.currentXmlSequenceAuthority === true
      && report.authorityBoundary?.historicalSqlSequenceAuthority === false,
    "SQL aggregate historical-context boundary changed",
  );
  for (const key of [
    "audioEffect",
    "canonicalSourcePromotionEffect",
    "fidelityEffect",
    "humanReviewEffect",
    "ownerAcceptanceEffect",
    "publicationEffect",
    "runtimeEffect",
    "strictCompletionEffect",
  ]) {
    invariant(report.authorityBoundary?.[key] === false, `SQL aggregate ${key} changed`);
  }
  invariant(
    report.privacyBoundary?.approvedSqlTableCount === 6
      && report.privacyBoundary?.explicitFieldProjectionOnly === true
      && report.privacyBoundary?.personalRecordsEmitted === 0
      && report.privacyBoundary?.rawCurriculumRowsEmitted === 0
      && report.privacyBoundary?.restrictedSqlTablesRead === 0
      && report.privacyBoundary?.sourceAbsolutePathsEmitted === 0,
    "SQL aggregate privacy boundary changed",
  );
  return {
    report,
    input: safeDescriptor(EPOCH_INPUTS.sqlAggregate, inspected),
    summary: {
      role: "historical-aggregate-context-only",
      sourceSnapshotDate: report.sourceSnapshotDate,
      historicalCourseId: report.identity.historicalCourseId,
      lessonCount: report.identity.lessonCount,
      currentXmlPageReferences: report.totals.currentXmlPageReferences,
      historicalTitlesMatchingCurrentCatalog:
        report.alignmentSummary.historicalTitlesMatchingCurrentCatalog,
      historicalUrlsMatchingCurrentXml:
        report.alignmentSummary.historicalUrlsMatchingCurrentXml,
      sequenceAuthority: "current-hash-bound-Grade-4-lesson-XML-not-SQL",
      personalRecordsEmitted: 0,
      rawCurriculumRowsEmitted: 0,
      acceptanceEffect: false,
    },
  };
}

export function validateRejectedV1Identity(inspected) {
  validateInspectedIdentity(
    inspected,
    {
      bytes: EXPECTED.rejectedV1Bytes,
      sha256: EXPECTED.rejectedV1Sha256,
      mode: 0o644,
    },
    "Rejected v1 successor candidate",
  );
  const candidate = parseJson(inspected.bytes, "Rejected v1 successor candidate");
  invariant(
    candidate.schemaVersion === "help-math-g4-ledger-successor-promotion-plan/v1"
      && candidate.artifactType === "help-math-g4-runtime-dependency-successor-plan",
    "Rejected v1 successor identity changed",
  );
  invariant(candidate.mode === "plan-only-no-executor", "Rejected v1 mode changed");
  invariant(
    Array.isArray(candidate.promotionRecords) && candidate.promotionRecords.length === 0,
    "Rejected v1 contains promotion records",
  );
  invariant(
    Array.isArray(candidate.requiredUnresolvedSources)
      && candidate.requiredUnresolvedSources.length === EXPECTED.missingCount
      && candidate.requiredUnresolvedSources.every((record) => record.expectedSha256 === null),
    "Rejected v1 unresolved-source boundary changed",
  );
  invariant(
    missingPathSetDigest(candidate.requiredUnresolvedSources)
      === EXPECTED.missingPathSetSha256,
    "Rejected v1 missing-source path set changed",
  );
  assertAllFalse(candidate.acceptanceEffects, FALSE_ACCEPTANCE_EFFECTS, "Rejected v1 acceptance effects");
  invariant(
    candidate.controls?.executable === false
      && candidate.controls?.executorPresent === false
      && candidate.controls?.sourceAssetsMutationPerformed === false
      && candidate.controls?.sourceAssetsMutationAuthorized === false,
    "Rejected v1 execution boundary changed",
  );
  return candidate;
}

export async function validateRejectedV1({ root = projectRoot } = {}) {
  const inspected = await readStableFile(
    path.join(root, EPOCH_INPUTS.rejectedV1),
    "Rejected v1 successor candidate",
    { expectedMode: 0o644 },
  );
  assertEpochSha256({
    runtimeAlignment: { sha256: EXPECTED.runtimeAlignmentSha256 },
    sqlAggregate: { sha256: EXPECTED.sqlAggregateSha256 },
    rejectedV1: inspected,
  });
  const candidate = validateRejectedV1Identity(inspected);
  return {
    candidate,
    input: safeDescriptor(EPOCH_INPUTS.rejectedV1, inspected),
    summary: {
      disposition: "rejected-runtime-alignment-epoch-not-bound",
      preservedByteForByte: true,
      reusableForPromotion: false,
      promotionRecordCount: 0,
      requiredUnresolvedSourceCount: EXPECTED.missingCount,
      missingPathSetSha256: EXPECTED.missingPathSetSha256,
      acceptanceEffect: false,
    },
  };
}

export async function validateSupersededV2({ root = projectRoot } = {}) {
  const inspected = await readStableFile(
    path.join(root, EPOCH_INPUTS.supersededV2),
    "Superseded v2 successor candidate",
    { expectedMode: 0o644 },
  );
  validateInspectedIdentity(
    inspected,
    {
      bytes: EXPECTED.supersededV2Bytes,
      sha256: EXPECTED.supersededV2Sha256,
      mode: 0o644,
    },
    "Superseded v2 successor candidate",
  );
  const candidate = parseJson(inspected.bytes, "Superseded v2 successor candidate");
  invariant(
    candidate.schemaVersion === "help-math-g4-ledger-successor-promotion-plan/v2"
      && candidate.artifactType === "help-math-g4-runtime-dependency-successor-plan",
    "Superseded v2 successor identity changed",
  );
  invariant(candidate.mode === "plan-only-no-executor", "Superseded v2 mode changed");
  assertEpochSha256({
    runtimeAlignment: candidate.inputs?.runtimeAlignment,
    sqlAggregate: candidate.inputs?.sqlAggregate,
    rejectedV1: candidate.inputs?.rejectedV1Candidate,
  });
  assertFrozenClosurePlanIdentity(
    candidate.inputs?.frozenClosure,
    "Superseded v2 frozen-closure input",
  );
  invariant(
    candidate.predecessorCandidateDisposition?.disposition
      === "rejected-runtime-alignment-epoch-not-bound"
      && candidate.predecessorCandidateDisposition?.sha256
        === EXPECTED.rejectedV1Sha256
      && candidate.predecessorCandidateDisposition?.preservedByteForByte === true
      && candidate.predecessorCandidateDisposition?.overwrittenOrDeleted === false
      && candidate.predecessorCandidateDisposition?.promotionAuthority === false,
    "Superseded v2 rejected-v1 disposition changed",
  );
  invariant(
    Array.isArray(candidate.promotionRecords) && candidate.promotionRecords.length === 0,
    "Superseded v2 contains promotion records",
  );
  invariant(
    Array.isArray(candidate.requiredUnresolvedSources)
      && candidate.requiredUnresolvedSources.length === EXPECTED.missingCount
      && candidate.requiredUnresolvedSources.every(
        (record) => record.expectedSha256 === null,
      ),
    "Superseded v2 unresolved-source boundary changed",
  );
  invariant(
    missingPathSetDigest(candidate.requiredUnresolvedSources)
      === EXPECTED.missingPathSetSha256,
    "Superseded v2 missing-source path set changed",
  );
  assertAllFalse(
    candidate.acceptanceEffects,
    FALSE_ACCEPTANCE_EFFECTS,
    "Superseded v2 acceptance effects",
  );
  invariant(
    candidate.controls?.executable === false
      && candidate.controls?.executorPresent === false
      && candidate.controls?.sourceAssetsMutationPerformed === false
      && candidate.controls?.sourceAssetsMutationAuthorized === false
      && candidate.controls?.filenameBasenameCaseOrPlacementAdmissionUsed === false,
    "Superseded v2 execution or admission boundary changed",
  );
  invariant(
    candidate.verifiedEvidence?.runtimeAlignment?.keyTermCandidateReviewHolds
      ?.admittedByThisPlan === 0,
    "Superseded v2 admits unresolved Key Term holds",
  );
  return {
    candidate,
    input: safeDescriptor(EPOCH_INPUTS.supersededV2, inspected),
    summary: {
      disposition: "superseded-p2-polynomial-and-identity-regression-gaps",
      preservedByteForByte: true,
      reusableForPromotion: false,
      promotionRecordCount: 0,
      requiredUnresolvedSourceCount: EXPECTED.missingCount,
      p2Findings: [
        "residual-Polynomial-runtime-blocker-not-explicitly-cross-validated",
        "frozen-triple-and-rejected-v1-mutation-regressions-not-covered",
      ],
      acceptanceEffect: false,
    },
  };
}

function safeMissingRecord(record) {
  const canonicalPath = portableRelative(record.canonicalPath, "Missing Grade 4 source path");
  invariant(canonicalPath.startsWith("HELP_COURSES/ELMGR4/") && canonicalPath.endsWith(".mp3"), "Missing source escaped the Grade 4 MP3 scope");
  invariant(record.sourceType === "runtime-bound-audio", "Missing source type changed");
  invariant(typeof record.bindingReason === "string" && record.bindingReason.length > 0, "Missing source binding reason changed");
  invariant(
    record.audioBindingKind === "final-quiz-question-answer"
      || record.audioBindingKind === "ordinary-spanish-page",
    "Missing source audio-binding kind changed",
  );
  invariant(Array.isArray(record.requiredBy) && record.requiredBy.length > 0, "Missing source requirements changed");
  const requiredBy = record.requiredBy.map((value) => portableRelative(value, "Missing source requirement"));
  return {
    canonicalPath,
    sourceType: record.sourceType,
    bindingReason: record.bindingReason,
    audioBindingKind: record.audioBindingKind,
    requiredBy,
  };
}

export async function validatePredecessorG4({ root = projectRoot, canonical } = {}) {
  invariant(canonical, "Canonical evidence is required");
  const planInspected = await readStableFile(
    path.join(root, REPOSITORY_INPUTS.predecessorPlan),
    "Predecessor Grade 4 plan",
  );
  const appliedInspected = await readStableFile(
    path.join(root, REPOSITORY_INPUTS.predecessorApplied),
    "Predecessor Grade 4 applied receipt",
  );
  invariant(planInspected.sha256 === EXPECTED.predecessorPlanSha256, "Predecessor Grade 4 plan digest changed");
  invariant(appliedInspected.sha256 === EXPECTED.predecessorAppliedSha256, "Predecessor Grade 4 applied digest changed");
  const plan = parseJson(planInspected.bytes, "Predecessor Grade 4 plan");
  const applied = parseJson(appliedInspected.bytes, "Predecessor Grade 4 applied receipt");
  invariant(plan.schemaVersion === 1 && plan.artifactType === "help-math-g4-active-source-promotion-plan", "Predecessor plan schema changed");
  invariant(applied.schemaVersion === 1 && applied.artifactType === "help-math-g4-active-source-promotion-applied-receipt", "Predecessor applied schema changed");
  invariant(applied.applied === true && applied.lifecycle === "final", "Predecessor plan is not final/applied");
  invariant(applied.plan?.sha256 === planInspected.sha256, "Predecessor applied receipt does not bind its plan");
  invariant(Array.isArray(plan.copyRecords) && plan.copyRecords.length === EXPECTED.predecessorCopyCount, "Predecessor copy count changed");
  invariant(Array.isArray(plan.existingBindings) && plan.existingBindings.length === EXPECTED.predecessorExistingCount, "Predecessor existing-binding count changed");
  invariant(Array.isArray(plan.missingDependencies) && plan.missingDependencies.length === EXPECTED.missingCount, "Predecessor missing count changed");
  invariant(recordSetDigest(plan.copyRecords) === plan.summary?.copyRecords?.recordSetSha256, "Predecessor copy record-set digest changed");
  invariant(recordSetDigest(plan.existingBindings) === plan.summary?.existingBindings?.recordSetSha256, "Predecessor existing record-set digest changed");
  invariant(missingPathSetDigest(plan.missingDependencies) === EXPECTED.missingPathSetSha256, "Predecessor missing path-set digest changed");
  invariant(applied.unresolvedDependencies?.count === EXPECTED.missingCount, "Applied missing count changed");
  invariant(applied.unresolvedDependencies?.pathSetSha256 === EXPECTED.missingPathSetSha256, "Applied missing path-set digest changed");
  invariant(applied.exactPromotion?.copyRecordCount === EXPECTED.predecessorCopyCount, "Applied copy count changed");
  invariant(applied.exactPromotion?.existingBindingCount === EXPECTED.predecessorExistingCount, "Applied existing count changed");
  invariant(applied.exactPromotion?.expectedPostManifestSha256 === canonical.summary.manifestSha256, "Predecessor post-manifest binding changed");
  invariant(applied.exactPromotion?.expectedPostCatalogChecksumSha256 === canonical.summary.checksumSetSha256, "Predecessor post-catalog binding changed");
  invariant(applied.postchecks?.live?.unresolvedDependencyCount === EXPECTED.missingCount, "Predecessor live missing count changed");

  const closureSha256 = new Set();
  const runtimeSha256 = new Set();
  const placementMetadata = new Set();
  const runtimeTypes = new Set([
    "active-page-swf",
    "runtime-bound-audio",
    "lesson-xml-binding",
  ]);
  const knownRecords = [...plan.copyRecords, ...plan.existingBindings];
  for (const [index, record] of knownRecords.entries()) {
    validateKnownG4Record(record, canonical, `Predecessor known record ${index + 1}`);
    closureSha256.add(record.sha256);
    if (runtimeTypes.has(record.sourceType)) runtimeSha256.add(record.sha256);
    for (const field of [
      "canonicalPath",
      "quarantineRelativePath",
      "canonicalPhysicalRelativePath",
    ]) {
      if (record[field] !== undefined) placementMetadata.add(portableRelative(record[field], `Predecessor ${field}`));
    }
  }

  const missing = plan.missingDependencies.map(safeMissingRecord)
    .sort((left, right) => compareText(left.canonicalPath, right.canonicalPath));
  const appliedMissing = applied.unresolvedDependencies.records.map(safeMissingRecord)
    .sort((left, right) => compareText(left.canonicalPath, right.canonicalPath));
  invariant(JSON.stringify(missing) === JSON.stringify(appliedMissing), "Predecessor plan/applied missing records differ");
  for (const record of missing) {
    invariant(!canonical.catalogByPath.has(record.canonicalPath), "A predecessor missing MP3 is now canonical");
    placementMetadata.add(record.canonicalPath);
  }

  return {
    closureSha256,
    runtimeSha256,
    placementMetadata,
    missing,
    input: {
      plan: safeDescriptor(REPOSITORY_INPUTS.predecessorPlan, planInspected),
      appliedReceipt: safeDescriptor(
        REPOSITORY_INPUTS.predecessorApplied,
        appliedInspected,
      ),
      transactionId: applied.transactionId,
    },
    summary: {
      copyRecordCount: plan.copyRecords.length,
      existingBindingCount: plan.existingBindings.length,
      knownClosureRecordCount: knownRecords.length,
      knownClosureUniqueSha256Count: closureSha256.size,
      knownClosureSha256SetSha256: setDigest(closureSha256),
      knownRuntimeUniqueSha256Count: runtimeSha256.size,
      knownRuntimeSha256SetSha256: setDigest(runtimeSha256),
      companionAuthoringRecordCount: knownRecords.filter((record) => record.sourceType === "same-path-fla").length,
      unresolvedSourceCount: missing.length,
      unresolvedPathSetSha256: missingPathSetDigest(missing),
      appliedAndCurrentCanonicalBindingsExact: true,
    },
  };
}

function validateAlignmentCanonicalRecord(record, pathField, canonical, label) {
  invariant(record && typeof record === "object" && !Array.isArray(record), `${label} is invalid`);
  const canonicalPath = portableRelative(record[pathField], `${label} path`);
  invariant(Number.isSafeInteger(record.bytes) && record.bytes >= 0, `${label} bytes are invalid`);
  invariant(/^[0-9a-f]{64}$/.test(record.sha256), `${label} SHA-256 is invalid`);
  const current = canonical.catalogByPath.get(canonicalPath);
  invariant(current, `${label} is absent from current canonical custody`);
  invariant(
    current.bytes === record.bytes && current.sha256 === record.sha256,
    `${label} differs from current canonical bytes`,
  );
  return { canonicalPath, bytes: record.bytes, sha256: record.sha256 };
}

function normalizedAlignmentMissing(record, label) {
  const canonicalPath = portableRelative(record.canonicalPath, `${label} path`);
  invariant(
    canonicalPath.startsWith("HELP_COURSES/ELMGR4/") && canonicalPath.endsWith(".mp3"),
    `${label} escaped the Grade 4 MP3 scope`,
  );
  invariant(record.sourceStatus === "required-unresolved-source", `${label} status changed`);
  invariant(record.bytes === null && record.sha256 === null && record.expectedSha256 === null, `${label} invents source identity`);
  invariant(
    record.audioBindingKind === "ordinary-spanish-page"
      || record.audioBindingKind === "final-quiz-question-answer",
    `${label} audio-binding kind changed`,
  );
  invariant(record.language === "en" || record.language === "es", `${label} language changed`);
  invariant(
    typeof record.bindingEvidence === "string" && record.bindingEvidence.length > 0,
    `${label} binding evidence changed`,
  );
  invariant(Array.isArray(record.requiredBy) && record.requiredBy.length > 0, `${label} requirements changed`);
  const requiredBy = record.requiredBy.map((value) => portableRelative(value, `${label} requirement`));
  for (const field of [
    "nearNameOrBasenameMatchAuthorized",
    "silenceAuthorized",
    "synthesizedAudioAuthorized",
  ]) {
    invariant(record[field] === false, `${label} ${field} changed`);
  }
  invariant(Array.isArray(record.allowedSubstitutions) && record.allowedSubstitutions.length === 0, `${label} substitutions changed`);
  return {
    canonicalPath,
    audioBindingKind: record.audioBindingKind,
    language: record.language,
    requiredBy,
  };
}

function compareMissingBinding(left, right, label) {
  invariant(left.canonicalPath === right.canonicalPath, `${label} path changed`);
  invariant(left.audioBindingKind === right.audioBindingKind, `${label} kind changed`);
  invariant(
    JSON.stringify(left.requiredBy) === JSON.stringify(right.requiredBy),
    `${label} requiredBy binding changed`,
  );
}

export async function validateRuntimeAlignment({
  root = projectRoot,
  digIntakeRoot = defaultDigIntakeRoot,
  canonical,
  predecessor,
  sql,
  rejectedV1,
} = {}) {
  invariant(canonical && predecessor && sql && rejectedV1, "Runtime alignment prerequisites are required");
  const inspected = await readStableFile(
    path.join(root, EPOCH_INPUTS.runtimeAlignment),
    "Grade 4 runtime alignment",
  );
  assertEpochSha256({
    runtimeAlignment: inspected,
    sqlAggregate: { sha256: sql.input.sha256 },
    rejectedV1: { sha256: rejectedV1.input.sha256 },
  });
  const alignment = parseJson(inspected.bytes, "Grade 4 runtime alignment");
  invariant(
    alignment.schemaVersion === 1
      && alignment.artifactType === "g4-curriculum-runtime-dependency-alignment",
    "Runtime alignment identity changed",
  );
  invariant(
    alignment.status
      === "source-order-and-runtime-obligations-aligned-with-explicit-audio-and-keyterm-blockers",
    "Runtime alignment status changed",
  );
  invariant(alignment.planDate === "2026-08-04", "Runtime alignment date changed");
  invariant(
    alignment.inputs?.sqlAggregate?.path === EPOCH_INPUTS.sqlAggregate
      && alignment.inputs?.sqlAggregate?.bytes === sql.input.bytes
      && alignment.inputs?.sqlAggregate?.sha256 === sql.input.sha256,
    "Runtime alignment does not bind the current SQL aggregate bytes",
  );
  invariant(
    alignment.inputs?.sourceCatalog?.path === canonical.input.sourceCatalog.path
      && alignment.inputs?.sourceCatalog?.bytes === canonical.input.sourceCatalog.bytes
      && alignment.inputs?.sourceCatalog?.sha256 === canonical.input.sourceCatalog.sha256,
    "Runtime alignment does not bind the current canonical catalog bytes",
  );
  invariant(
    alignment.inputs?.priorActivePromotionPlan?.path === predecessor.input.plan.path
      && alignment.inputs?.priorActivePromotionPlan?.bytes === predecessor.input.plan.bytes
      && alignment.inputs?.priorActivePromotionPlan?.sha256 === predecessor.input.plan.sha256,
    "Runtime alignment does not bind the predecessor Grade 4 plan",
  );
  invariant(
    alignment.evidenceOrder?.currentPageSequenceAuthority
      === "12 active canonical lesson index.xml files"
      && alignment.evidenceOrder?.historicalSqlRole
        === "2021 aggregate curriculum context only"
      && alignment.evidenceOrder?.sourcePresenceDoesNotProveRuntimeOrAcceptance === true,
    "Runtime alignment evidence-order boundary changed",
  );

  const expectedLessonNumbers = Array.from(
    { length: EXPECTED.alignmentLessonCount },
    (_, index) => index + 1,
  );
  invariant(
    alignment.course?.grade === 4
      && alignment.course?.lessonCount === EXPECTED.alignmentLessonCount
      && alignment.course?.activePageCount === EXPECTED.alignmentPageCount
      && alignment.course?.shellCount === EXPECTED.alignmentShellCount
      && alignment.course?.sourceMemberCount === EXPECTED.alignmentSourceMemberCount
      && alignment.course?.sourceMemberCustodyComplete === true,
    "Runtime alignment course totals changed",
  );
  invariant(
    Array.isArray(alignment.course.lessons)
      && alignment.course.lessons.length === EXPECTED.alignmentLessonCount,
    "Runtime alignment lessons changed",
  );

  const pageRecords = [];
  const shellRecords = [];
  const sequenceAuthorityRecords = [];
  const pageKeys = new Map();
  const orderedPageLines = [];
  const lessonDeclarationBindings = [];
  for (const [lessonIndex, lesson] of alignment.course.lessons.entries()) {
    const lessonNumber = lessonIndex + 1;
    invariant(lesson.lessonNumber === lessonNumber, "Runtime alignment lesson order changed");
    invariant(
      Array.isArray(lesson.pages) && lesson.pageCount === lesson.pages.length,
      `Runtime alignment Lesson ${lessonNumber} page count changed`,
    );
    const sequenceRecord = validateAlignmentCanonicalRecord(
      lesson.currentSequenceAuthority,
      "path",
      canonical,
      `Runtime alignment Lesson ${lessonNumber} sequence authority`,
    );
    invariant(
      sequenceRecord.canonicalPath === `HELP_COURSES/ELMGR4/L${lessonNumber}/index.xml`,
      `Runtime alignment Lesson ${lessonNumber} sequence path changed`,
    );
    sequenceAuthorityRecords.push(sequenceRecord);
    const sqlLesson = sql.report.lessons[lessonIndex];
    invariant(
      sqlLesson.lessonNumber === lessonNumber
        && sqlLesson.currentSequenceAuthority?.canonicalXmlPath === sequenceRecord.canonicalPath
        && sqlLesson.currentSequenceAuthority?.xmlBytes === sequenceRecord.bytes
        && sqlLesson.currentSequenceAuthority?.xmlSha256 === sequenceRecord.sha256
        && sqlLesson.currentSequenceAuthority?.activePageReferenceCount === lesson.pageCount,
      `Runtime alignment Lesson ${lessonNumber} differs from SQL aggregate context binding`,
    );
    invariant(
      lesson.historicalSqlAggregate?.sequenceAuthority === false
        && lesson.historicalSqlAggregate?.historicalLessonId === sqlLesson.historicalLessonId
        && lesson.historicalSqlAggregate?.title === sqlLesson.title
        && lesson.historicalSqlAggregate?.url === sqlLesson.url
        && lesson.historicalSqlAggregate?.quizUrl === sqlLesson.quizUrl
        && JSON.stringify(lesson.historicalSqlAggregate?.aggregates)
          === JSON.stringify(sqlLesson.aggregates),
      `Runtime alignment Lesson ${lessonNumber} historical aggregate changed`,
    );
    const shellRecord = validateAlignmentCanonicalRecord(
      lesson.shell,
      "path",
      canonical,
      `Runtime alignment Lesson ${lessonNumber} shell`,
    );
    invariant(
      shellRecord.canonicalPath === `HELP_COURSES/ELMGR4/L${lessonNumber}/index_local.swf`,
      `Runtime alignment Lesson ${lessonNumber} shell path changed`,
    );
    shellRecords.push(shellRecord);
    invariant(lesson.keyTerms && typeof lesson.keyTerms === "object", `Runtime alignment Lesson ${lessonNumber} Key Terms changed`);
    lessonDeclarationBindings.push({ lessonNumber, ...lesson.keyTerms });

    for (const [pageIndex, page] of lesson.pages.entries()) {
      const globalPageOrdinal = pageIndex + 1;
      invariant(
        page.globalPageOrdinal === globalPageOrdinal
          && Number.isSafeInteger(page.sectionNumber)
          && page.sectionNumber > 0
          && Number.isSafeInteger(page.sectionPageOrdinal)
          && page.sectionPageOrdinal > 0
          && typeof page.sectionCode === "string"
          && page.sectionCode.length > 0,
        `Runtime alignment Lesson ${lessonNumber} page order changed`,
      );
      const pageRecord = validateAlignmentCanonicalRecord(
        page,
        "expectedPath",
        canonical,
        `Runtime alignment Lesson ${lessonNumber} page ${globalPageOrdinal}`,
      );
      pageRecords.push(pageRecord);
      const pageKey = `${lessonNumber}\0${globalPageOrdinal}\0${pageRecord.canonicalPath}`;
      invariant(!pageKeys.has(pageKey), "Runtime alignment contains a duplicate ordered page key");
      pageKeys.set(pageKey, pageRecord);
      orderedPageLines.push(
        `${lessonNumber}\t${globalPageOrdinal}\t${page.sectionCode}\t${page.sectionPageOrdinal}\t${pageRecord.canonicalPath}\t${pageRecord.sha256}`,
      );
    }
  }
  invariant(pageRecords.length === EXPECTED.alignmentPageCount, "Runtime alignment page records changed");
  invariant(shellRecords.length === EXPECTED.alignmentShellCount, "Runtime alignment shell records changed");
  invariant(
    sha256Bytes(`${orderedPageLines.join("\n")}\n`)
      === alignment.course.orderedPageSet?.sha256,
    "Runtime alignment ordered-page digest changed",
  );
  invariant(
    alignmentRecordSetDigest(shellRecords) === alignment.course.shellRecordSet?.sha256,
    "Runtime alignment shell record-set digest changed",
  );

  invariant(
    alignment.quiz?.activeWrapperCount === EXPECTED.alignmentQuizWrapperCount
      && Array.isArray(alignment.quiz?.wrappers)
      && alignment.quiz.wrappers.length === EXPECTED.alignmentQuizWrapperCount
      && alignment.quiz?.sqlAggregateIsDefinitionContextNotRuntimeContract === true,
    "Runtime alignment quiz summary changed",
  );
  for (const [index, wrapper] of alignment.quiz.wrappers.entries()) {
    const canonicalPath = portableRelative(wrapper.expectedPath, `Quiz wrapper ${index + 1}`);
    const pageRecord = pageKeys.get(
      `${wrapper.lessonNumber}\0${wrapper.globalPageOrdinal}\0${canonicalPath}`,
    );
    invariant(
      pageRecord
        && pageRecord.bytes === wrapper.bytes
        && pageRecord.sha256 === wrapper.sha256,
      `Quiz wrapper ${index + 1} is not an exact ordered-page binding`,
    );
  }
  invariant(
    Array.isArray(alignment.quiz.targetSwfEvidence)
      && alignment.quiz.targetSwfEvidence.length === EXPECTED.alignmentLessonCount,
    "Runtime alignment quiz target evidence changed",
  );
  const pagePathSet = new Set(pageRecords.map((record) => record.canonicalPath));
  for (const target of alignment.quiz.targetSwfEvidence) {
    invariant(
      pagePathSet.has(portableRelative(target.canonicalPath, "Quiz target path")),
      "Quiz target escaped the ordered-page runtime universe",
    );
  }

  invariant(
    alignment.localization?.sectionsWithEnglishAndSpanishTitles === 96
      && alignment.localization?.totalSections === 96
      && alignment.localization?.pagesWithSourceSpanishSubpageTitle === 470
      && alignment.localization?.pagesUsingEnglishFallbackForSpanish === 175
      && alignment.localization?.fallbackIsExplicitAndNotTranslationAcceptance === true
      && JSON.stringify(alignment.localization?.audioLanguages) === JSON.stringify(["en", "es"]),
    "Runtime alignment EN/ES boundary changed",
  );

  invariant(
    alignment.audio?.expected === EXPECTED.alignmentAudioExpected
      && alignment.audio?.present === EXPECTED.alignmentAudioPresent
      && alignment.audio?.missing === EXPECTED.alignmentAudioMissing
      && alignment.audio?.dependencyClosureComplete === false
      && Array.isArray(alignment.audio?.obligations)
      && alignment.audio.obligations.length === EXPECTED.alignmentAudioExpected
      && Array.isArray(alignment.audio?.missingDependencies)
      && alignment.audio.missingDependencies.length === EXPECTED.alignmentAudioMissing,
    "Runtime alignment audio totals changed",
  );
  const audioPresentRecords = [];
  const audioMissingRecords = [];
  const audioPaths = new Set();
  for (const [index, obligation] of alignment.audio.obligations.entries()) {
    const canonicalPath = portableRelative(obligation.canonicalPath, `Audio obligation ${index + 1}`);
    invariant(!audioPaths.has(canonicalPath), "Runtime alignment audio path is duplicated");
    audioPaths.add(canonicalPath);
    if (obligation.sourceStatus === "canonical-source-present") {
      invariant(
        obligation.expectedSha256 === obligation.sha256,
        `Audio obligation ${index + 1} expected SHA-256 changed`,
      );
      audioPresentRecords.push(
        validateAlignmentCanonicalRecord(
          obligation,
          "canonicalPath",
          canonical,
          `Audio obligation ${index + 1}`,
        ),
      );
    } else {
      audioMissingRecords.push(normalizedAlignmentMissing(obligation, `Audio obligation ${index + 1}`));
    }
  }
  invariant(audioPresentRecords.length === EXPECTED.alignmentAudioPresent, "Runtime alignment present-audio count changed");
  invariant(audioMissingRecords.length === EXPECTED.alignmentAudioMissing, "Runtime alignment missing-audio count changed");
  invariant(
    alignmentPathSetDigest(audioPaths) === alignment.audio.allExpectedPathSetSha256,
    "Runtime alignment expected-audio path-set digest changed",
  );
  invariant(
    alignmentRecordSetDigest(audioPresentRecords) === alignment.audio.presentRecordSetSha256,
    "Runtime alignment present-audio record-set digest changed",
  );
  const missingDependencies = alignment.audio.missingDependencies
    .map((record, index) => normalizedAlignmentMissing(record, `Missing audio dependency ${index + 1}`))
    .sort((left, right) => compareText(left.canonicalPath, right.canonicalPath));
  audioMissingRecords.sort((left, right) => compareText(left.canonicalPath, right.canonicalPath));
  invariant(
    JSON.stringify(audioMissingRecords) === JSON.stringify(missingDependencies),
    "Runtime alignment missing obligations/dependencies differ",
  );
  invariant(
    alignmentPathSetDigest(missingDependencies.map((record) => record.canonicalPath))
      === alignment.audio.missingPathSetSha256
      && alignment.audio.missingPathSetSha256 === EXPECTED.missingPathSetSha256,
    "Runtime alignment missing-audio path-set digest changed",
  );
  invariant(
    missingDependencies.length === predecessor.missing.length
      && missingDependencies.length === rejectedV1.candidate.requiredUnresolvedSources.length,
    "Runtime alignment missing-audio predecessor count changed",
  );
  const predecessorMissing = [...predecessor.missing]
    .sort((left, right) => compareText(left.canonicalPath, right.canonicalPath));
  const rejectedMissing = rejectedV1.candidate.requiredUnresolvedSources
    .map((record) => ({
      canonicalPath: portableRelative(record.canonicalPath),
      audioBindingKind: record.audioBindingKind,
      requiredBy: record.requiredBy.map((value) => portableRelative(value)),
    }))
    .sort((left, right) => compareText(left.canonicalPath, right.canonicalPath));
  for (const [index, missing] of missingDependencies.entries()) {
    compareMissingBinding(missing, predecessorMissing[index], `Missing audio ${index + 1} predecessor`);
    compareMissingBinding(missing, rejectedMissing[index], `Missing audio ${index + 1} rejected-v1`);
  }

  invariant(
    Array.isArray(alignment.keyTerms?.lessonDeclarations)
      && alignment.keyTerms.lessonDeclarations.length === EXPECTED.alignmentLessonCount,
    "Runtime alignment Key Term lesson declarations changed",
  );
  for (const [index, declaration] of alignment.keyTerms.lessonDeclarations.entries()) {
    invariant(declaration.lessonNumber === index + 1, "Key Term lesson declaration order changed");
    invariant(
      declaration.runtimeResolutionVerified === false
        && declaration.englishCanonicalPresent === false
        && declaration.spanishCanonicalPresent === false,
      "Key Term lesson runtime-resolution boundary changed",
    );
    const lessonBinding = lessonDeclarationBindings[index];
    for (const key of ["diagramDirectory", "english", "spanish"]) {
      invariant(declaration[key] === lessonBinding[key], `Key Term Lesson ${index + 1} ${key} changed`);
    }
  }
  const diagram = alignment.keyTerms.diagramObligations;
  invariant(
    diagram?.unique === 760
      && diagram?.occurrences === 1_515
      && diagram?.canonicalResolved === 443
      && diagram?.canonicalMissing === 317
      && diagram?.caseVariantPlacementReviewCandidates === EXPECTED.keyTermCaseVariantHolds
      && diagram?.exactPlacementShaReceiptReviewCandidates === EXPECTED.keyTermExactPlacementHolds
      && diagram?.totalCandidateReviewHolds === EXPECTED.keyTermTotalCandidateHolds
      && diagram?.stillUnresolvedAfterAllCandidateReviews === 1
      && diagram?.potentialResolvedAfterReview === 759
      && diagram?.automaticCaseNormalizationAuthorized === false
      && diagram?.automaticExactPlacementAdmissionAuthorized === false
      && Array.isArray(diagram?.missing)
      && diagram.missing.length === 317,
    "Runtime alignment Key Term hold split changed",
  );
  invariant(
    alignmentPathSetDigest(diagram.missing.map((hold) => hold.expectedPath))
      === diagram.missingPathSetSha256,
    "Runtime alignment Key Term missing-path digest changed",
  );
  const caseCandidateRecords = [];
  const exactCandidateRecords = [];
  const allCandidateRecords = [];
  const unresolvedKeyTermRecords = [];
  for (const [index, hold] of diagram.missing.entries()) {
    invariant(hold.expectedSha256 === null, `Key Term hold ${index + 1} invents expected SHA-256`);
    const expectedPath = portableRelative(
      hold.expectedPath,
      `Key Term hold ${index + 1} expected path`,
    );
    if (hold.status === "required-unresolved-source") {
      invariant(hold.candidate === null, "Unresolved Key Term unexpectedly has a candidate");
      unresolvedKeyTermRecords.push({
        candidate: hold.candidate,
        expectedPath,
        expectedSha256: hold.expectedSha256,
        occurrenceCount: hold.occurrenceCount,
        status: hold.status,
      });
      continue;
    }
    invariant(
      hold.candidate?.admissionEffect === "none-until-reviewed-placement-receipt",
      `Key Term hold ${index + 1} admission effect changed`,
    );
    const candidate = {
      canonicalPath: portableRelative(hold.candidate.canonicalPath, `Key Term hold ${index + 1} candidate path`),
      bytes: hold.candidate.bytes,
      sha256: hold.candidate.sha256,
    };
    invariant(Number.isSafeInteger(candidate.bytes) && candidate.bytes >= 0, "Key Term candidate bytes changed");
    invariant(/^[0-9a-f]{64}$/.test(candidate.sha256), "Key Term candidate SHA-256 changed");
    allCandidateRecords.push(candidate);
    if (hold.status === "hold-case-variant-placement-sha-and-receipt-review") {
      invariant(hold.candidate.sameExactPlacement === false, "Case-variant Key Term hold became exact-placement");
      caseCandidateRecords.push(candidate);
    } else {
      invariant(
        hold.status === "hold-exact-placement-sha-and-receipt-review"
          && hold.candidate.sameExactPlacement === true,
        "Exact-placement Key Term hold disposition changed",
      );
      exactCandidateRecords.push(candidate);
    }
  }
  invariant(
    unresolvedKeyTermRecords.length === 1,
    "Polynomial unresolved-source record is not unique",
  );
  const polynomialMissingRecord = unresolvedKeyTermRecords[0];
  invariant(
    polynomialMissingRecord.expectedPath === EXPECTED.polynomialRuntimePath
      && polynomialMissingRecord.expectedSha256 === null
      && polynomialMissingRecord.candidate === null
      && polynomialMissingRecord.status === "required-unresolved-source",
    "Polynomial unresolved-source record changed",
  );
  const polynomialDisposition = diagram.polynomialDisposition;
  exactKeys(
    polynomialDisposition,
    [
      "companionFla",
      "expectedRuntimePath",
      "flaDoesNotSubstituteForShippedRuntime",
      "runtimeSwfPresent",
      "status",
    ],
    "Polynomial disposition",
  );
  exactKeys(
    polynomialDisposition.companionFla,
    ["bytes", "canonicalPath", "sha256"],
    "Polynomial companion FLA",
  );
  invariant(
    polynomialDisposition.expectedRuntimePath === polynomialMissingRecord.expectedPath
      && polynomialDisposition.expectedRuntimePath === EXPECTED.polynomialRuntimePath
      && polynomialDisposition.runtimeSwfPresent === false
      && polynomialDisposition.status === polynomialMissingRecord.status
      && polynomialDisposition.flaDoesNotSubstituteForShippedRuntime === true,
    "Polynomial runtime disposition changed",
  );
  const polynomialCompanionFla = {
    canonicalPath: portableRelative(
      polynomialDisposition.companionFla.canonicalPath,
      "Polynomial companion FLA path",
    ),
    bytes: polynomialDisposition.companionFla.bytes,
    sha256: polynomialDisposition.companionFla.sha256,
  };
  invariant(
    polynomialCompanionFla.canonicalPath === EXPECTED.polynomialCompanionFlaPath
      && polynomialCompanionFla.bytes === EXPECTED.polynomialCompanionFlaBytes
      && polynomialCompanionFla.sha256 === EXPECTED.polynomialCompanionFlaSha256,
    "Polynomial companion FLA identity changed",
  );
  invariant(
    alignment.inputs?.digIntakePlan?.path === EXPECTED.digIntakePlanPath
      && alignment.inputs?.digIntakePlan?.bytes === EXPECTED.digIntakePlanBytes
      && alignment.inputs?.digIntakePlan?.sha256 === EXPECTED.digIntakePlanSha256,
    "Runtime alignment DIG intake-plan identity changed",
  );
  const digIntakePlanInspected = await readStableFile(
    path.join(digIntakeRoot, "manifests", "dig-intake-plan.json"),
    "DIG quarantine intake plan",
    { expectedMode: 0o444 },
  );
  validateInspectedIdentity(
    digIntakePlanInspected,
    {
      bytes: EXPECTED.digIntakePlanBytes,
      sha256: EXPECTED.digIntakePlanSha256,
      mode: 0o444,
    },
    "DIG quarantine intake plan",
  );
  const digIntakePlan = parseJson(
    digIntakePlanInspected.bytes,
    "DIG quarantine intake plan",
  );
  invariant(
    digIntakePlan.schemaVersion === 1
      && digIntakePlan.artifactType === "help-math-drive-zip-source-intake-plan"
      && digIntakePlan.mode === "hash-manifest-plan-only-no-source-mutation"
      && Array.isArray(digIntakePlan.records),
    "DIG quarantine intake-plan boundary changed",
  );
  const polynomialQuarantineRecords = digIntakePlan.records.filter(
    (record) => record.canonicalPath === EXPECTED.polynomialCompanionFlaPath,
  );
  invariant(
    polynomialQuarantineRecords.length === 1,
    "Polynomial companion FLA quarantine record is not unique",
  );
  const polynomialQuarantineRecord = polynomialQuarantineRecords[0];
  invariant(
    polynomialQuarantineRecord.manifestRelativePath === "polynomial.fla"
      && polynomialQuarantineRecord.sourceType === "flash-authoring-source"
      && polynomialQuarantineRecord.bytes === polynomialCompanionFla.bytes
      && polynomialQuarantineRecord.sha256 === polynomialCompanionFla.sha256
      && polynomialQuarantineRecord.pathStatus === "canonical-exact-path-missing"
      && polynomialQuarantineRecord.conflictStatus === "none"
      && polynomialQuarantineRecord.intakeDecision === "candidate"
      && polynomialQuarantineRecord.disposition
        === "candidate-new-source-in-quarantine",
    "Polynomial companion FLA quarantine identity or custody changed",
  );
  const polynomialQuarantineFile = await readStableFile(
    path.join(digIntakeRoot, "verified", "DIG", "polynomial.fla"),
    "Polynomial companion FLA quarantine file",
    { expectedMode: 0o444 },
  );
  validateInspectedIdentity(
    polynomialQuarantineFile,
    {
      bytes: EXPECTED.polynomialCompanionFlaBytes,
      sha256: EXPECTED.polynomialCompanionFlaSha256,
      mode: 0o444,
    },
    "Polynomial companion FLA quarantine file",
  );
  invariant(
    !canonical.catalogByPath.has(polynomialCompanionFla.canonicalPath),
    "Polynomial companion FLA canonical status changed; a new alignment epoch is required",
  );
  invariant(caseCandidateRecords.length === EXPECTED.keyTermCaseVariantHolds, "Key Term case-variant hold count changed");
  invariant(exactCandidateRecords.length === EXPECTED.keyTermExactPlacementHolds, "Key Term exact-placement hold count changed");
  invariant(
    alignmentRecordSetDigest(allCandidateRecords) === diagram.candidateReviewRecordSetSha256
      && alignmentRecordSetDigest(caseCandidateRecords)
        === diagram.caseVariantReviewRecordSetSha256
      && alignmentRecordSetDigest(exactCandidateRecords)
        === diagram.exactPlacementReviewRecordSetSha256,
    "Runtime alignment Key Term hold record-set digest changed",
  );
  for (const key of [
    "runtimeResolutionVerified",
    "caseVariantPlacementAccepted",
    "originalRuntimeBaseline",
    "humanOrOwnerAccepted",
    "strictCompletion",
    "publication",
  ]) {
    invariant(alignment.keyTerms.authorityBoundary?.[key] === false, `Key Term authority ${key} changed`);
  }

  invariant(
    alignment.successorPromotionAdmission?.objectIdentityAuthority
      === "ledger SHA-256 plus bytes plus ledger-file SHA-256"
      && alignment.successorPromotionAdmission?.placementUniverse
        === "only exact source/runtime obligations enumerated in this artifact after a reviewed placement decision",
    "Runtime alignment identity/placement boundary changed",
  );
  for (const key of [
    "filenameOrBasenameAdmissionAuthorized",
    "caseInsensitiveAdmissionAuthorized",
    "missingAudioExpectedSha256Invented",
    "canonicalMutationAuthorizedByThisArtifact",
    "bulkIntakePromotionAuthorized",
  ]) {
    invariant(alignment.successorPromotionAdmission?.[key] === false, `Runtime alignment admission ${key} changed`);
  }
  for (const key of [
    "runtimeDependencyClosure",
    "javascriptRendererCompletion",
    "originalRuntimeFidelity",
    "audioLanguageContentOrSynchronizationAccepted",
    "humanVisualAccepted",
    "ownerAccepted",
    "strictCompletion",
    "atomicWholeCourseIntegration",
    "publication",
  ]) {
    invariant(alignment.authorityBoundary?.[key] === false, `Runtime alignment authority ${key} changed`);
  }

  const runtimeRecords = [
    ...pageRecords,
    ...shellRecords,
    ...sequenceAuthorityRecords,
    ...audioPresentRecords,
  ];
  invariant(
    runtimeRecords.length === EXPECTED.alignmentRuntimeIdentityRecordCount,
    "Runtime alignment identity-record universe changed",
  );
  const runtimeSha256 = new Set(runtimeRecords.map((record) => record.sha256));
  invariant(
    runtimeSha256.size === EXPECTED.alignmentRuntimeIdentityUniqueSha256Count,
    "Runtime alignment unique SHA-256 universe changed",
  );
  return {
    alignment,
    runtimeSha256,
    categorySha256: {
      activePages: new Set(pageRecords.map((record) => record.sha256)),
      lessonShells: new Set(shellRecords.map((record) => record.sha256)),
      sequenceAuthorityXml: new Set(sequenceAuthorityRecords.map((record) => record.sha256)),
      presentAudio: new Set(audioPresentRecords.map((record) => record.sha256)),
    },
    missing: missingDependencies,
    input: safeDescriptor(EPOCH_INPUTS.runtimeAlignment, inspected),
    summary: {
      authority: "current-placement-and-runtime-dependency-universe",
      historicalSqlRole: "historical-aggregate-context-only",
      lessonCount: alignment.course.lessonCount,
      activePageCount: alignment.course.activePageCount,
      shellCount: alignment.course.shellCount,
      sourceMemberCount: alignment.course.sourceMemberCount,
      orderedPageSetSha256: alignment.course.orderedPageSet.sha256,
      quizWrapperCount: alignment.quiz.activeWrapperCount,
      keyTermLessonDeclarationCount: alignment.keyTerms.lessonDeclarations.length,
      keyTermCandidateReviewHolds: {
        total: diagram.totalCandidateReviewHolds,
        caseVariantPlacement: diagram.caseVariantPlacementReviewCandidates,
        exactPlacementShaReceipt: diagram.exactPlacementShaReceiptReviewCandidates,
        admittedByThisPlan: 0,
      },
      residualKeyTermBlocker: {
        count: unresolvedKeyTermRecords.length,
        expectedPath: polynomialMissingRecord.expectedPath,
        expectedSha256: null,
        candidatePresent: false,
        runtimeSwfPresent: polynomialDisposition.runtimeSwfPresent,
        companionFla: {
          ...polynomialCompanionFla,
          quarantinePresent: true,
          quarantineIdentityBoundBy: {
            intakePlanPath: EXPECTED.digIntakePlanPath,
            intakePlanBytes: EXPECTED.digIntakePlanBytes,
            intakePlanSha256: EXPECTED.digIntakePlanSha256,
          },
          canonicalPresent: false,
          custody: "candidate-new-source-in-private-quarantine",
        },
        flaDoesNotSubstituteForShippedRuntime:
          polynomialDisposition.flaDoesNotSubstituteForShippedRuntime,
        status: polynomialDisposition.status,
        admittedByThisPlan: 0,
      },
      localization: {
        languages: alignment.localization.audioLanguages,
        sourceSpanishPageTitles: alignment.localization.pagesWithSourceSpanishSubpageTitle,
        explicitEnglishFallbackPages: alignment.localization.pagesUsingEnglishFallbackForSpanish,
        translationAcceptanceEffect: false,
      },
      audio: {
        expected: alignment.audio.expected,
        present: alignment.audio.present,
        missing: alignment.audio.missing,
        missingPathSetSha256: alignment.audio.missingPathSetSha256,
        dependencyClosureComplete: false,
      },
      knownRuntimeIdentityRecordCount: runtimeRecords.length,
      knownRuntimeUniqueSha256Count: runtimeSha256.size,
      knownRuntimeSha256SetSha256: setDigest(runtimeSha256),
      filenameCaseOrPlacementAdmissionUsed: false,
    },
  };
}

export function analyzeSuccessorEvidence({ frozen, canonical, predecessor, alignment }) {
  invariant(frozen.ledgerSha256.size === EXPECTED.ledgerUnionCount, "Ledger union must contain exactly 6,060 SHA-256 objects");
  invariant(alignment?.runtimeSha256 instanceof Set, "Current runtime alignment is required");
  const canonicalIntersection = intersectionCount(
    frozen.ledgerSha256,
    canonical.canonicalSha256,
  );
  const g4ClosureIntersection = intersectionCount(
    frozen.ledgerSha256,
    predecessor.closureSha256,
  );
  const g4RuntimeIntersection = intersectionCount(
    frozen.ledgerSha256,
    predecessor.runtimeSha256,
  );
  const alignmentRuntimeIntersection = intersectionCount(
    frozen.ledgerSha256,
    alignment.runtimeSha256,
  );
  const categoryIntersections = Object.fromEntries(
    Object.entries(alignment.categorySha256).map(([key, values]) => [
      key,
      intersectionCount(frozen.ledgerSha256, values),
    ]),
  );
  const predecessorMissingByPath = new Map(
    predecessor.missing.map((record) => [record.canonicalPath, record]),
  );
  const requiredUnresolvedSources = alignment.missing.map((record) => {
    const predecessorRecord = predecessorMissingByPath.get(record.canonicalPath);
    invariant(predecessorRecord, "Alignment missing source is absent from predecessor evidence");
    return {
      canonicalPath: record.canonicalPath,
      sourceType: "runtime-bound-audio",
      bindingReason: predecessorRecord.bindingReason,
      audioBindingKind: record.audioBindingKind,
      language: record.language,
      requiredBy: record.requiredBy,
      expectedSha256: null,
      ledgerExactSha256MatchCount: 0,
      filenameCaseOrPlacementAdmissionUsed: false,
      status: "required-unresolved-source",
      resolution:
        "no expected SHA-256 identity exists, so no frozen object is admissible for this obligation",
    };
  });
  invariant(canonicalIntersection === 0, "Frozen ledger/canonical SHA-256 intersection is not zero");
  invariant(g4ClosureIntersection === 0, "Frozen ledger/prior Grade 4 closure SHA-256 intersection is not zero");
  invariant(g4RuntimeIntersection === 0, "Frozen ledger/prior Grade 4 runtime SHA-256 intersection is not zero");
  invariant(
    alignmentRuntimeIntersection === 0,
    "Frozen ledger/current runtime-alignment SHA-256 intersection is not zero",
  );
  invariant(
    Object.values(categoryIntersections).every((count) => count === 0),
    "Frozen ledger/runtime-alignment category SHA-256 intersection is not zero",
  );
  invariant(requiredUnresolvedSources.every((record) => record.expectedSha256 === null), "A required missing MP3 unexpectedly acquired a SHA-256 identity");
  return {
    intersections: {
      frozenLedgerVsCurrentCanonicalSha256: canonicalIntersection,
      frozenLedgerVsPriorG4KnownClosureSha256: g4ClosureIntersection,
      frozenLedgerVsPriorG4KnownRuntimeSha256: g4RuntimeIntersection,
      frozenLedgerVsCurrentAlignmentKnownRuntimeSha256: alignmentRuntimeIntersection,
      frozenLedgerVsCurrentAlignmentCategoriesSha256: categoryIntersections,
      requiredMissingMp3ExactSha256Matches: 0,
    },
    requiredUnresolvedSources,
  };
}

export function buildPlanDocument({
  frozen,
  canonical,
  predecessor,
  sql,
  rejectedV1,
  supersededV2,
  alignment,
  analysis,
}) {
  const plan = {
    schemaVersion: "help-math-g4-ledger-successor-promotion-plan/v3",
    artifactType: "help-math-g4-runtime-dependency-successor-plan",
    planDate: "2026-08-04",
    mode: "plan-only-no-executor",
    scope: {
      grade: 4,
      purpose:
        "evaluate the frozen v7/v8 object union only by complete SHA-256 against the current alignment-defined Grade 4 runtime dependency universe",
      ledgerObjectUniverse: EXPECTED.ledgerUnionCount,
      identityRule: "complete lowercase SHA-256 plus byte count",
      placementUniverseAuthority:
        "current hash-bound Grade 4 curriculum/runtime dependency alignment",
      sqlRole: "historical aggregate context only; never sequence or byte identity authority",
      filenameIdentityAllowed: false,
      pathIdentityAllowed: false,
      caseInsensitiveAdmissionAllowed: false,
      placementMetadataAdmissionAllowed: false,
      blanketPromotionAllowed: false,
    },
    inputs: {
      frozenClosure: frozen.input,
      canonical: canonical.input,
      predecessorGrade4: predecessor.input,
      runtimeAlignment: alignment.input,
      sqlAggregate: sql.input,
      rejectedV1Candidate: rejectedV1.input,
      supersededV2Candidate: supersededV2.input,
    },
    verifiedEvidence: {
      frozenLedger: frozen.summary,
      canonical: canonical.summary,
      predecessorGrade4: predecessor.summary,
      runtimeAlignment: alignment.summary,
      sqlAggregate: sql.summary,
      rejectedV1Candidate: rejectedV1.summary,
      supersededV2Candidate: supersededV2.summary,
      intersections: analysis.intersections,
    },
    decision: {
      outcome: "no-exact-sha256-promotion-candidates",
      reason:
        "none of the 6,060 frozen ledger SHA-256 identities intersects the current alignment-defined known runtime identities; all 16 missing MP3 obligations lack expected SHA-256 identities; and Polynomial.swf remains a unique non-admitted runtime blocker whose hash-bound companion FLA is not a shipped-runtime substitute",
      promotionRecordCount: 0,
      successorPlanMayBeApplied: false,
    },
    predecessorCandidateDisposition: {
      path: rejectedV1.input.path,
      bytes: rejectedV1.input.bytes,
      sha256: rejectedV1.input.sha256,
      disposition: "rejected-runtime-alignment-epoch-not-bound",
      preservedByteForByte: true,
      overwrittenOrDeleted: false,
      promotionAuthority: false,
    },
    supersededV2CandidateDisposition: {
      path: supersededV2.input.path,
      bytes: supersededV2.input.bytes,
      sha256: supersededV2.input.sha256,
      disposition: "superseded-p2-polynomial-and-identity-regression-gaps",
      p2Findings: [
        "residual-Polynomial-runtime-blocker-not-explicitly-cross-validated",
        "frozen-triple-and-rejected-v1-mutation-regressions-not-covered",
      ],
      preservedByteForByte: true,
      overwrittenOrDeleted: false,
      promotionAuthority: false,
    },
    promotionRecords: [],
    requiredUnresolvedSources: analysis.requiredUnresolvedSources,
    controls: {
      planOnly: true,
      executable: false,
      executorPresent: false,
      sourceAssetsMutationPerformed: false,
      sourceAssetsMutationAuthorized: false,
      ledgerObjectsCopied: 0,
      bulkLedgerPromotionProhibited: true,
      futureCandidateRequiresKnownExpectedSha256: true,
      futureCandidateRequiresNewReviewedSuccessorPlan: true,
      runtimeAlignmentEpochRequired: true,
      sqlAggregateEpochRequiredAsHistoricalContextOnly: true,
      frozenClosureTripleIdentityRequired: true,
      rejectedV1BytesAndSha256IdentityRequired: true,
      filenameBasenameCaseOrPlacementAdmissionUsed: false,
    },
    acceptanceEffects: { ...FALSE_ACCEPTANCE_EFFECTS },
    privacyBoundary: {
      rawLedgerPlacementMetadataIncluded: false,
      rawDriveIdsIncluded: false,
      rawPrivateClaimsIncluded: false,
      personallyIdentifyingInformationIncluded: false,
      privateAbsolutePathsIncluded: false,
      aggregateIntersectionCountsOnly: true,
    },
  };
  assertPlanSafety(plan);
  return plan;
}

export function assertPlanSafety(plan) {
  invariant(
    plan.schemaVersion === "help-math-g4-ledger-successor-promotion-plan/v3",
    "Successor artifact is not the corrected v3 schema",
  );
  invariant(plan.mode === "plan-only-no-executor", "Successor artifact is not plan-only");
  assertFrozenClosurePlanIdentity(plan.inputs?.frozenClosure);
  assertEpochSha256({
    runtimeAlignment: plan.inputs?.runtimeAlignment,
    sqlAggregate: plan.inputs?.sqlAggregate,
    rejectedV1: plan.inputs?.rejectedV1Candidate,
  });
  invariant(
    plan.predecessorCandidateDisposition?.disposition
      === "rejected-runtime-alignment-epoch-not-bound"
      && plan.predecessorCandidateDisposition?.sha256 === EXPECTED.rejectedV1Sha256
      && plan.predecessorCandidateDisposition?.preservedByteForByte === true
      && plan.predecessorCandidateDisposition?.overwrittenOrDeleted === false
      && plan.predecessorCandidateDisposition?.promotionAuthority === false,
    "Rejected v1 candidate disposition changed",
  );
  invariant(
    plan.inputs?.supersededV2Candidate?.path === EPOCH_INPUTS.supersededV2
      && plan.inputs?.supersededV2Candidate?.bytes === EXPECTED.supersededV2Bytes
      && plan.inputs?.supersededV2Candidate?.sha256 === EXPECTED.supersededV2Sha256,
    "Superseded v2 candidate identity changed",
  );
  invariant(
    plan.supersededV2CandidateDisposition?.disposition
      === "superseded-p2-polynomial-and-identity-regression-gaps"
      && plan.supersededV2CandidateDisposition?.sha256
        === EXPECTED.supersededV2Sha256
      && JSON.stringify(plan.supersededV2CandidateDisposition?.p2Findings)
        === JSON.stringify([
          "residual-Polynomial-runtime-blocker-not-explicitly-cross-validated",
          "frozen-triple-and-rejected-v1-mutation-regressions-not-covered",
        ])
      && plan.supersededV2CandidateDisposition?.preservedByteForByte === true
      && plan.supersededV2CandidateDisposition?.overwrittenOrDeleted === false
      && plan.supersededV2CandidateDisposition?.promotionAuthority === false,
    "Superseded v2 candidate disposition changed",
  );
  invariant(Array.isArray(plan.promotionRecords) && plan.promotionRecords.length === 0, "Successor plan contains promotion records");
  invariant(plan.decision?.promotionRecordCount === 0, "Successor plan promotion count is not zero");
  invariant(Array.isArray(plan.requiredUnresolvedSources) && plan.requiredUnresolvedSources.length === EXPECTED.missingCount, "Successor plan must retain all 16 unresolved sources");
  invariant(plan.requiredUnresolvedSources.every((record) => record.expectedSha256 === null), "Successor plan invents a missing-source SHA-256");
  assertAllFalse(plan.acceptanceEffects, FALSE_ACCEPTANCE_EFFECTS, "Successor acceptance effects");
  invariant(plan.controls?.executable === false && plan.controls?.executorPresent === false, "Successor plan exposes an executor");
  invariant(plan.controls?.sourceAssetsMutationPerformed === false, "Successor plan claims source-assets mutation");
  invariant(plan.controls?.sourceAssetsMutationAuthorized === false, "Successor plan authorizes source-assets mutation");
  invariant(
    plan.controls?.frozenClosureTripleIdentityRequired === true
      && plan.controls?.rejectedV1BytesAndSha256IdentityRequired === true,
    "Successor plan identity controls changed",
  );
  invariant(
    plan.scope?.filenameIdentityAllowed === false
      && plan.scope?.pathIdentityAllowed === false
      && plan.scope?.caseInsensitiveAdmissionAllowed === false
      && plan.scope?.placementMetadataAdmissionAllowed === false
      && plan.scope?.blanketPromotionAllowed === false,
    "Successor plan broadens non-SHA admission",
  );
  invariant(
    plan.controls?.filenameBasenameCaseOrPlacementAdmissionUsed === false,
    "Successor plan uses a non-SHA admission signal",
  );
  invariant(
    plan.verifiedEvidence?.runtimeAlignment?.keyTermCandidateReviewHolds?.admittedByThisPlan
      === 0,
    "Successor plan admits unresolved Key Term holds",
  );
  const residualKeyTermBlocker =
    plan.verifiedEvidence?.runtimeAlignment?.residualKeyTermBlocker;
  exactKeys(
    residualKeyTermBlocker,
    [
      "admittedByThisPlan",
      "candidatePresent",
      "companionFla",
      "count",
      "expectedPath",
      "expectedSha256",
      "flaDoesNotSubstituteForShippedRuntime",
      "runtimeSwfPresent",
      "status",
    ],
    "Successor residual Key Term blocker",
  );
  exactKeys(
    residualKeyTermBlocker.companionFla,
    [
      "bytes",
      "canonicalPath",
      "canonicalPresent",
      "custody",
      "quarantineIdentityBoundBy",
      "quarantinePresent",
      "sha256",
    ],
    "Successor Polynomial companion FLA",
  );
  exactKeys(
    residualKeyTermBlocker.companionFla.quarantineIdentityBoundBy,
    ["intakePlanBytes", "intakePlanPath", "intakePlanSha256"],
    "Successor Polynomial companion FLA quarantine identity",
  );
  invariant(
    residualKeyTermBlocker.count === 1
      && residualKeyTermBlocker.expectedPath === EXPECTED.polynomialRuntimePath
      && residualKeyTermBlocker.expectedSha256 === null
      && residualKeyTermBlocker.candidatePresent === false
      && residualKeyTermBlocker.runtimeSwfPresent === false
      && residualKeyTermBlocker.companionFla.canonicalPath
        === EXPECTED.polynomialCompanionFlaPath
      && residualKeyTermBlocker.companionFla.bytes
        === EXPECTED.polynomialCompanionFlaBytes
      && residualKeyTermBlocker.companionFla.sha256
        === EXPECTED.polynomialCompanionFlaSha256
      && residualKeyTermBlocker.companionFla.quarantinePresent === true
      && residualKeyTermBlocker.companionFla.canonicalPresent === false
      && residualKeyTermBlocker.companionFla.custody
        === "candidate-new-source-in-private-quarantine"
      && residualKeyTermBlocker.companionFla.quarantineIdentityBoundBy
        .intakePlanPath === EXPECTED.digIntakePlanPath
      && residualKeyTermBlocker.companionFla.quarantineIdentityBoundBy
        .intakePlanBytes === EXPECTED.digIntakePlanBytes
      && residualKeyTermBlocker.companionFla.quarantineIdentityBoundBy
        .intakePlanSha256 === EXPECTED.digIntakePlanSha256
      && residualKeyTermBlocker.flaDoesNotSubstituteForShippedRuntime === true
      && residualKeyTermBlocker.status === "required-unresolved-source"
      && residualKeyTermBlocker.admittedByThisPlan === 0,
    "Successor Polynomial runtime blocker changed",
  );
  const runtimeCategoryIntersections =
    plan.verifiedEvidence?.intersections
      ?.frozenLedgerVsCurrentAlignmentCategoriesSha256;
  exactKeys(
    runtimeCategoryIntersections,
    ["activePages", "lessonShells", "sequenceAuthorityXml", "presentAudio"],
    "Successor runtime-category intersections",
  );
  invariant(
    plan.verifiedEvidence?.intersections?.frozenLedgerVsCurrentAlignmentKnownRuntimeSha256
      === 0
      && Object.values(runtimeCategoryIntersections).every((count) => count === 0)
      && plan.verifiedEvidence?.intersections?.requiredMissingMp3ExactSha256Matches
        === 0,
    "Successor plan runtime-alignment SHA-256 intersections changed",
  );
  const serialized = JSON.stringify(plan);
  for (const forbidden of [
    "/Volumes/",
    "firstObservedSource",
    "firstObservedDriveRootRelativePath",
    "firstObservedDriveFolderId",
    "relativePathBytesBase64",
    "fixedLocalRoots",
  ]) {
    invariant(!serialized.includes(forbidden), `Successor plan leaks forbidden private metadata token: ${forbidden}`);
  }
}

export function serializePlan(plan) {
  assertPlanSafety(plan);
  return `${JSON.stringify(plan, null, 2)}\n`;
}

async function syncDirectory(directory) {
  const handle = await open(directory, fsConstants.O_RDONLY | DIRECTORY | NOFOLLOW);
  try {
    await handle.sync();
  } finally {
    await handle.close();
  }
}

export async function writeAtomicExact(filePath, contents) {
  const expected = Buffer.isBuffer(contents) ? contents : Buffer.from(contents);
  const existing = await lstatOrNull(filePath);
  if (existing) {
    const current = await readStableFile(filePath, "Existing successor plan");
    invariant(current.bytes.equals(expected), "Refusing to overwrite a different successor plan");
    return { outcome: "already-current", sha256: current.sha256, bytes: current.byteCount };
  }
  const preparingPath = path.join(
    path.dirname(filePath),
    `.${path.basename(filePath)}.preparing`,
  );
  const stale = await lstatOrNull(preparingPath);
  if (stale) {
    invariant(stale.isFile() && !stale.isSymbolicLink() && stale.nlink === 1n, "Stale successor-plan output is unsafe");
    await unlink(preparingPath);
    await syncDirectory(path.dirname(filePath));
  }
  const handle = await open(preparingPath, "wx", 0o644);
  try {
    await handle.writeFile(expected);
    await handle.sync();
    await handle.chmod(0o644);
  } finally {
    await handle.close();
  }
  await link(preparingPath, filePath);
  await syncDirectory(path.dirname(filePath));
  const finalInfo = await lstat(filePath, { bigint: true });
  const preparingInfo = await lstat(preparingPath, { bigint: true });
  invariant(sameNode(nodeIdentity(finalInfo), nodeIdentity(preparingInfo)), "Atomic successor-plan publish changed inode identity");
  await unlink(preparingPath);
  await syncDirectory(path.dirname(filePath));
  const published = await readStableFile(filePath, "Published successor plan", {
    expectedMode: 0o644,
  });
  invariant(published.bytes.equals(expected), "Published successor plan bytes changed");
  return { outcome: "written", sha256: published.sha256, bytes: published.byteCount };
}

export function parseArguments(argv) {
  let mode;
  let help = false;
  for (const argument of argv) {
    if (argument === "--help" || argument === "-h") {
      help = true;
      continue;
    }
    if (argument === "--write" || argument === "--check") {
      invariant(!mode, "Choose exactly one of --write or --check");
      mode = argument.slice(2);
      continue;
    }
    throw new Error(`Unknown argument: ${argument}`);
  }
  if (help) return { help: true };
  invariant(mode, "Choose exactly one of --write or --check");
  return { help: false, mode };
}

async function buildCurrentPlan() {
  const [frozen, canonical, sql, rejectedV1, supersededV2] = await Promise.all([
    validateFrozenClosure(),
    validateCanonicalCatalog(),
    validateSqlAggregate(),
    validateRejectedV1(),
    validateSupersededV2(),
  ]);
  const predecessor = await validatePredecessorG4({ canonical });
  const alignment = await validateRuntimeAlignment({
    canonical,
    predecessor,
    sql,
    rejectedV1,
  });
  const analysis = analyzeSuccessorEvidence({
    frozen,
    canonical,
    predecessor,
    alignment,
  });
  return buildPlanDocument({
    frozen,
    canonical,
    predecessor,
    sql,
    rejectedV1,
    supersededV2,
    alignment,
    analysis,
  });
}

function usage() {
  return `Usage:
  node scripts/build-g4-ledger-successor-promotion-plan.mjs --write
  node scripts/build-g4-ledger-successor-promotion-plan.mjs --check

This command reads the frozen v7/v8 closure, the current runtime-alignment and
historical SQL-aggregate epochs, and repository catalogs. It creates or verifies
one corrected plan-only Grade 4 successor v3 artifact while preserving the
rejected v1 and superseded v2 candidates byte-for-byte. It has no promotion
executor and never writes to source-assets or either frozen intake root.`;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(`${usage()}\n`);
    return;
  }
  const plan = await buildCurrentPlan();
  const contents = serializePlan(plan);
  const outputPath = path.join(projectRoot, OUTPUT_RELATIVE_PATH);
  let result;
  if (options.mode === "write") {
    result = await writeAtomicExact(outputPath, contents);
  } else {
    const inspected = await readStableFile(outputPath, "Successor plan", {
      expectedMode: 0o644,
    });
    invariant(inspected.bytes.toString("utf8") === contents, "Successor plan is stale or changed");
    result = {
      outcome: "current-and-verified",
      sha256: inspected.sha256,
      bytes: inspected.byteCount,
    };
  }
  process.stdout.write(`${JSON.stringify({
    ...result,
    output: OUTPUT_RELATIVE_PATH,
    promotionRecordCount: 0,
    requiredUnresolvedSourceCount: EXPECTED.missingCount,
    ledgerUnionCount: EXPECTED.ledgerUnionCount,
    canonicalSha256IntersectionCount:
      plan.verifiedEvidence.intersections.frozenLedgerVsCurrentCanonicalSha256,
    priorG4Sha256IntersectionCount:
      plan.verifiedEvidence.intersections.frozenLedgerVsPriorG4KnownClosureSha256,
    alignmentRuntimeSha256IntersectionCount:
      plan.verifiedEvidence.intersections.frozenLedgerVsCurrentAlignmentKnownRuntimeSha256,
    alignmentRuntimeIdentityRecordCount:
      plan.verifiedEvidence.runtimeAlignment.knownRuntimeIdentityRecordCount,
    alignmentRuntimeUniqueSha256Count:
      plan.verifiedEvidence.runtimeAlignment.knownRuntimeUniqueSha256Count,
    rejectedV1Disposition:
      plan.predecessorCandidateDisposition.disposition,
    supersededV2Disposition:
      plan.supersededV2CandidateDisposition.disposition,
    residualKeyTermRuntimeBlockerCount:
      plan.verifiedEvidence.runtimeAlignment.residualKeyTermBlocker.count,
    acceptanceEffectsAllFalse: true,
  }, null, 2)}\n`);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === scriptPath;
if (isMain) {
  main().catch((error) => {
    process.stderr.write(`${error.stack ?? error.message}\n`);
    process.exitCode = 1;
  });
}
