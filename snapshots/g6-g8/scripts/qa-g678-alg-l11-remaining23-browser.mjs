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
const OUTPUT = 'output/playwright/g678-alg-l11-remaining23-377-v1';
const FINAL354_AGGREGATE =
  'output/playwright/g678-current-js-354-v1/evidence.json';
const FINAL354_AGGREGATE_SHA256 =
  '6e8a3beab7433a662d38b263e43749a1ee146a54558b47d698b742521cd7571e';
const CATALOG = 'catalog/g678-shared-catalog.v1.json';
const A_AUDIT = 'catalog/g678-alg-l11-interactive10-tranche-c-audit-v1.json';
const A_AUDIT_SHA256 =
  '45398b11c513b52bac070fd37303376362e2be0e01fe6b0b4710350c86f56578';
const A_RUN_SHA256 =
  '63742b1e9a87829f99971a59d9153b1462dc89170774121ad89ba6b692e4ffb2';
const A_INVENTORY_SHA256 =
  'b6392eb78b894847085f9c760c0c6dd63b51660dbc72f661e3f695f715b22276';
const A_FRAGMENT_SHA256 =
  'b0325468e2a1eb5812ced70ccae6bdd02ebf2caf228ce38b8dc007b056ebce5b';
const B_AUDIT = 'catalog/g678-alg-l11-behavior10-tranche-b-audit-v1.json';
const B_AUDIT_SHA256 =
  '2b45cee5d1503d9e98521b5ca0518500a29f8bc43a0b1c84145016dccc5289b8';
const B_DECISION =
  'catalog/g678-alg-l11-behavior10-tranche-b-source-divergence-v1.json';
const B_DECISION_SHA256 =
  'e4214120ddff6b052487dd339efb4421bdba88cd0532cf448c8200cf1969a89e';
const B_RUN_SHA256 =
  '9f56c482167a42f9917d7bf4d62a7510817bb3d5567d5685d0e9ea960b52806c';
const B_INVENTORY_SHA256 =
  '041ccc2d38945e603ca5c11532f4853da4faefb82cf398d576c8af7e9dc549fe';
const B_FRAGMENT_SHA256 =
  '345576e3b59f968a488c244fe47c9a3c498e70075ff6743b7c93c9f204a15395';
const D_AUDIT = 'catalog/g678-alg-l11-advanced3-tranche-d-audit-v1.json';
const D_AUDIT_SHA256 =
  '03e9ba9bb7af3baa2df8bc1792834bd74ca502a56bc041f3a8860dc51dffec42';
const D_RUN_SHA256 =
  '502c0ee2e71e94c97db4f5223dc990e35a6a3f281c9c59d8b73c2c2025ff06c5';
const D_INVENTORY_SHA256 =
  '42d1d98103493db59ca33268b0799f217825fbc38dbb77bf9d5c752d32c8ac6a';
const D_FRAGMENT_SHA256 =
  'c62cb3164735b062d2f24b593999c61fb7d44e9e3c02c7d621e990eb6166b6fa';
const PENDING_BLOCKER =
  'alg-l11-remaining23-browser-product-calibration-pending';

export const A_IDS = Object.freeze([
  'shared-alg001-l11-p006', 'shared-alg001-l11-p008',
  'shared-alg001-l11-p009', 'shared-alg001-l11-p010',
  'shared-alg001-l11-p011', 'shared-alg001-l11-p014',
  'shared-alg001-l11-p019', 'shared-alg001-l11-p020',
  'shared-alg001-l11-p021', 'shared-alg001-l11-p025',
]);
export const A_CHOICE_IDS = Object.freeze(A_IDS.filter((id) =>
  !['shared-alg001-l11-p006', 'shared-alg001-l11-p009',
    'shared-alg001-l11-p010'].includes(id)));
export const A_TWO_TRY_IDS = Object.freeze([
  'shared-alg001-l11-p009', 'shared-alg001-l11-p010',
]);
export const B_IDS = Object.freeze([
  'shared-alg001-l11-p026', 'shared-alg001-l11-p027',
  'shared-alg001-l11-p028', 'shared-alg001-l11-p029',
  'shared-alg001-l11-p030', 'shared-alg001-l11-p031',
  'shared-alg001-l11-p032', 'shared-alg001-l11-p040',
  'shared-alg001-l11-p041', 'shared-alg001-l11-p042',
]);
export const B_GUIDED_IDS = Object.freeze(B_IDS.slice(7));
export const D_IDS = Object.freeze([
  'shared-alg001-l11-p033', 'shared-alg001-l11-p034',
  'shared-alg001-l11-p044',
]);
export const IDS = Object.freeze([...A_IDS, ...B_IDS, ...D_IDS]);

function exactAnimationIdSelector(animationId) {
  invariant(IDS.includes(animationId), 'exact23 animation ID drifted');
  return `[data-animation-id="${animationId}"]`;
}

export function exactPrivateCandidateSelector(animationId) {
  return `${exactAnimationIdSelector(animationId)}` +
    '[data-private-current-js="true"]';
}

export function exactPrivateTwoTryCandidateSelector(animationId) {
  invariant(A_TWO_TRY_IDS.includes(animationId),
    'two-try animation ID drifted');
  return exactPrivateCandidateSelector(animationId);
}

const TWO_TRY_REPLAY_DOM_KEYS = Object.freeze([
  'animationId', 'privateCurrentJs', 'nestedFrame', 'sourceCount',
]);

export function selectExactPrivateTwoTryReplayCandidate(snapshots,
  animationId) {
  invariant(Array.isArray(snapshots) && snapshots.length > 0 &&
    snapshots.every((snapshot) => exactKeys(snapshot,
      TWO_TRY_REPLAY_DOM_KEYS) && snapshot.animationId === animationId),
  `${animationId} two-try Replay DOM snapshot drifted`);
  const privateCandidates = snapshots.filter((snapshot) =>
    snapshot.privateCurrentJs === 'true');
  invariant(privateCandidates.length === 1 &&
    privateCandidates[0].nestedFrame === '1' &&
    privateCandidates[0].sourceCount === '0',
  `${animationId} exact private two-try Replay candidate drifted`);
  return privateCandidates[0];
}

const B_SEEK_DOM_KEYS = Object.freeze([
  'animationId', 'privateCurrentJs', 'activeStopFrame', 'activePhase',
]);

export function selectExactPrivateBSeekCandidate(snapshots, animationId,
  targetFrame, expectedPhase) {
  invariant(B_IDS.includes(animationId) && Number.isSafeInteger(targetFrame) &&
    targetFrame > 0 && (expectedPhase === 'guided-stop' ||
      expectedPhase === 'choosing') && Array.isArray(snapshots) &&
    snapshots.length > 0 && snapshots.every((snapshot) =>
      exactKeys(snapshot, B_SEEK_DOM_KEYS) &&
      snapshot.animationId === animationId),
  `${animationId} B seek DOM snapshot drifted`);
  const privateCandidates = snapshots.filter((snapshot) =>
    snapshot.privateCurrentJs === 'true');
  invariant(privateCandidates.length === 1 &&
    privateCandidates[0].activeStopFrame === String(targetFrame) &&
    privateCandidates[0].activePhase === expectedPhase,
  `${animationId} exact private B seek candidate drifted`);
  return privateCandidates[0];
}

const B_SEEK_RUNTIME_KEYS = Object.freeze([
  'runtimePaused', 'interactiveStopHeld',
]);

export function assertBSeekResumeRuntime(snapshot) {
  invariant(exactKeys(snapshot, B_SEEK_RUNTIME_KEYS) &&
    snapshot.runtimePaused === 'false' &&
    snapshot.interactiveStopHeld === 'true',
  'B seek resume runtime drifted');
  return true;
}

const A_VISIBLE_MATH = Object.freeze({
  'shared-alg001-l11-p008': Object.freeze({correct: 'B',
    labels: Object.freeze({A: 'x > −3', B: '−3 < x < 3', C: 'x < 3'})}),
  'shared-alg001-l11-p011': Object.freeze({correct: 'C',
    labels: Object.freeze({A: 'x < 2', B: 'x < 10', C: 'x ≥ 2',
      D: 'x ≤ 10'})}),
  'shared-alg001-l11-p014': Object.freeze({correct: 'D',
    labels: Object.freeze({A: 'age = 16', B: 'age < 16', C: '16 > age',
      D: 'age ≥ 16'})}),
  'shared-alg001-l11-p019': Object.freeze({correct: 'A',
    labels: Object.freeze({A: 'x ≤ 2', B: 'x ≤ 5',
      C: 'source alternate number-line graph'}),
    graph: Object.freeze({boundary: 2, closed: true, direction: 'left'})}),
  'shared-alg001-l11-p020': Object.freeze({correct: 'B',
    labels: Object.freeze({A: 'x ≥ 6', B: 'x ≥ 2', C: 'x ≥ 3'}),
    graph: Object.freeze({boundary: 2, closed: true, direction: 'right'})}),
  'shared-alg001-l11-p021': Object.freeze({correct: 'B',
    labels: Object.freeze({A: 'x > 5', B: 'x > −5',
      C: 'source alternate number-line graph'}),
    graph: Object.freeze({boundary: -5, closed: false,
      direction: 'right'})}),
  'shared-alg001-l11-p025': Object.freeze({correct: 'B',
    labels: Object.freeze({A: 'x > −7', B: '−7 < x < 7', C: 'x < 7'})}),
});

const FALSE_EFFECTS = Object.freeze({
  currentJavaScriptRegistered: false,
  registrationCandidate: false,
  productCalibrationPassed: false,
  browserCalibrationPassed: false,
  engineeringPreviewReady: false,
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
const FINAL354_FALSE_EFFECTS = Object.freeze({
  authoritativeOriginalRuntime: false, behaviorAccepted: false,
  visualFidelityAccepted: false, audioAccepted: false,
  humanVisualAccepted: false, ownerAccepted: false, strictComplete: false,
  releaseEligible: false, released: false, published: false,
});

const STABLE_INTEGRATION_BINDINGS = Object.freeze({
  registrationFreeze: Object.freeze({path:
    'catalog/product-bridge-calibrations/g678-current-js-377-page-registration-v1.json',
  bytes: 2275220,
  sha256: '16a8e04786520f62e1e5a833cb9b23aa0e9c25c5e2c1a610970c4774e1bae646'}),
  registrationFragment: Object.freeze({path:
    'catalog/product-bridge-calibrations/g678-current-js-377-page-registration-v1.fragment.json',
  bytes: 276582,
  sha256: '9b0e4f2a84882ab499154d77fa2831581665487182adf256683d8de04ea3efa4'}),
  registrationFinalizer: Object.freeze({path:
    'scripts/finalize-g678-alg-l11-remaining23-provisional377-registration.mjs',
  bytes: 32325,
  sha256: '19d19fe525e98d3d27650ab3c171e40ce05fc46e1342095b77b95ba5beb4889e'}),
  privateRegistry: Object.freeze({path:
    'packages/demos/private-current-js-registry.json', bytes: 430979,
  sha256: 'bdae8f916495a80d13dd1e02282c21f6de25a8f45247ddb1207b410fc68b9212'}),
  localLoader: Object.freeze({path:
    'packages/demos/src/registry.local-only.generated.ts', bytes: 280168,
  sha256: '15a6d26e5e76cf8c0dad3dfca8c888ea762a47c552b47143bedd1155dc7bd9d6'}),
  localRegistry: Object.freeze({path:
    'packages/demos/src/registry.local-only.metadata.generated.ts',
  bytes: 217516,
  sha256: 'd8a67066f4363dd1b44798c46daf8340d24621ab81442ba688f051c2aa56c87f'}),
  productBridge: Object.freeze({path:
    'apps/web/lib/g678-calibration-product-bridge.server.ts', bytes: 164966,
  sha256: 'aaafb613a1640d0b9813af43430d50fd4671febd058c0327bd2da7b20ed11fbd'}),
  descriptorPlayer: Object.freeze({path:
    'apps/web/components/descriptor-driven-whole-lesson-player.tsx',
  bytes: 48473,
  sha256: '3f7abe7329f0f9fb1a0563fa43101f387b562b0a8e5575f48ca75a3973960141'}),
  launcher: Object.freeze({path:
    'scripts/run-g678-provisional377-local-preview.mjs', bytes: 4286,
  sha256: '4b1bae49ae61f27445c18648f180f7914cf1f82cc09a8f036ed5920e19b106d8'}),
  successorCompatibility: Object.freeze({path:
    'catalog/g678-final354-current-bridge-successor-compatibility-v1.json',
  bytes: 4232,
  sha256: '2b9f3501c97f0d2eb1bc298d093d67417eba89e24e17f5a20e0b67ff8b0f61c1'}),
  aFragment: Object.freeze({path:
    'catalog/product-bridge-calibrations/g678-alg-l11-interactive10-tranche-c-current-js-v1.fragment.json',
  bytes: 24685,
  sha256: 'b0325468e2a1eb5812ced70ccae6bdd02ebf2caf228ce38b8dc007b056ebce5b'}),
  aRun: Object.freeze({path:
    'work/g678-shared-page-factory/g678-alg-l11-interactive10-tranche-c-current-js-v1/run-manifest.json',
  bytes: 392591,
  sha256: '63742b1e9a87829f99971a59d9153b1462dc89170774121ad89ba6b692e4ffb2'}),
  bFragment: Object.freeze({path:
    'catalog/product-bridge-calibrations/g678-alg-l11-behavior10-tranche-b-current-js-v1.fragment.json',
  bytes: 25786,
  sha256: '345576e3b59f968a488c244fe47c9a3c498e70075ff6743b7c93c9f204a15395'}),
  bRun: Object.freeze({path:
    'work/g678-shared-page-factory/g678-alg-l11-behavior10-tranche-b-current-js-v1/run-manifest.json',
  bytes: 27779,
  sha256: '9f56c482167a42f9917d7bf4d62a7510817bb3d5567d5685d0e9ea960b52806c'}),
  dFragment: Object.freeze({path:
    'catalog/product-bridge-calibrations/g678-alg-l11-advanced3-tranche-d-current-js-v1.fragment.json',
  bytes: 8124,
  sha256: 'c62cb3164735b062d2f24b593999c61fb7d44e9e3c02c7d621e990eb6166b6fa'}),
  dRun: Object.freeze({path:
    'work/g678-shared-page-factory/g678-alg-l11-advanced3-tranche-d-current-js-v1/run-manifest.json',
  bytes: 152404,
  sha256: '502c0ee2e71e94c97db4f5223dc990e35a6a3f281c9c59d8b73c2c2025ff06c5'}),
});

const INTEGRATION_KEYS = Object.freeze([
  'registrationFreeze', 'registrationFragment', 'registrationFinalizer',
  'privateRegistry', 'localLoader', 'localRegistry', 'productBridge',
  'descriptorPlayer', 'launcher', 'successorCompatibility',
  'aFragment', 'aRun', 'bFragment', 'bRun', 'dFragment', 'dRun',
]);

const LEGACY_NETWORK_OPERATION =
  /(?:^|[\/_?&=.-])(?:geturl|fscommand|bookmark|report(?:_url)?|download|loadvariables(?:num)?|xml[-_]?send|final[-_]?quiz[-_]?post|external[-_]?interface|shared[-_]?object(?:[-_]?persist)?)(?:$|[\/_?&=.-])/iu;

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

function exactKeys(value, keys) {
  return value && exact(Object.keys(value), keys);
}

function projectPath(relativePath) {
  const target = path.resolve(ROOT, relativePath);
  invariant(target.startsWith(`${ROOT}${path.sep}`),
    `${relativePath} escapes project root`);
  return target;
}

async function exists(target) {
  return lstat(target).then(() => true, () => false);
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

export function assertStableIntegrationBindingSet(actual, expected) {
  invariant(expected !== null && exactKeys(expected, INTEGRATION_KEYS) &&
    exactKeys(actual, INTEGRATION_KEYS),
  'provisional377 integration bindings are pending');
  for (const key of INTEGRATION_KEYS) {
    const value = expected[key];
    invariant(exactKeys(value, ['path', 'bytes', 'sha256']) &&
      typeof value.path === 'string' && value.path.length > 0 &&
      Number.isSafeInteger(value.bytes) && value.bytes > 0 &&
      /^[0-9a-f]{64}$/u.test(value.sha256),
    `${key} stable descriptor is invalid`);
  }
  invariant(exact(actual, expected),
    'provisional377 integration binding set drifted');
  return true;
}

export function assertFinal354Predecessor104(aggregate) {
  invariant(aggregate?.artifactType === 'g678-current-js-354-browser-qa-v1' &&
    aggregate.registeredCurrentJsPages === 354 &&
    aggregate.samples?.length === 104 &&
    new Set(aggregate.samples.map((sample) => sample.animationId)).size ===
      104 && aggregate.screenshots?.length === 111 &&
    aggregate.browserEvidenceComposition?.currentHostLiveRecordCount === 104 &&
    aggregate.browserEvidenceComposition
      ?.currentHostUniqueSampledModuleCount === 104 &&
    aggregate.browserEvidenceComposition
      ?.currentHostPredecessorSampleReplayCount === 92 &&
    aggregate.browserEvidenceComposition
      ?.currentHostNewPlacementSampleCount === 12 &&
    aggregate.browserEvidenceComposition
      ?.fullHistoricalSpecialInteractionReplay === false &&
    aggregate.browserEvidenceComposition?.fullPrior126Replay === false &&
    aggregate.browserEvidenceComposition?.currentHostBrowserRevalidated ===
      true && exact(aggregate.acceptanceEffects, FINAL354_FALSE_EFFECTS),
  'final354 predecessor104 aggregate drifted');
  return Object.freeze(aggregate.samples.map((sample) => sample.animationId));
}

export function assertFinal354SuccessorCompatibility(successor) {
  const inverse = Object.freeze({bytes: 153620,
    sha256: '00b14152cce3b84293fbd14ebe6390b254cfd22c208857c1c6618dcae8630166'});
  const expectedChanges = Object.freeze([
    'one provisional377 freeze phase selected only by an explicit local phase',
    'three exact unregistered maintained DOM fragment authority kinds',
    'one discriminated maintained-dom-module-v1 registration and descriptor provenance union for exact23',
    'separate 354 external canvas runtime assets and 23 maintained DOM renderer records',
    'source-bound ALG L11 maintained DOM lesson-host capability projection',
  ]);
  invariant(exactKeys(successor, ['schemaVersion', 'artifactType', 'status',
    'inputs', 'exactInverseTransformation', 'final354Compatibility',
    'requiredProvisional377BrowserAssertions', 'acceptanceEffects']) &&
    successor.schemaVersion === 1 && successor?.artifactType ===
      'g678-final354-current-bridge-successor-compatibility-v1' &&
    successor.status ===
      'exact-final354-inverse-and-static-compatibility-current-host-revalidation-required' &&
    exactKeys(successor.inputs, ['currentBridge',
      'preparedProvisional377BridgeTest', 'final354ProductCalibratedFreeze',
      'final354ProductCalibratedFragment',
      'final354PrivateRegistryWitness',
      'final354PrivateRegistryWitnessBuilder', 'builder']) &&
    Object.values(successor.inputs).every((value) =>
      exactKeys(value, ['path', 'bytes', 'sha256']) &&
      typeof value.path === 'string' && value.path.length > 0 &&
      Number.isSafeInteger(value.bytes) && value.bytes > 0 &&
      /^[0-9a-f]{64}$/u.test(value.sha256)) &&
    exact(successor.exactInverseTransformation, {
      reconstructedBytes: inverse.bytes,
      reconstructedSha256: inverse.sha256,
      expectedFinal354Bridge: inverse,
      exactMatch: true, allowedSuccessorChanges: expectedChanges,
      otherBridgeChangesDetected: false,
    }) && exact(successor.final354Compatibility, {
      exactDescriptorInvariantCount: 354,
      exactExternalCanvasRuntimeAssetCount: 354,
      maintainedDomRendererCount: 0,
      historicalProductHostCalibratedPlacementCount: 138,
      historicalFamilyCalibrationCount: 22,
      priorBrowserSampleCount: 104, priorScreenshotCount: 111,
      productCalibratedCompleteLessonKeys: ['shared-alg001-l09'],
      productCalibratedWholeLessonEngineeringPreviewCount: 1,
      currentBridgeStaticCompatibilityEstablished: true,
      currentHostBrowserRevalidated: false,
    }) && exact(successor.requiredProvisional377BrowserAssertions, {
      predecessorSamplesMustBeReplayed: true,
      predecessorReplayCount: 104,
      exactNewMaintainedDomPlacementCount: 23,
      exactExternalCanvasRuntimeAssetCount: 354,
      exactMaintainedDomRendererCount: 23,
      algL11RegisteredPageCount: 44, algL11ActivePageCount: 44,
      registeredCompleteLessonCount: 2,
      productCalibratedWholeLessonEngineeringPreviewCount: 1,
      newWholeLessonEngineeringPreviewCount: 0,
      browserProductCalibrationPassed: false,
    }) && exact(successor.acceptanceEffects, {
      authoritativeOriginalRuntime: false, behaviorParityAccepted: false,
      visualFidelityAccepted: false, audioAccepted: false,
      humanVisualAccepted: false, ownerAccepted: false,
      strictComplete: false, releaseEligible: false, published: false,
    }),
  'final354 successor compatibility contract drifted');
  return true;
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

export function explicitlyAllowed377Request(request, pages) {
  if (!request || request.method !== 'GET' ||
    isLegacyNetworkOperation(request.url)) return false;
  let parsed;
  try {
    parsed = new URL(request.url);
  } catch {
    return false;
  }
  const safe = new Set(['document', 'script', 'stylesheet', 'image', 'font',
    'fetch', 'xhr', 'other']);
  if (!safe.has(request.resourceType)) return false;
  if (parsed.pathname.startsWith('/_next/static/')) {
    return ['script', 'stylesheet', 'font', 'image', 'fetch', 'other']
      .includes(request.resourceType);
  }
  if (parsed.pathname === '/_next/image') {
    return ['image', 'fetch'].includes(request.resourceType) &&
      [...parsed.searchParams.keys()].every((key) =>
        ['q', 'url', 'w'].includes(key)) &&
      parsed.searchParams.get('url')?.startsWith('/') === true;
  }
  if (parsed.pathname === '/learning-theme-bootstrap.js' &&
    parsed.search === '') {
    return request.resourceType === 'script';
  }
  if (parsed.pathname === '/en' &&
    parsed.searchParams.get('screen') === 'lessons' &&
    [...parsed.searchParams.keys()].every((key) =>
      key === 'screen' || key === '_rsc')) {
    return request.resourceType === 'document' ||
      request.resourceType === 'fetch';
  }
  const prefix = '/en/migration-status/g678-calibration/';
  const routeId = parsed.pathname.startsWith(prefix)
    ? parsed.pathname.slice(prefix.length) : null;
  if (routeId && pages.has(routeId) &&
    parsed.pathname === `${prefix}${routeId}` &&
    [...parsed.searchParams.keys()].every((key) => key === '_rsc')) {
    return request.resourceType === 'document' ||
      request.resourceType === 'fetch';
  }
  const canvas = parsed.pathname.match(
    /^\/flash-assets\/g678-local\/([^/]+)\/canvas-renderer\.js$/u);
  if (canvas) {
    const registered = pages.get(canvas[1]);
    return request.resourceType === 'script' &&
      registered?.runtime?.canvasRenderer?.sha256 &&
      parsed.search === `?sha256=${registered.runtime.canvasRenderer.sha256}`;
  }
  return false;
}

export function requestGuardAction377(request, pages) {
  return explicitlyAllowed377Request(request, pages) ? 'continue' : 'abort';
}

const REQUEST_POLICY_KEYS = Object.freeze([
  'observedRequestCount', 'allObservedRequestsLoopback',
  'allObservedRequestsExplicitlyAllowed', 'legacyNetworkOperationsObserved',
  'guardMode', 'blockedRequestCount',
]);

export function requestPolicy377Receipt(observedRequests, pages) {
  invariant(Array.isArray(observedRequests),
    'observed requests must be an array');
  return Object.freeze({observedRequestCount: observedRequests.length,
    allObservedRequestsLoopback: observedRequests.every((request) =>
      sameLoopbackOrigin(request.url)),
    allObservedRequestsExplicitlyAllowed: observedRequests.every((request) =>
      explicitlyAllowed377Request(request, pages)),
    legacyNetworkOperationsObserved: observedRequests.filter((request) =>
      isLegacyNetworkOperation(request.url)).length,
    guardMode: 'abort-unallowlisted-before-network',
    blockedRequestCount: observedRequests.filter((request) =>
      requestGuardAction377(request, pages) === 'abort').length});
}

export function assertRequestPolicy377Receipt(observedRequests, receipt,
  pages) {
  invariant(exactKeys(receipt, REQUEST_POLICY_KEYS) &&
    exact(receipt, requestPolicy377Receipt(observedRequests, pages)) &&
    receipt.observedRequestCount > 0 &&
    receipt.allObservedRequestsLoopback === true &&
    receipt.allObservedRequestsExplicitlyAllowed === true &&
    receipt.legacyNetworkOperationsObserved === 0 &&
    receipt.guardMode === 'abort-unallowlisted-before-network' &&
    receipt.blockedRequestCount === 0,
  'provisional377 request policy evidence drifted');
  return true;
}

const P006_KEYS = Object.freeze([
  'animationId', 'selectedLabels', 'sourceWindows', 'replayCount',
  'audioPlayed', 'audioCueRequestCount', 'replayResetPassed',
  'pageSpecificAssetRequestCount', 'errors', 'screenshot',
]);

export function assertP006BrowserReceipt(receipt, auditMember) {
  const labels = ['S1', 'S2', 'S3', 'S4'];
  invariant(exactKeys(receipt, P006_KEYS) &&
    receipt.animationId === 'shared-alg001-l11-p006' &&
    receipt.selectedLabels.length === 4 &&
    new Set(receipt.selectedLabels).size === 4 &&
    receipt.selectedLabels.every((label) => labels.includes(label)) &&
    exact(receipt.sourceWindows, receipt.selectedLabels.map((label) => {
      const item = auditMember.sourceContract.labelWindows.find((window) =>
        window.label === label);
      return {label: item.label, startFrame: item.startFrame,
        returnFrame: item.returnFrame,
        soundStreamBlockCount: item.soundStreamBlockCount};
    })) && receipt.replayCount === 3 && receipt.audioPlayed === false &&
    receipt.audioCueRequestCount === 0 &&
    receipt.replayResetPassed === true &&
    receipt.pageSpecificAssetRequestCount === 0 &&
    exact(receipt.errors, []) && validScreenshot(receipt.screenshot),
  'p006 browser receipt drifted');
  return true;
}

const A_CHOICE_KEYS = Object.freeze([
  'animationId', 'visibleMath', 'correctSlot', 'sourceGeometry',
  'correctGraph', 'firstWrongText', 'secondWrongText', 'firstWrongPassed',
  'secondWrongPassed', 'rightPassed', 'helpLifecycle', 'helpTexts',
  'pausePassed',
  'hostFeedbackTransitions', 'replayResetPassed',
  'pageSpecificAssetRequestCount', 'errors', 'screenshot',
]);

export function assertAChoiceBrowserReceipt(receipt, auditMember) {
  const expectedMath = A_VISIBLE_MATH[receipt.animationId];
  const geometry = auditMember.sourceContract.geometry;
  const present = geometry.optionSlots.filter((slot) => slot.present);
  const correct = present.find((slot) => slot.correct);
  const expectedGeometry = present.map((slot) => ({slot: slot.slot,
    geometrySha256: slot.geometrySha256,
    visibleObjectCount: slot.visibleObjects.length,
    visibleObjectProjectionSha256: sha256(stableBytes(slot.visibleObjects)),
    hitTarget: {name: slot.hitTarget.name,
      objectId: slot.hitTarget.objectId}}));
  const expectedHelpCount =
    auditMember.sourceContract.needMoreHelpScripts.length > 0 ? 1 : 0;
  const expectedHelpTexts = expectedHelpCount === 1 ? [
    'Use the rules of inequalities to find the solution set.',
    'Inequality Rule 3: You can multiply or divide both sides of an inequality by any negative number but you must reverse the direction of the inequality symbol.',
  ] : [];
  invariant(exactKeys(receipt, A_CHOICE_KEYS) && expectedMath && correct &&
    exact(receipt.visibleMath, expectedMath.labels) &&
    receipt.correctSlot === expectedMath.correct &&
    receipt.correctSlot === correct.slot &&
    exact(receipt.sourceGeometry, expectedGeometry) &&
    exact(receipt.correctGraph, expectedMath.graph ?? null) &&
    receipt.firstWrongText ===
      auditMember.sourceContract.literalTwoAttemptSequence[0].text &&
    receipt.secondWrongText ===
      auditMember.sourceContract.literalTwoAttemptSequence[1].text &&
    receipt.firstWrongPassed === true && receipt.secondWrongPassed === true &&
    receipt.rightPassed === true && receipt.pausePassed === true &&
    exact(receipt.helpLifecycle, {before: 0, open: expectedHelpCount, close: 0,
      replay: 0}) &&
    exact(receipt.helpTexts, expectedHelpTexts) &&
    exact(receipt.hostFeedbackTransitions,
      [false, true, false, true, false, true, false]) &&
    receipt.replayResetPassed === true &&
    receipt.pageSpecificAssetRequestCount === 0 &&
    exact(receipt.errors, []) && validScreenshot(receipt.screenshot),
  `${receipt.animationId} A choice browser receipt drifted`);
  return true;
}

const A_TWO_TRY_KEYS = Object.freeze([
  'animationId', 'nestedFrames', 'tryCounts', 'helpLifecycle',
  'pausePassed', 'replayResetPassed',
  'maintainedLocalParentTransition',
  'originalRuntimeParentBindingEstablished',
  'pageSpecificAssetRequestCount', 'errors', 'screenshot',
]);

export function assertATwoTryBrowserReceipt(receipt, auditMember) {
  invariant(exactKeys(receipt, A_TWO_TRY_KEYS) &&
    A_TWO_TRY_IDS.includes(receipt.animationId) &&
    exact(receipt.nestedFrames, [1, 64, 65, 1, 64, 65, 70, 1]) &&
    exact(receipt.tryCounts, [0, 1, 2, 0]) &&
    exact(receipt.helpLifecycle, {before: 0, open: 1, close: 0,
      replay: 0}) && receipt.pausePassed === true &&
    receipt.replayResetPassed === true &&
    receipt.maintainedLocalParentTransition === true &&
    receipt.originalRuntimeParentBindingEstablished === false &&
    auditMember.sourceContract.runtimeParentBindingEstablished === false &&
    typeof auditMember.sourceContract.runtimeParentBindingBlocker ===
      'string' && receipt.pageSpecificAssetRequestCount === 0 &&
    exact(receipt.errors, []) && validScreenshot(receipt.screenshot),
  `${receipt.animationId} A two-try browser receipt drifted`);
  return true;
}

const B_PAGE_KEYS = Object.freeze([
  'animationId', 'familyId', 'guidedStopFrames', 'guidedStopsPassed',
  'naturalStopTraversals',
  'visibleLabels', 'correctSlot', 'correctSemanticAnswer',
  'specialMathGeometry', 'p029FeedbackTexts',
  'firstWrongPassed', 'secondWrongPassed', 'rightPassed',
  'helpLifecycle', 'staleOverlayCounts', 'pausePassed',
  'hostFeedbackTransitions', 'replayResetPassed',
  'pageSpecificAssetRequestCount', 'errors', 'screenshot',
]);

export function assertBPageBrowserReceipt(receipt, auditMember) {
  const guidedFrames = [...new Set(auditMember.sourceStateMachine.guidedHits
    .map((hit) => hit.frame))];
  const stopTraversal = [...guidedFrames.map((frame) =>
    ({frame, phase: 'guided-stop'})),
  {frame: auditMember.sourceStateMachine.quizFrame, phase: 'choosing'}];
  const rows = auditMember.answerVisibleGeometryCrosswalk.rows;
  const correct = auditMember.answerVisibleGeometryCrosswalk.correct;
  const special = auditMember.answerVisibleGeometryCrosswalk
    .specialGeometryConclusion;
  const expectedSpecial = special?.kind === 'number-line-graph'
    ? {kind: 'number-line-graph', boundary: '2', closed: 'false',
      direction: 'right'}
    : special?.kind === 'absolute-value-inequality'
      ? {kind: 'absolute-value-inequality', bars: '2',
        operator: 'less-than', text: '|x| < 5'} : null;
  const expectedP029 = auditMember.sourceStateMachine.p029FeedbackSequence
    ? [auditMember.sourceStateMachine.p029FeedbackSequence.firstWrong
      .visibleText,
    auditMember.sourceStateMachine.p029FeedbackSequence.secondWrong
      .visibleText] : null;
  invariant(exactKeys(receipt, B_PAGE_KEYS) &&
    receipt.animationId === auditMember.animationId &&
    receipt.familyId === auditMember.familyId &&
    exact(receipt.guidedStopFrames, guidedFrames) &&
    receipt.guidedStopsPassed === true &&
    exact(receipt.naturalStopTraversals,
      {initial: stopTraversal, replay: stopTraversal}) &&
    exact(receipt.visibleLabels, rows.map((row) => ({label: row.visibleLabel,
      sourceInstanceName: row.instanceName,
      sourceCharacterId: row.characterId,
      correct: row.correct}))) &&
    receipt.correctSlot === correct.visibleLabel &&
    receipt.correctSemanticAnswer === correct.semanticAnswer &&
    exact(receipt.specialMathGeometry, expectedSpecial) &&
    exact(receipt.p029FeedbackTexts, expectedP029) &&
    (!B_GUIDED_IDS.includes(receipt.animationId) ||
      receipt.correctSlot === 'C') &&
    receipt.firstWrongPassed === true && receipt.secondWrongPassed === true &&
    receipt.rightPassed === true && receipt.pausePassed === true &&
    exact(receipt.helpLifecycle, {before: 0, open: 1, close: 0,
      replay: 0}) &&
    exact(receipt.staleOverlayCounts, {before: 0, open: 0, close: 0,
      replay: 0}) &&
    exact(receipt.hostFeedbackTransitions,
      [false, true, false, true, false, true, false]) &&
    receipt.replayResetPassed === true &&
    receipt.pageSpecificAssetRequestCount === 0 &&
    exact(receipt.errors, []) && validScreenshot(receipt.screenshot),
  `${receipt.animationId} B browser receipt drifted`);
  return true;
}

const D_CONTROLLER_KEYS = Object.freeze([
  'animationId', 'sourceHandoffArities', 'selectedLevels',
  'targetAnimationIds', 'targetLevels', 'navigationAllowedCount',
  'legacyOperationRequestCount', 'legacyCallExecuted', 'pausePassed',
  'replayResetPassed', 'pageSpecificAssetRequestCount', 'errors',
  'screenshot',
]);

export function assertDControllerBrowserReceipt(receipt) {
  invariant(exactKeys(receipt, D_CONTROLLER_KEYS) &&
    receipt.animationId === D_IDS[0] &&
    exact(receipt.sourceHandoffArities, [2, 3]) &&
    exact(receipt.selectedLevels, [2, 1]) &&
    exact(receipt.targetAnimationIds, [D_IDS[1], D_IDS[1]]) &&
    exact(receipt.targetLevels, [2, 1]) &&
    receipt.navigationAllowedCount === 2 &&
    receipt.legacyOperationRequestCount === 0 &&
    receipt.legacyCallExecuted === false && receipt.pausePassed === true &&
    receipt.replayResetPassed === true &&
    receipt.pageSpecificAssetRequestCount === 0 &&
    exact(receipt.errors, []) && validScreenshot(receipt.screenshot),
  'p033 controller browser receipt drifted');
  return true;
}

const D_MATCHING_KEYS = Object.freeze([
  'animationId', 'sourceCardCount', 'levelCount', 'levelOneWrongScore',
  'levelOneCorrectScore', 'levelTwoFinalScore', 'matchedPairCount',
  'bothLevelsPassed', 'feedbackDisablePassed', 'replayResetPassed',
  'pageSpecificAssetRequestCount', 'errors', 'screenshot',
]);

export function assertDMatchingBrowserReceipt(receipt) {
  invariant(exactKeys(receipt, D_MATCHING_KEYS) &&
    receipt.animationId === D_IDS[1] && receipt.sourceCardCount === 24 &&
    receipt.levelCount === 2 && receipt.levelOneWrongScore === -2 &&
    receipt.levelOneCorrectScore === 8 && receipt.levelTwoFinalScore === 60 &&
    receipt.matchedPairCount === 6 && receipt.bothLevelsPassed === true &&
    receipt.feedbackDisablePassed === true &&
    receipt.replayResetPassed === true &&
    receipt.pageSpecificAssetRequestCount === 0 &&
    exact(receipt.errors, []) && validScreenshot(receipt.screenshot),
  'p034 matching browser receipt drifted');
  return true;
}

const D_ASSESSMENT_KEYS = Object.freeze([
  'animationId', 'initialQuestions', 'replayQuestions', 'poolSize',
  'uniqueQuestionCount', 'wrongAnswerCount', 'rightAnswerCount',
  'score', 'grade', 'reviewOrder', 'reviewPassed', 'resetPassed',
  'pageSpecificAssetRequestCount', 'errors', 'screenshot',
]);

export function assertDAssessmentBrowserReceipt(receipt) {
  const validQuestions = (values) => values.length === 10 &&
    new Set(values).size === 10 && values.every((value) =>
      Number.isInteger(value) && value >= 1 && value <= 24);
  invariant(exactKeys(receipt, D_ASSESSMENT_KEYS) &&
    receipt.animationId === D_IDS[2] && validQuestions(receipt.initialQuestions) &&
    validQuestions(receipt.replayQuestions) &&
    !exact(receipt.initialQuestions, receipt.replayQuestions) &&
    receipt.poolSize === 24 && receipt.uniqueQuestionCount === 10 &&
    receipt.wrongAnswerCount === 1 && receipt.rightAnswerCount === 9 &&
    receipt.score === 9 && receipt.grade === 'Advanced' &&
    exact(receipt.reviewOrder, receipt.initialQuestions) &&
    receipt.reviewPassed === true && receipt.resetPassed === true &&
    receipt.pageSpecificAssetRequestCount === 0 &&
    exact(receipt.errors, []) && validScreenshot(receipt.screenshot),
  'p044 assessment browser receipt drifted');
  return true;
}

const PREDECESSOR_REPLAY_KEYS = Object.freeze([
  'animationId', 'historicalKind', 'frameCount', 'frameDomain',
  'initialFrame', 'replayFrame', 'replayCounterBefore',
  'replayCounterAfter', 'renderState', 'asset',
  'fullHistoricalInteractionReplayed', 'requests', 'errors',
]);

function validAssetReceipt(asset, registered) {
  const expected = registered.runtime.canvasRenderer;
  return asset?.url === `${BASE}/flash-assets/g678-local/` +
      `${registered.animationId}/canvas-renderer.js?sha256=${expected.sha256}` &&
    asset.status === 200 && asset.cacheControl ===
      'private, no-store, max-age=0' &&
    asset.contentType?.startsWith('text/javascript') &&
    asset.corp === 'same-origin' && asset.nosniff === 'nosniff';
}

export function assertPredecessor104ReplayReceipt(receipt, historical,
  registered) {
  invariant(exactKeys(receipt, PREDECESSOR_REPLAY_KEYS) &&
    receipt.animationId === historical.animationId &&
    receipt.animationId === registered.animationId &&
    receipt.historicalKind === historical.kind &&
    receipt.frameCount === historical.frameCount &&
    receipt.frameCount === registered.runtime.frameCount &&
    receipt.frameDomain === registered.runtime.frameDomain &&
    Number.isInteger(receipt.initialFrame) && receipt.initialFrame > 0 &&
    Number.isInteger(receipt.replayFrame) && receipt.replayFrame > 0 &&
    receipt.replayFrame <= receipt.frameCount &&
    receipt.replayCounterAfter === receipt.replayCounterBefore + 1 &&
    receipt.renderState === 'ready' &&
    validAssetReceipt(receipt.asset, registered) &&
    receipt.fullHistoricalInteractionReplayed === false &&
    Array.isArray(receipt.requests) && exact(receipt.errors, []),
  `${receipt.animationId} predecessor104 replay receipt drifted`);
  return true;
}

function validScreenshot(value) {
  return exactKeys(value, ['path', 'bytes', 'sha256']) &&
    typeof value.path === 'string' && value.path.startsWith(`${OUTPUT}/`) &&
    Number.isSafeInteger(value.bytes) && value.bytes > 0 &&
    /^[0-9a-f]{64}$/u.test(value.sha256);
}

export function assertFocused377BrowserMetadata(browser, executable) {
  invariant(exactKeys(browser, ['name', 'version', 'executable']) &&
    browser.name === 'Chromium' &&
    typeof browser.version === 'string' &&
    /^\d+(?:\.\d+){1,3}$/u.test(browser.version) &&
    exact(browser.executable, executable),
  'focused377 browser metadata drifted');
  return true;
}

export function assertFocused377ScreenshotComposition(evidence) {
  const pageReceipts = [
    ...(evidence.aInteractive10?.pages ?? []),
    ...(evidence.bBehavior10?.pages ?? []),
    ...(evidence.dAdvanced3?.pages ?? []),
  ];
  const expectedPaths = [
    `${OUTPUT}/all-lessons-377-l9-l11-complete.png`,
    ...IDS.map((animationId) => `${OUTPUT}/${animationId}.png`),
  ];
  invariant(pageReceipts.length === 23 &&
    exact(pageReceipts.map((receipt) => receipt.animationId), IDS) &&
    evidence.screenshots?.length === 24 &&
    evidence.screenshots.every(validScreenshot) &&
    exact(evidence.screenshots.map((item) => item.path), expectedPaths) &&
    exact(evidence.screenshots.slice(1),
      pageReceipts.map((receipt) => receipt.screenshot)),
  'focused377 screenshot composition drifted');
  return true;
}

function lessonVector(catalog, freeze) {
  const counts = new Map();
  for (const page of freeze.selectedPages) {
    counts.set(page.stableLessonKey,
      (counts.get(page.stableLessonKey) ?? 0) + 1);
  }
  return Object.freeze(catalog.lessons.map((lesson) => Object.freeze({
    stableLessonKey: lesson.stableLessonKey,
    moduleCode: lesson.moduleCode,
    lessonNumber: lesson.lessonNumber,
    activePageCount: lesson.activePageCount,
    registeredPageCount: counts.get(lesson.stableLessonKey) ?? 0,
  })));
}

export function assertAllLessons377Receipt(receipt, catalog, freeze) {
  const vector = lessonVector(catalog, freeze);
  const complete = vector.filter((lesson) => lesson.registeredPageCount ===
    lesson.activePageCount).map((lesson) => lesson.stableLessonKey);
  invariant(exactKeys(receipt, ['sharedCardCount', 'linkedCardCount',
    'registeredPageSum', 'exactLessonVector', 'completeLessonKeys', 'algL09',
    'algL11', 'errors']) &&
    receipt.sharedCardCount === 44 && receipt.linkedCardCount === 0 &&
    receipt.registeredPageSum === 377 &&
    exact(receipt.exactLessonVector, vector) &&
    exact(receipt.completeLessonKeys,
      ['shared-alg001-l09', 'shared-alg001-l11']) &&
    exact(complete, receipt.completeLessonKeys) &&
    exact(receipt.algL09, {registeredPageCount: 41,
      activePageCount: 41, complete: true}) &&
    exact(receipt.algL11, {registeredPageCount: 44,
      activePageCount: 44, complete: true}) &&
    exact(receipt.errors, []),
  '377 All Lessons receipt drifted');
  return true;
}

function recordsById(audit) {
  return new Map(audit.members.map((member) =>
    [member.animationId, member]));
}

function assetReceipt(response) {
  const headers = response.headers();
  return Object.freeze({url: response.url(), status: response.status(),
    cacheControl: headers['cache-control'] ?? null,
    contentType: headers['content-type'] ?? null,
    corp: headers['cross-origin-resource-policy'] ?? null,
    nosniff: headers['x-content-type-options'] ?? null});
}

async function screenshot(stage, fileName) {
  const buffer = await readFile(path.join(stage, fileName));
  return Object.freeze({path: `${OUTPUT}/${fileName}`, bytes: buffer.length,
    sha256: sha256(buffer)});
}

async function currentInputs(check) {
  invariant(STABLE_INTEGRATION_BINDINGS !== null,
    'provisional377 integration bindings are pending');
  const registryKeys = new Set(['privateRegistry', 'localLoader',
    'localRegistry']);
  const jsonKeys = new Set(['registrationFreeze', 'registrationFragment',
    'privateRegistry', 'successorCompatibility', 'aFragment', 'aRun',
    'bFragment', 'bRun', 'dFragment', 'dRun']);
  const snapshotNames = Object.freeze({
    privateRegistry: 'private-current-js-registry.snapshot.json',
    localLoader: 'registry.local-only.generated.snapshot.ts',
    localRegistry: 'registry.local-only.metadata.generated.snapshot.ts',
  });
  const entries = await Promise.all(INTEGRATION_KEYS.map(async (key) => {
    const expected = STABLE_INTEGRATION_BINDINGS[key];
    const selectedPath = check && registryKeys.has(key)
      ? `${OUTPUT}/${snapshotNames[key]}` : expected.path;
    return [key, await binding(selectedPath, jsonKeys.has(key))];
  }));
  const integrationValues = Object.fromEntries(entries);
  const actualStable = Object.fromEntries(entries.map(([key, value]) =>
    [key, descriptor(value, STABLE_INTEGRATION_BINDINGS[key].path)]));
  assertStableIntegrationBindingSet(actualStable, STABLE_INTEGRATION_BINDINGS);
  const [final354, catalog, aAudit, bAudit, bDecision, dAudit, script,
    executable] = await Promise.all([
    binding(FINAL354_AGGREGATE, true), binding(CATALOG, true),
    binding(A_AUDIT, true), binding(B_AUDIT, true), binding(B_DECISION, true),
    binding(D_AUDIT, true), binding(path.relative(ROOT, SCRIPT_PATH)),
    externalBinding(chromium.executablePath()),
  ]);
  invariant(final354.sha256 === FINAL354_AGGREGATE_SHA256,
    'final354 aggregate binding drifted');
  invariant(aAudit.sha256 === A_AUDIT_SHA256 &&
    integrationValues.aRun.sha256 === A_RUN_SHA256 &&
    integrationValues.aRun.value.outputInventory.sha256 ===
      A_INVENTORY_SHA256 &&
    integrationValues.aFragment.sha256 === A_FRAGMENT_SHA256,
  'A host-product stable binding drifted');
  invariant(bAudit.sha256 === B_AUDIT_SHA256 &&
    bDecision.sha256 === B_DECISION_SHA256 &&
    integrationValues.bRun.sha256 === B_RUN_SHA256 &&
    integrationValues.bRun.value.outputInventory.sha256 ===
      B_INVENTORY_SHA256 &&
    integrationValues.bFragment.sha256 === B_FRAGMENT_SHA256,
  'B product stable binding drifted');
  invariant(dAudit.sha256 === D_AUDIT_SHA256 &&
    integrationValues.dRun.sha256 === D_RUN_SHA256 &&
    integrationValues.dRun.value.outputInventory.sha256 ===
      D_INVENTORY_SHA256 &&
    integrationValues.dFragment.sha256 === D_FRAGMENT_SHA256,
  'D product stable binding drifted');
  const predecessorIds = assertFinal354Predecessor104(final354.value);
  assertFinal354SuccessorCompatibility(
    integrationValues.successorCompatibility.value);
  const freeze = integrationValues.registrationFreeze.value;
  const registrationFragment = integrationValues.registrationFragment.value;
  const selected = new Map(freeze.selectedPages?.map((page) =>
    [page.animationId, page]));
  const exact23 = IDS.map((id) => selected.get(id));
  invariant(freeze.registrationCandidatePlacementCount === 377 &&
    freeze.selectedPages.length === 377 && exact23.every(Boolean) &&
    exact23.every((page) => page.stableLessonKey === 'shared-alg001-l11' &&
      page.productCalibrationPassed === false &&
      page.engineeringPreviewReady === false &&
      page.productBlockers.includes(PENDING_BLOCKER)),
  'provisional377 exact23 freeze boundary drifted');
  invariant(registrationFragment.artifactType ===
      'private-current-js-calibration-fragment-v1' &&
    registrationFragment.calibration?.entries?.length === 377 &&
    registrationFragment.calibration.freezeManifest ===
      STABLE_INTEGRATION_BINDINGS.registrationFreeze.path &&
    exact(registrationFragment.freeze,
      descriptor(integrationValues.registrationFreeze)) &&
    exact(registrationFragment.calibration.entries.map((entry) => entry.key),
      freeze.selectedPages.map((page) => page.animationId)),
  'provisional377 registration fragment drifted');
  const registryMatches = integrationValues.privateRegistry.value.calibrations
    .filter((calibration) => calibration.freezeManifest ===
      STABLE_INTEGRATION_BINDINGS.registrationFreeze.path);
  invariant(registryMatches.length === 1 &&
    registryMatches[0].entries.length === 377 &&
    registryMatches[0].freezeManifestBytes ===
      integrationValues.registrationFreeze.bytes &&
    registryMatches[0].freezeManifestSha256 ===
      integrationValues.registrationFreeze.sha256 &&
    exact(registryMatches[0].entries.map((entry) => entry.key),
      freeze.selectedPages.map((page) => page.animationId)),
  'provisional377 private registry projection drifted');
  const families = [
    [integrationValues.aRun.value, integrationValues.aFragment.value, A_IDS],
    [integrationValues.bRun.value, integrationValues.bFragment.value, B_IDS],
    [integrationValues.dRun.value, integrationValues.dFragment.value, D_IDS],
  ];
  for (const [run, fragment, ids] of families) {
    invariant(exact(run.members.map((member) => member.animationId), ids) &&
      exact(fragment.entries.map((entry) => entry.key), ids) &&
      run.registryEntriesWritten === 0 &&
      fragment.registryEntriesWritten === 0 &&
      fragment.registrationCandidatePlacementCount === 0,
    'provisional377 source family binding drifted');
  }
  invariant(exact(predecessorIds, final354.value.samples.map((sample) =>
    sample.animationId)) && new Set(predecessorIds).size === 104,
  'provisional377 predecessor104 plan drifted');
  const descriptors = Object.freeze({
    ...Object.fromEntries(entries.map(([key, value]) => [key,
      descriptor(value, registryKeys.has(key)
        ? `${OUTPUT}/${snapshotNames[key]}` : value.path)])),
    final354Aggregate: descriptor(final354), catalog: descriptor(catalog),
    aAudit: descriptor(aAudit), bAudit: descriptor(bAudit),
    bDecision: descriptor(bDecision), dAudit: descriptor(dAudit),
    script: descriptor(script), chromiumExecutable: descriptor(executable),
  });
  return Object.freeze({values: Object.freeze({...integrationValues,
    final354, catalog, aAudit, bAudit, bDecision, dAudit}), descriptors,
  snapshots: check ? null : Object.freeze(Object.fromEntries(
    [...registryKeys].map((key) => [key, integrationValues[key].buffer])))});
}

function capturePage(browser, pages,
  viewport = {width: 1440, height: 1000}) {
  return browser.newPage({viewport}).then((page) => {
    const errors = [];
    const requests = [];
    const pageAssets = [];
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    page.on('pageerror', (error) => errors.push(String(error)));
    page.on('request', (request) => {
      const item = {method: request.method(),
        resourceType: request.resourceType(), url: request.url()};
      requests.push(item);
      if (request.url().includes('/flash-assets/g678-local/')) {
        pageAssets.push(item);
      }
    });
    return page.route('**/*', async (route) => {
      const request = route.request();
      const item = {method: request.method(),
        resourceType: request.resourceType(), url: request.url()};
      if (requestGuardAction377(item, pages) === 'abort') {
        await route.abort('blockedbyclient');
      } else {
        await route.continue();
      }
    }).then(() => Object.freeze({page, errors, requests, pageAssets}));
  });
}

async function openDomRoute(browser, pages, animationId) {
  const capture = await capturePage(browser, pages);
  await capture.page.goto(`${BASE}/en/migration-status/g678-calibration/${
    animationId}`, {waitUntil: 'domcontentloaded'});
  await capture.page.waitForFunction((id) => {
    const player = document.querySelector(
      `[data-current-animation-id="${id}"]`);
    const candidate = document.querySelector(
      `[data-animation-id="${id}"][data-private-current-js="true"]`);
    return player?.getAttribute('data-renderer-availability') ===
      'registered' && candidate !== null;
  }, animationId, {timeout: 45_000});
  const candidate = capture.page.locator(
    `[data-animation-id="${animationId}"][data-private-current-js="true"]`);
  invariant(await candidate.count() === 1 &&
    await candidate.getAttribute('data-current-javascript-registered') ===
      'false' && capture.pageAssets.length === 0,
  `${animationId} DOM current-JS route boundary drifted`);
  return Object.freeze({...capture, candidate});
}

async function hostFeedbackActive(page) {
  return await page.locator('[data-lesson-host-practice-feedback-active]')
    .first().getAttribute('data-lesson-host-practice-feedback-active') ===
      'true';
}

async function provePause(page, candidate) {
  const pause = page.locator(
    'button[data-responsive-focus-key="pause"]:visible');
  invariant(await pause.count() === 1,
    'pause proof requires exactly one visible product control');
  await pause.click();
  await page.waitForFunction(() => document.querySelector(
    '[data-runtime-paused="true"]') !== null);
  const buttons = candidate.locator('button:visible');
  const disabled = await buttons.evaluateAll((items) => items.map((item) =>
    item.disabled));
  invariant(disabled.length > 0 && disabled.every(Boolean),
    'paused candidate retained an enabled visible control');
  await pause.click();
  await page.waitForFunction(() => document.querySelector(
    '[data-runtime-paused="false"]') !== null);
  return true;
}

async function clickReplay(page, candidate) {
  const runtime = page.locator('[data-runtime-transport][data-runtime-replay]')
    .first();
  const before = Number(await runtime.getAttribute('data-runtime-replay'));
  const replay = candidate.getByRole('button', {name: 'Replay', exact: true});
  invariant(await replay.count() === 1, 'candidate Replay control drifted');
  await replay.click();
  await page.waitForFunction((value) => Number(document.querySelector(
    '[data-runtime-transport][data-runtime-replay]')?.getAttribute(
      'data-runtime-replay')) === value + 1, before);
  return Object.freeze({before, after: before + 1});
}

async function captureExact23Screenshot(page, stage, animationId) {
  const fileName = `${animationId}.png`;
  await page.screenshot({path: path.join(stage, fileName), fullPage: true});
  return screenshot(stage, fileName);
}

async function exerciseP006(browser, pages, stage, auditMember) {
  const capture = await openDomRoute(browser, pages, A_IDS[0]);
  try {
    const {page, candidate} = capture;
    const selectedLabels = [];
    const sourceWindows = [];
    for (let index = 0; index < 4; index += 1) {
      const heading = await candidate.getByRole('heading', {level: 2})
        .textContent();
      const label = heading?.match(/Random source branch: (S[1-4])/u)?.[1];
      invariant(label, 'p006 deterministic label missing');
      selectedLabels.push(label);
      const state = candidate.locator('[data-audio-played="false"]');
      invariant(await state.count() === 1, 'p006 silent branch missing');
      sourceWindows.push(Object.freeze({label,
        startFrame: Number(await state.getAttribute('data-source-branch-start')),
        returnFrame: Number(await state.getAttribute('data-source-branch-end')),
        soundStreamBlockCount: Number(await state.getAttribute(
          'data-source-sound-stream-block-count'))}));
      if (index < 3) {
        await clickReplay(page, candidate);
        await page.waitForFunction(({id, prior}) =>
          document.querySelector(`[data-animation-id="${id}"] h2`)
            ?.textContent?.includes(`Random source branch: ${prior}`) === false,
        {id: A_IDS[0], prior: label});
      }
    }
    const pausePassed = await provePause(page, candidate);
    invariant(pausePassed, 'p006 pause proof failed');
    const screenshotReceipt = await captureExact23Screenshot(page, stage,
      A_IDS[0]);
    const receipt = Object.freeze({animationId: A_IDS[0], selectedLabels,
      sourceWindows, replayCount: 3, audioPlayed: false,
      audioCueRequestCount: capture.requests.filter((request) =>
        /audio|\.mp3(?:$|\?)/iu.test(request.url)).length,
      replayResetPassed: true,
      pageSpecificAssetRequestCount: capture.pageAssets.length,
      errors: capture.errors, screenshot: screenshotReceipt});
    assertP006BrowserReceipt(receipt, auditMember);
    return Object.freeze({receipt, requests: capture.requests});
  } finally {
    await capture.page.close();
  }
}

async function observedAChoiceGeometry(candidate) {
  const buttons = candidate.locator('button[data-source-geometry-sha256]');
  const values = [];
  for (let index = 0; index < await buttons.count(); index += 1) {
    const button = buttons.nth(index);
    const aria = await button.getAttribute('aria-label');
    const slot = aria?.match(/^([A-D]): /u)?.[1];
    invariant(slot, 'A choice visible label missing');
    values.push(Object.freeze({slot,
      geometrySha256: await button.getAttribute('data-source-geometry-sha256'),
      visibleObjectCount: Number(await button.getAttribute(
        'data-source-visible-object-count')),
      visibleObjectProjectionSha256: await button.getAttribute(
        'data-source-visible-object-projection-sha256'),
      hitTarget: Object.freeze({name: await button.getAttribute(
        'data-source-hit-target'), objectId: Number(await button.getAttribute(
        'data-source-hit-object-id'))})}));
  }
  return Object.freeze(values);
}

async function exerciseAChoice(browser, pages, stage, auditMember) {
  const capture = await openDomRoute(browser, pages, auditMember.animationId);
  try {
    const {page, candidate} = capture;
    const expected = A_VISIBLE_MATH[auditMember.animationId];
    const optionButtons = candidate.locator(
      'button[data-source-geometry-sha256]');
    const visibleMath = {};
    for (let index = 0; index < await optionButtons.count(); index += 1) {
      const aria = await optionButtons.nth(index).getAttribute('aria-label');
      const match = aria?.match(/^([A-D]): (.+)$/u);
      invariant(match, `${auditMember.animationId} visible math missing`);
      visibleMath[match[1]] = match[2];
    }
    const sourceGeometry = await observedAChoiceGeometry(candidate);
    const exactCorrect = candidate.locator(
      'button[data-correct-source-option="true"]');
    invariant(await exactCorrect.count() === 1,
      `${auditMember.animationId} correct source option drifted`);
    const correctSlot = (await exactCorrect.getAttribute('aria-label'))
      ?.slice(0, 1);
    let correctGraph = null;
    if (expected.graph) {
      const graph = exactCorrect.locator('svg[data-boundary-value]');
      invariant(await graph.count() === 1,
        `${auditMember.animationId} correct graph missing`);
      correctGraph = Object.freeze({
        boundary: Number(await graph.getAttribute('data-boundary-value')),
        closed: await graph.getAttribute('data-boundary-closed') === 'true',
        direction: await graph.getAttribute('data-ray-direction')});
    }
    const helpSurface = candidate.locator(
      '[data-source-need-more-help-open="true"]');
    const helpButton = candidate.getByRole('button',
      {name: 'Need more help', exact: true});
    const helpBefore = await helpSurface.count();
    const requiresHelp = auditMember.sourceContract.needMoreHelpScripts
      .length > 0;
    let helpOpen = 0;
    let helpTexts = [];
    let screenshotReceipt;
    if (requiresHelp) {
      invariant(await helpButton.count() === 1,
        `${auditMember.animationId} source-bound help control missing`);
      await helpButton.click();
      await page.waitForFunction((id) => document.querySelector(
        `[data-animation-id="${id}"] ` +
        '[data-source-need-more-help-open="true"]') !== null,
      auditMember.animationId);
      helpOpen = await helpSurface.count();
      helpTexts = (await helpSurface.locator('[data-source-text-object-id]')
        .allTextContents()).map((value) => value.trim());
      screenshotReceipt = await captureExact23Screenshot(page, stage,
        auditMember.animationId);
      await candidate.getByRole('button', {name: 'Close help', exact: true})
        .click();
      await page.waitForFunction((id) => document.querySelector(
        `[data-animation-id="${id}"] ` +
        '[data-source-need-more-help-open="true"]') === null,
      auditMember.animationId);
    } else {
      invariant(await helpButton.count() === 0,
        `${auditMember.animationId} invented a source-empty help control`);
      screenshotReceipt = await captureExact23Screenshot(page, stage,
        auditMember.animationId);
    }
    const helpClose = await helpSurface.count();
    const pausePassed = await provePause(page, candidate);
    const hostFeedbackTransitions = [await hostFeedbackActive(page)];
    const wrong = candidate.locator(
      'button[data-correct-source-option="false"]').first();
    await wrong.click();
    await page.waitForFunction((id) => document.querySelector(
      `[data-animation-id="${id}"] [data-feedback-phase="wrong-feedback"]`)
      !== null, auditMember.animationId);
    hostFeedbackTransitions.push(await hostFeedbackActive(page));
    const firstWrongText = await candidate.locator(
      '[data-feedback-phase="wrong-feedback"] p').first().textContent();
    await candidate.getByRole('button', {name: 'Try again', exact: true})
      .click();
    await page.waitForFunction((id) => document.querySelector(
      `[data-animation-id="${id}"] [data-feedback-phase="choosing"]`) !==
        null && document.querySelector(
          '[data-lesson-host-practice-feedback-active="false"]') !== null,
    auditMember.animationId);
    hostFeedbackTransitions.push(await hostFeedbackActive(page));
    await wrong.click();
    await page.waitForFunction((id) => document.querySelector(
      `[data-animation-id="${id}"] [data-feedback-phase="wrong-feedback"]`)
      !== null, auditMember.animationId);
    hostFeedbackTransitions.push(await hostFeedbackActive(page));
    const secondWrongText = await candidate.locator(
      '[data-feedback-phase="wrong-feedback"] p').first().textContent();
    await candidate.getByRole('button', {name: 'Continue', exact: true})
      .click();
    await page.waitForFunction((id) => document.querySelector(
      `[data-animation-id="${id}"] [data-feedback-phase="complete"]`) !==
        null && document.querySelector(
          '[data-lesson-host-practice-feedback-active="false"]') !== null,
    auditMember.animationId);
    hostFeedbackTransitions.push(await hostFeedbackActive(page));
    await clickReplay(page, candidate);
    await page.waitForFunction((id) => document.querySelector(
      `[data-animation-id="${id}"] [data-feedback-phase="choosing"]`) !==
      null, auditMember.animationId);
    const replayHelpCount = await helpSurface.count();
    const correct = candidate.locator(
      'button[data-correct-source-option="true"]');
    await correct.click();
    await page.waitForFunction((id) => document.querySelector(
      `[data-animation-id="${id}"] [data-feedback-phase="right-feedback"]`)
      !== null, auditMember.animationId);
    hostFeedbackTransitions.push(await hostFeedbackActive(page));
    await candidate.getByRole('button', {name: 'Continue', exact: true})
      .click();
    await page.waitForFunction((id) => document.querySelector(
      `[data-animation-id="${id}"] [data-feedback-phase="complete"]`) !==
        null && document.querySelector(
          '[data-lesson-host-practice-feedback-active="false"]') !== null,
    auditMember.animationId);
    hostFeedbackTransitions.push(await hostFeedbackActive(page));
    invariant(await candidate.locator(
      '[data-host-reset-status="blocked"]').count() === 0,
    `${auditMember.animationId} typed host reset was blocked`);
    const receipt = Object.freeze({animationId: auditMember.animationId,
      visibleMath: Object.freeze(visibleMath), correctSlot, sourceGeometry,
      correctGraph, firstWrongText: firstWrongText ?? null,
      secondWrongText: secondWrongText ?? null,
      firstWrongPassed: true, secondWrongPassed: true, rightPassed: true,
      helpLifecycle: Object.freeze({before: helpBefore, open: helpOpen,
        close: helpClose, replay: replayHelpCount}), helpTexts,
      pausePassed, hostFeedbackTransitions,
      replayResetPassed: replayHelpCount === 0,
      pageSpecificAssetRequestCount: capture.pageAssets.length,
      errors: capture.errors, screenshot: screenshotReceipt});
    assertAChoiceBrowserReceipt(receipt, auditMember);
    return Object.freeze({receipt, requests: capture.requests});
  } finally {
    await capture.page.close();
  }
}

async function exerciseATwoTry(browser, pages, stage, auditMember) {
  const capture = await openDomRoute(browser, pages, auditMember.animationId);
  try {
    const {page, candidate} = capture;
    const frame = () => candidate.locator('[data-source-nested-frame]')
      .getAttribute('data-source-nested-frame').then(Number);
    const count = () => candidate.locator('[data-two-try-source-count]')
      .getAttribute('data-two-try-source-count').then(Number);
    const nestedFrames = [await frame()];
    const tryCounts = [await count()];
    const helpSurface = candidate.getByLabel('Local help surface');
    const helpBefore = await helpSurface.count();
    await candidate.getByRole('button', {name: 'Need more help', exact: true})
      .click();
    await helpSurface.waitFor();
    const helpOpen = await helpSurface.count();
    const screenshotReceipt = await captureExact23Screenshot(page, stage,
      auditMember.animationId);
    await candidate.getByRole('button', {name: 'Close help', exact: true})
      .click();
    await page.waitForFunction((id) => document.querySelector(
      `[data-animation-id="${id}"] [aria-label="Local help surface"]`) ===
      null, auditMember.animationId);
    const helpClose = await helpSurface.count();
    const pausePassed = await provePause(page, candidate);
    for (let attempt = 0; attempt < 2; attempt += 1) {
      await candidate.getByRole('button',
        {name: 'Open attempt feedback', exact: true}).click();
      nestedFrames.push(await frame());
      await candidate.getByRole('button',
        {name: 'Close feedback', exact: true}).click();
      nestedFrames.push(await frame());
      await candidate.getByRole('button',
        {name: 'Continue local parent transition', exact: true}).click();
      nestedFrames.push(await frame());
      tryCounts.push(await count());
    }
    await clickReplay(page, candidate);
    const exactPrivateSelector = exactPrivateTwoTryCandidateSelector(
      auditMember.animationId);
    invariant(await page.locator(exactPrivateSelector).count() === 1,
      `${auditMember.animationId} exact private candidate count drifted`);
    await page.waitForFunction(({selector}) => {
      const roots = document.querySelectorAll(selector);
      if (roots.length !== 1) return false;
      const root = roots[0];
      return root.querySelector('[data-source-nested-frame]')?.getAttribute(
        'data-source-nested-frame') === '1' &&
        root.querySelector('[data-two-try-source-count]')?.getAttribute(
          'data-two-try-source-count') === '0';
    }, {selector: exactPrivateSelector}, {timeout: 30_000});
    const replaySnapshots = await page.locator(exactAnimationIdSelector(
      auditMember.animationId)).evaluateAll((roots) => roots.map((root) => ({
      animationId: root.getAttribute('data-animation-id'),
      privateCurrentJs: root.getAttribute('data-private-current-js'),
      nestedFrame: root.querySelector('[data-source-nested-frame]')
        ?.getAttribute('data-source-nested-frame') ?? null,
      sourceCount: root.querySelector('[data-two-try-source-count]')
        ?.getAttribute('data-two-try-source-count') ?? null,
    })));
    selectExactPrivateTwoTryReplayCandidate(replaySnapshots,
      auditMember.animationId);
    nestedFrames.push(await frame());
    tryCounts.push(await count());
    const receipt = Object.freeze({animationId: auditMember.animationId,
      nestedFrames, tryCounts,
      helpLifecycle: Object.freeze({before: helpBefore, open: helpOpen,
        close: helpClose, replay: await helpSurface.count()}),
      pausePassed, replayResetPassed: await frame() === 1 && await count() === 0,
      maintainedLocalParentTransition: await candidate.locator(
        '[data-maintained-local-parent-transition="true"]').count() === 1,
      originalRuntimeParentBindingEstablished: false,
      pageSpecificAssetRequestCount: capture.pageAssets.length,
      errors: capture.errors, screenshot: screenshotReceipt});
    assertATwoTryBrowserReceipt(receipt, auditMember);
    return Object.freeze({receipt, requests: capture.requests});
  } finally {
    await capture.page.close();
  }
}

async function awaitBNaturalStop(page, candidate, frame, expectedPhase) {
  const animationId = await candidate.getAttribute('data-animation-id');
  const exactPrivateSelector = exactPrivateCandidateSelector(animationId);
  invariant(await page.locator(exactPrivateSelector).count() === 1,
    `${animationId} exact private B candidate count drifted`);
  const pause = page.locator(
    'button[data-responsive-focus-key="pause"]:visible');
  invariant(await pause.count() === 1,
    'B interactive seek requires one visible pause control');
  const runtime = page.locator(
    '[data-runtime-transport][data-runtime-paused][data-runtime-replay]');
  const timeline = page.locator(
    'input[data-responsive-focus-key="timeline"]:visible');
  invariant(await runtime.count() === 1 &&
    await runtime.getAttribute('data-runtime-transport') === 'none' &&
    await timeline.count() === 1 && await timeline.isDisabled(),
  `${animationId} natural playback requires the declared no-seek boundary`);
  if (await runtime.getAttribute('data-runtime-paused') === 'true') {
    await pause.click();
    await page.waitForFunction(() => document.querySelector(
      '[data-runtime-transport][data-runtime-paused="false"]') !== null);
  }
  const currentFrame = Number(await candidate.locator('xpath=..')
    .getAttribute('data-flash-frame'));
  invariant(Number.isSafeInteger(currentFrame) && currentFrame >= 1 &&
    currentFrame <= frame, `${animationId} natural stop already skipped`);
  const timeout = Math.max(30_000,
    Math.ceil((frame - currentFrame) * 1000 / 12) + 10_000);
  await page.waitForFunction(({selector, target, phase}) => {
    const roots = document.querySelectorAll(selector);
    if (roots.length !== 1) return false;
    const root = roots[0];
    return root.querySelector('[data-active-stop-frame]')?.getAttribute(
      'data-active-stop-frame') === String(target) &&
      root.querySelector('[data-active-phase]')?.getAttribute(
        'data-active-phase') === phase;
  }, {selector: exactPrivateSelector, target: frame,
    phase: expectedPhase}, {timeout});
  const seekSnapshots = await page.locator(exactAnimationIdSelector(
    animationId)).evaluateAll((roots) => roots.map((root) => ({
    animationId: root.getAttribute('data-animation-id'),
    privateCurrentJs: root.getAttribute('data-private-current-js'),
    activeStopFrame: root.querySelector('[data-active-stop-frame]')
      ?.getAttribute('data-active-stop-frame') ?? null,
    activePhase: root.querySelector('[data-active-phase]')
      ?.getAttribute('data-active-phase') ?? null,
  })));
  selectExactPrivateBSeekCandidate(seekSnapshots, animationId, frame,
    expectedPhase);
  await page.waitForFunction(({selector, target, phase}) => {
    const runtime = document.querySelector(
      '[data-runtime-transport][data-runtime-paused]');
    const roots = document.querySelectorAll(selector);
    if (roots.length !== 1) return false;
    const root = roots[0];
    return runtime?.getAttribute('data-runtime-paused') === 'false' &&
      runtime?.getAttribute('data-runtime-interactive-stop-held') === 'true' &&
      root.querySelector('[data-active-stop-frame]')?.getAttribute(
        'data-active-stop-frame') === String(target) &&
      root.querySelector('[data-active-phase]')?.getAttribute(
        'data-active-phase') === phase;
  }, {selector: exactPrivateSelector, target: frame,
    phase: expectedPhase}, {timeout: 30_000});
  const resumedSnapshots = await page.locator(exactAnimationIdSelector(
    animationId)).evaluateAll((roots) => roots.map((root) => ({
    animationId: root.getAttribute('data-animation-id'),
    privateCurrentJs: root.getAttribute('data-private-current-js'),
    activeStopFrame: root.querySelector('[data-active-stop-frame]')
      ?.getAttribute('data-active-stop-frame') ?? null,
    activePhase: root.querySelector('[data-active-phase]')
      ?.getAttribute('data-active-phase') ?? null,
  })));
  selectExactPrivateBSeekCandidate(resumedSnapshots, animationId, frame,
    expectedPhase);
  assertBSeekResumeRuntime({
    runtimePaused: await page.locator(
      '[data-runtime-transport][data-runtime-paused]').first().getAttribute(
      'data-runtime-paused'),
    interactiveStopHeld: await page.locator(
      '[data-runtime-transport][data-runtime-interactive-stop-held]').first()
      .getAttribute('data-runtime-interactive-stop-held'),
  });
  return Object.freeze({frame: Number(await candidate.locator(
    '[data-active-stop-frame]').getAttribute('data-active-stop-frame')),
  phase: await candidate.locator('[data-active-phase]')
    .getAttribute('data-active-phase')});
}

async function exerciseBPage(browser, pages, stage, auditMember) {
  const capture = await openDomRoute(browser, pages, auditMember.animationId);
  try {
    const {page, candidate} = capture;
    const guidedStopFrames = [...new Set(auditMember.sourceStateMachine
      .guidedHits.map((hit) => hit.frame))];
    const traverseToQuiz = async () => {
      const observed = [];
      for (const frame of guidedStopFrames) {
        observed.push(await awaitBNaturalStop(page, candidate, frame,
          'guided-stop'));
        const control = candidate.getByRole('button',
          {name: `Continue guided step ${frame}`, exact: true});
        invariant(await control.count() === 1 && await control.isEnabled(),
          `${auditMember.animationId} guided stop ${frame} missing`);
        const runtime = page.locator(
          '[data-runtime-transport][data-runtime-replay]');
        const resolvedBefore = Number(await runtime.getAttribute(
          'data-runtime-interactive-stop-resolved-count'));
        await control.click();
        await page.waitForFunction(({id, frame, resolvedBefore}) => {
          const runtime = document.querySelector(
            '[data-runtime-transport][data-runtime-replay]');
          const stage = document.querySelector(
            `.runtime-stage[data-animation-id="${id}"]`);
          return Number(runtime?.getAttribute(
            'data-runtime-interactive-stop-resolved-count')) ===
              resolvedBefore + 1 &&
            Number(stage?.getAttribute('data-flash-frame')) >= frame + 1 &&
            runtime?.getAttribute('data-runtime-interactive-stop') !==
              `${id}-guided-${frame}`;
        }, {id: auditMember.animationId, frame, resolvedBefore});
      }
      observed.push(await awaitBNaturalStop(page, candidate,
        auditMember.sourceStateMachine.quizFrame, 'choosing'));
      return observed;
    };
    const initialStops = await traverseToQuiz();
    const options = candidate.locator('button[data-choice-id]');
    invariant(await options.count() === 4,
      `${auditMember.animationId} exact four choices missing`);
    const visibleLabels = [];
    for (let index = 0; index < 4; index += 1) {
      const option = options.nth(index);
      visibleLabels.push(Object.freeze({
        label: await option.getAttribute('data-choice-id'),
        sourceInstanceName: await option.getAttribute(
          'data-source-instance-name'),
        sourceCharacterId: Number(await option.getAttribute(
          'data-source-button-character-id')),
        correct: await option.getAttribute('data-choice-id') ===
          await candidate.locator('[data-correct-visible-label]')
            .getAttribute('data-correct-visible-label')}));
    }
    const correctSlot = await candidate.locator(
      '[data-correct-visible-label]').getAttribute('data-correct-visible-label');
    const correctButton = candidate.locator(
      `button[data-choice-id="${correctSlot}"]`);
    let specialMathGeometry = null;
    const numberLine = correctButton.locator(
      '[data-math-geometry="x-greater-than-2-open-right-ray"]');
    const absolute = correctButton.locator(
      '[data-math-geometry="absolute-value-x-less-5"]');
    if (await numberLine.count() === 1) {
      specialMathGeometry = Object.freeze({kind: 'number-line-graph',
        boundary: await numberLine.getAttribute('data-boundary-value'),
        closed: await numberLine.getAttribute('data-boundary-closed'),
        direction: await numberLine.getAttribute('data-ray-direction')});
    } else if (await absolute.count() === 1) {
      specialMathGeometry = Object.freeze({kind: 'absolute-value-inequality',
        bars: await absolute.getAttribute('data-absolute-value-bars'),
        operator: await absolute.getAttribute('data-operator'),
        text: (await absolute.textContent())?.replace(/\s+/gu, ' ').trim()});
    }
    const semantic = correctButton.locator('[data-source-semantic-answer]');
    const correctSemanticAnswer = await semantic.count() === 1
      ? (await semantic.textContent())?.trim()
      : auditMember.answerVisibleGeometryCrosswalk.correct.semanticAnswer;
    const correctHelp = candidate.locator(
      '[data-source-instance-name="Mc_Popup"]');
    const stale = candidate.locator('[data-source-instance-name="Mc_PopUp"]');
    const before = await correctHelp.count();
    const staleBefore = await stale.count();
    await candidate.getByRole('button', {name: 'Need more help', exact: true})
      .click();
    await correctHelp.waitFor();
    const open = await correctHelp.count();
    const staleOpen = await stale.count();
    const screenshotReceipt = await captureExact23Screenshot(page, stage,
      auditMember.animationId);
    await candidate.getByRole('button', {name: 'Close help', exact: true})
      .click();
    await page.waitForFunction((id) => document.querySelector(
      `[data-animation-id="${id}"] [data-source-instance-name="Mc_Popup"]`)
      === null, auditMember.animationId);
    const close = await correctHelp.count();
    const staleClose = await stale.count();
    const pausePassed = await provePause(page, candidate);
    const hostFeedbackTransitions = [await hostFeedbackActive(page)];
    const wrong = candidate.locator(
      `button[data-choice-id]:not([data-choice-id="${correctSlot}"])`).first();
    await wrong.click();
    await page.waitForFunction((id) => document.querySelector(
      `[data-animation-id="${id}"] [data-feedback-phase^="wrong-feedback"]`)
      !== null, auditMember.animationId);
    hostFeedbackTransitions.push(await hostFeedbackActive(page));
    const wrongTexts = [(await candidate.locator(
      '[data-feedback-phase^="wrong-feedback"] p').first().textContent())
      ?.trim()];
    await candidate.getByRole('button', {name: 'Try again', exact: true})
      .click();
    await page.waitForFunction((id) => document.querySelector(
      `[data-animation-id="${id}"] [data-active-phase="choosing"]`) !==
        null && document.querySelector(
          '[data-lesson-host-practice-feedback-active="false"]') !== null,
    auditMember.animationId);
    hostFeedbackTransitions.push(await hostFeedbackActive(page));
    await wrong.click();
    await page.waitForFunction((id) => document.querySelector(
      `[data-animation-id="${id}"] [data-feedback-phase="wrong-feedback-2"]`)
      !== null, auditMember.animationId);
    hostFeedbackTransitions.push(await hostFeedbackActive(page));
    wrongTexts.push((await candidate.locator(
      '[data-feedback-phase="wrong-feedback-2"] p').first().textContent())
      ?.trim());
    await candidate.getByRole('button', {name: 'Continue', exact: true})
      .click();
    await page.waitForFunction(() => document.querySelector(
      '[data-lesson-host-practice-feedback-active="false"]') !== null);
    hostFeedbackTransitions.push(await hostFeedbackActive(page));
    await clickReplay(page, candidate);
    const replayHelp = await correctHelp.count();
    const staleReplay = await stale.count();
    const replayStops = await traverseToQuiz();
    await correctButton.click();
    await page.waitForFunction((id) => document.querySelector(
      `[data-animation-id="${id}"] [data-feedback-phase="right-feedback"]`)
      !== null, auditMember.animationId);
    hostFeedbackTransitions.push(await hostFeedbackActive(page));
    await candidate.getByRole('button', {name: 'Continue', exact: true})
      .click();
    await page.waitForFunction(() => document.querySelector(
      '[data-lesson-host-practice-feedback-active="false"]') !== null);
    hostFeedbackTransitions.push(await hostFeedbackActive(page));
    const receipt = Object.freeze({animationId: auditMember.animationId,
      familyId: auditMember.familyId, guidedStopFrames,
      guidedStopsPassed: true,
      naturalStopTraversals: {initial: initialStops, replay: replayStops},
      visibleLabels, correctSlot,
      correctSemanticAnswer, specialMathGeometry,
      p029FeedbackTexts: auditMember.animationId.endsWith('p029')
        ? wrongTexts : null,
      firstWrongPassed: true, secondWrongPassed: true, rightPassed: true,
      helpLifecycle: Object.freeze({before, open, close,
        replay: replayHelp}),
      staleOverlayCounts: Object.freeze({before: staleBefore,
        open: staleOpen, close: staleClose, replay: staleReplay}),
      pausePassed, hostFeedbackTransitions,
      replayResetPassed: replayHelp === 0 && staleReplay === 0,
      pageSpecificAssetRequestCount: capture.pageAssets.length,
      errors: capture.errors, screenshot: screenshotReceipt});
    assertBPageBrowserReceipt(receipt, auditMember);
    return Object.freeze({receipt, requests: capture.requests});
  } finally {
    await capture.page.close();
  }
}

async function exerciseDController(browser, pages, stage) {
  const capture = await openDomRoute(browser, pages, D_IDS[0]);
  try {
    const {page, candidate} = capture;
    const selectedLevels = [];
    const targetAnimationIds = [];
    const sourceHandoffArities = [Number(await candidate.locator(
      '[data-source-handoff-arity]').getAttribute('data-source-handoff-arity'))];
    const pausePassed = await provePause(page, candidate);
    await candidate.getByRole('button', {name: 'Level 1', exact: true}).click();
    await clickReplay(page, candidate);
    await page.waitForFunction((id) => document.querySelector(
      `[data-animation-id="${id}"] button[aria-pressed="true"]`) === null,
    D_IDS[0]);
    const replayResetPassed = await candidate.getByRole('button',
      {name: 'Level 1', exact: true}).getAttribute('aria-pressed') === 'false';
    await candidate.getByRole('button', {name: 'Level 2', exact: true}).click();
    selectedLevels.push(2);
    const screenshotReceipt = await captureExact23Screenshot(page, stage,
      D_IDS[0]);
    await candidate.getByRole('button', {name: 'Start', exact: true}).click();
    await page.waitForFunction((target) => document.querySelector(
      `[data-current-animation-id="${target}"]`) !== null &&
      document.querySelector(
        `[data-animation-id="${target}"][data-private-current-js="true"]`)
        !== null, D_IDS[1]);
    targetAnimationIds.push(await page.locator('[data-current-animation-id]')
      .first().getAttribute('data-current-animation-id'));
    const target = page.locator(exactPrivateCandidateSelector(D_IDS[1]));
    invariant(await target.count() === 1, 'p033 matching target is not unique');
    const targetLevels = [Number((await target.getByRole('button',
      {name: 'Level 2', exact: true}).getAttribute('aria-pressed')) === 'true'
      ? 2 : 1)];
    await page.goto(`${BASE}/en/migration-status/g678-calibration/${D_IDS[0]}`,
      {waitUntil: 'domcontentloaded'});
    await page.waitForFunction((id) => document.querySelector(
      `[data-animation-id="${id}"][data-private-current-js="true"]`) !== null,
    D_IDS[0]);
    const timeline = page.locator(
      'input[data-responsive-focus-key="timeline"]:visible');
    invariant(await timeline.count() === 1 && await timeline.isDisabled(),
      'p033 natural playback requires a disabled frame inspector');
    await page.waitForFunction((id) => document.querySelector(
      `[data-animation-id="${id}"][data-private-current-js="true"] ` +
      '[data-source-handoff-arity="3"]') !== null,
    D_IDS[0], {timeout: 60_000});
    sourceHandoffArities.push(Number(await candidate.locator(
      '[data-source-handoff-arity]').getAttribute('data-source-handoff-arity')));
    await candidate.getByRole('button', {name: 'Level 1', exact: true}).click();
    selectedLevels.push(1);
    await candidate.getByRole('button', {name: 'Start', exact: true}).click();
    await page.waitForFunction((targetId) => document.querySelector(
      `[data-current-animation-id="${targetId}"]`) !== null,
    D_IDS[1]);
    targetAnimationIds.push(await page.locator('[data-current-animation-id]')
      .first().getAttribute('data-current-animation-id'));
    const terminalTarget = page.locator(exactPrivateCandidateSelector(D_IDS[1]));
    await terminalTarget.waitFor();
    invariant(await terminalTarget.count() === 1,
      'p033 terminal matching target is not unique');
    targetLevels.push(Number((await terminalTarget.getByRole('button',
      {name: 'Level 1', exact: true}).getAttribute('aria-pressed')) === 'true'
      ? 1 : 2));
    const legacyOperationRequestCount = capture.requests.filter((request) =>
      isLegacyNetworkOperation(request.url)).length;
    const receipt = Object.freeze({animationId: D_IDS[0],
      sourceHandoffArities, selectedLevels, targetAnimationIds, targetLevels,
      navigationAllowedCount: targetAnimationIds.length,
      legacyOperationRequestCount,
      legacyCallExecuted: legacyOperationRequestCount > 0,
      pausePassed, replayResetPassed,
      pageSpecificAssetRequestCount: capture.pageAssets.length,
      errors: capture.errors, screenshot: screenshotReceipt});
    assertDControllerBrowserReceipt(receipt);
    return Object.freeze({receipt, requests: capture.requests});
  } finally {
    await capture.page.close();
  }
}

async function matchingScore(candidate) {
  const text = await candidate.getByText(/^Score: -?\d+$/u).textContent();
  const value = Number(text?.match(/-?\d+/u)?.[0]);
  invariant(Number.isInteger(value), 'p034 score missing');
  return value;
}

async function selectMatchingPair(candidate, instanceName) {
  const pair = candidate.locator(
    `button[data-source-instance-name="${instanceName}"]`);
  invariant(await pair.count() === 2,
    `p034 ${instanceName} exact pair missing`);
  await pair.nth(0).click();
  await pair.nth(1).click();
}

async function exerciseDMatching(browser, pages, stage) {
  const capture = await openDomRoute(browser, pages, D_IDS[1]);
  try {
    const {page, candidate} = capture;
    const section = candidate.getByLabel(
      'Inequalities matching state-machine candidate');
    const sourceCardCount = Number(await section.getAttribute(
      'data-source-card-count'));
    const levelCount = Number(await section.getAttribute(
      'data-source-level-count'));
    const cards = candidate.locator('button[data-source-instance-name]');
    invariant(await cards.count() === 12,
      'p034 level1 exact12 source cards missing');
    await candidate.locator(
      'button[data-source-instance-name="Mc1"]').first().click();
    await candidate.locator(
      'button[data-source-instance-name="Mc2"]').first().click();
    await page.waitForFunction((id) => document.querySelector(
      `[data-animation-id="${id}"] [data-feedback-phase="wrong-feedback"]`)
      !== null, D_IDS[1]);
    const feedbackDisablePassed = (await cards.evaluateAll((items) =>
      items.map((item) => item.disabled))).every(Boolean);
    const levelOneWrongScore = await matchingScore(candidate);
    await candidate.getByRole('button', {name: 'Continue', exact: true})
      .click();
    await selectMatchingPair(candidate, 'Mc1');
    const levelOneCorrectScore = await matchingScore(candidate);
    await candidate.getByRole('button', {name: 'Continue', exact: true})
      .click();
    await candidate.getByRole('button', {name: 'Level 2', exact: true}).click();
    invariant(await cards.count() === 12,
      'p034 level2 exact12 source cards missing');
    for (const pairId of [1, 2, 3, 4, 5, 6]) {
      await selectMatchingPair(candidate, `Mc${pairId}`);
      await candidate.getByRole('button', {name: 'Continue', exact: true})
        .click();
    }
    await page.waitForFunction((id) => document.querySelector(
      `[data-animation-id="${id}"] [data-feedback-phase="complete"]`) !==
      null, D_IDS[1]);
    const levelTwoFinalScore = await matchingScore(candidate);
    const matchedPairCount = await cards.evaluateAll((items) =>
      new Set(items.filter((item) => item.disabled).map((item) =>
        item.getAttribute('data-source-instance-name'))).size);
    const screenshotReceipt = await captureExact23Screenshot(page, stage,
      D_IDS[1]);
    await clickReplay(page, candidate);
    await page.waitForFunction((id) => {
      const roots = document.querySelectorAll(
        `[data-animation-id="${id}"][data-private-current-js="true"]`);
      if (roots.length !== 1) return false;
      const root = roots[0];
      return root.querySelector('[data-feedback-phase="choosing"]') !== null &&
        [...root.querySelectorAll('strong')].some((item) =>
          item.textContent === 'Score: 0');
    }, D_IDS[1]);
    const replayResetPassed = await matchingScore(candidate) === 0 &&
      await candidate.locator('[data-feedback-phase="choosing"]').count() === 1;
    const receipt = Object.freeze({animationId: D_IDS[1], sourceCardCount,
      levelCount, levelOneWrongScore, levelOneCorrectScore,
      levelTwoFinalScore, matchedPairCount, bothLevelsPassed: true,
      feedbackDisablePassed, replayResetPassed,
      pageSpecificAssetRequestCount: capture.pageAssets.length,
      errors: capture.errors, screenshot: screenshotReceipt});
    assertDMatchingBrowserReceipt(receipt);
    return Object.freeze({receipt, requests: capture.requests});
  } finally {
    await capture.page.close();
  }
}

function parseQuestionSelection(value) {
  return value.split(',').map(Number);
}

async function exerciseDAssessment(browser, pages, stage, audit) {
  const capture = await openDomRoute(browser, pages, D_IDS[2]);
  try {
    const {page, candidate} = capture;
    const section = candidate.getByLabel(
      'Random final assessment state-machine candidate');
    const poolSize = Number(await section.getAttribute(
      'data-question-pool-size'));
    const selection = candidate.locator('[data-random-selection]');
    const initialQuestions = parseQuestionSelection(await selection
      .getAttribute('data-random-selection'));
    const answerKey = audit.behaviorContracts.p044RandomFinalAssessment
      .answerKey.map((entry) => Number(entry.match(/Opt([1-4])$/u)?.[1]));
    for (let index = 0; index < initialQuestions.length; index += 1) {
      const question = initialQuestions[index];
      const correct = answerKey[question - 1];
      const choice = index === 0 ? correct % 4 + 1 : correct;
      await candidate.getByRole('button',
        {name: `Option ${String.fromCharCode(64 + choice)}`, exact: true})
        .click();
    }
    await candidate.getByText(/^Score: 9 \/ 10 — Advanced$/u).waitFor();
    const screenshotReceipt = await captureExact23Screenshot(page, stage,
      D_IDS[2]);
    await candidate.getByRole('button', {name: 'Review answers', exact: true})
      .click();
    const reviewOrder = [];
    for (let index = 0; index < 10; index += 1) {
      const heading = await candidate.getByRole('heading', {level: 3})
        .textContent();
      reviewOrder.push(Number(heading?.match(/Q(\d+)/u)?.[1]));
      await candidate.getByRole('button', {name: index < 9
        ? 'Next review' : 'Finish review', exact: true}).click();
    }
    await candidate.getByText(/^Score: 9 \/ 10 — Advanced$/u).waitFor();
    await clickReplay(page, candidate);
    await page.waitForFunction(({id, prior}) => {
      const roots = document.querySelectorAll(
        `[data-animation-id="${id}"][data-private-current-js="true"]`);
      if (roots.length !== 1) return false;
      const root = roots[0];
      const next = root?.querySelector('[data-random-selection]')?.getAttribute(
        'data-random-selection');
      return next && next !== prior &&
        root?.querySelector('[data-grade="pending"]') !== null;
    }, {id: D_IDS[2], prior: initialQuestions.join(',')});
    const replayQuestions = parseQuestionSelection(await selection
      .getAttribute('data-random-selection'));
    const resetPassed = await candidate.locator('[data-grade="pending"]')
      .count() === 1 && await candidate.getByText(/^Source question Q\d+$/u)
        .count() === 1;
    const receipt = Object.freeze({animationId: D_IDS[2], initialQuestions,
      replayQuestions, poolSize, uniqueQuestionCount:
        new Set(initialQuestions).size, wrongAnswerCount: 1,
      rightAnswerCount: 9, score: 9, grade: 'Advanced', reviewOrder,
      reviewPassed: exact(reviewOrder, initialQuestions), resetPassed,
      pageSpecificAssetRequestCount: capture.pageAssets.length,
      errors: capture.errors, screenshot: screenshotReceipt});
    assertDAssessmentBrowserReceipt(receipt);
    return Object.freeze({receipt, requests: capture.requests});
  } finally {
    await capture.page.close();
  }
}

async function replayPredecessor104(browser, pages, registered, historical) {
  const capture = await capturePage(browser, pages,
    {width: 1280, height: 900});
  const assets = [];
  capture.page.on('response', (response) => {
    if (response.url().includes(`/flash-assets/g678-local/${
      registered.animationId}/canvas-renderer.js`)) {
      assets.push(assetReceipt(response));
    }
  });
  try {
    await capture.page.goto(`${BASE}/en/migration-status/g678-calibration/${
      registered.animationId}`, {waitUntil: 'domcontentloaded'});
    await capture.page.waitForFunction((id) => document.querySelector(
      `canvas[data-course-canvas="${id}"]`)?.getAttribute(
        'data-render-state') === 'ready', registered.animationId,
    {timeout: 45_000});
    const canvas = capture.page.locator(
      `canvas[data-course-canvas="${registered.animationId}"]`);
    const runtime = capture.page.locator(
      '[data-runtime-transport][data-runtime-replay]').first();
    const replayCounterBefore = Number(await runtime.getAttribute(
      'data-runtime-replay'));
    const initialFrame = Number(await canvas.getAttribute('data-flash-frame'));
    const replay = capture.page.getByRole('button',
      {name: 'Replay', exact: true});
    invariant(await replay.count() === 1,
      `${registered.animationId} predecessor Replay control drifted`);
    await replay.click();
    await capture.page.waitForFunction(({id, before}) => {
      const shell = document.querySelector(
        '[data-runtime-transport][data-runtime-replay]');
      const canvasElement = document.querySelector(
        `canvas[data-course-canvas="${id}"]`);
      return Number(shell?.getAttribute('data-runtime-replay')) === before + 1 &&
        canvasElement?.getAttribute('data-render-state') === 'ready';
    }, {id: registered.animationId, before: replayCounterBefore});
    invariant(assets.length === 1 && capture.pageAssets.length === 1,
      `${registered.animationId} predecessor asset count drifted`);
    const receipt = Object.freeze({animationId: registered.animationId,
      historicalKind: historical.kind, frameCount: historical.frameCount,
      frameDomain: await canvas.getAttribute('data-flash-frame-domain'),
      initialFrame, replayFrame: Number(await canvas.getAttribute(
        'data-flash-frame')), replayCounterBefore,
      replayCounterAfter: replayCounterBefore + 1,
      renderState: await canvas.getAttribute('data-render-state'),
      asset: assets[0], fullHistoricalInteractionReplayed: false,
      requests: capture.requests, errors: capture.errors});
    assertPredecessor104ReplayReceipt(receipt, historical, registered);
    return receipt;
  } finally {
    await capture.page.close();
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

async function exerciseAllLessons(browser, pages, stage, catalog, freeze) {
  const capture = await capturePage(browser, pages,
    {width: 1440, height: 1100});
  try {
    await capture.page.goto(`${BASE}/en?screen=lessons`,
      {waitUntil: 'networkidle'});
    await capture.page.getByRole('button', {name: 'G6–G8 shared'}).click();
    await capture.page.waitForFunction(() => document.querySelectorAll(
      '[data-workspace-screen="lessons"] article').length === 44);
    const vector = lessonVector(catalog, freeze);
    const cards = capture.page.locator(
      '[data-workspace-screen="lessons"] article');
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
    const fileName = 'all-lessons-377-l9-l11-complete.png';
    await capture.page.screenshot({path: path.join(stage, fileName),
      fullPage: true});
    const receipt = Object.freeze({sharedCardCount: 44,
      linkedCardCount: await cards.locator('a').count(),
      registeredPageSum: 377, exactLessonVector: observed,
      completeLessonKeys: ['shared-alg001-l09', 'shared-alg001-l11'],
      algL09: Object.freeze({registeredPageCount: 41, activePageCount: 41,
        complete: true}),
      algL11: Object.freeze({registeredPageCount: 44, activePageCount: 44,
        complete: true}), errors: capture.errors});
    assertAllLessons377Receipt(receipt, catalog, freeze);
    return Object.freeze({receipt, requests: capture.requests,
      screenshot: await screenshot(stage, fileName)});
  } finally {
    await capture.page.close();
  }
}

function exact23Summary(receipt, kind) {
  return Object.freeze({animationId: receipt.animationId, kind,
    domModuleLoaded: true,
    pageSpecificAssetRequestCount: receipt.pageSpecificAssetRequestCount,
    deepProductBehaviorPassed: true});
}

async function buildEvidence(inputs) {
  const target = projectPath(OUTPUT);
  invariant(!await exists(target), `${OUTPUT} already exists`);
  const stage = `${target}.staging-${process.pid}`;
  await mkdir(stage, {recursive: false});
  let browser = null;
  let currentStep = 'browser-start';
  const completedPageReceipts = [];
  try {
    invariant(inputs.snapshots, 'focused377 build requires registry snapshots');
    await Promise.all([
      writeFile(path.join(stage, 'private-current-js-registry.snapshot.json'),
        inputs.snapshots.privateRegistry, {flag: 'wx'}),
      writeFile(path.join(stage, 'registry.local-only.generated.snapshot.ts'),
        inputs.snapshots.localLoader, {flag: 'wx'}),
      writeFile(path.join(stage,
        'registry.local-only.metadata.generated.snapshot.ts'),
      inputs.snapshots.localRegistry, {flag: 'wx'}),
    ]);
    const freeze = inputs.values.registrationFreeze.value;
    const pages = new Map(freeze.selectedPages.map((page) =>
      [page.animationId, page]));
    const aRecords = recordsById(inputs.values.aAudit.value);
    const bRecords = recordsById(inputs.values.bAudit.value);
    const predecessor = inputs.values.final354.value;
    browser = await chromium.launch({headless: true});
    const evidence = {schemaVersion: 1,
      artifactType: 'g678-alg-l11-remaining23-browser-qa-v1',
      generatedAt: new Date().toISOString(), baseUrl: BASE,
      inputs: inputs.descriptors,
      browser: {name: 'Chromium', version: browser.version(),
        executable: inputs.descriptors.chromiumExecutable},
      registeredCurrentJsPages: 377, allLessons: null, exact23Pages: [],
      aInteractive10: null, bBehavior10: null, dAdvanced3: null,
      currentHostPredecessorReplay: null, observedRequests: [],
      requestPolicy: null, screenshots: [], acceptanceEffects: FALSE_EFFECTS};
    currentStep = 'all-lessons';
    const all = await exerciseAllLessons(browser, pages, stage,
      inputs.values.catalog.value, freeze);
    evidence.allLessons = all.receipt;
    evidence.observedRequests.push(...all.requests);
    evidence.screenshots.push(all.screenshot);

    const aResults = [];
    for (const id of A_IDS) {
      currentStep = id;
      const member = aRecords.get(id);
      invariant(member, `${id} A audit member missing`);
      const result = id === A_IDS[0]
        ? await exerciseP006(browser, pages, stage, member)
        : A_TWO_TRY_IDS.includes(id)
          ? await exerciseATwoTry(browser, pages, stage, member)
          : await exerciseAChoice(browser, pages, stage, member);
      aResults.push(result.receipt);
      completedPageReceipts.push(result.receipt);
      process.stdout.write(`Behavior check passed: ${id}\n`);
      evidence.observedRequests.push(...result.requests);
      evidence.screenshots.push(result.receipt.screenshot);
    }
    evidence.aInteractive10 = {placementCount: 10,
      choicePlacementCount: 7, twoTryPlacementCount: 2,
      p006DeterministicSilentPassed: true,
      choiceHelpAndHostResetPassed: true,
      originalParentBindingClaimed: false, pages: aResults};

    const bResults = [];
    for (const id of B_IDS) {
      currentStep = id;
      const member = bRecords.get(id);
      invariant(member, `${id} B audit member missing`);
      const result = await exerciseBPage(browser, pages, stage, member);
      bResults.push(result.receipt);
      completedPageReceipts.push(result.receipt);
      process.stdout.write(`Behavior check passed: ${id}\n`);
      evidence.observedRequests.push(...result.requests);
      evidence.screenshots.push(result.receipt.screenshot);
    }
    evidence.bBehavior10 = {placementCount: 10, guidedPlacementCount: 3,
      allGuidedStopsPassed: true, correctHelpLifecyclePassed: true,
      staleOverlayAbsentAllStates: true,
      typedHostFeedbackResetPassed: true, pages: bResults};

    currentStep = D_IDS[0];
    const controller = await exerciseDController(browser, pages, stage);
    completedPageReceipts.push(controller.receipt);
    currentStep = D_IDS[1];
    const matching = await exerciseDMatching(browser, pages, stage);
    completedPageReceipts.push(matching.receipt);
    currentStep = D_IDS[2];
    const assessment = await exerciseDAssessment(browser, pages, stage,
      inputs.values.dAudit.value);
    completedPageReceipts.push(assessment.receipt);
    const dResults = [controller.receipt, matching.receipt,
      assessment.receipt];
    for (const result of [controller, matching, assessment]) {
      evidence.observedRequests.push(...result.requests);
      evidence.screenshots.push(result.receipt.screenshot);
    }
    evidence.dAdvanced3 = {placementCount: 3, p033HandoffPassed: true,
      p034BothLevelsAndScoringPassed: true,
      p044PoolGradeReviewResetPassed: true, pages: dResults};

    currentStep = 'predecessor104';
    const predecessorResults = await runPool(predecessor.samples, 4,
      async (historical) => {
        const registered = pages.get(historical.animationId);
        invariant(registered,
          `${historical.animationId} predecessor missing from provisional377`);
        return replayPredecessor104(browser, pages, registered, historical);
      });
    for (const result of predecessorResults) {
      evidence.observedRequests.push(...result.requests);
    }
    evidence.currentHostPredecessorReplay = {
      historicalFinal354SampleCount: 104,
      currentHostPredecessorReplayCount: 104,
      uniqueCurrentHostPredecessorModuleCount: 104,
      fullHistoricalSpecialInteractionReplay: false,
      limitation:
        'Every final354 sample is replayed for current-host readiness and exact Canvas asset integrity; historical special interactions are not reclassified as complete.',
      results: predecessorResults};

    const exact23Map = new Map([
      ...aResults.map((receipt) => [receipt.animationId,
        exact23Summary(receipt, receipt.animationId === A_IDS[0]
          ? 'a-random-silent' : A_TWO_TRY_IDS.includes(receipt.animationId)
            ? 'a-two-try-local-parent' : 'a-choice-feedback')]),
      ...bResults.map((receipt) => [receipt.animationId,
        exact23Summary(receipt, B_GUIDED_IDS.includes(receipt.animationId)
          ? 'b-guided-choice' : 'b-tutorial-choice')]),
      ...dResults.map((receipt) => [receipt.animationId,
        exact23Summary(receipt, 'd-advanced-manual')]),
    ]);
    evidence.exact23Pages = IDS.map((id) => exact23Map.get(id));
    invariant(evidence.exact23Pages.every(Boolean) &&
      evidence.screenshots.length === 24,
    'focused377 exact23 or screenshot denominator drifted');
    assertFocused377BrowserMetadata(evidence.browser,
      evidence.inputs.chromiumExecutable);
    assertFocused377ScreenshotComposition(evidence);
    evidence.requestPolicy = requestPolicy377Receipt(
      evidence.observedRequests, pages);
    assertRequestPolicy377Receipt(evidence.observedRequests,
      evidence.requestPolicy, pages);
    await writeFile(path.join(stage, 'evidence.json'), stableBytes(evidence),
      {flag: 'wx'});
    await browser.close();
    browser = null;
    await rename(stage, target);
    return evidence;
  } catch (error) {
    const failed = `${stage}.failed-${Date.now()}`;
    await writeFile(path.join(stage, 'failure-diagnostic.json'), stableBytes({
      artifactType: 'g678-remaining23-failed-run-diagnostic-v1',
      status: 'failed-unvalidated-diagnostic-only', currentStep,
      generatedAt: new Date().toISOString(), inputs: inputs.descriptors,
      message: error.message, stack: error.stack,
      completedPageReceipts,
      screenshotPathNote: 'Receipt paths name intended canonical files; only '
        + 'same-basename files in this retained failed directory exist.',
      retainedDirectory: path.relative(ROOT, failed),
      acceptanceEffects: FALSE_EFFECTS,
    }), {flag: 'wx'});
    await rename(stage, failed);
    throw error;
  } finally {
    await browser?.close();
  }
}

async function verifyScreenshots(evidence) {
  invariant(evidence.screenshots.length === 24 &&
    new Set(evidence.screenshots.map((item) => item.path)).size === 24,
  'focused377 screenshot set drifted');
  for (const item of evidence.screenshots) {
    const current = await binding(item.path);
    invariant(current.bytes === item.bytes && current.sha256 === item.sha256,
      `${item.path} focused377 screenshot drifted`);
  }
}

async function checkEvidence(inputs) {
  const evidenceBinding = await binding(`${OUTPUT}/evidence.json`, true);
  const evidence = evidenceBinding.value;
  const freeze = inputs.values.registrationFreeze.value;
  const pages = new Map(freeze.selectedPages.map((page) =>
    [page.animationId, page]));
  const aRecords = recordsById(inputs.values.aAudit.value);
  const bRecords = recordsById(inputs.values.bAudit.value);
  const predecessor = inputs.values.final354.value;
  invariant(exactKeys(evidence, ['schemaVersion', 'artifactType',
    'generatedAt', 'baseUrl', 'inputs', 'browser',
    'registeredCurrentJsPages', 'allLessons', 'exact23Pages',
    'aInteractive10', 'bBehavior10', 'dAdvanced3',
    'currentHostPredecessorReplay', 'observedRequests', 'requestPolicy',
    'screenshots', 'acceptanceEffects']) &&
    evidence.schemaVersion === 1 && evidence.artifactType ===
      'g678-alg-l11-remaining23-browser-qa-v1' &&
    evidence.baseUrl === BASE && evidence.registeredCurrentJsPages === 377 &&
    exact(evidence.inputs, inputs.descriptors) &&
    exact(evidence.exact23Pages.map((item) => item.animationId), IDS) &&
    evidence.exact23Pages.every((item) =>
      exactKeys(item, ['animationId', 'kind', 'domModuleLoaded',
        'pageSpecificAssetRequestCount', 'deepProductBehaviorPassed']) &&
      item.domModuleLoaded === true &&
      item.pageSpecificAssetRequestCount === 0 &&
      item.deepProductBehaviorPassed === true) &&
    evidence.observedRequests.every((item) => exactKeys(item,
      ['method', 'resourceType', 'url'])) &&
    evidence.screenshots.every(validScreenshot) &&
    exact(evidence.acceptanceEffects, FALSE_EFFECTS),
  'focused377 durable identity/gate evidence drifted');
  assertFocused377BrowserMetadata(evidence.browser,
    inputs.descriptors.chromiumExecutable);
  assertFocused377ScreenshotComposition(evidence);
  assertAllLessons377Receipt(evidence.allLessons,
    inputs.values.catalog.value, freeze);
  const aReceipts = new Map(evidence.aInteractive10.pages.map((item) =>
    [item.animationId, item]));
  invariant(exactKeys(evidence.aInteractive10, ['placementCount',
    'choicePlacementCount', 'twoTryPlacementCount',
    'p006DeterministicSilentPassed', 'choiceHelpAndHostResetPassed',
    'originalParentBindingClaimed', 'pages']) &&
    evidence.aInteractive10.placementCount === 10 &&
    evidence.aInteractive10.choicePlacementCount === 7 &&
    evidence.aInteractive10.twoTryPlacementCount === 2 &&
    evidence.aInteractive10.p006DeterministicSilentPassed === true &&
    evidence.aInteractive10.choiceHelpAndHostResetPassed === true &&
    evidence.aInteractive10.originalParentBindingClaimed === false &&
    exact(evidence.aInteractive10.pages.map((item) => item.animationId), A_IDS),
  'focused377 A family summary drifted');
  assertP006BrowserReceipt(aReceipts.get(A_IDS[0]), aRecords.get(A_IDS[0]));
  for (const id of A_CHOICE_IDS) {
    assertAChoiceBrowserReceipt(aReceipts.get(id), aRecords.get(id));
  }
  for (const id of A_TWO_TRY_IDS) {
    assertATwoTryBrowserReceipt(aReceipts.get(id), aRecords.get(id));
  }
  invariant(exactKeys(evidence.bBehavior10, ['placementCount',
    'guidedPlacementCount', 'allGuidedStopsPassed',
    'correctHelpLifecyclePassed', 'staleOverlayAbsentAllStates',
    'typedHostFeedbackResetPassed', 'pages']) &&
    evidence.bBehavior10.placementCount === 10 &&
    evidence.bBehavior10.guidedPlacementCount === 3 &&
    evidence.bBehavior10.allGuidedStopsPassed === true &&
    evidence.bBehavior10.correctHelpLifecyclePassed === true &&
    evidence.bBehavior10.staleOverlayAbsentAllStates === true &&
    evidence.bBehavior10.typedHostFeedbackResetPassed === true &&
    exact(evidence.bBehavior10.pages.map((item) => item.animationId), B_IDS),
  'focused377 B family summary drifted');
  for (const receipt of evidence.bBehavior10.pages) {
    assertBPageBrowserReceipt(receipt, bRecords.get(receipt.animationId));
  }
  invariant(exactKeys(evidence.dAdvanced3, ['placementCount',
    'p033HandoffPassed', 'p034BothLevelsAndScoringPassed',
    'p044PoolGradeReviewResetPassed', 'pages']) &&
    evidence.dAdvanced3.placementCount === 3 &&
    evidence.dAdvanced3.p033HandoffPassed === true &&
    evidence.dAdvanced3.p034BothLevelsAndScoringPassed === true &&
    evidence.dAdvanced3.p044PoolGradeReviewResetPassed === true &&
    exact(evidence.dAdvanced3.pages.map((item) => item.animationId), D_IDS),
  'focused377 D family summary drifted');
  assertDControllerBrowserReceipt(evidence.dAdvanced3.pages[0]);
  assertDMatchingBrowserReceipt(evidence.dAdvanced3.pages[1]);
  assertDAssessmentBrowserReceipt(evidence.dAdvanced3.pages[2]);
  const predecessorIds = assertFinal354Predecessor104(predecessor);
  invariant(exactKeys(evidence.currentHostPredecessorReplay,
    ['historicalFinal354SampleCount', 'currentHostPredecessorReplayCount',
      'uniqueCurrentHostPredecessorModuleCount',
      'fullHistoricalSpecialInteractionReplay', 'limitation', 'results']) &&
    evidence.currentHostPredecessorReplay
      .historicalFinal354SampleCount === 104 &&
    evidence.currentHostPredecessorReplay
      .currentHostPredecessorReplayCount === 104 &&
    evidence.currentHostPredecessorReplay
      .uniqueCurrentHostPredecessorModuleCount === 104 &&
    evidence.currentHostPredecessorReplay
      .fullHistoricalSpecialInteractionReplay === false &&
    exact(evidence.currentHostPredecessorReplay.results.map((item) =>
      item.animationId), predecessorIds),
  'focused377 predecessor104 summary drifted');
  for (let index = 0; index < predecessor.samples.length; index += 1) {
    const historical = predecessor.samples[index];
    assertPredecessor104ReplayReceipt(
      evidence.currentHostPredecessorReplay.results[index], historical,
      pages.get(historical.animationId));
  }
  assertRequestPolicy377Receipt(evidence.observedRequests,
    evidence.requestPolicy, pages);
  await verifyScreenshots(evidence);
  return Object.freeze({evidence, binding: evidenceBinding});
}

export function provisional377StableBindingStatus() {
  return Object.freeze({ready: STABLE_INTEGRATION_BINDINGS !== null,
    blocker: STABLE_INTEGRATION_BINDINGS === null
      ? 'integration-bindings-pending' : null});
}

export function stableProvisional377IntegrationBindings() {
  return STABLE_INTEGRATION_BINDINGS;
}

export async function qaG678AlgL11Remaining23Browser({check = false} = {}) {
  invariant(PARSED_BASE.origin === 'http://127.0.0.1:3324' &&
    PARSED_BASE.protocol === 'http:' &&
    PARSED_BASE.hostname === '127.0.0.1' && PARSED_BASE.username === '' &&
    PARSED_BASE.password === '' && PARSED_BASE.pathname === '/' &&
    PARSED_BASE.search === '' && PARSED_BASE.hash === '',
  'provisional377 QA base must be one loopback HTTP origin');
  invariant(STABLE_INTEGRATION_BINDINGS !== null,
    'provisional377 integration bindings are pending');
  const inputs = await currentInputs(check);
  let evidence;
  let receipt;
  if (check) {
    const checked = await checkEvidence(inputs);
    evidence = checked.evidence;
    receipt = checked.binding.buffer;
  } else {
    evidence = await buildEvidence(inputs);
    receipt = stableBytes(evidence);
  }
  return Object.freeze({check, output: `${OUTPUT}/evidence.json`,
    bytes: receipt.length, sha256: sha256(receipt),
    registeredCurrentJsPages: 377,
    exact23DeepProductRecordCount: evidence.exact23Pages.length,
    predecessorReplayCount: evidence.currentHostPredecessorReplay
      .currentHostPredecessorReplayCount,
    currentHostUniqueSampledModuleCount: 127,
    screenshotCount: evidence.screenshots.length,
    allObservedRequestsLoopback:
      evidence.requestPolicy.allObservedRequestsLoopback,
    allObservedRequestsExplicitlyAllowed:
      evidence.requestPolicy.allObservedRequestsExplicitlyAllowed,
    legacyNetworkOperationsObserved:
      evidence.requestPolicy.legacyNetworkOperationsObserved,
    requestGuardMode: evidence.requestPolicy.guardMode,
    blockedRequestCount: evidence.requestPolicy.blockedRequestCount,
    exact23FamilyCalibrationPending: true,
    overallG678ProductCalibrationPassed: false,
    acceptanceEffects: FALSE_EFFECTS});
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  const args = process.argv.slice(2);
  invariant(args.length <= 1 && (args.length === 0 || args[0] === '--check'),
    'usage: qa-g678-alg-l11-remaining23-browser.mjs [--check]');
  qaG678AlgL11Remaining23Browser({check: args[0] === '--check'})
    .then((result) => process.stdout.write(`${JSON.stringify(result, null, 2)}\n`))
    .catch((error) => {
      process.stderr.write(`${error.stack ?? error.message}\n`);
      process.exitCode = 1;
    });
}
