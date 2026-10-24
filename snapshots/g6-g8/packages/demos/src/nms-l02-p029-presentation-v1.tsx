'use client';
import {useRef,useState,useEffect} from 'react';
import type {AnimationRendererProps} from './contract';
import {LessonAnimationTitleV1} from './lesson-animation-title-v1';
import {p029TextSnapshot} from './nms-l02-p029-text-v1';
import {p029PresentationTeaching,p029CanOpenTerm,P029_SHADED_CELLS,type P029FrameState} from './nms-l02-p029-timeline-v1';
import './nms-l02-p029-v1.css';

const columns=[{label:'Hundreds',value:'',target:'hundreds'},{label:'Tens',value:'',target:'tens'},{label:'Ones',value:'0',target:'ones'},{label:'Decimal Point',value:'.',target:'decimal-point'},{label:'Tenths',value:'1',target:'tenths'},{label:'Hundredths',value:'5',target:'hundredths'},{label:'Thousandths',value:'',target:'thousandths'}] as const;
export interface P029PresentationProps {
  readonly state:P029FrameState;
  readonly uiLanguage?:'en'|'es';
  readonly reducedMotion?:boolean;
  readonly onLessonHostRequest?:AnimationRendererProps['onLessonHostRequest'];
  readonly onSourceStop?:()=>void;
}
export function NmsL2P029Presentation({state,uiLanguage=state.language,reducedMotion=false,onLessonHostRequest,onSourceStop}:P029PresentationProps){
  const t=p029PresentationTeaching(state,reducedMotion),latest=useRef(state);latest.current=state;
  const [blocked,setBlocked]=useState(false);
  useEffect(()=>setBlocked(false),[state.replay]);
  const snapshot=p029TextSnapshot(state);
  if(snapshot.status!=='ready')return <p role="alert">{uiLanguage==='es'?'La página no está disponible.':'The page is unavailable.'}</p>;
  const term=(id:string,label:string)=>onLessonHostRequest?<button type="button" className="nms-l02-p029__term" data-p029-term={id} disabled={!p029CanOpenTerm(state,id)} onClick={event=>{
    if(!p029CanOpenTerm(latest.current,id)){setBlocked(true);return;}
    const decision=onLessonHostRequest({type:'open-keyterm',entryId:id,sourceAnimationId:state.animationId,playbackDisposition:'source-stop-timeline-and-audio-until-explicit-resume'},{trigger:event.currentTarget});
    setBlocked(decision?.status!=='allowed');if(decision?.status==='allowed')onSourceStop?.();
  }}>{label}</button>:<span className="nms-l02-p029__source-term">{label}</span>;
  const emphasis=(target:string)=>t.emphasisTargets.some(x=>x===target)?' is-emphasized':'';
  return <section className="nms-l02-p029 lesson-text-presentation" lang="en" data-p029-frame={state.frame} data-p029-domain={state.frameDomain} data-p029-main-frame={state.mainFrame??''} data-p029-text-status={snapshot.status}>
    {state.mainFrame!==null&&<LessonAnimationTitleV1 courseTitle="Fractions, Decimals, and Percents Concepts:" activityTitle="Instruction" language="en"/>}
    {uiLanguage==='es'&&<p className="nms-l02-p029__fallback" lang="es">Esta página conserva el título y el texto originales en inglés. Las definiciones de los términos están disponibles en español.</p>}
    {t.tableAlpha>0&&<div className="nms-l02-p029__figures" style={{opacity:reducedMotion?1:t.tableAlpha}}>
      <figure className="nms-l02-p029__model">
        <svg viewBox="0 0 202 202" role="img" aria-label={uiLanguage==='es'?'15 de 100 partes iguales sombreadas':'15 of 100 equal parts shaded'} data-p029-model="15/100">
          {Array.from({length:10},(_,r)=>Array.from({length:10},(_,c)=>{
            const shaded=P029_SHADED_CELLS.some(p=>p[0]===r&&p[1]===c),highlight=t.highlightCell?.[0]===r&&t.highlightCell?.[1]===c;
            return <rect key={r+'-'+c} x={1+20*c} y={1+20*r} width="20" height="20" fill={highlight?'#ffff00':shaded?'#e31b23':'#fff'} stroke="#52616d" strokeWidth=".65" data-shaded={String(shaded)} data-highlight={String(highlight)} data-cell={r+'-'+c}/>;
          }))}
        </svg>
      </figure>
      <div className="nms-l02-p029__chart">
        <div className={'nms-l02-p029__place-value'+(t.placeValueBlink?' is-emphasized':'')} data-lesson-text-block="place-value" style={{opacity:reducedMotion?(t.placeValueAlpha>0?1:0):t.placeValueAlpha}} aria-hidden={t.placeValueAlpha===0}>{term('place-value','Place Value')}</div>
        <div className="nms-l02-p029__table-scroll" role="region" aria-label={uiLanguage==='es'?'Tabla de valor posicional':'Place value table'} tabIndex={0}>
          <table className="nms-l02-p029__table" aria-label="Place value of 0.15">
            <thead><tr><th colSpan={3} className="ones-group" scope="colgroup" data-lesson-text-block="ones-group">{term('ones-group','Ones')}</th><th aria-label="Decimal point separator"/><th colSpan={3} className="decimals-group" scope="colgroup" data-lesson-text-block="decimals-group">{term('decimal','Decimals')}</th></tr>
              <tr data-lesson-text-block="column-labels">{columns.map((col,i)=><th key={col.target} scope="col" className={(i<3?'ones-group':i>3?'decimals-group':'')+emphasis(col.target+'-label')} data-p029-label={col.target}>{col.label}</th>)}</tr>
            </thead>
            <tbody><tr data-lesson-text-block="number">{columns.map((col,i)=><td key={col.target} className={(i<3?'ones-group':i>3?'decimals-group':'')+emphasis(col.target+'-value')} data-p029-value={col.target}>{col.value}</td>)}</tr></tbody>
          </table>
        </div>
      </div>
    </div>}
    {blocked&&<p role="alert" lang={uiLanguage}>{uiLanguage==='es'?'El término no está disponible.':'The term is unavailable.'}</p>}
  </section>;
}
