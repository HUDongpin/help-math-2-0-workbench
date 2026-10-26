import assert from 'node:assert/strict';
import test from 'node:test';
import {P010_TEXT_STATE_SOURCE, p010TextState} from '../src/generated/alg-l06-p010-text-state-v1';

test('source-bound text groups honor the authored alpha and mask boundaries', () => {
  const group = (frame: number) => p010TextState(frame);
  assert.equal(P010_TEXT_STATE_SOURCE.sourceSwfSha256,
    '96552f567037f39868d01b1ba77311858caf2efcdb141ef64ed0878a6c48ce14');
  assert.equal(group(28).heading.semanticVisible, false);
  assert.equal(group(29).heading.semanticVisible, true);
  assert.equal(group(147).equation.semanticVisible, false);
  assert.equal(group(148).equation.semanticVisible, true);
  assert.equal(group(166).tableRows.filter(row => row.semanticVisible).length, 0);
  assert.equal(group(167).tableRows.filter(row => row.semanticVisible).length, 6);
  assert.equal(group(197).graph.cups.filter(label => label.semanticVisible).length, 0);
  assert.equal(group(198).graph.cups.filter(label => label.semanticVisible).length, 6);
  assert.equal(group(198).graph.money.filter(label => label.semanticVisible).length, 7);
  assert.equal(group(268).question.semanticVisible, false);
  assert.equal(group(296).question.semanticVisible, false);
  assert.equal(group(297).question.semanticVisible, true);
  assert.equal(group(303).question.semanticVisible, true);
});

test('Function action remains source keyed and does not reveal the question early', () => {
  assert.equal(p010TextState(267).functionControl.available, false);
  const placed = p010TextState(268);
  assert.equal(placed.functionControl.sourceCharacterId, 51);
  assert.equal(placed.functionControl.sourceKey, 'Function');
  assert.equal(placed.functionControl.sourceVisualState, 'hit-test-only');
  assert.equal(placed.functionControl.available, true);
  assert.equal(placed.question.visibility, 'partial');
  assert.equal(placed.question.semanticVisible, false);
  assert.equal(p010TextState(303).functionControl.available, true);
  assert.equal(P010_TEXT_STATE_SOURCE.button.hostApi, 'DoHyperLinks');
});

test('complete table pairs and independent graph scales retain source quantities', () => {
  const state = p010TextState(198);
  assert.equal(state.equation.text, 'M = $0.50 x C');
  assert.deepEqual(state.tableRows.map(row => [row.cups.text, row.money.text]), [
    ['20', '$10.00'], ['30', '$15.00'], ['40', '$20.00'],
    ['50', '$25.00'], ['60', '$30.00'], ['70', '$35.00'],
  ]);
  assert.deepEqual(state.graph.cups.map(label => label.text),
    ['20', '40', '60', '80', '100', '120']);
  assert.deepEqual(state.graph.money.map(label => label.text),
    ['$0', '$20', '$40', '$60', '$80', '$100', '$120']);
  assert.equal(state.question.semanticVisible, false);
});

test('frame state is pure across terminal, Replay and invalid inputs', () => {
  const initial = p010TextState(1);
  p010TextState(303);
  assert.deepEqual(p010TextState(1), initial);
  assert.equal(initial.heading.semanticVisible, false);
  assert.equal(initial.functionControl.available, false);
  for (const invalid of [0, 304, 1.5, Number.NaN])
    assert.throws(() => p010TextState(invalid), /P010_TEXT_FRAME_OUT_OF_RANGE/);
});
