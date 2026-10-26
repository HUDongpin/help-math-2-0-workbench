import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {lstat, mkdir, mkdtemp, readFile, readdir, realpath, rm, writeFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {ROOT, ID, RUN_ROOT, FRAGMENT, OUTPUT_PATHS, PREDECESSOR_FRAGMENT, PREDECESSOR_RUN,
  SOURCE_P044_MANIFEST, SOURCE_IDS, descriptor, hostScoreModuleSource, hostScoreTimelineSource,
  instantiateHostScoreModule, projectHostScoreRuntime, composeHostScoreFragment, publishHostScoreOutputs,
  generateHostScoreSuccessor} from './build-g678-alg-l11-instructional-host-score-successor.mjs';

const readJson = file => JSON.parse(readFileSync(path.join(ROOT, file)));
const predecessor = () => readJson(PREDECESSOR_FRAGMENT.path);
function fixture() {
  const prior = predecessor(), previous = prior.entries.find(entry => entry.key === ID);
  const replacement = {...structuredClone(previous),
    module: './modules/' + path.basename(OUTPUT_PATHS.module, '.tsx'),
    moduleFile: descriptor(OUTPUT_PATHS.module, hostScoreModuleSource()),
    timeline: descriptor(OUTPUT_PATHS.timeline, hostScoreTimelineSource(previous)),
    memberManifest: descriptor(OUTPUT_PATHS.member, '{"testFixture":true}\n'),
    runtimeContract: {...structuredClone(previous.runtimeContract), lessonHostCapabilities: ['fq-scoring']}};
  return {predecessor: prior, replacement, p044CompilerRun: descriptor(OUTPUT_PATHS.run, '{"testFixture":true}\n')};
}

test('composite preserves all22 inherited entry objects and old sourceRun; only p044 receives explicit new run and capability', () => {
  const input = fixture(), before = structuredClone(input), composite = composeHostScoreFragment(input);
  assert.deepEqual(input, before);
  assert.equal(composite.artifactType, 'g678-alg-l11-instructional-host-score-successor-fragment-v1');
  assert.deepEqual(composite.entries.map(entry => entry.key), SOURCE_IDS);
  assert.deepEqual(composite.entries.filter(entry => entry.key !== ID), input.predecessor.entries.filter(entry => entry.key !== ID));
  assert.deepEqual(composite.compilerRun, PREDECESSOR_RUN);
  assert.deepEqual(composite.p044CompilerRun, input.p044CompilerRun);
  assert.deepEqual(composite.predecessorFragment, PREDECESSOR_FRAGMENT);
  assert.deepEqual(composite.sourceP044Manifest, SOURCE_P044_MANIFEST);
  assert.equal(composite.newlyGeneratedPlacementCount, 1); assert.equal(composite.inheritedPlacementCount, 22);
  assert.equal(composite.newlyGeneratedVisualPayloadCount, 0); assert.equal(composite.registryEntriesWritten, 0);
  assert.ok(Object.values(composite.acceptanceEffects).every(value => value === false));
  assert.deepEqual(composite.entries.find(entry => entry.key === ID).runtimeContract.lessonHostCapabilities, ['fq-scoring']);
});

test('composite rejects out-of-scope membership, source, runtime, family, filenames, admission and acceptance changes', () => {
  const mutations = [
    f => f.predecessor.entries.reverse(), f => f.predecessor.entries.pop(),
    f => {f.predecessor.compilerRun.sha256 = '0'.repeat(64);},
    f => {f.predecessor.productCalibrationPassed = true;},
    f => {f.predecessor.generatedPlacementCount = 1;},
    f => {f.predecessor.acceptanceEffects.audioAccepted = true;},
    f => {f.replacement.source.sha256 = '0'.repeat(64);},
    f => {f.replacement.adapterFamily = 'another-family';},
    f => {f.replacement.runtimeContract.frameCount++;},
    f => {f.replacement.runtimeContract.lessonHostCapabilities = [];},
    f => {f.replacement.runtimeContract.interactiveStops[0].rendererStateOnResume = 'reset';},
    f => {f.replacement.module = './modules/other-p044';},
    f => {f.replacement.moduleFile.path = 'packages/demos/src/modules/other-p044.tsx';},
    f => {f.replacement.memberManifest.path = 'work/other/member-manifest.json';},
    f => {f.replacement.productCalibrationPassed = true;},
    f => {f.p044CompilerRun.path = PREDECESSOR_RUN.path;},
  ];
  for (const mutate of mutations) {const input = fixture(); mutate(input); assert.throws(() => composeHostScoreFragment(input));}
});

test('actual in-memory wrapper instantiation changes only fq-scoring metadata and includes the reviewed source candidate closure', async () => {
  const previous = predecessor().entries.find(entry => entry.key === ID);
  const vfs = new Map([[path.join(ROOT, OUTPUT_PATHS.module), hostScoreModuleSource()],
    [path.join(ROOT, OUTPUT_PATHS.timeline), hostScoreTimelineSource(previous)]]);
  const result = await instantiateHostScoreModule(vfs);
  const runtime = projectHostScoreRuntime(result.metadata, previous);
  assert.deepEqual(runtime, {...previous.runtimeContract, lessonHostCapabilities: ['fq-scoring']});
  assert.equal(runtime.frameCount, 69); assert.equal(runtime.reducedMotionFrame, 69);
  assert.equal(runtime.interactiveStops[0].rendererStateOnResume, 'preserve');
  assert.ok(result.dependencies.some(file => file.path === 'packages/demos/src/g678-alg-l11-p044-host-score-candidate.tsx' &&
    file.sha256 === '49235e3d98e507ca755f9c33a46c17e65b4c4d4fcf9bef22f50037fca47fed85'));
  assert.ok(result.dependencies.some(file => file.path === 'packages/demos/src/generated/g678-alg-l11-tranche-d-instructional-visuals-v1.ts'));
  assert.ok(result.bundledMetadataAudit.bytes > 0);
  const bad = structuredClone(result.metadata); bad.reducedMotionFrame = 1;
  assert.throws(() => projectHostScoreRuntime(bad, previous));
});

test('new wrapper and output plan contain no copied visual payload and exactly one new placement', async () => {
  const plan = await generateHostScoreSuccessor({mode: 'plan'});
  assert.deepEqual(plan.newPlacementIds, [ID]); assert.equal(plan.inheritedPlacementCount, 22);
  assert.equal(plan.newlyGeneratedVisualPayloadCount, 0);
  assert.equal(Object.keys(OUTPUT_PATHS).length, 6);
  assert.ok(Object.values(OUTPUT_PATHS).every(file => !file.includes('/generated/') && !file.includes('vector-bundle')));
  assert.ok(OUTPUT_PATHS.module.endsWith('-p044.tsx')); assert.ok(OUTPUT_PATHS.timeline.endsWith('-p044.ts'));
  assert.equal(OUTPUT_PATHS.member, `${RUN_ROOT}/members/${ID}/member-manifest.json`);
  const module = hostScoreModuleSource();
  assert.match(module, /G678_ALG_L11_P044_HOST_SCORE_CANDIDATE_MODULE/);
  assert.doesNotMatch(module, /<svg|data:image|export const DATA/);
});

async function temporary(t) {
  const root = await realpath(await mkdtemp(path.join(os.tmpdir(), 'helpmath-p044-generation-test-')));
  t.after(() => rm(root, {recursive: true, force: true}));
  return root;
}
function mockOutputs() {
  return new Map(Object.values(OUTPUT_PATHS).map(file => [file, `Test-only generated output: ${file}\n`]));
}
async function snapshot(root, prefix = '') {
  const rows = [];
  for (const entry of await readdir(path.join(root, prefix), {withFileTypes: true})) {
    const file = path.join(prefix, entry.name);
    if (entry.isDirectory()) rows.push(...await snapshot(root, file));
    else {
      const info = await lstat(path.join(root, file), {bigint: true});
      rows.push({...descriptor(file, await readFile(path.join(root, file))), mode: String(info.mode),
        ino: String(info.ino), mtimeNs: String(info.mtimeNs)});
    }
  }
  return rows.sort((a, b) => a.path.localeCompare(b.path));
}

test('exclusive publisher writes only6 new files, checks twice without writes, refuses a second publication', async t => {
  const root = await temporary(t), outputs = mockOutputs();
  await publishHostScoreOutputs({root, outputs});
  const before = await snapshot(root);
  assert.equal(before.length, 6);
  assert.ok(before.every(file => (Number(file.mode) & 0o222) === 0));
  await publishHostScoreOutputs({root, outputs, check: true});
  await publishHostScoreOutputs({root, outputs, check: true});
  assert.deepEqual(await snapshot(root), before);
  await assert.rejects(publishHostScoreOutputs({root, outputs}), /Exclusive output exists/);
  assert.deepEqual(await snapshot(root), before);
});

test('publisher preflights all targets before writing any file and cannot touch the registry or frozen23', async t => {
  const root = await temporary(t), outputs = mockOutputs();
  await mkdir(path.dirname(path.join(root, FRAGMENT)), {recursive: true});
  await writeFile(path.join(root, FRAGMENT), 'existing authority canary\n', {flag: 'wx'});
  const before = await snapshot(root);
  await assert.rejects(publishHostScoreOutputs({root, outputs}), /Exclusive output exists/);
  assert.deepEqual(await snapshot(root), before);
  const bad = new Map(outputs);
  bad.set('packages/demos/private-current-js-registry.json', '{}');
  await assert.rejects(publishHostScoreOutputs({root, outputs: bad}), /six exact new output paths/);
  assert.deepEqual(await snapshot(root), before);
});

test('publisher requires composite authority last and check rejects drift', async t => {
  const root = await temporary(t), outputs = mockOutputs();
  const wrongOrder = new Map([[FRAGMENT, outputs.get(FRAGMENT)], ...[...outputs].filter(([file]) => file !== FRAGMENT)]);
  await assert.rejects(publishHostScoreOutputs({root, outputs: wrongOrder}), /authority must be written last/);
  assert.deepEqual(await readdir(root), []);
  await publishHostScoreOutputs({root, outputs});
  const mismatched = new Map(outputs); mismatched.set(OUTPUT_PATHS.module, '// unexpected drift\n');
  await assert.rejects(publishHostScoreOutputs({root, outputs: mismatched, check: true}), /Generated output drift/);
});
