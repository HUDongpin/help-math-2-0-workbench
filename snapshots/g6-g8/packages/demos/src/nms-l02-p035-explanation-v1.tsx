'use client';
import React from 'react';
import {LessonAnimationTitleV1} from './lesson-animation-title-v1';
import {p035Teaching,p035Readable,p035CellShade,p035Equation,type P035Model,type P035Run} from './nms-l02-p035-teaching-v1';
import type {P035SessionState,P035TermId} from './nms-l02-p035-state-v1';
import './nms-l02-p035-explanation-v1.css';
const el=React.createElement;
function Fraction({value}:{value:readonly number[]}){return el('math',{xmlns:'http://www.w3.org/1998/Math/MathML',display:'inline',displaystyle:'true'},el('mfrac',null,el('mn',null,String(value[0])),el('mn',null,String(value[1]))));}
function Definition({runs,disabled,onTerm}:{runs:readonly P035Run[];disabled:boolean;onTerm:(term:P035TermId,node:HTMLButtonElement)=>void}){
 return <>{runs.map(run=>run.fractions.every(f=>f===1)?run.termId?<button key={run.sourceTextId} className="p035-explanation__term" data-p035-term={run.termId} type="button" disabled={disabled} onClick={e=>onTerm(run.termId!,e.currentTarget)}>{run.text}</button>:<span key={run.sourceTextId}>{run.text}</span>:<span key={run.sourceTextId}><span className="p035-explanation__sr">{p035Readable([run])}</span><span aria-hidden="true">{[...run.text].map((c,i)=><span className="p035-explanation__glyph" key={i} style={{clipPath:`inset(0 ${(1-run.fractions[i])*100}% 0 0)`}}>{c}</span>)}</span></span>)}</>;
}
function Model({model,side,language}:{model:P035Model;side:'left'|'right';language:'en'|'es'}){
 const transition=model.transition,shades=Array.from({length:100},(_,i)=>p035CellShade(model,i)),solid=shades.filter(v=>v===1).length,changing=shades.some(v=>v>0&&v<1),label=changing?(language==='es'?'Un cuarto del modelo cambia de blanco a amarillo':'One quarter of the model changes from white to yellow'):(language==='es'?`${solid} de 100 partes iguales sombreadas`:`${solid} of 100 equal parts shaded`);
 return <div className="p035-explanation__model" data-p035-model={side} aria-hidden={model.modelAlpha<=0||undefined}>
  <svg viewBox="-1 -1 102 102" role="img" aria-label={label} style={{opacity:model.modelAlpha}}>
   {shades.map((v,i)=><rect key={i} shapeRendering="crispEdges" x={i%10*10} y={Math.floor(i/10)*10} width="10" height="10" fill={`rgb(255,${Math.round(255-51*v)},${Math.round(255-255*v)})`} data-cell={i} data-shade={v}/>)}
   <g fill="none" stroke="#34485d" strokeWidth=".45" opacity={model.divisionAlpha}>
    {Array.from({length:9},(_,i)=><path key={i} d={`M${(i+1)*10} 0V100${side==='right'?` M0 ${(i+1)*10}H100`:''}`}/>)}
   </g>
   <path d={side==='left'?'M50 0V100':'M50 0V100 M0 50H100'} fill="none" stroke="#34485d" strokeWidth=".65"/>
   <rect x="0" y="0" width="100" height="100" fill="none" stroke="#34485d" strokeWidth=".8"/>
  </svg>
  <div className="p035-explanation__equation" data-p035-equation={side} data-lesson-text-block={side+'-equation'} aria-label={p035Equation(model)}>
   <span className="p035-explanation__math-part" style={{opacity:model.fractionAlpha}} aria-hidden={model.fractionAlpha<=0||undefined}>
    {transition?<><Fraction value={transition.fromFraction}/><span className="p035-explanation__arrow" aria-label={language==='es'?'cambia a':'changes to'}>→</span><Fraction value={transition.toFraction}/></>:<Fraction value={model.fraction}/>}
   </span>
   <span className="p035-explanation__math-part" style={{opacity:model.secondAlpha}} aria-hidden={model.secondAlpha<=0||undefined}><span>=</span><Fraction value={model.second}/></span>
   <span className="p035-explanation__math-part" style={{opacity:model.decimalAlpha}} aria-hidden={model.decimalAlpha<=0||undefined}><span>=</span><span>{model.decimal}</span></span>
  </div>
  {transition&&<p className="p035-explanation__transition" lang={language}>{language==='es'?'El modelo está cambiando.':'The model is changing.'}</p>}
 </div>;
}
export interface P035ExplanationProps {readonly state:P035SessionState;readonly language?:'en'|'es';readonly reducedMotion?:boolean;readonly interactionEnabled?:boolean;readonly onTerm:(term:P035TermId,trigger:HTMLButtonElement)=>void;}
export function P035Explanation({state,language='en',reducedMotion=false,interactionEnabled=true,onTerm}:P035ExplanationProps){
 const t=p035Teaching(state.mainFrame);
 return <section className="p035-explanation lesson-text-presentation" lang="en" data-p035-frame={state.mainFrame} data-p035-phase={state.phase} data-reduced-motion={reducedMotion}>
  <LessonAnimationTitleV1 courseTitle="Fractions, Decimals, and Percents Concepts:" activityTitle="Instruction" language="en"/>
  {language==='es'&&<p className="p035-explanation__fallback" lang="es">Esta página conserva el título y el texto originales en inglés. Las definiciones están disponibles en español.</p>}
  <h2 className="p035-explanation__page-title" data-lesson-text-block="page-title">Equivalent Decimals</h2>
  <p className="p035-explanation__definition" data-lesson-text-block="definition"><Definition runs={t.runs} disabled={!interactionEnabled||state.term!==null} onTerm={onTerm}/></p>
  <div className="p035-explanation__models"><Model model={t.left} side="left" language={language}/><Model model={t.right} side="right" language={language}/></div>
 </section>;
}
