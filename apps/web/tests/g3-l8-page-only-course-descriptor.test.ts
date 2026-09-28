import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

import productReleaseDocument from '../../../catalog/page-only-current-js-product-releases.json' with {type: 'json'};
import {G3_L8_PAGE_ONLY_CURRENT_JS} from '../lib/g3-l8-page-only-current-js.generated';
import {G3_L8_PAGE_ONLY_COURSE_DESCRIPTOR} from '../lib/g3-l8-page-only-course-descriptor';
import {availableLearningLessons} from '../lib/learning-lesson-availability.server';

const projectRoot = path.resolve(import.meta.dirname, '../../..');
const digest = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');

test('G3 L8 is a complete 61-placement page-only descriptor with source order', () => {
  const descriptor = G3_L8_PAGE_ONLY_COURSE_DESCRIPTOR;
  assert.equal(descriptor.descriptorKind, 'formal-page-only-course');
  assert.equal(descriptor.course.grade, 3);
  assert.equal(descriptor.course.lesson, 8);
  assert.equal(descriptor.course.activePageCount, 61);
  assert.equal(descriptor.course.courseShellCount, 0);
  assert.equal(descriptor.course.expectedReleaseMemberCount, 61);
  assert.equal(Object.hasOwn(descriptor.course, 'shellAnimationId'), false);
  assert.equal(Object.hasOwn(descriptor, 'shellImplementation'), false);
  assert.deepEqual(descriptor.sections.map(({code, activePageCount}) => [code, activePageCount]), [
    ['IR', 1], ['RW', 3], ['VB', 3], ['IN', 37],
    ['TI', 6], ['GS', 1], ['TS', 7], ['FQ', 3],
  ]);
  assert.equal(descriptor.pages.length, 61);
  for (const [index, page] of descriptor.pages.entries()) {
    assert.equal(page.globalPageOrdinal, index + 1);
    assert.equal(page.source.sourceOccurrence, index + 1);
    assert.equal(page.placementId, `g03-l08-placement-${String(index + 1).padStart(3, '0')}`);
    assert.equal(page.previousAnimationId, descriptor.pages[index - 1]?.animationId ?? null);
    assert.equal(page.nextAnimationId, descriptor.pages[index + 1]?.animationId ?? null);
    assert.equal(page.rendererAvailability.kind, 'registered');
    if (page.rendererAvailability.kind === 'registered') {
      assert.equal(page.rendererAvailability.moduleKey, page.animationId);
      assert.equal(page.rendererAvailability.runtimeQuery?.language, 'fixed-en');
      assert.equal(page.rendererAvailability.runtimeQuery?.scenario, 'source-static-frame');
    }
    assert.equal(page.runtimeEvidenceBoundary?.runtimeKind, 'source-static-current-js-candidate');
  }
});

test('G3 L8 freeze and page-only release bind the same 61 source occurrences', async () => {
  const descriptor = G3_L8_PAGE_ONLY_COURSE_DESCRIPTOR;
  const freezeBytes = await readFile(path.join(projectRoot, descriptor.source.candidateFreezeManifestPath));
  assert.equal(digest(freezeBytes), descriptor.source.candidateFreezeManifestSha256);
  const freeze = JSON.parse(freezeBytes.toString('utf8'));
  assert.equal(freeze.selectedPages.length, 61);
  assert.equal(freeze.acceptanceEffects.published, false);
  const release = productReleaseDocument.releases.find((candidate) => candidate.releaseId === descriptor.releaseId);
  assert.ok(release);
  assert.equal(release.expectedCounts.members, 61);
  assert.equal(release.expectedCounts.courseShells, 0);
  assert.equal(release.sourceLesson.sha256, descriptor.source.sourceXmlSha256);
  assert.equal(release.members.length, 61);
  assert.deepEqual(release.members.map((member) => [member.ordinal, member.animationId, member.xmlOccurrence]), descriptor.pages.map((page, index) => [index + 1, page.animationId, index + 1]));
  assert.ok(Object.values(descriptor.productBridge.acceptanceEffects).every((value) => value === false));
  assert.deepEqual(descriptor.sections.map(({code}) => code), G3_L8_PAGE_ONLY_CURRENT_JS.sections.map(({code}) => code));
});

test('G3 L8 is surfaced by the same modern All Lessons availability projection', () => {
  const development = availableLearningLessons({NODE_ENV: 'development'});
  const lesson = development.find(({grade, lesson}) => grade === 3 && lesson === 8);
  assert.deepEqual(lesson, {
    activePageCount: 61,
    grade: 3,
    href: '/courses/3/8?mode=focus',
    lesson: 8,
    releaseId: 'lesson-g03-l08-measurement-page-only',
    titleEnglish: 'Measurement',
    titleSpanish: null,
  });
  const production = availableLearningLessons({NODE_ENV: 'production'});
  assert.equal(production.some(({grade, lesson: lessonNumber}) => grade === 3 && lessonNumber === 8), false);
});
