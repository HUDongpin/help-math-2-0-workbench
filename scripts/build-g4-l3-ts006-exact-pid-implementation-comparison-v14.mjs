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
  "reports/g4-l3-ts006-exact-pid-implementation-comparison-v13.json";
const PREVIOUS_IMPLEMENTATION_MANIFEST =
  "output/playwright/g4-l3-ts006-exact-pid-comparison-v13/en-diagnostic/capture-manifest.json";
const DIAGNOSTIC_ENTRY_STATE =
  "output/playwright/g4-l3-ts006-exact-pid-comparison-v14/diagnostic-entry-state.json";
const IMPLEMENTATION_DIRECTORY =
  "output/playwright/g4-l3-ts006-exact-pid-comparison-v14/en-diagnostic";
const IMPLEMENTATION_MANIFEST =
  `${IMPLEMENTATION_DIRECTORY}/capture-manifest.json`;
const DIFF_DIRECTORY =
  "output/playwright/g4-l3-ts006-exact-pid-comparison-v14/diffs";
const REPORT_JSON =
  "reports/g4-l3-ts006-exact-pid-implementation-comparison-v14.json";
const REPORT_MARKDOWN =
  "reports/g4-l3-ts006-exact-pid-implementation-comparison-v14.md";
const MIGRATION_MANIFEST =
  "migrations/course-g04-l03-ts-006/migration.json";
const CURRENT_JS_ASSET_MANIFEST =
  "public/flash-assets/courses/course-g04-l03-ts-006/manifest.json";
const CURRENT_JS_CANDIDATE_REPORT =
  "reports/g4-l3-ts006-current-javascript-candidate.json";
const DIFF_FILE_NAME_PATTERN =
  /^source-\d{6}-implementation-\d{3}\.png$/u;

const EXPECTED_SOURCE_ANALYSIS_SHA256 =
  "5513c4d9ebd3658575ebe98f1a934eb18766c7006551d3cf6d52503175a9e0cf";
const EXPECTED_SOURCE_MANIFEST_SHA256 =
  "2e2154fd5af712a388fead07e91303c017167152ca1aa7db9f96a31ce6e3c313";
const EXPECTED_PREVIOUS_REPORT_SHA256 =
  "27d27cb9c70149cf7d4165cd9702c30ec5f89da6532ca305dd26182d342b5804";
const EXPECTED_PREVIOUS_IMPLEMENTATION_MANIFEST_SHA256 =
  "ce6c78b3d32e3e5b2e1bd518ec18988dd2e8d8d13a9c2166679a5fd535861f20";
const EXPECTED_ENTRY_STATE_SHA256 =
  "df4d451158585f3497d51b438ca0bf803c1e6a18297b39974f10946c67533d2f";
const EXPECTED_IMPLEMENTATION_MANIFEST_SHA256 =
  "c719c18f57b89d2f797a2feca24e96fba3c3805fcc75b6731afaf8191c133547";
const EXPECTED_CURRENT_JS_ASSET_MANIFEST_SHA256 =
  "6d27769d685dcb37b1177d97300311eb3f981929d1f9bbebc1f7cb430fba7063";
const EXPECTED_CURRENT_JS_CANDIDATE_REPORT_SHA256 =
  "20a8ac26f0f43709f04c61dcad4babda499d0b9afa6f666ba4af544628c32da3";

export const EXACT_PID_V14_PROGRESS_ANCHORS = Object.freeze([
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

const EXPECTED_STATUS_STRIP = Object.freeze({
  status:
    "source-supported-exact-pid-diagnostic-observation-no-ordinal-authority",
  geometry: Object.freeze({
    y: 529,
    height: 12,
    width: 14,
    edgeInsetPixels: 1,
    xPositions: Object.freeze([9, 49, 89, 129, 169, 209, 249, 289]),
  }),
  observedOutputSrgbColors: Object.freeze([
    "#f97100",
    "#f97100",
    "#f97100",
    "#f97100",
    "#facd00",
    "#ffffff",
    "#ffffff",
    "#ffffff",
  ]),
  renderingContract:
    "observed-output-srgb-colors-rendered-after-diagnostic-gamma-group",
  activeOrdinal: null,
  blockOrdinalMeaning: "unresolved",
  ordinalAuthorityEstablished: false,
});

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

function stableJson(value) {
  if (Array.isArray(value)) return value.map(stableJson);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.keys(value).sort().map((key) => [key, stableJson(value[key])]),
  );
}

export function validateExactPidV14Inputs({
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
      === "g4-l3-ts006-exact-pid-implementation-comparison-v13"
      && previousReport.animationId === ANIMATION_ID
      && previousReport.classification
        === "acceptance-neutral-layout-convergence-fixed-registration-zero-mask-diagnostic"
      && previousReport.strictAcceptanceEffect === "none"
      && previousReport.summary?.comparedFrames === 10
      && previousReport.summary?.fixedRegistrationVerified === true
      && previousReport.summary?.zeroMaskVerified === true
      && previousReport.authority?.authoritativeBaselineClaimed === false
      && previousReport.authority?.implementationCandidatePromoted === false,
    "v13 comparison report identity or boundary drifted",
  );
  invariant(
    entryState?.stateId
      === "course-g04-l03-ts-006-exact-pid-v14-observed-status-strip-and-panel-fill-context"
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
      && entryState.preExistingClosureContext?.classification
        === "pre-existing-current-javascript-manifest-drift-outside-v14-renderer-refinement"
      && entryState.preExistingClosureContext?.currentJavascriptCandidateReport?.path
        === CURRENT_JS_CANDIDATE_REPORT
      && entryState.preExistingClosureContext.currentJavascriptCandidateReport.sha256
        === EXPECTED_CURRENT_JS_CANDIDATE_REPORT_SHA256
      && entryState.preExistingClosureContext?.assetManifest?.path
        === CURRENT_JS_ASSET_MANIFEST
      && entryState.preExistingClosureContext.assetManifest.v13HistoricalSha256
        === "55bf13bb3f88270a57d49d2704057bd64880bc927e978c4e0b6d8259678b328b"
      && entryState.preExistingClosureContext.assetManifest.currentPreV14Sha256
        === EXPECTED_CURRENT_JS_ASSET_MANIFEST_SHA256
      && entryState.preExistingClosureContext.modifiedByV14 === false
      && entryState.preExistingClosureContext.strictAcceptanceEffect === "none"
      && entryState.implementationContext?.frameDomain === "sprite-23"
      && entryState.implementationContext?.rootFrame === 6
      && entryState.implementationContext?.candidateFrameRange?.firstFrame === 1
      && entryState.implementationContext?.candidateFrameRange?.lastFrame === 128
      && entryState.implementationContext?.candidateFrameRange?.oneBased === true
      && entryState.mapping?.method
        === "operator-selected-piecewise-diagnostic-anchors"
      && entryState.mapping?.status
        === "tentative-not-trace-bound-not-source-playhead-authority"
      && entryState.mapping?.interpolationAuthorized === false
      && JSON.stringify(entryState.mapping.anchors)
        === JSON.stringify(projectedAnchors(EXACT_PID_V10_KEYFRAME_PAIRS))
      && JSON.stringify(stableJson(entryState.diagnosticCandidateIncrement?.statusStrip))
        === JSON.stringify(stableJson(EXPECTED_STATUS_STRIP))
      && entryState.diagnosticCandidateIncrement?.tablePatch?.previousSourceFill
        === "#fff8f8"
      && entryState.diagnosticCandidateIncrement?.tablePatch?.currentSourceFill
        === "#fff5f4"
      && entryState.diagnosticCandidateIncrement?.colorCalibrationChanged === false
      && entryState.diagnosticCandidateIncrement?.progressGeometryChanged === false
      && entryState.diagnosticCandidateIncrement?.implementationAssetsAdded === false
      && entryState.diagnosticCandidateIncrement?.sourceStaticPathAffected === false
      && entryState.diagnosticCandidateIncrement?.wholeFrameOrRegionAssetUsed === false
      && entryState.diagnosticCandidateIncrement?.rootOrNestedFrameDomainChanged === false
      && entryState.diagnosticCandidateIncrement?.oneBasedFrameContractChanged === false
      && entryState.diagnosticCandidateIncrement?.strictAcceptanceEffect === "none"
      && allBooleanValuesFalse(entryState.authority)
      && entryState.strictAcceptanceEffect === "none",
    "v14 entry-state identity, two-change scope, mapping, or authority drifted",
  );
  invariant(
    implementation?.schemaVersion === IMPLEMENTATION_CAPTURE_SCHEMA_VERSION
      && implementation.status === "complete"
      && implementation.animationId === ANIMATION_ID
      && implementation.frameDomainId === "sprite-23"
      && implementation.requestedFrameDomain === "sprite-23"
      && implementation.requirementId
        === "diagnostic:ts006:exact-pid-v14:en"
      && implementation.traceId
        === "diagnostic:exact-pid-v14:tentative-source-supported-refinement:en:seed-0"
      && implementation.entryStateSha256 === EXPECTED_ENTRY_STATE_SHA256
      && implementation.scenario === "manual-runtime-diagnostic-observation"
      && implementation.language === "en"
      && implementation.seed === "0"
      && implementation.viewport?.width === 800
      && implementation.viewport?.height === 600
      && implementation.viewport?.deviceScaleFactor === 1
      && implementation.flashContextIdentityComplete === true
      && isUnambiguousLoopbackHttpUrl(implementation.sourceUrl)
      && implementationCaptureGeneratorProvenanceErrors(
        implementation.generatorProvenance,
      ).length === 0,
    "v14 implementation capture identity drifted",
  );
  invariant(
    Array.isArray(implementation.captured)
      && implementation.captured.length === EXACT_PID_V10_KEYFRAME_PAIRS.length
      && implementation.captured.every((frame, index) => {
        const expected = EXACT_PID_V10_KEYFRAME_PAIRS[index];
        const frameUrl = new URL(frame.url);
        return frame.frame === expected.candidateFrame
          && frame.file === expectedCaptureFrame(expected.candidateFrame)
          && frame.width === 800
          && frame.height === 600
          && frame.rootFrame === 6
          && frame.frameDomain === "sprite-23"
          && frame.frameDomainId === "sprite-23"
          && frame.requirementId === implementation.requirementId
          && frame.traceId === implementation.traceId
          && frame.entryStateSha256 === implementation.entryStateSha256
          && frame.scenario === implementation.scenario
          && frame.language === implementation.language
          && frame.seed === implementation.seed
          && frame.reportedRenderState === "ready"
          && frame.flashContextIdentityComplete === true
          && frame.visualTarget?.rootFrame === 6
          && frame.visualTarget?.frameDomainId === "sprite-23"
          && frame.visualTarget?.reportedFrame === expected.candidateFrame
          && frame.visualTarget?.requirementId === implementation.requirementId
          && frame.visualTarget?.traceId === implementation.traceId
          && frame.visualTarget?.entryStateSha256
            === implementation.entryStateSha256
          && frame.visualTarget?.scenario === implementation.scenario
          && frame.visualTarget?.language === implementation.language
          && frame.visualTarget?.seed === implementation.seed
          && /^[a-f0-9]{64}$/u.test(frame.sha256)
          && frameUrl.searchParams.get("frame")
            === String(expected.candidateFrame)
          && frameUrl.searchParams.get("frameDomain") === "sprite-23"
          && frameUrl.searchParams.get("requirementId")
            === implementation.requirementId
          && frameUrl.searchParams.get("trace") === implementation.traceId
          && frameUrl.searchParams.get("entryStateSha256")
            === implementation.entryStateSha256
          && frameUrl.searchParams.get("scenario") === implementation.scenario
          && frameUrl.searchParams.get("lang") === implementation.language
          && frameUrl.searchParams.get("seed") === implementation.seed;
      }),
    "v14 implementation frames or rendered capture identities are incomplete",
  );
  invariant(
    implementation.consoleErrors?.length === 0
      && implementation.failedRequests?.length === 0
      && implementation.httpErrors?.length === 0
      && implementation.unexpectedRequests?.length === 0
      && implementation.error === null,
    "v14 implementation capture contains browser or network errors",
  );
  return true;
}

function closureArtifactMap(manifest) {
  return new Map(
    manifest.implementationArtifactClosure.artifacts.map(
      (artifact) => [artifact.path, artifact],
    ),
  );
}

export function validateV14ImplementationClosureDelta({
  previousImplementation,
  implementation,
}) {
  const previous = closureArtifactMap(previousImplementation);
  const current = closureArtifactMap(implementation);
  const added = [...current.keys()].filter((item) => !previous.has(item)).sort();
  const removed = [...previous.keys()].filter((item) => !current.has(item)).sort();
  const changed = [...current.keys()].filter((item) => {
    const before = previous.get(item);
    const after = current.get(item);
    return before
      && (before.sha256 !== after.sha256 || before.bytes !== after.bytes);
  }).sort();
  const boundedImplementationFiles = [
    "packages/demos/src/modules/course-g04-l03-ts-006.tsx",
    "packages/demos/src/timelines/course-g04-l03-ts-006.ts",
  ];
  const expectedChanged = [
    ...boundedImplementationFiles,
    CURRENT_JS_ASSET_MANIFEST,
  ].sort();
  invariant(
    added.length === 0
      && removed.length === 0
      && JSON.stringify(changed) === JSON.stringify(expectedChanged),
    "v14 closure must change only the TS006 diagnostic module and timeline",
  );
  const currentManifest = current.get(CURRENT_JS_ASSET_MANIFEST);
  invariant(
    currentManifest?.sha256 === EXPECTED_CURRENT_JS_ASSET_MANIFEST_SHA256,
    "v14 must not change the current-JavaScript asset manifest",
  );
  invariant(
    [...current.keys()].every(
      (item) =>
        !item.includes("full-frame")
        && !item.includes("region-strip")
        && !item.startsWith("output/")
        && !item.startsWith("artifacts/"),
    ),
    "v14 closure introduced a prohibited full-frame or region-strip asset",
  );
  return {
    added,
    removed,
    changed,
    boundedImplementationFiles,
    preExistingCurrentJavascriptManifestDrift: {
      path: CURRENT_JS_ASSET_MANIFEST,
      v13HistoricalSha256:
        "55bf13bb3f88270a57d49d2704057bd64880bc927e978c4e0b6d8259678b328b",
      sha256: EXPECTED_CURRENT_JS_ASSET_MANIFEST_SHA256,
      modifiedByV14: false,
      strictAcceptanceEffect: "none",
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
    nonRegressed: current <= previous,
  };
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

export function assertExactV14DiffArtifactSet(actualNames, diffArtifacts) {
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
    `| ${item.candidateFrame} | ${item.sourceCaptureOrdinal} | ${item.kind} | `
    + `${item.rmse.full.normalizedRmse.toFixed(6)} | `
    + `${item.rmse.body.normalizedRmse.toFixed(6)} | `
    + `${item.rmse.header.normalizedRmse.toFixed(6)} | `
    + `${item.rmse.footer.normalizedRmse.toFixed(6)} | `
    + `${item.v13Delta.full.absoluteReduction.toFixed(6)} | `
    + `${item.v13Delta.footer.absoluteReduction.toFixed(6)} |`,
  ).join("\n");
  const summary = Object.entries(report.summary.regions).map(
    ([id, value]) =>
      `- ${id}: mean ${value.mean.toFixed(6)}; max ${value.max.toFixed(6)}; `
      + `v13-to-v14 reduction `
      + `${report.v13Delta.regions[id].absoluteReduction.toFixed(6)} `
      + `(${report.v13Delta.regions[id].relativeReductionPercent.toFixed(2)}%)`,
  ).join("\n");
  return `# G4 L3 TS006 exact-PID implementation comparison v14\n\n`
    + `Status: **acceptance-neutral current-JavaScript diagnostic; not an authoritative baseline, page-ordinal interpretation, fidelity acceptance, strict completion, or release evidence**.\n\n`
    + `## Bounded renderer increment\n\n`
    + `- Added the eight observed footer status blocks at the exact diagnostic coordinates and output sRGB colors. The active/page ordinal remains explicitly unresolved; no ordinal semantics were inferred.\n`
    + `- Changed only the diagnostic frame-128 table patch source fill from \`#fff8f8\` to the source-static panel fill \`#fff5f4\`.\n`
    + `- No full-frame or region image was introduced. Root/nested domains, one-indexed frames, color calibration, progress geometry, and the source-static path are unchanged.\n\n`
    + `## Fixed-registration, zero-mask RGB RMSE\n\n`
    + `Every RGB pixel is compared at fixed (0,0) registration. No translation search, resampling, clipping, exclusion rectangle, alpha mask, or spatial mask is applied. The source/candidate pairs remain tentative diagnostic anchors rather than source-playhead telemetry.\n\n`
    + `| Candidate | Source ordinal | Kind | Full | Body | Header | Footer | Full reduction | Footer reduction |\n`
    + `|---:|---:|---|---:|---:|---:|---:|---:|---:|\n${rows}\n\n`
    + `## Summary\n\n${summary}\n\n`
    + `- Per-frame non-regression: ${report.summary.nonRegressionFrames}/10 across full, body, header, and footer.\n`
    + `- Browser capture: clean\n`
    + `- Strict acceptance effect: **none**\n\n`
    + `## Unresolved acceptance gates\n\n`
    + `${report.unresolved.map((item) => `- ${item}`).join("\n")}\n`;
}

export async function buildG4L3Ts006ExactPidImplementationComparisonV14() {
  const [
    {bytes: analysisBytes, value: analysis},
    {bytes: sourceBytes, value: source},
    {bytes: previousReportBytes, value: previousReport},
    {bytes: previousImplementationBytes, value: previousImplementation},
    {bytes: entryStateBytes, value: entryState},
    {bytes: implementationBytes, value: implementation},
    {bytes: migrationBytes, value: migration},
    {
      bytes: currentJsCandidateBytes,
      value: currentJsCandidate,
    },
  ] = await Promise.all([
    readJson(SOURCE_ANALYSIS),
    readJson(SOURCE_MANIFEST),
    readJson(PREVIOUS_REPORT),
    readJson(PREVIOUS_IMPLEMENTATION_MANIFEST),
    readJson(DIAGNOSTIC_ENTRY_STATE),
    readJson(IMPLEMENTATION_MANIFEST),
    readJson(MIGRATION_MANIFEST),
    readJson(CURRENT_JS_CANDIDATE_REPORT),
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
    "v13 comparison report hash drifted",
  );
  invariant(
    sha256(previousImplementationBytes)
      === EXPECTED_PREVIOUS_IMPLEMENTATION_MANIFEST_SHA256,
    "v13 implementation capture manifest hash drifted",
  );
  invariant(
    sha256(entryStateBytes) === EXPECTED_ENTRY_STATE_SHA256,
    "v14 diagnostic entry-state hash drifted",
  );
  invariant(
    sha256(implementationBytes) === EXPECTED_IMPLEMENTATION_MANIFEST_SHA256,
    "v14 implementation capture manifest hash drifted",
  );
  invariant(
    implementation.entryStateSha256 === sha256(entryStateBytes),
    "v14 capture does not bind the diagnostic entry-state digest",
  );
  invariant(
    sha256(currentJsCandidateBytes)
      === EXPECTED_CURRENT_JS_CANDIDATE_REPORT_SHA256
      && currentJsCandidate?.reportType
        === "current-javascript-engineering-candidate"
      && currentJsCandidate.animationId === ANIMATION_ID
      && currentJsCandidate.outputs?.canvasManifest?.path
        === CURRENT_JS_ASSET_MANIFEST
      && currentJsCandidate.outputs.canvasManifest.sha256
        === EXPECTED_CURRENT_JS_ASSET_MANIFEST_SHA256,
    "pre-existing current-JavaScript manifest drift binding is invalid",
  );
  validateExactPidV14Inputs({
    analysis,
    source,
    previousReport,
    entryState,
    implementation,
  });
  const closureDelta = validateV14ImplementationClosureDelta({
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
    `v14 implementation closure is stale: ${closureFreshnessErrors.join("; ")}`,
  );
  assertFixedRegionContract(EXACT_PID_V10_REGIONS);

  const comparisons = [];
  const diffArtifacts = [];
  for (const pair of EXACT_PID_V10_KEYFRAME_PAIRS) {
    const sourceFrame = source.frames[pair.sourceCaptureOrdinal - 1];
    const implementationFrame = implementation.captured.find(
      (item) => item.frame === pair.candidateFrame,
    );
    const previousComparison = previousReport.comparisons.find(
      (item) =>
        item.candidateFrame === pair.candidateFrame
        && item.sourceCaptureOrdinal === pair.sourceCaptureOrdinal,
    );
    invariant(
      sourceFrame?.ordinal === pair.sourceCaptureOrdinal
        && implementationFrame
        && previousComparison,
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
    const v13Delta = Object.fromEntries(
      Object.keys(EXACT_PID_V10_REGIONS).map((regionId) => [
        regionId,
        improvement(
          previousComparison.rmse[regionId].normalizedRmse,
          rmse[regionId].normalizedRmse,
        ),
      ]),
    );
    const diff = makeFullFrameDiff(sourcePng, implementationPng);
    const diffFile =
      `${DIFF_DIRECTORY}/source-${String(pair.sourceCaptureOrdinal).padStart(6, "0")}`
      + `-implementation-${String(pair.candidateFrame).padStart(3, "0")}.png`;
    diffArtifacts.push({file: diffFile, bytes: diff.bytes});
    const informationalThreshold = pair.kind === "static" ? 0.05 : 0.08;
    comparisons.push({
      ...pair,
      progressWidthPixels: EXACT_PID_V14_PROGRESS_ANCHORS.find(
        (anchor) => anchor.candidateFrame === pair.candidateFrame,
      ).widthPixels,
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
      v13Delta,
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
  const v13Delta = {
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
    perFrame: comparisons.map((item) => ({
      candidateFrame: item.candidateFrame,
      sourceCaptureOrdinal: item.sourceCaptureOrdinal,
      ...item.v13Delta,
    })),
  };
  const allRegions = Object.keys(EXACT_PID_V10_REGIONS);
  const nonRegressionFrames = comparisons.filter(
    (item) => allRegions.every((regionId) => item.v13Delta[regionId].nonRegressed),
  ).length;
  invariant(
    nonRegressionFrames === comparisons.length
      && comparisons.every((item) => item.v13Delta.full.improved)
      && comparisons.every((item) => item.v13Delta.footer.improved)
      && comparisons.every((item) => item.v13Delta.body.improved)
      && comparisons.every((item) => !item.v13Delta.header.improved)
      && v13Delta.regions.full.improved
      && v13Delta.regions.body.improved
      && v13Delta.regions.footer.improved
      && v13Delta.regions.header.nonRegressed,
    "v14 must improve full/body/footer without any paired-frame region regression",
  );

  const scriptBytes = await readFile(SCRIPT_PATH);
  const report = {
    schemaVersion: 1,
    reportType: "g4-l3-ts006-exact-pid-implementation-comparison-v14",
    animationId: ANIMATION_ID,
    classification:
      "acceptance-neutral-source-supported-renderer-refinement-fixed-registration-zero-mask-diagnostic",
    boundedIncrement: {
      status: entryState.diagnosticCandidateIncrement.status,
      scope: entryState.diagnosticCandidateIncrement.scope,
      sourceBasis: entryState.diagnosticCandidateIncrement.sourceBasis,
      statusStrip: entryState.diagnosticCandidateIncrement.statusStrip,
      tablePatch: entryState.diagnosticCandidateIncrement.tablePatch,
      colorCalibrationChanged: false,
      progressGeometryChanged: false,
      implementationAssetsAdded: false,
      sourceStaticPathAffected: false,
      rootOrNestedFrameDomainChanged: false,
      oneBasedFrameContractChanged: false,
      prohibitedRasterSubstitution: {
        wholeFrameOrRegionAssetUsed: false,
      },
      implementationClosureDelta: closureDelta,
      originalRuntimeGeometryEstablished: false,
      visualParityEstablished: false,
      strictAcceptanceEffect: "none",
    },
    authority: {
      sourceCapture: "raw-unpromoted-exact-pid-runtime-diagnostic",
      sourceReplayMapping:
        "operator-selected-piecewise-tentative-not-trace-bound",
      implementation: "current-javascript-diagnostic-candidate",
      pageOrdinalMeaning: "unresolved",
      originalRuntimeAuthorityClaimed: false,
      authoritativeBaselineClaimed: false,
      sourcePlayheadMappingClaimed: false,
      pageOrdinalAuthorityClaimed: false,
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
      preExistingCurrentJavascriptCandidateReport: {
        path: CURRENT_JS_CANDIDATE_REPORT,
        bytes: currentJsCandidateBytes.length,
        sha256: sha256(currentJsCandidateBytes),
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
      frameRange: {firstFrame: 1, lastFrame: 128, oneBased: true},
      viewport: implementation.viewport,
      implementationArtifactClosure:
        implementation.implementationArtifactClosure,
    },
    comparisons,
    summary: {
      comparedFrames: comparisons.length,
      staticFrames: comparisons.filter((item) => item.kind === "static").length,
      transitionFrames:
        comparisons.filter((item) => item.kind === "transition").length,
      regions,
      nonRegressionFrames,
      allTenFramesNonRegressed: nonRegressionFrames === 10,
      informationalFullFrameThresholdPasses: comparisons.filter(
        (item) => item.informationalFullFrameThresholdPassed,
      ).length,
      fixedRegistrationVerified: true,
      zeroMaskVerified: true,
      implementationBrowserCaptureClean: true,
      strictAcceptanceEffect: "none",
    },
    v13Delta,
    unresolved: [
      "The exact-PID source package remains an acceptance-neutral diagnostic, not an authorized natural runtime trace or authoritative baseline.",
      "The source-ordinal to candidate-frame pairs remain tentative phase anchors, not source-playhead telemetry or trace-bound source-frame identity.",
      "The eight observed block colors and positions do not establish an active page ordinal, page-number mapping, or navigation semantics.",
      "Ten spot frames do not establish complete 128-frame coverage or transition timing parity.",
      "The sRGB gamma projection is an empirical diagnostic fit; no original-runtime color pipeline or display-transfer telemetry has been established.",
      "Static full-frame RMSE remains above 0.05 for frame 128, so this diagnostic cannot establish visual fidelity.",
      "Audio timing and listening review, an independent Spanish trace, independent human visual review, Owner acceptance, and strict completion remain open.",
    ],
    strictAcceptanceEffect: "none",
  };
  return {report, markdown: markdown(report), diffArtifacts};
}

export async function writeG4L3Ts006ExactPidImplementationComparisonV14({
  check = false,
} = {}) {
  const {
    report,
    markdown: markdownBytes,
    diffArtifacts,
  } = await buildG4L3Ts006ExactPidImplementationComparisonV14();
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
    assertExactV14DiffArtifactSet(
      entries.map((entry) => entry.name),
      report.comparisons.map(({fullFrameDiff}) => fullFrameDiff),
    );
    for (const artifact of diffArtifacts) {
      const existing = await readFile(projectPath(artifact.file));
      invariant(
        existing.equals(artifact.bytes),
        `${artifact.file} is stale`,
      );
    }
    return {status: "checked", report};
  }
  await removeStaleGeneratedDiffArtifacts(diffArtifacts);
  await Promise.all([
    atomicWrite(REPORT_JSON, jsonBytes),
    atomicWrite(REPORT_MARKDOWN, markdownBytes),
    ...diffArtifacts.map((artifact) =>
      atomicWrite(artifact.file, artifact.bytes)),
  ]);
  return {status: "written", report};
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
  writeG4L3Ts006ExactPidImplementationComparisonV14(
    parseArguments(process.argv.slice(2)),
  ).then(({status, report}) => {
    process.stdout.write(`${JSON.stringify({
      status,
      report: REPORT_JSON,
      summary: report.summary.regions,
      v13Delta: report.v13Delta.regions,
      allTenFramesNonRegressed:
        report.summary.allTenFramesNonRegressed,
      strictAcceptanceEffect: report.strictAcceptanceEffect,
    }, null, 2)}\n`);
  }).catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
