import {P014_SOURCE_TERMS} from './generated/nms-l02-p014-terms-v1';
import {createMemoryOnlyLessonHost,type LessonHostRequest,type LessonHostDecision} from './lesson-host-contract';
import type {P014FrameState} from './nms-l02-p014-timeline-v1';
import {p014TeachingState} from './nms-l02-p014-text-v1';
/** Preserve exact page AS key capitalization independently of index labels. */
export const P014_TERM_ENTRIES=Object.freeze({'Equivalent decimal':'equivalent-decimal',Decimal:'decimal'});
const runByEntry=Object.freeze({'equivalent-decimal':'character-7/run-0',decimal:'character-7/run-2'});
export type P014SourceTerm=typeof P014_SOURCE_TERMS[number];
export function p014SourceTerm(id:string):P014SourceTerm|undefined{return P014_SOURCE_TERMS.find(term=>term.id===id);}
export function createP014TermHost(){
 const host=createMemoryOnlyLessonHost({releaseId:'nms-l02-p014-source-terms-v1',releaseMemberIds:['shared-nms002-l02-p014'],currentAnimationId:'shared-nms002-l02-p014',enabledCapabilities:['keyterm'],mode:'audit',releasePublished:false});
 return{snapshot:()=>host.snapshot(),dispatch(request:LessonHostRequest,state:P014FrameState):LessonHostDecision{
 const blocked=():LessonHostDecision=>({status:'blocked',code:'invalid-request',reason:'The request must match a complete visible source term on this page.',state:host.snapshot()});
 if(state.animationId!=='shared-nms002-l02-p014'||state.frameDomain!=='sprite-19')return blocked();
 if(request.type==='close-keyterm')return host.dispatch(request);
 if(request.type!=='open-keyterm'||request.sourceAnimationId!==state.animationId||request.playbackDisposition!=='source-stop-timeline-and-audio-until-explicit-resume')return blocked();
 const term=p014SourceTerm(request.entryId);
 if(!term||!p014TeachingState(state).allRuns.some(run=>run.sourceTextId===runByEntry[term.id]&&run.complete&&Boolean(run.text.trim())))return blocked();
 return host.dispatch(request);
 }};
}
