'use client';

import React,{useLayoutEffect,useRef} from 'react';
import type {AnimationRendererProps,AudioCue,RuntimeContext} from '../contract';
import type {LessonTextBinding,LessonTextPresentationCapability,TextPresentationSnapshot} from '../lesson-text-contract';
import type {SourceStaticCanvasFrameState} from '../source-static-canvas-candidate';
import {validateLessonTextBinding} from '../lesson-text-snapshot';

type Curve<T> = readonly (readonly [number,T])[];
type Token = Readonly<{text:string;alpha:Curve<number>;sourceTextIds:readonly string[];sourceInstances:readonly string[];color?:Curve<string>;stroke?:Curve<string|null>}>;
type Block = Readonly<{id:string;role:'title'|'body'|'label';tokens:readonly Token[]}>;
type Term = Readonly<{button:number;key:string;block:string;tokens:readonly number[];entryId:string;sourceInstance:string;firstFrame:number;lastFrameExclusive:number}>;
type Placement = Readonly<{character:number;matrix:readonly number[];alpha:number;ratio:number|null;clipDepth:number|null}>;
type Path = Readonly<{d:string;fill:string;stroke:string;width:number}>;
type Shape = Readonly<{character:number;paths:readonly Path[];morph?:readonly (readonly (readonly number[])[])[];stroke?:string;width?:number}>;
type Figure = Readonly<{bounds:readonly number[];boundsByFrame?:Curve<readonly number[]>;widthEm:number;originX:number;axisValues:readonly number[];labels:readonly Readonly<{block:string;position:Curve<readonly number[]>;sourceDepths:readonly number[]}>[];shapes:readonly Shape[];placements:readonly Readonly<{depth:number;states:Curve<Placement|null>}>[];mask:Curve<readonly number[]|null>;maskedDepths:readonly number[]}>;
export interface NumberLineConfig {
 readonly animationId:string;readonly placementId:string;readonly sourceSwfSha256:string;
 readonly rootFrame:6;readonly frameDomain:string;readonly frameCount:number;readonly fps:12;readonly holdFrame:number|null;
 readonly blocks:readonly Block[];readonly graph:Figure;readonly equation:readonly string[];readonly terms:readonly Term[];
 readonly binding:LessonTextBinding;readonly sourceAudio:readonly (AudioCue&{readonly sha256:string})[];
 readonly keyTerms:Readonly<{indexLanguage:'en';sourceAssetId:string;sourceSha256:string;entryIds:readonly string[]}>;
}
export function numberLineValue<T>(curve:Curve<T>,frame:number,fallback:T):T{let value=fallback;for(const [first,v]of curve){if(first>frame)break;value=v;}return value;}
export function getNumberLineTeachingState(config:NumberLineConfig,requestedFrame:number){
 const frame=Math.max(1,Math.min(config.frameCount,Math.floor(Number.isFinite(requestedFrame)?requestedFrame:1)));
 return{frame,atHold:config.holdFrame===frame,blocks:config.blocks.map(b=>{const tokens=b.tokens.map(t=>({...t,alpha:numberLineValue(t.alpha,frame,0)}));return{...b,tokens,text:tokens.filter(t=>t.alpha>0).map(t=>t.text).join(''),visible:tokens.some(t=>t.alpha>0)};})};
}
export function getNumberLineTextSnapshot(config:NumberLineConfig,state:SourceStaticCanvasFrameState,context:RuntimeContext):TextPresentationSnapshot{
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
 const teaching=getNumberLineTeachingState(config,state.frame);
 return{schemaVersion:1,animationId:config.animationId,bindingVersion:config.binding.version,sourceSwfSha256:config.sourceSwfSha256,status:blockers.length?'blocked':'ready',blockers,
 identity:{frame:state.frame,frameDomain:state.frameDomain,rootFrame:state.rootFrame,scenario:state.scenario,language:state.language,seed:state.seed,replay:context.replay??0},suppressedInstances:[],blocks:blockers.length?[]:config.binding.blocks.map(b=>{const t=teaching.blocks.find(t=>t.id===b.id)!;return{id:b.id,text:t.text,visible:t.visible,role:b.role,language:b.language,readingOrder:b.readingOrder};})};
}
export function requestNumberLineContinuation(config:NumberLineConfig,props:AnimationRendererProps){
 if(config.holdFrame===null||props.frame!==config.holdFrame||props.paused||props.lang!=='en'||props.scenario!=='source-static-frame'||props.entryStateSha256||(props.frameDomain??config.frameDomain)!==config.frameDomain||(props.rootFrame!==undefined&&props.rootFrame!==6))return false;
 return props.onLessonFrameRequest?.({fromFrame:config.holdFrame,toFrame:config.holdFrame+1,stopFrame:config.frameCount})===true;
}
const CSS=`
.g4l4-number-line{inline-size:100%;min-inline-size:0;background:#fffdf7;padding:.8rem;box-sizing:border-box}
.g4l4-number-line *{box-sizing:border-box}.g4l4-number-line p{margin:0}
.g4l4-number-line .lesson-text-presentation__block--title{overflow-wrap:normal;word-break:normal;hyphens:none}
.g4l4-number-line__definition{background:white;border-radius:.5rem;padding:.6rem}
.g4l4-number-line__token{display:inline-block;white-space:pre;transition:none!important;font-variant-numeric:tabular-nums}
.g4l4-number-line [data-lesson-text-block='root-title'] .g4l4-number-line__token{display:inline;white-space:normal}
.g4l4-number-line__term{display:inline-block;min-inline-size:44px;min-block-size:44px;border:0;border-radius:.2rem;padding:0;background:transparent;color:#1556a0;font:inherit;text-decoration:underline;text-decoration-thickness:2px;text-underline-offset:.15em;white-space:nowrap;cursor:pointer}
.g4l4-number-line__term .g4l4-number-line__token{text-decoration:underline;text-decoration-thickness:2px;text-underline-offset:.15em}
.g4l4-number-line__term:disabled{color:inherit;cursor:default}
.g4l4-number-line__term:focus-visible,.g4l4-number-line__port:focus-visible,.g4l4-number-line__continue:focus-visible{outline:3px solid #1556a0;outline-offset:3px}
.g4l4-number-line__port{max-inline-size:100%;min-inline-size:0;overflow-x:auto;padding:.6rem .35rem;overscroll-behavior-inline:contain}
.g4l4-number-line__figure{position:relative;font-size:1.125rem;line-height:1.2;margin-inline:auto}
.g4l4-number-line__geometry{position:absolute;inset:0;inline-size:100%;block-size:100%;pointer-events:none}
.g4l4-number-line__label{position:absolute;transform:translate(-50%,-50%);white-space:nowrap;line-height:1.2}
.g4l4-number-line__label:has(button){pointer-events:auto}
.g4l4-number-line__continue{position:absolute;transform:translateY(-50%);block-size:44px;border:0;background:transparent;cursor:pointer;font:inherit;border-radius:.25rem}
.g4l4-number-line__continue:disabled{cursor:default;pointer-events:none}
.g4l4-number-line__continue:hover:enabled{background:rgba(21,86,160,.08)}
.g4l4-number-line__equation{display:flex;justify-content:center;gap:.45em;min-block-size:1.5em;font-size:1.375rem;line-height:1.4;white-space:nowrap}
@media(max-width:480px){.g4l4-number-line{padding-inline:0}.g4l4-number-line__definition{padding-inline:.3rem}
 .lesson-shell2 .lesson-shell2__legacy-stage:has(.runtime-shell[data-lesson-presentation='modern-text-v1'] .g4l4-number-line){width:calc(100vw - 8px);max-width:none;margin-inline:calc((100% - 100vw + 8px)/2)}
 .lesson-shell2 .lesson-shell2__legacy-stage:has(.runtime-shell[data-lesson-presentation='modern-text-v1'] .g4l4-number-line)>.lesson-shell2__stage{padding-inline:2px}}
`;
function sourceShape(shape:Shape,placement:Placement){
 if(shape.morph){const ratio=(placement.ratio??0)/65535;const points=shape.morph[0].map((p,i)=>p.map((v,j)=>v+(shape.morph![1][i][j]-v)*ratio));return<path d={`M ${points[0].join(' ')} L ${points[1].join(' ')}`} fill="none" stroke={shape.stroke} strokeWidth={shape.width}/>;}
 return shape.paths.map((p,i)=><path key={i} d={p.d} fill={p.fill} stroke={p.stroke} strokeWidth={p.width} strokeLinecap="round" strokeLinejoin="round"/>);
}
export function NumberLineScene({config,frame,replay=0,onOpenKeyTerm,onContinue,paused=false}:{config:NumberLineConfig;frame:number;replay?:number;paused?:boolean;onOpenKeyTerm?:(term:Term,trigger:HTMLButtonElement)=>void;onContinue?:()=>void}){
 const teaching=getNumberLineTeachingState(config,frame),graph=config.graph,port=useRef<HTMLDivElement>(null),manual=useRef(false),figureBounds=numberLineValue(graph.boundsByFrame??[],frame,graph.bounds),[minX,minY,width,height]=figureBounds;
 const block=(id:string)=>teaching.blocks.find(b=>b.id===id)!;
 const figurePresent=graph.placements.some(p=>(numberLineValue(p.states,frame,null)?.alpha??0)>0);
 useLayoutEffect(()=>{manual.current=false;},[replay]);
 useLayoutEffect(()=>{const p=port.current;if(!p||!figurePresent)return;const center=()=>{if(manual.current)return;const content=p.firstElementChild as HTMLElement|null;if(content){const cr=content.getBoundingClientRect(),pr=p.getBoundingClientRect();p.scrollLeft+=cr.left+(graph.originX-minX)/width*content.clientWidth-pr.left-p.clientWidth/2;}};center();const observer=typeof ResizeObserver==='undefined'?null:new ResizeObserver(center);observer?.observe(p);return()=>observer?.disconnect();},[figurePresent,replay,graph,minX,width]);
 const tokenNode=(id:string,index:number)=>{const t=block(id).tokens[index];return<span key={index} className="g4l4-number-line__token" data-source-token={index} data-source-instances={t.sourceInstances.join(',')} aria-hidden={t.alpha===0||undefined} style={{opacity:t.alpha,visibility:t.alpha>0?'visible':'hidden',...(t.color?{color:numberLineValue(t.color,frame,'black')}:{}),...(t.stroke?{WebkitTextStroke:numberLineValue(t.stroke,frame,null)??undefined}: {})}}>{t.text}</span>;};
 const content=(id:string,reserve=false)=>block(id).tokens.map((t,i)=>{
  const term=config.terms.find(t=>t.block===id&&t.tokens.includes(i));if(term&&term.tokens[0]!==i)return null;
  if(term){const visible=term.tokens.some(n=>block(id).tokens[n].alpha>0);if(!visible&&!reserve)return null;return<button key={i} type="button" className="g4l4-number-line__term" data-source-button={term.button} data-source-keyterm={term.key} data-keyterm-entry-id={term.entryId} disabled={!onOpenKeyTerm||!visible||term.tokens.some(n=>block(id).tokens[n].alpha===0)||frame<term.firstFrame||frame>=term.lastFrameExclusive} style={{visibility:visible?'visible':'hidden'}} onClick={e=>onOpenKeyTerm?.(term,e.currentTarget)}>{term.tokens.map(n=>tokenNode(id,n))}</button>;}
  return t.alpha>0||reserve?tokenNode(id,i):null;
 });
 const mask=numberLineValue(graph.mask,frame,null),maskId='number-line-mask-'+config.animationId;
 const px=(x:number)=>100*(x-minX)/width+'%',py=(y:number)=>100*(y-minY)/height+'%';
 return<div className="g4l4-number-line"><style>{CSS}</style><div className="lesson-text-presentation" lang="en"><div className="lesson-text-presentation__layout">
  <h2 className="lesson-text-presentation__block lesson-text-presentation__block--title" data-lesson-text-block="root-title">{content('root-title')}</h2>
  {block('definition')?.visible&&<p className="g4l4-number-line__definition lesson-text-presentation__block lesson-text-presentation__block--body" data-lesson-text-block="definition">{content('definition')}</p>}
  {config.equation.length>0&&<div className="g4l4-number-line__equation" aria-label="Example equation">{config.equation.map(id=><span key={id} data-lesson-text-block={id}>{content(id,true)}</span>)}</div>}
  {figurePresent&&<div ref={port} className="g4l4-number-line__port" role="region" aria-label={`Number line from ${graph.axisValues[0]} to ${graph.axisValues.at(-1)}`} tabIndex={0} onPointerDown={()=>{manual.current=true;}} onWheel={()=>{manual.current=true;}} onKeyDown={e=>{if(e.target!==e.currentTarget||e.altKey||e.ctrlKey||e.metaKey||e.shiftKey||!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();manual.current=true;const p=e.currentTarget;p.scrollLeft=e.key==='Home'?0:e.key==='End'?p.scrollWidth:p.scrollLeft+(e.key==='ArrowRight'?1:-1)*Math.max(44,p.clientWidth/2);}}>
   <div className="g4l4-number-line__figure" data-source-axis-values={graph.axisValues.join(',')} style={{inlineSize:graph.widthEm+'em',blockSize:graph.widthEm*height/width+'em'}}>
    <svg className="g4l4-number-line__geometry" aria-hidden="true" focusable="false" viewBox={figureBounds.join(' ')}>
     {mask&&<defs><clipPath id={maskId}><rect x={mask[0]} y={mask[1]} width={mask[2]} height={mask[3]}/></clipPath></defs>}
     {graph.placements.map(p=>{const v=numberLineValue(p.states,frame,null);if(!v||!v.alpha)return null;const shape=graph.shapes.find(s=>s.character===v.character);if(!shape)return null;const masked=graph.maskedDepths.includes(p.depth);if(masked&&!mask)return null;return<g key={p.depth} data-source-depth={p.depth} data-source-shape={v.character} clipPath={masked?`url(#${maskId})`:undefined}><g opacity={v.alpha} transform={`matrix(${v.matrix.join(' ')})`}>{sourceShape(shape,v)}</g></g>;})}
    </svg>
    {graph.labels.map(label=>{if(!block(label.block).visible)return null;const pos=numberLineValue(label.position,frame,[0,0]);return<span key={label.block} className="g4l4-number-line__label" data-lesson-text-block={label.block} data-source-depths={label.sourceDepths.join(',')} data-axis-value={label.block.startsWith('tick-')?label.block.slice(5):undefined} style={{left:px(pos[0]),top:py(pos[1])}}>{content(label.block,true)}</span>;})}
    {config.holdFrame!==null&&<button type="button" className="g4l4-number-line__continue" aria-label={config.equation[0]==='equation-11'?'Number line: show addition example':'Number line: show subtraction example'} data-number-line-continue data-source-hit-sprite={config.holdFrame===103?32:33} style={{left:px(-6125),top:py(75),width:100*12729/width+'%'}} disabled={!teaching.atHold||paused||!onContinue} onClick={onContinue}/>}
   </div>
  </div>}
 </div></div></div>;
}
export function createNumberLinePresentation(config:NumberLineConfig,getFrameState:(frame:number,context:RuntimeContext)=>SourceStaticCanvasFrameState,FallbackRenderer:React.ComponentType<AnimationRendererProps>):LessonTextPresentationCapability<SourceStaticCanvasFrameState>{
 validateLessonTextBinding(config.binding);const getSnapshot=(state:SourceStaticCanvasFrameState,context:RuntimeContext)=>getNumberLineTextSnapshot(config,state,context);
 function Renderer(props:AnimationRendererProps){
  const context={...props,frameDomain:props.frameDomain??config.frameDomain},state=(props.state??getFrameState(props.frame,context))as SourceStaticCanvasFrameState;
  const epoch=`${props.seed}:${props.replay??0}:${props.frame}`,last=useRef({epoch,requested:false});if(last.current.epoch!==epoch)last.current={epoch,requested:false};
  if(getSnapshot(state,context).status!=='ready')return<FallbackRenderer {...props} state={state}/>;
  return<div data-modern-text-page={config.animationId} data-lesson-frame={state.frame} data-lesson-replay={props.replay??0} data-flash-frame-domain={state.frameDomain} data-flash-root-frame={state.rootFrame}>
   <NumberLineScene key={props.replay??0} config={config} frame={state.frame} replay={props.replay} paused={Boolean(props.paused)} onContinue={props.onLessonFrameRequest?()=>{if(last.current.requested)return;if(requestNumberLineContinuation(config,props))last.current.requested=true;}:undefined} onOpenKeyTerm={props.onLessonHostRequest?(term,trigger)=>props.onLessonHostRequest?.({type:'open-keyterm',entryId:term.entryId,sourceAnimationId:config.animationId,playbackDisposition:'source-stop-timeline-and-audio-until-explicit-resume'},{trigger,keyTermIndexLanguage:'en'}):undefined}/>
  </div>;
 }
 return{schemaVersion:1,binding:config.binding,Renderer,getSnapshot,playbackMode:'once',playbackEndFrameByDomain:{[config.frameDomain]:config.holdFrame??config.frameCount},reducedMotionFrameByDomain:{[config.frameDomain]:config.holdFrame??config.frameCount},...(config.holdFrame!==null?{frameControl:{frameDomain:config.frameDomain,completionFrame:config.frameCount,transitions:[{fromFrame:config.holdFrame,toFrame:config.holdFrame+1,stopFrame:config.frameCount}]}}:{}),sourceTimelineAudioCues:config.sourceAudio,...(config.terms.length?{keyTerms:config.keyTerms}:{})};
}
