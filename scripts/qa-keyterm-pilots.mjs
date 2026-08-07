#!/usr/bin/env node

import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { chromium } from "playwright";
import { PNG } from "pngjs";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");
const defaultBaseUrl = "http://localhost:3213";
const screenshotRoot = path.join(projectRoot, "output", "playwright", "keyterm-strict-qa");
const qaSeed = 7;

export const DEV_OVERLAY_CAPTURE_STYLE_ID = "help-math-keyterm-qa-hide-next-dev-overlay";
export const DEV_OVERLAY_CONTROL_SELECTOR = [
  "button",
  "[role='button']",
  "[data-nextjs-dev-tools-button]",
  "#next-logo",
  "[data-next-badge-root]",
].join(",");
export const DEV_OVERLAY_CAPTURE_CSS = [
  "script[data-nextjs-dev-overlay]",
  "nextjs-portal",
].join(",") + "{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important}";

export const AUTHORITY_CLAIM_KEYS = Object.freeze([
  "authoritativeOriginalRuntimeBaseline",
  "naturalOriginalRuntimeTraversal",
  "interactionBranchParity",
  "scoringParity",
  "bilingualVisualParity",
  "audioParity",
  "fullFrameCoverage",
  "rmseAcceptance",
  "humanVisualReview",
  "ownerAcceptance",
  "strictMigrationCompletion",
]);

const pilots = Object.freeze([
  Object.freeze({
    animationId: "keyterm-elementary-acute-angle",
    source: Object.freeze({
      path: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_KEYTERMS/KT/ELEMENTARY/DIG/acute_angle.swf",
      sha256: "dbc56af636e5551c582977f9230be2ae530874a05c901f0cf44dd5e2d5f2a347",
    }),
    modulePath: "packages/demos/src/modules/keyterm-elementary-acute-angle.tsx",
    timelinePath: "packages/demos/src/timelines/keyterm-acute-angle.ts",
    frameCount: 60,
    playbackMode: "loop",
    stage: Object.freeze({ width: 225, height: 225 }),
    replay: "toolbar",
    assets: Object.freeze([
      "/flash-assets/keyterms/acute-angle/frames/1.png",
      "/flash-assets/keyterms/acute-angle/frames/60.png",
    ]),
  }),
  Object.freeze({
    animationId: "keyterm-elementary-computeghgh",
    source: Object.freeze({
      path: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_KEYTERMS/KT/ELEMENTARY/DIG/computeghgh.swf",
      sha256: "fc5c79792530092fa98d450ac00622f5f107c598bf2f313b69fe3b524a6d62e8",
    }),
    modulePath: "packages/demos/src/modules/keyterm-elementary-computeghgh.tsx",
    timelinePath: "packages/demos/src/timelines/keyterm-computeghgh.ts",
    frameCount: 35,
    playbackMode: "once",
    stage: Object.freeze({ width: 225, height: 225 }),
    replay: "stage",
    assets: Object.freeze([
      "/flash-assets/keyterms/computeghgh/frame.png",
      "/flash-assets/keyterms/computeghgh/buttons/up.svg",
      "/flash-assets/keyterms/computeghgh/buttons/over.svg",
      "/flash-assets/keyterms/computeghgh/buttons/down.svg",
    ]),
  }),
]);

export function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function portable(filePath) {
  return path.relative(projectRoot, filePath).split(path.sep).join("/");
}

export function normalizeLoopbackBaseUrl(value) {
  const parsed = new URL(value);
  const hostname = parsed.hostname.replace(/^\[|\]$/g, "");
  if (!["http:", "https:"].includes(parsed.protocol)) throw new Error("--base-url must use http or https");
  if (!["localhost", "127.0.0.1", "::1"].includes(hostname)) throw new Error("--base-url must use a loopback host");
  if (parsed.username || parsed.password || parsed.search || parsed.hash || (parsed.pathname && parsed.pathname !== "/")) {
    throw new Error("--base-url must be a loopback origin without credentials, path, query, or hash");
  }
  return parsed.origin;
}

export function parseArguments(argv) {
  const options = { baseUrl: defaultBaseUrl, ids: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--base-url") {
      if (!argv[index + 1]) throw new Error("--base-url requires a value");
      options.baseUrl = argv[index + 1];
      index += 1;
    } else if (value === "--id") {
      if (!argv[index + 1]) throw new Error("--id requires a value");
      options.ids.push(argv[index + 1]);
      index += 1;
    } else if (value === "--help" || value === "-h") options.help = true;
    else throw new Error(`Unknown option: ${value}`);
  }
  if (!options.help) options.baseUrl = normalizeLoopbackBaseUrl(options.baseUrl);
  return options;
}

function usage() {
  return "Usage: node scripts/qa-keyterm-pilots.mjs [--base-url http://localhost:3213] [--id keyterm-elementary-acute-angle]";
}

function overlaySnapshotShapeIsValid(state) {
  const keys = [
    "scriptOverlayCount",
    "hiddenScriptOverlayCount",
    "portalCount",
    "hiddenPortalCount",
    "shadowRootCount",
    "controlCount",
    "visibleControlCount",
  ];
  return Boolean(state) && keys.every((key) => Number.isInteger(state[key]) && state[key] >= 0);
}

function overlaySnapshotIsClean(state) {
  return overlaySnapshotShapeIsValid(state)
    && state.visibleControlCount === 0
    && state.hiddenScriptOverlayCount === state.scriptOverlayCount
    && state.hiddenPortalCount === state.portalCount;
}

export function devOverlaySuppressionPass(record) {
  return Boolean(
    record?.capturePageOnly === true
      && record?.styleInstalled === true
      && overlaySnapshotShapeIsValid(record?.beforeSuppression)
      && overlaySnapshotIsClean(record?.afterSuppression)
      && overlaySnapshotIsClean(record?.afterCapture),
  );
}

async function inspectDevOverlay(page) {
  return page.evaluate((controlSelector) => {
    const visible = (element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== "none"
        && style.visibility !== "hidden"
        && Number(style.opacity || "1") !== 0
        && rect.width > 0
        && rect.height > 0;
    };
    const scripts = [...document.querySelectorAll("script[data-nextjs-dev-overlay]")];
    const portals = [...document.querySelectorAll("nextjs-portal")];
    const controls = portals.flatMap((portal) => (
      portal.shadowRoot ? [...portal.shadowRoot.querySelectorAll(controlSelector)] : []
    ));
    return {
      scriptOverlayCount: scripts.length,
      hiddenScriptOverlayCount: scripts.filter((script) => !visible(script)).length,
      portalCount: portals.length,
      hiddenPortalCount: portals.filter((portal) => !visible(portal)).length,
      shadowRootCount: portals.filter((portal) => portal.shadowRoot).length,
      controlCount: controls.length,
      visibleControlCount: controls.filter(visible).length,
    };
  }, DEV_OVERLAY_CONTROL_SELECTOR);
}

async function settlePage(page) {
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

async function suppressDevOverlayForCapture(page) {
  const beforeSuppression = await inspectDevOverlay(page);
  const styleInstalled = await page.evaluate(({ styleId, css, controlSelector }) => {
    let style = document.getElementById(styleId);
    if (!style) {
      style = document.createElement("style");
      style.id = styleId;
      style.dataset.captureOnly = "true";
      document.head.appendChild(style);
    }
    style.textContent = css;
    for (const script of document.querySelectorAll("script[data-nextjs-dev-overlay]")) {
      script.style.setProperty("display", "none", "important");
      script.style.setProperty("visibility", "hidden", "important");
      script.style.setProperty("opacity", "0", "important");
      script.dataset.helpMathKeytermQaCaptureHidden = "true";
    }
    for (const portal of document.querySelectorAll("nextjs-portal")) {
      portal.style.setProperty("display", "none", "important");
      portal.style.setProperty("visibility", "hidden", "important");
      portal.style.setProperty("opacity", "0", "important");
      portal.style.setProperty("pointer-events", "none", "important");
      portal.dataset.helpMathKeytermQaCaptureHidden = "true";
      for (const control of portal.shadowRoot?.querySelectorAll(controlSelector) || []) {
        control.style.setProperty("display", "none", "important");
        control.style.setProperty("visibility", "hidden", "important");
        control.style.setProperty("opacity", "0", "important");
        control.setAttribute("aria-hidden", "true");
      }
    }
    return Boolean(style.isConnected && style.dataset.captureOnly === "true" && style.textContent === css);
  }, {
    styleId: DEV_OVERLAY_CAPTURE_STYLE_ID,
    css: DEV_OVERLAY_CAPTURE_CSS,
    controlSelector: DEV_OVERLAY_CONTROL_SELECTOR,
  });
  await settlePage(page);
  const afterSuppression = await inspectDevOverlay(page);
  const record = {
    capturePageOnly: true,
    strategy: "Capture-page-only CSS plus inline important styles suppress Next.js overlay scripts, portal hosts, and shadow-root controls.",
    styleId: DEV_OVERLAY_CAPTURE_STYLE_ID,
    cssSha256: sha256(DEV_OVERLAY_CAPTURE_CSS),
    styleInstalled,
    beforeSuppression,
    afterSuppression,
    afterCapture: null,
  };
  if (!devOverlaySuppressionPass({ ...record, afterCapture: afterSuppression })) {
    throw new Error(`Next.js development overlay remained visible before capture: ${JSON.stringify(record)}`);
  }
  return record;
}

async function screenshot(page, locator, destination, { fullPage = false } = {}) {
  const devOverlaySuppression = await suppressDevOverlayForCapture(page);
  await mkdir(path.dirname(destination), { recursive: true });
  if (locator) await locator.screenshot({ path: destination, animations: "disabled" });
  else await page.screenshot({ path: destination, fullPage, animations: "disabled" });
  devOverlaySuppression.afterCapture = await inspectDevOverlay(page);
  if (!devOverlaySuppressionPass(devOverlaySuppression)) {
    throw new Error(`Next.js development overlay became visible during capture: ${JSON.stringify(devOverlaySuppression)}`);
  }
  const bytes = await readFile(destination);
  const image = PNG.sync.read(bytes);
  return {
    path: portable(destination),
    sha256: sha256(bytes),
    width: image.width,
    height: image.height,
    devOverlaySuppression,
  };
}

function monitorPage(page, baseOrigin, diagnostics) {
  const expected = new URL(baseOrigin);
  const expectedEndpoint = `${expected.hostname}:${expected.port || (expected.protocol === "https:" ? "443" : "80")}`;
  page.on("console", (message) => {
    if (message.type() === "error") diagnostics.consoleErrors.push({ url: page.url(), text: message.text() });
  });
  page.on("pageerror", (error) => diagnostics.pageErrors.push({ url: page.url(), message: error.message }));
  page.on("request", (request) => {
    const url = request.url();
    if (/\.(?:mp3|wav|m4a)(?:\?|$)/i.test(url)) diagnostics.audioRequests.push(url);
    try {
      const parsed = new URL(url);
      if (["http:", "https:", "ws:", "wss:"].includes(parsed.protocol)) {
        const secure = parsed.protocol === "https:" || parsed.protocol === "wss:";
        const endpoint = `${parsed.hostname}:${parsed.port || (secure ? "443" : "80")}`;
        if (endpoint !== expectedEndpoint || !["localhost", "127.0.0.1", "[::1]", "::1"].includes(parsed.hostname)) {
          diagnostics.unexpectedRequests.push(url);
        }
      }
    } catch {
      diagnostics.unexpectedRequests.push(url);
    }
  });
  page.on("requestfailed", (request) => {
    const record = {
      url: request.url(),
      error: request.failure()?.errorText || "failed",
      resourceType: request.resourceType(),
    };
    if (classifyKeytermFailedRequest(record, baseOrigin) === "superseded-frame-image") {
      diagnostics.supersededFrameRequests.push(record);
    } else {
      diagnostics.failedRequests.push({ url: record.url, error: record.error });
    }
  });
  page.on("response", (response) => {
    if (response.status() >= 400) diagnostics.httpErrors.push({ url: response.url(), status: response.status() });
  });
}

export function classifyKeytermFailedRequest(record, baseOrigin) {
  if (record?.error !== "net::ERR_ABORTED" || record?.resourceType !== "image") return "failure";
  try {
    const requestUrl = new URL(record.url);
    if (requestUrl.origin !== new URL(baseOrigin).origin) return "failure";
    return /^\/flash-assets\/keyterms\/acute-angle\/frames\/(?:[1-9]|[1-5][0-9]|60)\.png$/.test(requestUrl.pathname)
      ? "superseded-frame-image"
      : "failure";
  } catch {
    return "failure";
  }
}

export function isExactComputeReplayHoverAsset(url, baseOrigin) {
  try {
    const candidate = new URL(url);
    const expected = new URL(
      "/flash-assets/keyterms/computeghgh/buttons/over.svg",
      baseOrigin,
    );
    return candidate.origin === expected.origin
      && candidate.pathname === expected.pathname
      && candidate.search === ""
      && candidate.hash === "";
  } catch {
    return false;
  }
}

async function fileDescriptor(relativePath) {
  const bytes = await readFile(path.join(projectRoot, relativePath));
  return { path: relativePath, sha256: sha256(bytes), bytes: bytes.length };
}

export function buildKeytermQaIdentity(pilot, { purpose, frame, scenario, language, seed }) {
  const entryState = {
    kind: "keyterm-engineering-candidate-product-qa",
    animationId: pilot.animationId,
    purpose,
    frameDomain: "root",
    frame,
    scenario,
    language,
    seed,
  };
  return Object.freeze({
    frameDomain: "root",
    requirementId: `qa:keyterm:${pilot.animationId}:${purpose}:${scenario}:${language}`,
    traceId: `qa-trace:keyterm:${pilot.animationId}:${purpose}:${scenario}:${language}:seed-${seed}`,
    entryState,
    entryStateSha256: sha256(JSON.stringify(entryState)),
  });
}

function queryFor({ frame, scenario, language, seed, identity, capture = false }) {
  const query = new URLSearchParams({
    frameDomain: identity.frameDomain,
    requirementId: identity.requirementId,
    trace: identity.traceId,
    entryStateSha256: identity.entryStateSha256,
    scenario,
    lang: language,
    seed: String(seed),
  });
  if (frame !== undefined) query.set("frame", String(frame));
  if (capture) query.set("capture", "1");
  return query.toString();
}

async function readRuntimeState(page) {
  return page.evaluate(() => {
    const runtime = document.querySelector(".runtime-stage");
    const shell = document.querySelector(".runtime-shell");
    const candidate = document.querySelector(".faithful-stage-wrap");
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

function runtimeIdentityMatches(runtime, pilot, identity, scenario, language, seed) {
  return runtime?.animationId === pilot.animationId
    && runtime?.frameDomain === identity.frameDomain
    && runtime?.requirementId === identity.requirementId
    && runtime?.traceId === identity.traceId
    && runtime?.entryStateSha256 === identity.entryStateSha256
    && runtime?.scenario === scenario
    && runtime?.language === language
    && runtime?.seed === String(seed);
}

export function replayResetIdentityPass({ pilot, before, reset, resumed, identity, scenario, language, seed }) {
  return Boolean(
    before
      && reset
      && resumed
      && Number(before.runtime?.frame) > 2
      && before.runtime?.rootFrame === before.runtime?.frame
      && reset.replay === before.replay + 1
      && reset.runtime?.frame === "1"
      && reset.runtime?.rootFrame === "1"
      && reset.candidate?.frame === "1"
      && reset.candidate?.language === language
      && Number(resumed.runtime?.frame) >= 2
      && resumed.runtime?.rootFrame === resumed.runtime?.frame
      && resumed.candidate?.frame === resumed.runtime?.frame
      && resumed.candidate?.language === language
      && [before, reset, resumed].every((state) => runtimeIdentityMatches(
        state.runtime,
        pilot,
        identity,
        scenario,
        language,
        seed,
      )),
  );
}

export function allClaimsFalse(claims) {
  return Boolean(
    claims
      && JSON.stringify(Object.keys(claims)) === JSON.stringify(AUTHORITY_CLAIM_KEYS)
      && AUTHORITY_CLAIM_KEYS.every((key) => claims[key] === false),
  );
}

async function waitForRuntime(page) {
  await page.locator(".runtime-stage[data-flash-frame]").waitFor({ state: "visible" });
  await page.locator(".faithful-stage-wrap[data-flash-frame]").waitFor({ state: "visible" });
}

async function layoutSnapshot(page) {
  return page.evaluate(() => {
    const box = (element) => {
      if (!element) return null;
      const value = element.getBoundingClientRect();
      return { x: value.x, y: value.y, width: value.width, height: value.height, right: value.right, bottom: value.bottom };
    };
    const stage = document.querySelector(".faithful-stage-wrap");
    const buttons = [...document.querySelectorAll(".runtime-shell button")].map(box);
    return {
      viewport: { width: innerWidth, height: innerHeight },
      document: { scrollWidth: document.documentElement.scrollWidth, scrollHeight: document.documentElement.scrollHeight },
      shell: box(document.querySelector(".runtime-shell")),
      stage: box(stage),
      buttons,
      stageFrame: stage?.getAttribute("data-flash-frame") || null,
      runtimeIdentity: (() => {
        const runtime = document.querySelector(".runtime-stage");
        return {
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
        };
      })(),
      svgViewBox: document.querySelector(".faithful-stage")?.getAttribute("viewBox") || null,
    };
  });
}

function layoutPasses(layout) {
  const tolerance = 1;
  return Boolean(
    layout.stage
    && layout.document.scrollWidth <= layout.viewport.width + tolerance
    && layout.stage.x >= -tolerance
    && layout.stage.right <= layout.viewport.width + tolerance
    && Math.abs(layout.stage.width - layout.stage.height) <= tolerance
    && layout.buttons.every((button) => button && button.x >= -tolerance && button.right <= layout.viewport.width + tolerance),
  );
}

function replayButton(page, control) {
  return control === "stage"
    ? page.locator(".flash-replay")
    : page.locator(".runtime-toolbar__actions").getByRole("button", { name: "Replay", exact: true });
}

async function waitForFrameGreaterThan(page, threshold) {
  await page.waitForFunction((value) => Number(document.querySelector(".runtime-stage")?.getAttribute("data-flash-frame")) > value, threshold);
  return Number(await page.locator(".runtime-stage").getAttribute("data-flash-frame"));
}

async function activateReplay(browser, route, pilot, control, input, baseOrigin, diagnostics) {
  const context = await browser.newContext({ viewport: { width: 900, height: 700 }, reducedMotion: "no-preference" });
  const page = await context.newPage();
  monitorPage(page, baseOrigin, diagnostics);
  const scenario = "default";
  const language = "en";
  const seed = qaSeed;
  const identity = buildKeytermQaIdentity(pilot, {
    purpose: `replay-${control}-${input}`,
    frame: 1,
    scenario,
    language,
    seed,
  });
  await page.goto(`${route}?${queryFor({ scenario, language, seed, identity })}`, { waitUntil: "domcontentloaded" });
  await waitForRuntime(page);
  await waitForFrameGreaterThan(page, 2);
  const button = replayButton(page, control);
  const before = await readRuntimeState(page);
  await button.focus();
  if (input === "pointer") await button.click();
  else await button.press(input);
  await page.waitForFunction(({ replay }) => (
    Number(document.querySelector(".runtime-shell")?.getAttribute("data-runtime-replay")) === replay
      && document.querySelector(".runtime-stage")?.getAttribute("data-flash-frame") === "1"
      && document.querySelector(".faithful-stage-wrap")?.getAttribute("data-flash-frame") === "1"
  ), { replay: before.replay + 1 }, { timeout: 10_000 });
  const reset = await readRuntimeState(page);
  await page.waitForFunction(() => Number(document.querySelector(".runtime-stage")?.getAttribute("data-flash-frame")) >= 2);
  const resumed = await readRuntimeState(page);
  const accessibleName = ((await button.getAttribute("aria-label")) || (await button.textContent()) || "")
    .replace(/\s+/g, " ")
    .trim();
  const result = {
    control,
    input,
    accessibleName,
    identity,
    expectedContext: { scenario, language, seed },
    before,
    reset,
    resumed,
  };
  result.pass = Boolean(accessibleName) && replayResetIdentityPass({
    pilot,
    before,
    reset,
    resumed,
    identity,
    scenario,
    language,
    seed,
  });
  await context.close();
  return result;
}

async function observeLoopBoundary(page, frameCount) {
  await page.evaluate(() => {
    const stage = document.querySelector(".runtime-stage");
    if (!stage) throw new Error("runtime stage is missing");
    const observed = [Number(stage.getAttribute("data-flash-frame"))];
    const observer = new MutationObserver(() => {
      const frame = Number(stage.getAttribute("data-flash-frame"));
      if (observed.at(-1) !== frame) observed.push(frame);
    });
    observer.observe(stage, { attributes: true, attributeFilter: ["data-flash-frame"] });
    window.__helpMathLoopObservation = { observed, observer };
  });
  await page.waitForFunction((lastFrame) => {
    const observed = window.__helpMathLoopObservation?.observed || [];
    return observed.some((frame, index) => frame === lastFrame && observed[index + 1] === 1 && observed[index + 2] === 2);
  }, frameCount, { timeout: 10_000 });
  return page.evaluate((lastFrame) => {
    const observation = window.__helpMathLoopObservation;
    observation?.observer.disconnect();
    const observed = observation?.observed || [];
    const boundaryIndex = observed.findIndex((frame, index) => frame === lastFrame && observed[index + 1] === 1 && observed[index + 2] === 2);
    return {
      observed,
      boundary: boundaryIndex < 0 ? [] : observed.slice(boundaryIndex, boundaryIndex + 3),
      pass: boundaryIndex >= 0,
    };
  }, frameCount);
}

async function runPilot(browser, baseUrl, pilot) {
  const baseOrigin = new URL(baseUrl).origin;
  const diagnostics = {
    consoleErrors: [],
    pageErrors: [],
    failedRequests: [],
    supersededFrameRequests: [],
    httpErrors: [],
    unexpectedRequests: [],
    audioRequests: [],
  };
  const assertions = [];
  const screenshots = {};
  const route = `${baseUrl}/animations/${pilot.animationId}`;
  const manifestPath = path.join(projectRoot, "migrations", pilot.animationId, "migration.json");
  const migrationBefore = JSON.parse(await readFile(manifestPath, "utf8"));
  const source = await fileDescriptor(pilot.source.path);
  if (source.sha256 !== pilot.source.sha256) {
    throw new Error(`${pilot.animationId} source SHA-256 differs from the frozen evidence`);
  }
  const generatedBy = {
    script: portable(scriptPath),
    scriptSha256: sha256(await readFile(scriptPath)),
    deterministic: false,
  };
  const implementation = await Promise.all([
    fileDescriptor(pilot.modulePath),
    fileDescriptor(pilot.timelinePath),
    fileDescriptor("packages/demos/tests/keyterm-pilots.test.ts"),
    fileDescriptor("apps/web/components/animation-runtime.tsx"),
    fileDescriptor("scripts/qa-keyterm-pilots.test.mjs"),
  ]);
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: "no-preference" });
  const page = await context.newPage();
  monitorPage(page, baseOrigin, diagnostics);

  const responsive = [];
  for (const viewport of [
    { id: "desktop", width: 1440, height: 1000 },
    { id: "tablet", width: 768, height: 1024 },
    { id: "mobile", width: 390, height: 844 },
  ]) {
    const scenario = "default";
    const language = "es";
    const seed = 0;
    const frame = pilot.frameCount;
    const identity = buildKeytermQaIdentity(pilot, {
      purpose: `responsive-${viewport.id}`,
      frame,
      scenario,
      language,
      seed,
    });
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto(`${route}?${queryFor({ frame, scenario, language, seed, identity })}`, { waitUntil: "networkidle" });
    await waitForRuntime(page);
    const layout = await layoutSnapshot(page);
    const file = path.join(screenshotRoot, pilot.animationId, `${viewport.id}-es-terminal.png`);
    screenshots[viewport.id] = await screenshot(page, null, file, { fullPage: true });
    const identityMatched = runtimeIdentityMatches(layout.runtimeIdentity, pilot, identity, scenario, language, seed)
      && layout.runtimeIdentity.frame === String(frame)
      && layout.runtimeIdentity.rootFrame === String(frame)
      && layout.stageFrame === String(frame);
    responsive.push({
      ...viewport,
      requested: { frame, scenario, language, seed, ...identity },
      layout,
      screenshot: screenshots[viewport.id],
      identityMatched,
      pass: layoutPasses(layout) && identityMatched,
    });
  }

  const frozenBefore = await readRuntimeState(page);
  await page.waitForTimeout(350);
  const frozenAfter = await readRuntimeState(page);
  const deterministicFrameFreeze = {
    requested: pilot.frameCount,
    before: frozenBefore,
    after: frozenAfter,
    waitedMs: 350,
    pass: frozenBefore.runtime.frame === String(pilot.frameCount)
      && frozenAfter.runtime.frame === String(pilot.frameCount)
      && frozenBefore.runtime.frameDomain === "root"
      && frozenAfter.runtime.frameDomain === "root"
      && frozenBefore.runtime.requirementId === frozenAfter.runtime.requirementId
      && frozenBefore.runtime.traceId === frozenAfter.runtime.traceId
      && frozenBefore.runtime.entryStateSha256 === frozenAfter.runtime.entryStateSha256,
  };

  const nativeScenario = "default";
  const nativeLanguage = "en";
  const nativeSeed = 0;
  const nativeFrame = 1;
  const nativeIdentity = buildKeytermQaIdentity(pilot, {
    purpose: "native-stage",
    frame: nativeFrame,
    scenario: nativeScenario,
    language: nativeLanguage,
    seed: nativeSeed,
  });
  await page.setViewportSize({ width: pilot.stage.width, height: pilot.stage.height });
  await page.goto(`${route}?${queryFor({
    frame: nativeFrame,
    scenario: nativeScenario,
    language: nativeLanguage,
    seed: nativeSeed,
    identity: nativeIdentity,
    capture: true,
  })}`, { waitUntil: "networkidle" });
  await waitForRuntime(page);
  const nativeState = await readRuntimeState(page);
  screenshots.native = await screenshot(page, page.locator(".faithful-stage-wrap"), path.join(screenshotRoot, pilot.animationId, "native-frame-0001.png"));
  const nativePass = screenshots.native.width === pilot.stage.width
    && screenshots.native.height === pilot.stage.height
    && nativeState.runtime.frame === "1"
    && nativeState.runtime.rootFrame === "1"
    && runtimeIdentityMatches(nativeState.runtime, pilot, nativeIdentity, nativeScenario, nativeLanguage, nativeSeed);

  const assetChecks = [];
  for (const asset of pilot.assets) {
    const response = await context.request.get(`${baseUrl}${asset}`);
    const bytes = await response.body();
    assetChecks.push({ path: asset, status: response.status(), contentType: response.headers()["content-type"] || null, bytes: bytes.length, sha256: sha256(bytes) });
  }

  const playbackScenario = "default";
  const playbackLanguage = "en";
  const playbackSeed = 0;
  const playbackIdentity = buildKeytermQaIdentity(pilot, {
    purpose: "natural-playback-engineering-check",
    frame: 1,
    scenario: playbackScenario,
    language: playbackLanguage,
    seed: playbackSeed,
  });
  await page.setViewportSize({ width: 900, height: 700 });
  await page.goto(`${route}?${queryFor({
    scenario: playbackScenario,
    language: playbackLanguage,
    seed: playbackSeed,
    identity: playbackIdentity,
  })}`, { waitUntil: "networkidle" });
  await waitForRuntime(page);
  const playbackBoundary = pilot.playbackMode === "loop"
    ? await observeLoopBoundary(page, pilot.frameCount)
    : null;
  if (pilot.playbackMode === "once") {
    await page.waitForFunction((last) => document.querySelector(".runtime-stage")?.getAttribute("data-flash-frame") === String(last), pilot.frameCount, { timeout: 10_000 });
  }
  const terminal = pilot.playbackMode === "once"
    ? Number(await page.locator(".runtime-stage").getAttribute("data-flash-frame"))
    : null;
  const replay = [];
  const replayControls = pilot.replay === "stage" ? ["host", "stage"] : ["host"];
  for (const control of replayControls) {
    for (const input of ["pointer", "Enter", "Space"]) {
      replay.push(await activateReplay(browser, route, pilot, control, input, baseOrigin, diagnostics));
    }
  }

  let replayVisualStates = null;
  if (pilot.replay === "stage") {
    const frame = pilot.frameCount;
    const scenario = "default";
    const language = "en";
    const seed = 0;
    const identity = buildKeytermQaIdentity(pilot, {
      purpose: "replay-pointer-visual-state",
      frame,
      scenario,
      language,
      seed,
    });
    await page.goto(`${route}?${queryFor({ frame, scenario, language, seed, identity })}`, { waitUntil: "networkidle" });
    await waitForRuntime(page);
    const button = replayButton(page, "stage");
    const hoverAssetResponse = page.waitForResponse(
      (response) => response.status() === 200
        && isExactComputeReplayHoverAsset(response.url(), baseOrigin),
      { timeout: 10_000 },
    );
    await button.hover();
    await hoverAssetResponse;
    const hover = await page.locator(".faithful-stage-wrap").getAttribute("data-replay-state");
    await button.dispatchEvent("pointerdown", { button: 0, pointerType: "mouse" });
    const pressed = await page.locator(".faithful-stage-wrap").getAttribute("data-replay-state");
    screenshots.replayPressed = await screenshot(page, page.locator(".faithful-stage-wrap"), path.join(screenshotRoot, pilot.animationId, "replay-pressed.png"));
    await button.dispatchEvent("pointerup", { button: 0, pointerType: "mouse" });
    replayVisualStates = { hover, pressed, pass: hover === "over" && pressed === "down", screenshot: screenshots.replayPressed };
  }

  const englishStageName = await page.locator(".faithful-stage").getAttribute("aria-labelledby");
  const englishReplayNames = [];
  for (const control of replayControls) {
    const button = replayButton(page, control);
    englishReplayNames.push({ control, name: (await button.getAttribute("aria-label")) || (await button.textContent()) });
  }
  const spanishScenario = "default";
  const spanishLanguage = "es";
  const spanishSeed = 0;
  const spanishFrame = 1;
  const spanishIdentity = buildKeytermQaIdentity(pilot, {
    purpose: "localization-plumbing",
    frame: spanishFrame,
    scenario: spanishScenario,
    language: spanishLanguage,
    seed: spanishSeed,
  });
  await page.goto(`${route}?${queryFor({
    frame: spanishFrame,
    scenario: spanishScenario,
    language: spanishLanguage,
    seed: spanishSeed,
    identity: spanishIdentity,
  })}`, { waitUntil: "networkidle" });
  await waitForRuntime(page);
  const spanishState = await readRuntimeState(page);
  const spanishStageName = await page.locator(".faithful-stage").getAttribute("aria-labelledby");
  const spanishReplayNames = [];
  for (const control of replayControls) {
    const button = replayButton(page, control);
    spanishReplayNames.push({ control, name: (await button.getAttribute("aria-label")) || (await button.textContent()) });
  }

  await context.close();

  const reducedContext = await browser.newContext({ viewport: { width: 900, height: 700 }, reducedMotion: "reduce" });
  const reducedPage = await reducedContext.newPage();
  monitorPage(reducedPage, baseOrigin, diagnostics);
  const reducedScenario = "default";
  const reducedLanguage = "en";
  const reducedSeed = 0;
  const reducedIdentity = buildKeytermQaIdentity(pilot, {
    purpose: "reduced-motion",
    frame: 1,
    scenario: reducedScenario,
    language: reducedLanguage,
    seed: reducedSeed,
  });
  await reducedPage.goto(`${route}?${queryFor({
    scenario: reducedScenario,
    language: reducedLanguage,
    seed: reducedSeed,
    identity: reducedIdentity,
  })}`, { waitUntil: "networkidle" });
  await waitForRuntime(reducedPage);
  await reducedPage.waitForTimeout(250);
  const reducedState = await readRuntimeState(reducedPage);
  screenshots.reducedMotion = await screenshot(
    reducedPage,
    null,
    path.join(screenshotRoot, pilot.animationId, "reduced-motion-en.png"),
    { fullPage: true },
  );
  const reducedMotion = {
    requested: { scenario: reducedScenario, language: reducedLanguage, seed: reducedSeed, ...reducedIdentity },
    state: reducedState,
    noteVisible: await reducedPage.locator(".reduced-motion-note").isVisible(),
    capture: screenshots.reducedMotion,
  };
  reducedMotion.pass = reducedState.runtime.frame === "1"
    && reducedState.runtime.rootFrame === "1"
    && runtimeIdentityMatches(reducedState.runtime, pilot, reducedIdentity, reducedScenario, reducedLanguage, reducedSeed)
    && reducedMotion.noteVisible;
  await reducedContext.close();

  const captureRecords = Object.values(screenshots).filter((value) => value && typeof value === "object" && value.devOverlaySuppression);
  const overlayPass = captureRecords.length >= 5 && captureRecords.every(({ devOverlaySuppression }) => devOverlaySuppressionPass(devOverlaySuppression));
  const migrationAfter = JSON.parse(await readFile(manifestPath, "utf8"));
  const migrationStatusChanged = migrationBefore.status !== migrationAfter.status;
  const claims = Object.fromEntries(AUTHORITY_CLAIM_KEYS.map((key) => [key, false]));
  const authorityBoundary = {
    authoritativeAudioListening: false,
    audioSynchronization: false,
    originalRuntimeBaselineApproval: false,
    originalRuntimeNaturalTraversal: false,
    bilingualSourceParity: false,
    rmseAcceptance: false,
    humanVisualReview: false,
    ownerAcceptance: false,
    strictMigrationCompletion: false,
  };

  assertions.push(
    { id: "source-sha256", pass: source.sha256 === pilot.source.sha256, details: { ...source, expectedSha256: pilot.source.sha256 } },
    { id: "migration-status-unchanged", pass: !migrationStatusChanged, details: { before: migrationBefore.status, after: migrationAfter.status } },
    { id: "native-stage", pass: nativePass, details: screenshots.native },
    ...responsive.map((item) => ({ id: `responsive-${item.id}`, pass: item.pass, details: item.layout })),
    { id: "asset-loads", pass: assetChecks.every((item) => item.status === 200 && item.bytes > 0), details: assetChecks },
    { id: "deterministic-frame-freeze", pass: deterministicFrameFreeze.pass, details: deterministicFrameFreeze },
    { id: "source-playback-loop", pass: pilot.playbackMode !== "loop" || playbackBoundary?.pass === true, details: { playbackMode: pilot.playbackMode, playbackBoundary } },
    ...replay.map((item) => ({ id: `replay-${item.control}-${item.input.toLowerCase()}`, pass: item.pass, details: item })),
    { id: "completion-terminal-state", pass: pilot.playbackMode === "loop" ? playbackBoundary?.pass === true : terminal === pilot.frameCount, details: { playbackMode: pilot.playbackMode, terminal, expected: pilot.frameCount, loopBoundary: playbackBoundary?.boundary || null } },
    { id: "replay-visual-states", pass: replayVisualStates?.pass !== false, details: replayVisualStates },
    { id: "reduced-motion", pass: reducedMotion.pass, details: reducedMotion },
    { id: "accessible-names", pass: Boolean(englishStageName && spanishStageName && englishReplayNames.every(({ name }) => name) && spanishReplayNames.every(({ name }) => name)), details: { englishStageName, spanishStageName, englishReplayNames, spanishReplayNames } },
    { id: "localization", pass: spanishState.runtime.language === "es" && spanishState.candidate.language === "es" && runtimeIdentityMatches(spanishState.runtime, pilot, spanishIdentity, spanishScenario, spanishLanguage, spanishSeed), details: spanishState },
    { id: "console-errors", pass: diagnostics.consoleErrors.length === 0 && diagnostics.pageErrors.length === 0, details: { consoleErrors: diagnostics.consoleErrors, pageErrors: diagnostics.pageErrors } },
    { id: "failed-requests", pass: diagnostics.failedRequests.length === 0 && diagnostics.httpErrors.length === 0, details: { failedRequests: diagnostics.failedRequests, supersededFrameRequests: diagnostics.supersededFrameRequests, httpErrors: diagnostics.httpErrors } },
    { id: "unexpected-network", pass: diagnostics.unexpectedRequests.length === 0, details: diagnostics.unexpectedRequests },
    { id: "replay-reset-frame-state-audio", pass: replay.every(({ pass }) => pass) && diagnostics.audioRequests.length === 0, details: { replay, audioRequests: diagnostics.audioRequests, boundary: "No candidate audio is connected; authoritative host audio remains a separate blocked gate." } },
    { id: "next-dev-overlay-suppressed-before-and-after-every-screenshot", pass: overlayPass, details: { captureCount: captureRecords.length, captures: captureRecords.map(({ path, sha256: captureSha256, devOverlaySuppression }) => ({ path, sha256: captureSha256, devOverlaySuppression })) } },
    { id: "authority-boundary-fail-closed", pass: allClaimsFalse(claims) && Object.values(authorityBoundary).every((value) => value === false), details: { claims, authorityBoundary } },
  );

  const status = assertions.every(({ pass }) => pass) ? "pass" : "fail";
  return {
    schemaVersion: 2,
    evidenceKind: "keyterm-engineering-candidate-product-qa",
    animationId: pilot.animationId,
    generatedAt: new Date().toISOString(),
    generatedBy,
    status,
    acceptanceEffect: "none",
    strictAcceptanceEffect: false,
    migrationStatusBefore: migrationBefore.status,
    migrationStatusAfter: migrationAfter.status,
    migrationStatusChanged,
    source: { ...source, expectedSha256: pilot.source.sha256 },
    implementation,
    route: `/animations/${pilot.animationId}`,
    browser: { engine: "Chromium", version: browser.version(), headless: true, deviceScaleFactor: 1, baseUrl },
    scope: {
      evidenceClass: "candidate/engineering only",
      included: "Modern Next.js key-term stage, candidate playback boundary, complete deterministic runtime identity, Replay reset/resume, responsive layout, reduced motion, localization plumbing, asset, console, network, and screenshot-overlay QA.",
      excluded: "Authoritative original-runtime traversal, original-host audio listening/synchronization, missing Spanish audio recovery, authoritative RMSE acceptance, human visual review, and owner acceptance.",
    },
    scenario: "default",
    languages: ["en", "es"],
    playbackMode: pilot.playbackMode,
    responsive,
    screenshots,
    assetChecks,
    behavior: { terminal, playbackBoundary, deterministicFrameFreeze, replay, replayVisualStates },
    localization: { englishStageName, spanishStageName, englishReplayNames, spanishReplayNames, spanishState },
    reducedMotion,
    diagnostics,
    assertions,
    claims,
    authorityBoundary,
  };
}

function evidence(pathValue, digest) {
  return [{ path: pathValue, sha256: digest }];
}

function check(id, result, evidenceItems, reason) {
  return { id, result, ...(reason ? { reason } : {}), evidence: evidenceItems };
}

async function writeQaRecords(report) {
  const workspace = path.join(projectRoot, "migrations", report.animationId);
  const artifactPath = path.join(workspace, "evidence", "keyterm-engineering-qa.json");
  const artifactBytes = Buffer.from(`${JSON.stringify(report, null, 2)}\n`);
  await writeFile(artifactPath, artifactBytes);
  const artifactEvidence = evidence("evidence/keyterm-engineering-qa.json", sha256(artifactBytes));
  const screenshotEvidence = (id) => evidence(report.screenshots[id].path, report.screenshots[id].sha256);
  const status = report.status;
  const qaResult = status === "pass" ? "pass" : "fail";
  const behavior = {
    schemaVersion: 1,
    animationId: report.animationId,
    generatedAt: report.generatedAt,
    status,
    acceptanceEffect: "none",
    strictAcceptanceEffect: false,
    scenarios: ["default"],
    checks: [
      check("replay-mouse", qaResult, artifactEvidence),
      check("replay-enter", qaResult, artifactEvidence),
      check("replay-space", qaResult, artifactEvidence),
      check("replay-reset-frame-state-audio", qaResult, artifactEvidence),
      check("source-playback-loop", report.playbackMode === "loop" ? qaResult : "not-required", artifactEvidence, report.playbackMode === "loop" ? undefined : "The audited source movie stops at its terminal frame."),
      check("all-reachable-branches", qaResult, artifactEvidence),
      check("interaction-input-scoring", "not-required", artifactEvidence, "The source key-term movie has no answer input, score, or grading branch."),
      check("completion-terminal-state", qaResult, artifactEvidence),
      check("random-seeded-outcomes", "not-required", artifactEvidence, "The audited source key-term movie has no random operation."),
    ],
    claims: report.claims,
    authorityBoundary: report.authorityBoundary,
  };
  const product = {
    schemaVersion: 1,
    animationId: report.animationId,
    generatedAt: report.generatedAt,
    status,
    acceptanceEffect: "none",
    strictAcceptanceEffect: false,
    checks: [
      check("native-stage", qaResult, screenshotEvidence("native")),
      check("desktop", qaResult, screenshotEvidence("desktop")),
      check("tablet", qaResult, screenshotEvidence("tablet")),
      check("mobile", qaResult, screenshotEvidence("mobile")),
      check("keyboard-focus", qaResult, artifactEvidence),
      check("accessible-names", qaResult, artifactEvidence),
      check("reduced-motion", qaResult, [...screenshotEvidence("reducedMotion"), ...artifactEvidence]),
      check("text-overflow", qaResult, artifactEvidence),
      check("localization", qaResult, artifactEvidence),
      check("console-errors", qaResult, artifactEvidence),
      check("asset-loads", qaResult, artifactEvidence),
      check("unexpected-network", qaResult, artifactEvidence),
      check("next-dev-overlay-suppressed", qaResult, artifactEvidence),
    ],
    claims: report.claims,
    authorityBoundary: report.authorityBoundary,
  };
  await writeFile(path.join(workspace, "evidence", "behavior-qa.json"), `${JSON.stringify(behavior, null, 2)}\n`);
  await writeFile(path.join(workspace, "evidence", "product-qa.json"), `${JSON.stringify(product, null, 2)}\n`);
  return { artifactPath, behavior, product };
}

export async function qaKeytermPilots({ baseUrl = defaultBaseUrl, ids = [] } = {}) {
  baseUrl = normalizeLoopbackBaseUrl(baseUrl);
  const selected = ids.length ? pilots.filter((pilot) => ids.includes(pilot.animationId)) : pilots;
  const unknown = ids.filter((id) => !pilots.some((pilot) => pilot.animationId === id));
  if (unknown.length) throw new Error(`Unknown key-term pilot id: ${unknown.join(", ")}`);
  const browser = await chromium.launch({ headless: true });
  const results = [];
  try {
    for (const pilot of selected) {
      const report = await runPilot(browser, baseUrl, pilot);
      await writeQaRecords(report);
      results.push(report);
    }
  } finally {
    await browser.close();
  }
  return results;
}

async function main() {
  try {
    const options = parseArguments(process.argv.slice(2));
    if (options.help) {
      console.log(usage());
      return;
    }
    const results = await qaKeytermPilots(options);
    for (const result of results) console.log(`${result.status.toUpperCase()} ${result.animationId}: ${result.assertions.filter(({ pass }) => pass).length}/${result.assertions.length} engineering assertions`);
    if (results.some(({ status }) => status !== "pass")) process.exitCode = 1;
  } catch (error) {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) await main();
