import assert from 'node:assert/strict';
import test from 'node:test';
import {AlgL06P034ClockV1,type P034GlossaryKey} from './alg-l06-p034-clock-v1';
import {P034_SOURCE} from './alg-l06-p034-audio-clock-v1';
import type {P025MainAudio} from './alg-l06-p025-audio-owner-v1';
import type {DecodedSourceStreamBinding,DecodedStreamPhase,DecodedStreamSnapshot}
 from './decoded-source-stream-transport';

const USER={activation:'user' as const,reducedMotion:false};
const RATE=22050,SAMPLES=741312;
const BINDING:DecodedSourceStreamBinding={
 sourceSha256:P034_SOURCE.mainSha256,sourceBytes:167310,sampleRate:RATE,
 channels:1,decodedSamples:SAMPLES,pcmSha256:P034_SOURCE.mainPcmSha256,
};
const deferred=()=>{let release!:()=>void;
 const promise=new Promise<void>(resolve=>{release=resolve;});
 return {promise,release:()=>release()};};

class Context extends EventTarget{
 currentTime=0;sampleRate=RATE;
 state:'suspended'|'running'|'closed'='suspended';
 resumeGate:Promise<void>|null=null;
 async resume(){
  if(this.resumeGate)await this.resumeGate;
  if(this.state==='closed')throw Error('context-closed');
  this.state='running';this.dispatchEvent(new Event('statechange'));
 }
 async close(){this.state='closed';this.dispatchEvent(new Event('statechange'));}
 suspend(){this.state='suspended';this.dispatchEvent(new Event('statechange'));}
}

function fixture(options:{commit?:(frame:number)=>boolean;
 canOpen?:(key:P034GlossaryKey,frame:number)=>boolean}={}){
 const context=new Context(),commits:number[]=[],starts:number[]=[],listeners=new Set<()=>void>();
 let phase:DecodedStreamPhase='idle',cursor=0,epoch=0,startTime=0,startSample=0,
  heldContextTime:number|null=null,pauses=0,replays=0,closes=0,prepares=0;
 const emit=()=>{for(const listener of listeners)listener();};
 const sampleNow=()=>phase==='playing'?Math.min(SAMPLES,
  startSample+Math.max(0,context.currentTime-startTime)*RATE):cursor;
 const native={
  subscribe(listener:()=>void){listeners.add(listener);return()=>listeners.delete(listener);},
  async prepare(_bytes:ArrayBuffer){prepares++;context;
   phase='ready';emit();return {accepted:true,reason:'ready'};},
  snapshot():DecodedStreamSnapshot{return {phase,epoch,decodedSample:sampleNow(),
   contextTime:context.currentTime,heldContextTime,
   playbackAnchor:phase==='playing'?{contextTime:startTime,decodedSample:startSample}:null,
   elapsedMs:sampleNow()/RATE*1000,volume:1,failure:null,
   sourceAlignment:'unresolved',lessonCompleted:false};},
  async play(_policy:{activation:'automatic'|'user';reducedMotion:boolean}){
   const ticket=++epoch;phase='start-pending';emit();
   await context.resume();
   if(ticket!==epoch||phase!=='start-pending')
    return {accepted:false,reason:'stale-start'};
   startTime=context.currentTime;startSample=cursor;heldContextTime=null;
   starts.push(cursor);phase='playing';emit();
   return {accepted:true,reason:'playing'};
  },
  pause(){
   if(phase!=='playing'&&phase!=='start-pending')
    return {accepted:false,reason:'not-playing'};
   cursor=sampleNow();epoch++;heldContextTime=context.currentTime;
   phase='paused';pauses++;emit();return {accepted:true,reason:'paused'};
  },
  replay(){epoch++;cursor=0;phase='ready';replays++;emit();
   return {accepted:true,reason:'ready'};},
  setVolume(_value:number){return {accepted:true,reason:'volume-set'};},
  async close(){epoch++;phase='closed';closes++;emit();await context.close();},
 };
 const clock=new AlgL06P034ClockV1({binding:BINDING,
  commitFrame:frame=>{commits.push(frame);return options.commit?.(frame)??true;},
  canOpenGlossary:options.canOpen??((_key,frame)=>frame>=10),
  createContext:()=>context as unknown as AudioContext,
  createTransport:(_binding,createContext)=>{
   assert.equal(createContext(),context as unknown as AudioContext);
   return native;
  }});
 return {clock,context,commits,starts,
  counts:()=>({pauses,replays,closes,prepares}),
  nativePhase:()=>phase,nativeEpoch:()=>epoch,
  at(frame:number){context.currentTime=(frame-1)/12;return clock.tick();},
  advance(seconds:number){context.currentTime+=seconds;return clock.tick();},
  end(){assert.equal(phase,'playing');cursor=SAMPLES;phase='buffer-ended';emit();},
  staleEnd(oldEpoch:number){
   const currentPhase=phase,currentEpoch=epoch;
   phase='buffer-ended';epoch=oldEpoch;emit();
   phase=currentPhase;epoch=currentEpoch;
  }};
}

test('P034 main binding is exact and initial Play requires user activation',async()=>{
 assert.throws(()=>new AlgL06P034ClockV1({binding:{...BINDING,
  pcmSha256:'0'.repeat(64)},commitFrame:()=>true}),
  /P034_MAIN_BROWSER_BINDING_OR_COMMIT_MISSING/);
 const f=fixture();assert((await f.clock.prepare(new ArrayBuffer(1))).accepted);
 const ownerClock:P025MainAudio=f.clock;
 assert.equal(ownerClock.snapshot().frame,1);
 assert.equal((await f.clock.play({activation:'automatic',reducedMotion:false} as
  unknown as typeof USER)).accepted,false);
 assert.equal(f.starts.length,0);
 assert((await f.clock.play(USER)).accepted);
 assert.deepEqual(f.starts,[0]);assert.equal(f.clock.snapshot().frame,1);
 await f.clock.close();
});

test('one uninterrupted main node crosses 197, 198–226 and 227 without pause or seek',async()=>{
 const f=fixture();await f.clock.prepare(new ArrayBuffer(1));await f.clock.play(USER);
 for(const frame of [196,197,198,205,226,227,300]){
  const s=f.at(frame);
  assert.equal(s.frame,frame);assert.equal(s.phase,'playing');
  assert.equal(s.nativeEofObserved,false);
  assert.deepEqual(f.starts,[0]);assert.equal(f.counts().pauses,0);
 }
 assert.equal(f.nativePhase(),'playing');
 assert.equal(f.clock.snapshot().sourceAlignment,'unverified');
 assert.equal(f.clock.snapshot().lessonCompleted,false);
 await f.clock.close();
});

test('native EOF before source stop continues the AudioContext visual tail to 433',async()=>{
 const f=fixture();await f.clock.prepare(new ArrayBuffer(1));await f.clock.play(USER);
 f.context.currentTime=34;const before=f.clock.tick();
 assert(before.frame<433);assert.equal(before.audio.decodedSample,SAMPLES);
 assert.equal(before.nativeEofObserved,false);
 f.end();assert.equal(f.clock.snapshot().nativeEofObserved,true);
 assert.equal(f.clock.snapshot().phase,'playing');
 assert.equal(f.clock.snapshot().sourceStopHeld,false);
 f.context.currentTime=36;const stopped=f.clock.tick();
 assert.equal(stopped.frame,433);assert.equal(stopped.phase,'timeline-ended');
 assert.equal(stopped.sourceStopHeld,true);assert.equal(stopped.lessonCompleted,false);
 assert.deepEqual(f.starts,[0]);
 f.context.currentTime=40;assert.equal(f.clock.tick().frame,433);
 await f.clock.close();
});

test('authored frame 433 holds visual while a late main source awaits natural EOF',async()=>{
 const f=fixture();await f.clock.prepare(new ArrayBuffer(1));await f.clock.play(USER);
 const held=f.at(433);
 assert.equal(held.frame,433);assert.equal(held.phase,'playing');
 assert.equal(held.sourceStopHeld,true);
 assert.equal(held.mainFinalAudioTailPending,true);
 assert.equal(held.timelineReachedEnd,false);
 f.end();assert.equal(f.clock.snapshot().phase,'timeline-ended');
 assert.equal(f.clock.snapshot().lessonCompleted,false);
 await f.clock.close();
});

test('Pause and Play inside the source block gap hold exact visual and decoded cursors',async()=>{
 const f=fixture();await f.clock.prepare(new ArrayBuffer(1));await f.clock.play(USER);
 const before=f.at(205),sample=before.audio.decodedSample;
 assert(f.clock.pause().accepted);assert.equal(f.nativePhase(),'paused');
 f.context.currentTime=100;assert.equal(f.clock.tick().frame,205);
 assert.equal(f.clock.snapshot().audio.decodedSample,sample);
 assert((await f.clock.play(USER)).accepted);
 assert.deepEqual(f.starts,[0,sample]);
 f.context.currentTime+=1/12;assert.equal(f.clock.tick().frame,206);
 assert.equal(f.counts().pauses,1);
 await f.clock.close();
});

test('full decoded cursor before callback remains pending, never synthetic EOF',async()=>{
 const f=fixture();await f.clock.prepare(new ArrayBuffer(1));await f.clock.play(USER);
 f.context.currentTime=34;assert.equal(f.clock.snapshot().audio.decodedSample,SAMPLES);
 assert.equal(f.clock.snapshot().nativeEofObserved,false);
 assert(f.clock.pause().accepted);
 assert.equal(f.clock.snapshot().nativeEofPending,true);
 assert.equal(f.nativePhase(),'playing');assert.equal(f.counts().pauses,0);
 assert.equal((await f.clock.play(USER)).reason,'native-eof-pending');
 f.end();assert.equal(f.clock.snapshot().nativeEofObserved,true);
 assert.equal(f.clock.snapshot().nativeEofPending,false);
 assert.equal(f.clock.snapshot().phase,'paused');
 assert((await f.clock.play(USER)).accepted);
 assert.deepEqual(f.starts,[0]); // visual-only after genuine main EOF
 f.context.currentTime+=3;assert.equal(f.clock.tick().frame,433);
 await f.clock.close();
});

test('post-EOF visual Pause, context interruption, and Return-like Play create no main node',async()=>{
 const f=fixture();await f.clock.prepare(new ArrayBuffer(1));await f.clock.play(USER);
 f.context.currentTime=34;f.clock.tick();f.end();
 f.advance(.5);const pausedAt=f.clock.snapshot().frame;
 f.context.suspend();assert.equal(f.clock.snapshot().phase,'paused');
 f.context.currentTime=100;assert.equal(f.clock.snapshot().frame,pausedAt);
 assert((await f.clock.play(USER)).accepted);
 assert.deepEqual(f.starts,[0]);
 assert(f.clock.pause().accepted);assert.equal(f.nativePhase(),'buffer-ended');
 assert((await f.clock.play(USER)).accepted);
 assert.deepEqual(f.starts,[0]);
 await f.clock.close();
});

test('interruption before EOF holds decoded cursor; explicit user Play resumes it',async()=>{
 const f=fixture();await f.clock.prepare(new ArrayBuffer(1));await f.clock.play(USER);
 f.context.currentTime=5;const held=f.clock.tick();
 f.context.suspend();assert.equal(f.clock.snapshot().phase,'paused');
 assert.equal(f.clock.snapshot().frame,held.frame);
 const sample=f.clock.snapshot().audio.decodedSample;
 f.context.currentTime=60;assert.equal(f.clock.snapshot().frame,held.frame);
 assert((await f.clock.play(USER)).accepted);
 assert.deepEqual(f.starts,[0,sample]);
 await f.clock.close();
});

test('interruption at full cursor without onended cannot synthesize EOF or restart at decoder end',async()=>{
 const f=fixture();await f.clock.prepare(new ArrayBuffer(1));await f.clock.play(USER);
 f.context.currentTime=34;assert.equal(f.clock.snapshot().audio.decodedSample,SAMPLES);
 f.context.suspend();assert.equal(f.clock.snapshot().phase,'paused');
 assert.equal(f.clock.snapshot().nativeEofObserved,false);
 assert.equal((await f.clock.play(USER)).reason,
  'main-native-eof-unobserved-replay-required');
 assert.deepEqual(f.starts,[0]);
 assert(f.clock.replay().accepted);assert.equal(f.clock.snapshot().frame,1);
 await f.clock.close();
});

test('Replay invalidates old EOF, resets frame 1 and glossary without autoplay',async()=>{
 const f=fixture();await f.clock.prepare(new ArrayBuffer(1));await f.clock.play(USER);
 f.at(20);
 assert.equal(f.clock.openGlossary('unknown' as P034GlossaryKey).accepted,false);
 assert(f.clock.openGlossary('Function').accepted);
 assert.equal(f.clock.snapshot().glossaryOpen,'Function');
 assert.equal((await f.clock.play(USER)).reason,'glossary-open-hold');
 assert(f.clock.closeGlossary().accepted);
 const prior=f.nativeEpoch();assert(f.clock.replay().accepted);
 assert.equal(f.clock.snapshot().frame,1);
 assert.equal(f.clock.snapshot().phase,'ready');
 assert.equal(f.clock.snapshot().glossaryOpen,null);
 assert.equal(f.clock.snapshot().nativeEofObserved,false);
 assert.equal(f.clock.snapshot().lessonCompleted,false);
 assert.equal(f.counts().replays,1);
 f.staleEnd(prior);assert.equal(f.clock.snapshot().nativeEofObserved,false);
 assert.deepEqual(f.starts,[0]);
 await f.clock.play(USER);assert.deepEqual(f.starts,[0,0]);
 f.staleEnd(prior);assert.equal(f.clock.snapshot().nativeEofObserved,false);
 assert.equal(f.clock.snapshot().phase,'playing');
 await f.clock.close();
});

test('pending Play is invalidated by Replay and close; stale callbacks cannot restart',async()=>{
 for(const action of ['replay','close'] as const){
  const f=fixture(),wait=deferred();await f.clock.prepare(new ArrayBuffer(1));
  f.context.resumeGate=wait.promise;
  const pending=f.clock.play(USER);
  assert.equal(f.clock.snapshot().phase,'start-pending');
  if(action==='replay')assert(f.clock.replay().accepted);
  else{const closing=f.clock.close();wait.release();await closing;}
  if(action==='replay')wait.release();
  assert.equal((await pending).accepted,false);
  assert.deepEqual(f.starts,[]);
  if(action==='replay')await f.clock.close();
 }
});

test('failed frame commit retires sound; close prevents stale native callbacks',async()=>{
 const f=fixture({commit:frame=>frame<12});
 await f.clock.prepare(new ArrayBuffer(1));await f.clock.play(USER);
 f.at(20);assert.equal(f.clock.snapshot().phase,'failed');
 assert.equal(f.nativePhase(),'paused');
 const old=f.nativeEpoch();await f.clock.close();
 assert.equal(f.clock.snapshot().phase,'closed');
 f.staleEnd(old);assert.equal(f.clock.snapshot().nativeEofObserved,false);
 assert.equal(f.counts().closes,1);
});
