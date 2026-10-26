import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {P012_TEXT_DATA} from './generated/alg-l12-p012-text-data';
import {P012_CONTROL_TEXT, p012InstructionMask, p012TextSnapshot} from './alg-l12-p012-text';

const full = 'Click the arrows to move the spider and change the coordinates. Then click Next to continue.';

test('P012 mask poses match every source placement event and closed shape bounds', () => {
  const xml = readFileSync(new URL('../../../output/p011-source-triage-20260927-v1/raw/movie.xml', import.meta.url));
  assert.equal(createHash('sha256').update(xml).digest('hex'),
    'd60c5084c6b41eb938f870129065995a9d1c7ef095ad49c9a9a4987bf8a34673');
  const catalog = JSON.parse(readFileSync(new URL('../../../output/p011-source-triage-20260927-v1/source-text-catalog.json', import.meta.url), 'utf8'));
  const main = catalog.timelines.find((timeline: {timelineId: string}) => timeline.timelineId === 'sprite-86');
  assert(main);
  for (const [characterId, firstFrame, localBounds, clipDepth] of [
    [49, 32, [-6689,-346,7121,345], 6],
    [54, 101, [-1610,-260,1610,260], 9],
  ] as const) {
    const tag = catalog.shapeDefinitions.find((shape: {characterId: number}) => shape.characterId === characterId);
    const start = xml.toString().indexOf(`shapeId="${characterId}"`);
    assert(start > 0 && tag);
    const shapeXml = xml.toString().slice(start, xml.toString().indexOf('</shapeRecords>', start));
    const bounds = shapeXml.match(/<shapeBounds[^>]*Xmax="(-?\d+)" Xmin="(-?\d+)" Ymax="(-?\d+)" Ymin="(-?\d+)"/);
    assert(bounds);
    assert.deepEqual([Number(bounds[2]),Number(bounds[4]),Number(bounds[1]),Number(bounds[3])], localBounds);
    assert.match(shapeXml, /<item type="StraightEdgeRecord"/);
    const placement = main.instances.find((item: {characterId: number}) => item.characterId === characterId);
    assert(placement);
    let current: readonly number[] | null = null;
    for (let frame = 1; frame <= 119; frame++) {
      for (const eventId of placement.updates) {
        const event = main.events.find((item: {eventId: string}) => item.eventId === eventId);
        if (event.frame === frame) {
          if (event.matrix) current = event.matrix;
          if (frame === firstFrame) assert.equal(event.clipDepth, clipDepth);
        }
      }
      const actual = p012InstructionMask(frame, characterId);
      if (frame < firstFrame) assert.equal(actual, null);
      else {
        assert(current && actual);
        const sourceMatrix: readonly number[] = current;
        assert.deepEqual(actual, [
          sourceMatrix[0] * localBounds[0] + sourceMatrix[4],
          sourceMatrix[3] * localBounds[1] + sourceMatrix[5],
          sourceMatrix[0] * localBounds[2] + sourceMatrix[4],
          sourceMatrix[3] * localBounds[3] + sourceMatrix[5],
        ]);
      }
    }
  }
});

test('P012 instruction reveals from source rectangle masks, including the main mask hold', () => {
  assert.equal(p012TextSnapshot(1).introText, '');
  assert.equal(p012TextSnapshot(32).introText, '');
  assert.equal(p012TextSnapshot(34).introText, 'Cl');
  assert.equal(p012TextSnapshot(72).introText,
    'Click the arrows to move the spider and change the');
  assert.equal(p012TextSnapshot(82).introText,
    'Click the arrows to move the spider and change the coordinates.');
  assert.deepEqual(p012InstructionMask(82, 49), p012InstructionMask(93, 49));
  assert.notDeepEqual(p012InstructionMask(93, 49), p012InstructionMask(94, 49));
  assert.equal(p012TextSnapshot(101).introText,
    'Click the arrows to move the spider and change the coordinates. Then click ');
  assert.equal(p012TextSnapshot(102).introText,
    'Click the arrows to move the spider and change the coordinates. Then click N');
  assert.equal(p012TextSnapshot(112).introText, full);
  assert.equal(p012TextSnapshot(119).introText, full);
  for (let frame = 1; frame <= 119; frame++) {
    const text = p012TextSnapshot(frame).introText;
    assert(full.startsWith(text), `frame ${frame} was not a source-order prefix`);
  }
  assert.deepEqual(p012TextSnapshot(119).introRuns.map(run => run.sourceTextId),
    ['character-51/run-0','character-51/run-1','character-51/run-2','character-55/run-0']);
});

test('P012 controls, axis labels and coordinate field retain source instance geometry', () => {
  assert.deepEqual(Object.entries(P012_CONTROL_TEXT).map(([name, value]) => [name, value.text]), [
    ['MoveBtn1','up 1'],['MoveBtn2','up 3'],['MoveBtn3','down 1'],['MoveBtn4','down 3'],
    ['MoveBtn5','left1'],['MoveBtn6','left3'],['MoveBtn7','right 1'],['MoveBtn8','right 3'],
  ]);
  const early = p012TextSnapshot(1);
  assert.equal(early.controlLabels.length, 0);
  assert.equal(early.labels.length, 43);
  assert.equal(early.coordinate.instanceId, P012_TEXT_DATA.dynamicCoordinate.introInstanceId);
  const interactive = p012TextSnapshot(119, '(-10,10)');
  assert.equal(interactive.controlLabels.length, 8);
  assert.equal(interactive.controlLabels.find(label => label.sourceTextId === 'character-37/run-0')?.x, 164.5);
  assert.equal(interactive.controlLabels.find(label => label.sourceTextId === 'character-37/run-0')?.y, 182);
  assert.equal(interactive.coordinate.instanceId, P012_TEXT_DATA.dynamicCoordinate.bubbleFieldInstanceId);
  assert.equal(interactive.coordinate.text, '(-10,10)');
  assert.equal(interactive.coordinate.runtimePositionRequired, true);
  assert.equal(interactive.feedbackText.text, 'Keep the spider on the ceiling. Try again.');
  assert.equal(interactive.coachMarker.studentFacing, false);
  assert.equal(interactive.coachMarker.text, 'Coach_audio_1');
});

test('P012 snapshot rejects unsupported frames and malformed coordinates', () => {
  for (const frame of [0, 120, 1.5, Number.NaN]) assert.throws(() => p012TextSnapshot(frame), RangeError);
  for (const value of ['(11,0)', '(0,11)', '(0, 0)', '0,0', ''])
    assert.throws(() => p012TextSnapshot(119, value), RangeError);
});
