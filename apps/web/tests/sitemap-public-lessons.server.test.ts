import assert from 'node:assert/strict';
import test from 'node:test';

import sitemap, {dynamic} from '../app/sitemap';
import {CURRENT_JS_1751_PUBLIC_PRODUCTION as PROFILE, CURRENT_JS_1751_PUBLIC_PROJECT as PROJECT} from '../lib/current-js-1751-public-production';
import {controlledPreviewCoursePathAvailable, isControlledCurrentJsPreview} from '../lib/controlled-current-js-preview';
import {availableLearningLessons} from '../lib/learning-lesson-availability.server';
import {resolvePublicCourseDiscovery} from '../lib/public-course-discovery';

const PRODUCTION_PROFILE = {
  NODE_ENV: 'production',
  VERCEL_ENV: 'production',
  VERCEL_PROJECT_ID: PROJECT,
  HELP_MATH_1751_PUBLIC_PRODUCTION: PROFILE,
  HELP_MATH_1751_PUBLIC_PRODUCTION_BUILD: PROFILE,
} as const;

function withProductionProfile<T>(fn: () => T): T {
  const previous = Object.fromEntries(Object.keys(PRODUCTION_PROFILE).map((key) => [key, process.env[key]]));
  Object.assign(process.env, PRODUCTION_PROFILE);
  try { return fn(); } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete (process.env as Record<string, string | undefined>)[key];
      else (process.env as Record<string, string | undefined>)[key] = value;
    }
  }
}

const SITE = 'https://www.helpmath.ai';

test('every lesson linked from home is in the production sitemap (en + es)', () => withProductionProfile(() => {
  const homeLessons = availableLearningLessons().map(({href}) => href.split('?')[0]!);
  assert.equal(homeLessons.length, 29, 'public production program publishes 29 lessons');
  const urls = new Set(sitemap().map(({url}) => url));
  for (const route of homeLessons) {
    assert.ok(urls.has(`${SITE}${route}`), route);
    assert.ok(urls.has(`${SITE}/es${route}`), `/es${route}`);
  }
}));

test('production sitemap lists only routes the production profile serves with 200', () => withProductionProfile(() => {
  assert.equal(isControlledCurrentJsPreview(), true);
  const entries = sitemap();
  assert.equal(entries.length, 2 * (1 + 29));
  for (const {url} of entries) {
    const {pathname} = new URL(url);
    const route = pathname.replace(/^\/es(?=\/|$)/u, '') || '/';
    if (route === '/') continue;
    assert.match(route, /^\/courses\/[3-5]\/\d{1,2}$/u, url);
    // Same admission the proxy applies to course paths in the public production profile.
    assert.equal(controlledPreviewCoursePathAvailable(route), true, url);
  }
  for (const excluded of ['/courses', '/privacy', '/terms', '/es/privacy', '/es/terms']) {
    assert.ok(!entries.some(({url}) => url === `${SITE}${excluded}`), excluded);
  }
}));

test('sitemap is prerendered at build time, never computed per request', () => {
  // `error` keeps the route static and fails the build if a Dynamic API is added.
  assert.equal(dynamic, 'error');
});

test('discovery has no hardcoded allowlist and ignores non-lesson routes', () => {
  const {lessonRoutes, robotDisallow} = resolvePublicCourseDiscovery({
    availableLessonRoutes: ['/courses/3/1?mode=focus', '/courses/3/1', '/courses/5/13?mode=focus', '/courses', '/about'],
  });
  assert.deepEqual(lessonRoutes, ['/courses/3/1', '/courses/5/13']);
  assert.deepEqual(robotDisallow, []);
});
