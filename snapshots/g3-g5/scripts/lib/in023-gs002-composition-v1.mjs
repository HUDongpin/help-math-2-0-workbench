import assert from 'node:assert/strict';
import {generateGs002EndStage, GS002_ASSET_PATH, GS002_BASE_BYTES, GS002_BASE_SHA256,
  GS002_EFFECTIVE_BYTES, GS002_EFFECTIVE_SHA256, GS002_SWF_SHA256, digest} from './gs002-sprite450-end-stage-v1.mjs';
import {validateGs002OverlayManifest, gs002Reference} from './gs002-materialization-overlay-v1.mjs';

export const ID = 'course-g03-l01-gs-002';
export const CALIBRATION = 'g3-l1-page-only-current-js-74-v1';
export const WRITER_PATH = 'scripts/build-in023-gs002-end-stage-bindings-v1.mjs';
export const BINDING_PLAN_PATH = 'catalog/runtime-transforms/in023-gs002-composition-v1/binding-plan.json';
export const TRANSFORM_PATH = 'catalog/runtime-transforms/gs002-sprite450-split-v1/manifest.json';
export const OLD_FREEZE_PATH = 'catalog/product-bridge-calibrations/g3-l1-page-only-current-js-74-v1.json';
export const NEW_FREEZE_PATH = 'catalog/product-bridge-calibrations/g3-l1-page-only-current-js-74-gs002-end-stage-v1.json';
export const PUBLIC_PATH = 'apps/web/public/current-js-preview-assets/' + GS002_ASSET_PATH;
export const CANDIDATE_PATH = 'apps/web/candidate-assets/flash-assets/2026-08-22-page-only-candidates-v1/' + GS002_ASSET_PATH;
export const PROFILE_PATH = 'apps/web/config/current-js-candidate-assets.v1.json';
export const REGISTRY_PATH = 'packages/demos/private-current-js-registry.json';
export const TIMELINE_PATH = 'packages/demos/src/timelines/' + ID + '.ts';
export const GENERATED_PATH = 'apps/web/lib/g3-l1-page-only-current-js.generated.ts';
export const ACCEPTANCE_KEYS = Object.freeze(['authoritativeOriginalRuntime', 'behaviorParityAccepted', 'visualFidelityAccepted',
  'audioAccepted', 'humanVisualAccepted', 'ownerAccepted', 'strictComplete', 'releaseEligible', 'published']);
export const IN023_OUTPUTS = Object.freeze([
  ['apps/web/public/current-js-preview-assets/courses/course-g03-l04-in-023/canvas-renderer.js', 4835033, 'c659e8aa21c29ca98c858c4c45c865faed4434b287fe6d465d5cc8c95610248d'],
  ['apps/web/candidate-assets/flash-assets/2026-08-22-page-only-candidates-v1/courses/course-g03-l04-in-023/canvas-renderer.js', 4835033, 'c659e8aa21c29ca98c858c4c45c865faed4434b287fe6d465d5cc8c95610248d'],
  [PROFILE_PATH, 472048, 'b21d229bfaafbd2505d468b07486a6d1b5f4cbf2b89948cea3c0001b1a47fddd'],
  ['packages/demos/src/timelines/course-g03-l04-in-023.ts', 2677, 'b56f01cf4e535bce11e93542d5a829ad7ea790aa4cc1a35fac33ec361c5ea7db'],
  ['catalog/product-bridge-calibrations/g3-l4-page-only-current-js-67-in023-end-stage-v1.json', 112700, 'a30d117418ba259f2f827b01dfc1b8dfa671aca14733be6bf899a08dc3ca6803'],
  ['apps/web/lib/g3-l4-page-only-current-js.generated.ts', 100298, '41af212ad04f5410d00beda2d1ff4ff3eeb11c949f50517c729bbef37e14fe9a'],
  [REGISTRY_PATH, 308488, '11dac8d4e0b4f33954b80cb7b25c71e089b590b953361a5bc2858d3e872d199d'],
]);
export const GS002_PREDECESSORS = Object.freeze([
  [PUBLIC_PATH, GS002_BASE_BYTES, GS002_BASE_SHA256], [CANDIDATE_PATH, GS002_BASE_BYTES, GS002_BASE_SHA256],
  [TIMELINE_PATH, 11694, '36d6641ba4b16bceb9c073c01c75c4c8884c29f9660b725ef42d8ba93dba6fa1'],
  [GENERATED_PATH, 111550, '0b8bc9356b56a05c69c4a6450966c0e5a2daef7d13c24b85b14fe52f01743d2b'],
  [OLD_FREEZE_PATH, 123516, '9a9fe3ab7d79088dc1dd8cc96834b33901ab963b6a0162044f53b1ec5fe683fd'],
]);
export const OUTPUT_PATHS = Object.freeze([...IN023_OUTPUTS.map(r => r[0]), PUBLIC_PATH, CANDIDATE_PATH, TIMELINE_PATH, GENERATED_PATH, NEW_FREEZE_PATH]);
export const CURRENT_PREDECESSORS = Object.freeze([...IN023_OUTPUTS, ...GS002_PREDECESSORS.slice(0, 4)]);
const json = value => Buffer.from(JSON.stringify(value, null, 2) + '\n');
const ref = (relative, bytes) => ({path: relative, bytes: bytes.length, sha256: digest(bytes)});
function keys(value, expected, label) {
  assert(value && typeof value === 'object' && !Array.isArray(value), label);
  assert.equal(Object.getPrototypeOf(value), Object.prototype, label + ' must be JSON');
  const names = Reflect.ownKeys(value); assert(names.every(n => typeof n === 'string'));
  assert.deepEqual(names.sort(), [...expected].sort(), label + ' fields');
  assert(Object.values(Object.getOwnPropertyDescriptors(value)).every(d => Object.hasOwn(d, 'value')), label + ' accessor');
}
function checkedRef(value, expectedPath, label) {
  keys(value, ['path', 'bytes', 'sha256'], label);
  assert.equal(value.path, expectedPath); assert(Number.isSafeInteger(value.bytes) && value.bytes > 0);
  assert(/^[a-f0-9]{64}$/.test(value.sha256));
}
function noAcceptance(value) {
  keys(value, ACCEPTANCE_KEYS, 'Acceptance'); assert(Object.values(value).every(v => v === false));
}
function one(rows, predicate, count) { assert.equal(rows.length, count); const found = rows.filter(predicate); assert.equal(found.length, 1); return found[0]; }
function bytesMatch(bytes, record, label) { assert(Buffer.isBuffer(bytes), label + ' must be Buffer'); assert.equal(bytes.length, record[1], label + ' bytes'); assert.equal(digest(bytes), record[2], label + ' hash'); }
function generatedData(bytes) {
  const text = bytes.toString('utf8'), marker = 'export const G3_L1_PAGE_ONLY_CURRENT_JS = Object.freeze(';
  const start = text.indexOf(marker); assert(start > 0); assert(text.endsWith(' as const);\n'));
  const header = text.slice(0, start), data = JSON.parse(text.slice(start + marker.length, -' as const);\n'.length));
  assert.equal(header + marker + JSON.stringify(data, null, 2) + ' as const);\n', text);
  return {header, marker, data};
}

export const CORE_PATH = 'scripts/lib/in023-gs002-composition-v1.mjs';
export const GS002_OVERLAY_PATH = 'scripts/lib/gs002-materialization-overlay-v1.mjs';
export const RETAINED_ROOT = 'catalog/runtime-transforms/in023-gs002-composition-v1/predecessors';
export const PREAPPLICATION_ROOT = 'catalog/runtime-transforms/in023-gs002-composition-v1/preapplication';
export const RETAINED_METADATA = Object.freeze([
  {inputPath: TIMELINE_PATH, retainedPath: RETAINED_ROOT + '/gs002-timeline.ts', bytes: GS002_PREDECESSORS[2][1], sha256: GS002_PREDECESSORS[2][2]},
  {inputPath: GENERATED_PATH, retainedPath: RETAINED_ROOT + '/g3l1-generated.ts', bytes: GS002_PREDECESSORS[3][1], sha256: GS002_PREDECESSORS[3][2]},
  {inputPath: OLD_FREEZE_PATH, retainedPath: RETAINED_ROOT + '/g3l1-freeze.json', bytes: GS002_PREDECESSORS[4][1], sha256: GS002_PREDECESSORS[4][2]},
]);
export function validateBindingPlan(plan, transform, writerBytes) {
  keys(plan, ['schemaVersion', 'kind', 'members', 'in023Producer', 'currentPredecessors', 'gs002Predecessors',
    'retainedMetadata', 'implementation', 'v13Candidate', 'expandedBefore', 'transformation', 'outputPaths'], 'Composition binding plan');
  assert.equal(plan.schemaVersion, 1); assert.equal(plan.kind, 'in023-gs002-finite-binding-composition-v1');
  assert.deepEqual(plan.members, ['course-g03-l04-in-023', ID]); assert.deepEqual(plan.outputPaths, OUTPUT_PATHS);
  assert.deepEqual(plan.currentPredecessors, CURRENT_PREDECESSORS.map(([path, bytes, sha256]) => ({path, bytes, sha256})));
  assert.deepEqual(plan.gs002Predecessors, GS002_PREDECESSORS.map(([path, bytes, sha256]) => ({path, bytes, sha256})));
  assert.deepEqual(plan.retainedMetadata, RETAINED_METADATA);
  assert.deepEqual(plan.in023Producer, {path: 'scripts/build-g3-l4-in023-end-stage-bindings-v1.mjs', bytes: 12814,
    sha256: '861292de7be7abc6038bd1d204d36b9f8487785006a9a1e54cc79625e8c91fa0'});
  keys(plan.implementation, ['writer', 'core', 'gs002Overlay'], 'Composition implementation');
  gs002Reference(plan.implementation.writer, WRITER_PATH, 'Writer');
  gs002Reference(plan.implementation.core, CORE_PATH, 'Core');
  gs002Reference(plan.implementation.gs002Overlay, GS002_OVERLAY_PATH, 'GS002 overlay');
  assert(Buffer.isBuffer(writerBytes)); assert.equal(writerBytes.length, plan.implementation.writer.bytes);
  assert.equal(digest(writerBytes), plan.implementation.writer.sha256);
  gs002Reference(plan.v13Candidate, PREAPPLICATION_ROOT + '/v13-candidate.json', 'V13 candidate');
  assert.equal(plan.v13Candidate.sha256, '46141746797be971e560a303265783125baed594970e712fbcc3d89c14b6df1a');
  keys(plan.expandedBefore, ['receipt', 'inputFiles', 'inputSha256'], 'Expanded before');
  gs002Reference(plan.expandedBefore.receipt, PREAPPLICATION_ROOT + '/expanded-before-receipt.json', 'Expanded before receipt');
  assert.equal(plan.expandedBefore.receipt.sha256, 'a9958ba9c009575732b012b58f02685ac83969e4e46614a432be9fb18631bfa7');
  assert.equal(plan.expandedBefore.inputFiles, 11789);
  assert.equal(plan.expandedBefore.inputSha256, '860013aa6407e376099528336faef909d867ee173c34ea05548123e9eb354323');
  gs002Reference(plan.transformation, TRANSFORM_PATH, 'Transformation reference');
  validateGs002OverlayManifest(transform);
}

// Pure production of twelve exact effective buffers. The caller supplies output
// bytes from the UNCHANGED IN023 V1 pure producer; its old priorHash permissions
// are intentionally not accepted or reused. No filesystem writes occur here.
export function createComposedBindingOutputs(input) {
  keys(input, ['in023Outputs', 'gs002Predecessors', 'gs002BaseBytes', 'gs002Ir', 'planBytes', 'transformManifestBytes', 'writerBytes'], 'Aggregate input');
  assert.equal(input.in023Outputs.length, 7); assert.equal(input.gs002Predecessors.length, 5);
  const inherited = input.in023Outputs.map((row, index) => {
    keys(row, ['path', 'bytes'], 'IN023 pure output'); assert.equal(row.path, IN023_OUTPUTS[index][0]);
    bytesMatch(row.bytes, IN023_OUTPUTS[index], row.path); return {path: row.path, bytes: Buffer.from(row.bytes)};
  });
  const predecessors = new Map(input.gs002Predecessors.map((row, index) => {
    keys(row, ['path', 'bytes'], 'GS002 predecessor'); assert.equal(row.path, GS002_PREDECESSORS[index][0]);
    bytesMatch(row.bytes, GS002_PREDECESSORS[index], row.path); return [row.path, row.bytes];
  }));
  const plan = JSON.parse(input.planBytes), transformation = JSON.parse(input.transformManifestBytes);
  validateBindingPlan(plan, transformation, input.writerBytes);
  assert.deepEqual(plan.transformation, ref(TRANSFORM_PATH, input.transformManifestBytes));
  const runtime = generateGs002EndStage(input.gs002BaseBytes, input.gs002Ir);
  assert(runtime.length === GS002_EFFECTIVE_BYTES && digest(runtime) === GS002_EFFECTIVE_SHA256);
  const intermediateProfile = inherited[2].bytes, intermediateRegistry = inherited[6].bytes;
  const profile = JSON.parse(intermediateProfile), registry = JSON.parse(intermediateRegistry);
  const originalProfile = structuredClone(profile), originalRegistry = structuredClone(registry);
  const profileRow = one(profile.entries, r => r.assetPath === GS002_ASSET_PATH, 1331);
  assert.deepEqual(profileRow, {assetPath: GS002_ASSET_PATH, relativePath: ID + '/canvas-renderer.js', storageRoot: 'candidate',
    releaseId: 'lesson-g03-l01-place-value-page-only', bytes: GS002_BASE_BYTES, sha256: GS002_BASE_SHA256});
  profileRow.bytes = GS002_EFFECTIVE_BYTES; profileRow.sha256 = GS002_EFFECTIVE_SHA256;
  const inverseProfile = structuredClone(profile);
  Object.assign(inverseProfile.entries.find(r => r.assetPath === GS002_ASSET_PATH), {bytes: GS002_BASE_BYTES, sha256: GS002_BASE_SHA256});
  assert(json(inverseProfile).equals(intermediateProfile), 'Non-GS002 profile field changed');

  const freezeBytesBefore = predecessors.get(OLD_FREEZE_PATH), freeze = JSON.parse(freezeBytesBefore);
  assert.equal(freeze.schemaVersion, 1); assert.equal(freeze.calibrationId, CALIBRATION); noAcceptance(freeze.acceptanceEffects);
  assert.equal(freeze.scope.activePageCount, 74); assert.equal(freeze.scope.selectedPageCount, 74); assert.equal(freeze.scope.courseShellCount, 0);
  assert.equal(freeze.runtimeTransformation, undefined);
  const page = one(freeze.selectedPages, p => p.animationId === ID, 74);
  assert.equal(page.globalPageOrdinal, 64); assert.equal(page.sectionCode, 'GS'); assert.equal(page.sectionPageOrdinal, 1);
  assert.equal(page.complexityLane, 'behavior-heavy'); assert.deepEqual(page.source, {swfSha256: GS002_SWF_SHA256, flaSha256: null});
  assert.equal(page.runtime.frameDomain, 'sprite-450'); assert.equal(page.runtime.frameCount, 775); assert.equal(page.runtime.rootBeginFrame, 6); assert.equal(page.runtime.playbackMode, 'once');
  assert.deepEqual(page.behavior, {avm1Executed: false, naturalTraceValidated: false, audioRendered: false});
  assert.equal(page.runtime.asset.runtimeSha256, GS002_BASE_SHA256); assert.equal(page.runtime.asset.runtimeBytes, GS002_BASE_BYTES);
  assert.equal(page.runtime.asset.endStageTransformation, undefined);
  page.runtime.asset.runtimeSha256 = GS002_EFFECTIVE_SHA256; page.runtime.asset.runtimeBytes = GS002_EFFECTIVE_BYTES;
  page.runtime.asset.endStageTransformation = plan.transformation;
  freeze.runtimeTransformation = {kind: 'source-locked-single-runtime-successor', proofStatus: 'source-static-prototype-proof-bound',
    predecessor: ref(OLD_FREEZE_PATH, freezeBytesBefore), manifest: plan.transformation,
    bindingWriter: ref(WRITER_PATH, input.writerBytes), bindingPlan: ref(BINDING_PLAN_PATH, input.planBytes),
    inheritedInputStatus: 'Historical factory, bundle, manifest and adapter declarations remain inherited and unverified; missing files are not reconstructed.',
    outputScope: 'Only GS002 effective runtime; all 74 placements and all independent acceptance fields are preserved.'};
  const inverseFreeze = structuredClone(freeze); delete inverseFreeze.runtimeTransformation;
  const inverseAsset = inverseFreeze.selectedPages.find(p => p.animationId === ID).runtime.asset;
  inverseAsset.runtimeSha256 = GS002_BASE_SHA256; inverseAsset.runtimeBytes = GS002_BASE_BYTES; delete inverseAsset.endStageTransformation;
  assert(json(inverseFreeze).equals(freezeBytesBefore), 'Non-GS002 freeze or inherited field changed');
  const freezeBytes = json(freeze);

  const predecessorGenerated = predecessors.get(GENERATED_PATH), generated = generatedData(predecessorGenerated);
  const data = generated.data; assert.equal(data.calibrationId, CALIBRATION); noAcceptance(data.acceptanceEffects);
  assert.equal(data.course.activePageCount, 74); assert.equal(data.course.courseShellCount, 0);
  assert.deepEqual(data.freeze, {path: OLD_FREEZE_PATH, sha256: digest(freezeBytesBefore)});
  const generatedPage = one(data.pages, p => p.animationId === ID, 74); assert.equal(generatedPage.ordinal, 64);
  assert.equal(generatedPage.runtime.runtimeSha256, GS002_BASE_SHA256); assert.equal(generatedPage.runtime.runtimeBytes, GS002_BASE_BYTES);
  assert.equal(generatedPage.runtime.endStageTransformation, undefined);
  generatedPage.runtime.runtimeSha256 = GS002_EFFECTIVE_SHA256; generatedPage.runtime.runtimeBytes = GS002_EFFECTIVE_BYTES;
  generatedPage.runtime.endStageTransformation = plan.transformation;
  data.freeze = {path: NEW_FREEZE_PATH, sha256: digest(freezeBytes)};
  const inverseGenerated = structuredClone(data);
  inverseGenerated.freeze = {path: OLD_FREEZE_PATH, sha256: digest(freezeBytesBefore)};
  const inverseRuntime = inverseGenerated.pages.find(p => p.animationId === ID).runtime;
  inverseRuntime.runtimeSha256 = GS002_BASE_SHA256; inverseRuntime.runtimeBytes = GS002_BASE_BYTES; delete inverseRuntime.endStageTransformation;
  const inverseGeneratedBytes = Buffer.from(generated.header + generated.marker + JSON.stringify(inverseGenerated, null, 2) + ' as const);\n');
  assert(inverseGeneratedBytes.equals(predecessorGenerated), 'Non-GS002 generated descriptor field changed');
  const generatedBytes = Buffer.from('/* Generated by ' + WRITER_PATH + ' from a retained predecessor. Do not edit. */\n'
    + generated.marker + JSON.stringify(data, null, 2) + ' as const);\n');
  const timelineBefore = predecessors.get(TIMELINE_PATH).toString('utf8');
  const oldLiteral = '"assetSha256": "' + GS002_BASE_SHA256 + '"', nextLiteral = '"assetSha256": "' + GS002_EFFECTIVE_SHA256 + '"';
  assert.equal(timelineBefore.split(oldLiteral).length, 2); assert.equal(timelineBefore.split(nextLiteral).length, 1);
  const timeline = timelineBefore.replace(oldLiteral, nextLiteral); assert.equal(timeline.replace(nextLiteral, oldLiteral), timelineBefore);
  const calibration = one(registry.calibrations, c => c.calibrationId === CALIBRATION, 24);
  assert.equal(calibration.entries.length, 74); assert.equal(calibration.freezeManifest, OLD_FREEZE_PATH);
  calibration.freezeManifest = NEW_FREEZE_PATH;
  const inverseRegistry = structuredClone(registry); inverseRegistry.calibrations.find(c => c.calibrationId === CALIBRATION).freezeManifest = OLD_FREEZE_PATH;
  assert(json(inverseRegistry).equals(intermediateRegistry), 'Registry membership or another calibration changed');
  inherited[2].bytes = json(profile); inherited[6].bytes = json(registry);
  const outputs = [...inherited, {path: PUBLIC_PATH, bytes: runtime}, {path: CANDIDATE_PATH, bytes: runtime},
    {path: TIMELINE_PATH, bytes: Buffer.from(timeline)}, {path: GENERATED_PATH, bytes: generatedBytes}, {path: NEW_FREEZE_PATH, bytes: freezeBytes}];
  assert.deepEqual(outputs.map(o => o.path), OUTPUT_PATHS); assert.equal(new Set(OUTPUT_PATHS).size, 12);
  for (const index of [0, 1, 3, 4, 5]) bytesMatch(outputs[index].bytes, IN023_OUTPUTS[index], 'Preserved IN023 output');
  const in023Asset = 'courses/course-g03-l04-in-023/canvas-renderer.js';
  assert.deepEqual(profile.entries.find(r => r.assetPath === in023Asset), originalProfile.entries.find(r => r.assetPath === in023Asset));
  assert.deepEqual(registry.calibrations.find(c => c.calibrationId === 'g3-l4-page-only-current-js-67-v1'), originalRegistry.calibrations.find(c => c.calibrationId === 'g3-l4-page-only-current-js-67-v1'));
  return {outputs, review: {state: 'composed-effective-bindings', productApplied: false, logicalOutputCount: 12,
    existingIn023OutputsByteIdentical: 5, existingChangedOutputs: 6, newFreezeOutputs: 1, inverseProfileByteEqual: true,
    inverseRegistryByteEqual: true, inverseFreezeByteEqual: true, inverseGeneratedByteEqual: true, inverseTimelineByteEqual: true,
    candidateProfileEntries: 1331, registryCalibrations: 24, g3l1Pages: 74, unchangedOtherG3l1Pages: 73,
    oldG3l1FreezePreserved: ref(OLD_FREEZE_PATH, freezeBytesBefore), browserProofModes: ['parity', 'replay-pixels', 'playback', 'heap'],
    registrationCountDelta: 0, acceptanceCountDelta: 0}};
}

// Call with freshly read current states BEFORE a future write. This deliberately
// permits V13 or the exact effective state, never V1's older priorHash.
export function guardCurrentOutputStates(outputs, states) {
  assert.deepEqual(outputs.map(o => o.path), OUTPUT_PATHS); assert.equal(states.length, 12);
  const predecessors = new Map(CURRENT_PREDECESSORS.map(([path, bytes, sha256]) => [path, {bytes, sha256}]));
  return states.map((state, index) => {
    keys(state, ['path', 'bytes'], 'Current output state'); const output = outputs[index]; assert.equal(state.path, output.path);
    if (state.bytes === null) { assert.equal(output.path, NEW_FREEZE_PATH, 'Required V13 predecessor is missing'); return {path: output.path, state: 'new-absent'}; }
    assert(Buffer.isBuffer(state.bytes));
    if (state.bytes.equals(output.bytes)) return {path: output.path, state: 'exact-effective-output'};
    const prior = predecessors.get(output.path); assert(prior, 'Unknown state at new freeze');
    assert.equal(state.bytes.length, prior.bytes); assert.equal(digest(state.bytes), prior.sha256, 'Third output state rejected');
    return {path: output.path, state: 'exact-v13-predecessor'};
  });
}

