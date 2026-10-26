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
const PHASE = process.argv.includes('--phase=final') ? 'final' : 'calibration';
const PREDECESSOR_FREEZE =
  'catalog/product-bridge-calibrations/g678-current-js-172-page-registration-v1.json';
const PREDECESSOR_FRAGMENT =
  'catalog/product-bridge-calibrations/g678-current-js-172-page-registration-v1.fragment.json';
const REVIEW = 'catalog/g678-final-quiz-intro-family-audit-v1.json';
const FAMILY =
  'catalog/product-bridge-calibrations/g678-fq01-family-calibration-v1.json';
const CALIBRATION_FRAGMENT =
  'catalog/product-bridge-calibrations/g678-fq01-current-js-calibration-1-v1.fragment.json';
const SCALE_FRAGMENT =
  'catalog/product-bridge-calibrations/g678-fq01-current-js-scaleout-43-v1.fragment.json';
const CATALOG = 'catalog/g678-shared-catalog.v1.json';
const PROFILE = 'catalog/g678-shared-source-profile.v1.json';
export const OUTPUT_FREEZE =
  PHASE === 'final'
    ? 'catalog/product-bridge-calibrations/g678-current-js-216-page-registration-v1.json'
    : 'catalog/product-bridge-calibrations/g678-current-js-173-page-fq01-calibration-v1.json';
export const OUTPUT_FRAGMENT =
  OUTPUT_FREEZE.replace(/\.json$/u, '.fragment.json');

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
  if (Array.isArray(value)) {
    invariant(value.length > 0, `${label} descriptor array is empty`);
    for (const [index, child] of value.entries()) {
      await verifyDescriptorTree(child, `${label}[${index}]`);
    }
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

export function expectedFq01Keys(review) {
  const audited = review.records.flatMap((record) =>
    record.placementIds).sort();
  invariant(audited.length === 44 && new Set(audited).size === 44 &&
    audited.includes('shared-alg001-l01-p055'),
  'reviewed FQ01 placement authority drifted');
  return Object.freeze(PHASE === 'final' ? audited :
    ['shared-alg001-l01-p055']);
}

async function fq01SelectedPage(entry, pageMap) {
  const catalog = pageMap.get(entry.key);
  invariant(catalog && entry.module === `./modules/${entry.key}` &&
    entry.complexityLane === 'interactive-understood' &&
    entry.adapterFamily === 'final-quiz-intro-source-static',
  `${entry.key}: FQ01 fragment/catalog binding drifted`);
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
    source.path === page.viewPath &&
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
    adapterFamily: 'final-quiz-intro-source-static',
    implementation: Object.freeze({kind: 'source-static-current-js-candidate',
      deploymentScope: 'local-only', productCalibrationPassed: false,
      familyVisualPlaybackCalibrationPassed: PHASE === 'final'}),
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
      ...(PHASE === 'final' ? [] :
        ['fq01-family-browser-calibration-pending']),
      'authoritative-original-runtime-not-established',
      'visual-fidelity-not-accepted',
    ]),
    productCalibrationPassed: false,
    engineeringPreviewReady: false,
  });
}

async function expectedArtifacts() {
  const [predecessorFreeze, predecessorFragment, review,
    calibrationFragment, catalog, profile, builder, family, scaleFragment] =
    await Promise.all([
      binding(PREDECESSOR_FREEZE, true),
      binding(PREDECESSOR_FRAGMENT, true),
      binding(REVIEW, true), binding(CALIBRATION_FRAGMENT, true),
      binding(CATALOG, true), binding(PROFILE, true),
      binding(path.relative(ROOT, SCRIPT_PATH)),
      PHASE === 'final' ? binding(FAMILY, true) : null,
      PHASE === 'final' ? binding(SCALE_FRAGMENT, true) : null,
    ]);
  invariant(predecessorFreeze.value.calibrationId === CALIBRATION_ID &&
    predecessorFreeze.value.selectedPages.length === 172 &&
    predecessorFragment.value.calibration.calibrationId === CALIBRATION_ID &&
    predecessorFragment.value.calibration.freezeManifest ===
      PREDECESSOR_FREEZE &&
    JSON.stringify(predecessorFragment.value.freeze) ===
      JSON.stringify(descriptor(predecessorFreeze)) &&
    predecessorFragment.value.calibration.entries.length === 172 &&
    JSON.stringify(predecessorFragment.value.calibration.entries
      .map((entry) => entry.key).sort()) ===
      JSON.stringify(predecessorFreeze.value.selectedPages
        .map((page) => page.animationId).sort()) &&
    review.value.scope.finalQuizIntroPlacements === 44 &&
    review.value.records.length === 6 &&
    calibrationFragment.value.generatedPlacementCount === 1 &&
    calibrationFragment.value.entries.length === 1 &&
    calibrationFragment.value.entries[0].key ===
      'shared-alg001-l01-p055' &&
    calibrationFragment.value.currentJavaScriptRegisteredCount === 0 &&
    (!family || (family.value.scaleOutAuthorization.authorized === true &&
      JSON.stringify(family.value.inputs.audit) ===
        JSON.stringify(descriptor(review)) &&
      family.value.authorizedPlacementIds.length === 44 &&
      new Set(family.value.authorizedPlacementIds).size === 44 &&
      scaleFragment.value.generatedPlacementCount === 43 &&
      scaleFragment.value.entries.length === 43 &&
      scaleFragment.value.currentJavaScriptRegisteredCount === 0)),
  'FQ01 predecessor/audit/fragment denominator drifted');
  await Promise.all([
    verifyDescriptorTree(predecessorFreeze.value.inputs,
      'predecessorFreeze.inputs'),
    verifyDescriptorTree(review.value.inputs, 'review.inputs'),
    ...(family
      ? [verifyDescriptorTree(family.value.inputs, 'family.inputs')]
      : []),
  ]);
  const sixteenFreezeDescriptor = predecessorFreeze.value.inputs.predecessorFreeze;
  const sixteenFreeze = await binding(sixteenFreezeDescriptor.path, true);
  invariant(sixteenFreeze.bytes === sixteenFreezeDescriptor.bytes &&
    sixteenFreeze.sha256 === sixteenFreezeDescriptor.sha256,
  'FQ01 predecessor 16-page authority binding drifted');
  const advancedFragmentDescriptor = sixteenFreeze.value.inputs.advanced3Fragment;
  const advancedRunDescriptor = sixteenFreeze.value.inputs.advanced3Run;
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
  const fragments = [calibrationFragment,
    ...(scaleFragment ? [scaleFragment] : [])];
  for (const candidateFragment of fragments) {
    const run = await binding(candidateFragment.value.compilerRun.path, true);
    invariant(run.bytes === candidateFragment.value.compilerRun.bytes &&
      run.sha256 === candidateFragment.value.compilerRun.sha256 &&
      JSON.stringify(candidateFragment.value.reviewedInventory) ===
        JSON.stringify(descriptor(review)) &&
      JSON.stringify(run.value.inputs.review) ===
        JSON.stringify(descriptor(review)) &&
      JSON.stringify(run.value.inputs.predecessorFreeze) ===
        JSON.stringify(descriptor(predecessorFreeze)) &&
      JSON.stringify(run.value.inputs.catalog) ===
        JSON.stringify(descriptor(catalog)) &&
      run.value.currentJavaScriptRegistered === false,
    'FQ01 compiler run drifted');
    if (candidateFragment === scaleFragment) {
      invariant(JSON.stringify(candidateFragment.value.familyCalibration) ===
        JSON.stringify(descriptor(family)) &&
        JSON.stringify(run.value.inputs.family) ===
          JSON.stringify(descriptor(family)),
      'FQ01 scale-out family authority drifted');
    }
    await verifyDescriptorTree(run.value.inputs, 'fq01Run.inputs');
    const expectedKeys = candidateFragment.value.entries.map((entry) =>
      entry.key).sort();
    invariant(JSON.stringify(run.value.members.map((member) =>
      member.animationId).sort()) === JSON.stringify(expectedKeys),
    'FQ01 fragment/run member set drifted');
    const runMembers = new Map(run.value.members.map((member) =>
      [member.animationId, member]));
    for (const entry of candidateFragment.value.entries) {
      const runMember = runMembers.get(entry.key);
      invariant(runMember &&
        JSON.stringify(runMember.manifest) ===
          JSON.stringify(entry.memberManifest) &&
        JSON.stringify(runMember.runtime) ===
          JSON.stringify(entry.runtime.canvasRenderer),
      `${entry.key}: FQ01 fragment/run artifact binding drifted`);
    }
  }
  const expectedKeys = expectedFq01Keys(review.value);
  const candidateEntries = fragments.flatMap((fragment) =>
    fragment.value.entries).sort((left, right) =>
    left.key.localeCompare(right.key));
  invariant(JSON.stringify(candidateEntries.map((entry) => entry.key)) ===
    JSON.stringify(expectedKeys),
  'FQ01 exact admission set drifted');
  const pageMap = catalogPages(catalog.value);
  const fq01Pages = [];
  for (const entry of candidateEntries) {
    fq01Pages.push(await fq01SelectedPage(entry, pageMap));
  }
  const selectedPages = [...predecessorFreeze.value.selectedPages,
    ...fq01Pages].sort((left, right) =>
    left.animationId.localeCompare(right.animationId));
  const finalCount = PHASE === 'final' ? 216 : 173;
  invariant(selectedPages.length === finalCount &&
    new Set(selectedPages.map((page) => page.animationId)).size === finalCount &&
    new Set(selectedPages.map((page) => page.stableLessonKey)).size === 44,
  'combined FQ01 membership drifted');
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
    registrationCandidatePlacementCount: finalCount,
    sharedAdapterPlacementCount: PHASE === 'final' ? 213 : 170,
    advancedManualPlacementCount: 3,
    legacyFlashCourseShellCount: 0,
    scaleOutAuthorized: false,
    engineeringPreviewReady: false,
    productCalibrationPassed: false,
    inputs: {
      sharedCatalog: descriptor(catalog),
      sourceProfile: descriptor(profile),
      selectionAuthorities: [descriptor(predecessorFreeze), descriptor(review),
        ...(family ? [descriptor(family)] : [])],
      predecessorFreeze: descriptor(predecessorFreeze),
      fq01Audit: descriptor(review),
      fq01CalibrationFragment: descriptor(calibrationFragment),
      ...(family ? {fq01FamilyCalibration: descriptor(family),
        fq01ScaleoutFragment: descriptor(scaleFragment)} : {}),
      finalizer: descriptor(builder),
    },
    selectedPages,
    pendingAdvancedManualPlacements: [],
    acceptanceEffects,
    limitations: [
      `${finalCount} registered pages remain partial across all 44 lessons; no N/N whole-lesson engineering preview exists.`,
      PHASE === 'final'
        ? 'FQ01 family calibration authorizes only the exact 44 audited intro placements.'
        : 'The single FQ01 representative is registered only for local browser family calibration.',
      'Audio, original-runtime, fidelity, human, Owner, strict, release, and publication gates remain false.',
    ],
  };
  const freezeBytes = stableBytes(freeze);
  const entries = [...predecessorFragment.value.calibration.entries,
    ...candidateEntries.map((entry) => ({key: entry.key,
      module: entry.module, maturity: entry.maturity,
      complexityLane: entry.complexityLane,
      artifacts: {module: entry.moduleFile, timeline: entry.timeline,
        runtime: entry.runtime.canvasRenderer}}))]
    .sort((left, right) => left.key.localeCompare(right.key));
  invariant(entries.length === finalCount &&
    new Set(entries.map((entry) => entry.key)).size === finalCount,
  'combined registry entry membership drifted');
  const fragment = {
    schemaVersion: 1,
    artifactType: 'private-current-js-calibration-fragment-v1',
    calibration: {calibrationId: CALIBRATION_ID,
      deploymentScope: 'local-only', freezeManifest: OUTPUT_FREEZE, entries},
    freeze: {path: OUTPUT_FREEZE, bytes: freezeBytes.length,
      sha256: sha256(freezeBytes)},
    descriptorProjection: {registrationCandidatePlacementCount: finalCount,
      frozenCalibrationPlacementCount: 2282,
      affectedLessonCount: 44,
      wholeLessonEngineeringPreviewCount: 0,
      sourceOrderedLessonMembershipRequired: true,
      modernMyLessonHostRequired: true,
      engineeringPreviewReady: false},
    familyScaleout: {fq01AuditedPlacements: 44,
      predecessorOverlap: 0,
      generatedAndAdmittedPlacements: PHASE === 'final' ? 44 : 1,
      familyCalibrationPassed: PHASE === 'final'},
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

export async function finalizeFq01Registration({check = false} = {}) {
  const artifacts = await expectedArtifacts();
  if (check) {
    const [freeze, fragment] = await Promise.all([
      binding(OUTPUT_FREEZE), binding(OUTPUT_FRAGMENT),
    ]);
    invariant(freeze.buffer.equals(artifacts.freezeBytes) &&
      fragment.buffer.equals(artifacts.fragmentBytes),
    'FQ01 registration artifacts drifted');
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
    registrationCandidatePlacementCount: PHASE === 'final' ? 216 : 173,
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
  invariant(args.every((arg) => arg === '--check' ||
      arg === '--phase=calibration' || arg === '--phase=final') &&
      args.filter((arg) => arg === '--check').length <= 1 &&
      args.filter((arg) => arg.startsWith('--phase=')).length === 1,
    'usage: finalize-g678-fq01-registration.mjs --phase=calibration|final [--check]');
  finalizeFq01Registration({check: args.includes('--check')})
    .then((result) => process.stdout.write(
      `${JSON.stringify(result, null, 2)}\n`,
    )).catch((error) => {
      process.stderr.write(`${error.stack ?? error.message}\n`);
      process.exitCode = 1;
    });
}
