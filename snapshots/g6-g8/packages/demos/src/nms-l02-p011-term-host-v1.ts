import {P011_SOURCE_TERMS} from './generated/nms-l02-p011-terms-v1';
import {createMemoryOnlyLessonHost,type LessonHostRequest,type LessonHostDecision} from './lesson-host-contract';
import type {P011FrameState} from './nms-l02-p011-timeline-v1';
import {p011TeachingState} from './nms-l02-p011-text-v1';
export const P011_TERM_ENTRIES=Object.freeze({Equivalent:'equivalent',Value:'value'});
const runByEntry=Object.freeze({equivalent:'character-7/run-0',value:'character-7/run-2'});
export type P011SourceTerm=typeof P011_SOURCE_TERMS[number];
export function p011SourceTerm(id:string):P011SourceTerm|undefined{return P011_SOURCE_TERMS.find(term=>term.id===id);}
/** Exactly two source KeyAttribute calls, gated by complete visible labels. */
export function createP011TermHost(){
 const host=createMemoryOnlyLessonHost({releaseId:'nms-l02-p011-source-terms-v1',releaseMemberIds:['shared-nms002-l02-p011'],currentAnimationId:'shared-nms002-l02-p011',enabledCapabilities:['keyterm'],mode:'audit',releasePublished:false});
 return{snapshot:()=>host.snapshot(),dispatch(request:LessonHostRequest,state:P011FrameState):LessonHostDecision{
 const blocked=():LessonHostDecision=>({status:'blocked',code:'invalid-request',reason:'The request must match a complete visible source term on this page.',state:host.snapshot()});
 if(state.animationId!=='shared-nms002-l02-p011'||state.frameDomain!=='sprite-27')return blocked();
 if(request.type==='close-keyterm')return host.dispatch(request);
 if(request.type!=='open-keyterm'||request.sourceAnimationId!==state.animationId||request.playbackDisposition!=='source-stop-timeline-and-audio-until-explicit-resume')return blocked();
 const term=p011SourceTerm(request.entryId);
 if(!term||!p011TeachingState(state).allRuns.some(run=>run.sourceTextId===runByEntry[term.id]&&run.complete&&Boolean(run.text.trim())))return blocked();
 return host.dispatch(request);
 }};
}
