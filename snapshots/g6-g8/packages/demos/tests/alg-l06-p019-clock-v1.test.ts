import assert from 'node:assert/strict';
import test from 'node:test';
import {AlgL06P019ClockV1,type P019GlossaryKey} from '../src/alg-l06-p019-clock-v1';
import {P019_AUDIO_ASSETS,type P019AudioId} from '../src/alg-l06-p019-audio-schedule-v1';
import type {DecodedSourceStreamBinding,DecodedStreamPhase}
  from '../src/decoded-source-stream-transport';

class Context extends EventTarget{
  currentTime=0;
  state:'suspended'|'running'|'closed'='suspended';
  closeCount=0;
  async resume(){if(this.state==='closed')throw Error('closed');
    this.state='running';this.dispatchEvent(new Event('statechange'));}
  async close(){if(this.state!=='closed'){this.closeCount++;this.state='closed';
    this.dispatchEvent(new Event('statechange'));}}
}
const asset=P019_AUDIO_ASSETS[0];
const EOF=asset.firstBlockFrame+
  (asset.decodedSamples-asset.initialSeekSamples)/asset.sampleRate*12;
const USER={activation:'user' as const,reducedMotion:false};

function fixture(options:{deferPlay?:boolean;deferEnd?:boolean;holdSample?:boolean;
  commit?:(frame:number)=>boolean}={}){
  const context=new Context(),commits:number[]=[],starts:{sample:number;delay:number}[]=[];
  let active=0,releasePlay:(()=>void)|undefined;
  const wait=options.deferPlay?new Promise<void>(resolve=>{releasePlay=resolve;}):null;
  let pump=()=>{},finish=()=>{};
  const clock=new AlgL06P019ClockV1({
    createContext:()=>context as unknown as AudioContext,
    commitFrame:frame=>{commits.push(frame);return options.commit?.(frame)??true;},
    createTransport:(binding:DecodedSourceStreamBinding,createContext)=>{
      let ctx:Context|undefined,phase:DecodedStreamPhase='idle',cursor=0,start=0,
        delay=0,startSample=0,heldTime:number|null=null,epoch=0;
      const listeners=new Set<()=>void>();
      const emit=()=>{for(const listener of listeners)listener();};
      const stop=(next:DecodedStreamPhase)=>{
        epoch++;if(phase==='playing')active--;
        phase=next;heldTime=ctx?.currentTime??null;emit();
      };
      finish=()=>{if(phase!=='playing')return;
        cursor=binding.decodedSamples;active--;phase='buffer-ended';emit();};
      pump=()=>{
        if(phase!=='playing')return;
        cursor=Math.min(binding.decodedSamples,startSample+
          Math.max(0,ctx!.currentTime-start-delay)*binding.sampleRate);
        if(cursor>=binding.decodedSamples&&!options.deferEnd&&!options.holdSample)finish();
      };
      return {
        subscribe(listener:()=>void){listeners.add(listener);return()=>listeners.delete(listener);},
        async prepare(){ctx=createContext() as unknown as Context;
          phase='ready';return {accepted:true,reason:'ready'};},
        snapshot(){
          const sample=phase==='playing'?Math.min(binding.decodedSamples-
            (options.holdSample?1:0),startSample+
            Math.max(0,ctx!.currentTime-start-delay)*binding.sampleRate):cursor;
          return {phase,epoch,decodedSample:sample,contextTime:ctx?.currentTime??null,
            heldContextTime:heldTime,playbackAnchor:null,
            elapsedMs:sample/binding.sampleRate*1000,
            volume:1,failure:null,sourceAlignment:'unresolved' as const,
            lessonCompleted:false as const};
        },
        seekDecodedSample(sample:number){stop('paused');cursor=sample;
          return {accepted:true,reason:'seeked'};},
        async play(policy:{delaySeconds?:number}){
          const ticket=++epoch;phase='start-pending';
          if(wait)await wait;
          if(ticket!==epoch)return {accepted:false,reason:'stale-start'};
          await ctx!.resume();if(ticket!==epoch)return {accepted:false,reason:'stale-start'};
          start=ctx!.currentTime;delay=policy.delaySeconds??0;startSample=cursor;
          phase='playing';active++;starts.push({sample:cursor,delay});
          return {accepted:true,reason:'playing'};
        },
        pause(){if(phase==='playing'||phase==='start-pending'){
          stop('paused');return {accepted:true,reason:'paused'};}
          return {accepted:false,reason:'not-playing'};},
        replay(){stop('ready');cursor=0;return {accepted:true,reason:'ready'};},
        holdSourceBoundary(){stop('boundary-held');return {accepted:true,reason:'held'};},
        setVolume(){return {accepted:true,reason:'volume'};},
        async close(){stop('closed');await ctx?.close();},
      };
    },
  });
  const sources={'main-1':new ArrayBuffer(asset.sourceBytes)} as Record<P019AudioId,ArrayBuffer>;
  return {clock,context,commits,starts,sources,forceEnd:()=>finish(),
    releasePlay:()=>releasePlay?.(),get active(){return active;},
    toPosition(position:number){context.currentTime=(position-1)/12;
      pump();return clock.tick();}};
}

test('one P019 source starts at frame 2 and short visual tail follows decoded EOF',async()=>{
 const f=fixture();assert.equal((await f.clock.prepare(f.sources)).accepted,true);
 assert.deepEqual(f.commits,[1]);
 assert.equal((await f.clock.play({activation:'automatic',reducedMotion:false})).accepted,false);
 assert.equal((await f.clock.play(USER)).accepted,true);
 assert.deepEqual(f.starts,[{sample:1673,delay:1/12}]);
 const before=f.toPosition(EOF-.01);
 assert.equal(before.phase,'playing');assert.equal(before.visualTailAfterAudioEOF,false);
 const ended=f.toPosition(EOF+.001);
 assert.equal(ended.phase,'playing');assert.equal(ended.frame,350);
 assert.equal(ended.audio.phase,'visual-tail');
 assert.equal(ended.visualTailAfterAudioEOF,true);
 const final=f.toPosition(351);
 assert.equal(final.phase,'timeline-ended');assert.equal(final.frame,351);
 assert.equal(final.lessonCompleted,false);
 assert.equal(f.active,0);assert.equal(f.starts.length,1);
 await f.clock.close();assert.equal(f.context.closeCount,1);
});

test('visual frame 351 waits for real native end or decoded sample exhaustion',async()=>{
 const f=fixture({holdSample:true});await f.clock.prepare(f.sources);await f.clock.play(USER);
 f.context.currentTime=(351-1)/12;
 const waiting=f.clock.tick();assert.equal(waiting.frame,351);
 assert.equal(waiting.phase,'playing');assert.equal(waiting.mainFinalAudioTailPending,true);
 assert.equal(waiting.nativeBufferEndedObserved,false);
 assert.equal(waiting.decodedSampleExhaustedObserved,false);
 f.forceEnd();assert.equal(f.clock.snapshot().phase,'timeline-ended');
 await f.clock.close();
});

test('delayed onended: decoded exhaustion survives Pause and explicit SA Return',async()=>{
 for(const action of ['pause','spanish-return'] as const){
  const f=fixture({deferEnd:true});await f.clock.prepare(f.sources);await f.clock.play(USER);
  const near=f.toPosition(350.8);
  assert.equal(near.phase,'playing');
  assert.equal(near.nativeBufferEndedObserved,false);
  assert.equal(near.decodedSampleExhaustedObserved,true);
  assert.equal(f.clock.pause().accepted,true);
  if(action==='spanish-return'){
   // SA belongs to the later owner; clock resumes only on explicit Return.
   const held=f.clock.snapshot().activePosition;
   f.context.currentTime+=10;
   assert.equal(f.clock.snapshot().activePosition,held);
  }
  assert.equal((await f.clock.play(USER)).accepted,true);
  assert.equal(f.starts.length,1,'exhausted MP3 must not restart');
  f.context.currentTime+=(351-350.8)/12;
  assert.equal(f.clock.tick().phase,'timeline-ended');
  await f.clock.close();
 }
});

test('Replay clears EOF observations and restarts source from the beginning',async()=>{
 const f=fixture({deferEnd:true});await f.clock.prepare(f.sources);await f.clock.play(USER);
 f.toPosition(350.8);assert.equal(f.clock.snapshot().decodedSampleExhaustedObserved,true);
 assert.equal(f.clock.replay().accepted,true);
 assert.equal(f.clock.snapshot().decodedSampleExhaustedObserved,false);
 assert.equal(f.clock.snapshot().nativeBufferEndedObserved,false);
 assert.equal(f.clock.snapshot().frame,1);
 assert.equal((await f.clock.play(USER)).accepted,true);
 assert.equal(f.starts.length,2);
 await f.clock.close();
});

test('context interruption holds source and visual tail without wall-clock advance',async()=>{
 for(const position of [68.5,EOF+.01]){
  const f=fixture();await f.clock.prepare(f.sources);await f.clock.play(USER);
  f.toPosition(position);const held=f.clock.snapshot().activePosition;
  f.context.state='suspended';f.context.dispatchEvent(new Event('statechange'));
  assert.equal(f.clock.snapshot().phase,'paused');
  f.context.currentTime+=5;assert.equal(f.clock.snapshot().activePosition,held);
  assert.equal((await f.clock.play(USER)).accepted,true);
  assert.equal(f.starts.length,position<EOF?2:1);
  await f.clock.close();
 }
});

test('six exact glossary keys pause and close held; caller owns source frame gate',async()=>{
 for(const key of ['Function table','Input','Pair','Table','Output','Function'] as P019GlossaryKey[]){
  const f=fixture();await f.clock.prepare(f.sources);await f.clock.play(USER);
  f.toPosition(68.5);
  assert.equal(f.clock.openGlossary(key).accepted,true,key);
  const held=f.clock.snapshot().activePosition;
  f.toPosition(180);assert.equal(f.clock.snapshot().activePosition,held);
  assert.equal((await f.clock.play(USER)).accepted,false);
  assert.equal(f.clock.closeGlossary().accepted,true);
  assert.equal(f.clock.snapshot().phase,'paused');
  assert.equal((await f.clock.play(USER)).accepted,true);
  await f.clock.close();
 }
 const f=fixture();await f.clock.prepare(f.sources);
 assert.equal(f.clock.openGlossary('Invented' as P019GlossaryKey).accepted,false);
 await f.clock.close();
});

test('Replay and close invalidate pending start before it reaches sound',async()=>{
 for(const action of ['replay','close'] as const){
  const f=fixture({deferPlay:true});await f.clock.prepare(f.sources);
  const pending=f.clock.play(USER);await Promise.resolve();
  if(action==='replay')assert.equal(f.clock.replay().accepted,true);
  else await f.clock.close();
  f.releasePlay();assert.equal((await pending).accepted,false);
  assert.equal(f.starts.length,0);assert.equal(f.active,0);
  if(action==='replay')await f.clock.close();
  assert.equal(f.context.closeCount,1);
 }
});

test('failed Canvas frame commit retires active decoder',async()=>{
 const f=fixture({commit:frame=>frame<20});
 await f.clock.prepare(f.sources);await f.clock.play(USER);
 const snap=f.toPosition(20);
 assert.equal(snap.phase,'failed');assert.equal(f.active,0);
 await f.clock.close();
});
