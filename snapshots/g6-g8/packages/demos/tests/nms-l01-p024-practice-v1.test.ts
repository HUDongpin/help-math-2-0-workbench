import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {P024PracticeV1,P024_OPERANDS,P024_ANSWER_FRAMES,P024_ANSWER_CHARACTERS,p024Problem} from '../src/nms-l01-p024-interaction-v1';
import {P024SourceClockV1,type P024Picture} from '../src/nms-l01-p024-source-clock-v1';
import {PLAN,PRACTICE} from '../src/timelines/shared-nms002-l01-p024';
const B='/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222/nms-l01-p024-behavior-source-v1';
const raw=new Uint8Array(readFileSync(B+'/audio/sprite-137/source-stream.mp3'));
const bytes=new Uint8Array(readFileSync(B+'/audio/measured-source-v1/sprite-137/browser-full.f32le'));
const pcm=new Float32Array(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength));
const user={activation:'user' as const,reducedMotion:false};
const near=(a:number,b:number)=>assert(Math.abs(a-b)<1e-8,`${a} != ${b}`);
class Context extends EventTarget {
 currentTime=0;state='suspended';sampleRate=22050;destination={};resumeWait?:Promise<void>;volumes:number[]=[];badPcm=false;
 nodes:{buffer:unknown;onended:null|(()=>void);starts:number[][];stops:number;disconnected:boolean;connect():void;disconnect():void;start(...args:number[]):void;stop():void}[]=[];
 createGain(){return {gain:{setValueAtTime:(v:number)=>this.volumes.push(v)},connect(){},disconnect(){}};}
 createBufferSource(){const n={buffer:null,onended:null,starts:[] as number[][],stops:0,disconnected:false,connect(){},disconnect(){this.disconnected=true;},start(...a:number[]){this.starts.push(a);},stop(){this.stops++;}};this.nodes.push(n);return n;}
 async decodeAudioData(){const samples=this.badPcm?new Float32Array(818496).fill(.1):pcm;return {sampleRate:22050,numberOfChannels:1,length:samples.length,getChannelData:()=>samples};}
 async resume(){if(this.resumeWait)await this.resumeWait;this.state='running';}
 async close(){this.state='closed';}
}
async function fixture(){const context=new Context(),pictures:P024Picture[]=[];const clock=new P024SourceClockV1(PLAN,{createContext:()=>context as unknown as AudioContext,commitPicture:p=>{pictures.push(p);return true;}});assert((await clock.prepare(raw.slice().buffer)).accepted);return {clock,context,pictures};}
test('all ten source multiplications retain exact fields, swapped clip associations and individual stopping frames',()=>{
 assert.deepEqual(P024_ANSWER_CHARACTERS,[58,64,63,69,86,102,119,126,131,136]);assert.deepEqual(P024_ANSWER_FRAMES,[68,42,42,39,64,67,75,56,60,9]);
 for(let i=0;i<10;i++){const hidden=p024Problem(i),shown=p024Problem(i,true),[left,right]=P024_OPERANDS[i]!;assert.equal(shown.result,left*right);assert.equal(shown.result,[45,24,24,15,35,35,40,25,36,0][i]);assert.equal(hidden.question,PRACTICE.questions[i]);assert.equal(hidden.field1,String(left));assert.equal(hidden.field2,`${right} = `);assert.equal(shown.field2,`${right} = ${left*right}`);assert.equal(shown.answerFrameCount,P024_ANSWER_FRAMES[i]);}
 assert.throws(()=>p024Problem(10));assert.throws(()=>p024Problem(NaN));
});
test('source question pool allows repeats, resets even mid-answer and fully replays its deterministic sequence',()=>{
 const a=new P024PracticeV1(7),b=new P024PracticeV1(7),first=a.snapshot(),seen=new Set<string>(),sequence:string[]=[];
 for(let n=0;n<120;n++){assert.deepEqual(a.snapshot(),b.snapshot());seen.add(a.snapshot().question);sequence.push(a.snapshot().question);assert(a.multiply());assert.equal(a.multiply(),false);const last=a.snapshot().answerFrameCount;assert(a.setAnswerFrame(last));assert.equal(a.snapshot().picture.answerFrame,last);assert.equal(a.setAnswerFrame(last+1),false);a.newProblem();b.newProblem();assert.equal(a.snapshot().picture.revealed,false);assert.equal(a.snapshot().picture.answerFrame,1);assert.equal(a.snapshot().multiplyEnabled,true);assert.equal(a.snapshot().lessonCompleted,false);}
 assert.equal(seen.size,10);assert(sequence.some((v,i)=>i>0&&v===sequence[i-1]));a.replay();assert.deepEqual(a.snapshot(),first);assert.throws(()=>new P024PracticeV1(-1));
});
test('two native runs preserve the source gap and stop468 caps audio before a delayed render tick',async()=>{
 const{clock,context}=await fixture();await clock.play(user);assert.equal(context.nodes.length,2);
 for(let i=0;i<2;i++){const p=PLAN.mainSegments[i],start=context.nodes[i].starts[0];near(start[0],(p.firstFrame-1)/12);near(start[1],p.firstDecodedSample/22050);near(start[2],Math.min(467/12-start[0],(p.endDecodedSample-p.firstDecodedSample)/22050));}
 for(const[t,playing]of [[.3,false],[1,true],[13.6,true],[14,false],[15.2,false],[15.3,true]]as const){context.currentTime=t;assert.equal(clock.snapshot().audioNodePlaying,playing);}
 context.currentTime=38.85;assert.equal(clock.snapshot().picture.mainFrame,467);context.currentTime=99;const s=clock.snapshot();assert.equal(s.phase,'question');assert.equal(s.picture.mainFrame,468);assert.equal(s.audioNodePlaying,false);assert.equal(s.lessonCompleted,false);assert.equal(s.canMultiply,true);near(818496-(293414+284*22050/12),3232);assert(context.nodes.every(n=>n.stops===1));await clock.close();
});
test('pause during source gap retires scheduled run2 and resumes at its original sample offset',async()=>{
 const{clock,context}=await fixture();await clock.play(user);context.currentTime=14;clock.pause();const held=clock.snapshot();context.currentTime=100;assert.deepEqual(clock.snapshot().picture,held.picture);await clock.play(user);assert.equal(context.nodes.length,3);near(context.nodes[2].starts[0][0],101.25);near(context.nodes[2].starts[0][1],293414/22050);clock.replay();assert(context.nodes.every(n=>n.stops===1&&n.disconnected));await clock.close();
});
test('mid-run pause and mute preserve native position and source468 duration cap',async()=>{
 const{clock,context}=await fixture();await clock.play(user);context.currentTime=20.125;clock.setVolume(0);clock.pause();const held=clock.snapshot();context.currentTime=100;assert.deepEqual(clock.snapshot().picture,held.picture);await clock.play(user);assert.equal(context.nodes.length,3);const start=context.nodes[2].starts[0];near(start[0],100);near(start[1],(293414+(20.125-183/12)*22050)/22050);near(start[2],467/12-20.125);assert.equal(context.volumes.at(-1),0);clock.setVolume(.6);assert.equal(context.volumes.at(-1),.6);await clock.close();
});
test('all ten silent answers run to their own stop; pause and New preserve/cancel the active child',async()=>{
 const{clock,context}=await fixture();clock.inspect(468);const seen=new Set<number>();
 for(let i=0;i<120&&seen.size<10;i++){
  const before=clock.snapshot(),index=before.practice.picture.questionIndex,last=before.practice.answerFrameCount;seen.add(index);const origin=context.currentTime;
  await clock.multiply(user);assert.equal(clock.snapshot().practice.picture.revealed,true);assert.equal(clock.snapshot().practice.picture.answerFrame,2);assert.equal(clock.snapshot().canMultiply,false);assert.equal(clock.snapshot().canNewProblem,true);
  context.currentTime=origin+(last-3)/12;assert.equal(clock.snapshot().practice.picture.answerFrame,last-1);clock.pause();context.currentTime+=20;assert.equal(clock.snapshot().practice.picture.answerFrame,last-1);await clock.play(user);context.currentTime+=1/12;assert.equal(clock.snapshot().practice.picture.answerFrame,last);assert.equal(clock.snapshot().phase,'question');assert.equal(clock.snapshot().lessonCompleted,false);
  clock.newProblem();assert.equal(clock.snapshot().practice.questionOrdinal,before.practice.questionOrdinal+1);
 }
 assert.equal(seen.size,10);assert.equal(context.nodes.length,0);await clock.multiply(user);context.currentTime+=.25;assert(clock.snapshot().practice.picture.answerFrame>2);assert(clock.newProblem());const reset=clock.snapshot();assert.equal(reset.practice.picture.answerFrame,1);assert.equal(reset.practice.picture.revealed,false);assert.equal(reset.canMultiply,true);context.currentTime+=100;assert.deepEqual(clock.snapshot().picture,reset.picture);await clock.close();
});
test('New during a pending answer resume invalidates that start and never revives the old question',async()=>{
 const{clock,context}=await fixture();clock.inspect(468);let release!:()=>void;context.resumeWait=new Promise(r=>release=r);const pending=clock.multiply(user);assert.equal(clock.snapshot().phase,'starting');assert(clock.newProblem());const next=clock.snapshot();release();assert.equal((await pending).accepted,false);assert.deepEqual(clock.snapshot().picture,next.picture);assert.equal(clock.snapshot().phase,'question');await clock.close();
});
test('Replay restores intro, source result and seeded question; inspector469 cannot bypass the source hold',async()=>{
 const{clock,context}=await fixture();const first=clock.snapshot();assert.equal((await clock.play({activation:'automatic',reducedMotion:true})).accepted,false);assert.equal(context.nodes.length,0);clock.inspect(468);await clock.multiply(user);clock.newProblem();clock.replay();assert.deepEqual(clock.snapshot().practice,first.practice);assert.equal(clock.snapshot().picture.mainFrame,1);assert.equal(clock.snapshot().inspectionMode,false);
 assert.equal(clock.inspect(470).accepted,false);clock.inspect(469);assert.equal((await clock.play(user)).accepted,false);assert.equal(clock.newProblem(),false);assert.equal((await clock.multiply(user)).accepted,false);assert.equal(clock.snapshot().lessonCompleted,false);await clock.close();
});
test('pause, Replay, close and context suspension retire pending starts and preserve held clocks',async()=>{
 for(const action of ['pause','replay','close'] as const){const{clock,context}=await fixture();let release!:()=>void;context.resumeWait=new Promise(r=>release=r);const pending=clock.play(user);await clock[action]();release();assert.equal((await pending).accepted,false);assert.equal(context.nodes.length,0);await clock.close();}
 const{clock,context}=await fixture();clock.inspect(468);await clock.multiply(user);context.currentTime=.25;context.state='suspended';context.dispatchEvent(new Event('statechange'));const held=clock.snapshot();context.currentTime=90;assert.equal(clock.snapshot().practice.picture.answerFrame,held.practice.picture.answerFrame);assert.equal(held.phase,'paused');await clock.close();
});
test('wrong bytes, wrong decoded PCM, wrong plans and uncommitted drawing fail before playback',async()=>{
 for(const mode of ['bytes','pcm','paint']){const context=new Context();context.badPcm=mode==='pcm';const clock=new P024SourceClockV1(PLAN,{createContext:()=>context as unknown as AudioContext,commitPicture:()=>mode!=='paint'});assert.equal((await clock.prepare(mode==='bytes'?Uint8Array.of(0).buffer:raw.slice().buffer)).accepted,false);assert.equal(clock.snapshot().phase,'failed');assert.equal(context.nodes.length,0);await clock.close();}
 assert.throws(()=>new P024SourceClockV1({...PLAN,questionFrame:467 as 468},{commitPicture:()=>true}),/PLAN_MISMATCH/);assert.throws(()=>new P024SourceClockV1({...PLAN,mainSegments:[...PLAN.mainSegments].reverse()},{commitPicture:()=>true}),/PLAN_MISMATCH/);
});
