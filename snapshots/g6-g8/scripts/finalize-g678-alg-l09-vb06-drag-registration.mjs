#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {constants as fsConstants} from 'node:fs';
import {copyFile, lstat, readFile, unlink, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {finalizeG678AlgL09IntroShellLinkageFamilyRegistration} from
  './finalize-g678-alg-l09-intro-shell-linkage-family-registration.mjs';
import {auditG678AlgL09Vb06DragFamily} from
  './audit-g678-alg-l09-vb06-drag-family.mjs';
import {runAlgL09Vb06DragCurrentJs} from
  './build-g678-alg-l09-vb06-drag-current-js.mjs';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
const CALIBRATION_ID = 'g678-16-page-product-calibration-v1';
const PREDECESSOR_FREEZE =
  'catalog/product-bridge-calibrations/g678-current-js-324-page-product-calibrated-registration-v1.json';
const PREDECESSOR_FRAGMENT =
  'catalog/product-bridge-calibrations/g678-current-js-324-page-product-calibrated-registration-v1.fragment.json';
const AUDIT =
  'catalog/g678-alg-l09-vb06-drag-family-audit-v1.json';
const GENERATED_FRAGMENT =
  'catalog/product-bridge-calibrations/g678-alg-l09-vb06-drag-current-js-1-v1.fragment.json';
const CATALOG = 'catalog/g678-shared-catalog.v1.json';
const PROFILE = 'catalog/g678-shared-source-profile.v1.json';
export const OUTPUT_FREEZE =
  'catalog/product-bridge-calibrations/g678-current-js-325-page-registration-v1.json';
export const OUTPUT_FRAGMENT =
  'catalog/product-bridge-calibrations/g678-current-js-325-page-registration-v1.fragment.json';

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

function pageMap(catalog) {
  return new Map(catalog.lessons.flatMap((lesson) =>
    lesson.pages.map((page) => [page.animationId, {lesson, page}])));
}

async function verifyEntry(entry, runMember, pages, terms, recovery) {
  const catalog = pages.get(entry.key);
  invariant(catalog && entry.module === `./modules/${entry.key}` &&
    entry.complexityLane === 'interactive-understood' &&
    entry.adapterFamily === 'alg-l09-vb06-drag-source-static' &&
    runMember?.animationId === entry.key &&
    JSON.stringify(runMember.manifest) ===
      JSON.stringify(entry.memberManifest) &&
    JSON.stringify(runMember.runtime) ===
      JSON.stringify(entry.runtime.canvasRenderer),
  `${entry.key}: ALG L9 VB06 drag fragment/run/catalog identity drifted`);
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
  invariant(manifest.value.animationId === entry.key &&
    manifest.value.source.path === page.viewPath &&
    manifest.value.source.sha256 === page.sourceSha256 &&
    manifest.value.timeline.frameDomain === entry.runtime.frameDomain &&
    manifest.value.timeline.frameCount === entry.runtime.frameCount &&
    manifest.value.timeline.livePlaybackEndFrame ===
      entry.runtime.livePlaybackEndFrame &&
    manifest.value.timeline.buttons.length === 3 &&
    manifest.value.timeline.buttonFirstFrame === 1 &&
    manifest.value.timeline.explicitChildStop === true &&
    manifest.value.timeline.interactiveStop.stopFrame === 129 &&
    manifest.value.timeline.interactiveStop.resumeFrame === 130 &&
    manifest.value.product.sourceTerminalStopBound === true &&
    manifest.value.product.sourceGroupedDragBehaviorBound === true &&
    manifest.value.product
      .accessiblePointerAndKeyboardInteractionImplemented === true &&
    manifest.value.product.randomFeedbackAudioAccepted === false &&
    manifest.value.product.typedGlossaryIntentImplemented === true &&
    terms.length === 3 && recovery.value.terms.length === 3,
  `${entry.key}: ALG L9 VB06 drag member source/timeline/behavior drifted`);
  const termMap = new Map(terms.map((term) =>
    [term.sourceKeyAttribute.toLocaleLowerCase('en-US'), term]));
  const glossaryEntries = manifest.value.timeline.buttons.map((button) => {
    const term = termMap.get(
      button.sourceKeyAttribute.toLocaleLowerCase('en-US'));
    invariant(term, `${entry.key}: glossary term is unresolved`);
    return Object.freeze({id: term.id,
      sourceKeyAttribute: button.sourceKeyAttribute,
      sourceCharacterId: button.characterId,
      firstFrame: button.firstFrame,
      labels: term.labels,
      definitions: term.definitions,
      definitionParity: term.definitionParity,
      source: Object.freeze({
        en: Object.freeze({assetId: 'G678L1KTE01.xml',
          path: 'HELP_KEYTERMS/KT/XML/L1KTE01.xml',
          sha256: recovery.value.keyTermSources.en.sha256}),
        es: Object.freeze({assetId: 'G678L1KTS01.xml',
          path: 'HELP_KEYTERMS/KT/XML/L1KTS01.xml',
          sha256: recovery.value.keyTermSources.es.sha256}),
      }),
      legacyCompanionReferences: term.legacyCompanionReferences});
  }).sort((left, right) => left.sourceCharacterId - right.sourceCharacterId);
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
    adapterFamily: 'alg-l09-vb06-drag-source-static',
    implementation: Object.freeze({
      kind: 'source-script-bound-grouped-drag-current-js-candidate',
      deploymentScope: 'local-only',
      typedModernGlossaryIntentImplemented: true,
      sourceTerminalStopBound: true,
      sourceGroupedDragBehaviorBound: true,
      accessiblePointerAndKeyboardInteractionImplemented: true,
      randomFeedbackAudioAccepted: false,
      productCalibrationPassed: false,
    }),
    runtime: Object.freeze({
      stage: Object.freeze({width: 800, height: 600}),
      rootFrameCount: manifest.value.timeline.rootFrameCount,
      rootBeginFrame: 6,
      frameDomain: entry.runtime.frameDomain,
      frameCount: entry.runtime.frameCount,
      livePlaybackEndFrame: entry.runtime.livePlaybackEndFrame,
      language: 'fixed-en',
      scenario: 'source-static-frame',
      seed: '0',
      canvasRenderer: entry.runtime.canvasRenderer,
      interactiveStops: Object.freeze([Object.freeze({
        id: `${entry.key}-drag-set`,
        frameDomain: entry.runtime.frameDomain,
        stopFrame: 129,
        resumeFrame: 130,
        resolution: 'explicit-source-drag-set-finished',
        completionDisposition: 'blocked-while-unresolved',
        requiresHostInteractiveStop: true,
        strictAcceptanceEffect: 'none',
      })]),
      interactiveSeek: null,
    }),
    glossaryEntries: Object.freeze(glossaryEntries),
    runtimeEvidenceBoundary: Object.freeze({
      runtimeKind: 'source-script-bound-grouped-drag-current-js-candidate',
      actionScriptExecution: 'not-executed',
      naturalTraceValidation: 'not-established',
      audioAcceptance: 'not-established',
      replaySemantics: 'product-complete-interaction-reset-original-runtime-parity-not-established',
    }),
    productBlockers: Object.freeze([
      'alg-l09-vb06-drag-browser-product-calibration-pending',
      'random-feedback-audio-runtime-and-listening-acceptance-pending',
      'external-narration-audio-selection-and-listening-acceptance-pending',
      'legacy-key-term-sublinks-and-example-swfs-not-implemented',
      'authoritative-original-runtime-not-established',
      'visual-fidelity-not-accepted',
    ]),
    productCalibrationPassed: false,
    engineeringPreviewReady: false,
  });
}

async function expectedArtifacts({requireCurrentPredecessorHost = false} = {}) {
  if (requireCurrentPredecessorHost) {
    const predecessorAdmission =
      await finalizeG678AlgL09IntroShellLinkageFamilyRegistration({check: true});
    invariant(predecessorAdmission.check === true &&
      predecessorAdmission.registrationCandidatePlacementCount === 324,
    '324-page predecessor final admission failed');
  }
  const [familyAuditCheck, generatorCheck] = await Promise.all([
    auditG678AlgL09Vb06DragFamily({check: true}),
    runAlgL09Vb06DragCurrentJs({check: true}),
  ]);
  invariant(familyAuditCheck.check && generatorCheck.check,
    'ALG L9 VB06 drag prerequisite checks did not complete');
  const [predecessorFreeze, predecessorFragment, audit,
    generatedFragment, catalog, profile, builder] = await Promise.all([
      binding(PREDECESSOR_FREEZE, true),
      binding(PREDECESSOR_FRAGMENT, true),
      binding(AUDIT, true),
      binding(GENERATED_FRAGMENT, true), binding(CATALOG, true),
      binding(PROFILE, true), binding(path.relative(ROOT, SCRIPT_PATH)),
    ]);
  const recovery = audit;
  invariant(predecessorFreeze.value.calibrationId === CALIBRATION_ID &&
    predecessorFreeze.value.selectedPages.length === 324 &&
    predecessorFragment.value.calibration.calibrationId === CALIBRATION_ID &&
    predecessorFragment.value.calibration.freezeManifest ===
      PREDECESSOR_FREEZE &&
    JSON.stringify(predecessorFragment.value.freeze) ===
      JSON.stringify(descriptor(predecessorFreeze)) &&
    predecessorFragment.value.calibration.entries.length === 324 &&
    audit.value.scope.selectedAlgL09Vb06DragPlacements === 1 &&
    audit.value.registrationCandidatePlacementCount === 1 &&
    generatedFragment.value.generatedPlacementCount === 1 &&
    generatedFragment.value.entries.length === 1 &&
    generatedFragment.value.currentJavaScriptRegisteredCount === 0 &&
    JSON.stringify(generatedFragment.value.reviewedAudit) ===
      JSON.stringify(descriptor(audit)) &&
    JSON.stringify(generatedFragment.value.keyTermRecovery) ===
      JSON.stringify(descriptor(recovery)) &&
    JSON.stringify(generatedFragment.value.predecessorFreeze) ===
      JSON.stringify(descriptor(predecessorFreeze)),
  'ALG L9 VB06 drag predecessor/audit/recovery/fragment authority drifted');
  const run = await binding(generatedFragment.value.compilerRun.path, true);
  invariant(run.bytes === generatedFragment.value.compilerRun.bytes &&
    run.sha256 === generatedFragment.value.compilerRun.sha256 &&
    run.value.generatedPlacementCount === 1 &&
    run.value.compiledUniqueSwfCount === 1 &&
    run.value.registryEntriesWritten === 0 &&
    JSON.stringify(run.value.inputs.audit) === JSON.stringify(descriptor(audit)) &&
    JSON.stringify(run.value.inputs.recovery) === JSON.stringify(descriptor(recovery)) &&
    JSON.stringify(run.value.inputs.predecessor) ===
      JSON.stringify(descriptor(predecessorFreeze)),
  'ALG L9 VB06 drag compiler run authority drifted');
  const expectedKeys = audit.value.records.map((row) =>
    row.animationId).sort();
  invariant(JSON.stringify(generatedFragment.value.entries.map((entry) =>
    entry.key).sort()) === JSON.stringify(expectedKeys) &&
    JSON.stringify(run.value.members.map((member) =>
      member.animationId).sort()) === JSON.stringify(expectedKeys),
  'ALG L9 exact generated/admitted membership drifted');
  const runMembers = new Map(run.value.members.map((member) =>
    [member.animationId, member]));
  const pages = pageMap(catalog.value);
  const algL09Vb06DragPages = [];
  for (const entry of [...generatedFragment.value.entries].sort((left, right) =>
    left.key.localeCompare(right.key))) {
    algL09Vb06DragPages.push(await verifyEntry(
      entry, runMembers.get(entry.key), pages,
      recovery.value.terms, recovery));
  }
  const selectedPages = [...predecessorFreeze.value.selectedPages,
    ...algL09Vb06DragPages].sort((left, right) =>
    left.animationId.localeCompare(right.animationId));
  invariant(selectedPages.length === 325 &&
    new Set(selectedPages.map((page) => page.animationId)).size === 325 &&
    new Set(selectedPages.map((page) => page.stableLessonKey)).size === 44,
  'combined ALG L9 VB06 drag membership drifted');
  const advancedManualCount = selectedPages.filter((page) =>
    page.adapterFamily.startsWith('advanced-manual-')).length;
  const sharedAdapterCount = selectedPages.length - advancedManualCount;
  invariant(advancedManualCount === 3 && sharedAdapterCount === 322 &&
    sharedAdapterCount + advancedManualCount === selectedPages.length,
  '325 shared/advanced adapter denominator drifted');
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
    registrationCandidatePlacementCount: 325,
    sharedAdapterPlacementCount: sharedAdapterCount,
    advancedManualPlacementCount: advancedManualCount,
    legacyFlashCourseShellCount: 0,
    scaleOutAuthorized: false,
    engineeringPreviewReady: false,
    productCalibrationPassed: false,
    inputs: {
      sharedCatalog: descriptor(catalog),
      sourceProfile: descriptor(profile),
      selectionAuthorities: [descriptor(predecessorFreeze), descriptor(audit)],
      predecessorFreeze: descriptor(predecessorFreeze),
      algL09Vb06DragAudit: descriptor(audit),
      algL09Vb06DragGeneratedFragment: descriptor(generatedFragment),
      finalizer: descriptor(builder),
    },
    selectedPages,
    pendingAdvancedManualPlacements: [],
    acceptanceEffects,
    limitations: [
      '325 registration candidates remain partial across all 44 lessons; no N/N whole-lesson engineering preview exists.',
      'Only the exact 1 ALG L9 VB06 grouped-drag page in the fixed source-script audit is admitted by this provisional freeze.',
      'The four-item drag grouping, frame-129 stop, frame-130 resume, and glossary intents are implemented; random feedback audio, external narration, original-runtime, fidelity, human, Owner, strict, release, and publication gates remain false.',
      'Current-host replay of predecessor samples is deferred to the mandatory 325-page successor browser calibration.',
      'Recovered key-term XML remains private custody evidence and is not promoted into the canonical source tree.',
    ],
  };
  const freezeBytes = stableBytes(freeze);
  const newEntries = generatedFragment.value.entries.map((entry) => ({
    key: entry.key,
    module: entry.module,
    maturity: entry.maturity,
    complexityLane: entry.complexityLane,
    artifacts: {module: entry.moduleFile, timeline: entry.timeline,
      runtime: entry.runtime.canvasRenderer},
  }));
  const entries = [...predecessorFragment.value.calibration.entries,
    ...newEntries].sort((left, right) => left.key.localeCompare(right.key));
  invariant(entries.length === 325 &&
    new Set(entries.map((entry) => entry.key)).size === 325,
  'combined registry entry membership drifted');
  const fragment = {
    schemaVersion: 1,
    artifactType: 'private-current-js-calibration-fragment-v1',
    calibration: {calibrationId: CALIBRATION_ID,
      deploymentScope: 'local-only', freezeManifest: OUTPUT_FREEZE, entries},
    freeze: {path: OUTPUT_FREEZE, bytes: freezeBytes.length,
      sha256: sha256(freezeBytes)},
    descriptorProjection: {registrationCandidatePlacementCount: 325,
      frozenCalibrationPlacementCount: 2282,
      affectedLessonCount: 44,
      wholeLessonEngineeringPreviewCount: 0,
      sourceOrderedLessonMembershipRequired: true,
      modernMyLessonHostRequired: true,
      engineeringPreviewReady: false},
    familyScaleout: {algL09Vb06DragAuditedPlacements: 1,
      recoveredEligiblePlacements: 1,
      blockedPlacements: 0,
      predecessorOverlap: 0,
      generatedAndAdmittedPlacements: 1,
      browserProductCalibrationPassed: false},
    acceptanceEffects,
  };
  return Object.freeze({freeze, fragment,
    freezeBytes, fragmentBytes: stableBytes(fragment)});
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

export async function finalizeAlgL09Vb06DragRegistration({check = false,
  requireCurrentPredecessorHost = false} = {}) {
  const artifacts = await expectedArtifacts({requireCurrentPredecessorHost});
  if (check) {
    const [freeze, fragment] = await Promise.all([
      binding(OUTPUT_FREEZE), binding(OUTPUT_FRAGMENT),
    ]);
    invariant(freeze.buffer.equals(artifacts.freezeBytes) &&
      fragment.buffer.equals(artifacts.fragmentBytes),
    'ALG L9 325-page registration artifacts drifted');
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
    registrationCandidatePlacementCount: 325,
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
    'usage: finalize-g678-alg-l09-vb06-drag-registration.mjs [--check]');
  finalizeAlgL09Vb06DragRegistration({check: args.includes('--check')})
    .then((result) => process.stdout.write(`${JSON.stringify(result, null, 2)}\n`))
    .catch((error) => {
      process.stderr.write(`${error.stack ?? error.message}\n`);
      process.exitCode = 1;
    });
}
