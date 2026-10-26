import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import test from 'node:test';
import {P045SourceClockV1, type P045AudioPlan, type P045Picture} from '../src/nms-l01-p045-source-clock-v1';
import {PLAN, PRACTICE} from '../src/timelines/shared-nms002-l01-p045';

const hash = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
const raws = PLAN.clips.map((_, i) => Uint8Array.of(185 + i, 100 + i, 200 - i));
const pcms = PLAN.clips.map(c => new Float32Array(c.decoder.decodedSamples));
const plan: P045AudioPlan = {...PLAN, clips: PLAN.clips.map((c, i) => ({...c,
  decoder: {...c.decoder, sourceBytes: raws[i].length, sourceSha256: hash(raws[i]), pcmSha256: hash(new Uint8Array(pcms[i].buffer))}}))};
const payloads = () => new Map(plan.clips.map((c, i) => [c.frameDomain, raws[i].slice().buffer]));
const user = {activation: 'user' as const, reducedMotion: false};
const near = (a: number, b: number) => assert(Math.abs(a - b) < 1e-8, `${a} != ${b}`);
class Context extends EventTarget {
  currentTime = 0; state = 'suspended'; sampleRate = 22050; destination = {}; resumeWait?: Promise<void>;
  nodes: {buffer: unknown; onended: null | (() => void); starts: number[][]; stops: number; disconnected: boolean;
    connect(): void; disconnect(): void; start(...args: number[]): void; stop(): void}[] = [];
  createGain() { return {gain: {setValueAtTime() {}}, connect() {}, disconnect() {}}; }
  createBufferSource() {
    const n = {buffer: null, onended: null, starts: [] as number[][], stops: 0, disconnected: false, connect() {},
      disconnect() { this.disconnected = true; }, start(...args: number[]) { this.starts.push(args); }, stop() { this.stops++; }};
    this.nodes.push(n); return n;
  }
  async decodeAudioData(bytes: ArrayBuffer) {
    const i = raws.findIndex(r => r[0] === new Uint8Array(bytes)[0]), pcm = pcms[i];
    return {sampleRate: 22050, numberOfChannels: 1, length: pcm.length, getChannelData: () => pcm};
  }
  async resume() { if (this.resumeWait) await this.resumeWait; this.state = 'running'; }
  async close() { this.state = 'closed'; }
}
async function fixture(seed = 0) {
  const context = new Context(), pictures: P045Picture[] = [];
  const clock = new P045SourceClockV1(plan, {seed,createContext: () => context as unknown as AudioContext,
    commitPicture: p => { pictures.push(p); return true; }});
  assert.equal(clock.snapshot().picture.mainFrame, 1);
  assert((await clock.prepare(payloads())).accepted); return {clock, context, pictures};
}
const finish=(clock:P045SourceClockV1,context:Context)=>{context.currentTime+=100;return clock.snapshot();};
async function reachQuestion(clock:P045SourceClockV1,context:Context,strategies=false) {
 assert((await clock.play(user)).accepted);let s=finish(clock,context);
 for(const frame of [388,525,651,773]) {
  assert.equal(s.phase,'teaching-hold');assert.equal(s.picture.mainFrame,frame);
  if(strategies&&frame>=651) { assert((await clock.openStrategy(user)).accepted);s=finish(clock,context);assert.equal(s.phase,'strategy-wait');assert((await clock.closeStrategy(user)).accepted); }
  else assert((await clock.continueTeaching(user)).accepted);
  s=finish(clock,context);
 }
 assert.equal(s.phase,'question');assert.equal(s.picture.mainFrame,813);assert.deepEqual(s.visitedHolds,[388,525,651,773]);return s;
}
test('exact source choices, hold geometry, two silent strategies, eight active MP3s and Help glossary',()=>{
 assert.deepEqual(PRACTICE.choices.map(c=>[c.letter,c.sourceInstanceName,c.value,c.correct]),[['A','AnsBtn1',65,false],['B','AnsBtn4',85,false],['C','AnsBtn3',90,true],['D','AnsBtn2',100,false]]);
 assert.deepEqual(PLAN.mainStops,[388,525,651,773,813,832]);assert.equal(PLAN.clips.length,8);assert(!PLAN.clips.some(c=>String(c.frameDomain)==='sprite-88'));assert.equal(PRACTICE.fields.length,0);assert.equal(PRACTICE.help.hotspots.length,2);assert.equal(PRACTICE.glossary.length,2);
 assert(PRACTICE.holds.every(h=>h.primarySourceHitBounds===null&&h.secondaryBounds.width>200));assert.deepEqual(PLAN.strategies.map(s=>[s.sourceCharacterId,s.waitFrame,s.frameCount]),[[110,15,20],[146,55,61]]);
});
test('finite main audio stops at each teaching hold, delayed RAF cannot skip an authored hold',async()=>{
 const {clock,context}=await fixture();await clock.play(user);const first=context.nodes[0].starts[0];near(first[0],8/12);near(first[1],1673/22050);near(first[2],379/12);
 for(const [i,f]of [388,525,651,773].entries()) {
  const s=finish(clock,context);assert.equal(s.picture.mainFrame,f);assert.equal(s.phase,'teaching-hold');assert.equal(s.audioDomain,null);assert(s.picture.interaction.continueEnabled);assert.equal(s.picture.interaction.strategyEnabled,i>=2);
  const n=context.nodes.length;await clock.play(user);assert.equal(context.nodes.length,n);assert.equal((await clock.choose('AnsBtn3',user)).accepted,false);assert((await clock.continueTeaching(user)).accepted);
  const node=context.nodes.at(-1)!.starts[0];near(node[1],(1673+(f+1-9)*22050/12)/22050);
 }
 assert.equal(finish(clock,context).phase,'question');assert.equal(clock.snapshot().attempts,0);await clock.close();
});
test('both child strategies run independently, pause without audio and close into main removal frame',async()=>{
 const {clock,context}=await fixture();assert.equal((await clock.openStrategy(user)).accepted,false);await clock.play(user);finish(clock,context);await clock.continueTeaching(user);finish(clock,context);await clock.continueTeaching(user);finish(clock,context);
 for(const [id,wait,next]of [[110,15,652],[146,55,774]]) {
  const count=context.nodes.length;assert((await clock.openStrategy(user)).accepted);const start=context.currentTime;
  assert.equal(clock.snapshot().picture.interaction.strategyCharacterId,id);assert.equal((await clock.closeStrategy(user)).accepted,false);assert.equal((await clock.continueTeaching(user)).accepted,false);assert.equal(context.nodes.length,count);
  context.currentTime=start+5/12;assert.equal(clock.snapshot().picture.interaction.strategyFrame,6);clock.pause();context.currentTime+=50;assert.equal(clock.snapshot().picture.interaction.strategyFrame,6);await clock.play(user);finish(clock,context);assert.equal(clock.snapshot().picture.interaction.strategyFrame,wait);assert.equal(clock.snapshot().phase,'strategy-wait');assert.equal(context.nodes.length,count);
  await clock.closeStrategy(user);assert.equal(clock.snapshot().picture.mainFrame,next);assert.equal(clock.snapshot().picture.interaction.strategyCharacterId,null);finish(clock,context);
 }
 assert.equal(clock.snapshot().phase,'question');assert.deepEqual(clock.snapshot().viewedStrategies,[110,146]);await clock.close();
});
test('four right variants use exact child entry and finite main814..832 tail',async()=>{
 const seen=new Set<number>();for(let seed=0;seed<4;seed++){
  const {clock,context}=await fixture(seed);await reachQuestion(clock,context);const n=context.nodes.length,start=context.currentTime;await clock.choose('AnsBtn3',user);const b=clock.snapshot().selectedBranch!,tail=(b.frameCount-2)/12,c=PLAN.clips.find(c=>c.frameDomain===b.frameDomain)!;seen.add(b.sourceCharacterId);
  assert.equal(context.nodes.length,n+2);const feedback=context.nodes[n].starts[0],main=context.nodes[n+1].starts[0];near(feedback[0],start+Math.max(0,c.rawAudioFirstFrame-2)/12);near(feedback[1],(1673+Math.max(0,2-c.rawAudioFirstFrame)*22050/12)/22050);near(main[0],start+tail);near(main[1],(1673+805*22050/12)/22050);near((main[1]+main[2])*22050,1505664);
  context.currentTime=start+tail-0.001;assert.equal(clock.snapshot().picture.mainFrame,813);context.currentTime=start+tail;assert.equal(clock.snapshot().picture.mainFrame,814);assert.equal(clock.snapshot().picture.interaction.feedbackCharacterId,null);
  context.currentTime=start+tail+18/12;const s=clock.snapshot();assert.equal(s.phase,'ended');assert.equal(s.picture.mainFrame,832);assert(s.correctAnswer);assert.equal(s.audioDomain,null);assert.equal(s.lessonCompleted,false);await clock.close();
 }assert.deepEqual([...seen].sort((a,b)=>a-b),[209,235,249,270]);
});
test('all three wrong branches naturally retry once and reveal on the second completed feedback',async()=>{
 const seen=new Set<number>();for(let seed=0;seed<3;seed++){
  const {clock,context}=await fixture(seed);await reachQuestion(clock,context);await clock.choose('AnsBtn1',user);const b=clock.snapshot().selectedBranch!;seen.add(b.sourceCharacterId);assert.equal(clock.snapshot().wrongAttempts,0);assert.equal((await clock.choose('AnsBtn3',user)).accepted,false);assert.equal(clock.openHelp().accepted,false);
  finish(clock,context);assert.equal(clock.snapshot().phase,'question');assert.equal(clock.snapshot().wrongAttempts,1);assert.equal(clock.snapshot().outcome,'unanswered');
  await clock.choose('AnsBtn4',user);const b2=clock.snapshot().selectedBranch!,t=context.currentTime;context.currentTime=t+(b2.frameCount-2)/12;assert.equal(clock.snapshot().picture.mainFrame,814);finish(clock,context);const s=clock.snapshot();assert.equal(s.phase,'ended');assert.equal(s.wrongAttempts,2);assert(s.revealedAfterSecondWrong);assert(!s.correctAnswer);assert.equal(s.attempts,2);await clock.close();
 }assert.deepEqual([...seen].sort((a,b)=>a-b),[171,185,196]);
});
test('all three distractors are errors and correct second answer is still correct',async()=>{
 for(const id of ['AnsBtn1','AnsBtn4','AnsBtn2']){const{clock,context}=await fixture();await reachQuestion(clock,context);await clock.choose(id,user);finish(clock,context);await clock.choose('AnsBtn3',user);finish(clock,context);assert.equal(clock.snapshot().outcome,'correct');assert.equal(clock.snapshot().wrongAttempts,1);assert.equal(clock.snapshot().attempts,2);await clock.close();}
});
test('Help preserves attempts and guards answers while its glossary may suspend playback',async()=>{
 const {clock,context}=await fixture();assert.equal(clock.openHelp().accepted,false);await reachQuestion(clock,context,true);await clock.choose('AnsBtn2',user);finish(clock,context);assert(clock.openHelp().accepted);assert.equal((await clock.play(user)).reason,'source-help-open');assert.equal((await clock.choose('AnsBtn3',user)).accepted,false);clock.pause();await clock.closeHelp(user);assert.equal(clock.snapshot().wrongAttempts,1);assert(clock.snapshot().picture.interaction.choicesEnabled);assert.equal(clock.snapshot().picture.mainFrame,813);await clock.close();
});
test('pause retires both current feedback and scheduled main, resumes native sample without advancing paused state',async()=>{
 const {clock,context}=await fixture(0);await reachQuestion(clock,context);await clock.choose('AnsBtn3',user);const n=context.nodes.length,start=context.currentTime,b=clock.snapshot().selectedBranch!,tail=(b.frameCount-2)/12;context.currentTime=start+.5;clock.pause();assert(context.nodes.every(n=>n.stops===1));context.currentTime+=100;assert.equal(clock.snapshot().picture.interaction.feedbackFrame,8);await clock.play(user);const nodes=context.nodes.slice(n),now=context.currentTime;assert.equal(nodes.length,2);near(nodes[0].starts[0][0],now);near(nodes[0].starts[0][1],1673/22050+.5-1/12);near(nodes[1].starts[0][0],now+tail-.5);finish(clock,context);await clock.close();
});
test('Replay and page close cancel pending resume and reset every child, hold and outcome',async()=>{
 const {clock,context}=await fixture();await reachQuestion(clock,context,true);await clock.choose('AnsBtn3',user);assert(clock.replay().accepted);const s=clock.snapshot();assert.equal(s.picture.mainFrame,1);assert.equal(s.attempts,0);assert.equal(s.choice,null);assert.equal(s.outcome,'unanswered');assert.deepEqual(s.visitedHolds,[]);assert.deepEqual(s.viewedStrategies,[]);assert(context.nodes.every(n=>n.stops===1));
 let resumed!:()=>void;context.resumeWait=new Promise<void>(r=>{resumed=r;});const pending=clock.play(user);clock.replay();resumed();assert.equal((await pending).accepted,false);assert.equal(clock.snapshot().phase,'ready');context.resumeWait=undefined;await clock.play(user);await clock.close();assert.equal(clock.snapshot().phase,'closed');assert.equal(context.state,'closed');assert(context.nodes.every(n=>n.stops===1));
});
test('inspection stays read-only at every hold, does not manufacture progress or allow autoplay',async()=>{
 const {clock,context}=await fixture();for(const f of [1,9,387,388,525,651,773,813,814,831,832]){assert(clock.inspect(f).accepted);assert.equal(clock.snapshot().picture.mainFrame,f);assert.equal(clock.snapshot().inspectionMode,true);assert.equal((await clock.play(user)).accepted,false);assert.equal((await clock.choose('AnsBtn3',user)).accepted,false);assert.equal((await clock.continueTeaching(user)).accepted,false);assert.equal((await clock.openStrategy(user)).accepted,false);assert.equal(clock.openHelp().accepted,false);assert.equal(clock.snapshot().outcome,'unanswered');assert.deepEqual(clock.snapshot().visitedHolds,[]);}
 for(const f of [0,833,835,NaN,1.5])assert.equal(clock.inspect(f).accepted,false);clock.replay();assert.equal((await clock.play({activation:'automatic',reducedMotion:true})).reason,'reduced-motion-hold');assert.equal(context.nodes.length,0);assert((await clock.play({activation:'user',reducedMotion:true})).accepted);await clock.close();
});
test('bad action policy or choice cannot consume attempts or leave the current source hold',async()=>{
 const {clock,context}=await fixture();await reachQuestion(clock,context);for(const id of ['', 'C','90','AnsBtn5','AnsBtn0'])assert.equal((await clock.choose(id,user)).accepted,false);assert.equal((await clock.choose('AnsBtn3',{activation:'invalid' as 'user',reducedMotion:false})).accepted,false);assert.equal(clock.snapshot().attempts,0);assert.equal(clock.snapshot().phase,'question');await clock.close();
});
test('source byte, PCM and dormant-payload drift fail before any audio starts',async()=>{
 for(const mutate of [(p:Map<string,ArrayBuffer>)=>p.set('sprite-290',new Uint8Array([0]).buffer),(p:Map<string,ArrayBuffer>)=>p.set('sprite-88',new Uint8Array([0]).buffer)]){const context=new Context(),clock=new P045SourceClockV1(plan,{createContext:()=>context as unknown as AudioContext,commitPicture:()=>true}),p=payloads();mutate(p);assert.equal((await clock.prepare(p)).accepted,false);assert.equal(context.nodes.length,0);await clock.close();}
 const context=new Context(),decode=context.decodeAudioData.bind(context);context.decodeAudioData=async b=>{const r=await decode(b);return{...r,getChannelData:()=>{const p=r.getChannelData().slice();p[0]=1;return p;}};};const clock=new P045SourceClockV1(plan,{createContext:()=>context as unknown as AudioContext,commitPicture:()=>true});assert.equal((await clock.prepare(payloads())).accepted,false);assert.equal(context.state,'closed');assert.equal(context.nodes.length,0);
});
test('suspended context holds the active strategy or feedback until user resumes',async()=>{
 const {clock,context}=await fixture();await reachQuestion(clock,context);await clock.choose('AnsBtn3',user);context.currentTime+=.25;context.state='suspended';context.dispatchEvent(new Event('statechange'));assert.equal(clock.snapshot().phase,'paused');assert(clock.snapshot().globalPaused);assert(context.nodes.every(n=>n.stops===1));context.currentTime+=100;const f=clock.snapshot().picture.interaction.feedbackFrame;assert((await clock.play(user)).accepted);assert.equal(clock.snapshot().picture.interaction.feedbackFrame,f);finish(clock,context);await clock.close();
});
