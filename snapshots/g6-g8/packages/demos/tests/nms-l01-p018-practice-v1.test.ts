import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import test from 'node:test';
import {P018SourceClockV1, type P018AudioPlan, type P018Picture} from '../src/nms-l01-p018-source-clock-v1';
import {PLAN, PRACTICE} from '../src/timelines/shared-nms002-l01-p018';

const hash = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
const raws = PLAN.clips.map((_, i) => Uint8Array.of(40 + i, 100 + i, 200 - i));
const pcms = PLAN.clips.map(c => new Float32Array(c.decoder.decodedSamples));
const plan: P018AudioPlan = {...PLAN, clips: PLAN.clips.map((c, i) => ({...c,
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
  const context = new Context(), pictures: P018Picture[] = [];
  const clock = new P018SourceClockV1(plan, PRACTICE.cards, {createContext: () => context as unknown as AudioContext,
    commitPicture: p => { pictures.push(p); return true; }});
  assert.equal(clock.snapshot().picture.mainFrame, 1);
  assert((await clock.prepare(payloads())).accepted); return {clock, context, pictures};
}

function permutations<T>(items:T[]):T[][]{return items.length?items.flatMap((v,i)=>permutations(items.filter((_,j)=>i!==j)).map(p=>[v,...p])):[[]];}
import {createP018Interaction,reduceP018Interaction,p018TargetAtPoint} from '../src/nms-l01-p018-interaction-v1';
const cards=PRACTICE.cards,correctCards=cards.filter(c=>c.targetId!==null);
test('source table signs and all120 correct orders preserve five exact absolute-value matches',()=>{
 assert.deepEqual(cards.map(c=>c.value),[-6,-5,-4,-2,0,2,4,5,6]);assert.deepEqual(PRACTICE.targets.map(t=>[t.integer,t.absoluteValue]),[[2,2],[-6,6],[5,5],[-4,4],[0,0]]);
 assert.equal(permutations([...correctCards]).length,120);
 for(const order of permutations([...correctCards])){let s=createP018Interaction(cards);for(const c of order){s=reduceP018Interaction(cards,s,{type:'select',cardId:c.id});s=reduceP018Interaction(cards,s,{type:'drop',targetId:c.targetId});assert.equal(s.result,'correct');assert(s.locked.includes(c.id));assert.equal(reduceP018Interaction(cards,s,{type:'select',cardId:c.id}),s);assert.equal(reduceP018Interaction(cards,s,{type:'drop',targetId:c.targetId}),s);}assert.equal(s.attempts,5);assert.equal(s.locked.length,5);const reset=reduceP018Interaction(cards,s,{type:'replay'});assert.equal(reset.epoch,1);assert.equal(reset.locked.length,0);for(const c of cards)assert.deepEqual(reset.positions[c.id],c.originTwips);}
});
test('every negative card rejects all5 rows and outside; unmatched positives reject and cancel does not count',()=>{
 for(const c of cards)for(const target of [...PRACTICE.targets.map(t=>t.id),null]){let s=createP018Interaction(cards);s=reduceP018Interaction(cards,s,{type:'select',cardId:c.id});s=reduceP018Interaction(cards,s,{type:'move',point:{x:1000,y:2000}});s=reduceP018Interaction(cards,s,{type:'drop',targetId:target});const yes=c.targetId!==null&&target===c.targetId;assert.equal(s.result,yes?'correct':'wrong');assert.equal(s.locked.length,yes?1:0);if(!yes)assert.deepEqual(s.positions[c.id],c.originTwips);}
 let s=createP018Interaction(cards);for(let i=0;i<12;i++){s=reduceP018Interaction(cards,s,{type:'select',cardId:'Scr_1'});s=reduceP018Interaction(cards,s,{type:'drop',targetId:null});}assert.equal(s.locked.length,0);assert.equal(s.attempts,12);
 s=reduceP018Interaction(cards,s,{type:'select',cardId:'Scr_7'});const before=s;s=reduceP018Interaction(cards,s,{type:'move',point:{x:NaN,y:0}});assert.equal(s,before);s=reduceP018Interaction(cards,s,{type:'cancel'});assert.equal(s.attempts,12);assert.equal(s.selected,null);
 for(const t of PRACTICE.targets)assert.equal(p018TargetAtPoint(cards,{x:t.bounds.x+t.bounds.width/2,y:t.bounds.y+t.bounds.height/2}),t.id);assert.equal(p018TargetAtPoint(cards,{x:0,y:0}),null);
});
test('main intro schedules both native source segments, retains the audible gap and holds445 before any late tick',async()=>{
 const{clock,context}=await fixture();await clock.play(user);assert.equal(context.nodes.length,2);const[a,b]=context.nodes.map(n=>n.starts[0]);near(a[0],8/12);near(a[1],1673/22050);near(a[2],(725184-1673)/22050);near(b[0],34);near(b[1],725420/22050);near(b[2],3);
 context.currentTime=33.6;assert.equal(clock.snapshot().audioNodePlaying,false);context.currentTime=34.25;assert.equal(clock.snapshot().audioDomain,'sprite-78');near(clock.snapshot().audioSample,725420+.25*22050);
 context.currentTime=36.999;assert.equal(clock.snapshot().picture.mainFrame,444);context.currentTime=100;assert.equal(clock.snapshot().phase,'question');assert.equal(clock.snapshot().picture.mainFrame,445);assert.equal(clock.snapshot().audioNodePlaying,false);assert(clock.snapshot().sourceQuizActive);assert.equal(context.nodes.length,2);await clock.close();
});
test('wrong popup plays measured sound, holds15, prevents other drops and retries without auto-fill',async()=>{
 const{clock,context}=await fixture();clock.inspect(445);clock.select('Scr_1');await clock.drop(null,user);assert.equal(clock.snapshot().picture.interaction.popup,'wrong');near(context.nodes[0].starts[0][1],1673/22050);
 context.currentTime=13/12;assert.equal(clock.snapshot().picture.interaction.feedbackFrame,15);assert(clock.snapshot().audioNodePlaying);context.currentTime=(27072-1673)/22050;assert.equal(clock.snapshot().phase,'wrong-wait');assert.equal(clock.select('Scr_5').accepted,false);assert.equal((await clock.drop('Mc_Tar_5',user)).accepted,false);assert(clock.closePopup().accepted);assert.equal(clock.closePopup().accepted,false);assert.equal(clock.snapshot().phase,'question');assert.equal(clock.snapshot().interaction.attempts,1);assert.equal(clock.snapshot().correctDrops,0);
 clock.select('Scr_2');await clock.drop('Mc_Tar_9',user);assert(clock.closePopup().accepted);assert.equal(clock.snapshot().interaction.attempts,2);assert.equal(clock.snapshot().correctDrops,0);assert(context.nodes.every(n=>n.stops===1));await clock.close();
});
test('fifth correct schedules coach77, reveal73 and finite main continuation before animation ticks',async()=>{
 const{clock,context}=await fixture();clock.inspect(445);for(const c of correctCards.slice(0,4)){clock.select(c.id);await clock.drop(c.targetId,user);context.currentTime+=1.5;assert.equal(clock.snapshot().phase,'question');}
 const last=correctCards[4],before=context.nodes.length,t0=context.currentTime;clock.select(last.id);await clock.drop(last.targetId,user);assert.equal(context.nodes.length,before+2);const[a,b]=context.nodes.slice(before).map(n=>n.starts[0]);near(a[0],t0);near(b[0],t0+41/12);near(b[1],791570/22050);near(b[2],47/12);
 context.currentTime=t0+1.5;assert.equal(clock.snapshot().picture.interaction.rightFrame,2);context.currentTime=t0+40/12;assert.equal(clock.snapshot().picture.interaction.rightFrame,24);context.currentTime=t0+41/12;assert.equal(clock.snapshot().picture.mainFrame,445);assert.equal(clock.snapshot().sourceQuizActive,false);assert.equal(clock.snapshot().audioDomain,'sprite-78');
 context.currentTime=t0+88/12;assert.equal(clock.snapshot().phase,'ended');assert.equal(clock.snapshot().picture.mainFrame,492);assert.equal(clock.snapshot().correctDrops,5);assert.equal(clock.snapshot().audioNodePlaying,false);assert.equal(clock.snapshot().lessonCompleted,false);near(879552-(791570+47/12*22050),1619.5);await clock.close();
});
test('pause during source gap retires the future run and resume preserves its remaining delay',async()=>{
 const{clock,context}=await fixture();await clock.play(user);context.currentTime=33.75;clock.pause();assert(context.nodes.every(n=>n.stops===1));context.currentTime=100;await clock.play(user);assert.equal(context.nodes.length,3);near(context.nodes[2].starts[0][0],100+.25);near(context.nodes[2].starts[0][1],725420/22050);clock.replay();assert(context.nodes.every(n=>n.stops===1));assert.equal(clock.snapshot().picture.mainFrame,1);await clock.close();
});
test('pause in final reveal retires future main; Replay restores nine cards and no dormant coach plays',async()=>{
 const{clock,context}=await fixture();clock.inspect(445);for(const c of correctCards.slice(0,4)){clock.select(c.id);await clock.drop(c.targetId,user);context.currentTime+=1.5;clock.tick();}const c=correctCards[4];clock.select(c.id);await clock.drop(c.targetId,user);context.currentTime+=2;clock.pause();assert(context.nodes.every(n=>n.stops===1));const before=context.nodes.length;context.currentTime=100;await clock.play(user);assert.equal(context.nodes.length,before+1);near(context.nodes.at(-1)!.starts[0][0],100+41/12-2);clock.replay();assert(context.nodes.every(n=>n.stops===1));assert.equal(clock.snapshot().correctDrops,0);assert.equal(clock.snapshot().interaction.attempts,0);assert.equal(clock.snapshot().inspectionMode,false);assert.equal(PLAN.clips.filter(c=>!c.selectable)[0].frameDomain,'sprite-75');assert(!context.nodes.some(n=>(n.buffer as {length:number}).length===96768));await clock.close();
});
test('reduced-motion auto-start and frame inspector cannot manufacture five correct answers',async()=>{
 const{clock,context}=await fixture();assert.equal((await clock.play({activation:'automatic',reducedMotion:true})).accepted,false);assert.equal(context.nodes.length,0);assert.equal(clock.inspect(493).accepted,false);clock.inspect(492);assert.equal(clock.snapshot().correctDrops,0);assert.equal(clock.snapshot().inspectionMode,true);assert.equal(clock.snapshot().lessonCompleted,false);clock.replay();assert.equal(clock.snapshot().inspectionMode,false);await clock.close();
});
test('pending native resume is invalidated by pause, Replay and page close',async()=>{
 for(const action of ['pause','replay','close'] as const){const{clock,context}=await fixture();let release!:()=>void;context.resumeWait=new Promise(r=>release=r);const pending=clock.play(user);await clock[action]();release();assert.equal((await pending).accepted,false);assert.equal(context.nodes.length,0);await clock.close();}
});
test('altered bytes, PCM, source segment plan and failed Canvas commit fail closed',async()=>{
 for(const mode of ['bytes','pcm','paint']){const context=new Context(),p=mode==='pcm'?{...plan,clips:plan.clips.map((c,i)=>i?c:{...c,decoder:{...c.decoder,pcmSha256:'0'.repeat(64)}})}:plan;const clock=new P018SourceClockV1(p,cards,{createContext:()=>context as unknown as AudioContext,commitPicture:()=>mode!=='paint'});const b=payloads();if(mode==='bytes')b.set('sprite-78',Uint8Array.of(9).buffer);assert.equal((await clock.prepare(b)).accepted,false);assert.equal(clock.snapshot().phase,'failed');assert.equal(context.nodes.length,0);await clock.close();}
 assert.throws(()=>new P018SourceClockV1({...plan,mainSegments:[{firstFrame:9,firstDecodedSample:1673,endDecodedSample:879552}]},cards,{commitPicture:()=>true}),/SEGMENT_SOURCE_MISMATCH/);
});
