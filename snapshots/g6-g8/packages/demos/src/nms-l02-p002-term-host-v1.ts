import {P002_SOURCE_TERMS} from './generated/nms-l02-p002-terms-v1';
import {createMemoryOnlyLessonHost,type LessonHostRequest,type LessonHostDecision} from './lesson-host-contract';
import type {P002FrameState} from './nms-l02-p002-timeline-v1';
import {p002TeachingState} from './nms-l02-p002-text-v1';

export const P002_TERM_ENTRIES = Object.freeze({Fraction:'fraction',Whole:'whole',Group:'group'});
const runByEntry = Object.freeze({fraction:'character-233/run-1',whole:'character-233/run-4',group:'character-233/run-6'});
export type P002SourceTerm = typeof P002_SOURCE_TERMS[number];
export function p002SourceTerm(id:string):P002SourceTerm|undefined {
  return P002_SOURCE_TERMS.find(term=>term.id===id);
}
/** Page-local implementation of the three authored KeyAttribute calls. This
 * cannot issue navigation, audio, storage or arbitrary legacy operations. */
export function createP002TermHost() {
  const host=createMemoryOnlyLessonHost({releaseId:'nms-l02-p002-source-terms-v1',releaseMemberIds:['shared-nms002-l02-p002'],currentAnimationId:'shared-nms002-l02-p002',enabledCapabilities:['keyterm'],mode:'audit',releasePublished:false});
  return {
    snapshot:()=>host.snapshot(),
    dispatch(request:LessonHostRequest,state:P002FrameState):LessonHostDecision {
      const blocked=():LessonHostDecision=>({status:'blocked',code:'invalid-request',reason:'The request must match a visible source term on this page.',state:host.snapshot()});
      if(state.animationId!=='shared-nms002-l02-p002'||state.frameDomain!=='sprite-310')return blocked();
      if(request.type==='close-keyterm')return host.dispatch(request);
      if(request.type!=='open-keyterm'||request.sourceAnimationId!==state.animationId||request.playbackDisposition!=='source-stop-timeline-and-audio-until-explicit-resume')return blocked();
      const term=p002SourceTerm(request.entryId);
      if(!term||!p002TeachingState(state).definitionRuns.some(run=>run.sourceTextId===runByEntry[term.id]&&run.visiblePrefix.trim()))return blocked();
      return host.dispatch(request);
    },
  };
}
