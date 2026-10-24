'use client';
import React,{useEffect,useRef,useState}from'react';
import type{AnimationRendererProps}from'./contract';
import type{P018FrameState}from'./nms-l02-p018-timeline-v1';
import{p018TeachingState,p018TextSnapshot,type P018TermKey}from'./nms-l02-p018-text-v1';
export type P018TermEntries=Readonly<Record<P018TermKey,string>>;
export interface P018PresentationProps{readonly state:P018FrameState;readonly uiLanguage?:'en'|'es';readonly termEntries?:P018TermEntries;readonly onLessonHostRequest?:AnimationRendererProps['onLessonHostRequest'];readonly onSourceStop?:()=>void;readonly reducedMotion?:boolean;}
export function NmsL2P018Presentation({state,uiLanguage=state.language,termEntries,onLessonHostRequest,onSourceStop,reducedMotion=false}:P018PresentationProps){
 const t=p018TeachingState(state),snapshot=p018TextSnapshot(state),latest=useRef(state);latest.current=state;
 const[blocked,setBlocked]=useState(false);useEffect(()=>setBlocked(false),[state.replay]);
 if(snapshot.status!=='ready')return <p role="alert">{uiLanguage==='es'?'La página no está disponible.':'The page is unavailable.'}</p>;
 const term=(key:P018TermKey,children:React.ReactNode,label:string)=>{
  const entryId=termEntries?.[key];
  if(!t.termAvailable[key]||!entryId||!onLessonHostRequest)return <>{children}</>;
  return <button type="button" className="nms-l02-p018__term" data-source-key-attribute={key} aria-label={label} onClick={event=>{
   if(!p018TeachingState(latest.current).termAvailable[key]){setBlocked(true);return;}
   const decision=onLessonHostRequest({type:'open-keyterm',entryId,sourceAnimationId:state.animationId,playbackDisposition:'source-stop-timeline-and-audio-until-explicit-resume'},{trigger:event.currentTarget});setBlocked(decision?.status!=='allowed');if(decision?.status==='allowed')onSourceStop?.();
  }}>{children}</button>;
 };
 const frame=state.mainFrame??1,emphasis=(name:'numerator'|'denominator')=>reducedMotion?(name==='numerator'?frame>=30&&frame<=36:frame>=75&&frame<=81):t.emphasis[name];
 const fraction=(top:string,bottom:string,labels=false)=>React.createElement('math',{displaystyle:'true','aria-label':labels?`${top} divided by ${bottom}`:`${top}/${bottom}`},React.createElement('mfrac',null,React.createElement(labels?'mtext':'mn',{className:labels&&emphasis('numerator')?'nms-l02-p018__emphasis':undefined},top),React.createElement(labels?'mtext':'mn',{className:labels&&emphasis('denominator')?'nms-l02-p018__emphasis':undefined},bottom)));
 // Arrow follows the source morph clock: its short initial shaft grows toward
 // the red half. Geometry is normalized to a true circle with exactly half red.
 const arrowX=212-(212-169)*t.arrowProgress,arrowY=205-(205-137)*t.arrowProgress;
 return <section className="nms-l02-p018 lesson-text-presentation" lang="en" data-p018-frame={state.frame} data-p018-domain={state.frameDomain} data-p018-text-status={snapshot.status} data-content-language="en" data-reduced-motion={reducedMotion}>
  {uiLanguage==='es'&&<p className="nms-l02-p018__fallback" lang="es">Texto original en inglés.</p>}
  {t.headingVisible&&<header className="nms-l02-p018__header"><p data-lesson-text-block="course-title">Fractions, Decimals, and Percents Concepts:</p><h2 data-lesson-text-block="activity-title">Instruction</h2></header>}
  <div className="nms-l02-p018__comparison">
   {t.fraction&&<div className="nms-l02-p018__panel nms-l02-p018__formula" data-lesson-text-block="formula" style={{opacity:t.formulaAlpha}}><span>{term('Fraction',t.fraction.trimEnd(),'Fractions')} {t.equals}</span>{fraction(t.numerator,t.denominator,true)}</div>}
   {t.circleAlpha>0&&<div className="nms-l02-p018__panel">
    <svg className="nms-l02-p018__diagram" viewBox="0 0 260 250" role="img" aria-label={t.redAlpha>0?'A circle divided into two equal parts; one half is colored red':t.dividerProgress===1?'A circle divided into two equal parts':'A circle'} data-equal-parts={t.dividerProgress===1?2:undefined} data-shaded-parts={t.redAlpha>0?1:0}>
     <circle cx="140" cy="100" r="70" fill="#fffdf7" stroke="#263c50" strokeWidth="2" opacity={t.circleAlpha}/>
     {t.redAlpha>0&&<path d="M140 30 A70 70 0 0 1 140 170 Z" fill="#df282f" stroke="#263c50" strokeWidth="2" opacity={t.redAlpha}/>}
     {t.dividerProgress>0&&<line x1="140" y1="30" x2="140" y2={30+140*t.dividerProgress} stroke="#263c50" strokeWidth="2" data-divider-progress={t.dividerProgress}/>}
     {t.arrowVisible&&<g data-arrow-progress={t.arrowProgress} stroke="#263c50" strokeWidth="2" fill="#263c50"><line x1="217" y1="213" x2={arrowX} y2={arrowY}/><path d={`M${arrowX} ${arrowY} l1 12 l9 -6 Z`}/></g>}
    </svg>
    {t.fractionNumerator&&t.fractionDenominator&&<p className="nms-l02-p018__caption" data-lesson-text-block="caption">{fraction(t.fractionNumerator,t.fractionDenominator)}{' '}{t.captionBefore}{term('Circle',t.captionCircle,'circle')}{t.captionAfter}{t.captionLine2&&<>{' '}<span>{t.captionLine2}</span></>}</p>}
   </div>}
  </div>
  {blocked&&<p role="alert" lang={uiLanguage}>{uiLanguage==='es'?'El término no está disponible.':'The term is unavailable.'}</p>}
 </section>;
}
