import assert from 'node:assert/strict';
import test from 'node:test';

import {buildG5L5ProductBridgeDescriptor} from '../lib/g5-l5-product-bridge-descriptor';

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
  assert.equal(
    descriptor.calibrationId,
    'g5-l5-page-only-current-js-56-v1',
  );
  assert.ok(Object.values(descriptor.productBridge.acceptanceEffects)
    .every((value) => value === false));
  assert.equal(descriptor.glossary.length, 0);
  assert.deepEqual(descriptor.support.lessonHostCapabilities, ['audio']);
});
