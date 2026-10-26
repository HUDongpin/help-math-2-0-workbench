import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {mkdtemp, writeFile, symlink, link, realpath, rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {collectSwfTextSourceCatalog} from './lib/swf-text-source-catalog.mjs';
import {collectP010TextData, p010SourcePoses, readP010TextPhysicalFile,
  prepareP010TextData, REVEAL} from './build-g678-alg-l12-p010-text-data.mjs';

const source = readFileSync(new URL('../migrations/shared-alg001-l12-p010/audit/source-input.swf', import.meta.url));
const audit = JSON.parse(readFileSync(new URL('../migrations/shared-alg001-l12-p010/audit/typography-source-geometry-v1.json', import.meta.url)));
const data = collectP010TextData(source, audit);
const definition = id => data.definitions.find(d => d.characterId === id);

test('P010 preserves every pen reset, inherited advance and three-line callout baseline', () => {
  assert.equal(data.definitions.length, 28); assert.equal(data.definitions.flatMap(d => d.runs).length, 52);
  assert.deepEqual(definition(20).runs.map(r => r.baselineTwips),
    [[40, 420], [304, 420], [1364, 420], [2252, 420], [5297, 420], [7443, 420], [8903, 420]]);
  for (const [id, expected] of [[56, [[420, 380], [160, 900], [900, 1420]]],
    [70, [[420, 380], [160, 900], [820, 1420]]], [85, [[440, 380], [160, 900], [760, 1420]]],
    [95, [[420, 380], [160, 900], [820, 1420]]]]) {
    assert.deepEqual(definition(id).runs.map(r => r.baselineTwips), expected);
    assert.equal(new Set(definition(id).runs.map(r => r.baselineTwips[1])).size, 3);
    assert.deepEqual(definition(id).matrix, [1, 0, 0, 1, -809, 0]);
    assert(!Object.hasOwn(definition(id), 'baselineTwips'), 'consumers must use each run baseline');
  }
});

test('P010 source literals retain unusual grammar and spacing without semantic roles', () => {
  assert.equal(definition(20).runs.map(r => r.text).join(''), 'A point is a geometric figure that has a position, but no      ');
  assert.equal(definition(32).runs.map(r => r.text).join(''), 'On a coordinate plane, a point is identified by coordinates which an ');
  assert.equal(definition(36).runs.map(r => r.text).join(''), 'ordered pair is showing the position.');
  assert.equal(definition(70).runs[0].text, 'Point B has    ');
  assert(data.definitions.every(d => !Object.hasOwn(d, 'role') && d.runs.every(r => !Object.hasOwn(r, 'role'))));
  assert.equal(data.claimBoundary.semanticRolesAssigned, false); assert.equal(data.claimBoundary.registered, false);
});

test('all 77 source run-instance pairs distinguish reused coordinate fragments and signs', () => {
  assert.equal(data.instances.length, 53); assert.equal(data.runInstances.length, 77);
  assert.equal(new Set(data.runInstances.map(p => `${p.instanceId}|${p.sourceTextId}`)).size, 77);
  const shared = data.instances.filter(i => i.characterId === 50);
  assert.deepEqual(shared.map(i => [i.depth, i.firstFrame, i.lastFrameExclusive]), [[86, 248, 466], [104, 432, 466]]);
  assert.equal(definition(50).runs[0].text, '(5,');
  assert.deepEqual(data.runInstances.filter(p => p.sourceTextId === 'character-50/run-0')
    .map(p => [p.instanceId, p.firstPossibleInkFrame, p.firstAllInkBoundsContainedAndFullOpacityFrame]),
  [['sprite-96/depth-86/generation-1', 264, 266], ['sprite-96/depth-104/generation-1', 433, 438]]);
  assert.equal(data.instances.filter(i => i.characterId === 11).length, 10);
  assert.equal(data.runInstances.filter(p => p.sourceTextId === 'character-11/run-0').length, 10);
  for (const pair of data.runInstances) {
    const instance = data.instances.find(i => i.instanceId === pair.instanceId);
    const run = definition(instance.characterId).runs.find(r => r.id === pair.sourceTextId);
    assert.equal(pair.literalText, run.text); assert.deepEqual(pair.baselineTwips, run.baselineTwips);
  }
});

test('whole-run prose reveal uses full ink containment independently from lifetime or first partial ink', () => {
  for (const [id, expected] of Object.entries(REVEAL)) {
    assert.deepEqual(definition(Number(id)).runs.map(r => r.revealFrame), [...expected]);
    const pairs = data.runInstances.filter(p => p.sourceTextId.startsWith(`character-${id}/`));
    assert.equal(pairs.length, expected.length);
    assert.deepEqual(pairs.map(p => p.firstAllInkBoundsContainedFrame), [...expected]);
    assert(pairs.every(p => p.revealFrame === p.firstAllInkBoundsContainedFrame));
  }
  const geometric = data.runInstances.find(p => p.sourceTextId === 'character-20/run-3');
  assert.equal(geometric.firstPossibleInkFrame, 26); assert.equal(geometric.revealFrame, 40);
  assert.equal(data.instances.find(i => i.characterId === 20).firstFrame, 10);
  assert(data.definitions.filter(d => !Object.hasOwn(REVEAL, d.characterId)).every(d => d.runs.every(r => r.revealFrame === null)));
});

test('native events start with full firstPose and reproduce all active source poses over 465 frames', () => {
  const sourceMain = collectSwfTextSourceCatalog(source).timelines.find(t => t.timelineId === 'sprite-96');
  const poses = p010SourcePoses(sourceMain);
  let checked = 0;
  for (const instance of data.instances) {
    assert.deepEqual(instance.events[0].matrix, instance.firstPose.matrix);
    assert.deepEqual(instance.events[0].colorTransform, instance.firstPose.colorTransform);
    for (let frame = instance.firstFrame; frame < instance.lastFrameExclusive; frame++) {
      let matrix, color;
      for (const event of instance.events) {
        if (event.frame > frame) break;
        if (event.matrix) matrix = event.matrix;
        if (event.colorTransform) color = event.colorTransform;
      }
      const pose = poses[frame - 1].get(instance.depth);
      assert.equal(pose.instanceId, instance.instanceId); assert.deepEqual(matrix, pose.matrix);
      assert.deepEqual(color, pose.colorTransform); checked++;
    }
  }
  assert(checked > 16000);
  for (const id of [20, 26, 32, 36]) {
    const instance = data.instances.find(i => i.characterId === id);
    assert.deepEqual(instance.firstPose.colorTransform.multiply, [256, 256, 256, 256]);
  }
});

test('Move+Character replacement inherits transform/color while fresh placement resets after remove', () => {
  const color = {multiply: [256, 256, 256, 128], add: [0, 0, 0, 0], divisor: 256};
  const poses = p010SourcePoses({declaredFrameCount: 4, events: [
    {frame: 1, kind: 'place', move: false, depth: 2, instanceId: 'first', characterId: 11, matrix: [2, 0, 0, 3, 40, 50], colorTransform: color},
    {frame: 2, kind: 'place', move: true, depth: 2, instanceId: 'second', characterId: 50},
    {frame: 3, kind: 'remove', depth: 2},
    {frame: 4, kind: 'place', move: false, depth: 2, instanceId: 'third', characterId: 56},
  ]});
  assert.equal(poses[1].get(2).instanceId, 'second'); assert.deepEqual(poses[1].get(2).matrix, [2, 0, 0, 3, 40, 50]);
  assert.deepEqual(poses[1].get(2).colorTransform, color); assert.equal(poses[2].size, 0);
  assert.deepEqual(poses[3].get(2).matrix, [1, 0, 0, 1, 0, 0]);
  assert.deepEqual(poses[3].get(2).colorTransform.multiply, [256, 256, 256, 256]);
  poses[1].get(2).matrix[4] = -999; assert.equal(poses[0].get(2).matrix[4], 40);
});

test('source bytes and geometry identity, baseline, first pose, visibility and pair drift fail closed', () => {
  const bytes = Buffer.from(source); bytes[100] ^= 1;
  assert.throws(() => collectP010TextData(bytes, audit), /source hash/);
  assert.throws(() => collectP010TextData(source.subarray(1), audit), /source length/);
  const changes = [
    a => {a.animationId = 'shared-alg001-l12-p009';},
    a => {a.textDefinitions.find(d => d.characterId === 70).runs[0].text = 'Point B has ';},
    a => {a.textDefinitions.find(d => d.characterId === 56).runs[1].glyphs[0].penTwips[1] = 380;},
    a => {a.textDefinitions.find(d => d.characterId === 20).runs[1].changed.xOffset = true;},
    a => {a.textInstances.find(i => i.characterId === 20).firstPose.colorTransform.multiply[3] = 0;},
    a => {a.textInstances.find(i => i.characterId === 50).firstPose.matrix[4] += 1;},
    a => {a.textInstances[0].events[0].sourceTagSha256 = '0'.repeat(64);},
    a => {a.textInstances[0].visibilitySegments[0].codes = 'F';},
    a => {a.runInstanceVisibilitySummary.find(p => p.sourceTextId === 'character-20/run-3').firstAllInkBoundsContainedFrame = 26;},
    a => {a.runInstanceVisibilitySummary.at(-1).firstPossibleInkFrame = 454 + 1;},
    a => {a.runInstanceVisibilitySummary.pop();},
    a => {a.runInstanceVisibilitySummary[1] = structuredClone(a.runInstanceVisibilitySummary[0]);},
    a => {a.maskDefinitions[1].boundsTwips[0] = -3470;},
    a => {a.summary.textPlacementGenerations = 52;},
  ];
  for (const change of changes) {const changed = structuredClone(audit); change(changed);
    assert.throws(() => collectP010TextData(source, changed));}
});

test('physical input checks reject aliases, hard links and byte/hash drift; generation reproduces', async () => {
  const directory = await realpath(await mkdtemp(path.join(os.tmpdir(), 'p010-native-text-test-')));
  try {
    const file = path.join(directory, 'ordinary'), alias = path.join(directory, 'alias'), hard = path.join(directory, 'hard');
    await writeFile(file, 'reviewed source', {flag: 'wx'});
    const expected = {bytes: 15, sha256: createHash('sha256').update('reviewed source').digest('hex')};
    assert.equal((await readP010TextPhysicalFile(file, expected)).toString(), 'reviewed source');
    await assert.rejects(readP010TextPhysicalFile(file, {...expected, sha256: '0'.repeat(64)}), /hash drift/);
    await assert.rejects(readP010TextPhysicalFile(file, {...expected, bytes: 14}), /size drift/);
    await symlink(file, alias); await assert.rejects(readP010TextPhysicalFile(alias, expected), /physical path/);
    await link(file, hard); await assert.rejects(readP010TextPhysicalFile(file, expected), /single-link/);
    const first = await prepareP010TextData(), second = await prepareP010TextData();
    assert.equal(first.result, second.result); assert.deepEqual(first.data, data);
  } finally {await rm(directory, {recursive: true, force: true});}
});
