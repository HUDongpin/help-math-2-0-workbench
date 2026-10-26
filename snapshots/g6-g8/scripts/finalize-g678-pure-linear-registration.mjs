#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {constants as fsConstants} from 'node:fs';
import {copyFile, lstat, readFile, unlink, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {
  validateAdvancedRegistrationAuthority,
} from './finalize-g678-16-page-private-calibration.mjs';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
const CALIBRATION_ID = 'g678-16-page-product-calibration-v1';
const PREDECESSOR_FREEZE =
  'catalog/product-bridge-calibrations/g678-16-page-product-calibration-v1.registered.json';
const PREDECESSOR_FRAGMENT =
  'catalog/product-bridge-calibrations/g678-16-page-product-calibration-v1.registered.fragment.json';
const REVIEW = 'catalog/g678-pure-linear-reviewed-inventory-v1.json';
const FAMILY =
  'catalog/product-bridge-calibrations/g678-pure-linear-family-calibration-v1.json';
const SCALE_FRAGMENT =
  'catalog/product-bridge-calibrations/g678-pure-linear-current-js-scaleout-v1.fragment.json';
const CATALOG = 'catalog/g678-shared-catalog.v1.json';
const PROFILE = 'catalog/g678-shared-source-profile.v1.json';
export const OUTPUT_FREEZE =
  'catalog/product-bridge-calibrations/g678-current-js-172-page-registration-v1.json';
export const OUTPUT_FRAGMENT =
  'catalog/product-bridge-calibrations/g678-current-js-172-page-registration-v1.fragment.json';

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
  const result = path.resolve(ROOT, relativePath);
  invariant(result.startsWith(`${ROOT}${path.sep}`),
    `${relativePath} escapes project root`);
  return result;
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

async function verifyDescriptorTree(value, label) {
  if (value && typeof value === 'object' &&
      typeof value.path === 'string' &&
      Number.isSafeInteger(value.bytes) &&
      /^[a-f0-9]{64}$/u.test(value.sha256 ?? '')) {
    const current = await binding(value.path);
    invariant(current.bytes === value.bytes && current.sha256 === value.sha256,
      `${label} binding drifted`);
    return;
  }
  invariant(value && typeof value === 'object' && !Array.isArray(value),
    `${label} descriptor tree is invalid`);
  for (const [key, child] of Object.entries(value)) {
    await verifyDescriptorTree(child, `${label}.${key}`);
  }
}
function catalogPages(catalog) {
  return new Map(catalog.lessons.flatMap((lesson) =>
    lesson.pages.map((page) => [page.animationId, {lesson, page}])));
}

export function expectedPureLinearScaleoutKeys(review, predecessorFreeze) {
  const predecessorIds = new Set(predecessorFreeze.selectedPages.map((page) =>
    page.animationId));
  const authorized = review.authorizedPlacementIds;
  invariant(Array.isArray(authorized) && authorized.length === 157 &&
    new Set(authorized).size === 157,
  'reviewed pure-linear placement authority drifted');
  const overlap = authorized.filter((animationId) =>
    predecessorIds.has(animationId));
  invariant(JSON.stringify(overlap) ===
    JSON.stringify(['shared-alg001-l06-p040']),
  'pure-linear predecessor overlap drifted');
  return Object.freeze(authorized.filter((animationId) =>
    !predecessorIds.has(animationId)).sort());
}

async function pureSelectedPage(entry, pageMap) {
  const catalog = pageMap.get(entry.key);
  invariant(catalog && entry.module === `./modules/${entry.key}` &&
    entry.complexityLane === 'interactive-understood' &&
    entry.adapterFamily === 'pure-linear-source-static',
  `${entry.key}: pure-linear fragment/catalog binding drifted`);
  const [moduleFile, timeline, runtime, manifest] = await Promise.all([
    binding(entry.moduleFile.path), binding(entry.timeline.path),
    binding(entry.runtime.canvasRenderer.path),
    binding(entry.memberManifest.path, true),
  ]);
  for (const [actual, expected, label] of [
    [moduleFile, entry.moduleFile, 'module'],
    [timeline, entry.timeline, 'timeline'],
    [runtime, entry.runtime.canvasRenderer, 'runtime'],
    [manifest, entry.memberManifest, 'member manifest'],
  ]) invariant(actual.bytes === expected.bytes &&
    actual.sha256 === expected.sha256, `${entry.key}: ${label} drifted`);
  const source = manifest.value.source;
  const sourcePath = source.path;
  const page = catalog.page;
  const lesson = catalog.lesson;
  invariant(manifest.value.animationId === entry.key &&
    JSON.stringify(manifest.value.runtime.canvasRenderer) ===
      JSON.stringify(entry.runtime.canvasRenderer) &&
    source.sha256 === page.sourceSha256 &&
    typeof sourcePath === 'string' &&
    sourcePath.startsWith('G6-G8-shared/') &&
    manifest.value.timeline.frameDomain === entry.runtime.frameDomain &&
    manifest.value.timeline.frameCount === entry.runtime.frameCount &&
    manifest.value.timeline.livePlaybackEndFrame ===
      entry.runtime.livePlaybackEndFrame,
  `${entry.key}: member source/timeline drifted`);
  return Object.freeze({
    animationId: entry.key,
    placementId: entry.key,
    assetId: page.assetId,
    moduleCode: lesson.moduleCode,
    lessonNumber: lesson.lessonNumber,
    stableLessonKey: lesson.stableLessonKey,
    globalPageOrdinal: page.globalOrdinal,
    sectionCode: page.sectionCode,
    sectionPageOrdinal: page.sectionPageOrdinal,
    sourceSha256: page.sourceSha256,
    complexityLane: 'interactive-understood',
    adapterFamily: 'pure-linear-source-static',
    implementation: Object.freeze({kind: 'source-static-current-js-candidate',
      deploymentScope: 'local-only', productCalibrationPassed: false,
      familyVisualPlaybackCalibrationPassed: true}),
    runtime: Object.freeze({stage: Object.freeze({width: 800, height: 600}),
      rootFrameCount: manifest.value.timeline.rootFrameCount,
      rootBeginFrame: 6,
      frameDomain: entry.runtime.frameDomain,
      frameCount: entry.runtime.frameCount,
      livePlaybackEndFrame: entry.runtime.livePlaybackEndFrame,
      language: 'fixed-en', scenario: 'source-static-frame', seed: '0',
      canvasRenderer: entry.runtime.canvasRenderer}),
    runtimeEvidenceBoundary: Object.freeze({
      runtimeKind: 'source-static-current-js-candidate',
      actionScriptExecution: 'not-executed',
      naturalTraceValidation: 'not-established',
      audioAcceptance: 'not-established',
      replaySemantics:
        'renderer-restart-only-source-behavior-not-established'}),
    productBlockers: Object.freeze([
      'embedded-audio-lifecycle-not-implemented',
      'authoritative-original-runtime-not-established',
      'visual-fidelity-not-accepted',
    ]),
    productCalibrationPassed: false,
    engineeringPreviewReady: false,
  });
}

async function expectedArtifacts() {
  const [predecessorFreeze, predecessorFragment, review, family, scaleFragment,
    catalog, profile, builder] = await Promise.all([
      binding(PREDECESSOR_FREEZE, true),
      binding(PREDECESSOR_FRAGMENT, true),
      binding(REVIEW, true), binding(FAMILY, true),
      binding(SCALE_FRAGMENT, true),
      binding(CATALOG, true), binding(PROFILE, true),
      binding(path.relative(ROOT, SCRIPT_PATH)),
    ]);
  invariant(predecessorFreeze.value.calibrationId === CALIBRATION_ID &&
    predecessorFreeze.value.selectedPages.length === 16 &&
    predecessorFragment.value.calibration.calibrationId === CALIBRATION_ID &&
    predecessorFragment.value.calibration.freezeManifest ===
      PREDECESSOR_FREEZE &&
    JSON.stringify(predecessorFragment.value.freeze) ===
      JSON.stringify(descriptor(predecessorFreeze)) &&
    predecessorFragment.value.calibration.entries.length === 16 &&
    JSON.stringify(predecessorFragment.value.calibration.entries
      .map((entry) => entry.key).sort()) ===
      JSON.stringify(predecessorFreeze.value.selectedPages
        .map((page) => page.animationId).sort()) &&
    review.value.summary.generationAuthorizedPlacements === 157 &&
    family.value.scaleOutAuthorization.authorized === true &&
    scaleFragment.value.generatedPlacementCount === 156 &&
    scaleFragment.value.entries.length === 156 &&
    scaleFragment.value.currentJavaScriptRegisteredCount === 0,
  'predecessor/review/scale fragment denominator drifted');
  await Promise.all([
    verifyDescriptorTree(predecessorFreeze.value.inputs,
      'predecessorFreeze.inputs'),
    verifyDescriptorTree(review.value.inputs, 'review.inputs'),
    verifyDescriptorTree(family.value.inputs, 'family.inputs'),
  ]);
  const advancedFragmentDescriptor =
    predecessorFreeze.value.inputs.advanced3Fragment;
  const advancedRunDescriptor = predecessorFreeze.value.inputs.advanced3Run;
  const [advancedFragment, advancedRun] = await Promise.all([
    binding(advancedFragmentDescriptor.path, true),
    binding(advancedRunDescriptor.path, true),
  ]);
  invariant(advancedFragment.bytes === advancedFragmentDescriptor.bytes &&
    advancedFragment.sha256 === advancedFragmentDescriptor.sha256 &&
    advancedRun.bytes === advancedRunDescriptor.bytes &&
    advancedRun.sha256 === advancedRunDescriptor.sha256,
  'predecessor advanced authority binding drifted');
  await validateAdvancedRegistrationAuthority(advancedFragment, advancedRun);
  const run = await binding(scaleFragment.value.compilerRun.path, true);
  invariant(run.bytes === scaleFragment.value.compilerRun.bytes &&
    run.sha256 === scaleFragment.value.compilerRun.sha256 &&
    JSON.stringify(scaleFragment.value.reviewedInventory) ===
      JSON.stringify(descriptor(review)) &&
    JSON.stringify(scaleFragment.value.familyCalibration) ===
      JSON.stringify(descriptor(family)) &&
    JSON.stringify(run.value.inputs.review) ===
      JSON.stringify(descriptor(review)) &&
    JSON.stringify(run.value.inputs.family) ===
      JSON.stringify(descriptor(family)) &&
    JSON.stringify(run.value.inputs.predecessorFreeze) ===
      JSON.stringify(descriptor(predecessorFreeze)) &&
    JSON.stringify(run.value.inputs.catalog) ===
      JSON.stringify(descriptor(catalog)) &&
    run.value.scope.generatedPlacementCount === 156 &&
    run.value.currentJavaScriptRegistered === false,
  'pure-linear compiler run drifted');
  await verifyDescriptorTree(run.value.inputs, 'pureLinearRun.inputs');
  const expectedScaleoutKeys = expectedPureLinearScaleoutKeys(review.value,
    predecessorFreeze.value);
  const scaleEntryKeys = scaleFragment.value.entries.map((entry) =>
    entry.key).sort();
  invariant(JSON.stringify(scaleEntryKeys) ===
    JSON.stringify(expectedScaleoutKeys) &&
    JSON.stringify(run.value.members.map((member) =>
      member.animationId).sort()) === JSON.stringify(expectedScaleoutKeys),
  'pure-linear reviewed authority/fragment/run member set drifted');
  const runMembers = new Map(run.value.members.map((member) =>
    [member.animationId, member]));
  for (const entry of scaleFragment.value.entries) {
    const runMember = runMembers.get(entry.key);
    invariant(runMember &&
      JSON.stringify(runMember.manifest) ===
        JSON.stringify(entry.memberManifest) &&
      JSON.stringify(runMember.runtime) ===
        JSON.stringify(entry.runtime.canvasRenderer),
    `${entry.key}: scale fragment/run artifact binding drifted`);
  }
  const pageMap = catalogPages(catalog.value);
  const purePages = [];
  for (const entry of scaleFragment.value.entries) {
    purePages.push(await pureSelectedPage(entry, pageMap));
  }
  const selectedPages = [...predecessorFreeze.value.selectedPages,
    ...purePages].sort((left, right) =>
    left.animationId.localeCompare(right.animationId));
  invariant(selectedPages.length === 172 &&
    new Set(selectedPages.map((page) => page.animationId)).size === 172 &&
    new Set(selectedPages.map((page) => page.stableLessonKey)).size === 44,
  'combined 172-page membership drifted');
  const acceptanceEffects = Object.freeze({
    ...predecessorFreeze.value.acceptanceEffects,
  });
  invariant(Object.values(acceptanceEffects).every((value) => value === false),
    'combined acceptance effects must remain false');
  const freeze = {
    schemaVersion: 1,
    calibrationId: CALIBRATION_ID,
    deploymentScope: 'local-only',
    status: 'private-current-js-calibration-candidates-generated',
    frozenCalibrationPlacementCount: 2282,
    registrationCandidatePlacementCount: 172,
    sharedAdapterPlacementCount: 169,
    advancedManualPlacementCount: 3,
    legacyFlashCourseShellCount: 0,
    scaleOutAuthorized: false,
    engineeringPreviewReady: false,
    productCalibrationPassed: false,
    inputs: {
      sharedCatalog: descriptor(catalog),
      sourceProfile: descriptor(profile),
      selectionAuthorities: [descriptor(predecessorFreeze), descriptor(review)],
      predecessorFreeze: descriptor(predecessorFreeze),
      pureLinearReviewedInventory: descriptor(review),
      pureLinearScaleoutFragment: descriptor(scaleFragment),
      pureLinearCompilerRun: descriptor(run),
      finalizer: descriptor(builder),
    },
    selectedPages,
    pendingAdvancedManualPlacements: [],
    acceptanceEffects,
    limitations: [
      '172 registered pages remain partial across all 44 lessons; no N/N whole-lesson engineering preview exists.',
      'Pure-linear family authorization does not authorize glossary, hover, intro/FUI, or other interactive pages.',
      'Audio, original-runtime, fidelity, human, Owner, strict, release, and publication gates remain false.',
    ],
  };
  const freezeBytes = stableBytes(freeze);
  const entries = [...predecessorFragment.value.calibration.entries,
    ...scaleFragment.value.entries.map((entry) => ({key: entry.key,
      module: entry.module, maturity: entry.maturity,
      complexityLane: entry.complexityLane}))]
    .sort((left, right) => left.key.localeCompare(right.key));
  invariant(entries.length === 172 &&
    new Set(entries.map((entry) => entry.key)).size === 172,
  'combined registry entry membership drifted');
  const fragment = {
    schemaVersion: 1,
    artifactType: 'private-current-js-calibration-fragment-v1',
    calibration: {calibrationId: CALIBRATION_ID,
      deploymentScope: 'local-only', freezeManifest: OUTPUT_FREEZE, entries},
    freeze: {path: OUTPUT_FREEZE, bytes: freezeBytes.length,
      sha256: sha256(freezeBytes)},
    descriptorProjection: {registrationCandidatePlacementCount: 172,
      frozenCalibrationPlacementCount: 2282,
      affectedLessonCount: 44,
      wholeLessonEngineeringPreviewCount: 0,
      sourceOrderedLessonMembershipRequired: true,
      modernMyLessonHostRequired: true,
      engineeringPreviewReady: false},
    familyScaleout: {pureLinearAuthorizedPlacements: 157,
      predecessorOverlap: 1, generatedAndAdmittedPlacements: 156},
    acceptanceEffects,
  };
  return Object.freeze({freezeBytes, fragmentBytes: stableBytes(fragment),
    freeze, fragment});
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

export async function finalizePureLinearRegistration({check = false} = {}) {
  const artifacts = await expectedArtifacts();
  if (check) {
    const [freeze, fragment] = await Promise.all([
      binding(OUTPUT_FREEZE), binding(OUTPUT_FRAGMENT),
    ]);
    invariant(freeze.buffer.equals(artifacts.freezeBytes) &&
      fragment.buffer.equals(artifacts.fragmentBytes),
    '172-page registration artifacts drifted');
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
  return Object.freeze({check, registrationCandidatePlacementCount: 172,
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
    'usage: finalize-g678-pure-linear-registration.mjs [--check]');
  finalizePureLinearRegistration({check: args[0] === '--check'})
    .then((result) => process.stdout.write(
      `${JSON.stringify(result, null, 2)}\n`,
    )).catch((error) => {
      process.stderr.write(`${error.stack ?? error.message}\n`);
      process.exitCode = 1;
    });
}
