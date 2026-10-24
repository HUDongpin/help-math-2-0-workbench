import type{AnimationRendererProps,RuntimeContext}from'../../contract';
import type{LessonTextActivityDefinition,LessonTextActivitySnapshot,LessonTextBinding}from'../../lesson-text-contract';
import{buildLessonTextSnapshot}from'../../lesson-text-snapshot';
import type{SourceStaticCanvasFrameState}from'../../source-static-canvas-candidate';
import data from'./source.generated.json';
export const TI006_SOURCE=data;
export const TI006_BINDING=data.binding as unknown as LessonTextBinding;
export const TI006_ACTIVITIES=data.activities as unknown as readonly LessonTextActivityDefinition[];
export type Ti006Activity=Readonly<{id:string;floor:number;revision:number|null;token:string|null}>;
export type Ti006Session=Readonly<{seed:number;replay:number;lastFrame:number;matched:readonly number[];selected:number|null;cardsEnabled:boolean;helpEnabled:boolean;helpOpen:boolean;wrongVisible:boolean;continued:boolean;coach:Ti006Activity|null;wrong:Ti006Activity|null;final:Ti006Activity|null;hint:Ti006Activity|null;focus:string|null}>;
export function createTi006(seed=0,replay=0):Ti006Session{return{seed:seed>>>0,replay,lastFrame:1,matched:[],selected:null,cardsEnabled:true,helpEnabled:true,helpOpen:false,wrongVisible:false,continued:false,coach:null,wrong:null,final:null,hint:null,focus:null};}
export function synchronizeTi006(s:Ti006Session,r:RuntimeContext):Ti006Session{if(s.seed!==(r.seed>>>0)||s.replay!==(r.replay??0)||r.frame<s.lastFrame)return{...createTi006(r.seed,r.replay??0),lastFrame:r.frame};return s.lastFrame===r.frame?s:{...s,lastFrame:r.frame,...r.frame===155?{helpOpen:false,wrongVisible:false,cardsEnabled:false,helpEnabled:false}:{}};}
export function ti006At<T>(curve:readonly unknown[],frame:number):T{let result=(curve[0]as[number,T])[1];for(const row of curve){const[f,v]=row as[number,T];if(f>frame)break;result=v;}return result;}
export type SourcePlacement={character:number;instance:string;matrix:number[];alpha:number};
export function ti006Alpha(curve:readonly unknown[],frame:number){return Math.max(0,...ti006At<SourcePlacement[]>(curve,frame).map(v=>v.alpha));}
export function observeTi006(b:Ti006Activity|null,all:readonly LessonTextActivitySnapshot[]){const definition=TI006_ACTIVITIES.find(a=>a.id===b?.id),matches=all.filter(a=>definition&&(a.id===definition.id||a.sourceInstanceId===definition.sourceInstanceId)),activity=matches.length===1?matches[0]:undefined,bound=Boolean(b&&definition&&activity&&activity.id===definition.id&&activity.sourceInstanceId===definition.sourceInstanceId&&activity.frameDomain===definition.frameDomain&&Number.isSafeInteger(activity.revision)&&activity.revision>b.floor&&(b.revision===null||b.revision===activity.revision)&&Boolean(activity.cancellationToken)&&(b.token===null||b.token===activity.cancellationToken)&&Number.isInteger(activity.frame)&&activity.frame>=definition.startFrame&&activity.frame<=definition.endFrame&&(activity.status==='playing'||activity.status==='completed'));return{definition,activity,bound,complete:bound&&activity!.status==='completed'&&activity!.frame===definition!.endFrame};}
export function bindTi006(s:Ti006Session,all:readonly LessonTextActivitySnapshot[]):Ti006Session{let next=s;for(const key of['coach','wrong','final','hint']as const){const b=next[key],seen=observeTi006(b,all);if(b&&b.revision===null&&seen.bound)next={...next,[key]:{...b,revision:seen.activity!.revision,token:seen.activity!.cancellationToken!}};}return next;}
const identityAllowed=(s:Ti006Session,r:AnimationRendererProps)=>r.lang==='en'&&r.scenario==='source-static-frame'&&!r.entryStateSha256&&(r.rootFrame??6)===6&&(r.frameDomain??data.frameDomain)===data.frameDomain&&r.frame===154&&(r.seed>>>0)===s.seed&&(r.replay??0)===s.replay&&!s.continued;
const permitted=(s:Ti006Session,r:AnimationRendererProps)=>identityAllowed(s,r)&&!r.paused;
function binding(id:string,r:AnimationRendererProps):Ti006Activity{const d=TI006_ACTIVITIES.find(a=>a.id===id)!;return{id,floor:Math.max(-1,...(r.lessonActivities??[]).filter(a=>a.sourceInstanceId===d.sourceInstanceId&&Number.isSafeInteger(a.revision)).map(a=>a.revision)),revision:null,token:null};}
export function selectTi006(s:Ti006Session,n:number|null,r:AnimationRendererProps):Ti006Session{if(!permitted(s,r)||!s.cardsEnabled||s.helpOpen||n!==null&&(!data.cards.some(c=>c.number===n)||s.matched.includes(n)))return s;return s.selected===n?s:{...s,selected:n};}
export function matchTi006(s:Ti006Session,n:number,target:number|null,r:AnimationRendererProps):Ti006Session{
 const card=data.cards.find(c=>c.number===n);if(!permitted(s,r)||!s.cardsEnabled||s.helpOpen||!card||s.matched.includes(n)||!r.onLessonFrameRequest||!r.onLessonActivityCancel)return s;
 const correct=card.correct&&target===n;
 if(correct){const coach=binding('ti006-coach',r);if(r.onLessonActivityRequest?.({id:coach.id,parentFrame:154})!==true)return s;return{...s,matched:[...s.matched,n],selected:null,cardsEnabled:false,helpEnabled:false,coach,focus:'feedback'};}
 const hint=binding('ti006-help-hint',r),wrong=binding('ti006-wrong',r);if(r.onLessonActivitiesRequest?.([{id:hint.id,parentFrame:154},{id:wrong.id,parentFrame:154}])!==true)return s;
 return{...s,selected:null,cardsEnabled:false,helpEnabled:false,wrongVisible:true,hint,wrong,focus:'wrong'};
}
export function finishTi006(s:Ti006Session,r:AnimationRendererProps):Ti006Session{
 if(!permitted(s,r))return s;const all=r.lessonActivities??[];
 const final=observeTi006(s.final,all);if(s.final?.revision!==null&&final.complete){if(r.onLessonFrameRequest?.({fromFrame:154,toFrame:155,stopFrame:155})!==true)return s;return{...s,continued:true,final:null,cardsEnabled:false,helpEnabled:false,focus:'replay'};}
 const coach=observeTi006(s.coach,all);if(s.coach&&s.coach.revision!==null&&coach.complete){if(s.matched.length>=4){const next=binding('ti006-final',r);if(r.onLessonActivityRequest?.({id:next.id,parentFrame:154})!==true)return s;return{...s,coach:null,final:next,cardsEnabled:false,helpEnabled:true,focus:'feedback'};}return{...s,coach:null,cardsEnabled:true,helpEnabled:true,focus:'card-'+data.cards.find(c=>!s.matched.includes(c.number))!.number};}
 if(s.hint&&observeTi006(s.hint,all).complete)return{...s,hint:null};
 if(s.wrong&&!s.wrongVisible&&observeTi006(s.wrong,all).complete)return{...s,wrong:null};
 return s;
}
export function closeWrongTi006(s:Ti006Session,r:AnimationRendererProps):Ti006Session{if(!permitted(s,r)||!s.wrongVisible||s.helpOpen||!observeTi006(s.wrong,r.lessonActivities??[]).bound)return s;return{...s,wrongVisible:false,cardsEnabled:true,helpEnabled:true,focus:'card-'+data.cards.find(c=>!s.matched.includes(c.number))!.number};}
export function openHelpTi006(s:Ti006Session,r:AnimationRendererProps):Ti006Session{if(!identityAllowed(s,r)||!s.helpEnabled||s.helpOpen)return s;return{...s,helpOpen:true,cardsEnabled:false,helpEnabled:false,selected:null,focus:'help'};}
export function closeHelpTi006(s:Ti006Session,r:AnimationRendererProps):Ti006Session{if(!identityAllowed(s,r)||!s.helpOpen)return s;return{...s,helpOpen:false,cardsEnabled:true,helpEnabled:true,focus:'help-button'};}
export function cancelTi006(s:Ti006Session,r:AnimationRendererProps){for(const b of[s.coach,s.wrong,s.final,s.hint]){const seen=observeTi006(b,r.lessonActivities??[]);if(seen.bound&&seen.activity?.cancellationToken)r.onLessonActivityCancel?.({id:seen.activity.id,sourceInstanceId:seen.activity.sourceInstanceId,revision:seen.activity.revision,cancellationToken:seen.activity.cancellationToken,parentFrame:r.frame});}}
export function ti006Values(frame:number,s=createTi006(),all:readonly LessonTextActivitySnapshot[]=[]){return Object.fromEntries(TI006_BINDING.blocks.map(b=>{
 let visible=false,text=(data.text as Record<string,string>)[b.id];
 if(b.id==='title')visible=true;
 else if(b.id==='step')visible=ti006Alpha(data.stepCurve,frame)>0;
 else if(data.prompts.some(p=>p.id===b.id)){const prompt=data.prompts.find(p=>p.id===b.id)!;text=prompt.tokens.filter(t=>ti006At<number>(t.alpha,frame)>0).map(t=>t.text).join('');visible=Boolean(text.trim());}
 else if(b.id==='expression-header'||b.id==='value-header'||b.id.startsWith('expression-'))visible=ti006Alpha(data.boardCurve,frame)>0;
 else if(b.id.startsWith('card-')){const card=data.cards.find(c=>'card-'+c.number===b.id)!;visible=ti006Alpha(card.curve,frame)>0&&!s.matched.includes(card.number)&&!(card.number===4&&frame>=86&&frame<=106);}
 else if(b.id.startsWith('target-'))visible=frame>=154&&s.matched.includes(Number(b.id.slice(7)))||b.id==='target-4'&&frame>=86&&frame<=106;
 else if(b.id==='help')visible=ti006Alpha(data.helpCurve,frame)>0;
 else if(b.id==='wrong'||b.id==='wrong-close')visible=frame===154&&s.wrongVisible&&observeTi006(s.wrong,all).bound;
 else if(b.id==='correct')visible=frame===154&&observeTi006(s.final,all).bound;
 else if(b.id.startsWith('help-'))visible=frame===154&&s.helpOpen;
 return[b.id,{text,visible}];}));}
export function ti006Snapshot(state:SourceStaticCanvasFrameState,r:RuntimeContext,s=createTi006(r.seed,r.replay??0),all:readonly LessonTextActivitySnapshot[]=[]){const snapshot=buildLessonTextSnapshot(TI006_BINDING,r,ti006Values(r.frame,s,all)),valid=state.status==='ready'&&state.animationId===data.animationId&&state.sourceSwfSha256===data.sourceSwfSha256&&state.frame===r.frame&&Number.isInteger(r.frame)&&r.frame>=1&&r.frame<=155&&state.frameDomain===data.frameDomain&&(r.frameDomain??data.frameDomain)===data.frameDomain&&state.rootFrame===6&&(r.rootFrame??6)===6&&state.language==='en'&&r.lang==='en'&&state.scenario==='source-static-frame'&&r.scenario===state.scenario&&state.seed===(r.seed>>>0)&&!r.entryStateSha256;return valid?snapshot:{...snapshot,status:'blocked'as const,blockers:['exact-source-runtime-identity-mismatch'],blocks:snapshot.blocks.map(b=>({...b,visible:false}))};}
