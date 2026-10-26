import {P016_SOURCE_TERMS} from './generated/nms-l02-p016-terms-v1';
import {createMemoryOnlyLessonHost,type LessonHostRequest,type LessonHostDecision} from './lesson-host-contract';
import {P016_ID,type P016State} from './nms-l02-p016-state-v1';
import {p016Teaching} from './nms-l02-p016-teaching-v1';
export type P016SourceTerm=typeof P016_SOURCE_TERMS[number];
export function p016SourceTerm(id:string):P016SourceTerm|undefined{return P016_SOURCE_TERMS.find(t=>t.id===id);}
export function createP016TermHost(){
 const host=createMemoryOnlyLessonHost({releaseId:'nms-l02-p016-source-terms-v1',releaseMemberIds:[P016_ID],currentAnimationId:P016_ID,enabledCapabilities:['keyterm'],mode:'audit',releasePublished:false});
 return{snapshot:()=>host.snapshot(),dispatch(request:LessonHostRequest,s:P016State):LessonHostDecision{
 const blocked=():LessonHostDecision=>({status:'blocked',code:'invalid-request',reason:'The term must be complete and visible on this source page.',state:host.snapshot()});
 if(request.type==='close-keyterm')return host.dispatch(request);
 if(request.type!=='open-keyterm'||request.sourceAnimationId!==P016_ID||request.playbackDisposition!=='source-stop-timeline-and-audio-until-explicit-resume'||s.feedback!=='none')return blocked();
 const t=p016Teaching(s),visible=request.entryId==='decimal'?t.decimalComplete:request.entryId==='grid'?t.gridComplete:request.entryId==='represent'?t.representComplete:false;
 return visible&&p016SourceTerm(request.entryId)?host.dispatch(request):blocked();
 }};
}
