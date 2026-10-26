import {P028_SOURCE_TERMS} from './generated/nms-l02-p028-terms-v1';
import {createMemoryOnlyLessonHost,type LessonHostRequest,type LessonHostDecision} from './lesson-host-contract';
import {p028CanOpenTerm,P028_ID,type P028FrameState} from './nms-l02-p028-timeline-v1';
export const P028_TERM_ENTRIES=Object.freeze({decimal:'decimal','decimal-point':'decimal-point',equivalent:'equivalent',fraction:'fraction',power:'power',whole:'whole'});
export type P028SourceTerm=typeof P028_SOURCE_TERMS[number];
export function p028SourceTerm(id:string):P028SourceTerm|undefined{return P028_SOURCE_TERMS.find(term=>term.id===id);}
export function createP028TermHost(){
  const host=createMemoryOnlyLessonHost({releaseId:'nms-l02-p028-source-terms-v1',releaseMemberIds:[P028_ID],currentAnimationId:P028_ID,enabledCapabilities:['keyterm'],mode:'audit',releasePublished:false});
  return {
    snapshot:()=>host.snapshot(),
    dispatch(request:LessonHostRequest,state:P028FrameState):LessonHostDecision {
      const blocked=():LessonHostDecision=>({status:'blocked',code:'invalid-request',reason:'The request must match a fully readable source term on this page.',state:host.snapshot()});
      if(state.animationId!==P028_ID||state.frameDomain!=='sprite-29')return blocked();
      if(request.type==='close-keyterm')return host.dispatch(request);
      if(request.type!=='open-keyterm'||request.sourceAnimationId!==P028_ID||request.playbackDisposition!=='source-stop-timeline-and-audio-until-explicit-resume'||!p028SourceTerm(request.entryId)||!p028CanOpenTerm(state,request.entryId))return blocked();
      return host.dispatch(request);
    },
  };
}
