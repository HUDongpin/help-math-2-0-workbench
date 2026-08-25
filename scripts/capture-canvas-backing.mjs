#!/usr/bin/env node

import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {
  captureBackingFixture,
  makeHashBoundDocument,
  sha256,
  writeOrCheckBytes,
  writeOrCheckHashBoundReport,
} from './canvas-backing-image.mjs';

const scriptPath = fileURLToPath(import.meta.url);
const defaultProjectRoot = path.resolve(path.dirname(scriptPath), '..');

const FORBIDDEN_CAPTURE_RESOURCE = Object.freeze([
  {
    id: 'legacy-source-binary',
    pattern: /\.(?:swf|fla)(?:$|[?&#])/u,
  },
  {
    id: 'ruffle-runtime',
    pattern: /(?:^|[/_.@-])ruffle(?:$|[/_.@-])/u,
  },
  {
    id: 'private-or-candidate-path',
    pattern:
      /(?:^|[/_.@-])(?:candidates?|private|private-archive|source-assets|migrations|evidence)(?:$|[/_.@-])/u,
  },
  {
    id: 'excluded-candidate-lesson',
    pattern: /(?:\/courses\/4\/(?:5|10|11)(?:$|[/?#])|course-g04-l(?:05|10|11)-)/u,
  },
]);

function decodedUrlInspectionText(url) {
  let inspected = `${url.hostname}${url.pathname}${url.search}${url.hash}`;
  try {
    inspected = decodeURIComponent(inspected);
  } catch {
    // A malformed escape cannot disable the raw-string policy below.
  }
  return inspected.toLowerCase();
}

/**
 * Classify one browser request against the resolution-capture resource gate.
 * HTTP(S) requests are same-origin only. Candidate/private/legacy runtime
 * paths are blocked even when they share the capture origin. data: and blob:
 * URLs remain local browser resources and are admitted here.
 */
export function classifyCanvasCaptureRequest(rawUrl, allowedOrigin) {
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    return {allowed: false, reason: 'invalid-request-url'};
  }
  if (url.protocol === 'data:' || url.protocol === 'blob:') {
    return {allowed: true, reason: null};
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return {allowed: false, reason: 'unsupported-request-scheme'};
  }
  if (url.origin !== allowedOrigin) {
    return {allowed: false, reason: 'unexpected-origin'};
  }
  const inspected = decodedUrlInspectionText(url);
  const forbidden = FORBIDDEN_CAPTURE_RESOURCE.find(({pattern}) =>
    pattern.test(inspected));
  return forbidden
    ? {allowed: false, reason: forbidden.id}
    : {allowed: true, reason: null};
}

export function usage() {
  return `Usage:
  Browser backing-store capture:
  node scripts/capture-canvas-backing.mjs \\
    --url <local-or-preview-url> \\
    [--browser <chromium|firefox|webkit>] \\
    [--selector <exact-canvas-selector>] \\
    [--viewport-width <pixels>] [--viewport-height <pixels>] \\
    [--device-scale-factor <positive-number>] [--timeout-ms <milliseconds>] \\
    --output-dir <directory> \\
    --animation-id <id> \\
    --requirement-id <id> \\
    --frame-domain <id> \\
    --trace <id> \\
    --entry-state-sha256 <lowercase-sha256> \\
    --frame <one-indexed-frame> \\
    --scenario <id> \\
    --lang <en|es> \\
    --seed <id> \\
    --stage-width <pixels> \\
    --stage-height <pixels> \\
    --scale <1|2> [--check]

  Existing fixture normalization:
  node scripts/capture-canvas-backing.mjs \\
    --input <fixture.rgba|fixture.png> \\
    --input-format <rgba|png> \\
    --output-dir <directory> \\
    --animation-id <id> \\
    --requirement-id <id> \\
    --frame-domain <id> \\
    --trace <id> \\
    --entry-state-sha256 <lowercase-sha256> \\
    --frame <one-indexed-frame> \\
    --scenario <id> \\
    --lang <en|es> \\
    --seed <id> \\
    --stage-width <pixels> \\
    --stage-height <pixels> \\
    --scale <1|2> [--check]

Browser mode exports the selected Canvas backing directly with toDataURL; it
never uses a CSS-sized locator screenshot. It requires ready/capture identity,
exact native×scale dimensions, one visible main Canvas, same-origin requests,
and zero console/page/network errors. It writes the retained browser source
PNG, normalized backing.rgba/backing.png, capture-manifest.json, and a
hash-bound browser-capture-receipt.json. Fixture mode retains its prior input
contract. Paths must remain inside the repository. --check performs a
byte-for-byte freshness check without writing.`;
}

function positiveInteger(value, label) {
  if (!/^[1-9][0-9]*$/.test(value || '')) {
    throw new Error(`${label} must be a positive integer`);
  }
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed)) {
    throw new Error(`${label} must be a positive safe integer`);
  }
  return parsed;
}

function positiveNumber(value, label) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${label} must be a positive finite number`);
  }
  return parsed;
}

export function parseArguments(argv, {projectRoot = defaultProjectRoot} = {}) {
  const valueOptions = new Set([
    '--input',
    '--input-format',
    '--url',
    '--browser',
    '--selector',
    '--viewport-width',
    '--viewport-height',
    '--device-scale-factor',
    '--timeout-ms',
    '--output-dir',
    '--animation-id',
    '--requirement-id',
    '--frame-domain',
    '--trace',
    '--entry-state-sha256',
    '--frame',
    '--scenario',
    '--lang',
    '--seed',
    '--stage-width',
    '--stage-height',
    '--scale',
  ]);
  const values = new Map();
  let check = false;
  let help = false;
  for (let index = 0; index < argv.length; index += 1) {
    const option = argv[index];
    if (option === '--help' || option === '-h') {
      if (help) throw new Error(`${option} may be supplied only once`);
      help = true;
      continue;
    }
    if (option === '--check') {
      if (check) throw new Error('--check may be supplied only once');
      check = true;
      continue;
    }
    if (!valueOptions.has(option)) throw new Error(`Unknown option: ${option}`);
    if (values.has(option)) throw new Error(`${option} may be supplied only once`);
    const value = argv[index + 1];
    if (value === undefined || value === '' || value.startsWith('--')) {
      throw new Error(`${option} requires a value`);
    }
    values.set(option, value);
    index += 1;
  }
  if (help) return {help: true, projectRoot: path.resolve(projectRoot)};
  const commonRequired = [
    '--output-dir', '--animation-id', '--requirement-id', '--frame-domain',
    '--trace', '--entry-state-sha256', '--frame', '--scenario', '--lang',
    '--seed', '--stage-width', '--stage-height', '--scale',
  ];
  for (const option of commonRequired) {
    if (!values.has(option)) throw new Error(`${option} is required`);
  }
  const browserMode = values.has('--url');
  if (browserMode && (values.has('--input') || values.has('--input-format'))) {
    throw new Error('--url cannot be combined with --input or --input-format');
  }
  if (!browserMode && (!values.has('--input') || !values.has('--input-format'))) {
    throw new Error('fixture mode requires --input and --input-format');
  }
  for (const browserOnly of [
    '--browser', '--selector', '--viewport-width', '--viewport-height',
    '--device-scale-factor', '--timeout-ms',
  ]) {
    if (!browserMode && values.has(browserOnly)) {
      throw new Error(`${browserOnly} requires --url browser mode`);
    }
  }
  const inputFormat = values.get('--input-format') ?? null;
  if (!browserMode && inputFormat !== 'rgba' && inputFormat !== 'png') {
    throw new Error('--input-format must be rgba or png');
  }
  const scale = positiveInteger(values.get('--scale'), '--scale');
  if (scale !== 1 && scale !== 2) throw new Error('--scale must be 1 or 2');
  const identity = {
    animationId: values.get('--animation-id'),
    requirementId: values.get('--requirement-id'),
    frameDomainId: values.get('--frame-domain'),
    traceId: values.get('--trace'),
    entryStateSha256: values.get('--entry-state-sha256'),
    frame: positiveInteger(values.get('--frame'), '--frame'),
    scenario: values.get('--scenario'),
    language: values.get('--lang'),
    seed: values.get('--seed'),
  };
  const common = {
    projectRoot: path.resolve(projectRoot),
    outputDirectory: values.get('--output-dir'),
    identity,
    stageWidth: positiveInteger(values.get('--stage-width'), '--stage-width'),
    stageHeight: positiveInteger(
      values.get('--stage-height'),
      '--stage-height',
    ),
    scale,
    check,
  };
  if (!browserMode) {
    return {
      ...common,
      mode: 'fixture',
      inputPath: values.get('--input'),
      inputFormat,
    };
  }
  const browserName = values.get('--browser') ?? 'chromium';
  if (!['chromium', 'firefox', 'webkit'].includes(browserName)) {
    throw new Error('--browser must be chromium, firefox, or webkit');
  }
  let url;
  try {
    url = new URL(values.get('--url')).href;
  } catch {
    throw new Error('--url must be an absolute http or https URL');
  }
  if (!/^https?:/u.test(url)) {
    throw new Error('--url must be an absolute http or https URL');
  }
  return {
    ...common,
    mode: 'browser',
    url,
    browserName,
    selector: values.get('--selector') ??
      `canvas[data-course-canvas="${identity.animationId}"]`,
    viewport: {
      width: positiveInteger(values.get('--viewport-width') ?? '1440', '--viewport-width'),
      height: positiveInteger(values.get('--viewport-height') ?? '900', '--viewport-height'),
    },
    deviceScaleFactor: positiveNumber(
      values.get('--device-scale-factor') ?? String(scale),
      '--device-scale-factor',
    ),
    timeoutMs: positiveInteger(values.get('--timeout-ms') ?? '30000', '--timeout-ms'),
  };
}

function assertBrowserSnapshot(snapshot, options) {
  if (!snapshot || typeof snapshot !== 'object') {
    throw new Error('browser did not return a Canvas backing snapshot');
  }
  const expectedWidth = options.stageWidth * options.scale;
  const expectedHeight = options.stageHeight * options.scale;
  if (snapshot.width !== expectedWidth || snapshot.height !== expectedHeight) {
    throw new Error(
      `browser Canvas backing must be ${expectedWidth}x${expectedHeight}; ` +
      `received ${snapshot.width}x${snapshot.height}`,
    );
  }
  if (snapshot.visibleCanvasCount !== 1) {
    throw new Error(
      `expected one connected visible main Canvas; received ${snapshot.visibleCanvasCount}`,
    );
  }
  if (snapshot.renderScale !== String(options.scale)) {
    throw new Error(`Canvas data-render-scale must be ${options.scale}`);
  }
  if (snapshot.renderState !== 'ready' || snapshot.captureStage !== 'true') {
    throw new Error('Canvas was exported before ready/capture identity');
  }
  const expectedIdentity = {
    animationId: options.identity.animationId,
    requirementId: options.identity.requirementId,
    frameDomainId: options.identity.frameDomainId,
    traceId: options.identity.traceId,
    entryStateSha256: options.identity.entryStateSha256,
    frame: String(options.identity.frame),
    scenario: options.identity.scenario,
    language: options.identity.language,
    seed: options.identity.seed,
  };
  for (const [key, expected] of Object.entries(expectedIdentity)) {
    if (snapshot.identity?.[key] !== expected) {
      throw new Error(`Canvas browser identity ${key} mismatch`);
    }
  }
  if (typeof snapshot.pngDataUrl !== 'string' ||
    !snapshot.pngDataUrl.startsWith('data:image/png;base64,')) {
    throw new Error('Canvas browser export did not return a PNG data URL');
  }
  return snapshot;
}

export async function captureBrowserCanvasBacking(options, {
  playwrightModule,
} = {}) {
  const playwright = playwrightModule ?? await import('playwright');
  const browserType = playwright[options.browserName];
  if (!browserType || typeof browserType.launch !== 'function') {
    throw new Error(`Playwright browser is unavailable: ${options.browserName}`);
  }
  const browser = await browserType.launch({headless: true});
  let context;
  try {
    context = await browser.newContext({
      deviceScaleFactor: options.deviceScaleFactor,
      reducedMotion: 'no-preference',
      viewport: options.viewport,
    });
    const page = await context.newPage();
    const consoleErrors = [];
    const pageErrors = [];
    const failedRequests = [];
    const unexpectedOrigins = [];
    const forbiddenRequests = [];
    const httpErrors = [];
    const allowedOrigin = new URL(options.url).origin;
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    page.on('pageerror', (error) => pageErrors.push(error.message));
    page.on('requestfailed', (request) => {
      failedRequests.push(
        `${request.url()} :: ${request.failure()?.errorText ?? 'unknown'}`,
      );
    });
    page.on('request', (request) => {
      const url = request.url();
      const classification = classifyCanvasCaptureRequest(url, allowedOrigin);
      if (!classification.allowed) {
        const record = `${classification.reason} :: ${url}`;
        forbiddenRequests.push(record);
        if (classification.reason === 'unexpected-origin') {
          unexpectedOrigins.push(url);
        }
      }
    });
    page.on('response', (response) => {
      const status = response.status();
      const url = response.url();
      if (/^https?:/u.test(url) && status >= 400) {
        httpErrors.push(`${status} :: ${url}`);
      }
    });
    const response = await page.goto(options.url, {
      waitUntil: 'domcontentloaded',
      timeout: options.timeoutMs,
    });
    if (!response || response.status() < 200 || response.status() >= 300) {
      throw new Error(
        `browser capture URL returned HTTP ${response?.status() ?? 'none'}`,
      );
    }
    const locator = page.locator(options.selector);
    await locator.waitFor({state: 'visible', timeout: options.timeoutMs});
    await page.waitForFunction(
      (selector) => {
        const canvas = document.querySelector(selector);
        return canvas instanceof HTMLCanvasElement &&
          canvas.dataset.renderState === 'ready' &&
          canvas.dataset.captureStage === 'true';
      },
      options.selector,
      {timeout: options.timeoutMs},
    );
    const snapshot = assertBrowserSnapshot(await locator.evaluate((node) => {
      if (!(node instanceof HTMLCanvasElement)) {
        throw new Error('selected node is not a Canvas');
      }
      const visibleCanvasCount = [...document.querySelectorAll('canvas')]
        .filter((candidate) => {
          const rect = candidate.getBoundingClientRect();
          const style = getComputedStyle(candidate);
          return candidate.isConnected && rect.width > 0 && rect.height > 0 &&
            style.display !== 'none' && style.visibility !== 'hidden';
        }).length;
      const rect = node.getBoundingClientRect();
      return {
        width: node.width,
        height: node.height,
        cssWidth: rect.width,
        cssHeight: rect.height,
        renderScale: node.dataset.renderScale,
        resolutionStatus: node.dataset.resolutionStatus,
        resolutionCeilingReached: node.dataset.resolutionCeilingReached,
        renderState: node.dataset.renderState,
        captureStage: node.dataset.captureStage,
        visibleCanvasCount,
        identity: {
          animationId: node.dataset.animationId ?? node.dataset.courseCanvas,
          requirementId: node.dataset.flashRequirementId,
          frameDomainId: node.dataset.flashFrameDomain,
          traceId: node.dataset.flashTraceId,
          entryStateSha256: node.dataset.flashEntryStateSha256,
          frame: node.dataset.flashFrame,
          scenario: node.dataset.flashScenario ?? node.dataset.runtimeScenario,
          language: node.dataset.flashLang ?? node.dataset.runtimeLanguage,
          seed: node.dataset.flashSeed ?? node.dataset.runtimeSeed,
        },
        pngDataUrl: node.toDataURL('image/png'),
      };
    }), options);
    if (consoleErrors.length || pageErrors.length || failedRequests.length ||
      unexpectedOrigins.length || forbiddenRequests.length ||
      httpErrors.length) {
      throw new Error(
        `browser capture had runtime/network errors: ${JSON.stringify({
          consoleErrors,
          pageErrors,
          failedRequests,
          unexpectedOrigins,
          forbiddenRequests,
          httpErrors,
        })}`,
      );
    }
    const sourcePng = Buffer.from(
      snapshot.pngDataUrl.slice('data:image/png;base64,'.length),
      'base64',
    );
    const sourcePath = path.join(
      options.outputDirectory,
      'browser-backing-source.png',
    );
    const resolvedSourcePath = await writeOrCheckBytes({
      projectRoot: options.projectRoot,
      destination: sourcePath,
      bytes: sourcePng,
      check: options.check,
      label: 'browser backing source PNG',
    });
    const capture = await captureBackingFixture({
      ...options,
      inputPath: resolvedSourcePath,
      inputFormat: 'png',
    });
    const browserVersion = typeof browser.version === 'function'
      ? browser.version()
      : 'unknown';
    const receipt = makeHashBoundDocument(
      'canvas-browser-backing-capture-receipt',
      {
        evidenceClass: 'current-javascript-direct-canvas-backing-capture',
        url: options.url,
        responseStatus: response.status(),
        browser: {name: options.browserName, version: browserVersion},
        viewport: options.viewport,
        deviceScaleFactor: options.deviceScaleFactor,
        selector: options.selector,
        canvas: {
          width: snapshot.width,
          height: snapshot.height,
          cssWidth: snapshot.cssWidth,
          cssHeight: snapshot.cssHeight,
          renderScale: Number(snapshot.renderScale),
          resolutionStatus: snapshot.resolutionStatus,
          resolutionCeilingReached:
            snapshot.resolutionCeilingReached === 'true',
        },
        identity: options.identity,
        sourcePng: {
          path: path.relative(options.projectRoot, resolvedSourcePath),
          bytes: sourcePng.length,
          sha256: sha256(sourcePng),
        },
        captureManifest: {
          path: path.relative(options.projectRoot, capture.manifestPath),
          contentSha256: capture.manifest.contentSha256,
        },
        runtimeSignals: {
          consoleErrors,
          pageErrors,
          failedRequests,
          unexpectedOrigins,
          forbiddenRequests,
          httpErrors,
        },
      },
    );
    const receiptPath = path.join(
      options.outputDirectory,
      'browser-capture-receipt.json',
    );
    const resolvedReceiptPath = await writeOrCheckHashBoundReport({
      projectRoot: options.projectRoot,
      outputPath: receiptPath,
      document: receipt,
      check: options.check,
    });
    return {
      ...capture,
      browserReceipt: receipt,
      browserReceiptPath: resolvedReceiptPath,
    };
  } finally {
    await context?.close().catch(() => {});
    await browser.close().catch(() => {});
  }
}

export async function runCapture(options, dependencies) {
  return options.mode === 'browser'
    ? captureBrowserCanvasBacking(options, dependencies)
    : captureBackingFixture(options);
}

async function main() {
  try {
    const options = parseArguments(process.argv.slice(2));
    if (options.help) {
      console.log(usage());
      return;
    }
    const result = await runCapture(options);
    console.log(JSON.stringify({
      status: options.check ? 'checked' : 'written',
      manifest: path.relative(options.projectRoot, result.manifestPath),
      contentSha256: result.manifest.contentSha256,
      rgbaSha256: result.manifest.payload.artifacts.rgba.sha256,
      pngSha256: result.manifest.payload.artifacts.png.sha256,
      browserReceipt: result.browserReceiptPath
        ? path.relative(options.projectRoot, result.browserReceiptPath)
        : undefined,
      browserReceiptContentSha256: result.browserReceipt?.contentSha256,
    }, null, 2));
  } catch (error) {
    console.error(`${error.message}\n\n${usage()}`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  await main();
}
