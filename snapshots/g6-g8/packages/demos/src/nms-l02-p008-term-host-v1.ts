import {P008_SOURCE_TERMS} from './generated/nms-l02-p008-terms-v1';
import {createMemoryOnlyLessonHost,type LessonHostRequest,type LessonHostDecision} from './lesson-host-contract';
import type {P008FrameState} from './nms-l02-p008-timeline-v1';
import {p008TeachingState} from './nms-l02-p008-text-v1';

export const P008_TERM_ENTRIES = Object.freeze({Decimal:'decimal','Decimal point':'decimal-point','Place value':'place-value',Fraction:'fraction',Power:'power',Whole:'whole'});
const runByEntry = Object.freeze({decimal:'character-7/run-1','decimal-point':'character-7/run-3','place-value':'character-13/run-0',fraction:'character-16/run-1',power:'character-16/run-3',whole:'character-28/run-1'});
export type P008SourceTerm = typeof P008_SOURCE_TERMS[number];
export function p008SourceTerm(id:string):P008SourceTerm|undefined {
  return P008_SOURCE_TERMS.find(term=>term.id===id);
}
/** Page-local implementation of the six authored KeyAttribute calls. This
 * cannot issue navigation, audio, storage or arbitrary legacy operations. */
export function createP008TermHost() {
  const host=createMemoryOnlyLessonHost({releaseId:'nms-l02-p008-source-terms-v1',releaseMemberIds:['shared-nms002-l02-p008'],currentAnimationId:'shared-nms002-l02-p008',enabledCapabilities:['keyterm'],mode:'audit',releasePublished:false});
  return {
    snapshot:()=>host.snapshot(),
    dispatch(request:LessonHostRequest,state:P008FrameState):LessonHostDecision {
      const blocked=():LessonHostDecision=>({status:'blocked',code:'invalid-request',reason:'The request must match a visible source term on this page.',state:host.snapshot()});
      if(state.animationId!=='shared-nms002-l02-p008'||state.frameDomain!=='sprite-39')return blocked();
      if(request.type==='close-keyterm')return host.dispatch(request);
      if(request.type!=='open-keyterm'||request.sourceAnimationId!==state.animationId||request.playbackDisposition!=='source-stop-timeline-and-audio-until-explicit-resume')return blocked();
      const term=p008SourceTerm(request.entryId);
      if(!term||!p008TeachingState(state).allRuns.some(run=>run.sourceTextId===runByEntry[term.id]&&run.visiblePrefix===run.text&&Boolean(run.text.trim())))return blocked();
      return host.dispatch(request);
    },
  };
}
