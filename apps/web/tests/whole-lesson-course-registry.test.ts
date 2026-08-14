import assert from 'node:assert/strict';
import test from 'node:test';

import {G4_L3_WHOLE_LESSON_PLAYER_DESCRIPTOR} from '../lib/g4-l3-whole-lesson-player-descriptor';
import {G5_L4_WHOLE_LESSON_PLAYER_DESCRIPTOR} from '../lib/g5-l4-whole-lesson-player-descriptor';
import {
  buildWholeLessonCourseRegistration,
  findWholeLessonCourseRegistration,
  wholeLessonCourseRegistrations,
} from '../lib/whole-lesson-course-registry';

test('course registry owns the exact G4 L3 and G5 L4 player bindings', () => {
  const registrations = wholeLessonCourseRegistrations();

  assert.equal(Object.isFrozen(registrations), true);
  assert.equal(registrations.length, 2);
  assert.equal(
    new Set(registrations.map(({descriptor}) => descriptor.releaseId)).size,
    registrations.length,
  );
  assert.equal(
    new Set(registrations.map(({descriptor}) => descriptor.course.href)).size,
    registrations.length,
  );

  const g4 = findWholeLessonCourseRegistration(4, 3);
  assert.ok(g4);
  assert.equal(g4.descriptor, G4_L3_WHOLE_LESSON_PLAYER_DESCRIPTOR);
  assert.deepEqual(g4.player, {
    kind: 'preserved-custom',
    component: 'g4-l3-whole-lesson-player',
    descriptorId: 'whole-lesson-player-g04-l03-v1',
  });

  const g5 = findWholeLessonCourseRegistration('5', '04');
  assert.ok(g5);
  assert.equal(g5.descriptor, G5_L4_WHOLE_LESSON_PLAYER_DESCRIPTOR);
  assert.deepEqual(g5.player, {kind: 'descriptor-driven'});
  assert.equal(findWholeLessonCourseRegistration(4, 4), undefined);
  assert.equal(findWholeLessonCourseRegistration('grade-4', 3), undefined);
});

test('registration validation fails closed on descriptor and preserved-player drift', () => {
  const descriptor = G4_L3_WHOLE_LESSON_PLAYER_DESCRIPTOR;

  assert.equal(
    buildWholeLessonCourseRegistration({
      descriptor: undefined,
      player: {kind: 'descriptor-driven'},
    }),
    undefined,
  );
  assert.equal(
    buildWholeLessonCourseRegistration({
      descriptor: {
        ...descriptor,
        course: {...descriptor.course, href: '/courses/4/4'},
      },
      player: {kind: 'descriptor-driven'},
    }),
    undefined,
  );
  assert.equal(
    buildWholeLessonCourseRegistration({
      descriptor: {
        ...descriptor,
        descriptorId: 'stale-g4-player-descriptor',
      },
      player: {
        kind: 'preserved-custom',
        component: 'g4-l3-whole-lesson-player',
        descriptorId: 'whole-lesson-player-g04-l03-v1',
      },
    }),
    undefined,
  );
});

test('descriptor-driven registration requires live page modules and a bound shell implementation', () => {
  const g5Descriptor = G5_L4_WHOLE_LESSON_PLAYER_DESCRIPTOR;
  assert.ok(g5Descriptor);
  assert.equal(
    buildWholeLessonCourseRegistration({
      descriptor: G4_L3_WHOLE_LESSON_PLAYER_DESCRIPTOR,
      player: {kind: 'descriptor-driven'},
    }),
    undefined,
  );

  const unavailablePageDescriptor = {
    ...g5Descriptor,
    pages: g5Descriptor.pages.map((page, index) =>
      index === 0
        ? {...page, rendererAvailability: {
            kind: 'unavailable' as const,
            reason: 'animation-module-not-registered',
          }}
        : page
    ),
  };
  assert.equal(
    buildWholeLessonCourseRegistration({
      descriptor: unavailablePageDescriptor,
      player: {kind: 'descriptor-driven'},
    }),
    undefined,
  );

  const unregisteredModuleDescriptor = {
    ...g5Descriptor,
    pages: g5Descriptor.pages.map((page, index) =>
      index === 0
        ? {...page, rendererAvailability: {
            kind: 'registered' as const,
            moduleKey: 'course-g04-l04-placeholder',
          }}
        : page
    ),
  };
  assert.equal(
    buildWholeLessonCourseRegistration({
      descriptor: unregisteredModuleDescriptor,
      player: {kind: 'descriptor-driven'},
    }),
    undefined,
  );

  const valid = buildWholeLessonCourseRegistration({
    descriptor: g5Descriptor,
    player: {kind: 'descriptor-driven'},
  });
  assert.ok(valid);
  assert.deepEqual(valid.player, {kind: 'descriptor-driven'});
});
