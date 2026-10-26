import {P012_SOURCE_TERMS} from './generated/nms-l02-p012-terms-v1';
import {createMemoryOnlyLessonHost,type LessonHostRequest,type LessonHostDecision} from './lesson-host-contract';
import type {P012FrameState} from './nms-l02-p012-timeline-v1';
import {p012TeachingState} from './nms-l02-p012-text-v1';
/** Preserve exact page AS key capitalization independently of index labels. */
export const P012_TERM_ENTRIES=Object.freeze({'Equivalent fraction':'equivalent-fraction',Fraction:'fraction',Equivalent:'equivalent',Quantity:'quantity'});
const runByEntry=Object.freeze({'equivalent-fraction':'character-7/run-0',fraction:'character-7/run-2',equivalent:'character-7/run-4',quantity:'character-14/run-1'});
export type P012SourceTerm=typeof P012_SOURCE_TERMS[number];
export function p012SourceTerm(id:string):P012SourceTerm|undefined{return P012_SOURCE_TERMS.find(term=>term.id===id);}
export function createP012TermHost(){
 const host=createMemoryOnlyLessonHost({releaseId:'nms-l02-p012-source-terms-v1',releaseMemberIds:['shared-nms002-l02-p012'],currentAnimationId:'shared-nms002-l02-p012',enabledCapabilities:['keyterm'],mode:'audit',releasePublished:false});
 return{snapshot:()=>host.snapshot(),dispatch(request:LessonHostRequest,state:P012FrameState):LessonHostDecision{
 const blocked=():LessonHostDecision=>({status:'blocked',code:'invalid-request',reason:'The request must match a complete visible source term on this page.',state:host.snapshot()});
 if(state.animationId!=='shared-nms002-l02-p012'||state.frameDomain!=='sprite-33')return blocked();
 if(request.type==='close-keyterm')return host.dispatch(request);
 if(request.type!=='open-keyterm'||request.sourceAnimationId!==state.animationId||request.playbackDisposition!=='source-stop-timeline-and-audio-until-explicit-resume')return blocked();
 const term=p012SourceTerm(request.entryId);
 if(!term||!p012TeachingState(state).allRuns.some(run=>run.sourceTextId===runByEntry[term.id]&&run.complete&&Boolean(run.text.trim())))return blocked();
 return host.dispatch(request);
 }};
}
