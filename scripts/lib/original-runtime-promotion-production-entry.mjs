import {constants as fsConstants} from "node:fs";
import {createHash} from "node:crypto";
import {
  lstat,
  open,
  readdir,
  realpath,
} from "node:fs/promises";
import path from "node:path";

import {inspectOriginalRuntimePromotionTransaction} from "./original-runtime-promotion-transaction.mjs";

/**
 * Fail-closed production-entry foundation.
 *
 * This production module deliberately contains only read-only planning and
 * inspection. The exported execute and recovery functions are unconditional
 * fuses. Durable entry execution still requires a separately reviewed
 * canonical integration after the trust, kernel-anchored path, real-candidate,
 * and independent-security-review gates are satisfied.
 */
export const ORIGINAL_RUNTIME_PROMOTION_PRODUCTION_ENTRY_ENABLED = false;
export const ORIGINAL_RUNTIME_PROMOTION_PRODUCTION_EXECUTOR_CONNECTED = false;
export const ORIGINAL_RUNTIME_PROMOTION_PRODUCTION_ENTRY_DISABLED_CODE =
  "ORIGINAL_RUNTIME_PROMOTION_PRODUCTION_ENTRY_DISABLED";
export const ORIGINAL_RUNTIME_PROMOTION_PRODUCTION_ENTRY_RECOVERY_REQUIRED_CODE =
  "ORIGINAL_RUNTIME_PROMOTION_PRODUCTION_ENTRY_RECOVERY_REQUIRED";
export const ORIGINAL_RUNTIME_PROMOTION_PRODUCTION_ENTRY_NONCE_REUSED_CODE =
  "ORIGINAL_RUNTIME_PROMOTION_PRODUCTION_ENTRY_NONCE_REUSED";

const PLAN_STATES = new WeakMap();
const PLAN_SCHEMA = 1;
const RECORD_SCHEMA = 1;
const ZERO_HASH = "0".repeat(64);
const SHA256 = /^[a-f0-9]{64}$/;
const NOFOLLOW = fsConstants.O_NOFOLLOW ?? 0;
const DIRECTORY = fsConstants.O_DIRECTORY ?? 0;

function coded(message, code) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function digest(value) {
  return createHash("sha256").update(value).digest("hex");
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]),
    );
  }
  return value;
}

function canonicalJson(value) {
  return JSON.stringify(canonicalize(value));
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}

function isInside(candidate, root) {
  const relative = path.relative(root, candidate);
  return relative === "" || (
    !path.isAbsolute(relative) &&
    relative !== ".." &&
    !relative.startsWith(`..${path.sep}`)
  );
}

function assertSha256(value, label) {
  if (!SHA256.test(value || "")) throw new Error(`${label} must be a lowercase SHA-256`);
  return value;
}

function assertBoolean(value, expected, label) {
  if (value !== expected) throw new Error(`${label} must be ${expected}`);
}

function safeMigrationId(value) {
  if (
    typeof value !== "string" ||
    !/^[a-z0-9][a-z0-9._-]*$/.test(value) ||
    value === "." ||
    value === ".."
  ) {
    throw new Error("migrationId must be a lowercase path-free identifier");
  }
  return value;
}

function nodeOf(info) {
  return {dev: String(info.dev), ino: String(info.ino)};
}

function sameNode(left, right) {
  return Boolean(left && right && left.dev === right.dev && left.ino === right.ino);
}

function permissionMode(info) {
  return Number(info.mode & 0o777n);
}

async function lstatMaybe(candidate) {
  try {
    return await lstat(candidate, {bigint: true});
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

async function snapshotFile(candidate, label, {singleLink = false} = {}) {
  const handle = await open(candidate, fsConstants.O_RDONLY | NOFOLLOW);
  try {
    const before = await handle.stat({bigint: true});
    if (!before.isFile()) throw new Error(`${label} must be a regular file`);
    if (singleLink && before.nlink !== 1n) throw new Error(`${label} must have one hard link`);
    const bytes = await handle.readFile();
    const after = await handle.stat({bigint: true});
    const atPath = await lstat(candidate, {bigint: true});
    if (
      !atPath.isFile() ||
      atPath.isSymbolicLink() ||
      !sameNode(nodeOf(before), nodeOf(after)) ||
      !sameNode(nodeOf(before), nodeOf(atPath))
    ) {
      throw new Error(`${label} identity changed while reading`);
    }
    return {
      bytes,
      sha256: digest(bytes),
      size: Number(after.size),
      mode: permissionMode(after),
      nlink: Number(after.nlink),
      node: nodeOf(after),
    };
  } finally {
    await handle.close();
  }
}

async function assertSafePath(root, candidate, label, {directoryFinal = false} = {}) {
  if (!isInside(candidate, root)) throw new Error(`${label} escapes the project root`);
  if (isInside(candidate, path.join(root, "source-assets"))) {
    throw new Error(`${label} targets source-assets`);
  }
  let cursor = root;
  let missing = false;
  const parts = path.relative(root, candidate).split(path.sep).filter(Boolean);
  for (let index = 0; index < parts.length; index += 1) {
    cursor = path.join(cursor, parts[index]);
    if (missing) continue;
    const info = await lstatMaybe(cursor);
    if (!info) {
      missing = true;
      continue;
    }
    if (info.isSymbolicLink()) throw new Error(`${label} contains a symbolic-link component`);
    if (index < parts.length - 1 || directoryFinal) {
      if (!info.isDirectory()) throw new Error(`${label} contains a non-directory component`);
    }
    if (!isInside(await realpath(cursor), root)) {
      throw new Error(`${label} resolves outside the project root`);
    }
  }
}

function validateReleaseBundleDiagnostic(value, transactionDescriptor) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("releaseBundleDiagnostic must be an object");
  }
  assertBoolean(value.validationPassed, true, "releaseBundleDiagnostic.validationPassed");
  assertBoolean(value.diagnosticOnly, true, "releaseBundleDiagnostic.diagnosticOnly");
  assertBoolean(value.authoritative, false, "releaseBundleDiagnostic.authoritative");
  assertBoolean(
    value.readyForProductionPromotion,
    false,
    "releaseBundleDiagnostic.readyForProductionPromotion",
  );
  assertBoolean(value.promotionWritable, false, "releaseBundleDiagnostic.promotionWritable");
  assertBoolean(value.strictAcceptanceEffect, false, "releaseBundleDiagnostic.strictAcceptanceEffect");
  assertSha256(value.releaseBundleSha256, "releaseBundleDiagnostic.releaseBundleSha256");
  assertSha256(
    value.preLedgerCommitmentSha256,
    "releaseBundleDiagnostic.preLedgerCommitmentSha256",
  );
  assertSha256(
    value.expectedOutputsSha256,
    "releaseBundleDiagnostic.expectedOutputsSha256",
  );
  if (value.transactionPlanSha256 !== transactionDescriptor.planSha256) {
    throw new Error("release bundle diagnostic transaction plan hash differs");
  }
  if (value.transactionInspectionStatus !== "not-started") {
    throw new Error("release bundle diagnostic transaction is not unstarted");
  }
  if (value.nonce !== transactionDescriptor.transactionNonce) {
    throw new Error("release bundle diagnostic nonce differs from the transaction plan");
  }
  if (!Array.isArray(value.blockingDiagnostics) || value.blockingDiagnostics.length === 0) {
    throw new Error("release bundle diagnostic must retain production blockers");
  }
  return value;
}

function entryPaths(root, descriptor) {
  const workspace = path.join(root, "migrations", descriptor.migrationId);
  const transactionParent = path.join(
    workspace,
    "evidence",
    "original-runtime-promotion-production-entry-transactions",
  );
  const transactionRoot = path.join(transactionParent, descriptor.entryPlanSha256);
  const nonceRoot = path.join(root, ".original-runtime-promotion-entry-nonce-reservations");
  return {
    workspace,
    transactionParent,
    transactionRoot,
    plan: path.join(transactionRoot, "plan.json"),
    records: path.join(transactionRoot, "journal-records"),
    nonceRoot,
    nonceReservation: path.join(nonceRoot, `${descriptor.transactionNonceSha256}.json`),
  };
}

/**
 * Creates an immutable, process-private, read-only entry plan. Plain
 * diagnostic data may shape this plan but grants no authority and enables no
 * filesystem changes.
 */
export async function createOriginalRuntimePromotionProductionEntryPlan({
  projectRoot,
  transactionPlan,
  releaseBundleDiagnostic,
}) {
  if (
    ORIGINAL_RUNTIME_PROMOTION_PRODUCTION_ENTRY_ENABLED !== false ||
    ORIGINAL_RUNTIME_PROMOTION_PRODUCTION_EXECUTOR_CONNECTED !== false
  ) {
    throw new Error("production-entry fuses unexpectedly changed");
  }
  const root = await realpath(path.resolve(projectRoot || "."));
  const transactionInspection = await inspectOriginalRuntimePromotionTransaction(transactionPlan);
  const transactionDescriptor = transactionPlan?.descriptor;
  if (
    !transactionDescriptor ||
    transactionInspection.planSha256 !== transactionDescriptor.planSha256 ||
    transactionInspection.status !== "not-started" ||
    transactionInspection.records.length !== 0
  ) {
    throw new Error("production entry requires the original unstarted transaction plan handle");
  }
  safeMigrationId(transactionDescriptor.migrationId);
  const workspace = path.join(root, "migrations", transactionDescriptor.migrationId);
  await assertSafePath(root, workspace, "migration workspace", {directoryFinal: true});
  const workspaceInfo = await lstat(workspace, {bigint: true});
  if (!workspaceInfo.isDirectory() || workspaceInfo.isSymbolicLink()) {
    throw new Error("migration workspace must be a real directory");
  }
  const diagnostic = validateReleaseBundleDiagnostic(
    releaseBundleDiagnostic,
    transactionDescriptor,
  );
  const descriptorWithoutHash = {
    schemaVersion: PLAN_SCHEMA,
    artifactType: "original-runtime-promotion-production-entry-foundation-plan",
    status: "production-disabled-foundation-only",
    migrationId: transactionDescriptor.migrationId,
    requirementId: transactionDescriptor.requirementId,
    transactionPlanSha256: transactionDescriptor.planSha256,
    transactionNonceSha256: digest(Buffer.from(transactionDescriptor.transactionNonce)),
    releaseBundleSha256: diagnostic.releaseBundleSha256,
    releaseBundleDiagnosticSha256: digest(Buffer.from(canonicalJson(diagnostic))),
    preLedgerCommitmentSha256: diagnostic.preLedgerCommitmentSha256,
    expectedOutputsSha256: diagnostic.expectedOutputsSha256,
    orderingContract: [
      "validate-branded-plan-and-release-bundle",
      "durably-reserve-signed-one-time-nonce",
      "durably-open-plan-bound-entry-journal",
      "invoke-fixed-canonical-executor-or-recovery-only",
    ],
    productionPromotionEnabled: false,
    canonicalExecutorConnected: false,
    kernelAnchoredPathRaceClosureIntegrated: false,
    receiptIssuerIntegrated: false,
    strictAcceptanceEffect: false,
  };
  const entryPlanSha256 = digest(Buffer.from(canonicalJson(descriptorWithoutHash)));
  const descriptor = deepFreeze({...descriptorWithoutHash, entryPlanSha256});
  const handle = Object.freeze({
    entryPlanSha256,
    descriptor: deepFreeze(cloneJson(descriptor)),
  });
  PLAN_STATES.set(handle, {root, descriptor});
  return handle;
}

function stateFor(handle) {
  const state = PLAN_STATES.get(handle);
  if (!state) throw new Error("production-entry plan must be the original process-private branded handle");
  const {entryPlanSha256, ...withoutHash} = state.descriptor;
  if (
    digest(Buffer.from(canonicalJson(withoutHash))) !== entryPlanSha256 ||
    handle.entryPlanSha256 !== entryPlanSha256 ||
    canonicalJson(handle.descriptor) !== canonicalJson(state.descriptor)
  ) {
    throw new Error("production-entry plan descriptor or brand is stale");
  }
  return {...state, paths: entryPaths(state.root, state.descriptor)};
}

async function validateAllPaths(state) {
  for (const [label, candidate] of Object.entries(state.paths)) {
    await assertSafePath(state.root, candidate, label, {
      directoryFinal: [
        "workspace",
        "transactionParent",
        "transactionRoot",
        "records",
        "nonceRoot",
      ].includes(label),
    });
  }
}

function nonceDocument(state) {
  return {
    schemaVersion: 1,
    artifactType: "original-runtime-promotion-production-entry-nonce-reservation",
    nonceSha256: state.descriptor.transactionNonceSha256,
    entryPlanSha256: state.descriptor.entryPlanSha256,
    transactionPlanSha256: state.descriptor.transactionPlanSha256,
    releaseBundleSha256: state.descriptor.releaseBundleSha256,
  };
}

async function inspectNonce(state) {
  const info = await lstatMaybe(state.paths.nonceReservation);
  if (!info) return {present: false};
  const expected = Buffer.from(`${JSON.stringify(nonceDocument(state), null, 2)}\n`);
  const snapshot = await snapshotFile(
    state.paths.nonceReservation,
    "production-entry nonce reservation",
    {singleLink: true},
  );
  if (!snapshot.bytes.equals(expected)) {
    throw coded(
      "production-entry nonce is reserved by a different plan",
      ORIGINAL_RUNTIME_PROMOTION_PRODUCTION_ENTRY_NONCE_REUSED_CODE,
    );
  }
  return {present: true, sha256: snapshot.sha256, node: snapshot.node};
}

function recordFilename(record) {
  return `${String(record.sequence).padStart(8, "0")}-${record.recordSha256}.jsonl`;
}

async function readRecords(state) {
  const info = await lstatMaybe(state.paths.records);
  if (!info) return [];
  if (!info.isDirectory() || info.isSymbolicLink()) {
    throw new Error("production-entry record root is not a real directory");
  }
  const entries = (await readdir(state.paths.records)).sort();
  const pending = entries.filter((name) => name.startsWith(".record-") && name.endsWith(".tmp"));
  if (pending.length) throw new Error("production-entry journal has an incomplete staging record");
  const names = entries.filter((name) => /^\d{8}-[a-f0-9]{64}\.jsonl$/.test(name));
  if (names.length !== entries.length) {
    throw new Error("production-entry journal contains an unexpected entry");
  }
  let previous = ZERO_HASH;
  const records = [];
  for (let index = 0; index < names.length; index += 1) {
    const snapshot = await snapshotFile(
      path.join(state.paths.records, names[index]),
      `production-entry record ${index + 1}`,
      {singleLink: true},
    );
    if (snapshot.bytes.at(-1) !== 0x0a || snapshot.bytes.subarray(0, -1).includes(0x0a)) {
      throw new Error(`production-entry record ${index + 1} is not one complete JSONL line`);
    }
    let record;
    try {
      record = JSON.parse(snapshot.bytes.toString("utf8").slice(0, -1));
    } catch {
      throw new Error(`production-entry record ${index + 1} is invalid JSON`);
    }
    const {recordSha256, ...body} = record;
    if (
      record.schemaVersion !== RECORD_SCHEMA ||
      record.entryPlanSha256 !== state.descriptor.entryPlanSha256 ||
      record.sequence !== index + 1 ||
      record.previousRecordSha256 !== previous ||
      !SHA256.test(recordSha256 || "") ||
      digest(Buffer.from(canonicalJson(body))) !== recordSha256 ||
      names[index] !== recordFilename(record)
    ) {
      throw new Error(`production-entry record ${index + 1} breaks the hash chain`);
    }
    records.push(record);
    previous = recordSha256;
  }
  return records;
}

function terminalState(records) {
  if (records.some(({event}) => event === "entry-committed")) return "committed";
  if (records.some(({event}) => event === "entry-rolled-back")) return "rolled-back";
  if (records.some(({event}) => event === "entry-recovered-not-started")) return "not-started";
  if (records.some(({event}) => event === "manual-intervention-required")) {
    return "manual-intervention-required";
  }
  return records.length ? "incomplete-recovery-required" : "nonce-reserved-recovery-required";
}

/** Public production execute remains unconditionally disabled and write-free. */
export async function executeOriginalRuntimePromotionProductionEntry() {
  throw coded(
    `${ORIGINAL_RUNTIME_PROMOTION_PRODUCTION_ENTRY_DISABLED_CODE}: canonical executor is not connected`,
    ORIGINAL_RUNTIME_PROMOTION_PRODUCTION_ENTRY_DISABLED_CODE,
  );
}

/** Public production recovery remains behind the same unconditional fuse. */
export async function recoverOriginalRuntimePromotionProductionEntry() {
  throw coded(
    `${ORIGINAL_RUNTIME_PROMOTION_PRODUCTION_ENTRY_DISABLED_CODE}: canonical recovery is not connected`,
    ORIGINAL_RUNTIME_PROMOTION_PRODUCTION_ENTRY_DISABLED_CODE,
  );
}

/** Read-only inspection requires the original private branded entry plan. */
export async function inspectOriginalRuntimePromotionProductionEntry(handle) {
  const state = stateFor(handle);
  await validateAllPaths(state);
  const nonce = await inspectNonce(state);
  const records = await readRecords(state);
  return deepFreeze({
    status: nonce.present ? terminalState(records) : "not-started",
    entryPlanSha256: state.descriptor.entryPlanSha256,
    transactionPlanSha256: state.descriptor.transactionPlanSha256,
    nonceReserved: nonce.present,
    records,
    productionPromotionEnabled: false,
    canonicalExecutorConnected: false,
    strictAcceptanceEffect: false,
  });
}
