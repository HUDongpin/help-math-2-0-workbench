import {
  createHash,
  createPublicKey,
  verify as verifySignature,
} from "node:crypto";
import path from "node:path";

// Every exported *ShapeOnly validator is intentionally non-admitting.
// validatePreLaunchAdmissionV4 is the only pre-launch admission API;
// validateFullSessionChainV4 validates the later complete evidence DAG.

const HASH = /^[a-f0-9]{64}$/u;
const SESSION_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;
const NONCE = /^[A-Za-z0-9_-]{32,128}$/u;
const ACTION_ID = /^[a-z0-9][a-z0-9.-]{2,127}$/u;
const RELEASE_ID = "lesson-g04-l10-perimeter-area";
const LAUNCH_PROTOCOL = "two-stage-empty-projector-then-named-human-file-open";
const SOURCE_OPEN_METHOD = "named-human-gui-file-open";
const SOURCE_OPEN_MENU_PATH = Object.freeze(["File", "Open File…"]);
const SOURCE_OPEN_STATEMENT =
  "本人确认 hash-bound schema-v4 pre-launch candidate、全部 preflight 与 owner-signed authorization 已绑定；stateful launcher 以不可逆 token transition 启动未带 SWF 参数的空 Adobe Projector；随后我本人通过 File → Open File… 选择 plan 所列 staged source SWF；authenticated GUI event、capture-start marker 与 first-frame marker 均已绑定本 operator、session 与实际 process instance；未直接启动 source-assets，也未执行保存、发布、导出、转换或 direct-child-open";
const OPERATION_POLICY_VERSION = "g4-l10-root-capture-operation-policy-v4.1";
const REQUIRED_STOP_CONDITIONS = Object.freeze([
  "unexpected-dialog-or-window",
  "successful-network-or-legacy-endpoint-request",
  "unallowlisted-local-resource-request",
  "source-runtime-profile-or-output-root-hash-drift",
  "preexisting-or-mismatched-process-identity",
  "operator-session-identity-or-validity-window-mismatch",
]);
const ALLOWED_HUMAN_OPERATION_IDS = Object.freeze([
  "projector.exit",
  "projector.file-open-exact-staged-source",
  "projector.root-capture-natural-trace",
]);
const HUMAN_ONLY_OPERATION_IDS = Object.freeze([
  "projector.exit",
  "projector.file-open-exact-staged-source",
]);
const FORBIDDEN_OPERATION_IDS = Object.freeze([
  "projector.convert-source",
  "projector.direct-child-swf-open",
  "projector.export-source",
  "projector.publish-source",
  "projector.save-source",
]);
const CAPTURE_OBLIGATION_COUNT = 94;
const SESSION_OUTPUT_MANIFEST_RELATIVE_PATH = "session-output-manifest.json";
const OBSERVER_SESSION_FILENAMES = Object.freeze({
  network: "network-observer-session.json",
  requests: "request-observer-session.json",
  process: "process-observer-session.json",
  windows: "window-observer-session.json",
  effects: "effect-observer-session.json",
  audio: "audio-observer-session.json",
  gui: "gui-observer-session.json",
});
const STOP_CONDITION_OBSERVER_ROLE = Object.freeze({
  "unexpected-dialog-or-window": "windows",
  "successful-network-or-legacy-endpoint-request": "network",
  "unallowlisted-local-resource-request": "requests",
  "source-runtime-profile-or-output-root-hash-drift": "effects",
  "preexisting-or-mismatched-process-identity": "process",
  "operator-session-identity-or-validity-window-mismatch": "gui",
});
const OBSERVER_ROLE_REHASH_KEY = Object.freeze({
  network: "networkObserverReceipt",
  requests: "requestObserverReceipt",
  process: "processObserverReceipt",
  windows: "windowObserverReceipt",
  effects: "effectObserverReceipt",
  audio: "audioObserverReceipt",
  gui: "guiObserverReceipt",
});
const EXPECTED_CONTROL_ARTIFACT_FILES = Object.freeze([
  "audio-observer-session.json",
  "capture-session-attestation.json",
  "capture-start-marker.json",
  "display-list-states.jsonl",
  "effect-observer-session.json",
  "first-frame-marker.json",
  "gui-observer-session.json",
  "gui-source-open-event.json",
  "network-observer-session.json",
  "operation-log.jsonl",
  "process-observer-session.json",
  "request-observer-session.json",
  "runtime-toolchain-receipt.json",
  SESSION_OUTPUT_MANIFEST_RELATIVE_PATH,
  "token-transition-receipt.json",
  "window-observer-session.json",
]);
const CAPACITY_SIZING_POLICY = Object.freeze({
  schemaVersion: 4,
  policyVersion: "g4-l10-root-capture-capacity-sizing-v4.1",
  formula: Object.freeze({
    decodedWorkingSetBytes:
      "rootFrameCount*captureRaster.width*captureRaster.height*bytesPerPixel*workingCopies",
    nativePngWorstCaseBytes:
      "obligationCount*(captureRaster.width*captureRaster.height*bytesPerPixel+captureRaster.height+pngPerFileOverheadBytes)",
    operationalAuditBytes:
      "max(minimumOperationalAuditBytes,logBytes+manifestBytes+requestAuditBytes+audioAuditBytes+processAuditBytes)",
    comparisonDiffRmseBytes:
      "max(minimumComparisonDiffRmseBytes,comparisonDecodedBytes+diffDecodedBytes+rmseRecordBytes)",
    uncompressedArchiveBytes:
      "nativePngWorstCaseBytes+operationalAuditBytes+comparisonDiffRmseBytes",
    compressedArchiveBytes:
      "ceil(uncompressedArchiveBytes*archiveWorstCaseNumerator/archiveWorstCaseDenominator)",
    atomicFinalizationTempBytes:
      "compressedArchiveBytes+expectedArtifactFileCount*manifestBytesPerExpectedFile",
    remainingBatchReserveBytes:
      "max(minimumRemainingBatchBytes,2*uncompressedArchiveBytes)",
    postSessionResidualBytes:
      "max(minimumPostSessionResidualBytes,compressedArchiveBytes)",
    requiredBytes:
      "decodedWorkingSetBytes+nativePngWorstCaseBytes+operationalAuditBytes+comparisonDiffRmseBytes+uncompressedArchiveBytes+compressedArchiveBytes+atomicFinalizationTempBytes+remainingBatchReserveBytes+postSessionResidualBytes",
  }),
  obligationCount: CAPTURE_OBLIGATION_COUNT,
  bytesPerPixel: 4,
  workingCopies: 4,
  pngPerFileOverheadBytes: 65_536,
  logBytesPerObligation: 16_384,
  manifestBytesPerExpectedFile: 8_192,
  requestBytesPerObligation: 4_096,
  audioBytesPerObligation: 4_096,
  processBytesPerObligation: 4_096,
  rmseBytesPerObligation: 4_096,
  archiveWorstCaseNumerator: 105,
  archiveWorstCaseDenominator: 100,
  minimumOperationalAuditBytes: 67_108_864,
  minimumComparisonDiffRmseBytes: 134_217_728,
  minimumRemainingBatchBytes: 268_435_456,
  minimumPostSessionResidualBytes: 67_108_864,
});
const CAPACITY_SIZING_POLICY_SHA256 = sha256Text(canonicalJson(CAPACITY_SIZING_POLICY));
const SOURCE_OPEN_OPERATOR_SIGNING_PROTOCOL =
  "g4-l10-named-human-source-open-operator-proof-v4.1";
const PROJECTOR_EXIT_OPERATOR_SIGNING_PROTOCOL =
  "g4-l10-named-human-projector-exit-operator-proof-v4.1";
const GUI_OBSERVER_EVENT_PROTOCOL = "g4-l10-authenticated-gui-observer-event-v4.1";
const CAPTURE_MARKER_PROTOCOL = "g4-l10-capture-marker-v4.1";
const PRELAUNCH_ADMISSION_PROTOCOL = "g4-l10-prelaunch-admission-v4.1";
const TOKEN_TRANSITION_PROTOCOL = "g4-l10-unconsumed-to-started-transition-v4.1";
const REQUIRED_CONTROL_IDS = Object.freeze([
  "CR-01", "CR-02", "CR-03", "CR-04", "CR-05", "CR-06", "CR-07", "CR-08",
]);
const REPLAY_LOCK_ATOMIC_PRIMITIVES = Object.freeze([
  "openat(O_CREAT|O_EXCL|O_NOFOLLOW)",
  "open(O_CREAT|O_EXCL|O_NOFOLLOW)",
]);
const TOKEN_TRANSITION_ATOMIC_PRIMITIVES = Object.freeze([
  "renameatx_np(RENAME_EXCL)+fsync(source-directory)+fsync(destination-directory)",
  "renameat2(RENAME_NOREPLACE)+fsync(source-directory)+fsync(destination-directory)",
]);
const PINNED_OWNER_TRUST_ANCHOR = null;
const OWNER_TRUST_ANCHOR_NOT_CONFIGURED_CODE =
  "G4_L10_V4_OWNER_TRUST_ANCHOR_NOT_CONFIGURED";
const AUTHORITY_KEYS = Object.freeze([
  "swfFlaAuditCompletion",
  "frameDomainCompletion",
  "actionScriptAuditCompletion",
  "originalRuntimeEvidence",
  "ruffleBaselineAuthority",
  "englishSpanishBehaviorAcceptance",
  "audioCueAcceptance",
  "keyframeAcceptance",
  "javascriptRendererImplementation",
  "currentJavascriptRegistration",
  "behaviorAcceptance",
  "fullFrameRmseAcceptance",
  "humanVisualReview",
  "engineeringReview",
  "ownerAcceptance",
  "strictCompletion",
  "wholeLessonIntegration",
  "publication",
]);

function invariant(condition, message) {
  if (!condition) throw new Error(`G4 L10 root-capture v4 contract: ${message}`);
}

function ownerTrustAnchorNotConfiguredError() {
  const error = new Error(
    `G4 L10 root-capture v4 contract: ${OWNER_TRUST_ANCHOR_NOT_CONFIGURED_CODE}: fixed project owner trust anchor is not configured`,
  );
  error.code = OWNER_TRUST_ANCHOR_NOT_CONFIGURED_CODE;
  return error;
}

/**
 * Earliest, argument-free authority gate for every future stateful preparer or
 * launcher. It must be called before creating an output root, profile,
 * replay-token preimage, lock, observation, or any other session artifact.
 * The pure validators deliberately continue validating candidate semantics so
 * malformed evidence fails at its own gate, but no writer may use those
 * validators as a substitute for this preparation gate.
 */
export function assertV4PreparationAuthorityAvailable() {
  if (PINNED_OWNER_TRUST_ANCHOR === null) throw ownerTrustAnchorNotConfiguredError();
  return PINNED_OWNER_TRUST_ANCHOR;
}

function isPlainObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function canonicalValue(value, label = "value") {
  if (value === null || typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number") {
    invariant(Number.isFinite(value), `${label} contains a non-finite number`);
    invariant(!Number.isInteger(value) || Number.isSafeInteger(value),
      `${label} contains an unsafe integer`);
    invariant(Math.abs(value) <= Number.MAX_SAFE_INTEGER,
      `${label} contains a number outside the exact canonical range`);
    return Object.is(value, -0) ? 0 : value;
  }
  if (Array.isArray(value)) return value.map((entry, index) => canonicalValue(entry, `${label}[${index}]`));
  invariant(isPlainObject(value), `${label} is not canonical JSON data`);
  return Object.fromEntries(Object.keys(value).sort().map((key) => {
    invariant(value[key] !== undefined, `${label}.${key} is undefined`);
    return [key, canonicalValue(value[key], `${label}.${key}`)];
  }));
}

export function canonicalJson(value) {
  return `${JSON.stringify(canonicalValue(value))}\n`;
}

function bytesOf(value, label = "bytes") {
  if (typeof value === "string") return Buffer.from(value, "utf8");
  if (Buffer.isBuffer(value)) return value;
  if (value instanceof Uint8Array) return Buffer.from(value.buffer, value.byteOffset, value.byteLength);
  invariant(false, `${label} must be a string, Buffer, or Uint8Array`);
}

export function sha256Bytes(value) {
  return createHash("sha256").update(bytesOf(value)).digest("hex");
}

export function sha256Text(value) {
  invariant(typeof value === "string", "sha256Text input must be a string");
  return sha256Bytes(Buffer.from(value, "utf8"));
}

function assertExactKeys(value, expected, label) {
  invariant(isPlainObject(value), `${label} must be an object`);
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  invariant(JSON.stringify(actual) === JSON.stringify(wanted), `${label} keys drifted`);
}

function assertSha256(value, label) {
  invariant(HASH.test(value || ""), `${label} must be one lowercase SHA-256`);
}

function assertNonempty(value, label) {
  invariant(typeof value === "string" && value.trim().length > 0, `${label} must be non-empty`);
}

function assertPortableOrAbsoluteFile(value, label) {
  assertNonempty(value, label);
  invariant(!value.includes("\\") && !value.includes("\0"), `${label} is not a portable path`);
  const normalized = path.posix.normalize(value);
  invariant(normalized === value && value !== "." && !value.endsWith("/"), `${label} is not normalized`);
  if (!path.posix.isAbsolute(value)) {
    invariant(value !== ".." && !value.startsWith("../"), `${label} escapes its declared root`);
  }
}

function isContainedPath(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

export function contentDescriptor(fileOrOptions, maybeContents) {
  const file = isPlainObject(fileOrOptions) ? fileOrOptions.file : fileOrOptions;
  const contents = isPlainObject(fileOrOptions)
    ? (fileOrOptions.contents ?? fileOrOptions.bytesValue)
    : maybeContents;
  assertPortableOrAbsoluteFile(file, "descriptor file");
  const bytes = bytesOf(contents, "descriptor contents");
  return Object.freeze({file, bytes: bytes.length, sha256: sha256Bytes(bytes)});
}

export function validateContentDescriptor(value, {label = "content descriptor", expected = null} = {}) {
  assertExactKeys(value, ["file", "bytes", "sha256"], label);
  assertPortableOrAbsoluteFile(value.file, `${label}.file`);
  invariant(Number.isSafeInteger(value.bytes) && value.bytes > 0, `${label}.bytes must be greater than zero`);
  assertSha256(value.sha256, `${label}.sha256`);
  if (expected) {
    validateContentDescriptor(expected, {label: `${label} expected`});
    invariant(value.file === expected.file && value.bytes === expected.bytes && value.sha256 === expected.sha256,
      `${label} differs from its exact expected descriptor`);
  }
  return value;
}

function assertPhysicalFileEvidence(value, expectedDescriptor, label, {
  executable = false,
  readOnly = true,
} = {}) {
  assertExactKeys(value, [
    "descriptor", "absolutePath", "realPath", "device", "inode", "mode", "mountId", "nlink",
    "ordinaryFile", "symlinkFree", "observedAt",
  ], label);
  validateContentDescriptor(value.descriptor, {label: `${label}.descriptor`, expected: expectedDescriptor});
  invariant(path.isAbsolute(value.absolutePath)
    && value.absolutePath === value.realPath
    && value.absolutePath === value.descriptor.file,
  `${label} path is not one exact absolute real path`);
  invariant(/^[1-9][0-9]*$/u.test(value.device || "")
    && /^[1-9][0-9]*$/u.test(value.inode || "")
    && /^[0-7]{4}$/u.test(value.mode || "")
    && Number.isSafeInteger(value.nlink) && value.nlink === 1,
  `${label} lstat identity is invalid`);
  assertNonempty(value.mountId, `${label}.mountId`);
  invariant(value.ordinaryFile === true && value.symlinkFree === true,
    `${label} is not one ordinary symlink-free file`);
  const numericMode = Number.parseInt(value.mode, 8);
  if (readOnly) invariant((numericMode & 0o222) === 0, `${label} is not read-only`);
  if (executable) invariant((numericMode & 0o111) !== 0, `${label} is not executable`);
  assertCanonicalTimestamp(value.observedAt, `${label}.observedAt`);
  return value;
}

function assertPhysicalDirectoryEvidence(value, label, {mode = null, observedAt = null} = {}) {
  assertExactKeys(value, [
    "absolutePath", "realPath", "device", "inode", "mode", "mountId", "nlink",
    "directory", "symlinkFree", "observedAt",
  ], label);
  invariant(path.isAbsolute(value.absolutePath) && value.absolutePath === value.realPath,
    `${label} is not one canonical absolute real path`);
  invariant(/^[1-9][0-9]*$/u.test(value.device || "")
    && /^[1-9][0-9]*$/u.test(value.inode || "")
    && /^[0-7]{4}$/u.test(value.mode || "")
    && Number.isSafeInteger(value.nlink) && value.nlink >= 1,
  `${label} lstat identity is invalid`);
  if (mode !== null) invariant(value.mode === mode, `${label} mode must be exactly ${mode}`);
  assertNonempty(value.mountId, `${label}.mountId`);
  invariant(value.directory === true && value.symlinkFree === true,
    `${label} is not one symlink-free directory`);
  assertCanonicalTimestamp(value.observedAt, `${label}.observedAt`);
  if (observedAt !== null) invariant(value.observedAt === observedAt,
    `${label} observation time drifted`);
  return value;
}

export function physicalIdentitySha256(value) {
  invariant(isPlainObject(value), "physical identity must be an object");
  return sha256Text(canonicalJson(value));
}

function stablePhysicalIdentity(value) {
  invariant(isPlainObject(value), "stable physical identity must be an object");
  const {observedAt: omitted, ...identity} = value;
  void omitted;
  return identity;
}

function assertSameStablePhysicalIdentity(left, right, label) {
  assertSame(stablePhysicalIdentity(left), stablePhysicalIdentity(right), label);
}

function pathsAreDisjoint(left, right) {
  return !isContainedPath(left, right) && !isContainedPath(right, left);
}

function assertSortedUniqueStrings(values, label, {minimum = 1} = {}) {
  assertUniqueStrings(values, label, {minimum});
  invariant(same(values, [...values].sort()), `${label} must be in canonical sorted order`);
}

function assertExactOperationPolicy(policy, label = "operationPolicy") {
  assertExactKeys(policy, [
    "policyVersion", "allowedActionIds", "humanOnlyActionIds", "forbiddenActionIds",
  ], label);
  invariant(policy.policyVersion === OPERATION_POLICY_VERSION,
    `${label}.policyVersion drifted`);
  for (const [key, expected] of [
    ["allowedActionIds", ALLOWED_HUMAN_OPERATION_IDS],
    ["humanOnlyActionIds", HUMAN_ONLY_OPERATION_IDS],
    ["forbiddenActionIds", FORBIDDEN_OPERATION_IDS],
  ]) {
    assertSortedUniqueStrings(policy[key], `${label}.${key}`);
    invariant(same(policy[key], expected), `${label}.${key} differs from the exact fixed policy`);
  }
  const allowed = new Set(policy.allowedActionIds);
  const forbidden = new Set(policy.forbiddenActionIds);
  invariant(policy.forbiddenActionIds.every((actionId) => !allowed.has(actionId)),
    `${label} allowed and forbidden sets intersect`);
  invariant(policy.humanOnlyActionIds.every((actionId) => allowed.has(actionId)),
    `${label} humanOnly is not a subset of allowed`);
  invariant(policy.humanOnlyActionIds.includes("projector.file-open-exact-staged-source"),
    `${label} File Open is not human-only`);
  for (const actionId of [
    "projector.save-source", "projector.publish-source", "projector.export-source",
    "projector.convert-source", "projector.direct-child-swf-open",
  ]) invariant(!allowed.has(actionId) && forbidden.has(actionId),
    `${label} permits a save/publish/export/convert/direct-child-open action`);
  return policy;
}

function operationPolicyDocument() {
  return {
    policyVersion: OPERATION_POLICY_VERSION,
    allowedActionIds: [...ALLOWED_HUMAN_OPERATION_IDS],
    humanOnlyActionIds: [...HUMAN_ONLY_OPERATION_IDS],
    forbiddenActionIds: [...FORBIDDEN_OPERATION_IDS],
  };
}

function hostTreeFileSetSha256(entries) {
  return sha256Text(canonicalJson(entries));
}

function assertRunner(runner, label = "runner") {
  assertExactKeys(runner, ["toolId", "toolVersion", "executable"], label);
  assertNonempty(runner.toolId, `${label}.toolId`);
  assertNonempty(runner.toolVersion, `${label}.toolVersion`);
  validateContentDescriptor(runner.executable, {label: `${label}.executable`});
  return runner;
}

function assertRunnerBinding(binding, expectedRunner, expectedPhysical, label = "runner binding") {
  assertExactKeys(binding, [
    "toolId", "toolVersion", "executable", "physicalIdentitySha256",
  ], label);
  assertRunner({
    toolId: binding.toolId,
    toolVersion: binding.toolVersion,
    executable: binding.executable,
  }, label);
  if (expectedRunner) assertSame({
    toolId: binding.toolId,
    toolVersion: binding.toolVersion,
    executable: binding.executable,
  }, expectedRunner, `${label}/runner`);
  assertSha256(binding.physicalIdentitySha256, `${label}.physicalIdentitySha256`);
  if (expectedPhysical) invariant(binding.physicalIdentitySha256 === physicalIdentitySha256(expectedPhysical),
    `${label} physical identity drifted`);
  return binding;
}

function withoutField(value, field) {
  invariant(isPlainObject(value), "self-hashed document must be an object");
  const {[field]: omitted, ...unsigned} = value;
  void omitted;
  return unsigned;
}

export function sessionPlanSha256(document) {
  return sha256Text(canonicalJson(withoutField(document, "planSha256")));
}

export function receiptSha256(document) {
  return sha256Text(canonicalJson(withoutField(document, "receiptSha256")));
}

export function sourceOpenStartReceiptSha256(document) {
  return receiptSha256(document);
}

function stopConditionSetSha256(stopConditions) {
  return sha256Text(canonicalJson(stopConditions));
}

function assertCanonicalTimestamp(value, label) {
  invariant(typeof value === "string" && Number.isFinite(Date.parse(value))
    && new Date(value).toISOString() === value, `${label} must be a canonical ISO timestamp`);
  return Date.parse(value);
}

function nowValue(nowMs) {
  if (nowMs === undefined || nowMs === null) return null;
  const value = nowMs instanceof Date ? nowMs.getTime()
    : typeof nowMs === "string" ? Date.parse(nowMs) : nowMs;
  invariant(Number.isFinite(value), "nowMs must be a valid time");
  return value;
}

function same(left, right) {
  return canonicalJson(left) === canonicalJson(right);
}

function assertSame(left, right, label) {
  invariant(same(left, right), `${label} drifted`);
}

function assertUniqueStrings(values, label, {minimum = 1} = {}) {
  invariant(Array.isArray(values) && values.length >= minimum
    && values.every((value) => typeof value === "string" && value.trim().length > 0)
    && new Set(values).size === values.length, `${label} must be a unique non-empty string list`);
}

function assertStopConditions(document) {
  assertUniqueStrings(document.stopConditions, "stopConditions");
  invariant(same(document.stopConditions, REQUIRED_STOP_CONDITIONS),
    "stopConditions differ from the exact fixed policy");
  invariant(document.stopConditionSetSha256 === stopConditionSetSha256(document.stopConditions),
    "stop-condition set SHA-256 drifted");
  invariant(same(Object.keys(STOP_CONDITION_OBSERVER_ROLE), REQUIRED_STOP_CONDITIONS),
    "fixed stop-condition/observer-role mapping drifted");
}

export function assertAllFalseAuthorityBoundary(boundary) {
  assertExactKeys(boundary, AUTHORITY_KEYS, "authorityBoundary");
  for (const key of AUTHORITY_KEYS) invariant(boundary[key] === false, `authorityBoundary.${key} was promoted`);
  return boundary;
}

function assertIdentity(identity, plan = null) {
  assertExactKeys(identity, [
    "language", "frameDomain", "trace", "entryStateSha256", "scenario", "seed",
  ], "identity");
  invariant(["en", "es"].includes(identity.language), "identity.language must be en or es");
  invariant(identity.frameDomain === "root",
    "identity.frameDomain must be exactly root for the root-capture contract");
  assertNonempty(identity.trace, "identity.trace");
  assertSha256(identity.entryStateSha256, "identity.entryStateSha256");
  assertNonempty(identity.scenario, "identity.scenario");
  invariant(Number.isSafeInteger(identity.seed) && identity.seed >= 0, "identity.seed is invalid");
  if (plan) assertSame(identity, plan.identity, "identity/session-plan binding");
}

function assertSourceNativeStage(stage) {
  assertExactKeys(stage, ["width", "height"], "runtime.sourceNativeStage");
  invariant(Number.isFinite(stage.width) && stage.width > 0
    && Number.isFinite(stage.height) && stage.height > 0
    && stage.width <= Number.MAX_SAFE_INTEGER && stage.height <= Number.MAX_SAFE_INTEGER,
  "runtime.sourceNativeStage must contain positive finite dimensions and may be fractional");
}

function assertCaptureRaster(raster) {
  assertExactKeys(raster, ["width", "height"], "runtime.captureRaster");
  invariant(Number.isSafeInteger(raster.width) && raster.width > 0
    && Number.isSafeInteger(raster.height) && raster.height > 0,
  "runtime.captureRaster must contain positive integer dimensions");
}

function assertRuntime(runtime, {plan = null, environment = false} = {}) {
  const keys = [
    "runtimeId", "name", "version", "executable", "rootFrameCount",
    "sourceNativeStage", "captureRaster",
  ];
  if (environment) keys.push("codeSignatureVerified", "hashVerified");
  assertExactKeys(runtime, keys, "runtime");
  for (const key of ["runtimeId", "name", "version"]) assertNonempty(runtime[key], `runtime.${key}`);
  validateContentDescriptor(runtime.executable, {label: "runtime.executable"});
  invariant(Number.isSafeInteger(runtime.rootFrameCount) && runtime.rootFrameCount > 0,
    "runtime.rootFrameCount is invalid");
  assertSourceNativeStage(runtime.sourceNativeStage);
  assertCaptureRaster(runtime.captureRaster);
  if (environment) {
    invariant(runtime.codeSignatureVerified === true && runtime.hashVerified === true,
      "runtime signature/hash preflight is not verified");
  }
  if (plan) {
    const projection = Object.fromEntries([
      "runtimeId", "name", "version", "executable", "rootFrameCount",
      "sourceNativeStage", "captureRaster",
    ].map((key) => [key, runtime[key]]));
    assertSame(projection, plan.runtime, "runtime/session-plan binding");
  }
}

function assertLaunchContract(contract, plan) {
  assertExactKeys(contract, [
    "protocol", "projectorStartsEmpty", "namedHumanGuiFileOpen", "sourceOpenMethod",
    "menuPath", "selectedSourceFile", "authenticatedMarkersRequired",
  ], "launchContract");
  invariant(contract.protocol === LAUNCH_PROTOCOL
    && contract.projectorStartsEmpty === true
    && contract.namedHumanGuiFileOpen === true
    && contract.sourceOpenMethod === SOURCE_OPEN_METHOD
    && same(contract.menuPath, SOURCE_OPEN_MENU_PATH)
    && contract.selectedSourceFile === plan.stagedSource.file
    && contract.authenticatedMarkersRequired === true,
  "launch contract drifted");
}

export function validateSessionPlanShapeOnly(document) {
  assertExactKeys(document, [
    "schemaVersion", "evidenceType", "sessionId", "releaseId", "animationId", "requirementId",
    "identity", "captureKit", "kitCheck", "traceSpec", "traceSpecIndex", "sourceSwf",
    "stagedSource", "runtime", "runner", "captureObligationCount", "plannedSessionOutputRoot",
    "launchContract", "operationPolicy", "stopConditions", "stopConditionSetSha256",
    "authorityBoundary", "planSha256",
  ], "session plan");
  invariant(document.schemaVersion === 4
    && document.evidenceType === "g4-l10-root-capture-session-plan-v4"
    && SESSION_ID.test(document.sessionId || "")
    && document.releaseId === RELEASE_ID
    && /^(?:course|shell)-g04-l10-[a-z0-9-]+$/u.test(document.animationId || "")
    && /^req-[a-z0-9-]+-(?:en|es)$/u.test(document.requirementId || ""),
  "session-plan schema or identity is invalid");
  assertIdentity(document.identity);
  invariant(document.requirementId.endsWith(`-${document.identity.language}`),
    "session-plan requirement/language binding drifted");
  for (const key of ["captureKit", "kitCheck", "traceSpec", "traceSpecIndex", "sourceSwf", "stagedSource"]) {
    validateContentDescriptor(document[key], {label: `session plan ${key}`});
  }
  invariant(document.sourceSwf.sha256 === document.stagedSource.sha256
    && document.sourceSwf.bytes === document.stagedSource.bytes
    && document.sourceSwf.file !== document.stagedSource.file
    && path.isAbsolute(document.sourceSwf.file) && path.isAbsolute(document.stagedSource.file),
  "staged source is not a distinct byte-identical copy of the source SWF");
  assertRuntime(document.runtime);
  if (/^course-g04-l10-ti00[3-6]-(?:en|es)$/u.test(document.animationId)) {
    invariant(document.runtime.sourceNativeStage.width === 799.9
      && document.runtime.sourceNativeStage.height === 599.75
      && document.runtime.captureRaster.width === 800
      && document.runtime.captureRaster.height === 600,
    "TI003-TI006 EN/ES source-native stage and capture raster drifted");
  }
  assertRunner(document.runner, "session plan runner");
  invariant(document.captureObligationCount === CAPTURE_OBLIGATION_COUNT,
    "session plan capture-obligation count differs from the exact 94-obligation policy");
  invariant(path.isAbsolute(document.plannedSessionOutputRoot),
    "plannedSessionOutputRoot must be absolute");
  assertLaunchContract(document.launchContract, document);
  assertExactOperationPolicy(document.operationPolicy, "session plan operationPolicy");
  assertStopConditions(document);
  assertAllFalseAuthorityBoundary(document.authorityBoundary);
  invariant(document.planSha256 === sessionPlanSha256(document), "session-plan self-hash drifted");
  return shapeOnlyResult("session-plan-v4");
}

function canonicalDocumentDescriptor(file, document) {
  return contentDescriptor(file, canonicalJson(document));
}

function resolvePlanContext(options = {}) {
  const candidate = options.plan || (options.sessionPlan?.planSha256 ? options.sessionPlan : null);
  const expectedDescriptor = options.planDescriptor
    || options.sessionPlanDescriptor
    || (options.sessionPlan?.file ? options.sessionPlan : null);
  if (candidate) validateSessionPlanShapeOnly(candidate);
  if (expectedDescriptor) validateContentDescriptor(expectedDescriptor, {label: "expected session-plan descriptor"});
  return {plan: candidate, descriptor: expectedDescriptor};
}

function assertPlanBinding(binding, options = {}) {
  validateContentDescriptor(binding, {label: "sessionPlan"});
  const {plan, descriptor} = resolvePlanContext(options);
  if (descriptor) validateContentDescriptor(binding, {label: "sessionPlan", expected: descriptor});
  if (plan) validateContentDescriptor(binding, {
    label: "sessionPlan",
    expected: canonicalDocumentDescriptor(binding.file, plan),
  });
  return plan;
}

function assertReceiptIdentity(document, evidenceType, plan) {
  invariant(document.schemaVersion === 4 && document.evidenceType === evidenceType,
    `${evidenceType} schema/evidence type drifted`);
  invariant(SESSION_ID.test(document.sessionId || ""), `${evidenceType} sessionId is invalid`);
  if (plan) invariant(document.sessionId === plan.sessionId, `${evidenceType} session differs from the plan`);
}

function assertValidityWindow(document, nowMs, label) {
  const checkedAt = assertCanonicalTimestamp(document.checkedAt ?? document.measuredAt, `${label} checked/measuredAt`);
  const validUntil = assertCanonicalTimestamp(document.validUntil, `${label}.validUntil`);
  invariant(validUntil > checkedAt, `${label} validity chronology is invalid`);
  const now = nowValue(nowMs);
  if (now !== null) invariant(now >= checkedAt && now <= validUntil, `${label} is outside its validity window`);
  return {checkedAt, validUntil};
}

function assertReceiptSelfHash(document, label) {
  assertSha256(document.receiptSha256, `${label}.receiptSha256`);
  invariant(document.receiptSha256 === receiptSha256(document), `${label} self-hash drifted`);
}

function shapeOnlyResult(documentType) {
  return Object.freeze({
    validationClass: "shape-only-non-admitting",
    documentType,
    shapeValid: true,
    launchAdmission: false,
    authorityEffect: "none",
    statefulFilesystemVerificationRequired: true,
  });
}

export function hostTreeManifestBytes({rootRealPath, entries}) {
  invariant(path.isAbsolute(rootRealPath || ""), "host-tree manifest rootRealPath must be absolute");
  invariant(Array.isArray(entries), "host-tree manifest entries must be an array");
  return Buffer.from(canonicalJson({
    schemaVersion: 4,
    manifestType: "g4-l10-exact-host-tree-manifest-v4",
    rootRealPath,
    entries,
  }), "utf8");
}

function publicKeyFromCanonicalSpkiBase64(value, label) {
  invariant(typeof value === "string"
    && /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/u.test(value),
    `${label} is not canonical padded SPKI base64`);
  const der = Buffer.from(value, "base64");
  invariant(der.length > 0 && der.toString("base64") === value,
    `${label} does not decode canonically`);
  const key = createPublicKey({key: der, type: "spki", format: "der"});
  invariant(key.asymmetricKeyType === "ed25519", `${label} is not an Ed25519 public key`);
  return {key, sha256: sha256Bytes(der)};
}

function assertEnvironmentRunner(runner, plan) {
  assertExactKeys(runner, ["toolId", "toolVersion", "executable", "hashVerified"],
    "environment runner");
  assertRunner({
    toolId: runner.toolId,
    toolVersion: runner.toolVersion,
    executable: runner.executable,
  }, "environment runner");
  invariant(runner.hashVerified === true, "environment runner hash is not verified");
  if (plan) assertSame({
    toolId: runner.toolId,
    toolVersion: runner.toolVersion,
    executable: runner.executable,
  }, plan.runner, "environment runner/session-plan binding");
}

export function validateEnvironmentPreflightShapeOnly(document, options = {}) {
  assertExactKeys(document, [
    "schemaVersion", "evidenceType", "sessionId", "sessionPlan", "checkedAt", "validUntil", "host",
    "runtime", "runner", "stagedSource", "kitCurrentness", "hostTree", "profile", "sandbox",
    "processAbsence", "observers", "physicalBindings", "controls", "stopConditionSetSha256",
    "allApprovedAndVerified", "authorityBoundary", "receiptSha256",
  ], "environment preflight");
  const plan = assertPlanBinding(document.sessionPlan, options);
  assertReceiptIdentity(document, "g4-l10-root-capture-environment-preflight-v4", plan);
  assertValidityWindow(document, options.nowMs, "environment preflight");
  assertExactKeys(document.host, ["hostIdSha256", "platform", "architecture"], "environment host");
  assertSha256(document.host.hostIdSha256, "environment hostIdSha256");
  assertNonempty(document.host.platform, "environment host.platform");
  assertNonempty(document.host.architecture, "environment host.architecture");
  assertRuntime(document.runtime, {plan, environment: true});
  assertEnvironmentRunner(document.runner, plan);
  validateContentDescriptor(document.stagedSource, {label: "environment stagedSource"});
  if (plan) validateContentDescriptor(document.stagedSource, {
    label: "environment stagedSource", expected: plan.stagedSource,
  });
  assertExactKeys(document.kitCurrentness, [
    "policyVersion", "captureKit", "kitCheck", "traceSpec", "traceSpecIndex", "checkedAt",
    "allCurrent", "noDescriptorDrift",
  ], "environment kitCurrentness");
  invariant(document.kitCurrentness.policyVersion === "g4-l10-kit-currentness-v4.1"
    && document.kitCurrentness.checkedAt === document.checkedAt
    && document.kitCurrentness.allCurrent === true
    && document.kitCurrentness.noDescriptorDrift === true,
  "environment kit currentness is not exact and current");
  for (const key of ["captureKit", "kitCheck", "traceSpec", "traceSpecIndex"]) {
    validateContentDescriptor(document.kitCurrentness[key], {
      label: `environment kitCurrentness.${key}`,
      expected: plan?.[key] || null,
    });
  }
  assertExactKeys(document.hostTree, [
    "manifest", "root", "stagedSource", "allowlistedDependencies",
    "allowlistedDependencyPhysical", "entries", "entryCount", "fileSetSha256",
    "unexpectedEntryCount", "readOnly", "symlinkFree",
    "exactStagedSourcePresent",
  ], "environment hostTree");
  validateContentDescriptor(document.hostTree.manifest, {label: "environment hostTree.manifest"});
  validateContentDescriptor(document.hostTree.stagedSource, {label: "environment hostTree.stagedSource"});
  assertPhysicalDirectoryEvidence(document.hostTree.root, "environment hostTree.root",
    {observedAt: document.checkedAt});
  invariant((Number.parseInt(document.hostTree.root.mode, 8) & 0o222) === 0,
    "environment hostTree.root is not read-only");
  invariant(isContainedPath(document.hostTree.root.realPath, document.hostTree.stagedSource.file),
  "environment host tree does not contain the exact staged source path");
  validateContentDescriptor(document.hostTree.stagedSource, {
    label: "environment hostTree.stagedSource", expected: document.stagedSource,
  });
  invariant(Array.isArray(document.hostTree.allowlistedDependencies),
    "environment hostTree.allowlistedDependencies must be an array");
  for (const [index, descriptor] of document.hostTree.allowlistedDependencies.entries()) {
    validateContentDescriptor(descriptor, {label: `environment hostTree.allowlistedDependencies[${index}]`});
    invariant(path.isAbsolute(descriptor.file)
      && isContainedPath(document.hostTree.root.realPath, descriptor.file),
    "environment host-tree dependency escapes the exact host root");
  }
  const allowlistedFiles = document.hostTree.allowlistedDependencies.map(({file}) => file);
  assertSortedUniqueStrings(allowlistedFiles, "environment hostTree allowlisted dependency paths", {minimum: 0});
  invariant(!allowlistedFiles.includes(document.hostTree.stagedSource.file),
    "environment hostTree staged source cannot be repeated as an allowlisted dependency");
  invariant(Array.isArray(document.hostTree.allowlistedDependencyPhysical)
    && document.hostTree.allowlistedDependencyPhysical.length
      === document.hostTree.allowlistedDependencies.length,
  "environment hostTree dependency physical-evidence count drifted");
  document.hostTree.allowlistedDependencyPhysical.forEach((physical, index) => {
    assertPhysicalFileEvidence(physical, document.hostTree.allowlistedDependencies[index],
      `environment hostTree.allowlistedDependencyPhysical[${index}]`);
    invariant(physical.observedAt === document.checkedAt
      && physical.device === document.hostTree.root.device
      && physical.mountId === document.hostTree.root.mountId,
    `environment hostTree.allowlistedDependencyPhysical[${index}] root identity drifted`);
  });
  invariant(Array.isArray(document.hostTree.entries), "environment hostTree.entries must be an array");
  const expectedDescriptors = [document.hostTree.stagedSource, ...document.hostTree.allowlistedDependencies]
    .sort((left, right) => left.file < right.file ? -1 : left.file > right.file ? 1 : 0);
  invariant(document.hostTree.entries.length === expectedDescriptors.length,
    "environment host-tree entry count differs from staged SWF plus allowlisted dependencies");
  document.hostTree.entries.forEach((entry, index) => {
    assertExactKeys(entry, [
      "path", "bytes", "sha256", "mode", "ordinaryFile", "readOnly", "symlinkFree",
    ], `environment hostTree.entries[${index}]`);
    const expected = expectedDescriptors[index];
    invariant(entry.path === expected.file && entry.bytes === expected.bytes
      && entry.sha256 === expected.sha256 && /^[0-7]{4}$/u.test(entry.mode || "")
      && (Number.parseInt(entry.mode, 8) & 0o222) === 0
      && entry.ordinaryFile === true && entry.readOnly === true && entry.symlinkFree === true,
    `environment hostTree.entries[${index}] is not the exact ordinary read-only symlink-free file`);
  });
  assertSortedUniqueStrings(document.hostTree.entries.map(({path: entryPath}) => entryPath),
    "environment hostTree entry paths");
  assertSha256(document.hostTree.fileSetSha256, "environment hostTree.fileSetSha256");
  invariant(document.hostTree.readOnly === true && document.hostTree.symlinkFree === true
    && document.hostTree.exactStagedSourcePresent === true
    && document.hostTree.entryCount === document.hostTree.entries.length
    && document.hostTree.unexpectedEntryCount === 0
    && document.hostTree.fileSetSha256 === hostTreeFileSetSha256(document.hostTree.entries),
  "environment host tree is not exact, read-only, and symlink-free");
  validateContentDescriptor(document.hostTree.manifest, {
    label: "environment hostTree.manifest",
    expected: contentDescriptor(document.hostTree.manifest.file, hostTreeManifestBytes({
      rootRealPath: document.hostTree.root.realPath,
      entries: document.hostTree.entries,
    })),
  });
  assertExactKeys(document.profile, [
    "manifest", "sessionRoot", "initialTreeEntries", "initialTreeSetSha256",
    "emptySharedObjectState", "runtimeWritableOnlyWithinSession", "externalReplayLockRoot",
  ], "environment profile");
  validateContentDescriptor(document.profile.manifest, {label: "environment profile.manifest"});
  assertPhysicalDirectoryEvidence(document.profile.sessionRoot, "environment profile.sessionRoot",
    {mode: "0700", observedAt: document.checkedAt});
  assertPhysicalDirectoryEvidence(document.profile.externalReplayLockRoot,
    "environment profile.externalReplayLockRoot", {mode: "0700", observedAt: document.checkedAt});
  invariant(pathsAreDisjoint(document.profile.sessionRoot.realPath,
    document.profile.externalReplayLockRoot.realPath)
    && Array.isArray(document.profile.initialTreeEntries)
    && document.profile.initialTreeEntries.length === 0
    && document.profile.initialTreeSetSha256 === hostTreeFileSetSha256([])
    && document.profile.emptySharedObjectState === true
    && document.profile.runtimeWritableOnlyWithinSession === true,
  "environment profile is not empty, bounded, and externally replay-protected");
  assertExactKeys(document.sandbox, [
    "policy", "defaultDeny", "outboundDenied", "writeRoots", "readRoots", "profileOnlyWrites",
  ], "environment sandbox");
  validateContentDescriptor(document.sandbox.policy, {label: "environment sandbox.policy"});
  assertUniqueStrings(document.sandbox.writeRoots, "environment sandbox.writeRoots");
  assertUniqueStrings(document.sandbox.readRoots, "environment sandbox.readRoots");
  invariant(document.sandbox.defaultDeny === true && document.sandbox.outboundDenied === true
    && document.sandbox.profileOnlyWrites === true
    && same(document.sandbox.writeRoots, [document.profile.sessionRoot.realPath])
    && same(document.sandbox.readRoots, [document.hostTree.root.realPath]),
  "environment sandbox is not default-deny with profile-only runtime writes");
  assertExactKeys(document.processAbsence, [
    "checkedAt", "inventoryReceipt", "matchingProcessCount", "freshProcessRequired", "verified",
  ],
    "environment processAbsence");
  validateContentDescriptor(document.processAbsence.inventoryReceipt,
    {label: "environment processAbsence.inventoryReceipt"});
  assertCanonicalTimestamp(document.processAbsence.checkedAt, "environment processAbsence.checkedAt");
  invariant(document.processAbsence.checkedAt === document.checkedAt
    && document.processAbsence.matchingProcessCount === 0
    && document.processAbsence.freshProcessRequired === true
    && document.processAbsence.verified === true,
    "preexisting matching runtime process was not excluded");
  assertExactKeys(document.observers, [
    "network", "requests", "process", "windows", "effects", "audio", "gui",
  ], "environment observers");
  for (const [key, observer] of Object.entries(document.observers)) {
    const keys = ["readyReceipt", "sessionReceiptPath", "ready"];
    if (key === "gui") keys.push(
      "observerId", "publicKeySpkiBase64", "publicKeySha256", "sourceOpenEventPath",
    );
    assertExactKeys(observer, keys, `environment observers.${key}`);
    validateContentDescriptor(observer.readyReceipt,
      {label: `environment observers.${key}.readyReceipt`});
    assertPortableOrAbsoluteFile(observer.sessionReceiptPath,
      `environment observers.${key}.sessionReceiptPath`);
    if (plan) invariant(path.isAbsolute(observer.sessionReceiptPath)
      && isContainedPath(plan.plannedSessionOutputRoot, observer.sessionReceiptPath),
      `environment observer ${key} session receipt escapes the output root`);
    if (plan) invariant(
      observer.sessionReceiptPath
        === path.join(plan.plannedSessionOutputRoot, OBSERVER_SESSION_FILENAMES[key]),
      `environment observer ${key} session receipt differs from its fixed control filename`,
    );
    invariant(observer.ready === true, `environment observer ${key} is not ready`);
    if (key === "gui") {
      assertNonempty(observer.observerId, "environment GUI observerId");
      const observerKey = publicKeyFromCanonicalSpkiBase64(observer.publicKeySpkiBase64,
        "environment GUI observer public key");
      invariant(observer.publicKeySha256 === observerKey.sha256,
        "environment GUI observer public-key identity drifted");
      if (plan) invariant(observer.sourceOpenEventPath
          === path.join(plan.plannedSessionOutputRoot, "gui-source-open-event.json"),
        "environment GUI observer event paths differ from the fixed control filenames");
    }
  }
  assertSortedUniqueStrings(
    Object.values(document.observers).map(({sessionReceiptPath}) => sessionReceiptPath).sort(),
    "environment observer session receipt paths",
  );
  assertExactKeys(document.physicalBindings, [
    "runtimeExecutable", "runnerExecutable", "stagedSource", "captureKit", "kitCheck",
    "traceSpec", "traceSpecIndex", "hostTreeManifest", "profileManifest", "sandboxPolicy",
    "processInventory", "networkObserver", "requestObserver", "processObserver", "windowObserver",
    "effectObserver", "audioObserver", "guiObserver",
  ], "environment physicalBindings");
  const physicalExpectations = [
    ["runtimeExecutable", document.runtime.executable, {executable: true, readOnly: false}],
    ["runnerExecutable", document.runner.executable, {executable: true}],
    ["stagedSource", document.stagedSource, {}],
    ["captureKit", document.kitCurrentness.captureKit, {}],
    ["kitCheck", document.kitCurrentness.kitCheck, {}],
    ["traceSpec", document.kitCurrentness.traceSpec, {}],
    ["traceSpecIndex", document.kitCurrentness.traceSpecIndex, {}],
    ["hostTreeManifest", document.hostTree.manifest, {}],
    ["profileManifest", document.profile.manifest, {}],
    ["sandboxPolicy", document.sandbox.policy, {}],
    ["processInventory", document.processAbsence.inventoryReceipt, {}],
    ["networkObserver", document.observers.network.readyReceipt, {}],
    ["requestObserver", document.observers.requests.readyReceipt, {}],
    ["processObserver", document.observers.process.readyReceipt, {}],
    ["windowObserver", document.observers.windows.readyReceipt, {}],
    ["effectObserver", document.observers.effects.readyReceipt, {}],
    ["audioObserver", document.observers.audio.readyReceipt, {}],
    ["guiObserver", document.observers.gui.readyReceipt, {}],
  ];
  for (const [key, descriptor, settings] of physicalExpectations) {
    assertPhysicalFileEvidence(document.physicalBindings[key], descriptor,
      `environment physicalBindings.${key}`, settings);
    invariant(document.physicalBindings[key].observedAt === document.checkedAt,
      `environment physicalBindings.${key} observation time drifted`);
  }
  invariant(document.physicalBindings.stagedSource.device === document.hostTree.root.device
    && document.physicalBindings.stagedSource.mountId === document.hostTree.root.mountId,
  "environment staged-source physical file differs from the host-tree physical root");
  invariant(Array.isArray(document.controls) && document.controls.length === REQUIRED_CONTROL_IDS.length,
    "environment containment control count drifted");
  document.controls.forEach((control, index) => {
    assertExactKeys(control, ["controlId", "approved", "verified"], `environment controls[${index}]`);
    invariant(control.controlId === REQUIRED_CONTROL_IDS[index]
      && control.approved === true && control.verified === true,
    `environment control ${REQUIRED_CONTROL_IDS[index]} is not approved and verified`);
  });
  if (plan) invariant(document.stopConditionSetSha256 === plan.stopConditionSetSha256,
    "environment stop-condition set differs from the plan");
  else assertSha256(document.stopConditionSetSha256, "environment stopConditionSetSha256");
  invariant(document.allApprovedAndVerified === true, "environment preflight is not approved and verified");
  assertAllFalseAuthorityBoundary(document.authorityBoundary);
  assertReceiptSelfHash(document, "environment preflight");
  return shapeOnlyResult("environment-preflight-v4");
}

export function expectedArtifactFilesForPlan(plan) {
  invariant(isPlainObject(plan) && plan.captureObligationCount === CAPTURE_OBLIGATION_COUNT,
    "expected artifact calculation requires the exact 94-obligation plan");
  const frames = Array.from({length: plan.captureObligationCount}, (_, index) =>
    `frames/obligation-${String(index + 1).padStart(3, "0")}.png`);
  return Object.freeze([...EXPECTED_CONTROL_ARTIFACT_FILES, ...frames].sort());
}

function assertExpectedArtifacts(value, plan = null) {
  assertExactKeys(value, [
    "directories", "files", "obligationCount", "unexpectedFilesAllowed",
  ], "expectedArtifacts");
  assertSortedUniqueStrings(value.directories, "expectedArtifacts.directories", {minimum: 0});
  assertSortedUniqueStrings(value.files, "expectedArtifacts.files");
  for (const candidate of [...value.directories, ...value.files]) {
    invariant(!path.posix.isAbsolute(candidate) && path.posix.normalize(candidate) === candidate
      && candidate !== ".." && !candidate.startsWith("../"), "expected artifact path is not contained");
  }
  invariant(value.obligationCount === CAPTURE_OBLIGATION_COUNT
    && value.unexpectedFilesAllowed === false,
  "unexpected output artifacts were allowed or obligation count drifted");
  if (plan) {
    invariant(same(value.directories, ["frames"])
      && same(value.files, expectedArtifactFilesForPlan(plan)),
    "expected output artifacts differ from the exact plan-derived set");
  }
}

export function validateOutputRootPreflightShapeOnly(document, options = {}) {
  assertExactKeys(document, [
    "schemaVersion", "evidenceType", "sessionId", "sessionPlan", "checkedAt", "validUntil", "root",
    "pathBoundary", "initialState", "writePolicy", "expectedArtifacts", "authorityBoundary", "receiptSha256",
  ], "output-root preflight");
  const plan = assertPlanBinding(document.sessionPlan, options);
  assertReceiptIdentity(document, "g4-l10-root-capture-output-root-preflight-v4", plan);
  assertValidityWindow(document, options.nowMs, "output-root preflight");
  assertExactKeys(document.root, [
    "absolutePath", "realPath", "device", "inode", "mode", "mountId", "nlink", "directory",
    "symlinkFree", "observedAt",
  ],
    "output-root root");
  invariant(path.isAbsolute(document.root.absolutePath)
    && document.root.realPath === document.root.absolutePath,
  "output root is not one absolute, real, symlink-free path");
  invariant(/^[1-9][0-9]*$/u.test(document.root.device || "")
    && /^[1-9][0-9]*$/u.test(document.root.inode || ""),
  "output root device/inode identity is invalid");
  invariant(document.root.mode === "0700", "output root mode must be exactly 0700");
  assertNonempty(document.root.mountId, "output root mountId");
  invariant(Number.isSafeInteger(document.root.nlink) && document.root.nlink >= 1
    && document.root.directory === true && document.root.symlinkFree === true,
  "output root lstat directory identity drifted");
  invariant(document.root.observedAt === document.checkedAt,
    "output root physical observation time drifted");
  if (plan) invariant(document.root.absolutePath === plan.plannedSessionOutputRoot,
    "output root differs from the session plan");
  assertExactKeys(document.pathBoundary, [
    "projectRoot", "sourceAssetsRoot", "workRoot", "captureKitRoot", "stagedRoot",
  ], "output-root pathBoundary");
  for (const [key, root] of Object.entries(document.pathBoundary)) {
    assertPhysicalDirectoryEvidence(root, `output-root pathBoundary.${key}`,
      {observedAt: document.checkedAt});
    invariant(pathsAreDisjoint(document.root.realPath, root.realPath),
      `output-root real path overlaps pathBoundary.${key}`);
  }
  invariant(isContainedPath(document.pathBoundary.projectRoot.realPath,
    document.pathBoundary.sourceAssetsRoot.realPath)
    && isContainedPath(document.pathBoundary.projectRoot.realPath,
      document.pathBoundary.workRoot.realPath)
    && isContainedPath(document.pathBoundary.workRoot.realPath,
      document.pathBoundary.captureKitRoot.realPath),
  "output-root canonical project/source/work/kit root topology drifted");
  if (plan) invariant(
    isContainedPath(document.pathBoundary.sourceAssetsRoot.realPath, plan.sourceSwf.file)
      && isContainedPath(document.pathBoundary.captureKitRoot.realPath, plan.captureKit.file)
      && isContainedPath(document.pathBoundary.stagedRoot.realPath, plan.stagedSource.file),
  "output-root physical roots do not contain the exact plan source/kit/staged files");
  assertExactKeys(document.initialState, ["exists", "empty", "entryCount"], "output-root initialState");
  invariant(document.initialState.exists === true && document.initialState.empty === true
    && document.initialState.entryCount === 0, "output root was not initially empty");
  assertExactKeys(document.writePolicy, [
    "scope", "appendOnly", "overwriteProhibited", "temporaryFilesProhibited",
  ], "output-root writePolicy");
  invariant(document.writePolicy.scope === document.root.absolutePath
    && document.writePolicy.appendOnly === true
    && document.writePolicy.overwriteProhibited === true
    && document.writePolicy.temporaryFilesProhibited === true,
  "output-root write policy drifted");
  assertExpectedArtifacts(document.expectedArtifacts, plan);
  assertAllFalseAuthorityBoundary(document.authorityBoundary);
  assertReceiptSelfHash(document, "output-root preflight");
  return shapeOnlyResult("output-root-preflight-v4");
}

export function capacityCalculationSha256(document) {
  invariant(isPlainObject(document), "capacity document must be an object");
  return sha256Text(canonicalJson({measurement: document.measurement, demand: document.demand}));
}

function safeCapacityNumber(value, label) {
  invariant(value >= 0n && value <= BigInt(Number.MAX_SAFE_INTEGER),
    `${label} exceeds exact integer range`);
  return Number(value);
}

function ceilDiv(numerator, denominator) {
  return (numerator + denominator - 1n) / denominator;
}

export function deriveCapacityDemandV4({plan, expectedArtifacts}) {
  validateSessionPlanShapeOnly(plan);
  assertExpectedArtifacts(expectedArtifacts, plan);
  const policy = CAPACITY_SIZING_POLICY;
  const frameCount = BigInt(plan.runtime.rootFrameCount);
  const rasterWidth = BigInt(plan.runtime.captureRaster.width);
  const rasterHeight = BigInt(plan.runtime.captureRaster.height);
  const obligationCount = BigInt(plan.captureObligationCount);
  const expectedFileCount = BigInt(expectedArtifacts.files.length);
  const decodedBytesPerFrame = rasterWidth * rasterHeight * BigInt(policy.bytesPerPixel);
  const decodedWorkingSetBytes = frameCount * decodedBytesPerFrame * BigInt(policy.workingCopies);
  const nativePngWorstCaseBytesPerCapture = decodedBytesPerFrame + rasterHeight
    + BigInt(policy.pngPerFileOverheadBytes);
  const nativePngWorstCaseBytes = nativePngWorstCaseBytesPerCapture * obligationCount;
  const logBytes = obligationCount * BigInt(policy.logBytesPerObligation);
  const manifestBytes = expectedFileCount * BigInt(policy.manifestBytesPerExpectedFile);
  const requestAuditBytes = obligationCount * BigInt(policy.requestBytesPerObligation);
  const audioAuditBytes = obligationCount * BigInt(policy.audioBytesPerObligation);
  const processAuditBytes = obligationCount * BigInt(policy.processBytesPerObligation);
  const operationalFormula = logBytes + manifestBytes + requestAuditBytes
    + audioAuditBytes + processAuditBytes;
  const operationalAuditBytes = operationalFormula > BigInt(policy.minimumOperationalAuditBytes)
    ? operationalFormula : BigInt(policy.minimumOperationalAuditBytes);
  const comparisonDecodedBytes = obligationCount * decodedBytesPerFrame;
  const diffDecodedBytes = obligationCount * decodedBytesPerFrame;
  const rmseRecordBytes = obligationCount * BigInt(policy.rmseBytesPerObligation);
  const comparisonFormula = comparisonDecodedBytes + diffDecodedBytes + rmseRecordBytes;
  const comparisonDiffRmseBytes = comparisonFormula > BigInt(policy.minimumComparisonDiffRmseBytes)
    ? comparisonFormula : BigInt(policy.minimumComparisonDiffRmseBytes);
  const uncompressedArchiveBytes = nativePngWorstCaseBytes
    + operationalAuditBytes + comparisonDiffRmseBytes;
  const compressedArchiveBytes = ceilDiv(
    uncompressedArchiveBytes * BigInt(policy.archiveWorstCaseNumerator),
    BigInt(policy.archiveWorstCaseDenominator),
  );
  const atomicFinalizationTempBytes = compressedArchiveBytes
    + expectedFileCount * BigInt(policy.manifestBytesPerExpectedFile);
  const remainingFormula = uncompressedArchiveBytes * 2n;
  const remainingBatchReserveBytes = remainingFormula > BigInt(policy.minimumRemainingBatchBytes)
    ? remainingFormula : BigInt(policy.minimumRemainingBatchBytes);
  const postSessionResidualBytes = compressedArchiveBytes > BigInt(policy.minimumPostSessionResidualBytes)
    ? compressedArchiveBytes : BigInt(policy.minimumPostSessionResidualBytes);
  const requiredBytes = decodedWorkingSetBytes + nativePngWorstCaseBytes + operationalAuditBytes
    + comparisonDiffRmseBytes + uncompressedArchiveBytes + compressedArchiveBytes
    + atomicFinalizationTempBytes + remainingBatchReserveBytes + postSessionResidualBytes;
  return Object.freeze({
    sizingPolicy: {
      policyVersion: policy.policyVersion,
      policySha256: CAPACITY_SIZING_POLICY_SHA256,
    },
    inputs: {
      rootFrameCount: plan.runtime.rootFrameCount,
      sourceNativeStage: structuredClone(plan.runtime.sourceNativeStage),
      captureRaster: structuredClone(plan.runtime.captureRaster),
      obligationCount: plan.captureObligationCount,
      expectedArtifactFileCount: expectedArtifacts.files.length,
    },
    components: {
      workingCopies: policy.workingCopies,
      decodedBytesPerFrame: safeCapacityNumber(decodedBytesPerFrame, "decodedBytesPerFrame"),
      decodedWorkingSetBytes: safeCapacityNumber(decodedWorkingSetBytes, "decodedWorkingSetBytes"),
      nativePngWorstCaseBytesPerCapture: safeCapacityNumber(
        nativePngWorstCaseBytesPerCapture, "nativePngWorstCaseBytesPerCapture",
      ),
      nativePngWorstCaseBytes: safeCapacityNumber(nativePngWorstCaseBytes, "nativePngWorstCaseBytes"),
      logBytes: safeCapacityNumber(logBytes, "logBytes"),
      manifestBytes: safeCapacityNumber(manifestBytes, "manifestBytes"),
      requestAuditBytes: safeCapacityNumber(requestAuditBytes, "requestAuditBytes"),
      audioAuditBytes: safeCapacityNumber(audioAuditBytes, "audioAuditBytes"),
      processAuditBytes: safeCapacityNumber(processAuditBytes, "processAuditBytes"),
      operationalAuditBytes: safeCapacityNumber(operationalAuditBytes, "operationalAuditBytes"),
      comparisonDecodedBytes: safeCapacityNumber(comparisonDecodedBytes, "comparisonDecodedBytes"),
      diffDecodedBytes: safeCapacityNumber(diffDecodedBytes, "diffDecodedBytes"),
      rmseRecordBytes: safeCapacityNumber(rmseRecordBytes, "rmseRecordBytes"),
      comparisonDiffRmseBytes: safeCapacityNumber(comparisonDiffRmseBytes, "comparisonDiffRmseBytes"),
      uncompressedArchiveBytes: safeCapacityNumber(uncompressedArchiveBytes, "uncompressedArchiveBytes"),
      compressedArchiveBytes: safeCapacityNumber(compressedArchiveBytes, "compressedArchiveBytes"),
      atomicFinalizationTempBytes: safeCapacityNumber(
        atomicFinalizationTempBytes, "atomicFinalizationTempBytes",
      ),
      remainingBatchReserveBytes: safeCapacityNumber(
        remainingBatchReserveBytes, "remainingBatchReserveBytes",
      ),
      postSessionResidualBytes: safeCapacityNumber(
        postSessionResidualBytes, "postSessionResidualBytes",
      ),
    },
    requiredBytes: safeCapacityNumber(requiredBytes, "requiredBytes"),
  });
}

export function validateCapacityPreflightShapeOnly(document, options = {}) {
  assertExactKeys(document, [
    "schemaVersion", "evidenceType", "sessionId", "sessionPlan", "outputRootPreflight", "measuredAt",
    "validUntil", "measurement", "demand", "result", "authorityBoundary", "receiptSha256",
  ], "capacity preflight");
  const plan = assertPlanBinding(document.sessionPlan, options);
  assertReceiptIdentity(document, "g4-l10-root-capture-capacity-preflight-v4", plan);
  const capacityWindow = assertValidityWindow(document, options.nowMs, "capacity preflight");
  invariant(capacityWindow.validUntil - capacityWindow.checkedAt <= 300_000,
    "capacity measurement validity exceeds 300 seconds");
  validateContentDescriptor(document.outputRootPreflight, {label: "capacity outputRootPreflight"});
  if (options.outputRootPreflightDescriptor) validateContentDescriptor(document.outputRootPreflight, {
    label: "capacity outputRootPreflight", expected: options.outputRootPreflightDescriptor,
  });
  if (options.outputRootPreflight) {
    validateOutputRootPreflightShapeOnly(options.outputRootPreflight, {...options, plan});
    validateContentDescriptor(document.outputRootPreflight, {
      label: "capacity outputRootPreflight",
      expected: canonicalDocumentDescriptor(document.outputRootPreflight.file, options.outputRootPreflight),
    });
  }
  assertExactKeys(document.measurement, [
    "path", "realPath", "device", "mountId", "blockSize", "availableBlocks", "freeBytes",
  ], "capacity measurement");
  invariant(path.isAbsolute(document.measurement.path)
    && document.measurement.realPath === document.measurement.path,
  "capacity measurement path is not absolute and real");
  invariant(/^[1-9][0-9]*$/u.test(document.measurement.device || ""),
    "capacity measurement device is invalid");
  assertNonempty(document.measurement.mountId, "capacity measurement mountId");
  for (const key of ["blockSize", "availableBlocks", "freeBytes"]) {
    invariant(Number.isSafeInteger(document.measurement[key]) && document.measurement[key] > 0,
      `capacity measurement.${key} is invalid`);
  }
  invariant(document.measurement.blockSize >= 512
    && document.measurement.blockSize <= 1_048_576
    && (document.measurement.blockSize & (document.measurement.blockSize - 1)) === 0,
  "capacity blockSize must be one bounded power of two");
  const measuredFree = BigInt(document.measurement.blockSize) * BigInt(document.measurement.availableBlocks);
  invariant(measuredFree <= BigInt(Number.MAX_SAFE_INTEGER)
    && document.measurement.freeBytes === Number(measuredFree),
  "capacity free-byte block arithmetic drifted");
  if (options.outputRootPreflight) {
    const root = options.outputRootPreflight.root;
    invariant(document.measurement.path === root.absolutePath
      && document.measurement.realPath === root.realPath
      && document.measurement.device === root.device
      && document.measurement.mountId === root.mountId,
    "capacity filesystem identity differs from the output-root preflight");
  }
  assertExactKeys(document.demand, ["sizingPolicy", "inputs", "components", "requiredBytes"],
    "capacity demand");
  assertExactKeys(document.demand.sizingPolicy, ["policyVersion", "policySha256"],
    "capacity demand sizingPolicy");
  invariant(document.demand.sizingPolicy.policyVersion === CAPACITY_SIZING_POLICY.policyVersion
    && document.demand.sizingPolicy.policySha256 === CAPACITY_SIZING_POLICY_SHA256,
  "capacity sizing policy version/hash drifted");
  assertExactKeys(document.demand.inputs, [
    "rootFrameCount", "sourceNativeStage", "captureRaster", "obligationCount",
    "expectedArtifactFileCount",
  ], "capacity demand inputs");
  assertSourceNativeStage(document.demand.inputs.sourceNativeStage);
  assertCaptureRaster(document.demand.inputs.captureRaster);
  assertExactKeys(document.demand.components, [
    "workingCopies", "decodedBytesPerFrame", "decodedWorkingSetBytes",
    "nativePngWorstCaseBytesPerCapture", "nativePngWorstCaseBytes", "logBytes",
    "manifestBytes", "requestAuditBytes", "audioAuditBytes", "processAuditBytes",
    "operationalAuditBytes", "comparisonDecodedBytes", "diffDecodedBytes", "rmseRecordBytes",
    "comparisonDiffRmseBytes", "uncompressedArchiveBytes", "compressedArchiveBytes",
    "atomicFinalizationTempBytes", "remainingBatchReserveBytes", "postSessionResidualBytes",
  ], "capacity demand components");
  for (const [key, value] of Object.entries({
    rootFrameCount: document.demand.inputs.rootFrameCount,
    obligationCount: document.demand.inputs.obligationCount,
    expectedArtifactFileCount: document.demand.inputs.expectedArtifactFileCount,
    ...document.demand.components,
    requiredBytes: document.demand.requiredBytes,
  })) invariant(Number.isSafeInteger(value) && value > 0, `capacity demand.${key} is invalid`);
  invariant(document.demand.components.operationalAuditBytes
    >= CAPACITY_SIZING_POLICY.minimumOperationalAuditBytes
    && document.demand.components.comparisonDiffRmseBytes
      >= CAPACITY_SIZING_POLICY.minimumComparisonDiffRmseBytes
    && document.demand.components.remainingBatchReserveBytes
      >= CAPACITY_SIZING_POLICY.minimumRemainingBatchBytes
    && document.demand.components.postSessionResidualBytes
      >= CAPACITY_SIZING_POLICY.minimumPostSessionResidualBytes,
  "capacity demand is below an exact policy minimum");
  if (plan && options.outputRootPreflight) {
    const derived = deriveCapacityDemandV4({
      plan,
      expectedArtifacts: options.outputRootPreflight.expectedArtifacts,
    });
    assertSame(document.demand, derived,
      "capacity demand does not equal the exact plan/stage/raster/94-obligation/artifact formula");
  }
  assertExactKeys(document.result, ["calculationSha256", "admitted", "marginBytes"], "capacity result");
  invariant(document.result.calculationSha256 === capacityCalculationSha256(document),
    "capacity calculation hash drifted");
  const margin = document.measurement.freeBytes - document.demand.requiredBytes;
  invariant(Number.isSafeInteger(document.result.marginBytes) && document.result.marginBytes === margin,
    "capacity margin arithmetic drifted");
  invariant(document.result.admitted === true && margin >= 0, "fresh capture capacity is insufficient");
  assertAllFalseAuthorityBoundary(document.authorityBoundary);
  assertReceiptSelfHash(document, "capacity preflight");
  return shapeOnlyResult("capacity-preflight-v4");
}

export function authorizationSigningBytes(document) {
  invariant(isPlainObject(document), "authorization document must be an object");
  invariant(isPlainObject(document.signature), "authorization signature is missing");
  return Buffer.from(canonicalJson(withoutField(document, "signature")), "utf8");
}

function publicKeyDescriptor(ownerPublicKey) {
  const key = ownerPublicKey?.type === "public" ? ownerPublicKey : createPublicKey(ownerPublicKey);
  invariant(key.asymmetricKeyType === "ed25519", "ownerPublicKey must be Ed25519");
  const der = key.export({type: "spki", format: "der"});
  return {key, sha256: sha256Bytes(der)};
}

function assertCanonicalEd25519Signature(signature, expectedPublicKeySha256) {
  assertExactKeys(signature, [
    "algorithm", "signerRole", "signerSubjectId", "publicKeySha256", "signatureBase64",
  ], "authorization signature");
  invariant(signature.algorithm === "Ed25519" && signature.signerRole === "owner",
    "authorization signature algorithm/role drifted");
  assertNonempty(signature.signerSubjectId, "authorization signature signerSubjectId");
  invariant(signature.publicKeySha256 === expectedPublicKeySha256,
    "authorization signature public-key identity drifted");
  invariant(typeof signature.signatureBase64 === "string"
    && /^(?:[A-Za-z0-9+/]{4}){21}[A-Za-z0-9+/]{2}==$/u.test(signature.signatureBase64),
  "authorization signature is not canonical padded base64 for 64 bytes");
  const bytes = Buffer.from(signature.signatureBase64, "base64");
  invariant(bytes.length === 64 && bytes.toString("base64") === signature.signatureBase64,
    "authorization signature does not decode canonically to 64 bytes");
  return bytes;
}

function assertAuthorizationIdentity(identity, plan) {
  assertExactKeys(identity, [
    "releaseId", "animationId", "requirementId", "language", "frameDomain", "trace",
    "entryStateSha256", "scenario", "seed",
  ], "authorization identity");
  invariant(identity.releaseId === RELEASE_ID, "authorization release identity drifted");
  if (plan) {
    assertSame(identity, {
      releaseId: plan.releaseId,
      animationId: plan.animationId,
      requirementId: plan.requirementId,
      ...plan.identity,
    }, "authorization identity/session-plan binding");
  } else {
    assertIdentity(Object.fromEntries([
      "language", "frameDomain", "trace", "entryStateSha256", "scenario", "seed",
    ].map((key) => [key, identity[key]])));
  }
}

export function operatorIdentitySha256(operator) {
  invariant(isPlainObject(operator), "operator identity must be an object");
  return sha256Text(canonicalJson(Object.fromEntries([
    "kind", "fullName", "roleId", "externalSubjectId", "org", "contact", "allowedActions",
    "publicKeySpkiBase64", "publicKeySha256",
  ].map((key) => [key, operator[key]]))));
}

function assertOperator(operator) {
  assertExactKeys(operator, [
    "kind", "fullName", "roleId", "externalSubjectId", "org", "contact", "allowedActions",
    "publicKeySpkiBase64", "publicKeySha256", "identitySha256",
  ],
    "named operator");
  invariant(operator.kind === "named-human"
    && operator.roleId === "authorized-original-runtime-operator",
  "named operator kind/role drifted");
  assertNonempty(operator.fullName, "named operator fullName");
  assertNonempty(operator.externalSubjectId, "named operator externalSubjectId");
  assertNonempty(operator.org, "named operator org");
  assertNonempty(operator.contact, "named operator contact");
  assertSortedUniqueStrings(operator.allowedActions, "named operator allowedActions");
  invariant(operator.allowedActions.every((value) => ACTION_ID.test(value)),
    "named operator action ID is invalid");
  invariant(same(operator.allowedActions, ALLOWED_HUMAN_OPERATION_IDS),
    "named operator allowed actions differ from the exact policy");
  const operatorKey = publicKeyFromCanonicalSpkiBase64(operator.publicKeySpkiBase64,
    "named operator public key");
  invariant(operator.publicKeySha256 === operatorKey.sha256,
    "named operator public-key identity drifted");
  invariant(operator.identitySha256 === operatorIdentitySha256(operator),
    "named operator identity binding drifted");
  return operatorKey;
}

function preflightDescriptors(preflights, label = "authorization preflights") {
  assertExactKeys(preflights, ["environment", "outputRoot", "capacity"], label);
  for (const [key, descriptor] of Object.entries(preflights)) {
    validateContentDescriptor(descriptor, {label: `${label}.${key}`});
  }
}

export function validateNamedOperatorAuthorizationShapeOnly(document, options = {}) {
  assertExactKeys(document, [
    "schemaVersion", "evidenceType", "decision", "session", "sessionPlan", "identity", "operator",
    "authorizer", "preflights", "runner", "launchIntent", "operationPolicy", "action",
    "stopConditions", "stopConditionSetSha256", "authorityBoundary", "signature",
  ], "named-operator authorization");
  invariant(document.schemaVersion === 4
    && document.evidenceType === "g4-l10-named-operator-session-authorization-v4"
    && document.decision === "authorize-once", "authorization identity/decision drifted");
  const plan = assertPlanBinding(document.sessionPlan, options);
  assertExactKeys(document.session, [
    "sessionId", "issuedAt", "notBefore", "expiresAt", "ttlSeconds", "nonce", "oneTimeUseRequired",
  ], "authorization session");
  invariant(SESSION_ID.test(document.session.sessionId || "")
    && (!plan || document.session.sessionId === plan.sessionId)
    && NONCE.test(document.session.nonce || "")
    && document.session.oneTimeUseRequired === true, "authorization session identity drifted");
  const issuedAt = assertCanonicalTimestamp(document.session.issuedAt, "authorization issuedAt");
  const notBefore = assertCanonicalTimestamp(document.session.notBefore, "authorization notBefore");
  const expiresAt = assertCanonicalTimestamp(document.session.expiresAt, "authorization expiresAt");
  invariant(Number.isInteger(document.session.ttlSeconds)
    && document.session.ttlSeconds >= 30 && document.session.ttlSeconds <= 900,
  "authorization TTL is outside 30-900 seconds");
  invariant(notBefore >= issuedAt && expiresAt > notBefore
    && expiresAt - issuedAt === document.session.ttlSeconds * 1000,
  "authorization chronology/TTL is inconsistent");
  const now = nowValue(options.nowMs);
  invariant(now !== null && now >= notBefore && now <= expiresAt,
    "authorization is not currently valid");
  assertAuthorizationIdentity(document.identity, plan);
  assertOperator(document.operator);
  assertExactKeys(document.authorizer, ["roleId", "subjectId", "publicKeySha256"], "authorizer");
  invariant(document.authorizer.roleId === "owner", "authorization authorizer is not the owner role");
  assertNonempty(document.authorizer.subjectId, "authorizer.subjectId");
  preflightDescriptors(document.preflights);
  if (options.preflightDescriptors) {
    preflightDescriptors(options.preflightDescriptors, "expected preflight descriptors");
    assertSame(document.preflights, options.preflightDescriptors, "authorization preflight bindings");
  }
  assertRunnerBinding(document.runner, plan?.runner || null,
    options.environmentPreflight?.physicalBindings?.runnerExecutable || null,
    "authorization runner");
  validateContentDescriptor(document.launchIntent, {label: "authorization launchIntent"});
  if (options.launchIntentDescriptor) validateContentDescriptor(document.launchIntent, {
    label: "authorization launchIntent", expected: options.launchIntentDescriptor,
  });
  if (options.launchIntent) assertDocumentBinding(document.launchIntent, options.launchIntent,
    "authorization launchIntent");
  assertExactOperationPolicy(document.operationPolicy, "authorization operationPolicy");
  if (plan) assertSame(document.operationPolicy, plan.operationPolicy,
    "authorization/session-plan operation policy");
  assertExactKeys(document.action, ["actionId"], "authorization action");
  invariant(ACTION_ID.test(document.action.actionId || "")
    && document.action.actionId === "projector.root-capture-natural-trace"
    && document.operator.allowedActions.includes(document.action.actionId)
    && !document.operationPolicy.humanOnlyActionIds.includes(document.action.actionId)
    && !document.operationPolicy.forbiddenActionIds.includes(document.action.actionId),
  "authorization action is not allowed for the named operator");
  assertStopConditions(document);
  if (plan) invariant(document.stopConditionSetSha256 === plan.stopConditionSetSha256,
    "authorization stop-condition set differs from the plan");
  assertAllFalseAuthorityBoundary(document.authorityBoundary);
  invariant(options.ownerPublicKey, "ownerPublicKey is required");
  const publicKey = publicKeyDescriptor(options.ownerPublicKey);
  invariant(document.authorizer.publicKeySha256 === publicKey.sha256,
    "authorizer public-key hash drifted");
  const signatureBytes = assertCanonicalEd25519Signature(document.signature, publicKey.sha256);
  invariant(document.signature.signerSubjectId === document.authorizer.subjectId,
    "authorization signer/authorizer identity drifted");
  invariant(verifySignature(null, authorizationSigningBytes(document), publicKey.key, signatureBytes),
    "authorization Ed25519 signature verification failed");
  return shapeOnlyResult("named-operator-authorization-v4");
}

function assertDocumentBinding(binding, document, label) {
  validateContentDescriptor(binding, {
    label,
    expected: canonicalDocumentDescriptor(binding.file, document),
  });
}

function preLaunchStartIdentitySha256({plan, runnerBinding, startInstanceId, nonceSha256}) {
  return sha256Text(canonicalJson({
    schemaVersion: 4,
    identityType: "g4-l10-prelaunch-start-instance-intent-v4",
    sessionId: plan.sessionId,
    planSha256: plan.planSha256,
    startInstanceId,
    nonceSha256,
    runtimeExecutableSha256: plan.runtime.executable.sha256,
    runnerExecutableSha256: runnerBinding.executable.sha256,
    runnerPhysicalIdentitySha256: runnerBinding.physicalIdentitySha256,
  }));
}

export function launchReplayTokenBytes({
  sessionId, nonceSha256, startInstanceId, preLaunchStartIdentitySha256: startIdentity,
  transitionPath,
}) {
  invariant(SESSION_ID.test(sessionId || "") && SESSION_ID.test(startInstanceId || ""),
    "launch replay token session/start-instance identity is invalid");
  assertSha256(nonceSha256, "launch replay token nonceSha256");
  assertSha256(startIdentity, "launch replay token preLaunchStartIdentitySha256");
  invariant(path.isAbsolute(transitionPath || ""),
    "launch replay token transitionPath must be absolute");
  return Buffer.from(canonicalJson({
    schemaVersion: 4,
    protocol: TOKEN_TRANSITION_PROTOCOL,
    state: `unconsumed/${nonceSha256}`,
    sessionId,
    nonceSha256,
    startInstanceId,
    preLaunchStartIdentitySha256: startIdentity,
    transitionPath,
  }), "utf8");
}

export function launchReplayObservationBytes({sessionId, observedAt, replayToken}) {
  invariant(SESSION_ID.test(sessionId || ""), "launch replay observation sessionId is invalid");
  assertCanonicalTimestamp(observedAt, "launch replay observation observedAt");
  invariant(isPlainObject(replayToken), "launch replay observation replayToken is invalid");
  return Buffer.from(canonicalJson({
    schemaVersion: 4,
    observationType: "g4-l10-unconsumed-replay-token-state-v4",
    sessionId,
    observedAt,
    preimage: replayToken.preimage,
    preimagePhysicalIdentitySha256: physicalIdentitySha256(replayToken.preimagePhysical),
    preimageExists: true,
    transitionPath: replayToken.transitionPath,
    transitionExists: false,
  }), "utf8");
}

export function validateLaunchIntentShapeOnly(document, options = {}) {
  assertExactKeys(document, [
    "schemaVersion", "evidenceType", "sessionId", "sessionPlan", "environmentPreflight",
    "runner", "startInstanceId", "nonceSha256", "preLaunchStartIdentitySha256", "observedAt",
    "validUntil", "replayToken", "authorityBoundary", "receiptSha256",
  ], "launch intent");
  const plan = assertPlanBinding(document.sessionPlan, options);
  assertReceiptIdentity(document, "g4-l10-unconsumed-launch-intent-v4", plan);
  validateContentDescriptor(document.environmentPreflight, {label: "launch intent environmentPreflight"});
  if (options.environmentPreflightDescriptor) validateContentDescriptor(document.environmentPreflight, {
    label: "launch intent environmentPreflight", expected: options.environmentPreflightDescriptor,
  });
  if (options.environmentPreflight) assertDocumentBinding(document.environmentPreflight,
    options.environmentPreflight, "launch intent environmentPreflight");
  assertRunnerBinding(document.runner, plan?.runner || null,
    options.environmentPreflight?.physicalBindings?.runnerExecutable || null,
    "launch intent runner");
  invariant(SESSION_ID.test(document.startInstanceId || ""),
    "launch intent startInstanceId must be one canonical UUID");
  assertSha256(document.nonceSha256, "launch intent nonceSha256");
  assertSha256(document.preLaunchStartIdentitySha256, "launch intent preLaunchStartIdentitySha256");
  if (plan) invariant(document.preLaunchStartIdentitySha256 === preLaunchStartIdentitySha256({
    plan,
    runnerBinding: document.runner,
    startInstanceId: document.startInstanceId,
    nonceSha256: document.nonceSha256,
  }), "launch intent pre-launch start identity drifted");
  const observedAt = assertCanonicalTimestamp(document.observedAt, "launch intent observedAt");
  const validUntil = assertCanonicalTimestamp(document.validUntil, "launch intent validUntil");
  invariant(validUntil > observedAt && validUntil - observedAt <= 300_000,
    "launch intent validity must be positive and at most 300 seconds");
  const now = nowValue(options.nowMs);
  if (now !== null) invariant(now >= observedAt && now <= validUntil,
    "launch intent is outside its validity window");
  assertExactKeys(document.replayToken, [
    "state", "preimage", "preimagePhysical", "observationReceipt", "observationReceiptPhysical",
    "replayLockPath", "transitionPath", "transitionReceiptPath", "noStartedTransitionPresent",
    "statefulFilesystemObservationRequired",
  ], "launch intent replayToken");
  invariant(document.replayToken.state === `unconsumed/${document.nonceSha256}`
    && document.replayToken.noStartedTransitionPresent === true
    && document.replayToken.statefulFilesystemObservationRequired === true,
  "launch intent does not bind an observed unconsumed replay token");
  for (const [key, physicalKey] of [
    ["preimage", "preimagePhysical"],
    ["observationReceipt", "observationReceiptPhysical"],
  ]) {
    validateContentDescriptor(document.replayToken[key], {label: `launch intent replayToken.${key}`});
    assertPhysicalFileEvidence(document.replayToken[physicalKey], document.replayToken[key],
      `launch intent replayToken.${physicalKey}`);
    invariant(document.replayToken[physicalKey].observedAt === document.observedAt,
      `launch intent replayToken.${physicalKey} observation time drifted`);
  }
  validateContentDescriptor(document.replayToken.preimage, {
    label: "launch intent canonical replay-token preimage",
    expected: contentDescriptor(document.replayToken.preimage.file, launchReplayTokenBytes({
      sessionId: document.sessionId,
      nonceSha256: document.nonceSha256,
      startInstanceId: document.startInstanceId,
      preLaunchStartIdentitySha256: document.preLaunchStartIdentitySha256,
      transitionPath: document.replayToken.transitionPath,
    })),
  });
  validateContentDescriptor(document.replayToken.observationReceipt, {
    label: "launch intent canonical replay-token observation",
    expected: contentDescriptor(document.replayToken.observationReceipt.file,
      launchReplayObservationBytes({
        sessionId: document.sessionId,
        observedAt: document.observedAt,
        replayToken: document.replayToken,
      })),
  });
  invariant(path.isAbsolute(document.replayToken.replayLockPath)
    && path.isAbsolute(document.replayToken.transitionPath)
    && path.isAbsolute(document.replayToken.transitionReceiptPath)
    && path.basename(document.replayToken.preimage.file) === `${document.nonceSha256}.unconsumed.json`
    && path.basename(document.replayToken.replayLockPath) === `${document.nonceSha256}.lock.json`
    && path.basename(document.replayToken.transitionPath)
      === `${document.nonceSha256}.started-${document.startInstanceId}.json`
    && path.basename(document.replayToken.transitionReceiptPath)
      === `${document.nonceSha256}.transition-receipt.json`
    && new Set([
      document.replayToken.preimage.file,
      document.replayToken.observationReceipt.file,
      document.replayToken.replayLockPath,
      document.replayToken.transitionPath,
      document.replayToken.transitionReceiptPath,
    ]).size === 5,
  "launch intent replay-lock/transition paths do not bind the nonce");
  if (options.environmentPreflight) {
    const replayRoot = options.environmentPreflight.profile.externalReplayLockRoot.realPath;
    invariant(path.dirname(document.replayToken.preimage.file) === replayRoot
      && path.dirname(document.replayToken.observationReceipt.file) === replayRoot
      && path.dirname(document.replayToken.replayLockPath) === replayRoot
      && path.dirname(document.replayToken.transitionPath) === replayRoot
      && path.dirname(document.replayToken.transitionReceiptPath) === replayRoot,
    "launch intent token evidence escapes the physical external replay root");
  }
  assertAllFalseAuthorityBoundary(document.authorityBoundary);
  assertReceiptSelfHash(document, "launch intent");
  return shapeOnlyResult("unconsumed-launch-intent-v4");
}

export function preLaunchAdmissionBindingSha256({
  plan, environmentPreflight, outputRootPreflight, capacityPreflight, authorization,
  launchIntent, ownerPublicKey,
}) {
  const ownerKey = publicKeyDescriptor(ownerPublicKey);
  return sha256Text(canonicalJson({
    schemaVersion: 4,
    protocol: PRELAUNCH_ADMISSION_PROTOCOL,
    sessionId: plan.sessionId,
    planSha256: plan.planSha256,
    captureKitSha256: plan.captureKit.sha256,
    kitCheckSha256: plan.kitCheck.sha256,
    environmentReceiptSha256: environmentPreflight.receiptSha256,
    outputRootReceiptSha256: outputRootPreflight.receiptSha256,
    capacityReceiptSha256: capacityPreflight.receiptSha256,
    authorizationSignatureSha256: sha256Text(authorization.signature.signatureBase64),
    launchIntentReceiptSha256: launchIntent.receiptSha256,
    ownerPublicKeySha256: ownerKey.sha256,
  }));
}

function validatePreLaunchCandidateV4(input) {
  assertExactKeys(input, [
    "plan", "environmentPreflight", "outputRootPreflight", "capacityPreflight", "authorization",
    "launchIntent", "ownerPublicKey", "nowMs",
  ], "pre-launch admission input");
  const plan = assertChainInputDocument(input.plan, "pre-launch plan");
  const environment = assertChainInputDocument(input.environmentPreflight, "pre-launch environmentPreflight");
  const outputRoot = assertChainInputDocument(input.outputRootPreflight, "pre-launch outputRootPreflight");
  const capacity = assertChainInputDocument(input.capacityPreflight, "pre-launch capacityPreflight");
  const authorization = assertChainInputDocument(input.authorization, "pre-launch authorization");
  const launchIntent = assertChainInputDocument(input.launchIntent, "pre-launch launchIntent");
  invariant(input.ownerPublicKey, "pre-launch ownerPublicKey is required");
  const now = nowValue(input.nowMs);
  invariant(now !== null, "pre-launch nowMs is required");
  validateSessionPlanShapeOnly(plan);
  const planDescriptor = environment.sessionPlan;
  assertDocumentBinding(planDescriptor, plan, "pre-launch session plan");
  for (const [label, descriptor] of [
    ["output-root sessionPlan", outputRoot.sessionPlan],
    ["capacity sessionPlan", capacity.sessionPlan],
    ["authorization sessionPlan", authorization.sessionPlan],
    ["launch-intent sessionPlan", launchIntent.sessionPlan],
  ]) validateContentDescriptor(descriptor, {label, expected: planDescriptor});
  validateEnvironmentPreflightShapeOnly(environment, {plan, planDescriptor, nowMs: now});
  validateOutputRootPreflightShapeOnly(outputRoot, {plan, planDescriptor, nowMs: now});
  assertSameStablePhysicalIdentity(environment.hostTree.root, outputRoot.pathBoundary.stagedRoot,
    "pre-launch environment/output staged-root physical identity");
  for (const [label, runtimeRoot] of [
    ["disposable profile", environment.profile.sessionRoot],
    ["external replay-lock", environment.profile.externalReplayLockRoot],
  ]) invariant(
    pathsAreDisjoint(outputRoot.root.realPath, runtimeRoot.realPath)
      && !(outputRoot.root.device === runtimeRoot.device
        && outputRoot.root.inode === runtimeRoot.inode),
    `pre-launch output root overlaps the ${label} physical root`,
  );
  const outputRootDescriptor = capacity.outputRootPreflight;
  assertDocumentBinding(outputRootDescriptor, outputRoot, "pre-launch capacity output root");
  validateCapacityPreflightShapeOnly(capacity, {
    plan, planDescriptor, nowMs: now, outputRootPreflight: outputRoot,
    outputRootPreflightDescriptor: outputRootDescriptor,
  });
  const environmentDescriptor = authorization.preflights.environment;
  const capacityDescriptor = authorization.preflights.capacity;
  const authorizationOutputDescriptor = authorization.preflights.outputRoot;
  assertDocumentBinding(environmentDescriptor, environment, "pre-launch authorization environment");
  assertDocumentBinding(authorizationOutputDescriptor, outputRoot, "pre-launch authorization output root");
  assertDocumentBinding(capacityDescriptor, capacity, "pre-launch authorization capacity");
  assertDocumentBinding(launchIntent.environmentPreflight, environment,
    "pre-launch launch-intent environment");
  validateLaunchIntentShapeOnly(launchIntent, {
    plan, planDescriptor, nowMs: now, environmentPreflight: environment,
    environmentPreflightDescriptor: launchIntent.environmentPreflight,
  });
  invariant(launchIntent.nonceSha256 === sha256Text(authorization.session.nonce),
    "pre-launch launch intent nonce differs from owner authorization");
  validateNamedOperatorAuthorizationShapeOnly(authorization, {
    plan,
    planDescriptor,
    nowMs: now,
    ownerPublicKey: input.ownerPublicKey,
    preflightDescriptors: authorization.preflights,
    environmentPreflight: environment,
    launchIntent,
    launchIntentDescriptor: authorization.launchIntent,
  });
  const chronology = [
    Date.parse(environment.checkedAt), Date.parse(outputRoot.checkedAt), Date.parse(capacity.measuredAt),
    Date.parse(launchIntent.observedAt), Date.parse(authorization.session.issuedAt),
    Date.parse(authorization.session.notBefore), now,
  ];
  invariant(chronology.every((value, index) => index === 0 || chronology[index - 1] <= value),
    "pre-launch chronology is not one-way");
  invariant(now <= Date.parse(environment.validUntil)
    && now <= Date.parse(outputRoot.validUntil)
    && now <= Date.parse(capacity.validUntil)
    && now <= Date.parse(launchIntent.validUntil)
    && now <= Date.parse(authorization.session.expiresAt),
  "pre-launch candidate exceeds a readiness, token, or authorization validity window");
  for (const document of [plan, environment, outputRoot, capacity, authorization, launchIntent]) {
    assertAllFalseAuthorityBoundary(document.authorityBoundary);
  }
  return {
    plan,
    environment,
    outputRoot,
    capacity,
    authorization,
    launchIntent,
    planDescriptor,
    bindingSha256: preLaunchAdmissionBindingSha256({
      plan, environmentPreflight: environment, outputRootPreflight: outputRoot,
      capacityPreflight: capacity, authorization, launchIntent, ownerPublicKey: input.ownerPublicKey,
    }),
  };
}

function assertPinnedOwnerTrustAnchor(authorization, ownerPublicKey) {
  const pinnedOwnerTrustAnchor = assertV4PreparationAuthorityAvailable();
  const suppliedOwnerKey = publicKeyDescriptor(ownerPublicKey);
  invariant(suppliedOwnerKey.sha256 === pinnedOwnerTrustAnchor.publicKeySha256,
    "owner key differs from the fixed project trust anchor");
  invariant(authorization.authorizer.subjectId === pinnedOwnerTrustAnchor.subjectId
    && authorization.authorizer.roleId === pinnedOwnerTrustAnchor.roleId,
  "owner role governance differs from the fixed project trust anchor");
}

export function validatePreLaunchAdmissionV4(input) {
  const candidate = validatePreLaunchCandidateV4(input);
  assertPinnedOwnerTrustAnchor(candidate.authorization, input.ownerPublicKey);
  return Object.freeze({
    ok: true,
    validationClass: "prelaunch-admission-v4",
    protocol: PRELAUNCH_ADMISSION_PROTOCOL,
    sessionId: candidate.plan.sessionId,
    startInstanceId: candidate.launchIntent.startInstanceId,
    preLaunchAdmissionBindingSha256: candidate.bindingSha256,
    cryptographicAdmissionContractSatisfied: true,
    statefulFilesystemVerificationRequiredAtLaunch: true,
    acceptanceEffect: "none",
  });
}

function startIdentitySha256({
  plan, authorization, authorizationDescriptor, nonceSha256, launchIntent,
  preLaunchAdmissionBinding, runnerProcess, projectorProcess,
}) {
  return sha256Text(canonicalJson({
    schemaVersion: 4,
    identityType: "g4-l10-one-consumption-one-projector-start-v4",
    sessionId: plan.sessionId,
    planSha256: plan.planSha256,
    authorizationSha256: authorizationDescriptor.sha256,
    nonceSha256,
    operatorExternalSubjectId: authorization.operator.externalSubjectId,
    actionId: authorization.action.actionId,
    runtimeExecutableSha256: plan.runtime.executable.sha256,
    runnerExecutableSha256: plan.runner.executable.sha256,
    runnerPhysicalIdentitySha256: launchIntent.runner.physicalIdentitySha256,
    startInstanceId: launchIntent.startInstanceId,
    preLaunchAdmissionBindingSha256: preLaunchAdmissionBinding,
    runnerProcess,
    projectorProcess,
  }));
}

export function tokenTransitionReceiptBytes({sessionId, nonceSha256, transition}) {
  invariant(SESSION_ID.test(sessionId || "") && isPlainObject(transition),
    "token transition receipt input is invalid");
  assertSha256(nonceSha256, "token transition receipt nonceSha256");
  return Buffer.from(canonicalJson({
    schemaVersion: 4,
    protocol: transition.protocol,
    sessionId,
    nonceSha256,
    atomicPrimitive: transition.atomicPrimitive,
    fromState: transition.fromState,
    toState: transition.toState,
    preimageSha256: transition.preimageSha256,
    startedToken: transition.startedToken,
    startedTokenPhysicalIdentitySha256: physicalIdentitySha256(transition.startedTokenPhysical),
    preimagePostObservation: transition.preimagePostObservation,
    replayLockRetainedPhysicalIdentitySha256:
      physicalIdentitySha256(transition.replayLockRetainedPhysical),
    authorizationSha256: transition.authorizationSha256,
    launchIntentSha256: transition.launchIntentSha256,
    preLaunchAdmissionBindingSha256: transition.preLaunchAdmissionBindingSha256,
    startInstanceId: transition.startInstanceId,
    transitionedAt: transition.transitionedAt,
    verifiedAt: transition.verifiedAt,
    runner: transition.runner,
    lockDevice: transition.lockDevice,
    lockInode: transition.lockInode,
    runnerProcess: transition.runnerProcess,
    projectorProcess: transition.projectorProcess,
    durableFsync: transition.durableFsync,
    irreversible: transition.irreversible,
  }), "utf8");
}

export function statefulFilesystemVerificationReceiptBytes({
  sessionId, nonceSha256, statefulFilesystemVerifier,
}) {
  invariant(SESSION_ID.test(sessionId || "") && isPlainObject(statefulFilesystemVerifier),
    "stateful filesystem verification receipt input is invalid");
  assertSha256(nonceSha256, "stateful filesystem verification receipt nonceSha256");
  return Buffer.from(canonicalJson({
    schemaVersion: 4,
    receiptType: "g4-l10-stateful-filesystem-transition-verification-v4",
    sessionId,
    nonceSha256,
    runner: statefulFilesystemVerifier.runner,
    verifiedAt: statefulFilesystemVerifier.verifiedAt,
    lockDevice: statefulFilesystemVerifier.lockDevice,
    lockInode: statefulFilesystemVerifier.lockInode,
    transitionReceipt: statefulFilesystemVerifier.transitionReceipt,
    startedToken: statefulFilesystemVerifier.startedToken,
    startedTokenPhysicalIdentitySha256:
      physicalIdentitySha256(statefulFilesystemVerifier.startedTokenPhysical),
    preimagePostObservation: statefulFilesystemVerifier.preimagePostObservation,
    replayLockRetainedPhysicalIdentitySha256:
      physicalIdentitySha256(statefulFilesystemVerifier.replayLockRetainedPhysical),
  }), "utf8");
}

export function validateAuthorizationConsumptionShapeOnly(document, options = {}) {
  assertExactKeys(document, [
    "schemaVersion", "evidenceType", "sessionId", "authorization", "nonceSha256", "consumedAt",
    "launchIntent", "preLaunchAdmissionBindingSha256", "replayLock", "transition",
    "runnerProcess", "projectorProcess", "statefulFilesystemVerifier",
    "statefulFilesystemVerificationPassed", "startIdentitySha256", "runtimeLaunched",
    "authorityBoundary", "receiptSha256",
  ], "authorization consumption");
  const authorization = options.authorization || null;
  const plan = options.plan || options.sessionPlan || null;
  assertReceiptIdentity(document, "g4-l10-authorization-consumption-receipt-v4", plan?.planSha256 ? plan : null);
  validateContentDescriptor(document.authorization, {label: "authorization consumption authorization"});
  if (options.authorizationDescriptor) validateContentDescriptor(document.authorization, {
    label: "authorization consumption authorization", expected: options.authorizationDescriptor,
  });
  if (authorization) {
    if (options.ownerPublicKey && options.nowMs !== undefined) {
      validateNamedOperatorAuthorizationShapeOnly(authorization, {
        ...options,
        plan: plan?.planSha256 ? plan : options.plan,
      });
    }
    assertDocumentBinding(document.authorization, authorization, "authorization consumption authorization");
    invariant(document.sessionId === authorization.session.sessionId,
      "authorization-consumption session drifted");
    invariant(document.nonceSha256 === sha256Text(authorization.session.nonce),
      "authorization-consumption nonce hash drifted");
  } else assertSha256(document.nonceSha256, "authorization consumption nonceSha256");
  validateContentDescriptor(document.launchIntent, {label: "authorization consumption launchIntent"});
  if (options.launchIntentDescriptor) validateContentDescriptor(document.launchIntent, {
    label: "authorization consumption launchIntent", expected: options.launchIntentDescriptor,
  });
  if (options.launchIntent) {
    assertDocumentBinding(document.launchIntent, options.launchIntent,
      "authorization consumption launchIntent");
    invariant(options.launchIntent.sessionId === document.sessionId
      && options.launchIntent.nonceSha256 === document.nonceSha256,
    "authorization consumption launch intent identity drifted");
  }
  assertSha256(document.preLaunchAdmissionBindingSha256,
    "authorization consumption preLaunchAdmissionBindingSha256");
  if (options.preLaunchAdmissionBindingSha256) invariant(
    document.preLaunchAdmissionBindingSha256 === options.preLaunchAdmissionBindingSha256,
    "authorization consumption pre-launch admission binding drifted",
  );
  const consumedAt = assertCanonicalTimestamp(document.consumedAt, "authorization consumption consumedAt");
  if (authorization) {
    invariant(consumedAt >= Date.parse(authorization.session.notBefore)
      && consumedAt <= Date.parse(authorization.session.expiresAt),
    "authorization consumption occurred outside the signed validity window");
  }
  assertExactKeys(document.replayLock, [
    "descriptor", "physical", "atomicPrimitive", "createdExclusively", "preexisting", "readOnly",
    "nonceSha256", "sessionId", "lockDevice", "lockInode",
  ], "authorization consumption replayLock");
  validateContentDescriptor(document.replayLock.descriptor, {label: "replayLock.descriptor"});
  assertPhysicalFileEvidence(document.replayLock.physical, document.replayLock.descriptor,
    "replayLock.physical");
  invariant(REPLAY_LOCK_ATOMIC_PRIMITIVES.includes(document.replayLock.atomicPrimitive),
    "replayLock.atomicPrimitive is outside the exact allowlist");
  invariant(document.replayLock.nonceSha256 === document.nonceSha256
    && document.replayLock.sessionId === document.sessionId
    && document.replayLock.createdExclusively === true
    && document.replayLock.preexisting === false && document.replayLock.readOnly === true,
  "authorization replay-lock boundary drifted");
  invariant(document.replayLock.lockDevice === document.replayLock.physical.device
    && document.replayLock.lockInode === document.replayLock.physical.inode
    && document.replayLock.physical.observedAt === document.consumedAt,
  "authorization replay-lock physical identity drifted");
  invariant(path.isAbsolute(document.replayLock.descriptor.file)
    && path.basename(document.replayLock.descriptor.file) === `${document.nonceSha256}.lock.json`,
  "authorization replay-lock path does not bind the consumed nonce");
  if (options.environmentPreflight) invariant(
    path.dirname(document.replayLock.descriptor.file)
      === options.environmentPreflight.profile.externalReplayLockRoot.realPath,
    "authorization replay-lock path differs from the external environment authority root",
  );
  assertExactKeys(document.transition, [
    "protocol", "atomicPrimitive", "fromState", "toState", "preimageSha256",
    "startedToken", "startedTokenPhysical", "preimagePostObservation",
    "replayLockRetainedPhysical",
    "authorizationSha256", "launchIntentSha256", "preLaunchAdmissionBindingSha256",
    "startInstanceId", "transitionedAt", "verifiedAt", "runner", "lockDevice", "lockInode",
    "runnerProcess", "projectorProcess", "durableFsync", "irreversible", "receipt",
    "receiptPhysical",
  ], "authorization consumption transition");
  invariant(document.transition.protocol === TOKEN_TRANSITION_PROTOCOL
    && TOKEN_TRANSITION_ATOMIC_PRIMITIVES.includes(document.transition.atomicPrimitive)
    && document.transition.durableFsync === true && document.transition.irreversible === true,
  "authorization transition is not one exact durable irreversible primitive");
  invariant(document.transition.authorizationSha256 === document.authorization.sha256
    && document.transition.launchIntentSha256 === document.launchIntent.sha256
    && document.transition.preLaunchAdmissionBindingSha256
      === document.preLaunchAdmissionBindingSha256,
  "authorization transition pre-launch/authorization binding drifted");
  const startInstanceId = options.launchIntent?.startInstanceId || document.transition.startInstanceId;
  invariant(SESSION_ID.test(startInstanceId || "")
    && document.transition.startInstanceId === startInstanceId
    && document.transition.fromState === `unconsumed/${document.nonceSha256}`
    && document.transition.toState === `started/${startInstanceId}`,
  "authorization transition does not model exact unconsumed-to-started state");
  if (options.launchIntent) invariant(
    document.transition.preimageSha256 === options.launchIntent.replayToken.preimage.sha256,
    "authorization transition preimage differs from the observed unconsumed token",
  );
  assertCanonicalTimestamp(document.transition.transitionedAt, "authorization transition transitionedAt");
  const transitionVerifiedAt = assertCanonicalTimestamp(document.transition.verifiedAt,
    "authorization transition verifiedAt");
  invariant(document.transition.transitionedAt === document.consumedAt
    && transitionVerifiedAt >= consumedAt,
    "authorization consumption/transition chronology drifted");
  validateContentDescriptor(document.transition.startedToken,
    {label: "authorization transition startedToken"});
  assertPhysicalFileEvidence(document.transition.startedTokenPhysical,
    document.transition.startedToken, "authorization transition startedTokenPhysical");
  assertExactKeys(document.transition.preimagePostObservation, [
    "path", "observedAt", "exists", "symlink", "lstatError",
  ], "authorization transition preimagePostObservation");
  invariant(document.transition.preimagePostObservation.observedAt === document.transition.verifiedAt
    && document.transition.preimagePostObservation.exists === false
    && document.transition.preimagePostObservation.symlink === false
    && document.transition.preimagePostObservation.lstatError === "ENOENT",
  "authorization transition did not prove the unconsumed preimage absent");
  assertPhysicalFileEvidence(document.transition.replayLockRetainedPhysical,
    document.replayLock.descriptor, "authorization transition replayLockRetainedPhysical");
  invariant(document.transition.replayLockRetainedPhysical.observedAt === document.transition.verifiedAt,
    "authorization transition replay-lock retention observation time drifted");
  assertSameStablePhysicalIdentity(document.transition.replayLockRetainedPhysical,
    document.replayLock.physical, "authorization transition retained replay-lock identity");
  if (options.launchIntent) {
    const preimage = options.launchIntent.replayToken.preimage;
    const preimagePhysical = options.launchIntent.replayToken.preimagePhysical;
    invariant(document.transition.startedToken.file
      === options.launchIntent.replayToken.transitionPath
      && document.transition.startedToken.bytes === preimage.bytes
      && document.transition.startedToken.sha256 === preimage.sha256
      && document.transition.preimagePostObservation.path === preimage.file,
    "authorization transition rename destination/source bytes drifted");
    invariant(document.transition.startedTokenPhysical.device === preimagePhysical.device
      && document.transition.startedTokenPhysical.inode === preimagePhysical.inode
      && document.transition.startedTokenPhysical.mode === preimagePhysical.mode
      && document.transition.startedTokenPhysical.mountId === preimagePhysical.mountId
      && document.transition.startedTokenPhysical.nlink === preimagePhysical.nlink
      && document.transition.startedTokenPhysical.ordinaryFile === preimagePhysical.ordinaryFile
      && document.transition.startedTokenPhysical.symlinkFree === preimagePhysical.symlinkFree
      && document.transition.startedTokenPhysical.observedAt === document.transition.verifiedAt,
    "authorization transition did not preserve the renamed preimage physical inode/bytes");
  }
  validateContentDescriptor(document.transition.receipt, {label: "authorization transition receipt"});
  assertPhysicalFileEvidence(document.transition.receiptPhysical, document.transition.receipt,
    "authorization transition receiptPhysical");
  invariant(document.transition.receiptPhysical.observedAt === document.transition.verifiedAt,
    "authorization transition receipt observation time drifted");
  assertRunnerBinding(document.transition.runner, plan?.runner || null,
    options.environmentPreflight?.physicalBindings?.runnerExecutable || null,
    "authorization transition runner");
  invariant(document.transition.lockDevice === document.replayLock.lockDevice
    && document.transition.lockInode === document.replayLock.lockInode,
  "authorization transition lock device/inode drifted");
  assertSame(document.transition.runnerProcess, document.runnerProcess,
    "authorization transition runnerProcess");
  assertSame(document.transition.projectorProcess, document.projectorProcess,
    "authorization transition projectorProcess");
  if (options.launchIntent) invariant(
    document.transition.receipt.file === options.launchIntent.replayToken.transitionReceiptPath,
    "authorization transition receipt path differs from launch-intent receipt path",
  );
  validateContentDescriptor(document.transition.receipt, {
    label: "authorization transition receipt canonical bytes",
    expected: contentDescriptor(document.transition.receipt.file, tokenTransitionReceiptBytes({
      sessionId: document.sessionId,
      nonceSha256: document.nonceSha256,
      transition: document.transition,
    })),
  });
  const assertProcess = (processIdentity, expectedDescriptor, label, {runner = false} = {}) => {
    const keys = [
      "pid", "processStartTokenSha256", "executablePath", "executableSha256", "startedAt",
    ];
    if (runner) keys.push("toolId", "toolVersion");
    else keys.push("parentPid");
    assertExactKeys(processIdentity, keys, label);
    invariant(Number.isInteger(processIdentity.pid) && processIdentity.pid > 0
      && processIdentity.executablePath === expectedDescriptor.file
      && processIdentity.executableSha256 === expectedDescriptor.sha256,
    `${label} executable/PID identity drifted`);
    assertSha256(processIdentity.processStartTokenSha256, `${label}.processStartTokenSha256`);
    assertCanonicalTimestamp(processIdentity.startedAt, `${label}.startedAt`);
    if (runner) {
      invariant(processIdentity.toolId === plan?.runner.toolId
        && processIdentity.toolVersion === plan?.runner.toolVersion,
      `${label} tool identity drifted`);
    }
    return processIdentity;
  };
  assertProcess(document.runnerProcess, plan?.runner.executable || document.runnerProcess,
    "authorization consumption runnerProcess", {runner: true});
  assertProcess(document.projectorProcess, plan?.runtime.executable || document.projectorProcess,
    "authorization consumption projectorProcess");
  invariant(document.projectorProcess.parentPid === document.runnerProcess.pid
    && Date.parse(document.runnerProcess.startedAt) <= Date.parse(document.projectorProcess.startedAt)
    && document.projectorProcess.startedAt === document.consumedAt,
  "authorization consumption projector parent/start chronology differs from the exact runner process");
  if (authorization && options.launchIntent) invariant(
    Date.parse(document.runnerProcess.startedAt) >= Date.parse(options.launchIntent.observedAt)
      && Date.parse(document.runnerProcess.startedAt) >= Date.parse(authorization.session.notBefore)
      && Date.parse(document.runnerProcess.startedAt) <= consumedAt,
    "authorization consumption runner started outside the launch-intent/owner-authorized window",
  );
  assertExactKeys(document.statefulFilesystemVerifier, [
    "runner", "verifiedAt", "verificationReceipt", "verificationReceiptPhysical",
    "lockDevice", "lockInode", "transitionReceipt", "startedToken", "startedTokenPhysical",
    "preimagePostObservation", "replayLockRetainedPhysical",
  ], "authorization consumption statefulFilesystemVerifier");
  assertRunnerBinding(document.statefulFilesystemVerifier.runner, plan?.runner || null,
    options.environmentPreflight?.physicalBindings?.runnerExecutable || null,
    "authorization consumption stateful verifier runner");
  validateContentDescriptor(document.statefulFilesystemVerifier.verificationReceipt,
    {label: "authorization consumption stateful verificationReceipt"});
  assertPhysicalFileEvidence(document.statefulFilesystemVerifier.verificationReceiptPhysical,
    document.statefulFilesystemVerifier.verificationReceipt,
    "authorization consumption stateful verificationReceiptPhysical");
  invariant(document.statefulFilesystemVerifier.verifiedAt === document.transition.verifiedAt
    && document.statefulFilesystemVerifier.verificationReceiptPhysical.observedAt
      === document.statefulFilesystemVerifier.verifiedAt,
  "authorization consumption stateful verifier chronology drifted");
  invariant(document.statefulFilesystemVerifier.lockDevice === document.replayLock.lockDevice
    && document.statefulFilesystemVerifier.lockInode === document.replayLock.lockInode,
  "authorization consumption stateful verifier lock identity drifted");
  validateContentDescriptor(document.statefulFilesystemVerifier.transitionReceipt, {
    label: "authorization consumption stateful transitionReceipt",
    expected: document.transition.receipt,
  });
  for (const [key, expected] of [
    ["startedToken", document.transition.startedToken],
    ["startedTokenPhysical", document.transition.startedTokenPhysical],
    ["preimagePostObservation", document.transition.preimagePostObservation],
    ["replayLockRetainedPhysical", document.transition.replayLockRetainedPhysical],
  ]) assertSame(document.statefulFilesystemVerifier[key], expected,
    `authorization consumption stateful verifier ${key}`);
  validateContentDescriptor(document.statefulFilesystemVerifier.verificationReceipt, {
    label: "authorization consumption canonical stateful verification receipt",
    expected: contentDescriptor(document.statefulFilesystemVerifier.verificationReceipt.file,
      statefulFilesystemVerificationReceiptBytes({
        sessionId: document.sessionId,
        nonceSha256: document.nonceSha256,
        statefulFilesystemVerifier: document.statefulFilesystemVerifier,
      })),
  });
  assertSha256(document.startIdentitySha256, "authorization consumption startIdentitySha256");
  if (authorization && plan?.planSha256 && options.launchIntent) invariant(
    document.startIdentitySha256 === startIdentitySha256({
      plan,
      authorization,
      authorizationDescriptor: document.authorization,
      nonceSha256: document.nonceSha256,
      launchIntent: options.launchIntent,
      preLaunchAdmissionBinding: document.preLaunchAdmissionBindingSha256,
      runnerProcess: document.runnerProcess,
      projectorProcess: document.projectorProcess,
    }), "authorization-consumption one-start identity drifted",
  );
  invariant(document.projectorProcess.pid !== document.runnerProcess.pid
    && document.statefulFilesystemVerificationPassed === true
    && document.runtimeLaunched === true,
  "authorization consumption lacks closed stateful transition/process evidence");
  assertAllFalseAuthorityBoundary(document.authorityBoundary);
  assertReceiptSelfHash(document, "authorization consumption");
  return shapeOnlyResult("authorization-consumption-v4");
}

function assertReadinessBindings(readiness, options = {}) {
  assertExactKeys(readiness, ["authorization", "environment", "outputRoot", "capacity"], "readiness");
  for (const [key, descriptor] of Object.entries(readiness)) {
    validateContentDescriptor(descriptor, {label: `readiness.${key}`});
  }
  const expected = options.readinessDescriptors || null;
  if (expected) {
    assertExactKeys(expected, ["authorization", "environment", "outputRoot", "capacity"],
      "expected readiness");
    for (const [key, descriptor] of Object.entries(expected)) {
      validateContentDescriptor(descriptor, {label: `expected readiness.${key}`});
    }
    assertSame(readiness, expected, "readiness binding");
  }
}

export function validateAuthorizedProjectorStartShapeOnly(document, options = {}) {
  assertExactKeys(document, [
    "schemaVersion", "evidenceType", "sessionId", "sessionPlan", "preLaunchAdmissionBindingSha256",
    "launchIntent", "runner", "runnerPhysical", "readiness", "authorizationConsumption",
    "runtime", "sandbox", "profile", "outputRoot", "observers", "transitionReceipt",
    "statefulFilesystemVerifierReceipt", "runnerProcess", "projectorProcess", "startInstanceId",
    "startIdentitySha256", "startedAt", "argvSwf", "authorityBoundary", "receiptSha256",
  ], "authorized projector start");
  const plan = assertPlanBinding(document.sessionPlan, options);
  assertReceiptIdentity(document, "g4-l10-authorized-empty-projector-start-v4", plan);
  assertSha256(document.preLaunchAdmissionBindingSha256,
    "authorized start preLaunchAdmissionBindingSha256");
  if (options.preLaunchAdmissionBindingSha256) invariant(
    document.preLaunchAdmissionBindingSha256 === options.preLaunchAdmissionBindingSha256,
    "authorized start pre-launch admission binding drifted",
  );
  validateContentDescriptor(document.launchIntent, {label: "authorized start launchIntent"});
  if (options.launchIntent) assertDocumentBinding(document.launchIntent, options.launchIntent,
    "authorized start launchIntent");
  assertRunnerBinding(document.runner, plan?.runner || null,
    options.environmentPreflight?.physicalBindings?.runnerExecutable || null,
    "authorized start runner");
  assertPhysicalFileEvidence(document.runnerPhysical, document.runner.executable,
    "authorized start runnerPhysical", {executable: true});
  invariant(document.runner.physicalIdentitySha256 === physicalIdentitySha256(document.runnerPhysical),
    "authorized start runner physical binding drifted");
  assertReadinessBindings(document.readiness, options);
  validateContentDescriptor(document.authorizationConsumption, {label: "authorized start authorizationConsumption"});
  if (options.authorizationConsumptionDescriptor) validateContentDescriptor(document.authorizationConsumption, {
    label: "authorized start authorizationConsumption", expected: options.authorizationConsumptionDescriptor,
  });
  if (options.authorizationConsumption) {
    assertDocumentBinding(document.authorizationConsumption, options.authorizationConsumption,
      "authorized start authorizationConsumption");
    invariant(options.authorizationConsumption.sessionId === document.sessionId
      && options.authorizationConsumption.runtimeLaunched === true,
      "authorization consumption does not contain the atomic started transition");
  }
  assertRuntime(document.runtime, {plan});
  validateContentDescriptor(document.sandbox, {label: "authorized start sandbox"});
  assertExactKeys(document.profile, ["manifest", "rootPhysical", "initialTreeSetSha256"],
    "authorized start profile");
  validateContentDescriptor(document.profile.manifest, {label: "authorized start profile.manifest"});
  assertPhysicalDirectoryEvidence(document.profile.rootPhysical, "authorized start profile.rootPhysical");
  assertSha256(document.profile.initialTreeSetSha256, "authorized start profile.initialTreeSetSha256");
  assertExactKeys(document.outputRoot, [
    "absolutePath", "realPath", "device", "inode", "mode", "mountId", "nlink", "directory",
    "symlinkFree", "observedAt",
  ],
    "authorized start outputRoot");
  invariant(path.isAbsolute(document.outputRoot.absolutePath)
    && document.outputRoot.realPath === document.outputRoot.absolutePath,
  "authorized start outputRoot must be absolute and real");
  invariant(/^[1-9][0-9]*$/u.test(document.outputRoot.device || "")
    && /^[1-9][0-9]*$/u.test(document.outputRoot.inode || "")
    && document.outputRoot.mode === "0700"
    && Number.isSafeInteger(document.outputRoot.nlink) && document.outputRoot.nlink >= 1
    && document.outputRoot.directory === true && document.outputRoot.symlinkFree === true,
  "authorized start outputRoot physical identity drifted");
  assertNonempty(document.outputRoot.mountId, "authorized start outputRoot.mountId");
  assertCanonicalTimestamp(document.outputRoot.observedAt, "authorized start outputRoot.observedAt");
  if (plan) invariant(document.outputRoot.absolutePath === plan.plannedSessionOutputRoot,
    "authorized start outputRoot differs from the plan");
  assertExactKeys(document.observers, [
    "network", "requests", "process", "windows", "effects", "audio", "gui",
  ],
    "authorized start observers");
  for (const [key, observer] of Object.entries(document.observers)) {
    const keys = ["readyReceipt", "sessionReceiptPath", "ready"];
    if (key === "gui") keys.push(
      "observerId", "publicKeySpkiBase64", "publicKeySha256", "sourceOpenEventPath",
    );
    assertExactKeys(observer, keys, `authorized start observers.${key}`);
    validateContentDescriptor(observer.readyReceipt,
      {label: `authorized start observers.${key}.readyReceipt`});
    assertPortableOrAbsoluteFile(observer.sessionReceiptPath,
      `authorized start observers.${key}.sessionReceiptPath`);
    invariant(observer.ready === true, `authorized start observer ${key} is not ready`);
    if (key === "gui") {
      const keyDescriptor = publicKeyFromCanonicalSpkiBase64(observer.publicKeySpkiBase64,
        "authorized start GUI observer key");
      invariant(observer.publicKeySha256 === keyDescriptor.sha256,
        "authorized start GUI observer key identity drifted");
    }
  }
  for (const key of ["transitionReceipt", "statefulFilesystemVerifierReceipt"]) {
    validateContentDescriptor(document[key], {label: `authorized start ${key}`});
  }
  if (options.authorizationConsumption) {
    validateContentDescriptor(document.transitionReceipt, {
      label: "authorized start transitionReceipt",
      expected: options.authorizationConsumption.transition.receipt,
    });
    validateContentDescriptor(document.statefulFilesystemVerifierReceipt, {
      label: "authorized start statefulFilesystemVerifierReceipt",
      expected: options.authorizationConsumption.statefulFilesystemVerifier.verificationReceipt,
    });
    assertSame(document.runnerProcess, options.authorizationConsumption.runnerProcess,
      "authorized start runnerProcess/consumption binding");
    assertSame(document.projectorProcess, options.authorizationConsumption.projectorProcess,
      "authorized start projectorProcess/consumption binding");
    invariant(document.startInstanceId === options.authorizationConsumption.transition.startInstanceId,
      "authorized start startInstanceId/transition binding drifted");
  }
  invariant(SESSION_ID.test(document.startInstanceId || ""),
    "authorized start startInstanceId must be one canonical UUID");
  assertSha256(document.startIdentitySha256, "authorized start startIdentitySha256");
  if (options.authorizationConsumption) invariant(
    document.startIdentitySha256 === options.authorizationConsumption.startIdentitySha256,
    "one authorization consumption does not bind this exact projector start",
  );
  const startedAt = assertCanonicalTimestamp(document.startedAt, "authorized start startedAt");
  invariant(document.projectorProcess.startedAt === document.startedAt,
    "authorized start projector process startedAt drifted");
  if (options.authorizationConsumption) {
    invariant(startedAt === Date.parse(options.authorizationConsumption.consumedAt)
      && document.projectorProcess.pid === options.authorizationConsumption.projectorProcess.pid
      && document.projectorProcess.processStartTokenSha256
        === options.authorizationConsumption.projectorProcess.processStartTokenSha256,
    "projector start differs from the exact atomic consumption process instance");
  }
  if (options.authorization) {
    assertDocumentBinding(document.readiness.authorization, options.authorization,
      "authorized start readiness.authorization");
    invariant(options.authorization.session.sessionId === document.sessionId,
      "authorized start session differs from the authorization");
    invariant(startedAt >= Date.parse(options.authorization.session.notBefore)
      && startedAt <= Date.parse(options.authorization.session.expiresAt),
    "projector start occurred outside authorization validity");
  }
  for (const [key, receipt, descriptor] of [
    ["environment", options.environmentPreflight, document.readiness.environment],
    ["outputRoot", options.outputRootPreflight, document.readiness.outputRoot],
    ["capacity", options.capacityPreflight, document.readiness.capacity],
  ]) {
    if (!receipt) continue;
    assertDocumentBinding(descriptor, receipt, `authorized start readiness.${key}`);
    invariant(receipt.sessionId === document.sessionId,
      `authorized start ${key} preflight session drifted`);
    const validUntil = Date.parse(receipt.validUntil);
    const checkedAt = Date.parse(receipt.checkedAt ?? receipt.measuredAt);
    invariant(startedAt >= checkedAt && startedAt <= validUntil,
      `authorized start occurred outside ${key} preflight validity`);
  }
  if (options.environmentPreflight) {
    invariant(options.environmentPreflight.allApprovedAndVerified === true,
      "authorized start environment was not approved and verified");
    validateContentDescriptor(document.sandbox, {
      label: "authorized start sandbox",
      expected: options.environmentPreflight.sandbox.policy,
    });
    validateContentDescriptor(document.profile.manifest, {
      label: "authorized start profile.manifest",
      expected: options.environmentPreflight.profile.manifest,
    });
    assertSame(document.observers, options.environmentPreflight.observers,
      "authorized start observers/environment binding");
    assertSame(document.profile, {
      manifest: options.environmentPreflight.profile.manifest,
      rootPhysical: options.environmentPreflight.profile.sessionRoot,
      initialTreeSetSha256: options.environmentPreflight.profile.initialTreeSetSha256,
    }, "authorized start profile/environment binding");
  }
  if (options.outputRootPreflight) assertSame(document.outputRoot, options.outputRootPreflight.root,
    "authorized start output-root physical binding");
  invariant(document.argvSwf === null, "Projector must start without a SWF argument");
  assertAllFalseAuthorityBoundary(document.authorityBoundary);
  assertReceiptSelfHash(document, "authorized projector start");
  return shapeOnlyResult("authorized-projector-start-v4");
}

function assertOperatorMatches(operator, expected) {
  assertOperator(operator);
  if (expected) assertSame(operator, expected, "named-operator binding");
}

function assertDetachedEd25519Signature(signature, expectedPublicKeySha256, label) {
  assertExactKeys(signature, ["algorithm", "publicKeySha256", "signatureBase64"], label);
  invariant(signature.algorithm === "Ed25519"
    && signature.publicKeySha256 === expectedPublicKeySha256,
  `${label} algorithm/public-key identity drifted`);
  invariant(typeof signature.signatureBase64 === "string"
    && /^(?:[A-Za-z0-9+/]{4}){21}[A-Za-z0-9+/]{2}==$/u.test(signature.signatureBase64),
  `${label} is not canonical padded base64 for 64 bytes`);
  const bytes = Buffer.from(signature.signatureBase64, "base64");
  invariant(bytes.length === 64 && bytes.toString("base64") === signature.signatureBase64,
    `${label} does not decode canonically to 64 bytes`);
  return bytes;
}

export function guiObserverEventSigningBytes(payload) {
  invariant(isPlainObject(payload), "GUI observer event payload must be an object");
  return Buffer.from(canonicalJson(payload), "utf8");
}

export function operatorProjectorExitSigningBytes(payload) {
  invariant(isPlainObject(payload), "projector-exit operator payload must be an object");
  return Buffer.from(canonicalJson(payload), "utf8");
}

function operatorSourceOpenPayload(document) {
  return {
    schemaVersion: 4,
    protocol: SOURCE_OPEN_OPERATOR_SIGNING_PROTOCOL,
    sessionId: document.sessionId,
    animationId: document.animationId,
    requirementId: document.requirementId,
    operatorIdentitySha256: document.operator.identitySha256,
    preLaunchAdmissionBindingSha256: document.preLaunchAdmissionBindingSha256,
    startInstanceId: document.projectorStart.startInstanceId,
    startIdentitySha256: document.projectorStart.startIdentitySha256,
    processId: document.projectorStart.processId,
    processStartTokenSha256: document.projectorStart.processStartTokenSha256,
    sourceOpen: document.sourceOpen,
    guiObserverEvent: document.guiObserverEvent.descriptor,
    captureStartMarker: document.captureStartMarker.descriptor,
    firstFrameMarker: document.firstFrameMarker.descriptor,
    operatorSignedAt: document.operatorProof.signedAt,
    statement: document.statement,
  };
}

export function operatorSourceOpenSigningBytes(document) {
  return Buffer.from(canonicalJson(operatorSourceOpenPayload(document)), "utf8");
}

export function validateSourceOpenStartReceiptV4ShapeOnly(document, options = {}) {
  assertExactKeys(document, [
    "schemaVersion", "evidenceType", "sessionId", "animationId", "requirementId", "captureKit",
    "kitCheck", "sessionPlan", "runtime", "readiness", "preLaunchAdmissionBindingSha256",
    "launchIntent", "authorizationConsumption", "authorizedProjectorStart", "launchProtocol",
    "projectorStart", "sourceOpen", "guiObserverEvent", "captureStartMarker", "firstFrameMarker",
    "operator", "operatorProof", "finalizedAt", "authorityBoundary", "statement", "receiptSha256",
  ], "source-open start receipt");
  const plan = assertPlanBinding(document.sessionPlan, options);
  assertReceiptIdentity(document, "named-human-hash-bound-root-source-open-start-receipt-v4", plan);
  invariant(!plan || (document.animationId === plan.animationId && document.requirementId === plan.requirementId),
    "source-open identity differs from the session plan");
  validateContentDescriptor(document.captureKit, {label: "source-open captureKit"});
  validateContentDescriptor(document.kitCheck, {label: "source-open kitCheck"});
  if (plan) {
    validateContentDescriptor(document.captureKit, {label: "source-open captureKit", expected: plan.captureKit});
    validateContentDescriptor(document.kitCheck, {label: "source-open kitCheck", expected: plan.kitCheck});
  }
  assertRuntime(document.runtime, {plan});
  assertReadinessBindings(document.readiness, options);
  assertSha256(document.preLaunchAdmissionBindingSha256,
    "source-open preLaunchAdmissionBindingSha256");
  if (options.preLaunchAdmissionBindingSha256) invariant(
    document.preLaunchAdmissionBindingSha256 === options.preLaunchAdmissionBindingSha256,
    "source-open pre-launch admission binding drifted",
  );
  validateContentDescriptor(document.launchIntent, {label: "source-open launchIntent"});
  if (options.launchIntent) assertDocumentBinding(document.launchIntent, options.launchIntent,
    "source-open launchIntent");
  for (const [key, receipt] of [
    ["authorizationConsumption", options.authorizationConsumption],
    ["authorizedProjectorStart", options.authorizedProjectorStart],
  ]) {
    validateContentDescriptor(document[key], {label: `source-open ${key}`});
    const explicitDescriptor = options[`${key}Descriptor`];
    if (explicitDescriptor) validateContentDescriptor(document[key], {
      label: `source-open ${key}`, expected: explicitDescriptor,
    });
    if (receipt) assertDocumentBinding(document[key], receipt, `source-open ${key}`);
  }
  invariant(document.launchProtocol === LAUNCH_PROTOCOL, "source-open launchProtocol drifted");
  assertExactKeys(document.projectorStart, [
    "startInstanceId", "startIdentitySha256", "executablePath", "swfArgument", "processId",
    "processStartTokenSha256", "runnerProcessId", "runnerProcessStartTokenSha256", "startedAt",
  ], "source-open projectorStart");
  invariant(SESSION_ID.test(document.projectorStart.startInstanceId || ""),
    "source-open projectorStart startInstanceId is invalid");
  assertSha256(document.projectorStart.startIdentitySha256,
    "source-open projectorStart.startIdentitySha256");
  assertSha256(document.projectorStart.processStartTokenSha256,
    "source-open projectorStart.processStartTokenSha256");
  assertSha256(document.projectorStart.runnerProcessStartTokenSha256,
    "source-open projectorStart.runnerProcessStartTokenSha256");
  invariant(document.projectorStart.executablePath === document.runtime.executable.file
    && document.projectorStart.swfArgument === null
    && Number.isInteger(document.projectorStart.processId) && document.projectorStart.processId > 0
    && Number.isInteger(document.projectorStart.runnerProcessId)
    && document.projectorStart.runnerProcessId > 0,
  "source-open empty-Projector start identity drifted");
  if (options.authorizedProjectorStart) {
    invariant(options.authorizedProjectorStart.sessionId === document.sessionId
      && document.projectorStart.startInstanceId === options.authorizedProjectorStart.startInstanceId
      && document.projectorStart.startIdentitySha256 === options.authorizedProjectorStart.startIdentitySha256
      && document.projectorStart.processId === options.authorizedProjectorStart.projectorProcess.pid
      && document.projectorStart.processStartTokenSha256
        === options.authorizedProjectorStart.projectorProcess.processStartTokenSha256
      && document.projectorStart.runnerProcessId === options.authorizedProjectorStart.runnerProcess.pid
      && document.projectorStart.runnerProcessStartTokenSha256
        === options.authorizedProjectorStart.runnerProcess.processStartTokenSha256
      && document.projectorStart.startedAt === options.authorizedProjectorStart.startedAt,
    "source-open projectorStart differs from the authorized start receipt");
  }
  assertExactKeys(document.sourceOpen, [
    "actionId", "method", "menuPath", "selectedSource", "openedAt", "playerWindowObserved",
  ], "sourceOpen");
  invariant(document.sourceOpen.actionId === "projector.file-open-exact-staged-source"
    && HUMAN_ONLY_OPERATION_IDS.includes(document.sourceOpen.actionId)
    && document.sourceOpen.method === SOURCE_OPEN_METHOD
    && same(document.sourceOpen.menuPath, SOURCE_OPEN_MENU_PATH)
    && (!plan || document.sourceOpen.selectedSource === plan.stagedSource.file)
    && document.sourceOpen.playerWindowObserved === true,
  "named-human source-open contract drifted");
  assertOperatorMatches(document.operator, options.authorization?.operator);
  assertExactKeys(document.guiObserverEvent, ["descriptor", "payload", "signature"],
    "source-open guiObserverEvent");
  validateContentDescriptor(document.guiObserverEvent.descriptor,
    {label: "source-open guiObserverEvent.descriptor"});
  assertExactKeys(document.guiObserverEvent.payload, [
    "schemaVersion", "protocol", "observerId", "sessionId", "startInstanceId", "processId",
    "processStartTokenSha256", "operatorIdentitySha256", "actionId", "menuPath",
    "selectedSource", "observedAt", "eventSequence",
  ], "source-open GUI observer payload");
  const guiPayload = document.guiObserverEvent.payload;
  invariant(guiPayload.schemaVersion === 4 && guiPayload.protocol === GUI_OBSERVER_EVENT_PROTOCOL
    && guiPayload.sessionId === document.sessionId
    && guiPayload.startInstanceId === document.projectorStart.startInstanceId
    && guiPayload.processId === document.projectorStart.processId
    && guiPayload.processStartTokenSha256 === document.projectorStart.processStartTokenSha256
    && guiPayload.operatorIdentitySha256 === document.operator.identitySha256
    && guiPayload.actionId === document.sourceOpen.actionId
    && same(guiPayload.menuPath, document.sourceOpen.menuPath)
    && guiPayload.selectedSource === document.sourceOpen.selectedSource
    && guiPayload.observedAt === document.sourceOpen.openedAt
    && guiPayload.eventSequence === 1,
  "authenticated GUI observer event identity drifted");
  const guiObserver = options.environmentPreflight?.observers?.gui || null;
  if (guiObserver) {
    invariant(guiPayload.observerId === guiObserver.observerId,
      "GUI observer event observer identity drifted");
    const guiKey = publicKeyFromCanonicalSpkiBase64(guiObserver.publicKeySpkiBase64,
      "source-open GUI observer public key");
    const guiSignature = assertDetachedEd25519Signature(document.guiObserverEvent.signature,
      guiObserver.publicKeySha256, "source-open GUI observer signature");
    invariant(verifySignature(null, guiObserverEventSigningBytes(guiPayload), guiKey.key, guiSignature),
      "source-open GUI observer Ed25519 signature verification failed");
    validateContentDescriptor(document.guiObserverEvent.descriptor, {
      label: "source-open GUI observer event canonical descriptor",
      expected: contentDescriptor(document.guiObserverEvent.descriptor.file, canonicalJson({
        payload: guiPayload,
        signature: document.guiObserverEvent.signature,
      })),
    });
    invariant(document.guiObserverEvent.descriptor.file === guiObserver.sourceOpenEventPath,
      "source-open GUI observer event path differs from the preflight-bound event path");
  }
  const validateMarker = (marker, markerType, expectedSequence, label) => {
    assertExactKeys(marker, ["descriptor", "payload"], label);
    validateContentDescriptor(marker.descriptor, {label: `${label}.descriptor`});
    assertExactKeys(marker.payload, [
      "schemaVersion", "protocol", "markerType", "sessionId", "startInstanceId", "processId",
      "processStartTokenSha256", "operatorIdentitySha256", "markedAt", "sequence",
    ], `${label}.payload`);
    invariant(marker.payload.schemaVersion === 4 && marker.payload.protocol === CAPTURE_MARKER_PROTOCOL
      && marker.payload.markerType === markerType && marker.payload.sessionId === document.sessionId
      && marker.payload.startInstanceId === document.projectorStart.startInstanceId
      && marker.payload.processId === document.projectorStart.processId
      && marker.payload.processStartTokenSha256 === document.projectorStart.processStartTokenSha256
      && marker.payload.operatorIdentitySha256 === document.operator.identitySha256
      && marker.payload.sequence === expectedSequence,
    `${label} identity drifted`);
    assertCanonicalTimestamp(marker.payload.markedAt, `${label}.markedAt`);
    validateContentDescriptor(marker.descriptor, {
      label: `${label} canonical descriptor`,
      expected: contentDescriptor(marker.descriptor.file, canonicalJson(marker.payload)),
    });
    if (plan) invariant(isContainedPath(plan.plannedSessionOutputRoot, marker.descriptor.file),
      `${label} escapes the output root`);
    return Date.parse(marker.payload.markedAt);
  };
  const captureStartAt = validateMarker(document.captureStartMarker, "capture-start", 1,
    "source-open captureStartMarker");
  const firstFrameAt = validateMarker(document.firstFrameMarker, "first-frame", 2,
    "source-open firstFrameMarker");
  assertExactKeys(document.operatorProof, ["protocol", "signedAt", "signature"],
    "source-open operatorProof");
  invariant(document.operatorProof.protocol === SOURCE_OPEN_OPERATOR_SIGNING_PROTOCOL,
    "source-open operator proof protocol drifted");
  const operatorSignedAt = assertCanonicalTimestamp(document.operatorProof.signedAt,
    "source-open operatorProof.signedAt");
  const operatorKey = publicKeyFromCanonicalSpkiBase64(document.operator.publicKeySpkiBase64,
    "source-open named operator public key");
  const operatorSignature = assertDetachedEd25519Signature(document.operatorProof.signature,
    document.operator.publicKeySha256, "source-open named operator signature");
  invariant(verifySignature(null, operatorSourceOpenSigningBytes(document), operatorKey.key,
    operatorSignature), "source-open named operator Ed25519 signature verification failed");
  const startedAt = assertCanonicalTimestamp(document.projectorStart.startedAt, "source-open projectorStart.startedAt");
  const openedAt = assertCanonicalTimestamp(document.sourceOpen.openedAt, "sourceOpen.openedAt");
  const finalizedAt = assertCanonicalTimestamp(document.finalizedAt, "source-open finalizedAt");
  invariant(startedAt <= openedAt && openedAt <= captureStartAt && captureStartAt <= firstFrameAt
    && firstFrameAt <= operatorSignedAt && operatorSignedAt <= finalizedAt,
  "source-open chronology must satisfy start <= open <= capture-start <= first-frame <= sign <= finalized");
  if (options.authorization) {
    invariant(options.authorization.session.sessionId === document.sessionId,
      "source-open session differs from the authorization");
    invariant(finalizedAt <= Date.parse(options.authorization.session.expiresAt),
      "source-open receipt was finalized after authorization expiry");
  }
  if (options.authorizationConsumption) invariant(
    options.authorizationConsumption.sessionId === document.sessionId,
    "source-open session differs from authorization consumption",
  );
  invariant(document.statement === SOURCE_OPEN_STATEMENT, "source-open statement drifted");
  assertAllFalseAuthorityBoundary(document.authorityBoundary);
  invariant(document.receiptSha256 === sourceOpenStartReceiptSha256(document),
    "source-open start receipt self-hash drifted");
  return shapeOnlyResult("source-open-start-receipt-v4");
}

function assertZeroInteger(value, label) {
  invariant(Number.isSafeInteger(value) && value === 0, `${label} must be exactly zero`);
}

export function sessionOutputEntrySetSha256(entries) {
  invariant(Array.isArray(entries), "session output entries must be an array");
  return sha256Text(canonicalJson(entries));
}

export function sessionOutputManifestBytes(manifest) {
  invariant(isPlainObject(manifest), "session output manifest must be an object");
  return Buffer.from(canonicalJson({
    schemaVersion: 4,
    manifestType: "g4-l10-exact-session-output-manifest-v4",
    outputRootRealPath: manifest.outputRootRealPath,
    selfRelativePath: manifest.selfRelativePath,
    selfExcludedFromEntries: manifest.selfExcludedFromEntries,
    directories: manifest.directories,
    directoryPhysicalEntries: manifest.directoryPhysicalEntries,
    directoryCount: manifest.directoryCount,
    entries: manifest.entries,
    entryCount: manifest.entryCount,
    rootFileCount: manifest.rootFileCount,
    rootPathSetSha256: manifest.rootPathSetSha256,
    rootEntryCount: manifest.rootEntryCount,
    rootEntrySetSha256: manifest.rootEntrySetSha256,
    specialEntryCount: manifest.specialEntryCount,
    symlinkEntryCount: manifest.symlinkEntryCount,
    rootEnumerationComplete: manifest.rootEnumerationComplete,
    totalBytes: manifest.totalBytes,
    entrySetSha256: manifest.entrySetSha256,
    unexpectedFileCount: manifest.unexpectedFileCount,
    complete: manifest.complete,
  }), "utf8");
}

export function profileDiscardReceiptBytes(disposition) {
  invariant(isPlainObject(disposition), "profile discard disposition must be an object");
  return Buffer.from(canonicalJson({
    schemaVersion: 4,
    receiptType: "g4-l10-profile-discard-v4",
    profileManifest: disposition.profileManifest,
    profileRootPhysicalIdentitySha256: physicalIdentitySha256(disposition.profileRootPhysical),
    preDiscardProfileRootPhysicalIdentitySha256: physicalIdentitySha256(
      disposition.preDiscardProfileRootPhysical,
    ),
    initialTreeSetSha256: disposition.initialTreeSetSha256,
    postDiscardTreeEntryCount: disposition.postDiscardTreeEntryCount,
    postDiscardTreeSetSha256: disposition.postDiscardTreeSetSha256,
    discardedAt: disposition.discardedAt,
  }), "utf8");
}

export function guiObserverSessionReceiptBytes({sourceOpenEvent, projectorExitEvent}) {
  invariant(isPlainObject(sourceOpenEvent) && isPlainObject(projectorExitEvent),
    "GUI observer session receipt inputs must be objects");
  return Buffer.from(canonicalJson({
    schemaVersion: 4,
    receiptType: "g4-l10-authenticated-gui-observer-session-v4",
    sourceOpenEvent,
    projectorExitEvent,
  }), "utf8");
}

export function processObserverSessionReceiptBytes(processAudit) {
  invariant(isPlainObject(processAudit), "process observer session receipt input must be an object");
  return Buffer.from(canonicalJson({
    schemaVersion: 4,
    receiptType: "g4-l10-exact-one-projector-start-process-observer-session-v4",
    runnerProcess: processAudit.runnerProcess,
    projectorProcess: processAudit.projectorProcess,
    startInstanceId: processAudit.startInstanceId,
    startIdentitySha256: processAudit.startIdentitySha256,
    runnerStartEventCount: processAudit.runnerStartEventCount,
    projectorStartEventCount: processAudit.projectorStartEventCount,
    matchingProjectorStartEventCount: processAudit.matchingProjectorStartEventCount,
    duplicateProjectorStartEventCount: processAudit.duplicateProjectorStartEventCount,
    unexpectedRuntimeStartEventCount: processAudit.unexpectedRuntimeStartEventCount,
    projectorExitEventCount: processAudit.projectorExitEventCount,
    exitEvent: processAudit.exitEvent,
    passed: processAudit.passed,
  }), "utf8");
}

function validateProjectorExitTerminationEvidence(projectorExit, document, options) {
  const evidence = projectorExit.terminationEvidence;
  invariant(isPlainObject(evidence), "projectorExit.terminationEvidence must be an object");
  if (projectorExit.terminationMethod === "named-operator-projector-exit") {
    assertExactKeys(evidence, [
      "type", "operator", "payload", "operatorSignature", "guiObserverEvent",
    ], "projectorExit named-human terminationEvidence");
    invariant(evidence.type === "named-human-projector-exit-v4",
      "projectorExit named-human termination evidence type drifted");
    assertOperatorMatches(evidence.operator, options.authorization?.operator);
    assertExactKeys(evidence.payload, [
      "schemaVersion", "protocol", "actionId", "method", "sessionId", "startInstanceId",
      "processId", "processStartTokenSha256", "operatorIdentitySha256", "requestedAt",
    ], "projectorExit named-human payload");
    const payload = evidence.payload;
    invariant(payload.schemaVersion === 4
      && payload.protocol === PROJECTOR_EXIT_OPERATOR_SIGNING_PROTOCOL
      && payload.actionId === "projector.exit"
      && HUMAN_ONLY_OPERATION_IDS.includes(payload.actionId)
      && payload.method === "projector-window-close-control"
      && payload.sessionId === document.sessionId
      && payload.startInstanceId === projectorExit.startInstanceId
      && payload.processId === projectorExit.processId
      && payload.processStartTokenSha256 === projectorExit.processStartTokenSha256
      && payload.operatorIdentitySha256 === evidence.operator.identitySha256
      && payload.requestedAt === projectorExit.requestedAt,
    "projectorExit named-human payload identity drifted");
    const operatorKey = publicKeyFromCanonicalSpkiBase64(evidence.operator.publicKeySpkiBase64,
      "projectorExit named operator public key");
    const operatorSignature = assertDetachedEd25519Signature(evidence.operatorSignature,
      evidence.operator.publicKeySha256, "projectorExit named operator signature");
    invariant(verifySignature(null, operatorProjectorExitSigningBytes(payload),
      operatorKey.key, operatorSignature),
    "projectorExit named operator Ed25519 signature verification failed");

    assertExactKeys(evidence.guiObserverEvent, ["payload", "signature"],
      "projectorExit GUI observer event");
    const guiPayload = evidence.guiObserverEvent.payload;
    assertExactKeys(guiPayload, [
      "schemaVersion", "protocol", "observerId", "eventType", "actionId", "sessionId",
      "startInstanceId", "processId", "processStartTokenSha256", "operatorIdentitySha256",
      "observedAt", "eventSequence",
    ], "projectorExit GUI observer payload");
    invariant(guiPayload.schemaVersion === 4 && guiPayload.protocol === GUI_OBSERVER_EVENT_PROTOCOL
      && guiPayload.eventType === "projector-exit-request"
      && guiPayload.actionId === payload.actionId
      && guiPayload.sessionId === payload.sessionId
      && guiPayload.startInstanceId === payload.startInstanceId
      && guiPayload.processId === payload.processId
      && guiPayload.processStartTokenSha256 === payload.processStartTokenSha256
      && guiPayload.operatorIdentitySha256 === payload.operatorIdentitySha256
      && guiPayload.observedAt === payload.requestedAt
      && guiPayload.eventSequence === 2,
    "projectorExit authenticated GUI observer payload drifted");
    const guiObserver = options.environmentPreflight?.observers?.gui || null;
    if (guiObserver) {
      invariant(guiPayload.observerId === guiObserver.observerId,
        "projectorExit GUI observer identity drifted");
      const guiKey = publicKeyFromCanonicalSpkiBase64(guiObserver.publicKeySpkiBase64,
        "projectorExit GUI observer public key");
      const guiSignature = assertDetachedEd25519Signature(evidence.guiObserverEvent.signature,
        guiObserver.publicKeySha256, "projectorExit GUI observer signature");
      invariant(verifySignature(null, guiObserverEventSigningBytes(guiPayload), guiKey.key,
        guiSignature), "projectorExit GUI observer Ed25519 signature verification failed");
    }
    if (options.sourceOpenStartReceipt) {
      invariant(evidence.operator.identitySha256
        === options.sourceOpenStartReceipt.operator.identitySha256
        && guiPayload.eventSequence
          === options.sourceOpenStartReceipt.guiObserverEvent.payload.eventSequence + 1
        && Date.parse(guiPayload.observedAt)
          >= Date.parse(options.sourceOpenStartReceipt.finalizedAt),
      "projectorExit named-human proof does not continue the source-open operator/GUI sequence");
    }
    return evidence;
  }
  assertExactKeys(evidence, [
    "type", "triggeredStopConditionId", "triggerObserverRole", "triggerObserverReceipt",
  ],
    "projectorExit supervisor terminationEvidence");
  const expectedRole = STOP_CONDITION_OBSERVER_ROLE[evidence.triggeredStopConditionId];
  invariant(evidence.type === "supervisor-stop-condition-v4"
    && REQUIRED_STOP_CONDITIONS.includes(evidence.triggeredStopConditionId)
    && evidence.triggerObserverRole === expectedRole,
  "projectorExit supervisor evidence lacks one exact fixed stop-condition/observer-role mapping");
  validateContentDescriptor(evidence.triggerObserverReceipt,
    {label: "projectorExit supervisor triggerObserverReceipt"});
  const roleDescriptors = {
    network: document.requestAudit?.networkObserverReceipt,
    requests: document.requestAudit?.requestObserverReceipt,
    process: document.processAudit?.processObserverReceipt,
    windows: document.effectAudit?.windowObserverReceipt,
    effects: document.effectAudit?.effectObserverReceipt,
    gui: document.guiAudit?.guiObserverReceipt,
  };
  invariant(roleDescriptors[expectedRole],
    "projectorExit supervisor mapped observer receipt is missing");
  validateContentDescriptor(evidence.triggerObserverReceipt, {
    label: "projectorExit supervisor exact mapped observer receipt",
    expected: roleDescriptors[expectedRole],
  });
  if (options.environmentPreflight) invariant(
    evidence.triggerObserverReceipt.file
      === options.environmentPreflight.observers[expectedRole].sessionReceiptPath,
    "projectorExit supervisor trigger receipt path differs from its preflight observer role",
  );
  return evidence;
}

export function validateContainmentPostflightShapeOnly(document, options = {}) {
  assertExactKeys(document, [
    "schemaVersion", "evidenceType", "sessionId", "sessionPlan", "preLaunchAdmissionBindingSha256",
    "launchIntent", "authorizationConsumption", "authorizedProjectorStart",
    "sourceOpenStartReceipt", "completedAt", "outputRootFinalPhysical", "projectorExit",
    "processAudit", "requestAudit", "effectAudit", "guiAudit",
    "sharedObjectDisposition", "sessionOutputManifest", "rehash", "authorityBoundary", "receiptSha256",
  ], "containment postflight");
  const plan = assertPlanBinding(document.sessionPlan, options);
  assertReceiptIdentity(document, "g4-l10-root-capture-containment-postflight-v4", plan);
  assertSha256(document.preLaunchAdmissionBindingSha256,
    "postflight preLaunchAdmissionBindingSha256");
  if (options.preLaunchAdmissionBindingSha256) invariant(
    document.preLaunchAdmissionBindingSha256 === options.preLaunchAdmissionBindingSha256,
    "postflight pre-launch admission binding drifted",
  );
  for (const [key, optionKey] of [
    ["launchIntent", "launchIntent"],
    ["authorizationConsumption", "authorizationConsumption"],
    ["authorizedProjectorStart", "authorizedProjectorStart"],
    ["sourceOpenStartReceipt", "sourceOpenStartReceipt"],
  ]) {
    validateContentDescriptor(document[key], {label: `postflight ${key}`});
    const descriptor = options[`${optionKey}Descriptor`];
    if (descriptor) validateContentDescriptor(document[key], {
      label: `postflight ${key}`, expected: descriptor,
    });
    if (options[optionKey]) assertDocumentBinding(document[key], options[optionKey], `postflight ${key}`);
  }
  const completedAt = assertCanonicalTimestamp(document.completedAt, "postflight completedAt");
  assertPhysicalDirectoryEvidence(document.outputRootFinalPhysical,
    "postflight outputRootFinalPhysical", {observedAt: document.completedAt});
  if (options.outputRootPreflight) assertSameStablePhysicalIdentity(
    document.outputRootFinalPhysical,
    options.outputRootPreflight.root,
    "postflight final output-root physical identity",
  );
  if (options.authorizedProjectorStart) assertSameStablePhysicalIdentity(
    document.outputRootFinalPhysical,
    options.authorizedProjectorStart.outputRoot,
    "postflight final output-root/authorized-start physical identity",
  );
  assertExactKeys(document.projectorExit, [
    "startInstanceId", "processId", "processStartTokenSha256", "requestedAt", "exitedAt",
    "terminationMethod", "terminationEvidence", "exitCode", "signal", "processObserverReceipt",
    "descendantProcessCountAtStart", "remainingDescendantProcessCount", "unexpectedChildProcessCount",
    "exitObserved", "remainingMatchingProcessCount",
  ], "postflight projectorExit");
  invariant(SESSION_ID.test(document.projectorExit.startInstanceId || "")
    && Number.isInteger(document.projectorExit.processId) && document.projectorExit.processId > 0,
  "postflight projector process/start-instance identity is invalid");
  assertSha256(document.projectorExit.processStartTokenSha256,
    "postflight projectorExit.processStartTokenSha256");
  assertNonempty(document.projectorExit.terminationMethod, "projectorExit.terminationMethod");
  invariant((document.projectorExit.exitCode === null || Number.isInteger(document.projectorExit.exitCode))
    && (document.projectorExit.signal === null || typeof document.projectorExit.signal === "string")
    && !(document.projectorExit.exitCode === null && document.projectorExit.signal === null)
    && ["named-operator-projector-exit", "supervisor-stop-condition-termination"]
      .includes(document.projectorExit.terminationMethod),
  "projector exit status is invalid");
  validateProjectorExitTerminationEvidence(document.projectorExit, document, options);
  validateContentDescriptor(document.projectorExit.processObserverReceipt,
    {label: "projectorExit.processObserverReceipt"});
  const requestedAt = assertCanonicalTimestamp(document.projectorExit.requestedAt, "projectorExit.requestedAt");
  const exitedAt = assertCanonicalTimestamp(document.projectorExit.exitedAt, "projectorExit.exitedAt");
  invariant(document.projectorExit.exitObserved === true
    && document.projectorExit.remainingMatchingProcessCount === 0
    && document.projectorExit.remainingDescendantProcessCount === 0
    && document.projectorExit.unexpectedChildProcessCount === 0
    && document.projectorExit.descendantProcessCountAtStart === 0
    && requestedAt <= exitedAt && exitedAt <= completedAt,
  "projector exit chronology/disposition drifted");
  if (options.sourceOpenStartReceipt) {
    invariant(options.sourceOpenStartReceipt.sessionId === document.sessionId,
      "postflight session differs from source-open receipt");
    invariant(document.projectorExit.startInstanceId
      === options.sourceOpenStartReceipt.projectorStart.startInstanceId
      && document.projectorExit.processId === options.sourceOpenStartReceipt.projectorStart.processId
      && document.projectorExit.processStartTokenSha256
        === options.sourceOpenStartReceipt.projectorStart.processStartTokenSha256,
    "postflight projector process differs from source-open receipt");
    invariant(requestedAt >= Date.parse(options.sourceOpenStartReceipt.finalizedAt),
      "postflight projector exit preceded source-open finalization");
  }
  assertExactKeys(document.processAudit, [
    "processObserverReceipt", "runnerProcess", "projectorProcess", "startInstanceId",
    "startIdentitySha256", "runnerStartEventCount", "projectorStartEventCount",
    "matchingProjectorStartEventCount", "duplicateProjectorStartEventCount",
    "unexpectedRuntimeStartEventCount", "projectorExitEventCount", "exitEvent", "passed",
  ], "postflight processAudit");
  validateContentDescriptor(document.processAudit.processObserverReceipt,
    {label: "postflight processAudit.processObserverReceipt"});
  assertSha256(document.processAudit.startIdentitySha256,
    "postflight processAudit.startIdentitySha256");
  invariant(document.processAudit.runnerStartEventCount === 1
    && document.processAudit.projectorStartEventCount === 1
    && document.processAudit.matchingProjectorStartEventCount === 1
    && document.processAudit.duplicateProjectorStartEventCount === 0
    && document.processAudit.unexpectedRuntimeStartEventCount === 0
    && document.processAudit.projectorExitEventCount === 1
    && document.processAudit.passed === true,
  "postflight process observer did not prove exactly one runner/projector start and one exit");
  assertExactKeys(document.processAudit.exitEvent, [
    "processId", "processStartTokenSha256", "requestedAt", "exitedAt", "exitCode", "signal",
  ], "postflight processAudit.exitEvent");
  assertSame(document.processAudit.exitEvent, {
    processId: document.projectorExit.processId,
    processStartTokenSha256: document.projectorExit.processStartTokenSha256,
    requestedAt: document.projectorExit.requestedAt,
    exitedAt: document.projectorExit.exitedAt,
    exitCode: document.projectorExit.exitCode,
    signal: document.projectorExit.signal,
  }, "postflight process observer exit-event/projector-exit binding");
  validateContentDescriptor(document.processAudit.processObserverReceipt, {
    label: "postflight canonical exact-one-start process observer receipt",
    expected: contentDescriptor(document.processAudit.processObserverReceipt.file,
      processObserverSessionReceiptBytes(document.processAudit)),
  });
  validateContentDescriptor(document.projectorExit.processObserverReceipt, {
    label: "postflight projector-exit/process-audit receipt binding",
    expected: document.processAudit.processObserverReceipt,
  });
  if (options.authorizationConsumption) {
    assertSame(document.processAudit.runnerProcess, options.authorizationConsumption.runnerProcess,
      "postflight process observer runner process");
    assertSame(document.processAudit.projectorProcess, options.authorizationConsumption.projectorProcess,
      "postflight process observer Projector process");
    invariant(document.processAudit.startInstanceId
      === options.authorizationConsumption.transition.startInstanceId
      && document.processAudit.startIdentitySha256
        === options.authorizationConsumption.startIdentitySha256,
    "postflight process observer start-instance/start-identity drifted");
  }
  assertExactKeys(document.requestAudit, [
    "networkObserverReceipt", "requestObserverReceipt", "unexpectedRequestCount", "successfulNetworkRequestCount",
    "legacyEndpointExecutionCount", "webSocketAttemptCount", "passed",
  ], "postflight requestAudit");
  validateContentDescriptor(document.requestAudit.networkObserverReceipt,
    {label: "requestAudit.networkObserverReceipt"});
  validateContentDescriptor(document.requestAudit.requestObserverReceipt,
    {label: "requestAudit.requestObserverReceipt"});
  for (const key of [
    "unexpectedRequestCount", "successfulNetworkRequestCount", "legacyEndpointExecutionCount",
    "webSocketAttemptCount",
  ]) assertZeroInteger(document.requestAudit[key], `requestAudit.${key}`);
  invariant(document.requestAudit.passed === true, "postflight request audit did not pass");
  assertExactKeys(document.effectAudit, [
    "windowObserverReceipt", "effectObserverReceipt", "audioObserverReceipt", "dialogs", "popups",
    "downloads", "hostCommands", "unexpectedFileWrites", "unexpectedAudioDeviceEffectCount", "passed",
  ], "postflight effectAudit");
  validateContentDescriptor(document.effectAudit.windowObserverReceipt,
    {label: "effectAudit.windowObserverReceipt"});
  validateContentDescriptor(document.effectAudit.effectObserverReceipt,
    {label: "effectAudit.effectObserverReceipt"});
  validateContentDescriptor(document.effectAudit.audioObserverReceipt,
    {label: "effectAudit.audioObserverReceipt"});
  for (const key of [
    "dialogs", "popups", "downloads", "hostCommands", "unexpectedFileWrites",
    "unexpectedAudioDeviceEffectCount",
  ]) {
    assertZeroInteger(document.effectAudit[key], `effectAudit.${key}`);
  }
  invariant(document.effectAudit.passed === true, "postflight effect audit did not pass");
  assertExactKeys(document.guiAudit, [
    "guiObserverReceipt", "authenticatedEventCount", "unexpectedGuiEventCount", "passed",
  ], "postflight guiAudit");
  validateContentDescriptor(document.guiAudit.guiObserverReceipt,
    {label: "postflight guiAudit.guiObserverReceipt"});
  const namedExit = document.projectorExit.terminationMethod === "named-operator-projector-exit";
  invariant(document.guiAudit.authenticatedEventCount === (namedExit ? 2 : 1)
    && document.guiAudit.unexpectedGuiEventCount === 0
    && document.guiAudit.passed === true,
  "postflight GUI audit event count/disposition drifted");
  if (options.environmentPreflight) invariant(
    document.guiAudit.guiObserverReceipt.file
      === options.environmentPreflight.observers.gui.sessionReceiptPath,
    "postflight GUI observer receipt path differs from the fixed preflight role mapping",
  );
  if (options.sourceOpenStartReceipt) validateContentDescriptor(
    document.guiAudit.guiObserverReceipt,
    {
      label: "postflight canonical authenticated GUI observer session receipt",
      expected: contentDescriptor(document.guiAudit.guiObserverReceipt.file,
        guiObserverSessionReceiptBytes({
          sourceOpenEvent: options.sourceOpenStartReceipt.guiObserverEvent,
          projectorExitEvent: namedExit
            ? document.projectorExit.terminationEvidence.guiObserverEvent
            : document.projectorExit.terminationEvidence,
        })),
    },
  );
  assertExactKeys(document.sharedObjectDisposition, [
    "profileManifest", "profileRootPhysical", "preDiscardProfileRootPhysical",
    "profileIdentitySha256", "initialTreeSetSha256",
    "preexistingCount", "remainingCount", "persistentSharedObjectObserved", "deletedByOperator",
    "profileDiscarded", "discardedAt", "discardReceipt", "discardReceiptPhysical",
    "postDiscardTreeEntryCount", "postDiscardTreeSetSha256", "remainingProfilePathCount", "passed",
  ], "postflight sharedObjectDisposition");
  validateContentDescriptor(document.sharedObjectDisposition.profileManifest,
    {label: "sharedObjectDisposition.profileManifest"});
  assertPhysicalDirectoryEvidence(document.sharedObjectDisposition.profileRootPhysical,
    "sharedObjectDisposition.profileRootPhysical");
  assertPhysicalDirectoryEvidence(document.sharedObjectDisposition.preDiscardProfileRootPhysical,
    "sharedObjectDisposition.preDiscardProfileRootPhysical");
  assertSha256(document.sharedObjectDisposition.profileIdentitySha256,
    "sharedObjectDisposition.profileIdentitySha256");
  assertSha256(document.sharedObjectDisposition.initialTreeSetSha256,
    "sharedObjectDisposition.initialTreeSetSha256");
  assertSha256(document.sharedObjectDisposition.postDiscardTreeSetSha256,
    "sharedObjectDisposition.postDiscardTreeSetSha256");
  assertZeroInteger(document.sharedObjectDisposition.preexistingCount, "sharedObjectDisposition.preexistingCount");
  assertZeroInteger(document.sharedObjectDisposition.remainingCount, "sharedObjectDisposition.remainingCount");
  invariant(document.sharedObjectDisposition.persistentSharedObjectObserved === false
    && document.sharedObjectDisposition.deletedByOperator === false
    && document.sharedObjectDisposition.profileDiscarded === true
    && document.sharedObjectDisposition.postDiscardTreeEntryCount === 0
    && document.sharedObjectDisposition.postDiscardTreeSetSha256 === hostTreeFileSetSha256([])
    && document.sharedObjectDisposition.remainingProfilePathCount === 0
    && document.sharedObjectDisposition.passed === true,
  "shared-object disposition drifted");
  const discardedAt = assertCanonicalTimestamp(document.sharedObjectDisposition.discardedAt,
    "sharedObjectDisposition.discardedAt");
  const preDiscardObservedAt = Date.parse(
    document.sharedObjectDisposition.preDiscardProfileRootPhysical.observedAt,
  );
  const physicalIdentityWithoutObservation = (physical) => {
    const {observedAt: omitted, ...identity} = physical;
    void omitted;
    return identity;
  };
  assertSame(
    physicalIdentityWithoutObservation(document.sharedObjectDisposition.preDiscardProfileRootPhysical),
    physicalIdentityWithoutObservation(document.sharedObjectDisposition.profileRootPhysical),
    "shared-object pre-discard/profile physical identity",
  );
  validateContentDescriptor(document.sharedObjectDisposition.discardReceipt,
    {label: "sharedObjectDisposition.discardReceipt"});
  validateContentDescriptor(document.sharedObjectDisposition.discardReceipt, {
    label: "sharedObjectDisposition canonical discardReceipt",
    expected: contentDescriptor(document.sharedObjectDisposition.discardReceipt.file,
      profileDiscardReceiptBytes(document.sharedObjectDisposition)),
  });
  assertPhysicalFileEvidence(document.sharedObjectDisposition.discardReceiptPhysical,
    document.sharedObjectDisposition.discardReceipt, "sharedObjectDisposition.discardReceiptPhysical");
  invariant(document.sharedObjectDisposition.discardReceiptPhysical.observedAt
    === document.sharedObjectDisposition.discardedAt,
  "profile discard receipt observation time drifted");
  invariant(exitedAt <= preDiscardObservedAt && preDiscardObservedAt <= discardedAt
    && discardedAt <= completedAt,
    "profile discard chronology must satisfy exitedAt <= discardedAt <= completedAt");
  if (options.environmentPreflight) {
    const observers = options.environmentPreflight.observers;
    for (const [observed, expectedPath, label] of [
      [document.projectorExit.processObserverReceipt, observers.process.sessionReceiptPath,
        "projector exit process observer"],
      [document.requestAudit.networkObserverReceipt, observers.network.sessionReceiptPath, "network observer"],
      [document.requestAudit.requestObserverReceipt, observers.requests.sessionReceiptPath, "request observer"],
      [document.effectAudit.windowObserverReceipt, observers.windows.sessionReceiptPath, "window observer"],
      [document.effectAudit.effectObserverReceipt, observers.effects.sessionReceiptPath, "effect observer"],
      [document.effectAudit.audioObserverReceipt, observers.audio.sessionReceiptPath, "audio observer"],
      [document.guiAudit.guiObserverReceipt, observers.gui.sessionReceiptPath, "GUI observer session"],
    ]) {
      validateContentDescriptor(observed, {label});
      invariant(observed.file === expectedPath, `${label} path differs from the preflight binding`);
    }
    validateContentDescriptor(document.sharedObjectDisposition.profileManifest, {
      label: "shared-object profile", expected: options.environmentPreflight.profile.manifest,
    });
    assertSame(document.sharedObjectDisposition.profileRootPhysical,
      options.environmentPreflight.profile.sessionRoot,
      "shared-object profile physical identity/environment binding");
    invariant(document.sharedObjectDisposition.initialTreeSetSha256
      === options.environmentPreflight.profile.initialTreeSetSha256
      && document.sharedObjectDisposition.profileIdentitySha256 === sha256Text(canonicalJson({
        profileManifestSha256: options.environmentPreflight.profile.manifest.sha256,
        profileRootPhysicalSha256: physicalIdentitySha256(
          options.environmentPreflight.profile.sessionRoot,
        ),
        initialTreeSetSha256: options.environmentPreflight.profile.initialTreeSetSha256,
      })), "shared-object profile tree/physical identity drifted");
  }
  assertExactKeys(document.sessionOutputManifest, [
    "descriptor", "physical", "outputRootRealPath", "entries", "entryCount", "totalBytes",
    "entrySetSha256", "entrySetDescriptor", "selfRelativePath", "selfExcludedFromEntries",
    "directories", "directoryPhysicalEntries", "directoryCount", "rootFileCount",
    "rootPathSetSha256", "rootEntryCount", "rootEntrySetSha256", "specialEntryCount",
    "symlinkEntryCount", "rootEnumerationComplete", "unexpectedFileCount", "complete",
  ], "postflight sessionOutputManifest");
  validateContentDescriptor(document.sessionOutputManifest.descriptor,
    {label: "postflight sessionOutputManifest.descriptor"});
  assertPhysicalFileEvidence(document.sessionOutputManifest.physical,
    document.sessionOutputManifest.descriptor, "postflight sessionOutputManifest.physical");
  invariant(document.sessionOutputManifest.physical.observedAt === document.completedAt,
    "session-output manifest physical observation time drifted");
  invariant(document.sessionOutputManifest.selfRelativePath === SESSION_OUTPUT_MANIFEST_RELATIVE_PATH
    && document.sessionOutputManifest.selfExcludedFromEntries === true
    && path.basename(document.sessionOutputManifest.descriptor.file)
      === SESSION_OUTPUT_MANIFEST_RELATIVE_PATH
    && path.dirname(document.sessionOutputManifest.descriptor.file)
    === document.sessionOutputManifest.outputRootRealPath
    && document.sessionOutputManifest.outputRootRealPath
      === document.outputRootFinalPhysical.realPath
    && (!options.outputRootPreflight || document.sessionOutputManifest.outputRootRealPath
      === options.outputRootPreflight.root.realPath),
  "session-output manifest is not directly inside the exact physical output root");
  invariant(Array.isArray(document.sessionOutputManifest.entries)
    && document.sessionOutputManifest.entries.length > 0,
  "session-output manifest entries are missing");
  assertSortedUniqueStrings(document.sessionOutputManifest.directories,
    "postflight session output directory paths", {minimum: 0});
  invariant(Array.isArray(document.sessionOutputManifest.directoryPhysicalEntries)
    && document.sessionOutputManifest.directoryPhysicalEntries.length
      === document.sessionOutputManifest.directories.length,
  "session-output directory physical-evidence count drifted");
  document.sessionOutputManifest.directoryPhysicalEntries.forEach((physical, index) => {
    assertPhysicalDirectoryEvidence(physical,
      `postflight sessionOutputManifest.directoryPhysicalEntries[${index}]`,
      {observedAt: document.completedAt});
    invariant(physical.absolutePath === path.join(
      document.sessionOutputManifest.outputRootRealPath,
      document.sessionOutputManifest.directories[index],
    ), `postflight output directory ${index} path drifted`);
    if (options.outputRootPreflight) invariant(
      physical.device === options.outputRootPreflight.root.device
        && physical.mountId === options.outputRootPreflight.root.mountId,
      `postflight output directory ${index} differs from output-root device/mount`,
    );
  });
  document.sessionOutputManifest.entries.forEach((entry, index) => {
    assertExactKeys(entry, ["path", "bytes", "sha256"],
      `postflight sessionOutputManifest.entries[${index}]`);
    assertPortableOrAbsoluteFile(entry.path, `postflight sessionOutputManifest.entries[${index}].path`);
    invariant(!path.posix.isAbsolute(entry.path) && Number.isSafeInteger(entry.bytes) && entry.bytes > 0,
      `postflight sessionOutputManifest.entries[${index}] is not a positive contained file`);
    assertSha256(entry.sha256, `postflight sessionOutputManifest.entries[${index}].sha256`);
  });
  const entryPaths = document.sessionOutputManifest.entries.map(({path: entryPath}) => entryPath);
  assertSortedUniqueStrings(entryPaths, "postflight session output entry paths");
  invariant(!entryPaths.includes(SESSION_OUTPUT_MANIFEST_RELATIVE_PATH),
    "session-output manifest self path must be excluded from its non-recursive payload entries");
  const completeRootPaths = [...entryPaths, SESSION_OUTPUT_MANIFEST_RELATIVE_PATH].sort();
  invariant(document.sessionOutputManifest.directories.every((directory) =>
    !completeRootPaths.includes(directory)),
  "session-output path is typed as both file and directory");
  const completeRootEntries = [
    ...document.sessionOutputManifest.directories.map((entryPath) => ({
      path: entryPath,
      type: "directory",
    })),
    ...completeRootPaths.map((entryPath) => ({path: entryPath, type: "ordinary-file"})),
  ].sort((left, right) => left.path < right.path ? -1 : left.path > right.path ? 1
    : left.type < right.type ? -1 : left.type > right.type ? 1 : 0);
  const computedTotalBytes = document.sessionOutputManifest.entries
    .reduce((sum, entry) => sum + entry.bytes, 0);
  invariant(Number.isSafeInteger(computedTotalBytes)
    && document.sessionOutputManifest.entryCount === document.sessionOutputManifest.entries.length
    && Number.isSafeInteger(document.sessionOutputManifest.totalBytes)
    && document.sessionOutputManifest.totalBytes === computedTotalBytes
    && document.sessionOutputManifest.entrySetSha256
      === sessionOutputEntrySetSha256(document.sessionOutputManifest.entries)
    && document.sessionOutputManifest.rootFileCount === completeRootPaths.length
    && document.sessionOutputManifest.rootPathSetSha256
      === sha256Text(canonicalJson(completeRootPaths))
    && document.sessionOutputManifest.directoryCount
      === document.sessionOutputManifest.directories.length
    && document.sessionOutputManifest.rootEntryCount === completeRootEntries.length
    && document.sessionOutputManifest.rootEntrySetSha256
      === sha256Text(canonicalJson(completeRootEntries))
    && document.sessionOutputManifest.specialEntryCount === 0
    && document.sessionOutputManifest.symlinkEntryCount === 0
    && document.sessionOutputManifest.rootEnumerationComplete === true
    && document.sessionOutputManifest.unexpectedFileCount === 0
    && document.sessionOutputManifest.complete === true,
  "session-output manifest is incomplete or contains unexpected files");
  assertSha256(document.sessionOutputManifest.entrySetSha256,
    "postflight sessionOutputManifest.entrySetSha256");
  assertSha256(document.sessionOutputManifest.rootPathSetSha256,
    "postflight sessionOutputManifest.rootPathSetSha256");
  assertSha256(document.sessionOutputManifest.rootEntrySetSha256,
    "postflight sessionOutputManifest.rootEntrySetSha256");
  validateContentDescriptor(document.sessionOutputManifest.entrySetDescriptor,
    {label: "postflight sessionOutputManifest.entrySetDescriptor"});
  invariant(document.sessionOutputManifest.entrySetDescriptor.file
    === "virtual/g4-l10-session-output-entry-set.json",
  "session-output entry-set descriptor virtual identity drifted");
  validateContentDescriptor(document.sessionOutputManifest.entrySetDescriptor, {
    label: "postflight canonical session output entry set",
    expected: contentDescriptor(document.sessionOutputManifest.entrySetDescriptor.file,
      canonicalJson(document.sessionOutputManifest.entries)),
  });
  validateContentDescriptor(document.sessionOutputManifest.descriptor, {
    label: "postflight canonical session output manifest",
    expected: contentDescriptor(document.sessionOutputManifest.descriptor.file,
      sessionOutputManifestBytes(document.sessionOutputManifest)),
  });
  if (options.outputRootPreflight) {
    const expectedFiles = options.outputRootPreflight.expectedArtifacts.files;
    invariant(same(entryPaths,
      expectedFiles.filter((file) => file !== SESSION_OUTPUT_MANIFEST_RELATIVE_PATH))
      && same(completeRootPaths, expectedFiles)
      && same(document.sessionOutputManifest.directories,
        options.outputRootPreflight.expectedArtifacts.directories),
    "session-output non-recursive entries plus the manifest itself do not reconcile exactly to expectedArtifacts");
    invariant(document.sessionOutputManifest.physical.device
      === options.outputRootPreflight.root.device
      && document.sessionOutputManifest.physical.mountId
        === options.outputRootPreflight.root.mountId,
    "session-output manifest physical file differs from the exact output-root device/mount");
  }
  const entryByPath = new Map(document.sessionOutputManifest.entries.map((entry) => [entry.path, entry]));
  const outputBoundDescriptors = [
    document.projectorExit.processObserverReceipt,
    document.requestAudit.networkObserverReceipt,
    document.requestAudit.requestObserverReceipt,
    document.effectAudit.windowObserverReceipt,
    document.effectAudit.effectObserverReceipt,
    document.effectAudit.audioObserverReceipt,
    document.guiAudit.guiObserverReceipt,
    ...(document.projectorExit.terminationMethod === "supervisor-stop-condition-termination"
      ? [document.projectorExit.terminationEvidence.triggerObserverReceipt]
      : []),
    ...(options.sourceOpenStartReceipt ? [
      options.sourceOpenStartReceipt.guiObserverEvent.descriptor,
      options.sourceOpenStartReceipt.captureStartMarker.descriptor,
      options.sourceOpenStartReceipt.firstFrameMarker.descriptor,
    ] : []),
  ];
  for (const descriptor of outputBoundDescriptors) {
    const relativePath = path.relative(document.sessionOutputManifest.outputRootRealPath, descriptor.file);
    invariant(relativePath && !relativePath.startsWith("..") && !path.isAbsolute(relativePath),
      "output-bound observer/marker descriptor escapes the exact session output root");
    const entry = entryByPath.get(relativePath);
    invariant(entry && entry.bytes === descriptor.bytes && entry.sha256 === descriptor.sha256,
      `session-output entry does not reconcile observer/marker descriptor ${relativePath}`);
  }
  assertExactKeys(document.rehash, [
    "sessionPlan", "captureKit", "kitCheck", "traceSpec", "traceSpecIndex", "sourceSwf",
    "stagedSource", "runtimeExecutable", "runnerExecutable", "hostTreeManifest", "profileManifest",
    "sandboxPolicy", "environmentPreflight", "outputRootPreflight", "capacityPreflight",
    "authorization", "launchIntent", "authorizationConsumption", "authorizedProjectorStart",
    "sourceOpenStartReceipt", "processInventory", "networkObserverReceipt", "requestObserverReceipt",
    "processObserverReceipt", "windowObserverReceipt", "effectObserverReceipt", "audioObserverReceipt",
    "guiObserverReceipt", "profileDiscardReceipt", "statefulFilesystemVerifierReceipt",
    "replayLock", "transitionReceipt", "guiObserverEvent", "captureStartMarker",
    "firstFrameMarker", "sessionOutputManifest", "sessionOutputEntrySet",
  ], "postflight rehash");
  for (const [key, descriptor] of Object.entries(document.rehash)) {
    validateContentDescriptor(descriptor, {label: `postflight rehash.${key}`});
  }
  validateContentDescriptor(document.rehash.sessionPlan, {
    label: "postflight rehash.sessionPlan", expected: document.sessionPlan,
  });
  if (plan) {
    for (const [key, expected] of Object.entries({
      captureKit: plan.captureKit,
      kitCheck: plan.kitCheck,
      traceSpec: plan.traceSpec,
      traceSpecIndex: plan.traceSpecIndex,
      sourceSwf: plan.sourceSwf,
      stagedSource: plan.stagedSource,
      runtimeExecutable: plan.runtime.executable,
      runnerExecutable: plan.runner.executable,
    })) validateContentDescriptor(document.rehash[key], {label: `postflight rehash.${key}`, expected});
  }
  if (options.environmentPreflight) {
    for (const [observed, expected, label] of [
      [document.rehash.hostTreeManifest, options.environmentPreflight.hostTree.manifest,
        "postflight rehash host-tree manifest"],
      [document.rehash.profileManifest, options.environmentPreflight.profile.manifest,
        "postflight rehash profile manifest"],
      [document.rehash.sandboxPolicy, options.environmentPreflight.sandbox.policy,
        "postflight rehash sandbox policy"],
      [document.rehash.processInventory, options.environmentPreflight.processAbsence.inventoryReceipt,
        "postflight rehash process inventory"],
    ]) validateContentDescriptor(observed, {label, expected});
    for (const [observed, actualAuditDescriptor, expectedPath, label] of [
      [document.rehash.networkObserverReceipt, document.requestAudit.networkObserverReceipt,
        options.environmentPreflight.observers.network.sessionReceiptPath,
        "postflight rehash network observer"],
      [document.rehash.requestObserverReceipt, document.requestAudit.requestObserverReceipt,
        options.environmentPreflight.observers.requests.sessionReceiptPath,
        "postflight rehash request observer"],
      [document.rehash.processObserverReceipt, document.projectorExit.processObserverReceipt,
        options.environmentPreflight.observers.process.sessionReceiptPath,
        "postflight rehash process observer"],
      [document.rehash.windowObserverReceipt, document.effectAudit.windowObserverReceipt,
        options.environmentPreflight.observers.windows.sessionReceiptPath,
        "postflight rehash window observer"],
      [document.rehash.effectObserverReceipt, document.effectAudit.effectObserverReceipt,
        options.environmentPreflight.observers.effects.sessionReceiptPath,
        "postflight rehash effect observer"],
      [document.rehash.audioObserverReceipt, document.effectAudit.audioObserverReceipt,
        options.environmentPreflight.observers.audio.sessionReceiptPath,
        "postflight rehash audio observer"],
      [document.rehash.guiObserverReceipt, document.guiAudit.guiObserverReceipt,
        options.environmentPreflight.observers.gui.sessionReceiptPath,
        "postflight rehash GUI observer"],
    ]) {
      validateContentDescriptor(observed, {label, expected: actualAuditDescriptor});
      invariant(observed.file === expectedPath, `${label} path differs from the fixed preflight role binding`);
    }
  }
  for (const [key, optionKey] of [
    ["environmentPreflight", "environmentPreflight"],
    ["outputRootPreflight", "outputRootPreflight"],
    ["capacityPreflight", "capacityPreflight"],
    ["authorization", "authorization"],
    ["launchIntent", "launchIntent"],
    ["authorizationConsumption", "authorizationConsumption"],
    ["authorizedProjectorStart", "authorizedProjectorStart"],
    ["sourceOpenStartReceipt", "sourceOpenStartReceipt"],
  ]) if (options[optionKey]) assertDocumentBinding(document.rehash[key], options[optionKey],
    `postflight rehash.${key}`);
  if (options.authorizationConsumption) {
    for (const [observed, expected, label] of [
      [document.rehash.statefulFilesystemVerifierReceipt,
        options.authorizationConsumption.statefulFilesystemVerifier.verificationReceipt,
        "postflight rehash stateful filesystem verifier"],
      [document.rehash.replayLock, options.authorizationConsumption.replayLock.descriptor,
        "postflight rehash replay lock"],
      [document.rehash.transitionReceipt, options.authorizationConsumption.transition.receipt,
        "postflight rehash transition receipt"],
    ]) validateContentDescriptor(observed, {label, expected});
  }
  validateContentDescriptor(document.rehash.profileDiscardReceipt, {
    label: "postflight rehash profile discard receipt",
    expected: document.sharedObjectDisposition.discardReceipt,
  });
  if (options.sourceOpenStartReceipt) {
    for (const [observed, expected, label] of [
      [document.rehash.guiObserverEvent, options.sourceOpenStartReceipt.guiObserverEvent.descriptor,
        "postflight rehash authenticated GUI event"],
      [document.rehash.captureStartMarker, options.sourceOpenStartReceipt.captureStartMarker.descriptor,
        "postflight rehash capture-start marker"],
      [document.rehash.firstFrameMarker, options.sourceOpenStartReceipt.firstFrameMarker.descriptor,
        "postflight rehash first-frame marker"],
    ]) validateContentDescriptor(observed, {label, expected});
  }
  if (document.projectorExit.terminationMethod === "supervisor-stop-condition-termination") {
    const observerRole = document.projectorExit.terminationEvidence.triggerObserverRole;
    const rehashKey = OBSERVER_ROLE_REHASH_KEY[observerRole];
    invariant(rehashKey, "postflight supervisor observer role has no fixed rehash mapping");
    validateContentDescriptor(document.rehash[rehashKey], {
      label: "postflight supervisor trigger receipt rehash",
      expected: document.projectorExit.terminationEvidence.triggerObserverReceipt,
    });
  }
  validateContentDescriptor(document.rehash.sessionOutputManifest, {
    label: "postflight rehash session output manifest",
    expected: document.sessionOutputManifest.descriptor,
  });
  validateContentDescriptor(document.rehash.sessionOutputEntrySet, {
    label: "postflight rehash session output entry set",
    expected: document.sessionOutputManifest.entrySetDescriptor,
  });
  assertAllFalseAuthorityBoundary(document.authorityBoundary);
  assertReceiptSelfHash(document, "containment postflight");
  return shapeOnlyResult("containment-postflight-v4");
}

function assertChainInputDocument(value, label) {
  invariant(isPlainObject(value), `full-chain ${label} is required`);
  return value;
}

/**
 * Complete-session evidence validator. This is intentionally not a pre-launch
 * admission API: future start/source-open/postflight evidence cannot exist at
 * admission time. validatePreLaunchAdmissionV4 is the only admission entry.
 */
export function validateFullSessionChainV4(input) {
  assertExactKeys(input, [
    "plan", "environmentPreflight", "outputRootPreflight", "capacityPreflight",
    "authorization", "launchIntent", "authorizationConsumption", "authorizedProjectorStart",
    "sourceOpenStartReceipt", "containmentPostflight", "ownerPublicKey", "nowMs",
  ], "full session chain input");
  const plan = assertChainInputDocument(input.plan, "plan");
  const environment = assertChainInputDocument(input.environmentPreflight, "environmentPreflight");
  const outputRoot = assertChainInputDocument(input.outputRootPreflight, "outputRootPreflight");
  const capacity = assertChainInputDocument(input.capacityPreflight, "capacityPreflight");
  const authorization = assertChainInputDocument(input.authorization, "authorization");
  const launchIntent = assertChainInputDocument(input.launchIntent, "launchIntent");
  const consumption = assertChainInputDocument(input.authorizationConsumption, "authorizationConsumption");
  const start = assertChainInputDocument(input.authorizedProjectorStart, "authorizedProjectorStart");
  const sourceOpen = assertChainInputDocument(input.sourceOpenStartReceipt, "sourceOpenStartReceipt");
  const postflight = assertChainInputDocument(input.containmentPostflight, "containmentPostflight");
  invariant(input.ownerPublicKey, "full-chain ownerPublicKey is required");
  const now = nowValue(input.nowMs);
  invariant(now !== null, "full-chain nowMs is required");

  const startAt = assertCanonicalTimestamp(start.startedAt, "full-chain projector start");
  const preLaunchCandidate = validatePreLaunchCandidateV4({
    plan,
    environmentPreflight: environment,
    outputRootPreflight: outputRoot,
    capacityPreflight: capacity,
    authorization,
    launchIntent,
    ownerPublicKey: input.ownerPublicKey,
    nowMs: startAt,
  });
  const preLaunchBinding = preLaunchCandidate.bindingSha256;

  validateSessionPlanShapeOnly(plan);
  const planDescriptor = environment.sessionPlan;
  assertDocumentBinding(planDescriptor, plan, "full-chain session plan");
  for (const [label, descriptor] of [
    ["output-root sessionPlan", outputRoot.sessionPlan],
    ["capacity sessionPlan", capacity.sessionPlan],
    ["authorization sessionPlan", authorization.sessionPlan],
    ["launch-intent sessionPlan", launchIntent.sessionPlan],
    ["authorized-start sessionPlan", start.sessionPlan],
    ["source-open sessionPlan", sourceOpen.sessionPlan],
    ["postflight sessionPlan", postflight.sessionPlan],
  ]) validateContentDescriptor(descriptor, {label, expected: planDescriptor});

  validateEnvironmentPreflightShapeOnly(environment, {plan, planDescriptor, nowMs: startAt});
  validateOutputRootPreflightShapeOnly(outputRoot, {plan, planDescriptor, nowMs: startAt});
  validateCapacityPreflightShapeOnly(capacity, {
    plan,
    planDescriptor,
    nowMs: startAt,
    outputRootPreflight: outputRoot,
    outputRootPreflightDescriptor: capacity.outputRootPreflight,
  });

  const preflightDescriptors = authorization.preflights;
  for (const [key, document] of [
    ["environment", environment], ["outputRoot", outputRoot], ["capacity", capacity],
  ]) assertDocumentBinding(preflightDescriptors[key], document,
    `full-chain authorization preflights.${key}`);
  validateNamedOperatorAuthorizationShapeOnly(authorization, {
    plan,
    planDescriptor,
    nowMs: startAt,
    ownerPublicKey: input.ownerPublicKey,
    preflightDescriptors,
    environmentPreflight: environment,
    launchIntent,
    launchIntentDescriptor: authorization.launchIntent,
  });

  assertDocumentBinding(consumption.authorization, authorization,
    "full-chain authorization consumption authorization");
  validateAuthorizationConsumptionShapeOnly(consumption, {
    plan,
    authorization,
    authorizationDescriptor: consumption.authorization,
    ownerPublicKey: input.ownerPublicKey,
    nowMs: startAt,
    preflightDescriptors,
    environmentPreflight: environment,
    launchIntent,
    launchIntentDescriptor: consumption.launchIntent,
    preLaunchAdmissionBindingSha256: preLaunchBinding,
  });

  const readinessDescriptors = {
    authorization: consumption.authorization,
    environment: preflightDescriptors.environment,
    outputRoot: preflightDescriptors.outputRoot,
    capacity: preflightDescriptors.capacity,
  };
  assertSame(start.readiness, readinessDescriptors, "full-chain authorized-start readiness");
  assertDocumentBinding(start.authorizationConsumption, consumption,
    "full-chain authorized-start authorizationConsumption");
  validateAuthorizedProjectorStartShapeOnly(start, {
    plan,
    planDescriptor,
    readinessDescriptors,
    authorization,
    authorizationConsumption: consumption,
    authorizationConsumptionDescriptor: start.authorizationConsumption,
    environmentPreflight: environment,
    outputRootPreflight: outputRoot,
    capacityPreflight: capacity,
    launchIntent,
    preLaunchAdmissionBindingSha256: preLaunchBinding,
  });

  assertSame(sourceOpen.readiness, readinessDescriptors, "full-chain source-open readiness");
  assertDocumentBinding(sourceOpen.authorizationConsumption, consumption,
    "full-chain source-open authorizationConsumption");
  assertDocumentBinding(sourceOpen.authorizedProjectorStart, start,
    "full-chain source-open authorizedProjectorStart");
  validateSourceOpenStartReceiptV4ShapeOnly(sourceOpen, {
    plan,
    planDescriptor,
    readinessDescriptors,
    authorization,
    authorizationConsumption: consumption,
    authorizationConsumptionDescriptor: sourceOpen.authorizationConsumption,
    authorizedProjectorStart: start,
    authorizedProjectorStartDescriptor: sourceOpen.authorizedProjectorStart,
    environmentPreflight: environment,
    launchIntent,
    preLaunchAdmissionBindingSha256: preLaunchBinding,
  });

  assertDocumentBinding(postflight.sourceOpenStartReceipt, sourceOpen,
    "full-chain postflight sourceOpenStartReceipt");
  validateContainmentPostflightShapeOnly(postflight, {
    plan,
    planDescriptor,
    sourceOpenStartReceipt: sourceOpen,
    sourceOpenStartReceiptDescriptor: postflight.sourceOpenStartReceipt,
    environmentPreflight: environment,
    outputRootPreflight: outputRoot,
    capacityPreflight: capacity,
    authorization,
    launchIntent,
    launchIntentDescriptor: postflight.launchIntent,
    authorizationConsumption: consumption,
    authorizationConsumptionDescriptor: postflight.authorizationConsumption,
    authorizedProjectorStart: start,
    authorizedProjectorStartDescriptor: postflight.authorizedProjectorStart,
    preLaunchAdmissionBindingSha256: preLaunchBinding,
  });

  const allSessionIds = [
    plan.sessionId,
    environment.sessionId,
    outputRoot.sessionId,
    capacity.sessionId,
    authorization.session.sessionId,
    launchIntent.sessionId,
    consumption.sessionId,
    start.sessionId,
    sourceOpen.sessionId,
    postflight.sessionId,
  ];
  invariant(new Set(allSessionIds).size === 1, "full-chain session identity is not closed");
  assertAuthorizationIdentity(authorization.identity, plan);
  assertOperatorMatches(sourceOpen.operator, authorization.operator);

  const environmentAt = Date.parse(environment.checkedAt);
  const outputAt = Date.parse(outputRoot.checkedAt);
  const capacityAt = Date.parse(capacity.measuredAt);
  const launchIntentAt = Date.parse(launchIntent.observedAt);
  const issuedAt = Date.parse(authorization.session.issuedAt);
  const notBefore = Date.parse(authorization.session.notBefore);
  const runnerStartedAt = Date.parse(consumption.runnerProcess.startedAt);
  const consumedAt = Date.parse(consumption.consumedAt);
  const transitionVerifiedAt = Date.parse(consumption.transition.verifiedAt);
  const openedAt = Date.parse(sourceOpen.sourceOpen.openedAt);
  const finalizedAt = Date.parse(sourceOpen.finalizedAt);
  const exitRequestedAt = Date.parse(postflight.projectorExit.requestedAt);
  const exitedAt = Date.parse(postflight.projectorExit.exitedAt);
  const completedAt = Date.parse(postflight.completedAt);
  invariant(environmentAt <= outputAt && outputAt <= capacityAt
    && capacityAt <= launchIntentAt && launchIntentAt <= issuedAt && issuedAt <= notBefore
    && notBefore <= runnerStartedAt && runnerStartedAt <= consumedAt
    && consumedAt === startAt && startAt <= transitionVerifiedAt && transitionVerifiedAt <= openedAt
    && openedAt <= finalizedAt
    && finalizedAt <= exitRequestedAt && exitRequestedAt <= exitedAt && exitedAt <= completedAt,
  "full-chain chronology is not one-way");
  invariant(startAt - capacityAt <= 300_000,
    "full-chain capacity measurement is older than 300 seconds at launch");
  invariant(startAt <= Date.parse(environment.validUntil)
    && startAt <= Date.parse(outputRoot.validUntil)
    && startAt <= Date.parse(capacity.validUntil)
    && startAt <= Date.parse(launchIntent.validUntil)
    && finalizedAt <= Date.parse(authorization.session.expiresAt),
  "full-chain launch/source-open exceeded a bound readiness or authorization window");
  invariant(now >= completedAt, "full-chain validation time precedes containment completion");

  for (const document of [
    plan, environment, outputRoot, capacity, authorization, launchIntent, consumption, start,
    sourceOpen, postflight,
  ]) assertAllFalseAuthorityBoundary(document.authorityBoundary);

  // The supplied key has now proved only that this internally consistent
  // candidate chain was signed by that same supplied key. Project governance
  // currently publishes no fixed L10 production owner trust anchor, so caller
  // input must never bootstrap owner authority. This gate is intentionally
  // unreachable until a reviewed source-code successor pins that anchor.
  assertPinnedOwnerTrustAnchor(authorization, input.ownerPublicKey);

  return Object.freeze({
    ok: true,
    validationClass: "complete-session-chain-v4",
    status: "complete-chain-validated-acceptance-neutral",
    sessionId: plan.sessionId,
    language: plan.identity.language,
    animationId: plan.animationId,
    requirementId: plan.requirementId,
    operatorExternalSubjectId: authorization.operator.externalSubjectId,
    preLaunchAdmissionBindingSha256: preLaunchBinding,
    ownerSignatureVerified: true,
    atomicTransitionEvidenceBound: true,
    exactProcessInstanceBound: true,
    statefulFilesystemVerificationRequired: true,
    acceptanceEffect: "none",
  });
}

export const G4_L10_ROOT_CAPTURE_V4_CONSTANTS = Object.freeze({
  releaseId: RELEASE_ID,
  launchProtocol: LAUNCH_PROTOCOL,
  sourceOpenMethod: SOURCE_OPEN_METHOD,
  sourceOpenMenuPath: SOURCE_OPEN_MENU_PATH,
  sourceOpenStatement: SOURCE_OPEN_STATEMENT,
  operationPolicyVersion: OPERATION_POLICY_VERSION,
  requiredStopConditions: REQUIRED_STOP_CONDITIONS,
  allowedHumanOperationIds: ALLOWED_HUMAN_OPERATION_IDS,
  humanOnlyOperationIds: HUMAN_ONLY_OPERATION_IDS,
  forbiddenOperationIds: FORBIDDEN_OPERATION_IDS,
  captureObligationCount: CAPTURE_OBLIGATION_COUNT,
  sessionOutputManifestRelativePath: SESSION_OUTPUT_MANIFEST_RELATIVE_PATH,
  observerSessionFilenames: OBSERVER_SESSION_FILENAMES,
  stopConditionObserverRole: STOP_CONDITION_OBSERVER_ROLE,
  expectedControlArtifactFiles: EXPECTED_CONTROL_ARTIFACT_FILES,
  capacitySizingPolicy: CAPACITY_SIZING_POLICY,
  capacitySizingPolicySha256: CAPACITY_SIZING_POLICY_SHA256,
  preLaunchAdmissionProtocol: PRELAUNCH_ADMISSION_PROTOCOL,
  tokenTransitionProtocol: TOKEN_TRANSITION_PROTOCOL,
  tokenTransitionAtomicPrimitives: TOKEN_TRANSITION_ATOMIC_PRIMITIVES,
  sourceOpenOperatorSigningProtocol: SOURCE_OPEN_OPERATOR_SIGNING_PROTOCOL,
  projectorExitOperatorSigningProtocol: PROJECTOR_EXIT_OPERATOR_SIGNING_PROTOCOL,
  guiObserverEventProtocol: GUI_OBSERVER_EVENT_PROTOCOL,
  captureMarkerProtocol: CAPTURE_MARKER_PROTOCOL,
  requiredControlIds: REQUIRED_CONTROL_IDS,
  replayLockAtomicPrimitives: REPLAY_LOCK_ATOMIC_PRIMITIVES,
  authorityKeys: AUTHORITY_KEYS,
  minimumAuthorizationTtlSeconds: 30,
  maximumAuthorizationTtlSeconds: 900,
  productionOwnerTrustAnchorConfigured: PINNED_OWNER_TRUST_ANCHOR !== null,
  preparationAuthorityGuard: "assertV4PreparationAuthorityAvailable",
  ownerTrustAnchorNotConfiguredCode: OWNER_TRUST_ANCHOR_NOT_CONFIGURED_CODE,
  statefulFilesystemVerifierRequired: true,
  predecessorDraft: Object.freeze({
    status: "rejected-for-launch-non-admitting-predecessor",
    contract: Object.freeze({
      bytes: 80_604,
      sha256: "6f0ba46af9f565d1d4dd7bb5f7f379c3c753631aa1aff4532e371afcb7b0ed65",
    }),
    test: Object.freeze({
      bytes: 52_645,
      sha256: "513a08494402a53e1ce9fb79f500d9200bd2da21a4b69a0924d44d086cfdd8c8",
    }),
    testResult: "18/18",
    audit: "P0=0/P1=6/P2=2",
  }),
});
