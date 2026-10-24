/** Four source Scr_i -> Mc_Tar_i pairs; source SWF a6a13838...419528.
 * Media/host completion is explicit: four matches alone do not skip feedback.
 */
export type P043Term = 'fraction' | 'equivalent' | 'decimal' | 'percent';
export type P043Row = 1 | 2 | 3 | 4;
export const P043_TARGETS: Readonly<Record<P043Term, P043Row>> = Object.freeze({ fraction: 2, equivalent: 4, decimal: 1, percent: 3 });
export interface P043MatchingState {
  readonly phase: 'intro' | 'ready' | 'wrong-feedback' | 'correct-feedback' | 'completion-feedback' | 'complete';
  readonly matched: readonly P043Term[];
  readonly attempt: Readonly<{ term: P043Term; row: P043Row; correct: boolean }> | null;
  readonly replay: number;
}
const freeze = (state: P043MatchingState): P043MatchingState => Object.freeze({ ...state, matched: Object.freeze([...state.matched]) });
export const p043InitialMatching = (): P043MatchingState => freeze({ phase: 'intro', matched: [], attempt: null, replay: 0 });
/** Main source sprite250 first holds for matching at frame223. */
export function p043EnterMatching(state: P043MatchingState): P043MatchingState {
  return state.phase === 'intro' ? freeze({ ...state, phase: 'ready' }) : state;
}
export function p043Match(state: P043MatchingState, term: P043Term, row: P043Row): P043MatchingState {
  if (!Object.hasOwn(P043_TARGETS, term) || !Number.isInteger(row) || row < 1 || row > 4) throw Error('P043_MATCH_IDENTITY');
  if (state.phase !== 'ready' || state.matched.includes(term)) return state;
  const correct = P043_TARGETS[term] === row;
  return freeze({ ...state, phase: correct ? 'correct-feedback' : 'wrong-feedback',
    matched: correct ? [...state.matched, term] : state.matched,
    attempt: Object.freeze({ term, row, correct }) });
}
/** Close button242 restores inputs without accepting an incorrect match. */
export function p043CloseWrongFeedback(state: P043MatchingState): P043MatchingState {
  return state.phase === 'wrong-feedback' ? freeze({ ...state, phase: 'ready', attempt: null }) : state;
}
/** Sprite249 reaches frame20 before re-enabling or asking for final feedback. */
export function p043FinishCorrectFeedback(state: P043MatchingState): P043MatchingState {
  return state.phase === 'correct-feedback' ? freeze({ ...state, phase: state.matched.length === 4 ? 'completion-feedback' : 'ready', attempt: null }) : state;
}
/** Called only after the selected completion media and main terminal frame. */
export function p043FinishCompletion(state: P043MatchingState): P043MatchingState {
  return state.phase === 'completion-feedback' ? freeze({ ...state, phase: 'complete' }) : state;
}
export function p043ReplayMatching(state: P043MatchingState): P043MatchingState {
  return freeze({ ...p043InitialMatching(), replay: state.replay + 1 });
}
