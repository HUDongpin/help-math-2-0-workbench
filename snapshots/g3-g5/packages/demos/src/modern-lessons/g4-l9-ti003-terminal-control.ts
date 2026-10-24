import type {AnimationRendererProps} from '../contract';
import type {LessonTextActivityCancellation} from '../lesson-text-contract';
import {G4L9_TI003_EXPRESSIONS} from './g4-l9-ti003-state';
import {bindTi003BalanceChildren,dispatchTi003Balance,ti003BalanceOwnedActivities,synchronizeTi003Balance,type Ti003BalanceSession} from './g4-l9-ti003-host-state';
export const ti003Activities=(r:AnimationRendererProps)=>r.lessonActivities??(r.lessonActivity?[r.lessonActivity]:[]);
export const isTi003Terminal=(r:AnimationRendererProps)=>r.lang==='en'&&r.scenario==='source-static-frame'&&!r.entryStateSha256&&(r.frameDomain??'sprite-502')==='sprite-502'&&(r.rootFrame??6)===6&&r.frame===658;
export function syncTi003Terminal(s:Ti003BalanceSession,r:AnimationRendererProps){return bindTi003BalanceChildren(synchronizeTi003Balance(s,r,ti003Activities(r)),ti003Activities(r));}
export function ti003TerminalLocked(s:Ti003BalanceSession,r:AnimationRendererProps){return !isTi003Terminal(r)||!!r.paused||!r.onLessonActivityRequest||!r.onLessonActivitiesRequest||!r.onLessonActivityCancel||s.children.some(c=>c.revision===null);}
/** Same deterministic LCG convention used by the existing G4 L4 state lane.
 * The source pool and explicit draw event are retained; Flash RNG parity is not claimed. */
export function nextTi003Expression(random:number){const next=(Math.imul(random>>>0,1664525)+1013904223)>>>0;return{random:next,index:Math.floor(next/4294967296*G4L9_TI003_EXPRESSIONS.length)};}
export function ti003FeedbackFrame(s:Ti003BalanceSession,r:AnimationRendererProps){if(s.state.activeFeedback===null)return 1;const a=ti003BalanceOwnedActivities(s,ti003Activities(r)).find(a=>a.id==='g4l9-ti003-feedback');return !a||a.status==='completed'&&a.frame===25?1:a.frame;}
/** Consume the authored frame25 action before retiring its exact host token.
 * Detaching the consumed feedback child prevents its cancellation from resetting
 * the still-owned scale, source expression and equation history on the next render. */
export function finishTi003TerminalFeedback(s:Ti003BalanceSession,r:AnimationRendererProps):{session:Ti003BalanceSession;retire:LessonTextActivityCancellation|null}{
 const next=dispatchTi003Balance(s,{type:'finish-feedback'},r);if(next===s)return{session:s,retire:null};const own=ti003BalanceOwnedActivities(s,ti003Activities(r)).find(a=>a.id==='g4l9-ti003-feedback');if(!own?.cancellationToken)throw new Error('Completed owned feedback token required');
 return{session:{...next,children:next.children.filter(c=>c.id!=='g4l9-ti003-feedback')},retire:{id:own.id,sourceInstanceId:own.sourceInstanceId,revision:own.revision,cancellationToken:own.cancellationToken,parentFrame:658}};
}
