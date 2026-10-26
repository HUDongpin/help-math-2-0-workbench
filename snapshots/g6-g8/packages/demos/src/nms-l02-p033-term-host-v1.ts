import{P033_SOURCE_TERMS}from'./generated/nms-l02-p033-terms-v1';
import{createMemoryOnlyLessonHost,type LessonHostRequest,type LessonHostDecision}from'./lesson-host-contract';
import{p033Teaching,p033QuestionDecimalReadable}from'./nms-l02-p033-teaching-v1';
import{P033_ID,type P033SessionState}from'./nms-l02-p033-state-v1';
export type P033SourceTerm=typeof P033_SOURCE_TERMS[number];
export function p033SourceTerm(id:string){return P033_SOURCE_TERMS.find(t=>t.id===id);}
export function p033CanOpenTerm(s:P033SessionState,id:string){
 if(s.help)return !!p033SourceTerm(id);
 if(['right','wrong-in','wrong-wait','wrong-out'].includes(s.phase))return false;
 const t=p033Teaching(s);if(id==='decimal')return p033QuestionDecimalReadable(s)||t.chartAlpha===1;
 return ['ones-group','place-value-chart'].includes(id)&&t.chartAlpha===1;
}
export function createP033TermHost(){const host=createMemoryOnlyLessonHost({releaseId:'nms-l02-p033-source-terms-v1',releaseMemberIds:[P033_ID],currentAnimationId:P033_ID,enabledCapabilities:['keyterm'],mode:'audit',releasePublished:false});return{
 snapshot:()=>host.snapshot(),dispatch(request:LessonHostRequest,state:P033SessionState):LessonHostDecision{
 const blocked=():LessonHostDecision=>({status:'blocked',code:'invalid-request',reason:'Exact visible source term required.',state:host.snapshot()});
 if(request.type==='close-keyterm')return host.dispatch(request);
 if(request.type!=='open-keyterm'||request.sourceAnimationId!==P033_ID||request.playbackDisposition!=='source-stop-timeline-and-audio-until-explicit-resume'||!p033SourceTerm(request.entryId)||!p033CanOpenTerm(state,request.entryId))return blocked();return host.dispatch(request);
 }};}
