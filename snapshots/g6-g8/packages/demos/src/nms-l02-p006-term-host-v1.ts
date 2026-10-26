import {P006_SOURCE_TERMS} from './generated/nms-l02-p006-terms-v1';
import {createMemoryOnlyLessonHost,type LessonHostRequest,type LessonHostDecision} from './lesson-host-contract';
import type {P006FrameState} from './nms-l02-p006-timeline-v1';
import {p006TeachingState} from './nms-l02-p006-text-v1';

export const P006_TERM_ENTRIES = Object.freeze({Convert:'convert',Fraction:'fraction',Decimal:'decimal',Percent:'percent'});

export type P006SourceTerm = typeof P006_SOURCE_TERMS[number];
export function p006SourceTerm(id:string):P006SourceTerm|undefined {
  return P006_SOURCE_TERMS.find(term=>term.id===id);
}
/** Page-local implementation of the four authored KeyAttribute calls. This
 * cannot issue navigation, audio, storage or arbitrary legacy operations. */
export function createP006TermHost() {
  const host=createMemoryOnlyLessonHost({releaseId:'nms-l02-p006-source-terms-v1',releaseMemberIds:['shared-nms002-l02-p006'],currentAnimationId:'shared-nms002-l02-p006',enabledCapabilities:['keyterm'],mode:'audit',releasePublished:false});
  return {
    snapshot:()=>host.snapshot(),
    dispatch(request:LessonHostRequest,state:P006FrameState):LessonHostDecision {
      const blocked=():LessonHostDecision=>({status:'blocked',code:'invalid-request',reason:'The request must match a visible source term on this page.',state:host.snapshot()});
      if(state.animationId!=='shared-nms002-l02-p006'||state.frameDomain!=='sprite-54')return blocked();
      if(request.type==='close-keyterm')return host.dispatch(request);
      if(request.type!=='open-keyterm'||request.sourceAnimationId!==state.animationId||request.playbackDisposition!=='source-stop-timeline-and-audio-until-explicit-resume')return blocked();
      const term=p006SourceTerm(request.entryId);
      if(!term||!p006TeachingState(state).parts.some(part=>part.term===term.sourceKeyAttribute&&part.complete))return blocked();
      return host.dispatch(request);
    },
  };
}
