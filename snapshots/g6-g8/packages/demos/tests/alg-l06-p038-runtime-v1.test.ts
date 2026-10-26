import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {test} from 'node:test';
import {P038_MAIN,P038_SA,P038PageRuntimeV1,p038SourceCanOpen}
  from '../src/alg-l06-p038-runtime-v1';
import type {DecodedSourceStreamBinding}
  from '../src/decoded-source-stream-transport';

const ROOT=new URL('../../../',import.meta.url);
const pin=(path:string,hash:string)=>{
  const bytes=readFileSync(new URL(path,ROOT));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),hash);
  return JSON.parse(bytes.toString());
};
class FakeContext{
  currentTime=0;state:'suspended'|'running'|'closed'='suspended';
  constructor(readonly sampleRate:number){}
  async resume(){this.state='running';}
  async close(){this.state='closed';}
}
class FakeTransport{
  phase='idle';epoch=0;cursor=0;heldContextTime:number|null=null;
  anchor:{contextTime:number;decodedSample:number}|null=null;
  readonly plays:number[]=[];closeCount=0;pauseCount=0;replayCount=0;
  private listeners=new Set<()=>void>();
  private context:FakeContext|undefined;
  constructor(readonly binding:DecodedSourceStreamBinding,
    readonly createContext:()=>FakeContext){}
  subscribe(listener:()=>void){this.listeners.add(listener);return()=>this.listeners.delete(listener);}
  emit(){for(const listener of this.listeners)listener();}
  snapshot(){
    const ctx=this.context,now=ctx?.currentTime??null;
    const sample=this.phase==='playing'&&ctx&&this.anchor?
      Math.min(this.binding.decodedSamples,this.anchor.decodedSample+
        Math.max(0,ctx.currentTime-this.anchor.contextTime)*this.binding.sampleRate):this.cursor;
    return {phase:this.phase,epoch:this.epoch,decodedSample:sample,
      contextTime:now,heldContextTime:this.heldContextTime,
      playbackAnchor:this.anchor};
  }
  async prepare(_bytes:ArrayBuffer){
    this.context=this.createContext();this.phase='ready';this.emit();
    return {accepted:true,reason:'ready'};
  }
  async play(options:{activation:string;delaySeconds?:number}){
    assert.equal(options.activation,'user');
    await this.context?.resume();
    const delay=options.delaySeconds??0;this.plays.push(delay);
    this.epoch++;this.anchor={contextTime:this.context!.currentTime+delay,decodedSample:this.cursor};
    this.heldContextTime=null;this.phase='playing';this.emit();
    return {accepted:true,reason:'playing'};
  }
  pause(){
    this.cursor=this.snapshot().decodedSample;this.heldContextTime=this.context?.currentTime??null;
    this.anchor=null;this.phase='paused';this.epoch++;this.pauseCount++;this.emit();
    return {accepted:true,reason:'paused'};
  }
  replay(){this.anchor=null;this.cursor=0;this.epoch++;this.phase='ready';
    this.replayCount++;this.emit();return {accepted:true,reason:'ready'};}
  setVolume(_value:number){return {accepted:true,reason:'set'};}
  async close(){this.phase='closed';this.closeCount++;this.emit();await this.context?.close();}
  nativeEnd(){this.cursor=this.binding.decodedSamples;this.anchor=null;
    this.phase='buffer-ended';this.emit();}
}
function fixture(liveHit=(..._args:unknown[])=>true){
  const mainContext=new FakeContext(22050),spanishContext=new FakeContext(48000);
  const transports:FakeTransport[]=[];const committed:number[]=[];
  const runtime=new P038PageRuntimeV1({commitFrame:frame=>{
    committed.push(frame);return true;},liveHit,
    createMainContext:()=>mainContext as unknown as AudioContext,
    createSpanishContext:()=>spanishContext as unknown as AudioContext,
    createTransport:(binding,createContext)=>{
      const transport=new FakeTransport(binding,createContext as ()=>FakeContext);
      transports.push(transport);return transport as unknown as ConstructorParameters<
        typeof P038PageRuntimeV1>[0]['createTransport'] extends (...args:any)=>infer T?T:never;
    }});
  return {runtime,mainContext,spanishContext,main:transports[0],sa:transports[1],committed};
}

test('actual P038 receipt and seven physical button windows bind this draft',()=>{
  const facts=pin('migrations/shared-alg001-l06-p038/audit/source-v1/source-facts-v1.json',
    'e6df1089aaa9274d1eb3b9771d39e5e3d8cf54c6761050eff0acc00fa9a3f04e');
  const audioPlan=pin('migrations/shared-alg001-l06-p038/audio-source-v1/source-audio-plan-v1.json',
    '75d034131968fa5800de49b77dd0d791281e81ec233b98ae0ede75597228a9f0');
  const ledger=pin('migrations/shared-alg001-l06-p038/audio-source-v1/main-frame-block-schedule-v1.json',
    'd2c15d0c1e5c701e87e0066a12842878fb9c361e6fcb9de52d11b64b67265d5b');
  const model=pin('migrations/shared-alg001-l06-p038/native-v1/native-model-v1.json',
    '5fe165f369a84e7e08a0b4fbf6de921c40e9cd4f5367a647c9fc70186d26e13f');
  const decode=pin('output/alg-l06-p038-root-browser-decode-v1/root-readback-v1.json',
    'd7dfeadedd902911b3f0a6fbfed6be164272bb329616617eb6836e68f8b8cade');
  assert.equal(decode.rootReviewed,true);
  assert.equal(facts.audio.blockRanges[0][0],36);
  assert.deepEqual(audioPlan.absentBlockRanges,[[1,35]]);
  assert.equal(ledger.frames.length,409);
  assert.equal(ledger.frames[34].blockPresent,false);
  assert.equal(ledger.frames[35].blockPresent,true);
  assert.equal(ledger.frames[408].declaredSampleEnd,686592);
  assert.equal(audioPlan.claimBoundary.noBlockMeansAudibleSilence,null);
  assert.equal(model.frameCount,409);assert.equal(model.buttonBindings.length,7);
  for(const [id,binding] of [['main',P038_MAIN],['sa',P038_SA]] as const){
    const actual=decode.actualRaw.results.find((x:{id:string})=>x.id===id);
    assert.equal(actual.sourceSha256,binding.sourceSha256);
    assert.equal(actual.sourceBytes,binding.sourceBytes);
    assert.equal(actual.decodedSamples,binding.decodedSamples);
    assert.equal(actual.decodedSampleRate,binding.sampleRate);
    assert.equal(actual.channelMajorFloat32LeSha256,binding.pcmSha256);
  }
  for(const [key,first] of [['Table',166],['Output',207],['Input',207],
    ['Equation',258],['Rule',296],['Graph',322],['Function',387]] as const){
    assert.equal(p038SourceCanOpen(key,first-1,()=>true),false);
    assert.equal(p038SourceCanOpen(key,first,()=>true),true);
    assert.equal(p038SourceCanOpen(key,409,()=>true),true);
    assert.equal(p038SourceCanOpen(key,first),false);
  }
});

test('one continuous main buffer begins at source frame 36 after AudioContext timed visual lead',async()=>{
  const f=fixture();await f.runtime.prepareMain(new ArrayBuffer(1));
  assert.equal(f.runtime.snapshot().frame,1);
  assert.equal((await f.runtime.play({activation:'user',reducedMotion:false})).accepted,true);
  assert.equal(f.main.plays.length,1);
  assert.equal(f.main.plays[0],35/12);
  f.mainContext.currentTime=34/12;assert.equal(f.runtime.tick().frame,35);
  assert.equal(f.main.snapshot().decodedSample,0);
  f.mainContext.currentTime=35/12;assert.equal(f.runtime.tick().frame,36);
  f.mainContext.currentTime=36/12;assert.equal(f.runtime.tick().frame,37);
  assert.ok(f.main.snapshot().decodedSample>0);
  assert.equal(f.main.plays.length,1);
  await f.runtime.close();
});

test('pause in lead reschedules only remaining lead; glossary close stays held until Play',async()=>{
  const f=fixture();await f.runtime.prepareMain(new ArrayBuffer(1));
  await f.runtime.play({activation:'user',reducedMotion:false});
  f.mainContext.currentTime=1;assert.equal(f.runtime.tick().frame,13);
  assert.equal(f.runtime.pause().accepted,true);assert.equal(f.main.cursor,0);
  await f.runtime.play({activation:'user',reducedMotion:false});
  assert.equal(f.main.plays[1],23/12);
  f.mainContext.currentTime+=165/12;assert.equal(f.runtime.tick().frame,178);
  assert.equal(f.runtime.openGlossary('Table').accepted,true);
  assert.equal(f.runtime.snapshot().phase,'paused');
  assert.equal(f.runtime.closeGlossary().accepted,true);
  assert.equal(f.runtime.snapshot().phase,'paused');
  assert.equal(f.runtime.snapshot().glossaryOpen,null);
  assert.equal(f.main.plays.length,2);
  await f.runtime.play({activation:'user',reducedMotion:false});
  assert.equal(f.main.plays[2],0);
  await f.runtime.close();
});

test('Spanish is separately prepared, explicit, held on return, and cleared by Replay',async()=>{
  const f=fixture();await f.runtime.prepareMain(new ArrayBuffer(1));
  await f.runtime.prepareSpanish(new ArrayBuffer(1));
  assert.equal(f.sa.plays.length,0);
  assert.equal((await f.runtime.startSpanish({activation:'user'})).accepted,true);
  assert.equal(f.runtime.snapshot().selectedAudio,'spanish');
  assert.equal(f.sa.plays.length,1);
  assert.equal(f.runtime.returnMain().accepted,true);
  assert.equal(f.runtime.snapshot().selectedAudio,'main');
  assert.equal(f.main.plays.length,0);
  await f.runtime.play({activation:'user',reducedMotion:false});
  f.mainContext.currentTime=166/12;f.runtime.tick();
  f.runtime.openGlossary('Table');
  assert.equal(f.runtime.replay().accepted,true);
  const s=f.runtime.snapshot();assert.equal(s.frame,1);
  assert.equal(s.phase,'ready');assert.equal(s.glossaryOpen,null);
  assert.equal(s.spanishAudio.decodedSample,0);assert.equal(s.mainAudio.decodedSample,0);
  assert.equal(f.main.replayCount,1);assert.equal(f.sa.replayCount,2);
  await f.runtime.close();
  assert.equal(f.main.closeCount,1);assert.equal(f.sa.closeCount,1);
});

test('native EOF and frame boundary never notify lesson completion or invent Flash stop',async()=>{
  const f=fixture();await f.runtime.prepareMain(new ArrayBuffer(1));
  await f.runtime.play({activation:'user',reducedMotion:false});
  f.mainContext.currentTime=408/12;const atBoundary=f.runtime.tick();
  assert.equal(atBoundary.frame,409);assert.equal(atBoundary.visualBoundaryReached,true);
  assert.equal(atBoundary.lessonCompleted,false);
  assert.equal(atBoundary.sourceTerminalStopVerified,false);
  f.main.nativeEnd();const after=f.runtime.tick();
  assert.equal(after.mainAudio.nativeEofObserved,true);
  assert.equal(after.phase,'visual-boundary-held');
  assert.equal(after.lessonCompleted,false);
  await f.runtime.close();
});

test('native EOF before frame 409 leaves a visual tail on the same context',async()=>{
  const f=fixture();await f.runtime.prepareMain(new ArrayBuffer(1));
  await f.runtime.play({activation:'user',reducedMotion:false});
  f.mainContext.currentTime=30;assert.equal(f.runtime.tick().frame,361);
  f.main.nativeEnd();
  assert.equal(f.runtime.snapshot().phase,'playing');
  assert.equal(f.main.plays.length,1);
  f.mainContext.currentTime=408/12;
  const boundary=f.runtime.tick();assert.equal(boundary.frame,409);
  assert.equal(boundary.phase,'visual-boundary-held');
  assert.equal(boundary.lessonCompleted,false);
  assert.equal(f.main.plays.length,1);
  await f.runtime.close();
});
