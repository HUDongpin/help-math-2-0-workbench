#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {constants as fsConstants} from 'node:fs';
import {copyFile, lstat, readFile, unlink, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {finalizeG678AlgL09GameAssessmentFamilyRegistration} from
  './finalize-g678-alg-l09-game-assessment-family-registration.mjs';
import {auditG678AlgL11ResidualRouting} from
  './audit-g678-alg-l11-residual-routing.mjs';
import {auditG678AlgL11IntroTerminalTranche1Family} from
  './audit-g678-alg-l11-intro-terminal-tranche1.mjs';
import {runAlgL11IntroTerminalTranche1CurrentJs} from
  './build-g678-alg-l11-intro-terminal-tranche1-current-js.mjs';
import {auditG678AlgL11SimpleGlossaryTranche1} from
  './audit-g678-alg-l11-simple-glossary-tranche1.mjs';
import {runAlgL11SimpleGlossaryTranche1CurrentJs} from
  './build-g678-alg-l11-simple-glossary-tranche1-current-js.mjs';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
const CALIBRATION_ID = 'g678-16-page-product-calibration-v1';
const PREDECESSOR_FREEZE =
  'catalog/product-bridge-calibrations/g678-current-js-342-page-product-calibrated-registration-v1.json';
const PREDECESSOR_FRAGMENT =
  'catalog/product-bridge-calibrations/g678-current-js-342-page-product-calibrated-registration-v1.fragment.json';
const RESIDUAL_AUDIT = 'catalog/g678-alg-l11-residual-routing-audit-v1.json';
const INTRO_AUDIT =
  'catalog/g678-alg-l11-intro-terminal-tranche1-v1.json';
const INTRO_FRAGMENT =
  'catalog/product-bridge-calibrations/g678-alg-l11-intro-terminal-tranche1-current-js-4-v1.fragment.json';
const SIMPLE_AUDIT =
  'catalog/g678-alg-l11-simple-glossary-tranche1-audit-v1.json';
const SIMPLE_FRAGMENT =
  'catalog/product-bridge-calibrations/g678-alg-l11-simple-glossary-tranche1-current-js-8-v1.fragment.json';
const CATALOG = 'catalog/g678-shared-catalog.v1.json';
const PROFILE = 'catalog/g678-shared-source-profile.v1.json';
export const OUTPUT_FREEZE =
  'catalog/product-bridge-calibrations/g678-current-js-354-page-registration-v1.json';
export const OUTPUT_FRAGMENT =
  'catalog/product-bridge-calibrations/g678-current-js-354-page-registration-v1.fragment.json';

export const ALG_L11_TRANCHE1_IDS = Object.freeze([
  'shared-alg001-l11-p001',
  'shared-alg001-l11-p002',
  'shared-alg001-l11-p003',
  'shared-alg001-l11-p004',
  'shared-alg001-l11-p007',
  'shared-alg001-l11-p013',
  'shared-alg001-l11-p016',
  'shared-alg001-l11-p017',
  'shared-alg001-l11-p018',
  'shared-alg001-l11-p022',
  'shared-alg001-l11-p023',
  'shared-alg001-l11-p024',
]);

const INTRO_IDS = Object.freeze(ALG_L11_TRANCHE1_IDS.slice(0, 4));
const SIMPLE_IDS = Object.freeze(ALG_L11_TRANCHE1_IDS.slice(4));
const FALSE_EFFECT_KEYS = Object.freeze([
  'authoritativeOriginalRuntime',
  'behaviorParityAccepted',
  'visualFidelityAccepted',
  'audioAccepted',
  'humanVisualAccepted',
  'ownerAccepted',
  'strictComplete',
  'releaseEligible',
  'published',
]);
const UNDECODED_MATH_ENTITY =
  /&(?:#\d+|#x[a-f0-9]+|lt|gt|le|ge|ne);/iu;

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function stableBytes(value) {
  return Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
}

function exact(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
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

function pageMap(catalog) {
  return new Map(catalog.lessons.flatMap((lesson) =>
    lesson.pages.map((page) => [page.animationId, {lesson, page}])));
}

function ids(values) {
  return [...values].map((value) => value.animationId ?? value.key).sort();
}

function falseEffects(value, label, {canonicalFreeze = false} = {}) {
  invariant(value && Object.values(value).length > 0 &&
    Object.values(value).every((effect) => effect === false) &&
    (!canonicalFreeze || FALSE_EFFECT_KEYS.every((key) =>
      value[key] === false)),
  `${label} acceptance effects must remain false`);
}

function exactTermsForButtons(buttons, terms, animationId) {
  const termByKey = new Map(terms.map((term) => [
    term.sourceKeyAttribute.toLocaleLowerCase('en-US'), term,
  ]));
  const seen = new Set();
  return buttons.flatMap((button) => {
    const key = button.sourceKeyAttribute.toLocaleLowerCase('en-US');
    const term = termByKey.get(key);
    invariant(term, `${animationId}: glossary term ${key} is missing`);
    if (seen.has(term.id)) return [];
    seen.add(term.id);
    return [term];
  });
}

function glossaryEntries(terms, audit) {
  return terms.map((term) => Object.freeze({
    id: term.id,
    sourceKeyAttribute: term.sourceKeyAttribute,
    labels: term.labels,
    definitions: term.definitions,
    source: Object.freeze({
      en: Object.freeze({assetId: 'G678L1KTE01.xml',
        path: 'HELP_KEYTERMS/KT/XML/L1KTE01.xml',
        sha256: audit.value.keyTermSources.en.sha256}),
      es: Object.freeze({assetId: 'G678L1KTS01.xml',
        path: 'HELP_KEYTERMS/KT/XML/L1KTS01.xml',
        sha256: audit.value.keyTermSources.es.sha256}),
    }),
    legacyCompanionReferences: term.legacyCompanionReferences,
  }));
}

async function verifyEntry({entry, runMember, pages, audit, family}) {
  const catalog = pages.get(entry.key);
  const expectedFamily = family === 'intro'
    ? 'alg-l11-intro-terminal-tranche1-source-static'
    : 'alg-l11-simple-glossary-tranche1-source-static';
  invariant(catalog && entry.module === `./modules/${entry.key}` &&
    entry.maturity === 'private-current-js' &&
    entry.deploymentScope === 'local-only' &&
    entry.adapterFamily === expectedFamily &&
    (family === 'intro'
      ? INTRO_IDS.includes(entry.key) &&
        ['low', 'interactive-understood'].includes(entry.complexityLane)
      : SIMPLE_IDS.includes(entry.key) &&
        entry.complexityLane === 'interactive-understood') &&
    runMember?.animationId === entry.key &&
    exact(runMember.manifest, entry.memberManifest) &&
    exact(runMember.runtime, entry.runtime.canvasRenderer),
  `${entry.key}: ALG L11 ${family} fragment/run/catalog identity drifted`);
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
  invariant(moduleFile.buffer.includes(Buffer.from(
    'maturity: "private-current-js" as const')),
  `${entry.key}: module does not expose private-current-js maturity`);
  const page = catalog.page;
  const lesson = catalog.lesson;
  const timelineValue = manifest.value.timeline;
  const product = manifest.value.product;
  invariant(manifest.value.animationId === entry.key &&
    manifest.value.source.path === page.viewPath &&
    manifest.value.source.sha256 === page.sourceSha256 &&
    timelineValue.frameDomain === entry.runtime.frameDomain &&
    timelineValue.frameCount === entry.runtime.frameCount &&
    timelineValue.livePlaybackEndFrame === entry.runtime.livePlaybackEndFrame &&
    timelineValue.rootFrameCount === 10 &&
    timelineValue.rootBeginFrame === 6 &&
    product.currentJavaScriptRegistered === false &&
    product.productCalibrationPassed === false &&
    product.engineeringPreviewReady === false,
  `${entry.key}: ALG L11 ${family} member source/timeline state drifted`);
  const buttons = timelineValue.buttons;
  invariant(Array.isArray(buttons) && buttons.every((button) =>
    Number.isSafeInteger(button.characterId) &&
    typeof button.sourceKeyAttribute === 'string' &&
    Number.isSafeInteger(button.firstFrame) && button.firstFrame >= 1 &&
    button.firstFrame <= timelineValue.frameCount),
  `${entry.key}: ALG L11 glossary button projection drifted`);
  const pageTerms = exactTermsForButtons(buttons, audit.value.terms, entry.key);
  const introPage = entry.key === 'shared-alg001-l11-p001';
  const pageToken = entry.key.match(/-(p\d{3})$/u)?.[1];
  const companionTargetIdSuffix = introPage
    ? null
    : `alg-l11-${pageToken}-glossary-controls`;
  invariant(product.typedGlossaryIntentImplemented === !introPage &&
    (introPage ? buttons.length === 0 : buttons.length >= 1) &&
    (introPage || pageToken) &&
    (family === 'simple' ||
      product.sourceTerminalStopBound === timelineValue.explicitChildStop),
  `${entry.key}: ALG L11 typed product behavior drifted`);
  const interactive = entry.complexityLane === 'interactive-understood';
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
    complexityLane: entry.complexityLane,
    adapterFamily: expectedFamily,
    implementation: Object.freeze({
      kind: 'source-static-current-js-candidate',
      deploymentScope: 'local-only',
      typedModernGlossaryIntentImplemented: !introPage,
      ...(family === 'intro' ? {
        sourceTerminalStopBound: timelineValue.explicitChildStop,
      } : {}),
      productCalibrationPassed: false,
    }),
    runtime: Object.freeze({
      stage: Object.freeze({width: 800, height: 600}),
      rootFrameCount: timelineValue.rootFrameCount,
      rootBeginFrame: timelineValue.rootBeginFrame,
      frameDomain: entry.runtime.frameDomain,
      frameCount: entry.runtime.frameCount,
      livePlaybackEndFrame: entry.runtime.livePlaybackEndFrame,
      language: 'fixed-en',
      scenario: 'source-static-frame',
      seed: '0',
      canvasRenderer: entry.runtime.canvasRenderer,
    }),
    ...(companionTargetIdSuffix ? {
      presentation: Object.freeze({
        pageInteractionCompanionTargetIdSuffix: companionTargetIdSuffix,
      }),
    } : {}),
    glossaryEntries: Object.freeze(glossaryEntries(pageTerms, audit)),
    runtimeEvidenceBoundary: Object.freeze({
      runtimeKind: interactive
        ? 'source-script-bound-product-behavior-current-js-candidate'
        : 'source-static-current-js-candidate',
      actionScriptExecution: 'not-executed',
      naturalTraceValidation: 'not-established',
      audioAcceptance: 'not-established',
      replaySemantics:
        'renderer-restart-only-source-behavior-not-established',
    }),
    productBlockers: Object.freeze([
      'alg-l11-tranche1-browser-product-calibration-pending',
      ...(introPage ? [] : [
        'legacy-key-term-sublinks-and-example-swfs-not-implemented',
      ]),
      'source-audio-lifecycle-and-listening-acceptance-pending',
      'authoritative-original-runtime-not-established',
      'visual-fidelity-not-accepted',
    ]),
    productCalibrationPassed: false,
    engineeringPreviewReady: false,
  });
}

function validateAuditAndRun({audit, fragment, run, family}) {
  const expectedIds = family === 'intro' ? INTRO_IDS : SIMPLE_IDS;
  const count = expectedIds.length;
  const expectedAuditType = family === 'intro'
    ? 'g678-alg-l11-intro-terminal-tranche1-v1'
    : 'g678-alg-l11-simple-glossary-tranche1-audit-v1';
  const expectedFragmentType = family === 'intro'
    ? 'g678-alg-l11-intro-terminal-tranche1-current-js-fragment-v1'
    : 'g678-alg-l11-simple-glossary-tranche1-current-js-fragment-v1';
  const expectedRunType = family === 'intro'
    ? 'g678-alg-l11-intro-terminal-tranche1-current-js-run-v1'
    : 'g678-alg-l11-simple-glossary-tranche1-current-js-run-v1';
  const termText = audit.value.terms.flatMap((term) => [
    ...Object.values(term.labels),
    ...Object.values(term.definitions),
  ]);
  invariant(audit.value.artifactType === expectedAuditType &&
    ids(audit.value.records).join('|') === [...expectedIds].sort().join('|') &&
    fragment.value.artifactType === expectedFragmentType &&
    fragment.value.deploymentScope === 'local-only' &&
    fragment.value.auditedPlacementCount === count &&
    fragment.value.recoveredEligiblePlacementCount === count &&
    fragment.value.blockedPlacementCount === 0 &&
    fragment.value.generatedPlacementCount === count &&
    fragment.value.currentJavaScriptRegisteredCount === 0 &&
    fragment.value.productCalibrationPassed !== true &&
    fragment.value.overallProductCalibrationPassed !== true &&
    fragment.value.engineeringPreviewReady !== true &&
    fragment.value.wholeLessonEngineeringPreviewCount === 0 &&
    exact(fragment.value.reviewedAudit, descriptor(audit)) &&
    run.value.artifactType === expectedRunType &&
    run.value.deploymentScope === 'local-only' &&
    run.value.generatedPlacementCount === count &&
    run.value.compiledUniqueSwfCount === count &&
    run.value.affectedLessonCount === 1 &&
    run.value.registryEntriesWritten === 0 &&
    termText.every((value) => typeof value === 'string' &&
      !UNDECODED_MATH_ENTITY.test(value)) &&
    exact(run.value.inputs.audit, descriptor(audit)) &&
    exact(fragment.value.compilerRun, descriptor(run)) &&
    ids(fragment.value.entries).join('|') === [...expectedIds].sort().join('|') &&
    ids(run.value.members).join('|') === [...expectedIds].sort().join('|'),
  `ALG L11 ${family} audit/run/fragment authority drifted`);
  falseEffects(fragment.value.acceptanceEffects,
    `ALG L11 ${family} fragment`);
}

async function expectedArtifacts({requireCurrentPredecessorHost = false} = {}) {
  if (requireCurrentPredecessorHost) {
    const predecessor =
      await finalizeG678AlgL09GameAssessmentFamilyRegistration({check: true});
    invariant(predecessor.check === true &&
      predecessor.registrationCandidatePlacementCount === 342,
    '342-page product-calibrated predecessor admission failed');
  }
  const auditChecks = await Promise.all([
    auditG678AlgL11ResidualRouting({check: true}),
    auditG678AlgL11IntroTerminalTranche1Family({check: true}),
    auditG678AlgL11SimpleGlossaryTranche1({check: true}),
  ]);
  const generatorChecks = await Promise.all([
    runAlgL11IntroTerminalTranche1CurrentJs({check: true}),
    runAlgL11SimpleGlossaryTranche1CurrentJs({check: true}),
  ]);
  invariant([...auditChecks, ...generatorChecks].every((result) =>
    result.check === true),
    'ALG L11 tranche1 prerequisite checks did not complete');
  const [predecessorFreeze, predecessorFragment, residualAudit, introAudit,
    introFragment, simpleAudit, simpleFragment, catalog, profile, builder] =
    await Promise.all([
      binding(PREDECESSOR_FREEZE, true),
      binding(PREDECESSOR_FRAGMENT, true),
      binding(RESIDUAL_AUDIT, true),
      binding(INTRO_AUDIT, true),
      binding(INTRO_FRAGMENT, true),
      binding(SIMPLE_AUDIT, true),
      binding(SIMPLE_FRAGMENT, true),
      binding(CATALOG, true),
      binding(PROFILE, true),
      binding(path.relative(ROOT, SCRIPT_PATH)),
    ]);
  invariant(predecessorFreeze.value.calibrationId === CALIBRATION_ID &&
    predecessorFreeze.value.status ===
      'private-current-js-product-host-calibrated-candidates-registered' &&
    predecessorFreeze.value.selectedPages.length === 342 &&
    predecessorFreeze.value.registrationCandidatePlacementCount === 342 &&
    predecessorFragment.value.calibration.calibrationId === CALIBRATION_ID &&
    predecessorFragment.value.calibration.freezeManifest ===
      PREDECESSOR_FREEZE &&
    predecessorFragment.value.calibration.entries.length === 342 &&
    exact(predecessorFragment.value.freeze, descriptor(predecessorFreeze)),
  '342-page predecessor freeze/fragment authority drifted');
  falseEffects(predecessorFreeze.value.acceptanceEffects,
    '342-page predecessor', {canonicalFreeze: true});
  invariant(residualAudit.value.artifactType ===
      'g678-alg-l11-residual-routing-audit-v1' &&
    residualAudit.value.status ===
      'exact-35-source-script-text-routed-no-registration' &&
    residualAudit.value.stableLessonKey === 'shared-alg001-l11' &&
    residualAudit.value.lessonActivePageCount === 44 &&
    residualAudit.value.predecessorRegisteredPageCount === 9 &&
    residualAudit.value.auditedResidualPlacementCount === 35 &&
    residualAudit.value.registrationCandidatePlacementCount === 0 &&
    residualAudit.value.currentJavaScriptRegisteredPlacementCount === 0 &&
    residualAudit.value.productCalibrationPassed === false &&
    residualAudit.value.wholeLessonEngineeringPreviewReady === false &&
    exact(residualAudit.value.inputs.predecessorFinal342,
      descriptor(predecessorFreeze)) &&
    ALG_L11_TRANCHE1_IDS.every((id) =>
      residualAudit.value.residualPlacementIds.includes(id)),
  'ALG L11 exact residual routing authority drifted');
  falseEffects(residualAudit.value.acceptanceEffects,
    'ALG L11 residual audit');
  const [introRun, simpleRun] = await Promise.all([
    binding(introFragment.value.compilerRun.path, true),
    binding(simpleFragment.value.compilerRun.path, true),
  ]);
  validateAuditAndRun({audit: introAudit, fragment: introFragment,
    run: introRun, family: 'intro'});
  validateAuditAndRun({audit: simpleAudit, fragment: simpleFragment,
    run: simpleRun, family: 'simple'});
  const pages = pageMap(catalog.value);
  const runMembers = new Map([
    ...introRun.value.members,
    ...simpleRun.value.members,
  ].map((member) => [member.animationId, member]));
  const addedPages = [];
  for (const entry of [...introFragment.value.entries,
    ...simpleFragment.value.entries].sort((left, right) =>
    left.key.localeCompare(right.key))) {
    addedPages.push(await verifyEntry({entry,
      runMember: runMembers.get(entry.key), pages,
      audit: INTRO_IDS.includes(entry.key) ? introAudit : simpleAudit,
      family: INTRO_IDS.includes(entry.key) ? 'intro' : 'simple'}));
  }
  invariant(ids(addedPages).join('|') ===
    [...ALG_L11_TRANCHE1_IDS].sort().join('|'),
  'ALG L11 exact12 admitted membership drifted');
  const companionSuffixes = addedPages.flatMap((page) =>
    page.presentation
      ? [page.presentation.pageInteractionCompanionTargetIdSuffix]
      : []);
  invariant(addedPages.find((page) => page.animationId ===
      'shared-alg001-l11-p001')?.presentation === undefined &&
    companionSuffixes.length === 11 &&
    new Set(companionSuffixes).size === 11 &&
    addedPages.filter((page) => page.animationId !==
      'shared-alg001-l11-p001').every((page) =>
      page.presentation?.pageInteractionCompanionTargetIdSuffix ===
        `alg-l11-${page.animationId.slice(-4)}-glossary-controls`),
  'ALG L11 exact11 glossary companion presentation drifted');
  const selectedPages = [...predecessorFreeze.value.selectedPages,
    ...addedPages].sort((left, right) =>
    left.animationId.localeCompare(right.animationId));
  invariant(selectedPages.length === 354 &&
    new Set(selectedPages.map((page) => page.animationId)).size === 354 &&
    new Set(selectedPages.map((page) => page.stableLessonKey)).size === 44 &&
    selectedPages.filter((page) =>
      page.stableLessonKey === 'shared-alg001-l11').length === 21,
  'combined 354 membership or ALG L11 21/44 denominator drifted');
  const selectedByLesson = new Map();
  for (const selected of selectedPages) {
    const members = selectedByLesson.get(selected.stableLessonKey) ?? [];
    members.push(selected.animationId);
    selectedByLesson.set(selected.stableLessonKey, members);
  }
  const completeLessonKeys = catalog.value.lessons.filter((lesson) =>
    (selectedByLesson.get(lesson.stableLessonKey)?.length ?? 0) ===
      lesson.activePageCount).map((lesson) => lesson.stableLessonKey);
  invariant(exact(completeLessonKeys, ['shared-alg001-l09']),
    '354 freeze must preserve ALG L9 as the only complete lesson');
  const advancedManualCount = selectedPages.filter((page) =>
    page.adapterFamily.startsWith('advanced-manual-')).length;
  const sharedAdapterCount = selectedPages.length - advancedManualCount;
  invariant(advancedManualCount === 9 && sharedAdapterCount === 345,
    '354 shared/advanced adapter denominator drifted');
  const acceptanceEffects = Object.freeze({
    ...predecessorFreeze.value.acceptanceEffects,
  });
  falseEffects(acceptanceEffects, '354 combined freeze',
    {canonicalFreeze: true});
  const freeze = {
    schemaVersion: 1,
    calibrationId: CALIBRATION_ID,
    deploymentScope: 'local-only',
    status: 'private-current-js-calibration-candidates-generated',
    frozenCalibrationPlacementCount: 2282,
    registrationCandidatePlacementCount: 354,
    sharedAdapterPlacementCount: sharedAdapterCount,
    advancedManualPlacementCount: advancedManualCount,
    legacyFlashCourseShellCount: 0,
    scaleOutAuthorized: false,
    engineeringPreviewReady: false,
    productCalibrationPassed: false,
    inputs: {
      sharedCatalog: descriptor(catalog),
      sourceProfile: descriptor(profile),
      selectionAuthorities: [descriptor(predecessorFreeze),
        descriptor(residualAudit), descriptor(introAudit),
        descriptor(simpleAudit)],
      predecessorFreeze: descriptor(predecessorFreeze),
      algL11ResidualRoutingAudit: descriptor(residualAudit),
      algL11IntroTerminalAudit: descriptor(introAudit),
      algL11IntroTerminalGeneratedFragment: descriptor(introFragment),
      algL11SimpleGlossaryAudit: descriptor(simpleAudit),
      algL11SimpleGlossaryGeneratedFragment: descriptor(simpleFragment),
      finalizer: descriptor(builder),
    },
    selectedPages,
    pendingAdvancedManualPlacements: [],
    acceptanceEffects,
    limitations: [
      '354 registered Current-JS pages remain partial across 43 lessons; ALG L9 remains the only 41/41 whole-lesson engineering preview and ALG L11 is 21/44.',
      'Only the exact 12 ALG L11 tranche1 pages are admitted beyond the product-calibrated final342 predecessor; all 12 remain browser-product-calibration pending.',
      'The exact 35-member ALG L11 residual audit is routing authority only and does not authorize the other 23 residual pages for registration.',
      'Source audio lifecycle/listening, original-runtime, fidelity, human, Owner, strict, release, and publication gates remain false.',
      'Recovered key-term XML remains private custody evidence and is not promoted into the canonical source tree.',
    ],
  };
  const freezeBytes = stableBytes(freeze);
  const newEntries = [...introFragment.value.entries,
    ...simpleFragment.value.entries].map((entry) => ({
    key: entry.key,
    module: entry.module,
    maturity: 'private-current-js',
    complexityLane: entry.complexityLane,
    artifacts: {module: entry.moduleFile, timeline: entry.timeline,
      runtime: entry.runtime.canvasRenderer},
  }));
  const entries = [...predecessorFragment.value.calibration.entries,
    ...newEntries].sort((left, right) => left.key.localeCompare(right.key));
  invariant(entries.length === 354 &&
    new Set(entries.map((entry) => entry.key)).size === 354,
  'combined 354 registry entry membership drifted');
  const fragment = {
    schemaVersion: 1,
    artifactType: 'private-current-js-calibration-fragment-v1',
    calibration: {calibrationId: CALIBRATION_ID,
      deploymentScope: 'local-only', freezeManifest: OUTPUT_FREEZE, entries},
    freeze: {path: OUTPUT_FREEZE, bytes: freezeBytes.length,
      sha256: sha256(freezeBytes)},
    descriptorProjection: {
      registrationCandidatePlacementCount: 354,
      frozenCalibrationPlacementCount: 2282,
      affectedLessonCount: 44,
      wholeLessonEngineeringPreviewCount: 1,
      newWholeLessonEngineeringPreviewCount: 0,
      exactCompleteLessonKeys: ['shared-alg001-l09'],
      algL11RegisteredPageCount: 21,
      algL11ActivePageCount: 44,
      sourceOrderedLessonMembershipRequired: true,
      modernMyLessonHostRequired: true,
      engineeringPreviewReady: false,
    },
    tranche: {
      algL11ResidualAuditedPlacements: 35,
      exactTranchePlacementCount: 12,
      introTerminalGeneratedAndAdmittedPlacements: 4,
      simpleGlossaryGeneratedAndAdmittedPlacements: 8,
      predecessorOverlap: 0,
      browserProductCalibrationPassed: false,
    },
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

export async function finalizeAlgL11Tranche1Registration({check = false,
  requireCurrentPredecessorHost = false} = {}) {
  const artifacts = await expectedArtifacts({requireCurrentPredecessorHost});
  if (check) {
    const [freeze, fragment] = await Promise.all([
      binding(OUTPUT_FREEZE), binding(OUTPUT_FRAGMENT),
    ]);
    invariant(freeze.buffer.equals(artifacts.freezeBytes) &&
      fragment.buffer.equals(artifacts.fragmentBytes),
    'ALG L11 provisional354 registration artifacts drifted');
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
    registrationCandidatePlacementCount: 354,
    frozenCalibrationPlacementCount: 2282,
    affectedLessonCount: 44,
    algL11RegisteredPageCount: 21,
    wholeLessonEngineeringPreviewCount: 1,
    newWholeLessonEngineeringPreviewCount: 0,
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
    'usage: finalize-g678-alg-l11-tranche1-registration.mjs [--check]');
  finalizeAlgL11Tranche1Registration({check: args.includes('--check')})
    .then((result) => process.stdout.write(`${JSON.stringify(result, null, 2)}\n`))
    .catch((error) => {
      process.stderr.write(`${error.stack ?? error.message}\n`);
      process.exitCode = 1;
    });
}
