import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {P045_AUDIO_PLANS,P045_MAIN_BOUNDARIES} from '../src/generated/nms-l02-p045-audio-plan-v1';
import {p045PrepareSourcePcm,type P045AudioDomain} from '../src/nms-l02-p045-audio-pcm-v1';
function pcm(domain:P045AudioDomain){const b=readFileSync(new URL(`../../../migrations/shared-nms002-l02-p045/audit/sprite-${domain}-whole-pcm-v1.f32le`,import.meta.url));return new Float32Array(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength));}
test('all four real decoded streams retain every post-latency sample and source gap',()=>{
 for(const domain of Object.keys(P045_AUDIO_PLANS)as P045AudioDomain[]){const input=pcm(domain),plan=P045_AUDIO_PLANS[domain],output=p045PrepareSourcePcm(domain,input);assert.equal(output.length,plan.totalSamples);let cursor=0;
  for(const segment of plan.segments){assert(output.subarray(cursor,segment.outputStart).every(x=>x===0));assert.deepEqual(output.subarray(segment.outputStart,segment.outputEnd),input.subarray(segment.sourceStart,segment.sourceEnd));cursor=segment.outputEnd;}
  assert.equal(plan.segments.reduce((n,s)=>n+s.sourceEnd-s.sourceStart,0),input.length-1673);
 }
});
test('main split preserves nonzero post-practice content and a separately retained terminal tail',()=>{
 const output=p045PrepareSourcePcm('204',pcm('204')),b=P045_MAIN_BOUNDARIES;
 assert.equal(b.practiceBoundary,825038);assert.equal(b.terminalBoundary-b.practiceBoundary,88200);assert.equal(b.fullEnd-b.terminalBoundary,1477);assert(output.subarray(b.practiceBoundary,b.terminalBoundary).some(x=>Math.abs(x)>.1));assert.equal(output.length,b.fullEnd);
});
test('invalid decoded input is rejected without normalizing or inventing sound',()=>{
 assert.throws(()=>p045PrepareSourcePcm('204',new Float32Array(1)));assert.throws(()=>p045PrepareSourcePcm('8',new Float32Array(8640)),/SILENT/);const input=pcm('8');input[0]=NaN;assert.throws(()=>p045PrepareSourcePcm('8',input),/NONFINITE/);assert.throws(()=>p045PrepareSourcePcm('__proto__' as P045AudioDomain,pcm('8')),/DOMAIN/);
});
