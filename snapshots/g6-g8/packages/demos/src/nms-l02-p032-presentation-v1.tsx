'use client';
import{useRef,useState,useEffect,createElement}from'react';
import type{AnimationRendererProps}from'./contract';
import{LessonAnimationTitleV1}from'./lesson-animation-title-v1';
import{p032TextSnapshot}from'./nms-l02-p032-text-v1';
import{p032PresentationTeaching,p032CanOpenTerm,type P032FrameState}from'./nms-l02-p032-timeline-v1';
import'./nms-l02-p032-v1.css';
const columns=['Hundreds','Tens','Ones','Decimal Point','Tenths','Hundredths','Thousandths']as const;
export interface P032PresentationProps{
 readonly state:P032FrameState;readonly uiLanguage?:'en'|'es';readonly reducedMotion?:boolean;
 readonly onLessonHostRequest?:AnimationRendererProps['onLessonHostRequest'];readonly onSourceStop?:()=>void;
}
export function NmsL2P032Presentation({state,uiLanguage=state.language,reducedMotion=false,onLessonHostRequest,onSourceStop}:P032PresentationProps){
 const t=p032PresentationTeaching(state,reducedMotion),latest=useRef(state);latest.current=state;
 const[blocked,setBlocked]=useState(false);useEffect(()=>setBlocked(false),[state.replay]);
 const snapshot=p032TextSnapshot(state);
 if(snapshot.status!=='ready')return <p role="alert">{uiLanguage==='es'?'La página no está disponible.':'The page is unavailable.'}</p>;
 const term=(id:string,label:string)=>onLessonHostRequest?<button type="button" className="nms-l02-p032__term" data-p032-term={id} disabled={!p032CanOpenTerm(state,id)} onClick={event=>{
  if(!p032CanOpenTerm(latest.current,id)){setBlocked(true);return;}
  const decision=onLessonHostRequest({type:'open-keyterm',entryId:id,sourceAnimationId:state.animationId,playbackDisposition:'source-stop-timeline-and-audio-until-explicit-resume'},{trigger:event.currentTarget});
  setBlocked(decision?.status!=='allowed');if(decision?.status==='allowed')onSourceStop?.();
 }}>{label}</button>:<span className="nms-l02-p032__source-term">{label}</span>;
 const opacity=(alpha:number)=>reducedMotion&&alpha>0?1:alpha;
 const example=(secondary:boolean)=>{
  if(!t)return null;
  const shaded=secondary?t.secondaryShaded!:t.primaryShaded,numerator=secondary?55:t.primaryNumerator;
  const decimalAlpha=secondary?1:t.primaryDecimalAlpha,fractionAlpha=secondary?1:t.primaryFractionAlpha,tableAlpha=secondary?1:t.primaryTableNumberAlpha;
  const emphasis=secondary?t.secondaryBlink:t.primaryBlink,building=secondary&&shaded!==55,key=secondary?'secondary':'primary';
  return <div className="nms-l02-p032__example" data-p032-example={key} key={key}>
   {building&&<p className="nms-l02-p032__target" data-lesson-text-block="target-qualification">Target: 55 hundredths. The grid is filling toward this value.</p>}
   <div className="nms-l02-p032__figures">
    <figure className="nms-l02-p032__model">
     <svg viewBox="0 0 208 208" role="img" aria-label={uiLanguage==='es'?`${shaded} de 100 partes iguales sombreadas`:`${shaded} of 100 equal parts shaded`} data-p032-model={`${shaded}/100`}>
      {Array.from({length:100},(_,i)=><rect key={i} x={4+Math.floor(i/10)*20} y={4+(i%10)*20} width={20} height={20} fill={i<shaded?'#e500a4':'#fff'} stroke={!secondary&&t.cellOutlines?'#153dcc':'#52616d'} strokeWidth={!secondary&&t.cellOutlines?2:.65} data-cell={i} data-shaded={String(i<shaded)}/>)}
      {!secondary&&t.wholeOutline&&<rect x={4} y={4} width={200} height={200} fill="none" stroke="#cf1515" strokeWidth={3} data-whole-outline="true"/>}
     </svg>
     <figcaption className={'nms-l02-p032__expression'+(emphasis?' is-emphasized':'')} aria-hidden={decimalAlpha===0} data-lesson-text-block={key+'-equivalence'}>
      <span style={{opacity:opacity(decimalAlpha)}}>{secondary?'0.55':numerator===null?'':'0.0'+numerator}</span>
      <span className="nms-l02-p032__fraction-group" style={{opacity:opacity(fractionAlpha)}} aria-hidden={fractionAlpha===0}>or {createElement('math',{'aria-label':`${numerator??1} hundredths`},createElement('mfrac',null,createElement('mn',null,numerator??1),createElement('mn',null,'100')))}</span>
     </figcaption>
    </figure>
    <div className="nms-l02-p032__chart">
     <h2 className="nms-l02-p032__chart-title" data-lesson-text-block="chart-title">{term('place-value-chart','Place Value Chart')}</h2>
     <div className="nms-l02-p032__table-scroll" role="region" aria-label={uiLanguage==='es'?'Tabla de valor posicional':'Place value table'} tabIndex={0}>
      <table className="nms-l02-p032__table" aria-label={building?'Target place value table':'Place value table'}>
       <thead><tr><th colSpan={3} className="ones-group" scope="colgroup" data-lesson-text-block="ones-group">{term('ones-group','Ones')}</th><th aria-label="Decimal point separator"/><th colSpan={3} className="decimals-group" scope="colgroup" data-lesson-text-block="decimals-group">{term('decimal','Decimals')}</th></tr>
        <tr data-lesson-text-block="column-labels">{columns.map((label,i)=><th key={label} scope="col" className={i<3?'ones-group':i>3?'decimals-group':''}>{label}</th>)}</tr>
       </thead><tbody><tr data-lesson-text-block={key+'-number'}>{columns.map((label,i)=><td key={label} className={(i<3?'ones-group':i>3?'decimals-group':'')+(emphasis&&[2,4,5].includes(i)?' is-emphasized':'')} data-p032-value={label}>{i===3?'.':[2,4,5].includes(i)?<span style={{opacity:opacity(tableAlpha)}} aria-hidden={tableAlpha===0}>{i===2?'0':i===4?(secondary?'5':'0'):numerator===null?'':secondary?'5':numerator}</span>:''}</td>)}</tr></tbody>
      </table>
     </div>
    </div>
   </div>
  </div>;
 };
 return <section className="nms-l02-p032 lesson-text-presentation" lang="en" data-p032-frame={state.frame} data-p032-domain={state.frameDomain} data-p032-main-frame={state.mainFrame??''} data-p032-text-status={snapshot.status}>
  {t&&<LessonAnimationTitleV1 courseTitle="Fractions, Decimals, and Percents Concepts:" activityTitle="Instruction" language="en"/>}
  {uiLanguage==='es'&&<p className="nms-l02-p032__fallback" lang="es">Esta página conserva el título y el texto originales en inglés. Las definiciones de los términos están disponibles en español.</p>}
  {example(false)}{t?.comparison&&example(true)}
  {blocked&&<p role="alert" lang={uiLanguage}>{uiLanguage==='es'?'El término no está disponible.':'The term is unavailable.'}</p>}
 </section>;
}
