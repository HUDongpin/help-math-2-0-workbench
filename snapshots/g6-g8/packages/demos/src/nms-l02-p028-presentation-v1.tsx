'use client';
import React,{useRef,useState,useEffect} from 'react';
import type {AnimationRendererProps} from './contract';
import {p028CanOpenTerm,type P028FrameState,type P028VisibleRun} from './nms-l02-p028-timeline-v1';
import {p028TextSnapshot} from './nms-l02-p028-text-v1';
import './nms-l02-p028-v1.css';

export interface P028PresentationProps {
  readonly state:P028FrameState;
  readonly uiLanguage?:'en'|'es';
  readonly termEntries?:Readonly<Record<string,string>>;
  readonly onLessonHostRequest?:AnimationRendererProps['onLessonHostRequest'];
  readonly onSourceStop?:()=>void;
  readonly reducedMotion?:boolean;
}
/** Preserve the source reveal fraction on the final visible native glyph.
 * The source's outlined font is retained separately; native glyph metrics are
 * a disclosed typography adaptation, not a pixel-fidelity baseline. */
function RevealedRun({run}:{run:P028VisibleRun}) {
  const parts:React.ReactNode[]=[];
  let full='';
  for(let i=0;i<run.text.length;i++) {
    const amount=run.fractions[i];
    if(amount===1){full+=run.text[i];continue;}
    if(full){parts.push(full);full='';}
    if(amount>0)parts.push(<span key={i} aria-hidden="true" className="nms-l02-p028__partial" style={{clipPath:`inset(0 ${(1-amount)*100}% 0 0)`}}>{run.text[i]}</span>);
  }
  if(full)parts.push(full);
  return <>{parts}</>;
}
function Grid({hundredths,language}:{hundredths:boolean;language:'en'|'es'}) {
  const rows=hundredths?10:1;
  const label=language==='es'?(hundredths?'10 de 100 partes iguales sombreadas':'1 de 10 partes iguales sombreadas'):(hundredths?'10 of 100 equal parts shaded':'1 of 10 equal parts shaded');
  return <svg viewBox="0 0 202 202" role="img" aria-label={label} className="nms-l02-p028__grid" data-p028-grid={hundredths?'100':'10'}>
    {Array.from({length:rows},(_,r)=>Array.from({length:10},(_,c)=><rect key={r+'-'+c} x={1+c*20} y={1+r*200/rows} width="20" height={200/rows} fill={c===0?'#0099ff':'#fff'} stroke="#41566b" strokeWidth=".75" data-shaded={c===0?'true':'false'}/>))}
  </svg>;
}
export function NmsL2P028Presentation({state,uiLanguage=state.language,termEntries,onLessonHostRequest,onSourceStop,reducedMotion=false}:P028PresentationProps) {
  const latest=useRef(state);latest.current=state;
  const [blocked,setBlocked]=useState(false);useEffect(()=>setBlocked(false),[state.replay]);
  const snapshot=p028TextSnapshot(state);
  if(snapshot.status!=='ready')return <p role="alert">{uiLanguage==='es'?'La página no está disponible.':'The page is unavailable.'}</p>;
  const line=(index:number)=>{
    const row=state.lines[index];
    return <span data-lesson-text-block={'line-'+row.characterId}>{row.runs.map(run=>{
      const entryId=run.termId?termEntries?.[run.termId]:undefined;
      if(!run.fractions.some(v=>v>0))return null;
      if(!entryId||!run.fullyVisible||!onLessonHostRequest)return <span key={run.sourceTextId} data-source-text-id={run.sourceTextId} className={run.termId?'nms-l02-p028__source-term':undefined}><RevealedRun run={run}/></span>;
      return <button type="button" key={run.sourceTextId} className="nms-l02-p028__term" data-source-text-id={run.sourceTextId} data-p028-term={entryId} onClick={event=>{
        if(!p028CanOpenTerm(latest.current,entryId)){setBlocked(true);return;}
        const decision=onLessonHostRequest({type:'open-keyterm',entryId,sourceAnimationId:state.animationId,playbackDisposition:'source-stop-timeline-and-audio-until-explicit-resume'},{trigger:event.currentTarget});
        setBlocked(decision?.status!=='allowed');if(decision?.status==='allowed')onSourceStop?.();
      }}>{run.text}</button>;
    })}</span>;
  };
  return <section className="nms-l02-p028 lesson-text-presentation" lang="en" data-p028-frame={state.frame} data-p028-domain={state.frameDomain} data-p028-main-frame={state.mainFrame??''} data-p028-text-status={snapshot.status} data-content-language="en">
    {uiLanguage==='es'&&<p className="nms-l02-p028__fallback" lang="es">Esta página conserva el texto original en inglés. Las definiciones de los términos están disponibles en español.</p>}
    {state.mainFrame!==null&&<header><p data-lesson-text-block="course-title">Fractions, Decimals, and Percents Concepts:</p><h2 data-lesson-text-block="activity-title">Instruction</h2></header>}
    <p className="nms-l02-p028__definition">{line(0)}{' '}{line(1)}</p>
    {state.gridAlpha>0&&<div className="nms-l02-p028__examples" style={{opacity:reducedMotion?1:state.gridAlpha}} data-p028-grid-alpha={state.gridAlpha}>
      {[false,true].map(hundredths=><figure key={String(hundredths)}><Grid hundredths={hundredths} language={uiLanguage}/><figcaption data-lesson-text-block={hundredths?'hundredths':'tenths'}>{hundredths?'100 equal parts':'10 equal parts'}</figcaption></figure>)}
    </div>}
    <p className="nms-l02-p028__definition">{line(2)}{line(3)}</p>
    {blocked&&<p role="alert" lang={uiLanguage}>{uiLanguage==='es'?'El término no está disponible.':'The term is unavailable.'}</p>}
  </section>;
}
