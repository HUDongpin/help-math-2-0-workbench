import {P036_SOURCE_TERMS} from './generated/nms-l02-p036-terms-v1';
import {createMemoryOnlyLessonHost,type LessonHostRequest,type LessonHostDecision} from './lesson-host-contract';
import {P036_ID,p036OpenTerm,type P036SessionState} from './nms-l02-p036-state-v1';
export type P036SourceTerm=typeof P036_SOURCE_TERMS[number];
export function p036SourceTerm(id:string){return P036_SOURCE_TERMS.find(t=>t.id===id);}
export function createP036TermHost(){
 const host=createMemoryOnlyLessonHost({releaseId:'nms-l02-p036-source-terms-v1',releaseMemberIds:[P036_ID],currentAnimationId:P036_ID,enabledCapabilities:['keyterm'],mode:'audit',releasePublished:false});
 return {snapshot:()=>host.snapshot(),dispatch(request:LessonHostRequest,state:P036SessionState):LessonHostDecision {
  const blocked=():LessonHostDecision=>({status:'blocked',code:'invalid-request',reason:'Exact readable source term required.',state:host.snapshot()});
  if(request.type==='close-keyterm')return host.dispatch(request);
  if(request.type!=='open-keyterm'||request.sourceAnimationId!==P036_ID||request.playbackDisposition!=='source-stop-timeline-and-audio-until-explicit-resume')return blocked();
  const term=p036SourceTerm(request.entryId);if(!term||p036OpenTerm(state,term.id)===state)return blocked();
  return host.dispatch(request);
 }};
}
