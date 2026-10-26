#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {constants as fsConstants} from 'node:fs';
import {copyFile, lstat, readFile, realpath, unlink, writeFile} from
  'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {runInteractive10TrancheCCurrentJs} from
  './build-g678-alg-l11-interactive10-tranche-c-current-js.mjs';
import {runBehavior10TrancheBCurrentJs} from
  './build-g678-alg-l11-behavior10-tranche-b-current-js.mjs';
import {runAdvanced3TrancheDCurrentJs} from
  './build-g678-alg-l11-advanced3-tranche-d-current-js.mjs';
import {freezeG678Final354PrivateCurrentJsRegistryWitness} from
  './freeze-g678-final354-private-current-js-registry-witness.mjs';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
const CALIBRATION_ID = 'g678-16-page-product-calibration-v1';
const PREDECESSOR_FREEZE =
  'catalog/product-bridge-calibrations/g678-current-js-354-page-product-calibrated-registration-v1.json';
const PREDECESSOR_FRAGMENT =
  'catalog/product-bridge-calibrations/g678-current-js-354-page-product-calibrated-registration-v1.fragment.json';
const PREDECESSOR_REGISTRY =
  'catalog/product-bridge-calibrations/g678-final354-private-current-js-registry-witness-v1.json';
const CATALOG = 'catalog/g678-shared-catalog.v1.json';
const PROFILE = 'catalog/g678-shared-source-profile.v1.json';
const BROWSER_BLOCKER =
  'alg-l11-remaining23-browser-product-calibration-pending';
export const OUTPUT_FREEZE =
  'catalog/product-bridge-calibrations/g678-current-js-377-page-registration-v1.json';
export const OUTPUT_FRAGMENT =
  'catalog/product-bridge-calibrations/g678-current-js-377-page-registration-v1.fragment.json';

const TRANCHE = Object.freeze({
  interactive10: Object.freeze({count: 10,
    fragment:
      'catalog/product-bridge-calibrations/g678-alg-l11-interactive10-tranche-c-current-js-v1.fragment.json',
    run:
      'work/g678-shared-page-factory/g678-alg-l11-interactive10-tranche-c-current-js-v1/run-manifest.json',
    inventory:
      'work/g678-shared-page-factory/g678-alg-l11-interactive10-tranche-c-current-js-v1/output-inventory.json',
    fragmentType:
      'g678-alg-l11-interactive10-tranche-c-unregistered-current-js-fragment-v1',
    runType: 'g678-alg-l11-interactive10-tranche-c-current-js-run-v1',
    adapterFamily: 'alg-l11-interactive10-tranche-c-maintained-dom',
    scenario: 'interactive10-tranche-c-unregistered-engineering-candidate',
    complexityLane: 'interactive-understood'}),
  behavior10: Object.freeze({count: 10,
    fragment:
      'catalog/product-bridge-calibrations/g678-alg-l11-behavior10-tranche-b-current-js-v1.fragment.json',
    run:
      'work/g678-shared-page-factory/g678-alg-l11-behavior10-tranche-b-current-js-v1/run-manifest.json',
    inventory:
      'work/g678-shared-page-factory/g678-alg-l11-behavior10-tranche-b-current-js-v1/output-inventory.json',
    fragmentType:
      'g678-alg-l11-behavior10-tranche-b-unregistered-current-js-fragment-v1',
    runType: 'g678-alg-l11-behavior10-tranche-b-current-js-run-v1',
    adapterFamily: 'alg-l11-behavior10-tranche-b-maintained-dom',
    scenario: 'source-static-frame', complexityLane: 'interactive-understood'}),
  advanced3: Object.freeze({count: 3,
    fragment:
      'catalog/product-bridge-calibrations/g678-alg-l11-advanced3-tranche-d-current-js-v1.fragment.json',
    run:
      'work/g678-shared-page-factory/g678-alg-l11-advanced3-tranche-d-current-js-v1/run-manifest.json',
    inventory:
      'work/g678-shared-page-factory/g678-alg-l11-advanced3-tranche-d-current-js-v1/output-inventory.json',
    fragmentType:
      'g678-alg-l11-advanced3-tranche-d-unregistered-current-js-fragment-v1',
    runType: 'g678-alg-l11-advanced3-tranche-d-current-js-run-v1',
    adapterFamily: 'advanced-manual-alg-l11-tranche-d-maintained-dom',
    scenario: 'advanced3-tranche-d-unregistered-engineering-candidate',
    complexityLane: 'behavior-heavy'}),
});

export const PROVISIONAL377_REQUIRED_BINDINGS = Object.freeze({
  predecessorFreeze: Object.freeze({path: PREDECESSOR_FREEZE, bytes: 2190557,
    sha256: 'e10f263fe19a9db3141c23ba2611730eed2e3cf7c495b27aef6e862a8936e850'}),
  predecessorFragment: Object.freeze({path: PREDECESSOR_FRAGMENT, bytes: 245193,
    sha256: 'b3d161b1f499b0cd13f34e50445dbb2d5e049b5b0a0a2020b0d4721f92701c7b'}),
  predecessorRegistry: Object.freeze({path: PREDECESSOR_REGISTRY, bytes: 397841,
    sha256: '2c734cdba9d19efaea00812bffdae5fa2de747972b447b8f86f6f2a0d037d239'}),
  currentBridgeSuccessor: Object.freeze({path:
    'catalog/g678-final354-current-bridge-successor-compatibility-v1.json',
    bytes: 4232,
    sha256: '2b9f3501c97f0d2eb1bc298d093d67417eba89e24e17f5a20e0b67ff8b0f61c1'}),
  interactive10Audit: Object.freeze({path:
    'catalog/g678-alg-l11-interactive10-tranche-c-audit-v1.json', bytes: 400065,
    sha256: '45398b11c513b52bac070fd37303376362e2be0e01fe6b0b4710350c86f56578'}),
  interactive10Run: Object.freeze({path: TRANCHE.interactive10.run, bytes: 392591,
    sha256: '63742b1e9a87829f99971a59d9153b1462dc89170774121ad89ba6b692e4ffb2'}),
  interactive10Inventory: Object.freeze({path: TRANCHE.interactive10.inventory,
    bytes: 2681,
    sha256: 'b6392eb78b894847085f9c760c0c6dd63b51660dbc72f661e3f695f715b22276'}),
  interactive10Fragment: Object.freeze({path: TRANCHE.interactive10.fragment,
    bytes: 24685,
    sha256: 'b0325468e2a1eb5812ced70ccae6bdd02ebf2caf228ce38b8dc007b056ebce5b'}),
  interactive10Core: Object.freeze({path:
    'packages/demos/src/g678-alg-l11-interactive10-tranche-c-core.ts', bytes: 59825,
    sha256: '92ab35656d3e295466c1641145cc9ec6496dbf98dc44cf72707f3553e9369284'}),
  interactive10State: Object.freeze({path:
    'packages/demos/src/g678-alg-l11-interactive10-tranche-c-state.ts', bytes: 11589,
    sha256: '4c9542bd54f3ae5ee2a41a297107fb6a6e3ce597bda5c0b3cad2446502794554'}),
  interactive10Wrappers: Object.freeze({path:
    'packages/demos/src/g678-alg-l11-interactive10-tranche-c-wrappers.tsx',
    bytes: 20341,
    sha256: '662785ff4e16e15b4b6123a287b352c4899aa4a129e786f9aa3f3942106221d4'}),
  interactive10Candidates: Object.freeze({path:
    'packages/demos/src/g678-alg-l11-interactive10-tranche-c-candidates.tsx',
    bytes: 5977,
    sha256: '492b8d9eb4ae44991411a4f7e29e69de522d1ffa3223eb8e04b233f191900c63'}),
  interactive10Generator: Object.freeze({path:
    'scripts/build-g678-alg-l11-interactive10-tranche-c-current-js.mjs',
    bytes: 28039,
    sha256: '7f68f1f185eab63f29f1ca871d6785a8d1c8a9785f851c6240285c4e7be8199e'}),
  behavior10Audit: Object.freeze({path:
    'catalog/g678-alg-l11-behavior10-tranche-b-audit-v1.json', bytes: 139507,
    sha256: '2b45cee5d1503d9e98521b5ca0518500a29f8bc43a0b1c84145016dccc5289b8'}),
  behavior10Decision: Object.freeze({path:
    'catalog/g678-alg-l11-behavior10-tranche-b-source-divergence-v1.json',
    bytes: 23448,
    sha256: 'e4214120ddff6b052487dd339efb4421bdba88cd0532cf448c8200cf1969a89e'}),
  behavior10Run: Object.freeze({path: TRANCHE.behavior10.run, bytes: 27779,
    sha256: '9f56c482167a42f9917d7bf4d62a7510817bb3d5567d5685d0e9ea960b52806c'}),
  behavior10Inventory: Object.freeze({path: TRANCHE.behavior10.inventory,
    bytes: 2673,
    sha256: '041ccc2d38945e603ca5c11532f4853da4faefb82cf398d576c8af7e9dc549fe'}),
  behavior10Fragment: Object.freeze({path: TRANCHE.behavior10.fragment, bytes: 25786,
    sha256: '345576e3b59f968a488c244fe47c9a3c498e70075ff6743b7c93c9f204a15395'}),
  behavior10State: Object.freeze({path:
    'packages/demos/src/g678-alg-l11-behavior10-tranche-b-state.ts', bytes: 34143,
    sha256: '664b790258ff06c6a18189acd3153954accfdd138135282a7557190654f3a492'}),
  behavior10Core: Object.freeze({path:
    'packages/demos/src/g678-alg-l11-behavior10-tranche-b-candidate-core.tsx',
    bytes: 15825,
    sha256: '1e87c5320cde77bc06e81c7f28d9d3a58e6e58a425a5e346f43530141d75be57'}),
  behavior10Tutorial: Object.freeze({path:
    'packages/demos/src/g678-alg-l11-behavior10-tranche-b-tutorial-candidate.tsx',
    bytes: 606,
    sha256: '0d980da48db1b2a3d82079d99bc67b2a33067e657b175b3a2d95b78a255c1d98'}),
  behavior10Guided: Object.freeze({path:
    'packages/demos/src/g678-alg-l11-behavior10-tranche-b-guided-candidate.tsx',
    bytes: 662,
    sha256: '102a2969a749a36ed8784cf6c7d389c994427257e703a250372db2b0bb11be19'}),
  behavior10Candidates: Object.freeze({path:
    'packages/demos/src/g678-alg-l11-behavior10-tranche-b-candidates.tsx',
    bytes: 2494,
    sha256: '165580c6eb79458ef5c9cdab20db64b859d3a97b882a821ba5fdd6d6bdb1f29c'}),
  behavior10Generator: Object.freeze({path:
    'scripts/build-g678-alg-l11-behavior10-tranche-b-current-js.mjs', bytes: 30544,
    sha256: 'ef8512d2ec018d2a00f4097faef335b658aa86a83ff8b9cf3e0fc87710fb3a0d'}),
  advanced3Audit: Object.freeze({path:
    'catalog/g678-alg-l11-advanced3-tranche-d-audit-v1.json', bytes: 151200,
    sha256: '03e9ba9bb7af3baa2df8bc1792834bd74ca502a56bc041f3a8860dc51dffec42'}),
  advanced3Run: Object.freeze({path: TRANCHE.advanced3.run, bytes: 152404,
    sha256: '502c0ee2e71e94c97db4f5223dc990e35a6a3f281c9c59d8b73c2c2025ff06c5'}),
  advanced3Inventory: Object.freeze({path: TRANCHE.advanced3.inventory, bytes: 953,
    sha256: '42d1d98103493db59ca33268b0799f217825fbc38dbb77bf9d5c752d32c8ac6a'}),
  advanced3Fragment: Object.freeze({path: TRANCHE.advanced3.fragment, bytes: 8124,
    sha256: 'c62cb3164735b062d2f24b593999c61fb7d44e9e3c02c7d621e990eb6166b6fa'}),
  advanced3State: Object.freeze({path:
    'packages/demos/src/g678-alg-l11-advanced3-tranche-d-state.ts', bytes: 20756,
    sha256: '7c604771e89366c65b37be255880d95360ac8cc693eec80272eab14bc75d56b6'}),
  advanced3Candidates: Object.freeze({path:
    'packages/demos/src/g678-alg-l11-advanced3-tranche-d-candidates.tsx',
    bytes: 16065,
    sha256: 'bd602c53b7d3a730a6b6f8b825f1eb1fe3ddb927eaa9035c79e12853ff13bd70'}),
  advanced3Generator: Object.freeze({path:
    'scripts/build-g678-alg-l11-advanced3-tranche-d-current-js.mjs', bytes: 26794,
    sha256: 'c2803dac09851f981fe37887ba09330cd18e77208c584b6a1d01ae451eed09d3'}),
});

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}
function sha256(bytes) { return createHash('sha256').update(bytes).digest('hex'); }
function stableBytes(value) { return Buffer.from(`${JSON.stringify(value, null, 2)}\n`); }
function exact(left, right) { return JSON.stringify(left) === JSON.stringify(right); }
function allFalse(value) {
  return value && Object.values(value).length > 0 &&
    Object.values(value).every((item) => item === false);
}
function absolute(relativePath, root = ROOT) {
  const normalizedRoot = path.resolve(root);
  const target = path.resolve(normalizedRoot, relativePath);
  invariant(target.startsWith(`${normalizedRoot}${path.sep}`),
    `${relativePath} escapes project root`);
  return target;
}
async function binding(relativePath, json = false, root = ROOT) {
  const target = absolute(relativePath, root);
  const [canonical, before] = await Promise.all([
    realpath(target), lstat(target, {bigint: true}),
  ]);
  invariant(canonical === target && before.isFile() &&
    !before.isSymbolicLink() && before.nlink === 1n,
  `${relativePath} must be one canonical ordinary file`);
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

export function assertProvisional377RequiredBinding(label, actual) {
  invariant(PROVISIONAL377_REQUIRED_BINDINGS[label] &&
    exact(actual, PROVISIONAL377_REQUIRED_BINDINGS[label]),
  `provisional377 ${label} binding drifted`);
  return true;
}

function registryMatchesPredecessor(registry, freeze, fragment) {
  const calibration = registry.calibrations?.filter((item) =>
    item.calibrationId === CALIBRATION_ID);
  invariant(registry.schemaVersion === 2 &&
    registry.registryScope === 'private-engineering' &&
    calibration?.length === 1 && calibration[0].entries.length === 354 &&
    calibration[0].freezeManifest === PREDECESSOR_FREEZE &&
    calibration[0].freezeManifestBytes === freeze.bytes &&
    calibration[0].freezeManifestSha256 === freeze.sha256 &&
    exact(calibration[0].entries.map(({artifacts: ignored, ...entry}) => entry),
      fragment.value.calibration.entries.map(
        ({artifacts: ignored, ...entry}) => entry)),
  'provisional377 predecessor registry is not exact final354');
}

export function maintainedDomBinding(entry, runBinding) {
  invariant(entry?.key && entry.maturity === 'private-current-js' &&
    entry.registrationCandidate === false &&
    entry.currentJavaScriptRegistered === false &&
    entry.moduleFile?.path && entry.timeline?.path &&
    entry.memberManifest?.path,
  `${entry?.key ?? 'unknown'}: maintained DOM entry boundary drifted`);
  return Object.freeze({kind: 'maintained-dom-module-v1',
    module: entry.moduleFile, timeline: entry.timeline,
    memberManifest: entry.memberManifest, sourceRun: runBinding});
}

async function validateTranche(name, config, values) {
  const {fragment, run, inventory} = values;
  invariant(fragment.value.artifactType === config.fragmentType &&
    fragment.value.deploymentScope === 'local-only' &&
    fragment.value.exactPlacementCount === config.count &&
    fragment.value.generatedPlacementCount === config.count &&
    fragment.value.entries.length === config.count &&
    fragment.value.registryEntriesWritten === 0 &&
    fragment.value.registrationCandidatePlacementCount === 0 &&
    fragment.value.currentJavaScriptRegisteredCount === 0 &&
    fragment.value.productCalibrationPassed === false &&
    fragment.value.browserProductCalibrationPassed === false &&
    fragment.value.wholeLessonEngineeringPreviewCount === 0 &&
    fragment.value.releaseAuthorized === false &&
    fragment.value.published === false &&
    fragment.value.scaleOutAuthorized === false &&
    allFalse(fragment.value.acceptanceEffects) &&
    exact(fragment.value.compilerRun, descriptor(run)) &&
    run.value.artifactType === config.runType &&
    run.value.deploymentScope === 'local-only' &&
    run.value.exactPlacementCount === config.count &&
    run.value.generatedTimelineCount === config.count &&
    run.value.generatedModuleCount === config.count &&
    run.value.registryEntriesWritten === 0 &&
    run.value.registrationCandidatePlacementCount === 0 &&
    run.value.currentJavaScriptRegisteredPlacementCount === 0 &&
    run.value.productCalibrationPassed === false &&
    run.value.browserProductCalibrationPassed === false &&
    run.value.wholeLessonEngineeringPreviewReady === false &&
    allFalse(run.value.acceptanceEffects) &&
    exact(run.value.outputInventory, descriptor(inventory)),
  `provisional377 ${name} run/fragment boundary drifted`);
  const runById = new Map(run.value.members.map((member) =>
    [member.animationId, member]));
  const records = [];
  for (const entry of fragment.value.entries) {
    const member = runById.get(entry.key);
    invariant(member && exact(member.moduleFile, entry.moduleFile) &&
      exact(member.timeline, entry.timeline) &&
      exact(member.memberManifest, entry.memberManifest),
    `${entry.key}: fragment/run maintained DOM binding drifted`);
    const files = await Promise.all([binding(entry.moduleFile.path),
      binding(entry.timeline.path), binding(entry.memberManifest.path, true)]);
    for (let index = 0; index < files.length; index += 1) {
      const expected = [entry.moduleFile, entry.timeline,
        entry.memberManifest][index];
      invariant(exact(descriptor(files[index]), expected),
        `${entry.key}: maintained DOM artifact bytes drifted`);
    }
    records.push(Object.freeze({entry, member,
      rendererBinding: maintainedDomBinding(entry, descriptor(run))}));
  }
  invariant(records.length === config.count &&
    new Set(records.map((record) => record.entry.key)).size === config.count,
  `provisional377 ${name} membership drifted`);
  return Object.freeze(records);
}

function pageMap(catalog) {
  return new Map(catalog.lessons.flatMap((lesson) => lesson.pages.map((page) =>
    [page.animationId, {lesson, page}])));
}

function selectedPage(record, config, catalogEntry) {
  const {entry, member, rendererBinding} = record;
  const {lesson, page} = catalogEntry;
  invariant(page.animationId === entry.key && page.placementId === entry.key &&
    page.sourceSha256 === entry.source.sha256 &&
    entry.mainTimeline?.frameDomain &&
    Number.isSafeInteger(entry.mainTimeline.frameCount),
  `${entry.key}: maintained DOM source/catalog identity drifted`);
  return Object.freeze({animationId: entry.key, placementId: entry.key,
    assetId: page.assetId, moduleCode: lesson.moduleCode,
    lessonNumber: lesson.lessonNumber, stableLessonKey: lesson.stableLessonKey,
    globalPageOrdinal: page.globalOrdinal, sectionCode: page.sectionCode,
    sectionPageOrdinal: page.sectionPageOrdinal, sourceSha256: page.sourceSha256,
    complexityLane: entry.complexityLane ?? config.complexityLane,
    adapterFamily: config.adapterFamily,
    implementation: Object.freeze({kind: 'maintained-dom-current-js-candidate',
      deploymentScope: 'local-only', sourceBoundStateMachineImplemented: true,
      familyVisualPlaybackCalibrationPassed: false,
      productCalibrationPassed: false}),
    runtime: Object.freeze({stage: Object.freeze({width: 800, height: 600}),
      rootFrameCount: 10, rootBeginFrame: 6,
      frameDomain: entry.mainTimeline.frameDomain,
      frameCount: entry.mainTimeline.frameCount,
      livePlaybackEndFrame: entry.mainTimeline.terminalFrame ??
        entry.mainTimeline.frameCount,
      language: 'fixed-en', scenario: config.scenario, seed: '0',
      rendererBinding}),
    runtimeEvidenceBoundary: Object.freeze({
      runtimeKind: 'source-script-bound-product-behavior-current-js-candidate',
      actionScriptExecution: 'not-executed',
      naturalTraceValidation: 'not-established',
      audioAcceptance: 'not-established',
      replaySemantics:
        'product-complete-interaction-reset-original-runtime-parity-not-established'}),
    sourceCandidateBlockers: Object.freeze(member.productBlockers ?? []),
    productBlockers: Object.freeze([BROWSER_BLOCKER,
      'source-audio-lifecycle-and-listening-acceptance-pending',
      'authoritative-original-runtime-not-established',
      'visual-fidelity-not-accepted']),
    productCalibrationPassed: false, engineeringPreviewReady: false});
}

export async function prepareG678AlgL11Remaining23Provisional377Registration() {
  const [checks, registryWitnessCheck] = await Promise.all([Promise.all([
    runInteractive10TrancheCCurrentJs({check: true}),
    runBehavior10TrancheBCurrentJs({check: true}),
    runAdvanced3TrancheDCurrentJs({check: true}),
  ]), freezeG678Final354PrivateCurrentJsRegistryWitness({check: true})]);
  invariant(checks.every((result) => result.check === true &&
    result.currentJavaScriptRegisteredCount === 0) &&
    registryWitnessCheck.check === true &&
    registryWitnessCheck.exactFinal354RegistrationCount === 354,
  'provisional377 generator admission failed');
  const expectedEntries = Object.entries(PROVISIONAL377_REQUIRED_BINDINGS);
  const inputValues = Object.fromEntries(await Promise.all(expectedEntries.map(
    async ([label, expected]) => {
      const value = await binding(expected.path,
        expected.path.endsWith('.json'));
      assertProvisional377RequiredBinding(label, descriptor(value));
      return [label, value];
    })));
  const [catalog, profile, builder] = await Promise.all([
    binding(CATALOG, true), binding(PROFILE, true),
    binding(path.relative(ROOT, SCRIPT_PATH)),
  ]);
  const predecessor = inputValues.predecessorFreeze;
  const predecessorFragment = inputValues.predecessorFragment;
  const successor = inputValues.currentBridgeSuccessor.value;
  invariant(successor.artifactType ===
      'g678-final354-current-bridge-successor-compatibility-v1' &&
    successor.exactInverseTransformation?.exactMatch === true &&
    successor.final354Compatibility?.exactDescriptorInvariantCount === 354 &&
    successor.final354Compatibility
      ?.historicalProductHostCalibratedPlacementCount === 138 &&
    successor.final354Compatibility?.currentHostBrowserRevalidated === false &&
    successor.requiredProvisional377BrowserAssertions
      ?.predecessorSamplesMustBeReplayed === true &&
    successor.requiredProvisional377BrowserAssertions
      ?.predecessorReplayCount === 104 &&
    successor.requiredProvisional377BrowserAssertions
      ?.exactMaintainedDomRendererCount === 23 &&
    allFalse(successor.acceptanceEffects),
  'provisional377 current bridge successor compatibility drifted');
  invariant(predecessor.value.calibrationId === CALIBRATION_ID &&
    predecessor.value.status ===
      'private-current-js-product-host-calibrated-candidates-registered' &&
    predecessor.value.selectedPages.length === 354 &&
    predecessor.value.registrationCandidatePlacementCount === 354 &&
    predecessorFragment.value.calibration.entries.length === 354 &&
    predecessorFragment.value.calibration.freezeManifest === PREDECESSOR_FREEZE &&
    exact(predecessorFragment.value.freeze, descriptor(predecessor)) &&
    allFalse(predecessor.value.acceptanceEffects),
  'provisional377 final354 predecessor drifted');
  registryMatchesPredecessor(inputValues.predecessorRegistry.value,
    predecessor, predecessorFragment);
  const trancheRecords = await Promise.all(Object.entries(TRANCHE).map(
    async ([name, config]) => [name, await validateTranche(name, config, {
      fragment: inputValues[`${name}Fragment`],
      run: inputValues[`${name}Run`],
      inventory: inputValues[`${name}Inventory`],
    })]));
  const pages = pageMap(catalog.value);
  const addedPages = [];
  const newEntries = [];
  for (const [name, records] of trancheRecords) {
    const config = TRANCHE[name];
    for (const record of records) {
      const catalogEntry = pages.get(record.entry.key);
      invariant(catalogEntry,
        `${record.entry.key}: maintained DOM catalog page missing`);
      addedPages.push(selectedPage(record, config, catalogEntry));
      newEntries.push(Object.freeze({key: record.entry.key,
        module: record.entry.module, maturity: 'private-current-js',
        complexityLane: record.entry.complexityLane ?? config.complexityLane,
        artifacts: record.rendererBinding}));
    }
  }
  const addedIds = addedPages.map((page) => page.animationId).sort();
  invariant(addedPages.length === 23 && new Set(addedIds).size === 23 &&
    addedIds.every((id) => id.startsWith('shared-alg001-l11-')) &&
    predecessor.value.selectedPages.every((page) => !addedIds.includes(
      page.animationId)),
  'provisional377 exact23 membership/overlap drifted');
  const selectedPages = [...predecessor.value.selectedPages, ...addedPages]
    .sort((left, right) => left.animationId.localeCompare(right.animationId));
  const selectedByLesson = new Map();
  for (const page of selectedPages) {
    const values = selectedByLesson.get(page.stableLessonKey) ?? [];
    values.push(page.animationId); selectedByLesson.set(page.stableLessonKey,
      values);
  }
  const completeLessonKeys = catalog.value.lessons.filter((lesson) =>
    (selectedByLesson.get(lesson.stableLessonKey)?.length ?? 0) ===
      lesson.activePageCount).map((lesson) => lesson.stableLessonKey);
  invariant(selectedPages.length === 377 &&
    new Set(selectedPages.map((page) => page.animationId)).size === 377 &&
    selectedPages.filter((page) => page.stableLessonKey ===
      'shared-alg001-l11').length === 44 &&
    exact(completeLessonKeys, ['shared-alg001-l09', 'shared-alg001-l11']) &&
    addedPages.every((page) => page.productBlockers[0] === BROWSER_BLOCKER &&
      page.implementation.familyVisualPlaybackCalibrationPassed === false &&
      page.productCalibrationPassed === false &&
      page.engineeringPreviewReady === false),
  'provisional377 combined registration/lesson boundary drifted');
  const selectionAuthorities = new Map();
  for (const authority of [
    ...predecessor.value.inputs.selectionAuthorities,
    descriptor(inputValues.interactive10Fragment),
    descriptor(inputValues.behavior10Fragment),
    descriptor(inputValues.advanced3Fragment),
  ]) {
    const prior = selectionAuthorities.get(authority.path);
    invariant(!prior || exact(prior, authority),
      `provisional377 selection authority conflict: ${authority.path}`);
    selectionAuthorities.set(authority.path, authority);
  }
  invariant(selectionAuthorities.size ===
    predecessor.value.inputs.selectionAuthorities.length + 3,
  'provisional377 selection authority denominator drifted');
  const acceptanceEffects = Object.freeze({...predecessor.value.acceptanceEffects});
  invariant(allFalse(acceptanceEffects),
    'provisional377 acceptance effects drifted');
  const freeze = {
    schemaVersion: 1, calibrationId: CALIBRATION_ID,
    deploymentScope: 'local-only',
    status: 'private-current-js-calibration-candidates-generated',
    frozenCalibrationPlacementCount: 2282,
    registrationCandidatePlacementCount: 377,
    sharedAdapterPlacementCount: 365, advancedManualPlacementCount: 12,
    legacyFlashCourseShellCount: 0, scaleOutAuthorized: false,
    engineeringPreviewReady: false, productCalibrationPassed: false,
    inputs: {...predecessor.value.inputs,
      sharedCatalog: descriptor(catalog), sourceProfile: descriptor(profile),
      selectionAuthorities: [...selectionAuthorities.values()],
      predecessorFreeze: descriptor(predecessor),
      predecessorFragment: descriptor(predecessorFragment),
      predecessorRegistry: descriptor(inputValues.predecessorRegistry),
      algL11Remaining23: Object.freeze(Object.fromEntries(expectedEntries
        .filter(([label]) => !label.startsWith('predecessor'))
        .map(([label]) => [label, descriptor(inputValues[label])]))),
      finalizer: descriptor(builder)},
    selectedPages, pendingAdvancedManualPlacements: [], acceptanceEffects,
    productHostCalibration: Object.freeze({
      historicalProductHostCalibratedPlacementCount: 138,
      historicalFamilyCalibrationCount: 22,
      currentHostBrowserRevalidated: false,
      requiredCurrentHostPredecessorReplayCount: 104,
      registeredCompleteLessonCount: 2,
      productCalibratedWholeLessonEngineeringPreviewCount: 1,
      newWholeLessonEngineeringPreviewCount: 0,
      overallG678ProductCalibrationPassed: false}),
    limitations: [
      '377 private Current-JS registrations complete ALG L9 and ALG L11 at the registration layer, but only ALG L9 retains a product-calibrated whole-lesson engineering preview.',
      'The exact new 23 maintained DOM modules are browser and family calibration pending; no current-host revalidation is claimed.',
      'The final354 predecessor pages and their historical 138 product-host calibrations remain byte-semantic predecessors; future browser QA must replay all 104 current-host records.',
      'Audio, authoritative original runtime, fidelity, human, Owner, strict completion, release, and publication remain false.',
    ],
  };
  const freezeBytes = stableBytes(freeze);
  const entries = [...predecessorFragment.value.calibration.entries,
    ...newEntries].sort((left, right) => left.key.localeCompare(right.key));
  invariant(entries.length === 377 &&
    new Set(entries.map((entry) => entry.key)).size === 377,
  'provisional377 registry entry membership drifted');
  const fragment = {schemaVersion: 1,
    artifactType: 'private-current-js-calibration-fragment-v1',
    calibration: {calibrationId: CALIBRATION_ID, deploymentScope: 'local-only',
      freezeManifest: OUTPUT_FREEZE, entries},
    freeze: {path: OUTPUT_FREEZE, bytes: freezeBytes.length,
      sha256: sha256(freezeBytes)},
    descriptorProjection: {registrationCandidatePlacementCount: 377,
      frozenCalibrationPlacementCount: 2282, affectedLessonCount: 44,
      registeredCompleteLessonCount: 2,
      exactRegisteredCompleteLessonKeys: completeLessonKeys,
      wholeLessonEngineeringPreviewCount: 1,
      newWholeLessonEngineeringPreviewCount: 0,
      productCalibratedCompleteLessonKeys: ['shared-alg001-l09'],
      algL11RegisteredPageCount: 44, algL11ActivePageCount: 44,
      sourceOrderedLessonMembershipRequired: true,
      modernMyLessonHostRequired: true, engineeringPreviewReady: false},
    tranche: {exactNewPlacementCount: 23, interactive10PlacementCount: 10,
      behavior10PlacementCount: 10, advanced3PlacementCount: 3,
      predecessorOverlap: 0, maintainedDomModulePlacementCount: 23,
      browserProductCalibrationPassed: false,
      familyVisualPlaybackCalibrationPassed: false},
    registrationBoundary: {exactRegisteredPlacementCount: 377,
      exactPredecessorPlacementCountPreserved: 354,
      exactNewMaintainedDomPlacementCount: 23,
      algL11RegisteredPageCount: 44, algL11ActivePageCount: 44,
      registeredCompleteLessonCount: 2,
      wholeLessonEngineeringPreviewCount: 1,
      newWholeLessonEngineeringPreviewCount: 0,
      releaseOrPublicationAuthorized: false},
    acceptanceEffects, limitations: freeze.limitations};
  return Object.freeze({freeze, fragment, freezeBytes,
    fragmentBytes: stableBytes(fragment)});
}

async function writeExclusive(relativePath, bytes, root = ROOT) {
  const target = absolute(relativePath, root);
  const temporary = `${target}.tmp-${process.pid}-${Date.now()}`;
  await writeFile(temporary, bytes, {flag: 'wx'});
  try { await copyFile(temporary, target, fsConstants.COPYFILE_EXCL); }
  finally { await unlink(temporary).catch(() => {}); }
}

export async function finalizeG678AlgL11Remaining23Provisional377Registration(
  {check = false, outputRoot = ROOT} = {},
) {
  const artifacts =
    await prepareG678AlgL11Remaining23Provisional377Registration();
  if (check) {
    const [freeze, fragment] = await Promise.all([
      binding(OUTPUT_FREEZE, false, outputRoot),
      binding(OUTPUT_FRAGMENT, false, outputRoot),
    ]);
    invariant(freeze.buffer.equals(artifacts.freezeBytes) &&
      fragment.buffer.equals(artifacts.fragmentBytes),
    'provisional377 artifacts drifted');
  } else {
    await writeExclusive(OUTPUT_FREEZE, artifacts.freezeBytes, outputRoot);
    try {
      await writeExclusive(OUTPUT_FRAGMENT, artifacts.fragmentBytes, outputRoot);
    }
    catch (error) {
      const current = await binding(OUTPUT_FREEZE, false, outputRoot)
        .catch(() => null);
      if (current?.buffer.equals(artifacts.freezeBytes)) {
        await unlink(absolute(OUTPUT_FREEZE, outputRoot));
      }
      throw error;
    }
  }
  return Object.freeze({check, registrationCandidatePlacementCount: 377,
    frozenCalibrationPlacementCount: 2282, affectedLessonCount: 44,
    algL11RegisteredPageCount: 44, algL11ActivePageCount: 44,
    registeredCompleteLessonCount: 2, wholeLessonEngineeringPreviewCount: 1,
    newWholeLessonEngineeringPreviewCount: 0, productCalibrationPassed: false,
    freeze: {path: OUTPUT_FREEZE, bytes: artifacts.freezeBytes.length,
      sha256: sha256(artifacts.freezeBytes)},
    fragment: {path: OUTPUT_FRAGMENT, bytes: artifacts.fragmentBytes.length,
      sha256: sha256(artifacts.fragmentBytes)}});
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  const args = process.argv.slice(2);
  invariant(args.length <= 1 && (args.length === 0 || args[0] === '--check'),
    'usage: finalize-g678-alg-l11-remaining23-provisional377-registration.mjs [--check]');
  finalizeG678AlgL11Remaining23Provisional377Registration({
    check: args.includes('--check'),
  }).then((result) => process.stdout.write(`${JSON.stringify(result, null, 2)}\n`))
    .catch((error) => {
      process.stderr.write(`${error.stack ?? error.message}\n`);
      process.exitCode = 1;
    });
}
