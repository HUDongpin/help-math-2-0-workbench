import {P015_SOURCE_TERMS} from './generated/nms-l02-p015-terms-v1';
import {createMemoryOnlyLessonHost,type LessonHostRequest,type LessonHostDecision} from './lesson-host-contract';
import type {P015FrameState} from './nms-l02-p015-timeline-v1';
import {p015TeachingState} from './nms-l02-p015-text-v1';
/** Preserve exact page AS key capitalization independently of index labels. */
export const P015_TERM_ENTRIES=Object.freeze({Percent:'percent',Ratio:'ratio',Compare:'compare',Quantity:'quantity'});
const runByEntry=Object.freeze({percent:'character-7/run-1',ratio:'character-7/run-3',compare:'character-12/run-1',quantity:'character-12/run-3'});
export type P015SourceTerm=typeof P015_SOURCE_TERMS[number];
export function p015SourceTerm(id:string):P015SourceTerm|undefined{return P015_SOURCE_TERMS.find(term=>term.id===id);}
export function createP015TermHost(){
 const host=createMemoryOnlyLessonHost({releaseId:'nms-l02-p015-source-terms-v1',releaseMemberIds:['shared-nms002-l02-p015'],currentAnimationId:'shared-nms002-l02-p015',enabledCapabilities:['keyterm'],mode:'audit',releasePublished:false});
 return{snapshot:()=>host.snapshot(),dispatch(request:LessonHostRequest,state:P015FrameState):LessonHostDecision{
 const blocked=():LessonHostDecision=>({status:'blocked',code:'invalid-request',reason:'The request must match a complete visible source term on this page.',state:host.snapshot()});
 if(state.animationId!=='shared-nms002-l02-p015'||state.frameDomain!=='sprite-47')return blocked();
 if(request.type==='close-keyterm')return host.dispatch(request);
 if(request.type!=='open-keyterm'||request.sourceAnimationId!==state.animationId||request.playbackDisposition!=='source-stop-timeline-and-audio-until-explicit-resume')return blocked();
 const term=p015SourceTerm(request.entryId);
 if(!term||!p015TeachingState(state).allRuns.some(run=>run.sourceTextId===runByEntry[term.id]&&run.complete&&Boolean(run.text.trim())))return blocked();
 return host.dispatch(request);
 }};
}
