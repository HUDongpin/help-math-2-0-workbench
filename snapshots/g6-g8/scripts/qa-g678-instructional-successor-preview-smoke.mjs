#!/usr/bin/env node
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = 'http://127.0.0.1:3324';
const args = process.argv.slice(2);
assert.ok(args.length === 2 && args[0] === '--run' && /^[a-z0-9-]+$/u.test(args[1]));
const OUTPUT = `output/playwright/g678-instructional-successor-preview-smoke-${args[1]}`;
await mkdir(path.join(ROOT, OUTPUT));
const hash = b => createHash('sha256').update(b).digest('hex');
const binding = async file => {const b = await readFile(path.join(ROOT, file)); return {path: file, bytes: b.length, sha256: hash(b)};};
const save = (file, value) => writeFile(path.join(ROOT, OUTPUT, file), Buffer.isBuffer(value) ? value : JSON.stringify(value, null, 2) + '\n', {flag: 'wx'});
const paths = ['packages/demos/private-current-js-registry.json',
  'catalog/product-bridge-calibrations/g678-current-js-377-page-registration-v2.activation.json',
  'catalog/product-bridge-calibrations/g678-current-js-377-page-registration-v2.json',
  'apps/web/lib/g678-calibration-product-bridge.server.ts',
  'apps/web/app/globals.css',
  'apps/web/components/descriptor-driven-whole-lesson-player.tsx',
  'apps/web/components/animation-runtime.tsx', 'packages/demos/src/registry.local-only.generated.ts'];
const inputs = await Promise.all(paths.map(binding));
const browser = await chromium.launch({headless: true});
const page = await browser.newPage({viewport: {width: 1440, height: 1000}, reducedMotion: 'reduce'});
const errors = [], requests = [], external = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => {if (m.type() === 'error') errors.push(m.text());});
await page.route('**/*', route => {
  const url = new URL(route.request().url());
  requests.push({url: url.href, type: route.request().resourceType()});
  if (url.origin !== BASE) {external.push(url.href); return route.abort();}
  return route.continue();
});
let step = 'home';
const evidence = {artifactType: 'g678-instructional-successor-private-preview-smoke-v1',
  story: 'Source-bound private registry → server descriptor → actual module loader → modern My Lesson instructional stage',
  inputs, errors, requests, external, routes: [], registeredModuleSmokeOnly: true,
  productCalibrationPassed: false, audioAccepted: false, strictComplete: false, published: false};
async function capture(name) {
  const file = `${name}.png`; await save(file, await page.screenshot({fullPage: true}));
  return binding(`${OUTPUT}/${file}`);
}
try {
  console.log(JSON.stringify({step, url: `${BASE}/en?screen=lessons`}));
  const home = await page.goto(`${BASE}/en?screen=lessons`, {waitUntil: 'domcontentloaded', timeout: 90000});
  assert.equal(home.status(), 200);
  await page.waitForFunction(() => document.body.innerText.trim().length > 100);
  assert.equal(await page.locator('[data-nextjs-dialog], .vite-error-overlay').count(), 0);
  evidence.routes.push({path: '/en?screen=lessons', status: home.status(), screenshot: await capture('lessons')});
  step = 'actual-p009-module';
  console.log(JSON.stringify({step}));
  const relative = '/en/migration-status/g678-calibration/shared-alg001-l11-p009';
  const response = await page.goto(BASE + relative, {waitUntil: 'domcontentloaded', timeout: 90000});
  assert.equal(response.status(), 200);
  await page.waitForSelector('[data-lesson-player="descriptor-driven-page-only-product-bridge"][data-current-animation-id="shared-alg001-l11-p009"][data-hydrated="true"]', {timeout: 60000});
  await page.waitForSelector('[data-a-special-source-visual="true"] [data-source-vector-frame="431"]', {timeout: 60000});
  assert.equal(await page.locator('[data-nextjs-dialog], .vite-error-overlay').count(), 0);
  const robots = await page.locator('meta[name="robots"]').getAttribute('content');
  assert.match(`${response.headers()['x-robots-tag'] ?? ''} ${robots}`, /noindex/u);
  const player = page.locator('[data-lesson-player]');
  assert.equal(await player.getAttribute('data-renderer-availability'), 'registered');
  assert.equal(await player.getAttribute('data-unavailable-pages'), '0');
  const motionNote = await page.locator('.reduced-motion-note').boundingBox();
  assert.ok(motionNote && motionNote.width <= 2 && motionNote.height <= 2,
    'Motion preference status must not cover instructional content');
  evidence.routes.push({path: relative, status: response.status(), robots,
    sourceFrame: await page.locator('[data-source-vector-frame]').getAttribute('data-source-vector-frame'),
    screenshot: await capture('p009-source-in-my-lesson'), motionNote,
    interactiveControls: await page.getByRole('button').allTextContents()});
  assert.deepEqual(errors, []); assert.deepEqual(external, []);
  assert.deepEqual(await Promise.all(paths.map(binding)), inputs, 'Smoke input changed');
  evidence.status = 'passed'; evidence.inputsUnchanged = true;
  await save('evidence.json', evidence);
  console.log(JSON.stringify({status: 'passed', evidence: await binding(`${OUTPUT}/evidence.json`)}));
} catch (error) {
  evidence.status = 'failed'; evidence.failure = {step, message: error.message,
    body: (await page.locator('body').innerText()).slice(0, 12000), screenshot: await capture('failure')};
  await save('evidence.failed.json', evidence); throw error;
} finally {await browser.close();}
