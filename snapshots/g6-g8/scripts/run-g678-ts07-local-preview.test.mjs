import assert from 'node:assert/strict';
import test from 'node:test';

import {
  g678LocalPreviewCalibrationAdmission,
  g678LocalPreviewLaunch,
} from './run-g678-ts07-local-preview.mjs';

test('TS07 local preview binds only the canonical 277 provisional fragment', () => {
  assert.deepEqual(g678LocalPreviewCalibrationAdmission({
    HELP_MATH_G678_CALIBRATION_PHASE: 'ts07-provisional-browser-qa',
  }), {
    fragment: 'g678-current-js-277-page-registration-v1.fragment.json',
    provisionalBrowserQa: true,
  });
  assert.throws(() => g678LocalPreviewCalibrationAdmission({
    HELP_MATH_G678_CALIBRATION_PHASE: 'ts07-unreviewed',
  }));
});

test('TS07 local preview still hard-binds webpack dev to loopback', () => {
  const launch = g678LocalPreviewLaunch({port: 3318});
  assert.deepEqual(launch.args.slice(1), [
    'dev', '--webpack', '--hostname', '127.0.0.1', '--port', '3318',
  ]);
  assert.equal(launch.env.HELP_MATH_G678_LOCAL_PREVIEW, 'true');
  assert.equal(launch.env.HELP_MATH_G678_LOCAL_PREVIEW_BIND, '127.0.0.1');
  assert.equal(launch.env.HELP_MATH_G678_DEMOS_SOURCE_ROOT.endsWith(
    '/packages/demos/src'), true);
});
