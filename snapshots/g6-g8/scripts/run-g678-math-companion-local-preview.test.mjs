import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {mathCompanionPreviewLaunch, MATH_COMPANION_PREVIEW_PHASE, MATH_COMPANION_PREVIEW_PREFLIGHT}
  from './run-g678-math-companion-local-preview.mjs';

test('V4 launcher uses exact checked activation and retains loopback/no-write preflight', () => {
  const launch = mathCompanionPreviewLaunch({port: 3324});
  assert.equal(launch.args[launch.args.indexOf('--hostname') + 1], '127.0.0.1');
  assert.ok(launch.args.includes('--webpack'));
  assert.equal(launch.env.HELP_MATH_G678_LOCAL_PREVIEW, 'true');
  assert.equal(launch.env.HELP_MATH_G678_LOCAL_PREVIEW_BIND, '127.0.0.1');
  assert.equal(launch.env.HELP_MATH_G678_CALIBRATION_PHASE, MATH_COMPANION_PREVIEW_PHASE);
  assert.deepEqual(MATH_COMPANION_PREVIEW_PREFLIGHT, [
    ['scripts/activate-g678-alg-l11-math-companion-registration.mjs', '--check'],
    ['packages/demos/scripts/generate-registry.mjs', '--check'],
  ]);
  assert.equal(MATH_COMPANION_PREVIEW_PREFLIGHT.flat().includes('--write'), false);
});

test('V4 CLI rejects provider/production environments before it launches any preflight', () => {
  const source = readFileSync(new URL('./run-g678-math-companion-local-preview.mjs', import.meta.url), 'utf8');
  const body = source.slice(source.indexOf('async function main()'));
  assert.ok(body.indexOf("process.env.NODE_ENV, 'production'") < body.indexOf('await runPreflight'));
  assert.ok(body.indexOf('process.env.VERCEL_ENV, undefined') < body.indexOf('await runPreflight'));
  assert.ok(body.indexOf('await runPreflight') < body.indexOf('spawn(launch.command'));
});
