#!/usr/bin/env node

import {createHash} from "node:crypto";
import {mkdir, readFile, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {chromium} from "playwright";
import {PNG} from "pngjs";
import {
  DEV_OVERLAY_CAPTURE_CSS,
  DEV_OVERLAY_CONTROL_SELECTOR,
  devOverlaySuppressionPass,
  finalizeDevOverlayCapture,
  normalizeServerMode,
  suppressDevOverlayForCapture,
} from "./formula-qa-dev-overlay.mjs";

export {DEV_OVERLAY_CAPTURE_CSS, DEV_OVERLAY_CONTROL_SELECTOR, devOverlaySuppressionPass, normalizeServerMode};

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_BASE_URL = "http://localhost:3213";
const OUTPUT_ROOT = path.join(ROOT, "output", "playwright", "formula-engineering-qa");
export const DEV_OVERLAY_CAPTURE_STYLE_ID = "help-math-formula-engineering-qa-hide-next-dev-overlay";
const VIEWPORTS = Object.freeze([
  Object.freeze({id: "desktop", width: 1440, height: 1000}),
  Object.freeze({id: "tablet", width: 768, height: 1024}),
  Object.freeze({id: "narrow", width: 390, height: 844}),
]);
const PILOTS = Object.freeze([
  Object.freeze({animationId: "formula-elementary-conversion-01-01", moduleKey: "conversion-1-1", frameCount: 94, panelY: 240.85, panelProbeFrames: [1, 52, 53, 94]}),
  Object.freeze({animationId: "formula-elementary-conversion-01-02", moduleKey: "conversion-1-2", frameCount: 109, panelY: 322.85, panelProbeFrames: [1, 55, 109]}),
  Object.freeze({animationId: "formula-elementary-conversion-01-03", moduleKey: "conversion-1-3", frameCount: 170, panelY: 322.85, panelProbeFrames: [1, 85, 170]}),
  Object.freeze({animationId: "formula-elementary-conversion-01-04", moduleKey: "conversion-1-4", frameCount: 67, panelY: 290.85, panelProbeFrames: [1, 34, 67]}),
]);

function argument(name, fallback) {
  const index = process.argv.indexOf(name);
  return index === -1 ? fallback : process.argv[index + 1];
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function portable(filePath) {
  return path.relative(ROOT, filePath).split(path.sep).join("/");
}

function check(id, pass, details = null) {
  return {id, pass: Boolean(pass), details};
}

function result(checks) {
  return checks.every((entry) => entry.pass);
}

export function buildFormulaQaIdentity(pilot, purpose, language = "en", seed = 0) {
  const entryState = {
    kind: "formula-engineering-candidate-product-qa",
    animationId: pilot.animationId,
    purpose,
    frameDomain: "root",
    scenario: "default",
    language,
    seed,
  };
  return Object.freeze({
    frameDomain: "root",
    requirementId: `qa:formula:${pilot.animationId}:${purpose}:default:${language}`,
    traceId: `qa-trace:formula:${pilot.animationId}:${purpose}:default:${language}:seed-${seed}`,
    entryState,
    entryStateSha256: sha256(JSON.stringify(entryState)),
  });
}

function queryFor(identity, {frame, capture = false} = {}) {
  const query = new URLSearchParams({
    frameDomain: identity.frameDomain,
    requirementId: identity.requirementId,
    trace: identity.traceId,
    entryStateSha256: identity.entryStateSha256,
    scenario: identity.entryState.scenario,
    lang: identity.entryState.language,
    seed: String(identity.entryState.seed),
  });
  if (frame !== undefined) query.set("frame", String(frame));
  if (capture) query.set("capture", "1");
  return query.toString();
}

async function runtimeState(page) {
  return page.evaluate(() => {
    const runtime = document.querySelector(".runtime-stage");
    const candidate = document.querySelector(".faithful-stage-wrap");
    const shell = document.querySelector(".runtime-shell");
    return {
      replay: Number(shell?.getAttribute("data-runtime-replay")),
      runtime: {
        animationId: runtime?.getAttribute("data-animation-id") || null,
        frame: runtime?.getAttribute("data-flash-frame") || null,
        rootFrame: runtime?.getAttribute("data-flash-root-frame") || null,
        frameDomain: runtime?.getAttribute("data-flash-frame-domain") || null,
        requirementId: runtime?.getAttribute("data-flash-requirement-id") || null,
        traceId: runtime?.getAttribute("data-flash-trace-id") || null,
        entryStateSha256: runtime?.getAttribute("data-flash-entry-state-sha256") || null,
        scenario: runtime?.getAttribute("data-runtime-scenario") || null,
        language: runtime?.getAttribute("data-runtime-language") || null,
        seed: runtime?.getAttribute("data-runtime-seed") || null,
      },
      candidate: {
        frame: candidate?.getAttribute("data-flash-frame") || null,
        language: candidate?.getAttribute("data-runtime-language") || null,
      },
    };
  });
}

function runtimeIdentityMatches(state, pilot, identity) {
  return state?.animationId === pilot.animationId
    && state.frameDomain === identity.frameDomain
    && state.requirementId === identity.requirementId
    && state.traceId === identity.traceId
    && state.entryStateSha256 === identity.entryStateSha256
    && state.scenario === identity.entryState.scenario
    && state.language === identity.entryState.language
    && state.seed === String(identity.entryState.seed);
}

export function replayResetIdentityPass({pilot, identity, before, reset, resumed}) {
  const beforeFrame = Number(before?.runtime?.frame);
  const resetFrame = Number(reset?.runtime?.frame);
  const resumedFrame = Number(resumed?.runtime?.frame);
  return Boolean(
    Number.isInteger(before?.replay)
      && reset?.replay === before.replay + 1
      && resumed?.replay === reset.replay
      && runtimeIdentityMatches(before?.runtime, pilot, identity)
      && runtimeIdentityMatches(reset?.runtime, pilot, identity)
      && runtimeIdentityMatches(resumed?.runtime, pilot, identity)
      && beforeFrame > 2
      && resetFrame === 1
      && reset.runtime.rootFrame === "1"
      && reset.candidate?.frame === "1"
      && resumedFrame >= 2
      && resumed.runtime.rootFrame === resumed.runtime.frame
      && resumed.candidate?.frame === resumed.runtime.frame,
  );
}

async function screenshot(page, locator, filePath, serverMode) {
  const devOverlaySuppression = await suppressDevOverlayForCapture(page, {
    serverMode,
    styleId: DEV_OVERLAY_CAPTURE_STYLE_ID,
    marker: "helpMathFormulaEngineeringQaCaptureHidden",
  });
  await mkdir(path.dirname(filePath), {recursive: true});
  await locator.screenshot({path: filePath, animations: "disabled"});
  await finalizeDevOverlayCapture(page, devOverlaySuppression);
  const bytes = await readFile(filePath);
  const png = PNG.sync.read(bytes);
  return {file: portable(filePath), sha256: sha256(bytes), width: png.width, height: png.height, devOverlaySuppression};
}

function attachDiagnostics(page, diagnostics, allowedOrigin) {
  page.on("console", (message) => {
    if (message.type() === "error") diagnostics.consoleErrors.push({url: page.url(), text: message.text()});
  });
  page.on("pageerror", (error) => diagnostics.pageErrors.push({url: page.url(), message: error.message}));
  page.on("requestfailed", (request) => diagnostics.failedRequests.push({url: request.url(), error: request.failure()?.errorText ?? null}));
  page.on("response", (response) => {
    if (response.status() >= 400) diagnostics.httpErrors.push({url: response.url(), status: response.status()});
  });
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (!['http:', 'https:', 'data:', 'blob:'].includes(url.protocol)) diagnostics.unexpectedRequests.push({url: request.url(), reason: "unsupported-protocol"});
    if ((url.protocol === 'http:' || url.protocol === 'https:') && url.origin !== allowedOrigin) {
      diagnostics.unexpectedRequests.push({url: request.url(), reason: "external-origin"});
    }
  });
}

async function waitForRuntime(page) {
  await page.locator(".runtime-stage[data-flash-frame]").waitFor({state: "visible"});
  await page.locator(".faithful-stage-wrap[data-flash-frame]").waitFor({state: "visible"});
}

async function frame(page) {
  return Number(await page.locator(".runtime-stage").getAttribute("data-flash-frame"));
}

async function waitForFrameAbove(page, minimum) {
  await page.waitForFunction((value) => Number(document.querySelector(".runtime-stage")?.getAttribute("data-flash-frame")) > value, minimum);
}

async function layout(page) {
  return page.evaluate(() => {
    const box = (selector) => {
      const element = document.querySelector(selector);
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      return {x: rect.x, y: rect.y, width: rect.width, height: rect.height, right: rect.right, bottom: rect.bottom};
    };
    const buttonBoxes = [...document.querySelectorAll(".runtime-toolbar button")].map((element) => {
      const rect = element.getBoundingClientRect();
      return {x: rect.x, y: rect.y, width: rect.width, height: rect.height, right: rect.right, bottom: rect.bottom};
    });
    return {
      viewport: {width: window.innerWidth, height: window.innerHeight},
      document: {scrollWidth: document.documentElement.scrollWidth, scrollHeight: document.documentElement.scrollHeight},
      shell: box(".runtime-shell"),
      toolbar: box(".runtime-toolbar"),
      stage: box(".runtime-stage"),
      stageWrap: box(".faithful-stage-wrap"),
      svgViewBox: document.querySelector(".faithful-stage")?.getAttribute("viewBox") ?? null,
      buttonBoxes,
    };
  });
}

function layoutPass(value) {
  const tolerance = 1;
  const inside = (box) => box && box.x >= -tolerance && box.right <= value.viewport.width + tolerance && box.width > 0 && box.height > 0;
  const expectedRatio = 780 / 379;
  const ratio = value.stageWrap ? value.stageWrap.width / value.stageWrap.height : 0;
  return value.document.scrollWidth <= value.viewport.width + tolerance
    && inside(value.shell)
    && inside(value.stage)
    && inside(value.stageWrap)
    && value.buttonBoxes.every(inside)
    && value.svgViewBox === "0 0 780 379"
    && Math.abs(ratio - expectedRatio) < 0.02;
}

async function runResponsiveProductChecks(browser, baseUrl, pilot, diagnostics, serverMode) {
  const views = [];
  for (const viewport of VIEWPORTS) {
    const context = await browser.newContext({viewport: {width: viewport.width, height: viewport.height}, reducedMotion: "no-preference"});
    const page = await context.newPage();
    attachDiagnostics(page, diagnostics, new URL(baseUrl).origin);
    const route = `${baseUrl}/animations/${pilot.animationId}?frame=${pilot.frameCount}&lang=es&scenario=default&seed=0`;
    await page.goto(route, {waitUntil: "domcontentloaded"});
    await waitForRuntime(page);
    const value = await layout(page);
    const evidence = await screenshot(page, page.locator(".runtime-shell"), path.join(OUTPUT_ROOT, pilot.animationId, `${viewport.id}-es-terminal.png`), serverMode);
    views.push({
      viewport,
      route,
      layout: value,
      screenshot: evidence,
      pass: layoutPass(value) && devOverlaySuppressionPass(evidence.devOverlaySuppression),
    });
    await context.close();
  }
  return views;
}

async function runBehaviorChecks(browser, baseUrl, pilot, diagnostics, serverMode) {
  const checks = [];
  const route = `${baseUrl}/animations/${pilot.animationId}`;
  const context = await browser.newContext({viewport: {width: 1280, height: 900}, reducedMotion: "no-preference"});
  const page = await context.newPage();
  attachDiagnostics(page, diagnostics, new URL(baseUrl).origin);

  const terminalIdentity = buildFormulaQaIdentity(pilot, "deterministic-terminal", "en", 0);
  await page.goto(`${route}?${queryFor(terminalIdentity, {frame: pilot.frameCount})}`, {waitUntil: "domcontentloaded"});
  await waitForRuntime(page);
  const terminalState = await runtimeState(page);
  const deterministic = {
    requested: pilot.frameCount,
    runtimeReported: Number(await page.locator(".runtime-stage").getAttribute("data-flash-frame")),
    rendererReported: Number(await page.locator(".faithful-stage-wrap").getAttribute("data-flash-frame")),
    scenario: await page.locator(".runtime-stage").getAttribute("data-runtime-scenario"),
    language: await page.locator(".runtime-stage").getAttribute("data-runtime-language"),
    seed: await page.locator(".runtime-stage").getAttribute("data-runtime-seed"),
    identity: terminalIdentity,
    runtimeState: terminalState,
  };
  checks.push(check("deterministic-terminal-frame", deterministic.runtimeReported === pilot.frameCount
    && deterministic.rendererReported === pilot.frameCount
    && deterministic.scenario === "default"
    && deterministic.language === "en"
    && deterministic.seed === "0"
    && runtimeIdentityMatches(terminalState.runtime, pilot, terminalIdentity), deterministic));

  const replay = page.locator(".flash-replay");
  const replaySemantics = {
    count: await replay.count(),
    role: await replay.getAttribute("role"),
    tabIndex: await replay.getAttribute("tabindex"),
    accessibleName: await replay.getAttribute("aria-label"),
  };
  checks.push(check("terminal-replay-focus-and-name", replaySemantics.count === 1 && replaySemantics.role === "button" && replaySemantics.tabIndex === "0" && replaySemantics.accessibleName === "Replay animation", replaySemantics));

  const replayIdentity = buildFormulaQaIdentity(pilot, "replay-mouse-enter-space", "en", 0);
  await page.goto(`${route}?${queryFor(replayIdentity)}`, {waitUntil: "domcontentloaded"});
  await waitForRuntime(page);
  const toolbarReplay = page.locator(".runtime-toolbar__actions").getByRole("button", {name: "Replay"});
  const replayProofs = [];
  for (const input of ["mouse", "Enter", "Space"]) {
    await waitForFrameAbove(page, 2);
    const before = await runtimeState(page);
    await toolbarReplay.focus();
    if (input === "mouse") await toolbarReplay.click();
    else await page.keyboard.press(input);
    await page.waitForFunction(({replay}) => (
      Number(document.querySelector(".runtime-shell")?.getAttribute("data-runtime-replay")) === replay
        && document.querySelector(".runtime-stage")?.getAttribute("data-flash-frame") === "1"
        && document.querySelector(".faithful-stage-wrap")?.getAttribute("data-flash-frame") === "1"
    ), {replay: before.replay + 1});
    const reset = await runtimeState(page);
    await waitForFrameAbove(page, 1);
    const resumed = await runtimeState(page);
    const proof = {input, pilot, identity: replayIdentity, before, reset, resumed};
    replayProofs.push({...proof, pass: replayResetIdentityPass(proof)});
  }
  checks.push(check("replay-mouse-enter-space-complete-identity-reset", replayProofs.every(({pass}) => pass), {
    control: "native Next.js Replay button",
    identity: replayIdentity,
    activations: replayProofs,
  }));
  await context.close();

  const reducedContext = await browser.newContext({viewport: {width: 1280, height: 900}, reducedMotion: "reduce"});
  const reducedPage = await reducedContext.newPage();
  attachDiagnostics(reducedPage, diagnostics, new URL(baseUrl).origin);
  await reducedPage.goto(`${route}?lang=en&scenario=default&seed=0`, {waitUntil: "domcontentloaded"});
  await waitForRuntime(reducedPage);
  await reducedPage.waitForTimeout(350);
  const reduced = {
    frame: await frame(reducedPage),
    statusCount: await reducedPage.locator(".reduced-motion-note[role=status]").count(),
    statusText: (await reducedPage.locator(".reduced-motion-note").textContent())?.trim() ?? "",
  };
  checks.push(check("reduced-motion-freezes-frame-one", reduced.frame === 1 && reduced.statusCount === 1 && reduced.statusText.length > 0, reduced));
  await reducedContext.close();

  const captureContext = await browser.newContext({viewport: {width: 780, height: 379}, reducedMotion: "no-preference"});
  const capturePage = await captureContext.newPage();
  attachDiagnostics(capturePage, diagnostics, new URL(baseUrl).origin);
  const languageEvidence = {};
  for (const language of ["en", "es"]) {
    await capturePage.goto(`${route}?frame=${pilot.frameCount}&lang=${language}&scenario=default&seed=0&capture=1`, {waitUntil: "domcontentloaded"});
    await waitForRuntime(capturePage);
    const stage = capturePage.locator(".faithful-stage-wrap");
    languageEvidence[language] = {
      runtimeLanguage: await capturePage.locator(".runtime-stage").getAttribute("data-runtime-language"),
      title: (await capturePage.locator(".faithful-stage title").textContent())?.trim() ?? "",
      replayName: await capturePage.locator(".flash-replay").getAttribute("aria-label"),
      screenshot: await screenshot(capturePage, stage, path.join(OUTPUT_ROOT, pilot.animationId, `native-terminal-${language}.png`), serverMode),
    };
  }
  const localized = languageEvidence.en.runtimeLanguage === "en"
    && languageEvidence.es.runtimeLanguage === "es"
    && languageEvidence.en.title !== languageEvidence.es.title
    && languageEvidence.en.replayName === "Replay animation"
    && languageEvidence.es.replayName === "Repetir animación"
    && languageEvidence.en.screenshot.sha256 !== languageEvidence.es.screenshot.sha256;
  checks.push(check("implementation-language-variants-are-visually-distinct", localized, languageEvidence));
  checks.push(check("native-language-screenshots-have-no-visible-dev-overlay", ["en", "es"].every((language) => (
    devOverlaySuppressionPass(languageEvidence[language].screenshot.devOverlaySuppression)
  )), Object.fromEntries(["en", "es"].map((language) => [language, languageEvidence[language].screenshot.devOverlaySuppression]))));

  const panelEvidence = [];
  for (const panelFrame of pilot.panelProbeFrames) {
    await capturePage.goto(`${route}?frame=${panelFrame}&lang=es&scenario=default&seed=0&capture=1`, {waitUntil: "domcontentloaded"});
    await waitForRuntime(capturePage);
    const panel = capturePage.locator('[data-source-instance="Mc_SD"]');
    const image = panel.locator("image");
    panelEvidence.push({
      frame: panelFrame,
      count: await panel.count(),
      visible: await panel.isVisible(),
      sourceDepth: await panel.getAttribute("data-source-depth"),
      href: await image.getAttribute("href"),
      x: Number(await image.getAttribute("x")),
      y: Number(await image.getAttribute("y")),
      width: Number(await image.getAttribute("width")),
      height: Number(await image.getAttribute("height")),
    });
  }
  await capturePage.goto(`${route}?frame=1&lang=en&scenario=default&seed=0&capture=1`, {waitUntil: "domcontentloaded"});
  await waitForRuntime(capturePage);
  const englishPanelCount = await capturePage.locator('[data-source-instance="Mc_SD"]').count();
  const panelPersistent = panelEvidence.every((entry) => entry.count === 1
    && entry.visible
    && entry.sourceDepth === "4"
    && entry.href === `/flash-assets/${pilot.moduleKey}/formula-es.svg`
    && entry.x === 414.3
    && entry.y === pilot.panelY
    && entry.width === 365.7
    && entry.height === 52.8)
    && englishPanelCount === 0;
  checks.push(check("source-spanish-panel-persists-at-probed-frames", panelPersistent, {
    sourceInstance: "Mc_SD",
    spanish: panelEvidence,
    englishFrame1PanelCount: englishPanelCount,
  }));
  await captureContext.close();
  return {checks, pass: result(checks)};
}

async function runPilot(browser, baseUrl, pilot, browserVersion, generatedAt, serverMode) {
  const diagnostics = {consoleErrors: [], pageErrors: [], failedRequests: [], httpErrors: [], unexpectedRequests: []};
  const behavior = await runBehaviorChecks(browser, baseUrl, pilot, diagnostics, serverMode);
  const responsiveViews = await runResponsiveProductChecks(browser, baseUrl, pilot, diagnostics, serverMode);
  const diagnosticChecks = [
    check("no-console-errors", diagnostics.consoleErrors.length === 0, diagnostics.consoleErrors),
    check("no-page-errors", diagnostics.pageErrors.length === 0, diagnostics.pageErrors),
    check("no-failed-requests", diagnostics.failedRequests.length === 0, diagnostics.failedRequests),
    check("no-http-errors", diagnostics.httpErrors.length === 0, diagnostics.httpErrors),
    check("no-external-or-unsupported-network", diagnostics.unexpectedRequests.length === 0, diagnostics.unexpectedRequests),
  ];
  const productChecks = [
    ...responsiveViews.map((view) => check(`responsive-${view.viewport.id}`, view.pass, view.layout)),
    ...diagnosticChecks,
    check("accessible-stage-and-replay", behavior.checks.find((entry) => entry.id === "terminal-replay-focus-and-name")?.pass === true),
    check("localization-implementation-verified", behavior.checks.find((entry) => entry.id === "implementation-language-variants-are-visually-distinct")?.pass === true),
    check("reduced-motion-verified", behavior.checks.find((entry) => entry.id === "reduced-motion-freezes-frame-one")?.pass === true),
  ];
  const common = {
    schemaVersion: 1,
    animationId: pilot.animationId,
    generatedAt,
    acceptanceEffect: "none",
    strictAcceptanceEffect: false,
    generator: {
      file: "scripts/qa-formula-pilot-engineering.mjs",
      script: "scripts/qa-formula-pilot-engineering.mjs",
      sha256: sha256(await readFile(fileURLToPath(import.meta.url))),
      deterministic: false,
      command: `node scripts/qa-formula-pilot-engineering.mjs --base-url ${baseUrl} --server-mode ${serverMode}`,
      dependencies: [{
        path: "scripts/formula-qa-dev-overlay.mjs",
        sha256: sha256(await readFile(path.join(ROOT, "scripts", "formula-qa-dev-overlay.mjs"))),
      }],
    },
    environment: {
      baseUrl,
      browser: `Chromium ${browserVersion}`,
      serverMode,
      auditOnlyRoute: true,
      productionVisibility: "intentionally unavailable while migration status is preserved",
    },
  };
  const spanishBaselineFile = path.join(ROOT, "migrations", pilot.animationId, "baseline", "source-composited-spanish-default.json");
  const spanishComparisonFile = path.join(ROOT, "migrations", pilot.animationId, "evidence", "full-frame-comparison-default-es.json");
  const spanishBaselineBytes = await readFile(spanishBaselineFile);
  const spanishComparisonBytes = await readFile(spanishComparisonFile);
  const spanishBaseline = JSON.parse(spanishBaselineBytes.toString("utf8"));
  const spanishComparison = JSON.parse(spanishComparisonBytes.toString("utf8"));
  const spanishVisualParityPassed = spanishBaseline.animationId === pilot.animationId
    && spanishBaseline.status === "authoritative-source-composited-spanish-visual-baseline"
    && spanishBaseline.authority?.kind === "original-swf-adobe-runtime-plus-swf-structural-spanish-panel"
    && spanishBaseline.frames?.length === pilot.frameCount
    && spanishBaseline.calibration?.allPass === true
    && spanishComparison.animationId === pilot.animationId
    && spanishComparison.language === "es"
    && spanishComparison.frames?.length === pilot.frameCount
    && spanishComparison.summary?.allAssignedThresholdsPass === true;
  const spanishVisualEvidence = [
    {path: "baseline/source-composited-spanish-default.json", sha256: sha256(spanishBaselineBytes)},
    {path: "evidence/full-frame-comparison-default-es.json", sha256: sha256(spanishComparisonBytes)},
  ];
  const behaviorReport = {
    ...common,
    evidenceType: "implementation-behavior-qa",
    contract: {moduleKey: pilot.moduleKey, stage: {width: 780, height: 379}, fps: 12, frameCount: pilot.frameCount, scenario: "default", seed: "0"},
    checks: behavior.checks,
    engineeringBehaviorPassed: behavior.pass,
    authorityBoundary: {
      englishStandaloneVisualBehavior: "covered separately by Adobe full-frame comparison",
      spanishImplementationBehavior: spanishVisualParityPassed
        ? "tested against the source-composited Spanish child baseline: Adobe natural-playback dynamics plus only source-derived root Mc_SD"
        : "source-composited Spanish full-frame parity is missing or failed",
      sourceCompositedSpanishVisualParity: spanishVisualParityPassed,
      sourceCompositedSpanishEvidence: spanishVisualEvidence,
      originalIndexElmExternalDefaultRecovered: false,
      audioListeningOrSynchronization: false,
      humanReview: false,
      ownerAcceptance: false,
      strictMigrationCompletion: false,
    },
  };
  const existingAudioQa = path.join(ROOT, "migrations", pilot.animationId, "evidence", "product-audio-controls-qa.json");
  const existingAudioQaBytes = await readFile(existingAudioQa);
  const existingAudioQaReport = JSON.parse(existingAudioQaBytes.toString("utf8"));
  const productReport = {
    ...common,
    evidenceType: "implementation-product-qa",
    responsiveViews,
    checks: productChecks,
    diagnostics,
    relatedAudioControlQa: {file: portable(existingAudioQa), sha256: sha256(existingAudioQaBytes)},
    engineeringProductQaPassed: result(productChecks),
    authorityBoundary: {
      originalHostSpanishTraversal: false,
      authoritativeAudioListening: false,
      audioSynchronization: false,
      humanVisualReview: false,
      ownerAcceptance: false,
      strictMigrationCompletion: false,
    },
  };
  const evidenceRoot = path.join(ROOT, "migrations", pilot.animationId, "evidence");
  const detailedBehaviorPath = path.join(evidenceRoot, "formula-engineering-behavior-qa.json");
  const detailedProductPath = path.join(evidenceRoot, "formula-engineering-product-qa.json");
  const detailedBehaviorBytes = Buffer.from(`${JSON.stringify(behaviorReport, null, 2)}\n`);
  const detailedProductBytes = Buffer.from(`${JSON.stringify(productReport, null, 2)}\n`);
  await writeFile(detailedBehaviorPath, detailedBehaviorBytes);
  await writeFile(detailedProductPath, detailedProductBytes);

  const behaviorEvidence = {path: "evidence/formula-engineering-behavior-qa.json", sha256: sha256(detailedBehaviorBytes)};
  const productEvidence = {path: "evidence/formula-engineering-product-qa.json", sha256: sha256(detailedProductBytes)};
  const audioEvidence = {path: "evidence/product-audio-controls-qa.json", sha256: sha256(existingAudioQaBytes)};
  const audioAssertions = new Map((existingAudioQaReport.assertions || []).map((entry) => [entry.id, entry]));
  const replayAudioResetPassed = existingAudioQaReport.animationId === pilot.animationId
    && existingAudioQaReport.productQaPassed === true
    && audioAssertions.get("replay-pauses-host-audio")?.pass === true;
  const canonicalBehaviorPassed = behaviorReport.engineeringBehaviorPassed && replayAudioResetPassed && spanishVisualParityPassed;
  const canonicalBehavior = {
    schemaVersion: 1,
    animationId: pilot.animationId,
    generatedAt,
    status: canonicalBehaviorPassed ? "pass" : "fail",
    scenarios: ["default"],
    checks: [
      {id: "replay-mouse", result: behaviorReport.engineeringBehaviorPassed ? "pass" : "fail", evidence: [behaviorEvidence]},
      {id: "replay-enter", result: behaviorReport.engineeringBehaviorPassed ? "pass" : "fail", evidence: [behaviorEvidence]},
      {id: "replay-space", result: behaviorReport.engineeringBehaviorPassed ? "pass" : "fail", evidence: [behaviorEvidence]},
      {id: "replay-reset-frame-state-audio", result: replayAudioResetPassed ? "pass" : "fail", evidence: [behaviorEvidence, audioEvidence]},
      {id: "all-reachable-branches", result: behaviorReport.engineeringBehaviorPassed && spanishVisualParityPassed ? "pass" : "fail", evidence: [behaviorEvidence, ...spanishVisualEvidence]},
      {id: "interaction-input-scoring", result: "not-required", reason: "The audited linear formula movie has no learner input, score, or grading branch.", evidence: [behaviorEvidence]},
      {id: "completion-terminal-state", result: behaviorReport.engineeringBehaviorPassed && spanishVisualParityPassed ? "pass" : "fail", evidence: [behaviorEvidence, ...spanishVisualEvidence]},
      {id: "random-seeded-outcomes", result: "not-required", reason: "The audited linear formula movie has no random operation.", evidence: [behaviorEvidence]},
    ],
    authorityBoundary: {
      originalHostSpanishTraversal: false,
      sourceCompositedSpanishVisualParity: spanishVisualParityPassed,
      authoritativeAudioListening: false,
      audioSynchronization: false,
      humanVisualReview: false,
      ownerAcceptance: false,
      strictMigrationCompletion: false,
    },
  };
  const productResult = productReport.engineeringProductQaPassed ? "pass" : "fail";
  const canonicalProduct = {
    schemaVersion: 1,
    animationId: pilot.animationId,
    generatedAt,
    status: productReport.engineeringProductQaPassed ? "pass" : "fail",
    checks: [
      {id: "native-stage", result: productResult, evidence: [behaviorEvidence, productEvidence]},
      {id: "desktop", result: productResult, evidence: [productEvidence]},
      {id: "tablet", result: productResult, evidence: [productEvidence]},
      {id: "mobile", result: productResult, evidence: [productEvidence]},
      {id: "keyboard-focus", result: productResult, evidence: [behaviorEvidence, productEvidence, audioEvidence]},
      {id: "accessible-names", result: productResult, evidence: [behaviorEvidence, productEvidence, audioEvidence]},
      {id: "reduced-motion", result: productResult, evidence: [behaviorEvidence, productEvidence]},
      {id: "text-overflow", result: productResult, evidence: [productEvidence, audioEvidence]},
      {id: "localization", result: productResult, evidence: [behaviorEvidence, productEvidence]},
      {id: "console-errors", result: productResult, evidence: [productEvidence, audioEvidence]},
      {id: "asset-loads", result: productResult, evidence: [productEvidence, audioEvidence]},
      {id: "unexpected-network", result: productResult, evidence: [productEvidence, audioEvidence]},
    ],
    authorityBoundary: {
      originalHostSpanishTraversal: false,
      authoritativeAudioListening: false,
      audioSynchronization: false,
      humanVisualReview: false,
      ownerAcceptance: false,
      strictMigrationCompletion: false,
    },
  };
  await writeFile(path.join(evidenceRoot, "behavior-qa.json"), `${JSON.stringify(canonicalBehavior, null, 2)}\n`);
  await writeFile(path.join(evidenceRoot, "product-qa.json"), `${JSON.stringify(canonicalProduct, null, 2)}\n`);
  return {animationId: pilot.animationId, behaviorPassed: behaviorReport.engineeringBehaviorPassed, productPassed: productReport.engineeringProductQaPassed};
}

async function main() {
  const baseUrl = argument("--base-url", DEFAULT_BASE_URL).replace(/\/$/, "");
  const generatedAt = argument("--generated-at", new Date().toISOString());
  const serverMode = normalizeServerMode(argument("--server-mode", "development"));
  const browser = await chromium.launch({headless: true});
  try {
    const browserVersion = browser.version();
    const results = [];
    for (const pilot of PILOTS) results.push(await runPilot(browser, baseUrl, pilot, browserVersion, generatedAt, serverMode));
    console.log(JSON.stringify({generatedAt, browser: `Chromium ${browserVersion}`, serverMode, results}, null, 2));
    if (results.some((entry) => !entry.behaviorPassed || !entry.productPassed)) process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  });
}
