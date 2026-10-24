import {P037_GAME_SOURCE as SOURCE} from './generated/nms-l02-p037-state-source-v1';

export const P037_ID = SOURCE.animationId;
export type P037TermId = 'column' | 'equivalent-decimal' | 'simple-simpler-simplest' | 'decimal-equivalent' | 'fraction';
export interface P037State {
  readonly seed: number;
  readonly replay: number;
  readonly mainFrame: number;
  readonly mainPlaying: boolean;
  readonly coachFrame: number | null;
  readonly coachPlaying: boolean;
  readonly successFrame: number | null;
  readonly successPlaying: boolean;
  readonly popupFrame: number | null;
  readonly popupPlaying: boolean;
  readonly popupVisible: boolean;
  readonly sourcesEnabled: boolean;
  readonly quizSection: boolean;
  readonly matchedMask: number;
  readonly selectedCard: number | null;
  readonly term: P037TermId | null;
}
type MutableState = {-readonly [K in keyof P037State]: P037State[K]};
const seal = (s: MutableState): P037State => Object.freeze(s);
const mainTerms: readonly P037TermId[] = ['column', 'equivalent-decimal'];
const popupTerms: readonly P037TermId[] = ['simple-simpler-simplest', 'decimal-equivalent', 'fraction'];
function card(id: number) {
  const c = SOURCE.cards.find(c => c.id === id);
  if (!c) throw Error('P037_CARD_ID');
  return c;
}
export function p037Initial(seed = 0, replay = 0): P037State {
  if (!Number.isSafeInteger(seed) || seed < 0 || seed > 0xffffffff
    || !Number.isSafeInteger(replay) || replay < 0) throw Error('P037_STATE_IDENTITY');
  return seal({seed, replay, mainFrame: 1, mainPlaying: true, coachFrame: null, coachPlaying: false,
    successFrame: null, successPlaying: false, popupFrame: null, popupPlaying: false, popupVisible: false,
    sourcesEnabled: false, quizSection: false, matchedMask: 0, selectedCard: null, term: null});
}
export function p037Matched(s: P037State, id: number) {card(id); return (s.matchedMask & (1 << (id - 1))) !== 0;}
export function p037MatchedCount(s: P037State) {
  let bits = s.matchedMask, count = 0;
  while (bits) {bits &= bits - 1; count++;}
  return count;
}
export function p037CanDrop(s: P037State, id: number) {
  card(id);
  return s.mainFrame === SOURCE.practiceFrame && s.sourcesEnabled && s.term === null && !p037Matched(s, id);
}
export function p037Choose(s: P037State, id: number): P037State {
  return p037CanDrop(s, id) && s.selectedCard !== id ? seal({...s, selectedCard: id}) : s;
}
export function p037CancelSelection(s: P037State): P037State {
  return s.selectedCard === null ? s : seal({...s, selectedCard: null});
}
export function p037Drop(s: P037State, id: number, targetId: number | null): P037State {
  const c = card(id);
  if (targetId !== null && !SOURCE.targets.some(t => t.id === targetId)) throw Error('P037_TARGET_ID');
  if (!p037CanDrop(s, id)) return s;
  if (c.targetId !== null && c.targetId === targetId) {
    return seal({...s, matchedMask: s.matchedMask | (1 << (id - 1)), selectedCard: null,
      sourcesEnabled: false, coachFrame: SOURCE.coach.entry, coachPlaying: true});
  }
  return seal({...s, selectedCard: null, sourcesEnabled: false,
    popupFrame: SOURCE.popup.entry, popupPlaying: true, popupVisible: true});
}
/** The source Close action hides/unlocks; it does not stop the child timeline.
 * Global transport pause, Replay and unmount are separate cancellation paths. */
export function p037ClosePopup(s: P037State): P037State {
  return s.popupVisible && s.term === null
    ? seal({...s, popupVisible: false, sourcesEnabled: true, selectedCard: null}) : s;
}
export function p037OpenTerm(s: P037State, term: P037TermId): P037State {
  if (![...mainTerms, ...popupTerms].includes(term)) throw Error('P037_TERM_ID');
  if (s.term !== null || (!mainTerms.includes(term) && !s.popupVisible)) return s;
  return seal({...s, term, selectedCard: null});
}
export function p037CloseTerm(s: P037State): P037State {
  return s.term === null ? s : seal({...s, term: null});
}
export function p037Advancing(s: P037State) {
  return s.term === null && (s.mainPlaying || s.coachPlaying || s.successPlaying || s.popupPlaying);
}
export function p037Phase(s: P037State) {
  if (s.mainFrame === SOURCE.mainFrames && !s.mainPlaying) return 'completed';
  if (s.mainFrame < SOURCE.practiceFrame) return 'intro';
  if (s.mainFrame > SOURCE.practiceFrame || s.mainPlaying) return 'outro';
  if (s.popupVisible) return 'wrong';
  if (s.successPlaying) return 'success';
  if (s.coachPlaying && s.coachFrame !== SOURCE.coach.actionFrame) return 'coach';
  return 'exercise';
}
/** One global source frame. Newly started children do not consume their next
 * frame in the same tick; frame443 removal precedes any old child callbacks. */
export function p037Tick(s: P037State): P037State {
  if (!p037Advancing(s)) return s;
  const n: MutableState = {...s};
  if (s.mainPlaying) {
    n.mainFrame++;
    if (n.mainFrame === SOURCE.practiceFrame) {
      n.mainPlaying = false; n.quizSection = true; n.matchedMask = 0; n.sourcesEnabled = true;
      n.coachFrame = 1; n.coachPlaying = false; n.successFrame = 1; n.successPlaying = false;
      n.popupFrame = 1; n.popupPlaying = false; n.popupVisible = false; n.selectedCard = null;
    } else if (n.mainFrame === SOURCE.removalFrame) {
      n.sourcesEnabled = false; n.selectedCard = null;
      n.coachFrame = null; n.coachPlaying = false; n.successFrame = null; n.successPlaying = false;
      n.popupFrame = null; n.popupPlaying = false; n.popupVisible = false;
    } else if (n.mainFrame === SOURCE.mainFrames) n.mainPlaying = false;
  }
  if (s.coachPlaying && n.coachFrame !== null) {
    if (s.coachFrame === SOURCE.coach.actionFrame) {n.coachFrame = SOURCE.coach.wrapFrame; n.coachPlaying = false;}
    else {
      n.coachFrame = s.coachFrame! + 1;
      if (n.coachFrame === SOURCE.coach.actionFrame) {
        n.sourcesEnabled = true;
        if (p037MatchedCount(n) >= SOURCE.targets.length) {
          n.successFrame = SOURCE.success.entry; n.successPlaying = true;
        }
      }
    }
  }
  if (s.successPlaying && n.successFrame !== null) {
    n.successFrame = s.successFrame! + 1;
    if (n.successFrame === SOURCE.success.actionFrame) {
      n.quizSection = false; n.mainPlaying = true;
      n.successFrame = SOURCE.success.resetFrame; n.successPlaying = false;
    }
  }
  if (s.popupPlaying && n.popupFrame !== null) {
    n.popupFrame = s.popupFrame! + 1;
    if (n.popupFrame === SOURCE.popup.stopFrame) n.popupPlaying = false;
  }
  return seal(n);
}
export function p037Advance(s: P037State, frames: number): P037State {
  if (!Number.isSafeInteger(frames) || frames < 0 || frames > 10000) throw Error('P037_ADVANCE');
  for (let i = 0; i < frames; i++) {const next = p037Tick(s); if (next === s) break; s = next;}
  return s;
}
export function p037Replay(s: P037State): P037State {return p037Initial(s.seed, s.replay + 1);}
