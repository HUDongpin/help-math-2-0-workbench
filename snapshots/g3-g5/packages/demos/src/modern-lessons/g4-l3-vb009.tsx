'use client';

// VB009 is a source mask reveal, not a number-line or quiz consumer.
// Only the retained host supplies teaching frames, pause, Replay and audio.
import React, {useLayoutEffect, useRef} from 'react';
import type {AnimationRendererProps, AudioCue, RuntimeContext} from '../contract';
import type {LessonTextBinding, LessonTextPresentationCapability, TextPresentationSnapshot} from '../lesson-text-contract';
import {validateLessonTextBinding} from '../lesson-text-snapshot';
import type {SourceStaticCanvasFrameState} from '../source-static-canvas-candidate';
import {getCourseG04L03Vb009FrameState} from '../timelines/course-g04-l03-vb-009';
import {G4_L3_VB009_NATIVE_CONFIG} from './generated/g4-l3-vb009-native-config';

type Token = Readonly<{text:string;core:string;suffix:string;frame:number|null;thresholdKind:'complete-horizontal-ink'|'partial-only-horizontal-ink'|'never-intersects-horizontal-mask';keyAttribute?:string;termText?:string;punctuation?:string}>;
type Body = Readonly<{id:string;kind:'body'|'numbers'|'letters'|'pictures';text:string;sourceCharacter:number;sourceInstance:string;firstFrame:number;lastFrameExclusive:number;tokens:readonly Token[]}>;
type Term = Readonly<{keyAttribute:string;entryId:string;buttonCharacter:number;sourceInstance:string;firstFrame:number;lastFrameExclusive:number}>;
export interface Vb009NativeConfig {
 readonly animationId:string;readonly placementId:string;readonly sourceSwfSha256:string;
 readonly rootFrame:number;readonly frameDomain:string;readonly frameCount:number;readonly fps:number;readonly title:string;
 readonly bodies:readonly Body[];readonly terms:readonly Term[];readonly panelAlpha:readonly Readonly<{frame:number;alpha:number}>[];
 readonly binding:LessonTextBinding;readonly sourceAudio:readonly (AudioCue & {readonly sha256:string;readonly manualNarration?:false})[];
}
const C:Vb009NativeConfig=G4_L3_VB009_NATIVE_CONFIG;
const normalize=(frame:number)=>Math.min(C.frameCount,Math.max(1,Math.floor(Number.isFinite(frame)?frame:1)));
const revealed=(body:Body,frame:number)=>frame<body.firstFrame||frame>=body.lastFrameExclusive?[]:body.tokens.filter(token=>token.frame!==null&&frame>=token.frame);
export function getVb009PatternTeachingState(requestedFrame:number){
 const frame=normalize(requestedFrame);let panelAlpha=0;
 for(const sample of C.panelAlpha){if(sample.frame>frame)break;panelAlpha=sample.alpha;}
 return{frame,panelAlpha,blocks:C.bodies.map(body=>({id:body.id,text:revealed(body,frame).map(token=>token.text).join('')}))};
}
export function isVb009TermActive(term:Term,frame:number){return frame>=term.firstFrame&&frame<term.lastFrameExclusive;}
validateLessonTextBinding(C.binding);
if(C.rootFrame!==6||C.frameDomain!=='sprite-24'||C.frameCount!==175||C.fps!==12||C.bodies.some(body=>body.tokens.map(t=>t.text).join('')!==body.text))throw new Error('VB009 source reading configuration changed');

export function getG4L3Vb009TextSnapshot(state:SourceStaticCanvasFrameState,context:RuntimeContext):TextPresentationSnapshot{
 const blockers:string[]=[];
 if(state.animationId!==C.animationId||state.sourceSwfSha256!==C.sourceSwfSha256)blockers.push('source-identity-mismatch');
 if(state.status!=='ready')blockers.push(state.blocker??'source-state-not-ready');
 if(state.frameDomain!==C.frameDomain||(context.frameDomain??C.frameDomain)!==C.frameDomain)blockers.push('unsupported-frame-domain');
 if(state.scenario!=='source-static-frame'||context.scenario!=='source-static-frame')blockers.push('unsupported-scenario');
 if(state.language!=='en'||context.lang!=='en')blockers.push('spanish-text-not-source-verified');
 if(context.entryStateSha256)blockers.push('capture-state-not-supported');
 if(state.frame!==normalize(context.frame)||state.rootFrame!==C.rootFrame||(context.rootFrame!==undefined&&context.rootFrame!==C.rootFrame)||state.seed!==(Number.isSafeInteger(context.seed)?context.seed>>>0:0))blockers.push('teaching-state-identity-mismatch');
 const teaching=getVb009PatternTeachingState(state.frame);
 return{schemaVersion:1,animationId:C.animationId,bindingVersion:C.binding.version,sourceSwfSha256:C.sourceSwfSha256,status:blockers.length?'blocked':'ready',blockers,identity:{frame:state.frame,frameDomain:state.frameDomain,rootFrame:state.rootFrame,scenario:state.scenario,language:state.language,seed:state.seed,replay:context.replay??0},suppressedInstances:[],blocks:blockers.length?[]:C.binding.blocks.map(block=>{const text=block.id==='root-title'?C.title:teaching.blocks.find(b=>b.id===block.id)?.text??'';return{id:block.id,text,visible:Boolean(text),role:block.role,language:block.language,readingOrder:block.readingOrder};})};
}

const STYLE=`
.vb009-pattern{min-inline-size:0;inline-size:100%;padding:1rem;background:#fffdf7}
@media(max-width:480px){.vb009-pattern{padding-inline:0}}
.vb009-pattern .lesson-text-presentation__block--title{overflow-wrap:normal;word-break:normal;hyphens:none}
.vb009-pattern__term{min-inline-size:44px;min-block-size:44px;max-inline-size:100%;padding:.15rem .1rem;border:0;border-radius:.25rem;background:transparent;color:#164eaa;font:inherit;text-decoration:underline;text-underline-offset:.15em;cursor:pointer;white-space:normal;overflow-wrap:normal}
.vb009-pattern__term:focus-visible,.vb009-pattern__sequence:focus-visible{outline:3px solid #155ac1;outline-offset:2px}
/* Source alpha/reveals use the host clock even under the global reduced-motion
   transition-duration rule. Never add a second CSS clock to these elements. */
.vb009-pattern__examples,.vb009-pattern [data-lesson-text-block]:not([data-lesson-text-block="root-title"]){transition:none!important}
.vb009-pattern__examples{display:grid;gap:1rem;min-inline-size:0;padding-block:1rem;background:#f5f8ff;border-radius:.5rem}
.vb009-pattern__sequence{min-inline-size:0;max-inline-size:100%;overflow-x:auto;overscroll-behavior-inline:contain;padding-block:.2rem;}
.vb009-pattern__sequence p{min-inline-size:max-content;white-space:pre;overflow-wrap:normal;word-break:normal;font-variant-numeric:tabular-nums}
.vb009-pattern__token{display:inline-block;white-space:pre;overflow-wrap:normal;word-break:normal}
`;
export function G4L3Vb009ModernRenderer(props:AnimationRendererProps){
 const context:RuntimeContext={...props,frameDomain:props.frameDomain??C.frameDomain};
 const source=props.state&&typeof props.state==='object'&&'animationId'in props.state?props.state as SourceStaticCanvasFrameState:getCourseG04L03Vb009FrameState(props.frame,context);
 const current=getG4L3Vb009TextSnapshot(source,context),host=useRef<HTMLDivElement>(null),teaching=getVb009PatternTeachingState(source.frame);
 useLayoutEffect(()=>{for(const port of host.current?.querySelectorAll<HTMLElement>('.vb009-pattern__sequence')??[])port.scrollLeft=0;},[props.replay]);
 if(current.status!=='ready')return null;
 const content=(body:Body)=>revealed(body,source.frame).map((token,index)=>{
  const term=C.terms.find(term=>term.keyAttribute===token.keyAttribute);
  const word=term&&isVb009TermActive(term,source.frame)?<button type="button" className="vb009-pattern__term" disabled={!props.onLessonHostRequest} data-source-keyterm={term.keyAttribute} data-source-button={term.buttonCharacter} data-keyterm-entry-id={term.entryId} onClick={event=>{if(!isVb009TermActive(term,source.frame))return;props.onLessonHostRequest?.({type:'open-keyterm',entryId:term.entryId,sourceAnimationId:C.animationId,playbackDisposition:'source-stop-timeline-and-audio-until-explicit-resume'},{trigger:event.currentTarget,keyTermIndexLanguage:'en'});}}>{token.termText}</button>:null;
  return body.kind==='body'?<React.Fragment key={index}>{word?<>{word}{token.punctuation}{token.suffix}</>:token.text}</React.Fragment>:<span key={index} className="vb009-pattern__token" data-source-token-index={index} data-source-threshold-kind={token.thresholdKind}>{token.text}</span>;
 });
 const paragraph=(body:Body)=><p key={body.id} className="lesson-text-presentation__block lesson-text-presentation__block--body" data-lesson-text-block={body.id} data-source-character={body.sourceCharacter} data-source-instance={body.sourceInstance}>{content(body)}</p>;
 return<div ref={host} className="vb009-pattern" data-modern-text-page={C.animationId} data-lesson-frame={source.frame} data-lesson-replay={props.replay??0} data-flash-frame-domain={source.frameDomain} data-flash-root-frame={source.rootFrame}>
  <style>{STYLE}</style><div className="lesson-text-presentation" lang="en"><div className="lesson-text-presentation__layout">
   <h2 className="lesson-text-presentation__block lesson-text-presentation__block--title" data-lesson-text-block="root-title">{C.title}</h2>
   {C.bodies.filter(body=>body.kind==='body'&&revealed(body,source.frame).length).map(paragraph)}
   {teaching.panelAlpha>0&&<div className="vb009-pattern__examples" data-source-panel-character="17" style={{opacity:teaching.panelAlpha}}>{C.bodies.filter(body=>body.kind!=='body'&&revealed(body,source.frame).length).map(body=><div key={body.id} className="vb009-pattern__sequence" tabIndex={0} role="group" aria-label={body.kind==='numbers'?'Number pattern':body.kind==='letters'?'Letter pattern':'Symbol pattern'} onKeyDown={event=>{if(event.target!==event.currentTarget||event.altKey||event.ctrlKey||event.metaKey||event.shiftKey||!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;const v=event.currentTarget,max=Math.max(0,v.scrollWidth-v.clientWidth);if(!max)return;event.preventDefault();v.scrollLeft=Math.max(0,Math.min(max,event.key==='Home'?0:event.key==='End'?max:v.scrollLeft+(event.key==='ArrowRight'?1:-1)*Math.max(40,v.clientWidth/5)));}}>{paragraph(body)}</div>)}</div>}
  </div></div>
 </div>;
}
export const G4_L3_VB009_TEXT_BINDING=C.binding;
export const G4_L3_VB009_TEXT_PRESENTATION:LessonTextPresentationCapability<SourceStaticCanvasFrameState>={schemaVersion:1,binding:C.binding,Renderer:G4L3Vb009ModernRenderer,getSnapshot:getG4L3Vb009TextSnapshot,playbackMode:'once',sourceTimelineAudioCues:C.sourceAudio,reducedMotionFrameByDomain:{[C.frameDomain]:C.frameCount},keyTerms:{indexLanguage:'en',sourceAssetId:'ELKTEG4.xml',sourceSha256:'bec389ce286b9a113297dfd87e052f28cf1da2640d93a277f91f669dfb3ef749',entryIds:C.terms.map(term=>term.entryId)}};
