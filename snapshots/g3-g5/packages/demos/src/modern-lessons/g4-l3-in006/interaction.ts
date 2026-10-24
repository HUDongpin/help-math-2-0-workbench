import type {AnimationRendererProps} from '../../contract';
import type {LessonTextActivitySnapshot} from '../../lesson-text-contract';
import {
  createCourseG04L03In006NumberLineJumpState as create,
  reduceCourseG04L03In006NumberLineJumpInteraction as reduce,
  type CourseG04L03In006NumberLineJumpState as JumpState,
  type CourseG04L03In006NumberLineJumpAction as JumpAction,
} from '../../timelines/course-g04-l03-in-006-number-line-jump-interaction';
export {create,reduce};
export type {JumpState,JumpAction};
export const QUIZ_FRAME=1054;
export const DOMAIN='sprite-151';
export const CORRECT_ACTIVITY='in006-complete-feedback';
export const CORRECT_INSTANCE='root/animation/Correct_FB';
export interface InteractionSession {readonly jump:JumpState;readonly wrongSequence:number;readonly generation:number;}
export const createSession=(seed=0):InteractionSession=>({jump:create(seed),wrongSequence:0,generation:0});
export interface ActionPlan {readonly before:InteractionSession;readonly next:InteractionSession;readonly activities:readonly string[];readonly awaitsCompletion:boolean;}
const USER_ACTIONS=new Set(['place','invalid-drop','reverse-last','close-wrong','clear','new-number']);
/** Retain the existing modern interaction policies; add source child requests.
 * Wrong branch selection cycles from the seed and is deliberately NOT AVM1 random parity.
 * Clear cancels this session's pending completion ticket, not source sibling playback.
 */
export function planAction(session:InteractionSession,action:JumpAction,interactive:boolean):ActionPlan|null {
  if(!interactive||!USER_ACTIONS.has(action.type))return null;
  const next=reduce(session.jump,action);
  if(next===session.jump)return null;
  const reset=action.type==='clear'||action.type==='new-number';
  const activities:string[]=[];
  let wrongSequence=session.wrongSequence;
  if(next.outcome==='wrong'&&session.jump.outcome!=='wrong') {
    activities.push(`in006-wrong-s${(session.jump.seed+wrongSequence)%4+1}`);
    wrongSequence++;
  } else if(action.type==='place'&&next.jumps.length>session.jump.jumps.length) {
    if(next.outcome==='correct-feedback')activities.push(CORRECT_ACTIVITY);
    activities.push('in006-correct-coach');
  } else if(action.type==='reverse-last'&&next.outcome==='correct-feedback') {
    activities.push(CORRECT_ACTIVITY,'in006-correct-coach');
  }
  return {before:session,next:{jump:next,wrongSequence,generation:session.generation+(reset?1:0)},activities,
    awaitsCompletion:next.outcome==='correct-feedback'&&session.jump.outcome!=='correct-feedback'};
}
/** A single existing host batch admits every sibling, or the reducer is not committed. */
export function admitPlan(plan:ActionPlan,runtime:Pick<AnimationRendererProps,'onLessonActivitiesRequest'>):InteractionSession|null {
  if(plan.activities.length&&!runtime.onLessonActivitiesRequest?.(plan.activities.map(id=>({id,parentFrame:QUIZ_FRAME}))))return null;
  return plan.next;
}
export interface CompletionTicket {readonly generation:number;readonly revisionFloor:number;readonly revision:number|null;readonly handled:boolean;}
export function newCompletionTicket(session:InteractionSession,activities:readonly LessonTextActivitySnapshot[]):CompletionTicket {
  return {generation:session.generation,revisionFloor:Math.max(0,...activities.map(a=>a.revision)),revision:null,handled:false};
}
export function observeCompletion(ticket:CompletionTicket,session:InteractionSession,activities:readonly LessonTextActivitySnapshot[]) {
  const activity=activities.find(a=>a.id===CORRECT_ACTIVITY);
  if(ticket.handled||ticket.generation!==session.generation||session.jump.outcome!=='correct-feedback'||!activity
    ||activity.sourceInstanceId!==CORRECT_INSTANCE||activity.frameDomain!=='sprite-150'
    ||!Number.isSafeInteger(activity.revision)||activity.revision<=ticket.revisionFloor
    ||(ticket.revision!==null&&activity.revision!==ticket.revision)||activity.frame<2||activity.frame>25)return {ticket,completed:false};
  return {ticket:{...ticket,revision:activity.revision},completed:activity.status==='completed'&&activity.frame===25};
}
export const completeSession=(session:InteractionSession):InteractionSession=>({...session,jump:reduce(session.jump,{type:'feedback-complete'})});
export function sessionIdentity(props:Pick<AnimationRendererProps,'seed'|'replay'|'lang'|'uiLanguage'|'scenario'|'frameDomain'|'entryStateSha256'>) {
  return JSON.stringify([props.seed,props.replay??0,props.lang,props.uiLanguage??props.lang,props.scenario,props.frameDomain??DOMAIN,props.entryStateSha256??null]);
}
