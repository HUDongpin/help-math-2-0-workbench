#!/usr/bin/env node

import {execFile as execFileCallback} from "node:child_process";
import {createHash} from "node:crypto";
import {constants as fsConstants} from "node:fs";
import {
  access,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  realpath,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {promisify} from "node:util";
import {fileURLToPath} from "node:url";

import {chromium} from "playwright";

import {
  buildG4L3Vb006SourcePreflight,
} from "./build-g4-l3-vb006-source-preflight.mjs";
import {buildSafeRuntime} from "./build-safe-ffdec-canvas-adapter.mjs";

const execFile = promisify(execFileCallback);
const scriptPath = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(scriptPath), "..");
const ANIMATION_ID = "course-g04-l03-vb-006";
const ARCHIVE_PREFIX = "source-assets/flash/HELP MATH_ORIGINAL FILES";
const SOURCE_SWF = `${ARCHIVE_PREFIX}/HELP_COURSES/ELMGR4/L3/VB/L3VB06.swf`;
const SOURCE_FLA = `${ARCHIVE_PREFIX}/HELP_COURSES/ELMGR4/L3/VB/L3VB06.fla`;
const SOURCE_ASSOCIATED_AUDIO =
  `${ARCHIVE_PREFIX}/HELP_COURSES/ELMGR4/L3/SA/L3VB06.mp3`;
const HOTSPOT_PARSER = "scripts/parse-swfmill-vb006-hotspots.py";
const SAFE_ADAPTER_BUILDER = "scripts/build-safe-ffdec-canvas-adapter.mjs";
const OUTPUT_SCRIPT =
  "public/flash-assets/courses/course-g04-l03-vb-006/canvas-renderer.js";
const OUTPUT_MANIFEST =
  "public/flash-assets/courses/course-g04-l03-vb-006/manifest.json";
const OUTPUT_REPORT_JSON =
  "reports/g4-l3-vb006-current-javascript-candidate.json";
const OUTPUT_REPORT_MARKDOWN =
  "reports/g4-l3-vb006-current-javascript-candidate.md";
const REPORT_TYPE = "current-javascript-engineering-candidate";

const EXPECTED = Object.freeze({
  sourceSwf: Object.freeze({
    bytes: 62_750,
    sha256: "e83889619f1a162491b2d7bbc720be78c5ca1eda7f6348680a949e5a71e90168",
  }),
  sourceFla: Object.freeze({
    bytes: 361_984,
    sha256: "44ce279b65a6ffb552dc8f0b4f10f9bdc05b5bfe874bf6de574ef2cce418f058",
  }),
  associatedAudio: Object.freeze({
    bytes: 211_008,
    sha256: "5a56dbcee1dff83597b928d59e7e25223d0c10709616338a7a55152bf87a67bd",
  }),
  canvasHelper: Object.freeze({
    bytes: 52_872,
    sha256: "78256220d01fba044341283703c3923a1ff8ff29499c51f65ab4e6ac825ccb93",
  }),
  canvasFrames: Object.freeze({
    bytes: 613_967,
    sha256: "282fe75274c786e5ec844ddb90bc60baf9263cd0122af159eeab8c04d65f22e4",
  }),
  swfmillXml: Object.freeze({
    bytes: 324_234,
    sha256: "f4c0559ebcdc56cf643f83765fe9fe5f32021d0d6f474c13f007200dfce7b0d8",
  }),
  placedFunctions: Object.freeze({
    count: 35,
    sha256: "8e7587091336343f4e5cba3acefa6aaa7b474fa28c9677ebbd629b251ee0862d",
  }),
  embeddedImages: Object.freeze({
    count: 0,
    sha256: "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945",
  }),
});

const EXPECTED_TOOLS = Object.freeze({
  ffdec: Object.freeze({
    invokedPath: "/opt/homebrew/bin/ffdec",
    versionArgs: Object.freeze(["-help"]),
    version: "JPEXS Free Flash Decompiler v.26.2.1",
    executableSha256: "1a242c6333aa8dba0f18f635f9ea2585a988f4131aa5164b70eb00ad9e662bab",
  }),
  swfmill: Object.freeze({
    invokedPath: "/opt/homebrew/bin/swfmill",
    versionArgs: Object.freeze(["--version"]),
    version: "swfmill 0.3.6",
    executableSha256: "b1299adad7f32d8e489574539e79b0f42c4960148170bc1ca48736e07ccbd311",
  }),
  python: Object.freeze({
    invokedPath: "/opt/anaconda3/bin/python3",
    versionArgs: Object.freeze(["--version"]),
    version: "Python 3.12.7",
    executableSha256: "14caa9d0a57ad2bceb66f778e13ad9483e79e3812ae7fa2385d2b854ce419fb5",
  }),
  ffmpeg: Object.freeze({
    invokedPath: "/opt/homebrew/bin/ffmpeg",
    versionArgs: Object.freeze(["-version"]),
    version: "ffmpeg version 8.1.2",
    executableSha256: "dad4b30b36a1a999bfa4b6ffbde138bd17ee496c69e12eef638227dff2c6415c",
  }),
  ffprobe: Object.freeze({
    invokedPath: "/opt/homebrew/bin/ffprobe",
    versionArgs: Object.freeze(["-version"]),
    version: "ffprobe version 8.1.2",
    executableSha256: "cfeefcc9207eb3fa424679228fe3848db2921b15537d26c1ccc4a7a61de95d00",
  }),
  chromium: Object.freeze({
    invokedPath:
      "/Users/peter/Library/Caches/ms-playwright/chromium-1228/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing",
    version: "149.0.7827.55",
    executableSha256: "b1b9e2dd063115031f08eadc10ed381ca0fa05b2284baff8f721d87f5f0f61b7",
  }),
});

const ACCEPTANCE_KEYS = Object.freeze([
  "implementationAuthorized",
  "implementationCreated",
  "migrationScaffoldCreated",
  "authoritativeOriginalRuntimeComplete",
  "naturalRuntimeReachabilityComplete",
  "frameDomainDispositionComplete",
  "bilingualVisualParityComplete",
  "audioAccepted",
  "replayParityComplete",
  "fullFrameRmseComplete",
  "behaviorComplete",
  "productQaComplete",
  "accessibilityQaComplete",
  "humanVisualReviewAccepted",
  "ownerAccepted",
  "strictMigrationComplete",
]);

const AUTHORIZATION_KEYS = Object.freeze([
  "strictImplementationAuthorized",
  "migrationScaffoldWriteAuthorized",
  "migrationWorkspaceWriteAuthorized",
  "completionLedgerWriteAuthorized",
  "approvalOrPinWriteAuthorized",
  "productRouteWriteAuthorized",
  "publicStrictLibraryAdmissionAuthorized",
  "sourceAssetWriteAuthorized",
  "offlinePackageWriteAuthorized",
  "legacyActionScriptExecutionAuthorized",
  "hostCallbackReconstructionAuthorized",
  "hotspotInteractionEnablementAuthorized",
  "audioEnablementAuthorized",
  "spanishRuntimeEnablementAuthorized",
  "rootRuntimeEnablementAuthorized",
  "companionRuntimeEnablementAuthorized",
  "replayParityClaimAuthorized",
  "visualParityClaimAuthorized",
  "migrationCompletionClaimAuthorized",
]);

const INTEGRATION_BINDINGS = Object.freeze([
  "packages/demos/src/source-static-canvas-candidate.tsx",
  "packages/demos/src/timelines/course-g04-l03-vb-006.ts",
  "packages/demos/src/modules/course-g04-l03-vb-006.tsx",
]);
const COMPLETION_LEDGER = "catalog/completion-ledger.json";

const CRITICAL_PROTECTED_FILES = Object.freeze([
  SOURCE_SWF,
  SOURCE_FLA,
  SOURCE_ASSOCIATED_AUDIO,
  "catalog/source-manifest.sha256",
  "reports/current-javascript-output-human-approval.json",
  ...INTEGRATION_BINDINGS,
]);

const ALLOWED_OUTPUTS = Object.freeze([
  OUTPUT_SCRIPT,
  OUTPUT_MANIFEST,
  OUTPUT_REPORT_JSON,
  OUTPUT_REPORT_MARKDOWN,
]);

const UNRESOLVED = Object.freeze([
  "The 10-frame root, InternalPreloader jump_check transition, and natural child entry have no authoritative original-runtime baseline; the root domain remains blocked.",
  "sprite-44 frames 1..163 are source-static drawing states only. This candidate does not establish natural runtime reachability, root compositing, terminal behavior, or visual parity.",
  "The separate one-frame sprite-5 page-title domain is inventoried but not rendered or composited.",
  "Four source hit-only glossary buttons call unresolved host ActionScript. Their placement geometry is recorded, but pointer events, KeyAttribute writes, DoHyperLinks(), and host animation stops are disabled.",
  "The candidate renders English source pixels only. Spanish visual behavior and both audio sources remain disabled and unaccepted.",
  "Replay/reset parity, full-frame original-runtime comparison, RMSE, product/accessibility QA, human visual review, owner acceptance, and strict migration completion remain false.",
]);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function projectPath(relativePath) {
  invariant(typeof relativePath === "string" && relativePath.length > 0,
    "project-relative path is required");
  invariant(!path.isAbsolute(relativePath), `absolute project path is forbidden: ${relativePath}`);
  const resolved = path.resolve(ROOT, relativePath);
  const relative = path.relative(ROOT, resolved);
  invariant(relative && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative),
    `path escapes the repository: ${relativePath}`);
  return resolved;
}

function fingerprint(value) {
  return sha256(stableJson(value));
}

async function run(command, args, options = {}) {
  try {
    return await execFile(command, args, {
      maxBuffer: 64 * 1024 * 1024,
      timeout: 180_000,
      ...options,
    });
  } catch (error) {
    const detail = [error.stdout, error.stderr].filter(Boolean).join("\n").trim();
    throw new Error(`${command} failed${detail ? `:\n${detail}` : ""}`, {cause: error});
  }
}

async function resolveExecutable(command) {
  const candidates = command.includes(path.sep)
    ? [path.resolve(command)]
    : (process.env.PATH || "").split(path.delimiter).filter(Boolean)
      .map((directory) => path.join(directory, command));
  for (const candidate of candidates) {
    try {
      await access(candidate, fsConstants.X_OK);
      return candidate;
    } catch {
      // Continue until the exact executable is found.
    }
  }
  throw new Error(`executable not found: ${command}`);
}

async function inspectTool(command, expected, label) {
  const invokedPath = await resolveExecutable(command);
  invariant(invokedPath === expected.invokedPath,
    `${label} invoked path changed: ${invokedPath}`);
  const resolvedPath = await realpath(invokedPath);
  const [bytes, versionResult] = await Promise.all([
    readFile(resolvedPath),
    run(invokedPath, expected.versionArgs, {timeout: 30_000, maxBuffer: 8 * 1024 * 1024}),
  ]);
  const versionOutput = `${versionResult.stdout}\n${versionResult.stderr}`
    .replace(/\u001b\[[0-9;]*m/g, "").trim();
  invariant(versionOutput.includes(expected.version),
    `${label} version changed: ${versionOutput || "<empty>"}`);
  invariant(sha256(bytes) === expected.executableSha256,
    `${label} executable SHA-256 changed`);
  return {
    command,
    invokedPath,
    resolvedPath,
    executableBytes: bytes.length,
    executableSha256: sha256(bytes),
    version: expected.version,
  };
}

async function readBinding(relativePath) {
  const absolute = projectPath(relativePath);
  const metadata = await lstat(absolute);
  invariant(metadata.isFile() && !metadata.isSymbolicLink(),
    `${relativePath} must be a regular non-symlink file`);
  const bytes = await readFile(absolute);
  return {path: portable(relativePath), bytes: bytes.length, sha256: sha256(bytes)};
}

async function readPinned(relativePath, expected, label) {
  const binding = await readBinding(relativePath);
  invariant(binding.bytes === expected.bytes && binding.sha256 === expected.sha256,
    `${label} differs from its pinned source identity`);
  return {...binding, contents: await readFile(projectPath(relativePath))};
}

async function walkBindings(relativeDirectory, nested = "") {
  const absoluteDirectory = projectPath(relativeDirectory);
  const entries = await readdir(path.join(absoluteDirectory, nested), {withFileTypes: true});
  const rows = [];
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name, "en"))) {
    const next = path.join(nested, entry.name);
    if (entry.isDirectory()) rows.push(...await walkBindings(relativeDirectory, next));
    else if (entry.isFile()) {
      const bytes = await readFile(path.join(absoluteDirectory, next));
      rows.push({path: portable(next), bytes: bytes.length, sha256: sha256(bytes)});
    } else {
      throw new Error(`protected directory contains a non-file entry: ${relativeDirectory}/${next}`);
    }
  }
  return rows;
}

async function protectedSnapshot() {
  const [migrationFiles, criticalFiles] = await Promise.all([
    walkBindings("migrations"),
    Promise.all(CRITICAL_PROTECTED_FILES.map(readBinding)),
  ]);
  const migrations = {
    directory: "migrations",
    fileCount: migrationFiles.length,
    totalBytes: migrationFiles.reduce((sum, item) => sum + item.bytes, 0),
    manifestSha256: fingerprint(migrationFiles),
  };
  const critical = {
    fileCount: criticalFiles.length,
    totalBytes: criticalFiles.reduce((sum, item) => sum + item.bytes, 0),
    manifestSha256: fingerprint(criticalFiles),
    files: criticalFiles,
  };
  return {
    migrations,
    critical,
    combinedManifestSha256: fingerprint({migrations, critical}),
  };
}

function assertProtectedUnchanged(before, after) {
  invariant(before.combinedManifestSha256 === after.combinedManifestSha256,
    "protected source/migration/ledger/approval/integration inventory changed during generation");
  return true;
}

function protectedSnapshotReceipt(snapshot) {
  const migrationMutationGuard = {
    scope: "all regular files under migrations/",
    comparisonMode: "transient-exact-before-after-sha256-v1",
    protectedDuringGeneration: true,
    exactSnapshotSerialized: false,
    reason:
      "The exact migration-tree snapshot is compared in memory but omitted from candidate artifacts so later acceptance-neutral workspace planning cannot create a circular candidate hash dependency.",
  };
  return {
    migrationMutationGuard,
    critical: snapshot.critical,
    combinedManifestSha256: fingerprint({
      migrationMutationGuard,
      critical: snapshot.critical,
    }),
  };
}

async function assertCompletionLedgerUnchanged(before) {
  const after = await readBinding(COMPLETION_LEDGER);
  invariant(before.sha256 === after.sha256 && before.bytes === after.bytes,
    "completion ledger changed during candidate generation");
}

function falseBoundary(keys) {
  return Object.fromEntries(keys.map((key) => [key, false]));
}

function recordMatches(actual, expected) {
  return Boolean(actual && Object.entries(expected)
    .every(([key, value]) => actual[key] === value) &&
    Object.keys(actual).length === Object.keys(expected).length);
}

function adapterSpec() {
  return {
    schemaVersion: 1,
    animationId: ANIMATION_ID,
    classification: "source-static-current-javascript-engineering-candidate-only",
    source: {swf: SOURCE_SWF, swfSha256: EXPECTED.sourceSwf.sha256},
    evidence: {scenarioInventorySha256: "0".repeat(64), audioAuditSha256: "0".repeat(64)},
    ffdecExport: {
      tool: EXPECTED_TOOLS.ffdec.version,
      helper: "ephemeral-fresh-ffdec-export/canvas.js",
      helperSha256: EXPECTED.canvasHelper.sha256,
      framesHtml: "ephemeral-fresh-ffdec-export/frames.html",
      framesHtmlSha256: EXPECTED.canvasFrames.sha256,
      targetSpriteObjectId: 44,
      targetSpriteFunction: "sprite44",
      exportCanvas: {width: 697, height: 382},
      exportInternalTranslation: {x: 337.25, y: 141.25},
      expectedPlacedFunctionCount: EXPECTED.placedFunctions.count,
      expectedPlacedFunctionsSha256: EXPECTED.placedFunctions.sha256,
      embeddedImageVariableCount: EXPECTED.embeddedImages.count,
      embeddedImageVariablesSha256: EXPECTED.embeddedImages.sha256,
    },
    timeline: {
      fps: 12,
      stage: {width: 800, height: 600, backgroundColor: "#b8d8f7"},
      root: {
        frameCount: 10,
        preloaderStopFrame: 1,
        beginFrame: 6,
        beginLabel: "begin",
        placementName: "animation",
        placementTwips: {x: 8_026, y: 4_885},
        placementPixels: {x: 401.3, y: 244.25},
      },
      local: {
        timelineId: "sprite-44",
        frameCount: 163,
        playbackMode: "once",
        publicFrameIndexing: "one-indexed",
      },
      stageRenderOffset: {x: 64.05, y: 103},
    },
    runtimeContract: {
      kind: "structural-local-frame",
      scenarios: ["source-static-frame"],
      defaultScenario: "source-static-frame",
      supportedLanguages: ["en"],
      seedMapping: "normalized-but-unused-by-source-static-drawing",
      unresolved: [...UNRESOLVED],
    },
    output: {
      script: OUTPUT_SCRIPT,
      manifest: OUTPUT_MANIFEST,
      globalRegistry: "HELP_MATH_CANVAS_ASSETS",
    },
  };
}

const HOTSPOT_EXPECTATIONS = Object.freeze([
  Object.freeze({
    characterId: 11,
    keyAttribute: "Zero",
    first: 1,
    lastInclusive: 163,
    depth: 5,
    placement: Object.freeze({scaleX: "0.7543029785156250", skewX: "0", skewY: "0", scaleY: "1.175582885742188", transX: "-3679", transY: "-2271"}),
    composed: Object.freeze({scaleX: "0.754302978515625", skewX: "0", skewY: "0", scaleY: "1.175582885742188", transX: "4347", transY: "2614"}),
    bounds: Object.freeze({left: "194.570050048828125", right: "240.09223480224609375", top: "119.4144042968749952", bottom: "141.9268165588378954", width: "45.52218475341796875", height: "22.5124122619629002"}),
  }),
  Object.freeze({
    characterId: 12,
    keyAttribute: "Value",
    first: 1,
    lastInclusive: 163,
    depth: 7,
    placement: Object.freeze({scaleX: "0.9024963378906250", skewX: "0", skewY: "0", scaleY: "1.175582885742188", transX: "-1290", transY: "-2271"}),
    composed: Object.freeze({scaleX: "0.902496337890625", skewX: "0", skewY: "0", scaleY: "1.175582885742188", transX: "6736", transY: "2614"}),
    bounds: Object.freeze({left: "309.544610595703125", right: "364.01026458740234375", top: "119.4144042968749952", bottom: "141.9268165588378954", width: "54.46565399169921875", height: "22.5124122619629002"}),
  }),
  Object.freeze({
    characterId: 42,
    keyAttribute: "Positive number",
    first: 116,
    lastInclusive: 163,
    depth: 67,
    placement: Object.freeze({scaleX: "1.287338256835938", skewX: "0", skewY: "0", scaleY: "1.175582885742188", transX: "-232", transY: "2192"}),
    composed: Object.freeze({scaleX: "1.287338256835938", skewX: "0", skewY: "0", scaleY: "1.175582885742188", transX: "7794", transY: "7077"}),
    bounds: Object.freeze({left: "350.8223846435546724", right: "428.5132484436035307", top: "342.5644042968749952", bottom: "365.0768165588378954", width: "77.6908638000488583", height: "22.5124122619629002"}),
  }),
  Object.freeze({
    characterId: 43,
    keyAttribute: "Negative number",
    first: 116,
    lastInclusive: 163,
    depth: 69,
    placement: Object.freeze({scaleX: "1.420623779296875", skewX: "0", skewY: "0", scaleY: "1.175582885742188", transX: "1927", transY: "2212"}),
    composed: Object.freeze({scaleX: "1.420623779296875", skewX: "0", skewY: "0", scaleY: "1.175582885742188", transX: "9953", transY: "7097"}),
    bounds: Object.freeze({left: "454.747161865234375", right: "540.48180694580078125", top: "343.5644042968749952", bottom: "366.0768165588378954", width: "85.73464508056640625", height: "22.5124122619629002"}),
  }),
]);

export function validateVb006HotspotEvidence(evidence) {
  invariant(evidence?.schemaVersion === 1 && evidence.parser === "python-xml.etree.ElementTree",
    "VB006 hotspot parser identity changed");
  invariant(evidence.nativeStage.width === 800 && evidence.nativeStage.height === 600 &&
    evidence.sprite.objectId === 44 && evidence.sprite.frameCount === 163,
  "VB006 hotspot stage/sprite identity changed");
  invariant(evidence.rootPlacement.frame === 6 && evidence.rootPlacement.objectId === 44 &&
    evidence.rootPlacement.depth === 4 && evidence.rootPlacement.name === "animation" &&
    recordMatches(evidence.rootPlacement.transformSourceDecimals,
      {scaleX: "1", skewX: "0", skewY: "0", scaleY: "1", transX: "8026", transY: "4885"}),
  "VB006 hotspot root placement changed");
  invariant(evidence.sharedHitShape.objectId === 10 &&
    evidence.sharedHitShape.definitionTag === "DefineShape" &&
    recordMatches(evidence.sharedHitShape.boundsTwips,
      {left: -604, right: 603, top: -192, bottom: 191}),
  "VB006 shared hit shape changed");
  invariant(evidence.hotspots.length === HOTSPOT_EXPECTATIONS.length,
    "VB006 hotspot count changed");
  evidence.hotspots.forEach((hotspot, index) => {
    const expected = HOTSPOT_EXPECTATIONS[index];
    invariant(hotspot.characterId === expected.characterId &&
      hotspot.keyAttribute === expected.keyAttribute && hotspot.event === "pointerReleaseInside" &&
      hotspot.frameInterval.first === expected.first &&
      hotspot.frameInterval.lastInclusive === expected.lastInclusive &&
      hotspot.placement.depth === expected.depth,
    `VB006 hotspot ${expected.characterId} identity/interval/depth changed`);
    invariant(recordMatches(hotspot.placement.transformSourceDecimals, expected.placement) &&
      recordMatches(hotspot.composedStageMatrixTwipsExactDecimals, expected.composed),
    `VB006 hotspot ${expected.characterId} matrix changed`);
    invariant(hotspot.hitState.hitTest === true && hotspot.hitState.shapeObjectId === 10 &&
      hotspot.hitState.depth === 1 &&
      Object.values(hotspot.hitState.visibleStates).every((value) => value === false) &&
      recordMatches(hotspot.stageHitBounds.exactDecimals, expected.bounds),
    `VB006 hotspot ${expected.characterId} hit-state geometry changed`);
    invariant(hotspot.behaviorExecutedByCandidate === false &&
      hotspot.pointerEventsEnabledByCandidate === false,
    `VB006 hotspot ${expected.characterId} was enabled`);
  });
  invariant(evidence.evidenceBoundary.sourceGeometryOnly === true &&
    evidence.evidenceBoundary.legacyActionScriptExecuted === false &&
    evidence.evidenceBoundary.hostCallbacksResolved === false &&
    evidence.evidenceBoundary.pointerEventsEnabled === false &&
    evidence.evidenceBoundary.behaviorParityEstablished === false &&
    evidence.evidenceBoundary.acceptanceEffect === "none",
  "VB006 hotspot evidence boundary was promoted");
  return evidence;
}

async function browserRenderability(runtime) {
  const executablePath = chromium.executablePath();
  invariant(executablePath === EXPECTED_TOOLS.chromium.invokedPath,
    `Playwright Chromium path changed: ${executablePath}`);
  const executableBytes = await readFile(executablePath);
  invariant(sha256(executableBytes) === EXPECTED_TOOLS.chromium.executableSha256,
    "Playwright Chromium executable SHA-256 changed");
  const requests = [];
  const consoleErrors = [];
  const pageErrors = [];
  const browser = await chromium.launch({headless: true});
  try {
    invariant(browser.version() === EXPECTED_TOOLS.chromium.version,
      `Playwright Chromium version changed: ${browser.version()}`);
    const page = await browser.newPage({viewport: {width: 800, height: 600}});
    page.on("request", (request) => requests.push(request.url()));
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => pageErrors.push(error.message));
    await page.setContent("<!doctype html><meta charset=utf-8><title>VB006 renderability harness</title>");
    await page.addScriptTag({content: runtime});
    const result = await page.evaluate(async ({animationId, frameCount}) => {
      const asset = globalThis.HELP_MATH_CANVAS_ASSETS?.[animationId];
      if (!asset) throw new Error("candidate asset did not register");
      await asset.ready();
      const frames = [];
      for (let frame = 1; frame <= frameCount; frame += 1) {
        const canvas = document.createElement("canvas");
        canvas.width = 800;
        canvas.height = 600;
        canvas.style.pointerEvents = "none";
        document.body.appendChild(canvas);
        const state = asset.render(canvas, {
          frame,
          scenario: "source-static-frame",
          lang: "en",
          seed: 0,
        });
        const expected = {
          frameDomain: "sprite-44",
          localFrame: frame,
          exportFrame: frame - 1,
          rootFrame: 6,
          scenario: "source-static-frame",
          lang: "en",
          seed: 0,
        };
        for (const [name, value] of Object.entries(expected)) {
          if (state[name] !== value) throw new Error(`frame ${frame} state mismatch: ${name}`);
        }
        if (state.interactiveStateResolved !== false || state.audioRendered !== false ||
          state.visualOnly !== true) throw new Error(`frame ${frame} safety state changed`);
        const attributes = {
          "data-flash-frame": String(frame),
          "data-flash-frame-domain": "sprite-44",
          "data-flash-root-frame": "6",
          "data-runtime-scenario": "source-static-frame",
          "data-runtime-seed": "0",
        };
        for (const [name, value] of Object.entries(attributes)) {
          if (canvas.getAttribute(name) !== value) throw new Error(`frame ${frame} canvas mismatch: ${name}`);
        }
        if (getComputedStyle(canvas).pointerEvents !== "none") {
          throw new Error(`frame ${frame} pointer events were enabled`);
        }
        const pngUrl = canvas.toDataURL("image/png");
        if (!pngUrl.startsWith("data:image/png;base64,")) {
          throw new Error(`frame ${frame} PNG encoding failed`);
        }
        frames.push({
          frame,
          exportFrame: frame - 1,
          pngBase64: pngUrl.slice("data:image/png;base64,".length),
        });
        canvas.remove();
      }
      const probe = (name, request) => {
        const canvas = document.createElement("canvas");
        canvas.width = 800;
        canvas.height = 600;
        try {
          asset.render(canvas, request);
          return {name, blocked: false, message: null};
        } catch (error) {
          return {name, blocked: true, message: error instanceof Error ? error.message : String(error)};
        }
      };
      return {
        frames,
        negativeProbes: [
          probe("spanish", {frame: 1, scenario: "source-static-frame", lang: "es", seed: 0}),
          probe("root", {frame: 1, scenario: "root-unavailable", lang: "en", seed: 0}),
          probe("sprite-5", {frame: 1, scenario: "sprite-5-unavailable", lang: "en", seed: 0}),
          probe("audio", {frame: 1, scenario: "audio", lang: "en", seed: 0}),
          probe("replay", {frame: 1, scenario: "replay", lang: "en", seed: 0}),
          probe("out-of-range", {frame: frameCount + 1, scenario: "source-static-frame", lang: "en", seed: 0}),
        ],
        exposedMethods: Object.keys(asset).sort(),
      };
    }, {animationId: ANIMATION_ID, frameCount: 163});
    result.frames = result.frames.map(({pngBase64, ...frame}) => {
      const bytes = Buffer.from(pngBase64, "base64");
      return {...frame, bytes: bytes.length, sha256: sha256(bytes)};
    });
    invariant(result.frames.length === 163 &&
      result.frames.every((frame, index) => frame.frame === index + 1 &&
        frame.exportFrame === index && frame.bytes > 0 && /^[a-f0-9]{64}$/.test(frame.sha256)),
    "browser did not execute and encode all 163 source-static frames");
    invariant(result.negativeProbes.every((probe) => probe.blocked === true),
      "one or more unsupported browser runtime requests did not fail closed");
    invariant(JSON.stringify(result.exposedMethods) ===
      JSON.stringify(["metadata", "ready", "render", "resolveFrameState"]),
    "candidate runtime exposed unexpected methods");
    invariant(requests.length === 0 && consoleErrors.length === 0 && pageErrors.length === 0,
      "browser candidate renderability emitted network, console, or page errors");
    return {
      classification: "candidate-renderability-only-not-visual-parity",
      browser: {
        invokedPath: executablePath,
        resolvedPath: await realpath(executablePath),
        executableBytes: executableBytes.length,
        executableSha256: sha256(executableBytes),
        version: browser.version(),
      },
      harness: {
        viewport: {width: 800, height: 600},
        canvasBackingStore: {width: 800, height: 600},
        language: "en",
        scenario: "source-static-frame",
        seed: 0,
        pointerEvents: "none",
      },
      frameDomain: "sprite-44",
      firstFrame: 1,
      lastFrame: 163,
      executedFrameCount: 163,
      pngEncodedFrameCount: 163,
      frameManifestSha256: fingerprint(result.frames),
      frames: result.frames,
      negativeProbes: result.negativeProbes,
      exposedMethods: result.exposedMethods,
      unexpectedNetworkRequestCount: requests.length,
      consoleErrorCount: consoleErrors.length,
      pageErrorCount: pageErrors.length,
      originalRuntimeBaselineUsed: false,
      rmseComputed: false,
      visualParityClaimed: false,
      behaviorParityClaimed: false,
    };
  } finally {
    await browser.close();
  }
}

function renderMarkdown(report) {
  const hotspotRows = report.hotspotEvidence.hotspots.map((hotspot) =>
    `| ${hotspot.characterId} | ${hotspot.keyAttribute} | ${hotspot.frameInterval.first}–${hotspot.frameInterval.lastInclusive} | ${hotspot.placement.depth} | hit-only | false |`,
  ).join("\n");
  const acceptanceRows = Object.entries(report.acceptance)
    .map(([key, value]) => `| \`${key}\` | ${value} |`).join("\n");
  return `# G4 L3 VB006 current-JavaScript engineering candidate\n\n` +
    `This is a hash-bound, prototype-registry-only rendering candidate for \`${ANIMATION_ID}\`. It is not an authoritative Flash baseline, visual or behavioral parity result, audio acceptance, human/owner acceptance, strict migration, public-library admission, or production admission.\n\n` +
    `## Bounded result\n\n` +
    `- Source SWF: \`${report.source.swf.path}\` (SHA-256 \`${report.source.swf.sha256}\`).\n` +
    `- Implemented address space: English-only \`sprite-44\` frames 1–163, muted and noninteractive.\n` +
    `- Runtime: \`${report.outputs.canvasRuntime.path}\` (SHA-256 \`${report.outputs.canvasRuntime.sha256}\`).\n` +
    `- Browser execution: ${report.candidateRenderability.executedFrameCount}/163 frames encoded at 800×600; manifest SHA-256 \`${report.candidateRenderability.frameManifestSha256}\`.\n` +
    `- Classification: **candidate renderability only**. No original-runtime baseline or RMSE comparison was performed.\n` +
    `- Root, sprite-5, Spanish, audio, Replay parity, host ActionScript, and all pointer behavior fail closed.\n\n` +
    `## Source glossary hit-state evidence\n\n` +
    `| Button | KeyAttribute | sprite-44 frames | placement depth | source state | candidate pointer behavior |\n` +
    `|---:|---|---:|---:|---|---:|\n${hotspotRows}\n\n` +
    `All four records retain their exact placement matrices and native-stage hit bounds in the JSON report. Geometry is evidence only; no DOM controls or host callbacks were created.\n\n` +
    `## Write boundary\n\n` +
    `The generator wrote only the four declared candidate outputs. Its before/after protected manifest stayed at \`${report.writeScope.protectedAfter.combinedManifestSha256}\`; source assets, every file under \`migrations/\`, the completion ledger, approval record, and integration bindings were unchanged during generation.\n\n` +
    `## Acceptance boundary\n\n| Gate | Accepted |\n|---|---:|\n${acceptanceRows}\n\n` +
    `## Unresolved obligations\n\n${report.unresolved.map((item) => `- ${item}`).join("\n")}\n`;
}

function buildArtifacts({
  browserEvidence,
  built,
  helper,
  hotspots,
  integrationBindings,
  preflight,
  protectedBefore,
  runtimeBytes,
  sourceAssociatedAudio,
  sourceFla,
  sourceSwf,
  swfmillXml,
  toolchain,
  verifiedAfterWrite,
}) {
  const acceptance = falseBoundary(ACCEPTANCE_KEYS);
  const authorization = falseBoundary(AUTHORIZATION_KEYS);
  const protectedReceipt = protectedSnapshotReceipt(protectedBefore);
  const writeScope = {
    allowedOutputs: [...ALLOWED_OUTPUTS],
    protectedInventory: [
      "all regular files under migrations/",
      ...CRITICAL_PROTECTED_FILES,
    ],
    protectedBefore: protectedReceipt,
    protectedAfter: protectedReceipt,
    protectedManifestUnchanged: verifiedAfterWrite,
    verifiedAfterWrite,
    sourceAssetsWritten: false,
    migrationFilesWritten: false,
    ledgerWritten: false,
    approvalOrPinFilesWritten: false,
    productOrOfflineReportsWritten: false,
  };
  const manifest = {
    schemaVersion: 2,
    animationId: ANIMATION_ID,
    status: "source-static-current-javascript-engineering-candidate-only",
    authority:
      "Fresh hash-bound SWF extraction and deterministic Chromium renderability only; not authoritative runtime, visual parity, behavior parity, localization, audio, human, owner, or strict acceptance.",
    generatedBy: integrationBindings.filter((entry) =>
      [portable(path.relative(ROOT, scriptPath)), SAFE_ADAPTER_BUILDER, HOTSPOT_PARSER].includes(entry.path)),
    source: {
      swf: {...sourceSwf, contents: undefined},
      fla: {...sourceFla, contents: undefined, authoringAuditPerformed: false},
      associatedAudio: {
        ...sourceAssociatedAudio,
        contents: undefined,
        normalizedPathConventionCandidate: "es",
        languageEstablished: false,
        rendered: false,
      },
    },
    sourcePreflight: {
      reportType: preflight.reportType,
      reportFingerprintSha256: preflight.reportFingerprintSha256,
      strictAcceptanceEffect: preflight.strictAcceptanceEffect,
    },
    toolchain,
    extraction: {
      helper: {bytes: helper.length, sha256: sha256(helper)},
      framesHtml: {bytes: EXPECTED.canvasFrames.bytes, sha256: EXPECTED.canvasFrames.sha256},
      swfmillXml: {bytes: swfmillXml.length, sha256: sha256(swfmillXml)},
      drawingObjectCount: built.placedFunctions.length,
      drawingObjectsSha256: sha256(JSON.stringify(built.placedFunctions)),
      embeddedImageCount: built.imageVariables.length,
      embeddedImageVariablesSha256: sha256(JSON.stringify(built.imageVariables)),
      hotspotEvidence: hotspots,
    },
    runtime: {
      ...built.metadata,
      boundedScope: {
        frameDomain: "sprite-44",
        frames: {first: 1, lastInclusive: 163},
        language: "en",
        scenario: "source-static-frame",
        audio: "disabled",
        pointerInteraction: "disabled",
        hostActionScript: "disabled",
      },
      blocked: {
        root: true,
        "sprite-5": true,
        spanish: true,
        audio: true,
        replayParity: true,
        hostActionScript: true,
      },
    },
    safety: {
      noLegacyActionScriptExecuted: true,
      noHostCallbacksExecuted: true,
      noDynamicEvaluation: true,
      noNetworkPrimitives: true,
      noTimersOrAutoplay: true,
      noPersistentStorage: true,
      noAmbientDomListeners: true,
      pointerEventsEnabled: false,
      audioRendered: false,
    },
    candidateRenderability: browserEvidence,
    output: {
      script: OUTPUT_SCRIPT,
      bytes: runtimeBytes.length,
      sha256: sha256(runtimeBytes),
      globalRegistry: "HELP_MATH_CANVAS_ASSETS",
    },
    prototypeRegistryOnly: true,
    writeScope,
    authorization,
    acceptance,
    strictAcceptanceEffect: "none",
    unresolved: [...UNRESOLVED],
  };
  const manifestBytes = Buffer.from(stableJson(manifest));
  const report = {
    schemaVersion: 2,
    reportType: REPORT_TYPE,
    animationId: ANIMATION_ID,
    batch: {lesson: "G4 L3", batchId: "batch-001", batchOrdinal: 9},
    classification: {
      section: "VB",
      page: 6,
      titleRaw: "Zero",
      titleDisplay: "Zero",
      titleSpanishCatalogOnly: "Cero",
      domain: "vocabulary",
    },
    disposition: {
      currentJavaScriptCandidate: true,
      candidateRenderabilityOnly: true,
      prototypeRegistryOnly: true,
      migrationScaffoldCreated: false,
      migrationWorkspaceChanged: false,
      strictLedgerChanged: false,
      approvalOrPinChanged: false,
      productRouteAdded: false,
      publicLibraryAdmitted: false,
      productionAdmission: false,
      strictMigrationComplete: false,
    },
    source: manifest.source,
    sourcePreflight: manifest.sourcePreflight,
    toolchain,
    integrationBindings,
    timeline: {
      stage: {width: 800, height: 600, backgroundColor: "#b8d8f7"},
      fps: 12,
      root: {frameDomain: "root", frameCount: 10, renderable: false},
      companion: {frameDomain: "sprite-5", frameCount: 1, renderable: false},
      main: {
        frameDomain: "sprite-44",
        frameCount: 163,
        publicFrameIndexing: "one-indexed",
        language: "en",
        audioRendered: false,
        interactionEnabled: false,
        status: "source-static-drawing-only",
      },
    },
    hotspotEvidence: hotspots,
    candidateRenderability: browserEvidence,
    outputs: {
      canvasRuntime: {
        path: OUTPUT_SCRIPT,
        bytes: runtimeBytes.length,
        sha256: sha256(runtimeBytes),
      },
      canvasManifest: {
        path: OUTPUT_MANIFEST,
        bytes: manifestBytes.length,
        sha256: sha256(manifestBytes),
      },
      prototypeModule: "packages/demos/src/modules/course-g04-l03-vb-006.tsx",
      pureTimeline: "packages/demos/src/timelines/course-g04-l03-vb-006.ts",
    },
    writeScope,
    authorization,
    acceptance,
    strictAcceptanceEffect: "none",
    unresolved: [...UNRESOLVED],
  };
  report.reportFingerprintSha256 = fingerprint(report);
  return {
    runtimeBytes,
    manifestBytes,
    report,
    reportJsonBytes: Buffer.from(stableJson(report)),
    reportMarkdownBytes: Buffer.from(renderMarkdown(report)),
  };
}

export function validateG4L3Vb006CurrentJsCandidate(report) {
  invariant(report?.schemaVersion === 2 && report.reportType === REPORT_TYPE &&
    report.animationId === ANIMATION_ID,
  "VB006 candidate report identity is invalid");
  invariant(report.disposition.currentJavaScriptCandidate === true &&
    report.disposition.candidateRenderabilityOnly === true &&
    report.disposition.prototypeRegistryOnly === true &&
    Object.entries(report.disposition)
      .filter(([key]) => !["currentJavaScriptCandidate", "candidateRenderabilityOnly", "prototypeRegistryOnly"].includes(key))
      .every(([, value]) => value === false),
  "VB006 candidate disposition was promoted");
  invariant(Object.keys(report.authorization).length === AUTHORIZATION_KEYS.length &&
    AUTHORIZATION_KEYS.every((key) => report.authorization[key] === false),
  "VB006 authorization fields must all remain false");
  invariant(Object.keys(report.acceptance).length === ACCEPTANCE_KEYS.length &&
    ACCEPTANCE_KEYS.every((key) => report.acceptance[key] === false) &&
    report.strictAcceptanceEffect === "none",
  "VB006 acceptance fields must all remain false");
  validateVb006HotspotEvidence(report.hotspotEvidence);
  invariant(report.candidateRenderability.classification ===
    "candidate-renderability-only-not-visual-parity" &&
    report.candidateRenderability.executedFrameCount === 163 &&
    report.candidateRenderability.pngEncodedFrameCount === 163 &&
    report.candidateRenderability.frames.length === 163 &&
    report.candidateRenderability.frames.every((entry, index) => entry.frame === index + 1) &&
    report.candidateRenderability.negativeProbes.every((entry) => entry.blocked === true) &&
    report.candidateRenderability.originalRuntimeBaselineUsed === false &&
    report.candidateRenderability.rmseComputed === false &&
    report.candidateRenderability.visualParityClaimed === false &&
    report.candidateRenderability.behaviorParityClaimed === false,
  "VB006 browser evidence exceeds or fails the candidate-renderability boundary");
  invariant(report.writeScope.verifiedAfterWrite === true &&
    report.writeScope.protectedManifestUnchanged === true &&
    report.writeScope.protectedBefore.combinedManifestSha256 ===
      report.writeScope.protectedAfter.combinedManifestSha256 &&
    report.writeScope.protectedBefore.migrationMutationGuard
      .comparisonMode === "transient-exact-before-after-sha256-v1" &&
    report.writeScope.protectedBefore.migrationMutationGuard
      .exactSnapshotSerialized === false &&
    report.writeScope.sourceAssetsWritten === false &&
    report.writeScope.migrationFilesWritten === false &&
    report.writeScope.ledgerWritten === false &&
    report.writeScope.approvalOrPinFilesWritten === false,
  "VB006 candidate write boundary is not closed");
  const projected = {...report};
  delete projected.reportFingerprintSha256;
  invariant(report.reportFingerprintSha256 === fingerprint(projected),
    "VB006 candidate report fingerprint is stale");
  return report;
}

async function assertSafeOutputTarget(relativePath) {
  invariant(ALLOWED_OUTPUTS.includes(relativePath), `undeclared output target: ${relativePath}`);
  const absolute = projectPath(relativePath);
  invariant(!absolute.startsWith(`${projectPath("source-assets")}${path.sep}`),
    "candidate output cannot be placed under source-assets");
  try {
    const target = await lstat(absolute);
    invariant(target.isFile() && !target.isSymbolicLink(),
      `${relativePath} must be a regular non-symlink output`);
    invariant((await stat(absolute)).nlink === 1,
      `${relativePath} must not have multiple hard links`);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

async function emit(relativePath, expected, check) {
  const absolute = projectPath(relativePath);
  if (check) {
    const actual = await readFile(absolute);
    invariant(actual.equals(expected), `${relativePath} is stale`);
    return;
  }
  await assertSafeOutputTarget(relativePath);
  await mkdir(path.dirname(absolute), {recursive: true});
  await writeFile(absolute, expected);
}

export function parseArguments(argv) {
  const options = {
    check: false,
    ffdec: "ffdec",
    swfmill: "swfmill",
    python: "python3",
    ffmpeg: "ffmpeg",
    ffprobe: "ffprobe",
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--check") options.check = true;
    else if (["--ffdec", "--swfmill", "--python", "--ffmpeg", "--ffprobe"].includes(argument)) {
      const value = argv[index + 1];
      invariant(value && !value.startsWith("--"), `${argument} requires a value`);
      options[argument.slice(2)] = value;
      index += 1;
    } else if (argument === "--help" || argument === "-h") options.help = true;
    else throw new Error(`unknown argument: ${argument}`);
  }
  return options;
}

export async function generateG4L3Vb006CurrentJsCandidate({
  check = false,
  ffdec = "ffdec",
  swfmill = "swfmill",
  python = "python3",
  ffmpeg = "ffmpeg",
  ffprobe = "ffprobe",
} = {}) {
  const protectedBefore = await protectedSnapshot();
  const completionLedgerBefore = await readBinding(COMPLETION_LEDGER);
  const [sourceSwf, sourceFla, sourceAssociatedAudio, hotspotParser, safeBuilder,
    generator, ...integrationTail] = await Promise.all([
    readPinned(SOURCE_SWF, EXPECTED.sourceSwf, "VB006 source SWF"),
    readPinned(SOURCE_FLA, EXPECTED.sourceFla, "VB006 source FLA"),
    readPinned(SOURCE_ASSOCIATED_AUDIO, EXPECTED.associatedAudio, "VB006 associated audio"),
    readBinding(HOTSPOT_PARSER),
    readBinding(SAFE_ADAPTER_BUILDER),
    readBinding(portable(path.relative(ROOT, scriptPath))),
    ...INTEGRATION_BINDINGS.map(readBinding),
  ]);
  const integrationBindings = [hotspotParser, safeBuilder, generator, ...integrationTail]
    .sort((left, right) => left.path.localeCompare(right.path, "en"));
  const toolchainEntries = await Promise.all([
    inspectTool(ffdec, EXPECTED_TOOLS.ffdec, "FFDec"),
    inspectTool(swfmill, EXPECTED_TOOLS.swfmill, "swfmill"),
    inspectTool(python, EXPECTED_TOOLS.python, "Python"),
    inspectTool(ffmpeg, EXPECTED_TOOLS.ffmpeg, "FFmpeg"),
    inspectTool(ffprobe, EXPECTED_TOOLS.ffprobe, "ffprobe"),
  ]);
  const toolchain = Object.fromEntries(["ffdec", "swfmill", "python", "ffmpeg", "ffprobe"]
    .map((name, index) => [name, toolchainEntries[index]]));
  const preflight = await buildG4L3Vb006SourcePreflight({ffdec, swfmill, python, ffmpeg, ffprobe});
  invariant(preflight.candidateDisposition.boundedSourceStaticDrawingCandidateTechnicallySupported === true &&
    preflight.acceptance.implementationAuthorized === false &&
    preflight.acceptance.strictMigrationComplete === false,
  "fresh VB006 preflight no longer supports an acceptance-neutral bounded candidate");

  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "help-math-vb006-candidate-"));
  try {
    const canvasDirectory = path.join(temporaryRoot, "canvas");
    const swfmillXmlPath = path.join(temporaryRoot, "source.xml");
    const canvasExport = await run(toolchain.ffdec.invokedPath, [
      "-config", "packJavaScripts=false",
      "-onerror", "abort",
      "-selectid", "44",
      "-format", "sprite:canvas",
      "-export", "sprite",
      canvasDirectory,
      projectPath(SOURCE_SWF),
    ]);
    invariant(`${canvasExport.stdout}\n${canvasExport.stderr}`.includes(EXPECTED_TOOLS.ffdec.version),
      "fresh FFDec exporter version changed");
    await run(toolchain.swfmill.invokedPath,
      ["swf2xml", projectPath(SOURCE_SWF), swfmillXmlPath]);
    const [helper, framesHtml, swfmillXml] = await Promise.all([
      readFile(path.join(canvasDirectory, "DefineSprite_44", "canvas.js")),
      readFile(path.join(canvasDirectory, "DefineSprite_44", "frames.html")),
      readFile(swfmillXmlPath),
    ]);
    invariant(helper.length === EXPECTED.canvasHelper.bytes &&
      sha256(helper) === EXPECTED.canvasHelper.sha256,
    "fresh FFDec Canvas helper changed");
    invariant(framesHtml.length === EXPECTED.canvasFrames.bytes &&
      sha256(framesHtml) === EXPECTED.canvasFrames.sha256,
    "fresh FFDec sprite-44 frame export changed");
    invariant(swfmillXml.length === EXPECTED.swfmillXml.bytes &&
      sha256(swfmillXml) === EXPECTED.swfmillXml.sha256,
    "fresh swfmill XML changed");
    const hotspotResult = await run(toolchain.python.invokedPath,
      [projectPath(HOTSPOT_PARSER), "--swfmill", swfmillXmlPath]);
    const hotspots = validateVb006HotspotEvidence(JSON.parse(hotspotResult.stdout));
    const built = buildSafeRuntime({
      helperSource: helper.toString("utf8"),
      framesHtml: framesHtml.toString("utf8"),
      spec: adapterSpec(),
    });
    invariant(built.placedFunctions.length === EXPECTED.placedFunctions.count &&
      sha256(JSON.stringify(built.placedFunctions)) === EXPECTED.placedFunctions.sha256 &&
      built.imageVariables.length === EXPECTED.embeddedImages.count &&
      sha256(JSON.stringify(built.imageVariables)) === EXPECTED.embeddedImages.sha256,
    "safe Canvas adapter allowlists changed");
    const runtimeBytes = Buffer.from(built.runtime);
    const browserEvidence = await browserRenderability(built.runtime);
    toolchain.chromium = browserEvidence.browser;
    const context = {
      browserEvidence,
      built,
      helper,
      hotspots,
      integrationBindings,
      preflight,
      protectedBefore,
      runtimeBytes,
      sourceAssociatedAudio,
      sourceFla,
      sourceSwf,
      swfmillXml,
      toolchain,
    };

    if (check) {
      const artifacts = buildArtifacts({...context, verifiedAfterWrite: true});
      validateG4L3Vb006CurrentJsCandidate(artifacts.report);
      await Promise.all([
        emit(OUTPUT_SCRIPT, artifacts.runtimeBytes, true),
        emit(OUTPUT_MANIFEST, artifacts.manifestBytes, true),
        emit(OUTPUT_REPORT_JSON, artifacts.reportJsonBytes, true),
        emit(OUTPUT_REPORT_MARKDOWN, artifacts.reportMarkdownBytes, true),
      ]);
      assertProtectedUnchanged(protectedBefore, await protectedSnapshot());
      await assertCompletionLedgerUnchanged(completionLedgerBefore);
      return {
        animationId: ANIMATION_ID,
        check: true,
        report: OUTPUT_REPORT_JSON,
        runtime: artifacts.report.outputs.canvasRuntime,
        manifest: artifacts.report.outputs.canvasManifest,
        candidateRenderability: artifacts.report.candidateRenderability,
        acceptance: artifacts.report.acceptance,
        strictAcceptanceEffect: "none",
      };
    }

    const preliminary = buildArtifacts({...context, verifiedAfterWrite: false});
    await Promise.all([
      emit(OUTPUT_SCRIPT, preliminary.runtimeBytes, false),
      emit(OUTPUT_MANIFEST, preliminary.manifestBytes, false),
      emit(OUTPUT_REPORT_JSON, preliminary.reportJsonBytes, false),
      emit(OUTPUT_REPORT_MARKDOWN, preliminary.reportMarkdownBytes, false),
    ]);
    assertProtectedUnchanged(protectedBefore, await protectedSnapshot());
    await assertCompletionLedgerUnchanged(completionLedgerBefore);
    const finalArtifacts = buildArtifacts({...context, verifiedAfterWrite: true});
    validateG4L3Vb006CurrentJsCandidate(finalArtifacts.report);
    await Promise.all([
      emit(OUTPUT_MANIFEST, finalArtifacts.manifestBytes, false),
      emit(OUTPUT_REPORT_JSON, finalArtifacts.reportJsonBytes, false),
      emit(OUTPUT_REPORT_MARKDOWN, finalArtifacts.reportMarkdownBytes, false),
    ]);
    assertProtectedUnchanged(protectedBefore, await protectedSnapshot());
    await assertCompletionLedgerUnchanged(completionLedgerBefore);
    return {
      animationId: ANIMATION_ID,
      check: false,
      report: OUTPUT_REPORT_JSON,
      runtime: finalArtifacts.report.outputs.canvasRuntime,
      manifest: finalArtifacts.report.outputs.canvasManifest,
      candidateRenderability: finalArtifacts.report.candidateRenderability,
      acceptance: finalArtifacts.report.acceptance,
      strictAcceptanceEffect: "none",
    };
  } finally {
    await rm(temporaryRoot, {recursive: true, force: true});
  }
}

function help() {
  return `Usage: node scripts/build-g4-l3-vb006-current-js-candidate.mjs [options]\n\n` +
    `Options:\n` +
    `  --check              Rebuild every hash-bound artifact in memory and fail if checked-in outputs differ\n` +
    `  --ffdec <command>    FFDec launcher (default: ffdec)\n` +
    `  --swfmill <command>  swfmill launcher (default: swfmill)\n` +
    `  --python <command>   Python launcher (default: python3)\n` +
    `  --ffmpeg <command>   FFmpeg launcher (default: ffmpeg)\n` +
    `  --ffprobe <command>  ffprobe launcher (default: ffprobe)\n` +
    `  -h, --help           Show this help\n`;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(help());
    return;
  }
  process.stdout.write(stableJson(await generateG4L3Vb006CurrentJsCandidate(options)));
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) await main();
