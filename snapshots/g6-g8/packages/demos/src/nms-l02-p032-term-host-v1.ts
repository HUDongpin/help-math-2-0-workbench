import {P032_SOURCE_TERMS} from './generated/nms-l02-p032-terms-v1';
import {createMemoryOnlyLessonHost,type LessonHostRequest,type LessonHostDecision} from './lesson-host-contract';
import {p032CanOpenTerm,P032_ID,type P032FrameState} from './nms-l02-p032-timeline-v1';
export type P032SourceTerm=typeof P032_SOURCE_TERMS[number];
export function p032SourceTerm(id:string):P032SourceTerm|undefined{return P032_SOURCE_TERMS.find(term=>term.id===id);}
export function createP032TermHost(){
  const host=createMemoryOnlyLessonHost({releaseId:'nms-l02-p032-source-terms-v1',releaseMemberIds:[P032_ID],currentAnimationId:P032_ID,enabledCapabilities:['keyterm'],mode:'audit',releasePublished:false});
  return {
    snapshot:()=>host.snapshot(),
    dispatch(request:LessonHostRequest,state:P032FrameState):LessonHostDecision {
      const blocked=():LessonHostDecision=>({status:'blocked',code:'invalid-request',reason:'The request must match a visible source term on this page.',state:host.snapshot()});
      if(state.animationId!==P032_ID||state.frameDomain!=='sprite-176')return blocked();
      if(request.type==='close-keyterm')return host.dispatch(request);
      if(request.type!=='open-keyterm'||request.sourceAnimationId!==P032_ID||request.playbackDisposition!=='source-stop-timeline-and-audio-until-explicit-resume'||!p032SourceTerm(request.entryId)||!p032CanOpenTerm(state,request.entryId))return blocked();
      return host.dispatch(request);
    },
  };
}
