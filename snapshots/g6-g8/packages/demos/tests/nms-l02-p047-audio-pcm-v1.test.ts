import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {P047_AUDIO_PLANS,P047_MAIN_BOUNDARIES} from '../src/generated/nms-l02-p047-audio-plan-v1';
import {p047PrepareSourcePcm,type P047AudioDomain} from '../src/nms-l02-p047-audio-pcm-v1';
function pcm(domain:P047AudioDomain){const b=readFileSync(new URL(`../../../migrations/shared-nms002-l02-p047/audit/sprite-${domain}-source-pcm-v1.f32le`,import.meta.url));return new Float32Array(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength));}
test('all three decoded source streams retain each post-latency sample and authored gap',()=>{
 for(const domain of Object.keys(P047_AUDIO_PLANS)as P047AudioDomain[]){const input=pcm(domain),plan=P047_AUDIO_PLANS[domain],output=p047PrepareSourcePcm(domain,input);assert.equal(output.length,plan.totalSamples);let cursor=0;
  for(const segment of plan.segments){assert(output.subarray(cursor,segment.outputStart).every(x=>x===0));assert.deepEqual(output.subarray(segment.outputStart,segment.outputEnd),input.subarray(segment.sourceStart,segment.sourceEnd));cursor=segment.outputEnd;}
  assert.equal(plan.segments.reduce((n,s)=>n+s.sourceEnd-s.sourceStart,0),input.length-1673);
 }
});
test('main continuation remains audible and the omitted terminal tail remains preserved and silent',()=>{
 const input=pcm('81'),output=p047PrepareSourcePcm('81',input),b=P047_MAIN_BOUNDARIES;
 assert.equal(b.terminalBoundary-b.practiceBoundary,88200);assert.equal(b.fullEnd-b.terminalBoundary,1220);
 assert(output.subarray(b.practiceBoundary,b.terminalBoundary).some(x=>Math.abs(x)>.1));assert(output.subarray(b.terminalBoundary).every(x=>x===0));
 // Source samples exceeding unit amplitude are retained, not normalized away.
 assert(input.some(x=>Math.abs(x)>1));assert(output.some(x=>Math.abs(x)>1));
});
test('wrong shape, silence, nonfinite samples and unbound domains fail closed',()=>{
 assert.throws(()=>p047PrepareSourcePcm('81',new Float32Array(1)),/LENGTH/);
 assert.throws(()=>p047PrepareSourcePcm('78',new Float32Array(P047_AUDIO_PLANS['78'].decodedSamples)),/SILENT/);
 for(const value of [NaN,Infinity,-Infinity]){const input=pcm('78');input[0]=value;assert.throws(()=>p047PrepareSourcePcm('78',input),/NONFINITE/);}
 assert.throws(()=>p047PrepareSourcePcm('__proto__' as P047AudioDomain,pcm('78')),/DOMAIN/);
});
