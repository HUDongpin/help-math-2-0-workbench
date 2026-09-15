import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

import {
  buildLessonDescriptor,
  isCitedInteractiveLesson,
  localizedCatalogTitle,
  pageHasRegisteredInteraction,
  pageRequiresInteraction,
  type LessonPageSource
} from '../lib/lesson-descriptor';

const catalogPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../catalog/animations.json');
const catalog = JSON.parse(readFileSync(catalogPath, 'utf8')) as {animations: LessonPageSource[]};

test('only the three cited lessons unlock the interaction player', () => {
  assert.equal(isCitedInteractiveLesson(3, 2), true);
  assert.equal(isCitedInteractiveLesson(4, 3), true);
  assert.equal(isCitedInteractiveLesson(5, 5), true);
  assert.equal(isCitedInteractiveLesson(3, 1), false);
});

test('Grade 3 Lesson 2 descriptor matches the production 70-page catalog sequence', () => {
  const descriptor = buildLessonDescriptor(catalog.animations, 3, 2);
  assert.equal(descriptor?.course.activePageCount, 70);
  assert.equal(descriptor?.playerId, 'workbench-catalog-interaction-bridge');
  assert.equal(descriptor?.course.domIdPrefix, 'g3-l2');
  assert.equal(descriptor?.pages[0]?.animationId, 'course-g03-l02-ir-001-87689b4b');
  const tryIt = descriptor?.pages.filter((page) => page.sectionCode === 'TI') ?? [];
  assert.equal(tryIt.length, 9);
  assert.equal(tryIt[0]?.animationId, 'course-g03-l02-ti-002');
  assert.equal(tryIt[0]?.presentation?.pageInteractionStageTargetIdSuffix, 'ti002-key-terms');
  assert.equal(pageRequiresInteraction(tryIt[0]!), true);
  assert.equal(pageHasRegisteredInteraction(tryIt[0]!), true);
  const intro = descriptor?.pages[0];
  assert.equal(intro && pageRequiresInteraction(intro), false);
  assert.equal(tryIt[0]?.title.en, 'Question 1');
  assert.equal(tryIt[0]?.title.es, 'Pregunta 1');
  assert.equal(tryIt[0]?.frameCount, 10);
  assert.equal(descriptor?.course.title.en, 'Addition and Subtraction');
  assert.equal(descriptor?.course.title.es, 'Adición y sustracción');
});

test('cited Grade 4 and Grade 5 lessons register Try It overlays', () => {
  const grade4 = buildLessonDescriptor(catalog.animations, 4, 3);
  const grade5 = buildLessonDescriptor(catalog.animations, 5, 5);
  assert.equal(grade4?.pages.length, 39);
  assert.equal(grade5?.pages.length, 56);
  assert.equal(grade4?.pages.find((page) => page.animationId === 'course-g04-l03-ti-002')?.presentation?.pageInteractionStageTargetIdSuffix, 'ti002-key-terms');
  assert.equal(grade5?.pages.find((page) => page.animationId === 'course-g05-l05-gs-002')?.presentation?.pageInteractionStageTargetIdSuffix, 'gs002-game');
  assert.equal(grade4?.course.title.es, 'Números negativos');
  assert.equal(grade5?.course.title.es, 'Sumar y restar números negativos');
});

test('catalog titles fall back to Spanish page and lesson names', () => {
  assert.deepEqual(localizedCatalogTitle('Question 3'), {en: 'Question 3', es: 'Pregunta 3'});
  assert.deepEqual(localizedCatalogTitle('Game 1'), {en: 'Game 1', es: 'Juego 1'});
  assert.deepEqual(localizedCatalogTitle('Page 4'), {en: 'Page 4', es: 'Página 4'});
  assert.deepEqual(localizedCatalogTitle('Introduction'), {en: 'Introduction', es: 'Introducción'});
  assert.deepEqual(localizedCatalogTitle('Question 1', 'Pregunta uno'), {
    en: 'Question 1',
    es: 'Pregunta uno'
  });
});
