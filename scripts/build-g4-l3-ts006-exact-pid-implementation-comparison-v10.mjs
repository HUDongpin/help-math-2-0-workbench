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
const DIAGNOSTIC_ENTRY_STATE =
  "output/playwright/g4-l3-ts006-exact-pid-comparison-v10/diagnostic-entry-state.json";
const IMPLEMENTATION_DIRECTORY =
  "output/playwright/g4-l3-ts006-exact-pid-comparison-v10/en-diagnostic";
const IMPLEMENTATION_MANIFEST =
  `${IMPLEMENTATION_DIRECTORY}/capture-manifest.json`;
const DIFF_DIRECTORY =
  "output/playwright/g4-l3-ts006-exact-pid-comparison-v10/diffs";
const REPORT_JSON =
  "reports/g4-l3-ts006-exact-pid-implementation-comparison-v10.json";
const REPORT_MARKDOWN =
  "reports/g4-l3-ts006-exact-pid-implementation-comparison-v10.md";
const MIGRATION_MANIFEST =
  "migrations/course-g04-l03-ts-006/migration.json";
const DIFF_FILE_NAME_PATTERN =
  /^source-\d{6}-implementation-\d{3}\.png$/u;

const EXPECTED_SOURCE_ANALYSIS_SHA256 =
  "5513c4d9ebd3658575ebe98f1a934eb18766c7006551d3cf6d52503175a9e0cf";
const EXPECTED_SOURCE_MANIFEST_SHA256 =
  "2e2154fd5af712a388fead07e91303c017167152ca1aa7db9f96a31ce6e3c313";
const EXPECTED_ENTRY_STATE_SHA256 =
  "77d2066a534b7902e295549fb4c0062e72fe3cefa4c588b656a684c93e111975";

export const EXACT_PID_V10_KEYFRAME_PAIRS = Object.freeze([
  Object.freeze({
    candidateFrame: 1,
    sourceCaptureOrdinal: 18,
    phase: "reset-like-plateau-first-stable-frame",
    kind: "static",
  }),
  Object.freeze({
    candidateFrame: 8,
    sourceCaptureOrdinal: 31,
    phase: "check-your-work-first-reveal",
    kind: "transition",
  }),
  Object.freeze({
    candidateFrame: 13,
    sourceCaptureOrdinal: 38,
    phase: "check-your-work-reveal-end",
    kind: "transition",
  }),
  Object.freeze({
    candidateFrame: 55,
    sourceCaptureOrdinal: 120,
    phase: "strategies-heading-first-reveal",
    kind: "transition",
  }),
  Object.freeze({
    candidateFrame: 58,
    sourceCaptureOrdinal: 125,
    phase: "strategies-heading-reveal-end",
    kind: "transition",
  }),
  Object.freeze({
    candidateFrame: 74,
    sourceCaptureOrdinal: 156,
    phase: "strategy-list-first-reveal",
    kind: "transition",
  }),
  Object.freeze({
    candidateFrame: 77,
    sourceCaptureOrdinal: 161,
    phase: "strategy-list-reveal-end",
    kind: "transition",
  }),
  Object.freeze({
    candidateFrame: 125,
    sourceCaptureOrdinal: 253,
    phase: "show-your-work-first-reveal",
    kind: "transition",
  }),
  Object.freeze({
    candidateFrame: 127,
    sourceCaptureOrdinal: 261,
    phase: "show-your-work-reveal-settle",
    kind: "transition",
  }),
  Object.freeze({
    candidateFrame: 128,
    sourceCaptureOrdinal: 262,
    phase: "terminal-like-suffix-entry",
    kind: "static",
  }),
]);

export const EXACT_PID_V10_REGIONS = Object.freeze({
  full: Object.freeze({x: 0, y: 0, width: 800, height: 600}),
  header: Object.freeze({x: 0, y: 0, width: 800, height: 108}),
  body: Object.freeze({x: 0, y: 108, width: 800, height: 416}),
  footer: Object.freeze({x: 0, y: 524, width: 800, height: 76}),
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
    const metadata = await lstat(component);
    invariant(
      !metadata.isSymbolicLink(),
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

function portable(value) {
  return value.split(path.sep).join("/");
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function round(value) {
  return Number(value.toFixed(12));
}

async function readJson(relativePath) {
  const bytes = await readFile(projectPath(relativePath));
  return {bytes, value: JSON.parse(bytes.toString("utf8"))};
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

export function assertFixedRegionContract(regions = EXACT_PID_V10_REGIONS) {
  invariant(
    JSON.stringify(regions.full) === JSON.stringify({
      x: 0,
      y: 0,
      width: 800,
      height: 600,
    }),
    "full region must retain the complete native stage",
  );
  const strips = ["header", "body", "footer"].map((id) => regions[id]);
  invariant(
    strips.every(
      (region) =>
        region.x === 0
        && region.width === 800
        && Number.isInteger(region.y)
        && Number.isInteger(region.height)
        && region.height > 0,
    ),
    "header/body/footer must be fixed full-width integer rectangles",
  );
  invariant(
    strips[0].y === 0
      && strips[0].y + strips[0].height === strips[1].y
      && strips[1].y + strips[1].height === strips[2].y
      && strips[2].y + strips[2].height === 600,
    "header/body/footer must partition all 800x600 pixels without gaps or overlap",
  );
  invariant(
    strips.reduce((sum, region) => sum + region.width * region.height, 0)
      === 800 * 600,
    "header/body/footer must retain every native-stage pixel exactly once",
  );
  return true;
}

export function validateExactPidV10Inputs({
  analysis,
  source,
  entryState,
  implementation,
}) {
  invariant(
    analysis?.reportType
      === "g4-l3-ts006-exact-pid-replay-complete-diagnostic-v10"
      && analysis.animationId === ANIMATION_ID
      && analysis.status
        === "verified-acceptance-neutral-diagnostic-not-promotion-eligible"
      && analysis.strictAcceptanceEffect === "none",
    "v10 source analysis status or identity drifted",
  );
  invariant(
    allBooleanValuesFalse(analysis.authority),
    "v10 source analysis authority must remain entirely false",
  );
  invariant(
    analysis.primaryCapture?.frames?.count === 537
      && analysis.primaryCapture.frames.completeFrameCount === 537
      && analysis.primaryCapture.frames.width === 800
      && analysis.primaryCapture.frames.height === 600
      && analysis.primaryCapture.frames.droppedOrIncompleteFrameCount === 0,
    "v10 source analysis must bind 537 complete native frames",
  );
  invariant(
    analysis.primaryCapture?.horizontalRegistration
      ?.noHorizontalRegistrationDriftDetected === true
      && JSON.stringify(
        analysis.primaryCapture.horizontalRegistration
          .detectedLeftStageOffsetsPixels,
      ) === "[0]",
    "v10 source analysis must establish a stable zero-pixel diagnostic registration",
  );
  invariant(
    analysis.replayDiagnostic?.observedRevealAnimation?.firstOrdinal === 31
      && analysis.replayDiagnostic.observedRevealAnimation.lastOrdinal === 261
      && analysis.replayDiagnostic.terminalLikeSuffix?.firstOrdinal === 262
      && analysis.replayDiagnostic.sourcePlayheadMappingEstablished === false,
    "v10 visual segmentation or mapping boundary drifted",
  );

  invariant(
    source?.status === "raw-capture-not-yet-bound-to-runtime-trace"
      && source.runtimeAuthorityClaimed === false
      && source.acceptanceEffect === "none"
      && source.evidenceType
        === "g4-l3-lossless-window-frame-and-system-audio-capture",
    "source capture must remain raw, non-authoritative, and acceptance-neutral",
  );
  invariant(
    source.configuration?.cursor === "excluded"
      && source.configuration?.sourceKind === "waited-first-window-exact-pid"
      && source.configuration?.resolvedDisplaySourceRect
        === "0.0,58.0,800.0,600.0"
      && source.configuration?.outputWidth === "800"
      && source.configuration?.outputHeight === "600"
      && source.configuration?.fps === "12"
      && source.display?.includedProcessID === 97581,
    "source capture exact-PID, crop, or native geometry drifted",
  );
  invariant(
    source.droppedOrIncompleteFrameCount === 0
      && Array.isArray(source.frames)
      && source.frames.length === 537
      && source.frames.every(
        (frame, index) =>
          frame.ordinal === index + 1
          && frame.status === "complete"
          && frame.width === 800
          && frame.height === 600
          && /^[a-f0-9]{64}$/u.test(frame.sha256),
      ),
    "source capture frame inventory is incomplete or malformed",
  );

  invariant(
    entryState?.stateId
      === "course-g04-l03-ts-006-exact-pid-v10-tentative-piecewise-capture-context"
      && entryState.animationId === ANIMATION_ID
      && entryState.classification
        === "acceptance-neutral-diagnostic-entry-context-not-original-runtime-entry-state"
      && entryState.mapping?.method
        === "operator-selected-piecewise-diagnostic-anchors"
      && entryState.mapping?.status
        === "tentative-not-trace-bound-not-source-playhead-authority"
      && entryState.mapping?.interpolationAuthorized === false
      && entryState.strictAcceptanceEffect === "none",
    "diagnostic entry-state classification or mapping boundary drifted",
  );
  invariant(
    allBooleanValuesFalse(entryState.authority),
    "diagnostic entry-state authority must remain entirely false",
  );
  invariant(
    JSON.stringify(projectedAnchors(entryState.mapping.anchors))
      === JSON.stringify(projectedAnchors(EXACT_PID_V10_KEYFRAME_PAIRS)),
    "diagnostic piecewise anchors drifted",
  );

  invariant(
    implementation?.schemaVersion === IMPLEMENTATION_CAPTURE_SCHEMA_VERSION
      && implementation.status === "complete"
      && implementation.animationId === ANIMATION_ID
      && isUnambiguousLoopbackHttpUrl(implementation.sourceUrl)
      && implementation.frameDomainId === "sprite-23"
      && implementation.requirementId === "diagnostic:ts006:exact-pid-v10:en"
      && implementation.traceId
        === "diagnostic:exact-pid-v10:tentative-piecewise:en:seed-0"
      && implementation.scenario === "manual-runtime-diagnostic-observation"
      && implementation.language === "en"
      && implementation.seed === "0"
      && implementation.entryStateSha256 === EXPECTED_ENTRY_STATE_SHA256,
    "implementation diagnostic capture identity drifted",
  );
  const generatorProvenanceErrors =
    implementationCaptureGeneratorProvenanceErrors(
      implementation.generatorProvenance,
    );
  invariant(
    generatorProvenanceErrors.length === 0,
    `implementation generator provenance is invalid: ${generatorProvenanceErrors.join("; ")}`,
  );
  const artifactClosureErrors = implementationArtifactClosureErrors(
    implementation.implementationArtifactClosure,
  );
  invariant(
    artifactClosureErrors.length === 0,
    `implementation artifact closure is invalid: ${artifactClosureErrors.join("; ")}`,
  );
  invariant(
    implementation.viewport?.width === 800
      && implementation.viewport?.height === 600
      && implementation.viewport?.deviceScaleFactor === 1,
    "implementation capture must be native 800x600 at device scale 1",
  );
  invariant(
    Array.isArray(implementation.captured)
      && implementation.captured.length === EXACT_PID_V10_KEYFRAME_PAIRS.length,
    "implementation capture must contain ten diagnostic keyframes",
  );
  invariant(
    implementation.captured.every((frame, index) => {
      const expected = EXACT_PID_V10_KEYFRAME_PAIRS[index].candidateFrame;
      const frameUrl = isUnambiguousLoopbackHttpUrl(frame.url)
        ? new URL(frame.url)
        : null;
      return frame.frame === expected
        && frame.reportedFrame === expected
        && frame.reportedAnimationId === ANIMATION_ID
        && frame.frameDomainId === "sprite-23"
        && frame.rootFrame === 6
        && frame.requirementId === implementation.requirementId
        && frame.traceId === implementation.traceId
        && frame.entryStateSha256 === implementation.entryStateSha256
        && frame.scenario === implementation.scenario
        && frame.language === implementation.language
        && frame.seed === implementation.seed
        && frame.width === 800
        && frame.height === 600
        && frame.reportedRenderState === "ready"
        && frame.visualTarget?.reportedRenderState === "ready"
        && frame.flashContextIdentityComplete === true
        && frame.file
          === `frame-${String(expected).padStart(3, "0")}.png`
        && frameUrl?.searchParams.get("frame") === String(expected)
        && frameUrl.searchParams.get("frameDomain") === "sprite-23"
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
        && frame.visualTarget?.frameDomainId === "sprite-23"
        && frame.visualTarget?.rootFrame === 6
        && frame.visualTarget?.requirementId === implementation.requirementId
        && frame.visualTarget?.traceId === implementation.traceId
        && frame.visualTarget?.entryStateSha256
          === implementation.entryStateSha256
        && frame.visualTarget?.scenario === implementation.scenario
        && frame.visualTarget?.language === implementation.language
        && frame.visualTarget?.seed === implementation.seed
        && frame.visualTarget?.flashContextIdentityComplete === true
        && /^[a-f0-9]{64}$/u.test(frame.sha256);
    }),
    "implementation keyframes or rendered capture identity are incomplete",
  );
  invariant(
    (implementation.consoleErrors ?? []).length === 0
      && (implementation.failedRequests ?? []).length === 0
      && (implementation.httpErrors ?? []).length === 0
      && (implementation.unexpectedRequests ?? []).length === 0,
    "implementation capture contains browser or network errors",
  );
  invariant(
    source.frames.every(
      (frame) =>
        frame.file
          === `frames/frame-${String(frame.ordinal).padStart(6, "0")}.png`,
    ),
    "source capture frame paths are not canonical and contained",
  );
  return assertFixedRegionContract();
}

export function compareRgbRegionFixed(source, implementation, region) {
  invariant(
    source.width === implementation.width
      && source.height === implementation.height,
    "fixed comparison requires identical image geometry",
  );
  invariant(
    region.x >= 0
      && region.y >= 0
      && region.width > 0
      && region.height > 0
      && region.x + region.width <= source.width
      && region.y + region.height <= source.height,
    "fixed comparison region escapes image bounds",
  );
  let squaredError = 0;
  let mismatchedPixels = 0;
  for (let y = region.y; y < region.y + region.height; y += 1) {
    for (let x = region.x; x < region.x + region.width; x += 1) {
      const index = (y * source.width + x) * 4;
      let pixelMismatch = false;
      for (let channel = 0; channel < 3; channel += 1) {
        const delta = source.data[index + channel]
          - implementation.data[index + channel];
        squaredError += delta * delta;
        if (delta !== 0) pixelMismatch = true;
      }
      if (pixelMismatch) mismatchedPixels += 1;
    }
  }
  const comparedPixels = region.width * region.height;
  return {
    normalizedRmse: round(
      Math.sqrt(squaredError / (comparedPixels * 3)) / 255,
    ),
    comparedPixels,
    mismatchedPixels,
    mismatchedPixelRatio: round(mismatchedPixels / comparedPixels),
    sourceRect: {...region},
    implementationRect: {...region},
    registrationOffset: {x: 0, y: 0},
    excludedPixelCount: 0,
  };
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

async function validateImplementationProvenancePhysical(implementation) {
  const provenance = implementation.generatorProvenance;
  invariant(
    provenance.script.path === "scripts/capture-animation-keyframes.mjs",
    "implementation capture generator script path drifted",
  );
  const [scriptBytes, packageBytes] = await Promise.all([
    readFile(projectPath(provenance.script.path)),
    readFile(projectPath(provenance.playwright.packageJsonPath)),
  ]);
  invariant(
    sha256(scriptBytes) === provenance.script.sha256,
    "implementation capture generator script hash drifted",
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

async function atomicWrite(relativePath, bytes) {
  const target = projectPath(relativePath);
  await mkdir(path.dirname(target), {recursive: true});
  const temporary =
    `${target}.tmp-${process.pid}-${randomUUID()}`;
  try {
    await writeFile(temporary, bytes, {flag: "wx"});
    await rename(temporary, target);
  } finally {
    await rm(temporary, {force: true});
  }
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

export function assertExactDiffArtifactSet(actualNames, diffArtifacts) {
  const expectedNames = expectedDiffFileNames(diffArtifacts);
  const sortedActualNames = [...actualNames].sort();
  invariant(
    JSON.stringify(sortedActualNames) === JSON.stringify(expectedNames),
    `${DIFF_DIRECTORY} contains stale, missing, or unexpected artifacts`,
  );
  return true;
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
    + `${item.rmse.footer.normalizedRmse.toFixed(6)} |`,
  ).join("\n");
  const anchors = report.mapping.anchors.map((item) =>
    `| ${item.candidateFrame} | ${item.sourceCaptureOrdinal} | ${item.phase} | ${item.kind} |`,
  ).join("\n");
  const summary = Object.entries(report.summary.regions).map(
    ([id, value]) =>
      `- ${id}: mean ${value.mean.toFixed(6)}; max ${value.max.toFixed(6)} `
      + `(candidate frame ${value.worstCandidateFrame}, source ordinal `
      + `${value.worstSourceCaptureOrdinal})`,
  ).join("\n");
  return `# G4 L3 TS006 exact-PID implementation comparison v10\n\n`
    + `Status: **acceptance-neutral fixed-registration diagnostic; not a baseline, authority claim, fidelity acceptance, strict completion, or release evidence**.\n\n`
    + `## Mapping boundary\n\n`
    + `The following ten one-based pairs are operator-selected piecewise diagnostic anchors. They are tentative and are not source-playhead telemetry or a trace-bound source-frame mapping.\n\n`
    + `| Candidate frame | Source capture ordinal | Diagnostic phase | Kind |\n`
    + `|---:|---:|---|---|\n${anchors}\n\n`
    + `The implementation \`entryStateSha256\` is the SHA-256 of a checked-in diagnostic context record. It is explicitly not an observed or authoritative original-runtime entry state.\n\n`
    + `## Fixed-coordinate RMSE\n\n`
    + `Every metric compares the same fixed x/y RGB pixels. Registration offset is always (0,0); there is no translation search, alignment optimization, resampling, clipping, exclusion rectangle, or pixel mask. Header, body, and footer partition all 800x600 pixels.\n\n`
    + `| Candidate frame | Source ordinal | Kind | Full | Body | Header | Footer |\n`
    + `|---:|---:|---|---:|---:|---:|---:|\n${rows}\n\n`
    + `## Summary\n\n${summary}\n\n`
    + `- Browser capture: ${report.summary.implementationBrowserCaptureClean ? "clean" : "not clean"}\n`
    + `- Fixed registration: ${report.summary.fixedRegistrationVerified ? "verified at (0,0)" : "not verified"}\n`
    + `- Pixel masks: none\n`
    + `- Strict acceptance effect: **none**\n\n`
    + `## Boundary\n\n${report.unresolved.map((item) => `- ${item}`).join("\n")}\n`;
}

export async function buildG4L3Ts006ExactPidImplementationComparisonV10() {
  const [
    {bytes: analysisBytes, value: analysis},
    {bytes: sourceManifestBytes, value: source},
    {bytes: entryStateBytes, value: entryState},
    {bytes: implementationManifestBytes, value: implementation},
    {bytes: migrationManifestBytes, value: migrationManifest},
  ] = await Promise.all([
    readJson(SOURCE_ANALYSIS),
    readJson(SOURCE_MANIFEST),
    readJson(DIAGNOSTIC_ENTRY_STATE),
    readJson(IMPLEMENTATION_MANIFEST),
    readJson(MIGRATION_MANIFEST),
  ]);
  invariant(
    sha256(analysisBytes) === EXPECTED_SOURCE_ANALYSIS_SHA256,
    "v10 source analysis hash drifted",
  );
  invariant(
    sha256(sourceManifestBytes) === EXPECTED_SOURCE_MANIFEST_SHA256,
    "v10 source capture manifest hash drifted",
  );
  invariant(
    sha256(entryStateBytes) === EXPECTED_ENTRY_STATE_SHA256,
    "diagnostic entry-state context hash drifted",
  );
  invariant(
    implementation.entryStateSha256 === sha256(entryStateBytes),
    "implementation entryStateSha256 is not the diagnostic context digest",
  );
  validateExactPidV10Inputs({analysis, source, entryState, implementation});
  await validateImplementationProvenancePhysical(implementation);
  invariant(
    migrationManifest.animationId === ANIMATION_ID,
    "TS006 migration manifest identity drifted",
  );
  const currentArtifactClosure = await collectImplementationArtifactClosure({
    projectRoot: ROOT,
    workspace: projectPath("migrations/course-g04-l03-ts-006"),
    manifest: migrationManifest,
  });
  const artifactClosureFreshnessErrors = implementationArtifactClosureErrors(
    implementation.implementationArtifactClosure,
    currentArtifactClosure,
  );
  invariant(
    artifactClosureFreshnessErrors.length === 0,
    `implementation artifact closure is stale: ${artifactClosureFreshnessErrors.join("; ")}`,
  );

  const comparisons = [];
  const diffArtifacts = [];
  for (const pair of EXACT_PID_V10_KEYFRAME_PAIRS) {
    const sourceFrame = source.frames[pair.sourceCaptureOrdinal - 1];
    const implementationFrame = implementation.captured.find(
      (item) => item.frame === pair.candidateFrame,
    );
    invariant(
      sourceFrame?.ordinal === pair.sourceCaptureOrdinal,
      "source frame lookup drifted",
    );
    invariant(implementationFrame, "implementation frame lookup drifted");
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
    const diffFile =
      `${DIFF_DIRECTORY}/source-${String(pair.sourceCaptureOrdinal).padStart(6, "0")}`
      + `-implementation-${String(pair.candidateFrame).padStart(3, "0")}.png`;
    diffArtifacts.push({file: diffFile, bytes: diff.bytes});
    const informationalThreshold = pair.kind === "static" ? 0.05 : 0.08;
    comparisons.push({
      ...pair,
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

  const regionSummary = Object.fromEntries(
    Object.keys(EXACT_PID_V10_REGIONS).map((regionId) => [
      regionId,
      summarize(comparisons, regionId),
    ]),
  );
  const report = {
    schemaVersion: 1,
    reportType: "g4-l3-ts006-exact-pid-implementation-comparison-v10",
    animationId: ANIMATION_ID,
    classification:
      "acceptance-neutral-fixed-registration-zero-mask-diagnostic",
    authority: {
      sourceCapture: "raw-unpromoted-exact-pid-runtime-diagnostic",
      sourceReplayMapping:
        "operator-selected-piecewise-tentative-not-trace-bound",
      implementation: "current-javascript-diagnostic-candidate",
      entryState:
        "sha256-bound-diagnostic-context-not-original-runtime-entry-state",
      originalRuntimeAuthorityClaimed: false,
      authoritativeBaselineClaimed: false,
      sourcePlayheadMappingClaimed: false,
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
      interpolationApplied: false,
      anchors: projectedAnchors(EXACT_PID_V10_KEYFRAME_PAIRS),
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
        sourceV10DistinctLeftOffsetsPixels:
          analysis.primaryCapture.horizontalRegistration
            .detectedLeftStageOffsetsPixels,
      },
      masking: {
        spatialPixelMaskApplied: false,
        alphaUsedAsSpatialMask: false,
        excludedRectangles: [],
        everyRegionPixelRetained: true,
        note:
          "Alpha is not used to exclude pixels; standard normalized RGB RMSE includes every x/y pixel in each declared rectangle.",
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
        bytes: sourceManifestBytes.length,
        sha256: sha256(sourceManifestBytes),
      },
      diagnosticEntryState: {
        path: DIAGNOSTIC_ENTRY_STATE,
        bytes: entryStateBytes.length,
        sha256: sha256(entryStateBytes),
      },
      implementationCaptureManifest: {
        path: IMPLEMENTATION_MANIFEST,
        bytes: implementationManifestBytes.length,
        sha256: sha256(implementationManifestBytes),
      },
      migrationManifestForClosure: {
        path: MIGRATION_MANIFEST,
        bytes: migrationManifestBytes.length,
        sha256: sha256(migrationManifestBytes),
      },
      generator: {
        path: portable(path.relative(ROOT, SCRIPT_PATH)),
        bytes: (await readFile(SCRIPT_PATH)).length,
        sha256: sha256(await readFile(SCRIPT_PATH)),
      },
    },
    comparisons,
    summary: {
      comparedFrames: comparisons.length,
      staticFrames: comparisons.filter((item) => item.kind === "static").length,
      transitionFrames:
        comparisons.filter((item) => item.kind === "transition").length,
      regions: regionSummary,
      informationalFullFrameThresholdPasses: comparisons.filter(
        (item) => item.informationalFullFrameThresholdPassed,
      ).length,
      fixedRegistrationVerified: comparisons.every(
        (item) =>
          item.registrationOffset.x === 0
          && item.registrationOffset.y === 0,
      ),
      zeroMaskVerified: comparisons.every(
        (item) =>
          item.pixelMaskApplied === false
          && item.excludedPixelCount === 0,
      ),
      implementationBrowserCaptureClean: true,
      strictAcceptanceEffect: "none",
    },
    unresolved: [
      "The exact-PID source package is still an acceptance-neutral diagnostic and not an authorized natural runtime trace.",
      "The ten source-ordinal to candidate-frame pairs are tentative piecewise phase anchors, not source-playhead telemetry or authoritative frame identity.",
      "The diagnostic entry-state digest binds a candidate context file; it is not an observed or authoritative original-runtime entry state.",
      "Ten spot frames do not establish complete 128-frame coverage or transition timing parity.",
      "No accepted audio timing or listening review, independent Spanish trace, independent human visual review, Owner acceptance, or strict completion is attached.",
    ],
    strictAcceptanceEffect: "none",
  };
  return {report, markdown: markdown(report), diffArtifacts};
}

export async function writeG4L3Ts006ExactPidImplementationComparisonV10({
  check = false,
} = {}) {
  const {
    report,
    markdown: markdownBytes,
    diffArtifacts,
  } = await buildG4L3Ts006ExactPidImplementationComparisonV10();
  const jsonBytes = `${JSON.stringify(report, null, 2)}\n`;
  if (check) {
    const [existingJson, existingMarkdown, diffDirectoryEntries] =
      await Promise.all([
      readFile(projectPath(REPORT_JSON), "utf8"),
      readFile(projectPath(REPORT_MARKDOWN), "utf8"),
      readDiffDirectoryEntries(),
    ]);
    invariant(existingJson === jsonBytes, `${REPORT_JSON} is stale`);
    invariant(existingMarkdown === markdownBytes, `${REPORT_MARKDOWN} is stale`);
    invariant(
      diffDirectoryEntries.every(
        (entry) => entry.isFile() && !entry.isSymbolicLink(),
      ),
      `${DIFF_DIRECTORY} must contain only regular files`,
    );
    assertExactDiffArtifactSet(
      diffDirectoryEntries.map((entry) => entry.name),
      diffArtifacts,
    );
    for (const artifact of diffArtifacts) {
      const existing = await readFile(projectPath(artifact.file));
      invariant(
        existing.equals(artifact.bytes),
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
  writeG4L3Ts006ExactPidImplementationComparisonV10(
    parseArguments(process.argv.slice(2)),
  )
    .then((report) => {
      console.log(JSON.stringify(report.summary, null, 2));
    })
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}
