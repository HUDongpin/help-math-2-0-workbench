'use client';

// Own-source step-plan pages share presentation and the existing host clock.
// Optional own title and source number/board alpha preserve TS002's empty first frame.
import React from 'react';
import type {AnimationRendererProps, AudioCue, RuntimeContext} from '../contract';
import type {LessonTextBinding, LessonTextPresentationCapability, TextPresentationSnapshot} from '../lesson-text-contract';
import type {SourceStaticCanvasFrameState} from '../source-static-canvas-candidate';
import {validateLessonTextBinding} from '../lesson-text-snapshot';

type Term = Readonly<{button:number;key:string;label:number;block:string;entryId:string;text:string;sourceInstances:readonly string[];activeFrames:readonly (readonly [number,number])[];sourceButtonTagSha256:string;actionSha256:string;request:string;equivalentButtons?:readonly Readonly<{button:number;activeFrames:readonly (readonly [number,number])[];actionSha256:string}>[]}>;
type SourceNumberPart = Readonly<{text:string;character:number;instanceId:string;sourceMatrix:readonly number[]}>;
type Cell = Readonly<{step:number;number:string;sourceNumberParts?:readonly SourceNumberPart[];numberCharacters:readonly number[];numberInstance:string;copyCharacter:number|null;copy:string|null;aliasCharacters:readonly number[];sourceTopLeft:readonly number[]}>;
type StrategyBlock = Readonly<{id:string;text:string;characters:readonly number[];shapes:readonly number[]}>;
type StrategyPlan = Readonly<{heading:StrategyBlock;subheading:StrategyBlock;left:readonly StrategyBlock[];right:readonly StrategyBlock[];final?:StrategyBlock}>;
export interface FourStepPlanConfig {
 readonly numberInstanceAlphaFrames?:readonly Readonly<{frame:number;values:Readonly<Record<string,number>>}>[];
 readonly strategyPlan?:StrategyPlan;
 readonly headingMarkerCharacter?:number;
 readonly titleCharacter?:number;readonly sourceNumberAlpha?:boolean;readonly sourceBoardAlpha?:boolean;readonly fitLongTitle?:boolean;
 readonly animationId:string;readonly placementId:string;readonly sourceSwfSha256:string;readonly rootFrame:6;
 readonly frameDomain:string;readonly frameCount:number;readonly fps:12;readonly title:string;readonly activeStep:number|null;
 readonly cells:readonly Cell[];readonly headingCharacter:number|null;readonly bulletCharacters:readonly number[];
 readonly emphasisCharacters:readonly number[];readonly terms:readonly Term[];readonly texts:Readonly<Record<string,string>>;
 readonly alphaFrames:readonly Readonly<{frame:number;values:Readonly<Record<string,number>>}>[];
 readonly binding:LessonTextBinding;readonly sourceAudio:readonly (AudioCue & {readonly sha256:string})[];
 readonly keyTerms:Readonly<{indexLanguage:'en';sourceAssetId:string;sourceSha256:string;entryIds:readonly string[]}>|null;
 readonly shapes:Readonly<{board:readonly number[];heading:number|null;bullets:readonly number[]}>;
}
const normalize=(config:FourStepPlanConfig,frame:number)=>Math.max(1,Math.min(config.frameCount,Math.floor(Number.isFinite(frame)?frame:1)));
export function sourceAlpha(config:FourStepPlanConfig,requestedFrame:number,character:number){
 const frame=normalize(config,requestedFrame);let value=0;
 for(const row of config.alphaFrames){if(row.frame>frame)break;value=row.values[String(character)]??0;}
 return value;
}
export function sourceNumberInstanceAlpha(config:FourStepPlanConfig,requestedFrame:number,instanceId:string){
 const frame=normalize(config,requestedFrame);let value=0;
 for(const row of config.numberInstanceAlphaFrames??[]){if(row.frame>frame)break;value=row.values[instanceId]??0;}
 return value;
}
export function isFourStepTermActive(term:Pick<Term,'activeFrames'>,frame:number){return term.activeFrames.some(([first,last])=>frame>=first&&frame<last);}
function strategyBlockState(config:FourStepPlanConfig,frame:number,block:StrategyBlock){
 const alpha=Math.min(...block.characters.map(character=>sourceAlpha(config,frame,character)));
 return {...block,alpha,visible:alpha>0};
}
export function getFourStepTeachingState(config:FourStepPlanConfig,requestedFrame:number,reducedMotion=false){
 const frame=normalize(config,requestedFrame);
 const block=(character:number|null,text:string|null)=>({text:text??'',alpha:character===null?0:sourceAlpha(config,frame,character),visible:character!==null&&sourceAlpha(config,frame,character)>0});
 const boardAlpha=config.sourceBoardAlpha?Math.min(...config.shapes.board.map(cid=>sourceAlpha(config,frame,cid))):1;
 return{frame,title:config.title,boardAlpha,boardVisible:boardAlpha>0,cells:config.cells.map(cell=>{const parts=cell.sourceNumberParts?.map(part=>({...part,alpha:sourceNumberInstanceAlpha(config,frame,part.instanceId)}));const alpha=parts?Math.min(...parts.map(part=>part.alpha)):config.sourceNumberAlpha?Math.min(...cell.numberCharacters.map(cid=>sourceAlpha(config,frame,cid))):1;return {...cell,numberState:{text:cell.number,alpha,visible:parts?parts.some(part=>part.alpha>0):alpha>0,...(parts?{parts}:{})},copyState:block(cell.copyCharacter,cell.copy)};}),
  heading:block(config.headingCharacter,config.headingCharacter===null?null:(config.headingMarkerCharacter===undefined?'':config.texts[String(config.headingMarkerCharacter)]+' ')+config.texts[String(config.headingCharacter)]),
  bullets:config.bulletCharacters.map((character,index)=>({id:index===0?'first-bullet':'second-bullet',character,...block(character,config.texts[String(character)])})),
  ...(config.strategyPlan?{strategy:{heading:strategyBlockState(config,frame,config.strategyPlan.heading),subheading:strategyBlockState(config,frame,config.strategyPlan.subheading),left:config.strategyPlan.left.map(b=>strategyBlockState(config,frame,b)),right:config.strategyPlan.right.map(b=>strategyBlockState(config,frame,b)),...(config.strategyPlan.final?{final:strategyBlockState(config,frame,config.strategyPlan.final)}:{})}}:{}),
  emphasis:config.emphasisCharacters.filter(character=>!reducedMotion&&sourceAlpha(config,frame,character)>0)};
}
export function getFourStepTextSnapshot(config:FourStepPlanConfig,state:SourceStaticCanvasFrameState,context:RuntimeContext):TextPresentationSnapshot{
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
 const teaching=getFourStepTeachingState(config,state.frame);
 const values:Record<string,{text:string;visible:boolean}>={'root-title':{text:teaching.title,visible:true},'step-heading':teaching.heading};
 for(const cell of teaching.cells){values[`step-${cell.step}`]=cell.numberState;values[`step-copy-${cell.step}`]=cell.copyState;}
 for(const bullet of teaching.bullets)values[bullet.id]=bullet;
 if(teaching.strategy)for(const block of [teaching.strategy.heading,teaching.strategy.subheading,...teaching.strategy.left,...teaching.strategy.right,...(teaching.strategy.final?[teaching.strategy.final]:[])])values[block.id]=block;
 return{schemaVersion:1,animationId:config.animationId,bindingVersion:config.binding.version,sourceSwfSha256:config.sourceSwfSha256,status:blockers.length?'blocked':'ready',blockers,
  identity:{frame:state.frame,frameDomain:state.frameDomain,rootFrame:state.rootFrame,scenario:state.scenario,language:state.language,seed:state.seed,replay:context.replay??0},suppressedInstances:[],
  blocks:blockers.length?[]:config.binding.blocks.map(block=>({id:block.id,text:values[block.id]?.text??'',visible:values[block.id]?.visible??false,role:block.role,language:block.language,readingOrder:block.readingOrder}))};
}
const STYLE=`
.g4l4-step-plan{inline-size:100%;min-inline-size:0;box-sizing:border-box;padding:1rem;background:#fffdf7}
.g4l4-step-plan *{box-sizing:border-box}
.g4l4-step-plan .lesson-text-presentation__block--title{overflow-wrap:normal;word-break:normal;hyphens:none}
@container lesson-text (max-width:26rem){.g4l4-step-plan[data-native-title-fit="narrow"] .lesson-text-presentation__block--title{font-size:1.125rem}}
.g4l4-step-plan__board{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));grid-template-areas:'one three' 'two four';gap:.4rem;list-style:none;margin:0;padding:0}
.g4l4-step-plan__cell{min-inline-size:0;min-block-size:4rem;padding:.55rem .75rem;border:2px solid #8fa9c8;border-radius:.65rem;background:#fff}
.g4l4-step-plan__cell[data-step='1']{grid-area:one}.g4l4-step-plan__cell[data-step='2']{grid-area:two}.g4l4-step-plan__cell[data-step='3']{grid-area:three}.g4l4-step-plan__cell[data-step='4']{grid-area:four}
.g4l4-step-plan__cell[data-active='true']{border-color:#2363aa;background:#eaf3ff}
.g4l4-step-plan__number{font-size:1.5rem;font-weight:700;line-height:1.3}
.g4l4-step-plan__cell p{margin:.25rem 0 0}
.g4l4-step-plan__explanation{display:grid;gap:.7rem;min-inline-size:0;padding:.65rem .75rem;background:#fff;border-radius:.65rem}
.g4l4-step-plan__bullets{display:grid;gap:.55rem;margin:0;padding:0;list-style:none}
.g4l4-step-plan__bullets li{position:relative;padding-inline-start:1.15rem}
.g4l4-step-plan__bullets li::before{content:'';position:absolute;inset-inline-start:0;inset-block-start:.65em;inline-size:.55rem;block-size:.55rem;border:1px solid #8a1111;border-radius:50%;background:#c20b0b}
.g4l4-step-plan__term{min-inline-size:44px;min-block-size:44px;max-inline-size:100%;vertical-align:baseline;padding:0;border:0;border-radius:.2rem;background:transparent;color:#1556a0;font:inherit;text-decoration:underline;text-decoration-thickness:2px;text-underline-offset:.15em;cursor:pointer;white-space:normal;overflow-wrap:normal}
.g4l4-step-plan__term:disabled{color:inherit;cursor:default}.g4l4-step-plan__term:focus-visible{outline:3px solid #1556a0;outline-offset:3px}
.g4l4-step-plan__term[data-emphasis='true']{background:#ffeb81}
/* The host frame's source alpha is authoritative, including reduced motion. */
.g4l4-step-plan [data-lesson-text-block]{transition:none!important}
@container lesson-text (max-width:31rem){.g4l4-step-plan__board{grid-template-columns:1fr;grid-template-areas:'one' 'two' 'three' 'four'}.g4l4-step-plan__cell{padding:.45rem}.g4l4-step-plan__explanation{padding-inline:.4rem}}
@media(max-width:480px){.g4l4-step-plan{padding-inline:0}}
/* Give the enlarged whole-word title the phone's reading width. Reduce only
   surrounding gutters; source text and the shared rem type scale stay intact. */
@media(max-width:480px){
 .lesson-shell2 .lesson-shell2__legacy-stage:has(.runtime-shell[data-lesson-presentation='modern-text-v1'] .g4l4-step-plan){width:calc(100vw - 8px);max-width:none;margin-inline:calc((100% - 100vw + 8px)/2)}
 .lesson-shell2 .lesson-shell2__legacy-stage:has(.runtime-shell[data-lesson-presentation='modern-text-v1'] .g4l4-step-plan)>.lesson-shell2__stage{padding-inline:2px}
}
`;
const STRATEGY_STYLE=`
.g4l4-step-plan__strategies{display:grid;gap:.75rem;min-inline-size:0;padding:.65rem .75rem;background:#fff;border-radius:.65rem}
.g4l4-step-plan__strategy-columns{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1rem;min-inline-size:0}
.g4l4-step-plan__strategies h3,.g4l4-step-plan__strategies h4,.g4l4-step-plan__strategies p{margin:0}
.g4l4-step-plan__strategies h3{border-inline-start:.3rem solid #2363aa;padding-inline-start:.5rem}
.g4l4-step-plan__strategies h4,.g4l4-step-plan__strategy-final{padding-inline-start:1.15rem;position:relative}
.g4l4-step-plan__strategies h4::before,.g4l4-step-plan__strategy-final::before{content:'';position:absolute;inset-inline-start:0;inset-block-start:.65em;inline-size:.55rem;block-size:.55rem;border-radius:50%;background:#c20b0b}
@container lesson-text (max-width:38rem){.g4l4-step-plan__strategy-columns{grid-template-columns:1fr}.g4l4-step-plan__strategies{padding-inline:.4rem}}
`;
export function FourStepPlanScene({config,frame,reducedMotion=false,onOpenKeyTerm}:{config:FourStepPlanConfig;frame:number;reducedMotion?:boolean;onOpenKeyTerm?:(term:Term,trigger:HTMLButtonElement)=>void}){
 const teaching=getFourStepTeachingState(config,frame,reducedMotion);
 const linked=(copy:string,block:string)=>{
  const terms=config.terms.filter(term=>term.block===block);let position=0;const fragments:React.ReactNode[]=[];
  for(const term of terms){const at=copy.indexOf(term.text,position);if(at<0)throw new Error(`Own source term ${term.text} missing from ${block}`);fragments.push(copy.slice(position,at));
   fragments.push(<button key={term.button} type="button" className="g4l4-step-plan__term" disabled={!onOpenKeyTerm||!isFourStepTermActive(term,teaching.frame)} data-source-button={term.button} data-source-equivalent-buttons={term.equivalentButtons?.filter(alias=>isFourStepTermActive(alias,teaching.frame)).map(alias=>alias.button).join(',')||undefined} data-source-keyterm={term.key} data-keyterm-entry-id={term.entryId} data-emphasis={teaching.emphasis.includes(term.label)} onClick={event=>{if(isFourStepTermActive(term,teaching.frame))onOpenKeyTerm?.(term,event.currentTarget);}}>{term.text}</button>);position=at+term.text.length;}
  fragments.push(copy.slice(position));return fragments;
 };
 const strategy=teaching.strategy;
 const strategyAttrs=(block:ReturnType<typeof strategyBlockState>)=>({'data-lesson-text-block':block.id,'data-source-characters':block.characters.join(','),'data-source-shapes':block.shapes.join(','),style:{opacity:block.alpha}});
 return<div className="g4l4-step-plan" data-native-title-fit={config.fitLongTitle?"narrow":undefined}><style>{STYLE}</style>{strategy&&<style>{STRATEGY_STYLE}</style>}<div className="lesson-text-presentation" lang="en"><div className="lesson-text-presentation__layout">
  <h2 className="lesson-text-presentation__block lesson-text-presentation__block--title" data-lesson-text-block="root-title" data-source-character={config.titleCharacter??2}>{config.title}</h2>
  <ol className="g4l4-step-plan__board" aria-label="Four-step plan" hidden={!teaching.boardVisible} style={config.sourceBoardAlpha?{opacity:teaching.boardAlpha,display:teaching.boardVisible?undefined:'none'}:undefined} data-source-shapes={config.shapes.board.join(',')}>
   {teaching.cells.map(cell=><li key={cell.step} className="g4l4-step-plan__cell" data-step={cell.step} data-active={cell.step===config.activeStep} data-source-number-instance={cell.numberInstance} data-source-alias-characters={cell.aliasCharacters.join(',')}>
    {cell.numberState.visible&&<span className="g4l4-step-plan__number" data-lesson-text-block={`step-${cell.step}`} data-source-characters={cell.numberCharacters.join(',')} style={config.sourceNumberAlpha&&!cell.numberState.parts?{opacity:cell.numberState.alpha}:undefined}>{cell.numberState.parts?cell.numberState.parts.map(part=><span key={part.instanceId} data-source-number-part={part.instanceId} data-source-character={part.character} data-source-matrix={part.sourceMatrix.join(',')} style={{opacity:part.alpha}}>{part.text}</span>):cell.number}</span>}
    {cell.copyState.visible&&<p className="lesson-text-presentation__block lesson-text-presentation__block--body" data-lesson-text-block={`step-copy-${cell.step}`} data-source-character={cell.copyCharacter} style={{opacity:cell.copyState.alpha}}>{cell.copyState.text}</p>}
   </li>)}
  </ol>
  {teaching.heading.visible&&<article className="g4l4-step-plan__explanation" aria-label={`Step ${config.activeStep} explanation`}>
   <h3 className="lesson-text-presentation__block lesson-text-presentation__block--heading" data-lesson-text-block="step-heading" data-source-character={config.headingCharacter} data-source-marker-character={config.headingMarkerCharacter} data-source-shape={config.shapes.heading} style={{opacity:teaching.heading.alpha}}>{linked(teaching.heading.text,'step-heading')}</h3>
   {teaching.bullets.some(bullet=>bullet.visible)&&<ul className="g4l4-step-plan__bullets">{teaching.bullets.filter(bullet=>bullet.visible).map((bullet,index)=><li key={bullet.id} className="lesson-text-presentation__block lesson-text-presentation__block--body" data-lesson-text-block={bullet.id} data-source-character={bullet.character} data-source-shape={config.shapes.bullets[index]} style={{opacity:bullet.alpha}}>{linked(bullet.text,bullet.id)}</li>)}</ul>}
  </article>}
  {strategy&&strategy.heading.visible&&<article className="g4l4-step-plan__strategies" aria-label={`Step ${config.activeStep} strategies`}>
   <h3 className="lesson-text-presentation__block lesson-text-presentation__block--heading" {...strategyAttrs(strategy.heading)}>{linked(strategy.heading.text,strategy.heading.id)}</h3>
   {strategy.subheading.visible&&<h4 className="lesson-text-presentation__block lesson-text-presentation__block--heading" {...strategyAttrs(strategy.subheading)}>{linked(strategy.subheading.text,strategy.subheading.id)}</h4>}
   {[...strategy.left,...strategy.right].some(b=>b.visible)&&<div className="g4l4-step-plan__strategy-columns">{[strategy.left,strategy.right].map((column,index)=><ul key={index} className="g4l4-step-plan__bullets">{column.filter(b=>b.visible).map(block=><li key={block.id} className="lesson-text-presentation__block lesson-text-presentation__block--body" {...strategyAttrs(block)}>{linked(block.text,block.id)}</li>)}</ul>)}</div>}
   {strategy.final?.visible&&<p className="g4l4-step-plan__strategy-final lesson-text-presentation__block lesson-text-presentation__block--body" {...strategyAttrs(strategy.final)}>{linked(strategy.final.text,strategy.final.id)}</p>}
  </article>}
 </div></div></div>;
}
export function createFourStepPlanPresentation(config:FourStepPlanConfig,getFrameState:(frame:number,context:RuntimeContext)=>SourceStaticCanvasFrameState,FallbackRenderer:React.ComponentType<AnimationRendererProps>):LessonTextPresentationCapability<SourceStaticCanvasFrameState>{
 validateLessonTextBinding(config.binding);
 const getSnapshot=(state:SourceStaticCanvasFrameState,context:RuntimeContext)=>getFourStepTextSnapshot(config,state,context);
 function Renderer(props:AnimationRendererProps){
  const context:RuntimeContext={...props,frameDomain:props.frameDomain??config.frameDomain};
  const state=(props.state??getFrameState(props.frame,context)) as SourceStaticCanvasFrameState;
  if(getSnapshot(state,context).status!=='ready')return<FallbackRenderer {...props} state={state}/>;
  // Pause never disables the source glossary control needed for focus return.
  return<div data-modern-text-page={config.animationId} data-lesson-frame={state.frame} data-lesson-replay={props.replay??0} data-flash-frame-domain={state.frameDomain} data-flash-root-frame={state.rootFrame}>
   <FourStepPlanScene config={config} frame={state.frame} reducedMotion={props.reducedMotion} onOpenKeyTerm={props.onLessonHostRequest?(term,trigger)=>props.onLessonHostRequest?.({type:'open-keyterm',entryId:term.entryId,sourceAnimationId:config.animationId,playbackDisposition:'source-stop-timeline-and-audio-until-explicit-resume'},{trigger,keyTermIndexLanguage:'en'}):undefined}/>
  </div>;
 }
 return{schemaVersion:1,binding:config.binding,Renderer,getSnapshot,playbackMode:'once',playbackEndFrameByDomain:{[config.frameDomain]:config.frameCount},reducedMotionFrameByDomain:{[config.frameDomain]:config.frameCount},sourceTimelineAudioCues:config.sourceAudio,...(config.keyTerms?{keyTerms:config.keyTerms}:{})};
}
