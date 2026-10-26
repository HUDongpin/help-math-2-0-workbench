#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {constants as fsConstants} from 'node:fs';
import {copyFile, lstat, readFile, unlink, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {buildTs07NmsL1FamilyCalibration} from
  './build-g678-ts07-nms-l1-family-calibration.mjs';
import {finalizeTs07NmsL1Registration} from
  './finalize-g678-ts07-nms-l1-registration.mjs';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
const CALIBRATION_ID = 'g678-16-page-product-calibration-v1';
const PROVISIONAL_FREEZE =
  'catalog/product-bridge-calibrations/g678-current-js-277-page-registration-v1.json';
const PROVISIONAL_FRAGMENT =
  'catalog/product-bridge-calibrations/g678-current-js-277-page-registration-v1.fragment.json';
const PREDECESSOR_FREEZE =
  'catalog/product-bridge-calibrations/g678-current-js-276-page-product-calibrated-registration-v1.json';
const BROWSER_EVIDENCE =
  'output/playwright/g678-current-js-277-v1/evidence.json';
const BROWSER_VERIFIER = 'scripts/qa-g678-current-js-277-browser.mjs';
export const OUTPUT_FREEZE =
  'catalog/product-bridge-calibrations/g678-current-js-277-page-product-calibrated-registration-v1.json';
export const OUTPUT_FRAGMENT =
  'catalog/product-bridge-calibrations/g678-current-js-277-page-product-calibrated-registration-v1.fragment.json';

const FAMILY_CONFIGS = Object.freeze([
  Object.freeze({
    adapterFamily: 'ts07-nms-l1-assessment-source-static',
    artifactType: 'g678-ts07-nms-l1-family-calibration-v1',
    browserBlocker: 'ts07-nms-l1-browser-product-calibration-pending',
    inputKey: 'ts07AssessmentFamilyCalibration',
    path: 'catalog/product-bridge-calibrations/g678-ts07-nms-l1-family-calibration-v1.json',
  }),
]);

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
  const before = await lstat(target, {bigint: true});
  invariant(before.isFile() && !before.isSymbolicLink() && before.nlink === 1n,
    `${relativePath} must be one ordinary file`);
  const bytes = await readFile(target);
  const after = await lstat(target, {bigint: true});
  invariant(before.dev === after.dev && before.ino === after.ino &&
    before.size === after.size && before.mtimeNs === after.mtimeNs &&
    before.mode === after.mode && before.nlink === after.nlink,
  `${relativePath} changed during read`);
  return Object.freeze({path: relativePath, bytes: bytes.length,
    sha256: sha256(bytes), buffer: bytes,
    ...(json ? {value: JSON.parse(bytes)} : {})});
}

function descriptor(value) {
  return Object.freeze({path: value.path, bytes: value.bytes,
    sha256: value.sha256});
}

function exact(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function allFalse(value) {
  const entries = Object.entries(value ?? {});
  return entries.length > 0 && entries.every(([, item]) => item === false);
}

function calibratedPage(page, family, familyBinding, browserBinding) {
  const blockers = [...(page.productBlockers ?? [])];
  invariant(blockers.filter((blocker) =>
    blocker === family.browserBlocker).length === 1,
  `${page.animationId}: browser calibration blocker is not exact`);
  const retainedBlockers = blockers.filter((blocker) =>
    blocker !== family.browserBlocker);
  invariant(retainedBlockers.length > 0 &&
    retainedBlockers.includes('authoritative-original-runtime-not-established') &&
    retainedBlockers.includes('visual-fidelity-not-accepted'),
  `${page.animationId}: downstream blockers drifted`);
  return Object.freeze({
    ...page,
    implementation: Object.freeze({
      ...page.implementation,
      familyVisualPlaybackCalibrationPassed: true,
      typedAssessmentProductHostCalibrationPassed: true,
      typedBilingualGlossaryProductHostCalibrationPassed: true,
      productCalibrationPassed: false,
    }),
    productHostCalibration: Object.freeze({
      familyAuthority: descriptor(familyBinding),
      browserEvidence: descriptor(browserBinding),
      canvasReadyAndProgressing: true,
      sourceQuizStopHeldUntilFeedbackResolution: true,
      sourceQuizStopVisualProxyFrame: 758,
      sourceOrderedAnswerLabels: true,
      exactThreeWrongFourRightFeedbackDomains: true,
      firstWrongRetriesAndRightResumes: true,
      maintainedHintAndReplayReset: true,
      exactEnglishAndSpanishDifferenceGlossaryDefinitions: true,
      playbackPausesWhileGlossaryOpen: true,
      playbackResumesAfterGlossaryClose: true,
      spanishAssessmentTextParityAccepted: false,
      feedbackAudioAccepted: false,
    }),
    productBlockers: Object.freeze(retainedBlockers),
    productCalibrationPassed: false,
    engineeringPreviewReady: false,
  });
}

async function expectedArtifacts() {
  const provisionalAdmission = await finalizeTs07NmsL1Registration({check: true,
    requireCurrentPredecessorHost: false});
  invariant(provisionalAdmission.check === true &&
    provisionalAdmission.registrationCandidatePlacementCount === 277,
  'provisional 277-page admission failed');
  const familyChecks = await Promise.all([
    buildTs07NmsL1FamilyCalibration({check: true}),
  ]);
  invariant(familyChecks.every((result) => result.check === true &&
    result.productHostCalibrationPassed === true &&
    result.authorizedPlacementCount === 1),
  'TS07 assessment family product-host checks failed');
  const [provisionalFreeze, provisionalFragment, predecessorFreeze, browser,
    browserVerifier, builder, ...familyBindings] = await Promise.all([
      binding(PROVISIONAL_FREEZE, true),
      binding(PROVISIONAL_FRAGMENT, true),
      binding(PREDECESSOR_FREEZE, true),
      binding(BROWSER_EVIDENCE, true),
      binding(BROWSER_VERIFIER),
      binding(path.relative(ROOT, SCRIPT_PATH)),
      ...FAMILY_CONFIGS.map((family) => binding(family.path, true)),
    ]);
  invariant(provisionalFreeze.value.calibrationId === CALIBRATION_ID &&
    provisionalFreeze.value.status ===
      'private-current-js-calibration-candidates-generated' &&
    provisionalFreeze.value.registrationCandidatePlacementCount === 277 &&
    provisionalFreeze.value.selectedPages.length === 277 &&
    provisionalFragment.value.calibration.freezeManifest ===
      PROVISIONAL_FREEZE &&
    provisionalFragment.value.calibration.entries.length === 277 &&
    exact(provisionalFragment.value.freeze, descriptor(provisionalFreeze)) &&
    exact(provisionalFreeze.value.inputs.predecessorFreeze,
      descriptor(predecessorFreeze)) &&
    predecessorFreeze.value.registrationCandidatePlacementCount === 276 &&
    predecessorFreeze.value.selectedPages.length === 276,
  'provisional 277 freeze/fragment/predecessor drifted');
  invariant(browser.value.artifactType ===
      'g678-current-js-277-browser-qa-v1' &&
    browser.value.registeredCurrentJsPages === 277 &&
    browser.value.allLessons.sharedCardCount === 44 &&
    browser.value.allLessons.linkedCardCount === 0 &&
    browser.value.allLessons.registeredPageSum === 277 &&
    browser.value.allLessons.consoleErrors.length === 0 &&
    browser.value.allLessons.pageErrors.length === 0 &&
    browser.value.samples.length === 27 &&
    browser.value.screenshots.length === 28 &&
    exact(browser.value.inputs.freeze, descriptor(provisionalFreeze)) &&
    exact(browser.value.inputs.script, descriptor(browserVerifier)) &&
    allFalse(browser.value.acceptanceEffects),
  '277 browser product-host evidence drifted');
  const selectedByFamily = new Map();
  for (const family of FAMILY_CONFIGS) {
    selectedByFamily.set(family.adapterFamily,
      provisionalFreeze.value.selectedPages.filter((page) =>
        page.adapterFamily === family.adapterFamily));
  }
  const familyByAdapter = new Map();
  for (let index = 0; index < FAMILY_CONFIGS.length; index += 1) {
    const family = FAMILY_CONFIGS[index];
    const familyBinding = familyBindings[index];
    const artifact = familyBinding.value;
    const selected = selectedByFamily.get(family.adapterFamily);
    const expectedIds = selected.map((page) => page.animationId).sort();
    const authorizedIds = [...artifact.authorizedPlacementIds].sort();
    invariant(artifact.artifactType === family.artifactType &&
      artifact.status ===
        'exact-one-current-js-assessment-product-host-calibrated' &&
      artifact.adapterFamily === family.adapterFamily &&
      selected.length === 1 && authorizedIds.length === 1 &&
      exact(authorizedIds, expectedIds) &&
      artifact.productHostCalibration
        .familyCurrentJsVisualAssessmentCalibrationPassed === true &&
      artifact.productHostCalibration
        .overallG678ProductCalibrationPassed === false &&
      exact(artifact.inputs.registrationFreeze,
        descriptor(provisionalFreeze)) &&
      exact(artifact.inputs.registrationFragment,
        descriptor(provisionalFragment)) &&
      exact(artifact.inputs.browser, descriptor(browser)) &&
      exact(artifact.inputs.browserVerifier, descriptor(browserVerifier)) &&
      allFalse(artifact.acceptanceEffects),
    `${family.artifactType}: authority or browser cross-binding drifted`);
    familyByAdapter.set(family.adapterFamily,
      Object.freeze({config: family, binding: familyBinding}));
  }
  const selectedPages = provisionalFreeze.value.selectedPages.map((page) => {
    const family = familyByAdapter.get(page.adapterFamily);
    if (family) {
      return calibratedPage(page, family.config, family.binding, browser);
    }
    if (page.adapterFamily?.startsWith('ts0') &&
      page.productHostCalibration) {
      return Object.freeze({...page,
        productHostCalibration: Object.freeze({
          ...page.productHostCalibration,
          browserEvidence: descriptor(browser),
        })});
    }
    return page;
  });
  invariant(selectedPages.length === 277 &&
    selectedPages.filter((page) => page.productHostCalibration).length === 61,
  'post-browser calibrated page denominator drifted');
  const familyDescriptors = familyBindings.map(descriptor);
  const inheritedAuthorityDeclarations =
    predecessorFreeze.value.inputs.selectionAuthorities;
  invariant(Array.isArray(inheritedAuthorityDeclarations) &&
    inheritedAuthorityDeclarations.length > 0,
  'predecessor selection authority declarations are missing');
  const inheritedAuthorityBindings = await Promise.all(
    inheritedAuthorityDeclarations.map((declaration) =>
      binding(declaration.path, true)));
  invariant(inheritedAuthorityBindings.every((authority, index) =>
    exact(descriptor(authority), inheritedAuthorityDeclarations[index])),
  'predecessor selection authority binding drifted');
  const combinedAuthorities = new Map();
  for (const declaration of [
    ...inheritedAuthorityBindings.map(descriptor),
    ...provisionalFreeze.value.inputs.selectionAuthorities,
    descriptor(provisionalFreeze),
    ...familyDescriptors,
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
      ...Object.fromEntries(FAMILY_CONFIGS.map((family, index) =>
        [family.inputKey, descriptor(familyBindings[index])])),
      provisionalFinalizer: provisionalFreeze.value.inputs.finalizer,
      finalizer: descriptor(builder),
    },
    selectedPages,
    productHostCalibration: {
      familyCalibratedPlacementCount: 61,
      familyCalibrationCount: 5,
      browserSampleCount: 27,
      screenshotCount: 28,
      allLessonsPartialRegistrationTruthful: true,
      overallG678ProductCalibrationPassed: false,
    },
    limitations: [
      '277 registered pages remain partial across all 44 lessons; no N/N whole-lesson engineering preview exists.',
      'The exact 60 TS02/TS03/TS04/TS05 L1 glossary placements retain product-host calibration; shared-nms002-l01-p043 additionally passed the bounded TS07 assessment product calibration.',
      'The other 43 TS07 placements remain blocked by content-authority, inactive-feedback, advanced-control, or representative-scale-out gates.',
      'Spanish assessment text parity, feedback and narration audio, legacy key-term sublinks/example SWFs, authoritative original runtime, fidelity, human, Owner, strict, release, and publication gates remain false.',
      'Recovered key-term XML remains private custody evidence and is not promoted into the canonical source tree.',
    ],
  };
  const freezeBytes = stableBytes(freeze);
  const fragment = {
    ...provisionalFragment.value,
    calibration: {
      ...provisionalFragment.value.calibration,
      freezeManifest: OUTPUT_FREEZE,
    },
    freeze: {path: OUTPUT_FREEZE, bytes: freezeBytes.length,
      sha256: sha256(freezeBytes)},
    familyScaleout: {
      ...provisionalFragment.value.familyScaleout,
      glossaryProductHostCalibratedPlacements: 60,
      glossaryFamilyCalibrationCount: 4,
      assessmentProductHostCalibratedPlacements: 1,
      assessmentFamilyCalibrationCount: 1,
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

export async function finalizeG678Ts07NmsL1FamilyRegistration({check = false} = {}) {
  const artifacts = await expectedArtifacts();
  if (check) {
    const [freeze, fragment] = await Promise.all([
      binding(OUTPUT_FREEZE), binding(OUTPUT_FRAGMENT),
    ]);
    invariant(freeze.buffer.equals(artifacts.freezeBytes) &&
      fragment.buffer.equals(artifacts.fragmentBytes),
    'post-browser 277 registration artifacts drifted');
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
    registrationCandidatePlacementCount: 277,
    productHostCalibratedPlacementCount: 61,
    frozenCalibrationPlacementCount: 2282,
    affectedLessonCount: 44,
    wholeLessonEngineeringPreviewCount: 0,
    productCalibrationPassed: false,
    freeze: {path: OUTPUT_FREEZE, bytes: artifacts.freezeBytes.length,
      sha256: sha256(artifacts.freezeBytes)},
    fragment: {path: OUTPUT_FRAGMENT, bytes: artifacts.fragmentBytes.length,
      sha256: sha256(artifacts.fragmentBytes)}});
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  const args = process.argv.slice(2);
  invariant(args.length <= 1 && (args.length === 0 || args[0] === '--check'),
    'usage: finalize-g678-ts07-nms-l1-family-registration.mjs [--check]');
  finalizeG678Ts07NmsL1FamilyRegistration({check: args.includes('--check')})
    .then((result) => process.stdout.write(`${JSON.stringify(result, null, 2)}\n`))
    .catch((error) => {
      process.stderr.write(`${error.stack ?? error.message}\n`);
      process.exitCode = 1;
    });
}
