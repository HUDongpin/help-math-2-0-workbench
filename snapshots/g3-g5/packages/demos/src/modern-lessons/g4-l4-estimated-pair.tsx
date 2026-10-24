'use client';

import React, {useEffect, useLayoutEffect, useRef, useState} from 'react';
import type {AnimationRendererProps, AudioCue, RuntimeContext} from '../contract';
import type {LessonTextActivityDefinition, LessonTextActivitySnapshot, LessonTextBinding, LessonTextKeyTermsCapability, LessonTextPresentationCapability, TextPresentationSnapshot} from '../lesson-text-contract';
import type {SourceStaticCanvasFrameState} from '../source-static-canvas-candidate';
import {validateLessonTextBinding} from '../lesson-text-snapshot';
import {LessonSourceButton} from '../lesson-source-button';
import {numberLineValue as at} from './g4-l4-number-line';

type Curve<T> = readonly (readonly [number, T])[];
type SourceShape = Readonly<{character:number;sourceTagSha256:string; paths:readonly Readonly<{d:string;fill:string;stroke:string;width:number}>[]}>;
type Placement = Readonly<{kind:"shape"|"text";character:number;matrix:readonly number[];alpha:number;path:string;bounds:readonly number[];depth?:number}>;
type Label = Placement & Readonly<{id?:string;position:readonly number[];color:string}>;
type Tile = Readonly<{id:string;block:string;character:number;sourceInstance:string;lifetime:Readonly<{firstFrame:number;lastFrameExclusive:number}>;text:string;label:Label;bounds:readonly number[];shapes:readonly Placement[];target?:string|null;problem?:string;column?:string}>;
type Token = Readonly<{text:string;entryId:string|null;color:string}>;
export interface EstimatedPairConfig {
 readonly animationId:string;readonly placementId:string;readonly sourceSwfSha256:string;
 readonly frameDomain:string;readonly rootFrame:6;readonly fps:12;readonly frameCount:number;readonly holdFrame:number;readonly required:number;
 readonly figureLabel?:string;
 readonly binding:LessonTextBinding;
 readonly blocks:readonly (LessonTextBinding['blocks'][number]&{readonly text:string})[];
 readonly prompts:readonly Readonly<{character:number;exercise:boolean;tokens:readonly Readonly<{id:string;text:string;alpha:Curve<number>;color:Curve<string>;entryId:string|null}>[]}>[];
 readonly scene:Readonly<{
  geometry:readonly Readonly<{id:string;states:Curve<Placement|null>}>[];
  labels:readonly Readonly<{id:string;states:Curve<Label|null>}>[];
  cursor:Curve<Readonly<{matrix:readonly number[];alpha:number;depth:number}>|null>;
  cursorSource:string|null;cursorBounds:readonly number[];headerCharacters:readonly number[];shapes:readonly SourceShape[];
 }>;
 readonly layout:Readonly<{bounds:readonly number[];unitsPerEm:readonly number[];initialFocusX:number}>;
 readonly cards:readonly Tile[];readonly targets:readonly Tile[];
 readonly activities:readonly LessonTextActivityDefinition[];
 readonly help:Readonly<{rows:readonly Readonly<{id:string;character:number;tokens:readonly Token[]}>[];arrowCrops:readonly (readonly number[])[];arrow:Readonly<{character:number;matrix:readonly number[]}>;sourceInstance:string;sourceHostGap:string}>|null;
 readonly terms:readonly Readonly<{button:number;key:string;entryId:string;scope:string;activeFrames:readonly (readonly number[])[]}>[];
 readonly keyTerms:LessonTextKeyTermsCapability;readonly sourceAudio:AudioCue&{readonly sha256:string};
}
export type EstimatedPairControllerConfig = Pick<EstimatedPairConfig,'frameDomain'|'holdFrame'|'frameCount'|'required'|'activities'> & Readonly<{
 readonly cards:readonly Readonly<{id:string;target?:string|null}>[];
 readonly help:object|null;
}>;
type OwnedChild = Readonly<{id:string;floor:number;revision:number|null;token:string|null}>;
export interface EstimatedPairState {
 readonly seed:number;readonly replay:number;readonly placed:readonly string[];readonly selected:string|null;
 readonly wrongOpen:boolean;readonly helpOpen:boolean;readonly phase:'idle'|'coach'|'final'|'continued';
 readonly children:readonly OwnedChild[];readonly focus:string|null;readonly attempts:number;
}
export const createEstimatedPairState = (seed=0,replay=0):EstimatedPairState => ({seed:seed>>>0,replay,placed:[],selected:null,wrongOpen:false,helpOpen:false,phase:'idle',children:[],focus:null,attempts:0});
const allActivities = (r:AnimationRendererProps) => r.lessonActivities??(r.lessonActivity?[r.lessonActivity]:[]);
const definition = (c:EstimatedPairControllerConfig,id:string) => c.activities.find(a=>a.id===id);
export function observeEstimatedChild(c:EstimatedPairControllerConfig,s:EstimatedPairState,id:string,all:readonly LessonTextActivitySnapshot[]) {
 const child=s.children.find(x=>x.id===id),d=definition(c,id);
 if(!child||!d)return undefined;
 const found=all.filter(a=>a.id===id&&a.sourceInstanceId===d.sourceInstanceId&&a.frameDomain===d.frameDomain
  &&Number.isSafeInteger(a.revision)&&a.revision>child.floor&&Number.isInteger(a.frame)&&a.frame>=d.startFrame&&a.frame<=d.endFrame
  &&Boolean(a.cancellationToken)&&(child.revision===null||child.revision===a.revision)&&(child.token===null||child.token===a.cancellationToken));
 return found.length===1?found[0]:undefined;
}
export function bindEstimatedChildren(c:EstimatedPairControllerConfig,s:EstimatedPairState,all:readonly LessonTextActivitySnapshot[]) {
 let changed=false;
 const children=s.children.map(child=>{
  if(child.revision!==null)return child;
  const a=observeEstimatedChild(c,s,child.id,all);if(!a)return child;
  changed=true;return {...child,revision:a.revision,token:a.cancellationToken!};
 });
 return changed?{...s,children}:s;
}
export function synchronizeEstimatedPairState(c:EstimatedPairControllerConfig,s:EstimatedPairState,r:RuntimeContext,all:readonly LessonTextActivitySnapshot[]=[]) {
 const reset=()=>createEstimatedPairState(r.seed,r.replay??0);
 if(s.seed!==(r.seed>>>0)||s.replay!==(r.replay??0)||(r.frameDomain??c.frameDomain)!==c.frameDomain||r.frame<c.holdFrame)return reset();
 if(r.frame>c.holdFrame)return s.phase==='continued'?s:reset();
 if(s.children.some(child=>child.revision!==null&&!observeEstimatedChild(c,s,child.id,all)))return reset();
 return s;
}
function requestChild(c:EstimatedPairControllerConfig,s:EstimatedPairState,id:string,r:AnimationRendererProps) {
 const d=definition(c,id)!;const all=allActivities(r);
 const floor=Math.max(-1,...all.filter(a=>a.sourceInstanceId===d.sourceInstanceId&&Number.isSafeInteger(a.revision)).map(a=>a.revision),
  ...s.children.filter(child=>definition(c,child.id)?.sourceInstanceId===d.sourceInstanceId).map(child=>child.revision??child.floor));
 if(r.onLessonActivityRequest?.({id,parentFrame:c.holdFrame})!==true)return null;
 return [...s.children.filter(child=>definition(c,child.id)?.sourceInstanceId!==d.sourceInstanceId),{id,floor,revision:null,token:null}];
}
const permitted=(c:EstimatedPairControllerConfig,s:EstimatedPairState,r:AnimationRendererProps)=>r.lang==='en'&&r.scenario==='source-static-frame'&&!r.entryStateSha256
 &&(r.rootFrame??6)===6&&(r.frameDomain??c.frameDomain)===c.frameDomain&&r.frame===c.holdFrame&&!r.paused
 &&(r.seed>>>0)===s.seed&&(r.replay??0)===s.replay&&s.phase!=='continued';
export type EstimatedPairAction = {type:'select';card:string}|{type:'drop';card?:string;target:string|null}|{type:'close-wrong'}|{type:'help';open:boolean}|{type:'advance'};
export function dispatchEstimatedPair(c:EstimatedPairControllerConfig,s:EstimatedPairState,action:EstimatedPairAction,r:AnimationRendererProps):EstimatedPairState {
 if(!permitted(c,s,r))return s;
 if(action.type==='close-wrong')return s.wrongOpen?{...s,wrongOpen:false,focus:s.focus??c.cards.find(card=>!s.placed.includes(card.id))?.id??null}:s;
 if(action.type==='help'){
  if(!c.help||s.wrongOpen||!['idle','final'].includes(s.phase)||action.open===s.helpOpen)return s;
  return {...s,helpOpen:action.open,selected:null,focus:action.open?'help':'help-button'};
 }
 if(action.type==='advance'){
  if(s.phase==='coach'){
   const a=observeEstimatedChild(c,s,'estimated-coach',allActivities(r));
   if(!a||a.status!=='completed'||a.frame!==20)return s;
   if(s.placed.length<c.required)return {...s,phase:'idle',focus:c.cards.find(card=>!s.placed.includes(card.id))?.id??null};
   const children=requestChild(c,s,'estimated-final',r);return children?{...s,children,phase:'final',focus:'final'}:s;
  }
  if(s.phase==='final'){
   const a=observeEstimatedChild(c,s,'estimated-final',allActivities(r));
   if(s.placed.length!==c.required||!a||a.status!=='completed'||a.frame!==25)return s;
   if(r.onLessonFrameRequest?.({fromFrame:c.holdFrame,toFrame:c.holdFrame+1,stopFrame:c.frameCount})!==true)return s;
   return {...s,phase:'continued',helpOpen:false,wrongOpen:false,selected:null,focus:'replay'};
  }
  return s;
 }
 if(s.phase!=='idle'||s.wrongOpen||s.helpOpen)return s;
 const id=action.type==='select'?action.card:action.card??s.selected,card=c.cards.find(card=>card.id===id);
 if(!card||s.placed.includes(card.id))return s;
 if(action.type==='select')return {...s,selected:card.id,focus:card.id};
 const correct=card.target!==null&&card.target!==undefined&&card.target===action.target;
 const children=requestChild(c,s,correct?'estimated-coach':'estimated-wrong',r);if(!children)return s;
 return {...s,children,selected:null,attempts:s.attempts+1,placed:correct?[...s.placed,card.id]:s.placed,
  wrongOpen:!correct,phase:correct?'coach':'idle',focus:correct?null:card.id};
}
export function getEstimatedPairSnapshot(c:EstimatedPairConfig,state:SourceStaticCanvasFrameState,r:RuntimeContext,s=createEstimatedPairState(r.seed,r.replay??0),all:readonly LessonTextActivitySnapshot[]=[]):TextPresentationSnapshot {
 const valid=Boolean(state&&state.status==='ready'&&state.animationId===c.animationId&&state.sourceSwfSha256===c.sourceSwfSha256
  &&state.frame===r.frame&&Number.isInteger(r.frame)&&r.frame>=1&&r.frame<=c.frameCount&&state.frameDomain===c.frameDomain&&(r.frameDomain??c.frameDomain)===c.frameDomain
  &&state.rootFrame===6&&(r.rootFrame??6)===6&&state.language==='en'&&r.lang==='en'&&state.scenario==='source-static-frame'&&r.scenario===state.scenario&&state.seed===(r.seed>>>0)&&!r.entryStateSha256);
 const session=synchronizeEstimatedPairState(c,s,r,all),visible=new Set<string>(['title']);
 for(const p of c.prompts)for(const token of p.tokens)if(at(token.alpha,r.frame,0)>0)visible.add(token.id);
 for(const track of c.scene.labels){const item=at(track.states,r.frame,null);if(item&&item.alpha>0)visible.add(track.id);}
 for(const tile of c.cards)if(r.frame>=tile.lifetime.firstFrame&&r.frame<tile.lifetime.lastFrameExclusive&&!session.placed.includes(tile.id))visible.add(tile.block);
 for(const tile of c.targets)if(r.frame>=tile.lifetime.firstFrame&&r.frame<tile.lifetime.lastFrameExclusive&&c.cards.some(card=>card.target===tile.id&&session.placed.includes(card.id)))visible.add(tile.block);
 if(r.frame===c.holdFrame&&session.wrongOpen){visible.add('wrong');visible.add('close');}
 const final=observeEstimatedChild(c,session,'estimated-final',all);
 if(session.phase==='final'&&final&&final.frame>=2&&final.frame<25)visible.add('final');
 if(c.help&&r.frame===c.holdFrame){visible.add('help-button');if(session.helpOpen){for(const row of c.help.rows)visible.add(row.id);visible.add('close');}}
 if(session.helpOpen){for(const id of [...visible])if(id!=='title'&&id!=='close'&&!id.startsWith('help-'))visible.delete(id);visible.delete('help-button');}
 return {schemaVersion:1,animationId:c.animationId,bindingVersion:c.binding.version,sourceSwfSha256:c.sourceSwfSha256,status:valid?'ready':'blocked',blockers:valid?[]:['exact-source-runtime-identity-mismatch'],
  identity:{frame:state?.frame??r.frame,frameDomain:state?.frameDomain??c.frameDomain,rootFrame:state?.rootFrame??6,scenario:r.scenario,language:r.lang,seed:r.seed,replay:r.replay??0},suppressedInstances:[],
  blocks:c.blocks.map(b=>({id:b.id,text:b.text,role:b.role,language:b.language,readingOrder:b.readingOrder,visible:valid&&visible.has(b.id)}))};
}

const CSS=`
.estimated-pair{box-sizing:border-box;inline-size:100%;min-inline-size:0;background:#fffdf7;color:#17273c;padding:.75rem;font:1.25rem/1.6 var(--lesson-font-body,system-ui,sans-serif)}
.estimated-pair *{box-sizing:border-box}.estimated-pair h2{font:700 1.5em/1.35 var(--lesson-font-display,system-ui,sans-serif);overflow-wrap:normal;word-break:normal;hyphens:none;margin:0 0 .5em}.estimated-pair p{margin:.6em 0}
.estimated-pair button{font:inherit;cursor:pointer}.estimated-pair button:disabled{cursor:default}.estimated-pair button:focus-visible,.estimated-pair [tabindex]:focus-visible{outline:3px solid #1556a0;outline-offset:3px}
.estimated-pair__term{display:inline;border:0;padding:0;margin:0;background:transparent;color:#064fb3;text-decoration:underline;text-underline-offset:.15em;line-height:inherit}
.estimated-pair__port{max-inline-size:100%;overflow-x:auto;padding:.6rem .3rem;overscroll-behavior-inline:contain}.estimated-pair__figure{position:relative;font-size:1.125rem;line-height:1.15;margin-inline:auto}
.estimated-pair__geometry{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}.estimated-pair__label{position:absolute;transform:translate(-50%,-50%);white-space:pre;line-height:1.3;font-variant-numeric:tabular-nums;pointer-events:none}
.estimated-pair__header{white-space:normal;text-align:center;max-inline-size:10em;font-weight:650}.estimated-pair__tile{position:absolute;border:2px solid transparent;border-radius:.35rem;background:transparent;min-width:44px;min-height:44px;padding:0;touch-action:none;line-height:1.2;font-variant-numeric:tabular-nums}
.estimated-pair__tile{color:#17273c}.estimated-pair__tile:disabled{pointer-events:none;color:#17273c;opacity:1;-webkit-text-fill-color:#17273c}.estimated-pair__tile[aria-pressed=true]{outline:3px solid #1556a0;outline-offset:3px;background:rgba(21,86,160,.08)}.estimated-pair__target:enabled{border:2px dashed #285e7f}.estimated-pair__target:enabled:hover{background:rgba(255,255,255,.35)}
.estimated-pair__action{border:1px solid #1556a0;border-radius:.35rem;background:#1556a0;color:white;padding:.4em .8em;min-width:44px;min-height:44px}
.estimated-pair__feedback{border:2px solid #9a5c28;border-radius:.5rem;padding:1rem;background:#fff4e2}.estimated-pair__final{border-color:#2b6c43;background:#edf8ef}.estimated-pair__help{border:2px solid #51759d;border-radius:.5rem;padding:1rem;background:#fff}.estimated-pair__help-controls{display:flex;justify-content:flex-end}
.estimated-pair__help-port{max-width:100%;overflow-x:auto}.estimated-pair__math{display:grid;grid-template-columns:4.3ch 1.5ch 4.3ch 1.5ch 4.3ch;column-gap:.15em;min-width:max-content;font-size:1.3rem;line-height:1.5;margin:.4em 0;font-variant-numeric:tabular-nums;text-align:center}.estimated-pair__math-row{display:contents}.estimated-pair__arrow{height:2.2em;width:1em;justify-self:center}.estimated-pair__hint{font-size:1rem}.estimated-pair__badge{display:inline-block;background:#17273c;color:#fff;padding:.1em .5em;border-radius:50%;margin-inline-end:.5em}
.estimated-pair [data-source-alpha]{transition:none!important}@media(max-width:480px){.estimated-pair{padding-inline:0}.estimated-pair h2{font-size:1.25rem}.estimated-pair__help{padding:.6rem}}
`;
export function EstimatedPairScene({c,r,s,snapshot,onAction}:{c:EstimatedPairConfig;r:AnimationRendererProps;s:EstimatedPairState;snapshot:TextPresentationSnapshot;onAction:(a:EstimatedPairAction)=>void}) {
 const root=useRef<HTMLElement>(null),port=useRef<HTMLDivElement>(null),manual=useRef(false),wasWrong=useRef(false),lastFocus=useRef<string|null>(null);
 const drag=useRef<{id:string;pointer:number;x:number;y:number;moved:boolean}|null>(null),suppressClick=useRef<string|null>(null);
 const [offset,setOffset]=useState<{id:string;x:number;y:number}|null>(null);
 const [minX,minY,width,height]=c.layout.bounds,px=(x:number)=>(x-minX)/width*100+'%',py=(y:number)=>(y-minY)/height*100+'%';
 const rect=(b:readonly number[])=>({left:px(b[0]),top:py(b[2]),width:(b[1]-b[0])/width*100+'%',height:(b[3]-b[2])/height*100+'%'});
 const visible=(id:string)=>snapshot.blocks.some(b=>b.id===id&&b.visible),text=(id:string)=>c.blocks.find(b=>b.id===id)?.text??'';
 const enabled=r.frame===c.holdFrame&&!r.paused&&s.phase==='idle'&&!s.wrongOpen&&!s.helpOpen&&Boolean(r.onLessonActivityRequest&&r.onLessonFrameRequest);
 const helpEnabled=r.frame===c.holdFrame&&!r.paused&&!s.wrongOpen&&!s.helpOpen&&['idle','final'].includes(s.phase)&&Boolean(r.onLessonButtonActivityRequest);
 useLayoutEffect(()=>{manual.current=false;},[r.replay]);
 useLayoutEffect(()=>{
  const p=port.current;if(!p||s.helpOpen)return;
  const center=()=>{if(manual.current)return;const fig=p.firstElementChild as HTMLElement|null;if(fig){const f=fig.getBoundingClientRect(),v=p.getBoundingClientRect();p.scrollLeft+=f.left+(c.layout.initialFocusX-minX)/width*fig.clientWidth-v.left-p.clientWidth/2;}};
  center();const observer=typeof ResizeObserver==='undefined'?null:new ResizeObserver(center);observer?.observe(p);return()=>observer?.disconnect();
 },[r.replay,s.helpOpen]);
 useLayoutEffect(()=>{
  const focus=s.helpOpen?'help':s.wrongOpen?'wrong-close':s.focus;
  if(focus&&(focus!==lastFocus.current||s.wrongOpen&&!wasWrong.current)){
   const target=root.current?.querySelector<HTMLElement>(`[data-estimated-focus="${focus}"]`);
   if(target){target.focus();lastFocus.current=focus;}
  }else if(!focus)lastFocus.current=null;
  wasWrong.current=s.wrongOpen;
 },[s.helpOpen,s.wrongOpen,s.focus,s.phase,visible('final'),r.frame===c.frameCount]);
 useEffect(()=>{if(r.paused||r.frame!==c.holdFrame||s.helpOpen||s.wrongOpen){drag.current=null;setOffset(null);}},[r.paused,r.frame,s.helpOpen,s.wrongOpen]);
 useEffect(()=>()=>{drag.current=null;},[r.seed,r.replay]);
 const draw=(character:number)=>c.scene.shapes.find(shape=>shape.character===character)!.paths.map((path,i)=><path key={i} d={path.d} fill={path.fill} stroke={path.stroke} strokeWidth={path.width} strokeLinecap="round" strokeLinejoin="round"/>);
 const shape=(item:Placement,key:string)=>item.alpha<=0?null:<g key={key} opacity={item.alpha} transform={`matrix(${item.matrix.join(' ')})`} data-source-shape={item.character}>{draw(item.character)}</g>;
 const glossary=(label:string,entryId:string|null,scope:string,color?:string)=>{
  if(!entryId)return label;
  const term=c.terms.find(t=>t.entryId===entryId&&t.scope===scope);if(!term)return label;
  const available=term.activeFrames.some(([first,last])=>r.frame>=first&&r.frame<last);
  return <>{label.match(/^\s*/)?.[0]}<button type="button" className="estimated-pair__term" style={{color}} data-source-keyterm={term.key} data-source-button={term.button} data-keyterm-entry-id={entryId}
   disabled={!available||!r.onLessonHostRequest||s.wrongOpen} onClick={event=>r.onLessonHostRequest?.({type:'open-keyterm',entryId,sourceAnimationId:c.animationId,playbackDisposition:'source-stop-timeline-and-audio-until-explicit-resume'},{trigger:event.currentTarget,keyTermIndexLanguage:'en'})}>{label.trim()}</button>{label.match(/\s*$/)?.[0]}</>;
 };
 const scrollKeys=(event:React.KeyboardEvent<HTMLDivElement>)=>{
  if(event.target!==event.currentTarget||event.altKey||event.ctrlKey||event.metaKey||event.shiftKey||!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
  event.preventDefault();manual.current=true;const p=event.currentTarget;p.scrollLeft=event.key==='Home'?0:event.key==='End'?p.scrollWidth:p.scrollLeft+(event.key==='ArrowRight'?1:-1)*44;
 };
 const release=(event:React.PointerEvent<HTMLButtonElement>)=>{
  const current=drag.current;if(!current||current.pointer!==event.pointerId)return;drag.current=null;setOffset(null);
  if(!current.moved)return;suppressClick.current=current.id;
  const target=document.elementFromPoint(event.clientX,event.clientY)?.closest<HTMLElement>('[data-estimated-target]');
  const id=target&&root.current?.contains(target)?target.dataset.estimatedTarget??null:null;
  onAction({type:'drop',card:current.id,target:id});
 };
 const cursor=at(c.scene.cursor,r.frame,null);
 return <section ref={root} className="estimated-pair" lang="en" data-modern-text-page={c.animationId} data-lesson-frame={r.frame} data-lesson-replay={r.replay??0} data-flash-frame-domain={c.frameDomain} data-flash-root-frame="6"
  data-estimated-phase={s.phase} data-estimated-placed={s.placed.join(',')} data-estimated-selected={s.selected??''} data-estimated-wrong={s.wrongOpen?'open':'closed'} data-estimated-help={s.helpOpen?'open':'closed'} data-estimated-attempts={s.attempts} data-estimated-activities={JSON.stringify(allActivities(r).map(({id,sourceInstanceId,frameDomain,frame,status,revision,cancellationToken})=>({id,sourceInstanceId,frameDomain,frame,status,revision,cancellationToken})))}>
  <style>{CSS}</style><h2 data-lesson-text-block="title">{text('title')}</h2>
  <div hidden={s.helpOpen}>
   {c.prompts.map(p=><p key={p.character} style={p.exercise?{visibility:p.tokens.some(t=>at(t.alpha,r.frame,0)>0)?'visible':'hidden'}:undefined} className={p.exercise?'estimated-pair__badge':undefined}>{p.tokens.map(token=>{
    const alpha=at(token.alpha,r.frame,0),color=at(token.color,r.frame,'#17273c');
    return <span key={token.id} data-lesson-text-block={token.id} data-source-alpha={alpha} aria-hidden={alpha<=0} style={{visibility:alpha>0?'visible':'hidden',opacity:alpha,color}}>{glossary(token.text,token.entryId,'prompt',color)}</span>;
   })}</p>)}
   {r.frame===c.holdFrame&&<p className="estimated-pair__hint">Select an answer, then select a box. You can also drag the answers.</p>}
   {s.wrongOpen&&<div className="estimated-pair__feedback" role="region" aria-label="Try again"><p data-lesson-text-block="wrong">{text('wrong')}</p><LessonSourceButton runtime={r} activityId="estimated-wrong-close" className="estimated-pair__action" type="button" disabled={!!r.paused} data-estimated-focus="wrong-close" data-lesson-text-block="close" onClick={()=>onAction({type:'close-wrong'})}>{text('close')}</LessonSourceButton></div>}
   {visible('final')&&<div className="estimated-pair__feedback estimated-pair__final" role="status" tabIndex={-1} data-estimated-focus="final"><strong data-lesson-text-block="final">{text('final')}</strong></div>}
   <div ref={port} className="estimated-pair__port" role="region" aria-label={c.figureLabel??"Problems with estimated sum and estimated difference drop areas"} tabIndex={0} onKeyDown={scrollKeys} onPointerDown={()=>{manual.current=true;}} onWheel={()=>{manual.current=true;}}>
    <div className="estimated-pair__figure" style={{width:width/c.layout.unitsPerEm[0]+'em',height:height/c.layout.unitsPerEm[1]+'em'}}>
     {c.scene.geometry.map(track=>{const item=at(track.states,r.frame,null);return item&&<svg key={track.id} className="estimated-pair__geometry" viewBox={c.layout.bounds.join(' ')} preserveAspectRatio="none" aria-hidden="true" focusable="false" style={{zIndex:item.depth}}>{shape(item,track.id)}</svg>;})}
     {c.scene.labels.map(track=>{const item=at(track.states,r.frame,null);if(!item||item.alpha<=0)return null;const header=c.scene.headerCharacters.includes(item.character);return <span key={track.id} className={'estimated-pair__label'+(header?' estimated-pair__header':'')} data-lesson-text-block={track.id} data-source-alpha={item.alpha} data-source-character={item.character} style={{left:px(item.position[0]),top:py(item.position[1]),opacity:item.alpha,color:item.color,zIndex:item.depth,width:header?text(track.id).startsWith('Estimated')?'7em':'max-content':undefined}}>{text(track.id)}</span>;})}
     {cursor&&cursor.alpha>0&&c.scene.cursorSource&&<svg className="estimated-pair__geometry" viewBox={c.layout.bounds.join(' ')} preserveAspectRatio="none" aria-hidden="true" focusable="false" style={{zIndex:cursor.depth}} data-source-cursor="32" data-source-alpha={cursor.alpha}><g transform={`matrix(${cursor.matrix.join(' ')})`} opacity={cursor.alpha}><image href={c.scene.cursorSource} x={c.scene.cursorBounds[0]} y={c.scene.cursorBounds[1]} width={c.scene.cursorBounds[2]} height={c.scene.cursorBounds[3]}/></g></svg>}
     {c.targets.filter(t=>r.frame>=t.lifetime.firstFrame&&r.frame<t.lifetime.lastFrameExclusive).map(tile=>{
      const revealed=visible(tile.block);return <React.Fragment key={tile.id}>
       {revealed&&<svg className="estimated-pair__geometry" viewBox={c.layout.bounds.join(' ')} preserveAspectRatio="none" aria-hidden="true" focusable="false" style={{zIndex:100}}>{tile.shapes.map((item,i)=>shape(item,tile.id+i))}</svg>}
       <button type="button" className="estimated-pair__tile estimated-pair__target" style={{...rect(tile.bounds),zIndex:110}} data-estimated-target={tile.id} data-source-instance={tile.sourceInstance} data-estimated-revealed={revealed} disabled={!enabled||revealed} aria-label={`${tile.column} for ${tile.problem}${revealed?': '+tile.text:''}`} onClick={()=>onAction({type:'drop',target:tile.id})}>
        {revealed&&<span data-lesson-text-block={tile.block}>{tile.text}</span>}
       </button>
      </React.Fragment>;
     })}
     {c.cards.filter(tile=>visible(tile.block)).map(tile=>{
      const shift=offset?.id===tile.id?offset:null;
      return <React.Fragment key={tile.id}>
       {!shift&&<svg className="estimated-pair__geometry" viewBox={c.layout.bounds.join(' ')} preserveAspectRatio="none" aria-hidden="true" focusable="false" style={{zIndex:120}}>{tile.shapes.map((item,i)=>shape(item,tile.id+i))}</svg>}
       <button type="button" className="estimated-pair__tile" data-estimated-card={tile.id} data-estimated-focus={tile.id} data-source-instance={tile.sourceInstance} data-lesson-text-block={tile.block} aria-pressed={s.selected===tile.id} disabled={!enabled}
        style={{...rect(tile.bounds),zIndex:shift?150:130,transform:shift?`translate(${shift.x}px,${shift.y}px)`:undefined,background:shift?'white':undefined,pointerEvents:shift?'none':undefined}}
        onClick={event=>{if(suppressClick.current===tile.id&&event.detail>0){suppressClick.current=null;return;}suppressClick.current=null;onAction({type:'select',card:tile.id});}}
        onPointerDown={event=>{if(event.button!==0||!enabled)return;suppressClick.current=null;drag.current={id:tile.id,pointer:event.pointerId,x:event.clientX,y:event.clientY,moved:false};event.currentTarget.setPointerCapture(event.pointerId);}}
        onPointerMove={event=>{const d=drag.current;if(!d||d.pointer!==event.pointerId||!enabled)return;const x=event.clientX-d.x,y=event.clientY-d.y;if(!d.moved&&Math.hypot(x,y)<6)return;d.moved=true;setOffset({id:d.id,x,y});}}
        onPointerUp={release} onPointerCancel={()=>{drag.current=null;setOffset(null);}}>{tile.text}</button>
      </React.Fragment>;
     })}
    </div>
   </div>
   {c.help&&r.frame===c.holdFrame&&<LessonSourceButton type="button" runtime={r} activityId="estimated-help-open" className="estimated-pair__action" disabled={!helpEnabled} data-estimated-focus="help-button" data-lesson-text-block="help-button" onClick={()=>onAction({type:'help',open:true})}>{text('help-button')}</LessonSourceButton>}
  </div>
  {s.helpOpen&&c.help&&<div className="estimated-pair__help" role="dialog" aria-modal="true" aria-label={text('help-button')} tabIndex={-1} data-estimated-focus="help" onKeyDown={event=>{
   if(event.key==='Escape'){event.preventDefault();onAction({type:'help',open:false});return;}
   if(event.key!=='Tab')return;const controls=Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled),[tabindex="0"]'));if(!controls.length)return;
   const first=controls[0],last=controls[controls.length-1];if(event.shiftKey&&(document.activeElement===first||document.activeElement===event.currentTarget)){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  }}>
   <div className="estimated-pair__help-controls"><LessonSourceButton type="button" runtime={r} activityId="estimated-help-close" className="estimated-pair__action" disabled={!!r.paused} data-lesson-text-block="close" onClick={()=>onAction({type:'help',open:false})}>{text('close')}</LessonSourceButton></div>
   {[0,1].map(index=>{
    const [instruction,source,result]=c.help!.rows.slice(index*3,index*3+3),top=text(source.id).trim().split(/\s+/),bottom=text(result.id).trim().split(/\s+/);
    return <div key={instruction.id}><p data-lesson-text-block={instruction.id}>{instruction.tokens.map((token,i)=><span key={i} style={{color:token.color}}>{glossary(token.text,token.entryId,'help')}</span>)}</p>
     <div className="estimated-pair__help-port" role="region" aria-label="Rounding example" tabIndex={0} onKeyDown={scrollKeys}><div className="estimated-pair__math">
      <div className="estimated-pair__math-row" data-lesson-text-block={source.id}>{[...top,''].map((v,i)=><span key={i}>{v}</span>)}</div>
      {[0,1,2,3,4].map(col=>(col===0||col===2)?<svg key={col} className="estimated-pair__arrow" viewBox={c.help!.arrowCrops[index*2+(col===2?1:0)].join(' ')} aria-hidden="true" focusable="false" data-source-shape="90">{draw(90)}</svg>:<span key={col}/>)}
      <div className="estimated-pair__math-row" data-lesson-text-block={result.id}>{bottom.map((v,i)=><span key={i}>{v}</span>)}</div>
     </div></div>
    </div>;
   })}
  </div>}
  {r.frame===c.frameCount&&s.phase==='continued'&&<button type="button" className="estimated-pair__action" disabled={!r.onReplay} data-estimated-focus="replay" onClick={r.onReplay}>Replay</button>}
 </section>;
}

export function createEstimatedPairPresentation(c:EstimatedPairConfig,getFrameState:(frame:number,context:RuntimeContext)=>SourceStaticCanvasFrameState,Fallback:React.ComponentType<AnimationRendererProps>):LessonTextPresentationCapability<SourceStaticCanvasFrameState> {
 validateLessonTextBinding(c.binding);
 function Renderer(r:AnimationRendererProps){
  const context={...r,frameDomain:r.frameDomain??c.frameDomain},state=(r.state??getFrameState(r.frame,context))as SourceStaticCanvasFrameState;
  const [stored,setStored]=useState(()=>createEstimatedPairState(r.seed,r.replay??0)),all=allActivities(r),s=synchronizeEstimatedPairState(c,stored,context,all);
  const snapshot=getEstimatedPairSnapshot(c,state,context,s,all),live=useRef(s),runtime=useRef(r);live.current=s;runtime.current=r;
  const commit=(next:EstimatedPairState)=>{if(next!==live.current){live.current=next;setStored(next);}};
  useEffect(()=>{if(snapshot.status!=='ready'||r.paused||r.frame!==c.holdFrame)return;const bound=bindEstimatedChildren(c,s,all);if(bound!==s){commit(bound);return;}commit(dispatchEstimatedPair(c,s,{type:'advance'},r));},[s,all,r.frame,r.paused,snapshot.status]);
  useEffect(()=>()=>{const props=runtime.current;for(const child of live.current.children){if(child.revision===null||!child.token)continue;const a=allActivities(props).find(a=>a.id===child.id&&a.revision===child.revision&&a.cancellationToken===child.token);if(a)props.onLessonActivityCancel?.({id:a.id,sourceInstanceId:a.sourceInstanceId,revision:a.revision,cancellationToken:child.token,parentFrame:props.frame});}},[r.seed,r.replay]);
  if(snapshot.status!=='ready')return <Fallback {...r} state={state}/>;
  return <EstimatedPairScene key={`${r.seed}:${r.replay??0}`} c={c} r={r} s={s} snapshot={snapshot} onAction={a=>commit(dispatchEstimatedPair(c,live.current,a,runtime.current))}/>;
 }
 return {schemaVersion:1,binding:c.binding,Renderer,getSnapshot:(s,r)=>getEstimatedPairSnapshot(c,s,r),playbackMode:'once',playbackEndFrameByDomain:{[c.frameDomain]:c.holdFrame},reducedMotionFrameByDomain:{[c.frameDomain]:c.holdFrame},frameControl:{frameDomain:c.frameDomain,completionFrame:c.frameCount,transitions:[{fromFrame:c.holdFrame,toFrame:c.holdFrame+1,stopFrame:c.frameCount}]},activityTimelines:c.activities,sourceTimelineAudioCues:[c.sourceAudio],keyTerms:c.keyTerms};
}
