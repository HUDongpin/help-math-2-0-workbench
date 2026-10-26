import assert from 'node:assert/strict';
import test from 'node:test';
import {P033PageRuntimeV1,type P033RuntimeOptions} from './alg-l06-p033-audio-runtime-v1';
import {P033_MEASURED_BINDINGS,P033_AUDIO_CLOCKS,type P033AudioDomain} from './alg-l06-p033-measured-bindings-v1';
import {P033_BEHAVIOR_SOURCE} from './alg-l06-p033-state-v1';
import {p033SourceState} from './alg-l06-p033-source-v1';
import type {DecodedStreamPhase,DecodedStreamSnapshot} from './decoded-source-stream-transport';
class Track {
  phase: DecodedStreamPhase = 'idle'; epoch = 0; cursor = 0; anchor: number | null = null;
  volume = 1; closes = 0; starts = 0; reject = false; pending: Promise<void> | null = null;
  delays: number[] = []; seeks: number[] = [];
  listeners = new Set<() => void>();
  subscribe(listener: () => void) {this.listeners.add(listener); return () => {this.listeners.delete(listener);};}
  emit() {for (const listener of this.listeners) listener();}
  constructor(readonly now: () => number, readonly rate: number) {}
  async prepare() {this.epoch++; this.phase = 'ready'; this.cursor = 0; return {accepted: true, reason: 'ready'};}
  async play(policy: {activation: 'user' | 'automatic'; reducedMotion: boolean; delaySeconds?: number}) {
    if (this.phase === 'buffer-ended') return {accepted: false, reason: 'not-ready-for-play'};
    const epoch = ++this.epoch; this.phase = 'start-pending';
    if (this.pending) await this.pending;
    if (epoch !== this.epoch) return {accepted: false, reason: 'stale-start'};
    if (this.reject) {this.phase = 'play-rejected'; return {accepted: false, reason: 'browser rejected'};}
    this.delays.push(policy.delaySeconds ?? 0); this.starts++;
    this.anchor = this.now() + (policy.delaySeconds ?? 0); this.phase = 'playing';
    return {accepted: true, reason: 'playing'};
  }
  pause() {this.cursor = this.snapshot().decodedSample; this.epoch++; this.anchor = null; this.phase = 'paused'; return {accepted: true, reason: 'paused'};}
  replay() {this.epoch++; this.cursor = 0; this.anchor = null; this.phase = 'ready'; return {accepted: true, reason: 'ready'};}
  seekDecodedSample(sample: number) {this.epoch++; this.cursor = sample; this.seeks.push(sample); this.anchor = null; this.phase = 'paused'; return {accepted: true, reason: 'seeked'};}
  setVolume(volume: number) {this.volume = volume; return {accepted: true, reason: 'volume'};}
  snapshot(): DecodedStreamSnapshot {return {phase: this.phase, epoch: this.epoch,
    decodedSample: this.cursor + (this.anchor === null ? 0 : Math.max(0, this.now() - this.anchor) * this.rate),
    contextTime: this.now(), playbackAnchor: this.anchor === null ? null : {contextTime: this.anchor, decodedSample: this.cursor},
    heldContextTime: null, elapsedMs: 0, volume: this.volume, failure: null, sourceAlignment: 'unresolved', lessonCompleted: false};}
  async close() {this.epoch++; this.closes++; this.phase = 'closed'; this.anchor = null;}
}
const flush = async () => {for (let i = 0; i < 16; i++) await Promise.resolve();};
function fixture(seed=0,overrides:Partial<P033RuntimeOptions>={}){
 let now=0,cleaned=0;const tracks={} as Record<P033AudioDomain,Track>,loads:P033AudioDomain[]=[];
 const page=new P033PageRuntimeV1({seed,commit:()=>true,load:async id=>{loads.push(id);return new ArrayBuffer(1);},
  makeTransport:(b,id)=>tracks[id]=new Track(()=>now,b.sampleRate),resumeEnded:async()=>true,onCleanup:()=>cleaned++,...overrides});
 const step=async(seconds:number)=>{now+=seconds;page.tick();await flush();};
 const question=async()=>{assert(await page.start());assert(page.play());await flush();await step(52/12);assert.equal(page.snapshot().state.phase,'quiz-held');};
 return {page,tracks,loads,step,question,cleaned:()=>cleaned};
}
test('real runtime selects all seven source clocks, holds each wrong branch and supports early Close',async()=>{
 for(const kind of ['wrong','right'] as const)for(let seed=0;seed<(kind==='wrong'?3:4);seed++){
  const f=fixture(seed);await f.question();assert(!f.loads.includes('sa'));assert.equal(f.page.play(),false);
  assert(f.page.choose(kind==='wrong'?2:1));await flush();let s=f.page.snapshot().state;
  const b=P033_BEHAVIOR_SOURCE.binding.branches.find(b=>b.spriteId===s.feedback!.spriteId)!;
  const id=String(b.spriteId) as Exclude<P033AudioDomain,'main'|'sa'>;
  assert.equal(b.kind,kind);assert.equal(b.index,seed+1);
  assert.equal(f.tracks[id].seeks.at(-1),P033_AUDIO_CLOCKS[id].decodedEntrySample);
  if(id==='111')assert.equal(f.tracks[id].seeks.at(-1),3511);
  if(id==='147')assert.equal(f.tracks[id].delays.at(-1),1/12);
  if(b.kind==='wrong'){
   await f.step((b.closePlacementFirst-2)/12+.001);s=f.page.snapshot().state;
   assert.equal(s.feedback!.frame,b.closePlacementFirst);const generation=s.feedback!.generation;
   assert(f.page.closeWrong(generation));await flush();assert.equal(f.page.snapshot().state.feedback!.frame,b.closeJump);
   assert.equal(f.tracks[id].seeks.at(-1),Math.ceil(1673+(b.closeJump-P033_AUDIO_CLOCKS[id].firstAudioFrame)*22050/12));
   await f.step((b.terminal-b.closeJump)/12+.001);assert.equal(f.page.snapshot().state.phase,'quiz-held');assert.equal(f.page.snapshot().state.quizTryCount,1);
  }else{await f.step((b.terminal-2)/12+.001);assert.equal(f.page.snapshot().state.phase,'postquiz-resume');await f.step(1/12+.001);assert.equal(f.page.snapshot().state.mainFrame,53);}
  await f.page.close();assert.equal(f.cleaned(),1);assert(Object.values(f.tracks).every(t=>t.closes===1));
 }
});
test('two wrong attempts retire separate source streams and second terminal alone resumes main',async()=>{
 const f=fixture();await f.question();const ids=[];
 for(let attempt=1;attempt<=2;attempt++){
  assert(f.page.choose(2));await flush();let s=f.page.snapshot().state;ids.push(s.feedback!.spriteId);
  const b=P033_BEHAVIOR_SOURCE.binding.branches.find(b=>b.spriteId===s.feedback!.spriteId)!;assert(b.kind==='wrong');
  await f.step(10);s=f.page.snapshot().state;assert.equal(s.phase,'wrong-feedback-held');assert.equal(s.feedback!.frame,b.hold);
  assert.equal(f.page.play(),false);assert.equal(s.quizTryCount,attempt);assert.equal(s.wrongFeedText,attempt===1?P033_BEHAVIOR_SOURCE.binding.wrongFirst:P033_BEHAVIOR_SOURCE.binding.wrongLater);
  assert(f.page.closeWrong(s.feedback!.generation));await flush();await f.step((b.terminal-b.closeJump)/12+.001);
  assert.equal(f.page.snapshot().state.phase,attempt===1?'quiz-held':'postquiz-resume');
 }
 assert.deepEqual(ids,[147,161]);assert.equal(f.page.snapshot().state.quizTryCount,0);await f.step(30);assert.equal(f.page.snapshot().state.mainFrame,385);assert.equal(f.page.snapshot().lessonCompleted,false);await f.page.close();
});
test('pause preserves a fractional frame, replay invalidates a pending audio start, browser denial can recover',async()=>{
 const f=fixture();assert(await f.page.start());assert(f.page.play());await flush();await f.step(.145);const held=f.page.snapshot().state.mainFrame;
 f.page.pause();const cursor=f.tracks.main.snapshot().decodedSample;await f.step(5);assert.equal(f.page.snapshot().state.mainFrame,held);assert.equal(f.tracks.main.snapshot().decodedSample,cursor);
 assert(f.page.play());await flush();await f.step(.03);assert(f.page.snapshot().state.mainFrame>held);
 f.page.replay();let release!:()=>void;f.tracks.main.pending=new Promise<void>(r=>release=r);
 f.page.play();assert.equal(f.tracks.main.phase,'start-pending');f.page.replay();release();await flush();assert.equal(f.page.snapshot().state.mainFrame,1);assert(!f.page.snapshot().visualClockRunning);assert.notEqual(f.tracks.main.phase,'playing');
 f.tracks.main.pending=null;f.tracks.main.reject=true;f.page.play();await flush();assert.match(f.page.snapshot().failure!,/rejected/);
 f.tracks.main.reject=false;assert(f.page.play());await flush();assert.equal(f.page.snapshot().failure,null);await f.page.close();
});
test('EOF visual tail resumes without replaying PCM and source stop keeps exact main boundary',async()=>{
 const f=fixture(2);await f.question();assert.equal(f.tracks.main.seeks.at(-1),93548);
 assert(f.page.choose(1));await flush();assert.equal(f.page.snapshot().state.feedback!.spriteId,46);
 await f.step(2.2);f.tracks['46'].phase='buffer-ended';f.tracks['46'].anchor=null;f.page.pause();const starts=f.tracks['46'].starts;
 assert(f.page.play());await flush();await f.step(1);assert.equal(f.tracks['46'].starts,starts);assert.equal(f.page.snapshot().state.phase,'postquiz-resume');await f.page.close();
});
test('explicit SA pending load, EOF return and leave never advance source or revive a stale owner',async()=>{
 let release!:(x:ArrayBuffer)=>void,signal:AbortSignal|undefined;
 const f=fixture(0,{load:async(id,s)=>{if(id==='sa'){signal=s;return new Promise<ArrayBuffer>(r=>release=r);}return new ArrayBuffer(1);}});
 await f.question();const pending=f.page.startSpanish();await flush();assert(f.page.snapshot().spanishLoading);f.page.replay();assert(signal?.aborted);release(new ArrayBuffer(1));assert.equal(await pending,false);assert.equal(f.page.snapshot().state.mainFrame,1);assert(!f.page.snapshot().spanishSelected);await f.page.close();
 const g=fixture();await g.question();assert(await g.page.startSpanish());assert.equal(g.tracks.sa.phase,'playing');g.tracks.sa.phase='buffer-ended';g.tracks.sa.emit();await flush();assert(!g.page.snapshot().spanishSelected);assert.equal(g.page.snapshot().state.mainFrame,52);assert.equal(g.page.snapshot().visualClockRunning,false);await g.page.close();
});
test('native source reading preserves alpha boundaries, answer lifetime, explanation stages and emphasized pairs',()=>{
 assert.equal(p033SourceState(44).options.length,0);assert.equal(p033SourceState(45).options.length,4);assert.equal(p033SourceState(84).options.length,1);
 assert.equal(p033SourceState(172).explanation.length,0);assert.equal(p033SourceState(173).explanation.length,1);assert.equal(p033SourceState(231).explanation.length,2);
 assert.equal(p033SourceState(257).emphasizedPair,0);assert.equal(p033SourceState(258).emphasizedPair,null);assert.equal(p033SourceState(258,true).emphasizedPair,0);
 assert.deepEqual(p033SourceState(385).glossary.map(g=>g.key),['Set','Ordered pair','Function','Value']);
});
