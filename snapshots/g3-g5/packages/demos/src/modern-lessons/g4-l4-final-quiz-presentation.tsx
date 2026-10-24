'use client';
import React,{useEffect,useRef,useState} from 'react';
import type {AnimationRendererProps,RuntimeContext} from '../contract';
import type {LessonTextBinding,LessonTextPresentationCapability,TextPresentationSnapshot} from '../lesson-text-contract';
import type {SourceStaticCanvasFrameState} from '../source-static-canvas-candidate';
import {buildLessonTextSnapshot,validateLessonTextBinding} from '../lesson-text-snapshot';
import {gradeFinalQuizScore as grade} from './g4-l4-final-quiz-state';
import {FinalQuizScene,type FinalQuizConfig} from './g4-l4-final-quiz';
import {sourceFrame} from './g4-l4-final-quiz-state';
import {createFinalQuizHostSession,dispatchFinalQuizHost,finalQuizFrameControl,synchronizeFinalQuizHost,type FinalQuizAction,type FinalQuizHostSession,type FinalQuizHostSpec} from './g4-l4-final-quiz-host';

export interface FinalQuizPresentationConfig extends FinalQuizConfig,Omit<FinalQuizHostSpec,'questions'> {readonly animationId:string;readonly sourceSha256:string;readonly binding:LessonTextBinding}
export function getFinalQuizSnapshot(c:FinalQuizPresentationConfig,source:SourceStaticCanvasFrameState,r:RuntimeContext,stored=createFinalQuizHostSession(r.seed,r.replay??0)):TextPresentationSnapshot {
 const blockers:string[]=[];
 if(source.status!=='ready'||source.blocker||source.animationId!==c.animationId||source.sourceSwfSha256!==c.sourceSha256)blockers.push('source-identity-mismatch');
 if(r.lang!=='en'||source.language!=='en')blockers.push('spanish-text-not-source-verified');
 if(r.scenario!=='source-static-frame'||source.scenario!==r.scenario||r.entryStateSha256)blockers.push('original-renderer-required');
 if((r.frameDomain??c.frameDomain)!==c.frameDomain||source.frameDomain!==c.frameDomain||!Number.isInteger(r.frame)||r.frame<1||r.frame>c.frameCount||source.frame!==r.frame||source.rootFrame!==6||(r.rootFrame!==undefined&&r.rootFrame!==6)||source.seed!==(r.seed>>>0))blockers.push('teaching-state-identity-mismatch');
 const session=synchronizeFinalQuizHost(c,stored,r),s=session.quiz;
 const settled=Boolean(s&&sourceFrame(s,c.questions)===r.frame&&(!session.pending||session.pending.to===r.frame));
 if(!s&&r.frame!==1)blockers.push('missing-quiz-session-for-source-frame');
 const values:Record<string,{text:string;visible:boolean}>=Object.fromEntries(c.binding.blocks.map(b=>[b.id,{text:'',visible:false}]));
 const set=(id:string,text:string,visible=true)=>{values[id]={text,visible};};
 set('root-title',c.title);
 if(s&&settled){
  const review=s.phase==='review'||s.phase==='finish',index=Math.min(review?s.reviewIndex??0:s.questionIndex,s.order.length-1);
  const q=c.questions.find(q=>q.id===s.order[index])!,response=s.responses.find(a=>a.questionId===q.id),correct=q.options.find(a=>a.correct)!;
  const visible=s.phase==='question'||s.phase==='review',summary=s.finishOverlayVisible||s.resultOverlayVisible;
  set('review-heading','Quiz Review',review&&visible);
  set('question-progress',`${review?'Review':'Question'} ${index+1} of ${s.order.length}`,visible);
  set(`q${q.id}-prompt`,q.column?`${q.column.top} ${q.column.operator} ${q.column.bottom}`:q.prompt,visible);
  if(q.expression)set(`q${q.id}-expression`,q.expression,visible);
  for(const o of q.options)set(`q${q.id}-option-${o.option}`,`${o.option} ${o.value}`,visible);
  if(response){set('review-response',`Your Answer: ${response.option}. Correct Answer: ${correct.option}.`,review&&visible);set(`q${q.id}-feedback`,response.correct?'Correct':'Incorrect',review&&visible);}
  if(c.reviewCorrectOptionFeedback===true)set(`q${q.id}-correct-feedback`,'Correct',Boolean(response&&response.option!==correct.option&&review&&visible));
  set('completion-message','You have completed the quiz.',summary);
  const score=s.responses.filter(a=>a.correct).length;set('score',`Your score is ${score} of ${s.order.length}. ${grade(score,c.questionPoolSize??25)}`,summary);
  set('review-start','Click here to start review',s.phase==='results');
  set('review-next','Continue',s.phase==='review');
  set('quiz-audio','Question and answer audio',s.phase==='question');
 }
 const base=buildLessonTextSnapshot(c.binding,{...r,rootFrame:r.rootFrame??6,frameDomain:r.frameDomain??c.frameDomain},values);
 return blockers.length?{...base,status:'blocked',blockers:[...base.blockers,...blockers],blocks:[],suppressedInstances:[]}:base;
}

export function createFinalQuizPresentation(c:FinalQuizPresentationConfig,getFrameState:(frame:number,r:RuntimeContext)=>SourceStaticCanvasFrameState,Fallback:React.ComponentType<AnimationRendererProps>):LessonTextPresentationCapability<SourceStaticCanvasFrameState>{
 validateLessonTextBinding(c.binding);
 const completion={id:c.animationId+'-answered',frameDomain:c.frameDomain,frames:c.mode==='random-ten'?c.questions.map(q=>q.questionFrame):[c.questions.at(-1)!.questionFrame]};
 function Session(r:AnimationRendererProps){
  const context={...r,frameDomain:r.frameDomain??c.frameDomain,rootFrame:r.rootFrame??6},source=(r.state??getFrameState(r.frame,context))as SourceStaticCanvasFrameState;
  const [stored,set]=useState(()=>createFinalQuizHostSession(r.seed,r.replay??0));
  const session=synchronizeFinalQuizHost(c,stored,context),snapshot=getFinalQuizSnapshot(c,source,context,session);
  const live=useRef(session),runtime=useRef(context);live.current=session;runtime.current=context;
  const commit=(next:FinalQuizHostSession)=>{if(next!==live.current){live.current=next;set(next);}};
  const dispatch=(action:FinalQuizAction)=>{if(snapshot.status==='ready')commit(dispatchFinalQuizHost(c,live.current,action,runtime.current));};
  useEffect(()=>{if(snapshot.status==='ready')commit(dispatchFinalQuizHost(c,live.current,{type:'enter'},runtime.current));},[r.frame,r.seed,r.replay,r.paused,snapshot.status]);
  const ready=Boolean(session.quiz&&sourceFrame(session.quiz,c.questions)===r.frame&&(!session.pending||session.pending.to===r.frame));
  const completionSent=useRef(false);
  useEffect(()=>{
   const quiz=session.quiz;
   if(completionSent.current||snapshot.status!=='ready'||!ready||r.paused||!r.onLessonCompletionRequest
    ||!quiz||quiz.phase!=='results'||!quiz.finishOverlayVisible||quiz.questionIndex!==quiz.order.length
    ||quiz.responses.length!==quiz.order.length||!quiz.responses.every((answer,i)=>answer.questionId===quiz.order[i]))return;
   // Keep the source's last-question hold. Completion is a separate host signal,
   // acknowledged once per Replay session; refusal does not consume it.
   completionSent.current=r.onLessonCompletionRequest({id:completion.id,frameDomain:c.frameDomain,frame:r.frame,seed:r.seed,replay:r.replay??0})===true;
  },[session.quiz,snapshot.status,ready,r.paused,r.onLessonCompletionRequest,r.frame,r.seed,r.replay]);
  if(snapshot.status!=='ready')return <Fallback {...r} state={source}/>;
  return <div data-modern-text-page={c.animationId} data-lesson-frame={r.frame} data-lesson-replay={r.replay??0} data-flash-frame-domain={c.frameDomain} data-flash-root-frame={6} data-quiz-awaiting-frame={!ready}>
   {ready&&session.quiz?<FinalQuizScene config={c} state={session.quiz} runtime={context} ready onAnswer={(questionId,option)=>dispatch({type:'answer',questionId,option})} onReview={()=>dispatch({type:'review'})} onNext={()=>dispatch({type:'next'})}/>:<section aria-busy="true"><h2 data-lesson-text-block="root-title">{c.title}</h2></section>}
  </div>;
 }
 const Renderer=(r:AnimationRendererProps)=><Session key={`${c.mode}:${r.seed>>>0}:${r.replay??0}:${r.frameDomain}:${r.rootFrame}:${r.scenario}:${r.lang}`} {...r}/>;
 return {schemaVersion:1,binding:c.binding,Renderer,getSnapshot:(s,r)=>getFinalQuizSnapshot(c,s,r),playbackMode:'once',playbackEndFrameByDomain:{[c.frameDomain]:1},reducedMotionFrameByDomain:{[c.frameDomain]:1},frameControl:finalQuizFrameControl(c),completion};
}
