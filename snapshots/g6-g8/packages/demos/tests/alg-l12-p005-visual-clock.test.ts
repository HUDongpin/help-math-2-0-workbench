import assert from 'node:assert/strict';
import test from 'node:test';

import {
  advanceP005Clock,
  initialP005Clock,
  pauseP005Clock,
  seekP005Clock,
} from '../src/alg-l12-p005-visual-clock';

const FRAME_MS = 1000 / 12;

test('P005 visual clock starts at frame 1, paused, and ignores elapsed time while paused', () => {
  const initial = initialP005Clock();
  assert.deepEqual(initial, {frame: 1, elapsedMs: 0, playing: false});
  assert.strictEqual(advanceP005Clock(initial, 5000), initial);
});

test('P005 advances at exactly 12 frames per second with one-indexed frames', () => {
  const playing = pauseP005Clock(initialP005Clock(), false);
  assert.equal(advanceP005Clock(playing, FRAME_MS - 1).frame, 1);
  assert.equal(advanceP005Clock(playing, FRAME_MS).frame, 2);
  assert.deepEqual(advanceP005Clock(playing, 1000), {
    frame: 13, elapsedMs: 1000, playing: true,
  });
  assert.deepEqual(playing, {frame: 1, elapsedMs: 0, playing: true});
});

test('P005 accumulates subframe deltas instead of rounding each tick away', () => {
  let clock = pauseP005Clock(initialP005Clock(), false);
  for (let tick = 0; tick < 7; tick += 1) {
    clock = advanceP005Clock(clock, FRAME_MS / 8);
    assert.equal(clock.frame, 1, `tick ${tick + 1}`);
  }
  clock = advanceP005Clock(clock, FRAME_MS / 8);
  assert.equal(clock.frame, 2);
  for (let tick = 0; tick < 16; tick += 1) {
    clock = advanceP005Clock(clock, FRAME_MS / 8);
  }
  assert.equal(clock.frame, 4);
  assert.ok(Math.abs(clock.elapsedMs - 3 * FRAME_MS) < 1e-8);
});

test('P005 rejects invalid elapsed deltas even while paused', () => {
  for (const delta of [-1, Number.NaN, Infinity, -Infinity]) {
    assert.throws(() => advanceP005Clock(initialP005Clock(), delta),
      /P005 invalid elapsed time/, String(delta));
  }
  assert.deepEqual(advanceP005Clock(initialP005Clock(), 0), initialP005Clock());
});

test('P005 seek rejects frames outside the integer domain', () => {
  for (const frame of [0, 969, -1, 1.5, Number.NaN, Infinity, -Infinity]) {
    assert.throws(() => seekP005Clock(frame), /P005 frame outside domain/, String(frame));
  }
  assert.deepEqual(seekP005Clock(1), initialP005Clock());
});

test('P005 pause and resume retain fractional progress; replay resets it', () => {
  const midway = advanceP005Clock(pauseP005Clock(initialP005Clock(), false), FRAME_MS / 2);
  const paused = pauseP005Clock(midway, true);
  assert.equal(paused.playing, false);
  assert.strictEqual(advanceP005Clock(paused, 3000), paused);
  const resumed = pauseP005Clock(paused, false);
  assert.equal(advanceP005Clock(resumed, FRAME_MS / 2).frame, 2);

  const inspected = seekP005Clock(383);
  assert.deepEqual(inspected, {frame: 383, elapsedMs: 382 * FRAME_MS, playing: false});
  assert.equal(advanceP005Clock(inspected, 3000).frame, 383);
  assert.equal(advanceP005Clock(pauseP005Clock(inspected, false), FRAME_MS).frame, 384);
  assert.deepEqual(initialP005Clock(), {frame: 1, elapsedMs: 0, playing: false});
});

test('P005 stops at frame 968 and cannot advance or resume past the terminal frame', () => {
  const terminal = advanceP005Clock(
    pauseP005Clock(seekP005Clock(967), false), 2 * FRAME_MS,
  );
  assert.deepEqual(terminal, {frame: 968, elapsedMs: 967 * FRAME_MS, playing: false});
  assert.strictEqual(advanceP005Clock(terminal, 1000), terminal);
  assert.equal(pauseP005Clock(terminal, false).playing, false);

  const directTerminal = seekP005Clock(968);
  assert.deepEqual(directTerminal, terminal);
  assert.equal(pauseP005Clock(directTerminal, false).playing, false);
  assert.strictEqual(advanceP005Clock(directTerminal, FRAME_MS), directTerminal);
});
