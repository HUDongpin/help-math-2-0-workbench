import assert from 'node:assert/strict';
import test from 'node:test';
import {P034OptionalSpanishAudio,P034_SA_ASSET}
 from './alg-l06-p034-optional-spanish-audio-v1';
import type {DecodedSourceStreamBinding,DecodedStreamPhase,DecodedStreamSnapshot}
 from './decoded-source-stream-transport';

const BINDING:DecodedSourceStreamBinding={
 sourceBytes:P034_SA_ASSET.sourceBytes,sourceSha256:P034_SA_ASSET.sourceSha256,
 sampleRate:P034_SA_ASSET.sampleRate,channels:1,
 decodedSamples:P034_SA_ASSET.decodedSamples,pcmSha256:P034_SA_ASSET.pcmSha256};
const USER={activation:'user' as const};
const turn=()=>new Promise<void>(resolve=>setImmediate(resolve));

function fixture(){
 let phase:DecodedStreamPhase='idle',cursor=0,epoch=0,loads=0,prepares=0,
  transports=0,closes=0,ended=0,failNextPlay=false,volumeFailure=false,
  deferNext=false,throwNextPlay=false,observerThrows=false,
  releasePlay:(()=>void)|null=null;
 const starts:number[]=[],listeners=new Set<()=>void>();
 const emit=()=>{for(const listener of listeners)listener();};
 const transport={
  snapshot:()=>({phase,epoch,decodedSample:cursor,contextTime:0,
   heldContextTime:null,playbackAnchor:null,elapsedMs:0,volume:1,failure:null,
   sourceAlignment:'unresolved',lessonCompleted:false}) as DecodedStreamSnapshot,
  subscribe(listener:()=>void){listeners.add(listener);return()=>listeners.delete(listener);},
  async prepare(_bytes:ArrayBuffer){prepares++;phase='ready';emit();
   return {accepted:true,reason:'ready'};},
  async play(_policy:{activation:'user';reducedMotion:boolean}){
   if(throwNextPlay){throwNextPlay=false;throw Error('native-start-exception');}
   const ticket=++epoch;phase='start-pending';emit();
   if(deferNext){deferNext=false;await new Promise<void>(resolve=>{releasePlay=resolve;});}
   if(ticket!==epoch||phase!=='start-pending')
    return {accepted:false,reason:'stale-start'};
   if(failNextPlay){failNextPlay=false;phase='play-rejected';emit();
    return {accepted:false,reason:'resume-rejected'};}
   starts.push(cursor);phase='playing';emit();return {accepted:true,reason:'playing'};
  },
  pause(){epoch++;phase='paused';emit();return {accepted:true,reason:'paused'};},
  setVolume(_value:number){return volumeFailure?
   {accepted:false,reason:'volume-rejected'}:{accepted:true,reason:'volume-set'};},
  async close(){closes++;epoch++;phase='closed';emit();},
 };
 const audio=new P034OptionalSpanishAudio({binding:BINDING,onChange:()=>{
   if(observerThrows)throw Error('observer-exception');},
  onEnded:()=>{ended++;},load:async()=>{loads++;return new ArrayBuffer(1);},
  createTransport:()=>{transports++;return transport;}});
 return {audio,starts,setCursor:(value:number)=>{cursor=value;},
  end:()=>{cursor=BINDING.decodedSamples;phase='buffer-ended';emit();},
  defer:()=>{deferNext=true;},failPlay:()=>{failNextPlay=true;},
  throwPlay:()=>{throwNextPlay=true;},failObserver:()=>{observerThrows=true;},
  failVolume:()=>{volumeFailure=true;},
  release:()=>{assert(releasePlay);const release=releasePlay;releasePlay=null;release();},
  counts:()=>({loads,prepares,transports,closes,ended}),
  nativePhase:()=>phase};
}

test('exact physical SA and Chromium PCM binding plus mandatory loader',()=>{
 assert.throws(()=>new P034OptionalSpanishAudio({binding:{...BINDING,
  sourceBytes:BINDING.sourceBytes-1},load:async()=>new ArrayBuffer(1),
  onChange:()=>{},onEnded:()=>{}}),/P034_SA_BROWSER_BINDING_OR_LOADER_MISSING/);
 assert.throws(()=>new P034OptionalSpanishAudio({binding:{...BINDING,
  pcmSha256:'0'.repeat(64)},load:async()=>new ArrayBuffer(1),
  onChange:()=>{},onEnded:()=>{}}),/P034_SA_BROWSER_BINDING_OR_LOADER_MISSING/);
 assert.throws(()=>new P034OptionalSpanishAudio({binding:BINDING,
  load:undefined as unknown as (signal:AbortSignal)=>Promise<ArrayBuffer>,
  onChange:()=>{},onEnded:()=>{}}),/P034_SA_BROWSER_BINDING_OR_LOADER_MISSING/);
});

test('construction and locale are inert; user Pause→Play resumes same buffer and cursor',async()=>{
 const f=fixture();assert.equal(f.audio.snapshot().phase,'idle');
 assert.deepEqual(f.counts(),{loads:0,prepares:0,transports:0,closes:0,ended:0});
 assert.equal((await f.audio.start({activation:'automatic'} as unknown as typeof USER)).accepted,false);
 assert((await f.audio.start(USER)).accepted);assert.deepEqual(f.starts,[0]);
 f.setCursor(54321);assert(f.audio.pause().accepted);
 assert.equal(f.audio.snapshot().decodedSample,54321);
 assert.equal(f.audio.snapshot().canResume,true);
 assert.equal((await f.audio.resume({activation:'automatic'} as unknown as typeof USER)).accepted,false);
 assert((await f.audio.resume(USER)).accepted);
 assert.deepEqual(f.starts,[0,54321]);
 assert.deepEqual(f.counts(),{loads:1,prepares:1,transports:1,closes:0,ended:0});
 await f.audio.close();assert.equal(f.counts().closes,1);
});

test('natural native end retires first and invokes callback once; stale end cannot recur',async()=>{
 const f=fixture();assert((await f.audio.start(USER)).accepted);
 f.setCursor(12345);f.audio.pause();assert((await f.audio.resume(USER)).accepted);
 f.end();await turn();
 assert.equal(f.audio.snapshot().phase,'ended');
 assert.equal(f.audio.snapshot().canResume,false);
 assert.deepEqual(f.counts(),{loads:1,prepares:1,transports:1,closes:1,ended:1});
 f.end();await turn();assert.equal(f.counts().ended,1);
 await f.audio.close();
});

test('Pause during pending Play keeps buffer; stale completion cannot restart it',async()=>{
 const f=fixture();f.defer();const pending=f.audio.start(USER);
 await turn();assert.equal(f.nativePhase(),'start-pending');
 assert(f.audio.pause().accepted);assert.equal(f.audio.snapshot().phase,'paused');
 f.release();assert.equal((await pending).accepted,false);
 f.setCursor(40000);assert(f.audio.snapshot().canResume);
 assert((await f.audio.resume(USER)).accepted);
 assert.deepEqual(f.starts,[40000]);
 assert.equal(f.counts().transports,1);
 await f.audio.close();
});

test('Pause during loading aborts; close and stale load never create transport',async()=>{
 let loadStarted:()=>void=()=>{},aborted=false;
 const started=new Promise<void>(resolve=>{loadStarted=resolve;});
 const audio=new P034OptionalSpanishAudio({binding:BINDING,onChange:()=>{},onEnded:()=>{},
  load:signal=>new Promise<ArrayBuffer>((_resolve,reject)=>{
   loadStarted();signal.addEventListener('abort',()=>{aborted=true;
    reject(Error('aborted'));},{once:true});
  }),createTransport:()=>{throw Error('transport-should-not-be-created');}});
 const pending=audio.start(USER);await started;
 assert(audio.pause().accepted);assert(aborted);
 assert.equal((await pending).accepted,false);
 assert.equal(audio.snapshot().canResume,false);
 await audio.close();assert.equal(audio.snapshot().phase,'closed');
});

test('resume rejection and volume exception immediately retire active sound',async()=>{
 const f=fixture();await f.audio.start(USER);f.setCursor(8000);f.audio.pause();
 f.failPlay();const rejected=await f.audio.resume(USER);
 assert.equal(rejected.accepted,false);assert.equal(f.audio.snapshot().phase,'error');
 assert.equal(rejected.reason,'resume-rejected');
 assert.equal(f.counts().closes,1);await f.audio.close();
 const g=fixture();await g.audio.start(USER);g.failVolume();
 assert.equal(g.audio.setVolume(0.5).accepted,false);
 assert.equal(g.audio.snapshot().phase,'error');assert.equal(g.counts().closes,1);
 await g.audio.close();
});

test('thrown native start or host observer immediately retires the transport',async()=>{
 const f=fixture();await f.audio.start(USER);f.setCursor(8100);f.audio.pause();
 f.throwPlay();const thrown=await f.audio.resume(USER);
 assert.equal(thrown.reason,'native-start-exception');
 assert.equal(f.audio.snapshot().phase,'error');assert.equal(f.counts().closes,1);
 await f.audio.close();
 const g=fixture();await g.audio.start(USER);g.failObserver();
 const rejected=g.audio.setVolume(0.4);
 assert.equal(rejected.accepted,false);
 assert.equal(g.audio.snapshot().failure,'P034_OPTIONAL_SA_OBSERVER_FAILED');
 assert.equal(g.counts().closes,1);await g.audio.close();
});
