import {
  createHash,
  verify as verifySignature,
} from "node:crypto";
import {constants as fsConstants} from "node:fs";
import {
  chmod,
  lstat,
  open,
  realpath,
} from "node:fs/promises";
import path from "node:path";

import {
  createAtomicReplayLock,
  snapshotReplayRootIdentity,
} from "./g5-l4-atomic-replay-lock.mjs";

export const LESSON_ANIMATE_AUTHORIZATION_SCHEMA_VERSION = 1;
export const LESSON_ANIMATE_LEGACY_AUTHORIZATION_DIAGNOSTIC_ONLY = true;
export const LESSON_G04_L10_RELEASE_ID = "lesson-g04-l10-perimeter-area";
export const LESSON_ANIMATE_MIN_TTL_SECONDS = 30;
export const LESSON_ANIMATE_MAX_TTL_SECONDS = 900;

const HASH = /^[a-f0-9]{64}$/u;
const RUN_ID = /^run-[A-Za-z0-9_-]{8,96}$/u;
const NONCE = /^[A-Za-z0-9_-]{32,128}$/u;
const ID = /^[a-z0-9](?:[a-z0-9-]{0,126}[a-z0-9])?$/u;
const AUTOMATION_TOKEN = /(?:codex|automation|automated|bot|agent|unknown|none)/iu;
const NOT_APPLICABLE_TOKEN =
  /(?:^|[^\p{L}\p{N}])n\/?a(?:$|[^\p{L}\p{N}])/iu;
const INVISIBLE_OR_DIRECTIONAL = /[\u0000-\u001f\u007f\u200b-\u200f\u202a-\u202e\u2060-\u206f\ufeff]/u;
const ASSIGNMENT_KIND = "lesson-g04-l10-adobe-animate-named-human-operator-assignment";
const AUTHORIZATION_KIND = "lesson-g04-l10-adobe-animate-one-row-one-run";
const AUTHORITY_ROOT_RELATIVE =
  "work/animate/g4-l10-authoring-authority/lesson-g04-l10-perimeter-area";
const RUNS_ROOT_RELATIVE = "work/animate/dependency-authoring-audits";
const REQUIRED_FALSE_AUTHORITY_FIELDS = Object.freeze([
  "originalRuntimeBehavior",
  "audioAcceptance",
  "humanVisualReview",
  "ownerAcceptance",
  "strictAcceptance",
  "migrationCompletion",
  "publication",
]);
const VERIFIED_CONTEXTS = new WeakMap();
const CONSUMED_CONTEXTS = new WeakMap();

function invariant(condition, message) {
  if (!condition) throw new Error(`Lesson Animate one-row authorization: ${message}`);
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
}

export function canonicalLessonAnimateAuthorizationJson(value) {
  return `${JSON.stringify(stable(value))}\n`;
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
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
    && new Date(value).toISOString() === value, `${label} must be a canonical ISO timestamp`);
  return Date.parse(value);
}

function isContained(parent, candidate) {
  const relative = path.relative(path.resolve(parent), path.resolve(candidate));
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function normalizedHumanIdentity(value, label) {
  const normalized = typeof value === "string" ? value.normalize("NFC").trim() : "";
  invariant(normalized.length >= 2 && normalized.length <= 128 && /\p{L}/u.test(normalized),
    `${label} must name one human`);
  invariant(!INVISIBLE_OR_DIRECTIONAL.test(normalized), `${label} contains hidden or directional controls`);
  invariant(!AUTOMATION_TOKEN.test(normalized) && !NOT_APPLICABLE_TOKEN.test(normalized),
    `${label} contains a forbidden automation identity`);
  invariant(normalized === value, `${label} must already be trimmed canonical NFC text`);
  return normalized;
}

function normalizedHumanSubject(value, label) {
  const normalized = typeof value === "string" ? value.normalize("NFC").trim() : "";
  invariant(normalized.length >= 3 && normalized.length <= 160, `${label} must be a stable human subject ID`);
  invariant(!INVISIBLE_OR_DIRECTIONAL.test(normalized)
    && !AUTOMATION_TOKEN.test(normalized) && !NOT_APPLICABLE_TOKEN.test(normalized),
    `${label} contains a forbidden automation identity`);
  invariant(normalized === value, `${label} must already be trimmed canonical NFC text`);
  return normalized;
}

function descriptorKeys({source = false} = {}) {
  return source
    ? ["file", "sha256", "bytes", "mode", "sourceFreezeManifestPath"]
    : ["file", "sha256", "bytes", "mode"];
}

function validateDescriptorShape(value, label, options = {}) {
  assertExactKeys(value, descriptorKeys(options), label);
  invariant(typeof value.file === "string" && value.file.length > 0, `${label}.file is invalid`);
  assertSha256(value.sha256, `${label}.sha256`);
  invariant(Number.isSafeInteger(value.bytes) && value.bytes > 0, `${label}.bytes is invalid`);
  invariant(/^[0-7]{4}$/u.test(value.mode || ""), `${label}.mode is invalid`);
  if (options.source) {
    invariant(typeof value.sourceFreezeManifestPath === "string"
      && value.sourceFreezeManifestPath.length > 0
      && !path.isAbsolute(value.sourceFreezeManifestPath),
    `${label}.sourceFreezeManifestPath is invalid`);
  }
  return value;
}

function resolveBoundPath(projectRoot, descriptor, label, {absoluteAllowed = false} = {}) {
  if (path.isAbsolute(descriptor.file)) {
    invariant(absoluteAllowed, `${label} may not use an absolute path`);
    return path.resolve(descriptor.file);
  }
  const file = path.resolve(projectRoot, descriptor.file);
  invariant(isContained(projectRoot, file), `${label} escapes the project root`);
  return file;
}

async function stableRegularFile(file, label, {
  exactMode = null,
  executable = false,
  afterOpenHook = null,
} = {}) {
  invariant(path.isAbsolute(file), `${label} path must be absolute`);
  const before = await lstat(file, {bigint: true});
  invariant(before.isFile() && !before.isSymbolicLink() && before.nlink === 1n,
    `${label} must be one ordinary non-linked file`);
  if (exactMode !== null) invariant((before.mode & 0o777n) === BigInt(exactMode),
    `${label} mode must be exactly ${exactMode.toString(8).padStart(4, "0")}`);
  if (executable) invariant((before.mode & 0o111n) !== 0n, `${label} must be executable`);
  invariant(await realpath(file) === file, `${label} may not resolve through symbolic links`);
  const handle = await open(file, fsConstants.O_RDONLY | fsConstants.O_NOFOLLOW);
  let descriptorBefore;
  let descriptorAfter;
  let bytes;
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
  invariant(after.isFile() && !after.isSymbolicLink() && after.nlink === 1n
    && after.dev === descriptorBefore.dev && after.ino === descriptorBefore.ino
    && after.size === BigInt(bytes.length) && after.mtimeNs === descriptorBefore.mtimeNs
    && await realpath(file) === file,
  `${label} path changed while its pinned descriptor was read`);
  return Object.freeze({
    file,
    bytes: bytes.length,
    sha256: sha256(bytes),
    mode: Number(after.mode & 0o777n).toString(8).padStart(4, "0"),
    identity: Object.freeze({device: after.dev.toString(), inode: after.ino.toString()}),
    contents: bytes,
  });
}

async function bindDescriptor(projectRoot, descriptor, label, options = {}) {
  validateDescriptorShape(descriptor, label, options);
  const file = resolveBoundPath(projectRoot, descriptor, label, options);
  const exactMode = Number.parseInt(descriptor.mode, 8);
  const physical = await stableRegularFile(file, label, {
    exactMode,
    executable: options.executable === true,
  });
  invariant(physical.sha256 === descriptor.sha256 && physical.bytes === descriptor.bytes,
    `${label} physical identity drifted`);
  return physical;
}

function fixedAuthorityRoot(projectRoot) {
  return path.join(projectRoot, ...AUTHORITY_ROOT_RELATIVE.split("/"));
}

function assertContentAddressedReceiptPath(projectRoot, file, digest, kind) {
  const expectedParent = path.join(fixedAuthorityRoot(projectRoot), kind, "sha256");
  invariant(path.dirname(file) === expectedParent, `${kind} receipt is outside its fixed root`);
  invariant(path.basename(file) === `${digest}.json`, `${kind} receipt is not content-addressed by its bytes`);
}

function parseJson(bytes, label) {
  try {
    return JSON.parse(bytes.toString("utf8"));
  } catch (error) {
    throw new Error(`Lesson Animate one-row authorization: ${label} is invalid JSON: ${error.message}`);
  }
}

function validateAuthorityBoundary(value, label, expectedEffect) {
  assertExactKeys(value, ["roleAssignmentOnly", ...REQUIRED_FALSE_AUTHORITY_FIELDS, "acceptanceEffect"], label);
  invariant(value.roleAssignmentOnly === (expectedEffect === "none; named-human role assignment only"),
    `${label}.roleAssignmentOnly drifted`);
  for (const field of REQUIRED_FALSE_AUTHORITY_FIELDS) {
    invariant(value[field] === false, `${label}.${field} must remain false`);
  }
  invariant(value.acceptanceEffect === expectedEffect, `${label}.acceptanceEffect drifted`);
}

function signatureBytes(document) {
  const {signature, ...unsigned} = document;
  invariant(signature && typeof signature === "object", "signature is missing");
  return Buffer.from(canonicalLessonAnimateAuthorizationJson(unsigned));
}

function validateSignatureShape(signature, ownerPublicKeySha256, label) {
  assertExactKeys(signature,
    ["algorithm", "signerRole", "signerSubjectId", "ownerPublicKeySha256", "signatureBase64"], label);
  invariant(signature.algorithm === "Ed25519" && signature.signerRole === "owner",
    `${label} algorithm or signer role drifted`);
  normalizedHumanSubject(signature.signerSubjectId, `${label}.signerSubjectId`);
  invariant(signature.ownerPublicKeySha256 === ownerPublicKeySha256,
    `${label} owner public-key binding drifted`);
  invariant(/^(?:[A-Za-z0-9+/]{4}){21}[A-Za-z0-9+/]{2}==$/u.test(signature.signatureBase64 || ""),
    `${label} must contain canonical padded base64 for 64 bytes`);
  const bytes = Buffer.from(signature.signatureBase64, "base64");
  invariant(bytes.length === 64 && bytes.toString("base64") === signature.signatureBase64,
    `${label} signature encoding is not canonical`);
  return bytes;
}

async function loadOwnerKey(projectRoot, expected) {
  validateDescriptorShape(expected, "owner public key");
  return bindDescriptor(projectRoot, expected, "owner public key", {absoluteAllowed: true});
}

async function loadAssignment({projectRoot, assignmentPath, ownerKey, assignmentFileOpenedHook = null}) {
  invariant(path.isAbsolute(assignmentPath), "assignmentPath must be absolute");
  const physical = await stableRegularFile(assignmentPath, "named-human assignment", {
    exactMode: 0o444,
    afterOpenHook: assignmentFileOpenedHook,
  });
  assertContentAddressedReceiptPath(projectRoot, assignmentPath, physical.sha256, "assignments");
  const value = parseJson(physical.contents, "named-human assignment");
  assertExactKeys(value,
    ["schemaVersion", "evidenceKind", "releaseId", "assignment", "authorityBoundary", "signature"],
    "named-human assignment");
  invariant(value.schemaVersion === LESSON_ANIMATE_AUTHORIZATION_SCHEMA_VERSION
    && value.evidenceKind === ASSIGNMENT_KIND && value.releaseId === LESSON_G04_L10_RELEASE_ID,
  "named-human assignment identity drifted");
  assertExactKeys(value.assignment,
    ["roleId", "slot", "assigneeFullName", "stableSubjectId", "explicit",
      "consentToConfirmLegacyActionScriptConversionDialog", "consentToCloseWithoutSaving"],
    "named-human assignment.assignment");
  const operator = normalizedHumanIdentity(value.assignment.assigneeFullName,
    "named-human assignment.assigneeFullName");
  const subject = normalizedHumanSubject(value.assignment.stableSubjectId,
    "named-human assignment.stableSubjectId");
  invariant(value.assignment.roleId === "adobe-animate-human-dialog-operator"
    && value.assignment.slot === "primary" && value.assignment.explicit === true
    && value.assignment.consentToConfirmLegacyActionScriptConversionDialog === true
    && value.assignment.consentToCloseWithoutSaving === true,
  "named-human assignment role or consent drifted");
  validateAuthorityBoundary(value.authorityBoundary, "named-human assignment.authorityBoundary",
    "none; named-human role assignment only");
  const signature = validateSignatureShape(value.signature, ownerKey.sha256, "named-human assignment.signature");
  invariant(verifySignature(null, signatureBytes(value), ownerKey.contents, signature),
    "named-human assignment Ed25519 signature verification failed");
  return Object.freeze({
    value,
    operator,
    subject,
    binding: Object.freeze({
      file: path.relative(projectRoot, assignmentPath).split(path.sep).join("/"),
      sha256: physical.sha256,
      bytes: physical.bytes,
      mode: "0444",
    }),
    physical,
  });
}

function validateRelease(value) {
  assertExactKeys(value,
    ["releaseId", "publicationMode", "releaseOrdinal", "queueOrdinal", "releaseRole", "shardId"],
    "authorization.release");
  invariant(value.releaseId === LESSON_G04_L10_RELEASE_ID && value.publicationMode === "atomic",
    "authorization release identity drifted");
  invariant(Number.isInteger(value.releaseOrdinal) && value.releaseOrdinal >= 1 && value.releaseOrdinal <= 47,
    "authorization release ordinal is invalid");
  invariant(Number.isInteger(value.queueOrdinal) && value.queueOrdinal >= 1 && value.queueOrdinal <= 34,
    "authorization queue ordinal is invalid");
  invariant(["active-xml-referenced-page", "course-shell"].includes(value.releaseRole)
    && ID.test(value.shardId || ""), "authorization release role or shard is invalid");
}

function validateMember(value) {
  assertExactKeys(value, ["animationId", "assetId", "fla", "swf"], "authorization.member");
  invariant(/^(?:course|shell)-g04-l10-[a-z0-9-]+$/u.test(value.animationId || ""),
    "authorization member is outside G4 L10");
  invariant(/^swf-[a-f0-9]{64}$/u.test(value.assetId || ""), "authorization assetId is invalid");
  for (const [kind, extension] of [["fla", ".fla"], ["swf", ".swf"]]) {
    const source = value[kind];
    const keys = kind === "fla"
      ? ["source", "releaseWorkingCopy", "assistWorkingCopy"]
      : ["source", "assistWorkingCopy"];
    assertExactKeys(source, keys,
      `authorization.member.${kind}`);
    validateDescriptorShape(source.source, `authorization.member.${kind}.source`, {source: true});
    if (kind === "fla") validateDescriptorShape(source.releaseWorkingCopy,
      `authorization.member.${kind}.releaseWorkingCopy`);
    validateDescriptorShape(source.assistWorkingCopy, `authorization.member.${kind}.assistWorkingCopy`);
    invariant(path.extname(source.source.file).toLowerCase() === extension,
      `authorization.member.${kind}.source has the wrong extension`);
  }
  invariant(value.assetId === `swf-${value.swf.source.sha256}`,
    "authorization assetId differs from the shipped SWF SHA-256");
  invariant(path.basename(value.fla.source.file, ".fla") === path.basename(value.swf.source.file, ".swf"),
    "authorization FLA/SWF source stems differ");
  const canonicalPrefix = "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/";
  invariant(value.fla.source.file.startsWith(canonicalPrefix)
    && value.swf.source.file.startsWith(canonicalPrefix),
  "authorization source pair is outside the canonical G4 L10 tree");
  const releaseCopyPrefix =
    `work/animate/release-read-only-fla-copies/${LESSON_G04_L10_RELEASE_ID}/all/files/${value.animationId}/`;
  const assistPrefix = `work/animate/dependency-authoring-audits/${value.animationId}/`;
  invariant(value.fla.releaseWorkingCopy.file.startsWith(releaseCopyPrefix)
    && value.fla.assistWorkingCopy.file.startsWith(`${assistPrefix}working-copy/`)
    && value.swf.assistWorkingCopy.file.startsWith(`${assistPrefix}runtime-source/`),
  "authorization working-copy placement drifted");
  for (const copy of [value.fla.releaseWorkingCopy, value.fla.assistWorkingCopy, value.swf.assistWorkingCopy]) {
    invariant(copy.mode === "0444", "authorization working copies must be exactly 0444");
  }
  for (const source of [value.fla.source, value.swf.source]) {
    invariant((Number.parseInt(source.mode, 8) & 0o222) === 0,
      "authorization canonical sources must be read-only");
  }
}

function validateBindings(value) {
  const keys = [
    "namedOperatorAssignmentReceipt",
    "releasePrepareOnlyQueue",
    "releaseStagingManifest",
    "sourceFreezeManifest",
    "assistSourceBinding",
    "runner",
    "jsfl",
    "animateExecutable",
  ];
  assertExactKeys(value, keys, "authorization.bindings");
  for (const key of keys) validateDescriptorShape(value[key], `authorization.bindings.${key}`);
  invariant(value.sourceFreezeManifest.file === "catalog/source-manifest.sha256",
    "authorization source-freeze manifest path drifted");
  invariant(value.runner.file === "scripts/run-g4-l10-authorized-animate-authoring-audit-v1.mjs",
    "authorization runner path drifted");
  invariant(value.jsfl.file === "scripts/animate-audit-current-document.jsfl",
    "authorization JSFL path drifted");
  invariant(path.isAbsolute(value.animateExecutable.file), "authorization Animate path must be absolute");
  invariant(value.assistSourceBinding.mode === "0444", "authorization assist source binding must be exactly 0444");
  invariant(value.runner.mode === "0644" && value.jsfl.mode === "0644"
    && value.animateExecutable.mode === "0755",
  "authorization runner, JSFL, or Animate mode drifted");
  for (const [key, segment] of [
    ["releasePrepareOnlyQueue", "operator-queues"],
    ["releaseStagingManifest", "manifests"],
  ]) {
    const descriptor = value[key];
    invariant(descriptor.mode === "0444" && path.basename(descriptor.file) === `${descriptor.sha256}.json`
      && descriptor.file.startsWith(
        `work/animate/release-read-only-fla-copies/${LESSON_G04_L10_RELEASE_ID}/all/${segment}/sha256/`,
      ), `authorization ${key} is not the fixed content-addressed L10 input`);
  }
}

function validateRun(value, nowMs) {
  assertExactKeys(value,
    ["runId", "nonce", "issuedAt", "notBefore", "notAfter", "ttlSeconds", "oneTimeUseRequired"],
    "authorization.run");
  invariant(RUN_ID.test(value.runId || "") && NONCE.test(value.nonce || "")
    && value.oneTimeUseRequired === true, "authorization run identity is invalid");
  const issuedAt = assertCanonicalTimestamp(value.issuedAt, "authorization.run.issuedAt");
  const notBefore = assertCanonicalTimestamp(value.notBefore, "authorization.run.notBefore");
  const notAfter = assertCanonicalTimestamp(value.notAfter, "authorization.run.notAfter");
  invariant(Number.isInteger(value.ttlSeconds)
    && value.ttlSeconds >= LESSON_ANIMATE_MIN_TTL_SECONDS
    && value.ttlSeconds <= LESSON_ANIMATE_MAX_TTL_SECONDS,
  "authorization TTL is outside the bounded window");
  invariant(notBefore >= issuedAt && notAfter > notBefore
    && notAfter - issuedAt === value.ttlSeconds * 1000,
  "authorization timestamps and TTL are inconsistent");
  invariant(nowMs >= notBefore && nowMs <= notAfter, "authorization is not currently valid");
  return {issuedAt, notBefore, notAfter};
}

function validateOperator(value, assignment) {
  assertExactKeys(value,
    ["roleId", "fullName", "stableSubjectId", "allowedHumanActions", "automationUsed"],
    "authorization.operator");
  invariant(value.roleId === assignment.value.assignment.roleId
    && normalizedHumanIdentity(value.fullName, "authorization.operator.fullName") === assignment.operator
    && normalizedHumanSubject(value.stableSubjectId, "authorization.operator.stableSubjectId") === assignment.subject
    && JSON.stringify(value.allowedHumanActions) === JSON.stringify([
      "acknowledge-legacy-actionscript-conversion-dialog",
      "close-without-saving",
    ])
    && value.automationUsed === false,
  "authorization operator or action boundary drifted");
}

async function validatePhysicalBindings(projectRoot, document) {
  const bindings = {};
  for (const [key, descriptor] of Object.entries(document.bindings)) {
    if (key === "namedOperatorAssignmentReceipt") continue;
    bindings[key] = await bindDescriptor(projectRoot, descriptor,
      `authorization binding ${key}`, {
        absoluteAllowed: key === "animateExecutable",
        executable: key === "animateExecutable",
      });
  }
  for (const kind of ["fla", "swf"]) {
    const keys = kind === "fla"
      ? ["source", "releaseWorkingCopy", "assistWorkingCopy"]
      : ["source", "assistWorkingCopy"];
    for (const key of keys) {
      const descriptor = document.member[kind][key];
      await bindDescriptor(projectRoot, descriptor, `authorization member ${kind}.${key}`, {
        source: key === "source",
      });
    }
  }
  const freezeEntries = new Map();
  for (const [index, line] of bindings.sourceFreezeManifest.contents.toString("utf8").split(/\r?\n/u).entries()) {
    if (!line) continue;
    const match = /^([a-f0-9]{64})  (.+)$/u.exec(line);
    invariant(match && !freezeEntries.has(match[2]),
      `source-freeze manifest line ${index + 1} is malformed or duplicated`);
    freezeEntries.set(match[2], match[1]);
  }
  invariant(freezeEntries.get(document.member.fla.source.sourceFreezeManifestPath)
    === document.member.fla.source.sha256
    && freezeEntries.get(document.member.swf.source.sourceFreezeManifestPath)
    === document.member.swf.source.sha256,
  "authorization FLA/SWF source-freeze bindings are absent or stale");
  return bindings;
}

function sameJson(left, right) {
  return canonicalLessonAnimateAuthorizationJson(left) === canonicalLessonAnimateAuthorizationJson(right);
}

export async function verifyLessonAnimateOneRowAuthorizationDiagnostic({
  projectRoot,
  assignmentPath,
  authorizationPath,
  ownerPublicKey,
  expected,
  now = Date.now(),
  assignmentFileOpenedHook = null,
  authorizationFileOpenedHook = null,
} = {}) {
  invariant(typeof projectRoot === "string" && path.isAbsolute(projectRoot), "projectRoot must be absolute");
  invariant(await realpath(projectRoot) === projectRoot, "projectRoot may not resolve through a symbolic link");
  invariant(expected && typeof expected === "object", "expected exact L10 row binding is required");
  const nowMs = now instanceof Date ? now.getTime() : typeof now === "string" ? Date.parse(now) : now;
  invariant(Number.isFinite(nowMs), "now must be valid");
  const ownerKey = await loadOwnerKey(projectRoot, ownerPublicKey);
  const assignment = await loadAssignment({
    projectRoot,
    assignmentPath,
    ownerKey,
    assignmentFileOpenedHook,
  });
  invariant(typeof authorizationPath === "string" && path.isAbsolute(authorizationPath),
    "authorizationPath must be absolute");
  const authorization = await stableRegularFile(authorizationPath, "one-row authorization", {
    exactMode: 0o444,
    afterOpenHook: authorizationFileOpenedHook,
  });
  assertContentAddressedReceiptPath(projectRoot, authorizationPath, authorization.sha256,
    "session-authorizations");
  const document = parseJson(authorization.contents, "one-row authorization");
  assertExactKeys(document,
    ["schemaVersion", "authorizationType", "decision", "release", "member", "run", "bindings",
      "operator", "authorityBoundary", "signature"],
    "one-row authorization");
  invariant(document.schemaVersion === LESSON_ANIMATE_AUTHORIZATION_SCHEMA_VERSION
    && document.authorizationType === AUTHORIZATION_KIND && document.decision === "authorize-once",
  "one-row authorization identity or decision drifted");
  validateRelease(document.release);
  validateMember(document.member);
  validateBindings(document.bindings);
  invariant(document.bindings.assistSourceBinding.file
    === `work/animate/dependency-authoring-audits/${document.member.animationId}/source-binding.json`,
  "authorization assist source-binding path drifted");
  const times = validateRun(document.run, nowMs);
  validateOperator(document.operator, assignment);
  validateAuthorityBoundary(document.authorityBoundary, "authorization.authorityBoundary",
    "none; one-row authoring execution authorization only");
  invariant(sameJson(document.release, expected.release)
    && sameJson(document.member, expected.member)
    && sameJson(document.bindings, {
      ...expected.bindings,
      namedOperatorAssignmentReceipt: assignment.binding,
    }), "authorization differs from the exact expected L10 row or physical bindings");
  invariant(sameJson(document.bindings.namedOperatorAssignmentReceipt, assignment.binding),
    "authorization assignment receipt binding drifted");
  const authSignature = validateSignatureShape(document.signature, ownerKey.sha256,
    "one-row authorization.signature");
  invariant(verifySignature(null, signatureBytes(document), ownerKey.contents, authSignature),
    "one-row authorization Ed25519 signature verification failed");
  const physicalBindings = await validatePhysicalBindings(projectRoot, document);
  const result = Object.freeze({
    ok: true,
    status: "verified-not-consumed-not-launched",
    releaseId: LESSON_G04_L10_RELEASE_ID,
    releaseOrdinal: document.release.releaseOrdinal,
    queueOrdinal: document.release.queueOrdinal,
    animationId: document.member.animationId,
    assetId: document.member.assetId,
    runId: document.run.runId,
    authorizationSha256: authorization.sha256,
    assignmentSha256: assignment.binding.sha256,
    nonceSha256: sha256(Buffer.from(document.run.nonce)),
    expiresAt: document.run.notAfter,
    operator: assignment.operator,
    ownerSignatureVerified: true,
    consumed: false,
    runtimeLaunched: false,
    acceptanceEffect: "none",
  });
  VERIFIED_CONTEXTS.set(result, {
    projectRoot,
    document,
    assignment,
    authorization,
    ownerKey,
    times,
    nowMs,
    physicalBindings,
  });
  return result;
}

export async function consumeLessonAnimateOneRowAuthorizationDiagnostic(options = {}) {
  const verified = await verifyLessonAnimateOneRowAuthorizationDiagnostic(options);
  const context = VERIFIED_CONTEXTS.get(verified);
  const replayRoot = path.join(fixedAuthorityRoot(context.projectRoot), "replay-locks");
  const replayRootIdentity = await snapshotReplayRootIdentity(replayRoot);
  const consumedAt = new Date(context.nowMs).toISOString();
  const baseReceipt = {
    schemaVersion: 1,
    receiptType: "lesson-g04-l10-animate-one-time-authorization-atomic-replay-lock",
    status: "authorization-consumed-launch-not-yet-attempted",
    releaseId: verified.releaseId,
    releaseOrdinal: verified.releaseOrdinal,
    queueOrdinal: verified.queueOrdinal,
    animationId: verified.animationId,
    assetId: verified.assetId,
    runId: verified.runId,
    authorizationSha256: verified.authorizationSha256,
    assignmentSha256: verified.assignmentSha256,
    nonceSha256: verified.nonceSha256,
    consumedAt,
    runtimeLaunched: false,
    acceptanceEffect: "none",
  };
  const receipt = {
    ...baseReceipt,
    receiptFingerprintSha256: sha256(Buffer.from(canonicalLessonAnimateAuthorizationJson(baseReceipt))),
  };
  const bytes = Buffer.from(`${JSON.stringify(receipt, null, 2)}\n`);
  let atomicLock;
  try {
    atomicLock = await createAtomicReplayLock({
      replayRoot,
      lockLeaf: `${verified.nonceSha256}.lock.json`,
      bytes,
      expectedRootIdentity: replayRootIdentity,
      beforeCommitHook: options.beforeReplayLockCommitHook,
    });
  } catch (error) {
    if (error.code === "EEXIST" || /File exists/u.test(error.message || "")) {
      throw new Error("Lesson Animate one-row authorization: session nonce was already consumed");
    }
    throw error;
  }
  const replayLockPath = path.join(replayRoot, `${verified.nonceSha256}.lock.json`);
  const lock = await stableRegularFile(replayLockPath, "authorization replay lock", {exactMode: 0o400});
  invariant(lock.contents.equals(bytes)
    && lock.identity.device === atomicLock.lockIdentity.device
    && lock.identity.inode === atomicLock.lockIdentity.inode,
  "authorization replay lock bytes or inode drifted after atomic creation");
  const token = Object.freeze({
    ok: true,
    status: "consumed-once-launch-not-yet-attempted",
    releaseId: verified.releaseId,
    releaseOrdinal: verified.releaseOrdinal,
    queueOrdinal: verified.queueOrdinal,
    animationId: verified.animationId,
    assetId: verified.assetId,
    runId: verified.runId,
    authorizationSha256: verified.authorizationSha256,
    assignmentSha256: verified.assignmentSha256,
    nonceSha256: verified.nonceSha256,
    replayLockPath,
    replayLockSha256: lock.sha256,
    replayRootIdentity,
    replayLockIdentity: lock.identity,
    replayLockAtomicPrimitive: atomicLock.primitive,
    expiresAt: verified.expiresAt,
    ownerSignatureVerified: true,
    consumed: true,
    runtimeLaunched: false,
    acceptanceEffect: "none",
  });
  CONSUMED_CONTEXTS.set(token, {...context, executionClaimed: false, closureCommitted: false});
  return token;
}

export function assertConsumedLessonAnimateOneRowAuthorizationDiagnostic(token, {
  animationId,
  assetId,
  runId,
  sourceFlaSha256,
  sourceSwfSha256,
  runnerSha256,
  jsflSha256,
  animateSha256,
  now = Date.now(),
} = {}) {
  const context = token && CONSUMED_CONTEXTS.get(token);
  invariant(context, "execution requires the opaque token returned by the one-time consumer");
  const document = context.document;
  invariant(token.consumed === true && token.ownerSignatureVerified === true
    && token.runtimeLaunched === false && token.acceptanceEffect === "none"
    && animationId === document.member.animationId && assetId === document.member.assetId
    && runId === document.run.runId
    && sourceFlaSha256 === document.member.fla.source.sha256
    && sourceSwfSha256 === document.member.swf.source.sha256
    && runnerSha256 === document.bindings.runner.sha256
    && jsflSha256 === document.bindings.jsfl.sha256
    && animateSha256 === document.bindings.animateExecutable.sha256,
  "consumed authorization token does not match the exact L10 execution");
  const nowMs = now instanceof Date ? now.getTime() : typeof now === "string" ? Date.parse(now) : now;
  invariant(Number.isFinite(nowMs) && nowMs >= context.times.notBefore && nowMs <= context.times.notAfter,
    "consumed authorization is outside its signed validity window");
  invariant(context.executionClaimed === false, "consumed authorization already has an execution claim");
  context.executionClaimed = true;
  return token;
}

export async function assertLessonAnimateReplayLockStillBoundDiagnostic(token) {
  const context = token && CONSUMED_CONTEXTS.get(token);
  invariant(context, "unknown consumed authorization token");
  const root = await snapshotReplayRootIdentity(path.dirname(token.replayLockPath));
  invariant(root.device === token.replayRootIdentity.device && root.inode === token.replayRootIdentity.inode,
    "authorization replay-lock root changed after consumption");
  const lock = await stableRegularFile(token.replayLockPath, "authorization replay lock", {exactMode: 0o400});
  invariant(lock.sha256 === token.replayLockSha256
    && lock.identity.device === token.replayLockIdentity.device
    && lock.identity.inode === token.replayLockIdentity.inode,
  "authorization replay lock changed after consumption");
  const assignment = await stableRegularFile(context.assignment.physical.file,
    "named-human assignment after consumption", {exactMode: 0o444});
  invariant(assignment.sha256 === context.assignment.physical.sha256
    && assignment.identity.device === context.assignment.physical.identity.device
    && assignment.identity.inode === context.assignment.physical.identity.inode,
  "named-human assignment changed after consumption");
  const authorization = await stableRegularFile(context.authorization.file,
    "one-row authorization after consumption", {exactMode: 0o444});
  invariant(authorization.sha256 === context.authorization.sha256
    && authorization.identity.device === context.authorization.identity.device
    && authorization.identity.inode === context.authorization.identity.inode,
  "one-row authorization changed after consumption");
  await validatePhysicalBindings(context.projectRoot, context.document);
  return true;
}

async function writeImmutableClosure(file, bytes) {
  const directory = path.dirname(file);
  const before = await lstat(directory, {bigint: true});
  invariant(before.isDirectory() && !before.isSymbolicLink(), "run directory is not a real directory");
  invariant(await realpath(directory) === directory, "run directory resolves through a symbolic link");
  let handle;
  try {
    handle = await open(file,
      fsConstants.O_WRONLY | fsConstants.O_CREAT | fsConstants.O_EXCL | fsConstants.O_NOFOLLOW,
      0o400);
    await handle.writeFile(bytes);
    await handle.sync();
    await chmod(file, 0o400);
  } finally {
    if (handle) await handle.close();
  }
  const directoryHandle = await open(directory, fsConstants.O_RDONLY | fsConstants.O_NOFOLLOW);
  try {
    await directoryHandle.sync();
  } finally {
    await directoryHandle.close();
  }
  const after = await lstat(directory, {bigint: true});
  invariant(after.dev === before.dev && after.ino === before.ino,
    "run directory changed while the closure was committed");
  return stableRegularFile(file, "terminal run closure", {exactMode: 0o400});
}

function validateClosureOutcome(context, outcome) {
  assertExactKeys(outcome, ["status", "endedAt", "process", "artifacts", "postRun", "failure"],
    "closure outcome");
  invariant(["passed", "failed", "interrupted"].includes(outcome.status),
    "closure status is invalid");
  const endedAt = assertCanonicalTimestamp(outcome.endedAt, "closure endedAt");
  invariant(endedAt >= context.nowMs, "closure ended before authorization consumption");
  assertExactKeys(outcome.process,
    ["launchAttempted", "spawnedAnimateProcessCount", "exitCode", "signal", "timedOut"],
    "closure process");
  invariant(typeof outcome.process.launchAttempted === "boolean"
    && Number.isInteger(outcome.process.spawnedAnimateProcessCount)
    && outcome.process.spawnedAnimateProcessCount >= 0 && outcome.process.spawnedAnimateProcessCount <= 1
    && (outcome.process.exitCode === null || Number.isInteger(outcome.process.exitCode))
    && (outcome.process.signal === null || typeof outcome.process.signal === "string")
    && typeof outcome.process.timedOut === "boolean", "closure process is malformed");
  assertExactKeys(outcome.postRun,
    ["sourceFlaSha256", "sourceSwfSha256", "releaseWorkingCopySha256",
      "assistFlaWorkingCopySha256", "assistSwfWorkingCopySha256", "allWorkingCopiesReadOnly",
      "animateProcessCountAfter"], "closure postRun");
  const member = context.document.member;
  invariant(outcome.postRun.sourceFlaSha256 === member.fla.source.sha256
    && outcome.postRun.sourceSwfSha256 === member.swf.source.sha256
    && outcome.postRun.releaseWorkingCopySha256 === member.fla.releaseWorkingCopy.sha256
    && outcome.postRun.assistFlaWorkingCopySha256 === member.fla.assistWorkingCopy.sha256
    && outcome.postRun.assistSwfWorkingCopySha256 === member.swf.assistWorkingCopy.sha256
    && outcome.postRun.allWorkingCopiesReadOnly === true
    && outcome.postRun.animateProcessCountAfter === 0,
  "closure post-run identity or process absence drifted");
  if (outcome.status === "passed") {
    invariant(outcome.process.launchAttempted === true
      && outcome.process.spawnedAnimateProcessCount === 1
      && outcome.process.exitCode === 0 && outcome.process.signal === null
      && outcome.process.timedOut === false && outcome.failure === null,
    "passing closure has a non-passing process disposition");
    invariant(outcome.artifacts && typeof outcome.artifacts === "object" && !Array.isArray(outcome.artifacts),
      "passing closure requires immutable artifact bindings");
    assertExactKeys(outcome.artifacts,
      ["controllerMarkerSha256", "rawAuthoringReportSha256", "authoringPngSha256", "workEvidenceSha256"],
      "closure artifacts");
    for (const [name, digest] of Object.entries(outcome.artifacts)) {
      assertSha256(digest, `closure artifacts.${name}`);
    }
  } else {
    invariant(typeof outcome.failure === "string" && outcome.failure.length > 0,
      "failed or interrupted closure requires a failure reason");
    invariant(outcome.artifacts === null, "failed or interrupted closure may not claim accepted artifacts");
  }
}

export async function commitLessonAnimateOneRowRunClosureDiagnostic(token, outcome) {
  const context = token && CONSUMED_CONTEXTS.get(token);
  invariant(context, "closure requires an opaque consumed authorization token");
  invariant(context.executionClaimed === true, "closure requires the single execution claim first");
  invariant(context.closureCommitted === false, "this authorization already has a committed closure");
  validateClosureOutcome(context, outcome);
  await assertLessonAnimateReplayLockStillBoundDiagnostic(token);
  const runDirectory = path.join(
    context.projectRoot,
    ...RUNS_ROOT_RELATIVE.split("/"),
    context.document.member.animationId,
    "runs",
    context.document.run.runId,
  );
  invariant(await realpath(runDirectory) === runDirectory, "exact authorized run directory is missing or redirected");
  const closure = {
    schemaVersion: 1,
    receiptType: "lesson-g04-l10-animate-authoring-terminal-run-closure",
    status: outcome.status,
    releaseId: LESSON_G04_L10_RELEASE_ID,
    releaseOrdinal: context.document.release.releaseOrdinal,
    queueOrdinal: context.document.release.queueOrdinal,
    animationId: context.document.member.animationId,
    assetId: context.document.member.assetId,
    runId: context.document.run.runId,
    authorizationSha256: token.authorizationSha256,
    assignmentSha256: token.assignmentSha256,
    nonceSha256: token.nonceSha256,
    replayLock: {
      file: path.relative(context.projectRoot, token.replayLockPath).split(path.sep).join("/"),
      sha256: token.replayLockSha256,
      device: token.replayLockIdentity.device,
      inode: token.replayLockIdentity.inode,
      atomicPrimitive: token.replayLockAtomicPrimitive,
    },
    endedAt: outcome.endedAt,
    process: outcome.process,
    artifacts: outcome.artifacts,
    postRun: outcome.postRun,
    failure: outcome.failure,
    authorityBoundary: {
      roleAssignmentOnly: false,
      originalRuntimeBehavior: false,
      audioAcceptance: false,
      humanVisualReview: false,
      ownerAcceptance: false,
      strictAcceptance: false,
      migrationCompletion: false,
      publication: false,
      acceptanceEffect: "none; work-only Adobe Animate authoring run closure",
    },
  };
  const bytes = Buffer.from(`${JSON.stringify(closure, null, 2)}\n`);
  const file = path.join(runDirectory, "terminal-closure.json");
  let physical;
  try {
    physical = await writeImmutableClosure(file, bytes);
  } catch (error) {
    if (error.code === "EEXIST" || /exist/u.test(error.message || "")) {
      throw new Error("Lesson Animate one-row authorization: terminal run closure already exists");
    }
    throw error;
  }
  invariant(physical.contents.equals(bytes), "terminal closure bytes drifted after commit");
  context.closureCommitted = true;
  return Object.freeze({
    ok: true,
    status: outcome.status,
    file,
    sha256: physical.sha256,
    bytes: physical.bytes,
    mode: "0400",
    authorityBoundary: Object.freeze({...closure.authorityBoundary}),
    acceptanceEffect: "none",
  });
}

export function lessonAnimateAuthorizationSigningBytes(document) {
  return signatureBytes(document);
}

export function lessonAnimateFixedAuthorityRoot(projectRoot) {
  return fixedAuthorityRoot(projectRoot);
}
