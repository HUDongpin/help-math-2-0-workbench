'use client';
import React, {useEffect, useLayoutEffect, useRef, useState} from 'react';
import type {AnimationRendererProps, RuntimeContext} from '../contract';
import type {LessonTextActivityDefinition, LessonTextActivitySnapshot, LessonTextBinding, LessonTextPresentationCapability, TextPresentationSnapshot} from '../lesson-text-contract';
import type {SourceStaticCanvasFrameState} from '../source-static-canvas-candidate';
import {LessonSourceButton} from '../lesson-source-button';
import {createCourseG04L03VbSignQuizState, reduceCourseG04L03VbSignQuiz, type CourseG04L03VbSignQuizConfig as Quiz, type CourseG04L03VbSignQuizState as QuizState, type CourseG04L03VbSignQuizChoiceId as ChoiceId} from '../timelines/course-g04-l03-vb-sign-quiz-interaction';

type Frames = readonly (readonly [number,number])[];
export interface SignPracticeConfig {
  readonly animationId: Quiz['animationId']; readonly frameDomain: Quiz['frameDomain']; readonly rootFrame: 6; readonly frameCount: number; readonly sourceSha256: string;
  readonly binding: LessonTextBinding; readonly text: Readonly<Record<string,string>>;
  readonly textFrames: Readonly<Record<string,Frames>>;
  readonly feedback: readonly Readonly<{id:string;kind:'wrong'|'correct';variant:number;endFrame:number;sourceInstanceId:string;frameDomain:string;visibleFrames:Frames;popupFrames:Frames;closeActivityId?:string;sourceWord?:Readonly<{id:string;alphaFrames:readonly(readonly[number,number])[]}>}>[];
  readonly activities: readonly LessonTextActivityDefinition[];
  readonly mainAudio: Readonly<{source:string;sha256:string;firstFrame:number;lastFrame:number}>;
  readonly terms: readonly Readonly<{keyAttribute:string;entryId:string}>[];
}
export interface SignPracticeSession {
  readonly quiz: QuizState; readonly replay:number;
  readonly feedback: Readonly<{id:string;stage:'intro'|'outro';revisionFloor:number;revision:number|null}>|null;
  readonly pendingFrame:number|null; readonly focusTarget:ChoiceId|null;
}
const permitted=(quiz:Quiz,session:SignPracticeSession,r:AnimationRendererProps)=>r.lang==='en'&&r.scenario==='source-static-frame'&&!r.entryStateSha256&&(r.frameDomain??quiz.frameDomain)===quiz.frameDomain&&(r.rootFrame===undefined||r.rootFrame===6)&&r.frame===quiz.activityFrame&&(r.seed>>>0)===session.quiz.seed&&(r.replay??0)===session.replay&&!r.paused;
const inFrames=(frame:number,windows:Frames)=>windows.some(([a,b])=>frame>=a&&frame<=b);
export const createSignPracticeSession=(quiz:Quiz,seed=0,replay=0):SignPracticeSession=>({quiz:createCourseG04L03VbSignQuizState(quiz,seed),replay,feedback:null,pendingFrame:null,focusTarget:null});
export function synchronizeSignPracticeSession(session:SignPracticeSession,quiz:Quiz,context:RuntimeContext):SignPracticeSession {
  const next=createSignPracticeSession(quiz,context.seed,context.replay??0);
  if(session.quiz.seed!==next.quiz.seed||session.replay!==next.replay)return next;
  if(context.frame===1&&session.quiz.drawCount)return next;
  if(session.pendingFrame!==null&&context.frame!==session.pendingFrame)return {...session,pendingFrame:null};
  // Feedback is a placed child of the held main frame. Seeking away detaches it.
  if(session.feedback&&context.frame!==quiz.activityFrame)return {...session,quiz:session.quiz.mode==='wrong-feedback'?reduceCourseG04L03VbSignQuiz(quiz,session.quiz,{type:'close-wrong'}):session.quiz,feedback:null};
  return session;
}
export function observeSignPracticeFeedback(config:SignPracticeConfig,session:SignPracticeSession,activities:readonly LessonTextActivitySnapshot[]) {
  const pending=session.feedback,branch=config.feedback.find(b=>b.id===pending?.id),id=pending?pending.id+(pending.stage==='outro'?'-outro':''):null;
  const definition=config.activities.find(d=>d.id===id);
  const exact=activities.filter(a=>a.id===id&&a.sourceInstanceId===branch?.sourceInstanceId&&a.frameDomain===definition?.frameDomain&&Number.isSafeInteger(a.revision)&&a.revision>(pending?.revisionFloor??Infinity));
  const activity=exact.length===1?exact[0]:undefined;
  const bound=Boolean(pending&&definition&&activity&&(pending.revision===null||activity.revision===pending.revision)&&Number.isInteger(activity.frame)&&activity.frame>=definition.startFrame&&activity.frame<=definition.endFrame);
  const wordAlpha=bound&&branch?.sourceWord?branch.sourceWord.alphaFrames.find(([f])=>f===activity!.frame)?.[1]??0:0;
  return {branch,definition,activity,bound,wordAlpha,visible:bound&&inFrames(activity!.frame,branch!.visibleFrames),popup:bound&&branch!.kind==='wrong'&&pending!.stage==='intro'&&inFrames(activity!.frame,branch!.popupFrames),
    complete:bound&&activity!.status==='completed'&&activity!.frame===definition!.endFrame&&(branch!.kind==='correct'||pending!.stage==='outro')};
}
/** The existing reducer remains the sole choice/RNG owner. Host refusal commits no draw. */
export function chooseSignPracticeAnswer(config:SignPracticeConfig,quiz:Quiz,session:SignPracticeSession,id:ChoiceId,runtime:AnimationRendererProps):SignPracticeSession {
  if(!permitted(quiz,session,runtime)||!runtime.onLessonFrameRequest||session.feedback||session.pendingFrame!==null||runtime.frame!==quiz.activityFrame||session.quiz.mode!=='ready')return session;
  const next=reduceCourseG04L03VbSignQuiz(quiz,session.quiz,{type:'choose',choiceId:id});if(next===session.quiz)return session;
  const branch=config.feedback.find(b=>b.kind===(next.choice?.correct?'correct':'wrong')&&b.variant===next.feedbackVariantIndex!+1);if(!branch)return session;
  const revisionFloor=Math.max(-1,...(runtime.lessonActivities??[]).filter(a=>a.sourceInstanceId===branch.sourceInstanceId&&Number.isSafeInteger(a.revision)).map(a=>a.revision));
  if(runtime.onLessonActivityRequest?.({id:branch.id,parentFrame:runtime.frame})!==true)return session;
  return {...session,quiz:next,focusTarget:id,feedback:{id:branch.id,stage:'intro',revisionFloor,revision:null}};
}
export function closeSignPracticeWrong(config:SignPracticeConfig,session:SignPracticeSession,runtime:AnimationRendererProps):SignPracticeSession {
  const seen=observeSignPracticeFeedback(config,session,runtime.lessonActivities??[]);
  if(runtime.paused||runtime.lang!=='en'||runtime.scenario!=='source-static-frame'||runtime.entryStateSha256||(runtime.frameDomain??config.frameDomain)!==config.frameDomain||runtime.frame!==config.activities[0].parentFrames[0]||(runtime.seed>>>0)!==session.quiz.seed||(runtime.replay??0)!==session.replay||!seen.popup||!seen.activity||!session.feedback)return session;
  if(runtime.onLessonActivityRequest?.({id:session.feedback.id+'-outro',parentFrame:runtime.frame,fromActivity:{id:seen.activity.id,revision:seen.activity.revision}})!==true)return session;
  return {...session,feedback:{...session.feedback,stage:'outro',revisionFloor:seen.activity.revision,revision:null}};
}
export function finishSignPracticeFeedback(config:SignPracticeConfig,quiz:Quiz,session:SignPracticeSession,runtime:AnimationRendererProps):SignPracticeSession {
  const seen=observeSignPracticeFeedback(config,session,runtime.lessonActivities??[]);if(!permitted(quiz,session,runtime)||!seen.complete)return session;
  if(seen.branch!.kind==='correct') {
    const edge={fromFrame:quiz.activityFrame,toFrame:quiz.postCorrectStartFrame,stopFrame:quiz.postCorrectEndFrame};
    if(runtime.onLessonFrameRequest?.(edge)!==true)return session;
    return {...session,feedback:null,pendingFrame:runtime.frame,focusTarget:null};
  }
  return {...session,quiz:reduceCourseG04L03VbSignQuiz(quiz,session.quiz,{type:'close-wrong'}),feedback:null};
}
export function getSignPracticeSnapshot(config:SignPracticeConfig,quiz:Quiz,state:SourceStaticCanvasFrameState,context:RuntimeContext,stored=createSignPracticeSession(quiz,context.seed,context.replay??0),activities:readonly LessonTextActivitySnapshot[]=[]):TextPresentationSnapshot {
  const blockers:string[]=[];
  if(state.status!=='ready'||state.blocker||state.animationId!==config.animationId||state.sourceSwfSha256!==config.sourceSha256)blockers.push('source-identity-mismatch');
  if(context.lang!=='en'||state.language!=='en')blockers.push('source-verified-spanish-page-text-missing');
  if(context.scenario!=='source-static-frame'||state.scenario!==context.scenario||context.entryStateSha256)blockers.push('original-renderer-required');
  if((context.frameDomain??config.frameDomain)!==config.frameDomain||state.frameDomain!==config.frameDomain||!Number.isInteger(context.frame)||context.frame<1||context.frame>config.frameCount||state.frame!==context.frame||state.rootFrame!==config.rootFrame||(context.rootFrame!==undefined&&context.rootFrame!==config.rootFrame)||state.seed!==(context.seed>>>0))blockers.push('teaching-state-identity-mismatch');
  const session=synchronizeSignPracticeSession(stored,quiz,context),seen=observeSignPracticeFeedback(config,session,activities);
  const visible=(id:string)=>id==='root-title'?true:id==='wrong-explanation'||id==='close'?seen.popup:id===seen.branch?.sourceWord?.id?seen.wordAlpha>0:id.startsWith('feedback-')?id==='feedback-'+session.feedback?.id&&seen.visible:!seen.popup&&inFrames(context.frame,config.textFrames[id]??[]);
  return {schemaVersion:1,animationId:config.animationId,bindingVersion:config.binding.version,sourceSwfSha256:config.sourceSha256,status:blockers.length?'blocked':'ready',blockers,
    identity:{frame:state.frame,frameDomain:state.frameDomain,rootFrame:state.rootFrame,scenario:state.scenario,language:state.language,seed:state.seed,replay:context.replay??0},suppressedInstances:[],blocks:blockers.length?[]:config.binding.blocks.map(b=>({...b,text:config.text[b.id]??'',visible:visible(b.id)}))};
}
const CSS=`.vb-sign-native{container:vbsign / inline-size;max-inline-size:70rem;min-inline-size:0;margin:auto;padding:clamp(12px,3cqi,28px);background:#fffdf8;color:#17273c;border-radius:1rem;font:1.25rem/1.6 var(--lesson-font-body,system-ui,sans-serif)}.vb-sign-native *{box-sizing:border-box}.vb-sign-native [hidden]{display:none!important}.vb-sign-native h2{font:700 2.25rem/1.25 var(--lesson-font-display,system-ui,sans-serif);margin:0 0 .7rem;overflow-wrap:normal;word-break:normal}.vb-sign-native p{margin:.65em 0}.vb-sign-native__choices{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1rem;margin:1rem 0}.vb-sign-native button{font:inherit;color:inherit;min-inline-size:44px;min-block-size:44px;touch-action:manipulation;cursor:pointer}.vb-sign-native button:disabled{cursor:default}.vb-sign-native button:focus-visible,.vb-sign-native [tabindex]:focus-visible{outline:3px solid #1757af;outline-offset:3px}.vb-sign-native__answer{padding:.75rem;border:2px solid #4f7299;border-radius:.7rem;background:white;font-size:1.5rem!important;font-weight:700!important}.vb-sign-native__signed{display:inline-block;max-inline-size:100%;white-space:nowrap;overflow-x:auto;vertical-align:bottom;font-variant-numeric:tabular-nums}.vb-sign-native__term{background:none;border:0;padding:0 .05em;text-decoration:underline;text-underline-offset:.15em;color:#1757af!important}.vb-sign-native__feedback{border:2px solid #286b45;border-radius:.8rem;background:#eff9f2;padding:1rem}.vb-sign-native__feedback [data-lesson-text-block]{transition:none!important}.vb-sign-native__dialog{border:2px solid #9d4d36;border-radius:.8rem;background:#fff4ef;padding:1rem;scroll-margin-block-start:calc(var(--lesson-platform-header-height,0px) + 1rem)}.vb-sign-native__action{padding:.5rem 1rem;background:#1757af;color:white!important;border:1px solid #1757af;border-radius:.5rem}@container vbsign (max-width:40rem){.vb-sign-native h2{font-size:1.75rem}.vb-sign-native{font-size:1.125rem}.vb-sign-native__choices{grid-template-columns:1fr}}@media(max-width:480px){.vb-sign-native{padding-inline:0}}`;
export function createVbSignPracticePresentation(config:SignPracticeConfig,quiz:Quiz,getFrameState:(frame:number,context:RuntimeContext)=>SourceStaticCanvasFrameState):LessonTextPresentationCapability<SourceStaticCanvasFrameState> {
  function Renderer(props:AnimationRendererProps) {
    const context={...props,frameDomain:props.frameDomain??config.frameDomain},source=(props.state??getFrameState(props.frame,context)) as SourceStaticCanvasFrameState;
    const [stored,setStored]=useState(()=>createSignPracticeSession(quiz,props.seed,props.replay??0)),session=synchronizeSignPracticeSession(stored,quiz,context);
    const activities=props.lessonActivities??(props.lessonActivity?[props.lessonActivity]:[]),seen=observeSignPracticeFeedback(config,session,activities),snapshot=getSignPracticeSnapshot(config,quiz,source,context,session,activities);
    const root=useRef<HTMLElement>(null),consumed=useRef<string|null>(null),live=useRef(session);live.current=session;
    const ready=snapshot.status==='ready',locked=!ready||!!props.paused;
    useEffect(()=>{if(locked||!session.feedback||!seen.bound||!seen.activity)return;
      if(session.feedback.revision===null){setStored({...session,feedback:{...session.feedback,revision:seen.activity.revision}});return;}
      if(!seen.complete)return;const token=`${props.seed}:${props.replay??0}:${seen.activity.sourceInstanceId}:${seen.activity.id}:${seen.activity.revision}`;if(consumed.current===token)return;
      const next=finishSignPracticeFeedback(config,quiz,session,{...props,lessonActivities:activities});if(next!==session){consumed.current=token;live.current=next;setStored(next);}
    },[locked,session,seen.bound,seen.complete,seen.activity,props]);
    useLayoutEffect(()=>{const target=seen.popup?'wrong-dialog':session.feedback?'feedback':source.frame===config.frameCount?'replay':session.focusTarget;
      if(target){const e=root.current?.querySelector<HTMLElement>(`[data-vb-sign-focus="${target}"]`);e?.focus({preventScroll:true});if(target==='wrong-dialog')e?.scrollIntoView({block:'start',behavior:'instant'});}
    },[seen.popup,session.feedback?.id,session.feedback?.stage,session.focusTarget,source.frame===config.frameCount,props.replay]);
    if(!ready)return null;
    const block=(id:string)=>snapshot.blocks.find(b=>b.id===id)?.visible===true;
    const term=(key:string,text:string)=>{const entry=config.terms.find(t=>t.keyAttribute===key);if(!entry)return text;
      return <button type="button" className="vb-sign-native__term" disabled={!ready||!props.onLessonHostRequest} data-source-keyterm={key} data-keyterm-entry-id={entry.entryId} onClick={event=>props.onLessonHostRequest?.({type:'open-keyterm',entryId:entry.entryId,sourceAnimationId:config.animationId,playbackDisposition:'source-stop-timeline-and-audio-until-explicit-resume'},{trigger:event.currentTarget,keyTermIndexLanguage:'en'})}>{text}</button>;};
    const close=()=>{if(locked)return;const next=closeSignPracticeWrong(config,live.current,{...props,lessonActivities:activities});if(next!==live.current){live.current=next;setStored(next);}};
    const choose=(id:ChoiceId)=>{if(locked)return;const next=chooseSignPracticeAnswer(config,quiz,live.current,id,{...props,lessonActivities:activities});if(next!==live.current){live.current=next;setStored(next);}};
    const positive=config.animationId.endsWith('007'),key=positive?'Positive number':'Negative number';
    const explanation=()=> <>{term(key,positive?'Positive numbers':'Negative numbers')} are {term(positive?'Greater than':'Less than',positive?'greater than':'less than')}{'\u00a0'}{term('Zero','zero')}. Try again.</>;
    return <section ref={root} className="vb-sign-native" lang="en" data-modern-text-page={config.animationId} data-lesson-text-status="ready" data-lesson-frame={source.frame} data-lesson-replay={props.replay??0} data-feedback-activity-id={seen.activity?.id??''} data-feedback-activity-frame={seen.activity?.frame??''} data-feedback-stage={session.feedback?.stage??''} data-current-choice-mode={session.feedback?'feedback':session.quiz.mode}>
      <style>{CSS}</style><h2 data-lesson-text-block="root-title">{config.text['root-title']}</h2>
      <div hidden={seen.popup}>{block('instruction')&&<p data-lesson-text-block="instruction">Click the {term(key,positive?'positive number':'negative number')}.</p>}
        <div className="vb-sign-native__choices" role="group" aria-label="Answer choices">{quiz.choices.map(choice=>block('answer-'+choice.id)&&<button key={choice.id} type="button" className="vb-sign-native__answer" data-vb-sign-focus={choice.id} data-source-instance={choice.sourceInstance} data-source-button={choice.correct?22:21} data-lesson-text-block={'answer-'+choice.id} disabled={locked||source.frame!==quiz.activityFrame||session.quiz.mode!=='ready'||!!session.feedback||session.pendingFrame!==null||!props.onLessonActivityRequest||!props.onLessonFrameRequest} onClick={()=>choose(choice.id)}><span className="vb-sign-native__signed">{choice.label}</span></button>)}</div>
      </div>
      {session.feedback&&<div className="vb-sign-native__feedback" role="status" aria-live="polite" tabIndex={-1} data-vb-sign-focus="feedback">{seen.wordAlpha>0&&seen.branch?.sourceWord&&<p data-lesson-text-block={seen.branch.sourceWord.id} style={{opacity:seen.wordAlpha}}>{config.text[seen.branch.sourceWord.id]}</p>}{seen.visible&&<p data-lesson-text-block={'feedback-'+session.feedback.id}>{config.text['feedback-'+session.feedback.id]}</p>}</div>}
      {seen.popup&&<div className="vb-sign-native__dialog" role="dialog" aria-modal="true" aria-label="Try again" tabIndex={-1} data-vb-sign-focus="wrong-dialog" onKeyDown={event=>{if(event.key==='Escape'){event.preventDefault();close();return;}if(event.key!=='Tab')return;const buttons=Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')).filter(e=>e.getClientRects().length);const i=buttons.indexOf(document.activeElement as HTMLButtonElement);if(buttons.length&&((event.shiftKey&&i<=0)||(!event.shiftKey&&i===buttons.length-1))){event.preventDefault();buttons[event.shiftKey?buttons.length-1:0].focus();}}}>
        <p data-lesson-text-block="wrong-explanation">{explanation()}</p><LessonSourceButton runtime={props} activityId={seen.branch!.closeActivityId!} className="vb-sign-native__action" type="button" data-lesson-text-block="close" disabled={locked} onClick={close}>Close</LessonSourceButton>
      </div>}
      {source.frame===config.frameCount&&<button type="button" className="vb-sign-native__action" data-vb-sign-focus="replay" disabled={!props.onReplay} onClick={props.onReplay}>Replay</button>}
    </section>;
  }
  const main=config.mainAudio;
  return {schemaVersion:1,binding:config.binding,Renderer,getSnapshot:(s,c)=>getSignPracticeSnapshot(config,quiz,s,c),playbackMode:'once',playbackEndFrameByDomain:{[config.frameDomain]:quiz.activityFrame},reducedMotionFrameByDomain:{[config.frameDomain]:quiz.activityFrame},frameControl:{frameDomain:config.frameDomain,completionFrame:config.frameCount,transitions:[{fromFrame:quiz.activityFrame,toFrame:quiz.postCorrectStartFrame,stopFrame:quiz.postCorrectEndFrame}]},activityTimelines:config.activities,
    sourceTimelineAudioCues:[{id:'source-main',sourceCueId:config.frameDomain+'-original-stream',frame:main.firstFrame,endFrame:main.lastFrame+1,frameDomain:config.frameDomain,language:'shared',spokenLanguage:'undetermined',source:main.source,sha256:main.sha256}],
    keyTerms:{indexLanguage:'en',sourceAssetId:'ELKTEG4.xml',sourceSha256:'bec389ce286b9a113297dfd87e052f28cf1da2640d93a277f91f669dfb3ef749',entryIds:config.terms.map(t=>t.entryId)}};
}
