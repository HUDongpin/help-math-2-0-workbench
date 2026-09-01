import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

import {
  G678_SHARED_MODULES,
  isG678GradeMappingAuthorityApproved,
  isG678LocalPreviewEnabled,
  sharedCatalogProjectionIsValid,
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

type MutableRecord = {[key: string]: unknown};
type MutableCatalog = MutableRecord & {
  lessons: Array<MutableRecord & {
    sourceXml: MutableRecord;
    pages: MutableRecord[];
  }>;
};

function checkedInSharedCatalog(): MutableCatalog {
  return JSON.parse(readFileSync(
    new URL('../../../catalog/g678-shared-catalog.v1.json', import.meta.url),
    'utf8',
  )) as MutableCatalog;
}

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
  assert.equal(isG678GradeMappingAuthorityApproved(), false);
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
  assert.equal(shared.every((card) => card.evidenceBoundarySpanish?.length), true);
  assert.equal(availableLearningLessons({NODE_ENV: 'production'}).length, 0);
  const productionCards = allLearningLessons({
    NODE_ENV: 'production',
    HELP_MATH_G678_LOCAL_PREVIEW: 'true',
  });
  assert.equal(productionCards.length, 29);
  assert.equal(productionCards.some((card) => card.moduleCode !== null), false);
});

test('shared catalog projection rejects XML/page/audio identity drift', () => {
  const baseline = checkedInSharedCatalog();
  assert.equal(sharedCatalogProjectionIsValid(baseline), true);

  const assertRejected = (mutate: (catalog: MutableCatalog) => void) => {
    const candidate = checkedInSharedCatalog();
    mutate(candidate);
    assert.equal(sharedCatalogProjectionIsValid(candidate), false);
  };

  assertRejected((catalog) => {
    const sourceXml = catalog.lessons[0]!.sourceXml;
    sourceXml.bytes = 0;
  });
  assertRejected((catalog) => {
    catalog.lessons[0]!.sourceXml.path = 'G6-G8-shared/NMS002/L2/index.xml';
  });
  assertRejected((catalog) => {
    catalog.lessons[0]!.stableLessonKey = 'shared-nms002-l99';
  });
  assertRejected((catalog) => {
    catalog.lessons[0]!.pages[0]!.sourcePath = 'HELP_COURSES/GEO001/L1/IR/L1IR01.swf';
  });
  assertRejected((catalog) => {
    catalog.lessons[0]!.pages[0]!.sourceRootKind = 'canonical-newhelp';
  });
  assertRejected((catalog) => {
    catalog.lessons[0]!.pages[0]!.variantOf = 'shared-nms002-l01-p001';
  });

  const audioLesson = baseline.lessons.find((lesson) =>
    lesson.pages.some((page) => Array.isArray(page.audioCueCandidates) &&
      page.audioCueCandidates.length > 0));
  assert.ok(audioLesson, 'checked-in catalog should contain a page audio candidate');
  const audioPage = audioLesson.pages.find((page) =>
    Array.isArray(page.audioCueCandidates) && page.audioCueCandidates.length > 0)!;
  const audioCandidate = (audioPage.audioCueCandidates as MutableRecord[])[0]!;

  assertRejected((candidate) => {
    const page = candidate.lessons.find((lesson) =>
      lesson.pages.some((entry) => Array.isArray(entry.audioCueCandidates) &&
        entry.audioCueCandidates.length > 0))!.pages.find((entry) =>
      Array.isArray(entry.audioCueCandidates) && entry.audioCueCandidates.length > 0)!;
    const audio = (page.audioCueCandidates as MutableRecord[])[0]!;
    audio.classificationStatus = 'classification-row-missing';
  });
  assertRejected((candidate) => {
    const page = candidate.lessons.find((lesson) =>
      lesson.pages.some((entry) => Array.isArray(entry.audioCueCandidates) &&
        entry.audioCueCandidates.length > 0))!.pages.find((entry) =>
      Array.isArray(entry.audioCueCandidates) && entry.audioCueCandidates.length > 0)!;
    const audio = (page.audioCueCandidates as MutableRecord[])[0]!;
    audio.sha256 = 'not-a-sha256';
  });
  assertRejected((candidate) => {
    const page = candidate.lessons.find((lesson) =>
      lesson.pages.some((entry) => Array.isArray(entry.audioCueCandidates) &&
        entry.audioCueCandidates.length > 0))!.pages.find((entry) =>
      Array.isArray(entry.audioCueCandidates) && entry.audioCueCandidates.length > 0)!;
    const audio = (page.audioCueCandidates as MutableRecord[])[0]!;
    audio.bytes = 0;
  });
  assertRejected((candidate) => {
    const page = candidate.lessons.find((lesson) =>
      lesson.pages.some((entry) => Array.isArray(entry.audioCueCandidates) &&
        entry.audioCueCandidates.length > 0))!.pages.find((entry) =>
      Array.isArray(entry.audioCueCandidates) && entry.audioCueCandidates.length > 0)!;
    page.audioCueIds = ['tampered-audio-id'];
  });

  assert.equal(audioCandidate.classificationStatus, 'resolved-canonical');
});
