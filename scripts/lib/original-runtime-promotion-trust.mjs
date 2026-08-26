import {
  createHash,
  createPublicKey,
  verify as cryptoVerify,
} from "node:crypto";
import {constants as fsConstants} from "node:fs";
import {lstat, open, realpath} from "node:fs/promises";
import path from "node:path";
import {TextDecoder} from "node:util";

/**
 * This module is deliberately validation-only.  It is not imported by the
 * promotion writer yet, and changing this constant is outside this module's
 * contract.
 */
export const PROMOTION_WRITES_ENABLED = false;
export const PRODUCTION_TRUST_ANCHOR_CONFIGURED = false;
export const ANCHOR_NOT_CONFIGURED_CODE = "ORIGINAL_RUNTIME_PROMOTION_ANCHOR_NOT_CONFIGURED";
export const REVOCATION_FRESHNESS_PROTOCOL_MAX_MS = 15 * 60 * 1000;

// Intentionally module-fixed and not populated from arguments, environment
// variables, project files, or caller-selected roots.
const PRODUCTION_TRUST_ANCHOR = null;

export const TRUST_SCHEMA_VERSION = 1;
export const SIGNATURE_ALGORITHM = "Ed25519";

export const TRUST_ROLES = Object.freeze({
  captureOperator: "capture-operator",
  registry: "registry-authority",
  humanReview: "human-evidence-reviewer",
  ownerDecision: "owner-representative",
  release: "release-authority",
});

export const TRUST_EVIDENCE_TYPES = Object.freeze({
  trustRoot: "original-runtime-promotion-external-trust-root",
  registryCheckpoint: "original-runtime-promotion-registry-checkpoint",
  revocationCheckpoint: "original-runtime-promotion-revocation-checkpoint",
  humanReview: "original-runtime-promotion-human-review",
  ownerDecision: "original-runtime-promotion-owner-decision",
  releaseTransaction: "original-runtime-promotion-release-transaction",
});

export const HUMAN_REVIEW_SCOPE = "accept-exact-original-runtime-candidate-evidence-only";
export const OWNER_DECISION_SCOPE = "authorize-exact-reviewed-candidate-for-original-runtime-promotion-only";
export const RELEASE_SCOPE = "release-exact-planned-original-runtime-promotion-transaction-only";

const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const NONCE_PATTERN = /^[A-Za-z0-9._~+/=-]{22,256}$/;
const BASE64_PATTERN = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
const ALLOWED_ROLES = new Set(Object.values(TRUST_ROLES));
const REQUIRED_PROMOTION_ROLES = new Set([
  TRUST_ROLES.registry,
  TRUST_ROLES.humanReview,
  TRUST_ROLES.ownerDecision,
  TRUST_ROLES.release,
]);
const EXTERNAL_TRUST_CONTEXTS = new WeakMap();
const LIVE_SESSION_TRUST_CONTEXTS = new WeakMap();

const TRUST_ROOT_KEYS = Object.freeze([
  "schemaVersion",
  "evidenceType",
  "trustRootId",
  "issuedAt",
  "subjects",
  "statePins",
]);
const STATE_PINS_KEYS = Object.freeze(["registryHead", "revocationHead"]);
const REGISTRY_HEAD_PIN_KEYS = Object.freeze(["sha256", "sequence"]);
const REVOCATION_HEAD_PIN_KEYS = Object.freeze([
  "sha256",
  "sequence",
  "minimumSequence",
  "issuedAt",
  "maximumAgeMs",
  "validUntil",
]);
const TRUST_SUBJECT_KEYS = Object.freeze([
  "subjectId",
  "displayName",
  "publicKeyPem",
  "keyFingerprintSha256",
  "authorizedRoles",
  "notBefore",
  "notAfter",
  "status",
]);
const SIGNED_ENVELOPE_KEYS = Object.freeze(["payload", "signature"]);
const SIGNATURE_KEYS = Object.freeze([
  "algorithm",
  "subjectId",
  "keyFingerprintSha256",
  "signatureBase64",
]);
const REGISTRY_CHECKPOINT_KEYS = Object.freeze([
  "schemaVersion",
  "evidenceType",
  "trustRootId",
  "trustRootSha256",
  "registryId",
  "sequence",
  "previousCheckpointSha256",
  "issuedAt",
  "entries",
]);
const REGISTRY_ENTRY_KEYS = Object.freeze([
  "subjectId",
  "keyFingerprintSha256",
  "authorizedRoles",
  "registeredAt",
  "status",
]);
const REVOCATION_CHECKPOINT_KEYS = Object.freeze([
  "schemaVersion",
  "evidenceType",
  "trustRootId",
  "trustRootSha256",
  "registryCheckpointSha256",
  "sequence",
  "previousCheckpointSha256",
  "issuedAt",
  "revocations",
]);
const REVOCATION_KEYS = Object.freeze([
  "subjectId",
  "keyFingerprintSha256",
  "revokedAt",
  "reason",
]);
const CAPTURE_KEYS = Object.freeze(["sessionId", "startedAt", "endedAt"]);
export const ARTIFACT_BINDING_KEYS = Object.freeze([
  "candidateManifestSha256",
  "candidateReportSha256",
  "traceSpecSha256",
  "sourceSwfSha256",
]);
const PLANNED_OUTPUT_KEYS = Object.freeze(["path", "sha256"]);
const HUMAN_REVIEW_KEYS = Object.freeze([
  "schemaVersion",
  "evidenceType",
  "decision",
  "animationId",
  "requirementId",
  "capture",
  "artifactBindings",
  "captureRegistryCheckpointSha256",
  "verificationRegistryHeadSha256",
  "reviewedAt",
  "scope",
]);
const OWNER_DECISION_KEYS = Object.freeze([
  "schemaVersion",
  "evidenceType",
  "decision",
  "animationId",
  "requirementId",
  "capture",
  "artifactBindings",
  "captureRegistryCheckpointSha256",
  "verificationRegistryHeadSha256",
  "humanReviewSha256",
  "decidedAt",
  "scope",
]);
const RELEASE_TRANSACTION_KEYS = Object.freeze([
  "schemaVersion",
  "evidenceType",
  "decision",
  "releaseId",
  "animationId",
  "requirementId",
  "capture",
  "artifactBindings",
  "captureRegistryCheckpointSha256",
  "verificationRegistryHeadSha256",
  "revocationCheckpointSha256",
  "humanReviewSha256",
  "ownerDecisionSha256",
  "nonce",
  "plannedOutputs",
  "releasedAt",
  "scope",
]);
const EXPECTED_PROMOTION_KEYS = Object.freeze([
  "animationId",
  "requirementId",
  "capture",
  "artifactBindings",
  "plannedOutputs",
]);

function compareText(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function isPlainObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function assertObject(value, label) {
  if (!isPlainObject(value)) throw new Error(`${label} must be a plain object`);
  return value;
}

function assertString(value, label) {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${label} must be a non-empty string`);
  return value;
}

function assertSha256(value, label) {
  if (!SHA256_PATTERN.test(value || "")) throw new Error(`${label} must be a lowercase SHA-256`);
  return value;
}

function assertPositiveInteger(value, label) {
  if (!Number.isSafeInteger(value) || value < 1) throw new Error(`${label} must be a positive safe integer`);
  return value;
}

export function assertExactKeys(value, expectedKeys, label = "object") {
  const observed = Object.keys(assertObject(value, label)).sort(compareText);
  const expected = [...expectedKeys].sort(compareText);
  if (canonicalJson(observed) !== canonicalJson(expected)) {
    throw new Error(`${label} fields must be exactly: ${expected.join(", ")}`);
  }
  return value;
}

/**
 * Minimal canonical JSON used for every signature and content digest in this
 * trust protocol.  It intentionally rejects values JSON would silently drop.
 */
export function canonicalJson(value, label = "canonical JSON value", seen = new Set()) {
  if (value === null || typeof value === "boolean" || typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error(`${label} contains a non-finite number`);
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    if (seen.has(value)) throw new Error(`${label} contains a cycle`);
    seen.add(value);
    try {
      const parts = [];
      for (let index = 0; index < value.length; index += 1) {
        if (!(index in value)) throw new Error(`${label} contains a sparse array`);
        parts.push(canonicalJson(value[index], `${label}[${index}]`, seen));
      }
      return `[${parts.join(",")}]`;
    } finally {
      seen.delete(value);
    }
  }
  if (isPlainObject(value)) {
    if (seen.has(value)) throw new Error(`${label} contains a cycle`);
    seen.add(value);
    try {
      const keys = Object.keys(value).sort(compareText);
      const parts = keys.map((key) => {
        const item = value[key];
        if (item === undefined || typeof item === "function" || typeof item === "symbol" || typeof item === "bigint") {
          throw new Error(`${label}.${key} is not representable in canonical JSON`);
        }
        return `${JSON.stringify(key)}:${canonicalJson(item, `${label}.${key}`, seen)}`;
      });
      return `{${parts.join(",")}}`;
    } finally {
      seen.delete(value);
    }
  }
  throw new Error(`${label} is not representable in canonical JSON`);
}

export function sha256Bytes(value) {
  return createHash("sha256").update(value).digest("hex");
}

export function sha256Canonical(value) {
  return sha256Bytes(Buffer.from(canonicalJson(value), "utf8"));
}

export function signedEnvelopeSha256(envelope) {
  assertExactKeys(envelope, SIGNED_ENVELOPE_KEYS, "signed envelope");
  return sha256Canonical(envelope);
}

function publicKeyObject(publicKeyPem, label) {
  assertString(publicKeyPem, `${label} PEM`);
  let key;
  try {
    key = createPublicKey(publicKeyPem);
  } catch (error) {
    throw new Error(`${label} is not a valid public key: ${error.message}`);
  }
  if (key.type !== "public" || key.asymmetricKeyType !== "ed25519") {
    throw new Error(`${label} must be an Ed25519 public key`);
  }
  return key;
}

export function ed25519PublicKeyFingerprint(publicKeyPem) {
  const key = publicKeyObject(publicKeyPem, "public key");
  return sha256Bytes(key.export({type: "spki", format: "der"}));
}

function decodeDetachedSignature(value, label) {
  assertString(value, label);
  if (!BASE64_PATTERN.test(value)) throw new Error(`${label} must be canonical base64`);
  const bytes = Buffer.from(value, "base64");
  if (bytes.length !== 64 || bytes.toString("base64") !== value) {
    throw new Error(`${label} must be one canonical 64-byte Ed25519 signature`);
  }
  return bytes;
}

/** Verify an Ed25519 signature stored outside the signed payload. */
export function verifyEd25519DetachedSignature({payload, signature, publicKeyPem, label = "signed document"}) {
  assertExactKeys(signature, SIGNATURE_KEYS, `${label} signature`);
  if (signature.algorithm !== SIGNATURE_ALGORITHM) throw new Error(`${label} signature algorithm must be Ed25519`);
  assertString(signature.subjectId, `${label} signature subjectId`);
  assertSha256(signature.keyFingerprintSha256, `${label} signature keyFingerprintSha256`);
  const key = publicKeyObject(publicKeyPem, `${label} public key`);
  const observedFingerprint = sha256Bytes(key.export({type: "spki", format: "der"}));
  if (observedFingerprint !== signature.keyFingerprintSha256) throw new Error(`${label} signer fingerprint differs from its public key`);
  const signatureBytes = decodeDetachedSignature(signature.signatureBase64, `${label} signatureBase64`);
  const valid = cryptoVerify(null, Buffer.from(canonicalJson(payload), "utf8"), key, signatureBytes);
  if (!valid) throw new Error(`${label} Ed25519 signature is invalid`);
  return {subjectId: signature.subjectId, keyFingerprintSha256: observedFingerprint};
}

function normalizeNow(now) {
  const value = now instanceof Date ? now.getTime() : typeof now === "string" ? Date.parse(now) : now;
  if (!Number.isFinite(value)) throw new Error("now must be a valid Date, ISO timestamp, or epoch millisecond value");
  return value;
}

export function parseCanonicalTimestamp(value, label, {nowMs, allowFuture = false} = {}) {
  assertString(value, label);
  const observed = Date.parse(value);
  if (!Number.isFinite(observed) || new Date(observed).toISOString() !== value) {
    throw new Error(`${label} must be a canonical UTC ISO timestamp`);
  }
  if (!allowFuture && Number.isFinite(nowMs) && observed > nowMs) throw new Error(`${label} must not be in the future`);
  return observed;
}

function validateRoles(value, label) {
  if (!Array.isArray(value) || !value.length) throw new Error(`${label} must be a non-empty role array`);
  const roles = value.map((role, index) => assertString(role, `${label}[${index}]`));
  if (roles.some((role) => !ALLOWED_ROLES.has(role))) throw new Error(`${label} contains an unsupported role`);
  const sorted = [...roles].sort(compareText);
  if (new Set(roles).size !== roles.length || canonicalJson(roles) !== canonicalJson(sorted)) {
    throw new Error(`${label} must contain unique roles in lexical order`);
  }
  return roles;
}

function subjectKey(subjectId, fingerprint) {
  return `${subjectId}\u0000${fingerprint}`;
}

/**
 * Stable key-authority projection. State-head pins are intentionally excluded
 * so the externally stored config can pin checkpoints whose signed payloads
 * bind this authority without creating a circular hash dependency.
 */
export function trustRootAuthoritySha256(config) {
  assertObject(config, "trust root config");
  return sha256Canonical({
    schemaVersion: config.schemaVersion,
    evidenceType: config.evidenceType,
    trustRootId: config.trustRootId,
    issuedAt: config.issuedAt,
    subjects: config.subjects,
  });
}

function validateStatePins(value, {nowMs}) {
  assertExactKeys(value, STATE_PINS_KEYS, "trust root config statePins");
  assertExactKeys(value.registryHead, REGISTRY_HEAD_PIN_KEYS, "trust root config statePins.registryHead");
  assertExactKeys(value.revocationHead, REVOCATION_HEAD_PIN_KEYS, "trust root config statePins.revocationHead");
  const registrySequence = assertPositiveInteger(value.registryHead.sequence, "trust root config statePins.registryHead.sequence");
  assertSha256(value.registryHead.sha256, "trust root config statePins.registryHead.sha256");
  const revocationSequence = assertPositiveInteger(value.revocationHead.sequence, "trust root config statePins.revocationHead.sequence");
  const minimumSequence = assertPositiveInteger(value.revocationHead.minimumSequence, "trust root config statePins.revocationHead.minimumSequence");
  if (revocationSequence < minimumSequence) throw new Error("trust root config revocation head is below its minimum sequence");
  assertSha256(value.revocationHead.sha256, "trust root config statePins.revocationHead.sha256");
  const issuedAtMs = parseCanonicalTimestamp(value.revocationHead.issuedAt, "trust root config statePins.revocationHead.issuedAt", {nowMs});
  const validUntilMs = parseCanonicalTimestamp(value.revocationHead.validUntil, "trust root config statePins.revocationHead.validUntil", {nowMs, allowFuture: true});
  if (validUntilMs < nowMs) throw new Error("trust root config revocation head validity has expired");
  if (validUntilMs <= issuedAtMs) throw new Error("trust root config revocation validUntil must follow its issuedAt");
  if (!Number.isSafeInteger(value.revocationHead.maximumAgeMs) || value.revocationHead.maximumAgeMs < 1) {
    throw new Error("trust root config revocation maximumAgeMs must be a positive safe integer");
  }
  if (value.revocationHead.maximumAgeMs > REVOCATION_FRESHNESS_PROTOCOL_MAX_MS) {
    throw new Error(`trust root config revocation maximumAgeMs exceeds the protocol maximum of ${REVOCATION_FRESHNESS_PROTOCOL_MAX_MS}`);
  }
  if (nowMs - issuedAtMs > value.revocationHead.maximumAgeMs) throw new Error("trust root config revocation head is stale");
  return {
    registryHead: {...value.registryHead, sequence: registrySequence},
    revocationHead: {
      ...value.revocationHead,
      sequence: revocationSequence,
      minimumSequence,
      issuedAtMs,
      validUntilMs,
    },
  };
}

export function validateTrustRootConfig(config, {now = Date.now()} = {}) {
  const nowMs = normalizeNow(now);
  assertExactKeys(config, TRUST_ROOT_KEYS, "trust root config");
  if (config.schemaVersion !== TRUST_SCHEMA_VERSION || config.evidenceType !== TRUST_EVIDENCE_TYPES.trustRoot) {
    throw new Error("trust root config schema/type is invalid");
  }
  assertString(config.trustRootId, "trust root config trustRootId");
  const issuedAtMs = parseCanonicalTimestamp(config.issuedAt, "trust root config issuedAt", {nowMs});
  if (!Array.isArray(config.subjects) || config.subjects.length < 4) {
    throw new Error("trust root config must authorize at least four distinct subjects");
  }
  const subjectsById = new Map();
  const subjectsByFingerprint = new Map();
  for (const [index, subject] of config.subjects.entries()) {
    const label = `trust root config subjects[${index}]`;
    assertExactKeys(subject, TRUST_SUBJECT_KEYS, label);
    assertString(subject.subjectId, `${label}.subjectId`);
    assertString(subject.displayName, `${label}.displayName`);
    const roles = validateRoles(subject.authorizedRoles, `${label}.authorizedRoles`);
    if (!new Set(["active", "disabled"]).has(subject.status)) throw new Error(`${label}.status is invalid`);
    const fingerprint = ed25519PublicKeyFingerprint(subject.publicKeyPem);
    if (fingerprint !== assertSha256(subject.keyFingerprintSha256, `${label}.keyFingerprintSha256`)) {
      throw new Error(`${label} public key fingerprint mismatch`);
    }
    const notBeforeMs = parseCanonicalTimestamp(subject.notBefore, `${label}.notBefore`, {nowMs});
    if (notBeforeMs < issuedAtMs) throw new Error(`${label}.notBefore predates the trust root issuance`);
    let notAfterMs = null;
    if (subject.notAfter !== null) {
      notAfterMs = parseCanonicalTimestamp(subject.notAfter, `${label}.notAfter`, {nowMs, allowFuture: true});
      if (notAfterMs <= notBeforeMs) throw new Error(`${label}.notAfter must follow notBefore`);
    }
    if (subjectsById.has(subject.subjectId)) throw new Error(`duplicate trust-root subjectId ${subject.subjectId}`);
    if (subjectsByFingerprint.has(fingerprint)) throw new Error(`duplicate trust-root key fingerprint ${fingerprint}`);
    const normalized = {...subject, authorizedRoles: roles, notBeforeMs, notAfterMs};
    subjectsById.set(subject.subjectId, normalized);
    subjectsByFingerprint.set(fingerprint, normalized);
  }
  for (const role of REQUIRED_PROMOTION_ROLES) {
    if (![...subjectsById.values()].some((subject) => subject.status === "active" && subject.authorizedRoles.includes(role))) {
      throw new Error(`trust root config has no active subject for ${role}`);
    }
  }
  const statePins = validateStatePins(config.statePins, {nowMs});
  return {
    authoritative: false,
    diagnosticOnly: true,
    config,
    sha256: trustRootAuthoritySha256(config),
    configSha256: sha256Canonical(config),
    issuedAtMs,
    nowMs,
    subjectsById,
    subjectsByFingerprint,
    statePins,
  };
}

function unwrapTrustRoot(value, options = {}) {
  return validateTrustRootConfig(value, options);
}

function requireExternalTrustRoot(value) {
  const trusted = value && typeof value === "object" ? EXTERNAL_TRUST_CONTEXTS.get(value) : null;
  if (!trusted) {
    throw new Error("diagnostic trust verification requires a trust root loaded from a real external owner-controlled path");
  }
  return trusted;
}

function registryEntryMap(entries, root, issuedAtMs, label) {
  if (!Array.isArray(entries) || entries.length < 4) throw new Error(`${label} must contain at least four subjects`);
  const result = new Map();
  let priorSubjectId = null;
  for (const [index, entry] of entries.entries()) {
    const entryLabel = `${label}[${index}]`;
    assertExactKeys(entry, REGISTRY_ENTRY_KEYS, entryLabel);
    assertString(entry.subjectId, `${entryLabel}.subjectId`);
    if (priorSubjectId !== null && compareText(priorSubjectId, entry.subjectId) >= 0) {
      throw new Error(`${label} must be uniquely sorted by subjectId`);
    }
    priorSubjectId = entry.subjectId;
    const fingerprint = assertSha256(entry.keyFingerprintSha256, `${entryLabel}.keyFingerprintSha256`);
    const roles = validateRoles(entry.authorizedRoles, `${entryLabel}.authorizedRoles`);
    if (!new Set(["active", "disabled"]).has(entry.status)) throw new Error(`${entryLabel}.status is invalid`);
    const registeredAtMs = parseCanonicalTimestamp(entry.registeredAt, `${entryLabel}.registeredAt`, {nowMs: root.nowMs});
    if (registeredAtMs > issuedAtMs) throw new Error(`${entryLabel} was registered after its checkpoint`);
    const trusted = root.subjectsById.get(entry.subjectId);
    if (!trusted || trusted.keyFingerprintSha256 !== fingerprint) throw new Error(`${entryLabel} does not match the external trust root`);
    if (roles.some((role) => !trusted.authorizedRoles.includes(role))) throw new Error(`${entryLabel} grants a role absent from the external trust root`);
    result.set(entry.subjectId, {...entry, authorizedRoles: roles, registeredAtMs});
  }
  return result;
}

function assertSubjectUsableAt(root, subject, eventTimeMs, role, label) {
  if (subject.status !== "active") throw new Error(`${label} subject is not active`);
  if (!subject.authorizedRoles.includes(role)) throw new Error(`${label} subject is not authorized for ${role}`);
  if (eventTimeMs < subject.notBeforeMs || (subject.notAfterMs !== null && eventTimeMs > subject.notAfterMs)) {
    throw new Error(`${label} key is outside its validity interval`);
  }
}

function verifyEnvelopeWithRoot(envelope, root, role, eventTimeMs, label) {
  assertExactKeys(envelope, SIGNED_ENVELOPE_KEYS, label);
  assertObject(envelope.payload, `${label}.payload`);
  assertExactKeys(envelope.signature, SIGNATURE_KEYS, `${label}.signature`);
  const subject = root.subjectsById.get(envelope.signature.subjectId);
  if (!subject || subject.keyFingerprintSha256 !== envelope.signature.keyFingerprintSha256) {
    throw new Error(`${label} signer is absent from the external trust root`);
  }
  assertSubjectUsableAt(root, subject, eventTimeMs, role, `${label} signer`);
  verifyEd25519DetachedSignature({
    payload: envelope.payload,
    signature: envelope.signature,
    publicKeyPem: subject.publicKeyPem,
    label,
  });
  return {
    subject,
    subjectId: subject.subjectId,
    keyFingerprintSha256: subject.keyFingerprintSha256,
  };
}

function assertRegistryAuthorization(signer, entriesById, role, label) {
  const entry = entriesById.get(signer.subjectId);
  if (
    !entry || entry.status !== "active" || entry.keyFingerprintSha256 !== signer.keyFingerprintSha256 ||
    !entry.authorizedRoles.includes(role)
  ) throw new Error(`${label} signer is not active and authorized for ${role} in the registry checkpoint`);
}

function assertAppendOnlyRecords(previousRecords, nextRecords, identity, label) {
  const current = new Map(nextRecords.map((record) => [identity(record), record]));
  for (const record of previousRecords) {
    const found = current.get(identity(record));
    if (!found || canonicalJson(found) !== canonicalJson(record)) throw new Error(`${label} is not append-only`);
  }
}

function verifyRegistryCheckpointHistory({trustRoot, checkpoints, captureStartedAt, now = Date.now()}) {
  const root = unwrapTrustRoot(trustRoot, {now});
  const startedAtMs = parseCanonicalTimestamp(captureStartedAt, "capture startedAt", {nowMs: root.nowMs});
  if (!Array.isArray(checkpoints) || !checkpoints.length) throw new Error("registry checkpoint history must be non-empty");
  let previous = null;
  const verified = [];
  for (const [index, envelope] of checkpoints.entries()) {
    const label = `registry checkpoint[${index}]`;
    assertExactKeys(envelope, SIGNED_ENVELOPE_KEYS, label);
    const payload = envelope.payload;
    assertExactKeys(payload, REGISTRY_CHECKPOINT_KEYS, `${label}.payload`);
    if (payload.schemaVersion !== TRUST_SCHEMA_VERSION || payload.evidenceType !== TRUST_EVIDENCE_TYPES.registryCheckpoint) {
      throw new Error(`${label} schema/type is invalid`);
    }
    if (payload.trustRootId !== root.config.trustRootId || payload.trustRootSha256 !== root.sha256) {
      throw new Error(`${label} does not bind the exact external trust root`);
    }
    assertString(payload.registryId, `${label}.payload.registryId`);
    const issuedAtMs = parseCanonicalTimestamp(payload.issuedAt, `${label}.payload.issuedAt`, {nowMs: root.nowMs});
    const sequence = assertPositiveInteger(payload.sequence, `${label}.payload.sequence`);
    if (index === 0) {
      if (sequence !== 1 || payload.previousCheckpointSha256 !== null) throw new Error("registry checkpoint history must start at sequence 1 with a null predecessor");
    } else {
      if (sequence !== previous.payload.sequence + 1 || payload.previousCheckpointSha256 !== previous.sha256) {
        throw new Error(`${label} breaks the append-only checkpoint hash chain`);
      }
      if (issuedAtMs <= previous.issuedAtMs) throw new Error(`${label} timestamp must strictly follow its predecessor`);
      if (payload.registryId !== previous.payload.registryId) throw new Error(`${label} registryId changed inside one history`);
    }
    const entriesById = registryEntryMap(payload.entries, root, issuedAtMs, `${label}.payload.entries`);
    if (previous) assertAppendOnlyRecords(previous.payload.entries, payload.entries, (entry) => entry.subjectId, `${label} entries`);
    const signer = verifyEnvelopeWithRoot(envelope, root, TRUST_ROLES.registry, issuedAtMs, label);
    assertRegistryAuthorization(signer, entriesById, TRUST_ROLES.registry, label);
    const item = {
      envelope,
      payload,
      sha256: signedEnvelopeSha256(envelope),
      issuedAtMs,
      entriesById,
      signer,
    };
    verified.push(item);
    previous = item;
  }
  if (
    previous.sha256 !== root.statePins.registryHead.sha256 ||
    previous.payload.sequence !== root.statePins.registryHead.sequence
  ) throw new Error("provided registry history does not terminate at the externally pinned current registry head");
  const captureCheckpoint = [...verified].reverse().find(({issuedAtMs}) => issuedAtMs < startedAtMs);
  if (!captureCheckpoint) throw new Error("no signed registry checkpoint existed before capture startedAt");
  for (const checkpoint of verified.filter(({issuedAtMs}) => issuedAtMs >= startedAtMs)) {
    assertRegistryAuthorization(
      checkpoint.signer,
      captureCheckpoint.entriesById,
      TRUST_ROLES.registry,
      `post-capture registry checkpoint sequence ${checkpoint.payload.sequence}`,
    );
  }
  return {
    root,
    history: verified,
    checkpoint: previous,
    checkpointSha256: previous.sha256,
    entriesById: previous.entriesById,
    signer: previous.signer,
    captureCheckpoint,
    captureCheckpointSha256: captureCheckpoint.sha256,
    captureEntriesById: captureCheckpoint.entriesById,
    currentCheckpoint: previous,
    currentCheckpointSha256: previous.sha256,
    captureStartedAtMs: startedAtMs,
  };
}

function revocationMap(records, registry, boundRegistryCheckpoint, issuedAtMs, label) {
  if (!Array.isArray(records)) throw new Error(`${label} must be an array`);
  const result = new Map();
  let priorKey = null;
  for (const [index, record] of records.entries()) {
    const recordLabel = `${label}[${index}]`;
    assertExactKeys(record, REVOCATION_KEYS, recordLabel);
    assertString(record.subjectId, `${recordLabel}.subjectId`);
    const fingerprint = assertSha256(record.keyFingerprintSha256, `${recordLabel}.keyFingerprintSha256`);
    const key = subjectKey(record.subjectId, fingerprint);
    if (priorKey !== null && compareText(priorKey, key) >= 0) throw new Error(`${label} must be uniquely sorted by subjectId/fingerprint`);
    priorKey = key;
    const registered = boundRegistryCheckpoint.entriesById.get(record.subjectId);
    if (!registered || registered.keyFingerprintSha256 !== fingerprint) throw new Error(`${recordLabel} does not name a registered key`);
    const revokedAtMs = parseCanonicalTimestamp(record.revokedAt, `${recordLabel}.revokedAt`, {nowMs: registry.root.nowMs});
    if (revokedAtMs < registered.registeredAtMs || revokedAtMs > issuedAtMs) {
      throw new Error(`${recordLabel}.revokedAt is outside the key-registration-to-revocation checkpoint interval`);
    }
    assertString(record.reason, `${recordLabel}.reason`);
    result.set(key, {...record, revokedAtMs});
  }
  return result;
}

function verifyRevocationCheckpointHistory({registry, checkpoints}) {
  if (!registry?.checkpoint || !registry?.root) throw new Error("a verified registry checkpoint context is required");
  if (!Array.isArray(checkpoints) || !checkpoints.length) throw new Error("revocation checkpoint history must be non-empty");
  let previous = null;
  const verified = [];
  const registryByHash = new Map(registry.history.map((checkpoint) => [checkpoint.sha256, checkpoint]));
  for (const [index, envelope] of checkpoints.entries()) {
    const label = `revocation checkpoint[${index}]`;
    assertExactKeys(envelope, SIGNED_ENVELOPE_KEYS, label);
    const payload = envelope.payload;
    assertExactKeys(payload, REVOCATION_CHECKPOINT_KEYS, `${label}.payload`);
    if (payload.schemaVersion !== TRUST_SCHEMA_VERSION || payload.evidenceType !== TRUST_EVIDENCE_TYPES.revocationCheckpoint) {
      throw new Error(`${label} schema/type is invalid`);
    }
    if (payload.trustRootId !== registry.root.config.trustRootId || payload.trustRootSha256 !== registry.root.sha256) {
      throw new Error(`${label} does not bind the exact trust root`);
    }
    const boundRegistryCheckpoint = registryByHash.get(payload.registryCheckpointSha256);
    if (!boundRegistryCheckpoint) throw new Error(`${label} binds a registry checkpoint outside the verified append-only history`);
    const issuedAtMs = parseCanonicalTimestamp(payload.issuedAt, `${label}.payload.issuedAt`, {nowMs: registry.root.nowMs});
    if (issuedAtMs < boundRegistryCheckpoint.issuedAtMs) throw new Error(`${label} predates its bound registry checkpoint`);
    const currentRegistryAtIssue = [...registry.history].reverse().find((checkpoint) => checkpoint.issuedAtMs <= issuedAtMs);
    if (!currentRegistryAtIssue || currentRegistryAtIssue.sha256 !== boundRegistryCheckpoint.sha256) {
      throw new Error(`${label} does not bind the current registry head that existed when it was issued`);
    }
    const sequence = assertPositiveInteger(payload.sequence, `${label}.payload.sequence`);
    if (index === 0) {
      if (sequence !== 1 || payload.previousCheckpointSha256 !== null) throw new Error("revocation checkpoint history must start at sequence 1 with a null predecessor");
    } else {
      if (sequence !== previous.payload.sequence + 1 || payload.previousCheckpointSha256 !== previous.sha256) {
        throw new Error(`${label} breaks the append-only revocation hash chain`);
      }
      if (issuedAtMs <= previous.issuedAtMs) throw new Error(`${label} timestamp must strictly follow its predecessor`);
      if (boundRegistryCheckpoint.payload.sequence < previous.boundRegistrySequence) {
        throw new Error(`${label} moves backward to an older registry checkpoint`);
      }
    }
    const revocationsByKey = revocationMap(payload.revocations, registry, boundRegistryCheckpoint, issuedAtMs, `${label}.payload.revocations`);
    if (previous) {
      assertAppendOnlyRecords(
        previous.payload.revocations,
        payload.revocations,
        (record) => subjectKey(record.subjectId, record.keyFingerprintSha256),
        `${label} revocations`,
      );
    }
    const signer = verifyEnvelopeWithRoot(envelope, registry.root, TRUST_ROLES.registry, issuedAtMs, label);
    assertRegistryAuthorization(signer, boundRegistryCheckpoint.entriesById, TRUST_ROLES.registry, label);
    if (
      signer.subjectId !== boundRegistryCheckpoint.signer.subjectId ||
      signer.keyFingerprintSha256 !== boundRegistryCheckpoint.signer.keyFingerprintSha256
    ) throw new Error(`${label} must be signed by its bound registry checkpoint authority`);
    if (revocationsByKey.has(subjectKey(signer.subjectId, signer.keyFingerprintSha256))) {
      throw new Error(`${label} is signed by a revoked registry key`);
    }
    const item = {
      envelope,
      payload,
      sha256: signedEnvelopeSha256(envelope),
      issuedAtMs,
      revocationsByKey,
      signer,
      boundRegistrySequence: boundRegistryCheckpoint.payload.sequence,
    };
    verified.push(item);
    previous = item;
  }
  if (previous.payload.registryCheckpointSha256 !== registry.checkpointSha256) {
    throw new Error("current revocation head does not bind the externally pinned current registry head");
  }
  const pinned = registry.root.statePins.revocationHead;
  if (previous.sha256 !== pinned.sha256 || previous.payload.sequence !== pinned.sequence) {
    throw new Error("provided revocation history does not terminate at the externally pinned current revocation head");
  }
  if (previous.payload.sequence < pinned.minimumSequence) throw new Error("provided revocation history is below the externally pinned minimum sequence");
  if (previous.payload.issuedAt !== pinned.issuedAt) throw new Error("provided revocation head issuedAt differs from the external freshness pin");
  return {
    history: verified,
    checkpoint: previous,
    checkpointSha256: previous.sha256,
    issuedAtMs: previous.issuedAtMs,
    revocationsByKey: previous.revocationsByKey,
    signer: previous.signer,
  };
}

export function validateCaptureBinding(value, {now = Date.now(), label = "capture"} = {}) {
  const nowMs = normalizeNow(now);
  assertExactKeys(value, CAPTURE_KEYS, label);
  assertString(value.sessionId, `${label}.sessionId`);
  const startedAtMs = parseCanonicalTimestamp(value.startedAt, `${label}.startedAt`, {nowMs});
  const endedAtMs = parseCanonicalTimestamp(value.endedAt, `${label}.endedAt`, {nowMs});
  if (endedAtMs <= startedAtMs) throw new Error(`${label}.endedAt must follow startedAt`);
  return {...value, startedAtMs, endedAtMs};
}

export function validateArtifactBindings(value, label = "artifact bindings") {
  assertExactKeys(value, ARTIFACT_BINDING_KEYS, label);
  for (const key of ARTIFACT_BINDING_KEYS) assertSha256(value[key], `${label}.${key}`);
  return value;
}

function normalizePortableOutputPath(value, label) {
  assertString(value, label);
  if (value.includes("\\") || path.posix.isAbsolute(value)) throw new Error(`${label} must be a portable project-relative path`);
  const normalized = path.posix.normalize(value);
  if (normalized !== value || normalized === "." || normalized === ".." || normalized.startsWith("../")) {
    throw new Error(`${label} escapes or is not normalized relative to the project root`);
  }
  if (normalized === "source-assets" || normalized.startsWith("source-assets/")) {
    throw new Error(`${label} must never target preserved source-assets`);
  }
  return normalized;
}

export function validatePlannedOutputs(value, label = "planned outputs") {
  if (!Array.isArray(value) || !value.length) throw new Error(`${label} must be a non-empty array`);
  let previousPath = null;
  for (const [index, output] of value.entries()) {
    const outputLabel = `${label}[${index}]`;
    assertExactKeys(output, PLANNED_OUTPUT_KEYS, outputLabel);
    const outputPath = normalizePortableOutputPath(output.path, `${outputLabel}.path`);
    assertSha256(output.sha256, `${outputLabel}.sha256`);
    if (previousPath !== null && compareText(previousPath, outputPath) >= 0) {
      throw new Error(`${label} must contain unique outputs in lexical path order`);
    }
    previousPath = outputPath;
  }
  return value;
}

function sameCanonical(left, right) {
  return canonicalJson(left) === canonicalJson(right);
}

function assertExpectedIdentity(payload, expected, label) {
  if (payload.animationId !== expected.animationId || payload.requirementId !== expected.requirementId) {
    throw new Error(`${label} animation/requirement identity differs from the planned promotion`);
  }
  if (!sameCanonical(payload.capture, expected.capture)) throw new Error(`${label} capture binding differs from the planned promotion`);
  if (!sameCanonical(payload.artifactBindings, expected.artifactBindings)) {
    throw new Error(`${label} candidate/spec/source hashes differ from the planned promotion`);
  }
}

function assertNotRevoked(signer, revocations, label) {
  if (revocations.revocationsByKey.has(subjectKey(signer.subjectId, signer.keyFingerprintSha256))) {
    throw new Error(`${label} signer key is revoked`);
  }
}

function verifyRegisteredEnvelope({envelope, payloadKeys, evidenceType, role, eventField, label, registry, revocations}) {
  assertExactKeys(envelope, SIGNED_ENVELOPE_KEYS, label);
  assertExactKeys(envelope.payload, payloadKeys, `${label}.payload`);
  const payload = envelope.payload;
  if (payload.schemaVersion !== TRUST_SCHEMA_VERSION || payload.evidenceType !== evidenceType) {
    throw new Error(`${label} schema/type is invalid`);
  }
  const eventTimeMs = parseCanonicalTimestamp(payload[eventField], `${label}.payload.${eventField}`, {nowMs: registry.root.nowMs});
  const signer = verifyEnvelopeWithRoot(envelope, registry.root, role, eventTimeMs, label);
  assertRegistryAuthorization(signer, registry.captureEntriesById, role, `${label} capture-time registration`);
  assertNotRevoked(signer, revocations, label);
  return {envelope, payload, signer, eventTimeMs, sha256: signedEnvelopeSha256(envelope)};
}

function verifyHumanReview({envelope, registry, revocations, expected}) {
  const result = verifyRegisteredEnvelope({
    envelope,
    payloadKeys: HUMAN_REVIEW_KEYS,
    evidenceType: TRUST_EVIDENCE_TYPES.humanReview,
    role: TRUST_ROLES.humanReview,
    eventField: "reviewedAt",
    label: "human review",
    registry,
    revocations,
  });
  const {payload} = result;
  if (payload.decision !== "accepted" || payload.scope !== HUMAN_REVIEW_SCOPE) throw new Error("human review decision/scope is invalid");
  validateCaptureBinding(payload.capture, {now: registry.root.nowMs, label: "human review capture"});
  validateArtifactBindings(payload.artifactBindings, "human review artifactBindings");
  assertExpectedIdentity(payload, expected, "human review");
  if (payload.captureRegistryCheckpointSha256 !== registry.captureCheckpointSha256) throw new Error("human review capture-time registry checkpoint binding differs");
  if (payload.verificationRegistryHeadSha256 !== registry.currentCheckpointSha256) throw new Error("human review verification registry head binding differs");
  if (result.eventTimeMs < expected.captureTimes.endedAtMs) throw new Error("human review predates capture completion");
  if (result.eventTimeMs < registry.currentCheckpoint.issuedAtMs) throw new Error("human review predates its verification registry head");
  return result;
}

function verifyOwnerDecision({envelope, registry, revocations, expected, humanReview}) {
  const result = verifyRegisteredEnvelope({
    envelope,
    payloadKeys: OWNER_DECISION_KEYS,
    evidenceType: TRUST_EVIDENCE_TYPES.ownerDecision,
    role: TRUST_ROLES.ownerDecision,
    eventField: "decidedAt",
    label: "owner decision",
    registry,
    revocations,
  });
  const {payload} = result;
  if (payload.decision !== "authorized" || payload.scope !== OWNER_DECISION_SCOPE) throw new Error("owner decision decision/scope is invalid");
  validateCaptureBinding(payload.capture, {now: registry.root.nowMs, label: "owner decision capture"});
  validateArtifactBindings(payload.artifactBindings, "owner decision artifactBindings");
  assertExpectedIdentity(payload, expected, "owner decision");
  if (payload.captureRegistryCheckpointSha256 !== registry.captureCheckpointSha256) throw new Error("owner decision capture-time registry checkpoint binding differs");
  if (payload.verificationRegistryHeadSha256 !== registry.currentCheckpointSha256) throw new Error("owner decision verification registry head binding differs");
  if (payload.humanReviewSha256 !== humanReview.sha256) throw new Error("owner decision does not bind the exact signed human review");
  if (result.eventTimeMs < humanReview.eventTimeMs) throw new Error("owner decision predates human review");
  return result;
}

function normalizeReplayedNonces(value) {
  if (!(Array.isArray(value) || value instanceof Set)) throw new Error("replayedNonces must be supplied by the caller as an array or Set");
  const result = new Set();
  for (const [index, nonce] of [...value].entries()) {
    assertString(nonce, `replayedNonces[${index}]`);
    if (result.has(nonce)) throw new Error("replayedNonces contains a duplicate nonce");
    result.add(nonce);
  }
  return result;
}

function verifyReleaseTransaction({
  envelope,
  registry,
  revocations,
  expected,
  humanReview,
  ownerDecision,
  replayedNonces,
}) {
  const result = verifyRegisteredEnvelope({
    envelope,
    payloadKeys: RELEASE_TRANSACTION_KEYS,
    evidenceType: TRUST_EVIDENCE_TYPES.releaseTransaction,
    role: TRUST_ROLES.release,
    eventField: "releasedAt",
    label: "release transaction",
    registry,
    revocations,
  });
  const {payload} = result;
  if (payload.decision !== "authorized" || payload.scope !== RELEASE_SCOPE) throw new Error("release transaction decision/scope is invalid");
  assertString(payload.releaseId, "release transaction releaseId");
  validateCaptureBinding(payload.capture, {now: registry.root.nowMs, label: "release transaction capture"});
  validateArtifactBindings(payload.artifactBindings, "release transaction artifactBindings");
  validatePlannedOutputs(payload.plannedOutputs, "release transaction plannedOutputs");
  assertExpectedIdentity(payload, expected, "release transaction");
  if (!sameCanonical(payload.plannedOutputs, expected.plannedOutputs)) {
    throw new Error("release transaction planned output paths/hashes differ from the exact derived plan");
  }
  if (payload.captureRegistryCheckpointSha256 !== registry.captureCheckpointSha256) throw new Error("release transaction capture-time registry checkpoint binding differs");
  if (payload.verificationRegistryHeadSha256 !== registry.currentCheckpointSha256) throw new Error("release transaction verification registry head binding differs");
  if (payload.revocationCheckpointSha256 !== revocations.checkpointSha256) throw new Error("release transaction revocation checkpoint binding differs");
  if (payload.humanReviewSha256 !== humanReview.sha256) throw new Error("release transaction human review binding differs");
  if (payload.ownerDecisionSha256 !== ownerDecision.sha256) throw new Error("release transaction owner decision binding differs");
  if (!NONCE_PATTERN.test(payload.nonce || "")) throw new Error("release transaction nonce is invalid or too weak");
  if (normalizeReplayedNonces(replayedNonces).has(payload.nonce)) throw new Error("release transaction nonce has already been used");
  if (revocations.issuedAtMs < ownerDecision.eventTimeMs) throw new Error("revocation checkpoint must be current at or after the owner decision");
  if (result.eventTimeMs < revocations.issuedAtMs) throw new Error("release transaction predates its revocation checkpoint");
  if (result.eventTimeMs < ownerDecision.eventTimeMs) throw new Error("release transaction predates the owner decision");
  return {
    ...result,
    nonceReplayEvidence: {
      status: "caller-snapshot-only",
      observedUnused: true,
      durableReservationProven: false,
      authoritative: false,
    },
    nonceReservationRequired: true,
  };
}

function validateExpectedPromotion(expected, nowMs) {
  assertExactKeys(expected, EXPECTED_PROMOTION_KEYS, "expected promotion");
  assertString(expected.animationId, "expected promotion animationId");
  assertString(expected.requirementId, "expected promotion requirementId");
  const captureTimes = validateCaptureBinding(expected.capture, {now: nowMs, label: "expected promotion capture"});
  validateArtifactBindings(expected.artifactBindings, "expected promotion artifactBindings");
  validatePlannedOutputs(expected.plannedOutputs, "expected promotion plannedOutputs");
  return {...expected, capture: {...expected.capture}, captureTimes};
}

function publicSigner(signer) {
  return Object.freeze({
    subjectId: signer.subjectId,
    keyFingerprintSha256: signer.keyFingerprintSha256,
  });
}

function verifyTrustBundleDiagnostic({
  trustRoot,
  registryCheckpoints,
  revocationCheckpoints,
  humanReview,
  ownerDecision,
  releaseTransaction,
  expected,
  replayedNonces,
  now = Date.now(),
}) {
  const nowMs = normalizeNow(now);
  const externallyLoaded = requireExternalTrustRoot(trustRoot);
  if (nowMs < externallyLoaded.loadedAtMs) throw new Error("verification time must not roll back before external trust-root loading");
  const rootConfig = JSON.parse(externallyLoaded.canonicalConfig);
  const root = validateTrustRootConfig(rootConfig, {now: nowMs});
  const plan = validateExpectedPromotion(expected, nowMs);
  const registry = verifyRegistryCheckpointHistory({
    trustRoot: rootConfig,
    checkpoints: registryCheckpoints,
    captureStartedAt: plan.capture.startedAt,
    now: nowMs,
  });
  const revocations = verifyRevocationCheckpointHistory({registry, checkpoints: revocationCheckpoints});
  const human = verifyHumanReview({envelope: humanReview, registry, revocations, expected: plan});
  const owner = verifyOwnerDecision({envelope: ownerDecision, registry, revocations, expected: plan, humanReview: human});
  const release = verifyReleaseTransaction({
    envelope: releaseTransaction,
    registry,
    revocations,
    expected: plan,
    humanReview: human,
    ownerDecision: owner,
    replayedNonces,
  });
  const requiredSigners = [registry.signer, human.signer, owner.signer, release.signer];
  if (new Set(requiredSigners.map(({subjectId}) => subjectId)).size !== 4) {
    throw new Error("registry, human review, owner decision, and release must use four distinct subject IDs");
  }
  if (new Set(requiredSigners.map(({keyFingerprintSha256}) => keyFingerprintSha256)).size !== 4) {
    throw new Error("registry, human review, owner decision, and release must use four distinct key fingerprints");
  }
  const reviewerIds = new Set([human.signer.subjectId, owner.signer.subjectId, release.signer.subjectId]);
  const reviewerFingerprints = new Set([human.signer.keyFingerprintSha256, owner.signer.keyFingerprintSha256, release.signer.keyFingerprintSha256]);
  for (const checkpoint of registry.history) {
    if (reviewerIds.has(checkpoint.signer.subjectId) || reviewerFingerprints.has(checkpoint.signer.keyFingerprintSha256)) {
      throw new Error("every registry checkpoint signer must be distinct from human, owner, and release signers");
    }
  }
  for (const [label, signer] of [
    ...registry.history.map((checkpoint) => [`registry checkpoint ${checkpoint.payload.sequence}`, checkpoint.signer]),
    ["human review", human.signer],
    ["owner decision", owner.signer],
    ["release", release.signer],
  ]) assertNotRevoked(signer, revocations, label);
  const nonceReservationDescriptor = Object.freeze({
    schemaVersion: 1,
    evidenceType: "original-runtime-promotion-nonce-reservation-request",
    nonce: release.payload.nonce,
    releaseTransactionSha256: release.sha256,
    captureRegistryCheckpointSha256: registry.captureCheckpointSha256,
    verificationRegistryHeadSha256: registry.currentCheckpointSha256,
    revocationCheckpointSha256: revocations.checkpointSha256,
    status: "reservation-required-not-persisted",
    statement: "The caller-supplied replay snapshot found no match, but this verifier performs no durable atomic nonce reservation. A transaction system must persist this descriptor before any future promotion write.",
  });
  return {
    ok: true,
    diagnosticOnly: true,
    cryptographicChecksPassed: true,
    trustVerified: false,
    authoritative: false,
    productionAnchorConfigured: PRODUCTION_TRUST_ANCHOR_CONFIGURED,
    authoritativePromotionPerformed: false,
    promotionWritesEnabled: PROMOTION_WRITES_ENABLED,
    trustRootSha256: root.sha256,
    externalTrustAnchor: {
      authoritySha256: root.sha256,
      configSha256: externallyLoaded.configSha256,
      fileSha256: externallyLoaded.fileSha256,
      fileBindingSha256: externallyLoaded.fileBindingSha256,
    },
    verifiedAt: new Date(nowMs).toISOString(),
    freshnessPolicy: {
      protocolMaximumAgeMs: REVOCATION_FRESHNESS_PROTOCOL_MAX_MS,
      configuredMaximumAgeMs: root.statePins.revocationHead.maximumAgeMs,
      revocationHeadIssuedAt: root.config.statePins.revocationHead.issuedAt,
      revocationHeadValidUntil: root.config.statePins.revocationHead.validUntil,
    },
    captureRegistryCheckpointSha256: registry.captureCheckpointSha256,
    verificationRegistryHeadSha256: registry.currentCheckpointSha256,
    revocationCheckpointSha256: revocations.checkpointSha256,
    humanReviewSha256: human.sha256,
    ownerDecisionSha256: owner.sha256,
    releaseTransactionSha256: release.sha256,
    nonce: release.payload.nonce,
    nonceReplayEvidence: release.nonceReplayEvidence,
    nonceReservationDescriptor,
    signers: {
      captureRegistry: publicSigner(registry.captureCheckpoint.signer),
      verificationRegistry: publicSigner(registry.signer),
      humanReview: publicSigner(human.signer),
      ownerDecision: publicSigner(owner.signer),
      release: publicSigner(release.signer),
    },
  };
}

/**
 * Read-only diagnostic. Passing proves internal cryptographic consistency only;
 * it never supplies production authority and never enables promotion writes.
 */
export function verifyOriginalRuntimePromotionTrustDiagnostic(options) {
  return deepFreeze(verifyTrustBundleDiagnostic(options));
}

/**
 * Establish a read-only trust context for a live original-runtime session.
 *
 * The returned object intentionally contains no keys or mutable registry
 * records. It is accepted by verifyOriginalRuntimeLiveSessionRoleEnvelopeDiagnostic
 * only while its WeakMap backing context remains intact, so a caller cannot
 * reconstruct or edit one from serialized JSON.
 */
export function verifyOriginalRuntimeLiveSessionTrustStateDiagnostic({
  trustRoot,
  registryCheckpoints,
  revocationCheckpoints,
  sessionStartedAt,
  now = Date.now(),
} = {}) {
  const nowMs = normalizeNow(now);
  const externallyLoaded = requireExternalTrustRoot(trustRoot);
  if (nowMs < externallyLoaded.loadedAtMs) {
    throw new Error("verification time must not roll back before external trust-root loading");
  }
  const rootConfig = JSON.parse(externallyLoaded.canonicalConfig);
  const registry = verifyRegistryCheckpointHistory({
    trustRoot: rootConfig,
    checkpoints: registryCheckpoints,
    captureStartedAt: sessionStartedAt,
    now: nowMs,
  });
  const revocations = verifyRevocationCheckpointHistory({
    registry,
    checkpoints: revocationCheckpoints,
  });
  const result = deepFreeze({
    ok: true,
    diagnosticOnly: true,
    authoritative: false,
    productionAnchorConfigured: false,
    trustRootAuthoritySha256: registry.root.sha256,
    trustRootConfigSha256: externallyLoaded.configSha256,
    trustRootFileSha256: externallyLoaded.fileSha256,
    trustRootFileBindingSha256: externallyLoaded.fileBindingSha256,
    captureRegistryCheckpointSha256: registry.captureCheckpointSha256,
    verificationRegistryHeadSha256: registry.currentCheckpointSha256,
    revocationCheckpointSha256: revocations.checkpointSha256,
    sessionStartedAt,
    verifiedAt: new Date(nowMs).toISOString(),
    registrySigner: publicSigner(registry.signer),
  });
  LIVE_SESSION_TRUST_CONTEXTS.set(result, {
    registry,
    revocations,
  });
  return result;
}

/**
 * Verify one live-session phase envelope against an opaque trust context.
 * Exact payload keys and the phase evidence type are supplied by the
 * live-session protocol module; this helper performs role, registration,
 * revocation, timestamp, and Ed25519 checks only.
 */
export function verifyOriginalRuntimeLiveSessionRoleEnvelopeDiagnostic({
  trustState,
  envelope,
  payloadKeys,
  evidenceType,
  role,
  eventField,
  label,
} = {}) {
  const context = trustState && typeof trustState === "object"
    ? LIVE_SESSION_TRUST_CONTEXTS.get(trustState)
    : null;
  if (!context) {
    throw new Error("live-session role verification requires an opaque verified trust-state context");
  }
  if (!ALLOWED_ROLES.has(role)) throw new Error("live-session role is unsupported");
  if (!Array.isArray(payloadKeys) || !payloadKeys.length) {
    throw new Error("live-session payloadKeys must be a non-empty array");
  }
  assertString(evidenceType, "live-session evidenceType");
  assertString(eventField, "live-session eventField");
  assertString(label, "live-session label");
  const verified = verifyRegisteredEnvelope({
    envelope,
    payloadKeys,
    evidenceType,
    role,
    eventField,
    label,
    registry: context.registry,
    revocations: context.revocations,
  });
  if (verified.eventTimeMs < context.registry.captureCheckpoint.issuedAtMs) {
    throw new Error(`${label} predates the signed capture-time registry checkpoint`);
  }
  return deepFreeze({
    payload: verified.payload,
    sha256: verified.sha256,
    eventTimeMs: verified.eventTimeMs,
    signer: publicSigner(verified.signer),
  });
}

function anchorNotConfiguredError() {
  const error = new Error(`${ANCHOR_NOT_CONFIGURED_CODE}: no module-fixed out-of-band owner production anchor is configured`);
  error.code = ANCHOR_NOT_CONFIGURED_CODE;
  return error;
}

/**
 * Production entry point. Caller-provided roots are intentionally ignored as
 * authority. This repository has no fixed owner anchor, so it fails closed.
 */
export function verifyOriginalRuntimePromotionTrust(options = {}) {
  if (!PRODUCTION_TRUST_ANCHOR_CONFIGURED || !PRODUCTION_TRUST_ANCHOR) throw anchorNotConfiguredError();
  const checked = verifyTrustBundleDiagnostic({...options, trustRoot: PRODUCTION_TRUST_ANCHOR});
  return deepFreeze({
    ...checked,
    diagnosticOnly: false,
    trustVerified: true,
    authoritative: true,
    productionAnchorConfigured: true,
  });
}

function isContained(root, candidate) {
  const relative = path.relative(root, candidate);
  return relative === "" || (!path.isAbsolute(relative) && relative !== ".." && !relative.startsWith(`..${path.sep}`));
}

function deepFreeze(value, seen = new Set()) {
  if (!value || typeof value !== "object" || seen.has(value)) return value;
  seen.add(value);
  for (const item of Array.isArray(value) ? value : Object.values(value)) deepFreeze(item, seen);
  return Object.freeze(value);
}

async function assertNoSymlinkPath(ownerRoot, candidate) {
  const rootInfo = await lstat(ownerRoot).catch((error) => {
    throw new Error(`owner-controlled root is unavailable: ${error.message}`);
  });
  if (!rootInfo.isDirectory() || rootInfo.isSymbolicLink()) throw new Error("owner-controlled root must be a real non-symlink directory");
  const relative = path.relative(ownerRoot, candidate);
  if (!relative || path.isAbsolute(relative) || relative === ".." || relative.startsWith(`..${path.sep}`)) {
    throw new Error("trust-root config path must be contained by the owner-controlled root");
  }
  let cursor = ownerRoot;
  for (const segment of relative.split(path.sep)) {
    cursor = path.join(cursor, segment);
    const info = await lstat(cursor).catch((error) => {
      throw new Error(`trust-root config path is unavailable: ${error.message}`);
    });
    if (info.isSymbolicLink()) throw new Error("trust-root config path must not contain symbolic links");
  }
  const fileInfo = await lstat(candidate);
  if (!fileInfo.isFile() || fileInfo.isSymbolicLink()) throw new Error("trust-root config must be a regular non-symlink file");
  if (fileInfo.nlink !== 1) throw new Error("trust-root config must have exactly one hard link");
}

function metadataSnapshot(metadata) {
  return Object.freeze({
    dev: metadata.dev,
    ino: metadata.ino,
    nlink: metadata.nlink,
    size: metadata.size,
    mtimeMs: metadata.mtimeMs,
    ctimeMs: metadata.ctimeMs,
  });
}

function assertStableMetadata(before, after, label) {
  if (canonicalJson(before) !== canonicalJson(after)) throw new Error(`${label} metadata changed during trust-root loading`);
}

/**
 * Read-only trust-anchor loader.  The project may point at the trust root, but
 * the trust root is required to live in a separate owner-controlled tree.
 */
export async function loadExternalTrustRootConfig({
  projectRoot,
  ownerControlledRoot,
  trustRootConfigPath,
  now = Date.now(),
} = {}) {
  for (const [value, label] of [
    [projectRoot, "projectRoot"],
    [ownerControlledRoot, "ownerControlledRoot"],
    [trustRootConfigPath, "trustRootConfigPath"],
  ]) assertString(value, label);
  const declaredProjectRoot = path.resolve(projectRoot);
  const declaredOwnerRoot = path.resolve(ownerControlledRoot);
  const declaredConfig = path.isAbsolute(trustRootConfigPath)
    ? path.resolve(trustRootConfigPath)
    : path.resolve(declaredOwnerRoot, trustRootConfigPath);
  const declaredParent = path.dirname(declaredConfig);
  const [ownerBeforeInfo, parentBeforeInfo, fileBeforeInfo] = await Promise.all([
    lstat(declaredOwnerRoot),
    lstat(declaredParent),
    lstat(declaredConfig),
  ]);
  if (!ownerBeforeInfo.isDirectory() || ownerBeforeInfo.isSymbolicLink()) throw new Error("owner-controlled root must be a real directory");
  if (!parentBeforeInfo.isDirectory() || parentBeforeInfo.isSymbolicLink()) throw new Error("trust-root config parent must be a real directory");
  if (!fileBeforeInfo.isFile() || fileBeforeInfo.isSymbolicLink() || fileBeforeInfo.nlink !== 1) {
    throw new Error("trust-root config must be a regular non-symlink file with exactly one hard link");
  }
  const ownerBefore = metadataSnapshot(ownerBeforeInfo);
  const parentBefore = metadataSnapshot(parentBeforeInfo);
  const fileBefore = metadataSnapshot(fileBeforeInfo);
  const [realProjectRoot, realOwnerRoot, realParentBefore, realConfigBefore] = await Promise.all([
    realpath(declaredProjectRoot).catch((error) => { throw new Error(`project root is unavailable: ${error.message}`); }),
    realpath(declaredOwnerRoot).catch((error) => { throw new Error(`owner-controlled root is unavailable: ${error.message}`); }),
    realpath(declaredParent),
    realpath(declaredConfig),
  ]);
  if (declaredOwnerRoot !== realOwnerRoot) throw new Error("owner-controlled root path must not contain symbolic links");
  if (isContained(realProjectRoot, realOwnerRoot) || isContained(realOwnerRoot, realProjectRoot)) {
    throw new Error("owner-controlled root and project root must be disjoint trees");
  }
  if (!isContained(declaredOwnerRoot, declaredConfig)) throw new Error("trust-root config path escapes the owner-controlled root");
  await assertNoSymlinkPath(declaredOwnerRoot, declaredConfig);
  const realConfig = realConfigBefore;
  if (realConfig !== declaredConfig || !isContained(realOwnerRoot, realConfig)) {
    throw new Error("trust-root config path must resolve without symlinks inside the owner-controlled root");
  }
  if (isContained(realProjectRoot, realConfig)) throw new Error("trust-root config must be outside the project root");
  let handle;
  let bytes;
  let descriptorBefore;
  let descriptorAfter;
  try {
    handle = await open(realConfig, fsConstants.O_RDONLY | fsConstants.O_NOFOLLOW);
    const metadata = await handle.stat();
    if (!metadata.isFile() || metadata.nlink !== 1) throw new Error("trust-root config must be a regular file with exactly one hard link");
    descriptorBefore = metadataSnapshot(metadata);
    assertStableMetadata(fileBefore, descriptorBefore, "trust-root config path/descriptor");
    bytes = await handle.readFile();
    descriptorAfter = metadataSnapshot(await handle.stat());
    assertStableMetadata(descriptorBefore, descriptorAfter, "trust-root config descriptor");
  } finally {
    await handle?.close();
  }
  const [ownerAfterInfo, parentAfterInfo, fileAfterInfo, realOwnerAfter, realParentAfter, realConfigAfter] = await Promise.all([
    lstat(declaredOwnerRoot),
    lstat(declaredParent),
    lstat(declaredConfig),
    realpath(declaredOwnerRoot),
    realpath(declaredParent),
    realpath(declaredConfig),
  ]);
  const ownerAfter = metadataSnapshot(ownerAfterInfo);
  const parentAfter = metadataSnapshot(parentAfterInfo);
  const fileAfter = metadataSnapshot(fileAfterInfo);
  assertStableMetadata(ownerBefore, ownerAfter, "owner-controlled root");
  assertStableMetadata(parentBefore, parentAfter, "trust-root config parent");
  assertStableMetadata(fileBefore, fileAfter, "trust-root config file");
  if (realOwnerAfter !== realOwnerRoot || realParentAfter !== realParentBefore || realConfigAfter !== realConfigBefore) {
    throw new Error("trust-root root/parent/file realpaths changed during loading");
  }
  let text;
  try {
    text = new TextDecoder("utf-8", {fatal: true}).decode(bytes);
  } catch (error) {
    throw new Error(`trust-root config is not valid UTF-8: ${error.message}`);
  }
  let config;
  try {
    config = JSON.parse(text);
  } catch (error) {
    throw new Error(`trust-root config is not valid JSON: ${error.message}`);
  }
  const validated = validateTrustRootConfig(config, {now});
  const canonicalConfig = canonicalJson(config);
  const loadedAtMs = normalizeNow(now);
  const fileBinding = {
    root: ownerBefore,
    parent: parentBefore,
    file: fileBefore,
    realOwnerRoot,
    realParent: realParentBefore,
    realConfig,
  };
  const backingContext = deepFreeze({
    canonicalConfig,
    authoritySha256: validated.sha256,
    configSha256: validated.configSha256,
    fileSha256: sha256Bytes(bytes),
    fileBindingSha256: sha256Canonical(fileBinding),
    loadedAtMs,
  });
  const externalContext = Object.freeze({
    authoritative: false,
    diagnosticOnly: true,
    productionAnchor: false,
    sha256: validated.sha256,
    configSha256: validated.configSha256,
    path: declaredConfig,
    realpath: realConfig,
    ownerControlledRoot: realOwnerRoot,
    projectRoot: realProjectRoot,
    fileSha256: sha256Bytes(bytes),
    fileBindingSha256: backingContext.fileBindingSha256,
    loadedAt: new Date(loadedAtMs).toISOString(),
  });
  EXTERNAL_TRUST_CONTEXTS.set(externalContext, backingContext);
  return externalContext;
}
