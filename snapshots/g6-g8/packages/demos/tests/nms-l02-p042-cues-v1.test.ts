import test from 'node:test';
import assert from 'node:assert/strict';
import { P042_CUES } from '../src/generated/nms-l02-p042-cues-v1';
test('cue intervals cover every frame once and preserve source total emphasis', () => {
  let expected = 1;
  for (const beat of P042_CUES.beats) {
    assert.equal(beat.firstFrame, expected); assert.ok(beat.lastFrame >= beat.firstFrame);
    expected = beat.lastFrame + 1;
  }
  assert.equal(expected, 627);
  const at = (frame: number) => P042_CUES.beats.find(b => b.firstFrame <= frame && frame <= b.lastFrame)!.cue;
  for (const frame of [416, 425, 440, 460, 485]) assert.equal(at(frame).total, true);
  for (const frame of [415, 417, 424, 486, 625]) assert.equal(at(frame).total, false);
  assert.equal(at(46).heading, 'percent');
  assert.deepEqual(at(365).focus, { row: 2, field: 'slider' });
  assert.equal(at(625).focus, null);
});
