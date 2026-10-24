'use client';
import React,{useEffect,useRef,useState} from 'react';
import type {AnimationRendererProps,RuntimeContext} from '../contract';
import type {LessonTextPresentationCapability,TextPresentationSnapshot} from '../lesson-text-contract';
import type {SourceStaticCanvasFrameState} from '../source-static-canvas-candidate';
import {validateLessonTextBinding} from '../lesson-text-snapshot';
import {getColumnTextSnapshot} from './g4-l4-column-arithmetic';
import {getPlaceValuePracticeCopy,PlaceValuePracticeScene,type PlaceValuePracticeConfig} from './g4-l4-place-value-practice-scene';
import {createPracticeSession,synchronizePracticeSession,dispatchPractice,practiceFrameControl,type PracticeSession} from './g4-l4-place-value-practice-host';

export function getPracticeTextSnapshot(c:PlaceValuePracticeConfig,state:SourceStaticCanvasFrameState,r:RuntimeContext):TextPresentationSnapshot {
 const mathIds=new Set(c.blocks.map(b=>b.id));
 const base=getColumnTextSnapshot({...c,binding:{...c.binding,blocks:c.binding.blocks.filter(b=>mathIds.has(b.id))}},state,r);
 if(base.status!=='ready')return base;
 const values=new Map(base.blocks.map(b=>[b.id,b]));
 for(const p of getPlaceValuePracticeCopy(c,state.frame))values.set(p.id,{id:p.id,role:'body',language:'en',readingOrder:0,text:p.tokens.filter(t=>t.alpha>0).map(t=>t.text).join(''),visible:p.visible&&p.tokens.some(t=>t.alpha>0)});
 values.set(c.button.id,{id:c.button.id,role:'label',language:'en',readingOrder:0,text:c.button.text,visible:true});
 return {...base,blocks:c.binding.blocks.map(b=>({...values.get(b.id)!,role:b.role,language:b.language,readingOrder:b.readingOrder}))};
}
export function createPlaceValuePracticePresentation(c:PlaceValuePracticeConfig,getFrameState:(frame:number,r:RuntimeContext)=>SourceStaticCanvasFrameState,Fallback:React.ComponentType<AnimationRendererProps>):LessonTextPresentationCapability<SourceStaticCanvasFrameState>{
 validateLessonTextBinding(c.binding);
 function Renderer(r:AnimationRendererProps){
  const context={...r,frameDomain:r.frameDomain??c.frameDomain},source=(r.state??getFrameState(r.frame,context))as SourceStaticCanvasFrameState;
  const snapshot=getPracticeTextSnapshot(c,source,context),[stored,set]=useState(()=>createPracticeSession(r.seed,r.replay??0));
  const session=synchronizePracticeSession(c,stored,context),live=useRef(session),runtime=useRef(context);live.current=session;runtime.current=context;
  const commit=(next:PracticeSession)=>{if(next!==live.current){live.current=next;set(next);}};
  useEffect(()=>{if(snapshot.status==='ready')commit(dispatchPractice(c,live.current,'enter',runtime.current));},[r.frame,r.seed,r.replay,r.paused,snapshot.status]);
  if(snapshot.status!=='ready')return <Fallback {...r} state={source}/>;
  const ready=Boolean(session.practice&&session.practice.frame===r.frame&&(!session.pendingFrame||session.pendingFrame.to===r.frame));
  return <div data-modern-text-page={c.animationId} data-lesson-frame={r.frame} data-lesson-replay={r.replay??0} data-flash-frame-domain={c.frameDomain} data-flash-root-frame={6} data-place-value-question={ready?session.practice?.question:undefined} data-place-value-visit={session.practice?.visit} data-place-value-navigation={session.practice?.lastNavigation} data-place-value-draws={session.practice?.lastDraws.join(',')}>
   <PlaceValuePracticeScene config={c} frame={r.frame} replay={r.replay} paused={r.paused} ready={ready} onNewProblem={r.onLessonFrameRequest?()=>commit(dispatchPractice(c,live.current,'new-problem',runtime.current)):undefined}/>
  </div>;
 }
 return {schemaVersion:1,binding:c.binding,Renderer,getSnapshot:(s,r)=>getPracticeTextSnapshot(c,s,r),playbackMode:'once',playbackEndFrameByDomain:{[c.frameDomain]:c.initialQuestionFrame},reducedMotionFrameByDomain:{[c.frameDomain]:c.initialQuestionFrame},frameControl:practiceFrameControl(c),sourceTimelineAudioCues:c.sourceAudio};
}
