import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import {promisify} from 'node:util';

import {
  FAMILY_PRODUCTION_EXTERNAL_GATES,
  inspectFamilyProductionConfiguration,
  type FamilyProductionConfigurationEnvironment,
} from '../lib/family/production-readiness';

const now = new Date('2026-08-24T12:00:00.000Z');
const execFileAsync = promisify(execFile);

function encodedJson(value: Readonly<Record<string, unknown>>) {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function roleJwt(
  role: 'family_invitation_issuer' | 'family_webhook_writer',
  issuedAt = now,
) {
  const nowSeconds = Math.floor(issuedAt.getTime() / 1_000);
  return [
    encodedJson({alg: 'ES256', kid: `${role}-k1`, typ: 'JWT'}),
    encodedJson({
      aud: 'authenticated',
      exp: nowSeconds + 120,
      ...(role === 'family_invitation_issuer'
        ? {
          family_purpose: 'family_invitation_issue_v1',
          jti: '10000000-0000-4000-8000-000000000001',
        }
        : {}),
      iat: nowSeconds,
      iss: 'https://project.supabase.co/auth/v1',
      nbf: nowSeconds - 1,
      role,
      sub: role,
    }),
    'synthetic-signature-shape-only',
  ].join('.');
}

function key(byte: number) {
  return Buffer.alloc(32, byte).toString('base64url');
}

const readyEnvironment: FamilyProductionConfigurationEnvironment = {
  CRON_SECRET: 'cron-secret-with-at-least-thirty-two-characters',
  FAMILY_AUTH_PROVIDER: 'supabase',
  FAMILY_EMAIL_DIGEST_KEY: key(3),
  FAMILY_EMAIL_NOTIFICATIONS_ENABLED: 'true',
  FAMILY_EMAIL_TRANSPORT: 'resend',
  FAMILY_FROM_EMAIL: 'HELP Math Family <family@helpmath.ai>',
  FAMILY_INVITATION_ISSUER_JWT: roleJwt('family_invitation_issuer'),
  FAMILY_INVITATION_ISSUER_JWT_AUDIENCE: 'authenticated',
  FAMILY_INVITATION_ISSUER_JWT_ISSUER:
    'https://project.supabase.co/auth/v1',
  FAMILY_INVITATION_RECIPIENT_POLICY: 'school-verified-production',
  FAMILY_LEARNING_EVENTS_V2_ENABLED: 'false',
  FAMILY_MESSAGING_ENABLED: 'true',
  FAMILY_OUTBOX_ENCRYPTION_ACTIVE_KEY_ID: 'k2026_08',
  FAMILY_OUTBOX_ENCRYPTION_KEYRING: JSON.stringify({
    k2026_07: key(1),
    k2026_08: key(2),
  }),
  FAMILY_OUTBOX_LEGACY_V1_READ_ENABLED: 'false',
  FAMILY_PORTAL_ENABLED: 'true',
  FAMILY_PRODUCTION_INVITATIONS_ENABLED: 'true',
  FAMILY_SUPABASE_AUTH_AUDIENCE: 'authenticated',
  FAMILY_SUPABASE_AUTH_CUTOVER_ENABLED: 'true',
  FAMILY_SUPABASE_AUTH_ISSUER: 'https://project.supabase.co/auth/v1',
  FAMILY_SYNTHETIC_DEMO_ENABLED: 'false',
  FAMILY_WEBHOOK_WRITER_JWT: roleJwt('family_webhook_writer'),
  FAMILY_WEBHOOK_WRITER_JWT_AUDIENCE: 'authenticated',
  FAMILY_WEBHOOK_WRITER_JWT_ISSUER:
    'https://project.supabase.co/auth/v1',
  NEXT_PUBLIC_SITE_URL: 'https://www.helpmath.ai',
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_production_shape',
  NEXT_PUBLIC_SUPABASE_URL: 'https://project.supabase.co',
  NODE_ENV: 'production',
  RESEND_API_KEY: 're_production_shape_not_a_real_key',
  RESEND_WEBHOOK_SECRET: 'whsec_production_shape_not_real',
  SUPABASE_SERVICE_ROLE_KEY: 'sb_secret_cron_only_production_shape',
};

test('production configuration report is redacted and never self-approves release', () => {
  const report = inspectFamilyProductionConfiguration(readyEnvironment, {
    now,
    productionReleaseBindingCount: 0,
  });
  assert.equal(report.configurationReady, true);
  assert.equal(report.disposition,
    'CONFIGURATION_READY_NOT_RELEASE_APPROVED');
  assert.equal(report.releaseApproved, false);
  assert.equal(report.secretValuesIncluded, false);
  assert.deepEqual(report.externalGates, FAMILY_PRODUCTION_EXTERNAL_GATES);
  const serialized = JSON.stringify(report);
  for (const secretName of [
    'FAMILY_INVITATION_ISSUER_JWT',
    'FAMILY_OUTBOX_ENCRYPTION_KEYRING',
    'FAMILY_EMAIL_DIGEST_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'RESEND_API_KEY',
    'CRON_SECRET',
  ]) {
    assert.doesNotMatch(serialized, new RegExp(
      readyEnvironment[secretName]!.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&'),
      'u',
    ));
  }
});

test('missing, synthetic, stale, aliased, or release-drifted configuration fails closed', () => {
  const empty = inspectFamilyProductionConfiguration({}, {
    now,
    productionReleaseBindingCount: 0,
  });
  assert.equal(empty.configurationReady, false);
  assert.equal(empty.checks.every((check) => !check.passed), true);

  for (const override of [
    {FAMILY_SYNTHETIC_DEMO_ENABLED: 'true'},
    {FAMILY_AUTH_PROVIDER: 'clerk-development'},
    {FAMILY_INVITATION_RECIPIENT_POLICY: 'synthetic-invalid-only'},
    {FAMILY_EMAIL_TRANSPORT: 'mailpit-local'},
    {FAMILY_OUTBOX_LEGACY_V1_READ_ENABLED: 'true'},
    {FAMILY_EMAIL_DIGEST_KEY: key(2)},
    {SUPABASE_SERVICE_ROLE_KEY: readyEnvironment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY},
    {CRON_SECRET: readyEnvironment.RESEND_WEBHOOK_SECRET},
    {FAMILY_INVITATION_ISSUER_JWT: readyEnvironment.FAMILY_WEBHOOK_WRITER_JWT},
  ]) {
    const report = inspectFamilyProductionConfiguration({
      ...readyEnvironment,
      ...override,
    }, {now, productionReleaseBindingCount: 0});
    assert.equal(report.configurationReady, false, JSON.stringify(override));
  }

  const eventDrift = inspectFamilyProductionConfiguration(readyEnvironment, {
    now,
    productionReleaseBindingCount: 1,
  });
  assert.equal(eventDrift.configurationReady, false);
});

test('role tokens require a fresh exact ES256 production shape', () => {
  const payload = JSON.parse(Buffer.from(
    readyEnvironment.FAMILY_WEBHOOK_WRITER_JWT!.split('.')[1],
    'base64url',
  ).toString('utf8')) as Record<string, unknown>;
  const stale = [
    encodedJson({alg: 'ES256', kid: 'writer-k1', typ: 'JWT'}),
    encodedJson({...payload, exp: Math.floor(now.getTime() / 1_000) - 1}),
    'synthetic-signature-shape-only',
  ].join('.');
  const wrongAlgorithm = [
    encodedJson({alg: 'HS256', kid: 'writer-k1', typ: 'JWT'}),
    readyEnvironment.FAMILY_WEBHOOK_WRITER_JWT!.split('.')[1],
    'synthetic-signature-shape-only',
  ].join('.');
  for (const token of [stale, wrongAlgorithm]) {
    const report = inspectFamilyProductionConfiguration({
      ...readyEnvironment,
      FAMILY_WEBHOOK_WRITER_JWT: token,
    }, {now, productionReleaseBindingCount: 0});
    assert.equal(report.configurationReady, false);
    assert.equal(report.checks.find((check) =>
      check.id === 'webhook-writer-jwt')?.passed, false);
  }
});

test('production preflight source and opt-in Vercel cron remain non-authoritative', async () => {
  const [script, vercel] = await Promise.all([
    readFile(new URL(
      '../../../scripts/check-family-production-configuration.mts',
      import.meta.url,
    ), 'utf8'),
    readFile(new URL('../../../vercel.family-portal.json', import.meta.url),
      'utf8'),
  ]);
  assert.match(script, /CONFIGURATION_READY_NOT_RELEASE_APPROVED/u);
  assert.match(script, /secretValuesIncluded/u);
  assert.doesNotMatch(script, /console\.log\(process\.env/u);
  const config = JSON.parse(vercel) as {
    crons: Array<{path: string; schedule: string}>;
  };
  assert.deepEqual(config.crons, [{
    path: '/api/cron/family-notifications',
    schedule: '*/5 * * * *',
  }]);
});

test('production preflight CLI emits only a redacted candidate disposition', async () => {
  const root = new URL('../../..', import.meta.url);
  const cliEnvironment: FamilyProductionConfigurationEnvironment = {
    ...readyEnvironment,
    FAMILY_INVITATION_ISSUER_JWT: roleJwt(
      'family_invitation_issuer',
      new Date(),
    ),
    FAMILY_WEBHOOK_WRITER_JWT: roleJwt(
      'family_webhook_writer',
      new Date(),
    ),
  };
  const {stdout, stderr} = await execFileAsync(process.execPath, [
    '--import',
    'tsx',
    'scripts/check-family-production-configuration.mts',
  ], {
    cwd: root,
    env: {...process.env, ...cliEnvironment},
    maxBuffer: 128 * 1_024,
  });
  assert.equal(stderr, '');
  const report = JSON.parse(stdout) as {
    configurationReady: boolean;
    disposition: string;
    releaseApproved: boolean;
    secretValuesIncluded: boolean;
  };
  assert.equal(report.configurationReady, true);
  assert.equal(report.disposition,
    'CONFIGURATION_READY_NOT_RELEASE_APPROVED');
  assert.equal(report.releaseApproved, false);
  assert.equal(report.secretValuesIncluded, false);
  for (const secretName of [
    'FAMILY_INVITATION_ISSUER_JWT',
    'FAMILY_OUTBOX_ENCRYPTION_KEYRING',
    'FAMILY_EMAIL_DIGEST_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'RESEND_API_KEY',
    'CRON_SECRET',
  ]) {
    assert.equal(stdout.includes(cliEnvironment[secretName]!), false);
  }
});
