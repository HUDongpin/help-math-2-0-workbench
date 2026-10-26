import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import test from 'node:test';
import {P027SourceClockV1, type P027AudioPlan, type P027Picture} from '../src/nms-l01-p027-source-clock-v1';
import {PLAN, PRACTICE} from '../src/timelines/shared-nms002-l01-p027';

const hash = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
const raws = PLAN.clips.map((_, i) => Uint8Array.of(335 + i, 100 + i, 200 - i));
const pcms = PLAN.clips.map(c => new Float32Array(c.decoder.decodedSamples));
const plan: P027AudioPlan = {...PLAN, clips: PLAN.clips.map((c, i) => ({...c,
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
  const context = new Context(), pictures: P027Picture[] = [];
  const clock = new P027SourceClockV1(plan, {createContext: () => context as unknown as AudioContext,
    commitPicture: p => { pictures.push(p); return true; }});
  assert.equal(clock.snapshot().picture.mainFrame, 1);
  assert((await clock.prepare(payloads())).accepted); return {clock, context, pictures};
}
test('four terms map to actual source target rows and eight glossary definitions', () => {
  assert.deepEqual(PRACTICE.choices.map(c => [c.sourceIndex,c.labels.en,c.sourceCharacterId,c.target.sourceCharacterId,c.target.row]), [
    [1,'opposite integers',93,92,4],[2,'division',94,91,3],[3,'integer',95,89,1],[4,'absolute value',96,90,2],
  ]);
  assert.deepEqual([...PRACTICE.choices].sort((a,b)=>a.target.row-b.target.row).map(c=>c.sourceIndex),[3,4,2,1]);
  assert.deepEqual(PRACTICE.pictures.map(p=>p.sourceCharacterId),[98,100,103,106]);
  assert.deepEqual(PLAN.clips.map(c=>c.frameDomain),['sprite-344','sprite-335','sprite-343']);
  assert.equal(PRACTICE.wrong.text,'Try Again!'); assert.equal(PRACTICE.correct.text,'Correct!!!');
  assert.deepEqual(PRACTICE.primaryControls.map(c=>c.entryId),['set','natural-number','counting-numbers','distance','number-line','group','integers','direction']);
  assert.equal(PRACTICE.glossary.length,8); assert.equal('help' in PRACTICE,false);
  assert.equal(PRACTICE.pictures[1].labels.en,'|−7| = 7');
  assert(PRACTICE.pictures[0].expandedBounds.width>PRACTICE.pictures[0].bounds.width);
  assert(PRACTICE.pictures[2].expandedBounds.width>PRACTICE.pictures[2].bounds.width);
});
test('intro uses native finite audio9..330 and holds question even when visual ticks are late', async () => {
  const {clock,context}=await fixture(); await clock.play(user);
  near(context.nodes[0].starts[0][0],8/12); near(context.nodes[0].starts[0][1],1673/22050); near(context.nodes[0].starts[0][2],321/12);
  context.currentTime=329/12-.001; assert.equal(clock.snapshot().picture.mainFrame,329);
  context.currentTime=100; assert.equal(clock.snapshot().phase,'question'); assert.equal(clock.snapshot().picture.mainFrame,330);
  assert.equal(clock.snapshot().audioDomain,null); assert(clock.snapshot().picture.interaction.inputEnabled);
  await clock.play(user); assert.equal(context.nodes.length,1); await clock.close();
});
test('source pointer selection, dragging, cancellation and invalid coordinates preserve count', async () => {
  const {clock,context}=await fixture(); clock.inspect(330);
  assert(clock.select(3).accepted); assert.equal(clock.snapshot().picture.interaction.selectedIndex,3);
  assert(clock.beginDrag(4).accepted); assert(clock.moveDrag(-33.25,-322.5).accepted);
  assert.deepEqual(clock.snapshot().picture.interaction.drag,{index:4,x:-33.25,y:-322.5});
  assert.equal(clock.moveDrag(NaN,0).accepted,false); assert.equal(clock.moveDrag(0,10001).accepted,false);
  assert(clock.cancelDrag().accepted); assert.equal(clock.snapshot().picture.interaction.drag,null);
  assert.equal(clock.snapshot().attempts,0); assert.equal(clock.snapshot().solvedCount,0); assert.equal(context.nodes.length,0);
  assert.equal(clock.select(0).accepted,false); assert.equal(clock.select(9).accepted,false); await clock.close();
});
test('wrong target and outside release reset the piece and close can stop unfinished audio', async () => {
  for(const target of [null,4]){
    const {clock,context}=await fixture(); clock.inspect(330); clock.beginDrag(3); clock.moveDrag(120,-180);
    assert((await clock.drop(3,target,user)).accepted); assert.equal(clock.snapshot().operation,'wrong');
    assert.equal(clock.snapshot().picture.interaction.drag,null); assert.equal(clock.snapshot().solvedCount,0);
    assert.equal(clock.snapshot().picture.interaction.inputEnabled,false);
    assert.equal((await clock.drop(3,3,user)).accepted,false);
    near(context.nodes[0].starts[0][1],1673/22050+1/12); assert(context.nodes[0].starts[0][2]<=13/12);
    context.currentTime=.1; assert(clock.closeWrong().accepted); assert.equal(context.nodes[0].stops,1);
    assert.equal(clock.snapshot().phase,'question'); assert.equal(clock.snapshot().picture.interaction.wrongVisible,false);
    assert.equal(clock.snapshot().attempts,1); assert(clock.snapshot().picture.interaction.inputEnabled);
    assert((await clock.drop(3,3,user)).accepted); assert.equal(clock.snapshot().solvedCount,1); await clock.close();
  }
});
test('wrong feedback holds15 until Close, including pause and resume', async () => {
  const {clock,context}=await fixture(); clock.inspect(330); await clock.drop(1,2,user);
  context.currentTime=13/12; assert.equal(clock.snapshot().phase,'wrong-wait'); assert.equal(clock.snapshot().picture.interaction.wrongFrame,15);
  clock.pause(); context.currentTime=100; await clock.play(user); assert.equal(context.nodes.length,1);
  assert.equal(clock.snapshot().phase,'wrong-wait'); assert(clock.closeWrong().accepted); assert.equal(clock.closeWrong().accepted,false); await clock.close();
});
test('each correctly matched term locks input through its own coach and cannot be counted twice', async () => {
  for(let i=1;i<=4;i++){
    const {clock,context}=await fixture(); clock.inspect(330); assert((await clock.drop(i,i,user)).accepted);
    assert.deepEqual(clock.snapshot().picture.interaction.solvedIndices,[i]); assert.equal(clock.snapshot().picture.interaction.coachFrame,2);
    assert.equal(clock.select(i).accepted,false); assert.equal(clock.select(i===4?1:4).accepted,false);
    near(context.nodes[0].starts[0][1],1673/22050); near(context.nodes[0].starts[0][2],(34560-1673)/22050);
    context.currentTime=18/12-.001; assert.equal(clock.snapshot().phase,'playing'); assert.equal(clock.snapshot().picture.interaction.coachFrame,19);
    context.currentTime=18/12; assert.equal(clock.snapshot().phase,'question'); assert.equal(clock.snapshot().picture.interaction.coachFrame,1);
    assert.equal((await clock.drop(i,i,user)).accepted,false); assert.equal(clock.snapshot().attempts,1); await clock.close();
  }
});
test('all four in normal or reverse order enter silent final feedback then main331..357', async () => {
  for(const order of [[1,2,3,4],[4,3,2,1]]){
    const {clock,context}=await fixture(); await clock.play(user); context.currentTime=329/12; assert.equal(clock.snapshot().phase,'question');
    for(const i of order){assert((await clock.drop(i,i,user)).accepted); if(clock.snapshot().solvedCount<4){context.currentTime+=18/12;assert.equal(clock.snapshot().phase,'question');}}
    const t=context.currentTime, coach=context.nodes.at(-2)!,outro=context.nodes.at(-1)!;
    assert.equal(clock.snapshot().operation,'final'); assert.equal(clock.snapshot().sourceQuizActive,true);
    near(coach.starts[0][0],t); near(outro.starts[0][0],t+41/12); near(outro.starts[0][1],(1673+322*22050/12)/22050);
    context.currentTime=t+18/12; assert.equal(clock.snapshot().picture.interaction.correctFrame,2);
    assert.equal(clock.snapshot().picture.interaction.coachFrame,1); assert.equal(clock.snapshot().audioDomain,null);
    context.currentTime=t+41/12-.001; assert.equal(clock.snapshot().picture.interaction.correctFrame,24);
    context.currentTime=t+41/12; assert.equal(clock.snapshot().picture.mainFrame,331); assert.equal(clock.snapshot().sourceQuizActive,false);
    assert.equal(clock.snapshot().audioDomain,'sprite-344'); context.currentTime=t+67/12;
    assert.equal(clock.snapshot().phase,'ended'); assert.equal(clock.snapshot().picture.mainFrame,357);
    assert.equal(clock.snapshot().solvedCount,4); assert.equal(clock.snapshot().attempts,4); assert.equal(clock.snapshot().inspectionMode,false);
    assert.equal(clock.snapshot().audioAccepted,false); assert.equal(clock.snapshot().lessonCompleted,false); await clock.close();
  }
});
test('pause during final feedback cancels future narration; resume retains silence and replay resets all four', async () => {
  const {clock,context}=await fixture(); clock.inspect(330);
  for(let i=1;i<=4;i++){await clock.drop(i,i,user);if(i<4){context.currentTime+=18/12;clock.tick();}}
  const t=context.currentTime; context.currentTime=t+2; clock.pause(); assert.equal(clock.snapshot().picture.interaction.correctFrame,8);
  assert(context.nodes.every(n=>n.stops===1)); context.currentTime=100; await clock.play(user);
  near(context.nodes.at(-1)!.starts[0][0],100+41/12-2); assert.equal(clock.snapshot().audioDomain,null);
  clock.replay(); assert(context.nodes.every(n=>n.stops===1)); assert.equal(clock.snapshot().solvedCount,0);
  assert.equal(clock.snapshot().attempts,0); assert.equal(clock.snapshot().picture.mainFrame,1); assert.equal(clock.snapshot().inspectionMode,false);
  assert.equal(clock.snapshot().picture.interaction.correctFrame,1); await clock.close();
});
test('four pictures enlarge independently without changing audio, matching count or selected term', async () => {
  const {clock,context}=await fixture();
  assert.equal(clock.setPictureExpanded(1,true).accepted,false);
  clock.inspect(330); clock.select(4);
  for(let i=1;i<=4;i++)assert(clock.setPictureExpanded(i,true).accepted);
  assert.deepEqual(clock.snapshot().picture.interaction.expandedPictures,[1,2,3,4]);
  assert.equal(clock.snapshot().picture.interaction.selectedIndex,4); assert.equal(clock.snapshot().attempts,0);
  assert.equal(context.nodes.length,0); assert(clock.setPictureExpanded(2,false).accepted);
  assert.deepEqual(clock.snapshot().picture.interaction.expandedPictures,[1,3,4]);
  assert.equal(clock.setPictureExpanded(0,true).accepted,false);assert.equal(clock.setPictureExpanded(5,true).accepted,false);
  await clock.drop(4,4,user); assert(clock.setPictureExpanded(3,false).accepted);
  assert.equal(context.nodes.length,1); clock.pause();assert.deepEqual(clock.snapshot().picture.interaction.expandedPictures,[1,4]);
  clock.replay();assert.deepEqual(clock.snapshot().picture.interaction.expandedPictures,[]);
  clock.inspect(357);assert(clock.setPictureExpanded(1,true).accepted);assert.equal(clock.snapshot().allCorrect,false);
  clock.inspect(330);assert.deepEqual(clock.snapshot().picture.interaction.expandedPictures,[]);await clock.close();
});
test('fractional main pause retains sample offset; context suspension cancels pending native nodes', async () => {
  const {clock,context}=await fixture();await clock.play(user);context.currentTime=10.125;clock.pause();
  near(clock.snapshot().operationSeconds,10.125);assert(context.nodes.every(n=>n.stops===1));
  context.currentTime=100;await clock.play(user);
  near(context.nodes.at(-1)!.starts[0][1],(1673+(10.125-8/12)*22050)/22050);
  context.currentTime=100.25;context.state='suspended';context.dispatchEvent(new Event('statechange'));
  assert.equal(clock.snapshot().phase,'paused');assert(context.nodes.every(n=>n.stops===1));
  assert.equal(clock.snapshot().audioDomain,null);assert(clock.setVolume(0).accepted);
  await clock.close();assert.equal(clock.snapshot().phase,'closed');
});
test('inspection, reduced motion, replay and pending resume do not fabricate completed practice', async () => {
  const {clock,context}=await fixture(); assert.equal((await clock.play({activation:'automatic',reducedMotion:true})).accepted,false);
  clock.inspect(357); assert.equal(clock.snapshot().phase,'ended'); assert.equal(clock.snapshot().allCorrect,false); assert.equal(clock.snapshot().inspectionMode,true);
  clock.replay(); let finish!:()=>void; context.resumeWait=new Promise<void>(r=>{finish=r;}); const pending=clock.play(user);
  clock.replay(); finish(); assert.equal((await pending).accepted,false); assert.equal(context.nodes.length,0);
  assert.equal(clock.snapshot().picture.mainFrame,1); await clock.close();
});
test('mutated source bytes and mutated decoded PCM fail before any source node can play', async () => {
  const context=new Context(),clock=new P027SourceClockV1(plan,{createContext:()=>context as unknown as AudioContext,commitPicture:()=>true});
  const p=payloads();p.set('sprite-335',new Uint8Array([0]).buffer);assert.equal((await clock.prepare(p)).accepted,false);
  assert.equal(clock.snapshot().phase,'failed');assert.equal(context.nodes.length,0);await clock.close();
  const context2=new Context(); const original=context2.decodeAudioData.bind(context2);context2.decodeAudioData=async b=>{const r=await original(b);return{...r,getChannelData:()=>{const a=r.getChannelData().slice();a[0]=1;return a;}};};
  const clock2=new P027SourceClockV1(plan,{createContext:()=>context2 as unknown as AudioContext,commitPicture:()=>true});
  assert.equal((await clock2.prepare(payloads())).accepted,false);assert.equal(context2.state,'closed');assert.equal(context2.nodes.length,0);
});
