'use client';
import React,{useEffect,useRef,useState} from 'react';
import type {AnimationRendererProps} from './contract';
import type {P023FrameState} from './nms-l02-p023-timeline-v1';
import {p023TeachingState,p023TextSnapshot,type P023TermKey} from './nms-l02-p023-text-v1';
import './nms-l02-p023-v1.css';
export type P023TermEntries=Readonly<Record<P023TermKey,string>>;
export interface P023PresentationProps {readonly state:P023FrameState;readonly uiLanguage?:'en'|'es';readonly termEntries?:P023TermEntries;readonly onLessonHostRequest?:AnimationRendererProps['onLessonHostRequest'];readonly onSourceStop?:()=>void;readonly reducedMotion?:boolean;}
export function NmsL2P023Presentation({state,uiLanguage=state.language,termEntries,onLessonHostRequest,onSourceStop,reducedMotion=false}:P023PresentationProps){
 const t=p023TeachingState(state),snapshot=p023TextSnapshot(state),latest=useRef(state);latest.current=state;
 const[blocked,setBlocked]=useState(false);useEffect(()=>setBlocked(false),[state.replay]);
 if(snapshot.status!=='ready')return <p role="alert">{uiLanguage==='es'?'La página no está disponible.':'The page is unavailable.'}</p>;
 const term=(key:P023TermKey,text:string)=>{
  const entryId=termEntries?.[key];
  if(!t.termAvailable[key]||!entryId||!onLessonHostRequest)return <span className="nms-l02-p023__term-pending">{text}</span>;
  return <button type="button" className="nms-l02-p023__term" data-source-key-attribute={key} onClick={event=>{
   if(!p023TeachingState(latest.current).termAvailable[key]){setBlocked(true);return;}
   const decision=onLessonHostRequest({type:'open-keyterm',entryId,sourceAnimationId:state.animationId,playbackDisposition:'source-stop-timeline-and-audio-until-explicit-resume'},{trigger:event.currentTarget});setBlocked(decision?.status!=='allowed');if(decision?.status==='allowed')onSourceStop?.();
  }}>{text}</button>;
 };
 const keys:Readonly<Record<number,P023TermKey>>={0:'Fraction',2:'Part',4:'Whole',6:'Number line'};
 const ticksEmphasis=reducedMotion?t.ticksEmphasisReduced:t.ticksEmphasis,zeroEmphasis=reducedMotion?t.zeroEmphasisReduced:t.zeroEmphasis,oneEmphasis=reducedMotion?t.oneEmphasisReduced:t.oneEmphasis;
 const redEnd=30+300*t.redProgress,blueEnd=330+300*t.blueProgress;
 const fraction=React.createElement('math',{xmlns:'http://www.w3.org/1998/Math/MathML',display:'inline',displaystyle:'true','aria-label':'1/2'},React.createElement('mfrac',null,React.createElement('mn',null,'1'),React.createElement('mn',null,'2')));
 return <section className="nms-l02-p023 lesson-text-presentation" lang="en" data-p023-frame={state.frame} data-p023-domain={state.frameDomain} data-p023-text-status={snapshot.status} data-content-language="en" data-reduced-motion={reducedMotion}>
  {t.headingVisible&&<header className="nms-l02-p023__header"><p data-lesson-text-block="course-title">Fractions, Decimals, and Percents Concepts:</p><h2 data-lesson-text-block="activity-title">Instruction</h2></header>}
  {uiLanguage==='es'&&<p className="nms-l02-p023__fallback" lang="es">Esta página conserva el texto y el audio originales en inglés. Las definiciones de los términos están disponibles en español.</p>}
  <p className="nms-l02-p023__definition" data-lesson-text-block="definition">{t.first.map((r,i)=><React.Fragment key={r.sourceTextId}>{keys[i]?term(keys[i]!,r.visibleText):<span>{r.visibleText}</span>}</React.Fragment>)}{t.second.map(r=><span key={r.sourceTextId}>{r.visibleText}</span>)}</p>
  <figure className="nms-l02-p023__numberline" style={{opacity:t.axisAlpha,transform:`translateY(${t.entranceOffset}px)`}} aria-hidden={t.axisAlpha===0} aria-label={uiLanguage==='es'?'Recta numérica de cero a uno dividida en doce intervalos iguales':'Number line from zero to one divided into twelve equal intervals'} data-intervals="12" data-midpoint={t.midpointVisible?'1/2':undefined} data-red-progress={t.redProgress} data-blue-progress={t.blueProgress} data-ticks-emphasis={ticksEmphasis}>
   <div className="nms-l02-p023__labels">
    <span className="nms-l02-p023__zero" data-lesson-text-block="zero" data-emphasis={zeroEmphasis}>0</span>
    {t.halfAlpha>0&&<span className="nms-l02-p023__half" data-lesson-text-block="half" style={{opacity:t.halfAlpha}}>{fraction}</span>}
    <span className="nms-l02-p023__one" data-lesson-text-block="one" data-emphasis={oneEmphasis}>1</span>
   </div>
   <div className="nms-l02-p023__axis-wrap"><svg className="nms-l02-p023__axis" viewBox="0 0 660 90" preserveAspectRatio="none" aria-hidden="true" focusable="false">
    <path d="M12 55 H648 M12 55 L23 50 L23 60 Z M648 55 L637 50 L637 60 Z" fill="#263c50" stroke="#263c50" strokeWidth="2" vectorEffect="non-scaling-stroke"/>
    {Array.from({length:13},(_,i)=>{const x=30+50*i,dy=i%2===0?13:7;return <line key={i} data-p023-tick={i} x1={x} x2={x} y1={55-dy} y2={55+dy} stroke={ticksEmphasis&&i>0&&i<12?'#ce202b':'#263c50'} strokeWidth={ticksEmphasis&&i>0&&i<12?4:2} vectorEffect="non-scaling-stroke"/>})}
    {t.redVisible&&<g stroke="#ce202b" fill="#ce202b" strokeWidth="2" data-p023-arrow="red"><line x1="30" y1="25" x2={redEnd} y2="25" vectorEffect="non-scaling-stroke"/><path d={`M${redEnd} 25 l-10 -5 v10 Z`} vectorEffect="non-scaling-stroke"/></g>}
    {t.blueVisible&&<g stroke="#1257ce" fill="#1257ce" strokeWidth="2" data-p023-arrow="blue"><line x1="330" y1="25" x2={blueEnd} y2="25" vectorEffect="non-scaling-stroke"/><path d={`M${blueEnd} 25 l-10 -5 v10 Z`} vectorEffect="non-scaling-stroke"/></g>}
   </svg>{t.midpointVisible&&<span className="nms-l02-p023__midpoint" aria-hidden="true" data-p023-midpoint="true"/>}</div>
  </figure>
  {blocked&&<p role="alert" lang={uiLanguage}>{uiLanguage==='es'?'El término no está disponible.':'The term is unavailable.'}</p>}
 </section>;
}
