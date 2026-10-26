import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import test from 'node:test';
import {P033SourceClockV1, type P033AudioPlan, type P033Picture} from '../src/nms-l01-p033-source-clock-v1';
import {PLAN, PRACTICE} from '../src/timelines/shared-nms002-l01-p033';

const hash = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
const raws = PLAN.clips.map((_, i) => Uint8Array.of(199 + i, 100 + i, 200 - i));
const pcms = PLAN.clips.map(c => new Float32Array(c.decoder.decodedSamples));
const plan: P033AudioPlan = {...PLAN, clips: PLAN.clips.map((c, i) => ({...c,
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
  const context = new Context(), pictures: P033Picture[] = [];
  const clock = new P033SourceClockV1(plan, {seed,createContext: () => context as unknown as AudioContext,
    commitPicture: p => { pictures.push(p); return true; }});
  assert.equal(clock.snapshot().picture.mainFrame, 1);
  assert((await clock.prepare(payloads())).accepted); return {clock, context, pictures};
}
const finish=(clock:P033SourceClockV1, context:Context)=>{context.currentTime+=30;return clock.snapshot();};
test('four source choices, eight complete native streams, two Help terms and four fallback captions',()=>{
 assert.deepEqual(PRACTICE.choices.map(c=>[c.sourceInstanceName,c.value,c.correct]),[['AnsBtn1',84,false],['AnsBtn2',86,true],['AnsBtn3',90,false],['AnsBtn4',94,false]]);
 assert.equal(PLAN.clips.length,8);assert.equal(PRACTICE.fields.length,4);assert.equal(PRACTICE.help.hotspots.length,2);assert.equal(PRACTICE.glossary.length,2);
 assert(!PLAN.clips.some(c=>['sprite-228','sprite-157'].includes(c.frameDomain)));
});
test('intro schedules finite native audio at9 and stops253 before delayed RAF can overrun',async()=>{
 const {clock,context}=await fixture();await clock.play(user);const s=context.nodes[0].starts[0];near(s[0],8/12);near(s[1],1673/22050);near(s[2],244/12);near((s[1]+s[2])*22050,450023);
 context.currentTime=252/12-.001;assert.equal(clock.snapshot().picture.mainFrame,252);context.currentTime=100;assert.equal(clock.snapshot().phase,'question');assert.equal(clock.snapshot().picture.mainFrame,253);assert.equal(clock.snapshot().audioDomain,null);assert(clock.snapshot().picture.interaction.choicesEnabled);await clock.close();
});
test('only four authored choices can consume attempts and choices are unavailable during feedback',async()=>{
 const {clock,context}=await fixture();assert.equal((await clock.choose('AnsBtn2',user)).accepted,false);clock.inspect(253);
 for(const id of ['', 'A','AnsBtn0','AnsBtn5','86'])assert.equal((await clock.choose(id,user)).accepted,false);
 assert.equal(clock.snapshot().attempts,0);assert.equal(context.nodes.length,0);assert((await clock.choose('AnsBtn2',user)).accepted);assert.equal((await clock.choose('AnsBtn1',user)).accepted,false);assert.equal(clock.openHelp().accepted,false);finish(clock,context);assert.equal(clock.snapshot().outcome,'correct');await clock.close();
});
test('each wrong variant waits at its own popup; first close permits retry and second resumes254..511',async()=>{
 const seen=new Set<number>();
 for(let seed=0;seed<20&&seen.size<3;seed++){
  const {clock,context}=await fixture(seed);clock.inspect(253);await clock.choose('AnsBtn1',user);const b=clock.snapshot().selectedBranch!;seen.add(b.sourceCharacterId);
  assert.equal((await clock.closeWrong(user)).accepted,false);finish(clock,context);assert.equal(clock.snapshot().phase,'wrong-wait');assert.equal(clock.snapshot().picture.interaction.feedbackFrame,b.waitFrame);
  const n=context.nodes.length;clock.pause();await clock.play(user);assert.equal(context.nodes.length,n);
  await clock.closeWrong(user);finish(clock,context);assert.equal(clock.snapshot().phase,'question');assert.equal(clock.snapshot().wrongAttempts,1);assert.equal(clock.snapshot().outcome,'unanswered');
  await clock.choose('AnsBtn4',user);finish(clock,context);const branch=clock.snapshot().selectedBranch!;await clock.closeWrong(user);const start=context.currentTime,tail=(branch.frameCount-branch.closeEntryFrame!)/12;
  context.currentTime=start+tail;assert.equal(clock.snapshot().picture.mainFrame,254);assert.equal(clock.snapshot().picture.interaction.feedbackCharacterId,null);assert.equal(clock.snapshot().audioDomain,'sprite-257');
  context.currentTime=start+tail+257/12;assert.equal(clock.snapshot().phase,'ended');assert.equal(clock.snapshot().picture.mainFrame,511);assert.equal(clock.snapshot().outcome,'revealed');assert.equal(clock.snapshot().correctAnswer,false);assert.equal(clock.snapshot().attempts,2);await clock.close();
 }
 assert.deepEqual([...seen].sort((a,b)=>a-b),[199,213,249]);
});
test('all four right variants continue directly into authored254..511 with no invented coaching',async()=>{
 const seen=new Set<number>();for(let seed=0;seed<20&&seen.size<4;seed++){
  const {clock,context}=await fixture(seed);await clock.play(user);context.currentTime=252/12;clock.tick();await clock.choose('AnsBtn2',user);const b=clock.snapshot().selectedBranch!,start=context.currentTime,tail=(b.frameCount-2)/12;seen.add(b.sourceCharacterId);
  const feedback=context.nodes[1].starts[0];near(feedback[0],start+(b.sourceCharacterId===126?1/12:0));near(feedback[1],1673/22050);
  assert.equal(context.nodes.length,3);const main=context.nodes.at(-1)!.starts[0];near(main[0],start+tail);near(main[1],(1673+245*22050/12)/22050);near(main[2],(923328-1673-245*22050/12)/22050);near((main[1]+main[2])*22050,923328);
  context.currentTime=start+tail;assert.equal(clock.snapshot().picture.mainFrame,254);context.currentTime=start+tail+257/12;assert.equal(clock.snapshot().phase,'ended');assert.equal(clock.snapshot().picture.mainFrame,511);assert.equal(clock.snapshot().audioDomain,null);assert.equal(clock.snapshot().correctAnswer,true);assert.equal(clock.snapshot().lessonCompleted,false);await clock.close();
 }assert.deepEqual([...seen].sort((a,b)=>a-b),[105,126,143,183]);
});
test('all three distractors are errors and a correct second attempt remains correct',async()=>{
 for(const id of ['AnsBtn1','AnsBtn3','AnsBtn4']){const {clock,context}=await fixture();clock.inspect(253);await clock.choose(id,user);finish(clock,context);await clock.closeWrong(user);finish(clock,context);await clock.choose('AnsBtn2',user);finish(clock,context);assert.equal(clock.snapshot().outcome,'correct');assert.equal(clock.snapshot().wrongAttempts,1);assert.equal(clock.snapshot().attempts,2);await clock.close();}
});
test('Help preserves retry count, blocks choices and resumes same question after closing',async()=>{
 const {clock,context}=await fixture();assert.equal(clock.openHelp().accepted,false);clock.inspect(253);await clock.choose('AnsBtn1',user);finish(clock,context);await clock.closeWrong(user);finish(clock,context);
 assert(clock.openHelp().accepted);assert.equal(clock.snapshot().picture.interaction.helpVisible,true);assert.equal((await clock.choose('AnsBtn2',user)).accepted,false);assert.equal((await clock.play(user)).reason,'source-help-open');await clock.closeHelp(user);assert.equal(clock.snapshot().wrongAttempts,1);assert(clock.snapshot().picture.interaction.choicesEnabled);await clock.close();
});
test('pause retires selected feedback and future main node, resuming from exact native sample',async()=>{
 const {clock,context}=await fixture();clock.inspect(253);await clock.choose('AnsBtn2',user);const b=clock.snapshot().selectedBranch!,tail=(b.frameCount-2)/12;context.currentTime=.5;clock.pause();assert(context.nodes.every(n=>n.stops===1));context.currentTime=100;await clock.play(user);const ns=context.nodes.slice(-2);near(ns[0].starts[0][0],100);near(ns[0].starts[0][1],1673/22050+.5);near(ns[1].starts[0][0],100+tail-.5);finish(clock,context);assert.equal(clock.snapshot().phase,'ended');await clock.close();
});
test('Replay cancels feedback, future main and pending resume, resetting all interaction state',async()=>{
 const {clock,context}=await fixture();clock.inspect(253);await clock.choose('AnsBtn2',user);clock.replay();assert.equal(clock.snapshot().picture.mainFrame,1);assert.equal(clock.snapshot().attempts,0);assert.equal(clock.snapshot().choice,null);assert.equal(clock.snapshot().outcome,'unanswered');assert(context.nodes.every(n=>n.stops===1));
 let finishResume!:()=>void;context.resumeWait=new Promise<void>(r=>{finishResume=r;});const pending=clock.play(user);clock.replay();finishResume();assert.equal((await pending).accepted,false);assert.equal(clock.snapshot().phase,'ready');await clock.close();
});
test('inspector preserves source1..511, cannot claim solved outcome, and reduced motion blocks autoplay',async()=>{
 const {clock,context}=await fixture();for(const f of [1,9,100,252,253,254,300,306,510,511]){assert(clock.inspect(f).accepted);assert.equal(clock.snapshot().picture.mainFrame,f);assert.equal(clock.snapshot().outcome,'unanswered');assert.equal(clock.snapshot().inspectionMode,true);}for(const f of [0,512,NaN,1.5])assert.equal(clock.inspect(f).accepted,false);
 clock.replay();assert.equal((await clock.play({activation:'automatic',reducedMotion:true})).reason,'reduced-motion-hold');assert.equal(context.nodes.length,0);await clock.close();
});
test('mutated source bytes, wrong PCM and unexpected dormant stream cannot play',async()=>{
 for(const mutate of [(p:Map<string,ArrayBuffer>)=>p.set('sprite-257',new Uint8Array([0]).buffer),(p:Map<string,ArrayBuffer>)=>p.set('sprite-157',new Uint8Array([0]).buffer)]){
  const context=new Context(),clock=new P033SourceClockV1(plan,{createContext:()=>context as unknown as AudioContext,commitPicture:()=>true}),p=payloads();mutate(p);assert.equal((await clock.prepare(p)).accepted,false);assert.equal(context.nodes.length,0);await clock.close();
 }
 const context=new Context(),decode=context.decodeAudioData.bind(context);context.decodeAudioData=async b=>{const r=await decode(b);return{...r,getChannelData:()=>{const p=r.getChannelData().slice();p[0]=1;return p;}};};const clock=new P033SourceClockV1(plan,{createContext:()=>context as unknown as AudioContext,commitPicture:()=>true});assert.equal((await clock.prepare(payloads())).accepted,false);assert.equal(context.state,'closed');assert.equal(context.nodes.length,0);
});
