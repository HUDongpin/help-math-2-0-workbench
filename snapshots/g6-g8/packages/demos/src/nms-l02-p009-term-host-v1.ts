import {P009_SOURCE_TERMS} from './generated/nms-l02-p009-terms-v1';
import {createMemoryOnlyLessonHost,type LessonHostRequest,type LessonHostDecision} from './lesson-host-contract';
import type {P009FrameState} from './nms-l02-p009-timeline-v1';
import {p009TeachingState} from './nms-l02-p009-text-v1';

export const P009_TERM_ENTRIES = Object.freeze({'Decimal point':'decimal-point',Symbol:'symbol','Whole numbers':'whole-numbers','Decimal fraction':'decimal-fraction'});
const runByEntry = Object.freeze({'decimal-point':'character-7/run-1',symbol:'character-7/run-3','whole-numbers':'character-7/run-5','decimal-fraction':'character-14/run-1'});
export type P009SourceTerm = typeof P009_SOURCE_TERMS[number];
export function p009SourceTerm(id:string):P009SourceTerm|undefined {
  return P009_SOURCE_TERMS.find(term=>term.id===id);
}
/** Page-local implementation of the four authored KeyAttribute calls. This
 * cannot issue navigation, audio, storage or arbitrary legacy operations. */
export function createP009TermHost() {
  const host=createMemoryOnlyLessonHost({releaseId:'nms-l02-p009-source-terms-v1',releaseMemberIds:['shared-nms002-l02-p009'],currentAnimationId:'shared-nms002-l02-p009',enabledCapabilities:['keyterm'],mode:'audit',releasePublished:false});
  return {
    snapshot:()=>host.snapshot(),
    dispatch(request:LessonHostRequest,state:P009FrameState):LessonHostDecision {
      const blocked=():LessonHostDecision=>({status:'blocked',code:'invalid-request',reason:'The request must match a visible source term on this page.',state:host.snapshot()});
      if(state.animationId!=='shared-nms002-l02-p009'||state.frameDomain!=='sprite-37')return blocked();
      if(request.type==='close-keyterm')return host.dispatch(request);
      if(request.type!=='open-keyterm'||request.sourceAnimationId!==state.animationId||request.playbackDisposition!=='source-stop-timeline-and-audio-until-explicit-resume')return blocked();
      const term=p009SourceTerm(request.entryId);
      if(!term||!p009TeachingState(state).allRuns.some(run=>run.sourceTextId===runByEntry[term.id]&&run.complete&&Boolean(run.text.trim())))return blocked();
      return host.dispatch(request);
    },
  };
}
