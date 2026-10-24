'use client';

import React,{useEffect,useLayoutEffect,useRef,useState} from 'react';
import type {AnimationRendererProps,AudioCue,RuntimeContext} from '../contract';
import type {LessonTextBinding,LessonTextActivitySnapshot,LessonTextKeyTermsCapability,LessonTextPresentationCapability,TextPresentationSnapshot} from '../lesson-text-contract';
import type {SourceStaticCanvasFrameState} from '../source-static-canvas-candidate';
import {validateLessonTextBinding} from '../lesson-text-snapshot';
import {LessonSourceButton} from '../lesson-source-button';
import {ColumnArithmeticScene,getColumnTeachingState,type ColumnArithmeticConfig} from './g4-l4-column-arithmetic';
import {numberLineValue as at} from './g4-l4-number-line';
import {createEstimatedPairState,synchronizeEstimatedPairState,dispatchEstimatedPair,bindEstimatedChildren,observeEstimatedChild,type EstimatedPairControllerConfig,type EstimatedPairState,type EstimatedPairAction} from './g4-l4-estimated-pair';

type Curve<T>=readonly(readonly[number,T])[];
type Placement=Readonly<{sourceInstanceId:string;character:number;matrix:readonly number[];alpha:number}>;
type Block=LessonTextBinding['blocks'][number]&Readonly<{text:string}>;
export interface KeyTermDragConfig extends EstimatedPairControllerConfig {
 readonly animationId:string;readonly placementId:string;readonly sourceSwfSha256:string;readonly rootFrame:6;readonly fps:12;
 readonly binding:LessonTextBinding;readonly blocks:readonly Block[];
 readonly prompt:Readonly<{id:string;alpha:Curve<number>}>;readonly exercise:Readonly<{id:string;alpha:Curve<number>}>;
 readonly headers:readonly Readonly<{id:string;alpha:Curve<number>}>[];
 readonly cards:readonly Readonly<{id:string;target:string;text:string;block:string;targetBlock:string;sourcePlacement:Placement;targetPlacement:Placement;demonstration:Curve<Placement|null>}>[];
 readonly rows:readonly Readonly<{target:string;term:string;definitionBlock:string;definitionAlpha:Curve<number>;definitionTokens:readonly Readonly<{text:string;entryId:string|null;sourceButton?:number;sourceKey?:string}>[];pictureBlocks:readonly string[];pictureAlpha:Readonly<Record<string,Curve<number>>>;miniature?:ColumnArithmeticConfig;annotation?:Readonly<{equationLeft:string;answer:string;caption:string;sourceShape:number;sourceTagSha256:string;viewBox:readonly number[];arrowPaths:readonly Readonly<{d:string;fill:string;stroke:string;width:number}>[]}>}>[];
 readonly panels:readonly Readonly<{id:string;name:string;instructionBlock:string;activityId:string;column:ColumnArithmeticConfig;sourceButtons:readonly number[]}>[];
 readonly sourceAudio:AudioCue&Readonly<{sha256:string}>;readonly keyTerms:LessonTextKeyTermsCapability;
}
export interface KeyTermDragState extends EstimatedPairState {readonly panel:string|null}
export const createKeyTermDragState=(seed=0,replay=0):KeyTermDragState=>({...createEstimatedPairState(seed,replay),panel:null});
const childrenOf=(r:AnimationRendererProps)=>r.lessonActivities??(r.lessonActivity?[r.lessonActivity]:[]);
export function synchronizeKeyTermDrag(c:KeyTermDragConfig,s:KeyTermDragState,r:RuntimeContext,children:readonly LessonTextActivitySnapshot[]=[]) :KeyTermDragState {
 const next=synchronizeEstimatedPairState(c,s,r,children);
 return next===s?s:{...next,panel:null};
}
export type KeyTermDragAction=EstimatedPairAction|{type:'open-panel';name:string}|{type:'close-panel'};
export function dispatchKeyTermDrag(c:KeyTermDragConfig,s:KeyTermDragState,a:KeyTermDragAction,r:AnimationRendererProps):KeyTermDragState {
 if(a.type==='open-panel'||a.type==='close-panel'){
  if(r.lang!=='en'||r.scenario!=='source-static-frame'||r.entryStateSha256||r.paused||(r.rootFrame??6)!==6||(r.frameDomain??c.frameDomain)!==c.frameDomain||r.frame<c.holdFrame||r.frame>c.frameCount||s.seed!==(r.seed>>>0)||s.replay!==(r.replay??0))return s;
  if(a.type==='close-panel'){
   if(!s.panel)return s;
   const panel=c.panels.find(p=>p.name===s.panel)!,child=observeEstimatedChild(c,s,panel.activityId,childrenOf(r));
   if(child&&child.cancellationToken)r.onLessonActivityCancel?.({id:child.id,sourceInstanceId:child.sourceInstanceId,revision:child.revision,cancellationToken:child.cancellationToken,parentFrame:r.frame});
   return {...s,panel:null,children:s.children.filter(x=>x.id!==panel.activityId),focus:'open-'+panel.name};
  }
  const panel=c.panels.find(p=>p.name===a.name);if(!panel||s.panel||s.wrongOpen)return s;
  const d=c.activities.find(x=>x.id===panel.activityId)!;
  const floor=Math.max(-1,...childrenOf(r).filter(x=>x.sourceInstanceId===d.sourceInstanceId).map(x=>x.revision),...s.children.filter(x=>x.id===d.id).map(x=>x.revision??x.floor));
  if(r.onLessonActivityRequest?.({id:d.id,parentFrame:r.frame})!==true)return s;
  return {...s,panel:panel.name,selected:null,focus:'panel',children:[...s.children.filter(x=>x.id!==d.id),{id:d.id,floor,revision:null,token:null}]};
 }
 if(s.panel&&a.type!=='advance')return s;
 const next=dispatchEstimatedPair(c,s,a,r);return next===s?s:{...next,panel:s.panel};
}
export function getKeyTermDragSnapshot(c:KeyTermDragConfig,source:SourceStaticCanvasFrameState,r:RuntimeContext,stored=createKeyTermDragState(r.seed,r.replay??0),children:readonly LessonTextActivitySnapshot[]=[]):TextPresentationSnapshot {
 const valid=source?.status==='ready'&&source.animationId===c.animationId&&source.sourceSwfSha256===c.sourceSwfSha256&&source.frame===r.frame&&Number.isInteger(r.frame)&&r.frame>=1&&r.frame<=c.frameCount&&source.frameDomain===c.frameDomain&&(r.frameDomain??c.frameDomain)===c.frameDomain&&source.rootFrame===6&&(r.rootFrame??6)===6&&source.language==='en'&&r.lang==='en'&&source.scenario==='source-static-frame'&&r.scenario===source.scenario&&source.seed===(r.seed>>>0)&&!r.entryStateSha256;
 const s=synchronizeKeyTermDrag(c,stored,r,children),visible=new Set<string>(['title']);
 for(const item of [c.prompt,c.exercise,...c.headers])if(at(item.alpha,r.frame,0)>0)visible.add(item.id);
 for(const card of c.cards){const demo=at(card.demonstration,r.frame,null);if(demo&&demo.alpha>0&&!s.placed.includes(card.id))visible.add(card.block);if(s.placed.includes(card.id))visible.add(card.targetBlock);}
 for(const row of c.rows){if(at(row.definitionAlpha,r.frame,0)>0)visible.add(row.definitionBlock);for(const [id,curve]of Object.entries(row.pictureAlpha))if(at(curve,r.frame,0)>0)visible.add(id);if(row.miniature)for(const b of getColumnTeachingState(row.miniature,r.frame).blocks)if(b.role==='label'&&b.visible)visible.add(b.id);}
 if(s.wrongOpen){visible.add('wrong');visible.add('wrong-close');}
 const final=observeEstimatedChild(c,s,'estimated-final',children);if(s.phase==='final'&&final&&final.frame>=2&&final.frame<25)visible.add('final');
 const panel=c.panels.find(p=>p.name===s.panel);
 if(panel){visible.clear();visible.add('title');visible.add('enlargement-close');visible.add(panel.instructionBlock);const activity=observeEstimatedChild(c,s,panel.activityId,children);for(const b of getColumnTeachingState(panel.column,activity?.frame??1).blocks)if(b.role==='label'&&b.visible)visible.add(b.id);}
 return {schemaVersion:1,animationId:c.animationId,bindingVersion:c.binding.version,sourceSwfSha256:c.sourceSwfSha256,status:valid?'ready':'blocked',blockers:valid?[]:['exact-source-runtime-identity-mismatch'],identity:{frame:source?.frame??r.frame,frameDomain:source?.frameDomain??c.frameDomain,rootFrame:source?.rootFrame??6,scenario:r.scenario,language:r.lang,seed:r.seed,replay:r.replay??0},suppressedInstances:[],blocks:c.blocks.map(b=>({id:b.id,text:b.text,role:b.role,language:b.language,readingOrder:b.readingOrder,visible:valid&&visible.has(b.id)}))};
}

const CSS=`
.key-term-drag{box-sizing:border-box;container:key-term-drag / inline-size;inline-size:100%;min-inline-size:0;padding:.75rem;background:#fffdf7;color:#17273c;font:1.25rem/1.6 var(--lesson-font-body,system-ui,sans-serif)}
.key-term-drag *{box-sizing:border-box}.key-term-drag>h2{font:500 clamp(1.75rem,1.5rem + 1cqi,2.25rem)/1.25 var(--lesson-font-display,system-ui,sans-serif);margin:0 0 .5em;overflow-wrap:anywhere;word-break:normal;hyphens:auto}.key-term-drag p{margin:.5em 0}.key-term-drag button{font:inherit;cursor:pointer;min-height:44px}.key-term-drag button:focus-visible,.key-term-drag [tabindex]:focus-visible{outline:3px solid #1556a0;outline-offset:3px}.key-term-drag button:disabled{cursor:default;color:inherit;opacity:1}
.key-term-drag__bank{display:flex;flex-wrap:wrap;gap:.6em;margin:1em 0;padding:.6em;background:#edf3f9;border-radius:.5rem}.key-term-drag__home{position:relative}.key-term-drag__card{background:white;border:2px solid #2b6189;border-radius:.4em;padding:.35em .65em;touch-action:none;position:relative;z-index:5;white-space:nowrap;transition:none!important}.key-term-drag__card[aria-pressed=true]{outline:3px solid #f3af28;outline-offset:2px}.key-term-drag__card:disabled{pointer-events:none}
.key-term-drag__row,.key-term-drag__headers{display:grid;grid-template-columns:minmax(8em,.7fr) minmax(10em,1fr) minmax(15em,1.8fr);gap:1em;align-items:start}.key-term-drag__headers>span:last-child{grid-column:3;grid-row:2;font-size:.9em;font-weight:400}.key-term-drag__annotation{display:grid;grid-template-columns:max-content max-content;column-gap:.35em;align-items:start;justify-content:start;font-variant-numeric:tabular-nums}.key-term-drag__annotation svg{grid-column:2;width:2em;height:1.35em}.key-term-drag__annotation .caption{grid-column:1/-1;text-align:end}.key-term-drag__headers{font-weight:700;border-bottom:2px solid #aac0d0;padding:.5em}.key-term-drag__row{border-bottom:1px solid #b6c7d4;padding:1em .5em}.key-term-drag__row>div{min-width:0}.key-term-drag__target{width:100%;min-height:3em;border:2px dashed #2b6189;border-radius:.4em;background:#f5f9fc;padding:.35em;line-height:1.3}.key-term-drag__target[data-filled=true]{border-style:solid;background:#e4f2e7}
.key-term-drag__term{display:inline;min-height:0!important;border:0;padding:0;margin:0;background:transparent;color:#064fb3!important;text-decoration:underline;text-underline-offset:.15em;line-height:inherit}.key-term-drag__picture{white-space:pre-line;font-variant-numeric:tabular-nums}.key-term-drag__copy{white-space:pre-line}.key-term-drag__action{background:#1556a0;color:white!important;border:1px solid #1556a0;border-radius:.4em;padding:.35em .75em}.key-term-drag__open{display:block;margin:.5em auto}.key-term-drag__feedback{scroll-margin-block-start:calc(var(--lesson-platform-header-height,0px) + env(safe-area-inset-top) + 1rem);padding:1em;border:2px solid #9a5c28;border-radius:.5em;background:#fff4e2}.key-term-drag__final{border-color:#2b6c43;background:#edf8ef}.key-term-drag__panel{border:2px solid #51759d;border-radius:.5em;padding:.6em;scroll-margin-block-start:calc(var(--lesson-platform-header-height,0px) + env(safe-area-inset-top) + 1rem)}.key-term-drag__panel-controls{display:flex;justify-content:flex-end}
.key-term-drag .g4l4-column{padding:0;background:transparent}.key-term-drag .g4l4-column__figure{font-size:1.2rem}.key-term-drag .g4l4-column h2{font:inherit;line-height:1.6;white-space:pre-line;margin:0 0 .5em}.key-term-drag__miniature .g4l4-column__port{margin:0}.key-term-drag__miniature .g4l4-column__figure{font-size:1rem}.key-term-drag__hint{font-size:1rem;font-weight:400}.key-term-drag__badge{display:inline-block;border-radius:50%;background:#17273c;color:white;padding:.1em .6em;margin-right:.6em}
@container key-term-drag (max-width:12rem){.key-term-drag>h2{font-variation-settings:"wdth" 75}}
@media(max-width:850px){.key-term-drag{font-size:1.125rem}}
@container key-term-drag (max-width:44rem){.key-term-drag__row{grid-template-columns:minmax(8em,.7fr) minmax(10em,1.3fr)}.key-term-drag__row>div:last-child{grid-column:1/-1}.key-term-drag__headers{display:flex;flex-wrap:wrap;justify-content:space-between}.key-term-drag__headers>span:last-child{width:100%}}
@container key-term-drag (max-width:28rem){.key-term-drag__row{display:flex;flex-direction:column;gap:.5em;padding:.75em 0}.key-term-drag__row>div{width:100%}.key-term-drag__bank{gap:.4em;padding:.4em}}
@media(max-width:480px){.key-term-drag{padding:.4rem}}
`;
const trap=(e:React.KeyboardEvent<HTMLElement>,close:()=>void)=>{if(e.key==='Escape'){e.preventDefault();close();return;}if(e.key!=='Tab')return;const controls=Array.from(e.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled),[tabindex="0"]'));if(!controls.length)return;const first=controls[0],last=controls[controls.length-1];if(e.shiftKey&&(document.activeElement===first||document.activeElement===e.currentTarget)){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}};
export function KeyTermDragScene({c,r,s,snapshot,onAction}:{c:KeyTermDragConfig;r:AnimationRendererProps;s:KeyTermDragState;snapshot:TextPresentationSnapshot;onAction:(a:KeyTermDragAction)=>void}){
 const root=useRef<HTMLElement>(null),lastFocus=useRef<string|null>(null),drag=useRef<{id:string;pointer:number;x:number;y:number;moved:boolean}|null>(null),suppressedClick=useRef(false),manualScroll=useRef(false);
 const text=(id:string)=>c.blocks.find(b=>b.id===id)?.text??'',visible=(id:string)=>snapshot.blocks.some(b=>b.id===id&&b.visible);
 const panel=c.panels.find(p=>p.name===s.panel),enabled=r.frame===c.holdFrame&&!r.paused&&!s.wrongOpen&&!s.panel&&s.phase==='idle'&&Boolean(r.onLessonActivityRequest&&r.onLessonFrameRequest);
 const openEnabled=r.frame>=c.holdFrame&&!r.paused&&!s.wrongOpen&&!s.panel&&Boolean(r.onLessonActivityRequest&&r.onLessonButtonActivityRequest);
 useLayoutEffect(()=>{
  const focus=s.panel?'panel':s.wrongOpen?'wrong-close':s.focus;
  if(focus&&focus!==lastFocus.current){const node=root.current?.querySelector<HTMLElement>(`[data-keyterm-focus="${focus}"]`);if(node){const dialog=focus==='panel'||focus==='wrong-close'||focus==='final';node.focus({preventScroll:dialog});if(dialog)(focus==='wrong-close'?node.closest<HTMLElement>('.key-term-drag__feedback')??node:node).scrollIntoView({block:'start',inline:'nearest',behavior:'instant'});lastFocus.current=focus;}}else if(!focus)lastFocus.current=null;
 },[s.panel,s.wrongOpen,s.focus,r.replay,snapshot]);
 useLayoutEffect(()=>{
  const measure=()=>{for(const card of c.cards){const home=root.current?.querySelector<HTMLElement>(`[data-card-home="${card.id}"]`),button=home?.querySelector<HTMLElement>('button'),target=root.current?.querySelector<HTMLElement>(`[data-target="${card.target}"]`);if(!home||!button||!target||drag.current)continue;button.style.transform='';if(r.frame>=c.holdFrame)continue;const source=at(card.demonstration,r.frame,null),origin=card.demonstration.find(([,v])=>v)?.[1];if(!source||!origin)continue;const h=home.getBoundingClientRect(),t=target.getBoundingClientRect();const fraction=(axis:number)=>(source.matrix[axis]-origin.matrix[axis])/(card.targetPlacement.matrix[axis]-origin.matrix[axis]||1);button.style.transform=`translate(${fraction(4)*(t.x+t.width/2-h.x-h.width/2)}px,${fraction(5)*(t.y+t.height/2-h.y-h.height/2)}px)`;if(!manualScroll.current&&(source.matrix[4]!==origin.matrix[4]||source.matrix[5]!==origin.matrix[5]))button.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});}};
  measure();const observer=typeof ResizeObserver==='undefined'?null:new ResizeObserver(measure);if(root.current)observer?.observe(root.current);return()=>observer?.disconnect();
 },[r.frame,r.replay,s.panel,c]);
 useEffect(()=>{drag.current=null;suppressedClick.current=false;},[r.replay,r.seed,enabled]);
 const finish=(e:React.PointerEvent<HTMLButtonElement>,cancel=false)=>{const d=drag.current;if(!d||d.pointer!==e.pointerId)return;drag.current=null;e.currentTarget.style.transform='';if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);if(d.moved){suppressedClick.current=!cancel;e.currentTarget.style.pointerEvents='none';const target=cancel?null:document.elementFromPoint(e.clientX,e.clientY)?.closest<HTMLElement>('[data-target]')?.dataset.target??null;e.currentTarget.style.pointerEvents='';if(!cancel)onAction({type:'drop',card:d.id,target});}};
 return <section ref={root} onWheel={()=>{manualScroll.current=true;}} onTouchMove={()=>{manualScroll.current=true;}} className="key-term-drag" lang="en" data-modern-text-page={c.animationId} data-lesson-frame={r.frame} data-lesson-replay={r.replay??0} data-flash-frame-domain={c.frameDomain} data-flash-root-frame="6" data-keyterm-phase={s.phase} data-keyterm-placed={s.placed.join(',')} data-keyterm-panel={s.panel??''}>
  <style>{CSS}</style><h2 data-lesson-text-block="title">{text('title')}</h2>
  {!panel&&<>
   <p>{visible(c.exercise.id)&&<span className="key-term-drag__badge" data-lesson-text-block={c.exercise.id} style={{opacity:at(c.exercise.alpha,r.frame,0)}}>{text(c.exercise.id)}</span>}{visible(c.prompt.id)&&<span data-lesson-text-block={c.prompt.id} style={{opacity:at(c.prompt.alpha,r.frame,0)}}>{text(c.prompt.id).replace(/\n/g,' ')}</span>}</p>
   <div className="key-term-drag__bank" aria-label="Key term choices">{c.cards.map(card=><span key={card.id} data-card-home={card.id} className="key-term-drag__home" style={{visibility:visible(card.block)?'visible':'hidden'}}><button type="button" className="key-term-drag__card" data-lesson-text-block={card.block} data-keyterm-focus={card.id} data-card={card.id} disabled={!enabled||!visible(card.block)} aria-pressed={s.selected===card.id} style={{opacity:at(card.demonstration,r.frame,null)?.alpha??0}} onClick={()=>{if(suppressedClick.current){suppressedClick.current=false;return;}onAction({type:'select',card:card.id});}} onPointerDown={e=>{if(!enabled||e.button!==0)return;drag.current={id:card.id,pointer:e.pointerId,x:e.clientX,y:e.clientY,moved:false};e.currentTarget.setPointerCapture(e.pointerId);}} onPointerMove={e=>{const d=drag.current;if(!d||d.pointer!==e.pointerId)return;d.moved=d.moved||Math.hypot(e.clientX-d.x,e.clientY-d.y)>5;if(d.moved)e.currentTarget.style.transform=`translate(${e.clientX-d.x}px,${e.clientY-d.y}px)`;}} onPointerUp={e=>finish(e)} onPointerCancel={e=>finish(e,true)}>{text(card.block)}</button></span>)}</div>
   <div className="key-term-drag__headers">{c.headers.map(h=><span key={h.id} data-lesson-text-block={h.id} style={{opacity:at(h.alpha,r.frame,0)}}>{text(h.id)}</span>)}</div>
   {c.rows.map((row,i)=>{const card=c.cards.find(x=>x.target===row.target)!,filled=s.placed.includes(card.id),p=c.panels.find(x=>x.id.startsWith(row.term+'-'));
    return <div className="key-term-drag__row" key={row.target} data-keyterm-row={row.term}>
     <div><button type="button" className="key-term-drag__target" data-target={row.target} data-filled={filled} disabled={!enabled||filled} aria-label={filled?card.text:`Place selected term at definition ${i+1}`} onClick={()=>onAction({type:'drop',target:row.target})}>{filled&&<span data-lesson-text-block={card.targetBlock}>{text(card.targetBlock)}</span>}</button></div>
     <div data-lesson-text-block={row.definitionBlock} style={{opacity:at(row.definitionAlpha,r.frame,0)}}>{row.definitionTokens.map((token,i)=>token.entryId?<button type="button" className="key-term-drag__term" key={i} disabled={!r.onLessonHostRequest||at(row.definitionAlpha,r.frame,0)<=0||s.wrongOpen} data-source-key={token.sourceKey} data-source-button={token.sourceButton} onClick={e=>r.onLessonHostRequest?.({type:'open-keyterm',entryId:token.entryId!,sourceAnimationId:c.animationId,playbackDisposition:'source-stop-timeline-and-audio-until-explicit-resume'},{trigger:e.currentTarget,keyTermIndexLanguage:'en'})}>{token.text}</button>:<React.Fragment key={i}>{token.text}</React.Fragment>)}</div>
     <div>{row.miniature?<div className="key-term-drag__miniature"><ColumnArithmeticScene config={row.miniature} frame={r.frame} replay={r.replay??0} heading={<span style={{opacity:at(row.pictureAlpha['picture-'+row.term+(row.term==='carry'?'-104':'-111')],r.frame,0)}}>{row.term==='borrow'?text('picture-borrow-111').replace(/\n/g,' '):text('picture-carry-104')}</span>} headingBlockId={'picture-'+row.term+(row.term==='carry'?'-104':'-111')}/></div>:row.annotation?<div className="key-term-drag__annotation" data-lesson-text-block={row.pictureBlocks[0]} style={{opacity:at(row.pictureAlpha[row.pictureBlocks[0]],r.frame,0)}}><span>{row.annotation.equationLeft}</span><span>{row.annotation.answer}</span><svg aria-hidden="true" data-source-shape={row.annotation.sourceShape} viewBox={row.annotation.viewBox.join(" ")}><g>{row.annotation.arrowPaths.map((p,i)=><path key={i} d={p.d} stroke={p.stroke} fill={p.fill} strokeWidth={p.width} strokeLinecap="round" strokeLinejoin="round"/>)}</g></svg><span className="caption">{row.annotation.caption}</span></div>:row.pictureBlocks.map(id=><p key={id} className="key-term-drag__picture" data-lesson-text-block={id} style={{opacity:at(row.pictureAlpha[id],r.frame,0)}}>{text(id)}</p>)}
      {p&&r.frame>=c.holdFrame&&<button type="button" className="key-term-drag__action key-term-drag__open" data-keyterm-focus={'open-'+p.name} data-enlarge={p.name} data-source-buttons={p.sourceButtons.join(',')} disabled={!openEnabled} aria-label={'Enlarge '+row.term+' picture'} onClick={()=>onAction({type:'open-panel',name:p.name})}>{text('heading-65')}</button>}
     </div>
    </div>;
   })}
   {s.wrongOpen&&<div className="key-term-drag__feedback" role="dialog" aria-modal="true" aria-label={text('wrong')} onKeyDown={e=>trap(e,()=>onAction({type:'close-wrong'}))}><p data-lesson-text-block="wrong">{text('wrong')}</p><button type="button" className="key-term-drag__action" data-keyterm-focus="wrong-close" data-lesson-text-block="wrong-close" disabled={!!r.paused} onClick={()=>onAction({type:'close-wrong'})}>{text('wrong-close')}</button></div>}
   {visible('final')&&<p className="key-term-drag__feedback key-term-drag__final" role="status" tabIndex={-1} data-keyterm-focus="final" data-lesson-text-block="final">{text('final')}</p>}
  </>}
  {panel&&<div className="key-term-drag__panel" role="dialog" aria-modal="true" tabIndex={-1} aria-label={'Enlarged '+panel.id.split('-')[0]+' example'} data-keyterm-focus="panel" data-enlarged-panel={panel.name} onKeyDown={e=>trap(e,()=>onAction({type:'close-panel'}))}>
   <div className="key-term-drag__panel-controls"><LessonSourceButton type="button" className="key-term-drag__action" runtime={r} activityId={'close-'+panel.name} data-lesson-text-block="enlargement-close" disabled={!!r.paused} onClick={()=>onAction({type:'close-panel'})}>{text('enlargement-close')}</LessonSourceButton></div>
   <ColumnArithmeticScene config={panel.column} frame={observeEstimatedChild(c,s,panel.activityId,childrenOf(r))?.frame??1} replay={r.replay??0} heading={<span className="key-term-drag__copy">{text(panel.instructionBlock)}</span>} headingBlockId={panel.instructionBlock}/>
  </div>}
 </section>;
}

export function createKeyTermDragPresentation(c:KeyTermDragConfig,getFrameState:(frame:number,r:RuntimeContext)=>SourceStaticCanvasFrameState,Fallback:React.ComponentType<AnimationRendererProps>):LessonTextPresentationCapability<SourceStaticCanvasFrameState>{
 validateLessonTextBinding(c.binding);
 function Session(r:AnimationRendererProps){
  const context={...r,frameDomain:r.frameDomain??c.frameDomain},source=(r.state??getFrameState(r.frame,context))as SourceStaticCanvasFrameState;
  const [stored,setStored]=useState(()=>createKeyTermDragState(r.seed,r.replay??0)),all=childrenOf(r),s=synchronizeKeyTermDrag(c,stored,context,all),snapshot=getKeyTermDragSnapshot(c,source,context,s,all);
  const live=useRef(s),runtime=useRef(r);live.current=s;runtime.current=r;
  const commit=(next:KeyTermDragState)=>{if(next!==live.current){live.current=next;setStored(next);}};
  useEffect(()=>{if(snapshot.status!=='ready'||r.paused)return;const bound=bindEstimatedChildren(c,s,all);if(bound!==s){commit({...bound,panel:s.panel});return;}commit(dispatchKeyTermDrag(c,s,{type:'advance'},r));},[s,all,r.frame,r.paused,snapshot.status]);
  useEffect(()=>()=>{const props=runtime.current;for(const child of live.current.children){const a=observeEstimatedChild(c,live.current,child.id,childrenOf(props));if(a?.cancellationToken)props.onLessonActivityCancel?.({id:a.id,sourceInstanceId:a.sourceInstanceId,revision:a.revision,cancellationToken:a.cancellationToken,parentFrame:props.frame});}},[r.seed,r.replay]);
  if(snapshot.status!=='ready')return <Fallback {...r} state={source}/>;
  return <KeyTermDragScene key={`${r.seed}:${r.replay??0}`} c={c} r={r} s={s} snapshot={snapshot} onAction={a=>commit(dispatchKeyTermDrag(c,live.current,a,runtime.current))}/>;
 }
 function Renderer(r:AnimationRendererProps){
  const context={...r,frameDomain:r.frameDomain??c.frameDomain},source=(r.state??getFrameState(r.frame,context))as SourceStaticCanvasFrameState;
  if(getKeyTermDragSnapshot(c,source,context).status!=='ready')return <Fallback {...r} state={source}/>;
  return <Session key={`${r.seed}:${r.replay??0}:${r.lang}:${r.scenario}:${source.sourceSwfSha256}:${source.frameDomain}`} {...r} state={source}/>;
 }
 return {schemaVersion:1,binding:c.binding,Renderer,getSnapshot:(s,r)=>getKeyTermDragSnapshot(c,s,r),playbackMode:'once',playbackEndFrameByDomain:{[c.frameDomain]:c.holdFrame},reducedMotionFrameByDomain:{[c.frameDomain]:c.holdFrame},frameControl:{frameDomain:c.frameDomain,completionFrame:c.frameCount,transitions:[{fromFrame:c.holdFrame,toFrame:c.holdFrame+1,stopFrame:c.frameCount}]},activityTimelines:c.activities,sourceTimelineAudioCues:[c.sourceAudio],keyTerms:c.keyTerms};
}
