import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

import catalogReleaseDocument from '../../../catalog/lesson-releases.json' with
  {type: 'json'};
import productReleaseDocument from
  '../../../catalog/page-only-current-js-product-releases.json' with
  {type: 'json'};

import {
  G4_L3_PAGE_ONLY_COURSE_DESCRIPTOR,
  G5_L4_PAGE_ONLY_COURSE_DESCRIPTOR,
} from '../lib/g4-l3-g5-l4-page-only-course-descriptors.server';
import {wholeLessonCourseRegistrations} from
  '../lib/whole-lesson-course-registry';

const projectRoot = path.resolve(import.meta.dirname, '../../..');
const expectedLessons = Object.freeze([
  Object.freeze({grade: 3, lesson: 2, pages: 70}),
  Object.freeze({grade: 4, lesson: 3, pages: 39}),
  Object.freeze({grade: 4, lesson: 5, pages: 53}),
  Object.freeze({grade: 4, lesson: 10, pages: 46}),
  Object.freeze({grade: 4, lesson: 11, pages: 43}),
  Object.freeze({grade: 5, lesson: 3, pages: 65}),
  Object.freeze({grade: 5, lesson: 4, pages: 54}),
  Object.freeze({grade: 5, lesson: 5, pages: 56}),
]);

test('G4 L3 and G5 L4 formal adapters exclude both legacy shells', async () => {
  assert.ok(G4_L3_PAGE_ONLY_COURSE_DESCRIPTOR);
  assert.ok(G5_L4_PAGE_ONLY_COURSE_DESCRIPTOR);

  for (const descriptor of [
    G4_L3_PAGE_ONLY_COURSE_DESCRIPTOR,
    G5_L4_PAGE_ONLY_COURSE_DESCRIPTOR,
  ]) {
    assert.equal(descriptor.schemaVersion, 2);
    assert.equal(descriptor.descriptorKind, 'formal-page-only-course');
    assert.equal(descriptor.course.courseShellCount, 0);
    assert.equal(
      descriptor.course.expectedReleaseMemberCount,
      descriptor.pages.length,
    );
    assert.equal('shellAnimationId' in descriptor.course, false);
    assert.equal('shellImplementation' in descriptor, false);
    assert.ok(descriptor.pages.every((page, index) =>
      page.globalPageOrdinal === index + 1 &&
      page.source.sourceOccurrence === index + 1 &&
      /^swf-[a-f0-9]{64}$/.test(page.source.assetId ?? '') &&
      page.rendererAvailability.kind === 'registered'
    ));

    const bytes = await readFile(path.join(
      projectRoot,
      descriptor.source.candidateFreezeManifestPath,
    ));
    assert.equal(
      createHash('sha256').update(bytes).digest('hex'),
      descriptor.source.candidateFreezeManifestSha256,
    );
  }
});

test('all eight complete lessons have an exact page-only release binding', () => {
  const registrations = wholeLessonCourseRegistrations();
  const releases = [
    ...catalogReleaseDocument.releases,
    ...productReleaseDocument.releases,
  ];
  assert.equal(registrations.length, expectedLessons.length);
  assert.equal(
    registrations.reduce(
      (count, registration) => count + registration.descriptor.pages.length,
      0,
    ),
    426,
  );
  assert.equal(
    registrations.reduce(
      (count, registration) => count + new Set(
        registration.descriptor.pages.map((page) => page.animationId),
      ).size,
      0,
    ),
    425,
  );

  for (const [index, registration] of registrations.entries()) {
    const expected = expectedLessons[index]!;
    const {descriptor} = registration;
    assert.deepEqual(
      {
        grade: descriptor.course.grade,
        lesson: descriptor.course.lesson,
        pages: descriptor.pages.length,
      },
      expected,
    );
    assert.equal(descriptor.schemaVersion, 2);
    assert.equal(descriptor.course.courseShellCount, 0);
    const candidates = releases.filter((release) =>
      release.releaseId === descriptor.releaseId &&
      release.grade === descriptor.course.grade &&
      release.lesson === descriptor.course.lesson &&
      release.scope.pageOnly === true &&
      release.scope.legacyFlashCourseShellExcluded === true &&
      release.scope.modernMyLessonHostRetained === true &&
      release.expectedCounts.courseShells === 0 &&
      release.expectedCounts.members === descriptor.pages.length &&
      release.sourceLesson.sha256 === descriptor.source.sourceXmlSha256 &&
      release.members.length === descriptor.pages.length
    );
    assert.ok(candidates.some((release) => release.members.every(
      (member, memberIndex) => {
        const page = descriptor.pages[memberIndex];
        return page !== undefined &&
          member.ordinal === memberIndex + 1 &&
          member.releaseRole === 'active-xml-referenced-page' &&
          member.xmlOccurrence === memberIndex + 1 &&
          member.placementId === page.placementId &&
          member.animationId === page.animationId &&
          member.assetId === page.source.assetId;
      },
    )), `G${descriptor.course.grade} L${descriptor.course.lesson}`);
  }
});
