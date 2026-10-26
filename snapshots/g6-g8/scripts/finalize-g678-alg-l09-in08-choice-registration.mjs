#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {constants as fsConstants} from 'node:fs';
import {copyFile, lstat, readFile, unlink, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {finalizeG678AlgL09In06ChoiceFamilyRegistration} from
  './finalize-g678-alg-l09-in06-choice-family-registration.mjs';
import {auditG678AlgL09In08ChoiceFamily} from
  './audit-g678-alg-l09-in08-choice-family.mjs';
import {runAlgL09In08ChoiceCurrentJs} from
  './build-g678-alg-l09-in08-choice-current-js.mjs';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
const CALIBRATION_ID = 'g678-16-page-product-calibration-v1';
const PREDECESSOR_FREEZE =
  'catalog/product-bridge-calibrations/g678-current-js-328-page-product-calibrated-registration-v1.json';
const PREDECESSOR_FRAGMENT =
  'catalog/product-bridge-calibrations/g678-current-js-328-page-product-calibrated-registration-v1.fragment.json';
const AUDIT =
  'catalog/g678-alg-l09-in08-choice-family-audit-v1.json';
const GENERATED_FRAGMENT =
  'catalog/product-bridge-calibrations/g678-alg-l09-in08-choice-current-js-1-v1.fragment.json';
const CATALOG = 'catalog/g678-shared-catalog.v1.json';
const PROFILE = 'catalog/g678-shared-source-profile.v1.json';
export const OUTPUT_FREEZE =
  'catalog/product-bridge-calibrations/g678-current-js-329-page-registration-v1.json';
export const OUTPUT_FRAGMENT =
  'catalog/product-bridge-calibrations/g678-current-js-329-page-registration-v1.fragment.json';

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
    entry.adapterFamily === 'alg-l09-in08-choice-source-static' &&
    runMember?.animationId === entry.key &&
    JSON.stringify(runMember.manifest) ===
      JSON.stringify(entry.memberManifest) &&
    JSON.stringify(runMember.runtime) ===
      JSON.stringify(entry.runtime.canvasRenderer),
  `${entry.key}: ALG L9 IN08 choice fragment/run/catalog identity drifted`);
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
  const choiceBinding =
    manifest.value.reviewedAuthority.sourceChoicePlacementBinding;
  const expectedChoices = [
    ['AnsBtn1', 'A', '3', 170],
    ['AnsBtn2', 'B', '4', 170],
    ['AnsBtn3', 'C', '6', 170],
    ['AnsBtn4', 'D', '7', 171],
  ];
  invariant(manifest.value.animationId === entry.key &&
    manifest.value.source.path === page.viewPath &&
    manifest.value.source.sha256 === page.sourceSha256 &&
    manifest.value.timeline.frameDomain === entry.runtime.frameDomain &&
    manifest.value.timeline.frameCount === entry.runtime.frameCount &&
    manifest.value.timeline.livePlaybackEndFrame ===
      entry.runtime.livePlaybackEndFrame &&
    manifest.value.timeline.buttons.length === 5 &&
    manifest.value.timeline.buttonFirstFrame === 12 &&
    manifest.value.timeline.explicitChildStop === true &&
    manifest.value.timeline.interactiveStop.stopFrame === 607 &&
    manifest.value.timeline.interactiveStop.resumeFrame === 608 &&
    choiceBinding?.source === 'swfmill-source-xml' &&
    choiceBinding.frameDomain === 'sprite-193' &&
    choiceBinding.textPlacedFrame === 598 &&
    choiceBinding.answerButtonsPlacedFrame === 607 &&
    choiceBinding.correctAnswerInstanceName === 'AnsBtn4' &&
    choiceBinding.correctAnswerButtonCharacterId === 171 &&
    /^[0-9a-f]{64}$/u.test(choiceBinding.projectionSha256) &&
    JSON.stringify(choiceBinding.options.map((option) => [
      option.instanceName, option.label, option.value,
      option.buttonCharacterId,
    ])) === JSON.stringify(expectedChoices) &&
    manifest.value.product.sourceChoiceQuizStopBound === true &&
    manifest.value.product.sourceChoiceQuizBehaviorBound === true &&
    manifest.value.product
      .accessiblePointerAndKeyboardInteractionImplemented === true &&
    manifest.value.product.choiceFeedbackAudioAccepted === false &&
    manifest.value.product.typedGlossaryIntentImplemented === true &&
    terms.length === 5 && recovery.value.terms.length === 5,
  `${entry.key}: ALG L9 IN08 choice member source/timeline/behavior drifted`);
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
    adapterFamily: 'alg-l09-in08-choice-source-static',
    implementation: Object.freeze({
      kind: 'source-script-bound-choice-quiz-current-js-candidate',
      deploymentScope: 'local-only',
      typedModernGlossaryIntentImplemented: true,
      sourceChoiceQuizStopBound: true,
      sourceChoiceQuizBehaviorBound: true,
      accessiblePointerAndKeyboardInteractionImplemented: true,
      choiceFeedbackAudioAccepted: false,
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
        id: `${entry.key}-choice-quiz`,
        frameDomain: entry.runtime.frameDomain,
        stopFrame: 607,
        resumeFrame: 608,
        resolution: 'explicit-source-feedback-finished',
        completionDisposition: 'blocked-while-unresolved',
        requiresHostInteractiveStop: true,
        strictAcceptanceEffect: 'none',
      })]),
      interactiveSeek: null,
    }),
    glossaryEntries: Object.freeze(glossaryEntries),
    runtimeEvidenceBoundary: Object.freeze({
      runtimeKind: 'source-script-bound-choice-quiz-current-js-candidate',
      actionScriptExecution: 'not-executed',
      naturalTraceValidation: 'not-established',
      audioAcceptance: 'not-established',
      replaySemantics: 'product-complete-interaction-reset-original-runtime-parity-not-established',
    }),
    productBlockers: Object.freeze([
      'alg-l09-in08-choice-browser-product-calibration-pending',
      'choice-feedback-shell-variants-and-audio-acceptance-pending',
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
      await finalizeG678AlgL09In06ChoiceFamilyRegistration({check: true});
    invariant(predecessorAdmission.check === true &&
      predecessorAdmission.registrationCandidatePlacementCount === 328,
    '328-page predecessor final admission failed');
  }
  const [familyAuditCheck, generatorCheck] = await Promise.all([
    auditG678AlgL09In08ChoiceFamily({check: true}),
    runAlgL09In08ChoiceCurrentJs({check: true}),
  ]);
  invariant(familyAuditCheck.check && generatorCheck.check,
    'ALG L9 IN08 choice prerequisite checks did not complete');
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
    predecessorFreeze.value.selectedPages.length === 328 &&
    predecessorFragment.value.calibration.calibrationId === CALIBRATION_ID &&
    predecessorFragment.value.calibration.freezeManifest ===
      PREDECESSOR_FREEZE &&
    JSON.stringify(predecessorFragment.value.freeze) ===
      JSON.stringify(descriptor(predecessorFreeze)) &&
    predecessorFragment.value.calibration.entries.length === 328 &&
    audit.value.scope.selectedAlgL09In08ChoicePlacements === 1 &&
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
  'ALG L9 IN08 choice predecessor/audit/recovery/fragment authority drifted');
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
  'ALG L9 IN08 choice compiler run authority drifted');
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
  const algL09In08ChoicePages = [];
  for (const entry of [...generatedFragment.value.entries].sort((left, right) =>
    left.key.localeCompare(right.key))) {
    algL09In08ChoicePages.push(await verifyEntry(
      entry, runMembers.get(entry.key), pages,
      recovery.value.terms, recovery));
  }
  const selectedPages = [...predecessorFreeze.value.selectedPages,
    ...algL09In08ChoicePages].sort((left, right) =>
    left.animationId.localeCompare(right.animationId));
  invariant(selectedPages.length === 329 &&
    new Set(selectedPages.map((page) => page.animationId)).size === 329 &&
    new Set(selectedPages.map((page) => page.stableLessonKey)).size === 44,
  'combined ALG L9 IN08 choice membership drifted');
  const advancedManualCount = selectedPages.filter((page) =>
    page.adapterFamily.startsWith('advanced-manual-')).length;
  const sharedAdapterCount = selectedPages.length - advancedManualCount;
  invariant(advancedManualCount === 3 && sharedAdapterCount === 326 &&
    sharedAdapterCount + advancedManualCount === selectedPages.length,
  '329 shared/advanced adapter denominator drifted');
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
    registrationCandidatePlacementCount: 329,
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
      algL09In08ChoiceAudit: descriptor(audit),
      algL09In08ChoiceGeneratedFragment: descriptor(generatedFragment),
      finalizer: descriptor(builder),
    },
    selectedPages,
    pendingAdvancedManualPlacements: [],
    acceptanceEffects,
    limitations: [
      '329 registration candidates remain partial across all 44 lessons; no N/N whole-lesson engineering preview exists.',
      'Only the exact 1 ALG L9 IN08 four-choice page in the fixed source-script audit is admitted by this provisional freeze.',
      'The four source numeric choices, two wrong attempts, typed right-feedback request, frame-607 stop, frame-608 resume, and glossary intents are implemented; feedback audio, external narration, original-runtime, fidelity, human, Owner, strict, release, and publication gates remain false.',
      'Current-host replay of predecessor samples is deferred to the mandatory 329-page successor browser calibration.',
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
  invariant(entries.length === 329 &&
    new Set(entries.map((entry) => entry.key)).size === 329,
  'combined registry entry membership drifted');
  const fragment = {
    schemaVersion: 1,
    artifactType: 'private-current-js-calibration-fragment-v1',
    calibration: {calibrationId: CALIBRATION_ID,
      deploymentScope: 'local-only', freezeManifest: OUTPUT_FREEZE, entries},
    freeze: {path: OUTPUT_FREEZE, bytes: freezeBytes.length,
      sha256: sha256(freezeBytes)},
    descriptorProjection: {registrationCandidatePlacementCount: 329,
      frozenCalibrationPlacementCount: 2282,
      affectedLessonCount: 44,
      wholeLessonEngineeringPreviewCount: 0,
      sourceOrderedLessonMembershipRequired: true,
      modernMyLessonHostRequired: true,
      engineeringPreviewReady: false},
    familyScaleout: {algL09In08ChoiceAuditedPlacements: 1,
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

export async function finalizeAlgL09In08ChoiceRegistration({check = false,
  requireCurrentPredecessorHost = false} = {}) {
  const artifacts = await expectedArtifacts({requireCurrentPredecessorHost});
  if (check) {
    const [freeze, fragment] = await Promise.all([
      binding(OUTPUT_FREEZE), binding(OUTPUT_FRAGMENT),
    ]);
    invariant(freeze.buffer.equals(artifacts.freezeBytes) &&
      fragment.buffer.equals(artifacts.fragmentBytes),
    'ALG L9 329-page registration artifacts drifted');
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
    'usage: finalize-g678-alg-l09-in08-choice-registration.mjs [--check]');
  finalizeAlgL09In08ChoiceRegistration({check: args.includes('--check')})
    .then((result) => process.stdout.write(`${JSON.stringify(result, null, 2)}\n`))
    .catch((error) => {
      process.stderr.write(`${error.stack ?? error.message}\n`);
      process.exitCode = 1;
    });
}
