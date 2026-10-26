import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {g678LocalPreviewCalibrationAdmission} from
  './run-g678-local-preview.mjs';
import {
  g678Provisional377LocalPreviewAdmission,
  g678Provisional377LocalPreviewLaunch,
  g678Provisional377LocalPreviewPreflightPlan,
  parseG678Provisional377LocalPreviewArguments,
} from './run-g678-provisional377-local-preview.mjs';

const phase = 'alg-l11-remaining23-provisional-browser-qa';

test('provisional377 launcher has one exact browser-pending admission', () => {
  assert.deepEqual(g678Provisional377LocalPreviewAdmission(), {
    fragment:
      'catalog/product-bridge-calibrations/g678-current-js-377-page-registration-v1.fragment.json',
    phase, provisionalBrowserQa: true,
  });
  assert.deepEqual(g678LocalPreviewCalibrationAdmission({
    HELP_MATH_G678_CALIBRATION_PHASE: phase,
  }), {fragment: 'g678-current-js-377-page-registration-v1.fragment.json',
    provisionalBrowserQa: true});
  assert.deepEqual(parseG678Provisional377LocalPreviewArguments(['--check']),
    {help: false, port: 3317, check: true});
  assert.throws(() => parseG678Provisional377LocalPreviewArguments([
    '--check', '--check']), /--check may appear only once/u);
  assert.deepEqual(g678Provisional377LocalPreviewPreflightPlan(), [
    ['packages/demos/scripts/generate-registry.mjs', '--check'],
    ['scripts/upsert-private-current-js-calibration.mjs', '--check',
      '--calibration',
      'catalog/product-bridge-calibrations/g678-current-js-377-page-registration-v1.fragment.json',
      '--provisional-browser-qa'],
  ]);
});

test('provisional377 launcher stays loopback and preflight-only in check mode', async () => {
  const launch = g678Provisional377LocalPreviewLaunch({port: 4337});
  assert.equal(launch.env.HELP_MATH_G678_CALIBRATION_PHASE, phase);
  assert.equal(launch.env.HELP_MATH_G678_PROVISIONAL377_LOCAL_PREVIEW, 'true');
  assert.equal(launch.env.HELP_MATH_G678_LOCAL_PREVIEW_BIND, '127.0.0.1');
  assert.deepEqual(launch.args.slice(-4), [
    '--hostname', '127.0.0.1', '--port', '4337']);
  const source = await readFile(new URL(
    './run-g678-provisional377-local-preview.mjs', import.meta.url), 'utf8');
  assert.match(source,
    /'--calibration', FRAGMENT, '--provisional-browser-qa'/u);
  assert.match(source, /serverStarted: false/u);
  assert.match(source, /NODE_ENV !== 'production'/u);
  assert.match(source, /VERCEL_ENV === undefined/u);
});
