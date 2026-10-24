import {P035_SOURCE_TERMS} from './generated/nms-l02-p035-terms-v1';
import {createMemoryOnlyLessonHost,type LessonHostRequest,type LessonHostDecision} from './lesson-host-contract';
import {P035_ID,p035OpenTerm,type P035SessionState} from './nms-l02-p035-state-v1';
export type P035SourceTerm=typeof P035_SOURCE_TERMS[number];
export function p035SourceTerm(id:string){return P035_SOURCE_TERMS.find(t=>t.id===id);}
export function createP035TermHost(){
 const host=createMemoryOnlyLessonHost({releaseId:'nms-l02-p035-source-terms-v1',releaseMemberIds:[P035_ID],currentAnimationId:P035_ID,enabledCapabilities:['keyterm'],mode:'audit',releasePublished:false});
 return {snapshot:()=>host.snapshot(),dispatch(request:LessonHostRequest,state:P035SessionState):LessonHostDecision {
  const blocked=():LessonHostDecision=>({status:'blocked',code:'invalid-request',reason:'Exact readable source term required.',state:host.snapshot()});
  if(request.type==='close-keyterm')return host.dispatch(request);
  if(request.type!=='open-keyterm'||request.sourceAnimationId!==P035_ID||request.playbackDisposition!=='source-stop-timeline-and-audio-until-explicit-resume')return blocked();
  const term=p035SourceTerm(request.entryId);if(!term||p035OpenTerm(state,term.id)===state)return blocked();
  return host.dispatch(request);
 }};
}
