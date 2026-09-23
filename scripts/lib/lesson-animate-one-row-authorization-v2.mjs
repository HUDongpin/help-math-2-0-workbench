import {
  createHash,
  verify as verifySignature,
} from "node:crypto";
import {execFile} from "node:child_process";
import {constants as fsConstants} from "node:fs";
import {lstat, open, realpath} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {TextDecoder} from "node:util";
import {promisify} from "node:util";

import {
  assertValidatedLessonAnimateExecutionCodeClosureStillBound,
  canonicalLessonAnimateExecutionCodeClosureJson,
  getValidatedLessonAnimateExecutionCodeClosureContext,
  validateLessonAnimateExecutionCodeClosureManifest,
} from "./lesson-animate-execution-code-closure.mjs";
import {createLessonAnimatePrebuiltAtomicReplayLock} from
  "./lesson-animate-prebuilt-atomic-replay-lock.mjs";
import {
  lessonAnimateTrustContext,
  LESSON_ANIMATE_PRODUCTION_REPLAY_LOCK_ROOT,
  loadLessonAnimateProductionTrustRoot,
} from "./lesson-animate-production-trust.mjs";

export const LESSON_ANIMATE_ONE_ROW_AUTHORIZATION_V2_SCHEMA_VERSION = 2;
export const LESSON_ANIMATE_ONE_ROW_AUTHORIZATION_V2_RELEASE_ID =
  "lesson-g04-l10-perimeter-area";
export const LESSON_ANIMATE_ONE_ROW_AUTHORIZATION_V2_MIN_TTL_SECONDS = 30;
export const LESSON_ANIMATE_ONE_ROW_AUTHORIZATION_V2_MAX_TTL_SECONDS = 900;
export const LESSON_ANIMATE_ONE_ROW_ASSIGNMENT_V2_MIN_TTL_SECONDS = 60;
export const LESSON_ANIMATE_ONE_ROW_ASSIGNMENT_V2_MAX_TTL_SECONDS = 604_800;

export const LESSON_ANIMATE_ONE_ROW_V2_FIXED_QUEUE_SHA256 =
  "fe7a034a62ad79cfa9d37fb34c2d761233f59e5b55f91ece56822983f9999725";
export const LESSON_ANIMATE_ONE_ROW_V2_FIXED_STAGING_SHA256 =
  "1266c971b6c2651187e18e37fa7654070aecec1db84e91102b6c6be96399bf57";
export const LESSON_ANIMATE_ONE_ROW_V2_FIXED_SOURCE_FREEZE_SHA256 =
  "f0a33c8a3d15afd7340e9ea5523385428bae7546bd8d4227a3a8977ab8914318";
export const LESSON_ANIMATE_ONE_ROW_V2_PRODUCTION_REPLAY_ROOT =
  LESSON_ANIMATE_PRODUCTION_REPLAY_LOCK_ROOT;
export const LESSON_ANIMATE_ONE_ROW_V2_PRODUCTION_RUNNER_ENTRYPOINT =
  "scripts/run-lesson-g4-l10-authorized-one-row-audit.mjs";
export const LESSON_ANIMATE_ONE_ROW_V2_NATIVE_LAUNCH_CAPABILITY_ENABLED = false;

const ASSIGNMENT_KIND =
  "lesson-g04-l10-adobe-animate-named-human-operator-assignment-v2";
const AUTHORIZATION_KIND =
  "lesson-g04-l10-adobe-animate-one-row-one-run-v2";
const AUTHORITY_ROOT_RELATIVE =
  "work/animate/g4-l10-authoring-authority/lesson-g04-l10-perimeter-area";
const QUEUE_RELATIVE =
  `work/animate/release-read-only-fla-copies/${LESSON_ANIMATE_ONE_ROW_AUTHORIZATION_V2_RELEASE_ID}/all/operator-queues/sha256/${LESSON_ANIMATE_ONE_ROW_V2_FIXED_QUEUE_SHA256}.json`;
const STAGING_RELATIVE =
  `work/animate/release-read-only-fla-copies/${LESSON_ANIMATE_ONE_ROW_AUTHORIZATION_V2_RELEASE_ID}/all/manifests/sha256/${LESSON_ANIMATE_ONE_ROW_V2_FIXED_STAGING_SHA256}.json`;
const LESSON_RELEASES_RELATIVE = "catalog/lesson-releases.json";
const ANIMATIONS_RELATIVE = "catalog/animations.json";
const SOURCE_FREEZE_RELATIVE = "catalog/source-manifest.sha256";
const SOURCE_PREFIX =
  "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/";
const SOURCE_FREEZE_PREFIX = "HELP_COURSES/ELMGR4/L10/";
const PRODUCTION_CAPTURE_FRAME = 1;
const PRODUCTION_ANIMATE_TIMEOUT_MS = 900_000;
const PRODUCTION_AUDIT_JSFL = "scripts/animate-audit-current-document.jsfl";
const RUN_ID = /^run-[A-Za-z0-9_-]{8,96}$/u;
const NONCE = /^[A-Za-z0-9_-]{32,128}$/u;
const HASH = /^[a-f0-9]{64}$/u;
const ID = /^[a-z0-9](?:[a-z0-9-]{0,126}[a-z0-9])?$/u;
const INVISIBLE_OR_DIRECTIONAL =
  /[\u0000-\u001f\u007f\u200b-\u200f\u202a-\u202e\u2060-\u206f\ufeff]/u;
const AUTOMATION_IDENTITY =
  /(?:codex|automation|automated|robot|bot|agent|unknown|anonymous|none|not[ -]?applicable)/iu;
const NOT_APPLICABLE_IDENTITY =
  /(?:^|[^\p{L}\p{N}])n\/?a(?:$|[^\p{L}\p{N}])/iu;

const AUTHORITY_BOUNDARY_KEYS = Object.freeze([
  "originalRuntimeBehavior",
  "ruffleBaseline",
  "audioCueAcceptance",
  "javascriptFidelity",
  "humanVisualReview",
  "ownerAcceptance",
  "strictAcceptance",
  "migrationCompletion",
  "wholeLessonIntegration",
  "publication",
]);
const AUTHORITY_BOUNDARY = deepFreeze(Object.fromEntries(
  AUTHORITY_BOUNDARY_KEYS.map((key) => [key, false]),
));
const PRODUCTION_OPTION_KEYS = Object.freeze([
  "assignmentSha256",
  "authorizationSha256",
  "executionCodeClosureSha256",
  "projectRoot",
]);
const DIAGNOSTIC_OPTION_KEYS = Object.freeze([
  ...PRODUCTION_OPTION_KEYS,
  "now",
  "trustToken",
]);

const VERIFIED_PRODUCTION = new WeakMap();
const VERIFIED_DIAGNOSTIC = new WeakMap();
const CONSUMED_PRODUCTION = new WeakMap();
const CLAIMED_PRODUCTION = new WeakMap();
const LAUNCH_ATTEMPTS_PRODUCTION = new WeakMap();
const execFileAsync = promisify(execFile);
const MODULE_FILE = fileURLToPath(import.meta.url);

function invariant(condition, message) {
  if (!condition) {
    throw new Error(`Lesson Animate one-row authorization v2: ${message}`);
  }
}

function isPlainObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  // Buffers and native KeyObjects are kept only inside module-private
  // WeakMap contexts. Freezing a non-empty typed-array view throws in Node.
  if (!Array.isArray(value) && !isPlainObject(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}

function canonicalize(value, label = "canonical JSON") {
  if (Array.isArray(value)) return value.map((entry) => canonicalize(entry, label));
  if (isPlainObject(value)) {
    return Object.fromEntries(Object.keys(value).sort().map((key) => {
      invariant(value[key] !== undefined, `${label} field ${key} is undefined`);
      return [key, canonicalize(value[key], label)];
    }));
  }
  invariant(value === null || ["string", "number", "boolean"].includes(typeof value),
    `${label} contains a non-JSON value`);
  invariant(typeof value !== "number" || Number.isFinite(value),
    `${label} contains a non-finite number`);
  return value;
}

export function canonicalLessonAnimateOneRowAuthorizationV2Json(value) {
  return `${JSON.stringify(canonicalize(value), null, 2)}\n`;
}

function sameCanonical(left, right) {
  return canonicalLessonAnimateOneRowAuthorizationV2Json(left)
    === canonicalLessonAnimateOneRowAuthorizationV2Json(right);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function assertExactKeys(value, expected, label) {
  invariant(isPlainObject(value), `${label} must be a plain object`);
  const actualKeys = Object.keys(value).sort();
  const expectedKeys = [...expected].sort();
  invariant(actualKeys.length === expectedKeys.length
    && actualKeys.every((key, index) => key === expectedKeys[index]),
  `${label} keys drifted`);
}

function assertSha256(value, label) {
  invariant(typeof value === "string" && HASH.test(value),
    `${label} must be one lowercase SHA-256`);
  return value;
}

function normalizeNow(now, label = "now") {
  const value = now instanceof Date ? now.getTime()
    : typeof now === "string" ? Date.parse(now) : now;
  invariant(Number.isFinite(value), `${label} must be a valid date or epoch millisecond value`);
  return value;
}

function canonicalTimestamp(value, label) {
  invariant(typeof value === "string" && Number.isFinite(Date.parse(value))
    && new Date(value).toISOString() === value,
  `${label} must be one canonical UTC ISO timestamp`);
  return Date.parse(value);
}

function portableRelative(value, label) {
  invariant(typeof value === "string" && value.length > 0 && !value.includes("\\")
    && !path.posix.isAbsolute(value) && path.posix.normalize(value) === value
    && value !== "." && value !== ".." && !value.startsWith("../")
    && !value.includes("/../"), `${label} must be one normalized project-relative path`);
  return value;
}

function resolveProjectFile(projectRoot, relative, label) {
  portableRelative(relative, label);
  const absolute = path.resolve(projectRoot, ...relative.split("/"));
  const rebound = path.relative(projectRoot, absolute).split(path.sep).join("/");
  invariant(rebound === relative, `${label} escapes projectRoot`);
  return absolute;
}

function modeOf(info) {
  return Number(info.mode & 0o7777n).toString(8).padStart(4, "0");
}

function physicalIdentity(info) {
  return deepFreeze({
    device: info.dev.toString(),
    inode: info.ino.toString(),
    links: info.nlink.toString(),
    bytes: Number(info.size),
    mode: modeOf(info),
    uid: info.uid.toString(),
    gid: info.gid.toString(),
    mtimeNs: info.mtimeNs.toString(),
    ctimeNs: info.ctimeNs.toString(),
  });
}

function samePhysicalIdentity(left, right) {
  return sameCanonical(left, right);
}

async function stableRegularFile(absolute, label, {
  exactMode = null,
  requireNonWritable = false,
  requireExecutable = false,
} = {}) {
  invariant(path.isAbsolute(absolute) && path.resolve(absolute) === absolute,
    `${label} path must be normalized and absolute`);
  invariant(Number.isInteger(fsConstants.O_NOFOLLOW),
    "O_NOFOLLOW is unavailable on this host");
  invariant(await realpath(absolute) === absolute,
    `${label} or one of its ancestors resolves through a symbolic link`);
  const before = await lstat(absolute, {bigint: true});
  invariant(before.isFile() && !before.isSymbolicLink() && before.nlink === 1n,
    `${label} must be one ordinary single-link file`);
  const beforeIdentity = physicalIdentity(before);
  if (exactMode !== null) {
    invariant(beforeIdentity.mode === exactMode,
      `${label} mode must be exactly ${exactMode}`);
  }
  if (requireNonWritable) {
    invariant((before.mode & 0o222n) === 0n, `${label} must not be writable`);
  }
  if (requireExecutable) {
    invariant((before.mode & 0o111n) !== 0n, `${label} must be executable`);
  }

  const aclMustBeAbsent = requireNonWritable
    || exactMode === "0444"
    || exactMode === "0500";
  if (aclMustBeAbsent) {
    const hasAcl = await hasExtendedAcl(absolute, label);
    const afterAclProbe = await lstat(absolute, {bigint: true});
    invariant(hasAcl === false, `${label} may not carry an extended ACL`);
    invariant(afterAclProbe.isFile() && !afterAclProbe.isSymbolicLink()
      && afterAclProbe.nlink === 1n
      && samePhysicalIdentity(beforeIdentity, physicalIdentity(afterAclProbe))
      && await realpath(absolute) === absolute,
    `${label} changed while its ACL policy was inspected`);
  }

  const handle = await open(absolute, fsConstants.O_RDONLY | fsConstants.O_NOFOLLOW);
  let descriptorBefore;
  let descriptorAfter;
  let bytes;
  try {
    const openedBefore = await handle.stat({bigint: true});
    descriptorBefore = physicalIdentity(openedBefore);
    invariant(openedBefore.isFile() && openedBefore.nlink === 1n
      && samePhysicalIdentity(beforeIdentity, descriptorBefore),
    `${label} changed before its descriptor was pinned`);
    bytes = await handle.readFile();
    descriptorAfter = physicalIdentity(await handle.stat({bigint: true}));
  } finally {
    await handle.close();
  }
  invariant(samePhysicalIdentity(descriptorBefore, descriptorAfter)
    && descriptorAfter.bytes === bytes.length,
  `${label} changed while its pinned descriptor was read`);
  const after = await lstat(absolute, {bigint: true});
  const afterIdentity = physicalIdentity(after);
  invariant(after.isFile() && !after.isSymbolicLink() && after.nlink === 1n
    && samePhysicalIdentity(descriptorAfter, afterIdentity)
    && await realpath(absolute) === absolute,
  `${label} pathname changed around its pinned descriptor read`);
  return deepFreeze({
    absolute,
    bytes,
    sha256: sha256(bytes),
    size: bytes.length,
    mode: afterIdentity.mode,
    identity: afterIdentity,
  });
}

async function readProjectFile(projectRoot, relative, label, options = {}) {
  return stableRegularFile(resolveProjectFile(projectRoot, relative, label), label, options);
}

function parseUtf8Json(bytes, label) {
  let text;
  try {
    text = new TextDecoder("utf-8", {fatal: true}).decode(bytes);
  } catch (error) {
    throw new Error(`Lesson Animate one-row authorization v2: ${label} is not valid UTF-8: ${error.message}`);
  }
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`Lesson Animate one-row authorization v2: ${label} is not valid JSON: ${error.message}`);
  }
}

function descriptor(physical, projectRoot) {
  return deepFreeze({
    file: path.relative(projectRoot, physical.absolute).split(path.sep).join("/"),
    sha256: physical.sha256,
    bytes: physical.size,
    mode: physical.mode,
  });
}

function assertDescriptor(value, label, {source = false} = {}) {
  assertExactKeys(value,
    source
      ? ["bytes", "file", "mode", "sha256", "sourceFreezeManifestPath"]
      : ["bytes", "file", "mode", "sha256"], label);
  portableRelative(value.file, `${label}.file`);
  assertSha256(value.sha256, `${label}.sha256`);
  invariant(Number.isSafeInteger(value.bytes) && value.bytes > 0,
    `${label}.bytes is invalid`);
  invariant(/^[0-7]{4}$/u.test(value.mode || ""), `${label}.mode is invalid`);
  if (source) portableRelative(value.sourceFreezeManifestPath,
    `${label}.sourceFreezeManifestPath`);
}

function assertExactDescriptor(value, expected, label, options = {}) {
  assertDescriptor(value, label, options);
  invariant(sameCanonical(value, expected), `${label} differs from the independently derived binding`);
}

function authorityReceiptRelative(kind, digest) {
  return `${AUTHORITY_ROOT_RELATIVE}/${kind}/sha256/${digest}.json`;
}

async function readAuthorityReceipt(projectRoot, kind, digest, label) {
  assertSha256(digest, `${label} content address`);
  const relative = authorityReceiptRelative(kind, digest);
  const physical = await readProjectFile(projectRoot, relative, label, {
    exactMode: "0444",
    requireNonWritable: true,
  });
  invariant(physical.sha256 === digest,
    `${label} bytes differ from its fixed content-addressed pathname`);
  const document = parseUtf8Json(physical.bytes, label);
  return deepFreeze({physical, document, binding: descriptor(physical, projectRoot)});
}

function validateAllFalseBoundary(value, label) {
  assertExactKeys(value, AUTHORITY_BOUNDARY_KEYS, label);
  for (const key of AUTHORITY_BOUNDARY_KEYS) {
    invariant(value[key] === false, `${label}.${key} must remain false`);
  }
}

function normalizedHumanName(value, label) {
  const normalized = typeof value === "string" ? value.normalize("NFC").trim() : "";
  invariant(normalized === value && normalized.length >= 2 && normalized.length <= 128
    && /\p{L}/u.test(normalized), `${label} must name one real human`);
  invariant(!INVISIBLE_OR_DIRECTIONAL.test(normalized)
    && !AUTOMATION_IDENTITY.test(normalized)
    && !NOT_APPLICABLE_IDENTITY.test(normalized),
  `${label} contains an automation, placeholder, or hidden identity`);
  return normalized;
}

function normalizedHumanSubject(value, label) {
  const normalized = typeof value === "string" ? value.normalize("NFC").trim() : "";
  invariant(normalized === value && normalized.length >= 3 && normalized.length <= 160
    && /[\p{L}\p{N}]/u.test(normalized), `${label} must be one stable human subject`);
  invariant(!INVISIBLE_OR_DIRECTIONAL.test(normalized)
    && !AUTOMATION_IDENTITY.test(normalized)
    && !NOT_APPLICABLE_IDENTITY.test(normalized),
  `${label} contains an automation, placeholder, or hidden identity`);
  return normalized;
}

function trustBinding(context) {
  return deepFreeze({
    trustRootId: context.trustRootId,
    ownerSubjectId: context.ownerSubjectId,
    ownerPublicKeySha256: context.ownerPublicKeySha256,
    ownerKeyFingerprintSha256: context.ownerKeyFingerprintSha256,
  });
}

function validateSignedTrustBinding(value, expected, label) {
  assertExactKeys(value, [
    "ownerKeyFingerprintSha256",
    "ownerPublicKeySha256",
    "ownerSubjectId",
    "trustRootId",
  ], label);
  normalizedHumanSubject(value.ownerSubjectId, `${label}.ownerSubjectId`);
  assertSha256(value.ownerPublicKeySha256, `${label}.ownerPublicKeySha256`);
  assertSha256(value.ownerKeyFingerprintSha256, `${label}.ownerKeyFingerprintSha256`);
  invariant(sameCanonical(value, expected), `${label} differs from the fixed loaded trust root`);
}

export function lessonAnimateOneRowAuthorizationV2SigningBytes(document) {
  invariant(isPlainObject(document), "signed document must be one plain object");
  const {signature, ...unsigned} = document;
  invariant(isPlainObject(signature), "signed document signature is missing");
  return Buffer.from(canonicalLessonAnimateOneRowAuthorizationV2Json(unsigned), "utf8");
}

function validateSignature(document, trust, label) {
  const signature = document.signature;
  assertExactKeys(signature, [
    "algorithm",
    "ownerKeyFingerprintSha256",
    "ownerPublicKeySha256",
    "signatureBase64",
    "signerRole",
    "signerSubjectId",
    "trustRootId",
  ], `${label}.signature`);
  invariant(signature.algorithm === "Ed25519" && signature.signerRole === "owner",
    `${label}.signature algorithm or signer role drifted`);
  invariant(signature.signerSubjectId === trust.ownerSubjectId
    && signature.trustRootId === trust.trustRootId
    && signature.ownerPublicKeySha256 === trust.ownerPublicKeySha256
    && signature.ownerKeyFingerprintSha256 === trust.ownerKeyFingerprintSha256,
  `${label}.signature does not bind the fixed trust owner and key`);
  invariant(/^(?:[A-Za-z0-9+/]{4}){21}[A-Za-z0-9+/]{2}==$/u.test(
    signature.signatureBase64 || ""),
  `${label}.signatureBase64 must be canonical padded base64 for 64 bytes`);
  const signatureBytes = Buffer.from(signature.signatureBase64, "base64");
  invariant(signatureBytes.length === 64
    && signatureBytes.toString("base64") === signature.signatureBase64,
  `${label}.signatureBase64 is not canonical`);
  invariant(verifySignature(null, lessonAnimateOneRowAuthorizationV2SigningBytes(document),
    trust.ownerPublicKey, signatureBytes), `${label} Ed25519 signature verification failed`);
}

function validateValidity(value, label, nowMs, {minimum, maximum}) {
  assertExactKeys(value, ["issuedAt", "notAfter", "notBefore", "ttlSeconds"], label);
  const issuedAtMs = canonicalTimestamp(value.issuedAt, `${label}.issuedAt`);
  const notBeforeMs = canonicalTimestamp(value.notBefore, `${label}.notBefore`);
  const notAfterMs = canonicalTimestamp(value.notAfter, `${label}.notAfter`);
  invariant(Number.isInteger(value.ttlSeconds)
    && value.ttlSeconds >= minimum && value.ttlSeconds <= maximum,
  `${label}.ttlSeconds is outside its bounded validity window`);
  invariant(issuedAtMs <= notBeforeMs && notAfterMs > notBeforeMs
    && notAfterMs - issuedAtMs === value.ttlSeconds * 1000,
  `${label} timestamps and TTL are inconsistent`);
  invariant(nowMs >= notBeforeMs && nowMs <= notAfterMs,
    `${label} is not currently valid`);
  return deepFreeze({issuedAtMs, notBeforeMs, notAfterMs});
}

function requireCanonicalReceiptBytes(receipt, label) {
  const expected = Buffer.from(canonicalLessonAnimateOneRowAuthorizationV2Json(receipt.document));
  invariant(receipt.physical.bytes.equals(expected), `${label} is not exact canonical JSON`);
}

function validateAssignment(receipt, trust, nowMs) {
  const value = receipt.document;
  requireCanonicalReceiptBytes(receipt, "named-human assignment v2");
  assertExactKeys(value, [
    "assignment",
    "authorityBoundary",
    "evidenceKind",
    "releaseId",
    "schemaVersion",
    "signature",
    "trust",
    "validity",
  ], "named-human assignment v2");
  invariant(value.schemaVersion === LESSON_ANIMATE_ONE_ROW_AUTHORIZATION_V2_SCHEMA_VERSION
    && value.evidenceKind === ASSIGNMENT_KIND
    && value.releaseId === LESSON_ANIMATE_ONE_ROW_AUTHORIZATION_V2_RELEASE_ID,
  "named-human assignment v2 identity drifted");
  validateSignedTrustBinding(value.trust, trustBinding(trust), "assignment.trust");
  const validity = validateValidity(value.validity, "assignment.validity", nowMs, {
    minimum: LESSON_ANIMATE_ONE_ROW_ASSIGNMENT_V2_MIN_TTL_SECONDS,
    maximum: LESSON_ANIMATE_ONE_ROW_ASSIGNMENT_V2_MAX_TTL_SECONDS,
  });
  assertExactKeys(value.assignment, [
    "allowedHumanActions",
    "assigneeFullName",
    "automationUsed",
    "consent",
    "explicit",
    "roleId",
    "slot",
    "stableSubjectId",
  ], "assignment.assignment");
  const fullName = normalizedHumanName(value.assignment.assigneeFullName,
    "assignment.assignment.assigneeFullName");
  const stableSubjectId = normalizedHumanSubject(value.assignment.stableSubjectId,
    "assignment.assignment.stableSubjectId");
  invariant(value.assignment.roleId === "adobe-animate-human-dialog-operator"
    && value.assignment.slot === "primary" && value.assignment.explicit === true
    && value.assignment.automationUsed === false
    && sameCanonical(value.assignment.allowedHumanActions, [
      "acknowledge-legacy-actionscript-conversion-dialog",
      "close-without-saving",
    ]), "assignment must designate the primary human dialog operator only");
  assertExactKeys(value.assignment.consent, [
    "automationAllowed",
    "closeWithoutSaving",
    "confirmLegacyActionScriptConversionDialog",
    "savePublishExportAllowed",
    "scope",
  ], "assignment.assignment.consent");
  invariant(value.assignment.consent.scope
    === "only-confirm-legacy-actionscript-conversion-dialog-and-close-without-saving"
    && value.assignment.consent.confirmLegacyActionScriptConversionDialog === true
    && value.assignment.consent.closeWithoutSaving === true
    && value.assignment.consent.savePublishExportAllowed === false
    && value.assignment.consent.automationAllowed === false,
  "assignment consent exceeds or differs from the two bounded human actions");
  validateAllFalseBoundary(value.authorityBoundary, "assignment.authorityBoundary");
  validateSignature(value, trust, "named-human assignment v2");
  return deepFreeze({value, fullName, stableSubjectId, validity, receipt});
}

function assertLegacySourceDescriptor(value, label, {fla = false} = {}) {
  assertExactKeys(value, fla
    ? ["bytes", "file", "flaContainer", "sha256", "sourceFreezeBound",
      "sourceFreezeManifestPath"]
    : ["bytes", "file", "sha256", "sourceFreezeBound", "sourceFreezeManifestPath"], label);
  portableRelative(value.file, `${label}.file`);
  assertSha256(value.sha256, `${label}.sha256`);
  invariant(Number.isSafeInteger(value.bytes) && value.bytes > 0
    && value.sourceFreezeBound === true, `${label} has an invalid size or freeze state`);
  portableRelative(value.sourceFreezeManifestPath, `${label}.sourceFreezeManifestPath`);
  if (fla) invariant(value.flaContainer === "legacy-ole-compound",
    `${label}.flaContainer drifted`);
}

function assertWorkspaceDescriptor(value, label) {
  assertExactKeys(value, ["bytes", "file", "mode", "sha256"], label);
  portableRelative(value.file, `${label}.file`);
  assertSha256(value.sha256, `${label}.sha256`);
  invariant(Number.isSafeInteger(value.bytes) && value.bytes > 0 && value.mode === "0644",
    `${label} byte count or mode drifted`);
}

function assertStagingInputDescriptor(value, label) {
  assertExactKeys(value, ["bytes", "file", "mode", "sha256"], label);
  portableRelative(value.file, `${label}.file`);
  assertSha256(value.sha256, `${label}.sha256`);
  invariant(Number.isSafeInteger(value.bytes) && value.bytes > 0
    && /^[0-7]{4}$/u.test(value.mode || ""),
  `${label} byte count or mode is invalid`);
}

function assertWorkingCopyDescriptor(value, label) {
  assertExactKeys(value, [
    "byteIdenticalToSource", "bytes", "file", "mode", "readOnly",
    "separateRegularFile", "sha256",
  ], label);
  portableRelative(value.file, `${label}.file`);
  assertSha256(value.sha256, `${label}.sha256`);
  invariant(Number.isSafeInteger(value.bytes) && value.bytes > 0
    && value.mode === "0444" && value.readOnly === true
    && value.byteIdenticalToSource === true && value.separateRegularFile === true,
  `${label} is not the required independent read-only byte-identical copy`);
}

function assertReleaseIdentity(value, label) {
  assertExactKeys(value, [
    "fullReleaseMemberCount", "grade", "lesson", "publicationMode", "releaseId",
    "selectedMemberCount", "shardId", "titleDisplay",
  ], label);
  invariant(value.releaseId === LESSON_ANIMATE_ONE_ROW_AUTHORIZATION_V2_RELEASE_ID
    && value.grade === 4 && value.lesson === 10 && value.titleDisplay === "Perimeter & Area"
    && value.publicationMode === "atomic" && value.shardId === null
    && value.selectedMemberCount === 47 && value.fullReleaseMemberCount === 47,
  `${label} differs from the fixed complete L10 release`);
}

function validateStagingDocument(value) {
  assertExactKeys(value, [
    "entries", "evidenceKind", "inputs", "noFlaDispositions", "release",
    "safetyContract", "schemaVersion", "scope", "summary",
  ], "fixed staging manifest");
  invariant(value.schemaVersion === 1
    && value.evidenceKind === "lesson-release-adobe-animate-prepare-only-fla-staging",
  "fixed staging manifest identity drifted");
  assertReleaseIdentity(value.release, "staging.release");
  invariant(value.scope === "Byte-identical read-only FLA working copies, paired SWF bindings, workspace bindings, and explicit SWF-only dispositions; no GUI execution or acceptance authority",
    "staging.scope drifted");
  assertExactKeys(value.inputs,
    ["animations", "generator", "lessonReleases", "sourceFreezeManifest"],
    "staging.inputs");
  for (const key of Object.keys(value.inputs)) {
    assertStagingInputDescriptor(value.inputs[key], `staging.inputs.${key}`);
  }
  invariant(value.inputs.lessonReleases.file === LESSON_RELEASES_RELATIVE
    && value.inputs.lessonReleases.mode === "0644"
    && value.inputs.animations.file === ANIMATIONS_RELATIVE
    && value.inputs.animations.mode === "0644"
    && value.inputs.sourceFreezeManifest.file === SOURCE_FREEZE_RELATIVE
    && value.inputs.sourceFreezeManifest.sha256
      === LESSON_ANIMATE_ONE_ROW_V2_FIXED_SOURCE_FREEZE_SHA256
    && value.inputs.sourceFreezeManifest.mode === "0600"
    && value.inputs.generator.file === "scripts/stage-animate-release-fla-copies.mjs"
    && value.inputs.generator.mode === "0644", "staging fixed input descriptors drifted");
  assertExactKeys(value.safetyContract, [
    "animateGuiLaunchAllowed", "catalogOrLedgerWritesAllowed", "dialogInteractionAllowed",
    "migrationWorkspaceWritesAllowed", "prepareOnly", "reviewApprovalOrStrictWritesAllowed",
    "savePublishExportAllowed", "sourceAssetWritesAllowed",
  ], "staging.safetyContract");
  invariant(value.safetyContract.prepareOnly === true
    && Object.entries(value.safetyContract).every(([key, flag]) => key === "prepareOnly" || flag === false),
  "staging safety contract acquired execution or write authority");
  assertExactKeys(value.summary, [
    "allCopiesByteIdentical", "allCopiesReadOnly", "allSourcesFreezeBound",
    "allWorkspacesHashBound", "animateGuiExecutions", "authoringAuditsCompleted",
    "copiesReady", "dialogInteractions", "flaBackedItems", "migrationOrAcceptanceWrites",
    "selectedMembers", "strictAcceptanceEffect", "swfOnlyItems",
  ], "staging.summary");
  invariant(value.summary.selectedMembers === 47 && value.summary.flaBackedItems === 34
    && value.summary.swfOnlyItems === 13 && value.summary.copiesReady === 34
    && value.summary.allCopiesReadOnly === true
    && value.summary.allCopiesByteIdentical === true
    && value.summary.allSourcesFreezeBound === true
    && value.summary.allWorkspacesHashBound === true
    && value.summary.animateGuiExecutions === 0 && value.summary.dialogInteractions === 0
    && value.summary.authoringAuditsCompleted === 0
    && value.summary.migrationOrAcceptanceWrites === 0
    && value.summary.strictAcceptanceEffect === false,
  "staging summary drifted from prepare-only 34/13 state");
  invariant(Array.isArray(value.entries) && value.entries.length === 34
    && Array.isArray(value.noFlaDispositions) && value.noFlaDispositions.length === 13,
  "staging must contain exactly 34 FLA-backed entries and 13 SWF-only dispositions");
}

function validateQueueDocument(value) {
  assertExactKeys(value, [
    "authorityBoundary", "evidenceKind", "noFlaDispositions", "queue", "release",
    "safety", "schemaVersion", "stagingManifest", "summary",
  ], "fixed operator queue");
  invariant(value.schemaVersion === 1
    && value.evidenceKind === "lesson-release-adobe-animate-prepare-only-operator-queue",
  "fixed operator queue identity drifted");
  assertReleaseIdentity(value.release, "queue.release");
  assertExactKeys(value.stagingManifest, ["address", "bytes", "file", "sha256"],
    "queue.stagingManifest");
  invariant(value.stagingManifest.file === STAGING_RELATIVE
    && value.stagingManifest.sha256 === LESSON_ANIMATE_ONE_ROW_V2_FIXED_STAGING_SHA256
    && value.stagingManifest.bytes === 80_072
    && value.stagingManifest.address
      === `sha256:${LESSON_ANIMATE_ONE_ROW_V2_FIXED_STAGING_SHA256}`,
  "queue does not bind the fixed staging manifest");
  assertExactKeys(value.authorityBoundary, [
    "animateAuthoringAudit", "humanOrOwnerReview", "javascriptCandidate", "originalRuntimeEvidence",
    "publication", "strictCompletion", "workingCopiesPrepared",
  ], "queue.authorityBoundary");
  invariant(value.authorityBoundary.workingCopiesPrepared === true
    && Object.entries(value.authorityBoundary)
      .every(([key, flag]) => key === "workingCopiesPrepared" || flag === false),
  "queue authority boundary acquired acceptance authority");
  assertExactKeys(value.safety, [
    "animateGuiLaunches", "dialogInteractions", "executableCommands",
    "operatorIdentityCollected", "sourceOrWorkspaceWrites",
  ], "queue.safety");
  invariant(Array.isArray(value.safety.executableCommands)
    && value.safety.executableCommands.length === 0 && value.safety.animateGuiLaunches === 0
    && value.safety.dialogInteractions === 0 && value.safety.operatorIdentityCollected === false
    && value.safety.sourceOrWorkspaceWrites === 0,
  "queue safety record drifted");
  assertExactKeys(value.summary, [
    "authoringAuditsCompleted", "noFlaDispositions", "pendingAuthoringAudits",
    "preparedFlaItems", "strictAcceptanceEffect",
  ], "queue.summary");
  invariant(value.summary.preparedFlaItems === 34 && value.summary.noFlaDispositions === 13
    && value.summary.pendingAuthoringAudits === 34
    && value.summary.authoringAuditsCompleted === 0
    && value.summary.strictAcceptanceEffect === false,
  "queue summary drifted from the fixed 34-item pending state");
  invariant(Array.isArray(value.queue) && value.queue.length === 34
    && Array.isArray(value.noFlaDispositions) && value.noFlaDispositions.length === 13,
  "queue must contain exactly 34 FLA-backed rows and 13 SWF-only dispositions");
}

function validateStagingEntry(value, index) {
  const label = `staging.entries[${index}]`;
  assertExactKeys(value, [
    "animateAuthoringAudit", "animationId", "assetId", "releaseOrdinal", "releaseRole",
    "shardId", "sourceFla", "sourceSwf", "workingCopy", "workspaceManifest",
  ], label);
  invariant(Number.isInteger(value.releaseOrdinal) && value.releaseOrdinal >= 1
    && value.releaseOrdinal <= 47 && ID.test(value.animationId || "")
    && /^swf-[a-f0-9]{64}$/u.test(value.assetId || "")
    && ["active-xml-referenced-page", "course-shell"].includes(value.releaseRole)
    && ID.test(value.shardId || ""), `${label} identity is invalid`);
  assertLegacySourceDescriptor(value.sourceFla, `${label}.sourceFla`, {fla: true});
  assertLegacySourceDescriptor(value.sourceSwf, `${label}.sourceSwf`);
  assertWorkspaceDescriptor(value.workspaceManifest, `${label}.workspaceManifest`);
  assertWorkingCopyDescriptor(value.workingCopy, `${label}.workingCopy`);
  assertExactKeys(value.animateAuthoringAudit, [
    "acceptanceEffect", "dialogInteractionByThisPreparation",
    "guiLaunchedByThisPreparation", "status",
  ], `${label}.animateAuthoringAudit`);
  invariant(value.animateAuthoringAudit.status === "not-run"
    && value.animateAuthoringAudit.guiLaunchedByThisPreparation === false
    && value.animateAuthoringAudit.dialogInteractionByThisPreparation === false
    && value.animateAuthoringAudit.acceptanceEffect === false,
  `${label}.animateAuthoringAudit drifted`);
}

function validateQueueRow(value, index) {
  const label = `queue.queue[${index}]`;
  assertExactKeys(value, [
    "actionAuthorizedByThisQueue", "animationId", "queueOrdinal", "releaseOrdinal",
    "shardId", "sourceFla", "sourceSwf", "status", "workingCopy", "workspaceManifest",
  ], label);
  invariant(value.queueOrdinal === index + 1
    && Number.isInteger(value.releaseOrdinal) && value.releaseOrdinal >= 1
    && value.releaseOrdinal <= 47 && ID.test(value.animationId || "")
    && ID.test(value.shardId || "")
    && value.status === "prepared-only-authoring-audit-not-run"
    && value.actionAuthorizedByThisQueue === "hash-and-read-only-verification-only",
  `${label} identity, ordinal, or prepare-only state drifted`);
  assertLegacySourceDescriptor(value.sourceFla, `${label}.sourceFla`, {fla: true});
  assertLegacySourceDescriptor(value.sourceSwf, `${label}.sourceSwf`);
  assertWorkspaceDescriptor(value.workspaceManifest, `${label}.workspaceManifest`);
  assertWorkingCopyDescriptor(value.workingCopy, `${label}.workingCopy`);
}

function validateNoFlaDisposition(value, label) {
  assertExactKeys(value, [
    "animationId", "assetId", "authoringAuditApplicability", "disposition",
    "inferredAuthoringStructureAllowed", "releaseOrdinal", "releaseRole", "shardId",
    "sourceSwf", "strictAcceptanceEffect", "workspaceManifest",
  ], label);
  invariant(Number.isInteger(value.releaseOrdinal) && value.releaseOrdinal >= 1
    && value.releaseOrdinal <= 47 && ID.test(value.animationId || "")
    && /^swf-[a-f0-9]{64}$/u.test(value.assetId || "")
    && ["active-xml-referenced-page", "course-shell"].includes(value.releaseRole)
    && ID.test(value.shardId || "")
    && value.disposition === "swf-only-no-fla-in-catalog-or-workspace"
    && value.authoringAuditApplicability === "not-applicable-no-fla-source"
    && value.inferredAuthoringStructureAllowed === false
    && value.strictAcceptanceEffect === false,
  `${label} is not the fixed fail-closed SWF-only disposition`);
  assertLegacySourceDescriptor(value.sourceSwf, `${label}.sourceSwf`);
  assertWorkspaceDescriptor(value.workspaceManifest, `${label}.workspaceManifest`);
}

function validateReleaseCatalog(catalog) {
  assertExactKeys(catalog, ["releases", "schemaVersion"], "lesson releases catalog");
  invariant(catalog.schemaVersion === 1 && Array.isArray(catalog.releases),
    "lesson releases catalog schema drifted");
  const matches = catalog.releases.filter((entry) =>
    entry?.releaseId === LESSON_ANIMATE_ONE_ROW_AUTHORIZATION_V2_RELEASE_ID);
  invariant(matches.length === 1, "current lesson releases catalog has no unique L10 release");
  const release = matches[0];
  assertExactKeys(release, [
    "developmentMode", "domain", "expectedCounts", "grade", "lesson", "members",
    "publicationMode", "queueId", "releaseId", "releaseOrder", "releaseType",
    "scope", "shards", "sourceLesson", "titleDisplay",
  ], "current L10 release");
  invariant(release.releaseId === LESSON_ANIMATE_ONE_ROW_AUTHORIZATION_V2_RELEASE_ID
    && release.releaseType === "complete-lesson" && release.publicationMode === "atomic"
    && release.developmentMode === "parallel-shards" && release.queueId === "release-g04-l10-perimeter-area"
    && release.grade === 4 && release.lesson === 10 && release.titleDisplay === "Perimeter & Area"
    && Array.isArray(release.members) && release.members.length === 47,
  "current L10 release identity or member count drifted");
  const members = new Map();
  for (const [index, member] of release.members.entries()) {
    assertExactKeys(member, [
      "animationId", "assetId", "batchId", "ordinal", "releaseRole", "shardId",
      "source", "xmlOccurrence",
    ], `current L10 release member ${index}`);
    invariant(member.ordinal === index + 1 && ID.test(member.animationId || "")
      && /^swf-[a-f0-9]{64}$/u.test(member.assetId || "")
      && !members.has(member.animationId), `current L10 release member ${index} is invalid or duplicated`);
    assertExactKeys(member.source, ["path", "sha256"],
      `current L10 release member ${index}.source`);
    portableRelative(member.source.path, `current L10 release member ${index}.source.path`);
    assertSha256(member.source.sha256, `current L10 release member ${index}.source.sha256`);
    invariant(member.assetId === `swf-${member.source.sha256}`,
      `current L10 release member ${index} asset/source binding drifted`);
    members.set(member.animationId, member);
  }
  return deepFreeze({release, members});
}

function validateAnimationsCatalog(catalog) {
  assertExactKeys(catalog, ["animations", "schemaVersion", "summary"], "animations catalog");
  invariant(catalog.schemaVersion === 1 && Array.isArray(catalog.animations),
    "animations catalog schema drifted");
  const byId = new Map();
  for (const animation of catalog.animations) {
    if (animation?.classification?.grade !== 4 || animation?.classification?.lesson !== 10) continue;
    invariant(typeof animation.animationId === "string" && !byId.has(animation.animationId),
      "animations catalog has a duplicate G4 L10 animationId");
    byId.set(animation.animationId, animation);
  }
  invariant(byId.size >= 47, "animations catalog has incomplete G4 L10 coverage");
  return byId;
}

function assertAnimationMatchesRow(animation, row, releaseMember, label) {
  invariant(animation && animation.animationId === row.animationId
    && animation.assetId === releaseMember.assetId
    && animation.canonicalAnimationId === row.animationId
    && animation.isCanonical === true && animation.duplicateOf === null,
  `${label} does not identify one canonical catalog animation`);
  invariant(isPlainObject(animation.source) && animation.source.path === row.sourceSwf.sourceFreezeManifestPath
    && animation.source.sha256 === row.sourceSwf.sha256
    && animation.source.bytes === row.sourceSwf.bytes,
  `${label} SWF differs from the current animations catalog`);
  invariant(isPlainObject(animation.pairedFla)
    && animation.pairedFla.path === row.sourceFla.sourceFreezeManifestPath
    && animation.pairedFla.sha256 === row.sourceFla.sha256
    && animation.pairedFla.bytes === row.sourceFla.bytes,
  `${label} is not the exact FLA-backed current catalog row`);
}

function parseSourceFreeze(bytes) {
  const entries = new Map();
  for (const [index, line] of bytes.toString("utf8").split(/\r?\n/u).entries()) {
    if (!line) continue;
    const match = /^([a-f0-9]{64})  (.+)$/u.exec(line);
    invariant(match && !entries.has(match[2]),
      `source freeze manifest line ${index + 1} is malformed or duplicated`);
    entries.set(match[2], match[1]);
  }
  invariant(entries.size > 0, "source freeze manifest is empty");
  return entries;
}

function validateQueueStagingAndCatalogs({queue, staging, releaseCatalog, animationsCatalog,
  freezeEntries}) {
  validateQueueDocument(queue);
  validateStagingDocument(staging);
  invariant(sameCanonical(queue.release, staging.release),
    "queue and staging release identities differ");
  invariant(sameCanonical(queue.noFlaDispositions, staging.noFlaDispositions),
    "queue and staging SWF-only dispositions differ");
  const release = validateReleaseCatalog(releaseCatalog);
  const animations = validateAnimationsCatalog(animationsCatalog);
  const seenReleaseOrdinals = new Set();
  const seenAnimationIds = new Set();
  const rows = [];
  for (let index = 0; index < 34; index += 1) {
    const queueRow = queue.queue[index];
    const stagingRow = staging.entries[index];
    validateQueueRow(queueRow, index);
    validateStagingEntry(stagingRow, index);
    invariant(queueRow.releaseOrdinal === stagingRow.releaseOrdinal
      && queueRow.animationId === stagingRow.animationId
      && queueRow.shardId === stagingRow.shardId
      && sameCanonical(queueRow.sourceFla, stagingRow.sourceFla)
      && sameCanonical(queueRow.sourceSwf, stagingRow.sourceSwf)
      && sameCanonical(queueRow.workspaceManifest, stagingRow.workspaceManifest)
      && sameCanonical(queueRow.workingCopy, stagingRow.workingCopy),
    `queue row ${index + 1} and staging entry differ`);
    invariant(!seenReleaseOrdinals.has(queueRow.releaseOrdinal)
      && !seenAnimationIds.has(queueRow.animationId),
    `queue row ${index + 1} duplicates a release ordinal or animation`);
    seenReleaseOrdinals.add(queueRow.releaseOrdinal);
    seenAnimationIds.add(queueRow.animationId);
    const releaseMember = release.members.get(queueRow.animationId);
    invariant(releaseMember && releaseMember.ordinal === queueRow.releaseOrdinal
      && releaseMember.assetId === stagingRow.assetId
      && releaseMember.releaseRole === stagingRow.releaseRole
      && releaseMember.shardId === queueRow.shardId
      && releaseMember.source.path === queueRow.sourceSwf.sourceFreezeManifestPath
      && releaseMember.source.sha256 === queueRow.sourceSwf.sha256,
    `queue row ${index + 1} differs from the current L10 release catalog`);
    assertAnimationMatchesRow(animations.get(queueRow.animationId), queueRow,
      releaseMember, `queue row ${index + 1}`);
    invariant(queueRow.sourceFla.file.startsWith(SOURCE_PREFIX)
      && queueRow.sourceSwf.file.startsWith(SOURCE_PREFIX)
      && queueRow.sourceFla.sourceFreezeManifestPath.startsWith(SOURCE_FREEZE_PREFIX)
      && queueRow.sourceSwf.sourceFreezeManifestPath.startsWith(SOURCE_FREEZE_PREFIX)
      && path.posix.basename(queueRow.sourceFla.file, ".fla")
        === path.posix.basename(queueRow.sourceSwf.file, ".swf")
      && queueRow.workspaceManifest.file
        === `migrations/${queueRow.animationId}/migration.json`
      && queueRow.workingCopy.file.startsWith(
        `work/animate/release-read-only-fla-copies/${LESSON_ANIMATE_ONE_ROW_AUTHORIZATION_V2_RELEASE_ID}/all/files/${queueRow.animationId}/`),
    `queue row ${index + 1} source or copy placement drifted`);
    invariant(freezeEntries.get(queueRow.sourceFla.sourceFreezeManifestPath)
      === queueRow.sourceFla.sha256
      && freezeEntries.get(queueRow.sourceSwf.sourceFreezeManifestPath)
        === queueRow.sourceSwf.sha256,
    `queue row ${index + 1} is absent or stale in the fixed source freeze`);
    rows.push(deepFreeze({queueRow, stagingRow, releaseMember,
      animation: animations.get(queueRow.animationId)}));
  }
  for (const [index, disposition] of staging.noFlaDispositions.entries()) {
    validateNoFlaDisposition(disposition, `staging.noFlaDispositions[${index}]`);
    invariant(!seenReleaseOrdinals.has(disposition.releaseOrdinal)
      && !seenAnimationIds.has(disposition.animationId),
    `SWF-only disposition ${index + 1} overlaps an FLA-backed row`);
    seenReleaseOrdinals.add(disposition.releaseOrdinal);
    seenAnimationIds.add(disposition.animationId);
    const releaseMember = release.members.get(disposition.animationId);
    const animation = animations.get(disposition.animationId);
    invariant(releaseMember && releaseMember.ordinal === disposition.releaseOrdinal
      && releaseMember.assetId === disposition.assetId
      && releaseMember.releaseRole === disposition.releaseRole
      && releaseMember.shardId === disposition.shardId
      && animation && animation.pairedFla === null
      && animation.source.path === disposition.sourceSwf.sourceFreezeManifestPath
      && animation.source.sha256 === disposition.sourceSwf.sha256
      && freezeEntries.get(disposition.sourceSwf.sourceFreezeManifestPath)
        === disposition.sourceSwf.sha256,
    `SWF-only disposition ${index + 1} differs from current catalogs or source freeze`);
  }
  invariant(seenReleaseOrdinals.size === 47 && seenAnimationIds.size === 47,
    "fixed queue/staging do not partition all 47 L10 release members exactly once");
  return deepFreeze({rows, release: release.release});
}

async function loadFixedInputs(projectRoot) {
  const [queuePhysical, stagingPhysical] = await Promise.all([
    readProjectFile(projectRoot, QUEUE_RELATIVE, "fixed L10 operator queue", {exactMode: "0444"}),
    readProjectFile(projectRoot, STAGING_RELATIVE, "fixed L10 staging manifest", {exactMode: "0444"}),
  ]);
  invariant(queuePhysical.sha256 === LESSON_ANIMATE_ONE_ROW_V2_FIXED_QUEUE_SHA256,
    "fixed queue SHA-256 drifted");
  invariant(stagingPhysical.sha256 === LESSON_ANIMATE_ONE_ROW_V2_FIXED_STAGING_SHA256,
    "fixed staging SHA-256 drifted");
  const queue = parseUtf8Json(queuePhysical.bytes, "fixed L10 operator queue");
  const staging = parseUtf8Json(stagingPhysical.bytes, "fixed L10 staging manifest");
  validateQueueDocument(queue);
  validateStagingDocument(staging);
  const catalogDescriptors = staging.inputs;
  const [lessonReleasesPhysical, animationsPhysical, sourceFreezePhysical] = await Promise.all([
    readProjectFile(projectRoot, LESSON_RELEASES_RELATIVE, "current lesson releases catalog",
      {exactMode: "0644"}),
    readProjectFile(projectRoot, ANIMATIONS_RELATIVE, "current animations catalog",
      {exactMode: "0644"}),
    readProjectFile(projectRoot, SOURCE_FREEZE_RELATIVE, "fixed source freeze manifest",
      {exactMode: "0600"}),
  ]);
  for (const [key, physical] of [
    ["lessonReleases", lessonReleasesPhysical],
    ["animations", animationsPhysical],
    ["sourceFreezeManifest", sourceFreezePhysical],
  ]) {
    const expected = catalogDescriptors[key];
    invariant(physical.sha256 === expected.sha256 && physical.size === expected.bytes
      && physical.mode === expected.mode,
    `staging input ${key} differs from its current physical file`);
  }
  invariant(sourceFreezePhysical.sha256
    === LESSON_ANIMATE_ONE_ROW_V2_FIXED_SOURCE_FREEZE_SHA256,
  "fixed source freeze SHA-256 drifted");
  const releaseCatalog = parseUtf8Json(lessonReleasesPhysical.bytes,
    "current lesson releases catalog");
  const animationsCatalog = parseUtf8Json(animationsPhysical.bytes,
    "current animations catalog");
  const freezeEntries = parseSourceFreeze(sourceFreezePhysical.bytes);
  const validated = validateQueueStagingAndCatalogs({
    queue,
    staging,
    releaseCatalog,
    animationsCatalog,
    freezeEntries,
  });
  return deepFreeze({
    queue,
    staging,
    queuePhysical,
    stagingPhysical,
    lessonReleasesPhysical,
    animationsPhysical,
    sourceFreezePhysical,
    freezeEntries,
    validated,
  });
}

function validateSourceBindingDocument(value, row) {
  assertExactKeys(value, [
    "acceptanceEffect", "evidenceId", "evidenceKind", "generatedBy", "intendedAudit",
    "schemaVersion", "shippedSwf", "source", "sourceKind", "workingCopy",
  ], "assist source binding");
  invariant(value.schemaVersion === 1
    && value.evidenceKind === "adobe-animate-read-only-paired-fla-swf-binding"
    && value.evidenceId === row.animationId && value.sourceKind === "paired-fla-swf"
    && value.acceptanceEffect === "none; work-only authoring evidence preparation",
  "assist source-binding identity or authority drifted");
  assertExactKeys(value.source, ["bytes", "file", "sha256"], "assist source binding.source");
  assertWorkingCopyDescriptor(value.workingCopy, "assist source binding.workingCopy");
  assertExactKeys(value.shippedSwf, ["source", "workingCopy"],
    "assist source binding.shippedSwf");
  assertExactKeys(value.shippedSwf.source, ["bytes", "file", "sha256"],
    "assist source binding.shippedSwf.source");
  assertWorkingCopyDescriptor(value.shippedSwf.workingCopy,
    "assist source binding.shippedSwf.workingCopy");
  assertExactKeys(value.intendedAudit, [
    "captureFrame", "frameAndInstanceScriptInventory", "nativeStagePng",
    "recursiveRootAndLibraryTimelines", "saveOrPublishAllowed",
  ], "assist source binding.intendedAudit");
  invariant(value.intendedAudit.captureFrame === 1
    && value.intendedAudit.frameAndInstanceScriptInventory === true
    && value.intendedAudit.nativeStagePng === true
    && value.intendedAudit.recursiveRootAndLibraryTimelines === true
    && value.intendedAudit.saveOrPublishAllowed === false,
  "assist source binding intended audit drifted");
  assertExactKeys(value.generatedBy, ["file", "sha256"], "assist source binding.generatedBy");
  invariant(value.generatedBy.file === "scripts/run-assisted-animate-authoring-audit.mjs"
    && HASH.test(value.generatedBy.sha256 || ""), "assist source binding generator drifted");
  invariant(value.source.file === row.sourceFla.file
    && value.source.sha256 === row.sourceFla.sha256
    && value.source.bytes === row.sourceFla.bytes
    && value.workingCopy.file
      === `work/animate/dependency-authoring-audits/${row.animationId}/working-copy/${path.posix.basename(row.sourceFla.file)}`
    && value.workingCopy.sha256 === row.sourceFla.sha256
    && value.workingCopy.bytes === row.sourceFla.bytes
    && value.shippedSwf.source.file === row.sourceSwf.file
    && value.shippedSwf.source.sha256 === row.sourceSwf.sha256
    && value.shippedSwf.source.bytes === row.sourceSwf.bytes
    && value.shippedSwf.workingCopy.file
      === `work/animate/dependency-authoring-audits/${row.animationId}/runtime-source/${path.posix.basename(row.sourceSwf.file)}`
    && value.shippedSwf.workingCopy.sha256 === row.sourceSwf.sha256
    && value.shippedSwf.workingCopy.bytes === row.sourceSwf.bytes,
  "assist source binding differs from the selected fixed row");
}

async function deriveSelectedRow(projectRoot, document, fixed) {
  assertExactKeys(document.release, [
    "publicationMode", "queueOrdinal", "releaseId", "releaseOrdinal", "releaseRole", "shardId",
  ], "authorization.release");
  invariant(document.release.releaseId === LESSON_ANIMATE_ONE_ROW_AUTHORIZATION_V2_RELEASE_ID
    && document.release.publicationMode === "atomic"
    && Number.isInteger(document.release.queueOrdinal)
    && document.release.queueOrdinal >= 1 && document.release.queueOrdinal <= 34
    && Number.isInteger(document.release.releaseOrdinal)
    && document.release.releaseOrdinal >= 1 && document.release.releaseOrdinal <= 47,
  "authorization release selection is invalid");
  assertExactKeys(document.member, ["animationId", "assetId", "fla", "swf"],
    "authorization.member");
  invariant(ID.test(document.member.animationId || "")
    && /^swf-[a-f0-9]{64}$/u.test(document.member.assetId || ""),
  "authorization member identity is invalid");
  const selected = fixed.validated.rows[document.release.queueOrdinal - 1];
  invariant(selected && selected.queueRow.releaseOrdinal === document.release.releaseOrdinal
    && selected.queueRow.animationId === document.member.animationId
    && selected.stagingRow.assetId === document.member.assetId,
  "authorization does not select the unique fixed FLA-backed queue row");
  const row = selected.queueRow;
  const sourceBindingRelative =
    `work/animate/dependency-authoring-audits/${row.animationId}/source-binding.json`;
  const [sourceBindingPhysical, sourceFlaPhysical, sourceSwfPhysical,
    releaseFlaPhysical, assistFlaPhysical, assistSwfPhysical, workspacePhysical] =
    await Promise.all([
      readProjectFile(projectRoot, sourceBindingRelative, "selected assist source binding",
        {exactMode: "0444", requireNonWritable: true}),
      readProjectFile(projectRoot, row.sourceFla.file, "selected canonical FLA",
        {exactMode: "0500", requireNonWritable: true}),
      readProjectFile(projectRoot, row.sourceSwf.file, "selected canonical SWF",
        {exactMode: "0500", requireNonWritable: true}),
      readProjectFile(projectRoot, row.workingCopy.file, "selected release FLA copy",
        {exactMode: "0444", requireNonWritable: true}),
      readProjectFile(projectRoot,
        `work/animate/dependency-authoring-audits/${row.animationId}/working-copy/${path.posix.basename(row.sourceFla.file)}`,
        "selected assist FLA copy", {exactMode: "0444", requireNonWritable: true}),
      readProjectFile(projectRoot,
        `work/animate/dependency-authoring-audits/${row.animationId}/runtime-source/${path.posix.basename(row.sourceSwf.file)}`,
        "selected assist SWF copy", {exactMode: "0444", requireNonWritable: true}),
      readProjectFile(projectRoot, row.workspaceManifest.file, "selected migration workspace manifest",
        {exactMode: "0644"}),
    ]);
  const sourceBinding = parseUtf8Json(sourceBindingPhysical.bytes, "selected assist source binding");
  validateSourceBindingDocument(sourceBinding, row);
  for (const [physical, legacy, label] of [
    [sourceFlaPhysical, row.sourceFla, "canonical FLA"],
    [sourceSwfPhysical, row.sourceSwf, "canonical SWF"],
    [releaseFlaPhysical, row.workingCopy, "release FLA copy"],
    [workspacePhysical, row.workspaceManifest, "migration workspace manifest"],
  ]) {
    invariant(physical.sha256 === legacy.sha256 && physical.size === legacy.bytes,
      `selected ${label} differs from the fixed queue/staging row`);
  }
  invariant(assistFlaPhysical.sha256 === row.sourceFla.sha256
    && assistFlaPhysical.size === row.sourceFla.bytes
    && assistSwfPhysical.sha256 === row.sourceSwf.sha256
    && assistSwfPhysical.size === row.sourceSwf.bytes,
  "selected assist copies differ from their canonical source bytes");
  const identities = [sourceFlaPhysical, sourceSwfPhysical, releaseFlaPhysical,
    assistFlaPhysical, assistSwfPhysical]
    .map((physical) => `${physical.identity.device}:${physical.identity.inode}`);
  invariant(new Set(identities).size === identities.length,
    "selected sources and release/assist copies must have independent physical inodes");

  const expectedMember = deepFreeze({
    animationId: row.animationId,
    assetId: selected.stagingRow.assetId,
    fla: {
      source: {
        ...descriptor(sourceFlaPhysical, projectRoot),
        sourceFreezeManifestPath: row.sourceFla.sourceFreezeManifestPath,
      },
      releaseWorkingCopy: descriptor(releaseFlaPhysical, projectRoot),
      assistWorkingCopy: descriptor(assistFlaPhysical, projectRoot),
    },
    swf: {
      source: {
        ...descriptor(sourceSwfPhysical, projectRoot),
        sourceFreezeManifestPath: row.sourceSwf.sourceFreezeManifestPath,
      },
      assistWorkingCopy: descriptor(assistSwfPhysical, projectRoot),
    },
  });
  assertExactKeys(document.member.fla, ["assistWorkingCopy", "releaseWorkingCopy", "source"],
    "authorization.member.fla");
  assertExactKeys(document.member.swf, ["assistWorkingCopy", "source"],
    "authorization.member.swf");
  assertExactDescriptor(document.member.fla.source, expectedMember.fla.source,
    "authorization.member.fla.source", {source: true});
  assertExactDescriptor(document.member.fla.releaseWorkingCopy,
    expectedMember.fla.releaseWorkingCopy, "authorization.member.fla.releaseWorkingCopy");
  assertExactDescriptor(document.member.fla.assistWorkingCopy,
    expectedMember.fla.assistWorkingCopy, "authorization.member.fla.assistWorkingCopy");
  assertExactDescriptor(document.member.swf.source, expectedMember.swf.source,
    "authorization.member.swf.source", {source: true});
  assertExactDescriptor(document.member.swf.assistWorkingCopy,
    expectedMember.swf.assistWorkingCopy, "authorization.member.swf.assistWorkingCopy");
  invariant(sameCanonical(document.member, expectedMember),
    "authorization.member differs from the independently derived physical row");
  const expectedRelease = deepFreeze({
    releaseId: LESSON_ANIMATE_ONE_ROW_AUTHORIZATION_V2_RELEASE_ID,
    publicationMode: "atomic",
    releaseOrdinal: row.releaseOrdinal,
    queueOrdinal: row.queueOrdinal,
    releaseRole: selected.stagingRow.releaseRole,
    shardId: row.shardId,
  });
  invariant(sameCanonical(document.release, expectedRelease),
    "authorization.release differs from the independently derived row");
  return deepFreeze({
    selected,
    expectedRelease,
    expectedMember,
    sourceBinding,
    sourceBindingPhysical,
    workspacePhysical,
    physical: deepFreeze({sourceFlaPhysical, sourceSwfPhysical, releaseFlaPhysical,
      assistFlaPhysical, assistSwfPhysical}),
  });
}

function validateAuthorizationRun(value, nowMs) {
  assertExactKeys(value, [
    "issuedAt", "nonce", "notAfter", "notBefore", "oneTimeUseRequired",
    "runId", "ttlSeconds",
  ], "authorization.run");
  invariant(RUN_ID.test(value.runId || "") && NONCE.test(value.nonce || "")
    && value.oneTimeUseRequired === true, "authorization runId, nonce, or one-time flag is invalid");
  const validity = validateValidity({
    issuedAt: value.issuedAt,
    notBefore: value.notBefore,
    notAfter: value.notAfter,
    ttlSeconds: value.ttlSeconds,
  }, "authorization.run", nowMs, {
    minimum: LESSON_ANIMATE_ONE_ROW_AUTHORIZATION_V2_MIN_TTL_SECONDS,
    maximum: LESSON_ANIMATE_ONE_ROW_AUTHORIZATION_V2_MAX_TTL_SECONDS,
  });
  return validity;
}

function validateAuthorizationOperator(value, assignment) {
  assertExactKeys(value, [
    "allowedHumanActions", "automationUsed", "fullName", "roleId", "stableSubjectId",
  ], "authorization.operator");
  invariant(value.roleId === "adobe-animate-human-dialog-operator"
    && normalizedHumanName(value.fullName, "authorization.operator.fullName")
      === assignment.fullName
    && normalizedHumanSubject(value.stableSubjectId,
      "authorization.operator.stableSubjectId") === assignment.stableSubjectId
    && sameCanonical(value.allowedHumanActions, [
      "acknowledge-legacy-actionscript-conversion-dialog",
      "close-without-saving",
    ]) && value.automationUsed === false,
  "authorization operator differs from the named primary human assignment");
}

async function validateExecutionClosure(receipt, projectRoot) {
  const canonical = Buffer.from(canonicalLessonAnimateExecutionCodeClosureJson(receipt.document));
  invariant(receipt.physical.bytes.equals(canonical),
    "execution-code closure receipt is not its exact canonical manifest JSON");
  const token = await validateLessonAnimateExecutionCodeClosureManifest({
    projectRoot,
    manifest: receipt.document,
  });
  const context = getValidatedLessonAnimateExecutionCodeClosureContext(token);
  invariant(context.manifestSha256 === receipt.physical.sha256
    && context.releaseId === LESSON_ANIMATE_ONE_ROW_AUTHORIZATION_V2_RELEASE_ID,
  "execution-code closure validator context differs from its content address");
  return deepFreeze({token, context});
}

function projectDescriptor(physical, projectRoot) {
  return descriptor(physical, projectRoot);
}

function buildExpectedBindings(projectRoot, assignment, fixed, selected, closureReceipt) {
  return deepFreeze({
    namedOperatorAssignmentReceipt: assignment.receipt.binding,
    releasePrepareOnlyQueue: projectDescriptor(fixed.queuePhysical, projectRoot),
    releaseStagingManifest: projectDescriptor(fixed.stagingPhysical, projectRoot),
    lessonReleasesCatalog: projectDescriptor(fixed.lessonReleasesPhysical, projectRoot),
    animationsCatalog: projectDescriptor(fixed.animationsPhysical, projectRoot),
    sourceFreezeManifest: projectDescriptor(fixed.sourceFreezePhysical, projectRoot),
    assistSourceBinding: projectDescriptor(selected.sourceBindingPhysical, projectRoot),
    executionCodeClosure: closureReceipt.binding,
  });
}

function validateAuthorizationBindings(value, expected) {
  const keys = [
    "animationsCatalog",
    "assistSourceBinding",
    "executionCodeClosure",
    "lessonReleasesCatalog",
    "namedOperatorAssignmentReceipt",
    "releasePrepareOnlyQueue",
    "releaseStagingManifest",
    "sourceFreezeManifest",
  ];
  assertExactKeys(value, keys, "authorization.bindings");
  for (const key of keys) {
    assertExactDescriptor(value[key], expected[key], `authorization.bindings.${key}`);
  }
  invariant(value.releasePrepareOnlyQueue.file === QUEUE_RELATIVE
    && value.releasePrepareOnlyQueue.sha256 === LESSON_ANIMATE_ONE_ROW_V2_FIXED_QUEUE_SHA256
    && value.releaseStagingManifest.file === STAGING_RELATIVE
    && value.releaseStagingManifest.sha256 === LESSON_ANIMATE_ONE_ROW_V2_FIXED_STAGING_SHA256
    && value.sourceFreezeManifest.file === SOURCE_FREEZE_RELATIVE
    && value.sourceFreezeManifest.sha256 === LESSON_ANIMATE_ONE_ROW_V2_FIXED_SOURCE_FREEZE_SHA256,
  "authorization fixed queue, staging, or source-freeze binding drifted");
  invariant(sameCanonical(value, expected),
    "authorization bindings differ from independently re-read fixed inputs");
}

function trustFingerprint(trustResult, trustContext) {
  return deepFreeze({
    productionAnchor: trustContext.productionAnchor,
    trustRootId: trustContext.trustRootId,
    trustRootFile: trustContext.trustRootFile,
    trustRootFileSha256: trustContext.trustRootFileSha256,
    ownerSubjectId: trustContext.ownerSubjectId,
    ownerPublicKeySha256: trustContext.ownerPublicKeySha256,
    ownerKeyFingerprintSha256: trustContext.ownerKeyFingerprintSha256,
    trustRootBindingSha256: trustResult.trustRootBindingSha256,
  });
}

function bindingFingerprint(context) {
  const selectedPhysical = Object.fromEntries(Object.entries(context.selected.physical)
    .map(([key, physical]) => [key, physical.identity]));
  const inputIdentity = {
    assignment: context.assignment.receipt.physical.identity,
    authorization: context.authorizationReceipt.physical.identity,
    executionCodeClosure: context.closureReceipt.physical.identity,
    queue: context.fixed.queuePhysical.identity,
    staging: context.fixed.stagingPhysical.identity,
    lessonReleases: context.fixed.lessonReleasesPhysical.identity,
    animations: context.fixed.animationsPhysical.identity,
    sourceFreeze: context.fixed.sourceFreezePhysical.identity,
    sourceBinding: context.selected.sourceBindingPhysical.identity,
    workspaceManifest: context.selected.workspacePhysical.identity,
    ...selectedPhysical,
  };
  return sha256(Buffer.from(canonicalLessonAnimateOneRowAuthorizationV2Json({
    assignmentSha256: context.assignment.receipt.physical.sha256,
    authorizationSha256: context.authorizationReceipt.physical.sha256,
    executionCodeClosureSha256: context.closureReceipt.physical.sha256,
    trust: context.trustFingerprint,
    inputs: inputIdentity,
    executionCodeClosure: context.closure.context,
  })));
}

async function assertRealProjectRoot(projectRoot) {
  invariant(typeof projectRoot === "string" && path.isAbsolute(projectRoot)
    && path.resolve(projectRoot) === projectRoot, "projectRoot must be normalized and absolute");
  invariant(await realpath(projectRoot) === projectRoot,
    "projectRoot may not resolve through a symbolic link");
  const information = await lstat(projectRoot, {bigint: true});
  invariant(information.isDirectory() && !information.isSymbolicLink(),
    "projectRoot must be one real directory");
  return projectRoot;
}

async function assertProductionProcessEntrypoint(projectRoot, options) {
  invariant(typeof process.argv[1] === "string" && process.argv[1].length > 0,
    "production verification requires a directly executed process entrypoint");
  const expected = resolveProjectFile(projectRoot,
    LESSON_ANIMATE_ONE_ROW_V2_PRODUCTION_RUNNER_ENTRYPOINT,
    "production dedicated runner entrypoint");
  const supplied = path.resolve(process.argv[1]);
  invariant(supplied === expected,
    "production verification must run only from the exact dedicated runner process entrypoint");
  invariant(await realpath(supplied) === expected,
    "production dedicated runner process entrypoint or an ancestor is a symbolic link");
  const information = await lstat(supplied, {bigint: true});
  invariant(information.isFile() && !information.isSymbolicLink()
    && information.nlink === 1n,
  "production dedicated runner process entrypoint must be one ordinary single-link file");
  invariant(MODULE_FILE !== expected,
    "authorization module may not be used as the production process entrypoint");
  invariant(Array.isArray(process.execArgv) && process.execArgv.length === 0,
    "production dedicated runner forbids Node preload, loader, eval, inspect, and other execArgv flags");
  const expectedArguments = [options.assignmentSha256, options.authorizationSha256,
    options.executionCodeClosureSha256];
  invariant(process.argv.length === 5
    && process.argv.slice(2).every((value, index) => value === expectedArguments[index]),
  "production dedicated runner process arguments differ from the exact three receipt hashes");
  invariant(process.env.PATH === "/usr/bin:/bin"
    && process.env.LANG === "C" && process.env.LC_ALL === "C",
  "production dedicated runner requires the fixed launcher-clean PATH/LANG/LC_ALL environment");
  for (const name of ["NODE_OPTIONS", "NODE_PATH", "NODE_REPL_EXTERNAL_MODULE",
    "NODE_V8_COVERAGE", "NODE_INSPECT_RESUME_ON_START"]) {
    invariant(!Object.hasOwn(process.env, name) || process.env[name] === "",
      `production dedicated runner forbids ${name}`);
  }
  for (const [name, value] of Object.entries(process.env)) {
    invariant(!(typeof value === "string" && value.length > 0
      && (/^(?:DYLD_|LD_|NODE_)/u.test(name)
        || ["BASH_ENV", "ENV", "ZDOTDIR", "CDPATH", "ELECTRON_RUN_AS_NODE"]
          .includes(name))),
    `production dedicated runner forbids inherited loader environment ${name}`);
  }
}

async function verifyWithTrust({
  projectRoot,
  assignmentSha256,
  authorizationSha256,
  executionCodeClosureSha256,
  trustResult,
  trustContext,
  nowMs,
  diagnosticOnly,
}) {
  await assertRealProjectRoot(projectRoot);
  invariant(trustContext.projectRoot === projectRoot,
    "loaded trust token belongs to a different projectRoot");
  invariant(trustContext.productionAnchor === !diagnosticOnly,
    "trust token production/diagnostic isolation drifted");
  if (!diagnosticOnly) {
    invariant(trustContext.productionReplayLockRoot
      === LESSON_ANIMATE_ONE_ROW_V2_PRODUCTION_REPLAY_ROOT,
    "production trust context does not bind the fixed replay root");
  }
  const [assignmentReceipt, authorizationReceipt, closureReceipt, fixed] = await Promise.all([
    readAuthorityReceipt(projectRoot, "assignments", assignmentSha256,
      "named-human assignment v2"),
    readAuthorityReceipt(projectRoot, "session-authorizations", authorizationSha256,
      "one-row authorization v2"),
    readAuthorityReceipt(projectRoot, "execution-code-closures", executionCodeClosureSha256,
      "execution-code closure manifest"),
    loadFixedInputs(projectRoot),
  ]);
  const assignment = validateAssignment(assignmentReceipt, trustContext, nowMs);
  const authorization = authorizationReceipt.document;
  requireCanonicalReceiptBytes(authorizationReceipt, "one-row authorization v2");
  assertExactKeys(authorization, [
    "authorityBoundary", "authorizationType", "bindings", "decision", "member", "operator",
    "release", "run", "schemaVersion", "signature", "trust",
  ], "one-row authorization v2");
  invariant(authorization.schemaVersion === LESSON_ANIMATE_ONE_ROW_AUTHORIZATION_V2_SCHEMA_VERSION
    && authorization.authorizationType === AUTHORIZATION_KIND
    && authorization.decision === "authorize-once",
  "one-row authorization v2 identity or decision drifted");
  validateSignedTrustBinding(authorization.trust, trustBinding(trustContext),
    "authorization.trust");
  const runValidity = validateAuthorizationRun(authorization.run, nowMs);
  invariant(runValidity.notBeforeMs >= assignment.validity.notBeforeMs
    && runValidity.notAfterMs <= assignment.validity.notAfterMs,
  "authorization run validity must remain inside the named-human assignment validity");
  validateAuthorizationOperator(authorization.operator, assignment);
  validateAllFalseBoundary(authorization.authorityBoundary,
    "authorization.authorityBoundary");
  const selected = await deriveSelectedRow(projectRoot, authorization, fixed);
  const closure = await validateExecutionClosure(closureReceipt, projectRoot);
  if (!diagnosticOnly) {
    invariant(typeof LESSON_ANIMATE_ONE_ROW_V2_PRODUCTION_RUNNER_ENTRYPOINT === "string"
      && LESSON_ANIMATE_ONE_ROW_V2_PRODUCTION_RUNNER_ENTRYPOINT.length > 0,
    "production dedicated opaque-claim runner entrypoint is not configured");
    invariant(closure.context.entrypoint
      === LESSON_ANIMATE_ONE_ROW_V2_PRODUCTION_RUNNER_ENTRYPOINT,
    "production execution-code closure does not bind the exact dedicated opaque-claim runner entrypoint");
    invariant(closure.context.productionReplayLockHelperBound === true,
      "production verification requires the fixed root-owned replay-lock helper in the execution-code closure");
  }
  const bindings = buildExpectedBindings(projectRoot, assignment, fixed, selected, closureReceipt);
  validateAuthorizationBindings(authorization.bindings, bindings);
  validateSignature(authorization, trustContext, "one-row authorization v2");
  const context = {
    projectRoot,
    digests: deepFreeze({assignmentSha256, authorizationSha256,
      executionCodeClosureSha256}),
    trustFingerprint: trustFingerprint(trustResult, trustContext),
    assignment,
    authorization,
    authorizationReceipt,
    closureReceipt,
    closure,
    fixed,
    selected,
    runValidity,
    diagnosticOnly,
    consumeStarted: false,
  };
  context.bindingFingerprintSha256 = bindingFingerprint(context);
  const token = deepFreeze({
    ok: true,
    status: diagnosticOnly
      ? "diagnostic-verified-not-consumable"
      : "production-verified-not-consumed-not-launched",
    diagnosticOnly,
    releaseId: LESSON_ANIMATE_ONE_ROW_AUTHORIZATION_V2_RELEASE_ID,
    releaseOrdinal: authorization.release.releaseOrdinal,
    queueOrdinal: authorization.release.queueOrdinal,
    animationId: authorization.member.animationId,
    assetId: authorization.member.assetId,
    runId: authorization.run.runId,
    assignmentSha256,
    authorizationSha256,
    executionCodeClosureSha256,
    nonceSha256: sha256(Buffer.from(authorization.run.nonce, "utf8")),
    expiresAt: authorization.run.notAfter,
    operatorFullName: assignment.fullName,
    ownerSignatureVerified: true,
    consumed: false,
    runtimeLaunched: false,
    acceptanceEffect: "none",
  });
  (diagnosticOnly ? VERIFIED_DIAGNOSTIC : VERIFIED_PRODUCTION).set(token, context);
  return token;
}

function exactOptions(options, keys, label) {
  assertExactKeys(options, keys, label);
  assertSha256(options.assignmentSha256, `${label}.assignmentSha256`);
  assertSha256(options.authorizationSha256, `${label}.authorizationSha256`);
  assertSha256(options.executionCodeClosureSha256,
    `${label}.executionCodeClosureSha256`);
}

export async function verifyLessonAnimateOneRowAuthorizationV2(options) {
  invariant(arguments.length === 1,
    "production verifier accepts exactly one fixed-schema options object");
  exactOptions(options, PRODUCTION_OPTION_KEYS, "production verifier options");
  const projectRoot = await assertRealProjectRoot(options.projectRoot);
  await assertProductionProcessEntrypoint(projectRoot, options);
  const trustResult = await loadLessonAnimateProductionTrustRoot({projectRoot});
  if (!LESSON_ANIMATE_ONE_ROW_V2_NATIVE_LAUNCH_CAPABILITY_ENABLED) {
    const error = new Error(
      "Lesson Animate one-row authorization v2: production remains blocked until a reviewed fixed root-owned native launcher/capability replaces mutable JavaScript process identity and plain-context handoff",
    );
    error.code = "L10_AA_NATIVE_LAUNCH_CAPABILITY_UNAVAILABLE";
    throw error;
  }
  const trustContext = lessonAnimateTrustContext(trustResult);
  const token = await verifyWithTrust({
    ...options,
    projectRoot,
    trustResult,
    trustContext,
    nowMs: trustContext.loadedAtMs,
    diagnosticOnly: false,
  });
  await assertFreshExecutionState(VERIFIED_PRODUCTION.get(token));
  return token;
}

export async function verifyLessonAnimateOneRowAuthorizationV2Diagnostic(options) {
  invariant(arguments.length === 1,
    "diagnostic verifier accepts exactly one fixed-schema options object");
  exactOptions(options, DIAGNOSTIC_OPTION_KEYS, "diagnostic verifier options");
  const projectRoot = await assertRealProjectRoot(options.projectRoot);
  const trustContext = lessonAnimateTrustContext(options.trustToken, {requireProduction: false});
  invariant(trustContext.productionAnchor === false,
    "diagnostic verifier requires the opaque diagnostic trust token");
  const nowMs = normalizeNow(options.now, "diagnostic verifier now");
  return verifyWithTrust({
    projectRoot,
    assignmentSha256: options.assignmentSha256,
    authorizationSha256: options.authorizationSha256,
    executionCodeClosureSha256: options.executionCodeClosureSha256,
    trustResult: options.trustToken,
    trustContext,
    nowMs,
    diagnosticOnly: true,
  });
}

async function hasExtendedAcl(absolute, label = "fixed production replay root") {
  const {stdout, stderr} = await execFileAsync("/bin/ls", ["-ldeO", absolute], {
    encoding: "utf8",
    env: {LANG: "C", LC_ALL: "C", PATH: "/usr/bin:/bin"},
    maxBuffer: 64 * 1024,
  });
  invariant(stderr === "", `could not inspect ${label} ACL`);
  const lines = stdout.split(/\r?\n/u);
  const firstLine = lines.find((line) => line.trim().length > 0);
  invariant(typeof firstLine === "string",
    `${label} ACL inspection returned no record`);
  const modeToken = firstLine.trimStart().split(/\s+/u)[0];
  invariant(/^[dl-][rwxstST-]{9}[@+]?$/u.test(modeToken),
    `${label} ACL inspection returned an unrecognized mode`);
  // macOS may render a numbered ACL record below a first-line mode ending in
  // `@` rather than `+` (for example after `chmod +a`). Treat either spelling
  // as ACL authority; `@` alone remains an extended-attribute marker.
  return modeToken.endsWith("+")
    || lines.some((line) => /^\s*[0-9]+:\s/u.test(line));
}

async function stableReplayRoot() {
  const replayRoot = LESSON_ANIMATE_ONE_ROW_V2_PRODUCTION_REPLAY_ROOT;
  invariant(await realpath(replayRoot) === replayRoot,
    "fixed production replay root or an ancestor is a symbolic link");
  const before = await lstat(replayRoot, {bigint: true});
  invariant(before.isDirectory() && !before.isSymbolicLink()
    && (before.mode & 0o7777n) === 0o700n,
  "fixed production replay root must pre-exist as one real exact-0700 directory");
  const beforeIdentity = physicalIdentity(before);
  const acl = await hasExtendedAcl(replayRoot);
  invariant(acl === false, "fixed production replay root may not carry an extended ACL");
  const handle = await open(replayRoot,
    fsConstants.O_RDONLY | fsConstants.O_DIRECTORY | fsConstants.O_NOFOLLOW);
  try {
    const descriptorIdentity = physicalIdentity(await handle.stat({bigint: true}));
    invariant(samePhysicalIdentity(beforeIdentity, descriptorIdentity),
      "fixed production replay root changed before its descriptor was pinned");
  } finally {
    await handle.close();
  }
  const after = await lstat(replayRoot, {bigint: true});
  invariant(samePhysicalIdentity(beforeIdentity, physicalIdentity(after))
    && (after.mode & 0o7777n) === 0o700n
    && await realpath(replayRoot) === replayRoot,
  "fixed production replay root changed while inspected");
  return beforeIdentity;
}

async function assertPathAbsent(absolute, label) {
  try {
    await lstat(absolute);
  } catch (error) {
    if (error?.code === "ENOENT") return true;
    throw error;
  }
  invariant(false, `${label} already exists`);
}

function runDirectory(context) {
  return path.join(context.projectRoot, "work", "animate", "dependency-authoring-audits",
    context.authorization.member.animationId, "runs", context.authorization.run.runId);
}

async function assertFreshExecutionState(context) {
  await stableReplayRoot();
  const receiptBytes = Buffer.from(canonicalLessonAnimateOneRowAuthorizationV2Json(
    replayReceipt(context),
  ));
  // The native bridge is the sole authority that derives the receipt-addressed
  // lock leaf and performs the atomic absence decision.
  await assertPathAbsent(runDirectory(context), "authorized run directory");
  return deepFreeze({receiptBytes});
}

async function revalidateProductionContext(context) {
  const trustResult = await loadLessonAnimateProductionTrustRoot({projectRoot: context.projectRoot});
  const trustContext = lessonAnimateTrustContext(trustResult);
  const freshToken = await verifyWithTrust({
    projectRoot: context.projectRoot,
    ...context.digests,
    trustResult,
    trustContext,
    nowMs: trustContext.loadedAtMs,
    diagnosticOnly: false,
  });
  const fresh = VERIFIED_PRODUCTION.get(freshToken);
  invariant(fresh && fresh.bindingFingerprintSha256 === context.bindingFingerprintSha256
    && sameCanonical(fresh.trustFingerprint, context.trustFingerprint),
  "production trust or a fixed signed/physical input changed after verification");
  const reboundClosureToken =
    await assertValidatedLessonAnimateExecutionCodeClosureStillBound(context.closure.token);
  const reboundContext = getValidatedLessonAnimateExecutionCodeClosureContext(reboundClosureToken);
  invariant(sameCanonical(reboundContext, context.closure.context),
    "execution-code closure changed after authorization verification");
  invariant(reboundContext.productionReplayLockHelperBound === true,
    "rebound production closure lost its fixed root-owned replay-lock helper binding");
  return deepFreeze({fresh, reboundClosureToken});
}

function replayReceipt(context) {
  const authorization = context.authorization;
  const base = {
    schemaVersion: 2,
    receiptType: "lesson-g04-l10-animate-one-time-authorization-v2-atomic-replay-lock",
    status: "authorization-consumed-launch-not-yet-attempted",
    releaseId: LESSON_ANIMATE_ONE_ROW_AUTHORIZATION_V2_RELEASE_ID,
    releaseOrdinal: authorization.release.releaseOrdinal,
    queueOrdinal: authorization.release.queueOrdinal,
    animationId: authorization.member.animationId,
    assetId: authorization.member.assetId,
    runId: authorization.run.runId,
    assignmentSha256: context.digests.assignmentSha256,
    authorizationSha256: context.digests.authorizationSha256,
    executionCodeClosureSha256: context.digests.executionCodeClosureSha256,
    nonceSha256: sha256(Buffer.from(authorization.run.nonce, "utf8")),
    authorizationIssuedAt: authorization.run.issuedAt,
    authorizationNotBefore: authorization.run.notBefore,
    authorizationNotAfter: authorization.run.notAfter,
    runtimeLaunched: false,
    authorityBoundary: AUTHORITY_BOUNDARY,
  };
  return deepFreeze({
    ...base,
    receiptFingerprintSha256: sha256(Buffer.from(
      canonicalLessonAnimateOneRowAuthorizationV2Json(base))),
  });
}

export async function consumeLessonAnimateOneRowAuthorizationV2(verifiedToken) {
  invariant(arguments.length === 1,
    "production consumer accepts exactly one opaque verified token and no options or hooks");
  const context = verifiedToken && VERIFIED_PRODUCTION.get(verifiedToken);
  invariant(context,
    "production consumer requires the opaque production verified token; diagnostic or forged values are forbidden");
  invariant(context.consumeStarted === false,
    "this production verified token already has a consumption attempt");
  // Set synchronously before the first await. Cross-process and independently
  // re-verified concurrency is resolved by the deterministic native CAS.
  context.consumeStarted = true;
  const rebound = await revalidateProductionContext(context);
  const freshState = await assertFreshExecutionState(rebound.fresh);
  const consumedAtMs = Date.now();
  invariant(consumedAtMs >= rebound.fresh.runValidity.notBeforeMs
    && consumedAtMs <= rebound.fresh.runValidity.notAfterMs,
  "authorization expired immediately before atomic consumption");
  // Receipt bytes are a pure function of opaque, owner-signed context. They
  // deliberately contain no consumption wall clock, caller value, or hook.
  const receipt = replayReceipt(rebound.fresh);
  const receiptBytes = freshState.receiptBytes;
  let atomicLock;
  try {
    atomicLock = await createLessonAnimatePrebuiltAtomicReplayLock({
      validatedCodeClosureToken: rebound.reboundClosureToken,
      replayRoot: LESSON_ANIMATE_ONE_ROW_V2_PRODUCTION_REPLAY_ROOT,
      receiptBytes,
    });
  } catch (error) {
    if (error?.code === "EEXIST") {
      const duplicate = new Error(
        "Lesson Animate one-row authorization v2: session nonce was already consumed",
      );
      duplicate.code = "EALREADYCONSUMED";
      throw duplicate;
    }
    throw error;
  }
  const receiptSha256 = sha256(receiptBytes);
  const expectedReplayLockPath = path.join(
    LESSON_ANIMATE_ONE_ROW_V2_PRODUCTION_REPLAY_ROOT,
    `${receiptSha256}.lock.json`,
  );
  invariant(atomicLock.receiptSha256 === receiptSha256
    && atomicLock.bytes === receiptBytes.length
    && atomicLock.replayLockIdentity.path === expectedReplayLockPath
    && atomicLock.replayLockIdentity.sha256 === receiptSha256,
  "atomic replay bridge result differs from its internally derived receipt-addressed lock");
  const token = deepFreeze({
    ok: true,
    status: "production-consumed-once-launch-not-yet-attempted",
    diagnosticOnly: false,
    releaseId: verifiedToken.releaseId,
    releaseOrdinal: verifiedToken.releaseOrdinal,
    queueOrdinal: verifiedToken.queueOrdinal,
    animationId: verifiedToken.animationId,
    assetId: verifiedToken.assetId,
    runId: verifiedToken.runId,
    assignmentSha256: verifiedToken.assignmentSha256,
    authorizationSha256: verifiedToken.authorizationSha256,
    executionCodeClosureSha256: verifiedToken.executionCodeClosureSha256,
    nonceSha256: verifiedToken.nonceSha256,
    replayLockSha256: atomicLock.replayLockIdentity.sha256,
    expiresAt: verifiedToken.expiresAt,
    ownerSignatureVerified: true,
    consumed: true,
    runtimeLaunched: false,
    acceptanceEffect: "none",
  });
  CONSUMED_PRODUCTION.set(token, {
    context: rebound.fresh,
    receipt,
    receiptBytes,
    atomicLock,
    claimStarted: false,
  });
  return token;
}

async function assertReplayLockStillBound(consumed) {
  const rootIdentity = await stableReplayRoot();
  const expectedRoot = consumed.atomicLock.replayRootIdentity;
  invariant(rootIdentity.device === expectedRoot.device
    && rootIdentity.inode === expectedRoot.inode && rootIdentity.mode === expectedRoot.mode
    && rootIdentity.uid === expectedRoot.uid && rootIdentity.gid === expectedRoot.gid,
  "production replay root identity changed after consumption");
  const lock = consumed.atomicLock.replayLockIdentity;
  const physical = await stableRegularFile(lock.path, "committed authorization replay lock",
    {exactMode: "0400", requireNonWritable: true});
  invariant(physical.bytes.equals(consumed.receiptBytes)
    && physical.sha256 === lock.sha256 && physical.size === lock.bytes
    && physical.identity.device === lock.device && physical.identity.inode === lock.inode,
  "committed authorization replay lock bytes or physical identity changed");
}

function frozenExecutionContext(context, closureContext) {
  const authorization = context.authorization;
  const member = structuredClone(authorization.member);
  const bindings = structuredClone(authorization.bindings);
  const toolchain = structuredClone(closureContext.toolchainDescriptors);
  const result = {
    releaseId: LESSON_ANIMATE_ONE_ROW_AUTHORIZATION_V2_RELEASE_ID,
    releaseOrdinal: authorization.release.releaseOrdinal,
    queueOrdinal: authorization.release.queueOrdinal,
    releaseRole: authorization.release.releaseRole,
    shardId: authorization.release.shardId,
    animationId: authorization.member.animationId,
    assetId: authorization.member.assetId,
    runId: authorization.run.runId,
    nonceSha256: sha256(Buffer.from(authorization.run.nonce, "utf8")),
    expiresAt: authorization.run.notAfter,
    receipts: {
      assignmentSha256: context.digests.assignmentSha256,
      authorizationSha256: context.digests.authorizationSha256,
      executionCodeClosureSha256: context.digests.executionCodeClosureSha256,
    },
    operator: {
      roleId: authorization.operator.roleId,
      fullName: authorization.operator.fullName,
      stableSubjectId: authorization.operator.stableSubjectId,
      allowedHumanActions: [...authorization.operator.allowedHumanActions],
      automationUsed: false,
    },
    member,
    bindings,
    paths: {
      runDirectory: runDirectory(context),
      sourceFla: resolveProjectFile(context.projectRoot, member.fla.source.file, "source FLA"),
      sourceSwf: resolveProjectFile(context.projectRoot, member.swf.source.file, "source SWF"),
      releaseFlaWorkingCopy: resolveProjectFile(context.projectRoot,
        member.fla.releaseWorkingCopy.file, "release FLA working copy"),
      assistFlaWorkingCopy: resolveProjectFile(context.projectRoot,
        member.fla.assistWorkingCopy.file, "assist FLA working copy"),
      assistSwfWorkingCopy: resolveProjectFile(context.projectRoot,
        member.swf.assistWorkingCopy.file, "assist SWF working copy"),
      assistSourceBinding: resolveProjectFile(context.projectRoot,
        bindings.assistSourceBinding.file, "assist source binding"),
    },
    audit: {
      captureFrame: PRODUCTION_CAPTURE_FRAME,
      timeoutMs: PRODUCTION_ANIMATE_TIMEOUT_MS,
      animateExecutable: toolchain.animateExecutable.file,
      auditJsfl: toolchain.jsfl.file,
      processProbe: toolchain.processProbe.file,
      replayLockHelper: toolchain.replayLockHelper.file,
      oneFlaPerColdStartProcess: true,
      openOnlyReadOnlyAssistWorkingCopy: true,
      closeWithoutSaving: true,
      saveAllowed: false,
      publishAllowed: false,
      automatedDialogInteractionAllowed: false,
    },
    executionCodeClosure: {
      manifestSha256: closureContext.manifestSha256,
      entrypoint: closureContext.entrypoint,
      platform: closureContext.platform,
      arch: closureContext.arch,
      moduleCount: closureContext.moduleCount,
      toolchain,
      productionReplayLockHelperBound:
        closureContext.productionReplayLockHelperBound,
    },
    trust: {
      trustRootId: context.trustFingerprint.trustRootId,
      ownerSubjectId: context.trustFingerprint.ownerSubjectId,
      ownerPublicKeySha256: context.trustFingerprint.ownerPublicKeySha256,
      ownerKeyFingerprintSha256: context.trustFingerprint.ownerKeyFingerprintSha256,
    },
    authorityBoundary: structuredClone(AUTHORITY_BOUNDARY),
    acceptanceEffect: "none",
  };
  return deepFreeze(result);
}

export async function claimLessonAnimateOneRowExecutionV2(consumedToken) {
  invariant(arguments.length === 1,
    "production claim accepts exactly one opaque consumed token and no execution identity or hooks");
  const consumed = consumedToken && CONSUMED_PRODUCTION.get(consumedToken);
  invariant(consumed,
    "production claim requires the opaque production consumed token; diagnostic or forged values are forbidden");
  invariant(consumed.claimStarted === false, "this consumed authorization already has an execution claim");
  // Set synchronously before the first await so two concurrent callers cannot both claim.
  consumed.claimStarted = true;
  const rebound = await revalidateProductionContext(consumed.context);
  await assertReplayLockStillBound(consumed);
  await assertPathAbsent(runDirectory(rebound.fresh), "authorized run directory");
  const nowMs = Date.now();
  invariant(nowMs >= rebound.fresh.runValidity.notBeforeMs
    && nowMs <= rebound.fresh.runValidity.notAfterMs,
  "consumed authorization expired before its single execution claim");
  const closureToken = await assertValidatedLessonAnimateExecutionCodeClosureStillBound(
    rebound.reboundClosureToken,
  );
  const closureContext = getValidatedLessonAnimateExecutionCodeClosureContext(closureToken);
  const executionContext = frozenExecutionContext(rebound.fresh, closureContext);
  const token = deepFreeze({
    ok: true,
    status: "production-execution-claimed-once-not-launched",
    diagnosticOnly: false,
    releaseId: consumedToken.releaseId,
    animationId: consumedToken.animationId,
    assetId: consumedToken.assetId,
    runId: consumedToken.runId,
    nonceSha256: consumedToken.nonceSha256,
    authorizationSha256: consumedToken.authorizationSha256,
    consumed: true,
    executionClaimed: true,
    runtimeLaunched: false,
    acceptanceEffect: "none",
  });
  CLAIMED_PRODUCTION.set(token, {
    consumed,
    executionContext,
    closureToken,
    handoffStarted: false,
    launchAttemptStarted: false,
  });
  return token;
}

export async function takeLessonAnimateOneRowExecutionContextV2(claimToken) {
  invariant(arguments.length === 1,
    "execution-context handoff accepts exactly one opaque claim token");
  const claimed = claimToken && CLAIMED_PRODUCTION.get(claimToken);
  invariant(claimed,
    "execution-context handoff requires the opaque production claim token");
  invariant(claimed.handoffStarted === false,
    "this production execution claim already has a handoff attempt");
  // Set synchronously before the first await. A concurrent or later caller can
  // never acquire a second context, even if this conservative handoff attempt
  // subsequently fails one of the physical/trust checks below.
  claimed.handoffStarted = true;

  const rebound = await revalidateProductionContext(claimed.consumed.context);
  await assertReplayLockStillBound(claimed.consumed);
  await assertPathAbsent(runDirectory(rebound.fresh), "authorized run directory");
  const nowMs = Date.now();
  invariant(nowMs >= rebound.fresh.runValidity.notBeforeMs
    && nowMs <= rebound.fresh.runValidity.notAfterMs,
  "consumed authorization expired before its one-time execution-context handoff");

  const claimClosureToken =
    await assertValidatedLessonAnimateExecutionCodeClosureStillBound(claimed.closureToken);
  const claimClosureContext =
    getValidatedLessonAnimateExecutionCodeClosureContext(claimClosureToken);
  const reboundClosureContext =
    getValidatedLessonAnimateExecutionCodeClosureContext(rebound.reboundClosureToken);
  invariant(sameCanonical(claimClosureContext, reboundClosureContext),
    "execution-code closure changed after the single execution claim");
  invariant(claimClosureContext.productionReplayLockHelperBound === true,
    "execution-context handoff lost its fixed production helper binding");

  const freshExecutionContext = frozenExecutionContext(rebound.fresh, claimClosureContext);
  invariant(sameCanonical(freshExecutionContext, claimed.executionContext),
    "execution context changed after the single execution claim");
  // The dedicated generic entrypoint must accept only the opaque claim token,
  // call this take internally, and never expose or return this plain context.
  // Until that wrapper also binds its exact closure entrypoint and process
  // identity, production launch remains deliberately incomplete/fail-closed.
  return deepFreeze(structuredClone(freshExecutionContext));
}

export async function beginLessonAnimateOneRowLaunchAttemptV2(claimToken) {
  invariant(arguments.length === 1,
    "launch-attempt transition accepts exactly one opaque claim token");
  const claimed = claimToken && CLAIMED_PRODUCTION.get(claimToken);
  invariant(claimed,
    "launch-attempt transition requires the opaque production claim token");
  invariant(claimed.handoffStarted === true,
    "launch-attempt transition requires the dedicated runner to take its context first");
  invariant(claimed.launchAttemptStarted === false,
    "this production execution claim already has a launch attempt");
  // Flip synchronously before the first await. From this point forward a crash
  // is conservatively an attempted/possibly launched run and can never obtain
  // a second pre-spawn authority transition.
  claimed.launchAttemptStarted = true;

  const rebound = await revalidateProductionContext(claimed.consumed.context);
  await assertReplayLockStillBound(claimed.consumed);
  const nowMs = Date.now();
  invariant(nowMs >= rebound.fresh.runValidity.notBeforeMs
    && nowMs <= rebound.fresh.runValidity.notAfterMs,
  "consumed authorization expired immediately before its single launch attempt");

  const claimClosureToken =
    await assertValidatedLessonAnimateExecutionCodeClosureStillBound(claimed.closureToken);
  const claimClosureContext =
    getValidatedLessonAnimateExecutionCodeClosureContext(claimClosureToken);
  const reboundClosureContext =
    getValidatedLessonAnimateExecutionCodeClosureContext(rebound.reboundClosureToken);
  invariant(sameCanonical(claimClosureContext, reboundClosureContext),
    "execution-code closure changed before the single launch attempt");
  invariant(claimClosureContext.entrypoint
    === LESSON_ANIMATE_ONE_ROW_V2_PRODUCTION_RUNNER_ENTRYPOINT,
  "launch attempt lost the exact dedicated runner entrypoint binding");
  invariant(claimClosureContext.productionReplayLockHelperBound === true,
    "launch attempt lost its fixed production helper binding");
  const freshExecutionContext = frozenExecutionContext(rebound.fresh, claimClosureContext);
  invariant(sameCanonical(freshExecutionContext, claimed.executionContext),
    "execution context changed before the single launch attempt");

  const token = deepFreeze({
    ok: true,
    status: "production-launch-attempt-authority-revalidated-once",
    diagnosticOnly: false,
    releaseId: claimToken.releaseId,
    animationId: claimToken.animationId,
    assetId: claimToken.assetId,
    runId: claimToken.runId,
    nonceSha256: claimToken.nonceSha256,
    authorizationSha256: claimToken.authorizationSha256,
    consumed: true,
    executionClaimed: true,
    launchAttempted: true,
    runtimeLaunched: "possible-or-unknown-after-launch-intent",
    acceptanceEffect: "none",
  });
  LAUNCH_ATTEMPTS_PRODUCTION.set(token, {claimed});
  return token;
}

export function lessonAnimateOneRowAuthorizationV2FixedPaths(projectRoot) {
  invariant(arguments.length === 1, "fixed-path reader accepts exactly projectRoot");
  invariant(typeof projectRoot === "string" && path.isAbsolute(projectRoot),
    "projectRoot must be absolute");
  return deepFreeze({
    authorityRoot: path.join(projectRoot, ...AUTHORITY_ROOT_RELATIVE.split("/")),
    queue: path.join(projectRoot, ...QUEUE_RELATIVE.split("/")),
    staging: path.join(projectRoot, ...STAGING_RELATIVE.split("/")),
    sourceFreeze: path.join(projectRoot, ...SOURCE_FREEZE_RELATIVE.split("/")),
    replayRoot: LESSON_ANIMATE_ONE_ROW_V2_PRODUCTION_REPLAY_ROOT,
  });
}
