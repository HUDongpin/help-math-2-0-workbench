import test from'node:test';import assert from'node:assert/strict';import{readFileSync}from'node:fs';import{createHash}from'node:crypto';
import{P031_AUDIO_SOURCES}from'../src/nms-l02-p031-audio-source-v1';import{p031PrepareSourcePcm}from'../src/nms-l02-p031-audio-pcm-v1';
const T='/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222';
const plan=JSON.parse(readFileSync(T+'/nms-l02-p031-audio-plan-v1.json','utf8'));
test('all nine measured streams preserve every post-latency PCM sample exactly once',()=>{
 for(const[domain,s]of Object.entries(P031_AUDIO_SOURCES)){
  const evidence=plan.evidence.find((e:{domain:string})=>e.domain===domain);const raw=readFileSync(evidence.measured.path);assert.equal(createHash('sha256').update(raw).digest('hex'),evidence.measured.sha256);
  const pcm=new Float32Array(raw.buffer.slice(raw.byteOffset,raw.byteOffset+raw.byteLength));const prepared=p031PrepareSourcePcm(pcm,domain);assert.equal(prepared.length,s.totalSamples);assert.deepEqual(prepared.subarray(s.outputStartSample,s.outputEndSample),pcm.subarray(s.latencySamples));assert(prepared.subarray(0,s.outputStartSample).every(v=>v===0));assert(prepared.subarray(s.outputEndSample).every(v=>v===0));assert.equal(s.outputEndSample-s.outputStartSample,pcm.length-1673);
 }
 assert.equal(Object.values(P031_AUDIO_SOURCES).filter(s=>s.reachableInNativeQuiz).length,8);assert.equal(P031_AUDIO_SOURCES['202'].reachableInNativeQuiz,false);
});
test('PCM preparation rejects wrong domain, size, silence and nonfinite data',()=>{
 assert.throws(()=>p031PrepareSourcePcm(new Float32Array(1),'120'));assert.throws(()=>p031PrepareSourcePcm(new Float32Array(1),'242'));assert.throws(()=>p031PrepareSourcePcm(new Float32Array(P031_AUDIO_SOURCES['242'].decodedSamples),'242'));
 const data=new Float32Array(P031_AUDIO_SOURCES['242'].decodedSamples).fill(.2);data[99]=NaN;assert.throws(()=>p031PrepareSourcePcm(data,'242'));
});
