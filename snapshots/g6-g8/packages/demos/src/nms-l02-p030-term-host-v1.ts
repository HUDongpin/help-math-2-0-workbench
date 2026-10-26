import {P030_SOURCE_TERMS} from './generated/nms-l02-p030-terms-v1';
import {createMemoryOnlyLessonHost,type LessonHostRequest,type LessonHostDecision} from './lesson-host-contract';
import {p030CanOpenTerm,P030_ID,type P030FrameState} from './nms-l02-p030-timeline-v1';
export type P030SourceTerm=typeof P030_SOURCE_TERMS[number];
export function p030SourceTerm(id:string):P030SourceTerm|undefined{return P030_SOURCE_TERMS.find(term=>term.id===id);}
export function createP030TermHost(){
  const host=createMemoryOnlyLessonHost({releaseId:'nms-l02-p030-source-terms-v1',releaseMemberIds:[P030_ID],currentAnimationId:P030_ID,enabledCapabilities:['keyterm'],mode:'audit',releasePublished:false});
  return {
    snapshot:()=>host.snapshot(),
    dispatch(request:LessonHostRequest,state:P030FrameState):LessonHostDecision {
      const blocked=():LessonHostDecision=>({status:'blocked',code:'invalid-request',reason:'The request must match a visible source term on this page.',state:host.snapshot()});
      if(state.animationId!==P030_ID||state.frameDomain!=='sprite-67')return blocked();
      if(request.type==='close-keyterm')return host.dispatch(request);
      if(request.type!=='open-keyterm'||request.sourceAnimationId!==P030_ID||request.playbackDisposition!=='source-stop-timeline-and-audio-until-explicit-resume'||!p030SourceTerm(request.entryId)||!p030CanOpenTerm(state,request.entryId))return blocked();
      return host.dispatch(request);
    },
  };
}
