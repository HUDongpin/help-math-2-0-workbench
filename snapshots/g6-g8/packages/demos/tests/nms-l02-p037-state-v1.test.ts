import assert from 'node:assert/strict';
import test from 'node:test';
import {P037_GAME_SOURCE as SOURCE} from '../src/generated/nms-l02-p037-state-source-v1';
import {p037Initial, p037Tick, p037Advance, p037Drop, p037Choose, p037CancelSelection,
  p037ClosePopup, p037OpenTerm, p037CloseTerm, p037Replay, p037MatchedCount,
  p037Matched, p037CanDrop, p037Advancing, p037Phase, type P037State} from '../src/nms-l02-p037-state-v1';
const exercise = (seed = 0) => p037Advance(p037Initial(seed), 441);
function fiveCorrect(order = [1, 2, 3, 4, 5], seed = 0) {
  let s = exercise(seed);
  for (const id of order) {
    assert(p037CanDrop(s, id));
    s = p037Drop(s, id, id);
    assert.equal(s.coachFrame, 2);
    assert.equal(s.sourcesEnabled, false);
    s = p037Advance(s, 18);
    assert.equal(s.coachFrame, 20);
    assert.equal(s.sourcesEnabled, true);
  }
  return s;
}
function permutations(values: number[]): number[][] {
  return values.length ? values.flatMap((v, i) => permutations(values.filter((_, j) => j !== i)).map(p => [v, ...p])) : [[]];
}
test('source target order is exact and every intended pair is rationally equal', () => {
  assert.equal(SOURCE.sourceSha256, '8f7ff05a83fd8c1370f979fedca8e148bd0b80c0bb45ddb7147534d3b92607a7');
  assert.deepEqual(SOURCE.targets.map(t => [t.id, t.fraction, t.decimal]), [
    [1, [1, 2], '0.5'], [3, [1, 8], '0.125'], [4, [1, 5], '0.2'], [5, [3, 4], '0.75'], [2, [3, 8], '0.375'],
  ]);
  for (const t of SOURCE.targets) {
    const places = t.decimal.split('.')[1].length, digits = BigInt(t.decimal.replace('.', ''));
    assert.equal(BigInt(t.fraction[0]) * 10n ** BigInt(places), digits * BigInt(t.fraction[1]));
  }
  assert(Object.isFrozen(SOURCE) && Object.isFrozen(SOURCE.cards) && Object.isFrozen(SOURCE.cards[0]));
});
test('main stops on entry442 and accepts no practice input during the introduction', () => {
  const first = p037Initial(), before = p037Advance(first, 440), held = p037Tick(before);
  assert.equal(p037Drop(first, 1, 1), first);
  assert.equal(before.mainFrame, 441); assert.equal(p037Phase(before), 'intro');
  assert.equal(held.mainFrame, 442); assert.equal(held.mainPlaying, false);
  assert.equal(p037Phase(held), 'exercise'); assert(held.quizSection && held.sourcesEnabled);
  assert.equal(p037Advance(held, 1000), held); assert.equal(p037Advancing(held), false);
  assert.equal(first.mainFrame, 1); assert(Object.isFrozen(held));
});
test('all36 card/target-or-outside combinations follow source identity, not a retry limit', () => {
  let checked = 0;
  for (const id of [1, 2, 3, 4, 5, 6]) for (const target of [1, 2, 3, 4, 5, null]) {
    const before = exercise(), after = p037Drop(before, id, target);
    assert.equal(after.mainFrame, 442); assert.equal(after.sourcesEnabled, false);
    if (id <= 5 && id === target) {
      assert.equal(p037MatchedCount(after), 1); assert(p037Matched(after, id));
      assert(after.coachPlaying); assert.equal(after.coachFrame, 2); assert.equal(after.popupVisible, false);
    } else {
      assert.equal(p037MatchedCount(after), 0); assert.equal(after.popupFrame, 2);
      assert(after.popupPlaying && after.popupVisible); assert.equal(after.coachPlaying, false);
    }
    assert.equal(before.matchedMask, 0); checked++;
  }
  assert.equal(checked, 36);
  let repeated = exercise();
  for (let i = 0; i < 8; i++) {
    repeated = p037Drop(repeated, 6, i % 2 ? null : 1);
    repeated = p037Advance(repeated, 13);
    assert.equal(repeated.popupFrame, 15); assert.equal(repeated.popupPlaying, false);
    repeated = p037ClosePopup(repeated);
    assert.equal(repeated.matchedMask, 0); assert.equal(repeated.mainFrame, 442); assert(repeated.sourcesEnabled);
  }
});
test('all120 successful orders complete through coach20, Correct25 and main483', () => {
  const orders = permutations([1, 2, 3, 4, 5]); assert.equal(orders.length, 120);
  for (const order of orders) {
    const s = fiveCorrect(order);
    assert.equal(s.matchedMask, 31); assert.equal(p037MatchedCount(s), 5);
    assert.equal(s.successFrame, 2); assert(s.successPlaying && s.coachPlaying);
    assert.equal(p037Drop(s, order[0], order[0]), s, 'hidden matched card cannot score twice');
    const resumed = p037Advance(s, 23);
    assert.equal(resumed.mainFrame, 442); assert(resumed.mainPlaying); assert.equal(resumed.quizSection, false);
    assert.equal(resumed.successFrame, 1); assert.equal(resumed.successPlaying, false);
    const removed = p037Tick(resumed);
    assert.equal(removed.mainFrame, 443); assert.equal(removed.coachFrame, null);
    assert.equal(removed.successFrame, null); assert.equal(removed.popupFrame, null); assert.equal(removed.sourcesEnabled, false);
    const done = p037Advance(removed, 40);
    assert.equal(done.mainFrame, 483); assert.equal(p037Phase(done), 'completed');
    assert.equal(done.matchedMask, 31); assert.equal(p037Advance(done, 100), done);
  }
});
test('late distractor popup does not stop the already running success timeline', () => {
  let s = p037Advance(fiveCorrect(), 3);
  assert.equal(s.successFrame, 5); assert(p037CanDrop(s, 6));
  s = p037Drop(s, 6, 1);
  assert(s.popupVisible && s.popupPlaying && s.successPlaying); assert.equal(s.popupFrame, 2);
  s = p037Advance(s, 6);
  assert.equal(s.successFrame, 11); assert.equal(s.popupFrame, 8); assert.equal(s.matchedMask, 31);
  s = p037ClosePopup(s); assert.equal(s.popupVisible, false); assert.equal(s.successFrame, 11);
  s = p037Advance(s, 13); assert.equal(s.successFrame, 24);
  s = p037Drop(s, 6, null); assert.equal(s.popupFrame, 2); assert(s.popupVisible);
  s = p037Tick(s);
  assert.equal(s.mainFrame, 442); assert(s.mainPlaying && s.popupVisible); assert.equal(s.popupFrame, 3);
  s = p037Tick(s);
  assert.equal(s.mainFrame, 443); assert.equal(s.popupFrame, null); assert.equal(s.popupVisible, false);
  assert.equal(p037Phase(p037Advance(s, 40)), 'completed');
});
test('Close changes visibility and unlocks while the source popup playhead continues independently', () => {
  const opened = p037Drop(exercise(), 6, 1), closed = p037ClosePopup(opened);
  assert.equal(closed.popupVisible, false); assert.equal(closed.popupFrame, 2); assert(closed.popupPlaying && closed.sourcesEnabled);
  let s = p037Drop(closed, 1, 1);
  assert(s.coachPlaying && s.popupPlaying); assert.equal(s.coachFrame, 2);
  s = p037Advance(s, 13);
  assert.equal(s.popupFrame, 15); assert.equal(s.popupPlaying, false); assert.equal(s.coachFrame, 15);
  s = p037Advance(s, 5); assert.equal(s.coachFrame, 20); assert(s.sourcesEnabled);
  s = p037Tick(s); assert.equal(s.coachFrame, 1); assert.equal(s.coachPlaying, false);
});
test('glossary freezes all independent playheads and cancels a keyboard selection', () => {
  let s = p037Choose(exercise(), 2); assert.equal(s.selectedCard, 2);
  const cancelled = p037CancelSelection(s); assert.equal(cancelled.selectedCard, null); assert.equal(cancelled.matchedMask, 0);
  assert.equal(p037OpenTerm(cancelled, 'fraction'), cancelled, 'popup-only link is unavailable outside popup');
  s = p037OpenTerm(s, 'column'); assert.equal(s.selectedCard, null); assert.equal(s.term, 'column');
  assert.equal(p037Advance(s, 100), s); assert.equal(p037Drop(s, 2, 2), s);
  s = p037CloseTerm(s); assert.equal(s.term, null); assert(p037CanDrop(s, 2));
  const parallel = p037Drop(p037Advance(fiveCorrect(), 4), 6, 1);
  for (const term of ['simple-simpler-simplest', 'decimal-equivalent', 'fraction'] as const) {
    const open = p037OpenTerm(parallel, term);
    assert.equal(p037Advance(open, 100), open); assert.equal(p037ClosePopup(open), open);
    const resumed = p037Tick(p037CloseTerm(open));
    assert.equal(resumed.successFrame, parallel.successFrame! + 1); assert.equal(resumed.popupFrame, 3);
  }
});
test('Replay resets every interaction/playhead and preserves only source seed plus replay count', () => {
  for (const seed of [0, 0xffffffff]) {
    const samples: P037State[] = [p037Advance(p037Initial(seed), 203), p037Choose(exercise(seed), 3),
      p037Drop(exercise(seed), 6, null), p037Drop(p037Advance(fiveCorrect(undefined, seed), 5), 6, 1)];
    for (const s of samples) {
      const replayed = p037Replay(s);
      assert.deepEqual(replayed, p037Initial(seed, s.replay + 1));
      assert.deepEqual(p037Advance(replayed, 441), p037Advance(p037Initial(seed, s.replay + 1), 441));
    }
  }
});
test('invalid external identities and unbounded queries fail explicitly', () => {
  for (const seed of [-1, 0.5, NaN, Infinity, 0x100000000]) assert.throws(() => p037Initial(seed), /P037_STATE_IDENTITY/);
  for (const replay of [-1, 0.5, NaN]) assert.throws(() => p037Initial(0, replay), /P037_STATE_IDENTITY/);
  for (const id of [0, 7, NaN, 1.5]) assert.throws(() => p037Drop(exercise(), id, 1), /P037_CARD_ID/);
  for (const target of [0, 6, NaN]) assert.throws(() => p037Drop(exercise(), 1, target), /P037_TARGET_ID/);
  for (const frames of [-1, 0.5, NaN, 10001]) assert.throws(() => p037Advance(exercise(), frames), /P037_ADVANCE/);
});
