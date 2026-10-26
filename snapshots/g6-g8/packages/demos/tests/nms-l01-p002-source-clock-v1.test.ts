import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import test from 'node:test';
import {NmsL1P002SourceClockV1,nmsL1P002AudioSlices,type NmsL1P002SourceClockPlan} from '../src/nms-l01-p002-source-clock-v1';
import page from '../src/modules/g678-nms-l01-p002';
import {PLAN} from '../src/timelines/shared-nms002-l01-p002';
const hash=(b:Uint8Array)=>createHash('sha256').update(b).digest('hex');
const raw=Uint8Array.of(1,2,3,4),pcm=new Float32Array(1759680);
const plan:NmsL1P002SourceClockPlan={...PLAN,decoder:{...PLAN.decoder,sourceBytes:4,sourceSha256:hash(raw),pcmSha256:hash(new Uint8Array(pcm.buffer))}};
const user={activation:'user' as const,reducedMotion:false};
type FakeNode={buffer:null;onended:null|(()=>void);starts:number[][];stops:number;disconnected:boolean;connect():void;disconnect():void;start(...args:number[]):void;stop():void};
class Context extends EventTarget {
  currentTime=0;state='suspended';sampleRate=22050;destination={};nodes:FakeNode[]=[];resumeWait?:Promise<void>;
  createGain(){return{gain:{setValueAtTime(){}},connect(){},disconnect(){}};}
  createBufferSource():FakeNode{
    const node={buffer:null,onended:null as null|(()=>void),starts:[] as number[][],stops:0,disconnected:false,
      connect(){},disconnect(){this.disconnected=true;},start(...args:number[]){this.starts.push(args);},stop(){this.stops++;}};
    this.nodes.push(node);return node;
  }
  async decodeAudioData(){return{sampleRate:22050,numberOfChannels:1,length:pcm.length,getChannelData:()=>pcm};}
  async resume(){if(this.resumeWait)await this.resumeWait;this.state='running';}
  async close(){this.state='closed';}
  suspend(){this.state='suspended';this.dispatchEvent(new Event('statechange'));}
}
async function fixture(){const context=new Context(),commits:number[]=[];const clock=new NmsL1P002SourceClockV1(plan,{createContext:()=>context as unknown as AudioContext,commitHeldFrame:frame=>{commits.push(frame);return true;}});assert((await clock.prepare(raw.slice().buffer)).accepted);return{clock,context,commits};}
const close=(a:number,b:number)=>assert(Math.abs(a-b)<1e-8,`${a} != ${b}`);

test('both source runs have one native anchor; the gap is not appended to or removed from decoded samples',async()=>{
  const{clock,context,commits}=await fixture();context.currentTime=10;assert((await clock.play(user)).accepted);
  assert.equal(context.nodes.length,2);const [a,b]=context.nodes.map(n=>n.starts[0]);
  assert.deepEqual(a,[10,1673/22050,(734400-1673)/22050]);
  close(b[0],10+427/12);close(b[1],734699/22050);close(b[2],82-427/12);
  assert(b[0]>a[0]+a[2]);assert.deepEqual(commits,[1,1]);
  // No JS tick is needed to schedule the second run. A later observation sees its picture.
  context.currentTime=50;assert.equal(clock.snapshot().frame,481);assert.equal(clock.snapshot().activeSegmentIndex,1);
  await clock.close();assert(context.nodes.every(n=>n.stops===1&&n.disconnected));
});
test('pause within the quiet gap cancels the scheduled second run and resumes the exact remaining delay',async()=>{
  const{clock,context}=await fixture();await clock.play(user);context.currentTime=34.125;assert.equal(clock.snapshot().activeSegmentIndex,-1);assert.equal(clock.snapshot().audioEnded,true);
  clock.pause();assert(context.nodes.every(n=>n.stops===1));context.currentTime=100;await clock.play(user);
  assert.equal(context.nodes.length,3);const start=context.nodes[2].starts[0];close(start[0],100+427/12-34.125);close(start[1],734699/22050);
  assert.equal(clock.snapshot().frame,410);await clock.close();
});
test('fractional pause within each voiced run preserves the candidate sample coordinate',async()=>{
  for(const seconds of [5.010125,40.004125]){
    const{clock,context}=await fixture();await clock.play(user);context.currentTime=seconds;const before=clock.snapshot();clock.pause();context.currentTime=200;await clock.play(user);
    const start=context.nodes[2].starts[0];close(start[0],200);close(start[1],before.audio.decodedSample/22050);
    context.currentTime=200.125;close(clock.snapshot().elapsedSeconds,seconds+.125);await clock.close();
  }
});
test('Replay and navigation retire both active and future sounds before re-entry',async()=>{
  const{clock,context}=await fixture();await clock.play(user);context.currentTime=50;clock.replay();assert.equal(clock.snapshot().frame,1);assert.equal(clock.snapshot().audio.decodedSample,1673);
  assert(context.nodes.every(n=>n.stops===1));assert.equal(context.nodes.length,2);context.currentTime=60;await clock.play(user);
  assert.deepEqual(context.nodes[2].starts[0],[60,1673/22050,(734400-1673)/22050]);await clock.close();assert(context.nodes.every(n=>n.stops===1&&n.disconnected));
});
test('interruption holds the picture and sound even when observation is much later',async()=>{
  const{clock,context}=await fixture();await clock.play(user);context.currentTime=34.2;context.suspend();context.currentTime=100;
  assert.equal(clock.snapshot().phase,'paused');close(clock.snapshot().elapsedSeconds,34.2);assert.equal(clock.snapshot().audio.phase,'interrupted');
  await clock.play(user);close(context.nodes[2].starts[0][0],100+427/12-34.2);await clock.close();
});
test('pending activation cannot survive pause, Replay or close',async()=>{
  for(const action of ['pause','replay','close'] as const){
    const{clock,context}=await fixture();let release!:()=>void;context.resumeWait=new Promise(r=>{release=r;});const pending=clock.play(user);
    await clock[action]();release();assert.equal((await pending).accepted,false);assert.equal(context.nodes.length,0);await clock.close();
  }
});
test('inspection remains held at the terminal frame; only native continuation reaches timeline end',async()=>{
  const{clock,context}=await fixture();clock.seekCandidateFrame(985);assert.equal(clock.snapshot().timelineReachedEnd,false);assert.equal(clock.snapshot().phase,'paused');
  clock.seekCandidateFrame(984);context.currentTime=10;await clock.play(user);assert.equal(context.nodes.length,1);close(context.nodes[0].starts[0][2],1/12);
  context.currentTime=10.09;assert.equal(clock.snapshot().timelineReachedEnd,true);assert.equal(clock.snapshot().frame,985);assert.equal(clock.snapshot().lessonCompleted,false);await clock.close();
});
test('source identity, reduced motion and failed paint prevent native playback',async()=>{
  const{clock,context}=await fixture();assert.equal((await clock.play({activation:'automatic',reducedMotion:true})).accepted,false);assert.equal(context.nodes.length,0);await clock.close();
  const bad=new NmsL1P002SourceClockV1(plan,{createContext:()=>context as unknown as AudioContext,commitHeldFrame:()=>true});assert.equal((await bad.prepare(Uint8Array.of(9).buffer)).reason,'source-byte-identity-mismatch');await bad.close();
  const painting=new Context(),blocked=new NmsL1P002SourceClockV1(plan,{createContext:()=>painting as unknown as AudioContext,commitHeldFrame:()=>false});assert.equal((await blocked.prepare(raw.slice().buffer)).accepted,false);assert.equal(painting.nodes.length,0);assert.equal(painting.state,'closed');
  assert.throws(()=>new NmsL1P002SourceClockV1({...plan,sourceSegmentCount:1} as never,{commitHeldFrame:()=>true}),/unsupported/);
});
test('all 985 frames retain deterministic nested child and source-clipped glossary visibility',()=>{
  for(let frame=1;frame<=985;frame++){
    const context={frame,frameDomain:'sprite-722',rootFrame:6,scenario:'source-static-frame',lang:'en' as const,seed:0};
    const state=page.getFrameState(frame,context);
    assert.deepEqual(state,page.getFrameState(frame,context));assert.equal(state.nestedSprite213Frame,frame>=116&&frame<133?frame-115:null);
    assert.deepEqual(state.visibleGlossaryCharacterIds,[...[707].filter(()=>frame>=931),...[705].filter(()=>frame>=939),...[706].filter(()=>frame>=953)]);
    for(const s of nmsL1P002AudioSlices(PLAN,(frame-1)/12)){assert(s.durationSeconds>0);assert(s.firstDecodedSample>=0);assert(s.firstDecodedSample+s.durationSeconds*22050<=1759680+1e-7);}
  }
  assert.deepEqual(nmsL1P002AudioSlices(PLAN,82),[]);
});
