#!/usr/bin/env node

import {createHash} from "node:crypto";
import {mkdir, readFile, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {chromium} from "playwright";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");
const animationId = "course-g04-l03-ts-006";
const publicMp3Path =
  "/flash-assets/courses/course-g04-l03-ts-006/audio/spanish-host-narration.mp3";
const publicMp3File = `public${publicMp3Path}`;
const embeddedMp3Path =
  "/flash-assets/courses/course-g04-l03-ts-006/audio/embedded-stream-0001.mp3";
const embeddedMp3File = `public${embeddedMp3Path}`;
const expectedEmbeddedMp3Sha256 =
  "4d50cee1ee64bec0919933132ec250212474f236c699cd007a40f9ff2dce3122";
const sourceMp3Path =
  "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/SA/L3TS06.mp3";
const expectedMp3Sha256 =
  "c0ea9f1cede741945c763707ed89c5be76f651f761209880157bf0c45ded8688";
const traceSpecPath =
  "migrations/course-g04-l03-ts-006/audit/trace-specs/req-sprite-23-lesson-shell-natural-entry-en.json";
const outputPath = path.join(
  projectRoot,
  "migrations/course-g04-l03-ts-006/evidence/spanish-host-audio-current-js-product-qa.json",
);

export const TS006_SPANISH_HOST_AUDIO_BINDING_PATHS = Object.freeze({
  module: "packages/demos/src/modules/course-g04-l03-ts-006.tsx",
  timeline: "packages/demos/src/timelines/course-g04-l03-ts-006.ts",
  productRuntime: "apps/web/components/animation-runtime.tsx",
  runtimeContract: "packages/demos/src/contract.ts",
  runtimeHelpers: "packages/demos/src/runtime.ts",
  traceSpecification: traceSpecPath,
  sourceMp3: sourceMp3Path,
  publicMp3: publicMp3File,
  embeddedMp3: embeddedMp3File,
  mainTimelineAudioCandidateReport:
    "reports/g4-l3-current-js-main-timeline-audio-candidates.json",
  machineAudioAudit:
    "migrations/course-g04-l03-ts-006/audit/audio-runtime-evidence.json",
  assetInventory: "migrations/course-g04-l03-ts-006/asset-inventory.csv",
  productQaGenerator: "scripts/qa-ts006-spanish-host-audio.mjs",
});

export const TS006_SPANISH_HOST_AUDIO_FALSE_CLAIMS = Object.freeze({
  authoritativeOriginalRuntimeBaseline: false,
  naturalOriginalRuntimeTraversal: false,
  sourceMediaMatchEstablished: false,
  spokenSpanishLanguageVerified: false,
  spokenContentVerified: false,
  authoritativeListeningComplete: false,
  originalHostAudioBehaviorParity: false,
  embeddedStreamAudioParity: false,
  audioSynchronizationComplete: false,
  audioParity: false,
  bilingualVisualParity: false,
  fullFrameCoverage: false,
  rmseAcceptance: false,
  humanVisualReview: false,
  engineeringAcceptance: false,
  ownerAcceptance: false,
  strictMigrationCompletion: false,
  publicLessonRelease: false,
});

export function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) =>
      `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

export function traceSpecificationQaBinding(relativePath, document) {
  if (document?.schemaVersion !== 1
      || document.artifactType !== "course-pilot-original-runtime-trace-specification"
      || document.animationId !== animationId
      || document.requirementId !== "req:sprite-23:lesson-shell-natural-entry:en"
      || document.identity?.frameDomainId !== "sprite-23"
      || document.identity?.scenario !== "source-static-frame"
      || document.identity?.language !== "en"
      || String(document.identity?.seed) !== "0"
      || document.identity?.entryStateSha256 !==
        "d4f9baef8ce19c9503ff128aee12901b46f32736afbbd74833cdf9691bb51b4e"
      || !String(document.strictAcceptanceEffect).startsWith("none;")) {
    throw new Error("TS006 Spanish host-audio QA trace identity is missing, stale, or promoted");
  }
  const technicalProjection = {
    schemaVersion: document.schemaVersion,
    artifactType: document.artifactType,
    animationId: document.animationId,
    requirementId: document.requirementId,
    traceSpecStatus: document.traceSpecStatus,
    identity: document.identity,
    traceModel: document.traceModel,
    frameDomain: document.frameDomain,
    entryState: document.entryState,
    strictAcceptanceEffect: document.strictAcceptanceEffect,
  };
  return {
    file: relativePath,
    hashMode: "canonical-json-v1",
    projection: "ts006-current-js-capture-identity-v1",
    sha256: sha256(Buffer.from(canonicalJson(technicalProjection))),
    excludedPaths: [
      "authorityStatement",
      "acquisitionPlan",
      "sourceBindings",
      "schedule",
      "unresolvedMappings",
      "separateBehaviorUnknowns",
      "inventoryContext",
      "executionEvidence",
    ],
  };
}

function portable(filePath) {
  return path.relative(projectRoot, filePath).split(path.sep).join("/");
}

export function validateLocalBaseUrl(value) {
  const parsed = new URL(value);
  const hostname = parsed.hostname.replace(/^\[|\]$/g, "");
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("--base-url must use http or https");
  }
  if (!["localhost", "127.0.0.1", "::1"].includes(hostname)) {
    throw new Error("--base-url must use localhost, 127.0.0.1, or ::1");
  }
  if (parsed.username || parsed.password || parsed.search || parsed.hash) {
    throw new Error("--base-url cannot include credentials, a query, or a fragment");
  }
  parsed.pathname = parsed.pathname.replace(/\/$/, "");
  return parsed.toString().replace(/\/$/, "");
}

export function isSameOriginRequest(requestUrl, baseUrl) {
  const requested = new URL(requestUrl);
  if (["data:", "blob:", "about:"].includes(requested.protocol)) return true;
  const base = new URL(baseUrl);
  return requested.origin === base.origin;
}

function parseArguments(argv) {
  let baseUrl = "http://127.0.0.1:3214";
  let check = false;
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--base-url") {
      if (!argv[index + 1]) throw new Error("--base-url requires a value");
      baseUrl = argv[index + 1];
      index += 1;
    } else if (value === "--check") {
      check = true;
    } else if (value === "--help" || value === "-h") {
      return {help: true, check, baseUrl: validateLocalBaseUrl(baseUrl)};
    } else {
      throw new Error(`Unknown option: ${value}`);
    }
  }
  return {help: false, check, baseUrl: validateLocalBaseUrl(baseUrl)};
}

async function fileBinding(relativePath) {
  const bytes = await readFile(path.join(projectRoot, relativePath));
  return {file: relativePath, sha256: sha256(bytes)};
}

export async function currentBindings() {
  return Object.fromEntries(
    await Promise.all(
      Object.entries(TS006_SPANISH_HOST_AUDIO_BINDING_PATHS).map(
        async ([name, relativePath]) => {
          if (name !== "traceSpecification") {
            return [name, await fileBinding(relativePath)];
          }
          const document = JSON.parse(await readFile(path.join(projectRoot, relativePath), "utf8"));
          return [name, traceSpecificationQaBinding(relativePath, document)];
        },
      ),
    ),
  );
}

function requestSummary(request, baseUrl) {
  const parsed = new URL(request.url());
  return {
    url: request.url(),
    method: request.method(),
    resourceType: request.resourceType(),
    sameOrigin: isSameOriginRequest(request.url(), baseUrl),
    pathname: parsed.pathname,
  };
}

function attachDiagnostics(page, baseUrl) {
  const requests = [];
  const failedRequests = [];
  const httpErrors = [];
  const consoleErrors = [];
  const consoleWarnings = [];
  const pageErrors = [];
  page.on("request", (request) => {
    try {
      requests.push(requestSummary(request, baseUrl));
    } catch {
      requests.push({
        url: request.url(),
        method: request.method(),
        resourceType: request.resourceType(),
        sameOrigin: false,
        pathname: null,
      });
    }
  });
  page.on("requestfailed", (request) => {
    failedRequests.push({url: request.url(), error: request.failure()?.errorText || "failed"});
  });
  page.on("response", (response) => {
    if (response.status() >= 400) {
      httpErrors.push({url: response.url(), status: response.status()});
    }
  });
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
    if (message.type() === "warning") consoleWarnings.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  return {requests, failedRequests, httpErrors, consoleErrors, consoleWarnings, pageErrors};
}

function diagnosticsPass(diagnostics) {
  return diagnostics.requests.every(({sameOrigin}) => sameOrigin) &&
    diagnostics.failedRequests.length === 0 &&
    diagnostics.httpErrors.length === 0 &&
    diagnostics.consoleErrors.length === 0 &&
    diagnostics.consoleWarnings.length === 0 &&
    diagnostics.pageErrors.length === 0;
}

async function waitForTs006SourceStatic(page) {
  await page.locator('.runtime-stage[data-flash-frame-domain="sprite-23"]').waitFor({
    state: "visible",
    timeout: 30_000,
  });
  await page
    .locator('[data-candidate-status="source-static-engineering-not-strict"][data-canvas-status="ready"]')
    .waitFor({state: "visible", timeout: 30_000});
  await page.locator(".runtime-audio-controls button").waitFor({state: "attached"});
}

async function readRuntimeAudioState(page) {
  return page.evaluate(() => {
    const shell = document.querySelector(".runtime-shell");
    const stage = document.querySelector(".runtime-stage");
    const candidate = document.querySelector("[data-candidate-status]");
    const control = document.querySelector(".runtime-audio-controls button");
    return {
      frame: stage?.getAttribute("data-flash-frame") || null,
      frameDomain: stage?.getAttribute("data-flash-frame-domain") || null,
      rootFrame: stage?.getAttribute("data-flash-root-frame") || null,
      scenario: stage?.getAttribute("data-flash-scenario") || null,
      language: stage?.getAttribute("data-flash-lang") || null,
      requirementId: stage?.getAttribute("data-flash-requirement-id") || null,
      traceId: stage?.getAttribute("data-flash-trace-id") || null,
      entryStateSha256:
        stage?.getAttribute("data-flash-entry-state-sha256") || null,
      captureIdentityStatus:
        stage?.getAttribute("data-capture-identity-status") || null,
      candidateStatus: candidate?.getAttribute("data-candidate-status") || null,
      candidateCanvasStatus: candidate?.getAttribute("data-canvas-status") || null,
      candidateAudioRendered: candidate?.getAttribute("data-audio-rendered") || null,
      timelinePaused: shell?.getAttribute("data-host-audio-timeline-paused") || null,
      control: control
        ? {
            text: control.textContent?.trim() || "",
            ariaPressed: control.getAttribute("aria-pressed"),
            disabled: control.hasAttribute("disabled"),
            timelineBehavior:
              control.getAttribute("data-audio-timeline-behavior"),
          }
        : null,
    };
  });
}

async function observeNormalPlayback(browser, baseUrl) {
  const context = await browser.newContext({
    viewport: {width: 1280, height: 900},
    deviceScaleFactor: 1,
    reducedMotion: "no-preference",
  });
  const page = await context.newPage();
  const diagnostics = attachDiagnostics(page, baseUrl);
  const target = new URL(
    `/animations/${animationId}?frameDomain=sprite-23&scenario=source-static-frame&lang=en&seed=0`,
    `${baseUrl}/`,
  ).toString();
  const response = await page.goto(target, {waitUntil: "domcontentloaded"});
  await waitForTs006SourceStatic(page);
  await page.waitForLoadState("networkidle");

  const beforeClick = await readRuntimeAudioState(page);
  const requestCountBeforeClick = diagnostics.requests.length;
  const mp3RequestsBeforeClick = diagnostics.requests.filter(
    ({pathname}) => pathname?.toLowerCase().endsWith(".mp3"),
  );
  const mediaRequestsBeforeClick = diagnostics.requests.filter(
    ({resourceType}) => resourceType === "media",
  );
  const exactEmbeddedMp3RequestsBeforeClick = mp3RequestsBeforeClick.filter(
    ({url, pathname, sameOrigin}) =>
      sameOrigin &&
      pathname === embeddedMp3Path &&
      new URL(url).origin === new URL(baseUrl).origin,
  );

  const exactRequestPromise = page.waitForRequest(
    (request) => {
      try {
        const parsed = new URL(request.url());
        return parsed.origin === new URL(baseUrl).origin && parsed.pathname === publicMp3Path;
      } catch {
        return false;
      }
    },
    {timeout: 10_000},
  );
  await page.getByRole("button", {name: "Play Spanish audio"}).click();
  const exactRequest = await exactRequestPromise;
  await page
    .locator('.runtime-shell[data-host-audio-timeline-paused="true"]')
    .waitFor({state: "attached", timeout: 5_000});
  await page
    .locator('.runtime-audio-controls button[aria-pressed="true"]')
    .waitFor({state: "attached", timeout: 5_000});
  await page.waitForTimeout(120);
  const afterClick = await readRuntimeAudioState(page);
  await page.waitForTimeout(120);
  const pausedFrameSample = await readRuntimeAudioState(page);

  const requestsAfterClick = diagnostics.requests.slice(requestCountBeforeClick);
  const mediaRequestsAfterClick = requestsAfterClick.filter(
    ({resourceType}) => resourceType === "media",
  );
  const mp3RequestsAfterClick = requestsAfterClick.filter(
    ({pathname}) => pathname?.toLowerCase().endsWith(".mp3"),
  );
  const exactMp3RequestsAfterClick = mp3RequestsAfterClick.filter(
    ({url, pathname, sameOrigin}) =>
      sameOrigin && pathname === publicMp3Path && new URL(url).origin === new URL(baseUrl).origin,
  );

  const pass = response?.status() === 200 &&
    beforeClick.frameDomain === "sprite-23" &&
    beforeClick.rootFrame === "6" &&
    beforeClick.scenario === "source-static-frame" &&
    beforeClick.language === "en" &&
    beforeClick.candidateStatus === "source-static-engineering-not-strict" &&
    beforeClick.candidateCanvasStatus === "ready" &&
    beforeClick.candidateAudioRendered === "false" &&
    beforeClick.timelinePaused === "false" &&
    beforeClick.control?.text === "Play Spanish audio" &&
    beforeClick.control?.ariaPressed === "false" &&
    beforeClick.control?.disabled === false &&
    beforeClick.control?.timelineBehavior === "pause-while-playing" &&
    mp3RequestsBeforeClick.length >= 1 &&
    exactEmbeddedMp3RequestsBeforeClick.length ===
      mp3RequestsBeforeClick.length &&
    mediaRequestsBeforeClick.length === mp3RequestsBeforeClick.length &&
    exactRequest.url() === new URL(publicMp3Path, `${baseUrl}/`).toString() &&
    afterClick.control?.text === "Stop Spanish audio" &&
    afterClick.control?.ariaPressed === "true" &&
    afterClick.control?.disabled === false &&
    afterClick.timelinePaused === "true" &&
    pausedFrameSample.timelinePaused === "true" &&
    pausedFrameSample.frame === afterClick.frame &&
    mp3RequestsAfterClick.length >= 1 &&
    exactMp3RequestsAfterClick.length === mp3RequestsAfterClick.length &&
    mediaRequestsAfterClick.length === mp3RequestsAfterClick.length &&
    diagnosticsPass(diagnostics);

  const result = {
    url: target,
    httpStatus: response?.status() ?? null,
    beforeClick,
    afterClick,
    pausedFrameSample,
    observations: {
      mp3RequestsBeforeClick,
      mediaRequestsBeforeClick,
      exactEmbeddedMp3RequestsBeforeClick,
      onlyExactEmbeddedMp3MediaRequestedBeforeClick:
        mp3RequestsBeforeClick.length >= 1 &&
        exactEmbeddedMp3RequestsBeforeClick.length ===
          mp3RequestsBeforeClick.length &&
        mediaRequestsBeforeClick.length === mp3RequestsBeforeClick.length,
      requestsAfterClick,
      mediaRequestsAfterClick,
      mp3RequestsAfterClick,
      exactMp3RequestsAfterClick,
      onlyExactSameOriginMp3MediaRequestedAfterClick:
        mp3RequestsAfterClick.length >= 1 &&
        exactMp3RequestsAfterClick.length === mp3RequestsAfterClick.length &&
        mediaRequestsAfterClick.length === mp3RequestsAfterClick.length,
      timelineRemainedAtPausedFrame:
        pausedFrameSample.timelinePaused === "true" &&
        pausedFrameSample.frame === afterClick.frame,
    },
    diagnostics: {
      externalRequests: diagnostics.requests.filter(({sameOrigin}) => !sameOrigin),
      failedRequests: diagnostics.failedRequests,
      httpErrors: diagnostics.httpErrors,
      consoleErrors: diagnostics.consoleErrors,
      consoleWarnings: diagnostics.consoleWarnings,
      pageErrors: diagnostics.pageErrors,
    },
    pass,
  };
  await context.close();
  return result;
}

async function observeCaptureMode(browser, baseUrl, traceSpec) {
  const identity = traceSpec.identity;
  const params = new URLSearchParams({
    frame: String(identity.requiredRange.firstFrame),
    frameDomain: identity.frameDomainId,
    requirementId: traceSpec.requirementId,
    trace: identity.traceId,
    entryStateSha256: identity.entryStateSha256,
    scenario: identity.scenario,
    lang: identity.language,
    seed: identity.seed,
    capture: "1",
  });
  const context = await browser.newContext({
    viewport: {width: 1280, height: 900},
    deviceScaleFactor: 1,
    reducedMotion: "no-preference",
  });
  const page = await context.newPage();
  const diagnostics = attachDiagnostics(page, baseUrl);
  const target = new URL(
    `/animations/${animationId}?${params.toString()}`,
    `${baseUrl}/`,
  ).toString();
  const response = await page.goto(target, {waitUntil: "domcontentloaded"});
  await waitForTs006SourceStatic(page);
  await page.waitForLoadState("networkidle");
  const beforeDisabledClick = await readRuntimeAudioState(page);
  await page.evaluate(() => {
    const control = document.querySelector(".runtime-audio-controls button");
    if (!(control instanceof HTMLButtonElement)) {
      throw new Error("capture-mode host-audio control is missing");
    }
    control.click();
  });
  await page.waitForTimeout(150);
  const afterDisabledClick = await readRuntimeAudioState(page);
  const mp3Requests = diagnostics.requests.filter(
    ({pathname}) => pathname?.toLowerCase().endsWith(".mp3"),
  );
  const mediaRequests = diagnostics.requests.filter(
    ({resourceType}) => resourceType === "media",
  );
  const pass = response?.status() === 200 &&
    beforeDisabledClick.frame === String(identity.requiredRange.firstFrame) &&
    beforeDisabledClick.frameDomain === identity.frameDomainId &&
    beforeDisabledClick.rootFrame === "6" &&
    beforeDisabledClick.scenario === identity.scenario &&
    beforeDisabledClick.language === identity.language &&
    beforeDisabledClick.requirementId === traceSpec.requirementId &&
    beforeDisabledClick.traceId === identity.traceId &&
    beforeDisabledClick.entryStateSha256 === identity.entryStateSha256 &&
    beforeDisabledClick.captureIdentityStatus === "verified" &&
    beforeDisabledClick.control?.text === "Play Spanish audio" &&
    beforeDisabledClick.control?.ariaPressed === "false" &&
    beforeDisabledClick.control?.disabled === true &&
    beforeDisabledClick.timelinePaused === "false" &&
    JSON.stringify(beforeDisabledClick) === JSON.stringify(afterDisabledClick) &&
    mp3Requests.length === 0 &&
    mediaRequests.length === 0 &&
    diagnosticsPass(diagnostics);
  const result = {
    url: target,
    httpStatus: response?.status() ?? null,
    expectedIdentity: {
      frame: String(identity.requiredRange.firstFrame),
      frameDomain: identity.frameDomainId,
      rootFrame: "6",
      scenario: identity.scenario,
      language: identity.language,
      requirementId: traceSpec.requirementId,
      traceId: identity.traceId,
      entryStateSha256: identity.entryStateSha256,
      captureIdentityStatus: "verified",
    },
    beforeDisabledClick,
    afterDisabledClick,
    observations: {
      forcedClickHadNoEffect:
        JSON.stringify(beforeDisabledClick) === JSON.stringify(afterDisabledClick),
      mp3Requests,
      mediaRequests,
    },
    diagnostics: {
      externalRequests: diagnostics.requests.filter(({sameOrigin}) => !sameOrigin),
      failedRequests: diagnostics.failedRequests,
      httpErrors: diagnostics.httpErrors,
      consoleErrors: diagnostics.consoleErrors,
      consoleWarnings: diagnostics.consoleWarnings,
      pageErrors: diagnostics.pageErrors,
    },
    pass,
  };
  await context.close();
  return result;
}

async function verifyAudioBytesAndManifest() {
  const [sourceBytes, publicBytes, embeddedBytes, candidateReportText] =
    await Promise.all([
    readFile(path.join(projectRoot, sourceMp3Path)),
    readFile(path.join(projectRoot, publicMp3File)),
    readFile(path.join(projectRoot, embeddedMp3File)),
    readFile(
      path.join(
        projectRoot,
        TS006_SPANISH_HOST_AUDIO_BINDING_PATHS
          .mainTimelineAudioCandidateReport,
      ),
      "utf8",
    ),
  ]);
  const candidateReport = JSON.parse(candidateReportText);
  const entry = candidateReport.candidates?.find(
    (candidate) => candidate.animationId === animationId,
  );
  const pass = sha256(sourceBytes) === expectedMp3Sha256 &&
    sha256(publicBytes) === expectedMp3Sha256 &&
    sourceBytes.equals(publicBytes) &&
    entry?.integration === "specialized-module-generated-english-cue" &&
    entry?.spanish?.sourcePath === sourceMp3Path &&
    entry?.spanish?.sha256 === expectedMp3Sha256 &&
    entry?.spanish?.outputPath === publicMp3File &&
    entry?.spanish?.publicPath === publicMp3Path &&
    entry?.spanish?.normalizedLanguageCandidate === "es" &&
    entry?.spanish?.spokenLanguageEstablished === false &&
    entry?.embedded?.sha256 === expectedEmbeddedMp3Sha256 &&
    entry?.embedded?.outputPath === embeddedMp3File &&
    entry?.embedded?.publicPath === embeddedMp3Path &&
    sha256(embeddedBytes) === expectedEmbeddedMp3Sha256 &&
    entry?.authority?.originalRuntimeSynchronizationEstablished === false &&
    entry?.authority?.listeningAcceptanceEstablished === false &&
    entry?.authority?.strictAcceptanceEffect === "none" &&
    candidateReport.strictAcceptanceEffect === "none";
  return {
    sourceMp3Sha256: sha256(sourceBytes),
    publicMp3Sha256: sha256(publicBytes),
    embeddedMp3Sha256: sha256(embeddedBytes),
    exactBytesIdentical: sourceBytes.equals(publicBytes),
    expectedMp3Sha256,
    expectedEmbeddedMp3Sha256,
    currentJsAudioCandidate: entry ?? null,
    pass,
  };
}

export function reportValidationErrors(report, bindings = null) {
  const errors = [];
  if (report?.schemaVersion !== 1) errors.push("schemaVersion must be 1");
  if (report?.animationId !== animationId) errors.push("animationId mismatch");
  if (report?.status !== "passed-current-js-product-qa-acceptance-neutral") {
    errors.push("report status is not passed");
  }
  if (report?.strictAcceptanceEffect !== false || report?.acceptanceEffect !== "none") {
    errors.push("acceptance effect must remain none");
  }
  if (report?.normalPlaybackPage?.pass !== true) errors.push("normal playback QA failed");
  if (report?.deterministicCapturePage?.pass !== true) errors.push("capture-mode QA failed");
  if (report?.audioAssetIdentity?.pass !== true) errors.push("audio asset identity failed");
  if (report?.bindingsUnchangedDuringObservation !== true) {
    errors.push("bindings changed during browser observation");
  }
  const expectedClaims = TS006_SPANISH_HOST_AUDIO_FALSE_CLAIMS;
  for (const [claim, expected] of Object.entries(expectedClaims)) {
    if (report?.claims?.[claim] !== expected) errors.push(`claim ${claim} must remain false`);
  }
  if (bindings) {
    for (const [name, current] of Object.entries(bindings)) {
      if (report?.bindings?.[name]?.file !== current.file ||
          report?.bindings?.[name]?.sha256 !== current.sha256) {
        errors.push(`binding ${name} is stale`);
      }
    }
  }
  return errors;
}

async function checkExistingReport() {
  const [reportText, bindings, audioAssetIdentity] = await Promise.all([
    readFile(outputPath, "utf8"),
    currentBindings(),
    verifyAudioBytesAndManifest(),
  ]);
  const report = JSON.parse(reportText);
  const errors = reportValidationErrors(report, bindings);
  if (!audioAssetIdentity.pass) errors.push("current audio bytes or manifest entry failed");
  if (errors.length) {
    throw new Error(`TS006 Spanish host-audio product QA check failed:\n- ${errors.join("\n- ")}`);
  }
  process.stdout.write(
    `${JSON.stringify({status: "pass", check: true, output: portable(outputPath), strictAcceptanceEffect: false}, null, 2)}\n`,
  );
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(
      "Usage: node scripts/qa-ts006-spanish-host-audio.mjs [--base-url http://127.0.0.1:3214] [--check]\n",
    );
    return;
  }
  if (options.check) {
    await checkExistingReport();
    return;
  }

  const bindingsBefore = await currentBindings();
  const traceSpec = JSON.parse(
    await readFile(path.join(projectRoot, traceSpecPath), "utf8"),
  );
  const audioAssetIdentity = await verifyAudioBytesAndManifest();
  const playwrightPackage = JSON.parse(
    await readFile(path.join(projectRoot, "node_modules/playwright/package.json"), "utf8"),
  );

  const browser = await chromium.launch({headless: true});
  const browserVersion = browser.version();
  let normalPlaybackPage;
  let deterministicCapturePage;
  try {
    normalPlaybackPage = await observeNormalPlayback(browser, options.baseUrl);
    deterministicCapturePage = await observeCaptureMode(
      browser,
      options.baseUrl,
      traceSpec,
    );
  } finally {
    await browser.close();
  }

  const bindingsAfter = await currentBindings();
  const bindingsUnchangedDuringObservation =
    JSON.stringify(bindingsBefore) === JSON.stringify(bindingsAfter);
  const pass = normalPlaybackPage.pass &&
    deterministicCapturePage.pass &&
    audioAssetIdentity.pass &&
    bindingsUnchangedDuringObservation;
  const report = {
    schemaVersion: 1,
    artifactType: "ts006-current-js-spanish-host-audio-product-qa",
    animationId,
    recordedAt: new Date().toISOString(),
    generatedBy: {
      script: portable(scriptPath),
      scriptSha256: bindingsBefore.productQaGenerator.sha256,
      invocation:
        `node scripts/qa-ts006-spanish-host-audio.mjs --base-url ${options.baseUrl}`,
      deterministic: false,
      checkCommand: "node scripts/qa-ts006-spanish-host-audio.mjs --check",
    },
    status: pass
      ? "passed-current-js-product-qa-acceptance-neutral"
      : "failed-current-js-product-qa",
    acceptanceEffect: "none",
    strictAcceptanceEffect: false,
    migrationStatusChanged: false,
    humanReviewRecorded: false,
    ownerReviewRecorded: false,
    authority:
      "Local Playwright observation of the current JavaScript TS006 source-static candidate host-audio control and exact staged MP3 request routing only",
    authorityBoundary:
      "This report verifies only the current JavaScript product control, its exact same-origin candidate MP3 route, its generic pause-while-playing state, capture-mode withholding, and bound file identities. It does not establish source-media matching to captured runtime audio, Spanish speech or content, human listening, original Flash host semantics, embedded SoundStream behavior, synchronization, bilingual visual parity, full-frame fidelity, RMSE, human review, Owner acceptance, strict completion, or release readiness.",
    toolchain: {
      playwright: playwrightPackage.version,
      browser: `Chromium ${browserVersion}`,
      server: `Next.js development server at ${options.baseUrl}`,
    },
    bindings: bindingsBefore,
    bindingsUnchangedDuringObservation,
    audioAssetIdentity,
    normalPlaybackPage,
    deterministicCapturePage,
    audioAcceptance: {
      exactSourceAndPublicBytesStaged: audioAssetIdentity.pass,
      currentJsUserActivatedControlObserved: normalPlaybackPage.pass,
      deterministicCaptureWithholdingObserved: deterministicCapturePage.pass,
      sourceMediaMatchEstablished: false,
      spokenSpanishLanguageVerified: false,
      spokenContentVerified: false,
      authoritativeListeningComplete: false,
      originalHostStateTraversalComplete: false,
      originalHostPauseResumeSynchronizationComplete: false,
      embeddedSoundStreamSynchronizationComplete: false,
      replayAudioResetAccepted: false,
      strictAudioAcceptance: "pending",
    },
    claims: {...TS006_SPANISH_HOST_AUDIO_FALSE_CLAIMS},
  };

  const validationErrors = reportValidationErrors(report, bindingsBefore);
  if (pass && validationErrors.length) {
    throw new Error(`Generated report failed self-validation:\n- ${validationErrors.join("\n- ")}`);
  }
  await mkdir(path.dirname(outputPath), {recursive: true});
  await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`);
  process.stdout.write(
    `${JSON.stringify({status: pass ? "pass" : "fail", output: portable(outputPath), strictAcceptanceEffect: false}, null, 2)}\n`,
  );
  if (!pass) process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  main().catch((error) => {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  });
}
