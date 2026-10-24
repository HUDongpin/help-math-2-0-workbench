/** Maintained P050 source-state draft. No renderer, audio, network or admission authority.
 * Exact source: 2c7dcd30a9d03bb79b26619447a702d44b9f3cdd060db44eb7fbf6b23a66f22a.
 * A random index is an injected observation of Flash random(remaining.length).
 * It is not a claim to reproduce Flash's pseudorandom sequence. */
export const P050_ANSWERS = [2,4,3,1,1,2,4,4,2,4,3,1,2,3,1,4,3,4,1,2,1,3,3,1] as const;
export type P050Option = 1 | 2 | 3 | 4;
export type P050Phase = 'question' | 'finish' | 'review-intro' | 'review' | 'exit-requested';
export type P050Response = Readonly<{questionId: number; option: P050Option; name: string; correct: boolean}>;
export type P050QuizState = Readonly<{
  phase: P050Phase;
  mainFrame: number;
  currentQuestionId: number;
  remainingQuestionIds: readonly number[];
  drawnQuestionIds: readonly number[];
  responses: readonly P050Response[];
  totalQuizCount: number;
  reviewOrdinal: number;
}>;
function requireValue(value: unknown, message: string): asserts value {
  if (!value) throw Error('P050 ' + message);
}
function validOption(option: number): asserts option is P050Option {
  requireValue(Number.isInteger(option) && option >= 1 && option <= 4, 'invalid source option');
}
function draw(state: P050QuizState, index: number): P050QuizState {
  requireValue(Number.isInteger(index) && index >= 0 && index < state.remainingQuestionIds.length,
    'random index outside remaining source bank');
  const questionId = state.remainingQuestionIds[index]!;
  return {...state, currentQuestionId: questionId, mainFrame: questionId + 1,
    remainingQuestionIds: state.remainingQuestionIds.filter((_, i) => i !== index),
    drawnQuestionIds: [...state.drawnQuestionIds, questionId]};
}
export function initialP050Quiz(randomIndex: number): P050QuizState {
  return draw({phase: 'question', mainFrame: 1, currentQuestionId: 0,
    remainingQuestionIds: Array.from({length: 24}, (_, i) => i + 1),
    drawnQuestionIds: [], responses: [], totalQuizCount: 1, reviewOrdinal: 0}, randomIndex);
}
/** The source handler name owns its question. An obsolete answer cannot answer the next draw. */
export function answerP050Question(state: P050QuizState, questionId: number,
  option: P050Option, nextRandomIndex?: number): P050QuizState {
  requireValue(state.phase === 'question' && questionId === state.currentQuestionId,
    'answer does not belong to the active question');
  validOption(option);
  const response: P050Response = {questionId, option, name: `A${questionId}Opt${option}`,
    correct: option === P050_ANSWERS[questionId - 1]};
  const responses = [...state.responses, response], totalQuizCount = state.totalQuizCount + 1;
  if (responses.length === 10) {
    requireValue(nextRandomIndex === undefined, 'no random draw after answer ten');
    // Mc_Finish overlays the last question: its frame and owner remain current.
    return {...state, phase: 'finish', responses, totalQuizCount};
  }
  requireValue(nextRandomIndex !== undefined, 'next source random index required');
  return draw({...state, responses, totalQuizCount}, nextRandomIndex);
}
export function p050Score(state: P050QuizState) {
  requireValue(state.responses.length === 10 && state.phase !== 'question', 'result requires ten answers');
  const correct = state.responses.filter(r => r.correct).length;
  return {total: state.responses.length, correct, wrong: state.responses.length - correct,
    grade: correct <= 3 ? 'Unsatisfactory' : correct <= 6 ? 'Partially Proficient' :
      correct <= 8 ? 'Proficient' : 'Advanced',
    finishText: `${correct} / ${state.responses.length}.`};
}
/** Minimal local adapter for the separately pinned indexMI Review call. */
export function enterP050Review(state: P050QuizState): P050QuizState {
  requireValue(state.phase === 'finish', 'review entry requires the result state');
  return {...state, phase: 'review-intro', mainFrame: 28};
}
export function advanceP050ReviewIntro(state: P050QuizState, frame: number): P050QuizState {
  requireValue(state.phase === 'review-intro' && Number.isInteger(frame) &&
    frame >= state.mainFrame && frame <= 44, 'review introduction stays within source frames 28–44');
  return {...state, mainFrame: frame};
}
export function nextP050Review(state: P050QuizState): P050QuizState {
  requireValue((state.phase === 'review-intro' && state.mainFrame === 44) || state.phase === 'review',
    'review advance requires the authored control');
  const reviewOrdinal = state.reviewOrdinal + 1;
  // After the tenth review the raw script names no eleventh review frame and asks
  // the host to unload/exit. Preserve the last valid frame and expose a local
  // request only. No legacy report, bookmark, unload, URL or completion is run.
  if (reviewOrdinal > 10) return {...state, phase: 'exit-requested', reviewOrdinal};
  const questionId = state.drawnQuestionIds[reviewOrdinal - 1]!;
  return {...state, phase: 'review', mainFrame: 44 + questionId, currentQuestionId: questionId,
    reviewOrdinal};
}
export function requestP050Exit(state: P050QuizState): P050QuizState {
  requireValue(state.phase === 'finish' || (state.phase === 'review' && state.reviewOrdinal === 10),
    'exit control requires the source result');
  return {...state, phase: 'exit-requested'};
}
export function p050CurrentReview(state: P050QuizState): P050Response | null {
  return state.phase === 'review' ? state.responses[state.reviewOrdinal - 1] ?? null : null;
}
type P050ReviewField = {text: string; color: number | null; border: boolean; borderColor?: number};
/** Keep both ordered source writes, including the mismatched first answer index.
 * Final fields are a static sequential projection; no AVM1 paint/flicker claim. */
export function p050ReviewProjection(response: P050Response, reviewOrdinal: number) {
  const {questionId, option, name} = response;
  requireValue(Number.isInteger(questionId) && questionId >= 1 && questionId <= 24 &&
    Number.isInteger(reviewOrdinal) && reviewOrdinal >= 1 && reviewOrdinal <= 10 &&
    name === `A${questionId}Opt${option}`, 'review response identity');
  validOption(option);
  const correctOption = P050_ANSWERS[questionId - 1]!, green = 39270, red = 16711680;
  const firstCorrect = name === `A${reviewOrdinal}Opt${P050_ANSWERS[reviewOrdinal - 1]}`;
  const firstWrite = {option, text: firstCorrect ? 'Correct' : 'Incorrect', color: firstCorrect ? green : red};
  const secondWrite = {option: correctOption, text: 'Correct', color: green};
  const finalFields: Record<string, P050ReviewField> = {}, finalClipColors: Record<string, number | null> = {};
  for (let i = 1; i <= 4; i++) { finalFields[i] = {text: '', color: null, border: false}; finalClipColors[i] = null; }
  for (const write of [firstWrite, secondWrite]) {
    finalFields[write.option] = {text: write.text, color: write.color, border: true, borderColor: write.color};
    finalClipColors[write.option] = write.color;
  }
  return {question: questionId, reviewPosition: reviewOrdinal, selectedOption: option, correctOption,
    firstWrite, secondWrite, firstIncorrectOverwritten: !firstCorrect && option === correctOption,
    finalFields, finalClipColors, responseLetter: 'ABCD'[option - 1],
    responseTextColor: option === correctOption ? green : red,
    correctLetter: 'ABCD'[correctOption - 1], correctTextColor: green};
}
/** Root frame 6 formats elapsed milliseconds; lifetime/pausing belongs to the host/session. */
export function p050ElapsedText(milliseconds: number): string {
  requireValue(Number.isFinite(milliseconds) && milliseconds >= 0, 'nonnegative elapsed time');
  let remaining = milliseconds;
  const hours = Math.floor(remaining / 3600000); remaining -= hours * 3600000;
  const minutes = Math.floor(remaining / 60000); remaining -= minutes * 60000;
  const seconds = Math.floor(remaining / 1000); remaining -= seconds * 1000;
  const hundredths = Math.floor(remaining / 10);
  return [hours, minutes, seconds, hundredths].map(n => String(n).padStart(2, '0')).join(':');
}
