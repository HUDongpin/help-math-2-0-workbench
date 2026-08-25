import assert from 'node:assert/strict';
import {afterEach, describe, it} from 'node:test';

import {
  isPublicLessonRouteAuthorized,
  publicFeatureEnabled,
  publicLaunchSummary,
  publicLearningLessons,
  publicLessonCatalog,
  publicLessonFor,
  publicSmokeRoutes,
  type PublicFeature,
} from '../lib/public-launch-manifest.server';

const SHOWCASE_ENV_KEYS = [
  'G3_L2_SHOWCASE_ENABLED',
  'G4_L3_SHOWCASE_ENABLED',
  'G4_L5_PAGE_ONLY_SHOWCASE_ENABLED',
  'G4_L10_PAGE_ONLY_SHOWCASE_ENABLED',
  'G4_L11_PAGE_ONLY_SHOWCASE_ENABLED',
  'G5_L3_SHOWCASE_ENABLED',
  'G5_L4_SHOWCASE_ENABLED',
  'G5_L5_SHOWCASE_ENABLED',
] as const;
const originalEnvironment = Object.fromEntries(SHOWCASE_ENV_KEYS.map((key) =>
  [key, process.env[key]]));

afterEach(() => {
  for (const key of SHOWCASE_ENV_KEYS) {
    const value = originalEnvironment[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

describe('public launch manifest server boundary', () => {
  it('loads one validated immutable manifest', () => {
    const summary = publicLaunchSummary();
    const catalog = publicLessonCatalog();
    assert.equal(summary.launchReadiness, 'NO_GO');
    assert.equal(Object.isFrozen(summary), true);
    assert.equal(Object.isFrozen(catalog), true);
    assert.equal(Object.isFrozen(catalog[0]), true);
  });

  it('always exposes the honest 29-Lesson catalog even when none are learnable', () => {
    const lessons = publicLessonCatalog();
    assert.equal(lessons.length, 29);
    assert.equal(lessons.reduce(
      (sum, lesson) => sum + lesson.pageOccurrenceCount,
      0,
    ), 1_751);
    assert.deepEqual(lessons.map(({catalogOrdinal}) => catalogOrdinal),
      Array.from({length: 29}, (_, index) => index + 1));
    assert.equal(publicLearningLessons().length, 0);
  });

  it('keeps all Lessons Unavailable and provenance out of the public projection', () => {
    const catalog = publicLessonCatalog();
    assert.equal(catalog.every((lesson) =>
      lesson.publication.tier === 'unavailable'
        && !lesson.publication.routeAuthorized
        && !lesson.publication.indexable
    ), true);
    for (const lesson of catalog) {
      assert.equal('currentJs' in lesson, false, lesson.lessonKey);
      assert.equal('sourceXml' in lesson, false, lesson.lessonKey);
      assert.deepEqual(Object.keys(lesson.publication).sort(), [
        'indexable',
        'routeAuthorized',
        'tier',
      ]);
    }
  });

  it('does not let legacy showcase environment flags expand public authority', () => {
    for (const key of SHOWCASE_ENV_KEYS) process.env[key] = 'true';
    for (const lesson of publicLessonCatalog()) {
      assert.equal(
        isPublicLessonRouteAuthorized(lesson.grade, lesson.lesson),
        false,
        lesson.lessonKey,
      );
    }
    assert.deepEqual(publicLearningLessons(), []);
  });

  it('fails closed for unknown grades and Lessons', () => {
    assert.equal(publicLessonFor(2, 1), null);
    assert.equal(publicLessonFor(3, 99), null);
    assert.equal(publicLessonFor(6, 1), null);
    assert.equal(isPublicLessonRouteAuthorized(3, 99), false);
    assert.equal(isPublicLessonRouteAuthorized(4, 9), false);
  });

  it('mechanically derives canonical EN and ES Lesson routes', () => {
    for (const lesson of publicLessonCatalog()) {
      assert.equal(lesson.routes.en,
        `/courses/${lesson.grade}/${lesson.lesson}`);
      assert.equal(lesson.routes.es,
        `/es/courses/${lesson.grade}/${lesson.lesson}`);
      assert.equal(lesson.title.es, null);
      assert.equal(lesson.title.esUsesEnglishFallback, true);
    }
  });

  it('keeps every governed public feature disabled', () => {
    const features: readonly PublicFeature[] = [
      'novaTutor',
      'lrs',
      'auth',
      'teacher',
      'family',
      'contactForm',
    ];
    for (const feature of features) {
      assert.equal(publicFeatureEnabled(feature), false, feature);
    }
  });

  it('returns only the smoke routes recorded by the manifest', () => {
    assert.deepEqual(publicSmokeRoutes(), []);
  });

  it('keeps selector counts aligned with the manifest summary', () => {
    const summary = publicLaunchSummary();
    assert.equal(publicLessonCatalog().length, summary.lessonCount);
    assert.equal(publicLearningLessons().length,
      summary.publiclyRoutableLessons);
    assert.deepEqual(summary.publicationCounts, {
      unavailable: 29,
      preview: 0,
      released: 0,
    });
  });

  it('preserves Preview and Released as distinct manifest states', () => {
    const tiers = new Set(publicLessonCatalog().map(
      (lesson) => lesson.publication.tier,
    ));
    assert.deepEqual([...tiers], ['unavailable']);
    assert.equal(publicLaunchSummary().publicationCounts.preview, 0);
    assert.equal(publicLaunchSummary().publicationCounts.released, 0);
  });
});
