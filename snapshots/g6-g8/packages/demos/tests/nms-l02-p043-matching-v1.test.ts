import test from 'node:test';
import assert from 'node:assert/strict';
import { P043_TARGETS, p043InitialMatching, p043EnterMatching, p043Match, p043CloseWrongFeedback, p043FinishCorrectFeedback, p043FinishCompletion, p043ReplayMatching, type P043Term, type P043Row } from '../src/nms-l02-p043-matching-v1';
const terms = Object.keys(P043_TARGETS) as P043Term[];
test('all16 term/row choices follow the source mapping; feedback locks attempts', () => {
  for (const term of terms) for (const row of [1, 2, 3, 4] as P043Row[]) {
    const initial = p043InitialMatching(); assert.equal(p043Match(initial, term, row), initial);
    const state = p043Match(p043EnterMatching(initial), term, row), correct = P043_TARGETS[term] === row;
    assert.equal(state.phase, correct ? 'correct-feedback' : 'wrong-feedback');
    assert.equal(state.matched.length, correct ? 1 : 0);
    assert.equal(p043Match(state, 'fraction', 2), state);
    assert.equal(p043FinishCompletion(state), state);
    const ready = correct ? p043FinishCorrectFeedback(state) : p043CloseWrongFeedback(state);
    assert.equal(ready.phase, 'ready'); assert.equal(ready.attempt, null);
    if (correct) assert.equal(p043Match(ready, term, row), ready);
  }
});
function permutations<T>(items: T[]): T[][] { return items.length ? items.flatMap((item, index) => permutations(items.filter((_, i) => i !== index)).map(rest => [item, ...rest])) : [[]]; }
test('all24 solution orders complete only after both feedback gates; Replay fully resets', () => {
  for (const order of permutations(terms)) {
    let state = p043EnterMatching(p043InitialMatching());
    for (const term of order) {
      state = p043Match(state, term, P043_TARGETS[term]); assert.equal(state.phase, 'correct-feedback');
      assert.equal(p043FinishCompletion(state), state); state = p043FinishCorrectFeedback(state);
    }
    assert.equal(state.phase, 'completion-feedback'); assert.equal(new Set(state.matched).size, 4);
    state = p043FinishCompletion(state); assert.equal(state.phase, 'complete');
    assert.deepEqual(p043ReplayMatching(state), { phase: 'intro', matched: [], attempt: null, replay: 1 });
  }
});
