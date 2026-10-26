import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import test from 'node:test';
import {P029SourceClockV1, type P029AudioPlan, type P029Picture} from '../src/nms-l01-p029-source-clock-v1';
import {PLAN, PRACTICE} from '../src/timelines/shared-nms002-l01-p029';

const hash = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
const raws = PLAN.clips.map((_, i) => Uint8Array.of(103 + i, 100 + i, 200 - i));
const pcms = PLAN.clips.map(c => new Float32Array(c.decoder.decodedSamples));
const plan: P029AudioPlan = {...PLAN, clips: PLAN.clips.map((c, i) => ({...c,
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
async function fixture() {
  const context = new Context(), pictures: P029Picture[] = [];
  const clock = new P029SourceClockV1(plan, {createContext: () => context as unknown as AudioContext,
    commitPicture: p => { pictures.push(p); return true; }});
  assert.equal(clock.snapshot().picture.mainFrame, 1);
  assert((await clock.prepare(payloads())).accepted); return {clock, context, pictures};
}
test('all13 signed source choices preserve five exact suffix targets and eight deliberate distractors', () => {
  assert.deepEqual(PRACTICE.choices.map(c=>c.value),[-6,-5,-4,-3,-2,-1,0,1,2,3,4,5,6]);
  assert.deepEqual(PRACTICE.choices.map(c=>[c.sourceIndex,c.sourceCharacterId,c.target?.sourceCharacterId??null]),[[5,51,null],[2,63,48],[6,52,null],[7,53,null],[0,54,46],[8,55,null],[4,56,50],[9,57,null],[10,58,null],[11,59,null],[3,60,49],[12,61,null],[1,62,47]]);
  assert.deepEqual(PRACTICE.targets.map(t=>[t.sourceIndex,t.givenValue,t.value]),[[0,2,-2],[1,-6,6],[2,5,-5],[3,-4,4],[4,0,0]]);
  assert.equal(PRACTICE.choices.filter(c=>c.canMatch).length,5);
  assert.deepEqual(PLAN.clips.map(c=>[c.frameDomain,c.decoder.decodedSamples]),[['sprite-327',786816],['sprite-318',27072],['sprite-326',34560]]);
  assert.deepEqual(PRACTICE.primaryControls.map(c=>c.entryId),['column','opposite-integers']);
  assert.deepEqual(PRACTICE.help.hotspots.map(c=>c.entryId),['opposite-integers','value','direction','distance']);
  assert.deepEqual(PRACTICE.wrong.hotspots.map(c=>c.entryId),['opposite-integers','value','distance','direction']);
});
test('native continuous intro crosses declaration error without inserted samples and holds396 when visual callbacks lag', async () => {
  const {clock,context}=await fixture();await clock.play(user);const start=context.nodes[0].starts[0];
  near(start[0],8/12);near(start[1],1673/22050);near(start[2],387/12);near((start[1]+start[2])*22050,712785.5);
  context.currentTime=169/12;assert.equal(clock.snapshot().picture.mainFrame,170);near(clock.snapshot().audioSample,1673+(169/12-8/12)*22050);
  assert.equal(context.nodes.length,1);context.currentTime=100;assert.equal(clock.snapshot().phase,'question');assert.equal(clock.snapshot().picture.mainFrame,396);
  assert.equal(clock.snapshot().audioDomain,null);assert(clock.snapshot().picture.interaction.inputEnabled);await clock.play(user);assert.equal(context.nodes.length,1);await clock.close();
});
test('source suffix0 selects and drags independently of numeric zero at suffix4 and null selection', async () => {
  const {clock,context}=await fixture();clock.inspect(396);assert(clock.select(0).accepted);assert.equal(clock.snapshot().picture.interaction.selectedIndex,0);
  assert(clock.beginDrag(0).accepted);assert(clock.moveDrag(-33.25,188.5).accepted);assert.deepEqual(clock.snapshot().picture.interaction.drag,{index:0,x:-33.25,y:188.5});
  assert.equal(clock.moveDrag(NaN,0).accepted,false);assert.equal(clock.moveDrag(0,10001).accepted,false);assert(clock.cancelDrag().accepted);
  assert.equal(clock.snapshot().picture.interaction.selectedIndex,null);assert.equal(clock.snapshot().attempts,0);
  assert(clock.select(4).accepted);assert.equal(clock.snapshot().picture.interaction.selectedIndex,4);assert.equal(PRACTICE.choices.find(c=>c.sourceIndex===4)!.value,0);
  for(const i of [-1,13,.5,NaN])assert.equal(clock.select(i).accepted,false);
  assert.equal(context.nodes.length,0);await clock.close();
});
test('all8 distractors remain wrong at all5 actual targets and outside; no distractor can advance the count', async () => {
  const {clock,context}=await fixture();clock.inspect(396);let attempts=0;
  for(let i=5;i<=12;i++)for(const target of [null,0,1,2,3,4]){
    assert(clock.select(i).accepted);assert((await clock.drop(i,target,user)).accepted);attempts++;
    assert.equal(clock.snapshot().operation,'wrong');assert.equal(clock.snapshot().solvedCount,0);assert.equal(clock.snapshot().attempts,attempts);
    assert.equal(clock.snapshot().picture.interaction.inputEnabled,false);assert(clock.closeWrong().accepted);assert.equal(clock.snapshot().phase,'question');
  }
  assert.equal(context.nodes.length,48);assert(context.nodes.every(n=>n.stops===1));
  assert.equal((await clock.drop(5,5,user)).accepted,false);assert.equal(clock.snapshot().attempts,48);await clock.close();
});
test('wrong target and outside reset suffix0 and early Close retires wrong audio before a correct zero-suffix match', async () => {
  for(const target of [null,4]){
    const {clock,context}=await fixture();clock.inspect(396);clock.beginDrag(0);clock.moveDrag(120,-180);
    assert((await clock.drop(0,target,user)).accepted);assert.equal(clock.snapshot().operation,'wrong');assert.equal(clock.snapshot().picture.interaction.drag,null);
    assert.equal(clock.snapshot().solvedCount,0);assert.equal((await clock.drop(0,0,user)).accepted,false);
    near(context.nodes[0].starts[0][1],1673/22050+1/12);context.currentTime=.1;assert(clock.closeWrong().accepted);assert.equal(context.nodes[0].stops,1);
    assert((await clock.drop(0,0,user)).accepted);assert.deepEqual(clock.snapshot().picture.interaction.solvedIndices,[0]);await clock.close();
  }
});
test('wrong popup pause and resume preserve solved state and its15 hold until explicit Close', async () => {
  const {clock,context}=await fixture();clock.inspect(396);await clock.drop(4,4,user);context.currentTime=18/12;clock.tick();await clock.drop(8,0,user);
  const t=context.currentTime;context.currentTime=t+.4;clock.pause();assert.equal(clock.snapshot().picture.interaction.wrongFrame,6);
  context.currentTime=100;await clock.play(user);assert.equal(clock.snapshot().picture.interaction.wrongFrame,6);assert.deepEqual(clock.snapshot().picture.interaction.solvedIndices,[4]);
  context.currentTime=102;assert.equal(clock.snapshot().phase,'wrong-wait');assert.equal(clock.snapshot().picture.interaction.wrongFrame,15);
  const n=context.nodes.length;clock.pause();await clock.play(user);assert.equal(context.nodes.length,n);assert(clock.closeWrong().accepted);assert.equal(clock.closeWrong().accepted,false);await clock.close();
});
test('each of five correct pairs locks through its coach and cannot be counted twice', async () => {
  for(let i=0;i<5;i++){
    const {clock,context}=await fixture();clock.inspect(396);assert((await clock.drop(i,i,user)).accepted);assert.deepEqual(clock.snapshot().picture.interaction.solvedIndices,[i]);
    assert.equal(clock.snapshot().picture.interaction.coachFrame,2);assert.equal(clock.select(12).accepted,false);
    near(context.nodes[0].starts[0][1],1673/22050);near(context.nodes[0].starts[0][2],(34560-1673)/22050);
    context.currentTime=18/12-.001;assert.equal(clock.snapshot().picture.interaction.coachFrame,19);context.currentTime=18/12;assert.equal(clock.snapshot().phase,'question');
    assert.equal((await clock.drop(i,i,user)).accepted,false);assert.equal(clock.snapshot().attempts,1);await clock.close();
  }
});
test('five pairs in either order schedule silent final feedback then397..437 and cap narration at actual786816 EOF', async () => {
  for(const order of [[0,1,2,3,4],[4,3,2,1,0]]){
    const {clock,context}=await fixture();await clock.play(user);context.currentTime=395/12;assert.equal(clock.snapshot().phase,'question');
    for(const i of order){assert((await clock.drop(i,i,user)).accepted);if(clock.snapshot().solvedCount<5){context.currentTime+=18/12;assert.equal(clock.snapshot().phase,'question');}}
    const t=context.currentTime,coach=context.nodes.at(-2)!,outro=context.nodes.at(-1)!;assert.equal(clock.snapshot().operation,'final');assert.equal(clock.snapshot().sourceQuizActive,true);
    near(coach.starts[0][0],t);near(outro.starts[0][0],t+41/12);near(outro.starts[0][1],714623/22050);near((outro.starts[0][1]+outro.starts[0][2])*22050,786816);
    context.currentTime=t+18/12;assert.equal(clock.snapshot().picture.interaction.correctFrame,2);assert.equal(clock.snapshot().audioDomain,null);
    context.currentTime=t+41/12-.001;assert.equal(clock.snapshot().picture.interaction.correctFrame,24);context.currentTime=t+41/12;
    assert.equal(clock.snapshot().picture.mainFrame,397);assert.equal(clock.snapshot().sourceQuizActive,false);assert.equal(clock.snapshot().audioDomain,'sprite-327');
    context.currentTime=t+81/12-.001;assert.equal(clock.snapshot().audioDomain,null);assert.equal(clock.snapshot().picture.mainFrame,436);
    context.currentTime=t+81/12;assert.equal(clock.snapshot().phase,'ended');assert.equal(clock.snapshot().picture.mainFrame,437);
    assert.equal(clock.snapshot().solvedCount,5);assert.equal(clock.snapshot().attempts,5);assert.equal(clock.snapshot().inspectionMode,false);assert.equal(clock.snapshot().lessonCompleted,false);await clock.close();
  }
});
test('pause in final feedback cancels pre-scheduled narration and Replay clears all13 identities', async () => {
  const {clock,context}=await fixture();clock.inspect(396);for(let i=0;i<5;i++){await clock.drop(i,i,user);if(i<4){context.currentTime+=18/12;clock.tick();}}
  const t=context.currentTime;context.currentTime=t+2;clock.pause();assert.equal(clock.snapshot().picture.interaction.correctFrame,8);assert(context.nodes.every(n=>n.stops===1));
  context.currentTime=100;await clock.play(user);near(context.nodes.at(-1)!.starts[0][0],100+41/12-2);near(context.nodes.at(-1)!.starts[0][1],714623/22050);
  clock.replay();assert(context.nodes.every(n=>n.stops===1));assert.equal(clock.snapshot().solvedCount,0);assert.equal(clock.snapshot().attempts,0);assert.equal(clock.snapshot().picture.mainFrame,1);
  clock.inspect(396);for(let i=0;i<13;i++)assert(clock.select(i).accepted);await clock.close();
});
test('Help exists only396 and closing preserves selected suffix0 and the solved numeric zero answer', async () => {
  const {clock,context}=await fixture();await clock.play(user);context.currentTime=300/12;assert.equal(clock.openHelp().accepted,false);
  context.currentTime=395/12;clock.tick();await clock.drop(4,4,user);context.currentTime+=18/12;clock.tick();assert(clock.select(0).accepted);
  assert(clock.openHelp().accepted);assert.equal((await clock.drop(0,0,user)).accepted,false);assert.equal((await clock.play(user)).accepted,false);
  const n=context.nodes.length;await clock.closeHelp(user);assert.equal(context.nodes.length,n);assert.deepEqual(clock.snapshot().picture.interaction.solvedIndices,[4]);assert.equal(clock.snapshot().picture.interaction.selectedIndex,0);
  assert((await clock.drop(0,0,user)).accepted);assert.deepEqual(clock.snapshot().picture.interaction.solvedIndices,[0,4]);await clock.close();
});
test('fractional pause resumes continuous native PCM without changing source declaration error or replaying latency', async () => {
  const {clock,context}=await fixture();await clock.play(user);context.currentTime=17.125;clock.pause();assert.equal(context.nodes[0].stops,1);
  context.currentTime=100;await clock.play(user);const start=context.nodes.at(-1)!.starts[0];near(start[1],(1673+(17.125-8/12)*22050)/22050);near((start[1]+start[2])*22050,712785.5);
  context.currentTime=100.25;context.state='suspended';context.dispatchEvent(new Event('statechange'));assert.equal(clock.snapshot().phase,'paused');assert(context.nodes.every(n=>n.stops===1));await clock.close();
});
test('inspection, reduced motion and a cancelled pending native resume cannot fabricate five correct pairs', async () => {
  const {clock,context}=await fixture();assert.equal((await clock.play({activation:'automatic',reducedMotion:true})).accepted,false);
  clock.inspect(437);assert.equal(clock.snapshot().phase,'ended');assert.equal(clock.snapshot().allCorrect,false);assert.equal(clock.snapshot().inspectionMode,true);
  clock.replay();let finish!:()=>void;context.resumeWait=new Promise<void>(r=>{finish=r;});const pending=clock.play(user);clock.replay();finish();assert.equal((await pending).accepted,false);assert.equal(context.nodes.length,0);await clock.close();
});
test('declared787392 samples cannot replace measured786816 in the exact source plan', () => {
  const changed={...plan,clips:plan.clips.map(c=>c.frameDomain==='sprite-327'?{...c,decoder:{...c.decoder,decodedSamples:787392}}:c)};
  assert.throws(()=>new P029SourceClockV1(changed,{commitPicture:()=>true}),/P029_SOURCE_CLIP_MISMATCH/);
});
test('mutated source bytes and full decoded PCM fail before native playback', async () => {
  const context=new Context(),clock=new P029SourceClockV1(plan,{createContext:()=>context as unknown as AudioContext,commitPicture:()=>true});const p=payloads();p.set('sprite-318',new Uint8Array([0]).buffer);
  assert.equal((await clock.prepare(p)).accepted,false);assert.equal(clock.snapshot().phase,'failed');assert.equal(context.nodes.length,0);await clock.close();
  const context2=new Context(),decode=context2.decodeAudioData.bind(context2);context2.decodeAudioData=async b=>{const r=await decode(b);return{...r,getChannelData:()=>{const a=r.getChannelData().slice();a[0]=1;return a;}};};
  const clock2=new P029SourceClockV1(plan,{createContext:()=>context2 as unknown as AudioContext,commitPicture:()=>true});assert.equal((await clock2.prepare(payloads())).accepted,false);assert.equal(context2.state,'closed');assert.equal(context2.nodes.length,0);
});
