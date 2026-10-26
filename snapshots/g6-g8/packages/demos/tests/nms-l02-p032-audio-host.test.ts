import test from'node:test';import assert from'node:assert/strict';import{readFileSync}from'node:fs';
import{p032PrepareSourcePcm}from'../src/nms-l02-p032-audio-v1';
import{getNmsL2P032FrameState as state,P032_ID}from'../src/nms-l02-p032-timeline-v1';
import{createP032TermHost,p032SourceTerm}from'../src/nms-l02-p032-term-host-v1';
const T='/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222',c={lang:'en'as const,seed:0};
test('native buffer matches independent complete source PCM plan and retains every postlatency sample once',()=>{
 const raw=readFileSync(T+'/nms-l02-p032-behavior-source-v1/audio/measured-source-v1/sprite-176/browser-full.f32le');const samples=new Float32Array(raw.buffer.slice(raw.byteOffset,raw.byteOffset+raw.byteLength));const prepared=p032PrepareSourcePcm(samples);
 assert.deepEqual(Buffer.from(prepared.buffer),readFileSync(T+'/nms-l02-p032-audio-plan-v1/prepared-mono-22050.f32le'));
 assert.equal(prepared.length,828713);assert(prepared.subarray(0,14700).every(x=>x===0));assert(prepared.subarray(826339).every(x=>x===0));assert.deepEqual(prepared.subarray(14700,826339),samples.subarray(1673));
 assert.throws(()=>p032PrepareSourcePcm(samples.subarray(1)));const invalid=samples.slice();invalid[42]=NaN;assert.throws(()=>p032PrepareSourcePcm(invalid));assert.throws(()=>p032PrepareSourcePcm(new Float32Array(samples.length)));
});
test('all three exact terms work from source main1 and retain release/source/domain boundaries',()=>{
 for(const id of['decimal','ones-group','place-value-chart']){
  const host=createP032TermHost(),q={type:'open-keyterm'as const,entryId:id,sourceAnimationId:P032_ID,playbackDisposition:'source-stop-timeline-and-audio-until-explicit-resume'as const};
  assert(p032SourceTerm(id)?.definitions.en&&p032SourceTerm(id)?.definitions.es);
  for(const f of[1,369,451]){assert.equal(host.dispatch(q,state(f,c)).status,'allowed');assert.equal(host.dispatch({type:'close-keyterm'},state(f,c)).status,'allowed');}
  assert.equal(host.dispatch({...q,entryId:'__proto__'},state(1,c)).status,'blocked');assert.equal(host.dispatch({...q,sourceAnimationId:'shared-nms002-l02-p030'},state(1,c)).status,'blocked');assert.equal(host.dispatch({...q,playbackDisposition:'reversible-support-pause'},state(1,c)).status,'blocked');assert.equal(host.dispatch(q,state(6,{...c,frameDomain:'root'})).status,'blocked');
 }
});
