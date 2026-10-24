import {selectAlgL09FinalAssessmentQuestions} from './g678-alg-l09-game-assessment';
import {p060Question, type P060Choice} from './alg-l06-p060-source-v1';

export type P060Phase = 'question' | 'result' | 'review' | 'closed';
export interface P060Response {
  readonly questionId: number;
  readonly choice: P060Choice;
  readonly sourceInstance: string;
  readonly correct: boolean;
  readonly elapsedMs: number;
}
export interface P060State {
  readonly seed: number;
  readonly replay: number;
  readonly epoch: number;
  readonly phase: P060Phase;
  readonly selection: readonly number[];
  readonly responses: readonly P060Response[];
  readonly reviewIndex: number | null;
  readonly finishedElapsedMs: number | null;
}
export interface P060Identity {
  readonly seed: number;
  readonly replay: number;
  readonly epoch: number;
  readonly phase: P060Phase;
  readonly questionId: number | null;
}
export type P060Action =
  | Readonly<{type: 'answer'; identity: P060Identity; choice: P060Choice; elapsedMs: number}>
  | Readonly<{type: 'review' | 'review-next' | 'close' | 'replay'; identity: P060Identity}>;

export const P060_ADAPTATIONS = Object.freeze({
  selection: 'Reuse the maintained ALG L9 deterministic selector for 10 distinct questions from 24. Precomputed selection preserves the source without-replacement domain; exact AVM1 draws and draw timing are unverified.',
  reviewEntry: 'Explicit modern Review control connects the result to the authored review sequence. The source has no established local Finish-to-Review edge.',
  reviewExit: 'After the tenth review, return to local results. Continue requests the typed modern host completion; legacy unload/getURL/bookmark/report calls are not executed.',
  elapsed: 'Monotonic active time excludes host pauses and freezes at the tenth answer. Source root getTimer updates and legacy report timing are not reproduced.',
  text: 'Retain source English question text and the E axis on both golf-ball graphs. EN/ES controls and original recordings are independent.',
});
function freeze(state: P060State): P060State {
  return Object.freeze({...state, selection: Object.freeze([...state.selection]), responses: Object.freeze(state.responses.map(r => Object.freeze({...r})))});
}
export function p060Initial(seed = 0, replay = 0): P060State {
  if (![seed, replay].every(n => Number.isSafeInteger(n) && n >= 0 && n <= 0xffffffff)) throw Error('P060_SEED');
  return freeze({seed, replay, epoch: 0, phase: 'question', selection: selectAlgL09FinalAssessmentQuestions(seed), responses: [], reviewIndex: null, finishedElapsedMs: null});
}
export function p060Identity(state: P060State): P060Identity {
  const index = state.phase === 'question' ? state.responses.length : state.phase === 'review' ? state.reviewIndex : null;
  return Object.freeze({seed: state.seed, replay: state.replay, epoch: state.epoch, phase: state.phase, questionId: index === null ? null : state.selection[index]!});
}
export function p060Matches(state: P060State, identity: P060Identity) {
  const current = p060Identity(state);
  return !!identity && Object.keys(current).every(k => current[k as keyof P060Identity] === identity[k as keyof P060Identity]);
}
/** One source option release records one response and advances. Event identity
 * prevents double clicks and an old page/replay event from answering anew. */
export function p060Reduce(state: P060State, action: P060Action): P060State {
  if (!p060Matches(state, action.identity)) return state;
  if (action.type === 'replay') return state.replay === 0xffffffff ? state : p060Initial(state.seed, state.replay + 1);
  if (action.type === 'answer') {
    const previous = state.responses.at(-1)?.elapsedMs ?? 0;
    if (state.phase !== 'question' || !['A', 'B', 'C', 'D'].includes(action.choice) || !Number.isFinite(action.elapsedMs) || action.elapsedMs < previous) return state;
    const question = p060Question(state.selection[state.responses.length]!);
    const option = question.options.find(o => o.letter === action.choice)!;
    const responses = [...state.responses, {questionId: question.id, choice: action.choice, sourceInstance: option.sourceInstance, correct: option.correct, elapsedMs: action.elapsedMs}];
    const done = responses.length === 10;
    return freeze({...state, responses, epoch: state.epoch + 1, phase: done ? 'result' : 'question', finishedElapsedMs: done ? action.elapsedMs : null});
  }
  if (action.type === 'review' && state.phase === 'result') return freeze({...state, phase: 'review', reviewIndex: 0, epoch: state.epoch + 1});
  if (action.type === 'review-next' && state.phase === 'review' && state.reviewIndex !== null) {
    const next = state.reviewIndex + 1;
    return freeze({...state, phase: next === 10 ? 'result' : 'review', reviewIndex: next === 10 ? null : next, epoch: state.epoch + 1});
  }
  if (action.type === 'close' && state.phase === 'result') return freeze({...state, phase: 'closed', epoch: state.epoch + 1});
  return state;
}
export function p060Results(state: P060State) {
  if (state.responses.length !== 10) return null;
  const correct = state.responses.filter(r => r.correct).length;
  return Object.freeze({correct, wrong: 10 - correct, total: 10, elapsedMs: state.finishedElapsedMs,
    grade: correct <= 3 ? 'Unsatisfactory' : correct <= 6 ? 'Partially Proficient' : correct <= 8 ? 'Proficient' : 'Advanced'});
}
export function p060Review(state: P060State) {
  if (state.phase !== 'review' || state.reviewIndex === null) return null;
  const response = state.responses[state.reviewIndex]!, question = p060Question(response.questionId);
  return Object.freeze({response, question, options: question.options.map(o => Object.freeze({
    ...o, sourceInstance: o.reviewInstance, selected: o.letter === response.choice,
    // The later source correct marker overwrites the earlier ordinal-indexed marker.
    feedback: o.correct ? 'Correct' : o.letter === response.choice ? 'Incorrect' : '',
  }))});
}
export function p060SourceState(state: P060State) {
  const index = state.phase === 'review' ? state.reviewIndex! : Math.min(9, state.responses.length);
  const question = p060Question(state.selection[index]!);
  return Object.freeze({rootFrame: 6, frameDomain: 'sprite-973', frame: state.phase === 'review' ? question.reviewFrame : question.questionFrame,
    finishVisible: state.phase === 'result' || state.phase === 'closed', finishFrame: 2,
    ordinal: index + 1, total: 10, questionId: question.id});
}
