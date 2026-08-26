#!/usr/bin/env node

import assert from "node:assert/strict";

import catalogReleaseDocument from "../catalog/lesson-releases.json" with
  {type: "json"};
import productReleaseDocument from
  "../catalog/page-only-current-js-product-releases.json" with {type: "json"};
import {wholeLessonCourseRegistrations} from
  "../apps/web/lib/whole-lesson-course-registry.ts";

const SCOPE_DENOMINATOR = 1_751;
const EXPECTED_PAGE_OCCURRENCES = 426;
const EXPECTED_UNIQUE_RENDERERS = 425;
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

const registrations = wholeLessonCourseRegistrations();
const releases = [
  ...catalogReleaseDocument.releases,
  ...productReleaseDocument.releases,
];
assert.equal(registrations.length, expectedLessons.length);

const animationOccurrences = [];
const lessonResults = [];
for (const [index, registration] of registrations.entries()) {
  const expected = expectedLessons[index];
  assert.ok(expected);
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
  assert.equal(descriptor.descriptorKind, "formal-page-only-course");
  assert.equal(descriptor.course.courseShellCount, 0);
  assert.equal(descriptor.course.expectedReleaseMemberCount,
    descriptor.pages.length);
  assert.equal("shellAnimationId" in descriptor.course, false);
  assert.equal("shellImplementation" in descriptor, false);
  assert.equal(new Set(descriptor.pages.map(({placementId}) => placementId)).size,
    descriptor.pages.length);
  assert.ok(descriptor.pages.every((page, pageIndex) =>
    page.globalPageOrdinal === pageIndex + 1
      && page.source.sourceOccurrence === pageIndex + 1
      && page.rendererAvailability.kind === "registered"
      && /^swf-[a-f0-9]{64}$/u.test(page.source.assetId ?? "")
  ));

  const boundRelease = releases.find((release) =>
    release.releaseId === descriptor.releaseId
      && release.grade === expected.grade
      && release.lesson === expected.lesson
      && release.scope.pageOnly === true
      && release.scope.legacyFlashCourseShellExcluded === true
      && release.scope.modernMyLessonHostRetained === true
      && release.expectedCounts.courseShells === 0
      && release.expectedCounts.members === descriptor.pages.length
      && release.members.length === descriptor.pages.length
      && release.members.every((member, memberIndex) => {
        const page = descriptor.pages[memberIndex];
        return page
          && member.ordinal === memberIndex + 1
          && member.releaseRole === "active-xml-referenced-page"
          && member.xmlOccurrence === memberIndex + 1
          && member.placementId === page.placementId
          && member.animationId === page.animationId
          && member.assetId === page.source.assetId;
      })
  );
  assert.ok(boundRelease,
    `G${expected.grade} L${expected.lesson}: exact page-only release missing`);

  animationOccurrences.push(...descriptor.pages.map(({animationId}) =>
    animationId));
  lessonResults.push(Object.freeze({
    grade: expected.grade,
    lesson: expected.lesson,
    pageOccurrences: descriptor.pages.length,
    uniqueRenderers: new Set(
      descriptor.pages.map(({animationId}) => animationId),
    ).size,
    schemaVersion: descriptor.schemaVersion,
    courseShellCount: descriptor.course.courseShellCount,
    releaseId: descriptor.releaseId,
  }));
}

assert.equal(animationOccurrences.length, EXPECTED_PAGE_OCCURRENCES);
assert.equal(new Set(animationOccurrences).size, EXPECTED_UNIQUE_RENDERERS);
const duplicateRenderers = [...new Set(animationOccurrences.filter(
  (animationId, index) => animationOccurrences.indexOf(animationId) !== index,
))].sort();
assert.equal(duplicateRenderers.length, 1);

process.stdout.write(`${JSON.stringify({
  status: "PASS",
  scopeDenominator: SCOPE_DENOMINATOR,
  registeredPageOccurrences: animationOccurrences.length,
  uniqueRenderers: new Set(animationOccurrences).size,
  remainingPageOccurrences:
    SCOPE_DENOMINATOR - animationOccurrences.length,
  schemaVersion: 2,
  courseShellCount: 0,
  duplicateRenderers,
  lessons: lessonResults,
}, null, 2)}\n`);
