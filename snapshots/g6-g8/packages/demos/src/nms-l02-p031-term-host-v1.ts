import{P031_SOURCE_TERMS}from'./generated/nms-l02-p031-terms-v1';
import{createMemoryOnlyLessonHost,type LessonHostRequest,type LessonHostDecision}from'./lesson-host-contract';
import{p031Teaching,p031QuestionDecimalReadable}from'./nms-l02-p031-teaching-v1';
import{P031_ID,type P031SessionState}from'./nms-l02-p031-state-v1';
export type P031SourceTerm=typeof P031_SOURCE_TERMS[number];
export function p031SourceTerm(id:string){return P031_SOURCE_TERMS.find(t=>t.id===id);}
export function p031CanOpenTerm(s:P031SessionState,id:string){
 if(s.help)return !!p031SourceTerm(id);
 if(['right','wrong-in','wrong-wait','wrong-out'].includes(s.phase))return false;
 const t=p031Teaching(s);if(id==='decimal')return p031QuestionDecimalReadable(s)||t.chartAlpha===1;
 return ['ones-group','place-value-chart'].includes(id)&&t.chartAlpha===1;
}
export function createP031TermHost(){const host=createMemoryOnlyLessonHost({releaseId:'nms-l02-p031-source-terms-v1',releaseMemberIds:[P031_ID],currentAnimationId:P031_ID,enabledCapabilities:['keyterm'],mode:'audit',releasePublished:false});return{
 snapshot:()=>host.snapshot(),dispatch(request:LessonHostRequest,state:P031SessionState):LessonHostDecision{
 const blocked=():LessonHostDecision=>({status:'blocked',code:'invalid-request',reason:'Exact visible source term required.',state:host.snapshot()});
 if(request.type==='close-keyterm')return host.dispatch(request);
 if(request.type!=='open-keyterm'||request.sourceAnimationId!==P031_ID||request.playbackDisposition!=='source-stop-timeline-and-audio-until-explicit-resume'||!p031SourceTerm(request.entryId)||!p031CanOpenTerm(state,request.entryId))return blocked();return host.dispatch(request);
 }};}
