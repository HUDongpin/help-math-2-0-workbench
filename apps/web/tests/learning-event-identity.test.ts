import assert from 'node:assert/strict';
import test from 'node:test';
import {issueLearningIdentityBinding, buildAnonymousLearningActor} from '../lib/anonymous-learning-actor.server';
import {LEARNING_IDENTITY_HEADER, postLearningEventsWithIdentity, type LearningIdentityBinding} from '../lib/learning-event-identity';
import {learningEventSchema} from '../lib/learning-event-schema';
const secret = 'test-only-hmac-secret-that-is-at-least-32-bytes';
const event = (id: string) => learningEventSchema.parse({schemaVersion: 1, eventId: id, sessionId: '22222222-2222-4222-8222-222222222222', sequence: 0, occurredAt: new Date().toISOString(), type: 'lesson.initialized', releaseId: 'lesson-g04-l03-negative-numbers', locale: 'en', presentation: 'modern-wide', mode: 'study'});
const one = event('11111111-1111-4111-8111-111111111111');
const two = event('33333333-3333-4333-8333-333333333333');
const binding = (seed: string) => issueLearningIdentityBinding(buildAnonymousLearningActor(seed.repeat(43), secret), secret);

test('concurrent bootstrap responses deliver with the transaction winner, not each response cookie', async () => {
  let current: LearningIdentityBinding | undefined;
  const pinned = new Map<string, LearningIdentityBinding>();
  const bind = async (ids: readonly string[], candidate?: LearningIdentityBinding) => {
    current ??= candidate;
    for (const id of ids) if (!pinned.has(id) && current) pinned.set(id, current);
    return new Map(ids.filter(id => pinned.has(id)).map(id => [id, pinned.get(id)!]));
  };
  let bootstraps = 0;
  let release!: () => void;
  const bothStarted = new Promise<void>(resolve => { release = resolve; });
  const delivered: string[] = [];
  const fetchImpl: typeof fetch = async (_url, init) => {
    const token = new Headers(init?.headers).get(LEARNING_IDENTITY_HEADER);
    if (token) { delivered.push(token); return Response.json({ok: true}); }
    const candidate = binding(bootstraps++ === 0 ? 'A' : 'B');
    if (bootstraps === 2) release();
    await bothStarted;
    return Response.json({identity: candidate}, {status: 202});
  };
  await Promise.all([one, two].map(item => postLearningEventsWithIdentity([item], {signal: new AbortController().signal, keepalive: false, bind, fetchImpl})));
  assert.equal(bootstraps, 2);
  assert.equal(delivered.length, 2);
  assert.equal(delivered[0], delivered[1]);
  assert.equal(pinned.get(one.eventId)!.token, delivered[0]);
  assert.equal(pinned.get(two.eventId)!.token, delivered[0]);
});

test('delivery waits for durable binding and never sends events when persistence fails', async () => {
  let requests = 0;
  const fetchImpl: typeof fetch = async () => { requests++; return Response.json({identity: binding('A')}, {status: 202}); };
  await assert.rejects(postLearningEventsWithIdentity([one], {signal: new AbortController().signal, keepalive: false, fetchImpl, bind: async (_ids, candidate) => {
    if (candidate) throw new Error('storage unavailable');
    return new Map();
  }}), /storage unavailable/);
  assert.equal(requests, 1, 'only the write-free bootstrap was attempted');
});

test('an outbox crossing identity rotation sends separately pinned batches', async () => {
  const first = binding('A'), second = binding('B');
  const result = await postLearningEventsWithIdentity([one, two], {
    signal: new AbortController().signal, keepalive: false,
    bind: async () => new Map([[one.eventId, first], [two.eventId, second]]),
    fetchImpl: async (_url, init) => {
      assert.equal(new Headers(init?.headers).get(LEARNING_IDENTITY_HEADER), first.token);
      assert.deepEqual(JSON.parse(String(init?.body)).events.map((item: {eventId: string}) => item.eventId), [one.eventId]);
      return Response.json({ok: true});
    },
  });
  assert.deepEqual(result.eventIds, [one.eventId]);
});
