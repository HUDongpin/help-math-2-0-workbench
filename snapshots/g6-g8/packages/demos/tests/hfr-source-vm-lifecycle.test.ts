import assert from 'node:assert/strict';
import test, {type TestContext} from 'node:test';
import {createHash} from 'node:crypto';
import {HfrPlayer} from '../src/hfr/player';
import {LessonRuntime} from '../src/hfr/lesson-runtime';
import {beginPageSession, disposeLessonSession, isPageSessionCurrent} from '../src/hfr/session';
import {bindTechnicalLifecycle, nativeTechnicalOwner, publishTechnicalCommit, readTechnicalResourceOwner, technicalObjectId} from '../src/technical-observation-v1';
import {readRetainedSourceSurface, sourceVmRetired} from '../../../scripts/lib/g678-source-vm-lifecycle-v1.mjs';
import type {PageData} from '../src/hfr/types';

// The production public load/session path and minimal DOM/audio ports follow
// packages/demos/tests/hfr-product-clock.test.ts. No browser or source evidence.
function deferred() {let resolve!:()=>void, reject!:(error:Error)=>void;const promise=new Promise<void>((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};}
async function flush() {for(let i=0;i<8;i++)await Promise.resolve();}
async function fixture(t:TestContext) {
  const data:PageData={schema:'hfr-page/1',compiler:'clock-fixture',
    placement:{animationId:'shared-nms002-l07-p005',module:'NMS002',course:'fixture',lesson:7,lessonTitle:'fixture',sectionCode:'RW',ordinal:5},
    source:{path:'synthetic.swf',sha256:'a'.repeat(64),bytes:0,swfVersion:6},
    stage:{width:800,height:600,fps:12,background:[255,255,255]},module:'fixture.js',
    dictionary:{113:{kind:'sprite',frameCount:136,labels:{},frames:Array.from({length:136},()=>[])}},
    root:{frameCount:10,labels:{},frames:Array.from({length:10},(_,i)=>i===4?[{op:'place',depth:1,charId:113,name:'content'}]:[])},
    exports:{},streams:[],spanishAudio:'spanish.mp3',stats:{scripts:0,codeBodies:0,fallbackBodies:0,characters:1,mediaFiles:0}};
  const context={setTransform(){},clearRect(){},fillRect(){},save(){},beginPath(){},rect(){},clip(){},restore(){}};
  const makeCanvas=()=>Object.assign(new EventTarget(),{width:800,height:600,isConnected:true,style:{cursor:''},getContext:()=>context,
    getBoundingClientRect:()=>({left:0,top:0,width:800,height:600}),setPointerCapture(){}});
  const contexts:AudioPort[]=[],media:HtmlMediaPort[]=[],plays:Array<{media:HtmlMediaPort;pending:ReturnType<typeof deferred>}>=[];
  class AudioPort {
    state='suspended';currentTime=0;destination={};closePending=deferred();
    constructor(){contexts.push(this);}
    createGain(){return {gain:{value:1},connect(){}};}
    async resume(){this.state='running';}async suspend(){if(this.state!=='closed')this.state='suspended';}
    close(){return this.closePending.promise;}
    finishClose(){this.state='closed';this.closePending.resolve();}
  }
  class HtmlMediaPort extends EventTarget {
    currentSrc='';paused=true;ended=false;volume=1;
    constructor(public src:string){super();media.push(this);}
    play(){this.currentSrc=this.src;this.paused=false;const pending=deferred();plays.push({media:this,pending});return pending.promise;}
    pause(){this.paused=true;this.dispatchEvent(new Event('pause'));}
  }
  let serial=0;const frames=new Map<number,FrameRequestCallback>();
  const ports={document:{hidden:false,createElement:()=>({width:1,height:1,getContext:()=>context})},window:{devicePixelRatio:1},AudioContext:AudioPort,Audio:HtmlMediaPort,
    requestAnimationFrame:(fn:FrameRequestCallback)=>{const id=++serial;frames.set(id,fn);return id;},cancelAnimationFrame:(id:number)=>frames.delete(id)};
  const prior=new Map(Object.keys(ports).map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)]));
  for(const [key,value]of Object.entries(ports))Object.defineProperty(globalThis,key,{value,configurable:true,writable:true});
  const hostScope={id:'source-vm-lifecycle-unit-fixture'},lesson=new LessonRuntime(),players:HfrPlayer[]=[];
  let runtimeCreations=0;
  const pageFactory=()=>({}),dataSha256=createHash('sha256').update(JSON.stringify(data)).digest('hex');
  const reserve=()=>beginPageSession({hostScope,lessonKey:'shared-nms002-l07',pageKey:data.placement.animationId,
    sourceSha256:data.source.sha256,compiler:data.compiler,seed:0},()=>{runtimeCreations++;return lesson;});
  const load=async(existing?:HfrPlayer)=>{
    const canvas=existing?.canvas??makeCanvas(),player=existing??new HfrPlayer(canvas as HTMLCanvasElement),session=reserve();
    if(!existing)players.push(player);
    assert.equal(await player.load(data,pageFactory,'/fixture/',{audio:true,session,dataSha256,replay:0,progressTimeline:113}),true);
    return {player,canvas,session};
  };
  t.after(async()=>{try{
    for(const p of players)p.destroy();disposeLessonSession(hostScope);
    for(const c of contexts)c.finishClose();for(const p of plays){p.media.pause();p.pending.resolve();}await flush();
  }finally{for(const[key,value]of prior){if(value)Object.defineProperty(globalThis,key,value);else Reflect.deleteProperty(globalThis,key);}}});
  const first=await load();
  return {...first,data,pageFactory,dataSha256,lesson,contexts,media,plays,frames,makeCanvas,load,reserve,
    runtimeCreations:()=>runtimeCreations,
    observe:(canvas:any)=>canvas.__g678TechnicalRead(),
    before:(canvas:any)=>({atMs:0,...canvas.__g678TechnicalRead()}),
  };
}

test('detaching a real loaded canvas does not fabricate lease, RAF or audio cleanup',async t=>{
  const f=await fixture(t);f.player.start();f.player.setSpanish(true);const before=f.before(f.canvas);
  (f.canvas as any).isConnected=false;
  const read=readRetainedSourceSurface(f.canvas),life=read.observation.lifecycle;
  assert.equal(read.observation.status,'retired');assert.equal(life.pageLeaseCurrent,true);assert.equal(life.pageSessionCurrent,true);
  assert.equal(life.animationFramePending,true);assert.equal(life.htmlMedia[0].pendingPlays,1);assert.equal(life.htmlMedia[0].paused,false);
  assert.equal(sourceVmRetired(read,before),false);
});

test('host remount Replay leaves the shared VM alive and retires only old lease/media after async work settles',async t=>{
  const f=await fixture(t);f.player.start();f.player.setSpanish(true);const before=f.before(f.canvas),oldVm=f.player.rt,oldAudio=f.contexts[0],oldPlay=f.plays[0];
  const oldFrame=[...f.frames.values()][0];(f.canvas as any).isConnected=false;f.player.destroy();
  const next=await f.load();next.player.start();next.player.setSpanish(true);
  assert.equal(next.player.rt,oldVm);assert.equal(f.runtimeCreations(),1);
  const initial=f.observe(next.canvas);assert.equal(before.identity.replay,0);assert.equal(initial.identity.replay,0);
  assert.notEqual(before.identity.playerId,initial.identity.playerId);assert.notEqual(before.identity.leaseToken,initial.identity.leaseToken);
  assert.equal(isPageSessionCurrent(f.session),false);assert.equal(f.frames.size,1);
  const pending=readRetainedSourceSurface(f.canvas);assert.equal(pending.observation.lifecycle.pageLeaseCurrent,false);
  assert.equal(pending.observation.lifecycle.pageSessionCurrent,false);assert.equal(pending.observation.lifecycle.animationFramePending,false);
  assert.equal(sourceVmRetired(pending,before),false,'pending native close and HTML play do not pass');
  oldAudio.finishClose();assert.equal(sourceVmRetired(readRetainedSourceSurface(f.canvas),before),false,'paused HTML with pending play is still incomplete');
  oldPlay.media.paused=false;oldPlay.pending.resolve();await flush();
  const retired=readRetainedSourceSurface(f.canvas);assert.equal(sourceVmRetired(retired,before),true);
  assert.equal(retired.observation.lifecycle.htmlMedia[0].paused,true);assert.equal(retired.observation.lifecycle.htmlMedia[0].pendingPlays,0);
  assert.equal(retired.observation.lifecycle.audioContext.state,'closed');assert.equal(f.contexts[1].state,'running');
  assert.notEqual(retired.observation.lifecycle.audioContext.contextId,initial.lifecycle.audioContext.contextId);
  assert.equal(f.media[1].paused,false,'old async cleanup does not stop the successor media');
  oldFrame(performance.now());assert.equal(f.frames.size,1,'stale callback cannot schedule another RAF');
  assert.equal(next.player.running,true);assert.equal(next.player.rt,oldVm);
});

test('destroy without a successor session does not claim currentPageSession is invalidated',async t=>{
  const f=await fixture(t),before=f.before(f.canvas);(f.canvas as any).isConnected=false;f.player.destroy();f.contexts[0].finishClose();
  assert.equal(readRetainedSourceSurface(f.canvas).observation.lifecycle.pageSessionCurrent,true);
  assert.equal(sourceVmRetired(readRetainedSourceSurface(f.canvas),before),false);
  f.reserve();assert.equal(sourceVmRetired(readRetainedSourceSurface(f.canvas),before),true);
});

test('a pending rejected old HTML play remains bound to the old owner until its finally settles',async t=>{
  const f=await fixture(t);f.player.start();f.player.setSpanish(true);const before=f.before(f.canvas),pending=f.plays[0];
  assert.equal(readTechnicalResourceOwner(pending.media)?.playerId,before.identity.playerId);
  (f.canvas as any).isConnected=false;f.player.destroy();f.reserve();f.contexts[0].finishClose();
  assert.equal(sourceVmRetired(readRetainedSourceSurface(f.canvas),before),false);
  pending.pending.reject(new Error('synthetic blocked autoplay'));await flush();
  assert.equal(sourceVmRetired(readRetainedSourceSurface(f.canvas),before),true);
});

test('all overlapping old HTML play promises must settle, not only the latest one',async t=>{
  const f=await fixture(t);f.player.start();f.player.setSpanish(true);const resume=f.player.resumeAudio();await flush();
  assert.equal(f.plays.length,2);const before=f.before(f.canvas);assert.equal(before.lifecycle.htmlMedia[0].pendingPlays,2);
  (f.canvas as any).isConnected=false;f.player.destroy();f.reserve();f.contexts[0].finishClose();
  f.plays[0].pending.resolve();await flush();assert.equal(readRetainedSourceSurface(f.canvas).observation.lifecycle.htmlMedia[0].pendingPlays,1);
  assert.equal(sourceVmRetired(readRetainedSourceSurface(f.canvas),before),false);
  f.plays[1].pending.resolve();await resume;await flush();assert.equal(sourceVmRetired(readRetainedSourceSurface(f.canvas),before),true);
});

test('same-player reload cannot erase the old pending HTML element during asynchronous preparation',async t=>{
  const f=await fixture(t);f.player.start();f.player.setSpanish(true);const old=f.observe(f.canvas),session=f.reserve();
  const loading=f.player.load(f.data,f.pageFactory,'/fixture/',{audio:true,session,dataSha256:f.dataSha256,replay:0,progressTimeline:113});
  const during=f.observe(f.canvas);
  assert.equal(during.identity.playerId,old.identity.playerId);assert.equal(during.lifecycle.htmlMedia.length,1);
  assert.equal(during.lifecycle.htmlMedia[0].pendingPlays,1);assert.equal(during.lifecycle.ownsActiveLoad,false);
  await loading;assert.notEqual(f.observe(f.canvas).identity.playerId,old.identity.playerId);
});

test('language-toggle audit is bounded and overflow remains explicit incomplete evidence',async t=>{
  const f=await fixture(t),before=f.before(f.canvas);
  for(let i=0;i<70;i++){f.player.setSpanish(true);f.player.setSpanish(false);}
  assert.equal(f.media.length,70,'diagnostics do not block source playback controls');
  const live=f.observe(f.canvas).lifecycle;assert.equal(live.htmlMedia.length,64);assert.equal(live.htmlMediaObservationOverflow,6);
  (f.canvas as any).isConnected=false;f.player.destroy();f.reserve();f.contexts[0].finishClose();
  assert.equal(sourceVmRetired(readRetainedSourceSurface(f.canvas),before),false);
});

test('late old teardown cannot retire or stop a successor using the same lesson VM',async t=>{
  const f=await fixture(t);f.player.start();const oldIdentity=f.observe(f.canvas).identity;
  const next=await f.load();next.player.start();const nextIdentity=f.observe(next.canvas).identity;
  assert.notEqual(oldIdentity.playerId,nextIdentity.playerId);assert.equal(f.player.rt,null);
  f.player.destroy();assert.equal(f.observe(next.canvas).status,'ready');assert.equal(next.player.running,true);assert.equal(f.frames.size,1);
  assert.equal(f.observe(next.canvas).lifecycle.pageLeaseCurrent,true);
});

test('first and repeated lifecycle reads do not mutate source, media, RAF or diagnostic identity allocation',async t=>{
  const f=await fixture(t);f.player.start();f.player.setSpanish(true);const rt=f.player.rt!;
  const facts=()=>({tick:rt.tickCount,frame:rt.page_.frame,rafIds:[...f.frames.keys()],plays:f.plays.length,paused:f.media[0].paused,context:f.contexts[0].state});
  const before=facts(),serialBefore=Number(technicalObjectId({},'probe').split(':').at(-1));
  const first=f.player.technicalLifecycle as any,second=f.observe(f.canvas).lifecycle,third=f.player.technicalLifecycle as any;
  const serialAfter=Number(technicalObjectId({},'probe').split(':').at(-1));
  assert.equal(serialAfter,serialBefore+1,'resource IDs were allocated by the producer, never the getter');
  assert.deepEqual(facts(),before);
  const withoutTime=({observedAtMs,...rest}:any)=>rest;
  assert.deepEqual(withoutTime(first),withoutTime(second));assert.deepEqual(withoutTime(first),withoutTime(third));
});

test('surface diagnostic returns a clone and cannot attach an old lifecycle to a new committed owner',()=>{
  const surface={isConnected:true} as unknown as Element,instance={};
  const identity=nativeTechnicalOwner(instance,surface,'shared-nms002-l07-p005','a'.repeat(64),0);
  const live={identity,flag:1};bindTechnicalLifecycle(surface,identity,()=>live);
  publishTechnicalCommit(surface,identity,'maintained-dom-module-v1',{frame:1,frameDomain:'root',errors:[],missing:[]});
  const read=()=>((surface as any).__g678TechnicalRead());const first=read();first.lifecycle.flag=99;assert.equal(read().lifecycle.flag,1);
  publishTechnicalCommit(surface,{...identity,playerId:'new-real-owner'},'maintained-dom-module-v1',{frame:1,frameDomain:'root',errors:[],missing:[]});
  assert.equal(read().lifecycle,undefined);
});
