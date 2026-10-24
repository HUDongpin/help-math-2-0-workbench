import assert from 'node:assert/strict';
import {generateG5L1Gs002EndStage,G5L1_GS002_ASSET_PATH,G5L1_GS002_BASE_BYTES,G5L1_GS002_BASE_SHA256,G5L1_GS002_EFFECTIVE_BYTES,G5L1_GS002_EFFECTIVE_SHA256,G5L1_GS002_SWF_SHA256,digest} from './g5l1-gs002-sprite457-end-stage-v1.mjs';
import {validateG5L1Gs002OverlayManifest,g5l1Gs002Reference} from './g5l1-gs002-materialization-overlay-v1.mjs';
export const ID='course-g05-l01-gs-002';
export const CALIBRATION='g5-l1-page-only-current-js-82-v1';
export const WRITER_PATH='scripts/build-in023-gs002-g5l1-gs002-end-stage-bindings-v1.mjs';
export const CORE_PATH='scripts/lib/in023-gs002-g5l1-gs002-composition-v1.mjs';
export const G5_OVERLAY_PATH='scripts/lib/g5l1-gs002-materialization-overlay-v1.mjs';
export const BINDING_PLAN_PATH='catalog/runtime-transforms/in023-gs002-g5l1-gs002-composition-v1/binding-plan.json';
export const TRANSFORM_PATH='catalog/runtime-transforms/g5l1-gs002-sprite457-split-v1/manifest.json';
export const OLD_FREEZE_PATH='catalog/product-bridge-calibrations/g5-l1-page-only-current-js-82-v1.json';
export const NEW_FREEZE_PATH='catalog/product-bridge-calibrations/g5-l1-page-only-current-js-82-gs002-end-stage-v1.json';
export const PUBLIC_PATH='apps/web/public/current-js-preview-assets/'+G5L1_GS002_ASSET_PATH;
export const CANDIDATE_PATH='apps/web/candidate-assets/flash-assets/2026-08-22-page-only-candidates-v1/'+G5L1_GS002_ASSET_PATH;
export const PROFILE_PATH='apps/web/config/current-js-candidate-assets.v1.json';
export const REGISTRY_PATH='packages/demos/private-current-js-registry.json';
export const TIMELINE_PATH='packages/demos/src/timelines/'+ID+'.ts';
export const GENERATED_PATH='apps/web/lib/g5-l1-page-only-current-js.generated.ts';
export const ACCEPTANCE_KEYS=Object.freeze(['authoritativeOriginalRuntime','behaviorParityAccepted','visualFidelityAccepted','audioAccepted','humanVisualAccepted','ownerAccepted','strictComplete','releaseEligible','published']);
export const TWO_MEMBER_OUTPUTS=Object.freeze([
  [
    "apps/web/public/current-js-preview-assets/courses/course-g03-l04-in-023/canvas-renderer.js",
    4835033,
    "c659e8aa21c29ca98c858c4c45c865faed4434b287fe6d465d5cc8c95610248d"
  ],
  [
    "apps/web/candidate-assets/flash-assets/2026-08-22-page-only-candidates-v1/courses/course-g03-l04-in-023/canvas-renderer.js",
    4835033,
    "c659e8aa21c29ca98c858c4c45c865faed4434b287fe6d465d5cc8c95610248d"
  ],
  [
    "apps/web/config/current-js-candidate-assets.v1.json",
    472047,
    "5ec5661a711f167be354458780938eae3f2b78dd1733c1f3539e6c8be67e77ba"
  ],
  [
    "packages/demos/src/timelines/course-g03-l04-in-023.ts",
    2677,
    "b56f01cf4e535bce11e93542d5a829ad7ea790aa4cc1a35fac33ec361c5ea7db"
  ],
  [
    "catalog/product-bridge-calibrations/g3-l4-page-only-current-js-67-in023-end-stage-v1.json",
    112700,
    "a30d117418ba259f2f827b01dfc1b8dfa671aca14733be6bf899a08dc3ca6803"
  ],
  [
    "apps/web/lib/g3-l4-page-only-current-js.generated.ts",
    100298,
    "41af212ad04f5410d00beda2d1ff4ff3eeb11c949f50517c729bbef37e14fe9a"
  ],
  [
    "packages/demos/private-current-js-registry.json",
    308504,
    "8cf5a8c65de1d930dec130b2fcccb03c5736ff7e66e8ba8a2fa650268f3876f2"
  ],
  [
    "apps/web/public/current-js-preview-assets/courses/course-g03-l01-gs-002/canvas-renderer.js",
    9036623,
    "fe27cea192b26e24e6ecb94c8b06472c4a9b5db67c6adcc8a1fc6ead45632eb2"
  ],
  [
    "apps/web/candidate-assets/flash-assets/2026-08-22-page-only-candidates-v1/courses/course-g03-l01-gs-002/canvas-renderer.js",
    9036623,
    "fe27cea192b26e24e6ecb94c8b06472c4a9b5db67c6adcc8a1fc6ead45632eb2"
  ],
  [
    "packages/demos/src/timelines/course-g03-l01-gs-002.ts",
    11694,
    "4188ab06848802dd447f631250441011d6535c99d0ebb3236bd36654882a050b"
  ],
  [
    "apps/web/lib/g3-l1-page-only-current-js.generated.ts",
    111845,
    "2d30e137ccb231cf7d82db4191b5585d69ff3210cabf181ebc38a4dc5604c528"
  ],
  [
    "catalog/product-bridge-calibrations/g3-l1-page-only-current-js-74-gs002-end-stage-v1.json",
    125063,
    "4877ff074eea85e461429e6b6bcab527bf0b5b1d4d2904946b7e8e8811cf6d68"
  ]
].map(Object.freeze));
export const G5_PREDECESSORS=Object.freeze([
  [
    "apps/web/public/current-js-preview-assets/courses/course-g05-l01-gs-002/canvas-renderer.js",
    14818856,
    "625162519b5bfad2c088e1d0a612409a3bc006a3b5b73f0d2a235a70c95d91e5"
  ],
  [
    "apps/web/candidate-assets/flash-assets/2026-08-22-page-only-candidates-v1/courses/course-g05-l01-gs-002/canvas-renderer.js",
    14818856,
    "625162519b5bfad2c088e1d0a612409a3bc006a3b5b73f0d2a235a70c95d91e5"
  ],
  [
    "packages/demos/src/timelines/course-g05-l01-gs-002.ts",
    11613,
    "6561b536fcb74cbb3cd86684dc8a0b840437769bb9c24554f32e9c310ed302a0"
  ],
  [
    "apps/web/lib/g5-l1-page-only-current-js.generated.ts",
    121424,
    "463f2356219e863a7eb0714e4b5e3355fc5a7d71b38640887b0591a0b7a28367"
  ],
  [
    "catalog/product-bridge-calibrations/g5-l1-page-only-current-js-82-v1.json",
    136489,
    "6c370602a4bf4f59de421640fd50c7baa90eb52885ed38b0c7f3ce7bb5be2be8"
  ]
].map(Object.freeze));
export const OUTPUT_PATHS=Object.freeze([...TWO_MEMBER_OUTPUTS.map(row=>row[0]),PUBLIC_PATH,CANDIDATE_PATH,TIMELINE_PATH,GENERATED_PATH,NEW_FREEZE_PATH]);
export const CURRENT_PREDECESSORS=Object.freeze([...TWO_MEMBER_OUTPUTS,...G5_PREDECESSORS.slice(0,4)]);
export const RETAINED_METADATA=Object.freeze([
  {
    "inputPath": "packages/demos/src/timelines/course-g05-l01-gs-002.ts",
    "retainedPath": "catalog/runtime-transforms/in023-gs002-g5l1-gs002-composition-v1/predecessors/g5gs002-timeline.ts",
    "bytes": 11613,
    "sha256": "6561b536fcb74cbb3cd86684dc8a0b840437769bb9c24554f32e9c310ed302a0"
  },
  {
    "inputPath": "apps/web/lib/g5-l1-page-only-current-js.generated.ts",
    "retainedPath": "catalog/runtime-transforms/in023-gs002-g5l1-gs002-composition-v1/predecessors/g5l1-generated.ts",
    "bytes": 121424,
    "sha256": "463f2356219e863a7eb0714e4b5e3355fc5a7d71b38640887b0591a0b7a28367"
  },
  {
    "inputPath": "catalog/product-bridge-calibrations/g5-l1-page-only-current-js-82-v1.json",
    "retainedPath": "catalog/runtime-transforms/in023-gs002-g5l1-gs002-composition-v1/predecessors/g5l1-freeze.json",
    "bytes": 136489,
    "sha256": "6c370602a4bf4f59de421640fd50c7baa90eb52885ed38b0c7f3ce7bb5be2be8"
  }
].map(Object.freeze));
export const PRESERVED_DEPENDENCIES=Object.freeze([
  {
    "path": "scripts/build-g3-l4-in023-end-stage-bindings-v1.mjs",
    "bytes": 12814,
    "sha256": "861292de7be7abc6038bd1d204d36b9f8487785006a9a1e54cc79625e8c91fa0"
  },
  {
    "path": "scripts/build-in023-gs002-end-stage-bindings-v1.mjs",
    "bytes": 7313,
    "sha256": "6d5ab4261032bbc5f79ba027c410b85b9ee7f3bd8a01f4553eda268fd7ee79f8"
  },
  {
    "path": "scripts/lib/in023-gs002-composition-v1.mjs",
    "bytes": 19463,
    "sha256": "1d2d9408781a886688e16a9f3cc9624164a58a04b3e8168bcca3eafcb815231d"
  },
  {
    "path": "scripts/lib/in023-sprite220-end-stage-v1.mjs",
    "bytes": 6812,
    "sha256": "3fb32eec746f442b9ceac998bdc5bfc4d1f657d9d0e981cd35f69daa01874e1b"
  },
  {
    "path": "scripts/lib/in023-materialization-overlay-v1.mjs",
    "bytes": 8105,
    "sha256": "bae0abfee6fbe68a5a43c68c33ad4b01d17b2504a239fdbe9d1fcfb38a751f7a"
  },
  {
    "path": "scripts/lib/gs002-sprite450-end-stage-v1.mjs",
    "bytes": 9508,
    "sha256": "f643d46eac05d1b2a0dcdc8462a774ebf2a614e1469dfe11f089996b91ed1b34"
  },
  {
    "path": "scripts/lib/gs002-materialization-overlay-v1.mjs",
    "bytes": 17728,
    "sha256": "f1ad4015ef33d58593794823468870359f433838f05b96abed7919857a575576"
  },
  {
    "path": "scripts/lib/ts008-existing-candidate-preservation-v1.mjs",
    "bytes": 5044,
    "sha256": "2d981fe64ec8c5818cab5058787bb66a192a21f8859c2746bd98a1dc29c19f21"
  },
  {
    "path": "scripts/lib/ts008-preservation-overlay-v1.mjs",
    "bytes": 7791,
    "sha256": "42590a77bd61829e00dd790c57ec72a3c9db9ef05bcf0d1228e9a9f79e09cfd6"
  }
].map(Object.freeze));
export const TWO_MEMBER_PRODUCER=Object.freeze({
  "path": "scripts/build-in023-gs002-end-stage-bindings-v1.mjs",
  "bytes": 7313,
  "sha256": "6d5ab4261032bbc5f79ba027c410b85b9ee7f3bd8a01f4553eda268fd7ee79f8"
});
export const PREAPPLICATION_ROOT='catalog/runtime-transforms/in023-gs002-g5l1-gs002-composition-v1/preapplication';
export const V14_CANDIDATE=Object.freeze({
  "path": "catalog/runtime-transforms/in023-gs002-g5l1-gs002-composition-v1/preapplication/v14-candidate.json",
  "bytes": 1320044,
  "sha256": "0e8eef3173c5f14bf70324413fffcacf9ee87a120aabb151af62eb3aa6c0b882"
});
export const EXPANDED_BEFORE=Object.freeze({
  "path": "catalog/runtime-transforms/in023-gs002-g5l1-gs002-composition-v1/preapplication/expanded-before-receipt.json",
  "bytes": 14821,
  "sha256": "950308c7b37b518deee20659ee84242a52c66cfccbdc671a1ae25b536fd19f8c"
});
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
  const text = bytes.toString('utf8'), marker = 'export const G5_L1_PAGE_ONLY_CURRENT_JS = Object.freeze(';
  const start = text.indexOf(marker); assert(start > 0); assert(text.endsWith(' as const);\n'));
  const header = text.slice(0, start), data = JSON.parse(text.slice(start + marker.length, -' as const);\n'.length));
  assert.equal(header + marker + JSON.stringify(data, null, 2) + ' as const);\n', text);
  return {header, marker, data};
}


export function validateBindingPlan(plan,transform,writerBytes) {
  keys(plan,['schemaVersion','kind','members','twoMemberProducer','preservedDependencies','currentPredecessors','g5Predecessors','retainedMetadata','implementation','v14Candidate','expandedBefore','transformation','outputPaths'],'Three-member binding plan');
  assert.equal(plan.schemaVersion,1);assert.equal(plan.kind,'in023-gs002-g5l1-gs002-finite-binding-composition-v1');
  assert.deepEqual(plan.members,['course-g03-l04-in-023','course-g03-l01-gs-002',ID]);assert.deepEqual(plan.outputPaths,OUTPUT_PATHS);
  assert.deepEqual(plan.twoMemberProducer,TWO_MEMBER_PRODUCER);assert.deepEqual(plan.preservedDependencies,PRESERVED_DEPENDENCIES);
  assert.deepEqual(plan.currentPredecessors,CURRENT_PREDECESSORS.map(([path,bytes,sha256])=>({path,bytes,sha256})));
  assert.deepEqual(plan.g5Predecessors,G5_PREDECESSORS.map(([path,bytes,sha256])=>({path,bytes,sha256})));assert.deepEqual(plan.retainedMetadata,RETAINED_METADATA);
  keys(plan.implementation,['writer','core','g5Overlay'],'Three-member implementation');
  for(const[name,relative]of [['writer',WRITER_PATH],['core',CORE_PATH],['g5Overlay',G5_OVERLAY_PATH]])g5l1Gs002Reference(plan.implementation[name],relative,name);
  assert(Buffer.isBuffer(writerBytes));assert.equal(writerBytes.length,plan.implementation.writer.bytes);assert.equal(digest(writerBytes),plan.implementation.writer.sha256);
  assert.deepEqual(plan.v14Candidate,V14_CANDIDATE);g5l1Gs002Reference(plan.v14Candidate,PREAPPLICATION_ROOT+'/v14-candidate.json','V14 candidate');
  keys(plan.expandedBefore,['receipt','inputFiles','inputSha256'],'Expanded before');assert.deepEqual(plan.expandedBefore.receipt,EXPANDED_BEFORE);
  assert.equal(plan.expandedBefore.inputFiles,11827);assert.equal(plan.expandedBefore.inputSha256,'e85fd4c48a0832139cdbdc93aea0424a0622aca89112a3744c7c272409790ee2');
  g5l1Gs002Reference(plan.transformation,TRANSFORM_PATH,'G5 transformation');validateG5L1Gs002OverlayManifest(transform);
}

// Pure production of exactly17 buffers from the unchanged12-buffer producer.
// No inherited priorHash/allowAbsent permissions and no filesystem writes.
export function createThreeMemberComposedOutputs(input) {
  keys(input, ['twoMemberOutputs', 'g5Predecessors', 'g5BaseBytes', 'g5Ir', 'planBytes', 'transformManifestBytes', 'writerBytes'], 'Aggregate input');
  assert.equal(input.twoMemberOutputs.length, 12); assert.equal(input.g5Predecessors.length, 5);
  const inherited = input.twoMemberOutputs.map((row, index) => {
    keys(row, ['path', 'bytes'], 'Two-member pure output'); assert.equal(row.path, TWO_MEMBER_OUTPUTS[index][0]);
    bytesMatch(row.bytes, TWO_MEMBER_OUTPUTS[index], row.path); return {path: row.path, bytes: Buffer.from(row.bytes)};
  });
  const predecessors = new Map(input.g5Predecessors.map((row, index) => {
    keys(row, ['path', 'bytes'], 'G5 GS002 predecessor'); assert.equal(row.path, G5_PREDECESSORS[index][0]);
    bytesMatch(row.bytes, G5_PREDECESSORS[index], row.path); return [row.path, row.bytes];
  }));
  const plan = JSON.parse(input.planBytes), transformation = JSON.parse(input.transformManifestBytes);
  validateBindingPlan(plan, transformation, input.writerBytes);
  assert.deepEqual(plan.transformation, ref(TRANSFORM_PATH, input.transformManifestBytes));
  const runtime = generateG5L1Gs002EndStage(input.g5BaseBytes, input.g5Ir);
  assert(runtime.length === G5L1_GS002_EFFECTIVE_BYTES && digest(runtime) === G5L1_GS002_EFFECTIVE_SHA256);
  const intermediateProfile = inherited[2].bytes, intermediateRegistry = inherited[6].bytes;
  const profile = JSON.parse(intermediateProfile), registry = JSON.parse(intermediateRegistry);
  const originalProfile = structuredClone(profile), originalRegistry = structuredClone(registry);
  const profileRow = one(profile.entries, r => r.assetPath === G5L1_GS002_ASSET_PATH, 1331);
  assert.deepEqual(profileRow, {assetPath: G5L1_GS002_ASSET_PATH, relativePath: ID + '/canvas-renderer.js', storageRoot: 'candidate',
    releaseId: 'lesson-g05-l01-working-with-decimals-and-percents-page-only', bytes: G5L1_GS002_BASE_BYTES, sha256: G5L1_GS002_BASE_SHA256});
  profileRow.bytes = G5L1_GS002_EFFECTIVE_BYTES; profileRow.sha256 = G5L1_GS002_EFFECTIVE_SHA256;
  const inverseProfile = structuredClone(profile);
  Object.assign(inverseProfile.entries.find(r => r.assetPath === G5L1_GS002_ASSET_PATH), {bytes: G5L1_GS002_BASE_BYTES, sha256: G5L1_GS002_BASE_SHA256});
  assert(json(inverseProfile).equals(intermediateProfile), 'Non-G5-GS002 profile field changed');

  const freezeBytesBefore = predecessors.get(OLD_FREEZE_PATH), freeze = JSON.parse(freezeBytesBefore);
  assert.equal(freeze.schemaVersion, 1); assert.equal(freeze.calibrationId, CALIBRATION); noAcceptance(freeze.acceptanceEffects);
  assert.equal(freeze.scope.activePageCount, 82); assert.equal(freeze.scope.selectedPageCount, 82); assert.equal(freeze.scope.courseShellCount, 0);
  assert.equal(freeze.runtimeTransformation, undefined);
  const page = one(freeze.selectedPages, p => p.animationId === ID, 82);
  assert.equal(page.globalPageOrdinal, 72); assert.equal(page.sectionCode, 'GS'); assert.equal(page.sectionPageOrdinal, 1);
  assert.equal(page.complexityLane, 'behavior-heavy'); assert.deepEqual(page.source, {swfSha256: G5L1_GS002_SWF_SHA256, flaSha256: null});
  assert.equal(page.runtime.frameDomain, 'sprite-457'); assert.equal(page.runtime.frameCount, 785); assert.equal(page.runtime.rootBeginFrame, 6); assert.equal(page.runtime.playbackMode, 'once');
  assert.deepEqual(page.behavior, {avm1Executed: false, naturalTraceValidated: false, audioRendered: false});
  assert.equal(page.runtime.asset.runtimeSha256, G5L1_GS002_BASE_SHA256); assert.equal(page.runtime.asset.runtimeBytes, G5L1_GS002_BASE_BYTES);
  assert.equal(page.runtime.asset.endStageTransformation, undefined);
  page.runtime.asset.runtimeSha256 = G5L1_GS002_EFFECTIVE_SHA256; page.runtime.asset.runtimeBytes = G5L1_GS002_EFFECTIVE_BYTES;
  page.runtime.asset.endStageTransformation = plan.transformation;
  freeze.runtimeTransformation = {kind: 'source-locked-single-runtime-successor', proofStatus: 'source-static-prototype-proof-bound',
    predecessor: ref(OLD_FREEZE_PATH, freezeBytesBefore), manifest: plan.transformation,
    bindingWriter: ref(WRITER_PATH, input.writerBytes), bindingPlan: ref(BINDING_PLAN_PATH, input.planBytes),
    inheritedInputStatus: 'Historical factory, bundle, manifest and adapter declarations remain inherited and unverified; missing files are not reconstructed.',
    outputScope: 'Only G5 L1 GS002 effective runtime; all 82 placements and all independent acceptance fields are preserved.'};
  const inverseFreeze = structuredClone(freeze); delete inverseFreeze.runtimeTransformation;
  const inverseAsset = inverseFreeze.selectedPages.find(p => p.animationId === ID).runtime.asset;
  inverseAsset.runtimeSha256 = G5L1_GS002_BASE_SHA256; inverseAsset.runtimeBytes = G5L1_GS002_BASE_BYTES; delete inverseAsset.endStageTransformation;
  assert(json(inverseFreeze).equals(freezeBytesBefore), 'Non-G5-GS002 freeze or inherited field changed');
  const freezeBytes = json(freeze);

  const predecessorGenerated = predecessors.get(GENERATED_PATH), generated = generatedData(predecessorGenerated);
  const data = generated.data; assert.equal(data.calibrationId, CALIBRATION); noAcceptance(data.acceptanceEffects);
  assert.equal(data.course.activePageCount, 82); assert.equal(data.course.courseShellCount, 0);
  assert.deepEqual(data.freeze, {path: OLD_FREEZE_PATH, sha256: digest(freezeBytesBefore)});
  const generatedPage = one(data.pages, p => p.animationId === ID, 82); assert.equal(generatedPage.ordinal, 72);
  assert.equal(generatedPage.runtime.runtimeSha256, G5L1_GS002_BASE_SHA256); assert.equal(generatedPage.runtime.runtimeBytes, G5L1_GS002_BASE_BYTES);
  assert.equal(generatedPage.runtime.endStageTransformation, undefined);
  generatedPage.runtime.runtimeSha256 = G5L1_GS002_EFFECTIVE_SHA256; generatedPage.runtime.runtimeBytes = G5L1_GS002_EFFECTIVE_BYTES;
  generatedPage.runtime.endStageTransformation = plan.transformation;
  data.freeze = {path: NEW_FREEZE_PATH, sha256: digest(freezeBytes)};
  const inverseGenerated = structuredClone(data);
  inverseGenerated.freeze = {path: OLD_FREEZE_PATH, sha256: digest(freezeBytesBefore)};
  const inverseRuntime = inverseGenerated.pages.find(p => p.animationId === ID).runtime;
  inverseRuntime.runtimeSha256 = G5L1_GS002_BASE_SHA256; inverseRuntime.runtimeBytes = G5L1_GS002_BASE_BYTES; delete inverseRuntime.endStageTransformation;
  const inverseGeneratedBytes = Buffer.from(generated.header + generated.marker + JSON.stringify(inverseGenerated, null, 2) + ' as const);\n');
  assert(inverseGeneratedBytes.equals(predecessorGenerated), 'Non-G5-GS002 generated descriptor field changed');
  const generatedBytes = Buffer.from('/* Generated by ' + WRITER_PATH + ' from a retained predecessor. Do not edit. */\n'
    + generated.marker + JSON.stringify(data, null, 2) + ' as const);\n');
  const timelineBefore = predecessors.get(TIMELINE_PATH).toString('utf8');
  const oldLiteral = '"assetSha256": "' + G5L1_GS002_BASE_SHA256 + '"', nextLiteral = '"assetSha256": "' + G5L1_GS002_EFFECTIVE_SHA256 + '"';
  assert.equal(timelineBefore.split(oldLiteral).length, 2); assert.equal(timelineBefore.split(nextLiteral).length, 1);
  const timeline = timelineBefore.replace(oldLiteral, nextLiteral); assert.equal(timeline.replace(nextLiteral, oldLiteral), timelineBefore);
  const calibration = one(registry.calibrations, c => c.calibrationId === CALIBRATION, 24);
  assert.equal(calibration.entries.length, 82); assert.equal(calibration.freezeManifest, OLD_FREEZE_PATH);
  calibration.freezeManifest = NEW_FREEZE_PATH;
  const inverseRegistry = structuredClone(registry); inverseRegistry.calibrations.find(c => c.calibrationId === CALIBRATION).freezeManifest = OLD_FREEZE_PATH;
  assert(json(inverseRegistry).equals(intermediateRegistry), 'Registry membership or another calibration changed');
  inherited[2].bytes = json(profile); inherited[6].bytes = json(registry);
  const outputs = [...inherited, {path: PUBLIC_PATH, bytes: runtime}, {path: CANDIDATE_PATH, bytes: runtime},
    {path: TIMELINE_PATH, bytes: Buffer.from(timeline)}, {path: GENERATED_PATH, bytes: generatedBytes}, {path: NEW_FREEZE_PATH, bytes: freezeBytes}];
  assert.deepEqual(outputs.map(o => o.path), OUTPUT_PATHS); assert.equal(new Set(OUTPUT_PATHS).size, 17);
  for (const index of [0, 1, 3, 4, 5, 7, 8, 9, 10, 11]) bytesMatch(outputs[index].bytes, TWO_MEMBER_OUTPUTS[index], 'Preserved two-member output');
  const in023Asset = 'courses/course-g03-l04-in-023/canvas-renderer.js';
  assert.deepEqual(profile.entries.find(r => r.assetPath === in023Asset), originalProfile.entries.find(r => r.assetPath === in023Asset));
  assert.deepEqual(registry.calibrations.find(c => c.calibrationId === 'g3-l4-page-only-current-js-67-v1'), originalRegistry.calibrations.find(c => c.calibrationId === 'g3-l4-page-only-current-js-67-v1'));
  const g3Gs002Asset='courses/course-g03-l01-gs-002/canvas-renderer.js';
  assert.deepEqual(profile.entries.find(row=>row.assetPath===g3Gs002Asset),originalProfile.entries.find(row=>row.assetPath===g3Gs002Asset));
  assert.deepEqual(registry.calibrations.find(row=>row.calibrationId==='g3-l1-page-only-current-js-74-v1'),originalRegistry.calibrations.find(row=>row.calibrationId==='g3-l1-page-only-current-js-74-v1'));
  return {outputs, review: {state: 'composed-effective-bindings', productApplied: false, logicalOutputCount: 17,
    existingTwoMemberOutputsByteIdentical: 10, existingChangedOutputs: 6, newFreezeOutputs: 1, inverseProfileByteEqual: true,
    inverseRegistryByteEqual: true, inverseFreezeByteEqual: true, inverseGeneratedByteEqual: true, inverseTimelineByteEqual: true,
    candidateProfileEntries: 1331, registryCalibrations: 24, g5l1Pages: 82, unchangedOtherG5l1Pages: 81,
    oldG5l1FreezePreserved: ref(OLD_FREEZE_PATH, freezeBytesBefore), browserProofModes: ['parity', 'replay-pixels', 'playback', 'heap'],
    registrationCountDelta: 0, acceptanceCountDelta: 0}};
}

// Exact current V14 predecessors or the exact proposed effective buffers only.
// Old producer priorHash/allowAbsent permissions are deliberately not consulted.
export function guardCurrentOutputStates(outputs,states) {
  assert.deepEqual(outputs.map(row=>row.path),OUTPUT_PATHS);assert.equal(states.length,17);
  const predecessors=new Map(CURRENT_PREDECESSORS.map(([path,bytes,sha256])=>[path,{bytes,sha256}]));
  return states.map((state,index)=>{
    keys(state,['path','bytes'],'Current three-member output state');const output=outputs[index];assert.equal(state.path,output.path);
    if(state.bytes===null){assert.equal(output.path,NEW_FREEZE_PATH,'Required V14 predecessor is missing');return{path:output.path,state:'new-absent'};}
    assert(Buffer.isBuffer(state.bytes));if(state.bytes.equals(output.bytes))return{path:output.path,state:'exact-effective-output'};
    const predecessor=predecessors.get(output.path);assert(predecessor,'Unknown state at new freeze');assert.equal(state.bytes.length,predecessor.bytes);assert.equal(digest(state.bytes),predecessor.sha256,'Third output state rejected');
    return{path:output.path,state:'exact-v14-predecessor'};
  });
}
