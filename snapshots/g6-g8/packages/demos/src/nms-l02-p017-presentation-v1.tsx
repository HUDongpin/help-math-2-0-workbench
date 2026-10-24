'use client';
import React,{useEffect,useRef,useState}from'react';
import type{AnimationRendererProps}from'./contract';
import type{P017FrameState}from'./nms-l02-p017-timeline-v1';
import{p017TeachingState,p017TextSnapshot,type P017TermKey}from'./nms-l02-p017-text-v1';

export type P017TermEntries=Readonly<Record<P017TermKey,string>>;
export interface P017PresentationProps{readonly state:P017FrameState;readonly uiLanguage?:'en'|'es';readonly termEntries?:P017TermEntries;readonly onLessonHostRequest?:AnimationRendererProps['onLessonHostRequest'];readonly onSourceStop?:()=>void;readonly reducedMotion?:boolean;}
export function NmsL2P017Presentation({state,uiLanguage=state.language,termEntries,onLessonHostRequest,onSourceStop,reducedMotion=false}:P017PresentationProps){
 const t=p017TeachingState(state),snapshot=p017TextSnapshot(state),latest=useRef(state);latest.current=state;
 const[blocked,setBlocked]=useState(false);useEffect(()=>setBlocked(false),[state.replay]);
 if(snapshot.status!=='ready')return <p role="alert">{uiLanguage==='es'?'La página no está disponible.':'The page is unavailable.'}</p>;
 const term=(key:P017TermKey,children:React.ReactNode,label:string,enabled=true)=>{
  const entryId=termEntries?.[key];
  if(!enabled||!t.termAvailable[key]||!entryId||!onLessonHostRequest)return <>{children}</>;
  return <button type="button" className="nms-l02-p017__term" data-source-key-attribute={key} aria-label={label} onClick={event=>{
   if(!p017TeachingState(latest.current).termAvailable[key]){setBlocked(true);return;}
   const decision=onLessonHostRequest({type:'open-keyterm',entryId,sourceAnimationId:state.animationId,playbackDisposition:'source-stop-timeline-and-audio-until-explicit-resume'},{trigger:event.currentTarget});setBlocked(decision?.status!=='allowed');if(decision?.status==='allowed')onSourceStop?.();
  }}>{children}</button>;
 };
 const frame=state.mainFrame??1;
 const emphasized=(name:'fraction'|'decimal'|'percent')=>reducedMotion?(name==='fraction'?frame>=38&&frame<=44:name==='decimal'?frame>=51&&frame<=59:frame>=65&&frame<=71):t.emphasis[name];
 const fractionWord=<><span className="sr-only">{t.openingUpper||t.openingLower}</span><span className="nms-l02-p017__crossfade" aria-hidden="true">{t.openingLower&&<span style={{opacity:t.openingLowerAlpha}} className={emphasized('fraction')?'nms-l02-p017__emphasis':undefined}>{t.openingLower}</span>}{t.openingUpper&&<span style={{opacity:t.openingUpperAlpha}}>{t.openingUpper}</span>}</span></>;
 const opening=t.openingLower||t.openingUpper;
 // Source22 and newly revealed definition letters overlap at the same position.
 // Keep a single accessible Fractions word until the mask has revealed it fully.
 const crossfadeWord=Boolean(t.openingUpper)&&frame>=124;
 const definitionWords=t.words.filter((_,i)=>!crossfadeWord||i>0);
 const fractionFigure=(numerator:string,denominator:string)=>React.createElement('math',{displaystyle:'true','aria-label':`${numerator}/${denominator}`},React.createElement('mfrac',null,React.createElement('mn',null,numerator),React.createElement('mn',null,denominator)));
 return <section className="nms-l02-p017 lesson-text-presentation" lang="en" data-p017-frame={state.frame} data-p017-domain={state.frameDomain} data-p017-text-status={snapshot.status} data-content-language="en" data-reduced-motion={reducedMotion}>
  {uiLanguage==='es'&&<p className="nms-l02-p017__fallback" lang="es">Texto original en inglés.</p>}
  {t.headingVisible&&<header className="nms-l02-p017__header"><p data-lesson-text-block="course-title">Fractions, Decimals, and Percents Concepts:</p><h2 data-lesson-text-block="activity-title">Instruction</h2></header>}
  {(opening||t.definition)&&<div className="nms-l02-p017__definition">
   {opening&&frame<124&&<p data-lesson-text-block="opening" className={frame<96?'nms-l02-p017__opening-phrase':'nms-l02-p017__intro'}><span className={frame>=96?'nms-l02-p017__fraction-motion':undefined} style={{'--fraction-position':reducedMotion?0:t.openingPosition}as React.CSSProperties}>{term('Fraction',fractionWord,t.openingUpper||t.openingLower)}</span>{t.tail&&<span style={{opacity:t.tailAlpha}}><span className={emphasized('decimal')?'nms-l02-p017__emphasis':undefined}>decimals</span>, and <span className={emphasized('percent')?'nms-l02-p017__emphasis':undefined}>percents</span></span>}</p>}
   {(t.definition||crossfadeWord)&&<p data-lesson-text-block="definition">{crossfadeWord&&term('Fraction',t.openingUpper,'Fractions')}{definitionWords.map((word,index)=>{
    if(!word.visibleText)return null;const key=word.depths[0],space=(crossfadeWord||index>0)?' ':'';
    const visibleTerm=word.term&&word.termComplete?word.visibleText.replace(/,$/u,''):word.visibleText;
    return <React.Fragment key={key}>{space}{word.term&&word.termComplete?term(word.term,visibleTerm,visibleTerm):word.visibleText}{word.term&&word.termComplete&&word.visibleText.endsWith(',')?',':''}</React.Fragment>;
   })}</p>}
  </div>}
  {t.comparisonAlpha>0&&<div className="nms-l02-p017__comparison">
   <div className="nms-l02-p017__panel">
    {t.wholeHeading&&<h3 data-lesson-text-block="whole-heading" style={{opacity:t.wholeHeadingAlpha}}>{t.wholeHeading}</h3>}
    {t.wholeAlpha>0&&<svg className="nms-l02-p017__diagram" viewBox="0 0 240 180" role="img" aria-label="A circle divided into three equal parts; one part is shaded red" data-equal-parts="3" data-shaded-parts="1" style={{opacity:t.wholeAlpha}}><circle cx="120" cy="90" r="75" fill="#fffdf7"/><path d="M120 90 L120 15 A75 75 0 0 1 184.951905 127.5 Z" fill="#df282f"/><circle cx="120" cy="90" r="75" fill="none" stroke="#263c50" strokeWidth="2"/>{[0,120,240].map(angle=><line key={angle} x1="120" y1="90" x2="120" y2="15" transform={`rotate(${angle} 120 90)`} stroke="#263c50" strokeWidth="2"/>)}</svg>}
    {t.wholeNumerator&&t.wholeDenominator&&<p className="nms-l02-p017__caption" data-lesson-text-block="whole-caption" style={{opacity:t.wholeCaptionAlpha}}>{fractionFigure(t.wholeNumerator,t.wholeDenominator)} {t.wholeText}</p>}
   </div>
   <div className="nms-l02-p017__panel">
    {t.groupHeading&&<h3 data-lesson-text-block="group-heading" style={{opacity:t.groupHeadingAlpha}}>{t.groupHeading}</h3>}
    {t.groupAlpha>0&&<svg className="nms-l02-p017__diagram" viewBox="0 0 240 180" role="img" aria-label="Six circles in a group; five are green and one is red" data-group-total="6" data-group-green="5" style={{opacity:t.groupAlpha}}>{Array.from({length:6},(_,i)=><circle key={i} cx={40+i%3*80} cy={50+Math.floor(i/3)*80} r="28" fill={i===1?'#df282f':'#00a33c'} stroke="#263c50" strokeWidth="2"/>)}</svg>}
    {t.groupNumerator&&t.groupDenominator&&<p className="nms-l02-p017__caption" data-lesson-text-block="group-caption" style={{opacity:t.groupCaptionAlpha}}>{fractionFigure(t.groupNumerator,t.groupDenominator)} {t.groupText}</p>}
   </div>
  </div>}
  {blocked&&<p role="alert" lang={uiLanguage}>{uiLanguage==='es'?'El término no está disponible.':'The term is unavailable.'}</p>}
 </section>;
}
