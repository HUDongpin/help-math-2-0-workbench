import assert from 'node:assert/strict';
import test from 'node:test';

import {buildAnonymousLearningActor} from '../lib/anonymous-learning-actor.server';
import {G4_L3_LESSON} from '../lib/g4-l3-lesson-navigation';
import {deliverXapiStatement, type LrsFetch} from '../lib/lrs-client.server';
import type {LrsConfig} from '../lib/lrs-config.server';
import {learningEventSchema} from '../lib/learning-event-schema';
import {buildXapiStatement} from '../lib/xapi-statement';

const config: LrsConfig = {
  endpoint: 'https://lrs.example.test/xapi/',
  username: 'test-user',
  password: 'test-password',
  xapiVersion: '1.0.3',
  actorHmacSecret: 'test-only-hmac-secret-that-is-at-least-32-bytes',
  requestTimeoutMs: 1_000,
};
const actor = buildAnonymousLearningActor(
  'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  config.actorHmacSecret,
);
const statement = buildXapiStatement(learningEventSchema.parse({
  schemaVersion: 1,
  eventId: '11111111-1111-4111-8111-111111111111',
  sessionId: '22222222-2222-4222-8222-222222222222',
  sequence: 1,
  occurredAt: '2026-08-14T01:02:03.000Z',
  type: 'lesson.initialized',
  releaseId: G4_L3_LESSON.releaseId,
  locale: 'en',
  presentation: 'modern-wide',
  mode: 'study',
}), actor);

test('xAPI PUT uses the exact statement UUID, Basic auth, version, and requires 204', async () => {
  let calledUrl = '';
  let calledInit: RequestInit | undefined;
  const fakeFetch: LrsFetch = async (input, init) => {
    calledUrl = String(input);
    calledInit = init;
    return new Response(null, {status: 204});
  };
  const result = await deliverXapiStatement(config, statement, fakeFetch);
  assert.deepEqual(result, {
    ok: true,
    disposition: 'stored',
    statementId: statement.id,
  });
  const url = new URL(calledUrl);
  assert.equal(url.pathname, '/xapi/statements');
  assert.equal(url.searchParams.get('statementId'), statement.id);
  assert.equal(calledInit?.method, 'PUT');
  const headers = new Headers(calledInit?.headers);
  assert.equal(headers.get('x-experience-api-version'), '1.0.3');
  assert.equal(
    headers.get('authorization'),
    `Basic ${Buffer.from('test-user:test-password').toString('base64')}`,
  );
  assert.equal((JSON.parse(String(calledInit?.body)) as {id: string}).id, statement.id);
});

test('409 performs a GET and accepts only a canonical match', async () => {
  const calls: string[] = [];
  const stored = {...statement, stored: '2026-08-14T01:02:04.000Z', version: '1.0.3'};
  const matchingFetch: LrsFetch = async (_input, init) => {
    calls.push(init?.method ?? '');
    return calls.length === 1
      ? new Response(null, {status: 409})
      : Response.json(stored);
  };
  assert.deepEqual(await deliverXapiStatement(config, statement, matchingFetch), {
    ok: true,
    disposition: 'already-stored',
    statementId: statement.id,
  });
  assert.deepEqual(calls, ['PUT', 'GET']);

  let count = 0;
  const mismatchingFetch: LrsFetch = async () => {
    count += 1;
    return count === 1
      ? new Response(null, {status: 409})
      : Response.json({...stored, timestamp: '2026-08-14T01:02:09.000Z'});
  };
  assert.deepEqual(await deliverXapiStatement(config, statement, mismatchingFetch), {
    ok: false,
    kind: 'permanent',
    code: 'statement-conflict',
    statementId: statement.id,
  });
});

test('network, 429, and 5xx failures are retryable while 4xx rejection is permanent', async () => {
  const networkFetch: LrsFetch = async () => { throw new Error('secret upstream detail'); };
  assert.deepEqual(await deliverXapiStatement(config, statement, networkFetch), {
    ok: false,
    kind: 'retryable',
    code: 'network-error',
    statementId: statement.id,
  });

  const limited = await deliverXapiStatement(config, statement, async () =>
    new Response('not returned', {status: 429, headers: {'retry-after': '2'}}));
  assert.deepEqual(limited, {
    ok: false,
    kind: 'retryable',
    code: 'rate-limited',
    statementId: statement.id,
    retryAfterMs: 2_000,
  });

  const unavailable = await deliverXapiStatement(config, statement, async () =>
    new Response('not returned', {status: 503}));
  assert.deepEqual(unavailable, {
    ok: false,
    kind: 'retryable',
    code: 'lrs-unavailable',
    statementId: statement.id,
  });

  const rejected = await deliverXapiStatement(config, statement, async () =>
    new Response('not returned', {status: 400}));
  assert.deepEqual(rejected, {
    ok: false,
    kind: 'permanent',
    code: 'lrs-rejected',
    statementId: statement.id,
  });
});
