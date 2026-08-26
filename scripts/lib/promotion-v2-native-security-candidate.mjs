import {
  createHash,
  createPublicKey,
  verify as cryptoVerify,
} from "node:crypto";

export const PROMOTION_V2_NATIVE_SECURITY_PRODUCTION_ENABLED = false;
export const PROMOTION_V2_NATIVE_SECURITY_EXECUTOR_CONNECTED = false;
export const PROMOTION_V2_NATIVE_SECURITY_WRITES_ENABLED = false;
export const PROMOTION_V2_NATIVE_SECURITY_DISABLED_CODE =
  "PROMOTION_V2_NATIVE_SECURITY_DIAGNOSTIC_ONLY";

const PLAN_KEYS = Object.freeze([
  "diagnosticOnly",
  "evidenceType",
  "nonce",
  "operationsSha256",
  "rootIdentity",
  "schemaVersion",
  "transactionId",
]);
const ROOT_IDENTITY_KEYS = Object.freeze(["device", "inode"]);
const SIGNATURE_KEYS = Object.freeze(["algorithm", "signatureBase64"]);
const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const DECIMAL_PATTERN = /^(?:0|[1-9][0-9]{0,19})$/;
const TRANSACTION_ID_PATTERN = /^[a-z0-9][a-z0-9._-]{15,199}$/;
const NONCE_PATTERN = /^[A-Za-z0-9_-]{22,256}$/;
const BASE64_PATTERN = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
const verifiedDiagnosticEnvelopes = new WeakSet();

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function assertPlainObject(value, label) {
  invariant(
    value !== null && typeof value === "object" && !Array.isArray(value) &&
      Object.getPrototypeOf(value) === Object.prototype,
    `${label} must be a plain object`,
  );
}

function assertExactKeys(value, keys, label) {
  assertPlainObject(value, label);
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  invariant(
    actual.length === expected.length && actual.every((key, index) => key === expected[index]),
    `${label} must contain only the exact required fields`,
  );
}

function canonicalJson(value) {
  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return JSON.stringify(value);
  }
  if (typeof value === "number") {
    invariant(Number.isSafeInteger(value), "canonical diagnostic plan numbers must be safe integers");
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  assertPlainObject(value, "canonical diagnostic plan value");
  return `{${Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
    .join(",")}}`;
}

export function promotionV2DiagnosticOperationsSha256(operations) {
  invariant(
    Array.isArray(operations) && operations.length > 0 && operations.length <= 255,
    "diagnostic operations must contain 1 through 255 entries",
  );
  return createHash("sha256")
    .update(Buffer.from(canonicalJson(operations), "utf8"))
    .digest("hex");
}

function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}

function validateDiagnosticPlan(plan) {
  assertExactKeys(plan, PLAN_KEYS, "diagnostic plan");
  invariant(plan.schemaVersion === 1, "diagnostic plan schemaVersion must be 1");
  invariant(plan.diagnosticOnly === true, "diagnostic plan must be diagnostic-only");
  invariant(
    plan.evidenceType === "promotion-v2-native-security-diagnostic-plan",
    "diagnostic plan evidenceType is invalid",
  );
  invariant(
    typeof plan.transactionId === "string" && TRANSACTION_ID_PATTERN.test(plan.transactionId),
    "diagnostic plan transactionId is invalid",
  );
  invariant(
    typeof plan.nonce === "string" && NONCE_PATTERN.test(plan.nonce),
    "diagnostic plan nonce is invalid",
  );
  invariant(
    typeof plan.operationsSha256 === "string" && SHA256_PATTERN.test(plan.operationsSha256),
    "diagnostic plan operationsSha256 is invalid",
  );
  assertExactKeys(plan.rootIdentity, ROOT_IDENTITY_KEYS, "diagnostic plan rootIdentity");
  invariant(
    typeof plan.rootIdentity.device === "string" && DECIMAL_PATTERN.test(plan.rootIdentity.device),
    "diagnostic plan rootIdentity.device is invalid",
  );
  invariant(
    typeof plan.rootIdentity.inode === "string" && DECIMAL_PATTERN.test(plan.rootIdentity.inode),
    "diagnostic plan rootIdentity.inode is invalid",
  );
}

/**
 * Verify an ephemeral diagnostic fixture envelope. This does not establish a
 * production signer, trust root, authorization, or executable identity.
 */
export function verifyPromotionV2DiagnosticPlanEnvelope({plan, signature, publicKeyPem}) {
  validateDiagnosticPlan(plan);
  assertExactKeys(signature, SIGNATURE_KEYS, "diagnostic plan signature");
  invariant(signature.algorithm === "Ed25519", "diagnostic plan signature must use Ed25519");
  invariant(
    typeof signature.signatureBase64 === "string" && BASE64_PATTERN.test(signature.signatureBase64),
    "diagnostic plan signatureBase64 must be canonical base64",
  );
  const signatureBytes = Buffer.from(signature.signatureBase64, "base64");
  invariant(
    signatureBytes.length === 64 && signatureBytes.toString("base64") === signature.signatureBase64,
    "diagnostic plan signatureBase64 must be one canonical 64-byte signature",
  );
  let key;
  try {
    key = createPublicKey(publicKeyPem);
  } catch (error) {
    throw new Error(`diagnostic plan public key is invalid: ${error.message}`);
  }
  invariant(
    key.type === "public" && key.asymmetricKeyType === "ed25519",
    "diagnostic plan public key must be Ed25519",
  );
  const payload = Buffer.from(canonicalJson(plan), "utf8");
  invariant(
    cryptoVerify(null, payload, key, signatureBytes),
    "diagnostic plan Ed25519 signature is invalid",
  );
  const verifiedEnvelope = deepFreeze({
    diagnosticOnly: true,
    plan,
    planSha256: createHash("sha256").update(payload).digest("hex"),
    productionEnabled: false,
    signature: {
      algorithm: signature.algorithm,
      signatureBase64: signature.signatureBase64,
    },
    verified: true,
  });
  verifiedDiagnosticEnvelopes.add(verifiedEnvelope);
  return verifiedEnvelope;
}

export function buildPromotionV2DiagnosticNativeRequest({
  verifiedEnvelope,
  rootPath,
  expectedRoot,
  operations,
  recovery = false,
  crashAfterOrdinal,
}) {
  invariant(
    verifiedDiagnosticEnvelopes.has(verifiedEnvelope) &&
      verifiedEnvelope?.diagnosticOnly === true &&
      verifiedEnvelope.productionEnabled === false &&
      verifiedEnvelope.verified === true,
    "native diagnostic request requires an envelope verified in this process",
  );
  invariant(
    typeof rootPath === "string" && rootPath.startsWith("/"),
    "native diagnostic request rootPath must be absolute",
  );
  assertExactKeys(expectedRoot, ROOT_IDENTITY_KEYS, "native diagnostic expectedRoot");
  invariant(
    expectedRoot.device === verifiedEnvelope.plan.rootIdentity.device &&
      expectedRoot.inode === verifiedEnvelope.plan.rootIdentity.inode,
    "native diagnostic expectedRoot does not match the signed plan",
  );
  invariant(
    promotionV2DiagnosticOperationsSha256(operations) ===
      verifiedEnvelope.plan.operationsSha256,
    "native diagnostic operations do not match the signed plan",
  );
  invariant(typeof recovery === "boolean", "native diagnostic recovery must be boolean");
  invariant(
    crashAfterOrdinal === undefined ||
      (Number.isSafeInteger(crashAfterOrdinal) &&
        crashAfterOrdinal >= 1 &&
        crashAfterOrdinal <= 255),
    "native diagnostic crashAfterOrdinal is invalid",
  );
  return deepFreeze({
    schemaVersion: 1,
    diagnosticOnly: true,
    action: "execute-diagnostic-batch",
    rootPath,
    expectedRoot: {
      device: expectedRoot.device,
      inode: expectedRoot.inode,
    },
    recovery,
    operations,
    plan: verifiedEnvelope.plan,
    signature: verifiedEnvelope.signature,
    ...(crashAfterOrdinal === undefined ? {} : {crashAfterOrdinal}),
  });
}

export function executePromotionV2NativeSecurityCandidate() {
  const error = new Error(
    "Promotion V2 native security remains diagnostic-only and has no production executor",
  );
  error.code = PROMOTION_V2_NATIVE_SECURITY_DISABLED_CODE;
  throw error;
}

export function recoverPromotionV2NativeSecurityCandidate() {
  return executePromotionV2NativeSecurityCandidate();
}
