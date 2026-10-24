'use client';
import {useRef} from 'react';
import {LessonAnimationTitleV1} from './lesson-animation-title-v1';
import {p034Teaching,p034Digits,p034Readable,P034_GUIDANCE_SHAPES,type P034Run} from './nms-l02-p034-teaching-v1';
import {p034Decimal,type P034SessionState} from './nms-l02-p034-state-v1';
import './nms-l02-p034-practice-v1.css';
export interface P034PracticeProps {
 readonly state:P034SessionState;readonly language?:'en'|'es';readonly reducedMotion?:boolean;readonly interactionEnabled?:boolean;
 readonly onValue:(value:number)=>void;readonly onDragStart:()=>void;readonly onDragEnd:()=>void;
 readonly onResetPress:()=>void;readonly onResetCancel:()=>void;readonly onReset:()=>void;
 readonly onTerm:(trigger:HTMLButtonElement)=>void;
}
function Instruction({runs,onTerm,disabled}:{runs:readonly P034Run[];onTerm:(node:HTMLButtonElement)=>void;disabled:boolean}){
 return <>{runs.map(run=>run.fractions.every(f=>f===1)?run.termId?<button key={run.sourceTextId} className="p034-practice__term" data-p034-term="decimal" type="button" disabled={disabled} onClick={e=>onTerm(e.currentTarget)}>{run.text}</button>:<span key={run.sourceTextId}>{run.text}</span>:<span key={run.sourceTextId}><span className="p034-practice__sr">{p034Readable([run])}</span><span aria-hidden="true">{[...run.text].map((c,i)=><span className="p034-practice__glyph" key={i} style={{clipPath:`inset(0 ${(1-run.fractions[i])*100}% 0 0)`}}>{c}</span>)}</span></span>)}</>;

}
export function P034Practice({state,language='en',reducedMotion=false,interactionEnabled=true,onValue,onDragStart,onDragEnd,onResetPress,onResetCancel,onReset,onTerm}:P034PracticeProps){
 const latest=useRef(state);latest.current=state;const t=p034Teaching(state),enabled=interactionEnabled&&state.phase==='practice'&&!state.termOpen,digits=p034Digits(state),full=p034Decimal(state.value),edges=t.art.filter(a=>a.characterId>=117&&a.characterId<=124),guidance=t.art.filter(a=>[114,115,125].includes(a.characterId));
 const title=language==='es'?'Centésimos sombreados':'Hundredths shaded';
 return <section className="p034-practice lesson-text-presentation" lang="en" data-p034-phase={state.phase} data-p034-frame={state.mainFrame} data-p034-value={state.value}>
  <LessonAnimationTitleV1 courseTitle="Fractions, Decimals, and Percents Concepts:" activityTitle="Instruction" language="en"/>
  {language==='es'&&<p className="p034-practice__fallback" lang="es">Esta página conserva el título y el texto originales en inglés. La definición está disponible en español.</p>}
  <div className="p034-practice__instructions">{[152,154].map(id=>{const runs=t.runs.filter(r=>r.sourceTextId.startsWith('character-'+id+'/'));return runs.length?<p key={id} data-lesson-text-block={'instruction-'+id}><Instruction runs={runs} disabled={state.termOpen||!interactionEnabled} onTerm={onTerm}/></p>:null})}</div>
  <div className="p034-practice__layout">
   <div className="p034-practice__diagram">
    <svg viewBox="-310 -70 210 210" role="img" aria-label={language==='es'?`${state.value} de 100 partes iguales sombreadas`:`${state.value} of 100 equal parts shaded`} data-p034-grid="hundredths" style={{opacity:t.gridAlpha}}>
     {Array.from({length:100},(_,i)=><rect key={i} x={-306.4+i%10*20} y={-63.65+Math.floor(i/10)*20} width="20" height="20" stroke="#41566b" strokeWidth=".7" fill={i<state.value?(state.mainFrame>=395?'#0000ff':'#0033cc'):'#fff'} data-cell={i} data-shaded={String(i<state.value)}/>)}
     {reducedMotion&&edges.length?<rect x="-308" y="-66" width="204" height="205" fill="none" stroke="#ff0000" strokeWidth="4"/>:edges.map((a,i)=><g key={i} opacity={a.alpha} transform={'matrix('+a.matrix.join(' ')+')'} dangerouslySetInnerHTML={{__html:P034_GUIDANCE_SHAPES[a.shape]}}/>)}
    </svg>
    {guidance.length>0&&<svg className="p034-practice__guidance" viewBox="-350 145 270 60" aria-hidden="true">{guidance.filter(a=>!reducedMotion||a.characterId!==125).map((a,i)=><g key={i} opacity={a.alpha} transform={'matrix('+a.matrix.join(' ')+')'} dangerouslySetInnerHTML={{__html:P034_GUIDANCE_SHAPES[a.shape]}}/>)}</svg>}
   </div>
   <output className="p034-practice__number" data-lesson-text-block="decimal-value" aria-label={(language==='es'?'Decimal: ':'Decimal: ')+(digits[0]??'')+(t.gridAlpha>0?'.':'')+digits.slice(1).map(v=>v??'').join('')}>
    {digits.map((d,i)=><span key={i} className="p034-practice__digit-group">{i===1&&<span aria-hidden="true" className="p034-practice__point" style={{opacity:t.gridAlpha}}>.</span>}<span className="p034-practice__digit">{d??'\u00a0'}</span></span>)}
   </output>
  </div>
  {state.mainFrame>=395&&<div className="p034-practice__controls" lang={language}>
   <label className="p034-practice__range-label">{title}<input type="range" min="0" max="100" step="1" value={state.value} disabled={!enabled} aria-valuetext={`${full}; ${state.value} ${language==='es'?'de':'of'} 100`} onPointerDown={e=>{if(enabled){e.currentTarget.setPointerCapture(e.pointerId);onDragStart();}}} onPointerUp={onDragEnd} onPointerCancel={onDragEnd} onLostPointerCapture={onDragEnd} onChange={e=>{if(enabled)onValue(Number(e.currentTarget.value));}}/></label>
   <button data-lesson-text-block="reset" type="button" disabled={!enabled} onPointerDown={e=>{if(enabled&&e.button===0)onResetPress();}} onPointerEnter={e=>{if(enabled&&e.buttons===1)onResetPress();}} onPointerUp={onResetCancel} onPointerCancel={onResetCancel} onPointerLeave={onResetCancel} onKeyDown={e=>{if(enabled&&!e.repeat&&(e.key===' '||e.key==='Enter'))onResetPress();}} onKeyUp={e=>{if(e.key===' '||e.key==='Enter')onResetCancel();}} onBlur={onResetCancel} onClick={()=>{if(interactionEnabled&&latest.current.phase==='practice'&&!latest.current.termOpen)onReset();}}>{language==='es'?'Reiniciar':'Reset'}</button>
  </div>}
 </section>;
}
