#!/usr/bin/env node

import {createHash} from "node:crypto";
import {spawnSync} from "node:child_process";
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
const SCREENSHOT_ROOT = path.join(ROOT, "output", "playwright", "formula-audio-controls-qa");
export const DEV_OVERLAY_CAPTURE_STYLE_ID = "help-math-formula-audio-qa-hide-next-dev-overlay";
const PILOTS = Object.freeze([
  Object.freeze({animationId: "formula-elementary-conversion-01-01", assetName: "conversion-1-1"}),
  Object.freeze({animationId: "formula-elementary-conversion-01-02", assetName: "conversion-1-2"}),
  Object.freeze({animationId: "formula-elementary-conversion-01-03", assetName: "conversion-1-3"}),
  Object.freeze({animationId: "formula-elementary-conversion-01-04", assetName: "conversion-1-4"}),
]);

async function buildCandidateAudioManifest() {
  const entries = [];
  for (const pilot of PILOTS) {
    const manifest = JSON.parse(await readFile(path.join(ROOT, "migrations", pilot.animationId, "migration.json"), "utf8"));
    const cues = manifest.audio?.cues || [];
    if (manifest.audio?.required !== true || cues.length !== 2) {
      throw new Error(`${pilot.animationId}: candidate audio QA requires exactly two manifest-declared cues`);
    }
    for (const language of ["en", "es"]) {
      const cue = cues.find((entry) => entry.language === language);
      if (!cue || !/^[a-f0-9]{64}$/.test(cue.sha256 || "") || !cue.source) {
        throw new Error(`${pilot.animationId}/${language}: migration audio cue is missing a source hash`);
      }
      const sourceBytes = await readFile(path.join(ROOT, cue.source));
      const observedSourceSha256 = sha256(sourceBytes);
      if (observedSourceSha256 !== cue.sha256) {
        throw new Error(`${pilot.animationId}/${language}: source MP3 differs from migration cue hash`);
      }
      entries.push({
        animationId: pilot.animationId,
        id: cue.id,
        language,
        activation: "modern-candidate-user-control-only",
        sourceEvidence: cue.source,
        sourceSha256: cue.sha256,
        observedSourceSha256,
        durationMs: cue.durationMs,
        startFrame: cue.startFrame,
        startSemantics: cue.startSemantics,
        synchronization: cue.synchronization,
        publicUrl: `/flash-assets/audio/formulas/${pilot.assetName}/${language}.mp3`,
      });
    }
  }
  return {
    schemaVersion: 1,
    authority: "Candidate-only MP3 identity from current migration audio cues; no original-host activation, synchronization, or listening authority.",
    entries,
  };
}

function argument(name, fallback) {
  const index = process.argv.indexOf(name);
  return index === -1 ? fallback : process.argv[index + 1];
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function portable(value) {
  return path.relative(ROOT, value).split(path.sep).join("/");
}

function assertion(results, id, pass, details = null) {
  results.push({id, pass: Boolean(pass), details});
}

async function screenshotEvidence(page, target, screenshotPath, serverMode, fullPage = true) {
  const devOverlaySuppression = await suppressDevOverlayForCapture(page, {
    serverMode,
    styleId: DEV_OVERLAY_CAPTURE_STYLE_ID,
    marker: "helpMathFormulaAudioQaCaptureHidden",
  });
  await mkdir(path.dirname(screenshotPath), {recursive: true});
  if (target) await target.screenshot({path: screenshotPath, animations: "disabled"});
  else await page.screenshot({path: screenshotPath, fullPage, animations: "disabled"});
  await finalizeDevOverlayCapture(page, devOverlaySuppression);
  const bytes = await readFile(screenshotPath);
  const png = PNG.sync.read(bytes);
  return {
    path: portable(screenshotPath),
    sha256: sha256(bytes),
    width: png.width,
    height: png.height,
    devOverlaySuppression,
  };
}

async function waitForRuntime(page) {
  await page.locator(".runtime-stage[data-flash-frame]").waitFor({state: "visible"});
  await page.locator(".runtime-audio-controls").waitFor({state: "attached"});
}

async function controls(page) {
  return page.locator(".runtime-audio-controls button").evaluateAll((buttons) => buttons.map((button) => ({
    tagName: button.tagName,
    type: button.getAttribute("type"),
    text: button.textContent?.trim() ?? "",
    ariaPressed: button.getAttribute("aria-pressed"),
    disabled: button.hasAttribute("disabled"),
    tabIndex: button.tabIndex,
  })));
}

async function layout(page) {
  return page.evaluate(() => {
    const box = (element) => {
      if (!element) return null;
      const value = element.getBoundingClientRect();
      return {x: value.x, y: value.y, width: value.width, height: value.height, right: value.right, bottom: value.bottom};
    };
    const buttons = [...document.querySelectorAll(".runtime-toolbar button")].map(box);
    return {
      viewport: {width: window.innerWidth, height: window.innerHeight},
      body: {scrollWidth: document.documentElement.scrollWidth, scrollHeight: document.documentElement.scrollHeight},
      shell: box(document.querySelector(".runtime-shell")),
      toolbar: box(document.querySelector(".runtime-toolbar")),
      stage: box(document.querySelector(".runtime-stage")),
      buttons,
      toolbarDirection: getComputedStyle(document.querySelector(".runtime-toolbar")).flexDirection,
    };
  });
}

function boxesStayInsideViewport(layoutResult) {
  const tolerance = 1;
  return layoutResult.body.scrollWidth <= layoutResult.viewport.width + tolerance
    && layoutResult.buttons.every((box) => box && box.x >= -tolerance && box.right <= layoutResult.viewport.width + tolerance);
}

function installMockAudio() {
  const documentId = `${Date.now()}-${Math.random()}`;
  let sequence = 0;
  const instances = [];
  const emit = (event) => {
    const payload = {...event, documentId, href: location.href};
    window.__formulaQaEvents = window.__formulaQaEvents || [];
    window.__formulaQaEvents.push(payload);
    if (typeof window.__formulaQaPush === "function") void window.__formulaQaPush(payload);
  };
  class MockAudio {
    constructor(source) {
      this.id = ++sequence;
      this.src = new URL(source, location.href).href;
      this.paused = true;
      this._currentTime = 0;
      this.listeners = new Map();
      instances.push(this);
      emit({type: "construct", audioId: this.id, source: this.src});
    }
    get currentTime() { return this._currentTime; }
    set currentTime(value) {
      this._currentTime = value;
      emit({type: "current-time", audioId: this.id, value});
    }
    addEventListener(type, callback) { this.listeners.set(type, callback); }
    removeEventListener(type) { this.listeners.delete(type); }
    play() {
      this.paused = false;
      emit({type: "play", audioId: this.id, source: this.src});
      return Promise.resolve();
    }
    pause() {
      this.paused = true;
      emit({type: "pause", audioId: this.id, source: this.src});
    }
  }
  Object.defineProperty(window, "Audio", {configurable: true, value: MockAudio});
  window.__formulaQaMockState = () => ({
    documentId,
    instances: instances.map((audio) => ({id: audio.id, src: audio.src, paused: audio.paused, currentTime: audio.currentTime})),
  });
}

async function runLifecycleChecks(browser, baseUrl, pilot) {
  const context = await browser.newContext({viewport: {width: 1280, height: 900}, reducedMotion: "no-preference"});
  await context.addInitScript(installMockAudio);
  const page = await context.newPage();
  const events = [];
  await page.exposeFunction("__formulaQaPush", (event) => events.push(event));
  const route = `${baseUrl}/animations/${pilot.animationId}`;
  const results = {events: [], keyboard: null, exclusive: null, replay: null, language: null, unmount: null};

  await page.goto(`${route}?lang=en&scenario=default&seed=0`);
  await waitForRuntime(page);
  const english = page.getByRole("button", {name: "Play English audio"});
  await english.focus();
  await page.keyboard.press("Enter");
  await page.waitForTimeout(20);
  const afterEnter = {controls: await controls(page), mock: await page.evaluate(() => window.__formulaQaMockState())};
  await page.keyboard.press("Space");
  await page.waitForTimeout(20);
  const afterSpace = {controls: await controls(page), mock: await page.evaluate(() => window.__formulaQaMockState())};
  results.keyboard = {afterEnter, afterSpace};

  await english.focus();
  await page.keyboard.press("Enter");
  await page.waitForTimeout(20);
  const replayStart = events.length;
  await page.locator(".runtime-toolbar__actions").getByRole("button", {name: "Replay"}).click();
  await page.waitForTimeout(20);
  results.replay = {
    events: events.slice(replayStart),
    controls: await controls(page),
  };

  await page.goto(`${route}?lang=es&scenario=default&seed=0`);
  await waitForRuntime(page);
  const englishEsPage = page.getByRole("button", {name: "Reproducir audio en inglés"});
  const spanish = page.getByRole("button", {name: "Reproducir audio en español"});
  const exclusiveStart = events.length;
  await englishEsPage.click();
  await spanish.click();
  await page.waitForTimeout(20);
  const afterSwitch = {controls: await controls(page), mock: await page.evaluate(() => window.__formulaQaMockState())};
  await page.getByRole("button", {name: "Detener audio en español"}).click();
  await page.waitForTimeout(20);
  const afterToggleStop = {controls: await controls(page), mock: await page.evaluate(() => window.__formulaQaMockState())};
  results.exclusive = {events: events.slice(exclusiveStart), afterSwitch, afterToggleStop};

  await page.goto(`${route}?lang=en&scenario=default&seed=0`);
  await waitForRuntime(page);
  await page.getByRole("button", {name: "Play English audio"}).click();
  const languageStart = events.length;
  const priorDocument = await page.evaluate(() => window.__formulaQaMockState().documentId);
  await page.locator(".capture-controls").getByRole("link", {name: "Español"}).click();
  await page.waitForURL((url) => url.searchParams.get("lang") === "es");
  await waitForRuntime(page);
  results.language = {
    priorDocument,
    currentDocument: await page.evaluate(() => window.__formulaQaMockState().documentId),
    oldDocumentPauseEvents: events.slice(languageStart).filter((event) => event.documentId === priorDocument && event.type === "pause"),
    controls: await controls(page),
    mechanism: "query-language navigation disposes the prior document; browser media cannot survive that document",
  };

  await page.goto(`${route}?lang=en&scenario=default&seed=0`);
  await waitForRuntime(page);
  await page.getByRole("button", {name: "Play English audio"}).click();
  const unmountDocument = await page.evaluate(() => window.__formulaQaMockState().documentId);
  const unmountStart = events.length;
  await page.locator(".animation-breadcrumbs").getByRole("link", {name: "Library"}).click();
  await page.waitForURL(/\/library(?:\?|$)/);
  await page.waitForTimeout(20);
  results.unmount = {
    priorDocument: unmountDocument,
    events: events.slice(unmountStart).filter((event) => event.documentId === unmountDocument),
    runtimeRemoved: await page.locator(".runtime-audio-controls").count() === 0,
  };
  results.events = events;
  await context.close();
  return results;
}

async function runPilot(browser, baseUrl, pilot, audioManifest, browserVersion, serverMode) {
  const assertions = [];
  const route = `${baseUrl}/animations/${pilot.animationId}`;
  const expectedEntries = audioManifest.entries.filter((entry) => entry.animationId === pilot.animationId);
  const context = await browser.newContext({viewport: {width: 1440, height: 1000}, reducedMotion: "no-preference"});
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  const failedRequests = [];
  const requests = [];
  const audioResponses = [];
  page.on("console", (message) => {if (message.type() === "error") consoleErrors.push({text: message.text(), url: page.url()});});
  page.on("pageerror", (error) => pageErrors.push({message: error.message, url: page.url()}));
  page.on("request", (request) => requests.push({url: request.url(), method: request.method(), resourceType: request.resourceType()}));
  page.on("requestfailed", (request) => failedRequests.push({url: request.url(), failure: request.failure()?.errorText ?? null}));
  page.on("response", (response) => {
    if (response.url().includes("/flash-assets/audio/formulas/")) {
      audioResponses.push({url: response.url(), status: response.status(), contentType: response.headers()["content-type"] ?? null});
    }
  });
  const screenshots = {};

  await page.goto(`${route}?lang=en&scenario=default&seed=0`);
  await waitForRuntime(page);
  const enControls = await controls(page);
  assertion(assertions, "en-only-english-control", enControls.length === 1 && enControls[0].text === "Play English audio", enControls);
  assertion(assertions, "native-keyboard-button", enControls.every((item) => item.tagName === "BUTTON" && item.type === "button" && item.tabIndex === 0), enControls);
  screenshots.desktopEn = await screenshotEvidence(page, null, path.join(SCREENSHOT_ROOT, pilot.animationId, "desktop-en.png"), serverMode);

  const englishPath = `/flash-assets/audio/formulas/${pilot.assetName}/en.mp3`;
  const englishResponse = page.waitForResponse((response) => new URL(response.url()).pathname === englishPath);
  const englishButton = page.getByRole("button", {name: "Play English audio"});
  await englishButton.focus();
  await page.keyboard.press("Enter");
  const englishMediaResponse = await englishResponse;
  await page.getByRole("button", {name: "Stop English audio"}).waitFor();
  const enterPressed = await page.getByRole("button", {name: "Stop English audio"}).getAttribute("aria-pressed");
  await page.keyboard.press("Space");
  await page.getByRole("button", {name: "Play English audio"}).waitFor();
  const spaceStopped = await page.getByRole("button", {name: "Play English audio"}).getAttribute("aria-pressed");
  assertion(assertions, "enter-starts-space-stops", enterPressed === "true" && spaceStopped === "false", {enterPressed, spaceStopped});

  await page.goto(`${route}?lang=es&scenario=default&seed=0`);
  await waitForRuntime(page);
  const esControls = await controls(page);
  assertion(assertions, "es-shows-localized-english-and-spanish", esControls.length === 2 && esControls.map((item) => item.text).join("|") === "Reproducir audio en inglés|Reproducir audio en español", esControls);
  screenshots.desktopEs = await screenshotEvidence(page, null, path.join(SCREENSHOT_ROOT, pilot.animationId, "desktop-es.png"), serverMode);

  const spanishPath = `/flash-assets/audio/formulas/${pilot.assetName}/es.mp3`;
  const englishAgainResponse = page.waitForResponse((response) => new URL(response.url()).pathname === englishPath);
  await page.getByRole("button", {name: "Reproducir audio en inglés"}).click();
  await englishAgainResponse;
  const spanishResponse = page.waitForResponse((response) => new URL(response.url()).pathname === spanishPath);
  await page.getByRole("button", {name: "Reproducir audio en español"}).click();
  const spanishMediaResponse = await spanishResponse;
  const switchedControls = await controls(page);
  assertion(assertions, "one-track-at-a-time", switchedControls.filter((item) => item.ariaPressed === "true").length === 1 && switchedControls[1].ariaPressed === "true", switchedControls);
  await page.getByRole("button", {name: "Detener audio en español"}).click();
  const toggleStoppedControls = await controls(page);
  assertion(assertions, "second-click-stops", toggleStoppedControls.every((item) => item.ariaPressed === "false"), toggleStoppedControls);

  await page.setViewportSize({width: 390, height: 844});
  await page.reload();
  await waitForRuntime(page);
  const narrowLayout = await layout(page);
  assertion(assertions, "narrow-no-horizontal-overflow", boxesStayInsideViewport(narrowLayout), narrowLayout);
  assertion(assertions, "narrow-toolbar-stacks", narrowLayout.toolbarDirection === "column", narrowLayout.toolbarDirection);
  screenshots.narrowEs = await screenshotEvidence(page, null, path.join(SCREENSHOT_ROOT, pilot.animationId, "narrow-es.png"), serverMode);

  await page.setViewportSize({width: 780, height: 379});
  const audioResponseCountBeforeCapture = audioResponses.length;
  await page.goto(`${route}?frame=1&lang=en&scenario=default&seed=0&capture=1`);
  await page.locator('.runtime-stage[data-flash-frame="1"]').waitFor({state: "visible"});
  const toolbarDisplay = await page.locator(".runtime-toolbar").evaluate((element) => getComputedStyle(element).display);
  const captureControlCount = await page.locator(".capture-controls").count();
  await page.waitForTimeout(150);
  const captureAudioRequests = audioResponses.slice(audioResponseCountBeforeCapture);
  assertion(assertions, "capture-toolbar-hidden", toolbarDisplay === "none" && captureControlCount === 0, {toolbarDisplay, captureControlCount});
  assertion(assertions, "capture-does-not-play-audio", captureAudioRequests.length === 0, captureAudioRequests);
  screenshots.captureFrame1 = await screenshotEvidence(page, page.locator(".runtime-stage"), path.join(SCREENSHOT_ROOT, pilot.animationId, "capture-frame-001.png"), serverMode, false);
  assertion(assertions, "all-evidence-screenshots-have-no-visible-dev-overlay", Object.values(screenshots).every((entry) => (
    devOverlaySuppressionPass(entry.devOverlaySuppression)
  )), Object.fromEntries(Object.entries(screenshots).map(([id, entry]) => [id, entry.devOverlaySuppression])));
  assertion(assertions, "capture-native-stage-size", screenshots.captureFrame1.width === 780 && screenshots.captureFrame1.height === 379, screenshots.captureFrame1);

  const directAssets = [];
  for (const entry of expectedEntries) {
    const response = await context.request.get(`${baseUrl}${entry.publicUrl}`);
    const bytes = await response.body();
    directAssets.push({
      language: entry.language,
      url: entry.publicUrl,
      status: response.status(),
      contentType: response.headers()["content-type"] ?? null,
      bytes: bytes.length,
      expectedSha256: entry.sourceSha256,
      observedSha256: sha256(bytes),
    });
  }
  assertion(assertions, "direct-audio-get-200", directAssets.every((item) => item.status === 200), directAssets);
  assertion(assertions, "served-audio-hash-exact", directAssets.every((item) => item.observedSha256 === item.expectedSha256), directAssets);
  assertion(assertions, "browser-media-request-success", [englishMediaResponse, spanishMediaResponse].every((response) => response.status() === 200 || response.status() === 206), {english: englishMediaResponse.status(), spanish: spanishMediaResponse.status(), note: "Chromium uses successful HTTP Range responses (206) for media playback; ordinary same-origin GETs above return 200."});

  const baseOrigin = new URL(baseUrl).origin;
  const externalRequests = requests.filter((request) => {
    try { return new URL(request.url).origin !== baseOrigin; } catch { return false; }
  });
  const offPathAudioRequests = audioResponses.filter((response) => !new URL(response.url).pathname.startsWith("/flash-assets/audio/formulas/"));
  assertion(assertions, "no-external-network", externalRequests.length === 0, externalRequests);
  assertion(assertions, "audio-only-approved-same-origin-path", offPathAudioRequests.length === 0 && audioResponses.every((response) => new URL(response.url).origin === baseOrigin), audioResponses);
  const intentionalNavigationAborts = failedRequests.filter((request) => request.failure === "net::ERR_ABORTED" && new URL(request.url).origin === baseOrigin);
  const unexpectedFailedRequests = failedRequests.filter((request) => !intentionalNavigationAborts.includes(request));
  assertion(assertions, "no-console-or-page-errors", consoleErrors.length === 0 && pageErrors.length === 0, {consoleErrors, pageErrors});
  assertion(assertions, "no-unexpected-failed-requests", unexpectedFailedRequests.length === 0, {unexpectedFailedRequests, intentionalNavigationAborts});
  await context.close();

  const lifecycle = await runLifecycleChecks(browser, baseUrl, pilot);
  const keyboardInstances = lifecycle.keyboard.afterSpace.mock.instances;
  assertion(assertions, "mock-keyboard-lifecycle", lifecycle.keyboard.afterEnter.controls[0].ariaPressed === "true" && lifecycle.keyboard.afterSpace.controls[0].ariaPressed === "false" && keyboardInstances.every((item) => item.paused && item.currentTime === 0), lifecycle.keyboard);
  const exclusiveInstances = lifecycle.exclusive.afterSwitch.mock.instances;
  assertion(assertions, "mock-exclusive-pauses-previous", exclusiveInstances.length === 2 && exclusiveInstances[0].paused && !exclusiveInstances[1].paused && lifecycle.exclusive.afterSwitch.controls.filter((item) => item.ariaPressed === "true").length === 1, lifecycle.exclusive.afterSwitch);
  assertion(assertions, "mock-second-click-resets-track", lifecycle.exclusive.afterToggleStop.mock.instances.every((item) => item.paused && item.currentTime === 0) && lifecycle.exclusive.afterToggleStop.controls.every((item) => item.ariaPressed === "false"), lifecycle.exclusive.afterToggleStop);
  assertion(assertions, "replay-pauses-host-audio", lifecycle.replay.events.some((event) => event.type === "pause") && lifecycle.replay.controls.every((item) => item.ariaPressed === "false"), lifecycle.replay);
  assertion(assertions, "language-navigation-stops-old-document-audio", lifecycle.language.priorDocument !== lifecycle.language.currentDocument && lifecycle.language.controls.every((item) => item.ariaPressed === "false"), lifecycle.language);
  assertion(assertions, "runtime-unmount-stops-host-audio", lifecycle.unmount.runtimeRemoved && lifecycle.unmount.events.some((event) => event.type === "pause"), lifecycle.unmount);

  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    animationId: pilot.animationId,
    route: `/animations/${pilot.animationId}`,
    generatedBy: {
      script: "scripts/qa-formula-audio-controls.mjs",
      scriptSha256: sha256(await readFile(fileURLToPath(import.meta.url))),
      deterministic: false,
      command: `node scripts/qa-formula-audio-controls.mjs --base-url ${baseUrl} --server-mode ${serverMode}`,
      dependencies: [{
        path: "scripts/formula-qa-dev-overlay.mjs",
        sha256: sha256(await readFile(path.join(ROOT, "scripts", "formula-qa-dev-overlay.mjs"))),
      }],
    },
    environment: {baseUrl, serverMode},
    acceptanceEffect: "none",
    strictAcceptanceEffect: false,
    scope: {
      included: "Modern Next.js host-level formula audio files, controls, lifecycle, keyboard, responsive layout, capture isolation, console, and network behavior.",
      excluded: "Authoritative listening comparison against the original Flash indexELM host and owner/human acceptance.",
      fidelityClaim: "This QA does not prove original-host audio timing, wording, loudness, or perceptual parity and does not authorize complete status.",
    },
    browser: {engine: "Chromium", version: browserVersion, headless: true, deviceScaleFactor: 1},
    assets: {manifestEntries: expectedEntries, directGets: directAssets},
    controls: {english: enControls, spanish: esControls},
    playbackResponses: audioResponses,
    responsive: {narrow: narrowLayout},
    capture: {
      toolbarDisplay,
      captureControlCount,
      devOverlaySuppression: screenshots.captureFrame1.devOverlaySuppression,
      audioRequests: captureAudioRequests,
    },
    lifecycle,
    network: {externalRequests, failedRequests, intentionalNavigationAborts, unexpectedFailedRequests, consoleErrors, pageErrors},
    screenshots,
    assertions,
    productQaPassed: assertions.every((item) => item.pass),
    authoritativeAudioListeningGate: {
      status: "blocked",
      passed: false,
      reason: "No signed human comparison against the original Flash indexELM host is present; modern control QA cannot satisfy this gate.",
    },
    authorityBoundary: {
      authoritativeOriginalHostListening: false,
      audioTimingParity: false,
      audioWordingParity: false,
      humanReview: false,
      ownerAcceptance: false,
      strictMigrationCompletion: false,
    },
    remainingStrictGates: [
      "authoritative original indexELM host listening comparison",
      "authoritative English/Spanish activation and timing review in the original host",
      "human reviewer sign-off",
      "owner acceptance",
    ],
  };
}

async function main() {
  const baseUrl = argument("--base-url", DEFAULT_BASE_URL).replace(/\/$/, "");
  const serverMode = normalizeServerMode(argument("--server-mode", "development"));
  const sync = spawnSync("npm", ["run", "sync:formula-audio", "--", "--check"], {cwd: ROOT, encoding: "utf8"});
  const audioManifest = await buildCandidateAudioManifest();
  const browser = await chromium.launch({headless: true});
  const browserVersion = browser.version();
  const reports = [];
  try {
    for (const pilot of PILOTS) reports.push(await runPilot(browser, baseUrl, pilot, audioManifest, browserVersion, serverMode));
  } finally {
    await browser.close();
  }
  for (const report of reports) {
    report.assetSync = {
      command: "npm run sync:formula-audio -- --check",
      status: sync.status === 0 ? "pass" : "blocked-authoritative-host-semantics",
      passed: sync.status === 0,
      acceptanceEffect: "none",
      stdout: sync.stdout.trim(),
      stderr: sync.stderr.trim(),
      note: sync.status === 0
        ? "The generated public asset manifest is current. This still does not prove authoritative listening."
        : "The authority-sensitive sync correctly refused to assert recovered original-host activation. Candidate QA instead verifies current migration cue/source/public-byte identity and leaves the authoritative audio gate blocked.",
    };
    const target = path.join(ROOT, "migrations", report.animationId, "evidence", "product-audio-controls-qa.json");
    await writeFile(target, `${JSON.stringify(report, null, 2)}\n`);
    console.log(`${report.productQaPassed ? "PASS" : "FAIL"} ${report.animationId} -> ${portable(target)}`);
  }
  if (reports.some((report) => !report.productQaPassed)) process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  });
}
