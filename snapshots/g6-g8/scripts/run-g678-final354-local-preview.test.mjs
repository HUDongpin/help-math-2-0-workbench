import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {
  g678Final354LocalPreviewAdmission,
  g678Final354LocalPreviewLaunch,
  parseG678Final354LocalPreviewArguments,
} from './run-g678-final354-local-preview.mjs';

test('final354 launcher uses only the post-family canonical fragment', () => {
  assert.deepEqual(g678Final354LocalPreviewAdmission(), {
    fragment:
      'catalog/product-bridge-calibrations/g678-current-js-354-page-product-calibrated-registration-v1.fragment.json',
    phase: 'post-family-final354-registry-bound',
    provisionalBrowserQa: false,
  });
  assert.deepEqual(parseG678Final354LocalPreviewArguments(['--check']), {
    help: false,
    port: 3317,
    check: true,
  });
  assert.deepEqual(parseG678Final354LocalPreviewArguments([
    '--port', '4332',
  ]), {help: false, port: 4332, check: false});
  assert.throws(() => parseG678Final354LocalPreviewArguments([
    '--check', '--check',
  ]), /--check may appear only once/u);
});

test('final354 launcher removes provisional phase and remains loopback-only', () => {
  const launch = g678Final354LocalPreviewLaunch({port: 4332});
  assert.equal(launch.env.HELP_MATH_G678_CALIBRATION_PHASE, undefined);
  assert.equal(launch.env.HELP_MATH_G678_FINAL354_LOCAL_PREVIEW, 'true');
  assert.equal(launch.env.HELP_MATH_G678_LOCAL_PREVIEW_BIND, '127.0.0.1');
  assert.deepEqual(launch.args.slice(-4), [
    '--hostname', '127.0.0.1', '--port', '4332',
  ]);
});

test('final354 preflight invokes semantic final upsert without provisional bypass', async () => {
  const source = await readFile(new URL(
    './run-g678-final354-local-preview.mjs', import.meta.url), 'utf8');
  assert.match(source,
    /g678-current-js-354-page-product-calibrated-registration-v1\.fragment\.json/u);
  assert.match(source,
    /'--check', '--calibration', admission\.fragment/u);
  assert.doesNotMatch(source, /--provisional-browser-qa/u);
  assert.match(source, /HELP_MATH_G678_SOURCE_ROOT must be an absolute path/u);
  assert.match(source, /PRIVATE_RECOVERY_CONTAINERS must be an absolute path/u);
  assert.match(source, /serverStarted: false/u);
});
