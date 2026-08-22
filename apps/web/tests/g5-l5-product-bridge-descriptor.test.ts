import assert from 'node:assert/strict';
import test from 'node:test';

import productReleaseDocument from '../../../catalog/page-only-current-js-product-releases.json' with {type: 'json'};

import {buildG5L5ProductBridgeDescriptor} from '../lib/g5-l5-product-bridge-descriptor';
import {findPageOnlyCurrentJsNavigationForRoute} from '../lib/page-only-current-js-navigation.server';
import {wholeLessonDescriptorMatchesNavigation} from '../lib/whole-lesson-player-descriptor';

test('G5 L5 formal page-only course preserves all 56 source-ordered pages and excludes the shell', () => {
  const descriptor = buildG5L5ProductBridgeDescriptor();
  assert.equal(descriptor.schemaVersion, 2);
  assert.equal(descriptor.descriptorKind, 'formal-page-only-course');
  assert.equal(descriptor.course.href, '/courses/5/5');
  assert.equal(descriptor.course.activePageCount, 56);
  assert.equal(descriptor.course.expectedReleaseMemberCount, 56);
  assert.equal(descriptor.course.courseShellCount, 0);
  assert.equal(descriptor.pages.length, 56);
  assert.deepEqual(
    descriptor.pages.map((page) => page.globalPageOrdinal),
    Array.from({length: 56}, (_, index) => index + 1),
  );
  assert.equal(new Set(descriptor.pages.map((page) => page.placementId)).size, 56);
  assert.equal(descriptor.pages[0]?.animationId, 'course-g05-l05-ir-001-664ab764');
  assert.equal(descriptor.pages[55]?.animationId, 'course-g05-l05-fq-003');
  assert.equal(
    descriptor.pages.some((page) => page.animationId.startsWith('shell-')),
    false,
  );
});

test('full product bridge registers all 56 pages and leaves acceptance closed', () => {
  const descriptor = buildG5L5ProductBridgeDescriptor();
  const sliceIds = [
    'course-g05-l05-rw-003',
    'course-g05-l05-vb-012',
    'course-g05-l05-ts-007',
    'course-g05-l05-fq-003',
  ];
  assert.deepEqual(
    descriptor.productBridge.selectedAnimationIds,
    descriptor.pages.map((page) => page.animationId),
  );
  assert.equal(descriptor.productBridge.registeredAnimationCount, 56);
  assert.equal(
    descriptor.pages.filter((page) =>
      page.rendererAvailability.kind === 'registered').length,
    56,
  );
  const sourceStaticPages = descriptor.pages.filter((page) =>
    page.runtimeEvidenceBoundary?.runtimeKind ===
      'source-static-current-js-candidate');
  assert.equal(sourceStaticPages.length, 52);
  assert.ok(sourceStaticPages.every((page) => {
    const boundary = page.runtimeEvidenceBoundary;
    return boundary?.actionScriptExecution === 'not-executed' &&
      boundary.naturalTraceValidation === 'not-established' &&
      boundary.audioAcceptance === 'not-established' &&
      boundary.replaySemantics ===
        'renderer-restart-only-source-behavior-not-established';
  }));
  const slicePages = descriptor.pages.filter((page) =>
    page.runtimeEvidenceBoundary?.runtimeKind ===
      'source-script-bound-product-behavior-current-js-candidate');
  assert.deepEqual(slicePages.map((page) => page.animationId), sliceIds);
  assert.ok(slicePages.every((page) => {
    const boundary = page.runtimeEvidenceBoundary;
    return boundary?.actionScriptExecution === 'not-executed' &&
      boundary.naturalTraceValidation === 'not-established' &&
      boundary.audioAcceptance === 'not-established' &&
      boundary.productBehavior ===
        'maintained-javascript-state-machine-implemented' &&
      (page.animationId === 'course-g05-l05-fq-003'
        ? boundary.productVisualBehaviorComposite ===
          'source-script-assignment-composite-generated-original-runtime-unvalidated'
        : page.animationId === 'course-g05-l05-vb-012' ||
            page.animationId === 'course-g05-l05-ts-007'
          ? boundary.productVisualBehaviorComposite ===
            'source-script-behavior-composite-generated-original-runtime-unvalidated'
          : boundary.productVisualBehaviorComposite === 'not-established') &&
      boundary.replaySemantics ===
        'product-complete-state-reset-original-runtime-parity-not-established';
  }));
  assert.deepEqual(
    slicePages.filter((page) => page.presentation)
      .map((page) => page.animationId),
    sliceIds.slice(1),
  );
  assert.deepEqual(
    descriptor.productBridge.verticalSlice?.selectedAnimationIds,
    sliceIds,
  );
  assert.equal(
    descriptor.productBridge.verticalSlice?.legacyNetworkReporting,
    'blocked-memory-only',
  );
  assert.equal(
    descriptor.productBridge.verticalSlice?.audioDisposition,
    'unresolved-disabled',
  );
  assert.equal(
    descriptor.productBridge.verticalSlice?.behaviorClosure,
    'three-source-script-behavior-composites-implemented-rw003-static-source-candidate',
  );
  assert.equal(
    descriptor.productBridge.verticalSlice?.visualCompositeDisposition,
    'fq003-vb012-ts007-source-script-behavior-composites-generated-original-runtime-unvalidated',
  );
  assert.equal(
    descriptor.productBridge.verticalSlice?.accessibilityDisposition,
    'partial-semantic-controls-source-math-canvas-not-accessible',
  );
  assert.equal(
    descriptor.productBridge.verticalSlice?.layoutMatrix,
    'pass-en-es-desktop-tablet-mobile',
  );
  assert.equal(
    descriptor.productBridge.verticalSlice?.scaleDecision,
    'no-go-unattended-factory-scale-out',
  );
  assert.equal(
    descriptor.calibrationId,
    'g5-l5-page-only-current-js-56-v1',
  );
  assert.ok(Object.values(descriptor.productBridge.acceptanceEffects)
    .every((value) => value === false));
  assert.equal(descriptor.glossary.length, 0);
  assert.deepEqual(descriptor.support.lessonHostCapabilities, ['audio']);
});

test('G5 L5 formal product release cross-binds the 56-page descriptor to the server route', () => {
  const descriptor = buildG5L5ProductBridgeDescriptor();
  const release = productReleaseDocument.releases.find(
    ({releaseId}) => releaseId === descriptor.releaseId,
  );
  assert.ok(release);
  assert.equal(release.releaseOrder, 6);
  assert.equal(release.publicationMode, 'atomic');
  assert.equal(release.scope.pageOnly, true);
  assert.equal(release.scope.legacyFlashCourseShellExcluded, true);
  assert.equal(release.scope.modernMyLessonHostRetained, true);
  assert.equal(release.expectedCounts.members, 56);
  assert.equal(release.expectedCounts.courseShells, 0);
  assert.deepEqual(
    release.members.map(({placementId, animationId, xmlOccurrence}) => [
      placementId,
      animationId,
      xmlOccurrence,
    ]),
    descriptor.pages.map((page) => [
      page.placementId,
      page.animationId,
      page.source.sourceOccurrence,
    ]),
  );
  const navigation = findPageOnlyCurrentJsNavigationForRoute(5, 5);
  assert.ok(navigation);
  assert.equal(navigation.schemaVersion, 2);
  assert.equal(navigation.pages.length, 56);
  assert.equal(navigation.courseShellCount, 0);
  assert.equal(
    wholeLessonDescriptorMatchesNavigation(descriptor, navigation),
    true,
  );
  assert.ok(Object.values(productReleaseDocument.acceptanceEffects)
    .every((value) => value === false));
});
