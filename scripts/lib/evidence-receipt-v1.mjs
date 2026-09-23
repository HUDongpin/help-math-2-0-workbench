import {
  assertExactKeys,
  canonicalJson,
  parseCanonicalTimestamp,
  sha256Canonical,
  verifyEd25519DetachedSignature,
} from "./original-runtime-promotion-trust.mjs";

export const EVIDENCE_RECEIPT_V1_SCHEMA_VERSION = 1;
export const EVIDENCE_RECEIPT_V1_TYPE = "help-math-lesson-evidence-receipt-v1";
export const EVIDENCE_RECEIPT_V1_INVALIDATION_POLICY =
  "exact-hash-drift-closes-release-v1";
export const EVIDENCE_RECEIPT_V1_EXPORT_CLASS = "public-hash-metadata-only";

const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const COMMIT_SHA_PATTERN = /^(?:[a-f0-9]{40}|[a-f0-9]{64})$/;
const LOGICAL_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$/;

const RECEIPT_KEYS = Object.freeze(["payload", "signature"]);
const SIGNATURE_KEYS = Object.freeze([
  "algorithm",
  "subjectId",
  "keyFingerprintSha256",
  "signatureBase64",
]);
const PAYLOAD_KEYS = Object.freeze([
  "schemaVersion",
  "evidenceType",
  "receiptId",
  "releaseId",
  "issuedAt",
  "expiresAt",
  "build",
  "execution",
  "acceptance",
  "invalidation",
  "privacy",
]);
const BUILD_KEYS = Object.freeze([
  "commitSha",
  "releaseDefinitionSha256",
  "sourceManifestSha256",
  "rendererRegistrySha256",
  "completionLedgerSha256",
  "releaseLedgerSha256",
]);
const EXECUTION_KEYS = Object.freeze([
  "runner",
  "tools",
  "commands",
  "inputs",
  "outputs",
]);
const TOOL_KEYS = Object.freeze(["name", "version", "artifactSha256"]);
const COMMAND_KEYS = Object.freeze([
  "commandId",
  "argv",
  "startedAt",
  "endedAt",
  "exitCode",
  "stdoutSha256",
  "stderrSha256",
]);
const ARTIFACT_KEYS = Object.freeze([
  "logicalId",
  "artifactType",
  "bytes",
  "sha256",
]);
const ACCEPTANCE_KEYS = Object.freeze([
  "expectedMemberCount",
  "strictCompleteCount",
  "expectedPublishedCount",
  "publishedCount",
  "strictValidatorSha256",
  "reviewDecisionSha256",
  "ownerDecisionSha256",
  "promotionReleaseBundleSha256",
  "allExactAssetsCurrent",
  "atomicPublicationAuthorized",
]);
const INVALIDATION_KEYS = Object.freeze(["policy", "bindings"]);
const BINDING_KEYS = Object.freeze(["kind", "logicalId", "sha256"]);
const PRIVACY_KEYS = Object.freeze([
  "exportClass",
  "containsRawFrames",
  "containsRawAudio",
  "containsPrivatePaths",
  "containsContactInformation",
  "containsStudentData",
  "containsSecrets",
]);

export const EVIDENCE_RECEIPT_V1_BINDING_KINDS = Object.freeze([
  "source-manifest",
  "renderer-registry",
  "release-definition",
  "completion-ledger",
  "release-ledger",
  "candidate-evidence",
  "review-decision",
  "owner-decision",
  "promotion-release-bundle",
]);

export const EVIDENCE_RECEIPT_V1_EXPECTED_BINDING_KEYS = Object.freeze([
  "commitSha",
  "releaseDefinitionSha256",
  "sourceManifestSha256",
  "rendererRegistrySha256",
  "completionLedgerSha256",
  "releaseLedgerSha256",
]);

const SINGLETON_BINDING_FIELDS = Object.freeze({
  "source-manifest": ["build", "sourceManifestSha256"],
  "renderer-registry": ["build", "rendererRegistrySha256"],
  "release-definition": ["build", "releaseDefinitionSha256"],
  "completion-ledger": ["build", "completionLedgerSha256"],
  "release-ledger": ["build", "releaseLedgerSha256"],
  "review-decision": ["acceptance", "reviewDecisionSha256"],
  "owner-decision": ["acceptance", "ownerDecisionSha256"],
  "promotion-release-bundle": ["acceptance", "promotionReleaseBundleSha256"],
});

function compareText(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function isPlainObject(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function assertObject(value, label) {
  if (!isPlainObject(value)) throw new Error(`${label} must be an object`);
  return value;
}

function assertString(value, label) {
  if (typeof value !== "string" || !value.length) {
    throw new Error(`${label} must be a non-empty string`);
  }
  return value;
}

function assertLogicalId(value, label) {
  assertString(value, label);
  if (!LOGICAL_ID_PATTERN.test(value)) {
    throw new Error(`${label} must be a portable logical identifier`);
  }
  return value;
}

function assertSha256(value, label) {
  if (!SHA256_PATTERN.test(value || "")) {
    throw new Error(`${label} must be a lowercase SHA-256`);
  }
  return value;
}

function assertInteger(value, label, {minimum = 0, maximum = Number.MAX_SAFE_INTEGER} = {}) {
  if (!Number.isSafeInteger(value) || value < minimum || value > maximum) {
    throw new Error(`${label} must be a safe integer from ${minimum} through ${maximum}`);
  }
  return value;
}

function assertBoolean(value, expected, label) {
  if (value !== expected) throw new Error(`${label} must be ${expected}`);
}

function assertNonEmptyArray(value, label) {
  if (!Array.isArray(value) || !value.length) {
    throw new Error(`${label} must be a non-empty array`);
  }
  return value;
}

function assertUnique(values, label) {
  if (new Set(values).size !== values.length) throw new Error(`${label} must be unique`);
}

function assertLexicallySorted(values, label) {
  const expected = [...values].sort(compareText);
  if (canonicalJson(values) !== canonicalJson(expected)) {
    throw new Error(`${label} must be in lexical order`);
  }
}

function normalizeNow(now) {
  if (now instanceof Date) return now.getTime();
  if (typeof now === "string") return Date.parse(now);
  if (typeof now === "number") return now;
  if (now === undefined) return Date.now();
  return Number.NaN;
}

function inspectPublicText(value, label) {
  const strings = [];
  const visit = (item, itemLabel) => {
    if (typeof item === "string") {
      strings.push([item, itemLabel]);
      return;
    }
    if (Array.isArray(item)) {
      item.forEach((entry, index) => visit(entry, `${itemLabel}[${index}]`));
      return;
    }
    if (isPlainObject(item)) {
      Object.entries(item).forEach(([key, entry]) => visit(entry, `${itemLabel}.${key}`));
    }
  };
  visit(value, label);

  const privatePathPattern = /(?:file:\/\/|(?:^|\s|=)~\/|\/(?:Users|Volumes|home|private|var\/folders)\/|[A-Za-z]:\\)/i;
  const emailPattern = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
  const secretPattern = /(?:bearer\s+[A-Za-z0-9._~+/=-]+|(?:password|passwd|api[_-]?key|access[_-]?key|secret|token)\s*[:=]\s*\S+)/i;
  for (const [text, itemLabel] of strings) {
    if (privatePathPattern.test(text)) throw new Error(`${itemLabel} exposes a private filesystem path`);
    if (emailPattern.test(text)) throw new Error(`${itemLabel} exposes contact information`);
    if (secretPattern.test(text)) throw new Error(`${itemLabel} appears to expose a secret`);
  }
}

function validateTool(value, label) {
  assertExactKeys(assertObject(value, label), TOOL_KEYS, label);
  assertLogicalId(value.name, `${label}.name`);
  assertString(value.version, `${label}.version`);
  if (value.version.length > 128) throw new Error(`${label}.version is too long`);
  assertSha256(value.artifactSha256, `${label}.artifactSha256`);
}

function validateCommand(value, index, {nowMs}) {
  const label = `receipt.payload.execution.commands[${index}]`;
  assertExactKeys(assertObject(value, label), COMMAND_KEYS, label);
  assertLogicalId(value.commandId, `${label}.commandId`);
  const argv = assertNonEmptyArray(value.argv, `${label}.argv`);
  argv.forEach((argument, argumentIndex) => {
    assertString(argument, `${label}.argv[${argumentIndex}]`);
    if (argument.length > 512) throw new Error(`${label}.argv[${argumentIndex}] is too long`);
  });
  const startedAtMs = parseCanonicalTimestamp(value.startedAt, `${label}.startedAt`, {nowMs});
  const endedAtMs = parseCanonicalTimestamp(value.endedAt, `${label}.endedAt`, {nowMs});
  if (endedAtMs < startedAtMs) throw new Error(`${label}.endedAt precedes startedAt`);
  assertInteger(value.exitCode, `${label}.exitCode`, {minimum: 0, maximum: 255});
  if (value.exitCode !== 0) throw new Error(`${label}.exitCode must be zero for a published receipt`);
  assertSha256(value.stdoutSha256, `${label}.stdoutSha256`);
  assertSha256(value.stderrSha256, `${label}.stderrSha256`);
}

function validateArtifact(value, label) {
  assertExactKeys(assertObject(value, label), ARTIFACT_KEYS, label);
  assertLogicalId(value.logicalId, `${label}.logicalId`);
  assertLogicalId(value.artifactType, `${label}.artifactType`);
  assertInteger(value.bytes, `${label}.bytes`);
  assertSha256(value.sha256, `${label}.sha256`);
}

function validateExecution(value, {nowMs}) {
  const label = "receipt.payload.execution";
  assertExactKeys(assertObject(value, label), EXECUTION_KEYS, label);
  validateTool(value.runner, `${label}.runner`);

  const tools = assertNonEmptyArray(value.tools, `${label}.tools`);
  tools.forEach((tool, index) => validateTool(tool, `${label}.tools[${index}]`));
  const toolNames = tools.map((tool) => tool.name);
  assertUnique(toolNames, `${label}.tools names`);
  assertLexicallySorted(toolNames, `${label}.tools names`);

  const commands = assertNonEmptyArray(value.commands, `${label}.commands`);
  commands.forEach((command, index) => validateCommand(command, index, {nowMs}));
  assertUnique(commands.map((command) => command.commandId), `${label}.commands commandId values`);

  for (const collectionName of ["inputs", "outputs"]) {
    const collection = assertNonEmptyArray(value[collectionName], `${label}.${collectionName}`);
    collection.forEach((artifact, index) =>
      validateArtifact(artifact, `${label}.${collectionName}[${index}]`));
    const logicalIds = collection.map((artifact) => artifact.logicalId);
    assertUnique(logicalIds, `${label}.${collectionName} logicalId values`);
    assertLexicallySorted(logicalIds, `${label}.${collectionName} logicalId values`);
  }
}

function validateAcceptance(value) {
  const label = "receipt.payload.acceptance";
  assertExactKeys(assertObject(value, label), ACCEPTANCE_KEYS, label);
  const expectedMemberCount = assertInteger(
    value.expectedMemberCount,
    `${label}.expectedMemberCount`,
    {minimum: 1},
  );
  const strictCompleteCount = assertInteger(
    value.strictCompleteCount,
    `${label}.strictCompleteCount`,
  );
  const expectedPublishedCount = assertInteger(
    value.expectedPublishedCount,
    `${label}.expectedPublishedCount`,
    {minimum: 1, maximum: 1},
  );
  const publishedCount = assertInteger(value.publishedCount, `${label}.publishedCount`, {
    minimum: 0,
    maximum: 1,
  });
  if (strictCompleteCount !== expectedMemberCount) {
    throw new Error(`${label} cannot authorize publication before every member is strict complete`);
  }
  if (publishedCount !== expectedPublishedCount) {
    throw new Error(`${label} must record the one atomic Lesson release as published`);
  }
  for (const field of [
    "strictValidatorSha256",
    "reviewDecisionSha256",
    "ownerDecisionSha256",
    "promotionReleaseBundleSha256",
  ]) assertSha256(value[field], `${label}.${field}`);
  assertBoolean(value.allExactAssetsCurrent, true, `${label}.allExactAssetsCurrent`);
  assertBoolean(value.atomicPublicationAuthorized, true, `${label}.atomicPublicationAuthorized`);
}

function validateInvalidation(value, payload) {
  const label = "receipt.payload.invalidation";
  assertExactKeys(assertObject(value, label), INVALIDATION_KEYS, label);
  if (value.policy !== EVIDENCE_RECEIPT_V1_INVALIDATION_POLICY) {
    throw new Error(`${label}.policy must be ${EVIDENCE_RECEIPT_V1_INVALIDATION_POLICY}`);
  }
  const bindings = assertNonEmptyArray(value.bindings, `${label}.bindings`);
  bindings.forEach((binding, index) => {
    const bindingLabel = `${label}.bindings[${index}]`;
    assertExactKeys(assertObject(binding, bindingLabel), BINDING_KEYS, bindingLabel);
    if (!EVIDENCE_RECEIPT_V1_BINDING_KINDS.includes(binding.kind)) {
      throw new Error(`${bindingLabel}.kind is unsupported`);
    }
    assertLogicalId(binding.logicalId, `${bindingLabel}.logicalId`);
    assertSha256(binding.sha256, `${bindingLabel}.sha256`);
  });
  const identities = bindings.map((binding) => `${binding.kind}\u0000${binding.logicalId}`);
  assertUnique(identities, `${label}.bindings identities`);
  assertLexicallySorted(identities, `${label}.bindings identities`);

  const byKind = new Map();
  for (const binding of bindings) {
    const entries = byKind.get(binding.kind) || [];
    entries.push(binding);
    byKind.set(binding.kind, entries);
  }
  for (const kind of EVIDENCE_RECEIPT_V1_BINDING_KINDS) {
    const entries = byKind.get(kind) || [];
    if (kind === "candidate-evidence") {
      if (!entries.length) throw new Error(`${label}.bindings requires candidate-evidence`);
      continue;
    }
    if (entries.length !== 1) throw new Error(`${label}.bindings requires exactly one ${kind}`);
  }
  for (const [kind, [section, field]] of Object.entries(SINGLETON_BINDING_FIELDS)) {
    const binding = byKind.get(kind)[0];
    if (binding.sha256 !== payload[section][field]) {
      throw new Error(`${label} ${kind} differs from payload.${section}.${field}`);
    }
  }
}

function validatePrivacy(value) {
  const label = "receipt.payload.privacy";
  assertExactKeys(assertObject(value, label), PRIVACY_KEYS, label);
  if (value.exportClass !== EVIDENCE_RECEIPT_V1_EXPORT_CLASS) {
    throw new Error(`${label}.exportClass must be ${EVIDENCE_RECEIPT_V1_EXPORT_CLASS}`);
  }
  for (const field of PRIVACY_KEYS.slice(1)) assertBoolean(value[field], false, `${label}.${field}`);
}

/**
 * Validate a receipt's closed public shape and its internal hash relationships.
 * This does not establish signer authority; call verifyEvidenceReceiptV1 with a
 * caller-pinned public key and current build bindings for that decision.
 */
export function validateEvidenceReceiptV1(receipt, {now} = {}) {
  const nowMs = normalizeNow(now);
  if (!Number.isFinite(nowMs)) throw new Error("now must be a valid Date, ISO timestamp, or epoch millisecond value");
  assertExactKeys(assertObject(receipt, "receipt"), RECEIPT_KEYS, "receipt");
  const payload = assertObject(receipt.payload, "receipt.payload");
  assertExactKeys(payload, PAYLOAD_KEYS, "receipt.payload");
  if (payload.schemaVersion !== EVIDENCE_RECEIPT_V1_SCHEMA_VERSION) {
    throw new Error(`receipt.payload.schemaVersion must be ${EVIDENCE_RECEIPT_V1_SCHEMA_VERSION}`);
  }
  if (payload.evidenceType !== EVIDENCE_RECEIPT_V1_TYPE) {
    throw new Error(`receipt.payload.evidenceType must be ${EVIDENCE_RECEIPT_V1_TYPE}`);
  }
  assertLogicalId(payload.receiptId, "receipt.payload.receiptId");
  assertLogicalId(payload.releaseId, "receipt.payload.releaseId");
  const issuedAtMs = parseCanonicalTimestamp(payload.issuedAt, "receipt.payload.issuedAt", {nowMs});
  const expiresAtMs = parseCanonicalTimestamp(payload.expiresAt, "receipt.payload.expiresAt", {
    nowMs,
    allowFuture: true,
  });
  if (expiresAtMs <= issuedAtMs) throw new Error("receipt.payload.expiresAt must follow issuedAt");
  if (expiresAtMs <= nowMs) throw new Error("receipt.payload is expired");

  assertExactKeys(assertObject(payload.build, "receipt.payload.build"), BUILD_KEYS, "receipt.payload.build");
  if (!COMMIT_SHA_PATTERN.test(payload.build.commitSha || "")) {
    throw new Error("receipt.payload.build.commitSha must be a lowercase 40- or 64-character commit hash");
  }
  for (const field of BUILD_KEYS.slice(1)) {
    assertSha256(payload.build[field], `receipt.payload.build.${field}`);
  }

  validateExecution(payload.execution, {nowMs});
  validateAcceptance(payload.acceptance);
  validateInvalidation(payload.invalidation, payload);
  validatePrivacy(payload.privacy);
  inspectPublicText(payload, "receipt.payload");

  assertExactKeys(
    assertObject(receipt.signature, "receipt.signature"),
    SIGNATURE_KEYS,
    "receipt.signature",
  );
  if (receipt.signature.algorithm !== "Ed25519") {
    throw new Error("receipt.signature.algorithm must be Ed25519");
  }
  assertLogicalId(receipt.signature.subjectId, "receipt.signature.subjectId");
  assertSha256(receipt.signature.keyFingerprintSha256, "receipt.signature.keyFingerprintSha256");
  assertString(receipt.signature.signatureBase64, "receipt.signature.signatureBase64");

  return {
    receiptId: payload.receiptId,
    releaseId: payload.releaseId,
    expectedMemberCount: payload.acceptance.expectedMemberCount,
    strictCompleteCount: payload.acceptance.strictCompleteCount,
    publishedCount: payload.acceptance.publishedCount,
    issuedAt: payload.issuedAt,
    expiresAt: payload.expiresAt,
    payloadSha256: sha256Canonical(payload),
    receiptSha256: sha256Canonical(receipt),
  };
}

function validateExpectedBindings(expectedBindings, build) {
  const label = "expectedBindings";
  assertExactKeys(assertObject(expectedBindings, label), EVIDENCE_RECEIPT_V1_EXPECTED_BINDING_KEYS, label);
  if (!COMMIT_SHA_PATTERN.test(expectedBindings.commitSha || "")) {
    throw new Error(`${label}.commitSha must be a lowercase 40- or 64-character commit hash`);
  }
  for (const field of EVIDENCE_RECEIPT_V1_EXPECTED_BINDING_KEYS.slice(1)) {
    assertSha256(expectedBindings[field], `${label}.${field}`);
  }
  for (const field of EVIDENCE_RECEIPT_V1_EXPECTED_BINDING_KEYS) {
    if (expectedBindings[field] !== build[field]) {
      throw new Error(`receipt build binding drift: ${field}`);
    }
  }
}

/**
 * Verify cryptographic integrity against a caller-pinned key and fail closed
 * when any current build/release hash differs. The pinned key's authority and
 * revocation status remain the production promotion protocol's responsibility.
 */
export function verifyEvidenceReceiptV1({receipt, publicKeyPem, expectedBindings, now}) {
  const summary = validateEvidenceReceiptV1(receipt, {now});
  validateExpectedBindings(expectedBindings, receipt.payload.build);
  const signer = verifyEd25519DetachedSignature({
    payload: receipt.payload,
    signature: receipt.signature,
    publicKeyPem,
    label: "EvidenceReceiptV1",
  });
  return {...summary, signer};
}

export function evidenceReceiptV1PayloadSha256(receipt) {
  assertExactKeys(assertObject(receipt, "receipt"), RECEIPT_KEYS, "receipt");
  return sha256Canonical(receipt.payload);
}

export function evidenceReceiptV1Sha256(receipt) {
  assertExactKeys(assertObject(receipt, "receipt"), RECEIPT_KEYS, "receipt");
  return sha256Canonical(receipt);
}
