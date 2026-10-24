import type {AnimationRendererProps} from '../contract';
import type {LessonTextActivityCancellation} from '../lesson-text-contract';
import {G4L9_IN004_EXPRESSIONS} from './g4-l9-in004-state';
import {bindIn004BalanceChildren,dispatchIn004Balance,in004BalanceOwnedActivities,synchronizeIn004Balance,type In004BalanceSession} from './g4-l9-in004-host-state';
export const in004Activities=(r:AnimationRendererProps)=>r.lessonActivities??(r.lessonActivity?[r.lessonActivity]:[]);
export const isIn004Terminal=(r:AnimationRendererProps)=>r.lang==='en'&&r.scenario==='source-static-frame'&&!r.entryStateSha256&&(r.frameDomain??'sprite-405')==='sprite-405'&&(r.rootFrame??6)===6&&r.frame===695;
export function syncIn004Terminal(s:In004BalanceSession,r:AnimationRendererProps){return bindIn004BalanceChildren(synchronizeIn004Balance(s,r,in004Activities(r)),in004Activities(r));}
export function in004TerminalLocked(s:In004BalanceSession,r:AnimationRendererProps){return !isIn004Terminal(r)||!!r.paused||!r.onLessonActivityRequest||!r.onLessonActivitiesRequest||!r.onLessonActivityCancel||s.children.some(c=>c.revision===null);}
/** Same deterministic LCG convention used by the existing G4 L4 state lane.
 * The source pool and explicit draw event are retained; Flash RNG parity is not claimed. */
export function nextIn004Expression(random:number){const next=(Math.imul(random>>>0,1664525)+1013904223)>>>0;return{random:next,index:Math.floor(next/4294967296*G4L9_IN004_EXPRESSIONS.length)};}
export function in004FeedbackFrame(s:In004BalanceSession,r:AnimationRendererProps){if(s.state.activeFeedback===null)return 1;const a=in004BalanceOwnedActivities(s,in004Activities(r)).find(a=>a.id==='g4l9-in004-feedback');return !a||a.status==='completed'&&a.frame===25?1:a.frame;}
/** Consume the authored frame25 action before retiring its exact host token.
 * Detaching the consumed feedback child prevents its cancellation from resetting
 * the still-owned scale, source expression and equation history on the next render. */
export function finishIn004TerminalFeedback(s:In004BalanceSession,r:AnimationRendererProps):{session:In004BalanceSession;retire:LessonTextActivityCancellation|null}{
 const next=dispatchIn004Balance(s,{type:'finish-feedback'},r);if(next===s)return{session:s,retire:null};const own=in004BalanceOwnedActivities(s,in004Activities(r)).find(a=>a.id==='g4l9-in004-feedback');if(!own?.cancellationToken)throw new Error('Completed owned feedback token required');
 return{session:{...next,children:next.children.filter(c=>c.id!=='g4l9-in004-feedback')},retire:{id:own.id,sourceInstanceId:own.sourceInstanceId,revision:own.revision,cancellationToken:own.cancellationToken,parentFrame:695}};
}
