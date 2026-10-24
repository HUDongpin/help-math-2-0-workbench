import assert from 'node:assert/strict';
import test from 'node:test';
import {createRequire} from 'node:module';
import React, {act, useLayoutEffect} from 'react';
import {createRoot} from 'react-dom/client';
import {useLessonSourceClock} from '../src/use-lesson-source-clock';
import type {LessonTextActivityDefinition} from '../src/lesson-text-contract';

const {JSDOM}=createRequire(import.meta.url)('jsdom');
const movie={stage:{width:100,height:100},fps:12,frameCount:100,durationMs:100000/12};
const feedback:LessonTextActivityDefinition={id:'feedback',frameDomain:'child',parentFrames:[1],startFrame:1,endFrame:20,fps:12};

test('actual React hook freezes parent and child at commit, rejects stale RAF, resumes without paused elapsed, and resets on Replay/seek',async()=>{
  const dom=new JSDOM('<div id="root"></div>');
  const names=['window','document','requestAnimationFrame','cancelAnimationFrame','performance','IS_REACT_ACT_ENVIRONMENT'] as const;
  const originals=new Map(names.map(name=>[name,Object.getOwnPropertyDescriptor(globalThis,name)]));
  let now=0,nextId=0;
  const pending=new Map<number,FrameRequestCallback>(),all=new Map<number,FrameRequestCallback>();
  const install=(name:string,value:unknown)=>Object.defineProperty(globalThis,name,{value,configurable:true,writable:true});
  install('window',dom.window);install('document',dom.window.document);install('IS_REACT_ACT_ENVIRONMENT',true);
  install('performance',new Proxy(globalThis.performance,{get(target,key){if(key==='now')return ()=>now;const value=Reflect.get(target,key,target);return typeof value==='function'?value.bind(target):value;}}));
  install('requestAnimationFrame',(callback:FrameRequestCallback)=>{const id=++nextId;pending.set(id,callback);all.set(id,callback);return id;});
  install('cancelAnimationFrame',(id:number)=>pending.delete(id));
  let clock!:ReturnType<typeof useLessonSourceClock>;
  let paused=false,replay=0,identity='first';
  const commitObservations:number[]=[];
  function Probe(){
    clock=useLessonSourceClock(movie,'once',100,!paused,replay,identity,!paused);
    // This runs after the hook's layout lifecycle, but before passive cleanup.
    useLayoutEffect(()=>{if(paused)commitObservations.push(pending.size);},[paused]);
    return React.createElement('output',{'data-paused':String(paused),'data-frame':clock.frame,'data-child':clock.lessonActivity?.frame??''});
  }
  const root=createRoot(dom.window.document.getElementById('root'));
  const render=()=>act(()=>root.render(React.createElement(Probe)));
  const tick=(time:number)=>act(()=>{now=time;const callbacks=[...pending.values()];pending.clear();for(const callback of callbacks)callback(now);});
  const state=()=>({frame:clock.frame,child:clock.lessonActivity?.frame,revision:clock.lessonActivity?.revision});
  const activity=()=>clock.lessonActivity;
  try{
    await render();
    await act(()=>{assert(clock.beginSourceActivity(feedback,1));});
    await tick(80);assert.deepEqual(state(),{frame:1,child:1,revision:1});
    const stale=[...pending.values()][0];assert(stale);
    now=90;paused=true;await render();
    assert.deepEqual(commitObservations,[0],'old RAF must be canceled during layout commit, before passive cleanup');
    assert.deepEqual(state(),{frame:1,child:2,revision:1},'flush the final 10 ms before pause exactly once');
    const frozen=state();
    await act(()=>{now=5090;stale(now);});
    await tick(10090);assert.deepEqual(state(),frozen,'canceled callback and paused wall time cannot advance the clock');
    paused=false;await render();await tick(10170);
    assert.equal(clock.lessonActivity?.frame,3,'resume consumes only its 80 ms plus retained pre-pause fraction');
    const beforeReplay=[...pending.values()][0];
    replay++;await render();assert.equal(clock.frame,1);assert.equal(clock.lessonActivity,undefined);
    await act(()=>{now=10180;beforeReplay(now);});assert.equal(clock.frame,1,'Replay invalidates old callback');
    await tick(10260);assert.equal(clock.frame,2,'parent resumes normally without a child hold');
    await act(()=>clock.seekToFrame(40));assert.equal(clock.frame,40);assert.equal(clock.seekRevision,1);
    now=10270;paused=true;await render();const parentFrozen=state();
    await tick(20270);assert.deepEqual(state(),parentFrozen);
    identity='second';await render();assert.equal(clock.frame,1);assert.equal(clock.seekRevision,0);assert.equal(pending.size,0);
    // GS002's overflow boundary displays frame60 for one full source tick.
    // Pause must retain the fractional tick without publishing frame61.
    paused=false;await render();
    const held:LessonTextActivityDefinition={id:'held-boundary',frameDomain:'sprite-649',sourceInstanceId:'root/Boundary',
      parentLifetime:{firstFrame:1,lastFrameExclusive:2},parentFrames:[1],startFrame:60,endFrame:60,holdEndFrame:true,fps:12};
    await act(()=>{assert(clock.continueSourceFrame(1,1));assert(clock.beginSourceActivity(held,1));});
    await tick(20310);assert.equal(activity()?.status,'playing');assert.equal(activity()?.frame,60);
    now=20315;paused=true;await render();await tick(30000);assert.equal(activity()?.status,'playing');
    paused=false;await render();await tick(30038);assert.equal(activity()?.status,'playing');
    await tick(30039);assert.equal(activity()?.status,'completed');assert.equal(activity()?.frame,60);
    assert.equal(pending.size,0);
    const beforeUnmount=[...all.values()];await act(()=>root.unmount());
    for(const callback of beforeUnmount)callback(40000);
    assert.equal(pending.size,0,'unmount invalidates all prior loop ownership');
  }finally{
    await act(()=>root.unmount());dom.window.close();
    for(const [name,descriptor] of originals){if(descriptor)Object.defineProperty(globalThis,name,descriptor);else Reflect.deleteProperty(globalThis,name);}
  }
});
