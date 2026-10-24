import {ALG_L08_P046_SOURCE as S,type P046Term} from './alg-l08-p046-source-v2';
const B=S.behavior;
export {S as ALG_L08_P046_SOURCE};
export type {P046Term};
export type P046Choice='A'|'B'|'C'|'D';
import {
  createFunctionWalkthroughReducer,
  type WalkthroughState, type WalkthroughEvent, type WalkthroughTransition,
} from './g678-advanced-manual/source-function-walkthrough-state-v1';

export {B as ALG_L08_P046_BEHAVIOR};
export interface P046State extends Omit<WalkthroughState, 'phase'> {
  readonly phase: Exclude<WalkthroughState['phase'], 'engineering-end-held'> | 'source-end-held';
  readonly replay: number;
}
export type P046Event = WalkthroughEvent;
export interface P046Transition extends Omit<WalkthroughTransition, 'state'> {
  readonly state: P046State;
}
const base = createFunctionWalkthroughReducer(B);
export const p046InitialState = (epoch = 0, replay = 0): P046State => ({
  ...base.initialState(epoch), phase: 'main', replay,
});
export const p046Playing = (s: P046State) =>
  s.mainPlaying || !!s.stepBox?.playing || !!s.feedback?.playing;

/** L8 has an authored stop at804, a separate main CloseBtn313, and helper138's
 * unreachable frame21. Keep the frozen shared mechanism, bind page semantics here.
 * Deterministic feedback selection and native Continue remain modern adapters. */
export function p046Reduce(s: P046State, e: P046Event, seed = 0): P046Transition {
  const reject = (reason: string): P046Transition => ({accepted: false, reason, state: s, cleanup: []});
  if (e.epoch !== s.epoch || s.phase === 'left') return reject('stale or left P046 page');
  if (e.type === 'continue-step' && s.stepBox && s.stepBox.frame !== 1)
    return reject('enlarged step owns controls until Close resets frame1');
  const mapped: WalkthroughState = {...s, phase: s.phase === 'source-end-held' ? 'engineering-end-held' : s.phase};
  const event: WalkthroughEvent = e.type === 'play' && s.phase === 'step-held' &&
    !s.quizSection && s.stepBox?.frame === 1 ? {type: 'continue-step', epoch: s.epoch} : e;
  const r = base.reduce(mapped, event, seed);
  if (!r.accepted) return {...r, state: s};
  const atSourceStop = r.state.phase === 'engineering-end-held';
  return {
    ...r,
    reason: atSourceStop && e.type === 'advance-main' ? 'authored main804 stop; no lesson completion signal' : r.reason,
    state: {...r.state, phase: atSourceStop ? 'source-end-held' : r.state.phase,
      // Keep modern host feedback history across page Replay; teaching/media state still resets.
      selectionSerial: e.type === 'replay' ? s.selectionSerial : r.state.selectionSerial,
      replay: s.replay + (e.type === 'replay' ? 1 : 0)},
  };
}

/** Source13 and source313 show/hide both the selected popup and main CloseBtn.
 * No automatic ordinary wrap and no child-popup Close are introduced. */
export const p046HelpSurface = (s: P046State) => ({
  popupSpriteId: 312 as const, popupVisible: s.helpVisible,
  mainCloseButtonId: 313 as const, mainCloseButtonVisible: s.helpVisible,
  caseOnlyAlternativeSpriteId: 328 as const, caseOnlyAlternativeSelected: false as const,
});

export function p046Glossary(s: P046State) {
  const owner = s.helpVisible ? 312 : s.stepBox && !(s.stepBox.frame === 1 && s.stepBox.sourceStopped) ? s.stepBox.spriteId : 329;
  const frame = owner === 329 ? s.mainFrame : owner === 312 ? 1 : s.stepBox!.frame;
  const entries = B.glossary.filter(g => g.ownerSpriteId === owner && frame >= g.firstFrame && frame <= g.lastFrame);
  if (owner === 329 && s.stepBox?.frame === 1)
    entries.push(...B.glossary.filter(g => g.ownerSpriteId === s.stepBox!.spriteId && g.firstFrame <= 1));
  return entries.map(g=>({...g,term:S.terms.find(t=>t.sourceKeyAttribute.toLowerCase()===g.key.toLowerCase())!.sourceKeyAttribute}));
}
