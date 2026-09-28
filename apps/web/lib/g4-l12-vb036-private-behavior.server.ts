import 'server-only';

import {createHash} from 'node:crypto';
import {constants, type BigIntStats} from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';

const REPOSITORY_ROOT = '/Volumes/WestWorld/HELP MATH 2.0-factory-v2';
const ROOT = path.join(
  REPOSITORY_ROOT,
  'work/g4-l12-vb036-behavior-canvas-v3/button52-states-v1',
);
const ANIMATION_ID = 'course-g04-l12-vb-036';
const CONTRACT_ID = 'g4-l12-vb036-source-controller-composite-v1';
const CONTRACT_FINGERPRINT = 'cb4a98cb70c4d466d2b34b4827d049b7b18ffd24a9aad295387045996b09fd9e';
const SCRIPT_SHA256 = '0e957d8c210cb8bea7fb284055e38381c45bb9d08aa261e46bcd8a351c66eb9f';
const SCRIPT_FILE = 'canvas-renderer.js';
const SCRIPT_BYTES = 1_865_848;
const SCRIPT_URL = `/flash-assets/current-js-audio-calibration-v1/${ANIMATION_ID}/source-behavior?sha256=${SCRIPT_SHA256}`;
const ACCEPTANCE_KEYS = Object.freeze([
  'audioAccepted',
  'authoritativeOriginalRuntime',
  'behaviorParityAccepted',
  'currentJavascriptRegistered',
  'humanVisualAccepted',
  'modernMyLessonIntegrated',
  'ownerAccepted',
  'published',
  'releaseEligible',
  'strictComplete',
  'visualFidelityAccepted',
].sort());

const OUTPUTS = Object.freeze({
  'adapter-spec.json': Object.freeze({
    bytes: 135_804,
    sha256: 'a722575361bd3904990c8ba637106ee5ad3fa0e256bd7ad5aedda5b03c276fb6',
  }),
  [SCRIPT_FILE]: Object.freeze({bytes: SCRIPT_BYTES, sha256: SCRIPT_SHA256}),
  'controller-state-api.json': Object.freeze({
    bytes: 688_265,
    sha256: '320e9337ea17d366bfea937cd8cddbad2814241ca0d182f741d5e2a32deace5a',
  }),
  'manifest.json': Object.freeze({
    bytes: 29_561,
    sha256: '57fb6106c0e6b3d99a7cf7c17ce448e83f2fa82f5699bbd452bcac99725d58f9',
  }),
});

const BOUND_INPUTS = Object.freeze({
  baseAdapterSpec: Object.freeze({
    path: 'migrations/course-g04-l12-vb-036/audit/source-static-current-js-candidate-spec.json',
    bytes: 3_730,
    sha256: '0bfa1ae9fcbb1b4d5aefc4713fc51de8dfbf7bcf5d7b1bcb28cf8db44ce626da',
  }),
  courseXml: Object.freeze({
    path: 'source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L12/index.xml',
    bytes: 17_502,
    sha256: '1a90deef7e58247fc9ac4c8e9daa452aa665c11d8cac0e20da77e294c5c75ca0',
  }),
  directoryPublisher: Object.freeze({
    path: 'scripts/lib/g5-l4-atomic-directory-publish.mjs',
    bytes: 8_581,
    sha256: 'a5bc2b5f2885f52a456c7e8d8fe2cd6c2bd559f673d12b1ee72a8c689bb7081d',
  }),
  directoryPublisherNative: Object.freeze({
    path: 'scripts/native/g5-l4-atomic-directory-publish.c',
    bytes: 4_307,
    sha256: 'ef93c69c50a2ace7cb31f0b8546c07b0044ce28145a4a19c090650324b442464',
  }),
  generator: Object.freeze({
    path: 'scripts/build-g4-l12-vb036-behavior-canvas-v3.mjs',
    bytes: 22_186,
    sha256: '949b015b6ae6e7e8206ea4d336733b783d624909ca4506f1f9323f2b83559ee5',
  }),
  maintainedController: Object.freeze({
    path: 'apps/web/lib/g4-l12-vb036-source-controller.ts',
    bytes: 17_879,
    sha256: 'ae52ee40c293cc38ee3190b644f629b4bdf9d85ced948234d4d48721451d3923',
  }),
  predecessorApi: Object.freeze({
    path: 'work/g4-l12-vb036-behavior-canvas-v1/controller-ae52ee40-v1/controller-state-api.json',
    bytes: 681_187,
    sha256: '8670b71e858516abbde5b702235f5ded4f7e98bd05f517ba4310a60eae52c89c',
  }),
  predecessorBaseSpec: Object.freeze({
    path: 'work/g4-l12-page-only-candidate-bundle-v1/extend-v1/members/course-g04-l12-vb-036/adapter-spec.json',
    bytes: 3_779,
    sha256: '28d62d39597cf3d9a67448f0ead5eb255096dd19368a87af6e80189c511627df',
  }),
  predecessorGenerator: Object.freeze({
    path: 'scripts/build-g4-l12-vb036-behavior-canvas-v1.mjs',
    bytes: 22_872,
    sha256: '45a0da3a513fd241f08e47aef9bb07da8411d3b3e4ee2b9429e3ac1109b26c25',
  }),
  predecessorInventory: Object.freeze({
    path: 'work/g4-l12-page-only-candidate-bundle-v1/extend-v1/members/course-g04-l12-vb-036/audit/scenario-inventory.json',
    bytes: 5_550,
    sha256: 'c9f4913afb84ee2bd2600d3e5b124aab7f73aa4359eed1d026e4740c4a7e1dfb',
  }),
  predecessorManifest: Object.freeze({
    path: 'work/g4-l12-vb036-behavior-canvas-v1/controller-ae52ee40-v1/manifest.json',
    bytes: 15_481,
    sha256: 'b8708a3ccc642c2ff4b83057eb609d7995f19ea478fd8c95bd09d67f0a3b67f7',
  }),
  predecessorRuntime: Object.freeze({
    path: 'work/g4-l12-vb036-behavior-canvas-v1/controller-ae52ee40-v1/canvas-renderer.js',
    bytes: 1_855_486,
    sha256: '770e72030908d8a1f8509ff9c4aca24b787e9941fa226458830785530538dba8',
  }),
  predecessorSpec: Object.freeze({
    path: 'work/g4-l12-vb036-behavior-canvas-v1/controller-ae52ee40-v1/adapter-spec.json',
    bytes: 127_991,
    sha256: 'c94c2e89c9ceda52c54d44f13af8aa38b49740e51780f949bf6963d45e843de0',
  }),
  rawFfdecCanvasHelper: Object.freeze({
    path: 'work/g4-l12-ffdec-canvas-pcode-product-factory/extend-v1/members/course-g04-l12-vb-036/canvas/sprites/DefineSprite_216/canvas.js',
    bytes: 52_872,
    sha256: '78256220d01fba044341283703c3923a1ff8ff29499c51f65ab4e6ac825ccb93',
  }),
  rawFfdecFramesHtml: Object.freeze({
    path: 'work/g4-l12-ffdec-canvas-pcode-product-factory/extend-v1/members/course-g04-l12-vb-036/canvas/sprites/DefineSprite_216/frames.html',
    bytes: 1_677_832,
    sha256: '8e579077ae1490680379a2c1a2449daef3098273a70589b1554c698bf76604d3',
  }),
  scenarioInventory: Object.freeze({
    path: 'migrations/course-g04-l12-vb-036/audit/scenario-inventory.json',
    bytes: 5_570,
    sha256: '9ffc6229c77c115ae3fc25e7986d8f6def7baa6fe02b763955c8352edcddd757',
  }),
  sharedAdapterGenerator: Object.freeze({
    path: 'scripts/build-safe-ffdec-canvas-adapter.mjs',
    bytes: 115_553,
    sha256: '1d1dd117dd59a6b7191f2fa8488249ece09bfb1da8837be146677f88a01315dd',
  }),
  sourceSwf: Object.freeze({
    path: 'source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L12/VB/L12VB36.swf',
    bytes: 272_594,
    sha256: '08c76350118e13f0e423692a57881fec48506aed533c780e2662503b08e96f3b',
  }),
  swfXml: Object.freeze({
    path: 'work/g4-l12-ffdec-canvas-pcode-product-factory/extend-v1/members/course-g04-l12-vb-036/swfmill/source.xml',
    bytes: 2_432_692,
    sha256: '5ad69306d727906b07b8653cb0e7091e7cf7abd6265e222bb86fabb1d1b15567',
  }),
  v2Api: Object.freeze({
    path: 'work/g4-l12-vb036-behavior-canvas-v2/course-xml-9ffc6229-v1/controller-state-api.json',
    bytes: 681_187,
    sha256: '8670b71e858516abbde5b702235f5ded4f7e98bd05f517ba4310a60eae52c89c',
  }),
  v2Generator: Object.freeze({
    path: 'scripts/build-g4-l12-vb036-behavior-canvas-v2.mjs',
    bytes: 18_232,
    sha256: 'bb6bd587d6bb27ef8f8dac253833066d0e0180a32ed5cda304dfdea012d035ef',
  }),
  v2Manifest: Object.freeze({
    path: 'work/g4-l12-vb036-behavior-canvas-v2/course-xml-9ffc6229-v1/manifest.json',
    bytes: 18_794,
    sha256: '67ae78af531f57bc6cdfff299cc1e630215b07fbd5e04a69d9389c3d76bbbb8c',
  }),
  v2Runtime: Object.freeze({
    path: 'work/g4-l12-vb036-behavior-canvas-v2/course-xml-9ffc6229-v1/canvas-renderer.js',
    bytes: 1_855_486,
    sha256: '770e72030908d8a1f8509ff9c4aca24b787e9941fa226458830785530538dba8',
  }),
  v2Spec: Object.freeze({
    path: 'work/g4-l12-vb036-behavior-canvas-v2/course-xml-9ffc6229-v1/adapter-spec.json',
    bytes: 127_942,
    sha256: '2a3fca79c2ee641e2f14558a5ea28e360051825879314cac8ca865bea45f732a',
  }),
});

export interface G4L12Vb036PrivateBehavior {
  readonly animationId: typeof ANIMATION_ID;
  readonly url: typeof SCRIPT_URL;
  readonly bytes: typeof SCRIPT_BYTES;
  readonly sha256: typeof SCRIPT_SHA256;
  readonly contractId: typeof CONTRACT_ID;
  readonly sourceContractFingerprintSha256: typeof CONTRACT_FINGERPRINT;
  readonly stateIds: readonly string[];
}

export interface G4L12Vb036PrivateBehaviorScript {
  readonly behavior: G4L12Vb036PrivateBehavior;
  readonly bytes: Buffer;
}

function requireFact(condition: unknown): asserts condition {
  if (!condition) throw new Error('Private VB036 behavior binding is invalid');
}

function record(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function sha256(bytes: Buffer) {
  return createHash('sha256').update(bytes).digest('hex');
}

function metadata(info: BigIntStats) {
  return [info.dev, info.ino, info.uid, info.mode, info.nlink, info.size, info.mtimeNs, info.ctimeNs]
    .map(String).join(':');
}

function currentUid() {
  requireFact(typeof process.geteuid === 'function');
  return BigInt(process.geteuid());
}

async function inspectRoot() {
  const parent = path.dirname(ROOT), parentInfo = await fs.lstat(parent, {bigint: true});
  requireFact(parentInfo.isDirectory() && !parentInfo.isSymbolicLink() && parentInfo.uid === currentUid() &&
    (parentInfo.mode & 0o777n) === 0o700n && await fs.realpath(parent) === parent);
  const info = await fs.lstat(ROOT, {bigint: true});
  requireFact(info.isDirectory() && !info.isSymbolicLink() && info.uid === currentUid() &&
    (info.mode & 0o777n) === 0o555n && await fs.realpath(ROOT) === ROOT);
  const entries = await fs.readdir(ROOT, {withFileTypes: true});
  const names = entries.map(({name}) => name).sort();
  requireFact(entries.every((entry) => entry.isFile() && !entry.isSymbolicLink()) &&
    JSON.stringify(names) === JSON.stringify(Object.keys(OUTPUTS).sort()));
  return `${metadata(info)}:${metadata(parentInfo)}`;
}

async function readStableFile(
  absolute: string,
  expectedBytes: number,
  expectedSha256: string,
  frozenOutput: boolean,
) {
  requireFact(path.isAbsolute(absolute) && await fs.realpath(absolute) === absolute);
  const handle = await fs.open(absolute, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const before = await handle.stat({bigint: true});
    requireFact(before.isFile() && !before.isSymbolicLink() && before.nlink === 1n &&
      before.uid === currentUid() && before.size === BigInt(expectedBytes));
    if (frozenOutput) requireFact((before.mode & 0o777n) === 0o444n);
    const bytes = await handle.readFile();
    const after = await handle.stat({bigint: true});
    const current = await fs.lstat(absolute, {bigint: true});
    requireFact(metadata(before) === metadata(after) && metadata(before) === metadata(current) &&
      bytes.length === expectedBytes && sha256(bytes) === expectedSha256);
    return Object.freeze({absolute, bytes, identity: metadata(before)});
  } finally {
    await handle.close();
  }
}

function requireClosedAcceptance(value: unknown) {
  const acceptance = record(value);
  requireFact(JSON.stringify(Object.keys(acceptance).sort()) === JSON.stringify(ACCEPTANCE_KEYS) &&
    Object.values(acceptance).every((effect) => effect === false));
}

function verifyButton52Contract(value: unknown) {
  const stable = (input: unknown): unknown => Array.isArray(input) ? input.map(stable)
    : input !== null && typeof input === 'object'
      ? Object.fromEntries(Object.keys(input).sort().map((key) => [key, stable(record(input)[key])])) : input;
  const bytes = Buffer.from(JSON.stringify(stable(value)));
  requireFact(bytes.length === 3_060 && sha256(bytes) === 'c18e95d393836f6cc5adf4752eb0413c8c6638ffc877a71b345a9df8a2106859');
}

function verifyManifest(bytes: Buffer) {
  const manifest = record(JSON.parse(bytes.toString('utf8')));
  const composite = record(manifest.behaviorComposite);
  const inputs = record(manifest.inputs);
  const outputs = record(manifest.outputs);
  const runtime = record(manifest.runtimeMetadata);
  const runtimeComposite = record(runtime.sourceBehaviorComposite);
  requireFact(manifest.artifactType === 'g4-l12-vb036-private-behavior-canvas-v3' &&
    manifest.status === 'PRIVATE_WORK_ARTIFACT_NOT_ADMITTED' && manifest.animationId === ANIMATION_ID &&
    manifest.outputRoot === 'work/g4-l12-vb036-behavior-canvas-v3/button52-states-v1');
  requireFact(composite.contractId === CONTRACT_ID &&
    composite.sourceContractFingerprintSha256 === CONTRACT_FINGERPRINT &&
    composite.compositeStateCount === 201 && composite.renderPlanCount === 282 &&
    composite.hostSelectedWrongVariantCount === 3 && composite.hostSelectedRightVariantCount === 4 &&
    composite.sourceFeedbackFunctionCount === 9 && composite.sourceDefinedWrong4Selected === false &&
    composite.sourceDefinedRight5Selected === false && composite.feedbackTextFabricated === false &&
    composite.audioRendered === false);
  requireFact(runtime.animationId === ANIMATION_ID && runtime.fps === 12 &&
    runtime.audioRendering === 'not-included' && runtimeComposite.contractId === CONTRACT_ID &&
    runtimeComposite.sourceContractFingerprintSha256 === CONTRACT_FINGERPRINT &&
    runtimeComposite.requiredByCandidateSession === true && runtimeComposite.avm1Executed === false &&
    Array.isArray(runtimeComposite.stateIds) && runtimeComposite.stateIds.length === 201);
  requireFact(JSON.stringify(Object.keys(inputs).sort()) === JSON.stringify(Object.keys(BOUND_INPUTS).sort()));
  for (const [name, expected] of Object.entries(BOUND_INPUTS)) {
    const actual = record(inputs[name]);
    requireFact(actual.path === expected.path && actual.bytes === expected.bytes &&
      actual.sha256 === expected.sha256);
  }
  for (const [name, file] of [
    ['adapterSpec', 'adapter-spec.json'], ['canvasRuntime', SCRIPT_FILE],
    ['controllerStateApi', 'controller-state-api.json'],
  ] as const) {
    const actual = record(outputs[name]);
    const expected = OUTPUTS[file];
    requireFact(actual.path === `work/g4-l12-vb036-behavior-canvas-v3/button52-states-v1/${file}` &&
      actual.bytes === expected.bytes && actual.sha256 === expected.sha256);
  }
  const repair = record(manifest.predecessorProvenanceRepair);
  requireFact(repair.kind === 'course-xml-binding-only-successor' && repair.acceptanceEffect === 'none' &&
    repair.originalRuntimeAuthority === false && repair.runtimeByteIdentical === true &&
    repair.controllerStateApiByteIdentical === true &&
    repair.predecessorOutputRoot === 'work/g4-l12-vb036-behavior-canvas-v1/controller-ae52ee40-v1');
  for (const [name, expected] of [['canonicalScenarioInventory', BOUND_INPUTS.scenarioInventory],
    ['rawCourseXml', BOUND_INPUTS.courseXml]] as const) {
    const actual = record(repair[name]);
    requireFact(actual.path === expected.path && actual.bytes === expected.bytes && actual.sha256 === expected.sha256);
  }
  const successor = record(manifest.button52StatesSuccessor), predecessor = record(successor.predecessorRuntime);
  requireFact(successor.predecessorOutputRoot === 'work/g4-l12-vb036-behavior-canvas-v2/course-xml-9ffc6229-v1' &&
    predecessor.path === BOUND_INPUTS.v2Runtime.path && predecessor.bytes === BOUND_INPUTS.v2Runtime.bytes &&
    predecessor.sha256 === BOUND_INPUTS.v2Runtime.sha256 && successor.sourceBehaviorCompositeChanged === false &&
    successor.renderPlanChanged === false && successor.audioRendered === false && successor.upStateRecordsPreserved === true &&
    successor.originalPointerLifecycleEstablished === false && successor.acceptanceEffect === 'none' &&
    JSON.stringify(successor.changedSourceFunctions) === '["button52","sprite53"]' &&
    JSON.stringify(successor.addedSafeDrawingMembers) === '["shape48","shape49","sprite51"]');
  verifyButton52Contract(runtime.sourceButton52States);
  // Frozen generation-tool identity only: HTTP never reads or launches xmllint.
  const parser = record(record(manifest.toolchain).xmlParser), executable = record(parser.executable);
  requireFact(parser.runtimeDependency === false && parser.libraryVersion === '20913' &&
    executable.path === '/usr/bin/xmllint' && executable.bytes === 212_064 &&
    executable.sha256 === 'd5bc87cd40a96739fdf5b067e60c3ecfef0d895c95f325afb862774f58e41c75' &&
    JSON.stringify(parser.invocation) === '["--nonet","--xpath","fixed-source-structure-query","-"]');
  requireClosedAcceptance(manifest.acceptanceEffects);
  return runtimeComposite.stateIds as string[];
}

function verifyAdapterSpec(bytes: Buffer) {
  const spec = record(JSON.parse(bytes.toString('utf8')));
  const source = record(spec.source), runtime = record(spec.runtimeContract), evidence = record(spec.evidence);
  const composite = record(runtime.sourceBehaviorComposite), degradation = record(composite.degradation);
  const output = record(spec.output), timeline = record(spec.timeline), local = record(timeline.local);
  requireFact(spec.schemaVersion === 1 && spec.animationId === ANIMATION_ID &&
    spec.classification === 'private-vb036-source-controller-behavior-composite-v1');
  requireFact(source.swf === BOUND_INPUTS.sourceSwf.path && source.swfSha256 === BOUND_INPUTS.sourceSwf.sha256 &&
    local.timelineId === 'sprite-216' && local.frameCount === 82 && runtime.defaultScenario === 'source-static-frame');
  requireFact(evidence.scenarioInventory === BOUND_INPUTS.scenarioInventory.path &&
    evidence.scenarioInventorySha256 === BOUND_INPUTS.scenarioInventory.sha256);
  requireFact(composite.contractId === CONTRACT_ID &&
    composite.sourceContractFingerprintSha256 === CONTRACT_FINGERPRINT &&
    composite.requiredByCandidateSession === true && Array.isArray(composite.states) &&
    composite.states.length === 201 && degradation.sourceFeedbackClipsRendered === true &&
    degradation.sourcePopupAlphaAndRemovalPreserved === true && degradation.feedbackTextFabricated === false &&
    degradation.audioRendered === false && degradation.avm1Executed === false &&
    degradation.originalRandomPrngReproduced === false && degradation.originalRuntimeAccepted === false &&
    degradation.visualFidelityAccepted === false);
  requireFact(output.globalRegistry === 'HELP_MATH_CANVAS_ASSETS' &&
    output.script === 'work/g4-l12-vb036-behavior-canvas-v3/button52-states-v1/canvas-renderer.js' &&
    output.stateApi === 'work/g4-l12-vb036-behavior-canvas-v3/button52-states-v1/controller-state-api.json');
  verifyButton52Contract(runtime.sourceButton52States);
}

function verifyStateApi(bytes: Buffer, manifestStateIds: readonly string[]) {
  const api = record(JSON.parse(bytes.toString('utf8')));
  verifyButton52Contract(api.sourceButton52States);
  const counts = record(api.counts), request = record(api.requestContract), unresolved = record(api.unresolved);
  requireFact(api.schemaVersion === 1 && api.artifactType === 'g4-l12-vb036-controller-render-api-v1' &&
    api.animationId === ANIMATION_ID && api.behaviorCompositeContractId === CONTRACT_ID &&
    api.sourceContractFingerprintSha256 === CONTRACT_FINGERPRINT && api.renderMethod === 'renderComposite');
  requireFact(counts.compositeStateCount === 201 && counts.feedbackStateRequestCount === 200 &&
    counts.mainFrameRequestCount === 82 && counts.renderPlanCount === 282);
  requireFact(request.lang === 'en' && request.scenario === 'source-static-frame' && request.seed === 0 &&
    request.randomVariantAuthority === 'caller-explicit-not-original-prng');
  requireFact(Object.keys(unresolved).length === 5 && Object.values(unresolved).every((value) => value === true));
  requireClosedAcceptance(api.acceptanceEffects);
  requireFact(Array.isArray(api.compositeStateIds) && api.compositeStateIds.length === 201 &&
    new Set(api.compositeStateIds).size === 201 && api.compositeStateIds[0] === 'main-source-frame' &&
    api.compositeStateIds.every((stateId) => typeof stateId === 'string' &&
      (stateId === 'main-source-frame' || /^main-056-(?:wrong-[1-3]|right-[1-4])-feedback-\d{3}-(?:playing|awaiting-close|reset-at-frame-1)$/u.test(stateId))) &&
    JSON.stringify(api.compositeStateIds) === JSON.stringify(manifestStateIds));
  requireFact(Array.isArray(api.renderPlan) && api.renderPlan.length === 282);
  const plannedMainFrames = new Set<number>();
  const plannedFeedbackStates = new Set<string>();
  for (const value of api.renderPlan) {
    const plan = record(value), planRequest = record(plan.request);
    requireFact(planRequest.behaviorCompositeContractId === CONTRACT_ID &&
      planRequest.lang === 'en' && planRequest.scenario === 'source-static-frame' && planRequest.seed === 0);
    if (plan.compositeStateId === 'main-source-frame') {
      requireFact(Number.isInteger(planRequest.frame) && Number(planRequest.frame) >= 1 &&
        Number(planRequest.frame) <= 82 && planRequest.behaviorCompositeState === 'main-source-frame');
      plannedMainFrames.add(Number(planRequest.frame));
    } else {
      requireFact(typeof plan.compositeStateId === 'string' && planRequest.frame === 56 &&
        planRequest.behaviorCompositeState === plan.compositeStateId && plan.planStateId === plan.compositeStateId &&
        (api.compositeStateIds as unknown[]).includes(plan.compositeStateId));
      plannedFeedbackStates.add(plan.compositeStateId);
    }
  }
  requireFact(plannedMainFrames.size === 82 && plannedFeedbackStates.size === 200);
  return Object.freeze([...(api.compositeStateIds as string[])]);
}

async function readVerifiedBinding(): Promise<G4L12Vb036PrivateBehaviorScript> {
  const rootBefore = await inspectRoot();
  const files = Object.fromEntries(await Promise.all(Object.entries(OUTPUTS).map(async ([name, expected]) => [
    name,
    await readStableFile(path.join(ROOT, name), expected.bytes, expected.sha256, true),
  ]))) as Record<keyof typeof OUTPUTS, Awaited<ReturnType<typeof readStableFile>>>;
  const boundInputs = await Promise.all(Object.values(BOUND_INPUTS).map((input) => readStableFile(
    path.join(REPOSITORY_ROOT, input.path), input.bytes, input.sha256, false,
  )));
  const manifestStateIds = verifyManifest(files['manifest.json'].bytes);
  verifyAdapterSpec(files['adapter-spec.json'].bytes);
  const stateIds = verifyStateApi(files['controller-state-api.json'].bytes, manifestStateIds);
  requireFact(rootBefore === await inspectRoot());
  for (const file of [...Object.values(files), ...boundInputs]) {
    requireFact(file.identity === metadata(await fs.lstat(file.absolute, {bigint: true})));
  }
  const behavior = Object.freeze({
    animationId: ANIMATION_ID,
    url: SCRIPT_URL,
    bytes: SCRIPT_BYTES,
    sha256: SCRIPT_SHA256,
    contractId: CONTRACT_ID,
    sourceContractFingerprintSha256: CONTRACT_FINGERPRINT,
    stateIds,
  } satisfies G4L12Vb036PrivateBehavior);
  return Object.freeze({behavior, bytes: files[SCRIPT_FILE].bytes});
}

/** Fresh fixed-work-run verification. This has no cache, fallback, or acceptance effect. */
export async function readG4L12Vb036PrivateBehavior(): Promise<G4L12Vb036PrivateBehavior | null> {
  try {
    return (await readVerifiedBinding()).behavior;
  } catch {
    return null;
  }
}

/** Route-only companion to the serializable reader; request admission remains a separate gate. */
export async function readG4L12Vb036PrivateBehaviorScript(): Promise<G4L12Vb036PrivateBehaviorScript | null> {
  try {
    return await readVerifiedBinding();
  } catch {
    return null;
  }
}
