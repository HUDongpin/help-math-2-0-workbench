import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {P020PracticeV1,P020_QUESTIONS,P020_ANSWERS,P020_ANSWER_CHARACTERS,p020Problem} from '../src/nms-l01-p020-interaction-v1';
import {P020SourceClockV1,type P020Picture} from '../src/nms-l01-p020-source-clock-v1';
import {PLAN,PRACTICE} from '../src/timelines/shared-nms002-l01-p020';
const B='/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222/nms-l01-p020-behavior-source-v1';
const raw=new Uint8Array(readFileSync(B+'/audio/sprite-114/source-stream.mp3'));
const bytes=new Uint8Array(readFileSync(B+'/audio/measured-source-v1/sprite-114/browser-full.f32le'));
const pcm=new Float32Array(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength));
const user={activation:'user' as const,reducedMotion:false};
const near=(a:number,b:number)=>assert(Math.abs(a-b)<1e-8,`${a} != ${b}`);
class Context extends EventTarget {
 currentTime=0;state='suspended';sampleRate=22050;destination={};resumeWait?:Promise<void>;volumes:number[]=[];badPcm=false;
 nodes:{buffer:unknown;onended:null|(()=>void);starts:number[][];stops:number;disconnected:boolean;connect():void;disconnect():void;start(...args:number[]):void;stop():void}[]=[];
 createGain(){return {gain:{setValueAtTime:(v:number)=>this.volumes.push(v)},connect(){},disconnect(){}};}
 createBufferSource(){const n={buffer:null,onended:null,starts:[] as number[][],stops:0,disconnected:false,connect(){},disconnect(){this.disconnected=true;},start(...a:number[]){this.starts.push(a);},stop(){this.stops++;}};this.nodes.push(n);return n;}
 async decodeAudioData(){const samples=this.badPcm?new Float32Array(970560).fill(.1):pcm;return {sampleRate:22050,numberOfChannels:1,length:samples.length,getChannelData:()=>samples};}
 async resume(){if(this.resumeWait)await this.resumeWait;this.state='running';}
 async close(){this.state='closed';}
}
async function fixture(){const context=new Context(),pictures:P020Picture[]=[];const clock=new P020SourceClockV1(PLAN,{createContext:()=>context as unknown as AudioContext,commitPicture:p=>{pictures.push(p);return true;}});assert((await clock.prepare(raw.slice().buffer)).accepted);return {clock,context,pictures};}
test('all ten source questions keep exact arithmetic, clip association, whitespace and negative field positions',()=>{
 assert.deepEqual(P020_QUESTIONS,PRACTICE.questions);assert.deepEqual(P020_ANSWER_CHARACTERS,[75,80,83,88,93,96,101,105,109,113]);
 for(let i=0;i<10;i++){const hidden=p020Problem(i),shown=p020Problem(i,true),[a,b]=P020_ANSWERS[i]!.split('~').map(Number);assert.equal(shown.result,a!+b!);assert.equal(shown.result,[-12,11,10,2,2,-2,-2,-5,-4,0][i]);assert.equal(hidden.field1+'-'+hidden.field2,P020_QUESTIONS[i]);assert.equal(hidden.field3,'');assert.equal(hidden.minusVisible,false);
  if(shown.result<0){assert.equal(shown.field2,hidden.field2);assert.equal(shown.field3,String(-shown.result));assert.equal(shown.minusVisible,true);}else{assert.equal(shown.field2,hidden.field2+' '+shown.result);assert.equal(shown.field3,'');}
  near(shown.minusX,[0,7,8].includes(i)?280.7:263.7);near(shown.resultX,[0,7,8].includes(i)?289.5:272.5);
 }assert.throws(()=>p020Problem(10));assert.throws(()=>p020Problem(NaN));
});
test('source question pool allows repeats, resets even mid-answer and fully replays its deterministic sequence',()=>{
 const a=new P020PracticeV1(7),b=new P020PracticeV1(7),first=a.snapshot(),seen=new Set<string>(),sequence:string[]=[];
 for(let n=0;n<120;n++){assert.deepEqual(a.snapshot(),b.snapshot());seen.add(a.snapshot().question);sequence.push(a.snapshot().question);assert(a.subtract());assert.equal(a.subtract(),false);assert(a.setAnswerFrame(19));assert.equal(a.snapshot().picture.answerFrame,19);assert.equal(a.setAnswerFrame(21),false);a.newProblem();b.newProblem();assert.equal(a.snapshot().picture.revealed,false);assert.equal(a.snapshot().picture.answerFrame,1);assert.equal(a.snapshot().subtractEnabled,true);assert.equal(a.snapshot().lessonCompleted,false);}
 assert.equal(seen.size,10);assert(sequence.some((v,i)=>i>0&&v===sequence[i-1]));a.replay();assert.deepEqual(a.snapshot(),first);assert.throws(()=>new P020PracticeV1(-1));
});
test('three native runs preserve source gaps and stop569 caps the last run before a delayed render tick',async()=>{
 const{clock,context}=await fixture();await clock.play(user);assert.equal(context.nodes.length,3);
 for(let i=0;i<3;i++){const p=PLAN.mainSegments[i],start=context.nodes[i].starts[0];near(start[0],(p.firstFrame-1)/12);near(start[1],p.firstDecodedSample/22050);near(start[2],Math.min(568/12-start[0],(p.endDecodedSample-p.firstDecodedSample)/22050));}
 for(const[t,playing]of [[.5,false],[1,true],[17.6,false],[18.5,true],[37,false],[38.6,true]] as const){context.currentTime=t;assert.equal(clock.snapshot().audioNodePlaying,playing);}
 context.currentTime=47.3;assert.equal(clock.snapshot().picture.mainFrame,568);context.currentTime=99;const s=clock.snapshot();assert.equal(s.phase,'question');assert.equal(s.picture.mainFrame,569);assert.equal(s.audioNodePlaying,false);assert.equal(s.lessonCompleted,false);assert.equal(s.canSubtract,true);near(970560-(774506+105*22050/12),3116.5);assert(context.nodes.every(n=>n.stops===1));await clock.close();
});
test('pause in first gap cancels future sounds and resume retains both later source offsets',async()=>{
 const{clock,context}=await fixture();await clock.play(user);context.currentTime=18;clock.pause();const held=clock.snapshot();context.currentTime=100;assert.deepEqual(clock.snapshot().picture,held.picture);await clock.play(user);assert.equal(context.nodes.length,5);near(context.nodes[3].starts[0][0],100.5);near(context.nodes[3].starts[0][1],370381/22050);near(context.nodes[4].starts[0][0],100+(463/12-18));clock.replay();assert(context.nodes.every(n=>n.stops===1&&n.disconnected));await clock.close();
});
test('mid-run pause and mute preserve fractional native sample and final bounded duration',async()=>{
 const{clock,context}=await fixture();await clock.play(user);context.currentTime=40.25;clock.setVolume(0);clock.pause();const held=clock.snapshot();context.currentTime=100;assert.deepEqual(clock.snapshot().picture,held.picture);await clock.play(user);assert.equal(context.nodes.length,4);const start=context.nodes[3].starts[0];near(start[0],100);near(start[1],(774506+(40.25-463/12)*22050)/22050);near(start[2],568/12-40.25);assert.equal(context.volumes.at(-1),0);clock.setVolume(.6);assert.equal(context.volumes.at(-1),.6);await clock.close();
});
test('silent answers run2..20, source result appears immediately, pause parks and New cancels mid-reveal',async()=>{
 const{clock,context}=await fixture();clock.inspect(569);const initial=clock.snapshot();await clock.subtract(user);assert.equal(clock.snapshot().practice.picture.revealed,true);assert.equal(clock.snapshot().practice.picture.answerFrame,2);assert.equal(clock.snapshot().canSubtract,false);assert.equal(clock.snapshot().canNewProblem,true);assert.equal(context.nodes.length,0);
 context.currentTime=16/12;assert.equal(clock.snapshot().practice.picture.answerFrame,18);clock.pause();context.currentTime=30;assert.equal(clock.snapshot().practice.picture.answerFrame,18);await clock.play(user);context.currentTime=30+1/12;assert.equal(clock.snapshot().practice.picture.answerFrame,19);context.currentTime=30+2/12;assert.equal(clock.snapshot().practice.picture.answerFrame,20);assert.equal(clock.snapshot().phase,'question');assert.equal(clock.snapshot().lessonCompleted,false);
 clock.newProblem();assert.equal(clock.snapshot().practice.questionOrdinal,initial.practice.questionOrdinal+1);await clock.subtract(user);context.currentTime+=.25;assert(clock.snapshot().practice.picture.answerFrame>2);assert(clock.newProblem());const reset=clock.snapshot();assert.equal(reset.practice.picture.answerFrame,1);assert.equal(reset.practice.picture.revealed,false);assert.equal(reset.canSubtract,true);context.currentTime+=100;assert.deepEqual(clock.snapshot().picture,reset.picture);assert.equal(context.nodes.length,0);await clock.close();
});
test('New during a pending answer resume invalidates that start and never revives the old question',async()=>{
 const{clock,context}=await fixture();clock.inspect(569);let release!:()=>void;context.resumeWait=new Promise(r=>release=r);const pending=clock.subtract(user);assert.equal(clock.snapshot().phase,'starting');assert(clock.newProblem());const next=clock.snapshot();release();assert.equal((await pending).accepted,false);assert.deepEqual(clock.snapshot().picture,next.picture);assert.equal(clock.snapshot().phase,'question');await clock.close();
});
test('Replay restores intro, source result and seeded question; inspector570 cannot bypass the source hold',async()=>{
 const{clock,context}=await fixture();const first=clock.snapshot();assert.equal((await clock.play({activation:'automatic',reducedMotion:true})).accepted,false);assert.equal(context.nodes.length,0);clock.inspect(569);await clock.subtract(user);clock.newProblem();clock.replay();assert.deepEqual(clock.snapshot().practice,first.practice);assert.equal(clock.snapshot().picture.mainFrame,1);assert.equal(clock.snapshot().inspectionMode,false);
 assert.equal(clock.inspect(571).accepted,false);clock.inspect(570);assert.equal((await clock.play(user)).accepted,false);assert.equal(clock.newProblem(),false);assert.equal((await clock.subtract(user)).accepted,false);assert.equal(clock.snapshot().lessonCompleted,false);await clock.close();
});
test('pause, Replay, close and context suspension retire pending starts and preserve held clocks',async()=>{
 for(const action of ['pause','replay','close'] as const){const{clock,context}=await fixture();let release!:()=>void;context.resumeWait=new Promise(r=>release=r);const pending=clock.play(user);await clock[action]();release();assert.equal((await pending).accepted,false);assert.equal(context.nodes.length,0);await clock.close();}
 const{clock,context}=await fixture();clock.inspect(569);await clock.subtract(user);context.currentTime=.25;context.state='suspended';context.dispatchEvent(new Event('statechange'));const held=clock.snapshot();context.currentTime=90;assert.equal(clock.snapshot().practice.picture.answerFrame,held.practice.picture.answerFrame);assert.equal(held.phase,'paused');await clock.close();
});
test('wrong bytes, wrong decoded PCM, wrong plans and uncommitted drawing fail before playback',async()=>{
 for(const mode of ['bytes','pcm','paint']){const context=new Context();context.badPcm=mode==='pcm';const clock=new P020SourceClockV1(PLAN,{createContext:()=>context as unknown as AudioContext,commitPicture:()=>mode!=='paint'});assert.equal((await clock.prepare(mode==='bytes'?Uint8Array.of(0).buffer:raw.slice().buffer)).accepted,false);assert.equal(clock.snapshot().phase,'failed');assert.equal(context.nodes.length,0);await clock.close();}
 assert.throws(()=>new P020SourceClockV1({...PLAN,questionFrame:568 as 569},{commitPicture:()=>true}),/PLAN_MISMATCH/);assert.throws(()=>new P020SourceClockV1({...PLAN,mainSegments:[...PLAN.mainSegments].reverse()},{commitPicture:()=>true}),/PLAN_MISMATCH/);
});
