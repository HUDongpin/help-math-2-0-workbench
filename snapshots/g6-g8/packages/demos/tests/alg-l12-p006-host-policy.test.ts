import assert from 'node:assert/strict';
import test from 'node:test';
import {p006ShouldPause, p006TransportReady} from '../src/alg-l12-p006-host-policy';
import {advanceP006Clock, initialP006Clock, pauseP006Clock} from '../src/alg-l12-p006-visual-clock';

test('initial readiness waits for a complete drawing but subsequent paints do not reset transport', () => {
  assert.equal(p006TransportReady(false, 'loading'), false);
  assert.equal(p006TransportReady(false, 'updating'), false);
  let ready = p006TransportReady(false, 'ready');
  let clock = pauseP006Clock(initialP006Clock(), false);
  let startupTransitions = 1;
  for (let frame = 0; frame < 12; frame++) {
    for (const status of ['updating', 'ready']) {
      const next = p006TransportReady(ready, status);
      if (next && !ready) startupTransitions++;
      ready = next;
      assert.equal(ready, true);
      clock = advanceP006Clock(clock, 1000 / 24);
    }
  }
  assert.equal(startupTransitions, 1);
  assert.equal(clock.frame, 13);
  assert.equal(p006TransportReady(true, 'error'), false);
  assert.equal(p006TransportReady(true, 'loading'), false);
  assert.equal(p006TransportReady(true, undefined), false);
});

test('reduced motion blocks automatic startup but allows explicit Play and Replay', () => {
  const input = {requestedPause: false, ready: true, glossaryPending: false, reducedMotion: true};
  assert.equal(p006ShouldPause({...input, automaticStart: true}), true);
  assert.equal(p006ShouldPause(input), false);
  assert.equal(p006ShouldPause({...input, requestedPause: true}), true);
  assert.equal(p006ShouldPause({...input, ready: false}), true);
  assert.equal(p006ShouldPause({...input, glossaryPending: true}), true);
});
