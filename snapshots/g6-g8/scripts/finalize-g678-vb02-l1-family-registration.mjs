#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {constants as fsConstants} from 'node:fs';
import {copyFile, lstat, readFile, realpath, unlink, writeFile} from
  'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {buildVb02L1FamilyCalibration} from
  './build-g678-vb02-l1-family-calibration.mjs';
import {finalizeVb02L1Registration} from
  './finalize-g678-vb02-l1-registration.mjs';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
const CALIBRATION_ID = 'g678-16-page-product-calibration-v1';
const ADAPTER_FAMILY = 'vb02-l1-glossary-source-static';
const BROWSER_BLOCKER = 'vb02-l1-browser-product-calibration-pending';
const PROVISIONAL_FREEZE =
  'catalog/product-bridge-calibrations/g678-current-js-301-page-registration-v1.json';
const PROVISIONAL_FRAGMENT =
  'catalog/product-bridge-calibrations/g678-current-js-301-page-registration-v1.fragment.json';
const PREDECESSOR_FREEZE =
  'catalog/product-bridge-calibrations/g678-current-js-290-page-product-calibrated-registration-v1.json';
const FAMILY =
  'catalog/product-bridge-calibrations/g678-vb02-l1-family-calibration-v1.json';
const BROWSER = 'output/playwright/g678-current-js-301-v1/evidence.json';
const BROWSER_VERIFIER = 'scripts/qa-g678-current-js-301-browser.mjs';
export const OUTPUT_FREEZE =
  'catalog/product-bridge-calibrations/g678-current-js-301-page-product-calibrated-registration-v1.json';
export const OUTPUT_FRAGMENT =
  'catalog/product-bridge-calibrations/g678-current-js-301-page-product-calibrated-registration-v1.fragment.json';

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
  invariant(blockers.filter((blocker) => blocker === BROWSER_BLOCKER).length === 1,
    `${page.animationId}: VB02 browser calibration blocker is not exact`);
  const retainedBlockers = blockers.filter((blocker) =>
    blocker !== BROWSER_BLOCKER);
  invariant(retainedBlockers.length === 4 &&
    retainedBlockers.includes(
      'legacy-key-term-sublinks-and-example-swfs-not-implemented') &&
    retainedBlockers.includes('embedded-audio-lifecycle-not-implemented') &&
    retainedBlockers.includes('authoritative-original-runtime-not-established') &&
    retainedBlockers.includes('visual-fidelity-not-accepted'),
  `${page.animationId}: VB02 downstream blockers drifted`);
  return Object.freeze({...page,
    implementation: Object.freeze({...page.implementation,
      familyVisualPlaybackCalibrationPassed: true,
      sourceFrameBoundGlossaryProductHostCalibrationPassed: true,
      sourceCharacterBoundGlossaryProductHostCalibrationPassed: true,
      typedBilingualGlossaryProductHostCalibrationPassed: true,
      productCalibrationPassed: false,
    }),
    productHostCalibration: Object.freeze({
      familyAuthority: descriptor(family),
      browserEvidence: descriptor(browser),
      canvasReadyAndProgressing: true,
      sourceFrameBoundGlossaryControls: true,
      sourceCharacterIdentityBound: true,
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
  const provisionalAdmission = await finalizeVb02L1Registration({check: true});
  const familyAdmission = await buildVb02L1FamilyCalibration({check: true});
  invariant(provisionalAdmission.check === true &&
    provisionalAdmission.registrationCandidatePlacementCount === 301 &&
    familyAdmission.check === true &&
    familyAdmission.authorizedPlacementCount === 11 &&
    familyAdmission.productHostCalibrationPassed === true,
  'VB02 provisional/family admission failed');
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
    provisionalFreeze.value.registrationCandidatePlacementCount === 301 &&
    provisionalFreeze.value.selectedPages.length === 301 &&
    provisionalFragment.value.calibration.freezeManifest === PROVISIONAL_FREEZE &&
    provisionalFragment.value.calibration.entries.length === 301 &&
    exact(provisionalFragment.value.freeze, descriptor(provisionalFreeze)) &&
    exact(provisionalFreeze.value.inputs.predecessorFreeze,
      descriptor(predecessorFreeze)) &&
    predecessorFreeze.value.registrationCandidatePlacementCount === 290 &&
    predecessorFreeze.value.selectedPages.length === 290 &&
    predecessorFreeze.value.productHostCalibration
      .familyCalibratedPlacementCount === 74,
  'VB02 provisional freeze/fragment/predecessor drifted');
  invariant(family.value.artifactType ===
      'g678-vb02-l1-family-calibration-v1' &&
    family.value.status ===
      'exact-11-current-js-visual-glossary-product-host-calibrated' &&
    family.value.adapterFamily === ADAPTER_FAMILY &&
    family.value.authorizedPlacementIds.length === 11 &&
    family.value.productHostCalibration
      .familyCurrentJsVisualGlossaryCalibrationPassed === true &&
    family.value.productHostCalibration
      .overallG678ProductCalibrationPassed === false &&
    exact(family.value.inputs.registrationFreeze,
      descriptor(provisionalFreeze)) &&
    exact(family.value.inputs.registrationFragment,
      descriptor(provisionalFragment)) &&
    exact(family.value.inputs.browser, descriptor(browser)) &&
    exact(family.value.inputs.browserVerifier, descriptor(browserVerifier)) &&
    allFalse(family.value.acceptanceEffects),
  'VB02 family authority/browser cross-binding drifted');
  invariant(browser.value.artifactType ===
      'g678-current-js-301-browser-qa-v1' &&
    browser.value.registeredCurrentJsPages === 301 &&
    browser.value.allLessons.sharedCardCount === 44 &&
    browser.value.allLessons.linkedCardCount === 0 &&
    browser.value.allLessons.registeredPageSum === 301 &&
    browser.value.samples.length === 51 &&
    browser.value.screenshots.length === 52 &&
    exact(browser.value.inputs.freeze, descriptor(provisionalFreeze)) &&
    exact(browser.value.inputs.script, descriptor(browserVerifier)) &&
    allFalse(browser.value.acceptanceEffects),
  'VB02 301-page browser evidence drifted');
  const familyIds = [...family.value.authorizedPlacementIds].sort();
  const selectedByFamily = provisionalFreeze.value.selectedPages.filter((page) =>
    page.adapterFamily === ADAPTER_FAMILY);
  invariant(selectedByFamily.length === 11 &&
    exact(selectedByFamily.map((page) => page.animationId).sort(), familyIds),
  'VB02 provisional selected family set drifted');
  const selectedPages = provisionalFreeze.value.selectedPages.map((page) => {
    if (page.adapterFamily === ADAPTER_FAMILY) {
      return calibratedPage(page, family, browser);
    }
    if (!page.productHostCalibration) {
      return page;
    }
    // The 301-page browser run rechecks every previously calibrated family
    // representative as well as all 11 VB02 pages. Bind every inherited
    // product-host-calibrated page to that current, aggregate receipt so the
    // runtime bridge never has to accept a stale predecessor browser binding.
    return Object.freeze({...page,
      productHostCalibration: Object.freeze({
        ...page.productHostCalibration,
        browserEvidence: descriptor(browser),
      }),
    });
  });
  invariant(selectedPages.length === 301 &&
    selectedPages.filter((page) => page.productHostCalibration).length === 85 &&
    selectedPages.filter((page) => page.productHostCalibration)
      .every((page) => exact(page.productHostCalibration.browserEvidence,
        descriptor(browser))) &&
    selectedPages.filter((page) => page.adapterFamily === ADAPTER_FAMILY)
      .every((page) =>
        !page.productBlockers.includes(BROWSER_BLOCKER) &&
        page.implementation.familyVisualPlaybackCalibrationPassed === true &&
        page.productCalibrationPassed === false &&
        page.engineeringPreviewReady === false),
  'VB02 post-browser calibrated page denominator drifted');

  const inheritedAuthorityDeclarations =
    predecessorFreeze.value.inputs.selectionAuthorities;
  invariant(Array.isArray(inheritedAuthorityDeclarations) &&
    inheritedAuthorityDeclarations.length > 0,
  'predecessor selection authority declarations are missing');
  const inheritedAuthorities = await Promise.all(
    inheritedAuthorityDeclarations.map((item) => binding(item.path, true)));
  invariant(inheritedAuthorities.every((item, index) =>
    exact(descriptor(item), inheritedAuthorityDeclarations[index])),
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
      vb02L1FamilyCalibration: descriptor(family),
      provisionalFinalizer: provisionalFreeze.value.inputs.finalizer,
      finalizer: descriptor(builder),
    },
    selectedPages,
    productHostCalibration: {
      familyCalibratedPlacementCount: 85,
      familyCalibrationCount: 7,
      browserSampleCount: 51,
      screenshotCount: 52,
      allLessonsPartialRegistrationTruthful: true,
      overallG678ProductCalibrationPassed: false,
    },
    limitations: [
      '301 registered pages remain partial across all 44 lessons; no N/N whole-lesson engineering preview exists.',
      'The exact 11 VB-2 placements passed source-frame/source-character-bound Current-JS visual and bilingual glossary product-host calibration; the prior 74 calibrated placements remain independently bound.',
      'Two Spanish source-label collisions are preserved and separately identified by source button character; no translation was invented.',
      'Legacy key-term sublinks/example SWFs, embedded audio lifecycle, authoritative original runtime, fidelity, human, Owner, strict, release, and publication gates remain false.',
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
      vb02L1ProductHostCalibratedPlacements: 11,
      totalProductHostCalibratedPlacements: 85,
      familyCalibrationCount: 7,
      browserSampleCount: 51,
      screenshotCount: 52,
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

export async function finalizeG678Vb02L1FamilyRegistration({check = false} = {}) {
  const artifacts = await expectedArtifacts();
  if (check) {
    const [freeze, fragment] = await Promise.all([
      binding(OUTPUT_FREEZE), binding(OUTPUT_FRAGMENT),
    ]);
    invariant(freeze.buffer.equals(artifacts.freezeBytes) &&
      fragment.buffer.equals(artifacts.fragmentBytes),
    'post-browser 301 registration artifacts drifted');
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
    registrationCandidatePlacementCount: 301,
    productHostCalibratedPlacementCount: 85,
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
    'usage: finalize-g678-vb02-l1-family-registration.mjs [--check]');
  finalizeG678Vb02L1FamilyRegistration({check: args.includes('--check')})
    .then((result) => process.stdout.write(`${JSON.stringify(result, null, 2)}\n`))
    .catch((error) => {
      process.stderr.write(`${error.stack ?? error.message}\n`);
      process.exitCode = 1;
    });
}

