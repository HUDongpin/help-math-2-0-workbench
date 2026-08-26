import assert from 'node:assert/strict';
import test from 'node:test';

import productReleaseDocument from
  '../../../catalog/page-only-current-js-product-releases.json' with
  {type: 'json'};
import {G4_PAGE_ONLY_COURSE_DESCRIPTORS} from
  '../lib/g4-page-only-course-descriptors.server';
import {findPageOnlyCurrentJsNavigationForRoute} from
  '../lib/page-only-current-js-navigation.server';
import {findWholeLessonCourseRegistration} from
  '../lib/whole-lesson-course-registry';
import {wholeLessonDescriptorMatchesNavigation} from
  '../lib/whole-lesson-player-descriptor';

const expected = Object.freeze([
  Object.freeze({lesson: 5, count: 53}),
  Object.freeze({lesson: 10, count: 46}),
  Object.freeze({lesson: 11, count: 43}),
]);

test('G4 L5/L10/L11 register one formal page-only My Lesson sequence', () => {
  assert.equal(
    G4_PAGE_ONLY_COURSE_DESCRIPTORS.reduce(
      (count, descriptor) => count + descriptor.pages.length,
      0,
    ),
    142,
  );

  for (const {lesson, count} of expected) {
    const registration = findWholeLessonCourseRegistration(4, lesson);
    const navigation = findPageOnlyCurrentJsNavigationForRoute(4, lesson);
    assert.ok(registration, `G4 L${lesson}: course registration absent`);
    assert.ok(navigation, `G4 L${lesson}: navigation absent`);
    assert.equal(registration.player.kind, 'descriptor-driven');
    assert.equal(registration.descriptor.schemaVersion, 2);
    assert.equal(
      registration.descriptor.descriptorKind,
      'formal-page-only-course',
    );
    assert.equal(registration.descriptor.course.href, `/courses/4/${lesson}`);
    assert.equal(registration.descriptor.course.activePageCount, count);
    assert.equal(registration.descriptor.course.courseShellCount, 0);
    assert.equal(registration.descriptor.pages.length, count);
    assert.deepEqual(
      registration.descriptor.pages.map(
        ({globalPageOrdinal}) => globalPageOrdinal,
      ),
      Array.from({length: count}, (_, index) => index + 1),
    );
    assert.ok(wholeLessonDescriptorMatchesNavigation(
      registration.descriptor,
      navigation,
    ));
    assert.equal(navigation.activePageCount, count);
    assert.equal(navigation.courseShellCount, 0);
    assert.equal(navigation.pages.length, count);

    const release = productReleaseDocument.releases.find((candidate) =>
      candidate.grade === 4 && candidate.lesson === lesson
    );
    assert.ok(release, `G4 L${lesson}: product release absent`);
    assert.equal(release.expectedCounts.members, count);
    assert.equal(release.expectedCounts.courseShells, 0);
    assert.equal(release.scope.pageOnly, true);
    assert.equal(release.scope.legacyFlashCourseShellExcluded, true);
    assert.equal(release.scope.modernMyLessonHostRetained, true);
    assert.deepEqual(
      release.members.map(({animationId}) => animationId),
      registration.descriptor.pages.map(({animationId}) => animationId),
    );
    assert.ok(Object.values(
      registration.descriptor.productBridge.acceptanceEffects,
    ).every((value) => value === false));
  }
});
