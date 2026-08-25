#!/usr/bin/env node

import {lstat, mkdir, readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {canonicalJson, sha256} from
  './capture-canvas-resolution-v1-backing-baseline.mjs';

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), '..');
const OUTPUT_PATH =
  'reports/canvas-resolution/verification/adaptive-v10-core-browser-v11/' +
  'real-browser-gate-review.v1.json';
const INPUTS = Object.freeze({
  v10Plan: {
    path: 'work/adaptive-canvas-production-five.plan.v10.json',
    sha256: 'db4b349f5863d3e4b784953aa5342d5499a38311fa268ce9a068f7e7b633d983',
  },
  v10Freeze: {
    path: 'work/adaptive-canvas-real-browser-validation-v10.freeze.v1.json',
    sha256: 'ee63ac0eb41608ea4d0690a3576576ee9d25d4486771343c3947b820d48f3a53',
  },
  provenance: {
    path: 'work/adaptive-canvas-production-five.regeneration-provenance.v1.json',
    sha256: 'd901badb154a562b97f102edb0a1ffd23fee67628254d8235a8814fcaac0ce8a',
  },
  v1BackingPlan: {
    path: 'reports/canvas-resolution/baseline/v1-backing-compact-v3/plan.v1.json',
    sha256: '2470cf02f54171e835aa1aea4c4eb18a7dedab0b64072489479f8aaf3de93ec1',
  },
  v1BackingAggregate: {
    path: 'reports/canvas-resolution/baseline/v1-backing-compact-v3/' +
      'v1-backing-baseline.v1.json',
    sha256: 'a494c1cacefe888745cfd5255317f153a55fb88d8bd42ed488f7073c429743a6',
  },
  v1PerformanceBaseline: {
    path: 'reports/canvas-resolution/performance/v1-baseline.json',
    sha256: '9db1fbd3e89e0a7fd1aa4f3c26eb5528a1297e0d03268d28ee93bd1e0196b07b',
  },
  corePlan: {
    path: 'reports/canvas-resolution/verification/' +
      'adaptive-v10-core-browser-v11/plan.v1.json',
    sha256: 'd3fc756752198183ce7cd1b8cc88cf930c060deca604e5951dd8db2e5e86b76c',
  },
  coreAggregate: {
    path: 'reports/canvas-resolution/verification/' +
      'adaptive-v10-core-browser-v11/aggregate.v1.json',
    sha256: 'a578badc4e5a8030299a5767ea333376487c4d2ddbd17a5271c3d1de09b439db',
  },
  k1Repeatability: {
    path: 'reports/canvas-resolution/verification/' +
      'adaptive-v10-core-browser-v11/k1-repeatability-review.v1.json',
    sha256: '629ee0e2fb815aac8db1196afc4c9df54b9c4c5618f6d12f49800136d3b5ace7',
  },
});

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function absolute(relativePath) {
  const resolved = path.resolve(projectRoot, relativePath);
  invariant(resolved.startsWith(`${projectRoot}${path.sep}`),
    `path escapes project root: ${relativePath}`);
  return resolved;
}

async function exactFile(relativePath) {
  const target = absolute(relativePath);
  const before = await lstat(target);
  invariant(before.isFile() && !before.isSymbolicLink(),
    `${relativePath} must be an ordinary file`);
  const bytes = await readFile(target);
  const after = await lstat(target);
  invariant(before.dev === after.dev && before.ino === after.ino &&
    before.size === after.size && before.mtimeMs === after.mtimeMs,
  `${relativePath} changed while read`);
  return {
    bytes,
    descriptor: {
      path: relativePath,
      bytes: bytes.length,
      sha256: sha256(bytes),
    },
  };
}

function verifyHashBound(document, artifactType) {
  invariant(document?.schemaVersion === 1 &&
    document?.artifactType === artifactType,
  `${artifactType} envelope is invalid`);
  invariant(document.contentSha256 === sha256(Buffer.from(canonicalJson({
    schemaVersion: 1,
    artifactType,
    payload: document.payload,
  }))), `${artifactType} content hash is invalid`);
}

async function exactJson(relativePath, artifactType = null) {
  const binding = await exactFile(relativePath);
  const document = JSON.parse(binding.bytes.toString('utf8'));
  if (artifactType) verifyHashBound(document, artifactType);
  return {...binding, document};
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

function jsonBytes(document) {
  return Buffer.from(`${JSON.stringify(document, null, 2)}\n`);
}

export function summarizePerformanceRows(rows) {
  const lessonIds = ['g03-l02', 'g04-l03', 'g05-l03', 'g05-l04', 'g05-l05'];
  const byLesson = Object.fromEntries(lessonIds.map((lessonId) => [lessonId, {
    runtimeCount: 0,
    singleRendererFailureCount: 0,
    redrawP95FailureCount: 0,
    firstReadyFailureCount: 0,
    longTaskRuntimeCount: 0,
    contextLostCount: 0,
  }]));
  for (const row of rows) {
    invariant(byLesson[row.lessonId], `unknown lesson: ${row.lessonId}`);
    const lesson = byLesson[row.lessonId];
    lesson.runtimeCount += 1;
    if (!row.singleRendererDurationPass) lesson.singleRendererFailureCount += 1;
    if (!row.redrawP95Pass) lesson.redrawP95FailureCount += 1;
    if (!row.firstReadyPass) lesson.firstReadyFailureCount += 1;
    if (row.longTaskCount > 0) lesson.longTaskRuntimeCount += 1;
    lesson.contextLostCount += row.contextLostCount;
  }
  return {runtimeCount: rows.length, byLesson};
}

async function buildDocument() {
  const fixedInputs = {};
  for (const [key, expected] of Object.entries(INPUTS)) {
    const binding = await exactFile(expected.path);
    invariant(binding.descriptor.sha256 === expected.sha256,
      `${key} hash changed`);
    fixedInputs[key] = binding.descriptor;
  }
  const [aggregate, repeatability] = await Promise.all([
    exactJson(INPUTS.coreAggregate.path,
      'adaptive-canvas-v10-core-browser-aggregate'),
    exactJson(INPUTS.k1Repeatability.path,
      'adaptive-canvas-k1-repeatability-review'),
  ]);
  const performanceRows = [];
  const parityRuntimeIds = [];
  for (const row of aggregate.document.payload.runtimes) {
    const receipt = await exactJson(
      row.path,
      'adaptive-canvas-v10-core-browser-runtime',
    );
    const runtime = receipt.document.payload.runtime;
    const state = runtime.stateSummary;
    const performance = runtime.performance;
    if (state.k1ParityFailureCount > 0) {
      parityRuntimeIds.push(runtime.animationId);
    }
    const failed = !performance.singleRendererDurationPass ||
      !performance.redrawP95Pass || !performance.firstReadyPass ||
      performance.longTasksOver250.length > 0 ||
      performance.contextLostCount > 0;
    if (failed) {
      performanceRows.push({
        animationId: runtime.animationId,
        lessonId: runtime.lessonId,
        sourceFps: performance.sourceFps,
        frameBudgetMs: performance.frameBudgetMs,
        firstK2RenderMs: performance.firstK2RenderMs,
        singleRendererDurationPass: performance.singleRendererDurationPass,
        redrawP95Ms: performance.redrawP95Ms,
        redrawP95Pass: performance.redrawP95Pass,
        firstReadyMs: performance.candidateCoreFirstReadyMs,
        firstReadyLimitMs: performance.firstReadyLimitMs,
        firstReadyPass: performance.firstReadyPass,
        longTaskCount: performance.longTasksOver250.length,
        contextLostCount: performance.contextLostCount,
      });
    }
  }
  const repeatabilityIds = repeatability.document.payload.records
    .map(({animationId}) => animationId).sort();
  invariant(canonicalJson(parityRuntimeIds.sort()) ===
    canonicalJson(repeatabilityIds),
  'repeatability review does not cover the exact core parity set');
  const repeatSummary = repeatability.document.payload.summary;
  invariant(repeatability.document.payload.status === 'pass' &&
    repeatability.document.payload.applyAuthorization === false &&
    repeatSummary.runtimeCount === 5 && repeatSummary.stateCount === 4696 &&
    repeatSummary.frozenBaselineMismatchCount === 0 &&
    repeatSummary.directCandidateMismatchCount === 0 &&
    repeatSummary.directRenderStateMismatchCount === 0,
  'k1 repeatability review did not resolve every core parity anomaly');
  const performanceSummary = summarizePerformanceRows(performanceRows);
  invariant(performanceSummary.runtimeCount === 52,
    'performance failure denominator changed');
  const coreSummary = aggregate.document.payload.summary;
  invariant(coreSummary.runtimeCount === 284 &&
    coreSummary.pageRendererCount === 283 &&
    coreSummary.loadedHostCount === 1 &&
    coreSummary.placementCount === 284 &&
    coreSummary.stateCount === 102400 &&
    coreSummary.fidelityFailureCount === 0 &&
    coreSummary.renderStateFailureCount === 0,
  'core aggregate denominator or pixel result changed');
  const self = await exactFile(
    'scripts/build-adaptive-canvas-real-browser-gate-review.mjs',
  );
  const test = await exactFile(
    'scripts/build-adaptive-canvas-real-browser-gate-review.test.mjs',
  );
  return hashBoundDocument('adaptive-canvas-real-browser-gate-review', {
    status: 'no-go',
    applyAuthorization: false,
    officialChromiumApplyProofStatus: 'withheld-no-go',
    inputs: {
      ...fixedInputs,
      builder: self.descriptor,
      builderTest: test.descriptor,
    },
    browser: aggregate.document.payload.browser,
    denominator: {
      runtimeCount: 284,
      pageRendererCount: 283,
      loadedHostCount: 1,
      placementCount: 284,
      stateCount: 102400,
      uniquePixelComparisonCount: coreSummary.uniquePixelComparisonCount,
    },
    pixelGates: {
      status: 'pass',
      k1ParityFailureCount: 0,
      k1ParityResolution: {
        coreOrchestrationAnomalyCount: coreSummary.k1ParityFailureCount,
        affectedRuntimeCount: parityRuntimeIds.length,
        independentlyRepeatedStateCount: repeatSummary.stateCount,
        frozenBaselineMismatchCount:
          repeatSummary.frozenBaselineMismatchCount,
        directCandidateMismatchCount:
          repeatSummary.directCandidateMismatchCount,
        directRenderStateMismatchCount:
          repeatSummary.directRenderStateMismatchCount,
        resolution:
          'core-three-realm-capture-anomalies-superseded-by-exact-two-realm-k1-ab',
      },
      k2FidelityFailureCount: coreSummary.fidelityFailureCount,
      renderStateFailureCount: coreSummary.renderStateFailureCount,
      maximumNormalizedRgbRmse: coreSummary.maximumNormalizedRgbRmse,
      staticNormalizedRgbRmseLimit: 0.05,
      transitionNormalizedRgbRmseLimit: 0.08,
    },
    performanceGate: {
      status: 'no-go',
      ...performanceSummary,
      maximumRedrawP95Ms: coreSummary.maximumRedrawP95Ms,
      records: performanceRows,
    },
    blockers: [{
      code: 'ADAPTIVE_K2_PERFORMANCE_GATE_FAILED',
      runtimeCount: performanceSummary.runtimeCount,
      disposition:
        'optimize-or-recalibrate-without-changing-approved-thresholds-then-rerun-full-gate',
    }],
    deferredBecauseNoGo: [
      'official-fresh-chromium-apply-proof',
      'adaptive-batch-apply',
      'v2-profile-and-active-binding',
      'full-product-browser-matrix',
      'owner-visual-acceptance',
      'exact-preview-deployment',
      'production-promotion-and-24h-observation',
    ],
    boundaries: {
      v1BackingBaselineCaptured: true,
      v1PerformanceBaselineCaptured: true,
      fullCandidateRuntimeStateCaptureCompleted: true,
      fullCandidatePerformanceGateCompleted: true,
      officialChromiumApplyProofWritten: false,
      adaptiveBatchApplyRun: false,
      productionRendererWritten: false,
      v2ProfileWritten: false,
      activeBindingWritten: false,
      deploymentRun: false,
      ownerVisualAcceptance: false,
      releaseEligibilityChanged: false,
    },
  });
}

async function writeOrCheck(check) {
  const document = await buildDocument();
  const bytes = jsonBytes(document);
  const target = absolute(OUTPUT_PATH);
  if (check) {
    const current = await readFile(target);
    invariant(current.equals(bytes), 'real-browser gate review is missing or stale');
    return {operation: 'checked', document, bytes};
  }
  await mkdir(path.dirname(target), {recursive: true});
  await writeFile(target, bytes, {flag: 'wx', mode: 0o444});
  return {operation: 'created', document, bytes};
}

async function main() {
  const mode = process.argv[2];
  invariant((mode === '--build' || mode === '--check') &&
    process.argv.length === 3,
  'usage: build-adaptive-canvas-real-browser-gate-review.mjs --build|--check');
  const result = await writeOrCheck(mode === '--check');
  process.stdout.write(`${JSON.stringify({
    status: result.document.payload.status,
    operation: result.operation,
    path: OUTPUT_PATH,
    bytes: result.bytes.length,
    sha256: sha256(result.bytes),
    contentSha256: result.document.contentSha256,
    pixelGateStatus: result.document.payload.pixelGates.status,
    performanceGateStatus: result.document.payload.performanceGate.status,
    performanceFailureRuntimeCount:
      result.document.payload.performanceGate.runtimeCount,
    applyAuthorization: result.document.payload.applyAuthorization,
  })}\n`);
  process.exitCode = 2;
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  main().catch((error) => {
    process.stderr.write(`adaptive-real-browser-gate-review: ${error.message}\n`);
    process.exitCode = 1;
  });
}
