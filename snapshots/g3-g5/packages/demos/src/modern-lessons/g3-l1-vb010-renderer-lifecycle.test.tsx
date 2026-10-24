import assert from'node:assert/strict';import test from'node:test';
import React,{act}from'react';import{JSDOM}from'jsdom';import{createRoot}from'react-dom/client';
import type{AnimationRendererProps}from'../contract';
import {G3_L1_VB010_TEXT_PRESENTATION as P}from'./g3-l1-vb010-capability';
import {VB010_CONFIG as c}from'./generated/g3-l1-vb010-source';
test('mounted native Renderer persists seek/Replay resets and does not revive stale branches',async()=>{
 const dom=new JSDOM('<!doctype html><div id="test"></div>',{url:'http://localhost/'}),prior=new Map<string,PropertyDescriptor|undefined>();
 for(const[k,v]of Object.entries({window:dom.window,document:dom.window.document,HTMLElement:dom.window.HTMLElement,IS_REACT_ACT_ENVIRONMENT:true})){prior.set(k,Object.getOwnPropertyDescriptor(globalThis,k));Object.defineProperty(globalThis,k,{value:v,writable:true,configurable:true});}
 dom.window.HTMLElement.prototype.scrollIntoView=()=>{};const root=createRoot(dom.window.document.getElementById('test')!);const Renderer=P.Renderer!;
 let r:AnimationRendererProps={frame:75,frameDomain:'sprite-255',rootFrame:6,lang:'en',scenario:'source-static-frame',seed:0,replay:0,lessonPlaybackIdentity:{playbackIdentity:'vb010-mounted',replay:0,seekRevision:0},onLessonActivityRequest:()=>true,onLessonFrameRequest:()=>true,onReplay:()=>{}};
 const render=async(delta:Partial<AnimationRendererProps>={})=>{r={...r,...delta};await act(async()=>root.render(<Renderer {...r}/>));};
 const section=()=>dom.window.document.querySelector('section')!;const click=async(id:string)=>act(async()=>{(dom.window.document.querySelector(`[data-vb010-focus="${id}"]`)as HTMLButtonElement).click();});
 try{
  await render();await click('top');assert.equal(section().getAttribute('data-wrong-count'),'1');assert.equal(section().getAttribute('data-choice-mode'),'feedback');
  await render({frame:20,lessonPlaybackIdentity:{playbackIdentity:'vb010-mounted',replay:0,seekRevision:1}});await render({frame:75});assert.equal(section().getAttribute('data-choice-mode'),'ready');assert.equal(section().getAttribute('data-wrong-count'),'0');assert.equal((dom.window.document.querySelector('[data-vb010-focus="middle"]')as HTMLButtonElement).disabled,false);
  await click('middle');const d=c.activities.find(x=>x.id==='correct-1')!;
  await render({lessonActivities:[{id:d.id,sourceInstanceId:d.sourceInstanceId,frameDomain:d.frameDomain,frame:d.endFrame,revision:1,status:'completed'}]});
  assert.equal(section().getAttribute('data-choice-mode'),'resuming');await render({frame:76,lessonActivities:[]});await render({frame:75,lessonPlaybackIdentity:{playbackIdentity:'vb010-mounted',replay:0,seekRevision:2}});assert.equal(section().getAttribute('data-choice-mode'),'ready');
  await click('top');await render({replay:1,frame:1,lessonActivities:[],lessonPlaybackIdentity:{playbackIdentity:'vb010-mounted',replay:1,seekRevision:0}});await render({frame:75});assert.equal(section().getAttribute('data-choice-mode'),'ready');assert.equal(section().getAttribute('data-wrong-count'),'0');
 }finally{await act(async()=>root.unmount());dom.window.close();for(const[k,d]of prior)d?Object.defineProperty(globalThis,k,d):Reflect.deleteProperty(globalThis,k);}
});
