'use client';

import React from 'react';
import type {AnimationRendererProps, AudioCue, RuntimeContext} from '../contract';
import type {LessonTextBinding, LessonTextPresentationCapability, TextPresentationSnapshot} from '../lesson-text-contract';
import type {SourceStaticCanvasFrameState} from '../source-static-canvas-candidate';
import {validateLessonTextBinding} from '../lesson-text-snapshot';

type Curve = readonly (readonly [number, number])[];
type Token = Readonly<{sourceTokenId?:number;text:string;alpha:Curve;sourceTextIds:readonly string[];sourceInstances:readonly string[]}>;
type Block = Readonly<{id:string;role:'title'|'heading'|'body'|'label';tokens:readonly Token[]}>;
type Term = Readonly<{button:number;key:string;word:string;block:string;token:number;entryId:string;sourceInstance:string;sourceHitX:readonly number[];activeFrames:readonly (readonly [number,number])[]}>;
type Arrow = Readonly<{target:number;alpha:Curve;growth:Curve;sourceTip:readonly number[];sourceHeadCharacter:number;sourceHeadDepth:number}>;
type Card = Readonly<{id:string;horizontal:string;vertical:readonly string[];panelAlpha:Curve;lineAlpha:Curve;panelCharacter:number;lineCharacter:number;sourceColor:readonly number[]}>;
type Estimate = Readonly<{id:string;heading:string;original:string;rounded:string;targets:readonly number[];arrowAlpha:Curve;arrowCharacter:number}>;
type Layout = Readonly<{kind:'annotated';equation:string;label:string;targets:readonly number[];arrows:readonly Arrow[]}> | Readonly<{kind:'parallel-operations';cards:readonly Card[]}> | Readonly<{kind:'estimation';estimates:readonly Estimate[]}>;
export interface VocabularyConfig {
 readonly animationId:string;readonly placementId:string;readonly sourceSwfSha256:string;
 readonly rootFrame:6;readonly frameDomain:string;readonly frameCount:number;readonly fps:12;
 readonly blocks:readonly Block[];readonly layout:Layout;readonly terms:readonly Term[];
 readonly binding:LessonTextBinding;readonly sourceAudio:readonly (AudioCue & {readonly sha256:string})[];
 readonly keyTerms:Readonly<{indexLanguage:'en';sourceAssetId:string;sourceSha256:string;entryIds:readonly string[]}>;
}
export function vocabularySourceValue(curve:Curve,frame:number){let result=0;for(const [first,value]of curve){if(first>frame)break;result=value;}return result;}
export function vocabularyTermActive(term:Term,frame:number){return term.activeFrames.some(([first,last])=>frame>=first&&frame<last);}
export function getVocabularyTeachingState(config:VocabularyConfig,requestedFrame:number){
 const frame=Math.max(1,Math.min(config.frameCount,Math.floor(Number.isFinite(requestedFrame)?requestedFrame:1)));
 return{frame,blocks:config.blocks.map(block=>{const tokens=block.tokens.map(token=>({...token,alpha:vocabularySourceValue(token.alpha,frame)}));return{...block,tokens,text:tokens.filter(t=>t.alpha>0).map(t=>t.text).join(''),visible:tokens.some(t=>t.alpha>0)};})};
}
export function getVocabularyTextSnapshot(config:VocabularyConfig,state:SourceStaticCanvasFrameState,context:RuntimeContext):TextPresentationSnapshot{
 const blockers:string[]=[];
 if(state.animationId!==config.animationId||state.sourceSwfSha256!==config.sourceSwfSha256)blockers.push('source-identity-mismatch');
 if(state.status!=='ready')blockers.push(state.blocker??'source-state-not-ready');
 if(state.frameDomain!==config.frameDomain||(context.frameDomain??config.frameDomain)!==config.frameDomain)blockers.push('unsupported-frame-domain');
 if(state.rootFrame!==config.rootFrame||(context.rootFrame!==undefined&&context.rootFrame!==config.rootFrame))blockers.push('unsupported-root-context');
 if(state.scenario!=='source-static-frame'||context.scenario!==state.scenario)blockers.push('unsupported-scenario');
 if(state.language!=='en'||context.lang!=='en')blockers.push('spanish-text-not-source-verified');
 if(!Number.isInteger(context.frame)||context.frame<1||context.frame>config.frameCount||state.frame!==context.frame)blockers.push('source-frame-mismatch');
 if(state.seed!==(context.seed>>>0))blockers.push('source-seed-mismatch');
 if(context.entryStateSha256)blockers.push('capture-uses-source-canvas');
 const teaching=getVocabularyTeachingState(config,state.frame);
 return{schemaVersion:1,animationId:config.animationId,bindingVersion:config.binding.version,sourceSwfSha256:config.sourceSwfSha256,status:blockers.length?'blocked':'ready',blockers,
  identity:{frame:state.frame,frameDomain:state.frameDomain,rootFrame:state.rootFrame,scenario:state.scenario,language:state.language,seed:state.seed,replay:context.replay??0},suppressedInstances:[],
  blocks:blockers.length?[]:config.binding.blocks.map(block=>{const value=teaching.blocks.find(b=>b.id===block.id)!;return{id:block.id,text:value.text,visible:value.visible,role:block.role,language:block.language,readingOrder:block.readingOrder};})};
}
const STYLE=`
.g4l4-vocabulary{inline-size:100%;min-inline-size:0;background:#fffdf7;padding:.8rem;box-sizing:border-box}
.g4l4-vocabulary *{box-sizing:border-box}
.g4l4-vocabulary .lesson-text-presentation__block--title{overflow-wrap:normal;word-break:normal;hyphens:none}
.g4l4-vocabulary p,.g4l4-vocabulary h3{margin:0}
.g4l4-vocabulary__definition{padding:.55rem .7rem;background:white;border-radius:.5rem}
.g4l4-vocabulary__token{white-space:pre;display:inline-block;transition:none!important}
.g4l4-vocabulary [data-lesson-text-block="root-title"] .g4l4-vocabulary__token{white-space:normal;display:inline}
.g4l4-vocabulary__term{min-inline-size:44px;min-block-size:44px;max-inline-size:100%;padding:0;border:0;border-radius:.2rem;background:transparent;color:#1556a0;font:inherit;text-decoration:underline;text-decoration-thickness:2px;text-underline-offset:.15em;cursor:pointer;white-space:normal}
.g4l4-vocabulary__term:disabled{color:inherit;cursor:default}
.g4l4-vocabulary__term:focus-visible,.g4l4-vocabulary__scroll:focus-visible{outline:3px solid #1556a0;outline-offset:3px}
.g4l4-vocabulary__scroll{max-inline-size:100%;min-inline-size:0;overflow-x:auto;padding:.4rem .2rem .6rem;overscroll-behavior-inline:contain}
.g4l4-vocabulary__math{font-size:1.375rem;font-variant-numeric:tabular-nums;line-height:1.4;inline-size:max-content;min-inline-size:100%;white-space:nowrap}
.g4l4-vocabulary__formula{display:flex;gap:.45em;align-items:baseline;justify-content:center}
.g4l4-vocabulary__annotated,.g4l4-vocabulary__estimate-grid{display:grid;grid-template-columns:repeat(5,minmax(min-content,max-content));justify-content:center;align-items:center;column-gap:.35em;inline-size:max-content;min-inline-size:100%}
.g4l4-vocabulary__annotated>[data-lesson-text-block],.g4l4-vocabulary__estimate-grid>[data-lesson-text-block]{display:contents}
.g4l4-vocabulary__annotated .g4l4-vocabulary__token,.g4l4-vocabulary__estimate-grid .g4l4-vocabulary__token{text-align:center}
.g4l4-vocabulary__arrow{display:block;block-size:1.6em;inline-size:1.2em;justify-self:center;overflow:visible}
.g4l4-vocabulary__annotation{font-size:1.125rem;text-align:center;white-space:nowrap}
.g4l4-vocabulary__cards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.7rem;min-inline-size:0}
.g4l4-vocabulary__card{border:1px solid #b4bac4;border-radius:.6rem;padding:.6rem;min-inline-size:0}
.g4l4-vocabulary__card:last-child{grid-column:1/-1;inline-size:calc(50% - .35rem);justify-self:center}
.g4l4-vocabulary__vertical{display:grid;grid-template-columns:1.1em max-content;grid-template-rows:auto auto .2em auto;column-gap:.4em;inline-size:max-content;margin:.7rem auto 0;text-align:right}
.g4l4-vocabulary__vertical>[data-part='top']{grid-column:2;grid-row:1}.g4l4-vocabulary__vertical>[data-part='operator']{grid-column:1;grid-row:2}.g4l4-vocabulary__vertical>[data-part='operand']{grid-column:2;grid-row:2}.g4l4-vocabulary__vertical>[data-part='result']{grid-column:2;grid-row:4}
.g4l4-vocabulary__rule{grid-column:1/-1;grid-row:3;border-block-start:2px solid currentColor;align-self:center}
.g4l4-vocabulary__estimates{display:grid;gap:.9rem;min-inline-size:0}.g4l4-vocabulary__estimate{padding:.55rem;background:#f2f5fa;border-radius:.5rem;min-inline-size:0}
@container lesson-text (max-width:40rem){.g4l4-vocabulary__cards{grid-template-columns:1fr}.g4l4-vocabulary__card:last-child{grid-column:auto;inline-size:100%}}
@media(max-width:480px){.g4l4-vocabulary{padding-inline:0}.g4l4-vocabulary__definition{padding-inline:.3rem}.g4l4-vocabulary__card{padding-inline:.2rem}
 .lesson-shell2 .lesson-shell2__legacy-stage:has(.runtime-shell[data-lesson-presentation='modern-text-v1'] .g4l4-vocabulary){width:calc(100vw - 8px);max-width:none;margin-inline:calc((100% - 100vw + 8px)/2)}
 .lesson-shell2 .lesson-shell2__legacy-stage:has(.runtime-shell[data-lesson-presentation='modern-text-v1'] .g4l4-vocabulary)>.lesson-shell2__stage{padding-inline:2px}}
`;
function scrollMath(event:React.KeyboardEvent<HTMLDivElement>){
 const element=event.currentTarget;if(event.target!==element||event.altKey||event.ctrlKey||event.metaKey||event.shiftKey||element.scrollWidth<=element.clientWidth)return;
 if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();element.scrollLeft+=(event.key==='ArrowLeft'?-1:1)*Math.max(40,element.clientWidth*.5);}
 else if(event.key==='Home'||event.key==='End'){event.preventDefault();element.scrollLeft=event.key==='Home'?0:element.scrollWidth;}
}
function ArrowView({alpha,growth=1,down=false,...attrs}:{alpha:number;growth?:number;down?:boolean;'data-target'?:number;style?:React.CSSProperties}){
 return<svg className="g4l4-vocabulary__arrow" viewBox="0 0 24 36" aria-hidden="true" {...attrs} style={{...attrs.style,opacity:alpha}}><g transform={down?'rotate(180 12 18)':undefined}><g transform={`translate(0 ${32*(1-growth)}) scale(1 ${growth})`}><path d="M12 32V4M5 12l7-8 7 8" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></g></g></svg>;
}
export function VocabularyScene({config,frame,onOpenKeyTerm}:{config:VocabularyConfig;frame:number;onOpenKeyTerm?:(term:Term,trigger:HTMLButtonElement)=>void}){
 const state=getVocabularyTeachingState(config,frame);const block=(id:string)=>state.blocks.find(b=>b.id===id)!;
 const tokens=(id:string,reserve=false,gridRow?:number)=>block(id).tokens.map((token,index)=>{
  const term=config.terms.find(t=>t.block===id&&t.token===index);const visible=token.alpha>0;
  if(!visible&&!reserve)return null;
  const content=term?<><button type="button" className="g4l4-vocabulary__term" disabled={!visible||!onOpenKeyTerm||!vocabularyTermActive(term,state.frame)} data-source-button={term.button} data-source-keyterm={term.key} data-keyterm-entry-id={term.entryId} onClick={event=>{if(visible&&vocabularyTermActive(term,state.frame))onOpenKeyTerm?.(term,event.currentTarget);}}>{term.word}</button>{token.text.slice(term.word.length)}</>:token.text;
  return<span className="g4l4-vocabulary__token" key={index} data-source-token={index} data-source-instances={token.sourceInstances.join(',')} aria-hidden={!visible||undefined} style={{opacity:token.alpha,visibility:visible?'visible':'hidden',gridRow,gridColumn:gridRow?index+1:undefined}}>{content}</span>;
 });
 const formula=(id:string)=> <div className="g4l4-vocabulary__formula" data-lesson-text-block={id}>{tokens(id,true)}</div>;
 const scroll=(children:React.ReactNode,label:string)=><div className="g4l4-vocabulary__scroll" role="region" aria-label={label} tabIndex={0} onKeyDown={scrollMath}><div className="g4l4-vocabulary__math">{children}</div></div>;
 const layout=config.layout;
 return<div className="g4l4-vocabulary"><style>{STYLE}</style><div className="lesson-text-presentation" lang="en"><div className="lesson-text-presentation__layout">
  <h2 className="lesson-text-presentation__block lesson-text-presentation__block--title" data-lesson-text-block="root-title" data-source-character="4">{tokens('root-title')}</h2>
  {block('definition').visible&&<p className="g4l4-vocabulary__definition lesson-text-presentation__block lesson-text-presentation__block--body" data-lesson-text-block="definition">{tokens('definition')}</p>}
  {layout.kind==='annotated'&&(block(layout.equation).visible||block(layout.label).visible)&&scroll(<div className="g4l4-vocabulary__annotated">
   <div data-lesson-text-block={layout.equation}>{tokens(layout.equation,true,1)}</div>
   {layout.arrows.map(arrow=><ArrowView key={arrow.target} data-target={arrow.target} alpha={vocabularySourceValue(arrow.alpha,state.frame)} growth={vocabularySourceValue(arrow.growth,state.frame)} style={{gridColumn:arrow.target+1,gridRow:2}}/>)}
   <span className="g4l4-vocabulary__annotation" style={{gridColumn:`${Math.min(...layout.targets)+1} / ${Math.max(...layout.targets)+2}`,gridRow:3}}><span data-lesson-text-block={layout.label}>{tokens(layout.label,true)}</span></span>
  </div>,'Equation with word label')}
  {layout.kind==='parallel-operations'&&<div className="g4l4-vocabulary__cards">{layout.cards.filter(card=>vocabularySourceValue(card.panelAlpha,state.frame)>0).map(card=><section className="g4l4-vocabulary__card" key={card.id} data-source-panel={card.panelCharacter} style={{background:`rgba(${card.sourceColor.join(',')},${.22*vocabularySourceValue(card.panelAlpha,state.frame)})`}} aria-label={`Example ${card.id.slice(-1)}`}>{scroll(formula(card.horizontal),'Horizontal arithmetic')}<div className="g4l4-vocabulary__math" style={{inlineSize:'100%'}}><div className="g4l4-vocabulary__vertical">{card.vertical.map((id,index)=><span key={id} data-part={['top','operator','operand','result'][index]} data-lesson-text-block={id}>{tokens(id,true)}</span>)}<span className="g4l4-vocabulary__rule" data-source-shape={card.lineCharacter} style={{opacity:vocabularySourceValue(card.lineAlpha,state.frame)}} aria-hidden="true"/></div></div></section>)}</div>}
  {layout.kind==='estimation'&&<div className="g4l4-vocabulary__estimates">{layout.estimates.filter(e=>block(e.heading).visible).map(e=><section className="g4l4-vocabulary__estimate" key={e.id}>
   <h3 className="g4l4-vocabulary__heading lesson-text-presentation__block lesson-text-presentation__block--heading" data-lesson-text-block={e.heading}>{tokens(e.heading)}</h3>
   {scroll(<div className="g4l4-vocabulary__estimate-grid"><div data-lesson-text-block={e.original}>{tokens(e.original,true,1)}</div><span aria-hidden="true" style={{gridRow:1,gridColumn:5}}/>{e.targets.map(target=><ArrowView key={target} down data-target={target} alpha={vocabularySourceValue(e.arrowAlpha,state.frame)} style={{gridColumn:target+1,gridRow:2}}/>)}<div data-lesson-text-block={e.rounded}>{tokens(e.rounded,true,3)}</div></div>,'Original numbers and rounded estimate')}
  </section>)}</div>}
 </div></div></div>;
}
export function createVocabularyPresentation(config:VocabularyConfig,getFrameState:(frame:number,context:RuntimeContext)=>SourceStaticCanvasFrameState,FallbackRenderer:React.ComponentType<AnimationRendererProps>):LessonTextPresentationCapability<SourceStaticCanvasFrameState>{
 validateLessonTextBinding(config.binding);
 const getSnapshot=(state:SourceStaticCanvasFrameState,context:RuntimeContext)=>getVocabularyTextSnapshot(config,state,context);
 function Renderer(props:AnimationRendererProps){
  const context:RuntimeContext={...props,frameDomain:props.frameDomain??config.frameDomain};const state=(props.state??getFrameState(props.frame,context)) as SourceStaticCanvasFrameState;
  if(getSnapshot(state,context).status!=='ready')return<FallbackRenderer {...props} state={state}/>;
  return<div data-modern-text-page={config.animationId} data-lesson-frame={state.frame} data-lesson-replay={props.replay??0} data-flash-frame-domain={state.frameDomain} data-flash-root-frame={state.rootFrame}>
   <VocabularyScene key={props.replay??0} config={config} frame={state.frame} onOpenKeyTerm={props.onLessonHostRequest?(term,trigger)=>props.onLessonHostRequest?.({type:'open-keyterm',entryId:term.entryId,sourceAnimationId:config.animationId,playbackDisposition:'source-stop-timeline-and-audio-until-explicit-resume'},{trigger,keyTermIndexLanguage:'en'}):undefined}/>
  </div>;
 }
 return{schemaVersion:1,binding:config.binding,Renderer,getSnapshot,playbackMode:'once',playbackEndFrameByDomain:{[config.frameDomain]:config.frameCount},reducedMotionFrameByDomain:{[config.frameDomain]:config.frameCount},sourceTimelineAudioCues:config.sourceAudio,keyTerms:config.keyTerms};
}
