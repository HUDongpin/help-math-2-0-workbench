#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {constants as fsConstants} from 'node:fs';
import {copyFile, lstat, readFile, unlink, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {buildTs02L1FamilyCalibration} from
  './build-g678-ts02-l1-family-calibration.mjs';
import {buildTs03L1FamilyCalibration} from
  './build-g678-ts03-l1-family-calibration.mjs';
import {buildTs04L1FamilyCalibration} from
  './build-g678-ts04-l1-family-calibration.mjs';
import {finalizeTs04L1Registration} from
  './finalize-g678-ts04-l1-registration.mjs';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
const CALIBRATION_ID = 'g678-16-page-product-calibration-v1';
const PROVISIONAL_FREEZE =
  'catalog/product-bridge-calibrations/g678-current-js-261-page-registration-v1.json';
const PROVISIONAL_FRAGMENT =
  'catalog/product-bridge-calibrations/g678-current-js-261-page-registration-v1.fragment.json';
const BROWSER_EVIDENCE =
  'output/playwright/g678-current-js-261-v2/evidence.json';
const BROWSER_VERIFIER = 'scripts/qa-g678-current-js-261-browser.mjs';
export const OUTPUT_FREEZE =
  'catalog/product-bridge-calibrations/g678-current-js-261-page-product-calibrated-registration-v1.json';
export const OUTPUT_FRAGMENT =
  'catalog/product-bridge-calibrations/g678-current-js-261-page-product-calibrated-registration-v1.fragment.json';

const FAMILY_CONFIGS = Object.freeze([
  Object.freeze({
    adapterFamily: 'ts02-l1-glossary-source-static',
    artifactType: 'g678-ts02-l1-family-calibration-v1',
    browserBlocker: 'ts02-l1-browser-product-calibration-pending',
    inputKey: 'ts02FamilyCalibration',
    path: 'catalog/product-bridge-calibrations/g678-ts02-l1-family-calibration-v1.json',
  }),
  Object.freeze({
    adapterFamily: 'ts03-l1-glossary-source-static',
    artifactType: 'g678-ts03-l1-family-calibration-v1',
    browserBlocker: 'ts03-l1-browser-product-calibration-pending',
    inputKey: 'ts03FamilyCalibration',
    path: 'catalog/product-bridge-calibrations/g678-ts03-l1-family-calibration-v1.json',
  }),
  Object.freeze({
    adapterFamily: 'ts04-l1-glossary-source-static',
    artifactType: 'g678-ts04-l1-family-calibration-v1',
    browserBlocker: 'ts04-l1-browser-product-calibration-pending',
    inputKey: 'ts04FamilyCalibration',
    path: 'catalog/product-bridge-calibrations/g678-ts04-l1-family-calibration-v1.json',
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
      typedBilingualGlossaryProductHostCalibrationPassed: true,
      productCalibrationPassed: false,
    }),
    productHostCalibration: Object.freeze({
      familyAuthority: descriptor(familyBinding),
      browserEvidence: descriptor(browserBinding),
      canvasReadyAndProgressing: true,
      exactEnglishGlossaryDefinitions: true,
      exactSpanishGlossaryDefinitions: true,
      playbackPausesWhileGlossaryOpen: true,
      playbackResumesAfterGlossaryClose: true,
    }),
    productBlockers: Object.freeze(retainedBlockers),
    productCalibrationPassed: false,
    engineeringPreviewReady: false,
  });
}

async function expectedArtifacts() {
  const provisionalAdmission = await finalizeTs04L1Registration({check: true});
  invariant(provisionalAdmission.check === true &&
    provisionalAdmission.registrationCandidatePlacementCount === 261,
  'provisional 261-page admission failed');
  const familyChecks = await Promise.all([
    buildTs02L1FamilyCalibration({check: true}),
    buildTs03L1FamilyCalibration({check: true}),
    buildTs04L1FamilyCalibration({check: true}),
  ]);
  invariant(familyChecks.every((result) => result.check === true &&
    result.productHostCalibrationPassed === true &&
    result.authorizedPlacementCount === 15),
  'glossary family product-host checks failed');
  const [provisionalFreeze, provisionalFragment, browser, browserVerifier,
    builder, ...familyBindings] = await Promise.all([
      binding(PROVISIONAL_FREEZE, true),
      binding(PROVISIONAL_FRAGMENT, true),
      binding(BROWSER_EVIDENCE, true),
      binding(BROWSER_VERIFIER),
      binding(path.relative(ROOT, SCRIPT_PATH)),
      ...FAMILY_CONFIGS.map((family) => binding(family.path, true)),
    ]);
  invariant(provisionalFreeze.value.calibrationId === CALIBRATION_ID &&
    provisionalFreeze.value.status ===
      'private-current-js-calibration-candidates-generated' &&
    provisionalFreeze.value.registrationCandidatePlacementCount === 261 &&
    provisionalFreeze.value.selectedPages.length === 261 &&
    provisionalFragment.value.calibration.freezeManifest ===
      PROVISIONAL_FREEZE &&
    provisionalFragment.value.calibration.entries.length === 261 &&
    exact(provisionalFragment.value.freeze, descriptor(provisionalFreeze)),
  'provisional 261 freeze/fragment drifted');
  invariant(browser.value.artifactType ===
      'g678-current-js-261-browser-qa-v1' &&
    browser.value.registeredCurrentJsPages === 261 &&
    browser.value.allLessons.sharedCardCount === 44 &&
    browser.value.allLessons.linkedCardCount === 0 &&
    browser.value.allLessons.registeredPageSum === 261 &&
    browser.value.allLessons.consoleErrors.length === 0 &&
    browser.value.allLessons.pageErrors.length === 0 &&
    browser.value.samples.length === 20 &&
    browser.value.screenshots.length === 21 &&
    exact(browser.value.inputs.freeze, descriptor(provisionalFreeze)) &&
    exact(browser.value.inputs.script, descriptor(browserVerifier)) &&
    allFalse(browser.value.acceptanceEffects),
  '261 browser product-host evidence drifted');
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
        'exact-15-current-js-visual-glossary-product-host-calibrated' &&
      artifact.adapterFamily === family.adapterFamily &&
      selected.length === 15 && authorizedIds.length === 15 &&
      exact(authorizedIds, expectedIds) &&
      artifact.productHostCalibration
        .familyCurrentJsVisualGlossaryCalibrationPassed === true &&
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
    return family
      ? calibratedPage(page, family.config, family.binding, browser)
      : page;
  });
  invariant(selectedPages.length === 261 &&
    selectedPages.filter((page) => page.productHostCalibration).length === 45,
  'post-browser calibrated page denominator drifted');
  const familyDescriptors = familyBindings.map(descriptor);
  const freeze = {
    ...provisionalFreeze.value,
    status: 'private-current-js-product-host-calibrated-candidates-registered',
    inputs: {
      ...provisionalFreeze.value.inputs,
      selectionAuthorities: [
        ...provisionalFreeze.value.inputs.selectionAuthorities,
        descriptor(provisionalFreeze),
        ...familyDescriptors,
      ],
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
      familyCalibratedPlacementCount: 45,
      familyCalibrationCount: 3,
      browserSampleCount: 20,
      screenshotCount: 21,
      allLessonsPartialRegistrationTruthful: true,
      overallG678ProductCalibrationPassed: false,
    },
    limitations: [
      '261 registered pages remain partial across all 44 lessons; no N/N whole-lesson engineering preview exists.',
      'The exact 45 TS02/TS03/TS04 L1 glossary placements passed maintained Current-JS visual and typed bilingual glossary product-host calibration.',
      'The other 29 placements in each TS02/TS03/TS04 family remain blocked because their lesson-referenced L2-L12 key-term XML was not recovered.',
      'Legacy key-term sublinks/example SWFs, audio, authoritative original runtime, fidelity, human, Owner, strict, release, and publication gates remain false.',
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
      glossaryProductHostCalibratedPlacements: 45,
      glossaryFamilyCalibrationCount: 3,
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

export async function finalizeG678GlossaryFamilyRegistration({check = false} = {}) {
  const artifacts = await expectedArtifacts();
  if (check) {
    const [freeze, fragment] = await Promise.all([
      binding(OUTPUT_FREEZE), binding(OUTPUT_FRAGMENT),
    ]);
    invariant(freeze.buffer.equals(artifacts.freezeBytes) &&
      fragment.buffer.equals(artifacts.fragmentBytes),
    'post-browser 261 registration artifacts drifted');
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
    registrationCandidatePlacementCount: 261,
    productHostCalibratedPlacementCount: 45,
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
    'usage: finalize-g678-glossary-family-registration.mjs [--check]');
  finalizeG678GlossaryFamilyRegistration({check: args.includes('--check')})
    .then((result) => process.stdout.write(`${JSON.stringify(result, null, 2)}\n`))
    .catch((error) => {
      process.stderr.write(`${error.stack ?? error.message}\n`);
      process.exitCode = 1;
    });
}
