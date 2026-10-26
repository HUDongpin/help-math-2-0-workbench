#!/usr/bin/env node
import assert from 'node:assert/strict';
import {readFile, writeFile, mkdir} from 'node:fs/promises';
import path from 'node:path';
import {chromium} from 'playwright';
import {ROOT, ID, FREEZE, pin, encode} from './build-g678-nms-l03-p002-v2.mjs';
const BASE = 'http://127.0.0.1:3343';
const TASK = '/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222';
assert(process.argv.length === 4 && process.argv[2] === '--run' && /^v[1-9]\d*$/u.test(process.argv[3]));
const OUT = `${TASK}/nms-l03-p002-my-lesson-${process.argv[3]}`;
const packet = JSON.parse(await readFile(path.join(ROOT, FREEZE)));
const code = [FREEZE, 'packages/demos/private-current-js-registry.json', 'packages/demos/src/registry.local-only.generated.ts',
  'packages/demos/src/registry.local-only.metadata.generated.ts', 'apps/web/lib/g678-nms-l03-p002.server.ts',
  'apps/web/components/g678-nms-l03-p002-runtime.tsx', 'apps/web/components/g678-nms-l03-p002-lesson.tsx',
  'packages/demos/src/timelines/g678-nms-l03-p002-equation.ts',
  `apps/web/app/[locale]/migration-status/g678-calibration/${ID}/page.tsx`,
  `apps/web/app/flash-assets/g678-local/${ID}/canvas-renderer.js/route.ts`,
  'scripts/qa-g678-nms-l03-p002.mjs', 'apps/web/components/descriptor-driven-whole-lesson-player.tsx',
  'apps/web/lib/learning-lesson-availability.server.ts', 'scripts/g678-nms-l03-p002.test.mjs',
  'apps/web/lib/lesson-runtime-adapter.ts', 'apps/web/proxy.ts', 'apps/web/next.config.ts',
  ...packet.inputs.map(p => p.path), ...packet.outputs.map(p => p.path)];
const paths = [...new Set(code)];
const bind = async () => Promise.all(paths.map(async file => pin(file, await readFile(path.resolve(ROOT, file)))));
const inputs = await bind(); await mkdir(OUT);
const save = (name, value) => writeFile(path.join(OUT, name), encode(value), {flag: 'wx'});
await save('inputs.json', inputs);
await writeFile(path.join(OUT, 'runner.mjs'), await readFile(new URL(import.meta.url)), {flag: 'wx'});
const receipt = {schemaVersion: 1, animationId: ID, scope: 'Actual registry and source-ordered My Lesson, native clocks and UI actions; audio instrumentation observes native calls only.',
  records: [], inputs, status: 'running', productCalibrationPassed: false, scaleOutAuthorized: false, originalRuntimeAccepted: false,
  audioAccepted: false, humanAccepted: false, ownerAccepted: false, strictComplete: false, published: false};
const browser = await chromium.launch({headless: true, args: ['--mute-audio', '--autoplay-policy=document-user-activation-required']});
async function run(locale, width, reduced) {
  const name = `${locale}-${width}-${reduced ? 'reduced' : 'natural'}`;
  const record = {name, locale, width, reduced, status: 'running', observations: [], errors: [], autoplayWarnings: [], requests: [], screenshots: []};
  receipt.records.push(record);
  const context = await browser.newContext({viewport: {width, height: width < 500 ? 844 : 1000}, reducedMotion: reduced ? 'reduce' : 'no-preference', serviceWorkers: 'block'});
  await context.route('**/*', route => {const url = new URL(route.request().url()), allowed = url.origin === BASE;
    record.requests.push({url: url.href, allowed}); return allowed ? route.continue() : route.abort();});
  const page = await context.newPage(); page.setDefaultTimeout(30000); page.setDefaultNavigationTimeout(90000);
  await page.addInitScript(() => {
    window.__nmsAudio = {events: [], contexts: []};
    const Original = window.AudioContext;
    window.AudioContext = class extends Original {
      constructor(options) {super(options); window.__nmsAudio.contexts.push(this); window.__nmsAudio.events.push({kind: 'context', rate: this.sampleRate});}
      close() {window.__nmsAudio.events.push({kind: 'close'}); return super.close();}
    };
    const start = AudioBufferSourceNode.prototype.start;
    AudioBufferSourceNode.prototype.start = function (...args) {
      window.__nmsAudio.events.push({kind: 'start', args, samples: this.buffer?.length, channels: this.buffer?.numberOfChannels,
        frame: document.querySelector('canvas[data-course-canvas]')?.getAttribute('data-flash-frame')});
      return start.apply(this, args);
    };
    const stop = AudioBufferSourceNode.prototype.stop;
    AudioBufferSourceNode.prototype.stop = function (...args) {window.__nmsAudio.events.push({kind: 'stop'}); return stop.apply(this, args);};
    const volume = AudioParam.prototype.setValueAtTime;
    AudioParam.prototype.setValueAtTime = function (value, time) {window.__nmsAudio.events.push({kind: 'volume', value}); return volume.call(this, value, time);};
  });
  page.on('pageerror', e => record.errors.push(e.message));
  page.on('console', m => {if (['error', 'warning'].includes(m.type())) {
    if (m.text().startsWith('The AudioContext was not allowed to start.')) record.autoplayWarnings.push(m.text()); else record.errors.push(m.text());
  }});
  page.on('response', r => {if (r.status() >= 400) record.errors.push(`HTTP ${r.status()} ${r.url()}`);});
  const root = page.locator(`[data-source-clock-runtime="${ID}"]`), canvas = page.locator(`canvas[data-course-canvas="${ID}"]`);
  const button = key => page.locator(`[data-responsive-focus-key="${key}"]:visible`).first();
  const observe = async label => {
    const data = await root.evaluate(n => Object.fromEntries([...n.attributes].filter(a => a.name.startsWith('data-')).map(a => [a.name, a.value])));
    const result = {label, ...data, frame: Number(await canvas.getAttribute('data-flash-frame'))}; record.observations.push(result); return result;
  };
  const shot = async label => {const file = `${name}-${label}.png`;
    const readable = page.locator('[data-nms-l3-readable-log]');
    if (await readable.isVisible()) {
      await readable.scrollIntoViewIfNeeded();
      await readable.evaluate(node => {const y=node.getBoundingClientRect().top;if(y<180)window.scrollBy(0,y-180);});
      await page.waitForTimeout(250);
      const crop = path.join(OUT, `${name}-${label}-readable.png`); await readable.screenshot({path: crop, animations:'disabled'});
      record.screenshots.push(pin(crop, await readFile(crop)));
    }
    await canvas.click({position: {x: 5, y: 5}}); await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(250);
    await page.screenshot({path: path.join(OUT, file), fullPage: true, animations:'disabled'});
    record.screenshots.push(pin(path.join(OUT, file), await readFile(path.join(OUT, file))));};
  try {
    const response = await page.goto(`${BASE}/${locale}/migration-status/g678-calibration/${ID}`, {waitUntil: 'domcontentloaded'});
    assert.equal(response.status(), 200);
    await page.waitForFunction(() => document.querySelector('[data-source-clock-ready]')?.getAttribute('data-source-clock-ready') === 'true');
    assert.equal(await page.locator('[data-lesson-player]').getAttribute('data-renderer-availability'), 'registered');
    const initial = await observe('ready');
    record.initialAutoplay = initial['data-runtime-paused'] === 'false';
    if (record.initialAutoplay) {
      await button('pause').click();
      await page.waitForFunction(() => document.querySelector('[data-source-clock-runtime]')?.getAttribute('data-runtime-paused') === 'true');
      await observe('automatic-play-held-by-user');
      await button('replay').click();
    } else {
      assert.equal(initial.frame, 1); await button('pause').click();
    }
    await page.waitForFunction(() => document.querySelector('[data-source-clock-runtime]')?.getAttribute('data-source-clock-phase') === 'playing');
    await page.waitForTimeout(1100); const playing = await observe('playing');
    assert(reduced ? playing.frame === 1 : playing.frame > 1);
    const first = await page.evaluate(() => window.__nmsAudio.events.find(e => e.kind === 'start'));
    assert.equal(first.frame, '1');
    assert.equal(first.args[1], packet.audioPlan.latencySamples / packet.audioPlan.decoder.sampleRate);
    await button('pause').click();
    await page.waitForFunction(() => document.querySelector('[data-source-clock-runtime]')?.getAttribute('data-source-clock-phase') === 'paused');
    const paused = await observe('paused'); await page.waitForTimeout(220); const held = await observe('held');
    assert.equal(held['data-source-audio-sample'], paused['data-source-audio-sample']); assert.equal(held.frame, paused.frame);
    await button('pause').click();
    await page.waitForFunction(() => document.querySelector('[data-source-clock-runtime]')?.getAttribute('data-source-clock-phase') === 'playing');
    await observe('resumed');
    await button('mute').click();
    const mute = page.locator('.lesson-shell2__volume-mute-action:visible').first(); await mute.click();
    await page.waitForFunction(() => window.__nmsAudio.events.filter(e => e.kind === 'volume').at(-1)?.value === 0);
    await observe('muted'); await mute.click();
    await page.waitForFunction(() => window.__nmsAudio.events.filter(e => e.kind === 'volume').at(-1)?.value > 0);
    await observe('unmuted');
    if (!reduced) {
      const timeline = page.locator('input[data-responsive-focus-key="timeline"]:visible').first();
      await timeline.focus(); await timeline.press('End');
      await page.waitForFunction(() => document.querySelector('canvas[data-course-canvas]')?.getAttribute('data-flash-frame') === '688');
      assert.equal(await page.locator('[data-nms-l3-equation-correction]').count(), 1); await observe('inspected-end'); await shot('equation');
      const readable = page.locator('[data-nms-l3-readable-log]');
      assert(await readable.isVisible(), 'readable table must be visible in the modern host companion slot');
      assert(await readable.evaluate(node => node.parentElement?.getAttribute('data-page-interaction-companion-host') === 'true'));
      assert.equal(await readable.locator('tbody tr').count(), 3);
      assert((await readable.innerText()).includes('2/3 + 1/2 + 3/4 = ?'));
      assert(await readable.locator('td').evaluateAll(cells => cells.every(cell => parseFloat(getComputedStyle(cell).fontSize) >= 16)));
    }
    await button('replay').click();
    await page.waitForFunction(() => Number(document.querySelector('[data-source-clock-runtime]')?.getAttribute('data-source-audio-frame')) < 8 && document.querySelector('[data-source-clock-runtime]')?.getAttribute('data-source-clock-phase') === 'playing');
    await observe('replay');
    assert.equal(await page.locator('[data-nms-l3-readable-log]').count(), 0);
    assert.equal((await page.evaluate(() => window.__nmsAudio.events.filter(e => e.kind === 'start').at(-1))).args[1], packet.audioPlan.latencySamples / packet.audioPlan.decoder.sampleRate);
    await page.waitForFunction(() => document.querySelector('[data-source-clock-runtime]')?.getAttribute('data-source-clock-phase') === 'timeline-ended', null, {timeout: 65000});
    const end = await observe('natural-end'); assert.equal(end.frame, reduced ? 1 : 688);
    assert(await page.locator('[data-nms-l3-readable-log]').isVisible(), 'final source question is readable even when animation is reduced');
    assert.equal(end['data-runtime-playback-complete'], reduced ? 'false' : 'true'); await shot('natural-end');
    const beforeContexts = await page.evaluate(() => window.__nmsAudio.contexts.length);
    await button('next').click(); await root.waitFor({state: 'detached'});
    await page.waitForFunction(() => window.__nmsAudio.contexts.every(c => c.state === 'closed'));
    assert.equal(await page.locator('[data-lesson-player]').getAttribute('data-current-animation-id'), 'shared-nms002-l03-p003');
    await button('previous').click();
    await page.waitForFunction(() => document.querySelector('[data-source-clock-ready]')?.getAttribute('data-source-clock-ready') === 'true');
    assert(await page.evaluate(() => window.__nmsAudio.contexts.length) > beforeContexts); await observe('returned'); await shot('returned');
    const geometry = await page.evaluate(() => ({width: innerWidth, scroll: document.documentElement.scrollWidth})); assert(geometry.scroll <= geometry.width + 1);
    record.audioEvents = await page.evaluate(() => window.__nmsAudio.events);
    assert(record.audioEvents.filter(e => e.kind === 'start').every(e => e.channels === 1 && e.samples === packet.audioPlan.decoder.decodedSamples));
    assert.deepEqual(record.errors, []); assert(record.requests.every(r => r.allowed)); record.status = 'passed';
  } catch (error) {record.status = 'failed'; record.failure = error.stack; await shot('failure').catch(() => {});}
  finally {await context.close(); await save(`${name}.json`, record); console.log(encode({name, status: record.status, failure: record.failure?.split('\n')[0]}));}
}
try {await Promise.all([[ 'en', 1440, false], ['es', 390, false], ['en', 370, true]].map(args => run(...args)));}
finally {
  await browser.close(); receipt.inputsUnchanged = JSON.stringify(await bind()) === JSON.stringify(inputs);
  receipt.status = receipt.records.every(r => r.status === 'passed') && receipt.inputsUnchanged ? 'passed' : 'failed';
  await save('receipt.json', receipt); console.log(encode({output: OUT, status: receipt.status, inputsUnchanged: receipt.inputsUnchanged}));
  if (receipt.status !== 'passed') process.exitCode = 1;
}
