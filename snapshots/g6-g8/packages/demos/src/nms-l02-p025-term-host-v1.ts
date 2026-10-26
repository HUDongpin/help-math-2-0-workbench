import {P025_SOURCE_TERMS} from './generated/nms-l02-p025-terms-v1';
import {createMemoryOnlyLessonHost,type LessonHostRequest,type LessonHostDecision} from './lesson-host-contract';
import type {P025FrameState} from './nms-l02-p025-timeline-v1';
import {p025TeachingState,type P025TermKey} from './nms-l02-p025-text-v1';
export const P025_TERM_ENTRIES=Object.freeze({'Equivalent fraction':'equivalent-fraction',Fraction:'fraction',Quantity:'quantity'});
export type P025SourceTerm=typeof P025_SOURCE_TERMS[number];
export function p025SourceTerm(id:string):P025SourceTerm|undefined{return P025_SOURCE_TERMS.find(term=>term.id===id);}
export function createP025TermHost(){
 const host=createMemoryOnlyLessonHost({releaseId:'nms-l02-p025-source-terms-v1',releaseMemberIds:['shared-nms002-l02-p025'],currentAnimationId:'shared-nms002-l02-p025',enabledCapabilities:['keyterm'],mode:'audit',releasePublished:false});
 return{snapshot:()=>host.snapshot(),dispatch(request:LessonHostRequest,state:P025FrameState):LessonHostDecision{
 const blocked=():LessonHostDecision=>({status:'blocked',code:'invalid-request',reason:'The request must match a complete visible source term on this page.',state:host.snapshot()});
 if(state.animationId!=='shared-nms002-l02-p025'||state.frameDomain!=='sprite-36')return blocked();
 if(request.type==='close-keyterm')return host.dispatch(request);
 if(request.type!=='open-keyterm'||request.sourceAnimationId!==state.animationId||request.playbackDisposition!=='source-stop-timeline-and-audio-until-explicit-resume')return blocked();
 const term=p025SourceTerm(request.entryId);
 // Authored AS uses lowercase fraction; the exact XML label capitalizes it.
 // Resolve only the explicit source-key-to-entry binding, never arbitrary aliases.
 const key=(Object.keys(P025_TERM_ENTRIES) as P025TermKey[]).find(k=>P025_TERM_ENTRIES[k]===request.entryId);
 if(!term||!key||!p025TeachingState(state).termAvailable[key])return blocked();
 return host.dispatch(request);
 }};
}
