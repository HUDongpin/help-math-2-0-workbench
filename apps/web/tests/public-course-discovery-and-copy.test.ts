import assert from 'node:assert/strict';
import test from 'node:test';

import {enContent} from '../content/en';
import {esContent} from '../content/es';
import {
  PUBLIC_CURRENT_JS_LESSON_ROUTES,
  resolvePublicCourseDiscovery,
} from '../lib/public-course-discovery';

test('public discovery exposes only the exact runnable lesson routes', () => {
  const availableLessonRoutes = [
    '/courses/3/2',
    '/courses/4/3',
    '/courses/5/3',
    '/courses/5/4',
    '/courses/5/5',
    '/courses/9/9',
  ];
  const discovery = resolvePublicCourseDiscovery({availableLessonRoutes});
  assert.deepEqual(discovery.lessonRoutes, PUBLIC_CURRENT_JS_LESSON_ROUTES);
  assert.deepEqual(discovery.robotDisallow, []);
});

test('unavailable lessons stay out of sitemap discovery and are disallowed for both locales', () => {
  const discovery = resolvePublicCourseDiscovery({
    availableLessonRoutes: ['/courses/4/3'],
  });
  assert.deepEqual(discovery.lessonRoutes, ['/courses/4/3']);
  assert.deepEqual(discovery.robotDisallow, [
    '/courses/3/2',
    '/es/courses/3/2',
    '/courses/5/3',
    '/es/courses/5/3',
    '/courses/5/4',
    '/es/courses/5/4',
    '/courses/5/5',
    '/es/courses/5/5',
  ]);
});

test('EN and ES public copy names five runnable current-JS lessons without strict claims', () => {
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
    for (const pageCount of [70, 39, 65, 54, 56]) {
      assert.match(text, new RegExp(String(pageCount), 'u'));
    }
    assert.match(text, /284/u);
    assert.doesNotMatch(text, /55\s*\/\s*55/u);
  }
  assert.match(english, /five runnable current-JavaScript lessons/u);
  assert.match(english, /not proof of strict migration completion/u);
  assert.match(english, /Owner acceptance/u);
  assert.match(spanish, /cinco lecciones funcionales en JavaScript actual/u);
  assert.match(spanish, /no demuestra finalización estricta de la migración/u);
  assert.match(spanish, /aceptación humana o del titular/u);
  assert.match(enContent.pages.privacy.reviewNotice, /Owner and legal review required/u);
  assert.match(esContent.pages.privacy.reviewNotice, /Requiere revisión del titular y asesoría legal/u);
});
