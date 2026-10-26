import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import test from 'node:test';
import {P022SourceClockV1, type P022AudioPlan, type P022Picture} from '../src/nms-l01-p022-source-clock-v1';
import {PLAN, PRACTICE} from '../src/timelines/shared-nms002-l01-p022';

const hash = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
const raws = PLAN.clips.map((_, i) => Uint8Array.of(40 + i, 100 + i, 200 - i));
const pcms = PLAN.clips.map(c => new Float32Array(c.decoder.decodedSamples));
const plan: P022AudioPlan = {...PLAN, clips: PLAN.clips.map((c, i) => ({...c,
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
  const context = new Context(), pictures: P022Picture[] = [];
  const clock = new P022SourceClockV1(plan, PRACTICE.cards, {createContext: () => context as unknown as AudioContext,
    commitPicture: p => { pictures.push(p); return true; }});
  assert.equal(clock.snapshot().picture.mainFrame, 1);
  assert((await clock.prepare(payloads())).accepted); return {clock, context, pictures};
}

function permutations<T>(items:T[]):T[][]{return items.length?items.flatMap((v,i)=>permutations(items.filter((_,j)=>i!==j)).map(p=>[v,...p])):[[]];}
import {createP022Interaction,reduceP022Interaction,p022TargetAtPoint} from '../src/nms-l01-p022-interaction-v1';
const cards=PRACTICE.cards,correctCards=cards.filter(c=>c.targetId!==null);
test('all720 source placement orders solve six exact expressions without accepting a duplicate',()=>{
 assert.deepEqual(cards.map(c=>c.value),[-6,9,7,4,-3,8,-5,-4,-2,-1,0,1,2,3,5,6]);assert.deepEqual(PRACTICE.targets.map(t=>[t.left,t.operator,t.right,t.result]),[[2,'−',8,-6],[15,'−',6,9],[5,'+',2,7],[8,'−',4,4],[0,'−',3,-3],[3,'+',5,8]]);
 const orders=permutations([...correctCards]);assert.equal(orders.length,720);
 for(const order of orders){let s=createP022Interaction(cards);for(const c of order){s=reduceP022Interaction(cards,s,{type:'select',cardId:c.id});s=reduceP022Interaction(cards,s,{type:'drop',targetId:c.targetId});assert.equal(s.result,'correct');assert(s.locked.includes(c.id));assert.equal(reduceP022Interaction(cards,s,{type:'select',cardId:c.id}),s);assert.equal(reduceP022Interaction(cards,s,{type:'drop',targetId:c.targetId}),s);}assert.equal(s.attempts,6);assert.equal(s.locked.length,6);const reset=reduceP022Interaction(cards,s,{type:'replay'});assert.equal(reset.epoch,1);assert.equal(reset.locked.length,0);for(const c of cards)assert.deepEqual(reset.positions[c.id],c.originTwips);}
});
test('all96 card-row pairs and all16 outside drops follow the source suffix or unconditional distractor rule',()=>{
 for(const c of cards)for(const target of [...PRACTICE.targets.map(t=>t.id),null]){let s=createP022Interaction(cards);s=reduceP022Interaction(cards,s,{type:'select',cardId:c.id});s=reduceP022Interaction(cards,s,{type:'move',point:{x:1000,y:2000}});s=reduceP022Interaction(cards,s,{type:'drop',targetId:target});const yes=c.targetId!==null&&target===c.targetId;assert.equal(s.result,yes?'correct':'wrong');assert.equal(s.locked.length,yes?1:0);if(!yes)assert.deepEqual(s.positions[c.id],c.originTwips);assert.equal(s.attempts,1);}
 let s=createP022Interaction(cards);s=reduceP022Interaction(cards,s,{type:'select',cardId:'Scr_7'});const before=s;assert.equal(reduceP022Interaction(cards,s,{type:'move',point:{x:NaN,y:0}}),s);s=reduceP022Interaction(cards,s,{type:'move',point:{x:100,y:200}});s=reduceP022Interaction(cards,s,{type:'cancel'});assert.equal(s.attempts,0);assert.equal(s.selected,null);assert.deepEqual(s.positions,before.positions);
 for(const t of PRACTICE.targets)assert.equal(p022TargetAtPoint(cards,{x:t.bounds.x+t.bounds.width/2,y:t.bounds.y+t.bounds.height/2}),t.id);assert.equal(p022TargetAtPoint(cards,{x:0,y:0}),null);
});
test('full main audio starts at source9 and holds480 at its exact cumulative sample even on a late tick',async()=>{
 const{clock,context}=await fixture();await clock.play(user);assert.equal(context.nodes.length,1);const a=context.nodes[0].starts[0];near(a[0],8/12);near(a[1],1673/22050);near(a[2],(480-9)/12);
 context.currentTime=.5;assert.equal(clock.snapshot().audioNodePlaying,false);context.currentTime=1;near(clock.snapshot().audioSample,1673+(1-8/12)*22050);
 context.currentTime=479/12-.001;assert.equal(clock.snapshot().picture.mainFrame,479);context.currentTime=100;assert.equal(clock.snapshot().phase,'question');assert.equal(clock.snapshot().picture.mainFrame,480);assert.equal(clock.snapshot().audioNodePlaying,false);assert(clock.snapshot().sourceQuizActive);assert(clock.snapshot().canInteract);assert.equal(clock.snapshot().pagePlaybackComplete,false);await clock.close();
});
test('wrong audio and visual15 finish independently of Close and retain source input locking until Close',async()=>{
 const{clock,context}=await fixture();clock.inspect(480);clock.select('Scr_7');await clock.drop(null,user);assert.equal(clock.snapshot().picture.interaction.popup,'wrong');near(context.nodes[0].starts[0][1],1673/22050);assert.equal(clock.select('Scr_1').accepted,false);assert.equal((await clock.drop('Mc_Tar_1',user)).accepted,false);
 context.currentTime=13/12;assert.equal(clock.snapshot().picture.interaction.feedbackFrame,15);assert(clock.snapshot().audioNodePlaying);context.currentTime=(27072-1673)/22050;assert.equal(clock.snapshot().phase,'wrong-wait');assert.equal(clock.snapshot().canInteract,false);assert(clock.closePopup().accepted);assert.equal(clock.closePopup().accepted,false);assert.equal(clock.snapshot().phase,'question');assert.equal(clock.snapshot().interaction.attempts,1);assert.equal(clock.snapshot().correctDrops,0);await clock.close();
});
test('Close preserves an unfinished wrong native node; a later correct cue overlaps and pause holds both',async()=>{
 const{clock,context}=await fixture();clock.inspect(480);clock.select('Scr_7');await clock.drop(null,user);const wrong=context.nodes[0];context.currentTime=.1;assert(clock.pressClose());assert.equal(clock.snapshot().picture.interaction.closePressed,true);assert.equal(context.nodes.length,1);clock.cancelClose();assert(clock.closePopup().accepted);assert.equal(wrong.stops,0);assert(clock.snapshot().canInteract);assert.deepEqual(clock.snapshot().activeAudioDomains,['sprite-333']);
 clock.select('Scr_1');await clock.drop('Mc_Tar_1',user);assert.equal(wrong.stops,0);assert.deepEqual(clock.snapshot().activeAudioDomains,['sprite-333','sprite-341']);context.currentTime=.2;clock.pause();assert(context.nodes.every(n=>n.stops===1));context.currentTime=100;await clock.play(user);assert.equal(context.nodes.length,4);near(context.nodes[2].starts[0][1],1673/22050+.2);near(context.nodes[3].starts[0][1],1673/22050+.1);await clock.close();
});
test('repeated wrong restarts only the popup stream, and closing a pending source start does not cancel it',async()=>{
 const{clock,context}=await fixture();clock.inspect(480);clock.select('Scr_7');let release!:()=>void;context.resumeWait=new Promise(r=>release=r);const pending=clock.drop(null,user);assert(clock.closePopup().accepted);release();assert((await pending).accepted);assert.equal(context.nodes.length,1);assert(clock.snapshot().audioNodePlaying);context.resumeWait=undefined;
 context.currentTime=.1;clock.select('Scr_8');await clock.drop('Mc_Tar_1',user);assert.equal(context.nodes[0].stops,1);assert.equal(context.nodes.length,2);near(context.nodes[1].starts[0][0],.1);near(context.nodes[1].starts[0][1],1673/22050);assert.equal(clock.snapshot().correctDrops,0);assert.equal(clock.snapshot().interaction.attempts,2);await clock.close();
});
test('sixth correct pre-schedules source341, silent337 and the complete main outro without animation ticks',async()=>{
 const{clock,context}=await fixture();await clock.play(user);context.currentTime=100;clock.tick();for(const c of correctCards.slice(0,5)){clock.select(c.id);await clock.drop(c.targetId,user);context.currentTime+=1.5;assert.equal(clock.snapshot().phase,'question');assert.equal(clock.snapshot().pagePlaybackComplete,false);}
 const last=correctCards[5],before=context.nodes.length,t0=context.currentTime;clock.select(last.id);await clock.drop(last.targetId,user);assert.equal(context.nodes.length,before+2);const[a,b]=context.nodes.slice(before).map(n=>n.starts[0]);near(a[0],t0);near(a[1],1673/22050);near(b[0],t0+41/12);near(b[1],867135.5/22050);near(b[2],(945792-867135.5)/22050);
 context.currentTime=t0+1.5;assert.equal(clock.snapshot().picture.interaction.rightFrame,2);context.currentTime=t0+40/12;assert.equal(clock.snapshot().picture.interaction.rightFrame,24);context.currentTime=t0+41/12;assert.equal(clock.snapshot().picture.mainFrame,480);assert.equal(clock.snapshot().sourceQuizActive,false);assert.equal(clock.snapshot().audioDomain,'sprite-342');
 context.currentTime=t0+84/12;assert.equal(clock.snapshot().phase,'ended');assert.equal(clock.snapshot().picture.mainFrame,523);assert.equal(clock.snapshot().correctDrops,6);assert.equal(clock.snapshot().audioNodePlaying,false);assert.equal(clock.snapshot().pagePlaybackComplete,true);assert.equal(clock.snapshot().lessonCompleted,false);await clock.close();
});
test('pause in final reveal retires the future main node and resumes its remaining delay; Replay resets all16 cards',async()=>{
 const{clock,context}=await fixture();clock.inspect(480);for(const c of correctCards.slice(0,5)){clock.select(c.id);await clock.drop(c.targetId,user);context.currentTime+=1.5;clock.tick();}const c=correctCards[5];clock.select(c.id);await clock.drop(c.targetId,user);context.currentTime+=2;clock.pause();assert(context.nodes.every(n=>n.stops===1));const before=context.nodes.length;context.currentTime=100;await clock.play(user);assert.equal(context.nodes.length,before+1);near(context.nodes.at(-1)!.starts[0][0],100+41/12-2);clock.replay();assert(context.nodes.every(n=>n.stops===1));assert.equal(clock.snapshot().correctDrops,0);assert.equal(clock.snapshot().interaction.attempts,0);assert.equal(clock.snapshot().inspectionMode,false);assert.equal(PLAN.clips.filter(c=>!c.selectable).length,6);assert(context.nodes.every(n=>[945792,34560].includes((n.buffer as {length:number}).length)));await clock.close();
});
test('transport pause cancels a moving card without counting an attempt, while invalid cards and targets remain rejected',async()=>{
 const{clock}=await fixture();clock.inspect(480);assert.equal(clock.select('Scr_17').accepted,false);clock.select('Scr_1');clock.move({x:100,y:200});clock.pause();assert.equal(clock.snapshot().interaction.selected,null);assert.deepEqual(clock.snapshot().interaction.positions.Scr_1,cards[0].originTwips);assert.equal(clock.snapshot().interaction.attempts,0);clock.select('Scr_1');await clock.drop('Mc_Tar_7',user);assert.equal(clock.snapshot().correctDrops,0);assert.equal(clock.snapshot().picture.interaction.popup,'wrong');await clock.close();
});
test('reduced motion holds automatic start but allows all six real answers; inspection cannot manufacture completion',async()=>{
 const{clock,context}=await fixture();assert.equal((await clock.play({activation:'automatic',reducedMotion:true})).accepted,false);assert.equal(context.nodes.length,0);assert.equal(clock.inspect(524).accepted,false);clock.inspect(523);assert.equal(clock.snapshot().correctDrops,0);assert.equal(clock.snapshot().pagePlaybackComplete,false);clock.replay();const reduced={activation:'user' as const,reducedMotion:true};await clock.play(reduced);context.currentTime=100;clock.tick();for(const c of correctCards){clock.select(c.id);await clock.drop(c.targetId,reduced);context.currentTime+=c===correctCards.at(-1)?7:1.5;clock.tick();}assert.equal(clock.snapshot().pagePlaybackComplete,true);await clock.close();
});
test('pending native resume is invalidated by pause, Replay and close and cannot schedule stale nodes',async()=>{
 for(const action of ['pause','replay','close'] as const){const{clock,context}=await fixture();let release!:()=>void;context.resumeWait=new Promise(r=>release=r);const pending=clock.play(user);await clock[action]();release();assert.equal((await pending).accepted,false);assert.equal(context.nodes.length,0);await clock.close();}
});
test('all nine stream bytes and PCM, including dormant feedback, and failed drawing commits fail closed',async()=>{
 for(const mode of ['bytes','pcm','paint']){const context=new Context(),p=mode==='pcm'?{...plan,clips:plan.clips.map((c,i)=>i!==8?c:{...c,decoder:{...c.decoder,pcmSha256:'0'.repeat(64)}})}:plan;const clock=new P022SourceClockV1(p,cards,{createContext:()=>context as unknown as AudioContext,commitPicture:()=>mode!=='paint'});const b=payloads();if(mode==='bytes')b.set('sprite-129',Uint8Array.of(9).buffer);assert.equal((await clock.prepare(b)).accepted,false);assert.equal(clock.snapshot().phase,'failed');assert.equal(context.nodes.length,0);await clock.close();}
 assert.throws(()=>new P022SourceClockV1({...plan,mainSegments:[{firstFrame:9,firstDecodedSample:1673,endDecodedSample:945793}]},cards,{commitPicture:()=>true}),/MAIN_STREAM_MISMATCH/);
});
