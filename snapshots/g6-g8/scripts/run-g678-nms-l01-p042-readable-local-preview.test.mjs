import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {p042ReadablePreviewLaunch, P042_READABLE_PREVIEW_PHASE, P042_READABLE_PREVIEW_PREFLIGHT}
  from './run-g678-nms-l01-p042-readable-local-preview.mjs';
test('378-page preview has exact p042 phase, loopback binding and read-only activation/registry preflights', () => {
  const launch = p042ReadablePreviewLaunch({port: 3324});
  assert.equal(launch.args[launch.args.indexOf('--hostname') + 1], '127.0.0.1');
  assert.ok(launch.args.includes('--webpack'));
  assert.equal(P042_READABLE_PREVIEW_PHASE, 'nms-l01-p042-companion-provisional-browser-qa');
  assert.equal(launch.env.HELP_MATH_G678_CALIBRATION_PHASE, P042_READABLE_PREVIEW_PHASE);
  assert.equal(launch.env.HELP_MATH_G678_LOCAL_PREVIEW, 'true');
  assert.equal(launch.env.HELP_MATH_G678_LOCAL_PREVIEW_BIND, '127.0.0.1');
  assert.deepEqual(P042_READABLE_PREVIEW_PREFLIGHT, [
    ['scripts/activate-g678-nms-l01-p042-readable-registration.mjs', '--check'],
    ['packages/demos/scripts/generate-registry.mjs', '--check'],
  ]);
  assert.equal(P042_READABLE_PREVIEW_PREFLIGHT.flat().includes('--write'), false);
});
test('provider and production rejection precede any preflight or dev-server launch', () => {
  const source = readFileSync(new URL('./run-g678-nms-l01-p042-readable-local-preview.mjs', import.meta.url), 'utf8');
  const main = source.slice(source.indexOf('async function main()'));
  assert.ok(main.indexOf("process.env.NODE_ENV, 'production'") < main.indexOf('await runPreflight'));
  assert.ok(main.indexOf('process.env.VERCEL_ENV, undefined') < main.indexOf('await runPreflight'));
  assert.ok(main.indexOf('await runPreflight') < main.indexOf('spawn(launch.command'));
});
