#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {chromium} from 'playwright';
import {PNG} from 'pngjs';

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), '..');
const animationId = 'course-g03-l08-re-001';
const sourceSha256 = 'e4a6403f6b45a3b4aecb48e0659aa20113acb0644e37b027a19fb51f34417f9b';
const defaultBaseUrl = 'http://127.0.0.1:3213';
const qaSeed = 7;
const sourcePath = path.join(
  projectRoot,
  'source-assets',
  'flash',
  'HELP MATH_ORIGINAL FILES',
  'HELP_COURSES',
  'ELMGR3',
  'L8',
  'RE',
  'L8RE01.swf'
);
const migrationPath = path.join(projectRoot, 'migrations', animationId, 'migration.json');
const coveragePath = path.join(
  projectRoot,
  'migrations',
  animationId,
  'evidence',
  'full-frame-coverage.json'
);
const outputPath = path.join(
  projectRoot,
  'migrations',
  animationId,
  'evidence',
  'native-canvas-candidate-qa.json'
);
const screenshotRoot = path.join(
  projectRoot,
  'output',
  'playwright',
  `${animationId}-candidate-qa`
);
const implementationFiles = Object.freeze([
  'packages/demos/src/modules/course-g03-l08-re-001.tsx',
  'packages/demos/src/timelines/course-g03-l08-re-001.ts',
  'packages/demos/tests/course-g03-l08-re-001.test.ts',
  'packages/demos/src/contract.ts',
  'packages/demos/src/runtime.ts',
  'apps/web/components/animation-runtime.tsx',
  'migrations/course-g03-l08-re-001/audit/bilingual-visual-source-disposition.json'
]);
const matrixLanguages = Object.freeze(['en', 'es']);
export const RE001_CANDIDATE_QA_MATRIX_CASES = Object.freeze([
  Object.freeze({
    frame: 51,
    frameDomain: 'root',
    rootFrame: 51,
    scenario: 'root-standalone',
    language: 'en',
    blocker: null,
    visualLocalizationStatus: 'source-shared-untranslated-visual'
  }),
  Object.freeze({
    frame: 51,
    frameDomain: 'root',
    rootFrame: 51,
    scenario: 'root-standalone',
    language: 'es',
    blocker: null,
    visualLocalizationStatus: 'source-shared-untranslated-visual'
  }),
  Object.freeze({
    frame: 1,
    frameDomain: 'sprite-621',
    rootFrame: 51,
    scenario: 'default',
    language: 'en',
    blocker: 'reviewans-host-state-unavailable',
    visualLocalizationStatus: 'host-dependent-unresolved'
  }),
  Object.freeze({
    frame: 1,
    frameDomain: 'sprite-621',
    rootFrame: 51,
    scenario: 'default',
    language: 'es',
    blocker: 'spanish-host-state-not-source-proven',
    visualLocalizationStatus: 'host-dependent-unresolved'
  }),
  Object.freeze({
    frame: 1,
    frameDomain: 'sprite-621',
    rootFrame: 51,
    scenario: 'host-review-unavailable',
    language: 'en',
    blocker: 'reviewans-host-state-unavailable',
    visualLocalizationStatus: 'host-dependent-unresolved'
  }),
  Object.freeze({
    frame: 1,
    frameDomain: 'sprite-621',
    rootFrame: 51,
    scenario: 'host-review-unavailable',
    language: 'es',
    blocker: 'spanish-host-state-not-source-proven',
    visualLocalizationStatus: 'host-dependent-unresolved'
  }),
  Object.freeze({
    frame: 1,
    frameDomain: 'sprite-621',
    rootFrame: 51,
    scenario: 'legacy-back-unavailable',
    language: 'en',
    blocker: 'javascript-history-side-effect-disabled',
    visualLocalizationStatus: 'host-dependent-unresolved'
  }),
  Object.freeze({
    frame: 1,
    frameDomain: 'sprite-621',
    rootFrame: 51,
    scenario: 'legacy-back-unavailable',
    language: 'es',
    blocker: 'spanish-host-state-not-source-proven',
    visualLocalizationStatus: 'host-dependent-unresolved'
  })
]);
const matrixCases = RE001_CANDIDATE_QA_MATRIX_CASES;
export const DEV_OVERLAY_CAPTURE_STYLE_ID = 'help-math-re-qa-hide-next-dev-overlay';
export const DEV_OVERLAY_CONTROL_SELECTOR = [
  'button',
  "[role='button']",
  '[data-nextjs-dev-tools-button]',
  '#next-logo',
  '[data-next-badge-root]'
].join(',');
export const DEV_OVERLAY_CAPTURE_CSS = [
  "script[data-nextjs-dev-overlay='true']",
  'nextjs-portal'
].join(',') + '{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important}';

export function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function portable(filePath) {
  return path.relative(projectRoot, filePath).split(path.sep).join('/');
}

export function normalizeLoopbackBaseUrl(value) {
  const parsed = new URL(value);
  const loopbackHosts = new Set(['localhost', '127.0.0.1', '[::1]']);
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('--base-url must use http or https');
  }
  if (!loopbackHosts.has(parsed.hostname)) {
    throw new Error('--base-url must use localhost, 127.0.0.1, or [::1]');
  }
  if (
    parsed.username ||
    parsed.password ||
    parsed.search ||
    parsed.hash ||
    (parsed.pathname && parsed.pathname !== '/')
  ) {
    throw new Error('--base-url must be a loopback origin without credentials, path, query, or hash');
  }
  return parsed.origin;
}

export function parseArguments(argv) {
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
  if (!options.help) options.baseUrl = normalizeLoopbackBaseUrl(options.baseUrl);
  return options;
}

export function buildCandidateQaIdentity({
  frame,
  frameDomain = 'root',
  rootFrame = frameDomain === 'root' ? frame : 51,
  scenario,
  language,
  seed
}) {
  const entryState = {
    kind: 'engineering-candidate-product-qa',
    animationId,
    frameDomain,
    frame,
    rootFrame,
    scenario,
    language,
    seed
  };
  return Object.freeze({
    frameDomain,
    rootFrame,
    requirementId: `qa:${frameDomain}:${scenario}:${language}`,
    traceId: `qa-trace:${frameDomain}:${scenario}:${language}:seed-${seed}`,
    entryState,
    entryStateSha256: sha256(JSON.stringify(entryState))
  });
}

export function allClaimsFalse(claims) {
  const values = Object.values(claims ?? {});
  return values.length > 0 && values.every((value) => value === false);
}

export function devOverlaySuppressionPass(record) {
  const clean = (state) =>
    state?.visibleControlCount === 0 &&
    (state?.portalCount === 0 || state.hiddenPortalCount === state.portalCount) &&
    (state?.scriptOverlayCount === 0 ||
      state.hiddenScriptOverlayCount === state.scriptOverlayCount);
  return record?.capturePageOnly === true &&
    record?.styleInstalled === true &&
    clean(record?.afterSuppression) &&
    clean(record?.afterCapture);
}

function runtimeIdentityMatches(runtime, identity, scenario, language, seed) {
  return runtime?.animationId === animationId &&
    runtime?.frameDomain === identity.frameDomain &&
    runtime?.requirementId === identity.requirementId &&
    runtime?.traceId === identity.traceId &&
    runtime?.entryStateSha256 === identity.entryStateSha256 &&
    runtime?.scenario === scenario &&
    runtime?.language === language &&
    runtime?.seed === String(seed);
}

export function replayResetIdentityPass({
  before,
  reset,
  resumed,
  identity,
  scenario,
  language,
  seed
}) {
  return Boolean(
    before &&
      reset &&
      resumed &&
      Number(before.runtime?.frame) >= 7 &&
      reset.replay === before.replay + 1 &&
      reset.runtime?.frame === '1' &&
      reset.runtime?.rootFrame === '1' &&
      reset.candidate?.frame === '1' &&
      reset.candidate?.phase === 'pre-begin' &&
      reset.candidate?.localFrame === 'not-placed' &&
      Number(resumed.runtime?.frame) >= 2 &&
      resumed.runtime?.rootFrame === resumed.runtime?.frame &&
      runtimeIdentityMatches(before.runtime, identity, scenario, language, seed) &&
      runtimeIdentityMatches(reset.runtime, identity, scenario, language, seed) &&
      runtimeIdentityMatches(resumed.runtime, identity, scenario, language, seed) &&
      [before, reset, resumed].every(
        (state) =>
          state.candidate?.scenario === scenario &&
          state.candidate?.language === language &&
          state.candidate?.seed === String(seed)
      )
  );
}

function monitorPage(page, expectedOrigin, diagnostics) {
  const expected = new URL(expectedOrigin);
  const expectedEndpoint = `${expected.hostname}:${expected.port || (expected.protocol === 'https:' ? '443' : '80')}`;

  page.on('console', (message) => {
    diagnostics.console.messages += 1;
    if (message.type() === 'error') {
      diagnostics.console.errors.push({url: page.url(), text: message.text()});
    } else if (message.type() === 'warning') {
      diagnostics.console.warnings.push({url: page.url(), text: message.text()});
    }
  });
  page.on('pageerror', (error) => {
    diagnostics.pageErrors.push({url: page.url(), text: error.message});
  });
  page.on('request', (request) => {
    diagnostics.network.requestCount += 1;
    const url = request.url();
    let parsed;
    try {
      parsed = new URL(url);
    } catch {
      diagnostics.network.unexpectedRequests.push(url);
      return;
    }
    if (!['http:', 'https:', 'ws:', 'wss:'].includes(parsed.protocol)) return;
    diagnostics.network.observedOrigins.add(parsed.origin);
    const secure = parsed.protocol === 'https:' || parsed.protocol === 'wss:';
    const endpoint = `${parsed.hostname}:${parsed.port || (secure ? '443' : '80')}`;
    if (endpoint !== expectedEndpoint || !['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname)) {
      diagnostics.network.unexpectedRequests.push(url);
    }
  });
  page.on('requestfailed', (request) => {
    diagnostics.network.failedRequests.push({
      url: request.url(),
      error: request.failure()?.errorText || 'failed'
    });
  });
  page.on('response', (response) => {
    if (response.status() >= 400) {
      diagnostics.network.httpErrors.push({url: response.url(), status: response.status()});
    }
  });
}

async function inspectDevOverlay(page) {
  return page.evaluate((controlSelector) => {
    const visible = (element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        Number(style.opacity || '1') !== 0 &&
        rect.width > 0 &&
        rect.height > 0;
    };
    const scripts = [...document.querySelectorAll("script[data-nextjs-dev-overlay='true']")];
    const portals = [...document.querySelectorAll('nextjs-portal')];
    const controls = portals.flatMap((portal) =>
      portal.shadowRoot ? [...portal.shadowRoot.querySelectorAll(controlSelector)] : []
    );
    return {
      scriptOverlayCount: scripts.length,
      hiddenScriptOverlayCount: scripts.filter((script) => !visible(script)).length,
      portalCount: portals.length,
      hiddenPortalCount: portals.filter((portal) => !visible(portal)).length,
      shadowRootCount: portals.filter((portal) => portal.shadowRoot).length,
      controlCount: controls.length,
      visibleControlCount: controls.filter(visible).length
    };
  }, DEV_OVERLAY_CONTROL_SELECTOR);
}

async function suppressDevOverlayForCapture(page) {
  const before = await inspectDevOverlay(page);
  const styleInstalled = await page.evaluate(
    ({styleId, css, controlSelector}) => {
      let style = document.getElementById(styleId);
      if (!style) {
        style = document.createElement('style');
        style.id = styleId;
        style.dataset.captureOnly = 'true';
        document.head.appendChild(style);
      }
      style.textContent = css;
      for (const script of document.querySelectorAll("script[data-nextjs-dev-overlay='true']")) {
        script.style.setProperty('display', 'none', 'important');
        script.style.setProperty('visibility', 'hidden', 'important');
        script.style.setProperty('opacity', '0', 'important');
        script.dataset.helpMathReQaCaptureHidden = 'true';
      }
      for (const portal of document.querySelectorAll('nextjs-portal')) {
        portal.style.setProperty('display', 'none', 'important');
        portal.style.setProperty('visibility', 'hidden', 'important');
        portal.style.setProperty('opacity', '0', 'important');
        portal.style.setProperty('pointer-events', 'none', 'important');
        portal.dataset.helpMathReQaCaptureHidden = 'true';
        for (const control of portal.shadowRoot?.querySelectorAll(controlSelector) || []) {
          control.style.setProperty('display', 'none', 'important');
          control.style.setProperty('visibility', 'hidden', 'important');
          control.style.setProperty('opacity', '0', 'important');
          control.setAttribute('aria-hidden', 'true');
        }
      }
      return Boolean(
        style.isConnected &&
          style.dataset.captureOnly === 'true' &&
          style.textContent === css
      );
    },
    {
      styleId: DEV_OVERLAY_CAPTURE_STYLE_ID,
      css: DEV_OVERLAY_CAPTURE_CSS,
      controlSelector: DEV_OVERLAY_CONTROL_SELECTOR
    }
  );
  await settleCanvas(page);
  const afterSuppression = await inspectDevOverlay(page);
  const record = {
    capturePageOnly: true,
    strategy:
      'capture-only CSS and inline important styles hide Next.js overlay scripts, portal hosts, and shadow-root controls',
    styleId: DEV_OVERLAY_CAPTURE_STYLE_ID,
    cssSha256: sha256(DEV_OVERLAY_CAPTURE_CSS),
    styleInstalled,
    before,
    afterSuppression,
    afterCapture: null
  };
  if (!devOverlaySuppressionPass({...record, afterCapture: afterSuppression})) {
    throw new Error(
      `Next.js development overlay remained visible before capture: ${JSON.stringify(record)}`
    );
  }
  return record;
}

async function screenshot(page, locator, destination) {
  const devOverlaySuppression = await suppressDevOverlayForCapture(page);
  await mkdir(path.dirname(destination), {recursive: true});
  await locator.screenshot({path: destination, animations: 'disabled'});
  devOverlaySuppression.afterCapture = await inspectDevOverlay(page);
  if (!devOverlaySuppressionPass(devOverlaySuppression)) {
    throw new Error(
      `Next.js development overlay became visible during capture: ${JSON.stringify(devOverlaySuppression)}`
    );
  }
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

function queryFor({frame, scenario, language, seed, identity, capture}) {
  const query = new URLSearchParams({
    frameDomain: identity.frameDomain,
    requirementId: identity.requirementId,
    trace: identity.traceId,
    entryStateSha256: identity.entryStateSha256,
    scenario,
    lang: language,
    seed: String(seed)
  });
  if (frame !== undefined) query.set('frame', String(frame));
  if (capture) query.set('capture', '1');
  return query.toString();
}

async function settleCanvas(page) {
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  );
}

async function waitForCandidate(page, expected) {
  const runtime = page.locator('.runtime-stage').first();
  await runtime.waitFor({state: 'visible', timeout: 30_000});
  await page.waitForFunction(
    (value) => {
      const stage = document.querySelector('.runtime-stage');
      const candidate = document.querySelector("[data-candidate-status='engineering-not-strict']");
      return Boolean(
        candidate &&
          stage?.getAttribute('data-animation-id') === value.animationId &&
          stage?.getAttribute('data-flash-frame') === String(value.frame) &&
          stage?.getAttribute('data-flash-frame-domain') === value.identity.frameDomain &&
          stage?.getAttribute('data-flash-root-frame') === String(value.identity.rootFrame) &&
          stage?.getAttribute('data-flash-requirement-id') === value.identity.requirementId &&
          stage?.getAttribute('data-flash-trace-id') === value.identity.traceId &&
          stage?.getAttribute('data-flash-entry-state-sha256') ===
            value.identity.entryStateSha256 &&
          stage?.getAttribute('data-runtime-scenario') === value.scenario &&
          stage?.getAttribute('data-runtime-language') === value.language &&
          stage?.getAttribute('data-runtime-seed') === String(value.seed) &&
          candidate.getAttribute('data-flash-frame') === String(value.frame) &&
          candidate.getAttribute('data-runtime-scenario') === value.scenario &&
          candidate.getAttribute('data-runtime-language') === value.language &&
          candidate.getAttribute('data-runtime-seed') === String(value.seed)
      );
    },
    {animationId, ...expected},
    {timeout: 30_000}
  );
  await settleCanvas(page);
  return page.locator("[data-candidate-status='engineering-not-strict']").first();
}

async function readCandidateState(page) {
  return page.evaluate(() => {
    const runtime = document.querySelector('.runtime-stage');
    const shell = document.querySelector('.runtime-shell');
    const candidate = document.querySelector("[data-candidate-status='engineering-not-strict']");
    const stageBox = candidate?.querySelector(':scope > div');
    const canvas = candidate?.querySelector('canvas');
    const candidateRect = candidate?.getBoundingClientRect();
    const stageRect = stageBox?.getBoundingClientRect();
    return {
      replay: Number(shell?.getAttribute('data-runtime-replay')),
      runtime: {
        animationId: runtime?.getAttribute('data-animation-id') || null,
        frame: runtime?.getAttribute('data-flash-frame') || null,
        frameDomain: runtime?.getAttribute('data-flash-frame-domain') || null,
        requirementId: runtime?.getAttribute('data-flash-requirement-id') || null,
        traceId: runtime?.getAttribute('data-flash-trace-id') || null,
        entryStateSha256: runtime?.getAttribute('data-flash-entry-state-sha256') || null,
        rootFrame: runtime?.getAttribute('data-flash-root-frame') || null,
        scenario: runtime?.getAttribute('data-runtime-scenario') || null,
        language: runtime?.getAttribute('data-runtime-language') || null,
        seed: runtime?.getAttribute('data-runtime-seed') || null
      },
      candidate: {
        frame: candidate?.getAttribute('data-flash-frame') || null,
        naturalFrame: candidate?.getAttribute('data-flash-natural-frame') || null,
        phase: candidate?.getAttribute('data-flash-phase') || null,
        localFrame: candidate?.getAttribute('data-local-frame') || null,
        localFrameCount: candidate?.getAttribute('data-local-frame-count') || null,
        localObjectId: candidate?.getAttribute('data-local-object-id') || null,
        scenario: candidate?.getAttribute('data-runtime-scenario') || null,
        language: candidate?.getAttribute('data-runtime-language') || null,
        seed: candidate?.getAttribute('data-runtime-seed') || null,
        audioRendered: candidate?.getAttribute('data-audio-rendered') || null,
        visualLocalizationStatus:
          candidate?.getAttribute('data-visual-localization-status') || null
      },
      canvas: canvas
        ? {
            count: 1,
            width: canvas.width,
            height: canvas.height,
            role: canvas.getAttribute('role'),
            accessibleName: canvas.getAttribute('aria-label')
          }
        : {count: 0},
      blocker: candidate
        ?.querySelector('[data-fail-closed-reason]')
        ?.getAttribute('data-fail-closed-reason') || null,
      layout: {
        candidate: candidateRect
          ? {x: candidateRect.x, right: candidateRect.right, width: candidateRect.width}
          : null,
        stage: stageRect
          ? {
              x: stageRect.x,
              right: stageRect.right,
              width: stageRect.width,
              height: stageRect.height
            }
          : null,
        documentClientWidth: document.documentElement.clientWidth,
        documentScrollWidth: document.documentElement.scrollWidth
      }
    };
  });
}

async function captureMatrixCase(page, route, testCase) {
  const {
    frame,
    frameDomain,
    rootFrame,
    scenario,
    language,
    blocker,
    visualLocalizationStatus
  } = testCase;
  const seed = qaSeed;
  const identity = buildCandidateQaIdentity({
    frame,
    frameDomain,
    rootFrame,
    scenario,
    language,
    seed
  });
  await page.goto(
    `${route}?${queryFor({frame, scenario, language, seed, identity, capture: true})}`,
    {waitUntil: 'networkidle'}
  );
  const candidate = await waitForCandidate(page, {frame, scenario, language, seed, identity});
  const before = await readCandidateState(page);
  await page.waitForTimeout(250);
  const after = await readCandidateState(page);
  const stage = candidate.locator(':scope > div').first();
  const capture = await screenshot(
    page,
    stage,
    path.join(
      screenshotRoot,
      `${frameDomain}-frame-${String(frame).padStart(4, '0')}-${language}-${scenario}.png`
    )
  );
  const frozen = before.runtime.frame === String(frame) && after.runtime.frame === String(frame);
  const identityMatched = [before, after].every(
    (state) =>
      state.runtime.frameDomain === identity.frameDomain &&
      state.runtime.rootFrame === String(rootFrame) &&
      state.runtime.requirementId === identity.requirementId &&
      state.runtime.traceId === identity.traceId &&
      state.runtime.entryStateSha256 === identity.entryStateSha256 &&
      state.runtime.scenario === scenario &&
      state.runtime.language === language &&
      state.runtime.seed === String(seed)
  );
  const dispositionMatched = blocker
    ? before.blocker === blocker &&
      before.canvas.count === 0 &&
      before.candidate.visualLocalizationStatus === visualLocalizationStatus
    : before.blocker === null &&
      before.canvas.count === 1 &&
      before.candidate.visualLocalizationStatus === visualLocalizationStatus;
  return {
    requested: {frame, frameDomain, rootFrame, scenario, language, seed, ...identity},
    expected: blocker
      ? {status: 'blocked', blocker, visualLocalizationStatus}
      : {status: 'ready', blocker: null, visualLocalizationStatus},
    before,
    after,
    frozen,
    identityMatched,
    dispositionMatched,
    capture,
    pass:
      frozen &&
      identityMatched &&
      dispositionMatched &&
      capture.width === 800 &&
      capture.height === 600
  };
}

async function captureStructuralFrame(page, route, coverage) {
  const requirement = coverage.requirements.find(
    (entry) =>
      entry.requirementId === 'req:root:root-standalone:en' &&
      entry.frameDomainId === 'root' &&
      entry.language === 'en'
  );
  if (!requirement) throw new Error('Missing root standalone English coverage requirement');
  const frame = 55;
  const scenario = requirement.scenario;
  const language = requirement.language;
  const seed = Number(requirement.seed);
  const identity = {
    frameDomain: requirement.frameDomainId,
    rootFrame: frame,
    requirementId: requirement.requirementId,
    traceId: requirement.traceId,
    entryStateSha256: requirement.entryStateSha256
  };
  await page.goto(
    `${route}?${queryFor({frame, scenario, language, seed, identity, capture: true})}`,
    {waitUntil: 'networkidle'}
  );
  const candidate = await waitForCandidate(page, {frame, scenario, language, seed, identity});
  const before = await readCandidateState(page);
  await page.waitForTimeout(250);
  const after = await readCandidateState(page);
  const capture = await screenshot(
    page,
    candidate.locator(':scope > div').first(),
    path.join(screenshotRoot, 'frame-0055-en-root-standalone-structural.png')
  );
  const pass =
    before.runtime.frame === '55' &&
    after.runtime.frame === '55' &&
    before.runtime.frameDomain === 'root' &&
    before.runtime.requirementId === requirement.requirementId &&
    before.runtime.traceId === requirement.traceId &&
    before.runtime.entryStateSha256 === requirement.entryStateSha256 &&
    before.candidate.phase === 'post-stop-structural-frame' &&
    before.candidate.naturalFrame === '51' &&
    before.candidate.localFrame === '1' &&
    before.canvas.count === 1 &&
    capture.width === 800 &&
    capture.height === 600;
  return {
    requested: {frame, scenario, language, seed, ...identity},
    before,
    after,
    capture,
    pass,
    authority: 'engineering structural probe only; not natural-playback or RMSE evidence'
  };
}

async function activateReplay(browser, route, control, input, expectedOrigin, diagnostics) {
  const context = await browser.newContext({
    viewport: {width: 1280, height: 1000},
    deviceScaleFactor: 1,
    reducedMotion: 'no-preference'
  });
  const page = await context.newPage();
  monitorPage(page, expectedOrigin, diagnostics);
  const scenario = 'root-standalone';
  const language = 'en';
  const seed = qaSeed;
  const identity = buildCandidateQaIdentity({
    frame: 1,
    frameDomain: 'root',
    rootFrame: 1,
    scenario,
    language,
    seed
  });
  await page.goto(
    `${route}?${queryFor({scenario, language, seed, identity, capture: false})}`,
    {waitUntil: 'domcontentloaded'}
  );
  await page.waitForFunction(
    () =>
      Number(document.querySelector('.runtime-stage')?.getAttribute('data-flash-frame')) >= 7 &&
      document.querySelector("[data-candidate-status='engineering-not-strict']"),
    undefined,
    {timeout: 30_000}
  );
  const candidate = page.locator("[data-candidate-status='engineering-not-strict']").first();
  const button =
    control === 'host'
      ? page.locator('.runtime-toolbar__actions').getByRole('button', {name: 'Replay', exact: true})
      : candidate.getByRole('button', {name: 'Replay', exact: true});
  const before = await readCandidateState(page);
  await button.focus();
  if (input === 'pointer') await button.click();
  else await button.press(input);
  await page.waitForFunction(
    ({replay}) =>
      Number(document.querySelector('.runtime-shell')?.getAttribute('data-runtime-replay')) === replay &&
      document.querySelector('.runtime-stage')?.getAttribute('data-flash-frame') === '1' &&
      document
        .querySelector("[data-candidate-status='engineering-not-strict']")
        ?.getAttribute('data-flash-phase') === 'pre-begin',
    {replay: before.replay + 1},
    {timeout: 10_000}
  );
  const reset = await readCandidateState(page);
  await page.waitForFunction(
    () => Number(document.querySelector('.runtime-stage')?.getAttribute('data-flash-frame')) >= 2,
    undefined,
    {timeout: 10_000}
  );
  const resumed = await readCandidateState(page);
  const accessibleName = ((await button.getAttribute('aria-label')) || (await button.textContent()) || '')
    .replace(/\s+/g, ' ')
    .trim();
  const result = {
    control,
    input,
    accessibleName,
    identity,
    expectedContext: {scenario, language, seed},
    before,
    reset,
    resumed
  };
  result.pass =
    accessibleName === 'Replay' &&
    replayResetIdentityPass({
      before,
      reset,
      resumed,
      identity,
      scenario,
      language,
      seed
    });
  await context.close();
  return result;
}

async function horizontalOffenders(page) {
  return page.evaluate(() => {
    const clientWidth = document.documentElement.clientWidth;
    return [...document.querySelectorAll('.runtime-shell, .runtime-shell *')]
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          tag: element.tagName.toLowerCase(),
          className: typeof element.className === 'string' ? element.className : '',
          left: rect.left,
          right: rect.right,
          width: rect.width,
          height: rect.height
        };
      })
      .filter(
        (entry) =>
          entry.width > 0 &&
          entry.height > 0 &&
          (entry.left < -1 || entry.right > clientWidth + 1)
      );
  });
}

async function mobileCase(page, route, language) {
  const frame = 51;
  const scenario = 'root-standalone';
  const seed = qaSeed;
  const identity = buildCandidateQaIdentity({
    frame,
    frameDomain: 'root',
    rootFrame: frame,
    scenario,
    language,
    seed
  });
  const localeRoute = language === 'es' ? route.replace('/animations/', '/es/animations/') : route;
  await page.goto(
    `${localeRoute}?${queryFor({frame, scenario, language, seed, identity, capture: false})}`,
    {waitUntil: 'networkidle'}
  );
  await waitForCandidate(page, {frame, scenario, language, seed, identity});
  const state = await readCandidateState(page);
  const offenders = await horizontalOffenders(page);
  const capture = await screenshot(
    page,
    page.locator('.runtime-shell'),
    path.join(screenshotRoot, `mobile-390x844-frame-0051-${language}.png`)
  );
  const pass =
    state.layout.documentScrollWidth <= state.layout.documentClientWidth &&
    state.layout.stage &&
    state.layout.stage.x >= -1 &&
    state.layout.stage.right <= state.layout.documentClientWidth + 1 &&
    Math.abs(state.layout.stage.width / state.layout.stage.height - 4 / 3) < 0.001 &&
    state.canvas.count === 1 &&
    state.blocker === null &&
    state.candidate.visualLocalizationStatus === 'source-shared-untranslated-visual' &&
    offenders.length === 0;
  return {
    viewport: {width: 390, height: 844},
    language,
    state,
    horizontalOverflow: state.layout.documentScrollWidth > state.layout.documentClientWidth,
    horizontalOffenders: offenders,
    capture,
    pass
  };
}

async function reducedMotionCase(browser, route, expectedOrigin, diagnostics) {
  const context = await browser.newContext({
    viewport: {width: 900, height: 1200},
    deviceScaleFactor: 1,
    reducedMotion: 'reduce'
  });
  const page = await context.newPage();
  monitorPage(page, expectedOrigin, diagnostics);
  const scenario = 'root-standalone';
  const language = 'en';
  const seed = qaSeed;
  const identity = buildCandidateQaIdentity({
    frame: 51,
    frameDomain: 'root',
    rootFrame: 51,
    scenario,
    language,
    seed
  });
  await page.goto(
    `${route}?${queryFor({scenario, language, seed, identity, capture: false})}`,
    {waitUntil: 'networkidle'}
  );
  await waitForCandidate(page, {frame: 51, scenario, language, seed, identity});
  const before = await readCandidateState(page);
  await page.waitForTimeout(500);
  const after = await readCandidateState(page);
  const note = page.locator('.reduced-motion-note[role="status"]');
  const noteVisible = await note.isVisible();
  const noteText = ((await note.textContent()) || '').replace(/\s+/g, ' ').trim();
  const capture = await screenshot(
    page,
    page.locator('.runtime-shell'),
    path.join(screenshotRoot, 'reduced-motion-frame-0051.png')
  );
  const result = {
    requested: 'reduce',
    before,
    after,
    noteVisible,
    noteText,
    capture,
    pass:
      noteVisible &&
      before.runtime.frame === '51' &&
      after.runtime.frame === '51' &&
      before.candidate.naturalFrame === '51' &&
      after.candidate.naturalFrame === '51'
  };
  await context.close();
  return result;
}

async function accessibilityCase(page, route) {
  const frame = 51;
  const scenario = 'root-standalone';
  const language = 'en';
  const seed = qaSeed;
  const identity = buildCandidateQaIdentity({
    frame,
    frameDomain: 'root',
    rootFrame: frame,
    scenario,
    language,
    seed
  });
  await page.goto(
    `${route}?${queryFor({frame, scenario, language, seed, identity, capture: false})}`,
    {waitUntil: 'networkidle'}
  );
  await waitForCandidate(page, {frame, scenario, language, seed, identity});
  const region = page.getByRole('region', {name: 'Quiz Review Details for the Student'});
  const canvas = region.getByRole('img');
  const candidateReplay = region.getByRole('button', {name: 'Replay', exact: true});
  const hostReplay = page
    .locator('.runtime-toolbar__actions')
    .getByRole('button', {name: 'Replay', exact: true});
  const disabledNames = [
    'Previous review unavailable',
    'Next review unavailable',
    'Back unavailable'
  ];
  const ready = {
    regionCount: await region.count(),
    canvasCount: await canvas.count(),
    canvasAccessibleName: await canvas.getAttribute('aria-label'),
    hostReplayName: ((await hostReplay.textContent()) || '').trim(),
    candidateReplayName: ((await candidateReplay.textContent()) || '').trim(),
    disabledLegacyControls: await Promise.all(
      disabledNames.map(async (name) => ({
        name,
        disabled: await region.getByRole('button', {name, exact: true}).isDisabled()
      }))
    )
  };

  const blockedScenario = 'host-review-unavailable';
  const blockedFrame = 1;
  const blockedIdentity = buildCandidateQaIdentity({
    frame: blockedFrame,
    frameDomain: 'sprite-621',
    rootFrame: 51,
    scenario: blockedScenario,
    language,
    seed
  });
  await page.goto(
    `${route}?${queryFor({
      frame: blockedFrame,
      scenario: blockedScenario,
      language,
      seed,
      identity: blockedIdentity,
      capture: false
    })}`,
    {waitUntil: 'networkidle'}
  );
  await waitForCandidate(page, {
    frame: blockedFrame,
    scenario: blockedScenario,
    language,
    seed,
    identity: blockedIdentity
  });
  const status = page.getByRole('status', {name: ''}).filter({
    has: page.locator("[data-fail-closed-reason='reviewans-host-state-unavailable']")
  });
  const blocked = {
    statusCount: await page.locator("[role='status'][data-fail-closed-reason='reviewans-host-state-unavailable']").count(),
    text: (
      (await page
        .locator("[role='status'][data-fail-closed-reason='reviewans-host-state-unavailable']")
        .textContent()) || ''
    )
      .replace(/\s+/g, ' ')
      .trim(),
    hiddenProbeCount: await status.count().catch(() => 0)
  };
  return {
    ready,
    blocked,
    pass:
      ready.regionCount === 1 &&
      ready.canvasCount === 1 &&
      ready.canvasAccessibleName ===
        'Standalone root structural visual, source frame 51 of 55' &&
      ready.hostReplayName === 'Replay' &&
      ready.candidateReplayName === 'Replay' &&
      ready.disabledLegacyControls.every((entry) => entry.disabled) &&
      blocked.statusCount === 1 &&
      blocked.text.includes('Quiz review data unavailable')
  };
}

async function hashFile(relativePath) {
  const bytes = await readFile(path.join(projectRoot, relativePath));
  return {path: relativePath, sha256: sha256(bytes), bytes: bytes.length};
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    console.log(
      'Usage: node scripts/qa-re-001-candidate.mjs [--base-url http://127.0.0.1:3213]'
    );
    return;
  }

  const baseUrl = options.baseUrl;
  const route = `${baseUrl}/animations/${animationId}`;
  const expectedOrigin = new URL(baseUrl).origin;
  const migrationBeforeBytes = await readFile(migrationPath);
  const migrationBefore = JSON.parse(migrationBeforeBytes);
  const generatorBytes = await readFile(scriptPath);
  const sourceBytes = await readFile(sourcePath);
  const coverageBytes = await readFile(coveragePath);
  const coverage = JSON.parse(coverageBytes);
  const implementation = await Promise.all(implementationFiles.map(hashFile));
  const diagnostics = {
    console: {messages: 0, errors: [], warnings: []},
    pageErrors: [],
    network: {
      requestCount: 0,
      observedOrigins: new Set(),
      failedRequests: [],
      httpErrors: [],
      unexpectedRequests: []
    }
  };

  const browser = await chromium.launch({headless: true});
  const browserVersion = browser.version();
  try {
    const desktopContext = await browser.newContext({
      viewport: {width: 1280, height: 1000},
      deviceScaleFactor: 1,
      reducedMotion: 'no-preference'
    });
    const desktopPage = await desktopContext.newPage();
    monitorPage(desktopPage, expectedOrigin, diagnostics);

    const matrix = [];
    for (const testCase of matrixCases) {
      matrix.push(await captureMatrixCase(desktopPage, route, testCase));
    }
    const structuralFrame55 = await captureStructuralFrame(desktopPage, route, coverage);
    const accessibility = await accessibilityCase(desktopPage, route);
    await desktopContext.close();

    const replay = [];
    for (const control of ['host', 'candidate']) {
      for (const input of ['pointer', 'Enter', 'Space']) {
        replay.push(
          await activateReplay(
            browser,
            route,
            control,
            input,
            expectedOrigin,
            diagnostics
          )
        );
      }
    }

    const mobileContext = await browser.newContext({
      viewport: {width: 390, height: 844},
      deviceScaleFactor: 1,
      reducedMotion: 'no-preference'
    });
    const mobilePage = await mobileContext.newPage();
    monitorPage(mobilePage, expectedOrigin, diagnostics);
    const mobile = [];
    for (const language of matrixLanguages) {
      mobile.push(await mobileCase(mobilePage, route, language));
    }
    await mobileContext.close();

    const reducedMotion = await reducedMotionCase(
      browser,
      route,
      expectedOrigin,
      diagnostics
    );

    const migrationAfterBytes = await readFile(migrationPath);
    const migrationAfter = JSON.parse(migrationAfterBytes);
    const observedOrigins = [...diagnostics.network.observedOrigins].sort();
    const serializableDiagnostics = {
      console: diagnostics.console,
      pageErrors: diagnostics.pageErrors,
      network: {...diagnostics.network, observedOrigins}
    };
    const claims = {
      authoritativeHostReviewStateBaseline: false,
      controlledLocalFrame2Baseline: false,
      pixelFidelity: false,
      fullFrameRmse: false,
      spanishParity: false,
      spanishTranslation: false,
      audioParity: false,
      strictValidator: false,
      humanVisualReview: false,
      ownerAcceptance: false,
      strictMigrationCompletion: false
    };
    const nativeCase = matrix.find(
      (entry) =>
        entry.requested.frameDomain === 'root' &&
        entry.requested.language === 'en' &&
        entry.requested.scenario === 'root-standalone'
    );
    const screenshotCaptures = [
      ...matrix.map((entry) => entry.capture),
      structuralFrame55.capture,
      ...mobile.map((entry) => entry.capture),
      reducedMotion.capture
    ];
    const devOverlaySuppressionPassed =
      screenshotCaptures.length === 12 &&
      screenshotCaptures.every((capture) =>
        devOverlaySuppressionPass(capture.devOverlaySuppression)
      );
    const assertions = [
      {
        id: 'source-hash',
        pass:
          sha256(sourceBytes) === sourceSha256 &&
          migrationBefore.source?.swfSha256 === sourceSha256,
        details: {observed: sha256(sourceBytes), expected: sourceSha256}
      },
      {
        id: 'implementation-hashes-current',
        pass:
          implementation.length === implementationFiles.length &&
          implementation.every((entry) => /^[a-f0-9]{64}$/.test(entry.sha256))
      },
      {
        id: 'generator-hash-current',
        pass: /^[a-f0-9]{64}$/.test(sha256(generatorBytes))
      },
      {
        id: 'migration-state-and-acceptance-unchanged',
        pass:
          migrationBefore.status === migrationAfter.status &&
          JSON.stringify(migrationBefore.acceptance ?? null) ===
            JSON.stringify(migrationAfter.acceptance ?? null) &&
          sha256(migrationBeforeBytes) === sha256(migrationAfterBytes)
      },
      {
        id: 'exact-frame-domain-language-scenario-matrix',
        pass:
          matrix.length === 8 &&
          matrix.every((entry) => entry.pass) &&
          matrix.filter((entry) => entry.expected.status === 'ready').length === 2 &&
          matrix.filter((entry) => entry.expected.status === 'blocked').length === 6
      },
      {
        id: 'native-800x600-stage',
        pass:
          nativeCase?.capture.width === 800 &&
          nativeCase?.capture.height === 600 &&
          nativeCase?.before.canvas.width === 800 &&
          nativeCase?.before.canvas.height === 600
      },
      {id: 'frame-55-structural-probe', pass: structuralFrame55.pass},
      {
        id: 'host-and-candidate-replay-pointer-enter-space',
        pass:
          replay.length === 6 &&
          replay.every((entry) => entry.pass) &&
          new Set(replay.map((entry) => `${entry.control}:${entry.input}`)).size === 6
      },
      {
        id: 'mobile-390x844-no-horizontal-overflow',
        pass: mobile.length === 2 && mobile.every((entry) => entry.pass)
      },
      {id: 'reduced-motion-terminal-freeze', pass: reducedMotion.pass},
      {id: 'accessibility-semantics', pass: accessibility.pass},
      {
        id: 'next-dev-overlay-suppressed-before-and-after-every-screenshot',
        pass: devOverlaySuppressionPassed,
        details: {captureCount: screenshotCaptures.length}
      },
      {
        id: 'console-errors-and-warnings',
        pass:
          serializableDiagnostics.console.errors.length === 0 &&
          serializableDiagnostics.console.warnings.length === 0 &&
          serializableDiagnostics.pageErrors.length === 0
      },
      {
        id: 'loopback-only-network',
        pass:
          serializableDiagnostics.network.requestCount > 0 &&
          serializableDiagnostics.network.failedRequests.length === 0 &&
          serializableDiagnostics.network.httpErrors.length === 0 &&
          serializableDiagnostics.network.unexpectedRequests.length === 0 &&
          observedOrigins.every((origin) => {
            const parsed = new URL(origin);
            return ['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname);
          })
      },
      {
        id: 'strict-claims-remain-false',
        pass: allClaimsFalse(claims)
      }
    ];
    const report = {
      schemaVersion: 3,
      animationId,
      recordedAt: new Date().toISOString(),
      status: assertions.every((entry) => entry.pass) ? 'pass' : 'fail',
      scope: 'hash-bound native Canvas engineering-candidate browser product QA',
      generatedBy: {
        script: portable(scriptPath),
        scriptSha256: sha256(generatorBytes),
        deterministic: false,
        reason: 'Browser screenshots and recordedAt are intentionally regenerated on each local QA run.'
      },
      acceptanceEffect: 'none',
      strictAcceptanceEffect: false,
      migrationStatusBefore: migrationBefore.status,
      migrationStatusAfter: migrationAfter.status,
      claims,
      source: {
        path: portable(sourcePath),
        sha256: sha256(sourceBytes),
        expectedSha256: sourceSha256,
        bytes: sourceBytes.length
      },
      implementation,
      dependencies: [
        {
          path: portable(coveragePath),
          sha256: sha256(coverageBytes),
          authority: 'identity source for the frame-55 engineering structural probe only'
        }
      ],
      environment: {
        application: 'Next.js local audit product route',
        origin: baseUrl,
        browser: `Chromium ${browserVersion}`,
        automation: 'repository-pinned Playwright',
        viewportDeviceScaleFactor: 1,
        serverMode: 'development',
        networkPolicy: 'exact loopback host and port only'
      },
      route: {
        path: `/animations/${animationId}`,
        localeVariant: `/es/animations/${animationId}`,
        deterministicParameters: [
          'frameDomain',
          'requirementId',
          'trace',
          'entryStateSha256',
          'frame',
          'scenario',
          'lang',
          'seed'
        ]
      },
      deterministicContract: {
        seed: qaSeed,
        caseCount: matrix.length,
        frameDomains: [...new Set(matrixCases.map(({frameDomain}) => frameDomain))],
        languages: [...new Set(matrixCases.map(({language}) => language))],
        scenarios: [...new Set(matrixCases.map(({scenario}) => scenario))],
        matrix,
        frame55Structural: structuralFrame55
      },
      browserQa: {
        nativeStage: {
          expected: {width: 800, height: 600},
          capture: nativeCase?.capture ?? null,
          intrinsicCanvas: nativeCase?.before.canvas ?? null,
          exact:
            nativeCase?.capture.width === 800 &&
            nativeCase?.capture.height === 600 &&
            nativeCase?.before.canvas.width === 800 &&
            nativeCase?.before.canvas.height === 600
        },
        replay,
        mobile,
        reducedMotion,
        accessibility,
        diagnostics: serializableDiagnostics
      },
      assertions,
      limitations: [
        'This producer validates the modern RE01 engineering candidate and its explicit fail-closed behavior; it does not create an original-runtime baseline.',
        'The frame-55 capture is a source-addressed post-stop structural probe, not proof of natural playback, REVIEWANS traversal, interaction, scoring, terminal behavior, or source Replay.',
        'The candidate renders no audio. Structural silence has not yet been accepted as a complete source-bound negative audio proof for every host state.',
        'The es root request renders the same fixed English source visual and is explicitly classified as source-shared-untranslated-visual. No Spanish translation, authoritative Spanish review state, branch-complete RMSE set, human visual review, or owner acceptance is supplied by this QA run.',
        'Development-server browser QA is not a production-build result, strict-validator result, or migration-completion claim.'
      ],
      authorityBoundary: {
        authoritativeBaseline: false,
        strictFullFrameRmse: false,
        branchParity: false,
        audioParity: false,
        spanishParity: false,
        spanishTranslation: false,
        sourceReplayParity: false,
        humanVisualReview: false,
        ownerAcceptance: false,
        strictMigrationCompletion: false
      }
    };
    if (!allClaimsFalse(report.claims) || report.strictAcceptanceEffect !== false) {
      throw new Error('Candidate QA authority boundary must remain entirely false');
    }
    await mkdir(path.dirname(outputPath), {recursive: true});
    await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`);
    console.log(
      JSON.stringify(
        {
          output: portable(outputPath),
          screenshotRoot: portable(screenshotRoot),
          status: report.status,
          assertions
        },
        null,
        2
      )
    );
    if (report.status !== 'pass') process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  main().catch((error) => {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  });
}
