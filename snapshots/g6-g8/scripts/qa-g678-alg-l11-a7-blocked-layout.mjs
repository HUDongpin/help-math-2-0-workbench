#!/usr/bin/env node
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import {chromium} from 'playwright';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUTPUT = 'output/playwright/g678-alg-l11-a-choice-instructional-blocked-layout-v1';
const ENTRY = 'scripts/harness-g678-alg-l11-a-choice-runtime.tsx';
const SOURCE = 'packages/demos/src/g678-alg-l11-a-choice-instructional-visuals.tsx';
const PRIOR = 'output/playwright/g678-alg-l11-a-choice-instructional-mounted-runtime-v2/evidence.json';
const hash = (value) => createHash('sha256').update(value).digest('hex');
async function binding(file) {
  const bytes = await readFile(path.resolve(ROOT, file));
  return {path: file, bytes: bytes.length, sha256: hash(bytes)};
}
const files = [ENTRY, SOURCE, 'scripts/qa-g678-alg-l11-a7-blocked-layout.mjs',
  'apps/web/components/animation-runtime.tsx', 'packages/demos/src/runtime.ts',
  'packages/demos/src/contract.ts', 'packages/demos/src/lesson-host-contract.ts',
  'packages/demos/src/g678-alg-l11-tranche-a-source-vector-stage.tsx',
  'work/g678-shared-page-factory/g678-alg-l11-tranche-a-vector-bundles-v6/shared-alg001-l11-p008.json'];
const inputs = await Promise.all(files.map(binding));
const prior = await binding(PRIOR);
assert.equal(prior.sha256, '3695e81f6fe99dae248850df4b0d5694b3e8bac186e30b8f620f6ad4d5c66759');
await mkdir(path.join(ROOT, OUTPUT));
const save = (name, bytes) => writeFile(path.join(ROOT, OUTPUT, name), bytes, {flag: 'wx'});
const compiled = await build({entryPoints: [path.join(ROOT, ENTRY)], bundle: true,
  write: false, platform: 'browser', format: 'iife', jsx: 'automatic',
  define: {'process.env.NODE_ENV': '"production"'},
  alias: {'@helpmath/demos/runtime': path.join(ROOT, 'packages/demos/src/runtime.ts'),
    '@helpmath/demos/prototype-manifest': path.join(ROOT, 'packages/demos/src/prototype-manifest.ts')},
  plugins: [{name: 'explicit-unregistered-test-loader', setup(builder) {
    builder.onResolve({filter: /^@\/lib\/load-animation-module\.client$/}, () =>
      ({path: 'a7-test-loader', namespace: 'a7-test-only'}));
    builder.onLoad({filter: /.*/, namespace: 'a7-test-only'}, () => ({
      contents: 'export async function loadClientAnimationModule(key){return window.__A7_TEST_MODULES[key]}', loader: 'js'}));
  }}]});
const script = compiled.outputFiles[0].text;
await save('harness.js', script);
const browser = await chromium.launch({headless: true});
const page = await browser.newPage({viewport: {width: 1100, height: 950}, reducedMotion: 'reduce'});
const errors = [], requests = [];
const evidence = {artifactType: 'g678-alg-l11-a7-blocked-error-layout-regression-v1',
  scope: 'p008-blocked-record-only-actual-runtime-and-real-memory-host-test-loader',
  inputs, priorEvidence: prior, browserVersion: browser.version(), errors, requests,
  registered: false, productCalibrationPassed: false, humanAcceptanceCreated: false,
  visualFidelityAccepted: false, ownerAccepted: false, strictComplete: false, published: false};
page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
await page.route('**/*', (route) => { requests.push(route.request().url()); return route.abort(); });
try {
  await page.setContent('<html><head><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; script-src \'unsafe-inline\'; style-src \'unsafe-inline\'; img-src data:"><style>body{margin:0;background:white;font-family:Arial}button{min-height:36px;margin-right:8px}.runtime-stage{width:800px}</style></head><body><div id="root"></div></body></html>');
  await page.evaluate(() => { window.__A7_CASE = {animationId: 'shared-alg001-l11-p008'}; });
  await page.addScriptTag({content: script});
  const answer = page.locator('polygon[data-choice-slot="B"]');
  await page.waitForFunction(() => document.querySelector('polygon[data-choice-slot="B"]')?.getAttribute('aria-disabled') === 'false');
  await page.getByRole('button', {name: 'Reject answer record in real host'}).click();
  await answer.click();
  const alert = page.getByRole('alert');
  await alert.waitFor();
  assert.equal(await alert.count(), 1);
  assert.equal(await alert.textContent().then((text) => text.trim()),
    'The lesson host could not process this answer. Use Replay to try again.');
  await page.getByRole('button', {name: 'Send allowed host reset'}).click();
  assert.equal(await page.getByRole('button', {name: 'Continue', exact: true}).isDisabled(), true);
  const layout = await alert.evaluate((element) => {
    const rectangle = (node) => { const r = node.getBoundingClientRect();
      return {x: r.x, y: r.y, width: r.width, height: r.height, right: r.right, bottom: r.bottom}; };
    const r = rectangle(element), aside = element.closest('aside');
    const button = aside.querySelector('button');
    const samples = [0.1, 0.5, 0.9].map((fraction) => {
      const x = r.x + r.width * fraction, y = r.y + r.height / 2;
      const top = document.elementFromPoint(x, y);
      return {x, y, alertOnTop: top === element || element.contains(top)};
    });
    return {alert: r, aside: rectangle(aside), continueButton: rectangle(button),
      samples, text: element.textContent.trim(),
      visible: getComputedStyle(element).visibility, display: getComputedStyle(element).display};
  });
  assert.equal(layout.visible, 'visible');
  assert.notEqual(layout.display, 'none');
  assert.ok(layout.alert.width > 0 && layout.alert.height > 0);
  assert.ok(layout.alert.x >= layout.aside.x && layout.alert.right <= layout.aside.right);
  assert.ok(layout.alert.y >= layout.aside.y && layout.alert.bottom <= layout.aside.bottom);
  assert.ok(layout.alert.bottom < layout.continueButton.y, 'Host alert overlaps Continue');
  assert.ok(layout.samples.every((sample) => sample.alertOnTop), 'Host alert is obscured by another element');
  const state = await page.evaluate(() => ({
    held: document.querySelector('[data-runtime-transport]')?.getAttribute('data-runtime-interactive-stop-held'),
    resolved: document.querySelector('[data-runtime-transport]')?.getAttribute('data-runtime-interactive-stop-resolved-count'),
    hostFeedbackActive: document.querySelector('[data-test-loader]')?.getAttribute('data-host-feedback-active'),
    audit: window.__A7_AUDIT}));
  assert.equal(state.held, 'true'); assert.equal(state.resolved, '0');
  assert.equal(state.hostFeedbackActive, 'false');
  assert.equal(state.audit.at(-1).status, 'allowed');
  assert.deepEqual(errors, []); assert.deepEqual(requests, []);
  const picture = await page.screenshot({fullPage: true});
  await save('p008-blocked-host-alert.png', picture);
  evidence.layout = layout; evidence.runtimeState = state;
  evidence.screenshot = {path: `${OUTPUT}/p008-blocked-host-alert.png`,
    bytes: picture.length, sha256: hash(picture)};
  assert.deepEqual(await Promise.all(files.map(binding)), inputs);
  assert.deepEqual(await binding(PRIOR), prior);
  evidence.status = 'blocked-host-alert-visible-and-nonoverlapping';
} catch (error) {
  evidence.status = 'failed-preserved'; evidence.error = error.stack ?? String(error);
  await save('failure.png', await page.screenshot({fullPage: true}));
  process.exitCode = 1;
} finally {
  await browser.close();
  await save('evidence.json', JSON.stringify(evidence, null, 2) + '\n');
}
console.log(JSON.stringify({output: OUTPUT, status: evidence.status, error: evidence.error?.split('\n')[0]}));
