import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {PNG} from 'pngjs';

import {
  CAPTURE_MANIFEST_ARTIFACT_TYPE,
  COMPARISON_REPORT_ARTIFACT_TYPE,
  DOWNSAMPLE_ALGORITHM_ID,
  K1_PARITY_REPORT_ARTIFACT_TYPE,
  captureBackingFixture,
  classifyNormalizedRgbRmse,
  decodePng,
  downsampleRgba2xBoxPremultipliedSrgb,
  encodePng,
  loadCaptureManifest,
  makeHashBoundDocument,
  normalizedRgbRmse,
  reportBytes,
  sha256,
  verifyHashBoundDocument,
} from './canvas-backing-image.mjs';
import {
  captureBrowserCanvasBacking,
  classifyCanvasCaptureRequest,
  parseArguments as parseCaptureArguments,
} from './capture-canvas-backing.mjs';
import {
  compareCanvasScale,
  parseArguments as parseCompareArguments,
} from './compare-canvas-scale.mjs';
import {
  parseArguments as parseParityArguments,
  verifyCanvasK1Parity,
} from './verify-canvas-k1-parity.mjs';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(scriptDirectory, '..');
const TEST_TEMP_PARENT = path.join(PROJECT_ROOT, 'work');
const ENTRY_STATE_SHA256 = 'a'.repeat(64);
const IDENTITY = Object.freeze({
  animationId: 'fixture-animation',
  requirementId: 'root-default-en',
  frameDomainId: 'root',
  traceId: 'default-natural-trace',
  entryStateSha256: ENTRY_STATE_SHA256,
  frame: 1,
  scenario: 'default',
  language: 'en',
  seed: '0',
});

async function temporaryDirectory(t) {
  await mkdir(TEST_TEMP_PARENT, {recursive: true});
  const root = await mkdtemp(
    path.join(TEST_TEMP_PARENT, '.canvas-backing-image-test-'),
  );
  t.after(async () => rm(root, {recursive: true, force: true}));
  return root;
}

async function captureRaw({
  root,
  name,
  bytes,
  stageWidth = 1,
  stageHeight = 1,
  scale = 1,
  identity = IDENTITY,
  check = false,
}) {
  const inputPath = path.join(root, 'fixtures', `${name}.rgba`);
  const outputDirectory = path.join(root, 'captures', name);
  if (!check) {
    await mkdir(path.dirname(inputPath), {recursive: true});
    await writeFile(inputPath, bytes);
  }
  return captureBackingFixture({
    projectRoot: PROJECT_ROOT,
    inputPath,
    inputFormat: 'rgba',
    outputDirectory,
    identity: {...identity},
    stageWidth,
    stageHeight,
    scale,
    check,
  });
}

async function capturePng({root, name, image, identity = IDENTITY}) {
  const inputPath = path.join(root, 'fixtures', `${name}.png`);
  await mkdir(path.dirname(inputPath), {recursive: true});
  await writeFile(inputPath, encodePng(image));
  return captureBackingFixture({
    projectRoot: PROJECT_ROOT,
    inputPath,
    inputFormat: 'png',
    outputDirectory: path.join(root, 'captures', name),
    identity: {...identity},
    stageWidth: image.width,
    stageHeight: image.height,
    scale: 1,
  });
}

function runNode(script, argumentsList) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [script, ...argumentsList], {
      cwd: PROJECT_ROOT,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.once('error', reject);
    child.once('close', (code, signal) => resolve({
      code,
      signal,
      stdout,
      stderr,
    }));
  });
}

test('2x box downsample uses sRGB premultiplied alpha and fixed integer rounding', () => {
  const source = {
    width: 2,
    height: 2,
    data: Buffer.from([
      255, 0, 0, 255,
      0, 255, 0, 128,
      0, 0, 255, 0,
      255, 255, 255, 64,
    ]),
  };
  const downsampled = downsampleRgba2xBoxPremultipliedSrgb(source);
  assert.deepEqual(
    downsampled,
    {width: 1, height: 1, data: Buffer.from([182, 110, 37, 112])},
  );

  const transparent = downsampleRgba2xBoxPremultipliedSrgb({
    width: 2,
    height: 2,
    data: Buffer.from([
      255, 1, 2, 0,
      3, 255, 4, 0,
      5, 6, 255, 0,
      255, 255, 255, 0,
    ]),
  });
  assert.deepEqual(transparent.data, Buffer.from([0, 0, 0, 0]));

  const halfUpAlpha = downsampleRgba2xBoxPremultipliedSrgb({
    width: 2,
    height: 2,
    data: Buffer.from([
      50, 60, 70, 1,
      50, 60, 70, 1,
      50, 60, 70, 0,
      50, 60, 70, 0,
    ]),
  });
  assert.deepEqual(halfUpAlpha.data, Buffer.from([50, 60, 70, 1]));
  assert.throws(
    () => downsampleRgba2xBoxPremultipliedSrgb({
      width: 3,
      height: 2,
      data: Buffer.alloc(24),
    }),
    /dimensions must both be even/,
  );
});

test('normalized RGB RMSE excludes alpha and uses fixed static/transition thresholds', () => {
  const reference = {
    width: 1,
    height: 1,
    data: Buffer.from([0, 0, 0, 0]),
  };
  const alphaOnly = {
    width: 1,
    height: 1,
    data: Buffer.from([0, 0, 0, 255]),
  };
  assert.deepEqual(normalizedRgbRmse(reference, alphaOnly), {
    squaredError: 0,
    channelCount: 3,
    normalizedRmse: 0,
  });
  const redOnly = normalizedRgbRmse(reference, {
    width: 1,
    height: 1,
    data: Buffer.from([255, 0, 0, 0]),
  });
  assert.equal(redOnly.squaredError, 255 ** 2);
  assert.equal(redOnly.normalizedRmse, Math.sqrt((255 ** 2) / 3) / 255);
  assert.deepEqual(classifyNormalizedRgbRmse(0.05, 'static'), {
    thresholdClass: 'static',
    threshold: 0.05,
    comparison: 'less-than-or-equal',
    status: 'pass',
  });
  assert.equal(classifyNormalizedRgbRmse(0.050000001, 'static').status, 'fail');
  assert.equal(classifyNormalizedRgbRmse(0.08, 'transition').status, 'pass');
  assert.throws(
    () => classifyNormalizedRgbRmse(0, 'unknown'),
    /static or transition/,
  );
});

test('capture accepts raw RGBA and PNG fixtures and --check is byte exact', async (t) => {
  const root = await temporaryDirectory(t);
  const rawBytes = Buffer.from([
    1, 2, 3, 4,
    5, 6, 7, 8,
  ]);
  const raw = await captureRaw({
    root,
    name: 'raw-k1',
    bytes: rawBytes,
    stageWidth: 2,
  });
  verifyHashBoundDocument(
    raw.manifest,
    CAPTURE_MANIFEST_ARTIFACT_TYPE,
  );
  assert.equal(raw.manifest.payload.sourceFixture.format, 'rgba');
  assert.equal(raw.manifest.payload.artifacts.rgba.sha256, sha256(rawBytes));
  const loadedRaw = await loadCaptureManifest({
    projectRoot: PROJECT_ROOT,
    manifestPath: raw.manifestPath,
  });
  assert.deepEqual(loadedRaw.image.data, rawBytes);
  const firstManifestBytes = await readFile(raw.manifestPath);
  const checked = await captureBackingFixture({
    projectRoot: PROJECT_ROOT,
    inputPath: path.join(root, 'fixtures', 'raw-k1.rgba'),
    inputFormat: 'rgba',
    outputDirectory: path.join(root, 'captures', 'raw-k1'),
    identity: {...IDENTITY},
    stageWidth: 2,
    stageHeight: 1,
    scale: 1,
    check: true,
  });
  assert.equal(checked.checked, true);
  assert.deepEqual(await readFile(raw.manifestPath), firstManifestBytes);

  const png = await capturePng({
    root,
    name: 'png-k1',
    image: {width: 1, height: 1, data: Buffer.from([9, 8, 7, 6])},
  });
  assert.equal(png.manifest.payload.sourceFixture.format, 'png');
  assert.deepEqual(
    await readFile(png.pngPath),
    await readFile(path.join(root, 'fixtures', 'png-k1.png')),
  );
  const loadedPng = await loadCaptureManifest({
    projectRoot: PROJECT_ROOT,
    manifestPath: png.manifestPath,
  });
  assert.deepEqual(loadedPng.image.data, Buffer.from([9, 8, 7, 6]));

  await writeFile(raw.rgbaPath, Buffer.from(rawBytes.map((value) => value + 1)));
  await assert.rejects(
    () => captureBackingFixture({
      projectRoot: PROJECT_ROOT,
      inputPath: path.join(root, 'fixtures', 'raw-k1.rgba'),
      inputFormat: 'rgba',
      outputDirectory: path.join(root, 'captures', 'raw-k1'),
      identity: {...IDENTITY},
      stageWidth: 2,
      stageHeight: 1,
      scale: 1,
      check: true,
    }),
    /stale or byte-mismatched/,
  );
});

test('capture manifest verification fails closed on bound JSON or artifact tampering', async (t) => {
  const root = await temporaryDirectory(t);
  const capture = await captureRaw({
    root,
    name: 'tamper',
    bytes: Buffer.from([1, 2, 3, 255]),
  });
  const document = JSON.parse(await readFile(capture.manifestPath, 'utf8'));
  document.payload.identity.frame = 2;
  await writeFile(capture.manifestPath, reportBytes(document));
  await assert.rejects(
    () => loadCaptureManifest({
      projectRoot: PROJECT_ROOT,
      manifestPath: capture.manifestPath,
    }),
    /contentSha256 mismatch/,
  );

  await writeFile(capture.manifestPath, reportBytes(capture.manifest));
  await writeFile(capture.pngPath, Buffer.from('not-a-png'));
  await assert.rejects(
    () => loadCaptureManifest({
      projectRoot: PROJECT_ROOT,
      manifestPath: capture.manifestPath,
    }),
    /byte count mismatch|SHA-256 mismatch/,
  );
});

test('capture rejects wrong dimensions, raw byte counts, and paths outside the repository', async (t) => {
  const root = await temporaryDirectory(t);
  const shortInput = path.join(root, 'fixtures', 'short.rgba');
  await mkdir(path.dirname(shortInput), {recursive: true});
  await writeFile(shortInput, Buffer.from([1, 2, 3]));
  const base = {
    projectRoot: PROJECT_ROOT,
    inputPath: shortInput,
    inputFormat: 'rgba',
    outputDirectory: path.join(root, 'captures', 'invalid'),
    identity: {...IDENTITY},
    stageWidth: 1,
    stageHeight: 1,
    scale: 1,
  };
  await assert.rejects(
    () => captureBackingFixture(base),
    /RGBA byte length must be 4; received 3/,
  );

  const pngInput = path.join(root, 'fixtures', 'one-pixel.png');
  await writeFile(pngInput, encodePng({
    width: 1,
    height: 1,
    data: Buffer.from([1, 2, 3, 4]),
  }));
  await assert.rejects(
    () => captureBackingFixture({
      ...base,
      inputPath: pngInput,
      inputFormat: 'png',
      stageWidth: 2,
    }),
    /Input dimensions must be 2x1; received 1x1/,
  );
  await assert.rejects(
    () => captureBackingFixture({
      ...base,
      inputPath: path.resolve(PROJECT_ROOT, '..', 'outside.rgba'),
    }),
    /must stay inside projectRoot/,
  );
  await assert.rejects(
    () => captureBackingFixture({
      ...base,
      outputDirectory: path.resolve(PROJECT_ROOT, '..', 'outside-output'),
    }),
    /must stay inside projectRoot/,
  );
});

test('browser capture stores the direct backing PNG and a hash-bound receipt', async (t) => {
  const root = await temporaryDirectory(t);
  const png = encodePng({
    width: 1,
    height: 1,
    data: Buffer.from([12, 34, 56, 255]),
  });
  const snapshot = {
    width: 1,
    height: 1,
    cssWidth: 1,
    cssHeight: 1,
    renderScale: '1',
    resolutionStatus: 'native',
    resolutionCeilingReached: 'false',
    renderState: 'ready',
    captureStage: 'true',
    visibleCanvasCount: 1,
    identity: {
      animationId: IDENTITY.animationId,
      requirementId: IDENTITY.requirementId,
      frameDomainId: IDENTITY.frameDomainId,
      traceId: IDENTITY.traceId,
      entryStateSha256: IDENTITY.entryStateSha256,
      frame: String(IDENTITY.frame),
      scenario: IDENTITY.scenario,
      language: IDENTITY.language,
      seed: IDENTITY.seed,
    },
    pngDataUrl: `data:image/png;base64,${png.toString('base64')}`,
  };
  const page = {
    on() {},
    async goto() { return {status: () => 200}; },
    locator() {
      return {
        async waitFor() {},
        async evaluate() { return snapshot; },
      };
    },
    async waitForFunction() {},
  };
  const context = {
    async newPage() { return page; },
    async close() {},
  };
  const browser = {
    async newContext() { return context; },
    version() { return 'fixture-browser-1'; },
    async close() {},
  };
  const playwrightModule = {
    chromium: {async launch() { return browser; }},
  };
  const result = await captureBrowserCanvasBacking({
    mode: 'browser',
    projectRoot: PROJECT_ROOT,
    outputDirectory: path.join(root, 'browser-capture'),
    identity: {...IDENTITY},
    stageWidth: 1,
    stageHeight: 1,
    scale: 1,
    check: false,
    url: 'http://127.0.0.1:3222/animations/fixture-animation',
    browserName: 'chromium',
    selector: 'canvas[data-course-canvas="fixture-animation"]',
    viewport: {width: 100, height: 100},
    deviceScaleFactor: 1,
    timeoutMs: 1000,
  }, {playwrightModule});
  assert.equal(result.browserReceipt.payload.browser.version, 'fixture-browser-1');
  assert.equal(result.browserReceipt.payload.sourcePng.sha256, sha256(png));
  assert.equal(
    verifyHashBoundDocument(
      result.browserReceipt,
      'canvas-browser-backing-capture-receipt',
    ),
    true,
  );
  const loaded = await loadCaptureManifest({
    projectRoot: PROJECT_ROOT,
    manifestPath: result.manifestPath,
  });
  assert.deepEqual(loaded.image.data, Buffer.from([12, 34, 56, 255]));
});

test('browser capture resource policy rejects HTTP errors and private, candidate, legacy, or cross-origin requests', () => {
  const origin = 'https://preview.helpmath.test';
  for (const url of [
    `${origin}/private/evidence.json`,
    `${origin}/flash-assets/candidates/course-g04-l03-in-002.js`,
    `${origin}/source-assets/HELP_COURSES/ELMGR4/L3/L3IN02.fla`,
    `${origin}/assets/lesson.swf?cache=1`,
    `${origin}/vendor/ruffle/core.js`,
    `${origin}/courses/4/10`,
    `${origin}/flash-assets/courses/course-g04-l11-in-002/canvas-renderer.js`,
    'https://cdn.example.test/runtime.js',
  ]) {
    assert.equal(
      classifyCanvasCaptureRequest(url, origin).allowed,
      false,
      url,
    );
  }
  for (const url of [
    `${origin}/animations/course-g04-l03-in-002?frame=1`,
    `${origin}/flash-assets/by-sha256/${'a'.repeat(64)}/courses/course-g04-l03-in-002/canvas-renderer.js`,
    'data:image/png;base64,AAAA',
    'blob:https://preview.helpmath.test/id',
  ]) {
    assert.deepEqual(
      classifyCanvasCaptureRequest(url, origin),
      {allowed: true, reason: null},
      url,
    );
  }
  assert.equal(
    classifyCanvasCaptureRequest('not an absolute url', origin).reason,
    'invalid-request-url',
  );
});

test('browser capture fails closed on any subresource HTTP 4xx/5xx response', async (t) => {
  const root = await temporaryDirectory(t);
  const png = encodePng({
    width: 1,
    height: 1,
    data: Buffer.from([12, 34, 56, 255]),
  });
  const handlers = new Map();
  const snapshot = {
    width: 1,
    height: 1,
    cssWidth: 1,
    cssHeight: 1,
    renderScale: '1',
    resolutionStatus: 'native',
    resolutionCeilingReached: 'false',
    renderState: 'ready',
    captureStage: 'true',
    visibleCanvasCount: 1,
    identity: {
      animationId: IDENTITY.animationId,
      requirementId: IDENTITY.requirementId,
      frameDomainId: IDENTITY.frameDomainId,
      traceId: IDENTITY.traceId,
      entryStateSha256: IDENTITY.entryStateSha256,
      frame: String(IDENTITY.frame),
      scenario: IDENTITY.scenario,
      language: IDENTITY.language,
      seed: IDENTITY.seed,
    },
    pngDataUrl: `data:image/png;base64,${png.toString('base64')}`,
  };
  const page = {
    on(event, handler) { handlers.set(event, handler); },
    async goto(url) {
      handlers.get('request')?.({url: () => url});
      handlers.get('response')?.({
        status: () => 200,
        url: () => url,
      });
      handlers.get('request')?.({
        url: () => 'http://127.0.0.1:3222/missing-font.woff2',
      });
      handlers.get('response')?.({
        status: () => 404,
        url: () => 'http://127.0.0.1:3222/missing-font.woff2',
      });
      return {status: () => 200};
    },
    locator() {
      return {
        async waitFor() {},
        async evaluate() { return snapshot; },
      };
    },
    async waitForFunction() {},
  };
  const context = {async newPage() { return page; }, async close() {}};
  const browser = {
    async newContext() { return context; },
    version() { return 'fixture-browser-1'; },
    async close() {},
  };
  await assert.rejects(
    () => captureBrowserCanvasBacking({
      mode: 'browser',
      projectRoot: PROJECT_ROOT,
      outputDirectory: path.join(root, 'browser-http-error'),
      identity: {...IDENTITY},
      stageWidth: 1,
      stageHeight: 1,
      scale: 1,
      check: false,
      url: 'http://127.0.0.1:3222/animations/fixture-animation',
      browserName: 'chromium',
      selector: 'canvas[data-course-canvas="fixture-animation"]',
      viewport: {width: 100, height: 100},
      deviceScaleFactor: 1,
      timeoutMs: 1000,
    }, {playwrightModule: {chromium: {async launch() { return browser; }}}}),
    /httpErrors.*404/u,
  );
});

test('all three CLIs reject missing, duplicate, unknown, and invalid options', () => {
  const captureArguments = [
    '--input', 'work/input.rgba',
    '--input-format', 'rgba',
    '--output-dir', 'work/output',
    '--animation-id', 'fixture-animation',
    '--requirement-id', 'root-default-en',
    '--frame-domain', 'root',
    '--trace', 'default-natural-trace',
    '--entry-state-sha256', ENTRY_STATE_SHA256,
    '--frame', '1',
    '--scenario', 'default',
    '--lang', 'en',
    '--seed', '0',
    '--stage-width', '800',
    '--stage-height', '600',
    '--scale', '2',
  ];
  const parsedCapture = parseCaptureArguments(captureArguments);
  assert.equal(parsedCapture.mode, 'fixture');
  assert.equal(parsedCapture.scale, 2);
  assert.equal(parsedCapture.identity.language, 'en');
  assert.throws(
    () => parseCaptureArguments(captureArguments.slice(0, -2)),
    /--scale is required/,
  );
  assert.throws(
    () => parseCaptureArguments([...captureArguments, '--scale', '1']),
    /only once/,
  );
  assert.throws(
    () => parseCaptureArguments([...captureArguments, '--mystery']),
    /Unknown option/,
  );
  assert.throws(
    () => parseCaptureArguments([
      ...captureArguments.slice(0, -1),
      '3',
    ]),
    /must be 1 or 2/,
  );

  const browserArguments = [
    '--url', 'http://127.0.0.1:3222/animations/fixture-animation',
    '--browser', 'webkit',
    '--output-dir', 'work/browser-output',
    ...captureArguments.slice(6),
  ];
  const parsedBrowser = parseCaptureArguments(browserArguments);
  assert.equal(parsedBrowser.mode, 'browser');
  assert.equal(parsedBrowser.browserName, 'webkit');
  assert.equal(parsedBrowser.deviceScaleFactor, 2);
  assert.equal(
    parsedBrowser.selector,
    'canvas[data-course-canvas="fixture-animation"]',
  );
  assert.throws(
    () => parseCaptureArguments([...browserArguments, '--input', 'work/x.png']),
    /cannot be combined/u,
  );
  assert.throws(
    () => parseCaptureArguments([
      ...browserArguments.filter((value, index) =>
        browserArguments[index - 1] !== '--browser' && value !== '--browser'),
      '--browser', 'unknown',
    ]),
    /chromium, firefox, or webkit/u,
  );

  const parsedCompare = parseCompareArguments([
    '--baseline-manifest', 'work/k1/capture-manifest.json',
    '--scaled-manifest', 'work/k2/capture-manifest.json',
    '--threshold-class', 'static',
    '--output', 'work/comparison.json',
    '--check',
  ]);
  assert.equal(parsedCompare.thresholdClass, 'static');
  assert.equal(parsedCompare.check, true);
  assert.throws(
    () => parseCompareArguments([
      '--baseline-manifest', 'a',
      '--scaled-manifest', 'b',
      '--threshold-class', 'loose',
      '--output', 'c',
    ]),
    /static or transition/,
  );
  assert.throws(
    () => parseCompareArguments([
      '--baseline-manifest', 'a',
      '--scaled-manifest', 'b',
      '--threshold-class', 'static',
      '--output', 'c',
      '--output', 'd',
    ]),
    /only once/,
  );

  const parsedParity = parseParityArguments([
    '--baseline-manifest', 'work/a/capture-manifest.json',
    '--candidate-manifest', 'work/b/capture-manifest.json',
    '--output', 'work/parity.json',
  ]);
  assert.equal(parsedParity.check, false);
  assert.throws(
    () => parseParityArguments([
      '--baseline-manifest', 'a',
      '--candidate-manifest', 'b',
    ]),
    /--output is required/,
  );
  assert.throws(
    () => parseParityArguments(['positional']),
    /Unknown option/,
  );
});

test('scale comparison downsamples k2, binds inputs, classifies, and checks freshness', async (t) => {
  const root = await temporaryDirectory(t);
  const expectedK1 = Buffer.from([182, 110, 37, 112]);
  const k2Bytes = Buffer.from([
    255, 0, 0, 255,
    0, 255, 0, 128,
    0, 0, 255, 0,
    255, 255, 255, 64,
  ]);
  const baseline = await captureRaw({
    root,
    name: 'baseline-k1',
    bytes: expectedK1,
  });
  const scaled = await captureRaw({
    root,
    name: 'scaled-k2',
    bytes: k2Bytes,
    scale: 2,
  });
  const outputPath = path.join(root, 'reports', 'scale-pass.json');
  const comparison = await compareCanvasScale({
    projectRoot: PROJECT_ROOT,
    baselineManifestPath: baseline.manifestPath,
    scaledManifestPath: scaled.manifestPath,
    thresholdClass: 'static',
    outputPath,
  });
  assert.equal(comparison.status, 'pass');
  assert.equal(comparison.document.payload.metric.normalizedRmse, 0);
  assert.equal(
    comparison.document.payload.downsample.algorithmId,
    DOWNSAMPLE_ALGORITHM_ID,
  );
  assert.equal(
    comparison.document.payload.downsample.rgbaSha256,
    sha256(expectedK1),
  );
  verifyHashBoundDocument(
    comparison.document,
    COMPARISON_REPORT_ARTIFACT_TYPE,
  );
  const checked = await compareCanvasScale({
    projectRoot: PROJECT_ROOT,
    baselineManifestPath: baseline.manifestPath,
    scaledManifestPath: scaled.manifestPath,
    thresholdClass: 'static',
    outputPath,
    check: true,
  });
  assert.equal(checked.checked, true);
  assert.equal(checked.document.contentSha256, comparison.document.contentSha256);

  const failingScaled = await captureRaw({
    root,
    name: 'scaled-fail-k2',
    bytes: Buffer.from([
      255, 255, 255, 255,
      255, 255, 255, 255,
      255, 255, 255, 255,
      255, 255, 255, 255,
    ]),
    scale: 2,
  });
  const failingOutput = path.join(root, 'reports', 'scale-fail.json');
  const failing = await compareCanvasScale({
    projectRoot: PROJECT_ROOT,
    baselineManifestPath: baseline.manifestPath,
    scaledManifestPath: failingScaled.manifestPath,
    thresholdClass: 'transition',
    outputPath: failingOutput,
  });
  assert.equal(failing.status, 'fail');
  assert.ok(failing.document.payload.metric.normalizedRmse > 0.08);

  const cli = await runNode(
    path.join(scriptDirectory, 'compare-canvas-scale.mjs'),
    [
      '--baseline-manifest', path.relative(PROJECT_ROOT, baseline.manifestPath),
      '--scaled-manifest', path.relative(PROJECT_ROOT, failingScaled.manifestPath),
      '--threshold-class', 'transition',
      '--output', path.relative(PROJECT_ROOT, failingOutput),
      '--check',
    ],
  );
  assert.equal(cli.code, 2, cli.stderr);
  assert.match(cli.stdout, /"status": "fail"/);
});

test('scale comparison rejects identity mismatches before producing a report', async (t) => {
  const root = await temporaryDirectory(t);
  const baseline = await captureRaw({
    root,
    name: 'identity-baseline',
    bytes: Buffer.from([0, 0, 0, 255]),
  });
  const scaled = await captureRaw({
    root,
    name: 'identity-scaled',
    bytes: Buffer.alloc(16, 0),
    scale: 2,
    identity: {...IDENTITY, scenario: 'different'},
  });
  await assert.rejects(
    () => compareCanvasScale({
      projectRoot: PROJECT_ROOT,
      baselineManifestPath: baseline.manifestPath,
      scaledManifestPath: scaled.manifestPath,
      thresholdClass: 'static',
      outputPath: path.join(root, 'reports', 'must-not-exist.json'),
    }),
    /Capture identities differ/,
  );
});

test('k1 parity requires exact raw RGBA and encoded PNG bytes and exits nonzero', async (t) => {
  const root = await temporaryDirectory(t);
  const pixels = Buffer.from([10, 20, 30, 255]);
  const baseline = await captureRaw({
    root,
    name: 'parity-baseline',
    bytes: pixels,
  });
  const candidate = await captureRaw({
    root,
    name: 'parity-candidate',
    bytes: pixels,
  });
  const passOutput = path.join(root, 'reports', 'parity-pass.json');
  const passing = await verifyCanvasK1Parity({
    projectRoot: PROJECT_ROOT,
    baselineManifestPath: baseline.manifestPath,
    candidateManifestPath: candidate.manifestPath,
    outputPath: passOutput,
  });
  assert.equal(passing.status, 'pass');
  assert.equal(passing.document.payload.parity.rgba.byteIdentical, true);
  assert.equal(passing.document.payload.parity.png.byteIdentical, true);
  verifyHashBoundDocument(
    passing.document,
    K1_PARITY_REPORT_ARTIFACT_TYPE,
  );
  const checked = await verifyCanvasK1Parity({
    projectRoot: PROJECT_ROOT,
    baselineManifestPath: baseline.manifestPath,
    candidateManifestPath: candidate.manifestPath,
    outputPath: passOutput,
    check: true,
  });
  assert.equal(checked.checked, true);

  const mismatch = await captureRaw({
    root,
    name: 'parity-mismatch',
    bytes: Buffer.from([11, 20, 30, 255]),
  });
  const failOutput = path.join(root, 'reports', 'parity-fail.json');
  const failing = await verifyCanvasK1Parity({
    projectRoot: PROJECT_ROOT,
    baselineManifestPath: baseline.manifestPath,
    candidateManifestPath: mismatch.manifestPath,
    outputPath: failOutput,
  });
  assert.equal(failing.status, 'fail');
  assert.equal(failing.document.payload.parity.rgba.byteIdentical, false);
  assert.equal(failing.document.payload.parity.rgba.firstMismatchedByte, 0);

  const cli = await runNode(
    path.join(scriptDirectory, 'verify-canvas-k1-parity.mjs'),
    [
      '--baseline-manifest', path.relative(PROJECT_ROOT, baseline.manifestPath),
      '--candidate-manifest', path.relative(PROJECT_ROOT, mismatch.manifestPath),
      '--output', path.relative(PROJECT_ROOT, failOutput),
      '--check',
    ],
  );
  assert.equal(cli.code, 2, cli.stderr);
  assert.match(cli.stdout, /"status": "fail"/);
});

test('k1 parity fails when RGBA pixels match but PNG encoding bytes differ', async (t) => {
  const root = await temporaryDirectory(t);
  const pixels = Buffer.from([
    10, 20, 30, 255,
    40, 50, 60, 128,
  ]);
  const baseline = await captureRaw({
    root,
    name: 'png-byte-baseline',
    bytes: pixels,
    stageWidth: 2,
  });
  const candidate = await captureRaw({
    root,
    name: 'png-byte-candidate',
    bytes: pixels,
    stageWidth: 2,
  });
  const candidateDocument = JSON.parse(
    await readFile(candidate.manifestPath, 'utf8'),
  );
  const alternatePng = new PNG({width: 2, height: 1});
  alternatePng.data = Buffer.from(pixels);
  const alternatePngBytes = PNG.sync.write(alternatePng, {
    colorType: 6,
    inputColorType: 6,
    bitDepth: 8,
    deflateLevel: 0,
    deflateStrategy: 0,
  });
  assert.deepEqual(decodePng(alternatePngBytes).data, pixels);
  assert.notDeepEqual(alternatePngBytes, await readFile(candidate.pngPath));
  await writeFile(candidate.pngPath, alternatePngBytes);
  candidateDocument.payload.artifacts.png.bytes = alternatePngBytes.length;
  candidateDocument.payload.artifacts.png.sha256 = sha256(alternatePngBytes);
  const rebound = makeHashBoundDocument(
    CAPTURE_MANIFEST_ARTIFACT_TYPE,
    candidateDocument.payload,
  );
  await writeFile(candidate.manifestPath, reportBytes(rebound));

  const result = await verifyCanvasK1Parity({
    projectRoot: PROJECT_ROOT,
    baselineManifestPath: baseline.manifestPath,
    candidateManifestPath: candidate.manifestPath,
    outputPath: path.join(root, 'reports', 'png-byte-fail.json'),
  });
  assert.equal(result.status, 'fail');
  assert.equal(result.document.payload.parity.rgba.byteIdentical, true);
  assert.equal(result.document.payload.parity.rgba.sha256Identical, true);
  assert.equal(result.document.payload.parity.png.byteIdentical, false);
  assert.equal(result.document.payload.parity.png.sha256Identical, false);
});
