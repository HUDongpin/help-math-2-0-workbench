import * as React from 'react';
import {p046IntroFrame} from './nms-l02-p046-intro-v1';
import {P046Instruction} from './nms-l02-p046-instruction-v1';
import {P046_COPY} from './nms-l02-p046-copy-v1';
export function P046IntroView({frame,language='en',reducedMotion=false,onModalChange,interactive=true}:{frame:number;language?:'en'|'es';reducedMotion?:boolean;onModalChange?:(open:boolean)=>void;interactive?:boolean}){
 const s=p046IntroFrame(frame),c=P046_COPY[language],id=React.useId();
 if(!s.visible)return null;
 const selected:readonly number[]=s.selected;
 const chartVisible=s.chartAlpha>0,description=language==='es'?`Un entero dividido en ${s.parts} partes iguales; ${s.selected.length} coloreadas de verde.`:`One whole divided into ${s.parts} equal parts; ${s.selected.length} shaded green.`;
 return <section className="p046-activity" lang={language} data-p046-intro-frame={frame}>
  <h2>{c.title}</h2><P046Instruction text={c.instruction} language={language} enabled={interactive} onModalChange={onModalChange}/><p className="p046-watch">{c.watch}</p>
  {frame>=59&&<p>{c.target} <strong>2/10</strong>.</p>}
  <div className="p046-chart-and-answer">
   {chartVisible&&<figure className="p046-figure" style={{opacity:reducedMotion?1:s.chartAlpha}}>
    <svg viewBox="0 0 324 203" role="img" aria-label={description}>
     {Array.from({length:s.parts},(_,index)=><rect key={index} data-part={index+1} data-selected={selected.includes(index+1)} x={index*322/s.parts+1} y={1} width={322/s.parts} height={201} fill={selected.includes(index+1)?'#99cc33':'#fff'} stroke="#172c43" strokeWidth={1}/>)}
    </svg><figcaption>{language==='es'?`${s.parts} ${s.parts===1?'parte':'partes'}`:`${s.parts} ${s.parts===1?'piece':'pieces'}`}</figcaption>
   </figure>}
   {frame>=59&&<div className="p046-fraction-fields" role="group" aria-label={c.watch}>
    <label htmlFor={id+'-num'}>{c.numerator}</label><input id={id+'-num'} type="text" value={s.numerator} readOnly tabIndex={-1} aria-readonly="true"/>
    <span className="p046-fraction-line" aria-hidden="true"/>
    <label htmlFor={id+'-den'}>{c.denominator}</label><input id={id+'-den'} type="text" value={s.denominator} readOnly tabIndex={-1} aria-readonly="true"/>
   </div>}
  </div>
  <div className="p046-actions"><button disabled data-source-cue={s.click==='up'||undefined}>↑ {c.up}</button><button disabled data-source-cue={s.click==='down'||undefined}>↓ {c.down}</button><button disabled>{c.check}</button><button disabled>{c.next}</button></div>
  {(reducedMotion?frame>=578&&frame<=592:s.equivalenceEmphasis)&&<p className="p046-equivalence">2/10 = 1/5</p>}
 </section>;
}
