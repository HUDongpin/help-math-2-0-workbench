#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {lstat, mkdir, readFile, realpath, rename, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
const base = process.env.HELP_MATH_G678_QA_BASE_URL ?? 'http://127.0.0.1:3318';
const parsedBase = new URL(base);
invariant(parsedBase.protocol === 'http:' &&
  parsedBase.hostname === '127.0.0.1' &&
  parsedBase.username === '' && parsedBase.password === '' &&
  parsedBase.pathname === '/' && parsedBase.search === '' &&
  parsedBase.hash === '',
'G678 browser QA base must be one loopback HTTP origin');
const output = 'output/playwright/g678-current-js-216';
const PATHS = Object.freeze({
  freeze: 'catalog/product-bridge-calibrations/g678-current-js-216-page-registration-v1.json',
  privateRegistry: 'packages/demos/private-current-js-registry.json',
  localRegistry: 'packages/demos/src/registry.local-only.metadata.generated.ts',
  catalog: 'catalog/g678-shared-catalog.v1.json',
  launcher: 'scripts/run-g678-local-preview.mjs',
  productionIsolation: 'output/g678-production-bundle-isolation-216-20260902.json',
});

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function projectPath(relativePath) {
  const absolute = path.resolve(ROOT, relativePath);
  invariant(absolute.startsWith(`${ROOT}${path.sep}`),
    `${relativePath} escapes the project root`);
  return absolute;
}

async function binding(relativePath, json = false) {
  const absolute = projectPath(relativePath);
  const [canonical, before] = await Promise.all([
    realpath(absolute), lstat(absolute, {bigint: true}),
  ]);
  invariant(canonical === absolute && before.isFile() &&
    !before.isSymbolicLink() && before.nlink === 1n,
  `${relativePath} must be one canonical ordinary file`);
  const bytes = await readFile(absolute);
  const after = await lstat(absolute, {bigint: true});
  invariant(before.dev === after.dev && before.ino === after.ino &&
    before.size === after.size && before.mtimeNs === after.mtimeNs &&
    before.mode === after.mode && before.nlink === after.nlink,
  `${relativePath} changed during read`);
  return Object.freeze({path: relativePath, bytes: bytes.length,
    sha256: sha256(bytes), buffer: bytes,
    ...(json ? {value: JSON.parse(bytes)} : {})});
}

async function absoluteBinding(requestedPath) {
  const absolute = path.resolve(requestedPath);
  const canonical = await realpath(absolute);
  const before = await lstat(canonical, {bigint: true});
  invariant(before.isFile() && !before.isSymbolicLink() && before.nlink === 1n,
    'Chromium executable must be one canonical ordinary file');
  const bytes = await readFile(canonical);
  const after = await lstat(canonical, {bigint: true});
  invariant(before.dev === after.dev && before.ino === after.ino &&
    before.size === after.size && before.mtimeNs === after.mtimeNs &&
    before.mode === after.mode && before.nlink === after.nlink,
  'Chromium executable changed during read');
  return Object.freeze({requestedPath: absolute, realPath: canonical,
    bytes: bytes.length, sha256: sha256(bytes)});
}

function descriptor(value) {
  return Object.freeze({path: value.path, bytes: value.bytes,
    sha256: value.sha256});
}

async function currentInputs() {
  const jsonKeys = new Set(['freeze', 'privateRegistry', 'catalog',
    'productionIsolation']);
  const entries = await Promise.all(Object.entries(PATHS).map(
    async ([key, relativePath]) => [key,
      await binding(relativePath, jsonKeys.has(key))],
  ));
  const values = Object.fromEntries(entries);
  const script = await binding(path.relative(ROOT, SCRIPT_PATH));
  const executable = await absoluteBinding(chromium.executablePath());
  const freeze = values.freeze.value;
  const privateCalibration = values.privateRegistry.value.calibrations.find(
    (calibration) =>
      calibration.calibrationId === 'g678-16-page-product-calibration-v1');
  invariant(freeze.registrationCandidatePlacementCount === 216 &&
    freeze.selectedPages.length === 216 &&
    new Set(freeze.selectedPages.map((page) => page.animationId)).size === 216 &&
    privateCalibration?.entries?.length === 216 &&
    values.productionIsolation.value.frozenCandidateCount === 216 &&
    values.productionIsolation.value.matchCount === 0 &&
    values.productionIsolation.value.localOnlyG678MaterialAbsent === true,
  '216-page QA input identity drifted');
  return Object.freeze({values, descriptors: Object.freeze({
    ...Object.fromEntries(Object.entries(values).map(([key, value]) =>
      [key, descriptor(value)])),
    script: descriptor(script),
    chromiumExecutable: executable,
  })});
}

function lessonExpectations(catalog, freeze) {
  const counts = new Map();
  for (const page of freeze.selectedPages) {
    counts.set(page.stableLessonKey,
      (counts.get(page.stableLessonKey) ?? 0) + 1);
  }
  const lessons = catalog.lessons.map((lesson) => Object.freeze({
    stableLessonKey: lesson.stableLessonKey,
    moduleCode: lesson.moduleCode,
    lessonNumber: lesson.lessonNumber,
    activePageCount: lesson.pages.length,
    registeredPageCount: counts.get(lesson.stableLessonKey) ?? 0,
  }));
  invariant(lessons.length === 44 &&
    lessons.every((lesson) => lesson.registeredPageCount > 0 &&
      lesson.registeredPageCount < lesson.activePageCount) &&
    lessons.reduce((sum, lesson) => sum + lesson.registeredPageCount, 0) === 216,
  '216-page lesson vector drifted');
  return Object.freeze(lessons);
}

function sampleExpectations(freeze) {
  const pureLinearPages = freeze.selectedPages.filter((page) =>
    page.adapterFamily === 'pure-linear-source-static');
  const pureSamples = ['ALG001', 'DAT001', 'GEO001', 'NMS002'].map(
    (moduleCode) => {
      const candidates = pureLinearPages.filter((page) =>
        page.moduleCode === moduleCode).sort((left, right) =>
        left.runtime.canvasRenderer.bytes - right.runtime.canvasRenderer.bytes);
      invariant(candidates.length > 0,
        `no pure-linear sample for ${moduleCode}`);
      return candidates[0];
    });
  const fq01 = freeze.selectedPages.find((page) =>
    page.animationId === 'shared-alg001-l01-p055' &&
      page.adapterFamily === 'final-quiz-intro-source-static');
  invariant(fq01, 'final 216 freeze lacks the calibrated FQ01 representative');
  return Object.freeze([...pureSamples, fq01]);
}

async function screenshotBinding(stage, fileName) {
  const bytes = await readFile(path.join(stage, fileName));
  return Object.freeze({path: `${output}/${fileName}`, bytes: bytes.length,
    sha256: sha256(bytes)});
}

async function buildEvidence(inputs) {
  const outputAbsolute = projectPath(output);
  invariant(!await lstat(outputAbsolute).then(() => true, () => false),
    `${output} already exists`);
  const stage = `${outputAbsolute}.staging-${process.pid}`;
  await mkdir(stage, {recursive: false});
  const browser = await chromium.launch({headless: true});
  const browserIdentity = Object.freeze({name: 'Chromium',
    version: browser.version(), executable: inputs.descriptors.chromiumExecutable});
  const freeze = inputs.values.freeze.value;
  const expectedLessons = lessonExpectations(inputs.values.catalog.value, freeze);
  const samples = sampleExpectations(freeze);
  const evidence = {
    schemaVersion: 1,
    artifactType: 'g678-current-js-216-browser-qa-v1',
    generatedAt: new Date().toISOString(),
    baseUrl: base,
    inputs: inputs.descriptors,
    browser: browserIdentity,
    frozenCalibrationPlacementCount: freeze.frozenCalibrationPlacementCount,
    registeredCurrentJsPages: freeze.selectedPages.length,
    allLessons: null,
    samples: [],
    screenshots: [],
    acceptanceEffects: Object.freeze({authoritativeOriginalRuntime: false,
      visualFidelityAccepted: false, audioAccepted: false,
      humanVisualAccepted: false, ownerAccepted: false,
      strictComplete: false, released: false, published: false}),
  };
  try {
    const allLessonsPage = await browser.newPage(
      {viewport: {width: 1440, height: 1100}});
    const allLessonsConsoleErrors = [];
    const allLessonsPageErrors = [];
    allLessonsPage.on('console', (message) => {
      if (message.type() === 'error') allLessonsConsoleErrors.push(message.text());
    });
    allLessonsPage.on('pageerror', (error) =>
      allLessonsPageErrors.push(String(error)));
    await allLessonsPage.goto(`${base}/en?screen=lessons`,
      {waitUntil: 'networkidle'});
    await allLessonsPage.getByRole('button', {name: 'G6–G8 shared'}).click();
    await allLessonsPage.waitForFunction(() =>
      document.querySelectorAll('[data-workspace-screen="lessons"] article')
        .length === 44);
    const lessonScreen = allLessonsPage.locator('[data-workspace-screen="lessons"]');
    const cards = lessonScreen.locator('article');
    const cardCopy = await cards.locator('[data-lesson-card-copy]').allTextContents();
    const statusCopy = await cards.locator('[data-lesson-card-status]').allTextContents();
    const browserLessons = cardCopy.map((copy, index) => {
      const identity = copy.match(
        /G6–G8 shared · (NMS002|GEO001|ALG001|DAT001) · L(\d+)/u);
      const progress = copy.match(/(\d+)\/(\d+) pages registered/u);
      invariant(identity && progress, `invalid shared lesson card: ${copy}`);
      const expected = expectedLessons[index];
      const observed = {moduleCode: identity[1], lessonNumber: Number(identity[2]),
        registeredPageCount: Number(progress[1]),
        activePageCount: Number(progress[2])};
      invariant(expected.moduleCode === observed.moduleCode &&
        expected.lessonNumber === observed.lessonNumber &&
        expected.registeredPageCount === observed.registeredPageCount &&
        expected.activePageCount === observed.activePageCount,
      `shared lesson browser vector drifted at ${expected.stableLessonKey}`);
      return Object.freeze({...expected});
    });
    invariant(browserLessons.length === 44 &&
      browserLessons.reduce((sum, lesson) =>
        sum + lesson.registeredPageCount, 0) === 216 &&
      statusCopy.every((copy) => copy.includes('Mapping pending')) &&
      await lessonScreen.locator('a').count() === 0 &&
      allLessonsConsoleErrors.length === 0 && allLessonsPageErrors.length === 0,
    'All Lessons browser contract drifted');
    const allLessonsFile = 'all-lessons-44-partial.png';
    await allLessonsPage.screenshot({path: path.join(stage, allLessonsFile),
      fullPage: true});
    evidence.allLessons = {sharedCardCount: browserLessons.length,
      linkedCardCount: 0, registeredPageSum: 216,
      exactLessonVector: browserLessons,
      consoleErrors: allLessonsConsoleErrors, pageErrors: allLessonsPageErrors};
    evidence.screenshots.push(await screenshotBinding(stage, allLessonsFile));
    await allLessonsPage.close();

    for (const sample of samples) {
      const page = await browser.newPage({viewport: {width: 1440, height: 1000}});
      const consoleErrors = [];
      const pageErrors = [];
      const assetResponses = [];
      page.on('console', (message) => {
        if (message.type() === 'error') consoleErrors.push(message.text());
      });
      page.on('pageerror', (error) => pageErrors.push(String(error)));
      page.on('response', (response) => {
        if (response.url().includes(
          `/flash-assets/g678-local/${sample.animationId}/canvas-renderer.js`)) {
          const headers = response.headers();
          assetResponses.push({url: response.url(), status: response.status(),
            cacheControl: headers['cache-control'] ?? null,
            contentType: headers['content-type'] ?? null,
            corp: headers['cross-origin-resource-policy'] ?? null,
            nosniff: headers['x-content-type-options'] ?? null});
        }
      });
      await page.goto(
        `${base}/en/migration-status/g678-calibration/${sample.animationId}`,
        {waitUntil: 'domcontentloaded'});
      await page.waitForFunction((animationId) =>
        document.querySelector(`canvas[data-course-canvas="${animationId}"]`)
          ?.getAttribute('data-render-state') === 'ready',
      sample.animationId, {timeout: 45_000});
      const stageElement = page.locator('.runtime-stage');
      const shell = page.locator('.runtime-shell');
      const initialFrame = Number(await stageElement.getAttribute('data-flash-frame'));
      await page.waitForFunction((previous) => Number(
        document.querySelector('.runtime-stage')?.getAttribute('data-flash-frame'))
          > previous, initialFrame, {timeout: 5_000});
      const progressedFrame = Number(
        await stageElement.getAttribute('data-flash-frame'));
      const expectedAssetUrl = `${base}/flash-assets/g678-local/` +
        `${sample.animationId}/canvas-renderer.js?sha256=` +
        sample.runtime.canvasRenderer.sha256;
      invariant(assetResponses.length === 1 &&
        assetResponses[0].url === expectedAssetUrl &&
        assetResponses[0].status === 200 &&
        assetResponses[0].corp === 'same-origin' &&
        assetResponses[0].nosniff === 'nosniff' &&
        assetResponses[0].cacheControl === 'private, no-store, max-age=0' &&
        assetResponses[0].contentType?.startsWith('text/javascript') &&
        consoleErrors.length === 0 && pageErrors.length === 0 &&
        await shell.getAttribute('data-runtime-playback-complete') === 'false',
      `${sample.animationId} browser/asset policy drifted`);
      evidence.samples.push({animationId: sample.animationId,
        moduleCode: sample.moduleCode, stableLessonKey: sample.stableLessonKey,
        frameDomain: sample.runtime.frameDomain,
        frameCount: sample.runtime.frameCount,
        runtimeSha256: sample.runtime.canvasRenderer.sha256,
        initialFrame, progressedFrame,
        canvasState: await page.locator(
          `canvas[data-course-canvas="${sample.animationId}"]`)
          .getAttribute('data-render-state'),
        playbackComplete: 'false', assetResponses, consoleErrors, pageErrors});
      const screenshotFile = `${sample.animationId}.png`;
      await page.screenshot({path: path.join(stage, screenshotFile),
        fullPage: true});
      evidence.screenshots.push(await screenshotBinding(stage, screenshotFile));
      await page.close();
    }
    await writeFile(path.join(stage, 'evidence.json'),
      `${JSON.stringify(evidence, null, 2)}\n`, {flag: 'wx'});
    await rename(stage, outputAbsolute);
    return evidence;
  } catch (error) {
    await rename(stage, `${stage}.failed-${Date.now()}`).catch(() => {});
    throw error;
  } finally {
    await browser.close();
  }
}

async function checkEvidence(inputs) {
  const evidence = (await binding(`${output}/evidence.json`, true)).value;
  invariant(JSON.stringify(evidence.inputs) ===
    JSON.stringify(inputs.descriptors), 'browser QA input bindings drifted');
  const browser = await chromium.launch({headless: true});
  const version = browser.version();
  await browser.close();
  invariant(evidence.browser.version === version &&
    JSON.stringify(evidence.browser.executable) ===
      JSON.stringify(inputs.descriptors.chromiumExecutable),
  'browser QA Chromium identity drifted');
  const expectedLessons = lessonExpectations(inputs.values.catalog.value,
    inputs.values.freeze.value);
  const expectedSamples = sampleExpectations(inputs.values.freeze.value);
  const expectedScreenshotPaths = [
    `${output}/all-lessons-44-partial.png`,
    ...expectedSamples.map((sample) => `${output}/${sample.animationId}.png`),
  ];
  invariant(evidence.baseUrl === base &&
    evidence.registeredCurrentJsPages === 216 &&
    evidence.allLessons.sharedCardCount === 44 &&
    evidence.allLessons.linkedCardCount === 0 &&
    evidence.allLessons.registeredPageSum === 216 &&
    JSON.stringify(evidence.allLessons.exactLessonVector) ===
      JSON.stringify(expectedLessons) &&
    evidence.allLessons.consoleErrors.length === 0 &&
    evidence.allLessons.pageErrors.length === 0 &&
    evidence.samples.length === 5 &&
    evidence.samples.every((sample, index) => {
      const expected = expectedSamples[index];
      const expectedAssetUrl = `${base}/flash-assets/g678-local/` +
        `${expected.animationId}/canvas-renderer.js?sha256=` +
        expected.runtime.canvasRenderer.sha256;
      const response = sample.assetResponses[0];
      return sample.animationId === expected.animationId &&
        sample.moduleCode === expected.moduleCode &&
        sample.stableLessonKey === expected.stableLessonKey &&
        sample.frameDomain === expected.runtime.frameDomain &&
        sample.frameCount === expected.runtime.frameCount &&
        sample.runtimeSha256 === expected.runtime.canvasRenderer.sha256 &&
        sample.canvasState === 'ready' &&
        sample.progressedFrame > sample.initialFrame &&
        sample.playbackComplete === 'false' &&
        sample.consoleErrors.length === 0 && sample.pageErrors.length === 0 &&
        sample.assetResponses.length === 1 &&
        response.url === expectedAssetUrl && response.status === 200 &&
        response.corp === 'same-origin' && response.nosniff === 'nosniff' &&
        response.cacheControl === 'private, no-store, max-age=0' &&
        response.contentType?.startsWith('text/javascript');
    }) &&
    JSON.stringify(evidence.screenshots.map((item) => item.path)) ===
      JSON.stringify(expectedScreenshotPaths) &&
    JSON.stringify(evidence.acceptanceEffects) === JSON.stringify({
      authoritativeOriginalRuntime: false,
      visualFidelityAccepted: false,
      audioAccepted: false,
      humanVisualAccepted: false,
      ownerAccepted: false,
      strictComplete: false,
      released: false,
      published: false,
    }),
  'browser QA product assertions drifted');
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
  'usage: qa-g678-current-js-216-browser.mjs [--check]');
const inputs = await currentInputs();
const check = args[0] === '--check';
const evidence = check ? await checkEvidence(inputs) : await buildEvidence(inputs);
process.stdout.write(`${JSON.stringify({check,
  evidence: `${output}/evidence.json`,
  registeredCurrentJsPages: evidence.registeredCurrentJsPages,
  sharedLessonCards: evidence.allLessons.sharedCardCount,
  linkedLessonCards: evidence.allLessons.linkedCardCount,
  sampledModules: evidence.samples.map((sample) => sample.moduleCode),
  screenshotCount: evidence.screenshots.length,
  acceptanceEffects: evidence.acceptanceEffects}, null, 2)}\n`);
