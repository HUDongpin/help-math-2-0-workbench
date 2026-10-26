import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {
  finishP054Feedback, initialP054State, selectP054Card, validateP054Cards,
  type P054Card, type P054Level,
} from '../src/nms-l02-p054-matching-state-candidate';

const file = new URL('../../../catalog/product-bridge-calibrations/g678-nms-l02-p053-p054-game-contract-v1.json', import.meta.url);
const bytes = readFileSync(file);
const contract = JSON.parse(bytes.toString('utf8')) as {
  matching: {cards: P054Card[]};
};
const cardsFor = (level: P054Level) => contract.matching.cards.filter(card => card.level === level);

test('candidate is bound to the exact source card contract for both levels', () => {
  assert.equal(createHash('sha256').update(bytes).digest('hex'),
    '6d492f48cc2df39ca1636d5f9cde8f7529493eb3770c1d47c690a3c84b8aa205');
  for (const level of [1, 2] as const) validateP054Cards(cardsFor(level));
  assert.throws(() => validateP054Cards(cardsFor(1).slice(1)));
  assert.throws(() => validateP054Cards([...cardsFor(1).slice(1), cardsFor(1)[1]!]));
  assert.throws(() => validateP054Cards([...cardsFor(1).slice(1), cardsFor(2)[0]!]));
  assert.throws(() => selectP054Card(initialP054State(1), cardsFor(2), 'Mc1_1'));
});

test('wrong, repeat, and correct selection preserve source scoring and feedback lock', () => {
  const cards = cardsFor(1);
  let state = initialP054State(1);
  state = selectP054Card(state, cards, 'Mc1_1');
  assert.equal(state.selected, 'Mc1_1');
  state = selectP054Card(state, cards, 'Mc1_1');
  assert.equal(state.phase, 'feedback-wrong');
  assert.equal(state.score, -2);
  assert.equal(selectP054Card(state, cards, 'Mc1_2'), state);
  state = finishP054Feedback(state);
  state = selectP054Card(state, cards, 'Mc1_1');
  state = selectP054Card(state, cards, 'Mc2_2');
  assert.equal(state.score, -4);
  state = finishP054Feedback(state);
  state = selectP054Card(state, cards, 'Mc1_2');
  state = selectP054Card(state, cards, 'Mc1_1');
  assert.equal(state.phase, 'feedback-correct');
  assert.equal(state.score, 6);
  assert.equal(state.sourceCompletedPairCounter, 0);
  state = finishP054Feedback(state);
  assert.deepEqual(state.matchedPairIds, [1]);
  assert.equal(state.sourceCompletedPairCounter, 1);
  assert.equal(selectP054Card(state, cards, 'Mc1_1'), state);
  assert.equal(state.quizSection, true);
});

test('sixth correct feedback is an unresolved terminal, not accepted page completion', () => {
  for (const level of [1, 2] as const) {
    const cards = cardsFor(level);
    let state = initialP054State(level);
    for (let pairId = 1; pairId <= 6; pairId++) {
      state = selectP054Card(state, cards, `Mc${pairId}_1`);
      state = selectP054Card(state, cards, `Mc${pairId}_2`);
      assert.equal(state.phase, 'feedback-correct');
      assert.equal(state.sourceCompletedPairCounter, pairId - 1);
      state = finishP054Feedback(state);
    }
    assert.equal(state.score, 60);
    assert.equal(state.phase, 'terminal-unresolved');
    assert.equal(state.quizSection, false);
    assert.equal(state.sourceCompletedPairCounter, 0);
    assert.equal(selectP054Card(state, cards, 'Mc1_1'), state);
    assert.deepEqual(initialP054State(level).matchedPairIds, []);
    assert.equal(initialP054State(level).score, 0);
  }
});

test('invalid level and foreign card fail closed', () => {
  assert.throws(() => initialP054State(3 as P054Level));
  assert.throws(() => selectP054Card(initialP054State(1), cardsFor(1), 'foreign'));
});
