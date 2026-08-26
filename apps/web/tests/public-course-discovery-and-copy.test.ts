import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {enContent} from '../content/en';
import {esContent} from '../content/es';
import {
  PUBLIC_LESSON_ROUTE_UNIVERSE,
  resolvePublicCourseDiscovery,
} from '../lib/public-course-discovery';

test('public discovery derives the exact 29-Lesson route universe from the manifest', () => {
  const availableLessonRoutes = [
    ...PUBLIC_LESSON_ROUTE_UNIVERSE,
    '/courses/9/9',
  ];
  const discovery = resolvePublicCourseDiscovery({availableLessonRoutes});
  assert.equal(PUBLIC_LESSON_ROUTE_UNIVERSE.length, 29);
  assert.deepEqual(discovery.lessonRoutes, PUBLIC_LESSON_ROUTE_UNIVERSE);
  assert.deepEqual(discovery.robotDisallow, []);
});

test('unavailable lessons stay out of sitemap discovery and are disallowed for both locales', () => {
  const discovery = resolvePublicCourseDiscovery({
    availableLessonRoutes: ['/courses/4/3'],
  });
  assert.deepEqual(discovery.lessonRoutes, ['/courses/4/3']);
  assert.deepEqual(discovery.robotDisallow,
    PUBLIC_LESSON_ROUTE_UNIVERSE
      .filter((route) => route !== '/courses/4/3')
      .flatMap((route) => [route, `/es${route}`]));
});

test('machine discovery source uses production manifest authority, never a Preview or hardcoded route shortcut', async () => {
  const [robotsSource, sitemapSource] = await Promise.all([
    readFile(new URL('../app/robots.ts', import.meta.url), 'utf8'),
    readFile(new URL('../app/sitemap.ts', import.meta.url), 'utf8'),
  ]);
  assert.match(sitemapSource, /publicRouteCatalogRows\(\)/u);
  assert.match(sitemapSource, /isPublicRouteProductionIndexable/u);
  assert.match(sitemapSource, /publicLessonCatalog\(\)/u);
  assert.match(sitemapSource,
    /NODE_ENV: 'production',[\s\S]*VERCEL_ENV: 'production'/u);
  assert.doesNotMatch(sitemapSource,
    /const routes = \['\/',[\s\S]*'\/privacy',[\s\S]*'\/terms'\]/u);
  assert.match(robotsSource, /publicRouteCatalogRows\(\)/u);
  assert.match(robotsSource, /isPublicRouteProductionAuthorized/u);
  assert.match(robotsSource, /isPublicRouteProductionIndexable/u);
  assert.match(robotsSource, /\.\.\.robotDisallow/u);
  assert.match(robotsSource,
    /sitemapAuthorized[\s\S]*\? \{sitemap:/u);
});

test('EN and ES public copy defers lesson and feature authority to the manifest', () => {
  const english = JSON.stringify({
    shared: enContent.shared,
    privacy: enContent.pages.privacy,
    terms: enContent.pages.terms,
  });
  const spanish = JSON.stringify({
    shared: esContent.shared,
    privacy: esContent.pages.privacy,
    terms: esContent.pages.terms,
  });

  for (const text of [english, spanish]) {
    assert.doesNotMatch(text, /426/u);
    assert.doesNotMatch(text, /55\s*\/\s*55/u);
  }
  assert.doesNotMatch(english, /eight runnable current-JavaScript lessons/u);
  assert.match(english, /public launch manifest/u);
  assert.match(english, /not proof of strict migration completion/u);
  assert.match(english, /Owner acceptance/u);
  assert.doesNotMatch(spanish, /ocho lecciones funcionales en JavaScript actual/u);
  assert.match(spanish, /manifiesto público de lanzamiento/u);
  assert.match(spanish, /no demuestra finalización estricta de la migración/u);
  assert.match(spanish, /aceptación humana o del titular/u);
  assert.match(enContent.pages.privacy.reviewNotice, /Owner and legal review required/u);
  assert.match(esContent.pages.privacy.reviewNotice, /Requiere revisión del titular y asesoría legal/u);
});
