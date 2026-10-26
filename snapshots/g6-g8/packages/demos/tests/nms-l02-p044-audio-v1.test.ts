import test from 'node:test';
import assert from 'node:assert/strict';
import {P044SourceAudio} from '../src/nms-l02-p044-audio-v1';
import {P044_AUDIO_PLANS,P044_WRONG_WINDOWS} from '../src/generated/nms-l02-p044-audio-plan-v1';
import {p044Question} from '../src/nms-l02-p044-practice-v1';
const settle=()=>new Promise<void>(resolve=>setImmediate(resolve));
function fixture(read?: (domain:string,signal:AbortSignal)=>Promise<ArrayBuffer>){
  const obs={now:0,stops:0,closed:0,starts:[] as {offset:number;duration:number}[],reads:[] as string[]};
  const context={get currentTime(){return obs.now;},destination:{},createGain:()=>({gain:{value:0},connect(){},disconnect(){}}),resume:async()=>{},close:async()=>{obs.closed++;},
    createBufferSource:()=>({buffer:null,onended:null,connect(){},disconnect(){},start(_when:number,offset:number,duration:number){obs.starts.push({offset,duration});},stop(){obs.stops++;}})} as unknown as AudioContext;
  const audio=new P044SourceAudio({changed(){},createContext:()=>context,read:async(domain,signal)=>{obs.reads.push(domain);return read?read(domain,signal):new ArrayBuffer(0);},
    decode:async(_context,domain)=>({sampleRate:22050,duration:P044_AUDIO_PLANS[domain].totalSamples/22050}) as AudioBuffer},0);
  return {audio,obs};
}
test('pause/resume preserves intro tail and wrong branch playback has exact offset/duration',async()=>{
  const {audio,obs}=fixture();await audio.play();obs.now=30.25;audio.pause();assert.equal(audio.snapshot().state.phase,'intro');
  await audio.play();assert.equal(obs.starts.at(-1)!.offset,30.25);obs.now=34;assert.equal(audio.snapshot().state.phase,'ready');
  audio.check();await settle();const w=P044_WRONG_WINDOWS[0];assert.deepEqual(obs.starts.at(-1),{offset:w.start/22050,duration:(w.end-w.start)/22050});
  obs.now=40;assert.equal(audio.snapshot().state.phase,'wrong-feedback');audio.closeFeedback();assert.equal(audio.snapshot().state.phase,'ready');
  audio.check();await settle();assert.equal(audio.snapshot().state.phase,'answer-reveal');obs.now=42;assert.equal(audio.snapshot().state.phase,'awaiting-new');
  audio.replay();assert.equal(audio.snapshot().state.phase,'intro');assert.equal(audio.snapshot().elapsed,0);await audio.close();assert.equal(obs.closed,1);
});
test('four correct feedback closes advance questions and silent continuation completes without audio read',async()=>{
  const {audio,obs}=fixture();await audio.play();obs.now=40;audio.snapshot();
  for(let i=0;i<4;i++){
    const q=p044Question(audio.snapshot().state);audio.parts(q.denominator);for(let n=1;n<=q.numerator;n++)audio.toggle(n);
    audio.check();await settle();obs.now+=3;assert.equal(audio.snapshot().state.phase,'correct-feedback');
    audio.closeFeedback();await settle();if(i<3){assert.equal(audio.snapshot().state.phase,'awaiting-new');audio.newWhole();}
  }
  assert.equal(audio.snapshot().state.phase,'continuation');assert.equal(audio.snapshot().audioDomain,null);const reads=obs.reads.length;
  obs.now+=3;assert.equal(audio.snapshot().state.phase,'complete');assert.equal(audio.snapshot().state.frame,393);assert.equal(obs.reads.length,reads);await audio.close();
});
test('Replay and close invalidate delayed reads; stale completion cannot start a node',async()=>{
  let resolve:(b:ArrayBuffer)=>void=()=>{};let signal:AbortSignal|undefined;
  const {audio,obs}=fixture(async(_domain,s)=>{signal=s;return new Promise(r=>{resolve=r;});});
  const playing=audio.play();await settle();assert.equal(audio.snapshot().phase,'loading');audio.replay();assert.equal(signal?.aborted,true);resolve(new ArrayBuffer(0));await playing;assert.equal(obs.starts.length,0);assert.equal(audio.snapshot().phase,'paused');
  const again=audio.play();await settle();await audio.close();resolve(new ArrayBuffer(0));await again;assert.equal(audio.snapshot().phase,'closed');assert.equal(obs.starts.length,0);assert.equal(obs.closed,1);
});
test('click effect shares volume but does not stop or restart narration time',async()=>{
  const {audio,obs}=fixture();await audio.play();obs.now=2;const before=audio.snapshot();const stops=obs.stops;
  await audio.clickEffect();assert.equal(obs.stops,stops);assert.equal(audio.snapshot().elapsed,before.elapsed);assert.equal(audio.snapshot().phase,'playing');
  assert.equal(obs.reads.at(-1),'8');assert.equal(obs.starts.at(-1)!.offset,0);
  assert.equal(obs.starts.at(-1)!.duration,P044_AUDIO_PLANS['8'].totalSamples/22050);
  audio.pause();assert.equal(obs.stops,stops+2);await audio.close();
});
test('muting or leaving invalidates a pending button effect and cannot revive stale audio',async()=>{
  let resolve:(value:ArrayBuffer)=>void=()=>{};
  const {audio,obs}=fixture(async()=>new Promise(r=>{resolve=r;}));
  const pending=audio.clickEffect();await settle();audio.setNarration(false);resolve(new ArrayBuffer(0));await pending;assert.equal(obs.starts.length,0);
  audio.setNarration(true);const next=audio.clickEffect();await settle();await audio.close();resolve(new ArrayBuffer(0));await next;assert.equal(obs.starts.length,0);assert.equal(obs.closed,1);
});
