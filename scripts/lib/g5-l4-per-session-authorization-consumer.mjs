import {createHash, verify as verifySignature} from "node:crypto";
import {constants as fsConstants} from "node:fs";
import {
  lstat,
  open,
  realpath,
} from "node:fs/promises";
import path from "node:path";

import {
  createAtomicReplayLock,
  snapshotReplayRootIdentity,
} from "./g5-l4-atomic-replay-lock.mjs";
import {validateG5L4DisposableProfileManifest} from
  "../prepare-g5-l4-shell-rw002-disposable-runtime-profile.mjs";

export const G5_L4_AUTHORIZATION_SCHEMA_VERSION = 1;
export const G5_L4_MAX_AUTHORIZATION_TTL_SECONDS = 900;
export const G5_L4_MIN_AUTHORIZATION_TTL_SECONDS = 30;
export const G5_L4_AUTHORIZATION_PURPOSES = Object.freeze([
  "projector-original-runtime",
  "animate-authoring",
]);
export const G5_L4_REQUIRED_CONTAINMENT_CONTROL_IDS = Object.freeze([
  "CR-01", "CR-02", "CR-03", "CR-04", "CR-05", "CR-06", "CR-07", "CR-08",
]);
export const G5_L4_REQUIRED_STOP_CONDITIONS = Object.freeze([
  "unexpected-dialog-or-window",
  "successful-network-or-legacy-endpoint-request",
  "browser-navigation-apple-event-or-host-command",
  "unallowlisted-local-resource-request",
  "HELP_KEYTERMS/KT/ELEMENTARY/XML/L4KTE01.xml-request",
  "HELP_KEYTERMS/KT/ELEMENTARY/XML/L4KTS01.xml-request",
  "source-host-tree-profile-or-tool-hash-drift",
  "profile-contamination-or-persistent-shared-object",
  "capacity-codesign-sandbox-or-request-observer-preflight-failure",
  "preexisting-or-mismatched-process-identity",
  "operator-member-language-action-or-validity-window-mismatch",
]);

const HASH = /^[a-f0-9]{64}$/u;
const SESSION_ID = /^g5-l4-[a-z0-9-]{8,100}$/u;
const NONCE = /^[A-Za-z0-9_-]{32,128}$/u;
const ACTION_ID = /^[a-z0-9][a-z0-9.-]{2,127}$/u;
const VERIFIED_CONTEXTS = new WeakMap();
const CONSUMED_TOKEN_CONTEXTS = new WeakMap();
const CONTAINMENT_RECEIPT_BINDINGS = Object.freeze([
  Object.freeze({expectedKey: "approvalManifest", documentKey: "approvalManifestSha256"}),
  Object.freeze({expectedKey: "liveNoEgressPreflight", documentKey: "liveNoEgressPreflightSha256"}),
  Object.freeze({expectedKey: "liveCapacityPreflight", documentKey: "liveCapacityPreflightSha256"}),
  Object.freeze({expectedKey: "liveCodesignPreflight", documentKey: "liveCodesignPreflightSha256"}),
]);

function invariant(condition, message) {
  if (!condition) throw new Error(`G5 L4 per-session authorization consumer: ${message}`);
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
}

export function canonicalJson(value) {
  return `${JSON.stringify(stable(value))}\n`;
}

export function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

export function g5L4HostIdSha256(exactHostIdentifier) {
  invariant(typeof exactHostIdentifier === "string" && exactHostIdentifier.trim().length >= 8,
    "exact host identifier must be a non-empty stable identifier");
  return sha256(Buffer.from(`g5-l4-host-id-v1\0${exactHostIdentifier}`));
}

function assertExactKeys(value, expected, label) {
  invariant(value && typeof value === "object" && !Array.isArray(value), `${label} must be an object`);
  invariant(JSON.stringify(Object.keys(value).sort()) === JSON.stringify([...expected].sort()),
    `${label} keys drifted`);
}

function assertSha256(value, label) {
  invariant(HASH.test(value || ""), `${label} must be a lowercase SHA-256`);
}

function assertCanonicalTimestamp(value, label) {
  invariant(typeof value === "string" && Number.isFinite(Date.parse(value))
    && new Date(value).toISOString() === value,
  `${label} must be a canonical ISO timestamp`);
  return Date.parse(value);
}

function isContained(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

async function stableRegularFile(file, label, {
  readOnly = false,
  executable = false,
  afterOpenHook = null,
} = {}) {
  invariant(typeof file === "string" && path.isAbsolute(file), `${label} path must be absolute`);
  const before = await lstat(file, {bigint: true});
  invariant(before.isFile() && !before.isSymbolicLink() && before.nlink === 1n,
    `${label} must be one ordinary non-linked file`);
  if (readOnly) invariant((before.mode & 0o222n) === 0n, `${label} must be read-only`);
  if (executable) invariant((before.mode & 0o111n) !== 0n, `${label} must be executable`);
  invariant(await realpath(file) === file, `${label} may not resolve through symbolic links`);
  const handle = await open(file, fsConstants.O_RDONLY | fsConstants.O_NOFOLLOW);
  let bytes;
  let descriptorBefore;
  let descriptorAfter;
  try {
    descriptorBefore = await handle.stat({bigint: true});
    invariant(descriptorBefore.isFile() && descriptorBefore.nlink === 1n
      && descriptorBefore.dev === before.dev && descriptorBefore.ino === before.ino,
    `${label} path changed before its descriptor was pinned`);
    if (afterOpenHook) await afterOpenHook({file, descriptor: handle.fd});
    bytes = await handle.readFile();
    descriptorAfter = await handle.stat({bigint: true});
  } finally {
    await handle.close();
  }
  invariant(descriptorAfter.dev === descriptorBefore.dev && descriptorAfter.ino === descriptorBefore.ino
    && descriptorAfter.size === BigInt(bytes.length) && descriptorAfter.mtimeNs === descriptorBefore.mtimeNs,
  `${label} descriptor contents changed while read`);
  const after = await lstat(file, {bigint: true});
  invariant(after.isFile() && !after.isSymbolicLink() && after.dev === descriptorBefore.dev
    && after.ino === descriptorBefore.ino && after.size === BigInt(bytes.length)
    && after.mtimeNs === descriptorBefore.mtimeNs && await realpath(file) === file,
  `${label} path changed while its pinned descriptor was read`);
  return {
    path: file,
    bytes: bytes.length,
    sha256: sha256(bytes),
    mode: Number(after.mode & 0o777n).toString(8).padStart(4, "0"),
    identity: Object.freeze({device: after.dev.toString(), inode: after.ino.toString()}),
    contents: bytes,
  };
}

async function assertPhysicalBinding(file, expectedSha256, label, options = {}) {
  const bound = await stableRegularFile(file, label, options);
  invariant(bound.sha256 === expectedSha256, `${label} SHA-256 drifted`);
  return bound;
}

function validateExpected(expected) {
  assertExactKeys(expected, [
    "purpose", "language", "member", "host", "hostTree", "profile", "tool",
    "actionId", "allowedActionIds", "ownerPublicKeyPath", "ownerPublicKeySha256",
    "replayLockRoot", "containment",
  ], "expected execution binding");
  invariant(G5_L4_AUTHORIZATION_PURPOSES.includes(expected.purpose), "expected purpose is invalid");
  invariant(expected.purpose === "projector-original-runtime"
    ? ["en", "es"].includes(expected.language)
    : expected.language === null,
  "expected language/purpose binding is invalid");
  assertExactKeys(expected.member, [
    "ordinal", "animationId", "assetId", "sourcePath", "sourceAbsolutePath", "sourceSha256",
  ], "expected member");
  invariant(Number.isInteger(expected.member.ordinal) && expected.member.ordinal >= 1 && expected.member.ordinal <= 55,
    "expected member ordinal is invalid");
  invariant(/^(?:course|shell)-g05-l04-[a-z0-9-]+$/u.test(expected.member.animationId || ""),
    "expected member is outside G5 L4");
  assertSha256(expected.member.sourceSha256, "expected member source");
  const expectedAssetPrefix = expected.purpose === "projector-original-runtime" ? "swf" : "fla";
  invariant(expected.member.assetId === `${expectedAssetPrefix}-${expected.member.sourceSha256}`,
    "expected member asset/source identity drifted");
  assertExactKeys(expected.host, ["exactHostIdentifier", "hostIdSha256"], "expected host");
  invariant(expected.host.hostIdSha256 === g5L4HostIdSha256(expected.host.exactHostIdentifier),
    "expected host identifier/hash binding drifted");
  for (const [label, descriptor] of Object.entries({
    hostTree: expected.hostTree,
    profile: expected.profile,
    tool: expected.tool,
  })) {
    const keys = label === "hostTree"
      ? ["manifestPath", "manifestSha256", "fileSetSha256"]
      : label === "profile"
        ? ["manifestPath", "manifestSha256", "sessionRoot"]
        : ["kind", "path", "sha256"];
    assertExactKeys(descriptor, keys, `expected ${label}`);
    assertSha256(descriptor.manifestSha256 || descriptor.sha256, `expected ${label}`);
  }
  assertSha256(expected.hostTree.fileSetSha256, "expected host-tree file set");
  invariant(expected.tool.kind === (expected.purpose === "projector-original-runtime" ? "adobe-projector" : "adobe-animate"),
    "expected tool kind/purpose binding drifted");
  invariant(ACTION_ID.test(expected.actionId || ""), "expected action ID is invalid");
  invariant(Array.isArray(expected.allowedActionIds) && expected.allowedActionIds.length >= 1
    && new Set(expected.allowedActionIds).size === expected.allowedActionIds.length
    && expected.allowedActionIds.every((value) => ACTION_ID.test(value)),
  "expected allowed action IDs are invalid");
  assertSha256(expected.ownerPublicKeySha256, "expected owner public key");
  invariant(path.isAbsolute(expected.ownerPublicKeyPath) && path.isAbsolute(expected.replayLockRoot),
    "owner key and replay-lock root paths must be absolute");
  invariant(!isContained(expected.profile.sessionRoot, expected.replayLockRoot)
    && !isContained(expected.replayLockRoot, expected.profile.sessionRoot),
  "replay-lock root must be outside and disjoint from the runtime-writable disposable session");
  assertExactKeys(
    expected.containment,
    CONTAINMENT_RECEIPT_BINDINGS.map(({expectedKey}) => expectedKey),
    "expected containment receipts",
  );
  for (const {expectedKey} of CONTAINMENT_RECEIPT_BINDINGS) {
    const descriptor = expected.containment[expectedKey];
    assertExactKeys(descriptor, ["path", "sha256"], `expected containment ${expectedKey}`);
    invariant(path.isAbsolute(descriptor.path), `expected containment ${expectedKey} path must be absolute`);
    invariant(!isContained(expected.profile.sessionRoot, descriptor.path),
      `expected containment ${expectedKey} must be outside the runtime-writable session root`);
    assertSha256(descriptor.sha256, `expected containment ${expectedKey}`);
  }
  return expected;
}

function validateAuthorityBoundary(boundary) {
  assertExactKeys(boundary, [
    "authoritativeOriginalRuntime", "audioAccepted", "humanVisualAccepted", "ownerFidelityAccepted",
    "strictComplete", "published", "acceptanceEffect",
  ], "authority boundary");
  for (const key of [
    "authoritativeOriginalRuntime", "audioAccepted", "humanVisualAccepted", "ownerFidelityAccepted",
    "strictComplete", "published",
  ]) invariant(boundary[key] === false, `authority boundary ${key} must remain false`);
  invariant(boundary.acceptanceEffect === "none; execution authorization only",
    "authority boundary acceptance effect drifted");
}

export function authorizationSigningBytes(document) {
  invariant(document && typeof document === "object" && !Array.isArray(document), "authorization document is invalid");
  const {signature, ...unsigned} = document;
  invariant(signature && typeof signature === "object", "authorization signature is missing");
  return Buffer.from(canonicalJson(unsigned));
}

function validateAuthorizationShape(document, expected, nowMs) {
  assertExactKeys(document, [
    "schemaVersion", "authorizationType", "decision", "session", "member", "host", "hostTree",
    "profile", "tool", "operator", "action", "containment", "stopConditions", "authorityBoundary", "signature",
  ], "authorization document");
  invariant(document.schemaVersion === G5_L4_AUTHORIZATION_SCHEMA_VERSION
    && document.authorizationType === "g5-l4-hash-bound-one-time-per-session-authorization"
    && document.decision === "authorize-once",
  "authorization identity or decision drifted");
  assertExactKeys(document.session, [
    "sessionId", "releaseId", "purpose", "language", "nonce", "issuedAt", "notBefore", "expiresAt",
    "ttlSeconds", "oneTimeUseRequired",
  ], "authorization session");
  invariant(SESSION_ID.test(document.session.sessionId || "")
    && document.session.releaseId === "lesson-g05-l04-number-lines"
    && document.session.purpose === expected.purpose
    && document.session.language === expected.language
    && NONCE.test(document.session.nonce || "")
    && document.session.oneTimeUseRequired === true,
  "authorization session identity drifted");
  const issuedAt = assertCanonicalTimestamp(document.session.issuedAt, "issuedAt");
  const notBefore = assertCanonicalTimestamp(document.session.notBefore, "notBefore");
  const expiresAt = assertCanonicalTimestamp(document.session.expiresAt, "expiresAt");
  invariant(Number.isInteger(document.session.ttlSeconds)
    && document.session.ttlSeconds >= G5_L4_MIN_AUTHORIZATION_TTL_SECONDS
    && document.session.ttlSeconds <= G5_L4_MAX_AUTHORIZATION_TTL_SECONDS,
  "authorization TTL is outside the bounded window");
  invariant(notBefore >= issuedAt && expiresAt > notBefore
    && expiresAt - issuedAt === document.session.ttlSeconds * 1000,
  "authorization timestamps/TTL are inconsistent");
  invariant(nowMs >= notBefore && nowMs <= expiresAt, "authorization is not currently valid");

  assertExactKeys(document.member, ["ordinal", "animationId", "assetId", "sourcePath", "sourceSha256"], "authorization member");
  invariant(document.member.ordinal === expected.member.ordinal
    && document.member.animationId === expected.member.animationId
    && document.member.assetId === expected.member.assetId
    && document.member.sourcePath === expected.member.sourcePath
    && document.member.sourceSha256 === expected.member.sourceSha256,
  "authorization exact member binding drifted");
  assertExactKeys(document.host, ["exactHostIdentifier", "hostIdSha256"], "authorization host");
  invariant(document.host.exactHostIdentifier === expected.host.exactHostIdentifier
    && document.host.hostIdSha256 === expected.host.hostIdSha256,
  "authorization exact host binding drifted");
  assertExactKeys(document.hostTree, ["manifestPath", "manifestSha256", "fileSetSha256"], "authorization host tree");
  invariant(document.hostTree.manifestPath === expected.hostTree.manifestPath
    && document.hostTree.manifestSha256 === expected.hostTree.manifestSha256
    && document.hostTree.fileSetSha256 === expected.hostTree.fileSetSha256,
  "authorization host-tree hashes drifted");
  assertExactKeys(document.profile, ["manifestPath", "manifestSha256", "sessionRoot"], "authorization profile");
  invariant(document.profile.manifestPath === expected.profile.manifestPath
    && document.profile.manifestSha256 === expected.profile.manifestSha256
    && document.profile.sessionRoot === expected.profile.sessionRoot,
  "authorization disposable-profile binding drifted");
  assertExactKeys(document.tool, ["kind", "path", "sha256"], "authorization tool");
  invariant(document.tool.kind === expected.tool.kind && document.tool.path === expected.tool.path
    && document.tool.sha256 === expected.tool.sha256,
  "authorization executable binding drifted");
  assertExactKeys(document.operator, ["roleId", "fullName", "externalSubjectId", "allowedActionIds"], "authorization operator");
  invariant(document.operator.roleId === "authorized-original-runtime-operator"
    && document.operator.fullName === "Dr. Peter Hu"
    && typeof document.operator.externalSubjectId === "string"
    && document.operator.externalSubjectId.trim().length >= 3
    && JSON.stringify(document.operator.allowedActionIds) === JSON.stringify(expected.allowedActionIds),
  "authorization named operator/action binding drifted");
  assertExactKeys(document.action, ["actionId", "humanOnlyActionIds", "forbiddenActionIds"], "authorization action");
  invariant(document.action.actionId === expected.actionId
    && Array.isArray(document.action.humanOnlyActionIds)
    && Array.isArray(document.action.forbiddenActionIds)
    && document.action.forbiddenActionIds.includes("save-publish-export-or-convert-source")
    && document.action.forbiddenActionIds.includes("direct-child-swf-open"),
  "authorization action/forbidden-action boundary drifted");
  assertExactKeys(document.containment, [
    "controlIds", "approvalManifestSha256", "liveNoEgressPreflightSha256",
    "liveCapacityPreflightSha256", "liveCodesignPreflightSha256", "allApprovedAndVerified",
  ], "authorization containment");
  invariant(JSON.stringify(document.containment.controlIds) === JSON.stringify(G5_L4_REQUIRED_CONTAINMENT_CONTROL_IDS)
    && document.containment.allApprovedAndVerified === true,
  "authorization containment controls are incomplete");
  for (const {expectedKey, documentKey} of CONTAINMENT_RECEIPT_BINDINGS) {
    assertSha256(document.containment[documentKey], `authorization containment ${documentKey}`);
    invariant(document.containment[documentKey] === expected.containment[expectedKey].sha256,
      `authorization containment ${documentKey} differs from the physical expected receipt`);
  }
  invariant(JSON.stringify(document.stopConditions) === JSON.stringify(G5_L4_REQUIRED_STOP_CONDITIONS),
    "authorization stop-condition set drifted");
  validateAuthorityBoundary(document.authorityBoundary);
  assertExactKeys(document.signature, [
    "algorithm", "signerRole", "signerSubjectId", "ownerPublicKeySha256", "signatureBase64",
  ], "authorization signature");
  invariant(document.signature.algorithm === "Ed25519"
    && document.signature.signerRole === "owner"
    && typeof document.signature.signerSubjectId === "string"
    && document.signature.signerSubjectId.trim().length >= 3
    && document.signature.ownerPublicKeySha256 === expected.ownerPublicKeySha256
    && typeof document.signature.signatureBase64 === "string",
  "authorization owner signature descriptor drifted");
  invariant(/^(?:[A-Za-z0-9+/]{4}){21}[A-Za-z0-9+/]{2}==$/u.test(document.signature.signatureBase64),
    "authorization signature must use canonical padded standard base64 for exactly 64 bytes");
  const signatureBytes = Buffer.from(document.signature.signatureBase64, "base64");
  invariant(signatureBytes.length === 64
    && signatureBytes.toString("base64") === document.signature.signatureBase64,
  "authorization signature must be one canonical padded base64 encoding of exactly 64 bytes");
  return {issuedAt, notBefore, expiresAt};
}

async function validatePhysicalExpectedBindings(expected) {
  const [source, hostTree, profile, tool, ownerKey, containmentEntries] = await Promise.all([
    assertPhysicalBinding(expected.member.sourceAbsolutePath, expected.member.sourceSha256, "member source"),
    assertPhysicalBinding(expected.hostTree.manifestPath, expected.hostTree.manifestSha256, "host-tree manifest", {readOnly: true}),
    assertPhysicalBinding(expected.profile.manifestPath, expected.profile.manifestSha256, "profile manifest", {readOnly: true}),
    assertPhysicalBinding(expected.tool.path, expected.tool.sha256, "authorized executable", {executable: true}),
    assertPhysicalBinding(expected.ownerPublicKeyPath, expected.ownerPublicKeySha256, "owner public key"),
    Promise.all(CONTAINMENT_RECEIPT_BINDINGS.map(async ({expectedKey}) => {
      const descriptor = expected.containment[expectedKey];
      const binding = await assertPhysicalBinding(
        descriptor.path,
        descriptor.sha256,
        `containment ${expectedKey}`,
        {readOnly: true},
      );
      invariant(binding.bytes > 0, `containment ${expectedKey} receipt must not be empty`);
      return [expectedKey, binding];
    })),
  ]);
  let profileManifest;
  try {
    profileManifest = validateG5L4DisposableProfileManifest(JSON.parse(profile.contents));
  } catch (error) {
    throw new Error(`G5 L4 per-session authorization consumer: profile authority-state manifest is invalid: ${error.message}`);
  }
  invariant(profileManifest.sessionRoot === expected.profile.sessionRoot
    && profileManifest.authorityState.replayLockRoot === expected.replayLockRoot
    && profileManifest.authorityState.runtimeWritable === false
    && profileManifest.authorityState.externalAuthorityRequired === true
    && profileManifest.sandbox.replayAuthorityWritesDenied === true
    && profileManifest.sandbox.policy.includes(
      `(deny file-read* file-write* (subpath ${JSON.stringify(expected.replayLockRoot)}))`,
    )
    && profileManifest.sandbox.sessionOnlyWrites.every((writeRoot) =>
      !isContained(writeRoot, expected.replayLockRoot)),
  "profile does not bind the replay lock to an external supervisor-only authority root");
  return {
    source,
    hostTree,
    profile,
    profileManifest,
    tool,
    ownerKey,
    containment: Object.fromEntries(containmentEntries),
  };
}

export async function verifyG5L4PerSessionAuthorization({
  authorizationPath,
  expected: expectedInput,
  now = Date.now(),
  authorizationFileOpenedHook = null,
} = {}) {
  const expected = validateExpected(expectedInput);
  invariant(typeof authorizationPath === "string" && path.isAbsolute(authorizationPath),
    "authorization path must be absolute");
  const nowMs = now instanceof Date ? now.getTime() : typeof now === "string" ? Date.parse(now) : now;
  invariant(Number.isFinite(nowMs), "now must be a valid time");
  const [authorization, physical] = await Promise.all([
    stableRegularFile(authorizationPath, "authorization", {
      readOnly: true,
      afterOpenHook: authorizationFileOpenedHook,
    }),
    validatePhysicalExpectedBindings(expected),
  ]);
  let document;
  try {
    document = JSON.parse(authorization.contents);
  } catch (error) {
    throw new Error(`G5 L4 per-session authorization consumer: authorization JSON is invalid: ${error.message}`);
  }
  const times = validateAuthorizationShape(document, expected, nowMs);
  const signatureBytes = Buffer.from(document.signature.signatureBase64, "base64");
  invariant(signatureBytes.length === 64, "Ed25519 signature must decode to 64 bytes");
  invariant(verifySignature(null, authorizationSigningBytes(document), physical.ownerKey.contents, signatureBytes),
    "owner Ed25519 signature verification failed");
  const result = Object.freeze({
    ok: true,
    status: "verified-not-consumed-not-launched",
    authorizationPath,
    authorizationSha256: authorization.sha256,
    sessionId: document.session.sessionId,
    nonce: document.session.nonce,
    purpose: document.session.purpose,
    language: document.session.language,
    member: Object.freeze({...document.member}),
    hostIdSha256: document.host.hostIdSha256,
    hostTreeManifestSha256: document.hostTree.manifestSha256,
    profileManifestSha256: document.profile.manifestSha256,
    toolSha256: document.tool.sha256,
    actionId: document.action.actionId,
    allowedActionIds: Object.freeze([...document.operator.allowedActionIds]),
    expiresAt: document.session.expiresAt,
    ownerSignatureVerified: true,
    oneTimeUseRequired: true,
    consumed: false,
    runtimeLaunched: false,
    acceptanceEffect: "none",
  });
  VERIFIED_CONTEXTS.set(result, {document, expected, times, nowMs, physical});
  return result;
}

async function verifyReplayRoot(root) {
  const before = await snapshotReplayRootIdentity(root);
  const parent = path.dirname(root);
  invariant(isContained(parent, root), "replay-lock root escapes its parent");
  return before;
}

export async function consumeG5L4PerSessionAuthorization(options = {}) {
  const verified = await verifyG5L4PerSessionAuthorization(options);
  const context = VERIFIED_CONTEXTS.get(verified);
  const replayRoot = context.expected.replayLockRoot;
  const replayRootIdentity = await verifyReplayRoot(replayRoot);
  const nonceSha256 = sha256(Buffer.from(context.document.session.nonce));
  const lockPath = path.join(replayRoot, `${nonceSha256}.lock.json`);
  const consumedAt = new Date(context.nowMs).toISOString();
  const baseReceipt = {
    schemaVersion: 1,
    receiptType: "g5-l4-one-time-authorization-atomic-replay-lock",
    status: "authorization-consumed-launch-not-yet-attempted",
    sessionId: verified.sessionId,
    purpose: verified.purpose,
    language: verified.language,
    member: verified.member,
    sourceAbsolutePath: context.expected.member.sourceAbsolutePath,
    actionId: verified.actionId,
    tool: Object.freeze({...context.expected.tool}),
    authorizationSha256: verified.authorizationSha256,
    nonceSha256,
    consumedAt,
    runtimeLaunched: false,
    acceptanceEffect: "none",
  };
  const receipt = {
    ...baseReceipt,
    receiptFingerprintSha256: sha256(Buffer.from(canonicalJson(baseReceipt))),
  };
  const bytes = Buffer.from(`${JSON.stringify(receipt, null, 2)}\n`);
  let atomicLock;
  try {
    atomicLock = await createAtomicReplayLock({
      replayRoot,
      lockLeaf: path.basename(lockPath),
      bytes,
      expectedRootIdentity: replayRootIdentity,
      beforeCommitHook: options.beforeReplayLockCommitHook,
    });
  } catch (error) {
    if (error.code === "EEXIST" || /File exists/u.test(error.message || "")) {
      throw new Error("G5 L4 per-session authorization consumer: session nonce was already consumed");
    }
    throw error;
  }
  const locked = await stableRegularFile(lockPath, "authorization replay lock", {readOnly: true});
  invariant(locked.contents.equals(bytes)
    && locked.identity.device === atomicLock.lockIdentity.device
    && locked.identity.inode === atomicLock.lockIdentity.inode,
  "authorization replay lock bytes or inode drifted after atomic creation");
  const token = Object.freeze({
    ok: true,
    status: "consumed-once-launch-not-yet-attempted",
    sessionId: verified.sessionId,
    purpose: verified.purpose,
    language: verified.language,
    member: verified.member,
    sourceAbsolutePath: context.expected.member.sourceAbsolutePath,
    actionId: verified.actionId,
    tool: Object.freeze({...context.expected.tool}),
    authorizationSha256: verified.authorizationSha256,
    nonceSha256,
    replayLockPath: lockPath,
    replayLockSha256: locked.sha256,
    replayRootIdentity,
    replayLockIdentity: locked.identity,
    replayLockAtomicPrimitive: atomicLock.primitive,
    expiresAt: verified.expiresAt,
    containmentReceiptSha256: Object.freeze(Object.fromEntries(
      CONTAINMENT_RECEIPT_BINDINGS.map(({expectedKey, documentKey}) => [expectedKey, context.document.containment[documentKey]]),
    )),
    ownerSignatureVerified: true,
    consumed: true,
    runtimeLaunched: false,
    acceptanceEffect: "none",
  });
  CONSUMED_TOKEN_CONTEXTS.set(token, {...context, executionClaimed: false});
  return token;
}

export function assertConsumedG5L4Authorization(token, {
  purpose,
  actionId,
  animationId,
  language,
  sourceAbsolutePath = null,
  sourceSha256 = null,
  toolPath = null,
  toolSha256 = null,
  now = Date.now(),
} = {}) {
  const context = token && CONSUMED_TOKEN_CONTEXTS.get(token);
  invariant(context, "execution requires an opaque token from the one-time consumer");
  invariant(token.consumed === true && token.ownerSignatureVerified === true
    && token.purpose === purpose && token.actionId === actionId
    && token.member.animationId === animationId && token.language === language
    && (sourceAbsolutePath === null || token.sourceAbsolutePath === sourceAbsolutePath)
    && (sourceSha256 === null || token.member.sourceSha256 === sourceSha256)
    && (toolPath === null || token.tool.path === toolPath)
    && (toolSha256 === null || token.tool.sha256 === toolSha256)
    && token.runtimeLaunched === false && token.acceptanceEffect === "none",
  "consumed authorization token does not match the exact execution");
  const nowMs = now instanceof Date ? now.getTime() : typeof now === "string" ? Date.parse(now) : now;
  invariant(Number.isFinite(nowMs) && nowMs >= context.times.notBefore && nowMs <= context.times.expiresAt,
    "consumed authorization token is outside its signed validity window");
  invariant(context.executionClaimed === false, "consumed authorization token was already claimed for execution");
  context.executionClaimed = true;
  return token;
}

export async function assertReplayLockStillBound(token) {
  const context = token && CONSUMED_TOKEN_CONTEXTS.get(token);
  invariant(context, "unknown consumed authorization token");
  const rootIdentity = await snapshotReplayRootIdentity(path.dirname(token.replayLockPath));
  invariant(rootIdentity.device === token.replayRootIdentity.device
    && rootIdentity.inode === token.replayRootIdentity.inode,
  "authorization replay-lock root changed after consumption");
  const lock = await stableRegularFile(token.replayLockPath, "authorization replay lock", {readOnly: true});
  invariant(lock.sha256 === token.replayLockSha256
    && lock.identity.device === token.replayLockIdentity.device
    && lock.identity.inode === token.replayLockIdentity.inode,
  "authorization replay lock changed after consumption");
  await validatePhysicalExpectedBindings(context.expected);
  return true;
}
