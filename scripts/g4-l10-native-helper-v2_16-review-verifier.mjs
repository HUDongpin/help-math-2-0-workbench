#!/usr/bin/env node

import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { constants as fsConstants } from "node:fs";
import {
  access,
  lstat,
  open,
  readdir,
  realpath,
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const CANONICAL_ROOT = "/Volumes/WestWorld/HELP MATH 2.0";
export const SELF = `${CANONICAL_ROOT}/scripts/g4-l10-native-helper-v2_16-review-verifier.mjs`;
const TARGET = `${CANONICAL_ROOT}/docs/G4_L10_NATIVE_HELPER_V2_14_SECURITY_CONTRACT_SUCCESSOR.md`;
const PROTOCOL = `${CANONICAL_ROOT}/docs/G4_L10_NATIVE_HELPER_V2_16_REVIEW_PROTOCOL_SUCCESSOR.md`;
const FOCUSED_TEST = `${CANONICAL_ROOT}/scripts/g4-l10-native-helper-v2_16-review-verifier.test.mjs`;
const V213 = `${CANONICAL_ROOT}/docs/G4_L10_NATIVE_HELPER_V2_13_SECURITY_CONTRACT_SUCCESSOR.md`;
const V212 = `${CANONICAL_ROOT}/docs/G4_L10_NATIVE_HELPER_V2_12_SECURITY_CONTRACT_SUCCESSOR.md`;
const HISTORY = `${CANONICAL_ROOT}/reports/g4-l10-native-helper-strict-v2-14-history-closure-v1.json`;

const SCOPES = Object.freeze(["schema", "adversarial", "whole"]);
const REQUIRED_TOOLS = Object.freeze([
  "/usr/bin/shasum",
  "/usr/bin/wc",
  "/usr/bin/iconv",
  "/usr/bin/stat",
  "/usr/bin/xattr",
  "/bin/ls",
  "/usr/bin/sed",
  "/usr/bin/tr",
]);
const HISTORY_PREFIX = "g4-l10-native-helper-v2-14-";
const HEX64 = /^[0-9a-f]{64}$/;
const UINT = /^(0|[1-9][0-9]*)$/;

const CORE_INPUTS = Object.freeze([
  { role: "target", absolutePath: TARGET },
  { role: "protocol", absolutePath: PROTOCOL },
  { role: "verifier", absolutePath: SELF },
  { role: "focused-test", absolutePath: FOCUSED_TEST },
  { role: "v2.13-predecessor", absolutePath: V213 },
  { role: "v2.12-ledger-source", absolutePath: V212 },
  { role: "history-closure", absolutePath: HISTORY },
]);

const EXPECTED = Object.freeze({
  target: {
    bytes: 50310,
    lfCount: 173,
    finalLf: true,
    mode: "0444",
    sha256: "a86c726ca5e3ae89cfb110c1a3dedb751c3cb2c51d1b737a908a91ddd0bf9510",
  },
  v213: {
    bytes: 19964,
    lfCount: 322,
    finalLf: true,
    mode: "0444",
    sha256: "e8395f34d83b4a9e12fbe426473a7f97afd1b35dfcb20b613813351c21e0e123",
  },
  v212: {
    bytes: 22002,
    lfCount: 435,
    finalLf: true,
    mode: "0444",
    sha256: "7874c4dee7f66203f6485bcac73dd8112a962ca258d63eb15e13001dd7d81a4b",
  },
  history: {
    sha256: "67d10b77decee152a7a6ffeaa13c44708d81d49870dd24bd824afae599d9a6d1",
  },
  hmg4gl4: {
    rowCount: 57,
    bytes: 2811,
    sha256: "088ffbf94d7fc0c32c59af1575d3d2d393ff62475487b71a34fc9aa4e5fa7a3b",
    domainSha256: "2bb9189a08cc95b0690cac14d7b95a8750d99799d9e53f5cdf4cf8413a3a47a9",
  },
  hmg4al3: {
    rowCount: 21,
    edgeCount: 23,
    targetCount: 12,
    bytes: 5064,
    sha256: "2ff22afbae318ee9dad10ed2cad0a28f55479fff4c05ae194febd200473409ad",
    domainSha256: "276023765967427a64c110e53ef119a8f557df4409749d866cc3812c1014484e",
  },
  hmg4pe1: {
    rowCount: 21,
    paragraphCount: 42,
    bytes: 33705,
    sha256: "f4cdd9d5d2ee797e05fc3a63d32af0281ebd19e4e07f58dc2c485235f4aa099d",
    domainSha256: "1c8fbfc16a57e294a4824b3388c6d396fcb2369105c4006815addbbbabca8851",
  },
  hmg4fr3: {
    rowCount: 3,
    bytes: 587,
    sha256: "477d9d3375fd579bb9c5cdd8ee38ff4947b218234395f20a7c1ab72ead22e9bb",
    domainSha256: "ecfefa4e0426805a5baa22fc7a47d929cfd7891a18cbd7e2f41cafebd9e68e54",
  },
});

const PROTOCOL_MARKERS = Object.freeze([
  "P0 V215-REVIEW-SET-OWNERSHIP-AND-RECEIPT-REPLAY-UNBOUND",
  "P0 V215-PARSED-INPUT-SNAPSHOT-TOCTOU-UNBOUND",
  "P1 V215-CANONICAL-ABSOLUTE-ROOT-IDENTITY-UNBOUND",
  "P1 V215-ERROR-TAXONOMY-AND-FAILED-RECEIPT-PRESERVATION-DIVERGE",
  "No HMG4RB4 or HMG4RB successor may be created.",
  "ATTEMPT_RECEIPT_UNPRESERVED_NO_VERDICT",
  "There is no same-review-set Phase B retry.",
  "Peter Hu's named original-runtime operator status remains inactive.",
]);

class UsageFault extends Error {
  constructor(message) {
    super(message);
    this.name = "UsageFault";
  }
}

class EvidenceInputMismatch extends Error {
  constructor(message, details = undefined) {
    super(message);
    this.name = "EvidenceInputMismatch";
    this.details = details;
  }
}

function invariant(condition, message, details = undefined) {
  if (!condition) throw new EvidenceInputMismatch(message, details);
}

export function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function sortedValue(value) {
  if (Array.isArray(value)) return value.map(sortedValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value).sort().map((key) => [key, sortedValue(value[key])]),
    );
  }
  return value;
}

export function canonicalJson(value) {
  return JSON.stringify(sortedValue(value));
}

function receiptBytes(value) {
  return Buffer.from(`${JSON.stringify(sortedValue(value), null, 2)}\n`, "utf8");
}

export function addReceiptId(kind, value) {
  const receiptId = sha256(Buffer.from(`G4L10-V216-${kind}\n${canonicalJson(value)}\n`, "utf8"));
  return { ...value, receiptId };
}

export function validReceiptId(kind, value) {
  if (!value || typeof value !== "object" || typeof value.receiptId !== "string") return false;
  const { receiptId, ...body } = value;
  return addReceiptId(kind, body).receiptId === receiptId;
}

export function computeReviewSetDigest(value) {
  const { reviewSetDigest: _ignored, ...body } = value;
  return sha256(Buffer.from(`G4L10-V216-REVIEW-SET\n${canonicalJson(body)}\n`, "utf8"));
}

function countLf(bytes) {
  let count = 0;
  for (const byte of bytes) if (byte === 0x0a) count += 1;
  return count;
}

function decodeUtf8(bytes) {
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

function exactKeys(value, keys) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
}

function exactStringArray(a, b) {
  return Array.isArray(a) && a.length === b.length && a.every((entry, index) => entry === b[index]);
}

function portableMode(stat) {
  return (Number(stat.mode) & 0o7777).toString(8).padStart(4, "0");
}

function decimal(value) {
  return String(value);
}

function stableStatProjection(stat) {
  return {
    dev: decimal(stat.dev),
    ino: decimal(stat.ino),
    mode: portableMode(stat),
    nlink: Number(stat.nlink),
    bytes: Number(stat.size),
    mtimeNs: decimal(stat.mtimeNs),
    ctimeNs: decimal(stat.ctimeNs),
    regularFile: stat.isFile(),
    directory: stat.isDirectory(),
  };
}

function sameObject(left, right) {
  return left.dev === right.dev && left.ino === right.ino;
}

function sameStableStat(left, right) {
  return canonicalJson(left) === canonicalJson(right);
}

function bindingMatches(actual, expected) {
  const keys = [
    "absolutePath",
    "resolvedPath",
    "dev",
    "ino",
    "mode",
    "nlink",
    "bytes",
    "lfCount",
    "finalLf",
    "sha256",
  ];
  return keys.every((key) => actual[key] === expected[key]);
}

export function closedAuthority() {
  return {
    implementation: false,
    helperTest: false,
    helperExecution: false,
    protectedInstallation: false,
    runtimeLaunch: false,
    apply: false,
    recover: false,
    v28Transition: false,
    acceptance: false,
    strictCompletion: false,
    sourcePromotion: false,
    integration: false,
    release: false,
    publication: false,
  };
}

function summarizeError(error) {
  return {
    name: String(error?.name ?? "Error").slice(0, 100),
    code: typeof error?.code === "string" ? error.code : "UNCLASSIFIED",
    message: String(error?.message ?? error).slice(0, 1000),
    details: error?.details === undefined ? null : error.details,
  };
}

export function classifyFailure(command, error) {
  if (error instanceof EvidenceInputMismatch && command === "evidence") {
    return "EVIDENCE_INPUT_MISMATCH";
  }
  if (command === "evidence") return "MECHANICAL_ERROR_NO_VERDICT_NO_RETRY";
  return "PREFLIGHT_RETRYABLE_NOT_EVIDENCE";
}

async function safePhysicalTmpOutput(output) {
  if (!path.isAbsolute(output)) throw new UsageFault("receipt output must be absolute");
  const parent = path.dirname(output);
  const leaf = path.basename(output);
  if (!leaf || leaf === "." || leaf === "..") throw new UsageFault("receipt output leaf is invalid");
  const physicalTmp = await realpath("/tmp");
  const physicalParent = await realpath(parent);
  const relative = path.relative(physicalTmp, physicalParent);
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new UsageFault("receipt parent must be one reviewer-unique directory below physical /tmp");
  }
  if (relative.includes(path.sep)) {
    throw new UsageFault("receipt parent must be directly below physical /tmp");
  }
  const parentStat = await lstat(parent, { bigint: true });
  const physicalStat = await lstat(physicalParent, { bigint: true });
  const parentProjection = stableStatProjection(parentStat);
  const physicalProjection = stableStatProjection(physicalStat);
  if (!parentProjection.directory || !sameObject(parentProjection, physicalProjection)) {
    throw new UsageFault("receipt parent path does not identify its physical directory");
  }
  if (Number(parentStat.uid) !== process.getuid() || portableMode(parentStat) !== "0700") {
    throw new UsageFault("receipt parent must be current-UID-owned mode 0700");
  }
  return { parent, physicalParent };
}

export async function validateReviewSetOutputCustody(manifest) {
  validateReviewSetManifestShape(manifest);
  const reviewerParents = [];
  for (const reviewer of manifest.reviewers) {
    const outputs = [
      reviewer.preflight.successOutput,
      reviewer.preflight.errorOutput,
      reviewer.evidence.successOutput,
      reviewer.evidence.errorOutput,
    ];
    const custody = [];
    for (const output of outputs) custody.push(await safePhysicalTmpOutput(output));
    const physicalParents = custody.map((entry) => entry.physicalParent);
    invariant(
      new Set(physicalParents).size === 1,
      `reviewer ${reviewer.scope} outputs do not share one physical parent`,
      { outputs, physicalParents },
    );
    reviewerParents.push(physicalParents[0]);
  }
  invariant(
    new Set(reviewerParents).size === reviewerParents.length,
    "reviewer output parents are not reviewer-unique",
    { reviewerParents },
  );
  return reviewerParents;
}

export async function writeNoClobberReceipt(output, value) {
  const { physicalParent } = await safePhysicalTmpOutput(output);
  invariant(Number.isInteger(fsConstants.O_NOFOLLOW), "O_NOFOLLOW is unavailable");
  const flags = fsConstants.O_WRONLY | fsConstants.O_CREAT | fsConstants.O_EXCL | fsConstants.O_NOFOLLOW;
  const handle = await open(output, flags, 0o600);
  try {
    await handle.writeFile(receiptBytes(value));
    await handle.sync();
  } finally {
    await handle.close();
  }
  const directory = await open(
    physicalParent,
    fsConstants.O_RDONLY | fsConstants.O_DIRECTORY | fsConstants.O_NOFOLLOW,
  );
  try {
    await directory.sync();
  } finally {
    await directory.close();
  }
}

async function assertRootStillHeld(rootHandle, expectedRoot) {
  const held = stableStatProjection(await rootHandle.stat({ bigint: true }));
  const pathStat = stableStatProjection(await lstat(CANONICAL_ROOT, { bigint: true }));
  const resolved = await realpath(CANONICAL_ROOT);
  invariant(resolved === CANONICAL_ROOT, "canonical root realpath changed", { resolved });
  invariant(held.directory && pathStat.directory, "canonical root is not a directory");
  invariant(sameObject(held, pathStat), "canonical root pathname detached from retained descriptor", { held, pathStat });
  invariant(held.dev === expectedRoot.dev && held.ino === expectedRoot.ino, "canonical root device/inode differs from review-set binding", { held, expectedRoot });
  return held;
}

async function openCanonicalRoot(expectedRoot) {
  invariant(fileURLToPath(import.meta.url) === SELF, "verifier is not executing from its canonical absolute path", {
    actual: fileURLToPath(import.meta.url),
    expected: SELF,
  });
  invariant(process.cwd() === CANONICAL_ROOT, "current directory is not the exact canonical root", {
    actual: process.cwd(),
    expected: CANONICAL_ROOT,
  });
  invariant(await realpath(process.cwd()) === CANONICAL_ROOT, "current directory realpath is not canonical root");
  invariant(Number.isInteger(fsConstants.O_NOFOLLOW) && Number.isInteger(fsConstants.O_DIRECTORY), "required directory flags unavailable");
  const handle = await open(
    CANONICAL_ROOT,
    fsConstants.O_RDONLY | fsConstants.O_DIRECTORY | fsConstants.O_NOFOLLOW,
  );
  try {
    await assertRootStillHeld(handle, expectedRoot);
    return handle;
  } catch (error) {
    await handle.close();
    throw error;
  }
}

async function openOneSnapshot(absolutePath, expectedBinding, {
  rootHandle = null,
  expectedRoot = null,
  afterOpen = null,
  requireCanonicalPath = true,
} = {}) {
  invariant(Number.isInteger(fsConstants.O_NOFOLLOW), "O_NOFOLLOW is unavailable");
  if (rootHandle) await assertRootStillHeld(rootHandle, expectedRoot);
  if (requireCanonicalPath) {
    invariant(absolutePath.startsWith(`${CANONICAL_ROOT}/`), "input path escapes canonical root", { absolutePath });
    invariant(await realpath(absolutePath) === absolutePath, "input realpath differs from canonical absolute path", { absolutePath });
  }
  const handle = await open(absolutePath, fsConstants.O_RDONLY | fsConstants.O_NOFOLLOW);
  try {
    const before = stableStatProjection(await handle.stat({ bigint: true }));
    const pathBefore = stableStatProjection(await lstat(absolutePath, { bigint: true }));
    invariant(before.regularFile && pathBefore.regularFile, "snapshot input is not a regular file", { absolutePath });
    invariant(before.nlink === 1 && pathBefore.nlink === 1, "snapshot input link count is not one", { absolutePath, before, pathBefore });
    invariant(sameObject(before, pathBefore), "snapshot pathname differs from retained descriptor before read", { absolutePath, before, pathBefore });
    if (afterOpen) await afterOpen({ handle, before, absolutePath });
    const bytes = await handle.readFile();
    const after = stableStatProjection(await handle.stat({ bigint: true }));
    const pathAfter = stableStatProjection(await lstat(absolutePath, { bigint: true }));
    invariant(sameStableStat(before, after), "retained descriptor identity changed during snapshot", { absolutePath, before, after });
    invariant(sameObject(after, pathAfter), "snapshot pathname differs from retained descriptor after read", { absolutePath, after, pathAfter });
    if (rootHandle) await assertRootStillHeld(rootHandle, expectedRoot);
    const resolvedPath = await realpath(absolutePath);
    if (requireCanonicalPath) invariant(resolvedPath === absolutePath, "input realpath changed after snapshot", { absolutePath, resolvedPath });
    const binding = {
      absolutePath,
      resolvedPath,
      dev: before.dev,
      ino: before.ino,
      mode: before.mode,
      nlink: before.nlink,
      bytes: bytes.length,
      lfCount: countLf(bytes),
      finalLf: bytes.length > 0 && bytes[bytes.length - 1] === 0x0a,
      sha256: sha256(bytes),
    };
    if (expectedBinding) {
      invariant(bindingMatches(binding, expectedBinding), "snapshot differs from review-set fixed input binding", {
        actual: binding,
        expected: expectedBinding,
      });
    }
    return { handle, bytes, binding };
  } catch (error) {
    await handle.close();
    throw error;
  }
}

export async function snapshotFixtureFile(absolutePath, expectedBinding = null, options = {}) {
  const snapshot = await openOneSnapshot(absolutePath, expectedBinding, {
    ...options,
    requireCanonicalPath: false,
  });
  try {
    return { bytes: snapshot.bytes, binding: snapshot.binding };
  } finally {
    await snapshot.handle.close();
  }
}

export function validateParserBufferBinding(bytes, binding) {
  invariant(Buffer.isBuffer(bytes), "parser input must be a Buffer");
  invariant(bytes.length === binding.bytes, "parser buffer length differs from snapshot binding");
  invariant(sha256(bytes) === binding.sha256, "parser buffer digest differs from snapshot binding");
  return true;
}

function validateOutputPair(phase, label) {
  invariant(
    exactKeys(phase, ["attemptOrdinal", "successOutput", "errorOutput"]),
    `${label} has unexpected fields`,
  );
  invariant(phase.attemptOrdinal === 1, `${label}.attemptOrdinal must be 1`);
  invariant(typeof phase.successOutput === "string" && path.isAbsolute(phase.successOutput), `${label}.successOutput must be absolute`);
  invariant(typeof phase.errorOutput === "string" && path.isAbsolute(phase.errorOutput), `${label}.errorOutput must be absolute`);
  invariant(phase.successOutput !== phase.errorOutput, `${label} success/error outputs must differ`);
}

function validateFixedInputRow(row, index) {
  const label = `fixedInputs[${index}]`;
  invariant(
    exactKeys(row, [
      "role",
      "absolutePath",
      "resolvedPath",
      "dev",
      "ino",
      "mode",
      "nlink",
      "bytes",
      "lfCount",
      "finalLf",
      "sha256",
    ]),
    `${label} has unexpected fields`,
  );
  invariant(typeof row.role === "string" && row.role.length > 0 && !/[\u0000\r\n]/.test(row.role), `${label}.role is invalid`);
  invariant(path.isAbsolute(row.absolutePath) && row.absolutePath.startsWith(`${CANONICAL_ROOT}/`), `${label}.absolutePath is outside canonical root`);
  invariant(row.resolvedPath === row.absolutePath, `${label}.resolvedPath must equal absolutePath`);
  invariant(UINT.test(row.dev) && UINT.test(row.ino), `${label} device/inode must be canonical unsigned decimal`);
  invariant(/^0[0-7]{3}$/.test(row.mode), `${label}.mode is invalid`);
  invariant(row.nlink === 1, `${label}.nlink must be one`);
  invariant(Number.isSafeInteger(row.bytes) && row.bytes >= 0, `${label}.bytes is invalid`);
  invariant(Number.isSafeInteger(row.lfCount) && row.lfCount >= 0, `${label}.lfCount is invalid`);
  invariant(typeof row.finalLf === "boolean", `${label}.finalLf is invalid`);
  invariant(HEX64.test(row.sha256), `${label}.sha256 is invalid`);
}

export function validateReviewSetManifestShape(value) {
  invariant(
    exactKeys(value, [
      "schemaVersion",
      "artifactType",
      "authority",
      "protocolVersion",
      "sourceThreadId",
      "userAuthorizationTurnId",
      "userAuthorizationTextSha256",
      "reviewSetNonce",
      "canonicalRoot",
      "fixedInputs",
      "reviewers",
      "reviewSetDigest",
    ]),
    "review-set manifest has unexpected fields",
  );
  invariant(value.schemaVersion === 1, "review-set schemaVersion must be 1");
  invariant(value.artifactType === "g4-l10-native-helper-v2-16-authenticated-review-set", "review-set artifactType mismatch");
  invariant(value.authority === "correlation-only-never-self-authorizing", "review-set authority must remain correlation-only");
  invariant(value.protocolVersion === "v2.16", "review-set protocolVersion mismatch");
  for (const key of ["sourceThreadId", "userAuthorizationTurnId"]) {
    invariant(typeof value[key] === "string" && value[key].length > 0 && !/[\u0000\r\n]/.test(value[key]), `${key} is invalid`);
  }
  invariant(HEX64.test(value.userAuthorizationTextSha256), "userAuthorizationTextSha256 is invalid");
  invariant(HEX64.test(value.reviewSetNonce), "reviewSetNonce is invalid");
  invariant(
    exactKeys(value.canonicalRoot, ["declared", "resolved", "dev", "ino"]),
    "canonicalRoot has unexpected fields",
  );
  invariant(value.canonicalRoot.declared === CANONICAL_ROOT, "canonicalRoot.declared mismatch");
  invariant(value.canonicalRoot.resolved === CANONICAL_ROOT, "canonicalRoot.resolved mismatch");
  invariant(UINT.test(value.canonicalRoot.dev) && UINT.test(value.canonicalRoot.ino), "canonicalRoot device/inode is invalid");

  invariant(Array.isArray(value.fixedInputs) && value.fixedInputs.length >= CORE_INPUTS.length, "fixedInputs is incomplete");
  value.fixedInputs.forEach(validateFixedInputRow);
  const inputPaths = value.fixedInputs.map((row) => row.absolutePath);
  const inputRoles = value.fixedInputs.map((row) => row.role);
  invariant(new Set(inputPaths).size === inputPaths.length, "fixedInputs contains duplicate paths");
  invariant(new Set(inputRoles).size === inputRoles.length, "fixedInputs contains duplicate roles");
  for (let index = 0; index < CORE_INPUTS.length; index += 1) {
    invariant(value.fixedInputs[index].role === CORE_INPUTS[index].role, `fixedInputs core role order mismatch at ${index}`);
    invariant(value.fixedInputs[index].absolutePath === CORE_INPUTS[index].absolutePath, `fixedInputs core path order mismatch at ${index}`);
  }

  invariant(Array.isArray(value.reviewers) && value.reviewers.length === 3, "reviewers must contain exactly three rows");
  const outputPaths = [];
  const ids = [];
  const nonces = [];
  for (let index = 0; index < value.reviewers.length; index += 1) {
    const reviewer = value.reviewers[index];
    invariant(
      exactKeys(reviewer, ["scope", "taskSystemId", "reviewerNonce", "preflight", "evidence"]),
      `reviewers[${index}] has unexpected fields`,
    );
    invariant(reviewer.scope === SCOPES[index], `reviewers[${index}].scope must be ${SCOPES[index]}`);
    invariant(typeof reviewer.taskSystemId === "string" && reviewer.taskSystemId.length > 0 && !/[\u0000\r\n]/.test(reviewer.taskSystemId), `reviewers[${index}].taskSystemId is invalid`);
    invariant(HEX64.test(reviewer.reviewerNonce), `reviewers[${index}].reviewerNonce is invalid`);
    validateOutputPair(reviewer.preflight, `reviewers[${index}].preflight`);
    validateOutputPair(reviewer.evidence, `reviewers[${index}].evidence`);
    ids.push(reviewer.taskSystemId);
    nonces.push(reviewer.reviewerNonce);
    outputPaths.push(
      reviewer.preflight.successOutput,
      reviewer.preflight.errorOutput,
      reviewer.evidence.successOutput,
      reviewer.evidence.errorOutput,
    );
  }
  invariant(new Set(ids).size === ids.length, "reviewer task IDs must be distinct");
  invariant(new Set(nonces).size === nonces.length, "reviewer nonces must be distinct");
  invariant(new Set(outputPaths).size === outputPaths.length, "all reviewer output paths must be distinct");
  invariant(HEX64.test(value.reviewSetDigest), "reviewSetDigest is invalid");
  invariant(computeReviewSetDigest(value) === value.reviewSetDigest, "reviewSetDigest does not match manifest body");
  return value;
}

export function validateInvocationBinding(manifest, {
  command,
  scope,
  reviewerTaskId,
  successOutput,
  errorOutput,
}) {
  validateReviewSetManifestShape(manifest);
  invariant(command === "preflight" || command === "evidence", "command is invalid");
  invariant(SCOPES.includes(scope), "scope is invalid");
  const reviewer = manifest.reviewers.find((row) => row.taskSystemId === reviewerTaskId);
  invariant(reviewer, "reviewer task ID is not in the authenticated review set");
  invariant(reviewer.scope === scope, "reviewer task ID is bound to a different scope", {
    expected: reviewer.scope,
    actual: scope,
  });
  const phase = reviewer[command];
  invariant(phase.successOutput === successOutput, "success output differs from authenticated review-set binding");
  invariant(phase.errorOutput === errorOutput, "error output differs from authenticated review-set binding");
  return reviewer;
}

function recoverOption(argv, key) {
  const values = [];
  for (let index = 0; index < argv.length - 1; index += 1) {
    if (argv[index] === key) values.push(argv[index + 1]);
  }
  return values.length === 1 ? values[0] : null;
}

function recoverInvocation(argv) {
  const command = argv[0] === "evidence" ? "evidence" : "preflight";
  return {
    command,
    scope: recoverOption(argv, "--scope"),
    reviewerTaskId: recoverOption(argv, "--reviewer-task-id"),
    reviewSetManifest: recoverOption(argv, "--review-set-manifest"),
    reviewSetManifestSha256: recoverOption(argv, "--review-set-manifest-sha256"),
    preflightReceipt: recoverOption(argv, "--preflight-receipt"),
    successOutput: recoverOption(argv, "--success-output"),
    errorOutput: recoverOption(argv, "--error-output"),
  };
}

function parseCli(argv) {
  if (argv.length === 0) throw new UsageFault("expected preflight or evidence");
  const command = argv[0];
  if (command !== "preflight" && command !== "evidence") {
    throw new UsageFault("first argument must be preflight or evidence");
  }
  const allowed = new Set([
    "--scope",
    "--reviewer-task-id",
    "--review-set-manifest",
    "--review-set-manifest-sha256",
    "--success-output",
    "--error-output",
    ...(command === "evidence" ? ["--preflight-receipt"] : []),
  ]);
  const values = new Map();
  for (let index = 1; index < argv.length; index += 2) {
    const key = argv[index];
    const value = argv[index + 1];
    if (!allowed.has(key)) throw new UsageFault(`unknown option: ${key}`);
    if (value === undefined || value.startsWith("--")) throw new UsageFault(`missing value for ${key}`);
    if (values.has(key)) throw new UsageFault(`duplicate option: ${key}`);
    values.set(key, value);
  }
  const required = [
    "--scope",
    "--reviewer-task-id",
    "--review-set-manifest",
    "--review-set-manifest-sha256",
    "--success-output",
    "--error-output",
    ...(command === "evidence" ? ["--preflight-receipt"] : []),
  ];
  for (const key of required) if (!values.has(key)) throw new UsageFault(`missing ${key}`);
  const scope = values.get("--scope");
  if (!SCOPES.includes(scope)) throw new UsageFault(`scope must be one of ${SCOPES.join(",")}`);
  const options = {
    command,
    scope,
    reviewerTaskId: values.get("--reviewer-task-id"),
    reviewSetManifest: path.resolve(values.get("--review-set-manifest")),
    reviewSetManifestSha256: values.get("--review-set-manifest-sha256"),
    successOutput: path.resolve(values.get("--success-output")),
    errorOutput: path.resolve(values.get("--error-output")),
    preflightReceipt: command === "evidence" ? path.resolve(values.get("--preflight-receipt")) : null,
  };
  if (!HEX64.test(options.reviewSetManifestSha256)) throw new UsageFault("review-set manifest SHA-256 must be lowercase hex");
  if (options.successOutput === options.errorOutput) throw new UsageFault("success and error output paths must differ");
  return options;
}

async function loadReviewSet(options, heldHandles) {
  const manifestSnapshot = await openOneSnapshot(options.reviewSetManifest, null, {
    requireCanonicalPath: false,
  });
  heldHandles.push(manifestSnapshot.handle);
  invariant(manifestSnapshot.binding.sha256 === options.reviewSetManifestSha256, "review-set manifest SHA-256 differs from authenticated invocation", {
    expected: options.reviewSetManifestSha256,
    actual: manifestSnapshot.binding.sha256,
  });
  invariant(["0400", "0600"].includes(manifestSnapshot.binding.mode), "review-set manifest mode must be 0400 or 0600");
  let manifest;
  try {
    manifest = JSON.parse(decodeUtf8(manifestSnapshot.bytes));
  } catch (error) {
    throw new EvidenceInputMismatch("review-set manifest is not canonical UTF-8 JSON", summarizeError(error));
  }
  validateReviewSetManifestShape(manifest);
  invariant(Buffer.from(`${JSON.stringify(sortedValue(manifest), null, 2)}\n`, "utf8").equals(manifestSnapshot.bytes), "review-set manifest bytes are not canonical pretty JSON with final LF");
  await validateReviewSetOutputCustody(manifest);
  const reviewer = validateInvocationBinding(manifest, options);
  await safePhysicalTmpOutput(options.successOutput);
  await safePhysicalTmpOutput(options.errorOutput);
  return {
    manifest,
    reviewer,
    snapshot: manifestSnapshot,
  };
}

function codeBlocks(text) {
  return [...text.matchAll(/```text\n([\s\S]*?)```/g)].map((match) => match[1]);
}

function codeBlocksAfter(text, anchor, label) {
  const offset = text.indexOf(anchor);
  if (offset < 0) throw new EvidenceInputMismatch(`${label} anchor not found`);
  return codeBlocks(text.slice(offset + anchor.length));
}

function linesFromBlock(block, label) {
  invariant(block.endsWith("\n"), `${label} lacks final LF`);
  invariant(!block.includes("\r"), `${label} contains CR`);
  const lines = block.slice(0, -1).split("\n");
  invariant(lines.every((line) => line.length > 0), `${label} has blank row`);
  return lines;
}

function findBlock(blocks, predicate, label) {
  const matches = blocks.filter((block) => {
    try {
      return predicate(linesFromBlock(block, label));
    } catch {
      return false;
    }
  });
  invariant(matches.length === 1, `${label} expected one code block`, { count: matches.length });
  return matches[0];
}

function pushCheck(errors, id, condition, expected, actual) {
  if (!condition) errors.push({ id, expected, actual });
}

function validateProtocol(text, errors) {
  for (const marker of PROTOCOL_MARKERS) {
    pushCheck(errors, `protocol-marker:${marker}`, text.includes(marker), true, false);
  }
  pushCheck(
    errors,
    "protocol-three-scopes",
    SCOPES.every((scope) => text.includes(`\`${scope}\``)),
    SCOPES,
    "one or more scope markers missing",
  );
  pushCheck(errors, "protocol-no-usage-error-status", !text.includes("- `USAGE_ERROR`"), true, false);
}

function validateOrderedSections(text, errors) {
  const headings = [
    "## 0. Direct predecessor, failed v2.13 batch, and retained scope",
    "## 1. Exact HMG4GL4 historical-ledger extension",
    "## 2. HMG4PE1 self-contained paragraph-preimage envelope",
    "## 3. New user-owned v2.14 independent-review batch",
    "## 4. Retained clean-room and V28 operational boundary",
    "## 5. Closed no-authority and Grade 4 boundary",
  ];
  const positions = headings.map((heading) => text.indexOf(heading));
  const ordered = positions.every((position) => position >= 0)
    && positions.every((position, index) => index === 0 || position > positions[index - 1]);
  pushCheck(errors, "v2.14-section-order", ordered, headings, positions);
}

function validateRetainedBoundaries(text, errors) {
  const markers = [
    "Operational freeze is false.",
    "57 writable mode-`0644` files",
    "48 native members",
    "nine non-Gate-A top-level runners",
    "553,897 total bytes",
    "cfa98f5fd9a101c35944b4ef59a8b5db36f3a799ee7821ca4e286476acea3200",
    "native-root mode `0755`",
    "The sixteen missing MP3s remain unresolved.",
    "does not itself authorize a permission transition, helper implementation, helper test, helper execution",
    "No repository-local PASS, receipt, controller, companion, publisher, or generated artifact can self-authorize.",
  ];
  for (const marker of markers) {
    pushCheck(errors, `retained-boundary:${marker}`, text.includes(marker), true, false);
  }
}

function validateHmgStructures(v214Text, v213Text, v212Text, errors) {
  const b214 = codeBlocks(v214Text);
  const b213 = codeBlocks(v213Text);

  const gl2 = findBlock(
    codeBlocksAfter(v212Text, "## 1. Exact HMG4GL2 historical finding ledger", "HMG4GL2"),
    (rows) => rows.length === 52 && rows[0] === "P1 GATE-A-A1-ABI-BINDING-ROW-COUNT",
    "HMG4GL2",
  );
  const gd3 = findBlock(
    codeBlocksAfter(v213Text, "## 1. Exact HMG4GL3 historical ledger extension", "HMG4GD3"),
    (rows) => rows.length === 3 && rows[0] === "P1 V212-V211-ALIAS-CONSOLIDATION-CROSSWALK-UNBOUND",
    "HMG4GD3",
  );
  const gd4 = findBlock(
    codeBlocksAfter(v214Text, "## 1. Exact HMG4GL4 historical-ledger extension", "HMG4GD4"),
    (rows) => rows.length === 2 && rows[0] === "P1 V213-HMG4AL3-HISTORICAL-OUTPUT-PROVENANCE-UNBOUND",
    "HMG4GD4",
  );
  const gl4 = `${gl2}${gd3}${gd4}`;
  const gl4Rows = linesFromBlock(gl4, "HMG4GL4");
  const gl4Ascii = Buffer.from(gl4, "ascii").equals(Buffer.from(gl4, "utf8"));
  pushCheck(errors, "hmg4gl4-ascii", gl4Ascii, true, gl4Ascii);
  pushCheck(errors, "hmg4gl4-row-count", gl4Rows.length === EXPECTED.hmg4gl4.rowCount, EXPECTED.hmg4gl4.rowCount, gl4Rows.length);
  pushCheck(errors, "hmg4gl4-unique", new Set(gl4Rows).size === gl4Rows.length, gl4Rows.length, new Set(gl4Rows).size);
  pushCheck(errors, "hmg4gl4-bytes", Buffer.byteLength(gl4) === EXPECTED.hmg4gl4.bytes, EXPECTED.hmg4gl4.bytes, Buffer.byteLength(gl4));
  pushCheck(errors, "hmg4gl4-sha256", sha256(Buffer.from(gl4)) === EXPECTED.hmg4gl4.sha256, EXPECTED.hmg4gl4.sha256, sha256(Buffer.from(gl4)));
  pushCheck(
    errors,
    "hmg4gl4-domain-sha256",
    sha256(Buffer.concat([Buffer.from("HMG4GL4\n"), Buffer.from(gl4)])) === EXPECTED.hmg4gl4.domainSha256,
    EXPECTED.hmg4gl4.domainSha256,
    sha256(Buffer.concat([Buffer.from("HMG4GL4\n"), Buffer.from(gl4)])),
  );

  const al3 = findBlock(
    b213,
    (rows) => rows.length === 21 && rows.every((row) => row.split("|").length === 6) && rows[0].startsWith("F|P1|V211-SEVEN-BYTE"),
    "HMG4AL3",
  );
  const alRows = linesFromBlock(al3, "HMG4AL3").map((row) => row.split("|"));
  const alBytes = Buffer.from(al3);
  const idPattern = /^[A-Z0-9_-]+$/;
  let alGrammar = true;
  const localIds = new Set();
  const targets = new Set();
  let edges = 0;
  const contributors = new Map();
  const unitPosition = { F: 0, A: 0, W: 0 };
  for (const row of alRows) {
    const [unit, priority, localId, problemHash, remediationHash, canonicalIds] = row;
    unitPosition[unit] = (unitPosition[unit] ?? 0) + 1;
    const contributor = `${unit}${unitPosition[unit]}`;
    const canonical = canonicalIds.split(",");
    alGrammar &&= ["F", "A", "W"].includes(unit)
      && priority === "P1"
      && idPattern.test(localId)
      && HEX64.test(problemHash)
      && HEX64.test(remediationHash)
      && canonical.length >= 1
      && canonical.length <= 2
      && canonical.every((id) => idPattern.test(id));
    localIds.add(`${unit}:${localId}`);
    edges += canonical.length;
    for (const target of canonical) {
      targets.add(target);
      if (!contributors.has(target)) contributors.set(target, []);
      contributors.get(target).push(contributor);
    }
  }
  pushCheck(errors, "hmg4al3-grammar", alGrammar, true, alGrammar);
  pushCheck(errors, "hmg4al3-local-unique", localIds.size === alRows.length, alRows.length, localIds.size);
  pushCheck(errors, "hmg4al3-row-count", alRows.length === EXPECTED.hmg4al3.rowCount, EXPECTED.hmg4al3.rowCount, alRows.length);
  pushCheck(errors, "hmg4al3-edge-count", edges === EXPECTED.hmg4al3.edgeCount, EXPECTED.hmg4al3.edgeCount, edges);
  pushCheck(errors, "hmg4al3-target-count", targets.size === EXPECTED.hmg4al3.targetCount, EXPECTED.hmg4al3.targetCount, targets.size);
  pushCheck(errors, "hmg4al3-bytes", alBytes.length === EXPECTED.hmg4al3.bytes, EXPECTED.hmg4al3.bytes, alBytes.length);
  pushCheck(errors, "hmg4al3-sha256", sha256(alBytes) === EXPECTED.hmg4al3.sha256, EXPECTED.hmg4al3.sha256, sha256(alBytes));
  pushCheck(
    errors,
    "hmg4al3-domain-sha256",
    sha256(Buffer.concat([Buffer.from("HMG4AL3\n"), alBytes])) === EXPECTED.hmg4al3.domainSha256,
    EXPECTED.hmg4al3.domainSha256,
    sha256(Buffer.concat([Buffer.from("HMG4AL3\n"), alBytes])),
  );

  const reverseBlock = findBlock(
    b213,
    (rows) => rows.length === 12 && rows.every((row) => /^[A-Z0-9_-]+=([FAW][0-9]+)(,[FAW][0-9]+)*$/.test(row)),
    "HMG4AL3 reverse coverage",
  );
  const reverse = new Map(linesFromBlock(reverseBlock, "HMG4AL3 reverse coverage").map((row) => {
    const [target, csv] = row.split("=");
    return [target, csv.split(",")];
  }));
  let reverseMatches = reverse.size === contributors.size;
  for (const [target, expectedContributors] of contributors) {
    reverseMatches &&= exactStringArray(reverse.get(target), expectedContributors);
  }
  pushCheck(errors, "hmg4al3-reverse-coverage", reverseMatches, Object.fromEntries(contributors), Object.fromEntries(reverse));

  const pe1 = findBlock(
    b214,
    (rows) => rows.length === 21 && rows.every((row) => row.split("|").length === 8) && rows[0].startsWith("F|P1|V211-SEVEN-BYTE"),
    "HMG4PE1",
  );
  const peRows = linesFromBlock(pe1, "HMG4PE1").map((row) => row.split("|"));
  const peBytes = Buffer.from(pe1);
  const base64Pattern = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
  let paragraphCount = 0;
  let peGrammar = true;
  let paragraphHashesMatch = true;
  for (let index = 0; index < peRows.length; index += 1) {
    const [unit, priority, localId, problemLength, problemBase64, remediationLength, remediationBase64, canonicalIds] = peRows[index];
    const al = alRows[index];
    peGrammar &&= unit === al[0] && priority === al[1] && localId === al[2] && canonicalIds === al[5];
    const encodedFields = [
      [problemLength, problemBase64, al[3]],
      [remediationLength, remediationBase64, al[4]],
    ];
    for (const [lengthText, encoded, expectedHash] of encodedFields) {
      paragraphCount += 1;
      let decoded = Buffer.alloc(0);
      let decodedText = null;
      try {
        decoded = Buffer.from(encoded, "base64");
        decodedText = decodeUtf8(decoded);
      } catch {
        peGrammar = false;
      }
      peGrammar &&= UINT.test(lengthText)
        && base64Pattern.test(encoded)
        && decoded.length === Number(lengthText)
        && decoded.toString("base64") === encoded
        && decodedText !== null
        && !/[\u0000\r\n]/.test(decodedText);
      paragraphHashesMatch &&= sha256(decoded) === expectedHash;
    }
  }
  pushCheck(errors, "hmg4pe1-grammar-and-crosswalk", peGrammar, true, peGrammar);
  pushCheck(errors, "hmg4pe1-all-paragraph-hashes", paragraphHashesMatch, true, paragraphHashesMatch);
  pushCheck(errors, "hmg4pe1-row-count", peRows.length === EXPECTED.hmg4pe1.rowCount, EXPECTED.hmg4pe1.rowCount, peRows.length);
  pushCheck(errors, "hmg4pe1-paragraph-count", paragraphCount === EXPECTED.hmg4pe1.paragraphCount, EXPECTED.hmg4pe1.paragraphCount, paragraphCount);
  pushCheck(errors, "hmg4pe1-bytes", peBytes.length === EXPECTED.hmg4pe1.bytes, EXPECTED.hmg4pe1.bytes, peBytes.length);
  pushCheck(errors, "hmg4pe1-sha256", sha256(peBytes) === EXPECTED.hmg4pe1.sha256, EXPECTED.hmg4pe1.sha256, sha256(peBytes));
  pushCheck(
    errors,
    "hmg4pe1-domain-sha256",
    sha256(Buffer.concat([Buffer.from("HMG4PE1\n"), peBytes])) === EXPECTED.hmg4pe1.domainSha256,
    EXPECTED.hmg4pe1.domainSha256,
    sha256(Buffer.concat([Buffer.from("HMG4PE1\n"), peBytes])),
  );

  const fr3 = findBlock(
    b214,
    (rows) => rows.length === 3 && rows[0].startsWith("schema|") && rows[1].startsWith("adversarial|") && rows[2].startsWith("whole|"),
    "HMG4FR3",
  );
  const frRows = linesFromBlock(fr3, "HMG4FR3").map((row) => row.split("|"));
  const frBytes = Buffer.from(fr3);
  const frGrammar = frRows.every((row) => row.length === 11)
    && exactStringArray(frRows.map((row) => row[0]), SCOPES)
    && frRows.every((row) => HEX64.test(row[5]));
  pushCheck(errors, "hmg4fr3-grammar", frGrammar, true, frGrammar);
  pushCheck(errors, "hmg4fr3-row-count", frRows.length === EXPECTED.hmg4fr3.rowCount, EXPECTED.hmg4fr3.rowCount, frRows.length);
  pushCheck(errors, "hmg4fr3-bytes", frBytes.length === EXPECTED.hmg4fr3.bytes, EXPECTED.hmg4fr3.bytes, frBytes.length);
  pushCheck(errors, "hmg4fr3-sha256", sha256(frBytes) === EXPECTED.hmg4fr3.sha256, EXPECTED.hmg4fr3.sha256, sha256(frBytes));
  pushCheck(
    errors,
    "hmg4fr3-domain-sha256",
    sha256(Buffer.concat([Buffer.from("HMG4FR3\n"), frBytes])) === EXPECTED.hmg4fr3.domainSha256,
    EXPECTED.hmg4fr3.domainSha256,
    sha256(Buffer.concat([Buffer.from("HMG4FR3\n"), frBytes])),
  );
  pushCheck(errors, "hmg4fr3-failure-interpretation", v214Text.includes("HMG4FR3 is a failure receipt, not a review result for v2.14."), true, false);

  return {
    hmg4gl4: { ...EXPECTED.hmg4gl4, verified: errors.every((entry) => !entry.id.startsWith("hmg4gl4")) },
    hmg4al3: { ...EXPECTED.hmg4al3, verified: errors.every((entry) => !entry.id.startsWith("hmg4al3")) },
    hmg4pe1: { ...EXPECTED.hmg4pe1, verified: errors.every((entry) => !entry.id.startsWith("hmg4pe1")) },
    hmg4fr3: {
      ...EXPECTED.hmg4fr3,
      interpretation: "failed-v2.13-batch-output-identity-receipt-not-v2.14-review-result",
      verified: errors.every((entry) => !entry.id.startsWith("hmg4fr3")),
    },
  };
}

function hardcodedIdentityMatches(role, binding) {
  if (role === "target") return bindingMatches(binding, { ...binding, ...EXPECTED.target });
  if (role === "v2.13-predecessor") return bindingMatches(binding, { ...binding, ...EXPECTED.v213 });
  if (role === "v2.12-ledger-source") return bindingMatches(binding, { ...binding, ...EXPECTED.v212 });
  if (role === "history-closure") return binding.sha256 === EXPECTED.history.sha256;
  return true;
}

function expectedHistoryRows(historyManifest) {
  invariant(Array.isArray(historyManifest.artifacts), "history artifacts must be an array");
  const rows = [];
  for (let index = 0; index < historyManifest.artifacts.length; index += 1) {
    const artifact = historyManifest.artifacts[index];
    invariant(typeof artifact.path === "string" && !path.isAbsolute(artifact.path), "history artifact path must be project-relative");
    const absolutePath = path.resolve(CANONICAL_ROOT, artifact.path);
    invariant(absolutePath.startsWith(`${CANONICAL_ROOT}/`), "history artifact path escapes canonical root");
    if (absolutePath === TARGET) continue;
    rows.push({
      role: `history-member-${String(index + 1).padStart(2, "0")}`,
      absolutePath,
      artifact,
    });
  }
  return rows;
}

async function historyDiscoveryPaths() {
  const reportNames = (await readdir(`${CANONICAL_ROOT}/reports`))
    .filter((name) => name.startsWith(HISTORY_PREFIX))
    .sort();
  return [
    "docs/G4_L10_NATIVE_HELPER_V2_14_SECURITY_CONTRACT_SUCCESSOR.md",
    ...reportNames.map((name) => `reports/${name}`),
  ];
}

function validateHistoryFromSnapshots(historyManifest, snapshots, discoveryBefore, discoveryAfter, errors) {
  pushCheck(errors, "history-status", historyManifest.status === "STRICT_BUT_NONQUALIFYING_CLOSED", "STRICT_BUT_NONQUALIFYING_CLOSED", historyManifest.status);
  pushCheck(errors, "history-artifact-count", Array.isArray(historyManifest.artifacts) && historyManifest.artifacts.length === 17, 17, historyManifest.artifacts?.length);
  pushCheck(errors, "history-summary-count", historyManifest.summary?.artifactCount === 17, 17, historyManifest.summary?.artifactCount);
  pushCheck(errors, "history-failed-count", historyManifest.summary?.failedBatchReceiptCount === 6, 6, historyManifest.summary?.failedBatchReceiptCount);
  pushCheck(errors, "history-activation-count", historyManifest.summary?.activationReceiptCount === 4, 4, historyManifest.summary?.activationReceiptCount);
  pushCheck(errors, "history-plan-count", historyManifest.summary?.chunkPlanCount === 6, 6, historyManifest.summary?.chunkPlanCount);
  pushCheck(errors, "history-qualifying-count", historyManifest.summary?.qualifyingReviewCount === 0, 0, historyManifest.summary?.qualifyingReviewCount);

  const falseRules = [
    "newHMG4RB4BatchesAllowed",
    "newV214PrefixedArtifactsAllowed",
    "historicalResultCanBecomePass",
    "historicalTaskOrOutputReuseAllowed",
    "implementationAuthority",
    "runtimeAuthority",
    "v28TransitionAuthority",
    "acceptanceAuthority",
    "releaseAuthority",
    "publicationAuthority",
  ];
  for (const rule of falseRules) {
    pushCheck(errors, `history-rule:${rule}`, historyManifest.rules?.[rule] === false, false, historyManifest.rules?.[rule]);
  }

  const failedIds = [
    "487d5f85f7cd3be759a8863dcbde09d4675ab68e00b91c77e415234692d0a20c",
    "4b098db0605790fa05066d55e3d3da102661be90c9b5a7191b35ec2b7bed1b08",
    "4d05187e1306c9d1da49fd5ba9a0501f2fce4a8bd165e4cb4953ec5273c1efc4",
    "ab155b63e1ffd8bdf588b0e5b69072e42542dabe99c936adbc1ad8caff289e0a",
    "ae013cdb3b78751a0d23a7699c7d054555e928b174ddfd216a4410bf99208c6f",
    "c9f781b1cc093b74af16916fa226432aa222aeafed5d18bbd8c5a0d9678522f3",
  ];
  pushCheck(errors, "history-six-failed-domain-ids", exactStringArray(historyManifest.failedHMG4RB4, failedIds), failedIds, historyManifest.failedHMG4RB4);

  const artifacts = Array.isArray(historyManifest.artifacts) ? historyManifest.artifacts : [];
  const paths = artifacts.map((entry) => entry.path);
  pushCheck(errors, "history-unique-paths", new Set(paths).size === paths.length, paths.length, new Set(paths).size);
  pushCheck(errors, "history-discovery-stable", exactStringArray(discoveryBefore, discoveryAfter), discoveryBefore, discoveryAfter);
  pushCheck(errors, "history-exact-discovery-allowlist", exactStringArray(paths, discoveryBefore), paths, discoveryBefore);

  let verifiedArtifactCount = 0;
  const failedReceiptTexts = [];
  for (const entry of artifacts) {
    const absolutePath = path.resolve(CANONICAL_ROOT, entry.path);
    const snapshot = snapshots.get(absolutePath);
    const identity = snapshot?.binding;
    const matches = identity
      && identity.bytes === entry.bytes
      && identity.lfCount === entry.lfCount
      && identity.mode === entry.mode
      && identity.sha256 === entry.sha256
      && identity.nlink === 1;
    pushCheck(errors, `history-member:${entry.path}`, Boolean(matches), entry, identity ?? null);
    if (matches) verifiedArtifactCount += 1;
    if (entry.role === "failed-batch-receipt" && snapshot) {
      try {
        failedReceiptTexts.push(decodeUtf8(snapshot.bytes));
      } catch (error) {
        pushCheck(errors, `history-member-utf8:${entry.path}`, false, "valid UTF-8", summarizeError(error));
      }
    }
  }
  for (const failedId of failedIds) {
    const containing = failedReceiptTexts.filter((text) => text.includes(failedId)).length;
    pushCheck(errors, `history-failed-domain-present:${failedId}`, containing === 1, 1, containing);
  }
  return { verifiedArtifactCount };
}

async function collectInputContext(options) {
  const handles = [];
  let rootHandle = null;
  try {
    await safePhysicalTmpOutput(options.reviewSetManifest);
    const reviewSet = await loadReviewSet(options, handles);
    rootHandle = await openCanonicalRoot(reviewSet.manifest.canonicalRoot);
    handles.push(rootHandle);
    const snapshots = new Map();

    for (let index = 0; index < CORE_INPUTS.length; index += 1) {
      const descriptor = CORE_INPUTS[index];
      const expectedBinding = reviewSet.manifest.fixedInputs[index];
      invariant(expectedBinding.role === descriptor.role, "fixed input core role mismatch");
      invariant(expectedBinding.absolutePath === descriptor.absolutePath, "fixed input core path mismatch");
      const snapshot = await openOneSnapshot(descriptor.absolutePath, expectedBinding, {
        rootHandle,
        expectedRoot: reviewSet.manifest.canonicalRoot,
      });
      handles.push(snapshot.handle);
      snapshots.set(descriptor.absolutePath, { ...snapshot, role: descriptor.role });
      invariant(hardcodedIdentityMatches(descriptor.role, snapshot.binding), `hardcoded ${descriptor.role} identity mismatch`, snapshot.binding);
    }

    let historyManifest;
    try {
      historyManifest = JSON.parse(decodeUtf8(snapshots.get(HISTORY).bytes));
    } catch (error) {
      throw new EvidenceInputMismatch("history closure is not valid UTF-8 JSON", summarizeError(error));
    }
    const historyRows = expectedHistoryRows(historyManifest);
    const requiredRows = [
      ...CORE_INPUTS,
      ...historyRows.map(({ role, absolutePath }) => ({ role, absolutePath })),
    ];
    invariant(reviewSet.manifest.fixedInputs.length === requiredRows.length, "fixedInputs does not match the exact unique input set", {
      expected: requiredRows.length,
      actual: reviewSet.manifest.fixedInputs.length,
    });
    for (let index = 0; index < requiredRows.length; index += 1) {
      invariant(reviewSet.manifest.fixedInputs[index].role === requiredRows[index].role, `fixedInputs role mismatch at ${index}`);
      invariant(reviewSet.manifest.fixedInputs[index].absolutePath === requiredRows[index].absolutePath, `fixedInputs path mismatch at ${index}`);
    }

    const discoveryBefore = await historyDiscoveryPaths();
    for (let offset = 0; offset < historyRows.length; offset += 1) {
      const row = historyRows[offset];
      const expectedBinding = reviewSet.manifest.fixedInputs[CORE_INPUTS.length + offset];
      const snapshot = await openOneSnapshot(row.absolutePath, expectedBinding, {
        rootHandle,
        expectedRoot: reviewSet.manifest.canonicalRoot,
      });
      handles.push(snapshot.handle);
      snapshots.set(row.absolutePath, { ...snapshot, role: row.role });
    }
    const discoveryAfter = await historyDiscoveryPaths();
    await assertRootStillHeld(rootHandle, reviewSet.manifest.canonicalRoot);

    return {
      reviewSet,
      rootHandle,
      snapshots,
      historyManifest,
      discoveryBefore,
      discoveryAfter,
      async recheckRoot() {
        return assertRootStillHeld(rootHandle, reviewSet.manifest.canonicalRoot);
      },
      async close() {
        const reversed = [...handles].reverse();
        const failures = [];
        for (const handle of reversed) {
          try {
            await handle.close();
          } catch (error) {
            failures.push(summarizeError(error));
          }
        }
        if (failures.length > 0) {
          const error = new Error("one or more retained descriptors failed checked close");
          error.details = failures;
          throw error;
        }
      },
    };
  } catch (error) {
    for (const handle of [...handles].reverse()) {
      try {
        await handle.close();
      } catch {
        // The original error remains primary; the final error receipt records it.
      }
    }
    throw error;
  }
}

function snapshotText(context, absolutePath) {
  const snapshot = context.snapshots.get(absolutePath);
  invariant(snapshot, "required snapshot is absent", { absolutePath });
  validateParserBufferBinding(snapshot.bytes, snapshot.binding);
  return decodeUtf8(snapshot.bytes);
}

function structuralAssessment(context) {
  const errors = [];
  const targetText = snapshotText(context, TARGET);
  const protocolText = snapshotText(context, PROTOCOL);
  const v213Text = snapshotText(context, V213);
  const v212Text = snapshotText(context, V212);
  validateProtocol(protocolText, errors);
  validateOrderedSections(targetText, errors);
  validateRetainedBoundaries(targetText, errors);
  const history = validateHistoryFromSnapshots(
    context.historyManifest,
    context.snapshots,
    context.discoveryBefore,
    context.discoveryAfter,
    errors,
  );
  const structures = validateHmgStructures(targetText, v213Text, v212Text, errors);
  return { errors, history, structures };
}

function inputSetProjection(context) {
  return context.reviewSet.manifest.fixedInputs.map((expected) => {
    const snapshot = context.snapshots.get(expected.absolutePath);
    invariant(snapshot, "input set projection is missing a snapshot", expected);
    return { role: expected.role, ...snapshot.binding };
  });
}

function inputSetDigest(rows) {
  return sha256(Buffer.from(`G4L10-V216-INPUT-SET\n${canonicalJson(rows)}\n`, "utf8"));
}

function embeddedSelfTests() {
  const checks = [];
  const add = (id, fn) => {
    try {
      fn();
      checks.push({ id, ok: true });
    } catch (error) {
      checks.push({ id, ok: false, error: summarizeError(error) });
    }
  };
  add("utf8-fatal-decoder", () => {
    if (decodeUtf8(Buffer.from("Aπ文", "utf8")) !== "Aπ文") throw new Error("valid UTF-8 changed");
    let rejected = false;
    try {
      decodeUtf8(Buffer.from([0xc3, 0x28]));
    } catch {
      rejected = true;
    }
    if (!rejected) throw new Error("invalid UTF-8 accepted");
  });
  add("sha256-known-answer", () => {
    if (sha256(Buffer.from("abc")) !== "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad") {
      throw new Error("SHA-256 known answer mismatch");
    }
  });
  add("receipt-domain", () => {
    const receipt = addReceiptId("SELFTEST", { b: 2, a: 1 });
    if (!validReceiptId("SELFTEST", receipt)) throw new Error("receipt ID did not validate");
  });
  add("closed-authority", () => {
    if (!Object.values(closedAuthority()).every((value) => value === false)) {
      throw new Error("authority effect opened");
    }
  });
  return checks;
}

function syntaxCheck(absolutePath) {
  const result = spawnSync(process.execPath, ["--check", absolutePath], {
    cwd: CANONICAL_ROOT,
    encoding: "utf8",
    timeout: 60000,
  });
  return {
    ok: result.status === 0 && result.signal === null,
    exitCode: result.status,
    signal: result.signal,
    stdout: String(result.stdout ?? "").slice(0, 2000),
    stderr: String(result.stderr ?? "").slice(0, 2000),
  };
}

function reviewBinding(options, context) {
  const { manifest, reviewer, snapshot } = context.reviewSet;
  return {
    reviewSetManifestAbsolutePath: options.reviewSetManifest,
    reviewSetManifestSha256: snapshot.binding.sha256,
    reviewSetDigest: manifest.reviewSetDigest,
    sourceThreadId: manifest.sourceThreadId,
    userAuthorizationTurnId: manifest.userAuthorizationTurnId,
    userAuthorizationTextSha256: manifest.userAuthorizationTextSha256,
    reviewSetNonce: manifest.reviewSetNonce,
    orderedTaskIds: manifest.reviewers.map((row) => row.taskSystemId),
    scope: options.scope,
    reviewerTaskId: options.reviewerTaskId,
    reviewerNonce: reviewer.reviewerNonce,
  };
}

function phaseBinding(options, context) {
  const phase = context.reviewSet.reviewer[options.command];
  return {
    phase: options.command,
    attemptOrdinal: phase.attemptOrdinal,
    successOutput: options.successOutput,
    errorOutput: options.errorOutput,
  };
}

async function preparePreflight(options) {
  const context = await collectInputContext(options);
  try {
    const checks = [];
    const add = (id, ok, detail = undefined) => {
      checks.push(detail === undefined ? { id, ok } : { id, ok, detail });
    };
    add("platform-darwin", process.platform === "darwin", process.platform);
    const nodeMajor = Number.parseInt(process.versions.node.split(".")[0], 10);
    add("node-major-at-least-24", Number.isInteger(nodeMajor) && nodeMajor >= 24, process.versions.node);
    for (const tool of REQUIRED_TOOLS) {
      try {
        await access(tool, fsConstants.X_OK);
        add(`tool-executable:${tool}`, true);
      } catch (error) {
        add(`tool-executable:${tool}`, false, summarizeError(error));
      }
    }
    const selfTests = embeddedSelfTests();
    for (const check of selfTests) add(`self-test:${check.id}`, check.ok, check.error);
    const syntax = {
      verifier: syntaxCheck(SELF),
      focusedTest: syntaxCheck(FOCUSED_TEST),
    };
    add("syntax:verifier", syntax.verifier.ok, syntax.verifier);
    add("syntax:focused-test", syntax.focusedTest.ok, syntax.focusedTest);
    const structural = structuralAssessment(context);
    for (const error of structural.errors) add(`structural:${error.id}`, false, error);
    const rows = inputSetProjection(context);
    const ready = checks.every((check) => check.ok);
    const status = ready ? "READY_FOR_FORMAL_EVIDENCE" : "PREFLIGHT_RETRYABLE_NOT_EVIDENCE";
    const receipt = addReceiptId("PREFLIGHT", {
      schemaVersion: 1,
      artifactType: "g4-l10-native-helper-v2-16-review-preflight",
      status,
      conclusion: "DIAGNOSTIC_ONLY_NOT_A_HUMAN_REVIEW_CONCLUSION",
      reviewBinding: reviewBinding(options, context),
      phaseBinding: phaseBinding(options, context),
      canonicalRoot: context.reviewSet.manifest.canonicalRoot,
      inputSetDigest: inputSetDigest(rows),
      fixedInputs: rows,
      syntax,
      selfTests,
      checks,
      retainedState: {
        v28OperationalFreeze: false,
        v28WritableFiles: 57,
        v28NativeMembers: 48,
        v28NonGateATopLevelRunners: 9,
        grade4MissingMp3: 16,
      },
      authorityEffects: closedAuthority(),
    });
    return { context, receipt };
  } catch (error) {
    await context.close();
    throw error;
  }
}

function verifyPreflightReceipt(value, options, context, receiptSnapshot, errors) {
  pushCheck(errors, "preflight-receipt-id", validReceiptId("PREFLIGHT", value), true, value?.receiptId);
  pushCheck(errors, "preflight-status", value?.status === "READY_FOR_FORMAL_EVIDENCE", "READY_FOR_FORMAL_EVIDENCE", value?.status);
  const expectedReview = reviewBinding(options, context);
  pushCheck(errors, "preflight-review-binding", canonicalJson(value?.reviewBinding) === canonicalJson(expectedReview), expectedReview, value?.reviewBinding);
  const preflightPhase = context.reviewSet.reviewer.preflight;
  const expectedPhase = {
    phase: "preflight",
    attemptOrdinal: preflightPhase.attemptOrdinal,
    successOutput: preflightPhase.successOutput,
    errorOutput: preflightPhase.errorOutput,
  };
  pushCheck(errors, "preflight-phase-binding", canonicalJson(value?.phaseBinding) === canonicalJson(expectedPhase), expectedPhase, value?.phaseBinding);
  const rows = inputSetProjection(context);
  pushCheck(errors, "preflight-input-set-digest", value?.inputSetDigest === inputSetDigest(rows), inputSetDigest(rows), value?.inputSetDigest);
  pushCheck(errors, "preflight-fixed-inputs", canonicalJson(value?.fixedInputs) === canonicalJson(rows), rows, value?.fixedInputs);
  pushCheck(errors, "preflight-authority-closed", value?.authorityEffects && Object.values(value.authorityEffects).every((entry) => entry === false), true, value?.authorityEffects);
  pushCheck(errors, "preflight-receipt-path", options.preflightReceipt === preflightPhase.successOutput, preflightPhase.successOutput, options.preflightReceipt);
  return {
    absolutePath: options.preflightReceipt,
    bytes: receiptSnapshot.binding.bytes,
    sha256: receiptSnapshot.binding.sha256,
    receiptId: value?.receiptId ?? null,
  };
}

async function prepareEvidence(options) {
  const context = await collectInputContext(options);
  let preflightSnapshot = null;
  try {
    invariant(options.preflightReceipt === context.reviewSet.reviewer.preflight.successOutput, "preflight receipt path differs from review-set binding");
    await safePhysicalTmpOutput(options.preflightReceipt);
    preflightSnapshot = await openOneSnapshot(options.preflightReceipt, null, {
      requireCanonicalPath: false,
    });
    invariant(preflightSnapshot.binding.mode === "0600", "preflight receipt mode must be 0600");
    let preflightValue;
    try {
      preflightValue = JSON.parse(decodeUtf8(preflightSnapshot.bytes));
    } catch (error) {
      throw new EvidenceInputMismatch("preflight receipt is not valid UTF-8 JSON", summarizeError(error));
    }
    invariant(
      Buffer.from(`${JSON.stringify(sortedValue(preflightValue), null, 2)}\n`, "utf8").equals(preflightSnapshot.bytes),
      "preflight receipt bytes are not canonical pretty JSON with final LF",
    );

    const structural = structuralAssessment(context);
    const errors = [...structural.errors];
    const supportingPreflight = verifyPreflightReceipt(
      preflightValue,
      options,
      context,
      preflightSnapshot,
      errors,
    );
    const rows = inputSetProjection(context);
    const status = errors.length === 0
      ? "VERIFIED_INPUTS_READY_FOR_HUMAN_REVIEW"
      : "EVIDENCE_INPUT_MISMATCH";
    const scopeFocus = {
      schema: ["production grammar", "HMG4GL4", "HMG4AL3", "all 42 HMG4PE1 paragraphs", "HMG4FR3"],
      adversarial: ["review-set ownership", "receipt replay", "descriptor snapshots", "canonical root", "durable errors", "authority escape"],
      whole: ["byte 1 through EOF", "full lineage", "all structures and paragraphs", "retained exclusions", "no authority expansion"],
    }[options.scope];
    const receipt = addReceiptId("EVIDENCE", {
      schemaVersion: 1,
      artifactType: "g4-l10-native-helper-v2-16-deterministic-evidence",
      status,
      conclusion: "NOT_A_HUMAN_REVIEW_CONCLUSION",
      reviewBinding: reviewBinding(options, context),
      phaseBinding: phaseBinding(options, context),
      scopeFocus,
      supportingPreflight,
      canonicalRoot: context.reviewSet.manifest.canonicalRoot,
      inputSetDigest: inputSetDigest(rows),
      fixedInputs: rows,
      history: {
        status: context.historyManifest.status ?? null,
        declaredArtifactCount: context.historyManifest.artifacts?.length ?? null,
        verifiedArtifactCount: structural.history.verifiedArtifactCount,
        newHMG4RB4BatchesAllowed: false,
      },
      structures: structural.structures,
      errors,
      reviewerMustStillEvaluate: true,
      qualifyingReviewPass: false,
      retainedState: {
        v28OperationalFreeze: false,
        v28WritableFiles: 57,
        v28NativeMembers: 48,
        v28NonGateATopLevelRunners: 9,
        v28Bytes: 553897,
        v28ChecksumSetSha256: "cfa98f5fd9a101c35944b4ef59a8b5db36f3a799ee7821ca4e286476acea3200",
        v28NativeRootMode: "0755",
        grade4MissingMp3: 16,
      },
      authorityEffects: closedAuthority(),
    });
    return {
      context,
      preflightSnapshot,
      receipt,
      async close() {
        await preflightSnapshot.handle.close();
        await context.close();
      },
    };
  } catch (error) {
    if (preflightSnapshot) {
      try {
        await preflightSnapshot.handle.close();
      } catch {
        // The primary error is retained.
      }
    }
    await context.close();
    throw error;
  }
}

function exitCodeForStatus(status) {
  if (status === "READY_FOR_FORMAL_EVIDENCE" || status === "VERIFIED_INPUTS_READY_FOR_HUMAN_REVIEW") return 0;
  if (status === "PREFLIGHT_RETRYABLE_NOT_EVIDENCE") return 2;
  if (status === "EVIDENCE_INPUT_MISMATCH") return 3;
  if (status === "MECHANICAL_ERROR_NO_VERDICT_NO_RETRY") return 70;
  return 74;
}

export function validateCanonicalRootLiteral(candidate) {
  invariant(candidate === CANONICAL_ROOT, "canonical root literal mismatch", {
    expected: CANONICAL_ROOT,
    actual: candidate,
  });
  return true;
}

export async function publishFixtureAttemptForTest({
  successOutput,
  errorOutput,
  successReceipt,
  errorReceipt,
}) {
  try {
    await writeNoClobberReceipt(successOutput, successReceipt);
    return { status: "SUCCESS", output: successOutput };
  } catch (error) {
    const durableError = {
      ...errorReceipt,
      originalError: summarizeError(error),
      authorityEffects: closedAuthority(),
    };
    await writeNoClobberReceipt(errorOutput, durableError);
    return { status: "DURABLE_ERROR", output: errorOutput, error: summarizeError(error) };
  }
}

function errorReceiptFrom(recovered, error, status, attemptedReceipt = null) {
  const authenticated = attemptedReceipt?.reviewBinding ?? null;
  return addReceiptId("ERROR", {
    schemaVersion: 1,
    artifactType: "g4-l10-native-helper-v2-16-verifier-error",
    status,
    command: recovered.command,
    scope: authenticated?.scope ?? recovered.scope,
    reviewerTaskId: authenticated?.reviewerTaskId ?? recovered.reviewerTaskId,
    reviewerNonce: authenticated?.reviewerNonce ?? null,
    reviewSetDigest: authenticated?.reviewSetDigest ?? null,
    reviewBindingAuthenticated: authenticated !== null,
    reviewSetManifestAbsolutePath: recovered.reviewSetManifest,
    reviewSetManifestSha256: authenticated?.reviewSetManifestSha256 ?? recovered.reviewSetManifestSha256,
    preflightReceiptAbsolutePath: recovered.preflightReceipt,
    successOutput: recovered.successOutput,
    errorOutput: recovered.errorOutput,
    attemptOrdinal: 1,
    exitCode: exitCodeForStatus(status),
    failedCandidateReceiptId: attemptedReceipt?.receiptId ?? null,
    evidenceConclusion: false,
    error: summarizeError(error),
    authorityEffects: closedAuthority(),
  });
}

async function executeCli(argv) {
  const recovered = recoverInvocation(argv);
  let options = null;
  let prepared = null;
  let attemptedReceipt = null;
  try {
    options = parseCli(argv);
    prepared = options.command === "preflight"
      ? await preparePreflight(options)
      : await prepareEvidence(options);
    const context = prepared.context;
    await context.recheckRoot();
    const receipt = prepared.receipt;
    attemptedReceipt = receipt;
    const output = receipt.status === "READY_FOR_FORMAL_EVIDENCE"
      || receipt.status === "VERIFIED_INPUTS_READY_FOR_HUMAN_REVIEW"
      ? options.successOutput
      : options.errorOutput;
    if (options.command === "preflight") {
      await context.close();
    } else {
      await prepared.close();
    }
    prepared = null;
    await writeNoClobberReceipt(output, receipt);
    process.stdout.write(receiptBytes(receipt));
    process.exitCode = exitCodeForStatus(receipt.status);
    return;
  } catch (error) {
    if (prepared) {
      try {
        if (options?.command === "preflight") await prepared.context.close();
        else await prepared.close();
      } catch (closeError) {
        error.closeError = summarizeError(closeError);
      }
      prepared = null;
    }
    const status = classifyFailure(recovered.command, error);
    const report = errorReceiptFrom(recovered, error, status, attemptedReceipt);
    if (recovered.errorOutput) {
      try {
        await writeNoClobberReceipt(path.resolve(recovered.errorOutput), report);
        process.stdout.write(receiptBytes(report));
        process.exitCode = exitCodeForStatus(status);
        return;
      } catch (persistenceError) {
        const { receiptId: discardedReceiptId, ...reportWithoutReceiptId } = report;
        void discardedReceiptId;
        const unpreserved = addReceiptId("ERROR", {
          ...reportWithoutReceiptId,
          status: "ATTEMPT_RECEIPT_UNPRESERVED_NO_VERDICT",
          originalStatus: status,
          exitCode: 74,
          receiptPersistenceError: summarizeError(persistenceError),
        });
        process.stdout.write(receiptBytes(unpreserved));
        process.exitCode = 74;
        return;
      }
    }
    const { receiptId: discardedReceiptId, ...reportWithoutReceiptId } = report;
    void discardedReceiptId;
    const unpreserved = addReceiptId("ERROR", {
      ...reportWithoutReceiptId,
      status: "ATTEMPT_RECEIPT_UNPRESERVED_NO_VERDICT",
      originalStatus: status,
      exitCode: 74,
      receiptPersistenceError: { code: "NO_ERROR_OUTPUT", message: "no uniquely recoverable --error-output was supplied" },
    });
    process.stdout.write(receiptBytes(unpreserved));
    process.exitCode = 74;
  }
}

const invokedAsMain = process.argv[1]
  && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;

if (invokedAsMain) {
  executeCli(process.argv.slice(2)).catch((error) => {
    const fallback = addReceiptId("ERROR", {
      schemaVersion: 1,
      artifactType: "g4-l10-native-helper-v2-16-unhandled-error",
      status: "ATTEMPT_RECEIPT_UNPRESERVED_NO_VERDICT",
      evidenceConclusion: false,
      error: summarizeError(error),
      authorityEffects: closedAuthority(),
    });
    process.stdout.write(receiptBytes(fallback));
    process.exitCode = 74;
  });
}
