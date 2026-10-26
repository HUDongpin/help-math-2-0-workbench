#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {constants as fsConstants} from 'node:fs';
import {copyFile, lstat, readFile, unlink, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
const CALIBRATION_ID = 'g678-16-page-product-calibration-v1';
const SHARED_FREEZE =
  `catalog/product-bridge-calibrations/${CALIBRATION_ID}.json`;
const SHARED_FRAGMENT =
  `catalog/product-bridge-calibrations/${CALIBRATION_ID}.fragment.json`;
const ADVANCED_FRAGMENT =
  `catalog/product-bridge-calibrations/${CALIBRATION_ID}.advanced-manual-3.fragment.json`;
export const REGISTERED_FREEZE =
  `catalog/product-bridge-calibrations/${CALIBRATION_ID}.registered.json`;
export const REGISTERED_FRAGMENT =
  `catalog/product-bridge-calibrations/${CALIBRATION_ID}.registered.fragment.json`;
const IR_PATH =
  `catalog/product-bridge-calibrations/${CALIBRATION_ID}.ir.json`;
const CATALOG_PATH = 'catalog/g678-shared-catalog.v1.json';
const PROFILE_PATH = 'catalog/g678-shared-source-profile.v1.json';
const SHA256 = /^[a-f0-9]{64}$/u;

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
  invariant(typeof relativePath === 'string' && relativePath.length > 0 &&
    !path.isAbsolute(relativePath), `invalid project path: ${relativePath}`);
  const resolved = path.resolve(PROJECT_ROOT, relativePath);
  invariant(resolved.startsWith(`${PROJECT_ROOT}${path.sep}`),
    `project path escapes root: ${relativePath}`);
  return resolved;
}

async function binding(relativePath, {json = false} = {}) {
  const target = absolute(relativePath);
  const before = await lstat(target, {bigint: true});
  invariant(before.isFile() && !before.isSymbolicLink() && before.nlink === 1n,
    `${relativePath} must be one ordinary single-link file`);
  const bytes = await readFile(target);
  const after = await lstat(target, {bigint: true});
  invariant(before.dev === after.dev && before.ino === after.ino &&
    before.size === after.size && before.mtimeNs === after.mtimeNs &&
    before.mode === after.mode && before.nlink === after.nlink,
  `${relativePath} changed while read`);
  return Object.freeze({path: relativePath, bytes: bytes.length,
    sha256: sha256(bytes), ...(json ? {value: JSON.parse(bytes)} : {}),
    buffer: bytes});
}

function exact(actual, expected, label) {
  invariant(actual.path === expected.path && actual.bytes === expected.bytes &&
    actual.sha256 === expected.sha256, `${label} binding drifted`);
}

function pageIndex(catalog) {
  const pages = new Map();
  for (const lesson of catalog.lessons ?? []) {
    for (const page of lesson.pages ?? []) {
      pages.set(page.animationId, {lesson, page});
    }
  }
  return pages;
}

async function verifyDescriptorTree(value, label) {
  if (value && typeof value === 'object' &&
      typeof value.path === 'string' &&
      Number.isSafeInteger(value.bytes) && SHA256.test(value.sha256 ?? '')) {
    exact(await binding(value.path), value, label);
    return;
  }
  invariant(value && typeof value === 'object' && !Array.isArray(value),
    `${label} descriptor tree is invalid`);
  for (const [key, child] of Object.entries(value)) {
    await verifyDescriptorTree(child, `${label}.${key}`);
  }
}

export async function validateAdvancedRegistrationAuthority(
  advancedFragment,
  advancedRun,
) {
  const inputs = advancedFragment.value.inputs;
  invariant(JSON.stringify(Object.keys(inputs).sort()) === JSON.stringify([
    'calibrationIr', 'generator', 'productHost', 'safeCanvasAdapter', 'wrapper',
  ]) && JSON.stringify(Object.keys(inputs.productHost).sort()) ===
    JSON.stringify(['animationRuntime', 'contract', 'feedbackSelector',
      'g3HostBinding', 'g4ProductBridge', 'g5HostActionScript',
      'g5HostContract', 'runtime'].sort()),
  'advanced registration input key set drifted');
  await verifyDescriptorTree(inputs, 'advancedFragment.inputs');
  invariant(
    JSON.stringify(advancedRun.value.inputs.calibrationIr) ===
      JSON.stringify(inputs.calibrationIr) &&
      JSON.stringify(advancedRun.value.inputs.maintainedWrapper) ===
        JSON.stringify(inputs.wrapper) &&
      JSON.stringify(advancedRun.value.inputs.maintainedProductHost) ===
        JSON.stringify(inputs.productHost) &&
      JSON.stringify(advancedRun.value.inputs.safeCanvasAdapter) ===
        JSON.stringify(inputs.safeCanvasAdapter) &&
      JSON.stringify(advancedRun.value.inputs.generator) ===
        JSON.stringify(inputs.generator),
    'advanced fragment/run input authority drifted',
  );
  const fragmentEntries = advancedFragment.value.entries;
  const runMembers = new Map(advancedRun.value.members.map((member) =>
    [member.animationId, member]));
  invariant(runMembers.size === 3 && fragmentEntries.length === 3 &&
    JSON.stringify([...runMembers.keys()].sort()) ===
      JSON.stringify(fragmentEntries.map((entry) => entry.key).sort()),
  'advanced fragment/run member set drifted');
  for (const entry of fragmentEntries) {
    const runMember = runMembers.get(entry.key);
    invariant(runMember &&
      JSON.stringify({path: runMember.manifestPath,
        ...runMember.manifest}) ===
        JSON.stringify(entry.memberManifest) &&
      JSON.stringify(runMember.runtime) ===
        JSON.stringify(entry.runtime.canvasRenderer),
    `${entry.key}: advanced fragment/run artifact binding drifted`);
  }
}

function advancedSelectedPage({entry, placement, catalogRecord}) {
  const {lesson, page} = catalogRecord;
  invariant(page.animationId === entry.key && page.placementId === entry.key &&
    page.sourceSha256 === placement.sourceSha256 &&
    entry.complexityLane === 'behavior-heavy' &&
    entry.deploymentScope === 'local-only' &&
    entry.runtime?.hostSeekConsumerImplemented === true &&
    entry.runtime?.interactiveResolutionIntentContractImplemented === true,
  `${entry.key}: advanced source/product binding drifted`);
  const runtime = entry.runtime;
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
    complexityLane: 'behavior-heavy',
    adapterFamily: entry.adapterFamily,
    implementation: Object.freeze({
      kind: 'source-script-bound-product-behavior-current-js-candidate',
      deploymentScope: 'local-only',
      productCalibrationPassed: false,
    }),
    runtime: Object.freeze({
      stage: Object.freeze({width: 800, height: 600}),
      rootFrameCount: placement.rootFrameCount,
      rootBeginFrame: placement.rootBeginFrame,
      frameDomain: runtime.frameDomain,
      frameCount: runtime.frameCount,
      livePlaybackEndFrame: runtime.livePlaybackEndFrame,
      language: 'fixed-en',
      scenario: 'source-static-frame',
      seed: '0',
      ...(entry.key === 'shared-geo001-l01-p001'
        ? {}
        : {replaySeedCycle: 12}),
      canvasRenderer: runtime.canvasRenderer,
      interactiveStops: runtime.interactiveStops,
      interactiveSeek: runtime.interactiveSeek,
      companionDomains: runtime.companionDomains,
    }),
    runtimeEvidenceBoundary: Object.freeze({
      runtimeKind:
        'source-script-bound-product-behavior-current-js-candidate',
      actionScriptExecution: 'not-executed',
      naturalTraceValidation: 'not-established',
      audioAcceptance: 'not-established',
      replaySemantics:
        'product-complete-state-reset-original-runtime-parity-not-established',
    }),
    productBlockers: Object.freeze([
      'authoritative-original-runtime-not-established',
      'visual-fidelity-not-accepted',
      'feedback-and-embedded-audio-not-accepted',
      'spanish-source-behavior-unavailable',
      ...(entry.key === 'shared-nms002-l11-p030'
        ? ['hint-host-content-not-reconstructed'] : []),
      ...(entry.key === 'shared-geo001-l01-p001'
        ? ['source-fui-linkage-placement-unproven'] : []),
      ...(entry.key === 'shared-dat001-l05-p040'
        ? ['quiztrycount-replay-reset-is-modern-product-assumption'] : []),
    ]),
    productCalibrationPassed: false,
    engineeringPreviewReady: false,
  });
}

async function buildArtifacts() {
  const [sharedFreeze, sharedFragment, advancedFragment, ir, catalog,
    profile, generator] = await Promise.all([
      binding(SHARED_FREEZE, {json: true}),
      binding(SHARED_FRAGMENT, {json: true}),
      binding(ADVANCED_FRAGMENT, {json: true}),
      binding(IR_PATH, {json: true}),
      binding(CATALOG_PATH, {json: true}),
      binding(PROFILE_PATH, {json: true}),
      binding(path.relative(PROJECT_ROOT, SCRIPT_PATH)),
    ]);
  exact(catalog, sharedFreeze.value.inputs.sharedCatalog, 'shared catalog');
  exact(profile, sharedFreeze.value.inputs.sourceProfile, 'source profile');
  await verifyDescriptorTree(sharedFreeze.value.inputs, 'sharedFreeze.inputs');
  invariant(sharedFreeze.value.calibrationId === CALIBRATION_ID &&
    sharedFreeze.value.registrationCandidatePlacementCount === 13 &&
    sharedFreeze.value.selectedPages?.length === 13 &&
    sharedFreeze.value.pendingAdvancedManualPlacements?.length === 3 &&
    sharedFreeze.value.productCalibrationPassed === false &&
    sharedFreeze.value.engineeringPreviewReady === false &&
    sharedFreeze.value.scaleOutAuthorized === false,
  'shared-13 freeze is not the canonical fail-closed input');
  exact(sharedFreeze, sharedFragment.value.freeze,
    'shared fragment freeze');
  invariant(advancedFragment.value.calibrationId === CALIBRATION_ID &&
    advancedFragment.value.generatedPrivateCurrentJsModuleCount === 3 &&
    advancedFragment.value.currentJavaScriptRegisteredCount === 0 &&
    advancedFragment.value.entries?.length === 3 &&
    advancedFragment.value.feedbackBoundary?.hostVariantSelectionAlgorithmsRecovered === 2 &&
    advancedFragment.value.feedbackBoundary?.pagesBlockedPendingHostVariant === 0 &&
    advancedFragment.value.feedbackBoundary?.guessedSelections === 0 &&
    advancedFragment.value.interactiveStopBoundary?.hostConsumerImplemented === true &&
    advancedFragment.value.interactiveStopBoundary?.registrationBlockedUntilHostConsumer === false &&
    advancedFragment.value.seekBoundary?.hostSeekConsumerImplemented === true &&
    advancedFragment.value.seekBoundary?.registrationBlockedUntilHostSeekConsumer === false &&
    advancedFragment.value.productCalibrationPassed === false &&
    advancedFragment.value.engineeringPreviewReady === false &&
    advancedFragment.value.scaleOutAuthorized === false,
  'advanced-3 host integration boundary is not registration-candidate ready');
  const advancedRun = await binding(
    advancedFragment.value.compilerRunPath, {json: true});
  invariant(advancedRun.value.currentJavaScriptRegistered === false &&
    advancedRun.value.scope?.registryEntriesWritten === 0 &&
    advancedRun.value.scope?.webBridgeFilesWritten === 0,
  'advanced run crossed its pre-registration boundary');
  await validateAdvancedRegistrationAuthority(advancedFragment, advancedRun);
  const placements = new Map((ir.value.placements ?? []).map((placement) =>
    [placement.animationId, placement]));
  const catalogPages = pageIndex(catalog.value);
  const advancedPages = [];
  for (const entry of advancedFragment.value.entries) {
    invariant(entry.module === `./modules/${entry.key}` &&
      entry.moduleFile?.path ===
        `packages/demos/src/modules/${entry.key}.tsx` &&
      entry.timeline?.path ===
        `packages/demos/src/timelines/${entry.key}.ts` &&
      SHA256.test(entry.runtime?.canvasRenderer?.sha256 ?? ''),
    `${entry.key}: advanced fragment artifact path is invalid`);
    for (const descriptor of [entry.moduleFile, entry.timeline,
      entry.memberManifest, entry.runtime.canvasRenderer]) {
      exact(await binding(descriptor.path), descriptor,
        `${entry.key} ${descriptor.path}`);
    }
    const placement = placements.get(entry.key);
    const catalogRecord = catalogPages.get(entry.key);
    invariant(placement?.implementationDisposition === 'advanced-manual' &&
      catalogRecord, `${entry.key}: advanced placement is not canonical`);
    advancedPages.push(advancedSelectedPage({entry, placement, catalogRecord}));
  }
  const selectedPages = [...sharedFreeze.value.selectedPages, ...advancedPages]
    .sort((left, right) => left.animationId.localeCompare(right.animationId));
  invariant(selectedPages.length === 16 &&
    new Set(selectedPages.map((page) => page.animationId)).size === 16 &&
    new Set(selectedPages.map((page) => page.stableLessonKey)).size === 16 &&
    (profile.value.calibrationSet ?? []).length === 16,
  'combined calibration must contain the exact sixteen distinct-lesson placements');
  const acceptanceEffects = Object.freeze({...sharedFreeze.value.acceptanceEffects});
  invariant(Object.values(acceptanceEffects).every((value) => value === false),
    'combined calibration acceptance effects must remain false');
  const freeze = {
    schemaVersion: 1,
    calibrationId: CALIBRATION_ID,
    deploymentScope: 'local-only',
    status: 'private-current-js-calibration-candidates-generated',
    frozenCalibrationPlacementCount: 16,
    registrationCandidatePlacementCount: 16,
    sharedAdapterPlacementCount: 13,
    advancedManualPlacementCount: 3,
    legacyFlashCourseShellCount: 0,
    scaleOutAuthorized: false,
    engineeringPreviewReady: false,
    productCalibrationPassed: false,
    inputs: {
      ...sharedFreeze.value.inputs,
      shared13Freeze: {path: SHARED_FREEZE, bytes: sharedFreeze.bytes,
        sha256: sharedFreeze.sha256},
      advanced3Fragment: {path: ADVANCED_FRAGMENT,
        bytes: advancedFragment.bytes, sha256: advancedFragment.sha256},
      advanced3Run: {path: advancedFragment.value.compilerRunPath,
        bytes: advancedRun.bytes, sha256: advancedRun.sha256},
      finalizer: {path: generator.path, bytes: generator.bytes,
        sha256: generator.sha256},
    },
    selectedPages,
    pendingAdvancedManualPlacements: [],
    acceptanceEffects,
    limitations: Object.freeze([
      'This is a private local-only Current-JS registration candidate freeze, not product calibration acceptance.',
      'Sixteen placements across sixteen lessons do not constitute any N/N whole-lesson engineering preview.',
      'Original-runtime, visual fidelity, audio, Spanish behavior, human, Owner, strict completion, release, and publication remain false.',
      'Scale-out remains unauthorized.',
    ]),
  };
  const freezeBytes = stableBytes(freeze);
  const sharedEntries = sharedFragment.value.calibration.entries;
  const advancedEntries = advancedFragment.value.entries.map((entry) => ({
    key: entry.key,
    module: entry.module,
    maturity: entry.maturity,
    complexityLane: entry.complexityLane,
  }));
  const entries = [...sharedEntries, ...advancedEntries]
    .sort((left, right) => left.key.localeCompare(right.key));
  const fragment = {
    schemaVersion: 1,
    artifactType: 'private-current-js-calibration-fragment-v1',
    calibration: {
      calibrationId: CALIBRATION_ID,
      deploymentScope: 'local-only',
      freezeManifest: REGISTERED_FREEZE,
      entries,
    },
    freeze: {path: REGISTERED_FREEZE, bytes: freezeBytes.length,
      sha256: sha256(freezeBytes)},
    descriptorProjection: {
      registrationCandidatePlacementCount: 16,
      frozenCalibrationPlacementCount: 16,
      sourceOrderedLessonMembershipRequired: true,
      modernMyLessonHostRequired: true,
      wholeLessonEngineeringPreviewCount: 0,
      engineeringPreviewReady: false,
    },
    productHost: {
      feedbackSelectorRecoveredPages: 2,
      interactiveStopConsumerImplementedPages: 2,
      seekConsumerImplementedPages: 1,
      authoritativeAdobeRandomStateAccepted: false,
    },
    acceptanceEffects,
  };
  return Object.freeze({freeze, freezeBytes, fragment,
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

export async function finalize({check = false} = {}) {
  const artifacts = await buildArtifacts();
  if (check) {
    const [freeze, fragment] = await Promise.all([
      binding(REGISTERED_FREEZE), binding(REGISTERED_FRAGMENT),
    ]);
    invariant(freeze.buffer.equals(artifacts.freezeBytes) &&
      fragment.buffer.equals(artifacts.fragmentBytes),
    'registered calibration finalization artifacts drifted');
  } else {
    await writeExclusive(REGISTERED_FREEZE, artifacts.freezeBytes);
    try {
      await writeExclusive(REGISTERED_FRAGMENT, artifacts.fragmentBytes);
    } catch (error) {
      const freeze = await binding(REGISTERED_FREEZE);
      if (freeze.buffer.equals(artifacts.freezeBytes)) {
        await unlink(absolute(REGISTERED_FREEZE));
      }
      throw error;
    }
  }
  return Object.freeze({calibrationId: CALIBRATION_ID, check,
    registrationCandidatePlacementCount: 16,
    wholeLessonEngineeringPreviewCount: 0,
    productCalibrationPassed: false,
    scaleOutAuthorized: false,
    freeze: {path: REGISTERED_FREEZE, bytes: artifacts.freezeBytes.length,
      sha256: sha256(artifacts.freezeBytes)},
    fragment: {path: REGISTERED_FRAGMENT,
      bytes: artifacts.fragmentBytes.length,
      sha256: sha256(artifacts.fragmentBytes)}});
}

function parseArgs(argv) {
  invariant(argv.length <= 1 && (argv.length === 0 || argv[0] === '--check'),
    'usage: finalize-g678-16-page-private-calibration.mjs [--check]');
  return {check: argv[0] === '--check'};
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  finalize(parseArgs(process.argv.slice(2))).then((result) => {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  }).catch((error) => {
    process.stderr.write(`${error.stack ?? error.message}\n`);
    process.exitCode = 1;
  });
}
