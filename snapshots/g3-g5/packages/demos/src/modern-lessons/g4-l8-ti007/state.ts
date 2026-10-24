import type{AnimationRendererProps,RuntimeContext}from'../../contract';
import type{LessonTextActivityDefinition,LessonTextActivitySnapshot,LessonTextBinding}from'../../lesson-text-contract';
import{buildLessonTextSnapshot}from'../../lesson-text-snapshot';
import type{SourceStaticCanvasFrameState}from'../../source-static-canvas-candidate';
import data from'./source.generated.json';
export const TI007_SOURCE=data;
export const TI007_BINDING=data.binding as unknown as LessonTextBinding;
export const TI007_ACTIVITIES=data.activities as unknown as readonly LessonTextActivityDefinition[];
export type Ti007Activity=Readonly<{id:string;floor:number;revision:number|null;token:string|null}>;
export type Ti007Session=Readonly<{seed:number;replay:number;lastFrame:number;matched:readonly number[];placed:Readonly<Record<number,number>>;selected:number|null;cardsEnabled:boolean;helpEnabled:boolean;helpOpen:boolean;wrongVisible:boolean;continued:boolean;coach:Ti007Activity|null;wrong:Ti007Activity|null;final:Ti007Activity|null;hint:Ti007Activity|null;focus:string|null}>;
export function createTi007(seed=0,replay=0):Ti007Session{return{seed:seed>>>0,replay,lastFrame:1,matched:[],placed:{},selected:null,cardsEnabled:true,helpEnabled:true,helpOpen:false,wrongVisible:false,continued:false,coach:null,wrong:null,final:null,hint:null,focus:null};}
export function synchronizeTi007(s:Ti007Session,r:RuntimeContext):Ti007Session{if(s.seed!==(r.seed>>>0)||s.replay!==(r.replay??0)||r.frame<s.lastFrame)return{...createTi007(r.seed,r.replay??0),lastFrame:r.frame};return s.lastFrame===r.frame?s:{...s,lastFrame:r.frame,...r.frame===95?{helpOpen:false,wrongVisible:false,cardsEnabled:false,helpEnabled:false}:{}};}
export function ti007At<T>(curve:readonly unknown[],frame:number):T{let result=(curve[0]as[number,T])[1];for(const row of curve){const[f,v]=row as[number,T];if(f>frame)break;result=v;}return result;}
export type SourcePlacement={character:number;instance:string;matrix:number[];alpha:number};
export function ti007Alpha(curve:readonly unknown[],frame:number){return Math.max(0,...ti007At<SourcePlacement[]>(curve,frame).map(v=>v.alpha));}
export function observeTi007(b:Ti007Activity|null,all:readonly LessonTextActivitySnapshot[]){const definition=TI007_ACTIVITIES.find(a=>a.id===b?.id),matches=all.filter(a=>definition&&(a.id===definition.id||a.sourceInstanceId===definition.sourceInstanceId)),activity=matches.length===1?matches[0]:undefined,bound=Boolean(b&&definition&&activity&&activity.id===definition.id&&activity.sourceInstanceId===definition.sourceInstanceId&&activity.frameDomain===definition.frameDomain&&Number.isSafeInteger(activity.revision)&&activity.revision>b.floor&&(b.revision===null||b.revision===activity.revision)&&Boolean(activity.cancellationToken)&&(b.token===null||b.token===activity.cancellationToken)&&Number.isInteger(activity.frame)&&activity.frame>=definition.startFrame&&activity.frame<=definition.endFrame&&(activity.status==='playing'||activity.status==='completed'));return{definition,activity,bound,complete:bound&&activity!.status==='completed'&&activity!.frame===definition!.endFrame};}
export function bindTi007(s:Ti007Session,all:readonly LessonTextActivitySnapshot[]):Ti007Session{let next=s;for(const key of['coach','wrong','final','hint']as const){const b=next[key],seen=observeTi007(b,all);if(b&&b.revision===null&&seen.bound)next={...next,[key]:{...b,revision:seen.activity!.revision,token:seen.activity!.cancellationToken!}};}return next;}
const identityAllowed=(s:Ti007Session,r:AnimationRendererProps)=>r.lang==='en'&&r.scenario==='source-static-frame'&&!r.entryStateSha256&&(r.rootFrame??6)===6&&(r.frameDomain??data.frameDomain)===data.frameDomain&&r.frame===94&&(r.seed>>>0)===s.seed&&(r.replay??0)===s.replay&&!s.continued;
const permitted=(s:Ti007Session,r:AnimationRendererProps)=>identityAllowed(s,r)&&!r.paused;
function binding(id:string,r:AnimationRendererProps):Ti007Activity{const d=TI007_ACTIVITIES.find(a=>a.id===id)!;return{id,floor:Math.max(-1,...(r.lessonActivities??[]).filter(a=>a.sourceInstanceId===d.sourceInstanceId&&Number.isSafeInteger(a.revision)).map(a=>a.revision)),revision:null,token:null};}
export function selectTi007(s:Ti007Session,n:number|null,r:AnimationRendererProps):Ti007Session{if(!permitted(s,r)||!s.cardsEnabled||s.helpOpen||n!==null&&(!data.cards.some(c=>c.number===n)||s.matched.includes(n)))return s;return s.selected===n?s:{...s,selected:n};}
export function matchTi007(s:Ti007Session,n:number,target:number|null,r:AnimationRendererProps):Ti007Session{
 const card=data.cards.find(c=>c.number===n);if(!permitted(s,r)||!s.cardsEnabled||s.helpOpen||!card||s.matched.includes(n)||!r.onLessonFrameRequest||!r.onLessonActivityCancel)return s;
 const correct=target!==null&&card.targets.includes(target)&&s.placed[target]===undefined;
 if(correct){const coach=binding('ti007-coach',r);if(r.onLessonActivityRequest?.({id:coach.id,parentFrame:94})!==true)return s;return{...s,matched:[...s.matched,n],placed:{...s.placed,[target!]:n},selected:null,cardsEnabled:false,helpEnabled:false,coach,focus:'feedback'};}
 const hint=binding('ti007-help-hint',r),wrong=binding('ti007-wrong',r);if(r.onLessonActivitiesRequest?.([{id:hint.id,parentFrame:94},{id:wrong.id,parentFrame:94}])!==true)return s;
 return{...s,selected:null,cardsEnabled:false,helpEnabled:false,wrongVisible:true,hint,wrong,focus:'wrong'};
}
export function finishTi007(s:Ti007Session,r:AnimationRendererProps):Ti007Session{
 if(!permitted(s,r))return s;const all=r.lessonActivities??[];
 const final=observeTi007(s.final,all);if(s.final?.revision!==null&&final.complete){if(r.onLessonFrameRequest?.({fromFrame:94,toFrame:95,stopFrame:95})!==true)return s;return{...s,continued:true,final:null,cardsEnabled:false,helpEnabled:false,focus:'replay'};}
 const coach=observeTi007(s.coach,all);if(s.coach&&s.coach.revision!==null&&coach.complete){if(s.matched.length>=4){const next=binding('ti007-final',r);if(r.onLessonActivityRequest?.({id:next.id,parentFrame:94})!==true)return s;return{...s,coach:null,final:next,cardsEnabled:false,helpEnabled:true,focus:'feedback'};}return{...s,coach:null,cardsEnabled:true,helpEnabled:true,focus:'card-'+data.cards.find(c=>!s.matched.includes(c.number))!.number};}
 if(s.hint&&observeTi007(s.hint,all).complete)return{...s,hint:null};
 if(s.wrong&&!s.wrongVisible&&observeTi007(s.wrong,all).complete)return{...s,wrong:null};
 return s;
}
export function closeWrongTi007(s:Ti007Session,r:AnimationRendererProps):Ti007Session{if(!permitted(s,r)||!s.wrongVisible||s.helpOpen||!observeTi007(s.wrong,r.lessonActivities??[]).bound)return s;return{...s,wrongVisible:false,cardsEnabled:true,helpEnabled:true,focus:'card-'+data.cards.find(c=>!s.matched.includes(c.number))!.number};}
export function openHelpTi007(s:Ti007Session,r:AnimationRendererProps):Ti007Session{if(!identityAllowed(s,r)||!s.helpEnabled||s.helpOpen)return s;return{...s,helpOpen:true,cardsEnabled:false,helpEnabled:false,selected:null,focus:'help'};}
export function closeHelpTi007(s:Ti007Session,r:AnimationRendererProps):Ti007Session{if(!identityAllowed(s,r)||!s.helpOpen)return s;return{...s,helpOpen:false,cardsEnabled:true,helpEnabled:true,focus:'help-button'};}
export function cancelTi007(s:Ti007Session,r:AnimationRendererProps){for(const b of[s.coach,s.wrong,s.final,s.hint]){const seen=observeTi007(b,r.lessonActivities??[]);if(seen.bound&&seen.activity?.cancellationToken)r.onLessonActivityCancel?.({id:seen.activity.id,sourceInstanceId:seen.activity.sourceInstanceId,revision:seen.activity.revision,cancellationToken:seen.activity.cancellationToken,parentFrame:r.frame});}}
export function ti007Expression(row:typeof data.rows[number],s:Ti007Session){return row.tokens.map(token=>'target'in token&&token.target!==undefined?(s.placed[token.target]!==undefined?data.targets.find(t=>t.number===token.target)!.text:''):(token as{text:string}).text).join('');}
export function ti007Values(frame:number,s=createTi007(),all:readonly LessonTextActivitySnapshot[]=[]){return Object.fromEntries(TI007_BINDING.blocks.map(b=>{
 let visible=false,text=(data.text as Record<string,string>)[b.id];
 if(b.id==='title')visible=true;
 else if(b.id==='step')visible=ti007Alpha(data.stepCurve,frame)>0;
 else if(data.prompts.some(p=>p.id===b.id)){const prompt=data.prompts.find(p=>p.id===b.id)!;text=prompt.tokens.filter(t=>ti007At<number>(t.alpha,frame)>0).map(t=>t.text).join('');visible=Boolean(text.trim());}
 else if(b.id==='expression-header'||b.id==='value-header'||b.id.startsWith('value-'))visible=ti007Alpha(data.boardCurve,frame)>0;
 else if(b.id.startsWith('expression-')){const row=data.rows.find(v=>'expression-'+v.number===b.id)!;text=ti007Expression(row,s);visible=ti007Alpha(data.boardCurve,frame)>0;}
 else if(b.id.startsWith('card-')){const card=data.cards.find(c=>'card-'+c.number===b.id)!;visible=ti007Alpha(card.curve,frame)>0&&!s.matched.includes(card.number);}
 else if(b.id==='help')visible=ti007Alpha(data.helpCurve,frame)>0;
 else if(b.id==='wrong'||b.id==='wrong-close')visible=frame===94&&s.wrongVisible&&observeTi007(s.wrong,all).bound;
 else if(b.id==='correct')visible=frame===94&&observeTi007(s.final,all).bound;
 else if(b.id.startsWith('help-'))visible=frame===94&&s.helpOpen;
 return[b.id,{text,visible}];}));}
export function ti007Snapshot(state:SourceStaticCanvasFrameState,r:RuntimeContext,s=createTi007(r.seed,r.replay??0),all:readonly LessonTextActivitySnapshot[]=[]){const snapshot=buildLessonTextSnapshot(TI007_BINDING,r,ti007Values(r.frame,s,all)),valid=state.status==='ready'&&state.animationId===data.animationId&&state.sourceSwfSha256===data.sourceSwfSha256&&state.frame===r.frame&&Number.isInteger(r.frame)&&r.frame>=1&&r.frame<=95&&state.frameDomain===data.frameDomain&&(r.frameDomain??data.frameDomain)===data.frameDomain&&state.rootFrame===6&&(r.rootFrame??6)===6&&state.language==='en'&&r.lang==='en'&&state.scenario==='source-static-frame'&&r.scenario===state.scenario&&state.seed===(r.seed>>>0)&&!r.entryStateSha256;return valid?snapshot:{...snapshot,status:'blocked'as const,blockers:['exact-source-runtime-identity-mismatch'],blocks:snapshot.blocks.map(b=>({...b,visible:false}))};}
