import assert from 'node:assert/strict';
import test from 'node:test';
import {resolvePrivatePlaybackPaused as resolve} from '../lib/g678-private-playback-decision-v1';
import {pauseP006Clock, seekP006Clock} from '../../../packages/demos/src/alg-l12-p006-visual-clock';

test('private terminal Play acknowledgement keeps the host paused', () => {
  const terminal = pauseP006Clock(seekP006Clock(342), false);
  assert.equal(resolve(false, !terminal.playing), true);
  const playing = pauseP006Clock(seekP006Clock(341), false);
  assert.equal(resolve(false, !playing.playing), false);
  assert.equal(resolve(true, true), true);
});

test('ordinary void adapters preserve requested state; nonboolean results are not authority', () => {
  for (const requested of [true, false]) {
    for (const result of [undefined, null, 0, 1, 'true', {}]) assert.equal(resolve(requested, result), requested);
  }
});
