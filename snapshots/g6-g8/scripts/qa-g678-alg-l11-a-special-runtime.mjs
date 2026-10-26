#!/usr/bin/env node
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import {chromium} from 'playwright';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
assert.ok(args.length === 2 && args[0] === '--run' && /^[a-z0-9-]+$/u.test(args[1]), 'Expected exclusive --run name');
const OUTPUT = `output/playwright/g678-alg-l11-a-special-mounted-${args[1]}`;
const out = path.join(ROOT, OUTPUT);
await mkdir(out);
const hash = b => createHash('sha256').update(b).digest('hex');
const save = (file, value) => writeFile(path.join(out, file), typeof value === 'string' || Buffer.isBuffer(value)
  ? value : JSON.stringify(value, null, 2) + '\n', {flag: 'wx'});
const binding = async file => {const b = await readFile(path.resolve(ROOT, file)); return {path: file, bytes: b.length, sha256: hash(b)};};
const configPath = id => `work/g678-shared-page-factory/g678-alg-l11-a-special-instructional-visuals-v2/${id}/interaction-config.json`;
const bundlePath = id => `work/g678-shared-page-factory/g678-alg-l11-tranche-a-vector-bundles-v4/${id}.json`;
const IDS = ['006', '009', '010'].map(p => `shared-alg001-l11-p${p}`);
const ENTRY = 'scripts/harness-g678-alg-l11-a-special-runtime.tsx';
const inputPaths = [ENTRY, 'scripts/qa-g678-alg-l11-a-special-runtime.mjs',
  'packages/demos/src/g678-alg-l11-a-special-instructional-visuals.tsx',
  'packages/demos/src/g678-alg-l11-tranche-a-source-vector-stage.tsx',
  'apps/web/components/animation-runtime.tsx', 'apps/web/lib/descriptor-driven-glossary-pause.ts',
  'packages/demos/src/runtime.ts', 'packages/demos/src/contract.ts', 'packages/demos/src/lesson-host-contract.ts',
  ...IDS.flatMap(id => [configPath(id), bundlePath(id)])];
const inputs = await Promise.all(inputPaths.map(binding));
await save('inputs.json', inputs);
const compiled = await build({entryPoints: [path.join(ROOT, ENTRY)], bundle: true, write: false,
  platform: 'browser', format: 'iife', jsx: 'automatic', metafile: true,
  define: {'process.env.NODE_ENV': '"production"'},
  alias: {'@helpmath/demos/runtime': path.join(ROOT, 'packages/demos/src/runtime.ts'),
    '@helpmath/demos/prototype-manifest': path.join(ROOT, 'packages/demos/src/prototype-manifest.ts')},
  plugins: [{name: 'explicit-special3-test-loader', setup(builder) {
    builder.onResolve({filter: /^@\/lib\/load-animation-module\.client$/}, () => ({path: 'special-loader', namespace: 'test-only'}));
    builder.onLoad({filter: /.*/, namespace: 'test-only'}, () => ({contents:
      'export async function loadClientAnimationModule(key) { return window.__SPECIAL_MODULES[key]; }', loader: 'js'}));
  }}]});
const script = compiled.outputFiles[0].text;
await save('harness.js', script); await save('esbuild-inputs.json', compiled.metafile.inputs);
const browser = await chromium.launch({headless: true});
const records = [];
let currentPage, step = 'start';
const evidence = {artifactType: 'g678-alg-l11-a-special-mounted-runtime-qa-v1', generatedAt: new Date().toISOString(),
  boundary: 'actual-AnimationRuntime-and-memory-host-explicit-unregistered-test-loader', inputs,
  browser: {version: browser.version()}, records, registered: false, productCalibrationPassed: false,
  originalRuntimeAccepted: false, audioAccepted: false, humanVisualAccepted: false, ownerAccepted: false,
  strictComplete: false, published: false};
const snapshot = page => page.evaluate(() => {
  const root = document.querySelector('[data-a-special-source-visual]'), runtime = document.querySelector('[data-runtime-transport]'), host = document.querySelector('[data-test-loader]');
  return {frame: root?.getAttribute('data-main-frame'), phase: root?.getAttribute('data-interaction-phase'),
    feedbackFrame: root?.getAttribute('data-feedback-frame'), held: runtime?.getAttribute('data-runtime-interactive-stop-held'),
    resolved: runtime?.getAttribute('data-runtime-interactive-stop-resolved-count'), paused: runtime?.getAttribute('data-runtime-paused'),
    replay: runtime?.getAttribute('data-runtime-replay'), hostFeedbackActive: host?.getAttribute('data-host-feedback-active'),
    completions: host?.getAttribute('data-completions'), audit: window.__SPECIAL_AUDIT};
});
async function screenshot(page, name) {const file = `${name}.png`; await save(file, await page.screenshot({fullPage: true})); return binding(`${OUTPUT}/${file}`);}
async function phase(page, want, timeout = 6000) {
  await page.waitForFunction(want => {
    const root = document.querySelector('[data-a-special-source-visual]');
    return root?.getAttribute('data-interaction-phase') === want &&
      (want !== 'choosing' || root.querySelector('polygon[data-source-control-id^="Opt_"][aria-disabled="false"]'));
  }, want, {timeout});
}
async function activate(page, id, input = 'Enter') {
  const hit = page.locator(`[data-a-special-source-visual] polygon[data-source-control-id="${id}"]`);
  assert.equal(await hit.getAttribute('aria-disabled'), 'false');
  if (input === 'mouse') await hit.click(); else {await hit.focus(); await page.keyboard.press(input);}
}
try {
  for (const [id, motion] of ['reduce', 'no-preference'].flatMap(motion => IDS.map(id => [id, motion]))) {
    step = `${id}/${motion}:mount`;
    const config = JSON.parse(await readFile(path.join(ROOT, configPath(id))));
    const bundle = JSON.parse(await readFile(path.join(ROOT, bundlePath(id))));
    const page = currentPage = await browser.newPage({viewport: {width: 1100, height: 1000}, reducedMotion: motion});
    const record = {animationId: id, motion, status: 'running', errors: [], requests: [], trace: []}; records.push(record);
    page.on('pageerror', e => record.errors.push(e.message));
    page.on('console', m => {if (m.type() === 'error') record.errors.push(m.text());});
    await page.route('**/*', route => {record.requests.push(route.request().url()); return route.abort();});
    await page.setContent('<html><head><meta http-equiv="Content-Security-Policy" content="default-src \'none\';script-src \'unsafe-inline\';style-src \'unsafe-inline\';img-src data:"><style>body{margin:0;background:white;font-family:Arial}button{min-height:36px;margin:4px}.runtime-stage{width:800px}</style></head><body><div id="root"></div></body></html>');
    await page.evaluate(value => {window.__SPECIAL_CASE = value;}, {config, bundle});
    await page.addScriptTag({content: script});
    if (id === IDS[0]) {
      step = `${id}/${motion}:quiz`;
      await phase(page, 'choosing'); assert.equal((await snapshot(page)).held, 'true');
      record.question = await screenshot(page, `${id}-${motion}-question`);
      const wrong = config.answers.filter(a => !a.correct), right = config.answers.find(a => a.correct);
      for (const [index, answer] of wrong.entries()) {
        step = `${id}/${motion}:wrong${index}`;
        await activate(page, answer.id, index === 0 ? 'mouse' : 'Space');
        await phase(page, 'wrong-feedback');
        await page.getByRole('button', {name: 'Close explanation', exact: true}).waitFor();
        assert.equal((await snapshot(page)).feedbackFrame, '20');
        record.trace.push({step: 'source-wrong-feedback', state: await snapshot(page)});
        if (index === 0) {
          record.wrongExplanation = await screenshot(page, `${id}-${motion}-wrong-explanation`);
          const glossary = config.feedback.wrong.glossaryControls[0];
          await activate(page, `glossary-${glossary.entryId}-depth-${glossary.depth}`);
          await page.getByRole('dialog').waitFor(); assert.equal((await snapshot(page)).paused, 'true');
          await page.getByRole('button', {name: 'Toggle glossary language'}).click();
          assert.equal(await page.locator('[data-glossary-definition]').textContent(), config.glossaryEntries.find(e => e.id === glossary.entryId).definitions.es);
          await page.getByRole('button', {name: 'Close glossary', exact: true}).click();
        }
        await page.getByRole('button', {name: 'Close explanation', exact: true}).click();
        await phase(page, 'choosing'); assert.equal((await snapshot(page)).hostFeedbackActive, 'false');
      }
      step = `${id}/${motion}:replay-active-feedback`;
      await activate(page, wrong[0].id); await phase(page, 'wrong-feedback');
      await page.getByRole('button', {name: 'Replay', exact: true}).click();
      await phase(page, 'choosing'); assert.equal((await snapshot(page)).hostFeedbackActive, 'false', 'Replay left host feedback active');
      step = `${id}/${motion}:blocked-record`;
      await page.getByRole('button', {name: 'Reject answer record', exact: true}).click();
      await activate(page, right.id); await page.getByRole('alert').waitFor();
      assert.equal((await snapshot(page)).phase, 'choosing'); assert.equal((await snapshot(page)).held, 'true');
      await page.getByRole('button', {name: 'Reject answer record', exact: true}).click();
      step = `${id}/${motion}:pause-correct-feedback`;
      await activate(page, right.id); await phase(page, 'right-feedback');
      await page.getByRole('button', {name: 'Pause test runtime'}).click();
      const paused = await snapshot(page); await page.waitForTimeout(300);
      assert.equal((await snapshot(page)).feedbackFrame, paused.feedbackFrame);
      assert.equal(await page.getByRole('button', {name: 'Replay', exact: true}).isDisabled(), true);
      await page.getByRole('button', {name: 'Pause test runtime'}).click();
      await page.waitForFunction(() => document.querySelector('[data-runtime-transport]')?.getAttribute('data-runtime-interactive-stop-resolved-count') === '1');
      record.trace.push({step: 'correct-source-feedback-released-stop', state: await snapshot(page)});
    } else if (motion === 'reduce') {
      step = `${id}:reduced-complete-teaching-state`;
      await page.waitForFunction(frame => Number(document.querySelector('[data-a-special-source-visual]')?.getAttribute('data-main-frame')) === frame, config.frameCount);
      assert.equal(await page.locator('polygon[data-source-control-id^="Opt_"]').count(), 0);
      assert.equal(await page.getByRole('button', {name: 'Close explanation', exact: true}).count(), 0);
      record.finalFrame = await screenshot(page, `${id}-reduced-final-frame`);
      record.trace.push({step: 'reduced-complete-source-teaching-state', state: await snapshot(page)});
      await page.getByRole('button', {name: 'Replay', exact: true}).click();
      await page.waitForFunction(frame => Number(document.querySelector('[data-a-special-source-visual]')?.getAttribute('data-main-frame')) === frame, config.frameCount);
    } else {
      step = `${id}:linear-glossary`;
      const control = config.glossaryControls[0];
      await page.waitForFunction(frame => Number(document.querySelector('[data-a-special-source-visual]')?.getAttribute('data-main-frame')) >= frame, control.firstFrame, {timeout: 40000});
      await activate(page, `glossary-${control.entryId}-depth-${control.depth}`);
      await page.getByRole('dialog').waitFor(); const paused = await snapshot(page);
      await page.waitForTimeout(300); assert.equal((await snapshot(page)).frame, paused.frame);
      assert.equal(await page.locator('polygon[data-source-control-id^="Opt_"]').count(), 0);
      assert.equal(await page.getByRole('button', {name: 'Close explanation', exact: true}).count(), 0);
      record.glossary = await screenshot(page, `${id}-glossary`);
      await page.getByRole('button', {name: 'Close glossary', exact: true}).click();
      await page.waitForFunction(frame => Number(document.querySelector('[data-a-special-source-visual]')?.getAttribute('data-main-frame')) === frame, config.frameCount, {timeout: 45000});
      record.finalFrame = await screenshot(page, `${id}-final-frame`);
      record.trace.push({step: 'all-source-linear-frames-played', state: await snapshot(page)});
      await page.getByRole('button', {name: 'Replay', exact: true}).click();
      await page.waitForFunction(() => Number(document.querySelector('[data-a-special-source-visual]')?.getAttribute('data-main-frame')) < 10);
    }
    assert.deepEqual(record.errors, []); assert.deepEqual(record.requests, []);
    record.status = 'passed'; await save(`${id}-${motion}.json`, record); await page.close(); currentPage = null;
    console.log(JSON.stringify({passed: id, motion}));
  }
  assert.deepEqual(await Promise.all(inputPaths.map(binding)), inputs, 'Bound input drift');
  evidence.status = 'passed'; evidence.inputsUnchanged = true; await save('evidence.json', evidence);
  console.log(JSON.stringify({status: 'passed', cases: records.length, evidence: await binding(`${OUTPUT}/evidence.json`)}));
} catch (error) {
  evidence.status = 'failed'; evidence.failure = {step, message: error.message, stack: error.stack};
  if (currentPage) {evidence.failure.state = await snapshot(currentPage); evidence.failure.screenshot = await screenshot(currentPage, 'failure');}
  await save('evidence.failed.json', evidence); throw error;
} finally {await browser.close();}
