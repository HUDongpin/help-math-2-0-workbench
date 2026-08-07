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
  "capture-g4-l10-vb003-current-js-engineering-diagnostic-v1.test.mjs",
);

export const ANIMATION_ID = "course-g04-l10-vb-003";
export const ARTIFACT_TYPE =
  "g4-l10-vb003-current-js-engineering-diagnostic-v1";
export const OUTPUT_ROOT = path.join(
  PROJECT_ROOT,
  "output",
  "playwright",
  ARTIFACT_TYPE,
);
export const CAPTURE_FRAMES = Object.freeze(
  Array.from({length: 203}, (_, index) => index + 1),
);
export const STAGE = Object.freeze({
  width: 800,
  height: 600,
  backgroundColor: "#b8d8f7",
});

const FRAME_DOMAIN = "sprite-120";
const FRAME_COUNT = 203;
const ROOT_FRAME_COUNT = 10;
const ROOT_FRAME = 6;
const FPS = 12;
const REQUIREMENT_ID = "diagnostic-current-js-vb003-source-static-en-v1";
const TRACE_ID = "diagnostic-current-js-vb003-sprite-120-v1";
const SCENARIO = "source-static-frame";
const LANGUAGE = "en";
const SEED = 0;
const FORMAL_REQUIREMENT_ID =
  "req:sprite-120:source-proven-independent-domain-entry-unresolved:en";
const FORMAL_TRACE_ID =
  "trace:sprite-120:source-proven-independent-domain-entry-unresolved:en:seed-0";
const FORMAL_ENTRY_STATE_SHA256 =
  "a2ba7802bded99336ca0c6a8b3db9a8309c0fe8f5ef0dec213482387ed739cdf";
const FORMAL_SCENARIO =
  "source-proven-independent-domain-entry-unresolved";

const SOURCE_SWF_SHA256 =
  "96a0c6c9cd7f5813d06e382bcb9dc2b81a0c0127a9865222dea1abba96a8d93d";
const SOURCE_FLA_SHA256 =
  "1eccb733544de8eb0fa718cac6a1792e2e58145c737f6170e56268fc212003f7";
const CANVAS_ASSET_SHA256 =
  "5923392682aa868e7348e31c3db7bbab1d1ef34861c4af641b0ac71385b583ee";
const CANDIDATE_MANIFEST_SHA256 =
  "bf85e1e1b77939c5b82933e3dc9a47c3ef2ba41bf65916d7ac1c3a050c9f6da7";
const ASSET_ROUTE =
  "/flash-assets/courses/course-g04-l10-vb-003/canvas-renderer.js";

const INPUT_PATHS = Object.freeze({
  sourceSwf:
    "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/VB/L10VB03.swf",
  sourceFla:
    "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/VB/L10VB03.fla",
  candidateManifest:
    "public/flash-assets/courses/course-g04-l10-vb-003/manifest.json",
  canvasAsset:
    "public/flash-assets/courses/course-g04-l10-vb-003/canvas-renderer.js",
  candidateModule: "packages/demos/src/modules/course-g04-l10-vb-003.tsx",
  candidateTimeline:
    "packages/demos/src/timelines/course-g04-l10-vb-003.ts",
  candidateFactory: "packages/demos/src/source-static-canvas-candidate.tsx",
  sourceStaticAuthority:
    "packages/demos/src/source-static-candidate-authority.ts",
  packageLock: "package-lock.json",
  migration: "migrations/course-g04-l10-vb-003/migration.json",
  scenarioInventory:
    "migrations/course-g04-l10-vb-003/audit/scenario-inventory.json",
  frameDomainDisposition:
    "migrations/course-g04-l10-vb-003/audit/frame-domain-disposition.json",
  independentDomainEvidence:
    "migrations/course-g04-l10-vb-003/audit/source-proven-independent-frame-domain-evidence.json",
  audioRuntimeEvidence:
    "migrations/course-g04-l10-vb-003/audit/audio-runtime-evidence.json",
  ffdecRootFrames:
    "migrations/course-g04-l10-vb-003/baseline/ffdec-root-frames.json",
  formalCoverage:
    "migrations/course-g04-l10-vb-003/evidence/full-frame-coverage.json",
  formalNestedEnTrace:
    "migrations/course-g04-l10-vb-003/audit/trace-specs/lesson-releases/lesson-g04-l10-perimeter-area/req-sprite-120-source-proven-independent-domain-entry-unresolved-en.json",
  prototypeRegistry: "packages/demos/prototype-registry.json",
  generatedRegistry: "packages/demos/src/registry.generated.ts",
  prototypeManifest: "packages/demos/src/prototype-manifest.ts",
  wholeLessonRegistry: "apps/web/lib/whole-lesson-course-registry.ts",
  completionLedger: "catalog/completion-ledger.json",
  lessonReleaseLedger: "catalog/lesson-release-ledger.json",
  lessonReleaseCatalog: "catalog/lesson-releases.json",
});

const EXPECTED_INPUT_SHA256 = Object.freeze({
  sourceSwf: SOURCE_SWF_SHA256,
  sourceFla: SOURCE_FLA_SHA256,
  candidateManifest: CANDIDATE_MANIFEST_SHA256,
  canvasAsset: CANVAS_ASSET_SHA256,
  candidateModule:
    "968193885718f47516043f9418769953cb71b30c98f98dfa250852058633a255",
  candidateTimeline:
    "96c5f0384e912777107481f586dd7065d5c33e24d0e8723426ece23dfafb3342",
  candidateFactory:
    "c2ef68a8fa7911099cd1d7dbeae30050cf43c2cbdb37f1a8f2c1aa5ea14ac2a0",
  sourceStaticAuthority:
    "8c8961ffc8e44e140be2c1871edb43bc7e34710872ae825c5e89ca7a3dada95d",
  packageLock:
    "4a4495fc540c1da4c38cab6e3428a156dda00644ff6b70e4c15ed14657947839",
  migration:
    "2450dd99af1806acf04ef4130f4b63001ba785db7b5ae96b3c13080d2a06a585",
  scenarioInventory:
    "55a149952185c0f45e5843f6018288f7036269807cca1264e41905038a08b44a",
  frameDomainDisposition:
    "d69f282c571ed3ec19228372db425f52ae0d099c6b47bf27de9d9b680f92df68",
  independentDomainEvidence:
    "7e3eea037f0637d55cbbf57389f1905abceecf6814ae86b725e3d4b62c34c9d0",
  audioRuntimeEvidence:
    "dbcc0fdf0a53c37350639bb6212a8be6daa0f81c795eb3a093f2b67d49d05898",
  ffdecRootFrames:
    "848024179e4f941c8c4d762d814fbb0b99a3b86cb08f647175fb5cae7af48f32",
  formalCoverage:
    "98b85bc001b4538af82ba8cb92b82e482687a3bdd68ccece50f27854095bf4e2",
  formalNestedEnTrace:
    "3253ff6405ff2bf15f2e4cd33657c8c57c7f710fbb8741556787654135ed2ff7",
  prototypeRegistry:
    "8ab849e636f064501080238b50cbc69e2186025cda5715fe81bc3906a4148149",
  generatedRegistry:
    "f703ab555cd02fe98879398c1011caccde7ed8c7cbdc178c373a0ae5bfb399ce",
  prototypeManifest:
    "a56dda011879d1c72c9b111373862eb96f218519a6e8d137ec733695beee5e75",
  wholeLessonRegistry:
    "c2b977939e358839ad6c04f8b48cad5a7e1c2968b8f6342753909661bb740d0e",
  completionLedger:
    "62d5b5f71ed8ccbf94ba31132d3347f43ac4918585ece52ead8fbb36a4c0b92d",
  lessonReleaseLedger:
    "4ea4850993ffb50eb2ba484279457f7e98bbfa339a29a71f6092f23d4b7f4650",
  lessonReleaseCatalog:
    "d518f812a19b6038e55bca337b7a4f4f96425dd5599f9d07c9f69c8a0a1ae1cf",
});

export const AUTHORITY_BOUNDARY = Object.freeze({
  classification:
    "source-static-current-javascript-engineering-diagnostic-only",
  acceptanceEffect: "none",
  currentJavascriptCandidateOnly: true,
  authoritativeOriginalRuntime: false,
  originalRuntimeNaturalTrace: false,
  sourceHostStateEstablished: false,
  actionScriptBehaviorParity: false,
  bilingualVisualParity: false,
  audioCueParity: false,
  audioListeningAcceptance: false,
  replayParity: false,
  fullFrameOriginalRuntimeComparison: false,
  rmseAcceptance: false,
  coverageRequirementSatisfied: false,
  coverageAdopted: false,
  humanVisualReview: false,
  engineeringReviewAccepted: false,
  ownerAcceptance: false,
  strictMigrationCompletion: false,
  wholeLessonIntegration: false,
  atomicLessonPublication: false,
});

const EXPECTED_AUTHORITY_FALSE_KEYS = Object.freeze(
  Object.keys(AUTHORITY_BOUNDARY).filter(
    (key) => typeof AUTHORITY_BOUNDARY[key] === "boolean" &&
      key !== "currentJavascriptCandidateOnly",
  ),
);

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
  const fileStat = await stat(absolutePath);
  invariant(fileStat.isFile(), `${relativePath}: binding is not a regular file`);
  invariant(fileStat.nlink === 1, `${relativePath}: binding has multiple links`);
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

function exactRange(first, last) {
  return Array.from({length: last - first + 1}, (_, index) => first + index);
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
    "  node scripts/capture-g4-l10-vb003-current-js-engineering-diagnostic-v1.mjs",
    "  node scripts/capture-g4-l10-vb003-current-js-engineering-diagnostic-v1.mjs --check",
    "",
    "Captures all 203 native 800x600 English source-static current-JavaScript frames.",
    "The immutable artifact is an acceptance-neutral engineering diagnostic only.",
  ].join("\n");
}

function validateFormalCoverageRequirement(requirement, language) {
  invariant(requirement, `formal ${language} nested requirement is absent`);
  invariant(
    requirement.frameDomainId === FRAME_DOMAIN &&
      requirement.scenario === FORMAL_SCENARIO &&
      requirement.language === language &&
      requirement.status === "blocked" &&
      requirement.capturedFrameCount === 0 &&
      JSON.stringify(requirement.missingFrames) ===
        JSON.stringify(CAPTURE_FRAMES) &&
      requirement.baselineAuthority === "unresolved" &&
      requirement.baselineCaptureManifest === "" &&
      requirement.baselineCaptureManifestSha256 === "" &&
      requirement.captureManifest === "" &&
      requirement.captureManifestSha256 === "" &&
      requirement.metricsFile === "" &&
      requirement.metricsSha256 === "",
    `formal ${language} nested coverage was promoted or drifted`,
  );
}

export async function loadAndValidateInputs() {
  const bindings = {};
  for (const [key, relativePath] of Object.entries(INPUT_PATHS)) {
    bindings[key] = await bindFile(relativePath, EXPECTED_INPUT_SHA256[key]);
  }
  bindings.producer = await bindFile(portable(SCRIPT_PATH));
  bindings.producerTests = await bindFile(portable(TEST_PATH));

  const candidateManifest = JSON.parse(
    await readFile(resolveProjectPath(INPUT_PATHS.candidateManifest), "utf8"),
  );
  invariant(
    candidateManifest.animationId === ANIMATION_ID &&
      candidateManifest.classification ===
        "source-static-current-javascript-engineering-candidate-only" &&
      candidateManifest.status ===
        "unregistered-acceptance-neutral-engineering-artifact",
    "candidate identity, classification, or status changed",
  );
  invariant(
    candidateManifest.source?.swf?.sha256 === SOURCE_SWF_SHA256 &&
      candidateManifest.source?.fla?.sha256 === SOURCE_FLA_SHA256 &&
      candidateManifest.output?.sha256 === CANVAS_ASSET_SHA256 &&
      candidateManifest.output?.registeredInProductRegistry === false,
    "candidate source, output, or registry binding changed",
  );
  const timeline = candidateManifest.timeline;
  invariant(
    timeline?.nativeStage?.width === STAGE.width &&
      timeline?.nativeStage?.height === STAGE.height &&
      timeline?.nativeStage?.backgroundColor === STAGE.backgroundColor &&
      timeline?.fps === FPS &&
      timeline?.rootFrameCount === ROOT_FRAME_COUNT &&
      timeline?.rootBeginFrame === ROOT_FRAME &&
      timeline?.sourceStaticFrameDomain?.timelineId === FRAME_DOMAIN &&
      timeline?.sourceStaticFrameDomain?.frameCount === FRAME_COUNT &&
      timeline?.naturalRuntimeReachabilityEstablished === false,
    "candidate stage or timeline binding changed",
  );
  const runtimeBoundary = candidateManifest.runtimeBoundary;
  invariant(
    JSON.stringify(runtimeBoundary?.supportedVisualLanguages) ===
      JSON.stringify([LANGUAGE]) &&
      runtimeBoundary?.SpanishVisualStatus === "unresolved-disabled" &&
      runtimeBoundary?.actionScriptExecuted === false &&
      Array.isArray(runtimeBoundary?.audioCues) &&
      runtimeBoundary.audioCues.length === 0 &&
      runtimeBoundary?.audioRendered === false &&
      runtimeBoundary?.controlsEnabled === false &&
      runtimeBoundary?.sourceControlBehaviorResolved === false &&
      runtimeBoundary?.naturalRuntimeEstablished === false &&
      runtimeBoundary?.replayParityEstablished === false &&
      runtimeBoundary?.fullFrameFidelityEstablished === false,
    "candidate runtime boundary was promoted",
  );
  invariant(
    candidateManifest.strictAcceptanceEffect === "none" &&
      candidateManifest.migrationStatusChanged === false &&
      candidateManifest.registryChanged === false &&
      Object.values(candidateManifest.acceptanceEffects || {}).every(
        (value) => value === false,
      ),
    "candidate acceptance effect was promoted",
  );

  const sequence = candidateManifest.browserQa?.fullFrameVisualSequence;
  invariant(
    sequence?.frameDomain === FRAME_DOMAIN &&
      sequence?.frameCount === FRAME_COUNT &&
      sequence?.comparisonMethod === "full-canvas-rgba-byte-equality" &&
      sequence?.rgbaByteCountPerFrame === STAGE.width * STAGE.height * 4 &&
      sequence?.comparedConsecutivePairCount === FRAME_COUNT - 1 &&
      sequence?.byteIdenticalToPreviousFrameCount === 55 &&
      sequence?.changedFromPreviousFrameCount === 147 &&
      sequence?.byteIdenticalToFrameOneCount === 3 &&
      sequence?.allFramesByteIdenticalToFrameOne === false &&
      Array.isArray(sequence.transitionStartFrames) &&
      sequence.transitionStartFrames.length === 147,
    "candidate full-frame current-JS sequence metadata changed",
  );
  const transitionSet = new Set(sequence.transitionStartFrames);
  invariant(
    transitionSet.size === 147 &&
      sequence.transitionStartFrames.every(
        (frame) => Number.isSafeInteger(frame) && frame >= 2 && frame <= 203,
      ),
    "candidate transition frame set is invalid",
  );

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

  const formalCoverage = JSON.parse(
    await readFile(resolveProjectPath(INPUT_PATHS.formalCoverage), "utf8"),
  );
  const nestedRequirements = formalCoverage.requirements.filter(
    (requirement) => requirement.frameDomainId === FRAME_DOMAIN,
  );
  invariant(
    nestedRequirements.length === 2,
    "formal nested coverage requirement cardinality changed",
  );
  validateFormalCoverageRequirement(
    nestedRequirements.find((requirement) => requirement.language === "en"),
    "en",
  );
  validateFormalCoverageRequirement(
    nestedRequirements.find((requirement) => requirement.language === "es"),
    "es",
  );

  const formalTrace = JSON.parse(
    await readFile(resolveProjectPath(INPUT_PATHS.formalNestedEnTrace), "utf8"),
  );
  invariant(
    formalTrace.requirementId === FORMAL_REQUIREMENT_ID &&
      formalTrace.identity?.traceId === FORMAL_TRACE_ID &&
      formalTrace.identity?.entryStateSha256 === FORMAL_ENTRY_STATE_SHA256 &&
      formalTrace.identity?.scenario === FORMAL_SCENARIO &&
      formalTrace.identity?.language === "en" &&
      formalTrace.traceSpecStatus === "unresolved" &&
      formalTrace.schedule?.status ===
        "unresolved-no-complete-source-event-schedule" &&
      Array.isArray(formalTrace.schedule?.orderedSteps) &&
      formalTrace.schedule.orderedSteps.length === 0 &&
      formalTrace.executionEvidence?.executionReport === null &&
      formalTrace.executionEvidence?.originalRuntimeCaptureManifest === null,
    "formal nested English trace was executed, resolved, or drifted",
  );

  const completionLedger = JSON.parse(
    await readFile(resolveProjectPath(INPUT_PATHS.completionLedger), "utf8"),
  );
  const completionEntry = completionLedger.entries.find(
    (entry) => entry.animationId === ANIMATION_ID,
  );
  const completionDiagnostic = completionLedger.diagnostics.find(
    (entry) => entry.animationId === ANIMATION_ID,
  );
  invariant(
    completionEntry === undefined &&
      completionDiagnostic?.status === "preserved" &&
      completionDiagnostic.workspace === "migrations/course-g04-l10-vb-003" &&
      completionDiagnostic.manifestSha256 === EXPECTED_INPUT_SHA256.migration &&
      completionDiagnostic.errorCount > 0,
    "completion ledger unexpectedly admitted or changed VB003",
  );

  const releaseLedger = JSON.parse(
    await readFile(resolveProjectPath(INPUT_PATHS.lessonReleaseLedger), "utf8"),
  );
  const release = releaseLedger.releases.find(
    (entry) => entry.releaseId === "lesson-g04-l10-perimeter-area",
  );
  const releaseMember = release?.members?.find(
    (member) => member.animationId === ANIMATION_ID,
  );
  invariant(
    release?.expectedMemberCount === 47 &&
      release?.strictCompleteCount === 0 &&
      release?.missingCount === 47 &&
      release?.published === false &&
      release?.status === "unpublished" &&
      release?.gate?.open === false &&
      release?.gate?.admittedCount === 0 &&
      releaseMember?.ordinal === 7 &&
      releaseMember?.strictComplete === false &&
      releaseMember?.status === "missing" &&
      releaseMember?.ledgerAssetId === null &&
      releaseMember?.workspace === null &&
      releaseMember?.manifestSha256 === null,
    "lesson release ledger unexpectedly admitted or published VB003/L10",
  );

  return Object.freeze({
    bindings: Object.freeze(bindings),
    candidateManifest,
    sequence,
    formalState: Object.freeze({
      coverageAdoptionAttempted: false,
      formalCoverageMutation: false,
      formalCapturedFrameCountEffect: 0,
      nestedRequirements: nestedRequirements.map((requirement) => ({
        requirementId: requirement.requirementId,
        frameDomainId: requirement.frameDomainId,
        scenario: requirement.scenario,
        language: requirement.language,
        status: requirement.status,
        capturedFrameCount: requirement.capturedFrameCount,
        missingFrameCount: requirement.missingFrames.length,
        baselineAuthority: requirement.baselineAuthority,
      })),
      formalNestedEnTrace: {
        requirementId: formalTrace.requirementId,
        traceId: formalTrace.identity.traceId,
        entryStateSha256: formalTrace.identity.entryStateSha256,
        scenario: formalTrace.identity.scenario,
        status: formalTrace.traceSpecStatus,
        orderedStepCount: formalTrace.schedule.orderedSteps.length,
        executionReport: formalTrace.executionEvidence.executionReport,
      },
      registryPresenceCount: 0,
      completionLedgerEntryPresent: false,
      completionLedgerStatus: completionDiagnostic.status,
      completionLedgerErrorCount: completionDiagnostic.errorCount,
      releaseMemberStatus: releaseMember.status,
      releaseStrictCompleteCount: release.strictCompleteCount,
      releaseMissingCount: release.missingCount,
      releasePublished: release.published,
      releaseGateOpen: release.gate.open,
    }),
  });
}

function buildHarnessEntry(identity) {
  return `
import React from "react";
import {createRoot} from "react-dom/client";
import {
  CourseG04L10Vb003Renderer,
  getCourseG04L10Vb003FrameState,
} from "./packages/demos/src/modules/course-g04-l10-vb-003.tsx";

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
const observed = {
  frameDomain: params.get("frameDomain"),
  requirementId: params.get("requirementId"),
  traceId: params.get("trace"),
  entryStateSha256: params.get("entryStateSha256"),
  scenario: params.get("scenario"),
  lang: params.get("lang"),
  seed: Number(params.get("seed")),
};
for (const key of Object.keys(observed)) {
  if (observed[key] !== expected[key]) {
    throw new Error("diagnostic identity mismatch: " + key);
  }
}
const root = createRoot(document.getElementById("app"));
const diagnostic = {
  expected,
  current: null,
  renderFrame(frame) {
    if (!Number.isSafeInteger(frame) || frame < 1 || frame > ${FRAME_COUNT}) {
      throw new Error("diagnostic frame is outside the 1..203 contract");
    }
    const state = getCourseG04L10Vb003FrameState(frame, {
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
    diagnostic.current = Object.freeze({frame, state});
    root.render(
      React.createElement(CourseG04L10Vb003Renderer, {
        key: "frame-" + frame,
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
    return {
      frame,
      status: state.status,
      frameDomain: state.frameDomain,
      requirementId: state.requirementId,
      traceId: state.traceId,
    };
  },
};
globalThis.__HELP_MATH_VB003_DIAGNOSTIC__ = diagnostic;
diagnostic.renderFrame(1);
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
      sourcefile: "vb003-current-js-engineering-diagnostic-entry.tsx",
    },
    target: ["chrome120"],
    write: false,
  });
  invariant(
    result.outputFiles?.length === 1,
    "harness build did not emit one bundle",
  );
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
  <title>VB003 current-JavaScript full-domain engineering diagnostic</title>
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

function captureUrl(origin, identity) {
  const query = new URLSearchParams({
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

function expectedAssetSearch() {
  return `?sha256=${CANVAS_ASSET_SHA256}`;
}

function requestIsAllowed(url, method, origin, expectedHarnessSearch) {
  if (method !== "GET") return false;
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (parsed.origin !== origin) return false;
  if (parsed.pathname === "/harness") {
    return parsed.search === expectedHarnessSearch;
  }
  if (parsed.pathname === "/bundle.js") return parsed.search === "";
  if (parsed.pathname === ASSET_ROUTE) {
    return parsed.search === expectedAssetSearch();
  }
  return false;
}

async function startHarnessServer({bundleBytes, assetBytes, identity}) {
  const requestLog = [];
  const htmlBytes = Buffer.from(harnessHtml(), "utf8");
  const server = createServer((request, response) => {
    const host = request.headers.host || "127.0.0.1";
    const url = new URL(request.url || "/", `http://${host}`);
    const expectedHarnessSearch = new URL(
      captureUrl(`http://${host}`, identity),
    ).search;
    let status = 404;
    let body = Buffer.from("not found\n", "utf8");
    let contentType = "text/plain; charset=utf-8";
    if (
      request.method === "GET" &&
      url.pathname === "/harness" &&
      url.search === expectedHarnessSearch
    ) {
      status = 200;
      body = htmlBytes;
      contentType = "text/html; charset=utf-8";
    } else if (
      request.method === "GET" &&
      url.pathname === "/bundle.js" &&
      url.search === ""
    ) {
      status = 200;
      body = bundleBytes;
      contentType = "text/javascript; charset=utf-8";
    } else if (
      request.method === "GET" &&
      url.pathname === ASSET_ROUTE &&
      url.search === expectedAssetSearch()
    ) {
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
    close: () =>
      new Promise((resolve, reject) => {
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

function observePage(page, origin, expectedHarnessSearch, diagnostics) {
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
    const allowed = requestIsAllowed(
      url,
      request.method(),
      origin,
      expectedHarnessSearch,
    );
    let parsed = null;
    try {
      parsed = new URL(url);
    } catch {}
    diagnostics.requests.push({
      method: request.method(),
      pathname: parsed?.pathname || null,
      search: parsed?.search || null,
      resourceType: request.resourceType(),
      allowed,
    });
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
    ({expectedAttributes: expected, expectedFrame, animationId}) => {
      const canvas = document.querySelector("canvas.faithful-stage-wrap");
      const section = document.querySelector(
        "section[data-candidate-status='source-static-engineering-not-strict']",
      );
      const assetScript = document.querySelector(
        `script[data-help-math-canvas-asset='${animationId}']`,
      );
      if (!(canvas instanceof HTMLCanvasElement)) {
        throw new Error("diagnostic canvas is absent");
      }
      const rectangle = canvas.getBoundingClientRect();
      const attributes = {};
      for (const name of Object.keys(expected)) {
        attributes[name] = canvas.getAttribute(name);
      }
      const diagnostic = globalThis.__HELP_MATH_VB003_DIAGNOSTIC__;
      const current = diagnostic?.current;
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
        diagnosticState: current
          ? {
              frame: current.frame,
              animationId: current.state?.animationId,
              status: current.state?.status,
              blocker: current.state?.blocker,
              frameDomain: current.state?.frameDomain,
              requirementId: current.state?.requirementId,
              traceId: current.state?.traceId,
              entryStateSha256: current.state?.entryStateSha256,
              scenario: current.state?.scenario,
              language: current.state?.language,
              seed: current.state?.seed,
              rootFrame: current.state?.rootFrame,
              interactiveControlsEnabled:
                current.state?.interactiveControlsEnabled,
              sourceHostBehaviorResolved:
                current.state?.sourceHostBehaviorResolved,
              naturalRuntimeEstablished:
                current.state?.naturalRuntimeEstablished,
              audioRendered: current.state?.audioRendered,
            }
          : null,
      };
    },
    {expectedAttributes, expectedFrame: frame, animationId: ANIMATION_ID},
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
    `frame ${frame}: canvas display/pointer boundary changed`,
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
    `frame ${frame}: pure candidate state or authority boundary changed`,
  );
}

function inspectPng(bytes, frame) {
  const image = PNG.sync.read(bytes);
  invariant(
    image.width === STAGE.width && image.height === STAGE.height,
    `frame ${frame}: PNG dimensions are not 800x600`,
  );
  const background = [184, 216, 247, 255];
  let opaquePixelCount = 0;
  let nonBackgroundPixelCount = 0;
  for (let offset = 0; offset < image.data.length; offset += 4) {
    if (image.data[offset + 3] === 255) opaquePixelCount += 1;
    if (
      image.data[offset] !== background[0] ||
      image.data[offset + 1] !== background[1] ||
      image.data[offset + 2] !== background[2] ||
      image.data[offset + 3] !== background[3]
    ) {
      nonBackgroundPixelCount += 1;
    }
  }
  invariant(
    opaquePixelCount === STAGE.width * STAGE.height,
    `frame ${frame}: PNG is not fully opaque`,
  );
  return {
    image,
    width: image.width,
    height: image.height,
    rgbaSha256: sha256(image.data),
    opaquePixelCount,
    nonBackgroundPixelCount,
    nonBackgroundPixelRatio:
      nonBackgroundPixelCount / (STAGE.width * STAGE.height),
  };
}

function compareRgba(leftImage, rightImage) {
  invariant(
    leftImage.width === rightImage.width &&
      leftImage.height === rightImage.height &&
      leftImage.data.length === rightImage.data.length,
    "current-JS frame dimensions changed within the diagnostic sequence",
  );
  let changedPixelCount = 0;
  for (let offset = 0; offset < leftImage.data.length; offset += 4) {
    if (
      leftImage.data[offset] !== rightImage.data[offset] ||
      leftImage.data[offset + 1] !== rightImage.data[offset + 1] ||
      leftImage.data[offset + 2] !== rightImage.data[offset + 2] ||
      leftImage.data[offset + 3] !== rightImage.data[offset + 3]
    ) {
      changedPixelCount += 1;
    }
  }
  return {
    rgbaByteIdentical: changedPixelCount === 0,
    changedPixelCount,
    changedPixelRatio: changedPixelCount / (leftImage.width * leftImage.height),
  };
}

function createSequenceAccumulator(expectedTransitionStartFrames) {
  return {
    expectedTransitions: new Set(expectedTransitionStartFrames),
    previous: null,
    frameOneRgbaSha256: null,
    uniqueRgbaSha256: new Set(),
    pairComparisons: [],
    transitionStartFrames: [],
    identicalToFrameOneCount: 0,
  };
}

function addSequenceFrame(accumulator, frame, inspected) {
  if (frame === 1) accumulator.frameOneRgbaSha256 = inspected.rgbaSha256;
  if (inspected.rgbaSha256 === accumulator.frameOneRgbaSha256) {
    accumulator.identicalToFrameOneCount += 1;
  }
  accumulator.uniqueRgbaSha256.add(inspected.rgbaSha256);
  if (accumulator.previous) {
    const comparison = compareRgba(accumulator.previous.image, inspected.image);
    const expectedChanged = accumulator.expectedTransitions.has(frame);
    invariant(
      comparison.rgbaByteIdentical === !expectedChanged,
      `frame ${frame}: current-JS transition disposition differs from the candidate manifest`,
    );
    if (!comparison.rgbaByteIdentical) {
      accumulator.transitionStartFrames.push(frame);
    }
    accumulator.pairComparisons.push({
      leftFrame: frame - 1,
      rightFrame: frame,
      ...comparison,
      authority:
        "current-JavaScript candidate consecutive RGBA relationship only; not an original-runtime comparison, fidelity result, or RMSE acceptance",
    });
  }
  accumulator.previous = {frame, image: inspected.image};
}

function finishSequence(accumulator) {
  const identicalCount = accumulator.pairComparisons.filter(
    (pair) => pair.rgbaByteIdentical,
  ).length;
  const changedCount = accumulator.pairComparisons.length - identicalCount;
  invariant(
    accumulator.pairComparisons.length === 202 &&
      identicalCount === 55 &&
      changedCount === 147 &&
      accumulator.uniqueRgbaSha256.size === 148 &&
      accumulator.identicalToFrameOneCount === 3 &&
      JSON.stringify(accumulator.transitionStartFrames) ===
        JSON.stringify([...accumulator.expectedTransitions]),
    "complete current-JS full-domain sequence census changed",
  );
  return Object.freeze({
    comparisonMethod: "full-canvas-rgba-byte-equality",
    frameCount: FRAME_COUNT,
    comparedConsecutivePairCount: accumulator.pairComparisons.length,
    byteIdenticalToPreviousFrameCount: identicalCount,
    changedFromPreviousFrameCount: changedCount,
    uniqueRgbaRasterCount: accumulator.uniqueRgbaSha256.size,
    byteIdenticalToFrameOneCount: accumulator.identicalToFrameOneCount,
    transitionStartFrames: accumulator.transitionStartFrames,
    consecutivePairs: accumulator.pairComparisons,
    authority:
      "Current-JavaScript candidate self-regression only; no original-runtime baseline, RMSE, fidelity, human review, or acceptance effect.",
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
  invariant(
    manifest.artifactType === ARTIFACT_TYPE,
    "capture manifest type changed",
  );
  invariant(
    manifest.animationId === ANIMATION_ID,
    "capture manifest animation changed",
  );
  invariant(manifest.status === "pass", "capture manifest status is not pass");
  invariant(
    manifest.classification === AUTHORITY_BOUNDARY.classification &&
      manifest.acceptanceEffect === "none" &&
      manifest.coverageAdoptionAttempted === false &&
      manifest.formalCoverageMutation === false &&
      manifest.formalCapturedFrameCountEffect === 0,
    "capture manifest classification or formal effect changed",
  );
  invariant(
    manifest.authorityBoundary?.currentJavascriptCandidateOnly === true &&
      manifest.authorityBoundary?.acceptanceEffect === "none",
    "capture manifest is not candidate-only and acceptance-neutral",
  );
  for (const key of EXPECTED_AUTHORITY_FALSE_KEYS) {
    invariant(
      manifest.authorityBoundary?.[key] === false,
      `capture manifest promoted ${key}`,
    );
  }
  invariant(
    JSON.stringify(manifest.capturePlan?.frames) ===
      JSON.stringify(CAPTURE_FRAMES),
    "capture manifest frame set changed",
  );
  invariant(
    manifest.capturePlan?.nativeStage?.width === STAGE.width &&
      manifest.capturePlan?.nativeStage?.height === STAGE.height &&
      manifest.capturePlan?.backingStage?.width === STAGE.width &&
      manifest.capturePlan?.backingStage?.height === STAGE.height &&
      manifest.capturePlan?.deviceScaleFactor === 1 &&
      manifest.capturePlan?.frameDomain === FRAME_DOMAIN &&
      manifest.capturePlan?.frameDomainCount === FRAME_COUNT &&
      manifest.capturePlan?.rootFrameCount === ROOT_FRAME_COUNT &&
      manifest.capturePlan?.rootPlacementFrame === ROOT_FRAME,
    "capture manifest stage or frame-domain plan changed",
  );
  invariant(
    Array.isArray(manifest.captures) &&
      manifest.captures.length === CAPTURE_FRAMES.length &&
      manifest.captures.every(
        (capture, index) =>
          capture.frame === CAPTURE_FRAMES[index] &&
          capture.file ===
            `frame-${String(CAPTURE_FRAMES[index]).padStart(4, "0")}.png` &&
          capture.width === STAGE.width &&
          capture.height === STAGE.height &&
          capture.opaquePixelCount === STAGE.width * STAGE.height &&
          capture.identityVerified === true &&
          capture.authorityBoundaryVerified === true &&
          capture.stableBeforeAfter === true &&
          /^[a-f0-9]{64}$/.test(capture.sha256) &&
          /^[a-f0-9]{64}$/.test(capture.rgbaSha256) &&
          /^[a-f0-9]{64}$/.test(capture.observationSha256),
      ),
    "capture manifest has an invalid, missing, duplicate, or non-contiguous frame row",
  );
  const sequence = manifest.currentJavascriptSequence;
  invariant(
    sequence?.comparisonMethod === "full-canvas-rgba-byte-equality" &&
      sequence?.frameCount === FRAME_COUNT &&
      sequence?.comparedConsecutivePairCount === 202 &&
      sequence?.byteIdenticalToPreviousFrameCount === 55 &&
      sequence?.changedFromPreviousFrameCount === 147 &&
      sequence?.uniqueRgbaRasterCount === 148 &&
      sequence?.byteIdenticalToFrameOneCount === 3 &&
      Array.isArray(sequence.transitionStartFrames) &&
      sequence.transitionStartFrames.length === 147 &&
      Array.isArray(sequence.consecutivePairs) &&
      sequence.consecutivePairs.length === 202,
    "capture manifest current-JS sequence census changed",
  );
  invariant(
    manifest.formalState?.coverageAdoptionAttempted === false &&
      manifest.formalState?.formalCoverageMutation === false &&
      manifest.formalState?.formalCapturedFrameCountEffect === 0 &&
      manifest.formalState?.registryPresenceCount === 0 &&
      manifest.formalState?.completionLedgerEntryPresent === false &&
      manifest.formalState?.completionLedgerStatus === "preserved" &&
      manifest.formalState?.releaseMemberStatus === "missing" &&
      manifest.formalState?.releaseStrictCompleteCount === 0 &&
      manifest.formalState?.releaseMissingCount === 47 &&
      manifest.formalState?.releasePublished === false &&
      manifest.formalState?.releaseGateOpen === false &&
      manifest.formalState?.formalNestedEnTrace?.status === "unresolved" &&
      manifest.formalState?.formalNestedEnTrace?.orderedStepCount === 0 &&
      manifest.formalState?.formalNestedEnTrace?.executionReport === null,
    "capture manifest formal-gate invariance changed",
  );
  invariant(
    manifest.browserDiagnostics?.consoleErrors?.length === 0 &&
      manifest.browserDiagnostics?.consoleWarnings?.length === 0 &&
      manifest.browserDiagnostics?.pageErrors?.length === 0 &&
      manifest.browserDiagnostics?.failedRequests?.length === 0 &&
      manifest.browserDiagnostics?.httpErrors?.length === 0 &&
      manifest.browserDiagnostics?.unexpectedRequests?.length === 0,
    "capture manifest contains a browser or network failure",
  );
  invariant(
    Array.isArray(manifest.assertions) &&
      manifest.assertions.length > 0 &&
      manifest.assertions.every((assertion) => assertion.pass === true),
    "capture manifest contains a failed assertion",
  );
  return true;
}

async function reconstructStoredSequence(manifest) {
  const expectedTransitions = manifest.sourceCurrentJsSequenceBinding
    .transitionStartFrames;
  const accumulator = createSequenceAccumulator(expectedTransitions);
  for (const capture of manifest.captures) {
    const absolutePath = path.join(OUTPUT_ROOT, capture.file);
    const bytes = await readFile(absolutePath);
    invariant(
      sha256(bytes) === capture.sha256 && bytes.length === capture.bytes,
      `${capture.file}: PNG binding changed`,
    );
    const fileStat = await stat(absolutePath);
    invariant(
      fileStat.isFile() && fileStat.nlink === 1,
      `${capture.file}: PNG is not a single-link regular file`,
    );
    invariant(
      (fileStat.mode & 0o777) === 0o444,
      `${capture.file}: mode is not 0444`,
    );
    const inspected = inspectPng(bytes, capture.frame);
    invariant(
      inspected.rgbaSha256 === capture.rgbaSha256 &&
        inspected.opaquePixelCount === capture.opaquePixelCount &&
        inspected.nonBackgroundPixelCount === capture.nonBackgroundPixelCount,
      `${capture.file}: PNG pixel census changed`,
    );
    addSequenceFrame(accumulator, capture.frame, inspected);
  }
  return finishSequence(accumulator);
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
  invariant(
    rootStat.isDirectory() && (rootStat.mode & 0o777) === 0o555,
    "output root mode is not 0555",
  );
  invariant(
    (await stat(manifestPath)).mode & 0o222 ? false : true,
    "capture manifest is writable",
  );

  const current = await loadAndValidateInputs();
  for (const [key, binding] of Object.entries(current.bindings)) {
    const stored = manifest.bindings?.[key];
    invariant(stored, `capture manifest binding ${key} is absent`);
    invariant(
      stored.path === binding.path &&
        stored.bytes === binding.bytes &&
        stored.sha256 === binding.sha256,
      `capture manifest binding ${key} is stale`,
    );
  }
  invariant(
    JSON.stringify(manifest.formalState) ===
      JSON.stringify(current.formalState),
    "capture manifest formal-state closure is stale",
  );

  const identity = buildDiagnosticIdentity();
  invariant(
    manifest.captureIdentity?.requirementId === identity.requirementId &&
      manifest.captureIdentity?.traceId === identity.traceId &&
      manifest.captureIdentity?.entryStateSha256 === identity.entryStateSha256 &&
      manifest.captureIdentity?.entryStateAuthority ===
        "diagnostic-local-current-js-entry-state-only-not-original-runtime" &&
      manifest.captureIdentity?.formalRequirementId !== identity.requirementId &&
      manifest.captureIdentity?.formalEntryStateSha256 !==
        identity.entryStateSha256,
    "capture manifest diagnostic/formal identity separation changed",
  );

  const bundleBytes = await buildHarnessBundle(identity);
  invariant(
    manifest.harness?.bundleBytes === bundleBytes.length &&
      manifest.harness?.bundleSha256 === sha256(bundleBytes),
    "capture manifest harness bundle is stale",
  );

  const reconstructed = await reconstructStoredSequence(manifest);
  invariant(
    JSON.stringify(reconstructed) ===
      JSON.stringify(manifest.currentJavascriptSequence),
    "stored PNG sequence no longer matches the manifest census",
  );

  return Object.freeze({
    output: portable(OUTPUT_ROOT),
    manifest: portable(manifestPath),
    manifestSha256: sha256(manifestBytes),
    status: manifest.status,
    captureCount: manifest.captures.length,
    fileCount: observedFiles.length,
    totalPngBytes: manifest.summary.totalPngBytes,
    currentJavascriptSequence: {
      changedFromPreviousFrameCount:
        manifest.currentJavascriptSequence.changedFromPreviousFrameCount,
      byteIdenticalToPreviousFrameCount:
        manifest.currentJavascriptSequence.byteIdenticalToPreviousFrameCount,
      uniqueRgbaRasterCount:
        manifest.currentJavascriptSequence.uniqueRgbaRasterCount,
    },
    formalCapturedFrameCountEffect:
      manifest.formalCapturedFrameCountEffect,
    authorityBoundary: manifest.authorityBoundary,
  });
}

async function generateArtifact() {
  invariant(
    !(await pathExists(OUTPUT_ROOT)),
    `immutable output already exists: ${portable(OUTPUT_ROOT)}; use --check`,
  );
  const {bindings, sequence, formalState} = await loadAndValidateInputs();
  const identity = buildDiagnosticIdentity();
  invariant(
    identity.entryStateSha256 ===
      "a06bc7185a99c30ce0aec6c82990e90dcf3b3cc160274b7e4af3373105767ad6" &&
      identity.entryStateDescriptorBytes === 598,
    "diagnostic-local entry-state identity changed",
  );
  invariant(
    identity.requirementId !== FORMAL_REQUIREMENT_ID &&
      identity.traceId !== FORMAL_TRACE_ID &&
      identity.entryStateSha256 !== FORMAL_ENTRY_STATE_SHA256 &&
      identity.scenario !== FORMAL_SCENARIO,
    "diagnostic identity collided with a formal coverage identity",
  );
  const bundleBytes = await buildHarnessBundle(identity);
  const assetBytes = await readFile(resolveProjectPath(INPUT_PATHS.canvasAsset));
  invariant(
    sha256(assetBytes) === CANVAS_ASSET_SHA256,
    "canvas asset changed after input validation",
  );

  await mkdir(path.dirname(OUTPUT_ROOT), {recursive: true});
  const temporaryRoot = await mkdtemp(
    path.join(path.dirname(OUTPUT_ROOT), `.${ARTIFACT_TYPE}-tmp-`),
  );
  let server = null;
  let browser = null;
  try {
    server = await startHarnessServer({bundleBytes, assetBytes, identity});
    const diagnosticUrl = captureUrl(server.origin, identity);
    const expectedHarnessSearch = new URL(diagnosticUrl).search;
    const diagnostics = createBrowserDiagnostics();
    browser = await chromium.launch({headless: true});
    const context = await browser.newContext({
      deviceScaleFactor: 1,
      reducedMotion: "reduce",
      viewport: {width: 1000, height: 800},
    });
    await context.route("**/*", async (route) => {
      const request = route.request();
      const allowed = requestIsAllowed(
        request.url(),
        request.method(),
        server.origin,
        expectedHarnessSearch,
      );
      if (allowed) await route.continue();
      else await route.abort("blockedbyclient");
    });

    const page = await context.newPage();
    observePage(page, server.origin, expectedHarnessSearch, diagnostics);
    const response = await page.goto(diagnosticUrl, {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
    invariant(response?.status() === 200, "harness HTTP status is not 200");
    const canvas = page.locator(
      "canvas.faithful-stage-wrap[data-capture-stage='true'][data-capture-identity-status='verified']",
    );
    await canvas.waitFor({state: "visible", timeout: 60_000});

    const captures = [];
    const accumulator = createSequenceAccumulator(
      sequence.transitionStartFrames,
    );
    let totalPngBytes = 0;
    for (const frame of CAPTURE_FRAMES) {
      if (frame !== 1) {
        const rendered = await page.evaluate((requestedFrame) => {
          return globalThis.__HELP_MATH_VB003_DIAGNOSTIC__.renderFrame(
            requestedFrame,
          );
        }, frame);
        invariant(
          rendered?.frame === frame &&
            rendered?.status === "ready" &&
            rendered?.frameDomain === identity.frameDomain &&
            rendered?.requirementId === identity.requirementId &&
            rendered?.traceId === identity.traceId,
          `frame ${frame}: harness render result changed`,
        );
      }
      await page.waitForFunction(
        ({expectedFrame, expectedDomain}) => {
          const target = document.querySelector("canvas.faithful-stage-wrap");
          return (
            target?.getAttribute("data-flash-frame") === String(expectedFrame) &&
            target?.getAttribute("data-flash-frame-domain") === expectedDomain &&
            target?.getAttribute("data-render-state") === "ready"
          );
        },
        {expectedFrame: frame, expectedDomain: identity.frameDomain},
        {timeout: 60_000},
      );
      const before = await inspectStage(page, frame, identity);
      validateStageObservation(before, frame, identity);
      await page.waitForTimeout(20);
      const after = await inspectStage(page, frame, identity);
      validateStageObservation(after, frame, identity);
      invariant(
        JSON.stringify(before) === JSON.stringify(after),
        `frame ${frame}: deterministic identity drifted before capture`,
      );

      const pngBytes = await canvas.screenshot({
        animations: "disabled",
        timeout: 60_000,
      });
      const inspected = inspectPng(pngBytes, frame);
      addSequenceFrame(accumulator, frame, inspected);
      const filename = `frame-${String(frame).padStart(4, "0")}.png`;
      await writeExclusive(path.join(temporaryRoot, filename), pngBytes);
      totalPngBytes += pngBytes.length;
      captures.push({
        frame,
        file: filename,
        bytes: pngBytes.length,
        sha256: sha256(pngBytes),
        rgbaSha256: inspected.rgbaSha256,
        width: inspected.width,
        height: inspected.height,
        opaquePixelCount: inspected.opaquePixelCount,
        nonBackgroundPixelCount: inspected.nonBackgroundPixelCount,
        nonBackgroundPixelRatio: inspected.nonBackgroundPixelRatio,
        observationSha256: sha256(
          Buffer.from(`${JSON.stringify(before)}\n`, "utf8"),
        ),
        identityVerified: true,
        authorityBoundaryVerified: true,
        stableBeforeAfter: true,
      });
    }
    const currentJavascriptSequence = finishSequence(accumulator);

    const browserVersion = browser.version();
    await page.close();
    await context.close();
    await browser.close();
    browser = null;
    await server.close();
    const serverRequestLog = server.requestLog;
    server = null;

    invariant(
      diagnostics.consoleErrors.length === 0 &&
        diagnostics.consoleWarnings.length === 0 &&
        diagnostics.pageErrors.length === 0 &&
        diagnostics.failedRequests.length === 0 &&
        diagnostics.httpErrors.length === 0 &&
        diagnostics.unexpectedRequests.length === 0,
      "browser or network diagnostic contains a failure",
    );
    invariant(
      diagnostics.requests.length === 3 &&
        diagnostics.requests.every((request) => request.allowed === true),
      `unexpected browser request count or disposition: ${diagnostics.requests.length}`,
    );
    invariant(
      serverRequestLog.length === 3 &&
        serverRequestLog.every(
          (request) =>
            request.method === "GET" &&
            request.status === 200 &&
            ["/harness", "/bundle.js", ASSET_ROUTE].includes(
              request.pathname,
            ),
        ),
      `unexpected harness server request count or disposition: ${serverRequestLog.length}`,
    );

    const assertions = [
      {
        id: "all-203-contiguous-native-current-js-frames-captured",
        pass:
          captures.length === FRAME_COUNT &&
          captures.every(
            (capture, index) =>
              capture.frame === index + 1 &&
              capture.width === STAGE.width &&
              capture.height === STAGE.height,
          ),
      },
      {
        id: "pure-state-dom-and-canvas-identity-stable-for-every-frame",
        pass: captures.every(
          (capture) =>
            capture.identityVerified === true &&
            capture.stableBeforeAfter === true,
        ),
      },
      {
        id: "candidate-authority-boundary-remains-false",
        pass: captures.every(
          (capture) => capture.authorityBoundaryVerified === true,
        ),
      },
      {
        id: "same-origin-hash-bound-sri-asset-loaded-once-without-fallback",
        pass:
          serverRequestLog.filter(
            (request) => request.pathname === ASSET_ROUTE,
          ).length === 1,
      },
      {
        id: "console-warning-page-request-and-http-errors-zero",
        pass:
          diagnostics.consoleErrors.length === 0 &&
          diagnostics.consoleWarnings.length === 0 &&
          diagnostics.pageErrors.length === 0 &&
          diagnostics.failedRequests.length === 0 &&
          diagnostics.httpErrors.length === 0,
      },
      {
        id: "network-contained-to-three-exact-local-get-resources",
        pass:
          diagnostics.unexpectedRequests.length === 0 &&
          diagnostics.requests.length === 3 &&
          serverRequestLog.length === 3,
      },
      {
        id: "complete-current-js-consecutive-rgba-census-exact",
        pass:
          currentJavascriptSequence.comparedConsecutivePairCount === 202 &&
          currentJavascriptSequence.byteIdenticalToPreviousFrameCount === 55 &&
          currentJavascriptSequence.changedFromPreviousFrameCount === 147 &&
          currentJavascriptSequence.uniqueRgbaRasterCount === 148 &&
          currentJavascriptSequence.byteIdenticalToFrameOneCount === 3,
      },
      {
        id: "diagnostic-identity-remains-distinct-from-formal-coverage",
        pass:
          identity.requirementId !== FORMAL_REQUIREMENT_ID &&
          identity.traceId !== FORMAL_TRACE_ID &&
          identity.entryStateSha256 !== FORMAL_ENTRY_STATE_SHA256 &&
          identity.scenario !== FORMAL_SCENARIO,
      },
      {
        id: "formal-coverage-registry-ledger-and-publication-remain-closed",
        pass:
          formalState.formalCapturedFrameCountEffect === 0 &&
          formalState.registryPresenceCount === 0 &&
          formalState.completionLedgerEntryPresent === false &&
          formalState.completionLedgerStatus === "preserved" &&
          formalState.releaseMemberStatus === "missing" &&
          formalState.releaseStrictCompleteCount === 0 &&
          formalState.releaseMissingCount === 47 &&
          formalState.releasePublished === false &&
          formalState.releaseGateOpen === false,
      },
      {
        id: "no-original-runtime-rmse-human-owner-strict-or-release-effect",
        pass:
          EXPECTED_AUTHORITY_FALSE_KEYS.every(
            (key) => AUTHORITY_BOUNDARY[key] === false,
          ) && AUTHORITY_BOUNDARY.acceptanceEffect === "none",
      },
    ];
    invariant(
      assertions.every((assertion) => assertion.pass),
      "diagnostic assertion failed",
    );

    const manifest = {
      schemaVersion: 1,
      artifactType: ARTIFACT_TYPE,
      animationId: ANIMATION_ID,
      generatedAt: new Date().toISOString(),
      status: "pass",
      classification: AUTHORITY_BOUNDARY.classification,
      acceptanceEffect: "none",
      coverageAdoptionAttempted: false,
      formalCoverageMutation: false,
      formalCapturedFrameCountEffect: 0,
      scope:
        "All 203 native English sprite-120 source-static current-JavaScript frames for the unregistered VB003 engineering candidate",
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
        formalRequirementId: FORMAL_REQUIREMENT_ID,
        formalTraceId: FORMAL_TRACE_ID,
        formalEntryStateSha256: FORMAL_ENTRY_STATE_SHA256,
        formalScenario: FORMAL_SCENARIO,
        identityEquivalenceToFormalCoverage: false,
      },
      capturePlan: {
        frames: CAPTURE_FRAMES,
        frameSelectionBasis:
          "every one-indexed frame in the candidate's declared sprite-120 source-static domain",
        nativeStage: STAGE,
        backingStage: {width: STAGE.width, height: STAGE.height},
        fps: FPS,
        rootFrameCount: ROOT_FRAME_COUNT,
        rootPlacementFrame: ROOT_FRAME,
        frameDomain: FRAME_DOMAIN,
        frameDomainCount: FRAME_COUNT,
        viewport: {width: 1000, height: 800},
        deviceScaleFactor: 1,
        reducedMotion: "reduce",
        screenshotTarget: "canvas.faithful-stage-wrap",
      },
      sourceCurrentJsSequenceBinding: {
        comparisonMethod: sequence.comparisonMethod,
        frameCount: sequence.frameCount,
        comparedConsecutivePairCount: sequence.comparedConsecutivePairCount,
        byteIdenticalToPreviousFrameCount:
          sequence.byteIdenticalToPreviousFrameCount,
        changedFromPreviousFrameCount: sequence.changedFromPreviousFrameCount,
        byteIdenticalToFrameOneCount:
          sequence.byteIdenticalToFrameOneCount,
        transitionStartFrames: sequence.transitionStartFrames,
        authority:
          "pre-existing current-JavaScript candidate raster census only; not original-runtime evidence",
      },
      harness: {
        executionSurface: "ephemeral-loopback-esbuild-react-single-page-harness",
        rendererResetMode: "react-keyed-remount-per-frame",
        bundleBytes: bundleBytes.length,
        bundleSha256: sha256(bundleBytes),
        assetRoute: `${ASSET_ROUTE}?sha256=${CANVAS_ASSET_SHA256}`,
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
      summary: {
        captureCount: captures.length,
        fileCount: EXPECTED_OUTPUT_FILES.length,
        totalPngBytes,
        minimumPngBytes: Math.min(...captures.map((capture) => capture.bytes)),
        maximumPngBytes: Math.max(...captures.map((capture) => capture.bytes)),
        averagePngBytes: totalPngBytes / captures.length,
      },
      captures,
      currentJavascriptSequence,
      formalState,
      browserDiagnostics: {
        ...diagnostics,
        serverRequests: serverRequestLog,
      },
      assertions,
      unresolved: [
        "No authorized original-runtime capture, source-host entry, or natural trace is present.",
        "No original-runtime/current-JS full-frame pair, diff image, normalized RMSE, fidelity judgment, or RMSE acceptance is present.",
        "Spanish visuals and English/Spanish audio cue binding, listening, and synchronization remain unresolved and disabled.",
        "ActionScript controls, host behavior, terminal state, and Replay parity remain unresolved and disabled.",
        "Human visual review, engineering acceptance, and owner acceptance remain pending; no reviewer identity or signature was created.",
        "The candidate remains unregistered and this package has zero coverage-v2 adoption, completion-ledger admission, whole-lesson, strict-completion, release, or publication effect.",
      ],
    };
    validateCaptureManifestShape(manifest);
    const manifestBytes = Buffer.from(
      `${JSON.stringify(manifest, null, 2)}\n`,
      "utf8",
    );
    await writeExclusive(
      path.join(temporaryRoot, "capture-manifest.json"),
      manifestBytes,
    );
    await freezeTree(temporaryRoot);
    await rename(temporaryRoot, OUTPUT_ROOT);
    return await checkStoredArtifact();
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
