#!/usr/bin/env node

import {
  createHash,
  createPublicKey,
  verify as verifyCryptographicSignature,
} from "node:crypto";
import {execFile as execFileCallback} from "node:child_process";
import {constants as fsConstants} from "node:fs";
import {
  chmod,
  link,
  lstat,
  mkdir,
  open,
  readFile,
  readdir,
  realpath,
  rm,
  unlink,
} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {promisify} from "node:util";

import {parseSwfHeader} from "./build-help-math-catalog.mjs";
import {
  enforceReadOnly,
  parseManifest,
  serializeManifest,
  verifyManifest,
  writeManifest,
} from "./freeze-help-math-sources.mjs";
import {
  describeDarwinAtomicDirectorySwapBuildContract,
} from "./lib/darwin-atomic-directory-swap.mjs";
import {
  BASELINE_COMPLETION_RELATIVE_PATH,
  BASELINE_RECEIPT_RELATIVE_PATH,
  verifyImplementationBaselineCurrent,
} from "./build-fla-swf-counterpart-successor-baseline.mjs";

export {verifyImplementationBaselineCurrent};

const scriptPath = fileURLToPath(import.meta.url);
const execFile = promisify(execFileCallback);
export const PROJECT_ROOT = path.resolve(path.dirname(scriptPath), "..");

export const V1_UNIVERSE_RELATIVE_PATH =
  "catalog/source-promotions/fla-swf-counterpart-successor-2026-08-07-universe.json";
export const V1_UNSIGNED_REVIEW_RELATIVE_PATH =
  "work/fla-swf-counterpart-successor-review/fla-swf-counterpart-successor-2026-08-07-pair-review-ledger.unsigned.json";
export const V1_REVIEW_LEDGER_RELATIVE_PATH =
  "catalog/source-promotions/fla-swf-counterpart-successor-2026-08-07-pair-review-ledger.json";
export const V1_PLAN_RELATIVE_PATH =
  "catalog/source-promotions/fla-swf-counterpart-successor-2026-08-07-plan.json";
export const V1_INCORRECT_INVALIDATION_RELATIVE_PATH =
  "catalog/source-promotions/fla-swf-counterpart-successor-2026-08-07-v1-invalidated.json";
export const V1_INVALIDATION_RELATIVE_PATH =
  "catalog/source-promotions/fla-swf-counterpart-successor-2026-08-07-v1-invalidation-correction-v2.json";
export const UNIVERSE_RELATIVE_PATH =
  "catalog/source-promotions/fla-swf-counterpart-successor-2026-08-07-v2-universe.json";
export const REVIEW_LEDGER_RELATIVE_PATH =
  "catalog/source-promotions/fla-swf-counterpart-successor-2026-08-07-v2-pair-review-ledger.json";
export const PLAN_RELATIVE_PATH =
  "catalog/source-promotions/fla-swf-counterpart-successor-2026-08-07-v2-plan.json";
export const UNSIGNED_REVIEW_RELATIVE_PATH =
  "work/fla-swf-counterpart-successor-review/fla-swf-counterpart-successor-2026-08-07-v2-pair-review-ledger.unsigned.json";
export const TRUSTED_REVIEWER_REGISTRY_RELATIVE_PATH =
  "catalog/source-promotions/fla-swf-counterpart-successor-2026-08-07-v2-trusted-reviewer-registry.json";
export const ADVANCE_BINDING_RELATIVE_PATH =
  "work/fla-swf-counterpart-successor-review/fla-swf-counterpart-successor-2026-08-07-v2-plan-advance-binding.json";
export const QUIESCENCE_SNAPSHOT_RELATIVE_PATHS = Object.freeze([
  "work/fla-swf-counterpart-successor-review/fla-swf-counterpart-successor-2026-08-07-v2-quiescence-snapshot-1.json",
  "work/fla-swf-counterpart-successor-review/fla-swf-counterpart-successor-2026-08-07-v2-quiescence-snapshot-2.json",
]);
export const QUIESCENCE_FIRST_SNAPSHOT_STATE_RELATIVE_PATH =
  "work/fla-swf-counterpart-successor-review/fla-swf-counterpart-successor-2026-08-07-v2-quiescence-first-snapshot-state.json";

export const UNIVERSE_SCHEMA =
  "help-math-fla-swf-counterpart-successor-universe/v2";
export const UNIVERSE_ARTIFACT_TYPE =
  "help-math-fla-swf-counterpart-successor-universe";
export const REVIEW_SCHEMA =
  "help-math-fla-swf-counterpart-successor-pair-review-ledger/v2";
export const REVIEW_ARTIFACT_TYPE =
  "help-math-fla-swf-counterpart-successor-pair-review-ledger";
export const PLAN_SCHEMA =
  "help-math-fla-swf-counterpart-successor-executable-plan/v2";
export const PLAN_ARTIFACT_TYPE =
  "help-math-fla-swf-counterpart-successor-executable-plan";

export const AUTHORING_AUDIT_SCHEMA =
  "help-math-fla-swf-counterpart-animate-authoring-audit-receipt/v1";
export const FAILED_AUTHORING_AUDIT_SCHEMA =
  "help-math-fla-swf-counterpart-failed-animate-authoring-audit-receipt/v1";
export const AUTHORING_AUDIT_ARTIFACT_TYPE =
  "help-math-fla-swf-counterpart-animate-authoring-audit-receipt";
export const FAILED_AUTHORING_AUDIT_ARTIFACT_TYPE =
  "help-math-fla-swf-counterpart-failed-animate-authoring-audit-receipt";
export const MANUAL_HOLD_RECEIPT_SCHEMA =
  "help-math-fla-swf-counterpart-successor-manual-hold-review-receipt/v2";
export const MANUAL_HOLD_RECEIPT_ARTIFACT_TYPE =
  "help-math-fla-swf-counterpart-successor-manual-hold-review-receipt";
export const AUTHORING_WORKING_COPY_PREFIX =
  "work/fla-swf-counterpart-successor-review/authoring-working-copies";

export const REVIEW_DECISIONS = Object.freeze([
  "unresolved",
  "confirmed-publication-lineage",
  "metadata-consistent-lineage-unproven",
  "timeline-or-version-mismatch",
  "placement-conflict",
  "contradicted",
]);
export const TERMINAL_REVIEW_DECISIONS = Object.freeze([
  "unresolved",
  "confirmed-publication-lineage",
  "metadata-consistent-lineage-unproven",
  "timeline-or-version-mismatch",
  "placement-conflict",
  "contradicted",
]);
export const MANUAL_HOLD_DECISIONS = Object.freeze([
  "not-required",
  "pending",
  "approved-reviewed-copy",
  "withheld",
]);
export const COMPARISON_RESULTS = Object.freeze([
  "consistent",
  "resolved-by-primary-evidence",
  "mismatch",
  "indeterminate",
]);

export const SOURCE_ROOT_REF = "private-intake-2026-08-02-help-elm-final";
export const DEFAULT_INTAKE_ROOT = path.resolve(
  PROJECT_ROOT,
  "..",
  "HELP MATH Related Files",
  "Google Drive Source Intake",
  "2026-08-02-HELP-ELM-FINAL-Dec21-2015",
);
export const DEFAULT_V8_ROOT = path.resolve(
  PROJECT_ROOT,
  "..",
  "HELP MATH Related Files",
  "Google Drive Source Intake",
  "2026-08-03-BOULDER-LEARNING-HELP-MATH-1-HISTORICAL-SUCCESSOR-V8",
);
export const DEFAULT_COMBINED_FREEZE_ROOT = path.resolve(
  PROJECT_ROOT,
  "..",
  "HELP MATH Related Files",
  "Google Drive Source Intake",
  "2026-08-04-BOULDER-LEARNING-V7-V8-COMBINED-FREEZE-CLOSURE",
);

const NOFOLLOW = fsConstants.O_NOFOLLOW ?? 0;
const DIRECTORY = fsConstants.O_DIRECTORY ?? 0;
const SHA256_PATTERN = /^[a-f0-9]{64}$/u;

const EXPECTED = Object.freeze({
  canonical: Object.freeze({
    animations: Object.freeze({
      path: "catalog/animations.json",
      bytes: 6_509_993,
      sha256: "ab27270c1f6a6618bae5e52f6e48ebf3ef646b6232dd087c1c86f755a6a3ce10",
    }),
    flaOnly: Object.freeze({
      path: "catalog/fla-only.json",
      bytes: 241_110,
      sha256: "6881d7a2d1d2e595949478473243256758cd6ffd0ae87f3e9e47776516305586",
    }),
    sourceFiles: Object.freeze({
      path: "catalog/source-files.json",
      bytes: 1_894_761,
      sha256: "c5ba348ea968b4ae7292d86f7624a77ec105bc8f929bd61b4837c59623f33b29",
    }),
    sourceChecksumSet: Object.freeze({
      path: "catalog/source-files.sha256",
      bytes: 958_064,
      sha256: "30dfa12b7cd76e7200fb89115155e7d32af1356247c07e3a4f79227e93f34875",
    }),
    sourceManifest: Object.freeze({
      path: "catalog/source-manifest.sha256",
      bytes: 958_064,
      sha256: "f0a33c8a3d15afd7340e9ea5523385428bae7546bd8d4227a3a8977ab8914318",
    }),
    sourceFreeze: Object.freeze({
      path: "catalog/source-freeze.json",
      bytes: 435,
      sha256: "a03a5bb4e2a0672509fa2c2b9ac9b238b697cce043ccd4c2506e8301f780b6da",
    }),
    missingReferences: Object.freeze({
      path: "catalog/missing-references.json",
      bytes: 852_812,
      sha256: "80159400ba05e6b32ceb1b3a24e8dbe839ffcf049af08403adf5049296416136",
    }),
    currentSourceProfile: Object.freeze({
      path: "catalog/current-source-profile.json",
      bytes: 1_952,
      sha256: "e3c86728b1cef7e47db5f56362fc7fb597025776014415aafc36c4468a15b458",
    }),
  }),
  intakeReadme: Object.freeze({
    path: "README.md",
    bytes: 9_784,
    sha256: "fd3f300739e63e84b9a263d724fdbeda55dd3a1b4eee077b472de5228cc76f5e",
  }),
  intakeReceipt: Object.freeze({
    path: "manifests/intake-receipt.json",
    bytes: 7_858,
    sha256: "3633334999488f1df0c95fc7bece4669d7d9db86845f1aeab1924fd560802fd4",
  }),
  scopes: Object.freeze({
    elmgr3: Object.freeze({
      sourceDirectory: "ELMGR3",
      canonicalPrefix: "HELP_COURSES/ELMGR3",
      manifest: Object.freeze({
        path: "manifests/elmgr3-files.json",
        bytes: 545_559,
        sha256: "972f71a75ebd0606632ddbd1f13e71c945d19245ec87236407d3ced2eddaa7be",
        checksumSetSha256: "ca8baa8f4c8f78c6f95b9ccc3453bfea1d546a78b7273d195b48c9e09a832bfe",
      }),
      intakePlan: Object.freeze({
        path: "manifests/elmgr3-intake-plan.json",
        bytes: 4_382_812,
        sha256: "60ab8031b945f5d302de81d428f8522ce3cbb0d2afde7c2d644cc9691a748644",
      }),
    }),
    elmgr4: Object.freeze({
      sourceDirectory: "ELMGR4",
      canonicalPrefix: "HELP_COURSES/ELMGR4",
      manifest: Object.freeze({
        path: "manifests/elmgr4-files.json",
        bytes: 798_533,
        sha256: "27c0dc167ed771ffa4f560d71f03f4e373c0d08ff3a52d2868db2bdef11ede4c",
        checksumSetSha256: "e841a60c6e2b6c2c632a2c0bdfa1d655cd27b8cd2f94bfaf9e18c1536a6e9d8c",
      }),
      intakePlan: Object.freeze({
        path: "manifests/elmgr4-intake-plan.json",
        bytes: 6_449_651,
        sha256: "ff6b31f75d246f33834af9686b035f614a27ae2bbbc30e4b5975773863a0634f",
      }),
    }),
    elmgr5: Object.freeze({
      sourceDirectory: "ELMGR5",
      canonicalPrefix: "HELP_COURSES/ELMGR5",
      manifest: Object.freeze({
        path: "manifests/elmgr5-files.json",
        bytes: 602_457,
        sha256: "a9d123185da832814504db1330b97d4596bd875feb864808719451a00418ff80",
        checksumSetSha256: "4595979c909440a083f614e53180d44d527095371220838044de028cac538238",
      }),
      intakePlan: Object.freeze({
        path: "manifests/elmgr5-intake-plan.json",
        bytes: 4_711_608,
        sha256: "b9fa136fc471f30c2386b1a1f2801bfa7c56a23281cf9feaa6d42b93bb9e2742",
      }),
    }),
    dig: Object.freeze({
      sourceDirectory: "DIG",
      canonicalPrefix: "HELP_KEYTERMS/KT/ELEMENTARY/DIG",
      manifest: Object.freeze({
        path: "manifests/dig-files.json",
        bytes: 240_179,
        sha256: "eb9542e48cce27add5e178419f8207b5538ea9684a857f1ad8cb8057615be20b",
        checksumSetSha256: "fe16e6eec0ab36aba449ca15f047583286dbaeb1e5412c61c7a9e26db9083c79",
      }),
      intakePlan: Object.freeze({
        path: "manifests/dig-intake-plan.json",
        bytes: 1_975_727,
        sha256: "2ab69de16a2ef27772e034bf951c53b09e28a58c1b93c88f0ec219243f2f2868",
      }),
    }),
  }),
  v8MainReceipt: Object.freeze({
    path: "manifests/main-full-final-v8-20260803T190320Z.json",
    bytes: 4_056,
    sha256: "f7ef1606261f91483bfa57f8719154e579444d98d44474804bad019bc2a0511d",
  }),
  combinedFreezeReceipt: Object.freeze({
    path: "combined-freeze-applied-receipt-v1.json",
    bytes: 8_375,
    sha256: "fd0ae61d347ab71abdc68581a2fb89761358f7d9fb1f7e5f8dc8326a54d8f751",
  }),
  combinedFreezeManifest: Object.freeze({
    path: "combined-freeze-manifest-v1.jsonl",
    bytes: 3_231_021,
    sha256: "1be3672f9a9337982b6b37cb2bce4a298a2f855a95ac3ba5f31e9443372926a4",
  }),
  universe: Object.freeze({
    count: 620,
    bytes: 593_608_118,
    uniqueSha256: 618,
    candidateFla: 428,
    candidateSwf: 192,
    prior: Object.freeze({candidate: 551, historical: 61, placement: 8}),
    current: Object.freeze({candidate: 549, historical: 61, placement: 10}),
    byScope: Object.freeze({
      ELMGR3: Object.freeze({fla: 98, swf: 21, records: 119, bytes: 206_601_345}),
      ELMGR4: Object.freeze({fla: 90, swf: 5, records: 95, bytes: 172_669_194}),
      ELMGR5: Object.freeze({fla: 79, swf: 10, records: 89, bytes: 183_680_590}),
      DIG: Object.freeze({fla: 161, swf: 156, records: 317, bytes: 30_656_989}),
    }),
    recordSetSha256: "518cd54e8ca28241651810338417da07e3bab14ed8ce416bdcc86329957801f7",
    pathSetSha256: "138257ae5ebb35d0734a1f21b5fd7d9f6653efa6db0e3aaa5d6a2b135d4f5c47",
    sourceBoundRecordSetSha256: "719b73fa924c9d6b52e27e763581bb3178f1c8057694a28bda4757be59905f12",
  }),
});

const FALSE_ACCEPTANCE_EFFECTS = Object.freeze({
  canonicalSourcePromotion: false,
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

export const CATALOG_OUTPUT_FILENAMES = Object.freeze([
  "summary.json",
  "animations.json",
  "animations.jsonl",
  "animations.csv",
  "assets.json",
  "duplicates.json",
  "missing-references.json",
  "unreferenced.json",
  "fla-only.json",
  "lessons.json",
  "audio-groups.json",
  "batches.json",
  "lesson-releases.json",
  "source-files.json",
  "source-files.jsonl",
  "source-files.csv",
  "source-files.sha256",
]);

export const QUIESCENCE_PROJECT_DEPENDENCIES = Object.freeze([
  "README.md",
  "scripts/build-fla-swf-counterpart-successor-baseline.mjs",
  "scripts/build-fla-swf-counterpart-successor-plan.mjs",
  "scripts/promote-fla-swf-counterpart-successor.mjs",
  "scripts/lib/fla-swf-counterpart-transaction.mjs",
  "scripts/build-help-math-catalog.mjs",
  "scripts/freeze-help-math-sources.mjs",
  "scripts/lib/darwin-atomic-directory-swap.mjs",
  "scripts/lib/darwin-atomic-directory-swap-native.c",
  "package.json",
]);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function compareText(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

export function sha256Bytes(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

export function sha256Text(text) {
  return sha256Bytes(Buffer.from(text, "utf8"));
}

export function canonicalJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function exactKeys(value, expected, label) {
  invariant(value && typeof value === "object" && !Array.isArray(value), `${label} must be an object`);
  invariant(
    JSON.stringify(Object.keys(value).sort(compareText))
      === JSON.stringify([...expected].sort(compareText)),
    `${label} fields changed`,
  );
}

export function portableRelative(value, label = "path") {
  invariant(typeof value === "string" && value.length > 0, `${label} must be non-empty`);
  invariant(!/[\0\r\n\t\\]/u.test(value), `${label} contains a forbidden character`);
  invariant(!path.posix.isAbsolute(value), `${label} must be relative`);
  invariant(path.posix.normalize(value) === value, `${label} must already be POSIX-normalized`);
  invariant(value !== "." && value !== ".." && !value.startsWith("../"), `${label} escapes its root`);
  invariant(value.normalize("NFC") === value, `${label} must be Unicode NFC`);
  return value;
}

function normalizedPath(value) {
  return portableRelative(value).normalize("NFC").toLowerCase();
}

function withoutExtension(value) {
  return value.slice(0, value.length - path.posix.extname(value).length);
}

function normalizedStem(value) {
  return withoutExtension(portableRelative(value)).normalize("NFC").toLowerCase();
}

function descriptor(relativePath, bytes) {
  return {
    path: portableRelative(relativePath),
    bytes: bytes.length,
    sha256: sha256Bytes(bytes),
  };
}

async function lstatOrNull(filePath) {
  try {
    return await lstat(filePath, {bigint: true});
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

function nodeIdentity(info) {
  return {dev: String(info.dev), ino: String(info.ino)};
}

function sameNode(left, right) {
  return left.dev === right.dev && left.ino === right.ino;
}

async function readStableFile(filePath, label, {immutable = false} = {}) {
  const before = await lstat(filePath, {bigint: true});
  invariant(before.isFile() && !before.isSymbolicLink(), `${label} must be a regular non-symlink file`);
  if (immutable) {
    invariant((Number(before.mode) & 0o777) === 0o444, `${label} must have mode 0444`);
    invariant(before.nlink === 1n, `${label} must have exactly one hard link`);
  }
  const handle = await open(filePath, fsConstants.O_RDONLY | NOFOLLOW);
  try {
    const opened = await handle.stat({bigint: true});
    invariant(sameNode(nodeIdentity(before), nodeIdentity(opened)), `${label} changed before open`);
    const bytes = await handle.readFile();
    const after = await handle.stat({bigint: true});
    invariant(sameNode(nodeIdentity(opened), nodeIdentity(after)), `${label} inode changed while reading`);
    invariant(
      opened.size === after.size && opened.mtimeNs === after.mtimeNs && BigInt(bytes.length) === after.size,
      `${label} changed while reading`,
    );
    if (immutable) {
      invariant((Number(opened.mode) & 0o777) === 0o444, `${label} opened mode changed from 0444`);
      invariant((Number(after.mode) & 0o777) === 0o444, `${label} final mode changed from 0444`);
      invariant(opened.nlink === 1n && after.nlink === 1n, `${label} hard-link count changed`);
    }
    return {
      bytes,
      byteCount: bytes.length,
      sha256: sha256Bytes(bytes),
      mode: Number(after.mode) & 0o777,
      identity: nodeIdentity(after),
      mtimeNs: String(after.mtimeNs),
    };
  } finally {
    await handle.close();
  }
}

export async function secureResolveExistingRegular(root, relative, label = "file") {
  portableRelative(relative, `${label} relative path`);
  const rootAbsolute = path.resolve(root);
  const rootInfo = await lstat(rootAbsolute, {bigint: true});
  invariant(rootInfo.isDirectory() && !rootInfo.isSymbolicLink(), `${label} root must be a real directory`);
  const rootReal = await realpath(rootAbsolute);
  invariant(rootReal === rootAbsolute, `${label} root resolves through a symlink or alias`);
  const segments = relative.split("/");
  let current = rootReal;
  for (let index = 0; index < segments.length; index += 1) {
    current = path.join(current, segments[index]);
    const info = await lstat(current, {bigint: true});
    invariant(!info.isSymbolicLink(), `${label} traverses a symbolic link: ${segments.slice(0, index + 1).join("/")}`);
    if (index < segments.length - 1) {
      invariant(info.isDirectory(), `${label} ancestor is not a directory: ${segments.slice(0, index + 1).join("/")}`);
    } else {
      invariant(info.isFile(), `${label} leaf is not a regular file`);
    }
  }
  const relativeCheck = path.relative(rootReal, current);
  invariant(relativeCheck === relative && !relativeCheck.startsWith("..") && !path.isAbsolute(relativeCheck), `${label} escaped its real root`);
  return {absolutePath: current, rootReal};
}

async function readPinnedFile(root, expected, label) {
  const relative = portableRelative(expected.path, `${label} path`);
  const {absolutePath: absolute} = await secureResolveExistingRegular(root, relative, label);
  const observed = await readStableFile(absolute, label);
  invariant(observed.byteCount === expected.bytes, `${label} byte count drifted`);
  invariant(observed.sha256 === expected.sha256, `${label} SHA-256 drifted`);
  return {absolute, relative, ...observed};
}

async function readPinnedJson(root, expected, label) {
  const file = await readPinnedFile(root, expected, label);
  let value;
  try {
    value = JSON.parse(file.bytes);
  } catch (error) {
    throw new Error(`${label} is not valid JSON: ${error.message}`);
  }
  return {...file, value};
}

async function syncDirectory(directory) {
  const handle = await open(directory, fsConstants.O_RDONLY | DIRECTORY | NOFOLLOW);
  try {
    await handle.sync();
  } finally {
    await handle.close();
  }
}

async function ensureSafeDirectory(directory) {
  const absolute = path.resolve(directory);
  const parsed = path.parse(absolute);
  let current = parsed.root;
  const rootInformation = await lstat(current, {bigint: true});
  invariant(rootInformation.isDirectory() && !rootInformation.isSymbolicLink(), "Filesystem root is unsafe");
  for (const segment of absolute.slice(parsed.root.length).split(path.sep).filter(Boolean)) {
    const next = path.join(current, segment);
    const information = await lstatOrNull(next);
    if (information) {
      invariant(information.isDirectory() && !information.isSymbolicLink(), `Immutable output ancestor is unsafe: ${next}`);
    } else {
      await mkdir(next, {mode: 0o700});
      await syncDirectory(current);
      const created = await lstat(next, {bigint: true});
      invariant(created.isDirectory() && !created.isSymbolicLink(), `Created immutable output ancestor is unsafe: ${next}`);
    }
    current = next;
  }
  invariant(await realpath(current) === absolute, "Immutable output directory resolves through a symlink or alias");
  return current;
}

export async function writeImmutableNoClobber(filePath, contents) {
  const expectedBytes = Buffer.isBuffer(contents) ? contents : Buffer.from(contents, "utf8");
  const parent = path.dirname(filePath);
  await ensureSafeDirectory(parent);
  const parentInformation = await lstat(parent, {bigint: true});
  invariant(parentInformation.isDirectory() && !parentInformation.isSymbolicLink(), "Immutable output parent must be a real directory");
  invariant(await realpath(parent) === path.resolve(parent), "Immutable output parent resolves through a symlink or alias");
  const existing = await lstatOrNull(filePath);
  if (existing) {
    const current = await readStableFile(filePath, "Existing immutable output", {immutable: true});
    invariant(current.bytes.equals(expectedBytes), "Refusing to overwrite a different immutable output");
    await syncDirectory(parent);
    const durable = await readStableFile(filePath, "Durable existing immutable output", {immutable: true});
    invariant(durable.bytes.equals(expectedBytes)
      && sameNode(current.identity, durable.identity),
    "Existing immutable output changed during parent durability reconciliation");
    return {outcome: "already-current", bytes: durable.byteCount, sha256: durable.sha256, mode: "0444"};
  }
  const preparing = path.join(parent, `.${path.basename(filePath)}.preparing`);
  invariant(!(await lstatOrNull(preparing)), `Refusing to remove or replace stale preparing file: ${preparing}`);
  const handle = await open(preparing, "wx", 0o444);
  try {
    await handle.writeFile(expectedBytes);
    await handle.sync();
    await handle.chmod(0o444);
  } finally {
    await handle.close();
  }
  try {
    await link(preparing, filePath);
    await syncDirectory(parent);
    const finalInfo = await lstat(filePath, {bigint: true});
    const preparingInfo = await lstat(preparing, {bigint: true});
    invariant(sameNode(nodeIdentity(finalInfo), nodeIdentity(preparingInfo)), "No-clobber publication changed inode identity");
    await unlink(preparing);
    await syncDirectory(parent);
  } catch (error) {
    throw new Error(`Immutable no-clobber publication failed; preparing file was retained: ${error.message}`);
  }
  const published = await readStableFile(filePath, "Published immutable output", {immutable: true});
  invariant(published.bytes.equals(expectedBytes), "Published immutable output bytes changed");
  return {outcome: "written", bytes: published.byteCount, sha256: published.sha256, mode: "0444"};
}

function countBy(records, selector) {
  const counts = {};
  for (const record of records) {
    const key = selector(record);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return Object.fromEntries(Object.entries(counts).sort(([left], [right]) => compareText(left, right)));
}

function bytesBy(records, selector) {
  const counts = {};
  for (const record of records) {
    const key = selector(record);
    counts[key] = (counts[key] ?? 0) + record.bytes;
  }
  return Object.fromEntries(Object.entries(counts).sort(([left], [right]) => compareText(left, right)));
}

function summarizeByScope(records) {
  const scopes = {};
  for (const record of records) {
    const scope = record.sourceManifest.sourceDirectory;
    if (!scopes[scope]) scopes[scope] = {fla: 0, swf: 0, records: 0, bytes: 0};
    scopes[scope][record.extension] += 1;
    scopes[scope].records += 1;
    scopes[scope].bytes += record.bytes;
  }
  return Object.fromEntries(Object.entries(scopes).sort(([left], [right]) => compareText(left, right)));
}

export function recordSetDigest(records) {
  const serialized = [...records]
    .sort((left, right) => compareText(left.canonicalPath, right.canonicalPath))
    .map(({canonicalPath, bytes, sha256}) => `${canonicalPath}\t${bytes}\t${sha256}\n`)
    .join("");
  return sha256Text(serialized);
}

export function pathSetDigest(records) {
  return sha256Text(
    [...records]
      .sort((left, right) => compareText(left.canonicalPath, right.canonicalPath))
      .map(({canonicalPath}) => `${canonicalPath}\n`)
      .join(""),
  );
}

function sourceBoundLine(record) {
  const binding = record.sourceBinding;
  const fields = [
    record.canonicalPath,
    binding.quarantineRelativePath,
    String(record.bytes),
    record.sha256,
    binding.manifestArtifact.sha256,
    binding.manifestEntry.path,
    record.priorDisposition,
    record.currentDisposition,
  ];
  invariant(fields.every((field) => !/[\t\r\n]/u.test(field)), `Source-bound record contains unsafe serialization text: ${record.canonicalPath}`);
  return `${fields.join("\t")}\n`;
}

function expandedSourceBindingLine(record) {
  const binding = record.sourceBinding;
  const fields = [
    record.canonicalPath,
    String(record.bytes),
    record.sha256,
    record.extension,
    binding.rootRef,
    binding.quarantineRelativePath,
    binding.manifestRelativePath,
    binding.manifestArtifact.path,
    String(binding.manifestArtifact.bytes),
    binding.manifestArtifact.sha256,
    binding.manifestArtifact.checksumSetSha256,
    binding.manifestArtifact.sourceDirectory,
    binding.intakePlanArtifact.path,
    String(binding.intakePlanArtifact.bytes),
    binding.intakePlanArtifact.sha256,
    record.priorDisposition,
    record.priorIntakeDecision,
    record.currentDisposition,
    record.existingCounterpart.canonicalPath,
    String(record.existingCounterpart.bytes),
    record.existingCounterpart.sha256,
  ];
  invariant(fields.every((field) => !/[\t\r\n]/u.test(field)), `Expanded source binding contains unsafe serialization text: ${record.canonicalPath}`);
  return `${fields.join("\t")}\n`;
}

export function sourceBoundRecordSetDigest(records) {
  return sha256Text(
    [...records]
      .sort((left, right) => compareText(left.canonicalPath, right.canonicalPath))
      .map(sourceBoundLine)
      .join(""),
  );
}

function sourceBindingDigest(record) {
  return sha256Text(expandedSourceBindingLine(record));
}

function collectionForPath(value) {
  if (value.startsWith("HELP_COURSES/")) return "course";
  if (value.startsWith("HELP_KEYTERMS/")) return "keyterm";
  if (value.startsWith("HELP_FORMULAS/")) return "formula";
  return "unknown";
}

function summarizeSwfHeaders(headers) {
  return {
    count: headers.length,
    parseErrors: headers.filter((header) => header.status !== "parsed").length,
    bySignature: countBy(headers, (header) => header.signature),
    byVersion: countBy(headers, (header) => String(header.version)),
    byFps: countBy(headers, (header) => String(header.fps)),
    rootFrameRange: {
      minimum: Math.min(...headers.map((header) => header.frameCount)),
      maximum: Math.max(...headers.map((header) => header.frameCount)),
    },
    byStage: countBy(headers, (header) => `${header.stage.width}x${header.stage.height}`),
  };
}

async function readAndVerifySourceFile(filePath, record, label) {
  const observed = await readStableFile(filePath, label);
  invariant(observed.byteCount === record.bytes, `${label} bytes differ from manifest`);
  invariant(observed.sha256 === record.sha256, `${label} SHA-256 differs from manifest`);
  return observed.bytes;
}

function immutableInputDescriptor(pin) {
  return {path: pin.path, bytes: pin.bytes, sha256: pin.sha256};
}

function buildRecord({scope, scopeConfig, intakeRecord, manifestRecord, counterpart, direction, sourceBytes, currentHashPaths, missingReferences}) {
  const extension = intakeRecord.extension;
  invariant(extension === "fla" || extension === "swf", "Counterpart extension must be FLA or SWF");
  const candidateDiagnostics = extension === "swf"
    ? {kind: "swf", header: parseSwfHeader(sourceBytes)}
    : {
      kind: "fla",
      container: sourceBytes.subarray(0, 8).equals(Buffer.from("d0cf11e0a1b11ae1", "hex"))
        ? "compound-binary"
        : sourceBytes.subarray(0, 4).equals(Buffer.from("504b0304", "hex"))
          ? "zip-archive"
          : "unrecognized",
      magicHex: sourceBytes.subarray(0, 8).toString("hex"),
    };
  const counterpartDiagnostics = counterpart.extension === "swf"
    ? {kind: "swf", header: counterpart.swf}
    : {kind: "fla", container: counterpart.flaContainer};
  const priorDisposition = intakeRecord.disposition;
  const currentDisposition = priorDisposition === "hold-historical-custody-review"
    ? priorDisposition
    : currentHashPaths.length > 0
      ? "hold-placement-alias-review"
      : "candidate-new-source-in-quarantine";
  const canonicalPath = portableRelative(intakeRecord.canonicalPath, "canonicalPath");
  const sourceBinding = {
    rootRef: SOURCE_ROOT_REF,
    quarantineRelativePath: portableRelative(
      path.posix.join("verified", scopeConfig.sourceDirectory, intakeRecord.manifestRelativePath),
      "quarantineRelativePath",
    ),
    manifestRelativePath: portableRelative(intakeRecord.manifestRelativePath, "manifestRelativePath"),
    manifestArtifact: {
      path: scopeConfig.manifest.path,
      bytes: scopeConfig.manifest.bytes,
      sha256: scopeConfig.manifest.sha256,
      checksumSetSha256: scopeConfig.manifest.checksumSetSha256,
      sourceDirectory: scopeConfig.sourceDirectory,
    },
    intakePlanArtifact: {
      path: scopeConfig.intakePlan.path,
      bytes: scopeConfig.intakePlan.bytes,
      sha256: scopeConfig.intakePlan.sha256,
      canonicalCatalogSha256: intakeRecord.planCanonicalCatalogSha256,
    },
    manifestEntry: {
      path: manifestRecord.path,
      bytes: manifestRecord.bytes,
      sha256: manifestRecord.sha256,
    },
  };
  const swfPath = extension === "swf" ? canonicalPath : counterpart.canonicalPath;
  let referenceBinding = {collection: collectionForPath(swfPath), referenced: null, referenceKind: null, resolvedUniqueReferenceDelta: 0};
  if (extension === "swf") {
    const collection = collectionForPath(canonicalPath);
    if (collection === "course") {
      const referenced = missingReferences.course.has(normalizedPath(canonicalPath));
      referenceBinding = {collection, referenced, referenceKind: referenced ? "course-exact-path" : null, resolvedUniqueReferenceDelta: referenced ? 1 : 0};
    } else if (collection === "keyterm") {
      const referenced = missingReferences.keyterm.has(path.posix.basename(canonicalPath).toLowerCase());
      referenceBinding = {collection, referenced, referenceKind: referenced ? "keyterm-casefold-filename" : null, resolvedUniqueReferenceDelta: referenced ? 1 : 0};
    } else {
      referenceBinding = {collection, referenced: false, referenceKind: null, resolvedUniqueReferenceDelta: 0};
    }
  }
  const result = {
    recordId: `counterpart-${sha256Text(canonicalPath)}`,
    canonicalPath,
    bytes: intakeRecord.bytes,
    sha256: intakeRecord.sha256,
    extension,
    sourceType: intakeRecord.sourceType,
    normalizedFullRelativeStem: normalizedStem(canonicalPath),
    counterpartDirection: direction,
    manifestRelativePath: sourceBinding.manifestRelativePath,
    quarantineRelativePath: sourceBinding.quarantineRelativePath,
    sourceManifest: {
      path: sourceBinding.manifestArtifact.path,
      bytes: sourceBinding.manifestArtifact.bytes,
      sha256: sourceBinding.manifestArtifact.sha256,
      checksumSetSha256: sourceBinding.manifestArtifact.checksumSetSha256,
      sourceDirectory: sourceBinding.manifestArtifact.sourceDirectory,
      recordPath: sourceBinding.manifestEntry.path,
    },
    sourceIntakePlan: {
      path: sourceBinding.intakePlanArtifact.path,
      bytes: sourceBinding.intakePlanArtifact.bytes,
      sha256: sourceBinding.intakePlanArtifact.sha256,
    },
    sourceBinding,
    existingCounterpart: {
      path: counterpart.canonicalPath,
      canonicalPath: counterpart.canonicalPath,
      bytes: counterpart.bytes,
      sha256: counterpart.sha256,
      extension: counterpart.extension,
    },
    diagnostics: {
      candidate: candidateDiagnostics,
      existingCounterpart: counterpartDiagnostics,
      referenceBinding,
      currentCanonicalSameHashPaths: [...currentHashPaths].sort(compareText),
    },
    priorDisposition,
    priorIntakeDecision: intakeRecord.intakeDecision,
    currentDisposition,
    currentCanonicalHashMatchPaths: [...currentHashPaths].sort(compareText),
    historicalHashMatchRefs: [...intakeRecord.historicalHashMatchRefs].sort(compareText),
    automaticCopyAllowed: false,
    promotionEligibility: currentDisposition === "candidate-new-source-in-quarantine"
      ? "pair-review-required"
      : "withheld-pending-manual-review",
    pairReviewId: `pair-review-${sha256Text(`${canonicalPath}\t${counterpart.canonicalPath}`)}`,
    pairReviewStatus: "pending-unsigned-review",
    placementReviewStatus: "pending-review",
    publicationLineageStatus: "unresolved",
    sourceBindingSha256: null,
  };
  result.sourceBindingSha256 = sourceBindingDigest(result);
  return result;
}

async function loadCanonicalInputs(root) {
  const entries = await Promise.all(
    Object.entries(EXPECTED.canonical).map(async ([name, pin]) => [
      name,
      pin.path.endsWith(".json")
        ? await readPinnedJson(root, pin, `Canonical ${name}`)
        : await readPinnedFile(root, pin, `Canonical ${name}`),
    ]),
  );
  return Object.fromEntries(entries);
}

async function loadIntakeInputs(intakeRoot) {
  const readme = await readPinnedFile(intakeRoot, EXPECTED.intakeReadme, "Intake README");
  const receipt = await readPinnedJson(intakeRoot, EXPECTED.intakeReceipt, "Intake receipt");
  invariant(receipt.value.acceptanceEffect?.sourcePromoted === false, "Intake receipt promotion boundary changed");
  const scopes = {};
  for (const [scope, config] of Object.entries(EXPECTED.scopes)) {
    const manifest = await readPinnedJson(intakeRoot, config.manifest, `${scope} source manifest`);
    const plan = await readPinnedJson(intakeRoot, config.intakePlan, `${scope} intake plan`);
    invariant(plan.value.inputs?.manifestSha256 === config.manifest.sha256, `${scope} plan no longer binds its source manifest`);
    invariant(plan.value.inputs?.manifestChecksumSetSha256 === config.manifest.checksumSetSha256, `${scope} plan checksum-set binding changed`);
    invariant(manifest.value.checksumSetSha256 === config.manifest.checksumSetSha256, `${scope} manifest checksum-set changed`);
    invariant(manifest.value.sourceDirectory === config.sourceDirectory, `${scope} manifest source directory changed`);
    const manifestByPath = new Map();
    for (const record of manifest.value.files) {
      portableRelative(record.path, `${scope} manifest record path`);
      invariant(!manifestByPath.has(record.path), `${scope} manifest has a duplicate path`);
      manifestByPath.set(record.path, record);
    }
    scopes[scope] = {config, manifest, plan, manifestByPath};
  }
  return {readme, receipt, scopes};
}

async function buildCorroboratingEvidence({records, v8Root, combinedFreezeRoot}) {
  const v8Receipt = await readPinnedJson(v8Root, EXPECTED.v8MainReceipt, "V8 main-scope final receipt");
  invariant(v8Receipt.value.outcome === "deduplicated-and-verified", "V8 main receipt outcome changed");
  invariant(v8Receipt.value.claims?.canonicalPromotion === false, "V8 receipt unexpectedly authorizes canonical promotion");
  const combinedReceipt = await readPinnedJson(
    combinedFreezeRoot,
    EXPECTED.combinedFreezeReceipt,
    "Combined-freeze applied receipt",
  );
  invariant(
    combinedReceipt.value.outcome === "frozen-read-only-with-unresolved-independent-review",
    "Combined-freeze outcome changed",
  );
  invariant(combinedReceipt.value.claims?.canonicalPromotion === false, "Combined-freeze receipt unexpectedly authorizes promotion");
  invariant(
    combinedReceipt.value.recordManifest?.bytes === EXPECTED.combinedFreezeManifest.bytes
      && combinedReceipt.value.recordManifest?.sha256 === EXPECTED.combinedFreezeManifest.sha256,
    "Combined-freeze receipt record-manifest binding changed",
  );
  const combinedManifest = await readPinnedFile(
    combinedFreezeRoot,
    EXPECTED.combinedFreezeManifest,
    "Combined-freeze record manifest",
  );
  const closureRecords = combinedManifest.bytes.toString("utf8").trimEnd().split("\n").map((line, index) => {
    try {
      const value = JSON.parse(line);
      invariant(SHA256_PATTERN.test(value.sha256), `Combined-freeze manifest row ${index + 1} has invalid SHA-256`);
      invariant(typeof value.relativePathBytesBase64 === "string", `Combined-freeze manifest row ${index + 1} lacks path bytes`);
      return value;
    } catch (error) {
      throw new Error(`Invalid combined-freeze manifest row ${index + 1}: ${error.message}`);
    }
  });
  const closureSha = new Set(closureRecords.map((record) => record.sha256));
  const closurePathBytes = new Set(closureRecords.map((record) => record.relativePathBytesBase64));
  const shaOverlap = records.filter((record) => closureSha.has(record.sha256));
  const exactPathOverlap = records.filter((record) =>
    closurePathBytes.has(Buffer.from(record.canonicalPath, "utf8").toString("base64")));
  invariant(shaOverlap.length === 0, "The 620-source universe conflicts by exact SHA-256 with the V7/V8 closure ledger");
  invariant(exactPathOverlap.length === 0, "The 620-source universe conflicts by exact path bytes with the V7/V8 closure ledger");
  return {
    role: "corroborating-metadata-only-never-copy-source-never-authorization",
    v8MainScopeReceipt: {
      rootRef: "private-v8-successor-root",
      path: EXPECTED.v8MainReceipt.path,
      bytes: EXPECTED.v8MainReceipt.bytes,
      sha256: EXPECTED.v8MainReceipt.sha256,
      outcome: v8Receipt.value.outcome,
      canonicalPromotionAuthorized: false,
    },
    combinedFreezeReceipt: {
      rootRef: "private-v7-v8-combined-freeze-root",
      path: EXPECTED.combinedFreezeReceipt.path,
      bytes: EXPECTED.combinedFreezeReceipt.bytes,
      sha256: EXPECTED.combinedFreezeReceipt.sha256,
      outcome: combinedReceipt.value.outcome,
      independentReviewReceiptPresent: combinedReceipt.value.lifecycle?.independentReviewReceiptPresent,
      canonicalPromotionAuthorized: false,
    },
    combinedFreezeRecordManifest: {
      path: EXPECTED.combinedFreezeManifest.path,
      bytes: EXPECTED.combinedFreezeManifest.bytes,
      sha256: EXPECTED.combinedFreezeManifest.sha256,
      recordRows: closureRecords.length,
      uniqueSha256: new Set(closureRecords.map((record) => record.sha256)).size,
    },
    exactNonConflictCheck: {
      algorithm: "aggregate comparison of complete SHA-256 and exact UTF-8 canonical relative-path bytes only",
      universeRows: records.length,
      universeUniqueSha256: new Set(records.map((record) => record.sha256)).size,
      exactSha256OverlapRows: shaOverlap.length,
      exactSha256OverlapUnique: new Set(shaOverlap.map((record) => record.sha256)).size,
      exactCanonicalPathByteOverlapRows: exactPathOverlap.length,
    },
    limitations: {
      semanticAliasScan: false,
      filenameInference: false,
      v8ObjectsUsedAsPromotionSource: false,
      promotionAuthorizationEffect: false,
      sourceLineageEffect: false,
    },
  };
}

export async function buildUniverse({
  root = PROJECT_ROOT,
  intakeRoot = DEFAULT_INTAKE_ROOT,
  v8Root = DEFAULT_V8_ROOT,
  combinedFreezeRoot = DEFAULT_COMBINED_FREEZE_ROOT,
} = {}) {
  const intakeRootInfo = await lstat(path.resolve(intakeRoot), {bigint: true});
  invariant(intakeRootInfo.isDirectory() && !intakeRootInfo.isSymbolicLink(), "Intake root must be a real directory");
  const intakeRootReal = await realpath(path.resolve(intakeRoot));
  invariant(intakeRootReal === path.resolve(intakeRoot), "Intake root resolves through a symlink or alias");
  if (path.resolve(intakeRoot) === DEFAULT_INTAKE_ROOT) {
    invariant(intakeRootReal === DEFAULT_INTAKE_ROOT, "Default intake root identity changed");
  }
  const canonical = await loadCanonicalInputs(root);
  const intake = await loadIntakeInputs(intakeRoot);
  const animations = canonical.animations.value;
  const flaOnly = canonical.flaOnly.value;
  const sourceFiles = canonical.sourceFiles.value;
  const sourceFreeze = canonical.sourceFreeze.value;
  const sourceProfile = canonical.currentSourceProfile.value;
  const missing = canonical.missingReferences.value;
  invariant(animations.summary?.pairing?.pairedSwfFla === 1_344, "Canonical paired baseline changed");
  invariant(animations.summary?.pairing?.swfOnly === 752, "Canonical SWF-only baseline changed");
  invariant(animations.summary?.pairing?.flaOnly === 197, "Canonical FLA-only baseline changed");
  invariant(sourceFiles.fileCount === 9_147 && sourceFiles.totalBytes === 3_214_585_414, "Canonical source baseline changed");
  invariant(sourceFreeze.manifestSha256 === EXPECTED.canonical.sourceManifest.sha256, "Source freeze manifest binding changed");
  invariant(sourceProfile.artifactType === "help-math-current-source-profile", "Current source profile type changed");
  const currentByNormalizedPath = new Map();
  const currentBySha = new Map();
  for (const record of sourceFiles.files) {
    const normalized = normalizedPath(record.path);
    invariant(!currentByNormalizedPath.has(normalized), `Current canonical source has a normalized path collision: ${record.path}`);
    currentByNormalizedPath.set(normalized, record);
    if (!currentBySha.has(record.sha256)) currentBySha.set(record.sha256, []);
    currentBySha.get(record.sha256).push(record.path);
  }
  const missingReferences = {
    course: new Set(missing.course.map((record) => normalizedPath(record.expectedPath))),
    keyterm: new Set(missing.keyterm.map((record) => record.filename.normalize("NFC").toLowerCase())),
  };
  const canonicalSourceRoot = path.join(
    path.resolve(root),
    "source-assets/flash/HELP MATH_ORIGINAL FILES",
  );
  const canonicalSourceRootInformation = await lstat(canonicalSourceRoot, {bigint: true});
  invariant(
    canonicalSourceRootInformation.isDirectory() && !canonicalSourceRootInformation.isSymbolicLink(),
    "Canonical source root must be a real directory",
  );
  invariant(await realpath(canonicalSourceRoot) === canonicalSourceRoot, "Canonical source root resolves through a symlink or alias");
  const planByStemExtension = new Map();
  for (const [scope, entry] of Object.entries(intake.scopes)) {
    for (const intakeRecord of entry.plan.value.records) {
      if (intakeRecord.extension !== "fla" && intakeRecord.extension !== "swf") continue;
      portableRelative(intakeRecord.canonicalPath, `${scope} intake canonicalPath`);
      const key = `${normalizedStem(intakeRecord.canonicalPath)}|${intakeRecord.extension}`;
      invariant(!planByStemExtension.has(key), `Intake plans have a normalized counterpart collision: ${intakeRecord.canonicalPath}`);
      planByStemExtension.set(key, {
        scope,
        entry,
        intakeRecord: {
          ...intakeRecord,
          planCanonicalCatalogSha256: entry.plan.value.inputs.canonicalCatalogSha256,
        },
      });
    }
  }
  const selections = [];
  for (const animation of animations.animations.filter((record) => record.pairedFla === null)) {
    const selected = planByStemExtension.get(`${normalizedStem(animation.source.path)}|fla`);
    if (!selected) continue;
    selections.push({
      ...selected,
      direction: "fla-for-canonical-swf-only",
      counterpart: {
        canonicalPath: animation.source.path,
        bytes: animation.source.bytes,
        sha256: animation.source.sha256,
        extension: "swf",
        swf: animation.source.swf,
      },
    });
  }
  for (const fla of flaOnly.files) {
    const selected = planByStemExtension.get(`${normalizedStem(fla.source.path)}|swf`);
    if (!selected) continue;
    selections.push({
      ...selected,
      direction: "swf-for-canonical-fla-only",
      counterpart: {
        canonicalPath: fla.source.path,
        bytes: fla.source.bytes,
        sha256: fla.source.sha256,
        extension: "fla",
        flaContainer: fla.source.flaContainer,
      },
    });
  }
  invariant(selections.length === EXPECTED.universe.count, `Expected 620 counterpart selections, observed ${selections.length}`);
  const records = [];
  for (const selection of selections) {
    const {scope, entry, intakeRecord, counterpart, direction} = selection;
    const manifestRecord = entry.manifestByPath.get(intakeRecord.manifestRelativePath);
    invariant(manifestRecord, `Intake record is absent from ${scope} source manifest: ${intakeRecord.canonicalPath}`);
    invariant(
      manifestRecord.bytes === intakeRecord.bytes && manifestRecord.sha256 === intakeRecord.sha256,
      `Intake plan/source-manifest identity mismatch: ${intakeRecord.canonicalPath}`,
    );
    invariant(!currentByNormalizedPath.has(normalizedPath(intakeRecord.canonicalPath)), `Counterpart target already exists: ${intakeRecord.canonicalPath}`);
    const physicalRelative = portableRelative(
      path.posix.join("verified", entry.config.sourceDirectory, intakeRecord.manifestRelativePath),
      "Quarantine physical relative path",
    );
    const {absolutePath: physicalPath} = await secureResolveExistingRegular(
      intakeRootReal,
      physicalRelative,
      `Quarantine source ${intakeRecord.canonicalPath}`,
    );
    const sourceBytes = await readAndVerifySourceFile(physicalPath, intakeRecord, `Quarantine source ${intakeRecord.canonicalPath}`);
    const {absolutePath: counterpartPhysicalPath} = await secureResolveExistingRegular(
      canonicalSourceRoot,
      counterpart.canonicalPath,
      `Canonical counterpart ${counterpart.canonicalPath}`,
    );
    await readAndVerifySourceFile(
      counterpartPhysicalPath,
      counterpart,
      `Canonical counterpart ${counterpart.canonicalPath}`,
    );
    records.push(buildRecord({
      scope,
      scopeConfig: entry.config,
      intakeRecord,
      manifestRecord,
      counterpart,
      direction,
      sourceBytes,
      currentHashPaths: currentBySha.get(intakeRecord.sha256) ?? [],
      missingReferences,
    }));
  }
  records.sort((left, right) => compareText(left.canonicalPath, right.canonicalPath));
  invariant(new Set(records.map((record) => record.canonicalPath)).size === records.length, "Universe has duplicate canonical paths");
  invariant(new Set(records.map((record) => `${record.normalizedFullRelativeStem}|${record.extension}`)).size === records.length, "Universe has normalized stem/extension collisions");
  const corroboratingEvidence = await buildCorroboratingEvidence({records, v8Root, combinedFreezeRoot});
  const priorCounts = countBy(records, (record) => record.priorDisposition);
  const currentCounts = countBy(records, (record) => record.currentDisposition);
  const candidateSwfHeaders = records.filter((record) => record.extension === "swf").map((record) => record.diagnostics.candidate.header);
  const counterpartSwfHeaders = records.filter((record) => record.extension === "fla").map((record) => record.diagnostics.existingCounterpart.header);
  const duplicateGroups = [...records.reduce((map, record) => {
    if (!map.has(record.sha256)) map.set(record.sha256, []);
    map.get(record.sha256).push(record);
    return map;
  }, new Map())]
    .filter(([, group]) => group.length > 1)
    .map(([sha256, group]) => ({
      sha256,
      bytes: group[0].bytes,
      paths: group.map((record) => record.canonicalPath).sort(compareText),
      currentDispositions: [...new Set(group.map((record) => record.currentDisposition))].sort(compareText),
    }))
    .sort((left, right) => compareText(left.sha256, right.sha256));
  const universe = {
    schemaVersion: UNIVERSE_SCHEMA,
    artifactType: UNIVERSE_ARTIFACT_TYPE,
    universeDate: "2026-08-07",
    status: "frozen-private-quarantine-review-universe-no-promotion",
    mode: "plan-only-no-source-mutation",
    sourceRootBindings: {
      [SOURCE_ROOT_REF]: {
        absolutePath: intakeRootReal,
        custody: {
          readme: immutableInputDescriptor(EXPECTED.intakeReadme),
          receipt: immutableInputDescriptor(EXPECTED.intakeReceipt),
        },
        usage: "read-only-private-quarantine-source-for-byte-identical-working-copy-only",
      },
    },
    inputs: {
      repositoryBaseline: Object.fromEntries(
        Object.entries(EXPECTED.canonical).map(([name, pin]) => [name, immutableInputDescriptor(pin)]),
      ),
      privateIntake: {
        rootRef: SOURCE_ROOT_REF,
        readme: immutableInputDescriptor(EXPECTED.intakeReadme),
        receipt: immutableInputDescriptor(EXPECTED.intakeReceipt),
        scopes: Object.fromEntries(Object.entries(EXPECTED.scopes).map(([scope, config]) => [scope, {
          manifest: {
            ...immutableInputDescriptor(config.manifest),
            checksumSetSha256: config.manifest.checksumSetSha256,
            sourceDirectory: config.sourceDirectory,
          },
          intakePlan: immutableInputDescriptor(config.intakePlan),
        }])),
      },
    },
    derivation: {
      canonicalPairingKey: "NFC(lowercase(full POSIX relative path without final extension))",
      selection: "join current canonical SWF-only and FLA-only placements to opposite-extension intake records by normalized full-relative-path stem",
      basenameOnlyMatching: false,
      casefoldOnlyExtraMatches: 0,
      candidateFlaForCanonicalSwfOnly: records.filter((record) => record.counterpartDirection === "fla-for-canonical-swf-only").length,
      candidateSwfForCanonicalFlaOnly: records.filter((record) => record.counterpartDirection === "swf-for-canonical-fla-only").length,
    },
    summary: {
      records: records.length,
      totalBytes: records.reduce((sum, record) => sum + record.bytes, 0),
      uniqueSha256: new Set(records.map((record) => record.sha256)).size,
      byExtension: countBy(records, (record) => record.extension),
      bytesByExtension: bytesBy(records, (record) => record.extension),
      byScope: summarizeByScope(records),
      priorDisposition: priorCounts,
      priorIntakeDecision: countBy(records, (record) => record.priorIntakeDecision),
      currentDisposition: currentCounts,
      bytesByPriorDisposition: bytesBy(records, (record) => record.priorDisposition),
      bytesByCurrentDisposition: bytesBy(records, (record) => record.currentDisposition),
      currentHoldRecords: records.filter((record) => record.currentDisposition !== "candidate-new-source-in-quarantine").length,
      currentAutomaticCopyAllowed: records.filter((record) => record.automaticCopyAllowed).length,
      manifestMismatches: 0,
      physicalRehashMismatches: 0,
      counterpartPhysicalFilesVerified: records.length,
      counterpartPhysicalRehashMismatches: 0,
      exactCanonicalTargetsAlreadyPresent: 0,
    },
    diagnostics: {
      candidateSwf: summarizeSwfHeaders(candidateSwfHeaders),
      existingCounterpartSwf: summarizeSwfHeaders(counterpartSwfHeaders),
      candidateFlaContainers: countBy(records.filter((record) => record.extension === "fla"), (record) => record.diagnostics.candidate.container),
      existingCounterpartFlaContainers: countBy(records.filter((record) => record.extension === "swf"), (record) => record.diagnostics.existingCounterpart.container),
      duplicateSha256PlacementGroups: duplicateGroups,
      priorCandidateNowCurrentPlacementAliases: records
        .filter((record) => record.priorDisposition === "candidate-new-source-in-quarantine" && record.currentDisposition === "hold-placement-alias-review")
        .map((record) => ({
          canonicalPath: record.canonicalPath,
          bytes: record.bytes,
          sha256: record.sha256,
          currentCanonicalHashMatchPaths: record.currentCanonicalHashMatchPaths,
        })),
    },
    digests: {
      pathSetSha256: pathSetDigest(records),
      pathSetAlgorithm: "sha256(sorted canonicalPath<LF>)",
      recordSetSha256: recordSetDigest(records),
      recordSetAlgorithm: "sha256(sorted canonicalPath<TAB>bytes<TAB>sha256<LF>)",
      sourceBoundRecordSetSha256: sourceBoundRecordSetDigest(records),
      sourceBoundRecordSetAlgorithm: "sha256(sorted-by-canonicalPath canonicalPath<TAB>sourceRelativePath<TAB>bytes<TAB>sha256<TAB>sourceManifestSha256<TAB>sourceManifestRecordPath<TAB>priorDisposition<TAB>currentDisposition<LF>); sourceRelativePath=quarantineRelativePath; UTF-8 fields",
    },
    corroboratingEvidence,
    records,
    evidenceBoundary: {
      sourcePresenceAndByteIdentityOnly: true,
      structuralStemPairingIsPublicationLineage: false,
      holdsAutomaticallyApproved: false,
      formalPairingNumbersMayBeReportedBeforeAppliedReceiptAndLiveCatalogChecks: false,
      acceptanceEffects: {...FALSE_ACCEPTANCE_EFFECTS},
    },
  };
  assertUniverse(universe);
  return universe;
}

export function assertUniverse(universe) {
  exactKeys(universe, [
    "schemaVersion", "artifactType", "universeDate", "status", "mode",
    "sourceRootBindings", "inputs", "derivation", "summary", "diagnostics",
    "digests", "corroboratingEvidence", "records", "evidenceBoundary",
  ], "Universe");
  invariant(universe.schemaVersion === UNIVERSE_SCHEMA, "Universe schema changed");
  invariant(universe.artifactType === UNIVERSE_ARTIFACT_TYPE, "Universe artifact type changed");
  invariant(universe.records.length === EXPECTED.universe.count, "Universe must contain exactly 620 records");
  invariant(universe.summary.totalBytes === EXPECTED.universe.bytes, "Universe total bytes changed");
  invariant(universe.summary.uniqueSha256 === EXPECTED.universe.uniqueSha256, "Universe unique SHA-256 count changed");
  invariant(universe.derivation.candidateFlaForCanonicalSwfOnly === EXPECTED.universe.candidateFla, "Universe candidate FLA count changed");
  invariant(universe.derivation.candidateSwfForCanonicalFlaOnly === EXPECTED.universe.candidateSwf, "Universe candidate SWF count changed");
  invariant(universe.summary.priorDisposition["candidate-new-source-in-quarantine"] === EXPECTED.universe.prior.candidate, "Prior candidate count changed");
  invariant(universe.summary.priorDisposition["hold-historical-custody-review"] === EXPECTED.universe.prior.historical, "Prior historical hold count changed");
  invariant(universe.summary.priorDisposition["hold-placement-alias-review"] === EXPECTED.universe.prior.placement, "Prior placement hold count changed");
  invariant(universe.summary.priorIntakeDecision.candidate === 551 && universe.summary.priorIntakeDecision.hold === 69, "Prior intakeDecision partition changed");
  invariant(universe.summary.currentDisposition["candidate-new-source-in-quarantine"] === EXPECTED.universe.current.candidate, "Current candidate count changed");
  invariant(universe.summary.currentDisposition["hold-historical-custody-review"] === EXPECTED.universe.current.historical, "Current historical hold count changed");
  invariant(universe.summary.currentDisposition["hold-placement-alias-review"] === EXPECTED.universe.current.placement, "Current placement hold count changed");
  invariant(universe.summary.currentHoldRecords === 71, "Current hold count must remain 71");
  invariant(JSON.stringify(universe.summary.byScope) === JSON.stringify(
    Object.fromEntries(Object.entries(EXPECTED.universe.byScope).sort(([left], [right]) => compareText(left, right))),
  ), "Universe scope breakdown changed");
  invariant(universe.summary.currentAutomaticCopyAllowed === 0, "Frozen universe cannot grant automatic copy permission");
  invariant(universe.summary.physicalRehashMismatches === 0, "Quarantine physical rehash mismatch detected");
  invariant(universe.summary.counterpartPhysicalFilesVerified === 620 && universe.summary.counterpartPhysicalRehashMismatches === 0, "Canonical counterpart physical verification changed");
  invariant(recordSetDigest(universe.records) === EXPECTED.universe.recordSetSha256, "Universe record-set digest changed");
  invariant(pathSetDigest(universe.records) === EXPECTED.universe.pathSetSha256, "Universe path-set digest changed");
  invariant(universe.digests.recordSetSha256 === recordSetDigest(universe.records), "Universe record-set binding is invalid");
  invariant(universe.digests.pathSetSha256 === pathSetDigest(universe.records), "Universe path-set binding is invalid");
  invariant(universe.digests.sourceBoundRecordSetSha256 === sourceBoundRecordSetDigest(universe.records), "Universe source-bound digest is invalid");
  invariant(
    universe.digests.sourceBoundRecordSetSha256 === EXPECTED.universe.sourceBoundRecordSetSha256,
    "Universe source-bound record-set digest changed",
  );
  const paths = new Set();
  const ids = new Set();
  for (const record of universe.records) {
    portableRelative(record.canonicalPath, "Universe canonicalPath");
    invariant(!paths.has(record.canonicalPath), `Duplicate universe path: ${record.canonicalPath}`);
    invariant(!ids.has(record.recordId), `Duplicate universe recordId: ${record.recordId}`);
    paths.add(record.canonicalPath);
    ids.add(record.recordId);
    invariant(record.automaticCopyAllowed === false, `Universe record grants automatic copy: ${record.canonicalPath}`);
    invariant(["candidate", "hold"].includes(record.priorIntakeDecision), `Universe priorIntakeDecision is invalid: ${record.canonicalPath}`);
    invariant(
      record.priorIntakeDecision === (record.priorDisposition === "candidate-new-source-in-quarantine" ? "candidate" : "hold"),
      `Universe prior intake decision/disposition binding changed: ${record.canonicalPath}`,
    );
    invariant(
      record.promotionEligibility === (record.currentDisposition === "candidate-new-source-in-quarantine" ? "pair-review-required" : "withheld-pending-manual-review"),
      `Universe promotion eligibility changed: ${record.canonicalPath}`,
    );
    invariant(record.sourceBindingSha256 === sourceBindingDigest(record), `Universe source binding drifted: ${record.canonicalPath}`);
    invariant(record.normalizedFullRelativeStem === normalizedStem(record.canonicalPath), `Universe normalized stem drifted: ${record.canonicalPath}`);
    invariant(record.sourceBinding.rootRef === SOURCE_ROOT_REF, `Universe source root changed: ${record.canonicalPath}`);
    invariant(record.manifestRelativePath === record.sourceBinding.manifestRelativePath, `Universe manifestRelativePath drifted: ${record.canonicalPath}`);
    invariant(record.quarantineRelativePath === record.sourceBinding.quarantineRelativePath, `Universe quarantineRelativePath drifted: ${record.canonicalPath}`);
    invariant(
      record.sourceManifest.path === record.sourceBinding.manifestArtifact.path
        && record.sourceManifest.bytes === record.sourceBinding.manifestArtifact.bytes
        && record.sourceManifest.sha256 === record.sourceBinding.manifestArtifact.sha256
        && record.sourceManifest.checksumSetSha256 === record.sourceBinding.manifestArtifact.checksumSetSha256
        && record.sourceManifest.sourceDirectory === record.sourceBinding.manifestArtifact.sourceDirectory
        && record.sourceManifest.recordPath === record.sourceBinding.manifestEntry.path,
      `Universe sourceManifest contract drifted: ${record.canonicalPath}`,
    );
    invariant(
      record.sourceIntakePlan.path === record.sourceBinding.intakePlanArtifact.path
        && record.sourceIntakePlan.bytes === record.sourceBinding.intakePlanArtifact.bytes
        && record.sourceIntakePlan.sha256 === record.sourceBinding.intakePlanArtifact.sha256,
      `Universe sourceIntakePlan contract drifted: ${record.canonicalPath}`,
    );
    invariant(record.existingCounterpart.path === record.existingCounterpart.canonicalPath, `Universe counterpart path alias drifted: ${record.canonicalPath}`);
    invariant(typeof record.pairReviewId === "string" && record.pairReviewStatus === "pending-unsigned-review", `Universe pair-review contract drifted: ${record.canonicalPath}`);
    invariant(record.placementReviewStatus === "pending-review" && record.publicationLineageStatus === "unresolved", `Universe review status drifted: ${record.canonicalPath}`);
    invariant(SHA256_PATTERN.test(record.sha256), `Universe record has invalid SHA-256: ${record.canonicalPath}`);
  }
  invariant(universe.corroboratingEvidence.exactNonConflictCheck.exactSha256OverlapRows === 0, "Corroborating SHA-256 conflict detected");
  invariant(universe.corroboratingEvidence.exactNonConflictCheck.exactCanonicalPathByteOverlapRows === 0, "Corroborating path conflict detected");
  invariant(Object.values(universe.evidenceBoundary.acceptanceEffects).every((value) => value === false), "Universe acceptance boundary changed");
  return universe;
}

export async function assertCurrentUniverse(universe, {projectRoot = PROJECT_ROOT} = {}) {
  assertUniverse(universe);
  const current = await buildUniverse({root: path.resolve(projectRoot)});
  const frozenBytes = Buffer.from(canonicalJson(universe), "utf8");
  const currentBytes = Buffer.from(canonicalJson(current), "utf8");
  invariant(
    currentBytes.equals(frozenBytes),
    "Current physical inputs do not byte-rederive the frozen 620-record universe",
  );
  return {
    status: "current-universe-physically-rederived-and-byte-identical",
    bytes: currentBytes.length,
    sha256: sha256Bytes(currentBytes),
    records: current.records.length,
    recordSetSha256: current.digests.recordSetSha256,
    sourceBoundRecordSetSha256: current.digests.sourceBoundRecordSetSha256,
    physicalRehashMismatches: current.summary.physicalRehashMismatches,
  };
}

function identityForReview(record, extension) {
  if (record.extension === extension) {
    return {
      role: "candidate-counterpart-from-private-quarantine",
      path: record.canonicalPath,
      bytes: record.bytes,
      sha256: record.sha256,
    };
  }
  invariant(record.existingCounterpart.extension === extension, `Review pair lacks ${extension.toUpperCase()} identity`);
  return {
    role: "existing-canonical-counterpart",
    path: record.existingCounterpart.canonicalPath,
    bytes: record.existingCounterpart.bytes,
    sha256: record.existingCounterpart.sha256,
  };
}

function headerForReview(record) {
  const header = record.extension === "swf"
    ? record.diagnostics.candidate.header
    : record.diagnostics.existingCounterpart.header;
  invariant(header?.status === "parsed", `Review pair lacks parsed SWF header: ${record.canonicalPath}`);
  return header;
}

function containerForReview(record) {
  return record.extension === "fla"
    ? record.diagnostics.candidate.container
    : record.diagnostics.existingCounterpart.container;
}

function unsignedReviewRecord(record) {
  const header = headerForReview(record);
  const holdRequired = record.currentDisposition !== "candidate-new-source-in-quarantine";
  return {
    recordId: record.recordId,
    canonicalPath: record.canonicalPath,
    sourceBindingSha256: record.sourceBindingSha256,
    fla: {
      identity: identityForReview(record, "fla"),
      container: containerForReview(record),
      animateVersion: null,
      documentType: null,
      stage: null,
      fps: null,
      rootTimeline: null,
      nestedTimelines: null,
      keyframes: null,
      frameLabels: null,
      stops: null,
      actionScript: null,
      publishProfile: null,
      linkageExports: null,
      toolVersions: [],
    },
    swf: {
      identity: identityForReview(record, "swf"),
      signature: header.signature,
      version: header.version,
      declaredLength: header.declaredFileLength,
      stage: header.stage,
      fps: header.fps,
      rootFrames: header.frameCount,
      durationMs: header.durationMs,
      actionScriptGeneration: null,
      tags: null,
      frameLabels: null,
      scripts: null,
      exports: null,
      toolVersions: [{tool: "direct SWF header parser", version: "parseSwfHeader/v1"}],
    },
    placement: {
      normalizedFullRelativeStem: record.normalizedFullRelativeStem,
      proposedCanonicalPath: record.canonicalPath,
      existingCounterpartPath: record.existingCounterpart.canonicalPath,
      priorDisposition: record.priorDisposition,
      currentDisposition: record.currentDisposition,
      currentCanonicalHashMatchPaths: record.currentCanonicalHashMatchPaths,
      historicalHashMatchRefs: record.historicalHashMatchRefs,
      variants: [],
      conclusion: null,
      toolVersions: [],
    },
    comparison: {
      timeline: null,
      version: null,
      stage: null,
      fps: null,
      rootFrames: null,
      actionScript: null,
      publishProfile: null,
      linkage: null,
    },
    lineage: {
      conclusion: null,
      evidenceArtifacts: [],
    },
    publicationLineageReceipt: null,
    authoringAuditReceipt: null,
    review: {
      decision: "unresolved",
      terminal: false,
      reviewerSubjectId: null,
      reviewedAt: null,
      notes: null,
    },
    manualHoldReview: {
      required: holdRequired,
      holdType: holdRequired ? record.currentDisposition : null,
      decision: holdRequired ? "pending" : "not-required",
      receipt: null,
    },
  };
}

function reviewPayloadProjection(ledger) {
  return {
    schemaVersion: ledger.schemaVersion,
    artifactType: ledger.artifactType,
    ledgerDate: ledger.ledgerDate,
    status: ledger.status,
    mode: ledger.mode,
    universe: ledger.universe,
    decisionContract: ledger.decisionContract,
    summary: ledger.summary,
    records: ledger.records,
    reviewers: ledger.attestation.reviewers,
    evidenceBoundary: ledger.evidenceBoundary,
  };
}

export function reviewPayloadDigest(ledger) {
  return sha256Text(canonicalJson(reviewPayloadProjection(ledger)));
}

export function prepareUnsignedReviewLedger(universe, {
  universePath = UNIVERSE_RELATIVE_PATH,
  universeBytes = Buffer.byteLength(canonicalJson(universe)),
  universeSha256 = sha256Text(canonicalJson(universe)),
} = {}) {
  assertUniverse(universe);
  const records = universe.records.map(unsignedReviewRecord);
  const ledger = {
    schemaVersion: REVIEW_SCHEMA,
    artifactType: REVIEW_ARTIFACT_TYPE,
    ledgerDate: "2026-08-07",
    status: "unsigned-machine-preparation",
    mode: "unsigned-unassigned-review-candidate-only",
    universe: {
      path: portableRelative(universePath, "Review universe path"),
      bytes: universeBytes,
      sha256: universeSha256,
      recordSetSha256: universe.digests.recordSetSha256,
      sourceBoundRecordSetSha256: universe.digests.sourceBoundRecordSetSha256,
    },
    decisionContract: {
      allowed: [...REVIEW_DECISIONS],
      terminalAllowed: [...TERMINAL_REVIEW_DECISIONS],
      onlyPromotionEligible: "confirmed-publication-lineage",
      metadataConsistentLineageUnprovenEffect: "terminal-withheld",
      unresolvedEffect: "terminal-when-explicitly-reviewed-but-always-withheld",
      currentHoldCount: 71,
      currentHoldsRequireSeparateManualReceipts: true,
      automaticApprovalsAllowed: false,
    },
    summary: {
      records: records.length,
      terminalReviews: 0,
      confirmedPublicationLineage: 0,
      unresolved: records.length,
      currentHolds: records.filter((record) => record.manualHoldReview.required).length,
      completedManualHoldReceipts: 0,
      automaticApprovals: 0,
    },
    records,
    attestation: {
      state: "unsigned-machine-preparation",
      reviewPayloadSha256: null,
      reviewers: [],
      signatureEnvelopes: [],
    },
    evidenceBoundary: {
      machinePreparedOnly: true,
      reviewerAssigned: false,
      reviewerDecisionRecorded: false,
      signatureRecorded: false,
      promotionAuthorization: false,
      acceptanceEffects: {...FALSE_ACCEPTANCE_EFFECTS},
    },
  };
  return ledger;
}

function validateArtifactReference(reference, label) {
  exactKeys(reference, ["path", "bytes", "sha256"], label);
  portableRelative(reference.path, `${label} path`);
  invariant(Number.isSafeInteger(reference.bytes) && reference.bytes >= 0, `${label} bytes are invalid`);
  invariant(SHA256_PATTERN.test(reference.sha256), `${label} SHA-256 is invalid`);
  return reference;
}

export async function verifyArtifactReference(reference, {
  root = PROJECT_ROOT,
  label = "Evidence artifact",
  immutable = true,
} = {}) {
  validateArtifactReference(reference, label);
  const {absolutePath: absolute} = await secureResolveExistingRegular(root, reference.path, label);
  const observed = await readStableFile(absolute, label, {immutable});
  invariant(observed.byteCount === reference.bytes, `${label} byte count changed`);
  invariant(observed.sha256 === reference.sha256, `${label} SHA-256 changed`);
  return observed;
}

function validateReviewer(reviewer, label) {
  exactKeys(reviewer, ["subjectId", "fullName", "role", "publicKeySpkiSha256"], label);
  for (const field of ["subjectId", "fullName", "role"]) {
    invariant(typeof reviewer[field] === "string" && reviewer[field].trim() === reviewer[field] && reviewer[field].length > 0, `${label}.${field} is invalid`);
  }
  invariant(SHA256_PATTERN.test(reviewer.publicKeySpkiSha256), `${label}.publicKeySpkiSha256 is invalid`);
  return reviewer;
}

function validIsoTimestamp(value, label) {
  invariant(typeof value === "string" && Number.isFinite(Date.parse(value)), `${label} must be an ISO timestamp`);
  return value;
}

function decodeCanonicalBase64(value, label) {
  invariant(typeof value === "string" && value.length > 0 && /^[A-Za-z0-9+/]+={0,2}$/u.test(value), `${label} is not canonical base64`);
  const bytes = Buffer.from(value, "base64");
  invariant(bytes.length > 0 && bytes.toString("base64") === value, `${label} is not canonical base64`);
  return bytes;
}

export async function verifyDetachedEd25519SignatureArtifact(reference, {
  root = PROJECT_ROOT,
  label = "Detached reviewer signature",
  reviewer,
  payloadSha256,
  minimumSignedAt,
} = {}) {
  validateReviewer(reviewer, `${label} reviewer`);
  invariant(SHA256_PATTERN.test(payloadSha256), `${label} payload digest is invalid`);
  const minimum = Date.parse(validIsoTimestamp(minimumSignedAt, `${label} minimumSignedAt`));
  const observed = await verifyArtifactReference(reference, {root, label, immutable: true});
  let artifact;
  try {
    artifact = JSON.parse(observed.bytes);
  } catch (error) {
    throw new Error(`${label} artifact is not JSON: ${error.message}`);
  }
  exactKeys(artifact, [
    "schemaVersion", "artifactType", "algorithm", "reviewerSubjectId",
    "publicKeySpkiSha256", "publicKeySpkiDerBase64", "signedPayloadSha256",
    "signedAt", "signatureBase64",
  ], label);
  invariant(
    artifact.schemaVersion === "help-math-reviewer-detached-ed25519-signature/v1"
      && artifact.artifactType === "help-math-reviewer-detached-ed25519-signature"
      && artifact.algorithm === "Ed25519",
    `${label} schema/type/algorithm changed`,
  );
  invariant(artifact.reviewerSubjectId === reviewer.subjectId, `${label} reviewer subject mismatch`);
  invariant(artifact.publicKeySpkiSha256 === reviewer.publicKeySpkiSha256, `${label} reviewer public-key fingerprint mismatch`);
  invariant(artifact.signedPayloadSha256 === payloadSha256, `${label} signed payload digest mismatch`);
  const signedAt = Date.parse(validIsoTimestamp(artifact.signedAt, `${label}.signedAt`));
  invariant(signedAt >= minimum, `${label} signature is stale`);
  const publicKeyDer = decodeCanonicalBase64(artifact.publicKeySpkiDerBase64, `${label}.publicKeySpkiDerBase64`);
  invariant(sha256Bytes(publicKeyDer) === reviewer.publicKeySpkiSha256, `${label} public-key substitution or fingerprint drift`);
  let publicKey;
  try {
    publicKey = createPublicKey({key: publicKeyDer, format: "der", type: "spki"});
  } catch (error) {
    throw new Error(`${label} public key is invalid: ${error.message}`);
  }
  invariant(publicKey.asymmetricKeyType === "ed25519", `${label} public key is not Ed25519`);
  const signature = decodeCanonicalBase64(artifact.signatureBase64, `${label}.signatureBase64`);
  invariant(
    verifyCryptographicSignature(null, Buffer.from(payloadSha256, "utf8"), publicKey, signature),
    `${label} detached Ed25519 signature is invalid`,
  );
  return {
    reviewerSubjectId: reviewer.subjectId,
    publicKeySpkiSha256: reviewer.publicKeySpkiSha256,
    payloadSha256,
    signedAt: artifact.signedAt,
    signatureSha256: sha256Bytes(signature),
  };
}

export async function loadTrustedReviewerRegistry({
  root = PROJECT_ROOT,
  universeIdentity,
} = {}) {
  validateArtifactReference(universeIdentity, "Trusted reviewer registry universe identity");
  const registryPath = path.join(root, TRUSTED_REVIEWER_REGISTRY_RELATIVE_PATH);
  invariant(await lstatOrNull(registryPath), `Trusted reviewer registry is missing: ${TRUSTED_REVIEWER_REGISTRY_RELATIVE_PATH}`);
  const file = await readImmutableJsonArtifact(root, TRUSTED_REVIEWER_REGISTRY_RELATIVE_PATH, "Trusted reviewer registry");
  const registry = file.value;
  exactKeys(registry, [
    "schemaVersion", "artifactType", "authorizedAt", "universe", "reviewers",
    "evidenceBoundary",
  ], "Trusted reviewer registry");
  invariant(
    registry.schemaVersion === "help-math-fla-swf-counterpart-trusted-reviewer-registry/v1"
      && registry.artifactType === "help-math-fla-swf-counterpart-trusted-reviewer-registry",
    "Trusted reviewer registry schema/type changed",
  );
  validIsoTimestamp(registry.authorizedAt, "Trusted reviewer registry authorizedAt");
  invariant(JSON.stringify(registry.universe) === JSON.stringify(universeIdentity), "Trusted reviewer registry universe binding changed");
  invariant(Array.isArray(registry.reviewers) && registry.reviewers.length > 0, "Trusted reviewer registry requires at least one externally authorized reviewer");
  const bySubjectId = new Map();
  const fingerprints = new Set();
  for (const [index, reviewer] of registry.reviewers.entries()) {
    exactKeys(reviewer, ["subjectId", "fullName", "allowedRoles", "publicKeySpkiSha256"], `Trusted reviewer registry reviewer[${index}]`);
    nonEmptyString(reviewer.subjectId, `Trusted reviewer registry reviewer[${index}].subjectId`);
    nonEmptyString(reviewer.fullName, `Trusted reviewer registry reviewer[${index}].fullName`);
    invariant(Array.isArray(reviewer.allowedRoles) && reviewer.allowedRoles.length > 0, `Trusted reviewer registry reviewer[${index}].allowedRoles must be non-empty`);
    for (const [roleIndex, role] of reviewer.allowedRoles.entries()) nonEmptyString(role, `Trusted reviewer registry reviewer[${index}].allowedRoles[${roleIndex}]`);
    invariant(new Set(reviewer.allowedRoles).size === reviewer.allowedRoles.length, `Trusted reviewer registry reviewer[${index}] has duplicate allowed roles`);
    invariant(SHA256_PATTERN.test(reviewer.publicKeySpkiSha256), `Trusted reviewer registry reviewer[${index}] public-key fingerprint is invalid`);
    invariant(!bySubjectId.has(reviewer.subjectId), "Trusted reviewer registry has duplicate subjectId");
    invariant(!fingerprints.has(reviewer.publicKeySpkiSha256), "Trusted reviewer registry has duplicate public-key fingerprint");
    bySubjectId.set(reviewer.subjectId, reviewer);
    fingerprints.add(reviewer.publicKeySpkiSha256);
  }
  const schemaReviewers = registry.reviewers.filter((reviewer) =>
    reviewer.allowedRoles.includes("schema-reviewer"));
  const transactionReviewers = registry.reviewers.filter((reviewer) =>
    reviewer.allowedRoles.includes("transaction-adversarial-reviewer"));
  invariant(schemaReviewers.length > 0,
    "Trusted reviewer registry does not authorize required independent role: schema-reviewer");
  invariant(transactionReviewers.length > 0,
    "Trusted reviewer registry does not authorize required independent role: transaction-adversarial-reviewer");
  invariant(schemaReviewers.some((schemaReviewer) =>
    transactionReviewers.some((transactionReviewer) =>
      schemaReviewer.subjectId !== transactionReviewer.subjectId
        && schemaReviewer.publicKeySpkiSha256 !== transactionReviewer.publicKeySpkiSha256)),
  "Trusted reviewer registry cannot supply distinct schema and transaction reviewers");
  exactKeys(registry.evidenceBoundary, [
    "externallyProvisioned", "generatedBySuccessorTools", "templateIsAuthority",
    "authorityScope",
  ], "Trusted reviewer registry evidence boundary");
  invariant(
    registry.evidenceBoundary.externallyProvisioned === true
      && registry.evidenceBoundary.generatedBySuccessorTools === false
      && registry.evidenceBoundary.templateIsAuthority === false
      && registry.evidenceBoundary.authorityScope === "v2-successor-review-signers-only",
    "Trusted reviewer registry evidence boundary changed",
  );
  return {value: registry, identity: file.identity, bySubjectId};
}

export function assertReviewerAuthorizedByRegistry(reviewer, registryContext, label = "Reviewer") {
  const authorized = registryContext.bySubjectId.get(reviewer.subjectId);
  invariant(authorized, `${label} is not present in the external trusted reviewer registry`);
  invariant(
    authorized.fullName === reviewer.fullName
      && authorized.publicKeySpkiSha256 === reviewer.publicKeySpkiSha256
      && authorized.allowedRoles.includes(reviewer.role),
    `${label} subject/name/key/role differs from external trusted reviewer authorization`,
  );
  return authorized;
}

function validateToolVersions(value, label, {allowEmpty = false} = {}) {
  invariant(Array.isArray(value) && (allowEmpty || value.length > 0), `${label} must be ${allowEmpty ? "an" : "a non-empty"} array`);
  for (const [index, tool] of value.entries()) {
    exactKeys(tool, ["tool", "version"], `${label}[${index}]`);
    invariant(typeof tool.tool === "string" && tool.tool.length > 0, `${label}[${index}].tool is invalid`);
    invariant(typeof tool.version === "string" && tool.version.length > 0, `${label}[${index}].version is invalid`);
  }
}

function nonEmptyString(value, label) {
  invariant(typeof value === "string" && value.trim() === value && value.length > 0, `${label} must be a non-empty trimmed string`);
  return value;
}

function nonNegativeInteger(value, label) {
  invariant(Number.isSafeInteger(value) && value >= 0, `${label} must be a non-negative safe integer`);
  return value;
}

function positiveNumber(value, label) {
  invariant(typeof value === "number" && Number.isFinite(value) && value > 0, `${label} must be a positive finite number`);
  return value;
}

function validateStageMetadata(value, label) {
  exactKeys(value, [
    "units", "twipsPerPixel", "xMinTwips", "xMaxTwips", "yMinTwips", "yMaxTwips",
    "xMin", "xMax", "yMin", "yMax", "width", "height",
  ], label);
  invariant(value.units === "px", `${label}.units must be px`);
  positiveNumber(value.twipsPerPixel, `${label}.twipsPerPixel`);
  for (const field of ["xMinTwips", "xMaxTwips", "yMinTwips", "yMaxTwips", "xMin", "xMax", "yMin", "yMax"]) {
    invariant(typeof value[field] === "number" && Number.isFinite(value[field]), `${label}.${field} must be finite`);
  }
  positiveNumber(value.width, `${label}.width`);
  positiveNumber(value.height, `${label}.height`);
  invariant(value.xMax > value.xMin && value.yMax > value.yMin, `${label} bounds are invalid`);
  invariant(value.xMaxTwips > value.xMinTwips && value.yMaxTwips > value.yMinTwips, `${label} twip bounds are invalid`);
  invariant(value.width === value.xMax - value.xMin && value.height === value.yMax - value.yMin, `${label} dimensions differ from bounds`);
  return value;
}

function validateFlaMetadata(fla, label) {
  nonEmptyString(fla.animateVersion, `${label}.animateVersion`);
  invariant([
    "flash-document",
    "actionscript-2-document",
    "actionscript-3-document",
    "legacy-flash-document",
  ].includes(fla.documentType), `${label}.documentType enum is invalid`);
  validateStageMetadata(fla.stage, `${label}.stage`);
  positiveNumber(fla.fps, `${label}.fps`);
  exactKeys(fla.rootTimeline, ["name", "frameCount", "layerCount"], `${label}.rootTimeline`);
  nonEmptyString(fla.rootTimeline.name, `${label}.rootTimeline.name`);
  nonNegativeInteger(fla.rootTimeline.frameCount, `${label}.rootTimeline.frameCount`);
  nonNegativeInteger(fla.rootTimeline.layerCount, `${label}.rootTimeline.layerCount`);
  invariant(fla.rootTimeline.frameCount > 0 && fla.rootTimeline.layerCount > 0, `${label}.rootTimeline must contain frames and layers`);
  invariant(Array.isArray(fla.nestedTimelines), `${label}.nestedTimelines must be an array`);
  for (const [index, item] of fla.nestedTimelines.entries()) {
    exactKeys(item, ["path", "symbolType", "frameCount", "layerCount"], `${label}.nestedTimelines[${index}]`);
    nonEmptyString(item.path, `${label}.nestedTimelines[${index}].path`);
    invariant(["movie-clip", "graphic", "button"].includes(item.symbolType), `${label}.nestedTimelines[${index}].symbolType enum is invalid`);
    nonNegativeInteger(item.frameCount, `${label}.nestedTimelines[${index}].frameCount`);
    nonNegativeInteger(item.layerCount, `${label}.nestedTimelines[${index}].layerCount`);
  }
  invariant(Array.isArray(fla.keyframes), `${label}.keyframes must be an array`);
  for (const [index, item] of fla.keyframes.entries()) {
    exactKeys(item, ["timelinePath", "layerName", "frameIndex"], `${label}.keyframes[${index}]`);
    nonEmptyString(item.timelinePath, `${label}.keyframes[${index}].timelinePath`);
    nonEmptyString(item.layerName, `${label}.keyframes[${index}].layerName`);
    nonNegativeInteger(item.frameIndex, `${label}.keyframes[${index}].frameIndex`);
  }
  invariant(Array.isArray(fla.frameLabels), `${label}.frameLabels must be an array`);
  for (const [index, item] of fla.frameLabels.entries()) {
    exactKeys(item, ["timelinePath", "frameIndex", "label"], `${label}.frameLabels[${index}]`);
    nonEmptyString(item.timelinePath, `${label}.frameLabels[${index}].timelinePath`);
    nonNegativeInteger(item.frameIndex, `${label}.frameLabels[${index}].frameIndex`);
    nonEmptyString(item.label, `${label}.frameLabels[${index}].label`);
  }
  invariant(Array.isArray(fla.stops), `${label}.stops must be an array`);
  for (const [index, item] of fla.stops.entries()) {
    exactKeys(item, ["timelinePath", "frameIndex", "scriptKind"], `${label}.stops[${index}]`);
    nonEmptyString(item.timelinePath, `${label}.stops[${index}].timelinePath`);
    nonNegativeInteger(item.frameIndex, `${label}.stops[${index}].frameIndex`);
    invariant(["stop", "goto-and-stop", "conditional-stop"].includes(item.scriptKind), `${label}.stops[${index}].scriptKind enum is invalid`);
  }
  exactKeys(fla.actionScript, ["generation", "documentClass", "frameScriptCount", "symbolScriptCount"], `${label}.actionScript`);
  invariant(["none", "AS1/2", "AS3", "mixed"].includes(fla.actionScript.generation), `${label}.actionScript.generation enum is invalid`);
  invariant(fla.actionScript.documentClass === null || (typeof fla.actionScript.documentClass === "string" && fla.actionScript.documentClass.trim().length > 0), `${label}.actionScript.documentClass is invalid`);
  nonNegativeInteger(fla.actionScript.frameScriptCount, `${label}.actionScript.frameScriptCount`);
  nonNegativeInteger(fla.actionScript.symbolScriptCount, `${label}.actionScript.symbolScriptCount`);
  exactKeys(fla.publishProfile, ["name", "targetPlayer", "actionScriptVersion", "htmlWrapper"], `${label}.publishProfile`);
  nonEmptyString(fla.publishProfile.name, `${label}.publishProfile.name`);
  nonEmptyString(fla.publishProfile.targetPlayer, `${label}.publishProfile.targetPlayer`);
  invariant(["none", "AS1/2", "AS3"].includes(fla.publishProfile.actionScriptVersion), `${label}.publishProfile.actionScriptVersion enum is invalid`);
  invariant(typeof fla.publishProfile.htmlWrapper === "boolean", `${label}.publishProfile.htmlWrapper must be boolean`);
  invariant(Array.isArray(fla.linkageExports), `${label}.linkageExports must be an array`);
  for (const [index, item] of fla.linkageExports.entries()) {
    exactKeys(item, ["symbolName", "className", "linkageIdentifier"], `${label}.linkageExports[${index}]`);
    nonEmptyString(item.symbolName, `${label}.linkageExports[${index}].symbolName`);
    invariant(item.className === null || (typeof item.className === "string" && item.className.trim().length > 0), `${label}.linkageExports[${index}].className is invalid`);
    invariant(item.linkageIdentifier === null || (typeof item.linkageIdentifier === "string" && item.linkageIdentifier.trim().length > 0), `${label}.linkageExports[${index}].linkageIdentifier is invalid`);
  }
  validateToolVersions(fla.toolVersions, `${label}.toolVersions`);
}

function validateSwfMetadata(swf, label) {
  invariant(["none", "AS1/2", "AS3", "mixed"].includes(swf.actionScriptGeneration), `${label}.actionScriptGeneration enum is invalid`);
  invariant(Array.isArray(swf.tags), `${label}.tags must be an array`);
  for (const [index, item] of swf.tags.entries()) {
    exactKeys(item, ["code", "name", "count"], `${label}.tags[${index}]`);
    nonNegativeInteger(item.code, `${label}.tags[${index}].code`);
    nonEmptyString(item.name, `${label}.tags[${index}].name`);
    nonNegativeInteger(item.count, `${label}.tags[${index}].count`);
    invariant(item.count > 0, `${label}.tags[${index}].count must be positive`);
  }
  invariant(Array.isArray(swf.frameLabels), `${label}.frameLabels must be an array`);
  for (const [index, item] of swf.frameLabels.entries()) {
    exactKeys(item, ["frameIndex", "label"], `${label}.frameLabels[${index}]`);
    nonNegativeInteger(item.frameIndex, `${label}.frameLabels[${index}].frameIndex`);
    nonEmptyString(item.label, `${label}.frameLabels[${index}].label`);
  }
  invariant(Array.isArray(swf.scripts), `${label}.scripts must be an array`);
  for (const [index, item] of swf.scripts.entries()) {
    exactKeys(item, ["kind", "location", "count"], `${label}.scripts[${index}]`);
    invariant(["DoAction", "DoInitAction", "DoABC"].includes(item.kind), `${label}.scripts[${index}].kind enum is invalid`);
    nonEmptyString(item.location, `${label}.scripts[${index}].location`);
    nonNegativeInteger(item.count, `${label}.scripts[${index}].count`);
    invariant(item.count > 0, `${label}.scripts[${index}].count must be positive`);
  }
  invariant(Array.isArray(swf.exports), `${label}.exports must be an array`);
  for (const [index, item] of swf.exports.entries()) {
    exactKeys(item, ["symbolId", "name"], `${label}.exports[${index}]`);
    nonNegativeInteger(item.symbolId, `${label}.exports[${index}].symbolId`);
    nonEmptyString(item.name, `${label}.exports[${index}].name`);
  }
  validateToolVersions(swf.toolVersions, `${label}.toolVersions`);
}

function validatePlacementMetadata(placement, label) {
  invariant(Array.isArray(placement.variants), `${label}.variants must be an array`);
  for (const [index, variant] of placement.variants.entries()) {
    exactKeys(variant, ["path", "bytes", "sha256", "relationship", "disposition"], `${label}.variants[${index}]`);
    portableRelative(variant.path, `${label}.variants[${index}].path`);
    nonNegativeInteger(variant.bytes, `${label}.variants[${index}].bytes`);
    invariant(SHA256_PATTERN.test(variant.sha256), `${label}.variants[${index}].sha256 is invalid`);
    invariant(["exact-byte-alias", "same-stem-different-bytes", "historical-hash-match", "other-reviewed-variant"].includes(variant.relationship), `${label}.variants[${index}].relationship enum is invalid`);
    invariant(["retain-existing", "withhold-candidate", "reviewed-placement-target", "not-applicable"].includes(variant.disposition), `${label}.variants[${index}].disposition enum is invalid`);
  }
  invariant(["confirmed", "not-confirmed", "conflict"].includes(placement.conclusion), `${label}.conclusion enum is invalid`);
  validateToolVersions(placement.toolVersions, `${label}.toolVersions`);
}

function validateComparisonMetadata(comparison, label) {
  for (const [field, value] of Object.entries(comparison)) {
    invariant(COMPARISON_RESULTS.includes(value), `${label}.${field} enum is invalid`);
  }
}

function validateReviewDecisionConsistency(record) {
  const comparisonValues = Object.values(record.comparison);
  const mismatch = comparisonValues.includes("mismatch");
  const indeterminate = comparisonValues.includes("indeterminate");
  const resolved = comparisonValues.every((value) => value === "consistent" || value === "resolved-by-primary-evidence");
  const placementConflict = record.placement.conclusion === "conflict";
  const lineageContradicted = record.lineage.conclusion === "contradicted";
  const decision = record.review.decision;
  // A pair may legitimately carry more than one typed adverse finding. Keep
  // every finding in its typed field and choose one deterministic terminal
  // decision by evidentiary priority; never erase a secondary conflict merely
  // to make the ledger schema satisfiable.
  const adverseDecision = lineageContradicted
    ? "contradicted"
    : placementConflict
      ? "placement-conflict"
      : mismatch
        ? "timeline-or-version-mismatch"
        : null;
  if (adverseDecision) {
    invariant(decision === adverseDecision,
      `Typed adverse findings must map to primary terminal decision ${adverseDecision}`);
  }
  if (decision === "confirmed-publication-lineage") {
    invariant(resolved && !indeterminate, "Confirmed publication lineage requires every comparison to be consistent or resolved by primary evidence");
    invariant(record.placement.conclusion === "confirmed", "Confirmed publication lineage requires resolved placement");
    invariant(record.lineage.conclusion === "confirmed", "Confirmed publication lineage requires confirmed lineage");
  } else {
    invariant(record.publicationLineageReceipt === null, "Only confirmed-publication-lineage may bind a publication-lineage receipt");
  }
  if (decision === "metadata-consistent-lineage-unproven") {
    invariant(resolved && !indeterminate, "Metadata-consistent lineage-unproven requires all comparisons resolved without mismatch");
    invariant(record.placement.conclusion === "confirmed", "Metadata-consistent lineage-unproven requires resolved placement");
    invariant(record.lineage.conclusion === "not-confirmed", "Metadata-consistent lineage-unproven requires lineage not-confirmed");
  }
  if (decision === "timeline-or-version-mismatch") {
    invariant(mismatch && !placementConflict && !lineageContradicted,
      "timeline-or-version-mismatch requires a comparison mismatch and no higher-priority placement/lineage contradiction");
  }
  if (decision === "placement-conflict") {
    invariant(placementConflict && !lineageContradicted,
      "placement-conflict requires a placement conflict and no higher-priority lineage contradiction");
  }
  if (decision === "contradicted") {
    invariant(lineageContradicted, "contradicted requires a lineage contradiction");
  }
  if (decision === "unresolved") {
    invariant(!mismatch && !placementConflict && !lineageContradicted, "Explicit unresolved cannot conceal a typed mismatch, placement conflict, or lineage contradiction");
  }
}

function validateIdentity(value, expected, label) {
  exactKeys(value, ["role", "path", "bytes", "sha256"], label);
  invariant(value.role === expected.role && value.path === expected.path && value.bytes === expected.bytes && value.sha256 === expected.sha256, `${label} changed from frozen universe`);
}

function validateReviewRecord(record, universeRecord, {requireTerminal = false} = {}) {
  exactKeys(record, [
    "recordId", "canonicalPath", "sourceBindingSha256", "fla", "swf",
    "placement", "comparison", "lineage", "publicationLineageReceipt", "authoringAuditReceipt", "review", "manualHoldReview",
  ], `Review record ${universeRecord.canonicalPath}`);
  invariant(record.recordId === universeRecord.recordId, "Review recordId changed");
  invariant(record.canonicalPath === universeRecord.canonicalPath, "Review canonicalPath changed");
  invariant(record.sourceBindingSha256 === universeRecord.sourceBindingSha256, "Review source binding changed");
  const expectedFla = identityForReview(universeRecord, "fla");
  const expectedSwf = identityForReview(universeRecord, "swf");
  exactKeys(record.fla, [
    "identity", "container", "animateVersion", "documentType", "stage", "fps",
    "rootTimeline", "nestedTimelines", "keyframes", "frameLabels", "stops",
    "actionScript", "publishProfile", "linkageExports", "toolVersions",
  ], `Review FLA ${record.canonicalPath}`);
  validateIdentity(record.fla.identity, expectedFla, `Review FLA identity ${record.canonicalPath}`);
  invariant(record.fla.container === containerForReview(universeRecord), `Review FLA container changed: ${record.canonicalPath}`);
  exactKeys(record.swf, [
    "identity", "signature", "version", "declaredLength", "stage", "fps",
    "rootFrames", "durationMs", "actionScriptGeneration", "tags", "frameLabels",
    "scripts", "exports", "toolVersions",
  ], `Review SWF ${record.canonicalPath}`);
  validateIdentity(record.swf.identity, expectedSwf, `Review SWF identity ${record.canonicalPath}`);
  const header = headerForReview(universeRecord);
  invariant(
    record.swf.signature === header.signature
      && record.swf.version === header.version
      && record.swf.declaredLength === header.declaredFileLength
      && JSON.stringify(record.swf.stage) === JSON.stringify(header.stage)
      && record.swf.fps === header.fps
      && record.swf.rootFrames === header.frameCount
      && record.swf.durationMs === header.durationMs,
    `Review SWF header facts changed: ${record.canonicalPath}`,
  );
  validateToolVersions(record.swf.toolVersions, `Review SWF tools ${record.canonicalPath}`);
  exactKeys(record.placement, [
    "normalizedFullRelativeStem", "proposedCanonicalPath", "existingCounterpartPath",
    "priorDisposition", "currentDisposition", "currentCanonicalHashMatchPaths",
    "historicalHashMatchRefs", "variants", "conclusion", "toolVersions",
  ], `Review placement ${record.canonicalPath}`);
  invariant(record.placement.normalizedFullRelativeStem === universeRecord.normalizedFullRelativeStem, "Placement stem changed");
  invariant(record.placement.proposedCanonicalPath === universeRecord.canonicalPath, "Proposed placement changed");
  invariant(record.placement.existingCounterpartPath === universeRecord.existingCounterpart.canonicalPath, "Counterpart placement changed");
  invariant(record.placement.priorDisposition === universeRecord.priorDisposition, "Prior disposition changed in review");
  invariant(record.placement.currentDisposition === universeRecord.currentDisposition, "Current disposition changed in review");
  invariant(JSON.stringify(record.placement.currentCanonicalHashMatchPaths) === JSON.stringify(universeRecord.currentCanonicalHashMatchPaths), "Placement aliases changed in review");
  invariant(JSON.stringify(record.placement.historicalHashMatchRefs) === JSON.stringify(universeRecord.historicalHashMatchRefs), "Historical references changed in review");
  invariant(Array.isArray(record.placement.variants), "Placement variants must be an array");
  exactKeys(record.comparison, [
    "timeline", "version", "stage", "fps", "rootFrames", "actionScript",
    "publishProfile", "linkage",
  ], `Review comparison ${record.canonicalPath}`);
  exactKeys(record.lineage, ["conclusion", "evidenceArtifacts"], `Review lineage ${record.canonicalPath}`);
  invariant(Array.isArray(record.lineage.evidenceArtifacts), "Lineage evidenceArtifacts must be an array");
  record.lineage.evidenceArtifacts.forEach((artifact, index) =>
    validateArtifactReference(artifact, `Lineage evidence ${record.canonicalPath}[${index}]`));
  exactKeys(record.review, ["decision", "terminal", "reviewerSubjectId", "reviewedAt", "notes"], `Review decision ${record.canonicalPath}`);
  invariant(REVIEW_DECISIONS.includes(record.review.decision), `Invalid review decision: ${record.review.decision}`);
  invariant(typeof record.review.terminal === "boolean", "Review terminal must be boolean");
  if (record.review.terminal) {
    invariant(TERMINAL_REVIEW_DECISIONS.includes(record.review.decision), "Terminal review decision is not allowed");
    invariant(typeof record.review.reviewerSubjectId === "string" && record.review.reviewerSubjectId.length > 0, "Terminal review lacks reviewer subject");
    validIsoTimestamp(record.review.reviewedAt, "Terminal review reviewedAt");
    invariant(typeof record.review.notes === "string" && record.review.notes.trim().length > 0, "Terminal review requires notes");
    invariant(record.lineage.evidenceArtifacts.length > 0, "Terminal review requires lineage evidence artifacts");
    invariant(record.lineage.conclusion !== null, "Terminal review requires a lineage conclusion");
    invariant(record.placement.conclusion !== null, "Terminal review requires a placement conclusion");
    validateArtifactReference(record.authoringAuditReceipt, `Animate authoring audit receipt ${record.canonicalPath}`);
    validateFlaMetadata(record.fla, `Review FLA metadata ${record.canonicalPath}`);
    validateStageMetadata(record.swf.stage, `Review SWF stage ${record.canonicalPath}`);
    validateSwfMetadata(record.swf, `Review SWF metadata ${record.canonicalPath}`);
    validatePlacementMetadata(record.placement, `Review placement metadata ${record.canonicalPath}`);
    validateComparisonMetadata(record.comparison, `Review comparison ${record.canonicalPath}`);
    invariant(["confirmed", "not-confirmed", "contradicted"].includes(record.lineage.conclusion), "Review lineage conclusion enum is invalid");
    if (record.review.decision === "confirmed-publication-lineage") {
      invariant(record.lineage.conclusion === "confirmed", "Confirmed lineage decision requires lineage.conclusion=confirmed");
      invariant(record.placement.conclusion === "confirmed", "Confirmed lineage decision requires confirmed placement");
      validateArtifactReference(record.publicationLineageReceipt, `Publication-lineage receipt ${record.canonicalPath}`);
      invariant(
        record.lineage.evidenceArtifacts.some((artifact) => artifact.path === record.publicationLineageReceipt.path && artifact.bytes === record.publicationLineageReceipt.bytes && artifact.sha256 === record.publicationLineageReceipt.sha256),
        "Confirmed lineage receipt must be included in lineage.evidenceArtifacts",
      );
    }
    if (record.review.decision === "metadata-consistent-lineage-unproven") {
      invariant(record.lineage.conclusion === "not-confirmed", "Metadata-consistent unproven decision requires not-confirmed lineage");
    }
    if (record.review.decision === "placement-conflict") {
      invariant(record.placement.conclusion === "conflict", "Placement-conflict decision requires placement.conclusion=conflict");
    }
    if (record.review.decision === "contradicted") {
      invariant(record.lineage.conclusion === "contradicted", "Contradicted decision requires lineage.conclusion=contradicted");
    }
    validateReviewDecisionConsistency(record);
  } else {
    invariant(record.review.decision === "unresolved", "Nonterminal review must remain unresolved");
    invariant(record.review.reviewerSubjectId === null && record.review.reviewedAt === null, "Nonterminal review cannot claim reviewer/date");
    invariant(record.review.notes === null, "Nonterminal review cannot claim review notes");
    invariant(record.publicationLineageReceipt === null, "Nonterminal review cannot claim a publication-lineage receipt");
    invariant(record.authoringAuditReceipt === null, "Nonterminal review cannot claim an authoring-audit receipt");
  }
  exactKeys(record.manualHoldReview, ["required", "holdType", "decision", "receipt"], `Manual hold ${record.canonicalPath}`);
  const holdRequired = universeRecord.currentDisposition !== "candidate-new-source-in-quarantine";
  invariant(record.manualHoldReview.required === holdRequired, "Manual hold requirement changed");
  invariant(MANUAL_HOLD_DECISIONS.includes(record.manualHoldReview.decision), "Invalid manual hold decision");
  if (!holdRequired) {
    invariant(record.manualHoldReview.holdType === null, "Ordinary record cannot have hold type");
    invariant(record.manualHoldReview.decision === "not-required", "Ordinary record cannot have manual hold decision");
    invariant(record.manualHoldReview.receipt === null, "Ordinary record cannot have manual hold receipt");
  } else {
    invariant(record.manualHoldReview.holdType === universeRecord.currentDisposition, "Manual hold type changed");
    if (requireTerminal || record.review.terminal) {
      invariant(["approved-reviewed-copy", "withheld"].includes(record.manualHoldReview.decision), "Terminal current hold lacks terminal manual decision");
      validateArtifactReference(record.manualHoldReview.receipt, `Manual hold receipt ${record.canonicalPath}`);
    } else {
      invariant(record.manualHoldReview.decision === "pending" && record.manualHoldReview.receipt === null, "Pending hold cannot claim a receipt");
    }
  }
}

export function assertReviewRecord(record, universeRecord, options = {}) {
  validateReviewRecord(record, universeRecord, options);
  return record;
}

export function pairReviewRecordPayload(record) {
  const payload = structuredClone(record);
  exactKeys(payload.manualHoldReview, ["required", "holdType", "decision", "receipt"], "Pair-review manual hold projection");
  payload.manualHoldReview.receipt = null;
  return payload;
}

export function pairReviewRecordPayloadDigest(record) {
  return sha256Text(canonicalJson(pairReviewRecordPayload(record)));
}

function manualReceiptPayload(receipt) {
  const {
    signedPayloadSha256: _signedPayloadSha256,
    signatureEnvelope: _signatureEnvelope,
    ...payload
  } = receipt;
  return payload;
}

function sameArtifactReference(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function assertManualHoldReceiptBinding(receipt, {
  universe,
  universeRecord,
  reviewLedger,
  reviewRecord,
  reviewCandidateIdentity,
  authoringReceipt,
  publicationLineageReceipt,
  ledgerReviewers,
}) {
  exactKeys(receipt, [
    "schemaVersion", "artifactType", "universe", "record", "reviewContract",
    "pairReviewRecord", "decision", "reviewer", "reviewedAt", "evidenceArtifacts",
    "signedPayloadSha256", "signatureEnvelope",
  ], `Manual hold receipt ${universeRecord.canonicalPath}`);
  invariant(receipt.schemaVersion === MANUAL_HOLD_RECEIPT_SCHEMA, "Manual receipt schema changed");
  invariant(receipt.artifactType === MANUAL_HOLD_RECEIPT_ARTIFACT_TYPE, "Manual receipt type changed");
  exactKeys(receipt.universe, ["sha256", "recordSetSha256", "sourceBoundRecordSetSha256"], "Manual receipt universe");
  invariant(
    receipt.universe.sha256 === universe.identity.sha256
      && receipt.universe.recordSetSha256 === universe.value.digests.recordSetSha256
      && receipt.universe.sourceBoundRecordSetSha256 === universe.value.digests.sourceBoundRecordSetSha256,
    "Manual receipt universe binding changed",
  );
  exactKeys(receipt.record, ["recordId", "canonicalPath", "sourceBindingSha256", "currentDisposition"], "Manual receipt record");
  invariant(
    receipt.record.recordId === universeRecord.recordId
      && receipt.record.canonicalPath === universeRecord.canonicalPath
      && receipt.record.sourceBindingSha256 === universeRecord.sourceBindingSha256
      && receipt.record.currentDisposition === universeRecord.currentDisposition,
    "Manual receipt record binding changed",
  );
  exactKeys(receipt.reviewContract, [
    "reviewLedgerSchemaVersion", "reviewLedgerArtifactType", "reviewCandidate",
    "decisionContractSha256",
  ], "Manual receipt review contract");
  invariant(
    receipt.reviewContract.reviewLedgerSchemaVersion === reviewLedger.schemaVersion
      && receipt.reviewContract.reviewLedgerArtifactType === reviewLedger.artifactType,
    "Manual receipt review-ledger contract identity changed",
  );
  validateArtifactReference(receipt.reviewContract.reviewCandidate, "Manual receipt review candidate");
  invariant(sameArtifactReference(receipt.reviewContract.reviewCandidate, reviewCandidateIdentity), "Manual receipt review-candidate identity changed");
  invariant(
    receipt.reviewContract.decisionContractSha256 === sha256Text(canonicalJson(reviewLedger.decisionContract)),
    "Manual receipt decision-contract digest changed",
  );
  exactKeys(receipt.pairReviewRecord, [
    "payloadSha256", "terminalDecision", "reviewedAt", "reviewerSubjectId",
    "sourceBindingSha256", "authoringAuditReceipt", "publicationLineageReceipt",
    "lineageEvidenceArtifacts",
  ], "Manual receipt pair-review record binding");
  invariant(receipt.pairReviewRecord.payloadSha256 === pairReviewRecordPayloadDigest(reviewRecord), "Manual receipt pair-review record payload digest changed");
  invariant(
    receipt.pairReviewRecord.terminalDecision === reviewRecord.review.decision
      && receipt.pairReviewRecord.reviewedAt === reviewRecord.review.reviewedAt
      && receipt.pairReviewRecord.reviewerSubjectId === reviewRecord.review.reviewerSubjectId
      && receipt.pairReviewRecord.sourceBindingSha256 === reviewRecord.sourceBindingSha256,
    "Manual receipt pair-review decision/time/reviewer/source binding changed",
  );
  invariant(sameArtifactReference(receipt.pairReviewRecord.authoringAuditReceipt, reviewRecord.authoringAuditReceipt), "Manual receipt authoring-audit identity changed");
  invariant(sameArtifactReference(receipt.pairReviewRecord.publicationLineageReceipt, reviewRecord.publicationLineageReceipt), "Manual receipt publication-lineage identity changed");
  invariant(JSON.stringify(receipt.pairReviewRecord.lineageEvidenceArtifacts) === JSON.stringify(reviewRecord.lineage.evidenceArtifacts), "Manual receipt lineage evidence identities changed");
  invariant(["approved-reviewed-copy", "withheld"].includes(receipt.decision), "Manual receipt decision is not terminal");
  invariant(receipt.decision === reviewRecord.manualHoldReview.decision, "Manual hold receipt decision differs from pair-review record");
  validateReviewer(receipt.reviewer, "Manual receipt reviewer");
  const expectedReviewer = ledgerReviewers.get(receipt.reviewer.subjectId);
  invariant(expectedReviewer && JSON.stringify(expectedReviewer) === JSON.stringify(receipt.reviewer), "Manual receipt reviewer is absent from or differs from ledger attestation");
  invariant(receipt.reviewer.subjectId === reviewRecord.review.reviewerSubjectId, "Manual receipt reviewer differs from pair-review reviewer");
  const reviewedAt = Date.parse(validIsoTimestamp(receipt.reviewedAt, "Manual receipt reviewedAt"));
  const evidenceTimes = [
    [Date.parse(validIsoTimestamp(reviewRecord.review.reviewedAt, "Pair-review reviewedAt")), "pair review"],
    [Date.parse(validIsoTimestamp(authoringReceipt.reviewedAt, "Authoring receipt reviewedAt")), "authoring receipt review"],
    [Date.parse(validIsoTimestamp(authoringReceipt.processSession.endedAt, "Authoring process endedAt")), "authoring process end"],
  ];
  if (publicationLineageReceipt) {
    evidenceTimes.push([
      Date.parse(validIsoTimestamp(publicationLineageReceipt.reviewedAt, "Publication-lineage reviewedAt")),
      "publication-lineage review",
    ]);
  }
  for (const [evidenceAt, label] of evidenceTimes) {
    invariant(reviewedAt >= evidenceAt, `Manual receipt reviewedAt predates ${label}`);
  }
  invariant(Array.isArray(receipt.evidenceArtifacts) && receipt.evidenceArtifacts.length > 0, "Manual receipt requires evidence artifacts");
  for (const [index, artifact] of receipt.evidenceArtifacts.entries()) {
    validateArtifactReference(artifact, `Manual receipt evidence[${index}]`);
  }
  const payloadSha256 = sha256Text(canonicalJson(manualReceiptPayload(receipt)));
  invariant(receipt.signedPayloadSha256 === payloadSha256, "Manual receipt signed payload digest changed");
  exactKeys(receipt.signatureEnvelope, ["reviewerSubjectId", "signedPayloadSha256", "artifact"], "Manual receipt signature envelope");
  invariant(receipt.signatureEnvelope.reviewerSubjectId === receipt.reviewer.subjectId, "Manual receipt signature reviewer changed");
  invariant(receipt.signatureEnvelope.signedPayloadSha256 === payloadSha256, "Manual receipt signature payload changed");
  validateArtifactReference(receipt.signatureEnvelope.artifact, "Manual receipt signature artifact");
  return receipt;
}

async function validateManualHoldReceipt(reference, context) {
  const {root, universeRecord} = context;
  const observed = await verifyArtifactReference(reference, {
    root,
    label: `Manual hold receipt ${universeRecord.canonicalPath}`,
    immutable: true,
  });
  let receipt;
  try {
    receipt = JSON.parse(observed.bytes);
  } catch (error) {
    throw new Error(`Manual hold receipt is not JSON for ${universeRecord.canonicalPath}: ${error.message}`);
  }
  assertManualHoldReceiptBinding(receipt, context);
  for (const [index, artifact] of receipt.evidenceArtifacts.entries()) {
    await verifyArtifactReference(artifact, {root, label: `Manual receipt evidence[${index}]`, immutable: true});
  }
  await verifyDetachedEd25519SignatureArtifact(receipt.signatureEnvelope.artifact, {
    root,
    label: "Manual receipt signature artifact",
    reviewer: receipt.reviewer,
    payloadSha256: receipt.signedPayloadSha256,
    minimumSignedAt: receipt.reviewedAt,
  });
  return receipt;
}

function reviewFactsForAuthoringReceipt(record) {
  return {
    fla: record.fla,
    swf: record.swf,
    placement: record.placement,
    comparison: record.comparison,
  };
}

function authoringReceiptPayload(receipt) {
  const {
    signedPayloadSha256: _signedPayloadSha256,
    signatureEnvelope: _signatureEnvelope,
    ...payload
  } = receipt;
  return payload;
}

export function authoringAuditOutcome(receipt, reviewRecord) {
  const failedAttempt = receipt.schemaVersion === FAILED_AUTHORING_AUDIT_SCHEMA;
  invariant(
    (receipt.schemaVersion === AUTHORING_AUDIT_SCHEMA && receipt.artifactType === AUTHORING_AUDIT_ARTIFACT_TYPE)
      || (failedAttempt && receipt.artifactType === FAILED_AUTHORING_AUDIT_ARTIFACT_TYPE),
    "Animate authoring audit receipt schema/type changed",
  );
  invariant(!failedAttempt || reviewRecord.review.decision === "unresolved", "A failed authoring-audit attempt can support only an explicit terminal unresolved decision");
  return failedAttempt ? "failed-authoring-attempt" : "completed-read-only-authoring-audit";
}

export function assertAuthoringWorkingCopyPath(relativePath, recordId) {
  portableRelative(relativePath, "Authoring working-copy path");
  invariant(typeof recordId === "string" && recordId.length > 0 && !recordId.includes("/"), "Authoring working-copy recordId is invalid");
  const expectedPrefix = `${AUTHORING_WORKING_COPY_PREFIX}/${recordId}/`;
  invariant(relativePath.startsWith(expectedPrefix) && relativePath.length > expectedPrefix.length, `Authoring working copy must be inside ${expectedPrefix}`);
  return relativePath;
}

export function assertFailedAuthoringAuditFailure(failure) {
  exactKeys(failure, ["stage", "code", "message", "evidenceArtifacts"], "Failed authoring-audit attempt");
  for (const field of ["stage", "code", "message"]) {
    invariant(typeof failure[field] === "string" && failure[field].trim().length > 0, `Failed authoring-audit ${field} is invalid`);
  }
  invariant(Array.isArray(failure.evidenceArtifacts) && failure.evidenceArtifacts.length > 0, "Failed authoring-audit attempt requires immutable failure evidence");
  for (const [index, artifact] of failure.evidenceArtifacts.entries()) {
    validateArtifactReference(artifact, `Failed authoring-audit evidence[${index}]`);
  }
  return failure;
}

export function assertAuthoringSessionContract(processSession, operatorInteractions, {failedAttempt = false} = {}) {
  exactKeys(processSession, ["sessionId", "freshSession", "tool", "version", "startedAt", "endedAt"], "Authoring receipt process session");
  invariant(typeof processSession.sessionId === "string" && processSession.sessionId.length > 0, "Authoring audit lacks process session ID");
  invariant(processSession.freshSession === true, "Animate authoring audit did not use a fresh process session");
  invariant(processSession.tool === "Adobe Animate" && typeof processSession.version === "string" && processSession.version.length > 0, "Authoring audit must record Adobe Animate and its exact version");
  const startedAt = Date.parse(validIsoTimestamp(processSession.startedAt, "Authoring process startedAt"));
  const endedAt = Date.parse(validIsoTimestamp(processSession.endedAt, "Authoring process endedAt"));
  invariant(endedAt >= startedAt, "Authoring process ended before it started");
  exactKeys(operatorInteractions, ["legacyConversionWarning", "otherInteractions"], "Authoring operator interactions");
  exactKeys(operatorInteractions.legacyConversionWarning, ["present", "confirmed"], "Authoring legacy conversion warning interaction");
  const warning = operatorInteractions.legacyConversionWarning;
  invariant(typeof warning.present === "boolean" && typeof warning.confirmed === "boolean", "Authoring legacy conversion warning values must be boolean");
  if (failedAttempt) {
    invariant(!warning.confirmed || warning.present, "A failed authoring attempt cannot confirm an absent legacy conversion warning");
  } else {
    invariant(warning.present === true && warning.confirmed === true, "Authoring audit must record the explicit legacy conversion warning confirmation");
  }
  invariant(Array.isArray(operatorInteractions.otherInteractions) && operatorInteractions.otherInteractions.length === 0, "Authoring audit recorded an interaction/edit beyond legacy warning confirmation");
  return {sessionId: processSession.sessionId, startedAt, endedAt};
}

export function assertUniqueNonOverlappingAuthoringSessions(sessions) {
  invariant(new Set(sessions.map((session) => session.sessionId)).size === sessions.length, "Animate authoring audits must use one unique fresh sessionId per terminal pair");
  const sorted = [...sessions].sort((left, right) => left.startedAt - right.startedAt || compareText(left.sessionId, right.sessionId));
  for (let index = 1; index < sorted.length; index += 1) {
    invariant(sorted[index].startedAt >= sorted[index - 1].endedAt, "Animate authoring process sessions overlap; audits must run one process at a time");
  }
  return sorted;
}

export async function validateAuthoringAuditReceipt(reference, {
  root,
  universe,
  universeRecord,
  reviewRecord,
  ledgerReviewers,
}) {
  const observed = await verifyArtifactReference(reference, {
    root,
    label: `Animate authoring audit receipt ${universeRecord.canonicalPath}`,
    immutable: true,
  });
  let receipt;
  try {
    receipt = JSON.parse(observed.bytes);
  } catch (error) {
    throw new Error(`Animate authoring audit receipt is not JSON for ${universeRecord.canonicalPath}: ${error.message}`);
  }
  const outcome = authoringAuditOutcome(receipt, reviewRecord);
  const failedAttempt = outcome === "failed-authoring-attempt";
  exactKeys(receipt, [
    "schemaVersion", "artifactType", "universe", "record", "fla",
    "sourceArtifact", "workingCopy", "processSession", "operatorInteractions",
    "before", "after", "actions", "observedReviewFactsSha256", "reviewer", "reviewedAt",
    ...(failedAttempt ? ["failure"] : []),
    "signedPayloadSha256", "signatureEnvelope",
  ], `Animate authoring audit receipt ${universeRecord.canonicalPath}`);
  exactKeys(receipt.universe, ["sha256", "recordSetSha256", "sourceBoundRecordSetSha256"], "Authoring receipt universe");
  invariant(
    receipt.universe.sha256 === universe.identity.sha256
      && receipt.universe.recordSetSha256 === universe.value.digests.recordSetSha256
      && receipt.universe.sourceBoundRecordSetSha256 === universe.value.digests.sourceBoundRecordSetSha256,
    "Authoring receipt universe binding changed",
  );
  exactKeys(receipt.record, ["recordId", "canonicalPath", "sourceBindingSha256"], "Authoring receipt record");
  invariant(receipt.record.recordId === universeRecord.recordId && receipt.record.canonicalPath === universeRecord.canonicalPath && receipt.record.sourceBindingSha256 === universeRecord.sourceBindingSha256, "Authoring receipt record binding changed");
  validateIdentity(receipt.fla, identityForReview(universeRecord, "fla"), "Authoring receipt FLA identity");
  exactKeys(receipt.sourceArtifact, ["rootRef", "relativePath", "bytes", "sha256", "node"], "Authoring receipt source artifact");
  exactKeys(receipt.sourceArtifact.node, ["dev", "ino"], "Authoring receipt source node");
  const candidateFla = universeRecord.extension === "fla";
  const expectedRootRef = candidateFla ? SOURCE_ROOT_REF : "project-root";
  const expectedRelativePath = candidateFla
    ? universeRecord.sourceBinding.quarantineRelativePath
    : `source-assets/flash/HELP MATH_ORIGINAL FILES/${universeRecord.existingCounterpart.canonicalPath}`;
  invariant(receipt.sourceArtifact.rootRef === expectedRootRef && receipt.sourceArtifact.relativePath === expectedRelativePath, "Authoring receipt source location changed");
  invariant(receipt.sourceArtifact.bytes === receipt.fla.bytes && receipt.sourceArtifact.sha256 === receipt.fla.sha256, "Authoring receipt source identity differs from FLA identity");
  const sourceRoot = candidateFla
    ? universe.value.sourceRootBindings[SOURCE_ROOT_REF].absolutePath
    : root;
  const {absolutePath: sourcePath} = await secureResolveExistingRegular(sourceRoot, expectedRelativePath, "Authoring audit source FLA");
  const sourceObserved = await readStableFile(sourcePath, "Authoring audit source FLA");
  invariant(sourceObserved.byteCount === receipt.fla.bytes && sourceObserved.sha256 === receipt.fla.sha256, "Authoring audit source FLA bytes changed");
  invariant(JSON.stringify(receipt.sourceArtifact.node) === JSON.stringify(sourceObserved.identity), "Authoring audit source inode changed");
  exactKeys(receipt.workingCopy, ["artifact", "node", "mode", "nlink", "separateInode"], "Authoring receipt working copy");
  validateArtifactReference(receipt.workingCopy.artifact, "Authoring receipt working-copy artifact");
  assertAuthoringWorkingCopyPath(receipt.workingCopy.artifact.path, universeRecord.recordId);
  exactKeys(receipt.workingCopy.node, ["dev", "ino"], "Authoring receipt working-copy node");
  invariant(receipt.workingCopy.artifact.bytes === receipt.fla.bytes && receipt.workingCopy.artifact.sha256 === receipt.fla.sha256, "Authoring working copy differs from FLA identity");
  const {absolutePath: workingPath} = await secureResolveExistingRegular(root, receipt.workingCopy.artifact.path, "Authoring audit working copy");
  const workingObserved = await readStableFile(workingPath, "Authoring audit working copy", {immutable: true});
  invariant(workingObserved.byteCount === receipt.fla.bytes && workingObserved.sha256 === receipt.fla.sha256, "Authoring audit working-copy bytes changed");
  invariant(JSON.stringify(receipt.workingCopy.node) === JSON.stringify(workingObserved.identity), "Authoring audit working-copy inode changed");
  invariant(receipt.workingCopy.mode === "0444" && receipt.workingCopy.nlink === 1 && receipt.workingCopy.separateInode === true, "Authoring audit working-copy isolation contract changed");
  invariant(!sameNode(receipt.sourceArtifact.node, receipt.workingCopy.node), "Authoring audit working copy aliases source inode");
  const session = assertAuthoringSessionContract(
    receipt.processSession,
    receipt.operatorInteractions,
    {failedAttempt},
  );
  for (const [label, value] of [["before", receipt.before], ["after", receipt.after]]) {
    exactKeys(value, ["bytes", "sha256"], `Authoring receipt ${label}`);
    invariant(value.bytes === receipt.fla.bytes && value.sha256 === receipt.fla.sha256, `Authoring receipt ${label} identity differs from FLA`);
  }
  exactKeys(receipt.actions, ["save", "publish", "repair", "normalize"], "Authoring receipt actions");
  invariant(Object.values(receipt.actions).every((value) => value === false), "Animate audit performed a prohibited save/publish/repair/normalize action");
  if (failedAttempt) {
    assertFailedAuthoringAuditFailure(receipt.failure);
    for (const [index, artifact] of receipt.failure.evidenceArtifacts.entries()) {
      await verifyArtifactReference(artifact, {root, label: `Failed authoring-audit evidence[${index}]`, immutable: true});
    }
  }
  invariant(receipt.observedReviewFactsSha256 === sha256Text(canonicalJson(reviewFactsForAuthoringReceipt(reviewRecord))), "Authoring receipt observed review facts changed");
  validateReviewer(receipt.reviewer, "Authoring receipt reviewer");
  const ledgerReviewer = ledgerReviewers.get(receipt.reviewer.subjectId);
  invariant(ledgerReviewer && JSON.stringify(ledgerReviewer) === JSON.stringify(receipt.reviewer) && receipt.reviewer.subjectId === reviewRecord.review.reviewerSubjectId, "Authoring receipt reviewer identity/key is not the ledger record reviewer");
  const authoringReviewedAt = Date.parse(validIsoTimestamp(receipt.reviewedAt, "Authoring receipt reviewedAt"));
  invariant(authoringReviewedAt >= session.endedAt, "Authoring receipt reviewedAt predates the authoring process end");
  const payloadSha256 = sha256Text(canonicalJson(authoringReceiptPayload(receipt)));
  invariant(receipt.signedPayloadSha256 === payloadSha256, "Authoring receipt signed payload digest changed");
  exactKeys(receipt.signatureEnvelope, ["reviewerSubjectId", "signedPayloadSha256", "artifact"], "Authoring receipt signature envelope");
  invariant(receipt.signatureEnvelope.reviewerSubjectId === receipt.reviewer.subjectId && receipt.signatureEnvelope.signedPayloadSha256 === payloadSha256, "Authoring receipt signature envelope binding changed");
  await verifyDetachedEd25519SignatureArtifact(receipt.signatureEnvelope.artifact, {
    root,
    label: "Authoring receipt signature artifact",
    reviewer: receipt.reviewer,
    payloadSha256,
    minimumSignedAt: receipt.reviewedAt,
  });
  return {
    ...receipt,
    validationOutcome: outcome,
  };
}

function publicationLineageReceiptPayload(receipt) {
  const {
    signedPayloadSha256: _signedPayloadSha256,
    signatureEnvelope: _signatureEnvelope,
    ...payload
  } = receipt;
  return payload;
}

async function validatePublicationLineageReceipt(reference, {
  root,
  universe,
  universeRecord,
  reviewRecord,
  ledgerReviewers,
}) {
  const observed = await verifyArtifactReference(reference, {
    root,
    label: `Publication-lineage receipt ${universeRecord.canonicalPath}`,
    immutable: true,
  });
  let receipt;
  try {
    receipt = JSON.parse(observed.bytes);
  } catch (error) {
    throw new Error(`Publication-lineage receipt is not JSON for ${universeRecord.canonicalPath}: ${error.message}`);
  }
  exactKeys(receipt, [
    "schemaVersion", "artifactType", "universe", "record",
    "normalizedFullRelativeStem", "fla", "swf", "basis",
    "underlyingEvidenceArtifacts", "reviewer", "reviewedAt",
    "signedPayloadSha256", "signatureEnvelope",
  ], `Publication-lineage receipt ${universeRecord.canonicalPath}`);
  invariant(receipt.schemaVersion === "help-math-fla-swf-counterpart-publication-lineage-receipt/v1", "Publication-lineage receipt schema changed");
  invariant(receipt.artifactType === "help-math-fla-swf-counterpart-publication-lineage-receipt", "Publication-lineage receipt type changed");
  exactKeys(receipt.universe, ["sha256", "recordSetSha256", "sourceBoundRecordSetSha256"], "Publication-lineage receipt universe");
  invariant(receipt.universe.sha256 === universe.identity.sha256 && receipt.universe.recordSetSha256 === universe.value.digests.recordSetSha256 && receipt.universe.sourceBoundRecordSetSha256 === universe.value.digests.sourceBoundRecordSetSha256, "Publication-lineage receipt universe binding changed");
  exactKeys(receipt.record, ["recordId", "canonicalPath", "sourceBindingSha256"], "Publication-lineage receipt record");
  invariant(receipt.record.recordId === universeRecord.recordId && receipt.record.canonicalPath === universeRecord.canonicalPath && receipt.record.sourceBindingSha256 === universeRecord.sourceBindingSha256, "Publication-lineage receipt record binding changed");
  invariant(receipt.normalizedFullRelativeStem === universeRecord.normalizedFullRelativeStem, "Publication-lineage normalized stem changed");
  validateIdentity(receipt.fla, identityForReview(universeRecord, "fla"), "Publication-lineage FLA identity");
  validateIdentity(receipt.swf, identityForReview(universeRecord, "swf"), "Publication-lineage SWF identity");
  exactKeys(receipt.basis, ["kind", "statement"], "Publication-lineage basis");
  invariant([
    "historical-publish-manifest",
    "authorized-test-movie",
    "adobe-animate-publish-profile-and-shipped-swf-byte-match",
    "equivalent-reviewed-primary-evidence",
  ].includes(receipt.basis.kind), "Publication-lineage basis is metadata-only or unsupported");
  invariant(typeof receipt.basis.statement === "string" && receipt.basis.statement.trim().length > 0, "Publication-lineage basis requires a substantive statement");
  invariant(!/same[ -]?stem|same zip|metadata only/iu.test(receipt.basis.statement), "Publication-lineage statement relies on prohibited metadata-only inference");
  invariant(Array.isArray(receipt.underlyingEvidenceArtifacts) && receipt.underlyingEvidenceArtifacts.length > 0, "Publication-lineage receipt requires underlying immutable evidence");
  const evidencePaths = new Set();
  for (const [index, artifact] of receipt.underlyingEvidenceArtifacts.entries()) {
    validateArtifactReference(artifact, `Publication-lineage underlying evidence[${index}]`);
    invariant(!evidencePaths.has(artifact.path), "Publication-lineage underlying evidence paths must be distinct");
    evidencePaths.add(artifact.path);
    await verifyArtifactReference(artifact, {root, label: `Publication-lineage underlying evidence[${index}]`, immutable: true});
  }
  validateReviewer(receipt.reviewer, "Publication-lineage reviewer");
  const ledgerReviewer = ledgerReviewers.get(receipt.reviewer.subjectId);
  invariant(ledgerReviewer && JSON.stringify(ledgerReviewer) === JSON.stringify(receipt.reviewer) && receipt.reviewer.subjectId === reviewRecord.review.reviewerSubjectId, "Publication-lineage receipt reviewer identity/key differs from terminal review");
  validIsoTimestamp(receipt.reviewedAt, "Publication-lineage reviewedAt");
  const payloadSha256 = sha256Text(canonicalJson(publicationLineageReceiptPayload(receipt)));
  invariant(receipt.signedPayloadSha256 === payloadSha256, "Publication-lineage signed payload digest changed");
  exactKeys(receipt.signatureEnvelope, ["reviewerSubjectId", "signedPayloadSha256", "artifact"], "Publication-lineage signature envelope");
  invariant(receipt.signatureEnvelope.reviewerSubjectId === receipt.reviewer.subjectId && receipt.signatureEnvelope.signedPayloadSha256 === payloadSha256, "Publication-lineage signature envelope binding changed");
  await verifyDetachedEd25519SignatureArtifact(receipt.signatureEnvelope.artifact, {
    root,
    label: "Publication-lineage signature artifact",
    reviewer: receipt.reviewer,
    payloadSha256,
    minimumSignedAt: receipt.reviewedAt,
  });
  return receipt;
}

export async function validateReviewLedger(ledger, {
  universe,
  universeIdentity,
  root = PROJECT_ROOT,
  requireTerminal = false,
  verifyExternalArtifacts = false,
  trustedReviewerRegistry = null,
} = {}) {
  assertUniverse(universe);
  invariant(universeIdentity && SHA256_PATTERN.test(universeIdentity.sha256), "Review validation requires universe identity");
  let resolvedTrustedReviewerRegistry = trustedReviewerRegistry;
  exactKeys(ledger, [
    "schemaVersion", "artifactType", "ledgerDate", "status", "mode", "universe",
    "decisionContract", "summary", "records", "attestation", "evidenceBoundary",
  ], "Review ledger");
  invariant(ledger.schemaVersion === REVIEW_SCHEMA && ledger.artifactType === REVIEW_ARTIFACT_TYPE, "Review ledger schema/type changed");
  exactKeys(ledger.decisionContract, [
    "allowed", "terminalAllowed", "onlyPromotionEligible",
    "metadataConsistentLineageUnprovenEffect", "unresolvedEffect",
    "currentHoldCount", "currentHoldsRequireSeparateManualReceipts",
    "automaticApprovalsAllowed",
  ], "Review decision contract");
  invariant(JSON.stringify(ledger.decisionContract.allowed) === JSON.stringify(REVIEW_DECISIONS), "Review decision enum changed");
  invariant(JSON.stringify(ledger.decisionContract.terminalAllowed) === JSON.stringify(TERMINAL_REVIEW_DECISIONS), "Terminal review decision enum changed");
  invariant(ledger.decisionContract.onlyPromotionEligible === "confirmed-publication-lineage", "Review eligibility decision changed");
  invariant(ledger.decisionContract.currentHoldCount === 71 && ledger.decisionContract.currentHoldsRequireSeparateManualReceipts === true, "Manual hold contract changed");
  invariant(ledger.universe.sha256 === universeIdentity.sha256 && ledger.universe.bytes === universeIdentity.bytes, "Review ledger universe artifact binding changed");
  invariant(ledger.universe.recordSetSha256 === universe.digests.recordSetSha256 && ledger.universe.sourceBoundRecordSetSha256 === universe.digests.sourceBoundRecordSetSha256, "Review ledger universe record binding changed");
  invariant(Array.isArray(ledger.records) && ledger.records.length === universe.records.length, "Review ledger must contain exactly 620 records");
  const universeById = new Map(universe.records.map((record) => [record.recordId, record]));
  const seen = new Set();
  for (const record of ledger.records) {
    invariant(!seen.has(record.recordId), `Duplicate review record: ${record.recordId}`);
    seen.add(record.recordId);
    const universeRecord = universeById.get(record.recordId);
    invariant(universeRecord, `Review record is outside frozen universe: ${record.recordId}`);
    validateReviewRecord(record, universeRecord, {requireTerminal});
  }
  invariant(seen.size === universe.records.length, "Review ledger does not cover all universe records");
  const payloadSha256 = reviewPayloadDigest(ledger);
  exactKeys(ledger.attestation, ["state", "reviewPayloadSha256", "reviewers", "signatureEnvelopes"], "Review attestation");
  invariant(Array.isArray(ledger.attestation.reviewers) && Array.isArray(ledger.attestation.signatureEnvelopes), "Review attestation arrays are invalid");
  const reviewers = new Map();
  for (const reviewer of ledger.attestation.reviewers) {
    validateReviewer(reviewer, "Review attestation reviewer");
    invariant(!reviewers.has(reviewer.subjectId), "Duplicate review attestation subjectId");
    reviewers.set(reviewer.subjectId, reviewer);
  }
  invariant(new Set([...reviewers.values()].map((reviewer) => reviewer.publicKeySpkiSha256)).size === reviewers.size, "Review attestation reviewers must use distinct explicit Ed25519 public-key fingerprints");
  const terminalRecords = ledger.records.filter((record) => record.review.terminal);
  const currentHolds = ledger.records.filter((record) => record.manualHoldReview.required);
  const receiptPaths = currentHolds
    .map((record) => record.manualHoldReview.receipt?.path)
    .filter(Boolean);
  invariant(new Set(receiptPaths).size === receiptPaths.length, "Manual hold receipts must use distinct artifact paths");
  if (ledger.attestation.state === "unsigned-machine-preparation") {
    invariant(!requireTerminal, "Unsigned review ledger cannot satisfy terminal review gate");
    invariant(ledger.status === "unsigned-machine-preparation", "Unsigned ledger status changed");
    invariant(terminalRecords.length === 0 && reviewers.size === 0 && ledger.attestation.signatureEnvelopes.length === 0, "Unsigned machine ledger contains reviewer authority");
    invariant(ledger.attestation.reviewPayloadSha256 === null, "Unsigned machine ledger cannot claim a signed payload");
  } else {
    resolvedTrustedReviewerRegistry ??= await loadTrustedReviewerRegistry({root, universeIdentity});
    invariant(ledger.attestation.state === "signed-complete", "Review attestation state must be unsigned-machine-preparation or signed-complete");
    invariant(ledger.status === "signed-complete", "Signed review ledger status must be signed-complete");
    invariant(ledger.attestation.reviewPayloadSha256 === payloadSha256, "Review attestation payload digest changed");
    invariant(reviewers.size > 0, "Signed review ledger requires reviewers");
    for (const reviewer of reviewers.values()) assertReviewerAuthorizedByRegistry(reviewer, resolvedTrustedReviewerRegistry, "Signed review-ledger reviewer");
    invariant(ledger.attestation.signatureEnvelopes.length === reviewers.size, "Signed review ledger requires one signature envelope per reviewer");
    const envelopeSubjects = new Set();
    const envelopeArtifactPaths = new Set();
    const latestTerminalReviewAt = terminalRecords.reduce(
      (latest, record) => Math.max(latest, Date.parse(validIsoTimestamp(record.review.reviewedAt, "Terminal review reviewedAt"))),
      Date.parse(`${ledger.ledgerDate}T00:00:00.000Z`),
    );
    for (const envelope of ledger.attestation.signatureEnvelopes) {
      exactKeys(envelope, ["reviewerSubjectId", "signedPayloadSha256", "artifact"], "Review signature envelope");
      invariant(reviewers.has(envelope.reviewerSubjectId), "Review signature envelope has unknown reviewer");
      invariant(!envelopeSubjects.has(envelope.reviewerSubjectId), "Duplicate review signature envelope");
      envelopeSubjects.add(envelope.reviewerSubjectId);
      invariant(envelope.signedPayloadSha256 === payloadSha256, "Review signature envelope payload changed");
      validateArtifactReference(envelope.artifact, "Review signature artifact");
      invariant(!envelopeArtifactPaths.has(envelope.artifact.path), "Review signature artifact paths must be distinct");
      envelopeArtifactPaths.add(envelope.artifact.path);
      if (verifyExternalArtifacts) {
        await verifyDetachedEd25519SignatureArtifact(envelope.artifact, {
          root,
          label: `Review signature artifact ${envelope.reviewerSubjectId}`,
          reviewer: reviewers.get(envelope.reviewerSubjectId),
          payloadSha256,
          minimumSignedAt: new Date(latestTerminalReviewAt).toISOString(),
        });
      }
    }
    for (const record of terminalRecords) invariant(reviewers.has(record.review.reviewerSubjectId), `Terminal review references unknown reviewer: ${record.canonicalPath}`);
  }
  if (requireTerminal) {
    invariant(terminalRecords.length === universe.records.length, "Executable plan requires all 620 records to be explicitly terminal");
    invariant(currentHolds.length === 71, "Executable plan requires exactly 71 current holds");
    invariant(receiptPaths.length === 71, "Executable plan requires 71 distinct manual hold receipts");
  }
  if (verifyExternalArtifacts && ledger.attestation.state === "signed-complete") {
    const authoringSessions = [];
    const authoringReceiptsByRecordId = new Map();
    const publicationReceiptsByRecordId = new Map();
    for (const record of terminalRecords) {
      for (const [index, artifact] of record.lineage.evidenceArtifacts.entries()) {
        await verifyArtifactReference(artifact, {root, label: `Lineage evidence ${record.canonicalPath}[${index}]`, immutable: true});
      }
      const authoringReceipt = await validateAuthoringAuditReceipt(record.authoringAuditReceipt, {
        root,
        universe: {value: universe, identity: universeIdentity},
        universeRecord: universeById.get(record.recordId),
        reviewRecord: record,
        ledgerReviewers: reviewers,
      });
      authoringReceiptsByRecordId.set(record.recordId, authoringReceipt);
      invariant(
        Date.parse(record.review.reviewedAt) >= Date.parse(authoringReceipt.reviewedAt),
        `Pair-review reviewedAt predates authoring evidence: ${record.canonicalPath}`,
      );
      authoringSessions.push({
        recordId: record.recordId,
        sessionId: authoringReceipt.processSession.sessionId,
        startedAt: Date.parse(authoringReceipt.processSession.startedAt),
        endedAt: Date.parse(authoringReceipt.processSession.endedAt),
      });
      if (record.review.decision === "confirmed-publication-lineage") {
        const publicationReceipt = await validatePublicationLineageReceipt(record.publicationLineageReceipt, {
          root,
          universe: {value: universe, identity: universeIdentity},
          universeRecord: universeById.get(record.recordId),
          reviewRecord: record,
          ledgerReviewers: reviewers,
        });
        publicationReceiptsByRecordId.set(record.recordId, publicationReceipt);
        invariant(
          Date.parse(record.review.reviewedAt) >= Date.parse(publicationReceipt.reviewedAt),
          `Pair-review reviewedAt predates publication-lineage evidence: ${record.canonicalPath}`,
        );
      }
    }
    assertUniqueNonOverlappingAuthoringSessions(authoringSessions);
    const universeContext = {value: universe, identity: universeIdentity};
    const reviewCandidate = await readImmutableJsonArtifact(root, UNSIGNED_REVIEW_RELATIVE_PATH, "Frozen unsigned review candidate");
    const expectedReviewCandidate = prepareUnsignedReviewLedger(universe, {
      universePath: universeIdentity.path ?? UNIVERSE_RELATIVE_PATH,
      universeBytes: universeIdentity.bytes,
      universeSha256: universeIdentity.sha256,
    });
    invariant(canonicalJson(reviewCandidate.value) === canonicalJson(expectedReviewCandidate), "Frozen unsigned review candidate differs from deterministic review contract");
    for (const record of currentHolds) {
      const receipt = await validateManualHoldReceipt(record.manualHoldReview.receipt, {
        root,
        universe: universeContext,
        universeRecord: universeById.get(record.recordId),
        reviewLedger: ledger,
        reviewRecord: record,
        reviewCandidateIdentity: reviewCandidate.identity,
        authoringReceipt: authoringReceiptsByRecordId.get(record.recordId),
        publicationLineageReceipt: publicationReceiptsByRecordId.get(record.recordId) ?? null,
        ledgerReviewers: reviewers,
      });
      invariant(receipt.decision === record.manualHoldReview.decision, `Manual hold receipt decision differs from ledger: ${record.canonicalPath}`);
    }
  }
  const derivedSummary = {
    records: ledger.records.length,
    terminalReviews: terminalRecords.length,
    confirmedPublicationLineage: ledger.records.filter((record) => record.review.decision === "confirmed-publication-lineage" && record.review.terminal).length,
    unresolved: ledger.records.filter((record) => record.review.decision === "unresolved").length,
    currentHolds: currentHolds.length,
    completedManualHoldReceipts: receiptPaths.length,
    automaticApprovals: 0,
  };
  invariant(JSON.stringify(ledger.summary) === JSON.stringify(derivedSummary), "Review ledger summary is not derived from records");
  invariant(ledger.decisionContract.automaticApprovalsAllowed === false && derivedSummary.automaticApprovals === 0, "Review ledger permits automatic approval");
  return {
    status: ledger.attestation.state,
    terminal: terminalRecords.length === universe.records.length && ledger.attestation.state === "signed-complete",
    payloadSha256,
    summary: derivedSummary,
    reviewerSubjects: [...reviewers.keys()].sort(compareText),
    trustedReviewerRegistry: ledger.attestation.state === "signed-complete"
      ? resolvedTrustedReviewerRegistry.identity
      : null,
  };
}

export const assertReviewLedger = validateReviewLedger;

function artifactIdentity(value, relativePath) {
  const bytes = Buffer.from(canonicalJson(value), "utf8");
  return {
    path: portableRelative(relativePath, "Artifact identity path"),
    bytes: bytes.length,
    sha256: sha256Bytes(bytes),
  };
}

async function readImmutableJsonArtifact(root, relativePath, label) {
  const relative = portableRelative(relativePath, `${label} path`);
  const {absolutePath} = await secureResolveExistingRegular(root, relative, label);
  const observed = await readStableFile(absolutePath, label, {immutable: true});
  let value;
  try {
    value = JSON.parse(observed.bytes);
  } catch (error) {
    throw new Error(`${label} is not valid JSON: ${error.message}`);
  }
  return {
    value,
    identity: {path: relative, bytes: observed.byteCount, sha256: observed.sha256},
  };
}

function quiescenceRecordProjection(record, label) {
  exactKeys(record, ["path", "bytes", "sha256", "dev", "ino", "mode", "mtimeNs"], label);
  portableRelative(record.path, `${label}.path`);
  invariant(Number.isSafeInteger(record.bytes) && record.bytes >= 0, `${label}.bytes is invalid`);
  invariant(SHA256_PATTERN.test(record.sha256), `${label}.sha256 is invalid`);
  invariant(typeof record.dev === "string" && /^\d+$/u.test(record.dev), `${label}.dev is invalid`);
  invariant(typeof record.ino === "string" && /^\d+$/u.test(record.ino), `${label}.ino is invalid`);
  invariant(Number.isInteger(record.mode) && record.mode >= 0 && record.mode <= 0o7777, `${label}.mode is invalid`);
  invariant(typeof record.mtimeNs === "string" && /^\d+$/u.test(record.mtimeNs), `${label}.mtimeNs is invalid`);
  return {
    path: record.path,
    bytes: record.bytes,
    sha256: record.sha256,
    dev: record.dev,
    ino: record.ino,
    mode: record.mode,
    mtimeNs: record.mtimeNs,
  };
}

function validateProcessRecord(record, label, {observer = false} = {}) {
  exactKeys(record, ["pid", "ppid", "command", "cwd", "relevance", "observerRelationship"], label);
  invariant(typeof record.pid === "string" && /^\d+$/u.test(record.pid), `${label}.pid is invalid`);
  invariant(typeof record.ppid === "string" && /^\d+$/u.test(record.ppid), `${label}.ppid is invalid`);
  invariant(typeof record.command === "string" && record.command.length > 0, `${label}.command is invalid`);
  invariant(record.cwd === null || (typeof record.cwd === "string" && path.isAbsolute(record.cwd)), `${label}.cwd is invalid`);
  invariant(Array.isArray(record.relevance) && record.relevance.every((item) => typeof item === "string" && item.length > 0), `${label}.relevance is invalid`);
  invariant(new Set(record.relevance).size === record.relevance.length, `${label}.relevance contains duplicates`);
  invariant(
    observer
      ? ["observer", "ancestor"].includes(record.observerRelationship)
      : record.observerRelationship === "none",
    `${label}.observerRelationship is invalid`,
  );
}

function validateProcessCensus(value, label) {
  exactKeys(value, ["tools", "observerProcesses", "unexpectedRelevantProcesses"], label);
  exactKeys(value.tools, ["ps", "lsofCwd"], `${label}.tools`);
  invariant(value.tools.ps === "/bin/ps -axo pid=,ppid=,command=", `${label}.tools.ps changed`);
  invariant(value.tools.lsofCwd === "/usr/sbin/lsof -n -P -a -d cwd -F pRcn", `${label}.tools.lsofCwd changed`);
  for (const [field, observer] of [["observerProcesses", true], ["unexpectedRelevantProcesses", false]]) {
    const collection = value[field];
    exactKeys(collection, ["count", "records"], `${label}.${field}`);
    invariant(Number.isSafeInteger(collection.count) && collection.count >= 0 && Array.isArray(collection.records) && collection.count === collection.records.length, `${label}.${field} count changed`);
    collection.records.forEach((record, index) => validateProcessRecord(record, `${label}.${field}.records[${index}]`, {observer}));
  }
  invariant(value.observerProcesses.count > 0 && value.observerProcesses.records.some((record) => record.observerRelationship === "observer"), `${label} lacks the snapshot observer process`);
  invariant(value.unexpectedRelevantProcesses.count === 0, `${label} observed an unexpected relevant process`);
  return value;
}

function validateQuiescenceSnapshotValue(value, {universe, label}) {
  exactKeys(value, [
    "schemaVersion", "artifactType", "capturedAt", "scope", "allowlist",
    "openWriteHandles", "processCensus",
  ], label);
  invariant(
    value?.schemaVersion === "help-math-fla-swf-counterpart-scoped-quiescence-snapshot/v1"
      && value?.artifactType === "help-math-fla-swf-counterpart-scoped-quiescence-snapshot",
    `${label} schema/type changed`,
  );
  validIsoTimestamp(value.capturedAt, `${label}.capturedAt`);
  invariant(Array.isArray(value.allowlist) && value.allowlist.length > 0, `${label} requires a non-empty allowlist`);
  const allowlist = value.allowlist
    .map((record, index) => quiescenceRecordProjection(record, `${label}.allowlist[${index}]`))
    .sort((left, right) => compareText(left.path, right.path));
  invariant(new Set(allowlist.map((record) => record.path)).size === allowlist.length, `${label} contains duplicate allowlist paths`);
  invariant(
    value.openWriteHandles?.count === 0
      && Array.isArray(value.openWriteHandles.records)
      && value.openWriteHandles.records.length === 0,
    `${label} observed an open write handle`,
  );
  validateProcessCensus(value.processCensus, `${label}.processCensus`);
  if (value.scope !== undefined) {
    invariant(value.scope?.recordSetSha256 === universe.digests.recordSetSha256, `${label} scope record-set binding changed`);
    invariant(value.scope?.sourceBoundRecordSetSha256 === universe.digests.sourceBoundRecordSetSha256, `${label} scope source-bound binding changed`);
  }
  return {
    capturedAt: value.capturedAt,
    capturedAtMs: Date.parse(value.capturedAt),
    allowlist,
    processCensus: value.processCensus,
  };
}

function quiescenceAllowlistIdentityDigest(records) {
  return sha256Text([...records]
    .sort((left, right) => compareText(left.path, right.path))
    .map((record) => `${record.path}\t${record.bytes}\t${record.sha256}\n`)
    .join(""));
}

export function resolveQuiescenceVirtualPath(virtualPath, {
  universe,
  root = PROJECT_ROOT,
} = {}) {
  portableRelative(virtualPath, "Quiescence virtual path");
  if (virtualPath.startsWith("project/")) {
    const relativePath = portableRelative(virtualPath.slice("project/".length), "Quiescence project relative path");
    return {namespace: "project", root: path.resolve(root), relativePath};
  }
  const privatePrefix = `${SOURCE_ROOT_REF}/`;
  if (virtualPath.startsWith(privatePrefix)) {
    const relativePath = portableRelative(virtualPath.slice(privatePrefix.length), "Quiescence private relative path");
    invariant(universe?.sourceRootBindings?.[SOURCE_ROOT_REF]?.absolutePath, "Quiescence private namespace lacks a universe root binding");
    return {
      namespace: SOURCE_ROOT_REF,
      root: universe.sourceRootBindings[SOURCE_ROOT_REF].absolutePath,
      relativePath,
    };
  }
  throw new Error(`Unknown quiescence virtual-path namespace: ${virtualPath}`);
}

function parseLsofWriteHandles(output) {
  const writers = [];
  let processId = null;
  let descriptor = null;
  let access = null;
  for (const line of String(output).split("\n")) {
    const prefix = line[0];
    const value = line.slice(1);
    if (prefix === "p") {
      processId = value;
      descriptor = null;
      access = null;
    } else if (prefix === "f") {
      descriptor = value;
      access = null;
    } else if (prefix === "a") {
      access = value;
    } else if (prefix === "n" && ["w", "u"].includes(access)) {
      writers.push({processId, descriptor, access, path: value});
    }
  }
  return writers;
}

export async function scanLiveWriteHandles(filePaths) {
  invariant(Array.isArray(filePaths), "Live writer scan requires file paths");
  const writers = [];
  for (let offset = 0; offset < filePaths.length; offset += 100) {
    const batch = filePaths.slice(offset, offset + 100);
    if (batch.length === 0) continue;
    try {
      const result = await execFile("/usr/sbin/lsof", ["-F", "pafn", "--", ...batch], {
        encoding: "utf8",
        maxBuffer: 16 * 1024 * 1024,
      });
      writers.push(...parseLsofWriteHandles(result.stdout));
    } catch (error) {
      if (error.code === 1 && !String(error.stdout ?? "").trim()) continue;
      throw new Error(`Live lsof quiescence scan failed closed: ${error.message}`);
    }
  }
  return writers;
}

function parseProcessTable(output) {
  const processes = new Map();
  for (const line of String(output).split("\n")) {
    const match = line.match(/^\s*(\d+)\s+(\d+)\s+(.+)$/u);
    if (!match) continue;
    processes.set(match[1], {
      pid: match[1],
      ppid: match[2],
      command: match[3].trim(),
      cwd: null,
      lsofOnly: false,
    });
  }
  return processes;
}

function applyLsofCwd(output, processes) {
  let pid = null;
  for (const line of String(output).split("\n")) {
    const prefix = line[0];
    const value = line.slice(1);
    if (prefix === "p") {
      pid = value;
      if (!processes.has(pid)) {
        processes.set(pid, {
          pid,
          ppid: "",
          command: "",
          cwd: null,
          lsofOnly: true,
        });
      }
    }
    else if (prefix === "R" && pid && processes.has(pid)) processes.get(pid).ppid = value;
    else if (prefix === "c" && pid && processes.has(pid) && !processes.get(pid).command) processes.get(pid).command = value;
    else if (prefix === "n" && pid && processes.has(pid)) processes.get(pid).cwd = value;
  }
}

function pathInside(candidate, root) {
  if (typeof candidate !== "string" || candidate.length === 0) return false;
  const relative = path.relative(path.resolve(root), path.resolve(candidate));
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

export async function scanRelevantProcessCensus({
  universe,
  root = PROJECT_ROOT,
  observerPid = String(process.pid),
  runProcess = execFile,
} = {}) {
  const psArguments = ["-axo", "pid=,ppid=,command="];
  const lsofArguments = ["-n", "-P", "-a", "-d", "cwd", "-F", "pRcn"];
  let psBeforeResult;
  let lsofResult;
  let psAfterResult;
  try {
    // Bracket lsof with process-table snapshots. The lsof helper itself is
    // absent from both completed snapshots, while a process that starts during
    // the census and remains alive is retained from the second snapshot.
    psBeforeResult = await runProcess("/bin/ps", psArguments, {
      encoding: "utf8",
      maxBuffer: 16 * 1024 * 1024,
    });
    lsofResult = await runProcess("/usr/sbin/lsof", lsofArguments, {
      encoding: "utf8",
      maxBuffer: 32 * 1024 * 1024,
    });
    psAfterResult = await runProcess("/bin/ps", psArguments, {
      encoding: "utf8",
      maxBuffer: 16 * 1024 * 1024,
    });
  } catch (error) {
    throw new Error(`Relevant-process census failed closed: ${error.message}`);
  }
  const processes = parseProcessTable(psBeforeResult.stdout);
  for (const [pid, processRecord] of parseProcessTable(psAfterResult.stdout)) {
    processes.set(pid, processRecord);
  }
  applyLsofCwd(lsofResult.stdout, processes);
  invariant(processes.has(observerPid), "Relevant-process census did not observe its own process");
  const observerChain = new Map();
  let cursor = observerPid;
  while (cursor && processes.has(cursor) && !observerChain.has(cursor)) {
    const relationship = cursor === observerPid ? "observer" : "ancestor";
    observerChain.set(cursor, relationship);
    const parent = processes.get(cursor).ppid;
    if (!parent || parent === "0" || parent === cursor) break;
    cursor = parent;
  }
  const exactLsofHelpers = [...processes.values()].filter((record) =>
    record.lsofOnly === true
      && record.ppid === observerPid
      && /^(?:\/usr\/sbin\/)?lsof$/u.test(record.command));
  const lsofHelperPid = exactLsofHelpers.length === 1
    ? exactLsofHelpers[0].pid
    : null;
  const projectRoot = path.resolve(root);
  const relevantRoots = [
    {label: "project-root", value: projectRoot},
    {label: "canonical-source-root", value: path.join(projectRoot, "source-assets/flash/HELP MATH_ORIGINAL FILES")},
    {label: "catalog-root", value: path.join(projectRoot, "catalog")},
    {label: "private-intake-root", value: universe.sourceRootBindings[SOURCE_ROOT_REF].absolutePath},
  ];
  const successorScriptNames = [
    "build-fla-swf-counterpart-successor-plan.mjs",
    "promote-fla-swf-counterpart-successor.mjs",
    "fla-swf-counterpart-transaction.mjs",
  ];
  function processRecord(processRecord, observerRelationship) {
    const relevance = [];
    for (const relevantRoot of relevantRoots) {
      if (processRecord.cwd && pathInside(processRecord.cwd, relevantRoot.value)) relevance.push(`cwd-under-${relevantRoot.label}`);
      if (processRecord.command.includes(relevantRoot.value)) relevance.push(`command-references-${relevantRoot.label}`);
    }
    if (successorScriptNames.some((name) => processRecord.command.includes(name))) relevance.push("command-references-successor-script");
    return {
      pid: processRecord.pid,
      ppid: processRecord.ppid,
      command: processRecord.command,
      cwd: processRecord.cwd,
      relevance: [...new Set(relevance)].sort(compareText),
      observerRelationship,
    };
  }
  const observerProcesses = [...observerChain.entries()]
    .map(([pid, relationship]) => processRecord(processes.get(pid), relationship))
    .sort((left, right) => Number(left.pid) - Number(right.pid));
  const unexpectedRelevantProcesses = [...processes.values()]
    .filter((record) => !observerChain.has(record.pid)
      && record.pid !== lsofHelperPid)
    .map((record) => processRecord(record, "none"))
    .filter((record) => record.relevance.length > 0)
    .sort((left, right) => Number(left.pid) - Number(right.pid));
  return {
    tools: {
      ps: `/bin/ps ${psArguments.join(" ")}`,
      lsofCwd: `/usr/sbin/lsof ${lsofArguments.join(" ")}`,
    },
    observerProcesses: {count: observerProcesses.length, records: observerProcesses},
    unexpectedRelevantProcesses: {count: unexpectedRelevantProcesses.length, records: unexpectedRelevantProcesses},
  };
}

export async function captureQuiescenceSnapshot({
  universe,
  expectedAllowlist,
  root = PROJECT_ROOT,
  outputRelativePath,
  capturedAt = new Date().toISOString(),
  scanOpenWriters = scanLiveWriteHandles,
  scanProcesses = scanRelevantProcessCensus,
} = {}) {
  assertUniverse(universe);
  invariant(Array.isArray(expectedAllowlist) && expectedAllowlist.length > 0, "Quiescence capture requires a fixed non-empty allowlist");
  validIsoTimestamp(capturedAt, "Quiescence capture timestamp");
  const records = [];
  const absolutePaths = [];
  for (const [index, expected] of expectedAllowlist.entries()) {
    const resolved = resolveQuiescenceVirtualPath(expected.path, {universe, root});
    const {absolutePath} = await secureResolveExistingRegular(
      resolved.root,
      resolved.relativePath,
      `Quiescence capture path[${index}]`,
    );
    const observed = await readStableFile(absolutePath, `Quiescence capture path[${index}]`);
    invariant(observed.byteCount === expected.bytes && observed.sha256 === expected.sha256, `Quiescence capture identity changed: ${expected.path}`);
    records.push({
      path: expected.path,
      bytes: observed.byteCount,
      sha256: observed.sha256,
      dev: observed.identity.dev,
      ino: observed.identity.ino,
      mode: observed.mode,
      mtimeNs: observed.mtimeNs,
    });
    absolutePaths.push(absolutePath);
  }
  records.sort((left, right) => compareText(left.path, right.path));
  const writers = await scanOpenWriters(absolutePaths);
  invariant(Array.isArray(writers), "Live writer scan did not return an array");
  invariant(writers.length === 0, "Scoped quiescence capture observed an open write-capable handle");
  const processCensus = await scanProcesses({universe, root});
  validateProcessCensus(processCensus, "Captured quiescence process census");
  invariant(processCensus.unexpectedRelevantProcesses.count === 0, "Scoped quiescence capture observed an unexpected relevant process");
  const snapshot = {
    schemaVersion: "help-math-fla-swf-counterpart-scoped-quiescence-snapshot/v1",
    artifactType: "help-math-fla-swf-counterpart-scoped-quiescence-snapshot",
    capturedAt,
    scope: {
      recordSetSha256: universe.digests.recordSetSha256,
      sourceBoundRecordSetSha256: universe.digests.sourceBoundRecordSetSha256,
      records: records.length,
      identitySha256: quiescenceAllowlistIdentityDigest(records),
    },
    allowlist: records,
    openWriteHandles: {count: 0, records: []},
    processCensus,
  };
  validateQuiescenceSnapshotValue(snapshot, {universe, label: "Captured quiescence snapshot"});
  if (!outputRelativePath) return {snapshot, reference: null};
  const relativePath = portableRelative(outputRelativePath, "Quiescence snapshot output path");
  const published = await writeImmutableNoClobber(path.join(root, relativePath), Buffer.from(canonicalJson(snapshot), "utf8"));
  return {
    snapshot,
    reference: {path: relativePath, bytes: published.bytes, sha256: published.sha256},
    publicationOutcome: published.outcome,
  };
}

function validateAuthoringPreparationReceipt(receipt, {
  universeIdentity,
  universeRecord,
  expectedFla,
  sourceRootRef,
  sourceRelativePath,
  sourceObserved,
  workingRelativePath,
  workingObserved,
}) {
  exactKeys(receipt, [
    "schemaVersion", "artifactType", "preparedAt", "universe", "record", "fla",
    "sourceArtifact", "workingCopy", "copyContract", "actions", "signatureState",
    "evidenceBoundary",
  ], "Authoring working-copy preparation receipt");
  invariant(
    receipt.schemaVersion === "help-math-fla-swf-counterpart-authoring-working-copy-preparation/v1"
      && receipt.artifactType === "help-math-fla-swf-counterpart-authoring-working-copy-preparation",
    "Authoring working-copy preparation receipt schema/type changed",
  );
  validIsoTimestamp(receipt.preparedAt, "Authoring working-copy preparedAt");
  invariant(JSON.stringify(receipt.universe) === JSON.stringify(universeIdentity), "Authoring working-copy universe binding changed");
  exactKeys(receipt.record, ["recordId", "canonicalPath", "sourceBindingSha256"], "Authoring working-copy record");
  invariant(
    receipt.record.recordId === universeRecord.recordId
      && receipt.record.canonicalPath === universeRecord.canonicalPath
      && receipt.record.sourceBindingSha256 === universeRecord.sourceBindingSha256,
    "Authoring working-copy record binding changed",
  );
  invariant(JSON.stringify(receipt.fla) === JSON.stringify(expectedFla), "Authoring working-copy FLA identity changed");
  exactKeys(receipt.sourceArtifact, ["rootRef", "relativePath", "bytes", "sha256", "node"], "Authoring working-copy source artifact");
  exactKeys(receipt.sourceArtifact.node, ["dev", "ino"], "Authoring working-copy source node");
  invariant(
    receipt.sourceArtifact.rootRef === sourceRootRef
      && receipt.sourceArtifact.relativePath === sourceRelativePath
      && receipt.sourceArtifact.bytes === sourceObserved.byteCount
      && receipt.sourceArtifact.sha256 === sourceObserved.sha256
      && JSON.stringify(receipt.sourceArtifact.node) === JSON.stringify(sourceObserved.identity),
    "Authoring working-copy source identity changed",
  );
  exactKeys(receipt.workingCopy, ["artifact", "node", "mode", "nlink", "separateInode"], "Authoring working copy");
  validateArtifactReference(receipt.workingCopy.artifact, "Authoring working-copy artifact");
  exactKeys(receipt.workingCopy.node, ["dev", "ino"], "Authoring working-copy node");
  invariant(
    receipt.workingCopy.artifact.path === workingRelativePath
      && receipt.workingCopy.artifact.bytes === workingObserved.byteCount
      && receipt.workingCopy.artifact.sha256 === workingObserved.sha256
      && JSON.stringify(receipt.workingCopy.node) === JSON.stringify(workingObserved.identity)
      && receipt.workingCopy.mode === "0444"
      && receipt.workingCopy.nlink === 1
      && receipt.workingCopy.separateInode === true,
    "Authoring working-copy isolation binding changed",
  );
  exactKeys(receipt.copyContract, ["method", "byteIdentical", "noOverwrite", "independentInode", "readOnly", "singleHardLink"], "Authoring working-copy copy contract");
  invariant(
    receipt.copyContract.method === "no-follow-read-and-atomic-no-clobber-publication"
      && Object.entries(receipt.copyContract).filter(([key]) => key !== "method").every(([, value]) => value === true),
    "Authoring working-copy copy contract changed",
  );
  exactKeys(receipt.actions, ["animateLaunch", "save", "publish", "repair", "normalize"], "Authoring working-copy actions");
  invariant(Object.values(receipt.actions).every((value) => value === false), "Authoring working-copy preparer performed an unauthorized action");
  invariant(receipt.signatureState === "unsigned-preparation-only", "Authoring working-copy preparer must remain unsigned");
  exactKeys(receipt.evidenceBoundary, ["authoringAuditPerformed", "reviewerAssigned", "signatureGenerated", "promotionAuthorization"], "Authoring working-copy evidence boundary");
  invariant(Object.values(receipt.evidenceBoundary).every((value) => value === false), "Authoring working-copy preparation expanded its evidence boundary");
  return receipt;
}

export async function prepareAuthoringWorkingCopy({
  universe,
  universeIdentity,
  recordId,
  root = PROJECT_ROOT,
} = {}) {
  assertUniverse(universe);
  validateArtifactReference(universeIdentity, "Authoring-copy universe identity");
  nonEmptyString(recordId, "Authoring-copy recordId");
  const universeRecord = universe.records.find((record) => record.recordId === recordId);
  invariant(universeRecord, `Unknown frozen successor recordId: ${recordId}`);
  const candidateFla = universeRecord.extension === "fla";
  const sourceRootRef = candidateFla ? SOURCE_ROOT_REF : "project-root";
  const sourceRoot = candidateFla ? universe.sourceRootBindings[SOURCE_ROOT_REF].absolutePath : root;
  const sourceRelativePath = candidateFla
    ? universeRecord.sourceBinding.quarantineRelativePath
    : `source-assets/flash/HELP MATH_ORIGINAL FILES/${universeRecord.existingCounterpart.canonicalPath}`;
  const expectedFla = identityForReview(universeRecord, "fla");
  const {absolutePath: sourcePath} = await secureResolveExistingRegular(sourceRoot, sourceRelativePath, "Authoring-copy source FLA");
  const sourceObserved = await readStableFile(sourcePath, "Authoring-copy source FLA");
  invariant(sourceObserved.byteCount === expectedFla.bytes && sourceObserved.sha256 === expectedFla.sha256, "Authoring-copy source FLA changed from the frozen pair");
  const workingRelativePath = `${AUTHORING_WORKING_COPY_PREFIX}/${recordId}/source.fla`;
  assertAuthoringWorkingCopyPath(workingRelativePath, recordId);
  const workingWrite = await writeImmutableNoClobber(path.join(root, workingRelativePath), sourceObserved.bytes);
  const {absolutePath: workingPath} = await secureResolveExistingRegular(root, workingRelativePath, "Prepared authoring working copy");
  const workingObserved = await readStableFile(workingPath, "Prepared authoring working copy", {immutable: true});
  invariant(workingObserved.byteCount === expectedFla.bytes && workingObserved.sha256 === expectedFla.sha256, "Prepared authoring working copy differs from the frozen FLA");
  invariant(!sameNode(sourceObserved.identity, workingObserved.identity), "Prepared authoring working copy aliases the source inode");
  const receiptRelativePath = `${AUTHORING_WORKING_COPY_PREFIX}/${recordId}/preparation-receipt.json`;
  const receiptContext = {
    universeIdentity,
    universeRecord,
    expectedFla,
    sourceRootRef,
    sourceRelativePath,
    sourceObserved,
    workingRelativePath,
    workingObserved,
  };
  const existingReceipt = await lstatOrNull(path.join(root, receiptRelativePath));
  if (existingReceipt) {
    const receiptFile = await readImmutableJsonArtifact(root, receiptRelativePath, "Authoring working-copy preparation receipt");
    validateAuthoringPreparationReceipt(receiptFile.value, receiptContext);
    return {
      status: "authoring-working-copy-already-prepared-unsigned",
      workingCopy: receiptFile.value.workingCopy,
      preparationReceipt: receiptFile.identity,
    };
  }
  const receipt = {
    schemaVersion: "help-math-fla-swf-counterpart-authoring-working-copy-preparation/v1",
    artifactType: "help-math-fla-swf-counterpart-authoring-working-copy-preparation",
    preparedAt: new Date().toISOString(),
    universe: {...universeIdentity},
    record: {
      recordId: universeRecord.recordId,
      canonicalPath: universeRecord.canonicalPath,
      sourceBindingSha256: universeRecord.sourceBindingSha256,
    },
    fla: expectedFla,
    sourceArtifact: {
      rootRef: sourceRootRef,
      relativePath: sourceRelativePath,
      bytes: sourceObserved.byteCount,
      sha256: sourceObserved.sha256,
      node: sourceObserved.identity,
    },
    workingCopy: {
      artifact: {path: workingRelativePath, bytes: workingObserved.byteCount, sha256: workingObserved.sha256},
      node: workingObserved.identity,
      mode: "0444",
      nlink: 1,
      separateInode: true,
    },
    copyContract: {
      method: "no-follow-read-and-atomic-no-clobber-publication",
      byteIdentical: true,
      noOverwrite: true,
      independentInode: true,
      readOnly: true,
      singleHardLink: true,
    },
    actions: {
      animateLaunch: false,
      save: false,
      publish: false,
      repair: false,
      normalize: false,
    },
    signatureState: "unsigned-preparation-only",
    evidenceBoundary: {
      authoringAuditPerformed: false,
      reviewerAssigned: false,
      signatureGenerated: false,
      promotionAuthorization: false,
    },
  };
  validateAuthoringPreparationReceipt(receipt, receiptContext);
  const published = await writeImmutableNoClobber(path.join(root, receiptRelativePath), Buffer.from(canonicalJson(receipt), "utf8"));
  return {
    status: "authoring-working-copy-prepared-unsigned",
    workingCopy: receipt.workingCopy,
    preparationReceipt: {path: receiptRelativePath, bytes: published.bytes, sha256: published.sha256},
    publicationOutcome: workingWrite.outcome,
  };
}

export async function expectedQuiescenceAllowlist({
  universe,
  universeIdentity,
  reviewLedger,
  reviewLedgerIdentity,
  additionalProjectArtifacts = [],
  root = PROJECT_ROOT,
}) {
  const sourceFiles = await readPinnedJson(root, EXPECTED.canonical.sourceFiles, "Quiescence current source-files catalog");
  const expected = new Map();
  function add(relativePath, bytes, sha256, label) {
    const record = {path: portableRelative(relativePath, label), bytes, sha256};
    invariant(Number.isSafeInteger(bytes) && bytes >= 0 && SHA256_PATTERN.test(sha256), `${label} identity is invalid`);
    const prior = expected.get(record.path);
    invariant(!prior || (prior.bytes === bytes && prior.sha256 === sha256), `${label} collides with a different fixed identity`);
    expected.set(record.path, record);
  }
  for (const record of sourceFiles.value.files) {
    add(`project/source-assets/flash/HELP MATH_ORIGINAL FILES/${record.path}`, record.bytes, record.sha256, "Quiescence canonical source path");
  }
  for (const record of universe.records) {
    add(`${SOURCE_ROOT_REF}/${record.sourceBinding.quarantineRelativePath}`, record.bytes, record.sha256, "Quiescence private source path");
  }
  for (const pin of Object.values(EXPECTED.canonical)) add(`project/${pin.path}`, pin.bytes, pin.sha256, "Quiescence catalog input path");
  for (const filename of CATALOG_OUTPUT_FILENAMES) {
    const relativePath = `catalog/${filename}`;
    const {absolutePath} = await secureResolveExistingRegular(root, relativePath, `Quiescence catalog output ${filename}`);
    const observed = await readStableFile(absolutePath, `Quiescence catalog output ${filename}`);
    add(`project/${relativePath}`, observed.byteCount, observed.sha256, `Quiescence catalog output ${filename}`);
  }
  for (const relativePath of QUIESCENCE_PROJECT_DEPENDENCIES) {
    const {absolutePath} = await secureResolveExistingRegular(root, relativePath, `Quiescence execution dependency ${relativePath}`);
    const observed = await readStableFile(absolutePath, `Quiescence execution dependency ${relativePath}`);
    add(`project/${relativePath}`, observed.byteCount, observed.sha256, `Quiescence execution dependency ${relativePath}`);
  }
  add(`project/${universeIdentity.path}`, universeIdentity.bytes, universeIdentity.sha256, "Quiescence universe artifact path");
  add(`project/${reviewLedgerIdentity.path}`, reviewLedgerIdentity.bytes, reviewLedgerIdentity.sha256, "Quiescence review-ledger artifact path");
  if (reviewLedger.attestation?.state === "signed-complete") {
    const registry = await loadTrustedReviewerRegistry({root, universeIdentity});
    add(`project/${registry.identity.path}`, registry.identity.bytes, registry.identity.sha256, "Quiescence trusted reviewer registry path");
  }
  const evidenceReferences = [];
  for (const envelope of reviewLedger.attestation.signatureEnvelopes) evidenceReferences.push(envelope.artifact);
  for (const record of reviewLedger.records) {
    evidenceReferences.push(...record.lineage.evidenceArtifacts);
    if (record.publicationLineageReceipt) evidenceReferences.push(record.publicationLineageReceipt);
    if (record.authoringAuditReceipt) evidenceReferences.push(record.authoringAuditReceipt);
    if (record.manualHoldReview.receipt) evidenceReferences.push(record.manualHoldReview.receipt);
  }
  for (const reference of evidenceReferences) {
    validateArtifactReference(reference, "Quiescence review evidence reference");
    add(`project/${reference.path}`, reference.bytes, reference.sha256, "Quiescence review evidence path");
  }
  async function addNestedReferences(wrapperReference, selectors, label) {
    const wrapper = await readImmutableJsonArtifact(root, wrapperReference.path, label);
    invariant(wrapper.identity.bytes === wrapperReference.bytes && wrapper.identity.sha256 === wrapperReference.sha256, `${label} wrapper identity changed`);
    for (const nested of selectors(wrapper.value)) {
      validateArtifactReference(nested, `${label} nested artifact`);
      add(`project/${nested.path}`, nested.bytes, nested.sha256, `${label} nested artifact path`);
    }
  }
  for (const record of reviewLedger.records) {
    if (record.publicationLineageReceipt) {
      await addNestedReferences(record.publicationLineageReceipt, (receipt) => [
        ...receipt.underlyingEvidenceArtifacts,
        receipt.signatureEnvelope.artifact,
      ], `Quiescence publication-lineage receipt ${record.recordId}`);
    }
    if (record.authoringAuditReceipt) {
      await addNestedReferences(record.authoringAuditReceipt, (receipt) => [
        receipt.workingCopy.artifact,
        ...(receipt.failure?.evidenceArtifacts ?? []),
        receipt.signatureEnvelope.artifact,
      ], `Quiescence authoring-audit receipt ${record.recordId}`);
    }
    if (record.manualHoldReview.receipt) {
      await addNestedReferences(record.manualHoldReview.receipt, (receipt) => [
        ...receipt.evidenceArtifacts,
        receipt.signatureEnvelope.artifact,
      ], `Quiescence manual-hold receipt ${record.recordId}`);
    }
  }
  for (const reference of additionalProjectArtifacts) {
    validateArtifactReference(reference, "Quiescence additional project artifact");
    add(`project/${reference.path}`, reference.bytes, reference.sha256, "Quiescence additional project artifact path");
    await addNestedReferences(reference, (receipt) => receipt.evidenceArtifacts ?? [], "Quiescence provisional observation receipt");
  }
  return [...expected.values()].sort((left, right) => compareText(left.path, right.path));
}

export async function validateQuiescenceSnapshots(references, {
  universe,
  root = PROJECT_ROOT,
  expectedAllowlist = null,
  snapshotBirthtimeNsReader = null,
} = {}) {
  assertUniverse(universe);
  invariant(Array.isArray(references) && references.length === 2, "Exactly two scoped quiescence snapshot references are required");
  const snapshots = [];
  for (const [index, reference] of references.entries()) {
    validateArtifactReference(reference, `Quiescence snapshot reference[${index}]`);
    const file = await readImmutableJsonArtifact(root, reference.path, `Quiescence snapshot[${index}]`);
    invariant(file.identity.bytes === reference.bytes && file.identity.sha256 === reference.sha256, `Quiescence snapshot[${index}] artifact binding changed`);
    const snapshotInformation = await lstat(path.join(root, reference.path), {bigint: true});
    const birthtimeNs = snapshotBirthtimeNsReader
      ? BigInt(await snapshotBirthtimeNsReader(reference, index))
      : snapshotInformation.birthtimeNs;
    snapshots.push({
      reference: {...reference},
      birthtimeNs,
      ...validateQuiescenceSnapshotValue(file.value, {universe, label: `Quiescence snapshot[${index}]`}),
    });
  }
  snapshots.sort((left, right) => left.capturedAtMs - right.capturedAtMs);
  invariant(snapshots[1].capturedAtMs - snapshots[0].capturedAtMs >= 60_000, "Scoped quiescence snapshots must be at least 60 seconds apart");
  invariant(snapshots[1].birthtimeNs - snapshots[0].birthtimeNs >= 60_000_000_000n, "Scoped quiescence snapshot files were not actually created at least 60 seconds apart");
  invariant(JSON.stringify(snapshots[0].allowlist) === JSON.stringify(snapshots[1].allowlist), "Scoped quiescence allowlists drifted");
  invariant(Array.isArray(expectedAllowlist) && expectedAllowlist.length > 0, "Quiescence validation requires a deterministic fixed allowlist");
  const observedIdentity = snapshots[0].allowlist.map(({path: relativePath, bytes, sha256}) => ({path: relativePath, bytes, sha256}));
  invariant(JSON.stringify(observedIdentity) === JSON.stringify(expectedAllowlist), "Scoped quiescence allowlist differs from the deterministic full source/catalog/review scope");
  invariant(snapshots[0].reference.sha256 !== snapshots[1].reference.sha256, "Scoped quiescence snapshots must be distinct immutable artifacts");
  return snapshots.map((snapshot) => ({
    ...snapshot.reference,
    capturedAt: snapshot.capturedAt,
    allowlistRecords: snapshot.allowlist.length,
    allowlistIdentitySha256: quiescenceAllowlistIdentityDigest(expectedAllowlist),
    openWriteHandles: 0,
    observerProcesses: snapshot.processCensus.observerProcesses.count,
    unexpectedRelevantProcesses: snapshot.processCensus.unexpectedRelevantProcesses.count,
  }));
}

function promotionRecordSetDigest(records) {
  return sha256Text([...records]
    .sort((left, right) => compareText(left.canonicalPath, right.canonicalPath))
    .map((record) => [
      record.canonicalPath,
      record.sourceBinding.quarantineRelativePath,
      String(record.bytes),
      record.sha256,
      record.sourceBindingSha256,
      record.priorDisposition,
      record.currentDisposition,
      record.approvalBasis,
    ].join("\t") + "\n")
    .join(""));
}

function withheldRecordSetDigest(records) {
  return sha256Text([...records]
    .sort((left, right) => compareText(left.canonicalPath, right.canonicalPath))
    .map((record) => `${record.recordId}\t${record.canonicalPath}\t${record.reviewDecision}\t${record.withheldReason}\n`)
    .join(""));
}

function approvedPlanRecord(universeRecord, reviewRecord) {
  const hold = universeRecord.currentDisposition !== "candidate-new-source-in-quarantine";
  return {
    recordId: universeRecord.recordId,
    canonicalPath: universeRecord.canonicalPath,
    bytes: universeRecord.bytes,
    sha256: universeRecord.sha256,
    extension: universeRecord.extension,
    sourceBinding: universeRecord.sourceBinding,
    sourceBindingSha256: universeRecord.sourceBindingSha256,
    priorDisposition: universeRecord.priorDisposition,
    priorIntakeDecision: universeRecord.priorIntakeDecision,
    currentDisposition: universeRecord.currentDisposition,
    reviewDecision: reviewRecord.review.decision,
    approvalBasis: hold
      ? "manual-hold-confirmed-publication-lineage"
      : "ordinary-confirmed-publication-lineage",
    manualHoldReceipt: hold ? reviewRecord.manualHoldReview.receipt : null,
    automaticCopyAllowed: false,
  };
}

function withheldPlanRecord(universeRecord, reviewRecord) {
  const hold = universeRecord.currentDisposition !== "candidate-new-source-in-quarantine";
  let withheldReason = reviewRecord.review.decision;
  if (reviewRecord.review.decision === "confirmed-publication-lineage" && hold) {
    withheldReason = `manual-hold-${reviewRecord.manualHoldReview.decision}`;
  }
  return {
    recordId: universeRecord.recordId,
    canonicalPath: universeRecord.canonicalPath,
    bytes: universeRecord.bytes,
    sha256: universeRecord.sha256,
    extension: universeRecord.extension,
    sourceBindingSha256: universeRecord.sourceBindingSha256,
    priorDisposition: universeRecord.priorDisposition,
    priorIntakeDecision: universeRecord.priorIntakeDecision,
    currentDisposition: universeRecord.currentDisposition,
    reviewDecision: reviewRecord.review.decision,
    manualHoldDecision: reviewRecord.manualHoldReview.decision,
    withheldReason,
    automaticCopyAllowed: false,
  };
}

function partitionReviewedRecords(universe, reviewLedger) {
  const reviewById = new Map(reviewLedger.records.map((record) => [record.recordId, record]));
  const approved = [];
  const withheld = [];
  for (const universeRecord of universe.records) {
    const reviewRecord = reviewById.get(universeRecord.recordId);
    invariant(reviewRecord?.review?.terminal === true, `Plan review is nonterminal: ${universeRecord.canonicalPath}`);
    const hold = universeRecord.currentDisposition !== "candidate-new-source-in-quarantine";
    const eligible = reviewRecord.review.decision === "confirmed-publication-lineage"
      && (!hold || reviewRecord.manualHoldReview.decision === "approved-reviewed-copy");
    (eligible ? approved : withheld).push(
      eligible ? approvedPlanRecord(universeRecord, reviewRecord) : withheldPlanRecord(universeRecord, reviewRecord),
    );
  }
  approved.sort((left, right) => compareText(left.canonicalPath, right.canonicalPath));
  withheld.sort((left, right) => compareText(left.canonicalPath, right.canonicalPath));
  return {approved, withheld};
}

function currentSourceProfileKeys() {
  return [
    "files", "totalBytes", "checksumSetSha256", "sourceExtensions", "swf", "fla",
    "mp3", "xml", "courseXml", "swfByCollection", "uniqueSwfAssets",
    "duplicateGroups", "duplicatePlacements", "pairedSwfFla", "swfOnly",
    "flaOnly", "compoundBinaryFla", "zipArchiveFla", "unrecognizedFla",
    "swfFrames", "swfHeader", "courseShells", "courseReferences",
    "keytermReferences", "lessonReleases", "xmlWithBareAmpersands",
  ];
}

export function validateExpectedCatalogProfile(profile) {
  exactKeys(profile, ["schemaVersion", "artifactType", "expected"], "Expected catalog profile");
  invariant(profile.schemaVersion === 1 && profile.artifactType === "help-math-current-source-profile", "Expected catalog profile schema/type changed");
  exactKeys(profile.expected, currentSourceProfileKeys(), "Expected catalog profile values");
  const expected = profile.expected;
  invariant(SHA256_PATTERN.test(expected.checksumSetSha256), "Expected catalog checksum-set SHA-256 is invalid");
  for (const [key, value] of Object.entries(expected)) {
    if (["checksumSetSha256", "sourceExtensions", "swfByCollection", "swfHeader", "courseReferences", "keytermReferences", "lessonReleases"].includes(key)) continue;
    invariant(Number.isSafeInteger(value) && value >= 0, `Expected profile ${key} is invalid`);
  }
  invariant(Object.values(expected.sourceExtensions).reduce((sum, value) => sum + value, 0) === expected.files, "Expected extension counts do not sum to files");
  invariant(expected.pairedSwfFla + expected.swfOnly === expected.swf, "Expected SWF pairing arithmetic is invalid");
  invariant(expected.pairedSwfFla + expected.flaOnly === expected.fla, "Expected FLA pairing arithmetic is invalid");
  invariant(expected.compoundBinaryFla + expected.zipArchiveFla + expected.unrecognizedFla === expected.fla, "Expected FLA container arithmetic is invalid");
  invariant(expected.uniqueSwfAssets + expected.duplicatePlacements === expected.swf, "Expected SWF duplicate arithmetic is invalid");
  invariant(expected.duplicateGroups <= expected.duplicatePlacements, "Expected duplicate groups exceed duplicate placements");
  invariant(Object.values(expected.swfByCollection).reduce((sum, value) => sum + value, 0) === expected.swf, "Expected SWF collection arithmetic is invalid");
  invariant(expected.courseReferences.resolved + expected.courseReferences.missing === expected.courseReferences.unique, "Expected course reference arithmetic is invalid");
  invariant(expected.keytermReferences.resolved + expected.keytermReferences.missing === expected.keytermReferences.unique, "Expected keyterm reference arithmetic is invalid");
  return profile;
}

function isCourseShell(relativePath) {
  if (!relativePath.startsWith("HELP_COURSES/")) return false;
  return /^index/iu.test(withoutExtension(path.posix.basename(relativePath)));
}

async function projectPostState({root, universe, approved}) {
  const [sourceFilesFile, sourceManifestFile, profileFile] = await Promise.all([
    readPinnedJson(root, EXPECTED.canonical.sourceFiles, "Projection source-files catalog"),
    readPinnedFile(root, EXPECTED.canonical.sourceManifest, "Projection source manifest"),
    readPinnedJson(root, EXPECTED.canonical.currentSourceProfile, "Projection current source profile"),
  ]);
  validateExpectedCatalogProfile(profileFile.value);
  const currentFiles = sourceFilesFile.value.files;
  const currentPaths = new Set(currentFiles.map((record) => normalizedPath(record.path)));
  for (const record of approved) {
    invariant(!currentPaths.has(normalizedPath(record.canonicalPath)), `Approved target already exists in current catalog: ${record.canonicalPath}`);
    currentPaths.add(normalizedPath(record.canonicalPath));
  }
  const postFiles = [
    ...currentFiles.map((record) => ({path: record.path, bytes: record.bytes, sha256: record.sha256, extension: record.extension})),
    ...approved.map((record) => ({path: record.canonicalPath, bytes: record.bytes, sha256: record.sha256, extension: record.extension})),
  ].sort((left, right) => compareText(left.path, right.path));
  const checksumBytes = Buffer.from(`${postFiles.map((record) => `${record.sha256}  ${record.path}`).join("\n")}\n`, "utf8");
  const manifestRecords = [
    ...parseManifest(sourceManifestFile.bytes.toString("utf8")),
    ...approved.map((record) => ({path: record.canonicalPath, bytes: record.bytes, sha256: record.sha256})),
  ].sort((left, right) => left.path.localeCompare(right.path, "en"));
  const manifestBytes = Buffer.from(serializeManifest(manifestRecords), "utf8");
  const expected = structuredClone(profileFile.value.expected);
  const approvedFla = approved.filter((record) => record.extension === "fla");
  const approvedSwf = approved.filter((record) => record.extension === "swf");
  expected.files += approved.length;
  expected.totalBytes += approved.reduce((sum, record) => sum + record.bytes, 0);
  expected.checksumSetSha256 = sha256Bytes(checksumBytes);
  expected.sourceExtensions.fla += approvedFla.length;
  expected.sourceExtensions.swf += approvedSwf.length;
  expected.fla += approvedFla.length;
  expected.swf += approvedSwf.length;
  expected.pairedSwfFla += approved.length;
  expected.swfOnly -= approvedFla.length;
  expected.flaOnly -= approvedSwf.length;
  for (const record of approvedFla) {
    const container = universe.records.find((entry) => entry.recordId === record.recordId).diagnostics.candidate.container;
    if (container === "compound-binary") expected.compoundBinaryFla += 1;
    else if (container === "zip-archive") expected.zipArchiveFla += 1;
    else expected.unrecognizedFla += 1;
  }
  const swfHashCounts = new Map();
  for (const record of currentFiles.filter((entry) => entry.extension === "swf")) {
    swfHashCounts.set(record.sha256, (swfHashCounts.get(record.sha256) ?? 0) + 1);
  }
  for (const record of approvedSwf) swfHashCounts.set(record.sha256, (swfHashCounts.get(record.sha256) ?? 0) + 1);
  expected.uniqueSwfAssets = swfHashCounts.size;
  expected.duplicatePlacements = expected.swf - expected.uniqueSwfAssets;
  expected.duplicateGroups = [...swfHashCounts.values()].filter((count) => count > 1).length;
  const signatures = new Set(expected.swfHeader.signatures);
  const fpsValues = new Set(expected.swfHeader.fpsValues);
  for (const record of approvedSwf) {
    const universeRecord = universe.records.find((entry) => entry.recordId === record.recordId);
    const header = universeRecord.diagnostics.candidate.header;
    invariant(header.status === "parsed", `Approved SWF header is unparsed: ${record.canonicalPath}`);
    expected.swfFrames += header.frameCount;
    signatures.add(header.signature);
    fpsValues.add(header.fps);
    expected.swfByCollection[universeRecord.diagnostics.referenceBinding.collection] += 1;
    if (isCourseShell(record.canonicalPath)) expected.courseShells += 1;
  }
  expected.swfHeader.signatures = [...signatures].sort(compareText);
  expected.swfHeader.fpsValues = [...fpsValues].sort((left, right) => left - right);
  const resolvedCourseKeys = new Set();
  const resolvedKeytermKeys = new Set();
  for (const record of approvedSwf) {
    const universeRecord = universe.records.find((entry) => entry.recordId === record.recordId);
    const binding = universeRecord.diagnostics.referenceBinding;
    if (binding.collection === "course") {
      if (binding.referenced) resolvedCourseKeys.add(normalizedPath(record.canonicalPath));
      else expected.courseReferences.unreferenced += 1;
    } else if (binding.collection === "keyterm") {
      if (binding.referenced) resolvedKeytermKeys.add(path.posix.basename(record.canonicalPath).toLowerCase());
      else expected.keytermReferences.unreferenced += 1;
    }
  }
  expected.courseReferences.resolved += resolvedCourseKeys.size;
  expected.courseReferences.missing -= resolvedCourseKeys.size;
  expected.keytermReferences.resolved += resolvedKeytermKeys.size;
  expected.keytermReferences.missing -= resolvedKeytermKeys.size;
  const profile = {schemaVersion: 1, artifactType: "help-math-current-source-profile", expected};
  validateExpectedCatalogProfile(profile);
  const profileBytes = Buffer.from(canonicalJson(profile), "utf8");
  return {
    profile,
    profileArtifact: {
      relativePath: "current-source-profile.json",
      bytes: profileBytes.length,
      sha256: sha256Bytes(profileBytes),
      serialization: "JSON.stringify(profile,null,2)+LF",
    },
    source: {
      fileCount: postFiles.length,
      totalBytes: postFiles.reduce((sum, record) => sum + record.bytes, 0),
      manifestBytes: manifestBytes.length,
      manifestSha256: sha256Bytes(manifestBytes),
      checksumSetBytes: checksumBytes.length,
      checksumSetSha256: sha256Bytes(checksumBytes),
    },
  };
}

function provisionalRunId(now = new Date()) {
  return `${now.toISOString().replaceAll(/[-:.]/gu, "")}-${process.pid}`;
}

async function removeThrowawayTree(target, {
  allowedParent,
  requiredPrefix,
  label,
}) {
  const absolute = path.resolve(target);
  invariant(path.dirname(absolute) === path.resolve(allowedParent), `${label} is not a direct child of its allowed parent`);
  invariant(path.basename(absolute).startsWith(requiredPrefix), `${label} basename does not match its fixed prefix`);
  const rootInformation = await lstatOrNull(absolute);
  if (!rootInformation) return {removed: false};
  invariant(rootInformation.isDirectory() && !rootInformation.isSymbolicLink(), `${label} is not a real directory`);
  async function makeWritable(directory) {
    const information = await lstat(directory, {bigint: true});
    invariant(information.isDirectory() && !information.isSymbolicLink(), `${label} cleanup encountered an unsafe directory`);
    await chmod(directory, (Number(information.mode) & 0o7777) | 0o700);
    const entries = await readdir(directory, {withFileTypes: true});
    for (const entry of entries) {
      const child = path.join(directory, entry.name);
      const childInformation = await lstat(child, {bigint: true});
      invariant(!childInformation.isSymbolicLink(), `${label} cleanup refuses a symbolic link`);
      if (childInformation.isDirectory()) await makeWritable(child);
      else invariant(childInformation.isFile(), `${label} cleanup refuses a special file`);
    }
  }
  await makeWritable(absolute);
  await rm(absolute, {recursive: true, force: false});
  await syncDirectory(path.resolve(allowedParent));
  invariant(!(await lstatOrNull(absolute)), `${label} cleanup did not remove the throwaway tree`);
  return {removed: true};
}

async function immutableDescriptorAt(root, relativePath, label) {
  const {absolutePath} = await secureResolveExistingRegular(root, relativePath, label);
  const observed = await readStableFile(absolutePath, label, {immutable: true});
  return {path: portableRelative(relativePath), bytes: observed.byteCount, sha256: observed.sha256};
}

function lessonReleaseProfileFromArtifact(value, sha256) {
  const releases = value.releases.map((release) => ({
    releaseId: release.releaseId,
    memberCount: release.members.length,
  }));
  return {
    outputSha256: sha256,
    releaseCount: releases.length,
    totalMembers: releases.reduce((sum, release) => sum + release.memberCount, 0),
    releases,
  };
}

export async function observeProvisionalPostState({
  universe,
  universeIdentity,
  reviewLedger,
  reviewLedgerIdentity,
  root = PROJECT_ROOT,
} = {}) {
  assertUniverse(universe);
  validateArtifactReference(universeIdentity, "Observation universe identity");
  validateArtifactReference(reviewLedgerIdentity, "Observation review-ledger identity");
  await validateReviewLedger(reviewLedger, {
    universe,
    universeIdentity,
    root,
    requireTerminal: true,
    verifyExternalArtifacts: true,
  });
  await assertCurrentUniverse(universe, {projectRoot: root});
  const {approved, withheld} = partitionReviewedRecords(universe, reviewLedger);
  const projected = await projectPostState({root, universe, approved});
  const {
    assertCatalogSummaryMatchesProfile,
    cloneTreeCopyOnWrite,
    copyWorkingSetToStagedSource,
    createWorkingCopy,
    syncTreeDurably,
  } = await import("./lib/fla-swf-counterpart-transaction.mjs");
  const {buildHelpMathCatalog} = await import("./build-help-math-catalog.mjs");
  const projectRoot = path.resolve(root);
  const sourceRoot = path.join(projectRoot, "source-assets/flash/HELP MATH_ORIGINAL FILES");
  const sourceParent = path.dirname(sourceRoot);
  const runId = provisionalRunId();
  const clonePrefix = ".HELP MATH_ORIGINAL FILES.fla-swf-counterpart-provisional-";
  const cloneRoot = path.join(sourceParent, `${clonePrefix}${runId}`);
  const observationBase = path.join(projectRoot, "work/fla-swf-counterpart-successor-provisional");
  await ensureSafeDirectory(observationBase);
  const observationRoot = path.join(observationBase, `observation-${runId}`);
  invariant(!(await lstatOrNull(observationRoot)), "Provisional observation root already exists");
  await mkdir(observationRoot, {mode: 0o700});
  await syncDirectory(observationBase);
  const workingRoot = path.join(observationRoot, "working-copy-throwaway");
  const catalogEvidenceRoot = path.join(observationRoot, "catalog-evidence");
  const workingReceiptEvidencePath = path.join(observationRoot, "working-copy-receipt.json");
  const transcriptPath = path.join(observationRoot, "observation-transcript.json");
  const receiptPath = path.join(observationRoot, "provisional-post-state-observation.json");
  let cloneCreated = false;
  let workingCreated = false;
  try {
    const clone = await cloneTreeCopyOnWrite(sourceRoot, cloneRoot);
    cloneCreated = true;
    const preplanBindingSha256 = sha256Text(canonicalJson({
      universe: universeIdentity,
      reviewLedger: reviewLedgerIdentity,
      approvedRecordSetSha256: promotionRecordSetDigest(approved),
      expectedCatalogProfileArtifact: projected.profileArtifact,
    }));
    let workingCopy;
    let copied;
    if (approved.length > 0) {
      workingCopy = await createWorkingCopy({
        records: approved,
        sourceRoot: universe.sourceRootBindings[SOURCE_ROOT_REF].absolutePath,
        workingRoot,
        planSha256: preplanBindingSha256,
      });
      workingCreated = true;
      copied = await copyWorkingSetToStagedSource({
        records: approved,
        workingFilesRoot: workingCopy.filesRoot,
        stagedSourceRoot: cloneRoot,
      });
      invariant(copied.recordSetSha256 === promotionRecordSetDigest(approved), "Provisional staged-copy record set changed");
      const workingReceiptBytes = await readStableFile(workingCopy.receiptPath, "Provisional working-copy receipt", {immutable: true});
      await writeImmutableNoClobber(workingReceiptEvidencePath, workingReceiptBytes.bytes);
    } else {
      const zeroReceipt = {
        schemaVersion: "help-math-fla-swf-counterpart-working-copy-receipt/v1",
        artifactType: "help-math-fla-swf-counterpart-working-copy-receipt",
        planSha256: preplanBindingSha256,
        recordCount: 0,
        totalBytes: 0,
        recordSetSha256: promotionRecordSetDigest([]),
        copies: [],
        status: "not-created-zero-approved-records",
      };
      await writeImmutableNoClobber(workingReceiptEvidencePath, Buffer.from(canonicalJson(zeroReceipt), "utf8"));
      workingCopy = {receipt: zeroReceipt, receiptPath: workingReceiptEvidencePath};
      copied = {copiedFileCount: 0, copiedBytes: 0, recordSetSha256: promotionRecordSetDigest([]), copies: []};
    }
    await writeImmutableNoClobber(
      path.join(catalogEvidenceRoot, "current-source-profile.json"),
      Buffer.from(canonicalJson(projected.profile), "utf8"),
    );
    const profilePath = path.join(catalogEvidenceRoot, "current-source-profile.json");
    const built = await buildHelpMathCatalog({
      source: cloneRoot,
      output: catalogEvidenceRoot,
      concurrency: 8,
      verifyKnownCounts: true,
      expectedProfile: profilePath,
      expectedProfileSha256: projected.profileArtifact.sha256,
      check: false,
    });
    invariant(JSON.stringify([...built.outputFiles].sort(compareText)) === JSON.stringify([...CATALOG_OUTPUT_FILENAMES].sort(compareText)), "Provisional catalog did not emit the exact 17 outputs");
    const freezeWritten = await writeManifest(cloneRoot, {catalogRoot: catalogEvidenceRoot, defaultPaths: false});
    const freezeVerified = await verifyManifest(cloneRoot, {catalogRoot: catalogEvidenceRoot, defaultPaths: false});
    invariant(freezeWritten.fileCount === projected.source.fileCount && freezeWritten.totalBytes === projected.source.totalBytes && freezeWritten.manifestSha256 === projected.source.manifestSha256, "Provisional source freeze differs from expected post state");
    invariant(freezeVerified.fileCount === projected.source.fileCount && freezeVerified.totalBytes === projected.source.totalBytes && freezeVerified.manifestSha256 === projected.source.manifestSha256, "Provisional verify:sources result differs from expected post state");
    const checked = await buildHelpMathCatalog({
      source: cloneRoot,
      output: catalogEvidenceRoot,
      concurrency: 8,
      verifyKnownCounts: true,
      expectedProfile: profilePath,
      expectedProfileSha256: projected.profileArtifact.sha256,
      check: true,
    });
    const lessonReleasePath = path.join(catalogEvidenceRoot, "lesson-releases.json");
    const lessonReleaseObserved = await readStableFile(lessonReleasePath, "Provisional lesson-releases output");
    const lessonReleaseValue = JSON.parse(lessonReleaseObserved.bytes);
    assertCatalogSummaryMatchesProfile(checked.summary, projected.profile, {
      lessonReleases: lessonReleaseProfileFromArtifact(lessonReleaseValue, lessonReleaseObserved.sha256),
    });
    await syncTreeDurably(catalogEvidenceRoot);
    await enforceReadOnly(catalogEvidenceRoot);
    const catalogOutputReferences = [];
    for (const filename of CATALOG_OUTPUT_FILENAMES) {
      catalogOutputReferences.push(await immutableDescriptorAt(
        projectRoot,
        projectRelativeArtifactPath(path.join(catalogEvidenceRoot, filename), projectRoot),
        `Provisional catalog output ${filename}`,
      ));
    }
    const currentSourceProfile = await immutableDescriptorAt(
      projectRoot,
      projectRelativeArtifactPath(profilePath, projectRoot),
      "Provisional current-source-profile evidence",
    );
    const sourceManifest = await immutableDescriptorAt(
      projectRoot,
      projectRelativeArtifactPath(path.join(catalogEvidenceRoot, "source-manifest.sha256"), projectRoot),
      "Provisional source-manifest evidence",
    );
    const sourceFreeze = await immutableDescriptorAt(
      projectRoot,
      projectRelativeArtifactPath(path.join(catalogEvidenceRoot, "source-freeze.json"), projectRoot),
      "Provisional source-freeze evidence",
    );
    invariant(sourceManifest.bytes === projected.source.manifestBytes && sourceManifest.sha256 === projected.source.manifestSha256, "Provisional source-manifest artifact identity changed");
    invariant(currentSourceProfile.bytes === projected.profileArtifact.bytes && currentSourceProfile.sha256 === projected.profileArtifact.sha256, "Provisional profile artifact identity changed");
    const workingReceiptEvidence = await immutableDescriptorAt(
      projectRoot,
      projectRelativeArtifactPath(workingReceiptEvidencePath, projectRoot),
      "Provisional retained working-copy receipt",
    );
    await removeThrowawayTree(cloneRoot, {allowedParent: sourceParent, requiredPrefix: clonePrefix, label: "Provisional source clone"});
    cloneCreated = false;
    if (workingCreated) {
      await removeThrowawayTree(workingRoot, {allowedParent: observationRoot, requiredPrefix: "working-copy-throwaway", label: "Provisional working copy"});
      workingCreated = false;
    }
    const transcript = {
      schemaVersion: "help-math-fla-swf-counterpart-provisional-observation-transcript/v1",
      artifactType: "help-math-fla-swf-counterpart-provisional-observation-transcript",
      runId,
      steps: [
        "native-apfs-source-clone",
        approved.length > 0 ? "byte-identical-working-copy-and-exclusive-copy" : "zero-approved-no-copy",
        "catalog-build-exact-17-outputs",
        "source-freeze-write",
        "verify-sources",
        "catalog-fail-closed-check",
        "persist-output-identities",
        "remove-source-clone-and-working-copy",
      ],
      clone,
      copied,
      freezeWritten,
      freezeVerified,
      catalog: {buildCheck: built.check, failClosedCheck: checked.check, outputFiles: built.outputFiles},
      cleanup: {sourceCloneRemoved: true, workingCopyRemoved: true},
      toolVersions: {
        node: process.version,
        nativeClone: "/bin/cp -c -R -p -P",
        catalogBuilder: "buildHelpMathCatalog/current-bound-script",
        sourceVerifier: "verifyManifest/current-bound-script",
      },
    };
    await writeImmutableNoClobber(transcriptPath, Buffer.from(canonicalJson(transcript), "utf8"));
    const transcriptReference = await immutableDescriptorAt(
      projectRoot,
      projectRelativeArtifactPath(transcriptPath, projectRoot),
      "Provisional observation transcript",
    );
    const catalogArtifacts = {
      outputs: catalogOutputReferences,
      currentSourceProfile,
      sourceManifest,
      sourceFreeze,
    };
    const receipt = {
      schemaVersion: "help-math-fla-swf-counterpart-provisional-post-state-observation/v1",
      artifactType: "help-math-fla-swf-counterpart-provisional-post-state-observation",
      status: "observed-pass",
      observedAt: new Date().toISOString(),
      method: {
        sourceCloneBackend: "/bin/cp -c -R -p -P",
        nativeApfsCloneRequired: true,
        byteIdenticalWorkingCopy: true,
        noOverwriteCopy: true,
        catalogRebuild: true,
        verifySources: true,
        catalogFailClosedCheck: true,
        throwawayRootsRemovedAfterEvidenceCapture: true,
      },
      inputs: {
        universe: {...universeIdentity},
        reviewLedger: {...reviewLedgerIdentity},
        approvedRecordSetSha256: promotionRecordSetDigest(approved),
        baseSourceManifestSha256: EXPECTED.canonical.sourceManifest.sha256,
        expectedCatalogProfileArtifact: projected.profileArtifact,
      },
      observed: {
        source: projected.source,
        expectedCatalogProfile: projected.profile,
        expectedCatalogProfileArtifact: projected.profileArtifact,
        clone: {
          backend: clone.backend,
          sourceStructureSha256: clone.sourceStructure.structureSha256,
          destinationStructureSha256: clone.destinationStructure.structureSha256,
        },
        workingCopy: {
          recordCount: approved.length,
          byteIdenticalRecords: approved.length,
          noOverwrite: true,
          recordSetSha256: promotionRecordSetDigest(approved),
        },
        catalog: {
          rebuildStatus: "passed",
          failClosedCheckStatus: "passed",
          verifySourcesStatus: "passed",
          catalogOutputCount: CATALOG_OUTPUT_FILENAMES.length,
          artifacts: catalogArtifacts,
        },
      },
      checks: {
        sourceManifestExact: true,
        sourceCountsExact: true,
        catalogProfileExact: true,
        catalogRebuildPassed: true,
        verifySourcesPassed: true,
        catalogFailClosedCheckPassed: true,
        zeroUnexpectedDestinations: true,
      },
      evidenceArtifacts: [
        ...catalogOutputReferences,
        currentSourceProfile,
        sourceManifest,
        sourceFreeze,
        workingReceiptEvidence,
        transcriptReference,
      ],
      evidenceBoundary: {
        throwawayObservationOnly: true,
        liveSourceMutated: false,
        canonicalCountsReportable: false,
        observedCanonical: false,
        publicationAllowed: false,
      },
    };
    const published = await writeImmutableNoClobber(receiptPath, Buffer.from(canonicalJson(receipt), "utf8"));
    const reference = {path: projectRelativeArtifactPath(receiptPath, projectRoot), bytes: published.bytes, sha256: published.sha256};
    await validateProvisionalPostStateObservation(reference, {
      root: projectRoot,
      universeIdentity,
      reviewLedgerIdentity,
      approved,
      projected,
    });
    return {
      status: "provisional-post-state-observed-on-throwaway-native-apfs-clone",
      approvedCopyRecords: approved.length,
      withheldRecords: withheld.length,
      observation: reference,
      catalogArtifacts,
      canonicalCountsReportable: false,
    };
  } catch (error) {
    if (cloneCreated) {
      await removeThrowawayTree(cloneRoot, {allowedParent: sourceParent, requiredPrefix: clonePrefix, label: "Failed provisional source clone"}).catch(() => {});
    }
    if (workingCreated) {
      await removeThrowawayTree(workingRoot, {allowedParent: observationRoot, requiredPrefix: "working-copy-throwaway", label: "Failed provisional working copy"}).catch(() => {});
    }
    throw error;
  }
}

async function validateProvisionalPostStateObservation(reference, {
  root,
  universeIdentity,
  reviewLedgerIdentity,
  approved,
  projected,
}) {
  validateArtifactReference(reference, "Provisional post-state observation reference");
  const file = await readImmutableJsonArtifact(root, reference.path, "Provisional post-state observation");
  invariant(file.identity.bytes === reference.bytes && file.identity.sha256 === reference.sha256, "Provisional post-state observation artifact binding changed");
  const receipt = file.value;
  exactKeys(receipt, [
    "schemaVersion", "artifactType", "status", "observedAt", "method", "inputs",
    "observed", "checks", "evidenceArtifacts", "evidenceBoundary",
  ], "Provisional post-state observation");
  invariant(receipt.schemaVersion === "help-math-fla-swf-counterpart-provisional-post-state-observation/v1", "Provisional post-state observation schema changed");
  invariant(receipt.artifactType === "help-math-fla-swf-counterpart-provisional-post-state-observation" && receipt.status === "observed-pass", "Provisional post-state observation is not a passing observation");
  validIsoTimestamp(receipt.observedAt, "Provisional post-state observedAt");
  exactKeys(receipt.method, [
    "sourceCloneBackend", "nativeApfsCloneRequired", "byteIdenticalWorkingCopy",
    "noOverwriteCopy", "catalogRebuild", "verifySources", "catalogFailClosedCheck",
    "throwawayRootsRemovedAfterEvidenceCapture",
  ], "Provisional post-state method");
  invariant(receipt.method.sourceCloneBackend === "/bin/cp -c -R -p -P", "Provisional post-state did not use the native APFS clone backend");
  for (const key of ["nativeApfsCloneRequired", "byteIdenticalWorkingCopy", "noOverwriteCopy", "catalogRebuild", "verifySources", "catalogFailClosedCheck", "throwawayRootsRemovedAfterEvidenceCapture"]) {
    invariant(receipt.method[key] === true, `Provisional post-state method ${key} is not proven`);
  }
  exactKeys(receipt.inputs, ["universe", "reviewLedger", "approvedRecordSetSha256", "baseSourceManifestSha256", "expectedCatalogProfileArtifact"], "Provisional post-state inputs");
  invariant(JSON.stringify(receipt.inputs.universe) === JSON.stringify(universeIdentity), "Provisional observation universe input changed");
  invariant(JSON.stringify(receipt.inputs.reviewLedger) === JSON.stringify(reviewLedgerIdentity), "Provisional observation review-ledger input changed");
  invariant(receipt.inputs.approvedRecordSetSha256 === promotionRecordSetDigest(approved), "Provisional observation approved record set changed");
  invariant(receipt.inputs.baseSourceManifestSha256 === EXPECTED.canonical.sourceManifest.sha256, "Provisional observation base source manifest changed");
  invariant(JSON.stringify(receipt.inputs.expectedCatalogProfileArtifact) === JSON.stringify(projected.profileArtifact), "Provisional observation expected profile input changed");
  exactKeys(receipt.observed, ["source", "expectedCatalogProfile", "expectedCatalogProfileArtifact", "clone", "workingCopy", "catalog"], "Provisional post-state observed values");
  invariant(JSON.stringify(receipt.observed.source) === JSON.stringify(projected.source), "Observed throwaway source state differs from exact projection");
  invariant(JSON.stringify(receipt.observed.expectedCatalogProfile) === JSON.stringify(projected.profile), "Observed throwaway catalog profile differs from expected profile");
  invariant(JSON.stringify(receipt.observed.expectedCatalogProfileArtifact) === JSON.stringify(projected.profileArtifact), "Observed throwaway profile artifact identity differs");
  invariant(receipt.observed.clone.backend === "/bin/cp -c -R -p -P" && receipt.observed.clone.sourceStructureSha256 === receipt.observed.clone.destinationStructureSha256, "Observed APFS clone structure is unbound or unequal");
  invariant(receipt.observed.workingCopy.recordCount === approved.length && receipt.observed.workingCopy.byteIdenticalRecords === approved.length && receipt.observed.workingCopy.noOverwrite === true && receipt.observed.workingCopy.recordSetSha256 === promotionRecordSetDigest(approved), "Observed working-copy closure changed");
  exactKeys(receipt.observed.catalog, ["rebuildStatus", "failClosedCheckStatus", "verifySourcesStatus", "catalogOutputCount", "artifacts"], "Provisional observed catalog");
  invariant(receipt.observed.catalog.rebuildStatus === "passed" && receipt.observed.catalog.failClosedCheckStatus === "passed" && receipt.observed.catalog.verifySourcesStatus === "passed", "Observed catalog/verify:sources checks did not all pass");
  invariant(receipt.observed.catalog.catalogOutputCount === 17, "Observed catalog output count is not exactly 17");
  const catalogArtifacts = receipt.observed.catalog.artifacts;
  exactKeys(catalogArtifacts, ["outputs", "currentSourceProfile", "sourceManifest", "sourceFreeze"], "Provisional catalog artifacts");
  invariant(Array.isArray(catalogArtifacts.outputs) && catalogArtifacts.outputs.length === 17, "Provisional observation must bind exact identities for 17 catalog outputs");
  const outputNames = [];
  for (const [index, artifact] of catalogArtifacts.outputs.entries()) {
    validateArtifactReference(artifact, `Provisional catalog output[${index}]`);
    outputNames.push(path.posix.basename(artifact.path));
    await verifyArtifactReference(artifact, {root, label: `Provisional catalog output[${index}]`, immutable: true});
  }
  invariant(JSON.stringify([...outputNames].sort(compareText)) === JSON.stringify([...CATALOG_OUTPUT_FILENAMES].sort(compareText)), "Provisional catalog output filename set changed");
  for (const [name, artifact] of Object.entries({
    currentSourceProfile: catalogArtifacts.currentSourceProfile,
    sourceManifest: catalogArtifacts.sourceManifest,
    sourceFreeze: catalogArtifacts.sourceFreeze,
  })) {
    validateArtifactReference(artifact, `Provisional ${name} artifact`);
    await verifyArtifactReference(artifact, {root, label: `Provisional ${name} artifact`, immutable: true});
  }
  invariant(catalogArtifacts.currentSourceProfile.bytes === projected.profileArtifact.bytes && catalogArtifacts.currentSourceProfile.sha256 === projected.profileArtifact.sha256, "Provisional observed current-source-profile identity changed");
  invariant(catalogArtifacts.sourceManifest.bytes === projected.source.manifestBytes && catalogArtifacts.sourceManifest.sha256 === projected.source.manifestSha256, "Provisional observed source-manifest identity changed");
  const checksumOutput = catalogArtifacts.outputs.find((artifact) => path.posix.basename(artifact.path) === "source-files.sha256");
  invariant(checksumOutput.bytes === projected.source.checksumSetBytes && checksumOutput.sha256 === projected.source.checksumSetSha256, "Provisional observed source-files.sha256 identity changed");
  const freezeArtifact = await readImmutableJsonArtifact(root, catalogArtifacts.sourceFreeze.path, "Provisional observed source-freeze artifact");
  invariant(freezeArtifact.identity.bytes === catalogArtifacts.sourceFreeze.bytes && freezeArtifact.identity.sha256 === catalogArtifacts.sourceFreeze.sha256, "Provisional source-freeze artifact binding changed");
  invariant(freezeArtifact.value.fileCount === projected.source.fileCount && freezeArtifact.value.totalBytes === projected.source.totalBytes && freezeArtifact.value.manifestSha256 === projected.source.manifestSha256, "Provisional source-freeze contents differ from expected source state");
  exactKeys(receipt.checks, ["sourceManifestExact", "sourceCountsExact", "catalogProfileExact", "catalogRebuildPassed", "verifySourcesPassed", "catalogFailClosedCheckPassed", "zeroUnexpectedDestinations"], "Provisional post-state checks");
  invariant(Object.values(receipt.checks).every((value) => value === true), "Provisional post-state observation contains a failed check");
  invariant(Array.isArray(receipt.evidenceArtifacts) && receipt.evidenceArtifacts.length >= 4, "Provisional post-state observation requires persisted evidence artifacts");
  const evidencePaths = new Set();
  for (const [index, artifact] of receipt.evidenceArtifacts.entries()) {
    validateArtifactReference(artifact, `Provisional observation evidence[${index}]`);
    invariant(!evidencePaths.has(artifact.path), "Provisional post-state evidence paths must be distinct");
    evidencePaths.add(artifact.path);
    await verifyArtifactReference(artifact, {root, label: `Provisional observation evidence[${index}]`, immutable: true});
  }
  invariant(receipt.evidenceBoundary.throwawayObservationOnly === true
    && receipt.evidenceBoundary.liveSourceMutated === false
    && receipt.evidenceBoundary.canonicalCountsReportable === false
    && receipt.evidenceBoundary.observedCanonical === false
    && receipt.evidenceBoundary.publicationAllowed === false,
  "Provisional post-state evidence boundary changed");
  return {reference: {...reference}, receipt};
}

function catalogArtifactsForPlan(observedArtifacts) {
  return {
    outputs: observedArtifacts.outputs.map((artifact) => ({
      path: path.posix.basename(artifact.path),
      bytes: artifact.bytes,
      sha256: artifact.sha256,
    })),
    currentSourceProfile: {
      path: "current-source-profile.json",
      bytes: observedArtifacts.currentSourceProfile.bytes,
      sha256: observedArtifacts.currentSourceProfile.sha256,
    },
    sourceManifest: {
      path: "source-manifest.sha256",
      bytes: observedArtifacts.sourceManifest.bytes,
      sha256: observedArtifacts.sourceManifest.sha256,
    },
    sourceFreeze: {
      path: "source-freeze.json",
      bytes: observedArtifacts.sourceFreeze.bytes,
      sha256: observedArtifacts.sourceFreeze.sha256,
    },
  };
}

function assertTerminalLedgerForPlan(reviewLedger, universe) {
  invariant(reviewLedger?.schemaVersion === REVIEW_SCHEMA && reviewLedger?.artifactType === REVIEW_ARTIFACT_TYPE, "Executable plan review ledger schema/type changed");
  invariant(reviewLedger.attestation?.state === "signed-complete" && reviewLedger.status === "signed-complete", "Executable plan requires a signed-complete review ledger");
  invariant(reviewLedger.records?.length === universe.records.length, "Executable plan review ledger does not cover the universe");
  const universeById = new Map(universe.records.map((record) => [record.recordId, record]));
  const receiptPaths = new Set();
  let holds = 0;
  for (const record of reviewLedger.records) {
    const universeRecord = universeById.get(record.recordId);
    invariant(universeRecord, `Executable plan review record is outside the universe: ${record.recordId}`);
    validateReviewRecord(record, universeRecord, {requireTerminal: true});
    invariant(record.review.terminal === true, `Executable plan review is nonterminal: ${record.canonicalPath}`);
    if (record.manualHoldReview.required) {
      holds += 1;
      invariant(!receiptPaths.has(record.manualHoldReview.receipt.path), "Executable plan manual-hold receipts are not distinct");
      receiptPaths.add(record.manualHoldReview.receipt.path);
    }
  }
  invariant(holds === 71 && receiptPaths.size === 71, "Executable plan requires 71 distinct manual-hold receipts");
}

export function assertNativeAtomicSwapBuildContract(contract, {
  label = "Darwin native atomic-swap build contract",
} = {}) {
  exactKeys(contract, ["schemaVersion", "source", "compiler", "compile"], label);
  invariant(
    contract.schemaVersion
      === "help-math-darwin-atomic-directory-swap-native-build-contract/v1",
    `${label} schema changed`,
  );
  exactKeys(contract.source, ["path", "bytes", "sha256"], `${label}.source`);
  invariant(
    contract.source.path === "scripts/lib/darwin-atomic-directory-swap-native.c"
      && Number.isSafeInteger(contract.source.bytes) && contract.source.bytes > 0
      && SHA256_PATTERN.test(contract.source.sha256),
    `${label} source binding is invalid`,
  );
  exactKeys(contract.compiler, ["path", "version", "sdkPath"], `${label}.compiler`);
  invariant(
    path.isAbsolute(contract.compiler.path)
      && path.normalize(contract.compiler.path) === contract.compiler.path
      && path.isAbsolute(contract.compiler.sdkPath)
      && path.normalize(contract.compiler.sdkPath) === contract.compiler.sdkPath
      && typeof contract.compiler.version === "string"
      && contract.compiler.version.trim() === contract.compiler.version
      && contract.compiler.version.length > 0,
    `${label} compiler/toolchain binding is invalid`,
  );
  exactKeys(contract.compile, [
    "driver", "sdk", "arguments", "executableSha256Policy",
  ], `${label}.compile`);
  invariant(
    contract.compile.driver === "/usr/bin/xcrun"
      && contract.compile.sdk === "macosx"
      && JSON.stringify(contract.compile.arguments)
        === JSON.stringify(["-std=c17", "-O2", "-Wall", "-Wextra", "-Werror"])
      && contract.compile.executableSha256Policy
        === "prepared-witness-and-identical-across-source-catalog-rollback-and-readme-swaps",
    `${label} compile contract changed`,
  );
  return contract;
}

export function assertImplementationBaselineBindings(repositoryBaseline, {
  receiptIdentity = repositoryBaseline?.implementationVerificationReceipt,
  completionIdentity = repositoryBaseline?.implementationVerificationCompletion,
} = {}) {
  validateArtifactReference(
    repositoryBaseline?.implementationVerificationReceipt,
    "Executable plan implementation-final baseline receipt input",
  );
  validateArtifactReference(
    repositoryBaseline?.implementationVerificationCompletion,
    "Executable plan implementation-final baseline completion input",
  );
  invariant(
    repositoryBaseline.implementationVerificationReceipt.path
      === BASELINE_RECEIPT_RELATIVE_PATH
      && JSON.stringify(repositoryBaseline.implementationVerificationReceipt)
        === JSON.stringify(receiptIdentity),
    "Executable plan implementation-final baseline receipt identity changed",
  );
  invariant(
    repositoryBaseline.implementationVerificationCompletion.path
      === BASELINE_COMPLETION_RELATIVE_PATH
      && JSON.stringify(repositoryBaseline.implementationVerificationCompletion)
        === JSON.stringify(completionIdentity),
    "Executable plan implementation-final baseline completion identity changed",
  );
  return repositoryBaseline;
}

export function assertExecutablePlan(plan, {
  universe,
  reviewLedger,
  expectedCatalogProfile = plan?.expectedCatalogProfile,
  trustedReviewerRegistryIdentity = plan?.inputs?.trustedReviewerRegistry,
  quiescenceFirstSnapshotStateIdentity = plan?.inputs?.quiescenceFirstSnapshotState,
  implementationBaselineIdentity =
    plan?.inputs?.repositoryBaseline?.implementationVerificationReceipt,
  implementationBaselineCompletionIdentity =
    plan?.inputs?.repositoryBaseline?.implementationVerificationCompletion,
} = {}) {
  assertUniverse(universe);
  assertTerminalLedgerForPlan(reviewLedger, universe);
  exactKeys(plan, [
    "schemaVersion", "artifactType", "planDate", "status", "mode", "inputs",
    "summary", "approvedCopyRecords", "withheldRecords", "digests",
    "expectedPostState", "expectedCatalogProfile", "expectedCatalogProfileArtifact",
    "executionContract", "reportingGate", "evidenceBoundary",
  ], "Executable plan");
  invariant(plan.schemaVersion === PLAN_SCHEMA && plan.artifactType === PLAN_ARTIFACT_TYPE, "Executable plan schema/type changed");
  exactKeys(plan.inputs, [
    "universe", "reviewLedger", "trustedReviewerRegistry", "repositoryBaseline",
    "expectedCatalogProfile", "provisionalPostStateObservation", "quiescenceSnapshots",
    "quiescenceFirstSnapshotState", "quiescenceScope",
  ], "Executable plan inputs");
  exactKeys(plan.inputs.repositoryBaseline, [
    "source", "sourceManifest", "sourceFiles", "currentSourceProfile",
    "implementationVerificationReceipt", "implementationVerificationCompletion",
  ], "Executable plan repositoryBaseline");
  assertImplementationBaselineBindings(plan.inputs.repositoryBaseline, {
    receiptIdentity: implementationBaselineIdentity,
    completionIdentity: implementationBaselineCompletionIdentity,
  });
  const expectedLifecycle = plan.approvedCopyRecords?.length === 0
    ? {status: "terminal-reviewed-successor-no-approved-copy-closure-plan", mode: "explicit-no-op-live-verification-closure-only"}
    : {status: "executable-reviewed-successor-promotion-plan", mode: "explicit-apply-only-no-implicit-promotion"};
  invariant(plan.status === expectedLifecycle.status && plan.mode === expectedLifecycle.mode, "Executable plan lifecycle changed");
  validateArtifactReference(plan.inputs.universe, "Executable plan universe input");
  validateArtifactReference(plan.inputs.reviewLedger, "Executable plan review-ledger input");
  validateArtifactReference(plan.inputs.trustedReviewerRegistry, "Executable plan trusted-reviewer-registry input");
  invariant(plan.inputs.trustedReviewerRegistry.path === TRUSTED_REVIEWER_REGISTRY_RELATIVE_PATH, "Executable plan trusted reviewer registry path changed");
  invariant(JSON.stringify(plan.inputs.trustedReviewerRegistry) === JSON.stringify(trustedReviewerRegistryIdentity), "Executable plan trusted reviewer registry identity changed");
  invariant(plan.inputs.universe.recordSetSha256 === undefined, "Universe artifact reference contains an unexpected unbound field");
  invariant(Array.isArray(plan.inputs.quiescenceSnapshots) && plan.inputs.quiescenceSnapshots.length === 2, "Executable plan requires two quiescence snapshots");
  plan.inputs.quiescenceSnapshots.forEach((reference, index) => validateArtifactReference(reference, `Executable plan quiescence snapshot[${index}]`));
  invariant(
    JSON.stringify(plan.inputs.quiescenceSnapshots.map((reference) => reference.path)) === JSON.stringify(QUIESCENCE_SNAPSHOT_RELATIVE_PATHS),
    "Executable plan must use only the two canonical producer-owned quiescence snapshot paths",
  );
  invariant(plan.inputs.quiescenceSnapshots[0].sha256 !== plan.inputs.quiescenceSnapshots[1].sha256, "Executable plan quiescence snapshots are not distinct");
  validateArtifactReference(plan.inputs.quiescenceFirstSnapshotState, "Executable plan first-snapshot orchestration state");
  invariant(plan.inputs.quiescenceFirstSnapshotState.path === QUIESCENCE_FIRST_SNAPSHOT_STATE_RELATIVE_PATH, "Executable plan first-snapshot orchestration state path changed");
  invariant(JSON.stringify(plan.inputs.quiescenceFirstSnapshotState) === JSON.stringify(quiescenceFirstSnapshotStateIdentity), "Executable plan first-snapshot orchestration state identity changed");
  invariant(Number.isSafeInteger(plan.inputs.quiescenceScope?.records) && plan.inputs.quiescenceScope.records > 9_700, "Executable plan lacks the deterministic full quiescence scope");
  invariant(SHA256_PATTERN.test(plan.inputs.quiescenceScope?.identitySha256), "Executable plan quiescence-scope digest is invalid");
  invariant(Array.isArray(plan.inputs.quiescenceScope.selfReferentialExclusions) && plan.inputs.quiescenceScope.selfReferentialExclusions.length === 3, "Executable plan must document the three self-referential quiescence exclusions");
  invariant(
    plan.inputs.quiescenceScope.selfReferentialExclusions.some(({artifact}) => artifact === QUIESCENCE_FIRST_SNAPSHOT_STATE_RELATIVE_PATH),
    "Executable plan must document the producer-owned first-snapshot orchestration-state exclusion",
  );
  validateArtifactReference(plan.inputs.provisionalPostStateObservation, "Executable plan provisional post-state observation");
  validateExpectedCatalogProfile(expectedCatalogProfile);
  invariant(JSON.stringify(plan.expectedCatalogProfile) === JSON.stringify(expectedCatalogProfile), "Executable plan embedded profile differs from supplied profile");
  const profileBytes = Buffer.from(canonicalJson(plan.expectedCatalogProfile), "utf8");
  exactKeys(plan.expectedCatalogProfileArtifact, ["relativePath", "bytes", "sha256", "serialization"], "Expected catalog profile artifact");
  invariant(plan.expectedCatalogProfileArtifact.relativePath === "current-source-profile.json", "Expected catalog profile relative path changed");
  invariant(plan.expectedCatalogProfileArtifact.bytes === profileBytes.length && plan.expectedCatalogProfileArtifact.sha256 === sha256Bytes(profileBytes), "Expected catalog profile artifact binding changed");
  invariant(plan.expectedCatalogProfileArtifact.serialization === "JSON.stringify(profile,null,2)+LF", "Expected catalog profile serialization changed");
  invariant(plan.inputs.expectedCatalogProfile?.embeddedAt === "expectedCatalogProfile" && plan.inputs.expectedCatalogProfile.bytes === profileBytes.length && plan.inputs.expectedCatalogProfile.sha256 === sha256Bytes(profileBytes), "Executable plan embedded profile input binding changed");
  const universeById = new Map(universe.records.map((record) => [record.recordId, record]));
  const reviewById = new Map(reviewLedger.records.map((record) => [record.recordId, record]));
  invariant(Array.isArray(plan.approvedCopyRecords) && Array.isArray(plan.withheldRecords), "Executable plan record partitions are invalid");
  invariant(plan.approvedCopyRecords.length + plan.withheldRecords.length === 620, "Executable plan record partitions do not cover 620 records");
  const seen = new Set();
  for (const record of plan.approvedCopyRecords) {
    const frozen = universeById.get(record.recordId);
    const review = reviewById.get(record.recordId);
    invariant(frozen && !seen.has(record.recordId), `Approved plan record is duplicate or unknown: ${record.recordId}`);
    seen.add(record.recordId);
    invariant(record.canonicalPath === frozen.canonicalPath && record.bytes === frozen.bytes && record.sha256 === frozen.sha256 && record.sourceBindingSha256 === frozen.sourceBindingSha256, `Approved plan identity drifted: ${record.recordId}`);
    invariant(JSON.stringify(record.sourceBinding) === JSON.stringify(frozen.sourceBinding), `Approved plan source binding drifted: ${record.recordId}`);
    invariant(record.automaticCopyAllowed === false && review.review.decision === "confirmed-publication-lineage", `Approved plan record lacks reviewed publication lineage: ${record.recordId}`);
    const hold = frozen.currentDisposition !== "candidate-new-source-in-quarantine";
    if (hold) {
      invariant(record.approvalBasis === "manual-hold-confirmed-publication-lineage" && review.manualHoldReview.decision === "approved-reviewed-copy" && review.manualHoldReview.receipt, `Current hold was automatically approved: ${record.recordId}`);
    } else {
      invariant(record.approvalBasis === "ordinary-confirmed-publication-lineage" && review.manualHoldReview.decision === "not-required", `Ordinary record was approved without confirmed lineage: ${record.recordId}`);
    }
  }
  for (const record of plan.withheldRecords) {
    const frozen = universeById.get(record.recordId);
    invariant(frozen && !seen.has(record.recordId), `Withheld plan record is duplicate or unknown: ${record.recordId}`);
    seen.add(record.recordId);
    const review = reviewById.get(record.recordId);
    invariant(record.canonicalPath === frozen.canonicalPath && record.sourceBindingSha256 === frozen.sourceBindingSha256, `Withheld plan identity drifted: ${record.recordId}`);
    invariant(!(review.review.decision === "confirmed-publication-lineage" && (frozen.currentDisposition === "candidate-new-source-in-quarantine" || review.manualHoldReview.decision === "approved-reviewed-copy")), `Eligible reviewed record was incorrectly withheld: ${record.recordId}`);
  }
  invariant(seen.size === 620, "Executable plan partition closure changed");
  invariant(plan.digests.approvedRecordSetSha256 === promotionRecordSetDigest(plan.approvedCopyRecords), "Approved plan record-set digest changed");
  invariant(plan.digests.withheldRecordSetSha256 === withheldRecordSetDigest(plan.withheldRecords), "Withheld plan record-set digest changed");
  invariant(plan.expectedPostState.source.fileCount === 9_147 + plan.approvedCopyRecords.length, "Expected post source file count changed");
  invariant(plan.expectedPostState.source.totalBytes === 3_214_585_414 + plan.approvedCopyRecords.reduce((sum, record) => sum + record.bytes, 0), "Expected post source bytes changed");
  invariant(plan.expectedPostState.source.checksumSetSha256 === plan.expectedCatalogProfile.expected.checksumSetSha256, "Expected post checksum/profile binding changed");
  const postCatalogArtifacts = plan.expectedPostState.catalogArtifacts;
  exactKeys(postCatalogArtifacts, ["outputs", "currentSourceProfile", "sourceManifest", "sourceFreeze"], "Executable plan post catalog artifacts");
  invariant(Array.isArray(postCatalogArtifacts.outputs) && postCatalogArtifacts.outputs.length === 17, "Executable plan must bind exactly 17 post catalog outputs");
  const postOutputNames = postCatalogArtifacts.outputs.map((artifact, index) => {
    validateArtifactReference(artifact, `Executable plan post catalog output[${index}]`);
    return path.posix.basename(artifact.path);
  });
  invariant(JSON.stringify([...postOutputNames].sort(compareText)) === JSON.stringify([...CATALOG_OUTPUT_FILENAMES].sort(compareText)), "Executable plan post catalog output filename set changed");
  validateArtifactReference(postCatalogArtifacts.currentSourceProfile, "Executable plan post current-source-profile");
  validateArtifactReference(postCatalogArtifacts.sourceManifest, "Executable plan post source-manifest");
  validateArtifactReference(postCatalogArtifacts.sourceFreeze, "Executable plan post source-freeze");
  invariant(postCatalogArtifacts.currentSourceProfile.path === "current-source-profile.json" && postCatalogArtifacts.sourceManifest.path === "source-manifest.sha256" && postCatalogArtifacts.sourceFreeze.path === "source-freeze.json", "Executable plan post catalog singular artifact paths changed");
  invariant(postCatalogArtifacts.currentSourceProfile.bytes === plan.expectedCatalogProfileArtifact.bytes && postCatalogArtifacts.currentSourceProfile.sha256 === plan.expectedCatalogProfileArtifact.sha256, "Executable plan post profile identity changed");
  invariant(postCatalogArtifacts.sourceManifest.bytes === plan.expectedPostState.source.manifestBytes && postCatalogArtifacts.sourceManifest.sha256 === plan.expectedPostState.source.manifestSha256, "Executable plan post source-manifest identity changed");
  const postChecksum = postCatalogArtifacts.outputs.find((artifact) => path.posix.basename(artifact.path) === "source-files.sha256");
  invariant(postChecksum.bytes === plan.expectedPostState.source.checksumSetBytes && postChecksum.sha256 === plan.expectedPostState.source.checksumSetSha256, "Executable plan post source-files.sha256 identity changed");
  invariant(
    JSON.stringify(plan.expectedPostState.pairingProjection.projectedExpected) === JSON.stringify({
      pairedSwfFla: plan.expectedCatalogProfile.expected.pairedSwfFla,
      swfOnly: plan.expectedCatalogProfile.expected.swfOnly,
      flaOnly: plan.expectedCatalogProfile.expected.flaOnly,
    })
      && plan.expectedPostState.pairingProjection.observedCanonical === false
      && plan.expectedPostState.pairingProjection.publicationAllowed === false,
    "Executable plan provisional pairing boundary changed",
  );
  invariant(plan.reportingGate.canonicalCountsReportable === false, "Executable plan cannot report post-promotion canonical pairing counts");
  invariant(
    plan.executionContract.trustedReviewerRegistry === "plan.inputs.trustedReviewerRegistry"
      && JSON.stringify(plan.executionContract.requiredPreparedIndependentReviewRoles) === JSON.stringify(["schema-reviewer", "transaction-adversarial-reviewer"]),
    "Executable plan prepared-review trust-anchor contract changed",
  );
  exactKeys(plan.executionContract, [
    "source", "destination", "mutation", "catalog", "trustedReviewerRegistry",
    "requiredPreparedIndependentReviewRoles", "currentHoldsAutomaticallyCopied",
    "explicitApplyRequired", "nativeAtomicSwapHelper",
  ], "Executable plan executionContract");
  assertNativeAtomicSwapBuildContract(plan.executionContract.nativeAtomicSwapHelper);
  invariant(plan.reportingGate.requiresAppliedReceipt === true && plan.reportingGate.requiresLiveCatalogVerification === true, "Executable plan reporting gate changed");
  invariant(Object.values(plan.evidenceBoundary.acceptanceEffects).every((value) => value === false), "Executable plan acceptance boundary changed");
  return plan;
}

export async function buildExecutablePlan({
  universe,
  universeIdentity,
  reviewLedger,
  reviewLedgerIdentity,
  quiescenceSnapshots,
  provisionalPostStateObservation,
  root = PROJECT_ROOT,
} = {}) {
  assertUniverse(universe);
  validateArtifactReference(universeIdentity, "Universe identity");
  validateArtifactReference(reviewLedgerIdentity, "Review ledger identity");
  invariant(universeIdentity.path === UNIVERSE_RELATIVE_PATH, "Executable plan requires the canonical universe artifact path");
  invariant(reviewLedgerIdentity.path === REVIEW_LEDGER_RELATIVE_PATH, "Executable plan requires the canonical final review-ledger path");
  invariant(universeIdentity.bytes === Buffer.byteLength(canonicalJson(universe)) && universeIdentity.sha256 === sha256Text(canonicalJson(universe)), "Universe identity does not bind supplied universe bytes");
  invariant(reviewLedgerIdentity.bytes === Buffer.byteLength(canonicalJson(reviewLedger)) && reviewLedgerIdentity.sha256 === sha256Text(canonicalJson(reviewLedger)), "Review-ledger identity does not bind supplied ledger bytes");
  const trustedReviewerRegistry = await loadTrustedReviewerRegistry({root, universeIdentity});
  await validateReviewLedger(reviewLedger, {
    universe,
    universeIdentity,
    root,
    requireTerminal: true,
    verifyExternalArtifacts: true,
    trustedReviewerRegistry,
  });
  await assertCurrentUniverse(universe, {projectRoot: root});
  validateArtifactReference(provisionalPostStateObservation, "Provisional post-state observation reference");
  const {approved, withheld} = partitionReviewedRecords(universe, reviewLedger);
  const projected = await projectPostState({root, universe, approved});
  const provisionalObservation = await validateProvisionalPostStateObservation(provisionalPostStateObservation, {
    root,
    universeIdentity,
    reviewLedgerIdentity,
    approved,
    projected,
  });
  const implementationBaseline = await verifyImplementationBaselineCurrent({root});
  const fixedQuiescenceAllowlist = await expectedQuiescenceAllowlist({
    universe,
    universeIdentity,
    reviewLedger,
    reviewLedgerIdentity,
    additionalProjectArtifacts: [
      provisionalPostStateObservation,
      implementationBaseline.identity,
      implementationBaseline.completionIdentity,
    ],
    root,
  });
  const quiescence = await validateQuiescenceSnapshots(quiescenceSnapshots, {
    universe,
    root,
    expectedAllowlist: fixedQuiescenceAllowlist,
  });
  const firstSnapshot = quiescence.find(({path: relativePath}) => relativePath === QUIESCENCE_SNAPSHOT_RELATIVE_PATHS[0]);
  invariant(firstSnapshot, "Validated quiescence set lacks the canonical first snapshot");
  const firstSnapshotState = await loadFirstSnapshotState({
    root,
    firstSnapshotReference: {
      path: firstSnapshot.path,
      bytes: firstSnapshot.bytes,
      sha256: firstSnapshot.sha256,
    },
  });
  const currentProfile = immutableInputDescriptor(EXPECTED.canonical.currentSourceProfile);
  const nativeAtomicSwapHelper =
    await describeDarwinAtomicDirectorySwapBuildContract();
  assertNativeAtomicSwapBuildContract(nativeAtomicSwapHelper);
  const nativeSourceAllowlist = fixedQuiescenceAllowlist.filter(
    ({path: relativePath}) => relativePath
      === "project/scripts/lib/darwin-atomic-directory-swap-native.c",
  );
  invariant(
    nativeSourceAllowlist.length === 1
      && nativeSourceAllowlist[0].bytes === nativeAtomicSwapHelper.source.bytes
      && nativeSourceAllowlist[0].sha256 === nativeAtomicSwapHelper.source.sha256,
    "Native helper build contract differs from the fixed quiescence source binding",
  );
  const plan = {
    schemaVersion: PLAN_SCHEMA,
    artifactType: PLAN_ARTIFACT_TYPE,
    planDate: "2026-08-07",
    status: approved.length === 0
      ? "terminal-reviewed-successor-no-approved-copy-closure-plan"
      : "executable-reviewed-successor-promotion-plan",
    mode: approved.length === 0
      ? "explicit-no-op-live-verification-closure-only"
      : "explicit-apply-only-no-implicit-promotion",
    inputs: {
      universe: {...universeIdentity},
      reviewLedger: {...reviewLedgerIdentity},
      trustedReviewerRegistry: {...trustedReviewerRegistry.identity},
      repositoryBaseline: {
        source: {
          fileCount: 9_147,
          totalBytes: 3_214_585_414,
          manifestSha256: EXPECTED.canonical.sourceManifest.sha256,
          checksumSetSha256: EXPECTED.canonical.sourceChecksumSet.sha256,
        },
        sourceManifest: immutableInputDescriptor(EXPECTED.canonical.sourceManifest),
        sourceFiles: immutableInputDescriptor(EXPECTED.canonical.sourceFiles),
        currentSourceProfile: currentProfile,
        implementationVerificationReceipt: {...implementationBaseline.identity},
        implementationVerificationCompletion: {
          ...implementationBaseline.completionIdentity,
        },
      },
      expectedCatalogProfile: {
        embeddedAt: "expectedCatalogProfile",
        bytes: projected.profileArtifact.bytes,
        sha256: projected.profileArtifact.sha256,
      },
      provisionalPostStateObservation: {...provisionalPostStateObservation},
      quiescenceSnapshots: quiescence.map(({path: relativePath, bytes, sha256}) => ({path: relativePath, bytes, sha256})),
      quiescenceFirstSnapshotState: {
        path: QUIESCENCE_FIRST_SNAPSHOT_STATE_RELATIVE_PATH,
        ...firstSnapshotState.identity,
      },
      quiescenceScope: {
        records: fixedQuiescenceAllowlist.length,
        identitySha256: quiescenceAllowlistIdentityDigest(fixedQuiescenceAllowlist),
        algorithm: "sha256(sorted path<TAB>bytes<TAB>sha256<LF>); exact paths include all canonical source files, all 620 private candidate files, pinned catalog inputs, README, universe, trusted reviewer registry, signed review ledger, and direct review evidence",
        selfReferentialExclusions: [
          {artifact: PLAN_RELATIVE_PATH, reason: "the plan hash cannot be included in snapshots that are themselves inputs to that plan"},
          {artifact: "two-quiescence-snapshot-receipts", reason: "each snapshot is directly bound by immutable path/bytes/SHA-256 in plan.inputs.quiescenceSnapshots"},
          {artifact: QUIESCENCE_FIRST_SNAPSHOT_STATE_RELATIVE_PATH, reason: "created after the first snapshot; directly bound by immutable path/bytes/SHA-256 and enforces the producer-owned physical not-before"},
        ],
      },
    },
    summary: {
      frozenUniverseRecords: 620,
      priorDisposition: {ordinaryCandidates: 551, historicalCustodyHolds: 61, placementAliasHolds: 8},
      currentDisposition: {ordinaryCandidates: 549, historicalCustodyHolds: 61, placementAliasHolds: 10},
      currentHolds: 71,
      approvedCopyRecords: approved.length,
      approvedBytes: approved.reduce((sum, record) => sum + record.bytes, 0),
      withheldRecords: withheld.length,
      automaticApprovals: 0,
    },
    approvedCopyRecords: approved,
    withheldRecords: withheld,
    digests: {
      approvedRecordSetSha256: promotionRecordSetDigest(approved),
      approvedRecordSetAlgorithm: "sha256(sorted canonicalPath<TAB>quarantineRelativePath<TAB>bytes<TAB>sha256<TAB>sourceBindingSha256<TAB>priorDisposition<TAB>currentDisposition<TAB>approvalBasis<LF>)",
      withheldRecordSetSha256: withheldRecordSetDigest(withheld),
      withheldRecordSetAlgorithm: "sha256(sorted recordId<TAB>canonicalPath<TAB>reviewDecision<TAB>withheldReason<LF>)",
    },
    expectedPostState: {
      source: projected.source,
      catalogArtifacts: catalogArtifactsForPlan(provisionalObservation.receipt.observed.catalog.artifacts),
      catalogProfile: {
        bytes: projected.profileArtifact.bytes,
        sha256: projected.profileArtifact.sha256,
      },
      pairingProjection: {
        projectedExpected: {
          pairedSwfFla: projected.profile.expected.pairedSwfFla,
          swfOnly: projected.profile.expected.swfOnly,
          flaOnly: projected.profile.expected.flaOnly,
        },
        observedCanonical: false,
        publicationAllowed: false,
        status: "projection-only-not-reportable-before-applied-receipt-and-live-postchecks",
      },
    },
    expectedCatalogProfile: projected.profile,
    expectedCatalogProfileArtifact: projected.profileArtifact,
    executionContract: {
      source: "byte-identical-working-copy-from-bound-private-intake-only",
      destination: "no-overwrite",
      mutation: "atomic-staged-source-and-catalog-directory-swaps",
      catalog: "rebuild-and-run-verify-sources-and-fail-closed-catalog-checks",
      trustedReviewerRegistry: "plan.inputs.trustedReviewerRegistry",
      requiredPreparedIndependentReviewRoles: ["schema-reviewer", "transaction-adversarial-reviewer"],
      currentHoldsAutomaticallyCopied: false,
      explicitApplyRequired: true,
      nativeAtomicSwapHelper,
    },
    reportingGate: {
      canonicalCountsReportable: false,
      requiresAppliedReceipt: true,
      requiresLiveCatalogVerification: true,
      requiresVerifySources: true,
      requiresCatalogFailClosedCheck: true,
      statement: "Projected paired/SWF-only/FLA-only values are not canonical facts until immutable applied receipt and live postchecks pass.",
    },
    evidenceBoundary: {
      sourcePromotionOnly: true,
      pairReviewDoesNotEstablishRuntimeFidelity: true,
      acceptanceEffects: {...FALSE_ACCEPTANCE_EFFECTS},
    },
  };
  assertExecutablePlan(plan, {
    universe,
    reviewLedger,
    expectedCatalogProfile: projected.profile,
    trustedReviewerRegistryIdentity: trustedReviewerRegistry.identity,
    quiescenceFirstSnapshotStateIdentity: {
      path: QUIESCENCE_FIRST_SNAPSHOT_STATE_RELATIVE_PATH,
      ...firstSnapshotState.identity,
    },
    implementationBaselineIdentity: implementationBaseline.identity,
    implementationBaselineCompletionIdentity:
      implementationBaseline.completionIdentity,
  });
  return plan;
}

function usage() {
  return `Usage:
  node scripts/build-fla-swf-counterpart-successor-plan.mjs --advance-plan
  node scripts/build-fla-swf-counterpart-successor-plan.mjs --write
  node scripts/build-fla-swf-counterpart-successor-plan.mjs --check
  node scripts/build-fla-swf-counterpart-successor-plan.mjs --build-universe
  node scripts/build-fla-swf-counterpart-successor-plan.mjs --publish-review-ledger --review-ledger <candidate.json>
  node scripts/build-fla-swf-counterpart-successor-plan.mjs --validate-review --review-ledger <candidate.json>
  node scripts/build-fla-swf-counterpart-successor-plan.mjs --observe-provisional
  node scripts/build-fla-swf-counterpart-successor-plan.mjs --check-plan
  node scripts/build-fla-swf-counterpart-successor-plan.mjs --prepare-authoring-copy --record-id <frozen-record-id>

--write publishes only the immutable 620-record universe and an unsigned work
candidate. It never publishes the final review ledger or an executable plan.
With no arguments, --advance-plan is selected. Re-run it after the reported
not-before time to capture the second >=60-second quiescence snapshot and
publish the executable plan.`;
}

export function parseArguments(argv) {
  const result = {mode: null, quiescenceSnapshots: []};
  if (argv.length === 0) return {...result, mode: "advance-plan"};
  const modes = new Set([
    "--write", "--check", "--build-universe", "--publish-review-ledger",
    "--validate-review", "--observe-provisional", "--check-plan",
    "--advance-plan", "--prepare-authoring-copy",
  ]);
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--help" || argument === "-h") return {help: true};
    if (modes.has(argument)) {
      invariant(result.mode === null, "Choose exactly one mode");
      result.mode = argument.slice(2);
      continue;
    }
    if (["--review-ledger", "--record-id"].includes(argument)) {
      const value = argv[index + 1];
      invariant(value && !value.startsWith("--"), `${argument} requires a path`);
      if (argument === "--review-ledger") {
        invariant(result.reviewLedger === undefined, "--review-ledger may be supplied only once");
        result.reviewLedger = path.resolve(value);
      } else if (argument === "--record-id") {
        invariant(result.recordId === undefined, "--record-id may be supplied only once");
        result.recordId = value;
      }
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${argument}`);
  }
  invariant(result.mode, "Choose a mode; use --help for usage");
  return result;
}

async function readJsonAtAbsolute(filePath, label, {immutable = true} = {}) {
  const observed = await readStableFile(path.resolve(filePath), label, {immutable});
  let value;
  try {
    value = JSON.parse(observed.bytes);
  } catch (error) {
    throw new Error(`${label} is not valid JSON: ${error.message}`);
  }
  return {value, identity: {bytes: observed.byteCount, sha256: observed.sha256}};
}

function projectRelativeArtifactPath(absolutePath, root = PROJECT_ROOT) {
  const relative = path.relative(path.resolve(root), path.resolve(absolutePath)).split(path.sep).join("/");
  return portableRelative(relative, "Project artifact path");
}

async function loadFrozenUniverse(root = PROJECT_ROOT) {
  const file = await readImmutableJsonArtifact(root, UNIVERSE_RELATIVE_PATH, "Frozen successor universe");
  assertUniverse(file.value);
  return file;
}

async function loadFinalReviewLedger(root = PROJECT_ROOT) {
  return readImmutableJsonArtifact(root, REVIEW_LEDGER_RELATIVE_PATH, "Final successor review ledger");
}

async function expectedV1Invalidation(root = PROJECT_ROOT) {
  const [universe, unsigned, incorrectInvalidation] = await Promise.all([
    readImmutableJsonArtifact(root, V1_UNIVERSE_RELATIVE_PATH, "Invalidated v1 successor universe"),
    readImmutableJsonArtifact(root, V1_UNSIGNED_REVIEW_RELATIVE_PATH, "Invalidated v1 unsigned review candidate"),
    readImmutableJsonArtifact(root, V1_INCORRECT_INVALIDATION_RELATIVE_PATH, "Superseded incorrect v1 invalidation receipt"),
  ]);
  invariant(!(await lstatOrNull(path.join(root, V1_REVIEW_LEDGER_RELATIVE_PATH))), "A v1 final review ledger exists; automatic v1 invalidation requires manual incident review");
  invariant(!(await lstatOrNull(path.join(root, V1_PLAN_RELATIVE_PATH))), "A v1 executable plan exists; automatic v1 invalidation requires manual incident review");
  return {
    schemaVersion: "help-math-fla-swf-counterpart-successor-invalidation/v2",
    artifactType: "help-math-fla-swf-counterpart-successor-invalidation",
    invalidatedAt: "2026-08-08T01:10:00.000+08:00",
    detectedAfterPublication: true,
    status: "v1-failed-superseded-no-authorization",
    supersededIncorrectInvalidation: {
      ...incorrectInvalidation.identity,
      defect: "invalidatedAt was recorded as midnight, before the v1 artifact publication; this v2 receipt corrects the historical timestamp without overwriting v1",
      mayBeConsumed: false,
    },
    invalidatedArtifacts: {
      universe: {...universe.identity},
      unsignedReviewCandidate: {...unsigned.identity},
      finalReviewLedgerPresent: false,
      executablePlanPresent: false,
    },
    reasons: [
      "v1 universe records omitted the required priorIntakeDecision field",
      "v1 current holds did not use the required withheld-pending-manual-review promotionEligibility literal",
    ],
    effectiveSuccessor: {
      universePath: UNIVERSE_RELATIVE_PATH,
      unsignedReviewCandidatePath: UNSIGNED_REVIEW_RELATIVE_PATH,
      finalReviewLedgerPath: REVIEW_LEDGER_RELATIVE_PATH,
      executablePlanPath: PLAN_RELATIVE_PATH,
      requiredSchemaVersion: UNIVERSE_SCHEMA,
    },
    claims: {
      v1MayBeConsumedByReview: false,
      v1MayBeConsumedByPlan: false,
      v1MayBeConsumedByPromotion: false,
      sourceMutationAuthorized: false,
      canonicalCountsReportable: false,
    },
    retention: "preserve-v1-universe-and-unsigned-candidate-byte-for-byte-as-failed-evidence",
  };
}

async function commandWrite(root = PROJECT_ROOT) {
  const invalidation = await expectedV1Invalidation(root);
  const invalidationWrite = await writeImmutableNoClobber(
    path.join(root, V1_INVALIDATION_RELATIVE_PATH),
    Buffer.from(canonicalJson(invalidation), "utf8"),
  );
  const universe = await buildUniverse({root});
  const universeBytes = Buffer.from(canonicalJson(universe), "utf8");
  const universeWrite = await writeImmutableNoClobber(path.join(root, UNIVERSE_RELATIVE_PATH), universeBytes);
  const unsigned = prepareUnsignedReviewLedger(universe, {
    universePath: UNIVERSE_RELATIVE_PATH,
    universeBytes: universeBytes.length,
    universeSha256: sha256Bytes(universeBytes),
  });
  await validateReviewLedger(unsigned, {
    universe,
    universeIdentity: {path: UNIVERSE_RELATIVE_PATH, bytes: universeBytes.length, sha256: sha256Bytes(universeBytes)},
  });
  const unsignedWrite = await writeImmutableNoClobber(
    path.join(root, UNSIGNED_REVIEW_RELATIVE_PATH),
    Buffer.from(canonicalJson(unsigned), "utf8"),
  );
  const trustedReviewerRegistryPresent = Boolean(await lstatOrNull(
    path.join(root, TRUSTED_REVIEWER_REGISTRY_RELATIVE_PATH),
  ));
  return {
    status: "universe-frozen-review-and-plan-blocked",
    invalidatedV1: {path: V1_INVALIDATION_RELATIVE_PATH, ...invalidationWrite},
    universe: {path: UNIVERSE_RELATIVE_PATH, ...universeWrite, records: 620},
    unsignedReviewCandidate: {path: UNSIGNED_REVIEW_RELATIVE_PATH, ...unsignedWrite},
    finalReviewLedgerPublished: false,
    executablePlanPublished: false,
    blockers: [
      ...(!trustedReviewerRegistryPresent
        ? ["externally provisioned immutable trusted-reviewer registry is absent"]
        : []),
      "620 explicit terminal pair reviews are absent",
      "every terminal review, including explicit unresolved, requires complete typed metadata and a physical Animate authoring-audit or failed-attempt receipt",
      "71 current holds require 71 distinct manual receipts",
      "signed-complete review attestation is absent",
      "two fixed-scope zero-writer quiescence snapshots at least 60 seconds apart are absent",
      "an observed throwaway APFS-clone catalog rebuild receipt is absent",
    ],
  };
}

async function commandCheck(root = PROJECT_ROOT) {
  const expectedInvalidation = await expectedV1Invalidation(root);
  const invalidationFile = await readImmutableJsonArtifact(root, V1_INVALIDATION_RELATIVE_PATH, "V1 successor invalidation receipt");
  invariant(canonicalJson(invalidationFile.value) === canonicalJson(expectedInvalidation), "V1 invalidation/supersession receipt changed");
  const universeFile = await loadFrozenUniverse(root);
  const current = await assertCurrentUniverse(universeFile.value, {projectRoot: root});
  const unsignedFile = await readImmutableJsonArtifact(root, UNSIGNED_REVIEW_RELATIVE_PATH, "Unsigned successor review candidate");
  const expectedUnsigned = prepareUnsignedReviewLedger(universeFile.value, {
    universePath: UNIVERSE_RELATIVE_PATH,
    universeBytes: universeFile.identity.bytes,
    universeSha256: universeFile.identity.sha256,
  });
  invariant(canonicalJson(unsignedFile.value) === canonicalJson(expectedUnsigned), "Unsigned successor review candidate changed from deterministic preparation");
  await validateReviewLedger(unsignedFile.value, {
    universe: universeFile.value,
    universeIdentity: universeFile.identity,
  });
  return {
    status: "frozen-universe-and-unsigned-review-candidate-current",
    invalidatedV1: invalidationFile.identity,
    current,
    universe: universeFile.identity,
    unsignedReviewCandidate: unsignedFile.identity,
    finalReviewLedgerPublished: (await lstatOrNull(path.join(root, REVIEW_LEDGER_RELATIVE_PATH))) !== null,
    executablePlanPublished: (await lstatOrNull(path.join(root, PLAN_RELATIVE_PATH))) !== null,
  };
}

async function commandValidateReview(options, root = PROJECT_ROOT) {
  invariant(options.reviewLedger, "--validate-review requires --review-ledger <candidate.json>");
  const universeFile = await loadFrozenUniverse(root);
  await assertCurrentUniverse(universeFile.value, {projectRoot: root});
  const candidate = await readJsonAtAbsolute(options.reviewLedger, "Review-ledger candidate", {immutable: true});
  const validation = await validateReviewLedger(candidate.value, {
    universe: universeFile.value,
    universeIdentity: universeFile.identity,
    root,
    requireTerminal: true,
    verifyExternalArtifacts: true,
  });
  return {status: "review-ledger-candidate-valid-terminal-signed-complete", candidate: candidate.identity, validation};
}

async function commandPublishReview(options, root = PROJECT_ROOT) {
  const result = await commandValidateReview(options, root);
  const candidate = await readJsonAtAbsolute(options.reviewLedger, "Review-ledger candidate", {immutable: true});
  const published = await writeImmutableNoClobber(
    path.join(root, REVIEW_LEDGER_RELATIVE_PATH),
    Buffer.from(canonicalJson(candidate.value), "utf8"),
  );
  return {...result, status: "review-ledger-published-signed-complete", published: {path: REVIEW_LEDGER_RELATIVE_PATH, ...published}};
}

async function commandObserveProvisional(root = PROJECT_ROOT) {
  const universeFile = await loadFrozenUniverse(root);
  const reviewFile = await loadFinalReviewLedger(root);
  return observeProvisionalPostState({
    universe: universeFile.value,
    universeIdentity: universeFile.identity,
    reviewLedger: reviewFile.value,
    reviewLedgerIdentity: reviewFile.identity,
    root,
  });
}

async function commandPrepareAuthoringCopy(options, root = PROJECT_ROOT) {
  invariant(options.recordId, "--prepare-authoring-copy requires --record-id <frozen-record-id>");
  const universeFile = await loadFrozenUniverse(root);
  await assertCurrentUniverse(universeFile.value, {projectRoot: root});
  return prepareAuthoringWorkingCopy({
    universe: universeFile.value,
    universeIdentity: universeFile.identity,
    recordId: options.recordId,
    root,
  });
}

async function loadOrCreateAdvanceBinding({universeFile, reviewFile, root}) {
  const bindingPath = path.join(root, ADVANCE_BINDING_RELATIVE_PATH);
  let bindingFile;
  if (!(await lstatOrNull(bindingPath))) {
    const observation = await observeProvisionalPostState({
      universe: universeFile.value,
      universeIdentity: universeFile.identity,
      reviewLedger: reviewFile.value,
      reviewLedgerIdentity: reviewFile.identity,
      root,
    });
    const binding = {
      schemaVersion: "help-math-fla-swf-counterpart-plan-advance-binding/v1",
      artifactType: "help-math-fla-swf-counterpart-plan-advance-binding",
      createdAt: new Date().toISOString(),
      universe: universeFile.identity,
      reviewLedger: reviewFile.identity,
      provisionalPostStateObservation: observation.observation,
      evidenceBoundary: {
        orchestrationPointerOnly: true,
        sourceMutationAuthorized: false,
        canonicalCountsReportable: false,
      },
    };
    await writeImmutableNoClobber(bindingPath, Buffer.from(canonicalJson(binding), "utf8"));
  }
  bindingFile = await readImmutableJsonArtifact(root, ADVANCE_BINDING_RELATIVE_PATH, "Plan-advance binding");
  exactKeys(bindingFile.value, [
    "schemaVersion", "artifactType", "createdAt", "universe", "reviewLedger",
    "provisionalPostStateObservation", "evidenceBoundary",
  ], "Plan-advance binding");
  invariant(
    bindingFile.value.schemaVersion === "help-math-fla-swf-counterpart-plan-advance-binding/v1"
      && bindingFile.value.artifactType === "help-math-fla-swf-counterpart-plan-advance-binding",
    "Plan-advance binding schema/type changed",
  );
  validIsoTimestamp(bindingFile.value.createdAt, "Plan-advance binding createdAt");
  invariant(JSON.stringify(bindingFile.value.universe) === JSON.stringify(universeFile.identity), "Plan-advance binding universe changed");
  invariant(JSON.stringify(bindingFile.value.reviewLedger) === JSON.stringify(reviewFile.identity), "Plan-advance binding review ledger changed");
  validateArtifactReference(bindingFile.value.provisionalPostStateObservation, "Plan-advance provisional observation");
  exactKeys(bindingFile.value.evidenceBoundary, ["orchestrationPointerOnly", "sourceMutationAuthorized", "canonicalCountsReportable"], "Plan-advance evidence boundary");
  invariant(
    bindingFile.value.evidenceBoundary.orchestrationPointerOnly === true
      && bindingFile.value.evidenceBoundary.sourceMutationAuthorized === false
      && bindingFile.value.evidenceBoundary.canonicalCountsReportable === false,
    "Plan-advance evidence boundary changed",
  );
  return bindingFile;
}

async function loadSnapshotReference(relativePath, root) {
  const file = await readImmutableJsonArtifact(root, relativePath, "Scoped quiescence snapshot");
  return {path: relativePath, bytes: file.identity.bytes, sha256: file.identity.sha256};
}

export async function loadFirstSnapshotState({root, firstSnapshotReference}) {
  const file = await readImmutableJsonArtifact(root, QUIESCENCE_FIRST_SNAPSHOT_STATE_RELATIVE_PATH, "First-snapshot orchestration state");
  exactKeys(file.value, [
    "schemaVersion", "artifactType", "createdAt", "firstSnapshot", "minimumSeparationMs",
    "notBefore", "producer", "evidenceBoundary",
  ], "First-snapshot orchestration state");
  invariant(
    file.value.schemaVersion === "help-math-fla-swf-counterpart-quiescence-first-snapshot-state/v1"
      && file.value.artifactType === "help-math-fla-swf-counterpart-quiescence-first-snapshot-state",
    "First-snapshot orchestration state schema/type changed",
  );
  validIsoTimestamp(file.value.createdAt, "First-snapshot state createdAt");
  validIsoTimestamp(file.value.notBefore, "First-snapshot state notBefore");
  invariant(JSON.stringify(file.value.firstSnapshot) === JSON.stringify(firstSnapshotReference), "First-snapshot state artifact binding changed");
  invariant(file.value.minimumSeparationMs === 60_000 && Date.parse(file.value.notBefore) - Date.parse(file.value.createdAt) >= 60_000, "First-snapshot state minimum separation changed");
  exactKeys(file.value.producer, ["script", "mode"], "First-snapshot state producer");
  invariant(file.value.producer.script === "scripts/build-fla-swf-counterpart-successor-plan.mjs" && file.value.producer.mode === "advance-plan-only", "First-snapshot state producer changed");
  exactKeys(file.value.evidenceBoundary, ["externalSnapshotImportAllowed", "backdatingAllowed", "sourceMutationAuthorized"], "First-snapshot state evidence boundary");
  invariant(Object.values(file.value.evidenceBoundary).every((value) => value === false), "First-snapshot state evidence boundary changed");
  return file;
}

async function commandAdvancePlan(root = PROJECT_ROOT) {
  if (await lstatOrNull(path.join(root, PLAN_RELATIVE_PATH))) return commandCheckPlan(root);
  const preparation = await commandWrite(root);
  if (!(await lstatOrNull(path.join(root, REVIEW_LEDGER_RELATIVE_PATH)))) {
    return {
      status: "blocked-awaiting-final-signed-review-ledger",
      preparation,
      requiredPath: REVIEW_LEDGER_RELATIVE_PATH,
      nextCommand: "npm run source:counterparts:plan -- --publish-review-ledger --review-ledger <immutable-signed-candidate.json>",
      canonicalCountsReportable: false,
    };
  }
  const [universeFile, reviewFile] = await Promise.all([
    loadFrozenUniverse(root),
    loadFinalReviewLedger(root),
  ]);
  await assertCurrentUniverse(universeFile.value, {projectRoot: root});
  await validateReviewLedger(reviewFile.value, {
    universe: universeFile.value,
    universeIdentity: universeFile.identity,
    root,
    requireTerminal: true,
    verifyExternalArtifacts: true,
  });
  const bindingFile = await loadOrCreateAdvanceBinding({universeFile, reviewFile, root});
  const {approved} = partitionReviewedRecords(universeFile.value, reviewFile.value);
  const projected = await projectPostState({root, universe: universeFile.value, approved});
  await validateProvisionalPostStateObservation(bindingFile.value.provisionalPostStateObservation, {
    root,
    universeIdentity: universeFile.identity,
    reviewLedgerIdentity: reviewFile.identity,
    approved,
    projected,
  });
  const implementationBaseline = await verifyImplementationBaselineCurrent({root});
  const fixedAllowlist = await expectedQuiescenceAllowlist({
    universe: universeFile.value,
    universeIdentity: universeFile.identity,
    reviewLedger: reviewFile.value,
    reviewLedgerIdentity: reviewFile.identity,
    additionalProjectArtifacts: [
      bindingFile.value.provisionalPostStateObservation,
      implementationBaseline.identity,
      implementationBaseline.completionIdentity,
    ],
    root,
  });
  const firstPath = QUIESCENCE_SNAPSHOT_RELATIVE_PATHS[0];
  const secondPath = QUIESCENCE_SNAPSHOT_RELATIVE_PATHS[1];
  if (!(await lstatOrNull(path.join(root, firstPath)))) {
    invariant(!(await lstatOrNull(path.join(root, secondPath))), "Second quiescence snapshot exists without the first snapshot");
    invariant(!(await lstatOrNull(path.join(root, QUIESCENCE_FIRST_SNAPSHOT_STATE_RELATIVE_PATH))), "First-snapshot orchestration state exists without the first snapshot");
    const first = await captureQuiescenceSnapshot({
      universe: universeFile.value,
      expectedAllowlist: fixedAllowlist,
      root,
      outputRelativePath: firstPath,
    });
    const stateCreatedAt = new Date().toISOString();
    const firstSnapshotState = {
      schemaVersion: "help-math-fla-swf-counterpart-quiescence-first-snapshot-state/v1",
      artifactType: "help-math-fla-swf-counterpart-quiescence-first-snapshot-state",
      createdAt: stateCreatedAt,
      firstSnapshot: first.reference,
      minimumSeparationMs: 60_000,
      notBefore: new Date(Date.parse(stateCreatedAt) + 60_000).toISOString(),
      producer: {script: "scripts/build-fla-swf-counterpart-successor-plan.mjs", mode: "advance-plan-only"},
      evidenceBoundary: {externalSnapshotImportAllowed: false, backdatingAllowed: false, sourceMutationAuthorized: false},
    };
    await writeImmutableNoClobber(
      path.join(root, QUIESCENCE_FIRST_SNAPSHOT_STATE_RELATIVE_PATH),
      Buffer.from(canonicalJson(firstSnapshotState), "utf8"),
    );
    return {
      status: "first-quiescence-snapshot-captured-awaiting-60-second-separation",
      observation: bindingFile.value.provisionalPostStateObservation,
      firstSnapshot: first.reference,
      rerunNotBefore: firstSnapshotState.notBefore,
      nextCommand: "npm run source:counterparts:plan",
      canonicalCountsReportable: false,
    };
  }
  const firstFile = await readImmutableJsonArtifact(root, firstPath, "First scoped quiescence snapshot");
  const firstValidated = validateQuiescenceSnapshotValue(firstFile.value, {universe: universeFile.value, label: "First scoped quiescence snapshot"});
  invariant(await lstatOrNull(path.join(root, QUIESCENCE_FIRST_SNAPSHOT_STATE_RELATIVE_PATH)), "First quiescence snapshot exists without immutable first-snapshot orchestration state");
  const firstSnapshotReference = {path: firstPath, bytes: firstFile.identity.bytes, sha256: firstFile.identity.sha256};
  const firstSnapshotState = await loadFirstSnapshotState({root, firstSnapshotReference});
  const [firstInformation, stateInformation] = await Promise.all([
    lstat(path.join(root, firstPath), {bigint: true}),
    lstat(path.join(root, QUIESCENCE_FIRST_SNAPSHOT_STATE_RELATIVE_PATH), {bigint: true}),
  ]);
  const physicalNotBefore = Number(
    (firstInformation.birthtimeNs > stateInformation.birthtimeNs
      ? firstInformation.birthtimeNs
      : stateInformation.birthtimeNs) / 1_000_000n,
  ) + 60_000;
  const notBefore = Math.max(firstValidated.capturedAtMs + 60_000, Date.parse(firstSnapshotState.value.notBefore), physicalNotBefore);
  if (!(await lstatOrNull(path.join(root, secondPath)))) {
    if (Date.now() < notBefore) {
      return {
        status: "waiting-for-minimum-60-second-quiescence-separation",
        firstSnapshot: firstFile.identity,
        rerunNotBefore: new Date(notBefore).toISOString(),
        nextCommand: "npm run source:counterparts:plan",
        canonicalCountsReportable: false,
      };
    }
    await captureQuiescenceSnapshot({
      universe: universeFile.value,
      expectedAllowlist: fixedAllowlist,
      root,
      outputRelativePath: secondPath,
    });
  }
  const quiescenceSnapshots = await Promise.all([
    loadSnapshotReference(firstPath, root),
    loadSnapshotReference(secondPath, root),
  ]);
  await validateQuiescenceSnapshots(quiescenceSnapshots, {
    universe: universeFile.value,
    root,
    expectedAllowlist: fixedAllowlist,
  });
  const plan = await buildExecutablePlan({
    universe: universeFile.value,
    universeIdentity: universeFile.identity,
    reviewLedger: reviewFile.value,
    reviewLedgerIdentity: reviewFile.identity,
    quiescenceSnapshots,
    provisionalPostStateObservation: bindingFile.value.provisionalPostStateObservation,
    root,
  });
  const published = await writeImmutableNoClobber(path.join(root, PLAN_RELATIVE_PATH), Buffer.from(canonicalJson(plan), "utf8"));
  const checked = await commandCheckPlan(root);
  return {
    ...checked,
    status: "executable-successor-plan-published-and-current-no-source-mutation",
    publication: {path: PLAN_RELATIVE_PATH, ...published},
  };
}

export async function commandCheckPlan(root = PROJECT_ROOT) {
  invariant(await lstatOrNull(path.join(root, PLAN_RELATIVE_PATH)), `Executable successor plan is missing: ${PLAN_RELATIVE_PATH}`);
  const [universeFile, reviewFile, planFile] = await Promise.all([
    loadFrozenUniverse(root),
    loadFinalReviewLedger(root),
    readImmutableJsonArtifact(root, PLAN_RELATIVE_PATH, "Executable successor plan"),
  ]);
  const trustedReviewerRegistry = await loadTrustedReviewerRegistry({root, universeIdentity: universeFile.identity});
  const implementationBaseline = await verifyImplementationBaselineCurrent({
    root,
    reference:
      planFile.value.inputs.repositoryBaseline.implementationVerificationReceipt,
  });
  const nativeAtomicSwapHelper =
    await describeDarwinAtomicDirectorySwapBuildContract();
  invariant(
    JSON.stringify(nativeAtomicSwapHelper)
      === JSON.stringify(planFile.value.executionContract.nativeAtomicSwapHelper),
    "Executable plan native-helper source/toolchain contract is no longer current",
  );
  assertExecutablePlan(planFile.value, {
    universe: universeFile.value,
    reviewLedger: reviewFile.value,
    expectedCatalogProfile: planFile.value.expectedCatalogProfile,
    trustedReviewerRegistryIdentity: trustedReviewerRegistry.identity,
    quiescenceFirstSnapshotStateIdentity: planFile.value.inputs.quiescenceFirstSnapshotState,
    implementationBaselineIdentity: implementationBaseline.identity,
    implementationBaselineCompletionIdentity:
      implementationBaseline.completionIdentity,
  });
  await assertCurrentUniverse(universeFile.value, {projectRoot: root});
  await validateReviewLedger(reviewFile.value, {
    universe: universeFile.value,
    universeIdentity: universeFile.identity,
    root,
    requireTerminal: true,
    verifyExternalArtifacts: true,
    trustedReviewerRegistry,
  });
  const fixedQuiescenceAllowlist = await expectedQuiescenceAllowlist({
    universe: universeFile.value,
    universeIdentity: universeFile.identity,
    reviewLedger: reviewFile.value,
    reviewLedgerIdentity: reviewFile.identity,
    additionalProjectArtifacts: [
      planFile.value.inputs.provisionalPostStateObservation,
      implementationBaseline.identity,
      implementationBaseline.completionIdentity,
    ],
    root,
  });
  invariant(planFile.value.inputs.quiescenceScope.records === fixedQuiescenceAllowlist.length && planFile.value.inputs.quiescenceScope.identitySha256 === quiescenceAllowlistIdentityDigest(fixedQuiescenceAllowlist), "Executable plan fixed quiescence scope changed");
  const firstSnapshotState = await loadFirstSnapshotState({
    root,
    firstSnapshotReference: planFile.value.inputs.quiescenceSnapshots[0],
  });
  invariant(
    planFile.value.inputs.quiescenceFirstSnapshotState.path === QUIESCENCE_FIRST_SNAPSHOT_STATE_RELATIVE_PATH
      && planFile.value.inputs.quiescenceFirstSnapshotState.bytes === firstSnapshotState.identity.bytes
      && planFile.value.inputs.quiescenceFirstSnapshotState.sha256 === firstSnapshotState.identity.sha256,
    "Executable plan first-snapshot orchestration state artifact binding changed",
  );
  await validateQuiescenceSnapshots(planFile.value.inputs.quiescenceSnapshots, {
    universe: universeFile.value,
    root,
    expectedAllowlist: fixedQuiescenceAllowlist,
  });
  return {status: "executable-successor-plan-current-no-source-mutation", plan: planFile.identity};
}

export async function main(argv = process.argv.slice(2)) {
  const options = parseArguments(argv);
  if (options.help) {
    process.stdout.write(`${usage()}\n`);
    return;
  }
  let result;
  if (options.mode === "write") result = await commandWrite();
  else if (options.mode === "check") result = await commandCheck();
  else if (options.mode === "build-universe") result = await buildUniverse();
  else if (options.mode === "validate-review") result = await commandValidateReview(options);
  else if (options.mode === "publish-review-ledger") result = await commandPublishReview(options);
  else if (options.mode === "observe-provisional") result = await commandObserveProvisional();
  else if (options.mode === "check-plan") result = await commandCheckPlan();
  else if (options.mode === "advance-plan") result = await commandAdvancePlan();
  else if (options.mode === "prepare-authoring-copy") result = await commandPrepareAuthoringCopy(options);
  process.stdout.write(canonicalJson(result));
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  main().catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}
