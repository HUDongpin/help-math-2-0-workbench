import assert from 'node:assert/strict';
import {test} from 'node:test';

import {
  buildGeneratedArtifacts,
  CALIBRATION_ID,
  SELECTED_OCCURRENCES,
} from './build-g4-l9-p4-representative-slice.mjs';

test('freezes exactly the approved 14-page representative slice', async () => {
  const {artifacts, configs, preflight} = await buildGeneratedArtifacts();
  assert.equal(CALIBRATION_ID, 'g4-l9-p4-representative-slice-14-v1');
  assert.deepEqual(
    preflight.selectedPages.map((page) => page.sourceOccurrence),
    SELECTED_OCCURRENCES,
  );
  assert.equal(configs.length, 13, 'GS002 must reuse its existing maintained workspace');
  assert.equal(artifacts.size, 152);
  assert.equal(
    [...artifacts.keys()].filter((item) => item.endsWith('/migration.json')).length,
    13,
  );
  assert.equal(
    [...artifacts.keys()].filter((item) => item.endsWith('/canvas-renderer.js')).length,
    13,
  );
  assert.equal(
    [...artifacts.keys()].filter((item) => item.includes('/timelines/')).length,
    13,
  );
  assert.equal(
    [...artifacts.keys()].filter((item) => item.includes('/modules/')).length,
    5,
  );
});

test('keeps network and independent acceptance gates fail-closed', async () => {
  const {artifacts} = await buildGeneratedArtifacts();
  for (const [relative, content] of artifacts) {
    const text = String(content);
    if (relative.endsWith('canvas-renderer.js') || relative.endsWith('.json')) {
      assert.doesNotMatch(text, /fetch\s*\(|XMLHttpRequest|sendBeacon/);
    }
  }
  const freeze = JSON.parse(
    String(artifacts.get('catalog/g4-l9-p4-representative-slice-freeze-v1.json')),
  );
  assert.equal(freeze.productBoundary.registeredCurrentJs, 14);
  assert.equal(freeze.productBoundary.unavailablePageCount, 29);
  assert.equal(freeze.productBoundary.courseShellCount, 0);
  assert.equal(freeze.scaleOut.wholeLesson43Pages, false);
  assert.equal(freeze.scaleOut.familyF08, false);
  assert.deepEqual(freeze.acceptanceEffects, {
    authoritativeOriginalRuntime: false,
    technicalFidelity: false,
    audioAccepted: false,
    humanReview: false,
    ownerAcceptance: false,
    strictComplete: false,
    released: false,
    published: false,
    productionVerified: false,
  });
});
