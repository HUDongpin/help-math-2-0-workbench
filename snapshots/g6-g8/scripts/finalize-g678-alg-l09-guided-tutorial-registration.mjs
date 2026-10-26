#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {constants as fsConstants} from 'node:fs';
import {copyFile, lstat, readFile, unlink, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {auditG678AlgL09ResidualRouting} from
  './audit-g678-alg-l09-residual-routing.mjs';
import {runAlgL09GuidedTutorialCurrentJs} from
  './build-g678-alg-l09-guided-tutorial-current-js.mjs';
import {finalizeG678AlgL09TiChoiceFamilyRegistration} from
  './finalize-g678-alg-l09-ti-choice-family-registration.mjs';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
const CALIBRATION_ID = 'g678-16-page-product-calibration-v1';
const ADAPTER_FAMILY =
  'advanced-manual-alg-l09-guided-tutorial-source-static';
const PREDECESSOR_FREEZE =
  'catalog/product-bridge-calibrations/g678-current-js-336-page-product-calibrated-registration-v1.json';
const PREDECESSOR_FRAGMENT =
  'catalog/product-bridge-calibrations/g678-current-js-336-page-product-calibrated-registration-v1.fragment.json';
const AUDIT = 'catalog/g678-alg-l09-residual-routing-audit-v1.json';
const GENERATED_FRAGMENT =
  'catalog/product-bridge-calibrations/g678-alg-l09-guided-tutorial-current-js-3-v1.fragment.json';
const KEY_TERM_RECOVERY = 'catalog/g678-ts07-l1-keyterm-recovery-v1.json';
const TI_CHOICE_AUDIT = 'catalog/g678-alg-l09-ti-choice-family-audit-v1.json';
const SIMPLE_GLOSSARY_AUDIT =
  'catalog/g678-alg-l09-simple-glossary-family-audit-v1.json';
const CATALOG = 'catalog/g678-shared-catalog.v1.json';
const PROFILE = 'catalog/g678-shared-source-profile.v1.json';
export const OUTPUT_FREEZE =
  'catalog/product-bridge-calibrations/g678-current-js-339-page-registration-v1.json';
export const OUTPUT_FRAGMENT =
  'catalog/product-bridge-calibrations/g678-current-js-339-page-registration-v1.fragment.json';

const SUPPLEMENTAL_TERMS = Object.freeze([
  Object.freeze({id: 'column', normalizedKey: 'column',
    sourceKeyAttribute: 'Column',
    labels: Object.freeze({en: 'Column', es: 'Columna'}),
    definitions: Object.freeze({
      en: 'The vertical section on a grid or graph.',
      es: 'Es la parte vertical de un gráfico o una cuadrícula.',
    }), definitionParity: true, legacyCompanionReferences: null}),
  Object.freeze({id: 'simple-simpler-simplest',
    normalizedKey: 'simple / simpler / simplest',
    sourceKeyAttribute: 'Simple / Simpler / Simplest',
    labels: Object.freeze({en: 'Simple / Simpler / Simplest',
      es: 'Simple / Más Simple / El Más Simple'}),
    definitions: Object.freeze({
      en: 'To put something in its easiest form to understand. For example, the simplest form of 8/32 is 1/4.',
      es: 'Es poner algo en su forma más fácil de entender. Por ejemplo, la forma más simple de 8/32 es 1/4.',
    }), definitionParity: true, legacyCompanionReferences: null}),
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

function normalizedTerm(term) {
  const definitions = term.definitions ??
    term.definitionVariants?.englishXml;
  invariant(term.id && term.normalizedKey && term.labels?.en &&
    term.labels?.es && definitions?.en && definitions?.es,
  `key-term ${term.normalizedKey ?? 'unknown'} is incomplete`);
  return Object.freeze({...term, definitions,
    definitionParity: term.definitionParity ?? true,
    legacyCompanionReferences: term.legacyCompanionReferences ?? null});
}

function termMap(...collections) {
  const terms = new Map();
  for (const term of collections.flat().map(normalizedTerm)) {
    if (!terms.has(term.normalizedKey)) terms.set(term.normalizedKey, term);
  }
  return terms;
}

function predecessorGlossaryMap(selectedPages) {
  const entries = new Map();
  for (const page of selectedPages) {
    for (const entry of page.glossaryEntries ?? []) {
      const prior = entries.get(entry.id);
      const comparable = (value) => Object.freeze({
        id: value.id,
        sourceKeyAttribute: value.sourceKeyAttribute.trim()
          .toLocaleLowerCase('en-US'),
        labels: value.labels,
        definitions: value.definitions,
        source: value.source,
      });
      invariant(!prior || exact(comparable(prior), comparable(entry)),
        `${entry.id}: predecessor glossary semantics conflict`);
      if (!prior) entries.set(entry.id, entry);
    }
  }
  return entries;
}

async function verifyEntry(entry, runMember, pages, auditMember, terms,
  recovery, predecessorGlossary) {
  const catalog = pages.get(entry.key);
  invariant(catalog && auditMember?.animationId === entry.key &&
    entry.module === `./modules/${entry.key}` &&
    entry.complexityLane === 'behavior-heavy' &&
    entry.adapterFamily === ADAPTER_FAMILY &&
    runMember?.animationId === entry.key &&
    exact(runMember.manifest, entry.memberManifest) &&
    exact(runMember.runtime, entry.runtime.canvasRenderer),
  `${entry.key}: guided fragment/run/catalog identity drifted`);
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
  const evidence = auditMember.semanticEvidence;
  const expectedStops = auditMember.interactiveStopFrames.map((frame, index) =>
    Object.freeze({id: ['step-1', 'step-2', 'help-1', 'help-2', 'quiz',
      'terminal'][index], frame, resumeFrame: index === 5 ? null : frame + 1,
    kind: index < 2 ? 'continue' : index < 4 ? 'help-or-continue' :
      index === 4 ? 'quiz' : 'terminal'}));
  const stopBinding =
    manifest.value.reviewedAuthority.sourceGuidedStopBinding;
  invariant(manifest.value.animationId === entry.key &&
    manifest.value.source.path === page.viewPath &&
    manifest.value.source.sha256 === page.sourceSha256 &&
    manifest.value.timeline.frameDomain === entry.runtime.frameDomain &&
    manifest.value.timeline.frameCount === entry.runtime.frameCount &&
    manifest.value.timeline.livePlaybackEndFrame ===
      entry.runtime.livePlaybackEndFrame &&
    manifest.value.timeline.buttons.length ===
      evidence.glossaryButtons.length &&
    manifest.value.timeline.explicitChildStop === true &&
    manifest.value.timeline.interactiveStops.length === 5 &&
    exact(stopBinding?.stops, expectedStops) &&
    stopBinding.finalQuestion === evidence.question &&
    stopBinding.correctChoiceId === evidence.correctChoiceId &&
    exact(stopBinding.options, evidence.options) &&
    manifest.value.product.sourceGuidedStopsBound === true &&
    manifest.value.product.sourceNeedMoreHelpBranchesBound === true &&
    manifest.value.product.sourceFinalChoiceQuizBound === true &&
    manifest.value.product
      .accessiblePointerAndKeyboardInteractionImplemented === true &&
    manifest.value.product.choiceFeedbackAudioAccepted === false &&
    manifest.value.product.typedGlossaryIntentImplemented === true,
  `${entry.key}: guided source/timeline/behavior drifted`);
  const groupedButtons = new Map();
  for (const button of evidence.glossaryButtons) {
    const key = button.sourceKeyAttribute.toLocaleLowerCase('en-US');
    const prior = groupedButtons.get(key);
    if (prior) prior.push(button.characterId);
    else groupedButtons.set(key, [button.characterId]);
  }
  const enSource = recovery.value.selectedSources.find((source) =>
    source.localeRole === 'en');
  const esSource = recovery.value.selectedSources.find((source) =>
    source.localeRole === 'es');
  invariant(enSource?.casObject?.sha256 && esSource?.casObject?.sha256,
    'key-term source descriptors are missing');
  const glossaryEntries = [...groupedButtons].map(([key, characterIds]) => {
    const term = terms.get(key);
    invariant(term, `${entry.key}: glossary term ${key} is unresolved`);
    const sourceButton = evidence.glossaryButtons.find((button) =>
      button.sourceKeyAttribute.toLocaleLowerCase('en-US') === key);
    const predecessor = predecessorGlossary.get(term.id);
    invariant(!predecessor || predecessor.sourceKeyAttribute.trim()
      .toLocaleLowerCase('en-US') === sourceButton.sourceKeyAttribute.trim()
        .toLocaleLowerCase('en-US'),
    `${entry.key}: ${term.id} conflicts with predecessor source key`);
    return Object.freeze({id: term.id,
      sourceKeyAttribute: sourceButton.sourceKeyAttribute,
      sourceCharacterId: Math.min(...characterIds),
      sourceCharacterIds: Object.freeze([...characterIds]
        .sort((left, right) => left - right)),
      firstFrame: 1,
      labels: predecessor?.labels ?? term.labels,
      definitions: predecessor?.definitions ?? term.definitions,
      definitionParity: predecessor?.definitionParity ?? term.definitionParity,
      source: predecessor?.source ?? Object.freeze({
        en: Object.freeze({assetId: 'G678L1KTE01.xml',
          path: enSource.reference, sha256: enSource.casObject.sha256}),
        es: Object.freeze({assetId: 'G678L1KTS01.xml',
          path: esSource.reference, sha256: esSource.casObject.sha256}),
      }),
      legacyCompanionReferences: predecessor?.legacyCompanionReferences ??
        term.legacyCompanionReferences});
  }).sort((left, right) => left.id.localeCompare(right.id));
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
    adapterFamily: ADAPTER_FAMILY,
    implementation: Object.freeze({
      kind: 'source-script-bound-guided-tutorial-current-js-candidate',
      deploymentScope: 'local-only',
      typedModernGlossaryIntentImplemented: true,
      sourceGuidedStopsBound: true,
      sourceNeedMoreHelpBranchesBound: true,
      sourceFinalChoiceQuizBound: true,
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
      language: 'fixed-en', scenario: 'source-static-frame', seed: '0',
      canvasRenderer: entry.runtime.canvasRenderer,
      interactiveStops: Object.freeze(interactiveStops),
      interactiveSeek: null,
    }),
    glossaryEntries: Object.freeze(glossaryEntries),
    sourceGuidedTutorial: Object.freeze({
      stops: Object.freeze(expectedStops),
      helpPrompts: Object.freeze(evidence.helpPrompts),
      finalQuestion: evidence.question,
      correctChoiceId: evidence.correctChoiceId,
      options: Object.freeze(evidence.options),
    }),
    runtimeEvidenceBoundary: Object.freeze({
      runtimeKind:
        'source-script-bound-guided-tutorial-current-js-candidate',
      actionScriptExecution: 'not-executed',
      naturalTraceValidation: 'not-established',
      audioAcceptance: 'not-established',
      replaySemantics:
        'product-complete-interaction-reset-original-runtime-parity-not-established',
    }),
    productBlockers: Object.freeze([
      'alg-l09-guided-tutorial-browser-product-calibration-pending',
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
    const predecessor =
      await finalizeG678AlgL09TiChoiceFamilyRegistration({check: true});
    invariant(predecessor.check === true &&
      predecessor.registrationCandidatePlacementCount === 336,
    '336-page predecessor final admission failed');
  }
  const [auditCheck, generatorCheck] = await Promise.all([
    auditG678AlgL09ResidualRouting({check: true}),
    runAlgL09GuidedTutorialCurrentJs({check: true}),
  ]);
  invariant(auditCheck.check && generatorCheck.check,
    'guided tutorial prerequisite checks did not complete');
  const [predecessorFreeze, predecessorFragment, audit, generatedFragment,
    recovery, tiChoiceAudit, simpleGlossaryAudit, catalog, profile, builder] =
    await Promise.all([
      binding(PREDECESSOR_FREEZE, true),
      binding(PREDECESSOR_FRAGMENT, true), binding(AUDIT, true),
      binding(GENERATED_FRAGMENT, true), binding(KEY_TERM_RECOVERY, true),
      binding(TI_CHOICE_AUDIT, true), binding(SIMPLE_GLOSSARY_AUDIT, true),
      binding(CATALOG, true), binding(PROFILE, true),
      binding(path.relative(ROOT, SCRIPT_PATH)),
    ]);
  const guidedMembers = audit.value.members.filter((member) =>
    member.lane === 'advanced-manual-guided-tutorial-quiz-state-machine');
  invariant(predecessorFreeze.value.calibrationId === CALIBRATION_ID &&
    predecessorFreeze.value.selectedPages.length === 336 &&
    predecessorFragment.value.calibration.freezeManifest ===
      PREDECESSOR_FREEZE &&
    exact(predecessorFragment.value.freeze, descriptor(predecessorFreeze)) &&
    predecessorFragment.value.calibration.entries.length === 336 &&
    audit.value.auditedPlacementCount === 6 && guidedMembers.length === 3 &&
    audit.value.registrationCandidatePlacementCount === 0 &&
    generatedFragment.value.generatedPlacementCount === 3 &&
    generatedFragment.value.entries.length === 3 &&
    generatedFragment.value.currentJavaScriptRegisteredCount === 0 &&
    exact(generatedFragment.value.reviewedAudit, descriptor(audit)) &&
    exact(generatedFragment.value.keyTermRecovery, descriptor(recovery)) &&
    exact(generatedFragment.value.predecessorFreeze,
      descriptor(predecessorFreeze)),
  'guided predecessor/audit/recovery/fragment authority drifted');
  const run = await binding(generatedFragment.value.compilerRun.path, true);
  invariant(run.bytes === generatedFragment.value.compilerRun.bytes &&
    run.sha256 === generatedFragment.value.compilerRun.sha256 &&
    run.value.generatedPlacementCount === 3 &&
    run.value.compiledUniqueSwfCount === 3 &&
    run.value.registryEntriesWritten === 0 &&
    exact(run.value.inputs.audit, descriptor(audit)) &&
    exact(run.value.inputs.recovery, descriptor(recovery)) &&
    exact(run.value.inputs.tiChoiceAudit, descriptor(tiChoiceAudit)) &&
    exact(run.value.inputs.simpleGlossaryAudit,
      descriptor(simpleGlossaryAudit)) &&
    exact(run.value.inputs.predecessor, descriptor(predecessorFreeze)),
  'guided compiler run authority drifted');
  const expectedKeys = guidedMembers.map((member) =>
    member.animationId).sort();
  invariant(exact(generatedFragment.value.entries.map((entry) =>
    entry.key).sort(), expectedKeys) &&
    exact(run.value.members.map((member) => member.animationId).sort(),
      expectedKeys),
  'guided exact generated/admitted membership drifted');
  const runMembers = new Map(run.value.members.map((member) =>
    [member.animationId, member]));
  const auditMembers = new Map(guidedMembers.map((member) =>
    [member.animationId, member]));
  const terms = termMap(recovery.value.terms, tiChoiceAudit.value.terms,
    simpleGlossaryAudit.value.terms, SUPPLEMENTAL_TERMS);
  const predecessorGlossary = predecessorGlossaryMap(
    predecessorFreeze.value.selectedPages);
  const pages = pageMap(catalog.value);
  const guidedPages = [];
  for (const entry of [...generatedFragment.value.entries].sort((left, right) =>
    left.key.localeCompare(right.key))) {
    guidedPages.push(await verifyEntry(entry, runMembers.get(entry.key), pages,
      auditMembers.get(entry.key), terms, recovery, predecessorGlossary));
  }
  const selectedPages = [...predecessorFreeze.value.selectedPages,
    ...guidedPages].sort((left, right) =>
    left.animationId.localeCompare(right.animationId));
  invariant(selectedPages.length === 339 &&
    new Set(selectedPages.map((page) => page.animationId)).size === 339 &&
    new Set(selectedPages.map((page) => page.stableLessonKey)).size === 44,
  'combined guided tutorial membership drifted');
  const advancedManualCount = selectedPages.filter((page) =>
    page.adapterFamily.startsWith('advanced-manual-')).length;
  const sharedAdapterCount = selectedPages.length - advancedManualCount;
  invariant(advancedManualCount === 6 && sharedAdapterCount === 333,
    '339 shared/advanced adapter denominator drifted');
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
    registrationCandidatePlacementCount: 339,
    sharedAdapterPlacementCount: sharedAdapterCount,
    advancedManualPlacementCount: advancedManualCount,
    legacyFlashCourseShellCount: 0,
    scaleOutAuthorized: false, engineeringPreviewReady: false,
    productCalibrationPassed: false,
    inputs: {
      sharedCatalog: descriptor(catalog), sourceProfile: descriptor(profile),
      selectionAuthorities: [descriptor(predecessorFreeze), descriptor(audit)],
      predecessorFreeze: descriptor(predecessorFreeze),
      algL09ResidualRoutingAudit: descriptor(audit),
      algL09GuidedTutorialGeneratedFragment: descriptor(generatedFragment),
      keyTermRecovery: descriptor(recovery),
      finalizer: descriptor(builder),
    },
    selectedPages, pendingAdvancedManualPlacements: [], acceptanceEffects,
    limitations: [
      '339 registration candidates remain partial across all 44 lessons; no N/N whole-lesson engineering preview exists.',
      'Only the exact three ALG L9 guided tutorial pages selected by the six-page residual routing audit are admitted by this provisional freeze.',
      'Each page binds four guided stops, two Need More Help paths, a two-attempt final check, terminal stop, Replay reset, and glossary intents; browser product calibration remains mandatory.',
      'Choice-feedback and narration audio, original-runtime, fidelity, human, Owner, strict, release, and publication gates remain false.',
      'Recovered key-term XML remains private custody evidence and is not promoted into the canonical source tree.',
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
  invariant(entries.length === 339 &&
    new Set(entries.map((entry) => entry.key)).size === 339,
  'combined guided registry membership drifted');
  const fragment = {
    schemaVersion: 1,
    artifactType: 'private-current-js-calibration-fragment-v1',
    calibration: {calibrationId: CALIBRATION_ID,
      deploymentScope: 'local-only', freezeManifest: OUTPUT_FREEZE, entries},
    freeze: {path: OUTPUT_FREEZE, bytes: freezeBytes.length,
      sha256: sha256(freezeBytes)},
    descriptorProjection: {registrationCandidatePlacementCount: 339,
      frozenCalibrationPlacementCount: 2282, affectedLessonCount: 44,
      wholeLessonEngineeringPreviewCount: 0,
      sourceOrderedLessonMembershipRequired: true,
      modernMyLessonHostRequired: true, engineeringPreviewReady: false},
    familyScaleout: {algL09ResidualAuditedPlacements: 6,
      guidedTutorialEligiblePlacements: 3, blockedPlacements: 3,
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

export async function finalizeAlgL09GuidedTutorialRegistration({check = false,
  requireCurrentPredecessorHost = false} = {}) {
  const artifacts = await expectedArtifacts({requireCurrentPredecessorHost});
  if (check) {
    const [freeze, fragment] = await Promise.all([
      binding(OUTPUT_FREEZE), binding(OUTPUT_FRAGMENT),
    ]);
    invariant(freeze.buffer.equals(artifacts.freezeBytes) &&
      fragment.buffer.equals(artifacts.fragmentBytes),
    'ALG L9 339-page registration artifacts drifted');
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
  return Object.freeze({check, registrationCandidatePlacementCount: 339,
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
    'usage: finalize-g678-alg-l09-guided-tutorial-registration.mjs [--check]');
  finalizeAlgL09GuidedTutorialRegistration({check: args.includes('--check')})
    .then((result) => process.stdout.write(`${JSON.stringify(result, null, 2)}\n`))
    .catch((error) => {
      process.stderr.write(`${error.stack ?? error.message}\n`);
      process.exitCode = 1;
    });
}
