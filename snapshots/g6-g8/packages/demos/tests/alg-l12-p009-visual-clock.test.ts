import assert from 'node:assert/strict';
import test from 'node:test';
import {advanceP009Clock, initialP009Clock, pauseP009Clock, seekP009Clock} from '../src/alg-l12-p009-visual-clock';

test('P009 transport retains paused and subframe progress across playback', () => {
  const initial = initialP009Clock();
  assert.deepEqual(initial, {frame: 1, elapsedMs: 0, playing: false});
  assert.strictEqual(advanceP009Clock(initial, 10000), initial);
  let clock = pauseP009Clock(initial, false);
  for (let i = 0; i < 7; i++) clock = advanceP009Clock(clock, 1000 / 96);
  assert.equal(clock.frame, 1);
  const paused = pauseP009Clock(clock, true);
  assert.strictEqual(advanceP009Clock(paused, 10000), paused);
  clock = advanceP009Clock(pauseP009Clock(paused, false), 1000 / 96);
  assert.equal(clock.frame, 2);
  assert.deepEqual(initialP009Clock(), initial);
});

test('P009 seek and end preserve exact source timeline boundaries', () => {
  for (const frame of [12, 14, 72, 142, 210, 284, 353, 383, 394]) {
    const state = seekP009Clock(frame);
    assert.equal(state.frame, frame);
    assert.equal(state.playing, false);
    assert.strictEqual(advanceP009Clock(state, 10000), state);
  }
  const last = advanceP009Clock(pauseP009Clock(seekP009Clock(393), false), 10000);
  assert.deepEqual(last, {frame: 394, elapsedMs: 32750, playing: false});
  assert.equal(pauseP009Clock(last, false).playing, false);
  assert.strictEqual(advanceP009Clock(last, 10000), last);
});

test('P009 transport rejects invalid caller inputs even while paused', () => {
  for (const frame of [0, 395, -1, 1.5, NaN, Infinity]) assert.throws(() => seekP009Clock(frame));
  for (const delta of [-1, NaN, Infinity]) assert.throws(() => advanceP009Clock(initialP009Clock(), delta));
});
