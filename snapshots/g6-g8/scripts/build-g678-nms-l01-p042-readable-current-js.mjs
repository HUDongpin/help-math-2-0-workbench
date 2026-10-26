#!/usr/bin/env node
// One source-locked readable p042 wrapper packet; no registry or descriptor writes.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {lstat, mkdir, readFile, realpath, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {Script} from 'node:vm';
import {build as esbuild, version as esbuildVersion} from 'esbuild';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const ID = 'shared-nms002-l01-p042';
export const RUN_ROOT = 'work/g678-shared-page-factory/g678-nms-l01-p042-readable-current-js-v1';
export const FRAGMENT = 'catalog/product-bridge-calibrations/g678-nms-l01-p042-readable-companion-current-js-v1.fragment.json';
export const BASE = Object.freeze({path: 'catalog/g678-nms-l01-p042-candidate-v1.json', bytes: 73582,
  sha256: '4923ae74bfecc6659d338ff805f9891e956ac6736c91f612628da74a8bd493f5'});
export const READABLE = Object.freeze({path: 'catalog/g678-nms-l01-p042-readable-companion-candidate-v1.json', bytes: 44671,
  sha256: 'fbc18882c13414365ad5e6f05a89fa0acc7cfeeab8ac9a06c4982a20eded997f'});
export const CANDIDATE = 'packages/demos/src/g678-nms-l01-p042-readable-companion-candidate.tsx';
export const CANDIDATE_EXPORT = 'G678_NMS_L01_P042_READABLE_COMPANION_CANDIDATE_MODULE';
export const FAMILY = 'nms-l01-p042-readable-companion-maintained-dom';
export const SUFFIX = 'nms-l01-p042-readable-companion';
export const SOURCE = Object.freeze({path: 'G6-G8-shared/NMS002/L1/TS/L1TS06.swf', bytes: 55501,
  sha256: 'c81f09a098702054a62ac8a7307aca1ac80d305ebe2cf432cfab05a2a7f74f82'});
export const MAIN = Object.freeze({objectId: 23, frameDomain: 'sprite-23', frameCount: 125, depth: 3});
export const OUTPUT = Object.freeze({module: 'packages/demos/src/modules/g678-nms-l01-readable-current-js-p042.tsx',
  timeline: 'packages/demos/src/timelines/g678-nms-l01-readable-current-js-p042.ts',
  member: `${RUN_ROOT}/members/${ID}/member-manifest.json`, inventory: `${RUN_ROOT}/output-inventory.json`,
  run: `${RUN_ROOT}/run-manifest.json`, fragment: FRAGMENT});
export const EFFECTS = Object.freeze(Object.fromEntries(['currentJavaScriptRegistered', 'registrationCandidate',
  'productCalibrationPassed', 'browserCalibrationPassed', 'engineeringPreviewReady', 'behaviorAccepted',
  'authoritativeOriginalRuntime', 'visualFidelityAccepted', 'audioAccepted', 'humanVisualAccepted',
  'ownerAccepted', 'strictComplete', 'releaseEligible', 'released', 'published'].map(key => [key, false])));
export const encode = value => JSON.stringify(value, null, 2) + '\n';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
export const descriptor = (file, bytes) => ({path: file, bytes: Buffer.byteLength(bytes), sha256: sha(bytes)});
const REGISTRY = 'packages/demos/private-current-js-registry.json';
const OWN = 'scripts/build-g678-nms-l01-p042-readable-current-js.mjs';
const TEST = 'scripts/build-g678-nms-l01-p042-readable-current-js.test.mjs';

function canonical(root, file) {
  assert.ok(typeof file === 'string' && !path.isAbsolute(file) && file.split('/').every(s => s && s !== '.' && s !== '..'));
  return path.join(root, file);
}
export async function readBound(file, expected, root = ROOT) {
  const full = path.isAbsolute(file) ? file : canonical(root, file), before = await lstat(full, {bigint: true});
  assert.ok(before.isFile() && !before.isSymbolicLink() && before.nlink === 1n && await realpath(full) === full,
    `Canonical ordinary single-link input required: ${file}`);
  const bytes = await readFile(full), after = await lstat(full, {bigint: true});
  for (const key of ['dev', 'ino', 'size', 'mode', 'mtimeNs', 'nlink']) assert.equal(after[key], before[key]);
  const binding = descriptor(file, bytes); if (expected) assert.deepEqual(binding, expected, `Input drift: ${file}`);
  return {binding, bytes, value: file.endsWith('.json') ? JSON.parse(bytes) : undefined};
}
async function dependency(file, expected) {
  const full = path.resolve(ROOT, file), real = await realpath(full);
  const vendor = await realpath(path.join(ROOT, 'node_modules'));
  return real.startsWith(vendor + path.sep) ? readBound(real, expected) : readBound(file, expected);
}
export async function manifestInput(pin) {
  const full = path.resolve(ROOT, pin.path), real = await realpath(full);
  const vendor = await realpath(path.join(ROOT, 'node_modules'));
  if (real.startsWith(vendor + path.sep)) {
    // esbuild records installed pnpm dependencies relative to the worktree,
    // including ../ to the canonical shared vendor tree. Never permit this for source.
    const observed = await readBound(real);
    assert.deepEqual({...observed.binding, path: pin.path}, pin);
    return {...observed, binding: pin};
  }
  assert.equal(real, full, `Source aliases are not permitted: ${pin.path}`);
  return readBound(pin.path, pin);
}
export function moduleSource() {
  return '"use client";\n// Generated by build-g678-nms-l01-p042-readable-current-js.mjs; do not edit.\n' +
    `import {${CANDIDATE_EXPORT} as candidate} from "../g678-nms-l01-p042-readable-companion-candidate";\n` +
    'import {SOURCE_TIMELINE} from "../timelines/g678-nms-l01-readable-current-js-p042";\n' +
    'if(candidate.key!==SOURCE_TIMELINE.animationId||candidate.maturity!=="private-current-js"||candidate.lessonHost.capabilities.length!==0||SOURCE_TIMELINE.currentJavaScriptRegistered!==false)throw Error("p042 readable source identity drift");\n' +
    'export {SOURCE_TIMELINE};\nexport const CURRENT_JAVASCRIPT_REGISTERED=false as const;\nexport const DOM_RENDERER_IMPLEMENTED=true as const;\nexport default candidate;\n';
}
export function timelineSource(readableBinding) {
  return '// Generated source binding; do not edit.\nexport const SOURCE_TIMELINE = ' + encode({schemaVersion: 1,
    animationId: ID, source: SOURCE, mainTimeline: MAIN, adapterFamily: FAMILY,
    instructionalInputs: [BASE, readableBinding],
    proposedPresentation: {pageInteractionCompanionTargetIdSuffix: SUFFIX, descriptorActivated: false},
    domRendererImplemented: true, currentJavaScriptImplemented: true, currentJavaScriptRegistered: false,
    productCalibrationPassed: false, browserProductCalibrationPassed: false, acceptanceEffects: EFFECTS}).trimEnd() + ' as const;\n';
}
export function runtimeContract(metadata) {
  assert.equal(metadata.key, ID); assert.equal(metadata.maturity, 'private-current-js');
  assert.deepEqual(metadata.movie, {stage: {width: 800, height: 600}, fps: 12, frameCount: 10, durationMs: 833});
  assert.equal(metadata.runtime.defaultFrameDomain, 'sprite-23');
  assert.deepEqual(metadata.runtime.frameDomains, [{id: 'root', frameCount: 10, fps: 12}, {id: 'sprite-23', frameCount: 125, fps: 12, rootFrame: 6}]);
  assert.equal(metadata.playbackMode, 'once'); assert.equal(metadata.playbackEndFrame, 125);
  assert.deepEqual(metadata.playbackEndFrameByDomain, {root: 1, 'sprite-23': 125});
  assert.equal(metadata.reducedMotionFrame, 125); assert.deepEqual(metadata.lessonHost,
    {capabilities: [], legacyOperations: 'blocked', auditStorage: 'memory-only', storesPersonalData: false});
  for (const key of ['audioCues', 'audioTracks', 'interactiveAudioAssets']) assert.deepEqual(metadata[key], []);
  assert.equal(metadata.defaultScenarioByFrameDomain['sprite-23'], 'nms-l01-p042-source-static-frame');
  assert.equal(metadata.scenarios.length, 1); assert.equal(metadata.scenarios[0].id, 'nms-l01-p042-source-static-frame');
  assert.deepEqual(metadata.interactiveStops ?? [], []); assert.deepEqual(metadata.authoredTimelineControls ?? [], []);
  return {stage: {width: 800, height: 600}, rootFrameCount: 10, rootBeginFrame: 6, frameDomain: 'sprite-23', frameCount: 125,
    fps: 12, livePlaybackEndFrame: 125, scenario: 'nms-l01-p042-source-static-frame', language: 'fixed-en', seed: '0',
    interactiveStops: [], authoredTimelineControls: [], reducedMotionFrame: 125, lessonHostCapabilities: []};
}
export async function instantiate(vfs) {
  const entry = `import candidate from ${JSON.stringify(path.join(ROOT, OUTPUT.module))};\n` +
    'import {G678_NMS_L01_P042_CANDIDATE_MODULE as base} from "./packages/demos/src/g678-nms-l01-p042-candidate";\n' +
    'const {Renderer,getFrameState,...metadata}=candidate; const {Renderer:baseRenderer,getFrameState:baseState,...baseMetadata}=base;\n' +
    'module.exports={metadata,baseMetadata,rendererType:typeof Renderer,rendererName:Renderer.name,baseStateInherited:getFrameState===baseState,rendererChanged:Renderer!==baseRenderer};\n';
  const compiled = await esbuild({stdin: {contents: entry, resolveDir: ROOT, loader: 'js'}, bundle: true, write: false,
    platform: 'node', format: 'cjs', jsx: 'automatic', metafile: true, define: {'process.env.NODE_ENV': '"production"'},
    plugins: [{name: 'p042-readable-wrapper-vfs', setup(builder) {
      builder.onResolve({filter: /.*/}, args => {const stem = path.isAbsolute(args.path) ? args.path : path.resolve(args.resolveDir, args.path);
        const found = [stem, stem + '.ts', stem + '.tsx'].find(file => vfs.has(file));
        if (found) return {path: found, namespace: 'p042-vfs'};});
      builder.onLoad({filter: /.*/, namespace: 'p042-vfs'}, args => ({contents: vfs.get(args.path), loader: 'tsx', resolveDir: path.dirname(args.path)}));
    }}]});
  const exports = {}, context = {module: {exports}, exports, console};
  new Script(compiled.outputFiles[0].text).runInNewContext(context, {timeout: 15000});
  const actual = JSON.parse(JSON.stringify(context.module.exports));
  assert.equal(actual.rendererType, 'function'); assert.equal(actual.rendererName, 'NmsL01P042ReadableCompanionRenderer');
  assert.equal(actual.baseStateInherited, true); assert.equal(actual.rendererChanged, true);
  assert.deepEqual(actual.metadata, actual.baseMetadata, 'Readable companion must inherit exact base runtime metadata');
  const runtime = runtimeContract(actual.metadata), dependencies = [];
  for (const file of Object.keys(compiled.metafile.inputs).sort()) {
    if (file === '<stdin>' || file.startsWith('p042-vfs:')) continue;
    dependencies.push((await dependency(file)).binding);
  }
  return {metadata: actual.metadata, runtime, dependencies,
    bundledMetadataAudit: descriptor('in-memory-p042-readable-metadata.cjs', compiled.outputFiles[0].contents),
    toolchain: {nodeVersion: process.version, node: (await readBound(await realpath(process.execPath))).binding,
      esbuildVersion, esbuildPackage: (await dependency('node_modules/esbuild/package.json')).binding}};
}
export async function publishOutputs({outputs, root = ROOT, check = false}) {
  assert.deepEqual([...outputs.keys()].sort(), Object.values(OUTPUT).sort(), 'Only six exact new output files are allowed');
  assert.equal([...outputs.keys()].at(-1), FRAGMENT, 'Authority is published last');
  if (!check) for (const file of outputs.keys()) await assert.rejects(lstat(canonical(root, file)), {code: 'ENOENT'});
  for (const [file, bytes] of outputs) {
    if (check) {assert.ok((await readBound(file, undefined, root)).bytes.equals(Buffer.from(bytes)), `Output drift: ${file}`); continue;}
    let directory = root;
    for (const part of path.dirname(file).split('/')) {
      directory = path.join(directory, part); await mkdir(directory).catch(error => {if (error.code !== 'EEXIST') throw error;});
      const info = await lstat(directory); assert.ok(info.isDirectory() && !info.isSymbolicLink() && await realpath(directory) === directory);
    }
    await writeFile(canonical(root, file), bytes, {flag: 'wx', mode: 0o444});
  }
}
export async function generate({mode = 'plan'} = {}) {
  assert.ok(['plan', 'write', 'check'].includes(mode));
  if (mode === 'plan') return {mode, placementIds: [ID], outputPaths: Object.values(OUTPUT),
    newPlacementCount: 1, registryEntriesWritten: 0, newlyGeneratedVisualPayloadCount: 0, registered: false};
  assert.ok(READABLE.bytes > 0 && /^[a-f0-9]{64}$/.test(READABLE.sha256), 'Reviewed readable companion manifest pin is not installed');
  const registryBefore = await readBound(REGISTRY), base = await readBound(BASE.path, BASE), readable = await readBound(READABLE.path, READABLE);
  const {build: verifyBase} = await import('./g678-nms-l01-p042-build-candidate-manifest.mjs');
  const {build: verifyReadable} = await import('./g678-nms-l01-p042-build-readable-companion-manifest.mjs');
  await verifyBase({check: true}); await verifyReadable({check: true});
  assert.equal(readable.value.animationId, ID); assert.equal(readable.value.module.path, CANDIDATE);
  assert.equal(readable.value.moduleExport, CANDIDATE_EXPORT); assert.deepEqual(readable.value.baseCandidateManifest, BASE);
  assert.deepEqual(base.value.source, SOURCE); assert.deepEqual(readable.value.source, SOURCE);
  assert.ok(Object.values(base.value.gates).every(value => value === false));
  assert.ok(Object.values(readable.value.gates).every(value => value === false));
  assert.ok(readable.value.validation.unitTestsPassed > 0 && readable.value.validation.mountedRecordsPassed > 0);
  assert.equal(readable.value.validation.demosTypecheckPassed, true);
  assert.equal(readable.value.presentation.pageInteractionCompanionTargetIdSuffix, SUFFIX);
  assert.equal(readable.value.presentation.noninteractive, true);
  for (const pin of readable.value.files) await manifestInput(pin);
  const codeInputs = await Promise.all([OWN, TEST, 'scripts/g678-nms-l01-p042-build-candidate-manifest.mjs',
    'scripts/g678-nms-l01-p042-build-readable-companion-manifest.mjs'].map(file => readBound(file)));
  const outputs = new Map([[OUTPUT.module, moduleSource()], [OUTPUT.timeline, timelineSource(READABLE)]]);
  const compiled = await instantiate(new Map([...outputs].map(([file, bytes]) => [path.join(ROOT, file), bytes])));
  assert.deepEqual(compiled.metadata, base.value.actualModule.metadata);
  assert.deepEqual(compiled.metadata, readable.value.actualModule.metadata);
  const moduleFile = descriptor(OUTPUT.module, outputs.get(OUTPUT.module)), timeline = descriptor(OUTPUT.timeline, outputs.get(OUTPUT.timeline));
  const proposedPresentation = {pageInteractionCompanionTargetIdSuffix: SUFFIX, descriptorActivated: false};
  const member = {schemaVersion: 1, artifactType: 'g678-nms-l01-p042-readable-generated-member-v1',
    runId: path.basename(RUN_ROOT), animationId: ID, assetId: `swf-${SOURCE.sha256}`, source: SOURCE, mainTimeline: MAIN,
    adapterFamily: FAMILY, baseCandidateManifest: BASE, readableCandidateManifest: READABLE,
    instructionalInputs: [BASE, READABLE], runtime: compiled.metadata.runtime, runtimeContract: compiled.runtime,
    lessonHost: compiled.metadata.lessonHost, interactiveStops: [], authoredTimelineControls: [], reducedMotionFrame: 125,
    playbackEndFrameByDomain: compiled.metadata.playbackEndFrameByDomain, moduleFile, timeline, proposedPresentation,
    privateData: null, audioIntegrated: false, sourceAudioAssetUrls: [], currentJavaScriptImplemented: true,
    domRendererImplemented: true, currentJavaScriptRegistered: false, productCalibrationPassed: false, acceptanceEffects: EFFECTS};
  outputs.set(OUTPUT.member, encode(member));
  const entry = {key: ID, module: './modules/g678-nms-l01-readable-current-js-p042', maturity: 'private-current-js',
    deploymentScope: 'local-only', adapterFamily: FAMILY, source: SOURCE, mainTimeline: MAIN, runtimeContract: compiled.runtime,
    timeline, moduleFile, memberManifest: descriptor(OUTPUT.member, outputs.get(OUTPUT.member)), privateData: null,
    currentJavaScriptImplemented: true, domRendererImplemented: true, registrationCandidate: false,
    currentJavaScriptRegistered: false, productCalibrationPassed: false, browserProductCalibrationPassed: false,
    wholeLessonEngineeringPreviewReady: false, acceptanceEffects: EFFECTS, proposedPresentation};
  const inventory = [...outputs].sort(([a], [b]) => a.localeCompare(b)).map(([file, bytes]) => descriptor(file, bytes));
  outputs.set(OUTPUT.inventory, encode({schemaVersion: 1, fileCount: 3,
    totalBytes: inventory.reduce((total, file) => total + file.bytes, 0), checksumSetSha256: sha(encode(inventory)), files: inventory,
    newlyGeneratedVisualPayloadCount: 0}));
  const run = {schemaVersion: 1, artifactType: 'g678-nms-l01-p042-readable-compiler-run-v1', runId: path.basename(RUN_ROOT),
    status: 'generated-unregistered-local-readable-candidate', deploymentScope: 'local-only', builder: codeInputs[0].binding,
    boundaryTests: codeInputs[1].binding, codeInputs: codeInputs.map(input => input.binding),
    baseCandidateManifest: BASE, readableCandidateManifest: READABLE, codeDependencyClosure: compiled.dependencies,
    bundledMetadataAudit: compiled.bundledMetadataAudit, toolchain: compiled.toolchain,
    pages: [{animationId: ID, source: SOURCE, mainTimeline: MAIN, runtimeContract: compiled.runtime,
      baseCandidateManifest: BASE, readableCandidateManifest: READABLE, proposedPresentation,
      validation: readable.value.validation}], outputInventory: descriptor(OUTPUT.inventory, outputs.get(OUTPUT.inventory)),
    exactPlacementCount: 1, generatedPlacementCount: 1, placementIds: [ID], newlyGeneratedVisualPayloadCount: 0,
    registryEntriesWritten: 0, candidateRegistrationQaPassed: false, productCalibrationPassed: false, acceptanceEffects: EFFECTS};
  outputs.set(OUTPUT.run, encode(run));
  const compilerRun = descriptor(OUTPUT.run, outputs.get(OUTPUT.run));
  const fragment = {schemaVersion: 1, artifactType: 'g678-nms-l01-p042-readable-companion-current-js-fragment-v1',
    runId: path.basename(RUN_ROOT), compilerRun, baseCandidateManifest: BASE, readableCandidateManifest: READABLE,
    deploymentScope: 'local-only', exactPlacementCount: 1, generatedPlacementCount: 1,
    currentJavaScriptImplementedPlacementCount: 1, domRendererImplementedCount: 1, entries: [entry],
    registryEntriesWritten: 0, registrationCandidatePlacementCount: 0, currentJavaScriptRegisteredCount: 0,
    wholeLessonEngineeringPreviewCount: 0, newlyGeneratedVisualPayloadCount: 0, productCalibrationPassed: false,
    browserProductCalibrationPassed: false, candidateRegistrationQaPassed: false, scaleOutAuthorized: false,
    acceptancePassed: false, releaseAuthorized: false, published: false, acceptanceEffects: EFFECTS};
  outputs.set(FRAGMENT, encode(fragment));
  for (const pin of [BASE, READABLE, ...readable.value.files, ...codeInputs.map(input => input.binding)]) await manifestInput(pin);
  for (const pin of [...compiled.dependencies, compiled.toolchain.node, compiled.toolchain.esbuildPackage]) await readBound(pin.path, pin);
  assert.deepEqual((await readBound(REGISTRY)).binding, registryBefore.binding, 'Concurrent registry drift before source packet publication');
  await publishOutputs({outputs, check: mode === 'check'});
  assert.deepEqual((await readBound(REGISTRY)).binding, registryBefore.binding, 'Concurrent registry drift during source packet publication');
  return {mode, fragment: descriptor(FRAGMENT, outputs.get(FRAGMENT)), compilerRun,
    outputInventory: descriptor(OUTPUT.inventory, outputs.get(OUTPUT.inventory)), outputCount: 6,
    generatedPayloadBytes: inventory.reduce((sum, file) => sum + file.bytes, 0), newlyGeneratedVisualPayloadCount: 0,
    registryEntriesWritten: 0, registered: false, productCalibrationPassed: false};
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2); assert.ok(args.length <= 1 && (!args.length || ['--plan', '--write', '--check'].includes(args[0])));
  generate({mode: args[0]?.slice(2) ?? 'plan'}).then(value => console.log(encode(value))).catch(error => {console.error(error); process.exitCode = 1;});
}
