#!/usr/bin/env node

import {execFile} from 'node:child_process';
import {createHash} from 'node:crypto';
import {chmod, link, lstat, readFile, realpath, unlink, writeFile} from
  'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {promisify} from 'node:util';

import {A_IDS, B_IDS, D_IDS, IDS, assertFinal354Predecessor104} from
  './qa-g678-alg-l11-remaining23-browser.mjs';
import {assertCheckedArtifactBinding, assertFocused377AggregateInput} from
  './build-g678-current-js-377-browser-aggregate.mjs';
import {assertRemaining23InstructionalContentAdmission,
  requireRemaining23InstructionalContentAdmission} from
  './g678-alg-l11-remaining23-instructional-content.mjs';

const execFileAsync = promisify(execFile);
const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
const OUTPUT =
  'catalog/product-bridge-calibrations/' +
  'g678-alg-l11-remaining23-family-calibration-v1.json';
const PATHS = Object.freeze({
  final354Aggregate: 'output/playwright/g678-current-js-354-v1/evidence.json',
  registrationFreeze:
    'catalog/product-bridge-calibrations/' +
    'g678-current-js-377-page-registration-v1.json',
  focusedBrowser:
    'output/playwright/g678-alg-l11-remaining23-377-v1/evidence.json',
  focusedBrowserVerifier: 'scripts/qa-g678-alg-l11-remaining23-browser.mjs',
  aggregateBrowser: 'output/playwright/g678-current-js-377-v1/evidence.json',
  aggregateBrowserBuilder:
    'scripts/build-g678-current-js-377-browser-aggregate.mjs',
  aAudit: 'catalog/g678-alg-l11-interactive10-tranche-c-audit-v1.json',
  aRun:
    'work/g678-shared-page-factory/' +
    'g678-alg-l11-interactive10-tranche-c-current-js-v1/run-manifest.json',
  aFragment:
    'catalog/product-bridge-calibrations/' +
    'g678-alg-l11-interactive10-tranche-c-current-js-v1.fragment.json',
  bAudit: 'catalog/g678-alg-l11-behavior10-tranche-b-audit-v1.json',
  bDecision:
    'catalog/g678-alg-l11-behavior10-tranche-b-source-divergence-v1.json',
  bRun:
    'work/g678-shared-page-factory/' +
    'g678-alg-l11-behavior10-tranche-b-current-js-v1/run-manifest.json',
  bFragment:
    'catalog/product-bridge-calibrations/' +
    'g678-alg-l11-behavior10-tranche-b-current-js-v1.fragment.json',
  dAudit: 'catalog/g678-alg-l11-advanced3-tranche-d-audit-v1.json',
  dRun:
    'work/g678-shared-page-factory/' +
    'g678-alg-l11-advanced3-tranche-d-current-js-v1/run-manifest.json',
  dFragment:
    'catalog/product-bridge-calibrations/' +
    'g678-alg-l11-advanced3-tranche-d-current-js-v1.fragment.json',
});
const FINAL354_SHA256 =
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

async function binding(relativePath, json = false, readOnly = false) {
  const target = projectPath(relativePath);
  const [canonical, before] = await Promise.all([
    realpath(target), lstat(target, {bigint: true}),
  ]);
  invariant(canonical === target && before.isFile() &&
    !before.isSymbolicLink() && before.nlink === 1n &&
    (!readOnly || (before.mode & 0o222n) === 0n),
  `${relativePath} must be one canonical${readOnly ? ' read-only' : ''} file`);
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

export function assertRemaining23FamilyTransitiveBindings({focused,
  aggregate, descriptors}) {
  for (const key of ['aRun', 'aFragment', 'bRun', 'bFragment', 'dRun',
    'dFragment', 'aAudit', 'bAudit', 'bDecision', 'dAudit']) {
    invariant(exact(focused?.inputs?.[key], descriptors[key]),
      `${key} focused browser authority drifted`);
  }
  invariant(exact(focused.inputs.registrationFreeze,
    descriptors.registrationFreeze) &&
    exact(focused.inputs.script, descriptors.focusedBrowserVerifier) &&
    exact(aggregate?.inputs?.predecessor, descriptors.final354Aggregate) &&
    exact(aggregate.inputs.focused, descriptors.focusedBrowser) &&
    exact(aggregate.inputs.freeze, descriptors.registrationFreeze) &&
    exact(aggregate.inputs.builder, descriptors.aggregateBrowserBuilder),
  'remaining23 focused/aggregate/freeze binding drifted');
  return true;
}

export function assertRemaining23FamilyInputs({predecessor, focused,
  aggregate, freeze}) {
  assertFinal354Predecessor104(predecessor);
  assertFocused377AggregateInput(focused, predecessor, freeze);
  invariant(aggregate?.artifactType === 'g678-current-js-377-browser-qa-v1' &&
    aggregate.registeredCurrentJsPages === 377 &&
    aggregate.samples?.length === 127 &&
    new Set(aggregate.samples.map((sample) => sample.animationId)).size ===
      127 && aggregate.screenshots?.length === 135 &&
    aggregate.browserEvidenceComposition
      ?.currentHostPredecessorReplayCount === 104 &&
    aggregate.browserEvidenceComposition
      ?.currentHostNewPlacementDeepRecordCount === 23 &&
    aggregate.browserEvidenceComposition?.currentHostLiveRecordCount === 127 &&
    aggregate.browserEvidenceComposition
      ?.currentHostUniqueSampledModuleCount === 127 &&
    aggregate.browserEvidenceComposition
      ?.fullHistoricalSpecialInteractionReplay === false &&
    aggregate.browserEvidenceComposition?.exact23FamilyCalibrationPending ===
      true && aggregate.browserEvidenceComposition
      ?.algL11Registration44Of44 === true &&
    aggregate.browserEvidenceComposition
      ?.overallG678ProductCalibrationPassed === false &&
    exact(aggregate.acceptanceEffects, FALSE_EFFECTS) &&
    freeze.registrationCandidatePlacementCount === 377 &&
    freeze.selectedPages?.length === 377,
  'remaining23 family aggregate boundary drifted');
  return true;
}

export function buildRemaining23FamilyArtifact({predecessor, focused,
  aggregate, freeze, inputs, contentAdmission}) {
  assertRemaining23InstructionalContentAdmission(contentAdmission);
  assertRemaining23FamilyInputs({predecessor, focused, aggregate, freeze});
  return Object.freeze({schemaVersion: 1,
    artifactType: 'g678-alg-l11-remaining23-family-calibration-v1',
    calibrationId: 'g678-alg-l11-remaining23-family-calibration-v1',
    status:
      'exact-23-alg-l11-private-current-js-product-host-calibrated-final-registration-pending',
    inputs: {...inputs,
      instructionalContentContract: contentAdmission.contentContract,
      visibleInstructionalContent: contentAdmission.browserVisibleContent},
    auditedPlacementCount: 23, authorizedPlacementIds: IDS,
    blockedPlacementCount: 0,
    aInteractivePlacementCount: A_IDS.length,
    bBehaviorPlacementCount: B_IDS.length,
    dAdvancedPlacementCount: D_IDS.length,
    focusedBrowserScreenshotCount: 24,
    currentHostPredecessorReplayCount: 104,
    fullHistoricalSpecialInteractionReplay: false,
    aggregateCurrentHostLiveSampleRecordCount: 127,
    aggregateCurrentHostUniqueSampledModuleCount: 127,
    aggregateBrowserScreenshotCount: 135,
    productHostCalibration: Object.freeze({
      allTwentyThreeDomModulesLoaded: true,
      allTwentyThreeInstructionalPresentationsVerified: true,
      allTwentyThreePageSpecificCanvasAssetRequestCount: 0,
      aP006DeterministicSilentSequencePassed: true,
      aChoiceVisibleMathGeometryPassed: true,
      aChoiceSourceBoundHelpAndTypedResetPassed: true,
      aTwoTryMaintainedTransitionPassed: true,
      aOriginalParentBindingClaimed: false,
      bTutorialTwoTryHelpPassed: true,
      bGuidedAllStopsPassed: true,
      bGuidedVisibleCorrectC: true,
      bCorrectMcPopupLifecyclePassed: true,
      bStaleMcPopUpAbsentAllStates: true,
      bTypedHostFeedbackResetPassed: true,
      dP033HandoffPassed: true,
      dP034BothLevelsAndScoringPassed: true,
      dP044PoolWrongRightGradeReviewResetPassed: true,
      currentHostPredecessor104Replayed: true,
      fullHistoricalSpecialInteractionReplay: false,
      allObservedRequestsLoopback: true,
      allObservedRequestsExplicitlyAllowed: true,
      allLegacyNetworkOperationsBlocked: true,
      allBrowserConsoleAndPageErrorsZero: true,
      allLessonsCardCount44AndLinks0: true,
      allLessonsRegisteredPageVectorSum377: true,
      algL09Complete41Of41: true,
      algL11Complete44Of44: true,
      exact23FamilyCurrentJsCalibrationPassed: true,
      overallG678ProductCalibrationPassed: false,
    }),
    authorization: Object.freeze({authorized: true,
      scope: 'exact-23-alg-l11-remaining-placements-only',
      permitsOtherG678Placements: false,
      permitsFinal377Registration: false,
      permitsOriginalRuntimeOrVisualFidelityClaim: false,
      permitsAudioAcceptance: false,
      permitsHumanOrOwnerAcceptance: false,
      permitsStrictCompletion: false,
      permitsReleaseOrPublication: false}),
    acceptanceEffects: FALSE_EFFECTS,
    limitations: Object.freeze([
      'This calibration authorizes only the exact twenty-three ALG001 L11 maintained private-current-js placements after source-bound instructional content and visible-content browser verification, plus focused behavior evidence.',
      'The provisional377 registration and this family calibration are inputs to a later atomic finalizer; this artifact does not itself write or authorize final registration.',
      'The 104 predecessor modules receive fresh current-host Replay and readiness checks; the three historical special-ready interactions are not reclassified as complete interaction replays.',
      'The exact23 DOM implementations make no page-specific Canvas asset request; that absence is expected and is not a visual-fidelity claim.',
      'p006 source randomness and audio/listening parity remain unestablished; p009 and p010 original Flash parent resolution remains unestablished.',
      'Original runtime, visual fidelity, audio, human, Owner, strict completion, release, and publication remain false.',
    ])});
}

async function runChecks() {
  const env = {...process.env};
  const commands = [
    [PATHS.focusedBrowserVerifier, ['--check']],
    [PATHS.aggregateBrowserBuilder, ['--check']],
  ];
  const results = [];
  for (const [script, args] of commands) {
    const result = await execFileAsync(process.execPath,
      [projectPath(script), ...args], {cwd: ROOT, env,
        maxBuffer: 32 * 1024 * 1024});
    results.push(JSON.parse(result.stdout));
  }
  invariant(results[0].registeredCurrentJsPages === 377 &&
    results[0].exact23DeepProductRecordCount === 23 &&
    results[0].predecessorReplayCount === 104 &&
    results[0].screenshotCount === 24 &&
    results[0].requestGuardMode ===
      'abort-unallowlisted-before-network' &&
    results[0].blockedRequestCount === 0 &&
    results[1].registeredCurrentJsPages === 377 &&
    results[1].currentHostLiveRecords === 127 &&
    results[1].predecessorReplayCount === 104 &&
    results[1].newDeepRecordCount === 23 &&
    results[1].screenshotCount === 135,
  'remaining23 prerequisite check receipts drifted');
  return results;
}

async function expectedArtifact() {
  // Instructional admission precedes even behavior-evidence checks. A runnable
  // control scaffold must never become product calibration through its counts.
  const contentAdmission = await requireRemaining23InstructionalContentAdmission();
  const checkedArtifacts = await runChecks();
  const jsonKeys = new Set(['final354Aggregate', 'registrationFreeze',
    'focusedBrowser', 'aggregateBrowser', 'aAudit', 'aRun', 'aFragment',
    'bAudit', 'bDecision', 'bRun', 'bFragment', 'dAudit', 'dRun',
    'dFragment']);
  const entries = await Promise.all(Object.entries(PATHS).map(
    async ([key, relative]) => [key, await binding(relative,
      jsonKeys.has(key), key.endsWith('Run') || key.endsWith('Fragment') ||
        key === 'aAudit' || key === 'bAudit' || key === 'bDecision' ||
        key === 'dAudit')]));
  const values = Object.fromEntries(entries);
  const builder = await binding(path.relative(ROOT, SCRIPT_PATH));
  invariant(values.final354Aggregate.sha256 === FINAL354_SHA256,
    'remaining23 final354 predecessor hash drifted');
  assertCheckedArtifactBinding(checkedArtifacts[0], values.focusedBrowser,
    'focused377 browser evidence');
  assertCheckedArtifactBinding(checkedArtifacts[1], values.aggregateBrowser,
    'aggregate377 browser evidence');
  const focused = values.focusedBrowser.value;
  assertRemaining23FamilyTransitiveBindings({focused,
    aggregate: values.aggregateBrowser.value,
    descriptors: Object.fromEntries(Object.entries(values).map(
      ([key, value]) => [key, descriptor(value)]))});
  const inputs = Object.freeze({...Object.fromEntries(entries.map(
    ([key, value]) => [key, descriptor(value)])),
  builder: descriptor(builder)});
  return buildRemaining23FamilyArtifact({
    predecessor: values.final354Aggregate.value,
    focused, aggregate: values.aggregateBrowser.value,
    freeze: values.registrationFreeze.value, inputs, contentAdmission,
  });
}

export async function buildG678AlgL11Remaining23FamilyCalibration(
  {check = false} = {},
) {
  const artifact = await expectedArtifact();
  const bytes = stableBytes(artifact);
  if (check) {
    const current = await binding(OUTPUT, false, true);
    invariant(current.buffer.equals(bytes),
      'ALG L11 remaining23 family calibration drifted');
  } else {
    const target = projectPath(OUTPUT);
    invariant(!await lstat(target).then(() => true, () => false),
      `${OUTPUT} already exists`);
    const temporary = `${target}.staging-${process.pid}-${Date.now()}`;
    await writeFile(temporary, bytes, {flag: 'wx', mode: 0o444});
    await chmod(temporary, 0o444);
    try {
      await link(temporary, target);
    } finally {
      await unlink(temporary).catch(() => {});
    }
  }
  return Object.freeze({check, output: OUTPUT, bytes: bytes.length,
    sha256: sha256(bytes), status: artifact.status,
    authorizedPlacementCount: 23,
    exact23FamilyCurrentJsCalibrationPassed: true,
    final377RegistrationAuthorized: false,
    overallG678ProductCalibrationPassed: false,
    acceptanceEffects: artifact.acceptanceEffects});
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  const args = process.argv.slice(2);
  invariant(args.length <= 1 && (args.length === 0 || args[0] === '--check'),
    'usage: build-g678-alg-l11-remaining23-family-calibration.mjs [--check]');
  buildG678AlgL11Remaining23FamilyCalibration(
    {check: args[0] === '--check'})
    .then((result) => process.stdout.write(`${JSON.stringify(result, null, 2)}\n`))
    .catch((error) => {
      process.stderr.write(`${error.stack ?? error.message}\n`);
      process.exitCode = 1;
    });
}
