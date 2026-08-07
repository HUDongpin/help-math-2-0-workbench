#!/usr/bin/env node

import {createHash} from "node:crypto";
import {mkdir, readFile, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {chromium} from "playwright";
import {PNG} from "pngjs";

import {
  devOverlaySuppressionPass,
  finalizeNextDevOverlayCapture,
  suppressNextDevOverlayForCapture,
} from "./qa-next-dev-overlay.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");
const defaultBaseUrl = "http://127.0.0.1:3213";
const reportRelativePath =
  "migrations/shell-course-g04-l01-index-local/evidence/native-navigation-candidate-qa.json";
const migrationRelativePath = "migrations/shell-course-g04-l01-index-local/migration.json";
const screenshotRoot = path.join(
  projectRoot,
  "output/playwright/shell-course-g04-l01-index-local-candidate-qa",
);

export const ANIMATION_ID = "shell-course-g04-l01-index-local";
export const FRAME_DOMAIN = "root";
export const ENDPOINT_FRAMES = Object.freeze([1, 50]);
export const LANGUAGES = Object.freeze(["en", "es"]);
export const SCENARIOS = Object.freeze([
  "default",
  "section-ir",
  "section-rw",
  "section-vb",
  "section-in",
  "section-ti",
  "section-gs",
  "section-ts",
  "section-fq",
  "quit-confirmation",
]);
export const AUTHORITY_CLAIM_KEYS = Object.freeze([
  "authoritativeFlashBaseline",
  "originalFlashVisualParity",
  "originalFlashBehaviorParity",
  "naturalOriginalRuntimeTraversal",
  "fullFrameCoverage",
  "fullFrameRmse",
  "audioParity",
  "sourceReplayParity",
  "strictValidator",
  "humanVisualReview",
  "ownerAcceptance",
  "strictMigrationCompletion",
]);

const falseClaims = Object.freeze(
  Object.fromEntries(AUTHORITY_CLAIM_KEYS.map((key) => [key, false])),
);

const implementationPaths = Object.freeze({
  rendererModule: "packages/demos/src/modules/shell-course-g04-l01-index-local.tsx",
  timelineModule: "packages/demos/src/timelines/shell-course-g04-l01-index-local.ts",
  unitTest: "packages/demos/tests/course-shell-g04-l01.test.ts",
  runtimeContract: "packages/demos/src/contract.ts",
  sharedRuntime: "packages/demos/src/runtime.ts",
  animationRegistry: "packages/demos/src/animation-registry.ts",
  prototypeManifest: "packages/demos/src/prototype-manifest.ts",
  webRuntime: "apps/web/components/animation-runtime.tsx",
  routeModule: "apps/web/app/[locale]/animations/[animationId]/page.tsx",
  routeCatalog: "apps/web/lib/catalog.ts",
  catalogOverlays: "apps/web/lib/catalog-overlays.ts",
  webStyles: "apps/web/app/globals.css",
  animationCatalog: "catalog/animations.json",
  rendererEndpointAudit:
    "migrations/shell-course-g04-l01-index-local/audit/renderer-frame-domain-support.json",
  generatorTest: "scripts/qa-shell-g04-l01-candidate.test.mjs",
  overlayGuard: "scripts/qa-next-dev-overlay.mjs",
});
export const IMPLEMENTATION_PATHS = implementationPaths;

const sourceRecords = Object.freeze([
  Object.freeze({
    path: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L1/index_local.swf",
    expectedSha256: "ade6cd4b47d8948ae975b6cbceac2c24c91341e94b61e4ce683b4307f373779e",
  }),
  Object.freeze({
    path: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L1/index.xml",
    expectedSha256: "b14d31c2f2c7cd83cc1e2de8bfe5463734b64572756b2677c09e851c46c670b2",
  }),
]);

export function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function portable(filePath) {
  return path.relative(projectRoot, filePath).split(path.sep).join("/");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

export function normalizeLoopbackBaseUrl(value) {
  const parsed = new URL(value);
  const hostname = parsed.hostname.replace(/^\[|\]$/g, "");
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("--base-url must use http or https");
  }
  if (!["localhost", "127.0.0.1", "::1"].includes(hostname)) {
    throw new Error("--base-url must use a loopback or localhost hostname");
  }
  if (
    parsed.username ||
    parsed.password ||
    parsed.search ||
    parsed.hash ||
    !["", "/"].includes(parsed.pathname)
  ) {
    throw new Error("--base-url must be an origin without credentials, path, query, or fragment");
  }
  return parsed.toString().replace(/\/$/, "");
}

export function parseArguments(argv) {
  const options = {baseUrl: defaultBaseUrl, help: false};
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--base-url") {
      if (!argv[index + 1]) throw new Error("--base-url requires a value");
      options.baseUrl = argv[index + 1];
      index += 1;
    } else if (value === "--help" || value === "-h") {
      options.help = true;
    } else {
      throw new Error(`Unknown option: ${value}`);
    }
  }
  if (!options.help) options.baseUrl = normalizeLoopbackBaseUrl(options.baseUrl);
  return options;
}

export function buildEndpointMatrix(seed = 11) {
  return Object.freeze(
    SCENARIOS.flatMap((scenario) =>
      LANGUAGES.flatMap((language) =>
        ENDPOINT_FRAMES.map((frame) =>
          Object.freeze({frame, frameDomain: FRAME_DOMAIN, scenario, language, seed}),
        ),
      ),
    ),
  );
}

export function buildCandidateQaIdentity({frame, scenario, language, seed}) {
  const entryState = Object.freeze({
    kind: "engineering-shell-candidate-browser-qa",
    animationId: ANIMATION_ID,
    frameDomain: FRAME_DOMAIN,
    frame,
    scenario,
    language,
    seed,
  });
  return Object.freeze({
    requirementId: `qa:root:${scenario}:${language}`,
    traceId: `qa-trace:root:${scenario}:${language}:seed-${seed}`,
    entryState,
    entryStateSha256: sha256(JSON.stringify(entryState)),
  });
}

export function buildCandidateUrl(
  baseUrl,
  request,
  {capture = true, omitFrame = false} = {},
) {
  const identity = buildCandidateQaIdentity(request);
  const localePrefix = request.language === "es" ? "/es" : "";
  const url = new URL(
    `${localePrefix}/animations/${ANIMATION_ID}`,
    `${normalizeLoopbackBaseUrl(baseUrl)}/`,
  );
  if (!omitFrame) url.searchParams.set("frame", String(request.frame));
  url.searchParams.set("frameDomain", FRAME_DOMAIN);
  url.searchParams.set("scenario", request.scenario);
  url.searchParams.set("lang", request.language);
  url.searchParams.set("seed", String(request.seed));
  url.searchParams.set("requirementId", identity.requirementId);
  url.searchParams.set("trace", identity.traceId);
  url.searchParams.set("entryStateSha256", identity.entryStateSha256);
  if (capture) url.searchParams.set("capture", "1");
  return Object.freeze({url: url.toString(), identity});
}

export function allAuthorityClaimsFalse(claims) {
  return (
    Object.keys(claims ?? {}).length === AUTHORITY_CLAIM_KEYS.length &&
    AUTHORITY_CLAIM_KEYS.every((key) => claims?.[key] === false)
  );
}

export function protectedMigrationSnapshot(manifest) {
  return Object.freeze({
    status: manifest?.status,
    baseline: manifest?.baseline,
    humanVisualReview: manifest?.acceptance?.humanVisualReview,
    currentJavaScriptOutputApproval: manifest?.acceptance?.currentJavaScriptOutputApproval,
    ownerReview: manifest?.acceptance?.ownerReview,
  });
}

export function bindCandidateQaHash(manifest, reportSha256) {
  assert(/^[a-f0-9]{64}$/.test(reportSha256), "candidate QA hash must be SHA-256");
  const next = structuredClone(manifest);
  next.evidence = next.evidence ?? {};
  next.evidence.candidateQaFile = "evidence/native-navigation-candidate-qa.json";
  next.evidence.candidateQaSha256 = reportSha256;
  return next;
}

export function expectedEndpointState({frame, scenario}) {
  const ready = frame === 50;
  const view = !ready
    ? "menu"
    : scenario === "quit-confirmation"
      ? "quit-confirmation"
      : scenario.startsWith("section-")
        ? "section"
        : "menu";
  return Object.freeze({phase: ready ? "ready" : "loading-content", view});
}

function runtimeContextMatches(runtime, request, identity) {
  return (
    runtime?.animationId === ANIMATION_ID &&
    runtime?.frameDomain === FRAME_DOMAIN &&
    runtime?.requirementId === identity.requirementId &&
    runtime?.traceId === identity.traceId &&
    runtime?.entryStateSha256 === identity.entryStateSha256 &&
    runtime?.scenario === request.scenario &&
    runtime?.language === request.language &&
    runtime?.seed === String(request.seed)
  );
}

export function runtimeAndCandidateIdentityPass(state, request, identity) {
  return Boolean(
    runtimeContextMatches(state?.runtime, request, identity) &&
      state?.candidate?.animationId === ANIMATION_ID &&
      state.candidate.frameDomain === FRAME_DOMAIN &&
      state.candidate.stateFrameDomain === FRAME_DOMAIN &&
      state.candidate.requirementId === identity.requirementId &&
      state.candidate.traceId === identity.traceId &&
      state.candidate.entryStateSha256 === identity.entryStateSha256 &&
      state.candidate.scenario === request.scenario &&
      state.candidate.language === request.language &&
      state.candidate.seed === String(request.seed) &&
      state.candidate.renderState === "ready" &&
      state.candidate.renderVisual === "true"
  );
}

export function endpointIdentityPass(state, request, identity) {
  const expected = expectedEndpointState(request);
  return Boolean(
    runtimeAndCandidateIdentityPass(state, request, identity) &&
      state.runtime.frame === String(request.frame) &&
      state.runtime.rootFrame === String(request.frame) &&
      state.candidate.frame === String(request.frame) &&
      state.candidate.rootFrame === String(request.frame) &&
      state.candidate.phase === expected.phase &&
      state.candidate.view === expected.view &&
      state.stage?.width === 800 &&
      state.stage?.height === 600
  );
}

function createDiagnostics() {
  return {
    console: {messages: 0, errors: [], warnings: []},
    pageErrors: [],
    network: {
      requestCount: 0,
      observedOrigins: new Set(),
      failedRequests: [],
      httpErrors: [],
      unexpectedRequests: [],
    },
  };
}

function monitorPage(page, baseUrl, diagnostics) {
  const expected = new URL(baseUrl);
  const expectedHost = expected.hostname.replace(/^\[|\]$/g, "");
  const expectedPort = expected.port || (expected.protocol === "https:" ? "443" : "80");
  page.on("console", (message) => {
    diagnostics.console.messages += 1;
    const record = {url: page.url(), text: message.text()};
    if (message.type() === "error") diagnostics.console.errors.push(record);
    if (message.type() === "warning") diagnostics.console.warnings.push(record);
  });
  page.on("pageerror", (error) => {
    diagnostics.pageErrors.push({url: page.url(), text: error.message});
  });
  page.on("request", (request) => {
    diagnostics.network.requestCount += 1;
    const url = request.url();
    let parsed;
    try {
      parsed = new URL(url);
    } catch {
      diagnostics.network.unexpectedRequests.push(url);
      return;
    }
    if (!["http:", "https:", "ws:", "wss:"].includes(parsed.protocol)) return;
    diagnostics.network.observedOrigins.add(parsed.origin);
    const host = parsed.hostname.replace(/^\[|\]$/g, "");
    const secure = parsed.protocol === "https:" || parsed.protocol === "wss:";
    const port = parsed.port || (secure ? "443" : "80");
    if (
      host !== expectedHost ||
      port !== expectedPort ||
      !["localhost", "127.0.0.1", "::1"].includes(host)
    ) {
      diagnostics.network.unexpectedRequests.push(url);
    }
  });
  page.on("requestfailed", (request) => {
    diagnostics.network.failedRequests.push({
      url: request.url(),
      error: request.failure()?.errorText || "failed",
    });
  });
  page.on("response", (response) => {
    if (response.status() >= 400) {
      diagnostics.network.httpErrors.push({url: response.url(), status: response.status()});
    }
  });
}

function finishDiagnostics(diagnostics) {
  return {
    console: diagnostics.console,
    pageErrors: diagnostics.pageErrors,
    network: {
      ...diagnostics.network,
      observedOrigins: [...diagnostics.network.observedOrigins].sort(),
    },
  };
}

async function settlePage(page) {
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
  );
}

async function readStageState(page) {
  return page.evaluate(() => {
    const runtimeShell = document.querySelector(".runtime-shell");
    const runtime = document.querySelector(".runtime-stage");
    const candidate = document.querySelector(".course-shell-stage");
    const rect = candidate?.getBoundingClientRect();
    const active = document.activeElement;
    return {
      runtimeReplay: Number(runtimeShell?.getAttribute("data-runtime-replay") || "0"),
      runtime: {
        animationId: runtime?.getAttribute("data-animation-id") || null,
        frame: runtime?.getAttribute("data-flash-frame") || null,
        frameDomain: runtime?.getAttribute("data-flash-frame-domain") || null,
        rootFrame: runtime?.getAttribute("data-flash-root-frame") || null,
        requirementId: runtime?.getAttribute("data-flash-requirement-id") || null,
        traceId: runtime?.getAttribute("data-flash-trace-id") || null,
        entryStateSha256:
          runtime?.getAttribute("data-flash-entry-state-sha256") || null,
        scenario: runtime?.getAttribute("data-runtime-scenario") || null,
        language: runtime?.getAttribute("data-runtime-language") || null,
        seed: runtime?.getAttribute("data-runtime-seed") || null,
      },
      candidate: {
        animationId: candidate?.getAttribute("data-animation-id") || null,
        frame: candidate?.getAttribute("data-flash-frame") || null,
        frameDomain: candidate?.getAttribute("data-flash-frame-domain") || null,
        stateFrameDomain: candidate?.getAttribute("data-state-frame-domain") || null,
        rootFrame: candidate?.getAttribute("data-flash-root-frame") || null,
        requirementId: candidate?.getAttribute("data-flash-requirement-id") || null,
        traceId: candidate?.getAttribute("data-flash-trace-id") || null,
        entryStateSha256:
          candidate?.getAttribute("data-flash-entry-state-sha256") || null,
        scenario: candidate?.getAttribute("data-runtime-scenario") || null,
        language: candidate?.getAttribute("data-runtime-language") || null,
        seed: candidate?.getAttribute("data-runtime-seed") || null,
        renderState: candidate?.getAttribute("data-render-state") || null,
        renderVisual: candidate?.getAttribute("data-render-visual") || null,
        phase: candidate?.getAttribute("data-shell-phase") || null,
        view: candidate?.getAttribute("data-shell-view") || null,
      },
      stage: rect
        ? {x: rect.x, right: rect.right, width: rect.width, height: rect.height}
        : null,
      content: {
        pageRows: candidate?.querySelectorAll(".course-shell-pages li").length ?? 0,
        pageLinks:
          candidate?.querySelectorAll('.course-shell-pages a[href*="/animations/"]').length ?? 0,
        disabledPageButtons:
          candidate?.querySelectorAll(".course-shell-pages button:disabled").length ?? 0,
        dialogVisible: Boolean(candidate?.querySelector('[role="dialog"]')),
        affirmativeCloseDisabled: Boolean(
          candidate?.querySelector('.course-shell-modal button:disabled'),
        ),
      },
      focus: active
        ? {
            tag: active.tagName,
            text: active.textContent?.replace(/\s+/g, " ").trim() || "",
          }
        : null,
      document: {
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
      },
      route: {pathname: location.pathname, origin: location.origin},
    };
  });
}

async function waitForEndpoint(page, request, identity) {
  await page.waitForFunction(
    ({animationId, frame, frameDomain, scenario, language, seed, requirementId, traceId, entryStateSha256}) => {
      const runtime = document.querySelector(".runtime-stage");
      const candidate = document.querySelector(".course-shell-stage");
      return (
        runtime?.getAttribute("data-animation-id") === animationId &&
        runtime?.getAttribute("data-flash-frame") === String(frame) &&
        runtime?.getAttribute("data-flash-frame-domain") === frameDomain &&
        runtime?.getAttribute("data-flash-root-frame") === String(frame) &&
        runtime?.getAttribute("data-flash-requirement-id") === requirementId &&
        runtime?.getAttribute("data-flash-trace-id") === traceId &&
        runtime?.getAttribute("data-flash-entry-state-sha256") === entryStateSha256 &&
        runtime?.getAttribute("data-runtime-scenario") === scenario &&
        runtime?.getAttribute("data-runtime-language") === language &&
        runtime?.getAttribute("data-runtime-seed") === String(seed) &&
        candidate?.getAttribute("data-flash-frame") === String(frame) &&
        candidate?.getAttribute("data-flash-frame-domain") === frameDomain &&
        candidate?.getAttribute("data-state-frame-domain") === frameDomain &&
        candidate?.getAttribute("data-flash-root-frame") === String(frame) &&
        candidate?.getAttribute("data-flash-requirement-id") === requirementId &&
        candidate?.getAttribute("data-flash-trace-id") === traceId &&
        candidate?.getAttribute("data-flash-entry-state-sha256") === entryStateSha256 &&
        candidate?.getAttribute("data-runtime-scenario") === scenario &&
        candidate?.getAttribute("data-runtime-language") === language &&
        candidate?.getAttribute("data-runtime-seed") === String(seed)
      );
    },
    {
      animationId: ANIMATION_ID,
      frame: request.frame,
      frameDomain: FRAME_DOMAIN,
      scenario: request.scenario,
      language: request.language,
      seed: request.seed,
      ...identity,
    },
    {timeout: 45_000},
  );
  await settlePage(page);
}

async function captureStage(page, filename) {
  const stage = page.locator(".course-shell-stage").first();
  const devOverlaySuppression = await suppressNextDevOverlayForCapture(page, sha256);
  const destination = path.join(screenshotRoot, filename);
  await mkdir(path.dirname(destination), {recursive: true});
  await stage.scrollIntoViewIfNeeded();
  const bounds = await stage.boundingBox();
  assert(bounds && bounds.width > 0 && bounds.height > 0, "candidate stage has no capture bounds");
  const clip = {
    x: Math.floor(bounds.x),
    y: Math.floor(bounds.y),
    width: Math.round(bounds.width),
    height: Math.round(bounds.height),
  };
  await page.screenshot({path: destination, animations: "disabled", clip});
  await finalizeNextDevOverlayCapture(page, devOverlaySuppression);
  const bytes = await readFile(destination);
  const png = PNG.sync.read(bytes);
  return {
    path: portable(destination),
    sha256: sha256(bytes),
    width: png.width,
    height: png.height,
    devOverlaySuppression,
  };
}

async function runEndpointMatrix(browser, baseUrl, diagnostics) {
  const context = await browser.newContext({
    viewport: {width: 1280, height: 900},
    deviceScaleFactor: 1,
    reducedMotion: "no-preference",
  });
  const page = await context.newPage();
  monitorPage(page, baseUrl, diagnostics);
  const representative = new Map([
    ["default:en:1", "root-default-en-frame-0001.png"],
    ["default:en:50", "root-default-en-frame-0050.png"],
    ["section-in:es:50", "root-section-in-es-frame-0050.png"],
    ["quit-confirmation:en:50", "root-quit-confirmation-en-frame-0050.png"],
  ]);
  const matrix = [];
  try {
    for (const request of buildEndpointMatrix()) {
      const {url, identity} = buildCandidateUrl(baseUrl, request);
      await page.goto(url, {waitUntil: "domcontentloaded"});
      await waitForEndpoint(page, request, identity);
      const before = await readStageState(page);
      await page.waitForTimeout(100);
      const after = await readStageState(page);
      const identityMatched =
        endpointIdentityPass(before, request, identity) &&
        endpointIdentityPass(after, request, identity);
      const frozen =
        before.runtime.frame === after.runtime.frame &&
        before.runtime.frameDomain === after.runtime.frameDomain &&
        before.runtime.scenario === after.runtime.scenario &&
        before.runtime.language === after.runtime.language &&
        before.runtime.seed === after.runtime.seed &&
        before.candidate.phase === after.candidate.phase &&
        before.candidate.view === after.candidate.view;
      const captureName = representative.get(
        `${request.scenario}:${request.language}:${request.frame}`,
      );
      const capture = captureName ? await captureStage(page, captureName) : null;
      const capturePass = !capture || (capture.width === 800 && capture.height === 600);
      matrix.push({
        requested: {...request, ...identity},
        expected: expectedEndpointState(request),
        before,
        after,
        identityMatched,
        frozen,
        capture,
        pass: identityMatched && frozen && capturePass,
      });
    }
  } finally {
    await context.close();
  }
  return {
    expectedCaseCount: 40,
    observedCaseCount: matrix.length,
    exactIdentityCount: matrix.filter(({identityMatched}) => identityMatched).length,
    frozenCount: matrix.filter(({frozen}) => frozen).length,
    nativeStageCount: matrix.filter(
      ({before}) => before.stage?.width === 800 && before.stage?.height === 600,
    ).length,
    representativeCaptureCount: matrix.filter(({capture}) => capture).length,
    matrix,
    pass: matrix.length === 40 && matrix.every(({pass}) => pass),
  };
}

async function runNavigation(browser, baseUrl, diagnostics) {
  const context = await browser.newContext({
    viewport: {width: 1280, height: 900},
    deviceScaleFactor: 1,
    reducedMotion: "no-preference",
  });
  const page = await context.newPage();
  monitorPage(page, baseUrl, diagnostics);
  const request = {frame: 50, scenario: "default", language: "en", seed: 11};
  const {url, identity} = buildCandidateUrl(baseUrl, request);
  try {
    await page.goto(url, {waitUntil: "domcontentloaded"});
    await waitForEndpoint(page, request, identity);
    const pathnameBefore = new URL(page.url()).pathname;
    await page
      .locator("nav.course-shell-sections button")
      .filter({hasText: "Learn It"})
      .click();
    await page.locator('[data-shell-view="section"]').waitFor({timeout: 15_000});
    const section = await readStageState(page);
    await page.locator(".course-shell-section-heading > button").click();
    await page.locator('[data-shell-view="menu"]').waitFor({timeout: 15_000});
    const menu = await readStageState(page);
    await page.locator('[aria-label="Request close"]').click();
    const dialog = page.locator('[role="dialog"]');
    await dialog.waitFor({timeout: 15_000});
    await page.waitForFunction(() => document.activeElement?.textContent?.trim() === "No");
    const quit = await readStageState(page);
    await page.keyboard.press("Escape");
    await dialog.waitFor({state: "hidden", timeout: 15_000});
    const afterEscape = await readStageState(page);
    const pathnameAfter = new URL(page.url()).pathname;
    return {
      route: {
        pathnameBefore,
        pathnameAfter,
        sameLocalRoute: pathnameBefore === pathnameAfter,
        origin: new URL(page.url()).origin,
      },
      section,
      menu,
      quit,
      afterEscape,
      pass:
        pathnameBefore === `/animations/${ANIMATION_ID}` &&
        pathnameAfter === pathnameBefore &&
        section.candidate.view === "section" &&
        section.content.pageRows === 35 &&
        section.content.disabledPageButtons === 35 &&
        section.content.pageLinks === 0 &&
        menu.candidate.view === "menu" &&
        quit.candidate.view === "quit-confirmation" &&
        quit.content.dialogVisible &&
        quit.content.affirmativeCloseDisabled &&
        quit.focus?.text === "No" &&
        afterEscape.candidate.view === "menu" &&
        !afterEscape.content.dialogVisible,
    };
  } finally {
    await context.close();
  }
}

async function triggerButton(page, locator, input) {
  if (input === "pointer") await locator.click();
  else {
    await locator.focus();
    await page.keyboard.press(input);
  }
}

async function installReplayFrameObserver(page) {
  await page.evaluate(() => {
    const runtime = document.querySelector(".runtime-stage");
    window.__helpMathShellQaReplayFrames = [];
    const record = () => {
      const frame = runtime?.getAttribute("data-flash-frame");
      if (frame) window.__helpMathShellQaReplayFrames.push(frame);
    };
    record();
    new MutationObserver(record).observe(runtime, {
      attributes: true,
      attributeFilter: ["data-flash-frame"],
    });
  });
}

async function runHostReplayCase(browser, baseUrl, diagnostics, input) {
  const context = await browser.newContext({
    viewport: {width: 1200, height: 900},
    reducedMotion: "no-preference",
  });
  const page = await context.newPage();
  monitorPage(page, baseUrl, diagnostics);
  const request = {frame: 1, scenario: "default", language: "en", seed: 11};
  const {url, identity} = buildCandidateUrl(baseUrl, request, {
    capture: false,
    omitFrame: true,
  });
  try {
    await page.goto(url, {waitUntil: "domcontentloaded"});
    await page.locator(".runtime-stage").waitFor({timeout: 45_000});
    await page.waitForFunction(
      () => Number(document.querySelector(".runtime-stage")?.getAttribute("data-flash-frame")) >= 7,
      undefined,
      {timeout: 45_000},
    );
    const before = await readStageState(page);
    await installReplayFrameObserver(page);
    const control = page.locator(".runtime-toolbar__actions [data-replay-keyboard]").first();
    await triggerButton(page, control, input);
    await page.waitForFunction(
      () =>
        document.querySelector(".runtime-shell")?.getAttribute("data-runtime-replay") === "1" &&
        window.__helpMathShellQaReplayFrames?.includes("1"),
      undefined,
      {timeout: 15_000},
    );
    const after = await readStageState(page);
    const observedFrames = await page.evaluate(() => [
      ...new Set(window.__helpMathShellQaReplayFrames || []),
    ]);
    return {
      control: "host",
      input,
      identity,
      before,
      after,
      observedFrames,
      pass:
        before.runtimeReplay === 0 &&
        Number(before.runtime.frame) >= 7 &&
        after.runtimeReplay === 1 &&
        observedFrames.includes("1") &&
        runtimeContextMatches(before.runtime, request, identity) &&
        runtimeContextMatches(after.runtime, request, identity),
    };
  } finally {
    await context.close();
  }
}

async function runCandidateReplayCase(browser, baseUrl, diagnostics, input) {
  const context = await browser.newContext({
    viewport: {width: 1280, height: 900},
    reducedMotion: "no-preference",
  });
  const page = await context.newPage();
  monitorPage(page, baseUrl, diagnostics);
  const request = {frame: 50, scenario: "section-in", language: "en", seed: 11};
  const {url, identity} = buildCandidateUrl(baseUrl, request);
  try {
    await page.goto(url, {waitUntil: "domcontentloaded"});
    await waitForEndpoint(page, request, identity);
    await page.locator('[data-shell-view="section"]').waitFor({timeout: 15_000});
    const before = await readStageState(page);
    const control = page.locator(".course-shell-footer button").first();
    await triggerButton(page, control, input);
    await page.waitForFunction(
      () =>
        document.querySelector(".runtime-shell")?.getAttribute("data-runtime-replay") === "1" &&
        document.querySelector(".course-shell-stage")?.getAttribute("data-shell-view") === "menu",
      undefined,
      {timeout: 15_000},
    );
    const after = await readStageState(page);
    return {
      control: "candidate",
      input,
      identity,
      before,
      after,
      pass:
        before.runtimeReplay === 0 &&
        before.candidate.view === "section" &&
        after.runtimeReplay === 1 &&
        after.runtime.frame === "50" &&
        after.candidate.frame === "50" &&
        after.candidate.view === "menu" &&
        runtimeContextMatches(before.runtime, request, identity) &&
        runtimeContextMatches(after.runtime, request, identity),
    };
  } finally {
    await context.close();
  }
}

async function runReplayMatrix(browser, baseUrl, diagnostics) {
  const cases = [];
  for (const input of ["pointer", "Enter", "Space"]) {
    cases.push(await runHostReplayCase(browser, baseUrl, diagnostics, input));
    cases.push(await runCandidateReplayCase(browser, baseUrl, diagnostics, input));
  }
  return {cases, pass: cases.length === 6 && cases.every(({pass}) => pass)};
}

async function runMobile(browser, baseUrl, diagnostics) {
  const context = await browser.newContext({
    viewport: {width: 390, height: 844},
    deviceScaleFactor: 1,
    reducedMotion: "no-preference",
  });
  const page = await context.newPage();
  monitorPage(page, baseUrl, diagnostics);
  const request = {frame: 50, scenario: "section-vb", language: "es", seed: 11};
  const {url, identity} = buildCandidateUrl(baseUrl, request, {capture: false});
  try {
    await page.goto(url, {waitUntil: "domcontentloaded"});
    await waitForEndpoint(page, request, identity);
    const before = await readStageState(page);
    const descendantOffenders = await page.evaluate(() => {
      const stage = document.querySelector(".course-shell-stage");
      if (!stage) return -1;
      const bounds = stage.getBoundingClientRect();
      return [...stage.querySelectorAll("*")].filter((element) => {
        const style = getComputedStyle(element);
        if (style.display === "none" || style.visibility === "hidden") return false;
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && (rect.left < bounds.left - 1 || rect.right > bounds.right + 1);
      }).length;
    });
    const screenshot = await captureStage(page, "mobile-section-vb-es.png");
    await page.locator('[aria-label="Solicitar cierre"]').click();
    await page.waitForFunction(() => document.activeElement?.textContent?.trim() === "No");
    const quit = await readStageState(page);
    await page.keyboard.press("Escape");
    await page.locator('[role="dialog"]').waitFor({state: "hidden", timeout: 15_000});
    const afterEscape = await readStageState(page);
    return {
      viewport: {width: 390, height: 844},
      before,
      descendantOffenders,
      screenshot,
      quit,
      afterEscape,
      pass:
        runtimeAndCandidateIdentityPass(before, request, identity) &&
        before.runtime.frame === "50" &&
        before.runtime.rootFrame === "50" &&
        before.candidate.frame === "50" &&
        before.candidate.rootFrame === "50" &&
        before.candidate.phase === "ready" &&
        before.candidate.view === "section" &&
        before.stage.width > 0 &&
        before.stage.width <= before.document.clientWidth &&
        before.stage.x >= 0 &&
        before.stage.right <= before.document.clientWidth + 1 &&
        before.document.scrollWidth === before.document.clientWidth &&
        descendantOffenders === 0 &&
        quit.content.dialogVisible &&
        quit.focus?.text === "No" &&
        !afterEscape.content.dialogVisible,
    };
  } finally {
    await context.close();
  }
}

async function runReducedMotion(browser, baseUrl, diagnostics) {
  const context = await browser.newContext({
    viewport: {width: 1200, height: 900},
    deviceScaleFactor: 1,
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  monitorPage(page, baseUrl, diagnostics);
  const request = {frame: 50, scenario: "section-in", language: "es", seed: 11};
  const {url, identity} = buildCandidateUrl(baseUrl, request, {
    capture: false,
    omitFrame: true,
  });
  try {
    await page.goto(url, {waitUntil: "domcontentloaded"});
    await waitForEndpoint(page, request, identity);
    const state = await readStageState(page);
    const note = page.locator(".reduced-motion-note");
    await note.waitFor({timeout: 15_000});
    const noteText = (await note.textContent())?.replace(/\s+/g, " ").trim() || "";
    const screenshot = await captureStage(page, "reduced-motion-section-in-es.png");
    return {
      requestedPreference: "reduce",
      state,
      noteText,
      screenshot,
      pass:
        endpointIdentityPass(state, request, identity) &&
        state.candidate.phase === "ready" &&
        state.candidate.view === "section" &&
        /movimiento.*reducido/i.test(noteText) &&
        screenshot.width === 800 &&
        screenshot.height === 600,
    };
  } finally {
    await context.close();
  }
}

async function fileRecord(relativePath) {
  const bytes = await readFile(path.join(projectRoot, relativePath));
  return {path: relativePath, sha256: sha256(bytes), bytes: bytes.length};
}

async function implementationRecords() {
  return Object.fromEntries(
    await Promise.all(
      Object.entries(implementationPaths).map(async ([role, relativePath]) => [
        role,
        await fileRecord(relativePath),
      ]),
    ),
  );
}

async function sourceEvidence() {
  return Promise.all(
    sourceRecords.map(async (record) => {
      const actual = await fileRecord(record.path);
      return {...actual, expectedSha256: record.expectedSha256, exact: actual.sha256 === record.expectedSha256};
    }),
  );
}

function screenshotRecords(endpointContract, mobile, reducedMotion) {
  return [
    ...endpointContract.matrix.map(({capture}) => capture).filter(Boolean),
    mobile.screenshot,
    reducedMotion.screenshot,
  ];
}

export function buildCompletionAdmissionSnapshot(navigation) {
  const content = navigation?.section?.content ?? {};
  const observedChildDestinationCount = content.pageRows ?? 0;
  const observedEnabledChildRouteCount = content.pageLinks ?? 0;
  const observedDisabledChildDestinationCount = content.disabledPageButtons ?? 0;
  return {
    authority: "non-authoritative-runtime-observation",
    source: "routeNavigation.section.content",
    observedChildDestinationCount,
    observedEnabledChildRouteCount,
    observedDisabledChildDestinationCount,
    observedPubliclyAdmittedChildLinkCount: observedEnabledChildRouteCount,
    ledgerFileHashPinned: false,
    pass:
      navigation?.pass === true &&
      observedChildDestinationCount === 35 &&
      observedEnabledChildRouteCount === 0 &&
      observedDisabledChildDestinationCount === 35,
    strictAcceptanceEffect: false,
    boundary:
      "The product route consults the completion ledger at runtime, but this QA records only the rendered navigation result. It deliberately does not hash-pin the ledger because that ledger validates and hashes this migration manifest, which binds this QA report.",
  };
}

function usage() {
  return "Usage: node scripts/qa-shell-g04-l01-candidate.mjs [--base-url http://127.0.0.1:3213]";
}

export async function runShellCandidateQa({baseUrl = defaultBaseUrl} = {}) {
  const normalizedBaseUrl = normalizeLoopbackBaseUrl(baseUrl);
  const migrationPath = path.join(projectRoot, migrationRelativePath);
  const reportPath = path.join(projectRoot, reportRelativePath);
  const manifest = JSON.parse(await readFile(migrationPath, "utf8"));
  const protectedBefore = protectedMigrationSnapshot(manifest);
  assert(manifest.animationId === ANIMATION_ID, "migration animationId mismatch");
  assert(manifest.status === "preserved", "shell migration status must remain preserved");
  assert(
    manifest.acceptance?.currentJavaScriptOutputApproval &&
      typeof manifest.acceptance.currentJavaScriptOutputApproval.decision === "string",
    "current JavaScript approval record is missing",
  );
  const [sources, implementation] = await Promise.all([
    sourceEvidence(),
    implementationRecords(),
  ]);
  assert(sources.every(({exact}) => exact), "preserved source hash mismatch");
  const rendererAudit = JSON.parse(
    await readFile(
      path.join(projectRoot, implementationPaths.rendererEndpointAudit),
      "utf8",
    ),
  );
  assert(rendererAudit.animationId === ANIMATION_ID, "renderer endpoint audit identity mismatch");
  assert(rendererAudit.summary?.probeCount === 40, "renderer endpoint audit must contain 40 probes");
  assert(rendererAudit.summary?.exactIdentityCount === 40, "renderer endpoint audit is not exact");
  assert(rendererAudit.summary?.outcomeCounts?.["identity-mismatch"] === 0, "renderer endpoint audit contains identity mismatch");

  const diagnostics = createDiagnostics();
  const browser = await chromium.launch({headless: true});
  const browserVersion = browser.version();
  let endpointContract;
  let navigation;
  let replay;
  let mobile;
  let reducedMotion;
  try {
    endpointContract = await runEndpointMatrix(browser, normalizedBaseUrl, diagnostics);
    navigation = await runNavigation(browser, normalizedBaseUrl, diagnostics);
    replay = await runReplayMatrix(browser, normalizedBaseUrl, diagnostics);
    mobile = await runMobile(browser, normalizedBaseUrl, diagnostics);
    reducedMotion = await runReducedMotion(browser, normalizedBaseUrl, diagnostics);
  } finally {
    await browser.close();
  }
  const completedDiagnostics = finishDiagnostics(diagnostics);
  const captures = screenshotRecords(endpointContract, mobile, reducedMotion);
  const completionAdmissionSnapshot = buildCompletionAdmissionSnapshot(navigation);
  const nextManifest = bindCandidateQaHash(manifest, "0".repeat(64));
  const protectedAfter = protectedMigrationSnapshot(nextManifest);
  const protectedUnchanged =
    JSON.stringify(protectedBefore) === JSON.stringify(protectedAfter);
  const diagnosticsPass =
    completedDiagnostics.console.errors.length === 0 &&
    completedDiagnostics.console.warnings.length === 0 &&
    completedDiagnostics.pageErrors.length === 0 &&
    completedDiagnostics.network.failedRequests.length === 0 &&
    completedDiagnostics.network.httpErrors.length === 0 &&
    completedDiagnostics.network.unexpectedRequests.length === 0;
  const overlayPass = captures.every(({devOverlaySuppression}) =>
    devOverlaySuppressionPass(devOverlaySuppression),
  );
  const assertions = [
    {id: "preserved-source-hashes", pass: sources.every(({exact}) => exact)},
    {
      id: "renderer-endpoint-audit-40-of-40-exact",
      pass:
        rendererAudit.summary.probeCount === 40 &&
        rendererAudit.summary.exactIdentityCount === 40 &&
        rendererAudit.summary.outcomeCounts["identity-mismatch"] === 0,
    },
    {id: "browser-endpoint-matrix-40-of-40-exact-and-frozen", pass: endpointContract.pass},
    {
      id: "representative-native-stage-captures-800x600",
      pass:
        endpointContract.representativeCaptureCount === 4 &&
        endpointContract.matrix
          .map(({capture}) => capture)
          .filter(Boolean)
          .every(({width, height}) => width === 800 && height === 600),
    },
    {id: "local-navigation-and-disabled-child-routes", pass: navigation.pass},
    {
      id: "non-authoritative-completion-admission-snapshot",
      pass: completionAdmissionSnapshot.pass,
    },
    {id: "replay-pointer-enter-space-host-and-candidate", pass: replay.pass},
    {id: "mobile-responsive-dialog-and-no-overflow", pass: mobile.pass},
    {id: "reduced-motion-safe-frame-50", pass: reducedMotion.pass},
    {
      id: "next-dev-overlay-suppressed-before-and-after-every-screenshot",
      pass: overlayPass,
      details: {captureCount: captures.length, captures},
    },
    {
      id: "console-page-and-loopback-only-network",
      pass: diagnosticsPass,
      details: completedDiagnostics,
    },
    {id: "authority-claims-remain-false", pass: allAuthorityClaimsFalse(falseClaims)},
    {
      id: "status-baseline-human-owner-and-user-approval-unchanged",
      pass:
        protectedUnchanged &&
        protectedAfter.status === "preserved" &&
        protectedAfter.humanVisualReview?.decision === "pending" &&
        protectedAfter.ownerReview?.decision === "pending",
    },
  ];
  const pass = assertions.every(({pass: assertionPass}) => assertionPass);
  const playwrightPackage = JSON.parse(
    await readFile(path.join(projectRoot, "node_modules/playwright/package.json"), "utf8"),
  );
  const report = {
    schemaVersion: 3,
    evidenceType: "shell-native-navigation-browser-candidate-qa",
    animationId: ANIMATION_ID,
    status: pass ? "pass" : "fail",
    recordedAt: new Date().toISOString(),
    scope:
      "Current native Next.js shell candidate only; exact renderer identity, browser behavior, responsiveness, accessibility basics, and local network safety.",
    acceptanceEffect: "none",
    strictAcceptanceEffect: false,
    generatedBy: {
      script: portable(scriptPath),
      scriptSha256: sha256(await readFile(scriptPath)),
      deterministic: false,
      reason: "Browser captures and recordedAt are regenerated on each local QA run.",
    },
    sources,
    implementation,
    environment: {
      baseUrl: normalizedBaseUrl,
      browser: browserVersion,
      playwright: playwrightPackage.version,
      serverMode: "local-development-audit",
      deviceScaleFactor: 1,
    },
    rendererEndpointContract: {
      evidence: implementation.rendererEndpointAudit,
      expectedEndpointCount: 40,
      probeCount: rendererAudit.summary.probeCount,
      exactIdentityCount: rendererAudit.summary.exactIdentityCount,
      renderableCount: rendererAudit.summary.renderableCount,
      identityMismatchCount: rendererAudit.summary.outcomeCounts["identity-mismatch"],
      strictAcceptanceEffect: rendererAudit.strictAcceptanceEffect,
    },
    deterministicContract: endpointContract,
    routeNavigation: navigation,
    completionAdmissionSnapshot,
    replay,
    mobile,
    reducedMotion,
    diagnostics: completedDiagnostics,
    captureGuard: implementation.overlayGuard,
    assertions,
    claims: falseClaims,
    authorityBoundary: falseClaims,
    limitations: [
      "No authoritative Adobe/original-host Flash baseline or natural runtime traversal is supplied by this report.",
      "The candidate screenshots are not pixel-fidelity evidence and have no full-frame RMSE comparison against Flash.",
      "Embedded and conditional shell audio remains unimplemented and unaccepted.",
      "Replay checks prove only the current JavaScript candidate reset contract, not source Flash Replay parity.",
      "All child destinations remain disabled until their own strict migrations are complete; missing sources are never guessed.",
      "Human visual review, owner acceptance, strict validation, and migration completion remain pending.",
    ],
    migrationStatusBefore: manifest.status,
    migrationStatusAfter: nextManifest.status,
    protectedMigrationSnapshotSha256: sha256(JSON.stringify(protectedBefore)),
  };
  const renderedReport = `${JSON.stringify(report, null, 2)}\n`;
  const reportSha256 = sha256(renderedReport);
  const finalManifest = bindCandidateQaHash(manifest, reportSha256);
  assert(
    JSON.stringify(protectedMigrationSnapshot(finalManifest)) ===
      JSON.stringify(protectedBefore),
    "QA refresh attempted to modify protected migration review/status/baseline fields",
  );
  await mkdir(path.dirname(reportPath), {recursive: true});
  await writeFile(reportPath, renderedReport, "utf8");
  await writeFile(migrationPath, `${JSON.stringify(finalManifest, null, 2)}\n`, "utf8");
  return {report, reportPath, reportSha256, migrationPath};
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) process.stdout.write(`${usage()}\n`);
  else {
    const result = await runShellCandidateQa(options);
    process.stdout.write(
      `${result.report.status.toUpperCase()}: ${portable(result.reportPath)} ` +
        `(40/40 endpoints exact; QA SHA-256 ${result.reportSha256})\n`,
    );
    if (result.report.status !== "pass") process.exitCode = 1;
  }
}
