import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {AlgL06P025ClockV1,P025PrimaryClockV1,P025_PRIMARY_AUDIO,P025_AUDIO_EOF_POSITION,
 P025_FINAL_VISUAL_TAIL_FRAMES,P025_GLOSSARY_FIRST_SOURCE_READY,
 inspectP025BrowserDecode,p025GlossarySourceReady,type P025GlossaryKey}
 from '../src/alg-l06-p025-clock-v1';
import {P025_AUDIO_ASSETS,type P025AudioId} from '../src/alg-l06-p025-audio-schedule-v1';
import type {DecodedSourceStreamBinding,DecodedStreamPhase}
 from '../src/decoded-source-stream-transport';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
const audit=JSON.parse(fs.readFileSync(path.join(root,
 'output/alg-l06-p025-source-audit-v1/source-audit-v1.json'),'utf8'));
const geometry=JSON.parse(fs.readFileSync(path.join(root,
 'output/alg-l06-p025-text-geometry-v1/text-geometry-v1.json'),'utf8'));
const A=P025_PRIMARY_AUDIO;
const decoded=()=>inspectP025BrowserDecode({sampleRate:A.sampleRate,
 length:A.ffmpegCandidateSamples,numberOfChannels:1,
 duration:A.ffmpegCandidateSamples/A.sampleRate});
const at=(position:number)=>(position-1)/A.fps;

test('P025 primary constants are source-locked to the one 299-frame stream and four geometry gates',()=>{
 assert.equal(A.frameDomain,'sprite-21');
 assert.equal(A.sourceSha256,audit.audio.embedded.sourceMp3.sha256);
 assert.equal(A.sourceBytes,audit.audio.embedded.sourceMp3.bytes);
 assert.deepEqual([A.sourceBlockFirstFrame,A.sourceBlockLastFrame,A.sourceBlockCount],
  [2,299,audit.audio.embedded.blockCount]);
 assert.equal(A.firstSeekSamples,1673);
 assert.equal(A.ffmpegCandidateSamples,audit.audio.embedded.declaredSampleTotal);
 assert.equal(A.visualFrames,audit.runtime.domains.find((d:{domain:string})=>
  d.domain==='sprite-21').declaredFrames);
 assert.equal(A.separateSaSourceSha256,audit.audio.separateSa.sha256);
 assert.equal(A.separateSaSpliced,false);
 for(const row of geometry.glossary)
  assert.equal(P025_GLOSSARY_FIRST_SOURCE_READY[row.key as P025GlossaryKey],
   row.firstSourceReadyFrame);
 assert(P025_FINAL_VISUAL_TAIL_FRAMES>0&&P025_FINAL_VISUAL_TAIL_FRAMES<0.115);
 assert(Math.abs(P025_AUDIO_EOF_POSITION-298.88544217687075)<1e-9);
});

test('browser sample count must be independently supplied and match the bounded source candidate',()=>{
 assert.equal(decoded().candidateSampleCountMatches,true);
 for(const change of [{length:A.ffmpegCandidateSamples-1},
  {sampleRate:44100},{numberOfChannels:2},{duration:1}])
  assert.throws(()=>inspectP025BrowserDecode({sampleRate:A.sampleRate,
   length:A.ffmpegCandidateSamples,numberOfChannels:1,
   duration:A.ffmpegCandidateSamples/A.sampleRate,...change}),
   /P025_BROWSER_DECODE_METADATA_UNRESOLVED/);
 assert.throws(()=>new P025PrimaryClockV1(undefined as never),
  /P025_BROWSER_DECODE_REQUIRED/);
});

test('explicit Play schedules first seek and delay; a long tick reports every entered frame',()=>{
 const c=new P025PrimaryClockV1(decoded());
 assert.equal(c.play(0,'automatic').accepted,false);
 const started=c.play(0);
 assert.equal(started.accepted,true);
 assert.deepEqual([started.audioStart?.sourceId,started.audioStart?.decodedSample,
  started.audioStart?.delaySeconds],['sprite-21',1673,1/12]);
 assert.equal(started.audioStart?.offsetSeconds,1673/22050);
 const jumped=c.advance(at(120));
 assert.equal(jumped.snapshot.frame,120);
 assert.deepEqual(jumped.enteredFrames,Array.from({length:119},(_,i)=>i+2));
 assert.equal(jumped.snapshot.audioAccepted,false);
});

test('native EOF begins only the bounded visual tail; last frame waits for independent EOF evidence',()=>{
 const c=new P025PrimaryClockV1(decoded()),start=c.play(0);
 assert.equal(start.accepted,true);
 const before=c.advance(at(P025_AUDIO_EOF_POSITION-0.001));
 assert.equal(before.snapshot.frame,298);
 assert.equal(before.snapshot.visualTailAfterAudioEof,false);
 const eof=c.markNativeEnded(at(P025_AUDIO_EOF_POSITION),start.audioStart!.generation);
 assert.equal(eof.accepted,true);assert.equal(eof.snapshot.frame,298);
 assert.equal(eof.snapshot.visualTailAfterAudioEof,true);
 const final=c.advance(at(299));
 assert.equal(final.snapshot.frame,299);assert.equal(final.snapshot.phase,'ended');
 assert.deepEqual(final.enteredFrames,[299]);
 const waiting=new P025PrimaryClockV1(decoded());waiting.play(0);
 const reached=waiting.advance(at(299));
 assert.equal(reached.snapshot.frame,299);assert.equal(reached.snapshot.phase,'playing');
 assert.equal(reached.snapshot.awaitingAudioEof,true);
});

test('sample exhaustion is an observed input and preserves a paused visual tail without replaying audio',()=>{
 const c=new P025PrimaryClockV1(decoded()),start=c.play(0);
 const exhausted=c.observeDecodedSample(A.ffmpegCandidateSamples,
  at(P025_AUDIO_EOF_POSITION),start.audioStart!.generation);
 assert.equal(exhausted.accepted,true);
 assert.equal(exhausted.snapshot.decodedSampleExhaustedObserved,true);
 const paused=c.pause(at(P025_AUDIO_EOF_POSITION+0.02));
 assert.equal(paused.snapshot.phase,'paused');assert.equal(paused.retirePrimaryAudio,true);
 const held=paused.snapshot.position;
 assert.equal(c.advance(100).snapshot.position,held,'paused clock ignores elapsed context time');
 const resumed=c.play(100);
 assert.equal(resumed.accepted,true);assert.equal(resumed.audioStart,null);
 assert.equal(resumed.reason,'visual-tail-only');
 assert.equal(c.advance(100+(299-held)/12).snapshot.phase,'ended');
});

test('midstream Pause/Resume keeps exact position, advances no wall time and uses held sample offset',()=>{
 const c=new P025PrimaryClockV1(decoded()),first=c.play(10);
 assert.equal(first.audioStart?.decodedSample,1673);
 const held=c.pause(10+at(80));
 assert.equal(held.snapshot.frame,80);
 const position=held.snapshot.position;
 assert.equal(c.advance(50).snapshot.position,position);
 const resumed=c.play(50);
 assert.equal(resumed.snapshot.frame,80);
 assert(Math.abs(resumed.audioStart!.decodedSample-
  (1673+(position-2)*22050/12))<1e-8);
 assert.equal(resumed.audioStart?.delaySeconds,0);
 assert.equal(c.advance(50+1/12).snapshot.frame,81);
});

test('context drift, early EOF, and stale ended callbacks fail closed',()=>{
 const c=new P025PrimaryClockV1(decoded()),start=c.play(0);
 assert.equal(c.advance(1).accepted,true);
 const stale=c.markNativeEnded(1,start.audioStart!.generation+1);
 assert.equal(stale.accepted,false);assert.equal(c.snapshot().phase,'playing');
 const drift=c.advance(0.5);
 assert.equal(drift.accepted,false);assert.equal(drift.snapshot.phase,'failed');
 assert.match(drift.reason,/NONMONOTONIC/);
 const early=new P025PrimaryClockV1(decoded()),s=early.play(0);
 const eof=early.markNativeEnded(at(100),s.audioStart!.generation);
 assert.equal(eof.accepted,false);assert.equal(eof.snapshot.phase,'failed');
 assert.match(eof.reason,/EOF_BEFORE_SOURCE_BOUNDARY/);
 const sampleDrift=new P025PrimaryClockV1(decoded()),started=sampleDrift.play(0);
 assert.equal(sampleDrift.observeDecodedSample(100000,at(60),
  started.audioStart!.generation).accepted,true);
 const regression=sampleDrift.observeDecodedSample(99999,at(61),
  started.audioStart!.generation);
 assert.equal(regression.accepted,false);
 assert.match(regression.reason,/DECODED_SAMPLE_REGRESSED/);
});

test('glossary source gates hold primary audio only after full hit and ink; Replay resets',()=>{
 for(const [key,frame] of Object.entries(P025_GLOSSARY_FIRST_SOURCE_READY)){
  const c=new P025PrimaryClockV1(decoded()),start=c.play(0);
  assert.equal(start.accepted,true);
  assert.equal(p025GlossarySourceReady(key as P025GlossaryKey,frame-1),false);
  assert.equal(p025GlossarySourceReady(key as P025GlossaryKey,frame),true);
  const early=c.holdForGlossary(key as P025GlossaryKey,at(frame-1));
  assert.equal(early.accepted,false);
  assert.equal(early.snapshot.phase,'playing','an unavailable source hit does not pause');
  const opened=c.holdForGlossary(key as P025GlossaryKey,at(frame));
  assert.equal(opened.accepted,true);assert.equal(opened.snapshot.phase,'paused');
  assert.equal(opened.snapshot.glossaryOpen,key);
  assert.equal(opened.retirePrimaryAudio,true);
  assert.equal(c.play(at(frame)+1).accepted,false);
  assert.equal(c.closeGlossary().snapshot.glossaryOpen,null);
  const replay=c.replay();assert.equal(replay.snapshot.frame,1);
  assert.equal(replay.snapshot.phase,'ready');
  assert.equal(replay.snapshot.nativeEndedObserved,false);
  assert.equal(c.markNativeEnded(0,start.audioStart!.generation).accepted,false);
  assert.equal(c.close().snapshot.phase,'closed');
 }
});

class HostContext extends EventTarget{
 currentTime=0;
 state:'suspended'|'running'|'closed'='suspended';
 closeCount=0;
 async resume(){if(this.state==='closed')throw Error('closed');
  this.state='running';this.dispatchEvent(new Event('statechange'));}
 async close(){if(this.state!=='closed'){this.closeCount++;this.state='closed';
  this.dispatchEvent(new Event('statechange'));}}
}
const USER={activation:'user' as const,reducedMotion:false};
function hostFixture(options:{holdSample?:boolean;deferPlay?:boolean;
 afterStartDelaySeconds?:number;badAnchor?:'missing'|'sample'|'time';
 commit?:(frame:number)=>boolean}={}){
 const context=new HostContext(),commits:number[]=[],starts:{sample:number;delay:number}[]=[];
 let active=0,finish=()=>{},releasePlay=()=>{};
 const pending=options.deferPlay?new Promise<void>(resolve=>{releasePlay=resolve;}):null;
 const clock=new AlgL06P025ClockV1({
  createContext:()=>context as unknown as AudioContext,
  commitFrame:frame=>{commits.push(frame);return options.commit?.(frame)??true;},
  createTransport:(binding:DecodedSourceStreamBinding,createContext)=>{
   let ctx:HostContext|undefined,phase:DecodedStreamPhase='idle',cursor=0,start=0,
    delay=0,startSample=0,heldTime:number|null=null,epoch=0;
   const listeners=new Set<()=>void>();
   const emit=()=>{for(const listener of listeners)listener();};
   const stop=(next:DecodedStreamPhase)=>{
    epoch++;if(phase==='playing')active--;
    phase=next;heldTime=ctx?.currentTime??null;emit();
   };
   finish=()=>{if(phase!=='playing')return;
    cursor=binding.decodedSamples;active--;phase='buffer-ended';emit();};
   return {
    subscribe(listener:()=>void){listeners.add(listener);return()=>listeners.delete(listener);},
    async prepare(){ctx=createContext() as unknown as HostContext;
     phase='ready';return {accepted:true,reason:'ready'};},
    snapshot(){
     const sample=phase==='playing'?Math.min(binding.decodedSamples-
      (options.holdSample?1:0),startSample+
      Math.max(0,ctx!.currentTime-start-delay)*binding.sampleRate):cursor;
     const playbackAnchor=phase==='playing'&&options.badAnchor!=='missing'?{
      contextTime:options.badAnchor==='time'?Number.NaN:start+delay,
      decodedSample:options.badAnchor==='sample'?startSample+1:startSample}:null;
     return {phase,epoch,decodedSample:sample,contextTime:ctx?.currentTime??null,
      heldContextTime:heldTime,playbackAnchor,elapsedMs:sample/binding.sampleRate*1000,
      volume:1,failure:null,sourceAlignment:'unresolved' as const,
      lessonCompleted:false as const};
    },
    seekDecodedSample(sample:number){stop('paused');cursor=sample;
     return {accepted:true,reason:'seeked'};},
    async play(policy:{delaySeconds?:number}){
     const ticket=++epoch;phase='start-pending';
     if(pending)await pending;
     if(ticket!==epoch)return {accepted:false,reason:'stale-start'};
     await ctx!.resume();if(ticket!==epoch)return {accepted:false,reason:'stale-start'};
     start=ctx!.currentTime;delay=policy.delaySeconds??0;startSample=cursor;
     phase='playing';active++;starts.push({sample:cursor,delay});
     ctx!.currentTime+=options.afterStartDelaySeconds??0;
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
 const sources={'main-1':new ArrayBuffer(P025_AUDIO_ASSETS[0].sourceBytes)} as
  Record<P025AudioId,ArrayBuffer>;
 return {clock,context,commits,starts,sources,forceEnd:()=>finish(),
  releasePlay:()=>releasePlay(),get active(){return active;},
  toPosition(position:number){context.currentTime=(position-1)/12;return clock.tick();}};
}

test('browser-facing P025 clock uses measured binding and commits every entered source frame',async()=>{
 const f=hostFixture();assert.equal((await f.clock.prepare(f.sources)).accepted,true);
 assert.deepEqual(f.commits,[1]);
 assert.equal((await f.clock.play({activation:'automatic',reducedMotion:false})).accepted,false);
 assert.equal((await f.clock.play(USER)).accepted,true);
 assert.deepEqual(f.starts,[{sample:1673,delay:1/12}]);
 f.toPosition(100);assert.deepEqual(f.commits,Array.from({length:100},(_,i)=>i+1));
 assert.equal(f.clock.pause().accepted,true);
 const held=f.clock.snapshot().activePosition;
 f.context.currentTime+=10;assert.equal(f.clock.snapshot().activePosition,held);
 assert.equal((await f.clock.play(USER)).accepted,true);
 assert.equal(f.starts.length,2);
 assert(Math.abs(f.starts[1].sample-(1673+(held-2)*22050/12))<1e-7);
 await f.clock.close();assert.equal(f.context.closeCount,1);assert.equal(f.active,0);
});

test('browser-facing P025 terminal frame waits for decoded or native EOF and never replays tail',async()=>{
 const f=hostFixture({holdSample:true});await f.clock.prepare(f.sources);await f.clock.play(USER);
 const waiting=f.toPosition(299);assert.equal(waiting.phase,'playing');
 assert.equal(waiting.mainFinalAudioTailPending,true);
 f.forceEnd();assert.equal(f.clock.snapshot().phase,'timeline-ended');
 assert.equal(f.starts.length,1);assert.equal(f.active,0);
 assert.equal(f.clock.replay().accepted,true);
 assert.equal((await f.clock.play(USER)).accepted,true);
 assert.equal(f.starts.length,2);
 await f.clock.close();
});

test('scheduled native anchor survives delayed play resolution, preroll and paused resume',async()=>{
 const f=hostFixture({afterStartDelaySeconds:0.12,holdSample:true});
 await f.clock.prepare(f.sources);
 assert.equal((await f.clock.play(USER)).accepted,true);
 assert.deepEqual(f.starts[0],{sample:1673,delay:1/12});
 assert(f.clock.snapshot().activePosition>2.4,
  'visual clock must include context time elapsed after native scheduling');
 const near=f.toPosition(P025_AUDIO_EOF_POSITION+0.01);
 assert.equal(near.phase,'playing');assert.equal(near.frame,298);
 f.forceEnd();assert.equal(f.clock.snapshot().phase,'playing');
 assert.equal(f.toPosition(299).phase,'timeline-ended');
 assert.equal(f.starts.length,1);
 assert.equal(f.clock.replay().accepted,true);
 assert.equal((await f.clock.play(USER)).accepted,true);
 f.context.currentTime+=at(80);f.clock.tick();
 assert.equal(f.clock.pause().accepted,true);
 const held=f.clock.snapshot().activePosition;
 f.context.currentTime+=5;
 assert.equal((await f.clock.play(USER)).accepted,true);
 assert.equal(f.starts[2].delay,0);
 assert(Math.abs(f.starts[2].sample-(1673+(held-2)*22050/12))<1e-7);
 assert(f.clock.snapshot().activePosition>held+1,
  'resumed clock includes native-to-promise delay without replaying held prefix');
 await f.clock.close();
});

test('browser-facing P025 rejects absent, mismatched or nonfinite native start anchors',async()=>{
 for(const badAnchor of ['missing','sample','time'] as const){
  const f=hostFixture({badAnchor});await f.clock.prepare(f.sources);
  const started=await f.clock.play(USER);
  assert.equal(started.accepted,false,badAnchor);
  assert.match(started.reason,/P025_NATIVE_START_ANCHOR_INVALID/);
  assert.equal(f.active,0,badAnchor);
  assert.equal(f.clock.snapshot().phase,'paused');
  await f.clock.close();
 }
});

test('browser-facing P025 rejects native EOF before the bounded source boundary',async()=>{
 const f=hostFixture();await f.clock.prepare(f.sources);await f.clock.play(USER);
 f.toPosition(100);f.forceEnd();
 assert.equal(f.clock.snapshot().phase,'failed');
 assert.match(f.clock.snapshot().failure??'',/EOF_BEFORE_SOURCE_BOUNDARY/);
 assert.equal(f.active,0);await f.clock.close();
});

test('browser-facing P025 glossary gate, pending-start cancellation and failed commit retire source',async()=>{
 const f=hostFixture();await f.clock.prepare(f.sources);await f.clock.play(USER);
 f.toPosition(27);assert.equal(f.clock.openGlossary('Independent variable').accepted,false);
 f.toPosition(28);assert.equal(f.clock.openGlossary('Independent variable').accepted,true);
 assert.equal(f.active,0);assert.equal(f.clock.snapshot().phase,'paused');
 assert.equal(f.clock.closeGlossary().accepted,true);
 await f.clock.close();
 const pending=hostFixture({deferPlay:true});await pending.clock.prepare(pending.sources);
 const start=pending.clock.play(USER);await Promise.resolve();
 assert.equal(pending.clock.replay().accepted,true);
 pending.releasePlay();assert.equal((await start).accepted,false);
 assert.equal(pending.starts.length,0);await pending.clock.close();
 const failed=hostFixture({commit:frame=>frame<20});
 await failed.clock.prepare(failed.sources);await failed.clock.play(USER);
 assert.equal(failed.toPosition(20).phase,'failed');
 assert.equal(failed.active,0);await failed.clock.close();
});
