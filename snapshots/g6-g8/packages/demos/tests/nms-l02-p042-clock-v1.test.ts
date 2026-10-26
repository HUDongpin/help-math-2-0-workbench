import test from 'node:test';
import assert from 'node:assert/strict';
import { p042ClockInitial, p042ClockPlay, p042ClockPause, p042ClockSync, p042ClockReplay } from '../src/nms-l02-p042-clock-v1';
test('52-second stop enters frame 625 exactly and cannot restart without Replay', () => {
  const playing = p042ClockPlay(p042ClockInitial(), 100);
  assert.equal(p042ClockSync(playing, 151.99).state.frame, 624);
  const end = p042ClockSync(playing, 152);
  assert.deepEqual(end.state, { frame: 625, completed: true, playing: false, replay: 0 });
  assert.equal(p042ClockPlay(end, 153), end);
  const replay = p042ClockReplay(end);
  assert.deepEqual(replay.state, { frame: 1, completed: false, playing: false, replay: 1 });
});
test('pause preserves fractional-frame time across arbitrarily long idle periods', () => {
  const paused = p042ClockPause(p042ClockPlay(p042ClockInitial(), 20), 20.125);
  assert.equal(paused.elapsed, .125);
  assert.equal(p042ClockSync(paused, 900), paused);
  const resumed = p042ClockSync(p042ClockPlay(paused, 900), 900.125);
  assert.equal(resumed.elapsed, .25);
  assert.equal(resumed.state.frame, 4);
});
test('reversed and invalid clocks fail explicitly', () => {
  assert.throws(() => p042ClockSync(p042ClockPlay(p042ClockInitial(), 20), 19), /REVERSED/);
  for (const n of [-1, NaN, Infinity]) assert.throws(() => p042ClockPlay(p042ClockInitial(), n), /CLOCK_TIME/);
});
