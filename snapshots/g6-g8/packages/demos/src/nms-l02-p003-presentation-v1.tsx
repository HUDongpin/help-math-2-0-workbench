'use client';
import React from 'react';
import {getNmsL2P003FrameState,type P003FrameState} from './nms-l02-p003-timeline-v1';
import {NmsL2P003Artwork} from './nms-l02-p003-artwork-v1';
import {p003TeachingState,p003TextSnapshot} from './nms-l02-p003-text-v1';
const h=React.createElement;
const math=(...children:React.ReactNode[])=>h('math',{xmlns:'http://www.w3.org/1998/Math/MathML',display:'inline',displaystyle:'true'},h('mrow',null,...children));
const equals=()=>h('mo',null,'=');
export interface P003PresentationProps{readonly state:P003FrameState;readonly uiLanguage?:'en'|'es';readonly reducedMotion?:boolean;}
export function NmsL2P003Presentation({state,uiLanguage=state.language,reducedMotion=false}:P003PresentationProps){
 const t=p003TeachingState(state),snapshot=p003TextSnapshot(state);
 if(snapshot.status!=='ready')return <p role="alert">{uiLanguage==='es'?'La página no está disponible.':'The page is unavailable.'}</p>;
 const label=(text:string,part:string)=>h('mtext',null,<span className="nms-l02-p003__fraction-label" data-emphasis={t.emphasis===part?'true':undefined}>{text}</span>);
 return <section className="nms-l02-p003 lesson-text-presentation" lang="en" data-p003-frame={state.frame} data-p003-domain={state.frameDomain} data-p003-root-frame={state.rootFrame} data-p003-text-status={snapshot.status} data-content-language="en">
  {uiLanguage==='es'&&<p className="nms-l02-p003__fallback" lang="es">Texto original en inglés.</p>}
  {t.headingVisible&&<header className="nms-l02-p003__header"><p data-lesson-text-block="course-title">Fractions, Decimals and Percents Concepts:</p><h2 data-lesson-text-block="activity-title">Real World Activity</h2></header>}
  {state.mainFrame!==null&&<figure className="nms-l02-p003__figure" aria-label="Two hikers meet a fruit vendor carrying a basket of fruit in a green landscape."><NmsL2P003Artwork state={reducedMotion?getNmsL2P003FrameState(1319,{seed:state.seed,lang:state.language,replay:state.replay}):state}/></figure>}
  <div className="nms-l02-p003__teaching">
   {t.summary&&<p className="nms-l02-p003__summary" data-lesson-text-block="fruit-summary">{t.summary}</p>}
   {(t.numerator||t.denominator)&&<div className="nms-l02-p003__relationship" data-lesson-text-block="fruit-equation">
    {t.ratio?<div className="nms-l02-p003__equation" role="region" tabIndex={0} aria-label="Bananas as a fraction of the fruit">
     {math(h('mfrac',null,label(t.numerator,'numerator'),label(t.denominator,'denominator')))}
     {t.half&&<span data-emphasis={t.emphasis==='half'?'true':undefined}>{math(equals(),h('mfrac',null,h('mn',null,'1'),h('mn',null,'2')))}</span>}
     {t.decimal&&math(equals(),h('mn',{'data-emphasis':t.emphasis?.startsWith('decimal-')?'true':undefined,'data-source-emphasis':t.emphasis?.startsWith('decimal-')?t.emphasis:undefined},'0.50'))}
    </div>:<div className="nms-l02-p003__labels">{t.numerator&&<span>{t.numerator}</span>}{t.denominator&&<span>{t.denominator}</span>}</div>}
   </div>}
  </div>
 </section>;
}
