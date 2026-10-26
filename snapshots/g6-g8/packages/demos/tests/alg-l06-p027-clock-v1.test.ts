import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {AlgL06P027ClockV1} from '../src/alg-l06-p027-clock-v1';
import {P027_MAIN_ASSET,P027_SA_ASSET,P027_AUDIO_DISPOSITION,p027AudioSlice}
 from '../src/alg-l06-p027-audio-schedule-v1';
import type {DecodedSourceStreamBinding,DecodedStreamPhase}
 from '../src/decoded-source-stream-transport';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
const plan=JSON.parse(fs.readFileSync(path.join(root,
 'output/alg-l06-p027-audio-extraction-v1/audio-domain-plan-v1.json'),'utf8'));
const USER={activation:'user' as const,reducedMotion:false};
const BINDING:DecodedSourceStreamBinding={sourceSha256:P027_MAIN_ASSET.sourceSha256,
 sourceBytes:P027_MAIN_ASSET.sourceBytes,sampleRate:22050,channels:1,
 decodedSamples:1412352,pcmSha256:'a'.repeat(64)};

test('P027 source run, separate SA and provisional PCM remain distinct',()=>{
 assert.equal(P027_MAIN_ASSET.sourceSha256,plan.main.asset.sha256);
 assert.equal(P027_MAIN_ASSET.sourceBytes,plan.main.asset.bytes);
 assert.equal(P027_SA_ASSET.sourceSha256,plan.optionalSpanishAudio.asset.sha256);
 assert.deepEqual(P027_AUDIO_DISPOSITION.mainRanges,[[2,770]]);
 assert.deepEqual(P027_AUDIO_DISPOSITION.zeroPayloadFrames,[3]);
 assert.equal(P027_AUDIO_DISPOSITION.browserDecodeObserved,false);
 assert.equal(P027_AUDIO_DISPOSITION.separateSaSpliced,false);
 assert.equal(P027_AUDIO_DISPOSITION.localeStartsAudio,false);
 assert.equal(p027AudioSlice(1,1412352)?.firstDecodedSample,1673);
 assert.equal(p027AudioSlice(1,1412352)?.delaySeconds,1/12);
 assert.equal(p027AudioSlice(770,1412352),null,
  'source sample estimate is not permission to invent native EOF');
 assert.throws(()=>new AlgL06P027ClockV1({commitFrame:()=>true}),
  /P027_BROWSER_PCM_BINDING_REQUIRED/);
});

class Context extends EventTarget{
 currentTime=0;sampleRate=22050;state:'suspended'|'running'|'closed'='suspended';closeCount=0;
 async resume(){if(this.state==='closed')throw Error('closed');this.state='running';
  this.dispatchEvent(new Event('statechange'));}
 async close(){if(this.state!=='closed'){this.closeCount++;this.state='closed';
  this.dispatchEvent(new Event('statechange'));}}
 interrupt(){this.state='suspended';this.dispatchEvent(new Event('statechange'));}
}
function fixture(sampleScale=1){
 const context=new Context(),commits:number[]=[],starts:{sample:number;delay:number}[]=[];
 let phase:DecodedStreamPhase='idle',cursor=0,epoch=0,startTime=0,
  startSample=0,heldTime:number|null=null,releaseStart:(()=>void)|null=null,defer=false;
 const listeners=new Set<()=>void>(),emit=()=>{for(const listener of listeners)listener();};
 const stop=(next:DecodedStreamPhase)=>{
  if(phase==='playing')cursor=Math.min(BINDING.decodedSamples,
   startSample+Math.max(0,context.currentTime-startTime)*BINDING.sampleRate*sampleScale);
  epoch++;if(phase==='playing'||phase==='start-pending')heldTime=context.currentTime;
  phase=next;emit();
 };
 const clock=new AlgL06P027ClockV1({binding:BINDING,
  createContext:()=>context as unknown as AudioContext,
  commitFrame:frame=>{commits.push(frame);return true;},
  createTransport:(_binding,createContext)=>({
   subscribe(listener:()=>void){listeners.add(listener);return()=>listeners.delete(listener);},
   async prepare(){createContext();phase='ready';return {accepted:true,reason:'ready'};},
   snapshot(){return {phase,epoch,decodedSample:phase==='playing'?
    Math.min(BINDING.decodedSamples,startSample+
     Math.max(0,context.currentTime-startTime)*BINDING.sampleRate*sampleScale):cursor,
    contextTime:context.currentTime,heldContextTime:heldTime,
    playbackAnchor:phase==='playing'?{contextTime:startTime,decodedSample:startSample}:null,
    elapsedMs:0,volume:1,failure:null,sourceAlignment:'unresolved' as const,
    lessonCompleted:false as const};},
   seekDecodedSample(sample:number){stop('paused');cursor=sample;
    return {accepted:true,reason:'seeked'};},
   async play(policy:{delaySeconds?:number}){
    const ticket=++epoch;phase='start-pending';
    if(defer)await new Promise<void>(resolve=>{releaseStart=resolve;});
    if(ticket!==epoch)return {accepted:false,reason:'stale-start'};
    await context.resume();if(ticket!==epoch)return {accepted:false,reason:'stale-start'};
    startTime=context.currentTime+(policy.delaySeconds??0);startSample=cursor;
    starts.push({sample:cursor,delay:policy.delaySeconds??0});
    phase='playing';emit();return {accepted:true,reason:'playing'};
   },
   pause(){stop('paused');return {accepted:true,reason:'paused'};},
   replay(){stop('ready');cursor=0;return {accepted:true,reason:'ready'};},
   holdSourceBoundary(){stop('boundary-held');return {accepted:true,reason:'held'};},
   setVolume(){return {accepted:true,reason:'volume'};},
   async close(){stop('closed');await context.close();},
  })});
 return {clock,context,commits,starts,
  end(){if(phase==='playing'){cursor=BINDING.decodedSamples;phase='buffer-ended';emit();}},
  active(){return phase==='playing';},
  at(frame:number){context.currentTime=(frame-1)/12;return clock.tick();},
  defer(){defer=true;},release(){releaseStart?.()},
 };
}

test('explicit user play holds frame 770 for actual native EOF',async()=>{
 const f=fixture();assert((await f.clock.prepare(new ArrayBuffer(1))).accepted);
 assert.equal((await f.clock.play({activation:'automatic',reducedMotion:false})).accepted,false);
 assert((await f.clock.play(USER)).accepted);
 assert.deepEqual(f.starts,[{sample:1673,delay:1/12}]);
 const held=f.at(770);assert.equal(held.frame,770);
 assert.equal(held.phase,'playing');assert.equal(held.mainFinalAudioTailPending,true);
 f.context.currentTime+=2;assert.equal(f.clock.snapshot().phase,'playing');
 f.end();assert.equal(f.clock.snapshot().phase,'timeline-ended');
 assert.equal(f.clock.snapshot().nativeEofObserved,true);
 await f.clock.close();assert.equal(f.context.closeCount,1);
});

test('pause, interruption and Replay retire the native node without overlap',async()=>{
 const f=fixture();await f.clock.prepare(new ArrayBuffer(1));await f.clock.play(USER);
 f.at(600);const heard=f.clock.snapshot().audio.decodedSample;
 assert(f.clock.pause().accepted);assert.equal(f.active(),false);
 const held=f.clock.snapshot().activePosition;f.context.currentTime+=10;
 assert.equal(f.clock.snapshot().activePosition,held);
 assert((await f.clock.play(USER)).accepted);
 assert(f.starts.at(-1)!.sample>=heard-1e-7);
 f.context.interrupt();assert.equal(f.clock.snapshot().phase,'paused');
 assert.equal(f.active(),false);
 assert(f.clock.replay().accepted);assert.equal(f.clock.snapshot().frame,1);
 assert.equal(f.clock.snapshot().nativeEofObserved,false);
 await f.clock.close();
});

test('pause at held frame 770 resumes a slower native tail from its heard cursor',async()=>{
 const f=fixture(0.99);await f.clock.prepare(new ArrayBuffer(1));await f.clock.play(USER);
 f.at(770);const heard=f.clock.snapshot().audio.decodedSample;
 assert(heard<BINDING.decodedSamples);
 assert(f.clock.pause().accepted);
 assert((await f.clock.play(USER)).accepted);
 assert.equal(f.starts.at(-1)?.sample,heard);
 assert.equal(f.clock.snapshot().mainFinalAudioTailPending,true);
 f.end();assert.equal(f.clock.snapshot().phase,'timeline-ended');
 await f.clock.close();
});

test('Replay cancels a pending start and glossary requires its own revealed instance',async()=>{
 const f=fixture();await f.clock.prepare(new ArrayBuffer(1));
 assert.equal(f.clock.openGlossary('Vertical-line test').accepted,false);
 assert(f.clock.seekCandidateFrame(16).accepted);
 assert(f.clock.openGlossary('Vertical-line test').accepted);
 assert.equal((await f.clock.play(USER)).accepted,false);
 assert(f.clock.closeGlossary().accepted);
 assert(f.clock.replay().accepted);f.defer();
 const pending=f.clock.play(USER);await Promise.resolve();
 assert(f.clock.replay().accepted);f.release();
 assert.equal((await pending).reason,'stale-start');
 assert.equal(f.starts.length,0);await f.clock.close();
});
