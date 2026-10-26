import assert from 'node:assert/strict';
import test from 'node:test';

import {
  advanceP006Clock,
  initialP006Clock,
  pauseP006Clock,
  seekP006Clock,
} from '../src/alg-l12-p006-visual-clock';

const FRAME_MS = 1000 / 12;

test('P006 visual clock starts at frame 1, paused, and ignores elapsed time while paused', () => {
  const initial = initialP006Clock();
  assert.deepEqual(initial, {frame: 1, elapsedMs: 0, playing: false});
  assert.strictEqual(advanceP006Clock(initial, 5000), initial);
});

test('P006 advances at exactly 12 frames per second with one-indexed frames', () => {
  const playing = pauseP006Clock(initialP006Clock(), false);
  assert.equal(advanceP006Clock(playing, FRAME_MS - 1).frame, 1);
  assert.equal(advanceP006Clock(playing, FRAME_MS).frame, 2);
  assert.deepEqual(advanceP006Clock(playing, 1000), {
    frame: 13, elapsedMs: 1000, playing: true,
  });
  assert.deepEqual(playing, {frame: 1, elapsedMs: 0, playing: true});
});

test('P006 accumulates subframe deltas instead of rounding each tick away', () => {
  let clock = pauseP006Clock(initialP006Clock(), false);
  for (let tick = 0; tick < 7; tick += 1) {
    clock = advanceP006Clock(clock, FRAME_MS / 8);
    assert.equal(clock.frame, 1, `tick ${tick + 1}`);
  }
  clock = advanceP006Clock(clock, FRAME_MS / 8);
  assert.equal(clock.frame, 2);
  for (let tick = 0; tick < 16; tick += 1) {
    clock = advanceP006Clock(clock, FRAME_MS / 8);
  }
  assert.equal(clock.frame, 4);
  assert.ok(Math.abs(clock.elapsedMs - 3 * FRAME_MS) < 1e-8);
});

test('P006 rejects invalid elapsed deltas even while paused', () => {
  for (const delta of [-1, Number.NaN, Infinity, -Infinity]) {
    assert.throws(() => advanceP006Clock(initialP006Clock(), delta),
      /P006 invalid elapsed time/, String(delta));
  }
  assert.deepEqual(advanceP006Clock(initialP006Clock(), 0), initialP006Clock());
});

test('P006 seek rejects frames outside the integer domain', () => {
  for (const frame of [0, 343, -1, 1.5, Number.NaN, Infinity, -Infinity]) {
    assert.throws(() => seekP006Clock(frame), /P006 frame outside domain/, String(frame));
  }
  assert.deepEqual(seekP006Clock(1), initialP006Clock());
});

test('P006 pause and resume retain fractional progress; replay resets it', () => {
  const midway = advanceP006Clock(pauseP006Clock(initialP006Clock(), false), FRAME_MS / 2);
  const paused = pauseP006Clock(midway, true);
  assert.equal(paused.playing, false);
  assert.strictEqual(advanceP006Clock(paused, 3000), paused);
  const resumed = pauseP006Clock(paused, false);
  assert.equal(advanceP006Clock(resumed, FRAME_MS / 2).frame, 2);

  const inspected = seekP006Clock(249);
  assert.equal(inspected.frame, 249);
  assert.equal(inspected.playing, false);
  assert.ok(Math.abs(inspected.elapsedMs - 248 * FRAME_MS) < 1e-8);
  assert.equal(advanceP006Clock(inspected, 3000).frame, 249);
  assert.equal(advanceP006Clock(pauseP006Clock(inspected, false), FRAME_MS).frame, 250);
  assert.deepEqual(initialP006Clock(), {frame: 1, elapsedMs: 0, playing: false});
});

test('P006 stops at frame 342 and cannot advance or resume past the terminal frame', () => {
  const terminal = advanceP006Clock(
    pauseP006Clock(seekP006Clock(341), false), 2 * FRAME_MS,
  );
  assert.equal(terminal.frame, 342);
  assert.equal(terminal.playing, false);
  assert.ok(Math.abs(terminal.elapsedMs - 341 * FRAME_MS) < 1e-8);
  assert.strictEqual(advanceP006Clock(terminal, 1000), terminal);
  assert.equal(pauseP006Clock(terminal, false).playing, false);

  const directTerminal = seekP006Clock(342);
  assert.deepEqual(directTerminal, terminal);
  assert.equal(pauseP006Clock(directTerminal, false).playing, false);
  assert.strictEqual(advanceP006Clock(directTerminal, FRAME_MS), directTerminal);
});
