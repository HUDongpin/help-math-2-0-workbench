import test from 'node:test';
import assert from 'node:assert/strict';
import {P048PageRuntimeV1} from './alg-l06-p048-audio-runtime-v1';
import type {SourceAudioId} from './source-stream-audio-owner-v1';
import type {DecodedStreamPhase,DecodedStreamSnapshot} from './decoded-source-stream-transport';
class Track {
 phase:DecodedStreamPhase='idle';epoch=0;cursor=0;anchor:number|null=null;volume=1;closed=0;
 delays:number[]=[];starts=0;reject=false;pending:Promise<void>|null=null;
 constructor(readonly now:()=>number){}
 async prepare(){this.epoch++;this.phase='ready';this.cursor=0;this.anchor=null;return {accepted:true,reason:'ready'};}
 async play(policy:{activation:'user'|'automatic';reducedMotion:boolean;delaySeconds?:number}){
  const epoch=++this.epoch;this.phase='start-pending';if(this.pending)await this.pending;
  if(epoch!==this.epoch)return {accepted:false,reason:'stale'};
  if(this.reject){this.phase='play-rejected';return {accepted:false,reason:'autoplay rejected'};}
  this.delays.push(policy.delaySeconds??0);this.anchor=this.now()+(policy.delaySeconds??0);this.phase='playing';this.starts++;
  return {accepted:true,reason:'playing'};
 }
 pause(){this.cursor=this.snapshot().decodedSample;this.epoch++;this.phase='paused';this.anchor=null;return {accepted:true,reason:'paused'};}
 replay(){this.epoch++;this.phase='ready';this.cursor=0;this.anchor=null;return {accepted:true,reason:'replayed'};}
 setVolume(v:number){this.volume=v;return {accepted:true,reason:'volume'};}
 snapshot():DecodedStreamSnapshot{return {phase:this.phase,epoch:this.epoch,decodedSample:this.cursor+(this.anchor===null?0:Math.max(0,this.now()-this.anchor)*22050),contextTime:this.now(),heldContextTime:null,playbackAnchor:this.anchor===null?null:{contextTime:this.anchor,decodedSample:this.cursor},elapsedMs:0,volume:this.volume,failure:null,sourceAlignment:'unresolved',lessonCompleted:false};}
 async close(){this.closed++;this.epoch++;this.phase='closed';this.anchor=null;}
}
const flush=async()=>{for(let i=0;i<16;i++)await Promise.resolve();};
function fixture(){
 let now=0;const tracks={} as Record<SourceAudioId,Track>,loads:SourceAudioId[]=[],terms:string[]=[];
 const page=new P048PageRuntimeV1({load:async id=>{loads.push(id);return new ArrayBuffer(1);},onGlossary:t=>terms.push(t),
  makeTransport:(_b,id)=>tracks[id]=new Track(()=>now),resumeEnded:async()=>true});
 const step=async(seconds:number)=>{now+=seconds;page.tick();await flush();};
 const send=(type:string,fields:Record<string,unknown>={})=>page.send({type,epoch:page.snapshot().state.epoch,quizGeneration:page.snapshot().state.quizGeneration,...fields});
 const quiz=async()=>{assert.equal(await page.start(),true);page.play();await flush();await step(223/12);assert.equal(page.snapshot().state.phase,'quiz-held');};
 return {page,tracks,loads,terms,step,send,quiz};
}
async function wrong(f:ReturnType<typeof fixture>,choice:'B'|'C'|'D'){
 assert.equal(f.send('choose',{choice}).accepted,true);await flush();
 await f.step(20/12);assert.equal(f.page.snapshot().state.feedback?.frame,22);
 const token=f.page.snapshot().state.feedback!.token;
 assert.equal(f.send('close-wrong',{token}).accepted,true);await flush();await f.step(8/12);
}
test('P048 owns source onset delay, exclusive feedback, two attempts, main continuation and EOF tail',async()=>{
 const f=fixture();await f.quiz();assert.deepEqual(f.loads,['main','wrong4','right4']);assert.equal(f.tracks.main.delays[0],11/12);
 await wrong(f,'B');assert.equal(f.page.snapshot().state.quizTryCount,1);assert.equal(f.tracks.wrong4.delays[0],1/12);
 assert.equal(f.tracks.main.phase,'paused');await wrong(f,'D');assert.equal(f.page.snapshot().state.mainFrame,225);
 assert.equal(f.page.snapshot().audio.owner,'main');assert.equal(f.page.snapshot().state.quizTryCount,0);
 f.tracks.main.phase='buffer-ended';await f.step(102/12);assert.equal(f.page.snapshot().state.mainFrame,327);
 assert.equal(f.page.snapshot().visualClockRunning,false);assert.equal(f.page.snapshot().lessonCompleted,false);
 await f.page.close();for(const t of Object.values(f.tracks))assert.equal(t.closed,1);
});
test('P048 pause before stream onset preserves fractional visual cursor and remaining silence',async()=>{
 const f=fixture();await f.page.start();f.page.play();await flush();await f.step(5.5/12);f.page.pause();
 assert.equal(f.page.snapshot().state.mainFrame,6);assert.equal(f.page.snapshot().state.paused,true);assert.equal(f.tracks.main.cursor,0);
 await f.step(100);f.page.play();await flush();assert(Math.abs(f.tracks.main.delays[1]!-5.5/12)<1e-9);
 await f.step(217.5/12);assert.equal(f.page.snapshot().state.mainFrame,224);await f.page.close();
});
test('P048 help glossary return retains first attempt, while main glossary is explicitly resumable',async()=>{
 const f=fixture();await f.quiz();await wrong(f,'C');f.send('open-nmh');f.send('glossary',{buttonId:137});
 assert.deepEqual(f.terms,['Graph']);f.send('close-glossary');assert.equal(f.page.snapshot().state.phase,'nmh-popup');
 assert.equal(f.page.snapshot().state.quizTryCount,1);f.send('close-nmh');f.send('choose',{choice:'A'});await flush();
 assert.equal(f.tracks.right4.delays[0],0);await f.step(23/12);assert.equal(f.page.snapshot().state.quizTryCount,1);
 f.send('glossary',{buttonId:158});f.send('close-glossary');const frame=f.page.snapshot().state.mainFrame;
 await f.step(50);assert.equal(f.page.snapshot().state.mainFrame,frame);f.page.play();await flush();await f.step(1);
 assert(f.page.snapshot().state.mainFrame>frame);await f.page.close();
});
test('P048 SA load/start is explicit, holds source clocks, returns held, and Replay cancels it',async()=>{
 const f=fixture();await f.quiz();assert(!f.loads.includes('sa'));assert.equal(await f.page.startSpanish(),true);
 assert.equal(f.page.snapshot().audio.owner,'sa');await f.step(100);assert.equal(f.page.snapshot().state.mainFrame,224);
 assert.equal(f.send('choose',{choice:'A'}).accepted,false);assert.equal(f.page.returnMain(),true);
 assert.equal(f.page.snapshot().visualClockRunning,false);f.send('choose',{choice:'A'});await flush();
 await f.page.startSpanish();assert.equal(f.page.replay(),true);assert.equal(f.page.snapshot().state.mainFrame,1);
 assert.equal(f.page.snapshot().spanishSelected,false);assert.equal(f.tracks.sa.phase,'ready');await f.page.close();
});
test('P048 Replay rejects pending feedback start and stale Close',async()=>{
 const f=fixture();await f.quiz();let resolve!:()=>void;f.tracks.wrong4.pending=new Promise<void>(r=>resolve=r);
 f.send('choose',{choice:'B'});await flush();const token=f.page.snapshot().state.feedback!.token;
 f.page.replay();resolve();await flush();assert.equal(f.page.snapshot().state.mainFrame,1);
 assert.equal(f.page.snapshot().visualClockRunning,false);assert.notEqual(f.tracks.wrong4.phase,'playing');
 assert.equal(f.send('close-wrong',{token}).accepted,false);await f.page.close();
});
test('P048 browser start rejection holds state and explicit Play recovers',async()=>{
 const f=fixture();await f.page.start();f.tracks.main.reject=true;f.page.play();await flush();
 assert.match(f.page.snapshot().failure??'',/rejected/);assert.equal(f.page.snapshot().state.paused,true);
 f.tracks.main.reject=false;f.page.play();await flush();assert.equal(f.page.snapshot().failure,null);
 await f.step(223/12);assert.equal(f.page.snapshot().state.phase,'quiz-held');await f.page.close();
});
test('P048 a late frame observation clamps quiz and feedback stops before main resumes',async()=>{
 const f=fixture();await f.page.start();f.page.play();await flush();await f.step(100);
 assert.equal(f.page.snapshot().state.mainFrame,224);f.send('choose',{choice:'A'});await flush();await f.step(100);
 assert.equal(f.page.snapshot().state.mainFrame,225);await f.step(1);assert.equal(f.page.snapshot().state.mainFrame,237);await f.page.close();
});
