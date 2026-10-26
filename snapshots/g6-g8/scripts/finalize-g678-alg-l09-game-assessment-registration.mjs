#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {constants as fsConstants} from 'node:fs';
import {copyFile, lstat, readFile, unlink, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {auditG678AlgL09GameAssessmentFamily} from
  './audit-g678-alg-l09-game-assessment-family.mjs';
import {runAlgL09GameAssessmentCurrentJs} from
  './build-g678-alg-l09-game-assessment-current-js.mjs';
import {finalizeG678AlgL09GuidedTutorialFamilyRegistration} from
  './finalize-g678-alg-l09-guided-tutorial-family-registration.mjs';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
const CALIBRATION_ID = 'g678-16-page-product-calibration-v1';
const PREDECESSOR_FREEZE =
  'catalog/product-bridge-calibrations/g678-current-js-339-page-product-calibrated-registration-v1.json';
const PREDECESSOR_FRAGMENT =
  'catalog/product-bridge-calibrations/g678-current-js-339-page-product-calibrated-registration-v1.fragment.json';
const AUDIT = 'catalog/g678-alg-l09-game-assessment-family-audit-v1.json';
const GENERATED_FRAGMENT =
  'catalog/product-bridge-calibrations/g678-alg-l09-game-assessment-current-js-3-v1.fragment.json';
const CATALOG = 'catalog/g678-shared-catalog.v1.json';
const PROFILE = 'catalog/g678-shared-source-profile.v1.json';
export const OUTPUT_FREEZE =
  'catalog/product-bridge-calibrations/g678-current-js-342-page-registration-v1.json';
export const OUTPUT_FRAGMENT =
  'catalog/product-bridge-calibrations/g678-current-js-342-page-registration-v1.fragment.json';

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
    ...(json ? {value: JSON.parse(bytes.toString('utf8'))} : {})});
}

function descriptor(value) {
  return Object.freeze({path: value.path, bytes: value.bytes,
    sha256: value.sha256});
}

function exact(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function pageMap(catalog) {
  return new Map(catalog.lessons.flatMap((lesson) =>
    lesson.pages.map((page) => [page.animationId, {lesson, page}])));
}

function adapterFamilyFor(animationId) {
  return animationId.endsWith('p030')
    ? 'advanced-manual-alg-l09-game-controller-source-static'
    : animationId.endsWith('p031')
      ? 'advanced-manual-alg-l09-matching-game-source-static'
      : 'advanced-manual-alg-l09-final-assessment-source-static';
}

function implementationKind(animationId) {
  return animationId.endsWith('p030')
    ? 'source-script-bound-game-controller-current-js-candidate'
    : animationId.endsWith('p031')
      ? 'source-script-bound-matching-game-current-js-candidate'
      : 'source-script-bound-final-assessment-current-js-candidate';
}

async function verifyEntry(entry, runMember, pages, auditMember) {
  const catalog = pages.get(entry.key);
  invariant(catalog && auditMember?.animationId === entry.key &&
    entry.module === `./modules/${entry.key}` &&
    entry.complexityLane === 'behavior-heavy' &&
    entry.adapterFamily === adapterFamilyFor(entry.key) &&
    runMember?.animationId === entry.key &&
    exact(runMember.manifest, entry.memberManifest) &&
    exact(runMember.runtime, entry.runtime.canvasRenderer),
  `${entry.key}: game/assessment fragment/run/catalog identity drifted`);
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
  const page = catalog.page;
  const lesson = catalog.lesson;
  const evidence = auditMember.exactBehavior;
  const stopBinding =
    manifest.value.reviewedAuthority.sourceBehaviorBinding;
  invariant(manifest.value.animationId === entry.key &&
    manifest.value.source.path === page.viewPath &&
    manifest.value.source.sha256 === page.sourceSha256 &&
    manifest.value.timeline.frameDomain === entry.runtime.frameDomain &&
    manifest.value.timeline.frameCount === entry.runtime.frameCount &&
    manifest.value.timeline.livePlaybackEndFrame ===
      entry.runtime.livePlaybackEndFrame &&
    manifest.value.timeline.buttons.length === 0 &&
    manifest.value.timeline.explicitChildStop === true &&
    manifest.value.timeline.interactiveStops.length === 1 &&
    exact(stopBinding?.sourceStops, auditMember.interactiveStopFrames) &&
    exact(stopBinding?.exactBehavior, evidence) &&
    manifest.value.product.sourceGameOrAssessmentBehaviorBound === true &&
    manifest.value.product
      .accessiblePointerAndKeyboardInteractionImplemented === true &&
    manifest.value.product.feedbackAndAssessmentAudioAccepted === false,
  `${entry.key}: game/assessment source behavior drifted`);
  const interactiveStops = manifest.value.timeline.interactiveStops.map(
    (stop) => Object.freeze({...stop, requiresHostInteractiveStop: true,
      strictAcceptanceEffect: 'none'}));
  return Object.freeze({
    animationId: entry.key,
    placementId: page.placementId,
    assetId: page.assetId,
    moduleCode: lesson.moduleCode,
    lessonNumber: lesson.lessonNumber,
    stableLessonKey: lesson.stableLessonKey,
    globalPageOrdinal: page.globalOrdinal,
    sectionCode: page.sectionCode,
    sectionPageOrdinal: page.sectionPageOrdinal,
    sourceSha256: page.sourceSha256,
    complexityLane: 'behavior-heavy',
    adapterFamily: adapterFamilyFor(entry.key),
    implementation: Object.freeze({
      kind: implementationKind(entry.key),
      deploymentScope: 'local-only',
      sourceGameOrAssessmentBehaviorBound: true,
      sourceBehaviorKind: manifest.value.product.sourceBehaviorKind,
      accessiblePointerAndKeyboardInteractionImplemented: true,
      feedbackAndAssessmentAudioAccepted: false,
      productCalibrationPassed: false,
    }),
    runtime: Object.freeze({
      stage: Object.freeze({width: 800, height: 600}),
      rootFrameCount: manifest.value.timeline.rootFrameCount,
      rootBeginFrame: 6,
      frameDomain: entry.runtime.frameDomain,
      frameCount: entry.runtime.frameCount,
      livePlaybackEndFrame: entry.runtime.livePlaybackEndFrame,
      language: 'fixed-en', scenario: 'source-static-frame', seed: '0',
      canvasRenderer: entry.runtime.canvasRenderer,
      interactiveStops: Object.freeze(interactiveStops),
      interactiveSeek: null,
    }),
    glossaryEntries: Object.freeze([]),
    sourceGameAssessment: evidence,
    runtimeEvidenceBoundary: Object.freeze({
      runtimeKind:
        implementationKind(entry.key),
      actionScriptExecution: 'not-executed',
      naturalTraceValidation: 'not-established',
      audioAcceptance: 'not-established',
      replaySemantics:
        'product-complete-interaction-reset-original-runtime-parity-not-established',
    }),
    productBlockers: Object.freeze([
      'alg-l09-game-assessment-browser-product-calibration-pending',
      'game-feedback-and-assessment-audio-acceptance-pending',
      'legacy-bookmark-report-download-and-shell-network-operations-blocked',
      'authoritative-original-runtime-not-established',
      'visual-fidelity-not-accepted',
    ]),
    productCalibrationPassed: false,
    engineeringPreviewReady: false,
  });
}

async function expectedArtifacts({requireCurrentPredecessorHost = false} = {}) {
  if (requireCurrentPredecessorHost) {
    const predecessor =
      await finalizeG678AlgL09GuidedTutorialFamilyRegistration({check: true});
    invariant(predecessor.check === true &&
      predecessor.registrationCandidatePlacementCount === 339,
    '339-page predecessor final admission failed');
  }
  const [auditCheck, generatorCheck] = await Promise.all([
    auditG678AlgL09GameAssessmentFamily({check: true}),
    runAlgL09GameAssessmentCurrentJs({check: true}),
  ]);
  invariant(auditCheck.check && generatorCheck.check,
    'game assessment prerequisite checks did not complete');
  const [predecessorFreeze, predecessorFragment, audit, generatedFragment,
    catalog, profile, builder] =
    await Promise.all([
      binding(PREDECESSOR_FREEZE, true),
      binding(PREDECESSOR_FRAGMENT, true), binding(AUDIT, true),
      binding(GENERATED_FRAGMENT, true),
      binding(CATALOG, true), binding(PROFILE, true),
      binding(path.relative(ROOT, SCRIPT_PATH)),
    ]);
  const gameAssessmentMembers = audit.value.records;
  invariant(predecessorFreeze.value.calibrationId === CALIBRATION_ID &&
    predecessorFreeze.value.selectedPages.length === 339 &&
    predecessorFragment.value.calibration.freezeManifest ===
      PREDECESSOR_FREEZE &&
    exact(predecessorFragment.value.freeze, descriptor(predecessorFreeze)) &&
    predecessorFragment.value.calibration.entries.length === 339 &&
    audit.value.auditedPlacementCount === 3 &&
    gameAssessmentMembers.length === 3 &&
    audit.value.registrationCandidatePlacementCount === 0 &&
    generatedFragment.value.generatedPlacementCount === 3 &&
    generatedFragment.value.entries.length === 3 &&
    generatedFragment.value.currentJavaScriptRegisteredCount === 0 &&
    exact(generatedFragment.value.reviewedAudit, descriptor(audit)) &&
    exact(generatedFragment.value.predecessorFreeze,
      descriptor(predecessorFreeze)),
  'game/assessment predecessor/audit/fragment authority drifted');
  const run = await binding(generatedFragment.value.compilerRun.path, true);
  invariant(run.bytes === generatedFragment.value.compilerRun.bytes &&
    run.sha256 === generatedFragment.value.compilerRun.sha256 &&
    run.value.generatedPlacementCount === 3 &&
    run.value.compiledUniqueSwfCount === 3 &&
    run.value.registryEntriesWritten === 0 &&
    exact(run.value.inputs.audit, descriptor(audit)) &&
    exact(run.value.inputs.predecessor, descriptor(predecessorFreeze)),
  'game/assessment compiler run authority drifted');
  const expectedKeys = gameAssessmentMembers.map((member) =>
    member.animationId).sort();
  invariant(exact(generatedFragment.value.entries.map((entry) =>
    entry.key).sort(), expectedKeys) &&
    exact(run.value.members.map((member) => member.animationId).sort(),
      expectedKeys),
  'game/assessment exact generated/admitted membership drifted');
  const runMembers = new Map(run.value.members.map((member) =>
    [member.animationId, member]));
  const auditMembers = new Map(gameAssessmentMembers.map((member) =>
    [member.animationId, member]));
  const pages = pageMap(catalog.value);
  const gameAssessmentPages = [];
  for (const entry of [...generatedFragment.value.entries].sort((left, right) =>
    left.key.localeCompare(right.key))) {
    gameAssessmentPages.push(await verifyEntry(entry,
      runMembers.get(entry.key), pages, auditMembers.get(entry.key)));
  }
  const selectedPages = [...predecessorFreeze.value.selectedPages,
    ...gameAssessmentPages].sort((left, right) =>
    left.animationId.localeCompare(right.animationId));
  invariant(selectedPages.length === 342 &&
    new Set(selectedPages.map((page) => page.animationId)).size === 342 &&
    new Set(selectedPages.map((page) => page.stableLessonKey)).size === 44,
  'combined game assessment membership drifted');
  const advancedManualCount = selectedPages.filter((page) =>
    page.adapterFamily.startsWith('advanced-manual-')).length;
  const sharedAdapterCount = selectedPages.length - advancedManualCount;
  invariant(advancedManualCount === 9 && sharedAdapterCount === 333,
    '342 shared/advanced adapter denominator drifted');
  const acceptanceEffects = Object.freeze({
    ...predecessorFreeze.value.acceptanceEffects,
  });
  invariant(Object.values(acceptanceEffects).every((value) => value === false),
    'combined acceptance effects must remain false');
  const freeze = {
    schemaVersion: 1, calibrationId: CALIBRATION_ID,
    deploymentScope: 'local-only',
    status: 'private-current-js-calibration-candidates-generated',
    frozenCalibrationPlacementCount: 2282,
    registrationCandidatePlacementCount: 342,
    sharedAdapterPlacementCount: sharedAdapterCount,
    advancedManualPlacementCount: advancedManualCount,
    legacyFlashCourseShellCount: 0,
    scaleOutAuthorized: false, engineeringPreviewReady: false,
    productCalibrationPassed: false,
    inputs: {
      sharedCatalog: descriptor(catalog), sourceProfile: descriptor(profile),
      selectionAuthorities: [descriptor(predecessorFreeze), descriptor(audit)],
      predecessorFreeze: descriptor(predecessorFreeze),
      algL09GameAssessmentFamilyAudit: descriptor(audit),
      algL09GameAssessmentGeneratedFragment: descriptor(generatedFragment),
      finalizer: descriptor(builder),
    },
    selectedPages, pendingAdvancedManualPlacements: [], acceptanceEffects,
    limitations: [
      '342 registration candidates cover all 41 ALG L9 pages and remain partial across the other 43 lessons; product calibration is still pending for the final three pages.',
      'Only the exact GS02 game controller, GS03 two-level matching game, and FQ02 ten-of-twenty-four assessment are admitted by this provisional freeze.',
      'The modern host replaces the legacy GS shell handoff, blocks bookmark/report/download/network operations, and keeps browser product calibration mandatory.',
      'Game/assessment audio, original-runtime, fidelity, human, Owner, strict, release, and publication gates remain false.',
    ],
  };
  const freezeBytes = stableBytes(freeze);
  const newEntries = generatedFragment.value.entries.map((entry) => ({
    key: entry.key, module: entry.module, maturity: entry.maturity,
    complexityLane: entry.complexityLane,
    artifacts: {module: entry.moduleFile, timeline: entry.timeline,
      runtime: entry.runtime.canvasRenderer},
  }));
  const entries = [...predecessorFragment.value.calibration.entries,
    ...newEntries].sort((left, right) => left.key.localeCompare(right.key));
  invariant(entries.length === 342 &&
    new Set(entries.map((entry) => entry.key)).size === 342,
  'combined game/assessment registry membership drifted');
  const fragment = {
    schemaVersion: 1,
    artifactType: 'private-current-js-calibration-fragment-v1',
    calibration: {calibrationId: CALIBRATION_ID,
      deploymentScope: 'local-only', freezeManifest: OUTPUT_FREEZE, entries},
    freeze: {path: OUTPUT_FREEZE, bytes: freezeBytes.length,
      sha256: sha256(freezeBytes)},
    descriptorProjection: {registrationCandidatePlacementCount: 342,
      frozenCalibrationPlacementCount: 2282, affectedLessonCount: 44,
      wholeLessonEngineeringPreviewCount: 0,
      sourceOrderedLessonMembershipRequired: true,
      modernMyLessonHostRequired: true, engineeringPreviewReady: false},
    familyScaleout: {algL09GameAssessmentAuditedPlacements: 3,
      gameAssessmentEligiblePlacements: 3, blockedPlacements: 0,
      predecessorOverlap: 0, generatedAndAdmittedPlacements: 3,
      browserProductCalibrationPassed: false},
    acceptanceEffects,
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

export async function finalizeAlgL09GameAssessmentRegistration({check = false,
  requireCurrentPredecessorHost = false} = {}) {
  const artifacts = await expectedArtifacts({requireCurrentPredecessorHost});
  if (check) {
    const [freeze, fragment] = await Promise.all([
      binding(OUTPUT_FREEZE), binding(OUTPUT_FRAGMENT),
    ]);
    invariant(freeze.buffer.equals(artifacts.freezeBytes) &&
      fragment.buffer.equals(artifacts.fragmentBytes),
    'ALG L9 342-page registration artifacts drifted');
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
    frozenCalibrationPlacementCount: 2282, affectedLessonCount: 44,
    wholeLessonEngineeringPreviewCount: 0, productCalibrationPassed: false,
    freeze: {path: OUTPUT_FREEZE, bytes: artifacts.freezeBytes.length,
      sha256: sha256(artifacts.freezeBytes)},
    fragment: {path: OUTPUT_FRAGMENT, bytes: artifacts.fragmentBytes.length,
      sha256: sha256(artifacts.fragmentBytes)}});
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  const args = process.argv.slice(2);
  invariant(args.length <= 1 && (args.length === 0 || args[0] === '--check'),
    'usage: finalize-g678-alg-l09-game-assessment-registration.mjs [--check]');
  finalizeAlgL09GameAssessmentRegistration({check: args.includes('--check')})
    .then((result) => process.stdout.write(`${JSON.stringify(result, null, 2)}\n`))
    .catch((error) => {
      process.stderr.write(`${error.stack ?? error.message}\n`);
      process.exitCode = 1;
    });
}
