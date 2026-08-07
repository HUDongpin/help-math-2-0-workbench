import assert from 'node:assert/strict';
import test from 'node:test';

import {
  BLOCKED_LEGACY_HOST_OPERATIONS,
  KEYTERM_PLAYBACK_DISPOSITIONS,
  LESSON_HOST_CAPABILITIES,
  createMemoryOnlyLessonHost,
} from '../src/lesson-host-contract';

const memberIds = ['g5-l4-page-1', 'g5-l4-page-2', 'g5-l4-shell'] as const;

function host(overrides: Partial<Parameters<typeof createMemoryOnlyLessonHost>[0]> = {}) {
  return createMemoryOnlyLessonHost({
    releaseId: 'lesson-g05-l04-number-lines',
    releaseMemberIds: memberIds,
    currentAnimationId: memberIds[0],
    ...overrides,
  });
}

test('lesson host defaults to an ephemeral fail-closed audit session', () => {
  const session = host();
  assert.deepEqual(session.contract, {
    capabilities: [],
    legacyOperations: 'blocked',
    auditStorage: 'memory-only',
    storesPersonalData: false,
  });
  assert.deepEqual(session.snapshot(), {
    releaseId: 'lesson-g05-l04-number-lines',
    storage: 'memory-only',
    storesPersonalData: false,
    currentAnimationId: memberIds[0],
    language: 'en',
    glossaryEntryId: null,
    keytermEntryId: null,
    calculatorOpen: false,
    activeAudioCueId: null,
    fqScore: {
      attempted: 0,
      correct: 0,
      pointsAwarded: 0,
      pointsPossible: 0,
      scoredQuestionIds: [],
    },
  });
  assert.equal(session.dispatch({type: 'set-language', language: 'es'}).status, 'blocked');
  assert.equal(session.snapshot().language, 'en');
});

test('explicit audit capabilities update memory only and retain no raw answer data', () => {
  const session = host({enabledCapabilities: LESSON_HOST_CAPABILITIES});
  assert.deepEqual(session.dispatch({type: 'navigate', targetAnimationId: memberIds[1]}), {
    status: 'allowed',
    capability: 'navigation',
    auditOnly: true,
    state: {...session.snapshot(), currentAnimationId: memberIds[1]},
  });
  assert.equal(session.dispatch({type: 'set-language', language: 'es'}).status, 'allowed');
  assert.equal(session.dispatch({type: 'open-glossary', entryId: 'temperature'}).status, 'allowed');
  assert.equal(session.dispatch({type: 'open-keyterm', entryId: 'number-line'}).status, 'allowed');
  assert.equal(session.dispatch({type: 'open-calculator'}).status, 'allowed');
  assert.equal(session.dispatch({type: 'play-audio', cueId: 'spanish-cue-1'}).status, 'allowed');
  assert.equal(session.dispatch({
    type: 'record-fq-score',
    questionId: 'q1',
    correct: true,
    pointsAwarded: 1,
    pointsPossible: 1,
  }).status, 'allowed');

  const state = session.snapshot();
  assert.equal(state.storage, 'memory-only');
  assert.equal(state.language, 'es');
  assert.equal(state.currentAnimationId, memberIds[1]);
  assert.deepEqual(state.fqScore, {
    attempted: 1,
    correct: 1,
    pointsAwarded: 1,
    pointsPossible: 1,
    scoredQuestionIds: ['q1'],
  });
  assert.equal('answer' in state.fqScore, false);

  const freshSession = host({enabledCapabilities: LESSON_HOST_CAPABILITIES});
  assert.equal(freshSession.snapshot().language, 'en');
  assert.equal(freshSession.snapshot().fqScore.attempted, 0);
});

test('published mode stays closed until the atomic release is published', () => {
  const closed = host({
    mode: 'published',
    releasePublished: false,
    enabledCapabilities: ['navigation'],
  });
  assert.deepEqual(closed.dispatch({type: 'navigate', targetAnimationId: memberIds[1]}), {
    status: 'blocked',
    code: 'release-not-published',
    reason: 'The atomic lesson release is not published.',
    state: closed.snapshot(),
  });

  const open = host({
    mode: 'published',
    releasePublished: true,
    enabledCapabilities: ['navigation'],
  });
  const allowed = open.dispatch({type: 'navigate', targetAnimationId: memberIds[1]});
  assert.equal(allowed.status, 'allowed');
  if (allowed.status === 'allowed') assert.equal(allowed.auditOnly, false);
});

test('keyterm playback dispositions are typed, source-bound, and fail closed without mutating state', () => {
  assert.deepEqual(KEYTERM_PLAYBACK_DISPOSITIONS, [
    'reversible-support-pause',
    'source-stop-timeline-and-audio-until-explicit-resume',
  ]);

  const session = host({enabledCapabilities: ['keyterm']});
  const reversible = session.dispatch({
    type: 'open-keyterm',
    entryId: 'positive',
    playbackDisposition: 'reversible-support-pause',
    sourceAnimationId: memberIds[0],
  });
  assert.equal(reversible.status, 'allowed');
  assert.equal(session.snapshot().keytermEntryId, 'positive');

  const sourceStop = session.dispatch({
    type: 'open-keyterm',
    entryId: 'negative',
    playbackDisposition: 'source-stop-timeline-and-audio-until-explicit-resume',
    sourceAnimationId: memberIds[0],
  });
  assert.equal(sourceStop.status, 'allowed');
  assert.equal(session.snapshot().keytermEntryId, 'negative');

  const stableState = session.snapshot();
  const unknownDisposition = session.dispatch({
    type: 'open-keyterm',
    entryId: 'positive',
    playbackDisposition: 'legacy-stop',
    sourceAnimationId: memberIds[0],
  });
  assert.equal(unknownDisposition.status, 'blocked');
  if (unknownDisposition.status === 'blocked') {
    assert.equal(unknownDisposition.code, 'invalid-request');
  }
  assert.equal(session.snapshot(), stableState);

  const mismatchedSource = session.dispatch({
    type: 'open-keyterm',
    entryId: 'positive',
    playbackDisposition: 'source-stop-timeline-and-audio-until-explicit-resume',
    sourceAnimationId: memberIds[1],
  });
  assert.equal(mismatchedSource.status, 'blocked');
  if (mismatchedSource.status === 'blocked') {
    assert.equal(mismatchedSource.code, 'invalid-request');
  }
  assert.equal(session.snapshot(), stableState);

  const malformedSource = session.dispatch({
    type: 'open-keyterm',
    entryId: 'positive',
    sourceAnimationId: '../g5-l4-page-1',
  });
  assert.equal(malformedSource.status, 'blocked');
  if (malformedSource.status === 'blocked') {
    assert.equal(malformedSource.code, 'invalid-request');
  }
  assert.equal(session.snapshot(), stableState);
});

test('open-keyterm preserves legacy memory-only behavior when playback fields are absent', () => {
  const session = host({enabledCapabilities: ['keyterm']});
  const decision = session.dispatch({type: 'open-keyterm', entryId: 'number-line'});
  assert.equal(decision.status, 'allowed');
  assert.equal(session.snapshot().keytermEntryId, 'number-line');
});

test('navigation and FQ scoring fail closed for nonmembers, malformed data, and duplicate scores', () => {
  const session = host({enabledCapabilities: ['navigation', 'fq-scoring']});
  assert.equal(
    session.dispatch({type: 'navigate', targetAnimationId: 'historical-g5-l4-variant'}).status,
    'blocked',
  );
  assert.equal(session.dispatch({
    type: 'record-fq-score',
    questionId: 'q1',
    correct: true,
    pointsAwarded: 2,
    pointsPossible: 1,
  }).status, 'blocked');
  assert.equal(session.dispatch({
    type: 'record-fq-score',
    questionId: 'q1',
    correct: false,
    pointsAwarded: 0,
    pointsPossible: 1,
  }).status, 'allowed');
  const duplicate = session.dispatch({
    type: 'record-fq-score',
    questionId: 'q1',
    correct: true,
    pointsAwarded: 1,
    pointsPossible: 1,
  });
  assert.equal(duplicate.status, 'blocked');
  if (duplicate.status === 'blocked') assert.equal(duplicate.code, 'duplicate-question-score');
});

test('every known legacy endpoint remains inert even with all modern capabilities enabled', () => {
  const session = host({
    mode: 'published',
    releasePublished: true,
    enabledCapabilities: LESSON_HOST_CAPABILITIES,
  });
  for (const operation of BLOCKED_LEGACY_HOST_OPERATIONS) {
    const decision = session.dispatch({
      type: 'legacy',
      operation,
      target: 'https://legacy.invalid/endpoint',
    });
    assert.equal(decision.status, 'blocked');
    if (decision.status === 'blocked') assert.equal(decision.code, 'legacy-operation-blocked');
  }
  assert.equal(session.dispatch({type: 'legacy', operation: 'unknown'}).status, 'blocked');
  assert.equal(session.dispatch({type: 'getURL', target: 'https://legacy.invalid'}).status, 'blocked');
});

test('invalid or duplicate release configuration is rejected before a session exists', () => {
  assert.throws(() => host({releaseMemberIds: ['g5-l4-page-1', 'g5-l4-page-1']}), /Invalid memory-only lesson host configuration/);
  assert.throws(() => host({currentAnimationId: 'not-a-member'}), /Invalid memory-only lesson host configuration/);
});
