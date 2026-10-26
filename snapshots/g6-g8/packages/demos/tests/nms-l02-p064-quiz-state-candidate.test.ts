import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {
  advanceP064Review, answerP064Question, initialP064Quiz, p064CurrentReview, p064Grade,
  type P064Option, type P064QuizState,
} from '../src/nms-l02-p064-quiz-state-candidate';

const bytes = readFileSync(new URL('../../../migrations/shared-nms002-l02-p064/audit/source-quiz-contract-v1.json', import.meta.url));
const contract = JSON.parse(bytes.toString('utf8')) as {
  animationId: string;
  quiz: {bankSize: number; drawCount: number; correctOptions: P064Option[]};
  boundaries: {completion: string; hostQuestionAudio: string; legacyQuizReport: string; legacyBookmarkAndClose: string};
};
const answerKey = contract.quiz.correctOptions;

function finishWithCorrectCount(correctCount: number): P064QuizState {
  let state = initialP064Quiz(answerKey, 0);
  for (let ordinal = 0; ordinal < 10; ordinal++) {
    const correct = answerKey[state.currentQuestionId! - 1]!;
    const option = ordinal < correctCount ? correct : ((correct % 4) + 1) as P064Option;
    state = answerP064Question(state, option, ordinal === 9 ? undefined : 0);
  }
  return state;
}

test('quiz state binds the exact 35-question source contract, not a generic FQ placeholder', () => {
  assert.equal(createHash('sha256').update(bytes).digest('hex'),
    '943270c7fdeefd4226e5f13a9d2679cf277c9415efbe8b5e979798cd12a537e5');
  assert.equal(contract.animationId, 'shared-nms002-l02-p064');
  assert.equal(contract.quiz.bankSize, 35);
  assert.equal(contract.quiz.drawCount, 10);
  assert.match(contract.boundaries.legacyQuizReport, /not-authorized/u);
  assert.match(contract.boundaries.legacyBookmarkAndClose, /not-authorized/u);
  assert.match(contract.boundaries.hostQuestionAudio, /answer-audio-unresolved/u);
  assert.match(contract.boundaries.completion, /unresolved/u);
  assert.throws(() => initialP064Quiz(answerKey.slice(1), 0));
  assert.throws(() => initialP064Quiz(answerKey, 35));
});

test('ten source-index draws select distinct questions without replacement and stop at finish', () => {
  let state = initialP064Quiz(answerKey, 34);
  assert.equal(state.currentQuestionId, 35);
  assert.throws(() => p064Grade(state));
  assert.throws(() => advanceP064Review(state));
  for (let ordinal = 0; ordinal < 10; ordinal++) {
    const nextIndex = ordinal === 9 ? undefined : ordinal % state.remainingQuestionIds.length;
    state = answerP064Question(state, answerKey[state.currentQuestionId! - 1]!, nextIndex);
  }
  assert.equal(state.phase, 'finish');
  assert.equal(state.currentQuestionId, null);
  assert.equal(state.responses.length, 10);
  assert.equal(new Set(state.responses.map(response => response.questionId)).size, 10);
  assert.equal(state.remainingQuestionIds.length, 25);
  assert.equal(p064Grade(state), 'Advanced');
  assert.throws(() => answerP064Question(state, 1));
  assert.throws(() => answerP064Question(initialP064Quiz(answerKey, 0), 1));
  assert.throws(() => answerP064Question(initialP064Quiz(answerKey, 0), 1, 35));
});

test('source grade bands and selected-question review order stay distinct from host completion', () => {
  const grades = [
    [0, 'Unsatisfactory'], [3, 'Unsatisfactory'],
    [4, 'Partially Proficient'], [6, 'Partially Proficient'],
    [7, 'Proficient'], [8, 'Proficient'],
    [9, 'Advanced'], [10, 'Advanced'],
  ] as const;
  for (const [count, expected] of grades) assert.equal(p064Grade(finishWithCorrectCount(count)), expected);

  let state = finishWithCorrectCount(7);
  const selectedOrder = state.responses.map(response => response.questionId);
  for (let ordinal = 1; ordinal <= 10; ordinal++) {
    state = advanceP064Review(state);
    assert.equal(state.phase, 'review');
    assert.equal(p064CurrentReview(state)?.questionId, selectedOrder[ordinal - 1]);
    assert.equal(state.reviewOrdinal, ordinal);
  }
  state = advanceP064Review(state);
  assert.equal(state.phase, 'host-exit-unresolved');
  assert.equal(p064CurrentReview(state), null);
  assert.throws(() => advanceP064Review(state));
  assert.deepEqual(initialP064Quiz(answerKey, 0).responses, []);
});
