import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, realpathSync, rmSync, statSync, symlinkSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { assertPhysicalSource, buildNestedTimeline, childAtParentFrame, deriveDepthIntervals, loadSourceMetadata, parseCliMode, parseTimelineTags, writeIfAbsentOrIdentical } from './build-g678-alg-l12-p005-nested-timeline.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const AUDIT = resolve(HERE, '../migrations/shared-alg001-l12-p005/audit');
const IR = JSON.parse(readFileSync(resolve(AUDIT, 'nested-timeline-v1.json'), 'utf8'));
const BY_ID = new Map(IR.children.map((child) => [child.spriteId, child]));

test('source XML rebuilds the frozen nested IR and contains every child domain', () => {
  const metadata = loadSourceMetadata(resolve(AUDIT, 'movie.xml'));
  const sourceStructureText = readFileSync(resolve(AUDIT, 'source-structure.json'), 'utf8');
  assert.deepEqual(buildNestedTimeline(metadata, sourceStructureText), IR);
  assert.equal(metadata.generator, 'JPEXS Free Flash Decompiler v.26.2.1');
  assert.equal(metadata.timelines[391].tags.filter((item) => item.type === 'ShowFrameTag').length, 968);
  assert.equal(IR.sourceStructureSha256, '3292f24e124d9160356701b50cc458f0bf8e5f3e717953e6db50edb7aef4b26d');
  assert.deepEqual(IR.children.map((child) => [child.spriteId, child.localFrameCount, child.parentPlacements.length]), [
    [78, 36, 2], [147, 22, 1], [258, 63, 1], [289, 63, 1], [306, 54, 1], [346, 20, 1],
  ]);
  assert.deepEqual(IR.children.flatMap((child) => child.parentPlacements.map((place) => [child.spriteId, place.entryFrame, place.endFrameExclusive, place.depth, place.end.reason])), [
    [78, 266, 277, 19, 'remove'], [78, 283, 289, 17, 'remove'], [147, 398, 465, 55, 'remove'],
    [258, 507, 508, 78, 'remove'], [289, 508, 544, 123, 'remove'], [306, 546, 571, 90, 'remove'],
    [346, 582, 660, 80, 'remove'],
  ]);
  assert(IR.children.every((child) => child.localMorphCharacterIds.length === 0));
  assert(IR.children.every((child) => child.parentPlacements.every((place) => place.entryKind === 'place-on-empty-depth')));
  assert(IR.children.every((child) => child.parentPlacements.every((place) => place.characterKind === 'sprite' && place.definitionTag === 'DefineSpriteTag')));
});

test('sprite 78 has two independent entry epochs, explicit removal gaps, and deterministic reverse seeks', () => {
  for (let frame = 266; frame <= 276; frame++) {
    const state = childAtParentFrame(IR, 78, frame);
    assert.equal(state.entryFrame, 266);
    assert.equal(state.depth, 19);
    assert.equal(state.localFrameCandidate, frame - 265);
    assert.equal(state.ratio, 265);
    assert.equal(state.matrix.translateX, '197');
    assert.equal(state.matrix.translateY, '-788');
  }
  for (let frame = 283; frame <= 288; frame++) {
    const state = childAtParentFrame(IR, 78, frame);
    assert.equal(state.entryFrame, 283);
    assert.equal(state.depth, 17);
    assert.equal(state.localFrameCandidate, frame - 282);
    assert.equal(state.ratio, 282);
  }
  for (const frame of [265, 277, 278, 279, 280, 281, 282, 289]) assert.equal(childAtParentFrame(IR, 78, frame), null);
  assert.deepEqual([288, 266, 283, 276, 277, 284, 265].map((frame) => childAtParentFrame(IR, 78, frame)?.localFrameCandidate ?? null), [6, 1, 1, 11, null, 2, null]);
});

test('other child boundaries, moves, and candidate clocks follow their own placement epochs', () => {
  for (const [id, before, start, last, after] of [
    [147, 397, 398, 464, 465], [258, 506, 507, 507, 508], [289, 507, 508, 543, 544],
    [306, 545, 546, 570, 571], [346, 581, 582, 659, 660],
  ]) {
    assert.equal(childAtParentFrame(IR, id, before), null);
    assert.equal(childAtParentFrame(IR, id, start).localFrameCandidate, 1);
    assert.equal(childAtParentFrame(IR, id, last).entryFrame, start);
    assert.equal(childAtParentFrame(IR, id, after), null);
  }
  assert.equal(BY_ID.get(147).parentPlacements[0].updates.length, 1);
  assert.equal(BY_ID.get(289).parentPlacements[0].updates.length, 35);
  assert.equal(BY_ID.get(306).parentPlacements[0].updates.length, 24);
  assert.equal(BY_ID.get(346).parentPlacements[0].updates.length, 74);
  assert.notDeepEqual(childAtParentFrame(IR, 147, 463).matrix, childAtParentFrame(IR, 147, 464).matrix);
  assert.equal(childAtParentFrame(IR, 147, 420).localFrameCandidate, 1); // candidate wrap, not observed Flash playback
  assert.equal(childAtParentFrame(IR, 346, 659).candidateLoopCount, 3);
  assert.equal(childAtParentFrame(IR, 258, 507).clockAuthority, 'static-query-model-only');
});

test('explicit same-character and other-character tags replace, while move-only tags retain the epoch', () => {
  const show = { type: 'ShowFrameTag' };
  const tags = [
    { type: 'PlaceObject2Tag', depth: '4', characterId: '78', placeFlagHasCharacter: 'true', placeFlagMove: 'false', matrix: { translateX: '20', translateY: '0' } }, show,
    { type: 'PlaceObject2Tag', depth: '4', placeFlagHasCharacter: 'false', placeFlagMove: 'true', matrix: { translateX: '40', translateY: '0' } }, show,
    { type: 'PlaceObject2Tag', depth: '4', characterId: '78', placeFlagHasCharacter: 'true', placeFlagMove: 'true' }, show,
    { type: 'PlaceObject2Tag', depth: '4', characterId: '99', placeFlagHasCharacter: 'true', placeFlagMove: 'true' }, show,
    { type: 'RemoveObject2Tag', depth: '4' }, show, show,
    { type: 'PlaceObject2Tag', depth: '4', characterId: '78', placeFlagHasCharacter: 'true', placeFlagMove: 'false' }, show,
  ];
  const { events } = parseTimelineTags(tags, 7);
  const intervals = deriveDepthIntervals(events, 7);
  assert.deepEqual(intervals.map((item) => [item.characterId, item.entryFrame, item.endFrameExclusive, item.entryKind, item.end.reason]), [
    [78, 1, 3, 'place-on-empty-depth', 'replace-same-character'],
    [78, 3, 4, 'replace-same-character', 'replace-other-character'],
    [99, 4, 5, 'replace-other-character', 'remove'],
    [78, 7, 8, 'place-on-empty-depth', 'timeline-end'],
  ]);
  assert.equal(intervals[0].updates.length, 1);
  assert.equal(intervals[1].entry.effectiveMatrixAtEntry.translateX, '40');
  assert.equal(intervals[2].entry.effectiveMatrixAtEntry.translateX, '40');
  assert.equal(intervals[3].entry.effectiveMatrixAtEntry, null);
  assert.throws(() => deriveDepthIntervals([{ kind: 'place', frame: 1, depth: 4, characterId: null, move: true }], 1), /empty depth/);
});

test('CLI rejects unknown arguments, writes only absent or byte-identical IR, and rejects symlink sources', () => {
  assert.equal(parseCliMode([]), 'write');
  assert.equal(parseCliMode(['--write']), 'write');
  assert.equal(parseCliMode(['--check']), 'check');
  assert.throws(() => parseCliMode(['--write', '--check']), /Usage/);
  assert.throws(() => parseCliMode(['--force']), /Usage/);
  const script = resolve(HERE, 'build-g678-alg-l12-p005-nested-timeline.mjs');
  const output = resolve(AUDIT, 'nested-timeline-v1.json');
  const before = statSync(output).mtimeMs;
  const write = spawnSync(process.execPath, [script, '--write'], { encoding: 'utf8', timeout: 30_000 });
  assert.equal(write.status, 0, write.stderr);
  assert.match(write.stdout, /already identical; no write/);
  assert.equal(statSync(output).mtimeMs, before);
  const unknown = spawnSync(process.execPath, [script, '--force'], { encoding: 'utf8', timeout: 30_000 });
  assert.notEqual(unknown.status, 0);
  assert.match(unknown.stderr, /Usage/);
  const temporary = mkdtempSync(join(tmpdir(), 'p005-source-guard-'));
  try {
    const physical = join(temporary, 'source.swf');
    const linked = join(temporary, 'linked.swf');
    writeFileSync(physical, 'test source');
    symlinkSync(physical, linked);
    assert.throws(() => assertPhysicalSource(linked, 'unused'), /physical regular file/);
    assert.throws(() => assertPhysicalSource(realpathSync(physical), 'unused'), /identity drift/);
    const retained = join(temporary, 'retained.json');
    assert.equal(writeIfAbsentOrIdentical(retained, '{"draft":1}\n'), true);
    assert.equal(writeIfAbsentOrIdentical(retained, '{"draft":1}\n'), false);
    assert.throws(() => writeIfAbsentOrIdentical(retained, '{"draft":2}\n'), /refusing to overwrite/);
    assert.equal(readFileSync(retained, 'utf8'), '{"draft":1}\n');
  } finally {
    rmSync(temporary, { recursive: true });
  }
});

test('every FFDec canvas child call agrees with all 968 source-tag placement states when time is zero', () => {
  const html = readFileSync(resolve(AUDIT, 'ffdec-26.2.1-canvas-v1/sprites/DefineSprite_391/frames.html'), 'utf8');
  const main = html.slice(html.indexOf('function sprite391('));
  const cases = [...main.matchAll(/\bcase (\d+):/g)];
  assert.equal(cases.length, 968);
  const childIds = new Set(BY_ID.keys());
  let actualCalls = 0;
  for (let index = 0; index < cases.length; index++) {
    const caseNumber = Number(cases[index][1]);
    assert.equal(caseNumber, index);
    const body = main.slice(cases[index].index + cases[index][0].length, cases[index + 1]?.index ?? main.length);
    const calls = [...body.matchAll(/place\("sprite(\d+)",canvas,ctx,\[([^\]]+)\],ctrans,1,\((\d+)\+time\)%(\d+),(\d+),time\);/g)]
      .map((match) => ({ id: Number(match[1]), matrix: match[2].split(',').map(Number), offset: Number(match[3]), modulus: Number(match[4]), ratio: Number(match[5]) }))
      .filter((call) => childIds.has(call.id));
    actualCalls += calls.length;
    for (const id of childIds) {
      const state = childAtParentFrame(IR, id, caseNumber + 1);
      const matches = calls.filter((call) => call.id === id);
      assert.equal(matches.length, state ? 1 : 0, `sprite ${id}, parent frame ${caseNumber + 1}`);
      if (!state) continue;
      const call = matches[0];
      assert.equal(call.offset + 1, state.localFrameCandidate, `sprite ${id}, parent frame ${caseNumber + 1}: local frame at time zero`);
      assert.equal(call.modulus, BY_ID.get(id).localFrameCount);
      assert.equal(call.ratio, state.ratio);
      const matrix = state.matrix;
      const expected = [Number(matrix.scaleX ?? 1) / 20, Number(matrix.rotateSkew0 ?? 0) / 20,
        Number(matrix.rotateSkew1 ?? 0) / 20, Number(matrix.scaleY ?? 1) / 20,
        Number(matrix.translateX ?? 0) / 20, Number(matrix.translateY ?? 0) / 20];
      for (let component = 0; component < 6; component++) {
        assert(Math.abs(call.matrix[component] - expected[component]) < 1e-8, `sprite ${id}, frame ${caseNumber + 1}, matrix component ${component}`);
      }
    }
  }
  assert.equal(actualCalls, 224);
});
