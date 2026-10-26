import test from 'node:test';
import assert from 'node:assert/strict';
import {P045SourceAudio} from '../src/nms-l02-p045-audio-v1';
import {P045_AUDIO_PLANS} from '../src/generated/nms-l02-p045-audio-plan-v1';
import {P045_FIXED_WINDOWS,P045_WRONG_WINDOWS} from '../src/generated/nms-l02-p045-audio-windows-v1';
import {p045Question} from '../src/nms-l02-p045-practice-v1';
const settle=()=>new Promise<void>(resolve=>setImmediate(resolve));
function fixture(read?: (domain:string,signal:AbortSignal)=>Promise<ArrayBuffer>){
  const obs={now:0,stops:0,closed:0,starts:[] as {offset:number;duration:number}[],reads:[] as string[]};
  const context={get currentTime(){return obs.now;},destination:{},createGain:()=>({gain:{value:0},connect(){},disconnect(){}}),resume:async()=>{},close:async()=>{obs.closed++;},
    createBufferSource:()=>({buffer:null,onended:null,connect(){},disconnect(){},start(_when:number,offset:number,duration:number){obs.starts.push({offset,duration});},stop(){obs.stops++;}})} as unknown as AudioContext;
  const audio=new P045SourceAudio({changed(){},createContext:()=>context,read:async(domain,signal)=>{obs.reads.push(domain);return read?read(domain,signal):new ArrayBuffer(0);},
    decode:async(_context,domain)=>({sampleRate:22050,duration:P045_AUDIO_PLANS[domain].totalSamples/22050}) as AudioBuffer},0);
  return {audio,obs};
}

test('intro window and pause resume stop at practice; explicit wrong Close controls reveal',async()=>{
 const {audio,obs}=fixture();await audio.play();assert.equal(obs.starts[0].duration,P045_FIXED_WINDOWS.intro.end/22050);obs.now=10;audio.pause();await audio.play();assert.equal(obs.starts.at(-1)!.offset,10);obs.now=100;assert.equal(audio.snapshot().state.phase,'ready');
 audio.check();await settle();const w=P045_WRONG_WINDOWS[0];assert.equal(obs.starts.at(-1)!.offset,w.start/22050);assert(Math.abs(obs.starts.at(-1)!.duration-(w.end-w.start)/22050)<1e-9);obs.now=200;assert.equal(audio.snapshot().state.phase,'wrong-feedback');audio.closeFeedback();assert.equal(audio.snapshot().state.phase,'ready');
 audio.check();await settle();assert.equal(audio.snapshot().state.phase,'wrong-feedback');audio.closeFeedback();await settle();assert.equal(audio.snapshot().state.phase,'answer-reveal');assert.equal(audio.snapshot().audioDomain,null);obs.now=203;assert.equal(audio.snapshot().state.phase,'awaiting-new');audio.replay();assert.equal(audio.snapshot().state.phase,'intro');assert.equal(audio.snapshot().elapsed,0);await audio.close();assert.equal(obs.closed,1);
});
test('last correct Close plays the retained main continuation window and stops at498',async()=>{
 const {audio,obs}=fixture();await audio.play();obs.now=100;audio.snapshot();for(let i=0;i<3;i++){const q=p045Question(audio.snapshot().state);audio.input('numerator',q.numerator);audio.input('denominator',q.denominator);audio.check();await settle();obs.now+=3;assert.equal(audio.snapshot().state.phase,'correct-feedback');audio.closeFeedback();await settle();if(i<2)audio.newWhole();}
 assert.equal(audio.snapshot().state.phase,'continuation');assert.equal(audio.snapshot().audioDomain,'204');assert.equal(obs.starts.at(-1)!.offset,P045_FIXED_WINDOWS.continuation.start/22050);assert(Math.abs(obs.starts.at(-1)!.duration-4)<1e-9);obs.now+=4;assert.equal(audio.snapshot().state.phase,'complete');assert.equal(audio.snapshot().state.frame,498);await audio.close();
});
test('Replay and close abort pending reads and prevent stale node creation',async()=>{
 let resolve:(b:ArrayBuffer)=>void=()=>{};let signal:AbortSignal|undefined;const {audio,obs}=fixture(async(_domain,s)=>{signal=s;return new Promise(r=>{resolve=r;});});const playing=audio.play();await settle();audio.replay();assert.equal(signal?.aborted,true);resolve(new ArrayBuffer(0));await playing;assert.equal(obs.starts.length,0);const again=audio.play();await settle();await audio.close();resolve(new ArrayBuffer(0));await again;assert.equal(obs.starts.length,0);assert.equal(obs.closed,1);
});
test('glossary pause preserves time, and closing modal does not silently resume playback',async()=>{
 const {audio,obs}=fixture();await audio.play();obs.now=3;audio.setModal(true);const elapsed=audio.snapshot().elapsed;obs.now=20;await audio.play();assert.equal(audio.snapshot().elapsed,elapsed);assert.equal(audio.snapshot().phase,'paused');audio.setModal(false);assert.equal(audio.snapshot().phase,'paused');await audio.play();assert.equal(obs.starts.at(-1)!.offset,3);await audio.close();
});
test('click effect is independent of narration clock and mute cancels pending effects',async()=>{
 const {audio,obs}=fixture();await audio.play();obs.now=2;const before=audio.snapshot().elapsed;await audio.clickEffect();assert.equal(audio.snapshot().elapsed,before);assert.equal(obs.starts.at(-1)!.duration,P045_AUDIO_PLANS['8'].totalSamples/22050);audio.pause();await audio.close();
 let resolve:(b:ArrayBuffer)=>void=()=>{};const f=fixture(async()=>new Promise(r=>{resolve=r;}));const pending=f.audio.clickEffect();await settle();f.audio.setNarration(false);resolve(new ArrayBuffer(0));await pending;assert.equal(f.obs.starts.length,0);await f.audio.close();
});
