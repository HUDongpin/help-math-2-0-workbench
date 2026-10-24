'use client';
import React,{useEffect,useLayoutEffect,useRef,useState}from'react';
import type{AnimationRendererProps,RuntimeContext}from'../contract';
import type{LessonTextActivitySnapshot,LessonTextPresentationCapability,TextPresentationSnapshot}from'../lesson-text-contract';
import type{SourceStaticCanvasFrameState}from'../source-static-canvas-candidate';
import {validateLessonTextBinding}from'../lesson-text-snapshot';
import {LessonSourceButton}from'../lesson-source-button';
import {VB010_CONFIG as c}from'./generated/g3-l1-vb010-source';
import {createVb010Session,synchronizeVb010Session,observeVb010Feedback,chooseVb010Answer,closeVb010Wrong,finishVb010Feedback,getVb010Teaching,consumeVb010HostSignals,commitVb010PublicPlay,type Vb010Session}from'./g3-l1-vb010-state';
export function getVb010Snapshot(state:SourceStaticCanvasFrameState,r:RuntimeContext,stored=createVb010Session(r.seed,r.replay??0),activities:readonly LessonTextActivitySnapshot[]=[]):TextPresentationSnapshot{
 const blockers:string[]=[];
 if(state.status!=='ready'||state.blocker||state.animationId!==c.animationId||state.sourceSwfSha256!==c.sourceSha256)blockers.push('source-identity-mismatch');
 if(r.lang!=='en'||state.language!=='en')blockers.push('spanish-text-not-source-verified');
 if(r.scenario!=='source-static-frame'||state.scenario!==r.scenario||r.entryStateSha256)blockers.push('original-renderer-required');
 if((r.frameDomain??c.clock.mainDomain)!==c.clock.mainDomain||state.frameDomain!==c.clock.mainDomain||!Number.isInteger(r.frame)||r.frame<1||r.frame>136||state.frame!==r.frame||state.rootFrame!==6||(r.rootFrame!==undefined&&r.rootFrame!==6)||!Number.isSafeInteger(r.seed)||state.seed!==(r.seed>>>0)||!Number.isSafeInteger(r.replay??0)||(r.replay??0)<0)blockers.push('teaching-state-identity-mismatch');
 const s=synchronizeVb010Session(stored,r),t=getVb010Teaching(r.frame,s,activities),seen=t.feedback;
 const visible=(id:string)=>id==='root-title'?true:id==='wrong-explanation'||id==='close'?seen.popup:id.startsWith('feedback-')?seen.labels.some(l=>l.id===id&&l.alpha>0):id.startsWith('prompt-word-')?t.promptWords.some(w=>w.id===id&&w.visible):id.startsWith('answer-')?!seen.popup&&t.answers.some(a=>'answer-'+a.id===id&&a.alpha>0):false;
 return {schemaVersion:1,animationId:c.animationId,bindingVersion:c.binding.version,sourceSwfSha256:c.sourceSha256,status:blockers.length?'blocked':'ready',blockers,
  identity:{frame:state.frame,frameDomain:state.frameDomain,rootFrame:state.rootFrame,scenario:state.scenario,language:state.language,seed:state.seed,replay:r.replay??0},suppressedInstances:[],
  blocks:blockers.length?[]:c.binding.blocks.map(b=>({...b,text:b.id==='wrong-explanation'?t.explanation:c.text[b.id as keyof typeof c.text],visible:visible(b.id)}))};
}
const CSS=`
.vb010-native{box-sizing:border-box;container:vb010 / inline-size;inline-size:100%;min-inline-size:0;padding:1rem;background:#fffdf7;color:#17273c;font:var(--lesson-text-body-size,1.125rem)/var(--lesson-text-line-height,1.6) var(--lesson-text-font-body,var(--lesson-font-body,system-ui,sans-serif))}
.vb010-native *{box-sizing:border-box}.vb010-native [hidden]{display:none!important}
.vb010-native h2{font:700 2rem/1.3 var(--lesson-font-display,system-ui,sans-serif);margin:0 0 .8em}
.vb010-native p{margin:.65em 0}.vb010-native h2,.vb010-native p,.vb010-native button{overflow-wrap:break-word;word-break:normal;hyphens:none}
.vb010-native button{font:inherit;min-inline-size:44px;min-block-size:44px;touch-action:manipulation;cursor:pointer}.vb010-native button:disabled{cursor:default}
.vb010-native button:focus-visible,.vb010-native [tabindex]:focus-visible{outline:3px solid #1556a0;outline-offset:3px}
.vb010-native__answers{display:grid;gap:.8rem;max-inline-size:36rem;margin:1.25rem auto}.vb010-native__answer{padding:.7rem 1rem;border:2px solid #4f7299;border-radius:.5rem;background:white;color:inherit;font-weight:600!important;transition:none!important;text-align:center}
.vb010-native__feedback>p,.vb010-native__dialog{transition:none!important}
.vb010-native__feedback,.vb010-native__dialog{border:2px solid #286b45;border-radius:.6rem;padding:1rem;background:#eff9f2;scroll-margin-block-start:calc(var(--lesson-platform-header-height,0px) + 1rem)}
.vb010-native__feedback[data-kind='wrong'],.vb010-native__dialog{border-color:#9d4d36;background:#fff4ef}
.vb010-native__action{padding:.5rem 1rem;background:#1757af;color:white;border:1px solid #1757af;border-radius:.5rem}
@container vb010 (min-width:48rem){.vb010-native p{font-size:1.25rem}}
@container vb010 (max-width:30rem){.vb010-native h2{font-size:1.75rem}.vb010-native__answer{padding:.6rem}.vb010-native{padding:.6rem}}
`;
export function Vb010Scene({runtime:r,session:s,activities=[],onChoose,onClose}:{runtime:AnimationRendererProps;session:Vb010Session;activities?:readonly LessonTextActivitySnapshot[];onChoose?:(id:string)=>void;onClose?:()=>void}){
 const t=getVb010Teaching(r.frame,s,activities),seen=t.feedback,root=useRef<HTMLElement>(null);
 const canAnswer=!r.paused&&r.frame===75&&!s.answerLocked&&!s.feedback&&!s.pendingPlay&&s.pendingResume===null&&!!r.onLessonActivityRequest&&!!r.onLessonFrameRequest&&!!onChoose;
 useLayoutEffect(()=>{
  const target=seen.popup?'wrong-dialog':s.feedback?'feedback':t.terminal?'replay':s.focusTarget;
  if(!target)return;const e=root.current?.querySelector<HTMLElement>(`[data-vb010-focus="${target}"]`);if(!e)return;e.focus({preventScroll:true});
  if(seen.popup)e.scrollIntoView({block:'nearest',behavior:'instant'});
 },[seen.popup,s.feedback?.id,s.feedback?.stage,s.focusTarget,t.terminal,r.replay]);
 return <section ref={root} className="vb010-native" lang="en" data-modern-text-page={c.animationId} data-lesson-text-status="ready" data-lesson-frame={r.frame} data-lesson-replay={r.replay??0} data-wrong-count={s.wrongCount} data-answer-locked={s.answerLocked?'true':'false'} data-last-control-sequence={s.lastControlSequence} data-choice-mode={s.feedback?'feedback':s.pendingResume!==null?'resuming':s.pendingPlay?'play-requested':s.answerLocked?'locked':'ready'} data-feedback-activity-id={seen.bound?seen.activity!.id:''} data-feedback-activity-frame={seen.bound?seen.activity!.frame:''} data-feedback-stage={s.feedback?.stage??''}>
  <style>{CSS}</style><h2 data-lesson-text-block="root-title">{c.text['root-title']}</h2>
  <div hidden={seen.popup}>
   <p>{t.promptWords.map((w,i)=><React.Fragment key={w.id}>{i>0?' ':null}<span data-lesson-text-block={w.id} data-source-instances={w.sourceInstances.join('|')} aria-hidden={!w.visible} style={{visibility:w.visible?'visible':'hidden'}}>{w.text}</span></React.Fragment>)}</p>
   <div className="vb010-native__answers" role="group" aria-label="Answer choices">{t.answers.map(a=><button key={a.id} type="button" className="vb010-native__answer" data-lesson-text-block={'answer-'+a.id} data-vb010-focus={a.id} data-source-instance={a.sourceInstance} data-source-button={a.sourceButton} disabled={!canAnswer||a.alpha<=0} aria-hidden={a.alpha<=0} style={{opacity:a.alpha,visibility:a.alpha>0?'visible':'hidden'}} onClick={()=>onChoose?.(a.id)}>{a.text}</button>)}</div>
  </div>
  {s.feedback&&<div className="vb010-native__feedback" data-kind={seen.branch?.kind} role="status" aria-live="polite" tabIndex={-1} data-vb010-focus="feedback">{seen.labels.filter(l=>l.alpha>0).map(l=><p key={l.id} data-lesson-text-block={l.id} style={{opacity:l.alpha}}>{c.text[l.id as keyof typeof c.text]}</p>)}</div>}
  {seen.popup&&<div className="vb010-native__dialog" role="dialog" aria-modal="true" aria-label="Answer feedback" tabIndex={-1} data-vb010-focus="wrong-dialog" style={{opacity:seen.popupAlpha}} onKeyDown={e=>{
   if(e.key==='Escape'){e.preventDefault();onClose?.();return;}
   if(e.key==='Tab'){const button=e.currentTarget.querySelector<HTMLButtonElement>('button:not(:disabled)');e.preventDefault();(button??e.currentTarget).focus();}
  }}><p data-lesson-text-block="wrong-explanation">{t.explanation}</p><LessonSourceButton runtime={r} activityId={seen.branch!.closeActivityId!} className="vb010-native__action" type="button" data-source-button={58} data-lesson-text-block="close" disabled={!!r.paused||!onClose} onClick={onClose}>Close</LessonSourceButton></div>}
  {t.terminal&&<button type="button" className="vb010-native__action" data-vb010-focus="replay" disabled={!r.onReplay} onClick={r.onReplay}>Replay</button>}
 </section>;
}
export function createVb010Presentation(getFrameState:(frame:number,r:RuntimeContext)=>SourceStaticCanvasFrameState,Fallback:React.ComponentType<AnimationRendererProps>):LessonTextPresentationCapability<SourceStaticCanvasFrameState>{
 validateLessonTextBinding(c.binding);
 function Renderer(r:AnimationRendererProps){
  const context={...r,frameDomain:r.frameDomain??c.clock.mainDomain},state=(r.state??getFrameState(r.frame,context))as SourceStaticCanvasFrameState;
  const [stored,setStored]=useState(()=>createVb010Session(r.seed,r.replay??0,r.lessonPlaybackIdentity));
  const synchronized=synchronizeVb010Session(stored,context),activities=r.lessonActivities??(r.lessonActivity?[r.lessonActivity]:[]);
  const snapshot=getVb010Snapshot(state,context,synchronized,activities),ready=snapshot.status==='ready';
  // Derive accepted source interruption before rendering or completion effects;
  // even start+error in one batch retains the reset through hostAudioTrackStart.
  const s=ready?consumeVb010HostSignals(synchronized,r):synchronized,live=useRef(s);live.current=s;
  const seen=observeVb010Feedback(s,activities),current=useRef({...r,lessonActivities:activities});current.current={...r,lessonActivities:activities};
  // Persist resets from Replay/seek so returning to75 cannot revive the prior branch.
  useLayoutEffect(()=>{if(s!==stored)setStored(s);},[s,stored]);
  const apply=(next:Vb010Session)=>{if(next!==live.current){live.current=next;setStored(next);}};
  useEffect(()=>{
   if(ready&&s.pendingPlay)apply(commitVb010PublicPlay(live.current,current.current));
  },[ready,s.pendingPlay,r]);
  useEffect(()=>{
   if(!ready||r.paused||!s.feedback||!seen.bound||!seen.activity)return;
   if(!live.current.feedback||live.current.lastControlSequence!==s.lastControlSequence)return;
   if(s.feedbackRevision===null){apply({...live.current,feedbackRevision:seen.activity.revision});return;}
   if(seen.complete)apply(finishVb010Feedback(live.current,current.current));
  },[ready,r,s,seen.bound,seen.complete,seen.activity]);
  if(!ready)return <Fallback {...r} state={state}/>;
  return <Vb010Scene runtime={r} session={s} activities={activities} onChoose={id=>apply(chooseVb010Answer(live.current,id,{...r,lessonActivities:activities}))} onClose={()=>apply(closeVb010Wrong(live.current,{...r,lessonActivities:activities}))}/>;
 }
 return {schemaVersion:1,binding:c.binding,Renderer,getSnapshot:(s,r)=>getVb010Snapshot(s,r),playbackMode:'once',playbackEndFrameByDomain:{'sprite-255':75},reducedMotionFrameByDomain:{'sprite-255':75},frameControl:{frameDomain:'sprite-255',completionFrame:136,transitions:[{fromFrame:75,toFrame:76,stopFrame:136},{fromFrame:75,toFrame:96,stopFrame:136}]},activityTimelines:c.activities,sourceTimelineAudioCues:c.sourceAudio,terminalTimelineAudio:c.terminalTimelineAudio};
}
