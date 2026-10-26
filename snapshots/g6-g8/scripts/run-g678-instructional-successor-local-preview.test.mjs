import assert from 'node:assert/strict';
import test from 'node:test';
import {successorPreviewLaunch, SUCCESSOR_PREVIEW_PHASE, SUCCESSOR_PREVIEW_PREFLIGHT} from './run-g678-instructional-successor-local-preview.mjs';

test('successor preview stays loopback/private and uses only checked activated successor admission', () => {
  const launch = successorPreviewLaunch({port: 3324});
  assert.ok(launch.args.includes('--webpack'));
  assert.equal(launch.args[launch.args.indexOf('--hostname') + 1], '127.0.0.1');
  assert.equal(launch.env.HELP_MATH_G678_LOCAL_PREVIEW, 'true');
  assert.equal(launch.env.HELP_MATH_G678_LOCAL_PREVIEW_BIND, '127.0.0.1');
  assert.equal(launch.env.HELP_MATH_G678_CALIBRATION_PHASE, SUCCESSOR_PREVIEW_PHASE);
  assert.deepEqual(SUCCESSOR_PREVIEW_PREFLIGHT, [
    ['scripts/activate-g678-alg-l11-instructional-successor-registration.mjs', '--check'],
    ['packages/demos/scripts/generate-registry.mjs', '--check'],
  ]);
  assert.equal(SUCCESSOR_PREVIEW_PREFLIGHT.flat().includes('--write'), false);
});
