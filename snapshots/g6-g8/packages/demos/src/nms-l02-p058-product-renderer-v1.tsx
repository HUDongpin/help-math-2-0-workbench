'use client';
import React,{type CSSProperties} from 'react';
import type {AnimationRendererProps,RuntimeContext} from './contract';
import {P058_ID,P058_SOURCE_SHA,P058_LEFT_STRATEGIES,P058_RIGHT_STRATEGIES,p058SemanticSnapshot} from './nms-l02-p058-semantic-v1';
import {p058ProductContextReady,p058ProductTextSnapshotV1} from './nms-l02-p058-product-text-v1';

const card:CSSProperties={border:'2px solid #ad5a22',borderRadius:12,padding:'0.8rem',minHeight:'4.5rem',background:'#fff9f3',minWidth:0};
const emphasis:CSSProperties={color:'#852080',background:'#fbd8f5'};
type Pose=ReturnType<typeof p058SemanticSnapshot>['heading17'];
/** Preserve source-relative motion at the original 20 twips per CSS pixel.
 * The surrounding reflow layout is deliberate modernization, not pixel parity. */
function poseStyle(pose:Pose):CSSProperties{
 const offset=pose.relativeToFinalTwips;
 return {opacity:pose.alpha,transform:`translate(${(offset?.x??0)/20}px, ${(offset?.y??0)/20}px)`,transition:'none'};
}
export function NmsL02P058ProductRendererV1(props:AnimationRendererProps){
 const context:RuntimeContext={frame:props.frame,frameDomain:props.frameDomain,rootFrame:props.rootFrame,
  scenario:props.scenario,lang:props.lang,seed:props.seed,replay:props.replay};
 let state:ReturnType<typeof p058SemanticSnapshot>|null=null;
 try{if(p058ProductContextReady(context)&&p058ProductTextSnapshotV1(context).status==='ready')state=p058SemanticSnapshot(props.frame);}catch{}
 const es=props.uiLanguage==='es';
 return <article className="nms-p058-product" lang="en" data-p058-product={P058_ID}
  data-p058-frame={state?props.frame:undefined} data-source-frame-domain="sprite-37"
  data-source-swf-sha256={P058_SOURCE_SHA} data-language-policy={es?'english-source-fallback':'english-source'}
  data-canvas-status={state?'ready':'error'}
  style={{boxSizing:'border-box',maxWidth:'60rem',margin:'0 auto',padding:'clamp(0.6rem,3vw,1.5rem)',
   color:'#14283d',fontFamily:'var(--lesson-text-font-body, sans-serif)',lineHeight:1.5,minWidth:0}}>
  {es&&<p lang="es" data-spanish-translation="missing">Texto original en inglés. No hay una traducción al español verificada.</p>}
  {!state?<p role="alert">{es?'La proyección de la fuente no está disponible.':'The source projection is unavailable.'}</p>:<>
   <section aria-label="Four step plan" data-source-semantic-view="sprite-37">
    <div style={{minHeight:'3.5rem'}}>
     {state.heading17.alpha>0&&<h2 data-source-text-id="17" aria-hidden={state.heading17.alpha<1}
      style={{...poseStyle(state.heading17),fontSize:'clamp(1.35rem,3vw,1.7rem)',margin:'0 0 0.6rem'}}>4 Check your answer.</h2>}
    </div>
    <ol style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,20rem),1fr))',gap:'0.65rem',listStyle:'none',margin:0,padding:0}}>
     <li style={card}><strong>1.</strong> <span data-source-text-id="9">Restate the question.</span></li>
     <li style={card}><strong>2.</strong> <span data-source-text-id="12">Organize the information.</span></li>
     <li style={card}><strong>3.</strong> <span data-source-text-id="14">Solve the problem.</span></li>
     <li style={card}><strong>4.</strong> {state.stepFour15.alpha>0&&<span data-source-text-id="15" aria-hidden={state.stepFour15.alpha<1}
      style={{...poseStyle(state.stepFour15),display:'inline-block'}}>Check your answer.</span>}</li>
    </ol>
    {state.strategies19.alpha>0&&<h3 data-source-text-id="19" aria-hidden={state.strategies19.alpha<1}
     style={{...poseStyle(state.strategies19),fontSize:'1.2rem',margin:'1rem 0 0.4rem'}}>
     <span aria-hidden="true" style={{color:'#bb2637'}}>● </span>Strategies to try:</h3>}
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,18rem),1fr))',gap:'0.6rem 1.4rem'}}>
     {state.leftStrategies26.alpha>0&&<ul data-source-text-id="26" aria-hidden={state.leftStrategies26.alpha<1}
      style={{...poseStyle(state.leftStrategies26),margin:0,paddingLeft:'1.3rem'}}>{P058_LEFT_STRATEGIES.map(text=><li key={text}>{text}</li>)}</ul>}
     {state.rightStrategies24.alpha>0&&<ul data-source-text-id="24" aria-hidden={state.rightStrategies24.alpha<1}
      style={{...poseStyle(state.rightStrategies24),margin:0,paddingLeft:'1.3rem'}}>{P058_RIGHT_STRATEGIES.map(text=><li key={text}>{text}</li>)}</ul>}
    </div>
    {state.show32.alpha>0&&<p data-source-text-id="32 35" data-source-show-flash={state.flashActive?'true':'false'} aria-hidden={state.show32.alpha<1}
     style={{...poseStyle(state.show32),fontWeight:700,fontSize:'1.2rem',margin:'1rem 0 0'}}>
     <span aria-hidden="true" style={{color:'#bb2637'}}>● </span><span data-source-key="Show" style={state.flashActive?emphasis:undefined}>Show</span> your work.</p>}
   </section>
  </>}
 </article>;
}
