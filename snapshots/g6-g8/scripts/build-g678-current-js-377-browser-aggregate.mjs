#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {execFile} from 'node:child_process';
import {lstat, mkdir, readFile, realpath, rename, writeFile} from
  'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {promisify} from 'node:util';

import {IDS, assertFinal354Predecessor104} from
  './qa-g678-alg-l11-remaining23-browser.mjs';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const execFileAsync = promisify(execFile);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
const OUTPUT = 'output/playwright/g678-current-js-377-v1/evidence.json';
const OUTPUT_DIRECTORY = path.dirname(OUTPUT);
const PREDECESSOR = 'output/playwright/g678-current-js-354-v1/evidence.json';
const FOCUSED =
  'output/playwright/g678-alg-l11-remaining23-377-v1/evidence.json';
const FREEZE =
  'catalog/product-bridge-calibrations/g678-current-js-377-page-registration-v1.json';
const PREDECESSOR_SHA256 =
  '6e8a3beab7433a662d38b263e43749a1ee146a54558b47d698b742521cd7571e';
const FALSE_EFFECTS = Object.freeze({
  currentJavaScriptRegistered: false, registrationCandidate: false,
  productCalibrationPassed: false, browserCalibrationPassed: false,
  engineeringPreviewReady: false,
  authoritativeOriginalRuntime: false, behaviorAccepted: false,
  visualFidelityAccepted: false, audioAccepted: false,
  humanVisualAccepted: false, ownerAccepted: false, strictComplete: false,
  releaseEligible: false, released: false, published: false,
});

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function exact(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function stableBytes(value) {
  return Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
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

export function assertCheckedArtifactBinding(receipt, current, label) {
  invariant(receipt?.check === true && receipt.output === current?.path &&
    Number.isSafeInteger(receipt.bytes) && receipt.bytes === current.bytes &&
    /^[0-9a-f]{64}$/u.test(receipt.sha256) &&
    receipt.sha256 === current.sha256,
  `${label} changed after prerequisite check`);
  return true;
}

export function assertFocused377AggregateInput(focused, predecessor,
  freeze) {
  const predecessorIds = assertFinal354Predecessor104(predecessor);
  invariant(focused && exact(Object.keys(focused), ['schemaVersion',
    'artifactType', 'generatedAt', 'baseUrl', 'inputs', 'browser',
    'registeredCurrentJsPages', 'allLessons', 'exact23Pages',
    'aInteractive10', 'bBehavior10', 'dAdvanced3',
    'currentHostPredecessorReplay', 'observedRequests', 'requestPolicy',
    'screenshots', 'acceptanceEffects']) &&
    focused.schemaVersion === 1 && focused.artifactType ===
      'g678-alg-l11-remaining23-browser-qa-v1' &&
    focused.baseUrl === 'http://127.0.0.1:3324' &&
    focused.registeredCurrentJsPages === 377 &&
    focused.allLessons?.registeredPageSum === 377 &&
    focused.allLessons?.sharedCardCount === 44 &&
    focused.allLessons?.linkedCardCount === 0 &&
    exact(focused.allLessons?.completeLessonKeys,
      ['shared-alg001-l09', 'shared-alg001-l11']) &&
    exact(focused.allLessons?.algL09,
      {registeredPageCount: 41, activePageCount: 41, complete: true}) &&
    exact(focused.allLessons?.algL11,
      {registeredPageCount: 44, activePageCount: 44, complete: true}) &&
    exact(focused.exact23Pages?.map((page) => page.animationId), IDS) &&
    focused.exact23Pages.every((page) => exact(Object.keys(page),
      ['animationId', 'kind', 'domModuleLoaded',
        'pageSpecificAssetRequestCount', 'deepProductBehaviorPassed']) &&
      page.domModuleLoaded === true &&
      page.pageSpecificAssetRequestCount === 0 &&
      page.deepProductBehaviorPassed === true) &&
    exact(Object.keys(focused.aInteractive10), ['placementCount',
      'choicePlacementCount', 'twoTryPlacementCount',
      'p006DeterministicSilentPassed', 'choiceHelpAndHostResetPassed',
      'originalParentBindingClaimed', 'pages']) &&
    focused.aInteractive10?.placementCount === 10 &&
    focused.aInteractive10?.choicePlacementCount === 7 &&
    focused.aInteractive10?.twoTryPlacementCount === 2 &&
    focused.aInteractive10?.p006DeterministicSilentPassed === true &&
    focused.aInteractive10?.choiceHelpAndHostResetPassed === true &&
    focused.aInteractive10?.originalParentBindingClaimed === false &&
    exact(Object.keys(focused.bBehavior10), ['placementCount',
      'guidedPlacementCount', 'allGuidedStopsPassed',
      'correctHelpLifecyclePassed', 'staleOverlayAbsentAllStates',
      'typedHostFeedbackResetPassed', 'pages']) &&
    focused.bBehavior10?.placementCount === 10 &&
    focused.bBehavior10?.guidedPlacementCount === 3 &&
    focused.bBehavior10?.allGuidedStopsPassed === true &&
    focused.bBehavior10?.correctHelpLifecyclePassed === true &&
    focused.bBehavior10?.staleOverlayAbsentAllStates === true &&
    focused.bBehavior10?.typedHostFeedbackResetPassed === true &&
    exact(Object.keys(focused.dAdvanced3), ['placementCount',
      'p033HandoffPassed', 'p034BothLevelsAndScoringPassed',
      'p044PoolGradeReviewResetPassed', 'pages']) &&
    focused.dAdvanced3?.placementCount === 3 &&
    focused.dAdvanced3?.p033HandoffPassed === true &&
    focused.dAdvanced3?.p034BothLevelsAndScoringPassed === true &&
    focused.dAdvanced3?.p044PoolGradeReviewResetPassed === true &&
    exact(Object.keys(focused.currentHostPredecessorReplay),
      ['historicalFinal354SampleCount', 'currentHostPredecessorReplayCount',
        'uniqueCurrentHostPredecessorModuleCount',
        'fullHistoricalSpecialInteractionReplay', 'limitation', 'results']) &&
    focused.currentHostPredecessorReplay
      ?.currentHostPredecessorReplayCount === 104 &&
    focused.currentHostPredecessorReplay
      ?.uniqueCurrentHostPredecessorModuleCount === 104 &&
    focused.currentHostPredecessorReplay
      ?.fullHistoricalSpecialInteractionReplay === false &&
    exact(focused.currentHostPredecessorReplay.results.map((result) =>
      result.animationId), predecessorIds) &&
    focused.currentHostPredecessorReplay.results.every((result) =>
      result.fullHistoricalInteractionReplayed === false &&
      result.errors.length === 0) &&
    exact(Object.keys(focused.requestPolicy), ['observedRequestCount',
      'allObservedRequestsLoopback', 'allObservedRequestsExplicitlyAllowed',
      'legacyNetworkOperationsObserved', 'guardMode',
      'blockedRequestCount']) &&
    focused.requestPolicy?.allObservedRequestsLoopback === true &&
    focused.requestPolicy?.allObservedRequestsExplicitlyAllowed === true &&
    focused.requestPolicy?.legacyNetworkOperationsObserved === 0 &&
    focused.requestPolicy?.guardMode ===
      'abort-unallowlisted-before-network' &&
    focused.requestPolicy?.blockedRequestCount === 0 &&
    focused.screenshots?.length === 24 &&
    new Set(focused.screenshots.map((item) => item.path)).size === 24 &&
    freeze.registrationCandidatePlacementCount === 377 &&
    freeze.selectedPages?.length === 377 &&
    IDS.every((id) => freeze.selectedPages.some((page) =>
      page.animationId === id)) &&
    exact(focused.acceptanceEffects, FALSE_EFFECTS),
  'focused377 aggregate input drifted');
  return true;
}

export function buildG678CurrentJs377AggregateArtifact({predecessor,
  focused, freeze, inputs, generatedAt}) {
  assertFocused377AggregateInput(focused, predecessor, freeze);
  invariant(typeof generatedAt === 'string' && generatedAt.length > 0,
    '377 aggregate generatedAt is required');
  const predecessorResults = focused.currentHostPredecessorReplay.results
    .map((result) => Object.freeze({animationId: result.animationId,
      kind: 'current-host-final354-predecessor-replay',
      historicalKind: result.historicalKind,
      frameCount: result.frameCount, frameDomain: result.frameDomain,
      replayReady: result.renderState === 'ready' &&
        result.replayCounterAfter === result.replayCounterBefore + 1,
      fullHistoricalInteractionReplayed: false,
      currentHostBrowserRevalidated: true}));
  const newResults = focused.exact23Pages.map((page) => Object.freeze({
    animationId: page.animationId,
    kind: page.kind,
    domModuleLoaded: page.domModuleLoaded,
    pageSpecificAssetRequestCount: page.pageSpecificAssetRequestCount,
    deepProductBehaviorPassed: page.deepProductBehaviorPassed,
    currentHostBrowserRevalidated: true,
  }));
  const samples = Object.freeze([...predecessorResults, ...newResults]);
  invariant(samples.length === 127 &&
    new Set(samples.map((sample) => sample.animationId)).size === 127,
  '377 aggregate unique current-host sample set drifted');
  const screenshots = Object.freeze([...predecessor.screenshots,
    ...focused.screenshots]);
  invariant(screenshots.length === 135 &&
    new Set(screenshots.map((item) => item.path)).size === 135,
  '377 aggregate screenshot set drifted');
  return Object.freeze({schemaVersion: 1,
    artifactType: 'g678-current-js-377-browser-qa-v1', generatedAt,
    baseUrl: 'http://127.0.0.1:3324', inputs,
    registeredCurrentJsPages: 377, allLessons: focused.allLessons,
    samples, screenshots,
    historicalFinal354Evidence: Object.freeze({
      evidence: inputs.predecessor, currentHostSampleRecordCount: 104,
      screenshotCount: 111,
      treatment:
        'historical final354 evidence retained; all 104 modules were separately replayed against the provisional377 current host',
    }),
    browserEvidenceComposition: Object.freeze({
      historicalFinal354CurrentHostRecordCount: 104,
      currentHostPredecessorReplayCount: 104,
      currentHostNewPlacementDeepRecordCount: 23,
      currentHostLiveRecordCount: 127,
      currentHostUniqueSampledModuleCount: 127,
      historicalScreenshotCount: 111,
      focused377ScreenshotCount: 24,
      totalScreenshotCount: 135,
      fullHistoricalSpecialInteractionReplay: false,
      exact23FamilyCalibrationPending: true,
      algL11Registration44Of44: true,
      overallG678ProductCalibrationPassed: false,
      noSyntheticBrowserExecutionClaim: true,
    }),
    acceptanceEffects: FALSE_EFFECTS});
}

async function expectedArtifact() {
  const focusedCheck = await execFileAsync(process.execPath,
    [projectPath('scripts/qa-g678-alg-l11-remaining23-browser.mjs'),
      '--check'], {cwd: ROOT, env: {...process.env},
      maxBuffer: 32 * 1024 * 1024});
  const focusedReceipt = JSON.parse(focusedCheck.stdout);
  invariant(focusedReceipt.registeredCurrentJsPages === 377 &&
    focusedReceipt.exact23DeepProductRecordCount === 23 &&
    focusedReceipt.predecessorReplayCount === 104 &&
    focusedReceipt.screenshotCount === 24 &&
    focusedReceipt.allObservedRequestsLoopback === true &&
    focusedReceipt.allObservedRequestsExplicitlyAllowed === true &&
    focusedReceipt.legacyNetworkOperationsObserved === 0 &&
    focusedReceipt.requestGuardMode ===
      'abort-unallowlisted-before-network' &&
    focusedReceipt.blockedRequestCount === 0,
  'focused377 prerequisite check receipt drifted');
  const [predecessor, focused, freeze, builder] = await Promise.all([
    binding(PREDECESSOR, true), binding(FOCUSED, true),
    binding(FREEZE, true),
    binding(path.relative(ROOT, SCRIPT_PATH)),
  ]);
  invariant(predecessor.sha256 === PREDECESSOR_SHA256,
    'final354 aggregate hash drifted');
  assertCheckedArtifactBinding(focusedReceipt, focused,
    'focused377 browser evidence');
  invariant(exact(focused.value.inputs.registrationFreeze,
    descriptor(freeze)), 'focused377 freeze descriptor drifted');
  const inputs = Object.freeze({predecessor: descriptor(predecessor),
    focused: descriptor(focused), freeze: descriptor(freeze),
    builder: descriptor(builder)});
  return buildG678CurrentJs377AggregateArtifact({
    predecessor: predecessor.value, focused: focused.value,
    freeze: freeze.value, inputs, generatedAt: new Date().toISOString(),
  });
}

async function verifyScreenshots(artifact) {
  for (const item of artifact.screenshots) {
    const current = await binding(item.path);
    invariant(current.bytes === item.bytes && current.sha256 === item.sha256,
      `${item.path} aggregate screenshot drifted`);
  }
}

export async function buildG678CurrentJs377BrowserAggregate(
  {check = false} = {},
) {
  const artifact = await expectedArtifact();
  const bytes = stableBytes(artifact);
  let receipt = bytes;
  if (check) {
    const current = await binding(OUTPUT, true);
    const expected = stableBytes({...artifact,
      generatedAt: current.value.generatedAt});
    invariant(current.buffer.equals(expected), '377 browser aggregate drifted');
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
    sha256: sha256(receipt), registeredCurrentJsPages: 377,
    currentHostLiveRecords: 127, currentHostUniqueSampledModules: 127,
    predecessorReplayCount: 104, newDeepRecordCount: 23,
    screenshotCount: 135, exact23FamilyCalibrationPending: true,
    acceptanceEffects: FALSE_EFFECTS});
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  const args = process.argv.slice(2);
  invariant(args.length <= 1 && (args.length === 0 || args[0] === '--check'),
    'usage: build-g678-current-js-377-browser-aggregate.mjs [--check]');
  buildG678CurrentJs377BrowserAggregate({check: args[0] === '--check'})
    .then((result) => process.stdout.write(`${JSON.stringify(result, null, 2)}\n`))
    .catch((error) => {
      process.stderr.write(`${error.stack ?? error.message}\n`);
      process.exitCode = 1;
    });
}
