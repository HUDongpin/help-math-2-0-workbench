import test from 'node:test';
import assert from 'node:assert/strict';
import {DAT_L03_FEEDBACK_BINDINGS, datL3FeedbackBinding, isDatL3FeedbackSource, datL3FeedbackReturned} from '../src/hfr/dat-l03-feedback-source-binding.ts';

test('only the four inspected DAT L3 source/data pairs select the dependency', () => {
  assert.deepEqual(DAT_L03_FEEDBACK_BINDINGS.map(row => row.animationId), [
    'shared-dat001-l03-p029', 'shared-dat001-l03-p034', 'shared-dat001-l03-p037', 'shared-dat001-l03-p044',
  ]);
  for (const row of DAT_L03_FEEDBACK_BINDINGS) {
    assert.equal(isDatL3FeedbackSource(row.animationId, row.sourceSha256), true);
    assert.equal(datL3FeedbackBinding(row.animationId, row.sourceSha256, row.dataSha256), row);
    assert.equal(datL3FeedbackBinding(row.animationId, '0'.repeat(64), row.dataSha256), null);
    assert.equal(datL3FeedbackBinding(row.animationId, row.sourceSha256, '0'.repeat(64)), null);
    assert.equal(datL3FeedbackBinding('shared-dat001-l03-p030', row.sourceSha256, row.dataSha256), null);
    assert.equal(isDatL3FeedbackSource(row.animationId, '0'.repeat(64)), false);
  }
});

test('the indexMI source branch sets remain three wrong and four right, without a fourth wrong alias', () => {
  for (const row of DAT_L03_FEEDBACK_BINDINGS) {
    assert.deepEqual(row.feedback.filter(branch => branch.kind === 'wrong').map(branch => branch.name).sort(),
      ['Mc_Wrong_Feed1', 'Mc_Wrong_Feed2', 'Mc_Wrong_Feed3']);
    assert.deepEqual(row.feedback.filter(branch => branch.kind === 'right').map(branch => branch.name).sort(),
      ['Mc_Right_Feed1', 'Mc_Right_Feed2', 'Mc_Right_Feed3', 'Mc_Right_Feed4']);
    assert.equal(new Set(row.feedback.map(branch => branch.characterId)).size, 7);
  }
  assert.equal(DAT_L03_FEEDBACK_BINDINGS[3].answers.length, 3, 'P044 has no fourth source answer');
});

// Synthetic observations exercise only the return predicate. No source runtime,
// browser, generated page action, audio or acceptance evidence is executed here.
const firstWrong = () => ({kind: 'wrong', countBefore: 0, countAfter: 1, questionFrame: 185,
  mainFrame: 185, mainPlaying: false, quizSection: true, feedbackFrame: 1, feedbackPlaying: false, pendingSourceActions: 0});

test('first actual wrong exit allows retry only after authored0->1 and source feedback reset', () => {
  const observed = firstWrong(), before = structuredClone(observed);
  assert.equal(datL3FeedbackReturned(observed), true);
  assert.deepEqual(observed, before, 'observation does not mutate authored state');
});
test('second actual wrong exit requires authored1->0 and main continuation', () => {
  assert.equal(datL3FeedbackReturned({...firstWrong(), countBefore: 1, countAfter: 0, quizSection: false, mainPlaying: true}), true);
});
test('right exit preserves the source try count and requires main continuation', () => {
  for (const count of [0, 1]) assert.equal(datL3FeedbackReturned({...firstWrong(), kind: 'right', countBefore: count,
    countAfter: count, quizSection: false, mainPlaying: true}), true);
});
for (const [name, change] of [
  ['feedback still at its visible hold', {feedbackFrame: 20}],
  ['feedback still playing', {feedbackPlaying: true}],
  ['source action queue not finished', {pendingSourceActions: 1}],
  ['try count not incremented', {countAfter: 0}],
  ['string count in place of actual numeric source count', {countAfter: '1'}],
  ['first wrong continues main early', {mainPlaying: true}],
  ['first wrong clears quizSection early', {quizSection: false}],
  ['first wrong moved to another main frame', {mainFrame: 186}],
  ['unobserved source count', {countAfter: undefined}],
  ['unsupported source branch kind', {kind: 'unknown'}],
]) test('a recorded outcome does not substitute for '+name, () => {
  assert.equal(datL3FeedbackReturned({...firstWrong(), ...change}), false);
});
test('second wrong and right must not reset a still-held question', () => {
  assert.equal(datL3FeedbackReturned({...firstWrong(), countBefore: 1, countAfter: 0, quizSection: false}), false);
  assert.equal(datL3FeedbackReturned({...firstWrong(), kind: 'right', countAfter: 0, quizSection: false}), false);
});
