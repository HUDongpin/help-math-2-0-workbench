#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {chmod, lstat, mkdir, readFile, realpath, readdir, rename, writeFile} from
  'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {chromium} from 'playwright';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
const ANIMATION_ID = 'shared-alg001-l01-p055';
const OUTPUT = 'output/playwright/g678-fq01-family-calibration';
const PATHS = Object.freeze({
  freeze:
    'catalog/product-bridge-calibrations/g678-current-js-173-page-fq01-calibration-v1.json',
  privateRegistry: 'packages/demos/private-current-js-registry.json',
  localRegistry:
    'packages/demos/src/registry.local-only.metadata.generated.ts',
  catalog: 'catalog/g678-shared-catalog.v1.json',
  launcher: 'scripts/run-g678-local-preview.mjs',
  productBridge: 'apps/web/lib/g678-calibration-product-bridge.server.ts',
  generator: 'scripts/build-g678-fq01-current-js.mjs',
  generatorFragment:
    'catalog/product-bridge-calibrations/g678-fq01-current-js-calibration-1-v1.fragment.json',
  finalizer: 'scripts/finalize-g678-fq01-registration.mjs',
});
const FALSE_EFFECTS = Object.freeze({
  authoritativeOriginalRuntime: false,
  visualFidelityAccepted: false,
  audioAccepted: false,
  humanVisualAccepted: false,
  ownerAccepted: false,
  strictComplete: false,
  released: false,
  published: false,
});

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}
function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}
function stableBytes(value) {
  return Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
}
function projectPath(relativePath) {
  const target = path.resolve(ROOT, relativePath);
  invariant(target.startsWith(`${ROOT}${path.sep}`),
    `${relativePath} escapes project root`);
  return target;
}
async function binding(target, {json = false, absolute = false} = {}) {
  const resolved = absolute ? path.resolve(target) : projectPath(target);
  const [canonical, before] = await Promise.all([
    realpath(resolved), lstat(resolved, {bigint: true}),
  ]);
  invariant(canonical === resolved && before.isFile() &&
    !before.isSymbolicLink() && before.nlink === 1n,
  `${target} must be one canonical ordinary file`);
  const buffer = await readFile(resolved);
  const after = await lstat(resolved, {bigint: true});
  invariant(before.dev === after.dev && before.ino === after.ino &&
    before.size === after.size && before.mtimeNs === after.mtimeNs &&
    before.mode === after.mode && before.nlink === after.nlink,
  `${target} changed during read`);
  return Object.freeze({path: absolute ? resolved : target,
    bytes: buffer.length, sha256: sha256(buffer), buffer,
    ...(json ? {value: JSON.parse(buffer)} : {})});
}
function descriptor(value) {
  return Object.freeze({path: value.path, bytes: value.bytes,
    sha256: value.sha256});
}
function loopbackBase() {
  const base = new URL(process.env.HELP_MATH_G678_QA_BASE_URL ??
    'http://127.0.0.1:3317');
  invariant(base.protocol === 'http:' &&
    (base.hostname === '127.0.0.1' || base.hostname === 'localhost' ||
      base.hostname === '::1') && base.username === '' &&
    base.password === '' && base.pathname === '/' &&
    base.search === '' && base.hash === '',
  'FQ01 browser calibration requires one loopback HTTP origin');
  return base.origin;
}
async function currentInputs() {
  const entries = await Promise.all(Object.entries(PATHS).map(
    async ([key, relativePath]) => [key, await binding(relativePath,
      {json: key === 'freeze' || key === 'privateRegistry' ||
        key === 'generatorFragment'})],
  ));
  const values = Object.fromEntries(entries);
  const self = await binding(path.relative(ROOT, SCRIPT_PATH));
  const executable = await realpath(chromium.executablePath());
  const chromiumExecutable = await binding(executable, {absolute: true});
  const freeze = values.freeze.value;
  const calibration = values.privateRegistry.value.calibrations.find(
    (candidate) => candidate.calibrationId ===
      'g678-16-page-product-calibration-v1');
  invariant(freeze.registrationCandidatePlacementCount === 173 &&
    freeze.selectedPages.length === 173 &&
    calibration.entries.length === 173 &&
    calibration.freezeManifest === PATHS.freeze &&
    calibration.freezeManifestSha256 === values.freeze.sha256 &&
    values.generatorFragment.value.entries.length === 1 &&
    values.generatorFragment.value.entries[0].key === ANIMATION_ID,
  'FQ01 browser calibration input identity drifted');
  const version = await chromium.launch({headless: true})
    .then(async (browser) => {
      try { return browser.version(); } finally { await browser.close(); }
    });
  const descriptors = Object.freeze({...Object.fromEntries(entries.map(
    ([key, value]) => [key, descriptor(value)])), self: descriptor(self),
  chromium: Object.freeze({executable: descriptor(chromiumExecutable),
    version})});
  return Object.freeze({values, descriptors});
}
async function screenshotDescriptor(root, name) {
  const value = await binding(path.join(root, name), {absolute: true});
  return Object.freeze({path: `${OUTPUT}/${name}`, bytes: value.bytes,
    sha256: value.sha256});
}
async function freezeTree(root) {
  const entries = await readdir(root, {withFileTypes: true});
  for (const entry of entries) {
    const target = path.join(root, entry.name);
    if (entry.isDirectory()) await freezeTree(target);
    else if (entry.isFile()) await chmod(target, 0o444);
    else invariant(false, `special QA output entry: ${target}`);
  }
  await chmod(root, 0o555);
}

async function runBrowser(inputs) {
  const base = loopbackBase();
  const output = projectPath(OUTPUT);
  invariant(!await lstat(output).then(() => true, () => false),
    `${OUTPUT} already exists`);
  const stage = `${output}.staging-${process.pid}`;
  await mkdir(stage, {recursive: false});
  const browser = await chromium.launch({headless: true});
  const page = await browser.newPage({viewport: {width: 1440, height: 1100}});
  const errors = {console: [], page: []};
  const assetResponses = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.console.push(message.text());
  });
  page.on('pageerror', (error) => errors.page.push(String(error)));
  page.on('response', (response) => {
    if (!response.url().includes(
      `/flash-assets/g678-local/${ANIMATION_ID}/`)) return;
    const headers = response.headers();
    assetResponses.push({url: response.url(), status: response.status(),
      corp: headers['cross-origin-resource-policy'] ?? null,
      cacheControl: headers['cache-control'] ?? null,
      contentType: headers['content-type'] ?? null,
      noSniff: headers['x-content-type-options'] ?? null});
  });
  try {
    await page.goto(`${base}/en/migration-status/g678-calibration/${ANIMATION_ID}`,
      {waitUntil: 'domcontentloaded'});
    await page.waitForFunction((id) =>
      document.querySelector(`canvas[data-course-canvas="${id}"]`)
        ?.getAttribute('data-render-state') === 'ready', ANIMATION_ID,
    {timeout: 30_000});
    const stageElement = page.locator('.runtime-stage');
    const shell = page.locator('.runtime-shell');
    const frame = async () => Number(await stageElement.getAttribute(
      'data-flash-frame'));
    const replay = page.getByRole('button', {name: 'Replay', exact: true}).first();
    await replay.click();
    await page.waitForFunction(() => Number(document.querySelector(
      '.runtime-stage')?.getAttribute('data-flash-frame')) < 5);
    const readyStart = {frame: await frame(),
      canvasState: await page.locator(
        `canvas[data-course-canvas="${ANIMATION_ID}"]`)
        .getAttribute('data-render-state'),
      playbackComplete: await shell.getAttribute(
        'data-runtime-playback-complete')};
    await page.waitForFunction(() => {
      const current = Number(document.querySelector('.runtime-stage')
        ?.getAttribute('data-flash-frame'));
      return current >= 20 && current < 52;
    }, {timeout: 10_000});
    const midpoint = {frame: await frame(),
      playbackComplete: await shell.getAttribute(
        'data-runtime-playback-complete')};
    await page.screenshot({path: path.join(stage, 'midpoint.png'),
      fullPage: true});
    await page.waitForFunction(() => document.querySelector('.runtime-stage')
      ?.getAttribute('data-flash-frame') === '52', {timeout: 10_000});
    await page.waitForFunction(() => document.querySelector('.runtime-shell')
      ?.getAttribute('data-runtime-playback-complete') === 'true');
    const naturalEnd = {frame: await frame(),
      playbackComplete: await shell.getAttribute(
        'data-runtime-playback-complete')};
    await page.screenshot({path: path.join(stage, 'natural-end.png'),
      fullPage: true});
    await replay.click();
    await page.waitForFunction(() => Number(document.querySelector(
      '.runtime-stage')?.getAttribute('data-flash-frame')) < 5);
    const replayStart = await frame();
    await page.waitForTimeout(700);
    const replayResult = {startFrame: replayStart,
      progressedFrame: await frame(), playbackComplete: await shell.getAttribute(
        'data-runtime-playback-complete')};
    const audioBoundary = {
      productAudioEnabled: await shell.getAttribute('data-product-audio-enabled'),
      audioAvailable: await shell.getAttribute('data-audio-available'),
      audioAccepted: false};
    invariant(errors.console.length === 0 && errors.page.length === 0 &&
      assetResponses.length === 1 &&
      assetResponses[0].url.includes('sha256=') &&
      assetResponses[0].status === 200 &&
      assetResponses[0].corp === 'same-origin' &&
      assetResponses[0].cacheControl === 'private, no-store, max-age=0' &&
      assetResponses[0].noSniff === 'nosniff' &&
      readyStart.frame >= 1 && readyStart.frame < 5 &&
      readyStart.canvasState === 'ready' &&
      readyStart.playbackComplete === 'false' &&
      midpoint.frame >= 20 && midpoint.frame < 52 &&
      midpoint.playbackComplete === 'false' &&
      naturalEnd.frame === 52 && naturalEnd.playbackComplete === 'true' &&
      replayResult.startFrame < 5 && replayResult.progressedFrame > 1 &&
      replayResult.playbackComplete === 'false' &&
      audioBoundary.audioAvailable === 'false',
    'FQ01 browser playback contract failed');
    const screenshots = await Promise.all(['midpoint.png', 'natural-end.png']
      .map((name) => screenshotDescriptor(stage, name)));
    const evidence = {schemaVersion: 1,
      artifactType: 'g678-fq01-browser-family-calibration-v1',
      animationId: ANIMATION_ID, baseOrigin: base,
      registeredCurrentJsPages: 173,
      inputs: inputs.descriptors, readyStart, midpoint, naturalEnd,
      replay: replayResult, audioBoundary, assetResponses,
      consoleErrors: errors.console, pageErrors: errors.page,
      screenshots, familyCurrentJsVisualPlaybackPassed: true,
      scaleOutAuthorizedByThisReceipt: false,
      acceptanceEffects: FALSE_EFFECTS};
    await writeFile(path.join(stage, 'evidence.json'), stableBytes(evidence),
      {flag: 'wx'});
    await freezeTree(stage);
    await chmod(stage, 0o755);
    await rename(stage, output);
    await chmod(output, 0o555);
    return evidence;
  } finally {
    await browser.close();
  }
}

async function checkEvidence(inputs) {
  const evidence = (await binding(`${OUTPUT}/evidence.json`, {json: true})).value;
  invariant(JSON.stringify(evidence.inputs) ===
      JSON.stringify(inputs.descriptors) &&
    evidence.artifactType === 'g678-fq01-browser-family-calibration-v1' &&
    evidence.animationId === ANIMATION_ID &&
    evidence.baseOrigin === loopbackBase() &&
    evidence.registeredCurrentJsPages === 173 &&
    evidence.readyStart.canvasState === 'ready' &&
    evidence.readyStart.playbackComplete === 'false' &&
    evidence.midpoint.frame >= 20 && evidence.midpoint.frame < 52 &&
    evidence.midpoint.playbackComplete === 'false' &&
    evidence.naturalEnd.frame === 52 &&
    evidence.naturalEnd.playbackComplete === 'true' &&
    evidence.replay.startFrame < 5 && evidence.replay.progressedFrame > 1 &&
    evidence.replay.playbackComplete === 'false' &&
    evidence.audioBoundary.audioAvailable === 'false' &&
    evidence.assetResponses.length === 1 &&
    evidence.assetResponses[0].url.includes(
      `/flash-assets/g678-local/${ANIMATION_ID}/canvas-renderer.js?sha256=`) &&
    evidence.assetResponses[0].status === 200 &&
    evidence.assetResponses[0].corp === 'same-origin' &&
    evidence.assetResponses[0].cacheControl ===
      'private, no-store, max-age=0' &&
    evidence.assetResponses[0].noSniff === 'nosniff' &&
    evidence.consoleErrors.length === 0 && evidence.pageErrors.length === 0 &&
    evidence.familyCurrentJsVisualPlaybackPassed === true &&
    evidence.scaleOutAuthorizedByThisReceipt === false &&
    JSON.stringify(evidence.acceptanceEffects) ===
      JSON.stringify(FALSE_EFFECTS),
  'FQ01 browser evidence drifted');
  invariant(JSON.stringify(evidence.screenshots.map((item) => item.path)) ===
    JSON.stringify([`${OUTPUT}/midpoint.png`, `${OUTPUT}/natural-end.png`]),
  'FQ01 screenshot set drifted');
  for (const screenshot of evidence.screenshots) {
    const current = await binding(screenshot.path);
    invariant(current.bytes === screenshot.bytes &&
      current.sha256 === screenshot.sha256,
    `${screenshot.path} drifted`);
  }
  return evidence;
}

const args = process.argv.slice(2);
invariant(args.length <= 1 && (args.length === 0 || args[0] === '--check'),
  'usage: qa-g678-fq01-browser.mjs [--check]');
const check = args[0] === '--check';
const inputs = await currentInputs();
const evidence = check ? await checkEvidence(inputs) : await runBrowser(inputs);
process.stdout.write(`${JSON.stringify({check, evidence: `${OUTPUT}/evidence.json`,
  animationId: ANIMATION_ID, registeredCurrentJsPages: 173,
  familyCurrentJsVisualPlaybackPassed:
    evidence.familyCurrentJsVisualPlaybackPassed,
  acceptanceEffects: evidence.acceptanceEffects}, null, 2)}\n`);
