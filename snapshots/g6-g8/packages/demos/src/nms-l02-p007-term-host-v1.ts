import {P007_SOURCE_TERMS} from './generated/nms-l02-p007-terms-v1';
import {createMemoryOnlyLessonHost,type LessonHostRequest,type LessonHostDecision} from './lesson-host-contract';
import type {P007FrameState} from './nms-l02-p007-timeline-v1';
import {p007TeachingState} from './nms-l02-p007-text-v1';

export const P007_TERM_ENTRIES = Object.freeze({Fraction:'fraction',Whole:'whole',Group:'group'});
const runByEntry = Object.freeze({fraction:'character-7/run-0',whole:'character-7/run-2',group:'character-7/run-4'});
export type P007SourceTerm = typeof P007_SOURCE_TERMS[number];
export function p007SourceTerm(id:string):P007SourceTerm|undefined {
  return P007_SOURCE_TERMS.find(term=>term.id===id);
}
/** Page-local implementation of the three authored KeyAttribute calls. This
 * cannot issue navigation, audio, storage or arbitrary legacy operations. */
export function createP007TermHost() {
  const host=createMemoryOnlyLessonHost({releaseId:'nms-l02-p007-source-terms-v1',releaseMemberIds:['shared-nms002-l02-p007'],currentAnimationId:'shared-nms002-l02-p007',enabledCapabilities:['keyterm'],mode:'audit',releasePublished:false});
  return {
    snapshot:()=>host.snapshot(),
    dispatch(request:LessonHostRequest,state:P007FrameState):LessonHostDecision {
      const blocked=():LessonHostDecision=>({status:'blocked',code:'invalid-request',reason:'The request must match a visible source term on this page.',state:host.snapshot()});
      if(state.animationId!=='shared-nms002-l02-p007'||state.frameDomain!=='sprite-35')return blocked();
      if(request.type==='close-keyterm')return host.dispatch(request);
      if(request.type!=='open-keyterm'||request.sourceAnimationId!==state.animationId||request.playbackDisposition!=='source-stop-timeline-and-audio-until-explicit-resume')return blocked();
      const term=p007SourceTerm(request.entryId);
      if(!term||!p007TeachingState(state).definitionRuns.some(run=>run.sourceTextId===runByEntry[term.id]&&run.visiblePrefix===run.text&&Boolean(run.text.trim())))return blocked();
      return host.dispatch(request);
    },
  };
}
