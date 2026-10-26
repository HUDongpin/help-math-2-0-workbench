import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {AlgL06P026ClockV1} from '../src/alg-l06-p026-clock-v1';
import {P026_AUDIO_ASSETS,P026_AUDIO_DISPOSITION,P026_BROWSER_BINDINGS,
  P026_SA_BROWSER_BINDING,p026AudioSlice,type P026AudioId}
  from '../src/alg-l06-p026-audio-schedule-v1';
import type {DecodedSourceStreamBinding,DecodedStreamPhase}
  from '../src/decoded-source-stream-transport';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
const sourcePlan=JSON.parse(fs.readFileSync(path.join(root,
  'output/alg-l06-p026-audio-extraction-v1/audio-domain-plan-v2.json'),'utf8'));
const chrome=JSON.parse(fs.readFileSync(path.join(root,
  'output/alg-l06-p026-chrome-decode-v1/browser-decode.json'),'utf8'));
const USER={activation:'user' as const,reducedMotion:false};

test('two source MP3s, their independent seeks, gap, negative marker and Chrome PCM bind the schedule',()=>{
  assert.deepEqual(P026_AUDIO_DISPOSITION.mainRanges,[[31,158],[196,389]]);
  assert.deepEqual(P026_AUDIO_DISPOSITION.gapFrames,[159,195]);
  assert.deepEqual(P026_AUDIO_DISPOSITION.emptyNegativeSeekBlock,
    {frame:158,seekSamples:-2267,mp3PayloadBytes:0});
  assert.equal(P026_AUDIO_DISPOSITION.syntheticSilenceAdded,false);
  assert.equal(P026_AUDIO_DISPOSITION.mainRangesConcatenated,false);
  for(const [i,id] of (['main-1','main-2'] as const).entries()){
    const a=P026_AUDIO_ASSETS[i],source=sourcePlan.mainRanges[i],browser=chrome.results.find((r:{id:string})=>r.id===id);
    assert.equal(a.id,id);assert.equal(a.sourceSha256,source.sourceMp3.sha256);
    assert.equal(a.sourceBytes,source.sourceMp3.bytes);
    assert.deepEqual([a.firstBlockFrame,a.lastBlockFrame],source.blockFrameRange);
    assert.equal(a.initialSeekSamples,source.firstBlockSeekSamples);
    assert.equal(P026_BROWSER_BINDINGS[id].decodedSamples,browser.samples);
    assert.equal(P026_BROWSER_BINDINGS[id].pcmSha256,browser.pcmSha256);
  }
  assert.equal(P026_SA_BROWSER_BINDING.pcmSha256,
    chrome.results.find((r:{id:string})=>r.id==='separate-sa').pcmSha256);
  assert(Math.abs(p026AudioSlice('main-1',1,232704)!.delaySeconds-2.5)<1e-9);
  assert.equal(p026AudioSlice('main-1',1,232704)!.firstDecodedSample,1673);
  assert.equal(p026AudioSlice('main-1',159,232704),null);
  assert.equal(p026AudioSlice('main-2',196,356544)!.firstDecodedSample,541);
  assert.equal(p026AudioSlice('main-2',1,356544)!.delaySeconds,16.25);
  assert(p026AudioSlice('main-2',1,356544)!.advisoryNativeEndFrame>389);
});

class Context extends EventTarget{
  currentTime=0;sampleRate=22050;state:'suspended'|'running'|'closed'='suspended';closeCount=0;
  async resume(){if(this.state==='closed')throw Error('closed');this.state='running';
    this.dispatchEvent(new Event('statechange'));}
  async close(){if(this.state!=='closed'){this.closeCount++;this.state='closed';
    this.dispatchEvent(new Event('statechange'));}}
  interrupt(){this.state='suspended';this.dispatchEvent(new Event('statechange'));}
}
function fixture(){
  const context=new Context(),commits:number[]=[],
    starts:{id:P026AudioId;sample:number;delay:number}[]=[],
    transports={} as Record<P026AudioId,{end():void;active():boolean}>;
  let releaseFirst:(()=>void)|null=null;
  let deferFirst=false;
  const clock=new AlgL06P026ClockV1({
    createContext:()=>context as unknown as AudioContext,
    commitFrame:frame=>{commits.push(frame);return true;},
    createTransport:(binding:DecodedSourceStreamBinding,createContext,id)=>{
      let phase:DecodedStreamPhase='idle',cursor=0,epoch=0,startTime=0,
        startSample=0,heldTime:number|null=null,ctx:Context;
      const listeners=new Set<()=>void>();
      const emit=()=>{for(const listener of listeners)listener();};
      const stop=(next:DecodedStreamPhase)=>{
        if(phase==='playing')cursor=Math.min(binding.decodedSamples,
          startSample+Math.max(0,ctx.currentTime-startTime)*binding.sampleRate);
        epoch++;if(phase==='playing'||phase==='start-pending')
          heldTime=ctx.currentTime;phase=next;emit();};
      transports[id]={end(){if(phase!=='playing')return;cursor=binding.decodedSamples;
        phase='buffer-ended';emit();},active(){return phase==='playing';}};
      return {
        subscribe(listener:()=>void){listeners.add(listener);return()=>listeners.delete(listener);},
        async prepare(){ctx=createContext() as unknown as Context;phase='ready';
          return {accepted:true,reason:'ready'};},
        snapshot(){return {phase,epoch,decodedSample:phase==='playing'?
          Math.min(binding.decodedSamples,startSample+
            Math.max(0,ctx.currentTime-startTime)*binding.sampleRate):cursor,
          contextTime:ctx?.currentTime??null,heldContextTime:heldTime,
          playbackAnchor:phase==='playing'?{contextTime:startTime,decodedSample:startSample}:null,
          elapsedMs:0,volume:1,failure:null,sourceAlignment:'unresolved' as const,
          lessonCompleted:false as const};},
        seekDecodedSample(sample:number){stop('paused');cursor=sample;
          return {accepted:true,reason:'seeked'};},
        async play(policy:{delaySeconds?:number}){
          const ticket=++epoch;phase='start-pending';
          if(id==='main-1'&&deferFirst)await new Promise<void>(resolve=>{releaseFirst=resolve;});
          if(ticket!==epoch)return {accepted:false,reason:'stale-start'};
          await ctx.resume();if(ticket!==epoch)return {accepted:false,reason:'stale-start'};
          startTime=ctx.currentTime+(policy.delaySeconds??0);startSample=cursor;
          starts.push({id,sample:cursor,delay:policy.delaySeconds??0});
          phase='playing';emit();return {accepted:true,reason:'playing'};
        },
        pause(){stop('paused');return {accepted:true,reason:'paused'};},
        replay(){stop('ready');cursor=0;return {accepted:true,reason:'ready'};},
        holdSourceBoundary(){stop('boundary-held');return {accepted:true,reason:'held'};},
        setVolume(){return {accepted:true,reason:'volume'};},
        async close(){stop('closed');await ctx?.close();},
      };
    },
  });
  return {clock,context,commits,starts,transports,
    source:{'main-1':new ArrayBuffer(1),'main-2':new ArrayBuffer(1)},
    at(frame:number){context.currentTime=(frame-1)/12;return clock.tick();},
    defer(){deferFirst=true;},release(){releaseFirst?.();}};
}

test('visual clock crosses first native EOF and 159–195 gap; final frame waits for second real EOF',async()=>{
  const f=fixture();assert((await f.clock.prepare(f.source)).accepted);
  assert.equal((await f.clock.play({activation:'automatic',reducedMotion:false})).accepted,false);
  assert((await f.clock.play(USER)).accepted);
  assert.deepEqual(f.starts,[{id:'main-1',sample:1673,delay:2.5},
    {id:'main-2',sample:541,delay:16.25}]);
  f.at(156);f.transports['main-1'].end();
  assert.equal(f.at(160).audio.phase,'source-gap');
  assert.equal(f.at(195).frame,195);
  assert.equal(f.at(196).activeAudioId,'main-2');
  const held=f.at(389);
  assert.equal(held.phase,'playing');
  assert.equal(held.audio.phase,'playing','host narration remains active during native tail');
  assert.equal(held.mainFinalAudioTailPending,true);
  assert.equal(held.secondNativeEofObserved,false);
  f.context.currentTime+=1;
  assert.equal(f.clock.snapshot().phase,'playing','clock time cannot invent native EOF');
  f.transports['main-2'].end();
  assert.equal(f.clock.snapshot().phase,'timeline-ended');
  assert.equal(f.clock.snapshot().frame,389);
  await f.clock.close();assert.equal(f.context.closeCount,1);
});

test('pause, Replay, and context interruption retire both pending native ranges',async()=>{
  const f=fixture();await f.clock.prepare(f.source);await f.clock.play(USER);
  f.at(170);assert.equal(f.clock.pause().accepted,true);
  assert.equal(f.transports['main-1'].active(),false);
  assert.equal(f.transports['main-2'].active(),false);
  const held=f.clock.snapshot().activePosition;
  f.context.currentTime+=10;assert.equal(f.clock.snapshot().activePosition,held);
  assert((await f.clock.play(USER)).accepted);
  assert.equal(f.starts.at(-1)?.id,'main-2');
  assert(Math.abs(f.starts.at(-1)!.delay-(196-held)/12)<1e-9);
  f.context.interrupt();assert.equal(f.clock.snapshot().phase,'paused');
  assert.equal(f.transports['main-2'].active(),false);
  assert.equal(f.clock.replay().accepted,true);
  assert.equal(f.clock.snapshot().frame,1);
  assert.equal(f.clock.snapshot().secondNativeEofObserved,false);
  await f.clock.close();
});

test('a pending start canceled by Replay cannot later schedule either main source',async()=>{
  const f=fixture();await f.clock.prepare(f.source);f.defer();
  const pending=f.clock.play(USER);await Promise.resolve();
  assert.equal(f.clock.replay().accepted,true);
  f.release();assert.equal((await pending).reason,'stale-start');
  assert.equal(f.starts.length,0);assert.equal(f.clock.snapshot().frame,1);
  await f.clock.close();
});

test('pause at held frame 389 resumes the remaining native tail without replaying heard samples',async()=>{
  const f=fixture();await f.clock.prepare(f.source);await f.clock.play(USER);
  f.at(389);f.context.currentTime+=0.04;
  const before=f.clock.snapshot().audio.ranges['main-2'].decodedSample;
  assert.equal(f.clock.snapshot().frame,389);
  assert.equal(f.clock.pause().accepted,true);
  assert((await f.clock.play(USER)).accepted);
  assert.equal(f.starts.at(-1)?.id,'main-2');
  assert(f.starts.at(-1)!.sample>=before-1e-7);
  assert.equal(f.clock.snapshot().mainFinalAudioTailPending,true);
  f.transports['main-2'].end();
  assert.equal(f.clock.snapshot().phase,'timeline-ended');
  await f.clock.close();
});
