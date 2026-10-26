import test from 'node:test';
import assert from 'node:assert/strict';
import {P047SourceAudio} from '../src/nms-l02-p047-audio-v1';
import {P047_AUDIO_PLANS} from '../src/generated/nms-l02-p047-audio-plan-v1';
import {P047_FIXED_WINDOWS,P047_WRONG_WINDOWS} from '../src/generated/nms-l02-p047-audio-windows-v1';
import {P047_CARDS} from '../src/nms-l02-p047-practice-v1';
const settle=()=>new Promise<void>(resolve=>setImmediate(resolve));
function fixture(read?: (domain:string,signal:AbortSignal)=>Promise<ArrayBuffer>){
  const obs={now:0,stops:0,closed:0,starts:[] as {offset:number;duration:number}[],reads:[] as string[]};
  const context={get currentTime(){return obs.now;},destination:{},createGain:()=>({gain:{value:0},connect(){},disconnect(){}}),resume:async()=>{},close:async()=>{obs.closed++;},
    createBufferSource:()=>({buffer:null,onended:null,connect(){},disconnect(){},start(_when:number,offset:number,duration:number){obs.starts.push({offset,duration});},stop(){obs.stops++;}})} as unknown as AudioContext;
  const audio=new P047SourceAudio({changed(){},createContext:()=>context,read:async(domain,signal)=>{obs.reads.push(domain);return read?read(domain,signal):new ArrayBuffer(0);},
    decode:async(_context,domain)=>({sampleRate:22050,duration:P047_AUDIO_PLANS[domain].totalSamples/22050}) as AudioBuffer},0);
  return {audio,obs};
}

test('intro pauses and resumes exact offset; wrong feedback returns automatically after its tail',async()=>{
 const {audio,obs}=fixture();await audio.play();assert.equal(obs.starts[0].duration,P047_FIXED_WINDOWS.intro.end/22050);obs.now=2;audio.pause();obs.now=20;await audio.play();assert.equal(obs.starts.at(-1)!.offset,2);obs.now=100;assert.equal(audio.snapshot().state.phase,'ready');
 audio.select(1);audio.drop(0);await settle();const w=P047_WRONG_WINDOWS[audio.snapshot().wrongBranch];assert.equal(obs.starts.at(-1)!.offset,w.start/22050);obs.now+=(w.end-w.start)/22050;assert.equal(audio.snapshot().state.phase,'ready');assert.deepEqual(audio.snapshot().state.matched,[]);await audio.close();
});
test('all matches automatically progress through silent celebration and exact continuation',async()=>{
 const {audio,obs}=fixture();await audio.play();obs.now=100;audio.snapshot();
 for(const card of P047_CARDS){audio.select(card.id);audio.drop(card.tick);await settle();assert.equal(audio.snapshot().audioDomain,'78');obs.now+=10;audio.snapshot();await settle();}
 assert.equal(audio.snapshot().state.phase,'celebration');assert.equal(audio.snapshot().phase,'playing');const starts=obs.starts.length;assert.equal(audio.snapshot().audioDomain,null);
 obs.now+=23/12;audio.snapshot();await settle();assert.equal(audio.snapshot().state.phase,'continuation');assert.equal(obs.starts.length,starts+1);assert.equal(obs.starts.at(-1)!.offset,P047_FIXED_WINDOWS.continuation.start/22050);assert(Math.abs(obs.starts.at(-1)!.duration-4)<1e-9);
 obs.now+=4;assert.equal(audio.snapshot().state.completed,true);assert.equal(audio.snapshot().state.frame,188);assert.equal(obs.reads.filter(x=>x==='81').length,1);await audio.close();assert.equal(obs.closed,1);
});
test('Replay and close abort pending reads and suppress stale playback',async()=>{
 let resolve:(b:ArrayBuffer)=>void=()=>{};let signal:AbortSignal|undefined;const {audio,obs}=fixture(async(_domain,s)=>{signal=s;return new Promise(r=>{resolve=r;});});
 const pending=audio.play();await settle();audio.replay();assert.equal(signal?.aborted,true);resolve(new ArrayBuffer(0));await pending;assert.equal(obs.starts.length,0);
 const again=audio.play();await settle();await audio.close();resolve(new ArrayBuffer(0));await again;assert.equal(obs.starts.length,0);assert.equal(obs.closed,1);await audio.close();assert.equal(obs.closed,1);
});
test('modal pause preserves position and closing modal does not implicitly resume',async()=>{
 const {audio,obs}=fixture();await audio.play();obs.now=3;audio.setModal(true);obs.now=100;await audio.play();assert.equal(audio.snapshot().elapsed,3);audio.setModal(false);assert.equal(audio.snapshot().phase,'paused');await audio.play();assert.equal(obs.starts.at(-1)!.offset,3);await audio.close();
});
test('pause exactly at final feedback boundary prevents automatic successor playback',async()=>{
 const {audio,obs}=fixture();await audio.play();obs.now=100;audio.snapshot();
 for(const card of P047_CARDS){audio.select(card.id);audio.drop(card.tick);await settle();obs.now+=10;if(card.id===4)audio.pause();else audio.snapshot();}
 await settle();assert.equal(audio.snapshot().state.phase,'celebration');assert.equal(audio.snapshot().phase,'paused');assert.equal(audio.snapshot().elapsed,0);await audio.play();assert.equal(audio.snapshot().phase,'playing');await audio.close();
});
test('narration mute retains clock progress and unmute resumes the current audio offset',async()=>{
 const {audio,obs}=fixture();await audio.play();obs.now=2;audio.setNarration(false);const starts=obs.starts.length;obs.now=3;assert.equal(audio.snapshot().elapsed,3);assert.equal(obs.starts.length,starts);audio.setNarration(true);assert.equal(obs.starts.at(-1)!.offset,3);audio.setVolume(0);assert.equal(audio.snapshot().volume,0);await audio.close();
});
test('read failure stays recoverable through Replay without claiming playback',async()=>{
 const {audio,obs}=fixture(async()=>{throw Error('P047_TEST_LOAD');});await audio.play();assert.equal(audio.snapshot().phase,'failed');assert.equal(obs.starts.length,0);audio.replay();assert.equal(audio.snapshot().failure,null);assert.equal(audio.snapshot().phase,'paused');await audio.close();
});
