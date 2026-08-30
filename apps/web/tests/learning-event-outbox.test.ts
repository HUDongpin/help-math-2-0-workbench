import assert from 'node:assert/strict';
import test from 'node:test';

import {G4_L3_LESSON} from '../lib/g4-l3-lesson-navigation';
import {
  LEARNING_EVENT_OUTBOX_RETENTION_MS,
  LEARNING_EVENT_OUTBOX_STORAGE_KEY,
  acknowledgeLearningEvents,
  applyLearningEventDeliveryOutcomes,
  enqueueLearningEvent,
  installLearningEventOnlineRetry,
  parseLearningEventOutbox,
  queueLearningEvent,
  readyLearningEvents,
  type LearningEventStorage,
} from '../lib/learning-event-outbox';
import {learningEventSchema} from '../lib/learning-event-schema';

const now = Date.parse('2026-08-14T01:02:03.000Z');

function event(id = '11111111-1111-4111-8111-111111111111') {
  return learningEventSchema.parse({
    schemaVersion: 1,
    eventId: id,
    sessionId: '22222222-2222-4222-8222-222222222222',
    sequence: 1,
    occurredAt: '2026-08-14T01:02:03.000Z',
    type: 'lesson.initialized',
    releaseId: G4_L3_LESSON.releaseId,
    locale: 'en',
    presentation: 'modern-wide',
    mode: 'study',
  });
}

class MemoryStorage implements LearningEventStorage {
  readonly values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
}

test('outbox deduplicates UUIDs, acknowledges delivery, and persists only valid events', () => {
  const first = enqueueLearningEvent([], event(), now);
  const duplicate = enqueueLearningEvent(first, event(), now + 1);
  assert.equal(duplicate, first);
  assert.equal(readyLearningEvents(duplicate, now).length, 1);
  assert.deepEqual(acknowledgeLearningEvents(duplicate, new Set([event().eventId])), []);

  const storage = new MemoryStorage();
  queueLearningEvent(storage, event(), now);
  const stored = storage.getItem(LEARNING_EVENT_OUTBOX_STORAGE_KEY);
  assert.equal(parseLearningEventOutbox(stored, now).length, 1);
});

test('outbox drops expired, malformed, duplicate, and privacy-invalid records', () => {
  const valid = {
    event: event(),
    createdAtMs: now,
    attempts: 0,
    nextAttemptAtMs: now,
  };
  const raw = JSON.stringify({
    version: 1,
    records: [
      {...valid, createdAtMs: now - LEARNING_EVENT_OUTBOX_RETENTION_MS - 1},
      valid,
      valid,
      {...valid, event: {...valid.event, prompt: 'must never persist'}},
      {...valid, attempts: -1},
    ],
  });
  const parsed = parseLearningEventOutbox(raw, now);
  assert.equal(parsed.length, 1);
  assert.equal(parsed[0]!.event.eventId, valid.event.eventId);
});

test('retry outcomes back off, while stored and permanent outcomes leave the outbox', () => {
  const secondId = '33333333-3333-4333-8333-333333333333';
  const thirdId = '44444444-4444-4444-8444-444444444444';
  let records = enqueueLearningEvent([], event(), now);
  records = enqueueLearningEvent(records, event(secondId), now);
  records = enqueueLearningEvent(records, event(thirdId), now);
  const settled = applyLearningEventDeliveryOutcomes(records, [
    {eventId: event().eventId, status: 'stored'},
    {eventId: secondId, status: 'retryable', retryAfterMs: 10_000},
    {eventId: thirdId, status: 'rejected'},
  ], now, () => 0);
  assert.equal(settled.length, 1);
  assert.equal(settled[0]!.event.eventId, secondId);
  assert.equal(settled[0]!.attempts, 1);
  assert.equal(settled[0]!.nextAttemptAtMs, now + 10_000);
});

test('online retry hook flushes once and can be removed cleanly', async () => {
  let listener: (() => void) | undefined;
  let flushes = 0;
  const target = {
    addEventListener(_type: 'online', next: () => void) { listener = next; },
    removeEventListener(_type: 'online', next: () => void) {
      if (listener === next) listener = undefined;
    },
  };
  const remove = installLearningEventOnlineRetry(target, () => { flushes += 1; });
  listener?.();
  await Promise.resolve();
  assert.equal(flushes, 1);
  remove();
  assert.equal(listener, undefined);
});
