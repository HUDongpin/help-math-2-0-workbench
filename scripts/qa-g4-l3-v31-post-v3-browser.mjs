#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {spawn} from 'node:child_process';
import {
  chmod,
  lstat,
  mkdir,
  open,
  readFile,
  rm,
} from 'node:fs/promises';
import {createServer as createNetServer} from 'node:net';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

import {
  BROWSER_QA_JSON,
  buildFullCurrentSourceInventory,
  DECLARED_FUNCTIONAL_PAGES,
  validateBrowserReportStructure,
} from './build-g4-l3-v31-post-v3-regression-receipt.mjs';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const WORKSPACE_ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
export const SCREENSHOT_ROOT =
  'output/playwright/g4-l3-v31-post-v3-current-js-regression';
const FORBIDDEN_PREVIEW_PORT = 3216;
const DEV_SERVER_READY_TIMEOUT_MS = 120_000;
const PAGE_READY_TIMEOUT_MS = 60_000;
const SHA256_PATTERN = /^[a-f0-9]{64}$/;

const RESPONSIVE_PROFILES = Object.freeze([
  Object.freeze({
    id: 'g4-es-mobile-reduced',
    route: '/es/courses/4/3',
    player: 'g4-l3-whole-lesson-mvp',
    viewport: Object.freeze({width: 390, height: 844}),
    reducedMotion: 'reduce',
  }),
  Object.freeze({
    id: 'g4-en-compact',
    route: '/courses/4/3',
    player: 'g4-l3-whole-lesson-mvp',
    viewport: Object.freeze({width: 700, height: 900}),
    reducedMotion: 'no-preference',
  }),
  Object.freeze({
    id: 'g5-es-tablet-reduced',
    route: '/es/courses/5/4',
    player: 'descriptor-driven-whole-lesson-audit',
    viewport: Object.freeze({width: 1024, height: 768}),
    reducedMotion: 'reduce',
  }),
  Object.freeze({
    id: 'g4-en-wide',
    route: '/courses/4/3',
    player: 'g4-l3-whole-lesson-mvp',
    viewport: Object.freeze({width: 1366, height: 900}),
    reducedMotion: 'no-preference',
  }),
  Object.freeze({
    id: 'g5-en-wide',
    route: '/courses/5/4',
    player: 'descriptor-driven-whole-lesson-audit',
    viewport: Object.freeze({width: 1600, height: 1000}),
    reducedMotion: 'no-preference',
  }),
]);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function absolute(relativePath) {
  invariant(
    typeof relativePath === 'string'
      && relativePath.length > 0
      && !path.isAbsolute(relativePath)
      && !relativePath.includes('\\')
      && relativePath.split('/').every((part) =>
        part !== '' && part !== '.' && part !== '..'
      ),
    'Artifact path must be safe and workspace-relative.',
  );
  return path.join(WORKSPACE_ROOT, relativePath);
}

async function binding(relativePath) {
  const bytes = await readFile(absolute(relativePath));
  return {
    path: relativePath,
    bytes: bytes.length,
    sha256: sha256(bytes),
  };
}

export function parseBrowserArguments(argv) {
  const modes = argv.filter((value) => ['--run', '--check'].includes(value));
  invariant(
    argv.length === 1 && modes.length === 1,
    'Use exactly one mode: --run or --check.',
  );
  return modes[0].slice(2);
}

export function validateEphemeralPort(port) {
  invariant(Number.isSafeInteger(port) && port > 0 && port <= 65_535,
    'Browser QA port must be a valid TCP port.');
  invariant(port !== FORBIDDEN_PREVIEW_PORT,
    'Browser QA refuses frozen v3 preview port 3216.');
  return port;
}

export async function findEphemeralLoopbackPort(excluded = []) {
  const excludedPorts = new Set([FORBIDDEN_PREVIEW_PORT, ...excluded]);
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const server = createNetServer();
    const port = await new Promise((resolve, reject) => {
      const onError = (error) => reject(error);
      server.once('error', onError);
      server.listen({host: '127.0.0.1', port: 0, exclusive: true}, () => {
        server.off('error', onError);
        const address = server.address();
        if (!address || typeof address === 'string') {
          server.close();
          reject(new Error('Unable to allocate a loopback browser-QA port.'));
          return;
        }
        server.close((error) => {
          if (error) reject(error);
          else resolve(address.port);
        });
      });
    });
    if (!excludedPorts.has(port)) return validateEphemeralPort(port);
  }
  throw new Error('Unable to allocate a distinct loopback browser-QA port.');
}

async function pathExists(relativePath) {
  try {
    await lstat(absolute(relativePath));
    return true;
  } catch (error) {
    if (error?.code === 'ENOENT') return false;
    throw error;
  }
}

async function stopChild(child) {
  if (!child || child.exitCode !== null) return;
  child.kill('SIGTERM');
  await new Promise((resolve) => {
    const timer = setTimeout(resolve, 4_000);
    child.once('exit', () => {
      clearTimeout(timer);
      resolve();
    });
  });
  if (child.exitCode === null) child.kill('SIGKILL');
}

async function waitForServer(baseUrl, child, logs) {
  const deadline = Date.now() + DEV_SERVER_READY_TIMEOUT_MS;
  while (Date.now() < deadline) {
    invariant(child.exitCode === null,
      `Browser-QA server exited before ready.\n${logs.join('')}`);
    try {
      const response = await fetch(`${baseUrl}/courses/4/3`);
      if (response.status === 200) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Timed out waiting for browser-QA server.\n${logs.join('')}`);
}

async function startDevServer(port) {
  validateEphemeralPort(port);
  const nextBin = path.join(
    WORKSPACE_ROOT,
    'node_modules/next/dist/bin/next',
  );
  const environment = {
    ...process.env,
    G4_L3_CEO_PREVIEW_ENABLED: '1',
    G5_L4_CEO_PREVIEW_ENABLED: '1',
    NEXT_TELEMETRY_DISABLED: '1',
  };
  delete environment.VERCEL_ENV;
  delete environment.G4_L3_WHOLE_LESSON_PACKAGE;
  delete environment.G5_L4_WHOLE_LESSON_PACKAGE;
  const child = spawn(process.execPath, [
    nextBin,
    'dev',
    'apps/web',
    '--hostname',
    '127.0.0.1',
    '--port',
    String(port),
  ], {
    cwd: WORKSPACE_ROOT,
    env: environment,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const logs = [];
  child.stdout.on('data', (chunk) => logs.push(chunk.toString()));
  child.stderr.on('data', (chunk) => logs.push(chunk.toString()));
  const baseUrl = `http://127.0.0.1:${port}`;
  try {
    await waitForServer(baseUrl, child, logs);
    return {baseUrl, child, logs};
  } catch (error) {
    await stopChild(child);
    throw error;
  }
}

function createEventLedger() {
  return {
    consoleErrors: [],
    pageErrors: [],
    failedRequests: [],
    badHttpResponses: [],
    externalRequests: [],
    ignoredAbortedRscRequests: [],
    ignoredAbortedSameOriginKeyTermsRequests: [],
  };
}

function attachMonitor(page, baseUrl, ledger) {
  page.on('console', (message) => {
    if (message.type() === 'error') ledger.consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => ledger.pageErrors.push(error.message));
  page.on('request', (request) => {
    const url = request.url();
    if (/^(?:data:|blob:|about:)/.test(url)) return;
    if (/^https?:/.test(url) && !url.startsWith(baseUrl)) {
      ledger.externalRequests.push(url);
    }
  });
  page.on('requestfailed', (request) => {
    const url = request.url();
    const failure = request.failure()?.errorText ?? 'unknown';
    let parsed = null;
    try {
      parsed = new URL(url);
    } catch {}
    if (failure === 'net::ERR_ABORTED' && parsed?.searchParams.has('_rsc')) {
      ledger.ignoredAbortedRscRequests.push({url, failure});
      return;
    }
    if (
      failure === 'net::ERR_ABORTED'
      && parsed?.origin === baseUrl
      && /^\/generated\/g4-grade-wide-keyterms-(?:en|es)\.json$/
        .test(parsed.pathname)
    ) {
      ledger.ignoredAbortedSameOriginKeyTermsRequests.push({
        url,
        failure,
        disposition: 'superseded-by-whole-lesson-page-navigation',
      });
      return;
    }
    ledger.failedRequests.push({url, failure});
  });
  page.on('response', (response) => {
    if (response.status() >= 400) {
      ledger.badHttpResponses.push({
        url: response.url(),
        status: response.status(),
      });
    }
  });
}

async function newObservedPage(browser, baseUrl, ledger, options) {
  const page = await browser.newPage(options);
  attachMonitor(page, baseUrl, ledger);
  await page.addInitScript(() => {
    try {
      window.localStorage.clear();
      window.sessionStorage.clear();
    } catch {}
  });
  return page;
}

async function openCourse(page, baseUrl, route, playerIdentity) {
  const response = await page.goto(`${baseUrl}${route}`, {
    waitUntil: 'domcontentloaded',
    timeout: PAGE_READY_TIMEOUT_MS,
  });
  invariant(response?.status() === 200,
    `Course route ${route} returned ${response?.status()}.`);
  const selector = `[data-lesson-player="${playerIdentity}"]`;
  const player = page.locator(selector);
  await player.waitFor({state: 'visible', timeout: PAGE_READY_TIMEOUT_MS});
  await page.waitForFunction(
    (value) => document.querySelector(value)?.getAttribute('data-hydrated') === 'true',
    selector,
    {timeout: PAGE_READY_TIMEOUT_MS},
  );
  return player;
}

async function waitForCurrentAnimation(page, playerIdentity, animationId) {
  await page.waitForFunction(
    ({identity, expected}) => {
      const player = document.querySelector(
        `[data-lesson-player="${identity}"]`,
      );
      const runtime = player?.querySelector('.runtime-stage');
      return player?.getAttribute('data-current-animation-id') === expected
        && runtime?.getAttribute('data-animation-id') === expected;
    },
    {identity: playerIdentity, expected: animationId},
    {timeout: PAGE_READY_TIMEOUT_MS},
  );
}

async function runtimeObservation(player, animationId) {
  return player.evaluate((element, expected) => {
    const runtimes = [...element.querySelectorAll('.runtime-stage')];
    return {
      animationId: expected,
      runtimeCount: runtimes.length,
      runtimeAnimationId:
        runtimes[0]?.getAttribute('data-animation-id') ?? null,
      forbiddenLegacyEmbedCount:
        element.querySelectorAll('object, embed, [data-legacy-swf-embed]').length,
    };
  }, animationId);
}

async function traverseWholeLesson({
  baseUrl,
  browser,
  ledger,
  locale,
  grade,
  lesson,
  playerIdentity,
  expectedCount,
  viewport,
  reducedMotion = 'no-preference',
}) {
  const page = await newObservedPage(browser, baseUrl, ledger, {
    viewport,
    reducedMotion,
  });
  try {
    const route = `${locale === 'es' ? '/es' : ''}/courses/${grade}/${lesson}`;
    const player = await openCourse(page, baseUrl, route, playerIdentity);
    const picker = player.locator('select').first();
    const animationIds = await picker.locator('option').evaluateAll((options) =>
      options.map((option) => option.value)
    );
    invariant(animationIds.length === expectedCount,
      `${route} exposes ${animationIds.length}, expected ${expectedCount}.`);
    invariant(new Set(animationIds).size === expectedCount,
      `${route} contains duplicate page IDs.`);
    const runtimeObservations = [];
    for (const animationId of animationIds) {
      await picker.selectOption(animationId);
      await waitForCurrentAnimation(page, playerIdentity, animationId);
      const observation = await runtimeObservation(player, animationId);
      invariant(observation.runtimeCount === 1,
        `${route} ${animationId} rendered ${observation.runtimeCount} runtimes.`);
      invariant(observation.runtimeAnimationId === animationId,
        `${route} runtime identity drifted at ${animationId}.`);
      invariant(observation.forbiddenLegacyEmbedCount === 0,
        `${route} rendered a forbidden legacy embed.`);
      runtimeObservations.push(observation);
    }
    return {
      locale,
      route,
      pageCount: animationIds.length,
      animationIds,
      runtimeObservations,
    };
  } finally {
    await page.close();
  }
}

async function observeFunctionalPages(page, player) {
  const picker = player.locator('select').first();
  const rows = [];
  for (const declared of DECLARED_FUNCTIONAL_PAGES) {
    await picker.selectOption(declared.animationId);
    await waitForCurrentAnimation(
      page,
      'g4-l3-whole-lesson-mvp',
      declared.animationId,
    );
    const row = await player.evaluate((element, animationId) => {
      const functionalMarkers = element.querySelectorAll([
        '[data-current-js-functional-candidate="true"]',
        '[data-current-js-functional-entry]',
        '[data-current-js-functional-scope]',
        '[data-current-js-modern-reconstruction="true"]',
      ].join(','));
      const boundary = element.querySelector(
        '[data-strict-acceptance-effect="none"]',
      );
      const runtime = element.querySelector('.runtime-stage');
      return {
        animationId,
        runtimeCount: element.querySelectorAll('.runtime-stage').length,
        runtimeAnimationId: runtime?.getAttribute('data-animation-id') ?? null,
        currentJsFunctionalMarkerCount: functionalMarkers.length,
        strictAcceptanceEffect:
          boundary?.getAttribute('data-strict-acceptance-effect') ?? null,
        strictMigrationComplete:
          boundary?.getAttribute('data-strict-migration-complete') === 'true',
      };
    }, declared.animationId);
    invariant(row.runtimeCount === 1
      && row.runtimeAnimationId === declared.animationId,
    `Functional page ${declared.animationId} lost its primary runtime.`);
    invariant(row.currentJsFunctionalMarkerCount >= 1,
      `Functional page ${declared.animationId} lacks a current-JS marker.`);
    invariant(row.strictAcceptanceEffect === 'none'
      && row.strictMigrationComplete === false,
    `Functional page ${declared.animationId} changed strict acceptance.`);
    rows.push(row);
  }
  return rows;
}

async function exerciseKeyTerms(page, player, animationId) {
  const picker = player.locator('select').first();
  await picker.selectOption(animationId);
  await waitForCurrentAnimation(page, 'g4-l3-whole-lesson-mvp', animationId);
  const trigger = player.locator(
    '[data-source-glossary-placement="visible-stage-content-bottom"] '
      + 'button[data-source-key-attribute]:not([disabled])',
  ).first();
  await trigger.waitFor({state: 'visible', timeout: 45_000});
  const triggerKey = await trigger.getAttribute('data-source-key-attribute');
  invariant(triggerKey, `${animationId} source key-term trigger lacks key identity.`);
  await trigger.focus();
  await trigger.click();
  await page.waitForFunction(() => {
    const shell = document.querySelector('[data-active-tool="key-terms"]');
    const browser = shell?.querySelector(
      '.lesson-shell2__key-terms-browser[data-host-selection-resolution="matched-local-entry"]',
    );
    return Boolean(shell && browser);
  }, null, {timeout: PAGE_READY_TIMEOUT_MS});
  const browser = player.locator(
    '.lesson-shell2__key-terms-browser[data-host-selection-resolution="matched-local-entry"]',
  );
  const selectionResolved = await browser.count() === 1;
  const runtimeCount = await player.locator('.runtime-stage').count();
  const close = player.locator('button[aria-label="Close tool"]');
  await close.click();
  await page.waitForFunction(() =>
    document.querySelector('[data-lesson-player="g4-l3-whole-lesson-mvp"]')
      ?.querySelector('[data-active-tool="none"]'),
  null, {timeout: PAGE_READY_TIMEOUT_MS});
  await page.waitForTimeout(100);
  const focusedKey = await page.evaluate(() =>
    document.activeElement?.getAttribute('data-source-key-attribute') ?? null
  );
  const focusRestored = focusedKey === triggerKey;
  let sourceStopHeldAfterClose = false;
  let explicitResumeClearedHold = false;
  if (animationId === 'course-g04-l03-rw-003') {
    sourceStopHeldAfterClose =
      await player.getAttribute('data-source-stop-hold') === 'true';
    const resume = player.locator('[data-source-stop-resume-control="true"]');
    await resume.waitFor({state: 'visible', timeout: PAGE_READY_TIMEOUT_MS});
    await resume.click();
    await page.waitForFunction(() =>
      document.querySelector('[data-lesson-player="g4-l3-whole-lesson-mvp"]')
        ?.getAttribute('data-source-stop-hold') === 'false',
    null, {timeout: PAGE_READY_TIMEOUT_MS});
    explicitResumeClearedHold = true;
  }
  invariant(selectionResolved, `${animationId} key-term selection did not resolve.`);
  invariant(runtimeCount === 1, `${animationId} opened a second runtime.`);
  invariant(focusRestored, `${animationId} did not restore focus after close.`);
  if (animationId === 'course-g04-l03-rw-003') {
    invariant(sourceStopHeldAfterClose && explicitResumeClearedHold,
      'RW003 source-stop semantics failed.');
  }
  return {
    animationId,
    opened: true,
    selectionResolved,
    closed: true,
    focusRestored,
    runtimeCount,
    sourceStopHeldAfterClose,
    explicitResumeClearedHold,
  };
}

async function inspectStandaloneIsolation(browser, baseUrl, ledger) {
  const page = await newObservedPage(browser, baseUrl, ledger, {
    viewport: {width: 1366, height: 900},
  });
  try {
    const route = '/animations/course-g04-l03-vb-005'
      + '?scenario=source-static-frame&lang=en&seed=0';
    const response = await page.goto(`${baseUrl}${route}`, {
      waitUntil: 'domcontentloaded',
      timeout: PAGE_READY_TIMEOUT_MS,
    });
    invariant(response?.status() === 200,
      `Standalone host-isolation route returned ${response?.status()}.`);
    const marker = page.locator(
      '[data-current-js-functional-scope="source-keyattribute-keyterms-host-adapter"]',
    ).first();
    await marker.waitFor({state: 'attached', timeout: PAGE_READY_TIMEOUT_MS});
    const controlsEnabled =
      await marker.getAttribute('data-current-js-controls-enabled') === 'true';
    const hostToolOpened = await page.locator(
      '[data-active-tool="key-terms"]',
    ).count() > 0;
    const failedClosed = !controlsEnabled && !hostToolOpened;
    invariant(failedClosed,
      'Standalone animation route did not fail closed without a lesson host.');
    return {route, controlsEnabled, hostToolOpened, failedClosed};
  } finally {
    await page.close();
  }
}

async function observeResponsiveProfile(
  browser,
  baseUrl,
  ledger,
  profile,
) {
  const page = await newObservedPage(browser, baseUrl, ledger, {
    viewport: profile.viewport,
    reducedMotion: profile.reducedMotion,
  });
  try {
    const player = await openCourse(
      page,
      baseUrl,
      profile.route,
      profile.player,
    );
    await player.locator('.runtime-stage').waitFor({
      state: 'attached',
      timeout: PAGE_READY_TIMEOUT_MS,
    });
    const observation = await page.evaluate(() => ({
      documentClientWidth: document.documentElement.clientWidth,
      documentScrollWidth: document.documentElement.scrollWidth,
      horizontalOverflowPx: Math.max(
        0,
        document.documentElement.scrollWidth
          - document.documentElement.clientWidth,
      ),
      reducedMotionMatches:
        matchMedia('(prefers-reduced-motion: reduce)').matches,
    }));
    const runtimeCount = await player.locator('.runtime-stage').count();
    invariant(observation.horizontalOverflowPx <= 1,
      `${profile.id} has ${observation.horizontalOverflowPx}px overflow.`);
    invariant(runtimeCount === 1, `${profile.id} does not have one runtime.`);
    const relativePath = `${SCREENSHOT_ROOT}/${profile.id}.png`;
    await page.screenshot({
      animations: 'disabled',
      fullPage: true,
      path: absolute(relativePath),
    });
    return {
      id: profile.id,
      route: profile.route,
      viewport: profile.viewport,
      reducedMotion: profile.reducedMotion,
      runtimeCount,
      ...observation,
      screenshot: await binding(relativePath),
    };
  } finally {
    await page.close();
  }
}

async function runBrowserQa() {
  invariant(!await pathExists(BROWSER_QA_JSON),
    `Immutable browser report already exists: ${BROWSER_QA_JSON}`);
  invariant(!await pathExists(SCREENSHOT_ROOT),
    `Immutable screenshot root already exists: ${SCREENSHOT_ROOT}`);
  await mkdir(path.dirname(absolute(SCREENSHOT_ROOT)), {recursive: true});
  await mkdir(absolute(SCREENSHOT_ROOT), {recursive: false, mode: 0o755});
  let server = null;
  let browser = null;
  try {
    const inventoryBefore = await buildFullCurrentSourceInventory();
    const port = await findEphemeralLoopbackPort();
    server = await startDevServer(port);
    const ledger = createEventLedger();
    const {chromium} = await import('playwright');
    browser = await chromium.launch({headless: true});
    const g4En = await traverseWholeLesson({
      baseUrl: server.baseUrl,
      browser,
      ledger,
      locale: 'en',
      grade: 4,
      lesson: 3,
      playerIdentity: 'g4-l3-whole-lesson-mvp',
      expectedCount: 39,
      viewport: {width: 1600, height: 1000},
    });
    const g4Es = await traverseWholeLesson({
      baseUrl: server.baseUrl,
      browser,
      ledger,
      locale: 'es',
      grade: 4,
      lesson: 3,
      playerIdentity: 'g4-l3-whole-lesson-mvp',
      expectedCount: 39,
      viewport: {width: 390, height: 844},
      reducedMotion: 'reduce',
    });
    const g5En = await traverseWholeLesson({
      baseUrl: server.baseUrl,
      browser,
      ledger,
      locale: 'en',
      grade: 5,
      lesson: 4,
      playerIdentity: 'descriptor-driven-whole-lesson-audit',
      expectedCount: 54,
      viewport: {width: 1600, height: 1000},
    });
    const g5Es = await traverseWholeLesson({
      baseUrl: server.baseUrl,
      browser,
      ledger,
      locale: 'es',
      grade: 5,
      lesson: 4,
      playerIdentity: 'descriptor-driven-whole-lesson-audit',
      expectedCount: 54,
      viewport: {width: 390, height: 844},
      reducedMotion: 'reduce',
    });

    const functionalPage = await newObservedPage(
      browser,
      server.baseUrl,
      ledger,
      {viewport: {width: 1366, height: 900}},
    );
    let featureObservations;
    let keyTermsHostInteractions;
    try {
      const player = await openCourse(
        functionalPage,
        server.baseUrl,
        '/courses/4/3',
        'g4-l3-whole-lesson-mvp',
      );
      featureObservations = await observeFunctionalPages(functionalPage, player);
      keyTermsHostInteractions = [];
      for (const animationId of [
        'course-g04-l03-vb-005',
        'course-g04-l03-vb-006',
        'course-g04-l03-rw-003',
      ]) {
        keyTermsHostInteractions.push(
          await exerciseKeyTerms(functionalPage, player, animationId),
        );
      }
    } finally {
      await functionalPage.close();
    }

    const g5IsolationPage = await newObservedPage(
      browser,
      server.baseUrl,
      ledger,
      {viewport: {width: 1366, height: 900}},
    );
    let g5Isolation;
    try {
      const g5Player = await openCourse(
        g5IsolationPage,
        server.baseUrl,
        '/courses/5/4',
        'descriptor-driven-whole-lesson-audit',
      );
      g5Isolation = await g5Player.evaluate((element) => ({
        g4SourceGlossarySurfaceCount: element.querySelectorAll(
          '.course-g04-l03-source-glossary-companion, '
            + '.course-g04-l03-source-glossary-stage-hotspots, '
            + '[data-source-glossary-placement="visible-stage-content-bottom"]',
        ).length,
        g4SourceStopHoldCount: element.querySelectorAll(
          '[data-source-stop-hold="true"]',
        ).length,
        g4HostSelectionCount: element.querySelectorAll(
          '[data-host-selection-source-animation-id^="course-g04-l03-"]',
        ).length,
      }));
      g5Isolation.passed = Object.values(g5Isolation).every((value) =>
        value === 0
      );
      invariant(g5Isolation.passed, 'G5 L4 leaked a G4 L3 host interaction.');
    } finally {
      await g5IsolationPage.close();
    }

    const standaloneHostIsolation = await inspectStandaloneIsolation(
      browser,
      server.baseUrl,
      ledger,
    );
    const responsiveObservations = [];
    for (const profile of RESPONSIVE_PROFILES) {
      responsiveObservations.push(await observeResponsiveProfile(
        browser,
        server.baseUrl,
        ledger,
        profile,
      ));
    }
    const inventoryAfter = await buildFullCurrentSourceInventory();
    invariant(stableJson(inventoryBefore.summary) ===
      stableJson(inventoryAfter.summary),
    'Authored source changed during browser QA.');
    for (const key of [
      'consoleErrors',
      'pageErrors',
      'failedRequests',
      'badHttpResponses',
      'externalRequests',
    ]) {
      invariant(ledger[key].length === 0,
        `Browser QA recorded ${ledger[key].length} ${key}: `
          + JSON.stringify(ledger[key]));
    }
    const report = {
      schemaVersion: 1,
      reportType: 'g4-l3-v31-post-v3-browser-qa',
      generatedAt: new Date().toISOString(),
      summary: {
        status: 'pass-current-js-regression',
        activePages: 39,
        courseShells: 1,
        releaseMembers: 40,
        strictCompleteMembers: 0,
        published: false,
        g4LocalePageVisits: 78,
        g5LocalePageVisits: 108,
        declaredFunctionalPagesObserved: 11,
        sourceBoundKeyTermInteractions: 3,
        failureCount: 0,
      },
      server: {
        host: '127.0.0.1',
        port,
        allocation: 'ephemeral-exclusive-loopback-preflight',
        frozenV3Port3216Touched: false,
      },
      sourceInventory: inventoryAfter.summary,
      wholeLessonTraversal: {
        g4L3: {en: g4En, es: g4Es},
        g5L4: {en: g5En, es: g5Es},
      },
      featureObservations,
      keyTermsHostInteractions,
      standaloneHostIsolation,
      g5Isolation,
      responsiveObservations: responsiveObservations.map(({screenshot, ...row}) => row),
      reducedMotion: {
        verified: responsiveObservations
          .filter((row) => row.reducedMotion === 'reduce')
          .every((row) => row.reducedMotionMatches === true),
        profileIds: responsiveObservations
          .filter((row) => row.reducedMotion === 'reduce')
          .map((row) => row.id),
      },
      events: ledger,
      screenshots: responsiveObservations.map((row) => row.screenshot),
      authority: {
        strictAcceptanceEffect: 'none',
        originalRuntimeFidelityEstablished: false,
        fullFrameFidelityEstablished: false,
        humanVisualAccepted: false,
        audioListeningAccepted: false,
        ownerAccepted: false,
        strictMigrationComplete: false,
        publicRelease: false,
      },
    };
    const failures = validateBrowserReportStructure(report);
    invariant(failures.length === 0,
      `Browser report structure failed: ${failures.join('; ')}`);
    const handle = await open(absolute(BROWSER_QA_JSON), 'wx', 0o444);
    try {
      await handle.writeFile(stableJson(report));
      await handle.sync();
    } finally {
      await handle.close();
    }
    await chmod(absolute(BROWSER_QA_JSON), 0o444);
    process.stdout.write(stableJson({
      status: report.summary.status,
      report: BROWSER_QA_JSON,
      screenshotRoot: SCREENSHOT_ROOT,
      port,
    }));
  } catch (error) {
    await rm(absolute(BROWSER_QA_JSON), {force: true});
    await rm(absolute(SCREENSHOT_ROOT), {recursive: true, force: true});
    throw error;
  } finally {
    if (browser) await browser.close();
    await stopChild(server?.child);
  }
}

async function checkBrowserQa() {
  const report = JSON.parse(await readFile(absolute(BROWSER_QA_JSON), 'utf8'));
  const failures = validateBrowserReportStructure(report);
  invariant(failures.length === 0,
    `Browser QA report check failed: ${failures.join('; ')}`);
  invariant(report.server.port !== FORBIDDEN_PREVIEW_PORT,
    'Browser QA report illegally targets frozen v3 port 3216.');
  const currentInventory = await buildFullCurrentSourceInventory();
  invariant(stableJson(currentInventory.summary) ===
    stableJson(report.sourceInventory),
  'Current source inventory drifted from browser QA.');
  for (const expected of report.screenshots) {
    invariant(expected.path.startsWith(`${SCREENSHOT_ROOT}/`),
      `Unexpected screenshot root: ${expected.path}`);
    const actual = await binding(expected.path);
    invariant(stableJson(actual) === stableJson(expected),
      `Browser screenshot drifted: ${expected.path}`);
  }
  invariant(report.screenshots.every((row) =>
    row.bytes > 0 && SHA256_PATTERN.test(row.sha256)
  ), 'Browser screenshot binding is malformed.');
  process.stdout.write(stableJson({
    status: 'pass-current-js-browser-regression-check',
    report: BROWSER_QA_JSON,
    screenshotCount: report.screenshots.length,
  }));
}

async function main() {
  const mode = parseBrowserArguments(process.argv.slice(2));
  if (mode === 'run') await runBrowserQa();
  else await checkBrowserQa();
}

if (process.argv[1]
  && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  main().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.stack : error}\n`);
    process.exitCode = 1;
  });
}
