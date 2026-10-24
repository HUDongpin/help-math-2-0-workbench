import {P037_SOURCE_TERMS} from './generated/nms-l02-p037-terms-v1';
import {createMemoryOnlyLessonHost,type LessonHostRequest,type LessonHostDecision} from './lesson-host-contract';
import {P037_ID,p037OpenTerm,type P037State} from './nms-l02-p037-state-v1';
export type P037SourceTerm=typeof P037_SOURCE_TERMS[number];
export function p037SourceTerm(id:string){return P037_SOURCE_TERMS.find(t=>t.id===id);}
export function createP037TermHost(){
 const host=createMemoryOnlyLessonHost({releaseId:'nms-l02-p037-source-terms-v1',releaseMemberIds:[P037_ID],currentAnimationId:P037_ID,enabledCapabilities:['keyterm'],mode:'audit',releasePublished:false});
 return {snapshot:()=>host.snapshot(),dispatch(request:LessonHostRequest,state:P037State):LessonHostDecision {
  const blocked=():LessonHostDecision=>({status:'blocked',code:'invalid-request',reason:'Exact readable source term required.',state:host.snapshot()});
  if(request.type==='close-keyterm')return host.dispatch(request);
  if(request.type!=='open-keyterm'||request.sourceAnimationId!==P037_ID||request.playbackDisposition!=='source-stop-timeline-and-audio-until-explicit-resume')return blocked();
  const term=p037SourceTerm(request.entryId);if(!term||p037OpenTerm(state,term.id)===state)return blocked();
  return host.dispatch(request);
 }};
}
