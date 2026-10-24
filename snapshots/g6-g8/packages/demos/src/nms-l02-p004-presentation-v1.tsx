'use client';
import React from 'react';
import {getNmsL2P004FrameState,type P004FrameState} from './nms-l02-p004-timeline-v1';
import {NmsL2P004Artwork} from './nms-l02-p004-artwork-v1';
import {p004TeachingState,p004TextSnapshot,P004_KEY_LAYOUT} from './nms-l02-p004-text-v1';
const h=React.createElement;
const math=(...children:React.ReactNode[])=>h('math',{xmlns:'http://www.w3.org/1998/Math/MathML',display:'inline',displaystyle:'true'},h('mrow',null,...children));
const equals=()=>h('mo',null,'=');const number=(n:string)=>h('mn',null,n);
export interface P004PresentationProps{readonly state:P004FrameState;readonly uiLanguage?:'en'|'es';readonly reducedMotion?:boolean;}
export function NmsL2P004Presentation({state,uiLanguage=state.language,reducedMotion=false}:P004PresentationProps){
 const t=p004TeachingState(state),snapshot=p004TextSnapshot(state);
 if(snapshot.status!=='ready')return <p role="alert">{uiLanguage==='es'?'La página no está disponible.':'The page is unavailable.'}</p>;
 const label=(text:string)=>h('mtext',null,<span className="nms-l02-p004__fraction-label">{text}</span>);
 return <section className="nms-l02-p004 lesson-text-presentation" lang="en" data-p004-frame={state.frame} data-p004-domain={state.frameDomain} data-p004-root-frame={state.rootFrame} data-p004-text-status={snapshot.status} data-content-language="en">
  {uiLanguage==='es'&&<p className="nms-l02-p004__fallback" lang="es">Texto original en inglés.</p>}
  {t.headingVisible&&<header className="nms-l02-p004__header"><p data-lesson-text-block="course-title">Fractions, Decimals and Percents Concepts:</p><h2 data-lesson-text-block="activity-title">Real World Activity</h2></header>}
  {state.mainFrame!==null&&<figure className="nms-l02-p004__figure" aria-label={state.mainFrame<453?'The hikers leave a fruit vendor and continue along the path.':t.packs?'The hikers watch five donkeys. Three donkeys carry packs and two do not.':t.total?'Five donkeys walk across a field.':'The hikers watch donkeys walking across a field.'}><NmsL2P004Artwork state={reducedMotion?getNmsL2P004FrameState(1152,{seed:state.seed,lang:state.language,replay:state.replay}):state}/></figure>}
  <div className="nms-l02-p004__teaching">
   <div className="nms-l02-p004__math-column">
    {(t.total||t.packs)&&<div className="nms-l02-p004__relationship" data-lesson-text-block="donkey-relationship">
     {t.wordRatio?<div className="nms-l02-p004__equation" role="region" tabIndex={0} aria-label="Donkeys carrying packs as a fraction of all donkeys">
      {math(h('mfrac',null,label(t.packs),label(t.total)))}
      {t.fraction&&math(equals(),h('mfrac',null,number('3'),number('5')))}
      {t.fractionResult&&math(equals(),number('0.6'))}
     </div>:<div className="nms-l02-p004__labels">{t.total&&<span>{t.total}</span>}{t.packs&&<span>{t.packs}</span>}</div>}
    </div>}
    {(t.dividend||t.question||t.answer)&&<div className="nms-l02-p004__relationship" data-lesson-text-block="division-equation"><div className="nms-l02-p004__equation" role="region" tabIndex={0} aria-label="Two divided by five">
     {t.dividend&&t.divisor&&math(number(t.dividend),h('mo',null,'÷'),number(t.divisor),equals())}
     {t.answer?math(number('0.4')):t.question?math(h('mo',null,'?')):null}
     {t.percent&&math(equals(),number('40'),h('mo',null,'%'))}
    </div></div>}
    {t.conversion&&<div className="nms-l02-p004__conversion" data-lesson-text-block="conversion-demonstration">
     <p>Convert 0.4 to a percent.</p><p className="nms-l02-p004__conversion-help">{t.conversionInstruction}</p>
     <div className="nms-l02-p004__working" aria-hidden="true" style={{'--decimal-progress':t.decimalProgress}as React.CSSProperties}>
      <span style={{visibility:t.leadingZero?'visible':'hidden'}}>0</span><span>4</span><span style={{visibility:t.trailingZero?'visible':'hidden'}}>0</span>
      {t.decimalVisible&&<b className="nms-l02-p004__decimal">.</b>}
      {t.arrows>0&&<i className="nms-l02-p004__arrows">{t.arrows===2?'↷ ↷':'↷'}</i>}
     </div>
    </div>}
   </div>
   {t.calculator&&<figure className="nms-l02-p004__calculator" aria-label="Calculator demonstration">
    <figcaption>Calculator <small>Demonstration</small></figcaption>
    <output className="nms-l02-p004__display" aria-label="Calculator display" data-lesson-text-block="calculator-display">{t.calculatorDisplay||'\u00a0'}</output>
    <div className="nms-l02-p004__keys" data-lesson-text-block="calculator-keys" aria-hidden="true">{P004_KEY_LAYOUT.map((key,i)=><span key={i} data-source-key={key||undefined} data-active={key&&key===t.calculatorKey?'true':undefined} className={key?'':'nms-l02-p004__key-gap'}>{key==='/'?'÷':key==='x'?'×':key==='-'?'−':key}</span>)}</div>
    <p className="nms-l02-p004__calculator-footer" aria-hidden="true">Start Over</p>
   </figure>}
  </div>
 </section>;
}
