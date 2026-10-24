'use client';
import React,{useEffect,useRef,useState}from'react';
import type{AnimationRendererProps}from'./contract';
import type{P008FrameState}from'./nms-l02-p008-timeline-v1';
import type{P008VisibleRun}from'./nms-l02-p008-source-contract-v1';
import{NmsL2P008Artwork}from'./nms-l02-p008-artwork-v1';
import{p008TeachingState,p008TextSnapshot,P008_TERM_RUNS}from'./nms-l02-p008-text-v1';
const h=React.createElement;
function decimal(value:string){return h('math',{xmlns:'http://www.w3.org/1998/Math/MathML',display:'inline'},h('mn',null,value));}
export type P008TermEntries=Readonly<Record<'Decimal'|'Decimal point'|'Place value'|'Fraction'|'Power'|'Whole',string>>;
export interface P008PresentationProps{readonly state:P008FrameState;readonly uiLanguage?:'en'|'es';readonly termEntries?:P008TermEntries;readonly onLessonHostRequest?:AnimationRendererProps['onLessonHostRequest'];readonly onSourceStop?:()=>void;readonly reducedMotion?:boolean;}
export function NmsL2P008Presentation({state,uiLanguage=state.language,termEntries,onLessonHostRequest,onSourceStop,reducedMotion=false}:P008PresentationProps){
 const teaching=p008TeachingState(state),snapshot=p008TextSnapshot(state),latest=useRef(state);latest.current=state;
 const[blocked,setBlocked]=useState(false);useEffect(()=>setBlocked(false),[state.replay]);
 if(snapshot.status!=='ready')return <p role="alert">{uiLanguage==='es'?'La página no está disponible.':'The page is unavailable.'}</p>;
 const text=(runs:readonly P008VisibleRun[])=>runs.map(run=>{
 if(!run.visiblePrefix)return null;const term=P008_TERM_RUNS[run.sourceTextId as keyof typeof P008_TERM_RUNS],entryId=term?termEntries?.[term]:undefined;
 if(!term||!entryId||!onLessonHostRequest||run.visiblePrefix!==run.text)return <React.Fragment key={run.sourceTextId}>{run.visiblePrefix}</React.Fragment>;
 // Preserve source whitespace outside the button to keep the focus ring on its label.
 const leading=run.visiblePrefix.match(/^\s*/u)?.[0]??'',trailing=run.visiblePrefix.match(/\s*$/u)?.[0]??'';
 return <React.Fragment key={run.sourceTextId}>{leading}<button type="button" className="nms-l02-p008__term" data-source-text-id={run.sourceTextId} data-source-key-attribute={term} onClick={event=>{
 const current=p008TeachingState(latest.current).allRuns.find(r=>r.sourceTextId===run.sourceTextId);if(!current||current.visiblePrefix!==current.text){setBlocked(true);return;}
 const decision=onLessonHostRequest({type:'open-keyterm',entryId,sourceAnimationId:state.animationId,playbackDisposition:'source-stop-timeline-and-audio-until-explicit-resume'},{trigger:event.currentTarget});setBlocked(decision?.status!=='allowed');if(decision?.status==='allowed')onSourceStop?.();
 }}>{run.visiblePrefix.trim()}</button>{trailing}</React.Fragment>;
 });
 return <section className="nms-l02-p008 lesson-text-presentation" lang="en" data-p008-frame={state.frame} data-p008-domain={state.frameDomain} data-p008-text-status={snapshot.status} data-content-language="en" data-reduced-motion={reducedMotion}>
 {uiLanguage==='es'&&<p className="nms-l02-p008__fallback" lang="es">Texto original en inglés.</p>}
 {teaching.headingVisible&&<header className="nms-l02-p008__header"><p data-lesson-text-block="course-title">Fractions, Decimals, and Percents Concepts:</p><h2 data-lesson-text-block="activity-title">Vocabulary</h2></header>}
 {(teaching.definition||teaching.explanation)&&<div className="nms-l02-p008__definition"><p data-lesson-text-block="definition">{text(teaching.definitionRuns)}</p>{teaching.explanation&&<p data-lesson-text-block="explanation">{text(teaching.explanationRuns)}</p>}</div>}
 <div className="nms-l02-p008__examples">
 {teaching.tenthsVisible&&<figure className="nms-l02-p008__example" aria-label={`A square divided into ten equal parts, with ${teaching.tenthsShaded} shaded yellow.`}><NmsL2P008Artwork state={state} side="tenths"/><figcaption><span data-lesson-text-block="tenths-label" style={{opacity:teaching.tenthsLabelAlpha}}>{teaching.tenthsLabel}</span><span data-lesson-text-block="tenths-value" style={{opacity:teaching.tenthsValueAlpha}}>{teaching.tenthsValue&&decimal(teaching.tenthsValue)}</span></figcaption></figure>}
 {teaching.hundredthsVisible&&<figure className="nms-l02-p008__example" aria-label={`A square divided into one hundred equal parts, with ${teaching.hundredthsShaded} shaded green.`}><NmsL2P008Artwork state={state} side="hundredths"/><figcaption><span data-lesson-text-block="hundredths-label" style={{opacity:teaching.hundredthsLabelAlpha}}>{teaching.hundredthsLabel}</span><span data-lesson-text-block="hundredths-value" style={{opacity:teaching.hundredthsValueAlpha}}>{teaching.hundredthsValue&&decimal(teaching.hundredthsValue)}</span></figcaption></figure>}
 </div>
 {blocked&&<p role="alert" lang={uiLanguage}>{uiLanguage==='es'?'El término no está disponible.':'The term is unavailable.'}</p>}
 </section>;
}
