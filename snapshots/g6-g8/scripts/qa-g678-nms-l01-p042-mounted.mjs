#!/usr/bin/env node
// Isolated candidate test-loader only. Never navigate to a product route or server.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import {chromium} from 'playwright';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SELF = 'scripts/qa-g678-nms-l01-p042-mounted.mjs';
const FIXTURE = 'scripts/qa-g678-nms-l01-p042-mounted-fixture.tsx';
const MODULE = 'packages/demos/src/g678-nms-l01-p042-candidate.tsx';
const VISUAL = 'packages/demos/src/generated/g678-nms-l01-p042-source-visual-v1.ts';
const RUN = 'work/g678-shared-page-factory/g678-nms-l01-p042-source-visual-v1/run.json';
const ID = 'shared-nms002-l01-p042', SCENARIO = 'nms-l01-p042-source-static-frame';
const PRIMARY = '[data-mounted-instance="primary"]', FIGURE = `${PRIMARY} [data-p042-source-candidate="v1"]`;
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const json = value => `${JSON.stringify(value, null, 2)}\n`;
const binding = async file => {const bytes = await readFile(path.resolve(ROOT, file)); return {path: file, bytes: bytes.length, sha256: hash(bytes)};};
export const CASES = Object.freeze([1440, 390].flatMap(width => ['no-preference', 'reduce'].map(motion => ({
  name: `${width}-${motion}`, width, height: 1000, motion, touch: width === 390,
}))));
export function parseArgs(args) {
  const result = {};
  for (let i = 0; i < args.length; i += 2) {
    assert.ok(['--run', '--module-sha256', '--visual-sha256', '--source-run-sha256'].includes(args[i]));
    assert.equal(result[args[i]], undefined); assert.ok(args[i + 1]); result[args[i]] = args[i + 1];
  }
  assert.match(result['--run'] ?? '', /^[a-z0-9-]+$/u);
  for (const key of ['module', 'visual', 'source-run']) assert.match(result[`--${key}-sha256`] ?? '', /^[a-f0-9]{64}$/u);
  return result;
}
export function reverseInstanceNamespace(svg, prefix) {
  assert.match(prefix, /^p042-[a-zA-Z0-9_-]+-$/u);
  return svg.replace(/\bid="([^"]+)"/gu, (all, id) => id.startsWith(prefix) ? `id="${id.slice(prefix.length)}"` : all)
    .replace(/(xlink:href|href)="#([^"]+)"/gu, (all, attribute, id) => id.startsWith(prefix) ? `${attribute}="#${id.slice(prefix.length)}"` : all)
    .replace(/url\(#([^)]*)\)/gu, (all, id) => id.startsWith(prefix) ? `url(#${id.slice(prefix.length)})` : all);
}
export async function pureCandidateChecks() {
  const compiled = await build({entryPoints: [path.join(ROOT, MODULE)], bundle: true, write: false, platform: 'node', format: 'esm', jsx: 'automatic'});
  const candidate = await import(`data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].text).toString('base64')}`);
  const module = candidate.G678_NMS_L01_P042_CANDIDATE_MODULE, config = candidate.G678_NMS_L01_P042_CONFIG;
  assert.equal(module.key, ID); assert.equal(module.movie.frameCount, 10); assert.equal(module.runtime.defaultFrameDomain, 'sprite-23');
  assert.equal(module.movie.fps, 12); assert.deepEqual(module.movie.stage, {width: 800, height: 600});
  assert.equal(module.playbackMode, 'once'); assert.equal(module.playbackEndFrame, 125); assert.equal(module.reducedMotionFrame, 125);
  assert.deepEqual(module.audioCues, []); assert.deepEqual(module.audioTracks, []); assert.deepEqual(module.interactiveAudioAssets, []);
  assert.deepEqual(module.lessonHost.capabilities, []); assert.equal(config.currentJavaScriptRegistered, false);
  const context = frame => ({frame, frameDomain: 'sprite-23', rootFrame: 6, scenario: SCENARIO, lang: 'en', seed: 0, replay: 0});
  const states = Array.from({length: 125}, (_, index) => candidate.resolveNmsL01P042Frame(index + 1, context(index + 1)));
  for (const [index, state] of states.entries()) {
    assert.equal(state.status, 'ready'); assert.equal(state.frame, index + 1); assert.equal(state.frameDomain, 'sprite-23');
    assert.equal(state.rootFrame, 6); assert.equal(state.visualStateId, 'full-root-static-composition');
    assert.equal(state.sourceTerminalStopReached, index === 124); assert.equal(state.currentJavaScriptRegistered, false);
  }
  assert.equal(new Set(states.map(s => s.sourceDrawingSha256)).size, 1);
  const invalid = [{frameDomain: 'root'}, {frameDomain: 'sprite-999'}, {rootFrame: 1}, {scenario: 'other'}, {lang: 'es'},
    {seed: -1}, {seed: 2 ** 32}, {seed: 0.5}, {replay: -1}, {frame: 2}];
  for (const override of invalid) assert.equal(candidate.resolveNmsL01P042Frame(1, {...context(1), ...override}).status, 'blocked');
  for (const frame of [0, 126, 1.5, NaN]) assert.equal(candidate.resolveNmsL01P042Frame(frame, context(frame)).status, 'blocked');
  return {validFrameStates: states.length, distinctVisualStateHashes: 1, invalidContextsBlocked: invalid.length + 4,
    rootFrames: 10, mainFrames: 125, fps: 12, zeroRendererCapabilities: true, noAudioIntegration: true};
}
export async function buildFixture() {
  return build({entryPoints: [path.join(ROOT, FIXTURE)], bundle: true, write: false, metafile: true,
    platform: 'browser', format: 'iife', jsx: 'automatic', define: {'process.env.NODE_ENV': '"production"'},
    alias: {'@helpmath/demos/runtime': path.join(ROOT, 'packages/demos/src/runtime.ts'), '@helpmath/demos/prototype-manifest': path.join(ROOT, 'packages/demos/src/prototype-manifest.ts')},
    plugins: [{name: 'p042-explicit-unregistered-test-loader', setup(builder) {
      builder.onResolve({filter: /^@\/lib\/load-animation-module\.client$/}, () => ({path: 'p042-loader', namespace: 'p042-test'}));
      builder.onLoad({filter: /.*/, namespace: 'p042-test'}, () => ({contents: 'export async function loadClientAnimationModule(key){return window.__P042_MOUNTED_MODULES[key];}', loader: 'js'}));
    }}]});
}
async function main(args) {
  const options = parseArgs(args);
  for (const [key, file] of [['module', MODULE], ['visual', VISUAL], ['source-run', RUN]])
    assert.equal((await binding(file)).sha256, options[`--${key}-sha256`], `Stable GO pin mismatch: ${file}`);
  const run = JSON.parse(await readFile(path.join(ROOT, RUN), 'utf8'));
  const sourceText = await readFile(path.join(ROOT, VISUAL), 'utf8');
  const source = JSON.parse(sourceText.slice(sourceText.indexOf(' = ') + 3, sourceText.lastIndexOf(' as const;')));
  assert.equal(hash(source.svg), source.svgSha256); assert.equal(source.animationId, ID);
  const files = new Set([SELF, FIXTURE, 'scripts/qa-g678-nms-l01-p042-mounted.test.mjs', MODULE, VISUAL, RUN,
    'packages/demos/tests/g678-nms-l01-p042-candidate.test.tsx', 'scripts/g678-nms-l01-p042-build-source-visual.mjs',
    'apps/web/components/animation-runtime.tsx', 'packages/demos/src/runtime.ts', 'packages/demos/src/contract.ts', 'packages/demos/src/lesson-host-contract.ts']);
  for (const item of [run.extraction, run.sourceXml, ...run.outputs.filter(o => !o.path.endsWith('.mp3'))]) {
    assert.deepEqual(await binding(item.path), item); files.add(item.path);
  }
  const beforeBuild = await Promise.all([...files].sort().map(binding));
  const pure = await pureCandidateChecks();
  const compiled = await buildFixture();
  assert.deepEqual(await Promise.all([...files].sort().map(binding)), beforeBuild, 'Core inputs changed while bundling');
  for (const input of Object.keys(compiled.metafile.inputs).filter(file => !file.startsWith('p042-test:'))) files.add(input);
  assert.equal(Object.keys(compiled.metafile.inputs).some(file => /registry\.local-only|private-current-js-registry|load-animation-module\.client\.ts/u.test(file)), false, 'Official registry loader entered explicit fixture');
  const inputPaths = [...files].sort(), inputs = await Promise.all(inputPaths.map(binding));
  const output = `output/playwright/g678-nms-l01-p042-mounted-${options['--run']}`;
  await mkdir(path.join(ROOT, output));
  const save = (file, bytes) => writeFile(path.join(ROOT, output, file), bytes, {flag: 'wx'});
  await save('qa-runner-source.mjs', await readFile(path.join(ROOT, SELF)));
  await save('qa-fixture-source.tsx', await readFile(path.join(ROOT, FIXTURE)));
  await save('qa-tests-source.mjs', await readFile(path.join(ROOT, 'scripts/qa-g678-nms-l01-p042-mounted.test.mjs')));
  await save('fixture-bundle.js', compiled.outputFiles[0].text); await save('esbuild-inputs.json', json(compiled.metafile.inputs));
  const evidence = {schemaVersion: 1, artifactType: 'g678-nms-l01-p042-isolated-mounted-runtime-qa', createdAt: new Date().toISOString(), inputs, pure,
    inputBindingScope: 'Core/source inputs before+after build; full actual esbuild dependency closure after build+after browser.',
    fixture: {bytes: Buffer.byteLength(compiled.outputFiles[0].text), sha256: hash(compiled.outputFiles[0].text)}, records: [],
    boundary: 'Actual AnimationRuntime workbench presentation + actual empty-capability memory-only host, explicit unregistered test-loader. Local setContent bundle; no server, product route, registry, or provider.',
    mobileReadability: 'The 800x600 source is proportionally fit to390px. Original roughly20px native glyphs become roughly10px; no20px-mobile-readability or product-calibration claim.',
    registered: false, actualMyLesson: false, productCalibrationPassed: false, sourceAudioIntegrated: false, audioAccepted: false,
    authoritativeOriginalRuntime: false, visualFidelityAccepted: false, humanVisualAccepted: false, ownerAccepted: false, strictComplete: false, released: false, published: false};
  let browser, page, record, step = 'launch';
  const snapshot = () => page.locator(PRIMARY).evaluate(root => {const runtime = root.querySelector('.runtime-shell'), figure = root.querySelector('[data-p042-source-candidate]');
    return {frame: Number(figure?.getAttribute('data-source-main-frame')), replay: Number(runtime?.getAttribute('data-runtime-replay')),
      paused: runtime?.getAttribute('data-runtime-paused'), complete: runtime?.getAttribute('data-runtime-playback-complete'),
      completions: Number(root.getAttribute('data-completions')), requests: Number(root.getAttribute('data-host-request-count')),
      figureReplay: Number(figure?.getAttribute('data-runtime-replay')), figurePaused: figure?.getAttribute('data-runtime-paused')};});
  const shot = async label => {const bytes = await page.screenshot({fullPage: true}), filename = `${record.name}-${label}.png`;
    await save(filename, bytes); record.screenshots.push({path: `${output}/${filename}`, bytes: bytes.length, sha256: hash(bytes)});};
  async function inspect(label) {
    const actual = await page.locator('[data-p042-source-candidate]').evaluateAll(figures => {
      const box = node => {const b = node.getBoundingClientRect(); return {x: b.x, y: b.y, left: b.left, right: b.right, top: b.top, bottom: b.bottom, width: b.width, height: b.height};};
      const ids = [...document.querySelectorAll('svg [id]')], byId = new Map();
      for (const node of ids) {const matches = byId.get(node.id) ?? []; matches.push(node); byId.set(node.id, matches);}
      const badReferences = [];
      for (const svg of document.querySelectorAll('svg')) for (const node of [svg, ...svg.querySelectorAll('*')]) for (const attribute of node.attributes) {
        const refs = [...attribute.value.matchAll(/url\(#([^)]*)\)/gu)].map(m => m[1]);
        if (['href', 'xlink:href'].includes(attribute.name) && attribute.value.startsWith('#')) refs.push(attribute.value.slice(1));
        for (const id of refs) {const targets = byId.get(id) ?? []; if (targets.length !== 1 || targets[0].closest('svg') !== svg) badReferences.push({id, count: targets.length});}
      }
      return {viewport: innerWidth, documentWidth: document.documentElement.scrollWidth,
        mediaElements: document.querySelectorAll('audio, video').length,
        duplicateIds: [...byId].filter(([, matches]) => matches.length > 1).map(([id]) => id), badReferences,
        figures: figures.map(figure => {const svg = figure.querySelector('svg'), native = svg.getBBox(), b = box(figure), clips = [];
          for (let a = figure.parentElement; a && a !== document.body; a = a.parentElement) {const s = getComputedStyle(a), r = box(a);
            if (['hidden', 'clip'].includes(s.overflowX) && (b.left < r.left - 1 || b.right > r.right + 1) || ['hidden', 'clip'].includes(s.overflowY) && (b.top < r.top - 1 || b.bottom > r.bottom + 1)) clips.push(String(a.className));}
          return {box: b, svgBox: box(svg), native: {x: native.x, y: native.y, width: native.width, height: native.height}, clips,
            raw: svg.outerHTML, firstId: svg.querySelector('[id]').id, label: figure.getAttribute('aria-label'), lang: figure.lang,
            sourceSha: figure.getAttribute('data-source-drawing-sha256'), controls: figure.querySelectorAll('button,input,[role="button"]').length};})};
    });
    assert.equal(actual.figures.length, 2); assert.deepEqual(actual.duplicateIds, []); assert.deepEqual(actual.badReferences, []);
    assert.equal(actual.mediaElements, 0);
    assert.ok(actual.documentWidth <= actual.viewport + 1);
    const expected = await page.evaluate(svg => {const t = document.createElement('template'); t.innerHTML = svg; const root = t.content.querySelector('svg'); return {raw: root.outerHTML, firstId: root.querySelector('[id]').id};}, source.svg);
    for (const figure of actual.figures) {
      assert.equal(figure.controls, 0); assert.equal(figure.lang, 'en'); assert.equal(figure.sourceSha, source.svgSha256);
      assert.equal(figure.label, `${source.literalTitle}. ${source.literalSteps.map((text, i) => `${i + 1}. ${text}`).join(' ')}`);
      assert.deepEqual(figure.clips, []); assert.ok(Math.abs(figure.box.width / figure.box.height - 4 / 3) < .01);
      assert.equal(figure.svgBox.width, figure.box.width); assert.equal(figure.svgBox.height, figure.box.height);
      assert.ok(figure.native.x >= -1 && figure.native.y >= -1 && figure.native.x + figure.native.width <= 801 && figure.native.y + figure.native.height <= 601, 'Full source composition exceeds native stage');
      assert.ok(figure.firstId.endsWith(expected.firstId)); const prefix = figure.firstId.slice(0, -expected.firstId.length);
      const raw = reverseInstanceNamespace(figure.raw, prefix); assert.equal(raw, expected.raw, 'Actual SVG subtree differs beyond declared instance IDs');
      figure.parsedSubtreeSha256 = hash(raw); delete figure.raw;
    }
    record.geometry.push({label, ...actual}); record.trace.push({label, at: new Date().toISOString(), state: await snapshot()});
  }
  const waitFrame = value => page.waitForFunction(({selector, value}) => Number(document.querySelector(selector)?.getAttribute('data-source-main-frame')) === value, {selector: FIGURE, value}, {timeout: 15000});
  async function pause(desired) {
    if ((await snapshot()).paused !== String(desired)) await page.locator(`${PRIMARY} [data-test-pause]`).click();
    await page.waitForFunction(({selector, desired}) => document.querySelector(selector)?.getAttribute('data-runtime-paused') === String(desired), {selector: `${PRIMARY} .runtime-shell`, desired});
  }
  try {
    browser = await chromium.launch({headless: true}); evidence.browser = {version: browser.version(), executable: await binding(chromium.executablePath())};
    for (const config of CASES) {
      record = {...config, status: 'running', errors: [], requests: [], trace: [], screenshots: [], geometry: []}; evidence.records.push(record);
      page = await browser.newPage({viewport: {width: config.width, height: config.height}, reducedMotion: config.motion, hasTouch: config.touch});
      page.on('pageerror', e => record.errors.push(e.message)); page.on('console', m => {if (m.type() === 'error') record.errors.push(m.text());});
      await page.route('**/*', route => {record.requests.push(route.request().url()); return route.abort();});
      await page.setContent('<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; script-src \'unsafe-inline\'; style-src \'unsafe-inline\'; img-src data:"><style>html,body{margin:0;font-family:system-ui,sans-serif;background:white;color:#13284c}*{box-sizing:border-box}main{padding:8px}h1{font-size:22px}h2{font-size:18px}section{width:100%;max-width:800px;margin:16px auto 30px}button{min-height:44px;padding:8px 14px;margin:4px;border:1px solid #2459a9;background:white}button:focus-visible{outline:3px solid #b45309}.runtime-toolbar{display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px}.runtime-toolbar span{display:inline-block;margin-right:8px}.runtime-stage{width:100%;aspect-ratio:4/3}.reduced-motion-note{font-size:14px}</style></head><body><div id="root"></div></body></html>');
      await page.evaluate(() => {window.__P042_OBSERVED = []; const scan = () => {const section = document.querySelector('[data-mounted-instance="primary"]'), f = section?.querySelector('[data-p042-source-candidate]'); if (!f) return;
        const sample = {frame: Number(f.getAttribute('data-source-main-frame')), replay: Number(f.getAttribute('data-runtime-replay')), paused: f.getAttribute('data-runtime-paused'), at: performance.now()};
        const previous = window.__P042_OBSERVED.at(-1); if (!previous || previous.frame !== sample.frame || previous.replay !== sample.replay || previous.paused !== sample.paused) window.__P042_OBSERVED.push(sample);};
        new MutationObserver(scan).observe(document.body, {subtree: true, childList: true, attributes: true, attributeFilter: ['data-source-main-frame', 'data-runtime-replay', 'data-runtime-paused']});});
      await page.addScriptTag({content: compiled.outputFiles[0].text}); await page.locator(FIGURE).waitFor();
      const terminal = config.motion === 'reduce'; await waitFrame(terminal ? 125 : 1);
      step = `${config.name}-initial`; await inspect('initial-two-mounts'); await shot('initial-full-source');
      if (!terminal) {
        assert.equal((await snapshot()).complete, 'false'); await pause(false);
        await page.waitForFunction(selector => Number(document.querySelector(selector)?.getAttribute('data-source-main-frame')) >= 18, FIGURE, {timeout: 5000});
        await pause(true); await page.waitForTimeout(100); const held = await snapshot(); await page.waitForTimeout(600);
        assert.deepEqual(await snapshot(), held); await inspect('mid-timeline-paused');
        await pause(false); await waitFrame(125);
      }
      await page.waitForFunction(selector => document.querySelector(selector)?.getAttribute('data-completions') === '1', PRIMARY);
      step = `${config.name}-terminal`; const stopped = await snapshot(); await page.waitForTimeout(700); assert.deepEqual(await snapshot(), stopped);
      await inspect('terminal-stops-at125'); await shot('terminal-full-source'); await pause(true);
      const replay = page.locator(`${PRIMARY} [data-replay-keyboard="enter-space"]`);
      for (const [index, input] of ['mouse', 'Enter', 'Space'].entries()) {
        step = `${config.name}-runtime-replay-${input}`;
        if (input === 'mouse') {if (config.touch) await replay.tap(); else await replay.click();}
        else {await replay.focus(); await page.keyboard.press(input);}
        await page.waitForFunction(({selector, replay}) => Number(document.querySelector(selector)?.getAttribute('data-runtime-replay')) === replay,
          {selector: FIGURE, replay: index + 1});
        await waitFrame(terminal ? 125 : 1); await inspect(`real-runtime-replay-${input}`);
        assert.equal((await snapshot()).figureReplay, index + 1); assert.equal((await snapshot()).figurePaused, 'true');
      }
      if (!terminal) {await pause(false); await waitFrame(125); await page.waitForFunction(selector => document.querySelector(selector)?.getAttribute('data-completions') === '2', PRIMARY);}
      else await page.waitForFunction(selector => document.querySelector(selector)?.getAttribute('data-completions') === '4', PRIMARY);
      await inspect('after-replay-terminal'); await shot('replayed-full-source');
      record.observedClock = await page.evaluate(() => window.__P042_OBSERVED);
      if (!terminal) {
        const firstEpoch = record.observedClock.filter(sample => sample.replay === 0), endIndex = firstEpoch.findIndex(sample => sample.frame === 125);
        assert.ok(endIndex > 0); let activeMs = 0;
        for (let index = 1; index <= endIndex; index++) if (firstEpoch[index - 1].paused === 'false') activeMs += firstEpoch[index].at - firstEpoch[index - 1].at;
        record.firstNaturalClock = {activeMs, expectedFirstToTerminalMs: 124 * 1000 / 12,
          actuallyObservedFrames: [...new Set(firstEpoch.slice(0, endIndex + 1).map(sample => sample.frame))]};
        assert.ok(activeMs >= 10000 && activeMs <= 12000, 'Observed unpaused wall clock does not support12fps1→125');
      }
      record.final = await snapshot(); assert.equal(record.final.requests, 0); assert.deepEqual(record.errors, []); assert.deepEqual(record.requests, []);
      record.status = 'passed'; await page.close(); console.log(json({case: record.name, status: 'passed', registered: false, actualMyLesson: false}));
    }
    assert.deepEqual(await Promise.all(inputPaths.map(binding)), inputs, 'Mounted QA inputs drifted'); evidence.inputsUnchanged = true; evidence.status = 'passed';
  } catch (error) {
    evidence.status = 'failed'; evidence.failure = {step, message: error.message, stack: error.stack};
    if (record) record.status = 'failed';
    if (page && !page.isClosed()) {evidence.failure.state = await snapshot().catch(() => null); await shot('failed-state'); await save('failed-page.html', await page.content());}
  } finally {
    if (browser) await browser.close();
    evidence.inputsAfter = await Promise.all(inputPaths.map(binding));
    if (JSON.stringify(evidence.inputsAfter) !== JSON.stringify(inputs)) {evidence.inputsUnchanged = false; evidence.status = 'failed';}
    evidence.completedAt = new Date().toISOString(); await save('evidence.json', json(evidence));
    console.log(json({output, status: evidence.status, records: evidence.records.length, registered: false, productCalibrationPassed: false}));
  }
  process.exitCode = evidence.status === 'passed' ? 0 : 1;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.slice(2).join(' ') === '--help') console.log('After D stable-hash GO: node scripts/qa-g678-nms-l01-p042-mounted.mjs --run <exclusive> --module-sha256 <sha> --visual-sha256 <sha> --source-run-sha256 <sha>');
  else await main(process.argv.slice(2));
}
