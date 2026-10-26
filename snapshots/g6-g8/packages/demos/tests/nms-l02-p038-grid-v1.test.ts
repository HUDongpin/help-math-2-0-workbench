import assert from 'node:assert/strict';
import test from 'node:test';
import {p038GridFrame} from '../src/nms-l02-p038-grid-v1';
test('source fill irregularities and final75of100 are preserved', () => {
  assert.equal(p038GridFrame(163).visible, false);
  assert.equal(p038GridFrame(164).visible, true);
  assert.equal(p038GridFrame(253).filled, 0);
  for (const [frame, count] of [[254, 1], [266, 13], [267, 15], [272, 20], [273, 20], [277, 25], [328, 75], [467, 75]])
    assert.equal(p038GridFrame(frame).filled, count);
  const end = p038GridFrame(467);
  assert.equal(end.cells.filter(c => c.filled).length, 75);
  assert(end.cells.filter(c => c.column < 7).every(c => c.filled));
  assert(end.cells.filter(c => c.column === 7).every(c => c.filled === (c.row < 5)));
  assert(end.cells.filter(c => c.column > 7).every(c => !c.filled));
});
test('all source frames have bounded monotonic fill and immutable cells', () => {
  let prior = 0;
  for (let frame = 1; frame <= 467; frame++) {
    const state = p038GridFrame(frame);
    assert(state.filled >= prior && state.filled <= 75);
    assert.equal(state.cells.length, 100);
    assert.equal(state.cells.filter(c => c.filled).length, state.filled);
    assert(Object.isFrozen(state) && Object.isFrozen(state.cells) && state.cells.every(Object.isFrozen));
    prior = state.filled;
  }
  for (const frame of [0, 468, NaN, 2.5]) assert.throws(() => p038GridFrame(frame));
});
