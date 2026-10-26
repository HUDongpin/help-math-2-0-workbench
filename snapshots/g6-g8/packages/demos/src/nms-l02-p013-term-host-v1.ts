import {P013_SOURCE_TERMS} from './generated/nms-l02-p013-terms-v1';
import {createMemoryOnlyLessonHost,type LessonHostRequest,type LessonHostDecision} from './lesson-host-contract';
import {P013_ID,p013Teaching,type P013State} from './nms-l02-p013-timeline-v1';
export type P013SourceTerm=typeof P013_SOURCE_TERMS[number];
export function p013SourceTerm(id:string):P013SourceTerm|undefined{return P013_SOURCE_TERMS.find(term=>term.id===id);}
export function createP013TermHost(){const host=createMemoryOnlyLessonHost({releaseId:'nms-l02-p013-source-terms-v1',releaseMemberIds:[P013_ID],currentAnimationId:P013_ID,enabledCapabilities:['keyterm'],mode:'audit',releasePublished:false});return{snapshot:()=>host.snapshot(),dispatch(request:LessonHostRequest,state:P013State):LessonHostDecision{
 const blocked=():LessonHostDecision=>({status:'blocked',code:'invalid-request',reason:'The request must match this page and its visible complete source term.',state:host.snapshot()});
 if(request.type==='close-keyterm')return host.dispatch(request);
 if(request.type!=='open-keyterm'||request.sourceAnimationId!==P013_ID||request.entryId!=='equivalent-fraction'||request.playbackDisposition!=='source-stop-timeline-and-audio-until-explicit-resume'||!p013Teaching(state).termEnabled)return blocked();
 return host.dispatch(request);
}};}
