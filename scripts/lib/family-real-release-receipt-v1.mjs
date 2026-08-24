import {createHash, createPublicKey, verify as verifySignature} from 'node:crypto';
import {lstat, readFile, realpath} from 'node:fs/promises';
import path from 'node:path';

export const FAMILY_REAL_RELEASE_RECEIPT_SCHEMA =
  'help-math-family-real-release-receipt/v1';
export const FAMILY_REAL_RELEASE_TRUST_SCHEMA =
  'help-math-family-real-release-trust-roots/v1';

export const FAMILY_REAL_RELEASE_GATES = Object.freeze([
  'FP-R00',
  'FP-R01',
  'FP-R02',
  'FP-R03',
  'FP-R04',
  'FP-R05',
  'FP-R06',
  'FP-R07',
  'FP-R08',
  'FP-R09',
  'FP-R10',
  'FP-R11',
  'FP-R12',
  'FP-R13',
  'FP-R14',
]);

export const FAMILY_REAL_RELEASE_PRODUCTION_CHECKS = Object.freeze([
  'guardianInviteVerified',
  'guardianAccessVerified',
  'twoWayMessageVerified',
  'notificationEmailVerified',
  'revokeImmediateVerified',
  'crossTenantDenied',
  'crossChildDenied',
  'retentionDeletionVerified',
  'restoreNoResurrectionVerified',
  'rollbackVerified',
]);

const INDEPENDENT_GATES = Object.freeze([
  'FP-R00',
  'FP-R02',
  'FP-R04',
  'FP-R09',
  'FP-R10',
]);
const PRODUCTION_CONFIGURATION_EXTERNAL_GATES = Object.freeze([
  'hosted_supabase_project_verified',
  'resend_domain_and_webhook_verified',
  'independent_security_accepted',
  'independent_accessibility_accepted',
  'privacy_legal_dpa_approved',
  'district_authorized',
  'owner_accepted',
  'deployment_authorized',
  'production_verified',
]);
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;
const SHA256_PATTERN = /^[0-9a-f]{64}$/u;
const GIT_COMMIT_PATTERN = /^[0-9a-f]{40}$/u;
const KEY_ID_PATTERN = /^[A-Za-z0-9._-]{1,64}$/u;
const PROJECT_REF_PATTERN = /^[a-z0-9]{8,32}$/u;
const BOUNDED_ID_PATTERN = /^[A-Za-z0-9._:-]{1,160}$/u;
const MAX_JSON_BYTES = 256 * 1024;
const MAX_EVIDENCE_BYTES = 64 * 1024 * 1024;
const MAX_RECEIPT_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000;

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function exactKeys(value, keys) {
  return isObject(value)
    && JSON.stringify(Object.keys(value).sort()) === JSON.stringify([...keys].sort());
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!isObject(value)) return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [
    key,
    canonicalize(value[key]),
  ]));
}

export function canonicalFamilyReleasePayload(receipt) {
  const payload = {...receipt};
  delete payload.signatures;
  return `${JSON.stringify(canonicalize(payload))}\n`;
}

function safeHttpsOrigin(value, requiredHostSuffix = null) {
  if (typeof value !== 'string' || value.length > 512) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:'
      && url.pathname === '/'
      && !url.search
      && !url.hash
      && !url.username
      && !url.password
      && (!requiredHostSuffix || (
        url.hostname === requiredHostSuffix
        || url.hostname.endsWith(`.${requiredHostSuffix}`)
      ));
  } catch {
    return false;
  }
}

function safeDomain(value) {
  return typeof value === 'string'
    && value.length <= 253
    && /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/u.test(value)
    && (value === 'helpmath.ai' || value.endsWith('.helpmath.ai'));
}

function validRelativeEvidencePath(value) {
  if (typeof value !== 'string' || value.length < 1 || value.length > 512) {
    return false;
  }
  if (value.includes('\\') || value.includes('\0') || path.posix.isAbsolute(value)) {
    return false;
  }
  const normalized = path.posix.normalize(value);
  return normalized === value
    && normalized !== '.'
    && !normalized.startsWith('../')
    && !normalized.split('/').includes('..');
}

function parseInstant(value) {
  if (typeof value !== 'string') return null;
  const milliseconds = Date.parse(value);
  return Number.isFinite(milliseconds) && new Date(milliseconds).toISOString() === value
    ? milliseconds
    : null;
}

function receiptShapeIsValid(receipt) {
  if (!exactKeys(receipt, [
    'artifact',
    'environment',
    'evidence',
    'expiresAt',
    'issuedAt',
    'productionChecks',
    'receiptId',
    'schemaVersion',
    'signatures',
  ])) return false;
  if (receipt.schemaVersion !== FAMILY_REAL_RELEASE_RECEIPT_SCHEMA
    || !UUID_PATTERN.test(receipt.receiptId ?? '')) return false;
  if (!exactKeys(receipt.environment, [
    'resendDomain',
    'siteOrigin',
    'supabaseProjectRef',
    'tenantId',
    'vercelProjectId',
  ])) return false;
  if (!safeHttpsOrigin(receipt.environment.siteOrigin, 'helpmath.ai')
    || !PROJECT_REF_PATTERN.test(receipt.environment.supabaseProjectRef ?? '')
    || !BOUNDED_ID_PATTERN.test(receipt.environment.vercelProjectId ?? '')
    || !safeDomain(receipt.environment.resendDomain)
    || !UUID_PATTERN.test(receipt.environment.tenantId ?? '')) return false;
  if (!exactKeys(receipt.artifact, [
    'deploymentId',
    'gitCommit',
    'migrationManifestSha256',
    'productionConfigurationDisposition',
    'productionConfigurationReportSha256',
  ])) return false;
  if (!GIT_COMMIT_PATTERN.test(receipt.artifact.gitCommit ?? '')
    || !SHA256_PATTERN.test(receipt.artifact.migrationManifestSha256 ?? '')
    || !SHA256_PATTERN.test(receipt.artifact.productionConfigurationReportSha256 ?? '')
    || !BOUNDED_ID_PATTERN.test(receipt.artifact.deploymentId ?? '')
    || receipt.artifact.productionConfigurationDisposition
      !== 'CONFIGURATION_READY_NOT_RELEASE_APPROVED') return false;
  if (!exactKeys(receipt.productionChecks, FAMILY_REAL_RELEASE_PRODUCTION_CHECKS)
    || !FAMILY_REAL_RELEASE_PRODUCTION_CHECKS.every((key) =>
      receipt.productionChecks[key] === true)) return false;
  if (!Array.isArray(receipt.evidence)
    || !Array.isArray(receipt.signatures)
    || receipt.evidence.length !== FAMILY_REAL_RELEASE_GATES.length
    || receipt.signatures.length !== FAMILY_REAL_RELEASE_GATES.length) return false;
  const evidenceGates = new Set();
  const evidencePaths = new Set();
  const evidenceSha256s = new Set();
  for (const entry of receipt.evidence) {
    if (!exactKeys(entry, ['gate', 'path', 'sha256'])
      || !FAMILY_REAL_RELEASE_GATES.includes(entry.gate)
      || evidenceGates.has(entry.gate)
      || evidencePaths.has(entry.path)
      || evidenceSha256s.has(entry.sha256)
      || !validRelativeEvidencePath(entry.path)
      || !SHA256_PATTERN.test(entry.sha256 ?? '')) return false;
    evidenceGates.add(entry.gate);
    evidencePaths.add(entry.path);
    evidenceSha256s.add(entry.sha256);
  }
  const signatureGates = new Set();
  for (const entry of receipt.signatures) {
    if (!exactKeys(entry, ['algorithm', 'gate', 'keyId', 'signature'])
      || entry.algorithm !== 'Ed25519'
      || !FAMILY_REAL_RELEASE_GATES.includes(entry.gate)
      || signatureGates.has(entry.gate)
      || !KEY_ID_PATTERN.test(entry.keyId ?? '')
      || typeof entry.signature !== 'string'
      || entry.signature.length < 80
      || entry.signature.length > 128
      || !/^[A-Za-z0-9_-]+$/u.test(entry.signature)) return false;
    signatureGates.add(entry.gate);
  }
  return FAMILY_REAL_RELEASE_GATES.every((gate) =>
    evidenceGates.has(gate) && signatureGates.has(gate))
    && evidenceSha256s.has(receipt.artifact.migrationManifestSha256)
    && evidenceSha256s.has(receipt.artifact.productionConfigurationReportSha256);
}

function trustRootsShapeIsValid(trustRoots) {
  if (!exactKeys(trustRoots, ['keys', 'schemaVersion'])
    || trustRoots.schemaVersion !== FAMILY_REAL_RELEASE_TRUST_SCHEMA
    || !Array.isArray(trustRoots.keys)
    || trustRoots.keys.length !== FAMILY_REAL_RELEASE_GATES.length) return false;
  const gates = new Set();
  const keyIds = new Set();
  for (const key of trustRoots.keys) {
    if (!exactKeys(key, ['gate', 'keyId', 'publicKeySpki'])
      || !FAMILY_REAL_RELEASE_GATES.includes(key.gate)
      || gates.has(key.gate)
      || !KEY_ID_PATTERN.test(key.keyId ?? '')
      || keyIds.has(key.keyId)
      || typeof key.publicKeySpki !== 'string'
      || key.publicKeySpki.length < 40
      || key.publicKeySpki.length > 256
      || !/^[A-Za-z0-9_-]+$/u.test(key.publicKeySpki)) return false;
    gates.add(key.gate);
    keyIds.add(key.keyId);
  }
  return FAMILY_REAL_RELEASE_GATES.every((gate) => gates.has(gate));
}

function productionConfigurationReportIsValid(value, receipt) {
  if (!exactKeys(value, [
    'checkedAt',
    'checks',
    'configurationReady',
    'disposition',
    'externalGates',
    'productionReleaseBindingCount',
    'releaseApproved',
    'secretValuesIncluded',
  ])) return false;
  const checkedAt = parseInstant(value.checkedAt);
  const issuedAt = parseInstant(receipt.issuedAt);
  if (checkedAt === null || issuedAt === null
    || checkedAt > issuedAt
    || issuedAt - checkedAt > 24 * 60 * 60 * 1000
    || value.configurationReady !== true
    || value.disposition !== 'CONFIGURATION_READY_NOT_RELEASE_APPROVED'
    || value.releaseApproved !== false
    || value.secretValuesIncluded !== false
    || !Number.isSafeInteger(value.productionReleaseBindingCount)
    || value.productionReleaseBindingCount < 0
    || !Array.isArray(value.externalGates)
    || JSON.stringify(value.externalGates)
      !== JSON.stringify(PRODUCTION_CONFIGURATION_EXTERNAL_GATES)
    || !Array.isArray(value.checks)
    || value.checks.length < 1) return false;
  const ids = new Set();
  for (const check of value.checks) {
    if (!exactKeys(check, ['id', 'passed', 'requirement'])
      || !BOUNDED_ID_PATTERN.test(check.id ?? '')
      || check.passed !== true
      || typeof check.requirement !== 'string'
      || check.requirement.length < 1
      || check.requirement.length > 1_024
      || ids.has(check.id)) return false;
    ids.add(check.id);
  }
  return true;
}

async function validateEvidenceFiles(receipt, evidenceRoot) {
  const root = await realpath(evidenceRoot);
  const rootStats = await lstat(root);
  if (!rootStats.isDirectory()) return false;
  const prefix = `${root}${path.sep}`;
  let productionConfigurationReportValid = false;
  for (const entry of receipt.evidence) {
    const candidate = path.resolve(root, entry.path);
    if (!candidate.startsWith(prefix)) return false;
    const stats = await lstat(candidate);
    if (!stats.isFile() || stats.isSymbolicLink() || stats.size > MAX_EVIDENCE_BYTES) {
      return false;
    }
    const resolved = await realpath(candidate);
    if (!resolved.startsWith(prefix)) return false;
    const bytes = await readFile(resolved);
    const digest = createHash('sha256').update(bytes).digest('hex');
    if (digest !== entry.sha256) return false;
    if (digest === receipt.artifact.productionConfigurationReportSha256) {
      try {
        productionConfigurationReportValid = productionConfigurationReportIsValid(
          parseBoundedJson(bytes.toString('utf8')),
          receipt,
        );
      } catch {
        productionConfigurationReportValid = false;
      }
    }
  }
  return {filesValid: true, productionConfigurationReportValid};
}

function signaturesAreValid(receipt, trustRoots) {
  const payload = Buffer.from(canonicalFamilyReleasePayload(receipt), 'utf8');
  const rootsByGate = new Map(trustRoots.keys.map((key) => [key.gate, key]));
  const signaturesByGate = new Map(receipt.signatures.map((entry) => [
    entry.gate,
    entry,
  ]));
  const independentFingerprints = new Set();
  try {
    for (const gate of FAMILY_REAL_RELEASE_GATES) {
      const root = rootsByGate.get(gate);
      const signature = signaturesByGate.get(gate);
      if (!root || !signature || signature.keyId !== root.keyId) return false;
      const der = Buffer.from(root.publicKeySpki, 'base64url');
      if (INDEPENDENT_GATES.includes(gate)) {
        const fingerprint = createHash('sha256').update(der).digest('hex');
        if (independentFingerprints.has(fingerprint)) return false;
        independentFingerprints.add(fingerprint);
      }
      const publicKey = createPublicKey({key: der, format: 'der', type: 'spki'});
      if (!verifySignature(
        null,
        payload,
        publicKey,
        Buffer.from(signature.signature, 'base64url'),
      )) return false;
    }
    return true;
  } catch {
    return false;
  }
}

export async function verifyFamilyRealReleaseReceipt({
  evidenceRoot,
  expectedGitCommit,
  expectedTrustRootsSha256,
  now = new Date(),
  receipt,
  trustRoots,
  trustRootsFileSha256,
  worktreeClean,
}) {
  const checks = [];
  const add = (id, passed, requirement) => checks.push({id, passed, requirement});
  const receiptShape = receiptShapeIsValid(receipt);
  const trustShape = trustRootsShapeIsValid(trustRoots);
  add('receipt-shape', receiptShape,
    'The release receipt must use the exact bounded v1 schema with all fifteen FP-R00 through FP-R14 gates.');
  add('trust-roots-shape', trustShape,
    'Externally controlled trust roots must provide one bounded Ed25519 key binding for every gate.');
  add('trust-roots-byte-binding', Boolean(
    SHA256_PATTERN.test(expectedTrustRootsSha256 ?? '')
    && trustRootsFileSha256 === expectedTrustRootsSha256,
  ), 'The exact trust-root file bytes must match the SHA-256 injected by the independently controlled release environment.');
  const issuedAt = receiptShape ? parseInstant(receipt.issuedAt) : null;
  const expiresAt = receiptShape ? parseInstant(receipt.expiresAt) : null;
  const nowMs = now.getTime();
  add('receipt-time-window', Boolean(
    issuedAt !== null
    && expiresAt !== null
    && issuedAt <= nowMs + 5 * 60 * 1000
    && expiresAt > nowMs
    && expiresAt > issuedAt
    && expiresAt - issuedAt <= MAX_RECEIPT_LIFETIME_MS,
  ), 'The receipt must be current, not future-issued and expire within 30 days.');
  add('exact-clean-artifact', Boolean(
    receiptShape
    && worktreeClean === true
    && GIT_COMMIT_PATTERN.test(expectedGitCommit ?? '')
    && receipt.artifact.gitCommit === expectedGitCommit,
  ), 'The receipt must bind the exact clean Git commit being verified.');
  let evidenceValid = false;
  let productionConfigurationReportValid = false;
  if (receiptShape) {
    try {
      const evidenceResult = await validateEvidenceFiles(receipt, evidenceRoot);
      evidenceValid = evidenceResult.filesValid;
      productionConfigurationReportValid =
        evidenceResult.productionConfigurationReportValid;
    } catch {
      evidenceValid = false;
      productionConfigurationReportValid = false;
    }
  }
  add('evidence-files', evidenceValid,
    'Every external approval and production-verification evidence file must be regular, root-contained and SHA-256 bound.');
  add('production-configuration-report', productionConfigurationReportValid,
    'The bound production-configuration evidence must be a strict, fully passing, secret-redacted report generated no more than 24 hours before receipt issuance.');
  add('independent-signatures', Boolean(
    receiptShape && trustShape && signaturesAreValid(receipt, trustRoots),
  ), 'All fifteen gates must carry valid trusted Ed25519 signatures, with distinct independent reviewers for Owner scope, legal basis, district, security and accessibility.');
  const valid = checks.every((check) => check.passed);
  return {
    checks,
    disposition: valid
      ? 'REAL_FAMILY_RELEASE_RECEIPT_VALID'
      : 'REAL_FAMILY_RELEASE_RECEIPT_INVALID',
    releaseReceiptValid: valid,
    secretValuesIncluded: false,
  };
}

export function parseBoundedJson(text) {
  if (typeof text !== 'string' || Buffer.byteLength(text) > MAX_JSON_BYTES) {
    throw new Error('bounded JSON required');
  }
  const value = JSON.parse(text);
  if (!isObject(value)) throw new Error('JSON object required');
  return value;
}
