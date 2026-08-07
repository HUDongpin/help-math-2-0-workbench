import assert from 'node:assert/strict';
import test from 'node:test';

import {loadAnimationModule} from '@helpmath/demos/animation-registry';

import {G4_L3_LESSON} from '../lib/g4-l3-lesson-navigation';
import {G4_L3_WHOLE_LESSON_PLAYER_DESCRIPTOR} from '../lib/g4-l3-whole-lesson-player-descriptor';
import {G4_L3_WHOLE_LESSON_STORAGE_KEY} from '../lib/g4-l3-whole-lesson';
import {resolveWholeLessonReleaseView} from '../lib/whole-lesson-player-descriptor';

test('G4 L3 adapter preserves the exact source order, labels, and legacy state key', () => {
  const descriptor = G4_L3_WHOLE_LESSON_PLAYER_DESCRIPTOR;

  assert.equal(descriptor.pages.length, 39);
  assert.equal(descriptor.sections.length, 8);
  assert.equal(descriptor.course.activePageCount, 39);
  assert.equal(descriptor.course.expectedReleaseMemberCount, 40);
  assert.equal(descriptor.course.domIdPrefix, 'g4-l3');
  assert.equal(
    descriptor.persistence.storageKey,
    G4_L3_WHOLE_LESSON_STORAGE_KEY,
  );
  assert.equal(
    descriptor.persistence.storageKey,
    'helpmath:g4-l3:whole-lesson-mvp:v1',
  );
  assert.deepEqual(
    descriptor.pages.map((page) => page.animationId),
    G4_L3_LESSON.pages.map((page) => page.animationId),
  );
  assert.deepEqual(
    descriptor.sections.map((section) => section.code),
    G4_L3_LESSON.sections.map((section) => section.code),
  );

  const exactSpanish = descriptor.pages.filter(
    (page) => !page.labels.es.usesEnglishFallback,
  );
  const englishFallback = descriptor.pages.filter(
    (page) => page.labels.es.usesEnglishFallback,
  );
  assert.equal(exactSpanish.length, 15);
  assert.equal(englishFallback.length, 24);
  assert.ok(exactSpanish.every(
    (page) =>
      page.labels.es.sourceLanguage === 'es' &&
      page.labels.es.sourceStatus === 'exact-subpage-anchor-label',
  ));
  assert.ok(englishFallback.every(
    (page) =>
      page.labels.es.sourceLanguage === 'en' &&
      page.labels.es.sourceStatus === 'missing-page-level-spanish-title',
  ));
});

test('G4 L3 adapter retains the source contract and structural-only legacy skin evidence', () => {
  const descriptor = G4_L3_WHOLE_LESSON_PLAYER_DESCRIPTOR;

  assert.deepEqual(descriptor.stage, {width: 800, height: 600});
  assert.equal(
    descriptor.source.navigationContractPath,
    G4_L3_LESSON.sourceContract.path,
  );
  assert.equal(
    descriptor.source.sourceXmlPath,
    G4_L3_LESSON.sourceContract.sourceXmlPath,
  );
  assert.equal(
    descriptor.source.sourceXmlSha256,
    G4_L3_LESSON.sourceContract.sourceXmlSha256,
  );
  assert.equal(
    descriptor.source.sequenceAuthority,
    'active-course-xml-global-page-order',
  );
  assert.equal(
    descriptor.source.shippedShellSequenceConflictResolved,
    false,
  );
  assert.equal(descriptor.visualSkin.kind, 'legacy-composite');
  assert.equal(
    descriptor.visualSkin.layoutId,
    'help-math-course-shell-800x600-v1',
  );
  assert.deepEqual(descriptor.visualSkin.header, {height: 109});
  assert.deepEqual(descriptor.visualSkin.footer, {height: 76});
  assert.equal(
    descriptor.visualSkin.controls.kind,
    'source-derived-diagnostic-candidate',
  );
  assert.equal(
    descriptor.visualSkin.controls.kind ===
      'source-derived-diagnostic-candidate'
      ? descriptor.visualSkin.controls.sourceSwfSha256
      : null,
    '817e599de43a7924f0a93791e950c8781755692371945a5b7ea4cdd2ad26c58e',
  );
  assert.equal(
    descriptor.visualSkin.controls.kind ===
      'source-derived-diagnostic-candidate'
      ? descriptor.visualSkin.controls.sourceAnimationId
      : null,
    'shell-course-g04-l03-index-local',
  );
  assert.equal(
    descriptor.visualSkin.controls.kind ===
      'source-derived-diagnostic-candidate'
      ? descriptor.visualSkin.controls.root
      : null,
    '/flash-assets/courses/shell-course-g04-l03-index-local/control-assets',
  );
  const navigation = descriptor.visualSkin.controls.kind ===
      'source-derived-diagnostic-candidate'
    ? descriptor.visualSkin.controls.navigation
    : undefined;
  assert.ok(navigation);
  assert.equal(navigation.kind, 'source-derived-ffdec-vector-states');
  assert.equal(navigation.authoredHitAreaSize, 48);
  assert.equal(navigation.renderedSize, 44);
  assert.equal(navigation.hoverFps, 12);
  assert.deepEqual(navigation.sourceButtonCharacterIds, [340, 342]);
  assert.equal(navigation.next.sourceSpriteCharacterId, 341);
  assert.equal(navigation.next.mirrorX, false);
  assert.equal(navigation.previous.sourceSpriteCharacterId, 343);
  assert.equal(navigation.previous.mirrorX, true);
  assert.equal(navigation.files.overFrames.length, 13);
  assert.equal(
    navigation.navigationFreeChromeFile,
    'lesson-shell-chrome-frame-0049-without-navigation.svg',
  );
  assert.equal(
    descriptor.visualSkin.evidence.kind,
    'ffdec-static-structural-candidate',
  );
  assert.equal(
    descriptor.visualSkin.evidence.sourceAnimationId,
    'shell-course-g04-l03-index-local',
  );
  assert.equal(
    descriptor.visualSkin.evidence.sourceSwfSha256,
    '817e599de43a7924f0a93791e950c8781755692371945a5b7ea4cdd2ad26c58e',
  );
  assert.deepEqual(
    descriptor.pages
      .filter((page) => page.source.xmlBackgroundText)
      .map((page) => page.animationId),
    ['course-g04-l03-ir-001-341242cc'],
  );
  const backgroundCompanion = descriptor.visualSkin.backgroundCompanion;
  assert.ok(backgroundCompanion);
  assert.equal(
    backgroundCompanion.kind,
    'source-derived-ffdec-vector-static-host-companion',
  );
  assert.equal(backgroundCompanion.sourceCharacterId, 584);
  assert.equal(backgroundCompanion.sourceInstanceName, 'Mc_BackText');
  assert.equal(backgroundCompanion.rootFrame, 50);
  assert.equal(backgroundCompanion.rootDepth, 5);
  assert.equal(backgroundCompanion.pagePlaneRootDepth, 47);
  assert.deepEqual(backgroundCompanion.pagePlaneRootPlacementPixels, {
    x: -12.5,
    y: 33.3,
  });
  assert.equal(
    backgroundCompanion.assetSha256,
    '102f0ddeec5ede8843149c3c5621fb5a6632a5edc191b768823fbce691740355',
  );
  assert.deepEqual(backgroundCompanion.loadedSwfHostAsset, {
    registryKey: 'course-g04-l03-ir-001-341242cc-loaded-swf-host',
    assetSource:
      '/flash-assets/courses/shell-course-g04-l03-index-local/host-composite-assets/course-g04-l03-ir-001-loaded-swf-canvas-renderer.js',
    assetSha256:
      '3240f36c8ad7f11f906f3d4be9a16461ae1e1a4699691c16fb371a5476e1eab0',
    sourceProvenLanguage: 'en',
    backgroundDisposition:
      'ignore-loaded-child-swf-standalone-stage-background',
  });
});

test('all 39 G4 L3 pages bind to registered 800 by 600 renderer modules', async () => {
  const availability =
    G4_L3_WHOLE_LESSON_PLAYER_DESCRIPTOR.pages.map(
      (page) => page.rendererAvailability,
    );
  const registered = availability.filter(
    (value) => value.kind === 'registered',
  );

  assert.equal(registered.length, 39);
  assert.deepEqual(
    registered.map((value) => value.moduleKey),
    G4_L3_WHOLE_LESSON_PLAYER_DESCRIPTOR.pages.map(
      (page) => page.animationId,
    ),
  );

  const modules = await Promise.all(
    registered.map((value) => loadAnimationModule(value.moduleKey)),
  );
  assert.equal(modules.filter(Boolean).length, 39);
  for (const [index, animationModule] of modules.entries()) {
    assert.ok(animationModule);
    assert.equal(animationModule.key, registered[index]!.moduleKey);
    assert.deepEqual(animationModule.movie.stage, {width: 800, height: 600});
  }
});

test('release view fails closed and never promotes current JS into strict or public authority', () => {
  const descriptor = G4_L3_WHOLE_LESSON_PLAYER_DESCRIPTOR;
  const empty = resolveWholeLessonReleaseView(descriptor, {
    releaseId: descriptor.releaseId,
    releasePublished: false,
    strictCompleteAnimationIds: new Set(),
  });

  assert.equal(empty.currentJsCandidate, true);
  assert.equal(empty.currentJsPageCount, 39);
  assert.equal(empty.requiredMemberCount, 40);
  assert.equal(empty.strictCompleteMemberCount, 0);
  assert.equal(empty.strictCompletion, false);
  assert.equal(empty.publicRelease, false);

  const publicationWithoutStrict = resolveWholeLessonReleaseView(descriptor, {
    releaseId: descriptor.releaseId,
    releasePublished: true,
    strictCompleteAnimationIds: new Set(),
  });
  assert.equal(publicationWithoutStrict.currentJsCandidate, true);
  assert.equal(publicationWithoutStrict.strictCompletion, false);
  assert.equal(publicationWithoutStrict.publicRelease, false);

  const strictMembers = new Set([
    ...descriptor.pages.map((page) => page.animationId),
    descriptor.course.shellAnimationId,
  ]);
  const strictWithoutPublication = resolveWholeLessonReleaseView(descriptor, {
    releaseId: descriptor.releaseId,
    releasePublished: false,
    strictCompleteAnimationIds: strictMembers,
  });
  assert.equal(strictWithoutPublication.strictCompleteMemberCount, 40);
  assert.equal(strictWithoutPublication.strictCompletion, true);
  assert.equal(strictWithoutPublication.publicRelease, false);

  const explicitlyPublishedStrictRelease = resolveWholeLessonReleaseView(
    descriptor,
    {
      releaseId: descriptor.releaseId,
      releasePublished: true,
      strictCompleteAnimationIds: strictMembers,
    },
  );
  assert.equal(explicitlyPublishedStrictRelease.strictCompletion, true);
  assert.equal(explicitlyPublishedStrictRelease.publicRelease, true);

  const wrongReleaseAuthority = resolveWholeLessonReleaseView(descriptor, {
    releaseId: 'lesson-g05-l04-number-lines',
    releasePublished: true,
    strictCompleteAnimationIds: strictMembers,
  });
  assert.equal(wrongReleaseAuthority.strictCompleteMemberCount, 0);
  assert.equal(wrongReleaseAuthority.strictCompletion, false);
  assert.equal(wrongReleaseAuthority.publicRelease, false);
});
