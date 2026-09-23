import assert from 'node:assert/strict';
import test from 'node:test';

import {G4_L3_LESSON} from '../lib/g4-l3-lesson-navigation';
import {
  MAX_LEARNING_EVENT_BATCH_SIZE,
  findProhibitedLearningEventField,
  learningEventBatchSchema,
  learningEventSchema,
} from '../lib/learning-event-schema';

function validEvent(overrides: Record<string, unknown> = {}) {
  return {
    schemaVersion: 1,
    eventId: '11111111-1111-4111-8111-111111111111',
    sessionId: '22222222-2222-4222-8222-222222222222',
    sequence: 1,
    occurredAt: '2026-08-14T01:02:03.000Z',
    type: 'page.viewed',
    releaseId: G4_L3_LESSON.releaseId,
    locale: 'en',
    presentation: 'modern-wide',
    mode: 'study',
    page: {animationId: G4_L3_LESSON.pages[0]!.animationId},
    progress: {completedPages: 0, percent: 0},
    ...overrides,
  };
}

test('learning events accept only the fixed Grade 4 Lesson 3 contract', () => {
  const parsed = learningEventSchema.parse(validEvent());
  assert.equal(parsed.releaseId, 'lesson-g04-l03-negative-numbers');
  assert.equal(parsed.page?.animationId, G4_L3_LESSON.pages[0]!.animationId);

  assert.equal(learningEventSchema.safeParse(validEvent({
    eventId: 'not-a-uuid',
  })).success, false);
  assert.equal(learningEventSchema.safeParse(validEvent({
    releaseId: 'lesson-g04-l04-not-allowlisted',
  })).success, false);
  assert.equal(learningEventSchema.safeParse(validEvent({
    page: {animationId: 'course-g04-l03-not-an-active-page'},
  })).success, false);
  assert.equal(learningEventSchema.safeParse(validEvent({
    inventedField: true,
  })).success, false);
});

test('page, support, and evaluation requirements are fail closed', () => {
  assert.equal(learningEventSchema.safeParse(validEvent({
    type: 'page.completed',
    page: undefined,
  })).success, false);
  assert.equal(learningEventSchema.safeParse(validEvent({
    type: 'support.used',
    support: undefined,
  })).success, false);
  assert.equal(learningEventSchema.safeParse(validEvent({
    type: 'support.used',
    support: {kind: 'nova-tutor', action: 'used'},
  })).success, true);
  assert.equal(learningEventSchema.safeParse(validEvent({
    type: 'support.used',
    support: {kind: 'key-terms', action: 'opened'},
  })).success, true);
  assert.equal(learningEventSchema.safeParse(validEvent({
    type: 'practice.evaluated',
    evaluation: {outcome: 'correct', attempt: 1},
  })).success, true);
  assert.equal(learningEventSchema.safeParse(validEvent({
    type: 'lesson.initialized',
    evaluation: {outcome: 'correct', attempt: 1},
  })).success, false);
});

test('identity, free text, media, IEP, and English-learner labels are detected without reading values', () => {
  for (const field of [
    'studentName',
    'email',
    'prompt',
    'rawAnswer',
    'response',
    'audioUrl',
    'photo',
    'transcript',
    'iepStatus',
    'englishLearnerLabel',
    'elLabel',
    'disability',
    'actor',
  ]) {
    const path = findProhibitedLearningEventField({events: [{[field]: 'private'}]});
    assert.deepEqual(path, ['events', 0, field], field);
  }
  assert.equal(findProhibitedLearningEventField({events: [validEvent()]}), null);
});

test('batches cap at 20 events and reject duplicate statement UUIDs', () => {
  const duplicate = {schemaVersion: 1, events: [validEvent(), validEvent()]};
  assert.equal(learningEventBatchSchema.safeParse(duplicate).success, false);

  const events = Array.from({length: MAX_LEARNING_EVENT_BATCH_SIZE + 1}, (_, index) =>
    validEvent({
      eventId: `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`,
      sequence: index,
    }));
  assert.equal(learningEventBatchSchema.safeParse({schemaVersion: 1, events}).success, false);
});
