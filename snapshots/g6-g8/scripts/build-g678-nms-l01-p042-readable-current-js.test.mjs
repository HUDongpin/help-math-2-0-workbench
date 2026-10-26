import assert from 'node:assert/strict';
import {mkdtemp, readFile, realpath, rm, symlink, writeFile, chmod} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {ID, SOURCE, MAIN, OUTPUT, SUFFIX, BASE, READABLE, EFFECTS, encode, descriptor,
  moduleSource, timelineSource, runtimeContract, instantiate, publishOutputs, readBound, manifestInput, generate, ROOT}
  from './build-g678-nms-l01-p042-readable-current-js.mjs';

const readableFixture = {path: READABLE.path, bytes: 17, sha256: 'a'.repeat(64)};
test('plan identifies one new exact page and never declares registration, assets or acceptance', async () => {
  const plan = await generate();
  assert.deepEqual(plan.placementIds, [ID]); assert.equal(plan.newPlacementCount, 1);
  assert.equal(plan.registryEntriesWritten, 0); assert.equal(plan.newlyGeneratedVisualPayloadCount, 0);
  assert.equal(plan.registered, false); assert.equal(plan.outputPaths.length, 6);
  assert.ok(Object.values(EFFECTS).every(value => value === false));
});
test('generated timeline binds source root/main identity and proposes only the exact readable slot', () => {
  const text = timelineSource(readableFixture);
  const value = JSON.parse(text.slice(text.indexOf(' = ') + 3, text.lastIndexOf(' as const;')));
  assert.equal(value.animationId, ID); assert.deepEqual(value.source, SOURCE); assert.deepEqual(value.mainTimeline, MAIN);
  assert.deepEqual(value.instructionalInputs, [BASE, readableFixture]);
  assert.deepEqual(value.proposedPresentation, {pageInteractionCompanionTargetIdSuffix: SUFFIX, descriptorActivated: false});
  assert.equal(value.currentJavaScriptRegistered, false); assert.deepEqual(value.acceptanceEffects, EFFECTS);
  assert.match(moduleSource(), /CURRENT_JAVASCRIPT_REGISTERED=false/u);
  assert.match(OUTPUT.module, /-p042\.tsx$/u); assert.match(OUTPUT.timeline, /-p042\.ts$/u);
});
test('actual virtual wrapper preserves base metadata and exact state function while changing only the renderer', async () => {
  const value = await instantiate(new Map([[path.join(ROOT, OUTPUT.module), moduleSource()],
    [path.join(ROOT, OUTPUT.timeline), timelineSource(readableFixture)]]));
  assert.deepEqual(value.runtime, {stage: {width: 800, height: 600}, rootFrameCount: 10, rootBeginFrame: 6,
    frameDomain: 'sprite-23', frameCount: 125, fps: 12, livePlaybackEndFrame: 125,
    scenario: 'nms-l01-p042-source-static-frame', language: 'fixed-en', seed: '0',
    interactiveStops: [], authoredTimelineControls: [], reducedMotionFrame: 125, lessonHostCapabilities: []});
  for (const mutate of [m => {m.movie.frameCount = 125;}, m => {m.playbackEndFrame = 124;},
    m => {m.runtime.frameDomains[1].rootFrame = 1;}, m => {m.lessonHost.capabilities = ['glossary'];},
    m => {m.audioTracks = [{id: 'invented'}];}, m => {m.defaultScenarioByFrameDomain['sprite-23'] = 'other';},
    m => {m.interactiveStops = [{id: 'invented'}];}]) {
    const changed = structuredClone(value.metadata); mutate(changed); assert.throws(() => runtimeContract(changed));
  }
  assert.ok(value.dependencies.some(file => file.path.endsWith('g678-nms-l01-p042-candidate.tsx')));
  assert.ok(value.dependencies.some(file => file.path.endsWith('g678-nms-l01-p042-readable-companion-candidate.tsx')));
});
test('exclusive six-file publication checks physical output identity and refuses overwrite or an unexpected path', async () => {
  const root = await realpath(await mkdtemp(path.join(os.tmpdir(), 'helpmath-p042-output-test-')));
  try {
    const outputs = new Map(Object.values(OUTPUT).map(file => [file, encode({file, accepted: false})]));
    await publishOutputs({outputs, root}); await publishOutputs({outputs, root, check: true});
    const before = await readFile(path.join(root, OUTPUT.module));
    await assert.rejects(publishOutputs({outputs, root}));
    assert.ok((await readFile(path.join(root, OUTPUT.module))).equals(before));
    await assert.rejects(publishOutputs({outputs: new Map([...outputs, ['unreviewed.json', '{}']]), root}));
    await chmod(path.join(root, OUTPUT.module), 0o644);
    await writeFile(path.join(root, OUTPUT.module), 'changed');
    await assert.rejects(publishOutputs({outputs, root, check: true}), /Output drift/u);
  } finally {await rm(root, {recursive: true});}
});
test('binding reader rejects a source alias and byte drift without following symlinks', async () => {
  const root = await realpath(await mkdtemp(path.join(os.tmpdir(), 'helpmath-p042-binding-test-')));
  try {
    const bytes = encode({source: 'fixture'}); await writeFile(path.join(root, 'source.json'), bytes);
    const pin = descriptor('source.json', bytes); assert.deepEqual((await readBound(pin.path, pin, root)).binding, pin);
    await assert.rejects(readBound(pin.path, {...pin, sha256: '0'.repeat(64)}, root), /Input drift/u);
    await symlink('source.json', path.join(root, 'alias.json'));
    await assert.rejects(readBound('alias.json', undefined, root), /Canonical ordinary/u);
  } finally {await rm(root, {recursive: true});}
});
test('exact installed vendor dependencies may retain esbuild relative spelling without accepting source traversal', async () => {
  const vendor = await realpath(path.join(ROOT, 'node_modules/react/index.js'));
  const pin = descriptor(path.relative(ROOT, vendor), await readFile(vendor));
  assert.deepEqual((await manifestInput(pin)).binding, pin);
  await assert.rejects(manifestInput({...pin, sha256: '0'.repeat(64)}));
  const source = descriptor('scripts/../scripts/build-g678-nms-l01-p042-readable-current-js.mjs',
    await readFile(path.join(ROOT, 'scripts/build-g678-nms-l01-p042-readable-current-js.mjs')));
  await assert.rejects(manifestInput(source), /assert.ok/u);
});
