import type{AnimationRendererProps,RuntimeContext}from'../../contract';
import type{LessonTextActivityDefinition,LessonTextActivitySnapshot,LessonTextBinding}from'../../lesson-text-contract';
import{buildLessonTextSnapshot}from'../../lesson-text-snapshot';
import type{SourceStaticCanvasFrameState}from'../../source-static-canvas-candidate';
import data from'./source.generated.json';
export const TI005_SOURCE=data;
export const TI005_BINDING=data.binding as unknown as LessonTextBinding;
export const TI005_ACTIVITIES=data.activities as unknown as readonly LessonTextActivityDefinition[];
export type Ti005Activity=Readonly<{id:string;floor:number;revision:number|null;token:string|null}>;
export type Ti005Session=Readonly<{seed:number;replay:number;lastFrame:number;matched:readonly number[];selected:number|null;cardsEnabled:boolean;helpEnabled:boolean;helpOpen:boolean;wrongVisible:boolean;continued:boolean;coach:Ti005Activity|null;wrong:Ti005Activity|null;final:Ti005Activity|null;hint:Ti005Activity|null;focus:string|null}>;
export function createTi005(seed=0,replay=0):Ti005Session{return{seed:seed>>>0,replay,lastFrame:1,matched:[],selected:null,cardsEnabled:true,helpEnabled:true,helpOpen:false,wrongVisible:false,continued:false,coach:null,wrong:null,final:null,hint:null,focus:null};}
export function synchronizeTi005(s:Ti005Session,r:RuntimeContext):Ti005Session{if(s.seed!==(r.seed>>>0)||s.replay!==(r.replay??0)||r.frame<s.lastFrame)return{...createTi005(r.seed,r.replay??0),lastFrame:r.frame};return s.lastFrame===r.frame?s:{...s,lastFrame:r.frame,...r.frame===65?{helpOpen:false,wrongVisible:false,cardsEnabled:false,helpEnabled:false}:{}};}
export function ti005At<T>(curve:readonly unknown[],frame:number):T{let result=(curve[0]as[number,T])[1];for(const row of curve){const[f,v]=row as[number,T];if(f>frame)break;result=v;}return result;}
export type SourcePlacement={character:number;instance:string;matrix:number[];alpha:number};
export function ti005Alpha(curve:readonly unknown[],frame:number){return Math.max(0,...ti005At<SourcePlacement[]>(curve,frame).map(v=>v.alpha));}
export function observeTi005(b:Ti005Activity|null,all:readonly LessonTextActivitySnapshot[]){const definition=TI005_ACTIVITIES.find(a=>a.id===b?.id),matches=all.filter(a=>definition&&(a.id===definition.id||a.sourceInstanceId===definition.sourceInstanceId)),activity=matches.length===1?matches[0]:undefined,bound=Boolean(b&&definition&&activity&&activity.id===definition.id&&activity.sourceInstanceId===definition.sourceInstanceId&&activity.frameDomain===definition.frameDomain&&Number.isSafeInteger(activity.revision)&&activity.revision>b.floor&&(b.revision===null||b.revision===activity.revision)&&Boolean(activity.cancellationToken)&&(b.token===null||b.token===activity.cancellationToken)&&Number.isInteger(activity.frame)&&activity.frame>=definition.startFrame&&activity.frame<=definition.endFrame&&(activity.status==='playing'||activity.status==='completed'));return{definition,activity,bound,complete:bound&&activity!.status==='completed'&&activity!.frame===definition!.endFrame};}
export function bindTi005(s:Ti005Session,all:readonly LessonTextActivitySnapshot[]):Ti005Session{let next=s;for(const key of['coach','wrong','final','hint']as const){const b=next[key],seen=observeTi005(b,all);if(b&&b.revision===null&&seen.bound)next={...next,[key]:{...b,revision:seen.activity!.revision,token:seen.activity!.cancellationToken!}};}return next;}
const identityAllowed=(s:Ti005Session,r:AnimationRendererProps)=>r.lang==='en'&&r.scenario==='source-static-frame'&&!r.entryStateSha256&&(r.rootFrame??6)===6&&(r.frameDomain??data.frameDomain)===data.frameDomain&&r.frame===64&&(r.seed>>>0)===s.seed&&(r.replay??0)===s.replay&&!s.continued;
const permitted=(s:Ti005Session,r:AnimationRendererProps)=>identityAllowed(s,r)&&!r.paused;
function binding(id:string,r:AnimationRendererProps):Ti005Activity{const d=TI005_ACTIVITIES.find(a=>a.id===id)!;return{id,floor:Math.max(-1,...(r.lessonActivities??[]).filter(a=>a.sourceInstanceId===d.sourceInstanceId&&Number.isSafeInteger(a.revision)).map(a=>a.revision)),revision:null,token:null};}
export function selectTi005(s:Ti005Session,n:number|null,r:AnimationRendererProps):Ti005Session{if(!permitted(s,r)||!s.cardsEnabled||s.helpOpen||n!==null&&(!data.cards.some(c=>c.number===n)||s.matched.includes(n)))return s;return s.selected===n?s:{...s,selected:n};}
export function matchTi005(s:Ti005Session,n:number,target:number|null,r:AnimationRendererProps):Ti005Session{
 const card=data.cards.find(c=>c.number===n);if(!permitted(s,r)||!s.cardsEnabled||s.helpOpen||!card||s.matched.includes(n)||!r.onLessonFrameRequest||!r.onLessonActivityCancel)return s;
 const correct=card.correct&&target===n;
 if(correct){const coach=binding('ti005-coach',r);if(r.onLessonActivityRequest?.({id:coach.id,parentFrame:64})!==true)return s;return{...s,matched:[...s.matched,n],selected:null,cardsEnabled:false,helpEnabled:false,coach,focus:'feedback'};}
 const hint=binding('ti005-help-hint',r),wrong=binding('ti005-wrong',r);if(r.onLessonActivitiesRequest?.([{id:hint.id,parentFrame:64},{id:wrong.id,parentFrame:64}])!==true)return s;
 return{...s,selected:null,cardsEnabled:false,helpEnabled:false,wrongVisible:true,hint,wrong,focus:'wrong'};
}
export function finishTi005(s:Ti005Session,r:AnimationRendererProps):Ti005Session{
 if(!permitted(s,r))return s;const all=r.lessonActivities??[];
 const final=observeTi005(s.final,all);if(s.final?.revision!==null&&final.complete){if(r.onLessonFrameRequest?.({fromFrame:64,toFrame:65,stopFrame:65})!==true)return s;return{...s,continued:true,final:null,cardsEnabled:false,helpEnabled:false,focus:'replay'};}
 const coach=observeTi005(s.coach,all);if(s.coach&&s.coach.revision!==null&&coach.complete){if(s.matched.length>=6){const next=binding('ti005-final',r);if(r.onLessonActivityRequest?.({id:next.id,parentFrame:64})!==true)return s;return{...s,coach:null,final:next,cardsEnabled:false,helpEnabled:true,focus:'feedback'};}return{...s,coach:null,cardsEnabled:true,helpEnabled:true,focus:'card-'+data.cards.find(c=>!s.matched.includes(c.number))!.number};}
 if(s.hint&&observeTi005(s.hint,all).complete)return{...s,hint:null};
 if(s.wrong&&!s.wrongVisible&&observeTi005(s.wrong,all).complete)return{...s,wrong:null};
 return s;
}
export function closeWrongTi005(s:Ti005Session,r:AnimationRendererProps):Ti005Session{if(!permitted(s,r)||!s.wrongVisible||s.helpOpen||!observeTi005(s.wrong,r.lessonActivities??[]).bound)return s;return{...s,wrongVisible:false,cardsEnabled:true,helpEnabled:true,focus:'card-'+data.cards.find(c=>!s.matched.includes(c.number))!.number};}
export function openHelpTi005(s:Ti005Session,r:AnimationRendererProps):Ti005Session{if(!identityAllowed(s,r)||!s.helpEnabled||s.helpOpen)return s;return{...s,helpOpen:true,cardsEnabled:false,helpEnabled:false,selected:null,focus:'help'};}
export function closeHelpTi005(s:Ti005Session,r:AnimationRendererProps):Ti005Session{if(!identityAllowed(s,r)||!s.helpOpen)return s;return{...s,helpOpen:false,cardsEnabled:true,helpEnabled:true,focus:'help-button'};}
export function cancelTi005(s:Ti005Session,r:AnimationRendererProps){for(const b of[s.coach,s.wrong,s.final,s.hint]){const seen=observeTi005(b,r.lessonActivities??[]);if(seen.bound&&seen.activity?.cancellationToken)r.onLessonActivityCancel?.({id:seen.activity.id,sourceInstanceId:seen.activity.sourceInstanceId,revision:seen.activity.revision,cancellationToken:seen.activity.cancellationToken,parentFrame:r.frame});}}
export function ti005Values(frame:number,s=createTi005(),all:readonly LessonTextActivitySnapshot[]=[]){return Object.fromEntries(TI005_BINDING.blocks.map(b=>{
 let visible=false,text=(data.text as Record<string,string>)[b.id];
 if(b.id==='title')visible=true;
 else if(b.id==='step')visible=ti005Alpha(data.stepCurve,frame)>0;
 else if(b.id==='instruction'){text=data.prompt.tokens.filter(t=>ti005At<number>(t.alpha,frame)>0).map(t=>t.text).join('');visible=Boolean(text.trim());}
 else if(b.id.startsWith('card-')){const card=data.cards.find(c=>'card-'+c.number===b.id)!;visible=ti005Alpha(card.curve,frame)>0&&!s.matched.includes(card.number);}
 else if(b.id.startsWith('target-'))visible=frame>=64&&s.matched.includes(Number(b.id.slice(7)));
 else if(b.id==='help')visible=ti005Alpha(data.helpCurve,frame)>0;
 else if(b.id==='wrong'||b.id==='wrong-close')visible=frame===64&&s.wrongVisible&&observeTi005(s.wrong,all).bound;
 else if(b.id==='correct')visible=frame===64&&observeTi005(s.final,all).bound;
 else if(b.id.startsWith('help-'))visible=frame===64&&s.helpOpen;
 return[b.id,{text,visible}];}));}
export function ti005Snapshot(state:SourceStaticCanvasFrameState,r:RuntimeContext,s=createTi005(r.seed,r.replay??0),all:readonly LessonTextActivitySnapshot[]=[]){const snapshot=buildLessonTextSnapshot(TI005_BINDING,r,ti005Values(r.frame,s,all)),valid=state.status==='ready'&&state.animationId===data.animationId&&state.sourceSwfSha256===data.sourceSwfSha256&&state.frame===r.frame&&Number.isInteger(r.frame)&&r.frame>=1&&r.frame<=65&&state.frameDomain===data.frameDomain&&(r.frameDomain??data.frameDomain)===data.frameDomain&&state.rootFrame===6&&(r.rootFrame??6)===6&&state.language==='en'&&r.lang==='en'&&state.scenario==='source-static-frame'&&r.scenario===state.scenario&&state.seed===(r.seed>>>0)&&!r.entryStateSha256;return valid?snapshot:{...snapshot,status:'blocked'as const,blockers:['exact-source-runtime-identity-mismatch'],blocks:snapshot.blocks.map(b=>({...b,visible:false}))};}
