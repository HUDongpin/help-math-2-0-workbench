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

import {buildSafeRuntime} from "./build-safe-ffdec-canvas-adapter.mjs";
import {
  validateG4L3Ts006SourceAuditRebindReceipt,
} from "./build-g4-l3-ts006-source-audit-rebind-receipt.mjs";

const execFile = promisify(execFileCallback);
const scriptPath = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(scriptPath), "..");
const ANIMATION_ID = "course-g04-l03-ts-006";
const ARCHIVE_PREFIX = "source-assets/flash/HELP MATH_ORIGINAL FILES";
const SOURCE_SWF = `${ARCHIVE_PREFIX}/HELP_COURSES/ELMGR4/L3/TS/L3TS06.swf`;
const SOURCE_FLA = `${ARCHIVE_PREFIX}/HELP_COURSES/ELMGR4/L3/TS/L3TS06.fla`;
const SOURCE_ASSOCIATED_AUDIO =
  `${ARCHIVE_PREFIX}/HELP_COURSES/ELMGR4/L3/SA/L3TS06.mp3`;
const SOURCE_AUDIT =
  "migrations/course-g04-l03-ts-006/audit/machine/g4-l3-source-audit.json";
const SOURCE_AUDIT_REBIND_RECEIPT =
  "reports/g4-l3-ts006-source-audit-rebind-receipt.json";
const RUNTIME_PROTOCOL =
  "reports/g4-l3-ts006-original-runtime-session-protocol-draft.json";
const STRUCTURAL_BASELINE =
  "migrations/course-g04-l03-ts-006/baseline/ffdec-root-frames.json";
const SAFE_ADAPTER_BUILDER = "scripts/build-safe-ffdec-canvas-adapter.mjs";
const OUTPUT_SCRIPT =
  "public/flash-assets/courses/course-g04-l03-ts-006/canvas-renderer.js";
const OUTPUT_MANIFEST =
  "public/flash-assets/courses/course-g04-l03-ts-006/manifest.json";
const OUTPUT_REPORT_JSON =
  "reports/g4-l3-ts006-current-javascript-candidate.json";
const OUTPUT_REPORT_MARKDOWN =
  "reports/g4-l3-ts006-current-javascript-candidate.md";
const PUBLIC_ASSOCIATED_AUDIO =
  "public/flash-assets/audio/courses/course-g04-l03-ts-006/es.mp3";
const PUBLIC_AUDIO_MANIFEST =
  "public/flash-assets/audio/courses/manifest.json";
const REPORT_TYPE = "current-javascript-engineering-candidate";

const EXPECTED = Object.freeze({
  sourceSwf: Object.freeze({
    bytes: 55_154,
    sha256: "fa8962a6ca72c0bb213605a9836b62600992cb5c1cf955f7c871e857e90ddf47",
  }),
  sourceFla: Object.freeze({
    bytes: 3_950_592,
    sha256: "3f500c60b73b735eb001993b31ff101bf1615384c86b6a28987a84feef5b70dd",
  }),
  associatedAudio: Object.freeze({
    bytes: 106_848,
    sha256: "c0ea9f1cede741945c763707ed89c5be76f651f761209880157bf0c45ded8688",
  }),
  sourceAudit: Object.freeze({
    bytes: 8_195,
    sha256: "e27f043f7c2153896128cdd780a67b1d2c0e87557af9a622d42d4c0b76f41cfc",
  }),
  sourceAuditRebindReceipt: Object.freeze({
    bytes: 7_917,
    sha256: "23d82bac8009e57d222eaaf154e87768809402ce504d5b64a785bc255aa4e7a3",
  }),
  structuralBaseline: Object.freeze({
    bytes: 3_249,
    sha256: "5bed076d7e24dfb671925451395af03a2a7fb1fc53d1a2c88a04598c0be88367",
  }),
  canvasHelper: Object.freeze({
    bytes: 52_872,
    sha256: "78256220d01fba044341283703c3923a1ff8ff29499c51f65ab4e6ac825ccb93",
  }),
  canvasFrames: Object.freeze({
    bytes: 309_740,
    sha256: "124864509d2529299f29f8811551c135f1c3d46222c942e554f6e6be7cf1d484",
  }),
  placedFunctions: Object.freeze({
    count: 17,
    sha256: "6c6b7c6766214797585411c486ff9fb50b2926f6fd568529add2da64c83df575",
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
    executableSha256:
      "1a242c6333aa8dba0f18f635f9ea2585a988f4131aa5164b70eb00ad9e662bab",
  }),
  chromium: Object.freeze({
    invokedPath:
      "/Users/peter/Library/Caches/ms-playwright/chromium-1228/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing",
    version: "149.0.7827.55",
    executableSha256:
      "b1b9e2dd063115031f08eadc10ed381ca0fa05b2284baff8f721d87f5f0f61b7",
  }),
});

const ACCEPTANCE_KEYS = Object.freeze([
  "implementationAuthorized",
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
  "completionLedgerWriteAuthorized",
  "approvalOrPinWriteAuthorized",
  "productRouteWriteAuthorized",
  "publicStrictLibraryAdmissionAuthorized",
  "sourceAssetWriteAuthorized",
  "audioEnablementAuthorized",
  "hostActionScriptEnablementAuthorized",
  "rootRuntimeEnablementAuthorized",
  "companionRuntimeEnablementAuthorized",
  "visualParityClaimAuthorized",
  "migrationCompletionClaimAuthorized",
]);

const INTEGRATION_BINDINGS = Object.freeze([
  "apps/web/components/animation-runtime.tsx",
  "packages/demos/src/contract.ts",
  "packages/demos/src/runtime.ts",
  "packages/demos/src/source-static-canvas-candidate.tsx",
  "packages/demos/src/timelines/course-g04-l03-ts-006.ts",
  "packages/demos/src/modules/course-g04-l03-ts-006.tsx",
  "packages/demos/tests/course-g04-l03-ts-006.test.ts",
  "scripts/build-g4-l3-ts006-source-audit-rebind-receipt.mjs",
  "scripts/qa-ts006-spanish-host-audio.mjs",
  "scripts/qa-ts006-spanish-host-audio.test.mjs",
]);
const COMPLETION_LEDGER = "catalog/completion-ledger.json";

const PROTECTED_BINDINGS = Object.freeze([
  SOURCE_SWF,
  SOURCE_FLA,
  SOURCE_ASSOCIATED_AUDIO,
  PUBLIC_ASSOCIATED_AUDIO,
  PUBLIC_AUDIO_MANIFEST,
  SOURCE_AUDIT,
  SOURCE_AUDIT_REBIND_RECEIPT,
  STRUCTURAL_BASELINE,
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
  "sprite-23 frames 1..128 are a source-static drawing projection only. They do not establish natural runtime reachability, timing parity, terminal behavior, or visual parity.",
  "The separate one-frame sprite-3 page-title domain is inventoried but not rendered or composited by this bounded candidate.",
  "The exact associated Spanish MP3 is exposed only as a same-origin, user-activated product host-audio engineering candidate. This UI enablement is not implementation authorization or audio acceptance; source-media matching, spoken language/content, original-host semantics, synchronization, listening, and Replay reset remain unresolved.",
  "The embedded English stream remains disabled and has no established language, runtime reachability, synchronization, listening, or acceptance.",
  "Guide-layer language symbols, root navigation, host ActionScript, Spanish visuals, Replay/reset parity, full-frame original-runtime comparison, RMSE, product/accessibility QA, human review, owner acceptance, and strict completion remain false.",
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

function fingerprint(value) {
  return sha256(stableJson(value));
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function projectPath(relativePath) {
  invariant(typeof relativePath === "string" && relativePath.length > 0,
    "project-relative path is required");
  invariant(!path.isAbsolute(relativePath),
    `absolute project path is forbidden: ${relativePath}`);
  const resolved = path.resolve(ROOT, relativePath);
  const relative = path.relative(ROOT, resolved);
  invariant(relative && !relative.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relative), `path escapes the repository: ${relativePath}`);
  return resolved;
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
    throw new Error(`${command} failed${detail ? `:\n${detail}` : ""}`, {
      cause: error,
    });
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
    run(invokedPath, expected.versionArgs, {
      timeout: 30_000,
      maxBuffer: 8 * 1024 * 1024,
    }),
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
  invariant((await stat(absolute)).nlink === 1,
    `${relativePath} must not have multiple hard links`);
  const bytes = await readFile(absolute);
  return {
    path: portable(relativePath),
    bytes: bytes.length,
    sha256: sha256(bytes),
    contents: bytes,
  };
}

async function readPinned(relativePath, expected, label) {
  const binding = await readBinding(relativePath);
  invariant(binding.bytes === expected.bytes && binding.sha256 === expected.sha256,
    `${label} differs from its pinned identity`);
  return binding;
}

async function protectedSnapshot() {
  const files = (await Promise.all(PROTECTED_BINDINGS.map(readBinding)))
    .map(({contents, ...binding}) => binding)
    .sort((left, right) => left.path.localeCompare(right.path, "en"));
  return {
    fileCount: files.length,
    totalBytes: files.reduce((sum, item) => sum + item.bytes, 0),
    files,
    combinedManifestSha256: fingerprint(files),
  };
}

function assertProtectedUnchanged(before, after) {
  invariant(before.combinedManifestSha256 === after.combinedManifestSha256,
    "protected source/evidence/integration inventory changed during generation");
}

async function assertCompletionLedgerUnchanged(before) {
  const after = await readBinding(COMPLETION_LEDGER);
  invariant(before.sha256 === after.sha256 && before.bytes === after.bytes,
    "completion ledger changed during candidate generation");
}

async function assertBindingUnchanged(before, label) {
  const after = await readBinding(before.path);
  invariant(before.bytes === after.bytes && before.sha256 === after.sha256,
    `${label} changed during candidate generation`);
}

function falseBoundary(keys) {
  return Object.fromEntries(keys.map((key) => [key, false]));
}

export function buildSpanishHostAudioCandidate({
  publicAssociatedAudio,
  publicAudioManifest,
  sourceAssociatedAudio,
}) {
  invariant(sourceAssociatedAudio?.path === SOURCE_ASSOCIATED_AUDIO &&
    sourceAssociatedAudio.bytes === EXPECTED.associatedAudio.bytes &&
    sourceAssociatedAudio.sha256 === EXPECTED.associatedAudio.sha256,
  "TS006 Spanish host-audio source identity changed");
  invariant(publicAssociatedAudio?.path === PUBLIC_ASSOCIATED_AUDIO &&
    publicAssociatedAudio.bytes === sourceAssociatedAudio.bytes &&
    publicAssociatedAudio.sha256 === sourceAssociatedAudio.sha256 &&
    Buffer.from(publicAssociatedAudio.contents).equals(
      Buffer.from(sourceAssociatedAudio.contents),
    ),
  "TS006 public Spanish host-audio bytes differ from the exact source candidate");
  const document = JSON.parse(publicAudioManifest.contents.toString("utf8"));
  const entries = document.entries?.filter(
    ({animationId}) => animationId === ANIMATION_ID,
  ) || [];
  invariant(entries.length === 1, "TS006 public audio manifest entry is missing or ambiguous");
  const entry = entries[0];
  invariant(entry.id === "course-g04-l03-ts-006-es-host-audio" &&
    entry.language === "es" && entry.activation === "user" &&
    entry.sourceEvidence === SOURCE_ASSOCIATED_AUDIO &&
    entry.sourceSha256 === EXPECTED.associatedAudio.sha256 &&
    entry.output === PUBLIC_ASSOCIATED_AUDIO &&
    entry.publicUrl ===
      "/flash-assets/audio/courses/course-g04-l03-ts-006/es.mp3" &&
    entry.durationMs === 7_632 &&
    entry.authority === "exact-basename legacy-host routing only" &&
    entry.authoritativeListeningComplete === false &&
    entry.synchronizationComplete === false &&
    document.strictAcceptanceEffect === false,
  "TS006 public Spanish host-audio manifest exceeded its candidate-only boundary");
  return {
    status: "same-origin-user-activated-spanish-host-track-engineering-candidate-only",
    language: "es",
    activation: "user",
    timelineBehavior: "pause-while-playing",
    source: {
      path: sourceAssociatedAudio.path,
      bytes: sourceAssociatedAudio.bytes,
      sha256: sourceAssociatedAudio.sha256,
    },
    publicAsset: {
      path: publicAssociatedAudio.path,
      publicUrl: entry.publicUrl,
      bytes: publicAssociatedAudio.bytes,
      sha256: publicAssociatedAudio.sha256,
      exactSourceBytes: true,
    },
    publicManifest: {
      path: publicAudioManifest.path,
      bytes: publicAudioManifest.bytes,
      sha256: publicAudioManifest.sha256,
      entryId: entry.id,
    },
    embeddedAudioEnabled: false,
    sourceMediaMatchEstablished: false,
    spokenSpanishLanguageVerified: false,
    spokenContentVerified: false,
    authoritativeListeningComplete: false,
    originalHostAudioBehaviorParity: false,
    audioSynchronizationComplete: false,
    replayAudioResetAccepted: false,
    implementationAuthorized: false,
    audioAccepted: false,
    ownerAccepted: false,
    strictMigrationComplete: false,
    strictAcceptanceEffect: "none",
  };
}

export function validateSpanishHostAudioCandidateBoundary(candidate) {
  invariant(candidate?.status ===
    "same-origin-user-activated-spanish-host-track-engineering-candidate-only" &&
    candidate.language === "es" && candidate.activation === "user" &&
    candidate.timelineBehavior === "pause-while-playing" &&
    candidate.source?.path === SOURCE_ASSOCIATED_AUDIO &&
    candidate.source?.sha256 === EXPECTED.associatedAudio.sha256 &&
    candidate.publicAsset?.path === PUBLIC_ASSOCIATED_AUDIO &&
    candidate.publicAsset?.publicUrl ===
      "/flash-assets/audio/courses/course-g04-l03-ts-006/es.mp3" &&
    candidate.publicAsset?.sha256 === EXPECTED.associatedAudio.sha256 &&
    candidate.publicAsset?.exactSourceBytes === true &&
    candidate.embeddedAudioEnabled === false &&
    candidate.strictAcceptanceEffect === "none",
  "TS006 Spanish host-audio candidate identity or scope drifted");
  for (const key of [
    "sourceMediaMatchEstablished",
    "spokenSpanishLanguageVerified",
    "spokenContentVerified",
    "authoritativeListeningComplete",
    "originalHostAudioBehaviorParity",
    "audioSynchronizationComplete",
    "replayAudioResetAccepted",
    "implementationAuthorized",
    "audioAccepted",
    "ownerAccepted",
    "strictMigrationComplete",
  ]) {
    invariant(candidate[key] === false,
      `TS006 Spanish host-audio candidate cannot promote ${key}`);
  }
  return candidate;
}

export function runtimeProtocolAuthorityBoundary(protocol) {
  return {
    schemaVersion: protocol?.schemaVersion,
    reportType: protocol?.reportType,
    executionGate: {
      authorizedHostContextIdentified:
        protocol?.executionGate?.authorizedHostContextIdentified,
      containmentControlsApproved:
        protocol?.executionGate?.containmentControlsApproved,
      containmentMechanismsSelected:
        protocol?.executionGate?.containmentMechanismsSelected,
      liveCapacityPreflightPassed:
        protocol?.executionGate?.liveCapacityPreflightPassed,
      namedOriginalRuntimeOperatorSupplied:
        protocol?.executionGate?.namedOriginalRuntimeOperatorSupplied,
      originalRuntimeExecutionReady:
        protocol?.executionGate?.originalRuntimeExecutionReady,
      ownerRuntimeApprovalBound:
        protocol?.executionGate?.ownerRuntimeApprovalBound,
      state: protocol?.executionGate?.state,
      traceScheduleAccepted:
        protocol?.executionGate?.traceScheduleAccepted,
      launchesRuntimeByThisBuilder:
        protocol?.executionGate?.launchesRuntimeByThisBuilder,
      launchesAnimateByThisBuilder:
        protocol?.executionGate?.launchesAnimateByThisBuilder,
    },
    acceptance: {
      acceptanceNeutral: protocol?.acceptance?.acceptanceNeutral,
      audioAccepted: protocol?.acceptance?.audioAccepted,
      authoritativeOriginalRuntimeAccepted:
        protocol?.acceptance?.authoritativeOriginalRuntimeAccepted,
      containmentApproved: protocol?.acceptance?.containmentApproved,
      humanVisualAccepted: protocol?.acceptance?.humanVisualAccepted,
      implementationAuthorized:
        protocol?.acceptance?.implementationAuthorized,
      ownerAccepted: protocol?.acceptance?.ownerAccepted,
      runtimeApproved: protocol?.acceptance?.runtimeApproved,
      strictMigrationComplete:
        protocol?.acceptance?.strictMigrationComplete,
    },
    scope: {
      runtimeSessionsExecuted: protocol?.scope?.runtimeSessionsExecuted,
    },
  };
}

function adapterSpec(runtimeProtocolAuthorityBoundarySha256) {
  return {
    schemaVersion: 1,
    animationId: ANIMATION_ID,
    classification: "source-static-current-javascript-engineering-candidate-only",
    source: {swf: SOURCE_SWF, swfSha256: EXPECTED.sourceSwf.sha256},
    evidence: {
      scenarioInventorySha256: EXPECTED.sourceAudit.sha256,
      // buildSafeRuntime retains the older adapter field name, but this
      // source-static generator has no accepted audio audit. Bind the stable,
      // fail-closed runtime authority projection instead of whole draft bytes.
      audioAuditSha256: runtimeProtocolAuthorityBoundarySha256,
    },
    ffdecExport: {
      tool: EXPECTED_TOOLS.ffdec.version,
      helper: "ephemeral-fresh-ffdec-export/canvas.js",
      helperSha256: EXPECTED.canvasHelper.sha256,
      framesHtml: "ephemeral-fresh-ffdec-export/frames.html",
      framesHtmlSha256: EXPECTED.canvasFrames.sha256,
      targetSpriteObjectId: 23,
      targetSpriteFunction: "sprite23",
      exportCanvas: {width: 477, height: 174},
      exportInternalTranslation: {x: 235.65, y: 132.15},
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
        placementTwips: {x: 8_241, y: 5_668},
        placementPixels: {x: 412.05, y: 283.4},
      },
      local: {
        timelineId: "sprite-23",
        frameCount: 128,
        playbackMode: "once",
        publicFrameIndexing: "one-indexed",
      },
      stageRenderOffset: {x: 176.4, y: 151.25},
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

function validateStaticEvidence(sourceAudit, protocol, structuralBaseline) {
  invariant(sourceAudit.artifactType === "g4-l3-workspace-source-audit" &&
    sourceAudit.identity?.animationId === ANIMATION_ID,
  "TS006 source audit identity changed");
  invariant(sourceAudit.machineFindings?.runtime?.stage?.width === 800 &&
    sourceAudit.machineFindings.runtime.stage.height === 600 &&
    sourceAudit.machineFindings.runtime.fps === 12 &&
    sourceAudit.machineFindings.runtime.rootFrameCount === 10 &&
    sourceAudit.machineFindings.runtime.backgroundColor === "#b8d8f7",
  "TS006 source audit runtime metadata changed");
  invariant(sourceAudit.machineFindings?.scripts?.random?.occurrences === 0 &&
    sourceAudit.machineFindings.scripts.externalApiCandidates.length === 0 &&
    sourceAudit.machineFindings.evidenceLimits.authoritativeRuntimeLaunched === false,
  "TS006 static script or runtime boundary changed");
  const boundary = runtimeProtocolAuthorityBoundary(protocol);
  invariant(boundary.schemaVersion === 1 && boundary.reportType ===
    "g4-l3-ts006-original-runtime-session-protocol-draft" &&
    boundary.scope.runtimeSessionsExecuted === 0 &&
    boundary.executionGate.state ===
      "closed-protocol-draft-prepared-not-authorized" &&
    boundary.executionGate.launchesRuntimeByThisBuilder === false &&
    boundary.executionGate.launchesAnimateByThisBuilder === false &&
    Object.entries(boundary.executionGate)
      .filter(([key]) => ![
        "state",
        "launchesRuntimeByThisBuilder",
        "launchesAnimateByThisBuilder",
      ].includes(key))
      .every(([, value]) => value === false) &&
    boundary.acceptance.acceptanceNeutral === true &&
    Object.entries(boundary.acceptance)
      .filter(([key]) => key !== "acceptanceNeutral")
      .every(([, value]) => value === false),
  "TS006 runtime protocol exceeded its draft-only boundary");
  invariant(structuralBaseline.animationId === ANIMATION_ID &&
    structuralBaseline.status === "structural-baseline-only" &&
    structuralBaseline.frames?.length === 10 &&
    structuralBaseline.frames.slice(5).every((frame) =>
      frame.sha256 === "fa5903e9b5ed7089e5fbd353819f160c8a2a74de8a15cab3c02b1dfc143e78a7"),
  "TS006 structural root-frame evidence changed");
}

async function browserRenderability(runtime) {
  const executablePath = chromium.executablePath();
  invariant(executablePath === EXPECTED_TOOLS.chromium.invokedPath,
    `Playwright Chromium path changed: ${executablePath}`);
  const executableBytes = await readFile(await realpath(executablePath));
  invariant(sha256(executableBytes) === EXPECTED_TOOLS.chromium.executableSha256,
    "Playwright Chromium executable SHA-256 changed");
  const browser = await chromium.launch({headless: true});
  const requests = [];
  const consoleErrors = [];
  const pageErrors = [];
  try {
    invariant(browser.version() === EXPECTED_TOOLS.chromium.version,
      `Playwright Chromium version changed: ${browser.version()}`);
    const page = await browser.newPage({viewport: {width: 800, height: 600}});
    page.on("request", (request) => requests.push(request.url()));
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => pageErrors.push(error.message));
    await page.setContent(
      "<!doctype html><meta charset=utf-8><title>TS006 renderability harness</title>",
    );
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
          frameDomain: "sprite-23",
          localFrame: frame,
          exportFrame: frame - 1,
          rootFrame: 6,
          scenario: "source-static-frame",
          lang: "en",
          seed: 0,
        };
        for (const [name, value] of Object.entries(expected)) {
          if (state[name] !== value) {
            throw new Error(`frame ${frame} state mismatch: ${name}`);
          }
        }
        if (state.interactiveStateResolved !== false ||
          state.audioRendered !== false || state.visualOnly !== true) {
          throw new Error(`frame ${frame} safety state changed`);
        }
        if (getComputedStyle(canvas).pointerEvents !== "none") {
          throw new Error(`frame ${frame} pointer events were enabled`);
        }
        const pngUrl = canvas.toDataURL("image/png");
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
          return {
            name,
            blocked: true,
            message: error instanceof Error ? error.message : String(error),
          };
        }
      };
      return {
        frames,
        negativeProbes: [
          probe("spanish", {frame: 1, scenario: "source-static-frame", lang: "es", seed: 0}),
          probe("root", {frame: 1, scenario: "root-unavailable", lang: "en", seed: 0}),
          probe("sprite-3", {frame: 1, scenario: "sprite-3-unavailable", lang: "en", seed: 0}),
          probe("audio", {frame: 1, scenario: "audio", lang: "en", seed: 0}),
          probe("replay", {frame: 1, scenario: "replay", lang: "en", seed: 0}),
          probe("out-of-range", {frame: frameCount + 1, scenario: "source-static-frame", lang: "en", seed: 0}),
        ],
        exposedMethods: Object.keys(asset).sort(),
      };
    }, {animationId: ANIMATION_ID, frameCount: 128});
    result.frames = result.frames.map(({pngBase64, ...frame}) => {
      const bytes = Buffer.from(pngBase64, "base64");
      return {...frame, bytes: bytes.length, sha256: sha256(bytes)};
    });
    invariant(result.frames.length === 128 &&
      result.frames.every((frame, index) => frame.frame === index + 1 &&
        frame.exportFrame === index && frame.bytes > 0 &&
        /^[a-f0-9]{64}$/.test(frame.sha256)),
    "browser did not execute and encode all 128 source-static frames");
    invariant(new Set(result.frames.map((frame) => frame.sha256)).size === 1,
      "TS006 source-static visual unexpectedly differs across the 128 frames");
    invariant(result.negativeProbes.every((probe) => probe.blocked === true),
      "one or more unsupported browser runtime requests did not fail closed");
    invariant(JSON.stringify(result.exposedMethods) ===
      JSON.stringify(["metadata", "ready", "render", "resolveFrameState"]),
    "candidate runtime exposed unexpected methods");
    invariant(requests.length === 0 && consoleErrors.length === 0 &&
      pageErrors.length === 0,
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
      frameDomain: "sprite-23",
      firstFrame: 1,
      lastFrame: 128,
      executedFrameCount: 128,
      pngEncodedFrameCount: 128,
      uniqueVisualFrameCount: 1,
      frameManifestSha256: fingerprint(result.frames),
      frames: result.frames,
      negativeProbes: result.negativeProbes,
      exposedMethods: result.exposedMethods,
      unexpectedNetworkRequestCount: requests.length,
      consoleErrorCount: consoleErrors.length,
      pageErrorCount: pageErrors.length,
      originalRuntimeBaselineUsed: false,
      structuralBaselineUsedForParity: false,
      rmseComputed: false,
      visualParityClaimed: false,
      behaviorParityClaimed: false,
    };
  } finally {
    await browser.close();
  }
}

function renderMarkdown(report) {
  const acceptanceRows = Object.entries(report.acceptance)
    .map(([key, value]) => `| \`${key}\` | ${value} |`).join("\n");
  return `# G4 L3 TS006 current-JavaScript engineering candidate\n\n` +
    `This is a hash-bound, prototype-registry-only rendering candidate plus an exact same-origin user-activated Spanish host-audio engineering candidate for \`${ANIMATION_ID}\`. It is not an authoritative Flash baseline, visual or behavioral parity result, source-media match, audio acceptance, human/owner acceptance, strict migration, public-library admission, or production admission.\n\n` +
    `## Bounded result\n\n` +
    `- Source SWF: \`${report.source.swf.path}\` (SHA-256 \`${report.source.swf.sha256}\`).\n` +
    `- Source-audit rebind: old \`${report.evidenceBindings.sourceAuditRebindReceipt.transitionFromSha256}\` → current \`${report.evidenceBindings.sourceAuditRebindReceipt.transitionToSha256}\`, through the acceptance-neutral receipt \`${report.evidenceBindings.sourceAuditRebindReceipt.sha256}\`; the unavailable old audit bytes were not represented as a full field-by-field diff.\n` +
    `- Implemented address space: English-only \`sprite-23\` frames 1–128, muted and noninteractive.\n` +
    `- Runtime: \`${report.outputs.canvasRuntime.path}\` (SHA-256 \`${report.outputs.canvasRuntime.sha256}\`).\n` +
    `- Spanish host-audio candidate: \`${report.hostAudioCandidate.publicAsset.publicUrl}\`, user-activated and same-origin; embedded audio remains disabled.\n` +
    `- Browser execution: ${report.candidateRenderability.executedFrameCount}/128 frames encoded at 800×600; all 128 frames share one visual hash.\n` +
    `- Classification: **candidate renderability only**. The structural FFDec root frames are not an authoritative original-runtime baseline and were not used for RMSE.\n` +
    `- Root, sprite-3, Spanish visuals, embedded audio, original-host audio semantics, source-media matching, listening/synchronization, Replay parity, host ActionScript, and strict pointer behavior remain fail closed.\n\n` +
    `## Acceptance boundary\n\n| Gate | Accepted |\n|---|---:|\n${acceptanceRows}\n\n` +
    `## Unresolved obligations\n\n${report.unresolved.map((item) => `- ${item}`).join("\n")}\n`;
}

function buildArtifacts({
  browserEvidence,
  built,
  evidenceBindings,
  helper,
  integrationBindings,
  protectedBefore,
  runtimeBytes,
  sourceAssociatedAudio,
  sourceFla,
  sourceSwf,
  spanishHostAudioCandidate,
  toolchain,
  verifiedAfterWrite,
}) {
  const acceptance = falseBoundary(ACCEPTANCE_KEYS);
  const authorization = falseBoundary(AUTHORIZATION_KEYS);
  const writeScope = {
    allowedOutputs: [...ALLOWED_OUTPUTS],
    protectedBefore,
    protectedAfter: protectedBefore,
    protectedManifestUnchanged: verifiedAfterWrite,
    verifiedAfterWrite,
    sourceAssetsWritten: false,
    migrationFilesWritten: false,
    ledgerWritten: false,
    approvalOrPinFilesWritten: false,
    productRouteWritten: false,
  };
  const manifest = {
    schemaVersion: 2,
    animationId: ANIMATION_ID,
    status: "source-static-current-javascript-engineering-candidate-only",
    authority:
      "Fresh hash-bound SWF extraction, deterministic Chromium renderability, and an exact same-origin user-activated Spanish host-audio product candidate only; not authoritative runtime, visual parity, behavior parity, localization parity, source-media matching, audio acceptance, human, owner, or strict acceptance.",
    generatedBy: integrationBindings.filter((entry) =>
      [portable(path.relative(ROOT, scriptPath)), SAFE_ADAPTER_BUILDER]
        .includes(entry.path)),
    source: {
      swf: {...sourceSwf, contents: undefined},
      fla: {...sourceFla, contents: undefined, authoringAuditPerformedByGenerator: false},
      associatedAudio: {
        ...sourceAssociatedAudio,
        contents: undefined,
        normalizedLanguageCandidate: "es",
        spokenLanguageEstablished: false,
        rendered: false,
        renderedByCanvasRuntime: false,
        stagedForUserActivatedProductHostCandidate: true,
      },
      embeddedAudio: {
        sha256: "4d50cee1ee64bec0919933132ec250212474f236c699cd007a40f9ff2dce3122",
        technicalDurationMs: 10_632,
        languageEstablished: false,
        rendered: false,
      },
    },
    hostAudioCandidate: spanishHostAudioCandidate,
    evidenceBindings,
    toolchain,
    extraction: {
      helper: {bytes: helper.length, sha256: sha256(helper)},
      framesHtml: {
        bytes: EXPECTED.canvasFrames.bytes,
        sha256: EXPECTED.canvasFrames.sha256,
      },
      drawingObjectCount: built.placedFunctions.length,
      drawingObjectsSha256: sha256(JSON.stringify(built.placedFunctions)),
      embeddedImageCount: built.imageVariables.length,
      embeddedImageVariablesSha256: sha256(JSON.stringify(built.imageVariables)),
    },
    runtime: {
      ...built.metadata,
      boundedScope: {
        frameDomain: "sprite-23",
        frames: {first: 1, lastInclusive: 128},
        language: "en",
        scenario: "source-static-frame",
        audio:
          "canvas-runtime-disabled; separate-same-origin-user-activated-spanish-host-track-engineering-candidate",
        pointerInteraction: "disabled",
        hostActionScript: "disabled",
      },
      blocked: {
        root: true,
        "sprite-3": true,
        spanish: true,
        embeddedAudio: true,
        associatedAudioInCanvasRuntime: true,
        associatedAudio: true,
        replayParity: true,
        hostActionScript: true,
      },
    },
    safety: {
      scope: "generated-canvas-runtime-only",
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
    batch: {lesson: "G4 L3", batchId: "batch-002", batchOrdinal: 14},
    classification: {
      section: "TS",
      page: 6,
      titleRaw: "4 Step Plan",
      titleDisplay: "4 Step Plan",
      titleSpanishCatalogOnly: "Plan de 4 Pasos",
      domain: "assessment",
    },
    disposition: {
      currentJavaScriptCandidate: true,
      candidateRenderabilityOnly: true,
      prototypeRegistryOnly: true,
      spanishHostAudioEngineeringCandidate: true,
      migrationWorkspaceChanged: false,
      strictLedgerChanged: false,
      approvalOrPinChanged: false,
      productRouteAdded: false,
      publicLibraryAdmitted: false,
      productionAdmission: false,
      strictMigrationComplete: false,
    },
    source: manifest.source,
    hostAudioCandidate: spanishHostAudioCandidate,
    evidenceBindings,
    toolchain,
    integrationBindings,
    timeline: {
      stage: {width: 800, height: 600, backgroundColor: "#b8d8f7"},
      fps: 12,
      root: {frameDomain: "root", frameCount: 10, renderable: false},
      companion: {frameDomain: "sprite-3", frameCount: 1, renderable: false},
      main: {
        frameDomain: "sprite-23",
        frameCount: 128,
        naturalDurationMs: (128 * 1_000) / 12,
        publicFrameIndexing: "one-indexed",
        language: "en",
        uniqueStructuralVisualFrames: 1,
        audioRendered: false,
        interactionEnabled: false,
        status: "source-static-drawing-only",
      },
    },
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
      prototypeModule: "packages/demos/src/modules/course-g04-l03-ts-006.tsx",
      pureTimeline: "packages/demos/src/timelines/course-g04-l03-ts-006.ts",
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

export function validateG4L3Ts006CurrentJsCandidate(report) {
  invariant(report?.schemaVersion === 2 && report.reportType === REPORT_TYPE &&
    report.animationId === ANIMATION_ID,
  "TS006 candidate report identity is invalid");
  invariant(report.disposition.currentJavaScriptCandidate === true &&
    report.disposition.candidateRenderabilityOnly === true &&
    report.disposition.prototypeRegistryOnly === true &&
    report.disposition.spanishHostAudioEngineeringCandidate === true &&
    Object.entries(report.disposition)
      .filter(([key]) => ![
        "currentJavaScriptCandidate",
        "candidateRenderabilityOnly",
        "prototypeRegistryOnly",
        "spanishHostAudioEngineeringCandidate",
      ].includes(key))
      .every(([, value]) => value === false),
  "TS006 candidate disposition was promoted");
  validateSpanishHostAudioCandidateBoundary(report.hostAudioCandidate);
  const integrationPaths = new Set(
    report.integrationBindings?.map(({path: bindingPath}) => bindingPath) || [],
  );
  invariant(INTEGRATION_BINDINGS.every((bindingPath) =>
    integrationPaths.has(bindingPath)),
  "TS006 candidate is missing a hash-bound implementation or host-audio QA file");
  invariant(report.evidenceBindings?.spanishHostAudioCandidate?.authority ===
    "exact-byte same-origin user-activated current-JavaScript product candidate only" &&
    report.evidenceBindings.spanishHostAudioCandidate.sourceMediaMatchEstablished === false &&
    report.evidenceBindings.spanishHostAudioCandidate.authoritativeListeningComplete === false &&
    report.evidenceBindings.spanishHostAudioCandidate.audioAccepted === false &&
    report.evidenceBindings.spanishHostAudioCandidate.strictAcceptanceEffect === "none",
  "TS006 Spanish host-audio evidence binding was promoted or omitted");
  invariant(report.evidenceBindings?.sourceAudit?.path === SOURCE_AUDIT &&
    report.evidenceBindings.sourceAudit.bytes === EXPECTED.sourceAudit.bytes &&
    report.evidenceBindings.sourceAudit.sha256 === EXPECTED.sourceAudit.sha256 &&
    report.evidenceBindings.sourceAuditRebindReceipt?.path ===
      SOURCE_AUDIT_REBIND_RECEIPT &&
    report.evidenceBindings.sourceAuditRebindReceipt.bytes ===
      EXPECTED.sourceAuditRebindReceipt.bytes &&
    report.evidenceBindings.sourceAuditRebindReceipt.sha256 ===
      EXPECTED.sourceAuditRebindReceipt.sha256 &&
    report.evidenceBindings.sourceAuditRebindReceipt.transitionFromSha256 ===
      "6b09c03c708f35fcd1fdb1cde365d41d21a1a8296d5f687c2f4ab6ef11c93fb1" &&
    report.evidenceBindings.sourceAuditRebindReceipt.transitionToSha256 ===
      EXPECTED.sourceAudit.sha256 &&
    /^[a-f0-9]{64}$/.test(
      report.evidenceBindings.sourceAuditRebindReceipt
        .semanticProjectionSha256 || "",
    ) &&
    report.evidenceBindings.sourceAuditRebindReceipt
      .fullHistoricalByteDiffPerformed === false &&
    report.evidenceBindings.sourceAuditRebindReceipt.strictAcceptanceEffect ===
      "none",
  "TS006 source-audit rebind receipt is missing, stale, or promoted");
  invariant(AUTHORIZATION_KEYS.every((key) => report.authorization[key] === false) &&
    Object.keys(report.authorization).length === AUTHORIZATION_KEYS.length,
  "TS006 authorization fields must all remain false");
  invariant(ACCEPTANCE_KEYS.every((key) => report.acceptance[key] === false) &&
    Object.keys(report.acceptance).length === ACCEPTANCE_KEYS.length &&
    report.strictAcceptanceEffect === "none",
  "TS006 acceptance fields must all remain false");
  invariant(report.candidateRenderability.classification ===
    "candidate-renderability-only-not-visual-parity" &&
    report.candidateRenderability.executedFrameCount === 128 &&
    report.candidateRenderability.pngEncodedFrameCount === 128 &&
    report.candidateRenderability.uniqueVisualFrameCount === 1 &&
    report.candidateRenderability.frames.length === 128 &&
    report.candidateRenderability.negativeProbes.every((entry) => entry.blocked) &&
    report.candidateRenderability.originalRuntimeBaselineUsed === false &&
    report.candidateRenderability.rmseComputed === false &&
    report.candidateRenderability.visualParityClaimed === false &&
    report.candidateRenderability.behaviorParityClaimed === false,
  "TS006 browser evidence exceeds or fails the renderability-only boundary");
  invariant(report.writeScope.verifiedAfterWrite === true &&
    report.writeScope.protectedManifestUnchanged === true &&
    report.writeScope.sourceAssetsWritten === false &&
    report.writeScope.migrationFilesWritten === false &&
    report.writeScope.ledgerWritten === false &&
    report.writeScope.approvalOrPinFilesWritten === false,
  "TS006 candidate write boundary is not closed");
  invariant(report.evidenceBindings?.runtimeProtocol?.bindingMode ===
    "draft-authority-boundary-projection-v1" &&
    /^[a-f0-9]{64}$/.test(
      report.evidenceBindings.runtimeProtocol.authorityBoundarySha256 || "",
    ) &&
    report.evidenceBindings.runtimeProtocol.exactProtocolBytesBound === false &&
    report.evidenceBindings.runtimeProtocol.authority ===
      "draft-only-zero-runtime-sessions" &&
    report.writeScope.protectedBefore.files.every((entry) =>
      entry.path !== RUNTIME_PROTOCOL),
  "TS006 runtime protocol binding must remain a semantic draft-only boundary");
  const projected = {...report};
  delete projected.reportFingerprintSha256;
  invariant(report.reportFingerprintSha256 === fingerprint(projected),
    "TS006 candidate report fingerprint is stale");
  return report;
}

async function assertSafeOutputTarget(relativePath) {
  invariant(ALLOWED_OUTPUTS.includes(relativePath),
    `undeclared output target: ${relativePath}`);
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
  const options = {check: false, ffdec: "ffdec"};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--check") options.check = true;
    else if (argument === "--ffdec") {
      const value = argv[index + 1];
      invariant(value && !value.startsWith("--"), "--ffdec requires a value");
      options.ffdec = value;
      index += 1;
    } else if (argument === "--help" || argument === "-h") options.help = true;
    else throw new Error(`unknown argument: ${argument}`);
  }
  return options;
}

export async function generateG4L3Ts006CurrentJsCandidate({
  check = false,
  ffdec = "ffdec",
} = {}) {
  const protectedBefore = await protectedSnapshot();
  const completionLedgerBefore = await readBinding(COMPLETION_LEDGER);
  const [
    sourceSwf,
    sourceFla,
    sourceAssociatedAudio,
    publicAssociatedAudio,
    publicAudioManifest,
    sourceAudit,
    sourceAuditRebindReceipt,
    runtimeProtocol,
    structuralBaseline,
    generator,
    safeBuilder,
    ...integrationTail
  ] = await Promise.all([
    readPinned(SOURCE_SWF, EXPECTED.sourceSwf, "TS006 source SWF"),
    readPinned(SOURCE_FLA, EXPECTED.sourceFla, "TS006 source FLA"),
    readPinned(SOURCE_ASSOCIATED_AUDIO, EXPECTED.associatedAudio,
      "TS006 associated audio"),
    readPinned(PUBLIC_ASSOCIATED_AUDIO, EXPECTED.associatedAudio,
      "TS006 public Spanish host-audio candidate"),
    readBinding(PUBLIC_AUDIO_MANIFEST),
    readPinned(SOURCE_AUDIT, EXPECTED.sourceAudit, "TS006 source audit"),
    readPinned(
      SOURCE_AUDIT_REBIND_RECEIPT,
      EXPECTED.sourceAuditRebindReceipt,
      "TS006 source-audit rebind receipt",
    ),
    readBinding(RUNTIME_PROTOCOL),
    readPinned(STRUCTURAL_BASELINE, EXPECTED.structuralBaseline,
      "TS006 structural baseline"),
    readBinding(portable(path.relative(ROOT, scriptPath))),
    readBinding(SAFE_ADAPTER_BUILDER),
    ...INTEGRATION_BINDINGS.map(readBinding),
  ]);
  const integrationBindings = [generator, safeBuilder, ...integrationTail]
    .map(({contents, ...binding}) => binding)
    .sort((left, right) => left.path.localeCompare(right.path, "en"));
  validateStaticEvidence(
    JSON.parse(sourceAudit.contents),
    JSON.parse(runtimeProtocol.contents),
    JSON.parse(structuralBaseline.contents),
  );
  const sourceAuditRebindReceiptDocument = JSON.parse(
    sourceAuditRebindReceipt.contents.toString("utf8"),
  );
  validateG4L3Ts006SourceAuditRebindReceipt(
    sourceAuditRebindReceiptDocument,
    {
      currentAuditBinding: sourceAudit,
      sourceSwfBinding: sourceSwf,
      sourceFlaBinding: sourceFla,
    },
  );
  const spanishHostAudioCandidate = buildSpanishHostAudioCandidate({
    publicAssociatedAudio,
    publicAudioManifest,
    sourceAssociatedAudio,
  });
  validateSpanishHostAudioCandidateBoundary(spanishHostAudioCandidate);
  const toolchain = {ffdec: await inspectTool(ffdec, EXPECTED_TOOLS.ffdec, "FFDec")};
  const temporaryRoot = await mkdtemp(
    path.join(os.tmpdir(), "help-math-ts006-candidate-"),
  );
  try {
    const canvasDirectory = path.join(temporaryRoot, "canvas");
    const canvasExport = await run(toolchain.ffdec.invokedPath, [
      "-config", "packJavaScripts=false",
      "-onerror", "abort",
      "-selectid", "23",
      "-format", "sprite:canvas",
      "-export", "sprite",
      canvasDirectory,
      projectPath(SOURCE_SWF),
    ]);
    invariant(`${canvasExport.stdout}\n${canvasExport.stderr}`
      .includes(EXPECTED_TOOLS.ffdec.version),
    "fresh FFDec exporter version changed");
    const [helper, framesHtml] = await Promise.all([
      readFile(path.join(canvasDirectory, "DefineSprite_23", "canvas.js")),
      readFile(path.join(canvasDirectory, "DefineSprite_23", "frames.html")),
    ]);
    invariant(helper.length === EXPECTED.canvasHelper.bytes &&
      sha256(helper) === EXPECTED.canvasHelper.sha256,
    "fresh FFDec Canvas helper changed");
    invariant(framesHtml.length === EXPECTED.canvasFrames.bytes &&
      sha256(framesHtml) === EXPECTED.canvasFrames.sha256,
    "fresh FFDec sprite-23 frame export changed");
    const runtimeProtocolBoundary = runtimeProtocolAuthorityBoundary(
      JSON.parse(runtimeProtocol.contents),
    );
    const runtimeProtocolAuthorityBoundarySha256 = fingerprint(
      runtimeProtocolBoundary,
    );
    const built = buildSafeRuntime({
      helperSource: helper.toString("utf8"),
      framesHtml: framesHtml.toString("utf8"),
      spec: adapterSpec(runtimeProtocolAuthorityBoundarySha256),
    });
    invariant(built.placedFunctions.length === EXPECTED.placedFunctions.count &&
      sha256(JSON.stringify(built.placedFunctions)) ===
        EXPECTED.placedFunctions.sha256 &&
      built.imageVariables.length === EXPECTED.embeddedImages.count &&
      sha256(JSON.stringify(built.imageVariables)) === EXPECTED.embeddedImages.sha256,
    "safe Canvas adapter allowlists changed");
    const runtimeBytes = Buffer.from(built.runtime);
    const browserEvidence = await browserRenderability(built.runtime);
    toolchain.chromium = browserEvidence.browser;
    const evidenceBindings = {
      sourceAudit: {
        path: sourceAudit.path,
        bytes: sourceAudit.bytes,
        sha256: sourceAudit.sha256,
        authority: "static-machine-source-evidence-only",
      },
      sourceAuditRebindReceipt: {
        path: sourceAuditRebindReceipt.path,
        bytes: sourceAuditRebindReceipt.bytes,
        sha256: sourceAuditRebindReceipt.sha256,
        transitionFromSha256:
          sourceAuditRebindReceiptDocument.transition.from.sha256,
        transitionToSha256:
          sourceAuditRebindReceiptDocument.transition.to.sha256,
        semanticProjectionSha256:
          sourceAuditRebindReceiptDocument.semanticProjection.currentSha256,
        fullHistoricalByteDiffPerformed: false,
        authority:
          "acceptance-neutral transparent source-audit rebind receipt only",
        strictAcceptanceEffect: "none",
      },
      runtimeProtocol: {
        path: runtimeProtocol.path,
        bindingMode: "draft-authority-boundary-projection-v1",
        authorityBoundarySha256: runtimeProtocolAuthorityBoundarySha256,
        authority: "draft-only-zero-runtime-sessions",
        exactProtocolBytesBound: false,
        reason:
          "The candidate binds only fail-closed runtime authority semantics; incidental protocol sourceBindings are excluded to avoid a circular evidence hash dependency.",
      },
      structuralRootFrames: {
        path: structuralBaseline.path,
        bytes: structuralBaseline.bytes,
        sha256: structuralBaseline.sha256,
        authority: "structural-baseline-only-not-original-runtime",
      },
      spanishHostAudioCandidate: {
        source: spanishHostAudioCandidate.source,
        publicAsset: spanishHostAudioCandidate.publicAsset,
        publicManifest: spanishHostAudioCandidate.publicManifest,
        authority:
          "exact-byte same-origin user-activated current-JavaScript product candidate only",
        sourceMediaMatchEstablished: false,
        authoritativeListeningComplete: false,
        audioAccepted: false,
        strictAcceptanceEffect: "none",
      },
    };
    const context = {
      browserEvidence,
      built,
      evidenceBindings,
      helper,
      integrationBindings,
      protectedBefore,
      runtimeBytes,
      sourceAssociatedAudio,
      sourceFla,
      sourceSwf,
      spanishHostAudioCandidate,
      toolchain,
    };
    if (check) {
      const artifacts = buildArtifacts({...context, verifiedAfterWrite: true});
      validateG4L3Ts006CurrentJsCandidate(artifacts.report);
      await Promise.all([
        emit(OUTPUT_SCRIPT, artifacts.runtimeBytes, true),
        emit(OUTPUT_MANIFEST, artifacts.manifestBytes, true),
        emit(OUTPUT_REPORT_JSON, artifacts.reportJsonBytes, true),
        emit(OUTPUT_REPORT_MARKDOWN, artifacts.reportMarkdownBytes, true),
      ]);
      assertProtectedUnchanged(protectedBefore, await protectedSnapshot());
      await assertBindingUnchanged(runtimeProtocol, "TS006 runtime protocol");
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
    await assertBindingUnchanged(runtimeProtocol, "TS006 runtime protocol");
    await assertCompletionLedgerUnchanged(completionLedgerBefore);
    const finalArtifacts = buildArtifacts({...context, verifiedAfterWrite: true});
    validateG4L3Ts006CurrentJsCandidate(finalArtifacts.report);
    await Promise.all([
      emit(OUTPUT_MANIFEST, finalArtifacts.manifestBytes, false),
      emit(OUTPUT_REPORT_JSON, finalArtifacts.reportJsonBytes, false),
      emit(OUTPUT_REPORT_MARKDOWN, finalArtifacts.reportMarkdownBytes, false),
    ]);
    assertProtectedUnchanged(protectedBefore, await protectedSnapshot());
    await assertBindingUnchanged(runtimeProtocol, "TS006 runtime protocol");
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
  return `Usage: node scripts/build-g4-l3-ts006-current-js-candidate.mjs [options]\n\n` +
    `Options:\n` +
    `  --check            Rebuild in memory and fail if checked-in outputs differ\n` +
    `  --ffdec <command>  FFDec launcher (default: ffdec)\n` +
    `  -h, --help         Show this help\n`;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(help());
    return;
  }
  process.stdout.write(stableJson(
    await generateG4L3Ts006CurrentJsCandidate(options),
  ));
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) await main();
