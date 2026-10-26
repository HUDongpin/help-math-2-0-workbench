#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {constants as fsConstants} from 'node:fs';
import {copyFile, lstat, readFile, realpath, unlink, writeFile} from
  'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {buildAlgL09GameAssessmentFamilyCalibration} from
  './build-g678-alg-l09-game-assessment-family-calibration.mjs';
import {finalizeAlgL09GameAssessmentRegistration} from
  './finalize-g678-alg-l09-game-assessment-registration.mjs';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
const CALIBRATION_ID = 'g678-16-page-product-calibration-v1';
const ADAPTER_FAMILIES = Object.freeze([
  'advanced-manual-alg-l09-game-controller-source-static',
  'advanced-manual-alg-l09-matching-game-source-static',
  'advanced-manual-alg-l09-final-assessment-source-static',
]);
const BROWSER_BLOCKER =
  'alg-l09-game-assessment-browser-product-calibration-pending';
const PROVISIONAL_FREEZE =
  'catalog/product-bridge-calibrations/g678-current-js-342-page-registration-v1.json';
const PROVISIONAL_FRAGMENT =
  'catalog/product-bridge-calibrations/g678-current-js-342-page-registration-v1.fragment.json';
const PREDECESSOR_FREEZE =
  'catalog/product-bridge-calibrations/g678-current-js-339-page-product-calibrated-registration-v1.json';
const FAMILY =
  'catalog/product-bridge-calibrations/g678-alg-l09-game-assessment-family-calibration-v1.json';
const BROWSER = 'output/playwright/g678-current-js-342-v1/evidence.json';
const BROWSER_VERIFIER = 'scripts/build-g678-current-js-342-browser-aggregate.mjs';
const FAMILY_BROWSER =
  'output/playwright/g678-alg-l09-game-assessment-342-v1/evidence.json';
const FAMILY_BROWSER_VERIFIER =
  'scripts/qa-g678-alg-l09-game-assessment-browser.mjs';
export const OUTPUT_FREEZE =
  'catalog/product-bridge-calibrations/g678-current-js-342-page-product-calibrated-registration-v1.json';
export const OUTPUT_FRAGMENT =
  'catalog/product-bridge-calibrations/g678-current-js-342-page-product-calibrated-registration-v1.fragment.json';

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function stableBytes(value) {
  return Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
}

function absolute(relativePath) {
  const target = path.resolve(ROOT, relativePath);
  invariant(target.startsWith(`${ROOT}${path.sep}`),
    `${relativePath} escapes project root`);
  return target;
}

async function binding(relativePath, json = false) {
  const target = absolute(relativePath);
  const [canonical, before] = await Promise.all([
    realpath(target), lstat(target, {bigint: true}),
  ]);
  invariant(canonical === target && before.isFile() &&
    !before.isSymbolicLink() && before.nlink === 1n,
  `${relativePath} must be one canonical ordinary file`);
  const bytes = await readFile(target);
  const after = await lstat(target, {bigint: true});
  invariant(before.dev === after.dev && before.ino === after.ino &&
    before.size === after.size && before.mtimeNs === after.mtimeNs &&
    before.mode === after.mode && before.nlink === after.nlink,
  `${relativePath} changed during read`);
  return Object.freeze({path: relativePath, bytes: bytes.length,
    sha256: sha256(bytes), buffer: bytes,
    ...(json ? {value: JSON.parse(bytes.toString('utf8'))} : {})});
}

function descriptor(value) {
  return Object.freeze({path: value.path, bytes: value.bytes,
    sha256: value.sha256});
}

function exact(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function allFalse(value) {
  const values = Object.values(value ?? {});
  return values.length > 0 && values.every((item) => item === false);
}

function calibratedPage(page, family, browser) {
  const blockers = [...(page.productBlockers ?? [])];
  invariant(blockers.filter((blocker) => blocker === BROWSER_BLOCKER).length ===
      1,
  `${page.animationId}: game/assessment browser blocker is not exact`);
  const retainedBlockers = blockers.filter((blocker) =>
    blocker !== BROWSER_BLOCKER);
  invariant(retainedBlockers.length === 4 &&
    retainedBlockers.includes(
      'game-feedback-and-assessment-audio-acceptance-pending') &&
    retainedBlockers.includes(
      'legacy-bookmark-report-download-and-shell-network-operations-blocked') &&
    retainedBlockers.includes('authoritative-original-runtime-not-established') &&
    retainedBlockers.includes('visual-fidelity-not-accepted'),
  `${page.animationId}: game/assessment downstream blockers drifted`);
  invariant(page.runtime.interactiveStops?.length === 1 &&
    page.runtime.interactiveStops.every((stop) =>
      stop.resumeFrame === stop.stopFrame + 1),
  `${page.animationId}: game/assessment interactive stop drifted`);
  const controller = page.animationId.endsWith('p030');
  const game = page.animationId.endsWith('p031');
  const assessment = page.animationId.endsWith('p041');
  invariant(controller || game || assessment,
    `${page.animationId}: game/assessment page identity invalid`);
  return Object.freeze({...page,
    implementation: Object.freeze({...page.implementation,
      familyVisualPlaybackCalibrationPassed: true,
      typedCrossPageNavigationProductHostCalibrationPassed: controller,
      matchingGameProductHostCalibrationPassed: game,
      finalAssessmentProductHostCalibrationPassed: assessment,
      accessiblePointerAndKeyboardInteractionImplemented: true,
      feedbackAndAssessmentAudioAccepted: false,
      productCalibrationPassed: false,
    }),
    productHostCalibration: Object.freeze({
      familyAuthority: descriptor(family),
      browserEvidence: descriptor(browser),
      canvasReadyAndProgressing: true,
      typedCrossPageNavigationPassed: controller,
      navigationTarget: controller ? 'shared-alg001-l09-p031' : null,
      levelHandoffInherited: controller,
      controllerReplayResetPassed: controller,
      matchingGameTwoLevelsAndScoringPassed: game,
      matchingPairCountPerLevel: game ? 6 : null,
      matchingGameFinalScoreAfterOneWrong: game ? 58 : null,
      matchingReplayResetPassed: game,
      level1ScoringAndResetPassed: game,
      levelSwitchHeldDuringFeedback: game,
      sourceLevel1AndLevel2LabelsVisible: game,
      finalAssessmentRandomTenScoringAndReviewPassed: assessment,
      finalAssessmentQuestionPoolSize: assessment ? 24 : null,
      finalAssessmentPresentedQuestionCount: assessment ? 10 : null,
      finalAssessmentCorrectResponseCount: assessment ? 9 : null,
      finalAssessmentWrongResponseCount: assessment ? 1 : null,
      exactlyOneTwoChoiceWrongReviewPassed: assessment,
      sourceQuestionContentVisible: assessment,
      typedFinalAssessmentHostScorePassed: assessment,
      finalAssessmentReplayResetPassed: assessment,
      finalAssessmentHostScoreReplayResetPassed: assessment,
      allObservedRequestsLoopback: true,
      allObservedRequestsExplicitlyAllowed: true,
      allLegacyNetworkOperationsBlocked: true,
    }),
    productBlockers: Object.freeze(retainedBlockers),
    productCalibrationPassed: false,
    engineeringPreviewReady: false,
  });
}

async function expectedArtifacts() {
  const [provisionalAdmission, familyAdmission] = await Promise.all([
    finalizeAlgL09GameAssessmentRegistration({check: true}),
    buildAlgL09GameAssessmentFamilyCalibration({check: true}),
  ]);
  invariant(provisionalAdmission.check === true &&
    provisionalAdmission.registrationCandidatePlacementCount === 342 &&
    familyAdmission.check === true &&
    familyAdmission.authorizedPlacementCount === 3 &&
    familyAdmission.productHostCalibrationPassed === true,
  'game/assessment provisional/family admission failed');
  const [provisionalFreeze, provisionalFragment, predecessorFreeze, family,
    browser, browserVerifier, familyBrowser, familyBrowserVerifier, builder] =
    await Promise.all([
      binding(PROVISIONAL_FREEZE, true),
      binding(PROVISIONAL_FRAGMENT, true),
      binding(PREDECESSOR_FREEZE, true),
      binding(FAMILY, true),
      binding(BROWSER, true), binding(BROWSER_VERIFIER),
      binding(FAMILY_BROWSER, true), binding(FAMILY_BROWSER_VERIFIER),
      binding(path.relative(ROOT, SCRIPT_PATH)),
    ]);
  invariant(provisionalFreeze.value.calibrationId === CALIBRATION_ID &&
    provisionalFreeze.value.status ===
      'private-current-js-calibration-candidates-generated' &&
    provisionalFreeze.value.registrationCandidatePlacementCount === 342 &&
    provisionalFreeze.value.selectedPages.length === 342 &&
    provisionalFragment.value.calibration.freezeManifest ===
      PROVISIONAL_FREEZE &&
    provisionalFragment.value.calibration.entries.length === 342 &&
    exact(provisionalFragment.value.freeze, descriptor(provisionalFreeze)) &&
    exact(provisionalFreeze.value.inputs.predecessorFreeze,
      descriptor(predecessorFreeze)) &&
    predecessorFreeze.value.registrationCandidatePlacementCount === 339 &&
    predecessorFreeze.value.selectedPages.length === 339 &&
    predecessorFreeze.value.productHostCalibration
      .familyCalibratedPlacementCount === 123,
  'game/assessment provisional freeze/fragment/predecessor drifted');
  const host = family.value.productHostCalibration;
  invariant(family.value.artifactType ===
      'g678-alg-l09-game-assessment-family-calibration-v1' &&
    family.value.status ===
      'exact-3-game-assessment-product-host-calibrated' &&
    exact(family.value.adapterFamilies, ADAPTER_FAMILIES) &&
    exact([...family.value.authorizedPlacementIds].sort(), [
      'shared-alg001-l09-p030', 'shared-alg001-l09-p031',
      'shared-alg001-l09-p041']) &&
    family.value.matchingPairCountPerLevel === 6 &&
    family.value.answerReleaseCount === 24 &&
    family.value.correctScoreDelta === 10 &&
    family.value.wrongScoreDelta === -2 &&
    family.value.finalAssessmentQuestionPoolSize === 24 &&
    family.value.finalAssessmentPresentedQuestionCount === 10 &&
    family.value.finalAssessmentCorrectResponseCount === 9 &&
    family.value.finalAssessmentWrongResponseCount === 1 &&
    exact(family.value.finalAssessmentHostScore,
      {attempted: 10, correct: 9, pointsAwarded: 9, pointsPossible: 10}) &&
    family.value.focusedBrowserScreenshotCount === 6 &&
    family.value.level1VisibleCardCount === 12 &&
    family.value.level2VisibleCardCount === 12 &&
    family.value.observedRequestCount > 0 &&
    host.familyCurrentJsGameAssessmentCalibrationPassed === true &&
    host.typedCrossPageNavigationPassed === true &&
    host.levelHandoffInherited === true &&
    host.controllerReplayResetPassed === true &&
    host.matchingGameTwoLevelsAndScoringPassed === true &&
    host.matchingReplayResetPassed === true &&
    host.level1ScoringAndResetPassed === true &&
    host.levelSwitchHeldDuringFeedback === true &&
    host.sourceLevel1AndLevel2LabelsVisible === true &&
    host.finalAssessmentRandomTenScoringAndReviewPassed === true &&
    host.exactlyOneTwoChoiceWrongReviewPassed === true &&
    host.sourceQuestionContentVisible === true &&
    host.typedFinalAssessmentHostScorePassed === true &&
    host.finalAssessmentReplayResetPassed === true &&
    host.finalAssessmentHostScoreReplayResetPassed === true &&
    host.allObservedRequestsLoopback === true &&
    host.allObservedRequestsExplicitlyAllowed === true &&
    host.allLegacyNetworkOperationsBlocked === true &&
    host.overallG678ProductCalibrationPassed === false &&
    exact(family.value.inputs.registrationFreeze,
      descriptor(provisionalFreeze)) &&
    exact(family.value.inputs.registrationFragment,
      descriptor(provisionalFragment)) &&
    exact(family.value.inputs.browser, descriptor(familyBrowser)) &&
    exact(family.value.inputs.browserVerifier,
      descriptor(familyBrowserVerifier)) &&
    allFalse(family.value.acceptanceEffects),
  'game/assessment family authority/browser cross-binding drifted');
  const completeLessonKeys = browser.value.allLessons.exactLessonVector
    .filter((lesson) => lesson.registeredPageCount === lesson.activePageCount)
    .map((lesson) => lesson.stableLessonKey);
  const partialLessonKeys = browser.value.allLessons.exactLessonVector
    .filter((lesson) => lesson.registeredPageCount < lesson.activePageCount)
    .map((lesson) => lesson.stableLessonKey);
  invariant(browser.value.artifactType ===
      'g678-current-js-342-browser-qa-v1' &&
    browser.value.registeredCurrentJsPages === 342 &&
    browser.value.allLessons.sharedCardCount === 44 &&
    browser.value.allLessons.linkedCardCount === 0 &&
    browser.value.allLessons.registeredPageSum === 342 &&
    exact(browser.value.allLessons.completeLessonKeys,
      ['shared-alg001-l09']) &&
    exact(completeLessonKeys, ['shared-alg001-l09']) &&
    partialLessonKeys.length === 43 &&
    browser.value.samples.length === 92 &&
    browser.value.screenshots.length === 96 &&
    exact(browser.value.inputs.freeze, descriptor(provisionalFreeze)) &&
    exact(browser.value.inputs.builder, descriptor(browserVerifier)) &&
    allFalse(browser.value.acceptanceEffects),
  'game/assessment 342-page browser evidence drifted');

  const familyIds = [...family.value.authorizedPlacementIds].sort();
  const selectedByFamily = provisionalFreeze.value.selectedPages.filter((page) =>
    ADAPTER_FAMILIES.includes(page.adapterFamily));
  invariant(selectedByFamily.length === 3 &&
    exact(selectedByFamily.map((page) => page.animationId).sort(), familyIds),
  'game/assessment provisional selected family set drifted');
  const selectedPages = provisionalFreeze.value.selectedPages.map((page) => {
    if (ADAPTER_FAMILIES.includes(page.adapterFamily)) {
      return calibratedPage(page, family, browser);
    }
    if (!page.productHostCalibration) return page;
    return Object.freeze({...page,
      productHostCalibration: Object.freeze({
        ...page.productHostCalibration,
        browserEvidence: descriptor(browser),
      }),
    });
  });
  invariant(selectedPages.length === 342 &&
    selectedPages.filter((page) => page.productHostCalibration).length === 126 &&
    selectedPages.filter((page) => page.productHostCalibration)
      .every((page) => exact(page.productHostCalibration.browserEvidence,
        descriptor(browser))) &&
    selectedPages.filter((page) => ADAPTER_FAMILIES.includes(page.adapterFamily))
      .every((page) => !page.productBlockers.includes(BROWSER_BLOCKER) &&
        page.implementation.familyVisualPlaybackCalibrationPassed === true &&
        page.implementation.feedbackAndAssessmentAudioAccepted === false &&
        page.productCalibrationPassed === false &&
        page.engineeringPreviewReady === false),
  'game/assessment post-browser calibrated page denominator drifted');

  const inheritedDeclarations =
    predecessorFreeze.value.inputs.selectionAuthorities;
  invariant(Array.isArray(inheritedDeclarations) &&
    inheritedDeclarations.length > 0,
  'predecessor selection authority declarations are missing');
  const inheritedAuthorities = await Promise.all(
    inheritedDeclarations.map((item) => binding(item.path, true)));
  invariant(inheritedAuthorities.every((item, index) =>
    exact(descriptor(item), inheritedDeclarations[index])),
  'predecessor selection authority binding drifted');
  const combinedAuthorities = new Map();
  for (const declaration of [
    ...inheritedAuthorities.map(descriptor),
    ...provisionalFreeze.value.inputs.selectionAuthorities,
    descriptor(provisionalFreeze), descriptor(family),
  ]) {
    const prior = combinedAuthorities.get(declaration.path);
    invariant(!prior || exact(prior, declaration),
      `selection authority conflict: ${declaration.path}`);
    combinedAuthorities.set(declaration.path, declaration);
  }
  const freeze = {
    ...provisionalFreeze.value,
    status: 'private-current-js-product-host-calibrated-candidates-registered',
    inputs: {...provisionalFreeze.value.inputs,
      selectionAuthorities: [...combinedAuthorities.values()],
      provisionalFreeze: descriptor(provisionalFreeze),
      provisionalFragment: descriptor(provisionalFragment),
      browserProductEvidence: descriptor(browser),
      browserVerifier: descriptor(browserVerifier),
      algL09GameAssessmentFamilyCalibration: descriptor(family),
      provisionalFinalizer: provisionalFreeze.value.inputs.finalizer,
      finalizer: descriptor(builder)},
    selectedPages,
    productHostCalibration: {
      familyCalibratedPlacementCount: 126,
      familyCalibrationCount: 21,
      browserSampleCount: 92,
      screenshotCount: 96,
      oneCompleteAnd43PartialRegistrationTruthful: true,
      wholeLessonEngineeringPreviewCount: 1,
      overallG678ProductCalibrationPassed: false,
    },
    limitations: [
      '342 registered pages make ALG L9 the first exact 41/41 local engineering preview; the other 43 lessons remain partial and no learner route is published.',
      'GS02 typed navigation, GS03 two-level matching and +10/-2 scoring, and FQ02 random ten-of-twenty-four scoring/review passed; the prior 123 calibrated placements remain independently bound.',
      'Game/assessment audio, authoritative original runtime, fidelity, human, Owner, strict, release, and publication gates remain false.',
    ],
  };
  const freezeBytes = stableBytes(freeze);
  const fragment = {
    ...provisionalFragment.value,
    calibration: {...provisionalFragment.value.calibration,
      freezeManifest: OUTPUT_FREEZE},
    freeze: {path: OUTPUT_FREEZE, bytes: freezeBytes.length,
      sha256: sha256(freezeBytes)},
    descriptorProjection: {...provisionalFragment.value.descriptorProjection,
      wholeLessonEngineeringPreviewCount: 1},
    familyScaleout: {...provisionalFragment.value.familyScaleout,
      algL09GameAssessmentProductHostCalibratedPlacements: 3,
      totalProductHostCalibratedPlacements: 126,
      familyCalibrationCount: 21,
      browserSampleCount: 92,
      screenshotCount: 96,
      wholeLessonEngineeringPreviewCount: 1,
      browserProductCalibrationPassed: true,
      overallG678ProductCalibrationPassed: false},
  };
  return Object.freeze({freeze, fragment, freezeBytes,
    fragmentBytes: stableBytes(fragment)});
}

async function writeExclusive(relativePath, bytes) {
  const target = absolute(relativePath);
  const temporary = `${target}.tmp-${process.pid}-${Date.now()}`;
  await writeFile(temporary, bytes, {flag: 'wx'});
  try {
    await copyFile(temporary, target, fsConstants.COPYFILE_EXCL);
  } finally {
    await unlink(temporary).catch(() => {});
  }
}

export async function finalizeG678AlgL09GameAssessmentFamilyRegistration(
  {check = false} = {},
) {
  const artifacts = await expectedArtifacts();
  if (check) {
    const [freeze, fragment] = await Promise.all([
      binding(OUTPUT_FREEZE), binding(OUTPUT_FRAGMENT),
    ]);
    invariant(freeze.buffer.equals(artifacts.freezeBytes) &&
      fragment.buffer.equals(artifacts.fragmentBytes),
    'post-browser 342 registration artifacts drifted');
  } else {
    await writeExclusive(OUTPUT_FREEZE, artifacts.freezeBytes);
    try {
      await writeExclusive(OUTPUT_FRAGMENT, artifacts.fragmentBytes);
    } catch (error) {
      const current = await binding(OUTPUT_FREEZE);
      if (current.buffer.equals(artifacts.freezeBytes)) {
        await unlink(absolute(OUTPUT_FREEZE));
      }
      throw error;
    }
  }
  return Object.freeze({check, registrationCandidatePlacementCount: 342,
    productHostCalibratedPlacementCount: 126,
    frozenCalibrationPlacementCount: 2282, affectedLessonCount: 44,
    wholeLessonEngineeringPreviewCount: 1, productCalibrationPassed: false,
    freeze: {path: OUTPUT_FREEZE, bytes: artifacts.freezeBytes.length,
      sha256: sha256(artifacts.freezeBytes)},
    fragment: {path: OUTPUT_FRAGMENT, bytes: artifacts.fragmentBytes.length,
      sha256: sha256(artifacts.fragmentBytes)}});
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  const args = process.argv.slice(2);
  invariant(args.length <= 1 && (args.length === 0 || args[0] === '--check'),
    'usage: finalize-g678-alg-l09-game-assessment-family-registration.mjs [--check]');
  finalizeG678AlgL09GameAssessmentFamilyRegistration({
    check: args.includes('--check'),
  }).then((result) => process.stdout.write(`${JSON.stringify(result, null, 2)}\n`))
    .catch((error) => {
      process.stderr.write(`${error.stack ?? error.message}\n`);
      process.exitCode = 1;
    });
}
