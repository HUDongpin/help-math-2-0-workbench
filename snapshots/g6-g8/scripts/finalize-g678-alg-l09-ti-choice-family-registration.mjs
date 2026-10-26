#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {constants as fsConstants} from 'node:fs';
import {copyFile, lstat, readFile, realpath, unlink, writeFile} from
  'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {buildAlgL09TiChoiceFamilyCalibration} from
  './build-g678-alg-l09-ti-choice-family-calibration.mjs';
import {finalizeAlgL09TiChoiceRegistration} from
  './finalize-g678-alg-l09-ti-choice-registration.mjs';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
const CALIBRATION_ID = 'g678-16-page-product-calibration-v1';
const ADAPTER_FAMILY = 'alg-l09-ti-choice-source-static';
const BROWSER_BLOCKER =
  'alg-l09-ti-choice-browser-product-calibration-pending';
const PROVISIONAL_FREEZE =
  'catalog/product-bridge-calibrations/g678-current-js-336-page-registration-v1.json';
const PROVISIONAL_FRAGMENT =
  'catalog/product-bridge-calibrations/g678-current-js-336-page-registration-v1.fragment.json';
const PREDECESSOR_FREEZE =
  'catalog/product-bridge-calibrations/g678-current-js-330-page-product-calibrated-registration-v1.json';
const FAMILY =
  'catalog/product-bridge-calibrations/g678-alg-l09-ti-choice-family-calibration-v1.json';
const BROWSER = 'output/playwright/g678-current-js-336-v1/evidence.json';
const BROWSER_VERIFIER = 'scripts/qa-g678-current-js-336-browser.mjs';
export const OUTPUT_FREEZE =
  'catalog/product-bridge-calibrations/g678-current-js-336-page-product-calibrated-registration-v1.json';
export const OUTPUT_FRAGMENT =
  'catalog/product-bridge-calibrations/g678-current-js-336-page-product-calibrated-registration-v1.fragment.json';

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
  `${page.animationId}: ALG L9 TI browser calibration blocker is not exact`);
  const retainedBlockers = blockers.filter((blocker) =>
    blocker !== BROWSER_BLOCKER);
  invariant(retainedBlockers.length === 5 &&
    retainedBlockers.includes(
      'choice-feedback-shell-variants-and-audio-acceptance-pending') &&
    retainedBlockers.includes(
      'external-narration-audio-selection-and-listening-acceptance-pending') &&
    retainedBlockers.includes(
      'legacy-key-term-sublinks-and-example-swfs-not-implemented') &&
    retainedBlockers.includes('authoritative-original-runtime-not-established') &&
    retainedBlockers.includes('visual-fidelity-not-accepted'),
  `${page.animationId}: ALG L9 TI downstream blockers drifted`);
  const interactiveStop = page.runtime.interactiveStops?.[0];
  invariant(interactiveStop &&
    interactiveStop.resumeFrame === interactiveStop.stopFrame + 1,
  `${page.animationId}: ALG L9 TI interactive stop drifted`);
  return Object.freeze({...page,
    implementation: Object.freeze({...page.implementation,
      familyVisualPlaybackCalibrationPassed: true,
      typedBilingualGlossaryProductHostCalibrationPassed: true,
      sourceFrameBoundGlossaryProductHostCalibrationPassed: true,
      sourceCharacterBoundGlossaryProductHostCalibrationPassed: true,
      sourceChoiceQuizStopBound: true,
      sourceChoiceQuizBehaviorBound: true,
      accessiblePointerAndKeyboardInteractionImplemented: true,
      choiceFeedbackAudioAccepted: false,
      productCalibrationPassed: false,
    }),
    productHostCalibration: Object.freeze({
      familyAuthority: descriptor(family),
      browserEvidence: descriptor(browser),
      canvasReadyAndProgressing: true,
      mainTimelineAdvancedPastInteractiveStop: true,
      tiChoiceStopAndResumeBound: true,
      sourceSpecificChoiceSetBound: true,
      sourceStopFrame: interactiveStop.stopFrame,
      sourceResumeFrame: interactiveStop.resumeFrame,
      sourceWrongFeedbackAttemptIncrementComplete:
        page.implementation.sourceWrongFeedbackAttemptIncrementComplete,
      maintainedAttemptCounterNormalizesKnownSourceVariantDefect:
        page.implementation
          .maintainedAttemptCounterNormalizesKnownSourceVariantDefect,
      twoWrongAttemptsAndChoiceFeedbackResumePassed: true,
      sourceFrameBoundGlossaryControls: true,
      sourceCharacterIdentityBound: true,
    }),
    productBlockers: Object.freeze(retainedBlockers),
    productCalibrationPassed: false,
    engineeringPreviewReady: false,
  });
}

async function expectedArtifacts() {
  const provisionalAdmission =
    await finalizeAlgL09TiChoiceRegistration({check: true});
  const familyAdmission =
    await buildAlgL09TiChoiceFamilyCalibration({check: true});
  invariant(provisionalAdmission.check === true &&
    provisionalAdmission.registrationCandidatePlacementCount === 336 &&
    familyAdmission.check === true &&
    familyAdmission.authorizedPlacementCount === 6 &&
    familyAdmission.productHostCalibrationPassed === true,
  'ALG L9 TI provisional/family admission failed');

  const [provisionalFreeze, provisionalFragment, predecessorFreeze, family,
    browser, browserVerifier, builder] = await Promise.all([
      binding(PROVISIONAL_FREEZE, true),
      binding(PROVISIONAL_FRAGMENT, true),
      binding(PREDECESSOR_FREEZE, true),
      binding(FAMILY, true),
      binding(BROWSER, true),
      binding(BROWSER_VERIFIER),
      binding(path.relative(ROOT, SCRIPT_PATH)),
    ]);
  invariant(provisionalFreeze.value.calibrationId === CALIBRATION_ID &&
    provisionalFreeze.value.status ===
      'private-current-js-calibration-candidates-generated' &&
    provisionalFreeze.value.registrationCandidatePlacementCount === 336 &&
    provisionalFreeze.value.selectedPages.length === 336 &&
    provisionalFragment.value.calibration.freezeManifest ===
      PROVISIONAL_FREEZE &&
    provisionalFragment.value.calibration.entries.length === 336 &&
    exact(provisionalFragment.value.freeze, descriptor(provisionalFreeze)) &&
    exact(provisionalFreeze.value.inputs.predecessorFreeze,
      descriptor(predecessorFreeze)) &&
    predecessorFreeze.value.registrationCandidatePlacementCount === 330 &&
    predecessorFreeze.value.selectedPages.length === 330 &&
    predecessorFreeze.value.productHostCalibration
      .familyCalibratedPlacementCount === 114,
  'ALG L9 TI provisional freeze/fragment/predecessor drifted');
  const host = family.value.productHostCalibration;
  invariant(family.value.artifactType ===
      'g678-alg-l09-ti-choice-family-calibration-v1' &&
    family.value.status ===
      'exact-6-ti-choice-quiz-product-host-calibrated' &&
    family.value.adapterFamily === ADAPTER_FAMILY &&
    exact([...family.value.authorizedPlacementIds].sort(), [
      'shared-alg001-l09-p024', 'shared-alg001-l09-p025',
      'shared-alg001-l09-p026', 'shared-alg001-l09-p027',
      'shared-alg001-l09-p028', 'shared-alg001-l09-p029']) &&
    family.value.sourceButtonCount === 48 &&
    family.value.uniqueGlossaryTermCount === 22 &&
    family.value.choiceCount === 20 &&
    host.familyCurrentJsTiChoiceCalibrationPassed === true &&
    host.sourceSpecificStopsAndResumesBound === true &&
    host.sourceSpecificChoiceSetsBound === true &&
    host.twoWrongAttemptsAndChoiceFeedbackResumePassed === true &&
    host.threeSourceAttemptIncrementDefectsRecordedAndNormalized === true &&
    host.sourceFrameBoundGlossaryControls === true &&
    host.sourceCharacterIdentityBound === true &&
    host.overallG678ProductCalibrationPassed === false &&
    exact(family.value.inputs.registrationFreeze,
      descriptor(provisionalFreeze)) &&
    exact(family.value.inputs.registrationFragment,
      descriptor(provisionalFragment)) &&
    exact(family.value.inputs.browser, descriptor(browser)) &&
    exact(family.value.inputs.browserVerifier, descriptor(browserVerifier)) &&
    allFalse(family.value.acceptanceEffects),
  'ALG L9 TI family authority/browser cross-binding drifted');
  invariant(browser.value.artifactType ===
      'g678-current-js-336-browser-qa-v1' &&
    browser.value.registeredCurrentJsPages === 336 &&
    browser.value.allLessons.sharedCardCount === 44 &&
    browser.value.allLessons.linkedCardCount === 0 &&
    browser.value.allLessons.registeredPageSum === 336 &&
    browser.value.samples.length === 86 &&
    browser.value.screenshots.length === 87 &&
    exact(browser.value.inputs.freeze, descriptor(provisionalFreeze)) &&
    exact(browser.value.inputs.script, descriptor(browserVerifier)) &&
    allFalse(browser.value.acceptanceEffects),
  'ALG L9 TI 336-page browser evidence drifted');

  const familyIds = [...family.value.authorizedPlacementIds].sort();
  const selectedByFamily = provisionalFreeze.value.selectedPages.filter((page) =>
    page.adapterFamily === ADAPTER_FAMILY);
  invariant(selectedByFamily.length === 6 &&
    exact(selectedByFamily.map((page) => page.animationId).sort(), familyIds),
  'ALG L9 TI provisional selected family set drifted');
  const selectedPages = provisionalFreeze.value.selectedPages.map((page) => {
    if (page.adapterFamily === ADAPTER_FAMILY) {
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
  invariant(selectedPages.length === 336 &&
    selectedPages.filter((page) => page.productHostCalibration).length === 120 &&
    selectedPages.filter((page) => page.productHostCalibration)
      .every((page) => exact(page.productHostCalibration.browserEvidence,
        descriptor(browser))) &&
    selectedPages.filter((page) => page.adapterFamily === ADAPTER_FAMILY)
      .every((page) =>
        !page.productBlockers.includes(BROWSER_BLOCKER) &&
        page.implementation.familyVisualPlaybackCalibrationPassed === true &&
        page.implementation.sourceChoiceQuizStopBound === true &&
        page.implementation.sourceChoiceQuizBehaviorBound === true &&
        page.implementation
          .accessiblePointerAndKeyboardInteractionImplemented === true &&
        page.implementation.choiceFeedbackAudioAccepted === false &&
        page.productCalibrationPassed === false &&
        page.engineeringPreviewReady === false),
  'ALG L9 TI post-browser calibrated page denominator drifted');

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
    descriptor(provisionalFreeze),
    descriptor(family),
  ]) {
    const prior = combinedAuthorities.get(declaration.path);
    invariant(!prior || exact(prior, declaration),
      `selection authority conflict: ${declaration.path}`);
    combinedAuthorities.set(declaration.path, declaration);
  }
  const freeze = {
    ...provisionalFreeze.value,
    status: 'private-current-js-product-host-calibrated-candidates-registered',
    inputs: {
      ...provisionalFreeze.value.inputs,
      selectionAuthorities: [...combinedAuthorities.values()],
      provisionalFreeze: descriptor(provisionalFreeze),
      provisionalFragment: descriptor(provisionalFragment),
      browserProductEvidence: descriptor(browser),
      browserVerifier: descriptor(browserVerifier),
      algL09TiChoiceFamilyCalibration: descriptor(family),
      provisionalFinalizer: provisionalFreeze.value.inputs.finalizer,
      finalizer: descriptor(builder),
    },
    selectedPages,
    productHostCalibration: {
      familyCalibratedPlacementCount: 120,
      familyCalibrationCount: 19,
      browserSampleCount: 86,
      screenshotCount: 87,
      allLessonsPartialRegistrationTruthful: true,
      overallG678ProductCalibrationPassed: false,
    },
    limitations: [
      '336 registered pages remain partial across all 44 lessons; no N/N whole-lesson engineering preview exists.',
      'The exact six ALG L9 TI placements passed their source-specific two-to-four-choice behavior, two wrong-attempt paths, typed right-feedback continuation, authored resume frames, Replay reset, and bilingual glossary checks; the prior 114 calibrated placements remain independently bound.',
      'Three legacy wrong-feedback visual variants omit quizTryCount increment; maintained product state normalization is recorded and original-runtime parity remains unaccepted.',
      'Choice-feedback audio and external narration remain unimplemented/unaccepted; authoritative original runtime, fidelity, human, Owner, strict, release, and publication gates remain false.',
      'Recovered key-term XML remains private custody evidence and is not promoted into the canonical source tree.',
    ],
  };
  const freezeBytes = stableBytes(freeze);
  const fragment = {
    ...provisionalFragment.value,
    calibration: {...provisionalFragment.value.calibration,
      freezeManifest: OUTPUT_FREEZE},
    freeze: {path: OUTPUT_FREEZE, bytes: freezeBytes.length,
      sha256: sha256(freezeBytes)},
    familyScaleout: {
      ...provisionalFragment.value.familyScaleout,
      algL09TiChoiceProductHostCalibratedPlacements: 6,
      totalProductHostCalibratedPlacements: 120,
      familyCalibrationCount: 19,
      browserSampleCount: 86,
      screenshotCount: 87,
      browserProductCalibrationPassed: true,
      overallG678ProductCalibrationPassed: false,
    },
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

export async function finalizeG678AlgL09TiChoiceFamilyRegistration(
  {check = false} = {},
) {
  const artifacts = await expectedArtifacts();
  if (check) {
    const [freeze, fragment] = await Promise.all([
      binding(OUTPUT_FREEZE), binding(OUTPUT_FRAGMENT),
    ]);
    invariant(freeze.buffer.equals(artifacts.freezeBytes) &&
      fragment.buffer.equals(artifacts.fragmentBytes),
    'post-browser 336 registration artifacts drifted');
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
  return Object.freeze({check,
    registrationCandidatePlacementCount: 336,
    productHostCalibratedPlacementCount: 120,
    frozenCalibrationPlacementCount: 2282,
    affectedLessonCount: 44,
    wholeLessonEngineeringPreviewCount: 0,
    productCalibrationPassed: false,
    freeze: {path: OUTPUT_FREEZE, bytes: artifacts.freezeBytes.length,
      sha256: sha256(artifacts.freezeBytes)},
    fragment: {path: OUTPUT_FRAGMENT, bytes: artifacts.fragmentBytes.length,
      sha256: sha256(artifacts.fragmentBytes)},
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  const args = process.argv.slice(2);
  invariant(args.length <= 1 && (args.length === 0 || args[0] === '--check'),
    'usage: finalize-g678-alg-l09-ti-choice-family-registration.mjs [--check]');
  finalizeG678AlgL09TiChoiceFamilyRegistration({
    check: args.includes('--check'),
  })
    .then((result) => process.stdout.write(`${JSON.stringify(result, null, 2)}\n`))
    .catch((error) => {
      process.stderr.write(`${error.stack ?? error.message}\n`);
      process.exitCode = 1;
    });
}
