#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {lstat, mkdir, open, readFile, writeFile} from 'node:fs/promises';
import {arch, platform, release} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {
  extractCanvasRuntimeMetadata,
  resolveProductionPlacements,
} from './run-canvas-resolution-capture-set.mjs';
import {collectChromiumToolchainIdentity} from './generate-adaptive-canvas-batch.mjs';

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), '..');

export const OUTPUT_ROOT =
  'reports/canvas-resolution/performance/v1-baseline-capture-v3';
export const PLAN_PATH = `${OUTPUT_ROOT}/plan.v1.json`;
export const FINAL_BASELINE_PATH =
  'reports/canvas-resolution/performance/v1-baseline.json';
const FONT_RECEIPT_PATH = `${OUTPUT_ROOT}/font-pilot.v1.json`;
const BACKING_BASELINE_PATH =
  'reports/canvas-resolution/baseline/v1-backing-compact-v3/' +
  'v1-backing-baseline.v1.json';
const V1_PROFILE_PATH = 'apps/web/config/current-js-production-assets.v1.json';
const V10_PLAN_PATH = 'work/adaptive-canvas-production-five.plan.v10.json';
const V10_FREEZE_PATH =
  'work/adaptive-canvas-real-browser-validation-v10.freeze.v1.json';
const INACTIVE_BINDINGS_PATH =
  'packages/demos/src/adaptive-canvas-production-bindings.generated.ts';
const TOOL_PATH =
  'scripts/capture-canvas-resolution-v1-performance-baseline.mjs';
const TOOL_TEST_PATH =
  'scripts/capture-canvas-resolution-v1-performance-baseline.test.mjs';
const CATALOG_PATHS = Object.freeze([
  'catalog/lesson-releases.json',
  'catalog/page-only-current-js-product-releases.json',
]);
const RELEASES = Object.freeze([
  Object.freeze({
    lessonId: 'g03-l02',
    releaseId: 'lesson-g03-l02-addition-subtraction-page-only-current-js',
  }),
  Object.freeze({
    lessonId: 'g04-l03',
    releaseId: 'lesson-g04-l03-negative-numbers',
  }),
  Object.freeze({
    lessonId: 'g05-l03',
    releaseId: 'lesson-g05-l03-exponents-prime-factorizations-page-only',
  }),
  Object.freeze({
    lessonId: 'g05-l04',
    releaseId: 'lesson-g05-l04-number-lines',
  }),
  Object.freeze({
    lessonId: 'g05-l05',
    releaseId: 'lesson-g05-l05-add-subtract-negative-numbers',
  }),
]);
const PILOT_IDS = Object.freeze([
  'course-g04-l03-in-002',
  'course-g04-l03-in-003',
  'course-g04-l03-rw-003',
  'course-g04-l03-in-009',
  'course-g04-l03-ir-001-341242cc',
  'course-g04-l03-rw-002',
  'course-g05-l04-fq-002',
  'course-g05-l04-fq-003',
  'course-g05-l05-fq-003',
  'course-g05-l03-rw-002',
  'course-g05-l03-in-028',
  'course-g04-l03-gs-002',
]);
const FONT_ID = 'course-g04-l03-gs-002';
const FONT_IDENTITY = Object.freeze({
  requirementId: 'req:sprite-321:lesson-shell-natural-entry:en',
  frameDomainId: 'sprite-321',
  traceId: 'trace:sprite-321:lesson-shell-natural-entry:en:seed-0',
  entryStateSha256:
    'a1e46925e0d38c99565e5218712663aea69c93d83870bdf5c7f027ba6610501c',
  frame: 427,
  scenario: 'source-static-frame',
  language: 'en',
  seed: '0',
});
const FONT_CHECKS = Object.freeze([
  Object.freeze({
    id: 'timer-arial',
    css: 'bold 12.7998046875px Arial, sans-serif',
    sample: '00:00:00',
  }),
  Object.freeze({
    id: 'score-bauhaus-fallback',
    css: 'bold 17px "Bauhaus Md BT", "Arial Rounded MT Bold", sans-serif',
    sample: '0',
  }),
]);
const PAGE_RENDERER =
  /^courses\/(course-g(?:03|04|05)-l\d{2}-[^/]+)\/canvas-renderer\.js$/u;
const SHA256 = /^[a-f0-9]{64}$/u;
const EXPECTED = Object.freeze({
  v1ProfileSha256:
    'ccd832025b2df2c69615872645944b5bcfab18628d4d69df71ea0341925f9eca',
  v1Checksum:
    '52dd1d51335523dc097b0c1a428e897960425ad184069fb023e98e0fcef7ae25',
  v10PlanSha256:
    'db4b349f5863d3e4b784953aa5342d5499a38311fa268ce9a068f7e7b633d983',
  freezeSha256:
    'ee63ac0eb41608ea4d0690a3576576ee9d25d4486771343c3947b820d48f3a53',
  inactiveBindingsSha256:
    'e3999ed5a22d2eb1eb422bdfc3b25fe10aff237f0eb5aceb0908bee1219a1b63',
  backingBaselineSha256:
    'a494c1cacefe888745cfd5255317f153a55fb88d8bd42ed488f7073c429743a6',
  rendererCount: 283,
  placementCount: 284,
});

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

export function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [
      key,
      canonicalize(value[key]),
    ]));
  }
  return value;
}

function canonicalJson(value) {
  return JSON.stringify(canonicalize(value));
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function hashBoundDocument(artifactType, payload) {
  return {
    schemaVersion: 1,
    artifactType,
    contentSha256: sha256(Buffer.from(canonicalJson({
      schemaVersion: 1,
      artifactType,
      payload,
    }))),
    payload,
  };
}

function verifyHashBoundDocument(document, artifactType) {
  invariant(document?.schemaVersion === 1 &&
    document?.artifactType === artifactType &&
    SHA256.test(document?.contentSha256 || ''),
  `${artifactType} envelope is invalid`);
  invariant(document.contentSha256 === sha256(Buffer.from(canonicalJson({
    schemaVersion: 1,
    artifactType,
    payload: document.payload,
  }))), `${artifactType} content hash is invalid`);
}

function jsonBytes(document) {
  return Buffer.from(`${JSON.stringify(document, null, 2)}\n`);
}

function absolute(relativePath) {
  const resolved = path.resolve(projectRoot, relativePath);
  invariant(resolved.startsWith(`${projectRoot}${path.sep}`),
    `path escapes project root: ${relativePath}`);
  return resolved;
}

async function stableFile(relativePath) {
  const target = absolute(relativePath);
  const before = await lstat(target);
  invariant(before.isFile() && !before.isSymbolicLink(),
    `${relativePath} must be an ordinary file`);
  const handle = await open(target, 'r');
  try {
    const first = await handle.stat({bigint: true});
    const bytes = await handle.readFile();
    const second = await handle.stat({bigint: true});
    const after = await lstat(target);
    invariant(first.dev === second.dev && first.ino === second.ino &&
      first.size === second.size && first.mtimeNs === second.mtimeNs &&
      before.dev === after.dev && before.ino === after.ino &&
      BigInt(bytes.length) === second.size,
    `${relativePath} changed while read`);
    return {
      bytes,
      descriptor: {path: relativePath, bytes: bytes.length, sha256: sha256(bytes)},
    };
  } finally {
    await handle.close();
  }
}

async function readJson(relativePath, artifactType = null) {
  const binding = await stableFile(relativePath);
  let document;
  try {
    document = JSON.parse(binding.bytes.toString('utf8'));
  } catch (error) {
    throw new Error(`${relativePath} is invalid JSON: ${error.message}`);
  }
  if (artifactType) verifyHashBoundDocument(document, artifactType);
  return {...binding, document};
}

async function writeExclusiveOrSame(relativePath, bytes, mode = 0o444) {
  const target = absolute(relativePath);
  const current = await readFile(target).catch((error) => {
    if (error?.code === 'ENOENT') return null;
    throw error;
  });
  if (current !== null) {
    invariant(current.equals(bytes), `${relativePath} already exists with drift`);
    return 'existing-identical';
  }
  await mkdir(path.dirname(target), {recursive: true});
  await writeFile(target, bytes, {flag: 'wx', mode});
  return 'created';
}

function checkpointPath(animationId) {
  return `${OUTPUT_ROOT}/targets/${animationId}.v1.json`;
}

function lessonReceiptPath(lessonId) {
  return `${OUTPUT_ROOT}/shards/${lessonId}.v1.json`;
}

async function buildPlanPayload() {
  const [profile, v10, freeze, backing, bindings, tool, toolTest, ...catalogs] =
    await Promise.all([
      readJson(V1_PROFILE_PATH),
      readJson(V10_PLAN_PATH),
      readJson(V10_FREEZE_PATH,
        'adaptive-canvas-real-browser-validation-v10-freeze'),
      readJson(BACKING_BASELINE_PATH,
        'canvas-resolution-v1-backing-compact-baseline'),
      stableFile(INACTIVE_BINDINGS_PATH),
      stableFile(TOOL_PATH),
      stableFile(TOOL_TEST_PATH),
      ...CATALOG_PATHS.map((candidate) => readJson(candidate)),
    ]);
  invariant(profile.descriptor.sha256 === EXPECTED.v1ProfileSha256 &&
    profile.document.profileId === 'current-js-production-assets-v1' &&
    profile.document.checksumSetSha256 === EXPECTED.v1Checksum,
  'v1 profile identity changed');
  invariant(v10.descriptor.sha256 === EXPECTED.v10PlanSha256,
    'v10 plan identity changed');
  invariant(freeze.descriptor.sha256 === EXPECTED.freezeSha256,
    'v10 browser freeze identity changed');
  invariant(backing.descriptor.sha256 === EXPECTED.backingBaselineSha256 &&
    backing.document.payload.summary.runtimeCount === 284,
  'v1 backing baseline identity changed');
  invariant(bindings.descriptor.sha256 === EXPECTED.inactiveBindingsSha256,
    'inactive bindings identity changed');
  const placements = resolveProductionPlacements({
    releaseCatalogDocuments: catalogs.map(({document}) => document),
    approvedReleaseIds: RELEASES.map(({releaseId}) => releaseId),
  });
  invariant(placements.length === EXPECTED.placementCount,
    'production placement count changed');
  const firstPlacement = new Map();
  const placementCountByAnimation = new Map();
  for (const placement of placements) {
    placementCountByAnimation.set(
      placement.animationId,
      (placementCountByAnimation.get(placement.animationId) ?? 0) + 1,
    );
    if (!firstPlacement.has(placement.animationId)) {
      firstPlacement.set(placement.animationId, placement);
    }
  }
  const pageEntries = profile.document.entries
    .map((entry) => ({entry, match: PAGE_RENDERER.exec(entry.assetPath)}))
    .filter(({match}) => match !== null)
    .map(({entry, match}) => ({entry, animationId: match[1]}))
    .sort((left, right) => left.animationId.localeCompare(right.animationId, 'en'));
  invariant(pageEntries.length === EXPECTED.rendererCount,
    'v1 renderer count changed');
  const targets = [];
  for (const {entry, animationId} of pageEntries) {
    const runtimePath = `apps/web/public/flash-assets/courses/${entry.relativePath}`;
    const runtime = await stableFile(runtimePath);
    invariant(runtime.bytes.length === entry.bytes &&
      runtime.descriptor.sha256 === entry.sha256,
    `${animationId} differs from v1 profile`);
    const metadata = extractCanvasRuntimeMetadata(runtime.bytes, animationId);
    invariant(Number.isFinite(metadata.fps) && metadata.fps > 0,
      `${animationId} source FPS is invalid`);
    const placement = firstPlacement.get(animationId);
    invariant(placement, `${animationId} has no production placement`);
    const lessonId = RELEASES.find(({releaseId}) =>
      releaseId === placement.releaseId)?.lessonId;
    invariant(lessonId, `${animationId} release is outside five lessons`);
    targets.push({
      animationId,
      grade: placement.grade,
      lesson: placement.lesson,
      ordinal: placement.ordinal,
      placementId: placementCountByAnimation.get(animationId) > 1
        ? placement.placementId
        : null,
      releaseId: placement.releaseId,
      lessonId,
      sourceFps: metadata.fps,
      runtimeFile: runtime.descriptor,
      checkpointPath: checkpointPath(animationId),
    });
  }
  invariant(targets.length === EXPECTED.rendererCount &&
    new Set(targets.map(({animationId}) => animationId)).size ===
      EXPECTED.rendererCount &&
    PILOT_IDS.every((id) => targets.some(({animationId}) => animationId === id)),
  'performance target identity set changed');
  return {
    status: 'planned-current-javascript-v1-product-performance-baseline',
    baseURL: 'http://127.0.0.1:3223',
    inputs: {
      profile: profile.descriptor,
      v10Plan: v10.descriptor,
      realBrowserFreeze: freeze.descriptor,
      backingBaseline: backing.descriptor,
      inactiveBindings: bindings.descriptor,
      tool: tool.descriptor,
      toolTest: toolTest.descriptor,
      catalogs: catalogs.map(({descriptor}) => descriptor),
    },
    contract: {
      browser: 'playwright-chromium',
      cpuThrottleRate: 2,
      deviceScaleFactor: 2,
      viewport: {width: 1440, height: 900},
      productMeasurement:
        'fresh-context-navigation-through-exact-source-ordered-placement-to-v1-ready-canvas',
      sampleCountPerRenderer: 1,
      checkpointCount: EXPECTED.rendererCount,
      errorPolicy: 'zero-console-page-request-or-http-errors',
    },
    summary: {
      rendererCount: targets.length,
      pilotCount: PILOT_IDS.length,
      placementCount: placements.length,
      lessonCount: RELEASES.length,
    },
    shards: RELEASES.map(({lessonId, releaseId}) => ({
      lessonId,
      releaseId,
      runtimeCount: targets.filter((target) => target.lessonId === lessonId).length,
      receiptPath: lessonReceiptPath(lessonId),
    })),
    targets,
    pilotIds: [...PILOT_IDS],
    boundaries: {
      currentJavascriptV1Only: true,
      adaptiveV2Measured: false,
      adaptiveBatchApplyRun: false,
      v2ProfileWritten: false,
      activeBindingWritten: false,
      deploymentRun: false,
      releaseEligibilityChanged: false,
    },
  };
}

async function buildPlan() {
  return hashBoundDocument(
    'canvas-resolution-v1-performance-baseline-plan',
    await buildPlanPayload(),
  );
}

async function writePlan({check}) {
  const document = await buildPlan();
  const bytes = jsonBytes(document);
  if (check) {
    const current = await readFile(absolute(PLAN_PATH));
    invariant(current.equals(bytes), `${PLAN_PATH} is missing or stale`);
    return {operation: 'checked', document, bytes, descriptor: {
      path: PLAN_PATH, bytes: bytes.length, sha256: sha256(bytes),
    }};
  }
  const operation = await writeExclusiveOrSame(PLAN_PATH, bytes);
  return {operation, document, bytes, descriptor: {
    path: PLAN_PATH, bytes: bytes.length, sha256: sha256(bytes),
  }};
}

async function loadPlan() {
  const current = await readJson(
    PLAN_PATH,
    'canvas-resolution-v1-performance-baseline-plan',
  );
  const recomputed = await buildPlan();
  invariant(current.bytes.equals(jsonBytes(recomputed)),
    'v1 performance plan is stale');
  return {...current, document: recomputed};
}

function browserReference(toolchain) {
  return {
    name: 'chromium',
    version: toolchain.chromium.browserVersion,
    executable: toolchain.chromium.executable,
    runtimeBinary: toolchain.chromium.runtimeBinary,
  };
}

function planReference(plan) {
  return {
    path: PLAN_PATH,
    bytes: plan.bytes.length,
    sha256: plan.descriptor.sha256,
    contentSha256: plan.document.contentSha256,
  };
}

async function measureTarget(browser, baseURL, target) {
  const context = await browser.newContext({
    deviceScaleFactor: 2,
    reducedMotion: 'no-preference',
    serviceWorkers: 'block',
    viewport: {width: 1440, height: 900},
  });
  const page = await context.newPage();
  const signals = {consoleErrors: [], pageErrors: [], failedRequests: [], httpErrors: []};
  page.on('console', (message) => {
    if (message.type() === 'error') signals.consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => signals.pageErrors.push(error.message));
  page.on('requestfailed', (request) => signals.failedRequests.push(
    `${request.url()} :: ${request.failure()?.errorText ?? 'unknown'}`));
  page.on('response', (response) => {
    if (response.status() >= 400 && /^https?:/u.test(response.url())) {
      signals.httpErrors.push(`${response.status()} :: ${response.url()}`);
    }
  });
  try {
    await page.route('**/api/learning-events', (route) =>
      route.fulfill({status: 204}));
    const session = await context.newCDPSession(page);
    await session.send('Emulation.setCPUThrottlingRate', {rate: 2});
    const started = performance.now();
    const response = await page.goto(
      `${baseURL}/courses/${target.grade}/${target.lesson}?mode=focus`,
      {waitUntil: 'domcontentloaded', timeout: 120_000},
    );
    invariant(response?.status() === 200,
      `${target.animationId} lesson route did not return 200`);
    await page.waitForFunction(() =>
      document.querySelector('[data-lesson-player]')?.getAttribute('data-hydrated') ===
        'true', null, {timeout: 120_000});
    await page.evaluate(({placementId, animationId}) => {
      const targetButton = [...document.querySelectorAll('button')].find(
        (button) => button.dataset.animationId === animationId &&
          (placementId === null || button.dataset.placementId === placementId),
      );
      if (!targetButton) throw new Error('exact performance placement is missing');
      targetButton.click();
    }, target);
    await page.waitForFunction(({placementId, animationId, ordinal}) => {
      const player = document.querySelector('[data-lesson-player]');
      const canvas = player?.querySelector(
        `canvas[data-course-canvas="${animationId}"]`,
      );
      return player?.getAttribute('data-current-animation-id') === animationId &&
        (placementId === null ||
          player?.getAttribute('data-current-placement-id') === placementId) &&
        player?.getAttribute('data-current-page') === String(ordinal) &&
        canvas instanceof HTMLCanvasElement &&
        canvas.dataset.renderState === 'ready';
    }, target, {timeout: 120_000});
    const v1FirstReadyMs = performance.now() - started;
    const observation = await page.evaluate(({animationId}) => {
      const canvas = document.querySelector(
        `[data-lesson-player] canvas[data-course-canvas="${animationId}"]`,
      );
      if (!(canvas instanceof HTMLCanvasElement)) {
        throw new Error('v1 performance Canvas is missing');
      }
      return {
        width: canvas.width,
        height: canvas.height,
        renderScale: canvas.dataset.renderScale ?? null,
        resolutionStatus: canvas.dataset.resolutionStatus ?? null,
        captureIdentityStatus: canvas.dataset.captureIdentityStatus ?? null,
      };
    }, target);
    invariant(observation.width === 800 && observation.height === 600,
      `${target.animationId} v1 backing dimensions changed`);
    invariant(Object.values(signals).every((rows) => rows.length === 0),
      `${target.animationId} browser signals are not clean: ${JSON.stringify(signals)}`);
    return {v1FirstReadyMs, observation, signals};
  } finally {
    await context.close();
  }
}

async function verifyCheckpoint({plan, target, toolchain, expected = null}) {
  const receipt = await readJson(
    checkpointPath(target.animationId),
    'canvas-resolution-v1-performance-target',
  );
  if (expected !== null) {
    invariant(canonicalJson(receipt.descriptor) === canonicalJson(expected),
      `${target.animationId} checkpoint descriptor changed`);
  }
  const payload = receipt.document.payload;
  invariant(payload.status === 'pass' &&
    canonicalJson(payload.plan) === canonicalJson(planReference(plan)) &&
    canonicalJson(payload.browser) === canonicalJson(browserReference(toolchain)) &&
    canonicalJson(payload.target) === canonicalJson(target) &&
    Number.isFinite(payload.measurement.v1FirstReadyMs) &&
    payload.measurement.v1FirstReadyMs >= 0 &&
    payload.measurement.observation.width === 800 &&
    payload.measurement.observation.height === 600 &&
    Object.values(payload.measurement.signals).every((rows) => rows.length === 0),
  `${target.animationId} checkpoint is invalid`);
  return receipt;
}

async function maybeCheckpoint(options) {
  try {
    return await verifyCheckpoint(options);
  } catch (error) {
    if (error?.code === 'ENOENT') return null;
    throw error;
  }
}

async function executeLesson(lessonId) {
  const plan = await loadPlan();
  const targets = plan.document.payload.targets.filter(
    (target) => target.lessonId === lessonId);
  const shard = plan.document.payload.shards.find(
    (candidate) => candidate.lessonId === lessonId);
  invariant(shard && targets.length === shard.runtimeCount,
    `${lessonId} performance shard changed`);
  const {chromium} = await import('playwright');
  const toolchain = await collectChromiumToolchainIdentity({projectRoot});
  let browser = null;
  const receipts = [];
  try {
    for (const target of targets) {
      let receipt = await maybeCheckpoint({plan, target, toolchain});
      let evidenceSource = 'checkpoint';
      if (receipt === null) {
        if (browser === null) {
          browser = await chromium.launch({
            headless: true,
            executablePath: toolchain.chromium.executable.path,
          });
          invariant(browser.version() === toolchain.chromium.browserVersion,
            'launched Chromium differs from frozen toolchain');
        }
        const measurement = await measureTarget(
          browser,
          plan.document.payload.baseURL,
          target,
        );
        const document = hashBoundDocument(
          'canvas-resolution-v1-performance-target',
          {
            status: 'pass',
            plan: planReference(plan),
            browser: browserReference(toolchain),
            target,
            measurement,
            boundaries: plan.document.payload.boundaries,
          },
        );
        const bytes = jsonBytes(document);
        await writeExclusiveOrSame(checkpointPath(target.animationId), bytes);
        receipt = await verifyCheckpoint({plan, target, toolchain});
        evidenceSource = 'browser';
      }
      receipts.push(receipt);
      process.stdout.write(`${JSON.stringify({
        lessonId,
        animationId: target.animationId,
        v1FirstReadyMs:
          receipt.document.payload.measurement.v1FirstReadyMs,
        evidenceSource,
        completedRuntimeCount: receipts.length,
        totalRuntimeCount: targets.length,
      })}\n`);
    }
  } finally {
    if (browser !== null) await browser.close();
  }
  const payload = {
    status: 'pass',
    lessonId,
    releaseId: shard.releaseId,
    plan: planReference(plan),
    browser: browserReference(toolchain),
    runtimeCount: receipts.length,
    targets: receipts.map((receipt) => ({
      animationId: receipt.document.payload.target.animationId,
      checkpoint: {
        ...receipt.descriptor,
        contentSha256: receipt.document.contentSha256,
      },
    })),
    boundaries: plan.document.payload.boundaries,
  };
  const document = hashBoundDocument(
    'canvas-resolution-v1-performance-shard', payload);
  const bytes = jsonBytes(document);
  const operation = await writeExclusiveOrSame(shard.receiptPath, bytes);
  return {operation, document, bytes, descriptor: {
    path: shard.receiptPath, bytes: bytes.length, sha256: sha256(bytes),
  }};
}

async function verifyLesson(plan, lessonId) {
  const shard = plan.document.payload.shards.find(
    (candidate) => candidate.lessonId === lessonId);
  invariant(shard, `unknown lesson ${lessonId}`);
  const receipt = await readJson(
    shard.receiptPath,
    'canvas-resolution-v1-performance-shard',
  );
  const targets = plan.document.payload.targets.filter(
    (target) => target.lessonId === lessonId);
  const toolchain = await collectChromiumToolchainIdentity({projectRoot});
  invariant(receipt.document.payload.status === 'pass' &&
    canonicalJson(receipt.document.payload.plan) ===
      canonicalJson(planReference(plan)) &&
    canonicalJson(receipt.document.payload.browser) ===
      canonicalJson(browserReference(toolchain)) &&
    receipt.document.payload.targets.length === targets.length,
  `${lessonId} performance shard binding changed`);
  const checkpoints = [];
  for (let index = 0; index < targets.length; index += 1) {
    const member = receipt.document.payload.targets[index];
    const target = targets[index];
    invariant(member.animationId === target.animationId,
      `${lessonId} performance target order changed`);
    const checkpoint = await verifyCheckpoint({
      plan,
      target,
      toolchain,
      expected: {
        path: member.checkpoint.path,
        bytes: member.checkpoint.bytes,
        sha256: member.checkpoint.sha256,
      },
    });
    invariant(member.checkpoint.contentSha256 ===
      checkpoint.document.contentSha256,
    `${target.animationId} checkpoint content hash changed`);
    checkpoints.push(checkpoint);
  }
  return {receipt, checkpoints};
}

async function captureFontPilot() {
  const plan = await loadPlan();
  const target = plan.document.payload.targets.find(
    ({animationId}) => animationId === FONT_ID);
  invariant(target, 'font pilot target is missing');
  const runtime = await stableFile(target.runtimeFile.path);
  invariant(runtime.descriptor.sha256 === target.runtimeFile.sha256,
    'font pilot runtime changed');
  const {chromium} = await import('playwright');
  const toolchain = await collectChromiumToolchainIdentity({projectRoot});
  const browser = await chromium.launch({
    headless: true,
    executablePath: toolchain.chromium.executable.path,
  });
  const context = await browser.newContext({
    deviceScaleFactor: 1,
    serviceWorkers: 'block',
    viewport: {width: 800, height: 600},
  });
  const page = await context.newPage();
  try {
    await page.route('http://canvas-font-baseline.localhost/**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '<canvas id="stage" width="800" height="600"></canvas>',
      }));
    await page.goto('http://canvas-font-baseline.localhost/');
    await page.evaluate(() => {
      const calls = [];
      const native = CanvasRenderingContext2D.prototype.fillText;
      CanvasRenderingContext2D.prototype.fillText = function fillText(
        text, x, y, maxWidth,
      ) {
        const metrics = this.measureText(String(text));
        const transform = this.getTransform();
        calls.push({
          text: String(text), x, y, font: this.font,
          textAlign: this.textAlign, textBaseline: this.textBaseline,
          width: metrics.width,
          actualBoundingBoxAscent: metrics.actualBoundingBoxAscent,
          actualBoundingBoxDescent: metrics.actualBoundingBoxDescent,
          actualBoundingBoxLeft: metrics.actualBoundingBoxLeft,
          actualBoundingBoxRight: metrics.actualBoundingBoxRight,
          transform: {
            a: transform.a, b: transform.b, c: transform.c,
            d: transform.d, e: transform.e, f: transform.f,
          },
        });
        return maxWidth === undefined
          ? native.call(this, text, x, y)
          : native.call(this, text, x, y, maxWidth);
      };
      globalThis.__fontCalls = calls;
    });
    await page.addScriptTag({content: runtime.bytes.toString('utf8')});
    const observation = await page.evaluate(async ({animationId, identity, checks}) => {
      await document.fonts.ready;
      const asset = globalThis.HELP_MATH_CANVAS_ASSETS?.[animationId];
      if (!asset) throw new Error('font pilot runtime registration is missing');
      await asset.ready();
      const canvas = document.querySelector('#stage');
      asset.render(canvas, {
        frame: identity.frame,
        frameDomain: identity.frameDomainId,
        scenario: identity.scenario,
        lang: identity.language,
        seed: Number(identity.seed),
      });
      const timer = globalThis.__fontCalls.filter((call) =>
        call.text === '00:00:00' && call.font.includes('Arial')).at(-1);
      const score = globalThis.__fontCalls.filter((call) =>
        call.text === '0' && call.font.includes('Bauhaus Md BT') &&
        call.font.includes('Arial Rounded MT Bold')).at(-1);
      if (!timer || !score) throw new Error('font pilot calls are incomplete');
      return {
        fontsReady: document.fonts.status === 'loaded',
        fontChecks: checks.map((check) => ({
          ...check,
          ready: document.fonts.check(check.css, check.sample),
        })),
        calls: [timer, score],
      };
    }, {animationId: FONT_ID, identity: FONT_IDENTITY, checks: FONT_CHECKS});
    invariant(observation.fontsReady && observation.calls.length === 2,
      'font pilot baseline is incomplete');
    const payload = {
      status: 'pass',
      plan: planReference(plan),
      browser: browserReference(toolchain),
      animationId: FONT_ID,
      ordinal: target.ordinal,
      identity: FONT_IDENTITY,
      metricTolerancePx: 0.1,
      fontChecks: observation.fontChecks,
      k1FillTextCalls: observation.calls,
      boundaries: plan.document.payload.boundaries,
    };
    const document = hashBoundDocument(
      'canvas-resolution-v1-font-performance-baseline', payload);
    const bytes = jsonBytes(document);
    const operation = await writeExclusiveOrSame(FONT_RECEIPT_PATH, bytes);
    return {operation, document, bytes, descriptor: {
      path: FONT_RECEIPT_PATH, bytes: bytes.length, sha256: sha256(bytes),
    }};
  } finally {
    await context.close();
    await browser.close();
  }
}

async function verifyFont(plan) {
  const receipt = await readJson(
    FONT_RECEIPT_PATH,
    'canvas-resolution-v1-font-performance-baseline',
  );
  const payload = receipt.document.payload;
  invariant(payload.status === 'pass' && payload.animationId === FONT_ID &&
    canonicalJson(payload.plan) === canonicalJson(planReference(plan)) &&
    payload.ordinal === 29 && payload.metricTolerancePx === 0.1 &&
    payload.fontChecks.length === 2 &&
    payload.k1FillTextCalls.length === 2,
  'font performance baseline binding changed');
  return receipt;
}

async function aggregate({check}) {
  const plan = await loadPlan();
  const lessons = [];
  const checkpoints = [];
  for (const {lessonId} of RELEASES) {
    const verified = await verifyLesson(plan, lessonId);
    lessons.push(verified.receipt);
    checkpoints.push(...verified.checkpoints);
  }
  invariant(checkpoints.length === EXPECTED.rendererCount,
    'performance checkpoint denominator changed');
  const font = await verifyFont(plan);
  const renderers = checkpoints.map((receipt) => {
    const {target, measurement} = receipt.document.payload;
    return {
      animationId: target.animationId,
      grade: target.grade,
      lesson: target.lesson,
      ordinal: target.ordinal,
      placementId: target.placementId,
      sourceFps: target.sourceFps,
      v1FirstReadyMs: measurement.v1FirstReadyMs,
    };
  });
  const byId = new Map(renderers.map((row) => [row.animationId, row]));
  const pilots = PILOT_IDS.map((id) => byId.get(id));
  invariant(pilots.every(Boolean), 'performance pilot baseline is incomplete');
  const toolchain = await collectChromiumToolchainIdentity({projectRoot});
  const payload = {
    profile: {
      profileId: 'current-js-production-assets-v1',
      checksumSetSha256: EXPECTED.v1Checksum,
    },
    environment: {
      cpuThrottleRate: 2,
      browserName: 'chromium',
      browserVersion: toolchain.chromium.browserVersion,
      operatingSystem: `${platform()} ${release()} ${arch()}`,
    },
    renderers,
    pilots,
    fontPilot: {
      animationId: font.document.payload.animationId,
      ordinal: font.document.payload.ordinal,
      identity: font.document.payload.identity,
      metricTolerancePx: font.document.payload.metricTolerancePx,
      fontChecks: font.document.payload.fontChecks,
      k1FillTextCalls: font.document.payload.k1FillTextCalls,
    },
    evidence: {
      plan: planReference(plan),
      backingBaseline: plan.document.payload.inputs.backingBaseline,
      shards: lessons.map((receipt) => ({
        ...receipt.descriptor,
        contentSha256: receipt.document.contentSha256,
      })),
      font: {...font.descriptor, contentSha256: font.document.contentSha256},
    },
    boundaries: plan.document.payload.boundaries,
  };
  const document = hashBoundDocument(
    'canvas-resolution-v1-performance-baseline', payload);
  const bytes = jsonBytes(document);
  if (check) {
    const current = await readFile(absolute(FINAL_BASELINE_PATH));
    invariant(current.equals(bytes), `${FINAL_BASELINE_PATH} is missing or stale`);
    return {operation: 'checked', document, bytes, descriptor: {
      path: FINAL_BASELINE_PATH, bytes: bytes.length, sha256: sha256(bytes),
    }};
  }
  const operation = await writeExclusiveOrSame(FINAL_BASELINE_PATH, bytes);
  return {operation, document, bytes, descriptor: {
    path: FINAL_BASELINE_PATH, bytes: bytes.length, sha256: sha256(bytes),
  }};
}

export function parseArguments(argv) {
  let mode = null;
  let lessonId = null;
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (['--plan', '--check-plan', '--execute', '--font', '--aggregate', '--check']
      .includes(value)) {
      invariant(mode === null, 'choose exactly one mode');
      mode = value.slice(2);
    } else if (value === '--lesson') {
      invariant(lessonId === null && argv[index + 1], '--lesson requires a value');
      lessonId = argv[index + 1];
      index += 1;
    } else {
      throw new Error(`unknown argument: ${value}`);
    }
  }
  invariant(mode !== null, 'one explicit mode is required');
  if (mode === 'execute' || (mode === 'check' && lessonId !== null)) {
    invariant(RELEASES.some(({lessonId: id}) => id === lessonId),
      'execute/shard check requires one production-five lesson');
  } else {
    invariant(lessonId === null, '--lesson is only valid for execute/shard check');
  }
  return {mode, lessonId};
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  let result;
  if (options.mode === 'plan') result = await writePlan({check: false});
  else if (options.mode === 'check-plan') result = await writePlan({check: true});
  else if (options.mode === 'execute') result = await executeLesson(options.lessonId);
  else if (options.mode === 'font') result = await captureFontPilot();
  else if (options.mode === 'aggregate') result = await aggregate({check: false});
  else if (options.lessonId !== null) {
    const plan = await loadPlan();
    const verified = await verifyLesson(plan, options.lessonId);
    result = {
      operation: 'checked',
      document: verified.receipt.document,
      bytes: verified.receipt.bytes,
      descriptor: verified.receipt.descriptor,
    };
  } else {
    await writePlan({check: true});
    result = await aggregate({check: true});
  }
  process.stdout.write(`${JSON.stringify({
    status: result.operation,
    ...result.descriptor,
    contentSha256: result.document.contentSha256,
  })}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  main().catch((error) => {
    process.stderr.write(`v1-performance-baseline: ${error.message}\n`);
    process.exitCode = 1;
  });
}
