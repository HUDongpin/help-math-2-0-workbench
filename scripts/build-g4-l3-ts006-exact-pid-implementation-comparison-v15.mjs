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
import { EXACT_PID_V14_PROGRESS_ANCHORS } from "./build-g4-l3-ts006-exact-pid-implementation-comparison-v14.mjs";
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
  "reports/g4-l3-ts006-exact-pid-implementation-comparison-v14.json";
const PREVIOUS_IMPLEMENTATION_MANIFEST =
  "output/playwright/g4-l3-ts006-exact-pid-comparison-v14/en-diagnostic/capture-manifest.json";
const DIAGNOSTIC_ENTRY_STATE =
  "output/playwright/g4-l3-ts006-exact-pid-comparison-v15/diagnostic-entry-state.json";
const IMPLEMENTATION_DIRECTORY =
  "output/playwright/g4-l3-ts006-exact-pid-comparison-v15/en-diagnostic";
const IMPLEMENTATION_MANIFEST = `${IMPLEMENTATION_DIRECTORY}/capture-manifest.json`;
const DIFF_DIRECTORY =
  "output/playwright/g4-l3-ts006-exact-pid-comparison-v15/diffs";
const REPORT_JSON =
  "reports/g4-l3-ts006-exact-pid-implementation-comparison-v15.json";
const REPORT_MARKDOWN =
  "reports/g4-l3-ts006-exact-pid-implementation-comparison-v15.md";

const MIGRATION_MANIFEST = "migrations/course-g04-l03-ts-006/migration.json";
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
const CURRENT_RECONCILIATION_RECEIPT = `reports/g4-l3-ts006-current-javascript-asset-inventory-reconciliations/${RECONCILIATION_FINGERPRINT}.json`;

const EXPECTED_SOURCE_ANALYSIS_SHA256 =
  "5513c4d9ebd3658575ebe98f1a934eb18766c7006551d3cf6d52503175a9e0cf";
const EXPECTED_SOURCE_MANIFEST_SHA256 =
  "2e2154fd5af712a388fead07e91303c017167152ca1aa7db9f96a31ce6e3c313";
const EXPECTED_PREVIOUS_REPORT_SHA256 =
  "5344271d59900cbca05da573b5d1c80170f1e776b02d08245c85447a20d3009c";
const EXPECTED_PREVIOUS_IMPLEMENTATION_MANIFEST_SHA256 =
  "c719c18f57b89d2f797a2feca24e96fba3c3805fcc75b6731afaf8191c133547";
const EXPECTED_ENTRY_STATE_SHA256 =
  "a14e060d9f13b7e9f31991c1c24d79beacf4869802df897f9fdbb2eeed2f47d6";
const EXPECTED_IMPLEMENTATION_MANIFEST_SHA256 =
  "1b38b0007c5f273ccc30d6c1a788412404c4d82940ed8b35115b814d7ef381eb";
const EXPECTED_CURRENT_JS_CANDIDATE_REPORT_SHA256 =
  "80fbe8cf9b283a0a411477cc6602a1968e4e1af924ce02c93923794751634398";
const EXPECTED_CURRENT_JS_ASSET_MANIFEST_SHA256 =
  "3e53077860ab9e6f9aeea22989770d2605e8ccd8b56e124342cf536a4c8200de";
const EXPECTED_CURRENT_ASSET_INVENTORY_SHA256 =
  "c65960d0ef5abeac6a7853dcdcc4c1c94e08a5adf6a89ee3b4aa96e9d3488a76";
const EXPECTED_CURRENT_WORKSPACE_BINDING_SHA256 =
  "cca3b07fe65d4b024671dcef27641a2c1115b7ccabcf9e87e62a8a121f72ba6c";
const EXPECTED_CURRENT_RECONCILIATION_RECEIPT_SHA256 =
  "8db62a42c6a2cd48c0a4cf6dcf45941981a8246e44923600fcb6ff918e864eca";
const EXPECTED_PREVIOUS_ASSET_MANIFEST_SHA256 =
  "6d27769d685dcb37b1177d97300311eb3f981929d1f9bbebc1f7cb430fba7063";

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

export function validateV15ImplementationClosureDelta({
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
      JSON.stringify(changed) === JSON.stringify([CURRENT_JS_ASSET_MANIFEST]),
    "v15 closure may differ from v14 only by the reconciled public manifest",
  );
  invariant(
    previous.get(CURRENT_JS_ASSET_MANIFEST)?.sha256 ===
      EXPECTED_PREVIOUS_ASSET_MANIFEST_SHA256 &&
      current.get(CURRENT_JS_ASSET_MANIFEST)?.sha256 ===
        EXPECTED_CURRENT_JS_ASSET_MANIFEST_SHA256,
    "v15 public manifest closure transition drifted",
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
    "v15 closure projections drifted from v14",
  );
  invariant(
    [...current.keys()].every(
      (item) =>
        !item.includes("full-frame") &&
        !item.includes("region-strip") &&
        !item.startsWith("output/") &&
        !item.startsWith("artifacts/"),
    ),
    "v15 closure introduced a prohibited full-frame or region-strip asset",
  );
  return {
    added,
    removed,
    changed,
    transition: {
      path: CURRENT_JS_ASSET_MANIFEST,
      priorSha256: EXPECTED_PREVIOUS_ASSET_MANIFEST_SHA256,
      currentSha256: EXPECTED_CURRENT_JS_ASSET_MANIFEST_SHA256,
      rendererChangedByV15: false,
      timelineChangedByV15: false,
      strictAcceptanceEffect: "none",
    },
  };
}

export function validateV15CurrentBindings({
  candidate,
  assetManifest,
  workspaceBinding,
  reconciliationReceipt,
  entryState,
}) {
  invariant(
    candidate?.reportType === "current-javascript-engineering-candidate" &&
      candidate.animationId === ANIMATION_ID &&
      candidate.disposition?.currentJavaScriptCandidate === true &&
      candidate.disposition?.strictMigrationComplete === false &&
      candidate.disposition?.publicLibraryAdmitted === false &&
      candidate.outputs?.canvasManifest?.path === CURRENT_JS_ASSET_MANIFEST &&
      candidate.outputs.canvasManifest.sha256 ===
        EXPECTED_CURRENT_JS_ASSET_MANIFEST_SHA256,
    "current-JavaScript candidate binding drifted",
  );
  invariant(
    assetManifest?.animationId === ANIMATION_ID &&
      assetManifest.status ===
        "source-static-current-javascript-engineering-candidate-only" &&
      assetManifest.prototypeRegistryOnly === true &&
      assetManifest.acceptance?.strictMigrationComplete === false &&
      assetManifest.strictAcceptanceEffect === "none",
    "current public asset manifest boundary drifted",
  );
  invariant(
    workspaceBinding?.reportType ===
      "g4-l3-ts006-current-javascript-workspace-binding" &&
      workspaceBinding.scope?.animationId === ANIMATION_ID &&
      workspaceBinding.sourceBindings?.currentJavascriptCandidate?.path ===
        CURRENT_JS_CANDIDATE_REPORT &&
      workspaceBinding.sourceBindings.currentJavascriptCandidate.sha256 ===
        EXPECTED_CURRENT_JS_CANDIDATE_REPORT_SHA256 &&
      workspaceBinding.strictAcceptanceEffect.startsWith("none;") &&
      Array.isArray(workspaceBinding.refreshHistory) &&
      workspaceBinding.refreshHistory.length === 21,
    "current workspace-binding report identity drifted",
  );
  const refreshIndex =
    entryState.currentImplementationBindings.workspaceBindingReport
      .refreshHistoryIndex;
  const refresh = workspaceBinding.refreshHistory[refreshIndex];
  invariant(
    refreshIndex === 20 &&
      refresh?.inventoryObserverReconciliation?.status ===
        "cross-writer-lineage-verified-observer-remains-stale" &&
      refresh.inventoryObserverReconciliation.conflictPreserved === true &&
      refresh.inventoryObserverReconciliation
        .specializedWriterNextAssetInventory.sha256 ===
        EXPECTED_CURRENT_ASSET_INVENTORY_SHA256 &&
      refresh.inventoryObserverReconciliation.currentJavascriptCandidate
        .sha256 === EXPECTED_CURRENT_JS_CANDIDATE_REPORT_SHA256 &&
      refresh.inventoryObserverReconciliation.candidateAssetManifest.sha256 ===
        EXPECTED_CURRENT_JS_ASSET_MANIFEST_SHA256 &&
      refresh.inventoryObserverReconciliation.strictAcceptanceEffect ===
        "none" &&
      refresh.immutableReconciliationReceipt?.path ===
        CURRENT_RECONCILIATION_RECEIPT &&
      refresh.immutableReconciliationReceipt.sha256 ===
        EXPECTED_CURRENT_RECONCILIATION_RECEIPT_SHA256 &&
      refresh.immutableReconciliationReceipt.receiptFingerprintSha256 ===
        RECONCILIATION_FINGERPRINT,
    "workspace-binding reconciliation application proof drifted",
  );
  invariant(
    reconciliationReceipt?.receiptType ===
      "g4-l3-ts006-current-javascript-asset-inventory-cross-writer-reconciliation-intent" &&
      reconciliationReceipt.receiptFingerprintSha256 ===
        RECONCILIATION_FINGERPRINT &&
      reconciliationReceipt.reconciliation?.status ===
        "cross-writer-lineage-verified-observer-remains-stale" &&
      reconciliationReceipt.reconciliation.conflictPreserved === true &&
      reconciliationReceipt.reconciliation.specializedWriterNextAssetInventory
        .sha256 === EXPECTED_CURRENT_ASSET_INVENTORY_SHA256 &&
      reconciliationReceipt.reconciliation.currentJavascriptCandidate.sha256 ===
        EXPECTED_CURRENT_JS_CANDIDATE_REPORT_SHA256 &&
      reconciliationReceipt.reconciliation.candidateAssetManifest.sha256 ===
        EXPECTED_CURRENT_JS_ASSET_MANIFEST_SHA256 &&
      reconciliationReceipt.strictAcceptanceEffect === "none",
    "immutable reconciliation receipt semantics drifted",
  );
  const bindings = entryState.currentImplementationBindings;
  invariant(
    bindings?.currentJavascriptCandidateReport?.path ===
      CURRENT_JS_CANDIDATE_REPORT &&
      bindings.currentJavascriptCandidateReport.sha256 ===
        EXPECTED_CURRENT_JS_CANDIDATE_REPORT_SHA256 &&
      bindings.publicAssetManifest?.path === CURRENT_JS_ASSET_MANIFEST &&
      bindings.publicAssetManifest.sha256 ===
        EXPECTED_CURRENT_JS_ASSET_MANIFEST_SHA256 &&
      bindings.assetInventory?.path === CURRENT_ASSET_INVENTORY &&
      bindings.assetInventory.sha256 ===
        EXPECTED_CURRENT_ASSET_INVENTORY_SHA256 &&
      bindings.workspaceBindingReport?.path === CURRENT_WORKSPACE_BINDING &&
      bindings.workspaceBindingReport.sha256 ===
        EXPECTED_CURRENT_WORKSPACE_BINDING_SHA256 &&
      bindings.immutableReconciliationReceipt?.path ===
        CURRENT_RECONCILIATION_RECEIPT &&
      bindings.immutableReconciliationReceipt.sha256 ===
        EXPECTED_CURRENT_RECONCILIATION_RECEIPT_SHA256 &&
      bindings.immutableReconciliationReceipt.receiptFingerprintSha256 ===
        RECONCILIATION_FINGERPRINT &&
      bindings.inventoryObserverConflictPreserved === true &&
      bindings.rendererOrTimelineChangedByV15 === false &&
      bindings.inventoryChangedByV15 === false &&
      bindings.ledgerChangedByV15 === false &&
      bindings.reviewChangedByV15 === false &&
      bindings.releaseStateChangedByV15 === false &&
      bindings.strictAcceptanceEffect === "none",
    "v15 entry-state current implementation bindings drifted",
  );
  return true;
}

export function validateExactPidV15Inputs({
  analysis,
  source,
  previousReport,
  previousImplementation,
  entryState,
  implementation,
}) {
  invariant(
    analysis?.reportType ===
      "g4-l3-ts006-exact-pid-replay-complete-diagnostic-v10" &&
      analysis.animationId === ANIMATION_ID &&
      analysis.status ===
        "verified-acceptance-neutral-diagnostic-not-promotion-eligible" &&
      analysis.strictAcceptanceEffect === "none" &&
      allBooleanValuesFalse(analysis.authority),
    "source analysis must remain acceptance-neutral and non-authoritative",
  );
  invariant(
    source?.status === "raw-capture-not-yet-bound-to-runtime-trace" &&
      source.runtimeAuthorityClaimed === false &&
      source.acceptanceEffect === "none" &&
      source.display?.includedProcessID === 97581 &&
      source.droppedOrIncompleteFrameCount === 0 &&
      Array.isArray(source.frames) &&
      source.frames.length === 537 &&
      source.frames.every(
        (frame, index) =>
          frame.ordinal === index + 1 &&
          frame.status === "complete" &&
          frame.width === 800 &&
          frame.height === 600 &&
          frame.file ===
            `frames/frame-${String(index + 1).padStart(6, "0")}.png` &&
          /^[a-f0-9]{64}$/u.test(frame.sha256),
      ),
    "source capture must remain the complete raw exact-PID diagnostic",
  );
  invariant(
    previousReport?.reportType ===
      "g4-l3-ts006-exact-pid-implementation-comparison-v14" &&
      previousReport.animationId === ANIMATION_ID &&
      previousReport.classification ===
        "acceptance-neutral-source-supported-renderer-refinement-fixed-registration-zero-mask-diagnostic" &&
      previousReport.strictAcceptanceEffect === "none" &&
      previousReport.summary?.comparedFrames === 10 &&
      previousReport.summary?.fixedRegistrationVerified === true &&
      previousReport.summary?.zeroMaskVerified === true &&
      previousReport.authority?.authoritativeBaselineClaimed === false &&
      previousReport.authority?.implementationCandidatePromoted === false,
    "v14 comparison report identity or boundary drifted",
  );
  invariant(
    previousImplementation?.schemaVersion ===
      IMPLEMENTATION_CAPTURE_SCHEMA_VERSION &&
      previousImplementation.status === "complete" &&
      previousImplementation.animationId === ANIMATION_ID &&
      previousImplementation.requirementId ===
        "diagnostic:ts006:exact-pid-v14:en",
    "v14 implementation capture identity drifted",
  );
  invariant(
    entryState?.stateId ===
      "course-g04-l03-ts-006-exact-pid-v15-current-implementation-binding-context" &&
      entryState.animationId === ANIMATION_ID &&
      entryState.classification ===
        "acceptance-neutral-diagnostic-entry-context-not-original-runtime-entry-state" &&
      entryState.previousDiagnostic?.comparisonReport?.path ===
        PREVIOUS_REPORT &&
      entryState.previousDiagnostic.comparisonReport.sha256 ===
        EXPECTED_PREVIOUS_REPORT_SHA256 &&
      entryState.previousDiagnostic?.implementationCaptureManifest?.path ===
        PREVIOUS_IMPLEMENTATION_MANIFEST &&
      entryState.previousDiagnostic.implementationCaptureManifest.sha256 ===
        EXPECTED_PREVIOUS_IMPLEMENTATION_MANIFEST_SHA256 &&
      entryState.implementationContext?.frameDomain === "sprite-23" &&
      entryState.implementationContext?.rootFrame === 6 &&
      entryState.implementationContext?.candidateFrameRange?.firstFrame === 1 &&
      entryState.implementationContext?.candidateFrameRange?.lastFrame ===
        128 &&
      entryState.implementationContext?.candidateFrameRange?.oneBased ===
        true &&
      entryState.implementationContext?.viewport?.width === 800 &&
      entryState.implementationContext?.viewport?.height === 600 &&
      entryState.implementationContext?.viewport?.deviceScaleFactor === 1 &&
      entryState.mapping?.method ===
        "operator-selected-piecewise-diagnostic-anchors" &&
      entryState.mapping?.status ===
        "tentative-not-trace-bound-not-source-playhead-authority" &&
      entryState.mapping?.interpolationAuthorized === false &&
      JSON.stringify(entryState.mapping.anchors) ===
        JSON.stringify(projectedAnchors(EXACT_PID_V10_KEYFRAME_PAIRS)) &&
      entryState.comparisonIncrement?.status ===
        "acceptance-neutral-current-binding-recapture-not-renderer-refinement" &&
      entryState.comparisonIncrement?.rendererChanged === false &&
      entryState.comparisonIncrement?.timelineChanged === false &&
      entryState.comparisonIncrement?.wholeFrameOrRegionAssetUsed === false &&
      entryState.comparisonIncrement
        ?.currentImplementationArtifactClosureRequired === true &&
      entryState.comparisonIncrement?.nonRegressionAgainstV14Required ===
        true &&
      entryState.comparisonIncrement?.strictAcceptanceEffect === "none" &&
      allBooleanValuesFalse(entryState.authority) &&
      entryState.strictAcceptanceEffect === "none",
    "v15 entry-state identity, mapping, scope, or authority drifted",
  );
  invariant(
    implementation?.schemaVersion === IMPLEMENTATION_CAPTURE_SCHEMA_VERSION &&
      implementation.status === "complete" &&
      implementation.animationId === ANIMATION_ID &&
      implementation.frameDomainId === "sprite-23" &&
      implementation.requestedFrameDomain === "sprite-23" &&
      implementation.requirementId === "diagnostic:ts006:exact-pid-v15:en" &&
      implementation.traceId ===
        "diagnostic:exact-pid-v15:current-implementation-recapture:en:seed-0" &&
      implementation.entryStateSha256 === EXPECTED_ENTRY_STATE_SHA256 &&
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
      ).length === 0,
    "v15 implementation capture identity drifted",
  );
  invariant(
    Array.isArray(implementation.captured) &&
      implementation.captured.length === EXACT_PID_V10_KEYFRAME_PAIRS.length &&
      implementation.captured.every((frame, index) => {
        const expected = EXACT_PID_V10_KEYFRAME_PAIRS[index];
        const previous = previousImplementation.captured[index];
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
          frame.visualTarget?.rootFrame === 6 &&
          frame.visualTarget?.frameDomainId === "sprite-23" &&
          frame.visualTarget?.reportedFrame === expected.candidateFrame &&
          frame.visualTarget?.requirementId === implementation.requirementId &&
          frame.visualTarget?.traceId === implementation.traceId &&
          frame.visualTarget?.entryStateSha256 ===
            implementation.entryStateSha256 &&
          frame.visualTarget?.scenario === implementation.scenario &&
          frame.visualTarget?.language === implementation.language &&
          frame.visualTarget?.seed === implementation.seed &&
          frame.sha256 === previous?.sha256 &&
          frameUrl.searchParams.get("frame") ===
            String(expected.candidateFrame) &&
          frameUrl.searchParams.get("frameDomain") === "sprite-23" &&
          frameUrl.searchParams.get("requirementId") ===
            implementation.requirementId &&
          frameUrl.searchParams.get("trace") === implementation.traceId &&
          frameUrl.searchParams.get("entryStateSha256") ===
            implementation.entryStateSha256 &&
          frameUrl.searchParams.get("scenario") === implementation.scenario &&
          frameUrl.searchParams.get("lang") === implementation.language &&
          frameUrl.searchParams.get("seed") === implementation.seed
        );
      }),
    "v15 implementation frames, rendered identities, or v14 pixel identity drifted",
  );
  invariant(
    implementation.consoleErrors?.length === 0 &&
      implementation.failedRequests?.length === 0 &&
      implementation.httpErrors?.length === 0 &&
      implementation.unexpectedRequests?.length === 0 &&
      implementation.error === null,
    "v15 implementation capture contains browser or network errors",
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

function delta(previous, current) {
  const absoluteReduction = round(previous - current);
  return {
    previous: round(previous),
    current: round(current),
    absoluteReduction,
    relativeReductionPercent:
      previous === 0 ? 0 : round((absoluteReduction / previous) * 100),
    pixelIdenticalMetric: previous === current,
    nonRegressed: current <= previous,
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
    "expected diff artifact names are invalid or duplicated",
  );
  return names.sort();
}

export function assertExactV15DiffArtifactSet(actualNames, diffArtifacts) {
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
        `| ${item.candidateFrame} | ${item.sourceCaptureOrdinal} | ${item.kind} | ` +
        `${item.rmse.full.normalizedRmse.toFixed(6)} | ` +
        `${item.rmse.body.normalizedRmse.toFixed(6)} | ` +
        `${item.rmse.header.normalizedRmse.toFixed(6)} | ` +
        `${item.rmse.footer.normalizedRmse.toFixed(6)} | ` +
        `${item.v14Delta.full.absoluteReduction.toFixed(6)} |`,
    )
    .join("\n");
  const summary = Object.entries(report.summary.regions)
    .map(
      ([id, value]) =>
        `- ${id}: mean ${value.mean.toFixed(6)}; max ${value.max.toFixed(6)}; ` +
        `v14-to-v15 reduction ` +
        `${report.v14Delta.regions[id].absoluteReduction.toFixed(6)} ` +
        `(${report.v14Delta.regions[id].relativeReductionPercent.toFixed(2)}%)`,
    )
    .join("\n");
  return (
    `# G4 L3 TS006 exact-PID implementation comparison v15\n\n` +
    `Status: **acceptance-neutral current-implementation recapture diagnostic; not an authoritative baseline, fidelity acceptance, strict completion, or release evidence**.\n\n` +
    `## Current implementation binding\n\n` +
    `- Candidate report: \`${report.bindings.currentJavascriptCandidateReport.sha256}\`\n` +
    `- Public manifest: \`${report.bindings.currentPublicAssetManifest.sha256}\`\n` +
    `- Asset inventory: \`${report.bindings.currentAssetInventory.sha256}\`\n` +
    `- Workspace binding: \`${report.bindings.currentWorkspaceBindingReport.sha256}\`\n` +
    `- Reconciliation receipt fingerprint: \`${report.bindings.immutableReconciliationReceipt.receiptFingerprintSha256}\`\n` +
    `- The inventory-observer conflict remains preserved. v15 changed no renderer, timeline, inventory, ledger, review, or release state.\n\n` +
    `## Fixed-registration, zero-mask RGB RMSE\n\n` +
    `Every RGB pixel is compared at fixed (0,0) registration. No translation search, resampling, clipping, exclusion rectangle, alpha mask, or spatial mask is applied. The ten pairs remain tentative diagnostic anchors rather than source-playhead telemetry. The v15 browser pixels are byte-identical to v14 at all ten frames.\n\n` +
    `| Candidate | Source ordinal | Kind | Full | Body | Header | Footer | Full reduction vs v14 |\n` +
    `|---:|---:|---|---:|---:|---:|---:|---:|\n${rows}\n\n` +
    `## Summary\n\n${summary}\n\n` +
    `- Per-frame non-regression: ${report.summary.nonRegressionFrames}/10 across full, body, header, and footer.\n` +
    `- Browser capture: clean\n` +
    `- Current implementation artifact closure: verified\n` +
    `- Strict acceptance effect: **none**\n\n` +
    `## Unresolved acceptance gates\n\n` +
    `${report.unresolved.map((item) => `- ${item}`).join("\n")}\n`
  );
}

export async function buildG4L3Ts006ExactPidImplementationComparisonV15() {
  const [
    { bytes: analysisBytes, value: analysis },
    { bytes: sourceBytes, value: source },
    { bytes: previousReportBytes, value: previousReport },
    { bytes: previousImplementationBytes, value: previousImplementation },
    { bytes: entryStateBytes, value: entryState },
    { bytes: implementationBytes, value: implementation },
    { bytes: migrationBytes, value: migration },
    { bytes: candidateBytes, value: candidate },
    { bytes: assetManifestBytes, value: assetManifest },
    { bytes: assetInventoryBytes },
    { bytes: workspaceBindingBytes, value: workspaceBinding },
    { bytes: reconciliationReceiptBytes, value: reconciliationReceipt },
  ] = await Promise.all([
    readJson(SOURCE_ANALYSIS),
    readJson(SOURCE_MANIFEST),
    readJson(PREVIOUS_REPORT),
    readJson(PREVIOUS_IMPLEMENTATION_MANIFEST),
    readJson(DIAGNOSTIC_ENTRY_STATE),
    readJson(IMPLEMENTATION_MANIFEST),
    readJson(MIGRATION_MANIFEST),
    readJson(CURRENT_JS_CANDIDATE_REPORT),
    readJson(CURRENT_JS_ASSET_MANIFEST),
    readFile(projectPath(CURRENT_ASSET_INVENTORY)).then((bytes) => ({ bytes })),
    readJson(CURRENT_WORKSPACE_BINDING),
    readJson(CURRENT_RECONCILIATION_RECEIPT),
  ]);
  const expectedHashes = [
    [analysisBytes, EXPECTED_SOURCE_ANALYSIS_SHA256, "source analysis"],
    [sourceBytes, EXPECTED_SOURCE_MANIFEST_SHA256, "source capture manifest"],
    [previousReportBytes, EXPECTED_PREVIOUS_REPORT_SHA256, "v14 report"],
    [
      previousImplementationBytes,
      EXPECTED_PREVIOUS_IMPLEMENTATION_MANIFEST_SHA256,
      "v14 implementation manifest",
    ],
    [entryStateBytes, EXPECTED_ENTRY_STATE_SHA256, "v15 entry state"],
    [
      implementationBytes,
      EXPECTED_IMPLEMENTATION_MANIFEST_SHA256,
      "v15 implementation manifest",
    ],
    [
      candidateBytes,
      EXPECTED_CURRENT_JS_CANDIDATE_REPORT_SHA256,
      "current-JavaScript candidate",
    ],
    [
      assetManifestBytes,
      EXPECTED_CURRENT_JS_ASSET_MANIFEST_SHA256,
      "current public asset manifest",
    ],
    [
      assetInventoryBytes,
      EXPECTED_CURRENT_ASSET_INVENTORY_SHA256,
      "current asset inventory",
    ],
    [
      workspaceBindingBytes,
      EXPECTED_CURRENT_WORKSPACE_BINDING_SHA256,
      "current workspace-binding report",
    ],
    [
      reconciliationReceiptBytes,
      EXPECTED_CURRENT_RECONCILIATION_RECEIPT_SHA256,
      "immutable reconciliation receipt",
    ],
  ];
  for (const [bytes, expected, label] of expectedHashes) {
    invariant(sha256(bytes) === expected, `${label} hash drifted`);
  }
  invariant(
    implementation.entryStateSha256 === sha256(entryStateBytes),
    "v15 capture does not bind the diagnostic entry-state digest",
  );
  validateExactPidV15Inputs({
    analysis,
    source,
    previousReport,
    previousImplementation,
    entryState,
    implementation,
  });
  validateV15CurrentBindings({
    candidate,
    assetManifest,
    workspaceBinding,
    reconciliationReceipt,
    entryState,
  });
  const closureDelta = validateV15ImplementationClosureDelta({
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
  const closureFreshnessErrors = implementationArtifactClosureErrors(
    implementation.implementationArtifactClosure,
    currentClosure,
  );
  invariant(
    closureFreshnessErrors.length === 0,
    `v15 implementation closure is stale: ${closureFreshnessErrors.join("; ")}`,
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
        item.candidateFrame === pair.candidateFrame &&
        item.sourceCaptureOrdinal === pair.sourceCaptureOrdinal,
    );
    invariant(
      sourceFrame?.ordinal === pair.sourceCaptureOrdinal &&
        implementationFrame &&
        previousComparison,
      "diagnostic comparison frame lookup drifted",
    );
    const sourceFile = `${SOURCE_DIRECTORY}/${sourceFrame.file}`;
    const implementationFile = `${IMPLEMENTATION_DIRECTORY}/${implementationFrame.file}`;
    const [{ png: sourcePng }, { png: implementationPng }] = await Promise.all([
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
    const v14Delta = Object.fromEntries(
      Object.keys(EXACT_PID_V10_REGIONS).map((regionId) => [
        regionId,
        delta(
          previousComparison.rmse[regionId].normalizedRmse,
          rmse[regionId].normalizedRmse,
        ),
      ]),
    );
    const diff = makeFullFrameDiff(sourcePng, implementationPng);
    const diffFile =
      `${DIFF_DIRECTORY}/source-${String(pair.sourceCaptureOrdinal).padStart(6, "0")}` +
      `-implementation-${String(pair.candidateFrame).padStart(3, "0")}.png`;
    diffArtifacts.push({ file: diffFile, bytes: diff.bytes });
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
      implementationPixelIdenticalToV14: true,
      registrationOffset: { x: 0, y: 0 },
      pixelMaskApplied: false,
      excludedPixelCount: 0,
      resamplingApplied: false,
      rmse,
      v14Delta,
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
  const v14Delta = {
    comparisonReportSha256: sha256(previousReportBytes),
    regions: Object.fromEntries(
      Object.keys(EXACT_PID_V10_REGIONS).map((regionId) => [
        regionId,
        delta(
          previousReport.summary.regions[regionId].mean,
          regions[regionId].mean,
        ),
      ]),
    ),
    perFrame: comparisons.map((item) => ({
      candidateFrame: item.candidateFrame,
      sourceCaptureOrdinal: item.sourceCaptureOrdinal,
      ...item.v14Delta,
    })),
  };
  const allRegions = Object.keys(EXACT_PID_V10_REGIONS);
  const nonRegressionFrames = comparisons.filter((item) =>
    allRegions.every((regionId) => item.v14Delta[regionId].nonRegressed),
  ).length;
  invariant(
    nonRegressionFrames === comparisons.length &&
      allRegions.every(
        (regionId) =>
          v14Delta.regions[regionId].nonRegressed &&
          v14Delta.regions[regionId].pixelIdenticalMetric,
      ),
    "v15 must be non-regressive and metric-identical to v14",
  );

  const scriptBytes = await readFile(SCRIPT_PATH);
  const report = {
    schemaVersion: 1,
    reportType: "g4-l3-ts006-exact-pid-implementation-comparison-v15",
    animationId: ANIMATION_ID,
    classification:
      "acceptance-neutral-current-binding-recapture-fixed-registration-zero-mask-diagnostic",
    boundedIncrement: {
      status: entryState.comparisonIncrement.status,
      scope: entryState.comparisonIncrement.scope,
      sourceBasis: entryState.comparisonIncrement.sourceBasis,
      rendererChanged: false,
      timelineChanged: false,
      implementationAssetsAdded: false,
      sourceStaticPathAffected: false,
      rootOrNestedFrameDomainChanged: false,
      oneBasedFrameContractChanged: false,
      prohibitedRasterSubstitution: {
        wholeFrameOrRegionAssetUsed: false,
      },
      currentImplementationArtifactClosureVerified: true,
      implementationClosureDelta: closureDelta,
      inventoryObserverConflictPreserved: true,
      originalRuntimeGeometryEstablished: false,
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
    comparisonContract: {
      stage: { width: 800, height: 600 },
      regions: EXACT_PID_V10_REGIONS,
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
      currentJavascriptCandidateReport: {
        path: CURRENT_JS_CANDIDATE_REPORT,
        bytes: candidateBytes.length,
        sha256: sha256(candidateBytes),
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
        reconciliationApplicationProofRefreshHistoryIndex: 20,
      },
      immutableReconciliationReceipt: {
        path: CURRENT_RECONCILIATION_RECEIPT,
        bytes: reconciliationReceiptBytes.length,
        sha256: sha256(reconciliationReceiptBytes),
        receiptFingerprintSha256: RECONCILIATION_FINGERPRINT,
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
      nonRegressionFrames,
      allTenFramesNonRegressed: nonRegressionFrames === 10,
      allTenImplementationFramesPixelIdenticalToV14: true,
      informationalFullFrameThresholdPasses: comparisons.filter(
        (item) => item.informationalFullFrameThresholdPassed,
      ).length,
      fixedRegistrationVerified: true,
      zeroMaskVerified: true,
      zeroResamplingVerified: true,
      currentImplementationArtifactClosureVerified: true,
      implementationBrowserCaptureClean: true,
      strictAcceptanceEffect: "none",
    },
    v14Delta,
    unresolved: [
      "The exact-PID source package remains an acceptance-neutral diagnostic, not an authorized natural runtime trace or authoritative baseline.",
      "The source-ordinal to candidate-frame pairs remain tentative phase anchors, not source-playhead telemetry or trace-bound source-frame identity.",
      "The eight observed block colors and positions do not establish an active page ordinal, page-number mapping, or navigation semantics.",
      "Ten spot frames do not establish complete 128-frame coverage or transition timing parity.",
      "The sRGB gamma projection is an empirical diagnostic fit; no original-runtime color pipeline or display-transfer telemetry has been established.",
      "Static full-frame RMSE remains above 0.05 for frame 128, so this diagnostic cannot establish visual fidelity.",
      "The inventory observer remains intentionally stale relative to the specialized current-JavaScript inventory writer; the immutable reconciliation receipt preserves that conflict without rewriting the observer.",
      "Audio timing and listening review, an independent Spanish trace, independent human visual review, Owner acceptance, strict completion, and atomic lesson release remain open.",
    ],
    strictAcceptanceEffect: "none",
  };
  return { report, markdown: markdown(report), diffArtifacts };
}

export async function writeG4L3Ts006ExactPidImplementationComparisonV15({
  check = false,
} = {}) {
  const {
    report,
    markdown: markdownBytes,
    diffArtifacts,
  } = await buildG4L3Ts006ExactPidImplementationComparisonV15();
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
    assertExactV15DiffArtifactSet(
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
  writeG4L3Ts006ExactPidImplementationComparisonV15(
    parseArguments(process.argv.slice(2)),
  )
    .then(({ status, report }) => {
      process.stdout.write(
        `${JSON.stringify(
          {
            status,
            report: REPORT_JSON,
            summary: report.summary.regions,
            v14Delta: report.v14Delta.regions,
            allTenFramesNonRegressed: report.summary.allTenFramesNonRegressed,
            allTenImplementationFramesPixelIdenticalToV14:
              report.summary.allTenImplementationFramesPixelIdenticalToV14,
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
