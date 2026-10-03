import {LEARNING_IDENTITY_LIFETIME_MS, LEARNING_IDENTITY_RETRY_RETENTION_MS} from '../lib/learning-event-identity';
import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ANONYMOUS_LEARNING_ACTOR_COOKIE,
  buildAnonymousLearningActor,
  issueLearningIdentityBinding,
  verifyLearningIdentityBinding,
  resolveAnonymousLearningActor,
} from '../lib/anonymous-learning-actor.server';

const seed = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
const secret = 'test-only-hmac-secret-that-is-at-least-32-bytes';

test('anonymous actor is stable, opaque, and contains no mbox or human name', () => {
  const first = buildAnonymousLearningActor(seed, secret);
  const second = buildAnonymousLearningActor(seed, secret);
  assert.deepEqual(first, second);
  assert.equal(first.objectType, 'Agent');
  assert.equal(first.account.homePage, 'https://www.helpmath.ai');
  assert.match(first.account.name, /^anonymous-[A-Za-z0-9_-]{43}$/);
  assert.equal(JSON.stringify(first).includes(seed), false);
  assert.equal('mbox' in first, false);
  assert.equal('name' in first, false);
});

test('new seeds are carried only by an HttpOnly SameSite cookie', () => {
  const resolved = resolveAnonymousLearningActor({
    cookieHeader: null,
    hmacSecret: secret,
    secureCookie: true,
    createSeed: () => seed,
  });
  assert.match(resolved.setCookieHeader!, new RegExp(`^${ANONYMOUS_LEARNING_ACTOR_COOKIE}=`));
  assert.match(resolved.setCookieHeader!, /; HttpOnly;/);
  assert.match(resolved.setCookieHeader!, /; SameSite=Strict;/);
  assert.match(resolved.setCookieHeader!, /; Secure$/);

  const existing = resolveAnonymousLearningActor({
    cookieHeader: `another=value; ${ANONYMOUS_LEARNING_ACTOR_COOKIE}=${seed}`,
    hmacSecret: secret,
    secureCookie: true,
  });
  assert.equal(existing.setCookieHeader, null);
  assert.deepEqual(existing.actor, resolved.actor);
});

test('short actor secrets and malformed seeds fail closed', () => {
  assert.throws(() => buildAnonymousLearningActor(seed, 'too-short'));
  assert.throws(() => buildAnonymousLearningActor('bad seed', secret));
});


test('signed delivery bindings preserve the cookie actor without exposing its seed', () => {
  const now = Date.parse('2026-10-03T00:00:00Z');
  const actor = buildAnonymousLearningActor(seed, secret);
  const binding = issueLearningIdentityBinding(actor, secret, now);
  assert.equal(binding.expiresAt, now + LEARNING_IDENTITY_LIFETIME_MS);
  assert.equal(binding.token.includes(seed), false);
  assert.deepEqual(verifyLearningIdentityBinding(binding.token, secret, [new Date(now).toISOString()], now), actor);
  for (const invalid of [binding.token + 'x', binding.token.replace('v1.', 'v2.'), binding.token.replace(/.$/, binding.token.endsWith('A') ? 'B' : 'A')]) {
    assert.equal(verifyLearningIdentityBinding(invalid, secret, [], now), null);
  }
  assert.equal(verifyLearningIdentityBinding(binding.token, secret + 'wrong', [], now), null);
});

test('identity rotation retains old queued events only within their retry retention window', () => {
  const now = Date.parse('2026-10-03T00:00:00Z');
  const actor = buildAnonymousLearningActor(seed, secret);
  const binding = issueLearningIdentityBinding(actor, secret, now);
  const oldEvent = new Date(binding.expiresAt - 1).toISOString();
  assert.deepEqual(verifyLearningIdentityBinding(binding.token, secret, [oldEvent], binding.expiresAt + 1000), actor);
  assert.equal(verifyLearningIdentityBinding(binding.token, secret, [new Date(binding.expiresAt + 1).toISOString()], binding.expiresAt + 1000), null);
  assert.equal(verifyLearningIdentityBinding(binding.token, secret, [oldEvent], binding.expiresAt + LEARNING_IDENTITY_RETRY_RETENTION_MS + 1), null);
});
