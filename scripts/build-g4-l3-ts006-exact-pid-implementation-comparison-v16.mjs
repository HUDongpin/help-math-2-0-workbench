#!/usr/bin/env node

import { createHash, randomUUID } from "node:crypto";
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
import { fileURLToPath } from "node:url";

import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";

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
  "reports/g4-l3-ts006-exact-pid-implementation-comparison-v15.json";
const PREVIOUS_IMPLEMENTATION_DIRECTORY =
  "output/playwright/g4-l3-ts006-exact-pid-comparison-v15/en-diagnostic";
const PREVIOUS_IMPLEMENTATION_MANIFEST = `${PREVIOUS_IMPLEMENTATION_DIRECTORY}/capture-manifest.json`;
const PREVIOUS_ENTRY_STATE =
  "output/playwright/g4-l3-ts006-exact-pid-comparison-v15/diagnostic-entry-state.json";
const DIAGNOSTIC_ENTRY_STATE =
  "output/playwright/g4-l3-ts006-exact-pid-comparison-v16/diagnostic-entry-state.json";
const IMPLEMENTATION_DIRECTORY =
  "output/playwright/g4-l3-ts006-exact-pid-comparison-v16/en-diagnostic";
const IMPLEMENTATION_MANIFEST = `${IMPLEMENTATION_DIRECTORY}/capture-manifest.json`;
const DIFF_DIRECTORY =
  "output/playwright/g4-l3-ts006-exact-pid-comparison-v16/diffs";
const REPORT_JSON =
  "reports/g4-l3-ts006-exact-pid-implementation-comparison-v16.json";
const REPORT_MARKDOWN =
  "reports/g4-l3-ts006-exact-pid-implementation-comparison-v16.md";

const MIGRATION_MANIFEST = "migrations/course-g04-l03-ts-006/migration.json";
const RENDERER = "packages/demos/src/modules/course-g04-l03-ts-006.tsx";
const TIMELINE = "packages/demos/src/timelines/course-g04-l03-ts-006.ts";
const TIMELINE_MODULE_TEST =
  "packages/demos/tests/course-g04-l03-ts-006.test.ts";
const CURRENT_JS_CANDIDATE_REPORT =
  "reports/g4-l3-ts006-current-javascript-candidate.json";
const CURRENT_JS_ASSET_MANIFEST =
  "public/flash-assets/courses/course-g04-l03-ts-006/manifest.json";
const CURRENT_ASSET_INVENTORY =
  "migrations/course-g04-l03-ts-006/asset-inventory.csv";
const CURRENT_WORKSPACE_BINDING =
  "reports/g4-l3-ts006-current-javascript-workspace-binding.json";
const RECONCILIATION_FINGERPRINT =
  "fdccc943b42f2456c5aff21d0593d627ac13be538dc2d09cd3ee1b112d731b01";
const CURRENT_RECONCILIATION_RECEIPT =
  `reports/g4-l3-ts006-current-javascript-asset-inventory-reconciliations/` +
  `${RECONCILIATION_FINGERPRINT}.json`;

const EXPECTED_HASHES = Object.freeze({
  sourceAnalysis:
    "5513c4d9ebd3658575ebe98f1a934eb18766c7006551d3cf6d52503175a9e0cf",
  sourceManifest:
    "2e2154fd5af712a388fead07e91303c017167152ca1aa7db9f96a31ce6e3c313",
  previousReport:
    "054a15afba0ec36ff2b800e97258d994ba73fa2ae0f527a4ec881df450af3c4b",
  previousImplementationManifest:
    "1b38b0007c5f273ccc30d6c1a788412404c4d82940ed8b35115b814d7ef381eb",
  previousEntryState:
    "a14e060d9f13b7e9f31991c1c24d79beacf4869802df897f9fdbb2eeed2f47d6",
  entryState:
    "be1151efe4484e171f608558b0e87cb150c96d568efd91debbd7e6ccb17b80ce",
  implementationManifest:
    "c2e60858fe00525fabf402ab629f1f3e5a29566b58a9bcff337555ac6e2bc2a4",
  renderer: "6dd72bfefad560d4164414f25d884ba630426b3edfd27d0065bbcdea328c2d54",
  timeline: "c80e7ce77f59d47eadbaf8dd999ba463354311320865f3eacd38b85e614eaf8f",
  timelineModuleTest:
    "23c555c6ff0115adcc2ebb4154e1cb573099e8bc07828e4c542d18bada9dcb02",
  currentJavascriptCandidate:
    "80fbe8cf9b283a0a411477cc6602a1968e4e1af924ce02c93923794751634398",
  currentPublicManifest:
    "3e53077860ab9e6f9aeea22989770d2605e8ccd8b56e124342cf536a4c8200de",
  currentAssetInventory:
    "c65960d0ef5abeac6a7853dcdcc4c1c94e08a5adf6a89ee3b4aa96e9d3488a76",
  currentWorkspaceBinding:
    "cca3b07fe65d4b024671dcef27641a2c1115b7ccabcf9e87e62a8a121f72ba6c",
  reconciliationReceipt:
    "8db62a42c6a2cd48c0a4cf6dcf45941981a8246e44923600fcb6ff918e864eca",
});

export const EXACT_PID_V16_PROGRESS_REGIONS = Object.freeze({
  progressRect: Object.freeze({ x: 588, y: 540, width: 117, height: 8 }),
  progressWide: Object.freeze({ x: 580, y: 532, width: 135, height: 20 }),
});

const COMPARISON_REGIONS = Object.freeze({
  ...EXACT_PID_V10_REGIONS,
  ...EXACT_PID_V16_PROGRESS_REGIONS,
});

export const EXACT_PID_V16_FILTER_COMPOSITING_SPILLOVER_POINTS = Object.freeze([
  "296,191",
  "365,191",
  "296,192",
  "365,192",
  "613,215",
  "654,215",
  "613,216",
  "654,216",
  "609,239",
  "666,239",
  "609,240",
  "666,240",
  "369,260",
  "369,261",
]);

const BODY_RMSE_NUMERIC_TOLERANCE = 0.0000002;
const DIFF_FILE_NAME_PATTERN = /^source-\d{6}-implementation-\d{3}\.png$/u;

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function projectPath(relativePath) {
  const resolved = path.resolve(ROOT, relativePath);
  const relative = path.relative(ROOT, resolved);
  invariant(
    relative &&
      !relative.startsWith(`..${path.sep}`) &&
      !path.isAbsolute(relative),
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
  return (
    record &&
    Object.values(record).length > 0 &&
    Object.values(record).every((value) => value === false)
  );
}

function projectedAnchors(value) {
  return value.map(({ candidateFrame, sourceCaptureOrdinal, phase, kind }) => ({
    candidateFrame,
    sourceCaptureOrdinal,
    phase,
    kind,
  }));
}

async function readJson(relativePath) {
  const bytes = await readFile(projectPath(relativePath));
  return { bytes, value: JSON.parse(bytes.toString("utf8")) };
}

function isInside(root, target) {
  const relative = path.relative(root, target);
  return (
    relative === "" ||
    (!relative.startsWith("..") && !path.isAbsolute(relative))
  );
}

async function assertCaptureFileWithin(relativePath, captureDirectory) {
  const directory = projectPath(captureDirectory);
  const file = projectPath(relativePath);
  const lexicalRelative = path.relative(directory, file);
  invariant(
    lexicalRelative &&
      !lexicalRelative.startsWith(`..${path.sep}`) &&
      !path.isAbsolute(lexicalRelative),
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
  invariant(
    sha256(bytes) === expectedSha256,
    `PNG hash drift: ${relativePath}`,
  );
  const png = PNG.sync.read(bytes);
  invariant(
    png.width === 800 && png.height === 600,
    `PNG geometry drift: ${relativePath}`,
  );
  return { bytes, png };
}

function expectedCaptureFrame(candidateFrame) {
  return `frame-${String(candidateFrame).padStart(3, "0")}.png`;
}

function closureArtifactMap(manifest) {
  return new Map(
    manifest.implementationArtifactClosure.artifacts.map((artifact) => [
      artifact.path,
      artifact,
    ]),
  );
}

export function validateV16ImplementationClosureDelta({
  previousImplementation,
  implementation,
}) {
  const previous = closureArtifactMap(previousImplementation);
  const current = closureArtifactMap(implementation);
  const added = [...current.keys()]
    .filter((item) => !previous.has(item))
    .sort();
  const removed = [...previous.keys()]
    .filter((item) => !current.has(item))
    .sort();
  const changed = [...current.keys()]
    .filter((item) => {
      const before = previous.get(item);
      const after = current.get(item);
      return (
        before &&
        (before.sha256 !== after.sha256 || before.bytes !== after.bytes)
      );
    })
    .sort();
  invariant(
    added.length === 0 &&
      removed.length === 0 &&
      JSON.stringify(changed) === JSON.stringify([RENDERER, TIMELINE].sort()),
    "v16 closure may differ from v15 only by the TS006 renderer and timeline",
  );
  invariant(
    current.get(RENDERER)?.sha256 === EXPECTED_HASHES.renderer &&
      current.get(TIMELINE)?.sha256 === EXPECTED_HASHES.timeline,
    "v16 renderer or timeline closure hash drifted",
  );
  invariant(
    previousImplementation.implementationArtifactClosure.projectionCount ===
      implementation.implementationArtifactClosure.projectionCount &&
      JSON.stringify(
        previousImplementation.implementationArtifactClosure.projections,
      ) ===
        JSON.stringify(
          implementation.implementationArtifactClosure.projections,
        ),
    "v16 closure projections drifted from v15",
  );
  invariant(
    [...current.keys()].every(
      (item) =>
        !item.includes("full-frame") &&
        !item.includes("region-strip") &&
        !item.startsWith("output/") &&
        !item.startsWith("artifacts/"),
    ),
    "v16 closure introduced a prohibited evidence raster asset",
  );
  return {
    added,
    removed,
    changed,
    transitions: changed.map((item) => ({
      path: item,
      priorBytes: previous.get(item).bytes,
      priorSha256: previous.get(item).sha256,
      currentBytes: current.get(item).bytes,
      currentSha256: current.get(item).sha256,
    })),
  };
}

function insideRegion(x, y, region) {
  return (
    x >= region.x &&
    x < region.x + region.width &&
    y >= region.y &&
    y < region.y + region.height
  );
}

export function validateV16PixelDelta({
  previousPng,
  implementationPng,
  candidateFrame,
}) {
  invariant(
    previousPng.width === 800 &&
      previousPng.height === 600 &&
      implementationPng.width === 800 &&
      implementationPng.height === 600,
    "v16 pixel-delta inputs must both be 800x600",
  );
  const changed = [];
  const outsideProgressRect = [];
  let headerChangedPixels = 0;
  let maximumChannelDelta = 0;
  for (let y = 0; y < 600; y += 1) {
    for (let x = 0; x < 800; x += 1) {
      const offset = (y * 800 + x) * 4;
      const before = previousPng.data.subarray(offset, offset + 4);
      const after = implementationPng.data.subarray(offset, offset + 4);
      const channelDeltas = [0, 1, 2, 3].map((channel) =>
        Math.abs(before[channel] - after[channel]),
      );
      if (channelDeltas.every((value) => value === 0)) continue;
      const point = {
        x,
        y,
        before: [...before],
        after: [...after],
        maximumChannelDelta: Math.max(...channelDeltas),
      };
      changed.push(point);
      maximumChannelDelta = Math.max(
        maximumChannelDelta,
        point.maximumChannelDelta,
      );
      if (y < EXACT_PID_V10_REGIONS.header.height) headerChangedPixels += 1;
      if (!insideRegion(x, y, EXACT_PID_V16_PROGRESS_REGIONS.progressRect)) {
        outsideProgressRect.push(point);
      }
    }
  }
  const allowedSpillover = new Set(
    EXACT_PID_V16_FILTER_COMPOSITING_SPILLOVER_POINTS,
  );
  invariant(
    headerChangedPixels === 0,
    `v16 frame ${candidateFrame} changed header pixels`,
  );
  invariant(
    outsideProgressRect.length <= 14 &&
      outsideProgressRect.every(
        (point) =>
          allowedSpillover.has(`${point.x},${point.y}`) &&
          point.y >= EXACT_PID_V10_REGIONS.body.y &&
          point.y <
            EXACT_PID_V10_REGIONS.body.y + EXACT_PID_V10_REGIONS.body.height &&
          point.maximumChannelDelta <= 5 &&
          point.before[3] === point.after[3],
      ),
    `v16 frame ${candidateFrame} has an unexpected non-progress pixel delta`,
  );
  const bounds =
    changed.length === 0
      ? null
      : {
          minX: Math.min(...changed.map(({ x }) => x)),
          minY: Math.min(...changed.map(({ y }) => y)),
          maxX: Math.max(...changed.map(({ x }) => x)),
          maxY: Math.max(...changed.map(({ y }) => y)),
        };
  return {
    changedPixels: changed.length,
    progressRectChangedPixels: changed.length - outsideProgressRect.length,
    outsideProgressRectChangedPixels: outsideProgressRect.length,
    outsideProgressRectPoints: outsideProgressRect,
    headerChangedPixels,
    maximumChannelDelta,
    bounds,
    classification:
      outsideProgressRect.length === 0
        ? "progress-rectangle-only"
        : "progress-rectangle-plus-bounded-filter-compositing-edge-quantization",
  };
}

function validateInputs({
  analysis,
  source,
  previousReport,
  previousImplementation,
  previousEntryState,
  entryState,
  implementation,
}) {
  invariant(
    analysis?.reportType ===
      "g4-l3-ts006-exact-pid-replay-complete-diagnostic-v10" &&
      analysis.animationId === ANIMATION_ID &&
      analysis.strictAcceptanceEffect === "none" &&
      allBooleanValuesFalse(analysis.authority),
    "source analysis authority boundary drifted",
  );
  invariant(
    source?.status === "raw-capture-not-yet-bound-to-runtime-trace" &&
      source.runtimeAuthorityClaimed === false &&
      source.acceptanceEffect === "none" &&
      source.display?.includedProcessID === 97581 &&
      source.droppedOrIncompleteFrameCount === 0 &&
      Array.isArray(source.frames) &&
      source.frames.length === 537,
    "source exact-PID capture boundary drifted",
  );
  invariant(
    previousReport?.reportType ===
      "g4-l3-ts006-exact-pid-implementation-comparison-v15" &&
      previousReport.animationId === ANIMATION_ID &&
      previousReport.summary?.comparedFrames === 10 &&
      previousReport.strictAcceptanceEffect === "none" &&
      previousReport.authority?.authoritativeBaselineClaimed === false &&
      previousReport.authority?.implementationCandidatePromoted === false,
    "v15 comparison boundary drifted",
  );
  invariant(
    previousImplementation?.schemaVersion ===
      IMPLEMENTATION_CAPTURE_SCHEMA_VERSION &&
      previousImplementation.status === "complete" &&
      previousImplementation.animationId === ANIMATION_ID &&
      previousImplementation.requirementId ===
        "diagnostic:ts006:exact-pid-v15:en",
    "v15 implementation capture identity drifted",
  );
  invariant(
    previousEntryState?.stateId ===
      "course-g04-l03-ts-006-exact-pid-v15-current-implementation-binding-context" &&
      previousEntryState.strictAcceptanceEffect === "none",
    "v15 entry-state boundary drifted",
  );
  invariant(
    entryState?.stateId ===
      "course-g04-l03-ts-006-exact-pid-v16-progress-inverse-gamma-binding-context" &&
      entryState.animationId === ANIMATION_ID &&
      entryState.classification ===
        "acceptance-neutral-diagnostic-entry-context-not-original-runtime-entry-state" &&
      entryState.previousDiagnostic?.comparisonReport?.sha256 ===
        EXPECTED_HASHES.previousReport &&
      entryState.previousDiagnostic?.implementationCaptureManifest?.sha256 ===
        EXPECTED_HASHES.previousImplementationManifest &&
      entryState.previousDiagnostic?.entryState?.sha256 ===
        EXPECTED_HASHES.previousEntryState &&
      entryState.currentImplementationBindings?.renderer?.sha256 ===
        EXPECTED_HASHES.renderer &&
      entryState.currentImplementationBindings?.timeline?.sha256 ===
        EXPECTED_HASHES.timeline &&
      entryState.currentImplementationBindings?.timelineModuleTest?.sha256 ===
        EXPECTED_HASHES.timelineModuleTest &&
      entryState.comparisonIncrement?.status ===
        "acceptance-neutral-progress-rectangle-inverse-gamma-input-refinement" &&
      entryState.comparisonIncrement?.scope ===
        "diagnostic-progress-rectangles-only" &&
      entryState.comparisonIncrement?.semanticOutputColors?.fill ===
        "#28A4FF" &&
      entryState.comparisonIncrement?.semanticOutputColors?.track ===
        "#717171" &&
      entryState.comparisonIncrement?.filterInputColors?.fill === "#1C96FF" &&
      entryState.comparisonIncrement?.filterInputColors?.track === "#606060" &&
      entryState.comparisonIncrement?.progressRectanglesRemainInsideFilter ===
        true &&
      entryState.comparisonIncrement?.progressThumbChanged === false &&
      entryState.comparisonIncrement?.progressMappingChanged === false &&
      entryState.comparisonIncrement?.bodyChanged === false &&
      entryState.comparisonIncrement?.tableChanged === false &&
      entryState.comparisonIncrement?.strictAcceptanceEffect === "none" &&
      JSON.stringify(entryState.mapping?.anchors) ===
        JSON.stringify(projectedAnchors(EXACT_PID_V10_KEYFRAME_PAIRS)) &&
      allBooleanValuesFalse(entryState.authority) &&
      entryState.strictAcceptanceEffect === "none",
    "v16 entry-state scope or authority drifted",
  );
  invariant(
    implementation?.schemaVersion === IMPLEMENTATION_CAPTURE_SCHEMA_VERSION &&
      implementation.status === "complete" &&
      implementation.animationId === ANIMATION_ID &&
      implementation.frameDomainId === "sprite-23" &&
      implementation.requestedFrameDomain === "sprite-23" &&
      implementation.requirementId === "diagnostic:ts006:exact-pid-v16:en" &&
      implementation.traceId ===
        "diagnostic:exact-pid-v16:progress-inverse-gamma:en:seed-0" &&
      implementation.entryStateSha256 === EXPECTED_HASHES.entryState &&
      implementation.scenario === "manual-runtime-diagnostic-observation" &&
      implementation.language === "en" &&
      implementation.seed === "0" &&
      implementation.viewport?.width === 800 &&
      implementation.viewport?.height === 600 &&
      implementation.viewport?.deviceScaleFactor === 1 &&
      implementation.flashContextIdentityComplete === true &&
      isUnambiguousLoopbackHttpUrl(implementation.sourceUrl) &&
      implementation.sourceUrl ===
        "http://127.0.0.1:3214/en/animations/course-g04-l03-ts-006" &&
      implementationCaptureGeneratorProvenanceErrors(
        implementation.generatorProvenance,
      ).length === 0 &&
      implementation.consoleErrors?.length === 0 &&
      implementation.failedRequests?.length === 0 &&
      implementation.httpErrors?.length === 0 &&
      implementation.unexpectedRequests?.length === 0 &&
      implementation.error === null,
    "v16 implementation capture identity or browser health drifted",
  );
  invariant(
    Array.isArray(implementation.captured) &&
      implementation.captured.length === EXACT_PID_V10_KEYFRAME_PAIRS.length &&
      implementation.captured.every((frame, index) => {
        const expected = EXACT_PID_V10_KEYFRAME_PAIRS[index];
        const frameUrl = new URL(frame.url);
        return (
          frame.frame === expected.candidateFrame &&
          frame.file === expectedCaptureFrame(expected.candidateFrame) &&
          frame.width === 800 &&
          frame.height === 600 &&
          frame.rootFrame === 6 &&
          frame.frameDomain === "sprite-23" &&
          frame.frameDomainId === "sprite-23" &&
          frame.requirementId === implementation.requirementId &&
          frame.traceId === implementation.traceId &&
          frame.entryStateSha256 === implementation.entryStateSha256 &&
          frame.scenario === implementation.scenario &&
          frame.language === implementation.language &&
          frame.seed === implementation.seed &&
          frame.reportedRenderState === "ready" &&
          frame.flashContextIdentityComplete === true &&
          frameUrl.searchParams.get("capture") === "1" &&
          frameUrl.searchParams.get("frame") === String(expected.candidateFrame)
        );
      }),
    "v16 implementation frame identity drifted",
  );
  return true;
}

async function validateImplementationProvenancePhysical(implementation) {
  const provenance = implementation.generatorProvenance;
  const [scriptBytes, packageBytes] = await Promise.all([
    readFile(projectPath(provenance.script.path)),
    readFile(projectPath(provenance.playwright.packageJsonPath)),
  ]);
  invariant(
    provenance.script.path === "scripts/capture-animation-keyframes.mjs" &&
      sha256(scriptBytes) === provenance.script.sha256,
    "implementation capture generator script identity drifted",
  );
  invariant(
    sha256(packageBytes) === provenance.playwright.packageJsonSha256,
    "implementation capture Playwright package hash drifted",
  );
  const packageJson = JSON.parse(packageBytes.toString("utf8"));
  invariant(
    packageJson.name === "@playwright/test" &&
      packageJson.version === provenance.playwright.version,
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

function delta(previous, current, tolerance = 0) {
  const absoluteReduction = round(previous - current);
  return {
    previous: round(previous),
    current: round(current),
    absoluteReduction,
    relativeReductionPercent:
      previous === 0 ? 0 : round((absoluteReduction / previous) * 100),
    pixelIdenticalMetric: previous === current,
    strictNumericalNonRegression: current <= previous,
    nonRegressedWithinTolerance: current <= previous + tolerance,
    tolerance,
  };
}

function makeFullFrameDiff(source, implementation) {
  const diff = new PNG({ width: 800, height: 600 });
  const mismatchedPixels = pixelmatch(
    source.data,
    implementation.data,
    diff.data,
    800,
    600,
    { threshold: 0.1, includeAA: true },
  );
  const bytes = PNG.sync.write(diff);
  return {
    bytes,
    mismatchedPixels,
    mismatchedPixelRatio: round(mismatchedPixels / (800 * 600)),
  };
}

function expectedDiffFileNames(diffArtifacts) {
  const names = diffArtifacts.map(({ file }) => path.basename(file));
  invariant(
    names.length === new Set(names).size &&
      names.every((name) => DIFF_FILE_NAME_PATTERN.test(name)),
    "expected v16 diff artifact names are invalid or duplicated",
  );
  return names.sort();
}

export function assertExactV16DiffArtifactSet(actualNames, diffArtifacts) {
  invariant(
    JSON.stringify([...actualNames].sort()) ===
      JSON.stringify(expectedDiffFileNames(diffArtifacts)),
    `${DIFF_DIRECTORY} contains stale, missing, or unexpected artifacts`,
  );
  return true;
}

async function atomicWrite(relativePath, bytes) {
  const target = projectPath(relativePath);
  await mkdir(path.dirname(target), { recursive: true });
  const temporary = `${target}.tmp-${process.pid}-${randomUUID()}`;
  try {
    await writeFile(temporary, bytes, { flag: "wx" });
    await rename(temporary, target);
  } finally {
    await rm(temporary, { force: true });
  }
}

async function readDiffDirectoryEntries() {
  await mkdir(projectPath(DIFF_DIRECTORY), { recursive: true });
  return readdir(projectPath(DIFF_DIRECTORY), { withFileTypes: true });
}

async function removeStaleGeneratedDiffArtifacts(diffArtifacts) {
  const expectedNames = new Set(expectedDiffFileNames(diffArtifacts));
  const entries = await readDiffDirectoryEntries();
  for (const entry of entries) {
    if (expectedNames.has(entry.name)) continue;
    invariant(
      DIFF_FILE_NAME_PATTERN.test(entry.name) &&
        (entry.isFile() || entry.isSymbolicLink()),
      `${DIFF_DIRECTORY} contains an unexpected non-generated entry: ${entry.name}`,
    );
    await rm(path.join(projectPath(DIFF_DIRECTORY), entry.name), {
      force: true,
    });
  }
}

function markdown(report) {
  const rows = report.comparisons
    .map(
      (item) =>
        `| ${item.candidateFrame} | ${item.sourceCaptureOrdinal} | ` +
        `${item.rmse.full.normalizedRmse.toFixed(6)} | ` +
        `${item.rmse.header.normalizedRmse.toFixed(6)} | ` +
        `${item.rmse.body.normalizedRmse.toFixed(6)} | ` +
        `${item.rmse.footer.normalizedRmse.toFixed(6)} | ` +
        `${item.rmse.progressRect.normalizedRmse.toFixed(6)} | ` +
        `${item.implementationDelta.changedPixels} | ` +
        `${item.implementationDelta.outsideProgressRectChangedPixels} |`,
    )
    .join("\n");
  const regionSummary = Object.entries(report.summary.regions)
    .map(
      ([id, value]) =>
        `- ${id}: v15 ${report.v15Delta.regions[id].previous.toFixed(12)}; ` +
        `v16 ${value.mean.toFixed(12)}; change ` +
        `${report.v15Delta.regions[id].absoluteReduction.toFixed(12)} ` +
        `(${report.v15Delta.regions[id].relativeReductionPercent.toFixed(6)}%)`,
    )
    .join("\n");
  return (
    `# G4 L3 TS006 exact-PID implementation comparison v16\n\n` +
    `Status: **acceptance-neutral progress-color diagnostic; not an authoritative baseline, fidelity acceptance, strict completion, or release evidence**.\n\n` +
    `v16 changes only the progress rectangle inputs inside the existing gamma filter: semantic output ` +
    `fill/track remain \`#28A4FF\`/\`#717171\`, while filter inputs are ` +
    `\`#1C96FF\`/\`#606060\`. The thumb, progress mapping, body, table, assets, ` +
    `coverage, ledgers, review, and release state are unchanged.\n\n` +
    `## Fixed-registration, zero-mask results\n\n` +
    `| Candidate | Source ordinal | Full | Header | Body | Footer | Progress rect | v15→v16 changed pixels | Outside progress rect |\n` +
    `|---:|---:|---:|---:|---:|---:|---:|---:|---:|\n${rows}\n\n` +
    `## Mean RMSE change from v15\n\n${regionSummary}\n\n` +
    `- Full/header/footer/progress non-regression: verified for all 10 frames.\n` +
    `- Body: five frames are pixel-identical; the other five differ by 13–14 antialiased edge pixels, each by at most 5 channel levels. Mean body RMSE changes by ` +
    `${report.v15Delta.regions.body.absoluteReduction.toFixed(12)} ` +
    `(${report.v15Delta.regions.body.relativeReductionPercent.toFixed(6)}%). ` +
    `This is recorded as bounded filter-compositing quantization, not hidden as pixel identity.\n` +
    `- Browser capture and current implementation artifact closure: verified.\n` +
    `- Strict acceptance effect: **none**.\n\n` +
    `## Open gates\n\n${report.unresolved
      .map((item) => `- ${item}`)
      .join("\n")}\n`
  );
}

export async function buildG4L3Ts006ExactPidImplementationComparisonV16() {
  const [
    { bytes: analysisBytes, value: analysis },
    { bytes: sourceBytes, value: source },
    { bytes: previousReportBytes, value: previousReport },
    { bytes: previousImplementationBytes, value: previousImplementation },
    { bytes: previousEntryStateBytes, value: previousEntryState },
    { bytes: entryStateBytes, value: entryState },
    { bytes: implementationBytes, value: implementation },
    { bytes: migrationBytes, value: migration },
    rendererBytes,
    timelineBytes,
    timelineModuleTestBytes,
    candidateBytes,
    assetManifestBytes,
    assetInventoryBytes,
    workspaceBindingBytes,
    reconciliationReceiptBytes,
  ] = await Promise.all([
    readJson(SOURCE_ANALYSIS),
    readJson(SOURCE_MANIFEST),
    readJson(PREVIOUS_REPORT),
    readJson(PREVIOUS_IMPLEMENTATION_MANIFEST),
    readJson(PREVIOUS_ENTRY_STATE),
    readJson(DIAGNOSTIC_ENTRY_STATE),
    readJson(IMPLEMENTATION_MANIFEST),
    readJson(MIGRATION_MANIFEST),
    readFile(projectPath(RENDERER)),
    readFile(projectPath(TIMELINE)),
    readFile(projectPath(TIMELINE_MODULE_TEST)),
    readFile(projectPath(CURRENT_JS_CANDIDATE_REPORT)),
    readFile(projectPath(CURRENT_JS_ASSET_MANIFEST)),
    readFile(projectPath(CURRENT_ASSET_INVENTORY)),
    readFile(projectPath(CURRENT_WORKSPACE_BINDING)),
    readFile(projectPath(CURRENT_RECONCILIATION_RECEIPT)),
  ]);
  const expectedHashes = [
    [analysisBytes, EXPECTED_HASHES.sourceAnalysis, "source analysis"],
    [sourceBytes, EXPECTED_HASHES.sourceManifest, "source manifest"],
    [previousReportBytes, EXPECTED_HASHES.previousReport, "v15 report"],
    [
      previousImplementationBytes,
      EXPECTED_HASHES.previousImplementationManifest,
      "v15 implementation manifest",
    ],
    [
      previousEntryStateBytes,
      EXPECTED_HASHES.previousEntryState,
      "v15 entry state",
    ],
    [entryStateBytes, EXPECTED_HASHES.entryState, "v16 entry state"],
    [
      implementationBytes,
      EXPECTED_HASHES.implementationManifest,
      "v16 implementation manifest",
    ],
    [rendererBytes, EXPECTED_HASHES.renderer, "v16 renderer"],
    [timelineBytes, EXPECTED_HASHES.timeline, "v16 timeline"],
    [
      timelineModuleTestBytes,
      EXPECTED_HASHES.timelineModuleTest,
      "v16 timeline/module test",
    ],
    [
      candidateBytes,
      EXPECTED_HASHES.currentJavascriptCandidate,
      "frozen current-JavaScript candidate",
    ],
    [
      assetManifestBytes,
      EXPECTED_HASHES.currentPublicManifest,
      "current public manifest",
    ],
    [
      assetInventoryBytes,
      EXPECTED_HASHES.currentAssetInventory,
      "current asset inventory",
    ],
    [
      workspaceBindingBytes,
      EXPECTED_HASHES.currentWorkspaceBinding,
      "current workspace binding",
    ],
    [
      reconciliationReceiptBytes,
      EXPECTED_HASHES.reconciliationReceipt,
      "reconciliation receipt",
    ],
  ];
  for (const [bytes, expected, label] of expectedHashes) {
    invariant(sha256(bytes) === expected, `${label} hash drifted`);
  }
  invariant(
    implementation.entryStateSha256 === sha256(entryStateBytes),
    "v16 capture does not bind the v16 diagnostic entry state",
  );
  validateInputs({
    analysis,
    source,
    previousReport,
    previousImplementation,
    previousEntryState,
    entryState,
    implementation,
  });
  const closureDelta = validateV16ImplementationClosureDelta({
    previousImplementation,
    implementation,
  });
  await validateImplementationProvenancePhysical(implementation);
  invariant(
    migration.animationId === ANIMATION_ID,
    "migration identity drifted",
  );
  const currentClosure = await collectImplementationArtifactClosure({
    projectRoot: ROOT,
    workspace: projectPath("migrations/course-g04-l03-ts-006"),
    manifest: migration,
  });
  const closureErrors = implementationArtifactClosureErrors(
    implementation.implementationArtifactClosure,
    currentClosure,
  );
  invariant(
    closureErrors.length === 0,
    `v16 implementation closure is stale: ${closureErrors.join("; ")}`,
  );
  assertFixedRegionContract(EXACT_PID_V10_REGIONS);

  const comparisons = [];
  const diffArtifacts = [];
  for (const pair of EXACT_PID_V10_KEYFRAME_PAIRS) {
    const sourceFrame = source.frames[pair.sourceCaptureOrdinal - 1];
    const previousFrame = previousImplementation.captured.find(
      (item) => item.frame === pair.candidateFrame,
    );
    const implementationFrame = implementation.captured.find(
      (item) => item.frame === pair.candidateFrame,
    );
    const previousComparison = previousReport.comparisons.find(
      (item) =>
        item.candidateFrame === pair.candidateFrame &&
        item.sourceCaptureOrdinal === pair.sourceCaptureOrdinal,
    );
    invariant(
      sourceFrame?.ordinal === pair.sourceCaptureOrdinal &&
        previousFrame &&
        implementationFrame &&
        previousComparison,
      "v16 comparison frame lookup drifted",
    );
    const sourceFile = `${SOURCE_DIRECTORY}/${sourceFrame.file}`;
    const previousFile = `${PREVIOUS_IMPLEMENTATION_DIRECTORY}/${previousFrame.file}`;
    const implementationFile = `${IMPLEMENTATION_DIRECTORY}/${implementationFrame.file}`;
    const [
      { png: sourcePng },
      { png: previousPng },
      { png: implementationPng },
    ] = await Promise.all([
      readBoundPng(sourceFile, sourceFrame.sha256, SOURCE_DIRECTORY),
      readBoundPng(
        previousFile,
        previousFrame.sha256,
        PREVIOUS_IMPLEMENTATION_DIRECTORY,
      ),
      readBoundPng(
        implementationFile,
        implementationFrame.sha256,
        IMPLEMENTATION_DIRECTORY,
      ),
    ]);
    const rmse = Object.fromEntries(
      Object.entries(COMPARISON_REGIONS).map(([regionId, region]) => [
        regionId,
        compareRgbRegionFixed(sourcePng, implementationPng, region),
      ]),
    );
    const previousRmse = Object.fromEntries(
      Object.entries(COMPARISON_REGIONS).map(([regionId, region]) => [
        regionId,
        regionId in EXACT_PID_V10_REGIONS
          ? previousComparison.rmse[regionId]
          : compareRgbRegionFixed(sourcePng, previousPng, region),
      ]),
    );
    const v15Delta = Object.fromEntries(
      Object.keys(COMPARISON_REGIONS).map((regionId) => [
        regionId,
        delta(
          previousRmse[regionId].normalizedRmse,
          rmse[regionId].normalizedRmse,
          regionId === "body" ? BODY_RMSE_NUMERIC_TOLERANCE : 0,
        ),
      ]),
    );
    const implementationDelta = validateV16PixelDelta({
      previousPng,
      implementationPng,
      candidateFrame: pair.candidateFrame,
    });
    const diff = makeFullFrameDiff(sourcePng, implementationPng);
    const diffFile =
      `${DIFF_DIRECTORY}/source-${String(pair.sourceCaptureOrdinal).padStart(
        6,
        "0",
      )}` +
      `-implementation-${String(pair.candidateFrame).padStart(3, "0")}.png`;
    diffArtifacts.push({ file: diffFile, bytes: diff.bytes });
    comparisons.push({
      ...pair,
      mappingStatus:
        "operator-selected-piecewise-tentative-diagnostic-not-trace-bound",
      sourceFile,
      sourceSha256: sourceFrame.sha256,
      previousImplementationFile: previousFile,
      previousImplementationSha256: previousFrame.sha256,
      implementationFile,
      implementationSha256: implementationFrame.sha256,
      registrationOffset: { x: 0, y: 0 },
      pixelMaskApplied: false,
      excludedPixelCount: 0,
      resamplingApplied: false,
      rmse,
      previousRmse,
      v15Delta,
      implementationDelta,
      fullFrameDiff: {
        file: diffFile,
        bytes: diff.bytes.length,
        sha256: sha256(diff.bytes),
        pixelmatchThreshold: 0.1,
        includeAntialiasingDifferences: true,
        mismatchedPixels: diff.mismatchedPixels,
        mismatchedPixelRatio: diff.mismatchedPixelRatio,
      },
      informationalThreshold: pair.kind === "static" ? 0.05 : 0.08,
    });
  }

  const regions = Object.fromEntries(
    Object.keys(COMPARISON_REGIONS).map((regionId) => [
      regionId,
      summarize(comparisons, regionId),
    ]),
  );
  const previousRegionMeans = Object.fromEntries(
    Object.keys(COMPARISON_REGIONS).map((regionId) => [
      regionId,
      round(
        comparisons.reduce(
          (sum, item) => sum + item.previousRmse[regionId].normalizedRmse,
          0,
        ) / comparisons.length,
      ),
    ]),
  );
  const v15Delta = {
    comparisonReportSha256: sha256(previousReportBytes),
    regions: Object.fromEntries(
      Object.keys(COMPARISON_REGIONS).map((regionId) => [
        regionId,
        delta(
          previousRegionMeans[regionId],
          regions[regionId].mean,
          regionId === "body" ? BODY_RMSE_NUMERIC_TOLERANCE : 0,
        ),
      ]),
    ),
    perFrame: comparisons.map((item) => ({
      candidateFrame: item.candidateFrame,
      sourceCaptureOrdinal: item.sourceCaptureOrdinal,
      ...item.v15Delta,
    })),
  };

  const exactNonRegressionRegions = [
    "full",
    "header",
    "footer",
    "progressRect",
    "progressWide",
  ];
  invariant(
    comparisons.every(
      (item) =>
        exactNonRegressionRegions.every(
          (regionId) => item.v15Delta[regionId].strictNumericalNonRegression,
        ) && item.v15Delta.body.nonRegressedWithinTolerance,
    ) &&
      exactNonRegressionRegions.every(
        (regionId) => v15Delta.regions[regionId].strictNumericalNonRegression,
      ) &&
      v15Delta.regions.body.nonRegressedWithinTolerance,
    "v16 exact regions regressed or body exceeded bounded numeric tolerance",
  );
  invariant(
    comparisons.every(
      (item) =>
        item.implementationDelta.progressRectChangedPixels > 0 &&
        item.implementationDelta.headerChangedPixels === 0,
    ),
    "v16 did not isolate the intended visible progress change",
  );

  const scriptBytes = await readFile(SCRIPT_PATH);
  const report = {
    schemaVersion: 1,
    reportType: "g4-l3-ts006-exact-pid-implementation-comparison-v16",
    animationId: ANIMATION_ID,
    classification:
      "acceptance-neutral-progress-inverse-gamma-fixed-registration-zero-mask-diagnostic",
    boundedIncrement: {
      ...entryState.comparisonIncrement,
      prohibitedRasterSubstitution: {
        wholeFrameOrRegionAssetUsed: false,
      },
      currentImplementationArtifactClosureVerified: true,
      implementationClosureDelta: closureDelta,
      frozenGlobalCurrentJavascriptReportsRefreshed: false,
      inventoryObserverConflictPreserved: true,
      originalRuntimeGeometryEstablished: false,
      originalRuntimeColorPipelineEstablished: false,
      visualParityEstablished: false,
      strictAcceptanceEffect: "none",
    },
    authority: {
      sourceCapture: "raw-unpromoted-exact-pid-runtime-diagnostic",
      sourceReplayMapping:
        "operator-selected-piecewise-tentative-not-trace-bound",
      implementation: "current-hash-bound-javascript-diagnostic-candidate",
      pageOrdinalMeaning: "unresolved",
      originalRuntimeAuthorityClaimed: false,
      authoritativeBaselineClaimed: false,
      sourcePlayheadMappingClaimed: false,
      pageOrdinalAuthorityClaimed: false,
      originalRuntimeColorPipelineEstablished: false,
      implementationCandidatePromoted: false,
      visualParityClaimed: false,
      audioAccepted: false,
      spanishTraceAccepted: false,
      independentHumanVisualReviewComplete: false,
      ownerAcceptanceComplete: false,
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
    colorProjection: {
      status: entryState.comparisonIncrement.status,
      sourceBasis: entryState.comparisonIncrement.sourceBasis,
      filterExponent: entryState.comparisonIncrement.filterExponent,
      semanticOutputColors: entryState.comparisonIncrement.semanticOutputColors,
      filterInputColors: entryState.comparisonIncrement.filterInputColors,
      progressRectanglesRemainInsideFilter: true,
      thumbChanged: false,
      mappingChanged: false,
      originalRuntimeColorPipelineEstablished: false,
      strictAcceptanceEffect: "none",
    },
    comparisonContract: {
      stage: { width: 800, height: 600 },
      regions: COMPARISON_REGIONS,
      metric:
        "sqrt(mean((sourceRGB-implementationRGB)^2))/255 over every fixed region pixel",
      channels: ["red", "green", "blue"],
      fixedRegistration: {
        sourceOffset: { x: 0, y: 0 },
        implementationOffset: { x: 0, y: 0 },
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
      bodyRmseNumericTolerance: BODY_RMSE_NUMERIC_TOLERANCE,
      bodyToleranceReason:
        "at-most-14-whitelisted-filter-compositing-antialias-edge-pixels-with-at-most-5-channel-level-delta",
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
      previousDiagnosticEntryState: {
        path: PREVIOUS_ENTRY_STATE,
        bytes: previousEntryStateBytes.length,
        sha256: sha256(previousEntryStateBytes),
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
      renderer: {
        path: RENDERER,
        bytes: rendererBytes.length,
        sha256: sha256(rendererBytes),
      },
      timeline: {
        path: TIMELINE,
        bytes: timelineBytes.length,
        sha256: sha256(timelineBytes),
      },
      timelineModuleTest: {
        path: TIMELINE_MODULE_TEST,
        bytes: timelineModuleTestBytes.length,
        sha256: sha256(timelineModuleTestBytes),
      },
      frozenCurrentJavascriptCandidateReport: {
        path: CURRENT_JS_CANDIDATE_REPORT,
        bytes: candidateBytes.length,
        sha256: sha256(candidateBytes),
        refreshedByV16: false,
      },
      currentPublicAssetManifest: {
        path: CURRENT_JS_ASSET_MANIFEST,
        bytes: assetManifestBytes.length,
        sha256: sha256(assetManifestBytes),
      },
      currentAssetInventory: {
        path: CURRENT_ASSET_INVENTORY,
        bytes: assetInventoryBytes.length,
        sha256: sha256(assetInventoryBytes),
      },
      currentWorkspaceBindingReport: {
        path: CURRENT_WORKSPACE_BINDING,
        bytes: workspaceBindingBytes.length,
        sha256: sha256(workspaceBindingBytes),
        refreshedByV16: false,
      },
      immutableReconciliationReceipt: {
        path: CURRENT_RECONCILIATION_RECEIPT,
        bytes: reconciliationReceiptBytes.length,
        sha256: sha256(reconciliationReceiptBytes),
        receiptFingerprintSha256: RECONCILIATION_FINGERPRINT,
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
      frameRange: { firstFrame: 1, lastFrame: 128, oneBased: true },
      viewport: implementation.viewport,
      sourceUrl: implementation.sourceUrl,
      implementationArtifactClosure:
        implementation.implementationArtifactClosure,
    },
    comparisons,
    summary: {
      comparedFrames: comparisons.length,
      staticFrames: comparisons.filter((item) => item.kind === "static").length,
      transitionFrames: comparisons.filter((item) => item.kind === "transition")
        .length,
      regions,
      fullStrictNumericalNonRegressionFrames: comparisons.filter(
        (item) => item.v15Delta.full.strictNumericalNonRegression,
      ).length,
      headerPixelIdenticalFrames: comparisons.filter(
        (item) => item.implementationDelta.headerChangedPixels === 0,
      ).length,
      bodyPixelIdenticalFrames: comparisons.filter(
        (item) =>
          item.implementationDelta.outsideProgressRectChangedPixels === 0,
      ).length,
      bodyStrictNumericalNonRegressionFrames: comparisons.filter(
        (item) => item.v15Delta.body.strictNumericalNonRegression,
      ).length,
      bodyNonRegressionWithinBoundedToleranceFrames: comparisons.filter(
        (item) => item.v15Delta.body.nonRegressedWithinTolerance,
      ).length,
      footerStrictNumericalNonRegressionFrames: comparisons.filter(
        (item) => item.v15Delta.footer.strictNumericalNonRegression,
      ).length,
      progressRectStrictNumericalNonRegressionFrames: comparisons.filter(
        (item) => item.v15Delta.progressRect.strictNumericalNonRegression,
      ).length,
      progressWideStrictNumericalNonRegressionFrames: comparisons.filter(
        (item) => item.v15Delta.progressWide.strictNumericalNonRegression,
      ).length,
      maximumOutsideProgressRectChangedPixels: Math.max(
        ...comparisons.map(
          (item) => item.implementationDelta.outsideProgressRectChangedPixels,
        ),
      ),
      maximumOutsideProgressRectChannelDelta: Math.max(
        ...comparisons.flatMap((item) =>
          item.implementationDelta.outsideProgressRectPoints.map(
            (point) => point.maximumChannelDelta,
          ),
        ),
      ),
      maximumV15ToV16ChannelDelta: Math.max(
        ...comparisons.map(
          (item) => item.implementationDelta.maximumChannelDelta,
        ),
      ),
      allTenFramesNonRegressedWithinDocumentedContract: true,
      fixedRegistrationVerified: true,
      zeroMaskVerified: true,
      zeroResamplingVerified: true,
      currentImplementationArtifactClosureVerified: true,
      implementationBrowserCaptureClean: true,
      frozenGlobalReportsRefreshed: false,
      strictAcceptanceEffect: "none",
    },
    v15Delta,
    unresolved: [
      "The exact-PID source package remains an acceptance-neutral diagnostic, not an authorized natural runtime trace or authoritative baseline.",
      "The source-ordinal to candidate-frame pairs remain tentative phase anchors, not source-playhead telemetry or trace-bound source-frame identity.",
      "The observed progress colors support this diagnostic inverse-gamma input only; they do not establish the original runtime color pipeline.",
      "Ten spot frames do not establish complete 128-frame coverage or transition timing parity.",
      "Five later frames contain 13-14 whitelisted body antialias edge pixels changed by at most five channel levels after filtered progress recomposition; this is disclosed rather than treated as pixel identity.",
      "Static full-frame RMSE remains above 0.05 for frame 128, so this diagnostic cannot establish visual fidelity.",
      "The frozen global current-JavaScript candidate and workspace-binding reports were intentionally not refreshed during concurrent work.",
      "Audio timing and listening review, an independent Spanish trace, independent human visual review, Owner acceptance, strict completion, and atomic lesson release remain open.",
    ],
    strictAcceptanceEffect: "none",
  };
  return { report, markdown: markdown(report), diffArtifacts };
}

export async function writeG4L3Ts006ExactPidImplementationComparisonV16({
  check = false,
} = {}) {
  const {
    report,
    markdown: markdownBytes,
    diffArtifacts,
  } = await buildG4L3Ts006ExactPidImplementationComparisonV16();
  const jsonBytes = `${JSON.stringify(report, null, 2)}\n`;
  if (check) {
    const [existingJson, existingMarkdown, entries] = await Promise.all([
      readFile(projectPath(REPORT_JSON), "utf8"),
      readFile(projectPath(REPORT_MARKDOWN), "utf8"),
      readDiffDirectoryEntries(),
    ]);
    invariant(existingJson === jsonBytes, `${REPORT_JSON} is stale`);
    invariant(
      existingMarkdown === markdownBytes,
      `${REPORT_MARKDOWN} is stale`,
    );
    invariant(
      entries.every((entry) => entry.isFile() && !entry.isSymbolicLink()),
      `${DIFF_DIRECTORY} must contain only regular files`,
    );
    assertExactV16DiffArtifactSet(
      entries.map((entry) => entry.name),
      report.comparisons.map(({ fullFrameDiff }) => fullFrameDiff),
    );
    for (const artifact of diffArtifacts) {
      const existing = await readFile(projectPath(artifact.file));
      invariant(existing.equals(artifact.bytes), `${artifact.file} is stale`);
    }
    return { status: "checked", report };
  }
  await removeStaleGeneratedDiffArtifacts(diffArtifacts);
  await Promise.all([
    atomicWrite(REPORT_JSON, jsonBytes),
    atomicWrite(REPORT_MARKDOWN, markdownBytes),
    ...diffArtifacts.map((artifact) =>
      atomicWrite(artifact.file, artifact.bytes),
    ),
  ]);
  return { status: "written", report };
}

export function parseArguments(argv) {
  const options = { check: false };
  for (const argument of argv) {
    if (argument === "--check") options.check = true;
    else throw new Error(`Unknown option: ${argument}`);
  }
  return options;
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  writeG4L3Ts006ExactPidImplementationComparisonV16(
    parseArguments(process.argv.slice(2)),
  )
    .then(({ status, report }) => {
      process.stdout.write(
        `${JSON.stringify(
          {
            status,
            report: REPORT_JSON,
            summary: report.summary.regions,
            v15Delta: report.v15Delta.regions,
            allTenFramesNonRegressedWithinDocumentedContract:
              report.summary.allTenFramesNonRegressedWithinDocumentedContract,
            strictAcceptanceEffect: report.strictAcceptanceEffect,
          },
          null,
          2,
        )}\n`,
      );
    })
    .catch((error) => {
      process.stderr.write(`${error.stack || error.message}\n`);
      process.exitCode = 1;
    });
}
