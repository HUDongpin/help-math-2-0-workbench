import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import fs from 'node:fs';
import test from 'node:test';
import {ALG_L08_P001_SOURCE as SOURCE,algL08P001Frame,algL08P001FrameAtMilliseconds} from './alg-l08-p001-state-v1';
import {SourceTitleSessionV1} from './source-title-session-v1';
import {sourceStreamCyclePosition,sourceStreamCycleSlices} from './source-stream-cycle-clock-v1';
const context={frame:1,frameDomain:'sprite-142',rootFrame:6,scenario:'source-introduction',lang:'en' as const,seed:0};
const base=new URL('../../../migrations/shared-alg001-l08-p001/',import.meta.url);
const model=JSON.parse(fs.readFileSync(new URL('native-v1/source-model-v1.json',base),'utf8'));
const decode=JSON.parse(fs.readFileSync(new URL('audit-v1/decode-v1.json',base),'utf8'));
const hash=(b:Uint8Array)=>createHash('sha256').update(b).digest('hex');

test('all130 native poses retain the source title and both matched text layers in either UI language',()=>{
  assert.equal(SOURCE.title,'Graphing Linear Equations: Introduction');
  assert.equal(model.courseXmlTitle,'Graphing Linear Functions');
  assert.equal(SOURCE.frames.length,130);
  for(const row of model.frames)for(const lang of ['en','es'] as const){
    const s=algL08P001Frame(row.frame,{...context,frame:row.frame,lang});
    for(const layer of row.layers){assert.equal(s.alpha,layer.alpha256/256);assert.equal(s.scaleX,layer.scaleX);assert.equal(s.scaleY,layer.scaleY);}
    assert.deepEqual(s.sourceTextIds,s.alpha?[140,141]:[]);assert.equal(s.title,model.title);
  }
});
test('root6 owns the child and frame130 lasts the full final interval before wrap',()=>{
  for(let f=1;f<=10;f++)assert.equal(algL08P001Frame(f,{...context,frameDomain:'root'}).mainFrame,f<6?null:f-5);
  assert.equal(algL08P001FrameAtMilliseconds(130/12*1000-.001),130);
  assert.equal(algL08P001FrameAtMilliseconds(130/12*1000),1);
  assert.deepEqual(sourceStreamCyclePosition(SOURCE.clockPlan,130/12),{cycleIndex:1,seconds:0,frame:1});
  for(const frame of [0,131,NaN,1.5])assert.throws(()=>algL08P001Frame(frame,context));
  for(const c of [{...context,rootFrame:1},{...context,frameDomain:'sprite-143'},{...context,scenario:'guess'},{...context,seed:-1}])assert.throws(()=>algL08P001Frame(1,c));
});
test('candidate sound config pins actual source bytes and measured decoder, without inferring frame2 silence',()=>{
  const bytes=fs.readFileSync(new URL('source-v1/source-stream-142.mp3',base));
  assert.equal(bytes.length,SOURCE.clockPlan.decoder.sourceBytes);assert.equal(hash(bytes),SOURCE.clockPlan.decoder.sourceSha256);
  assert.equal(decode.pcmSha256,SOURCE.clockPlan.decoder.pcmSha256);assert.equal(decode.decodedSamples,238464);
  assert.equal(model.frames[1].audio.mp3Bytes,0);
  const slices=sourceStreamCycleSlices(SOURCE.clockPlan,0,0);assert.equal(slices.length,1);
  assert.equal(slices[0].firstDecodedSample,1673);assert.equal(slices[0].durationSeconds,(238464-1673)/22050);
  assert.equal(sourceStreamCycleSlices(SOURCE.clockPlan,1/12,0).length,1);
  assert.equal(SOURCE.clockPlan.alignmentStatus,'source-run-candidate-not-original-runtime-accepted');
});
test('pause and leave invalidate pending reads before any audio allocation',async()=>{
  for(const action of ['pause','close'] as const){
    let resolve!:(b:ArrayBuffer)=>void,signal!:AbortSignal,allocations=0;
    const session=new SourceTitleSessionV1(SOURCE,{read:s=>{signal=s;return new Promise(r=>resolve=r);},changed(){},commitFrame:()=>true,
      createContext:()=>{allocations++;throw Error('unexpected allocation');}});
    const playing=session.play();assert.equal(session.snapshot().phase,'loading');await session[action]();
    assert(signal.aborted);resolve(new ArrayBuffer(0));assert.equal(await playing,false);assert.equal(allocations,0);await session.close();
  }
});
test('Replay replaces pending work and late old bytes cannot revive the prior run',async()=>{
  const resolves:Array<(b:ArrayBuffer)=>void>=[],signals:AbortSignal[]=[];
  const session=new SourceTitleSessionV1(SOURCE,{read:s=>{signals.push(s);return new Promise(r=>resolves.push(r));},changed(){},commitFrame:()=>true});
  const first=session.play(),replay=session.replay();await Promise.resolve();assert.equal(signals.length,2);assert(signals[0].aborted);
  assert.equal(session.snapshot().replay,1);resolves[0](new ArrayBuffer(0));assert.equal(await first,false);assert.equal(session.snapshot().phase,'loading');
  await session.close();resolves[1](new ArrayBuffer(0));assert.equal(await replay,false);assert.equal(session.snapshot().phase,'closed');
});
// A separate synthetic decoder exercises lifecycle scheduling; real MP3/PCM identity is checked above and in the browser.
const raw=Uint8Array.of(1,2,3,4),pcm=new Float32Array(238464);
const fixtureSource={...SOURCE,clockPlan:{...SOURCE.clockPlan,decoder:{...SOURCE.clockPlan.decoder,sourceBytes:raw.length,sourceSha256:hash(raw),pcmSha256:hash(new Uint8Array(pcm.buffer))}}};
class Context extends EventTarget{
  currentTime=0;state='suspended';sampleRate=22050;destination={};volumes:number[]=[];
  nodes:Array<{onended:(()=>void)|null;starts:number[][];stops:number;disconnected:boolean}>=[];
  createGain(){return{gain:{setValueAtTime:(v:number)=>this.volumes.push(v)},connect(){},disconnect(){}};}
  createBufferSource(){const node={buffer:null,onended:null as (()=>void)|null,starts:[] as number[][],stops:0,disconnected:false,
    connect(){},disconnect(){this.disconnected=true;},start(...args:number[]){this.starts.push(args);},stop(){this.stops++;}};this.nodes.push(node);return node;}
  async decodeAudioData(){return{sampleRate:22050,numberOfChannels:1,length:pcm.length,getChannelData:()=>pcm};}
  async resume(){this.state='running';}async close(){this.state='closed';}
}
test('native pause/resume retains fractional audio position; Replay retires the old context and resets the source loop',async()=>{
  const contexts:Context[]=[],commits:number[]=[];
  const session=new SourceTitleSessionV1(fixtureSource,{read:async()=>raw.slice().buffer,changed(){},commitFrame:f=>{commits.push(f);return true;},
    createContext:()=>{const c=new Context();contexts.push(c);return c as unknown as AudioContext;}});
  assert.equal(contexts.length,0);session.setVolume(.3);assert(await session.play());const first=contexts[0];assert.equal(first.nodes.length,3);
  first.currentTime=1.234;const before=session.snapshot();session.pause();first.currentTime=20;assert.equal(session.snapshot().frame,before.frame);
  assert(first.nodes.every(n=>n.stops===1&&n.disconnected));assert(await session.play());assert.equal(session.snapshot().decodedSample,before.decodedSample);
  assert(Math.abs(first.nodes[3].starts[0][1]-before.decodedSample/22050)<1e-10);
  first.currentTime=20+130/12;assert.equal(session.snapshot().cycle,1);assert.equal(session.snapshot().lessonCompleted,false);
  assert(await session.replay());assert.equal(first.state,'closed');assert(first.nodes.every(n=>n.disconnected));assert.equal(contexts.length,2);
  assert.equal(session.snapshot().frame,1);assert.equal(session.snapshot().cycle,0);assert.equal(session.snapshot().replay,1);
  assert.equal(contexts[1].volumes.at(-1),.3);await session.close();assert.equal(contexts[1].state,'closed');assert(contexts[1].nodes.every(n=>n.disconnected));
  assert(commits.includes(before.frame));
});
test('bad source bytes fail closed and a later explicit retry uses a fresh read',async()=>{
  let reads=0,allocations=0;const session=new SourceTitleSessionV1(fixtureSource,{read:async()=>{reads++;return Uint8Array.of(9).buffer;},changed(){},commitFrame:()=>true,
    createContext:()=>{allocations++;return new Context() as unknown as AudioContext;}});
  assert.equal(await session.play(),false);assert.equal(session.snapshot().phase,'failed');assert.equal(allocations,0);
  assert.equal(await session.play(),false);assert.equal(reads,2);assert.equal(session.snapshot().lessonCompleted,false);await session.close();
});
