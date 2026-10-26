#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {lstat, mkdir, readFile, realpath, rename, writeFile} from
  'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {chromium} from 'playwright';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
const BASE = process.env.HELP_MATH_G678_QA_BASE_URL ??
  'http://127.0.0.1:3324';
const PARSED_BASE = new URL(BASE);
const OUTPUT = 'output/playwright/g678-alg-l11-tranche1-354-v1';
const INTRO_IDS = Object.freeze([
  'shared-alg001-l11-p001',
  'shared-alg001-l11-p002',
  'shared-alg001-l11-p003',
  'shared-alg001-l11-p004',
]);
const SIMPLE_IDS = Object.freeze([
  'shared-alg001-l11-p007',
  'shared-alg001-l11-p013',
  'shared-alg001-l11-p016',
  'shared-alg001-l11-p017',
  'shared-alg001-l11-p018',
  'shared-alg001-l11-p022',
  'shared-alg001-l11-p023',
  'shared-alg001-l11-p024',
]);
const IDS = Object.freeze([...INTRO_IDS, ...SIMPLE_IDS]);
const PRIOR_HOST_REGRESSION_IDS = Object.freeze([
  'shared-alg001-l11-p005',
  'shared-alg001-l11-p012',
]);
const PRIOR_READY_ONLY_IDS = Object.freeze([
  'shared-alg001-l09-p030',
  'shared-alg001-l09-p031',
  'shared-alg001-l09-p041',
]);
const PENDING_BLOCKER =
  'alg-l11-tranche1-browser-product-calibration-pending';
const SUCCESSOR_COMPATIBILITY_SHA256 =
  'fbe4fb77634a6fa84fbc7f6a2d486c78e20a0f5641332267f436dd78df81aeb8';
const SUCCESSOR_COMPATIBILITY_BUILDER_SHA256 =
  '55fd9cbb28de3b97510a0f163bc983f2b3171dfc70830f0ec6dfea382c4508ff';
const PROVISIONAL_BINDINGS = Object.freeze({
  freeze: 'f17969295b87889c2e150ab259ad153f6fb8a0a3a890dd94582b3cc06e70ad3b',
  fragment: 'ee988a349187688c664323ae0886f590dfe42f71ad7e30744050343c7013b76f',
  privateRegistry:
    '60f413683526a127784f580c5eeb0b494b0c5abbf48972bd94435a383b94682c',
  localLoader:
    'e327ca0508508e170ad8e59e1fcd3bf51150cfadb1febc0188222fc64b5df662',
  localRegistry:
    '8aa8bde7c06a6662672bd66aaedf67e4950222b12ddbefb0cef64483a4128009',
  registrationFinalizer:
    'dd9e9658e7a78adb64364586546362240e1041413010c51004e74232369131d2',
  productBridge:
    '00b14152cce3b84293fbd14ebe6390b254cfd22c208857c1c6618dcae8630166',
  descriptorPlayer:
    '3f7abe7329f0f9fb1a0563fa43101f387b562b0a8e5575f48ca75a3973960141',
  glossaryPauseHelper:
    'd97ad79c6e98d3ce960bd51d2103ee76761e363ca328295723d21dd7f9836aa4',
  descriptorPlayerTest:
    '289b05137bdcb466dbc2d346114973f8f9dc00deac9484956c1a77888772f93b',
  glossaryPauseHelperTest:
    'a15b9c53e0dbdff7322402b2e8c6f6925eda477de260f5b23319581418a2ff02',
});
const PATHS = Object.freeze({
  freeze:
    'catalog/product-bridge-calibrations/g678-current-js-354-page-registration-v1.json',
  fragment:
    'catalog/product-bridge-calibrations/g678-current-js-354-page-registration-v1.fragment.json',
  catalog: 'catalog/g678-shared-catalog.v1.json',
  residualAudit: 'catalog/g678-alg-l11-residual-routing-audit-v1.json',
  introAudit: 'catalog/g678-alg-l11-intro-terminal-tranche1-v1.json',
  simpleAudit: 'catalog/g678-alg-l11-simple-glossary-tranche1-audit-v1.json',
  vb02Audit: 'catalog/g678-vb02-l1-family-audit-v1.json',
  in02Audit: 'catalog/g678-in02-l1-family-audit-v1.json',
  successorCompatibilityAudit:
    'catalog/g678-final342-current-bridge-successor-compatibility-v1.json',
  successorCompatibilityVerifier:
    'scripts/audit-g678-final342-current-bridge-successor-compatibility.mjs',
  final342AggregateBrowserEvidence:
    'output/playwright/g678-current-js-342-v1/evidence.json',
  introGeneratedFragment:
    'catalog/product-bridge-calibrations/g678-alg-l11-intro-terminal-tranche1-current-js-4-v1.fragment.json',
  simpleGeneratedFragment:
    'catalog/product-bridge-calibrations/g678-alg-l11-simple-glossary-tranche1-current-js-8-v1.fragment.json',
  registrationFinalizer:
    'scripts/finalize-g678-alg-l11-tranche1-registration.mjs',
  introHost:
    'packages/demos/src/private-source-static-alg-l11-intro-terminal-candidate.tsx',
  simpleHost:
    'packages/demos/src/private-source-static-alg-l11-simple-glossary-candidate.tsx',
  sourceStaticHost: 'packages/demos/src/source-static-canvas-candidate.tsx',
  lessonHostContract: 'packages/demos/src/lesson-host-contract.ts',
  animationContract: 'packages/demos/src/contract.ts',
  animationRuntime: 'apps/web/components/animation-runtime.tsx',
  descriptorPlayer:
    'apps/web/components/descriptor-driven-whole-lesson-player.tsx',
  glossaryPauseHelper: 'apps/web/lib/descriptor-driven-glossary-pause.ts',
  descriptorPlayerTest:
    'apps/web/tests/descriptor-driven-whole-lesson-player.test.ts',
  glossaryPauseHelperTest:
    'apps/web/tests/descriptor-driven-glossary-pause.test.ts',
  productBridge: 'apps/web/lib/g678-calibration-product-bridge.server.ts',
  launcher: 'scripts/run-g678-local-preview.mjs',
  privateRegistry: 'packages/demos/private-current-js-registry.json',
  localLoader: 'packages/demos/src/registry.local-only.generated.ts',
  localRegistry:
    'packages/demos/src/registry.local-only.metadata.generated.ts',
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
const LEGACY_NETWORK_OPERATION =
  /(?:^|[\/_?&=.-])(?:geturl|fscommand|bookmark|report(?:_url)?|download|loadvariables(?:num)?|xml[-_]?send|final[-_]?quiz[-_]?post|external[-_]?interface|shared[-_]?object(?:[-_]?persist)?)(?:$|[\/_?&=.-])/iu;

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

invariant(PARSED_BASE.protocol === 'http:' &&
  PARSED_BASE.hostname === '127.0.0.1' && PARSED_BASE.username === '' &&
  PARSED_BASE.password === '' && PARSED_BASE.pathname === '/' &&
  PARSED_BASE.search === '' && PARSED_BASE.hash === '',
'ALG L11 tranche1 QA base must be one loopback HTTP origin');

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function stableBytes(value) {
  return Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
}

function exact(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

const REQUEST_POLICY_INPUT_KEYS = Object.freeze([
  'observedRequestCount', 'allRequestsLoopback',
  'unallowlistedRequestCount', 'legacyNetworkOperationCount',
]);

export function requestPolicyReceipt(input) {
  invariant(exact(Object.keys(input), REQUEST_POLICY_INPUT_KEYS) &&
    Number.isInteger(input.observedRequestCount) &&
      input.observedRequestCount > 0 &&
    typeof input.allRequestsLoopback === 'boolean' &&
    Number.isInteger(input.unallowlistedRequestCount) &&
      input.unallowlistedRequestCount >= 0 &&
    Number.isInteger(input.legacyNetworkOperationCount) &&
      input.legacyNetworkOperationCount >= 0,
  'request policy receipt input drifted');
  return Object.freeze({observedRequestCount: input.observedRequestCount,
    allObservedRequestsLoopback: input.allRequestsLoopback,
    allObservedRequestsExplicitlyAllowed:
      input.unallowlistedRequestCount === 0,
    legacyNetworkOperationsObserved: input.legacyNetworkOperationCount});
}

function projectPath(relativePath) {
  const target = path.resolve(ROOT, relativePath);
  invariant(target.startsWith(`${ROOT}${path.sep}`),
    `${relativePath} escapes project root`);
  return target;
}

async function binding(relativePath, json = false) {
  const target = projectPath(relativePath);
  const [canonical, before] = await Promise.all([
    realpath(target), lstat(target, {bigint: true}),
  ]);
  invariant(canonical === target && before.isFile() &&
    !before.isSymbolicLink() && before.nlink === 1n,
  `${relativePath} must be one canonical ordinary single-link file`);
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

async function externalBinding(target) {
  const resolved = path.resolve(target);
  const [canonical, before] = await Promise.all([
    realpath(resolved), lstat(resolved, {bigint: true}),
  ]);
  invariant(canonical === resolved && before.isFile() &&
    !before.isSymbolicLink(),
  'Chromium executable must be one canonical ordinary file');
  const buffer = await readFile(resolved);
  const after = await lstat(resolved, {bigint: true});
  invariant(before.dev === after.dev && before.ino === after.ino &&
    before.size === after.size && before.mtimeNs === after.mtimeNs,
  'Chromium executable changed during read');
  return Object.freeze({path: resolved, bytes: buffer.length,
    sha256: sha256(buffer), buffer});
}

function descriptor(value, pathOverride = value.path) {
  return Object.freeze({path: pathOverride, bytes: value.bytes,
    sha256: value.sha256});
}

function recordsById(audit) {
  return new Map(audit.records.map((record) =>
    [record.animationId, record]));
}

function termById(audit, id) {
  return audit.terms.find((term) => term.id === id);
}

export function assertDecodedMathDefinitions(introAudit, simpleAudit) {
  const forbidden = /(?:&#x|&gt;|&lt;)/u;
  const introInequality = termById(introAudit, 'inequality');
  const simpleInequality = termById(simpleAudit, 'inequality');
  const reverse = termById(simpleAudit, 'reverse');
  for (const term of [introInequality, simpleInequality, reverse]) {
    invariant(term && !forbidden.test(JSON.stringify(term.definitions)),
      `${term?.id ?? 'required term'} has unresolved source entities`);
  }
  for (const definition of [introInequality.definitions.en,
    introInequality.definitions.es, simpleInequality.definitions.en,
    simpleInequality.definitions.es]) {
    invariant(['<', '≥', '≤', '≠'].every((symbol) =>
      definition.includes(symbol)),
    'Inequality definition lost a required Unicode mathematical symbol');
  }
  invariant(reverse.definitions.en.includes('x > y') &&
    reverse.definitions.en.includes('greater than (>)') &&
    reverse.definitions.en.includes('less than (<)') &&
    reverse.definitions.es.includes('x > y') &&
    reverse.definitions.es.includes('mayor que (>)') &&
    reverse.definitions.es.includes('menor que (<)'),
  'Reverse definition lost its exact greater-than/less-than content');
}

export function exactPredecessorSampleIds(predecessorBrowser,
  compatibility) {
  const ids = predecessorBrowser.samples?.map((sample) => sample.animationId);
  invariant(predecessorBrowser.artifactType ===
      'g678-current-js-342-browser-qa-v1' &&
    predecessorBrowser.registeredCurrentJsPages === 342 &&
    ids?.length === 92 && new Set(ids).size === 92 &&
    compatibility.requiredProvisional354BrowserAssertions
      .predecessorSamplesMustBeReplayed === true &&
    PRIOR_HOST_REGRESSION_IDS.every((id) => ids.includes(id)),
  'final342 predecessor browser sample authority drifted');
  return Object.freeze(ids);
}

export function historicalReplayFrameTargets(sample) {
  invariant(Number.isInteger(sample.initialFrame) &&
    Number.isInteger(sample.progressedFrame) &&
    Number.isInteger(sample.frameCount) && sample.initialFrame > 0 &&
    sample.initialFrame < sample.progressedFrame &&
    sample.progressedFrame <= sample.frameCount &&
    typeof sample.frameDomain === 'string' &&
    /^[a-f0-9]{64}$/u.test(sample.runtimeSha256),
  `${sample.animationId} historical replay frame authority drifted`);
  return Object.freeze([sample.initialFrame, sample.progressedFrame]);
}

export function assertExactHistoricalReplayFrames(sample, smokeFrames) {
  invariant(exact(smokeFrames.map((frame) => frame.frame),
    historicalReplayFrameTargets(sample)),
  `${sample.animationId} historical replay frame set drifted`);
  return true;
}

export function exactPredecessorReplayPlan(predecessorBrowser,
  compatibility) {
  exactPredecessorSampleIds(predecessorBrowser, compatibility);
  const historicalFrameSamples = [];
  const specialReadySamples = [];
  for (const sample of predecessorBrowser.samples) {
    if (Number.isInteger(sample.initialFrame) &&
        Number.isInteger(sample.progressedFrame)) {
      historicalReplayFrameTargets(sample);
      historicalFrameSamples.push(sample);
    } else {
      specialReadySamples.push(sample);
    }
  }
  invariant(historicalFrameSamples.length === 89 &&
    specialReadySamples.length === 3 &&
    exact(specialReadySamples.map((sample) => sample.animationId),
      PRIOR_READY_ONLY_IDS) &&
    historicalFrameSamples.some((sample) =>
      sample.animationId === 'shared-nms002-l01-p043' &&
      exact(historicalReplayFrameTargets(sample), [6, 7])),
  'final342 predecessor replay partition drifted');
  return Object.freeze({historicalFrameSamples:
    Object.freeze(historicalFrameSamples),
  specialReadySamples: Object.freeze(specialReadySamples)});
}

export function assertExactCurrentHostReplaySet(expectedIds, results) {
  invariant(expectedIds.length === 92 && new Set(expectedIds).size === 92 &&
    results.length === 92 && results.every(Boolean) &&
    exact(results.map((result) => result.animationId), expectedIds) &&
    new Set(results.map((result) => result.animationId)).size === 92,
  'current-host predecessor sample replay set drifted');
  return true;
}

function lessonVector(catalog, freeze) {
  const counts = new Map();
  for (const page of freeze.selectedPages) counts.set(page.stableLessonKey,
    (counts.get(page.stableLessonKey) ?? 0) + 1);
  const vector = catalog.lessons.map((lesson) => Object.freeze({
    stableLessonKey: lesson.stableLessonKey,
    moduleCode: lesson.moduleCode,
    lessonNumber: lesson.lessonNumber,
    activePageCount: lesson.pages.length,
    registeredPageCount: counts.get(lesson.stableLessonKey) ?? 0,
  }));
  const l9 = vector.find((lesson) =>
    lesson.stableLessonKey === 'shared-alg001-l09');
  const l11 = vector.find((lesson) =>
    lesson.stableLessonKey === 'shared-alg001-l11');
  invariant(vector.length === 44 &&
    vector.reduce((sum, item) => sum + item.registeredPageCount, 0) === 354 &&
    vector.filter((item) =>
      item.registeredPageCount === item.activePageCount).length === 1 &&
    l9?.registeredPageCount === 41 && l9.activePageCount === 41 &&
    l11?.registeredPageCount === 21 && l11.activePageCount === 44,
  '354 exact lesson vector drifted');
  return Object.freeze(vector);
}

function validateInputs(values) {
  const freeze = values.freeze.value;
  const fragment = values.fragment.value;
  const residual = values.residualAudit.value;
  const intro = values.introAudit.value;
  const simple = values.simpleAudit.value;
  const introGenerated = values.introGeneratedFragment.value;
  const simpleGenerated = values.simpleGeneratedFragment.value;
  const vb02 = values.vb02Audit.value;
  const in02 = values.in02Audit.value;
  const compatibility = values.successorCompatibilityAudit.value;
  const predecessorBrowser = values.final342AggregateBrowserEvidence.value;
  const registry = values.privateRegistry.value;
  const introRecords = recordsById(intro);
  const simpleRecords = recordsById(simple);
  const vb02Record = recordsById(vb02).get(PRIOR_HOST_REGRESSION_IDS[0]);
  const in02Record = recordsById(in02).get(PRIOR_HOST_REGRESSION_IDS[1]);
  const selected = new Map(freeze.selectedPages.map((page) =>
    [page.animationId, page]));
  invariant(Object.entries(PROVISIONAL_BINDINGS).every(([key, expected]) =>
    values[key]?.sha256 === expected),
  'provisional354 exact file binding drifted');
  const registryCalibration = registry.calibrations?.find((calibration) =>
    calibration.freezeManifest === PATHS.freeze);
  invariant(freeze.registrationCandidatePlacementCount === 354 &&
    freeze.selectedPages.length === 354 &&
    fragment.artifactType === 'private-current-js-calibration-fragment-v1' &&
    fragment.calibration?.entries?.length === 354 &&
    fragment.calibration.freezeManifest === PATHS.freeze &&
    exact(fragment.freeze, descriptor(values.freeze)) &&
    exact(freeze.inputs.algL11ResidualRoutingAudit,
      descriptor(values.residualAudit)) &&
    exact(freeze.inputs.algL11IntroTerminalAudit,
      descriptor(values.introAudit)) &&
    exact(freeze.inputs.algL11SimpleGlossaryAudit,
      descriptor(values.simpleAudit)) &&
    exact(freeze.inputs.algL11IntroTerminalGeneratedFragment,
      descriptor(values.introGeneratedFragment)) &&
    exact(freeze.inputs.algL11SimpleGlossaryGeneratedFragment,
      descriptor(values.simpleGeneratedFragment)) &&
    exact(freeze.inputs.finalizer, descriptor(values.registrationFinalizer)) &&
    freeze.inputs.predecessorFreeze?.sha256 ===
      '45b0710e0808f31b8b8d1658ca98288903be5e888085b8a1c34803a235372bab' &&
    registryCalibration?.entries?.length === 354 &&
    residual.artifactType === 'g678-alg-l11-residual-routing-audit-v1' &&
    residual.auditedResidualPlacementCount === 35 &&
    residual.registrationCandidatePlacementCount === 0,
  '354 provisional/residual authority drifted');
  invariant(intro.artifactType ===
      'g678-alg-l11-intro-terminal-tranche1-v1' &&
    intro.status ===
      'exact-4-intro-rw-script-text-keyterm-audio-audit-unregistered-engineering-candidate' &&
    intro.scope?.selectedAlgL11IntroTerminalTranche1Placements === 4 &&
    intro.scope?.exactButtonScripts === 8 && intro.terms?.length === 6 &&
    intro.registrationCandidatePlacementCount === 0 &&
    exact([...introRecords.keys()], INTRO_IDS),
  'ALG L11 intro-terminal authority drifted');
  invariant(simple.artifactType ===
      'g678-alg-l11-simple-glossary-tranche1-audit-v1' &&
    simple.status ===
      'exact-8-source-script-text-keyterm-audit-unregistered-candidate' &&
    simple.scope?.selectedAlgL11SimpleGlossaryPlacements === 8 &&
    simple.scope?.exactButtonScripts === 40 && simple.terms?.length === 17 &&
    simple.registrationCandidatePlacementCount === 8 &&
    simple.currentJavaScriptRegisteredCount === 0 &&
    exact([...simpleRecords.keys()], SIMPLE_IDS),
  'ALG L11 simple-glossary authority drifted');
  invariant(vb02.artifactType === 'g678-vb02-l1-family-audit-v1' &&
    vb02Record?.structure.mainFrameCount === 602 &&
    vb02Record.behavior.buttons.some((button) =>
      button.sourceKeyAttribute === 'Inequality' &&
      button.firstFrame === 117) &&
    in02.artifactType === 'g678-in02-l1-family-audit-v1' &&
    in02Record?.structure.mainFrameCount === 668 &&
    in02Record.behavior.buttons.some((button) =>
      button.sourceKeyAttribute === 'Inequality' &&
      button.firstFrame === 247),
  'prior ALG L11 glossary regression authority drifted');
  invariant(compatibility.artifactType ===
      'g678-final342-current-bridge-successor-compatibility-v1' &&
    compatibility.status ===
      'exact-successor-transformation-and-static-compatibility-browser-revalidation-required' &&
    compatibility.final342Compatibility.descriptorInvariantCount === 342 &&
    compatibility.final342Compatibility
      .currentBridgeStaticCompatibilityEstablished === true &&
    compatibility.final342Compatibility.currentHostBrowserRevalidated ===
      false && compatibility.exactInverseTransformation.exactMatch === true &&
    compatibility.exactInverseTransformation.otherBridgeChangesDetected ===
      false && exact(compatibility.requiredProvisional354BrowserAssertions
      .exactOldGlossaryPlacements, PRIOR_HOST_REGRESSION_IDS) &&
    exact(compatibility.requiredProvisional354BrowserAssertions
      .exactNewTranchePlacements, IDS) &&
    exact(compatibility.requiredProvisional354BrowserAssertions
      .inequalityUnicodeRequired, ['<', '≥', '≤', '≠']) &&
    compatibility.requiredProvisional354BrowserAssertions
      .rawEntityTextForbidden === true &&
    exact(compatibility.requiredProvisional354BrowserAssertions
      .glossaryPauseTransitions, {
      runningOpenCloseResumes: true,
      inspectedOpenCloseRemainsPaused: true,
      inspectedSeekRequestIdentityPreserved: true,
      blockedAndNestedRequestsMustNotOverwriteSnapshot: true,
      navigationReplayAndResetMustClearSnapshot: true,
    }) &&
    exact(compatibility.inputs.currentBridge, descriptor(values.productBridge)) &&
    exact(compatibility.inputs.currentDescriptorPlayer,
      descriptor(values.descriptorPlayer)) &&
    exact(compatibility.inputs.currentGlossaryPauseHelper,
      descriptor(values.glossaryPauseHelper)) &&
    exact(compatibility.inputs.currentDescriptorPlayerTest,
      descriptor(values.descriptorPlayerTest)) &&
    exact(compatibility.inputs.currentGlossaryPauseHelperTest,
      descriptor(values.glossaryPauseHelperTest)) &&
    exact(compatibility.inputs.final342AggregateBrowserEvidence,
      descriptor(values.final342AggregateBrowserEvidence)) &&
    exact(compatibility.inputs.builder,
      descriptor(values.successorCompatibilityVerifier)) &&
    values.successorCompatibilityAudit.sha256 ===
      SUCCESSOR_COMPATIBILITY_SHA256 &&
    values.successorCompatibilityVerifier.sha256 ===
      SUCCESSOR_COMPATIBILITY_BUILDER_SHA256,
  'successor bridge compatibility authority drifted');
  exactPredecessorSampleIds(predecessorBrowser, compatibility);
  invariant(introGenerated.generatedPlacementCount === 4 &&
    introGenerated.registrationCandidatePlacementCount === 0 &&
    introGenerated.currentJavaScriptRegisteredCount === 0 &&
    exact(introGenerated.entries.map((entry) => entry.key), INTRO_IDS) &&
    simpleGenerated.generatedPlacementCount === 8 &&
    simpleGenerated.currentJavaScriptRegisteredCount === 0 &&
    exact(simpleGenerated.entries.map((entry) => entry.key), SIMPLE_IDS) &&
    simpleGenerated.entries.every((entry) =>
      entry.maturity === 'private-current-js'),
  'ALG L11 generated fragment authority drifted');
  assertDecodedMathDefinitions(intro, simple);
  invariant(IDS.every((id) =>
    selected.get(id)?.productBlockers?.includes(PENDING_BLOCKER)),
  'exact12 provisional pending blocker drifted');
  const exact12 = freeze.selectedPages.filter((page) => IDS.includes(
    page.animationId));
  const fragmentEntries = new Map(fragment.calibration.entries.map((entry) =>
    [entry.key, entry]));
  const registryEntries = new Map(registryCalibration.entries.map((entry) =>
    [entry.key, entry]));
  invariant(exact12.length === 12 && exact(exact12.map((page) =>
    page.animationId).sort(), [...IDS].sort()) && exact12.every((page) =>
    page.productCalibrationPassed === false &&
    page.engineeringPreviewReady === false &&
    page.runtime?.canvasRenderer?.sha256) && IDS.every((id) =>
    fragmentEntries.get(id)?.maturity === 'private-current-js' &&
    registryEntries.get(id)?.maturity === 'private-current-js' &&
    fragmentEntries.get(id)?.module === registryEntries.get(id)?.module) &&
    selected.get(INTRO_IDS[0])?.presentation == null &&
    IDS.slice(1).every((id) => selected.get(id)?.presentation
      ?.pageInteractionCompanionTargetIdSuffix ===
      `alg-l11-${id.slice(-4)}-glossary-controls`),
  'exact12 provisional page set drifted');
  lessonVector(values.catalog.value, freeze);
}

async function currentInputs(check) {
  const json = new Set(['freeze', 'fragment', 'catalog', 'residualAudit',
    'introAudit', 'simpleAudit', 'vb02Audit', 'in02Audit',
    'successorCompatibilityAudit',
    'final342AggregateBrowserEvidence',
    'introGeneratedFragment',
    'simpleGeneratedFragment', 'privateRegistry']);
  const values = Object.fromEntries(await Promise.all(Object.entries(PATHS)
    .map(async ([key, relativePath]) => {
      const snapshotNames = {privateRegistry:
        'private-current-js-registry.snapshot.json', localLoader:
        'registry.local-only.generated.snapshot.ts', localRegistry:
        'registry.local-only.metadata.generated.snapshot.ts'};
      const snapshot = check && Object.hasOwn(snapshotNames, key);
      const selectedPath = snapshot
        ? `${OUTPUT}/${snapshotNames[key]}`
        : relativePath;
      return [key, await binding(selectedPath, json.has(key))];
    })));
  validateInputs(values);
  const [script, executable] = await Promise.all([
    binding(path.relative(ROOT, SCRIPT_PATH)),
    externalBinding(chromium.executablePath()),
  ]);
  const descriptors = Object.fromEntries(Object.entries(values)
    .map(([key, value]) => [key, descriptor(value)]));
  descriptors.privateRegistry = descriptor(values.privateRegistry,
    `${OUTPUT}/private-current-js-registry.snapshot.json`);
  descriptors.localLoader = descriptor(values.localLoader,
    `${OUTPUT}/registry.local-only.generated.snapshot.ts`);
  descriptors.localRegistry = descriptor(values.localRegistry,
    `${OUTPUT}/registry.local-only.metadata.generated.snapshot.ts`);
  return Object.freeze({values,
    descriptors: Object.freeze({...descriptors, script: descriptor(script),
      chromiumExecutable: descriptor(executable)}),
    snapshots: check ? null : Object.freeze({
      privateRegistry: values.privateRegistry.buffer,
      localLoader: values.localLoader.buffer,
      localRegistry: values.localRegistry.buffer,
    })});
}

function sameLoopbackOrigin(url) {
  try {
    return new URL(url).origin === PARSED_BASE.origin;
  } catch {
    return false;
  }
}

function isLegacyNetworkOperation(url) {
  try {
    const parsed = new URL(url);
    return parsed.origin !== PARSED_BASE.origin || LEGACY_NETWORK_OPERATION.test(
      decodeURIComponent(`${parsed.pathname}${parsed.search}`));
  } catch {
    return true;
  }
}

export function explicitlyAllowedProductRequest(request, pages) {
  if (!request || request.method !== 'GET' ||
    isLegacyNetworkOperation(request.url)) return false;
  let parsed;
  try {
    parsed = new URL(request.url);
  } catch {
    return false;
  }
  const safeResourceTypes = new Set([
    'document', 'script', 'stylesheet', 'image', 'font', 'fetch', 'xhr',
    'other',
  ]);
  if (!safeResourceTypes.has(request.resourceType)) return false;
  if (parsed.pathname.startsWith('/_next/static/')) {
    return ['script', 'stylesheet', 'font', 'image', 'fetch', 'other']
      .includes(request.resourceType);
  }
  if (parsed.pathname === '/_next/image') {
    return ['image', 'fetch'].includes(request.resourceType);
  }
  const prefix = '/en/migration-status/g678-calibration/';
  const routeId = parsed.pathname.startsWith(prefix)
    ? parsed.pathname.slice(prefix.length) : null;
  if (routeId && pages.has(routeId) &&
    parsed.pathname === `${prefix}${routeId}`) {
    return request.resourceType === 'document' ||
      request.resourceType === 'fetch';
  }
  const canvas = parsed.pathname.match(
    /^\/flash-assets\/g678-local\/([^/]+)\/canvas-renderer\.js$/u);
  if (canvas) {
    const page = pages.get(canvas[1]);
    return request.resourceType === 'script' && page &&
      parsed.search === `?sha256=${page.runtime.canvasRenderer.sha256}`;
  }
  return ['image', 'font', 'stylesheet', 'script'].includes(
    request.resourceType) &&
    /\.(?:avif|css|gif|ico|jpe?g|js|png|svg|webp|woff2?)$/iu.test(
      parsed.pathname);
}

export function assertExactRequestPolicyEvidence(observedRequests,
  requestPolicy, pages) {
  const expected = requestPolicyReceipt({
    observedRequestCount: observedRequests.length,
    allRequestsLoopback: observedRequests.every((request) =>
      sameLoopbackOrigin(request.url)),
    unallowlistedRequestCount: observedRequests.filter((request) =>
      !explicitlyAllowedProductRequest(request, pages)).length,
    legacyNetworkOperationCount: observedRequests.filter((request) =>
      isLegacyNetworkOperation(request.url)).length,
  });
  invariant(exact(requestPolicy, expected),
    'durable request policy evidence drifted');
  return true;
}

function assetReceipt(response) {
  const headers = response.headers();
  return Object.freeze({url: response.url(), status: response.status(),
    cacheControl: headers['cache-control'] ?? null,
    contentType: headers['content-type'] ?? null,
    corp: headers['cross-origin-resource-policy'] ?? null,
    nosniff: headers['x-content-type-options'] ?? null});
}

function validAsset(response, page) {
  return response?.url === `${BASE}/flash-assets/g678-local/` +
      `${page.animationId}/canvas-renderer.js?sha256=` +
      page.runtime.canvasRenderer.sha256 && response.status === 200 &&
    response.corp === 'same-origin' && response.nosniff === 'nosniff' &&
    response.cacheControl === 'private, no-store, max-age=0' &&
    response.contentType?.startsWith('text/javascript');
}

async function screenshot(stage, fileName) {
  const buffer = await readFile(path.join(stage, fileName));
  return Object.freeze({path: `${OUTPUT}/${fileName}`, bytes: buffer.length,
    sha256: sha256(buffer)});
}

function expectedButtons(record) {
  return Object.freeze(record.behavior.buttons.map((button) =>
    Object.freeze({characterId: button.characterId,
      sourceKeyAttribute: button.sourceKeyAttribute,
      firstFrame: button.firstFrame,
      lastFrame: button.lastFrame ?? record.structure.mainFrameCount})));
}

export function companionPortalExpectation(record, frame) {
  const visibleButtonCount = expectedButtons(record).filter((button) =>
    button.firstFrame <= frame && frame <= button.lastFrame).length;
  return Object.freeze({visibleButtonCount,
    expectedPortalCount: visibleButtonCount > 0 ? 1 : 0});
}

export function companionWindowFrames(record) {
  const buttons = expectedButtons(record);
  return Object.freeze([...new Set(buttons.flatMap((button) => [
    Math.max(1, button.firstFrame - 1), button.firstFrame, button.lastFrame,
    Math.min(record.structure.mainFrameCount, button.lastFrame + 1),
  ]))].sort((left, right) => left - right));
}

export function assertExactCompanionWindowSamples(record, samples) {
  const expected = companionWindowFrames(record).map((frame) => {
    const expectation = companionPortalExpectation(record, frame);
    return {frame, expectedButtonCount: expectation.visibleButtonCount,
      actualButtonCount: expectation.visibleButtonCount,
      expectedPortalCount: expectation.expectedPortalCount,
      actualPortalCount: expectation.expectedPortalCount};
  });
  invariant(exact(samples, expected),
    `${record.animationId} companion window samples drifted`);
  return true;
}

export function terminalCompanionReceipt(record, frame,
  terminalPortalCount, terminalButtonCount) {
  const expectation = companionPortalExpectation(record, frame);
  return Object.freeze({
    terminalExpectedGlossaryButtonCount: expectation.visibleButtonCount,
    terminalCompanionPortalCount: terminalPortalCount,
    terminalButtonCount,
    terminalCompanionPortalMatched: terminalPortalCount ===
        expectation.expectedPortalCount && terminalButtonCount ===
        expectation.visibleButtonCount,
  });
}

const REPLAY_STATE_INPUT_KEYS = Object.freeze([
  'replayFrame', 'actualButtonCount', 'actualPortalCount', 'renderState',
  'blockedAlertOrOverlayCount',
]);

export function replayStateReceipt(record, input) {
  invariant(exact(Object.keys(input), REPLAY_STATE_INPUT_KEYS) &&
    Number.isInteger(input.replayFrame) && input.replayFrame >= 1 &&
    Number.isInteger(input.actualButtonCount) &&
      input.actualButtonCount >= 0 &&
    Number.isInteger(input.actualPortalCount) &&
      input.actualPortalCount >= 0 &&
    typeof input.renderState === 'string' &&
    Number.isInteger(input.blockedAlertOrOverlayCount) &&
      input.blockedAlertOrOverlayCount >= 0,
  'replay state receipt input drifted');
  const expectation = companionPortalExpectation(record, input.replayFrame);
  return Object.freeze({replayResetFrame: input.replayFrame,
    replayExpectedButtonCount: expectation.visibleButtonCount,
    replayActualButtonCount: input.actualButtonCount,
    replayExpectedPortalCount: expectation.expectedPortalCount,
    replayActualPortalCount: input.actualPortalCount,
    replayRenderState: input.renderState,
    replayBlockedAlertOrOverlayCount: input.blockedAlertOrOverlayCount,
    replayStateResetPassed: input.replayFrame <= 2 &&
      input.actualButtonCount === expectation.visibleButtonCount &&
      input.actualPortalCount === expectation.expectedPortalCount &&
      input.renderState === 'ready' &&
      input.blockedAlertOrOverlayCount === 0});
}

const INLINE_REPLAY_INPUT_KEYS = Object.freeze([
  'replayFrame', 'actualGlobalButtons', 'companionButtonCount',
  'companionSurfaceCount', 'renderState', 'timelineValue', 'ariaPressed',
  'runtimePaused', 'inspectionAction', 'blockedAlertOrOverlayCount',
]);

export function inlineLegacyReplayReceipt(record, input) {
  invariant(exact(Object.keys(input), INLINE_REPLAY_INPUT_KEYS) &&
    Number.isInteger(input.replayFrame) &&
    Array.isArray(input.actualGlobalButtons) &&
    [input.companionButtonCount, input.companionSurfaceCount,
      input.blockedAlertOrOverlayCount].every((value) =>
      Number.isInteger(value) && value >= 0),
  'inline legacy Replay receipt input drifted');
  const expectedGlobalButtons = expectedButtons(record).filter((button) =>
    button.firstFrame <= input.replayFrame &&
      input.replayFrame <= button.lastFrame).map((button) =>
    ({characterId: button.characterId,
      sourceKeyAttribute: button.sourceKeyAttribute,
      disabled: false, inCompanion: false})).sort((left, right) =>
    left.characterId - right.characterId);
  return Object.freeze({expectedReplayFrame: 1,
    actualReplayFrame: input.replayFrame,
    expectedGlobalButtons, actualGlobalButtons: input.actualGlobalButtons,
    companionButtonCount: input.companionButtonCount,
    companionSurfaceCount: input.companionSurfaceCount,
    renderState: input.renderState, timelineValue: input.timelineValue,
    ariaPressed: input.ariaPressed, runtimePaused: input.runtimePaused,
    inspectionAction: input.inspectionAction,
    blockedAlertOrOverlayCount: input.blockedAlertOrOverlayCount,
    inlineLegacyPresentation: true, notCompanion: true,
    replayStateResetPassed: input.replayFrame === 1 &&
      input.renderState === 'ready' && input.timelineValue === '1' &&
      input.ariaPressed === 'false' && input.runtimePaused === 'false' &&
      input.inspectionAction === 'toggle-pause' &&
      exact(input.actualGlobalButtons, expectedGlobalButtons) &&
      input.actualGlobalButtons.every((button) =>
        button.disabled === false && button.inCompanion === false) &&
      input.companionButtonCount === 0 &&
      input.companionSurfaceCount === 0 &&
      input.blockedAlertOrOverlayCount === 0});
}

const SEEK_TIMEOUT_DIAGNOSTIC_KEYS = Object.freeze([
  'animationId', 'target', 'actualFrame', 'renderState', 'timelineValue',
  'runtimePaused', 'inspectionAction',
]);

export function formatSeekTimeoutDiagnostic(snapshot) {
  invariant(exact(Object.keys(snapshot), SEEK_TIMEOUT_DIAGNOSTIC_KEYS) &&
    typeof snapshot.animationId === 'string' && snapshot.animationId !== '' &&
    Number.isInteger(snapshot.target) && snapshot.target >= 1 &&
    [snapshot.actualFrame, snapshot.renderState, snapshot.timelineValue,
      snapshot.runtimePaused, snapshot.inspectionAction].every((value) =>
      value === null || typeof value === 'string'),
  'seek timeout diagnostic fields drifted');
  return `seek target was not reached: ${JSON.stringify(snapshot)}`;
}

const SEEK_PAUSE_PRECONDITION_KEYS = Object.freeze([
  'ariaPressed', 'runtimePaused', 'inspectionAction',
]);

export function seekPausePreconditionDecision(snapshot) {
  invariant(exact(Object.keys(snapshot), SEEK_PAUSE_PRECONDITION_KEYS) &&
    ['true', 'false'].includes(snapshot.ariaPressed) &&
    ['true', 'false'].includes(snapshot.runtimePaused) &&
    ['toggle-pause', 'resume-current-js-from-inspected-frame']
      .includes(snapshot.inspectionAction),
  'seek pause precondition fields drifted');
  if (snapshot.ariaPressed === 'false' &&
      snapshot.runtimePaused === 'false' &&
      snapshot.inspectionAction === 'toggle-pause') {
    return 'pause-running';
  }
  invariant(snapshot.ariaPressed === 'true' &&
    snapshot.runtimePaused === 'true',
  'seek pause precondition state drifted');
  return 'keep-paused';
}

const SEEK_RECEIPT_INPUT_KEYS = Object.freeze([
  'pausePreconditionDecision', 'pausedForInspection',
  'eventDispatchReturn', 'productHandlerObserved',
]);

export function createSeekReceipt(input) {
  invariant(exact(Object.keys(input), SEEK_RECEIPT_INPUT_KEYS) &&
    ['pause-running', 'keep-paused'].includes(
      input.pausePreconditionDecision) &&
    input.pausedForInspection === true &&
    input.eventDispatchReturn === true &&
    input.productHandlerObserved === true,
  'seek receipt input drifted');
  return Object.freeze({pausedForInspection: true,
    pausePreconditionDecision: input.pausePreconditionDecision,
    pauseControlClicked: input.pausePreconditionDecision === 'pause-running',
    inputEventDispatched: true, inputEventType: 'input',
    eventDispatchReturn: true, productHandlerObserved: true,
    exactTargetReached: true});
}

const HISTORICAL_ALREADY_OBSERVED_KEYS = Object.freeze([
  'target', 'actualFrame', 'timelineValue', 'renderState',
  'pausedForInspection', 'inspectionAction', 'pausePreconditionDecision',
]);

const HISTORICAL_ALREADY_OBSERVED_DIAGNOSTIC_KEYS = Object.freeze([
  'animationId', 'target', 'actualFrame', 'timelineValue', 'renderState',
  'runtimePaused', 'ariaPressed', 'inspectionAction',
  'pausePreconditionDecision', 'pauseControlClicked',
]);

export function formatHistoricalAlreadyObservedDiagnostic(snapshot) {
  invariant(exact(Object.keys(snapshot),
    HISTORICAL_ALREADY_OBSERVED_DIAGNOSTIC_KEYS) &&
    typeof snapshot.animationId === 'string' && snapshot.animationId !== '' &&
    Number.isInteger(snapshot.target) && snapshot.target > 0 &&
    Number.isInteger(snapshot.actualFrame) && snapshot.actualFrame > 0 &&
    typeof snapshot.timelineValue === 'string' &&
    typeof snapshot.renderState === 'string' &&
    ['true', 'false'].includes(snapshot.runtimePaused) &&
    ['true', 'false'].includes(snapshot.ariaPressed) &&
    ['toggle-pause', 'resume-current-js-from-inspected-frame']
      .includes(snapshot.inspectionAction) &&
    ['pause-running', 'keep-paused'].includes(
      snapshot.pausePreconditionDecision) &&
    typeof snapshot.pauseControlClicked === 'boolean',
  'historical already-observed diagnostic fields drifted');
  return `historical already-observed frame receipt drifted: ${
    JSON.stringify(snapshot)}`;
}

export function historicalAlreadyObservedReceipt(input) {
  invariant(exact(Object.keys(input), HISTORICAL_ALREADY_OBSERVED_KEYS) &&
    Number.isInteger(input.target) && input.target > 0 &&
    input.actualFrame === input.target &&
    input.timelineValue === String(input.target) &&
    input.renderState === 'ready' && input.pausedForInspection === true &&
    ['toggle-pause', 'resume-current-js-from-inspected-frame']
      .includes(input.inspectionAction) &&
    ['pause-running', 'keep-paused'].includes(
      input.pausePreconditionDecision) &&
    (input.pausePreconditionDecision === 'pause-running'
      ? input.inspectionAction === 'toggle-pause'
      : true),
  'historical already-observed frame receipt drifted');
  return Object.freeze({attainment: 'already-observed',
    target: input.target, actualFrame: input.actualFrame,
    timelineValue: input.timelineValue, renderState: input.renderState,
    pausedForInspection: true,
    inspectionAction: input.inspectionAction,
    pausePreconditionDecision: input.pausePreconditionDecision,
    pauseControlClicked:
      input.pausePreconditionDecision === 'pause-running',
    inputEventDispatched: false, inputEventType: null,
    eventDispatchReturn: null, productHandlerObserved: false,
    exactTargetReached: true});
}

const HISTORICAL_SEEK_INPUT_KEYS = Object.freeze([
  'target', 'actualFrame', 'timelineValue', 'renderState',
  'inspectionAction', 'seekReceipt',
]);

export function historicalSeekInputReceipt(input) {
  invariant(exact(Object.keys(input), HISTORICAL_SEEK_INPUT_KEYS) &&
    Number.isInteger(input.target) && input.target > 0 &&
    input.actualFrame === input.target &&
    input.timelineValue === String(input.target) &&
    input.renderState === 'ready' && input.inspectionAction ===
      'resume-current-js-from-inspected-frame',
  'historical seek-input receipt fields drifted');
  const strictSeek = createSeekReceipt({
    pausePreconditionDecision:
      input.seekReceipt.pausePreconditionDecision,
    pausedForInspection: input.seekReceipt.pausedForInspection,
    eventDispatchReturn: input.seekReceipt.eventDispatchReturn,
    productHandlerObserved: input.seekReceipt.productHandlerObserved,
  });
  invariant(exact(input.seekReceipt, strictSeek),
    'historical seek-input strict seek receipt drifted');
  return Object.freeze({attainment: 'seek-input', target: input.target,
    actualFrame: input.actualFrame, timelineValue: input.timelineValue,
    renderState: input.renderState,
    pausedForInspection: strictSeek.pausedForInspection,
    inspectionAction: input.inspectionAction,
    pausePreconditionDecision: strictSeek.pausePreconditionDecision,
    pauseControlClicked: strictSeek.pauseControlClicked,
    inputEventDispatched: strictSeek.inputEventDispatched,
    inputEventType: strictSeek.inputEventType,
    eventDispatchReturn: strictSeek.eventDispatchReturn,
    productHandlerObserved: strictSeek.productHandlerObserved,
    exactTargetReached: strictSeek.exactTargetReached});
}

async function seek(page, canvas, frame) {
  const timeline = page.locator(
    'input[data-responsive-focus-key="timeline"]:visible').first();
  const pause = page.locator(
    'button[data-responsive-focus-key="pause"]:visible');
  invariant(await pause.count() === 1,
    'seek requires exactly one visible pause control');
  const runtime = page.locator('[data-runtime-paused]').first();
  const pauseControl = pause.first();
  const preconditionDecision = seekPausePreconditionDecision({
    ariaPressed: await pauseControl.getAttribute('aria-pressed'),
    runtimePaused: await runtime.getAttribute('data-runtime-paused'),
    inspectionAction: await pauseControl.getAttribute(
      'data-frame-inspection-action'),
  });
  if (preconditionDecision === 'pause-running') {
    await pauseControl.click();
    await page.waitForFunction(() =>
      document.querySelector('[data-runtime-paused="true"]') !== null &&
      [...document.querySelectorAll(
        'button[data-responsive-focus-key="pause"]')].some((button) =>
        button.getClientRects().length > 0 &&
          button.getAttribute('aria-pressed') === 'true'));
  }
  const animationId = await canvas.getAttribute('data-course-canvas');
  const eventDispatchReturn = await timeline.evaluate((element, value) => {
    const setter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype, 'value')?.set;
    if (!setter) throw new Error('native range value setter is unavailable');
    setter.call(element, String(value));
    return element.dispatchEvent(new Event('input', {bubbles: true}));
  }, frame);
  try {
    await page.waitForFunction(({id, expected}) => {
      const pauseButton = [...document.querySelectorAll(
        'button[data-responsive-focus-key="pause"]')].find((button) =>
        button.getClientRects().length > 0);
      return document.querySelector(
        `canvas[data-course-canvas="${id}"]`)?.getAttribute(
          'data-flash-frame') === String(expected) &&
        pauseButton?.getAttribute('aria-pressed') === 'true' &&
        pauseButton?.getAttribute('data-frame-inspection-action') ===
          'resume-current-js-from-inspected-frame' &&
        document.querySelector('[data-runtime-paused="true"]') !== null;
    },
    {id: animationId, expected: frame});
  } catch (cause) {
    const snapshot = {
      animationId,
      target: frame,
      actualFrame: await canvas.getAttribute('data-flash-frame'),
      renderState: await canvas.getAttribute('data-render-state'),
      timelineValue: await timeline.inputValue(),
      runtimePaused: await runtime.getAttribute('data-runtime-paused'),
      inspectionAction: await pauseControl.getAttribute(
        'data-frame-inspection-action'),
    };
    throw new Error(formatSeekTimeoutDiagnostic(snapshot), {cause});
  }
  const pausedForInspection =
    await pauseControl.getAttribute('aria-pressed') === 'true' &&
    await runtime.getAttribute('data-runtime-paused') === 'true';
  const productHandlerObserved = await pauseControl.getAttribute(
    'data-frame-inspection-action') ===
      'resume-current-js-from-inspected-frame';
  invariant(eventDispatchReturn === true && pausedForInspection &&
    productHandlerObserved && await timeline.inputValue() === String(frame) &&
    await canvas.getAttribute('data-render-state') === 'ready',
    `Canvas frame ${frame} did not remain ready`);
  return createSeekReceipt({pausePreconditionDecision: preconditionDecision,
    pausedForInspection, eventDispatchReturn, productHandlerObserved});
}

async function attainHistoricalFrame(page, canvas, target) {
  const pause = page.locator(
    'button[data-responsive-focus-key="pause"]:visible');
  invariant(await pause.count() === 1,
    'historical frame attainment requires one visible pause control');
  const pauseControl = pause.first();
  const runtime = page.locator('[data-runtime-paused]').first();
  const preconditionDecision = seekPausePreconditionDecision({
    ariaPressed: await pauseControl.getAttribute('aria-pressed'),
    runtimePaused: await runtime.getAttribute('data-runtime-paused'),
    inspectionAction: await pauseControl.getAttribute(
      'data-frame-inspection-action'),
  });
  if (preconditionDecision === 'pause-running') {
    await pauseControl.click();
    await page.waitForFunction(() =>
      document.querySelector('[data-runtime-paused="true"]') !== null &&
      [...document.querySelectorAll(
        'button[data-responsive-focus-key="pause"]')].some((button) =>
        button.getClientRects().length > 0 &&
          button.getAttribute('aria-pressed') === 'true'));
  }
  const timeline = page.locator(
    'input[data-responsive-focus-key="timeline"]:visible').first();
  const actualFrame = Number(await canvas.getAttribute('data-flash-frame'));
  const timelineValue = await timeline.inputValue();
  const renderState = await canvas.getAttribute('data-render-state');
  const pausedForInspection =
    await pauseControl.getAttribute('aria-pressed') === 'true' &&
    await runtime.getAttribute('data-runtime-paused') === 'true';
  const inspectionAction = await pauseControl.getAttribute(
    'data-frame-inspection-action');
  if (actualFrame === target && timelineValue === String(target)) {
    try {
      return historicalAlreadyObservedReceipt({target, actualFrame,
        timelineValue, renderState, pausedForInspection, inspectionAction,
        pausePreconditionDecision: preconditionDecision});
    } catch (cause) {
      const diagnostic = {animationId: await canvas.getAttribute(
        'data-course-canvas'), target, actualFrame, timelineValue,
      renderState,
      runtimePaused: await runtime.getAttribute('data-runtime-paused'),
      ariaPressed: await pauseControl.getAttribute('aria-pressed'),
      inspectionAction,
      pausePreconditionDecision: preconditionDecision,
      pauseControlClicked: preconditionDecision === 'pause-running'};
      throw new Error(formatHistoricalAlreadyObservedDiagnostic(diagnostic),
        {cause});
    }
  }
  const seekReceipt = await seek(page, canvas, target);
  return historicalSeekInputReceipt({target,
    actualFrame: Number(await canvas.getAttribute('data-flash-frame')),
    timelineValue: await timeline.inputValue(),
    renderState: await canvas.getAttribute('data-render-state'),
    inspectionAction: await pauseControl.getAttribute(
      'data-frame-inspection-action'), seekReceipt});
}

function validSeekReceipt(receipt) {
  return receipt.pausedForInspection === true &&
    receipt.exactTargetReached === true &&
    ['pause-running', 'keep-paused'].includes(
      receipt.pausePreconditionDecision) &&
    receipt.pauseControlClicked ===
      (receipt.pausePreconditionDecision === 'pause-running') &&
    receipt.inputEventDispatched === true &&
    receipt.inputEventType === 'input' &&
    receipt.eventDispatchReturn === true &&
    receipt.productHandlerObserved === true;
}

const HISTORICAL_SMOKE_FRAME_KEYS = Object.freeze([
  'frame', 'renderState', 'frameDomain', 'attainment', 'target',
  'actualFrame', 'timelineValue', 'pausedForInspection', 'inspectionAction',
  'pausePreconditionDecision', 'pauseControlClicked',
  'inputEventDispatched', 'inputEventType', 'eventDispatchReturn',
  'productHandlerObserved', 'exactTargetReached',
]);

export function assertHistoricalAttainmentReceipt(smokeFrame,
  expectedTarget, expectedFrameDomain) {
  invariant(exact(Object.keys(smokeFrame), HISTORICAL_SMOKE_FRAME_KEYS) &&
    Number.isInteger(expectedTarget) && expectedTarget > 0 &&
    smokeFrame.frame === expectedTarget &&
    smokeFrame.frameDomain === expectedFrameDomain,
  'historical smoke frame wrapper drifted');
  const core = {attainment: smokeFrame.attainment,
    target: smokeFrame.target, actualFrame: smokeFrame.actualFrame,
    timelineValue: smokeFrame.timelineValue,
    renderState: smokeFrame.renderState,
    pausedForInspection: smokeFrame.pausedForInspection,
    inspectionAction: smokeFrame.inspectionAction,
    pausePreconditionDecision: smokeFrame.pausePreconditionDecision,
    pauseControlClicked: smokeFrame.pauseControlClicked,
    inputEventDispatched: smokeFrame.inputEventDispatched,
    inputEventType: smokeFrame.inputEventType,
    eventDispatchReturn: smokeFrame.eventDispatchReturn,
    productHandlerObserved: smokeFrame.productHandlerObserved,
    exactTargetReached: smokeFrame.exactTargetReached};
  let expected;
  if (core.attainment === 'already-observed') {
    expected = historicalAlreadyObservedReceipt({
      target: core.target, actualFrame: core.actualFrame,
      timelineValue: core.timelineValue, renderState: core.renderState,
      pausedForInspection: core.pausedForInspection,
      inspectionAction: core.inspectionAction,
      pausePreconditionDecision: core.pausePreconditionDecision,
    });
  } else {
    expected = historicalSeekInputReceipt({target: core.target,
      actualFrame: core.actualFrame, timelineValue: core.timelineValue,
      renderState: core.renderState,
      inspectionAction: core.inspectionAction,
      seekReceipt: {pausedForInspection: core.pausedForInspection,
        pausePreconditionDecision: core.pausePreconditionDecision,
        pauseControlClicked: core.pauseControlClicked,
        inputEventDispatched: core.inputEventDispatched,
        inputEventType: core.inputEventType,
        eventDispatchReturn: core.eventDispatchReturn,
        productHandlerObserved: core.productHandlerObserved,
        exactTargetReached: core.exactTargetReached}});
  }
  invariant(core.target === expectedTarget && exact(core, expected),
    'historical attainment durable core drifted');
  return true;
}

function validGlossaryPlaybackSnapshot(snapshot) {
  return typeof snapshot.animationId === 'string' &&
    Number.isInteger(snapshot.frame) && snapshot.frame >= 1 &&
    typeof snapshot.frameDomain === 'string' &&
    snapshot.timelineValue === String(snapshot.frame) &&
    ['true', 'false'].includes(snapshot.ariaPressed) &&
    ['true', 'false'].includes(snapshot.runtimePaused) &&
    ['toggle-pause', 'resume-current-js-from-inspected-frame']
      .includes(snapshot.inspectionAction);
}

function glossaryLiveSeekIdentity(snapshot) {
  return Object.freeze({animationId: snapshot.animationId,
    frame: snapshot.frame, frameDomain: snapshot.frameDomain,
    timelineValue: snapshot.timelineValue});
}

export function assertExactInspectedGlossaryLiveIdentity(beforeOpen,
  whileOpen, afterClose) {
  const before = glossaryLiveSeekIdentity(beforeOpen);
  invariant(exact(glossaryLiveSeekIdentity(whileOpen), before) &&
    exact(glossaryLiveSeekIdentity(afterClose), before),
  'inspected glossary live seek identity drifted');
  return true;
}

function validGlossaryPauseTransition(result) {
  if (![result.beforeOpen, result.whileOpen, result.afterClose]
    .every(validGlossaryPlaybackSnapshot)) return false;
  if (result.transitionPath === 'running-open-close-resume') {
    return result.beforeOpen.ariaPressed === 'false' &&
      result.beforeOpen.runtimePaused === 'false' &&
      result.beforeOpen.inspectionAction === 'toggle-pause' &&
      result.whileOpen.ariaPressed === 'true' &&
      result.whileOpen.runtimePaused === 'true' &&
      result.whileOpen.inspectionAction === 'toggle-pause' &&
      result.afterClose.ariaPressed === 'false' &&
      result.afterClose.runtimePaused === 'false' &&
      result.afterClose.inspectionAction === 'toggle-pause' &&
      result.afterClose.frame > result.whileOpen.frame &&
      result.hostPaused === true && result.hostResumedAfterClose === true &&
      result.inspectedSeekIdentityPreserved === null &&
      result.nextSeekWithoutNormalizationPassed === null;
  }
  if (result.transitionPath !== 'inspected-open-close-preserve') return false;
  return [result.beforeOpen, result.whileOpen, result.afterClose]
    .every((snapshot) => snapshot.ariaPressed === 'true' &&
      snapshot.runtimePaused === 'true' &&
      snapshot.inspectionAction ===
        'resume-current-js-from-inspected-frame') &&
    assertExactInspectedGlossaryLiveIdentity(result.beforeOpen,
      result.whileOpen, result.afterClose) &&
    result.hostPaused === true && result.hostResumedAfterClose === false &&
    result.inspectedSeekIdentityPreserved === true &&
    result.nextSeekWithoutNormalizationPassed === true &&
    Number.isInteger(result.nextSeekTarget) && result.nextSeekTarget >= 1 &&
    validSeekReceipt(result.nextSeekReceipt) &&
    result.nextSeekReceipt.pausePreconditionDecision === 'keep-paused' &&
    result.nextSeekReceipt.pauseControlClicked === false;
}

async function visibleButtons(page) {
  return page.locator(
    '[data-page-interaction-companion-host="true"] ' +
    'button[data-source-character-id]').evaluateAll((buttons) =>
    buttons.map((button) => ({
      characterId: Number(button.getAttribute('data-source-character-id')),
      sourceKeyAttribute: button.getAttribute('data-source-key-attribute'),
      disabled: button.hasAttribute('disabled'),
    })));
}

async function glossaryPlaybackSnapshot(page, canvas) {
  const pause = page.locator(
    'button[data-responsive-focus-key="pause"]:visible');
  invariant(await pause.count() === 1,
    'glossary playback snapshot requires one visible pause control');
  const pauseControl = pause.first();
  const timeline = page.locator(
    'input[data-responsive-focus-key="timeline"]:visible').first();
  return Object.freeze({
    animationId: await canvas.getAttribute('data-course-canvas'),
    frame: Number(await canvas.getAttribute('data-flash-frame')),
    frameDomain: await canvas.getAttribute('data-flash-frame-domain'),
    timelineValue: await timeline.inputValue(),
    ariaPressed: await pauseControl.getAttribute('aria-pressed'),
    runtimePaused: await page.locator('[data-runtime-paused]').first()
      .getAttribute('data-runtime-paused'),
    inspectionAction: await pauseControl.getAttribute(
      'data-frame-inspection-action'),
  });
}

async function exerciseGlossary(page, canvas, button, term,
  {provePause, captureOpen = null}) {
  const transitionPath = provePause
    ? 'running-open-close-resume'
    : 'inspected-open-close-preserve';
  if (provePause) {
    const resume = page.getByRole('button',
      {name: 'Continue from inspected frame'});
    invariant(await resume.count() === 1,
      `${term.id} running transition requires inspected resume`);
    await resume.click();
    await page.waitForFunction(() => {
      const pause = [...document.querySelectorAll(
        'button[data-responsive-focus-key="pause"]')].find((button) =>
        button.getClientRects().length > 0);
      return pause?.getAttribute('aria-pressed') === 'false' &&
        pause?.getAttribute('data-frame-inspection-action') ===
          'toggle-pause' &&
        document.querySelector('[data-runtime-paused="false"]') !== null;
    });
  }
  const beforeOpen = await glossaryPlaybackSnapshot(page, canvas);
  invariant(provePause
    ? beforeOpen.ariaPressed === 'false' &&
      beforeOpen.runtimePaused === 'false' &&
      beforeOpen.inspectionAction === 'toggle-pause'
    : beforeOpen.ariaPressed === 'true' &&
      beforeOpen.runtimePaused === 'true' &&
      beforeOpen.inspectionAction ===
        'resume-current-js-from-inspected-frame',
  `${term.id} pre-open glossary pause transition drifted`);
  await button.click();
  const dialog = page.locator('[role="dialog"][data-glossary-entry-id]');
  await dialog.waitFor();
  invariant(await dialog.getAttribute('data-glossary-entry-id') === term.id &&
    await dialog.getAttribute('data-source-key-attribute') ===
      term.sourceKeyAttribute &&
    (await dialog.locator('p').nth(1).innerText()) === term.definitions.en,
  `${term.id} typed glossary content drifted`);
  const close = dialog.getByRole('button', {name: 'Close and continue'});
  invariant(await close.evaluate((element) =>
    document.activeElement === element),
  `${term.id} glossary close control did not receive focus`);
  const openCapture = captureOpen ? await captureOpen(dialog) : null;
  const whileOpen = await glossaryPlaybackSnapshot(page, canvas);
  invariant(whileOpen.ariaPressed === 'true' &&
    whileOpen.runtimePaused === 'true' &&
    whileOpen.inspectionAction === (provePause
      ? 'toggle-pause'
      : 'resume-current-js-from-inspected-frame'),
  `${term.id} open glossary pause transition drifted`);
  await page.waitForTimeout(350);
  invariant(Number(await canvas.getAttribute('data-flash-frame')) ===
    whileOpen.frame,
  `${term.id} glossary did not pause the modern host`);
  await close.click();
  await dialog.waitFor({state: 'detached'});
  invariant(await page.locator('[data-session-decision-overlay="closed"]')
    .count() === 1,
  `${term.id} glossary did not close through the typed host`);
  if (provePause) {
    await page.waitForFunction(({id, initial}) => Number(document
      .querySelector(`canvas[data-course-canvas="${id}"]`)
      ?.getAttribute('data-flash-frame')) > initial,
    {id: await canvas.getAttribute('data-course-canvas'),
      initial: whileOpen.frame});
    await page.waitForFunction(() => {
      const pause = [...document.querySelectorAll(
        'button[data-responsive-focus-key="pause"]')].find((button) =>
        button.getClientRects().length > 0);
      return pause?.getAttribute('aria-pressed') === 'false' &&
        pause?.getAttribute('data-frame-inspection-action') ===
          'toggle-pause' &&
        document.querySelector('[data-runtime-paused="false"]') !== null;
    });
  } else {
    await page.waitForFunction(({id, frame, timelineValue}) => {
      const pause = [...document.querySelectorAll(
        'button[data-responsive-focus-key="pause"]')].find((button) =>
        button.getClientRects().length > 0);
      const timeline = [...document.querySelectorAll(
        'input[data-responsive-focus-key="timeline"]')].find((input) =>
        input.getClientRects().length > 0);
      return pause?.getAttribute('aria-pressed') === 'true' &&
        pause?.getAttribute('data-frame-inspection-action') ===
          'resume-current-js-from-inspected-frame' &&
        document.querySelector('[data-runtime-paused="true"]') !== null &&
        document.querySelector(`canvas[data-course-canvas="${id}"]`)
          ?.getAttribute('data-flash-frame') === String(frame) &&
        timeline?.value === timelineValue;
    }, {id: whileOpen.animationId, frame: whileOpen.frame,
      timelineValue: whileOpen.timelineValue});
  }
  const afterClose = await glossaryPlaybackSnapshot(page, canvas);
  const inspectedSeekIdentityPreserved = provePause ? null :
    assertExactInspectedGlossaryLiveIdentity(beforeOpen, whileOpen,
      afterClose) && afterClose.inspectionAction ===
        beforeOpen.inspectionAction;
  invariant(provePause
    ? afterClose.ariaPressed === 'false' &&
      afterClose.runtimePaused === 'false' &&
      afterClose.inspectionAction === 'toggle-pause' &&
      afterClose.frame > whileOpen.frame
    : afterClose.ariaPressed === 'true' &&
      afterClose.runtimePaused === 'true' &&
      inspectedSeekIdentityPreserved,
  `${term.id} post-close glossary pause transition drifted`);
  return Object.freeze({entryId: term.id,
    sourceKeyAttribute: term.sourceKeyAttribute,
    definitionSha256: sha256(Buffer.from(term.definitions.en)),
    closeControlAutoFocused: true, transitionPath,
    beforeOpen, whileOpen, afterClose, openCapture, hostPaused: true,
    hostResumedAfterClose: provePause,
    inspectedSeekIdentityPreserved: provePause
      ? null
      : inspectedSeekIdentityPreserved,
    nextSeekWithoutNormalizationPassed: provePause ? null : false});
}

async function exercisePage(browser, stage, pageRecord, audit,
  registeredPage, family) {
  const page = await browser.newPage({viewport: {width: 1440, height: 1000}});
  const errors = [];
  const requests = [];
  const assets = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(String(error)));
  page.on('request', (request) => requests.push({method: request.method(),
    resourceType: request.resourceType(), url: request.url()}));
  page.on('response', (response) => {
    if (response.url().includes(`/flash-assets/g678-local/${
      pageRecord.animationId}/canvas-renderer.js`)) {
      assets.push(assetReceipt(response));
    }
  });
  try {
    await page.goto(`${BASE}/en/migration-status/g678-calibration/${
      pageRecord.animationId}`, {waitUntil: 'domcontentloaded'});
    await page.waitForFunction((id) => document.querySelector(
      `canvas[data-course-canvas="${id}"]`)?.getAttribute(
        'data-render-state') === 'ready', pageRecord.animationId,
    {timeout: 45_000});
    const canvas = page.locator(
      `canvas[data-course-canvas="${pageRecord.animationId}"]`);
    const frameCount = pageRecord.structure.mainFrameCount;
    const middle = Math.max(1, Math.ceil(frameCount / 2));
    let introAdvance = null;
    if (pageRecord.animationId === INTRO_IDS[0]) {
      await page.getByRole('button', {name: 'Replay', exact: true}).click();
      const replayFrame = Number(await canvas.getAttribute('data-flash-frame'));
      await page.waitForFunction(({id, initial}) => Number(document
        .querySelector(`canvas[data-course-canvas="${id}"]`)
        ?.getAttribute('data-flash-frame')) > initial,
      {id: pageRecord.animationId, initial: replayFrame});
      introAdvance = Object.freeze({replayFrame,
        advancedFrame: Number(await canvas.getAttribute('data-flash-frame'))});
    }
    const canvasFrames = [];
    for (const frame of [1, middle, frameCount]) {
      const seekReceipt = await seek(page, canvas, frame);
      canvasFrames.push(Object.freeze({frame,
        renderState: await canvas.getAttribute('data-render-state'),
        frameDomain: await canvas.getAttribute('data-flash-frame-domain'),
        ...seekReceipt}));
    }
    const expected = expectedButtons(pageRecord);
    const observed = new Map();
    let portalObservedDuringActiveWindow = false;
    const companionWindowSamples = [];
    const frames = companionWindowFrames(pageRecord);
    for (const frame of frames) {
      await seek(page, canvas, frame);
      const expectation = companionPortalExpectation(pageRecord, frame);
      const expectedVisible = expected.filter((button) =>
        button.firstFrame <= frame && frame <= button.lastFrame)
        .map(({characterId, sourceKeyAttribute}) =>
          ({characterId, sourceKeyAttribute}));
      invariant(expectedVisible.length === expectation.visibleButtonCount,
        `${pageRecord.animationId} source portal expectation drifted`);
      await page.waitForFunction(({expectedButtonCount,
        expectedPortalCount}) => document.querySelectorAll(
        '[data-page-interaction-companion-host="true"] ' +
        'button[data-source-character-id]').length === expectedButtonCount &&
        document.querySelectorAll(
          '[data-page-interaction-companion-host="true"] ' +
          '[data-page-interaction-companion-surface]').length ===
            expectedPortalCount,
      {expectedButtonCount: expectation.visibleButtonCount,
        expectedPortalCount: expectation.expectedPortalCount});
      const actualButtonCount = await page.locator(
        '[data-page-interaction-companion-host="true"] ' +
        'button[data-source-character-id]').count();
      const actualPortalCount = await page.locator(
        '[data-page-interaction-companion-host="true"] ' +
        '[data-page-interaction-companion-surface]').count();
      invariant(actualButtonCount === expectation.visibleButtonCount &&
        actualPortalCount === expectation.expectedPortalCount,
      `${pageRecord.animationId} companion DOM drifted at ${frame}`);
      companionWindowSamples.push(Object.freeze({frame,
        expectedButtonCount: expectation.visibleButtonCount,
        actualButtonCount, expectedPortalCount: expectation.expectedPortalCount,
        actualPortalCount}));
      portalObservedDuringActiveWindow ||= actualPortalCount === 1;
      const settledVisible = await visibleButtons(page);
      invariant(exact(settledVisible.map(({disabled, ...button}) => button),
        expectedVisible) && settledVisible.every((button) => !button.disabled),
      `${pageRecord.animationId} glossary lifetime window drifted at ${frame}`);
      for (const button of settledVisible) observed.set(button.characterId,
        Object.freeze({...button}));
    }
    assertExactCompanionWindowSamples(pageRecord, companionWindowSamples);
    invariant(exact([...observed.values()].sort((left, right) =>
      left.characterId - right.characterId), expected.map((button) =>
      ({characterId: button.characterId,
        sourceKeyAttribute: button.sourceKeyAttribute,
        disabled: false})).sort((left, right) =>
      left.characterId - right.characterId)),
    `${pageRecord.animationId} exact glossary button set drifted`);
    const termMap = new Map(audit.terms.map((term) =>
      [term.normalizedKey, term]));
    const glossaryResults = [];
    let pauseProved = false;
    let pendingInspectedResultIndex = null;
    const bindInspectedNextSeek = (seekReceipt, target) => {
      if (pendingInspectedResultIndex === null) return;
      const prior = glossaryResults[pendingInspectedResultIndex];
      const nextSeekWithoutNormalizationPassed =
        seekReceipt.pausePreconditionDecision === 'keep-paused' &&
        seekReceipt.pauseControlClicked === false &&
        seekReceipt.productHandlerObserved === true &&
        seekReceipt.exactTargetReached === true;
      invariant(nextSeekWithoutNormalizationPassed,
        `${pageRecord.animationId} inspected glossary next seek drifted`);
      glossaryResults[pendingInspectedResultIndex] = Object.freeze({...prior,
        nextSeekTarget: target, nextSeekReceipt: seekReceipt,
        nextSeekWithoutNormalizationPassed});
      pendingInspectedResultIndex = null;
    };
    for (const buttonRecord of expected) {
      const seekReceipt = await seek(page, canvas, buttonRecord.firstFrame);
      bindInspectedNextSeek(seekReceipt, buttonRecord.firstFrame);
      const button = page.locator(
        `button[data-source-character-id="${buttonRecord.characterId}"]`);
      invariant(await button.count() === 1,
        `${pageRecord.animationId} glossary trigger missing`);
      const term = termMap.get(buttonRecord.sourceKeyAttribute.trim()
        .toLocaleLowerCase('en-US'));
      invariant(term, `${pageRecord.animationId} glossary term unresolved`);
      const provePause = !pauseProved && buttonRecord.lastFrame >
        buttonRecord.firstFrame + 12;
      const glossaryResult = await exerciseGlossary(page, canvas, button, term,
        {provePause});
      glossaryResults.push(glossaryResult);
      if (!provePause) pendingInspectedResultIndex =
        glossaryResults.length - 1;
      pauseProved ||= provePause;
    }
    const terminalAlreadyExact =
      await canvas.getAttribute('data-flash-frame') === String(frameCount) &&
      await page.locator(
        'input[data-responsive-focus-key="timeline"]:visible').first()
        .inputValue() === String(frameCount) &&
      await canvas.getAttribute('data-render-state') === 'ready';
    let terminalSeekReceipt = null;
    if (!terminalAlreadyExact) {
      terminalSeekReceipt = await seek(page, canvas, frameCount);
      bindInspectedNextSeek(terminalSeekReceipt, frameCount);
    }
    invariant(pendingInspectedResultIndex === null,
      `${pageRecord.animationId} inspected glossary lacks a next seek`);
    const fileName = `${pageRecord.animationId}.png`;
    await page.screenshot({path: path.join(stage, fileName), fullPage: true});
    const screenshotReceipt = await screenshot(stage, fileName);
    const terminalFrameObserved = Number(await canvas.getAttribute(
      'data-flash-frame'));
    const terminalRenderState = await canvas.getAttribute('data-render-state');
    const terminalPortalCount = await page.locator(
      '[data-page-interaction-companion-host="true"] ' +
      '[data-page-interaction-companion-surface]').count();
    const terminalButtonCount = await page.locator(
      '[data-page-interaction-companion-host="true"] ' +
      'button[data-source-character-id]').count();
    const terminalCompanion = terminalCompanionReceipt(pageRecord,
      frameCount, terminalPortalCount, terminalButtonCount);
    invariant(terminalFrameObserved === frameCount &&
      terminalRenderState === 'ready',
    `${pageRecord.animationId} terminal frame drifted`);
    await page.getByRole('button', {name: 'Replay', exact: true}).click();
    const replayHandle = await page.waitForFunction(({id, buttons}) => {
      const canvasElement = document.querySelector(
        `canvas[data-course-canvas="${id}"]`);
      const replayFrame = Number(canvasElement?.getAttribute(
        'data-flash-frame'));
      if (!Number.isInteger(replayFrame) || replayFrame < 1 ||
          replayFrame > 2 || canvasElement?.getAttribute(
            'data-render-state') !== 'ready') return false;
      const expectedButtonCount = buttons.filter((button) =>
        button.firstFrame <= replayFrame &&
          replayFrame <= button.lastFrame).length;
      const expectedPortalCount = expectedButtonCount > 0 ? 1 : 0;
      const actualButtonCount = document.querySelectorAll(
        '[data-page-interaction-companion-host="true"] ' +
        'button[data-source-character-id]').length;
      const actualPortalCount = document.querySelectorAll(
        '[data-page-interaction-companion-host="true"] ' +
        '[data-page-interaction-companion-surface]').length;
      const blockedAlertOrOverlayCount = document.querySelectorAll(
        '[role="alert"], [data-session-decision-overlay="open"], ' +
        '[data-stage-overlay-controls="blocked"]').length;
      return actualButtonCount === expectedButtonCount &&
        actualPortalCount === expectedPortalCount &&
        blockedAlertOrOverlayCount === 0
        ? {replayFrame, actualButtonCount, actualPortalCount,
            renderState: 'ready', blockedAlertOrOverlayCount}
        : false;
    }, {id: pageRecord.animationId, buttons: expected});
    const replayState = replayStateReceipt(pageRecord,
      await replayHandle.jsonValue());
    await replayHandle.dispose();
    const replayReset = replayState.replayStateResetPassed;
    invariant(errors.length === 0 && assets.length === 1 &&
      validAsset(assets[0], registeredPage) &&
      (expected.length === 0 || portalObservedDuringActiveWindow) &&
      terminalCompanion.terminalCompanionPortalMatched && replayReset,
    `${pageRecord.animationId} browser/asset/portal boundary drifted`);
    return Object.freeze({animationId: pageRecord.animationId, family,
      frameCount, canvasFrames, introAdvance,
      exactGlossaryButtonCount: expected.length,
      exactGlossaryButtons: expected,
      glossaryResults, glossaryPauseProved: pauseProved,
      companionPortalRequired: expected.length > 0,
      companionPortalObservedDuringActiveWindow:
        portalObservedDuringActiveWindow,
      companionWindowSamples,
      terminalFrameObserved, terminalRenderState,
      terminalScreenshotCapturedBeforeReplay: true,
      ...terminalCompanion,
      ...replayState,
      replayCapturedAfterTerminalEvidence: true,
      companionPortalPassed: true,
      typedHostOpenCloseFocusPassed: glossaryResults.every((result) =>
        result.closeControlAutoFocused), replayReset,
      asset: assets[0], requests, errors, screenshot: screenshotReceipt});
  } finally {
    await page.close();
  }
}

function assertHistoricalRuntimeBinding(sample, registeredPage) {
  invariant(sample.animationId === registeredPage.animationId &&
    sample.frameCount === registeredPage.runtime.frameCount &&
    sample.frameDomain === registeredPage.runtime.frameDomain &&
    sample.runtimeSha256 === registeredPage.runtime.canvasRenderer.sha256,
  `${sample.animationId} historical/current runtime binding drifted`);
  return true;
}

async function exercisePriorHostRegression(browser, stage, pageRecord,
  registeredPage, inequalityTerm, historicalSample) {
  assertHistoricalRuntimeBinding(historicalSample, registeredPage);
  const page = await browser.newPage({viewport: {width: 1440, height: 1000}});
  const errors = [];
  const requests = [];
  const assets = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(String(error)));
  page.on('request', (request) => requests.push({method: request.method(),
    resourceType: request.resourceType(), url: request.url()}));
  page.on('response', (response) => {
    if (response.url().includes(`/flash-assets/g678-local/${
      pageRecord.animationId}/canvas-renderer.js`)) {
      assets.push(assetReceipt(response));
    }
  });
  try {
    await page.goto(`${BASE}/en/migration-status/g678-calibration/${
      pageRecord.animationId}`, {waitUntil: 'domcontentloaded'});
    await page.waitForFunction((id) => document.querySelector(
      `canvas[data-course-canvas="${id}"]`)?.getAttribute(
        'data-render-state') === 'ready', pageRecord.animationId,
    {timeout: 45_000});
    const canvas = page.locator(
      `canvas[data-course-canvas="${pageRecord.animationId}"]`);
    const smokeFrames = [];
    for (const frame of historicalReplayFrameTargets(historicalSample)) {
      const seekReceipt = await attainHistoricalFrame(page, canvas, frame);
      smokeFrames.push(Object.freeze({frame,
        renderState: await canvas.getAttribute('data-render-state'),
        frameDomain: await canvas.getAttribute('data-flash-frame-domain'),
        ...seekReceipt}));
    }
    const inequalityButton = pageRecord.behavior.buttons.find((button) =>
      button.sourceKeyAttribute === 'Inequality');
    invariant(inequalityButton &&
      !/(?:&#x|&gt;|&lt;)/u.test(JSON.stringify(inequalityTerm.definitions)) &&
      ['<', '≥', '≤', '≠'].every((symbol) =>
        inequalityTerm.definitions.en.includes(symbol) &&
        inequalityTerm.definitions.es.includes(symbol)),
    `${pageRecord.animationId} regression definition authority drifted`);
    await seek(page, canvas, inequalityButton.firstFrame);
    await page.waitForFunction((characterId) => document.querySelector(
      `button[data-source-character-id="${characterId}"]`)
      ?.getAttribute('data-source-key-attribute') === 'Inequality',
    inequalityButton.characterId);
    const trigger = page.locator(
      `button[data-source-character-id="${inequalityButton.characterId}"]`);
    const hostResult = await exerciseGlossary(page, canvas, trigger,
      inequalityTerm, {provePause: true,
        captureOpen: async (dialog) => {
          const visibleDefinition = await dialog.locator('p').nth(1)
            .innerText();
          invariant(visibleDefinition === inequalityTerm.definitions.en &&
            !/(?:&#x|&gt;|&lt;)/u.test(visibleDefinition) &&
            ['<', '≥', '≤', '≠'].every((symbol) =>
              visibleDefinition.includes(symbol)),
          `${pageRecord.animationId} current-host definition regressed`);
          const fileName = `${pageRecord.animationId}-current-host-glossary.png`;
          await page.screenshot({path: path.join(stage, fileName),
            fullPage: true});
          return Object.freeze({visibleDefinition,
            screenshot: await screenshot(stage, fileName)});
        }});
    const visibleDefinition = hostResult.openCapture.visibleDefinition;
    const screenshotReceipt = hostResult.openCapture.screenshot;
    await page.getByRole('button', {name: 'Replay', exact: true}).click();
    const expectedInlineButtons = expectedButtons(pageRecord).filter(
      (button) => button.firstFrame <= 1 && 1 <= button.lastFrame)
      .map((button) => ({characterId: button.characterId,
        sourceKeyAttribute: button.sourceKeyAttribute,
        disabled: false, inCompanion: false})).sort((left, right) =>
      left.characterId - right.characterId);
    const replayHandle = await page.waitForFunction(({id, expectedButtons}) => {
      const canvasElement = document.querySelector(
        `canvas[data-course-canvas="${id}"]`);
      const replayFrame = Number(canvasElement?.getAttribute(
        'data-flash-frame'));
      const visiblePause = [...document.querySelectorAll(
        'button[data-responsive-focus-key="pause"]')].find((button) =>
        button.getClientRects().length > 0);
      const visibleTimeline = [...document.querySelectorAll(
        'input[data-responsive-focus-key="timeline"]')].find((input) =>
        input.getClientRects().length > 0);
      const actualGlobalButtons = [...document.querySelectorAll(
        'button[data-source-character-id]')].map((button) => ({
        characterId: Number(button.getAttribute('data-source-character-id')),
        sourceKeyAttribute: button.getAttribute('data-source-key-attribute'),
        disabled: button.hasAttribute('disabled'),
        inCompanion: button.closest(
          '[data-page-interaction-companion-host="true"]') !== null,
      })).sort((left, right) => left.characterId - right.characterId);
      const companionButtonCount = document.querySelectorAll(
        '[data-page-interaction-companion-host="true"] ' +
        'button[data-source-character-id]').length;
      const companionSurfaceCount = document.querySelectorAll(
        '[data-page-interaction-companion-host="true"] ' +
        '[data-page-interaction-companion-surface]').length;
      const blockedAlertOrOverlayCount = document.querySelectorAll(
        '[role="alert"], [data-session-decision-overlay="open"], ' +
        '[data-stage-overlay-controls="blocked"]').length;
      return replayFrame === 1 && canvasElement?.getAttribute(
        'data-render-state') === 'ready' &&
        visibleTimeline?.value === '1' &&
        visiblePause?.getAttribute('aria-pressed') === 'false' &&
        visiblePause?.getAttribute('data-frame-inspection-action') ===
          'toggle-pause' &&
        document.querySelector('[data-runtime-paused="false"]') !== null &&
        JSON.stringify(actualGlobalButtons) === JSON.stringify(
          expectedButtons) && companionButtonCount === 0 &&
        companionSurfaceCount === 0 && blockedAlertOrOverlayCount === 0
        ? {replayFrame, actualGlobalButtons, companionButtonCount,
            companionSurfaceCount, renderState: 'ready', timelineValue: '1',
            ariaPressed: 'false', runtimePaused: 'false',
            inspectionAction: 'toggle-pause', blockedAlertOrOverlayCount}
        : false;
    }, {id: pageRecord.animationId, expectedButtons: expectedInlineButtons});
    const replayState = inlineLegacyReplayReceipt(pageRecord,
      await replayHandle.jsonValue());
    await replayHandle.dispose();
    const replayReset = replayState.replayStateResetPassed;
    invariant(errors.length === 0 && assets.length === 1 &&
      validAsset(assets[0], registeredPage),
    `${pageRecord.animationId} regression browser/asset boundary drifted`);
    return Object.freeze({animationId: pageRecord.animationId,
      smokeKind: 'historical-initial-progressed',
      frameCount: pageRecord.structure.mainFrameCount, smokeFrames,
      historicalInitialFrame: historicalSample.initialFrame,
      historicalProgressedFrame: historicalSample.progressedFrame,
      inequalityCharacterId: inequalityButton.characterId,
      inequalityFirstFrame: inequalityButton.firstFrame,
      visibleDefinition, definitionSha256: sha256(Buffer.from(
        visibleDefinition)), hostResult, typedHostPauseCloseFocusPassed: true,
      replayReset, replayState, asset: assets[0], requests, errors,
      screenshot: screenshotReceipt});
  } finally {
    await page.close();
  }
}

async function replayPredecessorSample(browser, registeredPage,
  historicalSample) {
  assertHistoricalRuntimeBinding(historicalSample, registeredPage);
  const page = await browser.newPage({viewport: {width: 1280, height: 900}});
  const errors = [];
  const requests = [];
  const assets = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(String(error)));
  page.on('request', (request) => requests.push({method: request.method(),
    resourceType: request.resourceType(), url: request.url()}));
  page.on('response', (response) => {
    if (response.url().includes(`/flash-assets/g678-local/${
      registeredPage.animationId}/canvas-renderer.js`)) {
      assets.push(assetReceipt(response));
    }
  });
  try {
    await page.goto(`${BASE}/en/migration-status/g678-calibration/${
      registeredPage.animationId}`, {waitUntil: 'domcontentloaded'});
    await page.waitForFunction((id) => document.querySelector(
      `canvas[data-course-canvas="${id}"]`)?.getAttribute(
        'data-render-state') === 'ready', registeredPage.animationId,
    {timeout: 45_000});
    const canvas = page.locator(
      `canvas[data-course-canvas="${registeredPage.animationId}"]`);
    const frameCount = registeredPage.runtime.frameCount;
    const smokeFrames = [];
    for (const frame of historicalReplayFrameTargets(historicalSample)) {
      const seekReceipt = await attainHistoricalFrame(page, canvas, frame);
      smokeFrames.push(Object.freeze({frame,
        renderState: await canvas.getAttribute('data-render-state'),
        frameDomain: await canvas.getAttribute('data-flash-frame-domain'),
        ...seekReceipt}));
    }
    invariant(errors.length === 0 && assets.length === 1 &&
      validAsset(assets[0], registeredPage),
    `${registeredPage.animationId} current-host predecessor replay failed`);
    return Object.freeze({animationId: registeredPage.animationId,
      smokeKind: 'historical-initial-progressed', frameCount, smokeFrames,
      historicalInitialFrame: historicalSample.initialFrame,
      historicalProgressedFrame: historicalSample.progressedFrame,
      asset: assets[0], requests, errors});
  } finally {
    await page.close();
  }
}

async function replayPredecessorSpecialReady(browser, registeredPage,
  historicalSample) {
  invariant(PRIOR_READY_ONLY_IDS.includes(historicalSample.animationId) &&
    historicalSample.animationId === registeredPage.animationId,
  'historical special-ready sample authority drifted');
  const page = await browser.newPage({viewport: {width: 1280, height: 900}});
  const errors = [];
  const requests = [];
  const assets = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(String(error)));
  page.on('request', (request) => requests.push({method: request.method(),
    resourceType: request.resourceType(), url: request.url()}));
  page.on('response', (response) => {
    if (response.url().includes(`/flash-assets/g678-local/${
      registeredPage.animationId}/canvas-renderer.js`)) {
      assets.push(assetReceipt(response));
    }
  });
  try {
    await page.goto(`${BASE}/en/migration-status/g678-calibration/${
      registeredPage.animationId}`, {waitUntil: 'domcontentloaded'});
    await page.waitForFunction((id) => document.querySelector(
      `canvas[data-course-canvas="${id}"]`)?.getAttribute(
        'data-render-state') === 'ready', registeredPage.animationId,
    {timeout: 45_000});
    const canvas = page.locator(
      `canvas[data-course-canvas="${registeredPage.animationId}"]`);
    const actualInitialFrame = Number(await canvas.getAttribute(
      'data-flash-frame'));
    const actualFrameDomain = await canvas.getAttribute(
      'data-flash-frame-domain');
    const renderState = await canvas.getAttribute('data-render-state');
    invariant(Number.isInteger(actualInitialFrame) && actualInitialFrame > 0 &&
      actualInitialFrame <= registeredPage.runtime.frameCount &&
      actualFrameDomain === registeredPage.runtime.frameDomain &&
      renderState === 'ready' && errors.length === 0 && assets.length === 1 &&
      validAsset(assets[0], registeredPage),
    `${registeredPage.animationId} historical special-ready replay failed`);
    return Object.freeze({animationId: registeredPage.animationId,
      smokeKind: 'historical-special-ready',
      historicalSpecialKind: historicalSample.kind,
      frameCount: registeredPage.runtime.frameCount,
      actualInitialFrame, actualFrameDomain, renderState,
      fullHistoricalInteractionReplayed: false,
      limitation:
        'Fresh current-host Canvas readiness only; the historical game or assessment interaction was not replayed.',
      asset: assets[0], requests, errors});
  } finally {
    await page.close();
  }
}

async function runPool(items, concurrency, worker) {
  const results = new Array(items.length);
  let cursor = 0;
  async function next() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await worker(items[index], index);
    }
  }
  await Promise.all(Array.from({length: Math.min(concurrency, items.length)},
    () => next()));
  return Object.freeze(results);
}

async function buildEvidence(inputs) {
  const target = projectPath(OUTPUT);
  invariant(!await lstat(target).then(() => true, () => false),
    `${OUTPUT} already exists`);
  const stage = `${target}.staging-${process.pid}`;
  await mkdir(stage, {recursive: false});
  invariant(inputs.snapshots, 'QA build requires live registry snapshots');
  await Promise.all([
    writeFile(path.join(stage, 'private-current-js-registry.snapshot.json'),
      inputs.snapshots.privateRegistry, {flag: 'wx'}),
    writeFile(path.join(stage, 'registry.local-only.generated.snapshot.ts'),
      inputs.snapshots.localLoader, {flag: 'wx'}),
    writeFile(path.join(stage,
      'registry.local-only.metadata.generated.snapshot.ts'),
    inputs.snapshots.localRegistry, {flag: 'wx'}),
  ]);
  const freeze = inputs.values.freeze.value;
  const catalog = inputs.values.catalog.value;
  const intro = inputs.values.introAudit.value;
  const simple = inputs.values.simpleAudit.value;
  const pages = new Map(freeze.selectedPages.map((page) =>
    [page.animationId, page]));
  const browser = await chromium.launch({headless: true});
  const evidence = {schemaVersion: 1,
    artifactType: 'g678-alg-l11-tranche1-browser-qa-v1',
    generatedAt: new Date().toISOString(), baseUrl: BASE,
    inputs: inputs.descriptors,
    browser: {name: 'Chromium', version: browser.version(),
      executable: inputs.descriptors.chromiumExecutable},
    registeredCurrentJsPages: 354, allLessons: null,
    introTerminal: null, simpleGlossary: null,
    priorCurrentHostGlossaryRegressions: null,
    successorBridgeCompatibility: null,
    currentHostPredecessorReplay: null,
    observedRequests: [], screenshots: [], acceptanceEffects: FALSE_EFFECTS};
  try {
    const all = await browser.newPage({viewport: {width: 1440, height: 1100}});
    const allErrors = [];
    all.on('console', (message) => {
      if (message.type() === 'error') allErrors.push(message.text());
    });
    all.on('pageerror', (error) => allErrors.push(String(error)));
    await all.goto(`${BASE}/en?screen=lessons`, {waitUntil: 'networkidle'});
    await all.getByRole('button', {name: 'G6–G8 shared'}).click();
    await all.waitForFunction(() => document.querySelectorAll(
      '[data-workspace-screen="lessons"] article').length === 44);
    const vector = lessonVector(catalog, freeze);
    const cards = all.locator('[data-workspace-screen="lessons"] article');
    const copies = await cards.locator('[data-lesson-card-copy]')
      .allTextContents();
    const observed = copies.map((copy, index) => {
      const identity = copy.match(
        /G6–G8 shared · (NMS002|GEO001|ALG001|DAT001) · L(\d+)/u);
      const progress = copy.match(/(\d+)\/(\d+) pages registered/u);
      invariant(identity && progress, `invalid shared lesson card: ${copy}`);
      const expected = vector[index];
      invariant(expected.moduleCode === identity[1] &&
        expected.lessonNumber === Number(identity[2]) &&
        expected.registeredPageCount === Number(progress[1]) &&
        expected.activePageCount === Number(progress[2]),
      `${expected.stableLessonKey} browser vector drifted`);
      return expected;
    });
    invariant(await cards.locator('a').count() === 0 &&
      allErrors.length === 0,
    'All Lessons link/error boundary drifted');
    const allFile = 'all-lessons-354-one-complete-l11-partial.png';
    await all.screenshot({path: path.join(stage, allFile), fullPage: true});
    evidence.screenshots.push(await screenshot(stage, allFile));
    evidence.allLessons = {sharedCardCount: 44, linkedCardCount: 0,
      registeredPageSum: 354, exactLessonVector: observed,
      completeLessonKeys: ['shared-alg001-l09'],
      algL09: {registeredPageCount: 41, activePageCount: 41,
        complete: true},
      algL11: {registeredPageCount: 21, activePageCount: 44,
        complete: false}, errors: allErrors};
    await all.close();

    const introRecords = recordsById(intro);
    const simpleRecords = recordsById(simple);
    const introResults = [];
    const simpleResults = [];
    for (const id of IDS) {
      const family = INTRO_IDS.includes(id) ? 'intro-terminal' :
        'simple-glossary';
      const audit = family === 'intro-terminal' ? intro : simple;
      const record = (family === 'intro-terminal' ? introRecords :
        simpleRecords).get(id);
      invariant(record && pages.has(id), `${id} browser input missing`);
      const result = await exercisePage(browser, stage, record, audit,
        pages.get(id), family);
      evidence.screenshots.push(result.screenshot);
      evidence.observedRequests.push(...result.requests);
      if (family === 'intro-terminal') introResults.push(result);
      else simpleResults.push(result);
    }
    const regressionRecords = [
      recordsById(inputs.values.vb02Audit.value)
        .get(PRIOR_HOST_REGRESSION_IDS[0]),
      recordsById(inputs.values.in02Audit.value)
        .get(PRIOR_HOST_REGRESSION_IDS[1]),
    ];
    const inequalityTerm = termById(intro, 'inequality');
    const predecessorBrowser =
      inputs.values.final342AggregateBrowserEvidence.value;
    const predecessorReplayPlan = exactPredecessorReplayPlan(
      predecessorBrowser, inputs.values.successorCompatibilityAudit.value);
    const predecessorSamples = new Map(predecessorBrowser.samples.map(
      (sample) => [sample.animationId, sample]));
    const regressionResults = [];
    for (const record of regressionRecords) {
      invariant(record && pages.has(record.animationId) && inequalityTerm,
        'prior current-host regression input missing');
      const result = await exercisePriorHostRegression(browser, stage, record,
        pages.get(record.animationId), inequalityTerm,
        predecessorSamples.get(record.animationId));
      regressionResults.push(result);
      evidence.screenshots.push(result.screenshot);
      evidence.observedRequests.push(...result.requests);
    }
    const predecessorSampleIds = predecessorBrowser.samples.map((sample) =>
      sample.animationId);
    const ordinaryReplaySamples = predecessorReplayPlan.historicalFrameSamples
      .filter((sample) =>
        !PRIOR_HOST_REGRESSION_IDS.includes(sample.animationId));
    const ordinaryReplayResults = await runPool(ordinaryReplaySamples, 4,
      async (sample) => {
        const registeredPage = pages.get(sample.animationId);
        invariant(registeredPage,
          `${sample.animationId} predecessor sample is absent from provisional354`);
        return replayPredecessorSample(browser, registeredPage, sample);
      });
    const specialReadyResults = await runPool(
      predecessorReplayPlan.specialReadySamples, 3, async (sample) => {
        const registeredPage = pages.get(sample.animationId);
        invariant(registeredPage,
          `${sample.animationId} special predecessor sample is absent`);
        return replayPredecessorSpecialReady(browser, registeredPage, sample);
      });
    for (const result of [...ordinaryReplayResults, ...specialReadyResults]) {
      evidence.observedRequests.push(...result.requests);
    }
    const predecessorReplayMap = new Map([
      ...ordinaryReplayResults.map((result) => [result.animationId, result]),
      ...specialReadyResults.map((result) => [result.animationId, result]),
      ...regressionResults.map((result) => [result.animationId, result]),
    ]);
    const predecessorReplayResults = predecessorSampleIds.map((id) =>
      predecessorReplayMap.get(id));
    assertExactCurrentHostReplaySet(predecessorSampleIds,
      predecessorReplayResults);
    const allRequestsLoopback = evidence.observedRequests.every((request) =>
      sameLoopbackOrigin(request.url));
    const legacyOperations = evidence.observedRequests.filter((request) =>
      isLegacyNetworkOperation(request.url));
    const unallowlisted = evidence.observedRequests.filter((request) =>
      !explicitlyAllowedProductRequest(request, pages));
    const introButtonCount = introResults.reduce((sum, result) =>
      sum + result.exactGlossaryButtonCount, 0);
    const simpleButtonCount = simpleResults.reduce((sum, result) =>
      sum + result.exactGlossaryButtonCount, 0);
    const focusedGlossaryResults = [...introResults, ...simpleResults]
      .flatMap((result) => result.glossaryResults);
    const runningTransitions = focusedGlossaryResults.filter((result) =>
      result.transitionPath === 'running-open-close-resume');
    const inspectedTransitions = focusedGlossaryResults.filter((result) =>
      result.transitionPath === 'inspected-open-close-preserve');
    invariant(introButtonCount === 8 && simpleButtonCount === 40 &&
      focusedGlossaryResults.length === 48 &&
      runningTransitions.length === 11 &&
      inspectedTransitions.length === 37 &&
      focusedGlossaryResults.every(validGlossaryPauseTransition) &&
      introResults[0].introAdvance?.advancedFrame >
        introResults[0].introAdvance?.replayFrame &&
      introResults.every((result) => result.errors.length === 0 &&
        result.replayReset) &&
      simpleResults.every((result) => result.errors.length === 0 &&
        result.replayReset && result.companionPortalPassed) &&
      regressionResults.length === 2 && regressionResults.every((result) =>
        result.errors.length === 0 && result.replayReset &&
        result.typedHostPauseCloseFocusPassed) &&
      allRequestsLoopback && legacyOperations.length === 0 &&
      unallowlisted.length === 0,
    'ALG L11 tranche1 focused browser evidence failed');
    const absoluteValue = termById(simple, 'absolute-value');
    evidence.introTerminal = {placementCount: 4,
      exactGlossaryButtonCount: introButtonCount,
      recoveredGlossaryTermCount: intro.terms.length,
      introFrameAdvancePassed: true,
      terminalAndAbsenceWindowsPassed: true,
      exactUnicodeInequalityDefinitionVisible: introResults.some((result) =>
        result.glossaryResults.some((item) => item.entryId === 'inequality')),
      typedHostOpenPauseCloseFocusPassed: introResults
        .filter((result) => result.exactGlossaryButtonCount > 0)
        .every((result) => result.typedHostOpenCloseFocusPassed) &&
        introResults.some((result) => result.glossaryPauseProved),
      replayResetPassed: true, pages: introResults};
    evidence.simpleGlossary = {placementCount: 8,
      exactGlossaryButtonCount: simpleButtonCount,
      recoveredGlossaryTermCount: simple.terms.length,
      exactUnicodeInequalityAndReverseDefinitionsVisible:
        simpleResults.some((result) => result.glossaryResults.some((item) =>
          item.entryId === 'inequality')) &&
        simpleResults.some((result) => result.glossaryResults.some((item) =>
          item.entryId === 'reverse')),
      absoluteValueCollisionResolutionVisible:
        simpleResults.some((result) => result.glossaryResults.some((item) =>
          item.entryId === 'absolute-value' &&
          item.sourceKeyAttribute === absoluteValue.sourceKeyAttribute)),
      companionPortalPassed: true,
      typedHostOpenPauseCloseFocusPassed: simpleResults.every((result) =>
        result.typedHostOpenCloseFocusPassed) &&
        simpleResults.some((result) => result.glossaryPauseProved),
      replayResetPassed: true, pages: simpleResults};
    evidence.glossaryPauseTransitions = {
      requiredContract: inputs.values.successorCompatibilityAudit.value
        .requiredProvisional354BrowserAssertions.glossaryPauseTransitions,
      liveRunningOpenCloseResultCount: runningTransitions.length,
      liveInspectedOpenCloseResultCount: inspectedTransitions.length,
      runningOpenPausesAndCloseResumesLivePassed: true,
      inspectedOpenCloseRemainsPausedLivePassed: true,
      inspectedSeekFrameAndInspectionIdentityLivePassed: true,
      inspectedNextSeekWithoutNormalizationLivePassed: true,
      replayResetLivePassed: [...introResults, ...simpleResults]
        .every((result) => result.replayStateResetPassed),
      seekRequestObjectIdentityHashBoundStaticTest: {
        helper: inputs.descriptors.glossaryPauseHelper,
        helperTest: inputs.descriptors.glossaryPauseHelperTest,
        exactObjectIdentityRequired: true,
      },
      blockedAndNestedSnapshotHashBoundStaticContract: true,
      navigationAndResetHashBoundStaticContract: true,
      fullBlockedAndNestedBrowserCoverageClaimed: false,
      fullNavigationResetBrowserCoverageClaimed: false,
    };
    evidence.priorCurrentHostGlossaryRegressions = {
      placementCount: 2,
      placementIds: PRIOR_HOST_REGRESSION_IDS,
      exactUnicodeInequalityDefinitionVisible: true,
      typedHostPauseCloseFocusPassed: true,
      replayResetPassed: true,
      inlineLegacyPresentationReplayCount: 2,
      companionPresentationClaimed: false,
      currentHostPriorCalibratedCoverageClaimed: false,
      limitation:
        'Two exact ALG L11 regression pages exercise the successor host; they do not substitute for a full current-host replay of every prior calibrated page.',
      pages: regressionResults,
    };
    evidence.successorBridgeCompatibility = {
      compatibilityAudit: inputs.descriptors.successorCompatibilityAudit,
      exactInverseTransformationPassed: true,
      predecessorCompatibilityRebound: true,
      changedSurfaceBrowserRevalidated: true,
      currentHostBrowserRevalidated: true,
      glossaryPauseTransitionsBrowserRevalidated: true,
      currentHostNewPlacementSampleCount: 12,
      currentHostPriorGlossaryRegressionCount: 2,
      fullPrior126Replay: false,
      priorBrowserEvidenceStatus:
        'retained-historical-exact-old-bridge-evidence',
    };
    evidence.currentHostPredecessorReplay = {
      requiredBySuccessorCompatibility: true,
      historicalSampleCount: 92,
      currentHostPredecessorSampleReplayCount: 92,
      uniqueCurrentHostPredecessorModuleCount: 92,
      historicalInitialProgressedReplayCount: 89,
      historicalSpecialReadyCount: 3,
      historicalSpecialReadyIds: PRIOR_READY_ONLY_IDS,
      fullHistoricalSpecialInteractionReplay: false,
      currentHostBrowserRevalidated: true,
      results: predecessorReplayResults,
    };
    evidence.requestPolicy = requestPolicyReceipt({
      observedRequestCount: evidence.observedRequests.length,
      allRequestsLoopback,
      unallowlistedRequestCount: unallowlisted.length,
      legacyNetworkOperationCount: legacyOperations.length,
    });
    await writeFile(path.join(stage, 'evidence.json'), stableBytes(evidence),
      {flag: 'wx'});
    await rename(stage, target);
    return evidence;
  } catch (error) {
    await rename(stage, `${stage}.failed-${Date.now()}`).catch(() => {});
    throw error;
  } finally {
    await browser.close();
  }
}

async function checkEvidence(inputs) {
  const evidence = (await binding(`${OUTPUT}/evidence.json`, true)).value;
  const vector = lessonVector(inputs.values.catalog.value,
    inputs.values.freeze.value);
  const expectedScreenshotPaths = [
    `${OUTPUT}/all-lessons-354-one-complete-l11-partial.png`,
    ...IDS.map((id) => `${OUTPUT}/${id}.png`),
    ...PRIOR_HOST_REGRESSION_IDS.map((id) =>
      `${OUTPUT}/${id}-current-host-glossary.png`),
  ];
  const introPages = evidence.introTerminal?.pages ?? [];
  const simplePages = evidence.simpleGlossary?.pages ?? [];
  const registeredPages = new Map(inputs.values.freeze.value.selectedPages
    .map((page) => [page.animationId, page]));
  const introRecords = recordsById(inputs.values.introAudit.value);
  const simpleRecords = recordsById(inputs.values.simpleAudit.value);
  const regressionRecords = new Map([
    [PRIOR_HOST_REGRESSION_IDS[0], recordsById(
      inputs.values.vb02Audit.value).get(PRIOR_HOST_REGRESSION_IDS[0])],
    [PRIOR_HOST_REGRESSION_IDS[1], recordsById(
      inputs.values.in02Audit.value).get(PRIOR_HOST_REGRESSION_IDS[1])],
  ]);
  const inequalityTerm = termById(inputs.values.introAudit.value,
    'inequality');
  const evidencePageValid = (pageEvidence, audit, record) => {
    if (!record) return false;
    const frames = [1, Math.max(1,
      Math.ceil(record.structure.mainFrameCount / 2)),
    record.structure.mainFrameCount];
    const terms = new Map(audit.terms.map((term) =>
      [term.normalizedKey, term]));
    const buttons = expectedButtons(record);
    const terminalExpectation = companionPortalExpectation(record,
      record.structure.mainFrameCount);
    const expectedReplayState = replayStateReceipt(record, {
      replayFrame: pageEvidence.replayResetFrame,
      actualButtonCount: pageEvidence.replayActualButtonCount,
      actualPortalCount: pageEvidence.replayActualPortalCount,
      renderState: pageEvidence.replayRenderState,
      blockedAlertOrOverlayCount:
        pageEvidence.replayBlockedAlertOrOverlayCount,
    });
    const recordedReplayState = {
      replayResetFrame: pageEvidence.replayResetFrame,
      replayExpectedButtonCount: pageEvidence.replayExpectedButtonCount,
      replayActualButtonCount: pageEvidence.replayActualButtonCount,
      replayExpectedPortalCount: pageEvidence.replayExpectedPortalCount,
      replayActualPortalCount: pageEvidence.replayActualPortalCount,
      replayRenderState: pageEvidence.replayRenderState,
      replayBlockedAlertOrOverlayCount:
        pageEvidence.replayBlockedAlertOrOverlayCount,
      replayStateResetPassed: pageEvidence.replayStateResetPassed,
    };
    const expectedGlossary = buttons.map((button) => {
      const term = terms.get(button.sourceKeyAttribute.trim()
        .toLocaleLowerCase('en-US'));
      return term ? {entryId: term.id,
        sourceKeyAttribute: term.sourceKeyAttribute,
        definitionSha256: sha256(Buffer.from(term.definitions.en))} : null;
    });
    return pageEvidence.frameCount === record.structure.mainFrameCount &&
      exact(pageEvidence.canvasFrames.map((frame) => frame.frame), frames) &&
      pageEvidence.canvasFrames.every((frame) =>
        frame.renderState === 'ready' &&
        frame.frameDomain === record.structure.mainFrameDomain &&
        validSeekReceipt(frame)) &&
      exact(pageEvidence.exactGlossaryButtons, buttons) &&
      pageEvidence.exactGlossaryButtonCount === buttons.length &&
      expectedGlossary.every(Boolean) &&
      exact(pageEvidence.glossaryResults.map((result) => ({
        entryId: result.entryId,
        sourceKeyAttribute: result.sourceKeyAttribute,
        definitionSha256: result.definitionSha256,
      })), expectedGlossary) &&
      pageEvidence.glossaryResults.every((result) =>
        result.closeControlAutoFocused === true &&
        validGlossaryPauseTransition(result)) &&
      pageEvidence.companionPortalRequired === (buttons.length > 0) &&
      pageEvidence.companionPortalObservedDuringActiveWindow ===
        (buttons.length > 0) &&
      assertExactCompanionWindowSamples(record,
        pageEvidence.companionWindowSamples) &&
      pageEvidence.terminalExpectedGlossaryButtonCount ===
        terminalExpectation.visibleButtonCount &&
      pageEvidence.terminalCompanionPortalCount ===
        terminalExpectation.expectedPortalCount &&
      pageEvidence.terminalButtonCount ===
        terminalExpectation.visibleButtonCount &&
      pageEvidence.terminalCompanionPortalMatched === true &&
      pageEvidence.terminalFrameObserved ===
        record.structure.mainFrameCount &&
      pageEvidence.terminalRenderState === 'ready' &&
      pageEvidence.terminalScreenshotCapturedBeforeReplay === true &&
      exact(recordedReplayState, expectedReplayState) &&
      pageEvidence.replayStateResetPassed === true &&
      pageEvidence.replayCapturedAfterTerminalEvidence === true &&
      pageEvidence.companionPortalPassed === true &&
      pageEvidence.replayReset === true && pageEvidence.errors.length === 0 &&
      validAsset(pageEvidence.asset,
        registeredPages.get(pageEvidence.animationId));
  };
  const regressionEvidenceValid = (pageEvidence) => {
    const record = regressionRecords.get(pageEvidence.animationId);
    const historicalSample = predecessorSamples.get(pageEvidence.animationId);
    const sourceButton = record?.behavior.buttons.find((button) =>
      button.sourceKeyAttribute === 'Inequality');
    return sourceButton && inequalityTerm && historicalSample &&
      pageEvidence.smokeKind === 'historical-initial-progressed' &&
      pageEvidence.frameCount === historicalSample.frameCount &&
      pageEvidence.historicalInitialFrame === historicalSample.initialFrame &&
      pageEvidence.historicalProgressedFrame ===
        historicalSample.progressedFrame &&
      assertHistoricalRuntimeBinding(historicalSample,
        registeredPages.get(pageEvidence.animationId)) &&
      assertExactHistoricalReplayFrames(historicalSample,
        pageEvidence.smokeFrames) &&
      pageEvidence.smokeFrames.every((frame, index) =>
        frame.renderState === 'ready' &&
        frame.frameDomain === record.structure.mainFrameDomain &&
        assertHistoricalAttainmentReceipt(frame,
          historicalReplayFrameTargets(historicalSample)[index],
          record.structure.mainFrameDomain)) &&
      pageEvidence.inequalityCharacterId === sourceButton.characterId &&
      pageEvidence.inequalityFirstFrame === sourceButton.firstFrame &&
      pageEvidence.visibleDefinition === inequalityTerm.definitions.en &&
      pageEvidence.definitionSha256 === sha256(Buffer.from(
        inequalityTerm.definitions.en)) &&
      !/(?:&#x|&gt;|&lt;)/u.test(pageEvidence.visibleDefinition) &&
      ['<', '≥', '≤', '≠'].every((symbol) =>
        pageEvidence.visibleDefinition.includes(symbol)) &&
      pageEvidence.hostResult.hostPaused === true &&
      pageEvidence.hostResult.hostResumedAfterClose === true &&
      validGlossaryPauseTransition(pageEvidence.hostResult) &&
      exact(pageEvidence.replayState, inlineLegacyReplayReceipt(record, {
        replayFrame: pageEvidence.replayState.actualReplayFrame,
        actualGlobalButtons: pageEvidence.replayState.actualGlobalButtons,
        companionButtonCount:
          pageEvidence.replayState.companionButtonCount,
        companionSurfaceCount:
          pageEvidence.replayState.companionSurfaceCount,
        renderState: pageEvidence.replayState.renderState,
        timelineValue: pageEvidence.replayState.timelineValue,
        ariaPressed: pageEvidence.replayState.ariaPressed,
        runtimePaused: pageEvidence.replayState.runtimePaused,
        inspectionAction: pageEvidence.replayState.inspectionAction,
        blockedAlertOrOverlayCount:
          pageEvidence.replayState.blockedAlertOrOverlayCount,
      })) && pageEvidence.replayState.replayStateResetPassed === true &&
      pageEvidence.replayState.inlineLegacyPresentation === true &&
      pageEvidence.replayState.notCompanion === true &&
      pageEvidence.hostResult.closeControlAutoFocused === true &&
      pageEvidence.typedHostPauseCloseFocusPassed === true &&
      pageEvidence.replayReset === true && pageEvidence.errors.length === 0 &&
      validAsset(pageEvidence.asset,
        registeredPages.get(pageEvidence.animationId));
  };
  const regressions = evidence.priorCurrentHostGlossaryRegressions;
  const pauseTransitions = evidence.glossaryPauseTransitions;
  const compatibility = evidence.successorBridgeCompatibility;
  const predecessorReplay = evidence.currentHostPredecessorReplay;
  const predecessorSampleIds = exactPredecessorSampleIds(
    inputs.values.final342AggregateBrowserEvidence.value,
    inputs.values.successorCompatibilityAudit.value);
  const predecessorReplayPlan = exactPredecessorReplayPlan(
    inputs.values.final342AggregateBrowserEvidence.value,
    inputs.values.successorCompatibilityAudit.value);
  const predecessorSamples = new Map(inputs.values
    .final342AggregateBrowserEvidence.value.samples.map((sample) =>
    [sample.animationId, sample]));
  const predecessorReplayValid = (result) => {
    const registeredPage = registeredPages.get(result.animationId);
    const historicalSample = predecessorSamples.get(result.animationId);
    if (!registeredPage || !historicalSample) return false;
    const common = result.frameCount === registeredPage.runtime.frameCount &&
      result.errors.length === 0 && validAsset(result.asset, registeredPage) &&
      result.requests.every((request) =>
        explicitlyAllowedProductRequest(request, registeredPages));
    if (!common) return false;
    if (PRIOR_READY_ONLY_IDS.includes(result.animationId)) {
      return result.smokeKind === 'historical-special-ready' &&
        result.historicalSpecialKind === historicalSample.kind &&
        Number.isInteger(result.actualInitialFrame) &&
        result.actualInitialFrame > 0 &&
        result.actualInitialFrame <= registeredPage.runtime.frameCount &&
        result.actualFrameDomain === registeredPage.runtime.frameDomain &&
        result.renderState === 'ready' &&
        result.fullHistoricalInteractionReplayed === false;
    }
    assertHistoricalRuntimeBinding(historicalSample, registeredPage);
    return result.smokeKind === 'historical-initial-progressed' &&
      result.historicalInitialFrame === historicalSample.initialFrame &&
      result.historicalProgressedFrame === historicalSample.progressedFrame &&
      assertExactHistoricalReplayFrames(historicalSample,
        result.smokeFrames) &&
      result.smokeFrames.every((frame, index) =>
        frame.renderState === 'ready' &&
        frame.frameDomain === registeredPage.runtime.frameDomain &&
        assertHistoricalAttainmentReceipt(frame,
          historicalReplayFrameTargets(historicalSample)[index],
          registeredPage.runtime.frameDomain));
  };
  invariant(evidence.artifactType ===
      'g678-alg-l11-tranche1-browser-qa-v1' &&
    evidence.baseUrl === BASE && evidence.registeredCurrentJsPages === 354 &&
    exact(evidence.inputs, inputs.descriptors) &&
    evidence.allLessons.sharedCardCount === 44 &&
    evidence.allLessons.linkedCardCount === 0 &&
    evidence.allLessons.registeredPageSum === 354 &&
    exact(evidence.allLessons.exactLessonVector, vector) &&
    exact(evidence.allLessons.completeLessonKeys, ['shared-alg001-l09']) &&
    exact(evidence.allLessons.algL09,
      {registeredPageCount: 41, activePageCount: 41, complete: true}) &&
    exact(evidence.allLessons.algL11,
      {registeredPageCount: 21, activePageCount: 44, complete: false}) &&
    evidence.allLessons.errors.length === 0 &&
    introPages.length === 4 && simplePages.length === 8 &&
    exact(introPages.map((page) => page.animationId), INTRO_IDS) &&
    exact(simplePages.map((page) => page.animationId), SIMPLE_IDS) &&
    evidence.introTerminal.exactGlossaryButtonCount === 8 &&
    evidence.introTerminal.recoveredGlossaryTermCount === 6 &&
    evidence.introTerminal.introFrameAdvancePassed === true &&
    evidence.introTerminal.terminalAndAbsenceWindowsPassed === true &&
    evidence.introTerminal.exactUnicodeInequalityDefinitionVisible === true &&
    evidence.introTerminal.typedHostOpenPauseCloseFocusPassed === true &&
    evidence.introTerminal.replayResetPassed === true &&
    evidence.simpleGlossary.exactGlossaryButtonCount === 40 &&
    evidence.simpleGlossary.recoveredGlossaryTermCount === 17 &&
    evidence.simpleGlossary
      .exactUnicodeInequalityAndReverseDefinitionsVisible === true &&
    evidence.simpleGlossary.absoluteValueCollisionResolutionVisible === true &&
    evidence.simpleGlossary.companionPortalPassed === true &&
    evidence.simpleGlossary.typedHostOpenPauseCloseFocusPassed === true &&
    evidence.simpleGlossary.replayResetPassed === true &&
    exact(pauseTransitions.requiredContract,
      inputs.values.successorCompatibilityAudit.value
        .requiredProvisional354BrowserAssertions.glossaryPauseTransitions) &&
    pauseTransitions.liveRunningOpenCloseResultCount === 11 &&
    pauseTransitions.liveInspectedOpenCloseResultCount === 37 &&
    pauseTransitions.runningOpenPausesAndCloseResumesLivePassed === true &&
    pauseTransitions.inspectedOpenCloseRemainsPausedLivePassed === true &&
    pauseTransitions.inspectedSeekFrameAndInspectionIdentityLivePassed ===
      true && pauseTransitions
      .inspectedNextSeekWithoutNormalizationLivePassed === true &&
    pauseTransitions.replayResetLivePassed === true &&
    exact(pauseTransitions.seekRequestObjectIdentityHashBoundStaticTest, {
      helper: inputs.descriptors.glossaryPauseHelper,
      helperTest: inputs.descriptors.glossaryPauseHelperTest,
      exactObjectIdentityRequired: true,
    }) && pauseTransitions
      .blockedAndNestedSnapshotHashBoundStaticContract === true &&
    pauseTransitions.navigationAndResetHashBoundStaticContract === true &&
    pauseTransitions.fullBlockedAndNestedBrowserCoverageClaimed === false &&
    pauseTransitions.fullNavigationResetBrowserCoverageClaimed === false &&
    regressions.placementCount === 2 &&
    exact(regressions.placementIds, PRIOR_HOST_REGRESSION_IDS) &&
    regressions.exactUnicodeInequalityDefinitionVisible === true &&
    regressions.typedHostPauseCloseFocusPassed === true &&
    regressions.replayResetPassed === true &&
    regressions.inlineLegacyPresentationReplayCount === 2 &&
    regressions.companionPresentationClaimed === false &&
    regressions.currentHostPriorCalibratedCoverageClaimed === false &&
    regressions.pages.length === 2 &&
    exact(regressions.pages.map((page) => page.animationId),
      PRIOR_HOST_REGRESSION_IDS) &&
    regressions.pages.every(regressionEvidenceValid) &&
    exact(compatibility.compatibilityAudit,
      inputs.descriptors.successorCompatibilityAudit) &&
    compatibility.exactInverseTransformationPassed === true &&
    compatibility.predecessorCompatibilityRebound === true &&
    compatibility.changedSurfaceBrowserRevalidated === true &&
    compatibility.currentHostBrowserRevalidated === true &&
    compatibility.glossaryPauseTransitionsBrowserRevalidated === true &&
    compatibility.currentHostNewPlacementSampleCount === 12 &&
    compatibility.currentHostPriorGlossaryRegressionCount === 2 &&
    compatibility.fullPrior126Replay === false &&
    compatibility.priorBrowserEvidenceStatus ===
      'retained-historical-exact-old-bridge-evidence' &&
    predecessorReplay.requiredBySuccessorCompatibility === true &&
    predecessorReplay.historicalSampleCount === 92 &&
    predecessorReplay.currentHostPredecessorSampleReplayCount === 92 &&
    predecessorReplay.uniqueCurrentHostPredecessorModuleCount === 92 &&
    predecessorReplay.historicalInitialProgressedReplayCount === 89 &&
    predecessorReplay.historicalSpecialReadyCount === 3 &&
    exact(predecessorReplay.historicalSpecialReadyIds,
      predecessorReplayPlan.specialReadySamples.map((sample) =>
        sample.animationId)) &&
    predecessorReplay.fullHistoricalSpecialInteractionReplay === false &&
    predecessorReplay.currentHostBrowserRevalidated === true &&
    assertExactCurrentHostReplaySet(predecessorSampleIds,
      predecessorReplay.results) &&
    predecessorReplay.results.every(predecessorReplayValid) &&
    introPages.every((page) => evidencePageValid(page,
      inputs.values.introAudit.value, introRecords.get(page.animationId))) &&
    simplePages.every((page) => evidencePageValid(page,
      inputs.values.simpleAudit.value, simpleRecords.get(page.animationId))) &&
    assertExactRequestPolicyEvidence(evidence.observedRequests,
      evidence.requestPolicy, registeredPages) &&
    evidence.requestPolicy.observedRequestCount ===
      evidence.observedRequests.length &&
    evidence.requestPolicy.observedRequestCount > 0 &&
    evidence.requestPolicy.allObservedRequestsLoopback === true &&
    evidence.requestPolicy.allObservedRequestsExplicitlyAllowed === true &&
    evidence.requestPolicy.legacyNetworkOperationsObserved === 0 &&
    evidence.observedRequests.every((request) =>
      explicitlyAllowedProductRequest(request, registeredPages)) &&
    exact(evidence.screenshots.map((item) => item.path),
      expectedScreenshotPaths) &&
    exact(evidence.acceptanceEffects, FALSE_EFFECTS),
  'ALG L11 tranche1 durable browser evidence drifted');
  for (const item of evidence.screenshots) {
    const current = await binding(item.path);
    invariant(current.bytes === item.bytes && current.sha256 === item.sha256,
      `${item.path} screenshot drifted`);
  }
  return evidence;
}

export async function qaG678AlgL11Tranche1Browser({check = false} = {}) {
  const inputs = await currentInputs(check);
  const evidence = check ? await checkEvidence(inputs) :
    await buildEvidence(inputs);
  return Object.freeze({check, evidence: `${OUTPUT}/evidence.json`,
    registeredCurrentJsPages: 354, exactPlacementCount: 12,
    priorCurrentHostRegressionCount: 2,
    historicalInitialProgressedReplayCount: evidence
      .currentHostPredecessorReplay.historicalInitialProgressedReplayCount,
    historicalSpecialReadyCount: evidence.currentHostPredecessorReplay
      .historicalSpecialReadyCount,
    sharedLessonCards: evidence.allLessons.sharedCardCount,
    linkedLessonCards: evidence.allLessons.linkedCardCount,
    completeLessonKeys: evidence.allLessons.completeLessonKeys,
    algL11RegisteredPages: evidence.allLessons.algL11.registeredPageCount,
    screenshotCount: evidence.screenshots.length,
    acceptanceEffects: evidence.acceptanceEffects});
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  const args = process.argv.slice(2);
  invariant(args.length <= 1 && (args.length === 0 || args[0] === '--check'),
    'usage: qa-g678-alg-l11-tranche1-browser.mjs [--check]');
  qaG678AlgL11Tranche1Browser({check: args[0] === '--check'})
    .then((result) => process.stdout.write(`${JSON.stringify(result, null, 2)}\n`))
    .catch((error) => {
      process.stderr.write(`${error.stack ?? error.message}\n`);
      process.exitCode = 1;
    });
}
