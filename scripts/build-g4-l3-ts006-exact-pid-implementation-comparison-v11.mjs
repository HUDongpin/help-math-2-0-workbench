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
  "reports/g4-l3-ts006-exact-pid-implementation-comparison-v10.json";
const PREVIOUS_IMPLEMENTATION_MANIFEST =
  "output/playwright/g4-l3-ts006-exact-pid-comparison-v10/en-diagnostic/capture-manifest.json";
const DIAGNOSTIC_ENTRY_STATE =
  "output/playwright/g4-l3-ts006-exact-pid-comparison-v11/diagnostic-entry-state.json";
const IMPLEMENTATION_DIRECTORY =
  "output/playwright/g4-l3-ts006-exact-pid-comparison-v11/en-diagnostic";
const IMPLEMENTATION_MANIFEST =
  `${IMPLEMENTATION_DIRECTORY}/capture-manifest.json`;
const DIFF_DIRECTORY =
  "output/playwright/g4-l3-ts006-exact-pid-comparison-v11/diffs";
const REPORT_JSON =
  "reports/g4-l3-ts006-exact-pid-implementation-comparison-v11.json";
const REPORT_MARKDOWN =
  "reports/g4-l3-ts006-exact-pid-implementation-comparison-v11.md";
const MIGRATION_MANIFEST =
  "migrations/course-g04-l03-ts-006/migration.json";
const DIFF_FILE_NAME_PATTERN =
  /^source-\d{6}-implementation-\d{3}\.png$/u;

const EXPECTED_SOURCE_ANALYSIS_SHA256 =
  "5513c4d9ebd3658575ebe98f1a934eb18766c7006551d3cf6d52503175a9e0cf";
const EXPECTED_SOURCE_MANIFEST_SHA256 =
  "2e2154fd5af712a388fead07e91303c017167152ca1aa7db9f96a31ce6e3c313";
const EXPECTED_PREVIOUS_REPORT_SHA256 =
  "8cb4567f37ca32efa86a3c4aa783876d06ce19c42d9938efb1397f924d54aeda";
const EXPECTED_PREVIOUS_IMPLEMENTATION_MANIFEST_SHA256 =
  "bcd18effd6710a0ff44944f4e2a25e943fa513350e1a02c1896b1acdf11d9d53";
const EXPECTED_ENTRY_STATE_SHA256 =
  "b7cb86800065850fe4e64fab1b8d372d3017b5aa067dc76aa08a78a29c64db03";
const EXPECTED_IMPLEMENTATION_MANIFEST_SHA256 =
  "63a4877e7514dace52340a92fb64cc0098a143d4326c2af5130693a4c04a9cf5";
const THUMB_MANIFEST =
  "public/flash-assets/courses/shell-course-g04-l03-index-local/sprite-112/manifest.json";
const THUMB_IMAGE =
  "public/flash-assets/courses/shell-course-g04-l03-index-local/sprite-112/visual-001-0b930c4cdd4b.png";
const EXPECTED_THUMB_MANIFEST_SHA256 =
  "2054628efcb661111b19fb68a84f59a69f745063c623279ac14b24b979690442";
const EXPECTED_THUMB_IMAGE_SHA256 =
  "0b930c4cdd4b0d5e99e8ef8b86cb7b1ff60bddabb324d3e9ea20bfd4286bfa34";

export const EXACT_PID_V11_PROGRESS_ANCHORS = Object.freeze([
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

export function validateExactPidV11Inputs({
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
      === "g4-l3-ts006-exact-pid-implementation-comparison-v10"
      && previousReport.animationId === ANIMATION_ID
      && previousReport.classification
        === "acceptance-neutral-fixed-registration-zero-mask-diagnostic"
      && previousReport.strictAcceptanceEffect === "none"
      && previousReport.summary?.comparedFrames === 10
      && previousReport.summary?.fixedRegistrationVerified === true
      && previousReport.summary?.zeroMaskVerified === true,
    "v10 comparison report identity or boundary drifted",
  );
  invariant(
    entryState?.stateId
      === "course-g04-l03-ts-006-exact-pid-v11-footer-convergence-context"
      && entryState.animationId === ANIMATION_ID
      && entryState.classification
        === "acceptance-neutral-diagnostic-entry-context-not-original-runtime-entry-state"
      && entryState.mapping?.method
        === "operator-selected-piecewise-diagnostic-anchors"
      && entryState.mapping?.status
        === "tentative-not-trace-bound-not-source-playhead-authority"
      && entryState.mapping?.interpolationAuthorized === false
      && JSON.stringify(projectedAnchors(entryState.mapping.anchors))
        === JSON.stringify(projectedAnchors(EXACT_PID_V10_KEYFRAME_PAIRS))
      && allBooleanValuesFalse(entryState.authority)
      && entryState.strictAcceptanceEffect === "none",
    "v11 diagnostic entry-state identity, anchors, or authority drifted",
  );
  const increment = entryState.diagnosticCandidateIncrement;
  invariant(
    increment?.status
      === "acceptance-neutral-footer-convergence-not-authoritative"
      && increment.spanishPageAudioGeometryAdjustmentPixels?.x === -4
      && increment.spanishPageAudioGeometryAdjustmentPixels?.y === -3
      && increment.terminalLikePlaybackVisual === "pause"
      && increment.progress?.mapping
        === "piecewise-interpolation-between-diagnostic-anchors"
      && increment.progress?.fillColor === "#28A4FF"
      && increment.progress?.sourceStructuralThumb?.path === THUMB_IMAGE
      && increment.progress.sourceStructuralThumb.sha256
        === EXPECTED_THUMB_IMAGE_SHA256
      && JSON.stringify(increment.progress.anchors)
        === JSON.stringify(EXACT_PID_V11_PROGRESS_ANCHORS)
      && increment.wholeFrameOrFooterStripAssetUsed === false
      && increment.strictAcceptanceEffect === "none",
    "v11 bounded footer-convergence increment drifted",
  );
  invariant(
    implementation?.schemaVersion === IMPLEMENTATION_CAPTURE_SCHEMA_VERSION
      && implementation.status === "complete"
      && implementation.animationId === ANIMATION_ID
      && isUnambiguousLoopbackHttpUrl(implementation.sourceUrl)
      && implementation.frameDomainId === "sprite-23"
      && implementation.requirementId === "diagnostic:ts006:exact-pid-v11:en"
      && implementation.traceId
        === "diagnostic:exact-pid-v11:tentative-piecewise:en:seed-0"
      && implementation.entryStateSha256 === EXPECTED_ENTRY_STATE_SHA256
      && implementation.scenario === "manual-runtime-diagnostic-observation"
      && implementation.language === "en"
      && implementation.seed === "0"
      && implementation.viewport?.width === 800
      && implementation.viewport?.height === 600
      && implementation.viewport?.deviceScaleFactor === 1,
    "v11 implementation capture identity drifted",
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
    "v11 implementation frames or rendered capture identities are incomplete",
  );
  invariant(
    (implementation.consoleErrors ?? []).length === 0
      && (implementation.failedRequests ?? []).length === 0
      && (implementation.httpErrors ?? []).length === 0
      && (implementation.unexpectedRequests ?? []).length === 0,
    "v11 implementation capture contains browser or network errors",
  );
  return assertFixedRegionContract(EXACT_PID_V10_REGIONS);
}

function closureArtifactMap(manifest) {
  return new Map(
    manifest.implementationArtifactClosure.artifacts.map((artifact) => [
      artifact.path,
      artifact,
    ]),
  );
}

export function validateV11ImplementationClosureDelta({
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
    JSON.stringify(added) === JSON.stringify([THUMB_MANIFEST, THUMB_IMAGE]),
    "v11 closure must add only the source-structural thumb manifest and image",
  );
  invariant(removed.length === 0, "v11 closure must not remove implementation assets");
  invariant(
    JSON.stringify(changed) === JSON.stringify([
      "packages/demos/src/modules/course-g04-l03-ts-006.tsx",
      "packages/demos/src/timelines/course-g04-l03-ts-006.ts",
    ]),
    "v11 closure must change only the TS006 renderer and pure timeline",
  );
  invariant(
    current.get(THUMB_MANIFEST)?.sha256 === EXPECTED_THUMB_MANIFEST_SHA256
      && current.get(THUMB_IMAGE)?.sha256 === EXPECTED_THUMB_IMAGE_SHA256,
    "v11 source-structural thumb hashes drifted",
  );
  invariant(
    added.every(
      (item) =>
        !item.includes("full-frame")
        && !item.includes("footer-strip")
        && !item.startsWith("output/")
        && !item.startsWith("artifacts/"),
    ),
    "v11 closure introduced a prohibited full-frame or footer-strip asset",
  );
  return {added, removed, changed};
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

export function assertExactV11DiffArtifactSet(actualNames, diffArtifacts) {
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
      + `v10-to-v11 mean reduction `
      + `${report.v10Delta.regions[id].absoluteReduction.toFixed(6)} `
      + `(${report.v10Delta.regions[id].relativeReductionPercent.toFixed(2)}%)`,
  ).join("\n");
  return `# G4 L3 TS006 exact-PID implementation comparison v11\n\n`
    + `Status: **acceptance-neutral footer-convergence diagnostic; not an authoritative baseline, fidelity acceptance, strict completion, or release evidence**.\n\n`
    + `## Bounded candidate increment\n\n`
    + `- Spanish page-audio control moved left 4 px and up 3 px.\n`
    + `- Terminal-like candidate frame 128 keeps the pause visual.\n`
    + `- The progress fill uses \`#28A4FF\` and the hash-bound source-structural sprite-112 thumb.\n`
    + `- No full-frame or footer-strip implementation image was introduced.\n\n`
    + `## Fixed-coordinate RMSE\n\n`
    + `All RGB pixels remain included at fixed (0,0) registration. There is no translation search, resampling, clipping, exclusion rectangle, or pixel mask. The source/candidate frame pairs remain tentative diagnostic anchors, not source-playhead telemetry.\n\n`
    + `| Candidate | Source ordinal | Progress px | Kind | Full | Body | Header | Footer |\n`
    + `|---:|---:|---:|---|---:|---:|---:|---:|\n${rows}\n\n`
    + `## Summary\n\n${summary}\n\n`
    + `- Informational full-frame threshold passes: ${report.summary.informationalFullFrameThresholdPasses}/10\n`
    + `- Browser capture: clean\n`
    + `- Strict acceptance effect: **none**\n\n`
    + `## Unresolved acceptance gates\n\n`
    + `${report.unresolved.map((item) => `- ${item}`).join("\n")}\n`;
}

export async function buildG4L3Ts006ExactPidImplementationComparisonV11() {
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
  ] = await Promise.all([
    readJson(SOURCE_ANALYSIS),
    readJson(SOURCE_MANIFEST),
    readJson(PREVIOUS_REPORT),
    readJson(PREVIOUS_IMPLEMENTATION_MANIFEST),
    readJson(DIAGNOSTIC_ENTRY_STATE),
    readJson(IMPLEMENTATION_MANIFEST),
    readJson(MIGRATION_MANIFEST),
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
    "v10 comparison report hash drifted",
  );
  invariant(
    sha256(previousImplementationBytes)
      === EXPECTED_PREVIOUS_IMPLEMENTATION_MANIFEST_SHA256,
    "v10 implementation capture manifest hash drifted",
  );
  invariant(
    sha256(entryStateBytes) === EXPECTED_ENTRY_STATE_SHA256,
    "v11 diagnostic entry-state hash drifted",
  );
  invariant(
    sha256(implementationBytes) === EXPECTED_IMPLEMENTATION_MANIFEST_SHA256,
    "v11 implementation capture manifest hash drifted",
  );
  invariant(
    implementation.entryStateSha256 === sha256(entryStateBytes),
    "v11 capture does not bind the diagnostic entry-state digest",
  );
  validateExactPidV11Inputs({
    analysis,
    source,
    previousReport,
    entryState,
    implementation,
  });
  const closureDelta = validateV11ImplementationClosureDelta({
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
    `v11 implementation closure is stale: ${closureFreshnessErrors.join("; ")}`,
  );

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
    const diffFile =
      `${DIFF_DIRECTORY}/source-${String(pair.sourceCaptureOrdinal).padStart(6, "0")}`
      + `-implementation-${String(pair.candidateFrame).padStart(3, "0")}.png`;
    diffArtifacts.push({file: diffFile, bytes: diff.bytes});
    const informationalThreshold = pair.kind === "static" ? 0.05 : 0.08;
    const progressWidthPixels = EXACT_PID_V11_PROGRESS_ANCHORS.find(
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
  const v10Delta = {
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
      invariant(previous, "v10 comparison pair lookup drifted");
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
  const scriptBytes = await readFile(SCRIPT_PATH);
  const report = {
    schemaVersion: 1,
    reportType: "g4-l3-ts006-exact-pid-implementation-comparison-v11",
    animationId: ANIMATION_ID,
    classification:
      "acceptance-neutral-footer-convergence-fixed-registration-zero-mask-diagnostic",
    boundedIncrement: {
      spanishPageAudioGeometryAdjustmentPixels: {x: -4, y: -3},
      terminalLikePlaybackVisual: "pause",
      progressFillColor: "#28A4FF",
      progressAnchors: EXACT_PID_V11_PROGRESS_ANCHORS,
      sourceStructuralThumb: {
        manifest: {
          path: THUMB_MANIFEST,
          sha256: EXPECTED_THUMB_MANIFEST_SHA256,
        },
        image: {
          path: THUMB_IMAGE,
          sha256: EXPECTED_THUMB_IMAGE_SHA256,
        },
      },
      implementationClosureDelta: closureDelta,
      wholeFrameOrFooterStripAssetUsed: false,
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
    comparisons,
    summary: {
      comparedFrames: comparisons.length,
      staticFrames: comparisons.filter((item) => item.kind === "static").length,
      transitionFrames:
        comparisons.filter((item) => item.kind === "transition").length,
      regions,
      informationalFullFrameThresholdPasses: comparisons.filter(
        (item) => item.informationalFullFrameThresholdPassed,
      ).length,
      fixedRegistrationVerified: true,
      zeroMaskVerified: true,
      implementationBrowserCaptureClean: true,
      strictAcceptanceEffect: "none",
    },
    v10Delta,
    unresolved: [
      "The exact-PID source package remains an acceptance-neutral diagnostic, not an authorized natural runtime trace or authoritative baseline.",
      "The source-ordinal to candidate-frame pairs remain tentative phase anchors, not source-playhead telemetry or trace-bound source-frame identity.",
      "Ten spot frames do not establish complete 128-frame coverage or transition timing parity.",
      "Static full-frame RMSE remains above 0.05, so this diagnostic cannot establish visual fidelity.",
      "Audio timing and listening review, an independent Spanish trace, independent human visual review, Owner acceptance, and strict completion remain open.",
    ],
    strictAcceptanceEffect: "none",
  };
  return {report, markdown: markdown(report), diffArtifacts};
}

export async function writeG4L3Ts006ExactPidImplementationComparisonV11({
  check = false,
} = {}) {
  const {
    report,
    markdown: markdownBytes,
    diffArtifacts,
  } = await buildG4L3Ts006ExactPidImplementationComparisonV11();
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
    assertExactV11DiffArtifactSet(
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
  writeG4L3Ts006ExactPidImplementationComparisonV11(
    parseArguments(process.argv.slice(2)),
  )
    .then((report) => {
      console.log(JSON.stringify({
        summary: report.summary,
        v10Delta: report.v10Delta.regions,
      }, null, 2));
    })
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}
