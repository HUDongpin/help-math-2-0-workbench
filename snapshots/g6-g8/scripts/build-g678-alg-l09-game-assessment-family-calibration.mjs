#!/usr/bin/env node

import {execFile} from 'node:child_process';
import {createHash} from 'node:crypto';
import {constants as fsConstants} from 'node:fs';
import {copyFile, lstat, readFile, realpath, unlink, writeFile} from
  'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {promisify} from 'node:util';

import {auditG678AlgL09GameAssessmentFamily} from
  './audit-g678-alg-l09-game-assessment-family.mjs';
import {runAlgL09GameAssessmentCurrentJs} from
  './build-g678-alg-l09-game-assessment-current-js.mjs';
import {finalizeAlgL09GameAssessmentRegistration} from
  './finalize-g678-alg-l09-game-assessment-registration.mjs';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
const execFileAsync = promisify(execFile);
const OUTPUT =
  'catalog/product-bridge-calibrations/g678-alg-l09-game-assessment-family-calibration-v1.json';
const IDS = Object.freeze(['shared-alg001-l09-p030',
  'shared-alg001-l09-p031', 'shared-alg001-l09-p041']);
const PATHS = Object.freeze({
  audit: 'catalog/g678-alg-l09-game-assessment-family-audit-v1.json',
  generator: 'scripts/build-g678-alg-l09-game-assessment-current-js.mjs',
  generatorRun:
    'work/g678-shared-page-factory/g678-alg-l09-game-assessment-current-js-3-v1/run-manifest.json',
  generatorFragment:
    'catalog/product-bridge-calibrations/g678-alg-l09-game-assessment-current-js-3-v1.fragment.json',
  registrationFinalizer:
    'scripts/finalize-g678-alg-l09-game-assessment-registration.mjs',
  registrationFreeze:
    'catalog/product-bridge-calibrations/g678-current-js-342-page-registration-v1.json',
  registrationFragment:
    'catalog/product-bridge-calibrations/g678-current-js-342-page-registration-v1.fragment.json',
  browser:
    'output/playwright/g678-alg-l09-game-assessment-342-v1/evidence.json',
  browserVerifier: 'scripts/qa-g678-alg-l09-game-assessment-browser.mjs',
  sourceStaticHost: 'packages/demos/src/source-static-canvas-candidate.tsx',
  gameAssessmentHost:
    'packages/demos/src/private-source-static-alg-l09-game-assessment-candidate.tsx',
  gameAssessmentBehavior:
    'packages/demos/src/g678-alg-l09-game-assessment.ts',
  animationContract: 'packages/demos/src/contract.ts',
  animationRuntime: 'apps/web/components/animation-runtime.tsx',
  descriptorPlayer:
    'apps/web/components/descriptor-driven-whole-lesson-player.tsx',
  productBridge: 'apps/web/lib/g678-calibration-product-bridge.server.ts',
});
const FALSE_EFFECTS = Object.freeze({authoritativeOriginalRuntime: false,
  behaviorAccepted: false, visualFidelityAccepted: false,
  audioAccepted: false, humanVisualAccepted: false, ownerAccepted: false,
  strictComplete: false, releaseEligible: false, released: false,
  published: false});
const LEGACY_NETWORK_OPERATION =
  /(?:^|[\/_?&=.-])(?:geturl|fscommand|bookmark|report(?:_url)?|download|loadvariables(?:num)?|xml[-_]?send|final[-_]?quiz[-_]?post|external[-_]?interface|shared[-_]?object(?:[-_]?persist)?)(?:$|[\/_?&=.-])/iu;

function invariant(condition, message) {
  if (!condition) throw new Error(message);
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
  `${relativePath} must be one canonical ordinary file`);
  const buffer = await readFile(target);
  const after = await lstat(target, {bigint: true});
  invariant(before.dev === after.dev && before.ino === after.ino &&
    before.size === after.size && before.mtimeNs === after.mtimeNs,
  `${relativePath} changed during read`);
  return Object.freeze({path: relativePath, bytes: buffer.length,
    sha256: sha256(buffer), buffer,
    ...(json ? {value: JSON.parse(buffer.toString('utf8'))} : {})});
}
function descriptor(value) {
  return Object.freeze({path: value.path, bytes: value.bytes,
    sha256: value.sha256});
}
function exact(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}
function loopbackAndNonLegacy(url) {
  try {
    const parsed = new URL(url);
    return parsed.origin === 'http://127.0.0.1:3324' &&
      !LEGACY_NETWORK_OPERATION.test(
        `${decodeURIComponent(parsed.pathname)}${parsed.search}`);
  } catch {
    return false;
  }
}

async function expectedArtifact() {
  const auditCheck = await auditG678AlgL09GameAssessmentFamily({check: true});
  const generatorCheck = await runAlgL09GameAssessmentCurrentJs({check: true});
  const registrationCheck =
    await finalizeAlgL09GameAssessmentRegistration({check: true});
  invariant(auditCheck.check && generatorCheck.check && registrationCheck.check &&
    registrationCheck.registrationCandidatePlacementCount === 342,
  'game/assessment source/generator/provisional checks failed');
  const qa = await execFileAsync(process.execPath,
    [PATHS.browserVerifier, '--check'], {cwd: ROOT,
      env: {...process.env,
        HELP_MATH_G678_QA_BASE_URL: 'http://127.0.0.1:3324'},
      maxBuffer: 16 * 1024 * 1024});
  invariant(qa.stderr === '', 'game/assessment QA check emitted stderr');
  const qaReceipt = JSON.parse(qa.stdout);
  invariant(qaReceipt.check === true &&
    qaReceipt.registeredCurrentJsPages === 342 &&
    exact(qaReceipt.completeLessonKeys, ['shared-alg001-l09']) &&
    qaReceipt.screenshotCount === 6,
  'game/assessment QA receipt did not prove the product slice');
  const jsonInputs = new Set(['audit', 'generatorRun', 'generatorFragment',
    'registrationFreeze', 'registrationFragment', 'browser']);
  const entries = await Promise.all(Object.entries(PATHS).map(
    async ([key, relativePath]) => [key, await binding(relativePath,
      jsonInputs.has(key))]));
  const inputs = Object.fromEntries(entries);
  const builder = await binding(path.relative(ROOT, SCRIPT_PATH));
  const audit = inputs.audit.value;
  const run = inputs.generatorRun.value;
  const generated = inputs.generatorFragment.value;
  const freeze = inputs.registrationFreeze.value;
  const fragment = inputs.registrationFragment.value;
  const browser = inputs.browser.value;
  const gameBehavior = audit.records.find((record) =>
    record.animationId === IDS[1])?.exactBehavior;
  const assessmentBehavior = audit.records.find((record) =>
    record.animationId === IDS[2])?.exactBehavior;
  const completeLessonKeys = browser.allLessons.exactLessonVector
    .filter((lesson) => lesson.registeredPageCount === lesson.activePageCount)
    .map((lesson) => lesson.stableLessonKey);
  const partialLessonKeys = browser.allLessons.exactLessonVector
    .filter((lesson) => lesson.registeredPageCount < lesson.activePageCount)
    .map((lesson) => lesson.stableLessonKey);
  const wrongResponse = browser.finalAssessment.wrongResponse;
  const wrongQuestion = assessmentBehavior?.questionBank.find((question) =>
    question.questionNumber === wrongResponse?.questionNumber);
  invariant(audit.artifactType ===
      'g678-alg-l09-game-assessment-family-audit-v1' &&
    audit.status ===
      'exact-3-game-assessment-behavior-routed-no-registration' &&
    exact(audit.authorizedPlacementIds, IDS) &&
    audit.registrationCandidatePlacementCount === 0 &&
    run.generatedPlacementCount === 3 && run.registryEntriesWritten === 0 &&
    exact(run.members.map((member) => member.animationId).sort(), IDS) &&
    generated.generatedPlacementCount === 3 &&
    generated.currentJavaScriptRegisteredCount === 0 &&
    exact(generated.entries.map((entry) => entry.key).sort(), IDS) &&
    exact(generated.compilerRun, descriptor(inputs.generatorRun)),
  'game/assessment source/generated authority drifted');
  invariant(freeze.registrationCandidatePlacementCount === 342 &&
    freeze.selectedPages.length === 342 &&
    fragment.calibration.entries.length === 342 &&
    fragment.calibration.freezeManifest === inputs.registrationFreeze.path &&
    exact(fragment.freeze, descriptor(inputs.registrationFreeze)),
  '342 provisional registration evidence drifted');
  const selected = new Map(freeze.selectedPages.map((page) =>
    [page.animationId, page]));
  invariant(IDS.every((id) => selected.get(id)?.productBlockers?.includes(
    'alg-l09-game-assessment-browser-product-calibration-pending')),
  'exact game/assessment pre-calibration page set drifted');
  invariant(browser.artifactType ===
      'g678-alg-l09-game-assessment-browser-qa-v1' &&
    browser.registeredCurrentJsPages === 342 &&
    browser.allLessons.sharedCardCount === 44 &&
    browser.allLessons.linkedCardCount === 0 &&
    browser.allLessons.registeredPageSum === 342 &&
    exact(browser.allLessons.completeLessonKeys, ['shared-alg001-l09']) &&
    exact(completeLessonKeys, ['shared-alg001-l09']) &&
    partialLessonKeys.length === 43 &&
    browser.controllerAndGame.selectedLevel === 2 &&
    browser.controllerAndGame.levelHandoffInherited === true &&
    browser.controllerAndGame.navigationTarget === IDS[1] &&
    browser.controllerAndGame.controllerReplayReset === true &&
    browser.controllerAndGame.matchingReplayReset === true &&
    browser.controllerAndGame.level1ScoringAndResetPassed === true &&
    browser.controllerAndGame.levelSwitchHeldDuringFeedback === true &&
    exact(browser.controllerAndGame.level1VisibleCardLabels,
      gameBehavior?.level1Cards.map((card) => card.label)) &&
    exact(browser.controllerAndGame.visibleCardLabels,
      gameBehavior?.level2Cards.map((card) => card.label)) &&
    browser.controllerAndGame.finalScore === 58 &&
    browser.controllerAndGame.matchedPairCount === 6 &&
    browser.finalAssessment.questionPoolSize === 24 &&
    browser.finalAssessment.presentedQuestionCount === 10 &&
    browser.finalAssessment.uniqueQuestionCount === 10 &&
    browser.finalAssessment.correctResponseCount === 9 &&
    exact(browser.finalAssessment.hostFqScore,
      {attempted: 10, correct: 9, pointsAwarded: 9, pointsPossible: 10}) &&
    browser.finalAssessment.sourceQuestionContentVisible === true &&
    browser.finalAssessment.visibleQuestionContent.length === 10 &&
    browser.finalAssessment.twoChoiceQuestionCount > 0 &&
    wrongQuestion?.choices.length === 2 &&
    wrongResponse.selectedOption !== wrongResponse.correctOption &&
    browser.finalAssessment.reviewCount === 10 &&
    browser.finalAssessment.fqReplayReset === true &&
    browser.finalAssessment.observedRequestCount > 0 &&
    browser.finalAssessment.observedRequestCount ===
      browser.finalAssessment.observedRequests.length &&
    browser.finalAssessment.allObservedRequestsLoopback === true &&
    browser.finalAssessment.allObservedRequestsExplicitlyAllowed === true &&
    browser.finalAssessment.observedRequests.every((request) =>
      request.method === 'GET' && typeof request.resourceType === 'string' &&
      loopbackAndNonLegacy(request.url)) &&
    browser.finalAssessment.legacyNetworkOperationsObserved === 0 &&
    browser.screenshots.length === 6 &&
    exact(browser.inputs.freeze, descriptor(inputs.registrationFreeze)) &&
    exact(browser.inputs.script, descriptor(inputs.browserVerifier)) &&
    exact(browser.inputs.gameAssessmentHost,
      descriptor(inputs.gameAssessmentHost)) &&
    exact(browser.inputs.gameAssessmentBehavior,
      descriptor(inputs.gameAssessmentBehavior)) &&
    exact(browser.inputs.animationRuntime,
      descriptor(inputs.animationRuntime)) &&
    exact(browser.inputs.descriptorPlayer,
      descriptor(inputs.descriptorPlayer)) &&
    exact(browser.inputs.productBridge, descriptor(inputs.productBridge)) &&
    Object.values(browser.acceptanceEffects).every((value) => value === false),
  'game/assessment browser product evidence drifted');
  return Object.freeze({schemaVersion: 1,
    artifactType: 'g678-alg-l09-game-assessment-family-calibration-v1',
    calibrationId: 'g678-alg-l09-game-assessment-family-calibration-v1',
    status: 'exact-3-game-assessment-product-host-calibrated',
    adapterFamilies: Object.freeze([
      'advanced-manual-alg-l09-game-controller-source-static',
      'advanced-manual-alg-l09-matching-game-source-static',
      'advanced-manual-alg-l09-final-assessment-source-static',
    ]),
    inputs: Object.freeze({...Object.fromEntries(entries.map(([key, value]) =>
      [key, descriptor(value)])), builder: descriptor(builder)}),
    auditedPlacementCount: 3, authorizedPlacementIds: IDS,
    blockedPlacementCount: 0, sourceLevelCount: 2,
    matchingPairCountPerLevel: 6, answerReleaseCount: 24,
    correctScoreDelta: 10, wrongScoreDelta: -2,
    finalAssessmentQuestionPoolSize: 24,
    finalAssessmentPresentedQuestionCount: 10,
    finalAssessmentCorrectResponseCount: 9,
    finalAssessmentWrongResponseCount: 1,
    finalAssessmentHostScore: Object.freeze({attempted: 10, correct: 9,
      pointsAwarded: 9, pointsPossible: 10}),
    focusedBrowserScreenshotCount: 6,
    level1VisibleCardCount: 12,
    level2VisibleCardCount: 12,
    observedRequestCount: browser.finalAssessment.observedRequestCount,
    productHostCalibration: Object.freeze({
      typedCrossPageNavigationPassed: true,
      levelHandoffInherited: true,
      controllerReplayResetPassed: true,
      matchingGameTwoLevelsAndScoringPassed: true,
      matchingReplayResetPassed: true,
      level1ScoringAndResetPassed: true,
      levelSwitchHeldDuringFeedback: true,
      sourceLevel1AndLevel2LabelsVisible: true,
      finalAssessmentRandomTenScoringAndReviewPassed: true,
      exactlyOneTwoChoiceWrongReviewPassed: true,
      sourceQuestionContentVisible: true,
      typedFinalAssessmentHostScorePassed: true,
      finalAssessmentReplayResetPassed: true,
      finalAssessmentHostScoreReplayResetPassed: true,
      allObservedRequestsLoopback: true,
      allObservedRequestsExplicitlyAllowed: true,
      allLegacyNetworkOperationsBlocked: true,
      localAssetIntegrityAndCrossOriginIsolation: true,
      allLessonsOneCompleteRegistrationTruthful: true,
      familyCurrentJsGameAssessmentCalibrationPassed: true,
      overallG678ProductCalibrationPassed: false,
    }),
    authorization: Object.freeze({authorized: true,
      scope: 'exact-3-alg-l09-game-assessment-placements-only',
      permitsOtherG678Placements: false,
      permitsAudioAcceptance: false,
      permitsOriginalRuntimeOrVisualFidelityClaim: false,
      permitsReleaseOrPublication: false}),
    acceptanceEffects: FALSE_EFFECTS,
    limitations: Object.freeze([
      'This authority calibrates only ALG L9 GS02, GS03, and FQ02 through the maintained modern My Lesson host.',
      'The source game scoring and ten-of-twenty-four assessment behavior are maintained; original-runtime parity remains independently unaccepted.',
      'Game/assessment audio, fidelity, human, Owner, strict, release, and publication gates remain false.',
    ])});
}

export async function buildAlgL09GameAssessmentFamilyCalibration(
  {check = false} = {},
) {
  const artifact = await expectedArtifact();
  const bytes = stableBytes(artifact);
  if (check) {
    const current = await binding(OUTPUT);
    invariant(current.buffer.equals(bytes),
      'game/assessment family calibration drifted');
  } else {
    const target = projectPath(OUTPUT);
    const temporary = `${target}.tmp-${process.pid}-${Date.now()}`;
    await writeFile(temporary, bytes, {flag: 'wx'});
    try {
      await copyFile(temporary, target, fsConstants.COPYFILE_EXCL);
    } finally {
      await unlink(temporary).catch(() => {});
    }
  }
  return Object.freeze({check, output: OUTPUT, bytes: bytes.length,
    sha256: sha256(bytes), status: artifact.status,
    authorizedPlacementCount: 3, productHostCalibrationPassed: true,
    acceptanceEffects: artifact.acceptanceEffects});
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  const args = process.argv.slice(2);
  invariant(args.length <= 1 && (args.length === 0 || args[0] === '--check'),
    'usage: build-g678-alg-l09-game-assessment-family-calibration.mjs [--check]');
  buildAlgL09GameAssessmentFamilyCalibration({check: args[0] === '--check'})
    .then((result) => process.stdout.write(`${JSON.stringify(result, null, 2)}\n`))
    .catch((error) => {
      process.stderr.write(`${error.stack ?? error.message}\n`);
      process.exitCode = 1;
    });
}
