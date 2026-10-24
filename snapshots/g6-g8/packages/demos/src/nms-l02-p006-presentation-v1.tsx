'use client';
import React,{useEffect,useRef,useState} from 'react';
import type {AnimationRendererProps} from './contract';
import {getNmsL2P006FrameState,type P006FrameState} from './nms-l02-p006-timeline-v1';
import {NmsL2P006Artwork} from './nms-l02-p006-artwork-v1';
import {p006TeachingState,p006TextSnapshot,type P006TermKey} from './nms-l02-p006-text-v1';
export interface P006PresentationProps{readonly state:P006FrameState;readonly uiLanguage?:'en'|'es';readonly reducedMotion?:boolean;readonly termEntries?:Readonly<Record<P006TermKey,string>>;readonly onLessonHostRequest?:AnimationRendererProps['onLessonHostRequest'];readonly onSourceStop?:()=>void;}
export function NmsL2P006Presentation({state,uiLanguage=state.language,reducedMotion=false,termEntries,onLessonHostRequest,onSourceStop}:P006PresentationProps){
 const t=p006TeachingState(state),snapshot=p006TextSnapshot(state),latest=useRef(state);latest.current=state;
 const[blocked,setBlocked]=useState(false);useEffect(()=>{setBlocked(false);},[state.replay]);
 if(snapshot.status!=='ready')return <p role="alert">{uiLanguage==='es'?'La página no está disponible.':'The page is unavailable.'}</p>;
 return <section className="nms-l02-p006 lesson-text-presentation" lang="en" data-p006-frame={state.frame} data-p006-domain={state.frameDomain} data-p006-root-frame={state.rootFrame} data-p006-text-status={snapshot.status} data-content-language="en">
 {uiLanguage==='es'&&<p className="nms-l02-p006__fallback" lang="es">Texto original en inglés.</p>}
 {t.headingVisible&&<header className="nms-l02-p006__header"><p data-lesson-text-block="course-title">Fractions, Decimals and Percents Concepts:</p><h2 data-lesson-text-block="activity-title">Real World Activity</h2></header>}
 {state.mainFrame!==null&&<figure className="nms-l02-p006__figure" aria-label="Four scenes show hikers crossing a bridge, walking along a mountain trail, hiking through a forest, and climbing rocks."><NmsL2P006Artwork state={reducedMotion?getNmsL2P006FrameState(153,{seed:state.seed,lang:state.language,replay:state.replay}):state}/></figure>}
 {t.panel&&<div className="nms-l02-p006__question-card">
 {t.heading&&<h3 data-lesson-text-block="essential-heading">{t.heading}</h3>}
 {t.question&&<p data-lesson-text-block="essential-question">{t.parts.map((part,index)=>{
 const entryId=part.term?termEntries?.[part.term]:undefined;
 if(!part.term||!part.complete||!entryId||!onLessonHostRequest)return <React.Fragment key={index}>{part.text}</React.Fragment>;
 return <button key={index} type="button" className="nms-l02-p006__term" data-source-key-attribute={part.term} data-source-text-id={part.sourceTextId} onClick={event=>{
 if(!p006TeachingState(latest.current).parts.some(p=>p.term===part.term&&p.complete)){setBlocked(true);return;}
 const decision=onLessonHostRequest({type:'open-keyterm',entryId,sourceAnimationId:state.animationId,playbackDisposition:'source-stop-timeline-and-audio-until-explicit-resume'},{trigger:event.currentTarget});setBlocked(decision?.status!=='allowed');if(decision?.status==='allowed')onSourceStop?.();
 }}>{part.text}</button>;
 })}</p>}
 </div>}
 {blocked&&<p role="alert" lang={uiLanguage}>{uiLanguage==='es'?'El término no está disponible.':'The term is unavailable.'}</p>}
 </section>;
}
