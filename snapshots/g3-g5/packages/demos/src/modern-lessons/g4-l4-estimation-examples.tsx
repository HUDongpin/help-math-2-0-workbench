'use client';
import React from 'react';
import type {AnimationRendererProps,RuntimeContext} from '../contract';
import type {LessonTextPresentationCapability,TextPresentationSnapshot} from '../lesson-text-contract';
import type {SourceStaticCanvasFrameState} from '../source-static-canvas-candidate';
import {validateLessonTextBinding} from '../lesson-text-snapshot';
import {ColumnArithmeticScene,getColumnTextSnapshot,type ColumnArithmeticConfig} from './g4-l4-column-arithmetic';
import {numberLineValue as at} from './g4-l4-number-line';

type Term=Readonly<{button:number;key:string;word:string;block:string;token:number;entryId:string;activeFrames:readonly(readonly[number,number])[];sourceInstances:readonly string[]}>;
export interface EstimationExampleConfig extends ColumnArithmeticConfig {
 readonly copy:readonly Readonly<{id:string;character:number;text:string;sourceTextIds:readonly string[];sourceInstances:readonly string[];tokens:readonly Readonly<{text:string;color:string;sourceTextIds:readonly string[];alpha:readonly(readonly[number,number])[]}>[]}>[];
 readonly terms:readonly Term[];
 readonly keyTerms:Readonly<{indexLanguage:'en';sourceAssetId:string;sourceSha256:string;entryIds:readonly string[]}>;
}
export function getEstimationCopy(c:EstimationExampleConfig,frame:number){return c.copy.map(p=>({...p,tokens:p.tokens.map(t=>({...t,alpha:at(t.alpha,frame,0)}))}));}
export function estimationTermActive(term:Term,frame:number){return term.activeFrames.some(([first,last])=>first<=frame&&frame<last);}
export function getEstimationTextSnapshot(c:EstimationExampleConfig,s:SourceStaticCanvasFrameState,r:RuntimeContext):TextPresentationSnapshot {
 const ids=new Set(c.blocks.map(b=>b.id)),base=getColumnTextSnapshot({...c,binding:{...c.binding,blocks:c.binding.blocks.filter(b=>ids.has(b.id))}},s,r);
 if(base.status!=='ready')return base;
 const values=new Map(base.blocks.map(b=>[b.id,b]));
 for(const p of getEstimationCopy(c,s.frame))values.set(p.id,{id:p.id,role:'body',language:'en',readingOrder:0,text:p.tokens.filter(t=>t.alpha>0).map(t=>t.text).join(''),visible:p.tokens.some(t=>t.alpha>0)});
 return {...base,blocks:c.binding.blocks.map(b=>({...values.get(b.id)!,role:b.role,language:b.language,readingOrder:b.readingOrder}))};
}
const CSS=`
.g4l4-estimation-copy{font:1.125rem/1.7 var(--lesson-font-body,system-ui,sans-serif);color:#17273c;overflow-wrap:normal;word-break:normal;hyphens:none}
.g4l4-estimation-copy p{margin:.45em 0;padding:.35em .5em;background:white;border-radius:.4em}
.g4l4-estimation-copy [data-source-word]{display:inline;transition:none!important}
.g4l4-estimation-copy button{font:inherit;color:#1556a0;min-inline-size:44px;min-block-size:44px;padding:0;border:0;background:transparent;text-decoration:underline;text-decoration-thickness:2px;text-underline-offset:.15em;cursor:pointer}
.g4l4-estimation-copy button:disabled{cursor:default}
.g4l4-estimation-copy button:focus-visible{outline:3px solid #1556a0;outline-offset:3px;border-radius:.2em}
`;
export function EstimationExampleScene({config:c,frame,replay=0,onOpenKeyTerm}:{config:EstimationExampleConfig;frame:number;replay?:number;onOpenKeyTerm?:(term:Term,trigger:HTMLButtonElement)=>void}){
 return <ColumnArithmeticScene config={c} frame={frame} replay={replay}><style>{CSS}</style><div className="g4l4-estimation-copy">
  {getEstimationCopy(c,frame).filter(p=>p.tokens.some(t=>t.alpha>0)).map(p=><p key={p.id} data-lesson-text-block={p.id} data-source-character={p.character} data-source-instances={p.sourceInstances.join(',')}>{p.tokens.map((token,i)=>{
   const term=c.terms.find(t=>t.block===p.id&&t.token===i),visible=token.alpha>0;
   return <span key={i} data-source-word={i} aria-hidden={!visible} style={{color:token.color,opacity:token.alpha,visibility:visible?'visible':'hidden'}}>{term?<><button type="button" disabled={!visible||!onOpenKeyTerm||!estimationTermActive(term,frame)} data-source-button={term.button} data-source-keyterm={term.key} data-keyterm-entry-id={term.entryId} onClick={e=>{if(visible&&estimationTermActive(term,frame))onOpenKeyTerm?.(term,e.currentTarget);}}>{term.word}</button>{token.text.slice(term.word.length)}</>:token.text}</span>;
  })}</p>)}
 </div></ColumnArithmeticScene>;
}
export function createEstimationExamplePresentation(c:EstimationExampleConfig,getFrameState:(frame:number,r:RuntimeContext)=>SourceStaticCanvasFrameState,Fallback:React.ComponentType<AnimationRendererProps>):LessonTextPresentationCapability<SourceStaticCanvasFrameState>{
 validateLessonTextBinding(c.binding);
 function Renderer(r:AnimationRendererProps){
  const context={...r,frameDomain:r.frameDomain??c.frameDomain},source=(r.state??getFrameState(r.frame,context))as SourceStaticCanvasFrameState;
  if(getEstimationTextSnapshot(c,source,context).status!=='ready')return <Fallback {...r} state={source}/>;
  return <div data-modern-text-page={c.animationId} data-lesson-frame={r.frame} data-lesson-replay={r.replay??0} data-flash-frame-domain={c.frameDomain} data-flash-root-frame={6}><EstimationExampleScene key={r.replay??0} config={c} frame={r.frame} replay={r.replay} onOpenKeyTerm={r.onLessonHostRequest?(term,trigger)=>r.onLessonHostRequest?.({type:'open-keyterm',entryId:term.entryId,sourceAnimationId:c.animationId,playbackDisposition:'source-stop-timeline-and-audio-until-explicit-resume'},{trigger,keyTermIndexLanguage:'en'}):undefined}/></div>;
 }
 return {schemaVersion:1,binding:c.binding,Renderer,getSnapshot:(s,r)=>getEstimationTextSnapshot(c,s,r),playbackMode:'once',playbackEndFrameByDomain:{[c.frameDomain]:c.frameCount},reducedMotionFrameByDomain:{[c.frameDomain]:c.frameCount},sourceTimelineAudioCues:c.sourceAudio,keyTerms:c.keyTerms};
}
