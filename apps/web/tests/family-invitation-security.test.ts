import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

function runServerOnlyModuleScript(script: string) {
  const result = spawnSync(process.execPath, [
    '--conditions=react-server',
    '--import',
    'tsx',
    '--input-type=module',
    '--eval',
    script,
  ], {
    cwd: new URL('..', import.meta.url),
    encoding: 'utf8',
    env: {...process.env, NODE_ENV: 'test'},
    timeout: 20_000,
  });
  assert.equal(result.status, 0, [result.stdout, result.stderr].join('\n'));
}

test('v2 family ciphertext is purpose, tenant, record, and key-id bound', () => {
  runServerOnlyModuleScript(String.raw`
    import assert from 'node:assert/strict';
    import {
      createCipheriv,
      randomBytes,
    } from 'node:crypto';
    import {
      decryptFamilyEmailFromStorage,
      decryptInvitationTokenFromOutbox,
      encryptFamilyEmailForStorage,
      encryptInvitationTokenForOutbox,
    } from './lib/family/invitation-secret.server.ts';

    const tenantA = '10000000-0000-4000-8000-000000000001';
    const tenantB = '20000000-0000-4000-8000-000000000001';
    const invitationA = '10000000-0000-4000-8000-000000000701';
    const invitationB = '10000000-0000-4000-8000-000000000702';
    const digestA = 'a'.repeat(64);
    const digestB = 'b'.repeat(64);
    const oldKey = Buffer.alloc(32, 17).toString('base64url');
    const newKey = Buffer.alloc(32, 29).toString('base64url');
    process.env.FAMILY_OUTBOX_ENCRYPTION_ACTIVE_KEY_ID = 'old_key';
    process.env.FAMILY_OUTBOX_ENCRYPTION_KEYRING = JSON.stringify({
      old_key: oldKey,
    });

    const tokenCiphertext = encryptInvitationTokenForOutbox('opaque-token', {
      invitationId: invitationA,
      tenantId: tenantA,
    });
    const emailCiphertext = encryptFamilyEmailForStorage('FAMILY@EXAMPLE.ORG', {
      recipientEmailDigest: digestA,
      tenantId: tenantA,
    });
    assert.match(tokenCiphertext, /^v2\.old_key\./u);
    assert.equal(decryptInvitationTokenFromOutbox(tokenCiphertext, {
      invitationId: invitationA,
      tenantId: tenantA,
    }), 'opaque-token');
    assert.equal(decryptFamilyEmailFromStorage(emailCiphertext, {
      recipientEmailDigest: digestA,
      tenantId: tenantA,
    }), 'family@example.org');

    for (const context of [
      {invitationId: invitationB, tenantId: tenantA},
      {invitationId: invitationA, tenantId: tenantB},
    ]) assert.throws(() => decryptInvitationTokenFromOutbox(
      tokenCiphertext, context,
    ));
    for (const context of [
      {recipientEmailDigest: digestB, tenantId: tenantA},
      {recipientEmailDigest: digestA, tenantId: tenantB},
    ]) assert.throws(() => decryptFamilyEmailFromStorage(
      emailCiphertext, context,
    ));
    assert.throws(() => decryptFamilyEmailFromStorage(tokenCiphertext, {
      recipientEmailDigest: digestA,
      tenantId: tenantA,
    }));

    process.env.FAMILY_OUTBOX_ENCRYPTION_ACTIVE_KEY_ID = 'new_key';
    process.env.FAMILY_OUTBOX_ENCRYPTION_KEYRING = JSON.stringify({
      new_key: newKey,
      old_key: oldKey,
    });
    assert.equal(decryptInvitationTokenFromOutbox(tokenCiphertext, {
      invitationId: invitationA,
      tenantId: tenantA,
    }), 'opaque-token');
    assert.match(encryptInvitationTokenForOutbox('rotated-token', {
      invitationId: invitationA,
      tenantId: tenantA,
    }), /^v2\.new_key\./u);
    process.env.FAMILY_OUTBOX_ENCRYPTION_KEYRING = JSON.stringify({
      new_key: newKey,
    });
    assert.throws(() => decryptInvitationTokenFromOutbox(tokenCiphertext, {
      invitationId: invitationA,
      tenantId: tenantA,
    }));

    const legacyKey = randomBytes(32);
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', legacyKey, iv);
    const encrypted = Buffer.concat([
      cipher.update('legacy-token', 'utf8'), cipher.final(),
    ]);
    const legacyCiphertext = [
      'v1', iv.toString('base64url'), encrypted.toString('base64url'),
      cipher.getAuthTag().toString('base64url'),
    ].join('.');
    process.env.FAMILY_OUTBOX_LEGACY_V1_READ_KEY =
      legacyKey.toString('base64url');
    process.env.FAMILY_OUTBOX_LEGACY_V1_READ_ENABLED = 'false';
    assert.throws(() => decryptInvitationTokenFromOutbox(
      legacyCiphertext, {tenantId: tenantA},
    ));
    process.env.FAMILY_OUTBOX_LEGACY_V1_READ_ENABLED = 'true';
    assert.equal(decryptInvitationTokenFromOutbox(
      legacyCiphertext, {tenantId: tenantA},
    ), 'legacy-token');
  `);
});

test('invitation issuer uses only a bounded custom-role bearer and one-use attestation', () => {
  runServerOnlyModuleScript(String.raw`
    import assert from 'node:assert/strict';
    import {
      isFamilyInvitationIssuerConfigurationReady,
      issueGuardianInvitation,
      reissueGuardianInvitation,
    } from './lib/family/invitation-issuer.server.ts';

    const encode = (value) => Buffer.from(JSON.stringify(value))
      .toString('base64url');
    const now = Math.floor(Date.now() / 1000);
    const token = [
      encode({alg: 'ES256', kid: 'synthetic-key-id', typ: 'JWT'}),
      encode({
        aud: 'authenticated',
        exp: now + 120,
        family_purpose: 'family_invitation_issue_v1',
        iat: now,
        iss: 'urn:help-math:synthetic:invitation-issuer',
        jti: '10000000-0000-4000-8000-000000000099',
        nbf: now - 1,
        role: 'family_invitation_issuer',
        sub: 'family_invitation_issuer',
      }),
      'synthetic-signature-never-used-outside-this-mock',
    ].join('.');
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://127.0.0.1:54321';
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'synthetic-publishable';
    process.env.FAMILY_INVITATION_ISSUER_JWT = token;
    process.env.FAMILY_INVITATION_ISSUER_JWT_ISSUER =
      'urn:help-math:synthetic:invitation-issuer';
    process.env.FAMILY_INVITATION_ISSUER_JWT_AUDIENCE = 'authenticated';
    assert.equal(isFamilyInvitationIssuerConfigurationReady(), true);
    for (const allowedUrl of [
      'https://example.supabase.co',
      'http://localhost:54321',
      'http://[::1]:54321',
    ]) {
      process.env.NEXT_PUBLIC_SUPABASE_URL = allowedUrl;
      assert.equal(isFamilyInvitationIssuerConfigurationReady(), true);
    }
    for (const rejectedUrl of [
      'http://supabase.example.test',
      'http://127.0.0.2:54321',
      'https://user@example.supabase.co',
      'https://example.supabase.co/rest',
      'https://example.supabase.co?redirect=attacker',
      'https://example.supabase.co#attacker',
    ]) {
      process.env.NEXT_PUBLIC_SUPABASE_URL = rejectedUrl;
      assert.equal(isFamilyInvitationIssuerConfigurationReady(), false);
    }
    process.env.NODE_ENV = 'production';
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://127.0.0.1:54321';
    assert.equal(isFamilyInvitationIssuerConfigurationReady(), false);
    process.env.NODE_ENV = 'test';
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://127.0.0.1:54321';

    const requests = [];
    globalThis.fetch = async (url, init) => {
      requests.push({url: String(url), init});
      return new Response(JSON.stringify({
        expires_at: '2026-08-30T00:00:00.000Z',
        invitation_id: '10000000-0000-4000-8000-000000000701',
      }), {status: 200, headers: {'Content-Type': 'application/json'}});
    };
    const common = {
      attestationId: '10000000-0000-4000-8000-000000000799',
      encryptedOutboxToken: 'v2.key_1.AAAAAAAAAAAAAAAA.ciphertext.AAAAAAAAAAAAAAAAAAAAAA',
      expiresAt: '2026-08-30T00:00:00.000Z',
      idempotencyKey: 'test.invitation.issue.001',
      invitationId: '10000000-0000-4000-8000-000000000701',
      tokenDigest: 'f'.repeat(64),
    };
    const receipt = await issueGuardianInvitation({
      ...common,
      emailCiphertext: 'v2.key_1.AAAAAAAAAAAAAAAA.emailcipher.AAAAAAAAAAAAAAAAAAAAAA',
      emailDigest: 'e'.repeat(64),
      studentId: '10000000-0000-4000-8000-000000000020',
    });
    assert.equal(receipt.invitationId, common.invitationId);
    await reissueGuardianInvitation({...common,
      idempotencyKey: 'test.invitation.resend.001',
    });
    assert.equal(requests.length, 2);
    for (const request of requests) {
      assert.equal(request.init.headers.Authorization, 'Bearer ' + token);
      assert.equal(request.init.headers.apikey, 'synthetic-publishable');
      const body = JSON.parse(request.init.body);
      assert.equal(body.p_attestation_id, common.attestationId);
      assert.equal('p_actor_id' in body, false);
      assert.equal('p_tenant_id' in body, false);
    }

    process.env.FAMILY_INVITATION_ISSUER_JWT = [
      encode({alg: 'ES256', kid: 'synthetic-key-id', typ: 'JWT'}),
      encode({
        aud: 'authenticated', exp: now - 1,
        family_purpose: 'family_invitation_issue_v1', iat: now - 120,
        iss: 'urn:help-math:synthetic:invitation-issuer',
        jti: '10000000-0000-4000-8000-000000000098', nbf: now - 120,
        role: 'family_invitation_issuer', sub: 'family_invitation_issuer',
      }),
      'expired-signature',
    ].join('.');
    assert.equal(isFamilyInvitationIssuerConfigurationReady(), false);
    await assert.rejects(() => reissueGuardianInvitation({...common,
      idempotencyKey: 'test.invitation.resend.002',
    }));
    assert.equal(requests.length, 2);
  `);
});

test('webhook writer sends credentials only to HTTPS or non-production loopback', () => {
  runServerOnlyModuleScript(String.raw`
    import assert from 'node:assert/strict';
    import {recordResendDeliveryEvent} from
      './lib/family/resend-webhook-writer.server.ts';

    const encode = (value) => Buffer.from(JSON.stringify(value))
      .toString('base64url');
    const now = Math.floor(Date.now() / 1000);
    process.env.FAMILY_WEBHOOK_WRITER_JWT = [
      encode({alg: 'ES256', typ: 'JWT'}),
      encode({
        aud: 'authenticated', exp: now + 120,
        iss: 'urn:help-math:synthetic:webhook-writer',
        role: 'family_webhook_writer',
      }),
      'synthetic-signature-never-used-outside-this-mock',
    ].join('.');
    process.env.FAMILY_WEBHOOK_WRITER_JWT_ISSUER =
      'urn:help-math:synthetic:webhook-writer';
    process.env.FAMILY_WEBHOOK_WRITER_JWT_AUDIENCE = 'authenticated';
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'synthetic-publishable';
    const requests = [];
    globalThis.fetch = async (url, init) => {
      requests.push({url: String(url), init});
      return new Response(null, {status: 204});
    };
    const input = {
      eventId: 'evt_test_001',
      eventType: 'delivered',
      occurredAt: '2026-08-23T00:00:00.000Z',
      providerEmailId: 'email_test_001',
    };

    for (const allowedUrl of [
      'https://example.supabase.co',
      'http://localhost:54321',
      'http://[::1]:54321',
    ]) {
      process.env.NEXT_PUBLIC_SUPABASE_URL = allowedUrl;
      await recordResendDeliveryEvent(input);
    }
    assert.equal(requests.length, 3);
    for (const request of requests) {
      assert.match(request.url,
        /\/rest\/v1\/rpc\/record_family_email_delivery_event_v1$/u);
      assert.match(request.init.headers.Authorization, /^Bearer /u);
    }

    for (const rejectedUrl of [
      'http://supabase.example.test',
      'http://127.0.0.2:54321',
      'https://user@example.supabase.co',
      'https://example.supabase.co/rest',
      'https://example.supabase.co?redirect=attacker',
      'https://example.supabase.co#attacker',
    ]) {
      process.env.NEXT_PUBLIC_SUPABASE_URL = rejectedUrl;
      await assert.rejects(() => recordResendDeliveryEvent(input),
        /not configured/u);
    }
    process.env.NODE_ENV = 'production';
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://127.0.0.1:54321';
    await assert.rejects(() => recordResendDeliveryEvent(input),
      /not configured/u);
    assert.equal(requests.length, 3);
  `);
});

test('recipient policy separates loopback synthetic and school-verified production recipients', () => {
  runServerOnlyModuleScript(String.raw`
    import assert from 'node:assert/strict';
    import {
      isAllowedFamilyInvitationRecipient,
      isFamilyInvitationRecipientPolicyEnabled,
      readFamilyInvitationRecipientPolicy,
    } from './lib/family/invitation-recipient-policy.server.ts';

    delete process.env.FAMILY_INVITATION_RECIPIENT_POLICY;
    assert.equal(readFamilyInvitationRecipientPolicy(), 'disabled');
    assert.equal(isFamilyInvitationRecipientPolicyEnabled('synthetic'), false);
    assert.equal(isAllowedFamilyInvitationRecipient(
      'guardian@helpmath.invalid',
    ), false);

    process.env.FAMILY_INVITATION_RECIPIENT_POLICY =
      'synthetic-invalid-only';
    process.env.NODE_ENV = 'test';
    assert.equal(isFamilyInvitationRecipientPolicyEnabled('synthetic'), true);
    for (const email of [
      'guardian@helpmath.invalid',
      '  FAMILY.ONE+TEST@HELP MATH.INVALID  '.replace('HELP MATH', 'HELPMATH'),
    ]) assert.equal(isAllowedFamilyInvitationRecipient(
      email, 'synthetic', process.env,
    ), true);
    for (const email of [
      'guardian@example.invalid',
      'guardian@sub.helpmath.invalid',
      'guardian@helpmath.invalid.example.org',
      '.guardian@helpmath.invalid',
      'guardian..two@helpmath.invalid',
      'guardian\r\n@helpmath.invalid',
      'guardian@helpmath.invalid\u0000',
    ]) assert.equal(isAllowedFamilyInvitationRecipient(
      email, 'synthetic', process.env,
    ), false, email);

    process.env.NODE_ENV = 'production';
    assert.equal(isFamilyInvitationRecipientPolicyEnabled('synthetic'), false);
    assert.equal(isAllowedFamilyInvitationRecipient(
      'guardian@helpmath.invalid', 'synthetic', process.env,
    ), false);

    process.env.FAMILY_INVITATION_RECIPIENT_POLICY =
      'school-verified-production';
    delete process.env.FAMILY_PRODUCTION_INVITATIONS_ENABLED;
    assert.equal(isFamilyInvitationRecipientPolicyEnabled('production'), false);
    process.env.FAMILY_PRODUCTION_INVITATIONS_ENABLED = 'true';
    assert.equal(readFamilyInvitationRecipientPolicy(),
      'school-verified-production');
    assert.equal(isFamilyInvitationRecipientPolicyEnabled('production'), true);
    for (const email of [
      'guardian@districtfamilies.org',
      '  FAMILY.ONE+CHILD@PARENTS.SCHOOL.US  ',
    ]) assert.equal(isAllowedFamilyInvitationRecipient(
      email, 'production', process.env,
    ), true, email);
    for (const email of [
      'guardian@helpmath.invalid',
      'guardian@example.com',
      'guardian@sub.example',
      'guardian@family.test',
      'guardian@localhost',
      'guardian@127.0.0.1',
      'guardian@singlelabel',
      'guardian..two@districtfamilies.org',
      '"guardian"@districtfamilies.org',
      'guardian\r\n@districtfamilies.org',
    ]) assert.equal(isAllowedFamilyInvitationRecipient(
      email, 'production', process.env,
    ), false, email);
    assert.equal(isAllowedFamilyInvitationRecipient(
      'guardian@districtfamilies.org', 'synthetic', process.env,
    ), false);

    process.env.NODE_ENV = 'test';
    process.env.FAMILY_INVITATION_RECIPIENT_POLICY = 'unexpected';
    assert.equal(readFamilyInvitationRecipientPolicy(), 'disabled');
  `);
});

test('ordinary request code contains neither issuer signing keys nor service-role fallback', async () => {
  const [actionSource, issuerSource, secretSource] = await Promise.all([
    readFile(new URL('../lib/family/actions.ts', import.meta.url), 'utf8'),
    readFile(
      new URL('../lib/family/invitation-issuer.server.ts', import.meta.url),
      'utf8',
    ),
    readFile(
      new URL('../lib/family/invitation-secret.server.ts', import.meta.url),
      'utf8',
    ),
  ]);
  assert.match(actionSource, /authorize_guardian_invitation_creation_v1/u);
  assert.match(actionSource, /authorize_guardian_invitation_resend_v1/u);
  assert.match(actionSource, /isAllowedFamilyInvitationRecipient/u);
  assert.match(actionSource, /isFamilyInvitationRecipientPolicyEnabled/u);
  assert.match(issuerSource, /role:\s*z\.literal\(ISSUER_ROLE\)/u);
  assert.match(issuerSource, /family_purpose:\s*z\.literal\(ISSUER_PURPOSE\)/u);
  assert.match(issuerSource, /FAMILY_INVITATION_ISSUER_JWT/u);
  assert.doesNotMatch(
    `${actionSource}\n${issuerSource}`,
    /SUPABASE_SERVICE_ROLE_KEY|createFamilyServiceClient|PRIVATE_JWK|JWT_SECRET/u,
  );
  assert.match(secretSource, /hkdfSync/u);
  assert.match(secretSource, /setAAD/u);
  assert.match(secretSource, /FAMILY_OUTBOX_ENCRYPTION_KEYRING/u);
  assert.doesNotMatch(secretSource, /function encryptFamilyOutboxSecret/u);
});
