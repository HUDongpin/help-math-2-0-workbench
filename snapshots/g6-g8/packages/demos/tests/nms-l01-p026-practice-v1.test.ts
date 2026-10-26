import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {P026PracticeV1,P026_OPERANDS,P026_ANSWER_FRAMES,P026_ANSWER_CHARACTERS,p026Problem} from '../src/nms-l01-p026-interaction-v1';
import {P026SourceClockV1,type P026Picture} from '../src/nms-l01-p026-source-clock-v1';
import {PLAN,PRACTICE} from '../src/timelines/shared-nms002-l01-p026';
const B='/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222/nms-l01-p026-behavior-source-v1';
const raw=new Uint8Array(readFileSync(B+'/audio/sprite-97/source-stream.mp3'));
const bytes=new Uint8Array(readFileSync(B+'/audio/measured-source-v1/sprite-97/browser-full.f32le'));
const pcm=new Float32Array(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength));
const user={activation:'user' as const,reducedMotion:false};
const near=(a:number,b:number)=>assert(Math.abs(a-b)<1e-8,`${a} != ${b}`);
class Context extends EventTarget {
 currentTime=0;state='suspended';sampleRate=22050;destination={};resumeWait?:Promise<void>;volumes:number[]=[];badPcm=false;
 nodes:{buffer:unknown;onended:null|(()=>void);starts:number[][];stops:number;disconnected:boolean;connect():void;disconnect():void;start(...args:number[]):void;stop():void}[]=[];
 createGain(){return {gain:{setValueAtTime:(v:number)=>this.volumes.push(v)},connect(){},disconnect(){}};}
 createBufferSource(){const n={buffer:null,onended:null,starts:[] as number[][],stops:0,disconnected:false,connect(){},disconnect(){this.disconnected=true;},start(...a:number[]){this.starts.push(a);},stop(){this.stops++;}};this.nodes.push(n);return n;}
 async decodeAudioData(){const samples=this.badPcm?new Float32Array(857664).fill(.1):pcm;return {sampleRate:22050,numberOfChannels:1,length:samples.length,getChannelData:()=>samples};}
 async resume(){if(this.resumeWait)await this.resumeWait;this.state='running';}
 async close(){this.state='closed';}
}
async function fixture(){const context=new Context(),pictures:P026Picture[]=[];const clock=new P026SourceClockV1(PLAN,{createContext:()=>context as unknown as AudioContext,commitPicture:p=>{pictures.push(p);return true;}});assert((await clock.prepare(raw.slice().buffer)).accepted);return {clock,context,pictures};}
test('all ten source divisions retain exact fields, nonsequential clip associations and individual stopping frames',()=>{
 assert.deepEqual(P026_ANSWER_CHARACTERS,[71,59,62,67,96,95,76,81,86,91]);assert.deepEqual(P026_ANSWER_FRAMES,[53,14,44,16,23,29,22,27,32,32]);
 for(let i=0;i<10;i++){const hidden=p026Problem(i),shown=p026Problem(i,true),[left,right]=P026_OPERANDS[i]!;assert.equal(shown.result,left/right);assert.equal(shown.result,[15,2,12,3,5,7,5,5,6,6][i]);assert.equal(hidden.question,PRACTICE.questions[i]);assert.equal(hidden.field1,String(left));assert.equal(hidden.field2,`${right} = `);assert.equal(shown.field2,`${right} = ${left/right}`);assert.equal(shown.answerFrameCount,P026_ANSWER_FRAMES[i]);}
 assert.throws(()=>p026Problem(10));assert.throws(()=>p026Problem(NaN));
});
test('source question pool allows repeats, resets even mid-answer and fully replays its deterministic sequence',()=>{
 const a=new P026PracticeV1(7),b=new P026PracticeV1(7),first=a.snapshot(),seen=new Set<string>(),sequence:string[]=[];
 for(let n=0;n<120;n++){assert.deepEqual(a.snapshot(),b.snapshot());seen.add(a.snapshot().question);sequence.push(a.snapshot().question);assert(a.divide());assert.equal(a.divide(),false);const last=a.snapshot().answerFrameCount;assert(a.setAnswerFrame(last));assert.equal(a.snapshot().picture.answerFrame,last);assert.equal(a.setAnswerFrame(last+1),false);a.newProblem();b.newProblem();assert.equal(a.snapshot().picture.revealed,false);assert.equal(a.snapshot().picture.answerFrame,1);assert.equal(a.snapshot().divideEnabled,true);assert.equal(a.snapshot().lessonCompleted,false);}
 assert.equal(seen.size,10);assert(sequence.some((v,i)=>i>0&&v===sequence[i-1]));a.replay();assert.deepEqual(a.snapshot(),first);assert.throws(()=>new P026PracticeV1(-1));
});
test('three native runs preserve both source gaps and stop578 caps audio before a delayed render tick',async()=>{
 const{clock,context}=await fixture();await clock.play(user);assert.equal(context.nodes.length,3);
 for(let i=0;i<3;i++){const p=PLAN.mainSegments[i],start=context.nodes[i].starts[0];near(start[0],(p.firstFrame-1)/12);near(start[1],p.firstDecodedSample/22050);near(start[2],Math.min(577/12-start[0],(p.endDecodedSample-p.firstDecodedSample)/22050));}
 for(const[t,playing]of [[.1,false],[.3,true],[14.8,true],[15,false],[18.3,false],[18.4,true],[29.5,true],[30,false],[35.2,false],[35.3,true]]as const){context.currentTime=t;assert.equal(clock.snapshot().audioNodePlaying,playing);}
 context.currentTime=48.02;assert.equal(clock.snapshot().picture.mainFrame,577);context.currentTime=99;const s=clock.snapshot();assert.equal(s.phase,'question');assert.equal(s.picture.mainFrame,578);assert.equal(s.audioNodePlaying,false);assert.equal(s.lessonCompleted,false);assert.equal(s.canDivide,true);near(857664-(571504+154*22050/12),3185);assert(context.nodes.every(n=>n.stops===1));await clock.close();
});
test('pausing in either source gap retires all future nodes and resumes at their original native offsets',async()=>{
 for(const gap of [16,32]){
  const{clock,context}=await fixture();await clock.play(user);context.currentTime=gap;clock.pause();const held=clock.snapshot();context.currentTime=100;assert.deepEqual(clock.snapshot().picture,held.picture);await clock.play(user);
  const segments=PLAN.mainSegments.filter(s=>(s.firstFrame-1)/12>gap);assert.equal(context.nodes.length,3+segments.length);
  for(const[i,p]of segments.entries()){const start=context.nodes[3+i].starts[0];near(start[0],100+(p.firstFrame-1)/12-gap);near(start[1],p.firstDecodedSample/22050);}
  clock.replay();assert(context.nodes.every(n=>n.stops===1&&n.disconnected));await clock.close();
 }
});
test('mid-run pause and mute preserve fractional native samples across run2 and run3 and retain source578 cap',async()=>{
 for(const time of [20.125,40.125]){
  const{clock,context}=await fixture();await clock.play(user);context.currentTime=time;clock.setVolume(0);clock.pause();const held=clock.snapshot();context.currentTime=100;assert.deepEqual(clock.snapshot().picture,held.picture);await clock.play(user);
  const windows=PLAN.mainSegments.map(p=>({start:(p.firstFrame-1)/12,end:Math.min(577/12,(p.firstFrame-1)/12+(p.endDecodedSample-p.firstDecodedSample)/22050),sample:p.firstDecodedSample})).filter(w=>w.end>time);
  assert.equal(context.nodes.length,3+windows.length);
  for(const[i,w]of windows.entries()){const start=context.nodes[3+i].starts[0],from=Math.max(time,w.start);near(start[0],100+from-time);near(start[1],(w.sample+(from-w.start)*22050)/22050);near(start[2],w.end-from);}
  assert.equal(context.volumes.at(-1),0);clock.setVolume(.6);assert.equal(context.volumes.at(-1),.6);await clock.close();
 }
});
test('all ten silent answers run to their own stop; pause and New preserve/cancel the active child',async()=>{
 const{clock,context}=await fixture();clock.inspect(578);const seen=new Set<number>();
 for(let i=0;i<120&&seen.size<10;i++){
  const before=clock.snapshot(),index=before.practice.picture.questionIndex,last=before.practice.answerFrameCount;seen.add(index);const origin=context.currentTime;
  await clock.divide(user);assert.equal(clock.snapshot().practice.picture.revealed,true);assert.equal(clock.snapshot().practice.picture.answerFrame,2);assert.equal(clock.snapshot().canDivide,false);assert.equal(clock.snapshot().canNewProblem,true);
  context.currentTime=origin+(last-3)/12;assert.equal(clock.snapshot().practice.picture.answerFrame,last-1);clock.pause();context.currentTime+=20;assert.equal(clock.snapshot().practice.picture.answerFrame,last-1);await clock.play(user);context.currentTime+=1/12;assert.equal(clock.snapshot().practice.picture.answerFrame,last);assert.equal(clock.snapshot().phase,'question');assert.equal(clock.snapshot().lessonCompleted,false);
  clock.newProblem();assert.equal(clock.snapshot().practice.questionOrdinal,before.practice.questionOrdinal+1);
 }
 assert.equal(seen.size,10);assert.equal(context.nodes.length,0);await clock.divide(user);context.currentTime+=.25;assert(clock.snapshot().practice.picture.answerFrame>2);assert(clock.newProblem());const reset=clock.snapshot();assert.equal(reset.practice.picture.answerFrame,1);assert.equal(reset.practice.picture.revealed,false);assert.equal(reset.canDivide,true);context.currentTime+=100;assert.deepEqual(clock.snapshot().picture,reset.picture);await clock.close();
});
test('New during a pending answer resume invalidates that start and never revives the old question',async()=>{
 const{clock,context}=await fixture();clock.inspect(578);let release!:()=>void;context.resumeWait=new Promise(r=>release=r);const pending=clock.divide(user);assert.equal(clock.snapshot().phase,'starting');assert(clock.newProblem());const next=clock.snapshot();release();assert.equal((await pending).accepted,false);assert.deepEqual(clock.snapshot().picture,next.picture);assert.equal(clock.snapshot().phase,'question');await clock.close();
});
test('Replay restores intro, source result and seeded question; inspector579 cannot bypass the source hold',async()=>{
 const{clock,context}=await fixture();const first=clock.snapshot();assert.equal((await clock.play({activation:'automatic',reducedMotion:true})).accepted,false);assert.equal(context.nodes.length,0);clock.inspect(578);await clock.divide(user);clock.newProblem();clock.replay();assert.deepEqual(clock.snapshot().practice,first.practice);assert.equal(clock.snapshot().picture.mainFrame,1);assert.equal(clock.snapshot().inspectionMode,false);
 assert.equal(clock.inspect(580).accepted,false);clock.inspect(579);assert.equal((await clock.play(user)).accepted,false);assert.equal(clock.newProblem(),false);assert.equal((await clock.divide(user)).accepted,false);assert.equal(clock.snapshot().lessonCompleted,false);await clock.close();
});
test('pause, Replay, close and context suspension retire pending starts and preserve held clocks',async()=>{
 for(const action of ['pause','replay','close'] as const){const{clock,context}=await fixture();let release!:()=>void;context.resumeWait=new Promise(r=>release=r);const pending=clock.play(user);await clock[action]();release();assert.equal((await pending).accepted,false);assert.equal(context.nodes.length,0);await clock.close();}
 const{clock,context}=await fixture();clock.inspect(578);await clock.divide(user);context.currentTime=.25;context.state='suspended';context.dispatchEvent(new Event('statechange'));const held=clock.snapshot();context.currentTime=90;assert.equal(clock.snapshot().practice.picture.answerFrame,held.practice.picture.answerFrame);assert.equal(held.phase,'paused');await clock.close();
});
test('wrong bytes, wrong decoded PCM, wrong plans and uncommitted drawing fail before playback',async()=>{
 for(const mode of ['bytes','pcm','paint']){const context=new Context();context.badPcm=mode==='pcm';const clock=new P026SourceClockV1(PLAN,{createContext:()=>context as unknown as AudioContext,commitPicture:()=>mode!=='paint'});assert.equal((await clock.prepare(mode==='bytes'?Uint8Array.of(0).buffer:raw.slice().buffer)).accepted,false);assert.equal(clock.snapshot().phase,'failed');assert.equal(context.nodes.length,0);await clock.close();}
 assert.throws(()=>new P026SourceClockV1({...PLAN,questionFrame:577 as 578},{commitPicture:()=>true}),/PLAN_MISMATCH/);assert.throws(()=>new P026SourceClockV1({...PLAN,mainSegments:[...PLAN.mainSegments].reverse()},{commitPicture:()=>true}),/PLAN_MISMATCH/);
});
test('intro distinguishes counting jumps from equal partition without swapping the second example divisor and quotient',()=>{
 const source=JSON.parse(readFileSync(B+'/semantic-source-audit-v1.json','utf8'));
 assert.deepEqual(source.introSemantics.map((x:{dividend:number;divisor:number;result:number;blueJumpLength:number;blueJumpCount:number})=>[x.dividend,x.divisor,x.result,x.blueJumpLength,x.blueJumpCount]),[[24,3,8,3,8],[24,3,8,8,3],[30,6,5,5,6]]);
 const reading=(f:number):readonly string[]=>PRACTICE.reading.filter(r=>r.firstFrame<=f&&r.lastFrame>=f).map(r=>r.text);
 assert.deepEqual(reading(210),['24 ÷ 3 = ?']);assert(reading(211)[0].includes('Eight jumps of 3 span 24'));assert.deepEqual(reading(280),['Divide 24 into 3 equal parts.']);assert(reading(318)[0].includes('Each of 3 equal parts has length 8'));assert.deepEqual(reading(359),['30 ÷ 6 = ?']);assert(reading(411)[0].startsWith('30 ÷ 6 = 5.'));assert(reading(425)[0].startsWith('Choose Divide'));
 const frames:readonly number[]=PRACTICE.introMotionKeyframes;assert.equal(frames.length,14);assert(frames.every((f,i)=>f>=1&&f<=579&&(i===0||f>frames[i-1])));for(const f of [4,211,318,359,411,425,578])assert(frames.includes(f));
});
