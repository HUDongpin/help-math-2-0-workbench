import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {
  assertCurrentFinal354LiveRegistry,
  checkG678CurrentFinal354Admission,
  FINAL354_FRAGMENT,
  FINAL354_FREEZE,
} from './check-g678-current-final354-admission.mjs';

const witness = await readFile(new URL(
  '../catalog/product-bridge-calibrations/' +
    'g678-final354-private-current-js-registry-witness-v1.json',
  import.meta.url));
const liveRegistry = await readFile(new URL(
  '../packages/demos/private-current-js-registry.json', import.meta.url));

test('current final354 admission is successor-aware and does not invoke dated finalizer', async () => {
  const liveCount = JSON.parse(liveRegistry.toString('utf8')).calibrations
    .find((candidate) => candidate.calibrationId ===
      'g678-16-page-product-calibration-v1').entries.length;
  if (liveCount === 377) {
    await assert.rejects(checkG678CurrentFinal354Admission(),
      /live registry is not the immutable witness/u);
    return;
  }
  assert.equal(liveCount, 354);
  const result = await checkG678CurrentFinal354Admission();
  assert.deepEqual(result, {check: true, registrationCount: 354,
    historicalProductHostCalibratedPlacementCount: 138,
    predecessorReplayCount: 104, currentHostBrowserRevalidated: false,
    historicalFinal354FinalizerInvoked: false});
  await assert.rejects(checkG678CurrentFinal354Admission({
    fragmentPath: `${FINAL354_FRAGMENT}.copy`, freezePath: FINAL354_FREEZE,
  }), /exact canonical fragment and freeze/u);
});

test('current final354 admission rejects post-377 or otherwise changed live registry', () => {
  assert.equal(assertCurrentFinal354LiveRegistry({liveRegistryBytes: witness,
    witnessBytes: witness}), true);
  const after377 = Buffer.from(witness);
  after377[200] ^= 1;
  assert.throws(() => assertCurrentFinal354LiveRegistry({
    liveRegistryBytes: after377, witnessBytes: witness}),
  /live registry is not the immutable witness/u);
  assert.throws(() => assertCurrentFinal354LiveRegistry({
    liveRegistryBytes: after377, witnessBytes: after377}),
  /live registry is not the immutable witness/u);
});
