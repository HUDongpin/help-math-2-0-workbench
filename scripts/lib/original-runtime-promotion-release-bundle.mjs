import {createHash} from "node:crypto";
import path from "node:path";

import {
  PROMOTION_WRITES_ENABLED,
  SIGNATURE_ALGORITHM,
  TRUST_ROLES,
  assertExactKeys,
  canonicalJson,
  ed25519PublicKeyFingerprint,
  parseCanonicalTimestamp,
  sha256Canonical,
  signedEnvelopeSha256,
  validateArtifactBindings,
  validateCaptureBinding,
  validatePlannedOutputs,
  verifyEd25519DetachedSignature,
  verifyOriginalRuntimePromotionTrustDiagnostic,
} from "./original-runtime-promotion-trust.mjs";
import {
  ORIGINAL_RUNTIME_NATURAL_PROMOTION_ENABLED,
  validateNaturalEvidenceDescriptor,
  verifyOriginalRuntimeNaturalCandidateDag,
} from "./original-runtime-natural-causality.mjs";
import {
  ORIGINAL_RUNTIME_PROMOTION_TRANSACTION_WRITES_ENABLED,
  inspectOriginalRuntimePromotionTransaction,
} from "./original-runtime-promotion-transaction.mjs";

/**
 * This is a read-only composition boundary. It deliberately has no writer,
 * adopter, nonce-reservation, recovery, or canonical-output API.
 */
export const ORIGINAL_RUNTIME_RELEASE_BUNDLE_WRITES_ENABLED = false;
export const ORIGINAL_RUNTIME_RELEASE_BUNDLE_PRODUCTION_ENABLED = false;
export const ORIGINAL_RUNTIME_RELEASE_BUNDLE_SCHEMA_VERSION = 1;
export const ORIGINAL_RUNTIME_RELEASE_BUNDLE_EVIDENCE_TYPE =
  "original-runtime-promotion-read-only-release-bundle";
export const ORIGINAL_RUNTIME_RELEASE_BUNDLE_STATUS =
  "diagnostic-only-write-disabled";
export const ORIGINAL_RUNTIME_OWNER_LEDGER_CHECKPOINT_EVIDENCE_TYPE =
  "original-runtime-promotion-owner-ledger-checkpoint";
export const ORIGINAL_RUNTIME_LEDGER_HASH_ALGORITHM =
  "sha256-domain-separated-merkle-v1";
export const ORIGINAL_RUNTIME_TRANSACTION_SEMANTICS =
  "plan-v3-coverage-cas-no-replace-outputs-segmented-journal";

const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const NONCE_PATTERN = /^[A-Za-z0-9._~+/=-]{22,256}$/;
const RELEASE_BUNDLE_KEYS = Object.freeze(["payload", "signature"]);
const SIGNATURE_KEYS = Object.freeze([
  "algorithm",
  "subjectId",
  "keyFingerprintSha256",
  "signatureBase64",
]);
const RELEASE_BUNDLE_PAYLOAD_KEYS = Object.freeze([
  "schemaVersion",
  "evidenceType",
  "status",
  "animationId",
  "requirementId",
  "releaseId",
  "capture",
  "artifactBindings",
  "typedDag",
  "execution",
  "trustHistory",
  "roleBindings",
  "ledgerInclusion",
  "transaction",
  "nonce",
  "expectedOutputs",
  "preLedgerCommitmentSha256",
  "bundledAt",
  "productionPromotionEnabled",
]);
const TYPED_DAG_KEYS = Object.freeze([
  "rootDescriptor",
  "rootDescriptorSha256",
  "rootContentSha256",
  "fullDagSha256",
  "nodeCount",
  "edgeCount",
  "completeArchiveClosure",
  "immutableStagingRequired",
  "verificationProfile",
]);
const EXECUTION_KEYS = Object.freeze(["operator", "runtime", "toolchain"]);
const OPERATOR_KEYS = Object.freeze([
  "subjectId",
  "keyFingerprintSha256",
  "attestationSha256",
]);
const RUNTIME_KEYS = Object.freeze([
  "runtimeId",
  "name",
  "version",
  "executableSha256",
  "identityReceiptSha256",
]);
const TOOLCHAIN_KEYS = Object.freeze([
  "receiptSha256",
  "runtimeTreeSha256",
  "launcherSha256",
  "sandboxProfileSha256",
]);
const TRUST_HISTORY_KEYS = Object.freeze([
  "trustRootAuthoritySha256",
  "trustRootConfigSha256",
  "trustRootFileSha256",
  "trustRootFileBindingSha256",
  "registryCheckpointSha256",
  "captureRegistryCheckpointSha256",
  "verificationRegistryHeadSha256",
  "revocationCheckpointSha256",
  "currentRevocationCheckpointSha256",
  "humanReviewSha256",
  "ownerDecisionSha256",
  "releaseTransactionSha256",
]);
const ROLE_BINDINGS_KEYS = Object.freeze([
  "registry",
  "humanReview",
  "ownerDecision",
  "release",
]);
const ROLE_BINDING_KEYS = Object.freeze([
  "role",
  "subjectId",
  "keyFingerprintSha256",
]);
const LEDGER_INCLUSION_KEYS = Object.freeze([
  "checkpointSha256",
  "ledgerId",
  "treeSize",
  "leafIndex",
  "leafType",
  "leafSubjectSha256",
  "leafHashSha256",
  "auditPath",
  "merkleRootSha256",
  "hashAlgorithm",
]);
const LEDGER_PROOF_NODE_KEYS = Object.freeze(["position", "sha256"]);
const LEDGER_CHECKPOINT_KEYS = Object.freeze(["payload", "signature"]);
const LEDGER_CHECKPOINT_PAYLOAD_KEYS = Object.freeze([
  "schemaVersion",
  "evidenceType",
  "trustRootAuthoritySha256",
  "ledgerId",
  "sequence",
  "previousCheckpointSha256",
  "treeSize",
  "merkleRootSha256",
  "issuedAt",
  "verificationRegistryHeadSha256",
  "revocationCheckpointSha256",
]);
const TRANSACTION_KEYS = Object.freeze([
  "planSchemaVersion",
  "artifactType",
  "planSha256",
  "transactionNonce",
  "semantics",
  "inspectionStatus",
  "productionPromotionEnabled",
  "coverageExpectedOriginalSha256",
  "fixedPathsSha256",
  "archiveInventorySha256",
  "expectedOutputsSha256",
]);
const VERIFICATION_PROFILE = "generic-complete-immutable-typed-dag-closure-only";
const LEDGER_LEAF_TYPE = "release-bundle-pre-ledger-commitment-sha256";
const PRE_LEDGER_COMMITMENT_DOMAIN =
  "help-math-original-runtime-release-bundle-pre-ledger-commitment-v1";
const TRANSACTION_ARTIFACT_TYPE =
  "original-runtime-promotion-filesystem-transaction-plan";

function isPlainObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function assertObject(value, label) {
  invariant(isPlainObject(value), `${label} must be a plain object`);
  return value;
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

function sameCanonical(left, right) {
  return canonicalJson(left) === canonicalJson(right);
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value)) deepFreeze(child);
  return value;
}

function roleBinding(role, signer) {
  return {
    role,
    subjectId: signer.subjectId,
    keyFingerprintSha256: signer.keyFingerprintSha256,
  };
}

function validateRoleBinding(value, expectedRole, label) {
  assertExactKeys(value, ROLE_BINDING_KEYS, label);
  invariant(value.role === expectedRole, `${label}.role must be ${expectedRole}`);
  assertString(value.subjectId, `${label}.subjectId`);
  assertSha256(value.keyFingerprintSha256, `${label}.keyFingerprintSha256`);
  return value;
}

function validateExecutionBinding(value, label = "execution") {
  assertExactKeys(value, EXECUTION_KEYS, label);
  assertExactKeys(value.operator, OPERATOR_KEYS, `${label}.operator`);
  assertString(value.operator.subjectId, `${label}.operator.subjectId`);
  assertSha256(value.operator.keyFingerprintSha256, `${label}.operator.keyFingerprintSha256`);
  assertSha256(value.operator.attestationSha256, `${label}.operator.attestationSha256`);

  assertExactKeys(value.runtime, RUNTIME_KEYS, `${label}.runtime`);
  for (const key of ["runtimeId", "name", "version"]) {
    assertString(value.runtime[key], `${label}.runtime.${key}`);
  }
  assertSha256(value.runtime.executableSha256, `${label}.runtime.executableSha256`);
  assertSha256(value.runtime.identityReceiptSha256, `${label}.runtime.identityReceiptSha256`);

  assertExactKeys(value.toolchain, TOOLCHAIN_KEYS, `${label}.toolchain`);
  for (const key of TOOLCHAIN_KEYS) assertSha256(value.toolchain[key], `${label}.toolchain.${key}`);
  return value;
}

function validateTypedDagBinding(value, label = "typedDag") {
  assertExactKeys(value, TYPED_DAG_KEYS, label);
  const root = validateNaturalEvidenceDescriptor(value.rootDescriptor, `${label}.rootDescriptor`);
  assertSha256(value.rootDescriptorSha256, `${label}.rootDescriptorSha256`);
  assertSha256(value.rootContentSha256, `${label}.rootContentSha256`);
  assertSha256(value.fullDagSha256, `${label}.fullDagSha256`);
  assertPositiveInteger(value.nodeCount, `${label}.nodeCount`);
  assertNonNegativeInteger(value.edgeCount, `${label}.edgeCount`);
  invariant(value.completeArchiveClosure === true, `${label}.completeArchiveClosure must be true`);
  invariant(value.immutableStagingRequired === true, `${label}.immutableStagingRequired must be true`);
  invariant(value.verificationProfile === VERIFICATION_PROFILE, `${label}.verificationProfile is unsupported`);
  invariant(value.rootDescriptorSha256 === sha256Canonical(root), `${label}.rootDescriptorSha256 is stale`);
  invariant(value.rootContentSha256 === root.sha256, `${label}.rootContentSha256 differs from the typed root`);
  return value;
}

function validateTrustHistory(value, label = "trustHistory") {
  assertExactKeys(value, TRUST_HISTORY_KEYS, label);
  for (const key of [
    "trustRootAuthoritySha256",
    "trustRootConfigSha256",
    "trustRootFileSha256",
    "trustRootFileBindingSha256",
    "captureRegistryCheckpointSha256",
    "verificationRegistryHeadSha256",
    "currentRevocationCheckpointSha256",
    "humanReviewSha256",
    "ownerDecisionSha256",
    "releaseTransactionSha256",
  ]) assertSha256(value[key], `${label}.${key}`);
  for (const key of ["registryCheckpointSha256", "revocationCheckpointSha256"]) {
    invariant(Array.isArray(value[key]) && value[key].length > 0, `${label}.${key} must be a non-empty array`);
    value[key].forEach((digest, index) => assertSha256(digest, `${label}.${key}[${index}]`));
    invariant(new Set(value[key]).size === value[key].length, `${label}.${key} must not contain duplicate hashes`);
  }
  return value;
}

function validateRoleBindings(value, label = "roleBindings") {
  assertExactKeys(value, ROLE_BINDINGS_KEYS, label);
  validateRoleBinding(value.registry, TRUST_ROLES.registry, `${label}.registry`);
  validateRoleBinding(value.humanReview, TRUST_ROLES.humanReview, `${label}.humanReview`);
  validateRoleBinding(value.ownerDecision, TRUST_ROLES.ownerDecision, `${label}.ownerDecision`);
  validateRoleBinding(value.release, TRUST_ROLES.release, `${label}.release`);
  const subjects = Object.values(value).map(({subjectId}) => subjectId);
  const fingerprints = Object.values(value).map(({keyFingerprintSha256}) => keyFingerprintSha256);
  invariant(new Set(subjects).size === subjects.length, `${label} must bind four distinct subjects`);
  invariant(new Set(fingerprints).size === fingerprints.length, `${label} must bind four distinct key fingerprints`);
  return value;
}

function validateLedgerInclusion(value, label = "ledgerInclusion") {
  assertExactKeys(value, LEDGER_INCLUSION_KEYS, label);
  assertSha256(value.checkpointSha256, `${label}.checkpointSha256`);
  assertString(value.ledgerId, `${label}.ledgerId`);
  const treeSize = assertPositiveInteger(value.treeSize, `${label}.treeSize`);
  const leafIndex = assertNonNegativeInteger(value.leafIndex, `${label}.leafIndex`);
  invariant(leafIndex < treeSize, `${label}.leafIndex must be smaller than treeSize`);
  invariant(value.leafType === LEDGER_LEAF_TYPE, `${label}.leafType is unsupported`);
  assertSha256(value.leafSubjectSha256, `${label}.leafSubjectSha256`);
  assertSha256(value.leafHashSha256, `${label}.leafHashSha256`);
  assertSha256(value.merkleRootSha256, `${label}.merkleRootSha256`);
  invariant(value.hashAlgorithm === ORIGINAL_RUNTIME_LEDGER_HASH_ALGORITHM, `${label}.hashAlgorithm is unsupported`);
  invariant(Array.isArray(value.auditPath), `${label}.auditPath must be an array`);
  value.auditPath.forEach((node, index) => {
    const nodeLabel = `${label}.auditPath[${index}]`;
    assertExactKeys(node, LEDGER_PROOF_NODE_KEYS, nodeLabel);
    invariant(node.position === "left" || node.position === "right", `${nodeLabel}.position must be left or right`);
    assertSha256(node.sha256, `${nodeLabel}.sha256`);
  });
  return value;
}

function validateTransactionBinding(value, label = "transaction") {
  assertExactKeys(value, TRANSACTION_KEYS, label);
  invariant(value.planSchemaVersion === 3, `${label}.planSchemaVersion must be 3`);
  invariant(value.artifactType === TRANSACTION_ARTIFACT_TYPE, `${label}.artifactType is unsupported`);
  assertSha256(value.planSha256, `${label}.planSha256`);
  assertString(value.transactionNonce, `${label}.transactionNonce`);
  invariant(value.semantics === ORIGINAL_RUNTIME_TRANSACTION_SEMANTICS, `${label}.semantics is unsupported`);
  invariant(value.inspectionStatus === "not-started", `${label}.inspectionStatus must be not-started`);
  invariant(value.productionPromotionEnabled === false, `${label}.productionPromotionEnabled must remain false`);
  for (const key of [
    "coverageExpectedOriginalSha256",
    "fixedPathsSha256",
    "archiveInventorySha256",
    "expectedOutputsSha256",
  ]) assertSha256(value[key], `${label}.${key}`);
  return value;
}

/**
 * Strict structural validation. It deliberately does not authenticate the
 * envelope; use verifyOriginalRuntimeReleaseBundleDiagnostic for that.
 */
export function validateOriginalRuntimeReleaseBundleSchema(envelope, {now = Date.now()} = {}) {
  assertExactKeys(envelope, RELEASE_BUNDLE_KEYS, "release bundle");
  assertExactKeys(envelope.signature, SIGNATURE_KEYS, "release bundle.signature");
  invariant(envelope.signature.algorithm === SIGNATURE_ALGORITHM, "release bundle.signature.algorithm must be Ed25519");
  assertString(envelope.signature.subjectId, "release bundle.signature.subjectId");
  assertSha256(envelope.signature.keyFingerprintSha256, "release bundle.signature.keyFingerprintSha256");
  assertString(envelope.signature.signatureBase64, "release bundle.signature.signatureBase64");

  const payload = envelope.payload;
  assertExactKeys(payload, RELEASE_BUNDLE_PAYLOAD_KEYS, "release bundle.payload");
  invariant(
    payload.schemaVersion === ORIGINAL_RUNTIME_RELEASE_BUNDLE_SCHEMA_VERSION &&
      payload.evidenceType === ORIGINAL_RUNTIME_RELEASE_BUNDLE_EVIDENCE_TYPE,
    "release bundle payload schema/evidenceType is invalid",
  );
  invariant(payload.status === ORIGINAL_RUNTIME_RELEASE_BUNDLE_STATUS, "release bundle payload status is invalid");
  assertString(payload.animationId, "release bundle.payload.animationId");
  assertString(payload.requirementId, "release bundle.payload.requirementId");
  assertString(payload.releaseId, "release bundle.payload.releaseId");
  validateCaptureBinding(payload.capture, {now, label: "release bundle.payload.capture"});
  validateArtifactBindings(payload.artifactBindings, "release bundle.payload.artifactBindings");
  validateTypedDagBinding(payload.typedDag, "release bundle.payload.typedDag");
  invariant(
    payload.typedDag.rootContentSha256 ===
      payload.artifactBindings.candidateManifestSha256,
    "release bundle typed DAG root must be the candidate manifest bound by human/owner/release decisions",
  );
  validateExecutionBinding(payload.execution, "release bundle.payload.execution");
  validateTrustHistory(payload.trustHistory, "release bundle.payload.trustHistory");
  validateRoleBindings(payload.roleBindings, "release bundle.payload.roleBindings");
  validateLedgerInclusion(payload.ledgerInclusion, "release bundle.payload.ledgerInclusion");
  validateTransactionBinding(payload.transaction, "release bundle.payload.transaction");
  invariant(NONCE_PATTERN.test(payload.nonce || ""), "release bundle.payload.nonce is invalid or too weak");
  validatePlannedOutputs(payload.expectedOutputs, "release bundle.payload.expectedOutputs");
  assertSha256(
    payload.preLedgerCommitmentSha256,
    "release bundle.payload.preLedgerCommitmentSha256",
  );
  parseCanonicalTimestamp(payload.bundledAt, "release bundle.payload.bundledAt", {nowMs: Date.parse(new Date(now).toISOString())});
  invariant(payload.productionPromotionEnabled === false, "release bundle.payload.productionPromotionEnabled must remain false");
  invariant(payload.transaction.transactionNonce === payload.nonce, "release bundle nonce differs from the transaction nonce");
  invariant(
    payload.transaction.expectedOutputsSha256 === sha256Canonical(payload.expectedOutputs),
    "release bundle expectedOutputsSha256 is stale",
  );
  invariant(
    payload.preLedgerCommitmentSha256 === preLedgerCommitmentSha256(payload),
    "release bundle pre-ledger commitment is stale",
  );
  return envelope;
}

function preLedgerCommitmentSha256(payload) {
  const projection = Object.fromEntries(
    RELEASE_BUNDLE_PAYLOAD_KEYS
      .filter((key) => ![
        "ledgerInclusion",
        "preLedgerCommitmentSha256",
        "bundledAt",
      ].includes(key))
      .map((key) => [key, payload[key]]),
  );
  return sha256Canonical({
    domain: PRE_LEDGER_COMMITMENT_DOMAIN,
    payload: projection,
  });
}

function releaseBundleCommitmentLeafHash(commitmentSha256) {
  assertSha256(commitmentSha256, "release bundle pre-ledger commitment");
  const subject = Buffer.from(`${LEDGER_LEAF_TYPE}:${commitmentSha256}`, "utf8");
  return createHash("sha256").update(Buffer.concat([Buffer.from([0]), subject])).digest("hex");
}

function merkleNodeHash(left, right) {
  assertSha256(left, "Merkle left node");
  assertSha256(right, "Merkle right node");
  return createHash("sha256")
    .update(Buffer.concat([Buffer.from([1]), Buffer.from(left, "hex"), Buffer.from(right, "hex")]))
    .digest("hex");
}

function largestPowerOfTwoLessThan(value) {
  invariant(value > 1, "tree size must be larger than one");
  let power = 1;
  while (power * 2 < value) power *= 2;
  return power;
}

function expectedAuditDirections(index, size) {
  if (size === 1) return [];
  const split = largestPowerOfTwoLessThan(size);
  if (index < split) return [...expectedAuditDirections(index, split), "right"];
  return [...expectedAuditDirections(index - split, size - split), "left"];
}

function verifyLedgerProof(proof) {
  const expectedLeaf = releaseBundleCommitmentLeafHash(proof.leafSubjectSha256);
  invariant(proof.leafHashSha256 === expectedLeaf, "ledger proof leaf hash does not bind the release-bundle pre-ledger commitment");
  const expectedDirections = expectedAuditDirections(proof.leafIndex, proof.treeSize);
  invariant(
    sameCanonical(proof.auditPath.map(({position}) => position), expectedDirections),
    "ledger proof audit path shape is impossible for leafIndex/treeSize",
  );
  let cursor = proof.leafHashSha256;
  for (const node of proof.auditPath) {
    cursor = node.position === "left"
      ? merkleNodeHash(node.sha256, cursor)
      : merkleNodeHash(cursor, node.sha256);
  }
  invariant(cursor === proof.merkleRootSha256, "ledger inclusion proof does not reach the declared Merkle root");
  return cursor;
}

function validateLedgerCheckpointSchema(envelope, {now}) {
  assertExactKeys(envelope, LEDGER_CHECKPOINT_KEYS, "owner ledger checkpoint");
  assertExactKeys(envelope.signature, SIGNATURE_KEYS, "owner ledger checkpoint.signature");
  invariant(envelope.signature.algorithm === SIGNATURE_ALGORITHM, "owner ledger checkpoint signature algorithm must be Ed25519");
  assertString(envelope.signature.subjectId, "owner ledger checkpoint.signature.subjectId");
  assertSha256(envelope.signature.keyFingerprintSha256, "owner ledger checkpoint.signature.keyFingerprintSha256");
  assertString(envelope.signature.signatureBase64, "owner ledger checkpoint.signature.signatureBase64");
  const payload = envelope.payload;
  assertExactKeys(payload, LEDGER_CHECKPOINT_PAYLOAD_KEYS, "owner ledger checkpoint.payload");
  invariant(
    payload.schemaVersion === ORIGINAL_RUNTIME_RELEASE_BUNDLE_SCHEMA_VERSION &&
      payload.evidenceType === ORIGINAL_RUNTIME_OWNER_LEDGER_CHECKPOINT_EVIDENCE_TYPE,
    "owner ledger checkpoint schema/evidenceType is invalid",
  );
  assertSha256(payload.trustRootAuthoritySha256, "owner ledger checkpoint.payload.trustRootAuthoritySha256");
  assertString(payload.ledgerId, "owner ledger checkpoint.payload.ledgerId");
  const sequence = assertPositiveInteger(payload.sequence, "owner ledger checkpoint.payload.sequence");
  if (sequence === 1) {
    invariant(payload.previousCheckpointSha256 === null, "first owner ledger checkpoint must have no predecessor");
  } else {
    assertSha256(payload.previousCheckpointSha256, "owner ledger checkpoint.payload.previousCheckpointSha256");
  }
  assertPositiveInteger(payload.treeSize, "owner ledger checkpoint.payload.treeSize");
  assertSha256(payload.merkleRootSha256, "owner ledger checkpoint.payload.merkleRootSha256");
  const issuedAtMs = parseCanonicalTimestamp(payload.issuedAt, "owner ledger checkpoint.payload.issuedAt", {nowMs: now});
  assertSha256(payload.verificationRegistryHeadSha256, "owner ledger checkpoint.payload.verificationRegistryHeadSha256");
  assertSha256(payload.revocationCheckpointSha256, "owner ledger checkpoint.payload.revocationCheckpointSha256");
  return {payload, issuedAtMs};
}

function trustHistoryProjection(trust, options) {
  return {
    trustRootAuthoritySha256: trust.trustRootSha256,
    trustRootConfigSha256: trust.externalTrustAnchor.configSha256,
    trustRootFileSha256: trust.externalTrustAnchor.fileSha256,
    trustRootFileBindingSha256: trust.externalTrustAnchor.fileBindingSha256,
    registryCheckpointSha256: options.registryCheckpoints.map(signedEnvelopeSha256),
    captureRegistryCheckpointSha256: trust.captureRegistryCheckpointSha256,
    verificationRegistryHeadSha256: trust.verificationRegistryHeadSha256,
    revocationCheckpointSha256: options.revocationCheckpoints.map(signedEnvelopeSha256),
    currentRevocationCheckpointSha256: trust.revocationCheckpointSha256,
    humanReviewSha256: trust.humanReviewSha256,
    ownerDecisionSha256: trust.ownerDecisionSha256,
    releaseTransactionSha256: trust.releaseTransactionSha256,
  };
}

function roleBindingsProjection(trust) {
  return {
    registry: roleBinding(TRUST_ROLES.registry, trust.signers.verificationRegistry),
    humanReview: roleBinding(TRUST_ROLES.humanReview, trust.signers.humanReview),
    ownerDecision: roleBinding(TRUST_ROLES.ownerDecision, trust.signers.ownerDecision),
    release: roleBinding(TRUST_ROLES.release, trust.signers.release),
  };
}

function deriveExpectedOutputs(descriptor) {
  const projected = [
    {path: descriptor.fixedPaths.coverage, sha256: descriptor.coverage.replacementSha256},
    {path: descriptor.fixedPaths.baseline, sha256: descriptor.outputs.baseline.sha256},
    {path: descriptor.fixedPaths.executionReport, sha256: descriptor.outputs.executionReport.sha256},
    {path: descriptor.fixedPaths.promotionReceipt, sha256: descriptor.outputs.promotionReceipt.sha256},
    ...descriptor.archive.files.map((file) => ({
      path: path.posix.join(descriptor.fixedPaths.archive, file.relativePath),
      sha256: file.sha256,
    })),
  ].sort((left, right) => left.path.localeCompare(right.path));
  validatePlannedOutputs(projected, "transaction-derived expected outputs");
  return projected;
}

async function deriveTransactionBinding(handle) {
  assertObject(handle, "transactionPlan");
  const descriptor = assertObject(handle.descriptor, "transactionPlan.descriptor");
  invariant(handle.planSha256 === descriptor.planSha256, "transaction plan public hash differs from its descriptor");
  invariant(descriptor.schemaVersion === 3, "transaction plan schemaVersion is unsupported");
  invariant(descriptor.artifactType === TRANSACTION_ARTIFACT_TYPE, "transaction plan artifactType is unsupported");
  invariant(descriptor.productionPromotionEnabled === false, "transaction plan productionPromotionEnabled must remain false");
  invariant(ORIGINAL_RUNTIME_PROMOTION_TRANSACTION_WRITES_ENABLED === false, "transaction write fuse unexpectedly changed");
  const inspection = await inspectOriginalRuntimePromotionTransaction(handle);
  invariant(inspection.status === "not-started", "release bundle accepts only an unstarted transaction plan");
  invariant(Array.isArray(inspection.records) && inspection.records.length === 0, "unstarted transaction inspection unexpectedly contains journal records");
  invariant(inspection.planSha256 === descriptor.planSha256, "transaction inspection plan hash differs");
  const expectedOutputs = deriveExpectedOutputs(descriptor);
  return {
    descriptor,
    expectedOutputs,
    binding: {
      planSchemaVersion: descriptor.schemaVersion,
      artifactType: descriptor.artifactType,
      planSha256: descriptor.planSha256,
      transactionNonce: descriptor.transactionNonce,
      semantics: ORIGINAL_RUNTIME_TRANSACTION_SEMANTICS,
      inspectionStatus: inspection.status,
      productionPromotionEnabled: descriptor.productionPromotionEnabled,
      coverageExpectedOriginalSha256: descriptor.coverage.expectedOriginalSha256,
      fixedPathsSha256: sha256Canonical(descriptor.fixedPaths),
      archiveInventorySha256: descriptor.archive.inventorySha256,
      expectedOutputsSha256: sha256Canonical(expectedOutputs),
    },
  };
}

function dagBinding(rootDescriptor, dag) {
  return {
    rootDescriptor,
    rootDescriptorSha256: sha256Canonical(rootDescriptor),
    rootContentSha256: rootDescriptor.sha256,
    fullDagSha256: dag.dagSha256,
    nodeCount: dag.inventory.length,
    edgeCount: dag.edgeInventory.length,
    completeArchiveClosure: dag.completeArchiveClosure,
    immutableStagingRequired: true,
    verificationProfile: VERIFICATION_PROFILE,
  };
}

function assertSignerMatches(observed, expected, label) {
  invariant(
    observed.subjectId === expected.subjectId &&
      observed.keyFingerprintSha256 === expected.keyFingerprintSha256,
    `${label} signer differs from the externally anchored role binding`,
  );
}

function blockingDiagnostics() {
  return [
    {
      code: "ORIGINAL_RUNTIME_RELEASE_BUNDLE_PRODUCTION_DISABLED",
      detail: "This module has no writer or adopter integration and cannot authorize canonical output.",
    },
    {
      code: "ORIGINAL_RUNTIME_PRODUCTION_TRUST_ANCHOR_NOT_CONFIGURED",
      detail: "The reused trust verifier is diagnostic-only; its module-fixed production anchor remains absent.",
    },
    {
      code: "ORIGINAL_RUNTIME_CAPTURE_OPERATOR_AUTHORITY_UNPROVEN",
      detail: "The operator/runtime/toolchain projection is signature-bound but is not yet derived from a branded preparer result or an operator role in the external registry.",
    },
    {
      code: "ORIGINAL_RUNTIME_DAG_SEMANTIC_AUTHORITY_UNPROVEN",
      detail: "The complete immutable typed DAG is verified generically; this bundle does not brand root/natural candidate semantics as writer authority.",
    },
    {
      code: "ORIGINAL_RUNTIME_LEDGER_DURABILITY_UNPROVEN",
      detail: "The signed checkpoint and Merkle inclusion are valid, but this read-only verifier cannot prove an independently hosted append-only ledger retained the checkpoint.",
    },
    {
      code: "ORIGINAL_RUNTIME_NONCE_NOT_DURABLY_RESERVED",
      detail: "The nonce is bound and replay-checked only against the supplied snapshot; no durable atomic reservation is performed.",
    },
    {
      code: "ORIGINAL_RUNTIME_TRANSACTION_WRITES_DISABLED",
      detail: "The process-private transaction plan is inspected only; execute and recover remain unconditionally disabled.",
    },
  ];
}

/**
 * Composes existing validation-only trust, typed-DAG, and transaction
 * primitives. Passing means the synthetic/read-only bundle is internally
 * consistent. It never means trustVerified, promotion authority, acceptance,
 * or canonical evidence.
 */
export async function verifyOriginalRuntimeReleaseBundleDiagnostic(options = {}) {
  assertExactKeys(options, [
    "bundle",
    "releaseSignerPublicKeyPem",
    "ledgerCheckpoint",
    "ledgerSignerPublicKeyPem",
    "trust",
    "dag",
    "expectedExecution",
    "transactionPlan",
    "now",
  ], "release bundle verification options");
  invariant(
    ORIGINAL_RUNTIME_RELEASE_BUNDLE_WRITES_ENABLED === false &&
      ORIGINAL_RUNTIME_RELEASE_BUNDLE_PRODUCTION_ENABLED === false &&
      PROMOTION_WRITES_ENABLED === false &&
      ORIGINAL_RUNTIME_NATURAL_PROMOTION_ENABLED === false &&
      ORIGINAL_RUNTIME_PROMOTION_TRANSACTION_WRITES_ENABLED === false,
    "one or more original-runtime promotion write fuses unexpectedly changed",
  );
  const nowMs = Date.parse(new Date(options.now).toISOString());
  const envelope = validateOriginalRuntimeReleaseBundleSchema(options.bundle, {now: nowMs});
  const payload = envelope.payload;
  const expectedExecution = validateExecutionBinding(options.expectedExecution, "expectedExecution");
  invariant(sameCanonical(payload.execution, expectedExecution), "release bundle operator/runtime/toolchain binding differs from expected execution evidence");

  assertExactKeys(options.dag, ["baseRoots", "seeds"], "release bundle DAG verification options");
  invariant(Array.isArray(options.dag.seeds) && options.dag.seeds.length === 1, "release bundle requires exactly one typed DAG root");
  const rootDescriptor = validateNaturalEvidenceDescriptor(options.dag.seeds[0], "release bundle DAG root");
  const dag = await verifyOriginalRuntimeNaturalCandidateDag({
    baseRoots: options.dag.baseRoots,
    seeds: [rootDescriptor],
    requireCompleteArchives: true,
    requireImmutableStaging: true,
  });
  invariant(dag.completeArchiveClosure === true, "release bundle DAG did not establish complete archive closure");
  const expectedDagBinding = dagBinding(rootDescriptor, dag);
  invariant(sameCanonical(payload.typedDag, expectedDagBinding), "release bundle typed DAG root/full-DAG binding differs from verified immutable closure");

  const transaction = await deriveTransactionBinding(options.transactionPlan);
  invariant(
    transaction.descriptor.migrationId === payload.animationId &&
      transaction.descriptor.requirementId === payload.requirementId,
    "transaction plan animation/requirement identity differs from the release bundle",
  );
  invariant(sameCanonical(payload.expectedOutputs, transaction.expectedOutputs), "release bundle expected output hashes differ from the transaction plan");
  invariant(sameCanonical(payload.transaction, transaction.binding), "release bundle transaction semantics/plan binding differs");
  invariant(payload.nonce === transaction.descriptor.transactionNonce, "release bundle nonce differs from the process-private transaction plan");

  assertObject(options.trust, "trust");
  const trust = verifyOriginalRuntimePromotionTrustDiagnostic(options.trust);
  invariant(trust.diagnosticOnly === true && trust.authoritative === false, "trust verification unexpectedly supplied authority");
  invariant(sameCanonical(payload.capture, options.trust.expected.capture), "release bundle capture differs from the trust plan");
  invariant(sameCanonical(payload.artifactBindings, options.trust.expected.artifactBindings), "release bundle artifact bindings differ from the trust plan");
  invariant(sameCanonical(payload.expectedOutputs, options.trust.expected.plannedOutputs), "release bundle outputs differ from the signed trust plan");
  invariant(payload.animationId === options.trust.expected.animationId && payload.requirementId === options.trust.expected.requirementId, "release bundle identity differs from the signed trust plan");
  invariant(payload.releaseId === options.trust.releaseTransaction.payload.releaseId, "release bundle releaseId differs from the signed release transaction");
  invariant(payload.nonce === trust.nonce, "release bundle nonce differs from the signed release transaction");
  invariant(sameCanonical(payload.trustHistory, trustHistoryProjection(trust, options.trust)), "release bundle registry/revocation/review history binding differs");
  invariant(sameCanonical(payload.roleBindings, roleBindingsProjection(trust)), "release bundle human/owner/release role binding differs");

  const releasePublicKeyFingerprint = ed25519PublicKeyFingerprint(options.releaseSignerPublicKeyPem);
  invariant(releasePublicKeyFingerprint === trust.signers.release.keyFingerprintSha256, "release bundle public key differs from the externally anchored release signer");
  const bundleSigner = verifyEd25519DetachedSignature({
    payload,
    signature: envelope.signature,
    publicKeyPem: options.releaseSignerPublicKeyPem,
    label: "release bundle",
  });
  assertSignerMatches(bundleSigner, trust.signers.release, "release bundle");

  const ledgerSchema = validateLedgerCheckpointSchema(options.ledgerCheckpoint, {now: nowMs});
  const ledgerSignerFingerprint = ed25519PublicKeyFingerprint(options.ledgerSignerPublicKeyPem);
  invariant(ledgerSignerFingerprint === trust.signers.verificationRegistry.keyFingerprintSha256, "owner ledger checkpoint public key differs from the externally anchored registry authority");
  const ledgerSigner = verifyEd25519DetachedSignature({
    payload: options.ledgerCheckpoint.payload,
    signature: options.ledgerCheckpoint.signature,
    publicKeyPem: options.ledgerSignerPublicKeyPem,
    label: "owner ledger checkpoint",
  });
  assertSignerMatches(ledgerSigner, trust.signers.verificationRegistry, "owner ledger checkpoint");
  const ledgerCheckpointSha256 = signedEnvelopeSha256(options.ledgerCheckpoint);
  invariant(payload.ledgerInclusion.checkpointSha256 === ledgerCheckpointSha256, "release bundle ledger checkpoint hash differs");
  invariant(
    payload.ledgerInclusion.leafSubjectSha256 ===
      payload.preLedgerCommitmentSha256,
    "ledger leaf does not name the exact release-bundle pre-ledger commitment",
  );
  verifyLedgerProof(payload.ledgerInclusion);
  invariant(
    ledgerSchema.payload.ledgerId === payload.ledgerInclusion.ledgerId &&
      ledgerSchema.payload.treeSize === payload.ledgerInclusion.treeSize &&
      ledgerSchema.payload.merkleRootSha256 === payload.ledgerInclusion.merkleRootSha256,
    "ledger checkpoint tree identity differs from the inclusion proof",
  );
  invariant(ledgerSchema.payload.trustRootAuthoritySha256 === trust.trustRootSha256, "ledger checkpoint trust-root binding differs");
  invariant(ledgerSchema.payload.verificationRegistryHeadSha256 === trust.verificationRegistryHeadSha256, "ledger checkpoint registry-head binding differs");
  invariant(ledgerSchema.payload.revocationCheckpointSha256 === trust.revocationCheckpointSha256, "ledger checkpoint revocation-head binding differs");

  const releaseAtMs = parseCanonicalTimestamp(
    options.trust.releaseTransaction.payload.releasedAt,
    "signed release transaction releasedAt",
    {nowMs},
  );
  const bundledAtMs = parseCanonicalTimestamp(payload.bundledAt, "release bundle bundledAt", {nowMs});
  invariant(ledgerSchema.issuedAtMs >= releaseAtMs, "owner ledger checkpoint predates the signed release transaction it includes");
  invariant(bundledAtMs >= ledgerSchema.issuedAtMs, "release bundle predates its owner ledger checkpoint");
  invariant(
    payload.execution.operator.subjectId !== trust.signers.humanReview.subjectId &&
      payload.execution.operator.subjectId !== trust.signers.ownerDecision.subjectId &&
      payload.execution.operator.subjectId !== trust.signers.release.subjectId &&
      payload.execution.operator.subjectId !== trust.signers.verificationRegistry.subjectId,
    "capture operator must be distinct from registry, human, owner, and release subjects",
  );
  invariant(
    payload.execution.operator.keyFingerprintSha256 !== trust.signers.humanReview.keyFingerprintSha256 &&
      payload.execution.operator.keyFingerprintSha256 !== trust.signers.ownerDecision.keyFingerprintSha256 &&
      payload.execution.operator.keyFingerprintSha256 !== trust.signers.release.keyFingerprintSha256 &&
      payload.execution.operator.keyFingerprintSha256 !== trust.signers.verificationRegistry.keyFingerprintSha256,
    "capture operator key must be distinct from registry, human, owner, and release keys",
  );

  return deepFreeze({
    validationPassed: true,
    status: "read-only-release-bundle-schema-and-binding-pass",
    diagnosticOnly: true,
    authoritative: false,
    trustVerified: false,
    readyForProductionPromotion: false,
    promotionWritable: false,
    strictAcceptanceEffect: false,
    authoritativePromotionPerformed: false,
    releaseBundleSha256: signedEnvelopeSha256(envelope),
    releaseBundlePayloadSha256: sha256Canonical(payload),
    typedDagRootDescriptorSha256: payload.typedDag.rootDescriptorSha256,
    fullDagSha256: dag.dagSha256,
    trustRootAuthoritySha256: trust.trustRootSha256,
    registryCheckpointSha256: [...payload.trustHistory.registryCheckpointSha256],
    revocationCheckpointSha256: [...payload.trustHistory.revocationCheckpointSha256],
    humanReviewSha256: trust.humanReviewSha256,
    ownerDecisionSha256: trust.ownerDecisionSha256,
    releaseTransactionSha256: trust.releaseTransactionSha256,
    preLedgerCommitmentSha256: payload.preLedgerCommitmentSha256,
    ledgerCheckpointSha256,
    ledgerMerkleRootSha256: payload.ledgerInclusion.merkleRootSha256,
    nonce: payload.nonce,
    nonceDurablyReserved: false,
    transactionPlanSha256: transaction.descriptor.planSha256,
    transactionInspectionStatus: payload.transaction.inspectionStatus,
    expectedOutputsSha256: payload.transaction.expectedOutputsSha256,
    expectedOutputCount: payload.expectedOutputs.length,
    blockingDiagnostics: blockingDiagnostics(),
  });
}

/**
 * Test/fixture-facing hash helpers are intentionally narrow and write-free.
 * They make synthetic ledger fixtures reproducible without exporting a ledger
 * writer or accepting a self-referential bundle hash.
 */
export function originalRuntimeReleaseBundlePreLedgerCommitmentSha256(payload) {
  assertObject(payload, "release bundle payload");
  return preLedgerCommitmentSha256(payload);
}

export function originalRuntimeReleaseBundleCommitmentLedgerLeafSha256(
  commitmentSha256,
) {
  return releaseBundleCommitmentLeafHash(commitmentSha256);
}

export function originalRuntimeOwnerLedgerNodeSha256(left, right) {
  return merkleNodeHash(left, right);
}
