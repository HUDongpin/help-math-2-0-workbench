#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {lstat, mkdir, readFile, realpath, rename, writeFile} from
  'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
const base = process.env.HELP_MATH_G678_QA_BASE_URL ??
  'http://127.0.0.1:3324';
const parsedBase = new URL(base);
const output = 'output/playwright/g678-alg-l09-game-assessment-342-v1';
const IDS = Object.freeze([
  'shared-alg001-l09-p030',
  'shared-alg001-l09-p031',
  'shared-alg001-l09-p041',
]);
const PATHS = Object.freeze({
  freeze:
    'catalog/product-bridge-calibrations/g678-current-js-342-page-registration-v1.json',
  catalog: 'catalog/g678-shared-catalog.v1.json',
  audit: 'catalog/g678-alg-l09-game-assessment-family-audit-v1.json',
  generatedFragment:
    'catalog/product-bridge-calibrations/g678-alg-l09-game-assessment-current-js-3-v1.fragment.json',
  gameAssessmentHost:
    'packages/demos/src/private-source-static-alg-l09-game-assessment-candidate.tsx',
  gameAssessmentBehavior:
    'packages/demos/src/g678-alg-l09-game-assessment.ts',
  sourceStaticHost: 'packages/demos/src/source-static-canvas-candidate.tsx',
  animationContract: 'packages/demos/src/contract.ts',
  animationRuntime: 'apps/web/components/animation-runtime.tsx',
  descriptorPlayer:
    'apps/web/components/descriptor-driven-whole-lesson-player.tsx',
  productBridge: 'apps/web/lib/g678-calibration-product-bridge.server.ts',
  launcher: 'scripts/run-g678-local-preview.mjs',
  privateRegistry: 'packages/demos/private-current-js-registry.json',
  localRegistry:
    'packages/demos/src/registry.local-only.metadata.generated.ts',
});
const FALSE_EFFECTS = Object.freeze({authoritativeOriginalRuntime: false,
  visualFidelityAccepted: false, audioAccepted: false,
  humanVisualAccepted: false, ownerAccepted: false,
  strictComplete: false, released: false, published: false});

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

invariant(parsedBase.protocol === 'http:' &&
  parsedBase.hostname === '127.0.0.1' && parsedBase.username === '' &&
  parsedBase.password === '' && parsedBase.pathname === '/' &&
  parsedBase.search === '' && parsedBase.hash === '',
'game/assessment QA base must be one loopback HTTP origin');

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function projectPath(relativePath) {
  const target = path.resolve(ROOT, relativePath);
  invariant(target.startsWith(`${ROOT}${path.sep}`),
    `${relativePath} escapes project root`);
  return target;
}

async function binding(relativePath, json = false) {
  const target = projectPath(relativePath);
  const [canonical, before] = await Promise.all([
    realpath(target), lstat(target, {bigint: true}),
  ]);
  invariant(canonical === target && before.isFile() &&
    !before.isSymbolicLink() && before.nlink === 1n,
  `${relativePath} must be one canonical ordinary file`);
  const buffer = await readFile(target);
  const after = await lstat(target, {bigint: true});
  invariant(before.dev === after.dev && before.ino === after.ino &&
    before.size === after.size && before.mtimeNs === after.mtimeNs &&
    before.mode === after.mode && before.nlink === after.nlink,
  `${relativePath} changed during read`);
  return Object.freeze({path: relativePath, bytes: buffer.length,
    sha256: sha256(buffer), buffer,
    ...(json ? {value: JSON.parse(buffer.toString('utf8'))} : {})});
}

async function externalBinding(target) {
  const resolved = path.resolve(target);
  const [canonical, before] = await Promise.all([
    realpath(resolved), lstat(resolved, {bigint: true}),
  ]);
  invariant(canonical === resolved && before.isFile() &&
    !before.isSymbolicLink(),
  'Chromium executable must be one canonical ordinary file');
  const buffer = await readFile(resolved);
  const after = await lstat(resolved, {bigint: true});
  invariant(before.dev === after.dev && before.ino === after.ino &&
    before.size === after.size && before.mtimeNs === after.mtimeNs,
  'Chromium executable changed during read');
  return Object.freeze({path: resolved, bytes: buffer.length,
    sha256: sha256(buffer), buffer});
}

function descriptor(value) {
  return Object.freeze({path: value.path, bytes: value.bytes,
    sha256: value.sha256});
}

function exact(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function lessonVector(catalog, freeze) {
  const counts = new Map();
  for (const page of freeze.selectedPages) counts.set(page.stableLessonKey,
    (counts.get(page.stableLessonKey) ?? 0) + 1);
  const vector = catalog.lessons.map((lesson) => Object.freeze({
    stableLessonKey: lesson.stableLessonKey,
    moduleCode: lesson.moduleCode,
    lessonNumber: lesson.lessonNumber,
    activePageCount: lesson.pages.length,
    registeredPageCount: counts.get(lesson.stableLessonKey) ?? 0,
  }));
  invariant(vector.length === 44 &&
    vector.reduce((sum, item) => sum + item.registeredPageCount, 0) === 342 &&
    vector.filter((item) => item.registeredPageCount === item.activePageCount)
      .length === 1 &&
    vector.find((item) => item.stableLessonKey === 'shared-alg001-l09')
      ?.registeredPageCount === 41,
  '342 lesson vector drifted');
  return Object.freeze(vector);
}

async function currentInputs(check) {
  const json = new Set(['freeze', 'catalog', 'audit', 'generatedFragment',
    'privateRegistry']);
  const values = Object.fromEntries(await Promise.all(Object.entries(PATHS)
    .map(async ([key, relativePath]) => [key,
      await binding(check && (key === 'privateRegistry' || key === 'localRegistry')
        ? `${output}/${key === 'privateRegistry'
            ? 'private-current-js-registry.snapshot.json'
            : 'registry.local-only.metadata.generated.snapshot.ts'}`
        : relativePath, json.has(key))])));
  const script = await binding(path.relative(ROOT, SCRIPT_PATH));
  const executable = await externalBinding(chromium.executablePath());
  invariant(values.freeze.value.registrationCandidatePlacementCount === 342 &&
    values.freeze.value.selectedPages.length === 342 &&
    values.audit.value.auditedPlacementCount === 3 &&
    exact(values.audit.value.authorizedPlacementIds, IDS) &&
    values.generatedFragment.value.generatedPlacementCount === 3 &&
    values.audit.value.records.find((item) => item.animationId === IDS[1])
      ?.exactBehavior.level2Cards.length === 12 &&
    values.audit.value.records.find((item) => item.animationId === IDS[2])
      ?.exactBehavior.questionBank.length === 24,
  '342 QA input authority drifted');
  const descriptors = Object.fromEntries(Object.entries(values)
    .map(([key, value]) => [key, descriptor(value)]));
  descriptors.privateRegistry = Object.freeze({
    ...descriptors.privateRegistry,
    path: `${output}/private-current-js-registry.snapshot.json`,
  });
  descriptors.localRegistry = Object.freeze({...descriptors.localRegistry,
    path: `${output}/registry.local-only.metadata.generated.snapshot.ts`,
  });
  return Object.freeze({values,
    descriptors: Object.freeze({...descriptors,
    script: descriptor(script), chromiumExecutable: descriptor(executable)}),
    snapshots: check ? null : Object.freeze({
      privateRegistry: values.privateRegistry.buffer,
      localRegistry: values.localRegistry.buffer,
    })});
}

async function screenshot(stage, fileName) {
  const buffer = await readFile(path.join(stage, fileName));
  return Object.freeze({path: `${output}/${fileName}`, bytes: buffer.length,
    sha256: sha256(buffer)});
}

function assetReceipt(response) {
  const headers = response.headers();
  return Object.freeze({url: response.url(), status: response.status(),
    cacheControl: headers['cache-control'] ?? null,
    contentType: headers['content-type'] ?? null,
    corp: headers['cross-origin-resource-policy'] ?? null,
    nosniff: headers['x-content-type-options'] ?? null});
}

function validAsset(response, page) {
  return response?.url === `${base}/flash-assets/g678-local/` +
      `${page.animationId}/canvas-renderer.js?sha256=` +
      page.runtime.canvasRenderer.sha256 && response.status === 200 &&
    response.corp === 'same-origin' && response.nosniff === 'nosniff' &&
    response.cacheControl === 'private, no-store, max-age=0' &&
    response.contentType?.startsWith('text/javascript');
}

function sameLoopbackOrigin(url) {
  try {
    return new URL(url).origin === parsedBase.origin;
  } catch {
    return false;
  }
}

const LEGACY_NETWORK_OPERATION =
  /(?:^|[\/_?&=.-])(?:geturl|fscommand|bookmark|report(?:_url)?|download|loadvariables(?:num)?|xml[-_]?send|final[-_]?quiz[-_]?post|external[-_]?interface|shared[-_]?object(?:[-_]?persist)?)(?:$|[\/_?&=.-])/iu;

function isLegacyNetworkOperation(url) {
  try {
    const parsed = new URL(url);
    return parsed.origin !== parsedBase.origin ||
      LEGACY_NETWORK_OPERATION.test(
        decodeURIComponent(`${parsed.pathname}${parsed.search}`));
  } catch {
    return true;
  }
}

function explicitlyAllowedProductRequest(request, pages) {
  if (!request || request.method !== 'GET' ||
    isLegacyNetworkOperation(request.url)) return false;
  let parsed;
  try {
    parsed = new URL(request.url);
  } catch {
    return false;
  }
  const safeResourceTypes = new Set([
    'document', 'script', 'stylesheet', 'image', 'font', 'fetch', 'xhr',
    'other',
  ]);
  if (!safeResourceTypes.has(request.resourceType)) return false;
  if (parsed.pathname.startsWith('/_next/')) return true;
  const lessonPathPrefix = '/en/migration-status/g678-calibration/';
  if (IDS.some((id) => parsed.pathname === `${lessonPathPrefix}${id}`)) {
    return request.resourceType === 'document' ||
      request.resourceType === 'fetch';
  }
  const canvasMatch = parsed.pathname.match(
    /^\/flash-assets\/g678-local\/([^/]+)\/canvas-renderer\.js$/u);
  if (canvasMatch) {
    const page = pages.get(canvasMatch[1]);
    return request.resourceType === 'script' && page &&
      parsed.search === `?sha256=${page.runtime.canvasRenderer.sha256}`;
  }
  return request.resourceType === 'image' || request.resourceType === 'font' ||
    request.resourceType === 'stylesheet' || request.resourceType === 'script'
    ? /\.(?:avif|css|gif|ico|jpe?g|js|png|svg|webp|woff2?)$/iu.test(
        parsed.pathname)
    : false;
}

async function buildEvidence(inputs) {
  const freeze = inputs.values.freeze.value;
  const catalog = inputs.values.catalog.value;
  const pages = new Map(freeze.selectedPages.map((page) =>
    [page.animationId, page]));
  const matchingBehavior = inputs.values.audit.value.records.find((item) =>
    item.animationId === IDS[1]).exactBehavior;
  const questionBank = inputs.values.audit.value.records.find((item) =>
    item.animationId === IDS[2]).exactBehavior.questionBank;
  const questions = new Map(questionBank.map((item) =>
    [item.questionNumber, item]));
  const expectedLessons = lessonVector(catalog, freeze);
  const target = projectPath(output);
  invariant(!await lstat(target).then(() => true, () => false),
    `${output} already exists`);
  const stage = `${target}.staging-${process.pid}`;
  await mkdir(stage, {recursive: false});
  invariant(inputs.snapshots, 'QA build requires live registry snapshots');
  await Promise.all([
    writeFile(path.join(stage, 'private-current-js-registry.snapshot.json'),
      inputs.snapshots.privateRegistry, {flag: 'wx'}),
    writeFile(path.join(stage,
      'registry.local-only.metadata.generated.snapshot.ts'),
    inputs.snapshots.localRegistry, {flag: 'wx'}),
  ]);
  const browser = await chromium.launch({headless: true});
  const evidence = {schemaVersion: 1,
    artifactType: 'g678-alg-l09-game-assessment-browser-qa-v1',
    generatedAt: new Date().toISOString(), baseUrl: base,
    inputs: inputs.descriptors,
    browser: {name: 'Chromium', version: browser.version(),
      executable: inputs.descriptors.chromiumExecutable},
    registeredCurrentJsPages: 342, allLessons: null,
    controllerAndGame: null, finalAssessment: null,
    screenshots: [], acceptanceEffects: FALSE_EFFECTS};
  try {
    const all = await browser.newPage({viewport: {width: 1440, height: 1100}});
    const allErrors = [];
    all.on('console', (message) => {
      if (message.type() === 'error') allErrors.push(message.text());
    });
    all.on('pageerror', (error) => allErrors.push(String(error)));
    await all.goto(`${base}/en?screen=lessons`, {waitUntil: 'networkidle'});
    await all.getByRole('button', {name: 'G6–G8 shared'}).click();
    await all.waitForFunction(() => document.querySelectorAll(
      '[data-workspace-screen="lessons"] article').length === 44);
    const cards = all.locator('[data-workspace-screen="lessons"] article');
    const copies = await cards.locator('[data-lesson-card-copy]').allTextContents();
    const observed = copies.map((copy, index) => {
      const identity = copy.match(
        /G6–G8 shared · (NMS002|GEO001|ALG001|DAT001) · L(\d+)/u);
      const progress = copy.match(/(\d+)\/(\d+) pages registered/u);
      invariant(identity && progress, `invalid shared lesson card: ${copy}`);
      const expected = expectedLessons[index];
      invariant(expected.moduleCode === identity[1] &&
        expected.lessonNumber === Number(identity[2]) &&
        expected.registeredPageCount === Number(progress[1]) &&
        expected.activePageCount === Number(progress[2]),
      `${expected.stableLessonKey}: browser vector drifted`);
      return expected;
    });
    invariant(await cards.locator('a').count() === 0 && allErrors.length === 0,
      'All Lessons link/error boundary drifted');
    const allFile = 'all-lessons-342-one-complete.png';
    await all.screenshot({path: path.join(stage, allFile), fullPage: true});
    evidence.screenshots.push(await screenshot(stage, allFile));
    evidence.allLessons = {sharedCardCount: 44, linkedCardCount: 0,
      registeredPageSum: 342, exactLessonVector: observed,
      completeLessonKeys: ['shared-alg001-l09'], errors: allErrors};
    await all.close();

    const controllerPage = await browser.newPage(
      {viewport: {width: 1440, height: 1000}});
    const controllerErrors = [];
    const controllerAssets = [];
    const controllerRequests = [];
    controllerPage.on('console', (message) => {
      if (message.type() === 'error') controllerErrors.push(message.text());
    });
    controllerPage.on('pageerror', (error) =>
      controllerErrors.push(String(error)));
    controllerPage.on('request', (request) => controllerRequests.push({
      method: request.method(), resourceType: request.resourceType(),
      url: request.url(),
    }));
    controllerPage.on('response', (response) => {
      if (IDS.slice(0, 2).some((id) => response.url().includes(
        `/flash-assets/g678-local/${id}/canvas-renderer.js`))) {
        controllerAssets.push(assetReceipt(response));
      }
    });
    await controllerPage.goto(`${base}/en/migration-status/g678-calibration/` +
      IDS[0], {waitUntil: 'domcontentloaded'});
    await controllerPage.waitForFunction((id) => document.querySelector(
      `canvas[data-course-canvas="${id}"]`)?.getAttribute('data-render-state') ===
      'ready', IDS[0], {timeout: 45_000});
    const timeline = controllerPage.locator(
      'label.lesson-shell2__modern-timeline ' +
      'input[data-responsive-focus-key="timeline"]');
    await timeline.fill('748');
    await controllerPage.getByRole('button',
      {name: 'Continue from inspected frame'}).click();
    await controllerPage.waitForFunction(() => document.querySelector(
      '[data-game-controller-ready="true"]'));
    await controllerPage.getByRole('button', {name: 'Level 2'}).click();
    await controllerPage.waitForFunction(() => document.querySelector(
      '[data-selected-level="2"]'));
    await controllerPage.getByRole('button',
      {name: 'Replay', exact: true}).click();
    await controllerPage.waitForFunction(() => {
      const input = document.querySelector(
        'label.lesson-shell2__modern-timeline ' +
        'input[data-responsive-focus-key="timeline"]');
      return input && !input.disabled && Number(input.max) >= 748;
    });
    const replayTimeline = controllerPage.locator(
      'label.lesson-shell2__modern-timeline ' +
      'input[data-responsive-focus-key="timeline"]');
    await replayTimeline.focus();
    await replayTimeline.press('End');
    const resumeAfterReplay = controllerPage.getByRole('button',
      {name: 'Continue from inspected frame'});
    await resumeAfterReplay.waitFor();
    await resumeAfterReplay.click();
    await controllerPage.waitForFunction(() => document.querySelector(
      '[data-game-controller-ready="true"][data-selected-level="none"]'));
    const controllerReplayReset = true;
    await controllerPage.getByRole('button', {name: 'Level 2'}).click();
    await controllerPage.waitForFunction(() => document.querySelector(
      '[data-selected-level="2"]'));
    const controllerFile = `${IDS[0]}.png`;
    await controllerPage.screenshot({path: path.join(stage, controllerFile),
      fullPage: true});
    evidence.screenshots.push(await screenshot(stage, controllerFile));
    await controllerPage.getByRole('button', {name: 'Start game'}).click();
    await controllerPage.waitForFunction((id) => document.querySelector(
      `canvas[data-course-canvas="${id}"]`)?.getAttribute('data-render-state') ===
      'ready', IDS[1], {timeout: 15_000});
    await controllerPage.waitForFunction(() => document.querySelector(
      '[data-game-level="2"][data-game-phase="choosing"]'));
    const visibleCardLabels = await controllerPage.locator(
      '[data-game-level="2"] [data-card-id]').allTextContents();
    const expectedCardLabels = matchingBehavior.level2Cards.map((card) =>
      card.label);
    invariant(exact(visibleCardLabels, expectedCardLabels),
      'matching source card labels are not visibly bound');
    const gameReadyFile = `${IDS[1]}-ready.png`;
    await controllerPage.screenshot({path: path.join(stage, gameReadyFile),
      fullPage: true});
    evidence.screenshots.push(await screenshot(stage, gameReadyFile));
    await controllerPage.getByRole('button', {name: 'Level 1'}).click();
    await controllerPage.waitForFunction(() => document.querySelector(
      '[data-game-level="1"][data-game-phase="choosing"]'));
    const level1VisibleCardLabels = await controllerPage.locator(
      '[data-game-level="1"] [data-card-id]').allTextContents();
    invariant(exact(level1VisibleCardLabels,
      matchingBehavior.level1Cards.map((card) => card.label)),
    'matching Level 1 source card labels are not visibly bound');
    await controllerPage.getByRole('button',
      {name: matchingBehavior.level1Cards[0].label, exact: true}).click();
    await controllerPage.getByRole('button',
      {name: matchingBehavior.level1Cards[3].label, exact: true}).click();
    invariant(await controllerPage.getByRole('button',
      {name: 'Level 2'}).isDisabled(),
    'matching level switch was not held during Level 1 feedback');
    await controllerPage.getByRole('button', {name: 'Continue'}).click();
    await controllerPage.waitForFunction(() => document.querySelector(
      '[data-lesson-host-practice-feedback-active="false"]'));
    for (const card of matchingBehavior.level1Cards.filter((item) =>
      item.pairId === 1)) {
      await controllerPage.getByRole('button',
        {name: card.label, exact: true}).click();
    }
    await controllerPage.getByRole('button', {name: 'Continue'}).click();
    await controllerPage.waitForFunction(() => document.querySelector(
      '[data-game-level="1"][data-game-score="8"]' +
      '[data-matched-pair-count="1"]'));
    const level1ScoringAndResetPassed = true;
    await controllerPage.getByRole('button',
      {name: 'Replay', exact: true}).click();
    await controllerPage.waitForFunction(() => document.querySelector(
      '[data-game-level="2"][data-game-phase="choosing"]' +
      '[data-game-score="0"][data-matched-pair-count="0"]') &&
      document.querySelector(
        '[data-lesson-host-practice-feedback-active="false"]'));
    const matchingReplayReset = true;
    await controllerPage.getByRole('button',
      {name: matchingBehavior.level2Cards[0].label, exact: true}).click();
    await controllerPage.getByRole('button',
      {name: matchingBehavior.level2Cards[3].label, exact: true}).click();
    const levelSwitchHeldDuringFeedback = await controllerPage.getByRole(
      'button', {name: 'Level 1'}).isDisabled();
    invariant(levelSwitchHeldDuringFeedback,
      'matching level switch was not held during source feedback');
    await controllerPage.getByRole('button', {name: 'Continue'}).click();
    for (let pair = 1; pair <= 6; pair += 1) {
      const cards = matchingBehavior.level2Cards.filter((card) =>
        card.pairId === pair);
      await controllerPage.getByRole('button',
        {name: cards[0].label, exact: true}).click();
      await controllerPage.getByRole('button',
        {name: cards[1].label, exact: true}).click();
      await controllerPage.getByRole('button', {name: 'Continue'}).click();
    }
    await controllerPage.waitForFunction(() => document.querySelector(
      '[data-game-phase="complete"][data-game-score="58"]' +
      '[data-matched-pair-count="6"]'));
    const gameFile = `${IDS[1]}.png`;
    await controllerPage.screenshot({path: path.join(stage, gameFile),
      fullPage: true});
    evidence.screenshots.push(await screenshot(stage, gameFile));
    await controllerPage.getByRole('button', {name: 'Finish game'}).click();
    await controllerPage.waitForFunction(() => document.querySelector(
      '.runtime-shell')?.getAttribute(
        'data-runtime-interactive-stop-resolved-count') === '1');
    invariant(controllerErrors.length === 0 && controllerAssets.length === 2 &&
      validAsset(controllerAssets[0], pages.get(IDS[0])) &&
      validAsset(controllerAssets[1], pages.get(IDS[1])),
    'controller/game browser or asset policy drifted');
    evidence.controllerAndGame = {selectedLevel: 2,
      levelHandoffInherited: true,
      navigationTarget: IDS[1], wrongScoreDelta: -2,
      correctScoreDelta: 10, finalScore: 58, matchedPairCount: 6,
      visibleCardLabels, level1VisibleCardLabels,
      level1ScoringAndResetPassed, controllerReplayReset,
      matchingReplayReset, levelSwitchHeldDuringFeedback,
      resolvedStopCount: 1, assets: controllerAssets,
      errors: controllerErrors};
    await controllerPage.close();

    const fqPage = await browser.newPage({viewport: {width: 1440, height: 1000}});
    const fqErrors = [];
    const fqAssets = [];
    const fqRequests = [];
    fqPage.on('console', (message) => {
      if (message.type() === 'error') fqErrors.push(message.text());
    });
    fqPage.on('pageerror', (error) => fqErrors.push(String(error)));
    fqPage.on('request', (request) => fqRequests.push({
      method: request.method(), resourceType: request.resourceType(),
      url: request.url(),
    }));
    fqPage.on('response', (response) => {
      if (response.url().includes(
        `/flash-assets/g678-local/${IDS[2]}/canvas-renderer.js`)) {
        fqAssets.push(assetReceipt(response));
      }
    });
    await fqPage.goto(`${base}/en/migration-status/g678-calibration/${IDS[2]}`,
      {waitUntil: 'domcontentloaded'});
    await fqPage.waitForFunction((id) => document.querySelector(
      `canvas[data-course-canvas="${id}"]`)?.getAttribute('data-render-state') ===
      'ready', IDS[2], {timeout: 45_000});
    const sequence = [];
    const visibleQuestionContent = [];
    let wrongResponse = null;
    for (let index = 0; index < 10; index += 1) {
      const surface = fqPage.locator('[data-assessment-phase="answering"]');
      const questionNumber = Number(await surface.getAttribute(
        'data-current-question-number'));
      sequence.push(questionNumber);
      const question = questions.get(questionNumber);
      invariant(question, `source question ${questionNumber} missing`);
      const prompt = await surface.locator(
        '[data-source-question-content-bound="true"]').innerText();
      const choiceCount = Number(await surface.locator(
        '[data-choice-count]').getAttribute('data-choice-count'));
      const choices = await surface.locator(
        '[data-answer-option]').allTextContents();
      const supportingData = await surface.locator(
        '[aria-label="Question data"] li').allTextContents();
      const expectedChoices = question.choices.map((choice, option) =>
        `${String.fromCharCode(65 + option)}. ${choice}`);
      invariant(prompt === question.prompt &&
        choiceCount === question.choices.length &&
        exact(choices, expectedChoices) &&
        exact(supportingData, question.supportingData),
      `source question ${questionNumber} visible content drifted`);
      visibleQuestionContent.push(Object.freeze({questionNumber,
        choiceCount, sha256: sha256(Buffer.from(JSON.stringify({prompt,
          supportingData, choices})))}));
      if (index === 0) {
        const answeringFile = `${IDS[2]}-answering.png`;
        await fqPage.screenshot({path: path.join(stage, answeringFile),
          fullPage: true});
        evidence.screenshots.push(await screenshot(stage, answeringFile));
      }
      const selectedOption = wrongResponse === null && choiceCount === 2
        ? (question.correctOption === 1 ? 2 : 1)
        : question.correctOption;
      if (selectedOption !== question.correctOption) {
        wrongResponse = {index, questionNumber, selectedOption,
          correctOption: question.correctOption,
          selectedText: question.choices[selectedOption - 1],
          correctText: question.choices[question.correctOption - 1]};
      }
      await surface.getByRole('button', {
        name: expectedChoices[selectedOption - 1], exact: true,
      }).click();
    }
    invariant(wrongResponse && wrongResponse.index >= 0,
      'one visible two-choice question must exercise incorrect scoring');
    await fqPage.waitForFunction(() => document.querySelector(
      '[data-assessment-phase="results"][data-response-count="10"]'));
    invariant((await fqPage.locator(
      '[data-assessment-phase="results"]').innerText()).includes(
      'Score: 9 of 10'), 'final assessment incorrect score drifted');
    const hostFqScore = await fqPage.locator('[data-lesson-player]')
      .evaluate((element) => ({
        attempted: Number(element.getAttribute(
          'data-lesson-host-fq-attempted')),
        correct: Number(element.getAttribute('data-lesson-host-fq-correct')),
        pointsAwarded: Number(element.getAttribute(
          'data-lesson-host-fq-points-awarded')),
        pointsPossible: Number(element.getAttribute(
          'data-lesson-host-fq-points-possible')),
      }));
    invariant(exact(hostFqScore, {attempted: 10, correct: 9,
      pointsAwarded: 9, pointsPossible: 10}),
    'typed FQ host score drifted');
    await fqPage.getByRole('button', {name: 'Review responses'}).click();
    for (let index = 0; index < wrongResponse.index; index += 1) {
      await fqPage.getByRole('button', {name: 'Next response'}).click();
    }
    await fqPage.waitForFunction((questionNumber) => document.querySelector(
      `[data-reviewed-source-question="${questionNumber}"]`),
    wrongResponse.questionNumber);
    const wrongReviewComparison = await fqPage.locator(
      '[data-review-answer-comparison="true"]').innerText();
    invariant(wrongReviewComparison.includes(
      `Your answer: ${String.fromCharCode(64 + wrongResponse.selectedOption)}. ` +
      wrongResponse.selectedText) && wrongReviewComparison.includes(
      `Correct answer: ${String.fromCharCode(64 + wrongResponse.correctOption)}. ` +
      wrongResponse.correctText),
    'final assessment wrong review content drifted');
    const fqFile = `${IDS[2]}-review.png`;
    await fqPage.screenshot({path: path.join(stage, fqFile), fullPage: true});
    evidence.screenshots.push(await screenshot(stage, fqFile));
    for (let index = wrongResponse.index; index < 9; index += 1) {
      await fqPage.getByRole('button', {name: 'Next response'}).click();
    }
    await fqPage.getByRole('button', {name: 'Finish review'}).click();
    await fqPage.waitForFunction(() => document.querySelector(
      '.runtime-shell')?.getAttribute(
        'data-runtime-interactive-stop-resolved-count') === '1');
    await fqPage.getByRole('button', {name: 'Replay', exact: true}).click();
    await fqPage.waitForFunction(() => document.querySelector(
      '[data-assessment-phase="answering"][data-response-count="0"]') &&
      document.querySelector('[data-lesson-host-fq-attempted="0"]' +
        '[data-lesson-host-fq-correct="0"]' +
        '[data-lesson-host-fq-points-awarded="0"]' +
        '[data-lesson-host-fq-points-possible="0"]'));
    const fqReplayReset = true;
    const allObservedRequests = [...controllerRequests, ...fqRequests];
    const legacyNetworkOperations = allObservedRequests.filter((request) =>
      isLegacyNetworkOperation(request.url));
    const unallowlistedRequests = allObservedRequests.filter((request) =>
      !explicitlyAllowedProductRequest(request, pages));
    invariant(sequence.length === 10 && new Set(sequence).size === 10 &&
      fqErrors.length === 0 && fqAssets.length === 1 &&
      validAsset(fqAssets[0], pages.get(IDS[2])),
    'final assessment browser or asset policy drifted');
    evidence.finalAssessment = {questionPoolSize: 24,
      presentedQuestionCount: 10, questionSequence: sequence,
      uniqueQuestionCount: 10, correctResponseCount: 9,
      wrongResponse, wrongReviewComparison, hostFqScore,
      sourceQuestionContentVisible: true,
      visibleQuestionContent,
      twoChoiceQuestionCount: visibleQuestionContent.filter((item) =>
        item.choiceCount === 2).length,
      reviewCount: 10, resolvedStopCount: 1, fqReplayReset,
      observedRequestCount: allObservedRequests.length,
      observedRequests: allObservedRequests,
      legacyNetworkOperationsObserved: legacyNetworkOperations.length,
      allObservedRequestsLoopback:
        allObservedRequests.every((request) =>
          sameLoopbackOrigin(request.url)),
      allObservedRequestsExplicitlyAllowed: unallowlistedRequests.length === 0,
      assets: fqAssets, errors: fqErrors};
    await fqPage.close();
    await writeFile(path.join(stage, 'evidence.json'),
      `${JSON.stringify(evidence, null, 2)}\n`, {flag: 'wx'});
    await rename(stage, target);
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
  const vector = lessonVector(inputs.values.catalog.value,
    inputs.values.freeze.value);
  const expectedScreenshots = [
    `${output}/all-lessons-342-one-complete.png`,
    `${output}/${IDS[0]}.png`,
    `${output}/${IDS[1]}-ready.png`,
    `${output}/${IDS[1]}.png`,
    `${output}/${IDS[2]}-answering.png`,
    `${output}/${IDS[2]}-review.png`,
  ];
  const questionBank = inputs.values.audit.value.records.find((item) =>
    item.animationId === IDS[2]).exactBehavior.questionBank;
  const questionMap = new Map(questionBank.map((item) =>
    [item.questionNumber, item]));
  const expectedVisibleQuestionContent = evidence.finalAssessment
    .questionSequence.map((questionNumber) => {
      const question = questionMap.get(questionNumber);
      invariant(question, `source question ${questionNumber} missing`);
      const choices = question.choices.map((choice, option) =>
        `${String.fromCharCode(65 + option)}. ${choice}`);
      return {questionNumber, choiceCount: question.choices.length,
        sha256: sha256(Buffer.from(JSON.stringify({prompt: question.prompt,
          supportingData: question.supportingData, choices})))};
    });
  const expectedWrongIndex = evidence.finalAssessment.questionSequence
    .findIndex((questionNumber) =>
      questionMap.get(questionNumber)?.choices.length === 2);
  invariant(expectedWrongIndex >= 0,
    'browser sequence has no source two-choice question');
  const expectedWrongQuestion = questionMap.get(
    evidence.finalAssessment.questionSequence[expectedWrongIndex]);
  const expectedWrongOption = expectedWrongQuestion.correctOption === 1
    ? 2 : 1;
  const expectedWrongResponse = {
    index: expectedWrongIndex,
    questionNumber: expectedWrongQuestion.questionNumber,
    selectedOption: expectedWrongOption,
    correctOption: expectedWrongQuestion.correctOption,
    selectedText: expectedWrongQuestion.choices[expectedWrongOption - 1],
    correctText:
      expectedWrongQuestion.choices[expectedWrongQuestion.correctOption - 1],
  };
  invariant(evidence.artifactType ===
      'g678-alg-l09-game-assessment-browser-qa-v1' &&
    evidence.baseUrl === base && evidence.registeredCurrentJsPages === 342 &&
    exact(evidence.inputs, inputs.descriptors) &&
    evidence.allLessons.sharedCardCount === 44 &&
    evidence.allLessons.linkedCardCount === 0 &&
    evidence.allLessons.registeredPageSum === 342 &&
    exact(evidence.allLessons.exactLessonVector, vector) &&
    exact(evidence.allLessons.completeLessonKeys, ['shared-alg001-l09']) &&
    evidence.allLessons.errors.length === 0 &&
    evidence.controllerAndGame.selectedLevel === 2 &&
    evidence.controllerAndGame.levelHandoffInherited === true &&
    evidence.controllerAndGame.navigationTarget === IDS[1] &&
    evidence.controllerAndGame.finalScore === 58 &&
    evidence.controllerAndGame.matchedPairCount === 6 &&
    evidence.controllerAndGame.controllerReplayReset === true &&
    evidence.controllerAndGame.matchingReplayReset === true &&
    evidence.controllerAndGame.level1ScoringAndResetPassed === true &&
    exact(evidence.controllerAndGame.level1VisibleCardLabels,
      inputs.values.audit.value.records.find((item) =>
        item.animationId === IDS[1]).exactBehavior.level1Cards.map((card) =>
          card.label)) &&
    evidence.controllerAndGame.levelSwitchHeldDuringFeedback === true &&
    exact(evidence.controllerAndGame.visibleCardLabels,
      inputs.values.audit.value.records.find((item) =>
        item.animationId === IDS[1]).exactBehavior.level2Cards.map((card) =>
          card.label)) &&
    evidence.controllerAndGame.resolvedStopCount === 1 &&
    evidence.controllerAndGame.errors.length === 0 &&
    evidence.finalAssessment.questionPoolSize === 24 &&
    evidence.finalAssessment.presentedQuestionCount === 10 &&
    evidence.finalAssessment.uniqueQuestionCount === 10 &&
    evidence.finalAssessment.correctResponseCount === 9 &&
    exact(evidence.finalAssessment.hostFqScore, {attempted: 10, correct: 9,
      pointsAwarded: 9, pointsPossible: 10}) &&
    exact(evidence.finalAssessment.wrongResponse, expectedWrongResponse) &&
    evidence.finalAssessment.wrongReviewComparison.includes(
      `Your answer: ${String.fromCharCode(64 +
        expectedWrongResponse.selectedOption)}. ${
        expectedWrongResponse.selectedText}`) &&
    evidence.finalAssessment.wrongReviewComparison.includes(
      `Correct answer: ${String.fromCharCode(64 +
        expectedWrongResponse.correctOption)}. ${
        expectedWrongResponse.correctText}`) &&
    evidence.finalAssessment.sourceQuestionContentVisible === true &&
    exact(evidence.finalAssessment.visibleQuestionContent,
      expectedVisibleQuestionContent) &&
    evidence.finalAssessment.twoChoiceQuestionCount ===
      expectedVisibleQuestionContent.filter((item) =>
        item.choiceCount === 2).length &&
    evidence.finalAssessment.twoChoiceQuestionCount > 0 &&
    evidence.finalAssessment.reviewCount === 10 &&
    evidence.finalAssessment.fqReplayReset === true &&
    evidence.finalAssessment.observedRequestCount ===
      evidence.finalAssessment.observedRequests.length &&
    evidence.finalAssessment.observedRequestCount > 0 &&
    evidence.finalAssessment.allObservedRequestsLoopback === true &&
    evidence.finalAssessment.allObservedRequestsExplicitlyAllowed === true &&
    evidence.finalAssessment.observedRequests.every((request) =>
      sameLoopbackOrigin(request.url) &&
      !isLegacyNetworkOperation(request.url) &&
      explicitlyAllowedProductRequest(request,
        new Map(inputs.values.freeze.value.selectedPages.map((page) =>
          [page.animationId, page])))) &&
    evidence.finalAssessment.legacyNetworkOperationsObserved === 0 &&
    evidence.finalAssessment.errors.length === 0 &&
    exact(evidence.screenshots.map((item) => item.path),
      expectedScreenshots) && exact(evidence.acceptanceEffects, FALSE_EFFECTS),
  'game/assessment durable browser evidence drifted');
  for (const item of evidence.screenshots) {
    const current = await binding(item.path);
    invariant(current.bytes === item.bytes && current.sha256 === item.sha256,
      `${item.path} drifted`);
  }
  return evidence;
}

const args = process.argv.slice(2);
invariant(args.length <= 1 && (args.length === 0 || args[0] === '--check'),
  'usage: qa-g678-alg-l09-game-assessment-browser.mjs [--check]');
const check = args[0] === '--check';
const inputs = await currentInputs(check);
const evidence = check ? await checkEvidence(inputs) : await buildEvidence(inputs);
process.stdout.write(`${JSON.stringify({check,
  evidence: `${output}/evidence.json`, registeredCurrentJsPages: 342,
  sharedLessonCards: evidence.allLessons.sharedCardCount,
  linkedLessonCards: evidence.allLessons.linkedCardCount,
  completeLessonKeys: evidence.allLessons.completeLessonKeys,
  screenshotCount: evidence.screenshots.length,
  acceptanceEffects: evidence.acceptanceEffects}, null, 2)}\n`);
