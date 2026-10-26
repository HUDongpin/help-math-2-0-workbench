import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {P044_AUDIO_PLANS,P044_WRONG_WINDOWS} from '../src/generated/nms-l02-p044-audio-plan-v1';
import {p044PrepareSourcePcm,p044WrongPcm,p044WrongWindow,type P044AudioDomain} from '../src/nms-l02-p044-audio-pcm-v1';
function source(domain:P044AudioDomain){const raw=readFileSync(new URL(`../../../migrations/shared-nms002-l02-p044/audit/sprite-${domain}-whole-pcm-v1.f32le`,import.meta.url));return new Float32Array(raw.buffer.slice(raw.byteOffset,raw.byteOffset+raw.byteLength));}
test('all four real PCM streams preserve every post-latency sample and insert only declared gaps',()=>{
  for(const domain of Object.keys(P044_AUDIO_PLANS)as P044AudioDomain[]){
    const plan=P044_AUDIO_PLANS[domain],samples=source(domain),before=samples.slice(),out=p044PrepareSourcePcm(domain,samples);let last=0;
    for(const segment of plan.segments){assert.ok(out.subarray(last,segment.outputStart).every(n=>n===0));assert.deepEqual(out.subarray(segment.outputStart,segment.outputEnd),samples.subarray(segment.sourceStart,segment.sourceEnd));last=segment.outputEnd;}
    assert.equal(last,out.length);assert.deepEqual(samples,before);
  }
  const main=p044PrepareSourcePcm('243',source('243'));assert.ok(main.subarray(30*22050).some(n=>Math.abs(n)>.1),'nonzero narration beyond frame361 retained');
});
test('four PCM branch windows partition feedback without overlap or dropped tails',()=>{
  const all=p044PrepareSourcePcm('242',source('242'));let last: number=P044_WRONG_WINDOWS[0].start;
  P044_WRONG_WINDOWS.forEach((w,i)=>{assert.equal(w.start,last);const branch=p044WrongPcm(all,i);assert.deepEqual(branch,all.subarray(w.start,w.end));assert.equal(branch.length,w.end-w.start);if(i>0)assert.ok(branch.subarray(w.authoredReturn-w.start).some(v=>v!==0));last=w.end;});
  assert.equal(last,all.length);assert.throws(()=>p044WrongWindow(4),/BRANCH/);assert.throws(()=>p044WrongPcm(new Float32Array(1),0),/PCM/);
});
test('bad sample count, silence and nonfinite decode fail before playback',()=>{
  assert.throws(()=>p044PrepareSourcePcm('243',new Float32Array(1)),/IDENTITY/);
  const samples=source('8');samples.fill(0);assert.throws(()=>p044PrepareSourcePcm('8',samples),/SILENT/);
  samples[0]=NaN;assert.throws(()=>p044PrepareSourcePcm('8',samples),/NONFINITE/);
});
