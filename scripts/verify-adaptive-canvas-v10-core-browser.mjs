#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {lstat, mkdir, open, readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {
  collectChromiumToolchainIdentity,
  transformAdaptiveRuntime,
} from './generate-adaptive-canvas-batch.mjs';
import {
  buildPlan as buildV1BackingPlan,
  canonicalJson,
  expandRuntimeStates,
  sha256,
} from './capture-canvas-resolution-v1-backing-baseline.mjs';

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), '..');

export const OUTPUT_ROOT =
  'reports/canvas-resolution/verification/adaptive-v10-core-browser-v11';
export const PLAN_PATH = `${OUTPUT_ROOT}/plan.v1.json`;
export const AGGREGATE_PATH = `${OUTPUT_ROOT}/aggregate.v1.json`;

const V10_PLAN_PATH = 'work/adaptive-canvas-production-five.plan.v10.json';
const V10_FREEZE_PATH =
  'work/adaptive-canvas-real-browser-validation-v10.freeze.v1.json';
const PROVENANCE_PATH =
  'work/adaptive-canvas-production-five.regeneration-provenance.v1.json';
const V1_PROFILE_PATH =
  'apps/web/config/current-js-production-assets.v1.json';
const V1_BACKING_PLAN_PATH =
  'reports/canvas-resolution/baseline/v1-backing-compact-v3/plan.v1.json';
const V1_BACKING_AGGREGATE_PATH =
  'reports/canvas-resolution/baseline/v1-backing-compact-v3/' +
  'v1-backing-baseline.v1.json';
const V1_BACKING_RECEIPT_ROOT =
  'reports/canvas-resolution/baseline/v1-backing-compact-v3/' +
  'runtime-receipts';
const V1_PERFORMANCE_PATH =
  'reports/canvas-resolution/performance/v1-baseline.json';
const BATCH_GENERATOR_PATH = 'scripts/generate-adaptive-canvas-batch.mjs';
const LEGACY_V8_ROOT =
  'reports/canvas-resolution/verification/adaptive-v10-core-browser-v8';
const LEGACY_V8_PLAN_PATH = `${LEGACY_V8_ROOT}/plan.v1.json`;
const TOOL_PATH = 'scripts/verify-adaptive-canvas-v10-core-browser.mjs';
const TOOL_TEST_PATH =
  'scripts/verify-adaptive-canvas-v10-core-browser.test.mjs';

const LESSONS = Object.freeze([
  'g03-l02',
  'g04-l03',
  'g05-l03',
  'g05-l04',
  'g05-l05',
]);
const SHA256 = /^[a-f0-9]{64}$/u;
const CHUNK_STATE_COUNT = 4;
const REDRAW_SAMPLE_COUNT = 12;
const STATIC_RMSE_LIMIT = 0.05;
const TRANSITION_RMSE_LIMIT = 0.08;
const EXPECTED = Object.freeze({
  v10PlanSha256:
    'db4b349f5863d3e4b784953aa5342d5499a38311fa268ce9a068f7e7b633d983',
  freezeSha256:
    'ee63ac0eb41608ea4d0690a3576576ee9d25d4486771343c3947b820d48f3a53',
  provenanceSha256:
    'd901badb154a562b97f102edb0a1ffd23fee67628254d8235a8814fcaac0ce8a',
  v1ProfileSha256:
    'ccd832025b2df2c69615872645944b5bcfab18628d4d69df71ea0341925f9eca',
  v1BackingPlanSha256:
    '2470cf02f54171e835aa1aea4c4eb18a7dedab0b64072489479f8aaf3de93ec1',
  v1BackingAggregateSha256:
    'a494c1cacefe888745cfd5255317f153a55fb88d8bd42ed488f7073c429743a6',
  v1PerformanceSha256:
    '9db1fbd3e89e0a7fd1aa4f3c26eb5528a1297e0d03268d28ee93bd1e0196b07b',
  batchGeneratorSha256:
    '496692ac8a2ba0a6a0cda91cf31ba4432c531682180e3d0e8e667e7336af4c5e',
  legacyV8PlanSha256:
    'df6cf246c37c2fbcaebc38afc2defda85b52cf9b81e11543b91ab84eab196dda',
  runtimeCount: 284,
  pageRendererCount: 283,
  loadedHostCount: 1,
  placementCount: 284,
  stateCount: 102400,
});

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [
      key,
      canonicalize(value[key]),
    ]));
  }
  return value;
}

function hashBoundDocument(artifactType, payload) {
  const envelope = {schemaVersion: 1, artifactType, payload};
  return {
    schemaVersion: 1,
    artifactType,
    contentSha256: sha256(Buffer.from(canonicalJson(envelope))),
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
      descriptor: {
        path: relativePath,
        bytes: bytes.length,
        sha256: sha256(bytes),
      },
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
    invariant(current.equals(bytes),
      `${relativePath} already exists with different bytes`);
    return 'existing-identical';
  }
  await mkdir(path.dirname(target), {recursive: true});
  await writeFile(target, bytes, {flag: 'wx', mode});
  return 'created';
}

function descriptor(binding) {
  return binding.descriptor;
}

function runtimeReceiptPath(animationId) {
  return `${OUTPUT_ROOT}/runtime-receipts/${animationId}.v1.json`;
}

function k1PngPath(animationId) {
  return `${OUTPUT_ROOT}/representative/${animationId}.k1.png`;
}

function k2PngPath(animationId) {
  return `${OUTPUT_ROOT}/representative/${animationId}.k2.png`;
}

function shardPath(lessonId) {
  return `${OUTPUT_ROOT}/shards/${lessonId}.v1.json`;
}

function v1ReceiptPath(animationId) {
  return `${V1_BACKING_RECEIPT_ROOT}/${animationId}.v1.json`;
}

export function percentile95(values) {
  invariant(Array.isArray(values) && values.length > 0 &&
    values.every((value) => Number.isFinite(value) && value >= 0),
  'p95 values must be non-empty finite non-negative numbers');
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.ceil(sorted.length * 0.95) - 1];
}

export function rmseLimit(thresholdClass) {
  invariant(thresholdClass === 'static' || thresholdClass === 'transition',
    `unsupported threshold class: ${thresholdClass}`);
  return thresholdClass === 'static'
    ? STATIC_RMSE_LIMIT
    : TRANSITION_RMSE_LIMIT;
}

export function captureBackingDimensions(renderScale) {
  invariant(renderScale === 1 || renderScale === 2,
    `unsupported capture render scale: ${String(renderScale)}`);
  return {
    width: 800 * renderScale,
    height: 600 * renderScale,
  };
}

export function summarizeStateRows(rows) {
  invariant(Array.isArray(rows) && rows.length > 0,
    'state rows must be non-empty');
  let k1ParityFailureCount = 0;
  let fidelityFailureCount = 0;
  let renderStateFailureCount = 0;
  let maximumNormalizedRgbRmse = 0;
  let maximumK2RenderDurationMs = 0;
  const comparisonKeys = new Set();
  for (const row of rows) {
    invariant(typeof row?.stateId === 'string' && row.stateId.length > 0 &&
      SHA256.test(row?.expectedK1RgbaSha256 || '') &&
      SHA256.test(row?.adaptiveK1RgbaSha256 || '') &&
      SHA256.test(row?.adaptiveK2RgbaSha256 || '') &&
      SHA256.test(row?.downsampledK2RgbaSha256 || '') &&
      Number.isFinite(row?.normalizedRgbRmse) &&
      row.normalizedRgbRmse >= 0 && row.normalizedRgbRmse <= 1 &&
      Number.isFinite(row?.k2RenderDurationMs) &&
      row.k2RenderDurationMs >= 0,
    `invalid state row: ${row?.stateId ?? 'unknown'}`);
    if (!row.k1Parity) k1ParityFailureCount += 1;
    if (!row.fidelityPass) fidelityFailureCount += 1;
    if (!row.renderStateParity) renderStateFailureCount += 1;
    maximumNormalizedRgbRmse = Math.max(
      maximumNormalizedRgbRmse,
      row.normalizedRgbRmse,
    );
    maximumK2RenderDurationMs = Math.max(
      maximumK2RenderDurationMs,
      row.k2RenderDurationMs,
    );
    comparisonKeys.add(
      `${row.adaptiveK1RgbaSha256}:${row.adaptiveK2RgbaSha256}`,
    );
  }
  return {
    stateCount: rows.length,
    uniquePixelComparisonCount: comparisonKeys.size,
    k1ParityFailureCount,
    fidelityFailureCount,
    renderStateFailureCount,
    maximumNormalizedRgbRmse,
    maximumK2RenderDurationMs,
  };
}

function verifyFixedFile(binding, expectedSha256, label) {
  invariant(binding.descriptor.sha256 === expectedSha256,
    `${label} hash changed: ${binding.descriptor.sha256}`);
}

function lessonFromRuntime(runtime) {
  const match = /^course-g(\d{2})-l(\d{2})-/u.exec(
    runtime.metadataAnimationId,
  );
  invariant(match, `${runtime.animationId} lesson identity is invalid`);
  return `g${match[1]}-l${match[2]}`;
}

function v1PlanReference(binding) {
  return {
    path: V1_BACKING_PLAN_PATH,
    bytes: binding.bytes.length,
    sha256: binding.descriptor.sha256,
    contentSha256: binding.document.contentSha256,
  };
}

async function buildPlanPayload() {
  const [
    v10,
    freeze,
    provenance,
    v1Profile,
    currentV1BackingPlan,
    v1BackingAggregate,
    v1Performance,
    batchGenerator,
    legacyV8Plan,
    tool,
    toolTest,
  ] = await Promise.all([
    readJson(V10_PLAN_PATH),
    readJson(V10_FREEZE_PATH),
    readJson(PROVENANCE_PATH),
    readJson(V1_PROFILE_PATH),
    readJson(
      V1_BACKING_PLAN_PATH,
      'canvas-resolution-v1-backing-compact-plan',
    ),
    readJson(
      V1_BACKING_AGGREGATE_PATH,
      'canvas-resolution-v1-backing-compact-baseline',
    ),
    readJson(
      V1_PERFORMANCE_PATH,
      'canvas-resolution-v1-performance-baseline',
    ),
    stableFile(BATCH_GENERATOR_PATH),
    readJson(LEGACY_V8_PLAN_PATH, 'adaptive-canvas-v10-core-browser-plan'),
    stableFile(TOOL_PATH),
    stableFile(TOOL_TEST_PATH),
  ]);
  verifyFixedFile(v10, EXPECTED.v10PlanSha256, 'v10 plan');
  verifyFixedFile(freeze, EXPECTED.freezeSha256, 'v10 freeze');
  verifyFixedFile(provenance, EXPECTED.provenanceSha256, 'Gate 0A provenance');
  verifyFixedFile(v1Profile, EXPECTED.v1ProfileSha256, 'v1 profile');
  verifyFixedFile(
    currentV1BackingPlan,
    EXPECTED.v1BackingPlanSha256,
    'v1 backing plan',
  );
  verifyFixedFile(
    v1BackingAggregate,
    EXPECTED.v1BackingAggregateSha256,
    'v1 backing aggregate',
  );
  verifyFixedFile(
    v1Performance,
    EXPECTED.v1PerformanceSha256,
    'v1 performance baseline',
  );
  verifyFixedFile(
    batchGenerator,
    EXPECTED.batchGeneratorSha256,
    'batch generator',
  );
  verifyFixedFile(
    legacyV8Plan,
    EXPECTED.legacyV8PlanSha256,
    'legacy v8 candidate browser plan',
  );
  const recomputedV1BackingPlan = await buildV1BackingPlan();
  invariant(jsonBytes(recomputedV1BackingPlan).equals(currentV1BackingPlan.bytes),
    'v1 backing plan no longer recomputes from frozen inputs');
  invariant(v10.document?.payload?.status === 'pass' &&
    Array.isArray(v10.document.payload.runtimes) &&
    v10.document.payload.runtimes.length === EXPECTED.runtimeCount,
  'v10 plan runtime set is incomplete');
  invariant(provenance.document?.payload?.status === 'pass' &&
    provenance.document.payload.records?.length === EXPECTED.runtimeCount,
  'Gate 0A provenance is not a 284-record pass');
  const v10ById = new Map(v10.document.payload.runtimes.map((runtime) => [
    runtime.animationId,
    runtime,
  ]));
  const performanceById = new Map(
    v1Performance.document.payload.renderers.map((row) => [
      row.animationId,
      row,
    ]),
  );
  invariant(performanceById.size === EXPECTED.pageRendererCount,
    'v1 performance renderer denominator changed');
  const planned = currentV1BackingPlan.document.payload.runtimes.map((runtime) => {
    const candidate = v10ById.get(runtime.registryAnimationId);
    invariant(candidate &&
      candidate.metadataAnimationId === runtime.metadataAnimationId &&
      candidate.pageRenderer === runtime.pageRenderer &&
      candidate.input.bytes === runtime.runtimeFile.bytes &&
      candidate.input.sha256 === runtime.runtimeFile.sha256 &&
      candidate.assetPath === runtime.profileEntry.assetPath,
    `${runtime.animationId} v1/v10 identity differs`);
    const performance = performanceById.get(runtime.registryAnimationId) ?? null;
    invariant(runtime.pageRenderer ? performance !== null : performance === null,
      `${runtime.animationId} performance denominator differs`);
    return {
      animationId: runtime.registryAnimationId,
      metadataAnimationId: runtime.metadataAnimationId,
      pageRenderer: runtime.pageRenderer,
      lessonId: runtime.lessonShard,
      releaseId: runtime.releaseId,
      runtimeFile: runtime.runtimeFile,
      profileEntry: runtime.profileEntry,
      v10Runtime: candidate,
      v1BackingReceiptPath: v1ReceiptPath(runtime.animationId),
      requirementCount: runtime.requirements.length,
      stateCount: runtime.stateCount,
      sourceFps: performance?.sourceFps ?? 12,
      v1FirstReadyMs: performance?.v1FirstReadyMs ?? null,
      requirements: runtime.requirements,
    };
  });
  invariant(planned.length === EXPECTED.runtimeCount &&
    planned.filter(({pageRenderer}) => pageRenderer).length ===
      EXPECTED.pageRendererCount &&
    planned.filter(({pageRenderer}) => !pageRenderer).length ===
      EXPECTED.loadedHostCount &&
    planned.reduce((sum, runtime) => sum + runtime.stateCount, 0) ===
      EXPECTED.stateCount,
  'candidate browser runtime/state denominator changed');
  invariant(new Set(planned.map(({animationId}) => animationId)).size ===
    EXPECTED.runtimeCount,
  'candidate browser runtime identities are duplicated');
  return {
    status: 'pass',
    operation: 'plan',
    inputs: {
      v10Plan: descriptor(v10),
      v10Freeze: descriptor(freeze),
      regenerationProvenance: descriptor(provenance),
      v1Profile: descriptor(v1Profile),
      v1BackingPlan: v1PlanReference(currentV1BackingPlan),
      v1BackingAggregate: descriptor(v1BackingAggregate),
      v1PerformanceBaseline: descriptor(v1Performance),
      batchGenerator: descriptor(batchGenerator),
      legacyV8PlanAuditOnly: descriptor(legacyV8Plan),
      tool: descriptor(tool),
      toolTest: descriptor(toolTest),
    },
    contract: {
      browser: 'chromium',
      captureCpuThrottleRatesAccepted: [1, 2],
      preferredCaptureCpuThrottleRate: 1,
      performanceCpuThrottleRate: 2,
      scales: [1, 2],
      nativeBacking: {width: 800, height: 600},
      retinaBacking: {width: 1600, height: 1200},
      k1Parity: 'exact-rgba-and-render-state-sha256',
      captureMethodVersion: 11,
      resetExactBackingBeforeEveryState: true,
      legacyEvidenceAdoptionAllowed: false,
      k2Fidelity:
        'rgba8-srgb-premultiplied-alpha-box-2x-v1 versus adaptive-k1',
      staticNormalizedRgbRmseLimit: STATIC_RMSE_LIMIT,
      transitionNormalizedRgbRmseLimit: TRANSITION_RMSE_LIMIT,
      redrawSampleCount: REDRAW_SAMPLE_COUNT,
      redrawP95Limit: '1000/sourceFPS',
      singleRendererDurationLimitMs: 250,
      firstReadyLimit:
        'v1-product-first-ready + max(250ms, v1-product-first-ready*0.20)',
    },
    summary: {
      runtimeCount: planned.length,
      pageRendererCount: planned.filter(({pageRenderer}) => pageRenderer).length,
      loadedHostCount: planned.filter(({pageRenderer}) => !pageRenderer).length,
      placementCount: EXPECTED.placementCount,
      stateCount: planned.reduce((sum, runtime) => sum + runtime.stateCount, 0),
    },
    shards: LESSONS.map((lessonId) => ({
      lessonId,
      runtimeCount: planned.filter((runtime) => runtime.lessonId === lessonId)
        .length,
      stateCount: planned.filter((runtime) => runtime.lessonId === lessonId)
        .reduce((sum, runtime) => sum + runtime.stateCount, 0),
    })),
    runtimes: planned,
    boundaries: {
      candidateBytesMaterializedInMemoryOnly: true,
      productionRendererWritten: false,
      v2ProfileWritten: false,
      activeBindingWritten: false,
      adaptiveBatchApplyRun: false,
      deploymentRun: false,
      productHostPerformanceDeferredUntilActiveCandidate: true,
      browserMatrixDeferredUntilActiveCandidate: true,
      ownerVisualAcceptance: false,
      releaseEligibilityChanged: false,
    },
  };
}

export async function buildPlan() {
  return hashBoundDocument(
    'adaptive-canvas-v10-core-browser-plan',
    await buildPlanPayload(),
  );
}

async function writeOrCheckPlan(check) {
  const document = await buildPlan();
  const bytes = jsonBytes(document);
  if (check) {
    const current = await readFile(absolute(PLAN_PATH));
    invariant(current.equals(bytes), `${PLAN_PATH} is missing or stale`);
    return {operation: 'checked', document, bytes};
  }
  const operation = await writeExclusiveOrSame(PLAN_PATH, bytes);
  return {operation, document, bytes};
}

async function loadExactPlan() {
  const current = await readJson(
    PLAN_PATH,
    'adaptive-canvas-v10-core-browser-plan',
  );
  const recomputed = await buildPlan();
  invariant(current.bytes.equals(jsonBytes(recomputed)),
    'adaptive v10 browser plan is stale');
  return {...current, document: recomputed};
}

function planReference(plan) {
  return {
    path: PLAN_PATH,
    bytes: plan.bytes.length,
    sha256: plan.descriptor.sha256,
    contentSha256: plan.document.contentSha256,
  };
}

function browserReference(toolchain) {
  return {
    name: 'chromium',
    version: toolchain.chromium.browserVersion,
    executable: toolchain.chromium.executable,
    runtimeBinary: toolchain.chromium.runtimeBinary,
  };
}

async function loadV1Checkpoint(runtime) {
  const binding = await readJson(
    runtime.v1BackingReceiptPath,
    'canvas-resolution-v1-backing-compact-runtime',
  );
  const record = binding.document.payload.runtime;
  invariant(record.animationId === runtime.animationId &&
    record.stateCount === runtime.stateCount &&
    record.states.length === runtime.stateCount &&
    record.runtimeFile.sha256 === runtime.runtimeFile.sha256,
  `${runtime.animationId} v1 backing receipt identity differs`);
  return binding;
}

function transformedRuntime(runtime, inputBytes) {
  const transformed = transformAdaptiveRuntime({
    inputBytes,
    profileEntry: runtime.profileEntry,
    animationId: runtime.metadataAnimationId,
    metadataAnimationId: runtime.metadataAnimationId,
    registryAnimationId: runtime.animationId,
    pageRenderer: runtime.pageRenderer,
  });
  invariant(canonicalJson(transformed.record) ===
    canonicalJson(runtime.v10Runtime),
  `${runtime.animationId} in-memory candidate differs from v10`);
  return transformed.outputBytes;
}

async function captureRuntimeInBrowser({
  browser,
  runtime,
  candidateBytes,
  expectedRows,
}) {
  const context = await browser.newContext({
    deviceScaleFactor: 2,
    reducedMotion: 'no-preference',
    serviceWorkers: 'block',
    viewport: {width: 800, height: 600},
  });
  const page = await context.newPage();
  page.setDefaultTimeout(120_000);
  const session = await context.newCDPSession(page);
  await session.send('Emulation.setCPUThrottlingRate', {rate: 2});
  const signals = {
    consoleErrors: [],
    pageErrors: [],
    failedRequests: [],
    httpErrors: [],
  };
  page.on('console', (message) => {
    if (message.type() === 'error') signals.consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => signals.pageErrors.push(error.message));
  page.on('requestfailed', (request) => signals.failedRequests.push(
    `${request.url()} :: ${request.failure()?.errorText ?? 'unknown'}`,
  ));
  page.on('response', (response) => {
    if (response.status() >= 400) {
      signals.httpErrors.push(`${response.status()} :: ${response.url()}`);
    }
  });
  try {
    await page.route('http://adaptive-v10.localhost/**', (route) => {
      const pathname = new URL(route.request().url()).pathname;
      if (pathname === '/candidate.js') {
        return route.fulfill({
          status: 200,
          contentType: 'text/javascript; charset=utf-8',
          body: candidateBytes,
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: pathname === '/'
          ? '<iframe id="realm-k1" src="/realm-k1"></iframe>' +
            '<iframe id="realm-k2" src="/realm-k2"></iframe>' +
            '<iframe id="realm-perf" src="/realm-perf"></iframe>'
          : pathname === '/realm-k1'
            ? '<canvas id="stage" width="800" height="600"></canvas>'
            : '<canvas id="stage" width="1600" height="1200"></canvas>',
      });
    });
    await page.goto('http://adaptive-v10.localhost/');
    invariant(await page.evaluate(() => globalThis.isSecureContext === true &&
      typeof globalThis.crypto?.subtle?.digest === 'function'),
    `${runtime.animationId} candidate origin lacks WebCrypto`);
    const states = expandRuntimeStates(runtime);
    invariant(states.length === expectedRows.length,
      `${runtime.animationId} state denominator differs`);
    const k1Frame = page.frames().find((frame) =>
      frame.url().endsWith('/realm-k1'));
    const k2Frame = page.frames().find((frame) =>
      frame.url().endsWith('/realm-k2'));
    const perfFrame = page.frames().find((frame) =>
      frame.url().endsWith('/realm-perf'));
    invariant(k1Frame && k2Frame && perfFrame,
      `${runtime.animationId} isolated scale realms are missing`);
    const scriptLoadMs = await perfFrame.evaluate(async () => {
      const started = performance.now();
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = '/candidate.js?realm=perf';
        script.onload = resolve;
        script.onerror = () => reject(new Error('performance candidate script failed'));
        document.head.append(script);
      });
      return performance.now() - started;
    });
    const firstReady = await perfFrame.evaluate(async ({animationId, request}) => {
      const asset = globalThis.HELP_MATH_CANVAS_ASSETS?.[animationId];
      if (!asset) throw new Error(`missing performance registry asset ${animationId}`);
      const readyStarted = performance.now();
      await asset.ready();
      const readyMs = performance.now() - readyStarted;
      const canvas = document.querySelector('#stage');
      const renderStarted = performance.now();
      asset.render(canvas, {...request, renderScale: 2});
      return {
        readyMs,
        renderMs: performance.now() - renderStarted,
        metadata: JSON.parse(JSON.stringify(asset.metadata)),
      };
    }, {animationId: runtime.animationId, request: states[0].request});
    invariant(firstReady.metadata?.resolution?.mode === 'adaptive-integer' &&
      firstReady.metadata.resolution.nativeWidth === 800 &&
      firstReady.metadata.resolution.nativeHeight === 600 &&
      canonicalJson(firstReady.metadata.resolution.supportedRenderScales) ===
        canonicalJson([1, 2]),
    `${runtime.animationId} adaptive metadata differs`);
    await session.send('Emulation.setCPUThrottlingRate', {rate: 1});
    await Promise.all([k1Frame, k2Frame].map((frame, index) =>
      frame.evaluate(async (scaleIndex) => {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = `/candidate.js?realm=capture-${scaleIndex}`;
        script.onload = resolve;
        script.onerror = () => reject(new Error('capture candidate script failed'));
        document.head.append(script);
      });
      }, index + 1)));
    await page.evaluate(async ({animationId}) => {
      const realm1 = document.querySelector('#realm-k1').contentWindow;
      const realm2 = document.querySelector('#realm-k2').contentWindow;
      const asset1 = realm1.HELP_MATH_CANVAS_ASSETS?.[animationId];
      const asset2 = realm2.HELP_MATH_CANVAS_ASSETS?.[animationId];
      if (!asset1 || !asset2) {
        throw new Error(`missing isolated registry asset ${animationId}`);
      }
      await Promise.all([asset1.ready(), asset2.ready()]);
    }, {animationId: runtime.animationId});
    const firstReadyLimitMs = runtime.v1FirstReadyMs === null
      ? null
      : runtime.v1FirstReadyMs + Math.max(
        250,
        runtime.v1FirstReadyMs * 0.2,
      );
    const rows = [];
    let representative = null;
    const captureBackings = {
      k1: captureBackingDimensions(1),
      k2: captureBackingDimensions(2),
    };
    for (let offset = 0; offset < states.length; offset += CHUNK_STATE_COUNT) {
      const requests = states.slice(offset, offset + CHUNK_STATE_COUNT);
      const expected = expectedRows.slice(offset, offset + CHUNK_STATE_COUNT)
        .map((row) => ({
          stateId: row.stateId,
          rgbaSha256: row.rgbaSha256,
          renderStateSha256: row.renderStateSha256,
        }));
      const result = await page.evaluate(async ({
        animationId,
        requests: stateRequests,
        expected: expectedStates,
        retainRepresentative,
        captureBackings: exactBackings,
      }) => {
        const realm1 = document.querySelector('#realm-k1').contentWindow;
        const realm2 = document.querySelector('#realm-k2').contentWindow;
        const asset1 = realm1.HELP_MATH_CANVAS_ASSETS?.[animationId];
        const asset2 = realm2.HELP_MATH_CANVAS_ASSETS?.[animationId];
        if (!asset1 || !asset2) {
          throw new Error(`missing isolated registry asset ${animationId}`);
        }
        await Promise.all([asset1.ready(), asset2.ready()]);
        const canvas1 = realm1.document.querySelector('#stage');
        const canvas2 = realm2.document.querySelector('#stage');
        const digest = async (bytes) => {
          const value = await crypto.subtle.digest('SHA-256', bytes);
          return [...new Uint8Array(value)].map((byte) =>
            byte.toString(16).padStart(2, '0')).join('');
        };
        const canonicalizeValue = (value) => {
          if (Array.isArray(value)) return value.map(canonicalizeValue);
          if (value && typeof value === 'object') {
            return Object.fromEntries(Object.keys(value).sort().map((key) => [
              key,
              canonicalizeValue(value[key]),
            ]));
          }
          return value;
        };
        const comparisonCache = globalThis.__adaptiveComparisonCache ??=
          new Map();
        const output = [];
        let retained = null;
        for (let index = 0; index < stateRequests.length; index += 1) {
          const item = stateRequests[index];
          const baseline = expectedStates[index];
          if (item.stateId !== baseline.stateId) {
            throw new Error('state identity ordering changed');
          }
          canvas1.width = exactBackings.k1.width;
          canvas1.height = exactBackings.k1.height;
          const k1Started = performance.now();
          const state1 = asset1.render(
            canvas1,
            {...item.request, renderScale: 1},
          );
          const k1RenderDurationMs = performance.now() - k1Started;
          const context1 = canvas1.getContext('2d');
          if (!context1) throw new Error('k1 2D context allocation failed');
          const rgba1 = context1.getImageData(0, 0, 800, 600).data;
          const k1Sha256 = await digest(rgba1);
          const state1Sha256 = await digest(new TextEncoder().encode(
            JSON.stringify(canonicalizeValue(JSON.parse(JSON.stringify(state1)))),
          ));
          const k1DataUrl = retainRepresentative && index === 0
            ? canvas1.toDataURL('image/png')
            : null;
          canvas2.width = exactBackings.k2.width;
          canvas2.height = exactBackings.k2.height;
          const started = performance.now();
          const state2 = asset2.render(
            canvas2,
            {...item.request, renderScale: 2},
          );
          const k2RenderDurationMs = performance.now() - started;
          const context2 = canvas2.getContext('2d');
          if (!context2) throw new Error('k2 2D context allocation failed');
          const rgba2 = context2.getImageData(0, 0, 1600, 1200).data;
          const k2Sha256 = await digest(rgba2);
          const state2Sha256 = await digest(new TextEncoder().encode(
            JSON.stringify(canonicalizeValue(JSON.parse(JSON.stringify(state2)))),
          ));
          const cacheKey = `${k1Sha256}:${k2Sha256}`;
          let comparison = comparisonCache.get(cacheKey);
          if (!comparison) {
            const downsampled = new Uint8ClampedArray(800 * 600 * 4);
            let squaredError = 0;
            for (let y = 0; y < 600; y += 1) {
              for (let x = 0; x < 800; x += 1) {
                const offsets = [
                  ((y * 2) * 1600 + x * 2) * 4,
                  ((y * 2) * 1600 + x * 2 + 1) * 4,
                  (((y * 2) + 1) * 1600 + x * 2) * 4,
                  (((y * 2) + 1) * 1600 + x * 2 + 1) * 4,
                ];
                let alphaSum = 0;
                let redSum = 0;
                let greenSum = 0;
                let blueSum = 0;
                for (const sourceOffset of offsets) {
                  const alpha = rgba2[sourceOffset + 3];
                  alphaSum += alpha;
                  redSum += rgba2[sourceOffset] * alpha;
                  greenSum += rgba2[sourceOffset + 1] * alpha;
                  blueSum += rgba2[sourceOffset + 2] * alpha;
                }
                const targetOffset = (y * 800 + x) * 4;
                if (alphaSum === 0) {
                  downsampled[targetOffset] = 0;
                  downsampled[targetOffset + 1] = 0;
                  downsampled[targetOffset + 2] = 0;
                } else {
                  const halfAlpha = Math.floor(alphaSum / 2);
                  downsampled[targetOffset] = Math.floor(
                    (redSum + halfAlpha) / alphaSum,
                  );
                  downsampled[targetOffset + 1] = Math.floor(
                    (greenSum + halfAlpha) / alphaSum,
                  );
                  downsampled[targetOffset + 2] = Math.floor(
                    (blueSum + halfAlpha) / alphaSum,
                  );
                }
                downsampled[targetOffset + 3] = Math.floor(
                  (alphaSum + 2) / 4,
                );
                for (let channel = 0; channel < 3; channel += 1) {
                  const delta = rgba1[targetOffset + channel] -
                    downsampled[targetOffset + channel];
                  squaredError += delta * delta;
                }
              }
            }
            comparison = {
              downsampledSha256: await digest(downsampled),
              normalizedRgbRmse:
                Math.sqrt(squaredError / (800 * 600 * 3)) / 255,
            };
            comparisonCache.set(cacheKey, comparison);
          }
          const k2DataUrl = retainRepresentative && index === 0
            ? canvas2.toDataURL('image/png')
            : null;
          output.push({
            stateId: item.stateId,
            expectedK1RgbaSha256: baseline.rgbaSha256,
            expectedRenderStateSha256: baseline.renderStateSha256,
            adaptiveK1RgbaSha256: k1Sha256,
            adaptiveK2RgbaSha256: k2Sha256,
            downsampledK2RgbaSha256: comparison.downsampledSha256,
            adaptiveK1RenderStateSha256: state1Sha256,
            adaptiveK2RenderStateSha256: state2Sha256,
            normalizedRgbRmse: comparison.normalizedRgbRmse,
            k1RenderDurationMs,
            k2RenderDurationMs,
          });
          if (retainRepresentative && index === 0) {
            retained = {
              stateId: item.stateId,
              k1DataUrl,
              k2DataUrl,
            };
          }
        }
        return {rows: output, representative: retained};
      }, {
        animationId: runtime.animationId,
        requests,
        expected,
        retainRepresentative: offset === 0,
        captureBackings,
      });
      rows.push(...result.rows);
      if (result.representative) representative = result.representative;
    }
    await session.send('Emulation.setCPUThrottlingRate', {rate: 2});
    const benchmark = await page.evaluate(async ({animationId, request}) => {
      const realm = document.querySelector('#realm-perf').contentWindow;
      const asset = realm.HELP_MATH_CANVAS_ASSETS?.[animationId];
      const canvas = realm.document.querySelector('#stage');
      let contextLostCount = 0;
      canvas.addEventListener('contextlost', () => {
        contextLostCount += 1;
      });
      const longTasks = [];
      const observer = typeof PerformanceObserver === 'function'
        ? new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) longTasks.push(entry.duration);
        })
        : null;
      try {
        observer?.observe({entryTypes: ['longtask']});
      } catch {
        // Chromium always supports Long Tasks here. A missing observer is
        // represented explicitly below rather than treated as a pass.
      }
      const durations = [];
      for (let index = 0; index < 12; index += 1) {
        await new Promise((resolve) => requestAnimationFrame(resolve));
        const started = performance.now();
        asset.render(canvas, {...request, renderScale: 2});
        durations.push(performance.now() - started);
      }
      await new Promise((resolve) => setTimeout(resolve, 0));
      observer?.disconnect();
      return {
        durations,
        contextLostCount,
        longTasksOver250: longTasks.filter((duration) => duration > 250),
        longTaskObserverAvailable: observer !== null,
        backingWidth: canvas.width,
        backingHeight: canvas.height,
      };
    }, {animationId: runtime.animationId, request: states[0].request});
    invariant(representative && rows.length === states.length,
      `${runtime.animationId} candidate capture is incomplete`);
    const boundRows = rows.map((row, index) => {
      const state = states[index];
      invariant(row.stateId === state.stateId,
        `${runtime.animationId} candidate state order changed`);
      const limit = rmseLimit(state.thresholdClass);
      return {
        stateId: row.stateId,
        identity: state.identity,
        thresholdClass: state.thresholdClass,
        expectedK1RgbaSha256: row.expectedK1RgbaSha256,
        adaptiveK1RgbaSha256: row.adaptiveK1RgbaSha256,
        adaptiveK2RgbaSha256: row.adaptiveK2RgbaSha256,
        downsampledK2RgbaSha256: row.downsampledK2RgbaSha256,
        expectedRenderStateSha256: row.expectedRenderStateSha256,
        adaptiveK1RenderStateSha256: row.adaptiveK1RenderStateSha256,
        adaptiveK2RenderStateSha256: row.adaptiveK2RenderStateSha256,
        normalizedRgbRmse: row.normalizedRgbRmse,
        normalizedRgbRmseLimit: limit,
        k1RenderDurationMs: row.k1RenderDurationMs,
        k2RenderDurationMs: row.k2RenderDurationMs,
        k1Parity:
          row.expectedK1RgbaSha256 === row.adaptiveK1RgbaSha256,
        renderStateParity:
          row.expectedRenderStateSha256 ===
            row.adaptiveK1RenderStateSha256 &&
          row.adaptiveK1RenderStateSha256 ===
            row.adaptiveK2RenderStateSha256,
        fidelityPass: row.normalizedRgbRmse <= limit,
      };
    });
    const k1Png = Buffer.from(
      representative.k1DataUrl.slice('data:image/png;base64,'.length),
      'base64',
    );
    const k2Png = Buffer.from(
      representative.k2DataUrl.slice('data:image/png;base64,'.length),
      'base64',
    );
    const stateSummary = summarizeStateRows(boundRows);
    const candidateFirstReadyMs = scriptLoadMs + firstReady.readyMs +
      firstReady.renderMs;
    const redrawP95Ms = percentile95(benchmark.durations);
    const frameBudgetMs = 1000 / runtime.sourceFps;
    const performance = {
      sourceFps: runtime.sourceFps,
      frameBudgetMs,
      redrawSampleCount: benchmark.durations.length,
      redrawDurationsMs: benchmark.durations,
      redrawP95Ms,
      redrawP95Pass: redrawP95Ms <= frameBudgetMs,
      maximumStateK2RenderDurationMs:
        stateSummary.maximumK2RenderDurationMs,
      stateCaptureCpuThrottleRate: 1,
      singleRendererDurationLimitMs: 250,
      singleRendererDurationPass:
        firstReady.renderMs <= 250 &&
        Math.max(...benchmark.durations) <= 250,
      longTaskObserverAvailable: benchmark.longTaskObserverAvailable,
      longTasksOver250: benchmark.longTasksOver250,
      contextLostCount: benchmark.contextLostCount,
      backingWidth: benchmark.backingWidth,
      backingHeight: benchmark.backingHeight,
      scriptLoadMs,
      assetReadyMs: firstReady.readyMs,
      firstK2RenderMs: firstReady.renderMs,
      candidateCoreFirstReadyMs: candidateFirstReadyMs,
      v1ProductFirstReadyMs: runtime.v1FirstReadyMs,
      firstReadyLimitMs,
      firstReadyPass: firstReadyLimitMs === null ||
        candidateFirstReadyMs <= firstReadyLimitMs,
    };
    return {
      rows: boundRows,
      stateSummary,
      performance,
      representative: {
        stateId: representative.stateId,
        k1: {
          path: k1PngPath(runtime.animationId),
          bytes: k1Png.length,
          sha256: sha256(k1Png),
          bytesValue: k1Png,
        },
        k2: {
          path: k2PngPath(runtime.animationId),
          bytes: k2Png.length,
          sha256: sha256(k2Png),
          bytesValue: k2Png,
        },
      },
      signals,
    };
  } finally {
    await context.close();
  }
}

function runtimeStatus(capture) {
  const state = capture.stateSummary;
  const performance = capture.performance;
  return state.k1ParityFailureCount === 0 &&
    state.fidelityFailureCount === 0 &&
    state.renderStateFailureCount === 0 &&
    performance.redrawP95Pass &&
    performance.singleRendererDurationPass &&
    performance.firstReadyPass &&
    performance.longTaskObserverAvailable &&
    performance.longTasksOver250.length === 0 &&
    performance.contextLostCount === 0 &&
    performance.backingWidth === 1600 &&
    performance.backingHeight === 1200 &&
    Object.values(capture.signals).every((values) => values.length === 0)
    ? 'pass'
    : 'no-go';
}

async function writeRuntimeReceipt({plan, runtime, toolchain, capture}) {
  await writeExclusiveOrSame(
    capture.representative.k1.path,
    capture.representative.k1.bytesValue,
  );
  await writeExclusiveOrSame(
    capture.representative.k2.path,
    capture.representative.k2.bytesValue,
  );
  const representative = {
    stateId: capture.representative.stateId,
    k1: {
      path: capture.representative.k1.path,
      bytes: capture.representative.k1.bytes,
      sha256: capture.representative.k1.sha256,
    },
    k2: {
      path: capture.representative.k2.path,
      bytes: capture.representative.k2.bytes,
      sha256: capture.representative.k2.sha256,
    },
  };
  const document = hashBoundDocument(
    'adaptive-canvas-v10-core-browser-runtime',
    {
      status: runtimeStatus(capture),
      plan: planReference(plan),
      browser: browserReference(toolchain),
      runtime: {
        animationId: runtime.animationId,
        metadataAnimationId: runtime.metadataAnimationId,
        pageRenderer: runtime.pageRenderer,
        lessonId: runtime.lessonId,
        releaseId: runtime.releaseId,
        input: runtime.v10Runtime.input,
        output: runtime.v10Runtime.output,
        v1BackingReceiptPath: runtime.v1BackingReceiptPath,
        stateSummary: capture.stateSummary,
        performance: capture.performance,
        representative,
        states: capture.rows,
        signals: capture.signals,
      },
      boundaries: plan.document.payload.boundaries,
    },
  );
  const bytes = jsonBytes(document);
  await writeExclusiveOrSame(runtimeReceiptPath(runtime.animationId), bytes);
  return readJson(
    runtimeReceiptPath(runtime.animationId),
    'adaptive-canvas-v10-core-browser-runtime',
  );
}

async function verifyRuntimeReceipt({plan, runtime, toolchain}) {
  const receipt = await readJson(
    runtimeReceiptPath(runtime.animationId),
    'adaptive-canvas-v10-core-browser-runtime',
  );
  const payload = receipt.document.payload;
  invariant(canonicalJson(payload.plan) === canonicalJson(planReference(plan)) &&
    canonicalJson(payload.browser) === canonicalJson(browserReference(toolchain)) &&
    payload.runtime.animationId === runtime.animationId &&
    payload.runtime.metadataAnimationId === runtime.metadataAnimationId &&
    payload.runtime.pageRenderer === runtime.pageRenderer &&
    payload.runtime.lessonId === runtime.lessonId &&
    canonicalJson(payload.runtime.input) ===
      canonicalJson(runtime.v10Runtime.input) &&
    canonicalJson(payload.runtime.output) ===
      canonicalJson(runtime.v10Runtime.output) &&
    payload.runtime.states.length === runtime.stateCount,
  `${runtime.animationId} candidate receipt binding differs`);
  const summary = summarizeStateRows(payload.runtime.states);
  invariant(canonicalJson(summary) ===
    canonicalJson(payload.runtime.stateSummary),
  `${runtime.animationId} candidate state summary differs`);
  for (const scale of ['k1', 'k2']) {
    const artifact = payload.runtime.representative[scale];
    const file = await stableFile(artifact.path);
    invariant(file.bytes.length === artifact.bytes &&
      file.descriptor.sha256 === artifact.sha256,
    `${runtime.animationId} ${scale} representative differs`);
  }
  invariant(payload.status === runtimeStatus({
    stateSummary: summary,
    performance: payload.runtime.performance,
    signals: payload.runtime.signals,
  }), `${runtime.animationId} candidate status differs`);
  return receipt;
}

async function maybeRuntimeReceipt(options) {
  try {
    return await verifyRuntimeReceipt(options);
  } catch (error) {
    if (error?.code === 'ENOENT') return null;
    throw error;
  }
}

async function executeLesson(lessonId) {
  const plan = await loadExactPlan();
  const runtimes = plan.document.payload.runtimes.filter((runtime) =>
    runtime.lessonId === lessonId);
  invariant(runtimes.length > 0, `unknown lesson: ${lessonId}`);
  const {chromium} = await import('playwright');
  const toolchain = await collectChromiumToolchainIdentity({projectRoot});
  invariant(chromium.executablePath() === toolchain.chromium.executable.path,
    'Playwright Chromium executable differs from frozen toolchain');
  let browser = null;
  const checkpoints = [];
  try {
    for (const runtime of runtimes) {
      let receipt = await maybeRuntimeReceipt({plan, runtime, toolchain});
      let evidenceSource = 'checkpoint';
      if (receipt === null) {
        if (browser === null) {
          browser = await chromium.launch({
            headless: true,
            executablePath: toolchain.chromium.executable.path,
          });
          invariant(browser.version() === toolchain.chromium.browserVersion,
            'launched Chromium differs from frozen browser manifest');
        }
        const [runtimeFile, v1Checkpoint] = await Promise.all([
          stableFile(runtime.runtimeFile.path),
          loadV1Checkpoint(runtime),
        ]);
        invariant(runtimeFile.bytes.length === runtime.runtimeFile.bytes &&
          runtimeFile.descriptor.sha256 === runtime.runtimeFile.sha256,
        `${runtime.animationId} v1 runtime changed`);
        const candidateBytes = transformedRuntime(runtime, runtimeFile.bytes);
        const capture = await captureRuntimeInBrowser({
          browser,
          runtime,
          candidateBytes,
          expectedRows: v1Checkpoint.document.payload.runtime.states,
        });
        receipt = await writeRuntimeReceipt({
          plan,
          runtime,
          toolchain,
          capture,
        });
        evidenceSource = 'browser';
      }
      checkpoints.push(receipt);
      process.stdout.write(`${JSON.stringify({
        lessonId,
        animationId: runtime.animationId,
        stateCount: runtime.stateCount,
        status: receipt.document.payload.status,
        evidenceSource,
        completedRuntimeCount: checkpoints.length,
        totalRuntimeCount: runtimes.length,
      })}\n`);
    }
  } finally {
    await browser?.close();
  }
  const references = checkpoints.map((receipt) => ({
    animationId: receipt.document.payload.runtime.animationId,
    status: receipt.document.payload.status,
    path: receipt.descriptor.path,
    bytes: receipt.bytes.length,
    sha256: receipt.descriptor.sha256,
    contentSha256: receipt.document.contentSha256,
  }));
  const document = hashBoundDocument(
    'adaptive-canvas-v10-core-browser-shard',
    {
      status: references.every(({status}) => status === 'pass')
        ? 'pass'
        : 'no-go',
      lessonId,
      plan: planReference(plan),
      browser: browserReference(toolchain),
      runtimeCount: references.length,
      stateCount: runtimes.reduce((sum, runtime) => sum + runtime.stateCount, 0),
      runtimes: references,
      boundaries: plan.document.payload.boundaries,
    },
  );
  const bytes = jsonBytes(document);
  const operation = await writeExclusiveOrSame(shardPath(lessonId), bytes);
  return {
    operation,
    path: shardPath(lessonId),
    bytes: bytes.length,
    sha256: sha256(bytes),
    contentSha256: document.contentSha256,
    status: document.payload.status,
  };
}

async function verifyShard({plan, lessonId, toolchain}) {
  const binding = await readJson(
    shardPath(lessonId),
    'adaptive-canvas-v10-core-browser-shard',
  );
  const runtimes = plan.document.payload.runtimes.filter((runtime) =>
    runtime.lessonId === lessonId);
  const receipts = [];
  for (const runtime of runtimes) {
    receipts.push(await verifyRuntimeReceipt({plan, runtime, toolchain}));
  }
  const payload = binding.document.payload;
  invariant(payload.lessonId === lessonId &&
    payload.runtimeCount === runtimes.length &&
    payload.stateCount === runtimes.reduce(
      (sum, runtime) => sum + runtime.stateCount,
      0,
    ) &&
    canonicalJson(payload.plan) === canonicalJson(planReference(plan)) &&
    canonicalJson(payload.browser) === canonicalJson(browserReference(toolchain)) &&
    payload.runtimes.length === receipts.length,
  `${lessonId} candidate shard binding differs`);
  const statuses = receipts.map((receipt) => receipt.document.payload.status);
  invariant(payload.status === (statuses.every((status) => status === 'pass')
    ? 'pass'
    : 'no-go'), `${lessonId} candidate shard status differs`);
  return {binding, receipts};
}

async function aggregate() {
  const plan = await loadExactPlan();
  const toolchain = await collectChromiumToolchainIdentity({projectRoot});
  const shardResults = [];
  const runtimeReceipts = [];
  for (const lessonId of LESSONS) {
    const verified = await verifyShard({plan, lessonId, toolchain});
    shardResults.push(verified.binding);
    runtimeReceipts.push(...verified.receipts);
  }
  invariant(runtimeReceipts.length === EXPECTED.runtimeCount,
    'candidate aggregate runtime denominator changed');
  const payloads = runtimeReceipts.map((receipt) => receipt.document.payload);
  const summary = {
    runtimeCount: payloads.length,
    pageRendererCount: payloads.filter((payload) =>
      payload.runtime.pageRenderer).length,
    loadedHostCount: payloads.filter((payload) =>
      !payload.runtime.pageRenderer).length,
    placementCount: EXPECTED.placementCount,
    stateCount: payloads.reduce((sum, payload) =>
      sum + payload.runtime.stateSummary.stateCount, 0),
    uniquePixelComparisonCount: payloads.reduce((sum, payload) =>
      sum + payload.runtime.stateSummary.uniquePixelComparisonCount, 0),
    k1ParityFailureCount: payloads.reduce((sum, payload) =>
      sum + payload.runtime.stateSummary.k1ParityFailureCount, 0),
    fidelityFailureCount: payloads.reduce((sum, payload) =>
      sum + payload.runtime.stateSummary.fidelityFailureCount, 0),
    renderStateFailureCount: payloads.reduce((sum, payload) =>
      sum + payload.runtime.stateSummary.renderStateFailureCount, 0),
    runtimeNoGoCount: payloads.filter((payload) =>
      payload.status !== 'pass').length,
    performanceFailureCount: payloads.filter((payload) => {
      const performance = payload.runtime.performance;
      return !performance.redrawP95Pass ||
        !performance.singleRendererDurationPass ||
        !performance.firstReadyPass ||
        !performance.longTaskObserverAvailable ||
        performance.longTasksOver250.length > 0 ||
        performance.contextLostCount > 0 ||
        performance.backingWidth !== 1600 ||
        performance.backingHeight !== 1200;
    }).length,
    maximumNormalizedRgbRmse: Math.max(...payloads.map((payload) =>
      payload.runtime.stateSummary.maximumNormalizedRgbRmse)),
    maximumK2RenderDurationMs: Math.max(...payloads.map((payload) =>
      payload.runtime.stateSummary.maximumK2RenderDurationMs)),
    maximumRedrawP95Ms: Math.max(...payloads.map((payload) =>
      payload.runtime.performance.redrawP95Ms)),
  };
  invariant(summary.runtimeCount === EXPECTED.runtimeCount &&
    summary.pageRendererCount === EXPECTED.pageRendererCount &&
    summary.loadedHostCount === EXPECTED.loadedHostCount &&
    summary.stateCount === EXPECTED.stateCount,
  'candidate aggregate summary denominator changed');
  const pass = summary.k1ParityFailureCount === 0 &&
    summary.fidelityFailureCount === 0 &&
    summary.renderStateFailureCount === 0 &&
    summary.runtimeNoGoCount === 0 &&
    summary.performanceFailureCount === 0;
  const document = hashBoundDocument(
    'adaptive-canvas-v10-core-browser-aggregate',
    {
      status: pass ? 'pass' : 'no-go',
      plan: planReference(plan),
      browser: browserReference(toolchain),
      summary,
      shards: shardResults.map((binding) => ({
        lessonId: binding.document.payload.lessonId,
        status: binding.document.payload.status,
        path: binding.descriptor.path,
        bytes: binding.bytes.length,
        sha256: binding.descriptor.sha256,
        contentSha256: binding.document.contentSha256,
      })),
      runtimes: runtimeReceipts.map((receipt) => ({
        animationId: receipt.document.payload.runtime.animationId,
        status: receipt.document.payload.status,
        path: receipt.descriptor.path,
        bytes: receipt.bytes.length,
        sha256: receipt.descriptor.sha256,
        contentSha256: receipt.document.contentSha256,
      })),
      boundaries: plan.document.payload.boundaries,
    },
  );
  const bytes = jsonBytes(document);
  const operation = await writeExclusiveOrSame(AGGREGATE_PATH, bytes);
  return {
    operation,
    path: AGGREGATE_PATH,
    bytes: bytes.length,
    sha256: sha256(bytes),
    contentSha256: document.contentSha256,
    status: document.payload.status,
    summary,
  };
}

async function check({lessonId = null} = {}) {
  const plan = await loadExactPlan();
  const toolchain = await collectChromiumToolchainIdentity({projectRoot});
  if (lessonId !== null) {
    const verified = await verifyShard({plan, lessonId, toolchain});
    return {
      status: 'checked',
      path: verified.binding.descriptor.path,
      bytes: verified.binding.bytes.length,
      sha256: verified.binding.descriptor.sha256,
      contentSha256: verified.binding.document.contentSha256,
      gateStatus: verified.binding.document.payload.status,
    };
  }
  const recomputed = await aggregate();
  invariant(recomputed.operation === 'existing-identical',
    'candidate aggregate changed during check');
  return {...recomputed, operation: 'checked'};
}

export function parseArguments(argv) {
  let mode = null;
  let lessonId = null;
  for (let index = 0; index < argv.length; index += 1) {
    const option = argv[index];
    if (['--plan', '--check-plan', '--execute', '--aggregate', '--check']
      .includes(option)) {
      invariant(mode === null, 'choose exactly one mode');
      mode = option.slice(2);
    } else if (option === '--lesson') {
      invariant(lessonId === null && argv[index + 1],
        '--lesson requires a value');
      lessonId = argv[++index];
    } else {
      throw new Error(`unknown option: ${option}`);
    }
  }
  invariant(mode !== null, 'one explicit mode is required');
  if (mode === 'execute' || (mode === 'check' && lessonId !== null)) {
    invariant(LESSONS.includes(lessonId),
      `--lesson must be one of ${LESSONS.join(', ')}`);
  } else {
    invariant(lessonId === null,
      '--lesson is only valid for execute/shard check');
  }
  return {mode, lessonId};
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  let result;
  if (options.mode === 'plan') {
    result = await writeOrCheckPlan(false);
  } else if (options.mode === 'check-plan') {
    result = await writeOrCheckPlan(true);
  } else if (options.mode === 'execute') {
    result = await executeLesson(options.lessonId);
  } else if (options.mode === 'aggregate') {
    result = await aggregate();
  } else {
    result = await check({lessonId: options.lessonId});
  }
  const printable = {
    status: result.status ?? result.operation,
    operation: result.operation,
    path: result.path ?? (options.mode.includes('plan') ? PLAN_PATH : undefined),
    bytes: result.bytes?.length ?? result.bytes,
    sha256: result.bytes && Buffer.isBuffer(result.bytes)
      ? sha256(result.bytes)
      : result.sha256,
    contentSha256: result.document?.contentSha256 ?? result.contentSha256,
    gateStatus: result.gateStatus,
    summary: result.summary,
  };
  process.stdout.write(`${JSON.stringify(printable)}\n`);
  if (result.status === 'no-go' || result.gateStatus === 'no-go') {
    process.exitCode = 2;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  main().catch((error) => {
    process.stderr.write(`adaptive-v10-core-browser: ${error.message}\n`);
    process.exitCode = 1;
  });
}
