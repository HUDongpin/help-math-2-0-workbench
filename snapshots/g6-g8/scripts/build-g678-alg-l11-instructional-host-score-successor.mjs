#!/usr/bin/env node
// One new p044 implementation binding; inherit the other22 entries and payloads.
// No registry, product freeze, bridge, source or predecessor output is mutated.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {lstat, mkdir, readFile, realpath, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {Script} from 'node:vm';
import {build as esbuild, version as esbuildVersion} from 'esbuild';
import {generate as checkPredecessorGeneration} from './build-g678-alg-l11-instructional-successor-current-js.mjs';
import {build as checkHostScoreCandidate} from './build-g678-alg-l11-p044-host-score-candidate-manifest.mjs';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const ID = 'shared-alg001-l11-p044';
export const RUN_ID = 'g678-alg-l11-instructional-host-score-successor-v1';
export const RUN_ROOT = `work/g678-shared-page-factory/${RUN_ID}`;
export const FRAGMENT = `catalog/product-bridge-calibrations/${RUN_ID}.fragment.json`;
export const PREDECESSOR_FRAGMENT = {
  path: 'catalog/product-bridge-calibrations/g678-alg-l11-instructional-successor-current-js-v1.fragment.json',
  bytes: 87592, sha256: '902f5337f635367cac29558fce035bcf054a9782bfb57adbe08ab4bade663ce2',
};
export const PREDECESSOR_RUN = {
  path: 'work/g678-shared-page-factory/g678-alg-l11-instructional-successor-current-js-v1/run-manifest.json',
  bytes: 10115, sha256: '4c290bd797a366d31c940db9612053317822f6ece1bc18686e6b614091bef1ae',
};
export const SOURCE_P044_MANIFEST = {
  path: 'catalog/g678-alg-l11-p044-host-score-candidate-v1.json', bytes: 11083,
  sha256: '9c6456931b679600843bf9a3a47b74d9a93217707403086937987c608ac83591',
};
export const SOURCE_IDS = Object.freeze([6,8,9,10,11,14,19,20,21,25,26,27,28,29,30,31,32,33,34,40,41,42,44]
  .map(n => `shared-alg001-l11-p${String(n).padStart(3, '0')}`));
export const OUTPUT_PATHS = Object.freeze({
  module: 'packages/demos/src/modules/g678-alg-l11-instructional-host-score-successor-p044.tsx',
  timeline: 'packages/demos/src/timelines/g678-alg-l11-instructional-host-score-successor-p044.ts',
  member: `${RUN_ROOT}/members/${ID}/member-manifest.json`,
  inventory: `${RUN_ROOT}/output-inventory.json`, run: `${RUN_ROOT}/run-manifest.json`, fragment: FRAGMENT,
});
const CANDIDATE = 'packages/demos/src/g678-alg-l11-p044-host-score-candidate.tsx';
const CANDIDATE_EXPORT = 'G678_ALG_L11_P044_HOST_SCORE_CANDIDATE_MODULE';
const OWN_TEST = 'scripts/build-g678-alg-l11-instructional-host-score-successor.test.mjs';
const REGISTRY = 'packages/demos/private-current-js-registry.json';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const json = value => JSON.stringify(value, null, 2) + '\n';
export const descriptor = (file, bytes) => ({path: file, bytes: Buffer.byteLength(bytes), sha256: sha(bytes)});
const without = (value, keys) => Object.fromEntries(Object.entries(value).filter(([key]) => !keys.includes(key)));

function canonicalPath(root, file) {
  assert.ok(typeof file === 'string' && !path.isAbsolute(file) && file.split('/').every(s => s && s !== '.' && s !== '..'),
    `Non-canonical path: ${file}`);
  const absolute = path.resolve(root, file);
  assert.ok(absolute.startsWith(root + path.sep));
  return absolute;
}
async function bound(file, expected) {
  const absolute = canonicalPath(ROOT, file);
  const [canonical, before] = await Promise.all([realpath(absolute), lstat(absolute, {bigint: true})]);
  assert.ok(canonical === absolute && before.isFile() && !before.isSymbolicLink() && before.nlink === 1n,
    `Input must be canonical and single-link: ${file}`);
  const buffer = await readFile(absolute), after = await lstat(absolute, {bigint: true});
  for (const key of ['ino', 'dev', 'size', 'mtimeNs', 'mode', 'nlink']) assert.equal(before[key], after[key], `Read drift: ${file}`);
  const binding = descriptor(file, buffer);
  if (expected) assert.deepEqual(binding, expected, `Input binding drift: ${file}`);
  return {binding, buffer, value: file.endsWith('.json') ? JSON.parse(buffer) : null};
}
async function boundDependency(file, expected) {
  const absolute = path.resolve(ROOT, file), canonical = await realpath(absolute);
  const dependencyRoot = await realpath(path.join(ROOT, 'node_modules'));
  if (!canonical.startsWith(dependencyRoot + path.sep)) return bound(file, expected);
  // The worktree deliberately shares the main checkout's node_modules. Only
  // esbuild-resolved files in that exact canonical dependency root may be read.
  const before = await lstat(canonical, {bigint: true});
  assert.ok(before.isFile() && !before.isSymbolicLink() && before.nlink === 1n);
  const buffer = await readFile(canonical), after = await lstat(canonical, {bigint: true});
  for (const key of ['ino', 'dev', 'size', 'mtimeNs', 'mode', 'nlink']) assert.equal(before[key], after[key]);
  const binding = descriptor(canonical, buffer);
  if (expected) assert.deepEqual(binding, expected, 'Shared dependency binding drift');
  return {binding, buffer};
}

export function hostScoreModuleSource() {
  return '"use client";\n// Generated by scripts/build-g678-alg-l11-instructional-host-score-successor.mjs; do not edit.\n' +
    `import {${CANDIDATE_EXPORT} as candidate} from "../g678-alg-l11-p044-host-score-candidate";\n` +
    'import {SOURCE_TIMELINE} from "../timelines/g678-alg-l11-instructional-host-score-successor-p044";\n' +
    'if(candidate.key!==SOURCE_TIMELINE.animationId||candidate.maturity!=="private-current-js"||' +
    'JSON.stringify(candidate.lessonHost.capabilities)!==\'["fq-scoring"]\'||SOURCE_TIMELINE.currentJavaScriptRegistered!==false)' +
    'throw Error("p044 source host-score successor identity drift");\n' +
    'export {SOURCE_TIMELINE};\nexport const CURRENT_JAVASCRIPT_REGISTERED=false as const;\n' +
    'export const DOM_RENDERER_IMPLEMENTED=true as const;\nexport default candidate;\n';
}

export function hostScoreTimelineSource(previousEntry) {
  assert.equal(previousEntry.key, ID);
  const value = {schemaVersion: 1, animationId: ID, source: previousEntry.source, mainTimeline: previousEntry.mainTimeline,
    adapterFamily: previousEntry.adapterFamily,
    instructionalInputs: [SOURCE_P044_MANIFEST], domRendererImplemented: true, currentJavaScriptImplemented: true,
    currentJavaScriptRegistered: false, productCalibrationPassed: false, browserProductCalibrationPassed: false,
    acceptanceEffects: previousEntry.acceptanceEffects};
  return '// Generated source binding; do not hand-edit.\nexport const SOURCE_TIMELINE = ' +
    JSON.stringify(value, null, 2) + ' as const;\n';
}

// Instantiate the actual generated wrapper and candidate in an isolated VM;
// metadata is never copied from a guessed registry or inherited runtime field.
export async function instantiateHostScoreModule(vfs) {
  const entry = `import candidate from ${JSON.stringify(path.join(ROOT, OUTPUT_PATHS.module))};\n` +
    'import {G678_ALG_L11_D_INSTRUCTIONAL_P044_MODULE as predecessor} from "./packages/demos/src/g678-alg-l11-tranche-d-instructional-candidates";\n' +
    'function metadata(m){return {key:m.key,maturity:m.maturity,movie:m.movie,runtime:m.runtime,' +
    'interactiveStops:m.interactiveStops??[],authoredTimelineControls:m.authoredTimelineControls??[],' +
    'defaultScenarioByFrameDomain:m.defaultScenarioByFrameDomain,scenarios:m.scenarios,reducedMotionFrame:m.reducedMotionFrame,' +
    'lessonHost:m.lessonHost,playbackEndFrameByDomain:m.playbackEndFrameByDomain};}\n' +
    'module.exports={candidate:metadata(candidate),predecessor:metadata(predecessor),' +
    'rendererType:typeof candidate.Renderer,rendererName:candidate.Renderer.name};\n';
  const result = await esbuild({stdin: {contents: entry, resolveDir: ROOT, loader: 'js'},
    bundle: true, write: false, platform: 'node', format: 'cjs', jsx: 'automatic', metafile: true,
    define: {'process.env.NODE_ENV': '"production"'},
    plugins: [{name: 'one-p044-host-score-vfs', setup(b) {
      b.onResolve({filter: /.*/}, args => {
        const absolute = path.isAbsolute(args.path) ? args.path : path.resolve(args.resolveDir, args.path);
        const found = [absolute, absolute + '.ts', absolute + '.tsx'].find(file => vfs.has(file));
        if (found) return {path: found, namespace: 'p044-host-score-vfs'};
      });
      b.onLoad({filter: /.*/, namespace: 'p044-host-score-vfs'}, args =>
        ({contents: vfs.get(args.path), loader: 'tsx', resolveDir: path.dirname(args.path)}));
    }}]});
  const exports = {}, context = {module: {exports}, exports, console};
  new Script(result.outputFiles[0].text, {filename: 'p044-host-score-metadata-audit.cjs'})
    .runInNewContext(context, {timeout: 15000});
  const actual = JSON.parse(JSON.stringify(context.module.exports));
  assert.equal(actual.rendererType, 'function');
  assert.equal(actual.rendererName, 'AlgL11P044HostScoreRenderer');
  assert.equal(actual.candidate.key, ID); assert.equal(actual.candidate.maturity, 'private-current-js');
  assert.deepEqual(without(actual.candidate, ['lessonHost']), without(actual.predecessor, ['lessonHost']),
    'p044 host-score adapter must preserve all predecessor timing/scenario/stop metadata');
  assert.deepEqual(actual.predecessor.lessonHost.capabilities, []);
  assert.deepEqual(actual.candidate.lessonHost, {capabilities: ['fq-scoring'], legacyOperations: 'blocked',
    auditStorage: 'memory-only', storesPersonalData: false});
  const dependencies = [];
  for (const file of Object.keys(result.metafile.inputs).sort()) {
    if (file === '<stdin>' || file.startsWith('p044-host-score-vfs:')) continue;
    dependencies.push((await boundDependency(path.relative(ROOT, path.resolve(ROOT, file)))).binding);
  }
  assert.ok(dependencies.some(file => file.path === CANDIDATE));
  return {metadata: actual.candidate, dependencies,
    bundledMetadataAudit: {bytes: result.outputFiles[0].contents.length, sha256: sha(result.outputFiles[0].contents)},
    toolchain: {nodeVersion: process.version, esbuildVersion,
      esbuildPackage: (await boundDependency('node_modules/esbuild/package.json')).binding}};
}

export function projectHostScoreRuntime(metadata, previous) {
  const domain = metadata.runtime.frameDomains.find(d => d.id === previous.mainTimeline.frameDomain);
  assert.ok(domain, 'Actual p044 source frame domain missing');
  const runtime = {stage: metadata.runtime.stage ?? metadata.movie.stage, rootFrameCount: metadata.movie.frameCount,
    rootBeginFrame: domain.rootFrame ?? 6, frameDomain: domain.id, frameCount: domain.frameCount,
    fps: domain.fps ?? metadata.movie.fps,
    livePlaybackEndFrame: metadata.playbackEndFrameByDomain?.[domain.id] ?? domain.frameCount,
    scenario: metadata.defaultScenarioByFrameDomain?.[domain.id] ?? metadata.scenarios?.[0]?.id,
    language: 'fixed-en', seed: '0', interactiveStops: metadata.interactiveStops,
    authoredTimelineControls: metadata.authoredTimelineControls, reducedMotionFrame: metadata.reducedMotionFrame,
    lessonHostCapabilities: metadata.lessonHost.capabilities};
  assert.deepEqual(runtime, {...previous.runtimeContract, lessonHostCapabilities: ['fq-scoring']},
    'Only p044 actual host capability metadata may change');
  return runtime;
}

export function composeHostScoreFragment({predecessor, replacement, p044CompilerRun}) {
  assert.equal(predecessor.schemaVersion, 1);
  assert.equal(predecessor.artifactType, 'g678-alg-l11-instructional-successor-current-js-fragment-v1');
  assert.deepEqual(predecessor.compilerRun, PREDECESSOR_RUN);
  assert.deepEqual(predecessor.entries.map(entry => entry.key), SOURCE_IDS);
  assert.equal(predecessor.entries.length, 23);
  assert.equal(predecessor.deploymentScope, 'local-only');
  for (const field of ['exactPlacementCount', 'generatedPlacementCount', 'currentJavaScriptImplementedPlacementCount', 'domRendererImplementedCount'])
    assert.equal(predecessor[field], 23);
  for (const field of ['registryEntriesWritten', 'registrationCandidatePlacementCount', 'currentJavaScriptRegisteredCount', 'wholeLessonEngineeringPreviewCount'])
    assert.equal(predecessor[field], 0);
  for (const field of ['productCalibrationPassed', 'browserProductCalibrationPassed', 'scaleOutAuthorized',
    'acceptancePassed', 'releaseAuthorized', 'published']) assert.equal(predecessor[field], false);
  assert.ok(Object.keys(predecessor.acceptanceEffects).length > 0 &&
    Object.values(predecessor.acceptanceEffects).every(value => value === false));
  const previous = predecessor.entries.find(entry => entry.key === ID);
  assert.deepEqual(without(replacement, ['module', 'moduleFile', 'timeline', 'memberManifest', 'runtimeContract']),
    without(previous, ['module', 'moduleFile', 'timeline', 'memberManifest', 'runtimeContract']),
    'Only the exact p044 module/timeline/member/runtime binding may change');
  assert.deepEqual(replacement.runtimeContract, {...previous.runtimeContract, lessonHostCapabilities: ['fq-scoring']});
  assert.equal(replacement.module, './modules/' + path.basename(OUTPUT_PATHS.module, '.tsx'));
  for (const [key, file] of [['moduleFile', OUTPUT_PATHS.module], ['timeline', OUTPUT_PATHS.timeline],
    ['memberManifest', OUTPUT_PATHS.member]]) {
    const item = replacement[key];
    assert.equal(item.path, file); assert.ok(Number.isSafeInteger(item.bytes) && item.bytes > 0 && /^[a-f0-9]{64}$/.test(item.sha256));
  }
  assert.equal(p044CompilerRun.path, OUTPUT_PATHS.run);
  assert.ok(Number.isSafeInteger(p044CompilerRun.bytes) && p044CompilerRun.bytes > 0 && /^[a-f0-9]{64}$/.test(p044CompilerRun.sha256));
  const entries = predecessor.entries.map(entry => structuredClone(entry.key === ID ? replacement : entry));
  assert.deepEqual(entries.filter(entry => entry.key !== ID), predecessor.entries.filter(entry => entry.key !== ID));
  return {...structuredClone(predecessor), artifactType: 'g678-alg-l11-instructional-host-score-successor-fragment-v1',
    runId: RUN_ID, compilerRun: structuredClone(PREDECESSOR_RUN), p044CompilerRun,
    predecessorFragment: structuredClone(PREDECESSOR_FRAGMENT), sourceP044Manifest: structuredClone(SOURCE_P044_MANIFEST),
    newlyGeneratedPlacementCount: 1, inheritedPlacementCount: 22, newlyGeneratedVisualPayloadCount: 0,
    entries, registryEntriesWritten: 0};
}

async function ensureCanonicalDirectory(root, relative) {
  canonicalPath(root, relative);
  let current = root;
  for (const segment of relative.split('/')) {
    current = path.join(current, segment);
    try {await mkdir(current);} catch (error) {if (error.code !== 'EEXIST') throw error;}
    const stat = await lstat(current);
    assert.ok(stat.isDirectory() && !stat.isSymbolicLink() && await realpath(current) === current,
      'Output directory must not traverse symlinks');
  }
}

// Testable exclusive publication. The composite fragment is published last.
export async function publishHostScoreOutputs({root = ROOT, outputs, check = false}) {
  assert.deepEqual([...outputs.keys()].sort(), Object.values(OUTPUT_PATHS).sort(), 'Only six exact new output paths are allowed');
  assert.equal([...outputs.keys()].at(-1), FRAGMENT, 'Composite authority must be written last');
  if (check) {
    for (const [file, content] of outputs) {
      const absolute = canonicalPath(root, file), stat = await lstat(absolute);
      assert.ok(stat.isFile() && !stat.isSymbolicLink() && stat.nlink === 1 && await realpath(absolute) === absolute);
      assert.ok((await readFile(absolute)).equals(Buffer.from(content)), `Generated output drift: ${file}`);
    }
    return;
  }
  for (const file of outputs.keys())
    await assert.rejects(lstat(canonicalPath(root, file)), {code: 'ENOENT'}, `Exclusive output exists: ${file}`);
  for (const [file, content] of outputs) {
    await ensureCanonicalDirectory(root, path.dirname(file));
    await writeFile(canonicalPath(root, file), content, {flag: 'wx', mode: 0o444});
  }
}

export async function generateHostScoreSuccessor({mode = 'plan'} = {}) {
  assert.ok(['plan', 'write', 'check'].includes(mode));
  if (mode === 'plan') return {mode, artifactType: 'g678-alg-l11-instructional-host-score-successor-fragment-v1',
    runId: RUN_ID, newPlacementIds: [ID], inheritedPlacementCount: 22, outputPaths: OUTPUT_PATHS,
    registryEntriesWritten: 0, newlyGeneratedVisualPayloadCount: 0};
  const registryBefore = await readFile(path.join(ROOT, REGISTRY));
  const predecessor = await bound(PREDECESSOR_FRAGMENT.path, PREDECESSOR_FRAGMENT);
  const previousRun = await bound(PREDECESSOR_RUN.path, PREDECESSOR_RUN);
  await checkPredecessorGeneration({mode: 'check', mounted: previousRun.value.mountedEvidence.map(file => file.path),
    receipts: previousRun.value.sourceSuccessorReceipts.map(file => file.path)});
  const sourceManifest = await bound(SOURCE_P044_MANIFEST.path, SOURCE_P044_MANIFEST);
  await checkHostScoreCandidate({check: true});
  assert.equal(sourceManifest.value.animationId, ID);
  assert.equal(sourceManifest.value.module.path, CANDIDATE);
  assert.equal(sourceManifest.value.moduleExport, CANDIDATE_EXPORT);
  assert.equal(sourceManifest.value.validation.unitTestsPassed, 3);
  assert.equal(sourceManifest.value.validation.mountedRecordsPassed, 3);
  assert.equal(sourceManifest.value.validation.demosTypecheckPassed, true);
  assert.ok(Object.values(sourceManifest.value.gates).every(value => value === false));
  const previous = predecessor.value.entries.find(entry => entry.key === ID);
  const previousMember = await bound(previous.memberManifest.path, previous.memberManifest);
  const builder = await bound(path.relative(ROOT, fileURLToPath(import.meta.url)));
  const testSource = await bound(OWN_TEST);
  const outputs = new Map([[OUTPUT_PATHS.module, hostScoreModuleSource()],
    [OUTPUT_PATHS.timeline, hostScoreTimelineSource(previous)]]);
  const vfs = new Map([...outputs].map(([file, content]) => [path.join(ROOT, file), content]));
  const compiled = await instantiateHostScoreModule(vfs);
  const runtimeContract = projectHostScoreRuntime(compiled.metadata, previous);
  const moduleFile = descriptor(OUTPUT_PATHS.module, outputs.get(OUTPUT_PATHS.module));
  const timeline = descriptor(OUTPUT_PATHS.timeline, outputs.get(OUTPUT_PATHS.timeline));
  const member = {...structuredClone(previousMember.value),
    artifactType: 'g678-alg-l11-instructional-host-score-successor-generated-member-v1', runId: RUN_ID,
    predecessorMember: previous.memberManifest, sourceP044Manifest: SOURCE_P044_MANIFEST,
    runtime: compiled.metadata.runtime, runtimeContract, lessonHost: compiled.metadata.lessonHost,
    interactiveStops: compiled.metadata.interactiveStops, authoredTimelineControls: compiled.metadata.authoredTimelineControls,
    reducedMotionFrame: compiled.metadata.reducedMotionFrame, playbackEndFrameByDomain: compiled.metadata.playbackEndFrameByDomain,
    moduleFile, timeline, instructionalInputs: [SOURCE_P044_MANIFEST]};
  assert.equal(member.privateData, null);
  outputs.set(OUTPUT_PATHS.member, json(member));
  const inventory = [...outputs].sort(([a], [b]) => a.localeCompare(b)).map(([file, content]) => descriptor(file, content));
  outputs.set(OUTPUT_PATHS.inventory, json({schemaVersion: 1, fileCount: 3,
    totalBytes: inventory.reduce((sum, file) => sum + file.bytes, 0), checksumSetSha256: sha(json(inventory)), files: inventory,
    newlyGeneratedVisualPayloadCount: 0}));
  const run = {schemaVersion: 1, artifactType: 'g678-alg-l11-p044-host-score-successor-compiler-run-v1', runId: RUN_ID,
    status: 'generated-unregistered-local-source-host-score-successor', deploymentScope: 'local-only',
    builder: builder.binding, boundaryTests: testSource.binding, predecessorFragment: PREDECESSOR_FRAGMENT,
    predecessorCompilerRun: PREDECESSOR_RUN, predecessorMember: previous.memberManifest, sourceP044Manifest: SOURCE_P044_MANIFEST,
    source: previous.source, mainTimeline: previous.mainTimeline, runtimeContract,
    validation: sourceManifest.value.validation, codeDependencyClosure: compiled.dependencies,
    bundledMetadataAudit: compiled.bundledMetadataAudit, toolchain: compiled.toolchain,
    outputInventory: descriptor(OUTPUT_PATHS.inventory, outputs.get(OUTPUT_PATHS.inventory)),
    exactPlacementCount: 1, generatedPlacementCount: 1, placementIds: [ID], inheritedCompositePlacementCount: 22,
    newlyGeneratedVisualPayloadCount: 0, registryEntriesWritten: 0, acceptanceEffects: predecessor.value.acceptanceEffects};
  outputs.set(OUTPUT_PATHS.run, json(run));
  const replacement = {...structuredClone(previous), module: './modules/' + path.basename(OUTPUT_PATHS.module, '.tsx'),
    moduleFile, timeline, memberManifest: descriptor(OUTPUT_PATHS.member, outputs.get(OUTPUT_PATHS.member)), runtimeContract};
  const fragment = composeHostScoreFragment({predecessor: predecessor.value, replacement,
    p044CompilerRun: descriptor(OUTPUT_PATHS.run, outputs.get(OUTPUT_PATHS.run))});
  outputs.set(FRAGMENT, json(fragment));
  // Recheck bound inputs before publishing; late failure never publishes authority.
  for (const input of [PREDECESSOR_FRAGMENT, PREDECESSOR_RUN, SOURCE_P044_MANIFEST, previous.memberManifest,
    builder.binding, testSource.binding, ...sourceManifest.value.files]) await bound(input.path, input);
  for (const input of [...compiled.dependencies, compiled.toolchain.esbuildPackage]) await boundDependency(input.path, input);
  assert.ok((await readFile(path.join(ROOT, REGISTRY))).equals(registryBefore), 'Concurrent registry drift; generator never writes registry');
  await publishHostScoreOutputs({outputs, check: mode === 'check'});
  assert.ok((await readFile(path.join(ROOT, REGISTRY))).equals(registryBefore), 'Generator must not mutate registry');
  return {mode, fragment: descriptor(FRAGMENT, outputs.get(FRAGMENT)), compilerRun: PREDECESSOR_RUN,
    p044CompilerRun: descriptor(OUTPUT_PATHS.run, outputs.get(OUTPUT_PATHS.run)),
    outputInventory: descriptor(OUTPUT_PATHS.inventory, outputs.get(OUTPUT_PATHS.inventory)),
    outputCount: outputs.size, newPlacementCount: 1, inheritedPlacementCount: 22,
    newlyGeneratedPayloadFileCount: 3, newlyGeneratedPayloadBytes: inventory.reduce((sum, file) => sum + file.bytes, 0),
    newlyGeneratedVisualPayloadCount: 0, registered: false, registryEntriesWritten: 0, productCalibrationPassed: false};
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  assert.ok(args.length <= 1 && (!args.length || ['--plan', '--write', '--check'].includes(args[0])));
  generateHostScoreSuccessor({mode: args[0]?.slice(2) ?? 'plan'})
    .then(result => console.log(json(result))).catch(error => {console.error(error); process.exitCode = 1;});
}
