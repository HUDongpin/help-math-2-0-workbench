import assert from 'node:assert/strict';
import test from 'node:test';
import {p028PrepareSourcePcm,P028SourceAudio} from '../src/nms-l02-p028-audio-v1';
import {P028_AUDIO_SOURCE as SOURCE} from '../src/nms-l02-p028-audio-source-v1';
test('P028 frame4 audio placement preserves every post-latency sample once',()=>{
  const pcm=Float32Array.from({length:359424},(_,i)=>Math.sin(i/37)*.2);
  const before=pcm.slice();const output=p028PrepareSourcePcm(pcm);
  assert.deepEqual(pcm,before);assert.equal(output.length,Math.ceil(199*22050/12));
  assert.equal(SOURCE.segments[0].outputStartSample,Math.round(3*22050/12));
  assert(output.subarray(0,5513).every(v=>v===0));
  assert.deepEqual(output.subarray(5513,363264),pcm.subarray(1673));
  assert(output.subarray(363264).every(v=>v===0));
  assert.throws(()=>p028PrepareSourcePcm(pcm.subarray(1)));
  assert.throws(()=>p028PrepareSourcePcm(new Float32Array(359424)));
  const corrupt=pcm.slice();corrupt[12000]=NaN;assert.throws(()=>p028PrepareSourcePcm(corrupt));
});
test('P028 cancel during suspended activation cannot read or start stale audio',async()=>{
  let resume:()=>void=()=>{},reads=0,closed=0;
  const context={sampleRate:22050,state:'running',currentTime:0,resume:()=>new Promise<void>(resolve=>resume=resolve),close:async()=>{closed++;}} as unknown as AudioContext;
  const audio=new P028SourceAudio({createContext:()=>context,read:async()=>{reads++;return new ArrayBuffer(0);},changed:()=>{}});
  const pending=audio.play();assert.equal(audio.snapshot().phase,'loading');
  audio.pause();resume();assert.equal(await pending,false);assert.equal(reads,0);assert.equal(audio.snapshot().phase,'paused');
  audio.setNarrationEnabled(false);assert.equal(audio.snapshot().narrationEnabled,false);
  audio.setVolume(.3);assert.equal(audio.snapshot().volume,.3);
  await audio.close();assert.equal(closed,1);assert.equal(audio.snapshot().phase,'closed');assert.equal(await audio.replay(),false);
});
