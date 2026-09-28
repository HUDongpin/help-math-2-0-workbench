import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

import productReleaseDocument from '../../../catalog/page-only-current-js-product-releases.json' with {type: 'json'};
import {G4_L9_PAGE_ONLY_CURRENT_JS} from '../lib/g4-l9-page-only-current-js.generated';
import {G4_L9_PAGE_ONLY_COURSE_DESCRIPTOR} from '../lib/g4-l9-page-only-course-descriptor';
import {availableLearningLessons} from '../lib/learning-lesson-availability.server';

const projectRoot = path.resolve(import.meta.dirname, '../../..');
const digest = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');

test('G4 L9 is a complete 43-placement page-only descriptor with source order', () => {
  const descriptor = G4_L9_PAGE_ONLY_COURSE_DESCRIPTOR;
  assert.equal(descriptor.descriptorKind, 'formal-page-only-course');
  assert.equal(descriptor.descriptorId, 'g4-l9-formal-page-only-course-v1');
  assert.equal(descriptor.course.grade, 4);
  assert.equal(descriptor.course.lesson, 9);
  assert.equal(descriptor.course.activePageCount, 43);
  assert.equal(descriptor.course.courseShellCount, 0);
  assert.equal(descriptor.course.expectedReleaseMemberCount, 43);
  assert.deepEqual(descriptor.sections.map(({code, activePageCount}) => [code, activePageCount]), [
    ['IR', 1], ['RW', 3], ['VB', 10], ['IN', 12], ['TI', 6], ['GS', 1], ['TS', 7], ['FQ', 3],
  ]);
  assert.equal(descriptor.pages.length, 43);
  for (const [index, page] of descriptor.pages.entries()) {
    assert.equal(page.globalPageOrdinal, index + 1);
    assert.equal(page.source.sourceOccurrence, index + 1);
    assert.equal(page.placementId, `g04-l09-placement-${String(index + 1).padStart(3, '0')}`);
    assert.equal(page.previousAnimationId, descriptor.pages[index - 1]?.animationId ?? null);
    assert.equal(page.nextAnimationId, descriptor.pages[index + 1]?.animationId ?? null);
    assert.equal(page.rendererAvailability.kind, 'registered');
    assert.equal(page.runtimeEvidenceBoundary?.runtimeKind, 'source-static-current-js-candidate');
  }
});

test('G4 L9 freeze and page-only release bind the same 43 source occurrences', async () => {
  const descriptor = G4_L9_PAGE_ONLY_COURSE_DESCRIPTOR;
  const freezeBytes = await readFile(path.join(projectRoot, descriptor.source.candidateFreezeManifestPath));
  assert.equal(digest(freezeBytes), descriptor.source.candidateFreezeManifestSha256);
  const freeze = JSON.parse(freezeBytes.toString('utf8'));
  assert.equal(freeze.selectedPages.length, 43);
  assert.equal(freeze.acceptanceEffects.published, false);
  const release = productReleaseDocument.releases.find((candidate) => candidate.releaseId === descriptor.releaseId);
  assert.ok(release);
  assert.equal(release.expectedCounts.members, 43);
  assert.equal(release.expectedCounts.courseShells, 0);
  assert.equal(release.sourceLesson.sha256, descriptor.source.sourceXmlSha256);
  assert.deepEqual(release.members.map((member) => [member.ordinal, member.animationId, member.xmlOccurrence]), descriptor.pages.map((page, index) => [index + 1, page.animationId, index + 1]));
  assert.ok(Object.values(descriptor.productBridge.acceptanceEffects).every((value) => value === false));
  assert.deepEqual(descriptor.sections.map(({code}) => code), G4_L9_PAGE_ONLY_CURRENT_JS.sections.map(({code}) => code));
});

test('G4 L9 is surfaced by the modern All Lessons availability projection', () => {
  const lesson = availableLearningLessons({NODE_ENV: 'development'}).find(({grade, lesson}) => grade === 4 && lesson === 9);
  assert.deepEqual(lesson, {
    activePageCount: 43,
    grade: 4,
    href: '/courses/4/9?mode=focus',
    lesson: 9,
    releaseId: 'lesson-g04-l09-equations-page-only',
    titleEnglish: 'Equations',
    titleSpanish: null,
  });
  assert.equal(availableLearningLessons({NODE_ENV: 'production'}).some(({grade, lesson}) => grade === 4 && lesson === 9), false);
});
