import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

import productReleaseDocument from '../../../catalog/page-only-current-js-product-releases.json' with {type: 'json'};
import {G5_L7_PAGE_ONLY_CURRENT_JS} from '../lib/g5-l7-page-only-current-js.generated';
import {G5_L7_PAGE_ONLY_COURSE_DESCRIPTOR} from '../lib/g5-l7-page-only-course-descriptor';
import {availableLearningLessons} from '../lib/learning-lesson-availability.server';

const projectRoot = path.resolve(import.meta.dirname, '../../..');
const digest = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');

test('G5 L7 is a complete 55-placement page-only descriptor with source order', () => {
  const descriptor = G5_L7_PAGE_ONLY_COURSE_DESCRIPTOR;
  assert.equal(descriptor.descriptorKind, 'formal-page-only-course');
  assert.equal(descriptor.descriptorId, 'g5-l7-formal-page-only-course-v1');
  assert.equal(descriptor.course.grade, 5);
  assert.equal(descriptor.course.lesson, 7);
  assert.equal(descriptor.course.activePageCount, 55);
  assert.equal(descriptor.course.courseShellCount, 0);
  assert.equal(descriptor.course.expectedReleaseMemberCount, 55);
  assert.deepEqual(descriptor.sections.map(({code, activePageCount}) => [code, activePageCount]), [
    ['IR', 1], ['RW', 3], ['VB', 5], ['IN', 29], ['TI', 5], ['GS', 2], ['TS', 7], ['FQ', 3],
  ]);
  assert.equal(descriptor.pages.length, 55);
  for (const [index, page] of descriptor.pages.entries()) {
    assert.equal(page.globalPageOrdinal, index + 1);
    assert.equal(page.source.sourceOccurrence, index + 1);
    assert.equal(page.placementId, `g05-l07-placement-${String(index + 1).padStart(3, '0')}`);
    assert.equal(page.previousAnimationId, descriptor.pages[index - 1]?.animationId ?? null);
    assert.equal(page.nextAnimationId, descriptor.pages[index + 1]?.animationId ?? null);
    assert.equal(page.rendererAvailability.kind, 'registered');
    assert.equal(page.runtimeEvidenceBoundary?.runtimeKind, 'source-static-current-js-candidate');
  }
});

test('G5 L7 freeze and page-only release bind the same 55 source occurrences', async () => {
  const descriptor = G5_L7_PAGE_ONLY_COURSE_DESCRIPTOR;
  const freezeBytes = await readFile(path.join(projectRoot, descriptor.source.candidateFreezeManifestPath));
  assert.equal(digest(freezeBytes), descriptor.source.candidateFreezeManifestSha256);
  const freeze = JSON.parse(freezeBytes.toString('utf8'));
  assert.equal(freeze.selectedPages.length, 55);
  assert.equal(freeze.acceptanceEffects.published, false);
  const release = productReleaseDocument.releases.find((candidate) => candidate.releaseId === descriptor.releaseId);
  assert.ok(release);
  assert.equal(release.expectedCounts.members, 55);
  assert.equal(release.expectedCounts.courseShells, 0);
  assert.equal(release.sourceLesson.sha256, descriptor.source.sourceXmlSha256);
  assert.deepEqual(release.members.map((member) => [member.ordinal, member.animationId, member.xmlOccurrence]), descriptor.pages.map((page, index) => [index + 1, page.animationId, index + 1]));
  assert.ok(Object.values(descriptor.productBridge.acceptanceEffects).every((value) => value === false));
  assert.deepEqual(descriptor.sections.map(({code}) => code), G5_L7_PAGE_ONLY_CURRENT_JS.sections.map(({code}) => code));
});

test('G5 L7 is surfaced by the modern All Lessons availability projection', () => {
  const lesson = availableLearningLessons({NODE_ENV: 'development'}).find(({grade, lesson}) => grade === 5 && lesson === 7);
  assert.deepEqual(lesson, {
    activePageCount: 55,
    grade: 5,
    href: '/courses/5/7?mode=focus',
    lesson: 7,
    releaseId: 'lesson-g05-l07-add-subtract-multiply-divide-decimals-page-only',
    titleEnglish: 'Add, Subtract, Multiply & Divide Decimals',
    titleSpanish: null,
  });
  assert.equal(availableLearningLessons({NODE_ENV: 'production'}).some(({grade, lesson}) => grade === 5 && lesson === 7), false);
});
