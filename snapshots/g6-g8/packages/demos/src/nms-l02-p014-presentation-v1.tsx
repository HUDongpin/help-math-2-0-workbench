'use client';
import React,{useEffect,useRef,useState}from'react';
import type{AnimationRendererProps}from'./contract';
import type{P014FrameState}from'./nms-l02-p014-timeline-v1';
import type{P014VisibleRun}from'./nms-l02-p014-source-contract-v1';
import{p014TeachingState,p014TextSnapshot,P014_TERM_RUNS}from'./nms-l02-p014-text-v1';
import{NMS_L02_P014_ART as ART}from'./generated/nms-l02-p014-art-ir-v1';
const h=React.createElement;
function math(value:string,denominator?:string){return h('math',{xmlns:'http://www.w3.org/1998/Math/MathML',display:'inline',displaystyle:'true'},denominator?h('mfrac',null,h('mn',null,value),h('mn',null,denominator)):h(value==='='?'mo':'mn',null,value));}
export type P014TermEntries=Readonly<Record<'Equivalent decimal'|'Decimal',string>>;
export interface P014PresentationProps{readonly state:P014FrameState;readonly uiLanguage?:'en'|'es';readonly termEntries?:P014TermEntries;readonly onLessonHostRequest?:AnimationRendererProps['onLessonHostRequest'];readonly onSourceStop?:()=>void;readonly reducedMotion?:boolean;}
export function NmsL2P014Presentation({state,uiLanguage=state.language,termEntries,onLessonHostRequest,onSourceStop,reducedMotion=false}:P014PresentationProps){
 const teaching=p014TeachingState(state),snapshot=p014TextSnapshot(state),latest=useRef(state);latest.current=state;
 const[blocked,setBlocked]=useState(false);useEffect(()=>setBlocked(false),[state.replay]);
 if(snapshot.status!=='ready')return <p role="alert">{uiLanguage==='es'?'La página no está disponible.':'The page is unavailable.'}</p>;
 const renderRun=(run:P014VisibleRun)=>{
  if(!run.visibleText)return null;const term=P014_TERM_RUNS[run.sourceTextId as keyof typeof P014_TERM_RUNS],entryId=term?termEntries?.[term]:undefined;
  if(!term||!entryId||!onLessonHostRequest||!run.complete)return <span key={run.sourceTextId}>{run.visibleText}</span>;
  const leading=run.visibleText.match(/^\s*/u)?.[0]??'',trailing=run.visibleText.match(/\s*$/u)?.[0]??'';
  return <React.Fragment key={run.sourceTextId}>{leading}<button type="button" className="nms-l02-p014__term" data-source-text-id={run.sourceTextId} data-source-key-attribute={term} onClick={event=>{
   const current=p014TeachingState(latest.current).allRuns.find(r=>r.sourceTextId===run.sourceTextId);if(!current?.complete){setBlocked(true);return;}
   const decision=onLessonHostRequest({type:'open-keyterm',entryId,sourceAnimationId:state.animationId,playbackDisposition:'source-stop-timeline-and-audio-until-explicit-resume'},{trigger:event.currentTarget});setBlocked(decision?.status!=='allowed');if(decision?.status==='allowed')onSourceStop?.();
  }}>{run.visibleText.trim()}</button>{trailing}</React.Fragment>;
 };
 const fraction=(id:number)=>{const v=teaching.values.find(v=>v.id===id);if(!v?.runs.some(r=>r.visibleText))return null;return <span data-lesson-text-block={id===14?'quarter':'hundredths'} data-source-quarter-emphasis={id===14?teaching.quarterEmphasized:undefined} className={id===14&&teaching.quarterEmphasized&&!reducedMotion?'nms-l02-p014__emphasis':undefined} style={{opacity:v.runs[0]?.alpha??0}}>{math(v.runs[0]?.visibleText??'',v.runs[1]?.visibleText)}</span>;};
 const decimal=teaching.decimal?.visibleText.trim()??'';
 // Source text16 contains both the second equality and0.25. Preserve this
 // source block while assigning native operator/number semantics to its parts.
 const decimalParts=/^(=)\s*(0\.25)$/u.exec(decimal);
 return <section className="nms-l02-p014 lesson-text-presentation" lang="en" data-p014-frame={state.frame} data-p014-domain={state.frameDomain} data-p014-text-status={snapshot.status} data-content-language="en" data-reduced-motion={reducedMotion}>
  {uiLanguage==='es'&&<p className="nms-l02-p014__fallback" lang="es">Texto original en inglés.</p>}
  {teaching.headingVisible&&<header className="nms-l02-p014__header"><p data-lesson-text-block="course-title">Fractions, Decimals, and Percents Concepts:</p><h2 data-lesson-text-block="activity-title">Vocabulary</h2></header>}
  {teaching.definition&&<div className="nms-l02-p014__definition"><p data-lesson-text-block="definition">{teaching.definitionRuns.map(renderRun)}</p></div>}
  {teaching.gridAlpha>0&&<div className="nms-l02-p014__figure">
   <svg className="nms-l02-p014__grid" viewBox="-106 -106 212 212" role="img" aria-label="25 of 100 equal squares shaded" data-source-grid="10" style={{opacity:teaching.gridAlpha}}><g dangerouslySetInnerHTML={{__html:ART.art['10']!.body}}/></svg>
   <div className="nms-l02-p014__equation">{fraction(14)}{teaching.equals?.visibleText&&<span data-lesson-text-block="equals" style={{opacity:teaching.equals.alpha}}>{math(teaching.equals.visibleText)}</span>}{fraction(12)}
    {decimalParts&&<span data-lesson-text-block="decimal" style={{opacity:teaching.decimal?.alpha??0}}>{math(decimalParts[1]!)}<span data-source-decimal-emphasis={teaching.decimalEmphasized} className={teaching.decimalEmphasized&&!reducedMotion?'nms-l02-p014__emphasis':undefined}>{math(decimalParts[2]!)}</span></span>}
   </div>
  </div>}
  {blocked&&<p role="alert" lang={uiLanguage}>{uiLanguage==='es'?'El término no está disponible.':'The term is unavailable.'}</p>}
 </section>;
}
