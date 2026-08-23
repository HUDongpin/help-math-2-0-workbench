import assert from 'node:assert/strict';
import {test} from 'node:test';
import {NextRequest} from 'next/server';

import {loadCurrentGrade4CourseCatalogCoverage} from '../lib/g4-course-catalog-coverage.server';
import {
  buildG4L9ProductBridgeDescriptor,
  G4_L9_PRODUCT_BRIDGE_SELECTED_ANIMATION_IDS,
} from '../lib/g4-l9-product-bridge-descriptor';
import {proxyForRequest} from '../proxy';

const selectedOccurrences = [1, 2, 12, 16, 22, 23, 24, 27, 28, 30, 32, 33, 40, 41, 42];

test('builds the exact source-ordered 43-page private descriptor with 15 admitted pages', () => {
  const descriptor = buildG4L9ProductBridgeDescriptor(
    loadCurrentGrade4CourseCatalogCoverage(),
  );
  assert.equal(descriptor.schemaVersion, 2);
  assert.equal(descriptor.descriptorKind, 'private-page-only-product-bridge');
  assert.equal(descriptor.course.courseShellCount, 0);
  assert.equal(descriptor.pages.length, 43);
  assert.equal(descriptor.productBridge.registeredAnimationCount, 15);
  assert.equal(descriptor.productBridge.pageOnlyDescriptorMemberCount, 43);
  assert.deepEqual(descriptor.support.lessonHostCapabilities, [
    'audio',
    'glossary',
    'navigation',
    'fq-scoring',
    'practice-feedback',
  ]);
  const registered = descriptor.pages.filter(
    (page) => page.rendererAvailability.kind === 'registered',
  );
  assert.equal(registered.length, 15);
  assert.deepEqual(
    registered.map((page) => page.source.sourceOccurrence),
    selectedOccurrences,
  );
  assert.deepEqual(
    registered.map((page) => page.animationId),
    G4_L9_PRODUCT_BRIDGE_SELECTED_ANIMATION_IDS,
  );
  assert.equal(descriptor.pages.filter(
    (page) => page.rendererAvailability.kind === 'unavailable',
  ).length, 28);
  const occurrence32 = descriptor.pages[31]!;
  assert.equal(occurrence32.placementId, 'g04-l09-placement-032');
  assert.equal(occurrence32.animationId, 'course-g04-l09-ti-007');
  assert.deepEqual(occurrence32.rendererAvailability, {
    kind: 'registered',
    moduleKey: 'course-g04-l09-ti-007',
    runtimeQuery: {
      frameDomain: 'sprite-149',
      language: 'fixed-en',
      replaySeedCycle: 7,
      scenario: 'p5-f08-occurrence-32-stress',
      seed: '4092026',
    },
  });
  assert.equal(descriptor.calibrationId,
    'g4-l9-p5-f08-occurrence-32-stress-v1');
  assert.equal(descriptor.glossary.length, 16);
  assert.equal(descriptor.course.courseShellCount, 0);
  assert.equal(descriptor.productBridge.acceptanceEffects.published, false);
});

test('keeps all independent acceptance and publication authorities false', () => {
  const descriptor = buildG4L9ProductBridgeDescriptor(
    loadCurrentGrade4CourseCatalogCoverage(),
  );
  assert.deepEqual(descriptor.productBridge.acceptanceEffects, {
    authoritativeOriginalRuntime: false,
    fidelityAccepted: false,
    audioAccepted: false,
    humanVisualAccepted: false,
    ownerAccepted: false,
    strictComplete: false,
    published: false,
  });
  for (const page of descriptor.pages) {
    if (page.rendererAvailability.kind === 'registered') {
      assert.equal(page.runtimeEvidenceBoundary?.actionScriptExecution, 'not-executed');
      assert.equal(page.runtimeEvidenceBoundary?.naturalTraceValidation, 'not-established');
      assert.equal(page.runtimeEvidenceBoundary?.audioAcceptance, 'not-established');
    }
  }
});

test('admits only the exact private bridge in development and fails closed in production', async () => {
  const priorNodeEnvironment = process.env.NODE_ENV;
  try {
    Reflect.set(process.env, 'NODE_ENV', 'development');
    const development = await proxyForRequest(new NextRequest(
      'http://localhost:3000/en/migration-status/g4-l9-product-bridge',
    ));
    assert.equal(development.status, 200);
    const broader = await proxyForRequest(new NextRequest(
      'http://localhost:3000/en/migration-status/g4-l9-product-bridge/extra',
    ));
    assert.equal(broader.status, 404);

    Reflect.set(process.env, 'NODE_ENV', 'production');
    const production = await proxyForRequest(new NextRequest(
      'https://www.helpmath.ai/en/migration-status/g4-l9-product-bridge',
    ));
    assert.equal(production.status, 404);
  } finally {
    if (priorNodeEnvironment === undefined) {
      Reflect.deleteProperty(process.env, 'NODE_ENV');
    } else {
      Reflect.set(process.env, 'NODE_ENV', priorNodeEnvironment);
    }
  }
});
