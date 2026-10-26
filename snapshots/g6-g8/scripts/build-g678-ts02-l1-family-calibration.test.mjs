import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

test('frozen TS02 L1 family authority stays exact and acceptance-neutral', async () => {
  const artifact = JSON.parse(await readFile(new URL(
    '../catalog/product-bridge-calibrations/' +
      'g678-ts02-l1-family-calibration-v1.json', import.meta.url,
  ), 'utf8'));
  assert.equal(artifact.auditedPlacementCount, 44);
  assert.equal(artifact.blockedPlacementCount, 29);
  assert.ok(Object.values(artifact.acceptanceEffects).every((value) =>
    value === false));
  assert.equal(new Set(artifact.authorizedPlacementIds).size, 15);
  assert.deepEqual(artifact.browserSamples.map((sample) => sample.animationId), [
    'shared-alg001-l01-p047',
    'shared-alg001-l04-p044',
    'shared-alg001-l09-p032',
    'shared-alg001-l10-p043',
    'shared-dat001-l01-p047',
    'shared-nms002-l01-p038',
  ]);
  assert.equal(artifact.authorization.permitsRemaining29Ts02Placements, false);
  assert.equal(artifact.authorization.permitsReleaseOrPublication, false);
  assert.equal(artifact.productHostCalibration.overallG678ProductCalibrationPassed,
    false);
});
