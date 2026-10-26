import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import test from 'node:test';
import {P036SourceClockV1, type P036AudioPlan, type P036Picture} from '../src/nms-l01-p036-source-clock-v1';
import {PLAN, PRACTICE} from '../src/timelines/shared-nms002-l01-p036';

const hash = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
const raws = PLAN.clips.map((_, i) => Uint8Array.of(103 + i, 100 + i, 200 - i));
const pcms = PLAN.clips.map(c => new Float32Array(c.decoder.decodedSamples));
const plan: P036AudioPlan = {...PLAN, clips: PLAN.clips.map((c, i) => ({...c,
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
  const context = new Context(), pictures: P036Picture[] = [];
  const clock = new P036SourceClockV1(plan, {createContext: () => context as unknown as AudioContext,
    commitPicture: p => { pictures.push(p); return true; }});
  assert.equal(clock.snapshot().picture.mainFrame, 1);
  assert((await clock.prepare(payloads())).accepted); return {clock, context, pictures};
}
const assigned=(clock:P036SourceClockV1)=>clock.snapshot().picture.interaction.assignments;
const valueFor=(index:number)=>PRACTICE.choices.find(c=>c.sourceIndex===index)!.value;
test('14 source token identities preserve two5s, six distractors and eight signed division rows',()=>{
  assert.deepEqual([...PRACTICE.choices].sort((a,b)=>a.sourceIndex-b.sourceIndex).map(c=>[c.sourceIndex,c.value,[...c.permittedTargets]]),[[1,5,[1,5]],[2,6,[2]],[3,-6,[3]],[4,-5,[4]],[5,5,[1,5]],[6,3,[6]],[7,1,[7]],[8,-4,[8]],[9,-3,[]],[10,-2,[]],[11,-1,[]],[12,0,[]],[13,2,[]],[14,4,[]]]);
  assert.deepEqual(PRACTICE.targets.map(t=>[t.left,t.right,t.value]),[[35,7,5],[36,6,6],[-36,6,-6],[-25,5,-5],[40,8,5],[-15,-5,3],[-2,-2,1],[24,-6,-4]]);
  assert.deepEqual(PRACTICE.choices.filter(c=>c.paired).map(c=>[c.sourceIndex,c.sourceCharacterId,c.frameCount,c.copies]),[[1,73,2,2],[5,74,2,2]]);
  assert.deepEqual(PLAN.clips.map(c=>[c.frameDomain,c.decoder.decodedSamples]),[['sprite-130',1232064],['sprite-129',27072],['sprite-104',34560]]);
  assert.equal(PLAN.mainFrameCount,679);assert.equal(PLAN.livePlaybackEndFrame,678);assert.equal(PRACTICE.help.hotspots.length,6);assert.equal(PRACTICE.wrong.hotspots.length,0);assert.equal(PRACTICE.glossary.length,9);assert.equal(PRACTICE.primaryControls.length,3);
});
test('continuous source9 audio caps1122548 samples at619 regardless of delayed drawing',async()=>{
  const {clock,context}=await fixture();await clock.play(user);const s=context.nodes[0].starts[0];near(s[0],8/12);near(s[1],1673/22050);near(s[2],610/12);near((s[1]+s[2])*22050,1122548);
  context.currentTime=618/12-.001;assert.equal(clock.snapshot().picture.mainFrame,618);context.currentTime=100;assert.equal(clock.snapshot().phase,'question');assert.equal(clock.snapshot().picture.mainFrame,619);assert.equal(clock.snapshot().audioDomain,null);
  assert(clock.snapshot().picture.interaction.inputEnabled);await clock.play(user);assert.equal(context.nodes.length,1);await clock.close();
});
test('all six distractors are wrong at every row and outside, including numeric0',async()=>{
  const {clock,context}=await fixture();clock.inspect(619);let attempts=0;
  for(let source=9;source<=14;source++)for(const target of [null,1,2,3,4,5,6,7,8]){assert((await clock.drop(source,target,user)).accepted);attempts++;assert.equal(clock.snapshot().operation,'wrong');assert.deepEqual(assigned(clock),[]);assert(clock.closeWrong().accepted);}
  assert.equal(valueFor(12),0);assert.equal(attempts,54);assert.equal(context.nodes.length,54);assert(context.nodes.every(n=>n.stops===1));await clock.close();
});
test('six singleton answers use their exact source row and cannot be reused after coach',async()=>{
  for(const source of [2,3,4,6,7,8]){const {clock,context}=await fixture();clock.inspect(619);assert((await clock.drop(source,source,user)).accepted);assert.deepEqual(assigned(clock),[{sourceIndex:source,targetIndex:source}]);assert.equal(clock.snapshot().picture.interaction.coachFrame,2);assert.equal(clock.select(14).accepted,false);context.currentTime=18/12;assert.equal(clock.snapshot().phase,'question');assert.equal((await clock.drop(source,source,user)).accepted,false);assert.equal(clock.snapshot().attempts,1);await clock.close();}
});
test('each of two5 tokens accepts row1 or5 and preserves its own identity',async()=>{
  for(const source of [1,5])for(const target of [1,5]){const {clock,context}=await fixture();clock.inspect(619);assert((await clock.drop(source,target,user)).accepted);assert.deepEqual(assigned(clock),[{sourceIndex:source,targetIndex:target}]);context.currentTime=18/12;assert.equal(clock.snapshot().phase,'question');assert.equal(clock.snapshot().solvedCount,1);await clock.close();}
});
test('distinct-row product guard rejects occupied targets and locks assigned source tokens',async()=>{
  const {clock,context}=await fixture();clock.inspect(619);await clock.drop(1,5,user);context.currentTime=18/12;clock.tick();assert.equal(clock.select(1).accepted,false);assert.equal(clock.beginDrag(1).accepted,false);assert.equal((await clock.drop(1,1,user)).accepted,false);assert.equal(clock.snapshot().attempts,1);
  assert((await clock.drop(5,5,user)).accepted);assert.equal(clock.snapshot().operation,'wrong');assert.deepEqual(assigned(clock),[{sourceIndex:1,targetIndex:5}]);clock.closeWrong();await clock.drop(5,1,user);assert.deepEqual(assigned(clock),[{sourceIndex:1,targetIndex:5},{sourceIndex:5,targetIndex:1}]);assert.equal(clock.snapshot().solvedCount,2);assert.equal(clock.snapshot().attempts,3);await clock.close();
});
test('pointer cancellation restores selection without recounting a filled row',async()=>{
  const {clock,context}=await fixture();clock.inspect(619);await clock.drop(1,5,user);context.currentTime=18/12;clock.tick();assert(clock.beginDrag(5).accepted);assert(clock.moveDrag(-10.5,-190.25).accepted);assert.deepEqual(clock.snapshot().picture.interaction.drag,{index:5,x:-10.5,y:-190.25});assert.equal(clock.moveDrag(NaN,1).accepted,false);assert.equal(clock.moveDrag(10001,1).accepted,false);clock.cancelDrag();assert.equal(clock.snapshot().picture.interaction.selectedIndex,null);assert.deepEqual(assigned(clock),[{sourceIndex:1,targetIndex:5}]);assert.equal(clock.snapshot().attempts,1);for(const i of [0,15,1.5,NaN])assert.equal(clock.select(i).accepted,false);await clock.close();
});
test('both5 permutations complete8 distinct rows with coach, silentcorrect and narrated620..678',async()=>{
  for(const swap of [false,true]){const {clock,context}=await fixture();await clock.play(user);context.currentTime=618/12;assert.equal(clock.snapshot().phase,'question');
    for(const [source,target]of [[1,swap?5:1],[5,swap?1:5],[2,2],[3,3],[4,4],[6,6],[7,7],[8,8]]){assert((await clock.drop(source,target,user)).accepted);if(clock.snapshot().solvedCount<8){context.currentTime+=18/12;assert.equal(clock.snapshot().phase,'question');}}
    const t=context.currentTime;assert.equal(context.nodes.length,10);assert.equal(clock.snapshot().operation,'final');assert.equal(clock.snapshot().allCorrect,true);const outro=context.nodes.at(-1)!.starts[0];near(outro[0],t+41/12);near(outro[1]*22050,1124385.5);near(outro[2],58/12);near((outro[1]+outro[2])*22050,1230960.5);
    context.currentTime=t+18/12;assert.equal(clock.snapshot().picture.interaction.correctFrame,2);assert.equal(clock.snapshot().audioDomain,null);context.currentTime=t+41/12-.001;assert.equal(clock.snapshot().picture.mainFrame,619);assert.equal(clock.snapshot().picture.interaction.correctFrame,24);
    context.currentTime=t+41/12;assert.equal(clock.snapshot().picture.mainFrame,620);assert.equal(clock.snapshot().phase,'playing');assert.equal(clock.snapshot().audioDomain,'sprite-130');context.currentTime=t+99/12;assert.equal(clock.snapshot().phase,'ended');assert.equal(clock.snapshot().picture.mainFrame,678);assert.equal(clock.snapshot().attempts,8);assert.equal(clock.snapshot().audioDomain,null);assert.equal(clock.inspect(679).accepted,false);assert.equal(clock.snapshot().lessonCompleted,false);assert.equal(clock.snapshot().audioAccepted,false);await clock.close();}
});
test('pause during silentcorrect cancels scheduledoutro and reschedules only its remaining window',async()=>{
  const {clock,context}=await fixture();clock.inspect(619);for(let i=1;i<=8;i++){await clock.drop(i,i,user);if(i<8){context.currentTime+=18/12;clock.tick();}}
  const t=context.currentTime,n=context.nodes.length;assert.equal(n,9);context.currentTime=t+2;clock.pause();assert.equal(clock.snapshot().picture.interaction.correctFrame,8);assert(context.nodes.every(n=>n.stops===1));
  context.currentTime=100;await clock.play(user);assert.equal(context.nodes.length,n+1);assert.equal(clock.snapshot().audioDomain,null);const start=context.nodes.at(-1)!.starts[0];near(start[0],100+17/12);near(start[1]*22050,1124385.5);near((start[1]+start[2])*22050,1230960.5);context.currentTime=102;assert.equal(clock.snapshot().audioDomain,'sprite-130');context.currentTime=107;assert.equal(clock.snapshot().phase,'ended');clock.replay();assert.deepEqual(assigned(clock),[]);assert.equal(clock.snapshot().attempts,0);assert.equal(clock.snapshot().picture.mainFrame,1);clock.inspect(619);for(let i=1;i<=14;i++)assert(clock.select(i).accepted);await clock.close();
});
test('Help only619 preserves paired selection and assignments',async()=>{
  const {clock,context}=await fixture();await clock.play(user);context.currentTime=300/12;assert.equal(clock.openHelp().accepted,false);context.currentTime=618/12;clock.tick();await clock.drop(1,5,user);context.currentTime+=18/12;clock.tick();clock.select(5);assert(clock.openHelp().accepted);assert.equal((await clock.drop(5,1,user)).accepted,false);const n=context.nodes.length;await clock.closeHelp(user);assert.equal(context.nodes.length,n);assert.equal(clock.snapshot().picture.interaction.selectedIndex,5);assert.deepEqual(assigned(clock),[{sourceIndex:1,targetIndex:5}]);await clock.close();
});
test('wrong pause/resume retains completed row state and holds15 until Close',async()=>{
  const {clock,context}=await fixture();clock.inspect(619);await clock.drop(7,7,user);context.currentTime=18/12;clock.tick();await clock.drop(6,null,user);const t=context.currentTime;context.currentTime=t+.4;clock.pause();assert.equal(clock.snapshot().picture.interaction.wrongFrame,6);
  context.currentTime=100;await clock.play(user);context.currentTime=102;assert.equal(clock.snapshot().phase,'wrong-wait');assert.equal(clock.snapshot().picture.interaction.wrongFrame,15);const n=context.nodes.length;clock.pause();await clock.play(user);assert.equal(context.nodes.length,n);assert(clock.closeWrong().accepted);assert.deepEqual(assigned(clock),[{sourceIndex:7,targetIndex:7}]);await clock.close();
});
test('fractional native pause uses measured source offset and context interruption retires nodes',async()=>{
  const {clock,context}=await fixture();await clock.play(user);context.currentTime=7.125;clock.pause();context.currentTime=100;await clock.play(user);const start=context.nodes.at(-1)!.starts[0];near(start[1],(1673+(7.125-8/12)*22050)/22050);near((start[1]+start[2])*22050,1122548);
  context.state='suspended';context.dispatchEvent(new Event('statechange'));assert.equal(clock.snapshot().phase,'paused');assert(context.nodes.every(n=>n.stops===1));await clock.close();
});
test('inspection, reduced motion and pending resume cancellation never fabricate8 filled rows',async()=>{
  const {clock,context}=await fixture();assert.equal((await clock.play({activation:'automatic',reducedMotion:true})).accepted,false);clock.inspect(678);assert.equal(clock.snapshot().phase,'ended');assert.equal(clock.snapshot().allCorrect,false);assert.equal(clock.snapshot().inspectionMode,true);clock.replay();
  let finish!:()=>void;context.resumeWait=new Promise<void>(r=>{finish=r;});const pending=clock.play(user);clock.replay();finish();assert.equal((await pending).accepted,false);assert.equal(context.nodes.length,0);await clock.close();
});
test('mutated source bytes and full decoded PCM fail before native playback',async()=>{
  const context=new Context(),clock=new P036SourceClockV1(plan,{createContext:()=>context as unknown as AudioContext,commitPicture:()=>true});const p=payloads();p.set('sprite-129',new Uint8Array([0]).buffer);assert.equal((await clock.prepare(p)).accepted,false);assert.equal(context.nodes.length,0);await clock.close();
  const context2=new Context(),decode=context2.decodeAudioData.bind(context2);context2.decodeAudioData=async b=>{const r=await decode(b);return{...r,getChannelData:()=>{const a=r.getChannelData().slice();a[0]=1;return a;}};};const c2=new P036SourceClockV1(plan,{createContext:()=>context2 as unknown as AudioContext,commitPicture:()=>true});assert.equal((await c2.prepare(payloads())).accepted,false);assert.equal(context2.state,'closed');assert.equal(context2.nodes.length,0);
});
test('live terminal679 or changed source length cannot enter a source clock',()=>{
 assert.throws(()=>new P036SourceClockV1({...plan,livePlaybackEndFrame:679}as unknown as P036AudioPlan,{commitPicture:()=>true}),/PLAN_MISMATCH/);assert.throws(()=>new P036SourceClockV1({...plan,mainFrameCount:678}as unknown as P036AudioPlan,{commitPicture:()=>true}),/PLAN_MISMATCH/);
});
