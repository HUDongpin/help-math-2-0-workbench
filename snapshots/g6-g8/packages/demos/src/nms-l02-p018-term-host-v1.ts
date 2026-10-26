import {P018_SOURCE_TERMS} from './generated/nms-l02-p018-terms-v1';
import {createMemoryOnlyLessonHost,type LessonHostRequest,type LessonHostDecision} from './lesson-host-contract';
import type {P018FrameState} from './nms-l02-p018-timeline-v1';
import {p018TeachingState,type P018TermKey} from './nms-l02-p018-text-v1';
export const P018_TERM_ENTRIES=Object.freeze({Fraction:'fraction',Circle:'circle'});
export type P018SourceTerm=typeof P018_SOURCE_TERMS[number];
export function p018SourceTerm(id:string):P018SourceTerm|undefined{return P018_SOURCE_TERMS.find(term=>term.id===id);}
export function createP018TermHost(){
 const host=createMemoryOnlyLessonHost({releaseId:'nms-l02-p018-source-terms-v1',releaseMemberIds:['shared-nms002-l02-p018'],currentAnimationId:'shared-nms002-l02-p018',enabledCapabilities:['keyterm'],mode:'audit',releasePublished:false});
 return{snapshot:()=>host.snapshot(),dispatch(request:LessonHostRequest,state:P018FrameState):LessonHostDecision{
 const blocked=():LessonHostDecision=>({status:'blocked',code:'invalid-request',reason:'The request must match a complete visible source term on this page.',state:host.snapshot()});
 if(state.animationId!=='shared-nms002-l02-p018'||state.frameDomain!=='sprite-29')return blocked();
 if(request.type==='close-keyterm')return host.dispatch(request);
 if(request.type!=='open-keyterm'||request.sourceAnimationId!==state.animationId||request.playbackDisposition!=='source-stop-timeline-and-audio-until-explicit-resume')return blocked();
 const term=p018SourceTerm(request.entryId);
 if(!term||!p018TeachingState(state).termAvailable[term.sourceKeyAttribute as P018TermKey])return blocked();
 return host.dispatch(request);
 }};
}
