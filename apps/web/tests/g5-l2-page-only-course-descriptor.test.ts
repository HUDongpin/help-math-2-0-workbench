import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

import productReleaseDocument from '../../../catalog/page-only-current-js-product-releases.json' with {type: 'json'};
import {G5_L2_PAGE_ONLY_CURRENT_JS} from '../lib/g5-l2-page-only-current-js.generated';
import {G5_L2_PAGE_ONLY_COURSE_DESCRIPTOR} from '../lib/g5-l2-page-only-course-descriptor';
import {availableLearningLessons} from '../lib/learning-lesson-availability.server';

const projectRoot = path.resolve(import.meta.dirname, '../../..');
const digest = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');

test('G5 L2 is a complete 64-placement page-only descriptor with source order', () => {
  const descriptor = G5_L2_PAGE_ONLY_COURSE_DESCRIPTOR;
  assert.equal(descriptor.descriptorKind, 'formal-page-only-course');
  assert.equal(descriptor.descriptorId, 'g5-l2-formal-page-only-course-v1');
  assert.equal(descriptor.course.grade, 5);
  assert.equal(descriptor.course.lesson, 2);
  assert.equal(descriptor.course.activePageCount, 64);
  assert.equal(descriptor.course.courseShellCount, 0);
  assert.equal(descriptor.course.expectedReleaseMemberCount, 64);
  assert.deepEqual(descriptor.sections.map(({code, activePageCount}) => [code, activePageCount]), [
    ['IR', 1], ['RW', 4], ['VB', 10], ['IN', 27], ['TI', 11], ['GS', 1], ['TS', 7], ['FQ', 3],
  ]);
  assert.equal(descriptor.pages.length, 64);
  for (const [index, page] of descriptor.pages.entries()) {
    assert.equal(page.globalPageOrdinal, index + 1);
    assert.equal(page.source.sourceOccurrence, index + 1);
    assert.equal(page.placementId, `g05-l02-placement-${String(index + 1).padStart(3, '0')}`);
    assert.equal(page.previousAnimationId, descriptor.pages[index - 1]?.animationId ?? null);
    assert.equal(page.nextAnimationId, descriptor.pages[index + 1]?.animationId ?? null);
    assert.equal(page.rendererAvailability.kind, 'registered');
    assert.equal(page.runtimeEvidenceBoundary?.runtimeKind, 'source-static-current-js-candidate');
  }
});

test('G5 L2 freeze and page-only release bind the same 64 source occurrences', async () => {
  const descriptor = G5_L2_PAGE_ONLY_COURSE_DESCRIPTOR;
  const freezeBytes = await readFile(path.join(projectRoot, descriptor.source.candidateFreezeManifestPath));
  assert.equal(digest(freezeBytes), descriptor.source.candidateFreezeManifestSha256);
  const freeze = JSON.parse(freezeBytes.toString('utf8'));
  assert.equal(freeze.selectedPages.length, 64);
  assert.equal(freeze.acceptanceEffects.published, false);
  const release = productReleaseDocument.releases.find((candidate) => candidate.releaseId === descriptor.releaseId);
  assert.ok(release);
  assert.equal(release.expectedCounts.members, 64);
  assert.equal(release.expectedCounts.courseShells, 0);
  assert.equal(release.sourceLesson.sha256, descriptor.source.sourceXmlSha256);
  assert.deepEqual(release.members.map((member) => [member.ordinal, member.animationId, member.xmlOccurrence]), descriptor.pages.map((page, index) => [index + 1, page.animationId, index + 1]));
  assert.ok(Object.values(descriptor.productBridge.acceptanceEffects).every((value) => value === false));
  assert.deepEqual(descriptor.sections.map(({code}) => code), G5_L2_PAGE_ONLY_CURRENT_JS.sections.map(({code}) => code));
});

test('G5 L2 is surfaced by the modern All Lessons availability projection', () => {
  const lesson = availableLearningLessons({NODE_ENV: 'development'}).find(({grade, lesson}) => grade === 5 && lesson === 2);
  assert.deepEqual(lesson, {
    activePageCount: 64,
    grade: 5,
    href: '/courses/5/2?mode=focus',
    lesson: 2,
    releaseId: 'lesson-g05-l02-percents-page-only',
    titleEnglish: 'Percents',
    titleSpanish: null,
  });
  assert.equal(availableLearningLessons({NODE_ENV: 'production'}).some(({grade, lesson}) => grade === 5 && lesson === 2), false);
});
