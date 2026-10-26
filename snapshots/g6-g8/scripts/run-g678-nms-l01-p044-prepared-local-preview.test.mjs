import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {p044PreparedPreviewLaunch, P044_PREPARED_PREVIEW_PHASE, P044_PREPARED_PREVIEW_PREFLIGHT}
  from './run-g678-nms-l01-p044-prepared-local-preview.mjs';
test('379-page preview has exact p044 phase, loopback binding and read-only activation/registry preflights', () => {
  const launch = p044PreparedPreviewLaunch({port: 3325});
  assert.equal(launch.args[launch.args.indexOf('--hostname') + 1], '127.0.0.1');
  assert.ok(launch.args.includes('--webpack'));
  assert.equal(P044_PREPARED_PREVIEW_PHASE, 'nms-l01-p044-prepared-provisional-browser-qa');
  assert.equal(launch.env.HELP_MATH_G678_CALIBRATION_PHASE, P044_PREPARED_PREVIEW_PHASE);
  assert.equal(launch.env.HELP_MATH_G678_LOCAL_PREVIEW, 'true');
  assert.equal(launch.env.HELP_MATH_G678_LOCAL_PREVIEW_BIND, '127.0.0.1');
  assert.deepEqual(P044_PREPARED_PREVIEW_PREFLIGHT, [
    ['scripts/activate-g678-nms-l01-p044-prepared-registration.mjs', '--check'],
    ['packages/demos/scripts/generate-registry.mjs', '--check'],
  ]);
  assert.equal(P044_PREPARED_PREVIEW_PREFLIGHT.flat().includes('--write'), false);
});
test('provider and production rejection precede any preflight or dev-server launch', () => {
  const source = readFileSync(new URL('./run-g678-nms-l01-p044-prepared-local-preview.mjs', import.meta.url), 'utf8');
  const main = source.slice(source.indexOf('async function main()'));
  assert.ok(main.indexOf("process.env.NODE_ENV, 'production'") < main.indexOf('await runPreflight'));
  assert.ok(main.indexOf('process.env.VERCEL_ENV, undefined') < main.indexOf('await runPreflight'));
  assert.ok(main.indexOf('await runPreflight') < main.indexOf('spawn(launch.command'));
});
