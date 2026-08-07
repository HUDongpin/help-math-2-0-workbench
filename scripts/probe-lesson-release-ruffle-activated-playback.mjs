#!/usr/bin/env node

import {createHash} from "node:crypto";
import {
  lstat,
  mkdir,
  readFile,
  realpath,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath, pathToFileURL} from "node:url";

import {chromium} from "@playwright/test";
import {PNG} from "pngjs";

import {validateSourceResponse} from "./probe-g4-l3-ruffle-reference.mjs";
import {
  assertLoopbackBaseUrl,
  buildReleaseProbePlan,
  installPlaywrightNetworkGuard,
  readPinnedRuffleNetworkingBoundary,
  requestDisposition,
  unwrapSourceResponseOutcome,
  waitForSourceResponseSettled,
} from "./probe-lesson-release-ruffle-reference.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");
const routeLoadProbePath = path.join(projectRoot, "scripts", "probe-lesson-release-ruffle-reference.mjs");
const OUTPUT_RELATIVE_ROOT = path.join(
  "output",
  "playwright",
  "lesson-ruffle-activated-natural-playback-diagnostics",
);
const DEFAULT_PRE_ACTIVATION_MS = 250;
const DEFAULT_POST_ACTIVATION_MS = 3_500;
const DEFAULT_TIMEOUT_MS = 45_000;
const USER_CLICK_ATTEMPT_TIMEOUT_MS = 2_000;
const DIAGNOSTIC_VIEWPORT = Object.freeze({width: 1280, height: 1600});
const SAFE_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function invariant(value, message) {
  if (!value) throw new Error(message);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function portableFrom(root, value) {
  return portable(path.relative(root, value));
}

function isPathInside(root, value, {allowRoot = false} = {}) {
  const relative = path.relative(root, value);
  return (allowRoot && relative === "") || (
    relative !== "" &&
    relative !== ".." &&
    !relative.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relative)
  );
}

function assertSafeId(value, label) {
  invariant(typeof value === "string" && SAFE_ID.test(value), `${label} must be a lowercase hyphenated ID`);
  return value;
}

function parseInteger(value, label, {allowZero = false} = {}) {
  const parsed = Number(value);
  invariant(
    Number.isInteger(parsed) && (allowZero ? parsed >= 0 : parsed > 0),
    `${label} must be ${allowZero ? "a non-negative" : "a positive"} integer`,
  );
  return parsed;
}

function defaultRunId(now = new Date()) {
  return `run-${now.toISOString().replace(/[-:.]/g, "").toLowerCase()}`;
}

function resolveInputPath(value) {
  return path.isAbsolute(value) ? path.resolve(value) : path.resolve(projectRoot, value);
}

export function parseActivatedPlaybackArguments(argv, {now = new Date()} = {}) {
  const options = {
    releaseId: "",
    ids: [],
    baseUrl: "",
    language: "both",
    runId: defaultRunId(now),
    preActivationMs: DEFAULT_PRE_ACTIVATION_MS,
    postActivationMs: DEFAULT_POST_ACTIVATION_MS,
    timeoutMs: DEFAULT_TIMEOUT_MS,
    releaseCatalogPath: path.join(projectRoot, "catalog", "lesson-releases.json"),
    animationCatalogPath: path.join(projectRoot, "catalog", "animations.json"),
    migrationsRoot: path.join(projectRoot, "migrations"),
    check: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--help" || value === "-h") {
      options.help = true;
      continue;
    }
    if (value === "--check") {
      options.check = true;
      continue;
    }
    const next = () => {
      const candidate = argv[++index];
      invariant(candidate && !candidate.startsWith("--"), `${value} requires a value`);
      return candidate;
    };
    if (value === "--release-id") options.releaseId = next();
    else if (value === "--id") options.ids.push(next());
    else if (value === "--base-url") options.baseUrl = assertLoopbackBaseUrl(next());
    else if (value === "--lang") options.language = next();
    else if (value === "--run-id") options.runId = next();
    else if (value === "--pre-activation-ms") options.preActivationMs = parseInteger(next(), value, {allowZero: true});
    else if (value === "--post-activation-ms") options.postActivationMs = parseInteger(next(), value, {allowZero: true});
    else if (value === "--timeout-ms") options.timeoutMs = parseInteger(next(), value);
    else if (value === "--lesson-releases") options.releaseCatalogPath = resolveInputPath(next());
    else if (value === "--animations") options.animationCatalogPath = resolveInputPath(next());
    else if (value === "--migrations") options.migrationsRoot = resolveInputPath(next());
    else throw new Error(`Unknown option: ${value}`);
  }
  if (options.help) return options;
  assertSafeId(options.releaseId, "--release-id");
  assertSafeId(options.runId, "--run-id");
  invariant(options.baseUrl, "--base-url is required");
  invariant(["en", "es", "both"].includes(options.language), "--lang must be en, es, or both");
  for (const id of options.ids) assertSafeId(id, "--id");
  invariant(new Set(options.ids).size === options.ids.length, "--id values must not be repeated");
  return options;
}

/**
 * Reuse the exact release/source/workspace planner from the route-load probe,
 * but remap every output into an independent, append-only activated-playback
 * run. The route-load output tree is never a destination of this tool.
 */
export async function buildActivatedPlaybackPlan({
  root = projectRoot,
  releaseId,
  ids = [],
  baseUrl,
  language = "both",
  runId = defaultRunId(),
  preActivationMs = DEFAULT_PRE_ACTIVATION_MS,
  postActivationMs = DEFAULT_POST_ACTIVATION_MS,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  releaseCatalogPath = path.join(root, "catalog", "lesson-releases.json"),
  animationCatalogPath = path.join(root, "catalog", "animations.json"),
  migrationsRoot = path.join(root, "migrations"),
} = {}) {
  assertSafeId(runId, "runId");
  parseInteger(preActivationMs, "preActivationMs", {allowZero: true});
  parseInteger(postActivationMs, "postActivationMs", {allowZero: true});
  const basePlan = await buildReleaseProbePlan({
    root,
    releaseId,
    ids,
    baseUrl,
    language,
    settleMs: 0,
    timeoutMs,
    releaseCatalogPath,
    animationCatalogPath,
    migrationsRoot,
  });
  const outputRoot = path.join(basePlan.root, OUTPUT_RELATIVE_ROOT);
  const releaseOutputRoot = path.join(outputRoot, basePlan.releaseId, runId);
  const runs = basePlan.runs.map((run) => ({
    ...run,
    output: path.join(releaseOutputRoot, run.outputMemberDirectory, run.language),
    nativeStage: {...run.stage},
    rasterStage: {
      width: Math.ceil(run.stage.width),
      height: Math.ceil(run.stage.height),
    },
  }));
  invariant(
    runs.every((run) => isPathInside(releaseOutputRoot, run.output)),
    "Activated-playback output mapping escaped the independent run root",
  );
  return {
    ...basePlan,
    runId,
    preActivationMs,
    postActivationMs,
    outputRoot,
    releaseOutputRoot,
    runs,
    outputSeparation: {
      routeLoadRoot: portable(path.join("output", "playwright", "lesson-ruffle-reference-diagnostics")),
      activatedNaturalPlaybackRoot: portable(OUTPUT_RELATIVE_ROOT),
      independentRunDirectory: true,
      routeLoadArtifactsAreNeverReadOrWritten: true,
    },
  };
}

async function readBoundToolFile(root, filePath, label) {
  const absolute = path.resolve(filePath);
  invariant(isPathInside(root, absolute), `${label} must stay inside the project root`);
  const information = await lstat(absolute);
  invariant(information.isFile() && !information.isSymbolicLink(), `${label} must be a real regular file`);
  invariant(information.nlink === 1, `${label} must not be hard linked`);
  invariant(await realpath(absolute) === absolute, `${label} must not traverse a symbolic-link parent`);
  const bytes = await readFile(absolute);
  return {
    path: portableFrom(root, absolute),
    bytes: bytes.length,
    sha256: sha256(bytes),
  };
}

async function ensureFreshRunRoot(plan) {
  invariant(
    isPathInside(path.join(plan.root, OUTPUT_RELATIVE_ROOT), plan.releaseOutputRoot),
    "Activated-playback run root escaped the controlled output tree",
  );
  try {
    await lstat(plan.releaseOutputRoot);
    throw new Error(`Activated-playback run output already exists; choose a fresh --run-id: ${portableFrom(plan.root, plan.releaseOutputRoot)}`);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  await mkdir(plan.releaseOutputRoot, {recursive: true});
  invariant(await realpath(plan.releaseOutputRoot) === plan.releaseOutputRoot, "Activated-playback run output traverses a symbolic link");
}

async function ensureRunDirectory(plan, directory) {
  invariant(isPathInside(plan.releaseOutputRoot, directory), "Activated-playback member output escaped the run root");
  await mkdir(directory, {recursive: true});
  invariant(await realpath(directory) === directory, "Activated-playback member output traverses a symbolic link");
}

async function writeJsonExclusive(filePath, value) {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, {encoding: "utf8", flag: "wx"});
}

async function validatePlaywrightSourceResponse(response, expected) {
  const body = await response.body();
  const headers = await response.allHeaders();
  const webResponse = new Response(body, {status: response.status(), headers});
  return validateSourceResponse(webResponse, {
    expectedSha256: expected.sha256,
    expectedBytes: expected.bytes,
  });
}

export async function inspectRuffleActivationState(page) {
  return page.locator("ruffle-player").evaluate((player) => {
    const overlay = (id) => {
      const element = player.shadowRoot?.getElementById(id) ?? null;
      if (!element) return {present: false, visible: false};
      const style = getComputedStyle(element);
      const rectangle = element.getBoundingClientRect();
      return {
        present: true,
        visible: style.display !== "none" && style.visibility !== "hidden" && Number(style.opacity || "1") > 0 && rectangle.width > 0 && rectangle.height > 0,
        inlineDisplay: element.style.display || "",
        computedDisplay: style.display,
        computedVisibility: style.visibility,
        computedOpacity: style.opacity,
        rectangle: {
          x: rectangle.x,
          y: rectangle.y,
          width: rectangle.width,
          height: rectangle.height,
        },
        text: (element.textContent ?? "").replace(/\s+/g, " ").trim(),
      };
    };
    let v1IsPlaying = null;
    let ruffleV1Available = false;
    try {
      const api = player.ruffle?.();
      ruffleV1Available = Boolean(api);
      if (api) v1IsPlaying = Boolean(api.isPlaying);
    } catch {
      // The public element state below remains the primary observation.
    }
    const metadata = player.metadata && typeof player.metadata === "object"
      ? {
          width: player.metadata.width ?? null,
          height: player.metadata.height ?? null,
          frameRate: player.metadata.frameRate ?? null,
          numFrames: player.metadata.numFrames ?? null,
          swfVersion: player.metadata.swfVersion ?? null,
        }
      : null;
    return {
      observedAtPerformanceMs: performance.now(),
      publicElementIsPlaying: Boolean(player.isPlaying),
      ruffleV1IsPlaying: v1IsPlaying,
      ruffleV1Available,
      playApiAvailable: typeof player.play === "function",
      readyState: Number.isFinite(player.readyState) ? player.readyState : null,
      metadata,
      overlays: {
        play: overlay("play-button"),
        unmute: overlay("unmute-overlay"),
        hardwareAcceleration: overlay("hardware-acceleration-modal"),
      },
    };
  });
}

async function shadowControl(page, selector) {
  const control = page.locator("ruffle-player").locator(selector);
  invariant(await control.count() === 1, `Ruffle shadow control ${selector} is not uniquely available`);
  return control;
}

async function clickShadowControl(page, selector, timeoutMs) {
  const control = await shadowControl(page, selector);
  await control.click({timeout: timeoutMs});
}

async function invokePlayerPlayApi(page) {
  return page.locator("ruffle-player").evaluate((player) => {
    if (typeof player.play !== "function") return false;
    player.play();
    return true;
  });
}

/**
 * Prefer a real Playwright user click on Ruffle's playback controls. Calling
 * player.play() is a recorded fallback/reassertion only; the probe never hides
 * which path was taken.
 */
export async function explicitlyActivateRufflePlayback(page, {timeoutMs = DEFAULT_TIMEOUT_MS} = {}) {
  const before = await inspectRuffleActivationState(page);
  const steps = [];

  if (before.overlays.play.visible) {
    const playControl = await shadowControl(page, "#play-button");
    try {
      await playControl.hover({timeout: Math.min(timeoutMs, 500)});
      steps.push({method: "playwright-hover", target: "ruffle-shadow-play-button", outcome: "completed", activation: false, playerPlayApi: false});
    } catch (error) {
      steps.push({
        method: "playwright-hover-attempt",
        target: "ruffle-shadow-play-button",
        outcome: "not-completed",
        activation: false,
        playerPlayApi: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
    await page.waitForTimeout(50);
    const afterHover = await inspectRuffleActivationState(page);
    if (afterHover.overlays.hardwareAcceleration.visible) {
      await clickShadowControl(page, "#hardware-acceleration-modal .close-modal", Math.min(timeoutMs, USER_CLICK_ATTEMPT_TIMEOUT_MS));
      steps.push({
        method: "playwright-ui-click",
        target: "ruffle-shadow-hardware-acceleration-modal-close",
        outcome: "delivered",
        activation: false,
        playerPlayApi: false,
        reason: "dismiss-cpu-renderer-warning-before-playback-activation",
      });
      await page.waitForTimeout(50);
    }
    try {
      await clickShadowControl(page, "#play-button", Math.min(timeoutMs, USER_CLICK_ATTEMPT_TIMEOUT_MS));
      steps.push({method: "playwright-user-click", target: "ruffle-shadow-play-button", outcome: "delivered", activation: true, playerPlayApi: false});
    } catch (error) {
      steps.push({
        method: "playwright-user-click-attempt",
        target: "ruffle-shadow-play-button",
        outcome: "not-delivered",
        playerPlayApi: false,
        error: error instanceof Error ? error.message : String(error),
      });
      const invoked = await invokePlayerPlayApi(page);
      invariant(invoked, "Ruffle player.play() API is unavailable after the preferred real-user click was not delivered");
      steps.push({
        method: "player-play-api",
        target: "ruffle-player",
        outcome: "invoked",
        playerPlayApi: true,
        reason: "preferred-playwright-user-click-was-not-delivered",
      });
    }
  } else if (before.overlays.unmute.visible) {
    await clickShadowControl(page, "#unmute-overlay", timeoutMs);
    steps.push({method: "playwright-user-click", target: "ruffle-shadow-unmute-overlay", playerPlayApi: false});
    const invoked = await invokePlayerPlayApi(page);
    invariant(invoked, "Ruffle player.play() API is unavailable after the unmute-only activation");
    steps.push({method: "player-play-api", target: "ruffle-player", playerPlayApi: true, reason: "unmute-click-does-not-itself-start-playback"});
  } else {
    const invoked = await invokePlayerPlayApi(page);
    invariant(invoked, "Ruffle player.play() API is unavailable and no user-clickable playback overlay is visible");
    steps.push({
      method: "player-play-api",
      target: "ruffle-player",
      playerPlayApi: true,
      reason: before.publicElementIsPlaying ? "playback-already-active-without-visible-overlay-reasserted" : "no-visible-playback-overlay",
    });
  }

  await page.waitForTimeout(50);
  const afterPrimary = await inspectRuffleActivationState(page);
  if (afterPrimary.overlays.unmute.visible && !steps.some((step) => step.target === "ruffle-shadow-unmute-overlay")) {
    await clickShadowControl(page, "#unmute-overlay", timeoutMs);
    steps.push({method: "playwright-user-click", target: "ruffle-shadow-unmute-overlay", playerPlayApi: false});
    await page.waitForTimeout(50);
  }
  const beforeFinalModalDismissal = await inspectRuffleActivationState(page);
  if (beforeFinalModalDismissal.overlays.hardwareAcceleration.visible) {
    await clickShadowControl(page, "#hardware-acceleration-modal .close-modal", Math.min(timeoutMs, USER_CLICK_ATTEMPT_TIMEOUT_MS));
    steps.push({
      method: "playwright-ui-click",
      target: "ruffle-shadow-hardware-acceleration-modal-close",
      outcome: "delivered",
      activation: false,
      playerPlayApi: false,
      reason: "dismiss-cpu-renderer-warning-after-playback-activation",
    });
    await page.waitForTimeout(50);
  }
  const after = await inspectRuffleActivationState(page);
  invariant(!after.overlays.play.visible, "Ruffle play overlay remained visible after explicit activation attempts");
  invariant(!after.overlays.unmute.visible, "Ruffle unmute overlay remained visible after explicit activation attempts");
  invariant(!after.overlays.hardwareAcceleration.visible, "Ruffle hardware-acceleration diagnostic modal remained visible after dismissal attempts");
  return {
    userActivationPreferred: true,
    userActivationAttempted: steps.some((step) => step.method === "playwright-user-click" || step.method === "playwright-user-click-attempt"),
    userActivationUsed: steps.some((step) => step.method === "playwright-user-click"),
    playerPlayApiUsed: steps.some((step) => step.playerPlayApi),
    primaryTrigger: steps[0]?.target ?? null,
    steps,
    before,
    afterPrimary,
    after,
    stateBoundary: "isPlaying and overlay states are time-local Ruffle observations only. They do not identify a Flash frame, language state, audio cue, or authoritative behavior.",
  };
}

async function setNativeStageGeometry(page, run) {
  const stage = page.locator(".reference-stage");
  const host = page.locator(".reference-player-host");
  const player = page.locator("ruffle-player");
  await stage.evaluate((element, dimensions) => {
    element.style.width = `${dimensions.width}px`;
    element.style.height = `${dimensions.height}px`;
    element.style.maxWidth = "none";
    element.style.aspectRatio = "auto";
    element.style.boxSizing = "content-box";
  }, run.nativeStage);
  let hostBox = await host.boundingBox();
  invariant(hostBox, `${run.animationId}/${run.language}: reference host has no bounding box`);
  const requiredViewportHeight = Math.ceil(hostBox.y + hostBox.height + 100);
  if (requiredViewportHeight > DIAGNOSTIC_VIEWPORT.height) {
    invariant(requiredViewportHeight <= 3_000, `${run.animationId}/${run.language}: reference host cannot be contained without scrolling`);
    await page.setViewportSize({width: DIAGNOSTIC_VIEWPORT.width, height: requiredViewportHeight});
    hostBox = await host.boundingBox();
    invariant(hostBox, `${run.animationId}/${run.language}: reference host disappeared after viewport expansion`);
  }
  const [stageBox, playerBox, headerBox, viewport] = await Promise.all([
    stage.boundingBox(),
    player.boundingBox(),
    page.locator(".site-header").count().then((count) => count ? page.locator(".site-header").boundingBox() : null),
    page.evaluate(() => ({scrollX: window.scrollX, scrollY: window.scrollY, innerWidth: window.innerWidth, innerHeight: window.innerHeight})),
  ]);
  invariant(stageBox && playerBox, `${run.animationId}/${run.language}: stage or player geometry is unavailable`);
  invariant(viewport.scrollX === 0 && viewport.scrollY === 0, `${run.animationId}/${run.language}: page scrolled before capture`);
  invariant(hostBox.x >= 0 && hostBox.y >= 0 && hostBox.x + hostBox.width <= viewport.innerWidth && hostBox.y + hostBox.height <= viewport.innerHeight, `${run.animationId}/${run.language}: host is not fully visible`);
  const headerBottom = headerBox ? headerBox.y + headerBox.height : 0;
  invariant(hostBox.y >= headerBottom, `${run.animationId}/${run.language}: sticky site header overlaps the capture rectangle`);
  invariant(Math.abs(hostBox.width - run.nativeStage.width) <= 0.05, `${run.animationId}/${run.language}: native host width drifted`);
  invariant(Math.abs(hostBox.height - run.nativeStage.height) <= 0.05, `${run.animationId}/${run.language}: native host height drifted`);
  invariant(Math.abs(playerBox.x - hostBox.x) <= 0.05 && Math.abs(playerBox.y - hostBox.y) <= 0.05, `${run.animationId}/${run.language}: player origin drifted from host`);
  invariant(Math.abs(playerBox.width - hostBox.width) <= 0.05 && Math.abs(playerBox.height - hostBox.height) <= 0.05, `${run.animationId}/${run.language}: player size drifted from host`);
  return {
    viewport,
    stage: stageBox,
    host: hostBox,
    player: playerBox,
    stickySiteHeader: headerBox,
    stickyHeaderBottom: headerBottom,
    captureRectangleRole: "reference-player-host-only",
    nativeCssStage: {...run.nativeStage},
    rasterPngStage: {...run.rasterStage},
    fractionalNativeStagePreservedSeparatelyFromCeilRaster: true,
  };
}

async function captureNativeRaster(page, root, run, geometry, filePath, role) {
  await page.screenshot({
    path: filePath,
    animations: "allow",
    caret: "hide",
    clip: {
      x: Math.floor(geometry.host.x),
      y: Math.floor(geometry.host.y),
      width: run.rasterStage.width,
      height: run.rasterStage.height,
    },
  });
  const bytes = await readFile(filePath);
  const png = PNG.sync.read(bytes);
  invariant(png.width === run.rasterStage.width && png.height === run.rasterStage.height, `${run.animationId}/${run.language}: PNG raster dimensions drifted`);
  return {
    path: portableFrom(root, filePath),
    bytes: bytes.length,
    sha256: sha256(bytes),
    width: png.width,
    height: png.height,
    nativeCssStage: {...run.nativeStage},
    rasterPngStage: {...run.rasterStage},
    role,
    sourceFrameBinding: null,
    requirementTraceEntryStateBinding: null,
  };
}

async function runOneActivatedProbe(browser, plan, run, networkingBoundary, toolchain) {
  await ensureRunDirectory(plan, run.output);
  const beforeScreenshotPath = path.join(run.output, "before-explicit-activation-stage.png");
  const afterScreenshotPath = path.join(run.output, "activated-natural-playback-stage.png");
  const reportPath = path.join(run.output, "activated-natural-playback-diagnostic.json");
  const context = await browser.newContext({
    viewport: DIAGNOSTIC_VIEWPORT,
    deviceScaleFactor: 1,
    serviceWorkers: "block",
    acceptDownloads: false,
  });
  await context.addInitScript(() => {
    const current = window.RufflePlayer && typeof window.RufflePlayer === "object"
      ? window.RufflePlayer
      : {};
    current.config = {
      ...(current.config && typeof current.config === "object" ? current.config : {}),
      autoplay: "off",
      unmuteOverlay: "visible",
    };
    window.RufflePlayer = current;
  });
  const policy = {expectedOrigin: plan.baseUrl, pageUrl: run.pageUrl, sourceUrl: run.sourceUrl};
  const guard = await installPlaywrightNetworkGuard(context, policy);
  const page = await context.newPage();
  const responses = [];
  const consoleMessages = [];
  const pageErrors = [];
  page.on("response", (response) => responses.push({
    url: response.url(),
    method: response.request().method(),
    status: response.status(),
    disposition: requestDisposition(response.url(), response.request().method(), policy).kind,
  }));
  page.on("console", (message) => consoleMessages.push({type: message.type(), text: message.text()}));
  page.on("pageerror", (error) => pageErrors.push(error.message));

  let sourceResponseOutcomePromise;
  try {
    sourceResponseOutcomePromise = waitForSourceResponseSettled(page, run.sourceUrl, plan.timeoutMs);
    const navigation = await page.goto(run.pageUrl, {waitUntil: "domcontentloaded", timeout: plan.timeoutMs});
    invariant(navigation?.status() === 200, `${run.animationId}/${run.language}: page returned HTTP ${navigation?.status() ?? "no response"}`);
    const sourceResponse = unwrapSourceResponseOutcome(await sourceResponseOutcomePromise);
    const sourceDiagnostic = await validatePlaywrightSourceResponse(sourceResponse, run.source);
    const forensicText = run.language === "es" ? "Ruffle es una referencia forense" : "Ruffle is a forensic reference";
    await page.getByText(forensicText, {exact: false}).waitFor({state: "visible", timeout: plan.timeoutMs});
    await page.locator(".reference-stage").waitFor({state: "visible", timeout: plan.timeoutMs});
    await page.locator("ruffle-player").waitFor({state: "attached", timeout: plan.timeoutMs});
    await page.locator('.reference-stage[aria-busy="false"]').waitFor({state: "attached", timeout: plan.timeoutMs});
    const geometry = await setNativeStageGeometry(page, run);
    if (plan.preActivationMs > 0) await page.waitForTimeout(plan.preActivationMs);
    const preActivationState = await inspectRuffleActivationState(page);
    const beforeScreenshot = await captureNativeRaster(
      page,
      plan.root,
      run,
      geometry,
      beforeScreenshotPath,
      "nondeterministic-ruffle-before-explicit-activation-diagnostic-only",
    );
    const activation = await explicitlyActivateRufflePlayback(page, {timeoutMs: plan.timeoutMs});
    const activationCompletedAt = new Date().toISOString();
    if (plan.postActivationMs > 0) await page.waitForTimeout(plan.postActivationMs);
    const postDelayState = await inspectRuffleActivationState(page);
    invariant(!postDelayState.overlays.play.visible, `${run.animationId}/${run.language}: play overlay reappeared before activated capture`);
    invariant(!postDelayState.overlays.unmute.visible, `${run.animationId}/${run.language}: unmute overlay remained before activated capture`);
    invariant(!postDelayState.overlays.hardwareAcceleration.visible, `${run.animationId}/${run.language}: hardware-acceleration modal reappeared before activated capture`);
    const afterScreenshot = await captureNativeRaster(
      page,
      plan.root,
      run,
      geometry,
      afterScreenshotPath,
      "nondeterministic-ruffle-post-explicit-activation-natural-playback-diagnostic-only",
    );
    invariant(guard.requests.some((request) => request.url === run.sourceUrl && request.method === "GET" && request.allowed), `${run.animationId}/${run.language}: exact SWF API GET was not observed`);
    invariant(guard.requests.some((request) => request.url === `${plan.baseUrl}/api/ruffle/ruffle.js` && request.method === "GET" && request.allowed), `${run.animationId}/${run.language}: local Ruffle loader GET was not observed`);

    const result = {
      schemaVersion: 1,
      reportType: "lesson-release-ruffle-explicitly-activated-natural-playback-diagnostic",
      generatedAt: new Date().toISOString(),
      runId: plan.runId,
      releaseId: plan.releaseId,
      releaseOrdinal: run.ordinal,
      animationId: run.animationId,
      assetId: run.assetId,
      releaseRole: run.releaseRole,
      localizedRouteLanguage: run.language,
      status: guard.blockedRequests.length || guard.blockedWebSockets.length
        ? "observed-after-explicit-activation-with-blocked-network-attempts"
        : "observed-after-explicit-activation",
      baseUrl: plan.baseUrl,
      pageUrl: run.pageUrl,
      sourceUrl: run.sourceUrl,
      outputSeparation: plan.outputSeparation,
      toolchain,
      exactReleaseBinding: {
        lessonReleases: plan.catalogs.lessonReleases,
        animations: plan.catalogs.animations,
        workspace: run.workspace,
        manifest: run.manifest,
        machineAudit: run.machineAudit,
        source: run.source,
        nativeStage: run.nativeStage,
        rasterStage: run.rasterStage,
        physicalSourceHashPathBytesAndStageVerifiedBeforeBrowser: true,
      },
      sourceDiagnostic,
      playbackDiagnostic: {
        probeConfiguration: {
          autoplay: "off",
          unmuteOverlay: "visible",
          reason: "Force an explicit-start diagnostic opportunity before natural Ruffle playback; this is probe configuration, not evidence of the normal route autoplay state.",
        },
        fixedDelayBeforeActivationMs: plan.preActivationMs,
        fixedDelayAfterActivationMs: plan.postActivationMs,
        activationCompletedAt,
        preActivationState,
        activation,
        postFixedDelayState: postDelayState,
        postCaptureOverlaysClear: true,
        exactSourceFrameObserved: null,
        deterministicFrameSelectionSupported: false,
        normalRouteAutoplayBehaviorProven: false,
        languageFlashVarSelectionSupported: false,
        localizedRouteLanguageIsNotSwfLanguageState: true,
        audioCueOrAudibilityObserved: false,
        naturalPlaybackBoundary: "The post-activation image is a nondeterministic Ruffle observation after an explicit start trigger and a fixed wall-clock delay. It is not bound to an exact SWF frame or a source-evidenced natural trace.",
      },
      geometry,
      networkDiagnostic: {
        enforcement: "real-playwright-browser-context-route-and-websocket-interception",
        expectedOrigin: plan.baseUrl,
        allowlist: [
          "exact reference page GET",
          "exact hash-bound SWF API GET",
          "same-origin /_next GET",
          "same-origin /api/ruffle GET",
        ],
        everyOtherHttpRequestAbortedAndRecorded: true,
        everyWebSocketAbortedAndRecorded: true,
        blockedRequestsReachedServer: false,
        requests: guard.requests,
        blockedRequests: guard.blockedRequests,
        blockedWebSockets: guard.blockedWebSockets,
        responses,
      },
      ruffleNetworkingBoundary: networkingBoundary,
      browserDiagnostic: {
        product: "Playwright Chromium",
        version: browser.version(),
        viewport: {...geometry.viewport, deviceScaleFactor: 1},
        consoleMessages,
        pageErrors,
        messagesAreRecordedDiagnosticsNotAcceptance: true,
      },
      screenshots: {
        beforeExplicitActivation: beforeScreenshot,
        afterExplicitActivationAndFixedDelay: afterScreenshot,
      },
      acceptance: {
        acceptanceNeutral: true,
        strictAcceptanceEffect: false,
        originalRuntimeAuthority: false,
        deterministicFrameEvidence: false,
        swfEnglishOrSpanishStateEvidence: false,
        audioEvidence: false,
        fidelityOrRmseEvidence: false,
        humanReview: false,
        ownerReview: false,
        statement: "This diagnostic binds an exact release member and physical SWF source to a contained local Ruffle load, records explicit activation mechanics and time-local playback/UI state, then captures a native-raster nondeterministic image after a fixed delay. It does not establish original-runtime authority, an exact or deterministic frame, a source-evidenced natural trace, English/Spanish SWF state, audio cue correctness or audibility, fidelity, RMSE, human review, owner review, strict completion, publication, or a current-JavaScript renderer.",
      },
    };
    await writeJsonExclusive(reportPath, result);
    return {result, reportPath};
  } catch (error) {
    const normalized = error instanceof Error ? error : new Error(String(error));
    normalized.diagnosticContext = {
      networkDiagnostic: {
        enforcement: "real-playwright-browser-context-route-and-websocket-interception",
        requests: guard.requests,
        blockedRequests: guard.blockedRequests,
        blockedWebSockets: guard.blockedWebSockets,
        blockedRequestsReachedServer: false,
      },
      responses,
      consoleMessages,
      pageErrors,
    };
    throw normalized;
  } finally {
    await context.close();
    if (sourceResponseOutcomePromise) await sourceResponseOutcomePromise;
  }
}

export async function runActivatedPlaybackBatch(options) {
  const plan = await buildActivatedPlaybackPlan(options);
  const [networkingBoundary, activatedProbe, routeLoadProbe] = await Promise.all([
    readPinnedRuffleNetworkingBoundary({root: plan.root}),
    readBoundToolFile(plan.root, scriptPath, "activated-playback probe"),
    readBoundToolFile(plan.root, routeLoadProbePath, "exact-release route-load planner/probe"),
  ]);
  const toolchain = {
    activatedPlaybackProbe: activatedProbe,
    reusedExactReleasePlannerAndNetworkGuard: routeLoadProbe,
  };
  await ensureFreshRunRoot(plan);
  const browser = await chromium.launch({headless: true});
  const results = [];
  try {
    for (const run of plan.runs) {
      try {
        const completed = await runOneActivatedProbe(browser, plan, run, networkingBoundary, toolchain);
        results.push({
          ordinal: run.ordinal,
          animationId: run.animationId,
          language: run.language,
          status: completed.result.status,
          report: portableFrom(plan.root, completed.reportPath),
        });
      } catch (error) {
        await ensureRunDirectory(plan, run.output);
        const failurePath = path.join(run.output, "activated-natural-playback-failure.json");
        await writeJsonExclusive(failurePath, {
          schemaVersion: 1,
          reportType: "lesson-release-ruffle-explicitly-activated-natural-playback-diagnostic-failure",
          generatedAt: new Date().toISOString(),
          runId: plan.runId,
          releaseId: plan.releaseId,
          releaseOrdinal: run.ordinal,
          animationId: run.animationId,
          language: run.language,
          status: "failed-closed",
          error: error instanceof Error ? error.message : String(error),
          outputSeparation: plan.outputSeparation,
          toolchain,
          diagnosticContext: error instanceof Error && error.diagnosticContext ? error.diagnosticContext : null,
          acceptance: {acceptanceNeutral: true, strictAcceptanceEffect: false},
        });
        results.push({
          ordinal: run.ordinal,
          animationId: run.animationId,
          language: run.language,
          status: "failed-closed",
          report: portableFrom(plan.root, failurePath),
        });
      }
    }
  } finally {
    await browser.close();
  }

  const failures = results.filter((result) => result.status === "failed-closed");
  const batchPath = path.join(plan.releaseOutputRoot, "batch-activated-natural-playback-diagnostic.json");
  const batch = {
    schemaVersion: 1,
    reportType: "lesson-release-ruffle-explicitly-activated-natural-playback-diagnostic-batch",
    generatedAt: new Date().toISOString(),
    runId: plan.runId,
    release: plan.release,
    languages: plan.languages,
    baseUrl: plan.baseUrl,
    catalogs: plan.catalogs,
    outputSeparation: plan.outputSeparation,
    toolchain,
    runCount: results.length,
    observedCount: results.length - failures.length,
    failedCount: failures.length,
    runs: results,
    ruffleNetworkingBoundary: networkingBoundary,
    acceptance: {
      acceptanceNeutral: true,
      strictAcceptanceEffect: false,
      statement: "This batch contains only explicitly activated, nondeterministic local Ruffle observations. It is separate from route-load diagnostics and cannot create deterministic frame or original-runtime evidence, language/audio/fidelity/RMSE acceptance, human or owner review, current-JavaScript coverage, strict completion, or publication.",
    },
  };
  await writeJsonExclusive(batchPath, batch);
  if (failures.length) {
    const error = new Error(`${failures.length}/${results.length} activated Ruffle diagnostic run(s) failed closed; see ${portableFrom(plan.root, batchPath)}`);
    error.batch = batch;
    throw error;
  }
  return {plan, batch, batchPath};
}

function usage() {
  return `Usage: node scripts/probe-lesson-release-ruffle-activated-playback.mjs --release-id <id> --base-url <loopback-origin> [options]\n\nOptions:\n  --release-id <id>                  Exact atomic lesson release (required)\n  --id <animation-id>                Exact release-member subset; repeatable\n  --base-url <origin>                Plain-HTTP loopback origin (required)\n  --lang <en|es|both>                Localized route(s), default: both\n  --run-id <id>                      Fresh append-only run ID; default: UTC timestamp\n  --pre-activation-ms <milliseconds> Fixed delay before inspecting/clicking, default: ${DEFAULT_PRE_ACTIVATION_MS}\n  --post-activation-ms <milliseconds> Fixed delay before the activated screenshot, default: ${DEFAULT_POST_ACTIVATION_MS}\n  --timeout-ms <milliseconds>        Per-navigation/load/click timeout, default: ${DEFAULT_TIMEOUT_MS}\n  --lesson-releases <file>           Release catalog override\n  --animations <file>                Animation catalog override\n  --migrations <directory>           Migration root override\n  --check                            Validate the exact plan; do not open a browser or write output\n  --help                             Show this help\n\nOutputs are restricted to output/playwright/lesson-ruffle-activated-natural-playback-diagnostics/<release-id>/<run-id>/. The tool forces autoplay off, prefers a real user click on Ruffle playback overlays, records any player.play() fallback, and captures nondeterministic post-activation Ruffle diagnostics only. It never reads or writes the route-load batch directory and cannot create acceptance evidence.`;
}

async function main() {
  const options = parseActivatedPlaybackArguments(process.argv.slice(2));
  if (options.help) {
    console.log(usage());
    return;
  }
  if (options.check) {
    const plan = await buildActivatedPlaybackPlan(options);
    console.log(`CHECK ${plan.runs.length} activated-playback run(s): ${portableFrom(plan.root, plan.releaseOutputRoot)}`);
    return;
  }
  const {batch, batchPath} = await runActivatedPlaybackBatch(options);
  console.log(`OBSERVED ${batch.observedCount}/${batch.runCount}: ${portableFrom(projectRoot, batchPath)}`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
