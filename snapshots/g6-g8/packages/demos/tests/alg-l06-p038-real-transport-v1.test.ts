import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {test} from 'node:test';
import {P038_MAIN,P038PageRuntimeV1}
  from '../src/alg-l06-p038-runtime-v1';
import {DecodedSourceStreamTransport,type DecodedSourceStreamBinding}
  from '../src/decoded-source-stream-transport';

const hash=(bytes:Uint8Array)=>createHash('sha256').update(bytes).digest('hex');
const rawMain=Uint8Array.of(1,2,3,4),rawSA=Uint8Array.of(5,6,7,8);
const sample=(n:number)=>Float32Array.from({length:n},(_,i)=>Math.sin(i*.1));
const mainPcm=sample(4096),saPcm=sample(8192);
const pcmHash=(pcm:Float32Array)=>{
  const bytes=Buffer.alloc(pcm.length*4);
  pcm.forEach((value,i)=>bytes.writeFloatLE(value,i*4));
  return hash(bytes);
};
const binding=(raw:Uint8Array,pcm:Float32Array,rate:number):DecodedSourceStreamBinding=>({
  sourceSha256:hash(raw),sourceBytes:raw.length,sampleRate:rate,channels:1,
  decodedSamples:pcm.length,pcmSha256:pcmHash(pcm),
});
const mainFixture=binding(rawMain,mainPcm,22050),saFixture=binding(rawSA,saPcm,48000);
const audioBuffer=(pcm:Float32Array,rate:number)=>({sampleRate:rate,length:pcm.length,
  numberOfChannels:1,getChannelData:()=>pcm}) as unknown as AudioBuffer;
const deferred=<T>()=>{
  let resolve!:(value:T)=>void;
  const promise=new Promise<T>(yes=>{resolve=yes;});return {promise,resolve};
};
const turn=()=>new Promise(resolve=>setTimeout(resolve,0));

class FakeSource{
  buffer:AudioBuffer|null=null;onended:(()=>void)|null=null;
  starts:number[][]=[];stops=0;disconnects=0;
  connect(){}disconnect(){this.disconnects++;}
  start(...args:number[]){this.starts.push(args);}
  stop(){this.stops++;}
}
class FakeContext extends EventTarget{
  currentTime=0;state:'suspended'|'running'|'closed'='suspended';
  destination={};nodes:FakeSource[]=[];decodeCalls=0;closeCalls=0;
  decode:()=>Promise<AudioBuffer>;
  resumeNext:(()=>Promise<void>)|undefined;
  constructor(readonly sampleRate:number,pcm:Float32Array){
    super();this.decode=async()=>audioBuffer(pcm,sampleRate);
  }
  createGain(){return {gain:{setValueAtTime:()=>{}},connect:()=>{},disconnect:()=>{}};}
  createBufferSource(){const node=new FakeSource();this.nodes.push(node);return node;}
  decodeAudioData(){this.decodeCalls++;return this.decode();}
  async resume(){if(this.resumeNext)await this.resumeNext();this.state='running';}
  async close(){this.closeCalls++;this.state='closed';}
  interrupt(){this.state='suspended';this.dispatchEvent(new Event('statechange'));}
}
function fixture(){
  const mainContext=new FakeContext(22050,mainPcm),saContext=new FakeContext(48000,saPcm);
  let mainAlloc=0,saAlloc=0;
  const runtime=new P038PageRuntimeV1({commitFrame:()=>true,liveHit:()=>true,
    createMainContext:()=>{mainAlloc++;return mainContext as unknown as AudioContext;},
    createSpanishContext:()=>{saAlloc++;return saContext as unknown as AudioContext;},
    createTransport:(requested,createContext)=>new DecodedSourceStreamTransport(
      requested.sourceSha256===P038_MAIN.sourceSha256?mainFixture:saFixture,
      {createContext})});
  return {runtime,mainContext,saContext,allocations:()=>[mainAlloc,saAlloc]};
}

test('actual transport keeps SA context lazy through main prepare and Replay',async()=>{
  const f=fixture();assert.deepEqual(f.allocations(),[0,0]);
  assert.equal((await f.runtime.prepareMain(rawMain.slice().buffer)).accepted,true);
  assert.deepEqual(f.allocations(),[1,0]);
  assert.equal(f.runtime.replay().accepted,true);
  assert.deepEqual(f.allocations(),[1,0]);
  assert.equal(f.saContext.nodes.length,0);
  assert.equal((await f.runtime.prepareSpanish(rawSA.slice().buffer)).accepted,true);
  assert.deepEqual(f.allocations(),[1,1]);
  assert.equal(f.saContext.nodes.length,0);
  await f.runtime.close();
  assert.equal(f.mainContext.closeCalls,1);assert.equal(f.saContext.closeCalls,1);
});

test('late main decode cannot undo Replay or cleanup',async()=>{
  for(const action of ['replay','close'] as const){
    const f=fixture(),wait=deferred<AudioBuffer>();
    f.mainContext.decode=()=>wait.promise;
    const pending=f.runtime.prepareMain(rawMain.slice().buffer);
    for(let i=0;i<20&&f.mainContext.decodeCalls===0;i++)await turn();
    assert.equal(f.mainContext.decodeCalls,1);
    if(action==='replay')assert.equal(f.runtime.replay().accepted,true);
    else await f.runtime.close();
    wait.resolve(audioBuffer(mainPcm,22050));
    assert.equal((await pending).reason,'stale-main-prepare');
    assert.equal(f.runtime.snapshot().phase,action==='close'?'closed':'idle');
    assert.equal(f.mainContext.nodes.length,0);
    if(action==='replay')await f.runtime.close();
  }
});

test('late optional SA decode cannot become ready after Replay or cleanup',async()=>{
  for(const action of ['replay','close'] as const){
    const f=fixture(),wait=deferred<AudioBuffer>();
    await f.runtime.prepareMain(rawMain.slice().buffer);
    f.saContext.decode=()=>wait.promise;
    const pending=f.runtime.prepareSpanish(rawSA.slice().buffer);
    for(let i=0;i<20&&f.saContext.decodeCalls===0;i++)await turn();
    assert.equal(f.saContext.decodeCalls,1);
    if(action==='replay')assert.equal(f.runtime.replay().accepted,true);
    else await f.runtime.close();
    wait.resolve(audioBuffer(saPcm,48000));
    assert.equal((await pending).reason,'stale-load');
    assert.equal(f.runtime.snapshot().spanishAudio.ready,false);
    assert.equal(f.saContext.nodes.length,0);
    if(action==='replay')await f.runtime.close();
  }
});

test('real delayed source and visual lead hold exactly on context interruption',async()=>{
  const f=fixture();await f.runtime.prepareMain(rawMain.slice().buffer);
  assert.equal((await f.runtime.play({activation:'user',reducedMotion:false})).accepted,true);
  assert.equal(f.mainContext.nodes.length,1);
  assert.equal(f.mainContext.nodes[0].starts[0][0],35/12);
  assert.equal(f.mainContext.nodes[0].starts[0][1],0);
  f.mainContext.currentTime=1;f.mainContext.interrupt();
  const held=f.runtime.snapshot();assert.equal(held.phase,'paused');
  assert.equal(held.frame,13);assert.equal(held.mainAudio.decodedSample,0);
  assert.equal(f.mainContext.nodes[0].stops,1);
  f.mainContext.currentTime=10;assert.equal(f.runtime.tick().frame,13);
  assert.equal((await f.runtime.play({activation:'user',reducedMotion:false})).accepted,true);
  assert.equal(f.mainContext.nodes.length,2);
  assert.equal(f.mainContext.nodes[1].starts[0][0],10+23/12);
  assert.equal(f.mainContext.nodes[1].starts[0][1],0);
  await f.runtime.close();
});

test('Replay invalidates a late main Play without creating a source node',async()=>{
  const f=fixture(),wait=deferred<void>();
  await f.runtime.prepareMain(rawMain.slice().buffer);
  f.mainContext.resumeNext=()=>wait.promise;
  const pending=f.runtime.play({activation:'user',reducedMotion:false});
  assert.equal(f.runtime.snapshot().phase,'start-pending');
  assert.equal(f.runtime.replay().accepted,true);
  wait.resolve();assert.equal((await pending).reason,'stale-main-start');
  assert.equal(f.mainContext.nodes.length,0);
  assert.equal(f.runtime.snapshot().frame,1);
  assert.equal(f.runtime.snapshot().phase,'ready');
  await f.runtime.close();
});

test('SA Pause, explicit resume and Return leave main held from ready or frame 409',async()=>{
  for(const startingPhase of ['ready','visual-boundary-held'] as const){
    const f=fixture();await f.runtime.prepareMain(rawMain.slice().buffer);
    await f.runtime.prepareSpanish(rawSA.slice().buffer);
    if(startingPhase==='visual-boundary-held'){
      await f.runtime.play({activation:'user',reducedMotion:false});
      f.mainContext.currentTime=408/12;assert.equal(f.runtime.tick().frame,409);
      f.mainContext.nodes[0].onended?.();
      assert.equal(f.runtime.snapshot().phase,'visual-boundary-held');
    }
    assert.equal((await f.runtime.startSpanish({activation:'user'})).accepted,true);
    assert.equal(f.runtime.snapshot().selectedAudio,'spanish');
    f.saContext.currentTime=.01;
    assert.equal(f.runtime.pause().accepted,true);
    const cursor=f.runtime.snapshot().spanishAudio.decodedSample;
    assert.ok(cursor>0);
    assert.equal((await f.runtime.startSpanish({activation:'user'})).accepted,true);
    assert.equal(f.saContext.nodes[1].starts[0][1],cursor/48000);
    assert.equal(f.runtime.returnMain().accepted,true);
    assert.equal(f.runtime.snapshot().phase,startingPhase);
    assert.equal(f.runtime.snapshot().selectedAudio,'main');
    assert.equal(f.runtime.snapshot().spanishAudio.decodedSample,0);
    assert.equal(f.mainContext.nodes.length,startingPhase==='ready'?0:1);
    await f.runtime.close();
  }
});
