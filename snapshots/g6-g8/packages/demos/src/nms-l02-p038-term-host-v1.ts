import {P038_SOURCE_TERMS} from './generated/nms-l02-p038-terms-v1';
import {createMemoryOnlyLessonHost,type LessonHostRequest,type LessonHostDecision} from './lesson-host-contract';
import {P038_ID,p038OpenTerm,type P038SessionState} from './nms-l02-p038-state-v1';
export type P038SourceTerm=typeof P038_SOURCE_TERMS[number];
export function p038SourceTerm(id:string){return P038_SOURCE_TERMS.find(t=>t.id===id);}
export function createP038TermHost(){
 const host=createMemoryOnlyLessonHost({releaseId:'nms-l02-p038-source-terms-v1',releaseMemberIds:[P038_ID],currentAnimationId:P038_ID,enabledCapabilities:['keyterm'],mode:'audit',releasePublished:false});
 return {snapshot:()=>host.snapshot(),dispatch(request:LessonHostRequest,state:P038SessionState):LessonHostDecision {
  const blocked=():LessonHostDecision=>({status:'blocked',code:'invalid-request',reason:'Exact readable source term required.',state:host.snapshot()});
  if(request.type==='close-keyterm')return host.dispatch(request);
  if(request.type!=='open-keyterm'||request.sourceAnimationId!==P038_ID||request.playbackDisposition!=='source-stop-timeline-and-audio-until-explicit-resume')return blocked();
  const term=p038SourceTerm(request.entryId);if(!term||p038OpenTerm(state,term.id)===state)return blocked();
  return host.dispatch(request);
 }};
}
