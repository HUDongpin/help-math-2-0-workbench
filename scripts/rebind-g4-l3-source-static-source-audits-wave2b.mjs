#!/usr/bin/env node

import {createHash, randomBytes} from "node:crypto";
import {constants as FS_CONSTANTS} from "node:fs";
import {
  lstat,
  mkdir,
  open,
  readdir,
  readFile,
  realpath,
} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {
  CAS_STATES,
  acquireWave2bLock,
  adoptWave2bLockForRecovery,
  applyWave2bCasBatch,
  assertWave2bLock,
  inspectWave2bCasItem,
  recoverWave2bCasBatch,
  releaseWave2bLock,
} from "./rebind-g4-l3-source-static-source-audits-wave2b-cas.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const DEFAULT_PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");

export const WAVE2B_CLOSURE_PATHS = Object.freeze({
  script:
    "scripts/rebind-g4-l3-source-static-source-audits-wave2b.mjs",
  test:
    "scripts/rebind-g4-l3-source-static-source-audits-wave2b.test.mjs",
  cas:
    "scripts/rebind-g4-l3-source-static-source-audits-wave2b-cas.mjs",
  casTest:
    "scripts/rebind-g4-l3-source-static-source-audits-wave2b-cas.test.mjs",
  receipt:
    "reports/g4-l3-source-static-source-audit-wave2b-security-closure-receipt.json",
  priorWriter:
    "scripts/rebind-g4-l3-source-static-source-audits-wave2.mjs",
  priorWriterTest:
    "scripts/rebind-g4-l3-source-static-source-audits-wave2.test.mjs",
  priorReceipt:
    "reports/g4-l3-source-static-source-audit-rebind-wave2-receipt.json",
  candidateBuilder:
    "scripts/build-g4-l3-source-static-candidate.mjs",
  sourceAuditMaterializer:
    "scripts/materialize-g4-l3-workspace-source-audits.mjs",
  workRoot:
    "work/g4-l3-source-static-source-audit-wave2b-closure",
  transactionRoot:
    "work/g4-l3-source-static-source-audit-wave2b-closure/transactions",
  lock:
    "work/g4-l3-source-static-source-audit-wave2b-closure/.wave2b.lock",
});

const PRIOR_TRANSACTION_ID =
  "9986e13f4520001c4366a591b7c40bbd66953b7a9b9b6dc5be25d07300c763de";
const PRIOR_TRANSACTION_PATH =
  `work/g4-l3-source-static-source-audit-rebind-wave2/transactions/${PRIOR_TRANSACTION_ID}`;
const NEW_RECEIPT_BINDING = WAVE2B_CLOSURE_PATHS.receipt;
const EXPECTED_MEMBER_COUNT = 19;
const EXPECTED_PRIOR_DIRECTORY_COUNT = 45;

const EXACT_INPUTS = Object.freeze([
  Object.freeze({
    path: WAVE2B_CLOSURE_PATHS.priorWriter,
    bytes: 67_012,
    sha256: "20b4e532a5718d9d5dd13d6036571fce4fcc994bcdc859ffffda86062385a2fd",
    mode: 0o644,
  }),
  Object.freeze({
    path: WAVE2B_CLOSURE_PATHS.priorWriterTest,
    bytes: 9_226,
    sha256: "2c5e465f16a26382f0ed86db0523f53e7170d56215b4aa120e137806c062a522",
    mode: 0o644,
  }),
  Object.freeze({
    path: WAVE2B_CLOSURE_PATHS.priorReceipt,
    bytes: 100_024,
    sha256: "72aef3c853d7f043ed6ac88a51b9f00f56e864715df3a7f6776b67229aabdeba",
    mode: 0o444,
  }),
  Object.freeze({
    path: `${PRIOR_TRANSACTION_PATH}/plan.json`,
    bytes: 11_842,
    sha256: "012959e6a1ffea970f87391c73cd7135c4763dc752fe37f7d444796941988446",
    mode: 0o444,
  }),
  Object.freeze({
    path: `${PRIOR_TRANSACTION_PATH}/commit.json`,
    bytes: 1_310,
    sha256: "839a6fa0ff30313f5c51e8bfa1812caea2045b8e0f0a739ebe0c03c4f387e50b",
    mode: 0o444,
  }),
  Object.freeze({
    path:
      `${PRIOR_TRANSACTION_PATH}/journal/000042-protected-and-postimages-verified.json`,
    bytes: 432,
    sha256: "08cac7f4ad4ebcb7650738e4ec64c3f0fffc1606437af626e7761713a19e1379",
    mode: 0o444,
  }),
  Object.freeze({
    path: WAVE2B_CLOSURE_PATHS.candidateBuilder,
    bytes: 78_676,
    sha256: "81c3e3908f9ef5908fabc973b2107b0ecbb018dca645f15601504b2772c1059d",
    mode: 0o644,
  }),
  Object.freeze({
    path: WAVE2B_CLOSURE_PATHS.sourceAuditMaterializer,
    bytes: 36_651,
    sha256: "9da52c9d17bfec652a9cf58f90419978dcfc76588fd428e1f371b00661d23630",
    mode: 0o644,
  }),
  Object.freeze({
    path: WAVE2B_CLOSURE_PATHS.cas,
    bytes: 93_399,
    sha256: "85089c1c82bd4256e99a6f9bb4f0e9342645e0784d6a8225669b7cd4272f982d",
    mode: 0o644,
  }),
  Object.freeze({
    path: WAVE2B_CLOSURE_PATHS.casTest,
    bytes: 82_449,
    sha256: "1db7d1446d00accbc3c4ab9ec1ae94e058b7723f968819774d444498c156bbd8",
    mode: 0o644,
  }),
]);

export const WAVE2B_PROTECTED_PINS = Object.freeze([
  Object.freeze({
    path: "catalog/completion-ledger.json",
    bytes: 64_286,
    sha256: "8e5f26e1cece647a38182a9d544f509b5c4737df087fc16c34ef9c2a0b774ad0",
    mode: 0o644,
  }),
  Object.freeze({
    path: "catalog/lesson-release-ledger.json",
    bytes: 49_048,
    sha256: "e6dc65da3981a7e497c1a9ecacb60b8ba4acbb18ef0fb3963d2ef28b5b8b02e0",
    mode: 0o644,
  }),
  Object.freeze({
    path: "catalog/lesson-releases.json",
    bytes: 54_579,
    sha256: "ab0ad5dac373f7bf192b603c4c2b0bc4dae9f73fe770eba3be7507d458bfc375",
    mode: 0o644,
  }),
  Object.freeze({
    path: "reports/current-javascript-output-human-approval.json",
    bytes: 3_375_444,
    sha256: "7f291bd72cf2a9c35cdb7d7fcbd3b52c1e3b88ec1e31e66e776b909e9c01cc5c",
    mode: 0o644,
  }),
  Object.freeze({
    path: "reports/pilot-owner-review-packet.json",
    bytes: 2_237_959,
    sha256: "79cde06c3447bed8792934c20e7bae2bc86a8ec2345b682fc37b3e3150e2ba62",
    mode: 0o644,
  }),
  Object.freeze({
    path: "catalog/source-manifest.sha256",
    bytes: 831_011,
    sha256: "a9625fb4a99e026fea09e4a1929edc2fa9d47ccf6cdbca7de4ba9ca75adf211e",
    mode: 0o644,
  }),
  Object.freeze({
    path: "reports/pilot-strict-acceptance.json",
    bytes: 878_503,
    sha256: "dbd0ddcab28be5faf278c3d6bae7be59e5afa403e6c7dbfb77aaecf946875d39",
    mode: 0o644,
  }),
  Object.freeze({
    path: "reports/vb004-semantic-review-packet.json",
    bytes: 23_325,
    sha256: "90cf63d2ee4eaf77c785df17752406b258aa79209f8c4fd18bb8d9719fff32a7",
    mode: 0o644,
  }),
  Object.freeze({
    path: ".gitignore",
    bytes: 998,
    sha256: "6370bf2fa40eb4028e0d08cd11b1072b8de87b82ff51672fa5054828b53e3598",
    mode: 0o644,
  }),
  Object.freeze({
    path: ".vercelignore",
    bytes: 791,
    sha256: "a74757080ee9cfaeec0ba37691401c7cb0386839c7d3efba51f4ba7fe40cd939",
    mode: 0o644,
  }),
]);

const PRIOR_TREE_PIN = Object.freeze({
  fileCount: 120,
  totalBytes: 2_097_970,
  contentTreeSha256:
    "e45e5d978def7061f8382f26f04defaeb1049867d12aed2800f4ed00dcd86cf2",
});

const CURRENT_CANDIDATE_ROWS = Object.freeze([
  ["course-g04-l03-fq-001", 27_718, "78675ab33be01c628419853ce537a724f3bc236168e41c5358be72b2fa34f752", 2_331, "3baae3e9d8c6adc64778b963388aabd582e282fb24c53f027afbd4c1cca8ecc7"],
  ["course-g04-l03-fq-002", 32_143, "97b3febb3f9523865c100c99479a746036be1802179ed3082fd390ede6000305", 1_906, "fa35f155d3a7901725165a291d9f9723a4bf74a3bf55eead1811d838fa2dae13"],
  ["course-g04-l03-gs-002", 108_906, "a9d4052944c4c4a1400077e6c9e7c949f86cb1ea8e40192738fda41535895512", 1_803, "54b63b89f080e14a824b67c723bdd851b80170c9967c55c54a801935ad26ec9b"],
  ["course-g04-l03-in-002", 115_654, "35d739e7262f75576707c9531625241f7dea1300b880f0f42f830abca8f01ea4", 2_045, "41b4b652373bb73e1ad34cd9c0aa43d5d1d584bdea286b7d8990370507a20871"],
  ["course-g04-l03-in-006", 237_629, "9b8611b2cc9f81d1748e60494f8e33d7416e248d36406882bebaefba86cebed9", 2_979, "46ce3ec7f111832ad65ab80c9bfa7c6a6486216459384c50e6da64456b3eba32"],
  ["course-g04-l03-in-007", 128_285, "d13c89f6b64f712c5f5e9e9ad722a37c65ad6fba0d9d1cfe3acad59046844283", 2_012, "44ccd937fb09355813a08f029dfa5a6dcae507a0447bb48a3526c869be472d0e"],
  ["course-g04-l03-in-008", 64_408, "8dcd61bf0f4601e9f3425111cc25a88ea62f041c3b69814efe5f7cb5d4ae6a19", 2_822, "3a6331309e4b69da5332acb44ef211befb935d9d65d509442b8e7947f6c6412e"],
  ["course-g04-l03-in-010", 75_937, "bdb5638eeed2dc50993a74b3a3e8dd9fc7a935c6bdd1b5939378d02c26f17a7b", 2_230, "dc2f4dccf7b3bb8534201eb991de66a0fd3a09030de945bc71fbf7838b7a07c9"],
  ["course-g04-l03-in-011", 104_780, "7f156ae3c462cca28e4edaad86c322431450fdfa7992def707d194ee66e1a9b1", 1_694, "e1b41904f1cd028527fbc5994c84c11e7005c76d3db96c5d5a2f8e96301628ec"],
  ["course-g04-l03-ir-001-341242cc", 45_606, "481aa773f6224327b81bede3fc3ece66cfa101f7439665b48903565e95d2fcc4", 1_708, "ab6905326cc17a97d4e00e767ea48dc49096e4dd67aef805444578eca64f01e7"],
  ["course-g04-l03-rw-002", 278_492, "55b65f0c295309fb26e3125bee0e50721be2c4cc4d4fafe43e64c187c4df5f99", 2_117, "16eddf6db99aab103c29835c1884c1d9bfb4c54924e4b17553dda1f4edc2f047"],
  ["course-g04-l03-rw-004", 106_127, "a3125eb3808aeb0cff9249df574621b97f0ed4de72619d64982ae7fc74444d23", 2_273, "2ab0d713c38f20bf0514e96b6caa59d652183789445b5a0d85787ad8424e262e"],
  ["course-g04-l03-ti-005", 61_946, "193ff2397e778e512ebea1054cdb156726ac914b12602b7bb60c0fc2136e64d9", 2_126, "75f36900fb8d2a3334b1020d6e828fe673f3759cf138ca784baecdd25df298a2"],
  ["course-g04-l03-ts-002", 89_146, "b33f28442a0ef6240d4cc844a760a163faacb7d1a35d245422227e5623239136", 1_716, "6c17249ab0291217849848bd5c664284f0fdb908248a9e0f09165358d5eb62e9"],
  ["course-g04-l03-ts-003", 64_551, "5f9c72fbd3b29ad56d0585cffffff5163bf9459e2a0659f655322c8332040fd0", 1_725, "c4f3c79b4968555147732892638a0a610c8d8f2d89586bbf3c26adae3c07d848"],
  ["course-g04-l03-ts-004", 83_847, "be816ee86e8d370c3a4e04e182b50c979a2356de3b962e6e90aff1b4711a8596", 1_819, "16e8df2c5eed8c30c195f67b9d348b37bf6c69aab3d4bb458789edb260e5f67c"],
  ["course-g04-l03-ts-005", 72_988, "8ab65a6241b11da4a41451287435b63ef3cf0a078e0efc08b8c1b33321f24d83", 1_715, "c76c1984b40def19c4775c186cc85d317fc9967e9fb017563521a139503110ea"],
  ["course-g04-l03-vb-002", 56_473, "9e0ab83700df8c59b8a0cc8da76a8227872661874683a841a7f497f4a755a756", 1_701, "dcd6f8152ffd3e7571805e5b478a6b374636cfaae547448597b9506e46f7b574"],
  ["course-g04-l03-vb-004", 67_204, "9ca5ecf95a958be5ef54763b6d1662be871c0dd8858a9bb919c6cd0d8a9c6873", 1_746, "6fd03870897508531f7422e6f75a7d91b8998d8997b9857fde2475482e6eb16c"],
]);

const CURRENT_CANDIDATE_PINS = new Map(
  CURRENT_CANDIDATE_ROWS.map(([
    animationId,
    jsonBytes,
    jsonSha256,
    markdownBytes,
    markdownSha256,
  ]) => [animationId, {
    json: {bytes: jsonBytes, sha256: jsonSha256},
    markdown: {bytes: markdownBytes, sha256: markdownSha256},
  }]),
);
const EXPECTED_ANIMATION_IDS = Object.freeze(
  CURRENT_CANDIDATE_ROWS.map(([animationId]) => animationId),
);

export const WAVE2B_AUTHORITY_BOUNDARY = Object.freeze({
  acceptanceNeutral: true,
  currentJavaScriptCandidateOnly: true,
  specBindingOnly: true,
  candidateReportsRebuiltByThisTransaction: false,
  originalRuntimeAuthorityCreated: false,
  authoritativeRuntimeTraceCreated: false,
  audioAcceptanceCreated: false,
  visualParityOrRmseCreated: false,
  independentHumanReviewCreated: false,
  ownerAcceptanceCreated: false,
  strictCompletionCreated: false,
  completionLedgerWriteAuthorized: false,
  lessonReleaseWriteAuthorized: false,
  publicReleaseAuthorized: false,
  sourceAssetWriteAuthorized: false,
  migrationCoverageWriteAuthorized: false,
  approvalOrProtectedPinWriteAuthorized: false,
  strictAcceptanceEffect: "none",
  releaseEffect: "none",
});

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

class Wave2bOuterSnapshotDriftError extends Error {
  constructor(message, {cause = null} = {}) {
    super(message);
    this.name = "Wave2bOuterSnapshotDriftError";
    this.code = "WAVE2B_OUTER_SNAPSHOT_DRIFT";
    if (cause !== null) this.cause = cause;
  }
}

function isSnapshotDrift(error, seen = new Set()) {
  if (
    error?.code === "WAVE2B_OUTER_SNAPSHOT_DRIFT" ||
    error?.code === "WAVE2B_MEMBER_SNAPSHOT_DRIFT"
  ) return true;
  if (
    error === null ||
    (typeof error !== "object" && typeof error !== "function") ||
    seen.has(error)
  ) return false;
  seen.add(error);
  if (
    error instanceof AggregateError &&
    error.errors.some((child) => isSnapshotDrift(child, seen))
  ) return true;
  return isSnapshotDrift(error.cause, seen);
}

function snapshotInvariant(condition, message) {
  if (!condition) throw new Wave2bOuterSnapshotDriftError(message);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function jsonBytes(value) {
  return Buffer.from(stableJson(value));
}

function fingerprint(value, field) {
  const copy = structuredClone(value);
  delete copy[field];
  return sha256(jsonBytes(copy));
}

function withFingerprint(value, field) {
  const copy = structuredClone(value);
  copy[field] = fingerprint(copy, field);
  return copy;
}

function validateFingerprint(value, field, label) {
  invariant(
    /^[a-f0-9]{64}$/u.test(value?.[field] ?? "") &&
      value[field] === fingerprint(value, field),
    `${label} fingerprint is stale`,
  );
}

function safeRelative(relativePath, label = "path") {
  const segments =
    typeof relativePath === "string" ? relativePath.split("/") : [];
  invariant(
    typeof relativePath === "string" &&
      relativePath.length > 0 &&
      !path.isAbsolute(relativePath) &&
      path.posix.normalize(relativePath) === relativePath &&
      segments.every((segment) =>
        segment.length > 0 &&
        segment !== "." &&
        segment !== "..") &&
      !relativePath.includes("\\") &&
      !relativePath.includes("\0"),
    `${label} is not a safe normalized project-relative path: ${relativePath}`,
  );
  return relativePath;
}

function normalizeProjectRoot(projectRoot) {
  invariant(
    typeof projectRoot === "string" &&
      path.isAbsolute(projectRoot) &&
      path.normalize(projectRoot) === projectRoot &&
      !projectRoot.includes("\0"),
    "projectRoot must be a normalized absolute path",
  );
  return projectRoot;
}

function projectPath(projectRoot, relativePath) {
  safeRelative(relativePath);
  const target = path.join(projectRoot, ...relativePath.split("/"));
  const relative = path.relative(projectRoot, target);
  invariant(
    relative.length > 0 &&
      !path.isAbsolute(relative) &&
      relative !== ".." &&
      !relative.startsWith(`..${path.sep}`),
    `${relativePath}: path escapes projectRoot`,
  );
  return target;
}

async function exists(target) {
  return lstat(target).then(() => true, (error) => {
    if (error.code === "ENOENT") return false;
    throw error;
  });
}

async function syncDirectory(directoryPath) {
  const handle = await open(directoryPath, FS_CONSTANTS.O_RDONLY);
  try {
    await handle.sync();
  } finally {
    await handle.close();
  }
}

async function assertRealRoot(projectRoot) {
  normalizeProjectRoot(projectRoot);
  const metadata = await lstat(projectRoot);
  invariant(
    metadata.isDirectory() && !metadata.isSymbolicLink(),
    "projectRoot must be a real directory",
  );
  const resolved = await realpath(projectRoot);
  invariant(resolved === projectRoot, "projectRoot must already be canonical");
  return {
    dev: String(metadata.dev),
    ino: String(metadata.ino),
    mode: metadata.mode & 0o777,
    nlink: metadata.nlink,
    mtimeMs: String(metadata.mtimeMs),
    ctimeMs: String(metadata.ctimeMs),
    realPath: resolved,
  };
}

async function assertRealParentChain(projectRoot, relativePath, {
  allowMissingLeaf = false,
  createDirectories = false,
} = {}) {
  safeRelative(relativePath);
  await assertRealRoot(projectRoot);
  const segments = relativePath.split("/");
  const directorySegments = segments.slice(0, -1);
  let cursor = projectRoot;
  for (const segment of directorySegments) {
    cursor = path.join(cursor, segment);
    let metadata;
    try {
      metadata = await lstat(cursor);
    } catch (error) {
      if (error.code !== "ENOENT" || !createDirectories) throw error;
      await mkdir(cursor, {recursive: false, mode: 0o700});
      await syncDirectory(path.dirname(cursor));
      metadata = await lstat(cursor);
    }
    invariant(
      metadata.isDirectory() && !metadata.isSymbolicLink(),
      `${cursor}: parent must be a real directory`,
    );
    const resolved = await realpath(cursor);
    const relative = path.relative(projectRoot, resolved);
    invariant(
      relative === "" ||
        (!path.isAbsolute(relative) &&
          relative !== ".." &&
          !relative.startsWith(`..${path.sep}`)),
      `${cursor}: parent escapes projectRoot`,
    );
  }
  const target = projectPath(projectRoot, relativePath);
  if (!allowMissingLeaf) {
    const metadata = await lstat(target);
    invariant(!metadata.isSymbolicLink(), `${relativePath}: symlink rejected`);
  }
  return target;
}

async function readStableRegular(projectRoot, relativePath, expected = null) {
  const target = await assertRealParentChain(projectRoot, relativePath);
  const before = await lstat(target);
  invariant(
    before.isFile() &&
      !before.isSymbolicLink() &&
      before.nlink === 1,
    `${relativePath}: expected a single-link regular file`,
  );
  const nofollow = FS_CONSTANTS.O_NOFOLLOW ?? 0;
  invariant(
    Number.isInteger(FS_CONSTANTS.O_NOFOLLOW),
    "O_NOFOLLOW is unavailable; fail closed",
  );
  const handle = await open(target, FS_CONSTANTS.O_RDONLY | nofollow);
  let contents;
  let opened;
  try {
    opened = await handle.stat();
    invariant(
      opened.isFile() &&
        opened.dev === before.dev &&
        opened.ino === before.ino &&
        opened.nlink === 1,
      `${relativePath}: file identity changed while opening`,
    );
    contents = await handle.readFile();
  } finally {
    await handle.close();
  }
  const after = await lstat(target);
  invariant(
    after.isFile() &&
      !after.isSymbolicLink() &&
      after.dev === before.dev &&
      after.ino === before.ino &&
      after.size === before.size &&
      after.mtimeMs === before.mtimeMs &&
      after.ctimeMs === before.ctimeMs &&
      after.nlink === 1,
    `${relativePath}: file changed while reading`,
  );
  const binding = {
    path: relativePath,
    bytes: contents.length,
    sha256: sha256(contents),
    mode: after.mode & 0o777,
    dev: String(after.dev),
    ino: String(after.ino),
    mtimeMs: String(after.mtimeMs),
    ctimeMs: String(after.ctimeMs),
  };
  if (expected !== null) {
    if (expected.bytes !== undefined || expected.sha256 !== undefined) {
      invariant(
        binding.bytes === expected.bytes &&
          binding.sha256 === expected.sha256,
        `${relativePath}: exact bytes/SHA-256 pin drifted`,
      );
    }
    if (expected.mode !== undefined) {
      invariant(binding.mode === expected.mode, `${relativePath}: mode drifted`);
    }
  }
  return {contents, binding};
}

async function readJsonExact(projectRoot, expected, label) {
  const read = await readStableRegular(projectRoot, expected.path, expected);
  let value;
  try {
    value = JSON.parse(read.contents);
  } catch (error) {
    throw new Error(`${label} is not valid JSON`, {cause: error});
  }
  return {...read, value};
}

async function writeImmutableNoReplace(projectRoot, relativePath, contents) {
  invariant(Buffer.isBuffer(contents), `${relativePath}: contents must be bytes`);
  invariant(
    Number.isInteger(FS_CONSTANTS.O_NOFOLLOW) &&
      Number.isInteger(FS_CONSTANTS.O_EXCL),
    "O_NOFOLLOW/O_EXCL unavailable; fail closed",
  );
  const target = await assertRealParentChain(
    projectRoot,
    relativePath,
    {allowMissingLeaf: true, createDirectories: true},
  );
  const handle = await open(
    target,
    FS_CONSTANTS.O_WRONLY |
      FS_CONSTANTS.O_CREAT |
      FS_CONSTANTS.O_EXCL |
      FS_CONSTANTS.O_NOFOLLOW,
    0o600,
  );
  let opened;
  try {
    opened = await handle.stat();
    await handle.writeFile(contents);
    await handle.sync();
    await handle.chmod(0o444);
    await handle.sync();
  } finally {
    await handle.close();
  }
  await syncDirectory(path.dirname(target));
  const observed = await readStableRegular(projectRoot, relativePath, {
    path: relativePath,
    bytes: contents.length,
    sha256: sha256(contents),
    mode: 0o444,
  });
  invariant(
    observed.binding.dev === String(opened.dev) &&
      observed.binding.ino === String(opened.ino),
    `${relativePath}: no-replace inode was replaced`,
  );
  return observed.binding;
}

async function appendJournal(projectRoot, relativePath, record) {
  invariant(
    Number.isInteger(FS_CONSTANTS.O_NOFOLLOW),
    "O_NOFOLLOW unavailable; fail closed",
  );
  const target = await assertRealParentChain(
    projectRoot,
    relativePath,
    {allowMissingLeaf: true, createDirectories: true},
  );
  const existed = await exists(target);
  let before = null;
  if (existed) {
    before = await lstat(target);
    invariant(
      before.isFile() &&
        !before.isSymbolicLink() &&
        before.nlink === 1 &&
        (before.mode & 0o777) === 0o600,
      "journal must remain a private single-link regular file while open",
    );
  }
  const handle = await open(
    target,
    FS_CONSTANTS.O_WRONLY |
      FS_CONSTANTS.O_APPEND |
      FS_CONSTANTS.O_CREAT |
      FS_CONSTANTS.O_NOFOLLOW,
    0o600,
  );
  let opened;
  try {
    opened = await handle.stat();
    invariant(
      opened.isFile() &&
        opened.nlink === 1 &&
        (opened.mode & 0o777) === 0o600 &&
        (before === null ||
          (opened.dev === before.dev && opened.ino === before.ino)),
      "journal handle identity/mode is unsafe",
    );
    await handle.writeFile(Buffer.from(`${JSON.stringify(record)}\n`));
    await handle.sync();
  } finally {
    await handle.close();
  }
  const after = await lstat(target);
  invariant(
    after.isFile() &&
      !after.isSymbolicLink() &&
      after.dev === opened.dev &&
      after.ino === opened.ino &&
      after.nlink === 1 &&
      (after.mode & 0o777) === 0o600,
    "journal path became unsafe after append",
  );
  await syncDirectory(path.dirname(target));
}

async function freezeJournal(projectRoot, relativePath) {
  const target = await assertRealParentChain(projectRoot, relativePath);
  const handle = await open(
    target,
    FS_CONSTANTS.O_RDWR | FS_CONSTANTS.O_NOFOLLOW,
  );
  let opened;
  try {
    const metadata = await handle.stat();
    invariant(
      metadata.isFile() &&
        metadata.nlink === 1 &&
        (metadata.mode & 0o777) === 0o600,
      "journal cannot be frozen from an unsafe state",
    );
    opened = metadata;
    await handle.sync();
    await handle.chmod(0o444);
    await handle.sync();
  } finally {
    await handle.close();
  }
  const after = await lstat(target);
  invariant(
    after.isFile() &&
      !after.isSymbolicLink() &&
      after.dev === opened.dev &&
      after.ino === opened.ino &&
      after.nlink === 1 &&
      (after.mode & 0o777) === 0o444,
    "journal path changed while freezing",
  );
  await syncDirectory(path.dirname(target));
  return (await readStableRegular(projectRoot, relativePath)).binding;
}

function bindingPublic(binding) {
  return {
    path: binding.path,
    bytes: binding.bytes,
    sha256: binding.sha256,
    mode: binding.mode,
  };
}

function samePublicBinding(left, right) {
  return left?.path === right?.path &&
    left?.bytes === right?.bytes &&
    left?.sha256 === right?.sha256 &&
    (right.mode === undefined || left?.mode === right.mode);
}

async function scanPriorTransactionTree(projectRoot) {
  const rootRelative = PRIOR_TRANSACTION_PATH;
  const rootAbsolute = await assertRealParentChain(projectRoot, rootRelative);
  const rootMetadata = await lstat(rootAbsolute);
  invariant(
    rootMetadata.isDirectory() &&
      !rootMetadata.isSymbolicLink() &&
      rootMetadata.nlink >= 1,
    "prior wave2 transaction root must be a real directory",
  );
  const rootResolved = await realpath(rootAbsolute);
  invariant(rootResolved === rootAbsolute, "prior transaction root is indirect");

  const files = [];
  const directories = [];
  async function visit(directoryAbsolute, directoryRelative) {
    const before = await lstat(directoryAbsolute);
    invariant(
      before.isDirectory() &&
        !before.isSymbolicLink() &&
        (before.mode & 0o777) === 0o755,
      `${directoryRelative}: prior-tree directory is not real`,
    );
    directories.push({
      path: directoryRelative || ".",
      mode: before.mode & 0o777,
      nlink: before.nlink,
      dev: String(before.dev),
      ino: String(before.ino),
      mtimeMs: String(before.mtimeMs),
      ctimeMs: String(before.ctimeMs),
    });
    const entries = await readdir(directoryAbsolute, {withFileTypes: true});
    entries.sort((left, right) => left.name.localeCompare(right.name, "en"));
    for (const entry of entries) {
      invariant(
        entry.name !== "." &&
          entry.name !== ".." &&
          !entry.name.includes("/") &&
          !entry.name.includes("\0"),
        `${directoryRelative}: unsafe prior-tree entry name`,
      );
      const childAbsolute = path.join(directoryAbsolute, entry.name);
      const childRelative = directoryRelative
        ? `${directoryRelative}/${entry.name}`
        : entry.name;
      const metadata = await lstat(childAbsolute);
      invariant(!metadata.isSymbolicLink(), `${childRelative}: symlink rejected`);
      if (metadata.isDirectory()) {
        await visit(childAbsolute, childRelative);
        continue;
      }
      invariant(
        metadata.isFile() && metadata.nlink === 1,
        `${childRelative}: prior tree permits files only and no hardlinks`,
      );
      const read = await readStableRegular(
        projectRoot,
        `${rootRelative}/${childRelative}`,
      );
      files.push({
        path: childRelative,
        bytes: read.binding.bytes,
        sha256: read.binding.sha256,
        mode: read.binding.mode,
        nlink: 1,
        dev: read.binding.dev,
        ino: read.binding.ino,
        mtimeMs: read.binding.mtimeMs,
        ctimeMs: read.binding.ctimeMs,
      });
    }
    const after = await lstat(directoryAbsolute);
    invariant(
      after.isDirectory() &&
        !after.isSymbolicLink() &&
        after.dev === before.dev &&
        after.ino === before.ino &&
        after.mtimeMs === before.mtimeMs &&
        after.ctimeMs === before.ctimeMs,
      `${directoryRelative || rootRelative}: directory changed during scan`,
    );
  }
  await visit(rootAbsolute, "");
  files.sort((left, right) => left.path.localeCompare(right.path, "en"));
  directories.sort((left, right) =>
    left.path.localeCompare(right.path, "en"));
  invariant(
    directories.length === EXPECTED_PRIOR_DIRECTORY_COUNT,
    "prior wave2 transaction directory count drifted",
  );
  const contentFiles = files.map((file) => ({
    path: file.path,
    bytes: file.bytes,
    sha256: file.sha256,
    mode: file.mode,
    nlink: file.nlink,
  }));
  const totalBytes = files.reduce((sum, file) => sum + file.bytes, 0);
  const summarizePrefix = (prefix) => {
    const matching = files.filter((file) => file.path.startsWith(prefix));
    return {
      fileCount: matching.length,
      totalBytes: matching.reduce((sum, file) => sum + file.bytes, 0),
    };
  };
  const sectionSummary = {
    journal: summarizePrefix("journal/"),
    specPreimages: summarizePrefix("spec-preimages/"),
    quarantine: summarizePrefix("quarantine/"),
    candidatePreimages: summarizePrefix("candidate-preimages/"),
  };
  invariant(
    sectionSummary.journal.fileCount === 42 &&
      sectionSummary.journal.totalBytes === 34_489 &&
      sectionSummary.specPreimages.fileCount === 19 &&
      sectionSummary.specPreimages.totalBytes === 101_176 &&
      sectionSummary.quarantine.fileCount === 19 &&
      sectionSummary.quarantine.totalBytes === 101_176 &&
      sectionSummary.candidatePreimages.fileCount === 38 &&
      sectionSummary.candidatePreimages.totalBytes === 1_847_977,
    "prior transaction archive/journal section summary drifted",
  );
  const contentTree = {
    schemaVersion: 1,
    digestType:
      "g4-l3-source-static-wave2-prior-transaction-content-tree",
    sourceTransactionId: PRIOR_TRANSACTION_ID,
    fileCount: files.length,
    totalBytes,
    files: contentFiles,
  };
  const contentTreeSha256 = sha256(jsonBytes(contentTree));
  invariant(
    files.length === PRIOR_TREE_PIN.fileCount &&
      totalBytes === PRIOR_TREE_PIN.totalBytes &&
      contentTreeSha256 === PRIOR_TREE_PIN.contentTreeSha256,
    "prior wave2 transaction tree content/addition/deletion/mode pin drifted",
  );
  const manifest = withFingerprint({
    schemaVersion: 1,
    manifestType:
      "g4-l3-source-static-wave2-prior-transaction-tree-manifest",
    sourceTransactionId: PRIOR_TRANSACTION_ID,
    sourceRoot: rootRelative,
    sourceDirectoryIdentity: {
      dev: String(rootMetadata.dev),
      ino: String(rootMetadata.ino),
      mode: rootMetadata.mode & 0o777,
      nlink: rootMetadata.nlink,
      mtimeMs: String(rootMetadata.mtimeMs),
      ctimeMs: String(rootMetadata.ctimeMs),
    },
    fileCount: files.length,
    directoryCount: directories.length,
    totalBytes,
    contentTreeSha256,
    sectionSummary,
    directories,
    files,
  }, "manifestFingerprintSha256");
  return {
    manifest,
    bytes: jsonBytes(manifest),
    rootIdentity: {
      dev: String(rootMetadata.dev),
      ino: String(rootMetadata.ino),
      mtimeMs: String(rootMetadata.mtimeMs),
      ctimeMs: String(rootMetadata.ctimeMs),
    },
  };
}

function validatePriorJournal(priorTree) {
  const journalFiles = priorTree.manifest.files
    .filter((file) => file.path.startsWith("journal/"));
  invariant(journalFiles.length === 42, "prior journal must contain 42 records");
  for (let index = 0; index < journalFiles.length; index += 1) {
    const expectedPrefix = `journal/${String(index + 1).padStart(6, "0")}-`;
    invariant(
      journalFiles[index].path.startsWith(expectedPrefix),
      "prior journal is not a gap-free append sequence",
    );
  }
}

async function validatePriorJournalRecords(projectRoot, priorTree) {
  validatePriorJournal(priorTree);
  const journalFiles = priorTree.manifest.files
    .filter((file) => file.path.startsWith("journal/"));
  let previousFileSha256 = null;
  for (let index = 0; index < journalFiles.length; index += 1) {
    const file = journalFiles[index];
    const read = await readStableRegular(
      projectRoot,
      `${PRIOR_TRANSACTION_PATH}/${file.path}`,
      file,
    );
    const record = JSON.parse(read.contents);
    invariant(
      record.transactionId === PRIOR_TRANSACTION_ID &&
        record.sequence === index + 1 &&
        record.previousRecordSha256 === previousFileSha256,
      `${file.path}: prior append journal chain is invalid`,
    );
    validateFingerprint(record, "recordFingerprintSha256", file.path);
    previousFileSha256 = read.binding.sha256;
  }
  invariant(
    previousFileSha256 === EXACT_INPUTS[5].sha256,
    "prior append journal terminal hash drifted",
  );
}

function parsePinnedPriorArtifacts(priorReceipt, priorPlan, priorCommit) {
  invariant(
    priorReceipt.receiptType ===
      "g4-l3-source-static-source-audit-rebind-wave2-receipt" &&
      priorReceipt.transactionId === PRIOR_TRANSACTION_ID &&
      priorReceipt.scope?.memberCount === EXPECTED_MEMBER_COUNT &&
      priorReceipt.items?.length === EXPECTED_MEMBER_COUNT,
    "prior wave2 receipt structure/scope drifted",
  );
  invariant(
    priorPlan.transactionId === PRIOR_TRANSACTION_ID &&
      priorPlan.specPostimages?.length === EXPECTED_MEMBER_COUNT &&
      priorPlan.specPreimages?.length === EXPECTED_MEMBER_COUNT,
    "prior wave2 plan structure/scope drifted",
  );
  validateFingerprint(priorPlan, "planFingerprintSha256", "prior wave2 plan");
  invariant(
    priorCommit.transactionId === PRIOR_TRANSACTION_ID &&
      priorCommit.itemCount === EXPECTED_MEMBER_COUNT &&
      priorCommit.finalJournalRecordSha256 === EXACT_INPUTS[5].sha256,
    "prior wave2 commit structure drifted",
  );
  validateFingerprint(
    priorCommit,
    "commitFingerprintSha256",
    "prior wave2 commit",
  );
  const postByPath = new Map(
    priorPlan.specPostimages.map((binding) => [binding.path, binding]),
  );
  invariant(postByPath.size === EXPECTED_MEMBER_COUNT,
    "prior wave2 plan has duplicate spec postimages");
  const members = priorReceipt.items.map((item, index) => {
    invariant(
      typeof item.animationId === "string" &&
        typeof item.specPath === "string" &&
        item.specPath === item.preimages?.spec?.path,
      `prior wave2 receipt item ${index} is malformed`,
    );
    const specPreimage = postByPath.get(item.specPath);
    invariant(specPreimage, `${item.animationId}: missing prior spec postimage`);
    for (const binding of [
      item.currentEvidence?.sourceAudit,
      item.preimages?.candidateJson,
      item.preimages?.candidateMarkdown,
      specPreimage,
    ]) {
      invariant(
        typeof binding?.path === "string" &&
          Number.isSafeInteger(binding.bytes) &&
          /^[a-f0-9]{64}$/u.test(binding.sha256 ?? ""),
        `${item.animationId}: invalid exact member binding`,
      );
    }
    const currentCandidatePin = CURRENT_CANDIDATE_PINS.get(item.animationId);
    invariant(
      currentCandidatePin,
      `${item.animationId}: missing current rebuilt candidate pin`,
    );
    return {
      animationId: item.animationId,
      sourceAudit: item.currentEvidence.sourceAudit,
      specPreimage,
      candidateJson: {
        path: item.preimages.candidateJson.path,
        ...currentCandidatePin.json,
      },
      candidateMarkdown: {
        path: item.preimages.candidateMarkdown.path,
        ...currentCandidatePin.markdown,
      },
    };
  });
  invariant(
    new Set(members.map((member) => member.animationId)).size ===
      EXPECTED_MEMBER_COUNT,
    "prior wave2 receipt contains duplicate members",
  );
  return members;
}

function orderedMemberIdentity(members) {
  return members.map((member) => member.animationId);
}

function expectedAncestorPaths(memberPaths) {
  const directories = new Set();
  for (const relativePath of memberPaths) {
    safeRelative(relativePath, "identity-vector member path");
    const segments = relativePath.split("/").slice(0, -1);
    for (let index = 1; index <= segments.length; index += 1) {
      directories.add(segments.slice(0, index).join("/"));
    }
  }
  return [...directories].sort();
}

function validLockedFileIdentity(row) {
  return row !== null &&
    typeof row === "object" &&
    !Array.isArray(row) &&
    Object.keys(row).sort().join(",") === [
      "bytes",
      "ctimeMs",
      "dev",
      "ino",
      "mode",
      "mtimeMs",
      "nlink",
      "path",
      "sha256",
    ].sort().join(",") &&
    typeof row.path === "string" &&
    Number.isSafeInteger(row.bytes) &&
    row.bytes >= 0 &&
    /^[a-f0-9]{64}$/u.test(row.sha256 ?? "") &&
    Number.isSafeInteger(row.mode) &&
    row.nlink === 1 &&
    [row.dev, row.ino, row.mtimeMs, row.ctimeMs].every(
      (value) => typeof value === "string" && value.length > 0,
    );
}

function bindingIdentity(binding) {
  return {
    path: binding.path,
    bytes: binding.bytes,
    sha256: binding.sha256,
    mode: binding.mode,
    nlink: 1,
    dev: binding.dev,
    ino: binding.ino,
    mtimeMs: binding.mtimeMs,
    ctimeMs: binding.ctimeMs,
  };
}

function exactIdentityEqual(left, right) {
  return left?.path === right?.path &&
    left?.bytes === right?.bytes &&
    left?.sha256 === right?.sha256 &&
    left?.mode === right?.mode &&
    left?.nlink === right?.nlink &&
    left?.dev === right?.dev &&
    left?.ino === right?.ino &&
    left?.mtimeMs === right?.mtimeMs &&
    left?.ctimeMs === right?.ctimeMs;
}

function directoryIdentity(metadata, relativePath, timestampsMutable) {
  return {
    path: relativePath,
    mode: metadata.mode & 0o777,
    nlink: metadata.nlink,
    dev: String(metadata.dev),
    ino: String(metadata.ino),
    mtimeMs: String(metadata.mtimeMs),
    ctimeMs: String(metadata.ctimeMs),
    timestampsMutable,
  };
}

function directoryIdentityEqual(left, right) {
  return left?.path === right?.path &&
    left?.mode === right?.mode &&
    left?.dev === right?.dev &&
    left?.ino === right?.ino &&
    (left.timestampsMutable
      ? true
      : left?.nlink === right?.nlink &&
        left.mtimeMs === right?.mtimeMs &&
        left.ctimeMs === right?.ctimeMs);
}

async function captureAncestorIdentities(projectRoot, relativePaths) {
  const rows = [];
  for (const relativePath of expectedAncestorPaths(relativePaths)) {
    const absolute = projectPath(projectRoot, relativePath);
    const metadata = await lstat(absolute);
    invariant(
      metadata.isDirectory() && !metadata.isSymbolicLink(),
      `${relativePath}: snapshot ancestor must be a real directory`,
    );
    const timestampsMutable =
      relativePath === "work" ||
      relativePath === "reports" ||
      /\/audit$/u.test(relativePath);
    rows.push(directoryIdentity(
      metadata,
      relativePath,
      timestampsMutable,
    ));
  }
  return rows;
}

async function buildFullIdentitySnapshot(snapshot) {
  const exactInputs = [...snapshot.exactReads.values()].map((read) =>
    bindingIdentity(read.binding));
  const implementation = snapshot.implementationReads.map((read) =>
    bindingIdentity(read.binding));
  const protectedPins = snapshot.protectedReads.map((read) =>
    bindingIdentity(read.binding));
  const sourceAudits = snapshot.itemReads.map((item) =>
    bindingIdentity(item.sourceAudit.binding));
  const candidatePreimages = snapshot.itemReads.flatMap((item) => [
    bindingIdentity(item.candidateJson.binding),
    bindingIdentity(item.candidateMarkdown.binding),
  ]);
  const specPreimages = snapshot.itemReads.map((item) =>
    bindingIdentity(item.spec.binding));
  const memberPaths = [
    ...exactInputs,
    ...implementation,
    ...protectedPins,
    ...sourceAudits,
    ...candidatePreimages,
    ...specPreimages,
  ].map((binding) => binding.path);
  const ancestors = await captureAncestorIdentities(
    snapshot.projectRoot,
    memberPaths,
  );
  return withFingerprint({
    schemaVersion: 1,
    snapshotType: "g4-l3-wave2b-lock-in-identity-snapshot",
    projectRoot: {
      path: snapshot.projectRoot,
      ...await assertRealRoot(snapshot.projectRoot),
    },
    orderedAnimationIds: snapshot.itemReads.map((item) => item.animationId),
    exactInputs,
    implementation,
    protectedPins,
    sourceAudits,
    candidatePreimages,
    specPreimages,
    ancestors,
    priorTreeManifest: snapshot.priorTree.manifest,
  }, "snapshotFingerprintSha256");
}

function deriveSpecPostimage(specBytes, expectedPreimage, animationId) {
  invariant(
    specBytes.length === expectedPreimage.bytes &&
      sha256(specBytes) === expectedPreimage.sha256,
    `${animationId}: source-static spec is not the exact wave2 postimage`,
  );
  const spec = JSON.parse(specBytes);
  invariant(
    spec.animationId === animationId &&
      Array.isArray(spec.integrationBindings),
    `${animationId}: source-static spec structure drifted`,
  );
  const oldCount = spec.integrationBindings.filter(
    (binding) => binding === WAVE2B_CLOSURE_PATHS.priorReceipt,
  ).length;
  const newCount = spec.integrationBindings.filter(
    (binding) => binding === NEW_RECEIPT_BINDING,
  ).length;
  invariant(
    oldCount === 1 && newCount === 0,
    `${animationId}: receipt bindings are not at the exact S0 state`,
  );
  spec.integrationBindings.push(NEW_RECEIPT_BINDING);
  const postBytes = jsonBytes(spec);
  invariant(
    postBytes.length === specBytes.length + 85,
    `${animationId}: security closure binding is not the exact +85-byte change`,
  );
  return {
    postBytes,
    postimage: {
      path: expectedPreimage.path,
      bytes: postBytes.length,
      sha256: sha256(postBytes),
    },
  };
}

function classifySpecBytes(specBytes, expectedPreimage, animationId) {
  if (
    specBytes.length === expectedPreimage.bytes &&
    sha256(specBytes) === expectedPreimage.sha256
  ) {
    return {
      state: "S0_PREIMAGE",
      ...deriveSpecPostimage(specBytes, expectedPreimage, animationId),
    };
  }
  let spec;
  try {
    spec = JSON.parse(specBytes);
  } catch {
    throw new Error(`${animationId}: spec is neither exact preimage nor JSON`);
  }
  invariant(
    spec.animationId === animationId &&
      Array.isArray(spec.integrationBindings),
    `${animationId}: spec identity drifted`,
  );
  const newIndexes = spec.integrationBindings
    .map((binding, index) => binding === NEW_RECEIPT_BINDING ? index : -1)
    .filter((index) => index >= 0);
  invariant(
    newIndexes.length === 1 &&
      newIndexes[0] === spec.integrationBindings.length - 1,
    `${animationId}: closure receipt must be one final binding`,
  );
  spec.integrationBindings.pop();
  const preBytes = jsonBytes(spec);
  invariant(
    preBytes.length === expectedPreimage.bytes &&
      sha256(preBytes) === expectedPreimage.sha256,
    `${animationId}: spec has changes beyond the exact receipt append`,
  );
  const transition = deriveSpecPostimage(
    preBytes,
    expectedPreimage,
    animationId,
  );
  invariant(
    specBytes.length === transition.postimage.bytes &&
      sha256(specBytes) === transition.postimage.sha256,
    `${animationId}: spec postimage serialization drifted`,
  );
  return {state: "S6_POSTIMAGE", ...transition};
}

async function captureExactInputs(projectRoot) {
  await assertRealRoot(projectRoot);
  const exactReads = new Map();
  for (const expected of EXACT_INPUTS) {
    exactReads.set(
      expected.path,
      await readStableRegular(projectRoot, expected.path, expected),
    );
  }
  const priorReceipt = JSON.parse(
    exactReads.get(WAVE2B_CLOSURE_PATHS.priorReceipt).contents,
  );
  const priorPlan = JSON.parse(
    exactReads.get(`${PRIOR_TRANSACTION_PATH}/plan.json`).contents,
  );
  const priorCommit = JSON.parse(
    exactReads.get(`${PRIOR_TRANSACTION_PATH}/commit.json`).contents,
  );
  const members = parsePinnedPriorArtifacts(
    priorReceipt,
    priorPlan,
    priorCommit,
  );
  const priorTree = await scanPriorTransactionTree(projectRoot);
  await validatePriorJournalRecords(projectRoot, priorTree);

  const protectedReads = [];
  for (const pin of WAVE2B_PROTECTED_PINS) {
    protectedReads.push(
      await readStableRegular(projectRoot, pin.path, pin),
    );
  }

  const itemReads = [];
  for (const member of members) {
    const sourceAudit = await readStableRegular(
      projectRoot,
      member.sourceAudit.path,
      {...member.sourceAudit, mode: 0o644},
    );
    const spec = await readStableRegular(
      projectRoot,
      member.specPreimage.path,
      {path: member.specPreimage.path, mode: 0o644},
    );
    const candidateJson = await readStableRegular(
      projectRoot,
      member.candidateJson.path,
      {...member.candidateJson, mode: 0o644},
    );
    const candidateMarkdown = await readStableRegular(
      projectRoot,
      member.candidateMarkdown.path,
      {...member.candidateMarkdown, mode: 0o644},
    );
    itemReads.push({
      ...member,
      sourceAudit,
      spec,
      candidateJson,
      candidateMarkdown,
      transition: classifySpecBytes(
        spec.contents,
        member.specPreimage,
        member.animationId,
      ),
    });
  }
  const states = new Set(itemReads.map((item) => item.transition.state));
  invariant(states.size === 1, "wave2b specs are in a mixed/partial state");

  const implementationReads = [];
  for (const relativePath of [
    WAVE2B_CLOSURE_PATHS.script,
    WAVE2B_CLOSURE_PATHS.test,
  ]) {
    implementationReads.push(
      await readStableRegular(projectRoot, relativePath, {
        path: relativePath,
        mode: 0o644,
      }),
    );
  }
  const snapshot = {
    projectRoot,
    state: itemReads[0].transition.state,
    exactReads,
    priorReceipt,
    priorPlan,
    priorCommit,
    priorTree,
    protectedReads,
    itemReads,
    implementationReads,
  };
  snapshot.identitySnapshot = await buildFullIdentitySnapshot(snapshot);
  return snapshot;
}

function inputSummary(snapshot) {
  return {
    pinnedInputs: EXACT_INPUTS.map((pin) => ({...pin})),
    implementation: snapshot.implementationReads.map((read) =>
      bindingPublic(read.binding)),
    priorTree: {
      sourceRoot: PRIOR_TRANSACTION_PATH,
      fileCount: snapshot.priorTree.manifest.fileCount,
      totalBytes: snapshot.priorTree.manifest.totalBytes,
      contentTreeSha256: snapshot.priorTree.manifest.contentTreeSha256,
      manifestBytes: snapshot.priorTree.bytes.length,
      manifestSha256: sha256(snapshot.priorTree.bytes),
    },
    protectedPins: WAVE2B_PROTECTED_PINS.map((pin) => ({...pin})),
  };
}

function buildPlan(snapshot, transactionId) {
  invariant(snapshot.state === "S0_PREIMAGE",
    "new wave2b plan requires all 19 exact preimages");
  const transactionRelative =
    `${WAVE2B_CLOSURE_PATHS.transactionRoot}/${transactionId}`;
  const plan = withFingerprint({
    schemaVersion: 1,
    planType: "g4-l3-source-static-wave2b-security-closure-plan",
    transactionId,
    memberCount: EXPECTED_MEMBER_COUNT,
    mutation: {
      exactChange:
        `append ${NEW_RECEIPT_BINDING} once to integrationBindings`,
      bytesAddedPerSpec: 85,
      candidateRebuildIncluded: false,
    },
    inputs: inputSummary(snapshot),
    lockInIdentitySnapshot: snapshot.identitySnapshot,
    priorTreeManifest: {
      path: `${transactionRelative}/prior-wave2-tree-manifest.json`,
      bytes: snapshot.priorTree.bytes.length,
      sha256: sha256(snapshot.priorTree.bytes),
    },
    items: snapshot.itemReads.map((item, index) => ({
      index: index + 1,
      animationId: item.animationId,
      sourceAudit: bindingPublic(item.sourceAudit.binding),
      specPreimage: bindingPublic(item.spec.binding),
      specPostimage: item.transition.postimage,
      postBytesBase64: item.transition.postBytes.toString("base64"),
      candidateJsonPreimage: bindingPublic(item.candidateJson.binding),
      candidateMarkdownPreimage:
        bindingPublic(item.candidateMarkdown.binding),
      archives: {
        spec:
          `${transactionRelative}/spec-preimages/${item.spec.binding.path}`,
        candidateJson:
          `${transactionRelative}/candidate-preimages/${item.candidateJson.binding.path}`,
        candidateMarkdown:
          `${transactionRelative}/candidate-preimages/${item.candidateMarkdown.binding.path}`,
      },
      cas: {
        tempOwnershipPath:
          `${transactionRelative}/cas/${String(index + 1).padStart(2, "0")}.temp-owner`,
        tempPath:
          `${transactionRelative}/cas/${String(index + 1).padStart(2, "0")}.post.tmp`,
        quarantinePath:
          `${transactionRelative}/cas/${String(index + 1).padStart(2, "0")}.pre.quarantine`,
        postArchivePath:
          `${transactionRelative}/cas/${String(index + 1).padStart(2, "0")}.post.archive`,
      },
    })),
    receiptPath: WAVE2B_CLOSURE_PATHS.receipt,
    authorityBoundary: WAVE2B_AUTHORITY_BOUNDARY,
  }, "planFingerprintSha256");
  return {
    transactionRelative,
    plan,
    bytes: jsonBytes(plan),
  };
}

function casItemsFromPlan(projectRoot, plan) {
  validateFingerprint(plan, "planFingerprintSha256", "wave2b plan");
  invariant(
    plan.items?.length === EXPECTED_MEMBER_COUNT &&
      plan.memberCount === EXPECTED_MEMBER_COUNT,
    "wave2b plan item count drifted",
  );
  return plan.items.map((item) => {
    const postBytes = Buffer.from(item.postBytesBase64, "base64");
    invariant(
      postBytes.length === item.specPostimage.bytes &&
        sha256(postBytes) === item.specPostimage.sha256,
      `${item.animationId}: plan postBytes drifted`,
    );
    return {
      id: item.animationId,
      rootPath: projectRoot,
      targetPath: projectPath(projectRoot, item.specPreimage.path),
      tempOwnershipPath: projectPath(
        projectRoot,
        item.cas.tempOwnershipPath,
      ),
      tempPath: projectPath(projectRoot, item.cas.tempPath),
      quarantinePath: projectPath(projectRoot, item.cas.quarantinePath),
      postArchivePath: projectPath(projectRoot, item.cas.postArchivePath),
      preimage: {
        bytes: item.specPreimage.bytes,
        sha256: item.specPreimage.sha256,
      },
      postimage: {
        bytes: item.specPostimage.bytes,
        sha256: item.specPostimage.sha256,
      },
      postBytes,
      originalMode: 0o644,
    };
  });
}

function validateIdentitySnapshotSemantics(
  projectRoot,
  locked,
  label = "wave2b lock-in identity snapshot",
) {
  validateFingerprint(
    locked,
    "snapshotFingerprintSha256",
    label,
  );
  invariant(
    locked.projectRoot?.path === projectRoot &&
      locked.projectRoot?.realPath === projectRoot &&
      stableJson(locked.orderedAnimationIds) ===
        stableJson(EXPECTED_ANIMATION_IDS) &&
      locked.exactInputs?.length === EXACT_INPUTS.length &&
      locked.implementation?.length === 2 &&
      locked.specPreimages?.length === EXPECTED_MEMBER_COUNT &&
      locked.sourceAudits?.length === EXPECTED_MEMBER_COUNT &&
      locked.candidatePreimages?.length === EXPECTED_MEMBER_COUNT * 2 &&
      locked.protectedPins?.length === WAVE2B_PROTECTED_PINS.length &&
      locked.priorTreeManifest?.fileCount === PRIOR_TREE_PIN.fileCount &&
      locked.priorTreeManifest?.directoryCount ===
        EXPECTED_PRIOR_DIRECTORY_COUNT &&
      locked.priorTreeManifest?.totalBytes === PRIOR_TREE_PIN.totalBytes &&
      locked.priorTreeManifest?.contentTreeSha256 ===
        PRIOR_TREE_PIN.contentTreeSha256,
    `${label} scope drifted`,
  );
  const allLockedFileRows = [
    ...locked.exactInputs,
    ...locked.implementation,
    ...locked.protectedPins,
    ...locked.sourceAudits,
    ...locked.candidatePreimages,
    ...locked.specPreimages,
  ];
  const canonicalAncestorPaths = expectedAncestorPaths(
    allLockedFileRows.map((row) => row.path),
  );
  invariant(
    allLockedFileRows.every(validLockedFileIdentity) &&
      stableJson(locked.exactInputs.map(bindingPublic)) ===
        stableJson(EXACT_INPUTS) &&
      stableJson(locked.protectedPins.map(bindingPublic)) ===
        stableJson(WAVE2B_PROTECTED_PINS) &&
      stableJson(locked.implementation.map((row) => row.path)) ===
        stableJson([
          WAVE2B_CLOSURE_PATHS.script,
          WAVE2B_CLOSURE_PATHS.test,
        ]) &&
      stableJson(locked.ancestors.map((row) => row.path)) ===
        stableJson(canonicalAncestorPaths) &&
      locked.ancestors.every((row) =>
        row !== null &&
        typeof row === "object" &&
        !Array.isArray(row) &&
        Object.keys(row).sort().join(",") === [
          "ctimeMs",
          "dev",
          "ino",
          "mode",
          "mtimeMs",
          "nlink",
          "path",
          "timestampsMutable",
        ].sort().join(",") &&
        typeof row.timestampsMutable === "boolean" &&
        row.timestampsMutable === (
          row.path === "work" ||
          row.path === "reports" ||
          /\/audit$/u.test(row.path)
        )),
    `${label} exact/protected/implementation/ancestor identity vector drifted`,
  );
  return locked;
}

async function validatePlanDeep(projectRoot, plan) {
  validateFingerprint(plan, "planFingerprintSha256", "wave2b plan");
  invariant(
    plan?.schemaVersion === 1 &&
      plan.planType ===
        "g4-l3-source-static-wave2b-security-closure-plan" &&
      /^[a-f0-9]{64}$/u.test(plan.transactionId ?? "") &&
      plan.memberCount === EXPECTED_MEMBER_COUNT &&
      plan.items?.length === EXPECTED_MEMBER_COUNT &&
      plan.receiptPath === WAVE2B_CLOSURE_PATHS.receipt &&
      stableJson(plan.authorityBoundary) ===
        stableJson(WAVE2B_AUTHORITY_BOUNDARY) &&
      plan.mutation?.bytesAddedPerSpec === 85 &&
      plan.mutation?.candidateRebuildIncluded === false,
    "wave2b plan top-level semantics/authority drifted",
  );
  invariant(
    stableJson(plan.inputs?.pinnedInputs) === stableJson(EXACT_INPUTS) &&
      stableJson(plan.inputs?.protectedPins) ===
        stableJson(WAVE2B_PROTECTED_PINS),
    "wave2b plan exact/protected input pins drifted",
  );
  const locked = plan.lockInIdentitySnapshot;
  validateIdentitySnapshotSemantics(projectRoot, locked);
  invariant(
    stableJson(plan.inputs.implementation) === stableJson(
      locked.implementation.map(bindingPublic),
    ) &&
      stableJson(plan.inputs.priorTree) === stableJson({
        sourceRoot: PRIOR_TRANSACTION_PATH,
        fileCount: locked.priorTreeManifest.fileCount,
        totalBytes: locked.priorTreeManifest.totalBytes,
        contentTreeSha256: locked.priorTreeManifest.contentTreeSha256,
        manifestBytes: plan.priorTreeManifest.bytes,
        manifestSha256: plan.priorTreeManifest.sha256,
      }) &&
      plan.priorTreeManifest.path ===
        `${WAVE2B_CLOSURE_PATHS.transactionRoot}/${plan.transactionId}/prior-wave2-tree-manifest.json`,
    "wave2b plan implementation/prior-tree lock binding drifted",
  );

  const exactReads = new Map();
  for (const expected of EXACT_INPUTS) {
    exactReads.set(
      expected.path,
      await readStableRegular(projectRoot, expected.path, expected),
    );
  }
  const expectedMembers = parsePinnedPriorArtifacts(
    JSON.parse(exactReads.get(WAVE2B_CLOSURE_PATHS.priorReceipt).contents),
    JSON.parse(exactReads.get(`${PRIOR_TRANSACTION_PATH}/plan.json`).contents),
    JSON.parse(exactReads.get(`${PRIOR_TRANSACTION_PATH}/commit.json`).contents),
  );
  const transactionRelative =
    `${WAVE2B_CLOSURE_PATHS.transactionRoot}/${plan.transactionId}`;
  for (let index = 0; index < EXPECTED_MEMBER_COUNT; index += 1) {
    const item = plan.items[index];
    const expected = expectedMembers[index];
    const expectedCandidate = CURRENT_CANDIDATE_PINS.get(
      expected.animationId,
    );
    invariant(
      item.index === index + 1 &&
        item.animationId === EXPECTED_ANIMATION_IDS[index] &&
        item.animationId === expected.animationId &&
        samePublicBinding(item.sourceAudit, {
          ...expected.sourceAudit,
          mode: 0o644,
        }) &&
        samePublicBinding(item.specPreimage, {
          ...expected.specPreimage,
          mode: 0o644,
        }) &&
        item.candidateJsonPreimage.path === expected.candidateJson.path &&
        item.candidateJsonPreimage.bytes === expectedCandidate.json.bytes &&
        item.candidateJsonPreimage.sha256 ===
          expectedCandidate.json.sha256 &&
        item.candidateJsonPreimage.mode === 0o644 &&
        item.candidateMarkdownPreimage.path ===
          expected.candidateMarkdown.path &&
        item.candidateMarkdownPreimage.bytes ===
          expectedCandidate.markdown.bytes &&
        item.candidateMarkdownPreimage.sha256 ===
          expectedCandidate.markdown.sha256 &&
        item.candidateMarkdownPreimage.mode === 0o644,
      `${expected.animationId}: canonical ordered plan bindings drifted`,
    );
    const postBytes = Buffer.from(item.postBytesBase64, "base64");
    invariant(
      postBytes.length === item.specPreimage.bytes + 85 &&
        postBytes.length === item.specPostimage.bytes &&
        sha256(postBytes) === item.specPostimage.sha256 &&
        item.specPostimage.path === item.specPreimage.path,
      `${item.animationId}: canonical +85 postimage binding drifted`,
    );
    const post = JSON.parse(postBytes);
    invariant(
      Array.isArray(post.integrationBindings) &&
        post.integrationBindings.at(-1) === NEW_RECEIPT_BINDING &&
        post.integrationBindings.filter(
          (binding) => binding === NEW_RECEIPT_BINDING,
        ).length === 1,
      `${item.animationId}: canonical receipt append drifted`,
    );
    post.integrationBindings.pop();
    const reconstructedPre = jsonBytes(post);
    invariant(
      reconstructedPre.length === item.specPreimage.bytes &&
        sha256(reconstructedPre) === item.specPreimage.sha256,
      `${item.animationId}: plan changes more than the exact receipt append`,
    );
    const ordinal = String(index + 1).padStart(2, "0");
    invariant(
      item.archives.spec ===
        `${transactionRelative}/spec-preimages/${item.specPreimage.path}` &&
        item.archives.candidateJson ===
        `${transactionRelative}/candidate-preimages/${item.candidateJsonPreimage.path}` &&
        item.archives.candidateMarkdown ===
        `${transactionRelative}/candidate-preimages/${item.candidateMarkdownPreimage.path}` &&
        item.cas.tempOwnershipPath ===
          `${transactionRelative}/cas/${ordinal}.temp-owner` &&
        item.cas.tempPath ===
          `${transactionRelative}/cas/${ordinal}.post.tmp` &&
        item.cas.quarantinePath ===
          `${transactionRelative}/cas/${ordinal}.pre.quarantine` &&
        item.cas.postArchivePath ===
          `${transactionRelative}/cas/${ordinal}.post.archive`,
      `${item.animationId}: canonical archive/CAS paths drifted`,
    );
    invariant(
      exactIdentityEqual(
        locked.specPreimages[index],
        {
          ...locked.specPreimages[index],
          path: item.specPreimage.path,
          bytes: item.specPreimage.bytes,
          sha256: item.specPreimage.sha256,
          mode: 0o644,
          nlink: 1,
        },
      ),
      `${item.animationId}: lock-in spec identity differs from plan preimage`,
    );
    invariant(
      samePublicBinding(item.sourceAudit, locked.sourceAudits[index]) &&
        samePublicBinding(
          item.candidateJsonPreimage,
          locked.candidatePreimages[index * 2],
        ) &&
        samePublicBinding(
          item.candidateMarkdownPreimage,
          locked.candidatePreimages[index * 2 + 1],
        ),
      `${item.animationId}: plan item differs from its lock-in identity snapshot`,
    );
  }
  return plan;
}

async function assertIdentityRows(
  projectRoot,
  expectedRows,
  label,
  {verifyContents = true} = {},
) {
  await Promise.all(expectedRows.map(async (expected) => {
    invariant(verifyContents, "full identity rows require content verification");
    const observed = await readStableRegular(projectRoot, expected.path, {
      path: expected.path,
      bytes: expected.bytes,
      sha256: expected.sha256,
      mode: expected.mode,
    });
    snapshotInvariant(
      exactIdentityEqual(bindingIdentity(observed.binding), expected),
      `${label} ${expected.path}: same-byte/inode/timestamp identity drift`,
    );
  }));
}

async function assertAncestorRows(projectRoot, expectedRows) {
  const observed = (await Promise.all(expectedRows.map(async (row) => {
    const metadata = await lstat(projectPath(projectRoot, row.path));
    invariant(
      metadata.isDirectory() && !metadata.isSymbolicLink(),
      `${row.path}: snapshot ancestor must remain a real directory`,
    );
    return directoryIdentity(
      metadata,
      row.path,
      row.timestampsMutable,
    );
  }))).sort((left, right) => left.path.localeCompare(right.path, "en"));
  snapshotInvariant(
    observed.length === expectedRows.length,
    "ancestor snapshot count drifted",
  );
  for (let index = 0; index < expectedRows.length; index += 1) {
    snapshotInvariant(
      directoryIdentityEqual(expectedRows[index], observed[index]),
      `${expectedRows[index].path}: ancestor identity drifted`,
    );
  }
}

function ownerPreflightAncestorMayMutate(relativePath) {
  return relativePath === "work" ||
    WAVE2B_CLOSURE_PATHS.workRoot === relativePath ||
    WAVE2B_CLOSURE_PATHS.workRoot.startsWith(`${relativePath}/`);
}

async function assertOwnerBoundAncestorRows(projectRoot, expectedRows) {
  const observed = (await Promise.all(expectedRows.map(async (row) => {
    const metadata = await lstat(projectPath(projectRoot, row.path));
    invariant(
      metadata.isDirectory() && !metadata.isSymbolicLink(),
      `${row.path}: owner-bound ancestor must remain a real directory`,
    );
    return directoryIdentity(metadata, row.path, false);
  }))).sort((left, right) => left.path.localeCompare(right.path, "en"));
  snapshotInvariant(
    observed.length === expectedRows.length,
    "owner-bound ancestor snapshot count drifted",
  );
  for (let index = 0; index < expectedRows.length; index += 1) {
    const expected = expectedRows[index];
    const current = observed[index];
    const allowTransactionWorkMutation =
      ownerPreflightAncestorMayMutate(expected.path);
    snapshotInvariant(
      expected.path === current.path &&
        expected.mode === current.mode &&
        expected.dev === current.dev &&
        expected.ino === current.ino &&
        (allowTransactionWorkMutation ||
          (expected.nlink === current.nlink &&
            expected.mtimeMs === current.mtimeMs &&
            expected.ctimeMs === current.ctimeMs)),
      `${expected.path}: owner-bound ancestor identity drifted`,
    );
  }
}

async function assertPriorTreeMetadata(
  projectRoot,
  expectedManifest,
) {
  const rootAbsolute = projectPath(projectRoot, PRIOR_TRANSACTION_PATH);
  const expectedDirectories = new Map(
    expectedManifest.directories.map((row) => [row.path, row]),
  );
  const expectedFiles = new Map(
    expectedManifest.files.map((row) => [row.path, row]),
  );
  const seenDirectories = new Set();
  const seenFiles = new Set();
  async function visitNames(directoryAbsolute, directoryRelative = "") {
    const key = directoryRelative || ".";
    const expected = expectedDirectories.get(key);
    snapshotInvariant(expected, `${key}: unexpected prior-tree directory`);
    seenDirectories.add(key);
    const entries = await readdir(directoryAbsolute, {withFileTypes: true});
    entries.sort((left, right) => left.name.localeCompare(right.name, "en"));
    for (const entry of entries) {
      const childRelative = directoryRelative
        ? `${directoryRelative}/${entry.name}`
        : entry.name;
      const childAbsolute = path.join(directoryAbsolute, entry.name);
      if (entry.isDirectory()) {
        await visitNames(childAbsolute, childRelative);
        continue;
      }
      const expectedFile = expectedFiles.get(childRelative);
      snapshotInvariant(
        expectedFile && entry.isFile() && !entry.isSymbolicLink(),
        `${childRelative}: unexpected or unsafe prior-tree entry`,
      );
      seenFiles.add(childRelative);
    }
  }
  await visitNames(rootAbsolute);
  snapshotInvariant(
    seenDirectories.size === expectedDirectories.size &&
      seenFiles.size === expectedFiles.size,
    "prior-tree addition/deletion drifted",
  );
  await Promise.all([
    ...[...expectedDirectories.values()].map(async (expected) => {
      const target = expected.path === "."
        ? rootAbsolute
        : path.join(rootAbsolute, ...expected.path.split("/"));
      const metadata = await lstat(target);
      snapshotInvariant(
        metadata.isDirectory() &&
          !metadata.isSymbolicLink() &&
          (metadata.mode & 0o777) === expected.mode &&
          metadata.nlink === expected.nlink &&
          String(metadata.dev) === expected.dev &&
          String(metadata.ino) === expected.ino &&
          String(metadata.mtimeMs) === expected.mtimeMs &&
          String(metadata.ctimeMs) === expected.ctimeMs,
        `${expected.path}: prior-tree directory identity drifted`,
      );
    }),
    ...[...expectedFiles.values()].map(async (expected) => {
      const observed = await readStableRegular(
        projectRoot,
        `${PRIOR_TRANSACTION_PATH}/${expected.path}`,
        {
          path: `${PRIOR_TRANSACTION_PATH}/${expected.path}`,
          bytes: expected.bytes,
          sha256: expected.sha256,
          mode: expected.mode,
        },
      );
      const identity = bindingIdentity(observed.binding);
      snapshotInvariant(
        identity.nlink === expected.nlink &&
          identity.bytes === expected.bytes &&
          identity.sha256 === expected.sha256 &&
          identity.mode === expected.mode &&
          identity.dev === expected.dev &&
          identity.ino === expected.ino &&
          identity.mtimeMs === expected.mtimeMs &&
          identity.ctimeMs === expected.ctimeMs,
        `${expected.path}: prior-tree file identity drifted`,
      );
    }),
  ]);
}

async function assertLockedNonSpecSnapshot(projectRoot, lockedIdentity) {
  validateFingerprint(
    lockedIdentity,
    "snapshotFingerprintSha256",
    "lock-in identity snapshot",
  );
  const rootMetadata = await lstat(projectRoot);
  const root = {
    path: projectRoot,
    dev: String(rootMetadata.dev),
    ino: String(rootMetadata.ino),
    mode: rootMetadata.mode & 0o777,
    nlink: rootMetadata.nlink,
    mtimeMs: String(rootMetadata.mtimeMs),
    ctimeMs: String(rootMetadata.ctimeMs),
    realPath: projectRoot,
  };
  snapshotInvariant(
    stableJson(root) === stableJson(lockedIdentity.projectRoot),
    "project root identity drifted",
  );
  for (const [rows, label] of [
    [lockedIdentity.exactInputs, "exact input"],
    [lockedIdentity.implementation, "outer implementation"],
    [lockedIdentity.protectedPins, "protected pin"],
    [lockedIdentity.sourceAudits, "source audit"],
    [lockedIdentity.candidatePreimages, "candidate preimage"],
  ]) {
    await assertIdentityRows(projectRoot, rows, label);
  }
  await assertAncestorRows(projectRoot, lockedIdentity.ancestors);
  await assertPriorTreeMetadata(projectRoot, lockedIdentity.priorTreeManifest);
  return true;
}

async function assertLockedReplaySnapshot(projectRoot, lockedIdentity) {
  validateFingerprint(
    lockedIdentity,
    "snapshotFingerprintSha256",
    "lock-in identity snapshot",
  );
  const root = {
    path: projectRoot,
    ...await assertRealRoot(projectRoot),
  };
  snapshotInvariant(
    stableJson(root) === stableJson(lockedIdentity.projectRoot),
    "project root identity drifted",
  );
  for (const [rows, label] of [
    [lockedIdentity.exactInputs, "exact input"],
    [lockedIdentity.implementation, "outer implementation"],
    [lockedIdentity.protectedPins, "protected pin"],
    [lockedIdentity.sourceAudits, "source audit"],
  ]) {
    await assertIdentityRows(
      projectRoot,
      rows,
      label,
      {verifyContents: true},
    );
  }
  await assertAncestorRows(projectRoot, lockedIdentity.ancestors);
  const priorTree = await scanPriorTransactionTree(projectRoot);
  snapshotInvariant(
    stableJson(priorTree.manifest) ===
      stableJson(lockedIdentity.priorTreeManifest),
    "prior-tree full file/directory identity snapshot drifted",
  );
  return priorTree;
}

async function assertOwnerBoundRecoveryPreflight(
  projectRoot,
  preflightIdentity,
) {
  validateIdentitySnapshotSemantics(
    projectRoot,
    preflightIdentity,
    "owner-bound recovery preflight identity snapshot",
  );
  const root = {
    path: projectRoot,
    ...await assertRealRoot(projectRoot),
  };
  snapshotInvariant(
    stableJson(root) === stableJson(preflightIdentity.projectRoot),
    "owner-bound recovery project root identity drifted",
  );
  for (const [rows, label] of [
    [preflightIdentity.exactInputs, "exact input"],
    [preflightIdentity.implementation, "outer implementation"],
    [preflightIdentity.protectedPins, "protected pin"],
    [preflightIdentity.sourceAudits, "source audit"],
    [preflightIdentity.candidatePreimages, "candidate preimage"],
    [preflightIdentity.specPreimages, "spec preimage"],
  ]) {
    await assertIdentityRows(
      projectRoot,
      rows,
      `owner-bound recovery ${label}`,
    );
  }
  await assertOwnerBoundAncestorRows(
    projectRoot,
    preflightIdentity.ancestors,
  );
  await assertPriorTreeMetadata(
    projectRoot,
    preflightIdentity.priorTreeManifest,
  );
  return true;
}

async function classifyLiveCandidate(projectRoot, expected) {
  try {
    const target = await assertRealParentChain(projectRoot, expected.path);
    const metadata = await lstat(target);
    if (
      !metadata.isFile() ||
      metadata.isSymbolicLink() ||
      metadata.nlink !== 1
    ) {
      return {
        path: expected.path,
        state: "candidate-rebuild-external-unverified-unsafe",
        reason: "live candidate is not a single-link regular file",
      };
    }
    const observed = await readStableRegular(projectRoot, expected.path);
    const oldPinnedBytes =
      observed.binding.bytes === expected.bytes &&
      observed.binding.sha256 === expected.sha256;
    return {
      path: expected.path,
      state: oldPinnedBytes
        ? "candidate-rebuild-pending"
        : "candidate-rebuild-external-unverified",
      observed: bindingPublic(observed.binding),
    };
  } catch (error) {
    return {
      path: expected.path,
      state: "candidate-rebuild-external-unverified-unsafe",
      reason: error?.code === "ENOENT"
        ? "live candidate is absent"
        : "live candidate path or identity is unsafe",
    };
  }
}

async function classifyLiveCandidates(projectRoot, plan) {
  const rows = [];
  for (const item of plan.items) {
    rows.push(await classifyLiveCandidate(
      projectRoot,
      item.candidateJsonPreimage,
    ));
    rows.push(await classifyLiveCandidate(
      projectRoot,
      item.candidateMarkdownPreimage,
    ));
  }
  const states = [...new Set(rows.map((row) => row.state))].sort();
  return {
    state: states.length === 1
      ? states[0]
      : "candidate-rebuild-mixed-external-unverified",
    counts: Object.fromEntries(states.map((state) => [
      state,
      rows.filter((row) => row.state === state).length,
    ])),
    files: rows,
  };
}

async function assertSnapshotStillBound(snapshot, {
  expectSpecState = snapshot.state,
  expectedSpecFinals = null,
} = {}) {
  const lockedIdentity = snapshot.identitySnapshot ??
    snapshot.lockInIdentitySnapshot ??
    snapshot;
  const projectRoot = snapshot.projectRoot ??
    lockedIdentity.projectRoot.path;
  await assertLockedNonSpecSnapshot(projectRoot, lockedIdentity);
  if (expectSpecState === "S0_PREIMAGE") {
    await Promise.all(lockedIdentity.specPreimages.map(async (expected) => {
      const observed = await readStableRegular(
        projectRoot,
        expected.path,
        expected,
      );
      snapshotInvariant(
        exactIdentityEqual(
          bindingIdentity(observed.binding),
          expected,
        ),
        `${expected.path}: spec preimage identity drifted`,
      );
    }));
  } else {
    invariant(
      Array.isArray(expectedSpecFinals) &&
        expectedSpecFinals.length === EXPECTED_MEMBER_COUNT,
      "post-state verification requires CAS-produced spec final identities",
    );
    await Promise.all(expectedSpecFinals.map(async (expected) => {
      const observed = await readStableRegular(
        projectRoot,
        expected.path,
        expected,
      );
      snapshotInvariant(
        exactIdentityEqual(
          bindingIdentity(observed.binding),
          expected,
        ),
        `${expected.path}: CAS final spec identity drifted`,
      );
    }));
  }
  return true;
}

async function archivePreimages(
  projectRoot,
  plan,
  snapshot,
  {phaseObserver = null, revalidate = null} = {},
) {
  let archiveCount = 0;
  for (let index = 0; index < plan.items.length; index += 1) {
    const planItem = plan.items[index];
    const readItem = snapshot.itemReads[index];
    for (const [archivePath, read] of [
      [planItem.archives.spec, readItem.spec],
      [planItem.archives.candidateJson, readItem.candidateJson],
      [planItem.archives.candidateMarkdown, readItem.candidateMarkdown],
    ]) {
      await writeImmutableNoReplace(projectRoot, archivePath, read.contents);
      archiveCount += 1;
      if (archiveCount === 1) {
        await notifyPhase(
          phaseObserver,
          "partial-archive",
          {transactionId: plan.transactionId, archivePath},
          revalidate,
        );
      } else if (revalidate !== null) {
        await revalidate();
      }
    }
  }
}

async function verifyArchives(projectRoot, plan) {
  for (const item of plan.items) {
    for (const [archivePath, expected] of [
      [item.archives.spec, item.specPreimage],
      [item.archives.candidateJson, item.candidateJsonPreimage],
      [item.archives.candidateMarkdown, item.candidateMarkdownPreimage],
    ]) {
      await readStableRegular(projectRoot, archivePath, {
        path: archivePath,
        bytes: expected.bytes,
        sha256: expected.sha256,
        mode: 0o444,
      });
    }
  }
}

async function captureCasFinalSpecIdentities(projectRoot, plan, casItems) {
  const finals = [];
  for (let index = 0; index < casItems.length; index += 1) {
    const inspection = await inspectWave2bCasItem(casItems[index], index);
    invariant(
      inspection.state === CAS_STATES.QUARANTINE_FROZEN,
      `${casItems[index].id}: expected S6's frozen physical state, found ${inspection.state}`,
    );
    const observed = await readStableRegular(
      projectRoot,
      plan.items[index].specPostimage.path,
      {
        ...plan.items[index].specPostimage,
        mode: 0o644,
      },
    );
    finals.push(bindingIdentity(observed.binding));
  }
  return finals;
}

async function notifyPhase(
  phaseObserver,
  phase,
  payload,
  revalidate = null,
) {
  if (phaseObserver === null) {
    if (revalidate !== null) await revalidate();
    return;
  }
  invariant(typeof phaseObserver === "function", "phaseObserver must be a function");
  let observerError = null;
  try {
    await phaseObserver(Object.freeze({phase, ...payload}));
  } catch (error) {
    observerError = error;
  }
  let validationError = null;
  if (revalidate !== null) {
    try {
      await revalidate();
    } catch (error) {
      validationError = error;
    }
  }
  if (observerError !== null && validationError !== null) {
    const aggregate = new AggregateError(
      [observerError, validationError],
      `${phase}: phase observer and post-boundary validation failed`,
    );
    if (isSnapshotDrift(validationError)) {
      aggregate.code = validationError.code ??
        "WAVE2B_OUTER_SNAPSHOT_DRIFT";
    }
    throw aggregate;
  }
  if (validationError !== null) throw validationError;
  if (observerError !== null) throw observerError;
}

async function verifyPlanNonmutatedInputs(projectRoot, plan) {
  for (const expected of plan.inputs.pinnedInputs) {
    await readStableRegular(projectRoot, expected.path, expected);
  }
  for (const expected of plan.inputs.implementation) {
    await readStableRegular(projectRoot, expected.path, expected);
  }
  for (const expected of plan.inputs.protectedPins) {
    await readStableRegular(projectRoot, expected.path, expected);
  }
  for (const item of plan.items) {
    for (const expected of [
      item.sourceAudit,
      item.candidateJsonPreimage,
      item.candidateMarkdownPreimage,
    ]) {
      await readStableRegular(projectRoot, expected.path, expected);
    }
  }
  const priorTree = await scanPriorTransactionTree(projectRoot);
  invariant(
    priorTree.bytes.length === plan.priorTreeManifest.bytes &&
      sha256(priorTree.bytes) === plan.priorTreeManifest.sha256,
    "current prior-tree manifest differs from the immutable transaction plan",
  );
  await verifyArchives(projectRoot, plan);
  return priorTree;
}

function buildReceipt(
  lockedSnapshot,
  plan,
  planBinding,
  treeManifestBinding,
  specFinalIdentities,
) {
  invariant(
    Array.isArray(specFinalIdentities) &&
      specFinalIdentities.length === EXPECTED_MEMBER_COUNT,
    "receipt requires all CAS-produced spec final identities",
  );
  return withFingerprint({
    schemaVersion: 1,
    receiptType:
      "g4-l3-source-static-source-audit-wave2b-security-closure-receipt",
    receiptId:
      `g4-l3-source-static-wave2b-security-closure-${plan.transactionId}`,
    transactionId: plan.transactionId,
    status: "verified-acceptance-neutral-spec-security-binding-only",
    scope: {
      memberCount: EXPECTED_MEMBER_COUNT,
      members: plan.items.map((item) => item.animationId),
      exactMutation:
        `one final ${NEW_RECEIPT_BINDING} integration binding per spec`,
      bytesAddedPerSpec: 85,
      specsReachedCasState: CAS_STATES.VERIFIED,
      inspectablePhysicalCasState: CAS_STATES.QUARANTINE_FROZEN,
      candidateReportsRebuiltByThisTransaction: false,
      candidateRebuildRequiredAfterTransaction: true,
      strictCompleteMembersCreated: 0,
      releaseMembersPublished: 0,
    },
    immutableEvidence: {
      plan: bindingPublic(planBinding),
      priorWave2TreeManifest: bindingPublic(treeManifestBinding),
      priorWave2TreeContentSha256:
        lockedSnapshot.priorTree.manifest.contentTreeSha256,
      frozenCasModule: EXACT_INPUTS.find(
        (input) => input.path === WAVE2B_CLOSURE_PATHS.cas,
      ),
      frozenCasTest: EXACT_INPUTS.find(
        (input) => input.path === WAVE2B_CLOSURE_PATHS.casTest,
      ),
      priorWave2Writer: EXACT_INPUTS[0],
      priorWave2WriterTest: EXACT_INPUTS[1],
      priorWave2Receipt: EXACT_INPUTS[2],
      priorWave2Plan: EXACT_INPUTS[3],
      priorWave2Commit: EXACT_INPUTS[4],
      priorWave2FinalJournalRecord: EXACT_INPUTS[5],
      candidateBuilder: EXACT_INPUTS[6],
      sourceAuditMaterializer: EXACT_INPUTS[7],
      orchestrator:
        bindingPublic(lockedSnapshot.implementationReads[0].binding),
      orchestratorTest:
        bindingPublic(lockedSnapshot.implementationReads[1].binding),
      lockInIdentitySnapshotSha256:
        plan.lockInIdentitySnapshot.snapshotFingerprintSha256,
    },
    items: plan.items.map((item, index) => ({
      animationId: item.animationId,
      sourceAudit: item.sourceAudit,
      spec: {
        preimage: item.specPreimage,
        postimage: item.specPostimage,
        finalIdentity: specFinalIdentities[index],
        exactBytesAdded: 85,
      },
      candidatePreimagesArchived: {
        json: item.candidateJsonPreimage,
        markdown: item.candidateMarkdownPreimage,
      },
      candidateRebuildState: "pending-outside-transaction",
    })),
    protectedPins: WAVE2B_PROTECTED_PINS.map((pin) => ({...pin})),
    authorityBoundary: WAVE2B_AUTHORITY_BOUNDARY,
    limitations: [
      "This receipt proves only a fail-closed source-static spec binding transaction.",
      "Candidate JSON/Markdown rebuild is intentionally outside this transaction and remains pending.",
      "No original Flash runtime, audio, RMSE, human review, Owner acceptance, strict completion, ledger promotion, or release authority is created.",
      "The same person may perform project roles, but this software transaction does not impersonate or satisfy any human evidence role.",
    ],
  }, "receiptFingerprintSha256");
}

function journalRecord(
  transactionId,
  sequence,
  previousRecordSha256,
  event,
  data,
) {
  return withFingerprint({
    schemaVersion: 1,
    journalType: "g4-l3-source-static-wave2b-append-journal-record",
    transactionId,
    sequence,
    previousRecordSha256,
    event,
    data,
  }, "recordFingerprintSha256");
}

async function makeJournal(projectRoot, relativePath, transactionId) {
  const target = projectPath(projectRoot, relativePath);
  let sequence = 0;
  let previousRecordSha256 = null;
  if (await exists(target)) {
    const prior = await readStableRegular(projectRoot, relativePath, {
      path: relativePath,
      mode: 0o600,
    });
    invariant(
      prior.contents.length > 0 &&
        prior.contents.at(-1) === 0x0a,
      "journal has a torn/partial terminal record; manual review required",
    );
    const lines = prior.contents.toString("utf8").trimEnd().split("\n");
    for (let index = 0; index < lines.length; index += 1) {
      let record;
      try {
        record = JSON.parse(lines[index]);
      } catch (error) {
        throw new Error(
          "journal has malformed/partial JSON; manual review required",
          {cause: error},
        );
      }
      invariant(
        record.transactionId === transactionId &&
          record.sequence === index + 1 &&
          record.previousRecordSha256 === previousRecordSha256,
        "journal sequence/transaction binding drifted",
      );
      validateFingerprint(
        record,
        "recordFingerprintSha256",
        `wave2b journal record ${index + 1}`,
      );
      previousRecordSha256 = sha256(Buffer.from(`${lines[index]}\n`));
    }
    sequence = lines.length;
  }
  return async (event) => {
    sequence += 1;
    const normalized = typeof event === "string"
      ? {event, data: null}
      : {
        event: event?.event ?? event?.state ?? "cas-event",
        data: event,
      };
    const record = journalRecord(
      transactionId,
      sequence,
      previousRecordSha256,
      normalized.event,
      normalized.data,
    );
    await appendJournal(
      projectRoot,
      relativePath,
      record,
    );
    previousRecordSha256 = sha256(
      Buffer.from(`${JSON.stringify(record)}\n`),
    );
  };
}

function transactionPaths(transactionId) {
  const root = `${WAVE2B_CLOSURE_PATHS.transactionRoot}/${transactionId}`;
  return {
    root,
    plan: `${root}/plan.json`,
    priorTreeManifest: `${root}/prior-wave2-tree-manifest.json`,
    lockBinding: `${root}/lock-binding.json`,
    applyJournal: `${root}/apply-journal.jsonl`,
    preparedReceipt: `${root}/prepared/receipt.json`,
    commit: `${root}/commit.json`,
    recoveryAttempt: `${root}/recovery-attempt.json`,
    recoveryJournal: `${root}/recovery-journal.jsonl`,
    recoveryAdoptedBinding: `${root}/recovery-adopted-binding.json`,
    recoveryComplete: `${root}/recovery-complete.json`,
  };
}

function buildPreparedCommit({
  transactionId,
  planBinding,
  treeManifestBinding,
  lockBinding,
  journalBinding,
  preparedReceiptBinding,
  specFinalIdentities,
}) {
  return withFingerprint({
    schemaVersion: 1,
    commitType:
      "g4-l3-source-static-wave2b-security-closure-prepared-commit",
    transactionId,
    memberCount: EXPECTED_MEMBER_COUNT,
    plan: bindingPublic(planBinding),
    priorWave2TreeManifest: bindingPublic(treeManifestBinding),
    persistedLockBinding: bindingPublic(lockBinding),
    frozenApplyJournal: bindingPublic(journalBinding),
    preparedReceipt: bindingPublic(preparedReceiptBinding),
    canonicalReceiptPath: WAVE2B_CLOSURE_PATHS.receipt,
    canonicalReceiptDerivation:
      "deterministic prepared receipt plus this exact prepared-commit binding",
    lockInIdentitySnapshotSha256:
      specFinalIdentities.lockInIdentitySnapshotSha256,
    orderedSpecFinalIdentities:
      specFinalIdentities.rows.map((row) => ({...row})),
    authorityBoundary: WAVE2B_AUTHORITY_BOUNDARY,
    specCasFinalState: CAS_STATES.VERIFIED,
    candidateRebuildState: "pending-outside-transaction",
    strictAcceptanceEffect: "none",
    releaseEffect: "none",
  }, "commitFingerprintSha256");
}

function finalizeCanonicalReceipt(
  preparedReceipt,
  preparedReceiptBinding,
  commitBinding,
) {
  validateFingerprint(
    preparedReceipt,
    "receiptFingerprintSha256",
    "transaction-local prepared receipt",
  );
  const canonical = structuredClone(preparedReceipt);
  delete canonical.receiptFingerprintSha256;
  canonical.publicationSeal = {
    sealType: "wave2b-receipt-last-prepared-commit-binding",
    preparedReceipt: bindingPublic(preparedReceiptBinding),
    preparedCommit: bindingPublic(commitBinding),
  };
  return withFingerprint(canonical, "receiptFingerprintSha256");
}

function receiptSnapshotView(plan) {
  return {
    priorTree: {manifest: plan.lockInIdentitySnapshot.priorTreeManifest},
    implementationReads: plan.lockInIdentitySnapshot.implementation.map(
      (binding) => ({binding}),
    ),
  };
}

function validateReceiptAgainstPlan(
  receipt,
  preparedReceipt,
  plan,
  planBinding,
  treeManifestBinding,
  specFinalIdentities,
  preparedReceiptBinding,
  commitBinding,
) {
  validateFingerprint(
    receipt,
    "receiptFingerprintSha256",
    "wave2b closure receipt",
  );
  const expectedPrepared = buildReceipt(
    receiptSnapshotView(plan),
    plan,
    planBinding,
    treeManifestBinding,
    specFinalIdentities,
  );
  invariant(
    stableJson(preparedReceipt) === stableJson(expectedPrepared),
    "transaction-local prepared receipt semantics/authority/evidence drifted",
  );
  const expectedCanonical = finalizeCanonicalReceipt(
    expectedPrepared,
    preparedReceiptBinding,
    commitBinding,
  );
  invariant(
    stableJson(receipt) === stableJson(expectedCanonical),
    "canonical receipt semantics/authority/evidence/seal drifted",
  );
  return receipt;
}

function validatePreparedCommit(
  commit,
  inputs,
) {
  validateFingerprint(
    commit,
    "commitFingerprintSha256",
    "wave2b prepared commit",
  );
  const expected = buildPreparedCommit(inputs);
  invariant(
    stableJson(commit) === stableJson(expected),
    "wave2b prepared commit semantics/authority/evidence drifted",
  );
  return commit;
}

function validateJournalBytes(bytes, transactionId, expected) {
  invariant(
    bytes.length > 0 && bytes.at(-1) === 0x0a,
    "frozen apply journal is torn",
  );
  const lines = bytes.toString("utf8").trimEnd().split("\n");
  let previousRecordSha256 = null;
  let last = null;
  let first = null;
  const verifiedMembers = [];
  for (let index = 0; index < lines.length; index += 1) {
    const record = JSON.parse(lines[index]);
    validateFingerprint(
      record,
      "recordFingerprintSha256",
      `frozen apply journal record ${index + 1}`,
    );
    invariant(
      record.transactionId === transactionId &&
        record.sequence === index + 1 &&
        record.previousRecordSha256 === previousRecordSha256,
      "frozen apply journal chain drifted",
    );
    previousRecordSha256 = sha256(Buffer.from(`${lines[index]}\n`));
    if (index === 0) first = record;
    if (record.event === "final-verify-state-validated") {
      verifiedMembers.push({
        animationId: record.data?.id,
        index: record.data?.index,
        state: record.data?.state,
      });
    }
    last = record;
  }
  invariant(
    first?.event === "lock-in-preflight-and-archives-verified" &&
      first.data?.transactionId === transactionId &&
      first.data?.memberCount === EXPECTED_MEMBER_COUNT &&
      samePublicBinding(first.data?.plan, expected.planBinding) &&
      samePublicBinding(
        first.data?.priorTreeManifest,
        expected.treeManifestBinding,
      ) &&
      samePublicBinding(
        first.data?.persistedLockBinding,
        expected.lockBinding,
      ) &&
      stableJson(verifiedMembers) === stableJson(
        expected.plan.items.map((item, index) => ({
          animationId: item.animationId,
          index,
          state: CAS_STATES.VERIFIED,
        })),
      ) &&
      last?.event === "prepared-receipt-and-final-state-verified" &&
      samePublicBinding(
        last.data?.preparedReceipt,
        expected.preparedReceiptBinding,
      ) &&
      last.data?.canonicalReceiptPath ===
        WAVE2B_CLOSURE_PATHS.receipt &&
      last.data?.canonicalReceiptDerivation ===
        "deterministic prepared receipt plus exact prepared-commit binding" &&
      last.data?.memberCount === EXPECTED_MEMBER_COUNT &&
      last.data?.strictAcceptanceEffect === "none" &&
      last.data?.releaseEffect === "none",
    "frozen apply journal required first/member/terminal semantics drifted",
  );
  return {recordCount: lines.length, terminalRecord: last};
}

async function assertFinalSpecIdentities(projectRoot, plan, finals) {
  invariant(
    finals.length === EXPECTED_MEMBER_COUNT,
    "ordered final spec identity count drifted",
  );
  for (let index = 0; index < finals.length; index += 1) {
    const observed = await readStableRegular(
      projectRoot,
      plan.items[index].specPostimage.path,
      {...plan.items[index].specPostimage, mode: 0o644},
    );
    snapshotInvariant(
      exactIdentityEqual(bindingIdentity(observed.binding), finals[index]),
      `${plan.items[index].animationId}: final spec identity drifted`,
    );
  }
}

async function readStableCasCarrier(projectRoot, relativePath) {
  const target = await assertRealParentChain(projectRoot, relativePath);
  const before = await lstat(target);
  invariant(
    before.isFile() &&
      !before.isSymbolicLink() &&
      before.nlink >= 1,
    `${relativePath}: CAS preimage carrier must be a linked regular file`,
  );
  const nofollow = FS_CONSTANTS.O_NOFOLLOW ?? 0;
  invariant(
    Number.isInteger(FS_CONSTANTS.O_NOFOLLOW),
    "O_NOFOLLOW is unavailable; fail closed",
  );
  const handle = await open(target, FS_CONSTANTS.O_RDONLY | nofollow);
  let opened;
  let contents;
  try {
    opened = await handle.stat();
    invariant(
      opened.isFile() &&
        opened.dev === before.dev &&
        opened.ino === before.ino &&
        opened.nlink === before.nlink,
      `${relativePath}: CAS preimage carrier identity changed while opening`,
    );
    contents = await handle.readFile();
  } finally {
    await handle.close();
  }
  const after = await lstat(target);
  invariant(
    after.isFile() &&
      !after.isSymbolicLink() &&
      after.dev === before.dev &&
      after.ino === before.ino &&
      after.nlink === before.nlink &&
      after.size === before.size &&
      after.mtimeMs === before.mtimeMs &&
      after.ctimeMs === before.ctimeMs,
    `${relativePath}: CAS preimage carrier changed while reading`,
  );
  return {
    path: relativePath,
    bytes: contents.length,
    sha256: sha256(contents),
    mode: after.mode & 0o777,
    nlink: after.nlink,
    dev: String(after.dev),
    ino: String(after.ino),
    mtimeMs: String(after.mtimeMs),
    ctimeMs: String(after.ctimeMs),
  };
}

async function assertRecoverablePreimageMtimes(
  projectRoot,
  plan,
  inspections,
) {
  const locked = plan.lockInIdentitySnapshot.specPreimages;
  for (let index = 0; index < plan.items.length; index += 1) {
    const item = plan.items[index];
    const expected = locked[index];
    const inspection = inspections[index];
    const carriers = [
      {
        observed: inspection.observed.target,
        path: item.specPreimage.path,
      },
      {
        observed: inspection.observed.quarantine,
        path: item.cas.quarantinePath,
      },
    ].filter(({observed}) =>
      observed?.kind === "file" &&
      observed.bytes === expected.bytes &&
      observed.sha256 === expected.sha256);
    snapshotInvariant(
      carriers.length > 0,
      `${item.animationId}: exact recoverable preimage carrier is absent`,
    );
    for (const carrier of carriers) {
      const identity = await readStableCasCarrier(
        projectRoot,
        carrier.path,
      );
      snapshotInvariant(
        identity.bytes === expected.bytes &&
          identity.sha256 === expected.sha256 &&
          identity.dev === expected.dev &&
          identity.ino === expected.ino &&
          identity.mtimeMs === expected.mtimeMs,
        `${item.animationId}: recoverable preimage inode/mtime drifted`,
      );
    }
  }
}

async function assertRestoredSpecIdentities(projectRoot, plan) {
  const locked = plan.lockInIdentitySnapshot.specPreimages;
  for (let index = 0; index < plan.items.length; index += 1) {
    const observed = await readStableRegular(
      projectRoot,
      plan.items[index].specPreimage.path,
      {...plan.items[index].specPreimage, mode: 0o644},
    );
    const identity = bindingIdentity(observed.binding);
    invariant(
      identity.path === locked[index].path &&
        identity.bytes === locked[index].bytes &&
        identity.sha256 === locked[index].sha256 &&
        identity.mode === locked[index].mode &&
        identity.nlink === locked[index].nlink &&
        identity.dev === locked[index].dev &&
        identity.ino === locked[index].ino &&
        identity.mtimeMs === locked[index].mtimeMs,
      `${plan.items[index].animationId}: recovery did not restore the exact preimage identity`,
    );
  }
}

async function verifyCommittedReplay(projectRoot, receiptRead) {
  const receipt = receiptRead.value;
  const transactionId = receipt?.transactionId;
  invariant(
    /^[a-f0-9]{64}$/u.test(transactionId ?? ""),
    "wave2b receipt transactionId is invalid",
  );
  const paths = transactionPaths(transactionId);
  const planRead = await readStableRegular(
    projectRoot,
    paths.plan,
    receipt.immutableEvidence?.plan,
  );
  const plan = JSON.parse(planRead.contents);
  await validatePlanDeep(projectRoot, plan);
  invariant(
    plan.transactionId === transactionId,
    "wave2b receipt/plan transaction mismatch",
  );
  const treeRead = await readStableRegular(
    projectRoot,
    paths.priorTreeManifest,
    receipt.immutableEvidence?.priorWave2TreeManifest,
  );
  const preparedReceiptRead = await readStableRegular(
    projectRoot,
    paths.preparedReceipt,
    {path: paths.preparedReceipt, mode: 0o444},
  );
  const preparedReceipt = JSON.parse(preparedReceiptRead.contents);
  const commitRead = await readStableRegular(
    projectRoot,
    paths.commit,
    {path: paths.commit, mode: 0o444},
  );
  const commit = JSON.parse(commitRead.contents);
  const lockBindingRead = await readStableRegular(
    projectRoot,
    paths.lockBinding,
    commit.persistedLockBinding,
  );
  validateAcquiredPersistedBinding(
    projectRoot,
    transactionId,
    JSON.parse(lockBindingRead.contents),
  );
  const journalRead = await readStableRegular(
    projectRoot,
    paths.applyJournal,
    commit.frozenApplyJournal,
  );
  validateJournalBytes(journalRead.contents, transactionId, {
    plan,
    planBinding: planRead.binding,
    treeManifestBinding: treeRead.binding,
    lockBinding: lockBindingRead.binding,
    preparedReceiptBinding: preparedReceiptRead.binding,
  });
  const finalBundle = {
    lockInIdentitySnapshotSha256:
      plan.lockInIdentitySnapshot.snapshotFingerprintSha256,
    rows: commit.orderedSpecFinalIdentities,
  };
  validatePreparedCommit(commit, {
    transactionId,
    planBinding: planRead.binding,
    treeManifestBinding: treeRead.binding,
    lockBinding: lockBindingRead.binding,
    journalBinding: journalRead.binding,
    preparedReceiptBinding: preparedReceiptRead.binding,
    specFinalIdentities: finalBundle,
  });
  validateReceiptAgainstPlan(
    receipt,
    preparedReceipt,
    plan,
    planRead.binding,
    treeRead.binding,
    finalBundle.rows,
    preparedReceiptRead.binding,
    commitRead.binding,
  );
  await verifyArchives(projectRoot, plan);
  await assertLockedReplaySnapshot(
    projectRoot,
    plan.lockInIdentitySnapshot,
  );
  await assertFinalSpecIdentities(
    projectRoot,
    plan,
    commit.orderedSpecFinalIdentities,
  );
  const candidateRebuild = await classifyLiveCandidates(projectRoot, plan);
  const residualLock = await exists(
    projectPath(projectRoot, WAVE2B_CLOSURE_PATHS.lock),
  );
  return {
    mode: "replay",
    status: residualLock
      ? "committed-recovery-required"
      : "already-committed-and-verified",
    transactionId,
    memberCount: EXPECTED_MEMBER_COUNT,
    candidateRebuild,
    strictAcceptanceEffect: "none",
    releaseEffect: "none",
  };
}

async function readLiveLockOwner(projectRoot) {
  const relativePath = `${WAVE2B_CLOSURE_PATHS.lock}/owner.json`;
  const read = await readStableRegular(
    projectRoot,
    relativePath,
    {path: relativePath, mode: 0o444},
  );
  const value = JSON.parse(read.contents);
  invariant(
    typeof value?.transactionId === "string" &&
      value.transactionId === value.owner?.transactionId,
    "wave2b live lock owner is malformed",
  );
  return value;
}

export async function inspectWave2bSecurityClosure({
  projectRoot = DEFAULT_PROJECT_ROOT,
} = {}) {
  normalizeProjectRoot(projectRoot);
  const receiptAbsolute = projectPath(
    projectRoot,
    WAVE2B_CLOSURE_PATHS.receipt,
  );
  if (await exists(receiptAbsolute)) {
    const receiptRead = await readJsonExact(
      projectRoot,
      {path: WAVE2B_CLOSURE_PATHS.receipt},
      "wave2b closure receipt",
    );
    return verifyCommittedReplay(projectRoot, receiptRead);
  }
  if (await exists(projectPath(projectRoot, WAVE2B_CLOSURE_PATHS.lock))) {
    const owner = await readLiveLockOwner(projectRoot);
    return {
      mode: "inspect",
      status: "recovery-required",
      transactionId: owner.transactionId,
      strictAcceptanceEffect: "none",
      releaseEffect: "none",
    };
  }
  const snapshot = await captureExactInputs(projectRoot);
  invariant(
    snapshot.state === "S0_PREIMAGE",
    "postimage specs without the exact receipt/lock are a partial transaction",
  );
  return {
    mode: "dry-run",
    status: "ready-no-writes-performed",
    memberCount: EXPECTED_MEMBER_COUNT,
    exactBytesAddedPerSpec: 85,
    priorTree: inputSummary(snapshot).priorTree,
    protectedPinCount: WAVE2B_PROTECTED_PINS.length,
    candidateRebuildIncluded: false,
    strictAcceptanceEffect: "none",
    releaseEffect: "none",
  };
}

function asMemberSnapshotDrift(error) {
  if (!isSnapshotDrift(error)) return error;
  const wrapped = new Error(
    "outer lock-in snapshot drifted after CAS began; automatic CAS recovery is forbidden",
    {cause: error},
  );
  wrapped.code = "WAVE2B_MEMBER_SNAPSHOT_DRIFT";
  return wrapped;
}

export async function executeWave2bSecurityClosure({
  projectRoot = DEFAULT_PROJECT_ROOT,
  apply = false,
  phaseObserver = null,
} = {}) {
  if (!apply) return inspectWave2bSecurityClosure({projectRoot});
  normalizeProjectRoot(projectRoot);
  const receiptAbsolute = projectPath(
    projectRoot,
    WAVE2B_CLOSURE_PATHS.receipt,
  );
  if (await exists(receiptAbsolute)) {
    const receiptRead = await readJsonExact(
      projectRoot,
      {path: WAVE2B_CLOSURE_PATHS.receipt},
      "wave2b closure receipt",
    );
    return verifyCommittedReplay(projectRoot, receiptRead);
  }
  invariant(
    !await exists(projectPath(projectRoot, WAVE2B_CLOSURE_PATHS.lock)),
    "wave2b persistent lock exists; apply is blocked pending recovery",
  );

  const initial = await captureExactInputs(projectRoot);
  invariant(
    initial.state === "S0_PREIMAGE",
    "apply requires every exact wave2b spec preimage",
  );
  const transactionId = randomBytes(32).toString("hex");
  const paths = transactionPaths(transactionId);
  const lock = await acquireWave2bLock({
    rootPath: projectRoot,
    lockPath: projectPath(projectRoot, WAVE2B_CLOSURE_PATHS.lock),
    owner: {
      schemaVersion: 1,
      transactionId,
      actorKind: "software-process",
      processId: process.pid,
      authority: "single-writer-exclusion-only",
      immutablePlanIntent: {path: paths.plan},
      priorTreeManifestIntent: {path: paths.priorTreeManifest},
      recoveryPreflightIdentitySnapshot: initial.identitySnapshot,
      frozenCasModule: EXACT_INPUTS.find(
        (input) => input.path === WAVE2B_CLOSURE_PATHS.cas,
      ),
      projectOwnerRoleClaimed: false,
      humanReviewerRoleClaimed: false,
      releaseCustodianRoleClaimed: false,
      strictAcceptanceAuthorityClaimed: false,
    },
  });
  let locked = null;
  let plan = null;
  let casBegan = false;
  let canonicalPublished = false;
  try {
    await assertWave2bLock(lock);
    await assertOwnerBoundRecoveryPreflight(
      projectRoot,
      initial.identitySnapshot,
    );
    const lockBinding = await writeImmutableNoReplace(
      projectRoot,
      paths.lockBinding,
      jsonBytes(lock.persistedBinding),
    );
    await notifyPhase(
      phaseObserver,
      "lock-only",
      {transactionId, persistedBinding: lock.persistedBinding},
      async () => {
        await assertWave2bLock(lock);
        await assertOwnerBoundRecoveryPreflight(
          projectRoot,
          initial.identitySnapshot,
        );
        const observed = await captureExactInputs(projectRoot);
        snapshotInvariant(
          observed.state === "S0_PREIMAGE",
          "lock-only boundary no longer has exact preimages",
        );
      },
    );

    locked = await captureExactInputs(projectRoot);
    snapshotInvariant(
      locked.state === "S0_PREIMAGE",
      "lock-in capture requires all exact preimages",
    );
    await assertOwnerBoundRecoveryPreflight(
      projectRoot,
      initial.identitySnapshot,
    );
    const built = buildPlan(locked, transactionId);
    plan = built.plan;
    const treeManifestBinding = await writeImmutableNoReplace(
      projectRoot,
      paths.priorTreeManifest,
      locked.priorTree.bytes,
    );
    await notifyPhase(
      phaseObserver,
      "partial-artifact",
      {transactionId, path: paths.priorTreeManifest},
      () => assertSnapshotStillBound(locked, {
        expectSpecState: "S0_PREIMAGE",
      }),
    );
    const planBinding = await writeImmutableNoReplace(
      projectRoot,
      paths.plan,
      built.bytes,
    );
    await assertSnapshotStillBound(locked, {
      expectSpecState: "S0_PREIMAGE",
    });
    await validatePlanDeep(projectRoot, plan);
    invariant(
      !await exists(receiptAbsolute),
      "receipt appeared after lock acquisition",
    );

    const revalidatePreCas = () => assertSnapshotStillBound(locked, {
      expectSpecState: "S0_PREIMAGE",
    });
    await archivePreimages(projectRoot, plan, locked, {
      phaseObserver,
      revalidate: revalidatePreCas,
    });
    await verifyArchives(projectRoot, plan);
    await revalidatePreCas();

    const rawJournal = await makeJournal(
      projectRoot,
      paths.applyJournal,
      transactionId,
    );
    const revalidateDuringCas = async () => {
      try {
        await assertLockedNonSpecSnapshot(
          projectRoot,
          locked.identitySnapshot,
        );
      } catch (error) {
        throw asMemberSnapshotDrift(error);
      }
    };
    const journal = async (event) => {
      await rawJournal(event);
      const outerBoundary =
        event?.event === "lock-in-preflight-and-archives-verified" ||
        event?.event === "prepared-receipt-and-final-state-verified";
      if (!outerBoundary) {
        // The frozen CAS module independently revalidates the complete ordered
        // member vector and lock around each of its own journal callbacks.
        return;
      }
      if (casBegan) {
        await revalidateDuringCas();
      } else {
        await revalidatePreCas();
      }
    };
    await journal({
      event: "lock-in-preflight-and-archives-verified",
      transactionId,
      memberCount: EXPECTED_MEMBER_COUNT,
      plan: bindingPublic(planBinding),
      priorTreeManifest: bindingPublic(treeManifestBinding),
      persistedLockBinding: bindingPublic(lockBinding),
    });
    await notifyPhase(
      phaseObserver,
      "first-journal",
      {transactionId, path: paths.applyJournal},
      revalidatePreCas,
    );

    const casItems = casItemsFromPlan(projectRoot, plan);
    await assertWave2bLock(lock, casItems);
    await revalidatePreCas();
    casBegan = true;
    let casPartialNotified = false;
    await applyWave2bCasBatch({
      items: casItems,
      lock,
      journal,
      hooks: {
        afterValidatedState: async ({state, index}) => {
          if (
            !casPartialNotified &&
            index === 0 &&
            state === CAS_STATES.TARGET_QUARANTINED
          ) {
            casPartialNotified = true;
            try {
              await notifyPhase(
                phaseObserver,
                "cas-partial",
                {transactionId, index, state},
                revalidateDuringCas,
              );
            } catch (error) {
              throw asMemberSnapshotDrift(error);
            }
          }
        },
      },
    });
    const specFinalIdentities = await captureCasFinalSpecIdentities(
      projectRoot,
      plan,
      casItems,
    );
    await assertSnapshotStillBound(locked, {
      expectSpecState: "S6_POSTIMAGE",
      expectedSpecFinals: specFinalIdentities,
    });

    const preparedReceipt = buildReceipt(
      locked,
      plan,
      planBinding,
      treeManifestBinding,
      specFinalIdentities,
    );
    const preparedReceiptBytes = jsonBytes(preparedReceipt);
    const preparedReceiptBinding = await writeImmutableNoReplace(
      projectRoot,
      paths.preparedReceipt,
      preparedReceiptBytes,
    );
    await notifyPhase(
      phaseObserver,
      "prepared-receipt",
      {transactionId, path: paths.preparedReceipt},
      () => assertSnapshotStillBound(locked, {
        expectSpecState: "S6_POSTIMAGE",
        expectedSpecFinals: specFinalIdentities,
      }),
    );
    await journal({
      event: "prepared-receipt-and-final-state-verified",
      preparedReceipt: bindingPublic(preparedReceiptBinding),
      canonicalReceiptPath: WAVE2B_CLOSURE_PATHS.receipt,
      canonicalReceiptDerivation:
        "deterministic prepared receipt plus exact prepared-commit binding",
      memberCount: EXPECTED_MEMBER_COUNT,
      strictAcceptanceEffect: "none",
      releaseEffect: "none",
    });
    const journalBinding = await freezeJournal(
      projectRoot,
      paths.applyJournal,
    );
    await assertSnapshotStillBound(locked, {
      expectSpecState: "S6_POSTIMAGE",
      expectedSpecFinals: specFinalIdentities,
    });
    const finalBundle = {
      lockInIdentitySnapshotSha256:
        locked.identitySnapshot.snapshotFingerprintSha256,
      rows: specFinalIdentities,
    };
    const commit = buildPreparedCommit({
      transactionId,
      planBinding,
      treeManifestBinding,
      lockBinding,
      journalBinding,
      preparedReceiptBinding,
      specFinalIdentities: finalBundle,
    });
    const commitBinding = await writeImmutableNoReplace(
      projectRoot,
      paths.commit,
      jsonBytes(commit),
    );
    await notifyPhase(
      phaseObserver,
      "prepared-commit",
      {transactionId, path: paths.commit},
      () => assertSnapshotStillBound(locked, {
        expectSpecState: "S6_POSTIMAGE",
        expectedSpecFinals: specFinalIdentities,
      }),
    );
    await assertSnapshotStillBound(locked, {
      expectSpecState: "S6_POSTIMAGE",
      expectedSpecFinals: specFinalIdentities,
    });
    const canonicalReceipt = finalizeCanonicalReceipt(
      preparedReceipt,
      preparedReceiptBinding,
      commitBinding,
    );
    const canonicalReceiptBytes = jsonBytes(canonicalReceipt);
    invariant(
      !await exists(receiptAbsolute),
      "canonical receipt appeared before the final no-replace publish",
    );
    const receiptBinding = await writeImmutableNoReplace(
      projectRoot,
      WAVE2B_CLOSURE_PATHS.receipt,
      canonicalReceiptBytes,
    );
    canonicalPublished = true;
    const verifiedReceipt = await readJsonExact(
      projectRoot,
      receiptBinding,
      "published wave2b closure receipt",
    );
    const beforeRelease = await verifyCommittedReplay(
      projectRoot,
      verifiedReceipt,
    );
    invariant(
      beforeRelease.status === "committed-recovery-required",
      "published transaction lost its bound lock before release",
    );
    await releaseWave2bLock(lock);
    return verifyCommittedReplay(projectRoot, verifiedReceipt);
  } catch (error) {
    if (
      !casBegan &&
      !canonicalPublished &&
      !isSnapshotDrift(error)
    ) {
      try {
        await assertOwnerBoundRecoveryPreflight(
          projectRoot,
          initial.identitySnapshot,
        );
        const observed = await captureExactInputs(projectRoot);
        if (
          observed.state === "S0_PREIMAGE" &&
          !await exists(receiptAbsolute)
        ) {
          await releaseWave2bLock(lock);
        }
      } catch {
        // Preserve uncertain lock/state for explicit evidence-bound recovery.
      }
    }
    throw error;
  }
}

const ACQUIRED_LOCK_BINDING_KEYS = Object.freeze([
  "schema",
  "kind",
  "rootPath",
  "rootRealPath",
  "rootDev",
  "rootIno",
  "lockPath",
  "lockRealPath",
  "transactionId",
  "acquisitionId",
  "ownerBytesBase64",
  "ownerSha256",
  "directoryDev",
  "directoryIno",
  "ownerDev",
  "ownerIno",
  "descriptorSha256",
]);

function validateAcquiredPersistedBinding(
  projectRoot,
  transactionId,
  persistedBinding,
) {
  invariant(
    persistedBinding !== null &&
      typeof persistedBinding === "object" &&
      !Array.isArray(persistedBinding) &&
      stableJson(Object.keys(persistedBinding).sort()) ===
        stableJson([...ACQUIRED_LOCK_BINDING_KEYS].sort()) &&
      persistedBinding.schema === "wave2b-lock-persisted-binding-v1" &&
      persistedBinding.kind === "acquired" &&
      persistedBinding.rootPath === projectRoot &&
      persistedBinding.rootRealPath === projectRoot &&
      persistedBinding.lockPath ===
        projectPath(projectRoot, WAVE2B_CLOSURE_PATHS.lock) &&
      persistedBinding.lockRealPath ===
        projectPath(projectRoot, WAVE2B_CLOSURE_PATHS.lock) &&
      persistedBinding.transactionId === transactionId &&
      /^[a-f0-9]{64}$/u.test(persistedBinding.acquisitionId ?? "") &&
      /^[a-f0-9]{64}$/u.test(persistedBinding.ownerSha256 ?? "") &&
      /^[a-f0-9]{64}$/u.test(
        persistedBinding.descriptorSha256 ?? "",
      ) &&
      [
        persistedBinding.rootDev,
        persistedBinding.rootIno,
        persistedBinding.directoryDev,
        persistedBinding.directoryIno,
        persistedBinding.ownerDev,
        persistedBinding.ownerIno,
      ].every((value) => /^(?:0|[1-9][0-9]*)$/u.test(value ?? "")) &&
      typeof persistedBinding.ownerBytesBase64 === "string",
    "persisted acquired lock binding schema/root/transaction identity drifted",
  );
  const ownerBytes = Buffer.from(
    persistedBinding.ownerBytesBase64,
    "base64",
  );
  invariant(
    ownerBytes.length > 0 &&
      ownerBytes.toString("base64") ===
        persistedBinding.ownerBytesBase64 &&
      sha256(ownerBytes) === persistedBinding.ownerSha256,
    "persisted acquired lock owner bytes/hash drifted",
  );
  const ownerRecord = JSON.parse(ownerBytes);
  invariant(
    ownerBytes.equals(Buffer.from(`${JSON.stringify(ownerRecord)}\n`)) &&
      stableJson(Object.keys(ownerRecord).sort()) === stableJson([
        "schema",
        "acquisitionId",
        "transactionId",
        "owner",
      ].sort()) &&
      ownerRecord?.schema === "wave2b-lock-owner-v1" &&
      ownerRecord.acquisitionId === persistedBinding.acquisitionId &&
      ownerRecord.transactionId === transactionId &&
      ownerRecord.owner?.transactionId === transactionId,
    "persisted acquired lock owner canonical record drifted",
  );
  const owner = ownerRecord.owner;
  invariant(
    stableJson(Object.keys(owner).sort()) === stableJson([
      "actorKind",
      "authority",
      "frozenCasModule",
      "humanReviewerRoleClaimed",
      "immutablePlanIntent",
      "priorTreeManifestIntent",
      "processId",
      "projectOwnerRoleClaimed",
      "recoveryPreflightIdentitySnapshot",
      "releaseCustodianRoleClaimed",
      "schemaVersion",
      "strictAcceptanceAuthorityClaimed",
      "transactionId",
    ].sort()) &&
      owner.schemaVersion === 1 &&
      owner.actorKind === "software-process" &&
      Number.isSafeInteger(owner.processId) &&
      owner.authority === "single-writer-exclusion-only" &&
      owner.immutablePlanIntent?.path === transactionPaths(transactionId).plan &&
      owner.priorTreeManifestIntent?.path ===
        transactionPaths(transactionId).priorTreeManifest &&
      stableJson(owner.frozenCasModule) === stableJson(
        EXACT_INPUTS.find(
          (input) => input.path === WAVE2B_CLOSURE_PATHS.cas,
        ),
      ) &&
      owner.projectOwnerRoleClaimed === false &&
      owner.humanReviewerRoleClaimed === false &&
      owner.releaseCustodianRoleClaimed === false &&
      owner.strictAcceptanceAuthorityClaimed === false,
    "persisted acquired lock owner intent/authority drifted",
  );
  validateIdentitySnapshotSemantics(
    projectRoot,
    owner.recoveryPreflightIdentitySnapshot,
    "owner-bound recovery preflight identity snapshot",
  );
  invariant(
    owner.recoveryPreflightIdentitySnapshot.projectRoot.dev ===
        persistedBinding.rootDev &&
      owner.recoveryPreflightIdentitySnapshot.projectRoot.ino ===
        persistedBinding.rootIno,
    "persisted lock root differs from its owner-bound preflight snapshot",
  );
  const descriptorPayload = {};
  for (const key of ACQUIRED_LOCK_BINDING_KEYS) {
    if (key !== "descriptorSha256") {
      descriptorPayload[key] = persistedBinding[key];
    }
  }
  invariant(
    sha256(Buffer.from(`${JSON.stringify(descriptorPayload)}\n`)) ===
      persistedBinding.descriptorSha256,
    "persisted acquired lock descriptor fingerprint drifted",
  );
  return ownerRecord;
}

function acquiredDescriptorFromPersistedBinding(persistedBinding) {
  return Object.freeze({
    schema: "wave2b-lock-descriptor-v1",
    kind: "acquired",
    rootPath: persistedBinding.rootPath,
    rootRealPath: persistedBinding.rootRealPath,
    rootDev: persistedBinding.rootDev,
    rootIno: persistedBinding.rootIno,
    lockPath: persistedBinding.lockPath,
    lockRealPath: persistedBinding.lockRealPath,
    transactionId: persistedBinding.transactionId,
    acquisitionId: persistedBinding.acquisitionId,
    ownerBytes: Buffer.from(
      persistedBinding.ownerBytesBase64,
      "base64",
    ),
    ownerSha256: persistedBinding.ownerSha256,
    directoryDev: persistedBinding.directoryDev,
    directoryIno: persistedBinding.directoryIno,
    ownerDev: persistedBinding.ownerDev,
    ownerIno: persistedBinding.ownerIno,
    descriptorSha256: persistedBinding.descriptorSha256,
    persistedBinding,
  });
}

function validateDeathDecision(decision, persistedBinding, transactionId) {
  invariant(
    decision?.schemaVersion === 1 &&
      decision?.decisionType ===
        "wave2b-runtime-lock-owner-liveness-decision" &&
      decision?.decision === "dead" &&
      decision?.transactionId === transactionId &&
      decision?.acquisitionId === persistedBinding.acquisitionId &&
      decision?.ownerSha256 === persistedBinding.ownerSha256 &&
      decision?.descriptorSha256 === persistedBinding.descriptorSha256 &&
      decision?.decidingAuthority ===
        "runtime-lock-liveness-authority-only" &&
      decision?.projectOwnerAcceptanceClaimed === false &&
      decision?.humanReviewClaimed === false &&
      decision?.releaseAuthorityClaimed === false &&
      /^[a-f0-9]{64}$/u.test(decision?.evidenceSha256 ?? ""),
    "recovery requires an exact dead-owner decision bound to this lock; no project Owner/reviewer/release role is accepted",
  );
}

export async function recoverWave2bSecurityClosure({
  projectRoot = DEFAULT_PROJECT_ROOT,
  transactionId,
  deathDecision,
} = {}) {
  normalizeProjectRoot(projectRoot);
  invariant(
    /^[a-f0-9]{64}$/u.test(transactionId ?? ""),
    "recovery requires an exact 64-hex transactionId",
  );
  const paths = transactionPaths(transactionId);
  const receiptExists = await exists(
    projectPath(projectRoot, WAVE2B_CLOSURE_PATHS.receipt),
  );
  let committedBeforeRecovery = null;
  let receiptRead = null;
  if (receiptExists) {
    receiptRead = await readJsonExact(
      projectRoot,
      {path: WAVE2B_CLOSURE_PATHS.receipt},
      "published wave2b closure receipt",
    );
    invariant(
      receiptRead.value.transactionId === transactionId,
      "published receipt belongs to a different transaction",
    );
    committedBeforeRecovery = await verifyCommittedReplay(
      projectRoot,
      receiptRead,
    );
    invariant(
      committedBeforeRecovery.status === "committed-recovery-required",
      "published receipt recovery requires the exact residual transaction lock",
    );
  }
  const bindingRead = await readStableRegular(
    projectRoot,
    paths.lockBinding,
    {path: paths.lockBinding, mode: 0o444},
  );
  const persistedBinding = JSON.parse(bindingRead.contents);
  const ownerRecord = validateAcquiredPersistedBinding(
    projectRoot,
    transactionId,
    persistedBinding,
  );
  validateDeathDecision(deathDecision, persistedBinding, transactionId);
  try {
    await assertWave2bLock(
      acquiredDescriptorFromPersistedBinding(persistedBinding),
    );
  } catch (error) {
    throw new Error(
      "exact residual transaction lock verification failed; recovery is fail-closed before one-shot writes",
      {cause: error},
    );
  }
  for (const relativePath of [
    paths.recoveryAttempt,
    paths.recoveryJournal,
    paths.recoveryAdoptedBinding,
    paths.recoveryComplete,
    `${WAVE2B_CLOSURE_PATHS.lock}/recovery-adoption.json`,
  ]) {
    invariant(
      !await exists(projectPath(projectRoot, relativePath)),
      "a prior recovery attempt/adoption exists; second uncertainty is manual fail-closed",
    );
  }

  let plan;
  let lockedIdentity;
  let recoveryAuthorityIdentity;
  let planSource;
  const planAbsolute = projectPath(projectRoot, paths.plan);
  const persistedPlanExists = await exists(planAbsolute);
  const planMetadata = persistedPlanExists
    ? await lstat(planAbsolute)
    : null;
  invariant(
    planMetadata === null ||
      (planMetadata.isFile() &&
        !planMetadata.isSymbolicLink() &&
        planMetadata.nlink === 1 &&
        [0o444, 0o600, 0o644].includes(planMetadata.mode & 0o777)),
    "recovery plan path is foreign/unsafe",
  );
  const persistedPlanComplete = planMetadata !== null &&
    planMetadata.isFile() &&
    !planMetadata.isSymbolicLink() &&
    planMetadata.nlink === 1 &&
    (planMetadata.mode & 0o777) === 0o444;
  if (persistedPlanComplete) {
    const planRead = await readStableRegular(
      projectRoot,
      paths.plan,
      {path: paths.plan, mode: 0o444},
    );
    plan = JSON.parse(planRead.contents);
    await validatePlanDeep(projectRoot, plan);
    invariant(
      plan.transactionId === transactionId,
      "recovery plan transactionId differs",
    );
    await readStableRegular(
      projectRoot,
      paths.priorTreeManifest,
      plan.priorTreeManifest,
    );
    lockedIdentity = plan.lockInIdentitySnapshot;
    recoveryAuthorityIdentity = lockedIdentity;
    planSource = "persisted-lock-in-plan";
  } else {
    invariant(
      !receiptExists,
      "published receipt requires a complete immutable persisted plan",
    );
    recoveryAuthorityIdentity =
      ownerRecord.owner.recoveryPreflightIdentitySnapshot;
    await assertOwnerBoundRecoveryPreflight(
      projectRoot,
      recoveryAuthorityIdentity,
    );
    let recoverySnapshot;
    try {
      recoverySnapshot = await captureExactInputs(projectRoot);
    } catch (snapshotError) {
      throw new Error(
        "missing/partial recovery plan with non-S0 state is manual fail-closed",
        {cause: snapshotError},
      );
    }
    invariant(
      recoverySnapshot.state === "S0_PREIMAGE",
      "missing/partial plan may only abort an exact S0 transaction",
    );
    plan = buildPlan(recoverySnapshot, transactionId).plan;
    lockedIdentity = recoverySnapshot.identitySnapshot;
    planSource = "owner-bound-preflight-plus-ephemeral-s0-cas-materialization";
  }

  const casItems = casItemsFromPlan(projectRoot, plan);
  if (receiptExists) {
    await assertLockedReplaySnapshot(projectRoot, recoveryAuthorityIdentity);
  } else if (planSource === "persisted-lock-in-plan") {
    await assertLockedNonSpecSnapshot(
      projectRoot,
      recoveryAuthorityIdentity,
    );
  } else {
    await assertOwnerBoundRecoveryPreflight(
      projectRoot,
      recoveryAuthorityIdentity,
    );
  }
  const inspections = await Promise.all(
    casItems.map((item, index) => inspectWave2bCasItem(item, index)),
  );
  invariant(
    inspections.every((inspection) =>
      inspection.state !== CAS_STATES.FOREIGN),
    "recovery refuses foreign CAS state without mutation",
  );
  await assertRecoverablePreimageMtimes(
    projectRoot,
    plan,
    inspections,
  );
  const attempt = withFingerprint({
    schemaVersion: 1,
    recoveryAttemptType:
      "g4-l3-source-static-wave2b-one-shot-recovery-attempt",
    transactionId,
    receiptState: receiptExists ? "published" : "absent",
    planSource,
    planFingerprintSha256: plan.planFingerprintSha256,
    identityAuthoritySnapshotSha256:
      recoveryAuthorityIdentity.snapshotFingerprintSha256,
    acquiredDescriptorSha256: persistedBinding.descriptorSha256,
    deathDecisionSha256: sha256(jsonBytes(deathDecision)),
    orderedCasStates: inspections.map((inspection) => ({
      animationId: inspection.id,
      state: inspection.state,
    })),
    authorityBoundary: WAVE2B_AUTHORITY_BOUNDARY,
  }, "recoveryAttemptFingerprintSha256");
  await writeImmutableNoReplace(
    projectRoot,
    paths.recoveryAttempt,
    jsonBytes(attempt),
  );
  const rawRecoveryJournal = await makeJournal(
    projectRoot,
    paths.recoveryJournal,
    transactionId,
  );
  const revalidateRecoveryNonSpec = receiptExists
    ? () => assertLockedReplaySnapshot(
      projectRoot,
      recoveryAuthorityIdentity,
    )
    : planSource === "persisted-lock-in-plan"
      ? () => assertLockedNonSpecSnapshot(
        projectRoot,
        recoveryAuthorityIdentity,
      )
      : () => assertOwnerBoundRecoveryPreflight(
        projectRoot,
        recoveryAuthorityIdentity,
      );
  const journal = async (event) => {
    await rawRecoveryJournal(event);
    const outerBoundary =
      event?.event === "published-closure-verified-no-rollback" ||
      event?.event === "recovery-restored-exact-preimages";
    if (outerBoundary) await revalidateRecoveryNonSpec();
  };
  const adopted = await adoptWave2bLockForRecovery({
    rootPath: projectRoot,
    lockPath: projectPath(projectRoot, WAVE2B_CLOSURE_PATHS.lock),
    items: casItems,
    persistedBinding,
    decideOwnerLiveness: async () => "dead",
    journal,
  });
  await writeImmutableNoReplace(
    projectRoot,
    paths.recoveryAdoptedBinding,
    jsonBytes(adopted.persistedBinding),
  );
  let result;
  let status;
  if (receiptExists) {
    const committed = await verifyCommittedReplay(projectRoot, receiptRead);
    invariant(
      committed.status === "committed-recovery-required",
      "published recovery verification lost the residual lock",
    );
    result = {
      restoredCount: 0,
      itemCount: EXPECTED_MEMBER_COUNT,
      publishedStatePreserved: true,
    };
    status = "published-closure-verified-lock-released";
    await journal({
      event: "published-closure-verified-no-rollback",
      memberCount: EXPECTED_MEMBER_COUNT,
      deathDecisionSha256: sha256(jsonBytes(deathDecision)),
    });
  } else {
    result = await recoverWave2bCasBatch({
      items: casItems,
      journal,
      lock: adopted,
    });
    await assertRestoredSpecIdentities(projectRoot, plan);
    if (planSource === "persisted-lock-in-plan") {
      await assertLockedNonSpecSnapshot(
        projectRoot,
        recoveryAuthorityIdentity,
      );
    } else {
      await assertOwnerBoundRecoveryPreflight(
        projectRoot,
        recoveryAuthorityIdentity,
      );
    }
    await journal({
      event: "recovery-restored-exact-preimages",
      result,
      deathDecisionSha256: sha256(jsonBytes(deathDecision)),
    });
    status = "exact-preimages-restored";
  }
  const recoveryJournal = await freezeJournal(
    projectRoot,
    paths.recoveryJournal,
  );
  await writeImmutableNoReplace(
    projectRoot,
    paths.recoveryComplete,
    jsonBytes(withFingerprint({
      schemaVersion: 1,
      recoveryType: "g4-l3-source-static-wave2b-recovery-complete",
      transactionId,
      receiptState: receiptExists ? "published" : "absent",
      status,
      recoveredItemCount: result.restoredCount ?? 0,
      journal: bindingPublic(recoveryJournal),
      authorityBoundary: WAVE2B_AUTHORITY_BOUNDARY,
      strictAcceptanceEffect: "none",
      releaseEffect: "none",
    }, "recoveryFingerprintSha256")),
  );
  await releaseWave2bLock(adopted);
  return {
    mode: "recovery",
    status,
    transactionId,
    recoveredItemCount: result.restoredCount ?? 0,
    strictAcceptanceEffect: "none",
    releaseEffect: "none",
  };
}

function usage() {
  return [
    "Usage:",
    "  node scripts/rebind-g4-l3-source-static-source-audits-wave2b.mjs",
    "  node scripts/rebind-g4-l3-source-static-source-audits-wave2b.mjs --apply",
    "  node scripts/rebind-g4-l3-source-static-source-audits-wave2b.mjs --recover --transaction <64-hex> --death-decision <json-file>",
    "",
    "Default is a read-only dry-run. Candidate rebuild, acceptance, and release are outside this transaction.",
  ].join("\n");
}

async function main(argv) {
  const known = new Set([
    "--apply",
    "--recover",
    "--transaction",
    "--death-decision",
    "--help",
  ]);
  for (const argument of argv) {
    if (argument.startsWith("--")) {
      invariant(known.has(argument), `unknown option: ${argument}`);
    }
  }
  if (argv.includes("--help")) {
    console.log(usage());
    return;
  }
  const apply = argv.includes("--apply");
  const recover = argv.includes("--recover");
  invariant(!(apply && recover), "--apply and --recover are mutually exclusive");
  if (!recover) {
    invariant(
      !argv.includes("--transaction") && !argv.includes("--death-decision"),
      "recovery-only options require --recover",
    );
    const result = await executeWave2bSecurityClosure({
      projectRoot: DEFAULT_PROJECT_ROOT,
      apply,
    });
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  const transactionIndex = argv.indexOf("--transaction");
  const decisionIndex = argv.indexOf("--death-decision");
  invariant(
    transactionIndex >= 0 &&
      decisionIndex >= 0 &&
      argv[transactionIndex + 1] &&
      argv[decisionIndex + 1],
    "--recover requires --transaction and --death-decision",
  );
  const decisionPath = path.resolve(argv[decisionIndex + 1]);
  const deathDecision = JSON.parse(await readFile(decisionPath));
  const result = await recoverWave2bSecurityClosure({
    projectRoot: DEFAULT_PROJECT_ROOT,
    transactionId: argv[transactionIndex + 1],
    deathDecision,
  });
  console.log(JSON.stringify(result, null, 2));
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  main(process.argv.slice(2)).catch((error) => {
    console.error(error.stack ?? error.message);
    process.exitCode = 1;
  });
}
