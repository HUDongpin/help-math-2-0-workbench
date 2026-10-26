import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import test from 'node:test';
import {P030SourceClockV1, type P030AudioPlan, type P030Picture} from '../src/nms-l01-p030-source-clock-v1';
import {PLAN, PRACTICE} from '../src/timelines/shared-nms002-l01-p030';

const hash = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
const raws = PLAN.clips.map((_, i) => Uint8Array.of(103 + i, 100 + i, 200 - i));
const pcms = PLAN.clips.map(c => new Float32Array(c.decoder.decodedSamples));
const plan: P030AudioPlan = {...PLAN, clips: PLAN.clips.map((c, i) => ({...c,
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
  const context = new Context(), pictures: P030Picture[] = [];
  const clock = new P030SourceClockV1(plan, {createContext: () => context as unknown as AudioContext,
    commitPicture: p => { pictures.push(p); return true; }});
  assert.equal(clock.snapshot().picture.mainFrame, 1);
  assert((await clock.prepare(payloads())).accepted); return {clock, context, pictures};
}
const assigned=(clock:P030SourceClockV1)=>clock.snapshot().picture.interaction.assignments;
const valueFor=(index:number)=>PRACTICE.choices.find(c=>c.sourceIndex===index)!.value;
test('15 source tokens retain duplicated1/4, seven distractors and authored negative row8',()=>{
  assert.deepEqual([...PRACTICE.choices].sort((a,b)=>a.sourceIndex-b.sourceIndex).map(c=>[c.sourceIndex,c.value,[...c.permittedTargets]]),[[1,2,[1]],[2,4,[2,4]],[3,0,[3]],[4,4,[2,4]],[5,6,[5]],[6,1,[6,7]],[7,1,[6,7]],[8,3,[8]],[9,-6,[]],[10,-5,[]],[11,-4,[]],[12,-3,[]],[13,-2,[]],[14,-1,[]],[15,5,[]]]);
  assert.deepEqual(PRACTICE.targets.map(t=>[t.targetIndex,t.givenValue,t.value]),[[1,2,2],[2,-4,4],[3,0,0],[4,4,4],[5,6,6],[6,1,1],[7,-1,1],[8,-3,3]]);
  assert.deepEqual(PRACTICE.choices.filter(c=>c.paired).map(c=>[c.sourceIndex,c.sourceCharacterId,c.frameCount]),[[6,69,2],[4,72,2],[2,79,2],[7,80,2]]);
  for(const value of [1,4])assert.equal(PRACTICE.choices.filter(c=>c.value===value&&c.copies===2).length,2);
  assert.deepEqual(PLAN.clips.map(c=>[c.frameDomain,c.decoder.decodedSamples]),[['sprite-113',811584],['sprite-108',27072],['sprite-112',34560]]);
  assert.equal(PRACTICE.help.hotspots.length,3);assert.equal(PRACTICE.wrong.hotspots.length,0);
});
test('continuous source9 audio caps at810173 samples and holds449 independently of delayed drawing',async()=>{
  const {clock,context}=await fixture();await clock.play(user);const s=context.nodes[0].starts[0];near(s[0],8/12);near(s[1],1673/22050);near(s[2],440/12);near((s[1]+s[2])*22050,810173);
  context.currentTime=448/12-.001;assert.equal(clock.snapshot().picture.mainFrame,448);context.currentTime=100;assert.equal(clock.snapshot().phase,'question');assert.equal(clock.snapshot().picture.mainFrame,449);assert.equal(clock.snapshot().audioDomain,null);
  assert(clock.snapshot().picture.interaction.inputEnabled);await clock.play(user);assert.equal(context.nodes.length,1);await clock.close();
});
test('all seven distractors remain wrong at eight rows and outside, without creating assignments',async()=>{
  const {clock,context}=await fixture();clock.inspect(449);let attempts=0;
  for(let source=9;source<=15;source++)for(const target of [null,1,2,3,4,5,6,7,8]){
    assert((await clock.drop(source,target,user)).accepted);attempts++;assert.equal(clock.snapshot().operation,'wrong');assert.equal(clock.snapshot().attempts,attempts);assert.deepEqual(assigned(clock),[]);assert(clock.closeWrong().accepted);
  }
  assert.equal(attempts,63);assert.equal(context.nodes.length,63);assert(context.nodes.every(n=>n.stops===1));await clock.close();
});
test('each singleton reveals its exact source row, including numeric0 at source3',async()=>{
  for(const source of [1,3,5,8]){
    const {clock,context}=await fixture();clock.inspect(449);assert((await clock.drop(source,source,user)).accepted);assert.deepEqual(assigned(clock),[{sourceIndex:source,targetIndex:source}]);
    assert.equal(clock.snapshot().picture.interaction.coachFrame,2);assert.equal(clock.select(15).accepted,false);context.currentTime=18/12;assert.equal(clock.snapshot().phase,'question');
    assert.equal((await clock.drop(source,source,user)).accepted,false);assert.equal(clock.snapshot().attempts,1);await clock.close();
  }
  assert.equal(valueFor(3),0);
});
test('each paired source token accepts either authored same-value row while retaining its own identity',async()=>{
  for(const [source,targets]of [[2,[2,4]],[4,[2,4]],[6,[6,7]],[7,[6,7]]]as const)for(const target of targets){
    const {clock,context}=await fixture();clock.inspect(449);assert((await clock.drop(source,target,user)).accepted);assert.deepEqual(assigned(clock),[{sourceIndex:source,targetIndex:target}]);
    assert.equal(PRACTICE.targets.find(t=>t.targetIndex===target)!.value,valueFor(source));context.currentTime=18/12;assert.equal(clock.snapshot().phase,'question');assert.equal(clock.snapshot().solvedCount,1);await clock.close();
  }
});
test('assignment guard prevents reuse of a placed paired token and rejects another token dropped on its occupied row',async()=>{
  const {clock,context}=await fixture();clock.inspect(449);await clock.drop(2,4,user);context.currentTime=18/12;clock.tick();assert.equal(clock.select(2).accepted,false);assert.equal(clock.beginDrag(2).accepted,false);assert.equal((await clock.drop(2,2,user)).accepted,false);assert.equal(clock.snapshot().attempts,1);
  assert((await clock.drop(4,4,user)).accepted);assert.equal(clock.snapshot().operation,'wrong');assert.deepEqual(assigned(clock),[{sourceIndex:2,targetIndex:4}]);assert(clock.closeWrong().accepted);
  assert((await clock.drop(4,2,user)).accepted);assert.deepEqual(assigned(clock),[{sourceIndex:2,targetIndex:4},{sourceIndex:4,targetIndex:2}]);assert.equal(clock.snapshot().solvedCount,2);assert.equal(clock.snapshot().attempts,3);await clock.close();
});
test('drag cancellation and invalid coordinates preserve all assignments and do not count attempts',async()=>{
  const {clock,context}=await fixture();clock.inspect(449);await clock.drop(7,6,user);context.currentTime=18/12;clock.tick();assert(clock.beginDrag(6).accepted);assert(clock.moveDrag(-10.5,-190.25).accepted);
  assert.deepEqual(clock.snapshot().picture.interaction.drag,{index:6,x:-10.5,y:-190.25});assert.equal(clock.moveDrag(NaN,1).accepted,false);assert.equal(clock.moveDrag(10001,1).accepted,false);
  assert(clock.cancelDrag().accepted);assert.equal(clock.snapshot().picture.interaction.selectedIndex,null);assert.deepEqual(assigned(clock),[{sourceIndex:7,targetIndex:6}]);assert.equal(clock.snapshot().attempts,1);
  for(const source of [0,16,1.5,NaN])assert.equal(clock.select(source).accepted,false);await clock.close();
});
test('all four pair permutations fill8 distinct rows and finish450 without scheduling another main audio node',async()=>{
  for(const swapped4 of [false,true])for(const swapped1 of [false,true]){
    const {clock,context}=await fixture();await clock.play(user);context.currentTime=448/12;assert.equal(clock.snapshot().phase,'question');
    const pairs=[[2,swapped4?4:2],[7,swapped1?6:7],[4,swapped4?2:4],[6,swapped1?7:6],[1,1],[3,3],[5,5],[8,8]];
    for(const [source,target]of pairs){assert((await clock.drop(source,target,user)).accepted);if(clock.snapshot().solvedCount<8){context.currentTime+=18/12;assert.equal(clock.snapshot().phase,'question');}}
    assert.equal(new Set(assigned(clock).map(a=>a.targetIndex)).size,8);const t=context.currentTime,n=context.nodes.length;assert.equal(n,9);assert.equal(clock.snapshot().operation,'final');assert.equal(clock.snapshot().allCorrect,true);
    context.currentTime=t+18/12;assert.equal(clock.snapshot().picture.interaction.correctFrame,2);assert.equal(clock.snapshot().audioDomain,null);
    context.currentTime=t+41/12-.001;assert.equal(clock.snapshot().picture.mainFrame,449);assert.equal(clock.snapshot().picture.interaction.correctFrame,24);
    context.currentTime=t+41/12;assert.equal(clock.snapshot().phase,'ended');assert.equal(clock.snapshot().picture.mainFrame,450);assert.equal(clock.snapshot().attempts,8);assert.equal(context.nodes.length,n);
    assert.equal(context.nodes.filter(n=>(n.buffer as {length:number}).length===811584).length,1);assert.equal(clock.snapshot().lessonCompleted,false);assert.equal(clock.snapshot().audioAccepted,false);await clock.close();
  }
});
test('silent final pause resumes without extra audio and Replay restores all15 token identities',async()=>{
  const {clock,context}=await fixture();clock.inspect(449);for(let i=1;i<=8;i++){await clock.drop(i,i,user);if(i<8){context.currentTime+=18/12;clock.tick();}}
  const t=context.currentTime,n=context.nodes.length;context.currentTime=t+2;clock.pause();assert.equal(clock.snapshot().picture.interaction.correctFrame,8);assert(context.nodes.every(n=>n.stops===1));
  context.currentTime=100;await clock.play(user);assert.equal(context.nodes.length,n);assert.equal(clock.snapshot().audioDomain,null);context.currentTime=102;assert.equal(clock.snapshot().phase,'ended');
  clock.replay();assert.deepEqual(assigned(clock),[]);assert.equal(clock.snapshot().attempts,0);assert.equal(clock.snapshot().picture.mainFrame,1);clock.inspect(449);for(let i=1;i<=15;i++)assert(clock.select(i).accepted);await clock.close();
});
test('Help only449 preserves duplicate-token selection and completed assignments',async()=>{
  const {clock,context}=await fixture();await clock.play(user);context.currentTime=300/12;assert.equal(clock.openHelp().accepted,false);context.currentTime=448/12;clock.tick();await clock.drop(2,4,user);context.currentTime+=18/12;clock.tick();clock.select(4);
  assert(clock.openHelp().accepted);assert.equal((await clock.drop(4,2,user)).accepted,false);const n=context.nodes.length;await clock.closeHelp(user);assert.equal(context.nodes.length,n);assert.equal(clock.snapshot().picture.interaction.selectedIndex,4);assert.deepEqual(assigned(clock),[{sourceIndex:2,targetIndex:4}]);await clock.close();
});
test('wrong pause/resume retains completed row state and holds15 until Close',async()=>{
  const {clock,context}=await fixture();clock.inspect(449);await clock.drop(7,7,user);context.currentTime=18/12;clock.tick();await clock.drop(6,null,user);const t=context.currentTime;context.currentTime=t+.4;clock.pause();assert.equal(clock.snapshot().picture.interaction.wrongFrame,6);
  context.currentTime=100;await clock.play(user);context.currentTime=102;assert.equal(clock.snapshot().phase,'wrong-wait');assert.equal(clock.snapshot().picture.interaction.wrongFrame,15);const n=context.nodes.length;clock.pause();await clock.play(user);assert.equal(context.nodes.length,n);assert(clock.closeWrong().accepted);assert.deepEqual(assigned(clock),[{sourceIndex:7,targetIndex:7}]);await clock.close();
});
test('fractional native pause uses measured source offset and context interruption retires nodes',async()=>{
  const {clock,context}=await fixture();await clock.play(user);context.currentTime=7.125;clock.pause();context.currentTime=100;await clock.play(user);const start=context.nodes.at(-1)!.starts[0];near(start[1],(1673+(7.125-8/12)*22050)/22050);near((start[1]+start[2])*22050,810173);
  context.state='suspended';context.dispatchEvent(new Event('statechange'));assert.equal(clock.snapshot().phase,'paused');assert(context.nodes.every(n=>n.stops===1));await clock.close();
});
test('inspection, reduced motion and pending resume cancellation never fabricate8 filled rows',async()=>{
  const {clock,context}=await fixture();assert.equal((await clock.play({activation:'automatic',reducedMotion:true})).accepted,false);clock.inspect(450);assert.equal(clock.snapshot().phase,'ended');assert.equal(clock.snapshot().allCorrect,false);assert.equal(clock.snapshot().inspectionMode,true);clock.replay();
  let finish!:()=>void;context.resumeWait=new Promise<void>(r=>{finish=r;});const pending=clock.play(user);clock.replay();finish();assert.equal((await pending).accepted,false);assert.equal(context.nodes.length,0);await clock.close();
});
test('mutated source bytes and full decoded PCM fail before native playback',async()=>{
  const context=new Context(),clock=new P030SourceClockV1(plan,{createContext:()=>context as unknown as AudioContext,commitPicture:()=>true});const p=payloads();p.set('sprite-108',new Uint8Array([0]).buffer);assert.equal((await clock.prepare(p)).accepted,false);assert.equal(context.nodes.length,0);await clock.close();
  const context2=new Context(),decode=context2.decodeAudioData.bind(context2);context2.decodeAudioData=async b=>{const r=await decode(b);return{...r,getChannelData:()=>{const a=r.getChannelData().slice();a[0]=1;return a;}};};const c2=new P030SourceClockV1(plan,{createContext:()=>context2 as unknown as AudioContext,commitPicture:()=>true});assert.equal((await c2.prepare(payloads())).accepted,false);assert.equal(context2.state,'closed');assert.equal(context2.nodes.length,0);
});
