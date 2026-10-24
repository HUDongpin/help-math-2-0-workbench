'use client';

import React, {useLayoutEffect, useRef} from 'react';
import type {AnimationRendererProps, AudioCue, RuntimeContext} from '../contract';
import type {LessonTextBinding, LessonTextPresentationCapability, TextPresentationSnapshot} from '../lesson-text-contract';
import type {SourceStaticCanvasFrameState} from '../source-static-canvas-candidate';
import {validateLessonTextBinding} from '../lesson-text-snapshot';
import {LESSON_MANUAL_NARRATION_PCM} from '../generated/lesson-manual-narration-pcm';
import {numberLineValue as at} from './g4-l4-number-line';

type Curve<T> = readonly (readonly [number, T])[];
type Paint = Readonly<{text:string;color:string}>;
type State = Readonly<{alpha:number;parts:readonly Paint[];emphasis:boolean;sourceCharacters:readonly number[];sourceInstances:readonly string[]}>;
type SourceText = Readonly<{id:string;text:string;sourceCharacters:readonly number[];sourceTextIds:readonly string[];states:Curve<State|null>}>;
type Term = Readonly<{button:number;key:string;entryId:string;block:string;activeFrames:readonly (readonly [number,number])[]}>;
type GlyphEmphasis = Readonly<{sourceCharacter:number;glyphIndex:number;activeFrames:readonly (readonly [number,number])[]}>;
type Expression = SourceText & Readonly<{glyphEmphasis:readonly GlyphEmphasis[]}>;

export interface OrderOperationsConfig {
 readonly animationId:string;readonly placementId:string;readonly sourceSwfSha256:string;
 readonly frameDomain:string;readonly frameCount:number;readonly rootFrame:6;readonly fps:12;
 readonly title:string;readonly binding:LessonTextBinding;
 readonly table:readonly (SourceText & Readonly<{row:number;column:number}>)[];
 readonly expressions:readonly Readonly<{id:string;pieces:readonly Expression[];annotation:SourceText|null}>[];
 readonly terms:readonly Term[];
 readonly sourceAudio:readonly (AudioCue & {readonly sha256:string})[];
 readonly keyTerms:Readonly<{indexLanguage:'en';sourceAssetId:string;sourceSha256:string;entryIds:readonly string[]}>;
}

export function orderOperationTermActive(term:Term,frame:number){return term.activeFrames.some(([first,last])=>first<=frame&&frame<last);}
export function getOrderOperationsState(c:OrderOperationsConfig,frame:number){
 const bounded=Math.max(1,Math.min(c.frameCount,Math.floor(Number.isFinite(frame)?frame:1)));
 const text=<T extends SourceText>(b:T)=>({...b,state:at(b.states,bounded,null),visible:(at(b.states,bounded,null)?.alpha??0)>0});
 return {frame:bounded,table:c.table.map(text),expressions:c.expressions.map(row=>({...row,pieces:row.pieces.map(piece=>({...text(piece),glyphEmphasis:piece.glyphEmphasis.filter(e=>e.activeFrames.some(([first,last])=>first<=bounded&&bounded<last))})),annotation:row.annotation?text(row.annotation):null}))};
}

export function getOrderOperationsSnapshot(c:OrderOperationsConfig,s:SourceStaticCanvasFrameState,r:RuntimeContext):TextPresentationSnapshot{
 const blockers:string[]=[];
 if(s.animationId!==c.animationId||s.sourceSwfSha256!==c.sourceSwfSha256)blockers.push('source-identity-mismatch');
 if(s.status!=='ready')blockers.push(s.blocker??'source-state-not-ready');
 if(s.frameDomain!==c.frameDomain||(r.frameDomain??c.frameDomain)!==c.frameDomain)blockers.push('unsupported-frame-domain');
 if(s.rootFrame!==6||(r.rootFrame!==undefined&&r.rootFrame!==6))blockers.push('unsupported-root-context');
 if(s.scenario!=='source-static-frame'||r.scenario!==s.scenario)blockers.push('unsupported-scenario');
 if(s.language!=='en'||r.lang!=='en')blockers.push('spanish-text-not-source-verified');
 if(!Number.isInteger(r.frame)||r.frame<1||r.frame>c.frameCount||s.frame!==r.frame)blockers.push('source-frame-mismatch');
 if(s.seed!==(r.seed>>>0))blockers.push('source-seed-mismatch');
 if(r.entryStateSha256)blockers.push('capture-uses-source-canvas');
 const t=getOrderOperationsState(c,s.frame),values=new Map<string,{text:string;visible:boolean}>([['root-title',{text:c.title,visible:true}]]);
 for(const b of [...t.table,...t.expressions.flatMap(row=>[...row.pieces,...(row.annotation?[row.annotation]:[])])])values.set(b.id,{text:b.visible?b.text:'',visible:b.visible});
 return {schemaVersion:1,animationId:c.animationId,bindingVersion:c.binding.version,sourceSwfSha256:c.sourceSwfSha256,status:blockers.length?'blocked':'ready',blockers,identity:{frame:s.frame,frameDomain:s.frameDomain,rootFrame:s.rootFrame,scenario:s.scenario,language:s.language,seed:s.seed,replay:r.replay??0},suppressedInstances:[],blocks:blockers.length?[]:c.binding.blocks.map(b=>({...values.get(b.id)!,id:b.id,role:b.role,language:b.language,readingOrder:b.readingOrder}))};
}

const CSS=`
.g4l8-operations{inline-size:100%;min-inline-size:0;box-sizing:border-box;background:#fffdf7;padding:.8rem;color:#17273c}
.g4l8-operations *{box-sizing:border-box}
.g4l8-operations .lesson-text-presentation__block--title{overflow-wrap:anywhere;word-break:normal;hyphens:none}
.g4l8-operations__content{display:flex;flex-wrap:wrap;align-items:flex-start;gap:1.2rem;min-inline-size:0}
.g4l8-operations__port{min-inline-size:0;max-inline-size:100%;overflow-x:auto;padding:.4rem;overscroll-behavior-inline:contain;font:1.125rem/1.5 var(--lesson-font-body,system-ui,sans-serif)}
.g4l8-operations__port:focus-visible{outline:3px solid #1556a0;outline-offset:2px}
.g4l8-operations__table-port{flex:1 1 28rem}
.g4l8-operations__table{border-collapse:collapse;inline-size:100%;min-inline-size:25em;table-layout:auto;background:white}
.g4l8-operations__table th,.g4l8-operations__table td{padding:.35em .5em;border:1px solid #28394d;text-align:start;vertical-align:middle;font-weight:400;height:3.15em}
.g4l8-operations__table th{font-weight:600}
.g4l8-operations__table th:nth-child(2){min-inline-size:12em}
.g4l8-operations__table td:nth-child(3){text-align:center;font-variant-numeric:tabular-nums}
.g4l8-operations__source-text{white-space:pre;transition:none!important}
.g4l8-operations__emphasis{background:#160bf4;border-radius:.12em;outline:2px solid #160bf4;outline-offset:.06em;color:white}
.g4l8-operations button{font:inherit;line-height:inherit;min-inline-size:44px;min-block-size:44px;padding:0;border:0;background:transparent;color:inherit;text-decoration:underline;text-decoration-thickness:2px;text-underline-offset:.15em;cursor:pointer}
.g4l8-operations button:disabled{cursor:default}
.g4l8-operations button:focus-visible{outline:3px solid #1556a0;outline-offset:3px;border-radius:.2em}
.g4l8-operations__math-port{flex:1 1 27rem}
.g4l8-operations__examples{min-inline-size:max-content;display:grid;gap:.7em;font-variant-numeric:tabular-nums}
.g4l8-operations__equation-row{display:grid;grid-template-columns:minmax(15em,max-content) minmax(8em,max-content);align-items:center;gap:1em;padding:.45em .5em;border:1px solid #28394d;background:white;min-block-size:3.15em}
.g4l8-operations__equation{display:flex;align-items:baseline;white-space:pre;gap:.24em}
.g4l8-operations__piece{white-space:pre;transition:none!important}
.g4l8-operations__glyph{display:inline;transition:none!important}
@media(max-width:480px){.g4l8-operations{padding-inline:.25rem}}
`;

function SourceScrollPort({label,replay,className,children}:{label:string;replay:number;className:string;children:React.ReactNode}){
 const port=useRef<HTMLDivElement>(null);
 useLayoutEffect(()=>{if(port.current)port.current.scrollLeft=0;},[replay]);
 return <div ref={port} className={'g4l8-operations__port '+className} role="region" aria-label={label} tabIndex={0} onKeyDown={e=>{
  if(e.target!==e.currentTarget||e.altKey||e.ctrlKey||e.metaKey||e.shiftKey||!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
  e.preventDefault();const p=e.currentTarget;p.scrollLeft=e.key==='Home'?0:e.key==='End'?p.scrollWidth:p.scrollLeft+(e.key==='ArrowRight'?1:-1)*Math.max(44,p.clientWidth/2);
 }}>{children}</div>;
}

export function OrderOperationsScene({config:c,frame,replay=0,onOpenKeyTerm}:{config:OrderOperationsConfig;frame:number;replay?:number;onOpenKeyTerm?:(term:Term,trigger:HTMLButtonElement)=>void}){
 const teaching=getOrderOperationsState(c,frame);
 function text(b:ReturnType<typeof getOrderOperationsState>['table'][number]){
  const term=c.terms.find(t=>t.block===b.id),state=b.state,paint=<>{state?.parts.map((part,i)=><span key={i} style={{color:part.color}}>{part.text}</span>)??b.text}</>;
  return <span className={'g4l8-operations__source-text'+(state?.emphasis?' g4l8-operations__emphasis':'')} data-lesson-text-block={b.id} data-source-characters={b.sourceCharacters.join(',')} data-source-instances={state?.sourceInstances.join(',')} aria-hidden={!b.visible} style={{opacity:state?.alpha??0,visibility:b.visible?'visible':'hidden'}}>{term?<button type="button" data-source-button={term.button} data-source-keyterm={term.key} data-keyterm-entry-id={term.entryId} disabled={!b.visible||!onOpenKeyTerm||!orderOperationTermActive(term,frame)} onClick={e=>{if(b.visible&&orderOperationTermActive(term,frame))onOpenKeyTerm?.(term,e.currentTarget);}}>{paint}</button>:paint}</span>;
 }
 return <div className="g4l8-operations"><style>{CSS}</style><div className="lesson-text-presentation" lang="en"><div className="lesson-text-presentation__layout">
  <h2 className="lesson-text-presentation__block lesson-text-presentation__block--title" data-lesson-text-block="root-title">{c.title}</h2>
  <div className="g4l8-operations__content">
   <SourceScrollPort label="Order of operations reminder table" replay={replay} className="g4l8-operations__table-port"><table className="g4l8-operations__table" aria-label="Order of operations reminder">
    <thead><tr>{[0,1,2].map(column=>{const b=teaching.table.find(b=>b.row===0&&b.column===column)!;return <th key={column} scope="col">{text(b)}</th>;})}</tr></thead>
    <tbody>{[1,2,3,4,5,6].map(row=><tr key={row}>{[0,1,2].map(column=>{const b=teaching.table.find(b=>b.row===row&&b.column===column);return <td key={column}>{b?text(b):null}</td>;})}</tr>)}</tbody>
   </table></SourceScrollPort>
   {teaching.expressions.length>0&&<SourceScrollPort label="Worked mathematical expression" replay={replay} className="g4l8-operations__math-port"><div className="g4l8-operations__examples">
    {teaching.expressions.map(row=>{
     const visible=row.pieces.some(p=>p.visible)||Boolean(row.annotation?.visible);
     return <div key={row.id} className="g4l8-operations__equation-row" data-source-equation-row={row.id} aria-hidden={!visible} style={{visibility:visible?'visible':'hidden'}}>
      <div className="g4l8-operations__equation">{row.pieces.map(piece=><span key={piece.id} className="g4l8-operations__piece" data-lesson-text-block={piece.id} data-source-characters={piece.sourceCharacters.join(',')} data-source-instances={piece.state?.sourceInstances.join(',')} aria-hidden={!piece.visible} style={{opacity:piece.state?.alpha??0,visibility:piece.visible?'visible':'hidden'}}>{Array.from(piece.text).map((char,index)=>{
       const emphasis=piece.glyphEmphasis.find(e=>e.glyphIndex===index);return <span key={index} className={'g4l8-operations__glyph'+(emphasis?' g4l8-operations__emphasis':'')} data-native-math-glyph={index} data-source-emphasis-character={emphasis?.sourceCharacter} style={{color:emphasis?'white':piece.state?.parts[0]?.color}}>{char}</span>;
      })}</span>)}</div>
      {row.annotation?<span className="g4l8-operations__source-text" data-lesson-text-block={row.annotation.id} data-source-characters={row.annotation.sourceCharacters.join(',')} data-source-instances={row.annotation.state?.sourceInstances.join(',')} aria-hidden={!row.annotation.visible} style={{opacity:row.annotation.state?.alpha??0,visibility:row.annotation.visible?'visible':'hidden',color:row.annotation.state?.parts[0]?.color}}>{row.annotation.text}</span>:<span/>}
     </div>;
    })}
   </div></SourceScrollPort>}
  </div>
 </div></div></div>;
}

export function createOrderOperationsPresentation(c:OrderOperationsConfig,getFrameState:(frame:number,r:RuntimeContext)=>SourceStaticCanvasFrameState,Fallback:React.ComponentType<AnimationRendererProps>):LessonTextPresentationCapability<SourceStaticCanvasFrameState>{
 validateLessonTextBinding(c.binding);
 const cue=c.sourceAudio[0],pcm=cue?LESSON_MANUAL_NARRATION_PCM[cue.sha256]:undefined;
 if(c.sourceAudio.length!==1||!cue||!pcm)throw Error('Missing own finite source PCM for modern endpoint');
 function Renderer(r:AnimationRendererProps){
  const context={...r,frameDomain:r.frameDomain??c.frameDomain},source=(r.state??getFrameState(r.frame,context))as SourceStaticCanvasFrameState;
  if(getOrderOperationsSnapshot(c,source,context).status!=='ready')return <Fallback {...r} state={source}/>;
  return <div data-modern-text-page={c.animationId} data-lesson-frame={source.frame} data-lesson-replay={r.replay??0} data-flash-frame-domain={source.frameDomain} data-flash-root-frame={source.rootFrame}><OrderOperationsScene key={r.replay??0} config={c} frame={source.frame} replay={r.replay} onOpenKeyTerm={r.onLessonHostRequest?(term,trigger)=>r.onLessonHostRequest?.({type:'open-keyterm',entryId:term.entryId,sourceAnimationId:c.animationId,playbackDisposition:'source-stop-timeline-and-audio-until-explicit-resume'},{trigger,keyTermIndexLanguage:'en'}):undefined}/></div>;
 }
 return {schemaVersion:1,binding:c.binding,Renderer,getSnapshot:(s,r)=>getOrderOperationsSnapshot(c,s,r),playbackMode:'once',playbackEndFrameByDomain:{[c.frameDomain]:c.frameCount},reducedMotionFrameByDomain:{[c.frameDomain]:c.frameCount},sourceTimelineAudioCues:c.sourceAudio,terminalTimelineAudio:{frameDomain:c.frameDomain,holdFrame:c.frameCount,endFrameExclusive:c.frameCount+1,cueId:cue.id,sourceSha256:cue.sha256,pcmSha256:pcm.sha256,allowClockDriftTail:true},keyTerms:c.keyTerms};
}
