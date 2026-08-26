import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {
  createHelpMathLearningEvent,
  learningEventDeliveryOutcomes,
} from '../hooks/use-learning-event-recorder';
import {G4_L3_LESSON} from '../lib/g4-l3-lesson-navigation';

test('client recorder builds only the fixed privacy-closed G4 L3 event', () => {
  const event = createHelpMathLearningEvent({
    locale: 'en',
    mode: 'focus',
    presentation: 'modern-wide',
  }, {
    type: 'support.used',
    page: {animationId: G4_L3_LESSON.pages[0]!.animationId},
    progress: {completedPages: 0, percent: 0},
    support: {kind: 'nova-tutor', action: 'opened'},
  }, {
    eventId: '11111111-1111-4111-8111-111111111111',
    sessionId: '22222222-2222-4222-8222-222222222222',
    sequence: 0,
    occurredAt: '2026-08-14T01:02:03.000Z',
  });

  assert.equal(event.releaseId, 'lesson-g04-l03-negative-numbers');
  assert.equal(event.support?.kind, 'nova-tutor');
  assert.equal(JSON.stringify(event).includes('prompt'), false);
  assert.equal(JSON.stringify(event).includes('actor'), false);
});

test('delivery reconciliation covers every queued event and fails closed', () => {
  const first = '11111111-1111-4111-8111-111111111111';
  const second = '22222222-2222-4222-8222-222222222222';
  assert.deepEqual(learningEventDeliveryOutcomes([first, second], 207, {
    results: [{eventId: first, status: 'stored'}],
  }), [
    {eventId: first, status: 'stored'},
    {eventId: second, status: 'retryable'},
  ]);
  assert.deepEqual(learningEventDeliveryOutcomes([first], 503, null), [
    {eventId: first, status: 'retryable'},
  ]);
});

test('the recorder never labels permanently rejected delivery as synced', async () => {
  const source = await readFile(
    new URL('../hooks/use-learning-event-recorder.ts', import.meta.url),
    'utf8',
  );
  assert.match(source, /const rejected = outcomes\.some/);
  assert.match(source, /if \(rejected\)[\s\S]*?setStatus\('error'\)/);
});
