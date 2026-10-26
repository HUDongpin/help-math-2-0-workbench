import {P017_SOURCE_TERMS} from './generated/nms-l02-p017-terms-v1';
import {createMemoryOnlyLessonHost,type LessonHostRequest,type LessonHostDecision} from './lesson-host-contract';
import type {P017FrameState} from './nms-l02-p017-timeline-v1';
import {p017TeachingState,type P017TermKey} from './nms-l02-p017-text-v1';
export const P017_TERM_ENTRIES=Object.freeze({Fraction:'fraction',Whole:'whole',Group:'group'});
export type P017SourceTerm=typeof P017_SOURCE_TERMS[number];
export function p017SourceTerm(id:string):P017SourceTerm|undefined{return P017_SOURCE_TERMS.find(term=>term.id===id);}
export function createP017TermHost(){
 const host=createMemoryOnlyLessonHost({releaseId:'nms-l02-p017-source-terms-v1',releaseMemberIds:['shared-nms002-l02-p017'],currentAnimationId:'shared-nms002-l02-p017',enabledCapabilities:['keyterm'],mode:'audit',releasePublished:false});
 return{snapshot:()=>host.snapshot(),dispatch(request:LessonHostRequest,state:P017FrameState):LessonHostDecision{
 const blocked=():LessonHostDecision=>({status:'blocked',code:'invalid-request',reason:'The request must match a complete visible source term on this page.',state:host.snapshot()});
 if(state.animationId!=='shared-nms002-l02-p017'||state.frameDomain!=='sprite-73')return blocked();
 if(request.type==='close-keyterm')return host.dispatch(request);
 if(request.type!=='open-keyterm'||request.sourceAnimationId!==state.animationId||request.playbackDisposition!=='source-stop-timeline-and-audio-until-explicit-resume')return blocked();
 const term=p017SourceTerm(request.entryId);
 if(!term||!p017TeachingState(state).termAvailable[term.sourceKeyAttribute as P017TermKey])return blocked();
 return host.dispatch(request);
 }};
}
