#!/usr/bin/env node

import {createHash, randomUUID} from "node:crypto";
import {
  lstat,
  mkdir,
  readFile,
  readdir,
  realpath,
  rename,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import pixelmatch from "pixelmatch";
import {PNG} from "pngjs";

import {
  EXACT_PID_V10_KEYFRAME_PAIRS,
  EXACT_PID_V10_REGIONS,
  assertFixedRegionContract,
  compareRgbRegionFixed,
} from "./build-g4-l3-ts006-exact-pid-implementation-comparison-v10.mjs";
import {
  IMPLEMENTATION_CAPTURE_SCHEMA_VERSION,
  collectImplementationArtifactClosure,
  implementationArtifactClosureErrors,
  implementationCaptureGeneratorProvenanceErrors,
  isUnambiguousLoopbackHttpUrl,
} from "./implementation-artifact-closure.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const ANIMATION_ID = "course-g04-l03-ts-006";
const SOURCE_DIRECTORY =
  "artifacts/full-frame/g4-l3/ts006-en-exact-pid-replay-complete-diagnostic-20260726T220817+0800";
const SOURCE_MANIFEST = `${SOURCE_DIRECTORY}/capture-manifest.json`;
const SOURCE_ANALYSIS =
  "reports/g4-l3-ts006-exact-pid-replay-complete-diagnostic-v10.json";
const PREVIOUS_REPORT =
  "reports/g4-l3-ts006-exact-pid-implementation-comparison-v12.json";
const PREVIOUS_IMPLEMENTATION_MANIFEST =
  "output/playwright/g4-l3-ts006-exact-pid-comparison-v12/en-diagnostic/capture-manifest.json";
const DIAGNOSTIC_ENTRY_STATE =
  "output/playwright/g4-l3-ts006-exact-pid-comparison-v13/diagnostic-entry-state.json";
const IMPLEMENTATION_DIRECTORY =
  "output/playwright/g4-l3-ts006-exact-pid-comparison-v13/en-diagnostic";
const IMPLEMENTATION_MANIFEST =
  `${IMPLEMENTATION_DIRECTORY}/capture-manifest.json`;
const DIFF_DIRECTORY =
  "output/playwright/g4-l3-ts006-exact-pid-comparison-v13/diffs";
const REPORT_JSON =
  "reports/g4-l3-ts006-exact-pid-implementation-comparison-v13.json";
const REPORT_MARKDOWN =
  "reports/g4-l3-ts006-exact-pid-implementation-comparison-v13.md";
const MIGRATION_MANIFEST =
  "migrations/course-g04-l03-ts-006/migration.json";
const DIFF_FILE_NAME_PATTERN =
  /^source-\d{6}-implementation-\d{3}\.png$/u;

const EXPECTED_SOURCE_ANALYSIS_SHA256 =
  "5513c4d9ebd3658575ebe98f1a934eb18766c7006551d3cf6d52503175a9e0cf";
const EXPECTED_SOURCE_MANIFEST_SHA256 =
  "2e2154fd5af712a388fead07e91303c017167152ca1aa7db9f96a31ce6e3c313";
const EXPECTED_PREVIOUS_REPORT_SHA256 =
  "1274a3454e902107a2c15eeda296f12df87fa216b2ecf05e559e88119e0ca575";
const EXPECTED_PREVIOUS_IMPLEMENTATION_MANIFEST_SHA256 =
  "a258c5b67df0a5393ca2538639b9ab530f6560fad1e0877d122f530b16364d65";
const EXPECTED_ENTRY_STATE_SHA256 =
  "52846fcba0148e2b309b5c7ae2032bc8f39d990233e0f3f1160badd8f8d2016d";
const EXPECTED_IMPLEMENTATION_MANIFEST_SHA256 =
  "ce6c78b3d32e3e5b2e1bd518ec18988dd2e8d8d13a9c2166679a5fd535861f20";
const CURRENT_JS_ASSET_MANIFEST =
  "public/flash-assets/courses/course-g04-l03-ts-006/manifest.json";
const EXPECTED_CURRENT_JS_ASSET_MANIFEST_SHA256 =
  "55bf13bb3f88270a57d49d2704057bd64880bc927e978c4e0b6d8259678b328b";
const WINDOW_ID_COLOR_DIAGNOSTIC_DIRECTORY =
  "artifacts/full-frame/g4-l3/ts006-terminal-window-id-diagnostic-pointer-parked-v3";
const WINDOW_ID_COLOR_DIAGNOSTIC_MANIFEST =
  `${WINDOW_ID_COLOR_DIAGNOSTIC_DIRECTORY}/capture-manifest.json`;
const EXPECTED_WINDOW_ID_COLOR_DIAGNOSTIC_MANIFEST_SHA256 =
  "cf7b07facd7677f855306feaf682676cdebd4cdc6265774e3d21bb77c6ca5fd7";
const DISPLAY_EXACT_PID_COLOR_DIAGNOSTIC_DIRECTORY =
  "artifacts/full-frame/g4-l3/ts006-terminal-exact-pid-diagnostic-pointer-parked-v4";
const DISPLAY_EXACT_PID_COLOR_DIAGNOSTIC_MANIFEST =
  `${DISPLAY_EXACT_PID_COLOR_DIAGNOSTIC_DIRECTORY}/capture-manifest.json`;
const EXPECTED_DISPLAY_EXACT_PID_COLOR_DIAGNOSTIC_MANIFEST_SHA256 =
  "4c33158507095103cf3228ee7a2f0eb7b933423917311ec44c8f2e705e490fa4";
const COLOR_SAMPLE_POINTS = Object.freeze({
  body: Object.freeze({x: 700, y: 300}),
  footer: Object.freeze({x: 200, y: 530}),
});

export const EXACT_PID_V13_PROGRESS_ANCHORS = Object.freeze([
  Object.freeze({candidateFrame: 1, widthPixels: 0}),
  Object.freeze({candidateFrame: 8, widthPixels: 4}),
  Object.freeze({candidateFrame: 13, widthPixels: 7}),
  Object.freeze({candidateFrame: 55, widthPixels: 41}),
  Object.freeze({candidateFrame: 58, widthPixels: 43}),
  Object.freeze({candidateFrame: 74, widthPixels: 55}),
  Object.freeze({candidateFrame: 77, widthPixels: 57}),
  Object.freeze({candidateFrame: 125, widthPixels: 94}),
  Object.freeze({candidateFrame: 127, widthPixels: 97}),
  Object.freeze({candidateFrame: 128, widthPixels: 98}),
]);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function projectPath(relativePath) {
  const resolved = path.resolve(ROOT, relativePath);
  const relative = path.relative(ROOT, resolved);
  invariant(
    relative && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative),
    `path escapes project root: ${relativePath}`,
  );
  return resolved;
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function round(value) {
  return Number(value.toFixed(12));
}

function allBooleanValuesFalse(record) {
  return record
    && Object.values(record).length > 0
    && Object.values(record).every((value) => value === false);
}

function projectedAnchors(value) {
  return value.map(({candidateFrame, sourceCaptureOrdinal, phase, kind}) => ({
    candidateFrame,
    sourceCaptureOrdinal,
    phase,
    kind,
  }));
}

async function readJson(relativePath) {
  const bytes = await readFile(projectPath(relativePath));
  return {bytes, value: JSON.parse(bytes.toString("utf8"))};
}

function isInside(root, target) {
  const relative = path.relative(root, target);
  return relative === ""
    || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

async function assertCaptureFileWithin(relativePath, captureDirectory) {
  const directory = projectPath(captureDirectory);
  const file = projectPath(relativePath);
  const lexicalRelative = path.relative(directory, file);
  invariant(
    lexicalRelative
      && !lexicalRelative.startsWith(`..${path.sep}`)
      && !path.isAbsolute(lexicalRelative),
    `capture file escapes ${captureDirectory}: ${relativePath}`,
  );
  let component = directory;
  for (const part of lexicalRelative.split(path.sep)) {
    component = path.join(component, part);
    invariant(
      !(await lstat(component)).isSymbolicLink(),
      `capture file path contains a symbolic link: ${relativePath}`,
    );
  }
  const [realDirectory, realFile] = await Promise.all([
    realpath(directory),
    realpath(file),
  ]);
  invariant(
    isInside(realDirectory, realFile),
    `capture file resolves outside ${captureDirectory}: ${relativePath}`,
  );
  invariant(
    (await stat(realFile)).isFile(),
    `capture file is not a regular file: ${relativePath}`,
  );
  return file;
}

async function readBoundPng(relativePath, expectedSha256, captureDirectory) {
  const bytes = await readFile(
    await assertCaptureFileWithin(relativePath, captureDirectory),
  );
  invariant(sha256(bytes) === expectedSha256, `PNG hash drift: ${relativePath}`);
  const png = PNG.sync.read(bytes);
  invariant(
    png.width === 800 && png.height === 600,
    `PNG geometry drift: ${relativePath}`,
  );
  return {bytes, png};
}

function expectedCaptureFrame(candidateFrame) {
  return `frame-${String(candidateFrame).padStart(3, "0")}.png`;
}

export function validateExactPidV13Inputs({
  analysis,
  source,
  previousReport,
  entryState,
  implementation,
}) {
  invariant(
    analysis?.reportType
      === "g4-l3-ts006-exact-pid-replay-complete-diagnostic-v10"
      && analysis.animationId === ANIMATION_ID
      && analysis.status
        === "verified-acceptance-neutral-diagnostic-not-promotion-eligible"
      && analysis.strictAcceptanceEffect === "none"
      && allBooleanValuesFalse(analysis.authority),
    "source analysis must remain acceptance-neutral and non-authoritative",
  );
  invariant(
    source?.status === "raw-capture-not-yet-bound-to-runtime-trace"
      && source.runtimeAuthorityClaimed === false
      && source.acceptanceEffect === "none"
      && source.display?.includedProcessID === 97581
      && source.droppedOrIncompleteFrameCount === 0
      && Array.isArray(source.frames)
      && source.frames.length === 537,
    "source capture must remain the complete raw exact-PID diagnostic",
  );
  invariant(
    source.frames.every(
      (frame, index) =>
        frame.ordinal === index + 1
        && frame.status === "complete"
        && frame.width === 800
        && frame.height === 600
        && frame.file
          === `frames/frame-${String(index + 1).padStart(6, "0")}.png`
        && /^[a-f0-9]{64}$/u.test(frame.sha256),
    ),
    "source capture frame inventory is incomplete or malformed",
  );
  invariant(
    previousReport?.reportType
      === "g4-l3-ts006-exact-pid-implementation-comparison-v12"
      && previousReport.animationId === ANIMATION_ID
      && previousReport.classification
        === "acceptance-neutral-color-convergence-fixed-registration-zero-mask-diagnostic"
      && previousReport.strictAcceptanceEffect === "none"
      && previousReport.summary?.comparedFrames === 10
      && previousReport.summary?.fixedRegistrationVerified === true
      && previousReport.summary?.zeroMaskVerified === true,
    "v12 comparison report identity or boundary drifted",
  );
  invariant(
    entryState?.stateId
      === "course-g04-l03-ts-006-exact-pid-v13-layout-convergence-context"
      && entryState.animationId === ANIMATION_ID
      && entryState.classification
        === "acceptance-neutral-diagnostic-entry-context-not-original-runtime-entry-state"
      && entryState.previousDiagnostic?.comparisonReport?.path === PREVIOUS_REPORT
      && entryState.previousDiagnostic.comparisonReport.sha256
        === EXPECTED_PREVIOUS_REPORT_SHA256
      && entryState.previousDiagnostic?.implementationCaptureManifest?.path
        === PREVIOUS_IMPLEMENTATION_MANIFEST
      && entryState.previousDiagnostic.implementationCaptureManifest.sha256
        === EXPECTED_PREVIOUS_IMPLEMENTATION_MANIFEST_SHA256
      && entryState.mapping?.method
        === "operator-selected-piecewise-diagnostic-anchors"
      && entryState.mapping?.status
        === "tentative-not-trace-bound-not-source-playhead-authority"
      && entryState.mapping?.interpolationAuthorized === false
      && JSON.stringify(projectedAnchors(entryState.mapping.anchors))
        === JSON.stringify(projectedAnchors(EXACT_PID_V10_KEYFRAME_PAIRS))
      && allBooleanValuesFalse(entryState.authority)
      && entryState.strictAcceptanceEffect === "none",
    "v13 diagnostic entry-state identity, anchors, or authority drifted",
  );
  const increment = entryState.diagnosticCandidateIncrement;
  invariant(
    increment?.status
      === "acceptance-neutral-layout-convergence-not-authoritative"
      && increment.scope === "diagnostic-composite-only"
      && increment.sourceBasis
        === "fixed-coordinate-v12-rgb-diagnostic-layout-probe"
      && increment.searchBounds?.translationPixels?.minimum === -2
      && increment.searchBounds.translationPixels.maximum === 2
      && increment.searchBounds.translationPixels.step === 0.25
      && increment.searchBounds?.sizeDeltaPixels?.minimum === -2
      && increment.searchBounds.sizeDeltaPixels.maximum === 2
      && increment.searchBounds.sizeDeltaPixels.step === 0.5
      && Object.keys(increment.layoutDeltas ?? {}).length === 10
      && increment.colorCalibrationChanged === false
      && increment.progressGeometryChanged === false
      && increment.implementationAssetsAdded === false
      && increment.sourceStaticPathAffected === false
      && increment.wholeFrameOrRegionAssetUsed === false
      && increment.originalRuntimeGeometryEstablished === false
      && increment.visualParityEstablished === false
      && increment.strictAcceptanceEffect === "none",
    "v13 bounded layout-convergence increment drifted",
  );
  invariant(
    implementation?.schemaVersion === IMPLEMENTATION_CAPTURE_SCHEMA_VERSION
      && implementation.status === "complete"
      && implementation.animationId === ANIMATION_ID
      && isUnambiguousLoopbackHttpUrl(implementation.sourceUrl)
      && implementation.frameDomainId === "sprite-23"
      && implementation.requirementId === "diagnostic:ts006:exact-pid-v13:en"
      && implementation.traceId
        === "diagnostic:exact-pid-v13:tentative-piecewise-layout:en:seed-0"
      && implementation.entryStateSha256 === EXPECTED_ENTRY_STATE_SHA256
      && implementation.scenario === "manual-runtime-diagnostic-observation"
      && implementation.language === "en"
      && implementation.seed === "0"
      && implementation.viewport?.width === 800
      && implementation.viewport?.height === 600
      && implementation.viewport?.deviceScaleFactor === 1,
    "v13 implementation capture identity drifted",
  );
  const provenanceErrors = implementationCaptureGeneratorProvenanceErrors(
    implementation.generatorProvenance,
  );
  invariant(
    provenanceErrors.length === 0,
    `implementation generator provenance is invalid: ${provenanceErrors.join("; ")}`,
  );
  const closureErrors = implementationArtifactClosureErrors(
    implementation.implementationArtifactClosure,
  );
  invariant(
    closureErrors.length === 0,
    `implementation artifact closure is invalid: ${closureErrors.join("; ")}`,
  );
  invariant(
    Array.isArray(implementation.captured)
      && implementation.captured.length === EXACT_PID_V10_KEYFRAME_PAIRS.length
      && implementation.captured.every((frame, index) => {
        const expected = EXACT_PID_V10_KEYFRAME_PAIRS[index].candidateFrame;
        const frameUrl = isUnambiguousLoopbackHttpUrl(frame.url)
          ? new URL(frame.url)
          : null;
        return frame.frame === expected
          && frame.reportedFrame === expected
          && frame.reportedAnimationId === ANIMATION_ID
          && frame.rootFrame === 6
          && frame.frameDomainId === implementation.frameDomainId
          && frame.requirementId === implementation.requirementId
          && frame.traceId === implementation.traceId
          && frame.entryStateSha256 === implementation.entryStateSha256
          && frame.scenario === implementation.scenario
          && frame.language === implementation.language
          && frame.seed === implementation.seed
          && frame.width === 800
          && frame.height === 600
          && frame.reportedRenderState === "ready"
          && frame.flashContextIdentityComplete === true
          && frame.file === expectedCaptureFrame(expected)
          && frameUrl?.searchParams.get("frame") === String(expected)
          && frameUrl.searchParams.get("frameDomain")
            === implementation.frameDomainId
          && frameUrl.searchParams.get("requirementId")
            === implementation.requirementId
          && frameUrl.searchParams.get("trace") === implementation.traceId
          && frameUrl.searchParams.get("entryStateSha256")
            === implementation.entryStateSha256
          && frameUrl.searchParams.get("scenario") === implementation.scenario
          && frameUrl.searchParams.get("lang") === implementation.language
          && frameUrl.searchParams.get("seed") === implementation.seed
          && frameUrl.searchParams.get("capture") === "1"
          && frame.visualTarget?.animationId === ANIMATION_ID
          && frame.visualTarget?.reportedFrame === expected
          && frame.visualTarget?.rootFrame === 6
          && frame.visualTarget?.frameDomainId === implementation.frameDomainId
          && frame.visualTarget?.requirementId === implementation.requirementId
          && frame.visualTarget?.traceId === implementation.traceId
          && frame.visualTarget?.entryStateSha256
            === implementation.entryStateSha256
          && frame.visualTarget?.scenario === implementation.scenario
          && frame.visualTarget?.language === implementation.language
          && frame.visualTarget?.seed === implementation.seed
          && frame.visualTarget?.reportedRenderState === "ready"
          && frame.visualTarget?.flashContextIdentityComplete === true
          && /^[a-f0-9]{64}$/u.test(frame.sha256);
      }),
    "v13 implementation frames or rendered capture identities are incomplete",
  );
  invariant(
    (implementation.consoleErrors ?? []).length === 0
      && (implementation.failedRequests ?? []).length === 0
      && (implementation.httpErrors ?? []).length === 0
      && (implementation.unexpectedRequests ?? []).length === 0,
    "v13 implementation capture contains browser or network errors",
  );
  return assertFixedRegionContract(EXACT_PID_V10_REGIONS);
}

export function validateV13CapturePathColorDiagnostics({
  windowIdCapture,
  displayExactPidCapture,
}) {
  const commonCaptureContract = (capture) =>
    capture?.schemaVersion === 1
    && capture.status === "raw-capture-not-yet-bound-to-runtime-trace"
    && capture.evidenceType
      === "g4-l3-lossless-window-frame-and-system-audio-capture"
    && capture.runtimeAuthorityClaimed === false
    && capture.acceptanceEffect === "none"
    && capture.droppedOrIncompleteFrameCount === 0
    && capture.configuration?.cursor === "excluded"
    && capture.configuration?.fps === "12"
    && capture.configuration?.outputWidth === "800"
    && capture.configuration?.outputHeight === "600"
    && capture.window?.ownerName === "Flash Player"
    && capture.window?.windowID === 6310
    && Array.isArray(capture.frames)
    && capture.frames.length === 14
    && capture.frames.every(
      (frame, index) =>
        frame.ordinal === index + 1
        && frame.status === "complete"
        && frame.width === 800
        && frame.height === 600
        && frame.file
          === `frames/frame-${String(index + 1).padStart(6, "0")}.png`
        && /^[a-f0-9]{64}$/u.test(frame.sha256),
    )
    && capture.audio?.inputContainsNonZeroAudio === false
    && capture.audio?.inputNonZeroBytes === 0;
  invariant(
    commonCaptureContract(windowIdCapture)
      && windowIdCapture.configuration.sourceKind === "window"
      && !("display" in windowIdCapture),
    "window-ID color diagnostic identity or acceptance boundary drifted",
  );
  invariant(
    commonCaptureContract(displayExactPidCapture)
      && displayExactPidCapture.configuration.sourceKind
        === "waited-first-window-exact-pid"
      && displayExactPidCapture.display?.includedProcessID === 97581
      && displayExactPidCapture.display.includedApplicationName
        === "Flash Player",
    "display exact-PID color diagnostic identity or acceptance boundary drifted",
  );
  return true;
}

function closureArtifactMap(manifest) {
  return new Map(
    manifest.implementationArtifactClosure.artifacts.map((artifact) => [
      artifact.path,
      artifact,
    ]),
  );
}

export function validateV13ImplementationClosureDelta({
  previousImplementation,
  implementation,
}) {
  const previous = closureArtifactMap(previousImplementation);
  const current = closureArtifactMap(implementation);
  const added = [...current.keys()].filter((key) => !previous.has(key)).sort();
  const removed = [...previous.keys()].filter((key) => !current.has(key)).sort();
  const changed = [...current.keys()].filter(
    (key) =>
      previous.has(key)
      && previous.get(key).sha256 !== current.get(key).sha256,
  ).sort();
  invariant(
    added.length === 0,
    "v13 closure must not add implementation artifacts",
  );
  invariant(removed.length === 0, "v13 closure must not remove implementation assets");
  invariant(
    JSON.stringify(changed) === JSON.stringify([
      "packages/demos/src/modules/course-g04-l03-ts-006.tsx",
      "packages/demos/src/timelines/course-g04-l03-ts-006.ts",
    ]),
    "v13 closure may change only the frozen TS006 renderer and timeline",
  );
  invariant(
    current.get(CURRENT_JS_ASSET_MANIFEST)?.sha256
      === EXPECTED_CURRENT_JS_ASSET_MANIFEST_SHA256,
    "v13 current-JS manifest rebind hash drifted",
  );
  invariant(
    [...added, ...changed].every(
      (item) =>
        !item.includes("full-frame")
        && !item.includes("region-strip")
        && !item.startsWith("output/")
        && !item.startsWith("artifacts/"),
    ),
    "v13 closure introduced a prohibited full-frame or region-strip artifact",
  );
  return {
    added,
    removed,
    changed,
    diagnosticLayoutImplementationFiles: [
      "packages/demos/src/modules/course-g04-l03-ts-006.tsx",
      "packages/demos/src/timelines/course-g04-l03-ts-006.ts",
    ],
    unchangedCurrentJavascriptManifest: {
      path: CURRENT_JS_ASSET_MANIFEST,
      sha256: EXPECTED_CURRENT_JS_ASSET_MANIFEST_SHA256,
      layoutConvergenceAcceptanceEffect: "none",
    },
  };
}

async function validateImplementationProvenancePhysical(implementation) {
  const provenance = implementation.generatorProvenance;
  const [scriptBytes, packageBytes] = await Promise.all([
    readFile(projectPath(provenance.script.path)),
    readFile(projectPath(provenance.playwright.packageJsonPath)),
  ]);
  invariant(
    provenance.script.path === "scripts/capture-animation-keyframes.mjs"
      && sha256(scriptBytes) === provenance.script.sha256,
    "implementation capture generator script identity drifted",
  );
  invariant(
    sha256(packageBytes) === provenance.playwright.packageJsonSha256,
    "implementation capture Playwright package hash drifted",
  );
  const packageJson = JSON.parse(packageBytes.toString("utf8"));
  invariant(
    packageJson.name === "@playwright/test"
      && packageJson.version === provenance.playwright.version,
    "implementation capture Playwright package identity drifted",
  );
}

function summarize(items, regionId) {
  const values = items.map((item) => item.rmse[regionId].normalizedRmse);
  const max = Math.max(...values);
  const maxIndex = values.indexOf(max);
  return {
    min: round(Math.min(...values)),
    max: round(max),
    mean: round(values.reduce((sum, value) => sum + value, 0) / values.length),
    worstCandidateFrame: items[maxIndex].candidateFrame,
    worstSourceCaptureOrdinal: items[maxIndex].sourceCaptureOrdinal,
    worstPhase: items[maxIndex].phase,
  };
}

function improvement(previous, current) {
  const absoluteReduction = round(previous - current);
  return {
    previous: round(previous),
    current: round(current),
    absoluteReduction,
    relativeReductionPercent: round((absoluteReduction / previous) * 100),
    improved: current < previous,
  };
}

function rgbHexAt(png, point) {
  const offset = ((point.y * png.width) + point.x) * 4;
  return `#${[png.data[offset], png.data[offset + 1], png.data[offset + 2]]
    .map((channel) => channel.toString(16).padStart(2, "0"))
    .join("")}`;
}

function compareRgbaFullFrameFixed(source, implementation) {
  invariant(
    source.width === 800
      && source.height === 600
      && implementation.width === 800
      && implementation.height === 600,
    "RGBA diagnostic requires fixed 800x600 inputs",
  );
  let sumSquared = 0;
  for (let index = 0; index < source.data.length; index += 1) {
    const difference = source.data[index] - implementation.data[index];
    sumSquared += difference * difference;
  }
  return round(
    Math.sqrt(sumSquared / source.data.length) / 255,
  );
}

function makeFullFrameDiff(source, implementation) {
  const diff = new PNG({width: 800, height: 600});
  const mismatchedPixels = pixelmatch(
    source.data,
    implementation.data,
    diff.data,
    800,
    600,
    {threshold: 0.1, includeAA: true},
  );
  const bytes = PNG.sync.write(diff);
  return {
    bytes,
    mismatchedPixels,
    mismatchedPixelRatio: round(mismatchedPixels / (800 * 600)),
  };
}

function expectedDiffFileNames(diffArtifacts) {
  const names = diffArtifacts.map(({file}) => path.basename(file));
  invariant(
    names.length === new Set(names).size
      && names.every((name) => DIFF_FILE_NAME_PATTERN.test(name)),
    "expected diff artifact names are invalid or duplicated",
  );
  return names.sort();
}

export function assertExactV13DiffArtifactSet(actualNames, diffArtifacts) {
  invariant(
    JSON.stringify([...actualNames].sort())
      === JSON.stringify(expectedDiffFileNames(diffArtifacts)),
    `${DIFF_DIRECTORY} contains stale, missing, or unexpected artifacts`,
  );
  return true;
}

async function atomicWrite(relativePath, bytes) {
  const target = projectPath(relativePath);
  await mkdir(path.dirname(target), {recursive: true});
  const temporary = `${target}.tmp-${process.pid}-${randomUUID()}`;
  try {
    await writeFile(temporary, bytes, {flag: "wx"});
    await rename(temporary, target);
  } finally {
    await rm(temporary, {force: true});
  }
}

async function readDiffDirectoryEntries() {
  await mkdir(projectPath(DIFF_DIRECTORY), {recursive: true});
  return readdir(projectPath(DIFF_DIRECTORY), {withFileTypes: true});
}

async function removeStaleGeneratedDiffArtifacts(diffArtifacts) {
  const expectedNames = new Set(expectedDiffFileNames(diffArtifacts));
  const entries = await readDiffDirectoryEntries();
  for (const entry of entries) {
    if (expectedNames.has(entry.name)) continue;
    invariant(
      DIFF_FILE_NAME_PATTERN.test(entry.name)
        && (entry.isFile() || entry.isSymbolicLink()),
      `${DIFF_DIRECTORY} contains an unexpected non-generated entry: ${entry.name}`,
    );
    await rm(path.join(projectPath(DIFF_DIRECTORY), entry.name), {force: true});
  }
}

function markdown(report) {
  const rows = report.comparisons.map((item) =>
    `| ${item.candidateFrame} | ${item.sourceCaptureOrdinal} | `
    + `${item.progressWidthPixels} | ${item.kind} | `
    + `${item.rmse.full.normalizedRmse.toFixed(6)} | `
    + `${item.rmse.body.normalizedRmse.toFixed(6)} | `
    + `${item.rmse.header.normalizedRmse.toFixed(6)} | `
    + `${item.rmse.footer.normalizedRmse.toFixed(6)} |`,
  ).join("\n");
  const summary = Object.entries(report.summary.regions).map(
    ([id, value]) =>
      `- ${id}: mean ${value.mean.toFixed(6)}; max ${value.max.toFixed(6)}; `
      + `v12-to-v13 mean reduction `
      + `${report.v12Delta.regions[id].absoluteReduction.toFixed(6)} `
      + `(${report.v12Delta.regions[id].relativeReductionPercent.toFixed(2)}%)`,
  ).join("\n");
  return `# G4 L3 TS006 exact-PID implementation comparison v13\n\n`
    + `Status: **acceptance-neutral diagnostic layout-convergence probe; not an authoritative baseline, geometry calibration, fidelity acceptance, strict completion, or release evidence**.\n\n`
    + `## Bounded candidate increment\n\n`
    + `- The diagnostic-composite path changes only ten source-structural control/title placement or size values within the declared 0.25–2 px search bounds.\n`
    + `- The v12 sRGB color projection and progress geometry are unchanged.\n`
    + `- The source-static path is unchanged, and no full-frame or region-strip implementation image was introduced.\n`
    + `- This is an empirical diagnostic layout fit, not measured original-runtime geometry telemetry.\n\n`
    + `## Capture-path color diagnostic\n\n`
    + `With the pointer parked, two 14-frame, zero-drop, silent captures of the same Flash PID/window produced different colors. The window-ID path sampled body/footer as \`${report.capturePathColorDiagnostic.samples.body.windowIdCapture}\`/\`${report.capturePathColorDiagnostic.samples.footer.windowIdCapture}\`; the display exact-PID path sampled \`${report.capturePathColorDiagnostic.samples.body.displayExactPidCapture}\`/\`${report.capturePathColorDiagnostic.samples.footer.displayExactPidCapture}\`, matching the earlier exact-PID source diagnostic at those points. Therefore the window-ID path cannot substitute for display exact-PID runtime color evidence. Both packages remain raw, unpromoted diagnostics with strict acceptance effect \`none\`.\n\n`
    + `## Fixed-coordinate RMSE\n\n`
    + `All RGB pixels remain included at fixed (0,0) registration. There is no post-capture registration search, resampling, clipping, exclusion rectangle, or pixel mask; the bounded implementation-layout search is recorded above. The source/candidate frame pairs remain tentative diagnostic anchors, not source-playhead telemetry.\n\n`
    + `| Candidate | Source ordinal | Progress px | Kind | Full | Body | Header | Footer |\n`
    + `|---:|---:|---:|---|---:|---:|---:|---:|\n${rows}\n\n`
    + `## Summary\n\n${summary}\n\n`
    + `- Canonical fixed-RGB full-frame mean: ${report.summary.regions.full.mean.toFixed(6)}\n`
    + `- Four-channel RGBA diagnostic mean: ${report.summary.fourChannelRgbaDiagnostic.mean.toFixed(6)} (frame 1 ${report.summary.fourChannelRgbaDiagnostic.frame1.toFixed(6)}; frame 128 ${report.summary.fourChannelRgbaDiagnostic.frame128.toFixed(6)}). This reproduces the approximate independent ImageMagick scale but is not the acceptance metric.\n`
    + `- Informational full-frame threshold passes: ${report.summary.informationalFullFrameThresholdPasses}/10\n`
    + `- Browser capture: clean\n`
    + `- Strict acceptance effect: **none**\n\n`
    + `## Unresolved acceptance gates\n\n`
    + `${report.unresolved.map((item) => `- ${item}`).join("\n")}\n`;
}

export async function buildG4L3Ts006ExactPidImplementationComparisonV13() {
  const [
    {bytes: analysisBytes, value: analysis},
    {bytes: sourceBytes, value: source},
    {bytes: previousReportBytes, value: previousReport},
    {
      bytes: previousImplementationBytes,
      value: previousImplementation,
    },
    {bytes: entryStateBytes, value: entryState},
    {bytes: implementationBytes, value: implementation},
    {bytes: migrationBytes, value: migration},
    {
      bytes: windowIdColorDiagnosticBytes,
      value: windowIdColorDiagnostic,
    },
    {
      bytes: displayExactPidColorDiagnosticBytes,
      value: displayExactPidColorDiagnostic,
    },
  ] = await Promise.all([
    readJson(SOURCE_ANALYSIS),
    readJson(SOURCE_MANIFEST),
    readJson(PREVIOUS_REPORT),
    readJson(PREVIOUS_IMPLEMENTATION_MANIFEST),
    readJson(DIAGNOSTIC_ENTRY_STATE),
    readJson(IMPLEMENTATION_MANIFEST),
    readJson(MIGRATION_MANIFEST),
    readJson(WINDOW_ID_COLOR_DIAGNOSTIC_MANIFEST),
    readJson(DISPLAY_EXACT_PID_COLOR_DIAGNOSTIC_MANIFEST),
  ]);
  invariant(
    sha256(analysisBytes) === EXPECTED_SOURCE_ANALYSIS_SHA256,
    "source analysis hash drifted",
  );
  invariant(
    sha256(sourceBytes) === EXPECTED_SOURCE_MANIFEST_SHA256,
    "source capture manifest hash drifted",
  );
  invariant(
    sha256(previousReportBytes) === EXPECTED_PREVIOUS_REPORT_SHA256,
    "v12 comparison report hash drifted",
  );
  invariant(
    sha256(previousImplementationBytes)
      === EXPECTED_PREVIOUS_IMPLEMENTATION_MANIFEST_SHA256,
    "v12 implementation capture manifest hash drifted",
  );
  invariant(
    sha256(entryStateBytes) === EXPECTED_ENTRY_STATE_SHA256,
    "v13 diagnostic entry-state hash drifted",
  );
  invariant(
    sha256(implementationBytes) === EXPECTED_IMPLEMENTATION_MANIFEST_SHA256,
    "v13 implementation capture manifest hash drifted",
  );
  invariant(
    implementation.entryStateSha256 === sha256(entryStateBytes),
    "v13 capture does not bind the diagnostic entry-state digest",
  );
  invariant(
    sha256(windowIdColorDiagnosticBytes)
      === EXPECTED_WINDOW_ID_COLOR_DIAGNOSTIC_MANIFEST_SHA256,
    "window-ID color diagnostic manifest hash drifted",
  );
  invariant(
    sha256(displayExactPidColorDiagnosticBytes)
      === EXPECTED_DISPLAY_EXACT_PID_COLOR_DIAGNOSTIC_MANIFEST_SHA256,
    "display exact-PID color diagnostic manifest hash drifted",
  );
  validateExactPidV13Inputs({
    analysis,
    source,
    previousReport,
    entryState,
    implementation,
  });
  validateV13CapturePathColorDiagnostics({
    windowIdCapture: windowIdColorDiagnostic,
    displayExactPidCapture: displayExactPidColorDiagnostic,
  });
  const closureDelta = validateV13ImplementationClosureDelta({
    previousImplementation,
    implementation,
  });
  await validateImplementationProvenancePhysical(implementation);
  invariant(migration.animationId === ANIMATION_ID, "migration identity drifted");
  const currentClosure = await collectImplementationArtifactClosure({
    projectRoot: ROOT,
    workspace: projectPath("migrations/course-g04-l03-ts-006"),
    manifest: migration,
  });
  const closureFreshnessErrors = implementationArtifactClosureErrors(
    implementation.implementationArtifactClosure,
    currentClosure,
  );
  invariant(
    closureFreshnessErrors.length === 0,
    `v13 implementation closure is stale: ${closureFreshnessErrors.join("; ")}`,
  );

  const colorSourceFrame = source.frames[
    EXACT_PID_V10_KEYFRAME_PAIRS[0].sourceCaptureOrdinal - 1
  ];
  const colorImplementationFrame = implementation.captured.find(
    (frame) => frame.frame === EXACT_PID_V10_KEYFRAME_PAIRS[0].candidateFrame,
  );
  invariant(
    colorSourceFrame && colorImplementationFrame,
    "v13 color diagnostic frame lookup drifted",
  );
  const [
    {png: windowIdColorPng},
    {png: displayExactPidColorPng},
    {png: previousExactPidColorPng},
    {png: implementationColorPng},
  ] = await Promise.all([
    readBoundPng(
      `${WINDOW_ID_COLOR_DIAGNOSTIC_DIRECTORY}/${windowIdColorDiagnostic.frames[0].file}`,
      windowIdColorDiagnostic.frames[0].sha256,
      WINDOW_ID_COLOR_DIAGNOSTIC_DIRECTORY,
    ),
    readBoundPng(
      `${DISPLAY_EXACT_PID_COLOR_DIAGNOSTIC_DIRECTORY}/${displayExactPidColorDiagnostic.frames[0].file}`,
      displayExactPidColorDiagnostic.frames[0].sha256,
      DISPLAY_EXACT_PID_COLOR_DIAGNOSTIC_DIRECTORY,
    ),
    readBoundPng(
      `${SOURCE_DIRECTORY}/${colorSourceFrame.file}`,
      colorSourceFrame.sha256,
      SOURCE_DIRECTORY,
    ),
    readBoundPng(
      `${IMPLEMENTATION_DIRECTORY}/${colorImplementationFrame.file}`,
      colorImplementationFrame.sha256,
      IMPLEMENTATION_DIRECTORY,
    ),
  ]);
  const colorSamples = Object.fromEntries(
    Object.entries(COLOR_SAMPLE_POINTS).map(([sampleId, point]) => [
      sampleId,
      {
        point,
        windowIdCapture: rgbHexAt(windowIdColorPng, point),
        displayExactPidCapture: rgbHexAt(displayExactPidColorPng, point),
        previousExactPidSourceCapture: rgbHexAt(
          previousExactPidColorPng,
          point,
        ),
        v13ImplementationCapture: rgbHexAt(implementationColorPng, point),
      },
    ]),
  );
  invariant(
    colorSamples.body.windowIdCapture === "#b8d8f7"
      && colorSamples.body.displayExactPidCapture === "#c2ddfa"
      && colorSamples.body.previousExactPidSourceCapture === "#c2ddfa"
      && colorSamples.body.v13ImplementationCapture === "#c2def8"
      && colorSamples.footer.windowIdCapture === "#1457c7"
      && colorSamples.footer.displayExactPidCapture === "#1e64d2"
      && colorSamples.footer.previousExactPidSourceCapture === "#1e64d2"
      && colorSamples.footer.v13ImplementationCapture === "#1e67ce",
    "v13 capture-path color diagnostic sample drifted",
  );
  const capturePathColorDiagnostic = {
    classification:
      "acceptance-neutral-capture-path-color-diagnostic-not-baseline",
    pointerState: "parked",
    comparedProcessId: 97581,
    comparedWindowId: 6310,
    frameCountPerCapture: 14,
    droppedOrIncompleteFrameCount: 0,
    audioState: "silent",
    samples: colorSamples,
    finding:
      "The exact-PID display path reproduces the prior exact-PID source colors; the window-ID path does not and cannot substitute for display-exact runtime color evidence.",
    originalRuntimeColorPipelineEstablished: false,
    authoritativeBaselineEstablished: false,
    strictAcceptanceEffect: "none",
  };

  const comparisons = [];
  const diffArtifacts = [];
  for (const pair of EXACT_PID_V10_KEYFRAME_PAIRS) {
    const sourceFrame = source.frames[pair.sourceCaptureOrdinal - 1];
    const implementationFrame = implementation.captured.find(
      (item) => item.frame === pair.candidateFrame,
    );
    invariant(
      sourceFrame?.ordinal === pair.sourceCaptureOrdinal && implementationFrame,
      "diagnostic comparison frame lookup drifted",
    );
    const sourceFile = `${SOURCE_DIRECTORY}/${sourceFrame.file}`;
    const implementationFile =
      `${IMPLEMENTATION_DIRECTORY}/${implementationFrame.file}`;
    const [{png: sourcePng}, {png: implementationPng}] = await Promise.all([
      readBoundPng(sourceFile, sourceFrame.sha256, SOURCE_DIRECTORY),
      readBoundPng(
        implementationFile,
        implementationFrame.sha256,
        IMPLEMENTATION_DIRECTORY,
      ),
    ]);
    const rmse = Object.fromEntries(
      Object.entries(EXACT_PID_V10_REGIONS).map(([regionId, region]) => [
        regionId,
        compareRgbRegionFixed(sourcePng, implementationPng, region),
      ]),
    );
    const diff = makeFullFrameDiff(sourcePng, implementationPng);
    const rgbaDiagnosticNormalizedRmse = compareRgbaFullFrameFixed(
      sourcePng,
      implementationPng,
    );
    const diffFile =
      `${DIFF_DIRECTORY}/source-${String(pair.sourceCaptureOrdinal).padStart(6, "0")}`
      + `-implementation-${String(pair.candidateFrame).padStart(3, "0")}.png`;
    diffArtifacts.push({file: diffFile, bytes: diff.bytes});
    const informationalThreshold = pair.kind === "static" ? 0.05 : 0.08;
    const progressWidthPixels = EXACT_PID_V13_PROGRESS_ANCHORS.find(
      (anchor) => anchor.candidateFrame === pair.candidateFrame,
    ).widthPixels;
    comparisons.push({
      ...pair,
      progressWidthPixels,
      mappingStatus:
        "operator-selected-piecewise-tentative-diagnostic-not-trace-bound",
      sourceFile,
      sourceSha256: sourceFrame.sha256,
      implementationFile,
      implementationSha256: implementationFrame.sha256,
      registrationOffset: {x: 0, y: 0},
      pixelMaskApplied: false,
      excludedPixelCount: 0,
      rmse,
      rgbaDiagnosticNormalizedRmse,
      fullFrameDiff: {
        file: diffFile,
        bytes: diff.bytes.length,
        sha256: sha256(diff.bytes),
        pixelmatchThreshold: 0.1,
        includeAntialiasingDifferences: true,
        mismatchedPixels: diff.mismatchedPixels,
        mismatchedPixelRatio: diff.mismatchedPixelRatio,
      },
      informationalThreshold,
      informationalFullFrameThresholdPassed:
        rmse.full.normalizedRmse <= informationalThreshold,
    });
  }
  const regions = Object.fromEntries(
    Object.keys(EXACT_PID_V10_REGIONS).map((regionId) => [
      regionId,
      summarize(comparisons, regionId),
    ]),
  );
  const rgbaDiagnosticValues = comparisons.map(
    (comparison) => comparison.rgbaDiagnosticNormalizedRmse,
  );
  const fourChannelRgbaDiagnostic = {
    metric:
      "sqrt(mean((sourceRGBA-implementationRGBA)^2))/255 over all fixed full-stage samples",
    acceptanceMetric: false,
    relationshipToImageMagick:
      "diagnostic four-channel scale consistent with the independent ImageMagick RMSE observation; canonical project acceptance metrics remain RGB",
    mean: round(
      rgbaDiagnosticValues.reduce((sum, value) => sum + value, 0)
        / rgbaDiagnosticValues.length,
    ),
    frame1: comparisons.find((comparison) => comparison.candidateFrame === 1)
      .rgbaDiagnosticNormalizedRmse,
    frame128: comparisons.find(
      (comparison) => comparison.candidateFrame === 128,
    ).rgbaDiagnosticNormalizedRmse,
  };
  const v12Delta = {
    comparisonReportSha256: sha256(previousReportBytes),
    regions: Object.fromEntries(
      Object.keys(EXACT_PID_V10_REGIONS).map((regionId) => [
        regionId,
        improvement(
          previousReport.summary.regions[regionId].mean,
          regions[regionId].mean,
        ),
      ]),
    ),
    perFrame: comparisons.map((item) => {
      const previous = previousReport.comparisons.find(
        (candidate) =>
          candidate.candidateFrame === item.candidateFrame
          && candidate.sourceCaptureOrdinal === item.sourceCaptureOrdinal,
      );
      invariant(previous, "v12 comparison pair lookup drifted");
      return {
        candidateFrame: item.candidateFrame,
        sourceCaptureOrdinal: item.sourceCaptureOrdinal,
        full: improvement(
          previous.rmse.full.normalizedRmse,
          item.rmse.full.normalizedRmse,
        ),
        header: improvement(
          previous.rmse.header.normalizedRmse,
          item.rmse.header.normalizedRmse,
        ),
        body: improvement(
          previous.rmse.body.normalizedRmse,
          item.rmse.body.normalizedRmse,
        ),
        footer: improvement(
          previous.rmse.footer.normalizedRmse,
          item.rmse.footer.normalizedRmse,
        ),
      };
    }),
  };
  invariant(
    ["full", "header", "footer"].every(
      (regionId) =>
        v12Delta.regions[regionId].improved
        && v12Delta.regions[regionId].relativeReductionPercent >= 1,
    )
      && v12Delta.regions.body.current <= v12Delta.regions.body.previous
      && v12Delta.perFrame.every(
        (item) =>
          item.full.current <= item.full.previous
          && item.header.current <= item.header.previous
          && item.footer.current <= item.footer.previous,
      ),
    "v13 layout increment must materially improve full/header/footer means without any paired-frame regression",
  );
  const scriptBytes = await readFile(SCRIPT_PATH);
  const report = {
    schemaVersion: 1,
    reportType: "g4-l3-ts006-exact-pid-implementation-comparison-v13",
    animationId: ANIMATION_ID,
    classification:
      "acceptance-neutral-layout-convergence-fixed-registration-zero-mask-diagnostic",
    boundedIncrement: {
      status: entryState.diagnosticCandidateIncrement.status,
      scope: entryState.diagnosticCandidateIncrement.scope,
      sourceBasis: entryState.diagnosticCandidateIncrement.sourceBasis,
      searchBounds: entryState.diagnosticCandidateIncrement.searchBounds,
      layoutDeltas: entryState.diagnosticCandidateIncrement.layoutDeltas,
      colorCalibrationChanged: false,
      progressGeometryChanged: false,
      implementationAssetsAdded: false,
      sourceStaticPathAffected: false,
      originalRuntimeGeometryEstablished: false,
      visualParityEstablished: false,
      progressAnchorsInheritedUnchangedFromV12:
        EXACT_PID_V13_PROGRESS_ANCHORS,
      prohibitedRasterSubstitution: {
        wholeFrameOrRegionAssetUsed: false,
      },
      implementationClosureDelta: closureDelta,
      strictAcceptanceEffect: "none",
    },
    authority: {
      sourceCapture: "raw-unpromoted-exact-pid-runtime-diagnostic",
      sourceReplayMapping:
        "operator-selected-piecewise-tentative-not-trace-bound",
      implementation: "current-javascript-diagnostic-candidate",
      originalRuntimeAuthorityClaimed: false,
      authoritativeBaselineClaimed: false,
      sourcePlayheadMappingClaimed: false,
      originalRuntimeColorPipelineEstablished: false,
      implementationCandidatePromoted: false,
      visualParityClaimed: false,
      coverageChanged: false,
      completionLedgerChanged: false,
      releaseLedgerChanged: false,
      protectedPinsChanged: false,
      strictMigrationComplete: false,
      publicRelease: false,
    },
    mapping: {
      method: entryState.mapping.method,
      status: entryState.mapping.status,
      interpolationAppliedToSourceFrameIdentity: false,
      anchors: projectedAnchors(EXACT_PID_V10_KEYFRAME_PAIRS),
    },
    comparisonContract: {
      stage: {width: 800, height: 600},
      regions: EXACT_PID_V10_REGIONS,
      metric:
        "sqrt(mean((sourceRGB-implementationRGB)^2))/255 over every fixed region pixel",
      channels: ["red", "green", "blue"],
      fourChannelRgbaDiagnostic,
      fixedRegistration: {
        sourceOffset: {x: 0, y: 0},
        implementationOffset: {x: 0, y: 0},
        translationSearchApplied: false,
        alignmentOptimizationApplied: false,
        resamplingApplied: false,
        clippingApplied: false,
      },
      masking: {
        spatialPixelMaskApplied: false,
        alphaUsedAsSpatialMask: false,
        excludedRectangles: [],
        everyRegionPixelRetained: true,
      },
    },
    bindings: {
      sourceAnalysis: {
        path: SOURCE_ANALYSIS,
        bytes: analysisBytes.length,
        sha256: sha256(analysisBytes),
      },
      sourceCaptureManifest: {
        path: SOURCE_MANIFEST,
        bytes: sourceBytes.length,
        sha256: sha256(sourceBytes),
      },
      windowIdColorDiagnosticManifest: {
        path: WINDOW_ID_COLOR_DIAGNOSTIC_MANIFEST,
        bytes: windowIdColorDiagnosticBytes.length,
        sha256: sha256(windowIdColorDiagnosticBytes),
      },
      displayExactPidColorDiagnosticManifest: {
        path: DISPLAY_EXACT_PID_COLOR_DIAGNOSTIC_MANIFEST,
        bytes: displayExactPidColorDiagnosticBytes.length,
        sha256: sha256(displayExactPidColorDiagnosticBytes),
      },
      previousComparisonReport: {
        path: PREVIOUS_REPORT,
        bytes: previousReportBytes.length,
        sha256: sha256(previousReportBytes),
      },
      previousImplementationCaptureManifest: {
        path: PREVIOUS_IMPLEMENTATION_MANIFEST,
        bytes: previousImplementationBytes.length,
        sha256: sha256(previousImplementationBytes),
      },
      diagnosticEntryState: {
        path: DIAGNOSTIC_ENTRY_STATE,
        bytes: entryStateBytes.length,
        sha256: sha256(entryStateBytes),
      },
      implementationCaptureManifest: {
        path: IMPLEMENTATION_MANIFEST,
        bytes: implementationBytes.length,
        sha256: sha256(implementationBytes),
      },
      migrationManifestForClosure: {
        path: MIGRATION_MANIFEST,
        bytes: migrationBytes.length,
        sha256: sha256(migrationBytes),
      },
      generator: {
        path: portable(path.relative(ROOT, SCRIPT_PATH)),
        bytes: scriptBytes.length,
        sha256: sha256(scriptBytes),
      },
    },
    implementationIdentity: {
      frameDomain: implementation.frameDomainId,
      requirementId: implementation.requirementId,
      traceId: implementation.traceId,
      entryStateSha256: implementation.entryStateSha256,
      entryStateDigestMeaning: entryState.entryStateDigestMeaning,
      scenario: implementation.scenario,
      language: implementation.language,
      seed: implementation.seed,
      rootFrame: 6,
      viewport: implementation.viewport,
      implementationArtifactClosure:
        implementation.implementationArtifactClosure,
    },
    capturePathColorDiagnostic,
    comparisons,
    summary: {
      comparedFrames: comparisons.length,
      staticFrames: comparisons.filter((item) => item.kind === "static").length,
      transitionFrames:
        comparisons.filter((item) => item.kind === "transition").length,
      regions,
      fourChannelRgbaDiagnostic,
      informationalFullFrameThresholdPasses: comparisons.filter(
        (item) => item.informationalFullFrameThresholdPassed,
      ).length,
      fixedRegistrationVerified: true,
      zeroMaskVerified: true,
      implementationBrowserCaptureClean: true,
      strictAcceptanceEffect: "none",
    },
    v12Delta,
    unresolved: [
      "The exact-PID source package remains an acceptance-neutral diagnostic, not an authorized natural runtime trace or authoritative baseline.",
      "The source-ordinal to candidate-frame pairs remain tentative phase anchors, not source-playhead telemetry or trace-bound source-frame identity.",
      "Ten spot frames do not establish complete 128-frame coverage or transition timing parity.",
      "The bounded layout fit is an empirical diagnostic; no original-runtime geometry telemetry or authoritative placement calibration has been established.",
      "The sRGB gamma projection is an empirical diagnostic fit; no original-runtime color pipeline or display-transfer telemetry has been established.",
      "Static full-frame RMSE remains above 0.05, so this diagnostic cannot establish visual fidelity.",
      "Audio timing and listening review, an independent Spanish trace, independent human visual review, Owner acceptance, and strict completion remain open.",
    ],
    strictAcceptanceEffect: "none",
  };
  return {report, markdown: markdown(report), diffArtifacts};
}

export async function writeG4L3Ts006ExactPidImplementationComparisonV13({
  check = false,
} = {}) {
  const {
    report,
    markdown: markdownBytes,
    diffArtifacts,
  } = await buildG4L3Ts006ExactPidImplementationComparisonV13();
  const jsonBytes = `${JSON.stringify(report, null, 2)}\n`;
  if (check) {
    const [existingJson, existingMarkdown, entries] = await Promise.all([
      readFile(projectPath(REPORT_JSON), "utf8"),
      readFile(projectPath(REPORT_MARKDOWN), "utf8"),
      readDiffDirectoryEntries(),
    ]);
    invariant(existingJson === jsonBytes, `${REPORT_JSON} is stale`);
    invariant(existingMarkdown === markdownBytes, `${REPORT_MARKDOWN} is stale`);
    invariant(
      entries.every((entry) => entry.isFile() && !entry.isSymbolicLink()),
      `${DIFF_DIRECTORY} must contain only regular files`,
    );
    assertExactV13DiffArtifactSet(
      entries.map((entry) => entry.name),
      diffArtifacts,
    );
    for (const artifact of diffArtifacts) {
      invariant(
        (await readFile(projectPath(artifact.file))).equals(artifact.bytes),
        `${artifact.file} is stale`,
      );
    }
  } else {
    await removeStaleGeneratedDiffArtifacts(diffArtifacts);
    for (const artifact of diffArtifacts) {
      await atomicWrite(artifact.file, artifact.bytes);
    }
    await atomicWrite(REPORT_MARKDOWN, markdownBytes);
    await atomicWrite(REPORT_JSON, jsonBytes);
  }
  return report;
}

export function parseArguments(argv) {
  const options = {check: false};
  for (const argument of argv) {
    if (argument === "--check") options.check = true;
    else throw new Error(`Unknown option: ${argument}`);
  }
  return options;
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  writeG4L3Ts006ExactPidImplementationComparisonV13(
    parseArguments(process.argv.slice(2)),
  )
    .then((report) => {
      console.log(JSON.stringify({
        summary: report.summary,
        v12Delta: report.v12Delta.regions,
      }, null, 2));
    })
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}
