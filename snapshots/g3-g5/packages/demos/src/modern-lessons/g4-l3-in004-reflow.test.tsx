import assert from 'node:assert/strict';
import test from 'node:test';
import {act,createElement} from 'react';
import {createRoot} from 'react-dom/client';
import {JSDOM} from 'jsdom';
import {G4L3In004ModernRenderer} from './g4-l3-in004';
import type {RuntimeContext} from '../contract';

// Browser-measured V535 sequence. These are viewport measurements, not a copy
// of the component's private center calculation or a replacement implementation.
async function runMeasuredSequence(deliverDelayedScroll:boolean,userScrollLeft?:number){
 const dom=new JSDOM('<!doctype html><div id="root"></div>',{url:'http://localhost/'});
 const prior=new Map<string,PropertyDescriptor|undefined>();
 let width=440,left=0;const total=2240,trace:Array<{event:string,width:number,total:number,left:number}>=[];
 const observers:Array<{callback:ResizeObserverCallback;nodes:Set<Element>}> = [];
 class ControlledResizeObserver {
  record:{callback:ResizeObserverCallback;nodes:Set<Element>};
  constructor(callback:ResizeObserverCallback){this.record={callback,nodes:new Set()};observers.push(this.record);}
  observe(node:Element){this.record.nodes.add(node);}
  unobserve(node:Element){this.record.nodes.delete(node);}
  disconnect(){this.record.nodes.clear();}
 }
 for(const name of ['window','document','HTMLElement','HTMLButtonElement','Node','navigator','IS_REACT_ACT_ENVIRONMENT','ResizeObserver']){
  prior.set(name,Object.getOwnPropertyDescriptor(globalThis,name));
  Object.defineProperty(globalThis,name,{configurable:true,writable:true,value:name==='IS_REACT_ACT_ENVIRONMENT'?true:name==='ResizeObserver'?ControlledResizeObserver:(dom.window as any)[name]});
 }
 const proto=dom.window.HTMLElement.prototype;
 const originalDimensions=new Map<string,PropertyDescriptor|undefined>();
 for(const key of ['clientWidth','scrollWidth','scrollLeft'])originalDimensions.set(key,Object.getOwnPropertyDescriptor(proto,key));
 const isViewport=(node:HTMLElement)=>node.classList.contains('in004-modern__viewport');
 Object.defineProperty(proto,'clientWidth',{configurable:true,get(){return isViewport(this)?width:0;}});
 Object.defineProperty(proto,'scrollWidth',{configurable:true,get(){return isViewport(this)?total:0;}});
 Object.defineProperty(proto,'scrollLeft',{configurable:true,get(){return isViewport(this)?left:0;},set(value:number){if(isViewport(this))left=Math.round(Math.max(0,Math.min(total-width,value)));}});
 // Integer readback models the actual capture's rounded CSS-pixel offsets.
 // The equality under test is still the actual expected endpoint 2240-853.
 const doc=dom.window.document,root=createRoot(doc.getElementById('root')!);
 const context:RuntimeContext={frame:126,frameDomain:'sprite-160',rootFrame:6,scenario:'source-static-frame',lang:'en',seed:0,replay:0};
 try{
  await act(async()=>root.render(createElement(G4L3In004ModernRenderer,{...context,paused:false})));
  const card=doc.querySelector<HTMLButtonElement>('[data-in004-focus-control="card-2"]')!;
  assert(card);await act(async()=>card.click());
  await act(async()=>root.render(createElement(G4L3In004ModernRenderer,{...context,paused:true})));
  const host=doc.querySelector<HTMLElement>('.in004-modern')!,viewport=doc.querySelector<HTMLElement>('.in004-modern__viewport')!;
  viewport.focus();assert.equal(doc.activeElement,viewport);
  const nodes=[...host.querySelectorAll('[data-lesson-text-block]')];
  const source=()=>({frame:host.dataset.lessonFrame,seed:host.dataset.lessonSeed,replay:host.dataset.lessonReplay,selected:[...host.querySelectorAll('[aria-pressed="true"]')].map(n=>n.getAttribute('data-in004-focus-control')),outcome:host.closest('[data-in004-controller]')?.getAttribute('data-interaction-outcome'),text:nodes.map(n=>({id:n.getAttribute('data-lesson-text-block'),text:n.textContent}))});
  const initial=source();assert.equal(initial.frame,'126');assert.equal(initial.seed,'0');assert.equal(initial.replay,'0');assert.deepEqual(initial.selected,['card-2']);assert.equal(card.disabled,true,'Actual paused renderer disables answer control');assert.equal(nodes.length,28);
  const observe=(event:string)=>trace.push({event,width,total,left:viewport.scrollLeft});
  viewport.scrollLeft=1800;
  await act(async()=>viewport.dispatchEvent(new dom.window.Event('scroll')));observe('actual-end-scroll');
  const resize=async(next:number)=>{width=next;await act(async()=>{for(const observer of observers)if(observer.nodes.size){assert(observer.nodes.has(viewport),'Product observes actual viewport');observer.callback([...observer.nodes].map(target=>({target})) as ResizeObserverEntry[],observer as unknown as ResizeObserver);}});observe('resize-'+next);};
  await resize(949);assert.equal(viewport.scrollLeft,1291);
  await resize(914);assert.equal(viewport.scrollLeft,1326);
  if(deliverDelayedScroll){await act(async()=>viewport.dispatchEvent(new dom.window.Event('scroll')));observe('queued-scroll-at-current-914');}
  if(userScrollLeft!==undefined){viewport.scrollLeft=userScrollLeft;await act(async()=>viewport.dispatchEvent(new dom.window.Event('scroll')));observe('changed-user-scroll-at-914');}
  await resize(853);
  assert.equal(doc.querySelector('.in004-modern'),host,'Native host retained');
  assert.deepEqual([...host.querySelectorAll('[data-lesson-text-block]')],nodes,'Teaching nodes retained');
  assert.deepEqual(source(),initial,'Source frame, selection, seed, Replay and teaching text unchanged');
  assert.equal(card.disabled,true);assert.equal(doc.activeElement,viewport);
  console.log(JSON.stringify({simulation:'measured-reflow-sequence',deliverDelayedScroll,userScrollLeft,trace,sourceState:initial.frame,selected:initial.selected}));
  assert.equal(viewport.scrollLeft,userScrollLeft===undefined?1387:1131,userScrollLeft===undefined?'Preserve original viewed coordinate through intermediate resize clamps and queued scroll':'A changed user scroll must update the viewed coordinate, not be discarded with programmatic events');
 }finally{
  await act(async()=>root.unmount());
  assert(observers.length>0,'Actual product ResizeObserver installed');
  assert(observers.every(o=>o.nodes.size===0),'ResizeObserver disconnected on unmount');
  for(const [key,descriptor]of originalDimensions){if(descriptor)Object.defineProperty(proto,key,descriptor);else Reflect.deleteProperty(proto,key);}
  dom.window.close();for(const [name,descriptor]of prior){if(descriptor)Object.defineProperty(globalThis,name,descriptor);else Reflect.deleteProperty(globalThis,name);}
 }
}

test('measured End anchor survives width 440→949→914→853 without queued scroll',()=>runMeasuredSequence(false));
test('measured End anchor survives queued resize scroll at width914 and left1326',()=>runMeasuredSequence(true));

test('changed user scroll after intermediate resize establishes the next anchor',()=>runMeasuredSequence(true,1100));
