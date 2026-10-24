'use client';
import React,{useId,useLayoutEffect,useRef,useState}from'react';
import type{AnimationRendererProps}from'./contract';
import{LessonAnimationTitleV1}from'./lesson-animation-title-v1';
import{algL07P003Frame,ALG_L07_P003_SOURCE as SOURCE,type AlgL07P003Frame}from'./alg-l07-p003-state-v1';
import type{P003TermKey}from'./alg-l07-p003-session-v1';
import './alg-l07-p003-v1.css';
export interface P003CanvasAsset{ready():Promise<void>;renderNative(canvas:HTMLCanvasElement,request:{frame:number;frameDomain:string;rootFrame:number;scenario:string;lang:'en';seed:number;replay:number;suppressInstanceIds:readonly string[]}):unknown;}
function SourceGraphics({asset,state,onCommit}:{asset?:P003CanvasAsset;state:AlgL07P003Frame;onCommit?:(frame:number,accepted:boolean)=>void}){
 const canvas=useRef<HTMLCanvasElement|null>(null),latest=useRef(state);latest.current=state;const[ready,setReady]=useState(false),[failed,setFailed]=useState(false);
 useLayoutEffect(()=>{let active=true;setReady(false);if(asset)void asset.ready().then(()=>{if(active)setReady(true);},()=>{if(active)setFailed(true);});return()=>{active=false;};},[asset]);
 useLayoutEffect(()=>{if(!ready||!asset||!canvas.current||!state.ready){onCommit?.(state.mainFrame,false);return;}try{asset.renderNative(canvas.current,{frame:state.mainFrame,frameDomain:'sprite-401',rootFrame:6,scenario:'source-static-frame',lang:'en',seed:state.seed,replay:state.replay,suppressInstanceIds:state.suppressInstanceIds});setFailed(false);onCommit?.(state.mainFrame,true);}catch{setFailed(true);onCommit?.(state.mainFrame,false);}},[asset,ready,state,onCommit]);
 return <div className="alg-l07-p003__graphics" data-p003-canvas-ready={ready&&!failed}><canvas ref={canvas} width={800} height={600} aria-hidden="true"/>{failed&&<p role="alert">The source illustration could not load.</p>}</div>;
}
function Equation({kind}:{kind:'equation'|'substitution'|'result'}){const row=kind==='equation'?[['mi','y'],['mo','='],['mn','0.20'],['mi','x']]:kind==='substitution'?[['mi','y'],['mo','='],['mn','0.20'],['mo','('],['mn','500'],['mo',')']]:[['mi','y'],['mo','='],['mn','100']];return React.createElement('math',{xmlns:'http://www.w3.org/1998/Math/MathML',display:'block'},React.createElement('mrow',null,row.map(([tag,value],i)=>React.createElement(tag!,{key:i},value))));}
export function AlgL07P003Presentation({state,asset,onTerm,onGraphicsCommit}:{state:AlgL07P003Frame;asset?:P003CanvasAsset;onTerm?:(key:P003TermKey,trigger:HTMLButtonElement)=>void;onGraphicsCommit?:(frame:number,accepted:boolean)=>void}){
 const annotationId=useId(),association=state.rowAssociation,associated=association.annotationAlpha>0;
 if(!state.ready)return <section data-animation-id={SOURCE.animationId} data-flash-frame={state.frame} data-flash-frame-domain="root" aria-busy="true"/>;
 return <section className="alg-l07-p003 lesson-text-presentation" data-animation-id={state.animationId} data-flash-animation-id={state.animationId} data-flash-frame={state.frame} data-flash-frame-domain={state.frameDomain} data-flash-root-frame={state.rootFrame} data-flash-language={state.language} data-flash-seed={state.seed} data-flash-replay={state.replay} data-source-text-ids={state.sourceTextIds.join(',')} data-source-swf-sha256={SOURCE.sourceSha256} data-main-content-language="en" data-source-english-fallback={state.language==='es'} lang="en">
  <LessonAnimationTitleV1 courseTitle="Linear and Nonlinear Functions:" activityTitle="Real World Activity" language="en"/>
  <div className="alg-l07-p003__scene"><SourceGraphics asset={asset} state={state} onCommit={onGraphicsCommit}/><div className="alg-l07-p003__teaching">
   <div className="alg-l07-p003__table-scroll" tabIndex={0} role="region" aria-label="Cell Phone Service Plans table"><table data-lesson-text-block="plans"><caption>Cell Phone Service Plans</caption><thead><tr><th scope="col">Plan</th><th scope="col">Monthly Fee</th><th scope="col">Minutes Fee</th></tr></thead><tbody><tr data-p003-associated-plan="smooth-talk" data-p003-association-alpha={association.highlightAlpha} style={{backgroundColor:`rgba(255,229,151,${association.highlightAlpha})`}}><th scope="row" aria-describedby={associated?annotationId:undefined}>1. Smooth Talk{associated&&<span id={annotationId} data-p003-row-annotation="source-379-381" data-source-text-id="character-379" data-source-shape-ids="380,381" className="alg-l07-p003__row-annotation" style={{opacity:association.annotationAlpha}}>500 minutes = $100</span>}</th><td>$0</td><td>$0.20/minute</td></tr><tr><th scope="row">2. Easy Talk</th><td>$50</td><td>$0.05/minute</td></tr><tr><th scope="row">3. Super Talk</th><td>$60</td><td>$0.03/minute</td></tr></tbody></table></div>
   {state.definition&&<p data-lesson-text-block="definition">{state.definition}</p>}
   {state.variables.length>0&&<div data-lesson-text-block="variables">{state.variables.map(t=><p key={t}>{t}</p>)}</div>}
   {state.equation&&<div data-lesson-text-block="equation"><Equation kind="equation"/></div>}{state.substitution&&<div data-lesson-text-block="substitution"><Equation kind="substitution"/></div>}{state.result&&<div data-lesson-text-block="result"><Equation kind="result"/></div>}
   {state.summary&&<p data-lesson-text-block="summary" className="alg-l07-p003__summary">{state.summary}</p>}
   {state.expandedSummary&&<p data-lesson-text-block="expanded-summary" className="alg-l07-p003__summary" style={{opacity:state.expandedSummaryAlpha}}>{state.expandedSummary}</p>}
   {onTerm&&<nav className="alg-l07-p003__terms" aria-label={state.language==='es'?'Términos clave':'Key terms'} lang={state.language}>{(['Function','Relation','Value']as const).filter(k=>state.termAvailable[k]).map(key=><button key={key} type="button" data-p003-term={key} onClick={e=>onTerm(key,e.currentTarget)}>{SOURCE.terms.find(t=>t.sourceKeyAttribute===key)!.labels[state.language]}</button>)}</nav>}
  </div></div>
 </section>;
}
export function AlgL07P003Renderer(props:AnimationRendererProps){const asset=(globalThis as typeof globalThis&{HELP_MATH_CANVAS_ASSETS?:Record<string,P003CanvasAsset>}).HELP_MATH_CANVAS_ASSETS?.[SOURCE.animationId];return <AlgL07P003Presentation state={algL07P003Frame(props.frame,{...props,frame:props.frame})} asset={asset}/>;}
