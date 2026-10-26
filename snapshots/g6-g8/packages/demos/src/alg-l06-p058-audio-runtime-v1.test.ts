import assert from 'node:assert/strict';
import test from 'node:test';
import {P058PageRuntimeV1,type P058RuntimeOptions} from './alg-l06-p058-audio-runtime-v1';
import {P058_MEASURED_BINDINGS,P058_AUDIO_CLOCKS,type P058AudioDomain} from './alg-l06-p058-measured-bindings-v1';
import {P058_BEHAVIOR_SOURCE} from './alg-l06-p058-state-v1';
import {p058SourceState} from './alg-l06-p058-source-v1';
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
function fixture(seed=0,overrides:Partial<P058RuntimeOptions>={}){
 let now=0,cleaned=0;const tracks={} as Record<P058AudioDomain,Track>,loads:P058AudioDomain[]=[];
 const page=new P058PageRuntimeV1({seed,commit:()=>true,load:async id=>{loads.push(id as P058AudioDomain);return new ArrayBuffer(1);},
  makeTransport:(b,id)=>tracks[id as P058AudioDomain]=new Track(()=>now,b.sampleRate),resumeClock:async()=>true,onCleanup:()=>cleaned++,...overrides});
 const step=async(seconds:number)=>{now+=seconds;page.tick();await flush();};
 const question=async()=>{assert(await page.start());assert(page.play());await flush();
  for(const [i,target] of [403,571,720,878].entries()){
   await step(100);assert.equal(page.snapshot().state.mainFrame,target);assert.equal(page.snapshot().state.phase,'step-held');
   assert(i<2?page.stepClick():page.continueStep());await flush();
  }
  await step(100);assert.equal(page.snapshot().state.mainFrame,934);assert.equal(page.snapshot().state.phase,'quiz-held');
 };
 return {page,tracks,loads,step,question,cleaned:()=>cleaned};
}
test('runtime clocks all seven branches; attempts change at terminal, no intermediate feedback hold',async()=>{
 for(const kind of ['wrong','right'] as const)for(let seed=0;seed<(kind==='wrong'?3:4);seed++){
  const f=fixture(seed);await f.question();assert(!f.loads.includes('sa'));assert(!f.loads.includes('218' as never));assert.equal(f.page.play(),false);
  assert(f.page.choose(kind==='wrong'?'A':'C'));await flush();let s=f.page.snapshot().state;
  const b=P058_BEHAVIOR_SOURCE.feedback.find(b=>b.spriteId===s.feedback!.spriteId)!;
  const id=String(b.spriteId) as Exclude<P058AudioDomain,'main'|'sa'>;
  assert.equal(b.kind,kind);assert.equal(b.index,seed+1);assert.equal(s.quizTryCount,0);
  assert.equal(f.tracks[id].seeks.at(-1),P058_AUDIO_CLOCKS[id].decodedEntrySample);
  if(id==='36')assert.equal(f.tracks[id].seeks.at(-1),3511);
  if(['76','97','129'].includes(id))assert.equal(f.tracks[id].delays.at(-1),1/12);
  await f.step((b.terminal-3)/12);assert.equal(f.page.snapshot().state.quizTryCount,0);assert(f.page.snapshot().state.feedback!.playing);
  await f.step(1/12+.001);s=f.page.snapshot().state;
  assert.equal(s.feedback,null);assert.equal(s.phase,kind==='wrong'?'quiz-held':'main');assert.equal(s.quizTryCount,kind==='wrong'?1:0);
  if(kind==='right'){await f.step(1/12+.001);assert.equal(f.page.snapshot().state.mainFrame,935);}
  await f.page.close();assert.equal(f.cleaned(),1);assert(Object.values(f.tracks).every(t=>t.closes===1));
 }
});
test('silent step boxes never start narration, close resets only the box, and paused tween resumes fractional position',async()=>{
 const f=fixture();assert(await f.page.start());f.page.play();await flush();assert.equal(f.tracks.main.delays.at(-1),13/12);
 for(const target of [403,571]){await f.step(100);assert.equal(f.page.snapshot().state.mainFrame,target);assert.equal(f.page.play(),false);f.page.stepClick();await flush();}
 for(const [target,id]of [[720,242],[878,252]]){
  await f.step(100);assert.equal(f.page.snapshot().state.mainFrame,target);const starts=f.tracks.main.starts,cursor=f.tracks.main.snapshot().decodedSample;
  assert(f.page.stepClick());await flush();await f.step(.145);assert.equal(f.page.snapshot().state.stepBox!.frame,2);f.page.pause();await f.step(5);
  assert.equal(f.page.snapshot().state.stepBox!.frame,2);assert(f.page.play());await flush();await f.step(.03);assert.equal(f.page.snapshot().state.stepBox!.frame,3);
  await f.step(5);assert.equal(f.page.snapshot().state.stepBox!.spriteId,id);assert.equal(f.page.snapshot().state.stepBox!.frame,15);
  assert.equal(f.page.play(),false);assert.equal(f.tracks.main.starts,starts);assert.equal(f.tracks.main.snapshot().decodedSample,cursor);
  assert(f.page.closeBox());await flush();await f.step(1);assert.equal(f.page.snapshot().state.stepBox!.frame,1);assert.equal(f.page.snapshot().state.mainFrame,target);
  assert.equal(f.tracks.main.starts,starts);assert.equal(f.page.play(),false);assert(f.page.continueStep());await flush();
 }
 await f.step(10);assert.equal(f.page.snapshot().state.mainFrame,934);await f.page.close();
});
test('two wrong endings retire different owners and only second proceeds beyond the final question',async()=>{
 const f=fixture();await f.question();const ids=[];
 for(let attempt=1;attempt<=2;attempt++){
  assert(f.page.choose('A'));await flush();ids.push(f.page.snapshot().state.feedback!.spriteId);
  assert.equal(f.page.snapshot().state.quizTryCount,attempt-1);await f.step(10);
  assert.equal(f.page.snapshot().state.phase,attempt===1?'quiz-held':'main');
  assert.equal(f.page.snapshot().state.quizTryCount,attempt===1?1:0);
 }
 assert.deepEqual(ids,[129,115]);await f.step(10);assert.equal(f.page.snapshot().state.mainFrame,951);assert.equal(f.page.snapshot().lessonCompleted,false);await f.page.close();
});
test('pause, replay and source stop own exact main seeks; pending playback and browser rejection cannot revive old state',async()=>{
 const f=fixture();await f.page.start();f.page.play();await flush();await f.step(.145);const held=f.page.snapshot().state.mainFrame;
 f.page.pause();const cursor=f.tracks.main.snapshot().decodedSample;await f.step(5);assert.equal(f.page.snapshot().state.mainFrame,held);assert.equal(f.tracks.main.snapshot().decodedSample,cursor);
 f.page.play();await flush();await f.step(.03);assert(f.page.snapshot().state.mainFrame>held);await f.step(100);
 assert.equal(f.page.snapshot().state.mainFrame,403);assert.equal(f.tracks.main.seeks.at(-1),Math.ceil(1673+(403-14)*22050/12));
 f.page.replay();let release!:()=>void;f.tracks.main.pending=new Promise<void>(r=>release=r);f.page.play();f.page.replay();release();await flush();
 assert.equal(f.page.snapshot().state.mainFrame,1);assert(!f.page.snapshot().visualClockRunning);assert.notEqual(f.tracks.main.phase,'playing');
 f.tracks.main.pending=null;f.tracks.main.reject=true;f.page.play();await flush();assert.match(f.page.snapshot().failure!,/rejected/);
 f.tracks.main.reject=false;assert(f.page.play());await flush();assert.equal(f.page.snapshot().failure,null);await f.page.close();
});
test('function help and dictionary are scoped to live owner and do not resume held narration',async()=>{
 const f=fixture();await f.question();assert(f.page.openHelp());assert.equal(f.page.choose('C'),false);
 assert.equal(f.page.glossary(170,285),false);assert(f.page.glossary(171,268));assert.equal(f.page.snapshot().state.glossaryTerm,'Function');
 assert.equal(f.page.closeHelp(),false);assert(f.page.closeGlossary());assert(f.page.closeHelp());assert.equal(f.page.snapshot().state.mainFrame,934);assert.equal(f.page.play(),false);
 f.page.replay();assert.equal(f.page.glossary(172,252),false);await f.page.close();
});
test('SA starts only on explicit request; pending load is aborted by Replay/leave and EOF returns to held source',async()=>{
 for(const action of ['replay','close'] as const){let release!:(x:ArrayBuffer)=>void,signal:AbortSignal|undefined;
  const f=fixture(0,{load:async(id,s)=>{if(id==='sa'){signal=s;return new Promise<ArrayBuffer>(r=>release=r);}return new ArrayBuffer(1);}});
  await f.question();const pending=f.page.startSpanish();await flush();assert(f.page.snapshot().spanishLoading);await f.page[action]();assert(signal?.aborted);
  release(new ArrayBuffer(1));assert.equal(await pending,false);assert(!f.page.snapshot().spanishSelected||action==='close');assert(!f.page.snapshot().visualClockRunning);await f.page.close();
 }
 const g=fixture();await g.question();assert(await g.page.startSpanish());g.tracks.sa.phase='buffer-ended';g.tracks.sa.emit();await flush();
 assert(!g.page.snapshot().spanishSelected);assert.equal(g.page.snapshot().state.mainFrame,934);assert.equal(g.page.snapshot().visualClockRunning,false);await g.page.close();
});
test('main PCM EOF preserves a visual tail without looping audio or reporting lesson completion',async()=>{
 const f=fixture();await f.question();f.page.choose('C');await flush();await f.step(10);await f.step(1);f.tracks.main.phase='buffer-ended';f.tracks.main.anchor=null;
 f.page.pause();const starts=f.tracks.main.starts;assert(f.page.play());await flush();await f.step(1);
 assert.equal(f.tracks.main.starts,starts);assert.equal(f.page.snapshot().state.mainFrame,951);assert.equal(f.page.snapshot().lessonCompleted,false);await f.page.close();
});
