import assert from 'node:assert/strict';
import test from 'node:test';
import {AlgL06P017ClockV1,type P017GlossaryKey} from '../src/alg-l06-p017-clock-v1';
import {P017AudioOwnerV1} from '../src/alg-l06-p017-audio-owner-v1';
import {P017_AUDIO_ASSETS,type P017AudioId} from '../src/alg-l06-p017-audio-schedule-v1';
import {P017_TIMELINE} from '../src/alg-l06-p017-timeline-v1';
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
const asset=P017_AUDIO_ASSETS[0];
const EOF=asset.firstBlockFrame+
  (asset.decodedSamples-asset.initialSeekSamples)/asset.sampleRate*12;
const USER={activation:'user' as const,reducedMotion:false};

function fixture(options:{deferPlay?:boolean;deferEnd?:boolean;holdSample?:boolean;
  commit?:(frame:number)=>boolean}={}){
  const context=new Context(),commits:number[]=[],starts:{sample:number;delay:number}[]=[];
  let active=0,releasePlay:(()=>void)|undefined;
  const wait=options.deferPlay?new Promise<void>(resolve=>{releasePlay=resolve;}):null;
  let pump=()=>{},finish=()=>{};
  const clock=new AlgL06P017ClockV1({
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
  const sources={'main-1':new ArrayBuffer(asset.sourceBytes)} as Record<P017AudioId,ArrayBuffer>;
  return {clock,context,commits,starts,sources,forceEnd:()=>finish(),
    releasePlay:()=>releasePlay?.(),get active(){return active;},
    toPosition(position:number){context.currentTime=(position-1)/12;
      pump();return clock.tick();}};
}

test('one source starts at frame 2 and visual half-frame tail runs on context time',async()=>{
  const f=fixture();assert.equal((await f.clock.prepare(f.sources)).accepted,true);
  assert.deepEqual(f.commits,[1]);
  assert.equal((await f.clock.play({activation:'automatic',reducedMotion:false})).accepted,false);
  assert.equal((await f.clock.play(USER)).accepted,true);
  assert.deepEqual(f.starts,[{sample:1673,delay:1/12}]);
  const before=f.toPosition(EOF-.01);
  assert.equal(before.phase,'playing');assert.equal(before.visualTailAfterAudioEOF,false);
  const ended=f.toPosition(EOF+.001);
  assert.equal(ended.phase,'playing');
  assert.equal(ended.audio.phase,'visual-tail');
  assert.equal(ended.visualTailAfterAudioEOF,true);
  assert.equal(ended.frame,720);
  const final=f.toPosition(721);
  assert.equal(final.phase,'timeline-ended');assert.equal(final.frame,721);
  assert.equal(final.lessonCompleted,false);
  assert.equal(f.active,0);assert.equal(f.starts.length,1);
  await f.clock.close();assert.equal(f.context.closeCount,1);
});

test('visual frame 721 without native EOF stays playing until decoder ends',async()=>{
  const f=fixture({holdSample:true});await f.clock.prepare(f.sources);await f.clock.play(USER);
  f.context.currentTime=(721-1)/12;
  const waiting=f.clock.tick();assert.equal(waiting.frame,721);
  assert.equal(waiting.phase,'playing');assert.equal(waiting.mainFinalAudioTailPending,true);
  f.forceEnd();assert.equal(f.clock.snapshot().phase,'timeline-ended');
  await f.clock.close();
});

test('delayed onended: decoded exhaustion survives Pause, SA Return, and Replay',async()=>{
  for(const action of ['pause','spanish-return','replay'] as const){
    const f=fixture({deferEnd:true});await f.clock.prepare(f.sources);
    await f.clock.play(USER);
    const near=f.toPosition(720.8);
    assert.equal(near.phase,'playing');
    assert.equal(near.nativeBufferEndedObserved,false);
    assert.equal(near.decodedSampleExhaustedObserved,true);
    if(action==='pause'){
      assert.equal(f.clock.pause().accepted,true);
      assert.equal((await f.clock.play(USER)).accepted,true);
      assert.equal(f.starts.length,1,'Pause cannot replay exhausted MP3');
    }else if(action==='spanish-return'){
      const spanish={snapshot:()=>({phase:'ended',failure:null}),
        async start(){return {accepted:true,reason:'playing'};},
        pause(){return {accepted:true,reason:'paused'};},
        stop(){return {accepted:true,reason:'stopped'};},
        async stopAndWait(){},async close(){},
        setVolume(){return {accepted:true,reason:'volume'};}} as unknown as
          ConstructorParameters<typeof P017AudioOwnerV1>[1];
      const owner=new P017AudioOwnerV1(f.clock,spanish);
      assert.equal((await owner.startSpanish()).accepted,true);
      assert.equal(owner.snapshot().selectedAudio,'spanish');
      assert.equal((await owner.returnMain()).accepted,true);
      assert.equal(f.starts.length,1,'SA Return cannot replay exhausted MP3');
      f.context.currentTime+=(721-720.8)/12;
      assert.equal(f.clock.tick().phase,'timeline-ended');
      await owner.close();continue;
    }else{
      assert.equal(f.clock.replay().accepted,true);
      assert.equal(f.clock.snapshot().decodedSampleExhaustedObserved,false);
      assert.equal((await f.clock.play(USER)).accepted,true);
      assert.equal(f.starts.length,2,'Replay restarts exact main source');
      await f.clock.close();continue;
    }
    f.context.currentTime+=(721-720.8)/12;
    assert.equal(f.clock.tick().phase,'timeline-ended');
    await f.clock.close();
  }
});

test('pausing after native EOF preserves the remaining visual fraction',async()=>{
  const f=fixture();await f.clock.prepare(f.sources);await f.clock.play(USER);
  f.toPosition(EOF+.01);assert.equal(f.clock.pause().accepted,true);
  const held=f.clock.snapshot().activePosition;
  f.context.currentTime+=10;assert.equal(f.clock.snapshot().activePosition,held);
  assert.equal((await f.clock.play(USER)).accepted,true);
  assert.equal(f.starts.length,1,'exhausted MP3 must not restart');
  f.context.currentTime+=(721-held)/12;
  assert.equal(f.clock.tick().phase,'timeline-ended');
  await f.clock.close();
});

test('context interruption pauses both audible playback and the post-EOF visual tail',async()=>{
  for(const position of [68.5,EOF+.01]){
    const f=fixture();await f.clock.prepare(f.sources);await f.clock.play(USER);
    f.toPosition(position);
    const held=f.clock.snapshot().activePosition;
    f.context.state='suspended';f.context.dispatchEvent(new Event('statechange'));
    assert.equal(f.clock.snapshot().phase,'paused');
    f.context.currentTime+=5;
    assert.equal(f.clock.snapshot().activePosition,held);
    assert.equal((await f.clock.play(USER)).accepted,true);
    assert.equal(f.starts.length,position<EOF?2:1);
    await f.clock.close();
  }
});

test('all six exact glossary keys open at their own full-hit frame and remain held',async()=>{
  for(const [key,value] of Object.entries(P017_TIMELINE.glossary)){
    const f=fixture();await f.clock.prepare(f.sources);await f.clock.play(USER);
    const first=value.firstAvailableFrame;
    f.toPosition(first-.01);
    assert.equal(f.clock.openGlossary(key as P017GlossaryKey).accepted,false,key);
    f.toPosition(first);
    assert.equal(f.clock.openGlossary(key as P017GlossaryKey).accepted,true,key);
    assert.equal(f.clock.snapshot().glossaryOpen,key);
    const held=f.clock.snapshot().activePosition;
    f.toPosition(first+10);assert.equal(f.clock.snapshot().activePosition,held);
    assert.equal((await f.clock.play(USER)).accepted,false);
    assert.equal(f.clock.closeGlossary().accepted,true);
    assert.equal(f.clock.snapshot().phase,'paused');
    assert.equal((await f.clock.play(USER)).accepted,true);
    await f.clock.close();
  }
});

test('explicit SA selection holds one main cursor and Return resumes it',async()=>{
  const f=fixture();await f.clock.prepare(f.sources);await f.clock.play(USER);
  f.toPosition(68.5);
  let saPhase:'idle'|'playing'|'ended'|'closed'='idle';
  const spanish={snapshot:()=>({phase:saPhase,failure:null}),
    async start(){saPhase='playing';return {accepted:true,reason:'playing'};},
    pause(){saPhase='idle';return {accepted:true,reason:'paused'};},
    stop(){saPhase='idle';return {accepted:true,reason:'stopped'};},
    async stopAndWait(){saPhase='idle';},
    async close(){saPhase='closed';},
    setVolume(){return {accepted:true,reason:'volume'};}} as unknown as
      ConstructorParameters<typeof P017AudioOwnerV1>[1];
  const owner=new P017AudioOwnerV1(f.clock,spanish);
  assert.equal((await owner.startSpanish()).accepted,true);
  assert.equal(owner.snapshot().selectedAudio,'spanish');
  assert.equal(f.active,0);
  f.toPosition(200);assert.equal(f.clock.snapshot().frame,68);
  saPhase='ended';assert.equal(owner.snapshot().selectedAudio,'spanish',
    'SA EOF does not auto-return or resume main');
  assert.equal((await owner.returnMain()).accepted,true);
  assert.equal(f.clock.snapshot().frame,68);
  assert.equal(f.starts.length,2);
  assert(Math.abs(f.starts[1].sample-(1673+(68.5-2)*22050/12))<1e-5);
  await owner.close();
});

test('Replay and close invalidate pending start and stop sound',async()=>{
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

test('commit failure holds decoder and reports failure',async()=>{
  const f=fixture({commit:frame=>frame<20});
  await f.clock.prepare(f.sources);await f.clock.play(USER);
  const snap=f.toPosition(20);
  assert.equal(snap.phase,'failed');assert.equal(f.active,0);
  await f.clock.close();
});
