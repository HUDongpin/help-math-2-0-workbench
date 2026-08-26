import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {afterEach, describe, it} from 'node:test';

import {
  isPublicLessonRouteAuthorized,
  isPublicLessonDeploymentRouteAuthorized,
  isPublicLessonPreviewRouteAuthorized,
  isPublicLessonProductionRouteAuthorized,
  isPublicLessonReleaseDeploymentAudioAuthorized,
  isPublicLessonReleaseDeploymentRuntimeAssetAuthorized,
  isPublicLessonReleasePreviewAudioAuthorized,
  isPublicLessonReleasePreviewRuntimeAssetAuthorized,
  isPublicLessonReleaseProductionAudioAuthorized,
  isPublicLessonReleaseProductionRouteAuthorized,
  isPublicLessonReleaseProductionRuntimeAssetAuthorized,
  isPublicLessonReleaseRouteAuthorized,
  isKnownPublicRoutePath,
  isPublicRoutePathAuthorized,
  isPublicRoutePreviewAuthorized,
  isPublicRouteProductionAuthorized,
  publicFeatureEnabled,
  publicLaunchDeploymentTarget,
  publicLaunchSummary,
  publicLearningLessons,
  publicLessonCatalog,
  publicLessonFor,
  publicRouteCatalogRows,
  publicRouteForEnglishPath,
  publicLessonTierAuthorizesDeployment,
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
const CURRENT_JS_RELEASE_IDS = Object.freeze([
  'lesson-g03-l02-addition-subtraction-page-only-current-js',
  'lesson-g04-l03-negative-numbers',
  'lesson-g04-l05-multiplication-page-only',
  'lesson-g04-l10-perimeter-area-page-only',
  'lesson-g04-l11-coordinate-grid-page-only',
  'lesson-g05-l03-exponents-prime-factorizations-page-only',
  'lesson-g05-l04-number-lines',
  'lesson-g05-l05-add-subtract-negative-numbers',
] as const);

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
    assert.equal(publicLearningLessons({NODE_ENV: 'production'}).length, 0);
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
      assert.equal(
        isPublicLessonPreviewRouteAuthorized(lesson.grade, lesson.lesson),
        false,
        lesson.lessonKey,
      );
      assert.equal(
        isPublicLessonProductionRouteAuthorized(lesson.grade, lesson.lesson),
        false,
        lesson.lessonKey,
      );
    }
    assert.deepEqual(publicLearningLessons({
      NODE_ENV: 'production',
      VERCEL_ENV: 'preview',
    }), []);
    assert.deepEqual(publicLearningLessons({NODE_ENV: 'production'}), []);
  });

  it('fails closed for unknown grades and Lessons', () => {
    assert.equal(publicLessonFor(2, 1), null);
    assert.equal(publicLessonFor(3, 99), null);
    assert.equal(publicLessonFor(6, 1), null);
    assert.equal(isPublicLessonRouteAuthorized(3, 99), false);
    assert.equal(isPublicLessonRouteAuthorized(4, 9), false);
    assert.equal(isPublicLessonPreviewRouteAuthorized(3, 99), false);
    assert.equal(isPublicLessonPreviewRouteAuthorized(4, 9), false);
    assert.equal(isPublicLessonProductionRouteAuthorized(3, 99), false);
    assert.equal(isPublicLessonProductionRouteAuthorized(4, 9), false);
  });

  it('keeps route, runtime-asset, and audio authority separate by release ID', () => {
    for (const releaseId of CURRENT_JS_RELEASE_IDS) {
      assert.equal(isPublicLessonReleaseRouteAuthorized(releaseId), false,
        releaseId);
      assert.equal(
        isPublicLessonReleaseProductionRouteAuthorized(releaseId),
        false,
        releaseId,
      );
      assert.equal(
        isPublicLessonReleasePreviewRuntimeAssetAuthorized(releaseId),
        false,
        releaseId,
      );
      assert.equal(
        isPublicLessonReleaseProductionRuntimeAssetAuthorized(releaseId),
        false,
        releaseId,
      );
      assert.equal(
        isPublicLessonReleasePreviewAudioAuthorized(releaseId),
        false,
        releaseId,
      );
      assert.equal(
        isPublicLessonReleaseProductionAudioAuthorized(releaseId),
        false,
        releaseId,
      );
    }
    const unknown = 'lesson-g99-l99-not-in-manifest';
    assert.equal(isPublicLessonReleaseRouteAuthorized(unknown), false);
    assert.equal(
      isPublicLessonReleaseProductionRouteAuthorized(unknown),
      false,
    );
    assert.equal(
      isPublicLessonReleasePreviewRuntimeAssetAuthorized(unknown),
      false,
    );
    assert.equal(
      isPublicLessonReleaseProductionRuntimeAssetAuthorized(unknown),
      false,
    );
    assert.equal(isPublicLessonReleasePreviewAudioAuthorized(unknown), false);
    assert.equal(isPublicLessonReleaseProductionAudioAuthorized(unknown), false);
  });

  it('keeps non-production, Preview, and Released deployment authority separate', () => {
    const local = {NODE_ENV: 'development'};
    const preview = {NODE_ENV: 'production', VERCEL_ENV: 'preview'};
    const production = {NODE_ENV: 'production', VERCEL_ENV: 'production'};
    assert.equal(publicLaunchDeploymentTarget(local), 'non-production');
    assert.equal(publicLaunchDeploymentTarget(preview), 'preview');
    assert.equal(publicLaunchDeploymentTarget(production), 'production');
    assert.equal(publicLaunchDeploymentTarget({NODE_ENV: 'production'}),
      'production');
    assert.equal(publicLessonTierAuthorizesDeployment(
      'unavailable', 'non-production',
    ), false);
    assert.equal(publicLessonTierAuthorizesDeployment(
      'unavailable', 'preview',
    ), false);
    assert.equal(publicLessonTierAuthorizesDeployment(
      'unavailable', 'production',
    ), false);
    assert.equal(publicLessonTierAuthorizesDeployment(
      'preview', 'non-production',
    ), false);
    assert.equal(publicLessonTierAuthorizesDeployment(
      'preview', 'preview',
    ), true);
    assert.equal(publicLessonTierAuthorizesDeployment(
      'preview', 'production',
    ), true);
    assert.equal(publicLessonTierAuthorizesDeployment(
      'released', 'preview',
    ), true);
    assert.equal(publicLessonTierAuthorizesDeployment(
      'released', 'production',
    ), true);
    for (const lesson of publicLessonCatalog()) {
      assert.equal(isPublicLessonDeploymentRouteAuthorized(
        lesson.grade, lesson.lesson, local,
      ), false);
      assert.equal(isPublicLessonDeploymentRouteAuthorized(
        lesson.grade, lesson.lesson, preview,
      ), false);
      assert.equal(isPublicLessonDeploymentRouteAuthorized(
        lesson.grade, lesson.lesson, production,
      ), false);
    }
    for (const releaseId of CURRENT_JS_RELEASE_IDS) {
      assert.equal(isPublicLessonReleaseDeploymentRuntimeAssetAuthorized(
        releaseId, preview,
      ), false);
      assert.equal(isPublicLessonReleaseDeploymentRuntimeAssetAuthorized(
        releaseId, production,
      ), false);
      assert.equal(isPublicLessonReleaseDeploymentAudioAuthorized(
        releaseId, preview,
      ), false);
      assert.equal(isPublicLessonReleaseDeploymentAudioAuthorized(
        releaseId, production,
      ), false);
    }
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

  it('projects the exact public route contract without authorizing a surface', () => {
    const routes = publicRouteCatalogRows();
    assert.deepEqual(routes.map(({routeId}) => routeId), [
      'home',
      'all-lessons',
      'privacy',
      'terms',
      'support',
      'accessibility',
      'robots',
      'sitemap',
    ]);
    assert.equal(Object.isFrozen(routes), true);
    assert.equal(routes.every((route) =>
      route.authorizationTier === 'unavailable'
        && route.productionIndexable === false
    ), true);
    for (const route of routes) {
      assert.equal(isKnownPublicRoutePath(route.paths.en), true, route.routeId);
      assert.equal(isPublicRoutePreviewAuthorized(route.paths.en), false,
        route.routeId);
      assert.equal(isPublicRouteProductionAuthorized(route.paths.en), false,
        route.routeId);
      assert.equal(isPublicRoutePathAuthorized(route.paths.en, {
        NODE_ENV: 'production',
        VERCEL_ENV: 'preview',
      }), false, route.routeId);
      assert.equal(isPublicRoutePathAuthorized(route.paths.en, {
        NODE_ENV: 'production',
        VERCEL_ENV: 'production',
      }), false,
        route.routeId);
      assert.deepEqual(publicRouteForEnglishPath(route.paths.en), route);
    }
    assert.equal(isKnownPublicRoutePath('/about'), false);
    assert.equal(isPublicRoutePathAuthorized('/about'), false);
    assert.equal(publicRouteForEnglishPath('/about'), null);
  });

  it('returns only the smoke routes recorded by the manifest', () => {
    assert.deepEqual(publicSmokeRoutes({NODE_ENV: 'development'}), []);
    assert.deepEqual(publicSmokeRoutes({
      NODE_ENV: 'production',
      VERCEL_ENV: 'preview',
    }), []);
    assert.deepEqual(publicSmokeRoutes({
      NODE_ENV: 'production',
      VERCEL_ENV: 'production',
    }), []);
  });

  it('keeps selector counts aligned with the manifest summary', () => {
    const summary = publicLaunchSummary();
    assert.equal(publicLessonCatalog().length, summary.lessonCount);
    assert.equal(publicLearningLessons({NODE_ENV: 'production'}).length,
      summary.publicationCounts.released);
    assert.equal(publicLearningLessons({
      NODE_ENV: 'production',
      VERCEL_ENV: 'preview',
    }).length,
    summary.publicationCounts.preview + summary.publicationCounts.released);
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

  it('keeps the production smoke gate fail-closed on flaky retries and runtime failures', async () => {
    const [config, server, smoke] = await Promise.all([
      readFile(new URL('../playwright.production.config.ts', import.meta.url), 'utf8'),
      readFile(new URL('../lib/public-launch-manifest.server.ts', import.meta.url), 'utf8'),
      readFile(new URL('../e2e/production-smoke.spec.ts', import.meta.url), 'utf8'),
    ]);
    assert.match(config, /failOnFlakyTests: Boolean\(process\.env\.CI\)/u);
    assert.match(config, /retries: process\.env\.CI \? 2 : 0/u);
    assert.match(smoke, /message\.type\(\) === 'error'/u);
    assert.match(smoke, /page\.on\('pageerror'/u);
    assert.match(smoke, /expect\(issues,[\s\S]*\)\.toEqual\(\[\]\)/u);
    assert.match(server,
      /function productionLaunchIsAuthorized\(\): boolean \{[\s\S]*launchReadiness === 'GO'/u);
    assert.match(server,
      /function isPublicRouteProductionAuthorized[\s\S]*productionLaunchIsAuthorized\(\)/u);
    assert.match(server,
      /function isPublicLessonProductionRouteAuthorized[\s\S]*productionLaunchIsAuthorized\(\)/u);
  });
});
