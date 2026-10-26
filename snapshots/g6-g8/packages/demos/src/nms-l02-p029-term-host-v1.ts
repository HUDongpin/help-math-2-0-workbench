import {P029_SOURCE_TERMS} from './generated/nms-l02-p029-terms-v1';
import {createMemoryOnlyLessonHost,type LessonHostRequest,type LessonHostDecision} from './lesson-host-contract';
import {p029CanOpenTerm,P029_ID,type P029FrameState} from './nms-l02-p029-timeline-v1';
export type P029SourceTerm=typeof P029_SOURCE_TERMS[number];
export function p029SourceTerm(id:string):P029SourceTerm|undefined{return P029_SOURCE_TERMS.find(term=>term.id===id);}
export function createP029TermHost(){
  const host=createMemoryOnlyLessonHost({releaseId:'nms-l02-p029-source-terms-v1',releaseMemberIds:[P029_ID],currentAnimationId:P029_ID,enabledCapabilities:['keyterm'],mode:'audit',releasePublished:false});
  return {
    snapshot:()=>host.snapshot(),
    dispatch(request:LessonHostRequest,state:P029FrameState):LessonHostDecision {
      const blocked=():LessonHostDecision=>({status:'blocked',code:'invalid-request',reason:'The request must match a visible source term on this page.',state:host.snapshot()});
      if(state.animationId!==P029_ID||state.frameDomain!=='sprite-49')return blocked();
      if(request.type==='close-keyterm')return host.dispatch(request);
      if(request.type!=='open-keyterm'||request.sourceAnimationId!==P029_ID||request.playbackDisposition!=='source-stop-timeline-and-audio-until-explicit-resume'||!p029SourceTerm(request.entryId)||!p029CanOpenTerm(state,request.entryId))return blocked();
      return host.dispatch(request);
    },
  };
}
