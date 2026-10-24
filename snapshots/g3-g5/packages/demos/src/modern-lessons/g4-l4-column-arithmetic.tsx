'use client';

import React, {useLayoutEffect, useRef} from 'react';
import type {AnimationRendererProps, AudioCue, RuntimeContext} from '../contract';
import type {LessonTextBinding, LessonTextPresentationCapability, TextPresentationSnapshot} from '../lesson-text-contract';
import type {SourceStaticCanvasFrameState} from '../source-static-canvas-candidate';
import {validateLessonTextBinding} from '../lesson-text-snapshot';
import {numberLineValue as valueAt} from './g4-l4-number-line';

type Curve<T> = readonly (readonly [number, T])[];
type LabelState = Readonly<{x:number; baseline:number; alpha:number; color:string; stroke:string|null; depth:number}>;
type Block = Readonly<{id:string; text:string; fontScale?:number; role:'title'|'label'; sourceTextIds:readonly string[]; sourceShapeIds:readonly number[]; sourceInstances:readonly string[]; states:Curve<LabelState|null>}>;
type Placement = Readonly<{character:number; matrix:readonly number[]; alpha:number; ratio:number}>;
type Shape = Readonly<{
 character:number; sourceTagSha256:string;
 paths:readonly Readonly<{d:string; fill:string; stroke:string; width:number}>[];
 gradients?:readonly Readonly<{id:string; matrix:readonly number[]; stops:readonly Readonly<{offset:number; color:string}>[]}>[];
 morph?:Readonly<{fillColors?:readonly (readonly number[])[]; widths:readonly number[]; colors:readonly (readonly number[])[]; start:readonly (readonly (readonly number[])[])[]; end:readonly (readonly (readonly number[])[])[]}>;
}>;
export interface ColumnArithmeticConfig {
 readonly animationId:string; readonly placementId:string; readonly sourceSwfSha256:string;
 readonly rootFrame:6; readonly frameDomain:string; readonly frameCount:number; readonly fps:12;
 readonly blocks:readonly Block[]; readonly binding:LessonTextBinding;
 readonly sourceAudio:readonly (AudioCue & {readonly sha256:string})[];
 readonly figure:Readonly<{bounds:readonly number[]; unitsPerEm:readonly number[]; label:string; initialFocusX:number; keyboardScrollStep?:number; shapes:readonly Shape[]; placements:readonly Readonly<{depth:number; states:Curve<Placement|null>}>[]}>;
}

export function getColumnTeachingState(config:ColumnArithmeticConfig, requestedFrame:number) {
 const frame=Math.max(1,Math.min(config.frameCount,Math.floor(Number.isFinite(requestedFrame)?requestedFrame:1)));
 return {frame,blocks:config.blocks.map(block=>{
  const state=block.role==='title'?null:valueAt(block.states,frame,null);
  return {...block,state,visible:block.role==='title'||(state?.alpha??0)>0};
 })};
}

export function getColumnTextSnapshot(config:ColumnArithmeticConfig,state:SourceStaticCanvasFrameState,context:RuntimeContext):TextPresentationSnapshot {
 const blockers:string[]=[];
 if(state.animationId!==config.animationId||state.sourceSwfSha256!==config.sourceSwfSha256)blockers.push('source-identity-mismatch');
 if(state.status!=='ready')blockers.push(state.blocker??'source-state-not-ready');
 if(state.frameDomain!==config.frameDomain||(context.frameDomain??config.frameDomain)!==config.frameDomain)blockers.push('unsupported-frame-domain');
 if(state.rootFrame!==6||(context.rootFrame!==undefined&&context.rootFrame!==6))blockers.push('unsupported-root-context');
 if(state.scenario!=='source-static-frame'||context.scenario!==state.scenario)blockers.push('unsupported-scenario');
 if(state.language!=='en'||context.lang!=='en')blockers.push('spanish-text-not-source-verified');
 if(!Number.isInteger(context.frame)||context.frame<1||context.frame>config.frameCount||state.frame!==context.frame)blockers.push('source-frame-mismatch');
 if(state.seed!==(context.seed>>>0))blockers.push('source-seed-mismatch');
 if(context.entryStateSha256)blockers.push('capture-uses-source-canvas');
 const teaching=getColumnTeachingState(config,state.frame);
 return {schemaVersion:1,animationId:config.animationId,bindingVersion:config.binding.version,sourceSwfSha256:config.sourceSwfSha256,status:blockers.length?'blocked':'ready',blockers,
  identity:{frame:state.frame,frameDomain:state.frameDomain,rootFrame:state.rootFrame,scenario:state.scenario,language:state.language,seed:state.seed,replay:context.replay??0},suppressedInstances:[],
  blocks:blockers.length?[]:config.binding.blocks.map(b=>{const t=teaching.blocks.find(t=>t.id===b.id)!;return {id:b.id,text:t.visible?t.text:'',visible:t.visible,role:b.role,language:b.language,readingOrder:b.readingOrder};})};
}

// The source has multiple line segments and changing line RGBA. Interpolate
// every segment and style together, without treating a morph as a single line.
export function getColumnShapePaths(shape:Shape, ratio:number) {
 if(!shape.morph)return shape.paths;
 const morph=shape.morph,t=Math.max(0,Math.min(1,ratio/65535));
 const segments=morph.start.map((segment,i)=>segment.map((point,j)=>point.map((v,k)=>v+(morph.end[i][j][k]-v)*t)));
 if(morph.fillColors){
  const color=morph.fillColors[0].map((v,i)=>v+(morph.fillColors![1][i]-v)*t);
  let previous:readonly number[]|undefined;const commands:string[]=[];
  for(const segment of segments){if(!previous||segment[0][0]!==previous[0]||segment[0][1]!==previous[1])commands.push(`M ${segment[0].join(' ')}`);commands.push(`L ${segment[1].join(' ')}`);previous=segment[1];}
  return [{d:commands.join(' '),fill:`rgba(${color[0]},${color[1]},${color[2]},${color[3]/255})`,stroke:'none',width:0}];
 }
 const c=morph.colors[0].map((v,i)=>v+(morph.colors[1][i]-v)*t);
 return [{d:segments.map(s=>`M ${s[0].join(' ')} L ${s[1].join(' ')}`).join(' '),fill:'none',stroke:`rgba(${c[0]},${c[1]},${c[2]},${c[3]/255})`,width:morph.widths[0]+(morph.widths[1]-morph.widths[0])*t}];
}

const CSS=`
.g4l4-column{inline-size:100%;min-inline-size:0;background:#fffdf7;padding:.8rem;box-sizing:border-box}
.g4l4-column *{box-sizing:border-box}
.g4l4-column .lesson-text-presentation__block--title{overflow-wrap:normal;word-break:normal;hyphens:none}
.g4l4-column__port{max-inline-size:100%;min-inline-size:0;overflow-x:auto;padding:.6rem .35rem;overscroll-behavior-inline:contain}
.g4l4-column__port:focus-visible{outline:3px solid #1556a0;outline-offset:3px}
.g4l4-column__figure{position:relative;font-size:1.125rem;line-height:1;margin-inline:auto}
.g4l4-column__geometry{position:absolute;inset:0;inline-size:100%;block-size:100%;pointer-events:none}
.g4l4-column__label{position:absolute;transform:translate(-50%,-.85em);white-space:pre;line-height:1;font-variant-numeric:tabular-nums;transition:none!important}
@media(max-width:480px){.g4l4-column{padding-inline:0}
 .lesson-shell2 .lesson-shell2__legacy-stage:has(.runtime-shell[data-lesson-presentation='modern-text-v1'] .g4l4-column){width:calc(100vw - 8px);max-width:none;margin-inline:calc((100% - 100vw + 8px)/2)}
 .lesson-shell2 .lesson-shell2__legacy-stage:has(.runtime-shell[data-lesson-presentation='modern-text-v1'] .g4l4-column)>.lesson-shell2__stage{padding-inline:2px}}
`;

export function ColumnArithmeticScene({config,frame,replay=0,children,heading,headingBlockId='root-title',after,renderLabel,keyboardScrollStep}:{config:ColumnArithmeticConfig;frame:number;replay?:number;children?:React.ReactNode;heading?:React.ReactNode;headingBlockId?:string;after?:React.ReactNode;renderLabel?:(block:Block)=>React.ReactNode;keyboardScrollStep?:number}) {
 const teaching=getColumnTeachingState(config,frame),figure=config.figure,[minX,minY,width,height]=figure.bounds;
 const port=useRef<HTMLDivElement>(null),manual=useRef(false);
 useLayoutEffect(()=>{manual.current=false;},[replay]);
 useLayoutEffect(()=>{
  const p=port.current;if(!p)return;
  const center=()=>{if(manual.current)return;const content=p.firstElementChild as HTMLElement|null;if(content){const cr=content.getBoundingClientRect(),pr=p.getBoundingClientRect();p.scrollLeft+=cr.left+(figure.initialFocusX-minX)/width*content.clientWidth-pr.left-p.clientWidth/2;}};
  center();const observer=typeof ResizeObserver==='undefined'?null:new ResizeObserver(center);observer?.observe(p);return()=>observer?.disconnect();
 },[replay,figure,minX,width]);
 const labels=teaching.blocks.filter(b=>b.role==='label'&&b.visible&&b.state).sort((a,b)=>{
  const row=Math.round(a.state!.baseline/200)-Math.round(b.state!.baseline/200);return row||a.state!.x-b.state!.x;
 });
 return <div className="g4l4-column"><style>{CSS}</style><div className="lesson-text-presentation" lang="en"><div className="lesson-text-presentation__layout">
  <h2 className="lesson-text-presentation__block lesson-text-presentation__block--title" data-lesson-text-block={headingBlockId}>{heading??teaching.blocks[0].text}</h2>{children}
  <div ref={port} className="g4l4-column__port" role="region" aria-label={figure.label} tabIndex={0} onPointerDown={()=>{manual.current=true;}} onWheel={()=>{manual.current=true;}} onKeyDown={e=>{
   if(e.target!==e.currentTarget||e.altKey||e.ctrlKey||e.metaKey||e.shiftKey||!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
   e.preventDefault();manual.current=true;const p=e.currentTarget;p.scrollLeft=e.key==='Home'?0:e.key==='End'?p.scrollWidth:p.scrollLeft+(e.key==='ArrowRight'?1:-1)*(keyboardScrollStep??figure.keyboardScrollStep??Math.max(44,p.clientWidth/2));
  }}>
   <div className="g4l4-column__figure" style={{inlineSize:width/figure.unitsPerEm[0]+'em',blockSize:height/figure.unitsPerEm[1]+'em'}}>
    {figure.placements.map(p=>{
     const v=valueAt(p.states,frame,null);if(!v||v.alpha<=0)return null;
     const shape=figure.shapes.find(s=>s.character===v.character)!;
     return <svg key={p.depth} className="g4l4-column__geometry" aria-hidden="true" focusable="false" viewBox={figure.bounds.join(' ')} preserveAspectRatio="none" style={{zIndex:p.depth}} data-source-depth={p.depth} data-source-shape={v.character} data-source-ratio={v.ratio}>
      {shape.gradients&&<defs>{shape.gradients.map(gradient=><linearGradient key={gradient.id} id={gradient.id} gradientUnits="userSpaceOnUse" x1={-16384} y1={0} x2={16384} y2={0} gradientTransform={`matrix(${gradient.matrix.join(' ')})`}>{gradient.stops.map((stop,i)=><stop key={i} offset={stop.offset} stopColor={stop.color}/>)}</linearGradient>)}</defs>}
      <g opacity={v.alpha} transform={`matrix(${v.matrix.join(' ')})`}>{getColumnShapePaths(shape,v.ratio).map((path,i)=><path key={i} d={path.d} fill={path.fill} stroke={path.stroke} strokeWidth={path.width} strokeLinecap="round" strokeLinejoin="round"/>)}</g>
     </svg>;
    })}
    {labels.map(b=>{const s=b.state!;return <span key={b.id} className="g4l4-column__label" data-lesson-text-block={b.id} data-source-instances={b.sourceInstances.join(',')} data-source-shapes={b.sourceShapeIds.join(',')} data-source-depth={s.depth} data-source-baseline={s.baseline} style={{left:100*(s.x-minX)/width+'%',top:100*(s.baseline-minY)/height+'%',opacity:s.alpha,color:s.color,fontSize:b.fontScale?b.fontScale+'em':undefined,WebkitTextStroke:s.stroke?'1.2px '+s.stroke:undefined,paintOrder:'stroke fill',zIndex:s.depth}}>{renderLabel?renderLabel(b):b.text}</span>;})}
   </div>
  </div>{after}
 </div></div></div>;
}

export function createColumnArithmeticPresentation(config:ColumnArithmeticConfig,getFrameState:(frame:number,context:RuntimeContext)=>SourceStaticCanvasFrameState,FallbackRenderer:React.ComponentType<AnimationRendererProps>):LessonTextPresentationCapability<SourceStaticCanvasFrameState> {
 validateLessonTextBinding(config.binding);
 const getSnapshot=(state:SourceStaticCanvasFrameState,context:RuntimeContext)=>getColumnTextSnapshot(config,state,context);
 function Renderer(props:AnimationRendererProps) {
  const context={...props,frameDomain:props.frameDomain??config.frameDomain},state=(props.state??getFrameState(props.frame,context))as SourceStaticCanvasFrameState;
  if(getSnapshot(state,context).status!=='ready')return <FallbackRenderer {...props} state={state}/>;
  return <div data-modern-text-page={config.animationId} data-lesson-frame={state.frame} data-lesson-replay={props.replay??0} data-flash-frame-domain={state.frameDomain} data-flash-root-frame={state.rootFrame}><ColumnArithmeticScene key={props.replay??0} config={config} frame={state.frame} replay={props.replay}/></div>;
 }
 return {schemaVersion:1,binding:config.binding,Renderer,getSnapshot,playbackMode:'once',playbackEndFrameByDomain:{[config.frameDomain]:config.frameCount},reducedMotionFrameByDomain:{[config.frameDomain]:config.frameCount},sourceTimelineAudioCues:config.sourceAudio};
}
