'use client';
import React,{useEffect,useLayoutEffect,useRef,useState} from 'react';
import type {AnimationRendererProps,AudioCue,RuntimeContext} from '../contract';
import type {LessonTextActivityDefinition,LessonTextActivitySnapshot,LessonTextBinding,LessonTextPresentationCapability,TextPresentationSnapshot} from '../lesson-text-contract';
import type {SourceStaticCanvasFrameState} from '../source-static-canvas-candidate';
import {validateLessonTextBinding} from '../lesson-text-snapshot';
import {LessonSourceButton} from '../lesson-source-button';
import {getCourseG04L03Vb003FrameState} from '../modules/course-g04-l03-vb-003';
import {createCourseG04L03Vb003InteractionState as createQuiz,reduceCourseG04L03Vb003Interaction as reduce,type CourseG04L03Vb003InteractionState as Quiz,type CourseG04L03Vb003ItemId as ItemId} from '../timelines/course-g04-l03-vb-003-interaction';
import {SourceChoiceText} from './source-six-question-choice';
import {G4_L3_VB003_NATIVE_CONFIG} from './generated/g4-l3-vb003-native-config';

type Alpha=readonly Readonly<{frame:number;alpha:number}>[];
export interface Vb003NativeConfig {
 readonly animationId:string;readonly placementId:string;readonly sourceSwfSha256:string;readonly rootFrame:6;readonly frameDomain:'sprite-106';readonly frameCount:160;readonly holdFrame:116;readonly fps:12;readonly title:string;
 readonly binding:LessonTextBinding;readonly text:Readonly<Record<string,string>>;
 readonly ticks:readonly Readonly<{value:number;literal:string;sourceTextCharacters:readonly number[];sourceInstance:string;sourceXTwips:number}>[];
 readonly cards:readonly Readonly<{id:ItemId;sourceLiteral:string;value:number;sourceInstance:string;sourceSprite:number;sourceTextCharacters:readonly number[];targetInstance:string;targetSprite:number;sourceStagePointPixels:readonly number[];targetStagePointPixels:readonly number[]}>[];
 readonly alpha:Readonly<{panel:Alpha;axis:Alpha;instruction:Alpha}>;
 readonly fixedDemo:Readonly<{literal:string;value:-7;staticFirstFrame:number;moveFirstFrame:number;placedFirstFrame:number;positions:readonly Readonly<{frame:number;xTwips:number;yTwips:number}>[];annotationWindows:readonly(readonly[number,number])[]}>;
 readonly term:Readonly<{keyAttribute:string;entryId:string;firstFrame:number;lastFrameExclusive:number;buttonCharacter:number}>;
 readonly activities:readonly LessonTextActivityDefinition[];readonly sourceEvents:readonly unknown[];readonly sourceTextDispositions:readonly unknown[];readonly sourceRisks:readonly unknown[];
 readonly sourceAudio:AudioCue & Readonly<{sha256:string;manualNarration:false}>;
}
const C:Vb003NativeConfig=G4_L3_VB003_NATIVE_CONFIG;
validateLessonTextBinding(C.binding);
type Pending=Readonly<{id:'vb003-wrong'|'vb003-coach'|'vb003-final';floor:number;revision:number|null;cancellationToken:string|null}>;
export interface Vb003Session {readonly seed:number;readonly replay:number;readonly quiz:Quiz;readonly pending:Pending|null;readonly continued:boolean;readonly focus:ItemId|null;readonly completedCoach:LessonTextActivitySnapshot|null;}
export const createVb003Session=(seed=0,replay=0):Vb003Session=>({seed:seed>>>0,replay,quiz:createQuiz(),pending:null,continued:false,focus:null,completedCoach:null});
const normalize=(frame:number)=>Math.min(160,Math.max(1,Math.floor(Number.isFinite(frame)?frame:1)));
const alphaAt=(samples:Alpha,frame:number)=>{let alpha=0;for(const p of samples){if(p.frame>frame)break;alpha=p.alpha;}return alpha;};
export function getVb003TeachingState(frame:number){
 frame=normalize(frame);const phase=frame<76?'origin':frame<86?'moving':'placed';
 return{frame,panelAlpha:alphaAt(C.alpha.panel,frame),axisAlpha:alphaAt(C.alpha.axis,frame),instructionAlpha:alphaAt(C.alpha.instruction,frame),phase,demoVisible:frame>=C.fixedDemo.staticFirstFrame,
 demoPosition:C.fixedDemo.positions.find(p=>p.frame===frame)??null,annotation:C.fixedDemo.annotationWindows.some(([a,b])=>frame>=a&&frame<b),interactive:frame===116};
}
const definition=(id:string)=>C.activities.find(d=>d.id===id)!;
const exact=(a:LessonTextActivitySnapshot,id:string)=>{const d=definition(id);return Boolean(d&&a.id===id&&a.sourceInstanceId===d.sourceInstanceId&&a.frameDomain===d.frameDomain&&Number.isSafeInteger(a.revision)&&a.revision>=0&&Number.isInteger(a.frame)&&a.frame>=d.startFrame&&a.frame<=d.endFrame);};
const activities=(r:AnimationRendererProps)=>r.lessonActivities??(r.lessonActivity?[r.lessonActivity]:[]);
export function observeVb003Feedback(session:Vb003Session,all:readonly LessonTextActivitySnapshot[]){
 const p=session.pending,d=p?definition(p.id):null;
 const matches=p?all.filter(a=>exact(a,p.id)&&a.revision>p.floor&&(p.revision===null||a.revision===p.revision)&&(p.cancellationToken===null||a.cancellationToken===p.cancellationToken)):[];
 const activity=matches.length===1?matches[0]:undefined;
 return{activity,definition:d,bound:Boolean(activity),wrong:Boolean(activity&&p?.id==='vb003-wrong'),final:Boolean(activity&&p?.id==='vb003-final'),complete:Boolean(activity&&activity.status==='completed'&&activity.frame===d?.endFrame)};
}
export function synchronizeVb003Session(session:Vb003Session,r:RuntimeContext,all:readonly LessonTextActivitySnapshot[]=[]):Vb003Session{
 if(session.seed!==(r.seed>>>0)||session.replay!==(r.replay??0)||(r.frameDomain??C.frameDomain)!==C.frameDomain||r.frame<116)return createVb003Session(r.seed,r.replay??0);
 if(r.frame!==116&&!session.continued)return createVb003Session(r.seed,r.replay??0);
 // A seek at the same numeric hold frame cancels the old clock token. A
 // merely pending asynchronous request is allowed to await its first snapshot.
 if(session.pending?.revision!==null&&session.pending&&!observeVb003Feedback(session,all).bound)return createVb003Session(r.seed,r.replay??0);
 // Completed child snapshots survive at the hold until a seek/Replay/removal.
 // A same-frame seek also clears the last admitted coach identity, even when
 // no feedback is pending. Preserve partial progress only in that exact epoch.
 if(!session.pending&&!session.continued&&session.completedCoach&&!all.some(a=>exact(a,'vb003-coach')&&a.revision===session.completedCoach!.revision&&a.cancellationToken===session.completedCoach!.cancellationToken))return createVb003Session(r.seed,r.replay??0);
 if(session.continued&&r.frame===116&&!session.pending)return session;
 return session;
}
const permitted=(s:Vb003Session,r:AnimationRendererProps)=>r.lang==='en'&&r.scenario==='source-static-frame'&&!r.entryStateSha256&&(r.frameDomain??C.frameDomain)===C.frameDomain&&(r.rootFrame===undefined||r.rootFrame===6)&&r.frame===116&&(r.seed>>>0)===s.seed&&(r.replay??0)===s.replay&&!r.paused;
const pending=(id:Pending['id'],r:AnimationRendererProps):Pending=>({id,floor:Math.max(-1,...activities(r).filter(a=>a.sourceInstanceId===definition(id).sourceInstanceId&&Number.isSafeInteger(a.revision)).map(a=>a.revision)),revision:null,cancellationToken:null});
export function selectVb003Card(s:Vb003Session,id:ItemId,r:AnimationRendererProps):Vb003Session{
 if(!permitted(s,r)||s.pending||s.continued)return s;const quiz=reduce(s.quiz,{type:'select-item',itemId:id});return quiz===s.quiz?s:{...s,quiz,focus:id};
}
/** Existing five-card reducer owns count. Host refusal commits no drop. */
export function dropVb003Card(s:Vb003Session,item:ItemId|undefined,target:ItemId|null,r:AnimationRendererProps):Vb003Session{
 if(!permitted(s,r)||s.pending||s.continued||!r.onLessonFrameRequest||!r.onLessonActivityCancel)return s;
 const quiz=reduce(s.quiz,{type:'drop-item',itemId:item,targetId:target});if(quiz===s.quiz)return s;
 const p=pending(quiz.mode==='wrong-feedback'?'vb003-wrong':'vb003-coach',r);
 if(r.onLessonActivityRequest?.({id:p.id,parentFrame:116})!==true)return s;
 return{...s,quiz,pending:p,focus:item??s.quiz.selectedItemId};
}
export function bindVb003Feedback(s:Vb003Session,r:AnimationRendererProps):Vb003Session{
 const a=observeVb003Feedback(s,activities(r)).activity;if(!a||!s.pending||s.pending.revision!==null||!a.cancellationToken)return s;
 return{...s,pending:{...s.pending,revision:a.revision,cancellationToken:a.cancellationToken}};
}
export function closeVb003Wrong(s:Vb003Session,r:AnimationRendererProps):Vb003Session{
 const seen=observeVb003Feedback(s,activities(r)),a=seen.activity;
 if(!permitted(s,r)||!seen.wrong||!a?.cancellationToken)return s;
 if(r.onLessonActivityCancel?.({id:a.id,sourceInstanceId:a.sourceInstanceId,revision:a.revision,cancellationToken:a.cancellationToken,parentFrame:116})!==true)return s;
 return{...s,quiz:reduce(s.quiz,{type:'close-wrong-feedback'}),pending:null};
}
export function finishVb003Feedback(s:Vb003Session,r:AnimationRendererProps):Vb003Session{
 const seen=observeVb003Feedback(s,activities(r));if(!permitted(s,r)||!seen.complete||!seen.activity||!s.pending||s.pending.revision!==seen.activity.revision||s.pending.cancellationToken!==seen.activity.cancellationToken)return s;
 if(s.pending.id==='vb003-coach'){
  const quiz=reduce(s.quiz,{type:'correct-feedback-finished'});
  if(quiz.mode==='completed'){
   const p=pending('vb003-final',r);if(r.onLessonActivityRequest?.({id:p.id,parentFrame:116})!==true)return s;
   return{...s,quiz,pending:p};
  }
  return{...s,quiz,pending:null,completedCoach:seen.activity,focus:C.cards.find(c=>!quiz.placedItemIds.includes(c.id))?.id??null};
 }
 if(s.pending.id==='vb003-final'){
  if(r.onLessonFrameRequest?.({fromFrame:116,toFrame:117,stopFrame:160})!==true)return s;
  return{...s,pending:null,continued:true};
 }
 return s; // Wrong16 is a hold, not an automatic retry or outro.
}
export function cancelVb003OwnedFeedback(s:Vb003Session,r:AnimationRendererProps){
 const a=observeVb003Feedback(s,activities(r)).activity;
 return Boolean(a?.cancellationToken&&r.onLessonActivityCancel?.({id:a.id,sourceInstanceId:a.sourceInstanceId,revision:a.revision,cancellationToken:a.cancellationToken,parentFrame:r.frame})===true);
}
export function getG4L3Vb003TextSnapshot(state:SourceStaticCanvasFrameState,context:RuntimeContext,stored=createVb003Session(context.seed,context.replay??0),all:readonly LessonTextActivitySnapshot[]=[]):TextPresentationSnapshot{
 const blockers:string[]=[];
 if(state.status!=='ready'||state.animationId!==C.animationId||state.sourceSwfSha256!==C.sourceSwfSha256)blockers.push('source-identity-mismatch');
 if(state.language!=='en'||context.lang!=='en')blockers.push('source-spanish-page-text-not-verified');
 if(state.scenario!=='source-static-frame'||context.scenario!=='source-static-frame'||context.entryStateSha256)blockers.push('original-renderer-required');
 if(state.frameDomain!==C.frameDomain||(context.frameDomain??C.frameDomain)!==C.frameDomain||state.rootFrame!==6||(context.rootFrame!==undefined&&context.rootFrame!==6)||state.frame!==context.frame||normalize(context.frame)!==context.frame||state.seed!==(context.seed>>>0))blockers.push('teaching-state-identity-mismatch');
 const s=synchronizeVb003Session(stored,context,all),seen=observeVb003Feedback(s,all),t=getVb003TeachingState(state.frame);
 const visible=(id:string)=>id==='root-title'?true:id==='instruction'?t.instructionAlpha>0:id.startsWith('tick-')?t.axisAlpha>0:id==='fixed-demo'?t.demoVisible:id==='demo-annotation'?t.annotation:id==='wrong-explanation'||id==='close'?seen.wrong:id==='final-correct'?seen.final:id.startsWith('card-')?t.axisAlpha>0&&!s.quiz.placedItemIds.includes(id.slice(5) as ItemId):id.startsWith('target-')?s.quiz.placedItemIds.includes(id.slice(7) as ItemId):false;
 return{schemaVersion:1,animationId:C.animationId,bindingVersion:C.binding.version,sourceSwfSha256:C.sourceSwfSha256,status:blockers.length?'blocked':'ready',blockers,identity:{frame:state.frame,frameDomain:state.frameDomain,rootFrame:state.rootFrame,scenario:state.scenario,language:state.language,seed:state.seed,replay:context.replay??0},suppressedInstances:[],blocks:blockers.length?[]:C.binding.blocks.map(b=>({id:b.id,role:b.role,language:b.language,readingOrder:b.readingOrder,text:C.text[b.id]??'',visible:visible(b.id)}))};
}
const CSS=`.vb003-native{container:vb003 / inline-size;min-inline-size:0;max-inline-size:70rem;margin:auto;padding:1rem;background:#fffdf8;color:#17273c;font:1.25rem/1.6 var(--lesson-font-body,system-ui,sans-serif)}.vb003-native *{box-sizing:border-box}.vb003-native .lesson-text-presentation__layout{font-size:var(--lesson-text-body-size)}.vb003-native .lesson-text-presentation__block--title{overflow-wrap:normal;word-break:normal;hyphens:none}.vb003-native [hidden]{display:none!important}.vb003-native p{margin:.7em 0}.vb003-native button{font:inherit;min-inline-size:44px;min-block-size:44px;cursor:pointer;touch-action:manipulation}.vb003-native button:disabled{cursor:default}.vb003-native button:focus-visible,.vb003-native [tabindex]:focus-visible{outline:3px solid #1757af;outline-offset:3px}.vb003-native__port{max-inline-size:100%;overflow-x:auto;overscroll-behavior-inline:contain;padding-block:1rem;}.vb003-native__axis{position:relative;inline-size:58em;block-size:9em;margin-inline:2em}.vb003-native__geometry{position:absolute;inset:3em 0 auto;inline-size:100%;block-size:.5em;overflow:visible}.vb003-native__tick{position:absolute;inset-block-start:2em;transform:translateX(-50%);text-align:center}.vb003-native__tick:before{content:'';display:block;position:absolute;inset-block-start:.8em;inset-inline-start:50%;block-size:.5em;inline-size:2px;background:#17273c}.vb003-native__atomic{display:inline-block;white-space:nowrap;word-break:normal;overflow-wrap:normal;font-variant-numeric:tabular-nums;}.vb003-native .six-choice-modern__numeric-token{display:inline-block;white-space:nowrap}.vb003-native__tick>span{display:block;margin-block-start:1.5em}.vb003-native__target{display:block;min-inline-size:2.6em!important;border:2px dashed #7389a3;border-radius:.5rem;background:#fff;margin:.6em auto 0;min-block-size:1.6em!important}.vb003-native__target[data-occupied=true]{border-style:solid;background:#edf8ef}.vb003-native__cards{display:flex;gap:.7rem;flex-wrap:wrap;margin-block:.8rem}.vb003-native__card{background:white;border:2px solid #4f7299;border-radius:.5rem;padding:.4rem .75rem}.vb003-native__card[aria-pressed=true]{background:#e5f1ff;border-color:#1757af}.vb003-native__demo{position:absolute;inset-block-start:0;transform:translateX(-50%);border:2px solid #286b45;border-radius:.5rem;background:#eff9f2;padding:.15rem .5rem}.vb003-native__term{padding:0 .05em;border:0;background:none;color:#1757af;text-decoration:underline;text-underline-offset:.15em}.vb003-native__dialog{border:2px solid #9d4d36;border-radius:.8rem;background:#fff4ef;padding:1rem;scroll-margin-block-start:calc(var(--lesson-platform-header-height,0px) + 1rem)}.vb003-native__action{border:1px solid #1757af;border-radius:.5rem;background:#1757af;color:#fff;padding:.5rem 1rem}.vb003-native__feedback{border:2px solid #286b45;border-radius:.8rem;background:#eff9f2;padding:1rem}.vb003-native [data-source-alpha]{transition:none!important}@media(max-width:480px){.vb003-native{padding-inline:0}}`;
export function G4L3Vb003ModernRenderer(props:AnimationRendererProps){
 const context={...props,frameDomain:props.frameDomain??C.frameDomain},source=(props.state??getCourseG04L03Vb003FrameState(props.frame,context)) as SourceStaticCanvasFrameState;
 const [stored,setStored]=useState(()=>createVb003Session(props.seed,props.replay??0)),s=synchronizeVb003Session(stored,context,activities(props)),seen=observeVb003Feedback(s,activities(props)),snapshot=getG4L3Vb003TextSnapshot(source,context,s,activities(props));
 const root=useRef<HTMLElement>(null),live=useRef(s),runtime=useRef(props),drag=useRef<{id:ItemId;released:boolean}|null>(null),port=useRef<HTMLDivElement>(null),manual=useRef(false);live.current=s;runtime.current=props;
 const commit=(next:Vb003Session)=>{if(next!==live.current){live.current=next;setStored(next);}};
 const ready=snapshot.status==='ready',t=getVb003TeachingState(source.frame),figurePresent=ready&&t.axisAlpha>0,locked=!ready||!!props.paused||source.frame!==116||!!s.pending||s.continued||!props.onLessonActivityRequest||!props.onLessonActivityCancel||!props.onLessonFrameRequest;
 useEffect(()=>{if(!ready||props.paused)return;const bound=bindVb003Feedback(s,props);if(bound!==s){commit(bound);return;}commit(finishVb003Feedback(s,props));},[ready,props,s]);
 useEffect(()=>()=>{cancelVb003OwnedFeedback(live.current,runtime.current);drag.current=null;},[props.seed,props.replay]);
 useLayoutEffect(()=>{manual.current=false;},[props.replay,t.phase]);
 // Figure appears after frame1: this dependency attaches ResizeObserver and
 // initial origin centering on its actual mount, not on unrelated every frame.
 useLayoutEffect(()=>{const p=port.current;if(!figurePresent||!p)return;const center=()=>{if(manual.current)return;const anchor=p.querySelector<HTMLElement>('[data-axis-value="'+(t.phase==='origin'?0:-7)+'"]');if(anchor){const a=anchor.getBoundingClientRect(),v=p.getBoundingClientRect();p.scrollLeft+=a.left+a.width/2-v.left-p.clientWidth/2;}};center();const observer=typeof ResizeObserver==='undefined'?null:new ResizeObserver(center);observer?.observe(p);return()=>observer?.disconnect();},[figurePresent,t.phase,props.replay]);
 useLayoutEffect(()=>{const key=seen.wrong?'wrong-dialog':source.frame===160?'replay':s.pending?'feedback':s.focus;const el=key?root.current?.querySelector<HTMLElement>('[data-vb003-focus="'+key+'"]'):null;el?.focus({preventScroll:true});if(seen.wrong)el?.scrollIntoView({block:'start',behavior:'instant'});},[seen.wrong,s.pending?.id,s.focus,source.frame===160,props.replay]);
 if(!ready)return null;
 const number=(text:string)=><span className="vb003-native__atomic"><SourceChoiceText text={text}/></span>;
 const drop=(id:ItemId|undefined,target:ItemId|null)=>{if(locked)return;commit(dropVb003Card(live.current,id,target,runtime.current));};
 const close=()=>commit(closeVb003Wrong(live.current,runtime.current));
 const selected=s.quiz.selectedItemId;
 const min=C.ticks[0].sourceXTwips,max=C.ticks[16].sourceXTwips,left=(value:number)=>100*(C.ticks.find(t=>t.value===value)!.sourceXTwips-min)/(max-min);
 const move=t.demoPosition?100*(t.demoPosition.xTwips-min)/(max-min):left(-7);
 return<section ref={root} className="vb003-native" lang="en" data-modern-text-page={C.animationId} data-lesson-frame={source.frame} data-lesson-replay={props.replay??0} data-flash-root-frame={source.rootFrame} data-flash-frame-domain={source.frameDomain} data-vb003-mode={s.pending?.id??(s.continued?'continuation':s.quiz.mode)} data-vb003-placed={s.quiz.placedItemIds.join(',')} data-feedback-activity-frame={seen.activity?.frame??''}
  onDragOver={event=>{if(drag.current&&!locked)event.preventDefault();}} onDrop={event=>{if(!drag.current)return;event.preventDefault();event.stopPropagation();drag.current.released=true;drop(drag.current.id,null);}}>
  <style>{CSS}</style><div className="lesson-text-presentation" lang="en"><div className="lesson-text-presentation__layout"><h2 className="lesson-text-presentation__block lesson-text-presentation__block--title" data-lesson-text-block="root-title">{C.title}</h2>
  {t.instructionAlpha>0&&<p data-lesson-text-block="instruction" data-source-alpha="instruction" style={{opacity:t.instructionAlpha}}>{'Drag and drop each number to its correct position on the '}<button type="button" className="vb003-native__term" data-source-keyterm={C.term.keyAttribute} data-source-button="61" data-keyterm-entry-id={C.term.entryId} disabled={!props.onLessonHostRequest} onClick={event=>{if(source.frame<C.term.firstFrame||source.frame>=C.term.lastFrameExclusive)return;props.onLessonHostRequest?.({type:'open-keyterm',entryId:C.term.entryId,sourceAnimationId:C.animationId,playbackDisposition:'source-stop-timeline-and-audio-until-explicit-resume'},{trigger:event.currentTarget,keyTermIndexLanguage:'en'});}}>number line</button>.</p>}
  {figurePresent&&<div ref={port} className="vb003-native__port" tabIndex={0} role="group" aria-label="Number line from negative eight to positive eight" onPointerDown={()=>{manual.current=true;}} onWheel={()=>{manual.current=true;}} onKeyDown={event=>{if(event.target!==event.currentTarget||event.altKey||event.ctrlKey||event.metaKey||!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();manual.current=true;const p=event.currentTarget,end=Math.max(0,p.scrollWidth-p.clientWidth);p.scrollLeft=Math.max(0,Math.min(end,event.key==='Home'?0:event.key==='End'?end:p.scrollLeft+(event.key==='ArrowRight'?1:-1)*Math.max(44,p.clientWidth/4)));}}>
   <div className="vb003-native__axis" data-source-shapes="30,32" data-source-alpha="axis" style={{opacity:t.axisAlpha}}><svg className="vb003-native__geometry" aria-hidden="true" focusable="false" viewBox={'0 0 '+(max-min)+' 100'} preserveAspectRatio="none"><path d={'M 0 50 H '+(max-min)+' M 80 0 L 0 50 L 80 100 M '+(max-min-80)+' 0 L '+(max-min)+' 50 L '+(max-min-80)+' 100'} fill="none" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke"/></svg>{C.ticks.map(tick=>{const card=C.cards.find(c=>c.value===tick.value),placed=card&&s.quiz.placedItemIds.includes(card.id);return<div key={tick.value} className="vb003-native__tick" data-axis-value={tick.value} style={{insetInlineStart:left(tick.value)+'%'}}><span data-lesson-text-block={'tick-'+tick.value}>{number(tick.literal)}</span>{card&&source.frame>=116&&<button type="button" className="vb003-native__target" data-vb003-target={card.id} data-source-instance={card.targetInstance} data-occupied={Boolean(placed)} aria-label={'Position '+tick.literal} disabled={locked} onClick={()=>drop(undefined,card.id)} onDragOver={event=>{if(drag.current&&!locked){event.preventDefault();event.stopPropagation();}}} onDrop={event=>{if(!drag.current||locked)return;event.preventDefault();event.stopPropagation();drag.current.released=true;drop(drag.current.id,card.id);}}>{placed&&<span data-lesson-text-block={'target-'+card.id}>{number(C.text['target-'+card.id])}</span>}</button>}</div>;})}
   {t.demoVisible&&t.phase!=='origin'&&<div className="vb003-native__demo" data-lesson-text-block="fixed-demo" data-vb003-demo-phase={t.phase} style={{insetInlineStart:(t.phase==='moving'?move:left(-7))+'%'}}>{number(C.fixedDemo.literal)}</div>}
   </div>
  </div>}
  {t.annotation&&<p data-lesson-text-block="demo-annotation">{C.text['demo-annotation']}</p>}
  {t.axisAlpha>0&&<div className="vb003-native__cards" role="group" aria-label="Number cards">{t.demoVisible&&t.phase==='origin'&&<span data-lesson-text-block="fixed-demo" data-vb003-demo-phase="origin">{number(C.fixedDemo.literal)}</span>}{C.cards.filter(c=>!s.quiz.placedItemIds.includes(c.id)).map(card=><button key={card.id} type="button" className="vb003-native__card" data-vb003-card={card.id} data-vb003-focus={card.id} data-source-instance={card.sourceInstance} data-lesson-text-block={'card-'+card.id} aria-pressed={selected===card.id} disabled={locked} draggable={!locked} onClick={()=>{if(!locked)commit(selectVb003Card(live.current,card.id,runtime.current));}} onDragStart={event=>{if(locked){event.preventDefault();return;}drag.current={id:card.id,released:false};event.dataTransfer.setData('text/plain',card.id);event.dataTransfer.effectAllowed='move';}} onDragEnd={()=>{const d=drag.current;drag.current=null;if(d&&!d.released)drop(d.id,null);}}>{number(card.sourceLiteral)}</button>)}</div>}
  {s.pending&&!seen.wrong&&<div className="vb003-native__feedback" role="status" tabIndex={-1} data-vb003-focus="feedback">{seen.final&&<p data-lesson-text-block="final-correct">{C.text['final-correct']}</p>}</div>}
  {seen.wrong&&<div className="vb003-native__dialog" role="dialog" aria-modal="true" aria-label="Try again" tabIndex={-1} data-vb003-focus="wrong-dialog" onKeyDown={event=>{if(event.key==='Escape'){event.preventDefault();close();}else if(event.key==='Tab'){event.preventDefault();event.currentTarget.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus();}}}><p data-lesson-text-block="wrong-explanation">{C.text['wrong-explanation']}</p><LessonSourceButton runtime={props} activityId="vb003-close-down" type="button" className="vb003-native__action" data-lesson-text-block="close" disabled={!!props.paused||!props.onLessonActivityCancel} onClick={close}>{C.text.close}</LessonSourceButton></div>}
  {source.frame===160&&<button type="button" className="vb003-native__action" data-vb003-focus="replay" disabled={!props.onReplay} onClick={props.onReplay}>Replay</button>}
 </div></div></section>;
}
export const G4_L3_VB003_TEXT_BINDING=C.binding;
export const G4_L3_VB003_TEXT_PRESENTATION:LessonTextPresentationCapability<SourceStaticCanvasFrameState>={schemaVersion:1,binding:C.binding,Renderer:G4L3Vb003ModernRenderer,getSnapshot:getG4L3Vb003TextSnapshot,playbackMode:'once',playbackEndFrameByDomain:{'sprite-106':116},reducedMotionFrameByDomain:{'sprite-106':116},frameControl:{frameDomain:'sprite-106',completionFrame:160,transitions:[{fromFrame:116,toFrame:117,stopFrame:160}]},activityTimelines:C.activities,sourceTimelineAudioCues:[C.sourceAudio],keyTerms:{indexLanguage:'en',sourceAssetId:'ELKTEG4.xml',sourceSha256:'bec389ce286b9a113297dfd87e052f28cf1da2640d93a277f91f669dfb3ef749',entryIds:[C.term.entryId]}};
