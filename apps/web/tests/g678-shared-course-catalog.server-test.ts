import assert from 'node:assert/strict';
import test from 'node:test';

import {
  G678_SHARED_MODULES,
  isG678LocalPreviewEnabled,
  sharedMiddleSchoolCatalog,
  sharedMiddleSchoolCourseKey,
  sharedMiddleSchoolLessonCatalog,
  sharedMiddleSchoolLessonKey,
} from '../lib/g678-shared-course-catalog.server';
import {
  allLearningLessons,
  availableLearningLessons,
  wholeLessonEngineeringPreviewReady,
} from '../lib/learning-lesson-availability.server';

test('shared catalog projects the four modules and keeps placement counts', () => {
  const snapshot = sharedMiddleSchoolCatalog();
  const lessons = sharedMiddleSchoolLessonCatalog();
  assert.equal(snapshot.schemaVersion, 1);
  assert.equal(snapshot.profileId, 'g678-shared-source-profile-v1');
  assert.equal(lessons.length, 44);
  assert.deepEqual(
    G678_SHARED_MODULES.map((module) => [
      module.code,
      lessons.filter((lesson) => lesson.moduleCode === module.code).length,
      lessons
        .filter((lesson) => lesson.moduleCode === module.code)
        .reduce((total, lesson) => total + lesson.activePageCount, 0),
    ]),
    [
      ['NMS002', 12, 638],
      ['GEO001', 12, 595],
      ['ALG001', 12, 647],
      ['DAT001', 8, 402],
    ],
  );
  assert.equal(new Set(lessons.map((lesson) => lesson.stableLessonKey)).size, 44);
  assert.equal(lessons.every((lesson) => lesson.sourceBacked), true);
  assert.equal(lessons.every((lesson) => lesson.primaryGrade === null), true);
  assert.equal(lessons.every((lesson) => lesson.courseKey === null), true);
});

test('shared identity helpers are module-aware and normalized', () => {
  assert.equal(sharedMiddleSchoolLessonKey('nms002', '1'), 'shared-nms002-l01');
  assert.equal(sharedMiddleSchoolCourseKey(6, 'NMS002', 1), 'g6-nms002-l01');
  assert.equal(sharedMiddleSchoolCourseKey(8, 'dat001', '08'), 'g8-dat001-l08');
  assert.equal(sharedMiddleSchoolLessonKey('UNKNOWN', 1), undefined);
  assert.equal(sharedMiddleSchoolLessonKey('NMS002', 13), undefined);
  assert.equal(sharedMiddleSchoolCourseKey(5 as never, 'NMS002', 1), undefined);
  assert.equal(sharedMiddleSchoolCourseKey(6, 'DAT001', 9), undefined);
});

test('local G6-G8 preview is explicit and production always closes it', () => {
  assert.equal(isG678LocalPreviewEnabled({NODE_ENV: 'development'}), false);
  assert.equal(isG678LocalPreviewEnabled({NODE_ENV: 'development', HELP_MATH_G678_LOCAL_PREVIEW: 'true'}), true);
  assert.equal(isG678LocalPreviewEnabled({NODE_ENV: 'development', HELP_MATH_G678_LOCAL_PREVIEW: '1'}), true);
  assert.equal(isG678LocalPreviewEnabled({NODE_ENV: 'production', HELP_MATH_G678_LOCAL_PREVIEW: 'true'}), false);
});

test('engineering preview requires descriptor binding and whole-lesson N/N', () => {
  const base = {
    activePageCount: 47,
    descriptorBound: true,
    moduleCode: 'NMS002',
    registeredPageCount: 47,
  } as const;
  assert.equal(wholeLessonEngineeringPreviewReady({
    ...base,
    env: {NODE_ENV: 'development', HELP_MATH_G678_LOCAL_PREVIEW: 'true'},
  }), true);
  assert.equal(wholeLessonEngineeringPreviewReady({
    ...base,
    registeredPageCount: 46,
    env: {NODE_ENV: 'development', HELP_MATH_G678_LOCAL_PREVIEW: 'true'},
  }), false);
  assert.equal(wholeLessonEngineeringPreviewReady({
    ...base,
    descriptorBound: false,
    env: {NODE_ENV: 'development', HELP_MATH_G678_LOCAL_PREVIEW: 'true'},
  }), false);
  assert.equal(wholeLessonEngineeringPreviewReady({
    ...base,
    env: {NODE_ENV: 'production', HELP_MATH_G678_LOCAL_PREVIEW: 'true'},
  }), false);
});

test('All Lessons includes one locked card per shared lesson without opening routes', () => {
  const cards = allLearningLessons({NODE_ENV: 'development'});
  const shared = cards.filter((card) => card.moduleCode !== null);
  assert.equal(cards.length, 73);
  assert.equal(shared.length, 44);
  assert.equal(shared.every((card) => card.href === null), true);
  assert.equal(shared.every((card) => card.status === 'source-mapping-pending'), true);
  assert.equal(availableLearningLessons({NODE_ENV: 'production'}).length, 0);
  const productionCards = allLearningLessons({
    NODE_ENV: 'production',
    HELP_MATH_G678_LOCAL_PREVIEW: 'true',
  });
  assert.equal(productionCards.length, 29);
  assert.equal(productionCards.some((card) => card.moduleCode !== null), false);
});
