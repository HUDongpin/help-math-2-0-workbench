import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {P046_AUDIO_PLANS,P046_MAIN_BOUNDARIES} from '../src/generated/nms-l02-p046-audio-plan-v1';
import {p046PrepareSourcePcm,type P046AudioDomain} from '../src/nms-l02-p046-audio-pcm-v1';
function pcm(domain:P046AudioDomain){const b=readFileSync(new URL(`../../../migrations/shared-nms002-l02-p046/audit/sprite-${domain}-whole-pcm-v1.f32le`,import.meta.url));return new Float32Array(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength));}
test('all six real decoded streams retain every post-latency sample and source gap',()=>{
 for(const domain of Object.keys(P046_AUDIO_PLANS)as P046AudioDomain[]){const input=pcm(domain),plan=P046_AUDIO_PLANS[domain],output=p046PrepareSourcePcm(domain,input);assert.equal(output.length,plan.totalSamples);let cursor=0;
  for(const segment of plan.segments){assert(output.subarray(cursor,segment.outputStart).every(x=>x===0));assert.deepEqual(output.subarray(segment.outputStart,segment.outputEnd),input.subarray(segment.sourceStart,segment.sourceEnd));cursor=segment.outputEnd;}
  assert.equal(plan.segments.reduce((n,s)=>n+s.sourceEnd-s.sourceStart,0),input.length-1673);
 }
});
test('main split preserves nonzero post-practice content and a separately retained terminal tail',()=>{
 const output=p046PrepareSourcePcm('205',pcm('205')),b=P046_MAIN_BOUNDARIES;
 assert.equal(b.practiceBoundary,1199888);assert.equal(b.terminalBoundary-b.practiceBoundary,95550);assert.equal(b.fullEnd-b.terminalBoundary,1303);assert(output.subarray(b.practiceBoundary,b.terminalBoundary).some(x=>Math.abs(x)>.1));assert.equal(output.length,b.fullEnd);
});
test('invalid decoded input is rejected without normalizing or inventing sound',()=>{
 assert.throws(()=>p046PrepareSourcePcm('205',new Float32Array(1)));assert.throws(()=>p046PrepareSourcePcm('8',new Float32Array(8640)),/SILENT/);const input=pcm('8');input[0]=NaN;assert.throws(()=>p046PrepareSourcePcm('8',input),/NONFINITE/);assert.throws(()=>p046PrepareSourcePcm('__proto__' as P046AudioDomain,pcm('8')),/DOMAIN/);
});
