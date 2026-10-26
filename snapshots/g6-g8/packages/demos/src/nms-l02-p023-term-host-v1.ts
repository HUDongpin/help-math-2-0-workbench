import {P023_SOURCE_TERMS} from './generated/nms-l02-p023-terms-v1';
import {createMemoryOnlyLessonHost,type LessonHostRequest,type LessonHostDecision} from './lesson-host-contract';
import type {P023FrameState} from './nms-l02-p023-timeline-v1';
import {p023TeachingState,type P023TermKey} from './nms-l02-p023-text-v1';
export const P023_TERM_ENTRIES=Object.freeze({Fraction:'fraction','Number line':'number-line',Whole:'whole',Part:'part'});
export type P023SourceTerm=typeof P023_SOURCE_TERMS[number];
export function p023SourceTerm(id:string):P023SourceTerm|undefined{return P023_SOURCE_TERMS.find(term=>term.id===id);}
export function createP023TermHost(){
 const host=createMemoryOnlyLessonHost({releaseId:'nms-l02-p023-source-terms-v1',releaseMemberIds:['shared-nms002-l02-p023'],currentAnimationId:'shared-nms002-l02-p023',enabledCapabilities:['keyterm'],mode:'audit',releasePublished:false});
 return{snapshot:()=>host.snapshot(),dispatch(request:LessonHostRequest,state:P023FrameState):LessonHostDecision{
 const blocked=():LessonHostDecision=>({status:'blocked',code:'invalid-request',reason:'The request must match a complete visible source term on this page.',state:host.snapshot()});
 if(state.animationId!=='shared-nms002-l02-p023'||state.frameDomain!=='sprite-28')return blocked();
 if(request.type==='close-keyterm')return host.dispatch(request);
 if(request.type!=='open-keyterm'||request.sourceAnimationId!==state.animationId||request.playbackDisposition!=='source-stop-timeline-and-audio-until-explicit-resume')return blocked();
 const term=p023SourceTerm(request.entryId);
 if(!term||!p023TeachingState(state).termAvailable[term.sourceKeyAttribute as P023TermKey])return blocked();
 return host.dispatch(request);
 }};
}
