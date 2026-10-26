import assert from 'node:assert/strict';
import test from 'node:test';
import {AlgL06P022ClockV1} from '../src/alg-l06-p022-clock-v1';
import {P022_AUDIO_ASSETS,P022_AUDIO_END_POSITION,p022NativeAudioEndPosition,
  type P022AudioId} from '../src/alg-l06-p022-audio-schedule-v1';
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
type Started={id:P022AudioId;sample:number;delay:number};
function fixture(options:{failPrepareId?:P022AudioId;deferPlayId?:P022AudioId;
  failCommitAt?:number}={}){
  const context=new Context(),commits:number[]=[],starts:Started[]=[];
  let active=0,maxActive=0,releasePlay:(()=>void)|undefined;
  const wait=options.deferPlayId?new Promise<void>(resolve=>{releasePlay=resolve;}):null;
  const pumps:(()=>void)[]=[];
  const clock=new AlgL06P022ClockV1({
    createContext:()=>context as unknown as AudioContext,
    commitFrame:frame=>{commits.push(frame);return frame!==options.failCommitAt;},
    createTransport:(binding:DecodedSourceStreamBinding,createContext)=>{
      const id=P022_AUDIO_ASSETS.find(a=>a.sourceSha256===binding.sourceSha256)!.id;
      let ctx:Context|undefined,phase:DecodedStreamPhase='idle',cursor=0,
        start=0,delay=0,startSample=0,heldTime:number|null=null,epoch=0;
      const listeners=new Set<()=>void>();
      const emit=()=>{for(const listener of listeners)listener();};
      const stop=(next:DecodedStreamPhase)=>{
        epoch++;if(phase==='playing')active--;
        phase=next;heldTime=ctx?.currentTime??null;emit();
      };
      const currentSample=()=>phase==='playing'?
        Math.min(binding.decodedSamples,startSample+
          Math.max(0,ctx!.currentTime-start-delay)*binding.sampleRate):cursor;
      const pump=()=>{
        if(phase!=='playing')return;
        cursor=currentSample();
        if(cursor>=binding.decodedSamples){active--;phase='buffer-ended';emit();}
      };pumps.push(pump);
      return {
        subscribe(listener:()=>void){listeners.add(listener);return()=>listeners.delete(listener);},
        async prepare(){ctx=createContext() as unknown as Context;
          if(options.failPrepareId===id){phase='failed';return {accepted:false,reason:'decode-rejected'};}
          phase='ready';return {accepted:true,reason:'ready'};},
        snapshot(){return {phase,epoch,decodedSample:currentSample(),
          contextTime:ctx?.currentTime??null,heldContextTime:heldTime,
          playbackAnchor:null,elapsedMs:currentSample()/binding.sampleRate*1000,
          volume:1,failure:null,sourceAlignment:'unresolved' as const,
          lessonCompleted:false as const};},
        seekDecodedSample(sample:number){stop('paused');cursor=sample;
          return {accepted:true,reason:'seeked'};},
        async play(policy:{delaySeconds?:number}){
          const ticket=++epoch;phase='start-pending';
          if(options.deferPlayId===id&&wait)await wait;
          if(ticket!==epoch)return {accepted:false,reason:'stale-start'};
          await ctx!.resume();if(ticket!==epoch)return {accepted:false,reason:'stale-start'};
          start=ctx!.currentTime;delay=policy.delaySeconds??0;startSample=cursor;
          phase='playing';active++;maxActive=Math.max(maxActive,active);
          starts.push({id,sample:cursor,delay});return {accepted:true,reason:'playing'};
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
  const sources=Object.fromEntries(P022_AUDIO_ASSETS.map(a=>
    [a.id,new ArrayBuffer(a.sourceBytes)])) as Record<P022AudioId,ArrayBuffer>;
  return {clock,context,commits,starts,sources,
    toPosition(position:number){context.currentTime=(position-1)/12;
      for(const pump of pumps)pump();return clock.tick();},
    advance(seconds:number){context.currentTime+=seconds;
      for(const pump of pumps)pump();return clock.tick();},
    releasePlay:()=>releasePlay?.(),get active(){return active;},
    get maxActive(){return maxActive;}};
}
const USER={activation:'user' as const,reducedMotion:false};
const flush=()=>new Promise<void>(resolve=>setImmediate(resolve));

test('two ranges: source 1 EOF, no invented gap PCM, source 2 at frame 150, full 422 tail',async()=>{
  const f=fixture();assert.equal((await f.clock.prepare(f.sources)).accepted,true);
  assert.deepEqual(f.commits,[1]);
  assert.equal((await f.clock.play({activation:'automatic',reducedMotion:false})).accepted,false);
  assert.equal((await f.clock.play(USER)).accepted,true);
  assert.deepEqual(f.starts[0],{id:'main-1',sample:1673,delay:1/12});
  f.toPosition(p022NativeAudioEndPosition('main-1')+.001);await flush();
  assert.equal(f.clock.snapshot().activeAudioId,'main-2');
  assert.equal(f.clock.snapshot().audio.phase,'source-gap');
  assert.equal(f.starts[1].id,'main-2');
  assert.equal(f.starts[1].sample,416);
  assert(f.starts[1].delay>1.5,'second source is scheduled after the real missing-block interval');
  assert.equal(f.toPosition(140).frame,140);
  assert.equal(f.clock.snapshot().audio.phase,'source-gap');
  assert.equal(f.toPosition(150).frame,150);
  assert.equal(f.maxActive,1);
  assert.equal(f.toPosition(422.25).frame,422);
  assert.equal(f.clock.snapshot().mainFinalAudioTailPending,true);
  assert.equal(f.clock.snapshot().phase,'playing');
  assert.equal(f.toPosition(P022_AUDIO_END_POSITION+.01).phase,'timeline-ended');
  assert.equal(f.clock.snapshot().lessonCompleted,false);
  await f.clock.close();assert.equal(f.context.closeCount,1);
});

test('gap pause and explicit resume preserve visual position and remaining delay',async()=>{
  const f=fixture();await f.clock.prepare(f.sources);await f.clock.play(USER);
  f.toPosition(p022NativeAudioEndPosition('main-1')+.001);await flush();
  f.toPosition(140);
  assert.equal(f.clock.pause().accepted,true);
  assert.equal(f.active,0);
  const held=f.clock.snapshot();assert.equal(held.frame,140);
  f.advance(2);assert.equal(f.clock.snapshot().frame,140);
  assert.equal((await f.clock.play(USER)).accepted,true);
  const resumed=f.starts.at(-1)!;assert.equal(resumed.id,'main-2');
  assert.equal(resumed.sample,416);assert.equal(resumed.delay,10/12);
  await f.clock.close();
});

test('six exact glossary gates pause the source and closing remains held',async()=>{
  const gates=[['Graph',8],['Representation',42],['Function',17],
    ['Ordered pair',85],['Input',91],['Output',99]] as const;
  for(const [key,first] of gates){
    const f=fixture();await f.clock.prepare(f.sources);await f.clock.play(USER);
    if(first>1){f.toPosition(first-1);assert.equal(f.clock.openGlossary(key).accepted,false);}
    f.toPosition(first);assert.equal(f.clock.openGlossary(key).accepted,true);
    assert.equal(f.clock.snapshot().glossaryOpen,key);
    assert.equal((await f.clock.play(USER)).accepted,false);
    assert.equal(f.clock.closeGlossary().accepted,true);
    assert.equal(f.clock.snapshot().phase,'paused');
    assert.equal((await f.clock.play(USER)).accepted,true);
    await f.clock.close();
  }
});

test('Replay or close invalidates a pending initial source start',async()=>{
  for(const action of ['replay','close'] as const){
    const f=fixture({deferPlayId:'main-1'});await f.clock.prepare(f.sources);
    const pending=f.clock.play(USER);await Promise.resolve();
    if(action==='replay')assert.equal(f.clock.replay().accepted,true);
    else await f.clock.close();
    f.releasePlay();assert.equal((await pending).accepted,false);
    assert.equal(f.starts.length,0);
    if(action==='replay')await f.clock.close();
    assert.equal(f.context.closeCount,1);
  }
});

test('context suspend cancels a pending second-range start, explicit Play recovers',async()=>{
  const f=fixture({deferPlayId:'main-2'});
  await f.clock.prepare(f.sources);await f.clock.play(USER);
  f.toPosition(p022NativeAudioEndPosition('main-1')+.001);
  assert.equal(f.clock.snapshot().transitioning,true);
  f.context.state='suspended';f.context.dispatchEvent(new Event('statechange'));
  assert.equal(f.clock.snapshot().phase,'paused');
  f.releasePlay();await flush();
  assert.equal(f.active,0);
  assert.deepEqual(f.starts.map(node=>node.id),['main-1']);
  assert.equal((await f.clock.play(USER)).accepted,true);
  assert.deepEqual(f.starts.map(node=>node.id),['main-1','main-2']);
  await f.clock.close();
});

test('Replay during the delayed second-range start cancels that node and resets frame one',async()=>{
  const f=fixture({deferPlayId:'main-2'});
  await f.clock.prepare(f.sources);await f.clock.play(USER);
  f.toPosition(p022NativeAudioEndPosition('main-1')+.001);
  assert.equal(f.clock.snapshot().transitioning,true);
  assert.equal(f.clock.replay().accepted,true);
  assert.equal(f.clock.snapshot().frame,1);
  f.releasePlay();await flush();
  assert.deepEqual(f.starts.map(node=>node.id),['main-1']);
  assert.equal(f.active,0);
  await f.clock.close();
});

test('Canvas frame commit failure stops audio and failed decode retires shared context',async()=>{
  const f=fixture({failCommitAt:100});await f.clock.prepare(f.sources);await f.clock.play(USER);
  assert.equal(f.toPosition(100).phase,'failed');assert.equal(f.active,0);
  await f.clock.close();assert.equal(f.context.closeCount,1);
  const bad=fixture({failPrepareId:'main-2'});
  assert.equal((await bad.clock.prepare(bad.sources)).accepted,false);
  assert.equal(bad.clock.snapshot().phase,'failed');
  await bad.clock.close();assert.equal(bad.context.closeCount,1);
});
