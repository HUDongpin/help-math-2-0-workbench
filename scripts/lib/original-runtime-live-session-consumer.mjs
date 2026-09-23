import {
  closeSync,
  constants as fsConstants,
  fstatSync,
  lstatSync,
  openSync,
  readFileSync,
  realpathSync,
} from "node:fs";
import {lstat, open, realpath} from "node:fs/promises";
import path from "node:path";
import {TextDecoder} from "node:util";

import {
  TRUST_ROLES,
  assertExactKeys,
  canonicalJson,
  loadExternalTrustRootConfig,
  parseCanonicalTimestamp,
  sha256Bytes,
  sha256Canonical,
  verifyOriginalRuntimeLiveSessionRoleEnvelopeDiagnostic,
  verifyOriginalRuntimeLiveSessionTrustStateDiagnostic,
} from "./original-runtime-promotion-trust.mjs";

export const LIVE_SESSION_SCHEMA_VERSION = 1;
export const LIVE_SESSION_STATUS = "verified-live-session-pending-candidate";
export const LIVE_SESSION_PRODUCTION_ANCHOR_NOT_CONFIGURED_CODE =
  "ORIGINAL_RUNTIME_LIVE_SESSION_PRODUCTION_ANCHOR_NOT_CONFIGURED";
export const LIVE_SESSION_PRODUCTION_OWNER_ROOT =
  "/Library/Application Support/HELP Math 2.0/original-runtime-production-trust";
export const LIVE_SESSION_PRODUCTION_TRUST_ROOT_PATH =
  "/Library/Application Support/HELP Math 2.0/original-runtime-production-trust/trust-root.json";
export const LIVE_SESSION_ALLOWED_ROOT =
  "artifacts/full-frame/g4-l3/live-session-consumer";
export const PROTECTED_PREEXISTING_FLASH_PIDS = Object.freeze([97581]);

export const LIVE_SESSION_EVIDENCE_TYPES = Object.freeze({
  sessionPlan: "original-runtime-live-session-plan",
  candidateManifest: "original-runtime-live-session-candidate-manifest",
  nonceReservation: "original-runtime-live-session-nonce-reservation",
  prelaunchAuthorization: "original-runtime-live-session-prelaunch-authorization",
  independentReviewAssignment: "original-runtime-live-session-independent-review-assignment",
  processClaim: "original-runtime-live-session-process-claim",
  sessionCompletion: "original-runtime-live-session-completion",
});

const FILES = Object.freeze({
  sessionPlan: "session-plan.json",
  candidateManifest: "candidate-manifest.json",
  nonceReservation: "nonce-reservation-envelope.json",
  prelaunchAuthorization: "prelaunch-authorization-envelope.json",
  independentReviewAssignment: "independent-review-assignment-envelope.json",
  processClaim: "process-claim-envelope.json",
  sessionCompletion: "session-completion-envelope.json",
});

export const LIVE_SESSION_EVIDENCE_FILES = Object.freeze({
  operationLog: "operation-log.jsonl",
  stateLog: "state-log.jsonl",
  sourceTargetLog: "source-target-log.jsonl",
  hostEntryLog: "host-entry-log.jsonl",
  frameManifest: "frame-manifest.json",
  audioManifest: "audio-manifest.json",
  requestAudit: "request-audit.json",
});

const AUTHORITY_KEYS = Object.freeze([
  "authoritativeOriginalRuntimeTrace",
  "authoritativeBaseline",
  "baselineAccepted",
  "audioAccepted",
  "humanVisualAccepted",
  "ownerAccepted",
  "strictMigrationComplete",
  "publicRelease",
]);
const SESSION_PLAN_KEYS = Object.freeze([
  "schemaVersion",
  "evidenceType",
  "status",
  "sessionId",
  "animationId",
  "language",
  "requirementIds",
  "traceSpecSetSha256",
  "sessionKitSha256",
  "profileManifestSha256",
  "hostTreeManifestSha256",
  "projectorExecutableSha256",
  "containmentReadinessSha256",
  "runtimeEnvironmentReadinessSha256",
  "hostIdSha256",
  "createdAt",
  "authority",
]);
const CANDIDATE_MANIFEST_KEYS = Object.freeze([
  "schemaVersion",
  "evidenceType",
  "status",
  "sessionId",
  "animationId",
  "language",
  "sessionPlanSha256",
  "prelaunchAuthorizationSha256",
  "processClaimSha256",
  "operationLogSha256",
  "stateLogSha256",
  "sourceTargetLogSha256",
  "hostEntryLogSha256",
  "frameManifestSha256",
  "audioManifestSha256",
  "requestAuditSha256",
  "createdAt",
  "authority",
]);
const NONCE_RESERVATION_KEYS = Object.freeze([
  "schemaVersion",
  "evidenceType",
  "status",
  "sessionId",
  "animationId",
  "language",
  "sessionPlanSha256",
  "sessionNonce",
  "reservationId",
  "nonceSequence",
  "previousNonceReservationSha256",
  "reservedAt",
  "scope",
]);
const PRELAUNCH_KEYS = Object.freeze([
  "schemaVersion",
  "evidenceType",
  "decision",
  "sessionId",
  "animationId",
  "language",
  "sessionPlanSha256",
  "nonceReservationSha256",
  "sessionNonce",
  "phaseSequence",
  "previousEnvelopeSha256",
  "expectedPriorStateSha256",
  "operatorSubjectId",
  "independentReviewerSubjectId",
  "releaseCustodianSubjectId",
  "processAbsenceSnapshot",
  "containmentApproval",
  "authorizedAt",
  "notAfter",
  "scope",
]);
const PROCESS_ABSENCE_KEYS = Object.freeze([
  "capturedAt",
  "hostIdSha256",
  "processTableSha256",
  "observedFlashPids",
]);
const CONTAINMENT_APPROVAL_KEYS = Object.freeze([
  "controlIds",
  "approvalManifestSha256",
  "liveNoEgressPreflightSha256",
  "liveCapacityPreflightSha256",
]);
const REVIEW_ASSIGNMENT_KEYS = Object.freeze([
  "schemaVersion",
  "evidenceType",
  "status",
  "sessionId",
  "animationId",
  "language",
  "sessionPlanSha256",
  "prelaunchAuthorizationSha256",
  "assignedAt",
  "scope",
]);
const PROCESS_CLAIM_KEYS = Object.freeze([
  "schemaVersion",
  "evidenceType",
  "status",
  "sessionId",
  "animationId",
  "language",
  "sessionPlanSha256",
  "nonceReservationSha256",
  "prelaunchAuthorizationSha256",
  "independentReviewAssignmentSha256",
  "sessionNonce",
  "phaseSequence",
  "previousEnvelopeSha256",
  "expectedPriorStateSha256",
  "processId",
  "processStartedAt",
  "processIdentitySha256",
  "projectorExecutableSha256",
  "claimedAt",
  "scope",
]);
const SESSION_COMPLETION_KEYS = Object.freeze([
  "schemaVersion",
  "evidenceType",
  "status",
  "sessionId",
  "animationId",
  "language",
  "sessionPlanSha256",
  "candidateManifestSha256",
  "nonceReservationSha256",
  "prelaunchAuthorizationSha256",
  "independentReviewAssignmentSha256",
  "processClaimSha256",
  "sessionNonce",
  "phaseSequence",
  "previousEnvelopeSha256",
  "expectedPriorStateSha256",
  "endedAt",
  "completedAt",
  "processExited",
  "successfulOutboundRequests",
  "persistentSideEffects",
  "scope",
]);

const SESSION_ID_PATTERN = /^[a-z0-9][a-z0-9._-]{7,127}$/;
const NONCE_PATTERN = /^[A-Za-z0-9._~+/=-]{22,256}$/;
const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const BUNDLE_CONTEXTS = new WeakMap();

function invariant(condition, message) {
  if (!condition) throw new Error(`Original-runtime live-session consumer: ${message}`);
}

function assertString(value, label) {
  invariant(typeof value === "string" && value.trim().length > 0, `${label} must be a non-empty string`);
  return value;
}

function assertSha256(value, label) {
  invariant(SHA256_PATTERN.test(value || ""), `${label} must be a lowercase SHA-256`);
  return value;
}

function assertPositiveInteger(value, label) {
  invariant(Number.isSafeInteger(value) && value > 0, `${label} must be a positive safe integer`);
  return value;
}

function assertNonNegativeInteger(value, label) {
  invariant(Number.isSafeInteger(value) && value >= 0, `${label} must be a non-negative safe integer`);
  return value;
}

function deepFreeze(value, seen = new Set()) {
  if (!value || typeof value !== "object" || seen.has(value)) return value;
  seen.add(value);
  for (const child of Array.isArray(value) ? value : Object.values(value)) deepFreeze(child, seen);
  return Object.freeze(value);
}

function sameCanonical(left, right) {
  return canonicalJson(left) === canonicalJson(right);
}

function isContained(root, candidate) {
  const relative = path.relative(root, candidate);
  return relative === "" ||
    (!path.isAbsolute(relative) && relative !== ".." && !relative.startsWith(`..${path.sep}`));
}

function metadataSnapshot(metadata) {
  return {
    dev: metadata.dev,
    ino: metadata.ino,
    nlink: metadata.nlink,
    size: metadata.size,
    mtimeMs: metadata.mtimeMs,
    ctimeMs: metadata.ctimeMs,
  };
}

function assertStableMetadata(before, after, label) {
  invariant(sameCanonical(before, after), `${label} metadata changed while it was being read`);
}

async function assertRealDirectoryTree(root, candidate, label) {
  const relative = path.relative(root, candidate);
  invariant(
    relative === "" || (!path.isAbsolute(relative) && relative !== ".." && !relative.startsWith(`..${path.sep}`)),
    `${label} escapes its allowlisted root`,
  );
  let cursor = root;
  for (const segment of relative.split(path.sep).filter(Boolean)) {
    cursor = path.join(cursor, segment);
    const information = await lstat(cursor);
    invariant(information.isDirectory() && !information.isSymbolicLink(), `${label} contains a non-directory or symbolic-link component`);
  }
}

async function readStableFile(sessionRoot, fileName, label) {
  invariant(path.basename(fileName) === fileName, `${label} filename is not a direct child name`);
  const filePath = path.join(sessionRoot, fileName);
  invariant(path.dirname(filePath) === sessionRoot, `${label} is not a direct child of the session root`);
  let beforeInfo;
  try {
    beforeInfo = await lstat(filePath);
  } catch (error) {
    if (error?.code === "ENOENT") {
      throw new Error(`Original-runtime live-session consumer: required ${label} file is missing`);
    }
    throw error;
  }
  invariant(
    beforeInfo.isFile() && !beforeInfo.isSymbolicLink() && beforeInfo.nlink === 1,
    `${label} must be a regular non-symlink file with exactly one hard link`,
  );
  const before = metadataSnapshot(beforeInfo);
  invariant(await realpath(filePath) === filePath, `${label} path must resolve without symbolic links`);
  let handle;
  let bytes;
  try {
    handle = await open(filePath, fsConstants.O_RDONLY | fsConstants.O_NOFOLLOW);
    const descriptorBefore = metadataSnapshot(await handle.stat());
    assertStableMetadata(before, descriptorBefore, `${label} path/descriptor`);
    bytes = await handle.readFile();
    const descriptorAfter = metadataSnapshot(await handle.stat());
    assertStableMetadata(descriptorBefore, descriptorAfter, `${label} descriptor`);
  } finally {
    await handle?.close();
  }
  let afterInfo;
  try {
    afterInfo = await lstat(filePath);
  } catch (error) {
    if (error?.code === "ENOENT") {
      throw new Error(`Original-runtime live-session consumer: ${label} disappeared while it was being read`);
    }
    throw error;
  }
  assertStableMetadata(before, metadataSnapshot(afterInfo), label);
  invariant(await realpath(filePath) === filePath, `${label} path changed or became a symbolic link`);
  return {
    path: filePath,
    file: fileName,
    bytes: bytes.length,
    sha256: sha256Bytes(bytes),
    metadata: before,
    rawBytes: bytes,
  };
}

async function readStableJsonFile(sessionRoot, fileName, label) {
  const file = await readStableFile(sessionRoot, fileName, label);
  let text;
  try {
    text = new TextDecoder("utf-8", {fatal: true}).decode(file.rawBytes);
  } catch (error) {
    throw new Error(`Original-runtime live-session consumer: ${label} is not valid UTF-8: ${error.message}`);
  }
  let document;
  try {
    document = JSON.parse(text);
  } catch (error) {
    throw new Error(`Original-runtime live-session consumer: ${label} is not valid JSON: ${error.message}`);
  }
  return {
    path: file.path,
    file: file.file,
    bytes: file.bytes,
    sha256: file.sha256,
    metadata: file.metadata,
    document,
  };
}

async function readStableOpaqueFile(sessionRoot, fileName, label) {
  const file = await readStableFile(sessionRoot, fileName, label);
  return {
    path: file.path,
    file: file.file,
    bytes: file.bytes,
    sha256: file.sha256,
    metadata: file.metadata,
  };
}

async function revalidateStableFile(file, label) {
  let currentInfo;
  try {
    currentInfo = await lstat(file.path);
  } catch (error) {
    if (error?.code === "ENOENT") {
      throw new Error(`Original-runtime live-session consumer: ${label} disappeared before evidence-closure completion`);
    }
    throw error;
  }
  invariant(
    currentInfo.isFile() && !currentInfo.isSymbolicLink() && currentInfo.nlink === 1,
    `${label} changed into a non-regular, symbolic-link, or hard-linked file before evidence-closure completion`,
  );
  assertStableMetadata(file.metadata, metadataSnapshot(currentInfo), `${label} closure`);
  invariant(await realpath(file.path) === file.path, `${label} realpath changed before evidence-closure completion`);
}

async function assertDirectFileAbsent(sessionRoot, fileName, label) {
  invariant(path.basename(fileName) === fileName, `${label} filename is not a direct child name`);
  const filePath = path.join(sessionRoot, fileName);
  invariant(path.dirname(filePath) === sessionRoot, `${label} is not a direct child of the session root`);
  try {
    await lstat(filePath);
  } catch (error) {
    if (error?.code === "ENOENT") return;
    throw error;
  }
  throw new Error(`Original-runtime live-session consumer: ${label} must be absent when audioManifestSha256 is null`);
}

function assertDirectFileAbsentSync(sessionRoot, fileName, label) {
  const filePath = path.join(sessionRoot, fileName);
  try {
    lstatSync(filePath);
  } catch (error) {
    if (error?.code === "ENOENT") return;
    throw error;
  }
  throw new Error(`Original-runtime live-session consumer: ${label} appeared after the read-only bundle snapshot`);
}

function rehashStableFileSync(file, label) {
  let beforeInfo;
  try {
    beforeInfo = lstatSync(file.path);
  } catch (error) {
    if (error?.code === "ENOENT") {
      throw new Error(`Original-runtime live-session consumer: ${label} disappeared after the read-only bundle snapshot`);
    }
    throw error;
  }
  invariant(
    beforeInfo.isFile() && !beforeInfo.isSymbolicLink() && beforeInfo.nlink === 1,
    `${label} changed into a non-regular, symbolic-link, or hard-linked file after the read-only bundle snapshot`,
  );
  const before = metadataSnapshot(beforeInfo);
  assertStableMetadata(file.metadata, before, `${label} verification`);
  invariant(realpathSync(file.path) === file.path, `${label} realpath changed after the read-only bundle snapshot`);
  let descriptor;
  let bytes;
  try {
    descriptor = openSync(file.path, fsConstants.O_RDONLY | fsConstants.O_NOFOLLOW);
    const descriptorBefore = metadataSnapshot(fstatSync(descriptor));
    assertStableMetadata(before, descriptorBefore, `${label} verification path/descriptor`);
    bytes = readFileSync(descriptor);
    const descriptorAfter = metadataSnapshot(fstatSync(descriptor));
    assertStableMetadata(descriptorBefore, descriptorAfter, `${label} verification descriptor`);
  } finally {
    if (descriptor !== undefined) closeSync(descriptor);
  }
  invariant(bytes.length === file.bytes, `${label} byte count changed after the read-only bundle snapshot`);
  invariant(sha256Bytes(bytes) === file.sha256, `${label} SHA-256 changed after the read-only bundle snapshot`);
  assertStableMetadata(before, metadataSnapshot(lstatSync(file.path)), `${label} verification path`);
  invariant(realpathSync(file.path) === file.path, `${label} realpath changed during verification`);
}

function rehashLoadedClosureSync(context) {
  const sessionBeforeInfo = lstatSync(context.sessionRoot);
  invariant(
    sessionBeforeInfo.isDirectory() && !sessionBeforeInfo.isSymbolicLink(),
    "session root changed type after the read-only bundle snapshot",
  );
  const sessionBefore = metadataSnapshot(sessionBeforeInfo);
  assertStableMetadata(context.sessionMetadata, sessionBefore, "session root verification");
  for (const [key, file] of Object.entries(context.files)) {
    rehashStableFileSync(file, key);
  }
  for (const [key, file] of Object.entries(context.evidenceFiles)) {
    if (file === null) continue;
    rehashStableFileSync(file, key);
  }
  if (context.evidenceFiles.audioManifest === null) {
    assertDirectFileAbsentSync(
      context.sessionRoot,
      LIVE_SESSION_EVIDENCE_FILES.audioManifest,
      "audio manifest",
    );
  }
  const sessionAfter = metadataSnapshot(lstatSync(context.sessionRoot));
  assertStableMetadata(sessionBefore, sessionAfter, "session root verification");
  invariant(realpathSync(context.sessionRoot) === context.sessionRoot, "session root realpath changed during verification");
}

function assertAuthorityFalse(value, label) {
  assertExactKeys(value, AUTHORITY_KEYS, label);
  for (const key of AUTHORITY_KEYS) invariant(value[key] === false, `${label}.${key} must remain false`);
}

function validateIdentity(document, plan, label) {
  invariant(document.sessionId === plan.sessionId, `${label}.sessionId differs from the plan`);
  invariant(document.animationId === plan.animationId, `${label}.animationId differs from the plan`);
  invariant(document.language === plan.language, `${label}.language differs from the plan`);
}

function validatePlan(document, file, nowMs) {
  assertExactKeys(document, SESSION_PLAN_KEYS, "session plan");
  invariant(
    document.schemaVersion === LIVE_SESSION_SCHEMA_VERSION &&
      document.evidenceType === LIVE_SESSION_EVIDENCE_TYPES.sessionPlan,
    "session plan schema/type is invalid",
  );
  invariant(document.status === "pending-candidate-session-plan", "session plan status is invalid");
  invariant(SESSION_ID_PATTERN.test(document.sessionId || ""), "session plan sessionId is invalid");
  assertString(document.animationId, "session plan animationId");
  invariant(["en", "es"].includes(document.language), "session plan language must be en or es");
  invariant(Array.isArray(document.requirementIds) && document.requirementIds.length > 0, "session plan requirementIds must be non-empty");
  const requirements = document.requirementIds.map((value, index) =>
    assertString(value, `session plan requirementIds[${index}]`));
  invariant(new Set(requirements).size === requirements.length, "session plan requirementIds contain duplicates");
  invariant(
    sameCanonical(requirements, [...requirements].sort()),
    "session plan requirementIds must be lexically sorted",
  );
  for (const key of [
    "traceSpecSetSha256",
    "sessionKitSha256",
    "profileManifestSha256",
    "hostTreeManifestSha256",
    "projectorExecutableSha256",
    "containmentReadinessSha256",
    "runtimeEnvironmentReadinessSha256",
    "hostIdSha256",
  ]) assertSha256(document[key], `session plan ${key}`);
  parseCanonicalTimestamp(document.createdAt, "session plan createdAt", {nowMs});
  assertAuthorityFalse(document.authority, "session plan authority");
  invariant(path.basename(file.path) === FILES.sessionPlan, "session plan filename is invalid");
}

function validateCandidateManifest(document, plan, files, evidenceFiles, times, nowMs) {
  assertExactKeys(document, CANDIDATE_MANIFEST_KEYS, "candidate manifest");
  invariant(
    document.schemaVersion === LIVE_SESSION_SCHEMA_VERSION &&
      document.evidenceType === LIVE_SESSION_EVIDENCE_TYPES.candidateManifest,
    "candidate manifest schema/type is invalid",
  );
  invariant(document.status === "pending-candidate", "candidate manifest status must remain pending-candidate");
  validateIdentity(document, plan, "candidate manifest");
  invariant(document.sessionPlanSha256 === files.sessionPlan.sha256, "candidate manifest session-plan digest drifted");
  invariant(
    document.prelaunchAuthorizationSha256 === files.prelaunchAuthorization.sha256,
    "candidate manifest prelaunch digest drifted",
  );
  invariant(document.processClaimSha256 === files.processClaim.sha256, "candidate manifest process-claim digest drifted");
  const evidenceHashBindings = Object.freeze({
    operationLogSha256: "operationLog",
    stateLogSha256: "stateLog",
    sourceTargetLogSha256: "sourceTargetLog",
    hostEntryLogSha256: "hostEntryLog",
    frameManifestSha256: "frameManifest",
    requestAuditSha256: "requestAudit",
  });
  for (const [manifestKey, evidenceKey] of Object.entries(evidenceHashBindings)) {
    assertSha256(document[manifestKey], `candidate manifest ${manifestKey}`);
    invariant(
      evidenceFiles[evidenceKey]?.bytes > 0,
      `required evidence file ${LIVE_SESSION_EVIDENCE_FILES[evidenceKey]} must not be empty`,
    );
    invariant(
      evidenceFiles[evidenceKey]?.sha256 === document[manifestKey],
      `candidate manifest ${manifestKey} differs from the actual ${LIVE_SESSION_EVIDENCE_FILES[evidenceKey]} bytes`,
    );
  }
  if (document.audioManifestSha256 !== null) {
    assertSha256(document.audioManifestSha256, "candidate manifest audioManifestSha256");
    invariant(
      evidenceFiles.audioManifest?.bytes > 0,
      `required evidence file ${LIVE_SESSION_EVIDENCE_FILES.audioManifest} must not be empty`,
    );
    invariant(
      evidenceFiles.audioManifest?.sha256 === document.audioManifestSha256,
      `candidate manifest audioManifestSha256 differs from the actual ${LIVE_SESSION_EVIDENCE_FILES.audioManifest} bytes`,
    );
  } else {
    invariant(
      evidenceFiles.audioManifest === null,
      "audio manifest binding must be null when candidate manifest audioManifestSha256 is null",
    );
  }
  const createdAtMs = parseCanonicalTimestamp(document.createdAt, "candidate manifest createdAt", {nowMs});
  invariant(createdAtMs >= times.endedAtMs, "candidate manifest predates the declared session end");
  invariant(createdAtMs <= times.completedAtMs, "candidate manifest postdates the completion signature");
  assertAuthorityFalse(document.authority, "candidate manifest authority");
}

function validateProcessAbsenceSnapshot(value, plan, nowMs) {
  assertExactKeys(value, PROCESS_ABSENCE_KEYS, "prelaunch processAbsenceSnapshot");
  const capturedAtMs = parseCanonicalTimestamp(
    value.capturedAt,
    "prelaunch processAbsenceSnapshot.capturedAt",
    {nowMs},
  );
  invariant(value.hostIdSha256 === plan.hostIdSha256, "process-absence snapshot host identity differs from the plan");
  assertSha256(value.processTableSha256, "prelaunch processAbsenceSnapshot.processTableSha256");
  invariant(Array.isArray(value.observedFlashPids), "prelaunch processAbsenceSnapshot.observedFlashPids must be an array");
  let previous = 0;
  for (const [index, processId] of value.observedFlashPids.entries()) {
    assertPositiveInteger(processId, `prelaunch observedFlashPids[${index}]`);
    invariant(processId > previous, "prelaunch observedFlashPids must be unique and numerically sorted");
    previous = processId;
  }
  return {capturedAtMs, observedFlashPids: new Set(value.observedFlashPids)};
}

function validateContainmentApproval(value) {
  assertExactKeys(value, CONTAINMENT_APPROVAL_KEYS, "prelaunch containmentApproval");
  invariant(
    sameCanonical(value.controlIds, ["CR-01", "CR-02", "CR-03", "CR-04", "CR-05", "CR-06", "CR-07", "CR-08"]),
    "prelaunch containmentApproval must bind exactly CR-01 through CR-08",
  );
  for (const key of [
    "approvalManifestSha256",
    "liveNoEgressPreflightSha256",
    "liveCapacityPreflightSha256",
  ]) assertSha256(value[key], `prelaunch containmentApproval.${key}`);
}

function phaseStateSha256({phase, sequence, envelopeSha256, sessionPlanSha256, sessionNonce}) {
  return sha256Canonical({
    schemaVersion: LIVE_SESSION_SCHEMA_VERSION,
    evidenceType: "original-runtime-live-session-phase-state",
    phase,
    sequence,
    envelopeSha256,
    sessionPlanSha256,
    sessionNonce,
  });
}

function normalizeReplaySnapshot(value) {
  invariant(Array.isArray(value) || value instanceof Set, "replayedNonces must be an array or Set");
  const result = new Set();
  for (const [index, nonce] of [...value].entries()) {
    invariant(NONCE_PATTERN.test(nonce || ""), `replayedNonces[${index}] is invalid`);
    invariant(!result.has(nonce), "replayedNonces contains a duplicate nonce");
    result.add(nonce);
  }
  return result;
}

function verifyUnsignedSchemas(files, nowMs) {
  const plan = files.sessionPlan.document;
  validatePlan(plan, files.sessionPlan, nowMs);
  invariant(path.basename(path.dirname(files.sessionPlan.path)) === plan.sessionId, "session directory must equal the signed sessionId");

  const nonce = files.nonceReservation.document;
  assertExactKeys(nonce.payload, NONCE_RESERVATION_KEYS, "nonce reservation payload");
  invariant(
    nonce.payload.schemaVersion === LIVE_SESSION_SCHEMA_VERSION &&
      nonce.payload.evidenceType === LIVE_SESSION_EVIDENCE_TYPES.nonceReservation,
    "nonce reservation schema/type is invalid",
  );
  invariant(nonce.payload.status === "reserved-for-one-live-session", "nonce reservation status is invalid");
  validateIdentity(nonce.payload, plan, "nonce reservation");
  invariant(nonce.payload.sessionPlanSha256 === files.sessionPlan.sha256, "nonce reservation plan digest drifted");
  invariant(NONCE_PATTERN.test(nonce.payload.sessionNonce || ""), "nonce reservation sessionNonce is invalid");
  assertString(nonce.payload.reservationId, "nonce reservation reservationId");
  assertPositiveInteger(nonce.payload.nonceSequence, "nonce reservation nonceSequence");
  if (nonce.payload.nonceSequence === 1) {
    invariant(nonce.payload.previousNonceReservationSha256 === null, "first nonce reservation must have a null predecessor");
  } else {
    assertSha256(nonce.payload.previousNonceReservationSha256, "nonce reservation previousNonceReservationSha256");
  }
  invariant(
    nonce.payload.scope === "reserve-one-live-session-nonce-no-promotion-authority",
    "nonce reservation scope is invalid",
  );

  const prelaunch = files.prelaunchAuthorization.document;
  assertExactKeys(prelaunch.payload, PRELAUNCH_KEYS, "prelaunch authorization payload");
  invariant(
    prelaunch.payload.schemaVersion === LIVE_SESSION_SCHEMA_VERSION &&
      prelaunch.payload.evidenceType === LIVE_SESSION_EVIDENCE_TYPES.prelaunchAuthorization,
    "prelaunch authorization schema/type is invalid",
  );
  invariant(prelaunch.payload.decision === "authorized", "prelaunch authorization decision is invalid");
  validateIdentity(prelaunch.payload, plan, "prelaunch authorization");
  invariant(prelaunch.payload.sessionPlanSha256 === files.sessionPlan.sha256, "prelaunch plan digest drifted");
  invariant(
    prelaunch.payload.nonceReservationSha256 === files.nonceReservation.sha256,
    "prelaunch nonce-reservation digest drifted",
  );
  invariant(prelaunch.payload.sessionNonce === nonce.payload.sessionNonce, "prelaunch sessionNonce differs");
  invariant(prelaunch.payload.phaseSequence === 1, "prelaunch phaseSequence must be 1");
  invariant(prelaunch.payload.previousEnvelopeSha256 === null, "prelaunch previousEnvelopeSha256 must be null");
  invariant(prelaunch.payload.expectedPriorStateSha256 === null, "prelaunch expectedPriorStateSha256 must be null");
  for (const key of ["operatorSubjectId", "independentReviewerSubjectId", "releaseCustodianSubjectId"]) {
    assertString(prelaunch.payload[key], `prelaunch ${key}`);
  }
  validateContainmentApproval(prelaunch.payload.containmentApproval);
  invariant(
    prelaunch.payload.scope === "authorize-exact-live-session-only-no-baseline-or-acceptance",
    "prelaunch scope is invalid",
  );

  const review = files.independentReviewAssignment.document;
  assertExactKeys(review.payload, REVIEW_ASSIGNMENT_KEYS, "independent-review assignment payload");
  invariant(
    review.payload.schemaVersion === LIVE_SESSION_SCHEMA_VERSION &&
      review.payload.evidenceType === LIVE_SESSION_EVIDENCE_TYPES.independentReviewAssignment,
    "independent-review assignment schema/type is invalid",
  );
  invariant(review.payload.status === "assigned-no-review-performed", "independent-review assignment status is invalid");
  validateIdentity(review.payload, plan, "independent-review assignment");
  invariant(review.payload.sessionPlanSha256 === files.sessionPlan.sha256, "independent-review assignment plan digest drifted");
  invariant(
    review.payload.prelaunchAuthorizationSha256 === files.prelaunchAuthorization.sha256,
    "independent-review assignment prelaunch digest drifted",
  );
  invariant(
    review.payload.scope === "future-independent-review-assignment-no-acceptance-effect",
    "independent-review assignment scope is invalid",
  );

  const claim = files.processClaim.document;
  assertExactKeys(claim.payload, PROCESS_CLAIM_KEYS, "process-claim payload");
  invariant(
    claim.payload.schemaVersion === LIVE_SESSION_SCHEMA_VERSION &&
      claim.payload.evidenceType === LIVE_SESSION_EVIDENCE_TYPES.processClaim,
    "process-claim schema/type is invalid",
  );
  invariant(claim.payload.status === "fresh-process-claimed", "process-claim status is invalid");
  validateIdentity(claim.payload, plan, "process claim");
  invariant(claim.payload.sessionPlanSha256 === files.sessionPlan.sha256, "process claim plan digest drifted");
  invariant(claim.payload.nonceReservationSha256 === files.nonceReservation.sha256, "process claim nonce digest drifted");
  invariant(
    claim.payload.prelaunchAuthorizationSha256 === files.prelaunchAuthorization.sha256,
    "process claim prelaunch digest drifted",
  );
  invariant(
    claim.payload.independentReviewAssignmentSha256 === files.independentReviewAssignment.sha256,
    "process claim independent-review assignment digest drifted",
  );
  invariant(claim.payload.sessionNonce === nonce.payload.sessionNonce, "process claim sessionNonce differs");
  invariant(claim.payload.phaseSequence === 2, "process-claim phaseSequence must be 2");
  invariant(
    claim.payload.previousEnvelopeSha256 === files.prelaunchAuthorization.sha256,
    "process claim previous-envelope CAS binding drifted",
  );
  const prelaunchStateSha256 = phaseStateSha256({
    phase: "prelaunch",
    sequence: 1,
    envelopeSha256: files.prelaunchAuthorization.sha256,
    sessionPlanSha256: files.sessionPlan.sha256,
    sessionNonce: nonce.payload.sessionNonce,
  });
  invariant(
    claim.payload.expectedPriorStateSha256 === prelaunchStateSha256,
    "process claim expected-prior-state CAS digest drifted",
  );
  assertPositiveInteger(claim.payload.processId, "process claim processId");
  assertSha256(claim.payload.processIdentitySha256, "process claim processIdentitySha256");
  invariant(
    claim.payload.projectorExecutableSha256 === plan.projectorExecutableSha256,
    "process claim Projector executable digest differs from the plan",
  );
  invariant(
    claim.payload.scope === "claim-fresh-post-authorization-process-only-no-baseline-authority",
    "process claim scope is invalid",
  );

  const completion = files.sessionCompletion.document;
  assertExactKeys(completion.payload, SESSION_COMPLETION_KEYS, "session-completion payload");
  invariant(
    completion.payload.schemaVersion === LIVE_SESSION_SCHEMA_VERSION &&
      completion.payload.evidenceType === LIVE_SESSION_EVIDENCE_TYPES.sessionCompletion,
    "session completion schema/type is invalid",
  );
  invariant(
    completion.payload.status === "completed-for-pending-candidate-only",
    "session completion status is invalid",
  );
  validateIdentity(completion.payload, plan, "session completion");
  invariant(completion.payload.sessionPlanSha256 === files.sessionPlan.sha256, "completion plan digest drifted");
  invariant(
    completion.payload.candidateManifestSha256 === files.candidateManifest.sha256,
    "completion candidate-manifest digest drifted",
  );
  invariant(
    completion.payload.nonceReservationSha256 === files.nonceReservation.sha256 &&
      completion.payload.prelaunchAuthorizationSha256 === files.prelaunchAuthorization.sha256 &&
      completion.payload.independentReviewAssignmentSha256 === files.independentReviewAssignment.sha256 &&
      completion.payload.processClaimSha256 === files.processClaim.sha256,
    "completion predecessor digest chain drifted",
  );
  invariant(completion.payload.sessionNonce === nonce.payload.sessionNonce, "completion sessionNonce differs");
  invariant(completion.payload.phaseSequence === 3, "completion phaseSequence must be 3");
  invariant(
    completion.payload.previousEnvelopeSha256 === files.processClaim.sha256,
    "completion previous-envelope CAS binding drifted",
  );
  const claimStateSha256 = phaseStateSha256({
    phase: "claim",
    sequence: 2,
    envelopeSha256: files.processClaim.sha256,
    sessionPlanSha256: files.sessionPlan.sha256,
    sessionNonce: nonce.payload.sessionNonce,
  });
  invariant(
    completion.payload.expectedPriorStateSha256 === claimStateSha256,
    "completion expected-prior-state CAS digest drifted",
  );
  invariant(completion.payload.processExited === true, "completion must prove the claimed process exited");
  invariant(completion.payload.successfulOutboundRequests === 0, "completion reports a successful outbound request");
  invariant(completion.payload.persistentSideEffects === 0, "completion reports a persistent side effect");
  invariant(
    completion.payload.scope === "complete-session-as-pending-candidate-only-no-baseline-or-acceptance",
    "session completion scope is invalid",
  );
  return {plan, nonce, prelaunch, review, claim, completion, prelaunchStateSha256, claimStateSha256};
}

function validateTimes(documents, nowMs) {
  const reservedAtMs = parseCanonicalTimestamp(documents.nonce.payload.reservedAt, "nonce reservation reservedAt", {nowMs});
  const snapshot = validateProcessAbsenceSnapshot(
    documents.prelaunch.payload.processAbsenceSnapshot,
    documents.plan,
    nowMs,
  );
  const authorizedAtMs = parseCanonicalTimestamp(documents.prelaunch.payload.authorizedAt, "prelaunch authorizedAt", {nowMs});
  const notAfterMs = parseCanonicalTimestamp(documents.prelaunch.payload.notAfter, "prelaunch notAfter", {nowMs, allowFuture: true});
  const assignedAtMs = parseCanonicalTimestamp(documents.review.payload.assignedAt, "independent-review assignment assignedAt", {nowMs});
  const processStartedAtMs = parseCanonicalTimestamp(documents.claim.payload.processStartedAt, "process claim processStartedAt", {nowMs});
  const claimedAtMs = parseCanonicalTimestamp(documents.claim.payload.claimedAt, "process claim claimedAt", {nowMs});
  const endedAtMs = parseCanonicalTimestamp(documents.completion.payload.endedAt, "session completion endedAt", {nowMs});
  const completedAtMs = parseCanonicalTimestamp(documents.completion.payload.completedAt, "session completion completedAt", {nowMs});
  invariant(reservedAtMs <= snapshot.capturedAtMs, "nonce reservation must precede the process-absence snapshot");
  invariant(snapshot.capturedAtMs <= authorizedAtMs, "process-absence snapshot postdates owner authorization");
  invariant(authorizedAtMs < notAfterMs, "prelaunch authorization expiry must follow authorization");
  invariant(assignedAtMs >= authorizedAtMs, "independent-review assignment predates owner authorization");
  invariant(processStartedAtMs > authorizedAtMs, "process claim is retroactive or predates owner authorization");
  invariant(processStartedAtMs > snapshot.capturedAtMs, "process existed at or before the process-absence preflight");
  invariant(processStartedAtMs <= notAfterMs, "process started after prelaunch authorization expired");
  invariant(assignedAtMs <= processStartedAtMs, "independent reviewer was assigned only after process start");
  invariant(claimedAtMs >= processStartedAtMs, "process claim predates process start");
  invariant(endedAtMs > claimedAtMs, "session end must follow the signed process claim");
  invariant(completedAtMs >= endedAtMs, "completion signature predates session end");
  const processId = documents.claim.payload.processId;
  invariant(!snapshot.observedFlashPids.has(processId), "process claim reuses a PID observed before authorization");
  invariant(
    !PROTECTED_PREEXISTING_FLASH_PIDS.includes(processId),
    `process claim reuses protected pre-existing diagnostic PID ${processId}`,
  );
  return {
    reservedAtMs,
    snapshot,
    authorizedAtMs,
    notAfterMs,
    assignedAtMs,
    processStartedAtMs,
    claimedAtMs,
    endedAtMs,
    completedAtMs,
  };
}

/**
 * Load the seven signed/session metadata files plus the complete fixed-name
 * evidence closure from the project-local ignored evidence allowlist. Evidence
 * bytes are hashed but never decoded, parsed, or returned.
 */
export async function loadOriginalRuntimeLiveSessionBundle({
  projectRoot,
  sessionRoot,
} = {}) {
  assertString(projectRoot, "projectRoot");
  assertString(sessionRoot, "sessionRoot");
  const declaredProjectRoot = path.resolve(projectRoot);
  const declaredAllowedRoot = path.resolve(declaredProjectRoot, LIVE_SESSION_ALLOWED_ROOT);
  const declaredSessionRoot = path.resolve(sessionRoot);
  const [realProjectRoot, realAllowedRoot, realSessionRoot] = await Promise.all([
    realpath(declaredProjectRoot),
    realpath(declaredAllowedRoot),
    realpath(declaredSessionRoot),
  ]);
  invariant(realProjectRoot === declaredProjectRoot, "project root must resolve without symbolic links");
  invariant(realAllowedRoot === declaredAllowedRoot, "live-session allowlisted root must resolve without symbolic links");
  invariant(realSessionRoot === declaredSessionRoot, "session root must resolve without symbolic links");
  invariant(isContained(realProjectRoot, realAllowedRoot), "live-session allowlisted root escapes the project");
  invariant(
    realSessionRoot !== realAllowedRoot && isContained(realAllowedRoot, realSessionRoot),
    "session root must be a child of the fixed live-session allowlist",
  );
  await assertRealDirectoryTree(realAllowedRoot, realSessionRoot, "session root");
  const sessionInfo = await lstat(realSessionRoot);
  invariant(sessionInfo.isDirectory() && !sessionInfo.isSymbolicLink(), "session root must be a real directory");
  const sessionBefore = metadataSnapshot(sessionInfo);
  const files = Object.fromEntries(await Promise.all(
    Object.entries(FILES).map(async ([key, fileName]) => [
      key,
      await readStableJsonFile(realSessionRoot, fileName, key),
    ]),
  ));
  const audioRequired = files.candidateManifest.document?.audioManifestSha256 !== null;
  if (!audioRequired) {
    await assertDirectFileAbsent(
      realSessionRoot,
      LIVE_SESSION_EVIDENCE_FILES.audioManifest,
      "audio manifest",
    );
  }
  const evidenceFiles = Object.fromEntries(await Promise.all(
    Object.entries(LIVE_SESSION_EVIDENCE_FILES)
      .filter(([key]) => key !== "audioManifest" || audioRequired)
      .map(async ([key, fileName]) => [
        key,
        await readStableOpaqueFile(realSessionRoot, fileName, key),
      ]),
  ));
  if (!audioRequired) {
    evidenceFiles.audioManifest = null;
    await assertDirectFileAbsent(
      realSessionRoot,
      LIVE_SESSION_EVIDENCE_FILES.audioManifest,
      "audio manifest",
    );
  }
  await Promise.all([
    ...Object.entries(files).map(([key, file]) =>
      revalidateStableFile(file, key)),
    ...Object.entries(evidenceFiles)
      .filter(([, file]) => file !== null)
      .map(([key, file]) => revalidateStableFile(file, key)),
  ]);
  const sessionAfterInfo = await lstat(realSessionRoot);
  invariant(
    sessionAfterInfo.isDirectory() && !sessionAfterInfo.isSymbolicLink(),
    "session root changed type while the evidence closure was being read",
  );
  assertStableMetadata(sessionBefore, metadataSnapshot(sessionAfterInfo), "session root");
  invariant(await realpath(realSessionRoot) === realSessionRoot, "session root realpath changed while the evidence closure was being read");
  const bundle = deepFreeze({
    status: "loaded-read-only-unverified",
    projectRoot: realProjectRoot,
    allowedRoot: realAllowedRoot,
    sessionRoot: realSessionRoot,
    files: Object.fromEntries(Object.entries(files).map(([key, file]) => [
      key,
      {path: file.path, bytes: file.bytes, sha256: file.sha256},
    ])),
    evidenceFiles: Object.fromEntries(Object.entries(evidenceFiles).map(([key, file]) => [
      key,
      file === null
        ? null
        : {file: file.file, bytes: file.bytes, sha256: file.sha256},
    ])),
  });
  BUNDLE_CONTEXTS.set(bundle, {
    files,
    evidenceFiles,
    sessionRoot: realSessionRoot,
    sessionMetadata: sessionBefore,
  });
  return bundle;
}

function verifyRoleEnvelope({trustState, file, payloadKeys, evidenceType, role, eventField, label}) {
  return verifyOriginalRuntimeLiveSessionRoleEnvelopeDiagnostic({
    trustState,
    envelope: file.document,
    payloadKeys,
    evidenceType,
    role,
    eventField,
    label,
  });
}

function requireDistinctRoles(signers) {
  const entries = Object.entries(signers);
  invariant(new Set(entries.map(([, signer]) => signer.subjectId)).size === entries.length, "operator, registry, independent reviewer, owner, and release custodian must use five distinct subject IDs");
  invariant(new Set(entries.map(([, signer]) => signer.keyFingerprintSha256)).size === entries.length, "operator, registry, independent reviewer, owner, and release custodian must use five distinct key fingerprints");
}

function verifyLiveSessionWithTrust({
  bundle,
  trustRoot,
  registryCheckpoints,
  revocationCheckpoints,
  replayedNonces,
  now,
  productionAnchorConfigured,
}) {
  const context = bundle && typeof bundle === "object" ? BUNDLE_CONTEXTS.get(bundle) : null;
  invariant(context, "verification requires an opaque bundle returned by loadOriginalRuntimeLiveSessionBundle");
  const nowMs = now instanceof Date ? now.getTime() : typeof now === "string" ? Date.parse(now) : now ?? Date.now();
  invariant(Number.isFinite(nowMs), "now must be a valid timestamp");
  rehashLoadedClosureSync(context);
  const documents = verifyUnsignedSchemas(context.files, nowMs);
  const times = validateTimes(documents, nowMs);
  const replaySnapshot = normalizeReplaySnapshot(replayedNonces);
  invariant(!replaySnapshot.has(documents.nonce.payload.sessionNonce), "session nonce has already been used");

  const trustState = verifyOriginalRuntimeLiveSessionTrustStateDiagnostic({
    trustRoot,
    registryCheckpoints,
    revocationCheckpoints,
    sessionStartedAt: documents.claim.payload.processStartedAt,
    now: nowMs,
  });
  const nonce = verifyRoleEnvelope({
    trustState,
    file: context.files.nonceReservation,
    payloadKeys: NONCE_RESERVATION_KEYS,
    evidenceType: LIVE_SESSION_EVIDENCE_TYPES.nonceReservation,
    role: TRUST_ROLES.release,
    eventField: "reservedAt",
    label: "live-session nonce reservation",
  });
  const prelaunch = verifyRoleEnvelope({
    trustState,
    file: context.files.prelaunchAuthorization,
    payloadKeys: PRELAUNCH_KEYS,
    evidenceType: LIVE_SESSION_EVIDENCE_TYPES.prelaunchAuthorization,
    role: TRUST_ROLES.ownerDecision,
    eventField: "authorizedAt",
    label: "live-session prelaunch authorization",
  });
  const review = verifyRoleEnvelope({
    trustState,
    file: context.files.independentReviewAssignment,
    payloadKeys: REVIEW_ASSIGNMENT_KEYS,
    evidenceType: LIVE_SESSION_EVIDENCE_TYPES.independentReviewAssignment,
    role: TRUST_ROLES.humanReview,
    eventField: "assignedAt",
    label: "live-session independent-review assignment",
  });
  const claim = verifyRoleEnvelope({
    trustState,
    file: context.files.processClaim,
    payloadKeys: PROCESS_CLAIM_KEYS,
    evidenceType: LIVE_SESSION_EVIDENCE_TYPES.processClaim,
    role: TRUST_ROLES.captureOperator,
    eventField: "claimedAt",
    label: "live-session process claim",
  });
  const completion = verifyRoleEnvelope({
    trustState,
    file: context.files.sessionCompletion,
    payloadKeys: SESSION_COMPLETION_KEYS,
    evidenceType: LIVE_SESSION_EVIDENCE_TYPES.sessionCompletion,
    role: TRUST_ROLES.captureOperator,
    eventField: "completedAt",
    label: "live-session completion",
  });
  invariant(
    claim.signer.subjectId === completion.signer.subjectId &&
      claim.signer.keyFingerprintSha256 === completion.signer.keyFingerprintSha256,
    "process claim and completion must be signed by the same capture operator",
  );
  invariant(prelaunch.payload.operatorSubjectId === claim.signer.subjectId, "prelaunch designated a different capture operator");
  invariant(
    prelaunch.payload.independentReviewerSubjectId === review.signer.subjectId,
    "prelaunch designated a different independent reviewer",
  );
  invariant(
    prelaunch.payload.releaseCustodianSubjectId === nonce.signer.subjectId,
    "prelaunch designated a different release custodian",
  );
  const roleSigners = {
    registry: trustState.registrySigner,
    operator: claim.signer,
    independentReviewer: review.signer,
    owner: prelaunch.signer,
    releaseCustodian: nonce.signer,
  };
  requireDistinctRoles(roleSigners);
  validateCandidateManifest(
    context.files.candidateManifest.document,
    documents.plan,
    context.files,
    context.evidenceFiles,
    times,
    nowMs,
  );
  rehashLoadedClosureSync(context);

  return deepFreeze({
    ok: true,
    status: LIVE_SESSION_STATUS,
    diagnosticOnly: !productionAnchorConfigured,
    productionAnchorConfigured,
    trustVerifiedForLiveSession: productionAnchorConfigured,
    originalRuntimeCandidateVerified: true,
    authoritativeOriginalRuntimeTrace: false,
    authoritativeBaseline: false,
    baselineAccepted: false,
    audioAccepted: false,
    humanVisualAccepted: false,
    ownerAccepted: false,
    strictMigrationComplete: false,
    publicRelease: false,
    strictAcceptanceEffect: "none",
    session: {
      sessionId: documents.plan.sessionId,
      animationId: documents.plan.animationId,
      language: documents.plan.language,
      processId: documents.claim.payload.processId,
      processStartedAt: documents.claim.payload.processStartedAt,
      endedAt: documents.completion.payload.endedAt,
    },
    bindings: {
      sessionPlanSha256: context.files.sessionPlan.sha256,
      candidateManifestSha256: context.files.candidateManifest.sha256,
      nonceReservationSha256: nonce.sha256,
      prelaunchAuthorizationSha256: prelaunch.sha256,
      independentReviewAssignmentSha256: review.sha256,
      processClaimSha256: claim.sha256,
      sessionCompletionSha256: completion.sha256,
      prelaunchStateSha256: documents.prelaunchStateSha256,
      claimStateSha256: documents.claimStateSha256,
      trustRootAuthoritySha256: trustState.trustRootAuthoritySha256,
      captureRegistryCheckpointSha256: trustState.captureRegistryCheckpointSha256,
      verificationRegistryHeadSha256: trustState.verificationRegistryHeadSha256,
      revocationCheckpointSha256: trustState.revocationCheckpointSha256,
      evidenceFiles: Object.fromEntries(Object.entries(context.evidenceFiles).map(([key, file]) => [
        key,
        file === null
          ? null
          : {file: file.file, bytes: file.bytes, sha256: file.sha256},
      ])),
    },
    roles: roleSigners,
    replayProtection: {
      nonce: documents.nonce.payload.sessionNonce,
      signedReservation: true,
      callerReplaySnapshotChecked: true,
      phaseCasChainVerified: true,
    },
    statement: "This result verifies only a signed live-session evidence package as a pending candidate. It is not an authoritative baseline, human review, owner acceptance, strict completion, promotion, ledger update, or release.",
  });
}

/**
 * Read-only diagnostic verifier for tests and external-owner integration work.
 * It can never mark the trust root as the fixed production anchor.
 */
export function verifyOriginalRuntimeLiveSessionDiagnostic(options = {}) {
  return verifyLiveSessionWithTrust({...options, productionAnchorConfigured: false});
}

function productionAnchorError(cause) {
  const error = new Error(
    `${LIVE_SESSION_PRODUCTION_ANCHOR_NOT_CONFIGURED_CODE}: fixed production trust anchor is unavailable or invalid${cause ? `: ${cause.message}` : ""}`,
  );
  error.code = LIVE_SESSION_PRODUCTION_ANCHOR_NOT_CONFIGURED_CODE;
  return error;
}

/**
 * Production entry point. The owner root and trust-root pathname are fixed in
 * this module and cannot be replaced by CLI arguments, environment variables,
 * candidate files, or a project-local configuration.
 */
export async function verifyOriginalRuntimeLiveSession({
  projectRoot,
  bundle,
  registryCheckpoints,
  revocationCheckpoints,
  replayedNonces,
  now = Date.now(),
} = {}) {
  let trustRoot;
  try {
    trustRoot = await loadExternalTrustRootConfig({
      projectRoot,
      ownerControlledRoot: LIVE_SESSION_PRODUCTION_OWNER_ROOT,
      trustRootConfigPath: LIVE_SESSION_PRODUCTION_TRUST_ROOT_PATH,
      now,
    });
  } catch (error) {
    throw productionAnchorError(error);
  }
  return verifyLiveSessionWithTrust({
    bundle,
    trustRoot,
    registryCheckpoints,
    revocationCheckpoints,
    replayedNonces,
    now,
    productionAnchorConfigured: true,
  });
}
