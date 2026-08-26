#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {chromium} from 'playwright';
import {PNG} from 'pngjs';

import {comparePngFiles} from './compare-images.mjs';
import {
  devOverlaySuppressionPass,
  finalizeNextDevOverlayCapture,
  suppressNextDevOverlayForCapture
} from './qa-next-dev-overlay.mjs';

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), '..');
const animationId = 'course-g04-l01-ir-001';
const sourceSha256 = 'b21b16d1e5756820b5703136708f625dcc3a324d629b2337b1dc42af64559e46';
const defaultBaseUrl = 'http://localhost:3213';
const evidenceRoot = path.join(projectRoot, 'migrations', animationId, 'evidence');
const screenshotRoot = path.join(projectRoot, 'output', 'playwright', `${animationId}-candidate-qa`);
const overlayHelperPath = path.join(projectRoot, 'scripts', 'qa-next-dev-overlay.mjs');

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function portable(filePath) {
  return path.relative(projectRoot, filePath).split(path.sep).join('/');
}

function parseArguments(argv) {
  const options = {baseUrl: defaultBaseUrl};
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === '--base-url') {
      if (!argv[index + 1]) throw new Error('--base-url requires a value');
      options.baseUrl = argv[index + 1];
      index += 1;
    } else if (value === '--help' || value === '-h') {
      options.help = true;
    } else {
      throw new Error(`Unknown option: ${value}`);
    }
  }
  return options;
}

function monitorPage(page, expectedOrigin, diagnostics) {
  const expected = new URL(expectedOrigin);
  const expectedEndpoint = `${expected.hostname}:${expected.port || (expected.protocol === 'https:' ? '443' : '80')}`;
  page.on('console', (message) => {
    if (message.type() === 'error') diagnostics.consoleErrors.push({url: page.url(), text: message.text()});
    if (message.type() === 'warning') diagnostics.consoleWarnings.push({url: page.url(), text: message.text()});
  });
  page.on('pageerror', (error) => diagnostics.pageErrors.push({url: page.url(), text: error.message}));
  page.on('requestfailed', (request) => {
    diagnostics.failedRequests.push({url: request.url(), error: request.failure()?.errorText || 'failed'});
  });
  page.on('response', (response) => {
    if (response.status() >= 400) diagnostics.httpErrors.push({url: response.url(), status: response.status()});
  });
  page.on('request', (request) => {
    const url = request.url();
    try {
      const parsed = new URL(url);
      if (['http:', 'https:', 'ws:', 'wss:'].includes(parsed.protocol)) {
        const secure = parsed.protocol === 'https:' || parsed.protocol === 'wss:';
        const endpoint = `${parsed.hostname}:${parsed.port || (secure ? '443' : '80')}`;
        if (endpoint !== expectedEndpoint || !['localhost', '127.0.0.1', '[::1]', '::1'].includes(parsed.hostname)) {
          diagnostics.unexpectedRequests.push(url);
        }
      }
    } catch {
      diagnostics.unexpectedRequests.push(url);
    }
  });
}

async function screenshot(page, locator, destination) {
  const devOverlaySuppression = await suppressNextDevOverlayForCapture(page, sha256);
  await mkdir(path.dirname(destination), {recursive: true});
  await locator.screenshot({path: destination, animations: 'disabled'});
  await finalizeNextDevOverlayCapture(page, devOverlaySuppression);
  const bytes = await readFile(destination);
  const png = PNG.sync.read(bytes);
  return {
    path: portable(destination),
    sha256: sha256(bytes),
    width: png.width,
    height: png.height,
    devOverlaySuppression
  };
}

async function waitForReadyStage(page, expectedFrame, expectedFrameDomain = 'sprite-58', expectedScenario = null) {
  const stage = page.locator('.faithful-stage-wrap').first();
  await stage.waitFor({state: 'visible', timeout: 30_000});
  await page.waitForFunction(
    ({frame, frameDomain, scenario}) => {
      const candidate = document.querySelector("[data-candidate-status='engineering-not-strict']");
      const wrap = document.querySelector('.faithful-stage-wrap');
      const canvas = wrap?.querySelector('canvas');
      return candidate?.getAttribute('data-canvas-status') === 'ready'
        && wrap?.getAttribute('data-flash-frame') === String(frame)
        && wrap?.getAttribute('data-flash-frame-domain') === frameDomain
        && (!scenario || wrap?.getAttribute('data-runtime-scenario') === scenario)
        && canvas?.getAttribute('data-flash-frame') === String(frame)
        && canvas?.getAttribute('data-flash-frame-domain') === frameDomain
        && (!scenario || canvas?.getAttribute('data-runtime-scenario') === scenario);
    },
    {frame: expectedFrame, frameDomain: expectedFrameDomain, scenario: expectedScenario},
    {timeout: 30_000}
  );
  return stage;
}

async function readStageState(page) {
  return page.evaluate(() => {
    const runtime = document.querySelector('.runtime-stage');
    const candidate = document.querySelector("[data-candidate-status='engineering-not-strict']");
    const wrap = document.querySelector('.faithful-stage-wrap');
    const canvas = wrap?.querySelector('canvas');
    const rect = wrap?.getBoundingClientRect();
    return {
      runtimeFrame: runtime?.getAttribute('data-flash-frame') || null,
      rendererFrame: wrap?.getAttribute('data-flash-frame') || null,
      canvasFrame: canvas?.getAttribute('data-flash-frame') || null,
      frameDomain: wrap?.getAttribute('data-flash-frame-domain') || null,
      canvasFrameDomain: canvas?.getAttribute('data-flash-frame-domain') || null,
      rootFrame: wrap?.getAttribute('data-flash-root-frame') || null,
      canvasRootFrame: canvas?.getAttribute('data-flash-root-frame') || null,
      requirementId: wrap?.getAttribute('data-flash-requirement-id') || null,
      traceId: wrap?.getAttribute('data-flash-trace-id') || null,
      entryStateSha256: wrap?.getAttribute('data-flash-entry-state-sha256') || null,
      scenario: wrap?.getAttribute('data-runtime-scenario') || null,
      canvasScenario: canvas?.getAttribute('data-runtime-scenario') || null,
      language: wrap?.getAttribute('data-runtime-language') || null,
      canvasLanguage: canvas?.getAttribute('data-runtime-language') || null,
      visualLocalizationStatus: wrap?.getAttribute('data-visual-localization-status') || null,
      canvasVisualLocalizationStatus:
        canvas?.getAttribute('data-visual-localization-status') || null,
      audioLocalizationStatus:
        candidate?.getAttribute('data-audio-localization-status') || null,
      audioStatus: candidate?.getAttribute('data-audio-status') || null,
      seed: wrap?.getAttribute('data-runtime-seed') || null,
      soundOutcome: wrap?.getAttribute('data-sound-outcome') || null,
      canvasStatus: candidate?.getAttribute('data-canvas-status') || null,
      nativePixels: canvas ? {width: canvas.width, height: canvas.height} : null,
      layout: rect ? {x: rect.x, right: rect.right, width: rect.width, height: rect.height} : null,
      document: {
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth
      }
    };
  });
}

async function deterministicCase(
  page,
  route,
  {frame, frameDomain = 'sprite-58', scenario, seed, lang = 'en'}
) {
  const requirementId = `qa-${frameDomain}-${scenario}-${lang}-${frame}`;
  const traceId = `qa-trace-${frameDomain}-${scenario}-${lang}-${frame}`;
  const entryStateSha256 = sha256(
    JSON.stringify({frame, frameDomain, scenario, lang, seed})
  );
  await page.goto(`${route}?frameDomain=${frameDomain}&frame=${frame}&scenario=${scenario}&lang=${lang}&seed=${seed}&requirementId=${encodeURIComponent(requirementId)}&trace=${encodeURIComponent(traceId)}&entryStateSha256=${entryStateSha256}&capture=1`, {
    waitUntil: 'domcontentloaded'
  });
  const stage = await waitForReadyStage(page, frame, frameDomain, scenario);
  const before = await readStageState(page);
  await page.waitForTimeout(250);
  const after = await readStageState(page);
  const capture = await screenshot(
    page,
    stage,
    path.join(
      screenshotRoot,
      `desktop-${lang}-${frameDomain}-${scenario}-frame-${String(frame).padStart(3, '0')}.png`
    )
  );
  return {
    requested: {
      frame,
      frameDomain,
      scenario,
      language: lang,
      seed,
      requirementId,
      traceId,
      entryStateSha256
    },
    before,
    after,
    frozen: before.runtimeFrame === String(frame)
      && before.rendererFrame === String(frame)
      && before.canvasFrame === String(frame)
      && before.frameDomain === frameDomain
      && before.canvasFrameDomain === frameDomain
      && before.scenario === scenario
      && before.canvasScenario === scenario
      && before.requirementId === requirementId
      && before.traceId === traceId
      && before.entryStateSha256 === entryStateSha256
      && after.runtimeFrame === String(frame)
      && after.rendererFrame === String(frame)
      && after.canvasFrame === String(frame)
      && after.frameDomain === frameDomain
      && after.canvasFrameDomain === frameDomain
      && after.scenario === scenario
      && after.canvasScenario === scenario
      && after.requirementId === requirementId
      && after.traceId === traceId
      && after.entryStateSha256 === entryStateSha256,
    capture
  };
}

async function activateReplay(browser, route, input, expectedOrigin, diagnostics) {
  const context = await browser.newContext({
    viewport: {width: 1280, height: 1000},
    deviceScaleFactor: 1,
    reducedMotion: 'no-preference'
  });
  const page = await context.newPage();
  monitorPage(page, expectedOrigin, diagnostics);
  await page.goto(`${route}?scenario=sound-0&lang=en&seed=0`, {waitUntil: 'domcontentloaded'});
  await page.waitForFunction(
    () => Number(document.querySelector('.runtime-stage')?.getAttribute('data-flash-frame')) >= 4,
    undefined,
    {timeout: 30_000}
  );
  const button = page.locator('.runtime-toolbar__actions').getByRole('button', {name: 'Replay', exact: true});
  const before = await page.evaluate(() => ({
    replay: Number(document.querySelector('.runtime-shell')?.getAttribute('data-runtime-replay')),
    frame: Number(document.querySelector('.runtime-stage')?.getAttribute('data-flash-frame'))
  }));
  await button.focus();
  if (input === 'mouse') await button.click();
  else await page.keyboard.press(input === 'enter' ? 'Enter' : 'Space');
  await page.waitForFunction(
    (expectedReplay) => Number(document.querySelector('.runtime-shell')?.getAttribute('data-runtime-replay')) === expectedReplay,
    before.replay + 1,
    {timeout: 10_000}
  );
  const reset = await page.evaluate(() => ({
    replay: Number(document.querySelector('.runtime-shell')?.getAttribute('data-runtime-replay')),
    frame: Number(document.querySelector('.runtime-stage')?.getAttribute('data-flash-frame'))
  }));
  await page.waitForFunction(
    (resetFrame) => Number(document.querySelector('.runtime-stage')?.getAttribute('data-flash-frame')) > resetFrame,
    reset.frame,
    {timeout: 10_000}
  );
  const resumedFrame = Number(await page.locator('.runtime-stage').getAttribute('data-flash-frame'));
  const result = {
    input,
    before,
    reset,
    resumedFrame,
    accessibleName: (await button.getAttribute('aria-label')) || (await button.textContent()),
    pass: reset.replay === before.replay + 1 && reset.frame <= 3 && resumedFrame > reset.frame
  };
  await context.close();
  return result;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    console.log('Usage: node scripts/qa-ir-001-candidate.mjs [--base-url http://localhost:3213]');
    return;
  }

  const baseUrl = options.baseUrl.replace(/\/$/, '');
  const route = `${baseUrl}/en/animations/${animationId}`;
  const expectedOrigin = new URL(baseUrl).origin;
  const diagnostics = {
    consoleErrors: [],
    consoleWarnings: [],
    pageErrors: [],
    failedRequests: [],
    httpErrors: [],
    unexpectedRequests: []
  };
  const browser = await chromium.launch({headless: true});
  const browserVersion = browser.version();

  const desktopContext = await browser.newContext({
    viewport: {width: 1280, height: 1000},
    deviceScaleFactor: 1,
    reducedMotion: 'no-preference'
  });
  const desktopPage = await desktopContext.newPage();
  monitorPage(desktopPage, expectedOrigin, diagnostics);
  const deterministic = [];
  for (const testCase of [
    {frame: 1, frameDomain: 'sprite-58', scenario: 'sound-from-seed', seed: 0},
    {frame: 71, frameDomain: 'sprite-58', scenario: 'sound-0', seed: 0},
    {frame: 142, frameDomain: 'sprite-58', scenario: 'sound-1', seed: 1}
  ]) {
    deterministic.push(await deterministicCase(desktopPage, route, testCase));
  }

  const rootStandalone = [];
  for (let frame = 1; frame <= 10; frame += 1) {
    const entry = await deterministicCase(desktopPage, route, {
      frame,
      frameDomain: 'root',
      scenario: 'root-standalone',
      seed: 0
    });
    const baseline = path.join(
      projectRoot,
      'artifacts',
      'full-frame',
      'pilot-baselines',
      animationId,
      'adobe-flash-player-32-standalone-default',
      `frame-${String(frame).padStart(4, '0')}.png`
    );
    const comparison = await comparePngFiles(
      baseline,
      path.join(projectRoot, entry.capture.path)
    );
    rootStandalone.push({
      ...entry,
      authoritativeBaseline: portable(baseline),
      normalizedRmse: comparison.normalizedRmse,
      staticThreshold: 0.05,
      atOrBelowStaticThreshold: comparison.normalizedRmse <= 0.05
    });
  }

  const spanish = {
    local: await deterministicCase(desktopPage, route, {
      frame: 71,
      frameDomain: 'sprite-58',
      scenario: 'sound-0',
      lang: 'es',
      seed: 0
    }),
    root: await deterministicCase(desktopPage, route, {
      frame: 10,
      frameDomain: 'root',
      scenario: 'root-standalone',
      lang: 'es',
      seed: 0
    })
  };

  const generatedManifestPath = path.join(
    projectRoot,
    'public',
    'flash-assets',
    'courses',
    animationId,
    'manifest.json'
  );
  const generatedManifestBytes = await readFile(generatedManifestPath);
  const generatedManifest = JSON.parse(generatedManifestBytes);
  const assetResponse = await desktopContext.request.get(
    `${baseUrl}/flash-assets/courses/${animationId}/canvas-renderer.js`
  );
  const assetBytes = await assetResponse.body();
  const generatedAsset = {
    status: assetResponse.status(),
    contentType: assetResponse.headers()['content-type'] || null,
    bytes: assetBytes.length,
    sha256: sha256(assetBytes)
  };
  const rootAssetManifestPath = path.join(
    projectRoot,
    'public',
    'flash-assets',
    'courses',
    animationId,
    'root-standalone',
    'manifest.json'
  );
  const rootAssetManifestBytes = await readFile(rootAssetManifestPath);
  const rootAssetManifest = JSON.parse(rootAssetManifestBytes);
  const rootAssets = [];
  for (const row of rootAssetManifest.frames) {
    const response = await desktopContext.request.get(
      `${baseUrl}/flash-assets/courses/${animationId}/root-standalone/${row.file}`
    );
    const bytes = await response.body();
    const png = PNG.sync.read(bytes);
    rootAssets.push({
      frame: row.frame,
      name: row.file,
      path: portable(path.join(path.dirname(rootAssetManifestPath), row.file)),
      expectedSha256: row.sha256,
      status: response.status(),
      contentType: response.headers()['content-type'] || null,
      bytes: bytes.length,
      sha256: sha256(bytes),
      width: png.width,
      height: png.height
    });
  }
  await desktopContext.close();

  const replay = [];
  for (const input of ['mouse', 'enter', 'space']) {
    replay.push(await activateReplay(browser, route, input, expectedOrigin, diagnostics));
  }

  const mobileContext = await browser.newContext({
    viewport: {width: 390, height: 844},
    deviceScaleFactor: 1,
    reducedMotion: 'no-preference'
  });
  const mobilePage = await mobileContext.newPage();
  monitorPage(mobilePage, expectedOrigin, diagnostics);
  await mobilePage.goto(`${route}?frame=142&scenario=sound-1&lang=en&seed=1`, {
    waitUntil: 'domcontentloaded'
  });
  const mobileStage = await waitForReadyStage(mobilePage, 142);
  const mobile = {
    state: await readStageState(mobilePage),
    screenshot: await screenshot(mobilePage, mobileStage, path.join(screenshotRoot, 'mobile-sound-1-frame-142.png'))
  };
  await mobileContext.close();

  const reducedContext = await browser.newContext({
    viewport: {width: 900, height: 760},
    deviceScaleFactor: 1,
    reducedMotion: 'reduce'
  });
  const reducedPage = await reducedContext.newPage();
  monitorPage(reducedPage, expectedOrigin, diagnostics);
  await reducedPage.goto(`${route}?scenario=sound-0&lang=en&seed=0`, {waitUntil: 'domcontentloaded'});
  const reducedStage = await waitForReadyStage(reducedPage, 142);
  const reducedBefore = await readStageState(reducedPage);
  await reducedPage.waitForTimeout(500);
  const reducedAfter = await readStageState(reducedPage);
  const reducedNote = reducedPage.locator('.reduced-motion-note[role="status"]');
  const reducedMotion = {
    before: reducedBefore,
    after: reducedAfter,
    noteVisible: await reducedNote.isVisible(),
    noteText: (await reducedNote.textContent())?.trim() || '',
    screenshot: await screenshot(reducedPage, reducedStage, path.join(screenshotRoot, 'reduced-motion-frame-142.png'))
  };
  await reducedContext.close();
  await browser.close();

  const sourcePath = path.join(
    projectRoot,
    'source-assets',
    'flash',
    'HELP MATH_ORIGINAL FILES',
    'HELP_COURSES',
    'ELMGR4',
    'L1',
    'IR',
    'L1RW01.swf'
  );
  const sourceBytes = await readFile(sourcePath);
  const producerBytes = await readFile(scriptPath);
  const overlayHelperBytes = await readFile(overlayHelperPath);
  const visualEvidencePath = path.join(evidenceRoot, 'nextjs-native-candidate-visual-evidence.json');
  const visualEvidenceBytes = await readFile(visualEvidencePath);
  const visualEvidence = JSON.parse(visualEvidenceBytes);
  const captureRecords = [
    ...deterministic.map(({capture}) => capture),
    ...rootStandalone.map(({capture}) => capture),
    spanish.local.capture,
    spanish.root.capture,
    mobile.screenshot,
    reducedMotion.screenshot
  ];

  const assertions = [
    {
      id: 'source-hash',
      pass: sha256(sourceBytes) === sourceSha256 && generatedManifest.inputs.sourceSwf.sha256 === sourceSha256
    },
    {
      id: 'generated-asset-hash',
      pass: generatedAsset.status === 200
        && generatedAsset.sha256 === generatedManifest.output.sha256
        && generatedAsset.bytes === generatedManifest.output.bytes,
      details: generatedAsset
    },
    {
      id: 'authoritative-root-asset-hashes',
      pass: rootAssetManifest.frameDomain === 'root'
        && rootAssetManifest.scenario === 'root-standalone'
        && rootAssetManifest.baseline?.sha256 === '53bd9c14495a29241ad64899a6ceebe600a43ac782f4a2ebbf75fe5c4e532fb9'
        && rootAssetManifest.frames?.length === 10
        && rootAssets.length === 10
        && rootAssets.every((asset) => asset.status === 200
          && asset.contentType === 'image/png'
          && asset.sha256 === asset.expectedSha256
          && asset.width === 800
          && asset.height === 600),
      details: {
        manifestPath: portable(rootAssetManifestPath),
        manifestSha256: sha256(rootAssetManifestBytes),
        assets: rootAssets
      }
    },
    {
      id: 'deterministic-native-stage',
      pass: deterministic.every((entry) => entry.frozen
        && entry.capture.width === 800
        && entry.capture.height === 600
        && entry.before.frameDomain === 'sprite-58'
        && entry.before.rootFrame === '6'
        && entry.before.nativePixels?.width === 800
        && entry.before.nativePixels?.height === 600)
    },
    {
      id: 'root-standalone-full-domain-addressability-and-rmse',
      pass: rootStandalone.length === 10
        && rootStandalone.every((entry, index) => entry.requested.frame === index + 1
          && entry.requested.frameDomain === 'root'
          && entry.requested.scenario === 'root-standalone'
          && entry.frozen
          && entry.before.rootFrame === String(index + 1)
          && entry.before.canvasRootFrame === String(index + 1)
          && entry.before.nativePixels?.width === 800
          && entry.before.nativePixels?.height === 600
          && entry.capture.width === 800
          && entry.capture.height === 600
          && entry.atOrBelowStaticThreshold),
      details: rootStandalone.map((entry) => ({
        requested: entry.requested,
        authoritativeBaseline: entry.authoritativeBaseline,
        capture: entry.capture,
        normalizedRmse: entry.normalizedRmse,
        staticThreshold: entry.staticThreshold,
        atOrBelowStaticThreshold: entry.atOrBelowStaticThreshold
      }))
    },
    {
      id: 'candidate-full-frame-capture-evidence',
      pass: visualEvidence.deterministicCapture.totalCapturedFrames === 426
        && visualEvidence.deterministicCapture.expectedCapturedFrames === 426
        && visualEvidence.acceptanceEffect.strictAcceptance === 'none'
    },
    ...replay.map((entry) => ({id: `replay-${entry.input}`, pass: entry.pass, details: entry})),
    {
      id: 'spanish-source-shared-untranslated-visual',
      pass: spanish.local.frozen
        && spanish.local.requested.language === 'es'
        && spanish.local.before.language === 'es'
        && spanish.local.before.canvasLanguage === 'es'
        && spanish.local.before.visualLocalizationStatus === 'source-shared-untranslated-visual'
        && spanish.local.before.canvasVisualLocalizationStatus === 'source-shared-untranslated-visual'
        && spanish.local.before.audioLocalizationStatus === 'unresolved'
        && spanish.local.before.audioStatus === 'blocked-not-rendered'
        && spanish.local.before.nativePixels?.width === 800
        && spanish.local.before.nativePixels?.height === 600
        && spanish.root.frozen
        && spanish.root.requested.language === 'es'
        && spanish.root.before.language === 'es'
        && spanish.root.before.canvasLanguage === 'es'
        && spanish.root.before.visualLocalizationStatus === 'source-shared-untranslated-visual'
        && spanish.root.before.canvasVisualLocalizationStatus === 'source-shared-untranslated-visual'
        && spanish.root.before.audioLocalizationStatus === 'unresolved'
        && spanish.root.before.audioStatus === 'blocked-not-rendered'
        && spanish.root.before.nativePixels?.width === 800
        && spanish.root.before.nativePixels?.height === 600
    },
    {
      id: 'mobile-responsive',
      pass: mobile.state.document.scrollWidth <= mobile.state.document.clientWidth
        && mobile.state.layout
        && mobile.state.layout.x >= -1
        && mobile.state.layout.right <= mobile.state.document.clientWidth + 1
        && Math.abs(mobile.state.layout.width / mobile.state.layout.height - 4 / 3) < 0.001
        && mobile.state.nativePixels?.width === 800
        && mobile.state.nativePixels?.height === 600,
      details: mobile.state
    },
    {
      id: 'reduced-motion-terminal-freeze',
      pass: reducedMotion.noteVisible
        && reducedMotion.before.runtimeFrame === '142'
        && reducedMotion.before.rendererFrame === '142'
        && reducedMotion.after.runtimeFrame === '142'
        && reducedMotion.after.rendererFrame === '142'
    },
    {
      id: 'next-dev-overlay-suppressed-before-and-after-every-screenshot',
      pass: captureRecords.length === 17
        && captureRecords.every(({devOverlaySuppression}) => devOverlaySuppressionPass(devOverlaySuppression)),
      details: {
        captureCount: captureRecords.length,
        captures: captureRecords.map(({path: capturePath, sha256: captureSha256, devOverlaySuppression}) => ({
          path: capturePath,
          sha256: captureSha256,
          devOverlaySuppression
        }))
      }
    },
    {
      id: 'console-and-network',
      pass: diagnostics.consoleErrors.length === 0
        && diagnostics.pageErrors.length === 0
        && diagnostics.failedRequests.length === 0
        && diagnostics.httpErrors.length === 0
        && diagnostics.unexpectedRequests.length === 0,
      details: diagnostics
    }
  ];

  const report = {
    schemaVersion: 1,
    animationId,
    generatedAt: new Date().toISOString(),
    status: assertions.every(({pass}) => pass) ? 'pass' : 'fail',
    scope: 'hash-bound source-shared en/es local-Canvas and Adobe-standalone root-domain engineering-candidate product QA',
    acceptanceEffect: 'none',
    strictAcceptanceEffect: false,
    generatedBy: {
      script: portable(scriptPath),
      scriptSha256: sha256(producerBytes),
      deterministic: false
    },
    captureGuard: {
      path: portable(overlayHelperPath),
      sha256: sha256(overlayHelperBytes),
      capturePageOnly: true
    },
    route: `/en/animations/${animationId}`,
    environment: {
      baseUrl,
      browser: `Chromium ${browserVersion}`,
      playwright: 'repository-pinned 1.61.1',
      serverMode: 'development',
      deviceScaleFactor: 1
    },
    source: {
      path: portable(sourcePath),
      sha256: sourceSha256
    },
    generatedAsset: {
      path: `public/flash-assets/courses/${animationId}/canvas-renderer.js`,
      ...generatedAsset,
      manifestPath: portable(generatedManifestPath),
      manifestSha256: sha256(generatedManifestBytes)
    },
    rootStandaloneAssets: {
      manifestPath: portable(rootAssetManifestPath),
      manifestSha256: sha256(rootAssetManifestBytes),
      authority: rootAssetManifest.authority,
      baseline: {
        path: rootAssetManifest.baseline.manifest,
        sha256: rootAssetManifest.baseline.sha256,
        runtime: rootAssetManifest.baseline.runtime,
        stage: rootAssetManifest.baseline.stage,
        fps: rootAssetManifest.baseline.fps,
        frameCount: rootAssetManifest.baseline.frameCount,
        language: rootAssetManifest.baseline.language
      },
      assets: rootAssets
    },
    visualCandidateEvidence: {
      path: portable(visualEvidencePath),
      sha256: sha256(visualEvidenceBytes),
      candidateCapturedFrames: visualEvidence.deterministicCapture.totalCapturedFrames,
      strictAcceptanceEffect: visualEvidence.acceptanceEffect.strictAcceptance
    },
    deterministic,
    rootStandalone,
    replay,
    spanish,
    mobile,
    reducedMotion,
    diagnostics,
    assertions,
    limitations: [
      'This QA validates the same source-derived local visual candidate and ten hash-bound Adobe standalone root captures in both requested language contexts. It does not claim a Spanish translation.',
      'The 426 implementation captures prove deterministic candidate coverage, not source parity; no authoritative original-host capture covers all 142 local frames for both random outcomes.',
      'Both embedded MP3 streams are intentionally omitted, and audio language, listening, cue timing, synchronization, stop, and Replay behavior remain unresolved.',
      'The root-domain raster frames reproduce the authoritative standalone captures but do not reconstruct the InternalPreloader or course-shell contract.',
      'The original course-shell contract, Spanish audio/host state, human full-frame review, and owner acceptance remain pending.',
      'No strict-validator completion or complete migration is claimed.'
    ],
    authorityBoundary: {
      authoritativeFullLocalTimelineBaseline: false,
      authoritativeRootStandaloneBaseline: true,
      rootStandaloneCandidateFullFrameRmseComplete: true,
      strictFullFrameRmse: false,
      audioParity: false,
      sourceSharedUntranslatedVisual: true,
      spanishParity: false,
      originalHostParity: false,
      humanVisualReview: false,
      ownerAcceptance: false,
      strictMigrationCompletion: false
    }
  };

  await mkdir(evidenceRoot, {recursive: true});
  const outputPath = path.join(evidenceRoot, 'nextjs-native-candidate-qa.json');
  await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({output: portable(outputPath), status: report.status, assertions}, null, 2));
  if (report.status !== 'pass') process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  main().catch((error) => {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  });
}
