import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {chromium} from 'playwright';
import {AlgL06P008ClockV1,P008_BROWSER_DECODER,P008_CONTINUOUS_SOURCE_URL}
 from '../src/alg-l06-p008-clock-v1';
import {P008_CONTINUOUS_AUDIO as plan} from '../src/alg-l06-p008-audio-schedule-v1';

const read=(file:string)=>readFileSync(new URL(`../../../${file}`,import.meta.url));
const sha=(bytes:Uint8Array)=>createHash('sha256').update(bytes).digest('hex');
const source=read('migrations/shared-alg001-l06-p008/audit/audio-v1/continuous-source-v1.mp3');
const user={activation:'user' as const,reducedMotion:false};
let decodedPromise:Promise<Float32Array>|undefined;

function chromePcm(){
 return decodedPromise??= (async()=>{
  const receiptBytes=read('output/playwright/alg-l06-p008-source-v1/browser-decode-v1.json');
  assert.equal(sha(receiptBytes),P008_BROWSER_DECODER.receiptSha256);
  const receipt=JSON.parse(receiptBytes.toString());
  assert.equal(receipt.played,false);
  assert.equal(receipt.files[0].sha256,sha(source));
  assert.equal(receipt.files[0].decodes.length,2);
  for(const decode of receipt.files[0].decodes){
   assert.equal(decode.length,plan.decodedSamples);
   assert.equal(decode.pcmSha256,P008_BROWSER_DECODER.pcmSha256);
  }
  const browser=await chromium.launch({channel:'chrome',headless:true});
  try{
   assert.equal(browser.version().split('.')[0],'153','pinned Chrome major version');
   const page=await browser.newPage();
   const base64=await page.evaluate(async encoded=>{
    const input=Uint8Array.from(atob(encoded),character=>character.charCodeAt(0));
    const context=new OfflineAudioContext(1,1,22050);
    const audio=await context.decodeAudioData(input.buffer);
    if(audio.length!==1670976||audio.sampleRate!==22050||audio.numberOfChannels!==1)
     throw Error('browser-decoder-shape-mismatch');
    const values=audio.getChannelData(0),bytes=new Uint8Array(values.length*4);
    const view=new DataView(bytes.buffer);
    for(let i=0;i<values.length;i++)view.setFloat32(i*4,values[i],true);
    let binary='';for(let i=0;i<bytes.length;i+=32768)
     binary+=String.fromCharCode(...bytes.subarray(i,i+32768));
    return btoa(binary);
   },source.toString('base64'));
   const pcm=Buffer.from(base64,'base64');
   assert.equal(sha(pcm),P008_BROWSER_DECODER.pcmSha256);
   return new Float32Array(pcm.buffer.slice(pcm.byteOffset,pcm.byteOffset+pcm.byteLength));
  }finally{await browser.close();}
 })();
}

class Context extends EventTarget{
 currentTime=0;state='suspended';sampleRate=22050;destination={};
 nodes:{starts:number[][];stops:number;onended:null|(()=>void);buffer:unknown;
  start:(...v:number[])=>void;stop:()=>void;connect:()=>void;disconnect:()=>void}[]=[];
 resumeWait?:Promise<void>;decodeWait?:Promise<void>;onDecode?:()=>void;
 constructor(private readonly pcm:Float32Array){super();}
 createGain(){return {gain:{setValueAtTime(){}},connect(){},disconnect(){}};}
 createBufferSource(){
  const node={starts:[] as number[][],stops:0,onended:null as null|(()=>void),buffer:null as unknown,
   start(...values:number[]){this.starts.push(values);},stop(){this.stops++;},connect(){},disconnect(){}};
  this.nodes.push(node);return node;
 }
 async decodeAudioData(){this.onDecode?.();if(this.decodeWait)await this.decodeWait;
  return {sampleRate:22050,numberOfChannels:1,length:this.pcm.length,
  getChannelData:()=>this.pcm};}
 async resume(){if(this.resumeWait)await this.resumeWait;this.state='running';this.dispatchEvent(new Event('statechange'));}
 async close(){this.state='closed';this.dispatchEvent(new Event('statechange'));}
 suspend(){this.state='suspended';this.dispatchEvent(new Event('statechange'));}
}
async function fixture(commitHeldFrame?:(frame:number)=>boolean){
 const context=new Context(await chromePcm()),commits:{frame:number;sourceNodes:number}[]=[];
 const clock=new AlgL06P008ClockV1({createContext:()=>context as unknown as AudioContext,
  commitHeldFrame:frame=>{commits.push({frame,sourceNodes:context.nodes.length});
   return commitHeldFrame?.(frame)??true;}});
 assert.equal((await clock.prepare(source.buffer.slice(source.byteOffset,
  source.byteOffset+source.byteLength) as ArrayBuffer)).accepted,true);
 return {clock,context,commits};
}

test('Chrome-pinned prepare holds frame 1 and explicit user play delays audio until frame 19',async()=>{
 assert.equal(P008_CONTINUOUS_SOURCE_URL.includes(plan.sourceMp3Sha256),true);
 const {clock,context,commits}=await fixture();
 assert.equal(clock.snapshot().frame,1);
 assert.deepEqual(commits[0],{frame:1,sourceNodes:0});
 assert.equal((await clock.play({activation:'automatic',reducedMotion:false})).accepted,false);
 assert.equal(context.nodes.length,0);
 context.currentTime=20;
 assert.equal((await clock.play(user)).accepted,true);
 assert.deepEqual(context.nodes[0].starts,[[21.5,1673/22050]]);
 assert.deepEqual(commits[1],{frame:1,sourceNodes:0});
 context.currentTime=21.49;assert.equal(clock.snapshot().frame,18);
 context.currentTime=21.5;assert.equal(clock.snapshot().frame,19);
 await clock.close();
});
test('pause and resume retain the visual lead and continuous decoded position across packet gap',async()=>{
 const {clock,context}=await fixture();
 await clock.play(user);context.currentTime=.75;
 assert.equal(clock.pause().accepted,true);
 assert.equal(clock.snapshot().frame,10);
 context.currentTime=100;assert.equal(clock.snapshot().frame,10);
 assert.equal((await clock.play(user)).accepted,true);
 assert.equal(context.nodes[1].starts[0][0],100+.75);
 assert.equal(context.nodes[1].starts[0][1],1673/22050);
 context.currentTime=100+(577/12-.75);
 const duringGap=clock.snapshot();
 assert.equal(duringGap.frame,578);
 assert.equal(duringGap.audio.phase,'playing');
 assert.equal(duringGap.activeSegmentIndex,0);
 assert.equal(duringGap.timelineReachedEnd,false);
 assert.equal(duringGap.lessonCompleted,false);
 await clock.close();
});
test('native audio EOF retains the visual tail and frame 938 is held without lesson completion',async()=>{
 const {clock,context,commits}=await fixture();
 await clock.play(user);
 context.currentTime=plan.audioEndSeconds;
 context.nodes[0].onended?.();
 let snapshot=clock.snapshot();
 assert.equal(snapshot.audioEnded,true);
 assert.equal(snapshot.timelineReachedEnd,false);
 assert.equal(snapshot.audio.phase,'postroll');
 assert.equal(clock.pause().accepted,true);
 const tailFrame=clock.snapshot().frame;context.currentTime=200;
 assert.equal(clock.snapshot().frame,tailFrame);
 assert.equal((await clock.play(user)).accepted,true);
 assert.equal(context.nodes.length,1,'visual tail resumes without another source node');
 context.currentTime=200+(plan.lastFrame-1)/plan.fps-plan.audioEndSeconds+.001;
 snapshot=clock.snapshot();
 assert.equal(snapshot.frame,938);assert.equal(snapshot.timelineReachedEnd,true);
 assert.equal(snapshot.lessonCompleted,false);
 assert.equal(commits.at(-1)?.frame,938);
 assert.equal(clock.pause().accepted,false);
 assert.equal(clock.replay().accepted,true);
 assert.equal(clock.snapshot().frame,1);assert.equal(clock.snapshot().audioEnded,false);
 assert.equal(context.nodes.length,1,'Replay does not autoplay');
 await clock.play(user);assert.equal(context.nodes.length,2);
 await clock.close();
});
test('suspension, pending activation, Replay and close cancel stale native work',async()=>{
 const first=await fixture();await first.clock.play(user);
 first.context.currentTime=.8;first.context.suspend();
 assert.equal(first.clock.snapshot().phase,'paused');
 assert.equal(first.clock.snapshot().frame,10);
 first.context.currentTime=100;assert.equal(first.clock.snapshot().frame,10);
 await first.clock.play(user);
 assert(Math.abs(first.context.nodes[1].starts[0][0]-(100+.7))<1e-10);
 await first.clock.close();
 for(const operation of ['pause','replay','close'] as const){
  const {clock,context}=await fixture();let release!:()=>void;
  context.resumeWait=new Promise(resolve=>{release=resolve;});
  const pending=clock.play(user);
  if(operation==='close')await clock.close();else clock[operation]();
  release();assert.equal((await pending).accepted,false);
  assert.equal(context.nodes.length,0,'stale native start is not created');
  if(operation!=='close')await clock.close();
 }
});
test('frame commit failure and arbitrary source seek never start unverified audio',async()=>{
 let calls=0;const {clock,context}=await fixture(()=>++calls===1);
 assert.equal((await clock.play(user)).accepted,false);
 assert.equal(context.nodes.length,0);
 assert.equal(clock.seekCandidateFrame(578).accepted,false);
 await clock.close();
});
test('close during pending decode invalidates the eventual buffer and releases context',async()=>{
 const context=new Context(await chromePcm());
 let entered!:()=>void,release!:()=>void;
 const didEnter=new Promise<void>(resolve=>{entered=resolve;});
 context.onDecode=entered;context.decodeWait=new Promise<void>(resolve=>{release=resolve;});
 const clock=new AlgL06P008ClockV1({createContext:()=>context as unknown as AudioContext,
  commitHeldFrame:()=>true});
 const pending=clock.prepare(source.buffer.slice(source.byteOffset,
  source.byteOffset+source.byteLength) as ArrayBuffer);
 await didEnter;await clock.close();release();
 assert.equal((await pending).accepted,false);
 assert.equal(clock.snapshot().phase,'closed');
 assert.equal(context.state,'closed');
 assert.equal(context.nodes.length,0);
});
