import type {AnimationRendererProps,RuntimeContext} from '../../contract';
import type {LessonTextActivityDefinition,LessonTextActivitySnapshot,LessonTextBinding} from '../../lesson-text-contract';
import {buildLessonTextSnapshot} from '../../lesson-text-snapshot';
import type {SourceStaticCanvasFrameState} from '../../source-static-canvas-candidate';
import data from './source.generated.json';

export const TI002_SOURCE=data;
export const TI002_BINDING=data.binding as unknown as LessonTextBinding;
export const TI002_ACTIVITIES=data.activities as unknown as readonly LessonTextActivityDefinition[];
export type ActivityBinding=Readonly<{id:string;floor:number;revision:number|null;token:string|null}>;
export type Ti002Session=Readonly<{seed:number;replay:number;lastFrame:number;matched:readonly number[];selected:number|null;phase:'matching'|'coach'|'wrong'|'final'|'outro';feedback:ActivityBinding|null;backgroundWrong:ActivityBinding|null;picture:ActivityBinding|null;focus:string|null}>;
export function createTi002(seed=0,replay=0):Ti002Session{return{seed:seed>>>0,replay,lastFrame:1,matched:[],selected:null,phase:'matching',feedback:null,backgroundWrong:null,picture:null,focus:null};}
export function synchronizeTi002(s:Ti002Session,r:RuntimeContext):Ti002Session{
 if(s.seed!==(r.seed>>>0)||s.replay!==(r.replay??0)||r.frame<s.lastFrame)return{...createTi002(r.seed,r.replay??0),lastFrame:r.frame};
 return s.lastFrame===r.frame?s:{...s,lastFrame:r.frame};
}
export function ti002At<T>(curve:readonly unknown[],frame:number):T{let result=(curve[0]as[number,T])[1];for(const row of curve){const [start,value]=row as[number,T];if(start>frame)break;result=value;}return result;}
export type SourcePlacement={character:number;instance:string;matrix:number[];alpha:number};
export function ti002Alpha(curve:readonly unknown[],frame:number){return Math.max(0,...ti002At<SourcePlacement[]>(curve,frame).map(p=>p.alpha));}
export function observeTi002(binding:ActivityBinding|null,all:readonly LessonTextActivitySnapshot[]){
 const definition=TI002_ACTIVITIES.find(a=>a.id===binding?.id),matches=all.filter(a=>definition&&(a.id===definition.id||a.sourceInstanceId===definition.sourceInstanceId)),activity=matches.length===1?matches[0]:undefined;
 const bound=Boolean(binding&&definition&&activity&&activity.id===definition.id&&activity.sourceInstanceId===definition.sourceInstanceId&&activity.frameDomain===definition.frameDomain&&Number.isInteger(activity.frame)&&activity.frame>=definition.startFrame&&activity.frame<=definition.endFrame&&Number.isSafeInteger(activity.revision)&&activity.revision>binding.floor&&(binding.revision===null||activity.revision===binding.revision)&&Boolean(activity.cancellationToken)&&(binding.token===null||activity.cancellationToken===binding.token)&&(activity.status==='playing'||activity.status==='completed'));
 return{definition,activity,bound,complete:bound&&activity!.status==='completed'&&activity!.frame===definition!.endFrame};
}
export function bindTi002(s:Ti002Session,all:readonly LessonTextActivitySnapshot[]):Ti002Session{
 let next=s;for(const key of ['feedback','picture','backgroundWrong']as const){const b=next[key],seen=observeTi002(b,all);if(b&&b.revision===null&&seen.bound)next={...next,[key]:{...b,revision:seen.activity!.revision,token:seen.activity!.cancellationToken!}};}return next;
}
function permitted(s:Ti002Session,r:AnimationRendererProps){return r.lang==='en'&&r.scenario==='source-static-frame'&&!r.entryStateSha256&&(r.rootFrame??6)===6&&(r.frameDomain??data.frameDomain)===data.frameDomain&&(r.seed>>>0)===s.seed&&(r.replay??0)===s.replay&&!r.paused;}
function request(id:string,r:AnimationRendererProps):ActivityBinding|null{
 const definition=TI002_ACTIVITIES.find(a=>a.id===id);if(!definition||!definition.parentFrames.includes(r.frame))return null;
 const floor=Math.max(-1,...(r.lessonActivities??[]).filter(a=>a.sourceInstanceId===definition.sourceInstanceId&&Number.isSafeInteger(a.revision)).map(a=>a.revision));
 return r.onLessonActivityRequest?.({id,parentFrame:r.frame})===true?{id,floor,revision:null,token:null}:null;
}
function cancel(b:ActivityBinding|null,r:AnimationRendererProps){const seen=observeTi002(b,r.lessonActivities??[]);return Boolean(seen.bound&&seen.activity?.cancellationToken&&r.onLessonActivityCancel?.({id:seen.activity.id,sourceInstanceId:seen.activity.sourceInstanceId,revision:seen.activity.revision,cancellationToken:seen.activity.cancellationToken,parentFrame:r.frame}));}
export function selectTi002(s:Ti002Session,term:number|null,r:AnimationRendererProps):Ti002Session{
 if(!permitted(s,r)||r.frame!==261||s.phase!=='matching'||s.picture||term!==null&&(!data.rows.some(row=>row.number===term)||s.matched.includes(term)))return s;
 return s.selected===term?s:{...s,selected:term};
}
export function matchTi002(s:Ti002Session,term:number,target:number|null,r:AnimationRendererProps):Ti002Session{
 if(!permitted(s,r)||!r.onLessonFrameRequest||!r.onLessonActivityCancel||r.frame!==261||s.phase!=='matching'||s.picture||!data.rows.some(row=>row.number===term)||s.matched.includes(term))return s;
 const correct=term===target,feedback=request(correct?'ti002-coach':'ti002-wrong',r);if(!feedback)return s;
 return{...s,matched:correct?[...s.matched,term]:s.matched,selected:null,phase:correct?'coach':'wrong',feedback,backgroundWrong:correct?s.backgroundWrong:null,focus:correct?'feedback':'wrong'};
}
export function finishTi002(s:Ti002Session,r:AnimationRendererProps):Ti002Session{
 if(permitted(s,r)&&s.backgroundWrong&&observeTi002(s.backgroundWrong,r.lessonActivities??[]).complete)return{...s,backgroundWrong:null};
 if(!permitted(s,r)||r.frame!==261||!s.feedback||s.feedback.revision===null)return s;
 const seen=observeTi002(s.feedback,r.lessonActivities??[]);if(!seen.complete)return s;
 if(s.phase==='coach'){
  if(s.matched.length===5){const feedback=request('ti002-final',r);return feedback?{...s,phase:'final',feedback,focus:'feedback'}:s;}
  return{...s,phase:'matching',feedback:null,focus:'bank-'+data.bankOrder.find(n=>!s.matched.includes(n))};
 }
 if(s.phase==='final'&&s.matched.length===5&&r.onLessonFrameRequest?.({fromFrame:261,toFrame:262,stopFrame:275})===true)return{...s,phase:'outro',feedback:null,focus:null};
 return s;
}
export function closeWrongTi002(s:Ti002Session,r:AnimationRendererProps):Ti002Session{
 if(!permitted(s,r)||r.frame!==261||s.phase!=='wrong'||!s.feedback||s.picture||!observeTi002(s.feedback,r.lessonActivities??[]).bound)return s;
 // Button376 only hides WrongFeed and enables cards; it does not stop or rewind it.
 return{...s,phase:'matching',backgroundWrong:s.feedback,feedback:null,focus:'bank-'+data.bankOrder.find(n=>!s.matched.includes(n))};
}
export function openPictureTi002(s:Ti002Session,kind:string,r:AnimationRendererProps):Ti002Session{
 if(!permitted(s,r)||r.frame<261||r.frame>275||s.picture||!data.rows.some(row=>row.figure===kind))return s;
 const picture=request('ti002-picture-'+kind,r);return picture?{...s,picture,focus:'picture'}:s;
}
export function closePictureTi002(s:Ti002Session,r:AnimationRendererProps):Ti002Session{
 if(!permitted(s,r)||!s.picture||!cancel(s.picture,r))return s;
 return{...s,picture:null,focus:'enlarge-'+s.picture.id.slice('ti002-picture-'.length)};
}
export function cancelTi002(s:Ti002Session,r:AnimationRendererProps){for(const b of [s.feedback,s.picture,s.backgroundWrong])if(b)cancel(b,r);}
export function ti002Values(frame:number,s=createTi002(),all:readonly LessonTextActivitySnapshot[]=[]){
 const feedback=observeTi002(s.feedback,all),picture=observeTi002(s.picture,all),kind=s.picture?.id.slice('ti002-picture-'.length);
 return Object.fromEntries(TI002_BINDING.blocks.map(b=>{
  let visible=false;if(b.id==='title')visible=true;else if(b.id==='instruction')visible=ti002Alpha(data.instructionCurve,frame)>0;else if(b.id==='step')visible=ti002Alpha(data.stepCurve,frame)>0;else if(b.id==='table-headings'||b.id==='enlarge')visible=ti002Alpha(data.headingCurve,frame)>0;
  else if(b.id.startsWith('term-')){const row=data.rows.find(r=>'term-'+r.number===b.id)!;visible=ti002Alpha(row.termCurve,frame)>0&&!s.matched.includes(row.number);}
  else if(b.id.startsWith('target-'))visible=frame>=261&&s.matched.includes(Number(b.id.slice(7)));
  else if(b.id.startsWith('definition-'))visible=ti002Alpha(data.rows.find(r=>'definition-'+r.number===b.id)!.definitionCurve,frame)>0;
  else if(b.id.startsWith('figure-'))visible=ti002Alpha(data.figures[b.id.slice(7)as keyof typeof data.figures].mainCurve,frame)>0;
  else if(b.id.startsWith('picture-'))visible=picture.bound&&b.id==='picture-'+kind;
  else if(b.id==='wrong')visible=s.phase==='wrong'&&feedback.bound;
  else if(b.id==='correct')visible=s.phase==='final'&&feedback.bound;
  else if(b.id==='close')visible=picture.bound||s.phase==='wrong'&&feedback.bound;
  return[b.id,{text:(data.text as Record<string,string>)[b.id],visible}];
 }));
}
export function ti002Snapshot(state:SourceStaticCanvasFrameState,r:RuntimeContext,s=createTi002(r.seed,r.replay??0),all:readonly LessonTextActivitySnapshot[]=[]){
 const valid=state.status==='ready'&&state.animationId===data.animationId&&state.sourceSwfSha256===data.sourceSwfSha256&&state.frame===r.frame&&Number.isInteger(r.frame)&&r.frame>=1&&r.frame<=275&&state.frameDomain===data.frameDomain&&(r.frameDomain??data.frameDomain)===data.frameDomain&&state.rootFrame===6&&(r.rootFrame??6)===6&&state.language==='en'&&r.lang==='en'&&state.scenario==='source-static-frame'&&r.scenario===state.scenario&&state.seed===(r.seed>>>0)&&!r.entryStateSha256;
 const snapshot=buildLessonTextSnapshot(TI002_BINDING,r,ti002Values(r.frame,s,all));return valid?snapshot:{...snapshot,status:'blocked'as const,blockers:['exact-source-runtime-identity-mismatch'],blocks:snapshot.blocks.map(b=>({...b,visible:false}))};
}
