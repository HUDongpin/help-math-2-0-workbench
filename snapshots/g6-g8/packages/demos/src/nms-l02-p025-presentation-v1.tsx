'use client';
import React from 'react';
import type {AnimationRendererProps} from './contract';
import {p025TextSnapshot} from './nms-l02-p025-text-v1';
import type {P025FrameState} from './nms-l02-p025-timeline-v1';
import {p025TeachingState,type P025TermKey} from './nms-l02-p025-teaching-v1';
import './nms-l02-p025-v1.css';
const denominators=[2,6,8,10,12] as const;
function fraction(n:number,d:number){return React.createElement('math',{xmlns:'http://www.w3.org/1998/Math/MathML',display:'inline',displaystyle:'true','aria-label':`${n}/${d}`},React.createElement('mfrac',null,React.createElement('mn',null,String(n)),React.createElement('mn',null,String(d))));}
/** Logical source displacement is reflowed onto five desktop columns or a narrow
 * two-column comparison. Source depth, equal whole sizes and all partitions stay
 * unchanged. This layout is a documented native adaptation, not a pixel baseline. */
export interface P025PresentationProps {readonly state:P025FrameState;readonly uiLanguage?:'en'|'es';readonly reducedMotion?:boolean;readonly termEntries?:Readonly<Record<P025TermKey,string>>;readonly onLessonHostRequest?:AnimationRendererProps['onLessonHostRequest'];readonly onSourceStop?:()=>void;readonly onTerm?:(key:P025TermKey,trigger:HTMLButtonElement)=>void;}
export function NmsL2P025Presentation({state,uiLanguage=state.language,reducedMotion=false,onTerm,termEntries,onLessonHostRequest,onSourceStop}:P025PresentationProps){
 const t=p025TeachingState(state),keys:Readonly<Record<number,P025TermKey>>={0:'Equivalent fraction',2:'Fraction',4:'Quantity'};
 const position=(index:number,progress:number):React.CSSProperties=>({'--col':index,'--small-col':index%2,'--small-row':Math.floor(index/2),'--progress':progress}as React.CSSProperties);
 const fractionVisible=t.fractions.length>0,snapshot=p025TextSnapshot(state);
 if(snapshot.status!=='ready')return <p role="alert">{uiLanguage==='es'?'La página no está disponible.':'The page is unavailable.'}</p>;
 const openTerm=(key:P025TermKey,trigger:HTMLButtonElement)=>{if(!t.termAvailable[key])return;if(onLessonHostRequest&&termEntries){const decision=onLessonHostRequest({type:'open-keyterm',entryId:termEntries[key],sourceAnimationId:state.animationId,playbackDisposition:'source-stop-timeline-and-audio-until-explicit-resume'},{trigger});if(decision?.status==='allowed')onSourceStop?.();}else onTerm?.(key,trigger);};
 return <section className="nms-l02-p025 lesson-text-presentation" data-p025-text-status={snapshot.status} data-p025-frame={state.frame} data-p025-domain={state.frameDomain} data-p025-main-frame={state.mainFrame??''} data-reduced-motion={reducedMotion}>
  {t.headingVisible&&<header className="nms-l02-p025__header" lang="en"><p data-lesson-text-block="course-title">Fractions, Decimals, and Percents Concepts:</p><h2 data-lesson-text-block="activity-title">Instruction</h2></header>}
  {uiLanguage==='es'&&<p className="nms-l02-p025__fallback" lang="es">Esta página conserva el texto y el audio originales en inglés. Las definiciones de los términos están disponibles en español.</p>}
  <p className="nms-l02-p025__definition" data-lesson-text-block="definition" lang="en">{t.definition.map((r,i)=>{const key=keys[i];return key&&t.termAvailable[key]&&(onTerm||(termEntries&&onLessonHostRequest))?<button className="nms-l02-p025__term" data-source-key-attribute={key} type="button" key={r.sourceTextId} onClick={e=>openTerm(key,e.currentTarget)}>{r.visibleText}</button>:<span className={key?'nms-l02-p025__term-pending':undefined} key={r.sourceTextId}>{r.visibleText}</span>;})}</p>
  <figure className="nms-l02-p025__comparison" data-p025-equality={t.equality} aria-label={uiLanguage==='es'?'Fracciones equivalentes: cada entero tiene una mitad coloreada.':'Equivalent fractions: each whole has one half colored.'} aria-hidden={!t.bars.some(b=>b.alpha>0)}>
   {t.bars.map(b=>{const index=denominators.indexOf(b.denominator as typeof denominators[number]),sourceProgress=index===0?0:b.relativeX/(130*index),progress=reducedMotion?(sourceProgress>=1?1:0):sourceProgress;return <div key={b.characterId} className="nms-l02-p025__bar" data-p025-bar={b.denominator} data-source-relative-x={b.relativeX} data-source-alpha={b.alpha} style={{...position(index,progress),opacity:reducedMotion?(b.alpha>0?1:0):b.alpha,zIndex:b.sourceDepth}}><svg viewBox="0 0 50 240" preserveAspectRatio="none" aria-hidden="true" focusable="false"><rect x="1" y="1" width="48" height="238" fill="white" stroke="#233649" strokeWidth="1.5" vectorEffect="non-scaling-stroke"/><rect x="1" y="1" width="48" height="119" fill="#bee400"/><path d="M1 1H49V239H1Z" fill="none" stroke="#233649" strokeWidth="1.5" vectorEffect="non-scaling-stroke"/>{Array.from({length:b.denominator-1},(_,i)=><line key={i} data-p025-partition={i+1} x1="1" x2="49" y1={1+238*(i+1)/b.denominator} y2={1+238*(i+1)/b.denominator} stroke="#233649" strokeWidth="1.2" vectorEffect="non-scaling-stroke"/>)}</svg></div>;})}
   {fractionVisible&&(t.equality?<div className="nms-l02-p025__equation" data-p025-equation="true" data-lesson-text-block="fractions">{fraction(1,2)}<span>=</span>{fraction(t.fractions[1]!.numerator,t.fractions[1]!.denominator)}</div>:t.fractions.map(f=>{const index=denominators.indexOf(f.denominator as typeof denominators[number]);return <div className="nms-l02-p025__fraction" data-p025-fraction={f.denominator} data-lesson-text-block="fractions" key={f.denominator} style={position(index,index===0?0:1)}>{fraction(f.numerator,f.denominator)}</div>}))}
  </figure>
 </section>;
}
