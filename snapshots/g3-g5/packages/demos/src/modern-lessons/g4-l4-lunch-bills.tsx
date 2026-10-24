'use client';
import React, {type ReactNode} from 'react';
import type {AnimationRendererProps,AudioCue,RuntimeContext} from '../contract';
import type {LessonTextBinding,LessonTextPresentationCapability,TextPresentationSnapshot} from '../lesson-text-contract';
import type {SourceStaticCanvasFrameState} from '../source-static-canvas-candidate';
import {validateLessonTextBinding} from '../lesson-text-snapshot';
import {numberLineValue as at} from './g4-l4-number-line';
type Curve<T> = readonly (readonly [number,T])[];
type SourceInstance = Readonly<{instanceId:string;characterId:number;firstFrame:number;lastFrameExclusive:number}>;
type SourceText = Readonly<{id:string;text:string;sourceTextIds:readonly string[];sourceInstances?:readonly SourceInstance[]}>;
type Glyph = Readonly<{text:string;index:number;x:number;baseline:number;fontScale?:number}>;
type Label = Readonly<{id:string;owner:string;text:string;depth:number;emphasis:boolean;accessibilityDuplicateOf?:string;carryRoute?:Readonly<{startFrame:number;endFrame:number;laneX:number}>;states:Curve<{alpha:number;glyphs:readonly Glyph[];sourceRgb?:readonly number[];muted?:boolean}|null>;characterId?:number;sourceTextIds?:readonly string[];sourceShapeIds?:readonly number[];sourceInstances:readonly SourceInstance[];baselineSourceGlyph?:number}>;
type Path = Readonly<{d:string;fill:string;stroke:string;width:number}>;
type Guide = Readonly<{id:string;owner:string;character:number;depth:number;paths:readonly Path[];sourceInstances:readonly SourceInstance[];states:Curve<{paths:readonly Path[];alpha:number;matrix?:readonly number[];sourceColorTransform?:Readonly<{multiply:readonly number[];add:readonly number[];divisor:number}>;owner?:string;image?:Readonly<{source:string;x:number;y:number;width:number;height:number}>}|null>}>;
export interface LunchBillsConfig {
 readonly animationId:string;readonly placementId:string;readonly sourceSwfSha256:string;readonly rootFrame:6;readonly frameDomain:string;readonly frameCount:number;readonly fps:12;
 readonly menuVisibility?:Curve<boolean>;readonly accountsVisibleFrom?:number;readonly introEndFrame?:number;
 readonly unitsPerEm:number;readonly horizontalSpacingScale:number;
 readonly title:SourceText;readonly menuTitle:SourceText;
 readonly menu:readonly Readonly<{id:string;text:string;price:string;foodCharacter:number;priceCharacter:number;sourceInstances:readonly SourceInstance[];foodSourceTextIds:readonly string[];priceSourceTextIds:readonly string[];highlight:Curve<boolean>;priceHighlight?:Curve<boolean>;visible?:Curve<boolean>}>[];
 readonly headings:readonly (SourceText&Readonly<{owner:string;sourceInstance:SourceInstance;visibleFrom:number;maskPolicy:string}>)[];
 readonly labels:readonly Label[];readonly guides:readonly Guide[];readonly attention:Curve<{owner:string;alpha:number}|null>;
 readonly bills:readonly Readonly<{id:string;bounds:readonly number[]}>[];
 readonly binding:LessonTextBinding;readonly sourceAudio:readonly (AudioCue&{readonly sha256:string})[];
 readonly sourceRisksGloballyResolved:false;readonly claimBoundary:string;
}

export function getLunchBillsSnapshot(config:LunchBillsConfig,state:SourceStaticCanvasFrameState,context:RuntimeContext):TextPresentationSnapshot {
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
 const menuVisible=config.menuVisibility?at(config.menuVisibility,state.frame,false):true;
 const values=new Map<string,{text:string;visible:boolean}>([[config.title.id,{text:config.title.text,visible:true}],[config.menuTitle.id,{text:config.menuTitle.text,visible:menuVisible}]]);
 for(const row of config.menu){const visible=menuVisible&&(!row.visible||at(row.visible,state.frame,false));values.set(row.id+'-food',{text:row.text,visible});values.set(row.id+'-price',{text:row.price,visible});}
 for(const h of config.headings)values.set(h.id,{text:h.text,visible:state.frame>=h.visibleFrom});
 for(const label of config.labels)values.set(label.id,{text:label.text,visible:(at(label.states,state.frame,null)?.alpha??0)>0});
 return {schemaVersion:1,animationId:config.animationId,bindingVersion:config.binding.version,sourceSwfSha256:config.sourceSwfSha256,status:blockers.length?'blocked':'ready',blockers,identity:{frame:state.frame,frameDomain:state.frameDomain,rootFrame:state.rootFrame,scenario:state.scenario,language:state.language,seed:state.seed,replay:context.replay??0},suppressedInstances:[],blocks:blockers.length?[]:config.binding.blocks.map(b=>{const v=values.get(b.id)!;return{id:b.id,text:v.visible?v.text:'',visible:v.visible,role:b.role,language:b.language,readingOrder:b.readingOrder}})};
}

const CSS=`
.lunch-bills{padding:clamp(.5rem,2vw,1rem);box-sizing:border-box;background:var(--lesson-text-paper,#fffdf7)}
.lunch-bills *{box-sizing:border-box}
.lunch-bills__content{display:grid;gap:1.5rem;align-items:start;min-inline-size:0;font-size:var(--lesson-text-body-size);line-height:1.6}
.lunch-bills h2{overflow-wrap:anywhere;word-break:normal;hyphens:auto;letter-spacing:-.01em;font-weight:500}
@container lesson-text (max-width:12rem){.lunch-bills h2{font-variation-settings:"wdth" 75}}
.lunch-bills h3{font-family:var(--lesson-text-font-heading);font-size:1.125em;line-height:1.3;font-weight:500;margin:0 0 .8rem}
.lunch-bills__menu{min-inline-size:0}
.lunch-bills__intro{margin:0;min-inline-size:0;border:1px solid #afc8d7;border-radius:.65rem;overflow:hidden}
.lunch-bills__accounts[hidden],.lunch-bills__intro[hidden]{display:none}
.lunch-bills__menu table{border-collapse:collapse;inline-size:100%;font:inherit}
.lunch-bills__menu th,.lunch-bills__menu td{padding:.3em .35em;border-bottom:1px solid #d6e0e5;vertical-align:top}
.lunch-bills__menu th{text-align:start;font-weight:400;overflow-wrap:normal;word-break:normal}
.lunch-bills__menu td{text-align:end;white-space:nowrap;font-variant-numeric:tabular-nums}
.lunch-bills [data-menu-emphasis=true]{background:#ffdf7e;color:#14213d;border-radius:.12em;box-shadow:0 0 0 .1em #ffdf7e}
.lunch-bills__accounts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1rem;align-items:start;min-inline-size:0}
.lunch-bills__bill{min-inline-size:0;border:1px solid #afc8d7;border-radius:.65rem;padding:.6rem;position:relative;background:white}
.lunch-bills__bill h3{text-align:center;min-block-size:2.6em}
.lunch-bills__heading-word{display:block;min-block-size:1.3em}
.lunch-bills__port{max-inline-size:100%;overflow-x:auto;overscroll-behavior-inline:contain;outline-offset:.15rem}
.lunch-bills__figure{position:relative;margin-inline:auto;isolation:isolate;font-size:var(--lesson-text-body-size);line-height:1}
.lunch-bills__geometry{position:absolute;inset:0;inline-size:100%;block-size:100%;pointer-events:none}
.lunch-bills__glyph{position:absolute;white-space:pre;transform:translate(-50%,-.85em);font-variant-numeric:tabular-nums;line-height:1;color:#14213d}
.lunch-bills__glyph--emphasis{color:#14213d;background:#ffdf7e;border-radius:.1em;box-shadow:0 0 0 .05em #ffdf7e}
.lunch-bills__attention{position:absolute;inset:0;z-index:0;border-radius:.6rem;background:#d8e3ee;pointer-events:none}
@container lesson-text (min-width:45rem){.lunch-bills__content{grid-template-columns:minmax(0,1.25fr) minmax(0,1fr)}}
@container lesson-text (max-width:18rem){.lunch-bills__menu tr,.lunch-bills__menu th,.lunch-bills__menu td{display:block}.lunch-bills__menu th{border-bottom:0;padding-bottom:0}.lunch-bills__menu td{text-align:start;padding-top:0}}
@container lesson-text (max-width:23rem){.lunch-bills__accounts{grid-template-columns:minmax(0,1fr)}.lunch-bills{padding:.5rem}}
`;

export function LunchBillsScene({config,frame=1,replay=0,figure}:{config:LunchBillsConfig;frame?:number;replay?:number;figure?:ReactNode}){
 const f=Math.max(1,Math.min(config.frameCount,Math.floor(Number.isFinite(frame)?frame:1))),attention=at(config.attention,f,null),menuVisible=config.menuVisibility?at(config.menuVisibility,f,false):true;
 return <section className="lesson-text-presentation lunch-bills" lang="en" data-modern-text-page={config.animationId} data-lesson-frame={f} data-lesson-replay={replay}>
  <style>{CSS}</style><div className="lesson-text-presentation__layout">
   <h2 className="lesson-text-presentation__block lesson-text-presentation__block--title" data-lesson-text-block={config.title.id}>{config.title.text}</h2>
   <div className="lunch-bills__content">
    {figure&&<figure className="lunch-bills__intro" hidden={f>(config.introEndFrame??0)}>{figure}</figure>}
    <section className="lunch-bills__menu" aria-labelledby="lunch-menu-title" aria-hidden={!menuVisible||undefined} style={config.menuVisibility?{visibility:menuVisible?'visible':'hidden'}:undefined}>
     <h3 id="lunch-menu-title" data-lesson-text-block={config.menuTitle.id}>{config.menuTitle.text}</h3>
     <table><tbody>{config.menu.map(row=><tr key={row.id} style={row.visible?{visibility:menuVisible&&at(row.visible,f,false)?'visible':'hidden'}:undefined}><th scope="row"><span data-lesson-text-block={row.id+'-food'} data-menu-emphasis={at(row.highlight,f,false)}>{row.text}</span></th><td data-lesson-text-block={row.id+'-price'} data-menu-emphasis={row.priceHighlight?at(row.priceHighlight,f,false):undefined}>{row.price}</td></tr>)}</tbody></table>
    </section>
    <div className="lunch-bills__accounts" hidden={config.accountsVisibleFrom!==undefined&&f<config.accountsVisibleFrom}>{config.bills.map(b=>{
     const [left,top,width,height]=b.bounds,headings=config.headings.filter(h=>h.owner===b.id),labels=config.labels.filter(l=>l.owner===b.id).map(l=>({label:l,state:at(l.states,f,null)})).filter(v=>v.state),guides=config.guides.filter(g=>g.owner===b.id||g.owner==='both').map(g=>({guide:g,state:at(g.states,f,null)})).filter(v=>v.state&&(!v.state.owner||v.state.owner===b.id||v.state.owner==='both'));
     return <section className="lunch-bills__bill" key={b.id} aria-label={b.id==='spark'?'Spark’s lunch bill':'Maria’s lunch bill'}>
      <h3>{headings.map(h=><span className="lunch-bills__heading-word" key={h.id} data-lesson-text-block={h.id} style={{visibility:f>=h.visibleFrom?'visible':'hidden'}}>{h.text}</span>)}</h3>
      <div key={replay} className="lunch-bills__port" tabIndex={0} role="region" aria-label={b.id==='spark'?'Spark’s column addition':'Maria’s column addition'} onKeyDown={e=>{
       if(e.target!==e.currentTarget||e.altKey||e.ctrlKey||e.metaKey||e.shiftKey||!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
       e.preventDefault();const p=e.currentTarget;p.scrollLeft=e.key==='Home'?0:e.key==='End'?p.scrollWidth:p.scrollLeft+(e.key==='ArrowRight'?1:-1)*Math.max(44,p.clientWidth/2);
      }}>
       <div className="lunch-bills__figure" style={{inlineSize:width*config.horizontalSpacingScale/config.unitsPerEm+'em',blockSize:height/config.unitsPerEm+'em'}}>
        {attention?.owner===b.id&&<div className="lunch-bills__attention" aria-hidden="true" style={{opacity:attention.alpha}}/>}
        {guides.map(({guide:g,state:s})=><svg key={g.id} className="lunch-bills__geometry" aria-hidden="true" viewBox={b.bounds.join(' ')} preserveAspectRatio="none" style={{zIndex:g.depth}}><g opacity={s!.alpha} transform={s!.matrix?`matrix(${s!.matrix.join(' ')})`:undefined}>{s!.image&&<image href={s!.image.source} x={s!.image.x} y={s!.image.y} width={s!.image.width} height={s!.image.height}/>} {s!.paths.map((p,i)=><path key={i} d={p.d} fill={p.fill} stroke={p.stroke} strokeWidth={p.width} strokeLinecap="round" strokeLinejoin="round"/>)}</g></svg>)}
        {/* Preserve source presence and fade progression within a readable opacity range. */}
        {labels.map(({label:l,state:s})=><span key={l.id} role="math" data-lesson-text-block={l.id} aria-label={l.text} data-source-duplicate-of={l.accessibilityDuplicateOf} data-source-text-alpha={s!.alpha} data-source-text-rgb={s!.sourceRgb?.join(',')} aria-hidden={l.emphasis||Boolean(l.accessibilityDuplicateOf)||undefined} style={{opacity:s!.alpha>0?.75+.25*Math.min(1,s!.alpha):0}}>{s!.glyphs.map(c=><span key={c.index} aria-hidden="true" data-source-glyph-x={c.x} data-source-glyph-baseline={c.baseline} className={'lunch-bills__glyph'+(l.emphasis?' lunch-bills__glyph--emphasis':'')} style={{left:100*((l.carryRoute&&f>l.carryRoute.startFrame&&f<l.carryRoute.endFrame?l.carryRoute.laneX:c.x)-left)/width+'%',top:100*(c.baseline-top)/height+'%',zIndex:l.depth,fontSize:c.fontScale!==undefined?'max(1rem, '+c.fontScale+'em)':undefined}}>{c.text}</span>)}</span>)}
       </div>
      </div>
     </section>;
    })}</div>
   </div>
  </div>
 </section>;
}

export function createLunchBillsPresentation(config:LunchBillsConfig,getFrameState:(frame:number,context:RuntimeContext)=>SourceStaticCanvasFrameState,FallbackRenderer:React.ComponentType<AnimationRendererProps>):LessonTextPresentationCapability<SourceStaticCanvasFrameState> {
 validateLessonTextBinding(config.binding);
 const getSnapshot=(state:SourceStaticCanvasFrameState,context:RuntimeContext)=>getLunchBillsSnapshot(config,state,context);
 function Renderer(props:AnimationRendererProps) {
  const context={...props,frameDomain:props.frameDomain??config.frameDomain},state=(props.state??getFrameState(props.frame,context))as SourceStaticCanvasFrameState;
  if(getSnapshot(state,context).status!=='ready')return <FallbackRenderer {...props} state={state}/>;
  return <LunchBillsScene key={props.replay??0} config={config} frame={state.frame} replay={props.replay}/>;
 }
 return {schemaVersion:1,binding:config.binding,Renderer,getSnapshot,playbackMode:'once',playbackEndFrameByDomain:{[config.frameDomain]:config.frameCount},reducedMotionFrameByDomain:{[config.frameDomain]:config.frameCount},sourceTimelineAudioCues:config.sourceAudio};
}
