#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {lstat, mkdir, readFile, realpath, rename, writeFile} from
  'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
const OUTPUT = 'output/playwright/g678-current-js-354-v1/evidence.json';
const OUTPUT_DIRECTORY = path.dirname(OUTPUT);
const PREDECESSOR = 'output/playwright/g678-current-js-342-v1/evidence.json';
const INCREMENTAL =
  'output/playwright/g678-alg-l11-tranche1-354-v1/evidence.json';
const FREEZE =
  'catalog/product-bridge-calibrations/g678-current-js-354-page-registration-v1.json';
const COMPATIBILITY =
  'catalog/g678-final342-current-bridge-successor-compatibility-v1.json';
const COMPATIBILITY_SHA256 =
  'fbe4fb77634a6fa84fbc7f6a2d486c78e20a0f5641332267f436dd78df81aeb8';
const IDS = Object.freeze([
  'shared-alg001-l11-p001', 'shared-alg001-l11-p002',
  'shared-alg001-l11-p003', 'shared-alg001-l11-p004',
  'shared-alg001-l11-p007', 'shared-alg001-l11-p013',
  'shared-alg001-l11-p016', 'shared-alg001-l11-p017',
  'shared-alg001-l11-p018', 'shared-alg001-l11-p022',
  'shared-alg001-l11-p023', 'shared-alg001-l11-p024',
]);
const PRIOR_HOST_REGRESSION_IDS = Object.freeze([
  'shared-alg001-l11-p005', 'shared-alg001-l11-p012',
]);
const FALSE_EFFECTS = Object.freeze({
  authoritativeOriginalRuntime: false,
  behaviorAccepted: false,
  visualFidelityAccepted: false,
  audioAccepted: false,
  humanVisualAccepted: false,
  ownerAccepted: false,
  strictComplete: false,
  releaseEligible: false,
  released: false,
  published: false,
});

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function stableBytes(value) {
  return Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
}

function exact(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function projectPath(relativePath) {
  const target = path.resolve(ROOT, relativePath);
  invariant(target.startsWith(`${ROOT}${path.sep}`),
    `${relativePath} escapes project root`);
  return target;
}

async function binding(relativePath, json = false) {
  const target = projectPath(relativePath);
  const [canonical, before] = await Promise.all([
    realpath(target), lstat(target, {bigint: true}),
  ]);
  invariant(canonical === target && before.isFile() &&
    !before.isSymbolicLink() && before.nlink === 1n,
  `${relativePath} must be one canonical ordinary single-link file`);
  const buffer = await readFile(target);
  const after = await lstat(target, {bigint: true});
  invariant(before.dev === after.dev && before.ino === after.ino &&
    before.size === after.size && before.mtimeNs === after.mtimeNs &&
    before.mode === after.mode && before.nlink === after.nlink,
  `${relativePath} changed during read`);
  return Object.freeze({path: relativePath, bytes: buffer.length,
    sha256: sha256(buffer), buffer,
    ...(json ? {value: JSON.parse(buffer.toString('utf8'))} : {})});
}

function descriptor(value) {
  return Object.freeze({path: value.path, bytes: value.bytes,
    sha256: value.sha256});
}

async function expectedArtifact() {
  const [predecessor, incremental, freeze, compatibility, builder] =
    await Promise.all([
    binding(PREDECESSOR, true), binding(INCREMENTAL, true),
    binding(FREEZE, true), binding(COMPATIBILITY, true),
    binding(path.relative(ROOT, SCRIPT_PATH)),
  ]);
  const previous = predecessor.value;
  const focused = incremental.value;
  const successor = compatibility.value;
  invariant(previous.artifactType === 'g678-current-js-342-browser-qa-v1' &&
    previous.registeredCurrentJsPages === 342 &&
    previous.samples.length === 92 && previous.screenshots.length === 96 &&
    focused.artifactType === 'g678-alg-l11-tranche1-browser-qa-v1' &&
    focused.registeredCurrentJsPages === 354 &&
    focused.allLessons.registeredPageSum === 354 &&
    focused.allLessons.sharedCardCount === 44 &&
    focused.allLessons.linkedCardCount === 0 &&
    exact(focused.allLessons.completeLessonKeys, ['shared-alg001-l09']) &&
    exact(focused.allLessons.algL09,
      {registeredPageCount: 41, activePageCount: 41, complete: true}) &&
    exact(focused.allLessons.algL11,
      {registeredPageCount: 21, activePageCount: 44, complete: false}) &&
    focused.introTerminal.pages.length === 4 &&
    focused.simpleGlossary.pages.length === 8 &&
    focused.screenshots.length === 15 &&
    focused.introTerminal.exactGlossaryButtonCount === 8 &&
    focused.simpleGlossary.exactGlossaryButtonCount === 40 &&
    focused.glossaryPauseTransitions
      .liveRunningOpenCloseResultCount === 11 &&
    focused.glossaryPauseTransitions
      .liveInspectedOpenCloseResultCount === 37 &&
    focused.glossaryPauseTransitions
      .runningOpenPausesAndCloseResumesLivePassed === true &&
    focused.glossaryPauseTransitions
      .inspectedOpenCloseRemainsPausedLivePassed === true &&
    focused.glossaryPauseTransitions
      .inspectedSeekFrameAndInspectionIdentityLivePassed === true &&
    focused.glossaryPauseTransitions
      .inspectedNextSeekWithoutNormalizationLivePassed === true &&
    focused.glossaryPauseTransitions.replayResetLivePassed === true &&
    focused.glossaryPauseTransitions
      .fullBlockedAndNestedBrowserCoverageClaimed === false &&
    focused.glossaryPauseTransitions
      .fullNavigationResetBrowserCoverageClaimed === false &&
    focused.requestPolicy.allObservedRequestsLoopback === true &&
    focused.requestPolicy.allObservedRequestsExplicitlyAllowed === true &&
    focused.requestPolicy.legacyNetworkOperationsObserved === 0 &&
    focused.priorCurrentHostGlossaryRegressions.placementCount === 2 &&
    exact(focused.priorCurrentHostGlossaryRegressions.placementIds,
      PRIOR_HOST_REGRESSION_IDS) &&
    focused.priorCurrentHostGlossaryRegressions
      .exactUnicodeInequalityDefinitionVisible === true &&
    focused.priorCurrentHostGlossaryRegressions
      .typedHostPauseCloseFocusPassed === true &&
    focused.priorCurrentHostGlossaryRegressions.replayResetPassed === true &&
    focused.priorCurrentHostGlossaryRegressions
      .inlineLegacyPresentationReplayCount === 2 &&
    focused.priorCurrentHostGlossaryRegressions
      .companionPresentationClaimed === false &&
    focused.priorCurrentHostGlossaryRegressions.pages.every((page) =>
      page.replayState.inlineLegacyPresentation === true &&
      page.replayState.notCompanion === true &&
      page.replayState.replayStateResetPassed === true) &&
    focused.priorCurrentHostGlossaryRegressions
      .currentHostPriorCalibratedCoverageClaimed === false &&
    focused.currentHostPredecessorReplay
      .currentHostPredecessorSampleReplayCount === 92 &&
    focused.currentHostPredecessorReplay
      .uniqueCurrentHostPredecessorModuleCount === 92 &&
    focused.currentHostPredecessorReplay
      .historicalInitialProgressedReplayCount === 89 &&
    focused.currentHostPredecessorReplay.historicalSpecialReadyCount === 3 &&
    exact(focused.currentHostPredecessorReplay.historicalSpecialReadyIds, [
      'shared-alg001-l09-p030', 'shared-alg001-l09-p031',
      'shared-alg001-l09-p041']) &&
    focused.currentHostPredecessorReplay
      .fullHistoricalSpecialInteractionReplay === false &&
    focused.currentHostPredecessorReplay.currentHostBrowserRevalidated ===
      true && focused.currentHostPredecessorReplay.results.length === 92 &&
    exact(focused.currentHostPredecessorReplay.results.map((result) =>
      result.animationId), previous.samples.map((sample) =>
      sample.animationId)) &&
    focused.successorBridgeCompatibility.predecessorCompatibilityRebound ===
      true && focused.successorBridgeCompatibility
      .changedSurfaceBrowserRevalidated === true &&
    focused.successorBridgeCompatibility.currentHostBrowserRevalidated ===
      true && focused.successorBridgeCompatibility.fullPrior126Replay ===
      false && exact(focused.inputs.successorCompatibilityAudit,
      descriptor(compatibility)) &&
    successor.artifactType ===
      'g678-final342-current-bridge-successor-compatibility-v1' &&
    successor.exactInverseTransformation.exactMatch === true &&
    successor.final342Compatibility.descriptorInvariantCount === 342 &&
    successor.final342Compatibility
      .currentBridgeStaticCompatibilityEstablished === true &&
    successor.final342Compatibility.currentHostBrowserRevalidated === false &&
    successor.requiredProvisional354BrowserAssertions
      .predecessorSamplesMustBeReplayed === true &&
    exact(successor.requiredProvisional354BrowserAssertions
      .glossaryPauseTransitions, {
      runningOpenCloseResumes: true,
      inspectedOpenCloseRemainsPaused: true,
      inspectedSeekRequestIdentityPreserved: true,
      blockedAndNestedRequestsMustNotOverwriteSnapshot: true,
      navigationReplayAndResetMustClearSnapshot: true,
    }) &&
    compatibility.sha256 === COMPATIBILITY_SHA256 &&
    exact(successor.requiredProvisional354BrowserAssertions
      .exactOldGlossaryPlacements, PRIOR_HOST_REGRESSION_IDS) &&
    exact(successor.requiredProvisional354BrowserAssertions
      .exactNewTranchePlacements, IDS) &&
    freeze.value.registrationCandidatePlacementCount === 354 &&
    freeze.value.selectedPages.length === 354 &&
    exact(focused.acceptanceEffects, FALSE_EFFECTS),
  '354 aggregate browser inputs drifted');
  const focusedPages = [...focused.introTerminal.pages,
    ...focused.simpleGlossary.pages];
  invariant(exact(focusedPages.map((page) => page.animationId), IDS),
    '354 focused browser page order drifted');
  const newPlacementSamples = focusedPages.map((page) => Object.freeze({
    animationId: page.animationId,
    kind: page.family === 'intro-terminal'
      ? 'alg-l11-intro-terminal-source-static'
      : 'alg-l11-simple-glossary-source-static',
    frameCount: page.frameCount,
    firstMiddleLastCanvasReady: page.canvasFrames.length === 3 &&
      page.canvasFrames.every((frame) => frame.renderState === 'ready'),
    exactGlossaryButtonCount: page.exactGlossaryButtonCount,
    companionPortalPassed: page.companionPortalPassed,
    typedHostOpenCloseFocusPassed: page.typedHostOpenCloseFocusPassed,
    replayReset: page.replayReset,
  }));
  const predecessorReplaySamples = focused.currentHostPredecessorReplay.results
    .map((result) => Object.freeze({animationId: result.animationId,
      kind: result.smokeKind,
      frameCount: result.frameCount,
      historicalInitialProgressedCanvasReady:
        result.smokeKind === 'historical-initial-progressed'
          ? result.smokeFrames.length === 2 && result.smokeFrames.every(
            (frame) => frame.renderState === 'ready')
          : null,
      historicalSpecialCanvasReady:
        result.smokeKind === 'historical-special-ready'
          ? result.renderState === 'ready'
          : null,
      fullHistoricalInteractionReplayed:
        result.smokeKind === 'historical-special-ready'
          ? result.fullHistoricalInteractionReplayed
          : null,
      currentHostBrowserRevalidated: true}));
  invariant(predecessorReplaySamples.length === 92 &&
    new Set(predecessorReplaySamples.map((sample) =>
      sample.animationId)).size === 92 &&
    predecessorReplaySamples.filter((sample) => sample.kind ===
      'historical-initial-progressed').length === 89 &&
    predecessorReplaySamples.filter((sample) => sample.kind ===
      'historical-special-ready').length === 3,
  '354 predecessor current-host replay projection drifted');
  const currentHostSamples = Object.freeze([...predecessorReplaySamples,
    ...newPlacementSamples]);
  invariant(currentHostSamples.length === 104 &&
    new Set(currentHostSamples.map((sample) => sample.animationId)).size ===
      104,
  '354 current-host unique sample projection drifted');
  const screenshots = Object.freeze([...previous.screenshots,
    ...focused.screenshots]);
  invariant(new Set(screenshots.map((item) => item.path)).size ===
    screenshots.length,
  '354 aggregate screenshot paths must be unique');
  return Object.freeze({schemaVersion: 1,
    artifactType: 'g678-current-js-354-browser-qa-v1',
    generatedAt: new Date().toISOString(),
    baseUrl: 'http://127.0.0.1:3324',
    inputs: Object.freeze({predecessor: descriptor(predecessor),
      incremental: descriptor(incremental), freeze: descriptor(freeze),
      successorCompatibility: descriptor(compatibility),
      builder: descriptor(builder)}),
    registeredCurrentJsPages: 354,
    allLessons: focused.allLessons,
    samples: currentHostSamples,
    historicalPredecessorEvidence: Object.freeze({
      evidence: descriptor(predecessor), sampleRecordCount: 92,
      screenshotCount: 96,
      treatment: 'historical-live-records-from-the-exact-old-bridge',
    }),
    changedSurfaceRegressions:
      focused.priorCurrentHostGlossaryRegressions,
    screenshots,
    browserEvidenceComposition: Object.freeze({
      historicalPredecessorLiveRecordCount: 92,
      currentHostPredecessorSampleReplayCount: 92,
      currentHostHistoricalInitialProgressedReplayCount: 89,
      currentHostHistoricalSpecialReadyCount: 3,
      fullHistoricalSpecialInteractionReplay: false,
      currentHostNewPlacementSampleCount: 12,
      currentHostChangedSurfaceRegressionCount: 2,
      currentHostLiveRecordCount: 104,
      currentHostUniqueSampledModuleCount: 104,
      historicalScreenshotCount: 96,
      currentHostScreenshotCount: 15,
      totalScreenshotCount: 111,
      predecessorCompatibilityRebound: true,
      changedSurfaceBrowserRevalidated: true,
      currentHostBrowserRevalidated: true,
      glossaryPauseTransitionsBrowserRevalidated: true,
      fullBlockedAndNestedBrowserCoverageClaimed: false,
      fullNavigationResetBrowserCoverageClaimed: false,
      fullPrior126Replay: false,
      prior342EvidenceTreatment:
        'historical input only; all 92 predecessor samples were replayed separately against the current host',
      noSyntheticBrowserExecutionClaim: true,
    }),
    acceptanceEffects: FALSE_EFFECTS});
}

async function verifyScreenshots(artifact) {
  for (const item of artifact.screenshots) {
    const current = await binding(item.path);
    invariant(current.bytes === item.bytes && current.sha256 === item.sha256,
      `${item.path} aggregate screenshot drifted`);
  }
}

export async function buildG678CurrentJs354BrowserAggregate(
  {check = false} = {},
) {
  const artifact = await expectedArtifact();
  const bytes = stableBytes(artifact);
  let receipt = bytes;
  if (check) {
    const current = await binding(OUTPUT, true);
    const expected = stableBytes({...artifact,
      generatedAt: current.value.generatedAt});
    invariant(current.buffer.equals(expected),
      '354 browser aggregate drifted');
    await verifyScreenshots(current.value);
    receipt = current.buffer;
  } else {
    const directory = projectPath(OUTPUT_DIRECTORY);
    invariant(!await lstat(directory).then(() => true, () => false),
      `${OUTPUT_DIRECTORY} already exists`);
    const stage = `${directory}.staging-${process.pid}`;
    await mkdir(stage, {recursive: false});
    try {
      await writeFile(path.join(stage, 'evidence.json'), bytes, {flag: 'wx'});
      await verifyScreenshots(artifact);
      await rename(stage, directory);
    } catch (error) {
      await rename(stage, `${stage}.failed-${Date.now()}`).catch(() => {});
      throw error;
    }
  }
  return Object.freeze({check, output: OUTPUT, bytes: receipt.length,
    sha256: sha256(receipt), registeredCurrentJsPages: 354,
    currentHostLiveRecords: 104, currentHostUniqueSampledModules: 104,
    historicalInitialProgressedReplayCount: 89,
    historicalSpecialReadyCount: 3,
    screenshotCount: 111,
    acceptanceEffects: FALSE_EFFECTS});
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  const args = process.argv.slice(2);
  invariant(args.length <= 1 && (args.length === 0 || args[0] === '--check'),
    'usage: build-g678-current-js-354-browser-aggregate.mjs [--check]');
  buildG678CurrentJs354BrowserAggregate({check: args[0] === '--check'})
    .then((result) => process.stdout.write(`${JSON.stringify(result, null, 2)}\n`))
    .catch((error) => {
      process.stderr.write(`${error.stack ?? error.message}\n`);
      process.exitCode = 1;
    });
}
