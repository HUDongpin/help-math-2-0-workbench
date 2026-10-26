#!/usr/bin/env node
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import {chromium} from 'playwright';
import {PNG} from 'pngjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ENTRY = 'scripts/harness-g678-alg-l11-a-choice-runtime.tsx';
const BUNDLES = 'work/g678-shared-page-factory/g678-alg-l11-tranche-a-vector-bundles-v6';
const IDS = [8, 11, 14, 19, 20, 21, 25].map((n) =>
  `shared-alg001-l11-p${String(n).padStart(3, '0')}`);
const args = process.argv.slice(2);
assert.ok(args.length === 2 && args[0] === '--run' && /^[a-z0-9-]+$/u.test(args[1]),
  'usage: qa-g678-alg-l11-a-choice-runtime.mjs --run <exclusive-run-name>');
const OUTPUT = `output/playwright/g678-alg-l11-a-choice-instructional-${args[1]}`;
const out = path.join(ROOT, OUTPUT);
const hash = (buffer) => createHash('sha256').update(buffer).digest('hex');
const json = (value) => `${JSON.stringify(value, null, 2)}\n`;
const save = (file, value) => writeFile(path.join(out, file), value, {flag: 'wx'});
async function binding(file) {
  const buffer = await readFile(path.resolve(ROOT, file));
  return {path: file, bytes: buffer.length, sha256: hash(buffer)};
}

await mkdir(out);
const inputFiles = [ENTRY, 'scripts/qa-g678-alg-l11-a-choice-runtime.mjs',
  'apps/web/components/animation-runtime.tsx',
  'apps/web/components/loaded-swf-host-canvas.tsx',
  'packages/demos/src/runtime.ts', 'packages/demos/src/contract.ts',
  'packages/demos/src/lesson-host-contract.ts',
  'packages/demos/src/g678-alg-l11-a-choice-instructional-visuals.tsx',
  'packages/demos/src/g678-alg-l11-tranche-a-source-vector-stage.tsx',
  'packages/demos/src/g678-alg-l11-interactive10-tranche-c-core.ts',
  'packages/demos/src/g678-alg-l11-interactive10-tranche-c-state.ts',
  'packages/demos/src/g678-alg-l11-interactive10-tranche-c-candidates.tsx',
  `${BUNDLES}/manifest.json`, ...IDS.map((id) => `${BUNDLES}/${id}.json`)];
const inputs = await Promise.all(inputFiles.map(binding));
await save('inputs.json', json(inputs));
const bundles = new Map(await Promise.all(IDS.map(async (id) => [id,
  JSON.parse(await readFile(path.join(ROOT, BUNDLES, `${id}.json`)))])));
const bundleManifest = JSON.parse(await readFile(path.join(ROOT, BUNDLES, 'manifest.json')));
for (const id of IDS) {
  const expected = bundleManifest.files.find((item) => item.path.endsWith(`/${id}.json`));
  assert.deepEqual(await binding(expected.path), expected);
}
const compiled = await build({entryPoints: [path.join(ROOT, ENTRY)],
  bundle: true, write: false, platform: 'browser', format: 'iife',
  jsx: 'automatic', define: {'process.env.NODE_ENV': '"production"'},
  metafile: true,
  alias: {'@helpmath/demos/runtime': path.join(ROOT, 'packages/demos/src/runtime.ts'),
    '@helpmath/demos/prototype-manifest': path.join(ROOT, 'packages/demos/src/prototype-manifest.ts')},
  plugins: [{name: 'explicit-unregistered-test-loader', setup(builder) {
    builder.onResolve({filter: /^@\/lib\/load-animation-module\.client$/}, () =>
      ({path: 'a7-test-loader', namespace: 'a7-test-only'}));
    builder.onLoad({filter: /.*/, namespace: 'a7-test-only'}, () => ({
      contents: 'export async function loadClientAnimationModule(key) {' +
        ' return window.__A7_TEST_MODULES[key]; }', loader: 'js'}));
  }}]});
const script = compiled.outputFiles[0].text;
await save('harness.js', script);
await save('esbuild-inputs.json', json(compiled.metafile.inputs));
assert.deepEqual(await Promise.all(inputFiles.map(binding)), inputs,
  'Product/runtime source changed during build');
const browser = await chromium.launch({headless: true});
const records = [];
let step = 'not-started';
const evidence = {artifactType: 'g678-alg-l11-a7-mounted-runtime-qa-v1',
  generatedAt: new Date().toISOString(), output: OUTPUT,
  boundary: 'actual-AnimationRuntime-and-memory-host-explicit-unregistered-test-loader',
  inputs, harness: {bytes: Buffer.byteLength(script), sha256: hash(Buffer.from(script))},
  browser: {version: browser.version(), executable: await binding(chromium.executablePath())},
  records, registered: false, productCalibrationPassed: false,
  authoritativeOriginalRuntime: false, visualFidelityAccepted: false,
  audioAccepted: false, humanVisualAccepted: false, ownerAccepted: false,
  strictComplete: false, releaseEligible: false, published: false};

async function snapshot(page) {
  return page.evaluate(() => {
    const root = document.querySelector('[data-instructional-successor]');
    const runtime = document.querySelector('[data-runtime-transport]');
    const host = document.querySelector('[data-test-loader]');
    return {phase: root?.getAttribute('data-choice-phase'),
      frame: document.querySelector('[data-source-vector-frame]')?.getAttribute('data-source-vector-frame'),
      paused: runtime?.getAttribute('data-runtime-paused'),
      held: runtime?.getAttribute('data-runtime-interactive-stop-held'),
      resolved: runtime?.getAttribute('data-runtime-interactive-stop-resolved-count'),
      replay: runtime?.getAttribute('data-runtime-replay'),
      hostFeedbackActive: host?.getAttribute('data-host-feedback-active'),
      completions: host?.getAttribute('data-test-completion-count'),
      choices: [...document.querySelectorAll('polygon[data-choice-slot]')].map((item) =>
        ({slot: item.getAttribute('data-choice-slot'), label: item.getAttribute('aria-label'),
          disabled: item.getAttribute('aria-disabled')})), audit: window.__A7_AUDIT};
  });
}
async function screenshot(page, name) {
  const bytes = await page.screenshot({fullPage: true});
  const file = `${name}.png`;
  await save(file, bytes);
  return {path: `${OUTPUT}/${file}`, bytes: bytes.length, sha256: hash(bytes)};
}
async function waitQuiz(page, id) {
  await page.waitForFunction(({frame}) => {
    const runtime = document.querySelector('[data-runtime-transport]');
    return document.querySelector('[data-source-vector-frame]')?.getAttribute('data-source-vector-frame') === String(frame) &&
      runtime?.getAttribute('data-runtime-interactive-stop-held') === 'true' &&
      document.querySelector('polygon[data-choice-slot][aria-disabled="false"]') !== null;
  }, {frame: bundles.get(id).quizFrame}, {timeout: 40_000});
}
async function expectState(page, expected) {
  await page.waitForFunction((want) => {
    const root = document.querySelector('[data-instructional-successor]');
    const runtime = document.querySelector('[data-runtime-transport]');
    const host = document.querySelector('[data-test-loader]');
    const state = {phase: root?.getAttribute('data-choice-phase'),
      held: runtime?.getAttribute('data-runtime-interactive-stop-held'),
      resolved: runtime?.getAttribute('data-runtime-interactive-stop-resolved-count'),
      hostFeedbackActive: host?.getAttribute('data-host-feedback-active')};
    return Object.entries(want).every(([key, value]) => state[key] === value);
  }, expected, {timeout: 5_000});
}
async function activate(page, slot, input) {
  const control = page.locator(`polygon[data-choice-slot="${slot}"]`);
  assert.equal(await control.count(), 1);
  assert.equal(await control.getAttribute('aria-disabled'), 'false');
  if (input === 'mouse') await control.click();
  else { await control.focus(); await page.keyboard.press(input); }
}
async function replay(page, id) {
  const old = (await snapshot(page)).replay;
  await page.getByRole('button', {name: 'Replay', exact: true}).click();
  await page.waitForFunction((before) => Number(document.querySelector(
    '[data-runtime-transport]')?.getAttribute('data-runtime-replay')) > Number(before), old);
  await waitQuiz(page, id);
  assert.equal((await snapshot(page)).hostFeedbackActive, 'false');
}
async function checkClarification(page) {
  const line = page.locator('[data-maintained-diagram-clarification]');
  assert.equal(await line.count(), 1);
  const attributes = await line.evaluate((element) => Object.fromEntries(
    ['x1', 'x2', 'y1', 'y2', 'stroke-linecap', 'marker-start', 'marker-end'].map((name) =>
      [name, element.getAttribute(name)])));
  assert.deepEqual(attributes, {x1: '436.10', x2: '553.00', y1: '282.95', y2: '282.95',
    'stroke-linecap': 'butt', 'marker-start': null, 'marker-end': null});
  const circles = page.locator('svg[role="img"] path[d^="M60.05 -20.35"]');
  assert.equal(await circles.count(), 1);
  assert.equal(await circles.getAttribute('fill'), 'none');
  const bounds = await page.locator('svg[role="img"]').boundingBox();
  const image = PNG.sync.read(await page.screenshot());
  const sample = (x, y) => {
    const index = (Math.round(bounds.y + y) * image.width + Math.round(bounds.x + x)) * 4;
    return [...image.data.subarray(index, index + 3)];
  };
  const left = sample(433.55, 282.95), right = sample(555.55, 282.95), middle = sample(494.55, 282.95);
  assert.ok(left.reduce((a, b) => a + b, 0) > 350 && right.reduce((a, b) => a + b, 0) > 350,
    'Open endpoint interior was filled');
  assert.ok(middle.reduce((a, b) => a + b, 0) < 200, 'Interval connector is not visible');
  return {attributes, endpointFill: 'none', pixels: {left, right, middle}};
}

try {
  for (const motion of ['reduce', 'no-preference']) {
    for (const id of motion === 'reduce' ? IDS : [IDS[0], IDS[3]]) {
      const suffix = `${id}-${motion === 'reduce' ? 'reduced' : 'natural'}`;
      const page = await browser.newPage({viewport: {width: 1100, height: 950}, reducedMotion: motion});
      const errors = [], requests = [], trace = [];
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
      await page.route('**/*', (route) => { requests.push(route.request().url()); return route.abort(); });
      const record = {animationId: id, motion, status: 'running', trace, errors, requests};
      records.push(record);
      try {
        step = `${suffix}:mount`;
        await page.setContent('<html><head><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; script-src \'unsafe-inline\'; style-src \'unsafe-inline\'; img-src data:"><style>body{margin:0;background:#fff;font-family:Arial}button{min-height:36px;margin-right:8px}.runtime-stage{width:800px}.runtime-stage svg{max-width:100%}</style></head><body><div id="root"></div></body></html>');
        await page.evaluate((animationId) => { window.__A7_CASE = {animationId}; }, id);
        await page.addScriptTag({content: script});
        await waitQuiz(page, id);
        trace.push({step: 'quiz-held', state: await snapshot(page)});
        record.questionScreenshot = await screenshot(page, `${suffix}-question`);
        assert.deepEqual(errors, []);
        if (id === IDS[0]) record.intervalClarification = await checkClarification(page);
        const bundle = bundles.get(id);
        const right = bundle.choiceControls.find((choice) => choice.correct).slot;
        const wrong = bundle.choiceControls.find((choice) => !choice.correct).slot;
        step = `${suffix}:pause`;
        await page.getByRole('button', {name: 'Pause test runtime'}).click();
        await page.waitForFunction(() => document.querySelector('[data-runtime-transport]')?.getAttribute('data-runtime-paused') === 'true');
        assert.ok((await snapshot(page)).choices.every((choice) => choice.disabled === 'true'));
        assert.equal(await page.getByRole('button', {name: 'Replay', exact: true}).isDisabled(), true);
        await page.getByRole('button', {name: 'Pause test runtime'}).click();
        await waitQuiz(page, id);
        trace.push({step: 'pause-resume', state: await snapshot(page)});
        if (id === IDS[1]) {
          step = `${suffix}:help`;
          await page.getByRole('button', {name: 'Need more help', exact: true}).focus();
          await page.keyboard.press('Enter');
          await page.getByRole('button', {name: 'Close help', exact: true}).waitFor();
          const text = await page.locator('[data-instructional-successor] > div[aria-live="polite"]').textContent();
          assert.match(text, /Use the rules of inequalities to find the solution set/u);
          assert.match(text, /negative number.*reverse.*direction/su);
          record.helpAccessibleText = text;
          record.helpScreenshot = await screenshot(page, `${suffix}-help`);
          assert.ok((await snapshot(page)).choices.every((choice) => choice.disabled === 'true'));
          await page.getByRole('button', {name: 'Close help', exact: true}).click();
          await waitQuiz(page, id);
        }
        step = `${suffix}:wrong1-replay`;
        await activate(page, wrong, 'mouse');
        await expectState(page, {phase: 'wrong-feedback', hostFeedbackActive: 'true', held: 'true'});
        trace.push({step: 'wrong-feedback-before-replay', state: await snapshot(page)});
        await replay(page, id);
        trace.push({step: 'replay-cleared-active-host-feedback', state: await snapshot(page)});
        step = `${suffix}:wrong-two-attempts`;
        await activate(page, wrong, 'mouse');
        await expectState(page, {phase: 'wrong-feedback', hostFeedbackActive: 'true'});
        await page.getByRole('button', {name: 'Try again', exact: true}).click();
        await expectState(page, {phase: 'choosing', hostFeedbackActive: 'false', held: 'true'});
        await activate(page, wrong, 'Enter');
        await expectState(page, {phase: 'wrong-feedback', hostFeedbackActive: 'true'});
        await page.getByRole('button', {name: 'Continue', exact: true}).click();
        await expectState(page, {hostFeedbackActive: 'false', held: 'false', resolved: '1'});
        trace.push({step: 'second-wrong-resolved-stop', state: await snapshot(page)});
        await replay(page, id);
        step = `${suffix}:right-space`;
        await activate(page, right, 'Space');
        await expectState(page, {phase: 'right-feedback', hostFeedbackActive: 'true'});
        await page.getByRole('button', {name: 'Continue', exact: true}).click();
        await expectState(page, {hostFeedbackActive: 'false', held: 'false', resolved: '1'});
        const completed = await snapshot(page);
        trace.push({step: 'right-resolved-stop', state: completed});
        assert.ok(completed.choices.every((choice) => choice.disabled === 'true'),
          'Resolved question became answerable again without Replay');
        if (motion === 'reduce' && id === IDS[0]) {
          await replay(page, id);
          step = `${suffix}:blocked-record`;
          await page.getByRole('button', {name: 'Reject answer record in real host'}).click();
          await activate(page, right, 'mouse');
          await page.getByRole('alert').waitFor();
          assert.equal(await page.getByRole('button', {name: 'Continue', exact: true}).isDisabled(), true);
          await page.getByRole('button', {name: 'Send allowed host reset'}).click();
          await expectState(page, {hostFeedbackActive: 'false', held: 'true', resolved: '0'});
          const blocked = await snapshot(page);
          assert.ok(blocked.audit.some((item) => item.request.type === 'record-practice-feedback' && item.status === 'blocked'));
          assert.equal(blocked.audit.at(-1).status, 'allowed');
          assert.equal(await page.getByRole('button', {name: 'Continue', exact: true}).isDisabled(), true);
          record.blockedRecord = blocked;
          record.blockedScreenshot = await screenshot(page, `${suffix}-blocked-record`);
          await page.getByRole('button', {name: 'Reject answer record in real host'}).click();
          await replay(page, id);
        }
        assert.deepEqual(errors, []);
        assert.deepEqual(requests, []);
        record.status = 'passed';
      } catch (error) {
        record.status = 'failed'; record.failedStep = step;
        record.error = error.stack ?? String(error);
        record.failureState = await snapshot(page).catch(() => null);
        record.failureScreenshot = await screenshot(page, `${suffix}-failure`).catch(() => null);
        await save(`${suffix}-failure.html`, await page.content());
      } finally {
        await save(`${suffix}.json`, json(record));
        console.log(JSON.stringify({case: suffix, status: record.status, failedStep: record.failedStep, error: record.error?.split('\n')[0]}));
        await page.close();
      }
    }
  }
} finally {
  await browser.close();
  evidence.inputsUnchanged = JSON.stringify(await Promise.all(inputFiles.map(binding))) === JSON.stringify(inputs);
  evidence.status = evidence.inputsUnchanged && records.length === 9 && records.every((item) => item.status === 'passed')
    ? 'mounted-successor-runtime-checks-passed-unregistered' : 'failed-preserved-for-diagnosis';
  await save('evidence.json', json(evidence));
}
console.log(JSON.stringify({output: OUTPUT, status: evidence.status, passed: records.filter((r) => r.status === 'passed').length,
  failed: records.filter((r) => r.status === 'failed').length, productCalibrationPassed: false}));
if (evidence.status.startsWith('failed')) process.exitCode = 1;
