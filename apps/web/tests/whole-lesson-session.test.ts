import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createInitialWholeLessonSessionProgress,
  parseLegacyWholeLessonSessionProgress,
  parseWholeLessonSessionProgress,
  recordWholeLessonReplay,
  reviewWholeLessonPage,
  setWholeLessonSessionLocale,
  startWholeLessonAtBeginning,
  visitWholeLessonPage,
  wholeLessonHasResumablePlacement,
  wholeLessonReviewedPercent,
  wholeLessonSessionStorageKey,
  type WholeLessonSessionDescriptor,
} from '../lib/whole-lesson-session';

const descriptor: WholeLessonSessionDescriptor = {
  releaseId: 'lesson-g04-l03-negative-numbers',
  pages: [
    {animationId: 'course-g04-l03-ir-001'},
    {animationId: 'course-g04-l03-rw-001'},
    {animationId: 'course-g04-l03-rw-002'},
  ],
};

const otherDescriptor: WholeLessonSessionDescriptor = {
  releaseId: 'lesson-g05-l04-number-lines',
  pages: [
    {animationId: 'course-g05-l04-ir-001'},
    {animationId: 'course-g05-l04-rw-001'},
  ],
};

test('session starts at the first descriptor page and uses a release-isolated key', () => {
  const progress = createInitialWholeLessonSessionProgress(descriptor, 'en');
  assert.equal(
    wholeLessonSessionStorageKey(descriptor),
    'helpmath:whole-lesson-session:lesson-g04-l03-negative-numbers:v1',
  );
  assert.notEqual(
    wholeLessonSessionStorageKey(descriptor),
    wholeLessonSessionStorageKey(otherDescriptor),
  );
  assert.deepEqual(progress, {
    schemaVersion: 1,
    releaseId: descriptor.releaseId,
    currentAnimationId: descriptor.pages[0]!.animationId,
    locale: 'en',
    visitedAnimationIds: [descriptor.pages[0]!.animationId],
    reviewedAnimationIds: [],
    replayCounts: {},
  });
  assert.equal(wholeLessonReviewedPercent(progress, descriptor), 0);
});

test('learner navigation, review state, locale, and replay counts are immutable', () => {
  const first = descriptor.pages[0]!.animationId;
  const second = descriptor.pages[1]!.animationId;
  const initial = createInitialWholeLessonSessionProgress(descriptor, 'en');
  const visited = visitWholeLessonPage(initial, descriptor, second);
  const reviewed = reviewWholeLessonPage(visited, descriptor, first);
  const replayedOnce = recordWholeLessonReplay(reviewed, descriptor, second);
  const replayedTwice = recordWholeLessonReplay(
    replayedOnce,
    descriptor,
    second,
  );
  const spanish = setWholeLessonSessionLocale(
    replayedTwice,
    descriptor,
    'es',
  );

  assert.equal(initial.currentAnimationId, first);
  assert.deepEqual(initial.reviewedAnimationIds, []);
  assert.equal(spanish.currentAnimationId, second);
  assert.deepEqual(spanish.visitedAnimationIds, [first, second]);
  assert.deepEqual(spanish.reviewedAnimationIds, [first]);
  assert.equal(spanish.replayCounts[second], 2);
  assert.equal(spanish.locale, 'es');
  assert.equal(wholeLessonReviewedPercent(spanish, descriptor), 33);
});

test('resume placement is later-page only and starting over preserves review history', () => {
  const first = descriptor.pages[0]!.animationId;
  const second = descriptor.pages[1]!.animationId;
  const initial = createInitialWholeLessonSessionProgress(descriptor, 'en');
  assert.equal(
    wholeLessonHasResumablePlacement(initial, descriptor),
    false,
  );

  let stoppedLater = reviewWholeLessonPage(
    visitWholeLessonPage(initial, descriptor, second),
    descriptor,
    first,
  );
  stoppedLater = recordWholeLessonReplay(stoppedLater, descriptor, second);
  assert.equal(
    wholeLessonHasResumablePlacement(stoppedLater, descriptor),
    true,
  );

  const fromBeginning = startWholeLessonAtBeginning(
    stoppedLater,
    descriptor,
  );
  assert.equal(fromBeginning.currentAnimationId, first);
  assert.deepEqual(fromBeginning.reviewedAnimationIds, [first]);
  assert.deepEqual(fromBeginning.visitedAnimationIds, [first, second]);
  assert.deepEqual(fromBeginning.replayCounts, {[second]: 1});
  assert.equal(
    wholeLessonHasResumablePlacement(fromBeginning, descriptor),
    false,
  );
});

test('native parser fails closed to descriptor pages and gives route locale priority', () => {
  const first = descriptor.pages[0]!.animationId;
  const second = descriptor.pages[1]!.animationId;
  const parsed = parseWholeLessonSessionProgress(JSON.stringify({
    schemaVersion: 1,
    releaseId: descriptor.releaseId,
    currentAnimationId: '../private-archive',
    locale: 'es',
    visitedAnimationIds: [second, second, '../private-archive'],
    reviewedAnimationIds: [second, 'shell-course-g04-l03-index-local'],
    replayCounts: {
      [second]: 2,
      [first]: -1,
      '../private-archive': 9,
    },
  }), descriptor, 'en');

  assert.equal(parsed.currentAnimationId, first);
  assert.equal(parsed.locale, 'en');
  assert.deepEqual(parsed.visitedAnimationIds, [first, second]);
  assert.deepEqual(parsed.reviewedAnimationIds, [second]);
  assert.deepEqual(parsed.replayCounts, {[second]: 2});
});

test('release mismatch cannot restore or mutate state across lessons', () => {
  const storedForOtherRelease = JSON.stringify({
    schemaVersion: 1,
    releaseId: otherDescriptor.releaseId,
    currentAnimationId: otherDescriptor.pages[1]!.animationId,
    locale: 'en',
    visitedAnimationIds: otherDescriptor.pages.map((page) => page.animationId),
    reviewedAnimationIds: otherDescriptor.pages.map((page) => page.animationId),
    replayCounts: {[otherDescriptor.pages[1]!.animationId]: 4},
  });
  const parsed = parseWholeLessonSessionProgress(
    storedForOtherRelease,
    descriptor,
    'es',
  );
  assert.deepEqual(
    parsed,
    createInitialWholeLessonSessionProgress(descriptor, 'es'),
  );

  const otherProgress = createInitialWholeLessonSessionProgress(
    otherDescriptor,
    'en',
  );
  assert.deepEqual(
    visitWholeLessonPage(
      otherProgress,
      descriptor,
      descriptor.pages[1]!.animationId,
    ),
    createInitialWholeLessonSessionProgress(descriptor, 'en'),
  );
});

test('unknown page operations are rejected without widening the allowlist', () => {
  const progress = createInitialWholeLessonSessionProgress(descriptor, 'en');
  const unknown = 'course-g04-l03-not-a-member';
  assert.deepEqual(
    visitWholeLessonPage(progress, descriptor, unknown),
    progress,
  );
  assert.deepEqual(
    reviewWholeLessonPage(progress, descriptor, unknown),
    progress,
  );
  assert.deepEqual(
    recordWholeLessonReplay(progress, descriptor, unknown),
    progress,
  );
});

test('placement ids keep repeated source animations independently navigable', () => {
  const repeated: WholeLessonSessionDescriptor = {
    releaseId: 'lesson-g05-l03-page-only',
    pages: [
      {placementId: 'placement-045', animationId: 'course-g05-l03-in-028'},
      {placementId: 'placement-046', animationId: 'course-g05-l03-in-028'},
    ],
  };
  const initial = createInitialWholeLessonSessionProgress(repeated, 'en');
  const second = reviewWholeLessonPage(
    visitWholeLessonPage(initial, repeated, 'placement-046'),
    repeated,
    'placement-046',
  );
  const replayed = recordWholeLessonReplay(
    second,
    repeated,
    'placement-046',
  );

  assert.equal(initial.currentAnimationId, 'placement-045');
  assert.equal(replayed.currentAnimationId, 'placement-046');
  assert.deepEqual(replayed.visitedAnimationIds, [
    'placement-045',
    'placement-046',
  ]);
  assert.deepEqual(replayed.reviewedAnimationIds, ['placement-046']);
  assert.deepEqual(replayed.replayCounts, {'placement-046': 1});
  assert.equal(wholeLessonReviewedPercent(replayed, repeated), 50);
});

test('invalid descriptors fail closed before session state can be created', () => {
  const duplicated: WholeLessonSessionDescriptor = {
    releaseId: 'lesson-duplicate',
    pages: [
      {animationId: 'page-1'},
      {animationId: 'page-1'},
    ],
  };
  const empty: WholeLessonSessionDescriptor = {
    releaseId: 'lesson-empty',
    pages: [],
  };
  assert.throws(
    () => createInitialWholeLessonSessionProgress(duplicated, 'en'),
    /page allowlist/,
  );
  assert.throws(
    () => createInitialWholeLessonSessionProgress(empty, 'en'),
    /descriptor/,
  );
});

test('legacy adapter entry remains release-bound and normalized by the descriptor', () => {
  const second = descriptor.pages[1]!.animationId;
  const serializedLegacy = JSON.stringify({
    version: 7,
    language: 'es',
    placement: second,
    seen: [second, '../private-archive'],
    pageReviewIds: [second, 'shell-course-g04-l03-index-local'],
    replays: {[second]: 3, '../private-archive': 20},
  });
  const adapter = (value: unknown) => {
    const legacy = value as Record<string, unknown>;
    return {
      schemaVersion: 1,
      releaseId: descriptor.releaseId,
      currentAnimationId: legacy.placement,
      locale: legacy.language,
      visitedAnimationIds: legacy.seen,
      reviewedAnimationIds: legacy.pageReviewIds,
      replayCounts: legacy.replays,
    };
  };

  const parsed = parseLegacyWholeLessonSessionProgress(
    serializedLegacy,
    descriptor,
    'en',
    adapter,
  );
  assert.equal(parsed.currentAnimationId, second);
  assert.equal(parsed.locale, 'en');
  assert.deepEqual(parsed.visitedAnimationIds, [second]);
  assert.deepEqual(parsed.reviewedAnimationIds, [second]);
  assert.deepEqual(parsed.replayCounts, {[second]: 3});

  const missingRelease = parseLegacyWholeLessonSessionProgress(
    serializedLegacy,
    descriptor,
    'es',
    () => ({
      schemaVersion: 1,
      currentAnimationId: second,
      reviewedAnimationIds: [second],
    }),
  );
  assert.deepEqual(
    missingRelease,
    createInitialWholeLessonSessionProgress(descriptor, 'es'),
  );
});

test('malformed storage and throwing legacy adapters return the initial session', () => {
  const expected = createInitialWholeLessonSessionProgress(descriptor, 'es');
  assert.deepEqual(
    parseWholeLessonSessionProgress('{', descriptor, 'es'),
    expected,
  );
  assert.deepEqual(
    parseLegacyWholeLessonSessionProgress(
      '{"legacy":true}',
      descriptor,
      'es',
      () => {
        throw new Error('legacy mapper rejected the value');
      },
    ),
    expected,
  );
});
