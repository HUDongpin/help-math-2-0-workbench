/** Source-script state only: no rendered quiz, audio, host report, or completion authority. */
export type P064Option = 1 | 2 | 3 | 4;
export type P064Phase = 'question' | 'finish' | 'review' | 'host-exit-unresolved';
export type P064Response = Readonly<{questionId: number; option: P064Option; correct: boolean}>;
export type P064QuizState = Readonly<{
  phase: P064Phase;
  answerKey: readonly P064Option[];
  remainingQuestionIds: readonly number[];
  currentQuestionId: number | null;
  responses: readonly P064Response[];
  reviewOrdinal: number;
}>;

function assertIndex(index: number, length: number): void {
  if (!Number.isInteger(index) || index < 0 || index >= length) {
    throw new Error('P064 source random index is outside the remaining question bank');
  }
}

function drawQuestion(state: P064QuizState, randomIndex: number): P064QuizState {
  assertIndex(randomIndex, state.remainingQuestionIds.length);
  const currentQuestionId = state.remainingQuestionIds[randomIndex]!;
  return {...state, currentQuestionId,
    remainingQuestionIds: state.remainingQuestionIds.filter((_, index) => index !== randomIndex)};
}

export function initialP064Quiz(answerKey: readonly P064Option[], randomIndex: number): P064QuizState {
  if (answerKey.length !== 35 || answerKey.some(option => ![1, 2, 3, 4].includes(option))) {
    throw new Error('P064 requires 35 four-option source answers');
  }
  return drawQuestion({phase: 'question', answerKey: [...answerKey],
    remainingQuestionIds: Array.from({length: 35}, (_, index) => index + 1),
    currentQuestionId: null, responses: [], reviewOrdinal: 0}, randomIndex);
}

/** The index represents one observed `random(remaining.length)` result, not a JS guess at Flash's PRNG. */
export function answerP064Question(
  state: P064QuizState, option: P064Option, nextRandomIndex?: number,
): P064QuizState {
  if (state.phase !== 'question' || state.currentQuestionId === null) {
    throw new Error('P064 is not awaiting a question answer');
  }
  if (![1, 2, 3, 4].includes(option)) throw new Error('Invalid P064 answer option');
  const response = {questionId: state.currentQuestionId, option,
    correct: option === state.answerKey[state.currentQuestionId - 1]} as const;
  const responses = [...state.responses, response];
  if (responses.length === 10) {
    if (nextRandomIndex !== undefined) throw new Error('P064 does not draw after question ten');
    return {...state, phase: 'finish', currentQuestionId: null, responses};
  }
  if (nextRandomIndex === undefined) throw new Error('P064 next random index required');
  return drawQuestion({...state, currentQuestionId: null, responses}, nextRandomIndex);
}

export function p064Grade(state: P064QuizState): string {
  if (state.responses.length !== 10 || state.phase === 'question') {
    throw new Error('P064 grade is unavailable before ten answers');
  }
  const correct = state.responses.filter(response => response.correct).length;
  if (correct <= 3) return 'Unsatisfactory';
  if (correct <= 6) return 'Partially Proficient';
  if (correct <= 8) return 'Proficient';
  return 'Advanced';
}

/** Source review order follows the ten selected questions; the legacy host exit remains unresolved. */
export function advanceP064Review(state: P064QuizState): P064QuizState {
  if (state.phase !== 'finish' && state.phase !== 'review') {
    throw new Error('P064 review is not available in this phase');
  }
  const reviewOrdinal = state.reviewOrdinal + 1;
  if (reviewOrdinal > 10) return {...state, phase: 'host-exit-unresolved', reviewOrdinal};
  return {...state, phase: 'review', reviewOrdinal};
}

export function p064CurrentReview(state: P064QuizState): P064Response | null {
  return state.phase === 'review' ? state.responses[state.reviewOrdinal - 1] ?? null : null;
}
