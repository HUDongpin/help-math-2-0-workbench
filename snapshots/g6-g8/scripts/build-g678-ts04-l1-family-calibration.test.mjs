import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

test('frozen TS04 L1 family authority stays exact and acceptance-neutral', async () => {
  const artifact = JSON.parse(await readFile(new URL(
    '../catalog/product-bridge-calibrations/' +
      'g678-ts04-l1-family-calibration-v1.json', import.meta.url,
  ), 'utf8'));
  assert.equal(artifact.auditedPlacementCount, 44);
  assert.equal(artifact.blockedPlacementCount, 29);
  assert.ok(Object.values(artifact.acceptanceEffects).every((value) =>
    value === false));
  assert.equal(new Set(artifact.authorizedPlacementIds).size, 15);
  assert.deepEqual(artifact.browserSamples.map((sample) => sample.animationId), [
    'shared-alg001-l01-p049',
    'shared-alg001-l04-p046',
    'shared-alg001-l10-p045',
    'shared-dat001-l01-p049',
    'shared-geo001-l01-p052',
    'shared-nms002-l01-p040',
  ]);
  assert.equal(artifact.authorization.permitsRemaining29Ts04Placements, false);
  assert.equal(artifact.authorization.permitsReleaseOrPublication, false);
  assert.equal(artifact.productHostCalibration.overallG678ProductCalibrationPassed,
    false);
});
