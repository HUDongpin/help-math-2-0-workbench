import assert from 'node:assert/strict';
import test from 'node:test';

import {buildAnonymousLearningActor} from '../lib/anonymous-learning-actor.server';
import {G4_L3_LESSON} from '../lib/g4-l3-lesson-navigation';
import {learningEventSchema} from '../lib/learning-event-schema';
import {buildXapiStatement} from '../lib/xapi-statement';

const eventId = '11111111-1111-4111-8111-111111111111';
const actor = buildAnonymousLearningActor(
  'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  'test-only-hmac-secret-that-is-at-least-32-bytes',
);

function pageEvent(overrides: Record<string, unknown> = {}) {
  return learningEventSchema.parse({
    schemaVersion: 1,
    eventId,
    sessionId: '22222222-2222-4222-8222-222222222222',
    sequence: 7,
    occurredAt: '2026-08-14T09:02:03+08:00',
    type: 'page.completed',
    releaseId: G4_L3_LESSON.releaseId,
    locale: 'en',
    presentation: 'modern-wide',
    mode: 'study',
    page: {animationId: G4_L3_LESSON.pages[4]!.animationId},
    progress: {completedPages: 5, percent: 12.82},
    ...overrides,
  });
}

test('xAPI statement keeps the exact event UUID and derives page metadata server-side', () => {
  const statement = buildXapiStatement(pageEvent(), actor);
  assert.equal(statement.id, eventId);
  assert.equal(statement.timestamp, '2026-08-14T01:02:03.000Z');
  assert.equal(statement.actor, actor);
  assert.equal(statement.verb.id, 'http://adlnet.gov/expapi/verbs/progressed');
  assert.match(statement.object.id, /course-g04-l03-vb-002$/);
  assert.equal(statement.result?.completion, true);
  assert.deepEqual(statement.context.contextActivities.parent, [{
    objectType: 'Activity',
    id: 'https://www.helpmath.ai/xapi/activities/lesson-g04-l03-negative-numbers',
  }]);
  assert.equal(
    statement.context.extensions['https://www.helpmath.ai/xapi/extensions/section-code'],
    'VB',
  );
  assert.equal(
    statement.context.extensions['https://www.helpmath.ai/xapi/extensions/page-ordinal'],
    5,
  );
});

test('practice outcomes record only bounded evaluation metadata, never a raw response', () => {
  const statement = buildXapiStatement(pageEvent({
    type: 'practice.evaluated',
    evaluation: {outcome: 'incorrect', attempt: 2},
  }), actor);
  assert.equal(statement.verb.id, 'http://adlnet.gov/expapi/verbs/answered');
  assert.equal(statement.result?.success, false);
  assert.equal(
    statement.result?.extensions?.['https://www.helpmath.ai/xapi/extensions/evaluation-outcome'],
    'incorrect',
  );
  assert.equal(JSON.stringify(statement).includes('response'), false);
});

test('lesson exit targets the lesson while retaining its bounded last-page context', () => {
  const statement = buildXapiStatement(pageEvent({
    type: 'lesson.exited',
  }), actor);
  assert.equal(statement.verb.id, 'http://adlnet.gov/expapi/verbs/terminated');
  assert.equal(
    statement.object.id,
    'https://www.helpmath.ai/xapi/activities/lesson-g04-l03-negative-numbers',
  );
  assert.equal(statement.context.contextActivities.parent, undefined);
  assert.equal(
    statement.context.extensions['https://www.helpmath.ai/xapi/extensions/page-ordinal'],
    5,
  );
});
