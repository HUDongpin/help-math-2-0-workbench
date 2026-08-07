import {createHash, createPublicKey} from "node:crypto";
import {execFile} from "node:child_process";
import {constants as fsConstants} from "node:fs";
import {lstat, open, realpath} from "node:fs/promises";
import path from "node:path";
import {TextDecoder} from "node:util";
import {promisify} from "node:util";

export const LESSON_ANIMATE_TRUST_SCHEMA_VERSION = 1;
export const LESSON_ANIMATE_RELEASE_ID = "lesson-g04-l10-perimeter-area";
export const LESSON_ANIMATE_OWNER_ROLE =
  "lesson-g04-l10-animate-one-row-owner-authorizer";
export const LESSON_ANIMATE_PRODUCTION_TRUST_ERROR_CODE =
  "L10_AA_PRODUCTION_TRUST_ANCHOR_UNAVAILABLE";
export const LESSON_ANIMATE_PRODUCTION_OWNER_ROOT =
  "/Library/Application Support/HELP Math 2.0/lesson-animate-production-trust";
export const LESSON_ANIMATE_PRODUCTION_TRUST_ROOT_PATH =
  "/Library/Application Support/HELP Math 2.0/lesson-animate-production-trust/trust-root.json";
export const LESSON_ANIMATE_PRODUCTION_REPLAY_LOCK_HELPER_ROOT =
  "/Library/Application Support/HELP Math 2.0/lesson-animate-production-trust/bin";
export const LESSON_ANIMATE_PRODUCTION_REPLAY_LOCK_HELPER_PATH =
  "/Library/Application Support/HELP Math 2.0/lesson-animate-production-trust/bin/lesson-animate-atomic-replay-lock";
export const LESSON_ANIMATE_PRODUCTION_REPLAY_LOCK_ROOT =
  "/Library/Application Support/HELP Math 2.0/lesson-animate-production-trust/replay-locks";

const TRUST_EVIDENCE_KIND =
  "lesson-g04-l10-animate-owner-production-trust-root";
const HASH = /^[a-f0-9]{64}$/u;
const INVISIBLE_OR_DIRECTIONAL =
  /[\u0000-\u001f\u007f\u200b-\u200f\u202a-\u202e\u2060-\u206f\ufeff]/u;
const TRUST_CONTEXTS = new WeakMap();
const execFileAsync = promisify(execFile);
const PRODUCTION_TRUSTED_ANCESTOR = "/Library";

function fixedProductionPhysicalPaths() {
  const paths = new Map([[PRODUCTION_TRUSTED_ANCESTOR, "directory"]]);
  for (const [target, targetKind] of [
    [LESSON_ANIMATE_PRODUCTION_TRUST_ROOT_PATH, "document"],
    [LESSON_ANIMATE_PRODUCTION_REPLAY_LOCK_HELPER_PATH, "executable"],
  ]) {
    const relative = path.relative(PRODUCTION_TRUSTED_ANCESTOR, target);
    invariant(relative && !path.isAbsolute(relative)
      && relative !== ".." && !relative.startsWith(`..${path.sep}`),
    "fixed production trust path escapes /Library");
    let cursor = PRODUCTION_TRUSTED_ANCESTOR;
    const segments = relative.split(path.sep);
    for (const [index, segment] of segments.entries()) {
      cursor = path.join(cursor, segment);
      const kind = index === segments.length - 1 ? targetKind : "directory";
      invariant(!paths.has(cursor) || paths.get(cursor) === kind,
        `fixed production physical path kind conflicts for ${cursor}`);
      paths.set(cursor, kind);
    }
  }
  return Object.freeze([...paths].map(([pathValue, kind]) => Object.freeze({
    path: pathValue,
    kind,
  })));
}

const PRODUCTION_PHYSICAL_PATHS = fixedProductionPhysicalPaths();

function invariant(condition, message) {
  if (!condition) throw new Error(`Lesson Animate production trust: ${message}`);
}

function isPlainObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!isPlainObject(value)) return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
}

export function canonicalLessonAnimateTrustJson(value) {
  invariant(value !== undefined, "canonical JSON value is undefined");
  return JSON.stringify(stable(value));
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function exactKeys(value, expected, label) {
  invariant(isPlainObject(value), `${label} must be a plain object`);
  invariant(canonicalLessonAnimateTrustJson(Object.keys(value).sort())
    === canonicalLessonAnimateTrustJson([...expected].sort()), `${label} keys drifted`);
}

function canonicalTimestamp(value, label, {nowMs, futureAllowed = false} = {}) {
  invariant(typeof value === "string" && Number.isFinite(Date.parse(value))
    && new Date(value).toISOString() === value, `${label} must be a canonical UTC ISO timestamp`);
  const observed = Date.parse(value);
  if (!futureAllowed && Number.isFinite(nowMs)) {
    invariant(observed <= nowMs, `${label} may not be in the future`);
  }
  return observed;
}

function normalizeNow(now) {
  const value = now instanceof Date ? now.getTime()
    : typeof now === "string" ? Date.parse(now) : now;
  invariant(Number.isFinite(value), "now must be a valid date or epoch millisecond value");
  return value;
}

function isContained(parent, candidate) {
  const relative = path.relative(path.resolve(parent), path.resolve(candidate));
  return relative === "" || (!path.isAbsolute(relative)
    && relative !== ".." && !relative.startsWith(`..${path.sep}`));
}

function metadata(value) {
  return Object.freeze({
    device: value.dev.toString(),
    inode: value.ino.toString(),
    links: Number(value.nlink),
    bytes: Number(value.size),
    mode: Number(value.mode & 0o7777n).toString(8).padStart(4, "0"),
    uid: Number(value.uid),
    gid: Number(value.gid),
    mtimeNs: value.mtimeNs.toString(),
    ctimeNs: value.ctimeNs.toString(),
  });
}

function sameMetadata(left, right) {
  return canonicalLessonAnimateTrustJson(left) === canonicalLessonAnimateTrustJson(right);
}

async function assertNoSymlinkPath(ownerRoot, candidate) {
  const relative = path.relative(ownerRoot, candidate);
  invariant(relative && !path.isAbsolute(relative)
    && relative !== ".." && !relative.startsWith(`..${path.sep}`),
  "trust-root file must be contained by its owner-controlled root");
  let cursor = ownerRoot;
  for (const segment of relative.split(path.sep)) {
    cursor = path.join(cursor, segment);
    const information = await lstat(cursor, {bigint: true});
    invariant(!information.isSymbolicLink(), "trust-root path may not contain symbolic links");
  }
}

function validateProductionPhysicalPolicy(records) {
  invariant(Array.isArray(records)
    && records.length === PRODUCTION_PHYSICAL_PATHS.length,
  "production trust physical-policy path set drifted");
  for (let index = 0; index < PRODUCTION_PHYSICAL_PATHS.length; index += 1) {
    const expected = PRODUCTION_PHYSICAL_PATHS[index];
    const record = records[index];
    exactKeys(record, [
      "path", "kind", "device", "inode", "links", "bytes", "uid", "gid", "mode",
      "mtimeNs", "ctimeNs", "hasAcl",
    ],
      `production trust physical-policy record ${index}`);
    invariant(record.path === expected.path && record.kind === expected.kind,
      `production trust physical-policy path ${index} drifted`);
    invariant(Number.isSafeInteger(record.uid) && record.uid === 0,
      `${record.path} must be owned by root`);
    invariant(Number.isSafeInteger(record.gid) && record.gid >= 0,
      `${record.path} has an invalid group owner`);
    invariant(typeof record.device === "string" && /^[0-9]+$/u.test(record.device)
      && typeof record.inode === "string" && /^[0-9]+$/u.test(record.inode)
      && Number.isSafeInteger(record.links) && record.links >= 1
      && Number.isSafeInteger(record.bytes) && record.bytes >= 0
      && typeof record.mtimeNs === "string" && /^-?[0-9]+$/u.test(record.mtimeNs)
      && typeof record.ctimeNs === "string" && /^-?[0-9]+$/u.test(record.ctimeNs),
    `${record.path} has invalid physical identity metadata`);
    invariant(typeof record.mode === "string" && /^[0-7]{4}$/u.test(record.mode),
      `${record.path} has an invalid POSIX mode`);
    invariant(record.hasAcl === false,
      `${record.path} may not carry an extended ACL`);
    const mode = Number.parseInt(record.mode, 8);
    if (record.kind === "directory") {
      invariant((mode & 0o022) === 0,
        `${record.path} may not be group- or world-writable`);
    } else if (record.kind === "document") {
      invariant(record.mode === "0444",
        "production trust-root file mode must be exactly 0444");
      invariant(record.links === 1,
        "production trust-root file must have exactly one physical link");
    } else {
      invariant(record.kind === "executable",
        `${record.path} has an unsupported production physical kind`);
      invariant(record.mode === "0555",
        "production replay-lock helper mode must be exactly 0555");
      invariant(record.links === 1,
        "production replay-lock helper must have exactly one physical link");
    }
  }
  return true;
}

/**
 * Diagnostic-only pure assertion used to test the production physical policy.
 * It does not load a key, construct a trust token, or authorize execution.
 */
export function assertLessonAnimateProductionTrustPhysicalPolicyDiagnostic(records) {
  return validateProductionPhysicalPolicy(records);
}

function lsOutputHasExtendedAcl(stdout, label) {
  invariant(typeof stdout === "string", `${label} ACL inspection output is not text`);
  const firstLine = stdout.split(/\r?\n/u).find((line) => line.trim().length > 0);
  invariant(typeof firstLine === "string", `${label} ACL inspection returned no record`);
  const modeToken = firstLine.trimStart().split(/\s+/u)[0];
  invariant(/^[dl-][rwxstST-]{9}[@+]?$/u.test(modeToken),
    `${label} ACL inspection returned an unrecognized mode`);
  // Darwin may use the single suffix column for `@` when extended attributes
  // coexist with an ACL. In that case `ls -e` still emits numbered ACL rows.
  // A bare `@` without a numbered row is an xattr, not itself an ACL.
  return modeToken.endsWith("+")
    || stdout.split(/\r?\n/u).slice(1).some((line) => /^\s*\d+:\s/u.test(line));
}

/** Diagnostic-only parser probe; it grants no trust or execution authority. */
export function lessonAnimateLsOutputHasExtendedAclDiagnostic(stdout) {
  return lsOutputHasExtendedAcl(stdout, "diagnostic");
}

async function hasExtendedAcl(candidate) {
  const {stdout, stderr} = await execFileAsync("/bin/ls", ["-ldeO", candidate], {
    encoding: "utf8",
    env: {LC_ALL: "C", LANG: "C", PATH: "/usr/bin:/bin"},
    maxBuffer: 64 * 1024,
  });
  invariant(stderr === "", `could not inspect the ACL for ${candidate}`);
  return lsOutputHasExtendedAcl(stdout, candidate);
}

async function readProductionPhysicalPolicyRecords() {
  invariant(process.platform === "darwin",
    "production owner trust is supported only on the macOS Animate host");
  const records = [];
  for (const expected of PRODUCTION_PHYSICAL_PATHS) {
    const resolved = await realpath(expected.path);
    invariant(resolved === expected.path,
      `${expected.path} may not resolve through a symbolic link`);
    const before = await lstat(expected.path, {bigint: true});
    invariant(!before.isSymbolicLink()
      && (expected.kind === "directory" ? before.isDirectory() : before.isFile()),
    `${expected.path} has the wrong filesystem kind`);
    const beforeMetadata = metadata(before);
    const acl = await hasExtendedAcl(expected.path);
    const after = await lstat(expected.path, {bigint: true});
    invariant(!after.isSymbolicLink()
      && (expected.kind === "directory" ? after.isDirectory() : after.isFile())
      && sameMetadata(beforeMetadata, metadata(after))
      && await realpath(expected.path) === expected.path,
    `${expected.path} changed around its ACL inspection`);
    records.push(Object.freeze({
      path: expected.path,
      kind: expected.kind,
      ...beforeMetadata,
      hasAcl: acl,
    }));
  }
  validateProductionPhysicalPolicy(records);
  return Object.freeze(records);
}

async function stableExternalFile({projectRoot, ownerRoot, trustRootPath, productionAnchor}) {
  const declaredProject = path.resolve(projectRoot);
  const declaredOwner = path.resolve(ownerRoot);
  const declaredFile = path.resolve(trustRootPath);
  const declaredParent = path.dirname(declaredFile);
  const [projectReal, ownerReal, parentReal, fileReal] = await Promise.all([
    realpath(declaredProject),
    realpath(declaredOwner),
    realpath(declaredParent),
    realpath(declaredFile),
  ]);
  invariant(projectReal === declaredProject, "project root may not resolve through a symbolic link");
  invariant(ownerReal === declaredOwner && parentReal === declaredParent && fileReal === declaredFile,
    "owner root, trust-root parent, and trust-root file must use real non-redirected paths");
  invariant(!isContained(projectReal, ownerReal) && !isContained(ownerReal, projectReal),
    "owner-controlled trust root and project root must be disjoint trees");
  invariant(isContained(ownerReal, fileReal) && path.dirname(fileReal) === parentReal,
    "trust-root file is outside its fixed owner-controlled tree");
  await assertNoSymlinkPath(ownerReal, fileReal);

  let productionPolicyBefore = null;
  if (productionAnchor) {
    invariant(declaredOwner === LESSON_ANIMATE_PRODUCTION_OWNER_ROOT
      && declaredFile === LESSON_ANIMATE_PRODUCTION_TRUST_ROOT_PATH,
    "production trust paths are not the fixed external owner paths");
    productionPolicyBefore = await readProductionPhysicalPolicyRecords();
  }

  const [ownerBeforeInfo, parentBeforeInfo, fileBeforeInfo] = await Promise.all([
    lstat(ownerReal, {bigint: true}),
    lstat(parentReal, {bigint: true}),
    lstat(fileReal, {bigint: true}),
  ]);
  invariant(ownerBeforeInfo.isDirectory() && !ownerBeforeInfo.isSymbolicLink(),
    "owner-controlled root must be a real directory");
  invariant(parentBeforeInfo.isDirectory() && !parentBeforeInfo.isSymbolicLink(),
    "trust-root parent must be a real directory");
  invariant(fileBeforeInfo.isFile() && !fileBeforeInfo.isSymbolicLink()
    && fileBeforeInfo.nlink === 1n, "trust-root file must be one ordinary non-linked file");
  invariant((fileBeforeInfo.mode & 0o022n) === 0n,
    "trust-root file may not be group- or world-writable");
  const ownerBefore = metadata(ownerBeforeInfo);
  const parentBefore = metadata(parentBeforeInfo);
  const fileBefore = metadata(fileBeforeInfo);

  let handle;
  let bytes;
  let descriptorBefore;
  let descriptorAfter;
  try {
    handle = await open(fileReal, fsConstants.O_RDONLY | fsConstants.O_NOFOLLOW);
    const before = await handle.stat({bigint: true});
    descriptorBefore = metadata(before);
    invariant(before.isFile() && before.nlink === 1n
      && descriptorBefore.device === fileBefore.device
      && descriptorBefore.inode === fileBefore.inode,
    "trust-root pathname changed before its descriptor was pinned");
    bytes = await handle.readFile();
    descriptorAfter = metadata(await handle.stat({bigint: true}));
  } finally {
    await handle?.close();
  }
  invariant(sameMetadata(descriptorBefore, descriptorAfter)
    && descriptorAfter.bytes === bytes.length,
  "trust-root descriptor changed while read");

  const [ownerAfterInfo, parentAfterInfo, fileAfterInfo] = await Promise.all([
    lstat(ownerReal, {bigint: true}),
    lstat(parentReal, {bigint: true}),
    lstat(fileReal, {bigint: true}),
  ]);
  invariant(sameMetadata(ownerBefore, metadata(ownerAfterInfo))
    && sameMetadata(parentBefore, metadata(parentAfterInfo))
    && sameMetadata(fileBefore, metadata(fileAfterInfo)),
  "owner root, trust-root parent, or trust-root file changed while read");
  invariant(await realpath(ownerReal) === ownerReal
    && await realpath(parentReal) === parentReal && await realpath(fileReal) === fileReal,
  "trust-root path changed after its descriptor was read");
  let productionPolicyAfter = null;
  if (productionAnchor) {
    productionPolicyAfter = await readProductionPhysicalPolicyRecords();
    invariant(canonicalLessonAnimateTrustJson(productionPolicyBefore)
      === canonicalLessonAnimateTrustJson(productionPolicyAfter),
    "production trust ownership, permissions, or ACL state changed while read");
  }
  return Object.freeze({
    bytes,
    sha256: sha256(bytes),
    mode: fileBefore.mode,
    ownerRoot: ownerReal,
    file: fileReal,
    binding: Object.freeze({owner: ownerBefore, parent: parentBefore, file: fileBefore}),
    productionPolicy: productionPolicyAfter,
  });
}

function decodeUtf8Json(bytes) {
  let text;
  try {
    text = new TextDecoder("utf-8", {fatal: true}).decode(bytes);
  } catch (error) {
    throw new Error(`Lesson Animate production trust: trust-root file is not valid UTF-8: ${error.message}`);
  }
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`Lesson Animate production trust: trust-root file is not valid JSON: ${error.message}`);
  }
}

function validateTrustDocument(document, {nowMs}) {
  exactKeys(document,
    ["schemaVersion", "evidenceKind", "releaseId", "trustRootId", "issuedAt", "owner"],
    "trust root");
  invariant(document.schemaVersion === LESSON_ANIMATE_TRUST_SCHEMA_VERSION
    && document.evidenceKind === TRUST_EVIDENCE_KIND
    && document.releaseId === LESSON_ANIMATE_RELEASE_ID,
  "trust-root schema, evidence kind, or release changed");
  invariant(typeof document.trustRootId === "string"
    && /^[a-z0-9][a-z0-9._-]{7,127}$/u.test(document.trustRootId),
  "trustRootId is invalid");
  const issuedAtMs = canonicalTimestamp(document.issuedAt, "trustRoot.issuedAt", {nowMs});
  exactKeys(document.owner,
    ["subjectId", "displayName", "publicKeyPem", "publicKeySha256", "keyFingerprintSha256",
      "role", "status", "notBefore", "notAfter"], "trustRoot.owner");
  const owner = document.owner;
  invariant(typeof owner.subjectId === "string" && owner.subjectId.length >= 3
    && typeof owner.displayName === "string" && owner.displayName.length >= 2
    && !INVISIBLE_OR_DIRECTIONAL.test(owner.subjectId)
    && !INVISIBLE_OR_DIRECTIONAL.test(owner.displayName),
  "owner identity is invalid");
  invariant(owner.role === LESSON_ANIMATE_OWNER_ROLE && owner.status === "active",
    "owner role or status is not active for L10 one-row authorization");
  invariant(HASH.test(owner.publicKeySha256 || "")
    && HASH.test(owner.keyFingerprintSha256 || ""), "owner key digests are invalid");
  const publicKeyBytes = Buffer.from(owner.publicKeyPem, "utf8");
  invariant(sha256(publicKeyBytes) === owner.publicKeySha256,
    "owner public-key PEM SHA-256 differs");
  let publicKey;
  try {
    publicKey = createPublicKey(owner.publicKeyPem);
  } catch (error) {
    throw new Error(`Lesson Animate production trust: owner public key is invalid: ${error.message}`);
  }
  invariant(publicKey.type === "public" && publicKey.asymmetricKeyType === "ed25519",
    "owner public key must be Ed25519");
  const fingerprint = sha256(publicKey.export({type: "spki", format: "der"}));
  invariant(fingerprint === owner.keyFingerprintSha256,
    "owner public-key fingerprint differs");
  const notBeforeMs = canonicalTimestamp(owner.notBefore, "trustRoot.owner.notBefore", {nowMs});
  invariant(notBeforeMs >= issuedAtMs && nowMs >= notBeforeMs,
    "owner authorization is not active yet or predates trust-root issuance");
  let notAfterMs = null;
  if (owner.notAfter !== null) {
    notAfterMs = canonicalTimestamp(owner.notAfter, "trustRoot.owner.notAfter",
      {nowMs, futureAllowed: true});
    invariant(notAfterMs > notBeforeMs && nowMs <= notAfterMs,
      "owner authorization is expired or has an invalid end time");
  }
  return Object.freeze({
    document,
    owner: Object.freeze({...owner}),
    publicKey,
    publicKeyBytes,
    issuedAtMs,
    notBeforeMs,
    notAfterMs,
  });
}

async function loadTrust({projectRoot, ownerControlledRoot, trustRootPath, now, productionAnchor}) {
  invariant(typeof projectRoot === "string" && path.isAbsolute(projectRoot),
    "projectRoot must be absolute");
  invariant(typeof ownerControlledRoot === "string" && path.isAbsolute(ownerControlledRoot),
    "ownerControlledRoot must be absolute");
  invariant(typeof trustRootPath === "string" && path.isAbsolute(trustRootPath),
    "trustRootPath must be absolute");
  const nowMs = normalizeNow(now);
  const physical = await stableExternalFile({
    projectRoot,
    ownerRoot: ownerControlledRoot,
    trustRootPath,
    productionAnchor,
  });
  const validated = validateTrustDocument(decodeUtf8Json(physical.bytes), {nowMs});
  const publicResult = Object.freeze({
    ok: true,
    status: productionAnchor ? "production-owner-trust-anchor-loaded" : "diagnostic-owner-trust-root-loaded",
    productionAnchor,
    diagnosticOnly: !productionAnchor,
    releaseId: LESSON_ANIMATE_RELEASE_ID,
    trustRootId: validated.document.trustRootId,
    trustRootFile: physical.file,
    trustRootFileSha256: physical.sha256,
    trustRootBindingSha256: sha256(Buffer.from(canonicalLessonAnimateTrustJson({
      binding: physical.binding,
      productionPolicy: physical.productionPolicy,
    }))),
    productionReplayLockHelperFile: productionAnchor
      ? LESSON_ANIMATE_PRODUCTION_REPLAY_LOCK_HELPER_PATH : null,
    ownerSubjectId: validated.owner.subjectId,
    ownerDisplayName: validated.owner.displayName,
    ownerPublicKeySha256: validated.owner.publicKeySha256,
    ownerKeyFingerprintSha256: validated.owner.keyFingerprintSha256,
    ownerRole: validated.owner.role,
    loadedAt: new Date(nowMs).toISOString(),
  });
  TRUST_CONTEXTS.set(publicResult, Object.freeze({
    ...validated,
    physical,
    projectRoot: path.resolve(projectRoot),
    nowMs,
    productionAnchor,
  }));
  return publicResult;
}

/**
 * Diagnostic-only loader for tests and owner integration preparation. A value
 * returned here can never authorize a production execution.
 */
export function loadLessonAnimateExternalTrustRootDiagnostic({
  projectRoot,
  ownerControlledRoot,
  trustRootPath,
  now = Date.now(),
} = {}) {
  return loadTrust({
    projectRoot,
    ownerControlledRoot,
    trustRootPath,
    now,
    productionAnchor: false,
  });
}

function productionTrustError(cause) {
  const error = new Error(
    `${LESSON_ANIMATE_PRODUCTION_TRUST_ERROR_CODE}: fixed external owner trust root is unavailable or invalid${cause ? `: ${cause.message}` : ""}`,
  );
  error.code = LESSON_ANIMATE_PRODUCTION_TRUST_ERROR_CODE;
  return error;
}

/**
 * Production entry point. Neither the owner root nor the trust-root pathname
 * can be replaced by CLI arguments, environment variables, signed candidate
 * documents, or project-local configuration.
 */
export async function loadLessonAnimateProductionTrustRoot(options = {}) {
  try {
    exactKeys(options, ["projectRoot"], "production trust loader options");
    const {projectRoot} = options;
    return await loadTrust({
      projectRoot,
      ownerControlledRoot: LESSON_ANIMATE_PRODUCTION_OWNER_ROOT,
      trustRootPath: LESSON_ANIMATE_PRODUCTION_TRUST_ROOT_PATH,
      now: Date.now(),
      productionAnchor: true,
    });
  } catch (error) {
    throw productionTrustError(error);
  }
}

export function lessonAnimateTrustContext(trust, {requireProduction = true} = {}) {
  const context = trust && TRUST_CONTEXTS.get(trust);
  invariant(context, "trust result is not the opaque value returned by this module");
  invariant(!requireProduction || context.productionAnchor,
    "diagnostic trust roots cannot authorize production execution");
  return Object.freeze({
    productionAnchor: context.productionAnchor,
    projectRoot: context.projectRoot,
    trustRootId: context.document.trustRootId,
    trustRootFile: context.physical.file,
    trustRootFileSha256: context.physical.sha256,
    ownerSubjectId: context.owner.subjectId,
    ownerPublicKeySha256: context.owner.publicKeySha256,
    ownerKeyFingerprintSha256: context.owner.keyFingerprintSha256,
    ownerPublicKey: context.publicKey,
    ownerPublicKeyBytes: Buffer.from(context.publicKeyBytes),
    productionReplayLockHelperFile: context.productionAnchor
      ? LESSON_ANIMATE_PRODUCTION_REPLAY_LOCK_HELPER_PATH : null,
    productionReplayLockRoot: context.productionAnchor
      ? LESSON_ANIMATE_PRODUCTION_REPLAY_LOCK_ROOT : null,
    loadedAtMs: context.nowMs,
  });
}
