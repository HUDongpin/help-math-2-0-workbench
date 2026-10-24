'use client';
import React,{useLayoutEffect,useRef} from 'react';
import {useWholeNumericInk} from './whole-numeric-ink';
import {getFocusPlan,nearestScroll} from './focus-policy.mjs';
import type {AnimationRendererProps} from '../../contract';
import type {SourceStaticCanvasFrameState} from '../../source-static-canvas-candidate';
import {getCourseG04L03In007FrameState} from '../../modules/course-g04-l03-in-007';
import SOURCE from './source.generated.json';
import {getNativeState,keywordHostRequest} from './state.mjs';
import GEOMETRY from './geometry.generated.json';
import {ID,DOMAIN,snapshot} from './binding';
import {requestIn007KeyTerm as dispatchIn007KeyTerm} from './audio-host';
const X0=-7400,Y0=-1200,W=14700,H=3100;
const styles=`.in007-modern{font-family:var(--lesson-font-body,"Nunito Sans",system-ui,sans-serif);color:#14213d;display:grid;gap:1rem;min-inline-size:0;max-inline-size:72rem;margin-inline:auto;container:in007 / inline-size}.in007-modern *{box-sizing:border-box}.in007-modern h2{font:600 1.5rem/1.3 var(--lesson-font-display,"Fredoka",system-ui,sans-serif);margin:0}.in007-modern p{font-size:var(--lesson-text-body-size,1.25rem);line-height:1.6;max-inline-size:70ch;margin:0}.in007-modern__prose{min-block-size:3.2em}.in007-modern button{font:inherit;min-block-size:44px;min-inline-size:44px;cursor:pointer}.in007-modern .in007-modern__term{display:inline;padding:.1rem .15rem;border:0;border-radius:.2rem;background:transparent;color:#164eaa;text-decoration:underline;text-underline-offset:.15em;vertical-align:baseline}.in007-modern button:focus-visible,.in007-modern__viewport:focus-visible{outline:3px solid #155ac1;outline-offset:3px}.in007-modern__sequence{display:flex;flex-wrap:wrap;align-items:baseline;gap:.45rem;font-size:max(18px,1.25rem);line-height:1.6}.in007-modern__prefix-token{display:inline-block;white-space:nowrap}.in007-modern__prefix-token[data-emphasized=true] .in007-modern__prefix-value{color:#a300a3;text-decoration:underline;text-underline-offset:.15em}.in007-modern__slot{display:inline-flex;flex-wrap:nowrap;align-items:baseline;gap:.45rem;white-space:nowrap}.in007-modern__blank{display:inline-flex;min-inline-size:3rem;min-block-size:2.75rem;align-items:center;justify-content:center;border-block-end:2px solid #365071;font-variant-numeric:tabular-nums}.in007-modern__blank[data-emphasized=true]{background:#edf4ff;border-color:#155ac1;border-block-end-width:4px}.in007-modern__viewport{max-inline-size:100%;overflow-x:auto;border:1px solid #7a879c;border-radius:.75rem;overscroll-behavior-inline:contain;scroll-padding-inline:1rem;scroll-behavior:auto;background:#fffdf7}.in007-modern__diagram{position:relative;inline-size:80rem;block-size:18rem}.in007-modern__diagram svg{position:absolute;inset:0;inline-size:100%;block-size:100%}.in007-modern__label,.in007-modern__jump-label{position:absolute;transform:translateX(-50%);font-size:max(18px,1.125rem);line-height:1.5;font-variant-numeric:tabular-nums;white-space:nowrap;text-align:center;min-inline-size:2.75rem;padding:.15rem;background:#fffdf7;transition-property:none}.in007-modern__label{top:65%}.in007-modern__label,.in007-modern__jump-label{opacity:0}.in007-modern__label[data-numeric-ink=full],.in007-modern__jump-label[data-numeric-ink=full]{opacity:1}.in007-modern__label[data-emphasized=true]{font-weight:800;background:#edf4ff;color:#164eaa;text-decoration:underline;text-underline-offset:.15em}.in007-modern__jump-label{font-weight:700;color:#8d2900}.in007-modern__diagram path{vector-effect:non-scaling-stroke;transition-property:none}@container in007 (max-width:40rem){.in007-modern p{font-size:1.125rem}.in007-modern h2{font-size:max(22px,1.35rem)}}`;
export function requestIn007KeyTerm(runtime:AnimationRendererProps,button:number,trigger:HTMLElement,sourceVisibleAndReady:boolean){
 const context={...runtime,frameDomain:runtime.frameDomain??DOMAIN};
 const state=(runtime.state??getCourseG04L03In007FrameState(runtime.frame,runtime)) as SourceStaticCanvasFrameState;
 if(!sourceVisibleAndReady||snapshot(state,context).status!=='ready'||runtime.entryStateSha256)return null;
 if(!getNativeState(SOURCE,state.frame).keyTerms.some((term:any)=>term.sourceButtonId===button))return null;
 return dispatchIn007KeyTerm(context,button,trigger,true);
}
export function deliverKeyword(runtime:AnimationRendererProps,frame:number,key:string,trigger:HTMLElement){
 const context={...runtime,frameDomain:runtime.frameDomain??DOMAIN};
 const state=(runtime.state??getCourseG04L03In007FrameState(runtime.frame,runtime)) as SourceStaticCanvasFrameState;
 if(frame!==runtime.frame||snapshot(state,context).status!=='ready'||runtime.entryStateSha256||!runtime.onLessonHostRequest)return false;
 const term=getNativeState(SOURCE,frame).keyTerms.find((t:any)=>t.keyAttribute===key);if(!term)return false;
 requestIn007KeyTerm(context,term.sourceButtonId,trigger,true);return true;
}
function wholeLabelPosition(label:any){
 const b=GEOMETRY.textBounds[String(label.textId) as keyof typeof GEOMETRY.textBounds];
 const m=GEOMETRY.bounds[String(label.minusId) as keyof typeof GEOMETRY.bounds];
 const left=Math.min(b.left+label.textMatrix[4],m.left*label.minusMatrix[0]+label.minusMatrix[4]);
 const right=Math.max(b.right+label.textMatrix[4],m.right*label.minusMatrix[0]+label.minusMatrix[4]);
 return{left:`${((left+right)/2-X0)/W*100}%`,top:`${(b.top+label.textMatrix[5]-Y0)/H*100}%`};
}
/** Repositions only for a new authored target/replay or changed geometry/font metrics. */
function useDiagramFocus(plan:{target:number;key:string;includeMovingLabel:boolean}|null){
 const viewport=useRef<HTMLDivElement>(null);
 useLayoutEffect(()=>{
  const host=viewport.current;if(!host||!plan)return;
  let active=true;
  const apply=(reason:string)=>{
   if(!active||host.clientWidth===0)return;
   const label=host.querySelector<HTMLElement>(`[data-number-label="${plan.target}"]`);if(!label)return;
   const targets=[label,...(plan.includeMovingLabel?host.querySelectorAll<HTMLElement>('[data-lesson-text-block="moving-minus-three"]'):[])];
   const clip=host.getBoundingClientRect(),origin=clip.left+host.clientLeft;
   const margin=Math.max(16,...targets.map(n=>parseFloat(getComputedStyle(n).fontSize)/2));
   const rects=targets.flatMap(n=>{const range=document.createRange();range.selectNodeContents(n);const result=Array.from(range.getClientRects()).filter(r=>r.width>0&&r.height>0).map(r=>({left:r.left-origin,right:r.right-origin,top:r.top-(clip.top+host.clientTop),bottom:r.bottom-(clip.top+host.clientTop)}));range.detach();return result;});
   const result=nearestScroll({current:host.scrollLeft,maxScroll:host.scrollWidth-host.clientWidth,viewportWidth:host.clientWidth,margin,rects});
   const vertical=rects.every(r=>r.top>=margin&&r.bottom<=host.clientHeight-margin);
   host.dataset.focusTarget=String(plan.target);host.dataset.focusPhase=plan.key;host.dataset.focusReason=reason;host.dataset.focusInkStatus=vertical?result.status:'vertical-ink-clipped';
   if(vertical&&result.status==='scroll-nearest')host.scrollLeft=result.left;
   if(vertical&&['scroll-nearest','already-visible'].includes(result.status)){
    const after=targets.flatMap(n=>{const range=document.createRange();range.selectNodeContents(n);const rects=Array.from(range.getClientRects()).filter(r=>r.width>0&&r.height>0);range.detach();return rects;});
    const complete=after.every(r=>r.left>=origin+margin-.5&&r.right<=origin+host.clientWidth-margin+.5);
    host.dataset.focusInkComplete=String(complete);if(!complete)host.dataset.focusInkStatus='post-scroll-ink-clipped';
   }else host.dataset.focusInkComplete='false';
  };
  apply('semantic');
  const diagram=host.querySelector('.in007-modern__diagram');
  const dimensions=()=>{const bounds=diagram?.getBoundingClientRect();return [host.clientWidth,host.clientHeight,bounds?.width,bounds?.height].join(':');};
  let lastDimensions=dimensions();
  const observer=typeof ResizeObserver==='undefined'?null:new ResizeObserver(()=>{const next=dimensions();if(next!==lastDimensions){lastDimensions=next;apply('resize');}});
  observer?.observe(host);if(diagram)observer?.observe(diagram);
  const fonts=()=>apply('fonts');document.fonts?.addEventListener('loadingdone',fonts);void document.fonts?.ready.then(()=>{if(active)apply('fonts');});
  return()=>{active=false;observer?.disconnect();document.fonts?.removeEventListener('loadingdone',fonts);};
 },[plan?.key]);
 return viewport;
}
export function In007Renderer(runtime:AnimationRendererProps){
 const state=(runtime.state??getCourseG04L03In007FrameState(runtime.frame,runtime)) as SourceStaticCanvasFrameState;
 const context={...runtime,frameDomain:runtime.frameDomain??DOMAIN};const view=snapshot(state,context);
 const safeFrame=Number.isInteger(state.frame)&&state.frame>=1&&state.frame<=555?state.frame:1;
 const s=getNativeState(SOURCE,safeFrame),viewportRef=useDiagramFocus(view.status==='ready'?getFocusPlan(s,runtime.replay??0):null);
 useWholeNumericInk(viewportRef,view.status==='ready'&&s.axisLabels.length>0);
 if(view.status!=='ready')return <p role="status">This lesson view is unavailable in the selected context.</p>;
 const blocks=Object.fromEntries(view.blocks.map(b=>[b.id,b]));
 const paragraph=(text:string)=>text.split(/(\bpattern\b|\bset\b|\bsymbols\b|\brule\b)/g).map((part,i)=>{
  const key=({pattern:'Pattern',set:'Set',symbols:'Symbol',rule:'Rule'} as Record<string,string>)[part];const term=s.keyTerms.find((t:any)=>t.keyAttribute===key);
  return term&&runtime.onLessonHostRequest&&!runtime.entryStateSha256?<button key={i} className="in007-modern__term" type="button" data-keyterm-entry-id={term.entryId} data-source-button-id={term.sourceButtonId} onClick={event=>deliverKeyword(runtime,state.frame,key,event.currentTarget)}>{part}</button>:part;
 });
 return <section className="in007-modern" lang="en" data-modern-text-page={ID} data-lesson-text-status="ready" data-lesson-frame={state.frame} data-lesson-seed={state.seed} data-lesson-replay={runtime.replay??0} data-source-alpha-admission="full-opacity-modern-readability">
  <style>{styles}</style>
  <h2 data-lesson-text-block="title">{blocks.title.text}</h2>
  <div className="in007-modern__prose">{[0,1].map(i=>blocks[`instruction-${i}`].visible?<p key={i} data-lesson-text-block={`instruction-${i}`}>{paragraph(blocks[`instruction-${i}`].text)}</p>:null)}</div>
  {s.patternPrefix&&<div className="in007-modern__sequence" aria-label="Number pattern">
   <span data-lesson-text-block="pattern-prefix">{s.patternPrefix.split(',').map((v:string)=>v.trim()).filter(Boolean).map((value:string,index:number)=><React.Fragment key={index}><span className="in007-modern__prefix-token" data-source-prefix-index={index} data-emphasized={s.prefixEmphasis?.prefixIndex===index} data-emphasis-source-text={s.prefixEmphasis?.prefixIndex===index?s.prefixEmphasis.sourceTextId:undefined} data-emphasis-source-matrix={s.prefixEmphasis?.prefixIndex===index?JSON.stringify(s.prefixEmphasis.matrix):undefined}><span className="in007-modern__prefix-value">{value}</span>,</span>{index<4?' ':null}</React.Fragment>)}</span>
   {s.fillTexts.map((value:string|null,i:number)=><span className="in007-modern__slot" key={i}><span className="in007-modern__blank" data-lesson-text-block={`fill-${i}`} data-emphasized={s.source.blankEmphasis} data-filled={value!==null} aria-label={value===null?`Blank ${i+1}`:undefined}>{value}</span>{i<2?<span aria-hidden="true">,</span>:null}</span>)}
  </div>}
  {s.axisLabels.length>0&&<div ref={viewportRef} className="in007-modern__viewport" role="region" aria-label="Number line from minus twelve to twelve. Scroll to explore." tabIndex={0}>
   <div className="in007-modern__diagram">
    <svg viewBox={`${X0} ${Y0} ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label={s.arrow?`${s.arrow.jumpCount} jumps of minus three from twelve; latest target ${s.arrow.to}.`:'Number line'}>
     <path data-source-shape="30" d={GEOMETRY.paths[30]} transform={`matrix(${GEOMETRY.numberLineMatrix.join(' ')})`} fill="none" stroke="#273e5e" strokeWidth={1.5}/>
     <path data-source-shape="48" d={GEOMETRY.paths[48]} transform={`matrix(${GEOMETRY.pointMatrix.join(' ')})`} fill="none" stroke="#273e5e" strokeWidth={2}/>
     {s.arrow&&<path data-source-shape={s.arrow.shapeId} d={SOURCE.shapePaths[String(s.arrow.shapeId) as keyof typeof SOURCE.shapePaths]} transform={`matrix(${s.arrow.matrix.join(' ')})`} fill="none" stroke="#8d2900" strokeWidth={2.5}/>}
    </svg>
    {s.axisLabels.map((a:{value:number,text:string},i:number)=><span key={a.value} className="in007-modern__label" data-number-label={a.value} data-lesson-text-block={`tick-${a.value}`} data-emphasized={s.signedFlash?.value===a.value} style={{left:`${(GEOMETRY.ticks[i]-X0)/W*100}%`}}>{a.text}</span>)}
    {s.movingLabels.map((a:any,i:number)=><span key={i} className="in007-modern__jump-label" data-lesson-text-block="moving-minus-three" data-source-text={a.textId} data-source-minus={a.minusId} style={wholeLabelPosition(a)}>{a.text}</span>)}
   </div>
  </div>}
 </section>;
}
