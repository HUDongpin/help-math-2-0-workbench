import {P034_SOURCE_TERMS} from './generated/nms-l02-p034-terms-v1';
import {createMemoryOnlyLessonHost,type LessonHostRequest,type LessonHostDecision} from './lesson-host-contract';
import {P034_ID,p034OpenTerm,type P034SessionState} from './nms-l02-p034-state-v1';
export type P034SourceTerm=typeof P034_SOURCE_TERMS[number];
export function p034SourceTerm(id:string){return P034_SOURCE_TERMS.find(t=>t.id===id);}
export function createP034TermHost(){
 const host=createMemoryOnlyLessonHost({releaseId:'nms-l02-p034-source-terms-v1',releaseMemberIds:[P034_ID],currentAnimationId:P034_ID,enabledCapabilities:['keyterm'],mode:'audit',releasePublished:false});
 return {snapshot:()=>host.snapshot(),dispatch(request:LessonHostRequest,state:P034SessionState):LessonHostDecision {
  const blocked=():LessonHostDecision=>({status:'blocked',code:'invalid-request',reason:'Exact readable source Decimal term required.',state:host.snapshot()});
  if(request.type==='close-keyterm')return host.dispatch(request);
  if(request.type!=='open-keyterm'||request.sourceAnimationId!==P034_ID||request.entryId!=='decimal'||request.playbackDisposition!=='source-stop-timeline-and-audio-until-explicit-resume'||p034OpenTerm(state)===state)return blocked();
  return host.dispatch(request);
 }};
}
