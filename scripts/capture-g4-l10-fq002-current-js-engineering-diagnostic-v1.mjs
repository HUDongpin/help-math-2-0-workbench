#!/usr/bin/env node

import {createHash} from "node:crypto";
import {createServer} from "node:http";
import {
  chmod,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rename,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import {tmpdir} from "node:os";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {chromium} from "@playwright/test";
import {build} from "esbuild";
import {PNG} from "pngjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const TEST_PATH = path.join(
  PROJECT_ROOT,
  "scripts",
  "capture-g4-l10-fq002-current-js-engineering-diagnostic-v1.test.mjs",
);

export const ANIMATION_ID = "course-g04-l10-fq-002";
export const ARTIFACT_TYPE =
  "g4-l10-fq002-current-js-engineering-diagnostic-v1";
export const OUTPUT_ROOT = path.join(
  PROJECT_ROOT,
  "output",
  "playwright",
  ARTIFACT_TYPE,
);
export const CAPTURE_FRAMES = Object.freeze([1, 2, 27, 28, 43, 44, 70]);
export const STAGE = Object.freeze({
  width: 800,
  height: 600,
  backgroundColor: "#b8d8f7",
});

const FRAME_DOMAIN = "sprite-823";
const REQUIREMENT_ID = "diagnostic-current-js-fq002-source-static-en-v1";
const TRACE_ID = "diagnostic-current-js-fq002-sprite-823-v1";
const SCENARIO = "source-static-frame";
const LANGUAGE = "en";
const SEED = 0;
const ROOT_FRAME = 6;
const SOURCE_SWF_SHA256 =
  "850ddbc1aeda20aa782d614a4ad44aae7e2ac8242b47fc27882860208c99d9ea";
const SOURCE_FLA_SHA256 =
  "c73eaa76438956aaac0aafd013e10ae7f3911b9a18b94047bf6b8bf4e27e229a";
const CANVAS_ASSET_SHA256 =
  "1155bb2a8a59b83076e4265581631c11e22ccc5b3c697842ac363ac18920cd38";
const CANDIDATE_MANIFEST_SHA256 =
  "ad7a83efa30ad3e8cfcb9d3688f4d9420f43e65cc28e9711e52d54cf98eedb7d";
const ASSET_ROUTE =
  "/flash-assets/courses/course-g04-l10-fq-002/canvas-renderer.js";

const INPUT_PATHS = Object.freeze({
  sourceSwf:
    "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/FQ/L10FQ02.swf",
  sourceFla:
    "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/FQ/L10FQ02.fla",
  candidateManifest:
    "public/flash-assets/courses/course-g04-l10-fq-002/manifest.json",
  canvasAsset:
    "public/flash-assets/courses/course-g04-l10-fq-002/canvas-renderer.js",
  candidateModule:
    "packages/demos/src/modules/course-g04-l10-fq-002.tsx",
  candidateTimeline:
    "packages/demos/src/timelines/course-g04-l10-fq-002.ts",
  candidateFactory: "packages/demos/src/source-static-canvas-candidate.tsx",
  sourceStaticAuthority: "packages/demos/src/source-static-candidate-authority.ts",
  packageLock: "package-lock.json",
  prototypeRegistry: "packages/demos/prototype-registry.json",
  generatedRegistry: "packages/demos/src/registry.generated.ts",
  prototypeManifest: "packages/demos/src/prototype-manifest.ts",
  wholeLessonRegistry: "apps/web/lib/whole-lesson-course-registry.ts",
});

export const AUTHORITY_BOUNDARY = Object.freeze({
  classification:
    "source-static-current-javascript-engineering-diagnostic-only",
  acceptanceEffect: "none",
  currentJavascriptCandidateOnly: true,
  authoritativeOriginalRuntime: false,
  originalRuntimeNaturalTrace: false,
  actionScriptBehaviorParity: false,
  bilingualVisualParity: false,
  audioCueParity: false,
  audioListeningAcceptance: false,
  replayParity: false,
  fullFrameOriginalRuntimeComparison: false,
  rmseAcceptance: false,
  humanVisualReview: false,
  ownerAcceptance: false,
  strictMigrationCompletion: false,
  wholeLessonIntegration: false,
  atomicLessonPublication: false,
});

const EXPECTED_AUTHORITY_FALSE_KEYS = Object.freeze([
  "authoritativeOriginalRuntime",
  "originalRuntimeNaturalTrace",
  "actionScriptBehaviorParity",
  "bilingualVisualParity",
  "audioCueParity",
  "audioListeningAcceptance",
  "replayParity",
  "fullFrameOriginalRuntimeComparison",
  "rmseAcceptance",
  "humanVisualReview",
  "ownerAcceptance",
  "strictMigrationCompletion",
  "wholeLessonIntegration",
  "atomicLessonPublication",
]);

const EXPECTED_OUTPUT_FILES = Object.freeze([
  ...CAPTURE_FRAMES.map(
    (frame) => `frame-${String(frame).padStart(4, "0")}.png`,
  ),
  "capture-manifest.json",
]);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

export function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function portable(absolutePath) {
  return path.relative(PROJECT_ROOT, absolutePath).split(path.sep).join("/");
}

function resolveProjectPath(relativePath) {
  const absolutePath = path.resolve(PROJECT_ROOT, relativePath);
  const relative = path.relative(PROJECT_ROOT, absolutePath);
  invariant(
    relative !== "" &&
      relative !== ".." &&
      !relative.startsWith(`..${path.sep}`) &&
      !path.isAbsolute(relative),
    `Path escapes the project root: ${relativePath}`,
  );
  return absolutePath;
}

async function pathExists(absolutePath) {
  try {
    await stat(absolutePath);
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

async function bindFile(relativePath, expectedSha256 = null) {
  const absolutePath = resolveProjectPath(relativePath);
  const bytes = await readFile(absolutePath);
  const observedSha256 = sha256(bytes);
  if (expectedSha256) {
    invariant(
      observedSha256 === expectedSha256,
      `${relativePath}: expected SHA-256 ${expectedSha256}, observed ${observedSha256}`,
    );
  }
  return Object.freeze({
    path: relativePath,
    bytes: bytes.length,
    sha256: observedSha256,
  });
}

export function buildDiagnosticIdentity() {
  const entryStateDescriptor = Object.freeze({
    schemaVersion: 1,
    classification: "diagnostic-local-current-js-entry-state-only",
    animationId: ANIMATION_ID,
    sourceSwfSha256: SOURCE_SWF_SHA256,
    candidateManifestSha256: CANDIDATE_MANIFEST_SHA256,
    canvasAssetSha256: CANVAS_ASSET_SHA256,
    frameDomain: FRAME_DOMAIN,
    rootFrame: ROOT_FRAME,
    scenario: SCENARIO,
    language: LANGUAGE,
    seed: SEED,
    sourceHostStateEstablished: false,
    originalRuntimeEntryStateEstablished: false,
    strictAcceptanceEffect: "none",
  });
  const entryStateBytes = Buffer.from(
    `${JSON.stringify(entryStateDescriptor)}\n`,
    "utf8",
  );
  return Object.freeze({
    requirementId: REQUIREMENT_ID,
    traceId: TRACE_ID,
    entryStateSha256: sha256(entryStateBytes),
    entryStateDescriptor,
    entryStateDescriptorBytes: entryStateBytes.length,
    frameDomain: FRAME_DOMAIN,
    scenario: SCENARIO,
    language: LANGUAGE,
    seed: SEED,
  });
}

export function parseArguments(argv) {
  const options = {check: false, help: false};
  for (const value of argv) {
    if (value === "--check") options.check = true;
    else if (value === "--help" || value === "-h") options.help = true;
    else throw new Error(`Unknown option: ${value}`);
  }
  invariant(
    !(options.check && options.help),
    "--check and --help may not be combined",
  );
  return options;
}

function usage() {
  return [
    "Usage:",
    "  node scripts/capture-g4-l10-fq002-current-js-engineering-diagnostic-v1.mjs",
    "  node scripts/capture-g4-l10-fq002-current-js-engineering-diagnostic-v1.mjs --check",
    "",
    "Captures seven native 800x600 source-static current-JavaScript frames.",
    "The immutable artifact is an acceptance-neutral engineering diagnostic only.",
  ].join("\n");
}

async function loadAndValidateInputs() {
  const bindings = {};
  for (const [key, relativePath] of Object.entries(INPUT_PATHS)) {
    const expected =
      key === "sourceSwf"
        ? SOURCE_SWF_SHA256
        : key === "sourceFla"
          ? SOURCE_FLA_SHA256
          : key === "candidateManifest"
            ? CANDIDATE_MANIFEST_SHA256
            : key === "canvasAsset"
              ? CANVAS_ASSET_SHA256
              : null;
    bindings[key] = await bindFile(relativePath, expected);
  }
  bindings.producer = await bindFile(portable(SCRIPT_PATH));
  bindings.producerTests = await bindFile(portable(TEST_PATH));

  const candidateManifest = JSON.parse(
    await readFile(resolveProjectPath(INPUT_PATHS.candidateManifest), "utf8"),
  );
  invariant(
    candidateManifest.animationId === ANIMATION_ID,
    "candidate manifest animationId changed",
  );
  invariant(
    candidateManifest.classification ===
      "source-static-current-javascript-engineering-candidate-only",
    "candidate manifest classification changed",
  );
  invariant(
    candidateManifest.status ===
      "unregistered-acceptance-neutral-engineering-artifact",
    "candidate manifest status changed",
  );
  invariant(
    candidateManifest.source?.swf?.sha256 === SOURCE_SWF_SHA256 &&
      candidateManifest.source?.fla?.sha256 === SOURCE_FLA_SHA256,
    "candidate manifest source bindings changed",
  );
  invariant(
    candidateManifest.output?.sha256 === CANVAS_ASSET_SHA256 &&
      candidateManifest.output?.registeredInProductRegistry === false,
    "candidate output binding or registry status changed",
  );
  invariant(
    candidateManifest.timeline?.nativeStage?.width === STAGE.width &&
      candidateManifest.timeline?.nativeStage?.height === STAGE.height &&
      candidateManifest.timeline?.nativeStage?.backgroundColor ===
        STAGE.backgroundColor &&
      candidateManifest.timeline?.sourceStaticFrameDomain?.timelineId ===
        FRAME_DOMAIN &&
      candidateManifest.timeline?.sourceStaticFrameDomain?.frameCount === 70 &&
      candidateManifest.timeline?.rootFrameCount === 10 &&
      candidateManifest.timeline?.rootBeginFrame === ROOT_FRAME,
    "candidate stage or timeline binding changed",
  );
  invariant(
    candidateManifest.timeline?.naturalRuntimeReachabilityEstablished === false,
    "candidate manifest promoted natural-runtime reachability",
  );
  invariant(
    candidateManifest.runtimeBoundary?.actionScriptExecuted === false &&
      candidateManifest.runtimeBoundary?.audioRendered === false &&
      candidateManifest.runtimeBoundary?.controlsEnabled === false &&
      candidateManifest.runtimeBoundary?.naturalRuntimeEstablished === false &&
      candidateManifest.runtimeBoundary?.replayParityEstablished === false &&
      candidateManifest.runtimeBoundary?.fullFrameFidelityEstablished === false &&
      Array.isArray(candidateManifest.runtimeBoundary?.audioCues) &&
      candidateManifest.runtimeBoundary.audioCues.length === 0,
    "candidate runtime boundary was promoted",
  );
  invariant(
    candidateManifest.strictAcceptanceEffect === "none" &&
      candidateManifest.migrationStatusChanged === false &&
      candidateManifest.registryChanged === false,
    "candidate acceptance or registry effect changed",
  );
  invariant(
    candidateManifest.acceptanceEffects &&
      Object.values(candidateManifest.acceptanceEffects).every(
        (value) => value === false,
      ),
    "candidate acceptanceEffects contains a promoted claim",
  );
  const sequence = candidateManifest.browserQa?.fullFrameVisualSequence;
  invariant(
    sequence?.frameDomain === FRAME_DOMAIN &&
      sequence?.frameCount === 70 &&
      sequence?.comparisonMethod === "full-canvas-rgba-byte-equality" &&
      Array.isArray(sequence.transitionStartFrames),
    "candidate browser sequence metadata changed",
  );
  const transitions = new Set(sequence.transitionStartFrames);
  for (let frame = 2; frame <= 27; frame += 1) {
    invariant(transitions.has(frame), `candidate transition frame ${frame} is absent`);
  }
  for (let frame = 28; frame <= 43; frame += 1) {
    invariant(!transitions.has(frame), `candidate plateau frame ${frame} changed`);
  }
  for (let frame = 44; frame <= 70; frame += 1) {
    invariant(transitions.has(frame), `candidate transition frame ${frame} is absent`);
  }

  for (const key of [
    "prototypeRegistry",
    "generatedRegistry",
    "prototypeManifest",
    "wholeLessonRegistry",
  ]) {
    const registryText = await readFile(
      resolveProjectPath(INPUT_PATHS[key]),
      "utf8",
    );
    invariant(
      !registryText.includes(ANIMATION_ID),
      `${INPUT_PATHS[key]} unexpectedly registers ${ANIMATION_ID}`,
    );
  }

  return {bindings: Object.freeze(bindings), candidateManifest, sequence};
}

function buildHarnessEntry(identity) {
  return `
import React from "react";
import {createRoot} from "react-dom/client";
import {
  CourseG04L10Fq002Renderer,
  getCourseG04L10Fq002FrameState,
} from "./packages/demos/src/modules/course-g04-l10-fq-002.tsx";

const expected = Object.freeze(${JSON.stringify({
    animationId: ANIMATION_ID,
    frameDomain: identity.frameDomain,
    requirementId: identity.requirementId,
    traceId: identity.traceId,
    entryStateSha256: identity.entryStateSha256,
    scenario: identity.scenario,
    lang: identity.language,
    seed: identity.seed,
  })});
const params = new URLSearchParams(window.location.search);
const frame = Number(params.get("frame"));
const observed = {
  frameDomain: params.get("frameDomain"),
  requirementId: params.get("requirementId"),
  traceId: params.get("trace"),
  entryStateSha256: params.get("entryStateSha256"),
  scenario: params.get("scenario"),
  lang: params.get("lang"),
  seed: Number(params.get("seed")),
};
if (!${JSON.stringify(CAPTURE_FRAMES)}.includes(frame)) {
  throw new Error("diagnostic frame is outside the seven-frame contract");
}
for (const key of Object.keys(observed)) {
  if (observed[key] !== expected[key]) {
    throw new Error("diagnostic identity mismatch: " + key);
  }
}
const state = getCourseG04L10Fq002FrameState(frame, {
  entryStateSha256: expected.entryStateSha256,
  frameDomain: expected.frameDomain,
  lang: expected.lang,
  requirementId: expected.requirementId,
  scenario: expected.scenario,
  seed: expected.seed,
  traceId: expected.traceId,
});
if (state.status !== "ready") {
  throw new Error("candidate failed closed for an expected English source-static frame");
}
globalThis.__HELP_MATH_FQ002_DIAGNOSTIC__ = Object.freeze({expected, frame, state});
createRoot(document.getElementById("app")).render(
  React.createElement(CourseG04L10Fq002Renderer, {
    entryStateSha256: expected.entryStateSha256,
    frame,
    frameDomain: expected.frameDomain,
    lang: expected.lang,
    requirementId: expected.requirementId,
    scenario: expected.scenario,
    seed: expected.seed,
    state,
    traceId: expected.traceId,
  }),
);
`;
}

async function buildHarnessBundle(identity) {
  const result = await build({
    absWorkingDir: PROJECT_ROOT,
    bundle: true,
    define: {"process.env.NODE_ENV": '"production"'},
    format: "iife",
    logLevel: "silent",
    minify: false,
    platform: "browser",
    sourcemap: false,
    stdin: {
      contents: buildHarnessEntry(identity),
      loader: "tsx",
      resolveDir: PROJECT_ROOT,
      sourcefile: "fq002-current-js-engineering-diagnostic-entry.tsx",
    },
    target: ["chrome120"],
    write: false,
  });
  invariant(result.outputFiles?.length === 1, "harness build did not emit one bundle");
  return result.outputFiles[0].contents;
}

function harnessHtml() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="robots" content="noindex,nofollow,noarchive,noimageindex">
  <link rel="icon" href="data:,">
  <title>FQ002 current-JavaScript engineering diagnostic</title>
  <style>
    html,body{margin:0;min-height:100%;background:#fff;color:#17344c;font-family:Arial,sans-serif}
    body{display:flex;justify-content:center}
    #app{width:800px}
  </style>
  <script defer src="/bundle.js"></script>
</head>
<body><main id="app"></main></body>
</html>`;
}

async function startHarnessServer({bundleBytes, assetBytes}) {
  const requestLog = [];
  const htmlBytes = Buffer.from(harnessHtml(), "utf8");
  const server = createServer((request, response) => {
    const host = request.headers.host || "127.0.0.1";
    const url = new URL(request.url || "/", `http://${host}`);
    let status = 404;
    let body = Buffer.from("not found\n", "utf8");
    let contentType = "text/plain; charset=utf-8";
    if (request.method === "GET" && url.pathname === "/harness") {
      status = 200;
      body = htmlBytes;
      contentType = "text/html; charset=utf-8";
    } else if (request.method === "GET" && url.pathname === "/bundle.js") {
      status = 200;
      body = bundleBytes;
      contentType = "text/javascript; charset=utf-8";
    } else if (request.method === "GET" && url.pathname === ASSET_ROUTE) {
      status = 200;
      body = assetBytes;
      contentType = "text/javascript; charset=utf-8";
      response.setHeader("Access-Control-Allow-Origin", "*");
    }
    response.statusCode = status;
    response.setHeader("Cache-Control", "private, no-store, max-age=0");
    response.setHeader("Content-Type", contentType);
    response.setHeader("Cross-Origin-Resource-Policy", "same-origin");
    response.setHeader("X-Content-Type-Options", "nosniff");
    if (url.pathname === "/harness") {
      response.setHeader(
        "Content-Security-Policy",
        "default-src 'none'; script-src 'self'; img-src data:; style-src 'unsafe-inline'; connect-src 'none'; object-src 'none'; frame-ancestors 'none'; base-uri 'none'",
      );
    }
    requestLog.push({
      method: request.method || null,
      pathname: url.pathname,
      search: url.search,
      status,
      responseBytes: body.length,
    });
    response.end(body);
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  invariant(address && typeof address === "object", "harness server has no address");
  return {
    origin: `http://127.0.0.1:${address.port}`,
    requestLog,
    close: () => new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    }),
  };
}

function createBrowserDiagnostics() {
  return {
    consoleErrors: [],
    consoleWarnings: [],
    pageErrors: [],
    failedRequests: [],
    httpErrors: [],
    unexpectedRequests: [],
    requests: [],
  };
}

function observePage(page, origin, diagnostics) {
  const allowedPaths = new Set(["/harness", "/bundle.js", ASSET_ROUTE]);
  page.on("console", (message) => {
    const record = {url: page.url(), text: message.text()};
    if (message.type() === "error") diagnostics.consoleErrors.push(record);
    if (message.type() === "warning") diagnostics.consoleWarnings.push(record);
  });
  page.on("pageerror", (error) => {
    diagnostics.pageErrors.push({url: page.url(), text: error.message});
  });
  page.on("request", (request) => {
    const url = request.url();
    let allowed = false;
    try {
      const parsed = new URL(url);
      allowed =
        parsed.origin === origin &&
        allowedPaths.has(parsed.pathname) &&
        request.method() === "GET";
      diagnostics.requests.push({
        method: request.method(),
        pathname: parsed.pathname,
        search: parsed.search,
        resourceType: request.resourceType(),
        allowed,
      });
    } catch {
      diagnostics.requests.push({
        method: request.method(),
        url,
        resourceType: request.resourceType(),
        allowed: false,
      });
    }
    if (!allowed) diagnostics.unexpectedRequests.push({method: request.method(), url});
  });
  page.on("requestfailed", (request) => {
    diagnostics.failedRequests.push({
      method: request.method(),
      url: request.url(),
      error: request.failure()?.errorText || "unknown",
    });
  });
  page.on("response", (response) => {
    if (response.status() >= 400) {
      diagnostics.httpErrors.push({url: response.url(), status: response.status()});
    }
  });
}

function captureUrl(origin, frame, identity) {
  const query = new URLSearchParams({
    frame: String(frame),
    frameDomain: identity.frameDomain,
    requirementId: identity.requirementId,
    trace: identity.traceId,
    entryStateSha256: identity.entryStateSha256,
    scenario: identity.scenario,
    lang: identity.language,
    seed: String(identity.seed),
  });
  return `${origin}/harness?${query}`;
}

function expectedCanvasAttributes(frame, identity) {
  return Object.freeze({
    "data-animation-id": ANIMATION_ID,
    "data-candidate-status": "source-static-engineering-not-strict",
    "data-capture-identity-status": "verified",
    "data-capture-stage": "true",
    "data-render-state": "ready",
    "data-render-visual": "true",
    "data-flash-entry-state-sha256": identity.entryStateSha256,
    "data-flash-frame": String(frame),
    "data-flash-frame-domain": identity.frameDomain,
    "data-flash-lang": identity.language,
    "data-flash-native-stage-height": String(STAGE.height),
    "data-flash-native-stage-width": String(STAGE.width),
    "data-flash-requirement-id": identity.requirementId,
    "data-flash-root-frame": String(ROOT_FRAME),
    "data-flash-scenario": identity.scenario,
    "data-flash-seed": String(identity.seed),
    "data-flash-trace-id": identity.traceId,
    "data-runtime-language": identity.language,
    "data-runtime-scenario": identity.scenario,
    "data-runtime-seed": String(identity.seed),
    "data-canvas-backing-height": String(STAGE.height),
    "data-canvas-backing-width": String(STAGE.width),
    "data-source-controls-enabled": "false",
  });
}

async function inspectStage(page, frame, identity) {
  const expectedAttributes = expectedCanvasAttributes(frame, identity);
  return page.evaluate(
    ({expectedAttributes: expected, expectedFrame}) => {
      const canvas = document.querySelector("canvas.faithful-stage-wrap");
      const section = document.querySelector(
        "section[data-candidate-status='source-static-engineering-not-strict']",
      );
      const assetScript = document.querySelector(
        "script[data-help-math-canvas-asset='course-g04-l10-fq-002']",
      );
      if (!(canvas instanceof HTMLCanvasElement)) {
        throw new Error("diagnostic canvas is absent");
      }
      const rectangle = canvas.getBoundingClientRect();
      const attributes = {};
      for (const name of Object.keys(expected)) {
        attributes[name] = canvas.getAttribute(name);
      }
      const diagnostic = globalThis.__HELP_MATH_FQ002_DIAGNOSTIC__;
      return {
        expectedFrame,
        attributes,
        backingStage: {width: canvas.width, height: canvas.height},
        cssStage: {width: rectangle.width, height: rectangle.height},
        computed: {
          display: getComputedStyle(canvas).display,
          pointerEvents: getComputedStyle(canvas).pointerEvents,
        },
        candidateBoundary: section
          ? {
              audioRendered: section.getAttribute("data-audio-rendered"),
              authoritativeRuntimeValidated: section.getAttribute(
                "data-authoritative-runtime-validated",
              ),
              canvasStatus: section.getAttribute("data-canvas-status"),
              humanVisualReviewAccepted: section.getAttribute(
                "data-human-visual-review-accepted",
              ),
              interactiveControlsEnabled: section.getAttribute(
                "data-interactive-controls-enabled",
              ),
              ownerAccepted: section.getAttribute("data-owner-accepted"),
              strictMigrationComplete: section.getAttribute(
                "data-strict-migration-complete",
              ),
            }
          : null,
        assetScript: assetScript
          ? {
              src: assetScript.getAttribute("src"),
              integrity: assetScript.getAttribute("integrity"),
              crossOrigin: assetScript.getAttribute("crossorigin"),
              sha256: assetScript.getAttribute("data-help-math-canvas-sha256"),
            }
          : null,
        diagnosticState: diagnostic
          ? {
              frame: diagnostic.frame,
              animationId: diagnostic.state?.animationId,
              status: diagnostic.state?.status,
              blocker: diagnostic.state?.blocker,
              frameDomain: diagnostic.state?.frameDomain,
              requirementId: diagnostic.state?.requirementId,
              traceId: diagnostic.state?.traceId,
              entryStateSha256: diagnostic.state?.entryStateSha256,
              scenario: diagnostic.state?.scenario,
              language: diagnostic.state?.language,
              seed: diagnostic.state?.seed,
              rootFrame: diagnostic.state?.rootFrame,
              interactiveControlsEnabled:
                diagnostic.state?.interactiveControlsEnabled,
              sourceHostBehaviorResolved:
                diagnostic.state?.sourceHostBehaviorResolved,
              naturalRuntimeEstablished:
                diagnostic.state?.naturalRuntimeEstablished,
              audioRendered: diagnostic.state?.audioRendered,
            }
          : null,
      };
    },
    {expectedAttributes, expectedFrame: frame},
  );
}

function validateStageObservation(observation, frame, identity) {
  const expectedAttributes = expectedCanvasAttributes(frame, identity);
  for (const [name, expected] of Object.entries(expectedAttributes)) {
    invariant(
      observation.attributes?.[name] === expected,
      `frame ${frame}: ${name} expected ${expected}, observed ${observation.attributes?.[name]}`,
    );
  }
  invariant(
    observation.backingStage?.width === STAGE.width &&
      observation.backingStage?.height === STAGE.height &&
      observation.cssStage?.width === STAGE.width &&
      observation.cssStage?.height === STAGE.height,
    `frame ${frame}: stage is not exact native 800x600`,
  );
  invariant(
    observation.computed?.display === "block" &&
      observation.computed?.pointerEvents === "none",
    `frame ${frame}: rendered canvas display/pointer boundary changed`,
  );
  const boundary = observation.candidateBoundary;
  invariant(boundary, `frame ${frame}: candidate boundary is absent`);
  invariant(
    boundary.audioRendered === "false" &&
      boundary.authoritativeRuntimeValidated === "false" &&
      boundary.canvasStatus === "ready" &&
      boundary.humanVisualReviewAccepted === "false" &&
      boundary.interactiveControlsEnabled === "false" &&
      boundary.ownerAccepted === "false" &&
      boundary.strictMigrationComplete === "false",
    `frame ${frame}: candidate authority boundary changed`,
  );
  const expectedIntegrity = `sha256-${Buffer.from(
    CANVAS_ASSET_SHA256,
    "hex",
  ).toString("base64")}`;
  invariant(
    observation.assetScript?.src ===
      `${ASSET_ROUTE}?sha256=${CANVAS_ASSET_SHA256}` &&
      observation.assetScript?.integrity === expectedIntegrity &&
      observation.assetScript?.crossOrigin === "anonymous" &&
      observation.assetScript?.sha256 === CANVAS_ASSET_SHA256,
    `frame ${frame}: same-origin SRI asset binding changed`,
  );
  const state = observation.diagnosticState;
  invariant(
    state?.frame === frame &&
      state.animationId === ANIMATION_ID &&
      state.status === "ready" &&
      state.blocker === null &&
      state.frameDomain === identity.frameDomain &&
      state.requirementId === identity.requirementId &&
      state.traceId === identity.traceId &&
      state.entryStateSha256 === identity.entryStateSha256 &&
      state.scenario === identity.scenario &&
      state.language === identity.language &&
      state.seed === identity.seed &&
      state.rootFrame === ROOT_FRAME &&
      state.interactiveControlsEnabled === false &&
      state.sourceHostBehaviorResolved === false &&
      state.naturalRuntimeEstablished === false &&
      state.audioRendered === false,
    `frame ${frame}: pure candidate state identity or authority boundary changed`,
  );
}

function inspectPng(bytes, frame) {
  const image = PNG.sync.read(bytes);
  invariant(
    image.width === STAGE.width && image.height === STAGE.height,
    `frame ${frame}: PNG is ${image.width}x${image.height}, expected 800x600`,
  );
  const background = [184, 216, 247];
  let opaquePixels = 0;
  let nonBackgroundPixels = 0;
  for (let offset = 0; offset < image.data.length; offset += 4) {
    if (image.data[offset + 3] === 255) opaquePixels += 1;
    if (
      image.data[offset] !== background[0] ||
      image.data[offset + 1] !== background[1] ||
      image.data[offset + 2] !== background[2]
    ) {
      nonBackgroundPixels += 1;
    }
  }
  invariant(
    opaquePixels === STAGE.width * STAGE.height,
    `frame ${frame}: PNG contains non-opaque pixels`,
  );
  return {
    image,
    width: image.width,
    height: image.height,
    opaquePixelCount: opaquePixels,
    nonBackgroundPixelCount: nonBackgroundPixels,
    nonBackgroundPixelRatio: nonBackgroundPixels / (image.width * image.height),
  };
}

function compareCandidateFrames(left, right) {
  invariant(
    left.width === right.width && left.height === right.height,
    "candidate frame comparison dimensions differ",
  );
  let changedPixels = 0;
  for (let offset = 0; offset < left.data.length; offset += 4) {
    if (
      left.data[offset] !== right.data[offset] ||
      left.data[offset + 1] !== right.data[offset + 1] ||
      left.data[offset + 2] !== right.data[offset + 2] ||
      left.data[offset + 3] !== right.data[offset + 3]
    ) {
      changedPixels += 1;
    }
  }
  return {
    rgbaByteIdentical: changedPixels === 0,
    changedPixelCount: changedPixels,
    changedPixelRatio: changedPixels / (left.width * left.height),
  };
}

function validateTemporalBoundarySamples(frames) {
  const byFrame = new Map(frames.map((entry) => [entry.frame, entry]));
  const pairs = [
    {left: 1, right: 2, expectedIdentical: false, role: "first-transition-boundary"},
    {left: 27, right: 28, expectedIdentical: true, role: "first-transition-to-plateau-boundary"},
    {left: 28, right: 43, expectedIdentical: true, role: "static-plateau-endpoints"},
    {left: 43, right: 44, expectedIdentical: false, role: "second-transition-boundary"},
    {left: 44, right: 70, expectedIdentical: false, role: "second-transition-span"},
  ];
  return pairs.map((pair) => {
    const left = byFrame.get(pair.left);
    const right = byFrame.get(pair.right);
    invariant(left && right, `temporal pair ${pair.left}/${pair.right} is absent`);
    const comparison = compareCandidateFrames(left.image, right.image);
    invariant(
      comparison.rgbaByteIdentical === pair.expectedIdentical,
      `current-JS temporal boundary ${pair.left}/${pair.right} changed disposition`,
    );
    return {
      ...pair,
      ...comparison,
      authority:
        "current-JavaScript candidate raster relationship only; not an original-runtime comparison or RMSE acceptance result",
    };
  });
}

async function writeExclusive(file, bytes) {
  await writeFile(file, bytes, {flag: "wx", mode: 0o444});
}

async function freezeTree(root) {
  for (const entry of await readdir(root, {withFileTypes: true})) {
    const absolutePath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      await freezeTree(absolutePath);
      await chmod(absolutePath, 0o555);
    } else {
      await chmod(absolutePath, 0o444);
    }
  }
  await chmod(root, 0o555);
}

export function validateCaptureManifestShape(manifest) {
  invariant(manifest?.schemaVersion === 1, "capture manifest schema changed");
  invariant(manifest.artifactType === ARTIFACT_TYPE, "capture manifest type changed");
  invariant(manifest.animationId === ANIMATION_ID, "capture manifest animation changed");
  invariant(manifest.status === "pass", "capture manifest status is not pass");
  invariant(
    manifest.classification === AUTHORITY_BOUNDARY.classification &&
      manifest.acceptanceEffect === "none",
    "capture manifest classification or acceptance effect changed",
  );
  invariant(
    manifest.authorityBoundary?.currentJavascriptCandidateOnly === true,
    "capture manifest is not candidate-only",
  );
  for (const key of EXPECTED_AUTHORITY_FALSE_KEYS) {
    invariant(
      manifest.authorityBoundary?.[key] === false,
      `capture manifest promoted ${key}`,
    );
  }
  invariant(
    JSON.stringify(manifest.capturePlan?.frames) === JSON.stringify(CAPTURE_FRAMES),
    "capture manifest frame set changed",
  );
  invariant(
    manifest.capturePlan?.nativeStage?.width === STAGE.width &&
      manifest.capturePlan?.nativeStage?.height === STAGE.height &&
      manifest.capturePlan?.deviceScaleFactor === 1,
    "capture manifest native stage changed",
  );
  invariant(
    Array.isArray(manifest.captures) &&
      manifest.captures.length === CAPTURE_FRAMES.length,
    "capture manifest does not contain seven captures",
  );
  invariant(
    manifest.captures.every(
      (capture, index) =>
        capture.frame === CAPTURE_FRAMES[index] &&
        capture.width === STAGE.width &&
        capture.height === STAGE.height &&
        capture.identityVerified === true &&
        capture.authorityBoundaryVerified === true &&
        /^[a-f0-9]{64}$/.test(capture.sha256),
    ),
    "capture manifest has an invalid frame row",
  );
  invariant(
    manifest.browserDiagnostics?.consoleErrors?.length === 0 &&
      manifest.browserDiagnostics?.pageErrors?.length === 0 &&
      manifest.browserDiagnostics?.failedRequests?.length === 0 &&
      manifest.browserDiagnostics?.httpErrors?.length === 0 &&
      manifest.browserDiagnostics?.unexpectedRequests?.length === 0,
    "capture manifest contains a browser or network failure",
  );
  invariant(
    manifest.assertions?.every((assertion) => assertion.pass === true),
    "capture manifest contains a failed assertion",
  );
  return true;
}

async function buildCurrentBindings() {
  const {bindings} = await loadAndValidateInputs();
  return bindings;
}

export async function checkStoredArtifact() {
  const manifestPath = path.join(OUTPUT_ROOT, "capture-manifest.json");
  const manifestBytes = await readFile(manifestPath);
  const manifest = JSON.parse(manifestBytes);
  validateCaptureManifestShape(manifest);

  const observedFiles = (await readdir(OUTPUT_ROOT)).sort();
  invariant(
    JSON.stringify(observedFiles) ===
      JSON.stringify([...EXPECTED_OUTPUT_FILES].sort()),
    `immutable output file set changed: ${observedFiles.join(", ")}`,
  );
  const rootStat = await stat(OUTPUT_ROOT);
  invariant((rootStat.mode & 0o777) === 0o555, "output root mode is not 0555");
  invariant(
    (await stat(manifestPath)).mode & 0o222 ? false : true,
    "capture manifest is writable",
  );

  const currentBindings = await buildCurrentBindings();
  for (const [key, current] of Object.entries(currentBindings)) {
    const stored = manifest.bindings?.[key];
    invariant(stored, `capture manifest binding ${key} is absent`);
    invariant(
      stored.path === current.path &&
        stored.bytes === current.bytes &&
        stored.sha256 === current.sha256,
      `capture manifest binding ${key} is stale`,
    );
  }

  const identity = buildDiagnosticIdentity();
  invariant(
    manifest.captureIdentity?.requirementId === identity.requirementId &&
      manifest.captureIdentity?.traceId === identity.traceId &&
      manifest.captureIdentity?.entryStateSha256 === identity.entryStateSha256 &&
      manifest.captureIdentity?.entryStateAuthority ===
        "diagnostic-local-current-js-entry-state-only-not-original-runtime",
    "capture manifest diagnostic identity changed",
  );

  const bundleBytes = await buildHarnessBundle(identity);
  invariant(
    manifest.harness?.bundleBytes === bundleBytes.length &&
      manifest.harness?.bundleSha256 === sha256(bundleBytes),
    "capture manifest harness bundle is stale",
  );

  for (const capture of manifest.captures) {
    const absolutePath = path.join(OUTPUT_ROOT, capture.file);
    const bytes = await readFile(absolutePath);
    invariant(
      sha256(bytes) === capture.sha256 && bytes.length === capture.bytes,
      `${capture.file}: PNG binding changed`,
    );
    const fileStat = await stat(absolutePath);
    invariant((fileStat.mode & 0o777) === 0o444, `${capture.file}: mode is not 0444`);
    const inspected = inspectPng(bytes, capture.frame);
    invariant(
      inspected.nonBackgroundPixelCount === capture.nonBackgroundPixelCount &&
        inspected.opaquePixelCount === capture.opaquePixelCount,
      `${capture.file}: PNG pixel census changed`,
    );
  }

  return Object.freeze({
    output: portable(OUTPUT_ROOT),
    manifest: portable(manifestPath),
    manifestSha256: sha256(manifestBytes),
    status: manifest.status,
    captureCount: manifest.captures.length,
    authorityBoundary: manifest.authorityBoundary,
  });
}

async function generateArtifact() {
  invariant(
    !(await pathExists(OUTPUT_ROOT)),
    `immutable output already exists: ${portable(OUTPUT_ROOT)}; use --check`,
  );
  const {bindings, sequence} = await loadAndValidateInputs();
  const identity = buildDiagnosticIdentity();
  const bundleBytes = await buildHarnessBundle(identity);
  const assetBytes = await readFile(resolveProjectPath(INPUT_PATHS.canvasAsset));
  invariant(sha256(assetBytes) === CANVAS_ASSET_SHA256, "canvas asset changed after input validation");

  await mkdir(path.dirname(OUTPUT_ROOT), {recursive: true});
  const temporaryRoot = await mkdtemp(
    path.join(path.dirname(OUTPUT_ROOT), `.${ARTIFACT_TYPE}-tmp-`),
  );
  let server = null;
  let browser = null;
  try {
    server = await startHarnessServer({bundleBytes, assetBytes});
    const diagnostics = createBrowserDiagnostics();
    browser = await chromium.launch({headless: true});
    const context = await browser.newContext({
      deviceScaleFactor: 1,
      reducedMotion: "reduce",
      viewport: {width: 1000, height: 800},
    });
    await context.route("**/*", async (route) => {
      const request = route.request();
      let allowed = false;
      try {
        const parsed = new URL(request.url());
        allowed =
          parsed.origin === server.origin &&
          ["/harness", "/bundle.js", ASSET_ROUTE].includes(parsed.pathname) &&
          request.method() === "GET";
      } catch {
        allowed = false;
      }
      if (allowed) await route.continue();
      else await route.abort("blockedbyclient");
    });

    const captures = [];
    const inMemoryFrames = [];
    for (const frame of CAPTURE_FRAMES) {
      const page = await context.newPage();
      observePage(page, server.origin, diagnostics);
      const response = await page.goto(captureUrl(server.origin, frame, identity), {
        waitUntil: "domcontentloaded",
        timeout: 60_000,
      });
      invariant(response?.status() === 200, `frame ${frame}: harness HTTP status is not 200`);
      const canvas = page.locator(
        "canvas.faithful-stage-wrap[data-capture-stage='true'][data-capture-identity-status='verified']",
      );
      await canvas.waitFor({state: "visible", timeout: 60_000});
      await page.waitForFunction(
        ({expectedFrame, expectedDomain}) => {
          const target = document.querySelector("canvas.faithful-stage-wrap");
          return target?.getAttribute("data-flash-frame") === String(expectedFrame) &&
            target?.getAttribute("data-flash-frame-domain") === expectedDomain &&
            target?.getAttribute("data-render-state") === "ready";
        },
        {expectedFrame: frame, expectedDomain: identity.frameDomain},
        {timeout: 60_000},
      );
      const before = await inspectStage(page, frame, identity);
      validateStageObservation(before, frame, identity);
      await page.waitForTimeout(80);
      const after = await inspectStage(page, frame, identity);
      validateStageObservation(after, frame, identity);
      invariant(
        JSON.stringify(before) === JSON.stringify(after),
        `frame ${frame}: deterministic identity drifted before capture`,
      );

      const filename = `frame-${String(frame).padStart(4, "0")}.png`;
      const target = path.join(temporaryRoot, filename);
      await canvas.screenshot({
        animations: "disabled",
        path: target,
        timeout: 60_000,
      });
      const pngBytes = await readFile(target);
      const png = inspectPng(pngBytes, frame);
      await chmod(target, 0o444);
      captures.push({
        frame,
        file: filename,
        bytes: pngBytes.length,
        sha256: sha256(pngBytes),
        width: png.width,
        height: png.height,
        opaquePixelCount: png.opaquePixelCount,
        nonBackgroundPixelCount: png.nonBackgroundPixelCount,
        nonBackgroundPixelRatio: png.nonBackgroundPixelRatio,
        identityVerified: true,
        authorityBoundaryVerified: true,
        before,
        after,
      });
      inMemoryFrames.push({frame, image: png.image});
      await page.close();
    }
    await context.close();
    const browserVersion = browser.version();
    await browser.close();
    browser = null;
    await server.close();
    const serverRequestLog = server.requestLog;
    server = null;

    invariant(
      diagnostics.consoleErrors.length === 0 &&
        diagnostics.pageErrors.length === 0 &&
        diagnostics.failedRequests.length === 0 &&
        diagnostics.httpErrors.length === 0 &&
        diagnostics.unexpectedRequests.length === 0,
      "browser or network diagnostic contains a failure",
    );
    invariant(
      diagnostics.requests.length === CAPTURE_FRAMES.length * 3 &&
        diagnostics.requests.every((request) => request.allowed === true),
      `unexpected browser request count or disposition: ${diagnostics.requests.length}`,
    );
    invariant(
      serverRequestLog.length === CAPTURE_FRAMES.length * 3 &&
        serverRequestLog.every(
          (request) =>
            request.method === "GET" &&
            request.status === 200 &&
            ["/harness", "/bundle.js", ASSET_ROUTE].includes(request.pathname),
        ),
      `unexpected harness server request count or disposition: ${serverRequestLog.length}`,
    );
    const temporalBoundarySamples = validateTemporalBoundarySamples(inMemoryFrames);

    const assertions = [
      {
        id: "seven-requested-native-current-js-frames-captured",
        pass:
          captures.length === CAPTURE_FRAMES.length &&
          captures.every(
            (capture, index) =>
              capture.frame === CAPTURE_FRAMES[index] &&
              capture.width === STAGE.width &&
              capture.height === STAGE.height,
          ),
      },
      {
        id: "pure-state-dom-and-canvas-identity-exact-before-and-after-capture",
        pass: captures.every(
          (capture) =>
            capture.identityVerified === true &&
            JSON.stringify(capture.before) === JSON.stringify(capture.after),
        ),
      },
      {
        id: "candidate-authority-boundary-remains-false",
        pass: captures.every(
          (capture) => capture.authorityBoundaryVerified === true,
        ),
      },
      {
        id: "same-origin-hash-bound-sri-asset-loaded-without-fallback",
        pass: captures.every(
          (capture) =>
            capture.before.assetScript?.sha256 === CANVAS_ASSET_SHA256,
        ),
      },
      {
        id: "console-page-request-and-http-errors-zero",
        pass:
          diagnostics.consoleErrors.length === 0 &&
          diagnostics.pageErrors.length === 0 &&
          diagnostics.failedRequests.length === 0 &&
          diagnostics.httpErrors.length === 0,
      },
      {
        id: "network-contained-to-three-local-get-resources-per-frame",
        pass:
          diagnostics.unexpectedRequests.length === 0 &&
          diagnostics.requests.length === CAPTURE_FRAMES.length * 3 &&
          serverRequestLog.length === CAPTURE_FRAMES.length * 3,
      },
      {
        id: "source-declared-current-js-transition-boundaries-reproduced",
        pass: temporalBoundarySamples.every(
          (sample) => sample.rgbaByteIdentical === sample.expectedIdentical,
        ),
      },
      {
        id: "candidate-remains-absent-from-product-and-whole-lesson-registries",
        pass: true,
      },
      {
        id: "no-original-runtime-rmse-human-owner-strict-or-release-effect",
        pass:
          EXPECTED_AUTHORITY_FALSE_KEYS.every(
            (key) => AUTHORITY_BOUNDARY[key] === false,
          ) && AUTHORITY_BOUNDARY.acceptanceEffect === "none",
      },
    ];
    invariant(assertions.every((assertion) => assertion.pass), "diagnostic assertion failed");

    const manifest = {
      schemaVersion: 1,
      artifactType: ARTIFACT_TYPE,
      animationId: ANIMATION_ID,
      generatedAt: new Date().toISOString(),
      status: "pass",
      classification: AUTHORITY_BOUNDARY.classification,
      acceptanceEffect: "none",
      scope:
        "Seven-frame native source-static current-JavaScript engineering diagnostic for the unregistered FQ002 candidate",
      authorityBoundary: AUTHORITY_BOUNDARY,
      bindings,
      source: {
        swf: bindings.sourceSwf,
        fla: bindings.sourceFla,
        sourcePairingStatus: "paired-canonical-source-present",
        sourceCustodyOnly: true,
      },
      candidate: {
        registered: false,
        actionScriptExecuted: false,
        controlsEnabled: false,
        audioCues: [],
        SpanishVisualStatus: "unresolved-disabled",
        naturalRuntimeEstablished: false,
        replayParityEstablished: false,
        fullFrameFidelityEstablished: false,
        strictAcceptanceEffect: "none",
      },
      captureIdentity: {
        requirementId: identity.requirementId,
        traceId: identity.traceId,
        entryStateSha256: identity.entryStateSha256,
        entryStateDescriptor: identity.entryStateDescriptor,
        entryStateDescriptorBytes: identity.entryStateDescriptorBytes,
        entryStateAuthority:
          "diagnostic-local-current-js-entry-state-only-not-original-runtime",
        frameDomain: identity.frameDomain,
        scenario: identity.scenario,
        language: identity.language,
        seed: identity.seed,
      },
      capturePlan: {
        frames: CAPTURE_FRAMES,
        frameSelectionBasis:
          "candidate-manifest current-JS transition starts 2..27 and 44..70, with plateau 28..43",
        nativeStage: STAGE,
        backingStage: {width: STAGE.width, height: STAGE.height},
        fps: 12,
        rootFrameCount: 10,
        rootPlacementFrame: ROOT_FRAME,
        frameDomain: FRAME_DOMAIN,
        frameDomainCount: 70,
        viewport: {width: 1000, height: 800},
        deviceScaleFactor: 1,
        reducedMotion: "reduce",
        screenshotTarget: "canvas.faithful-stage-wrap",
      },
      sourceCurrentJsSequenceBinding: {
        comparisonMethod: sequence.comparisonMethod,
        comparedConsecutivePairCount: sequence.comparedConsecutivePairCount,
        byteIdenticalToPreviousFrameCount:
          sequence.byteIdenticalToPreviousFrameCount,
        changedFromPreviousFrameCount: sequence.changedFromPreviousFrameCount,
        transitionStartFrames: sequence.transitionStartFrames,
        authority:
          "pre-existing current-JavaScript candidate raster census only; not original-runtime evidence",
      },
      harness: {
        executionSurface: "ephemeral-loopback-esbuild-react-harness",
        bundleBytes: bundleBytes.length,
        bundleSha256: sha256(bundleBytes),
        assetRoute: ASSET_ROUTE,
        assetSha256: CANVAS_ASSET_SHA256,
        contentSecurityPolicy:
          "default-src none; self scripts; data images; no connect/object/frame ancestors/base",
      },
      environment: {
        browser: `Chromium ${browserVersion}`,
        browserMode: "headless",
        playwright: "repository-pinned @playwright/test",
        esbuild: "repository-resolved",
        server: "ephemeral-loopback-only",
        originRetained: false,
      },
      captures,
      temporalBoundarySamples,
      browserDiagnostics: {
        ...diagnostics,
        serverRequests: serverRequestLog,
      },
      assertions,
      unresolved: [
        "No authorized original-runtime capture or natural trace is present.",
        "No original-runtime/current-JS full-frame pair or RMSE comparison is present.",
        "Spanish visuals and English/Spanish audio cue binding, listening, and synchronization remain unresolved and disabled.",
        "ActionScript controls, host behavior, terminal state, and Replay parity remain unresolved and disabled.",
        "Human visual review and owner acceptance remain pending; no reviewer identity or signature was created.",
        "The candidate remains unregistered and has no whole-lesson, strict-completion, release-ledger, or publication effect.",
      ],
    };
    validateCaptureManifestShape(manifest);
    const manifestBytes = Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`, "utf8");
    await writeExclusive(path.join(temporaryRoot, "capture-manifest.json"), manifestBytes);
    await freezeTree(temporaryRoot);
    await rename(temporaryRoot, OUTPUT_ROOT);
    const checked = await checkStoredArtifact();
    return checked;
  } catch (error) {
    if (browser) await browser.close().catch(() => {});
    if (server) await server.close().catch(() => {});
    if (await pathExists(temporaryRoot)) {
      await chmod(temporaryRoot, 0o755).catch(() => {});
      await rm(temporaryRoot, {recursive: true, force: true}).catch(() => {});
    }
    throw error;
  }
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(`${usage()}\n`);
    return;
  }
  const result = options.check
    ? await checkStoredArtifact()
    : await generateArtifact();
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
