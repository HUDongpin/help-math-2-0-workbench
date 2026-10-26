import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import test from 'node:test';
import {P031SourceClockV1, type P031AudioPlan, type P031Picture} from '../src/nms-l01-p031-source-clock-v1';
import {PLAN, PRACTICE} from '../src/timelines/shared-nms002-l01-p031';

const hash = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
const raws = PLAN.clips.map((_, i) => Uint8Array.of(103 + i, 100 + i, 200 - i));
const pcms = PLAN.clips.map(c => new Float32Array(c.decoder.decodedSamples));
const plan: P031AudioPlan = {...PLAN, clips: PLAN.clips.map((c, i) => ({...c,
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
  const context = new Context(), pictures: P031Picture[] = [];
  const clock = new P031SourceClockV1(plan, {seed,createContext: () => context as unknown as AudioContext,
    commitPicture: p => { pictures.push(p); return true; }});
  assert.equal(clock.snapshot().picture.mainFrame, 1);
  assert((await clock.prepare(payloads())).accepted); return {clock, context, pictures};
}
const finish=(clock:P031SourceClockV1, context:Context)=>{context.currentTime+=30;return clock.snapshot();};
test('four source additions, eleven exact native streams and source device field restoration',()=>{
 assert.deepEqual(PRACTICE.problems.map(p=>[p.left,p.right,p.result,p.questionFrame,p.answerFrame,p.nextCharacterId]),[[6,9,15,542,543,336],[12,15,27,544,545,349],[32,49,81,546,547,361],[37,17,54,548,549,361]]);
 assert.equal(PLAN.clips.length,11);assert.equal(PRACTICE.fields.length,9);assert.equal(PRACTICE.help.hotspots.length,1);assert.equal(PRACTICE.glossary.length,2);
 assert(!PLAN.clips.some(c=>['sprite-149','sprite-278'].includes(c.frameDomain)));
});
test('intro schedules native samples up to source542 before any delayed frame callback',async()=>{
 const {clock,context}=await fixture();await clock.play(user);const s=context.nodes[0].starts[0];near(s[0],3/12);near(s[1],1673/22050);near(s[2],538/12);near((s[1]+s[2])*22050,990248);
 context.currentTime=541/12-.001;assert.equal(clock.snapshot().picture.mainFrame,541);context.currentTime=100;assert.equal(clock.snapshot().phase,'question');assert.equal(clock.snapshot().picture.mainFrame,542);assert.equal(clock.snapshot().audioDomain,null);assert(clock.snapshot().picture.interaction.inputEnabled);await clock.close();
});
test('empty, malformed and excessive input neither consume attempts nor advance; ordinary decimal comparison remains numeric',async()=>{
 const {clock,context}=await fixture();clock.inspect(542);
 for(const value of ['', ' ', 'x', '1e1','Infinity','0xf','--15','1.2.3']){assert(clock.setInput(value).accepted);assert.equal((await clock.submit(user)).reason,'enter-a-number');assert.equal(clock.snapshot().attempts,0);}
 assert.equal(clock.setInput('1'.repeat(13)).accepted,false);assert.equal(context.nodes.length,0);
 assert(clock.setInput(' +15.0 ').accepted);assert((await clock.submit(user)).accepted);assert.equal(clock.snapshot().selectedBranch?.kind,'right');assert.equal(clock.setInput('99').accepted,false);finish(clock,context);assert.equal(clock.snapshot().phase,'answered');await clock.close();
});
test('every host wrong variant holds its own popup, closes into editable first retry, then reveals after second error',async()=>{
 const seen=new Set<number>();
 for(let seed=0;seed<12&&seen.size<3;seed++){
  const {clock,context}=await fixture(seed);clock.inspect(542);clock.setInput('0');await clock.submit(user);const b=clock.snapshot().selectedBranch!;seen.add(b.sourceCharacterId);
  assert.equal(clock.newProblem().accepted,false);assert.equal(clock.openHelp().accepted,false);assert.equal(clock.closeWrong(user) instanceof Promise,true);
  finish(clock,context);assert.equal(clock.snapshot().phase,'wrong-wait');assert.equal(clock.snapshot().picture.interaction.feedbackFrame,b.waitFrame);assert(clock.snapshot().picture.interaction.popupVisible);
  const n=context.nodes.length;clock.pause();await clock.play(user);assert.equal(context.nodes.length,n);
  assert((await clock.closeWrong(user)).accepted);finish(clock,context);assert.equal(clock.snapshot().phase,'question');assert.equal(clock.snapshot().inputText,'');assert.equal(clock.snapshot().wrongAttempts,1);
  clock.setInput('-1');await clock.submit(user);finish(clock,context);assert.equal(clock.snapshot().wrongAttempts,2);const branch=clock.snapshot().selectedBranch!;
  await clock.closeWrong(user);const start=context.currentTime,close=(branch.frameCount-branch.closeEntryFrame!)/12;
  context.currentTime=start+close;assert.equal(clock.snapshot().picture.interaction.nextCharacterId,336);assert.equal(clock.snapshot().picture.interaction.nextFrame,2);assert.equal(clock.snapshot().picture.interaction.inputText,'');
  context.currentTime=start+close+40/12;assert.equal(clock.snapshot().phase,'answered');assert.equal(clock.snapshot().picture.mainFrame,543);assert.equal(clock.snapshot().outcomes[0],'revealed');assert.equal(clock.snapshot().attempts,2);await clock.close();
 }
 assert.deepEqual([...seen].sort((a,b)=>a-b),[134,169,200]);
});
test('four correct responses preserve answer holds and route final retained361 into authored549..604',async()=>{
 const {clock,context}=await fixture();await clock.play(user);context.currentTime=541/12;clock.tick();
 for(let i=0;i<4;i++){
  assert.equal(clock.snapshot().questionIndex,i);assert.equal(clock.snapshot().picture.mainFrame,542+i*2);
  clock.setInput(String(PRACTICE.problems[i].result));await clock.submit(user);const t=context.currentTime,b=clock.snapshot().selectedBranch!,lead=(b.frameCount-2)/12;
  assert.equal(clock.snapshot().picture.interaction.feedbackCharacterId,b.sourceCharacterId);
  context.currentTime=t+lead;assert.equal(clock.snapshot().picture.interaction.nextCharacterId,[336,349,361,361][i]);assert.equal(clock.snapshot().picture.interaction.nextFrame,2);
  context.currentTime=t+lead+40/12;
  if(i<3){assert.equal(clock.snapshot().phase,'answered');assert.equal(clock.snapshot().picture.mainFrame,543+i*2);assert(clock.newProblem().accepted);}
  else {assert.equal(clock.snapshot().phase,'playing');assert.equal(clock.snapshot().picture.mainFrame,549);assert.equal(clock.snapshot().audioDomain,'sprite-374');assert.equal(clock.newProblem().accepted,false);context.currentTime+=55/12;assert.equal(clock.snapshot().phase,'ended');assert.equal(clock.snapshot().picture.mainFrame,604);}
 }
 assert.deepEqual(clock.snapshot().outcomes,['correct','correct','correct','correct']);assert.equal(clock.snapshot().audioDomain,null);assert.equal(clock.snapshot().lessonCompleted,false);
 assert(clock.newProblem().accepted);assert.equal(clock.snapshot().picture.mainFrame,542);assert.equal(clock.snapshot().attempts,0);assert.deepEqual(clock.snapshot().outcomes,['unanswered','unanswered','unanswered','unanswered']);await clock.close();
});
test('all four right variants are reachable and never expose dormant variants',async()=>{
 const seen=new Set<number>();for(let seed=0;seed<20&&seen.size<4;seed++){
  const {clock,context}=await fixture(seed);clock.inspect(544);clock.setInput('27');await clock.submit(user);seen.add(clock.snapshot().selectedBranch!.sourceCharacterId);finish(clock,context);assert.equal(clock.snapshot().picture.mainFrame,545);await clock.close();
 }assert.deepEqual([...seen].sort((a,b)=>a-b),[217,231,252,310]);
});
test('skip uses exactly Q2 Q3 Q4, no skip button on Q4; final second-wrong plays answer54 and can refill',async()=>{
 const {clock,context}=await fixture();clock.inspect(542);for(let i=0;i<3;i++)assert(clock.newProblem().accepted);assert.equal(clock.snapshot().questionIndex,3);assert.equal(clock.newProblem().accepted,false);
 for(let i=0;i<2;i++){clock.setInput('1');await clock.submit(user);finish(clock,context);await clock.closeWrong(user);finish(clock,context);}
 assert.equal(clock.snapshot().phase,'ended');assert.equal(clock.snapshot().picture.mainFrame,604);assert.deepEqual(clock.snapshot().outcomes,['skipped','skipped','skipped','revealed']);assert.equal(clock.snapshot().correctCount,0);await clock.close();
});
test('Help preserves typed input and blocks submit, New Problem and all clocks; close restores same question',async()=>{
 const {clock,context}=await fixture();assert.equal(clock.openHelp().accepted,false);clock.inspect(546);clock.setInput('8');assert(clock.openHelp().accepted);assert.equal(clock.snapshot().picture.interaction.helpVisible,true);assert.equal((await clock.submit(user)).accepted,false);assert.equal(clock.newProblem().accepted,false);assert.equal(clock.setInput('81').accepted,false);
 await clock.closeHelp(user);assert.equal(clock.snapshot().inputText,'8');assert.equal(clock.snapshot().questionIndex,2);assert(clock.snapshot().picture.interaction.inputEnabled);assert.equal(context.nodes.length,0);await clock.close();
});
test('pause during coaching retires every scheduled node including future outro; resume keeps exact sample offset',async()=>{
 const {clock,context}=await fixture();clock.inspect(548);clock.setInput('54');await clock.submit(user);const b=clock.snapshot().selectedBranch!,t=(b.frameCount-2)/12+.5;context.currentTime=t;clock.pause();assert.equal(clock.snapshot().picture.interaction.nextCharacterId,361);assert(context.nodes.every(n=>n.stops===1));
 context.currentTime=100;await clock.play(user);const ns=context.nodes.slice(-2);near(ns[0].starts[0][0],100);near(ns[0].starts[0][1],1673/22050+.5-2/12);near(ns[1].starts[0][0],100+40/12-.5);finish(clock,context);assert.equal(clock.snapshot().phase,'ended');await clock.close();
});
test('Replay cancels feedback, future coaching and pending resume, resetting all four questions and counters',async()=>{
 const {clock,context}=await fixture();clock.inspect(548);clock.setInput('54');await clock.submit(user);clock.replay();assert.equal(clock.snapshot().picture.mainFrame,1);assert.equal(clock.snapshot().attempts,0);assert.equal(clock.snapshot().questionIndex,0);assert(context.nodes.every(n=>n.stops===1));
 let finishResume!:()=>void;context.resumeWait=new Promise<void>(r=>{finishResume=r;});const pending=clock.play(user);clock.replay();finishResume();assert.equal((await pending).accepted,false);assert.equal(clock.snapshot().phase,'ready');await clock.close();
});
test('inspector retains all authored questions/answers and605 without creating solved outcomes',async()=>{
 const {clock,context}=await fixture();for(const f of [1,541,542,543,544,545,546,547,548,549,575,604,605]){assert(clock.inspect(f).accepted);assert.equal(clock.snapshot().picture.mainFrame,f);assert.equal(clock.snapshot().correctCount,0);assert.equal(clock.snapshot().inspectionMode,true);}
 clock.replay();assert.equal((await clock.play({activation:'automatic',reducedMotion:true})).reason,'reduced-motion-hold');assert.equal(context.nodes.length,0);await clock.close();
});
test('mutated source bytes, wrong PCM and unexpected active stream cannot play',async()=>{
 for(const mutate of [(p:Map<string,ArrayBuffer>)=>p.set('sprite-374',new Uint8Array([0]).buffer),(p:Map<string,ArrayBuffer>)=>p.set('sprite-149',new Uint8Array([0]).buffer)]){
  const context=new Context(),clock=new P031SourceClockV1(plan,{createContext:()=>context as unknown as AudioContext,commitPicture:()=>true}),p=payloads();mutate(p);assert.equal((await clock.prepare(p)).accepted,false);assert.equal(context.nodes.length,0);await clock.close();
 }
 const context=new Context(),decode=context.decodeAudioData.bind(context);context.decodeAudioData=async b=>{const r=await decode(b);return{...r,getChannelData:()=>{const p=r.getChannelData().slice();p[0]=1;return p;}};};const clock=new P031SourceClockV1(plan,{createContext:()=>context as unknown as AudioContext,commitPicture:()=>true});assert.equal((await clock.prepare(payloads())).accepted,false);assert.equal(context.state,'closed');assert.equal(context.nodes.length,0);
});
