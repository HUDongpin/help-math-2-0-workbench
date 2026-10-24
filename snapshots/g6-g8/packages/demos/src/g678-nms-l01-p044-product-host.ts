/** Pure, exact-page practice-feedback adapter. It never dispatches or commits a controller state. */
import {P044_CONFIG, reduceP044, type P044State, type P044Transition} from './g678-nms-l01-p044-controller';
import type {LessonHostDecision,LessonHostRequest,LessonHostState} from './lesson-host-contract';

export type P044FeedbackRequest = Extract<LessonHostRequest,{type:'record-practice-feedback'}>;
export type P044FeedbackReset = Extract<LessonHostRequest,{type:'reset-practice-feedback'}> & Readonly<{interactionId:string}>;
export type P044FeedbackPayload = NonNullable<LessonHostState['practiceFeedback']>;
const ID='shared-nms002-l01-p044';
const SAFE_ID=/^[A-Za-z0-9][A-Za-z0-9._:-]{0,255}$/;
const OWNED_ID=/^shared-nms002-l01-p044:e(0|[1-9][0-9]*):attempt-([12])$/;
const record=(value:unknown):value is Record<string,unknown>=>Boolean(value)&&typeof value==='object'&&!Array.isArray(value);
const integer=(value:unknown):value is number=>Number.isSafeInteger(value)&&Number(value)>=0;
const keys=(value:Record<string,unknown>,expected:readonly string[])=>Object.keys(value).length===expected.length&&Object.keys(value).every(key=>expected.includes(key));
function equal(a:unknown,b:unknown):boolean {
  if(a===b)return true;
  if(Array.isArray(a)||Array.isArray(b))return Array.isArray(a)&&Array.isArray(b)&&a.length===b.length&&a.every((value,i)=>equal(value,b[i]));
  return record(a)&&record(b)&&keys(a,Object.keys(b))&&Object.keys(a).every(key=>equal(a[key],b[key]));
}
function interaction(epoch:number,attempt:number):string|null {
  return integer(epoch)&&[1,2].includes(attempt)?`${ID}:e${epoch}:attempt-${attempt}`:null;
}
function ownedId(id:unknown):id is string {
  if(typeof id!=='string')return false;const match=OWNED_ID.exec(id);return Boolean(match&&integer(Number(match[1])));
}
function payload(value:unknown):P044FeedbackPayload|null {
  if(!record(value))return null;
  const isRequest=value.type==='record-practice-feedback';
  if(!keys(value,[...(isRequest?['type']:[]),'interactionId','outcome','branchIndex','branchCount'])||!ownedId(value.interactionId)||
    !integer(value.branchIndex)||value.branchIndex<1||
    !((value.outcome==='correct'&&value.branchCount===4)||(value.outcome==='incorrect'&&value.branchCount===3))||value.branchIndex>Number(value.branchCount))return null;
  return Object.freeze({interactionId:value.interactionId,outcome:value.outcome as 'correct'|'incorrect',branchIndex:value.branchIndex,branchCount:Number(value.branchCount)});
}
function activePayload(state:P044State):P044FeedbackPayload|null {
  const feedback=P044_CONFIG.feedback.find(item=>item.name===state.activeFeedback),answer=P044_CONFIG.answers.find(item=>item.instanceName===state.selectedAnswer);
  if(state.phase!=='feedback'||state.mainFrame!==737||!feedback||!answer||feedback.kind!==answer.outcome)return null;
  const variants=P044_CONFIG.feedback.filter(item=>item.kind===feedback.kind),id=interaction(state.epoch,state.selections.right+state.selections.wrong);
  if(!id)return null;
  return Object.freeze({interactionId:id,outcome:feedback.kind==='right'?'correct':'incorrect',branchIndex:variants.findIndex(item=>item.name===feedback.name)+1,branchCount:variants.length});
}
/** A null result means no valid record request. An adapter MUST reject a feedback-bearing
 * transition if this is null; it must not treat null as permission to commit locally. */
export function p044FeedbackRequest(before:P044State,transition:P044Transition):P044FeedbackRequest|null {
  try {
    if(!transition.accepted||before.phase!=='quiz'||before.mainFrame!==737||!transition.state.selectedAnswer)return null;
    const expected=reduceP044(before,{type:'choose-answer',epoch:before.epoch,instanceName:transition.state.selectedAnswer,input:'mouse'});
    if(!expected.accepted||!equal(expected,transition))return null;
    const feedback=activePayload(transition.state);if(!feedback)return null;
    return Object.freeze({type:'record-practice-feedback',...feedback});
  }catch{return null;}
}
function validHostState(value:unknown):value is LessonHostState {
  if(!record(value)||!keys(value,['releaseId','storage','storesPersonalData','currentAnimationId','language','glossaryEntryId','keytermEntryId',
    'calculatorOpen','activeAudioCueId','fqScore','practiceFeedback'])||value.currentAnimationId!==ID||value.storage!=='memory-only'||value.storesPersonalData!==false||
    typeof value.releaseId!=='string'||!SAFE_ID.test(value.releaseId)||(value.language!=='en'&&value.language!=='es')||typeof value.calculatorOpen!=='boolean')return false;
  for(const key of ['glossaryEntryId','keytermEntryId','activeAudioCueId'])if(value[key]!==null&&(typeof value[key]!=='string'||!SAFE_ID.test(value[key] as string)))return false;
  const score=value.fqScore;
  if(!record(score)||!keys(score,['attempted','correct','pointsAwarded','pointsPossible','scoredQuestionIds'])||
    ![score.attempted,score.correct,score.pointsAwarded,score.pointsPossible].every(integer)||Number(score.correct)>Number(score.attempted)||
    Number(score.pointsAwarded)>Number(score.pointsPossible)||!Array.isArray(score.scoredQuestionIds)||
    score.scoredQuestionIds.some(id=>typeof id!=='string'||!SAFE_ID.test(id))||new Set(score.scoredQuestionIds).size!==score.scoredQuestionIds.length||
    score.scoredQuestionIds.length!==score.attempted)return false;
  return value.practiceFeedback===null||payload(value.practiceFeedback)!==null;
}
/** Validate every field of the expected aggregate response, including exact page,
 * capability and audit/memory/no-personal-data boundary. Not a cryptographic receipt. */
export function p044HostMatches(decision:LessonHostDecision|unknown,expectedFeedback:P044FeedbackPayload|P044FeedbackRequest|null):boolean {
  if(!record(decision)||!keys(decision,['status','capability','auditOnly','state'])||decision.status!=='allowed'||
    decision.capability!=='practice-feedback'||decision.auditOnly!==true||!validHostState(decision.state))return false;
  return p044HostSnapshotMatches(decision.state,expectedFeedback);
}
/** Distinguishes a safe empty init/Replay snapshot from invalid state; null reset
 * request alone is not proof that the host is ready. */
export function p044HostSnapshotMatches(hostState:LessonHostState|unknown,expectedFeedback:P044FeedbackPayload|P044FeedbackRequest|null):boolean {
  if(!validHostState(hostState))return false;
  if(expectedFeedback===null)return hostState.practiceFeedback===null;
  const expected=payload(expectedFeedback);return expected!==null&&equal(hostState.practiceFeedback,expected);
}
/** Only an actual source feedback terminal can prepare this active-interaction reset. */
export function p044FeedbackResetRequest(before:P044State,transition:P044Transition,activeFeedback:P044FeedbackPayload|P044FeedbackRequest|null):P044FeedbackReset|null {
  try {
    const expectedFeedback=activePayload(before),actual=payload(activeFeedback);
    if(!expectedFeedback||!actual||!equal(expectedFeedback,actual)||!transition.accepted)return null;
    const feedback=P044_CONFIG.feedback.find(item=>item.name===before.activeFeedback)!;
    const expected=reduceP044(before,{type:'nested-frame',epoch:before.epoch,clockToken:before.clockToken,sourceObjectId:feedback.sourceObjectId,frame:feedback.terminalFrame});
    if(!expected.accepted||!equal(expected,transition))return null;
    return Object.freeze({type:'reset-practice-feedback',interactionId:actual.interactionId});
  }catch{return null;}
}
/** Init/Replay cleanup can address only a validated p044-owned active interaction.
 * No request is needed when empty. Never emit an unscoped or cross-page reset. */
export function p044OwnedFeedbackResetRequest(hostState:LessonHostState|unknown,activeInteractionId?:string):P044FeedbackReset|null {
  if(!validHostState(hostState)||hostState.practiceFeedback===null)return null;
  const active=hostState.practiceFeedback;
  if(activeInteractionId!==undefined&&activeInteractionId!==active.interactionId)return null;
  return Object.freeze({type:'reset-practice-feedback',interactionId:active.interactionId});
}
