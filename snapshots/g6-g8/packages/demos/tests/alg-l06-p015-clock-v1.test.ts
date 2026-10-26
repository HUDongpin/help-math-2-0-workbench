import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import test from 'node:test';
import {AlgL06P015ClockV1} from '../src/alg-l06-p015-clock-v1';
import {P015_AUDIO_ASSETS,P015_AUDIO_END_POSITION,type P015AudioId}
  from '../src/alg-l06-p015-audio-schedule-v1';
import {DecodedSourceStreamTransport,type DecodedSourceStreamBinding,type DecodedStreamPhase}
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
type NodeRecord={id:P015AudioId;sample:number;delay:number};
function fixture(options:{failPrepareId?:P015AudioId;deferPlayId?:P015AudioId}={}){
  const context=new Context(),commits:number[]=[],nodes:NodeRecord[]=[];
  let active=0,maxActive=0,releasePlay:(()=>void)|undefined;
  const wait=options.deferPlayId?new Promise<void>(resolve=>{releasePlay=resolve;}):null;
  const pumps:(()=>void)[]=[];
  const clock=new AlgL06P015ClockV1({
    createContext:()=>context as unknown as AudioContext,
    commitFrame:frame=>{commits.push(frame);return true;},
    createTransport:(binding:DecodedSourceStreamBinding,createContext)=>{
      const id=P015_AUDIO_ASSETS.find(a=>a.sourceSha256===binding.sourceSha256)!.id;
      let ctx:Context|undefined,phase:DecodedStreamPhase='idle',cursor=0,start=0,
        delay=0,startSample=0,heldTime:number|null=null,epoch=0;
      const listeners=new Set<()=>void>();
      const emit=()=>{for(const listener of listeners)listener();};
      const stop=(next:DecodedStreamPhase)=>{
        epoch++;if(phase==='playing')active--;
        phase=next;heldTime=ctx?.currentTime??null;emit();
      };
      const pump=()=>{
        if(phase!=='playing')return;
        cursor=Math.min(binding.decodedSamples,startSample+
          Math.max(0,ctx!.currentTime-start-delay)*binding.sampleRate);
        if(cursor>=binding.decodedSamples){active--;phase='buffer-ended';emit();}
      };pumps.push(pump);
      return {
        subscribe(listener:()=>void){listeners.add(listener);return()=>listeners.delete(listener);},
        async prepare(){ctx=createContext() as unknown as Context;
          if(options.failPrepareId===id){phase='failed';return {accepted:false,reason:'fixture-decode-rejected'};}
          phase='ready';return {accepted:true,reason:'ready'};},
        snapshot(){
          const sample=phase==='playing'?Math.min(binding.decodedSamples,startSample+
            Math.max(0,ctx!.currentTime-start-delay)*binding.sampleRate):cursor;
          return {phase,epoch,decodedSample:sample,contextTime:ctx?.currentTime??null,
            heldContextTime:heldTime,playbackAnchor:null,elapsedMs:sample/binding.sampleRate*1000,
            volume:1,failure:null,sourceAlignment:'unresolved' as const,
            lessonCompleted:false as const};
        },
        seekDecodedSample(sample:number){stop('paused');cursor=sample;
          return {accepted:true,reason:'seeked'};},
        async play(policy:{delaySeconds?:number}){
          const ticket=++epoch;phase='start-pending';
          if(options.deferPlayId===id&&wait)await wait;
          if(ticket!==epoch)return {accepted:false,reason:'stale-start'};
          await ctx!.resume();if(ticket!==epoch)return {accepted:false,reason:'stale-start'};
          start=ctx!.currentTime;delay=policy.delaySeconds??0;startSample=cursor;
          phase='playing';active++;maxActive=Math.max(maxActive,active);
          nodes.push({id,sample:cursor,delay});return {accepted:true,reason:'playing'};
        },
        pause(){if(phase==='playing'||phase==='start-pending'){stop('paused');
          return {accepted:true,reason:'paused'};}
          return {accepted:false,reason:'not-playing'};},
        replay(){stop('ready');cursor=0;return {accepted:true,reason:'ready'};},
        holdSourceBoundary(){stop('boundary-held');return {accepted:true,reason:'held'};},
        setVolume(){return {accepted:true,reason:'volume'};},
        async close(){stop('closed');await ctx?.close();},
      };
    },
  });
  const sources=Object.fromEntries(P015_AUDIO_ASSETS.map(a=>
    [a.id,new ArrayBuffer(a.sourceBytes)])) as Record<P015AudioId,ArrayBuffer>;
  return {clock,context,commits,nodes,sources,
    toPosition(position:number){context.currentTime=(position-1)/12;
      for(const pump of pumps)pump();return clock.tick();},
    releasePlay:()=>releasePlay?.(),get active(){return active;},
    get maxActive(){return maxActive;}};
}
const USER={activation:'user' as const,reducedMotion:false};
const audioEnd=(id:P015AudioId)=>{
  const a=P015_AUDIO_ASSETS.find(x=>x.id===id)!;
  return a.firstBlockFrame+(a.decodedSamples-a.initialSeekSamples)/a.sampleRate*12;
};
const flush=()=>new Promise<void>(resolve=>setImmediate(resolve));

test('four independently decoded ranges run on one context with source-time gaps',async()=>{
  const f=fixture();assert.equal((await f.clock.prepare(f.sources)).accepted,true);
  assert.deepEqual(f.commits,[1]);
  assert.equal((await f.clock.play({activation:'automatic',reducedMotion:false})).accepted,false);
  assert.equal((await f.clock.play(USER)).accepted,true);
  assert.deepEqual(f.nodes[0],{id:'main-1',sample:1673,delay:1/12});
  f.toPosition(audioEnd('main-1')+.001);await flush();
  assert.equal(f.clock.snapshot().activeAudioId,'main-2');
  assert.equal(f.nodes.at(-1)?.id,'main-2');
  assert(f.nodes.at(-1)!.delay>1,'missing-block visual gap is scheduled, not spliced');
  assert.equal(f.toPosition(640).frame,640);
  for(const id of ['main-2','main-3'] as const){
    f.toPosition(audioEnd(id)+.001);await flush();
  }
  assert.deepEqual(f.nodes.map(node=>node.id),
    ['main-1','main-2','main-3','main-4']);
  assert.equal(f.maxActive,1,'no overlapping source nodes');
  assert.equal(f.toPosition(914.25).frame,914);
  assert.equal(f.clock.snapshot().phase,'playing');
  assert.equal(f.clock.snapshot().mainFinalAudioTailPending,true);
  assert.equal(f.toPosition(P015_AUDIO_END_POSITION+.01).phase,'timeline-ended');
  assert.equal(f.clock.snapshot().lessonCompleted,false);
  await f.clock.close();assert.equal(f.context.closeCount,1);
});

test('pausing at visual 914 preserves the fractional decoded tail',async()=>{
  const f=fixture();await f.clock.prepare(f.sources);await f.clock.play(USER);
  for(const id of ['main-1','main-2','main-3'] as const){
    f.toPosition(audioEnd(id)+.001);await flush();
  }
  f.toPosition(914.25);assert.equal(f.clock.pause().accepted,true);
  assert.equal(f.clock.snapshot().frame,914);
  assert.equal((await f.clock.play(USER)).accepted,true);
  const last=f.nodes.at(-1)!;assert.equal(last.id,'main-4');
  assert(Math.abs(last.sample-(326+(914.25-852)*22050/12))<1e-5);
  await f.clock.close();
});

test('six source glossary keys obey full-hit frames and hold without autoplay',async()=>{
  const f=fixture();await f.clock.prepare(f.sources);await f.clock.play(USER);
  assert.equal(f.clock.openGlossary('Function').accepted,false);
  f.toPosition(172);
  assert.equal(f.clock.openGlossary('Function').accepted,true);
  const held=f.clock.snapshot();assert.equal(held.frame,172);
  assert.equal(held.glossaryOpen,'Function');assert.equal(f.active,0);
  assert.equal((await f.clock.play(USER)).accepted,false);
  f.toPosition(180);assert.equal(f.clock.snapshot().frame,172);
  assert.equal(f.clock.closeGlossary().accepted,true);
  assert.equal(f.clock.snapshot().phase,'paused');
  assert.equal((await f.clock.play(USER)).accepted,true);
  await f.clock.close();
});

test('Replay or close invalidates a pending main start and closes shared context once',async()=>{
  for(const action of ['replay','close'] as const){
    const f=fixture({deferPlayId:'main-1'});await f.clock.prepare(f.sources);
    const pending=f.clock.play(USER);await Promise.resolve();
    if(action==='replay')assert.equal(f.clock.replay().accepted,true);
    else await f.clock.close();
    f.releasePlay();assert.equal((await pending).accepted,false);
    assert.equal(f.nodes.length,0);
    if(action==='replay')await f.clock.close();
    assert.equal(f.context.closeCount,1);
  }
});

test('context interruption cancels a pending next range before its resume completes',async()=>{
  const f=fixture({deferPlayId:'main-2'});
  await f.clock.prepare(f.sources);await f.clock.play(USER);
  f.toPosition(audioEnd('main-1')+.001);
  assert.equal(f.clock.snapshot().transitioning,true);
  f.context.state='suspended';f.context.dispatchEvent(new Event('statechange'));
  assert.equal(f.clock.snapshot().phase,'paused');
  f.releasePlay();await flush();
  assert.equal(f.active,0,'stale main-2 must not become audible after pause');
  assert.deepEqual(f.nodes.map(node=>node.id),['main-1']);
  assert.equal((await f.clock.play(USER)).accepted,true,
    'the interrupted range remains recoverable by explicit user Play');
  assert.deepEqual(f.nodes.map(node=>node.id),['main-1','main-2']);
  await f.clock.close();
});

test('context interruption cancels initial user Play while resume is pending',async()=>{
  const f=fixture({deferPlayId:'main-1'});
  await f.clock.prepare(f.sources);
  const pending=f.clock.play(USER);
  assert.equal(f.clock.snapshot().phase,'start-pending');
  f.context.state='suspended';f.context.dispatchEvent(new Event('statechange'));
  assert.equal(f.clock.snapshot().phase,'paused');
  f.releasePlay();assert.equal((await pending).reason,'stale-start');
  assert.equal(f.active,0);assert.equal(f.nodes.length,0);
  assert.equal((await f.clock.play(USER)).accepted,true);
  assert.equal(f.nodes.length,1);
  await f.clock.close();
});

test('real decoded transport invalidates delayed resume at a four-range handoff',async()=>{
  type BrowserBuffer={sampleRate:number;numberOfChannels:1;length:number;
    getChannelData:()=>Float32Array};
  const hash=(bytes:Uint8Array)=>createHash('sha256').update(bytes).digest('hex');
  const raw=new Map<P015AudioId,Uint8Array>();
  const decoded=new Map<number,BrowserBuffer>();
  const bindings=new Map<P015AudioId,DecodedSourceStreamBinding>();
  P015_AUDIO_ASSETS.forEach((asset,index)=>{
    const marker=index+1,bytes=Uint8Array.of(marker),samples=new Float32Array(asset.decodedSamples);
    raw.set(asset.id,bytes);
    decoded.set(marker,{sampleRate:asset.sampleRate,numberOfChannels:1,
      length:samples.length,getChannelData:()=>samples});
    bindings.set(asset.id,{sourceSha256:hash(bytes),sourceBytes:bytes.length,
      sampleRate:asset.sampleRate,channels:1,decodedSamples:asset.decodedSamples,
      pcmSha256:hash(new Uint8Array(samples.byteLength))});
  });
  class BrowserNode{
    buffer:AudioBuffer|null=null;onended:(()=>void)|null=null;
    starts:number[][]=[];stopped=0;
    connect(){}disconnect(){}
    start(...args:number[]){this.starts.push(args);}
    stop(){this.stopped++;}
  }
  class BrowserContext extends EventTarget{
    currentTime=0;sampleRate=22050;
    state:'suspended'|'running'|'closed'='suspended';
    destination={};nodes:BrowserNode[]=[];closeCount=0;
    resumeGate:Promise<void>|null=null;
    createGain(){return {gain:{setValueAtTime(){}},connect(){},disconnect(){}};}
    createBufferSource(){const node=new BrowserNode();this.nodes.push(node);return node;}
    async decodeAudioData(bytes:ArrayBuffer){
      return decoded.get(new Uint8Array(bytes)[0]) as unknown as AudioBuffer;
    }
    async resume(){if(this.resumeGate){const gate=this.resumeGate;this.resumeGate=null;
        await gate;}this.state='running';this.dispatchEvent(new Event('statechange'));}
    async close(){if(this.state!=='closed'){this.closeCount++;this.state='closed';
      this.dispatchEvent(new Event('statechange'));}}
    suspendExternally(){this.state='suspended';this.dispatchEvent(new Event('statechange'));}
  }
  const context=new BrowserContext();
  const clock=new AlgL06P015ClockV1({commitFrame:()=>true,
    createContext:()=>context as unknown as AudioContext,
    createTransport:(binding,createContext)=>{
      const id=P015_AUDIO_ASSETS.find(a=>a.sourceSha256===binding.sourceSha256)!.id;
      return new DecodedSourceStreamTransport(bindings.get(id)!,{createContext});
    }});
  const sources=Object.fromEntries(P015_AUDIO_ASSETS.map(asset=>
    [asset.id,raw.get(asset.id)!.slice().buffer])) as Record<P015AudioId,ArrayBuffer>;
  assert.equal((await clock.prepare(sources)).accepted,true);
  assert.equal((await clock.play(USER)).accepted,true);
  assert.equal(context.nodes.length,1);
  let release!:()=>void;
  context.resumeGate=new Promise<void>(resolve=>{release=resolve;});
  context.currentTime=(audioEnd('main-1')+.001-1)/12;
  context.nodes[0].onended?.();
  assert.equal(clock.snapshot().transitioning,true);
  context.suspendExternally();
  assert.equal(clock.snapshot().phase,'paused');
  release();await flush();
  assert.equal(context.nodes.length,1,'pending real transport created no stale source node');
  assert.equal((await clock.play(USER)).accepted,true);
  assert.equal(context.nodes.length,2,'explicit Play can start the held second range');
  await clock.close();assert.equal(context.closeCount,1);
});

test('a failed range decode retires every transport and blocks playback',async()=>{
  const f=fixture({failPrepareId:'main-3'});
  const prepared=await f.clock.prepare(f.sources);assert.equal(prepared.accepted,false);
  assert.match(prepared.reason,/main-3:fixture-decode-rejected/u);
  assert.equal(f.nodes.length,0);assert.equal(f.context.closeCount,1);
  assert.equal(f.clock.snapshot().phase,'failed');
  await f.clock.close();assert.equal(f.context.closeCount,1);
});
