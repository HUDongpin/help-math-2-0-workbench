#!/usr/bin/env node

import {lstat, mkdir, readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {
  collectChromiumToolchainIdentity,
  loadFixedV1Profile,
  transformAdaptiveRuntime,
} from './generate-adaptive-canvas-batch.mjs';
import {
  canonicalJson,
  expandRuntimeStates,
  sha256,
} from './capture-canvas-resolution-v1-backing-baseline.mjs';

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), '..');
const AGGREGATE_PATH =
  'reports/canvas-resolution/verification/adaptive-v10-core-browser-v11/' +
  'aggregate.v1.json';
const OUTPUT_PATH =
  'reports/canvas-resolution/verification/adaptive-v10-core-browser-v11/' +
  'k1-repeatability-review.v1.json';
const TOOL_PATH = 'scripts/verify-adaptive-canvas-k1-repeatability.mjs';
const TEST_PATH = 'scripts/verify-adaptive-canvas-k1-repeatability.test.mjs';
const V1_RECEIPT_ROOT =
  'reports/canvas-resolution/baseline/v1-backing-compact-v3/' +
  'runtime-receipts';
const EXPECTED_AGGREGATE_SHA256 =
  'a578badc4e5a8030299a5767ea333376487c4d2ddbd17a5271c3d1de09b439db';
const EXPECTED_PARITY_RUNTIME_IDS = Object.freeze([
  'course-g05-l03-in-002',
  'course-g05-l05-gs-002',
  'course-g05-l05-rw-002',
  'course-g05-l05-rw-003',
  'course-g05-l05-rw-004',
]);

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

function verifyHashBoundDocument(document, artifactType) {
  invariant(document?.schemaVersion === 1 &&
    document?.artifactType === artifactType &&
    typeof document?.contentSha256 === 'string',
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
  if (artifactType) verifyHashBoundDocument(document, artifactType);
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

export function summarizeK1RepeatabilityRows(rows) {
  invariant(Array.isArray(rows) && rows.length > 0,
    'repeatability rows must be non-empty');
  let frozenBaselineMismatchCount = 0;
  let directCandidateMismatchCount = 0;
  let directRenderStateMismatchCount = 0;
  for (const row of rows) {
    invariant(typeof row?.stateId === 'string' &&
      typeof row?.expectedK1RgbaSha256 === 'string' &&
      typeof row?.freshV1RgbaSha256 === 'string' &&
      typeof row?.candidateK1RgbaSha256 === 'string',
    `invalid repeatability row: ${row?.stateId ?? 'unknown'}`);
    if (row.freshV1RgbaSha256 !== row.expectedK1RgbaSha256) {
      frozenBaselineMismatchCount += 1;
    }
    if (row.candidateK1RgbaSha256 !== row.freshV1RgbaSha256) {
      directCandidateMismatchCount += 1;
    }
    if (row.candidateRenderStateSha256 !== row.freshV1RenderStateSha256) {
      directRenderStateMismatchCount += 1;
    }
  }
  return {
    stateCount: rows.length,
    frozenBaselineMismatchCount,
    directCandidateMismatchCount,
    directRenderStateMismatchCount,
  };
}

async function captureRuntime({browser, animationId, states, expectedRows,
  originalBytes, candidateBytes}) {
  const context = await browser.newContext({
    deviceScaleFactor: 1,
    reducedMotion: 'no-preference',
    serviceWorkers: 'block',
    viewport: {width: 800, height: 600},
  });
  const page = await context.newPage();
  page.setDefaultTimeout(120_000);
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
    await page.route('http://adaptive-k1-repeatability.localhost/**', (route) => {
      const pathname = new URL(route.request().url()).pathname;
      if (pathname === '/original.js') {
        return route.fulfill({status: 200,
          contentType: 'text/javascript; charset=utf-8', body: originalBytes});
      }
      if (pathname === '/candidate.js') {
        return route.fulfill({status: 200,
          contentType: 'text/javascript; charset=utf-8', body: candidateBytes});
      }
      const script = pathname === '/realm-original'
        ? '/original.js'
        : '/candidate.js';
      return route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: pathname === '/'
          ? '<iframe id="original" src="/realm-original"></iframe>' +
            '<iframe id="candidate" src="/realm-candidate"></iframe>'
          : `<canvas id="stage" width="800" height="600"></canvas>` +
            `<script src="${script}"></script>`,
      });
    });
    await page.goto('http://adaptive-k1-repeatability.localhost/');
    const frames = page.frames();
    const originalFrame = frames.find((frame) =>
      frame.url().endsWith('/realm-original'));
    const candidateFrame = frames.find((frame) =>
      frame.url().endsWith('/realm-candidate'));
    invariant(originalFrame && candidateFrame,
      `${animationId} isolated A/B realms are missing`);
    await Promise.all([originalFrame, candidateFrame].map((frame) =>
      frame.evaluate(async (id) => {
        const asset = globalThis.HELP_MATH_CANVAS_ASSETS?.[id];
        if (!asset) throw new Error(`missing registry asset ${id}`);
        await asset.ready();
      }, animationId)));
    const rows = [];
    for (let offset = 0; offset < states.length; offset += 4) {
      const requests = states.slice(offset, offset + 4);
      const expected = expectedRows.slice(offset, offset + 4).map((row) => ({
        stateId: row.stateId,
        rgbaSha256: row.rgbaSha256,
      }));
      const result = await page.evaluate(async ({animationId: id,
        requests: chunk, expected: frozen}) => {
        const originalRealm = document.querySelector('#original').contentWindow;
        const candidateRealm = document.querySelector('#candidate').contentWindow;
        const original = originalRealm.HELP_MATH_CANVAS_ASSETS[id];
        const candidate = candidateRealm.HELP_MATH_CANVAS_ASSETS[id];
        const originalCanvas = originalRealm.document.querySelector('#stage');
        const candidateCanvas = candidateRealm.document.querySelector('#stage');
        const digest = async (bytes) => {
          const value = await crypto.subtle.digest('SHA-256', bytes);
          return [...new Uint8Array(value)].map((byte) =>
            byte.toString(16).padStart(2, '0')).join('');
        };
        const canonicalize = (value) => {
          if (Array.isArray(value)) return value.map(canonicalize);
          if (value && typeof value === 'object') {
            return Object.fromEntries(Object.keys(value).sort().map((key) => [
              key,
              canonicalize(value[key]),
            ]));
          }
          return value;
        };
        const output = [];
        for (let index = 0; index < chunk.length; index += 1) {
          const item = chunk[index];
          if (item.stateId !== frozen[index].stateId) {
            throw new Error('state identity ordering changed');
          }
          originalCanvas.width = 800;
          originalCanvas.height = 600;
          candidateCanvas.width = 800;
          candidateCanvas.height = 600;
          const originalState = original.render(originalCanvas, item.request);
          const candidateState = candidate.render(candidateCanvas,
            {...item.request, renderScale: 1});
          const originalRgba = originalCanvas.getContext('2d')
            .getImageData(0, 0, 800, 600).data;
          const candidateRgba = candidateCanvas.getContext('2d')
            .getImageData(0, 0, 800, 600).data;
          const originalStateBytes = new TextEncoder().encode(JSON.stringify(
            canonicalize(JSON.parse(JSON.stringify(originalState))),
          ));
          const candidateStateBytes = new TextEncoder().encode(JSON.stringify(
            canonicalize(JSON.parse(JSON.stringify(candidateState))),
          ));
          output.push({
            stateId: item.stateId,
            expectedK1RgbaSha256: frozen[index].rgbaSha256,
            freshV1RgbaSha256: await digest(originalRgba),
            candidateK1RgbaSha256: await digest(candidateRgba),
            freshV1RenderStateSha256: await digest(originalStateBytes),
            candidateRenderStateSha256: await digest(candidateStateBytes),
          });
        }
        return output;
      }, {animationId, requests, expected});
      rows.push(...result);
    }
    invariant(Object.values(signals).every((values) => values.length === 0),
      `${animationId} emitted browser errors`);
    return {rows, signals};
  } finally {
    await context.close();
  }
}

async function capture() {
  const [aggregate, tool, test] = await Promise.all([
    exactJson(AGGREGATE_PATH, 'adaptive-canvas-v10-core-browser-aggregate'),
    exactFile(TOOL_PATH),
    exactFile(TEST_PATH),
  ]);
  invariant(aggregate.descriptor.sha256 === EXPECTED_AGGREGATE_SHA256,
    'v11 aggregate hash changed');
  const parityReceipts = [];
  for (const row of aggregate.document.payload.runtimes) {
    const receipt = await exactJson(
      row.path,
      'adaptive-canvas-v10-core-browser-runtime',
    );
    if (receipt.document.payload.runtime.stateSummary.k1ParityFailureCount > 0) {
      parityReceipts.push(receipt);
    }
  }
  const ids = parityReceipts.map((binding) =>
    binding.document.payload.runtime.animationId).sort();
  invariant(canonicalJson(ids) === canonicalJson([...EXPECTED_PARITY_RUNTIME_IDS]),
    'parity runtime set changed');
  const loadedProfile = await loadFixedV1Profile(projectRoot);
  const toolchain = await collectChromiumToolchainIdentity({projectRoot});
  const {chromium} = await import('playwright');
  invariant(chromium.executablePath() === toolchain.chromium.executable.path,
    'Playwright Chromium executable differs from frozen toolchain');
  const browser = await chromium.launch({
    headless: true,
    executablePath: toolchain.chromium.executable.path,
  });
  invariant(browser.version() === toolchain.chromium.browserVersion,
    'launched Chromium version differs from frozen toolchain');
  const records = [];
  try {
    for (const receipt of parityReceipts) {
      const runtime = receipt.document.payload.runtime;
      const entry = loadedProfile.pageRenderers.find(({animationId}) =>
        animationId === runtime.animationId);
      invariant(entry, `${runtime.animationId} profile entry is missing`);
      const original = await exactFile(
        `apps/web/public/flash-assets/courses/${entry.relativePath}`,
      );
      invariant(original.bytes.length === runtime.input.bytes &&
        original.descriptor.sha256 === runtime.input.sha256,
      `${runtime.animationId} v1 runtime differs`);
      const generated = transformAdaptiveRuntime({
        inputBytes: original.bytes,
        profileEntry: entry,
        animationId: runtime.animationId,
        metadataAnimationId: runtime.metadataAnimationId,
        registryAnimationId: runtime.animationId,
        pageRenderer: true,
      });
      invariant(generated.outputBytes.length === runtime.output.bytes &&
        generated.record.output.sha256 === runtime.output.sha256,
      `${runtime.animationId} candidate differs`);
      const baseline = await exactJson(
        `${V1_RECEIPT_ROOT}/${runtime.animationId}.v1.json`,
        'canvas-resolution-v1-backing-compact-runtime',
      );
      const states = expandRuntimeStates(
        aggregate.document.payload.plan.path
          ? JSON.parse((await exactFile(
              aggregate.document.payload.plan.path,
            )).bytes.toString('utf8')).payload.runtimes.find(
              ({animationId}) => animationId === runtime.animationId,
            )
          : null,
      );
      invariant(states.length === baseline.document.payload.runtime.states.length,
        `${runtime.animationId} state denominator differs`);
      const captured = await captureRuntime({
        browser,
        animationId: runtime.animationId,
        states,
        expectedRows: baseline.document.payload.runtime.states,
        originalBytes: original.bytes,
        candidateBytes: generated.outputBytes,
      });
      const summary = summarizeK1RepeatabilityRows(captured.rows);
      records.push({
        animationId: runtime.animationId,
        input: runtime.input,
        output: runtime.output,
        aggregateReceipt: receipt.descriptor,
        v1BaselineReceipt: baseline.descriptor,
        summary,
        rows: captured.rows,
        signals: captured.signals,
      });
      process.stdout.write(`${JSON.stringify({
        animationId: runtime.animationId,
        ...summary,
      })}\n`);
    }
  } finally {
    await browser.close();
  }
  const summary = records.reduce((result, record) => ({
    runtimeCount: result.runtimeCount + 1,
    stateCount: result.stateCount + record.summary.stateCount,
    frozenBaselineMismatchCount:
      result.frozenBaselineMismatchCount +
      record.summary.frozenBaselineMismatchCount,
    directCandidateMismatchCount:
      result.directCandidateMismatchCount +
      record.summary.directCandidateMismatchCount,
    directRenderStateMismatchCount:
      result.directRenderStateMismatchCount +
      record.summary.directRenderStateMismatchCount,
  }), {
    runtimeCount: 0,
    stateCount: 0,
    frozenBaselineMismatchCount: 0,
    directCandidateMismatchCount: 0,
    directRenderStateMismatchCount: 0,
  });
  const document = hashBoundDocument(
    'adaptive-canvas-k1-repeatability-review',
    {
      status: summary.frozenBaselineMismatchCount === 0 &&
        summary.directCandidateMismatchCount === 0 &&
        summary.directRenderStateMismatchCount === 0
        ? 'pass'
        : 'no-go',
      applyAuthorization: false,
      inputs: {
        aggregate: aggregate.descriptor,
        tool: tool.descriptor,
        test: test.descriptor,
      },
      browser: {
        name: 'chromium',
        version: toolchain.chromium.browserVersion,
        executable: toolchain.chromium.executable,
        runtimeBinary: toolchain.chromium.runtimeBinary,
      },
      contract: {
        scope: 'five-v11-parity-failure-runtimes-only',
        exactStateRequests: true,
        exactBackingResetBeforeEveryState: true,
        freshV1VersusFrozenBaseline: true,
        sameRunFreshV1VersusCandidateK1: true,
      },
      summary,
      records,
      boundaries: {
        diagnosticOnly: true,
        officialChromiumApplyProofWritten: false,
        adaptiveBatchApplyRun: false,
        productionRendererWritten: false,
        v2ProfileWritten: false,
        activeBindingWritten: false,
        deploymentRun: false,
        releaseEligibilityChanged: false,
      },
    },
  );
  const bytes = jsonBytes(document);
  await mkdir(path.dirname(absolute(OUTPUT_PATH)), {recursive: true});
  await writeFile(absolute(OUTPUT_PATH), bytes, {flag: 'wx', mode: 0o444});
  return {document, bytes};
}

async function check() {
  const output = await exactJson(
    OUTPUT_PATH,
    'adaptive-canvas-k1-repeatability-review',
  );
  invariant(output.document.payload.applyAuthorization === false &&
    output.document.payload.summary.runtimeCount === 5 &&
    output.document.payload.summary.stateCount === 4696,
  'repeatability review summary differs');
  for (const record of output.document.payload.records) {
    invariant(canonicalJson(summarizeK1RepeatabilityRows(record.rows)) ===
      canonicalJson(record.summary),
    `${record.animationId} repeatability summary differs`);
  }
  return output;
}

async function main() {
  const mode = process.argv[2];
  invariant((mode === '--capture' || mode === '--check') &&
    process.argv.length === 3,
  'usage: verify-adaptive-canvas-k1-repeatability.mjs --capture|--check');
  const result = mode === '--capture' ? await capture() : await check();
  process.stdout.write(`${JSON.stringify({
    status: result.document.payload.status,
    operation: mode === '--capture' ? 'created' : 'checked',
    path: OUTPUT_PATH,
    bytes: result.bytes.length,
    sha256: sha256(result.bytes),
    contentSha256: result.document.contentSha256,
    summary: result.document.payload.summary,
  })}\n`);
  if (result.document.payload.status === 'no-go') process.exitCode = 2;
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  main().catch((error) => {
    process.stderr.write(`adaptive-k1-repeatability: ${error.message}\n`);
    process.exitCode = 1;
  });
}
