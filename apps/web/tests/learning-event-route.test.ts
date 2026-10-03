import assert from 'node:assert/strict';
import test, {afterEach} from 'node:test';

import {buildAnonymousLearningActor, issueLearningIdentityBinding} from '../lib/anonymous-learning-actor.server';
import {LEARNING_IDENTITY_HEADER} from '../lib/learning-event-identity';
import {POST} from '../app/api/learning-events/route';
import {learningEventDeliveryOutcomes} from '../hooks/use-learning-event-recorder';
import {applyLearningEventDeliveryOutcomes, enqueueLearningEvent} from '../lib/learning-event-outbox';
import {learningEventSchema} from '../lib/learning-event-schema';
import {isSameOriginLearningEventRequest} from '../lib/learning-event-route-support.server';
import {resetRequestBudgetsForTests} from '../lib/request-budget.server';

const originalFetch = globalThis.fetch;
const envKeys = [
  'LRS_ENABLED',
  'LRS_ENDPOINT',
  'LRS_USERNAME',
  'LRS_PASSWORD',
  'LRS_ACTOR_HMAC_SECRET',
  'LRS_RATE_LIMIT_PER_MINUTE',
] as const;
const originalEnv = Object.fromEntries(envKeys.map((key) => [key, process.env[key]]));

afterEach(() => {
  globalThis.fetch = originalFetch;
  resetRequestBudgetsForTests();
  for (const key of envKeys) {
    const value = originalEnv[key];
    if (value === undefined) Reflect.deleteProperty(process.env, key);
    else Reflect.set(process.env, key, value);
  }
});

function request(url: string, origin?: string, additionalHeaders: Record<string, string> = {}) {
  return new Request(url, {
    method: 'POST',
    headers: {...(origin ? {origin} : {}), ...additionalHeaders},
  });
}

function configureLrs() {
  process.env.LRS_ENABLED = 'true';
  process.env.LRS_ENDPOINT = 'https://lrs.example.test/xapi/';
  process.env.LRS_USERNAME = 'test-user';
  process.env.LRS_PASSWORD = 'test-password';
  process.env.LRS_ACTOR_HMAC_SECRET =
    'test-only-hmac-secret-that-is-at-least-32-bytes';
}

function validBatch() {
  return {
    schemaVersion: 1,
    events: [{
      schemaVersion: 1,
      eventId: '019ffc6d-2bcb-7941-9d74-ff128b4a2371',
      sessionId: '019ffc6d-2bcb-7941-9d74-ff128b4a2372',
      sequence: 0,
      occurredAt: '2026-08-14T04:00:00.000Z',
      type: 'lesson.initialized',
      releaseId: 'lesson-g04-l03-negative-numbers',
      locale: 'en',
      presentation: 'modern-wide',
      mode: 'study',
      progress: {completedPages: 0, percent: 0},
    }],
  };
}

function learningEventRequest(
  headers: Record<string, string> = {},
) {
  return new Request('https://www.helpmath.ai/api/learning-events', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      origin: 'https://www.helpmath.ai',
      'sec-fetch-site': 'same-origin',
      [LEARNING_IDENTITY_HEADER]: issueLearningIdentityBinding(
        buildAnonymousLearningActor('AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', 'test-only-hmac-secret-that-is-at-least-32-bytes'),
        'test-only-hmac-secret-that-is-at-least-32-bytes',
      ).token,
      ...headers,
    },
    body: JSON.stringify(validBatch()),
  });
}

test('learning-event route allows HTTPS same-origin and exact loopback HTTP', () => {
  assert.equal(isSameOriginLearningEventRequest(request(
    'https://www.helpmath.ai/api/learning-events',
    'https://www.helpmath.ai',
  )), true);
  assert.equal(isSameOriginLearningEventRequest(request(
    'http://localhost:3100/api/learning-events',
    'http://localhost:3100',
  )), true);
  assert.equal(isSameOriginLearningEventRequest(request(
    'http://127.0.0.1:3100/api/learning-events',
    'http://127.0.0.1:3100',
  )), true);
  assert.equal(isSameOriginLearningEventRequest(request(
    'http://localhost:3211/api/learning-events',
    'http://127.0.0.1:3211',
    {host: '127.0.0.1:3211'},
  )), true);
  assert.equal(isSameOriginLearningEventRequest(request(
    'http://internal:3000/api/learning-events',
    'https://www.helpmath.ai',
    {
      host: 'internal:3000',
      'x-forwarded-host': 'www.helpmath.ai',
      'x-forwarded-proto': 'https',
    },
  )), true);
});

test('learning-event route rejects missing, cross-origin, and public HTTP origins', () => {
  assert.equal(isSameOriginLearningEventRequest(request(
    'https://www.helpmath.ai/api/learning-events',
  )), false);
  assert.equal(isSameOriginLearningEventRequest(request(
    'https://www.helpmath.ai/api/learning-events',
    'https://attacker.example',
  )), false);
  assert.equal(isSameOriginLearningEventRequest(request(
    'http://www.helpmath.ai/api/learning-events',
    'http://www.helpmath.ai',
  )), false);
  assert.equal(isSameOriginLearningEventRequest(request(
    'http://localhost:3211/api/learning-events',
    'http://127.0.0.1:3212',
    {host: '127.0.0.1:3211'},
  )), false);
  assert.equal(isSameOriginLearningEventRequest(request(
    'http://internal:3000/api/learning-events',
    'https://www.helpmath.ai',
    {
      'x-forwarded-host': 'www.helpmath.ai',
      'x-forwarded-proto': 'http',
    },
  )), false);
});

test('learning-event POST rejects missing Origin before LRS delivery', async () => {
  configureLrs();
  let deliveryCalls = 0;
  globalThis.fetch = async () => {
    deliveryCalls += 1;
    return new Response(null, {status: 204});
  };

  const response = await POST(learningEventRequest({origin: ''}));
  assert.equal(response.status, 403);
  assert.equal(deliveryCalls, 0);
});

test('learning-event POST enforces its IP budget before another LRS delivery', async () => {
  configureLrs();
  process.env.LRS_RATE_LIMIT_PER_MINUTE = '1';
  let deliveryCalls = 0;
  globalThis.fetch = async () => {
    deliveryCalls += 1;
    return new Response(null, {status: 204});
  };
  const headers = {'x-vercel-forwarded-for': '203.0.113.44'};

  const first = await POST(learningEventRequest(headers));
  assert.equal(first.status, 200);
  assert.equal(deliveryCalls, 1);

  const limited = await POST(learningEventRequest(headers));
  const body = await limited.json();
  assert.equal(limited.status, 429);
  assert.equal(body.error.code, 'RATE_LIMITED');
  assert.match(limited.headers.get('retry-after') ?? '', /^\d+$/u);
  assert.equal(deliveryCalls, 1);
});


test('a lost bootstrap response cannot commit an actor; lost delivery acknowledgements retry idempotently', async () => {
  configureLrs();
  const stored = new Map<string, unknown>();
  let puts = 0;
  globalThis.fetch = async (_url, init) => {
    if (init?.method === 'GET') return Response.json(stored.get(validBatch().events[0]!.eventId));
    puts++;
    const statement = JSON.parse(String(init?.body));
    if (stored.has(statement.id)) return new Response(null, {status: 409});
    stored.set(statement.id, statement);
    return new Response(null, {status: 204});
  };
  const first = await POST(learningEventRequest({[LEARNING_IDENTITY_HEADER]: ''}));
  assert.equal(first.status, 202);
  assert.equal(puts, 0, 'lost initial response must leave the LRS untouched');
  const second = await POST(learningEventRequest({[LEARNING_IDENTITY_HEADER]: ''}));
  const {identity} = await second.json();
  assert.equal(puts, 0);
  const delivery = await POST(learningEventRequest({[LEARNING_IDENTITY_HEADER]: identity.token}));
  assert.equal(delivery.status, 200);
  // Simulate both a lost acknowledgement and a late different bootstrap cookie.
  const retry = await POST(learningEventRequest({
    [LEARNING_IDENTITY_HEADER]: identity.token,
    cookie: first.headers.get('set-cookie')!.split(';')[0]!,
  }));
  assert.equal(retry.status, 200);
  const value = await retry.json();
  assert.equal(value.results[0].status, 'already-stored');
  const event = learningEventSchema.parse(validBatch().events[0]);
  assert.equal(applyLearningEventDeliveryOutcomes(
    enqueueLearningEvent([], event, Date.now()),
    learningEventDeliveryOutcomes([event.eventId], retry.status, value), Date.now(),
  ).length, 0);
  assert.equal(stored.size, 1);
});

test('forged actor bindings never reach the LRS or permanently discard queued events', async () => {
  configureLrs();
  let calls = 0;
  globalThis.fetch = async () => { calls++; throw new Error('must not call upstream'); };
  const response = await POST(learningEventRequest({[LEARNING_IDENTITY_HEADER]: 'v1.forged'}));
  assert.equal(response.status, 503);
  assert.equal(calls, 0);
  const event = learningEventSchema.parse(validBatch().events[0]);
  const outcomes = learningEventDeliveryOutcomes([event.eventId], response.status, await response.json());
  assert.equal(outcomes[0]!.status, 'retryable');
  assert.equal(applyLearningEventDeliveryOutcomes(enqueueLearningEvent([], event, Date.now()), outcomes, Date.now()).length, 1);
});
