import assert from 'node:assert/strict';
import test from 'node:test';

import {G4_L3_WHOLE_LESSON_PLAYER_DESCRIPTOR} from '../lib/g4-l3-whole-lesson-player-descriptor';
import {G5_L4_WHOLE_LESSON_PLAYER_DESCRIPTOR} from '../lib/g5-l4-whole-lesson-player-descriptor';
import {
  buildWholeLessonCourseRegistration,
  findWholeLessonCourseRegistration,
  wholeLessonCourseRegistrations,
} from '../lib/whole-lesson-course-registry';
import {
  resolveWholeLessonReleaseView,
  wholeLessonDescriptorMatchesNavigation,
  type PageOnlyLessonPlayerDescriptor,
} from '../lib/whole-lesson-player-descriptor';

function pageOnlyG5L4Descriptor(): PageOnlyLessonPlayerDescriptor {
  const legacy = G5_L4_WHOLE_LESSON_PLAYER_DESCRIPTOR;
  assert.ok(legacy);
  const pageIds = Object.freeze(
    legacy.pages.map((page) => page.animationId),
  );
  return Object.freeze({
    schemaVersion: 2,
    descriptorKind: 'formal-page-only-course',
    descriptorId: 'page-only-g05-l04-registration-test-v1',
    calibrationId: 'page-only-g05-l04-registration-test',
    releaseId: 'lesson-g05-l04-page-only-registration-test',
    course: Object.freeze({
      grade: legacy.course.grade,
      lesson: legacy.course.lesson,
      href: legacy.course.href,
      domIdPrefix: 'g5-l4-page-only-registration-test',
      activePageCount: legacy.pages.length,
      courseShellCount: 0,
      expectedReleaseMemberCount: legacy.pages.length,
      labels: legacy.course.labels,
    }),
    source: Object.freeze({
      navigationContractPath: legacy.source.navigationContractPath,
      sourceXmlPath: legacy.source.sourceXmlPath,
      sourceXmlSha256: legacy.source.sourceXmlSha256,
      sequenceAuthority: 'course-xml-occurrence',
      candidateFreezeManifestPath:
        'catalog/product-bridge-calibrations/page-only-g05-l04-registration-test.json',
      candidateFreezeManifestSha256: '0'.repeat(64),
    }),
    persistence: Object.freeze({
      schemaVersion: 1,
      storageKey: 'helpmath:g5-l4:page-only-registration-test:v1',
      scope: 'local-device-only',
      legacyCompatible: false,
    }),
    stage: legacy.stage,
    support: Object.freeze({
      locales: Object.freeze(['en', 'es'] as const),
      rendererRegistrySnapshot: 'current-javascript-module-registry',
      lessonHostCapabilities: Object.freeze([
        'audio',
        'glossary',
        'practice-feedback',
      ] as const),
    }),
    visualSkin: Object.freeze({
      kind: 'modern-my-lesson-page-only',
      layoutId: 'help-math-modern-my-lesson-page-only-v1',
      presentations: Object.freeze(['modern-wide'] as const),
      chromeAsset: '' as const,
      header: Object.freeze({height: 0 as const}),
      footer: Object.freeze({height: 0 as const}),
      controls: Object.freeze({
        kind: 'unresolved-modern-functional-equivalent',
        reason: 'The retained modern My Lesson host owns its controls.',
      }),
      evidence: Object.freeze({
        kind: 'product-owned-modern-my-lesson',
        calibrationId: 'page-only-g05-l04-registration-test',
      }),
    }),
    glossary: Object.freeze([]),
    productBridge: Object.freeze({
      selectedAnimationIds: pageIds,
      registeredAnimationCount: legacy.pages.length,
      pageOnlyDescriptorMemberCount: legacy.pages.length,
      acceptanceEffects: Object.freeze({
        authoritativeOriginalRuntime: false,
        fidelityAccepted: false,
        audioAccepted: false,
        humanVisualAccepted: false,
        ownerAccepted: false,
        strictComplete: false,
        published: false,
      }),
    }),
    sections: legacy.sections,
    pages: legacy.pages,
  });
}

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

test('legacy descriptor-driven registration requires live page modules and a bound shell implementation', () => {
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

test('formal registration admits an exact page-only schema 2 descriptor without a legacy shell', () => {
  const descriptor = pageOnlyG5L4Descriptor();
  assert.equal('shellAnimationId' in descriptor.course, false);
  assert.equal('shellImplementation' in descriptor, false);

  const registration = buildWholeLessonCourseRegistration({
    descriptor,
    player: {kind: 'descriptor-driven'},
  });
  assert.ok(registration);
  assert.equal(registration.descriptor.schemaVersion, 2);

  for (const drifted of [
    {
      ...descriptor,
      descriptorKind: 'private-page-only-product-bridge',
    },
    {
      ...descriptor,
      course: {...descriptor.course, courseShellCount: 1},
    },
    {
      ...descriptor,
      course: {
        ...descriptor.course,
        expectedReleaseMemberCount: descriptor.pages.length + 1,
      },
    },
    {
      ...descriptor,
      shellImplementation:
        G5_L4_WHOLE_LESSON_PLAYER_DESCRIPTOR?.shellImplementation,
    },
    {
      ...descriptor,
      productBridge: {
        ...descriptor.productBridge,
        registeredAnimationCount: descriptor.pages.length - 1,
      },
    },
    {
      ...descriptor,
      productBridge: {
        ...descriptor.productBridge,
        acceptanceEffects: {
          ...descriptor.productBridge.acceptanceEffects,
          published: true,
        },
      },
    },
    {
      ...descriptor,
      pages: descriptor.pages.map((page, index) => index === 0
        ? {
            ...page,
            rendererAvailability: {
              kind: 'registered' as const,
              moduleKey: descriptor.pages[1]!.animationId,
            },
          }
        : page),
    },
  ]) {
    assert.equal(
      buildWholeLessonCourseRegistration({
        descriptor: drifted as unknown as PageOnlyLessonPlayerDescriptor,
        player: {kind: 'descriptor-driven'},
      }),
      undefined,
    );
  }
});

test('page-only schema 2 remains cross-bound to navigation and release authority', () => {
  const descriptor = pageOnlyG5L4Descriptor();
  const navigation = {
    schemaVersion: 2 as const,
    releaseId: descriptor.releaseId,
    grade: descriptor.course.grade,
    lesson: descriptor.course.lesson,
    expectedMemberCount: descriptor.pages.length,
    activePageCount: descriptor.pages.length,
    courseShellCount: 0 as const,
    pages: descriptor.pages.map((page) => ({
      animationId: page.animationId,
      assetId: page.source.assetId!,
      globalPageOrdinal: page.globalPageOrdinal,
      sectionCode: page.sectionCode,
      sectionPageOrdinal: page.sectionPageOrdinal,
      sourceOccurrence: page.source.sourceOccurrence!,
    })),
  };
  assert.equal(
    wholeLessonDescriptorMatchesNavigation(descriptor, navigation),
    true,
  );
  assert.equal(
    wholeLessonDescriptorMatchesNavigation(descriptor, {
      ...navigation,
      pages: [
        navigation.pages[1]!,
        navigation.pages[0]!,
        ...navigation.pages.slice(2),
      ],
    }),
    false,
  );
  assert.equal(
    wholeLessonDescriptorMatchesNavigation(descriptor, {
      ...navigation,
      pages: navigation.pages.map((page, index) => index === 0
        ? {...page, assetId: `swf-${'f'.repeat(64)}`}
        : page),
    }),
    false,
  );
  assert.equal(
    wholeLessonDescriptorMatchesNavigation(descriptor, {
      ...navigation,
      schemaVersion: 1,
      courseShellCount: 1,
      expectedMemberCount: descriptor.pages.length + 1,
      shell: {animationId: 'shell-course-g05-l04-index-local'},
    }),
    false,
  );

  const strictPages = new Set(
    descriptor.pages.map((page) => page.animationId),
  );
  const unpublished = resolveWholeLessonReleaseView(descriptor, {
    releaseId: descriptor.releaseId,
    releasePublished: false,
    strictCompleteAnimationIds: strictPages,
  });
  assert.equal(unpublished.requiredMemberCount, descriptor.pages.length);
  assert.equal(
    unpublished.strictCompleteMemberCount,
    descriptor.pages.length,
  );
  assert.equal(unpublished.strictCompletion, true);
  assert.equal(unpublished.publicRelease, false);

  const published = resolveWholeLessonReleaseView(descriptor, {
    releaseId: descriptor.releaseId,
    releasePublished: true,
    strictCompleteAnimationIds: strictPages,
  });
  assert.equal(published.publicRelease, true);

  const privateCalibration = resolveWholeLessonReleaseView({
    ...descriptor,
    descriptorKind: 'private-page-only-product-bridge',
  }, {
    releaseId: descriptor.releaseId,
    releasePublished: true,
    strictCompleteAnimationIds: strictPages,
  });
  assert.equal(privateCalibration.currentJsCandidate, false);
  assert.equal(privateCalibration.strictCompleteMemberCount, 0);
  assert.equal(privateCalibration.strictCompletion, false);
  assert.equal(privateCalibration.publicRelease, false);

  const wrongAuthority = resolveWholeLessonReleaseView(descriptor, {
    releaseId: 'lesson-g05-l04-wrong-release',
    releasePublished: true,
    strictCompleteAnimationIds: strictPages,
  });
  assert.equal(wrongAuthority.strictCompleteMemberCount, 0);
  assert.equal(wrongAuthority.strictCompletion, false);
  assert.equal(wrongAuthority.publicRelease, false);
});
