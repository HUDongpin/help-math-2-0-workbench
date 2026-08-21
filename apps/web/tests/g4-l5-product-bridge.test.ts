import assert from 'node:assert/strict';
import test from 'node:test';

import {resolveG4L5RuntimeScenario} from '../components/g4-l5-private-animation-runtime';
import {
  buildG4L5ProductBridgeDescriptor,
  G4_L5_PRODUCT_FACTORY_SELECTED_ANIMATION_IDS,
} from '../lib/g4-l5-product-bridge-descriptor';
import {loadG4L5ProductBridgeSourceCoverage} from '../lib/g4-l5-product-bridge-source.server';
import sourceStaticModule from '../../../packages/demos/src/modules/course-g04-l05-ir-001';
import productCandidateModule from '../../../packages/demos/src/modules/course-g04-l05-rw-002';

test('G4 L5 host selects each module frame-domain scenario contract', () => {
  assert.equal(
    resolveG4L5RuntimeScenario(sourceStaticModule, 'sprite-65'),
    'source-static-frame',
  );
  assert.equal(
    resolveG4L5RuntimeScenario(productCandidateModule, 'sprite-722'),
    'product-candidate',
  );
});

test('G4 L5 descriptor binds the exact 53-page source order and all private modules', () => {
  const descriptor = buildG4L5ProductBridgeDescriptor(
    loadG4L5ProductBridgeSourceCoverage(),
  );
  assert.equal(descriptor.course.activePageCount, 53);
  assert.equal(descriptor.course.legacyCourseShellCount, 0);
  assert.equal(descriptor.pages.length, 53);
  assert.deepEqual(
    descriptor.pages.map((page) => page.globalPageOrdinal),
    Array.from({length: 53}, (_, index) => index + 1),
  );
  const selected = descriptor.pages.filter(
    (page) => page.candidate.status === 'private-current-js',
  );
  assert.deepEqual(
    selected.map((page) => page.animationId),
    [...G4_L5_PRODUCT_FACTORY_SELECTED_ANIMATION_IDS],
  );
  assert.deepEqual(
    selected.map((page) => page.globalPageOrdinal),
    Array.from({length: 53}, (_, index) => index + 1),
  );
  assert.equal(descriptor.course.selectedCurrentJsCount, 53);
  assert.equal(descriptor.course.remainingCurrentJsCount, 0);
  assert.equal(descriptor.host.storage, 'memory-only');
  assert.equal(descriptor.host.storesPersonalData, false);
  assert.equal(descriptor.host.legacyOperations, 'blocked');
  assert.ok(
    Object.values(descriptor.acceptanceEffects)
      .every((value) => value === false),
  );
  assert.match(
    descriptor.source.candidateFreezeManifestSha256,
    /^[a-f0-9]{64}$/u,
  );
});

test('G4 L5 glossary remains bound to the canonical Grade 4 XML hashes', () => {
  const descriptor = buildG4L5ProductBridgeDescriptor(
    loadG4L5ProductBridgeSourceCoverage(),
  );
  assert.deepEqual(
    descriptor.glossary.map((entry) => entry.id),
    ['array', 'represent'],
  );
  for (const entry of descriptor.glossary) {
    assert.equal(
      entry.source.en.sha256,
      'bec389ce286b9a113297dfd87e052f28cf1da2640d93a277f91f669dfb3ef749',
    );
    assert.equal(
      entry.source.es.sha256,
      '7f12ce833f1429073a11a3ea0dd9d9964eb773804c18c025bde12552b3be5a00',
    );
  }
});
