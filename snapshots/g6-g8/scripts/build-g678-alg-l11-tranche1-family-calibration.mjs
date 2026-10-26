#!/usr/bin/env node

import {execFile} from 'node:child_process';
import {createHash} from 'node:crypto';
import {chmod, link, lstat, readFile, realpath, unlink, writeFile} from
  'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {promisify} from 'node:util';

const execFileAsync = promisify(execFile);
const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
const OUTPUT =
  'catalog/product-bridge-calibrations/g678-alg-l11-tranche1-family-calibration-v1.json';
const IDS = Object.freeze([
  'shared-alg001-l11-p001', 'shared-alg001-l11-p002',
  'shared-alg001-l11-p003', 'shared-alg001-l11-p004',
  'shared-alg001-l11-p007', 'shared-alg001-l11-p013',
  'shared-alg001-l11-p016', 'shared-alg001-l11-p017',
  'shared-alg001-l11-p018', 'shared-alg001-l11-p022',
  'shared-alg001-l11-p023', 'shared-alg001-l11-p024',
]);
const PATHS = Object.freeze({
  residualAudit: 'catalog/g678-alg-l11-residual-routing-audit-v1.json',
  introAudit: 'catalog/g678-alg-l11-intro-terminal-tranche1-v1.json',
  introAuditRun:
    'work/g678-shared-page-factory/g678-alg-l11-intro-terminal-tranche1-v1/run-manifest.json',
  introAuditVerifier:
    'scripts/audit-g678-alg-l11-intro-terminal-tranche1.mjs',
  introGenerator:
    'scripts/build-g678-alg-l11-intro-terminal-tranche1-current-js.mjs',
  introGeneratorRun:
    'work/g678-shared-page-factory/g678-alg-l11-intro-terminal-tranche1-current-js-4-v1/run-manifest.json',
  introGeneratedFragment:
    'catalog/product-bridge-calibrations/g678-alg-l11-intro-terminal-tranche1-current-js-4-v1.fragment.json',
  simpleAudit: 'catalog/g678-alg-l11-simple-glossary-tranche1-audit-v1.json',
  simpleAuditRun:
    'work/g678-shared-page-factory/g678-alg-l11-simple-glossary-tranche1-audit-v1/run-manifest.json',
  simpleAuditVerifier:
    'scripts/audit-g678-alg-l11-simple-glossary-tranche1.mjs',
  simpleGenerator:
    'scripts/build-g678-alg-l11-simple-glossary-tranche1-current-js.mjs',
  simpleGeneratorRun:
    'work/g678-shared-page-factory/g678-alg-l11-simple-glossary-tranche1-current-js-8-v1/run-manifest.json',
  simpleGeneratedFragment:
    'catalog/product-bridge-calibrations/g678-alg-l11-simple-glossary-tranche1-current-js-8-v1.fragment.json',
  registrationFinalizer:
    'scripts/finalize-g678-alg-l11-tranche1-registration.mjs',
  registrationFreeze:
    'catalog/product-bridge-calibrations/g678-current-js-354-page-registration-v1.json',
  registrationFragment:
    'catalog/product-bridge-calibrations/g678-current-js-354-page-registration-v1.fragment.json',
  focusedBrowser:
    'output/playwright/g678-alg-l11-tranche1-354-v1/evidence.json',
  focusedBrowserVerifier: 'scripts/qa-g678-alg-l11-tranche1-browser.mjs',
  aggregateBrowser: 'output/playwright/g678-current-js-354-v1/evidence.json',
  aggregateBrowserBuilder:
    'scripts/build-g678-current-js-354-browser-aggregate.mjs',
  successorCompatibilityAudit:
    'catalog/g678-final342-current-bridge-successor-compatibility-v1.json',
  successorCompatibilityVerifier:
    'scripts/audit-g678-final342-current-bridge-successor-compatibility.mjs',
  introHost:
    'packages/demos/src/private-source-static-alg-l11-intro-terminal-candidate.tsx',
  simpleHost:
    'packages/demos/src/private-source-static-alg-l11-simple-glossary-candidate.tsx',
  lessonHostContract: 'packages/demos/src/lesson-host-contract.ts',
  animationRuntime: 'apps/web/components/animation-runtime.tsx',
  descriptorPlayer:
    'apps/web/components/descriptor-driven-whole-lesson-player.tsx',
  glossaryPauseHelper: 'apps/web/lib/descriptor-driven-glossary-pause.ts',
  descriptorPlayerTest:
    'apps/web/tests/descriptor-driven-whole-lesson-player.test.ts',
  glossaryPauseHelperTest:
    'apps/web/tests/descriptor-driven-glossary-pause.test.ts',
  productBridge: 'apps/web/lib/g678-calibration-product-bridge.server.ts',
});
const FALSE_EFFECTS = Object.freeze({
  authoritativeOriginalRuntime: false,
  behaviorAccepted: false,
  visualFidelityAccepted: false,
  audioAccepted: false,
  humanVisualAccepted: false,
  ownerAccepted: false,
  strictComplete: false,
  releaseEligible: false,
  released: false,
  published: false,
});
const PENDING_BLOCKER =
  'alg-l11-tranche1-browser-product-calibration-pending';
const SUCCESSOR_COMPATIBILITY_SHA256 =
  'fbe4fb77634a6fa84fbc7f6a2d486c78e20a0f5641332267f436dd78df81aeb8';
const SUCCESSOR_COMPATIBILITY_BUILDER_SHA256 =
  '55fd9cbb28de3b97510a0f163bc983f2b3171dfc70830f0ec6dfea382c4508ff';

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

const REQUIRED_PREREQUISITE_ENV_KEYS = Object.freeze([
  'HELP_MATH_G678_SOURCE_ROOT', 'PRIVATE_RECOVERY_CONTAINERS',
]);

export function familyPrerequisiteEnvironment(environment) {
  invariant(environment && typeof environment === 'object',
    'family prerequisite environment is required');
  const required = Object.fromEntries(REQUIRED_PREREQUISITE_ENV_KEYS.map(
    (key) => {
      const value = environment[key];
      invariant(typeof value === 'string' && value !== '' &&
        path.isAbsolute(value),
      `${key} is required as an explicit absolute path`);
      return [key, value];
    }));
  return Object.freeze({...required,
    HELP_MATH_G678_QA_BASE_URL: 'http://127.0.0.1:3324'});
}

export function familyPrerequisiteCheckEnvironment(environment) {
  return Object.freeze({...environment,
    ...familyPrerequisiteEnvironment(environment)});
}

function projectPath(relativePath) {
  const target = path.resolve(ROOT, relativePath);
  invariant(target.startsWith(`${ROOT}${path.sep}`),
    `${relativePath} escapes project root`);
  return target;
}

async function binding(relativePath, json = false,
  requireReadOnly = false) {
  const target = projectPath(relativePath);
  const [canonical, before] = await Promise.all([
    realpath(target), lstat(target, {bigint: true}),
  ]);
  invariant(canonical === target && before.isFile() &&
    !before.isSymbolicLink() && before.nlink === 1n &&
    (!requireReadOnly || (before.mode & 0o222n) === 0n),
  `${relativePath} must be one canonical${requireReadOnly ?
      ' read-only' : ''} ordinary single-link file`);
  const buffer = await readFile(target);
  const after = await lstat(target, {bigint: true});
  invariant(before.dev === after.dev && before.ino === after.ino &&
    before.size === after.size && before.mtimeNs === after.mtimeNs &&
    before.mode === after.mode && before.nlink === after.nlink,
  `${relativePath} changed during read`);
  return Object.freeze({path: relativePath, bytes: buffer.length,
    sha256: sha256(buffer), buffer,
    ...(json ? {value: JSON.parse(buffer.toString('utf8'))} : {})});
}

function descriptor(value) {
  return Object.freeze({path: value.path, bytes: value.bytes,
    sha256: value.sha256});
}

function assertDecodedMathDefinitions(intro, simple) {
  const introInequality = intro.terms.find((term) =>
    term.id === 'inequality');
  const inequality = simple.terms.find((term) => term.id === 'inequality');
  const reverse = simple.terms.find((term) => term.id === 'reverse');
  for (const term of [introInequality, inequality, reverse]) {
    invariant(term && !/(?:&#x|&gt;|&lt;)/u.test(
      JSON.stringify(term.definitions)),
    'family calibration found an undecoded glossary entity');
  }
  invariant([introInequality, inequality].every((term) =>
    [term.definitions.en, term.definitions.es].every((definition) =>
      ['<', '≥', '≤', '≠'].every((symbol) => definition.includes(symbol)))) &&
    reverse.definitions.en.includes('x > y') &&
    reverse.definitions.en.includes('greater than (>)') &&
    reverse.definitions.en.includes('less than (<)') &&
    reverse.definitions.es.includes('x > y') &&
    reverse.definitions.es.includes('mayor que (>)') &&
    reverse.definitions.es.includes('menor que (<)'),
  'family calibration mathematical definition contract drifted');
}

async function runCheck(relativePath) {
  const result = await execFileAsync(process.execPath,
    [relativePath, '--check'], {cwd: ROOT,
      env: familyPrerequisiteCheckEnvironment(process.env),
      maxBuffer: 32 * 1024 * 1024});
  invariant(result.stderr === '', `${relativePath} --check emitted stderr`);
  const receipt = JSON.parse(result.stdout);
  invariant(receipt.check === true, `${relativePath} --check did not pass`);
  return receipt;
}

async function expectedArtifact() {
  const checkReceipts = await Promise.all([
    runCheck(PATHS.introAuditVerifier), runCheck(PATHS.introGenerator),
    runCheck(PATHS.simpleAuditVerifier), runCheck(PATHS.simpleGenerator),
    runCheck(PATHS.registrationFinalizer),
    runCheck(PATHS.focusedBrowserVerifier),
    runCheck(PATHS.aggregateBrowserBuilder),
    runCheck(PATHS.successorCompatibilityVerifier),
  ]);
  invariant(checkReceipts[4].registrationCandidatePlacementCount === 354 &&
    checkReceipts[5].registeredCurrentJsPages === 354 &&
    checkReceipts[5].exactPlacementCount === 12 &&
    checkReceipts[5].priorCurrentHostRegressionCount === 2 &&
    checkReceipts[5].historicalInitialProgressedReplayCount === 89 &&
    checkReceipts[5].historicalSpecialReadyCount === 3 &&
    checkReceipts[5].screenshotCount === 15 &&
    checkReceipts[6].registeredCurrentJsPages === 354 &&
    checkReceipts[6].currentHostLiveRecords === 104 &&
    checkReceipts[6].currentHostUniqueSampledModules === 104 &&
    checkReceipts[6].historicalInitialProgressedReplayCount === 89 &&
    checkReceipts[6].historicalSpecialReadyCount === 3 &&
    checkReceipts[6].screenshotCount === 111 &&
    checkReceipts[7].descriptorInvariantCount === 342 &&
    checkReceipts[7].currentHostBrowserRevalidated === false &&
    checkReceipts[7].exactInverseTransformationPassed === true,
  'ALG L11 tranche1 product check receipts drifted');
  const jsonInputs = new Set(['residualAudit', 'introAudit', 'introAuditRun',
    'introGeneratorRun', 'introGeneratedFragment', 'simpleAudit',
    'simpleAuditRun', 'simpleGeneratorRun', 'simpleGeneratedFragment',
    'registrationFreeze', 'registrationFragment', 'focusedBrowser',
    'aggregateBrowser']);
  jsonInputs.add('successorCompatibilityAudit');
  const entries = await Promise.all(Object.entries(PATHS).map(
    async ([key, relativePath]) => [key, await binding(relativePath,
      jsonInputs.has(key))]));
  const inputs = Object.fromEntries(entries);
  const builder = await binding(path.relative(ROOT, SCRIPT_PATH));
  const residual = inputs.residualAudit.value;
  const intro = inputs.introAudit.value;
  const simple = inputs.simpleAudit.value;
  const introRun = inputs.introGeneratorRun.value;
  const introGenerated = inputs.introGeneratedFragment.value;
  const simpleRun = inputs.simpleGeneratorRun.value;
  const simpleGenerated = inputs.simpleGeneratedFragment.value;
  const freeze = inputs.registrationFreeze.value;
  const fragment = inputs.registrationFragment.value;
  const browser = inputs.focusedBrowser.value;
  const aggregate = inputs.aggregateBrowser.value;
  const compatibility = inputs.successorCompatibilityAudit.value;
  const selected = new Map(freeze.selectedPages.map((page) =>
    [page.animationId, page]));
  const exact12 = IDS.map((id) => selected.get(id));
  assertDecodedMathDefinitions(intro, simple);
  invariant(residual.artifactType ===
      'g678-alg-l11-residual-routing-audit-v1' &&
    residual.auditedResidualPlacementCount === 35 &&
    residual.registrationCandidatePlacementCount === 0 &&
    intro.artifactType === 'g678-alg-l11-intro-terminal-tranche1-v1' &&
    intro.scope.exactButtonScripts === 8 && intro.terms.length === 6 &&
    intro.registrationCandidatePlacementCount === 0 &&
    introRun.generatedPlacementCount === 4 &&
    introRun.registryEntriesWritten === 0 &&
    introGenerated.generatedPlacementCount === 4 &&
    introGenerated.currentJavaScriptRegisteredCount === 0 &&
    simple.artifactType ===
      'g678-alg-l11-simple-glossary-tranche1-audit-v1' &&
    simple.scope.exactButtonScripts === 40 && simple.terms.length === 17 &&
    simple.registrationCandidatePlacementCount === 8 &&
    simple.currentJavaScriptRegisteredCount === 0 &&
    simpleRun.generatedPlacementCount === 8 &&
    simpleRun.registryEntriesWritten === 0 &&
    simpleGenerated.generatedPlacementCount === 8 &&
    simpleGenerated.currentJavaScriptRegisteredCount === 0,
  'ALG L11 tranche1 source/generated authority drifted');
  invariant(freeze.registrationCandidatePlacementCount === 354 &&
    freeze.selectedPages.length === 354 && exact12.every(Boolean) &&
    exact12.every((page) => page.productCalibrationPassed === false &&
      page.engineeringPreviewReady === false &&
      page.productBlockers.includes(PENDING_BLOCKER)) &&
    fragment.artifactType === 'private-current-js-calibration-fragment-v1' &&
    fragment.calibration.entries.length === 354 &&
    fragment.calibration.freezeManifest === PATHS.registrationFreeze &&
    exact(fragment.freeze, descriptor(inputs.registrationFreeze)),
  '354 provisional registration evidence drifted');
  const completeLessons = browser.allLessons.exactLessonVector.filter(
    (lesson) => lesson.registeredPageCount === lesson.activePageCount)
    .map((lesson) => lesson.stableLessonKey);
  invariant(browser.artifactType ===
      'g678-alg-l11-tranche1-browser-qa-v1' &&
    browser.registeredCurrentJsPages === 354 &&
    browser.allLessons.sharedCardCount === 44 &&
    browser.allLessons.linkedCardCount === 0 &&
    browser.allLessons.registeredPageSum === 354 &&
    exact(completeLessons, ['shared-alg001-l09']) &&
    exact(browser.allLessons.algL09,
      {registeredPageCount: 41, activePageCount: 41, complete: true}) &&
    exact(browser.allLessons.algL11,
      {registeredPageCount: 21, activePageCount: 44, complete: false}) &&
    browser.introTerminal.placementCount === 4 &&
    browser.introTerminal.exactGlossaryButtonCount === 8 &&
    browser.introTerminal.recoveredGlossaryTermCount === 6 &&
    browser.introTerminal.introFrameAdvancePassed === true &&
    browser.introTerminal.terminalAndAbsenceWindowsPassed === true &&
    browser.introTerminal.exactUnicodeInequalityDefinitionVisible === true &&
    browser.introTerminal.typedHostOpenPauseCloseFocusPassed === true &&
    browser.introTerminal.replayResetPassed === true &&
    browser.simpleGlossary.placementCount === 8 &&
    browser.simpleGlossary.exactGlossaryButtonCount === 40 &&
    browser.simpleGlossary.recoveredGlossaryTermCount === 17 &&
    browser.simpleGlossary
      .exactUnicodeInequalityAndReverseDefinitionsVisible === true &&
    browser.simpleGlossary.absoluteValueCollisionResolutionVisible === true &&
    browser.simpleGlossary.companionPortalPassed === true &&
    browser.simpleGlossary.typedHostOpenPauseCloseFocusPassed === true &&
    browser.simpleGlossary.replayResetPassed === true &&
    browser.glossaryPauseTransitions.liveRunningOpenCloseResultCount === 11 &&
    browser.glossaryPauseTransitions.liveInspectedOpenCloseResultCount ===
      37 && browser.glossaryPauseTransitions
      .runningOpenPausesAndCloseResumesLivePassed === true &&
    browser.glossaryPauseTransitions
      .inspectedOpenCloseRemainsPausedLivePassed === true &&
    browser.glossaryPauseTransitions
      .inspectedSeekFrameAndInspectionIdentityLivePassed === true &&
    browser.glossaryPauseTransitions
      .inspectedNextSeekWithoutNormalizationLivePassed === true &&
    browser.glossaryPauseTransitions.replayResetLivePassed === true &&
    browser.glossaryPauseTransitions
      .blockedAndNestedSnapshotHashBoundStaticContract === true &&
    browser.glossaryPauseTransitions
      .navigationAndResetHashBoundStaticContract === true &&
    browser.glossaryPauseTransitions
      .fullBlockedAndNestedBrowserCoverageClaimed === false &&
    browser.glossaryPauseTransitions
      .fullNavigationResetBrowserCoverageClaimed === false &&
    browser.priorCurrentHostGlossaryRegressions.placementCount === 2 &&
    browser.priorCurrentHostGlossaryRegressions
      .exactUnicodeInequalityDefinitionVisible === true &&
    browser.priorCurrentHostGlossaryRegressions
      .typedHostPauseCloseFocusPassed === true &&
    browser.priorCurrentHostGlossaryRegressions.replayResetPassed === true &&
    browser.priorCurrentHostGlossaryRegressions
      .inlineLegacyPresentationReplayCount === 2 &&
    browser.priorCurrentHostGlossaryRegressions
      .companionPresentationClaimed === false &&
    browser.priorCurrentHostGlossaryRegressions.pages.every((page) =>
      page.replayState.inlineLegacyPresentation === true &&
      page.replayState.notCompanion === true &&
      page.replayState.replayStateResetPassed === true) &&
    browser.priorCurrentHostGlossaryRegressions
      .currentHostPriorCalibratedCoverageClaimed === false &&
    browser.currentHostPredecessorReplay
      .currentHostPredecessorSampleReplayCount === 92 &&
    browser.currentHostPredecessorReplay
      .uniqueCurrentHostPredecessorModuleCount === 92 &&
    browser.currentHostPredecessorReplay
      .historicalInitialProgressedReplayCount === 89 &&
    browser.currentHostPredecessorReplay.historicalSpecialReadyCount === 3 &&
    exact(browser.currentHostPredecessorReplay.historicalSpecialReadyIds, [
      'shared-alg001-l09-p030', 'shared-alg001-l09-p031',
      'shared-alg001-l09-p041']) && browser.currentHostPredecessorReplay
      .fullHistoricalSpecialInteractionReplay === false &&
    browser.currentHostPredecessorReplay.currentHostBrowserRevalidated ===
      true && browser.currentHostPredecessorReplay.results.length === 92 &&
    browser.successorBridgeCompatibility.predecessorCompatibilityRebound ===
      true && browser.successorBridgeCompatibility
      .changedSurfaceBrowserRevalidated === true &&
    browser.successorBridgeCompatibility.currentHostBrowserRevalidated ===
      true && browser.successorBridgeCompatibility.fullPrior126Replay ===
      false && exact(browser.inputs.successorCompatibilityAudit,
      descriptor(inputs.successorCompatibilityAudit)) &&
    browser.requestPolicy.allObservedRequestsLoopback === true &&
    browser.requestPolicy.allObservedRequestsExplicitlyAllowed === true &&
    browser.requestPolicy.legacyNetworkOperationsObserved === 0 &&
    browser.screenshots.length === 15 &&
    exact(browser.inputs.freeze, descriptor(inputs.registrationFreeze)) &&
    exact(browser.inputs.script, descriptor(inputs.focusedBrowserVerifier)) &&
    exact(browser.inputs.productBridge, descriptor(inputs.productBridge)) &&
    exact(browser.acceptanceEffects, FALSE_EFFECTS),
  'ALG L11 tranche1 focused browser authority drifted');
  invariant(aggregate.artifactType ===
      'g678-current-js-354-browser-qa-v1' &&
    aggregate.registeredCurrentJsPages === 354 &&
    aggregate.samples.length === 104 && aggregate.screenshots.length === 111 &&
    aggregate.browserEvidenceComposition
      .historicalPredecessorLiveRecordCount === 92 &&
    aggregate.browserEvidenceComposition
      .currentHostPredecessorSampleReplayCount === 92 &&
    aggregate.browserEvidenceComposition
      .currentHostHistoricalInitialProgressedReplayCount === 89 &&
    aggregate.browserEvidenceComposition
      .currentHostHistoricalSpecialReadyCount === 3 &&
    aggregate.browserEvidenceComposition
      .fullHistoricalSpecialInteractionReplay === false &&
    aggregate.browserEvidenceComposition
      .currentHostNewPlacementSampleCount === 12 &&
    aggregate.browserEvidenceComposition
      .currentHostChangedSurfaceRegressionCount === 2 &&
    aggregate.browserEvidenceComposition.currentHostLiveRecordCount === 104 &&
    aggregate.browserEvidenceComposition
      .currentHostUniqueSampledModuleCount === 104 &&
    aggregate.browserEvidenceComposition.predecessorCompatibilityRebound ===
      true && aggregate.browserEvidenceComposition
      .changedSurfaceBrowserRevalidated === true &&
    aggregate.browserEvidenceComposition.currentHostBrowserRevalidated ===
      true && aggregate.browserEvidenceComposition.fullPrior126Replay ===
      false && aggregate.browserEvidenceComposition
      .glossaryPauseTransitionsBrowserRevalidated === true &&
    aggregate.browserEvidenceComposition
      .fullBlockedAndNestedBrowserCoverageClaimed === false &&
    aggregate.browserEvidenceComposition
      .fullNavigationResetBrowserCoverageClaimed === false &&
    aggregate.browserEvidenceComposition.noSyntheticBrowserExecutionClaim ===
      true && exact(aggregate.inputs.incremental,
      descriptor(inputs.focusedBrowser)) &&
    exact(aggregate.inputs.successorCompatibility,
      descriptor(inputs.successorCompatibilityAudit)) &&
    exact(aggregate.inputs.freeze, descriptor(inputs.registrationFreeze)) &&
    exact(aggregate.acceptanceEffects, FALSE_EFFECTS),
  '354 aggregate browser authority drifted');
  invariant(compatibility.artifactType ===
      'g678-final342-current-bridge-successor-compatibility-v1' &&
    compatibility.exactInverseTransformation.exactMatch === true &&
    compatibility.exactInverseTransformation.otherBridgeChangesDetected ===
      false &&
    compatibility.final342Compatibility.descriptorInvariantCount === 342 &&
    compatibility.final342Compatibility
      .currentBridgeStaticCompatibilityEstablished === true &&
    compatibility.final342Compatibility.currentHostBrowserRevalidated ===
      false && compatibility.requiredProvisional354BrowserAssertions
      .predecessorSamplesMustBeReplayed === true &&
    exact(compatibility.requiredProvisional354BrowserAssertions
      .glossaryPauseTransitions, {
      runningOpenCloseResumes: true,
      inspectedOpenCloseRemainsPaused: true,
      inspectedSeekRequestIdentityPreserved: true,
      blockedAndNestedRequestsMustNotOverwriteSnapshot: true,
      navigationReplayAndResetMustClearSnapshot: true,
    }) && exact(compatibility.inputs.currentDescriptorPlayer,
      descriptor(inputs.descriptorPlayer)) &&
    exact(compatibility.inputs.currentGlossaryPauseHelper,
      descriptor(inputs.glossaryPauseHelper)) &&
    exact(compatibility.inputs.currentDescriptorPlayerTest,
      descriptor(inputs.descriptorPlayerTest)) &&
    exact(compatibility.inputs.currentGlossaryPauseHelperTest,
      descriptor(inputs.glossaryPauseHelperTest)) &&
    inputs.successorCompatibilityAudit.sha256 ===
      SUCCESSOR_COMPATIBILITY_SHA256 &&
    inputs.successorCompatibilityVerifier.sha256 ===
      SUCCESSOR_COMPATIBILITY_BUILDER_SHA256 &&
    exact(compatibility.inputs.builder,
      descriptor(inputs.successorCompatibilityVerifier)),
  'successor compatibility authority drifted');
  const absoluteValue = simple.terms.find((term) =>
    term.id === 'absolute-value');
  invariant(absoluteValue?.sourceCollisionResolution.sourceEntryCounts.en === 2 &&
    absoluteValue.sourceCollisionResolution.sourceEntryCounts.es === 2 &&
    exact(absoluteValue.sourceCollisionResolution.rejectedMismatchedEntries.en
      .map((entry) => entry.elementLabel), ['Accurate']) &&
    exact(absoluteValue.sourceCollisionResolution.rejectedMismatchedEntries.es
      .map((entry) => entry.elementLabel), ['Accurate']),
  'Absolute Value source collision resolution drifted');
  return Object.freeze({schemaVersion: 1,
    artifactType: 'g678-alg-l11-tranche1-family-calibration-v1',
    calibrationId: 'g678-alg-l11-tranche1-family-calibration-v1',
    status: 'exact-12-alg-l11-intro-terminal-simple-glossary-product-host-calibrated',
    adapterFamilies: Object.freeze([
      'alg-l11-intro-terminal-tranche1-source-static',
      'alg-l11-simple-glossary-tranche1-source-static',
    ]),
    inputs: Object.freeze({...Object.fromEntries(entries.map(([key, value]) =>
      [key, descriptor(value)])), builder: descriptor(builder)}),
    auditedPlacementCount: 12,
    authorizedPlacementIds: IDS,
    blockedPlacementCount: 0,
    introTerminalPlacementCount: 4,
    simpleGlossaryPlacementCount: 8,
    introTerminalExactButtonCount: 8,
    simpleGlossaryExactButtonCount: 40,
    introTerminalRecoveredTermCount: 6,
    simpleGlossaryRecoveredTermCount: 17,
    focusedBrowserScreenshotCount: 15,
    priorCurrentHostGlossaryRegressionCount: 2,
    currentHostPredecessorSampleReplayCount: 92,
    currentHostHistoricalInitialProgressedReplayCount: 89,
    currentHostHistoricalSpecialReadyCount: 3,
    fullHistoricalSpecialInteractionReplay: false,
    aggregateCurrentHostLiveSampleRecordCount: 104,
    aggregateCurrentHostUniqueSampledModuleCount: 104,
    aggregateBrowserScreenshotCount: 111,
    productHostCalibration: Object.freeze({
      allTwelveCanvasFirstMiddleLastReady: true,
      introFrameAdvancePassed: true,
      terminalAndAbsenceWindowsPassed: true,
      exactFortyEightGlossaryButtonsPassed: true,
      exactUnicodeInequalityAndReverseDefinitionsPassed: true,
      absoluteValueCollisionResolutionPassed: true,
      typedGlossaryHostOpenPauseCloseFocusPassed: true,
      runningGlossaryOpenCloseResumeLivePassed: true,
      inspectedGlossaryOpenClosePausePreservedLivePassed: true,
      inspectedSeekFrameAndInspectionIdentityLivePassed: true,
      inspectedNextSeekWithoutNormalizationLivePassed: true,
      seekRequestObjectIdentityHashBoundStaticTest: true,
      blockedAndNestedSnapshotHashBoundStaticContract: true,
      navigationAndResetHashBoundStaticContract: true,
      fullBlockedAndNestedBrowserCoverageClaimed: false,
      fullNavigationResetBrowserCoverageClaimed: false,
      companionPortalPassed: true,
      replayResetPassed: true,
      priorP005AndP012CurrentHostGlossaryRegressionPassed: true,
      priorP005AndP012InlineLegacyPresentation: true,
      priorP005AndP012CompanionPresentationClaimed: false,
      predecessorCompatibilityRebound: true,
      changedSurfaceBrowserRevalidated: true,
      currentHostBrowserRevalidated: true,
      predecessorHistoricalFramePairsReplayed: 89,
      predecessorHistoricalSpecialReadyOnly: 3,
      fullHistoricalSpecialInteractionReplay: false,
      fullPrior126Replay: false,
      allObservedRequestsLoopback: true,
      allObservedRequestsExplicitlyAllowed: true,
      allLegacyNetworkOperationsBlocked: true,
      localAssetIntegrityAndCrossOriginIsolation: true,
      allLessonsOneCompleteRegistrationTruthful: true,
      algL09Complete41Of41: true,
      algL11Partial21Of44: true,
      familyCurrentJsCalibrationPassed: true,
      overallG678ProductCalibrationPassed: false,
    }),
    authorization: Object.freeze({authorized: true,
      scope: 'exact-12-alg-l11-tranche1-placements-only',
      permitsOtherG678Placements: false,
      permitsOriginalRuntimeOrVisualFidelityClaim: false,
      permitsAudioAcceptance: false,
      permitsHumanOrOwnerAcceptance: false,
      permitsStrictCompletion: false,
      permitsReleaseOrPublication: false}),
    acceptanceEffects: FALSE_EFFECTS,
    limitations: Object.freeze([
      'This authority calibrates only the exact twelve ALG001 L11 tranche1 placements through the private modern My Lesson host.',
      'Canvas execution and typed glossary behavior are current-JS product evidence, not authoritative original-runtime or visual-fidelity evidence.',
      'Embedded and external narration audio remains unaccepted; no browser audio silence or asset integrity result is listening acceptance.',
      'Legacy glossary sublinks and example SWFs remain intentionally unimplemented and do not gain authority from this family calibration.',
      'Blocked, nested, navigation, and reset glossary-session paths remain hash-bound static helper-test contracts; this artifact does not claim full live-browser coverage of those paths.',
      'The three historical ALG L9 p030, p031, and p041 records receive fresh current-host Canvas-ready smoke only; their complete game or assessment interactions are not replayed or newly claimed.',
      'Human, Owner, strict completion, release, and publication gates remain false.',
    ])});
}

export async function buildG678AlgL11Tranche1FamilyCalibration(
  {check = false} = {},
) {
  const artifact = await expectedArtifact();
  const bytes = stableBytes(artifact);
  if (check) {
    const current = await binding(OUTPUT, false, true);
    invariant(current.buffer.equals(bytes),
      'ALG L11 tranche1 family calibration drifted');
  } else {
    const target = projectPath(OUTPUT);
    invariant(!await lstat(target).then(() => true, () => false),
      `${OUTPUT} already exists`);
    const temporary = `${target}.staging-${process.pid}-${Date.now()}`;
    await writeFile(temporary, bytes, {flag: 'wx', mode: 0o444});
    await chmod(temporary, 0o444);
    try {
      await link(temporary, target);
    } finally {
      await unlink(temporary).catch(() => {});
    }
  }
  return Object.freeze({check, output: OUTPUT, bytes: bytes.length,
    sha256: sha256(bytes), status: artifact.status,
    authorizedPlacementCount: 12, productHostCalibrationPassed: true,
    acceptanceEffects: artifact.acceptanceEffects});
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  const args = process.argv.slice(2);
  invariant(args.length <= 1 && (args.length === 0 || args[0] === '--check'),
    'usage: build-g678-alg-l11-tranche1-family-calibration.mjs [--check]');
  buildG678AlgL11Tranche1FamilyCalibration({check: args[0] === '--check'})
    .then((result) => process.stdout.write(`${JSON.stringify(result, null, 2)}\n`))
    .catch((error) => {
      process.stderr.write(`${error.stack ?? error.message}\n`);
      process.exitCode = 1;
    });
}
