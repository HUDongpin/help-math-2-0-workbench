'use client';
import React,{useEffect,useRef,useState}from'react';
import type{AnimationRendererProps}from'./contract';
import type{P015FrameState}from'./nms-l02-p015-timeline-v1';
import type{P015VisibleRun}from'./nms-l02-p015-source-contract-v1';
import{p015TeachingState,p015TextSnapshot,P015_TERM_RUNS}from'./nms-l02-p015-text-v1';
import{NMS_L02_P015_ART as ART}from'./generated/nms-l02-p015-art-ir-v1';

export type P015TermEntries=Readonly<Record<'Percent'|'Ratio'|'Compare'|'Quantity',string>>;
export interface P015PresentationProps{readonly state:P015FrameState;readonly uiLanguage?:'en'|'es';readonly termEntries?:P015TermEntries;readonly onLessonHostRequest?:AnimationRendererProps['onLessonHostRequest'];readonly onSourceStop?:()=>void;readonly reducedMotion?:boolean;}
export function NmsL2P015Presentation({state,uiLanguage=state.language,termEntries,onLessonHostRequest,onSourceStop,reducedMotion=false}:P015PresentationProps){
 const teaching=p015TeachingState(state),snapshot=p015TextSnapshot(state),latest=useRef(state);latest.current=state;
 const[blocked,setBlocked]=useState(false);useEffect(()=>setBlocked(false),[state.replay]);
 if(snapshot.status!=='ready')return <p role="alert">{uiLanguage==='es'?'La página no está disponible.':'The page is unavailable.'}</p>;
 const renderRun=(run:P015VisibleRun)=>{
  if(!run.visibleText)return null;const term=P015_TERM_RUNS[run.sourceTextId as keyof typeof P015_TERM_RUNS],entryId=term?termEntries?.[term]:undefined;
  if(!term||!entryId||!onLessonHostRequest||!run.complete)return <span key={run.sourceTextId}>{run.visibleText}</span>;
  const leading=run.visibleText.match(/^\s*/u)?.[0]??'',trailing=run.visibleText.match(/\s*$/u)?.[0]??'';
  return <React.Fragment key={run.sourceTextId}>{leading}<button type="button" className="nms-l02-p015__term" data-source-text-id={run.sourceTextId} data-source-key-attribute={term} onClick={event=>{
   const current=p015TeachingState(latest.current).allRuns.find(r=>r.sourceTextId===run.sourceTextId);
   if(!current?.complete){setBlocked(true);return;}
   const decision=onLessonHostRequest({type:'open-keyterm',entryId,sourceAnimationId:state.animationId,playbackDisposition:'source-stop-timeline-and-audio-until-explicit-resume'},{trigger:event.currentTarget});setBlocked(decision?.status!=='allowed');if(decision?.status==='allowed')onSourceStop?.();
  }}>{run.visibleText.trim()}</button>{trailing}</React.Fragment>;
 };
 return <section className="nms-l02-p015 lesson-text-presentation" lang="en" data-p015-frame={state.frame} data-p015-domain={state.frameDomain} data-p015-text-status={snapshot.status} data-content-language="en" data-reduced-motion={reducedMotion}>
  {uiLanguage==='es'&&<p className="nms-l02-p015__fallback" lang="es">Texto original en inglés.</p>}
  {teaching.headingVisible&&<header className="nms-l02-p015__header"><p data-lesson-text-block="course-title">Fractions, Decimals, and Percents Concepts:</p><h2 data-lesson-text-block="activity-title">Vocabulary</h2></header>}
  {teaching.definition&&<div className="nms-l02-p015__definition">{teaching.definitionLines.map((runs,index)=>teaching.lineTexts[index]&&<p key={index} data-lesson-text-block={'definition-line'+(index+1)}>{runs.map(renderRun)}</p>)}</div>}
  {teaching.gridAlpha>0&&teaching.grid&&<div className="nms-l02-p015__figure">
   <svg className="nms-l02-p015__grid" viewBox="104 185 212 212" role="img" aria-label={`${teaching.filledCells} of 100 equal squares shaded`} data-source-grid={teaching.grid.characterId} data-shaded-cells={teaching.filledCells} style={{opacity:teaching.gridAlpha}}><g transform={'matrix('+teaching.grid.matrix.join(' ')+')'} dangerouslySetInnerHTML={{__html:ART.art[String(teaching.grid.characterId)]!.body}}/></svg>
   {(teaching.gridCaption||teaching.shadedCaption||teaching.unshadedCaption)&&<div className="nms-l02-p015__captions">
    {teaching.gridCaption&&<p data-lesson-text-block="grid-caption">{teaching.gridCaption}</p>}
    {teaching.shadedCaption&&<p data-lesson-text-block="shaded-caption">{teaching.shadedCaption}</p>}
    {teaching.unshadedCaption&&<p data-lesson-text-block="unshaded-caption">{teaching.unshadedCaption}</p>}
   </div>}
  </div>}
  {blocked&&<p role="alert" lang={uiLanguage}>{uiLanguage==='es'?'El término no está disponible.':'The term is unavailable.'}</p>}
 </section>;
}
