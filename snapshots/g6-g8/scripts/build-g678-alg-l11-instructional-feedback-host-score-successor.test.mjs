import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {lstat, mkdir, mkdtemp, readFile, readdir, realpath, rm, writeFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {ROOT, PREDECESSOR_FRAGMENT, PREDECESSOR_RUN, SOURCE_IDS, SOURCE_P044_MANIFEST, descriptor}
  from './build-g678-alg-l11-instructional-host-score-successor.mjs';
import {ID, RUN_ROOT, FRAGMENT, P044_FRAGMENT, P044_RUN, SOURCE_P034_MANIFEST, OUTPUT_PATHS,
  feedbackModuleSource, feedbackTimelineSource, instantiateFeedbackModule, feedbackRuntime,
  composeFeedbackHostScoreFragment, publishFeedbackOutputs, generateFeedbackHostScoreSuccessor}
  from './build-g678-alg-l11-instructional-feedback-host-score-successor.mjs';

const read = file => JSON.parse(readFileSync(path.join(ROOT, file)));
const old = () => read(PREDECESSOR_FRAGMENT.path);
function fixture() {
  const predecessor = old(), p044Predecessor = read(P044_FRAGMENT.path), previous = predecessor.entries.find(e => e.key === ID);
  const replacement = {...structuredClone(previous), module: './modules/' + path.basename(OUTPUT_PATHS.module, '.tsx'),
    moduleFile: descriptor(OUTPUT_PATHS.module, feedbackModuleSource()), timeline: descriptor(OUTPUT_PATHS.timeline, feedbackTimelineSource(previous)),
    memberManifest: descriptor(OUTPUT_PATHS.member, '{"fixture":true}\n'),
    runtimeContract: {...structuredClone(previous.runtimeContract), lessonHostCapabilities: ['practice-feedback']}};
  return {predecessor, p044Predecessor, replacement, p034CompilerRun: descriptor(OUTPUT_PATHS.run, '{"fixture":true}\n')};
}
test('composite changes only p034+p044, inherits21 exact original entries and reuses the complete frozen p044 entry/run', () => {
  const input = fixture(), before = structuredClone(input), result = composeFeedbackHostScoreFragment(input);
  assert.deepEqual(input, before);
  assert.equal(result.artifactType, 'g678-alg-l11-instructional-feedback-host-score-successor-fragment-v1');
  assert.deepEqual(result.entries.map(e => e.key), SOURCE_IDS);
  assert.deepEqual(result.entries.filter(e => e.key !== ID && !e.key.endsWith('p044')), input.predecessor.entries.filter(e => e.key !== ID && !e.key.endsWith('p044')));
  assert.deepEqual(result.entries.find(e => e.key.endsWith('p044')), input.p044Predecessor.entries.find(e => e.key.endsWith('p044')));
  assert.deepEqual(result.compilerRun, PREDECESSOR_RUN); assert.deepEqual(result.p044CompilerRun, P044_RUN);
  assert.deepEqual(result.p034CompilerRun, input.p034CompilerRun);
  assert.deepEqual(result.sourceP034Manifest, SOURCE_P034_MANIFEST); assert.deepEqual(result.sourceP044Manifest, SOURCE_P044_MANIFEST);
  assert.equal(result.changedPlacementCount, 2); assert.equal(result.newlyGeneratedPlacementCount, 1);
  assert.equal(result.reusedSuccessorPlacementCount, 1); assert.equal(result.inheritedPlacementCount, 21);
  assert.equal(result.newlyGeneratedVisualPayloadCount, 0); assert.equal(result.registryEntriesWritten, 0);
  assert.ok(Object.values(result.acceptanceEffects).every(value => value === false));
});
test('composition rejects any inherited original or p044 change, admission/acceptance change or non-p034 binding', () => {
  const mutations = [
    f => f.predecessor.entries.reverse(), f => {f.predecessor.productCalibrationPassed = true;},
    f => {f.predecessor.entries[0].module = './modules/unexpected-p006';},
    f => {f.p044Predecessor.entries.at(-1).moduleFile.sha256 = '0'.repeat(64);},
    f => {f.p044Predecessor.p044CompilerRun.sha256 = '0'.repeat(64);},
    f => {f.replacement.source.sha256 = '0'.repeat(64);},
    f => {f.replacement.productCalibrationPassed = true;},
    f => {f.replacement.runtimeContract.frameCount++;},
    f => {f.replacement.runtimeContract.lessonHostCapabilities = ['practice-feedback', 'audio'];},
    f => {f.replacement.runtimeContract.interactiveStops[0].rendererStateOnResume = 'reset';},
    f => {f.replacement.module = './modules/other-p034';},
    f => {f.replacement.memberManifest.path = 'work/old/member-manifest.json';},
    f => {f.p034CompilerRun.path = P044_RUN.path;},
  ];
  for (const mutate of mutations) {const input = fixture(); mutate(input); assert.throws(() => composeFeedbackHostScoreFragment(input));}
});
test('actual p034 wrapper metadata adds only practice-feedback and binds the reviewed candidate and55frame source data', async () => {
  const previous = old().entries.find(e => e.key === ID);
  const vfs = new Map([[path.join(ROOT, OUTPUT_PATHS.module), feedbackModuleSource()],
    [path.join(ROOT, OUTPUT_PATHS.timeline), feedbackTimelineSource(previous)]]);
  const compiled = await instantiateFeedbackModule(vfs), projected = feedbackRuntime(compiled.metadata, previous);
  assert.deepEqual(projected, {...previous.runtimeContract, lessonHostCapabilities: ['practice-feedback']});
  assert.equal(projected.frameCount, 5); assert.equal(projected.interactiveStops[0].rendererStateOnResume, 'preserve');
  assert.ok(compiled.dependencies.some(f => f.path === 'packages/demos/src/g678-alg-l11-p034-feedback-candidate.tsx' &&
    f.sha256 === '685a45da7080a922913b287e9b9bbb33e5c90eac2e7538ce0156bc18eb819966'));
  assert.ok(compiled.dependencies.some(f => f.path === 'packages/demos/src/generated/g678-alg-l11-p034-feedback-v1.ts'));
  assert.ok(!compiled.metadata.lessonHost.capabilities.includes('audio'));
  const wrong = structuredClone(compiled.metadata); wrong.reducedMotionFrame = 1;
  assert.throws(() => feedbackRuntime(wrong, previous));
});
test('one new wrapper only; no copied source visuals, no p044 output, and no source audio URLs', async () => {
  const plan = await generateFeedbackHostScoreSuccessor({mode: 'plan'});
  assert.deepEqual(plan.newPlacementIds, [ID]); assert.deepEqual(plan.reusedSuccessorIds, ['shared-alg001-l11-p044']);
  assert.equal(plan.inheritedPlacementCount, 21); assert.equal(plan.newlyGeneratedVisualPayloadCount, 0);
  assert.equal(Object.keys(OUTPUT_PATHS).length, 6);
  assert.ok(Object.values(OUTPUT_PATHS).every(file => !file.includes('/generated/') && !file.includes('-p044')));
  assert.equal(OUTPUT_PATHS.member, `${RUN_ROOT}/members/${ID}/member-manifest.json`);
  assert.match(feedbackModuleSource(), /G678_ALG_L11_P034_FEEDBACK_CANDIDATE_MODULE/);
  assert.doesNotMatch(feedbackModuleSource(), /<svg|data:image|https?:\/\/|\.mp3/);
  const source = read(SOURCE_P034_MANIFEST.path);
  assert.equal(source.audio.integrated, false); assert.deepEqual(source.audio.assetUrls, []);
  assert.equal(source.validation.sourceVectorFramesExact, 55); assert.equal(source.validation.unitTestsPassed, 4);
  assert.equal(source.validation.mountedRecordsPassed, 3);
});
async function temporary(t) {
  const root = await realpath(await mkdtemp(path.join(os.tmpdir(), 'helpmath-feedback-composite-test-')));
  t.after(() => rm(root, {recursive: true, force: true})); return root;
}
const outputs = () => new Map(Object.values(OUTPUT_PATHS).map(file => [file, `Test-only output ${file}\n`]));
async function snapshot(root, prefix = '') {
  const rows = [];
  for (const entry of await readdir(path.join(root, prefix), {withFileTypes: true})) {
    const file = path.join(prefix, entry.name);
    if (entry.isDirectory()) rows.push(...await snapshot(root, file));
    else {const stat = await lstat(path.join(root, file), {bigint: true});
      rows.push({...descriptor(file, await readFile(path.join(root, file))), ino: String(stat.ino), mode: String(stat.mode), mtimeNs: String(stat.mtimeNs)});}
  }
  return rows.sort((a, b) => a.path.localeCompare(b.path));
}
test('publisher exclusively writes6 small outputs and --check twice is write-free', async t => {
  const root = await temporary(t), content = outputs(); await publishFeedbackOutputs({root, outputs: content});
  const before = await snapshot(root); assert.equal(before.length, 6);
  assert.ok(before.every(file => (Number(file.mode) & 0o222) === 0));
  await publishFeedbackOutputs({root, outputs: content, check: true});
  await publishFeedbackOutputs({root, outputs: content, check: true});
  assert.deepEqual(await snapshot(root), before);
  await assert.rejects(publishFeedbackOutputs({root, outputs: content}), /Exclusive output exists/);
  assert.deepEqual(await snapshot(root), before);
});
test('publisher preflights all outputs before any write and refuses registry or frozen p044 targets', async t => {
  const root = await temporary(t), content = outputs();
  await mkdir(path.dirname(path.join(root, FRAGMENT)), {recursive: true});
  await writeFile(path.join(root, FRAGMENT), 'existing authority canary\n', {flag: 'wx'});
  const before = await snapshot(root);
  await assert.rejects(publishFeedbackOutputs({root, outputs: content}), /Exclusive output exists/);
  assert.deepEqual(await snapshot(root), before);
  for (const file of ['packages/demos/private-current-js-registry.json', P044_FRAGMENT.path]) {
    const bad = new Map(content); bad.set(file, '{}');
    await assert.rejects(publishFeedbackOutputs({root, outputs: bad}), /six exact new output paths/);
  }
  assert.deepEqual(await snapshot(root), before);
});
test('composite must be written last; check rejects any generated byte drift', async t => {
  const root = await temporary(t), content = outputs();
  const reversed = new Map([...content].reverse());
  await assert.rejects(publishFeedbackOutputs({root, outputs: reversed}), /authority must be published last/);
  assert.deepEqual(await readdir(root), []);
  await publishFeedbackOutputs({root, outputs: content});
  const changed = new Map(content); changed.set(OUTPUT_PATHS.module, '// test mismatch\n');
  await assert.rejects(publishFeedbackOutputs({root, outputs: changed, check: true}), /Generated output drift/);
});
