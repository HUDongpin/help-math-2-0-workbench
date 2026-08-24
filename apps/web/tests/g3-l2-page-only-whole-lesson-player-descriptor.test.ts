import assert from 'node:assert/strict';
import test from 'node:test';

import {
  G3_L2_WHOLE_LESSON_PLAYER_DESCRIPTOR,
} from '../lib/g3-l2-whole-lesson-player-descriptor';
import {
  findWholeLessonCourseRegistration,
} from '../lib/whole-lesson-course-registry';
import {
  resolveWholeLessonReleaseView,
} from '../lib/whole-lesson-player-descriptor';

test('G3 L2 descriptor is a 70-page modern-host sequence with no shell denominator', () => {
  const descriptor = G3_L2_WHOLE_LESSON_PLAYER_DESCRIPTOR;
  assert.ok(descriptor);
  assert.equal(descriptor.course.activePageCount, 70);
  assert.equal(descriptor.course.courseShellCount, 0);
  assert.equal(descriptor.course.expectedReleaseMemberCount, 70);
  assert.equal(descriptor.schemaVersion, 2);
  assert.equal(descriptor.descriptorKind, 'formal-page-only-course');
  assert.equal(Object.hasOwn(descriptor.course, 'shellAnimationId'), false);
  assert.equal(Object.hasOwn(descriptor, 'shellImplementation'), false);
  assert.equal(descriptor.visualSkin.kind, 'modern-my-lesson-page-only');
  assert.deepEqual(descriptor.visualSkin.presentations, ['modern-wide']);
  assert.deepEqual(
    descriptor.sections.map(({code, activePageCount}) =>
      [code, activePageCount]),
    [
      ['IR', 1],
      ['RW', 4],
      ['VB', 13],
      ['IN', 31],
      ['TI', 9],
      ['GS', 2],
      ['TS', 7],
      ['FQ', 3],
    ],
  );
  assert.equal(descriptor.pages.length, 70);
  descriptor.pages.forEach((page, index) => {
    assert.equal(
      page.placementId,
      `g03-l02-placement-${String(index + 1).padStart(3, '0')}`,
    );
    assert.equal(page.globalPageOrdinal, index + 1);
    assert.equal(
      page.previousAnimationId,
      descriptor.pages[index - 1]?.animationId ?? null,
    );
    assert.equal(
      page.nextAnimationId,
      descriptor.pages[index + 1]?.animationId ?? null,
    );
    assert.equal(page.rendererAvailability.kind, 'registered');
    if (page.rendererAvailability.kind === 'registered') {
      assert.equal(page.rendererAvailability.moduleKey, page.animationId);
      assert.equal(
        page.rendererAvailability.runtimeQuery?.language,
        'fixed-en',
      );
      assert.equal(
        page.rendererAvailability.runtimeQuery?.scenario,
        'source-static-frame',
      );
    }
  });
});

test('G3 L2 registration and release view count pages only', () => {
  const descriptor = G3_L2_WHOLE_LESSON_PLAYER_DESCRIPTOR!;
  const registration = findWholeLessonCourseRegistration(3, 2);
  assert.ok(registration);
  assert.equal(registration.descriptor.descriptorId, descriptor.descriptorId);
  assert.equal(registration.player.kind, 'descriptor-driven');

  const candidate = resolveWholeLessonReleaseView(descriptor, {
    releaseId: descriptor.releaseId,
    releasePublished: false,
    strictCompleteAnimationIds: new Set(),
  });
  assert.equal(candidate.currentJsCandidate, true);
  assert.equal(candidate.currentJsPageCount, 70);
  assert.equal(candidate.requiredMemberCount, 70);
  assert.equal(candidate.strictCompleteMemberCount, 0);
  assert.equal(candidate.strictCompletion, false);
  assert.equal(candidate.publicRelease, false);

  const hypotheticalPageOnlyStrict = resolveWholeLessonReleaseView(
    descriptor,
    {
      releaseId: descriptor.releaseId,
      releasePublished: false,
      strictCompleteAnimationIds: new Set(
        descriptor.pages.map(({animationId}) => animationId),
      ),
    },
  );
  assert.equal(hypotheticalPageOnlyStrict.requiredMemberCount, 70);
  assert.equal(hypotheticalPageOnlyStrict.strictCompleteMemberCount, 70);
  assert.equal(hypotheticalPageOnlyStrict.strictCompletion, true);
  assert.equal(hypotheticalPageOnlyStrict.publicRelease, false);
});
