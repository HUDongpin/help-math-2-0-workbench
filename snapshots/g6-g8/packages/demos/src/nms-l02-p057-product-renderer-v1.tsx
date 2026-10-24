'use client';
import React,{type CSSProperties} from 'react';
import type {AnimationRendererProps,RuntimeContext} from './contract';
import {P057_ID,P057_SOURCE_SHA,P057_LEFT_STRATEGIES,P057_RIGHT_STRATEGIES,p057SemanticSnapshot} from './nms-l02-p057-semantic-v1';
import {p057ProductContextReady,p057ProductTextSnapshotV1} from './nms-l02-p057-product-text-v1';

const card:CSSProperties={border:'2px solid #ad5a22',borderRadius:12,padding:'0.8rem',minHeight:'4.5rem',background:'#fff9f3',minWidth:0};
const hidden:CSSProperties={position:'absolute',width:1,height:1,overflow:'hidden',clipPath:'inset(50%)'};
const fade=(opacity:number):CSSProperties=>({opacity,transition:'none'});
const highlight:CSSProperties={color:'#852080',background:'#fbd8f5'};
/** Maintained semantic DOM, driven by exact source layer alphas and emphasis.
 * Layout/font modernization is deliberate and does not claim pixel fidelity. */
export function NmsL02P057ProductRendererV1(props:AnimationRendererProps){
 const context:RuntimeContext={frame:props.frame,frameDomain:props.frameDomain,rootFrame:props.rootFrame,
  scenario:props.scenario,lang:props.lang,seed:props.seed,replay:props.replay};
 let state:ReturnType<typeof p057SemanticSnapshot>|null=null;
 try{if(p057ProductContextReady(context)&&p057ProductTextSnapshotV1(context).status==='ready')state=p057SemanticSnapshot(props.frame);}catch{}
 const es=props.uiLanguage==='es';
 return <article className="nms-p057-product" lang="en" data-p057-product={P057_ID}
  data-p057-frame={state?props.frame:undefined} data-source-frame-domain="sprite-66"
  data-source-swf-sha256={P057_SOURCE_SHA} data-language-policy={es?'english-source-fallback':'english-source'}
  data-canvas-status={state?'ready':'error'}
  style={{boxSizing:'border-box',maxWidth:'60rem',margin:'0 auto',padding:'clamp(0.6rem,3vw,1.5rem)',
   color:'#14283d',fontFamily:'var(--lesson-text-font-body, sans-serif)',lineHeight:1.5,minWidth:0}}>
  {es&&<p lang="es" data-spanish-translation="missing">Texto original en inglés. No hay una traducción al español verificada.</p>}
  {!state?<p role="alert">{es?'La proyección de la fuente no está disponible.':'The source projection is unavailable.'}</p>:<>
   <section aria-label="Four step plan" data-source-semantic-view="sprite-66">
    <div style={{minHeight:'3.5rem'}}>
     {state.headingAlpha>0&&<h2 data-source-text-id="14 15" aria-hidden={state.headingAlpha<1}
      style={{...fade(state.headingAlpha),fontSize:'clamp(1.35rem,3vw,1.7rem)',margin:'0 0 0.6rem'}}>
      3 <span data-source-key="Solve" style={state.highlightedTerm==='Solve'?highlight:undefined}>Solve</span>
      {' the '}<span data-source-key="Problem" style={state.highlightedTerm==='Problem'?highlight:undefined}>problem</span>.
     </h2>}
    </div>
    <ol style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,20rem),1fr))',gap:'0.65rem',listStyle:'none',margin:0,padding:0}}>
     <li style={card}><strong>1.</strong> <span data-source-text-id="9">Restate the question.</span></li>
     <li style={card}><strong>2.</strong> <span data-source-text-id="12">Organize the information.</span></li>
     <li style={card}><strong>3.</strong> {state.stepThreeAlpha>0&&<span data-source-text-id="19" aria-hidden={state.stepThreeAlpha<1} style={fade(state.stepThreeAlpha)}>Solve the problem.</span>}</li>
     <li style={card}><strong>4.</strong><span style={hidden}>No source step text on this page.</span></li>
    </ol>
    {state.strategiesHeadingAlpha>0&&<h3 data-source-text-id="23" aria-hidden={state.strategiesHeadingAlpha<1}
     style={{...fade(state.strategiesHeadingAlpha),fontSize:'1.2rem',margin:'1rem 0 0.4rem'}}>
     <span aria-hidden="true" style={{color:'#bb2637'}}>● </span>Strategies to try:</h3>}
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,18rem),1fr))',gap:'0.6rem 1.4rem'}}>
     {state.leftStrategiesAlpha>0&&<ul data-source-text-group="79-positioned-glyphs" aria-hidden={state.leftStrategiesAlpha<1}
      style={{...fade(state.leftStrategiesAlpha),margin:0,paddingLeft:'1.3rem'}}>{P057_LEFT_STRATEGIES.map(text=><li key={text}>{text}</li>)}</ul>}
     {state.rightStrategiesAlpha>0&&<ul data-source-text-id="59" aria-hidden={state.rightStrategiesAlpha<1}
      style={{...fade(state.rightStrategiesAlpha),margin:0,paddingLeft:'1.3rem'}}>{P057_RIGHT_STRATEGIES.map(text=><li key={text}>{text}</li>)}</ul>}
    </div>
    {state.finalPromptAlpha>0&&<p data-source-text-id="64" aria-hidden={state.finalPromptAlpha<1}
     style={{...fade(state.finalPromptAlpha),fontWeight:700,fontSize:'1.2rem',margin:'1rem 0 0'}}>
     <span aria-hidden="true" style={{color:'#bb2637'}}>● </span>Circle your answer</p>}
   </section>
  </>}
 </article>;
}
