'use client';
import {useRef,useState,useEffect,createElement} from 'react';
import type {AnimationRendererProps} from './contract';
import {p030TextSnapshot}from'./nms-l02-p030-text-v1';
import {LessonAnimationTitleV1} from './lesson-animation-title-v1';
import {p030PresentationTeaching,p030CanOpenTerm,type P030FrameState} from './nms-l02-p030-timeline-v1';
import './nms-l02-p030-v1.css';

const columns=['Hundreds','Tens','Ones','Decimal Point','Tenths','Hundredths','Thousandths'] as const;
export interface P030PresentationProps {
  readonly state:P030FrameState;
  readonly uiLanguage?:'en'|'es';
  readonly reducedMotion?:boolean;
  readonly onLessonHostRequest?:AnimationRendererProps['onLessonHostRequest'];
  readonly onSourceStop?:()=>void;
}
export function NmsL2P030Presentation({state,uiLanguage=state.language,reducedMotion=false,onLessonHostRequest,onSourceStop}:P030PresentationProps){
  const t=p030PresentationTeaching(state,reducedMotion),latest=useRef(state);latest.current=state;
  const [blocked,setBlocked]=useState(false);
  useEffect(()=>setBlocked(false),[state.replay]);
  const snapshot=p030TextSnapshot(state);
  if(snapshot.status!=='ready')return <p role="alert">{uiLanguage==='es'?'La página no está disponible.':'The page is unavailable.'}</p>;
  const term=(id:string,label:string)=>onLessonHostRequest?<button type="button" className="nms-l02-p030__term" data-p030-term={id} disabled={!p030CanOpenTerm(state,id)} onClick={event=>{
    if(!p030CanOpenTerm(latest.current,id)){setBlocked(true);return;}
    const decision=onLessonHostRequest({type:'open-keyterm',entryId:id,sourceAnimationId:state.animationId,playbackDisposition:'source-stop-timeline-and-audio-until-explicit-resume'},{trigger:event.currentTarget});
    setBlocked(decision?.status!=='allowed');if(decision?.status==='allowed')onSourceStop?.();
  }}>{label}</button>:<span className="nms-l02-p030__source-term">{label}</span>;
  const opacity=(alpha:number)=>reducedMotion&&alpha>0?1:alpha;
  return <section className="nms-l02-p030 lesson-text-presentation" lang="en" data-p030-frame={state.frame} data-p030-domain={state.frameDomain} data-p030-main-frame={state.mainFrame??''} data-p030-text-status={snapshot.status}>
    {state.mainFrame!==null&&<LessonAnimationTitleV1 courseTitle="Fractions, Decimals, and Percents Concepts:" activityTitle="Instruction" language="en"/>}
    {uiLanguage==='es'&&<p className="nms-l02-p030__fallback" lang="es">Esta página conserva el título y el texto originales en inglés. Las definiciones de los términos están disponibles en español.</p>}
    {t.tableAlpha>0&&<div className="nms-l02-p030__figures">
      <figure className="nms-l02-p030__model">
        <svg viewBox="0 0 208 208" role="img" aria-label={uiLanguage==='es'?`${t.shadedTenths} de 10 partes iguales sombreadas`:`${t.shadedTenths} of 10 equal parts shaded`} data-p030-model={`${t.shadedTenths}/10`}>
          <g opacity={opacity(t.modelAlpha)}>{Array.from({length:10},(_,i)=><rect key={i} x={4+i*20} y={4} width={20} height={200} fill={i<t.shadedTenths?'#e50062':'#fff'} stroke="#52616d" strokeWidth=".65" data-strip={i} data-shaded={String(i<t.shadedTenths)}/>)}</g>
          {t.outlineAlpha>0&&<g opacity={opacity(t.outlineAlpha)} fill="none"><rect x={4} y={4} width={200} height={200} stroke="#153dcc" strokeWidth={3}/>{t.highlightStrip!==null&&<rect x={4+t.highlightStrip*20} y={4} width={20} height={200} stroke="#cf1515" strokeWidth={3} data-highlight-strip={t.highlightStrip}/>}</g>}
        </svg>
        <figcaption className={'nms-l02-p030__expression'+(t.numberBlink?' is-emphasized':'')} aria-hidden={t.decimalAlpha===0} data-lesson-text-block="equivalence">
          <span style={{opacity:opacity(t.decimalAlpha)}}>0.{t.example??''}</span>
          <span className="nms-l02-p030__fraction-group" style={{opacity:opacity(t.fractionAlpha)}} aria-hidden={t.fractionAlpha===0}>or {createElement('math',{'aria-label':`${t.example??1} tenths`},createElement('mfrac',null,createElement('mn',null,t.example??1),createElement('mn',null,'10')))}</span>
        </figcaption>
      </figure>
      <div className="nms-l02-p030__chart" style={{opacity:opacity(t.tableAlpha)}}>
        <div className="nms-l02-p030__table-scroll" role="region" aria-label={uiLanguage==='es'?'Tabla de valor posicional':'Place value table'} tabIndex={0}>
          <table className="nms-l02-p030__table" aria-label="Place value table">
            <thead><tr><th colSpan={3} className="ones-group" scope="colgroup" data-lesson-text-block="ones-group">{term('ones-group','Ones')}</th><th aria-label="Decimal point separator"/><th colSpan={3} className="decimals-group" scope="colgroup" data-lesson-text-block="decimals-group">{term('decimal','Decimals')}</th></tr>
              <tr data-lesson-text-block="column-labels">{columns.map((label,i)=><th key={label} scope="col" className={i<3?'ones-group':i>3?'decimals-group':''}>{label}</th>)}</tr>
            </thead><tbody><tr data-lesson-text-block="number">{columns.map((label,i)=><td key={label} className={(i<3?'ones-group':i>3?'decimals-group':'')+(t.numberBlink&&(i===2||i===4)?' is-emphasized':'')} data-p030-value={label}>{i===3?'.':i===2||i===4?<span style={{opacity:opacity(t.tableNumberAlpha)}} aria-hidden={t.tableNumberAlpha===0}>{i===2?'0':t.example}</span>:''}</td>)}</tr></tbody>
          </table>
        </div>
      </div>
    </div>}
    {blocked&&<p role="alert" lang={uiLanguage}>{uiLanguage==='es'?'El término no está disponible.':'The term is unavailable.'}</p>}
  </section>;
}
