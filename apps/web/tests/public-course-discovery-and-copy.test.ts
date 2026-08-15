import assert from 'node:assert/strict';
import test from 'node:test';

import {enContent} from '../content/en';
import {esContent} from '../content/es';
import {resolvePublicCourseDiscovery} from '../lib/public-course-discovery';

const G5_EN_URL = 'https://www.helpmath.ai/courses/5/4';
const G5_ES_URL = 'https://www.helpmath.ai/es/courses/5/4';

test('G5 L4 discovery remains closed without the exact showcase opt-in', () => {
  for (const value of [undefined, '', '1', 'TRUE', ' true']) {
    const discovery = resolvePublicCourseDiscovery({
      g4L3Available: true,
      env: {CURRENT_JS_SHOWCASE_G5_L4_ENABLED: value},
    });
    assert.ok(discovery.g5L4RobotDisallow.includes('/courses/5/4'), String(value));
    assert.ok(discovery.g5L4RobotDisallow.includes('/es/courses/5/4'), String(value));
    assert.ok(!discovery.lessonRoutes.includes('/courses/5/4'), String(value));
  }
});

test('the exact G5 L4 showcase opt-in publishes both locale discovery routes', () => {
  const discovery = resolvePublicCourseDiscovery({
    g4L3Available: true,
    env: {CURRENT_JS_SHOWCASE_G5_L4_ENABLED: 'true'},
  });
  assert.deepEqual(discovery.g5L4RobotDisallow, []);
  assert.deepEqual(discovery.lessonRoutes, ['/courses/4/3', '/courses/5/4']);
  assert.equal(new URL('/courses/5/4', 'https://www.helpmath.ai').toString(), G5_EN_URL);
  assert.equal(new URL('/es/courses/5/4', 'https://www.helpmath.ai').toString(), G5_ES_URL);
});

test('EN and ES public copy names exactly two runnable current-JS lessons without strict claims', () => {
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
    assert.match(text, /39/u);
    assert.match(text, /54/u);
    assert.doesNotMatch(text, /55\s*\/\s*55/u);
  }
  assert.match(english, /two runnable current-JavaScript lessons/u);
  assert.match(english, /not proof of strict migration completion/u);
  assert.match(english, /Owner acceptance/u);
  assert.match(spanish, /dos lecciones funcionales en JavaScript actual/u);
  assert.match(spanish, /no demuestra finalización estricta de la migración/u);
  assert.match(spanish, /aceptación humana o del titular/u);
  assert.match(enContent.pages.privacy.reviewNotice, /Owner and legal review required/u);
  assert.match(esContent.pages.privacy.reviewNotice, /Requiere revisión del titular y asesoría legal/u);
});
