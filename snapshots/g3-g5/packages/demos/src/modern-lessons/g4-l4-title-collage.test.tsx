import assert from 'node:assert/strict';
import test from 'node:test';
import React,{act} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createRoot} from 'react-dom/client';
import {createRequire} from 'node:module';
const {JSDOM}=createRequire(import.meta.url)('jsdom') as {JSDOM:new(html:string)=>{window:Window & typeof globalThis & {close():void}}};
import {G4_L4_TITLE_COLLAGE_CONFIGS as configs} from './generated/g4-l4-title-collage-source';
import {titleCollageBinding,titleCollageSnapshot,TitleCollageScene,titleCollageActivities,titleCollageAudioRequest,createTitleCollagePresentation} from './g4-l4-title-collage';
import {advanceSourceActivities,beginSourceClockActivity,sourceActivitiesAtParentFrame,sourceActivityBlocksParent} from '../lesson-source-clock';
import {validateLessonTextActivities,validateLessonTextFrameControl} from '../lesson-text-frame-control';
import {validateLessonTextBinding} from '../lesson-text-snapshot';
const run=(c:typeof configs[number],frame:number,changes:Record<string,unknown>={})=>{
 const r={frame,frameDomain:c.frameDomain,rootFrame:6,scenario:'source-static-frame',lang:'en' as const,seed:1,replay:2,...changes};
 const s={animationId:c.animationId,sourceSwfSha256:c.sourceSwfSha256,status:'ready' as const,frame,frameDomain:c.frameDomain,rootFrame:6,scenario:'source-static-frame',language:'en' as const,seed:1};
 return titleCollageSnapshot(c,s as never,r);
};
test('Own IR source cohorts retain distinct instances and final four expressions',()=>{
 const c=configs[0];
 const cases:[[number,string[]],[number,string[]],[number,string[]],[number,string[]],[number,string[]],[number,string[]],[number,string[]]]=[
  [2,['764 + 249','764 + 249','764 + 249']],[18,[]],[19,['81 − 52','81 − 52','81 − 52']],
  [38,['18.36 + 9.12','18.36 + 9.12','18.36 + 9.12']],[57,['5.38 − 1.79','5.38 − 1.79','5.38 − 1.79']],[78,[]],
  [136,['5.38 − 1.79','764 + 249','81 − 52','18.36 + 9.12']],
 ];
 for(const [frame,expected]of cases){const s=run(c,frame);assert.equal(s.status,'ready');const expressions=new Set<string>(c.instances.filter(i=>i.role==='expression').map(i=>i.instanceId));assert.deepEqual(s.blocks.filter(b=>b.visible&&expressions.has(b.id)).map(b=>b.text),expected);}
 assert.equal(run(c,12).blocks.find(b=>b.id==='title')?.visible,false);assert.equal(run(c,13).blocks.find(b=>b.id==='title')?.visible,true);
});
test('Own title page retains four expressions and title timing, excludes source background context',()=>{
 const c=configs[1],first=run(c,1),next=run(c,2);assert.equal(first.blocks.filter(b=>b.visible).length,4);assert.equal(next.blocks.filter(b=>b.visible).length,5);
 assert.deepEqual(next.blocks.map(b=>b.text),['Final Quiz','764 + 249','81 − 52','18.36 + 9.12','5.38 − 1.79']);
 assert.equal(c.contextDisposition.length,13);assert(!titleCollageBinding(c).blocks.some(b=>b.sourceTextIds.includes('character-21/run-0')));
});
test('All own source frames and both strict binding contracts remain consistent',()=>{
 for(const c of configs){const b=validateLessonTextBinding(titleCollageBinding(c));assert.equal(new Set(b.blocks.map(x=>x.id)).size,b.blocks.length);for(let frame=1;frame<=c.frameCount;frame++){const s=run(c,frame);assert.equal(s.status,'ready');assert.deepEqual(s.blocks.map(b=>b.id),b.blocks.map(b=>b.id));assert.equal(s.identity.frame,frame);assert.equal(s.identity.replay,2);}}
});
test('Unsupported source identity, frame domain, seed, language and capture state fail closed',()=>{
 for(const c of configs)for(const changes of [{frame:0},{frame:c.frameCount+1},{frameDomain:'root'},{rootFrame:7},{lang:'es'},{seed:-1},{seed:2},{scenario:'invented'},{entryStateSha256:'a'.repeat(64)},{replay:-1}]){const s=run(c,1,changes);assert.equal(s.status,'blocked');assert.equal(s.blocks.length,0);}
});
test('Native output carries operands, original graph labels and no invented arithmetic results',()=>{
 for(const c of configs){const frame=c.frameCount,snapshot=run(c,frame),html=renderToStaticMarkup(<TitleCollageScene c={c} snapshot={snapshot} frame={frame} seed={1} replay={2}/>);assert(html.includes(c.title.text.replace('&','&amp;')));assert(!html.includes('<canvas'));assert(!html.includes('foreignObject'));assert(!html.includes('1,013'));if(c.kind==='introduction'){assert(html.includes('<svg'));for(const value of ['412','498','389','602','537'])assert(html.includes('>'+value+'<'));}else assert(!html.includes('<svg'));}
});
test('Original sound catches up at each observed parent frame and completes after the parent stop',()=>{
 const c=configs[0],activities=titleCollageActivities(c),cap=createTitleCollagePresentation(c,()=>{throw new Error('not rendered')});
 validateLessonTextActivities(activities,136,12);validateLessonTextFrameControl(cap.frameControl!,136);
 assert.equal(activities.length,264);
 for(const seed of [0,1,2,3,0xffffffff])for(let frame=5;frame<=136;frame++){
  const request=titleCollageAudioRequest(c,frame,seed)!,definition=activities.find(d=>d.id===request.id)!;
  assert.equal(definition.startFrame,frame-3);assert.equal(definition.audio!.source,c.originalAudio[seed%2].source);
  const initial=beginSourceClockActivity([],definition,1)!;assert.equal(sourceActivityBlocksParent(initial),false);
  const terminal=sourceActivitiesAtParentFrame(advanceSourceActivities(initial,(136-frame)*1000/12),136);
  assert.equal(terminal[0].frame,133);assert.equal(terminal[0].status,'playing');
  const complete=advanceSourceActivities(terminal,2*1000/12);
  assert.equal(complete[0].frame,135);assert.equal(complete[0].status,'completed');
  assert.equal(sourceActivitiesAtParentFrame(complete,137).length,0);
 }
 for(const frame of [0,1,4,137,NaN])assert.equal(titleCollageAudioRequest(c,frame,0),undefined);
 for(const seed of [-1,0x100000000,1.5])assert.equal(titleCollageAudioRequest(c,5,seed),undefined);
 assert.deepEqual(titleCollageActivities(configs[1]),[]);assert.equal(titleCollageAudioRequest(configs[1],5,0),undefined);
});
test('Mounted entry is once per playback identity, paused/reduced views are silent, Replay and seek reenter',async()=>{
 const dom=new JSDOM('<!doctype html><div id="test"></div>');
 const saved=new Map(['window','document','IS_REACT_ACT_ENVIRONMENT'].map(k=>[k,Object.getOwnPropertyDescriptor(globalThis,k)]));
 Object.defineProperty(globalThis,'window',{value:dom.window,configurable:true});Object.defineProperty(globalThis,'document',{value:dom.window.document,configurable:true});
 Object.defineProperty(globalThis,'IS_REACT_ACT_ENVIRONMENT',{value:true,configurable:true,writable:true});
 const root=createRoot(dom.window.document.getElementById('test')!),requests:{id:string;parentFrame:number}[]=[],c=configs[0];
 const Renderer=createTitleCollagePresentation(c,(frame,r)=>({animationId:c.animationId,sourceSwfSha256:c.sourceSwfSha256,status:'ready',frame,frameDomain:c.frameDomain,rootFrame:6,scenario:'source-static-frame',language:r.lang,seed:r.seed}) as never).Renderer!;
 let accept=true;
 const draw=async(frame:number,options:Record<string,unknown>={})=>act(()=>root.render(<Renderer key={String(options.hostKey??'live')} frame={frame} frameDomain={c.frameDomain} rootFrame={6} scenario="source-static-frame" lang="en" seed={0} replay={0} audioEnabled={true} paused={false} reducedMotion={false} onLessonActivityRequest={r=>{requests.push(r);return accept;}} {...options}/>));
 try{
  await draw(1);await draw(5,{paused:true});assert.equal(requests.length,0);
  await draw(6);assert.deepEqual(requests,[{id:'title-collage-original-0-at-6',parentFrame:6}]);
  await draw(12);await draw(12,{paused:true});await draw(12);await draw(136);assert.equal(requests.length,1);
  await draw(1,{replay:1});await draw(5,{replay:1});assert.equal(requests.at(-1)!.id,'title-collage-original-0-at-5');assert.equal(requests.length,2);
  await draw(5,{seed:1,replay:1});assert.equal(requests.at(-1)!.id,'title-collage-original-1-at-5');
  await draw(136,{hostKey:'seek-1',seed:1,replay:1});assert.equal(requests.at(-1)!.id,'title-collage-original-1-at-136');
  const before=requests.length;await draw(136,{hostKey:'reduced',reducedMotion:true});assert.equal(requests.length,before);
  await draw(5,{hostKey:'blocked',lang:'es'});assert.equal(requests.length,before);
  accept=false;await draw(5,{hostKey:'retry'});assert.equal(requests.length,before+1);
  accept=true;await draw(6,{hostKey:'retry'});await draw(7,{hostKey:'retry'});assert.equal(requests.length,before+2);assert.equal(requests.at(-1)!.parentFrame,6);
 }finally{
  await act(()=>root.unmount());dom.window.close();for(const [k,d] of saved){if(d)Object.defineProperty(globalThis,k,d);else Reflect.deleteProperty(globalThis,k);}
 }
});
