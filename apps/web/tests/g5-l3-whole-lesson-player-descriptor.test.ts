import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {
  hasAnimationModule,
  loadAnimationModule,
} from '../../../packages/demos/src/animation-registry';
import {
  buildG5L3WholeLessonPlayerDescriptor,
  G5_L3_PAGE_ONLY_RELEASE_ID,
  G5_L3_WHOLE_LESSON_PLAYER_DESCRIPTOR,
} from '../lib/g5-l3-whole-lesson-player-descriptor';
import {findPageOnlyCurrentJsNavigationForRoute} from '../lib/page-only-current-js-navigation.server';
import {
  resolveWholeLessonReleaseView,
  wholeLessonDescriptorMatchesNavigation,
} from '../lib/whole-lesson-player-descriptor';

const sourceScopeUrl = new URL(
  '../../../reports/g5-l3-page-only-whole-lesson-source-scope.json',
  import.meta.url,
);

test('G5 L3 descriptor preserves 65 source placements, 64 renderers, and no legacy shell', async () => {
  const descriptor = G5_L3_WHOLE_LESSON_PLAYER_DESCRIPTOR;
  assert.ok(descriptor);
  const sourceScope = await readFile(sourceScopeUrl, 'utf8').then(JSON.parse);

  assert.equal(descriptor.releaseId, G5_L3_PAGE_ONLY_RELEASE_ID);
  assert.equal(descriptor.course.activePageCount, 65);
  assert.equal(descriptor.course.expectedReleaseMemberCount, 65);
  assert.equal(descriptor.course.courseShellCount, 0);
  assert.equal(descriptor.schemaVersion, 2);
  assert.equal(descriptor.descriptorKind, 'formal-page-only-course');
  assert.equal(Object.hasOwn(descriptor.course, 'shellAnimationId'), false);
  assert.equal(Object.hasOwn(descriptor, 'shellImplementation'), false);
  assert.equal(descriptor.pages.length, 65);
  assert.equal(descriptor.sections.length, 8);
  assert.equal(new Set(descriptor.pages.map((page) => page.placementId)).size, 65);
  assert.equal(new Set(descriptor.pages.map((page) => page.animationId)).size, 64);
  assert.deepEqual(
    descriptor.pages.map((page) => page.placementId),
    sourceScope.pages.map(({placementId}: {placementId: string}) => placementId),
  );
  assert.deepEqual(
    descriptor.pages.map((page) => page.animationId),
    sourceScope.pages.map(({animationId}: {animationId: string}) => animationId),
  );
  assert.deepEqual(
    descriptor.sections.map((section) => [section.code, section.activePageCount]),
    [
      ['IR', 1], ['RW', 3], ['VB', 14], ['IN', 28],
      ['TI', 8], ['GS', 1], ['TS', 7], ['FQ', 3],
    ],
  );
  assert.equal(descriptor.visualSkin.kind, 'modern-my-lesson-page-only');
  assert.deepEqual(descriptor.visualSkin.presentations, ['modern-wide']);
  assert.equal(descriptor.visualSkin.header.height, 0);
  assert.equal(descriptor.visualSkin.footer.height, 0);
  assert.equal(descriptor.source.sourceXmlSha256,
    '577949b297729ef79e5782ea36c6318853fb61a261bb0e72e9aa7b7443479a81');
});

test('G5 L3 descriptor registers every placement while reusing IN028 exactly twice', async () => {
  const descriptor = G5_L3_WHOLE_LESSON_PLAYER_DESCRIPTOR;
  assert.ok(descriptor);
  assert.ok(descriptor.pages.every(
    (page) => page.rendererAvailability.kind === 'registered' &&
      page.rendererAvailability.moduleKey === page.animationId &&
      page.rendererAvailability.runtimeQuery?.language === 'fixed-en' &&
      page.rendererAvailability.runtimeQuery.scenario === 'source-static-frame' &&
      page.rendererAvailability.runtimeQuery.seed === '0',
  ));
  assert.ok(descriptor.pages.every((page) => hasAnimationModule(page.animationId)));

  const first = descriptor.pages[44]!;
  const second = descriptor.pages[45]!;
  assert.equal(first.placementId, 'g05-l03-placement-045');
  assert.equal(second.placementId, 'g05-l03-placement-046');
  assert.equal(first.animationId, 'course-g05-l03-in-028');
  assert.equal(second.animationId, first.animationId);
  assert.equal(first.source.assetId, second.source.assetId);
  assert.equal(first.sectionPageOrdinal, 27);
  assert.equal(second.sectionPageOrdinal, 28);
  assert.equal(first.nextPlacementId, second.placementId);
  assert.equal(second.previousPlacementId, first.placementId);

  const uniqueRendererIds = [...new Set(
    descriptor.pages.map((page) => page.animationId),
  )];
  const modules = await Promise.all(uniqueRendererIds.map(loadAnimationModule));
  assert.equal(uniqueRendererIds.length, 64);
  assert.equal(modules.filter(Boolean).length, 64);
  assert.ok(modules.every((module) =>
    module?.movie.stage.width === 800 && module.movie.stage.height === 600
  ));
});

test('G5 L3 whole-lesson descriptor cross-binds to the checked-in product navigation', () => {
  const descriptor = G5_L3_WHOLE_LESSON_PLAYER_DESCRIPTOR;
  assert.ok(descriptor);
  const navigation = findPageOnlyCurrentJsNavigationForRoute(5, 3);
  assert.ok(navigation);
  assert.equal(
    wholeLessonDescriptorMatchesNavigation(descriptor, navigation),
    true,
  );
  assert.equal(
    wholeLessonDescriptorMatchesNavigation(descriptor, {
      ...navigation,
      pages: navigation.pages.map((page, index) =>
        index === 45
          ? {...page, placementId: navigation.pages[44]!.placementId}
          : page
      ),
    }),
    false,
  );
});

test('G5 L3 release view keeps Current-JS separate from strict completion and publication', () => {
  const descriptor = G5_L3_WHOLE_LESSON_PLAYER_DESCRIPTOR;
  assert.ok(descriptor);
  const candidate = resolveWholeLessonReleaseView(descriptor, {
    releaseId: descriptor.releaseId,
    releasePublished: false,
    strictCompleteAnimationIds: new Set(),
  });
  assert.equal(candidate.currentJsCandidate, true);
  assert.equal(candidate.currentJsPageCount, 65);
  assert.equal(candidate.requiredMemberCount, 65);
  assert.equal(candidate.strictCompleteMemberCount, 0);
  assert.equal(candidate.strictCompletion, false);
  assert.equal(candidate.publicRelease, false);

  const hypotheticalStrict = resolveWholeLessonReleaseView(descriptor, {
    releaseId: descriptor.releaseId,
    releasePublished: true,
    strictCompleteAnimationIds: new Set(
      descriptor.pages.map((page) => page.animationId),
    ),
  });
  assert.equal(hypotheticalStrict.strictCompleteMemberCount, 65);
  assert.equal(hypotheticalStrict.strictCompletion, true);
  assert.equal(hypotheticalStrict.publicRelease, true);
});

test('G5 L3 descriptor builder fails closed on shell, sequence, or acceptance drift', async () => {
  const document = await readFile(sourceScopeUrl, 'utf8').then(JSON.parse);

  const shellDrift = structuredClone(document);
  shellDrift.expectedCounts.courseShells = 1;
  assert.equal(
    buildG5L3WholeLessonPlayerDescriptor(shellDrift),
    undefined,
  );

  const placementDrift = structuredClone(document);
  placementDrift.pages[45].placementId = placementDrift.pages[44].placementId;
  assert.equal(
    buildG5L3WholeLessonPlayerDescriptor(placementDrift),
    undefined,
  );

  const acceptanceDrift = structuredClone(document);
  acceptanceDrift.acceptanceEffects.audioAccepted = true;
  assert.equal(
    buildG5L3WholeLessonPlayerDescriptor(acceptanceDrift),
    undefined,
  );
});
