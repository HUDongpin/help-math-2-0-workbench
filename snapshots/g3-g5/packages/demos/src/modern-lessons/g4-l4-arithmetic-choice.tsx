'use client';
import React,{useEffect,useLayoutEffect,useRef,useState} from 'react';
import type {AnimationRendererProps,AudioCue,RuntimeContext} from '../contract';
import type {LessonTextActivityDefinition,LessonTextActivitySnapshot,LessonTextBinding,LessonTextKeyTermsCapability,LessonTextPresentationCapability,TextPresentationSnapshot} from '../lesson-text-contract';
import type {SourceStaticCanvasFrameState} from '../source-static-canvas-candidate';
import {validateLessonTextBinding} from '../lesson-text-snapshot';
import {LessonSourceButton} from '../lesson-source-button';
import {createSixQuestionChoiceState,synchronizeSixQuestionChoiceState,chooseSixQuestionChoiceAnswer,type SixQuestionChoiceQuestion,type SixQuestionChoiceState} from './source-six-question-choice';
import {numberLineValue as at} from './g4-l4-number-line';

type Curve<T> = readonly (readonly [number,T])[];
type AnswerState = Readonly<{alpha:number;travel:number}>;
type Branch = Readonly<{id:string;kind:'correct'|'wrong';variant:number;sourceInstanceId:string;parentLifetime:Readonly<{firstFrame:number;lastFrameExclusive:number}>;frameDomain:string;endFrame:number;labels:readonly Readonly<{id:string;alpha:Curve<number>;sourceCharacters:readonly number[]}>[];popupAlpha:Curve<number>;popupFrames:readonly(readonly[number,number])[];closeActivityId:string|null;closeButton:number|null}>;
export interface ArithmeticChoiceConfig {
 readonly animationId:string;readonly placementId:string;readonly sourceSha256:string;readonly rootFrame:6;
 readonly frameDomain:string;readonly frameCount:number;readonly fps:12;readonly activityFrame:number;
 readonly questions:readonly (Omit<SixQuestionChoiceQuestion,'answers'>&{readonly answers:readonly(SixQuestionChoiceQuestion['answers'][number]&{readonly sourceInstance:string})[]})[];
 readonly binding:LessonTextBinding;readonly text:Readonly<Record<string,string>>;
 readonly prompt:Readonly<{tokens:readonly Readonly<{text:string;color:string;term:boolean}>[];alpha:Curve<number>;aliasAlpha:Curve<number>;aliasColor:string}>;
 readonly mainValues:readonly Readonly<{id:string;character:number;alpha:Curve<number>}>[];readonly ruleAlpha:Curve<number>;
 readonly answerFrames:Readonly<Record<string,Curve<AnswerState>>>;readonly feedback:readonly Branch[];readonly activities:readonly LessonTextActivityDefinition[];
 readonly layout:Readonly<{choiceFigureRem:number;choiceWidthRem:number;choiceCentersRem:readonly number[];mathFontRem:number;keyboardScrollStep:number}>;
 readonly term:Readonly<{button:number;key:string;word:string;entryId:string;activeFrames:readonly(readonly[number,number])[]}>;
 readonly keyTerms:LessonTextKeyTermsCapability;readonly sourceAudio:readonly(AudioCue&{readonly sha256:string})[];
}
export type ArithmeticChoiceControl = Pick<ArithmeticChoiceConfig,'rootFrame'|'frameDomain'|'frameCount'|'activityFrame'|'questions'|'feedback'|'activities'>;
export interface ArithmeticChoiceSession extends SixQuestionChoiceState {readonly feedbackRevision:number|null}
export const createArithmeticChoiceSession=(seed=0,replay=0):ArithmeticChoiceSession=>({...createSixQuestionChoiceState(seed,replay,1),feedbackRevision:null});
export function synchronizeArithmeticChoiceSession(s:ArithmeticChoiceSession,r:RuntimeContext):ArithmeticChoiceSession {
 const next=synchronizeSixQuestionChoiceState(s,r,1);
 return next===s?s:{...next,feedbackRevision:next.feedback===s.feedback?s.feedbackRevision:null};
}
const permitted=(c:ArithmeticChoiceControl,s:ArithmeticChoiceSession,r:AnimationRendererProps)=>r.lang==='en'&&r.scenario==='source-static-frame'&&!r.entryStateSha256&&(r.frameDomain??c.frameDomain)===c.frameDomain&&(r.rootFrame===undefined||r.rootFrame===c.rootFrame)&&r.frame===c.activityFrame&&(r.seed>>>0)===s.seed&&(r.replay??0)===s.replay&&!r.paused;
export function observeArithmeticChoiceFeedback(c:ArithmeticChoiceControl,s:ArithmeticChoiceSession,activities:readonly LessonTextActivitySnapshot[]) {
 const pending=s.feedback,branch=c.feedback.find(b=>b.id===pending?.id),id=pending?pending.id+(pending.stage==='outro'?'-outro':''):null;
 const definition=c.activities.find(d=>d.id===id);
 const matching=activities.filter(a=>a.id===id||a.sourceInstanceId===branch?.sourceInstanceId),activity=matching.length===1?matching[0]:undefined;
 const bound=Boolean(pending&&branch&&definition&&activity&&activity.id===id&&activity.sourceInstanceId===branch.sourceInstanceId&&activity.frameDomain===definition.frameDomain&&Number.isSafeInteger(activity.revision)&&activity.revision>pending.revisionFloor&&(s.feedbackRevision===null||s.feedbackRevision===activity.revision)&&Number.isInteger(activity.frame)&&activity.frame>=definition.startFrame&&activity.frame<=definition.endFrame&&(activity.status==='playing'||activity.status==='completed'));
 const labels=branch?.labels.map(b=>({...b,alpha:bound?at(b.alpha,activity!.frame,0):0}))??[];
 const popupAlpha=bound&&pending!.stage==='intro'&&branch!.kind==='wrong'?at(branch!.popupAlpha,activity!.frame,0):0;
 return {branch,definition,activity,bound,labels,popupAlpha,popup:popupAlpha>0,complete:bound&&activity!.status==='completed'&&activity!.frame===definition!.endFrame&&(branch!.kind==='correct'||pending!.stage==='outro')};
}
/** The shared deterministic selector owns attempts; host refusal commits none. */
export function chooseArithmeticChoiceAnswer(c:ArithmeticChoiceControl,s:ArithmeticChoiceSession,id:string,r:AnimationRendererProps):ArithmeticChoiceSession {
 if(!permitted(c,s,r)||!r.onLessonFrameRequest||s.feedback||s.pendingFromFrame!==null)return s;
 const next=chooseSixQuestionChoiceAnswer(c,s,r.frame,id);if(!next?.feedback)return s;
 const branch=c.feedback.find(b=>b.id===next.feedback!.id)!;
 const revisionFloor=Math.max(-1,...(r.lessonActivities??[]).filter(a=>a.sourceInstanceId===branch.sourceInstanceId&&Number.isSafeInteger(a.revision)).map(a=>a.revision));
 if(r.onLessonActivityRequest?.({id:branch.id,parentFrame:r.frame})!==true)return s;
 return {...next,feedback:{...next.feedback,revisionFloor},feedbackRevision:null};
}
export function closeArithmeticChoiceWrong(c:ArithmeticChoiceControl,s:ArithmeticChoiceSession,r:AnimationRendererProps):ArithmeticChoiceSession {
 const seen=observeArithmeticChoiceFeedback(c,s,r.lessonActivities??[]);
 if(!permitted(c,s,r)||!seen.popup||!seen.activity||!s.feedback)return s;
 if(r.onLessonActivityRequest?.({id:s.feedback.id+'-outro',parentFrame:r.frame,fromActivity:{id:seen.activity.id,revision:seen.activity.revision}})!==true)return s;
 return {...s,feedback:{...s.feedback,stage:'outro',revisionFloor:seen.activity.revision},feedbackRevision:null};
}
export function finishArithmeticChoiceFeedback(c:ArithmeticChoiceControl,s:ArithmeticChoiceSession,r:AnimationRendererProps):ArithmeticChoiceSession {
 const seen=observeArithmeticChoiceFeedback(c,s,r.lessonActivities??[]);
 if(!permitted(c,s,r)||!seen.complete||!s.feedback)return s;
 if(seen.branch!.kind==='correct'){
  if(r.onLessonFrameRequest?.({fromFrame:c.activityFrame,toFrame:c.activityFrame+1,stopFrame:c.frameCount})!==true)return s;
  return {...s,feedback:null,feedbackRevision:null,pendingFromFrame:r.frame,focusTarget:null};
 }
 return {...s,feedback:null,feedbackRevision:null,focusTarget:s.feedback.selected};
}
export function getArithmeticChoiceTeaching(c:ArithmeticChoiceConfig,frame:number){
 return {promptAlpha:Math.max(at(c.prompt.alpha,frame,0),at(c.prompt.aliasAlpha,frame,0)),promptAlias:at(c.prompt.aliasAlpha,frame,0)>0,
  values:c.mainValues.map(v=>({...v,alpha:at(v.alpha,frame,0)})),ruleAlpha:at(c.ruleAlpha,frame,0),
  answers:c.questions[0].answers.map((a,i)=>({...a,...at(c.answerFrames[a.id],frame,{alpha:0,travel:0}),initialCenter:c.layout.choiceCentersRem[i]}))};
}
export function getArithmeticChoiceSnapshot(c:ArithmeticChoiceConfig,state:SourceStaticCanvasFrameState,r:RuntimeContext,stored=createArithmeticChoiceSession(r.seed,r.replay??0),activities:readonly LessonTextActivitySnapshot[]=[]):TextPresentationSnapshot {
 const blockers:string[]=[];
 if(state.status!=='ready'||state.blocker||state.animationId!==c.animationId||state.sourceSwfSha256!==c.sourceSha256)blockers.push('source-identity-mismatch');
 if(r.lang!=='en'||state.language!=='en')blockers.push('spanish-text-not-source-verified');
 if(r.scenario!=='source-static-frame'||state.scenario!==r.scenario||r.entryStateSha256)blockers.push('original-renderer-required');
 if((r.frameDomain??c.frameDomain)!==c.frameDomain||state.frameDomain!==c.frameDomain||!Number.isInteger(r.frame)||r.frame<1||r.frame>c.frameCount||state.frame!==r.frame||state.rootFrame!==c.rootFrame||(r.rootFrame!==undefined&&r.rootFrame!==c.rootFrame)||state.seed!==(r.seed>>>0))blockers.push('teaching-state-identity-mismatch');
 const s=synchronizeArithmeticChoiceSession(stored,r),seen=observeArithmeticChoiceFeedback(c,s,activities),teaching=getArithmeticChoiceTeaching(c,r.frame);
 const visible=(id:string)=>id==='root-title'?true:id==='wrong-explanation'||id==='close'?seen.popup:id.startsWith('feedback-')?seen.labels.some(b=>b.id===id&&b.alpha>0):seen.popup?false:id==='prompt'?teaching.promptAlpha>0:id.startsWith('answer-')?teaching.answers.some(a=>'answer-'+a.id===id&&a.alpha>0):teaching.values.some(v=>v.id===id&&v.alpha>0);
 return {schemaVersion:1,animationId:c.animationId,bindingVersion:c.binding.version,sourceSwfSha256:c.sourceSha256,status:blockers.length?'blocked':'ready',blockers,
  identity:{frame:state.frame,frameDomain:state.frameDomain,rootFrame:state.rootFrame,scenario:state.scenario,language:state.language,seed:state.seed,replay:r.replay??0},suppressedInstances:[],blocks:blockers.length?[]:c.binding.blocks.map(b=>({...b,text:c.text[b.id]??'',visible:visible(b.id)}))};
}
const CSS=`
.g4l4-choice{box-sizing:border-box;container:g4choice / inline-size;inline-size:100%;min-inline-size:0;margin:auto;padding:.8rem;background:#fffdf7;color:#17273c;font:1.125rem/1.65 var(--lesson-font-body,system-ui,sans-serif)}
.g4l4-choice *{box-sizing:border-box}.g4l4-choice [hidden]{display:none!important}
.g4l4-choice h2{font:700 2.25rem/1.25 var(--lesson-font-display,system-ui,sans-serif);margin:0 0 .65em;overflow-wrap:normal;word-break:normal;hyphens:none}
.g4l4-choice p{margin:.65em 0;overflow-wrap:normal;word-break:normal;hyphens:none}
.g4l4-choice button{font:inherit;min-inline-size:44px;min-block-size:44px;touch-action:manipulation;cursor:pointer}.g4l4-choice button:disabled{cursor:default}
.g4l4-choice button:focus-visible,.g4l4-choice [tabindex]:focus-visible{outline:3px solid #1556a0;outline-offset:3px}
.g4l4-choice__term{color:inherit;border:0;background:transparent;padding:0;text-align:start;text-decoration:none}.g4l4-choice__term-word{text-decoration:underline;text-decoration-thickness:2px;text-underline-offset:.15em}
.g4l4-choice__port{max-inline-size:100%;min-inline-size:0;overflow-x:auto;overscroll-behavior-inline:contain;padding-block:.3rem}
.g4l4-choice__board{position:relative;margin-inline:auto;font-variant-numeric:tabular-nums;font-weight:600;line-height:1.4}
.g4l4-choice__math{position:relative;inline-size:5.5rem;margin:auto;padding:0 .65rem;text-align:right;white-space:nowrap}
.g4l4-choice__operand{display:block}.g4l4-choice__operator{position:absolute;inset-inline-start:.2rem;inset-block-end:0}
.g4l4-choice__rule{inline-size:5.5rem;border-block-start:2px solid #17273c;margin:.15rem auto .6rem}
.g4l4-choice__answers{position:relative;block-size:4.5rem}
.g4l4-choice__answer{position:absolute;transform:translateX(-50%);white-space:nowrap;padding:.55rem .15rem;border:2px solid #4f7299;border-radius:.5rem;background:white;color:inherit;font-weight:700!important;transition:none!important}
.g4l4-choice__feedback{background:#eff9f2;border:2px solid #286b45;border-radius:.6rem;padding:.7rem;scroll-margin-block-start:calc(var(--lesson-platform-header-height,0px) + 1rem)}
.g4l4-choice__feedback[data-feedback-kind="wrong"]{background:#fff4ef;border-color:#9d4d36}
.g4l4-choice__feedback [data-lesson-text-block]{transition:none!important}
.g4l4-choice__dialog{background:#fff4ef;border:2px solid #9d4d36;border-radius:.6rem;padding:.7rem;scroll-margin-block-start:calc(var(--lesson-platform-header-height,0px) + 1rem)}
.g4l4-choice__action{padding:.5rem 1rem;background:#1757af;color:white;border:1px solid #1757af;border-radius:.5rem}
@container g4choice (max-width:40rem){.g4l4-choice h2{font-size:1.625rem}}
@media(max-width:480px){.g4l4-choice{padding-inline:0}
 .lesson-shell2 .lesson-shell2__legacy-stage:has(.runtime-shell[data-lesson-presentation='modern-text-v1'] .g4l4-choice){width:calc(100vw - 8px);max-width:none;margin-inline:calc((100% - 100vw + 8px)/2)}
 .lesson-shell2 .lesson-shell2__legacy-stage:has(.runtime-shell[data-lesson-presentation='modern-text-v1'] .g4l4-choice)>.lesson-shell2__stage{padding-inline:2px}}
`;
export function ArithmeticChoiceScene({config:c,runtime:r,session:s,activities=[],onChoose,onClose}:{config:ArithmeticChoiceConfig;runtime:AnimationRendererProps;session:ArithmeticChoiceSession;activities?:readonly LessonTextActivitySnapshot[];onChoose?:(id:string)=>void;onClose?:()=>void}){
 const teaching=getArithmeticChoiceTeaching(c,r.frame),seen=observeArithmeticChoiceFeedback(c,s,activities),port=useRef<HTMLDivElement>(null),root=useRef<HTMLElement>(null),manual=useRef(false);
 const locked=Boolean(r.paused),canAnswer=!locked&&r.frame===c.activityFrame&&!s.feedback&&s.pendingFromFrame===null&&!!r.onLessonActivityRequest&&!!r.onLessonFrameRequest;
 useLayoutEffect(()=>{manual.current=false;},[r.replay]);
 useLayoutEffect(()=>{const p=port.current;if(!p)return;const center=()=>{if(!manual.current)p.scrollLeft=(p.scrollWidth-p.clientWidth)/2;};center();const observer=typeof ResizeObserver==='undefined'?null:new ResizeObserver(center);observer?.observe(p);return()=>observer?.disconnect();},[r.replay]);
 // Completing the authored answer movement returns the result to the readable center.
 // A prior keyboard/pointer answer search may have left this native scrollport at an edge.
 useLayoutEffect(()=>{if(r.frame!==c.frameCount)return;const p=port.current;if(p){manual.current=false;p.scrollLeft=(p.scrollWidth-p.clientWidth)/2;}},[r.frame===c.frameCount,r.replay]);
 useLayoutEffect(()=>{
  const target=seen.popup?'wrong-dialog':s.feedback?'feedback':r.frame===c.frameCount?'replay':s.focusTarget;
  if(!target)return;const e=root.current?.querySelector<HTMLElement>(`[data-choice-focus="${target}"]`);if(!e)return;e.focus({preventScroll:true});
  if(target==='wrong-dialog')e.scrollIntoView({block:'start',behavior:'instant'});
  else if(['left','middle','right'].includes(target)&&port.current){const p=port.current,pr=p.getBoundingClientRect(),er=e.getBoundingClientRect();manual.current=true;if(er.left<pr.left)p.scrollLeft+=er.left-pr.left;else if(er.right>pr.right)p.scrollLeft+=er.right-pr.right;}
 },[seen.popup,s.feedback?.id,s.feedback?.stage,s.focusTarget,r.frame===c.frameCount,r.replay]);
 const alpha=(id:string)=>teaching.values.find(v=>v.id===id)?.alpha??0;
 return <section ref={root} className="g4l4-choice" lang="en" data-modern-text-page={c.animationId} data-lesson-text-status="ready" data-lesson-frame={r.frame} data-lesson-replay={r.replay??0} data-current-choice-mode={s.feedback?'feedback':s.pendingFromFrame!==null?'resuming':'ready'} data-feedback-activity-id={seen.bound?seen.activity!.id:''} data-feedback-activity-frame={seen.bound?seen.activity!.frame:''} data-feedback-stage={s.feedback?.stage??''}>
  <style>{CSS}</style><h2 data-lesson-text-block="root-title">{c.text['root-title']}</h2>
  <div hidden={seen.popup}>
   <p data-lesson-text-block="prompt" aria-hidden={teaching.promptAlpha<=0} style={{opacity:teaching.promptAlpha,visibility:teaching.promptAlpha>0?'visible':'hidden'}}>{c.prompt.tokens.map((t,i)=><span key={i} style={{color:t.color}}>{t.term?<><button type="button" className="g4l4-choice__term" aria-label={c.term.word} data-source-keyterm={c.term.key} data-source-button={c.term.button} data-keyterm-entry-id={c.term.entryId} disabled={!!s.feedback||!r.onLessonHostRequest||!c.term.activeFrames.some(([a,b])=>a<=r.frame&&r.frame<b)} onClick={e=>r.onLessonHostRequest?.({type:'open-keyterm',entryId:c.term.entryId,sourceAnimationId:c.animationId,playbackDisposition:'source-stop-timeline-and-audio-until-explicit-resume'},{trigger:e.currentTarget,keyTermIndexLanguage:'en'})}><span className="g4l4-choice__term-word" style={{color:teaching.promptAlias?c.prompt.aliasColor:undefined}}>{c.term.word}</span>{t.text.slice(c.term.word.length)}</button></>:t.text}</span>)}</p>
   <div ref={port} className="g4l4-choice__port" role="region" aria-label="Vertical arithmetic and answer choices" tabIndex={s.feedback?-1:0} onPointerDown={()=>{manual.current=true;}} onWheel={()=>{manual.current=true;}} onKeyDown={e=>{
    if(e.target!==e.currentTarget||e.altKey||e.ctrlKey||e.metaKey||e.shiftKey||!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
    e.preventDefault();manual.current=true;const p=e.currentTarget;p.scrollLeft=e.key==='Home'?0:e.key==='End'?p.scrollWidth:p.scrollLeft+(e.key==='ArrowRight'?1:-1)*c.layout.keyboardScrollStep;
   }}>
    <div className="g4l4-choice__board" style={{inlineSize:c.layout.choiceFigureRem+'rem',fontSize:c.layout.mathFontRem+'rem'}}>
     <div className="g4l4-choice__math">{['top','bottom'].map(id=><span key={id} className="g4l4-choice__operand" data-lesson-text-block={id} aria-hidden={alpha(id)<=0} style={{opacity:alpha(id)}}>{c.text[id]}</span>)}<span className="g4l4-choice__operator" data-lesson-text-block="operator" aria-hidden={alpha('operator')<=0} style={{opacity:alpha('operator')}}>{c.text.operator}</span></div>
     <div className="g4l4-choice__rule" data-source-shape={13} aria-hidden="true" style={{opacity:teaching.ruleAlpha}}/>
     <div className="g4l4-choice__answers" role="group" aria-label="Answer choices">{teaching.answers.map(a=><button key={a.id} type="button" className="g4l4-choice__answer" data-lesson-text-block={'answer-'+a.id} data-choice-focus={a.id} data-source-instance={a.sourceInstance} data-source-button={a.sourceButton} data-source-travel={a.travel} disabled={!canAnswer||a.alpha<=0||!onChoose} aria-hidden={a.alpha<=0} style={{inlineSize:c.layout.choiceWidthRem+'rem',left:(a.initialCenter+(c.layout.choiceCentersRem[1]-a.initialCenter)*a.travel)+'rem',opacity:a.alpha,visibility:a.alpha>0?'visible':'hidden'}} onClick={()=>onChoose?.(a.id)}>{a.text}</button>)}</div>
    </div>
   </div>
  </div>
  {s.feedback&&<div className="g4l4-choice__feedback" data-feedback-kind={seen.branch?.kind} role="status" aria-live="polite" tabIndex={-1} data-choice-focus="feedback">{seen.labels.filter(l=>l.alpha>0).map(l=><p key={l.id} data-lesson-text-block={l.id} style={{opacity:l.alpha}}>{c.text[l.id]}</p>)}</div>}
  {seen.popup&&<div className="g4l4-choice__dialog" role="dialog" aria-modal="true" aria-label="Try again" tabIndex={-1} data-choice-focus="wrong-dialog" style={{opacity:seen.popupAlpha}} onKeyDown={e=>{
   if(e.key==='Escape'){e.preventDefault();onClose?.();return;}if(e.key!=='Tab')return;const button=e.currentTarget.querySelector<HTMLButtonElement>('button:not(:disabled)');if(button){e.preventDefault();button.focus();}
  }}><p data-lesson-text-block="wrong-explanation">{c.text['wrong-explanation']}</p><LessonSourceButton runtime={r} activityId={seen.branch!.closeActivityId!} className="g4l4-choice__action" type="button" data-source-button={seen.branch!.closeButton!} data-lesson-text-block="close" disabled={locked||!onClose} onClick={onClose}>Close</LessonSourceButton></div>}
  {r.frame===c.frameCount&&<button type="button" className="g4l4-choice__action" data-choice-focus="replay" disabled={!r.onReplay} onClick={r.onReplay}>Replay</button>}
 </section>;
}
export function createArithmeticChoicePresentation(c:ArithmeticChoiceConfig,getFrameState:(frame:number,r:RuntimeContext)=>SourceStaticCanvasFrameState,Fallback:React.ComponentType<AnimationRendererProps>):LessonTextPresentationCapability<SourceStaticCanvasFrameState>{
 validateLessonTextBinding(c.binding);
 function Renderer(r:AnimationRendererProps){
  const context={...r,frameDomain:r.frameDomain??c.frameDomain},state=(r.state??getFrameState(r.frame,context))as SourceStaticCanvasFrameState;
  const [stored,setStored]=useState(()=>createArithmeticChoiceSession(r.seed,r.replay??0)),s=synchronizeArithmeticChoiceSession(stored,context),live=useRef(s);live.current=s;
  const activities=r.lessonActivities??(r.lessonActivity?[r.lessonActivity]:[]),seen=observeArithmeticChoiceFeedback(c,s,activities),snapshot=getArithmeticChoiceSnapshot(c,state,context,s,activities);
  const ready=snapshot.status==='ready',consumed=useRef<string|null>(null);
  useEffect(()=>{
   if(!ready||r.paused||!s.feedback||!seen.bound||!seen.activity)return;
   if(s.feedbackRevision===null){const next={...s,feedbackRevision:seen.activity.revision};live.current=next;setStored(next);return;}
   if(!seen.complete)return;const token=`${s.seed}:${s.replay}:${seen.activity.id}:${seen.activity.revision}`;if(consumed.current===token)return;
   const next=finishArithmeticChoiceFeedback(c,live.current,{...r,lessonActivities:activities});if(next!==live.current){consumed.current=token;live.current=next;setStored(next);}
  },[ready,r,s,seen.bound,seen.complete,seen.activity]);
  if(!ready)return <Fallback {...r} state={state}/>;
  const apply=(next:ArithmeticChoiceSession)=>{if(next!==live.current){live.current=next;setStored(next);}};
  return <ArithmeticChoiceScene config={c} runtime={r} session={s} activities={activities} onChoose={id=>apply(chooseArithmeticChoiceAnswer(c,live.current,id,{...r,lessonActivities:activities}))} onClose={()=>apply(closeArithmeticChoiceWrong(c,live.current,{...r,lessonActivities:activities}))}/>;
 }
 return {schemaVersion:1,binding:c.binding,Renderer,getSnapshot:(s,r)=>getArithmeticChoiceSnapshot(c,s,r),playbackMode:'once',playbackEndFrameByDomain:{[c.frameDomain]:c.activityFrame},reducedMotionFrameByDomain:{[c.frameDomain]:c.activityFrame},frameControl:{frameDomain:c.frameDomain,completionFrame:c.frameCount,transitions:[{fromFrame:c.activityFrame,toFrame:c.activityFrame+1,stopFrame:c.frameCount}]},activityTimelines:c.activities,sourceTimelineAudioCues:c.sourceAudio,keyTerms:c.keyTerms};
}
