import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import test from 'node:test';
import {P037SourceClockV1, type P037AudioPlan, type P037Picture} from '../src/nms-l01-p037-source-clock-v1';
import {PLAN, PRACTICE} from '../src/timelines/shared-nms002-l01-p037';

const hash = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
const raws = PLAN.clips.map((_, i) => Uint8Array.of(103 + i, 100 + i, 200 - i));
const pcms = PLAN.clips.map(c => new Float32Array(c.decoder.decodedSamples));
const plan: P037AudioPlan = {...PLAN, clips: PLAN.clips.map((c, i) => ({...c,
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
  const context = new Context(), pictures: P037Picture[] = [];
  const clock = new P037SourceClockV1(plan, {createContext: () => context as unknown as AudioContext,
    commitPicture: p => { pictures.push(p); return true; }});
  assert.equal(clock.snapshot().picture.mainFrame, 1);
  assert((await clock.prepare(payloads())).accepted); return {clock, context, pictures};
}
const answers=[8,-2,28,25,40,47,45,54,43,64,71,78,74,80];
async function begin() { const f=await fixture();await f.clock.play(user);f.context.currentTime=81/12;assert(f.clock.skipIntro().accepted);assert(f.clock.startGame().accepted);return f; }
async function first13(f: Awaited<ReturnType<typeof begin>>) {
 for(let i=0;i<13;i++){assert((await f.clock.answer(answers[i]+21,user)).accepted);f.context.currentTime+=18/12;assert.equal(f.clock.snapshot().solvedCount,i+1);assert(f.clock.nextPlay().accepted);}
}
test('source14plays,101sites,threeexclusive masks and4device fields remain exact',()=>{
 assert.deepEqual(PRACTICE.rows.map(r=>r.answer),answers);assert.deepEqual(PRACTICE.rows.map(r=>r.delta),[8,-10,30,-3,15,7,-2,9,-11,21,7,7,-4,6]);assert(PRACTICE.rows.every(r=>r.start+r.delta===r.answer&&r.correctClickIndex===r.answer+21));
 assert.equal(PRACTICE.clickSites.length,101);assert.deepEqual(PRACTICE.clickSites.map(p=>p.lineNumber),Array.from({length:101},(_,i)=>i-20));assert.equal(PRACTICE.clipMasks.length,3);assert.equal(PRACTICE.deviceFields.length,4);
 assert.deepEqual(PLAN.clips.map(c=>[c.frameDomain,c.decoder.decodedSamples]),[['sprite-636',1100160],['sprite-569',27072],['sprite-635',194112]]);
});
test('intro begins atsource2 and stops595 at1091310.5native samples',async()=>{
 const {clock,context}=await fixture();await clock.play(user);const s=context.nodes[0].starts[0];near(s[0],1/12);near(s[1],1673/22050);near(s[2],593/12);near((s[1]+s[2])*22050,1091310.5);
 assert.equal(clock.startGame().accepted,false);assert.equal(clock.skipIntro().accepted,false);context.currentTime=594/12-.001;assert.equal(clock.snapshot().picture.mainFrame,594);context.currentTime=100;assert.equal(clock.snapshot().phase,'instructions');assert.equal(clock.snapshot().picture.mainFrame,595);assert.equal(clock.snapshot().audioDomain,null);assert(clock.startGame().accepted);assert.equal(clock.snapshot().picture.mainFrame,596);assert.equal(context.nodes.length,1);await clock.close();
});
test('Skip becomes available at82 and retires intro before Start',async()=>{
 const {clock,context}=await fixture();await clock.play(user);context.currentTime=81/12-.001;assert.equal(clock.skipIntro().accepted,false);context.currentTime=81/12;assert(clock.skipIntro().accepted);assert.equal(context.nodes[0].stops,1);assert.equal(clock.snapshot().picture.mainFrame,595);assert(clock.startGame().accepted);assert.equal(clock.startGame().accepted,false);assert.equal(clock.nextPlay().accepted,false);await clock.close();
});
test('all1400incorrect choices are wrong across14plays without advancing or losing prior tableaux',async()=>{
 const f=await begin();let attempts=0;
 for(let round=0;round<14;round++){
  for(let click=1;click<=101;click++){if(click===answers[round]+21)continue;assert((await f.clock.answer(click,user)).accepted);attempts++;const s=f.clock.snapshot();assert.equal(s.operation,'wrong');assert.equal(s.solvedCount,round);assert.equal(s.picture.interaction.correctPicture,round);assert.equal(f.clock.nextPlay().accepted,false);assert(f.clock.closeWrong().accepted);}
  assert((await f.clock.answer(answers[round]+21,user)).accepted);attempts++;if(round<13){f.context.currentTime+=18/12;f.clock.tick();assert(f.clock.nextPlay().accepted);}
 }
 assert.equal(attempts,1414);assert.equal(f.clock.snapshot().attempts,1414);assert.equal(f.context.nodes.length,1403);await f.clock.close();
});
test('ordered play guard rejects Next and repeated correct until dummy20counts once',async()=>{
 const {clock,context}=await begin();const t=context.currentTime;assert((await clock.answer(29,user)).accepted);assert.equal(clock.snapshot().solvedCount,0);assert.equal(clock.snapshot().picture.interaction.correctPicture,1);assert.equal(clock.nextPlay().accepted,false);assert.equal((await clock.answer(29,user)).accepted,false);assert.equal(clock.snapshot().attempts,1);
 context.currentTime=t+18/12-.001;assert.equal(clock.nextPlay().accepted,false);assert.equal(clock.snapshot().solvedCount,0);context.currentTime=t+18/12;assert.equal(clock.snapshot().solvedCount,1);assert(clock.nextPlay().accepted);assert.equal(clock.nextPlay().accepted,false);assert.equal(clock.snapshot().picture.interaction.roundIndex,1);assert.equal(clock.snapshot().picture.interaction.correctPicture,1);context.currentTime+=100;assert.equal(clock.snapshot().solvedCount,1);await clock.close();
});
test('wrong natural15 resets1 while popup remains visible; Close preserves current play',async()=>{
 const {clock,context}=await begin();await clock.answer(1,user);const t=context.currentTime;context.currentTime=t+.4;assert.equal(clock.snapshot().picture.interaction.wrongFrame,6);clock.pause();assert.equal(clock.snapshot().picture.interaction.inputEnabled,false);context.currentTime=100;await clock.play(user);context.currentTime=102;assert.equal(clock.snapshot().phase,'wrong-wait');assert.equal(clock.snapshot().picture.interaction.wrongFrame,1);assert(clock.snapshot().picture.interaction.wrongVisible);const n=context.nodes.length;await clock.play(user);assert.equal(context.nodes.length,n);assert(clock.closeWrong().accepted);assert(clock.snapshot().picture.interaction.inputEnabled);assert.equal(clock.snapshot().picture.interaction.roundIndex,0);await clock.close();
});
test('source arrow bounces2..5 then resets1 while counter continues2..19',async()=>{
 const {clock,context}=await begin();const t=context.currentTime;await clock.answer(29,user);assert.equal(clock.snapshot().picture.interaction.arrowFrame,2);context.currentTime=t+3/12;assert.equal(clock.snapshot().picture.interaction.arrowFrame,5);context.currentTime=t+4/12;assert.equal(clock.snapshot().picture.interaction.arrowFrame,1);assert.equal(clock.snapshot().picture.interaction.counterFrame,6);context.currentTime=t+18/12;assert.equal(clock.snapshot().picture.interaction.counterFrame,1);assert.equal(clock.snapshot().phase,'next-wait');await clock.close();
});
test('final answer continues child635 pastmain601 with distinct native EOF bounds',async()=>{
 const f=await begin();await first13(f);const t=f.context.currentTime;await f.clock.answer(101,user);assert.equal(f.clock.snapshot().allCorrect,false);assert.equal(f.clock.nextPlay().accepted,false);assert.equal(f.context.nodes.length,3);const main=f.context.nodes[1].starts[0],child=f.context.nodes[2].starts[0];near(main[0],t+18/12);near(main[1]*22050,1094985.5);near((main[1]+main[2])*22050,1100160);near(child[0],t+24/12);near(child[1]*22050,1673);near((child[1]+child[2])*22050,194112);
 f.context.currentTime=t+18/12;assert.equal(f.clock.snapshot().picture.mainFrame,597);assert.equal(f.clock.snapshot().solvedCount,14);f.context.currentTime=t+19/12;assert.equal(f.clock.snapshot().picture.mainFrame,598);assert.equal(f.clock.snapshot().picture.interaction.endChildFrame,1);
 f.context.currentTime=t+22/12;assert.equal(f.clock.snapshot().picture.mainFrame,601);assert.equal(f.clock.snapshot().picture.interaction.endChildFrame,4);assert.equal(f.clock.snapshot().phase,'playing');f.context.currentTime=t+24/12;assert.equal(f.clock.snapshot().audioDomain,'sprite-635');f.context.currentTime=t+128/12;assert.equal(f.clock.snapshot().picture.interaction.endChildFrame,110);assert.equal(f.clock.snapshot().phase,'playing');f.context.currentTime=t+129/12;assert.equal(f.clock.snapshot().picture.interaction.endChildFrame,111);assert.equal(f.clock.snapshot().phase,'ended');assert.equal(f.clock.snapshot().picture.mainFrame,601);assert.equal(f.clock.snapshot().audioDomain,null);assert.equal(f.clock.snapshot().allCorrect,true);assert.equal(f.clock.snapshot().lessonCompleted,false);await f.clock.close();
});
test('pause during final silent counter retires BOTH future streams and resumes finite windows',async()=>{
 const f=await begin();await first13(f);const t=f.context.currentTime;await f.clock.answer(101,user);f.context.currentTime=t+.5;f.clock.pause();assert(f.context.nodes.every(n=>n.stops===1));assert.equal(f.clock.snapshot().solvedCount,13);f.context.currentTime=100;await f.clock.play(user);assert.equal(f.context.nodes.length,5);near(f.context.nodes[3].starts[0][0],101);near(f.context.nodes[4].starts[0][0],101.5);near((f.context.nodes[4].starts[0][1]+f.context.nodes[4].starts[0][2])*22050,194112);f.context.currentTime=110.25;assert.equal(f.clock.snapshot().phase,'ended');await f.clock.close();
});
test('pause aftermain601 resumes child alone and preserves its fractional native offset',async()=>{
 const f=await begin();await first13(f);const t=f.context.currentTime;await f.clock.answer(101,user);f.context.currentTime=t+4.125;f.clock.pause();assert.equal(f.clock.snapshot().picture.mainFrame,601);assert.equal(f.clock.snapshot().picture.interaction.endChildFrame,31);f.context.currentTime=100;await f.clock.play(user);assert.equal(f.context.nodes.length,4);const s=f.context.nodes.at(-1)!.starts[0];near(s[0],100);near(s[1]*22050,1673+(4.125-2)*22050);near((s[1]+s[2])*22050,194112);f.context.currentTime=107;assert.equal(f.clock.snapshot().phase,'ended');await f.clock.close();
});
test('pause gates answer,next,hover; source pointer cancellation via hover(null) adds no attempt',async()=>{
 const {clock,context}=await begin();for(const i of [0,102,1.5,NaN]){assert.equal(clock.hover(i).accepted,false);assert.equal((await clock.answer(i,user)).accepted,false);}assert(clock.hover(101).accepted);assert.equal(clock.snapshot().picture.interaction.hoverIndex,101);assert(clock.hover(null).accepted);assert.equal(clock.snapshot().attempts,0);clock.pause();assert.equal((await clock.answer(29,user)).accepted,false);assert.equal(clock.hover(29).accepted,false);await clock.play(user);await clock.answer(29,user);context.currentTime+=18/12;clock.tick();clock.pause();assert.equal(clock.nextPlay().accepted,false);await clock.play(user);assert(clock.nextPlay().accepted);await clock.close();
});
test('Replay resets14play state and cancels future ending nodes',async()=>{
 const f=await begin();await first13(f);await f.clock.answer(101,user);assert(f.clock.replay().accepted);assert(f.context.nodes.every(n=>n.stops===1));const s=f.clock.snapshot();assert.equal(s.picture.mainFrame,1);assert.equal(s.picture.interaction.roundIndex,0);assert.equal(s.picture.interaction.correctPicture,0);assert.equal(s.solvedCount,0);assert.equal(s.attempts,0);assert.equal(s.allCorrect,false);await f.clock.close();
});
test('main601 inspection does not imply completed child or14answers; reduced motion holds intro',async()=>{
 const {clock,context}=await fixture();assert.equal((await clock.play({activation:'automatic',reducedMotion:true})).accepted,false);assert(clock.inspect(601).accepted);assert.equal(clock.snapshot().phase,'paused');assert.equal(clock.snapshot().picture.interaction.endChildFrame,4);assert.equal(clock.snapshot().allCorrect,false);assert.equal(clock.snapshot().inspectionMode,true);assert.equal(clock.inspect(602).accepted,false);clock.replay();let finish!:()=>void;context.resumeWait=new Promise<void>(r=>{finish=r;});const pending=clock.play(user);clock.replay();finish();assert.equal((await pending).accepted,false);assert.equal(context.nodes.length,0);await clock.close();
});
test('context suspension gates controls and retires source nodes; close cancels pending playback',async()=>{
 const f=await begin();await f.clock.answer(1,user);f.context.currentTime+=.2;f.context.state='suspended';f.context.dispatchEvent(new Event('statechange'));assert.equal(f.clock.snapshot().phase,'paused');assert(f.context.nodes.every(n=>n.stops===1));assert.equal(f.clock.snapshot().picture.interaction.inputEnabled,false);await f.clock.close();assert.equal(f.clock.snapshot().phase,'closed');assert.equal(f.context.state,'closed');assert.equal((await f.clock.play(user)).accepted,false);
});
test('source payload and full PCM mutation fail before any native source starts',async()=>{
 const context=new Context(),clock=new P037SourceClockV1(plan,{createContext:()=>context as unknown as AudioContext,commitPicture:()=>true});const p=payloads();p.set('sprite-569',new Uint8Array([0]).buffer);assert.equal((await clock.prepare(p)).accepted,false);assert.equal(context.nodes.length,0);await clock.close();
 const c=new Context(),decode=c.decodeAudioData.bind(c);c.decodeAudioData=async b=>{const r=await decode(b);return {...r,getChannelData:()=>{const x=r.getChannelData().slice();x[0]=1;return x;}};};const x=new P037SourceClockV1(plan,{createContext:()=>c as unknown as AudioContext,commitPicture:()=>true});assert.equal((await x.prepare(payloads())).accepted,false);assert.equal(c.state,'closed');assert.equal(c.nodes.length,0);
});
test('changedsource main/child bounds are rejected',()=>{
 for(const changed of [{mainFrameCount:600},{endChildFrameCount:110},{endChildFirstMainFrame:601},{mainAudioFirstFrame:9}])assert.throws(()=>new P037SourceClockV1({...plan,...changed}as P037AudioPlan,{commitPicture:()=>true}),/PLAN_MISMATCH/);
});
