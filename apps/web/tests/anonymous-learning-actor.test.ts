import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ANONYMOUS_LEARNING_ACTOR_COOKIE,
  buildAnonymousLearningActor,
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
