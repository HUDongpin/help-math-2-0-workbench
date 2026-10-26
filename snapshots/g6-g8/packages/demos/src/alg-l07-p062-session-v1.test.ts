import test from'node:test';import assert from'node:assert/strict';
import{P062Session,p062AudioId,type P062Transport}from'./alg-l07-p062-session-v1';
import type{DecodedStreamPhase}from'./decoded-source-stream-transport';
const deferred=<T,>()=>{let resolve!:(value:T)=>void;return{promise:new Promise<T>(r=>resolve=r),resolve};};
class Audio implements P062Transport {
 phase:DecodedStreamPhase='idle';sample=0;closed=false;prepared=0;plays=0;replays=0;listeners=new Set<()=>void>();closeGate:Promise<void>|null=null;
 snapshot(){return{phase:this.phase,epoch:0,decodedSample:this.sample,contextTime:0,heldContextTime:null,playbackAnchor:null,elapsedMs:this.sample,volume:1,failure:null,sourceAlignment:'unresolved' as const,lessonCompleted:false as const};}
 emit(){for(const f of this.listeners)f();}
 async prepare(_:ArrayBuffer){this.prepared++;this.phase='ready';this.emit();return{accepted:true,reason:'ready'};}
 async play(){this.plays++;this.phase='playing';this.emit();return{accepted:true,reason:'playing'};}
 pause(){this.phase='paused';this.emit();return{accepted:true,reason:'paused'};}
 replay(){this.replays++;this.sample=0;this.phase='ready';this.emit();return{accepted:true,reason:'replay'};}
 setVolume(_:number){return{accepted:true,reason:"volume"};} subscribe(f:()=>void){this.listeners.add(f);return()=>{this.listeners.delete(f);};}
 async close(){this.closed=true;this.phase='closed';this.emit();if(this.closeGate)await this.closeGate;}
}
function setup(load:(id:string,signal:AbortSignal)=>Promise<ArrayBuffer>=async()=>new ArrayBuffer(1),firstIndex=0){let now=1000,changes=0;const transports:Audio[]=[];const s=new P062Session({now:()=>now,randomIndex:()=>firstIndex===0?0:firstIndex--,load,changed:()=>changes++,makeTransport:()=>{const a=new Audio();transports.push(a);return a;}});return{s,transports,advance:(n:number)=>{now+=n;s.tick();},changes:()=>changes};}
const qAudio={language:'en',questionId:1,option:null}as const;
test('P062 explicit audio only; pause then play restarts source Sound.start from zero; same active cue toggles off',async()=>{
 const x=setup();assert.equal(x.transports.length,0);assert.equal(await x.s.play(),false);assert(await x.s.audio(qAudio));const a=x.transports[0]!;a.sample=18000;x.advance(1234);x.s.pause();assert.equal(x.s.snapshot().elapsedDisplay,'00:00:01:23');x.advance(1000);assert.equal(x.s.snapshot().elapsedDisplay,'00:00:02:23');assert(await x.s.play());assert.equal(a.replays,1);assert.equal(a.sample,0);assert(await x.s.audio(qAudio));assert.equal(x.s.snapshot().audio,null);assert(a.closed);await x.s.close();
});
test('P062 different target/language replaces the sound; stale load cannot prepare or play',async()=>{
 const pending=deferred<ArrayBuffer>();const x=setup(id=>id==='en-q1-question'?pending.promise:Promise.resolve(new ArrayBuffer(1)));const first=x.s.audio(qAudio);assert.equal(x.s.snapshot().audio?.phase,'loading');assert(await x.s.audio({...qAudio,language:'es'}));pending.resolve(new ArrayBuffer(1));assert.equal(await first,false);assert(x.transports[0]!.closed);assert.equal(x.transports[0]!.prepared,0);assert.equal(x.s.snapshot().audio?.id,'es-q1-question');assert.equal(x.transports[1]!.plays,1);await x.s.close();assert(x.transports.every(a=>a.closed));
});
test('P062 source sound may finish across an answer transition; next question click replaces it',async()=>{
 const x=setup();await x.s.audio(qAudio);const a=x.transports[0]!;assert(x.s.choose(1,2));assert.equal(x.s.snapshot().state.currentQuestionId,2);assert.equal(x.s.snapshot().audio?.id,'en-q1-question');assert.equal(a.closed,false);assert.equal(await x.s.audio(qAudio),false);assert(await x.s.audio({...qAudio,questionId:2}));assert(a.closed);x.transports[1]!.phase='buffer-ended';x.transports[1]!.emit();assert.equal(x.s.snapshot().audio,null);await x.s.close();
});
test('P062 Replay and leave retire pending contexts, reset timer, and reject later stale callbacks',async()=>{
 for(const action of['replay','close']as const){const d=deferred<ArrayBuffer>();const x=setup(()=>d.promise);const pending=x.s.audio(qAudio);x.advance(4000);await x.s[action]();d.resolve(new ArrayBuffer(1));assert.equal(await pending,false);assert.equal(x.transports[0]!.plays,0);assert(x.transports[0]!.closed);assert.equal(x.s.snapshot().audio,null);if(action==='replay'){assert.equal(x.s.snapshot().elapsedMs,0);assert.equal(x.s.snapshot().state.responses.length,0);await x.s.close();}}
});
test('P062 only placed source audio controls are playable, and grade/report remain local at Finish',async()=>{
 assert.equal(p062AudioId({language:'en',questionId:27,option:4}),null);assert.equal(p062AudioId({language:'es',questionId:4,option:1}),null);assert.equal(p062AudioId({language:'es',questionId:27,option:null}),'es-q27-question');const x=setup();for(let n=1;n<=10;n++){x.advance(100);assert(x.s.choose(n,1));}const v=x.s.snapshot();assert.equal(v.state.phase,'finish');assert.equal(v.finishElapsedMs,1000);assert.equal(v.state.reportDispatchCount,2);assert.equal(v.lessonCompleted,false);assert.equal(await x.s.audio({...qAudio,questionId:10}),false);assert(await x.s.continue());assert.equal(x.s.snapshot().state.phase,'exited');assert.equal(await x.s.continue(),false);await x.s.close();
});
test('P062 a pending Continue cannot navigate after a newer Replay or leave',async()=>{
 const x=setup();await x.s.audio(qAudio);const gate=deferred<void>();x.transports[0]!.closeGate=gate.promise;for(let n=1;n<=10;n++)x.s.choose(n,1);const finish=x.s.continue();const replay=x.s.replay();gate.resolve();assert.equal(await finish,false);assert.equal(await replay,true);assert.equal(x.s.snapshot().state.phase,'question');await x.s.close();
});
test('P062 Replay clears the bank and continues drawing fresh questions without resetting random sequence',async()=>{
 const s=new P062Session({seed:0,load:async()=>new ArrayBuffer(1),changed:()=>{}});const first:number[]=[];for(let i=0;i<10;i++){const q=s.snapshot().state.currentQuestionId;first.push(q);s.choose(q,1);}await s.replay();const second:number[]=[];for(let i=0;i<10;i++){const q=s.snapshot().state.currentQuestionId;second.push(q);s.choose(q,1);}assert.equal(new Set(first).size,10);assert.equal(new Set(second).size,10);assert.notDeepEqual(first,second);assert.equal(s.snapshot().state.replay,1);await s.close();
});
