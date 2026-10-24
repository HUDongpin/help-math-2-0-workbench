import assert from 'node:assert/strict';
import test from 'node:test';
import React,{act}from'react';
import {JSDOM}from'jsdom';
import {createRoot}from'react-dom/client';
import type{AnimationRendererProps,HostAudioTrackEvent,LessonPlayCommand}from'../contract';
import type{LessonTextActivitySnapshot,LessonTextActivityCancellation,LessonTextButtonActivityRequest,LessonTextFrameTransition}from'../lesson-text-contract';
import {beginSourceClockActivity,advanceSourceActivities,cancelSourceClockActivity,releaseSourceButtonActivity,type SourceClockActivity}from'../lesson-source-clock';
import {VB010_CONFIG as c}from'./generated/g3-l1-vb010-source';
import {G3_L1_VB010_TEXT_PRESENTATION as P}from'./g3-l1-vb010-capability';

/** A page consumer fixture: actual React, native source button and pure shared
 * activity clock. Host publication/cancellation is an explicit fixture actor,
 * not a claim that the new runtime hook or a real browser has been exercised. */
async function fixture(seed=0){
 const dom=new JSDOM('<!doctype html><div id="page"></div>',{url:'http://localhost/'}),prior=new Map<string,PropertyDescriptor|undefined>();
 for(const[k,v]of Object.entries({window:dom.window,document:dom.window.document,HTMLElement:dom.window.HTMLElement,IS_REACT_ACT_ENVIRONMENT:true})){
  prior.set(k,Object.getOwnPropertyDescriptor(globalThis,k));Object.defineProperty(globalThis,k,{value:v,writable:true,configurable:true});
 }
 dom.window.HTMLElement.prototype.scrollIntoView=()=>{};
 const root=createRoot(dom.window.document.getElementById('page')!),Renderer=P.Renderer!;
 let clock:readonly SourceClockActivity[]=[],revision=0,committedFrame:number|null=null;
 const cancellations:LessonTextActivityCancellation[]=[],buttons:{request:LessonTextButtonActivityRequest;accepted:boolean}[]=[],frameRequests:LessonTextFrameTransition[]=[];
 const activityRequests:string[]=[],unexpectedPageCancels:LessonTextActivityCancellation[]=[];
 const stamp=(items:readonly SourceClockActivity[])=>items.map(a=>a.cancellationToken?a:{...a,cancellationToken:'playback0-seek0-activity'+a.revision});
 let r:AnimationRendererProps={frame:75,frameDomain:'sprite-255',rootFrame:6,lang:'en',uiLanguage:'es',scenario:'source-static-frame',seed,replay:0,
  lessonPlaybackIdentity:{playbackIdentity:'mounted-vb010-'+seed,replay:0,seekRevision:0},
  onLessonActivityRequest:request=>{
   if(request.parentFrame!==r.frame)return false;
   const d=c.activities.find(x=>x.id===request.id);if(!d)return false;
   const next=beginSourceClockActivity(clock,d,++revision);if(!next)return false;
   clock=stamp(next);activityRequests.push(request.id);return true;
  },
  onLessonButtonActivityRequest:request=>{
   let accepted=false;
   if(request.phase==='press'){
    const d=c.activities.find(x=>x.id===request.id&&'buttonPress'in x);
    const next=d&&beginSourceClockActivity(clock,d,++revision);
    if(next){clock=stamp(next.map(a=>a.id===request.id?{...a,pressToken:request.token}:a));accepted=true;}
   }else{
    const next=releaseSourceButtonActivity(clock,request.id,request.token);if(next){clock=next;accepted=true;}
   }
   buttons.push({request,accepted});return accepted;
  },
  onLessonActivityCancel:request=>{unexpectedPageCancels.push(request);return false;},
  onLessonFrameRequest:request=>{
   if(r.frame!==75||request.fromFrame!==75||![76,96].includes(request.toFrame)||request.stopFrame!==136)return false;
   frameRequests.push(request);committedFrame=request.toFrame;clock=[];return true;
  },onReplay:()=>{},
 };
 const render=async(delta:Partial<AnimationRendererProps>={})=>{
  r={...r,...delta,lessonActivities:delta.lessonActivities??clock};await act(async()=>root.render(<Renderer {...r}/>));
 };
 const section=()=>dom.window.document.querySelector<HTMLElement>('section')!;
 const button=(id:string)=>dom.window.document.querySelector<HTMLButtonElement>('[data-vb010-focus="'+id+'"]')!;
 const closeButton=()=>dom.window.document.querySelector<HTMLButtonElement>('[data-lesson-text-block="close"]')!;
 const click=async(id:string)=>{await act(async()=>button(id).click());await render();};
 const advance=async(frame:number)=>{
  const current=clock.find(x=>x.id===section().dataset.feedbackActivityId);assert(current,'advance the currently bound feedback, not a retained completed sibling');
  clock=advanceSourceActivities(clock,Math.max(0,frame-current.frame)*1000/12);await render();
 };
 const close=async()=>{await act(async()=>closeButton().click());await render();};
 const event=(sequence:number,sourceFrame=r.frame):HostAudioTrackEvent=>({kind:'accepted-start',sequence,identity:r.lessonPlaybackIdentity!,trackId:c.spanishTrack.id,trackSha256:c.spanishTrack.sha256,frameDomain:'sprite-255',sourceFrame});
 const command=(sequence:number):LessonPlayCommand=>({kind:'play',sequence,identity:r.lessonPlaybackIdentity!,frameDomain:'sprite-255',sourceFrame:r.frame});
 const retire=()=>{
  for(const activity of [...clock]){
   if(!c.spanishTrack.interruptSourceInstances.includes(activity.sourceInstanceId!))continue;
   const request={id:activity.id,sourceInstanceId:activity.sourceInstanceId,revision:activity.revision,cancellationToken:activity.cancellationToken!,parentFrame:r.frame};
   const next=cancelSourceClockActivity(clock,request);assert(next,'fixture cancellation must use current token');clock=next;cancellations.push(request);
  }
 };
 const accept=async(sequence:number,options:{error?:boolean;staleSnapshot?:readonly LessonTextActivitySnapshot[];sourceFrame?:number}={})=>{
  const started=event(sequence,options.sourceFrame??committedFrame??r.frame);retire();
  await render({hostAudioTrackStart:started,hostAudioTrackEvent:options.error?{...started,kind:'error'}:started,paused:!options.error,lessonActivities:options.staleSnapshot??clock});
  return started;
 };
 const reset=async(kind:'replay'|'seek'|'page'='replay')=>{
  clock=[];committedFrame=null;const previous=r.lessonPlaybackIdentity!;
  const identity={...previous,replay:kind==='replay'?previous.replay+1:previous.replay,seekRevision:kind==='seek'?previous.seekRevision+1:previous.seekRevision,playbackIdentity:kind==='page'?previous.playbackIdentity+'-next':previous.playbackIdentity};
  await render({frame:75,replay:identity.replay,lessonPlaybackIdentity:identity,paused:false,lessonActivities:[]});
 };
 const dispose=async()=>{await act(async()=>root.unmount());dom.window.close();for(const[k,v]of prior)v?Object.defineProperty(globalThis,k,v):Reflect.deleteProperty(globalThis,k);};
 await render();
 return {dom,render,section,button,closeButton,click,advance,close,event,command,retire,accept,reset,dispose,cancellations,buttons,frameRequests,activityRequests,unexpectedPageCancels,
  get runtime(){return r;},get clock(){return clock;},get activeEnd(){const current=clock.find(x=>x.id===section().dataset.feedbackActivityId);assert(current);return current.definition.endFrame;},get committedFrame(){return committedFrame;}};
}

test('mounted all seven feedback owners reset before late completion, including same-batch media error',async()=>{
 for(const branch of c.branches){
  const seed=c.branches.filter(b=>b.kind===branch.kind).findIndex(b=>b.id===branch.id),h=await fixture(seed);
  try{
   await h.click(branch.kind==='wrong'?'top':'middle');assert.equal(h.section().dataset.feedbackStage,'intro');assert.equal(h.activityRequests.at(-1),branch.id);
   const active=h.clock[0],end={...active,frame:active.definition.endFrame,status:'completed'as const};
   const started=await h.accept(3,{error:true,staleSnapshot:[end]});
   assert.equal(h.section().dataset.choiceMode,'locked');assert.equal(h.section().dataset.answerLocked,'true');assert.equal(h.section().dataset.wrongCount,branch.kind==='wrong'?'1':'0');
   assert.equal(h.section().dataset.feedbackActivityId,'');assert.equal(h.dom.window.document.querySelector('[data-vb010-focus="feedback"]'),null);
   assert.equal(h.button('middle').disabled,true);assert.equal(h.frameRequests.length,0);assert.equal(h.clock.length,0);assert.equal(h.unexpectedPageCancels.length,0);
   // Late old terminal plus Stop/ended and generic unpause cannot resurrect it.
   for(const kind of ['ended','stop','cancelled']as const)await h.render({paused:false,lessonActivities:[end],hostAudioTrackEvent:{...started,kind}});
   assert.equal(h.frameRequests.length,0);assert.equal(h.section().dataset.choiceMode,'locked');
   await h.reset('replay');assert.equal(h.section().dataset.choiceMode,'ready');assert.equal(h.section().dataset.wrongCount,'0');assert.equal(h.button('middle').disabled,false);
   await h.render({hostAudioTrackStart:started,lessonActivities:[end]});assert.equal(h.section().dataset.choiceMode,'ready');assert.equal(h.frameRequests.length,0);
  }finally{await h.dispose();}
 }
});

test('held pointer and keyboard Close in all wrong variants/counters retires exact tokens without synthetic completion',async()=>{
 const wrong=c.branches.filter(b=>b.kind==='wrong');
 for(let index=0;index<wrong.length;index++)for(const attempt of [1,2])for(const input of ['pointer','keyboard']){
  const h=await fixture((index-(attempt-1)+3)%3);
  try{
   if(attempt===2){
    await h.click('top');await h.advance(22);await h.close();await h.advance(h.activeEnd);
    assert.equal(h.section().dataset.choiceMode,'ready');assert.equal(h.section().dataset.answerLocked,'false');
   }
   await h.click('bottom');await h.advance(22);assert.equal(h.activityRequests.at(-1),wrong[index].id);assert.equal(h.section().dataset.wrongCount,String(attempt));
   const close=h.closeButton();assert(close);close.focus();
   await act(async()=>{
    if(input==='keyboard')close.dispatchEvent(new h.dom.window.KeyboardEvent('keydown',{key:' ',bubbles:true,cancelable:true}));
    else{
     const event=new h.dom.window.MouseEvent('pointerdown',{button:0,buttons:1,bubbles:true,cancelable:true});Object.defineProperty(event,'pointerId',{value:17});close.dispatchEvent(event);
    }
   });
   await h.render();assert.equal(h.clock.length,attempt===2?3:2);assert.equal(h.buttons.at(-1)!.request.phase,'press');assert.equal(h.buttons.at(-1)!.accepted,true);
   const press=h.buttons.at(-1)!.request,expectedOwners=h.clock.map(x=>[x.id,x.sourceInstanceId,x.revision,x.cancellationToken]);
   const started=await h.accept(10);assert.equal(h.clock.length,0);assert.equal(h.closeButton(),null);assert.equal(h.section().dataset.choiceMode,'locked');
   assert.equal(h.section().dataset.wrongCount,String(attempt));assert.equal(h.section().dataset.answerLocked,'true');
   assert.deepEqual(h.cancellations.map(x=>[x.id,x.sourceInstanceId,x.revision,x.cancellationToken]),expectedOwners);
   const release=h.buttons.at(-1)!;assert.equal(release.request.phase,'release');assert.equal(release.request.token,press.token);assert.equal(release.accepted,false);
   assert.equal(h.activityRequests.filter(x=>x.endsWith('-outro')).length,attempt-1);assert.equal(h.frameRequests.length,0);assert.equal(h.unexpectedPageCancels.length,0);
   await h.render({paused:false,hostAudioTrackEvent:{...started,kind:'ended'}});assert.equal(h.button('middle').disabled,true);assert.equal(h.frameRequests.length,0);
   // Replay has a new identity; a delayed prior release cannot remove a new owner.
   await h.reset();await h.click('top');const newOwner=h.clock[0];
   assert.equal(h.runtime.onLessonButtonActivityRequest!({...press,phase:'release'}),false);assert.equal(h.clock[0],newOwner);
  }finally{await h.dispose();}
 }
});

test('mounted shared-order commands cancel uncommitted Play, while committed frame requests survive a delayed start',async()=>{
 const h=await fixture();
 try{
  await h.click('top');await h.advance(22);h.retire();
  await h.render({lessonPlayCommand:h.command(1),hostAudioTrackStart:h.event(2),paused:false,lessonActivities:[]});
  assert.equal(h.section().dataset.choiceMode,'locked');assert.equal(h.frameRequests.length,0);
  // A new explicit Play, not a pause edge, now escapes the held question.
  await h.render({paused:true});await h.render({paused:false});assert.equal(h.frameRequests.length,0);
  await h.render({lessonPlayCommand:h.command(3)});assert.equal(h.frameRequests.length,1);assert.equal(h.committedFrame,76);assert.equal(h.section().dataset.choiceMode,'resuming');
  // Actual source request is accepted, but React still displays75 this render.
  await h.accept(4,{sourceFrame:75,error:true});assert.equal(h.section().dataset.choiceMode,'resuming');assert.equal(h.section().dataset.answerLocked,'true');assert.equal(h.frameRequests.length,1);
  await h.render({frame:76,paused:false});assert.equal(h.frameRequests.length,1);assert.equal(h.section().dataset.wrongCount,'1');
  await h.render({hostAudioTrackStart:h.event(5,75)});assert.equal(h.frameRequests.length,1);assert.equal(h.section().dataset.wrongCount,'1');
  await h.reset('seek');assert.equal(h.button('middle').disabled,false);assert.equal(h.section().dataset.wrongCount,'0');
 }finally{await h.dispose();}
});

test('mounted second-wrong96 preserves source-enabled answers through Spanish and terminal136',async()=>{
 const h=await fixture();
 try{
  for(let attempt=1;attempt<=2;attempt++){
   await h.click('top');await h.advance(22);await h.close();await h.advance(h.activeEnd);
  }
  assert.equal(h.committedFrame,96);assert.equal(h.section().dataset.choiceMode,'resuming');assert.equal(h.section().dataset.answerLocked,'false');assert.equal(h.section().dataset.wrongCount,'2');
  await h.accept(7,{sourceFrame:75,error:true});assert.equal(h.section().dataset.choiceMode,'resuming');assert.equal(h.section().dataset.answerLocked,'false');assert.equal(h.frameRequests.length,1);
  await h.render({frame:96,paused:false});assert.equal(h.section().dataset.answerLocked,'false');assert.equal(h.section().dataset.wrongCount,'2');
  await h.render({frame:136,hostAudioTrackStart:h.event(8,136)});assert.equal(h.section().dataset.answerLocked,'false');assert.equal(h.section().dataset.wrongCount,'2');assert.equal(h.frameRequests.length,1);
 }finally{await h.dispose();}
});
