#!/usr/bin/env node

import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { chromium } from "playwright";
import { PNG } from "pngjs";

import {
  devOverlaySuppressionPass,
  finalizeNextDevOverlayCapture,
  suppressNextDevOverlayForCapture,
} from "./qa-next-dev-overlay.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");
const animationId = "course-g04-l03-in-009";
const sourceSha256 = "766b6ab686bbaf8ab1dacc30a7ffb96f33735102a1dff7df6b7a97976e3ab25c";
const defaultBaseUrl = "http://localhost:3213";
const evidenceRoot = path.join(projectRoot, "migrations", animationId, "evidence");
const screenshotRoot = path.join(projectRoot, "output", "playwright", `${animationId}-candidate-qa`);
const overlayHelperPath = path.join(projectRoot, "scripts", "qa-next-dev-overlay.mjs");
const implementationPaths = Object.freeze({
  module: path.join(projectRoot, "packages", "demos", "src", "modules", `${animationId}.tsx`),
  timeline: path.join(projectRoot, "packages", "demos", "src", "timelines", `${animationId}.ts`),
  test: path.join(projectRoot, "packages", "demos", "tests", `${animationId}.test.ts`),
  candidateSpec: path.join(projectRoot, "migrations", animationId, "audit", "canvas-candidate-spec.json"),
  candidateGenerator: path.join(projectRoot, "scripts", "build-in-009-ffdec-canvas-candidate.mjs"),
  ownerHostLocalizationContract: path.join(
    projectRoot,
    "migrations",
    animationId,
    "audit",
    "owner-host-localization-interaction-contract.json",
  ),
});
const deterministicCaptureManifest = path.join(
  projectRoot,
  "output",
  "playwright",
  `${animationId}-mask-fixed`,
  "capture-manifest.json",
);
const traceSpecRoot = path.join(
  projectRoot,
  "migrations",
  animationId,
  "audit",
  "trace-specs",
);

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function portable(filePath) {
  return path.relative(projectRoot, filePath).split(path.sep).join("/");
}

async function loadTraceIdentity(filename) {
  const absolutePath = path.join(traceSpecRoot, filename);
  const bytes = await readFile(absolutePath);
  const spec = JSON.parse(bytes);
  if (spec.animationId !== animationId) throw new Error(`${filename}: animationId mismatch`);
  if (!spec.requirementId || !spec.identity?.traceId || !spec.identity?.entryStateSha256) {
    throw new Error(`${filename}: incomplete trace identity`);
  }
  return {
    path: portable(absolutePath),
    sha256: sha256(bytes),
    requirementId: spec.requirementId,
    frameDomain: spec.identity.frameDomainId,
    traceId: spec.identity.traceId,
    entryStateSha256: spec.identity.entryStateSha256,
    scenario: spec.identity.scenario,
    lang: spec.identity.language,
    seed: Number(spec.identity.seed),
    firstFrame: spec.identity.requiredRange.firstFrame,
    lastFrame: spec.identity.requiredRange.lastFrame,
  };
}

function captureUrl(route, frame, identity, capture = true) {
  const query = new URLSearchParams({
    frame: String(frame),
    frameDomain: identity.frameDomain,
    scenario: identity.scenario,
    lang: identity.lang,
    seed: String(identity.seed),
    requirementId: identity.requirementId,
    trace: identity.traceId,
    entryStateSha256: identity.entryStateSha256,
  });
  if (capture) query.set("capture", "1");
  return `${route}?${query}`;
}

function runtimeIdentityMatches(state, frame, identity) {
  return state.runtimeFrame === String(frame)
    && state.rendererFrame === String(frame)
    && state.canvasFrame === String(frame)
    && state.runtimeFrameDomain === identity.frameDomain
    && state.frameDomain === identity.frameDomain
    && state.requirementId === identity.requirementId
    && state.traceId === identity.traceId
    && state.entryStateSha256 === identity.entryStateSha256
    && state.runtimeScenario === identity.scenario
    && state.scenario === identity.scenario
    && state.runtimeLanguage === identity.lang
    && state.language === identity.lang
    && state.runtimeSeed === String(identity.seed)
    && state.seed === String(identity.seed);
}

function blockedRuntimeIdentityMatches(state, frame, identity) {
  return state.runtimeFrame === String(frame)
    && state.rendererFrame === String(frame)
    && state.runtimeFrameDomain === identity.frameDomain
    && state.requirementId === identity.requirementId
    && state.traceId === identity.traceId
    && state.entryStateSha256 === identity.entryStateSha256
    && state.runtimeScenario === identity.scenario
    && state.scenario === identity.scenario
    && state.runtimeLanguage === identity.lang
    && state.language === identity.lang
    && state.runtimeSeed === String(identity.seed)
    && state.seed === String(identity.seed);
}

function normalizedPngRmse(referenceBytes, candidateBytes) {
  const reference = PNG.sync.read(referenceBytes);
  const candidate = PNG.sync.read(candidateBytes);
  if (reference.width !== candidate.width || reference.height !== candidate.height) {
    throw new Error("root pixel comparison dimensions differ");
  }
  let squared = 0;
  for (let index = 0; index < reference.data.length; index += 1) {
    const delta = reference.data[index] - candidate.data[index];
    squared += delta * delta;
  }
  return Math.sqrt(squared / reference.data.length) / 255;
}

function parseArguments(argv) {
  const options = { baseUrl: defaultBaseUrl };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--base-url") {
      if (!argv[index + 1]) throw new Error("--base-url requires a value");
      options.baseUrl = argv[index + 1];
      index += 1;
    } else if (value === "--help" || value === "-h") options.help = true;
    else throw new Error(`Unknown option: ${value}`);
  }
  return options;
}

function usage() {
  return "Usage: node scripts/qa-in-009-canvas-candidate.mjs [--base-url http://localhost:3213]";
}

function monitorPage(page, expectedOrigin, diagnostics) {
  const expected = new URL(expectedOrigin);
  const expectedEndpoint = `${expected.hostname}:${expected.port || (expected.protocol === "https:" ? "443" : "80")}`;
  page.on("console", (message) => {
    if (message.type() === "error") diagnostics.consoleErrors.push({ url: page.url(), text: message.text() });
    if (message.type() === "warning") diagnostics.consoleWarnings.push({ url: page.url(), text: message.text() });
  });
  page.on("pageerror", (error) => diagnostics.pageErrors.push({ url: page.url(), text: error.message }));
  page.on("request", (request) => {
    const url = request.url();
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
    diagnostics.failedRequests.push({ url: request.url(), error: request.failure()?.errorText || "failed" });
  });
  page.on("response", (response) => {
    if (response.status() >= 400) diagnostics.httpErrors.push({ url: response.url(), status: response.status() });
  });
}

async function screenshot(page, locator, destination, options = {}) {
  const devOverlaySuppression = await suppressNextDevOverlayForCapture(page, sha256);
  await mkdir(path.dirname(destination), { recursive: true });
  if (locator) await locator.screenshot({ path: destination, animations: "disabled" });
  else await page.screenshot({ path: destination, animations: "disabled", fullPage: options.fullPage ?? false });
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

async function waitForReadyStage(page, expectedFrame = null) {
  const canvas = page.locator("canvas.faithful-stage-wrap").first();
  await canvas.waitFor({ state: "visible", timeout: 30_000 });
  await page.waitForFunction(
    (frame) => {
      const stage = document.querySelector("[data-candidate-status='engineering-not-strict']");
      const target = document.querySelector("canvas.faithful-stage-wrap");
      return stage?.getAttribute("data-canvas-status") === "ready"
        && (frame === null || target?.getAttribute("data-flash-frame") === String(frame));
    },
    expectedFrame,
    { timeout: 30_000 },
  );
  return canvas;
}

async function readStageState(page) {
  return page.evaluate(() => {
    const runtime = document.querySelector(".runtime-stage");
    const candidate = document.querySelector("[data-candidate-status='engineering-not-strict']");
    const canvas = document.querySelector("canvas.faithful-stage-wrap");
    const rect = canvas?.getBoundingClientRect();
    return {
      runtimeFrame: runtime?.getAttribute("data-flash-frame") || null,
      runtimeFrameDomain: runtime?.getAttribute("data-flash-frame-domain") || null,
      runtimeRootFrame: runtime?.getAttribute("data-flash-root-frame") || null,
      requirementId: runtime?.getAttribute("data-flash-requirement-id") || null,
      traceId: runtime?.getAttribute("data-flash-trace-id") || null,
      entryStateSha256: runtime?.getAttribute("data-flash-entry-state-sha256") || null,
      runtimeScenario: runtime?.getAttribute("data-runtime-scenario") || null,
      runtimeLanguage: runtime?.getAttribute("data-runtime-language") || null,
      runtimeSeed: runtime?.getAttribute("data-runtime-seed") || null,
      rendererFrame: candidate?.getAttribute("data-flash-frame") || null,
      canvasFrame: canvas?.getAttribute("data-flash-frame") || null,
      frameDomain: canvas?.getAttribute("data-flash-frame-domain")
        || candidate?.getAttribute("data-flash-frame-domain") || null,
      rootFrame: canvas?.getAttribute("data-flash-root-frame")
        || candidate?.getAttribute("data-flash-root-frame") || null,
      scenario: canvas?.getAttribute("data-runtime-scenario")
        || candidate?.getAttribute("data-runtime-scenario") || null,
      language: canvas?.getAttribute("data-runtime-language")
        || candidate?.getAttribute("data-runtime-language") || null,
      seed: canvas?.getAttribute("data-runtime-seed")
        || candidate?.getAttribute("data-runtime-seed") || null,
      canvasStatus: candidate?.getAttribute("data-canvas-status") || null,
      candidateVisualLocalizationStatus:
        candidate?.getAttribute("data-visual-localization-status") || null,
      candidateSpanishAudioStatus:
        candidate?.getAttribute("data-spanish-audio-status") || null,
      candidateAudioRendered:
        candidate?.getAttribute("data-audio-rendered") || null,
      canvasVisualLocalizationStatus:
        canvas?.getAttribute("data-visual-localization-status") || null,
      canvasAudioLocalizationStatus:
        canvas?.getAttribute("data-audio-localization-status") || null,
      canvasAudioRendered:
        canvas?.getAttribute("data-audio-rendered") || null,
      nativePixels: canvas ? { width: canvas.width, height: canvas.height } : null,
      layout: rect ? { x: rect.x, right: rect.right, width: rect.width, height: rect.height } : null,
      document: {
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
      },
    };
  });
}

async function deterministicCase(page, route, frame, identity, screenshotName) {
  await page.goto(captureUrl(route, frame, identity), {
    waitUntil: "networkidle",
  });
  const canvas = await waitForReadyStage(page, frame);
  const before = await readStageState(page);
  await page.waitForTimeout(300);
  const after = await readStageState(page);
  const capture = await screenshot(page, canvas, path.join(screenshotRoot, screenshotName));
  return {
    requestedFrame: frame,
    requestedIdentity: identity,
    before,
    after,
    frozen: runtimeIdentityMatches(before, frame, identity)
      && runtimeIdentityMatches(after, frame, identity),
    capture,
  };
}

async function activateReplay(page, route, input) {
  await page.goto(`${route}?frameDomain=sprite-200&scenario=default&lang=en&seed=0`, { waitUntil: "networkidle" });
  await waitForReadyStage(page);
  await page.waitForFunction(
    () => Number(document.querySelector(".runtime-stage")?.getAttribute("data-flash-frame")) >= 4,
    undefined,
    { timeout: 30_000 },
  );
  const button = page.locator(".runtime-toolbar__actions").getByRole("button", { name: "Replay", exact: true });
  const before = await page.evaluate(() => ({
    replay: Number(document.querySelector(".runtime-shell")?.getAttribute("data-runtime-replay")),
    frame: Number(document.querySelector(".runtime-stage")?.getAttribute("data-flash-frame")),
  }));
  await button.focus();
  if (input === "mouse") await button.click();
  else await page.keyboard.press(input === "enter" ? "Enter" : "Space");
  await page.waitForFunction(
    (expectedReplay) => Number(document.querySelector(".runtime-shell")?.getAttribute("data-runtime-replay")) === expectedReplay
      && document.querySelector(".runtime-stage")?.getAttribute("data-flash-frame") === "1",
    before.replay + 1,
    { timeout: 10_000 },
  );
  const reset = await page.evaluate(() => ({
    replay: Number(document.querySelector(".runtime-shell")?.getAttribute("data-runtime-replay")),
    frame: Number(document.querySelector(".runtime-stage")?.getAttribute("data-flash-frame")),
  }));
  await page.waitForFunction(
    () => Number(document.querySelector(".runtime-stage")?.getAttribute("data-flash-frame")) >= 2,
    undefined,
    { timeout: 10_000 },
  );
  const resumedFrame = Number(await page.locator(".runtime-stage").getAttribute("data-flash-frame"));
  return {
    input,
    before,
    reset,
    resumedFrame,
    accessibleName: (await button.getAttribute("aria-label")) || (await button.textContent()),
    pass: reset.replay === before.replay + 1 && reset.frame === 1 && resumedFrame >= 2,
    claim: "modern-candidate-host-reset-only",
    sourceReplaySemanticsClaimed: false,
  };
}

async function blockedCase(page, route, {
  frame = 637,
  frameDomain = "sprite-200",
  lang = "en",
  scenario,
  reason,
  identity = null,
}) {
  const destination = identity
    ? captureUrl(route, frame, identity)
    : `${route}?frame=${frame}&frameDomain=${frameDomain}&scenario=${scenario}&lang=${lang}&seed=0&capture=1`;
  await page.goto(destination, {
    waitUntil: "networkidle",
  });
  const blocked = page.locator(`[data-fail-closed-reason='${reason}']`);
  await blocked.waitFor({ state: "visible" });
  const state = await readStageState(page);
  return {
    frame,
    frameDomain: identity?.frameDomain ?? frameDomain,
    lang: identity?.lang ?? lang,
    scenario: identity?.scenario ?? scenario,
    reason: await blocked.getAttribute("data-fail-closed-reason"),
    canvasCount: await page.locator("canvas.faithful-stage-wrap").count(),
    runtimeFrame: await page.locator(".runtime-stage").getAttribute("data-flash-frame"),
    candidateStatus: await page.locator("[data-candidate-status='engineering-not-strict']").getAttribute("data-canvas-status"),
    text: (await blocked.textContent())?.replace(/\s+/g, " ").trim() || "",
    state,
    requestedIdentity: identity,
    identityExact: identity ? blockedRuntimeIdentityMatches(state, frame, identity) : null,
  };
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    console.log(usage());
    return;
  }
  const baseUrl = options.baseUrl.replace(/\/$/, "");
  const route = `${baseUrl}/animations/${animationId}`;
  const expectedOrigin = new URL(baseUrl).origin;
  const traceIdentities = {
    rootEn: await loadTraceIdentity("req-root-root-standalone-en.json"),
    rootEs: await loadTraceIdentity("req-root-root-standalone-es.json"),
    spriteEn: await loadTraceIdentity("req-sprite-200-default-en.json"),
    spriteEs: await loadTraceIdentity("req-sprite-200-default-es.json"),
  };
  const diagnostics = {
    consoleErrors: [],
    consoleWarnings: [],
    pageErrors: [],
    failedRequests: [],
    httpErrors: [],
    unexpectedRequests: [],
  };
  const browser = await chromium.launch({ headless: true });
  const desktopContext = await browser.newContext({
    viewport: { width: 1200, height: 900 },
    deviceScaleFactor: 1,
    reducedMotion: "no-preference",
  });
  const page = await desktopContext.newPage();
  monitorPage(page, expectedOrigin, diagnostics);

  const deterministic = [];
  for (const frame of [1, 318, 637]) {
    deterministic.push(await deterministicCase(
      page,
      route,
      frame,
      traceIdentities.spriteEn,
      `sprite-200-frame-${String(frame).padStart(3, "0")}.png`,
    ));
  }
  for (const frame of [1, 10]) {
    deterministic.push(await deterministicCase(
      page,
      route,
      frame,
      traceIdentities.rootEn,
      `root-frame-${String(frame).padStart(3, "0")}.png`,
    ));
  }

  const replay = [];
  for (const input of ["mouse", "enter", "space"]) replay.push(await activateReplay(page, route, input));

  const spanishEndpoints = [];
  for (const { identity, frame } of [
    { identity: traceIdentities.rootEs, frame: 1 },
    { identity: traceIdentities.rootEs, frame: 10 },
    { identity: traceIdentities.spriteEs, frame: 1 },
    { identity: traceIdentities.spriteEs, frame: 637 },
  ]) {
    spanishEndpoints.push(await deterministicCase(
      page,
      route,
      frame,
      identity,
      `source-shared-untranslated-${identity.frameDomain}-frame-${String(frame).padStart(3, "0")}-es.png`,
    ));
  }
  const glossaryTemperature = await blockedCase(page, route, {
    frameDomain: "sprite-200",
    scenario: "glossary-temperature-unavailable",
    reason: "temperature-glossary-host-contract-unresolved",
  });
  const glossaryMeasure = await blockedCase(page, route, {
    frameDomain: "sprite-200",
    scenario: "glossary-measure-unavailable",
    reason: "measure-glossary-host-contract-unresolved",
  });
  const blockedScreenshot = await screenshot(
    page,
    page.locator("[data-candidate-status='engineering-not-strict'] > div").first(),
    path.join(screenshotRoot, "blocked-glossary-measure.png"),
  );

  const assetResponse = await desktopContext.request.get(
    `${baseUrl}/flash-assets/courses/${animationId}/canvas-renderer.js`,
  );
  const assetBytes = await assetResponse.body();
  const asset = {
    status: assetResponse.status(),
    contentType: assetResponse.headers()["content-type"] || null,
    bytes: assetBytes.length,
    sha256: sha256(assetBytes),
  };
  await desktopContext.close();

  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
    reducedMotion: "no-preference",
  });
  const mobilePage = await mobileContext.newPage();
  monitorPage(mobilePage, expectedOrigin, diagnostics);
  await mobilePage.goto(`${route}?frame=637&frameDomain=sprite-200&scenario=default&lang=en&seed=0`, { waitUntil: "networkidle" });
  await waitForReadyStage(mobilePage, 637);
  const mobileState = await readStageState(mobilePage);
  const mobileScreenshot = await screenshot(
    mobilePage,
    null,
    path.join(screenshotRoot, "mobile-frame-637.png"),
    { fullPage: true },
  );
  await mobileContext.close();

  const reducedContext = await browser.newContext({
    viewport: { width: 900, height: 760 },
    deviceScaleFactor: 1,
    reducedMotion: "reduce",
  });
  const reducedPage = await reducedContext.newPage();
  monitorPage(reducedPage, expectedOrigin, diagnostics);
  await reducedPage.goto(`${route}?frameDomain=sprite-200&scenario=default&lang=en&seed=0`, { waitUntil: "networkidle" });
  await waitForReadyStage(reducedPage, 1);
  await reducedPage.waitForTimeout(300);
  const reducedMotion = {
    state: await readStageState(reducedPage),
    noteVisible: await reducedPage.locator(".reduced-motion-note").isVisible(),
    noteText: (await reducedPage.locator(".reduced-motion-note").textContent())?.trim() || "",
    screenshot: await screenshot(
      reducedPage,
      reducedPage.locator("canvas.faithful-stage-wrap"),
      path.join(screenshotRoot, "reduced-motion-frame-001.png"),
    ),
  };
  await reducedContext.close();
  await browser.close();

  const deterministicManifestBytes = await readFile(deterministicCaptureManifest);
  const deterministicManifest = JSON.parse(deterministicManifestBytes);
  const generatedManifestBytes = await readFile(
    path.join(projectRoot, "public", "flash-assets", "courses", animationId, "manifest.json"),
  );
  const generatedManifest = JSON.parse(generatedManifestBytes);
  const englishByDomainAndFrame = new Map(
    deterministic.map((entry) => [
      `${entry.requestedIdentity.frameDomain}:${entry.requestedFrame}`,
      entry,
    ]),
  );
  const spanishVisualComparisons = await Promise.all(
    spanishEndpoints.map(async (spanish) => {
      const key = `${spanish.requestedIdentity.frameDomain}:${spanish.requestedFrame}`;
      const english = englishByDomainAndFrame.get(key);
      if (!english) throw new Error(`missing English source-shared comparison endpoint ${key}`);
      const [englishBytes, spanishBytes] = await Promise.all([
        readFile(path.resolve(projectRoot, english.capture.path)),
        readFile(path.resolve(projectRoot, spanish.capture.path)),
      ]);
      return {
        frameDomain: spanish.requestedIdentity.frameDomain,
        frame: spanish.requestedFrame,
        english: {
          path: english.capture.path,
          sha256: sha256(englishBytes),
        },
        spanish: {
          path: spanish.capture.path,
          sha256: sha256(spanishBytes),
        },
        normalizedRmse: normalizedPngRmse(englishBytes, spanishBytes),
        classification: "source-shared-untranslated-visual",
        translatedSpanishVisualClaimed: false,
        bilingualVisualParityClaimed: false,
        strictAcceptanceClaimed: false,
      };
    }),
  );
  const rootPixelComparisons = await Promise.all(
    deterministic
      .filter(({ requestedIdentity }) => requestedIdentity.frameDomain === "root")
      .map(async (entry) => {
        const baseline = generatedManifest.inputs.rootRuntimeFrames.find(
          ({ frame }) => frame === entry.requestedFrame,
        );
        if (!baseline) throw new Error(`generated manifest is missing root frame ${entry.requestedFrame}`);
        const referencePath = path.resolve(projectRoot, baseline.path);
        const candidatePath = path.resolve(projectRoot, entry.capture.path);
        if (!referencePath.startsWith(`${projectRoot}${path.sep}`)
          || !candidatePath.startsWith(`${projectRoot}${path.sep}`)) {
          throw new Error("root pixel comparison path escapes the project");
        }
        const [referenceBytes, candidateBytes] = await Promise.all([
          readFile(referencePath),
          readFile(candidatePath),
        ]);
        return {
          frame: entry.requestedFrame,
          reference: {
            path: baseline.path,
            sha256: baseline.sha256,
            expectedSha256: baseline.sha256,
            observedSha256: sha256(referenceBytes),
          },
          candidate: {
            path: entry.capture.path,
            sha256: sha256(candidateBytes),
          },
          normalizedRmse: normalizedPngRmse(referenceBytes, candidateBytes),
          strictAcceptanceClaimed: false,
        };
      }),
  );
  const sourceBytes = await readFile(
    path.join(projectRoot, "source-assets", "flash", "HELP MATH_ORIGINAL FILES", "HELP_COURSES", "ELMGR4", "L3", "IN", "L3IN09.swf"),
  );
  const producerBytes = await readFile(scriptPath);
  const overlayHelperBytes = await readFile(overlayHelperPath);
  const implementationBytes = Object.fromEntries(
    await Promise.all(
      Object.entries(implementationPaths).map(async ([key, filePath]) => [key, await readFile(filePath)]),
    ),
  );
  const implementationBindings = Object.fromEntries(
    Object.entries(implementationPaths).map(([key, filePath]) => [key, {
      path: portable(filePath),
      sha256: sha256(implementationBytes[key]),
    }]),
  );
  const captureRecords = [
    ...deterministic.map(({ capture }) => capture),
    ...spanishEndpoints.map(({ capture }) => capture),
    blockedScreenshot,
    mobileScreenshot,
    reducedMotion.screenshot,
  ];

  const assertions = [
    {
      id: "source-hash",
      pass: sha256(sourceBytes) === sourceSha256 && generatedManifest.inputs.sourceSwf.sha256 === sourceSha256,
    },
    {
      id: "generated-asset-hash",
      pass: asset.status === 200 && asset.sha256 === generatedManifest.output.sha256,
      details: asset,
    },
    {
      id: "implementation-byte-pins",
      pass: generatedManifest.inputs.spec.sha256 === implementationBindings.candidateSpec.sha256
        && generatedManifest.generator === implementationBindings.candidateGenerator.path
        && generatedManifest.inputs.ownerHostLocalizationContract.sha256
          === implementationBindings.ownerHostLocalizationContract.sha256
        && Object.values(implementationBindings).every(({ sha256: value }) => /^[a-f0-9]{64}$/.test(value)),
      details: implementationBindings,
    },
    {
      id: "deterministic-native-stage",
      pass: deterministic.every((entry) => entry.frozen
        && entry.capture.width === 800
        && entry.capture.height === 600
        && (entry.before.frameDomain === "root"
          ? entry.before.rootFrame === String(entry.requestedFrame)
          : entry.before.frameDomain === "sprite-200" && entry.before.rootFrame === "6")),
    },
    {
      id: "root-endpoint-pixels-match-bound-adobe-baseline",
      pass: rootPixelComparisons.length === 2
        && rootPixelComparisons.every((entry) => entry.reference.expectedSha256 === entry.reference.observedSha256
          && entry.normalizedRmse === 0
          && entry.strictAcceptanceClaimed === false),
      details: rootPixelComparisons,
    },
    {
      id: "capture-manifest-clean",
      pass: deterministicManifest.status === "complete"
        && deterministicManifest.captured.length === 3
        && deterministicManifest.consoleErrors.length === 0
        && deterministicManifest.failedRequests.length === 0
        && deterministicManifest.httpErrors.length === 0
        && deterministicManifest.unexpectedRequests.length === 0,
    },
    ...replay.map((entry) => ({
      id: `modern-host-reset-${entry.input}`,
      pass: entry.pass && entry.sourceReplaySemanticsClaimed === false,
      details: entry,
    })),
    {
      id: "four-spanish-domain-endpoints-render-source-shared-untranslated-visual-with-exact-identity",
      pass: spanishEndpoints.length === 4
        && spanishEndpoints.every((entry) => entry.frozen === true
          && entry.capture.width === 800
          && entry.capture.height === 600
          && entry.before.candidateVisualLocalizationStatus
            === "source-shared-untranslated-visual"
          && entry.before.canvasVisualLocalizationStatus
            === "source-shared-untranslated-visual"
          && entry.before.candidateSpanishAudioStatus
            === "exact-owner-file-and-host-routing-proven-runtime-unvalidated"
          && entry.before.candidateAudioRendered === "false"
          && entry.before.canvasAudioLocalizationStatus === "unresolved"
          && entry.before.canvasAudioRendered === "false"),
      details: {
        endpoints: spanishEndpoints,
        pixelComparisons: spanishVisualComparisons,
      },
    },
    {
      id: "english-and-spanish-routes-preserve-identical-source-pixels-without-translation-claim",
      pass: spanishVisualComparisons.length === 4
        && spanishVisualComparisons.every((entry) =>
          entry.normalizedRmse === 0
          && entry.classification === "source-shared-untranslated-visual"
          && entry.translatedSpanishVisualClaimed === false
          && entry.bilingualVisualParityClaimed === false
          && entry.strictAcceptanceClaimed === false),
      details: spanishVisualComparisons,
    },
    {
      id: "blocked-states-fail-closed",
      pass: [glossaryTemperature, glossaryMeasure].every((entry) => entry.canvasCount === 0
        && entry.candidateStatus === "blocked"
        && entry.runtimeFrame === String(entry.frame)
        && entry.reason),
    },
    {
      id: "mobile-responsive",
      pass: mobileState.document.scrollWidth <= mobileState.document.clientWidth
        && mobileState.layout
        && mobileState.layout.x >= -1
        && mobileState.layout.right <= mobileState.document.clientWidth + 1
        && Math.abs(mobileState.layout.width / mobileState.layout.height - 4 / 3) < 0.001,
      details: mobileState,
    },
    {
      id: "reduced-motion",
      pass: reducedMotion.noteVisible
        && reducedMotion.state.runtimeFrame === "1"
        && reducedMotion.state.rendererFrame === "1"
        && reducedMotion.state.canvasFrame === "1",
    },
    {
      id: "next-dev-overlay-suppressed-before-and-after-every-screenshot",
      pass: captureRecords.length === 12
        && captureRecords.every(({ devOverlaySuppression }) => devOverlaySuppressionPass(devOverlaySuppression)),
      details: {
        captureCount: captureRecords.length,
        captures: captureRecords.map(({ path: capturePath, sha256: captureSha256, devOverlaySuppression }) => ({
          path: capturePath,
          sha256: captureSha256,
          devOverlaySuppression,
        })),
      },
    },
    {
      id: "console-and-network",
      pass: diagnostics.consoleErrors.length === 0
        && diagnostics.pageErrors.length === 0
        && diagnostics.failedRequests.length === 0
        && diagnostics.httpErrors.length === 0
        && diagnostics.unexpectedRequests.length === 0,
      details: diagnostics,
    },
  ];
  const report = {
    schemaVersion: 1,
    animationId,
    generatedAt: new Date().toISOString(),
    status: assertions.every(({ pass }) => pass) ? "pass" : "fail",
    scope: "source-hash-bound native Canvas engineering-candidate QA",
    acceptanceEffect: "none",
    strictAcceptanceEffect: false,
    generatedBy: {
      script: portable(scriptPath),
      scriptSha256: sha256(producerBytes),
      deterministic: false,
    },
    captureGuard: {
      path: portable(overlayHelperPath),
      sha256: sha256(overlayHelperBytes),
      capturePageOnly: true,
    },
    route: `/animations/${animationId}`,
    environment: {
      baseUrl,
      browser: `Chromium ${browser.version()}`,
      playwright: "repository-pinned",
      serverMode: "development",
      deviceScaleFactor: 1,
    },
    source: {
      path: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/IN/L3IN09.swf",
      sha256: sourceSha256,
    },
    implementationBindings,
    traceSpecifications: Object.fromEntries(
      Object.entries(traceIdentities).map(([key, value]) => [key, value]),
    ),
    generatedAsset: {
      path: `public/flash-assets/courses/${animationId}/canvas-renderer.js`,
      ...asset,
      manifestPath: `public/flash-assets/courses/${animationId}/manifest.json`,
      manifestSha256: sha256(generatedManifestBytes),
    },
    deterministicCapture: {
      manifest: portable(deterministicCaptureManifest),
      manifestSha256: sha256(deterministicManifestBytes),
      manifestScope: "prior three-frame sprite-200 mask-fix capture only",
      cases: deterministic,
      rootEndpointPixelComparisons: rootPixelComparisons,
    },
    modernHostReset: {
      sourceReplaySemanticsClaimed: false,
      cases: replay,
    },
    localization: {
      spanish: {
        disposition: "canvas-ready-source-shared-untranslated-visual",
        visualLocalizationStatus: "source-shared-untranslated-visual",
        routeLanguage: "es",
        sourceVisualLanguage: "en",
        sourceVisualBranch: "none",
        translationStatus: "not-translated-source-has-no-visual-language-branch",
        audio: {
          rendered: false,
          localizationStatus: "unresolved",
          parityClaimed: false,
        },
        bilingualVisualParityClaimed: false,
        strictAcceptanceEffect: false,
        endpoints: spanishEndpoints,
        pixelComparisons: spanishVisualComparisons,
      },
    },
    blocked: {
      glossaryTemperature,
      glossaryMeasure,
      screenshot: blockedScreenshot,
    },
    mobile: { state: mobileState, screenshot: mobileScreenshot },
    reducedMotion,
    diagnostics,
    assertions,
    limitations: [
      "This QA validates the source-derived sprite-200 and root-standalone endpoint renderers for English plus the identical source-shared untranslated visual on Spanish routes; it does not claim a translated Spanish visual.",
      "Root endpoint RMSE is an engineering check against the existing source-hash-bound Adobe standalone baseline; this QA neither creates new baseline authority nor supplies strict/human/owner acceptance.",
      "The controlled Adobe frame-637 evidence is JPEG and engineering-only; it is not eligible for strict RMSE or full-frame authority.",
      "The root natural preloader/host schedule, natural nested-timeline phase, embedded stream, external Spanish MP3, Spanish audio behavior, source Replay semantics, and glossary host interactions remain unresolved.",
      "No authoritative nested natural trace, human visual review, owner acceptance, strict-validator completion, or complete migration is claimed.",
    ],
    authorityBoundary: {
      authoritativeBaseline: false,
      consumesExistingAuthoritativeRootBaseline: true,
      strictRmse: false,
      audioParity: false,
      spanishParity: false,
      glossaryBranchParity: false,
      sourceReplayParity: false,
      humanVisualReview: false,
      ownerAcceptance: false,
      strictMigrationCompletion: false,
    },
  };
  await mkdir(evidenceRoot, { recursive: true });
  const outputPath = path.join(evidenceRoot, "native-canvas-candidate-qa.json");
  await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ output: portable(outputPath), status: report.status, assertions }, null, 2));
  if (report.status !== "pass") process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  main().catch((error) => {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  });
}
