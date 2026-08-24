import assert from 'node:assert/strict';
import {createHash, generateKeyPairSync, sign} from 'node:crypto';
import {mkdtemp, mkdir, rm, symlink, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  canonicalFamilyReleasePayload,
  FAMILY_REAL_RELEASE_GATES,
  FAMILY_REAL_RELEASE_PRODUCTION_CHECKS,
  FAMILY_REAL_RELEASE_RECEIPT_SCHEMA,
  FAMILY_REAL_RELEASE_TRUST_SCHEMA,
  verifyFamilyRealReleaseReceipt,
} from './lib/family-real-release-receipt-v1.mjs';

const now = new Date('2026-08-24T12:00:00.000Z');
const commit = 'a'.repeat(40);

function resign(value) {
  value.receipt.signatures = [];
  const payload = Buffer.from(
    canonicalFamilyReleasePayload(value.receipt),
    'utf8',
  );
  value.receipt.signatures = value.keys.map(({gate, keyId, pair}) => ({
    algorithm: 'Ed25519',
    gate,
    keyId,
    signature: sign(null, payload, pair.privateKey).toString('base64url'),
  }));
}

async function fixture(t) {
  const root = await mkdtemp(path.join(tmpdir(), 'hm-family-release-'));
  t.after(async () => rm(root, {recursive: true, force: true}));
  const evidenceRoot = path.join(root, 'evidence');
  await mkdir(evidenceRoot, {mode: 0o700});
  const evidence = [];
  for (const [index, gate] of FAMILY_REAL_RELEASE_GATES.entries()) {
    const relative = `${gate}.txt`;
    const value = index === 1
      ? `${JSON.stringify({
        checkedAt: '2026-08-24T11:00:00.000Z',
        checks: [{
          id: 'synthetic-ready-shape-fixture',
          passed: true,
          requirement: 'A deterministic test fixture, not a real approval.',
        }],
        configurationReady: true,
        disposition: 'CONFIGURATION_READY_NOT_RELEASE_APPROVED',
        externalGates: [
          'hosted_supabase_project_verified',
          'resend_domain_and_webhook_verified',
          'independent_security_accepted',
          'independent_accessibility_accepted',
          'privacy_legal_dpa_approved',
          'district_authorized',
          'owner_accepted',
          'deployment_authorized',
          'production_verified',
        ],
        productionReleaseBindingCount: 0,
        releaseApproved: false,
        secretValuesIncluded: false,
      })}\n`
      : `synthetic external evidence fixture ${index}\n`;
    await writeFile(path.join(evidenceRoot, relative), value, {mode: 0o600});
    evidence.push({
      gate,
      path: relative,
      sha256: createHash('sha256').update(value).digest('hex'),
    });
  }
  const keys = FAMILY_REAL_RELEASE_GATES.map((gate, index) => {
    const pair = generateKeyPairSync('ed25519');
    return {
      gate,
      keyId: `reviewer-${index + 1}`,
      pair,
      publicKeySpki: pair.publicKey.export({format: 'der', type: 'spki'})
        .toString('base64url'),
    };
  });
  const receipt = {
    artifact: {
      deploymentId: 'dpl_family_release_001',
      gitCommit: commit,
      migrationManifestSha256: evidence[0].sha256,
      productionConfigurationDisposition:
        'CONFIGURATION_READY_NOT_RELEASE_APPROVED',
      productionConfigurationReportSha256: evidence[1].sha256,
    },
    environment: {
      resendDomain: 'family.helpmath.ai',
      siteOrigin: 'https://www.helpmath.ai',
      supabaseProjectRef: 'abcdefghijklmno',
      tenantId: '10000000-0000-4000-8000-000000000001',
      vercelProjectId: 'prj_family_portal_production',
    },
    evidence,
    expiresAt: '2026-09-07T12:00:00.000Z',
    issuedAt: now.toISOString(),
    productionChecks: Object.fromEntries(
      FAMILY_REAL_RELEASE_PRODUCTION_CHECKS.map((key) => [key, true]),
    ),
    receiptId: '20000000-0000-4000-8000-000000000002',
    schemaVersion: FAMILY_REAL_RELEASE_RECEIPT_SCHEMA,
    signatures: [],
  };
  const trustRoots = {
    keys: keys.map(({gate, keyId, publicKeySpki}) => ({
      gate,
      keyId,
      publicKeySpki,
    })),
    schemaVersion: FAMILY_REAL_RELEASE_TRUST_SCHEMA,
  };
  const trustRootsFileSha256 = createHash('sha256')
    .update(JSON.stringify(trustRoots))
    .digest('hex');
  const value = {
    evidenceRoot,
    expectedTrustRootsSha256: trustRootsFileSha256,
    keys,
    receipt,
    trustRoots,
    trustRootsFileSha256,
  };
  resign(value);
  return value;
}

test('a current clean hash-bound receipt with all fifteen trusted gates verifies', async (t) => {
  const value = await fixture(t);
  const report = await verifyFamilyRealReleaseReceipt({
    ...value,
    expectedGitCommit: commit,
    now,
    worktreeClean: true,
  });
  assert.equal(report.releaseReceiptValid, true);
  assert.equal(report.disposition, 'REAL_FAMILY_RELEASE_RECEIPT_VALID');
  assert.equal(report.secretValuesIncluded, false);
  assert.equal(report.checks.every((check) => check.passed), true);
});

test('dirty or mismatched artifacts and expired receipts fail closed', async (t) => {
  const value = await fixture(t);
  for (const override of [
    {expectedGitCommit: 'd'.repeat(40), worktreeClean: true},
    {expectedGitCommit: commit, worktreeClean: false},
    {expectedGitCommit: commit, now: new Date('2026-09-08T00:00:00.000Z'), worktreeClean: true},
  ]) {
    const report = await verifyFamilyRealReleaseReceipt({...value, now, ...override});
    assert.equal(report.releaseReceiptValid, false);
  }
});

test('tampered evidence and tampered signed meaning fail closed', async (t) => {
  const value = await fixture(t);
  await writeFile(
    path.join(value.evidenceRoot, value.receipt.evidence[0].path),
    'tampered\n',
  );
  let report = await verifyFamilyRealReleaseReceipt({
    ...value,
    expectedGitCommit: commit,
    now,
    worktreeClean: true,
  });
  assert.equal(report.releaseReceiptValid, false);
  const clean = await fixture(t);
  clean.receipt.productionChecks.crossTenantDenied = false;
  report = await verifyFamilyRealReleaseReceipt({
    ...clean,
    expectedGitCommit: commit,
    now,
    worktreeClean: true,
  });
  assert.equal(report.releaseReceiptValid, false);
});

test('unknown receipt fields and evidence links or path escape fail closed', async (t) => {
  const unknown = await fixture(t);
  unknown.receipt.clientAuthority = 'forbidden';
  let report = await verifyFamilyRealReleaseReceipt({
    ...unknown,
    expectedGitCommit: commit,
    now,
    worktreeClean: true,
  });
  assert.equal(report.releaseReceiptValid, false);

  const linked = await fixture(t);
  const first = linked.receipt.evidence[0];
  await rm(path.join(linked.evidenceRoot, first.path));
  await symlink('/dev/null', path.join(linked.evidenceRoot, first.path));
  report = await verifyFamilyRealReleaseReceipt({
    ...linked,
    expectedGitCommit: commit,
    now,
    worktreeClean: true,
  });
  assert.equal(report.releaseReceiptValid, false);

  const escaped = await fixture(t);
  escaped.receipt.evidence[0].path = '../outside.txt';
  report = await verifyFamilyRealReleaseReceipt({
    ...escaped,
    expectedGitCommit: commit,
    now,
    worktreeClean: true,
  });
  assert.equal(report.releaseReceiptValid, false);
});

test('critical independent gates cannot reuse one reviewer key', async (t) => {
  const value = await fixture(t);
  const security = value.trustRoots.keys.find((entry) =>
    entry.gate === 'FP-R09');
  const accessibility = value.trustRoots.keys.find((entry) =>
    entry.gate === 'FP-R10');
  accessibility.publicKeySpki = security.publicKeySpki;
  const securityKey = value.keys.find((entry) => entry.gate === 'FP-R09');
  const accessibilitySignature = value.receipt.signatures.find((entry) =>
    entry.gate === 'FP-R10');
  accessibilitySignature.signature = sign(
    null,
    Buffer.from(canonicalFamilyReleasePayload(value.receipt), 'utf8'),
    securityKey.pair.privateKey,
  ).toString('base64url');
  value.expectedTrustRootsSha256 = createHash('sha256')
    .update(JSON.stringify(value.trustRoots))
    .digest('hex');
  value.trustRootsFileSha256 = value.expectedTrustRootsSha256;
  const report = await verifyFamilyRealReleaseReceipt({
    ...value,
    expectedGitCommit: commit,
    now,
    worktreeClean: true,
  });
  assert.equal(report.releaseReceiptValid, false);
  assert.equal(report.checks.find((check) =>
    check.id === 'independent-signatures')?.passed, false);
});

test('caller-selected trust roots and unbound artifact digests fail closed', async (t) => {
  const value = await fixture(t);
  let report = await verifyFamilyRealReleaseReceipt({
    ...value,
    expectedGitCommit: commit,
    expectedTrustRootsSha256: 'f'.repeat(64),
    now,
    worktreeClean: true,
  });
  assert.equal(report.releaseReceiptValid, false);
  assert.equal(report.checks.find((check) =>
    check.id === 'trust-roots-byte-binding')?.passed, false);

  const unbound = await fixture(t);
  unbound.receipt.artifact.migrationManifestSha256 = 'e'.repeat(64);
  report = await verifyFamilyRealReleaseReceipt({
    ...unbound,
    expectedGitCommit: commit,
    now,
    worktreeClean: true,
  });
  assert.equal(report.releaseReceiptValid, false);
  assert.equal(report.checks.find((check) =>
    check.id === 'receipt-shape')?.passed, false);
});

test('a freshly hashed and signed configuration report with a failed check is rejected', async (t) => {
  const value = await fixture(t);
  const entry = value.receipt.evidence[1];
  const failedReport = `${JSON.stringify({
    checkedAt: '2026-08-24T11:00:00.000Z',
    checks: [{
      id: 'hosted-provider-check',
      passed: false,
      requirement: 'This intentionally failed fixture must not authorize release.',
    }],
    configurationReady: false,
    disposition: 'CONFIGURATION_NOT_READY',
    externalGates: [
      'hosted_supabase_project_verified',
      'resend_domain_and_webhook_verified',
      'independent_security_accepted',
      'independent_accessibility_accepted',
      'privacy_legal_dpa_approved',
      'district_authorized',
      'owner_accepted',
      'deployment_authorized',
      'production_verified',
    ],
    productionReleaseBindingCount: 0,
    releaseApproved: false,
    secretValuesIncluded: false,
  })}\n`;
  await writeFile(path.join(value.evidenceRoot, entry.path), failedReport);
  entry.sha256 = createHash('sha256').update(failedReport).digest('hex');
  value.receipt.artifact.productionConfigurationReportSha256 = entry.sha256;
  resign(value);
  const report = await verifyFamilyRealReleaseReceipt({
    ...value,
    expectedGitCommit: commit,
    now,
    worktreeClean: true,
  });
  assert.equal(report.releaseReceiptValid, false);
  assert.equal(report.checks.find((check) =>
    check.id === 'production-configuration-report')?.passed, false);
});
