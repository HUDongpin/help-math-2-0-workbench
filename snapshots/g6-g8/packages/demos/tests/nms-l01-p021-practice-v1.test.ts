import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';import test from 'node:test';
import {P021PracticeV1,p021PointInTarget} from '../src/nms-l01-p021-interaction-v1';
import {P021SourceClockV1,type P021Picture} from '../src/nms-l01-p021-source-clock-v1';
import {PLAN,PRACTICE} from '../src/timelines/shared-nms002-l01-p021';
const B='/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222/nms-l01-p021-behavior-source-v1';
const hash=(b:Uint8Array)=>createHash('sha256').update(b).digest('hex'),raw=Object.fromEntries(PLAN.clips.map(c=>[c.frameDomain,new Uint8Array(readFileSync(B+'/audio/'+c.frameDomain+'/source-stream.mp3')).buffer]));
const pcm=Object.fromEntries(PLAN.clips.map(c=>{const bytes=new Uint8Array(readFileSync(B+'/audio/measured-source-v1/'+c.frameDomain+'/browser-full.f32le'));return [c.frameDomain,new Float32Array(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength))];}));
const near=(a:number,b:number)=>assert(Math.abs(a-b)<1e-8,`${a} != ${b}`),user={activation:'user' as const,reducedMotion:false};
class Context extends EventTarget {
 currentTime=0;state='suspended';sampleRate=22050;destination={};resumeWait?:Promise<void>;volumes:number[]=[];badPcm=false;
 nodes:{buffer:unknown;onended:null|(()=>void);starts:number[][];stops:number;disconnected:boolean;connect():void;disconnect():void;start(...args:number[]):void;stop():void}[]=[];
 createGain(){return {gain:{setValueAtTime:(v:number)=>this.volumes.push(v)},connect(){},disconnect(){}};}
 createBufferSource(){const n={buffer:null,onended:null,starts:[] as number[][],stops:0,disconnected:false,connect(){},disconnect(){this.disconnected=true;},start(...a:number[]){this.starts.push(a);},stop(){this.stops++;}};this.nodes.push(n);return n;}
 async decodeAudioData(b:ArrayBuffer){const clip=PLAN.clips.find(c=>c.decoder.sourceSha256===hash(new Uint8Array(b)))!;const samples=this.badPcm&&clip.frameDomain==='sprite-159'?new Float32Array(34560).fill(.1):pcm[clip.frameDomain]!;return {sampleRate:22050,numberOfChannels:1,length:samples.length,getChannelData:()=>samples};}
 async resume(){if(this.resumeWait)await this.resumeWait;this.state='running';}
 async close(){this.state='closed';}
}
async function fixture(){const context=new Context(),pictures:P021Picture[]=[];const clock=new P021SourceClockV1(PLAN,PRACTICE.problems,{createContext:()=>context as unknown as AudioContext,commitPicture:p=>{pictures.push(p);return true;}});assert((await clock.prepare(raw)).accepted);return {clock,context,pictures};}
function choose(p:P021PracticeV1,index:number){for(let n=0;p.snapshot().picture.questionIndex!==index&&n<200;n++)assert(p.newProblem());assert.equal(p.snapshot().picture.questionIndex,index);}
test('all ten source normal-release orders produce correct arithmetic and repair known source copy discrepancies',()=>{
 const p=new P021PracticeV1(PRACTICE.problems);const expected=[[4,-6,-2],[-4,-6,-10],[-1,5,4],[-5,-3,-8],[3,4,7],[-3,4,1],[-4,-3,-7],[-5,7,2],[7,-5,2],[-10,5,-5]];
 for(let i=0;i<10;i++){choose(p,i);const q=p.snapshot().problem;assert.deepEqual([q.first,q.second,q.result],expected[i]);assert.equal(p.snapshot().equation,'='+q.result);assert(p.select(q.firstId));assert.equal(p.drop(true),'first');assert.equal(p.snapshot().equation,q.partialQuestion);assert.deepEqual(p.snapshot().picture.positions[q.firstId],q.cards.find(c=>c.id===q.firstId)!.destination);assert.equal(p.select(q.firstId),false);
  assert(p.select(q.secondId));assert.equal(p.drop(true),'correct');assert.equal(p.snapshot().equation,q.completedQuestion);assert.equal(p.newProblem(),false);assert(q.cards.every(c=>!p.canChoose(c.id)));assert(p.correctDone());assert(q.cards.every(c=>!p.canChoose(c.id)));assert(p.snapshot().newProblemEnabled);assert.equal(p.snapshot().lessonCompleted,false);assert(p.newProblem());
 }
 choose(p,1);p.select('Mc_N_4');p.drop(true);p.select('Mc_N_6');p.drop(true);assert.equal(p.snapshot().equation,'-4 - 6 = -10');near(p.snapshot().picture.positions.Mc_N_6.x,-235.5);
});
test('every wrong-order and distractor branch locks until Close, preserves first placement and returns source card coordinates',()=>{
 const p=new P021PracticeV1(PRACTICE.problems);let wrong=0;
 for(let index=0;index<10;index++)for(const afterFirst of [false,true]){
  choose(p,index);const q=p.snapshot().problem;
  if(afterFirst){p.select(q.firstId);assert.equal(p.drop(true),'first');}
  const ids=q.cards.filter(c=>c.role==='distractor'||!afterFirst&&c.role==='second').map(c=>c.id);
  for(const id of ids){assert(p.select(id));assert.equal(p.drop(true),'wrong');assert.equal(p.snapshot().picture.popup,'wrong');assert.equal(p.newProblem(),false);assert.equal(p.select(q.firstId),false);assert.deepEqual(p.snapshot().picture.positions[id],q.cards.find(c=>c.id===id)!.reset);assert(p.closeWrong());assert.equal(p.snapshot().picture.step,afterFirst?1:0);wrong++;}
  assert(p.newProblem());
 }assert.equal(wrong,50);
});
test('outside-target releases and cancellation retain actual unbounded dragging and do not invent wrong popups',()=>{
 const p=new P021PracticeV1(PRACTICE.problems);let outside=0;
 for(let index=0;index<10;index++){choose(p,index);const q=p.snapshot().problem;
  for(const card of q.cards){const before=p.snapshot().picture.positions[card.id];assert(p.begin(card.id));assert(p.move({x:-1200,y:900}));assert.equal(p.move({x:NaN,y:3}),false);assert(p.cancel());assert.deepEqual(p.snapshot().picture.positions[card.id],before);assert(p.begin(card.id));p.move({x:1100,y:-500});assert.equal(p.drop(false),'outside');assert.equal(p.snapshot().picture.popup,'none');assert.deepEqual(p.snapshot().picture.positions[card.id],card.reset);assert(p.snapshot().newProblemEnabled);outside++;}
  assert(p.newProblem());
 }assert.equal(outside,40);assert.equal(p.select('Mc_P_999'),false);assert.equal(p.drop(true),'unavailable');
 const b=PRACTICE.numberLineTarget;assert(p021PointInTarget(b,{x:b.x,y:b.y}));assert(p021PointInTarget(b,{x:b.x+b.width,y:b.y+b.height}));assert.equal(p021PointInTarget(b,{x:b.x-.01,y:b.y}),false);assert.equal(p021PointInTarget(b,null),false);
});
test('question and four-label coach random choices are deterministic, share the product seed and fully Replay',()=>{
 const a=new P021PracticeV1(PRACTICE.problems,7),b=new P021PracticeV1(PRACTICE.problems,7),first=a.snapshot(),qs=new Set<number>(),coaches=new Set<number>();
 for(let i=0;i<150;i++){assert.deepEqual(a.snapshot(),b.snapshot());qs.add(a.snapshot().picture.questionIndex);const c=a.nextCoach();assert.equal(c,b.nextCoach());coaches.add(c);a.newProblem();b.newProblem();}
 assert.equal(qs.size,10);assert.equal(coaches.size,4);a.replay();assert.deepEqual(a.snapshot(),first);assert.throws(()=>new P021PracticeV1(PRACTICE.problems,-1));
});
test('main9 starts after its source delay, holds571 before late ticks and leaves the1300-sample tail preserved',async()=>{
 const{clock,context}=await fixture();await clock.play(user);assert.equal(context.nodes.length,1);const s=context.nodes[0].starts[0];near(s[0],8/12);near(s[1],1673/22050);near(s[2],47.5-8/12);context.currentTime=.5;assert.equal(clock.snapshot().audioNodePlaying,false);context.currentTime=47.49;assert.equal(clock.snapshot().picture.mainFrame,570);context.currentTime=90;const end=clock.snapshot();assert.equal(end.picture.mainFrame,571);assert.equal(end.phase,'question');assert.equal(end.lessonCompleted,false);assert.equal(end.audioNodePlaying,false);near(1035648-(1673+(47.5-8/12)*22050),1300);assert.equal(context.nodes[0].stops,1);await clock.close();
});
test('all four source coach slices start at their own seek and stop/reset1; repeating a cue retires only that coach',async()=>{
 const{clock,context}=await fixture();clock.inspect(571);const seen=new Set<string>();
 for(let n=0;n<30&&seen.size<4;n++){
  const id=clock.snapshot().practice.problem.cards[0].id;assert(clock.select(id));await clock.drop(false,user);const snap=clock.snapshot(),v=PLAN.coachVariants.find(v=>v.label===snap.coachLabel)!;seen.add(v.label);const node=context.nodes.at(-1)!;near(node.starts[0][1],v.firstDecodedSample/22050);near(node.starts[0][2],v.durationSeconds);context.currentTime+=v.durationSeconds+.001;assert.equal(clock.snapshot().picture.interaction.coachFrame,1);assert.equal(clock.snapshot().phase,'question');assert.equal(clock.snapshot().lessonCompleted,false);
 }assert.equal(seen.size,4);const id=clock.snapshot().practice.problem.cards[0].id;clock.select(id);await clock.drop(false,user);const previous=context.nodes.at(-1)!;clock.select(id);await clock.drop(false,user);assert.equal(previous.stops,1);assert.notEqual(context.nodes.at(-1),previous);assert(context.nodes.every(n=>(n.buffer as {length:number}).length===96768));await clock.close();
});
test('wrong Close press has the real button-down sound; release removes it while coach continues through New',async()=>{
 const{clock,context}=await fixture();clock.inspect(571);const p=clock.snapshot().practice.problem;clock.select(p.secondId);await clock.drop(true,user);const coach=context.nodes[0];assert.equal(clock.newProblem(),false);await clock.pressClose(user);assert.equal(clock.snapshot().picture.interaction.closePressed,true);const click=context.nodes[1];assert.equal((click.buffer as {length:number}).length,8640);near(click.starts[0][1],1673/22050);near(click.starts[0][2],(8640-1673)/22050);context.currentTime=.1;assert(clock.closeWrong());assert.equal(click.stops,1);assert.equal(coach.stops,0);assert.equal(clock.snapshot().picture.interaction.closePressed,false);assert(clock.newProblem());assert.equal(coach.stops,0);assert.equal(clock.snapshot().activeAudioDomains.join(),'sprite-46');await clock.close();
});
test('Correct157 can overlap existing coach46 and unlocks only New at25 without completing the page',async()=>{
 const{clock,context}=await fixture();clock.inspect(571);const p=clock.snapshot().practice.problem;clock.select(p.firstId);await clock.drop(true,user);clock.select(p.cards.find(c=>c.role==='distractor')!.id);await clock.drop(true,user);const coach=context.nodes[0];clock.closeWrong();clock.select(p.secondId);await clock.drop(true,user);const right=context.nodes[1];assert.equal(coach.stops,0);assert.equal((right.buffer as {length:number}).length,43776);assert.deepEqual(clock.snapshot().activeAudioDomains,['sprite-46','sprite-157']);assert.equal(clock.newProblem(),false);near(right.starts[0][2],(43776-1673)/22050);context.currentTime=23/12-.001;assert.equal(clock.snapshot().picture.interaction.correctFrame,24);context.currentTime=23/12;const done=clock.snapshot();assert.equal(done.picture.interaction.correctFrame,1);assert.equal(done.practice.status,'answered');assert(done.canNewProblem);assert.equal(done.lessonCompleted,false);assert.equal(clock.select(p.secondId),false);assert(clock.newProblem());await clock.close();
});
test('pause, mute and resume preserve every independent native track and exact remaining sample offsets',async()=>{
 const{clock,context}=await fixture();clock.inspect(571);const p=clock.snapshot().practice.problem;clock.select(p.firstId);await clock.drop(true,user);clock.select(p.cards.find(c=>c.role==='distractor')!.id);await clock.drop(true,user);clock.closeWrong();clock.select(p.secondId);await clock.drop(true,user);context.currentTime=.2;clock.setVolume(0);clock.pause();const held=clock.snapshot(),coachLabel=held.coachLabel,offset=PLAN.coachVariants.find(v=>v.label===coachLabel)!.firstDecodedSample;context.currentTime=100;assert.deepEqual(clock.snapshot().picture,held.picture);await clock.play(user);assert.equal(context.nodes.length,4);near(context.nodes[2].starts[0][1],(offset+.2*22050)/22050);near(context.nodes[3].starts[0][1],(1673+.2*22050)/22050);assert.equal(context.volumes.at(-1),0);clock.setVolume(.6);assert.equal(context.volumes.at(-1),.6);await clock.close();assert(context.nodes.every(n=>n.stops===1));
});
test('button release cancels its pending start while a separately authorized coach can still start',async()=>{
 const{clock,context}=await fixture();clock.inspect(571);let release!:()=>void;context.resumeWait=new Promise(r=>release=r);clock.select(clock.snapshot().practice.problem.secondId);const cue=clock.drop(true,user);const click=clock.pressClose(user);assert(clock.closeWrong());assert(clock.newProblem());release();await Promise.all([cue,click]);assert.equal(context.nodes.length,1);assert.equal((context.nodes[0].buffer as {length:number}).length,96768);assert.equal(clock.snapshot().picture.interaction.closePressed,false);assert.equal(clock.snapshot().practice.picture.popup,'none');await clock.close();
});
test('pending resume is invalidated by pause/Replay/close and reduced-motion/inspector572 cannot bypass the source hold',async()=>{
 for(const action of ['pause','replay','close'] as const){const{clock,context}=await fixture();let release!:()=>void;context.resumeWait=new Promise(r=>release=r);const pending=clock.play(user);await clock[action]();release();assert.equal((await pending).accepted,false);assert.equal(context.nodes.length,0);await clock.close();}
 const{clock,context}=await fixture();assert.equal((await clock.play({activation:'automatic',reducedMotion:true})).accepted,false);clock.inspect(572);assert.equal(clock.snapshot().phase,'paused');assert.equal(clock.snapshot().picture.mainFrame,572);assert.equal((await clock.play(user)).accepted,false);assert.equal(clock.select(clock.snapshot().practice.problem.firstId),false);assert.equal(clock.newProblem(),false);assert.equal(clock.snapshot().lessonCompleted,false);clock.replay();assert.equal(clock.snapshot().picture.mainFrame,1);assert.equal(clock.snapshot().inspectionMode,false);assert.equal(clock.snapshot().practice.questionOrdinal,1);assert.equal(clock.snapshot().coachLabel,null);assert.equal(context.nodes.length,0);await clock.close();
});
test('wrong bytes or PCM in even the dormant fifth stream and failed drawing commits reject the whole source bundle',async()=>{
 for(const mode of ['bytes','pcm','paint']){const c=new Context();c.badPcm=mode==='pcm';const clock=new P021SourceClockV1(PLAN,PRACTICE.problems,{createContext:()=>c as unknown as AudioContext,commitPicture:()=>mode!=='paint'}),payloads={...raw};if(mode==='bytes')payloads['sprite-159']=Uint8Array.of(0).buffer;assert.equal((await clock.prepare(payloads)).accepted,false);assert.equal(clock.snapshot().phase,'failed');assert.equal(c.nodes.length,0);await clock.close();}
 assert.throws(()=>new P021SourceClockV1({...PLAN,questionFrame:570 as 571},PRACTICE.problems,{commitPicture:()=>true}),/PLAN_MISMATCH/);
});
