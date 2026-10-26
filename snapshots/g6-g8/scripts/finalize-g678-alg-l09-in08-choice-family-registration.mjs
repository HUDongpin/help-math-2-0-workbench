#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {constants as fsConstants} from 'node:fs';
import {copyFile, lstat, readFile, realpath, unlink, writeFile} from
  'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {buildAlgL09In08ChoiceFamilyCalibration} from
  './build-g678-alg-l09-in08-choice-family-calibration.mjs';
import {finalizeAlgL09In08ChoiceRegistration} from
  './finalize-g678-alg-l09-in08-choice-registration.mjs';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
const CALIBRATION_ID = 'g678-16-page-product-calibration-v1';
const ADAPTER_FAMILY = 'alg-l09-in08-choice-source-static';
const BROWSER_BLOCKER =
  'alg-l09-in08-choice-browser-product-calibration-pending';
const PROVISIONAL_FREEZE =
  'catalog/product-bridge-calibrations/g678-current-js-329-page-registration-v1.json';
const PROVISIONAL_FRAGMENT =
  'catalog/product-bridge-calibrations/g678-current-js-329-page-registration-v1.fragment.json';
const PREDECESSOR_FREEZE =
  'catalog/product-bridge-calibrations/g678-current-js-328-page-product-calibrated-registration-v1.json';
const FAMILY =
  'catalog/product-bridge-calibrations/g678-alg-l09-in08-choice-family-calibration-v1.json';
const BROWSER = 'output/playwright/g678-current-js-329-v1/evidence.json';
const BROWSER_VERIFIER = 'scripts/qa-g678-current-js-329-browser.mjs';
export const OUTPUT_FREEZE =
  'catalog/product-bridge-calibrations/g678-current-js-329-page-product-calibrated-registration-v1.json';
export const OUTPUT_FRAGMENT =
  'catalog/product-bridge-calibrations/g678-current-js-329-page-product-calibrated-registration-v1.fragment.json';

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
  `${page.animationId}: ALG L9 IN08 browser calibration blocker is not exact`);
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
  `${page.animationId}: ALG L9 IN08 downstream blockers drifted`);
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
      frame607InteractiveStopBound: true,
      fourSourceNumericChoicesBound: true,
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
    await finalizeAlgL09In08ChoiceRegistration({check: true});
  const familyAdmission =
    await buildAlgL09In08ChoiceFamilyCalibration({check: true});
  invariant(provisionalAdmission.check === true &&
    provisionalAdmission.registrationCandidatePlacementCount === 329 &&
    familyAdmission.check === true &&
    familyAdmission.authorizedPlacementCount === 1 &&
    familyAdmission.productHostCalibrationPassed === true,
  'ALG L9 IN08 provisional/family admission failed');

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
    provisionalFreeze.value.registrationCandidatePlacementCount === 329 &&
    provisionalFreeze.value.selectedPages.length === 329 &&
    provisionalFragment.value.calibration.freezeManifest ===
      PROVISIONAL_FREEZE &&
    provisionalFragment.value.calibration.entries.length === 329 &&
    exact(provisionalFragment.value.freeze, descriptor(provisionalFreeze)) &&
    exact(provisionalFreeze.value.inputs.predecessorFreeze,
      descriptor(predecessorFreeze)) &&
    predecessorFreeze.value.registrationCandidatePlacementCount === 328 &&
    predecessorFreeze.value.selectedPages.length === 328 &&
    predecessorFreeze.value.productHostCalibration
      .familyCalibratedPlacementCount === 112,
  'ALG L9 IN08 provisional freeze/fragment/predecessor drifted');
  const host = family.value.productHostCalibration;
  invariant(family.value.artifactType ===
      'g678-alg-l09-in08-choice-family-calibration-v1' &&
    family.value.status ===
      'exact-1-in08-choice-quiz-product-host-calibrated' &&
    family.value.adapterFamily === ADAPTER_FAMILY &&
    exact(family.value.authorizedPlacementIds,
      ['shared-alg001-l09-p020']) &&
    family.value.sourceButtonCount === 5 &&
    family.value.uniqueGlossaryTermCount === 5 &&
    family.value.choiceCount === 4 &&
    host.familyCurrentJsIn08ChoiceCalibrationPassed === true &&
    host.frame607InteractiveStopBound === true &&
    host.fourSourceNumericChoicesBound === true &&
    host.twoWrongAttemptsAndChoiceFeedbackResumePassed === true &&
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
  'ALG L9 IN08 family authority/browser cross-binding drifted');
  invariant(browser.value.artifactType ===
      'g678-current-js-329-browser-qa-v1' &&
    browser.value.registeredCurrentJsPages === 329 &&
    browser.value.allLessons.sharedCardCount === 44 &&
    browser.value.allLessons.linkedCardCount === 0 &&
    browser.value.allLessons.registeredPageSum === 329 &&
    browser.value.samples.length === 79 &&
    browser.value.screenshots.length === 80 &&
    exact(browser.value.inputs.freeze, descriptor(provisionalFreeze)) &&
    exact(browser.value.inputs.script, descriptor(browserVerifier)) &&
    allFalse(browser.value.acceptanceEffects),
  'ALG L9 IN08 329-page browser evidence drifted');

  const familyIds = [...family.value.authorizedPlacementIds].sort();
  const selectedByFamily = provisionalFreeze.value.selectedPages.filter((page) =>
    page.adapterFamily === ADAPTER_FAMILY);
  invariant(selectedByFamily.length === 1 &&
    exact(selectedByFamily.map((page) => page.animationId).sort(), familyIds),
  'ALG L9 IN08 provisional selected family set drifted');
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
  invariant(selectedPages.length === 329 &&
    selectedPages.filter((page) => page.productHostCalibration).length === 113 &&
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
  'ALG L9 IN08 post-browser calibrated page denominator drifted');

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
      algL09In08ChoiceFamilyCalibration: descriptor(family),
      provisionalFinalizer: provisionalFreeze.value.inputs.finalizer,
      finalizer: descriptor(builder),
    },
    selectedPages,
    productHostCalibration: {
      familyCalibratedPlacementCount: 113,
      familyCalibrationCount: 17,
      browserSampleCount: 79,
      screenshotCount: 80,
      allLessonsPartialRegistrationTruthful: true,
      overallG678ProductCalibrationPassed: false,
    },
    limitations: [
      '329 registered pages remain partial across all 44 lessons; no N/N whole-lesson engineering preview exists.',
      'The exact ALG L9 IN08 placement passed frame-607 four-choice behavior, two wrong-attempt paths, typed right-feedback continuation, frame-608 resume, Replay reset, and bilingual glossary checks; the prior 112 calibrated placements remain independently bound.',
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
      algL09In08ChoiceProductHostCalibratedPlacements: 1,
      totalProductHostCalibratedPlacements: 113,
      familyCalibrationCount: 17,
      browserSampleCount: 79,
      screenshotCount: 80,
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

export async function finalizeG678AlgL09In08ChoiceFamilyRegistration(
  {check = false} = {},
) {
  const artifacts = await expectedArtifacts();
  if (check) {
    const [freeze, fragment] = await Promise.all([
      binding(OUTPUT_FREEZE), binding(OUTPUT_FRAGMENT),
    ]);
    invariant(freeze.buffer.equals(artifacts.freezeBytes) &&
      fragment.buffer.equals(artifacts.fragmentBytes),
    'post-browser 329 registration artifacts drifted');
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
    registrationCandidatePlacementCount: 329,
    productHostCalibratedPlacementCount: 113,
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
    'usage: finalize-g678-alg-l09-in08-choice-family-registration.mjs [--check]');
  finalizeG678AlgL09In08ChoiceFamilyRegistration({
    check: args.includes('--check'),
  })
    .then((result) => process.stdout.write(`${JSON.stringify(result, null, 2)}\n`))
    .catch((error) => {
      process.stderr.write(`${error.stack ?? error.message}\n`);
      process.exitCode = 1;
    });
}
