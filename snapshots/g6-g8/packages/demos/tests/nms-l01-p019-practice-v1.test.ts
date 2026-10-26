import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import test from 'node:test';
import {P019PracticeV1,P019_QUESTIONS,p019ValueAtX} from '../src/nms-l01-p019-interaction-v1';
import {P019SourceClockV1,type P019AudioPlan,type P019Picture} from '../src/nms-l01-p019-source-clock-v1';
import {PLAN,PRACTICE} from '../src/timelines/shared-nms002-l01-p019-v2';
const hash=(bytes:Uint8Array)=>createHash('sha256').update(bytes).digest('hex');
const raw=Uint8Array.of(41,71,219),pcm=new Float32Array(1008000);
const plan:P019AudioPlan={...PLAN,decoder:{...PLAN.decoder,sourceBytes:raw.length,sourceSha256:hash(raw),pcmSha256:hash(new Uint8Array(pcm.buffer))}};
const user={activation:'user' as const,reducedMotion:false};
const near=(a:number,b:number)=>assert(Math.abs(a-b)<1e-8,`${a} != ${b}`);
class Context extends EventTarget {
 currentTime=0;state='suspended';sampleRate=22050;destination={};resumeWait?:Promise<void>;volumes:number[]=[];badPcm=false;
 nodes:{buffer:unknown;onended:null|(()=>void);starts:number[][];stops:number;disconnected:boolean;connect():void;disconnect():void;start(...args:number[]):void;stop():void}[]=[];
 createGain(){return {gain:{setValueAtTime:(v:number)=>this.volumes.push(v)},connect(){},disconnect(){}};}
 createBufferSource(){const n={buffer:null,onended:null,starts:[] as number[][],stops:0,disconnected:false,connect(){},disconnect(){this.disconnected=true;},start(...a:number[]){this.starts.push(a);},stop(){this.stops++;}};this.nodes.push(n);return n;}
 async decodeAudioData(){const samples=this.badPcm?new Float32Array(1008000).fill(.1):pcm;return {sampleRate:22050,numberOfChannels:1,length:samples.length,getChannelData:()=>samples};}
 async resume(){if(this.resumeWait)await this.resumeWait;this.state='running';}
 async close(){this.state='closed';}
}
async function fixture(){const context=new Context(),pictures:P019Picture[]=[];const clock=new P019SourceClockV1(plan,{createContext:()=>context as unknown as AudioContext,commitPicture:p=>{pictures.push(p);return true;}});assert((await clock.prepare(raw.slice().buffer)).accepted);return {clock,context,pictures};}
test('all1681 signed integer pairs preserve the arithmetic range and exact source endpoint relation',()=>{
 assert.deepEqual(P019_QUESTIONS,PRACTICE.questions);const p=new P019PracticeV1();let count=0;
 for(let a=-20;a<=20;a++)for(let b=-20;b<=20;b++){
  assert(p.setValue('h2',a));assert(p.setValue('h4',b));const s=p.snapshot();assert.equal(s.value1,a);assert.equal(s.value2,b);assert.equal(s.sum,a+b);near(s.outputEndpoint,s.picture.x1+s.picture.x2+15);assert(s.picture.x1>=-308&&s.picture.x1<=282);assert.equal(s.lessonCompleted,false);count++;
 }assert.equal(count,1681);
});
test('source half-step rounding, normalized bounds, centered dragging and cancellation keep valid coordinates',()=>{
 for(const[x,n]of [[-308,-20],[-22.501,-1],[-22.5,0],[-15,0],[-7.501,0],[-7.5,1],[0,1],[7.5,2],[282,20]])assert.equal(p019ValueAtX(x),n);
 const p=new P019PracticeV1();assert(p.setValue('h2',4));assert(p.begin('h2',50));near(p.snapshot().picture.x1,50);assert.equal(p.begin('h4',4),false);assert.equal(p.move(NaN),false);
 assert(p.move(-9999));assert.equal(p.snapshot().value1,-20);assert(p.move(9999));assert.equal(p.snapshot().value1,20);assert(p.finish(true));assert.equal(p.snapshot().value1,4);
 assert(p.begin('h4',-90));assert(p.finish());assert.equal(p.snapshot().value2,-5);assert.equal(p.finish(),false);assert.equal(p.setValue('h2',21),false);assert.equal(p.setValue('h4',1.5),false);
});
test('question selection retains all ten source questions, permits repeats and Replay resets the full deterministic sequence',()=>{
 const a=new P019PracticeV1(7),b=new P019PracticeV1(7),first=a.snapshot();const seen=new Set<string>(),sequence:string[]=[];
 for(let i=0;i<100;i++){assert.deepEqual(a.snapshot(),b.snapshot());seen.add(a.snapshot().question);sequence.push(a.snapshot().question);a.setValue('h2',19);a.begin('h4',190);a.newProblem();b.newProblem();assert.equal(a.snapshot().sum,0);assert.equal(a.snapshot().picture.pressed,null);}
 assert.equal(seen.size,10);assert(sequence.some((v,i)=>i>0&&v===sequence[i-1]));a.replay();assert.deepEqual(a.snapshot(),first);assert.throws(()=>new P019PracticeV1(-1),/INVALID_SEED/);
});
test('native intro schedules source7 through stop553 before any delayed render tick and never completes the lesson',async()=>{
 const{clock,context}=await fixture();await clock.play(user);assert.equal(context.nodes.length,1);const start=context.nodes[0].starts[0];near(start[0],.5);near(start[1],1673/22050);near(start[2],45.5);
 context.currentTime=.4;assert.equal(clock.snapshot().audioNodePlaying,false);context.currentTime=45.999;assert.equal(clock.snapshot().picture.mainFrame,552);near(clock.snapshot().audioSample,1673+45.499*22050);
 context.currentTime=90;const s=clock.snapshot();assert.equal(s.phase,'question');assert.equal(s.picture.mainFrame,553);assert.equal(s.audioNodePlaying,false);assert.equal(s.lessonCompleted,false);assert.equal(context.nodes.length,1);near(1008000-(1673+45.5*22050),3052);
 assert(clock.setValue('h2',-8));assert(clock.setValue('h4',13));assert.equal(clock.snapshot().practice.sum,5);await clock.play(user);assert.equal(clock.snapshot().phase,'question');assert.equal(context.nodes.length,1);await clock.close();
});
test('pause before first sound retires future audio and resume preserves the remaining delay',async()=>{
 const{clock,context}=await fixture();await clock.play(user);context.currentTime=.2;clock.pause();assert.equal(context.nodes[0].stops,1);context.currentTime=80;await clock.play(user);
 near(context.nodes[1].starts[0][0],80.3);near(context.nodes[1].starts[0][1],1673/22050);near(context.nodes[1].starts[0][2],45.5);clock.replay();assert(context.nodes.every(n=>n.stops===1&&n.disconnected));await clock.close();
});
test('mid-narration pause, mute and resume keep exact fractional source sample and bounded duration',async()=>{
 const{clock,context}=await fixture();await clock.play(user);context.currentTime=17.25;clock.setVolume(0);assert.equal(context.volumes.at(-1),0);clock.pause();const held=clock.snapshot();context.currentTime=100;assert.equal(clock.snapshot().picture.mainFrame,held.picture.mainFrame);await clock.play(user);
 const s=context.nodes[1].starts[0];near(s[0],100);near(s[1],(1673+16.75*22050)/22050);near(s[2],28.75);clock.setVolume(.6);assert.equal(context.volumes.at(-1),.6);await clock.close();assert(context.nodes.every(n=>n.stops===1));
});
test('source question interactions and New problem remain on553 with no new audio node or auto-completion',async()=>{
 const{clock,context}=await fixture();clock.inspect(553);assert(clock.begin('h2',50));assert(clock.move(120));assert(clock.finish());assert(clock.setValue('h4',-2));assert.equal(clock.snapshot().practice.sum,7);
 const ordinal=clock.snapshot().practice.questionOrdinal;assert(clock.newProblem());assert.equal(clock.snapshot().practice.questionOrdinal,ordinal+1);assert.equal(clock.snapshot().practice.sum,0);assert.equal(clock.snapshot().picture.mainFrame,553);assert.equal(context.nodes.length,0);assert.equal(clock.snapshot().lessonCompleted,false);
 clock.replay();assert.equal(clock.snapshot().picture.mainFrame,1);assert.equal(clock.snapshot().inspectionMode,false);assert.equal(clock.snapshot().practice.questionOrdinal,1);assert.equal(clock.setValue('h2',2),false);await clock.close();
});
test('reduced-motion auto-start and inspection of inaccessible554/555 cannot bypass the source stop',async()=>{
 const{clock,context}=await fixture();assert.equal((await clock.play({activation:'automatic',reducedMotion:true})).accepted,false);assert.equal(context.nodes.length,0);assert.equal(clock.inspect(556).accepted,false);
 for(const f of [554,555]){assert(clock.inspect(f).accepted);assert.equal(clock.snapshot().picture.mainFrame,f);assert.equal((await clock.play(user)).accepted,false);assert.equal(clock.snapshot().lessonCompleted,false);assert.equal(clock.newProblem(),false);}
 clock.inspect(553);assert.equal(clock.snapshot().phase,'question');clock.inspect(300);await clock.play(user);assert.equal(context.nodes.length,1);await clock.close();
});
test('pending native resume is retired by pause, Replay and close; suspended context cannot advance',async()=>{
 for(const action of ['pause','replay','close'] as const){const{clock,context}=await fixture();let release!:()=>void;context.resumeWait=new Promise(r=>release=r);const pending=clock.play(user);await clock[action]();release();assert.equal((await pending).accepted,false);assert.equal(context.nodes.length,0);await clock.close();}
 const{clock,context}=await fixture();await clock.play(user);context.currentTime=7;context.state='suspended';context.dispatchEvent(new Event('statechange'));const held=clock.snapshot();context.currentTime=80;assert.equal(clock.snapshot().picture.mainFrame,held.picture.mainFrame);assert.equal(held.phase,'paused');await clock.close();
});
test('altered source bytes, PCM and failed picture commit fail closed without scheduling audio',async()=>{
 for(const mode of ['bytes','pcm','paint']){const context=new Context();context.badPcm=mode==='pcm';const clock=new P019SourceClockV1(plan,{createContext:()=>context as unknown as AudioContext,commitPicture:()=>mode!=='paint'});assert.equal((await clock.prepare(mode==='bytes'?Uint8Array.of(0).buffer:raw.slice().buffer)).accepted,false);assert.equal(clock.snapshot().phase,'failed');assert.equal(context.nodes.length,0);await clock.close();}
 assert.throws(()=>new P019SourceClockV1({...plan,questionFrame:552 as 553},{commitPicture:()=>true}),/PLAN_MISMATCH/);
});
