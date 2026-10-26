import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import {
  g678LocalPreviewCalibrationAdmission,
  g678LocalPreviewLaunch,
  parseG678LocalPreviewArguments,
} from './run-g678-local-preview.mjs';

test('G678 preview launcher accepts only a bounded port option', () => {
  assert.deepEqual(parseG678LocalPreviewArguments([]), {
    help: false,
    port: 3317,
  });
  assert.deepEqual(parseG678LocalPreviewArguments(['--port', '4321']), {
    help: false,
    port: 4321,
  });
  assert.throws(() => parseG678LocalPreviewArguments(['--hostname', '0.0.0.0']));
  assert.throws(() => parseG678LocalPreviewArguments(['--port', '80']));
  assert.throws(() => parseG678LocalPreviewArguments(['--port', '03317']));
});

test('G678 preview launcher separates provisional browser QA from final admission', () => {
  const registry = JSON.parse(readFileSync(new URL(
    '../packages/demos/private-current-js-registry.json', import.meta.url),
  'utf8'));
  const current = registry.calibrations.find((calibration) =>
    calibration.calibrationId === 'g678-16-page-product-calibration-v1');
  const registryBoundFragment = path.basename(current.freezeManifest).replace(
    /\.json$/u, '.fragment.json');
  assert.deepEqual(g678LocalPreviewCalibrationAdmission({}), {
    fragment: registryBoundFragment,
    provisionalBrowserQa: false,
  });
  assert.deepEqual(g678LocalPreviewCalibrationAdmission({
    HELP_MATH_G678_CALIBRATION_PHASE: 'provisional-browser-qa',
  }), {
    fragment: 'g678-current-js-276-page-registration-v1.fragment.json',
    provisionalBrowserQa: true,
  });
  assert.deepEqual(g678LocalPreviewCalibrationAdmission({
    HELP_MATH_G678_CALIBRATION_PHASE: 'predecessor-browser-recalibration',
  }), {
    fragment: 'g678-current-js-261-page-registration-v1.fragment.json',
    provisionalBrowserQa: true,
  });
  assert.deepEqual(g678LocalPreviewCalibrationAdmission({
    HELP_MATH_G678_CALIBRATION_PHASE:
      'alg-l11-tranche1-provisional-browser-qa',
  }), {
    fragment: 'g678-current-js-354-page-registration-v1.fragment.json',
    provisionalBrowserQa: true,
  });
  assert.throws(() => g678LocalPreviewCalibrationAdmission({
    HELP_MATH_G678_CALIBRATION_PHASE: 'unreviewed',
  }));
});

test('G678 preview launcher hard-binds webpack dev and its policy marker to loopback', () => {
  const launch = g678LocalPreviewLaunch({port: 4321});
  assert.deepEqual(launch.args.slice(1), [
    'dev',
    '--webpack',
    '--hostname',
    '127.0.0.1',
    '--port',
    '4321',
  ]);
  assert.equal(launch.env.HELP_MATH_G678_LOCAL_PREVIEW, 'true');
  assert.equal(launch.env.HELP_MATH_G678_LOCAL_PREVIEW_BIND, '127.0.0.1');
  assert.equal(launch.cwd.endsWith('/apps/web'), true);
});
