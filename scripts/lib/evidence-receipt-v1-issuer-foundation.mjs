import {createHash} from "node:crypto";

/**
 * EvidenceReceiptV1 issuer foundation.
 *
 * This module is deliberately pre-signing and write-free. It validates an
 * exact canonical-JSON snapshot and can prepare a hash-only request for an
 * independent external verification/signing workflow. Its public parser
 * accepts primitive serialized data rather than caller-owned objects. It has
 * no key loader, signer, receipt builder, filesystem API, ledger writer,
 * strict-completion effect, or release publication effect.
 */

export const EVIDENCE_RECEIPT_V1_ISSUER_FOUNDATION_SCHEMA_VERSION = 1;
export const EVIDENCE_RECEIPT_V1_ISSUER_FOUNDATION_TYPE =
  "help-math-evidence-receipt-v1-issuer-foundation";
export const EVIDENCE_RECEIPT_V1_PRODUCTION_ISSUER_PRESENT = false;
export const EVIDENCE_RECEIPT_V1_ISSUER_WRITES_ENABLED = false;
export const EVIDENCE_RECEIPT_V1_EXTERNAL_SIGNER_TRANSPORT =
  "external-owner-controlled-signer";
export const EVIDENCE_RECEIPT_V1_PRODUCTION_TRUST_AUTHORIZATION_TYPE =
  "help-math-evidence-receipt-v1-production-trust-authorization";
export const EVIDENCE_RECEIPT_V1_PINNED_RELEASE_ID =
  "lesson-g05-l04-number-lines";
export const EVIDENCE_RECEIPT_V1_PINNED_RELEASE_MEMBER_COUNT = 55;
export const EVIDENCE_RECEIPT_V1_PINNED_RELEASE_DEFINITION_SHA256 =
  "f967045dd3c2faf5d5126d69c661ad2d26cd16bde0036c1185a31fd21cc67f7d";
export const EVIDENCE_RECEIPT_V1_MAX_REVOCATION_FRESHNESS_MS = 15 * 60 * 1000;

export const EVIDENCE_RECEIPT_V1_REQUIRED_VALIDATION_COMMAND_IDS = Object.freeze([
  "completion-ledger-check",
  "lesson-release-ledger-check",
  "production-promotion-bundle-check",
  "production-trust-authorization-check",
  "strict-release-validation",
]);

const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const COMMIT_SHA_PATTERN = /^(?:[a-f0-9]{40}|[a-f0-9]{64})$/;
const LOGICAL_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$/;
const PUBLIC_SUBJECT_ID_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/;
const MAX_CANONICAL_SNAPSHOT_CHARACTERS = 1_000_000;
const SNAPSHOT_KEYS = Object.freeze([
  "schemaVersion",
  "evidenceType",
  "releaseDefinition",
  "releaseLedger",
  "recordedBindings",
  "currentBindings",
  "recordedCommands",
  "currentCommands",
  "productionTrustAuthorization",
]);
const RELEASE_DEFINITION_KEYS = Object.freeze([
  "releaseId",
  "publicationMode",
  "expectedMemberCount",
  "members",
]);
const RELEASE_MEMBER_KEYS = Object.freeze([
  "ordinal",
  "animationId",
  "assetId",
]);
const RELEASE_LEDGER_KEYS = Object.freeze([
  "releaseId",
  "publicationMode",
  "expectedMemberCount",
  "strictCompleteCount",
  "expectedPublishedCount",
  "publishedCount",
  "gate",
  "members",
]);
const RELEASE_LEDGER_GATE_KEYS = Object.freeze([
  "kind",
  "requiredCount",
  "admittedCount",
  "open",
]);
const RELEASE_LEDGER_MEMBER_KEYS = Object.freeze([
  "ordinal",
  "animationId",
  "assetId",
  "strictComplete",
  "manifestSha256",
]);
const BINDING_KEYS = Object.freeze([
  "commitSha",
  "releaseDefinitionSha256",
  "sourceManifestSha256",
  "rendererRegistrySha256",
  "completionLedgerSha256",
  "releaseLedgerSha256",
  "runnerSha256",
  "toolchainSha256",
  "commandsSha256",
  "inputsSha256",
  "outputsSha256",
  "strictValidatorSha256",
  "reviewDecisionSha256",
  "ownerDecisionSha256",
  "promotionReleaseBundleSha256",
  "productionTrustAuthorizationSha256",
  "candidateEvidence",
]);
const CANDIDATE_BINDING_KEYS = Object.freeze(["logicalId", "sha256"]);
const COMMAND_KEYS = Object.freeze([
  "commandId",
  "argv",
  "claimStatus",
  "startedAt",
  "endedAt",
  "exitCode",
  "stdoutSha256",
  "stderrSha256",
]);
const TRUST_AUTHORIZATION_KEYS = Object.freeze([
  "evidenceType",
  "status",
  "releaseId",
  "commitSha",
  "promotionReleaseBundleSha256",
  "trustRootAuthoritySha256",
  "verificationRegistryHeadSha256",
  "revocationCheckpointSha256",
  "releaseAuthoritySubjectId",
  "releaseAuthorityKeyFingerprintSha256",
  "claimsAuthenticated",
  "claimsAuthorized",
  "claimsRevocationStateCurrent",
  "claimsProductionPromotionBundleVerified",
  "verifiedAt",
  "revocationValidUntil",
]);
const HANDOFF_CONTEXTS = new WeakMap();

function invariant(condition, message) {
  if (!condition) throw new Error(`EvidenceReceiptV1 issuer foundation: ${message}`);
}

function assertIssuerFusesClosed() {
  invariant(EVIDENCE_RECEIPT_V1_PRODUCTION_ISSUER_PRESENT === false, "production issuer presence fuse unexpectedly opened");
  invariant(EVIDENCE_RECEIPT_V1_ISSUER_WRITES_ENABLED === false, "issuer write fuse unexpectedly opened");
}

function isPlainObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function assertObject(value, label) {
  invariant(isPlainObject(value), `${label} must be a plain object`);
  return value;
}

function assertString(value, label) {
  invariant(typeof value === "string" && value.trim().length > 0, `${label} must be a non-empty string`);
  return value;
}

function assertLogicalId(value, label) {
  assertString(value, label);
  invariant(LOGICAL_ID_PATTERN.test(value), `${label} must be a portable logical identifier`);
  return value;
}

function assertSha256(value, label) {
  invariant(SHA256_PATTERN.test(value || ""), `${label} must be a lowercase SHA-256`);
  return value;
}

function assertCommitSha(value, label) {
  invariant(COMMIT_SHA_PATTERN.test(value || ""), `${label} must be a lowercase 40- or 64-character commit hash`);
  return value;
}

function assertPositiveInteger(value, label) {
  invariant(Number.isSafeInteger(value) && value > 0, `${label} must be a positive safe integer`);
  return value;
}

function deepFreeze(value, seen = new Set()) {
  if (!value || typeof value !== "object" || seen.has(value)) return value;
  seen.add(value);
  for (const child of Array.isArray(value) ? value : Object.values(value)) {
    if (typeof child !== "function") deepFreeze(child, seen);
  }
  return Object.freeze(value);
}

function compareText(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function canonicalJson(value, label = "canonical JSON value", seen = new Set()) {
  if (value === null || typeof value === "boolean" || typeof value === "string") {
    return JSON.stringify(value);
  }
  if (typeof value === "number") {
    invariant(Number.isFinite(value), `${label} contains a non-finite number`);
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    invariant(!seen.has(value), `${label} contains a cycle`);
    seen.add(value);
    try {
      const parts = [];
      for (let index = 0; index < value.length; index += 1) {
        invariant(index in value, `${label} contains a sparse array`);
        parts.push(canonicalJson(value[index], `${label}[${index}]`, seen));
      }
      return `[${parts.join(",")}]`;
    } finally {
      seen.delete(value);
    }
  }
  if (isPlainObject(value)) {
    invariant(!seen.has(value), `${label} contains a cycle`);
    seen.add(value);
    try {
      const parts = Object.keys(value).sort(compareText).map((key) => {
        const item = value[key];
        invariant(
          item !== undefined &&
            typeof item !== "function" &&
            typeof item !== "symbol" &&
            typeof item !== "bigint",
          `${label}.${key} is not representable in canonical JSON`,
        );
        return `${JSON.stringify(key)}:${canonicalJson(item, `${label}.${key}`, seen)}`;
      });
      return `{${parts.join(",")}}`;
    } finally {
      seen.delete(value);
    }
  }
  invariant(false, `${label} is not representable in canonical JSON`);
}

function sha256Text(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function sha256Canonical(value) {
  return sha256Text(canonicalJson(value));
}

function assertExactKeys(value, expectedKeys, label = "object") {
  const observed = Object.keys(assertObject(value, label)).sort(compareText);
  const expected = [...expectedKeys].sort(compareText);
  invariant(
    canonicalJson(observed) === canonicalJson(expected),
    `${label} fields must be exactly: ${expected.join(", ")}`,
  );
  return value;
}

function parseCanonicalSnapshot(serializedSnapshot) {
  invariant(
    typeof serializedSnapshot === "string",
    "snapshotCanonicalJson must be a primitive canonical JSON string",
  );
  invariant(
    serializedSnapshot.length > 0 && serializedSnapshot.length <= MAX_CANONICAL_SNAPSHOT_CHARACTERS,
    `snapshotCanonicalJson must contain 1 through ${MAX_CANONICAL_SNAPSHOT_CHARACTERS} characters`,
  );
  let parsed;
  try {
    parsed = JSON.parse(serializedSnapshot);
  } catch {
    invariant(false, "snapshotCanonicalJson must be valid JSON");
  }
  invariant(
    canonicalJson(parsed, "snapshotCanonicalJson") === serializedSnapshot,
    "snapshotCanonicalJson must use the exact canonical JSON encoding",
  );
  return parsed;
}

function expectedCommandArgv(commandId) {
  return [
    "node",
    `scripts/${commandId}.mjs`,
    `--release-id=${EVIDENCE_RECEIPT_V1_PINNED_RELEASE_ID}`,
  ];
}

function normalizeNow(now) {
  if (typeof now === "number") {
    invariant(Number.isSafeInteger(now) && now >= 0, "now must be a non-negative safe integer epoch millisecond value");
    return now;
  }
  invariant(typeof now === "string", "now must be a primitive canonical UTC ISO string or epoch millisecond integer");
  const value = Date.parse(now);
  invariant(
    Number.isFinite(value) && new Date(value).toISOString() === now,
    "now must be a canonical UTC ISO timestamp",
  );
  return value;
}

function parseCanonicalTimestamp(value, label, {nowMs, allowFuture = false} = {}) {
  assertString(value, label);
  const observed = Date.parse(value);
  invariant(
    Number.isFinite(observed) && new Date(observed).toISOString() === value,
    `${label} must be a canonical UTC ISO timestamp`,
  );
  invariant(allowFuture || !Number.isFinite(nowMs) || observed <= nowMs, `${label} must not be in the future`);
  return observed;
}

function assertPrivacySafeSubjectId(value, label) {
  assertString(value, label);
  invariant(
    PUBLIC_SUBJECT_ID_PATTERN.test(value),
    `${label} must be a lowercase opaque identifier without path, namespace, contact, or secret syntax`,
  );
  return value;
}

function assertNoPublicDataLeak(text, label) {
  const privatePathPattern = /(?:file:\/\/|(?:^|\s|=)~\/|\/(?:Users|Volumes|home|private|var\/folders)\/|[A-Za-z]:\\)/i;
  const emailPattern = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
  const secretPattern = /(?:-----BEGIN (?:OPENSSH )?PRIVATE KEY-----|bearer\s+[A-Za-z0-9._~+/=-]+|(?:password|passwd|api[_-]?key|access[_-]?key|secret|token|private[_-]?key)\s*[:=]\s*\S+)/i;
  invariant(!privatePathPattern.test(text), `${label} exposes a private filesystem path`);
  invariant(!emailPattern.test(text), `${label} exposes contact information`);
  invariant(!secretPattern.test(text), `${label} appears to expose key or secret material`);
}

function validateReleaseDefinition(value) {
  const label = "snapshot.releaseDefinition";
  assertExactKeys(assertObject(value, label), RELEASE_DEFINITION_KEYS, label);
  invariant(
    value.releaseId === EVIDENCE_RECEIPT_V1_PINNED_RELEASE_ID,
    `${label}.releaseId must equal the pinned G5 L4 release`,
  );
  invariant(value.publicationMode === "atomic", `${label}.publicationMode must be atomic`);
  const expectedMemberCount = assertPositiveInteger(value.expectedMemberCount, `${label}.expectedMemberCount`);
  invariant(
    expectedMemberCount === EVIDENCE_RECEIPT_V1_PINNED_RELEASE_MEMBER_COUNT,
    `${label}.expectedMemberCount must equal the pinned 55-member contract`,
  );
  invariant(Array.isArray(value.members), `${label}.members must be an array`);
  invariant(value.members.length === expectedMemberCount, `${label}.members must contain exactly ${expectedMemberCount} members`);
  const animationIds = [];
  value.members.forEach((member, index) => {
    const memberLabel = `${label}.members[${index}]`;
    assertExactKeys(assertObject(member, memberLabel), RELEASE_MEMBER_KEYS, memberLabel);
    invariant(member.ordinal === index + 1, `${memberLabel}.ordinal must preserve exact one-indexed release order`);
    animationIds.push(assertLogicalId(member.animationId, `${memberLabel}.animationId`));
    assertLogicalId(member.assetId, `${memberLabel}.assetId`);
  });
  invariant(new Set(animationIds).size === animationIds.length, `${label}.members animationId values must be unique`);
  invariant(
    sha256Canonical(value) === EVIDENCE_RECEIPT_V1_PINNED_RELEASE_DEFINITION_SHA256,
    `${label} differs from the pinned G5 L4 55-member release contract`,
  );
  return value;
}

function validateReleaseLedger(value, releaseDefinition) {
  const label = "snapshot.releaseLedger";
  assertExactKeys(assertObject(value, label), RELEASE_LEDGER_KEYS, label);
  invariant(value.releaseId === releaseDefinition.releaseId, `${label}.releaseId differs from the exact release definition`);
  invariant(value.publicationMode === "atomic", `${label}.publicationMode must be atomic`);
  invariant(value.expectedMemberCount === releaseDefinition.expectedMemberCount, `${label}.expectedMemberCount differs from the exact release definition`);
  invariant(value.strictCompleteCount === value.expectedMemberCount, `${label} requires every declared member to be strict complete`);
  invariant(value.expectedPublishedCount === 1, `${label}.expectedPublishedCount must be 1`);
  invariant(value.publishedCount === 1, `${label}.publishedCount must be 1 before receipt issuance`);

  assertExactKeys(assertObject(value.gate, `${label}.gate`), RELEASE_LEDGER_GATE_KEYS, `${label}.gate`);
  invariant(value.gate.kind === "atomic-all-members-strict", `${label}.gate.kind is unsupported`);
  invariant(value.gate.requiredCount === value.expectedMemberCount, `${label}.gate.requiredCount differs from expectedMemberCount`);
  invariant(value.gate.admittedCount === value.expectedMemberCount, `${label}.gate.admittedCount is incomplete`);
  invariant(value.gate.open === true, `${label}.gate must be technically open`);

  invariant(Array.isArray(value.members), `${label}.members must be an array`);
  invariant(value.members.length === value.expectedMemberCount, `${label}.members must contain exactly ${value.expectedMemberCount} members`);
  value.members.forEach((member, index) => {
    const memberLabel = `${label}.members[${index}]`;
    const declared = releaseDefinition.members[index];
    assertExactKeys(assertObject(member, memberLabel), RELEASE_LEDGER_MEMBER_KEYS, memberLabel);
    invariant(member.ordinal === declared.ordinal, `${memberLabel}.ordinal differs from the exact release definition`);
    invariant(member.animationId === declared.animationId, `${memberLabel}.animationId differs from the exact release definition`);
    invariant(member.assetId === declared.assetId, `${memberLabel}.assetId differs from the exact release definition`);
    invariant(member.strictComplete === true, `${memberLabel} is not strict complete`);
    assertSha256(member.manifestSha256, `${memberLabel}.manifestSha256`);
  });
  return value;
}

function validateCandidateEvidence(value, label, releaseLedger) {
  invariant(
    Array.isArray(value) && value.length === releaseLedger.members.length,
    `${label} must contain exactly one binding for each release member`,
  );
  let previousLogicalId = null;
  value.forEach((binding, index) => {
    const bindingLabel = `${label}[${index}]`;
    assertExactKeys(assertObject(binding, bindingLabel), CANDIDATE_BINDING_KEYS, bindingLabel);
    const logicalId = assertLogicalId(binding.logicalId, `${bindingLabel}.logicalId`);
    assertSha256(binding.sha256, `${bindingLabel}.sha256`);
    invariant(previousLogicalId === null || compareText(previousLogicalId, logicalId) < 0, `${label} must be uniquely sorted by logicalId`);
    previousLogicalId = logicalId;
  });
  const expected = releaseLedger.members
    .map((member) => ({logicalId: member.animationId, sha256: member.manifestSha256}))
    .sort((left, right) => compareText(left.logicalId, right.logicalId));
  invariant(
    canonicalJson(value) === canonicalJson(expected),
    `${label} must bind every exact release member to its release-ledger manifestSha256`,
  );
}

function validateBindings(value, label, releaseLedger) {
  assertExactKeys(assertObject(value, label), BINDING_KEYS, label);
  assertCommitSha(value.commitSha, `${label}.commitSha`);
  for (const key of BINDING_KEYS.filter((key) => !["commitSha", "candidateEvidence"].includes(key))) {
    assertSha256(value[key], `${label}.${key}`);
  }
  validateCandidateEvidence(value.candidateEvidence, `${label}.candidateEvidence`, releaseLedger);
  return value;
}

function validateCommands(value, label, nowMs) {
  invariant(
    Array.isArray(value) && value.length === EVIDENCE_RECEIPT_V1_REQUIRED_VALIDATION_COMMAND_IDS.length,
    `${label} must contain exactly the required command claims`,
  );
  let previousCommandId = null;
  value.forEach((command, index) => {
    const commandLabel = `${label}[${index}]`;
    assertExactKeys(assertObject(command, commandLabel), COMMAND_KEYS, commandLabel);
    const commandId = assertLogicalId(command.commandId, `${commandLabel}.commandId`);
    invariant(previousCommandId === null || compareText(previousCommandId, commandId) < 0, `${label} must be uniquely sorted by commandId`);
    previousCommandId = commandId;
    invariant(Array.isArray(command.argv) && command.argv.length > 0, `${commandLabel}.argv must be a non-empty array`);
    command.argv.forEach((argument, argumentIndex) => {
      assertString(argument, `${commandLabel}.argv[${argumentIndex}]`);
      invariant(argument.length <= 512, `${commandLabel}.argv[${argumentIndex}] is too long`);
      assertNoPublicDataLeak(argument, `${commandLabel}.argv[${argumentIndex}]`);
    });
    invariant(
      canonicalJson(command.argv) === canonicalJson(expectedCommandArgv(commandId)),
      `${commandLabel}.argv differs from the pinned structural command contract`,
    );
    invariant(
      command.claimStatus === "caller-supplied-unverified-execution-claim",
      `${commandLabel}.claimStatus must remain caller-supplied and unverified`,
    );
    const startedAtMs = parseCanonicalTimestamp(command.startedAt, `${commandLabel}.startedAt`, {nowMs});
    const endedAtMs = parseCanonicalTimestamp(command.endedAt, `${commandLabel}.endedAt`, {nowMs});
    invariant(endedAtMs >= startedAtMs, `${commandLabel}.endedAt precedes startedAt`);
    invariant(command.exitCode === 0, `${commandLabel}.exitCode must be zero`);
    assertSha256(command.stdoutSha256, `${commandLabel}.stdoutSha256`);
    assertSha256(command.stderrSha256, `${commandLabel}.stderrSha256`);
  });
  const observed = new Set(value.map(({commandId}) => commandId));
  for (const requiredCommandId of EVIDENCE_RECEIPT_V1_REQUIRED_VALIDATION_COMMAND_IDS) {
    invariant(observed.has(requiredCommandId), `${label} is missing required command ${requiredCommandId}`);
  }
  return value;
}

function validateTrustAuthorizationClaims(value, {releaseDefinition, bindings, nowMs}) {
  const label = "snapshot.productionTrustAuthorization";
  assertExactKeys(assertObject(value, label), TRUST_AUTHORIZATION_KEYS, label);
  invariant(value.evidenceType === EVIDENCE_RECEIPT_V1_PRODUCTION_TRUST_AUTHORIZATION_TYPE, `${label}.evidenceType is unsupported`);
  invariant(
    value.status === "caller-supplied-unverified-trust-claims",
    `${label}.status must remain an unverified caller-supplied claim`,
  );
  invariant(value.releaseId === releaseDefinition.releaseId, `${label}.releaseId differs from the exact release`);
  invariant(value.commitSha === bindings.commitSha, `${label}.commitSha differs from the current build`);
  invariant(value.promotionReleaseBundleSha256 === bindings.promotionReleaseBundleSha256, `${label}.promotionReleaseBundleSha256 differs from the current binding`);
  for (const key of [
    "trustRootAuthoritySha256",
    "verificationRegistryHeadSha256",
    "revocationCheckpointSha256",
    "releaseAuthorityKeyFingerprintSha256",
  ]) assertSha256(value[key], `${label}.${key}`);
  assertPrivacySafeSubjectId(value.releaseAuthoritySubjectId, `${label}.releaseAuthoritySubjectId`);
  invariant(value.claimsAuthenticated === true, `${label}.claimsAuthenticated must be true`);
  invariant(value.claimsAuthorized === true, `${label}.claimsAuthorized must be true`);
  invariant(value.claimsRevocationStateCurrent === true, `${label}.claimsRevocationStateCurrent must be true`);
  invariant(
    value.claimsProductionPromotionBundleVerified === true,
    `${label}.claimsProductionPromotionBundleVerified must be true`,
  );
  const verifiedAtMs = parseCanonicalTimestamp(value.verifiedAt, `${label}.verifiedAt`, {nowMs});
  const revocationValidUntilMs = parseCanonicalTimestamp(
    value.revocationValidUntil,
    `${label}.revocationValidUntil`,
    {nowMs, allowFuture: true},
  );
  invariant(revocationValidUntilMs > nowMs, `${label} revocation state is stale`);
  invariant(revocationValidUntilMs > verifiedAtMs, `${label}.revocationValidUntil must follow verifiedAt`);
  invariant(
    revocationValidUntilMs - verifiedAtMs <= EVIDENCE_RECEIPT_V1_MAX_REVOCATION_FRESHNESS_MS,
    `${label} revocation freshness window exceeds the fixed maximum`,
  );
  invariant(
    nowMs - verifiedAtMs <= EVIDENCE_RECEIPT_V1_MAX_REVOCATION_FRESHNESS_MS,
    `${label}.verifiedAt is outside the fixed freshness window`,
  );
  return value;
}

function validateSnapshot(snapshot, {nowMs}) {
  assertExactKeys(assertObject(snapshot, "snapshot"), SNAPSHOT_KEYS, "snapshot");
  invariant(snapshot.schemaVersion === EVIDENCE_RECEIPT_V1_ISSUER_FOUNDATION_SCHEMA_VERSION, "snapshot.schemaVersion is unsupported");
  invariant(snapshot.evidenceType === EVIDENCE_RECEIPT_V1_ISSUER_FOUNDATION_TYPE, "snapshot.evidenceType is unsupported");
  const releaseDefinition = validateReleaseDefinition(snapshot.releaseDefinition);
  const releaseLedger = validateReleaseLedger(snapshot.releaseLedger, releaseDefinition);
  const releaseDefinitionSha256 = sha256Canonical(releaseDefinition);
  const releaseLedgerSha256 = sha256Canonical(releaseLedger);
  const recordedBindings = validateBindings(snapshot.recordedBindings, "snapshot.recordedBindings", releaseLedger);
  const currentBindings = validateBindings(snapshot.currentBindings, "snapshot.currentBindings", releaseLedger);
  invariant(canonicalJson(recordedBindings) === canonicalJson(currentBindings), "recorded/current binding drift detected");
  invariant(
    recordedBindings.releaseDefinitionSha256 === releaseDefinitionSha256 &&
      currentBindings.releaseDefinitionSha256 === releaseDefinitionSha256,
    "release definition canonical hash binding is stale",
  );
  invariant(
    recordedBindings.releaseLedgerSha256 === releaseLedgerSha256 &&
      currentBindings.releaseLedgerSha256 === releaseLedgerSha256,
    "release ledger canonical hash binding is stale",
  );
  const recordedCommands = validateCommands(snapshot.recordedCommands, "snapshot.recordedCommands", nowMs);
  const currentCommands = validateCommands(snapshot.currentCommands, "snapshot.currentCommands", nowMs);
  invariant(canonicalJson(recordedCommands) === canonicalJson(currentCommands), "recorded/current command drift detected");
  invariant(recordedBindings.commandsSha256 === sha256Canonical(recordedCommands), "recorded command hash binding is stale");
  invariant(currentBindings.commandsSha256 === sha256Canonical(currentCommands), "current command hash binding is stale");
  const trustAuthorization = validateTrustAuthorizationClaims(snapshot.productionTrustAuthorization, {
    releaseDefinition,
    bindings: currentBindings,
    nowMs,
  });
  const trustAuthorizationSha256 = sha256Canonical(trustAuthorization);
  invariant(
    recordedBindings.productionTrustAuthorizationSha256 === trustAuthorizationSha256,
    "recorded production trust authorization hash binding is stale",
  );
  invariant(
    currentBindings.productionTrustAuthorizationSha256 === trustAuthorizationSha256,
    "current production trust authorization hash binding is stale",
  );
  return {
    releaseDefinition,
    releaseDefinitionSha256,
    releaseLedger,
    releaseLedgerSha256,
    currentBindings,
    currentCommands,
    trustAuthorization,
  };
}

/**
 * Validate the shape and internal hash relationships of a caller-supplied
 * canonical JSON EvidenceReceiptV1 issuance snapshot. The serialized boundary
 * rejects caller-owned objects, accessors, thenables, Proxies, Dates, and
 * callables before any property access. This foundation cannot authenticate
 * the caller, verify the claimed command executions, validate the external
 * trust root, or establish issuance authority.
 */
export function evaluateEvidenceReceiptV1IssuancePreconditions(snapshotCanonicalJson, now) {
  assertIssuerFusesClosed();
  invariant(arguments.length === 2, "evaluation requires exactly snapshotCanonicalJson and now primitives");
  const nowMs = normalizeNow(now);
  const stableSnapshot = parseCanonicalSnapshot(snapshotCanonicalJson);
  const checked = validateSnapshot(stableSnapshot, {nowMs});
  const preconditionSnapshotSha256 = sha256Text(snapshotCanonicalJson);
  return deepFreeze({
    schemaVersion: EVIDENCE_RECEIPT_V1_ISSUER_FOUNDATION_SCHEMA_VERSION,
    artifactType: "evidence-receipt-v1-issuance-precondition-evaluation",
    status: "caller-supplied-structural-preflight-passed-external-verification-required",
    releaseId: checked.releaseDefinition.releaseId,
    expectedMemberCount: checked.releaseDefinition.expectedMemberCount,
    strictCompleteCount: checked.releaseLedger.strictCompleteCount,
    publishedCount: checked.releaseLedger.publishedCount,
    commitSha: checked.currentBindings.commitSha,
    releaseDefinitionSha256: checked.releaseDefinitionSha256,
    releaseLedgerSha256: checked.releaseLedgerSha256,
    promotionReleaseBundleSha256: checked.currentBindings.promotionReleaseBundleSha256,
    commandsSha256: checked.currentBindings.commandsSha256,
    callerSuppliedTrustClaimsSha256: sha256Canonical(checked.trustAuthorization),
    preconditionSnapshotSha256,
    checkedAt: new Date(nowMs).toISOString(),
    callerSuppliedStructuralPreflightOnly: true,
    callerSuppliedTrustClaimsOnly: true,
    commandClaimsStatus: "caller-supplied-unverified",
    trustClaimsStatus: "caller-supplied-unverified",
    authoritativeCommandExecutionEstablished: false,
    externalCommandEvidenceVerificationRequired: true,
    authorityVerified: false,
    externalCryptographicVerificationRequired: true,
    externalSignerWorkflowRequired: true,
    authoritative: false,
    productionKeyLoaded: false,
    receiptPayloadCreated: false,
    signatureCreated: false,
    receiptCreated: false,
    strictCompletionsGranted: 0,
    releasePublicationChanged: false,
    strictAcceptanceEffect: "none",
  });
}

/**
 * Prepare a hash-only, deeply frozen request descriptor for an independent
 * repository-external workflow. Both inputs must be primitives. This function
 * accepts no callback/capability, receives no acknowledgement, and never asks
 * for or receives signature/key/receipt material.
 */
export function prepareEvidenceReceiptV1ExternalSignerHandoff(snapshotCanonicalJson, now) {
  assertIssuerFusesClosed();
  invariant(arguments.length === 2, "handoff requires exactly snapshotCanonicalJson and now primitives");
  const nowMs = normalizeNow(now);
  const stableSnapshot = parseCanonicalSnapshot(snapshotCanonicalJson);
  const evaluation = evaluateEvidenceReceiptV1IssuancePreconditions(snapshotCanonicalJson, nowMs);
  const trust = stableSnapshot.productionTrustAuthorization;
  const request = deepFreeze({
    schemaVersion: EVIDENCE_RECEIPT_V1_ISSUER_FOUNDATION_SCHEMA_VERSION,
    requestType: "evidence-receipt-v1-external-independent-verification-handoff-request",
    releaseId: evaluation.releaseId,
    commitSha: evaluation.commitSha,
    expectedMemberCount: evaluation.expectedMemberCount,
    strictCompleteCount: evaluation.strictCompleteCount,
    publishedCount: evaluation.publishedCount,
    releaseDefinitionSha256: evaluation.releaseDefinitionSha256,
    releaseLedgerSha256: evaluation.releaseLedgerSha256,
    promotionReleaseBundleSha256: evaluation.promotionReleaseBundleSha256,
    callerSuppliedTrustClaimsSha256: evaluation.callerSuppliedTrustClaimsSha256,
    preconditionSnapshotSha256: evaluation.preconditionSnapshotSha256,
    releaseAuthoritySubjectKind: "opaque-release-authority-subject-sha256",
    releaseAuthoritySubjectIdSha256: sha256Text(trust.releaseAuthoritySubjectId),
    releaseAuthorityKeyFingerprintSha256: trust.releaseAuthorityKeyFingerprintSha256,
    trustRootAuthoritySha256: trust.trustRootAuthoritySha256,
    verificationRegistryHeadSha256: trust.verificationRegistryHeadSha256,
    revocationCheckpointSha256: trust.revocationCheckpointSha256,
    callerSuppliedStructuralPreflightOnly: true,
    commandClaimsStatus: "caller-supplied-unverified",
    trustClaimsStatus: "caller-supplied-unverified",
    authorityVerified: false,
    externalCryptographicVerificationRequired: true,
    requestedOperation: "external-independent-cryptographic-verification-and-signing-outside-repository",
  });
  const handoff = deepFreeze({
    schemaVersion: EVIDENCE_RECEIPT_V1_ISSUER_FOUNDATION_SCHEMA_VERSION,
    artifactType: "evidence-receipt-v1-external-signer-handoff-descriptor",
    status: "prepared-caller-supplied-structural-preflight-only",
    releaseId: evaluation.releaseId,
    expectedMemberCount: evaluation.expectedMemberCount,
    strictCompleteCount: evaluation.strictCompleteCount,
    publishedCount: evaluation.publishedCount,
    commitSha: evaluation.commitSha,
    preconditionSnapshotSha256: evaluation.preconditionSnapshotSha256,
    preconditionEvaluationSha256: sha256Canonical(evaluation),
    requestSha256: sha256Canonical(request),
    request,
    externalSignerTransport: EVIDENCE_RECEIPT_V1_EXTERNAL_SIGNER_TRANSPORT,
    callerCallbackInvoked: false,
    callerCapabilityInvoked: false,
    externalAcknowledgementAccepted: false,
    externalCryptographicVerificationRequired: true,
    authorityVerified: false,
    productionAuthorityEstablishedByFoundation: false,
    productionKeyLoaded: false,
    receiptPayloadCreated: false,
    signatureCreated: false,
    receiptCreated: false,
    strictCompletionsGranted: 0,
    releasePublicationChanged: false,
    strictAcceptanceEffect: "none",
  });
  HANDOFF_CONTEXTS.set(handoff, {
    canonicalHandoff: canonicalJson(handoff),
    handoffSha256: sha256Canonical(handoff),
  });
  return handoff;
}

/**
 * Confirm that a descriptor is the exact frozen object created in this process.
 * Serialized or structured-cloned copies intentionally lose the WeakMap brand.
 */
export function inspectEvidenceReceiptV1ExternalSignerHandoff(handoff) {
  const context = handoff && typeof handoff === "object" ? HANDOFF_CONTEXTS.get(handoff) : null;
  invariant(context, "handoff descriptor is cloned, reconstructed, or was not created by this foundation");
  invariant(Object.isFrozen(handoff), "handoff descriptor is not frozen");
  invariant(canonicalJson(handoff) === context.canonicalHandoff, "handoff descriptor changed after preparation");
  invariant(sha256Canonical(handoff) === context.handoffSha256, "handoff descriptor hash changed after preparation");
  return deepFreeze({
    validFoundationHandoff: true,
    handoffSha256: context.handoffSha256,
    releaseId: handoff.releaseId,
    callerSuppliedStructuralPreflightOnly: true,
    externalCryptographicVerificationRequired: true,
    authorityVerified: false,
    callerCallbackInvoked: false,
    callerCapabilityInvoked: false,
    authoritative: false,
    receiptCreated: false,
    strictAcceptanceEffect: "none",
  });
}

/** Read-only, zero-argument foundation summary for deterministic readiness. */
export function inspectEvidenceReceiptV1IssuerFoundation() {
  assertIssuerFusesClosed();
  return deepFreeze({
    schemaVersion: EVIDENCE_RECEIPT_V1_ISSUER_FOUNDATION_SCHEMA_VERSION,
    moduleType: EVIDENCE_RECEIPT_V1_ISSUER_FOUNDATION_TYPE,
    status: "foundation-only-production-disabled",
    capabilities: {
      preconditionEvaluatorPresent: true,
      externalSignerHandoffDescriptorPresent: true,
      callerCallbackInvocationPresent: false,
      canonicalJsonPrimitiveBoundaryPresent: true,
      callerOwnedObjectInputAccepted: false,
      rawAuthoritySubjectIdExported: false,
    },
    productionIssuerPresent: false,
    writesEnabled: false,
    keyLoaderPresent: false,
    signatureCreationPresent: false,
    receiptCreationPresent: false,
    filesystemWriterPresent: false,
    callerSuppliedStructuralPreflightOnly: true,
    authorityVerified: false,
    externalCryptographicVerificationRequired: true,
    strictCompletionsGranted: 0,
    releasePublicationChanged: false,
    strictAcceptanceEffect: "none",
  });
}
