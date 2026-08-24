import assert from 'node:assert/strict';
import test from 'node:test';

import {
  isSyntheticMailpitRecipient,
  resolveFamilyEmailTransport,
} from '../lib/family/family-email-transport';

test('Family email transport is explicit and synthetic delivery cannot fall through to Resend', () => {
  assert.throws(() => resolveFamilyEmailTransport({}), /not configured/u);
  assert.equal(resolveFamilyEmailTransport({
    FAMILY_EMAIL_TRANSPORT: 'resend',
    NODE_ENV: 'production',
  }), 'resend');
  assert.equal(resolveFamilyEmailTransport({
    FAMILY_EMAIL_TRANSPORT: 'mailpit-local',
    FAMILY_INVITATION_RECIPIENT_POLICY: 'synthetic-invalid-only',
    NODE_ENV: 'test',
  }), 'mailpit-local');
  assert.throws(() => resolveFamilyEmailTransport({
    FAMILY_EMAIL_TRANSPORT: 'resend',
    FAMILY_INVITATION_RECIPIENT_POLICY: 'synthetic-invalid-only',
    NODE_ENV: 'test',
  }), /not configured/u);
  assert.throws(() => resolveFamilyEmailTransport({
    FAMILY_EMAIL_TRANSPORT: 'mailpit-local',
    FAMILY_INVITATION_RECIPIENT_POLICY: 'synthetic-invalid-only',
    NODE_ENV: 'production',
  }), /not configured/u);
  assert.throws(() => resolveFamilyEmailTransport({
    FAMILY_EMAIL_TRANSPORT: 'smtp',
    FAMILY_INVITATION_RECIPIENT_POLICY: 'synthetic-invalid-only',
    NODE_ENV: 'test',
  }), /not configured/u);
});

test('Mailpit accepts only a normalized dot-atom address at the reserved domain', () => {
  for (const allowed of [
    'guardian.integration@helpmath.invalid',
    'family+child.one@helpmath.invalid',
  ]) assert.equal(isSyntheticMailpitRecipient(allowed), true, allowed);

  for (const rejected of [
    'guardian@example.com',
    'guardian@sub.helpmath.invalid',
    'Guardian@helpmath.invalid',
    '.guardian@helpmath.invalid',
    'guardian..one@helpmath.invalid',
    'guardian@helpmath.invalid\nBcc:outside@example.com',
    'guardian@helpmath.invalid,other@helpmath.invalid',
    '"guardian"@helpmath.invalid',
    'tutor@helpmath.invalid.example',
  ]) assert.equal(isSyntheticMailpitRecipient(rejected), false, rejected);
});
