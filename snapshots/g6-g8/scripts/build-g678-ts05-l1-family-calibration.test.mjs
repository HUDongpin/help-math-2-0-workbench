import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

test('frozen TS05 L1 family authority stays exact and acceptance-neutral', async () => {
  const artifact = JSON.parse(await readFile(new URL(
    '../catalog/product-bridge-calibrations/' +
      'g678-ts05-l1-family-calibration-v1.json', import.meta.url,
  ), 'utf8'));
  assert.equal(artifact.auditedPlacementCount, 44);
  assert.equal(artifact.blockedPlacementCount, 29);
  assert.ok(Object.values(artifact.acceptanceEffects).every((value) =>
    value === false));
  assert.equal(new Set(artifact.authorizedPlacementIds).size, 15);
  assert.deepEqual(artifact.browserSamples.map((sample) => sample.animationId), [
    'shared-alg001-l01-p050',
    'shared-alg001-l02-p052',
    'shared-alg001-l07-p056',
    'shared-dat001-l01-p050',
    'shared-geo001-l01-p053',
    'shared-nms002-l01-p041',
  ]);
  assert.equal(artifact.authorization.permitsRemaining29Ts05Placements, false);
  assert.equal(artifact.authorization.permitsReleaseOrPublication, false);
  assert.equal(artifact.productHostCalibration.overallG678ProductCalibrationPassed,
    false);
});
