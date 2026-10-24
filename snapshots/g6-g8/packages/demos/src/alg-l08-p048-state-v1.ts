import {ALG_L08_P048_SOURCE as S,type P048Term} from './alg-l08-p048-source-v1';
const B=S.behavior;
export {S as ALG_L08_P048_SOURCE};
export type {P048Term};
export type P048Choice='A'|'B'|'C'|'D';
import {
  createFunctionWalkthroughReducer,
  type WalkthroughState, type WalkthroughEvent, type WalkthroughTransition,
} from './g678-advanced-manual/source-function-walkthrough-state-v1';

export {B as ALG_L08_P048_BEHAVIOR};
export interface P048State extends Omit<WalkthroughState, 'phase'> {
  readonly phase: Exclude<WalkthroughState['phase'], 'engineering-end-held'> | 'source-end-held';
  readonly replay: number;
}
export type P048Event = WalkthroughEvent;
export interface P048Transition extends Omit<WalkthroughTransition, 'state'> {
  readonly state: P048State;
}
const base = createFunctionWalkthroughReducer(B);
export const p048InitialState = (epoch = 0, replay = 0): P048State => ({
  ...base.initialState(epoch), phase: 'main', replay,
});
export const p048Playing = (s: P048State) =>
  s.mainPlaying || !!s.stepBox?.playing || !!s.feedback?.playing;

/** L8 has an authored stop at823, popup-owned Close button291, and helper248's
 * unreachable frame21. Keep the frozen shared mechanism, bind page semantics here.
 * Deterministic feedback selection and native Continue remain modern adapters. */
export function p048Reduce(s: P048State, e: P048Event, seed = 0): P048Transition {
  const reject = (reason: string): P048Transition => ({accepted: false, reason, state: s, cleanup: []});
  if (e.epoch !== s.epoch || s.phase === 'left') return reject('stale or left P048 page');
  if (e.type === 'continue-step' && s.stepBox && !(s.stepBox.frame === 1 && s.stepBox.sourceStopped))
    return reject('enlarged step owns controls until Close resets frame1');
  if (e.type === 'glossary' && !p048Glossary(s).some(g => g.ownerSpriteId === e.ownerSpriteId && g.buttonId === e.buttonId))
    return reject('glossary owner is not the visible foreground scope');
  const mapped: WalkthroughState = {...s, phase: s.phase === 'source-end-held' ? 'engineering-end-held' : s.phase};
  const event: WalkthroughEvent = e.type === 'play' && s.phase === 'step-held' &&
    !s.quizSection && s.stepBox?.frame === 1 ? {type: 'continue-step', epoch: s.epoch} : e;
  const r = base.reduce(mapped, event, seed);
  if (!r.accepted) return {...r, state: s};
  const atSourceStop = r.state.phase === 'engineering-end-held';
  return {
    ...r,
    reason: atSourceStop && e.type === 'advance-main' ? 'authored main823 stop; no lesson completion signal' : r.reason,
    state: {...r.state, phase: atSourceStop ? 'source-end-held' : r.state.phase,
      // Keep modern host feedback history across page Replay; teaching/media state still resets.
      selectionSerial: e.type === 'replay' ? s.selectionSerial : r.state.selectionSerial,
      replay: s.replay + (e.type === 'replay' ? 1 : 0)},
  };
}

/** Source13 opens selected popup316; its child291 hides the owning popup.
 * No automatic ordinary wrap is introduced. The case-only angle popup is preserved as an unresolved source anomaly. */
export const p048HelpSurface = (s: P048State) => ({
  popupSpriteId: 316 as const, popupVisible: s.helpVisible,
  popupCloseButtonId: 291 as const, popupCloseButtonVisible: s.helpVisible,
  caseOnlyAlternativeSpriteId: 331 as const, caseOnlyAlternativeSelected: false as const,
});

export function p048Glossary(s: P048State) {
  const owner = s.helpVisible ? 316 : s.stepBox && !(s.stepBox.frame === 1 && s.stepBox.sourceStopped) ? s.stepBox.spriteId : 332;
  const frame = owner === 332 ? s.mainFrame : owner === 316 ? 1 : s.stepBox!.frame;
  const entries = B.glossary.filter(g => g.ownerSpriteId === owner && frame >= g.firstFrame && frame <= g.lastFrame);
  if (owner === 332 && s.stepBox?.frame === 1)
    entries.push(...B.glossary.filter(g => g.ownerSpriteId === s.stepBox!.spriteId && g.firstFrame <= 1));
  return entries.map(g=>({...g,term:S.terms.find(t=>t.sourceKeyAttribute.toLowerCase()===g.key.toLowerCase())!.sourceKeyAttribute}));
}
