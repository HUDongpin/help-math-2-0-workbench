import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {buildP052AudioPlan,p052FrameSample,prepareP052CandidatePcm} from './nms-l02-p052-audio-plan-v1.mjs';
const read=n=>JSON.parse(fs.readFileSync(new URL(`../../migrations/shared-nms002-l02-p052/audit/${n}`,import.meta.url)));
const source=read('source-audio-streams-v1.json'),packets=read('source-packet-audit-v1.json');
const pair=domain=>[source.streams.find(s=>s.domain===domain),packets.streams.find(s=>s.domain===domain)];
test('one-indexed sample clock uses ties-to-even and rejects invalid frames',()=>{
 assert.deepEqual([1,2,3,4,5].map(p052FrameSample),[0,1838,3675,5512,7350]);
 for(const n of [0,-1,1.5,NaN,Infinity])assert.throws(()=>p052FrameSample(n));
});
for(const s of source.streams)test(`${s.domain}: every retained sample preserved once; source gap remains separate`,()=>{
 const [a,p]=pair(s.domain),plan=buildP052AudioPlan(a,p,p.decodedSamples);
 const input=Float32Array.from({length:p.decodedSamples},(_,i)=>i+1),out=prepareP052CandidatePcm(plan,input);
 let total=0;for(const seg of plan.segments){assert.deepEqual(out.subarray(seg.outputStart,seg.outputEnd),input.subarray(seg.sourceStart,seg.sourceEnd));total+=seg.sourceEnd-seg.sourceStart;}
 assert.equal(total,input.length-1673);assert.equal(plan.frame102ReplacementSamples,0);
 for(let i=plan.segments[0].outputEnd;i<plan.segments[1].outputStart;i++)assert.equal(out[i],0);
});
test('exact source mismatch stays visible at frame103 and onward',()=>{
 const [s,p]=pair('sprite-350'),plan=buildP052AudioPlan(s,p,p.decodedSamples);
 assert.equal(plan.sourceSampleCountMismatch,576);
 assert.equal(plan.comparisons.find(a=>a.frame===102).declaredMinusActual,0);
 assert.equal(plan.comparisons.find(a=>a.frame===103).declaredMinusActual,576);
 assert.equal(plan.comparisons.find(a=>a.frame===116).actualPacketSourceStart,184797);
});
test('mutated packet count, source tag, placement, channel and decoded length fail closed',()=>{
 const [s,p]=pair('sprite-350');
 for(const mutate of [x=>x[0].head.channels=2,x=>x[0].blocks.find(b=>b.frame===102).tagSha256='bad',x=>x[1].blocks.find(b=>b.frame===102).decodedSamples=1728,x=>x[1].blocks.find(b=>b.frame===103).decodedStart++,x=>x[1].blocks.find(b=>b.frame===102).frame=101]){
  const args=structuredClone([s,p]);mutate(args);assert.throws(()=>buildP052AudioPlan(...args,p.decodedSamples));
 }
 assert.throws(()=>buildP052AudioPlan(s,p,p.decodedSamples+1));
});
test('PCM rejects missing tail, overlap, nonfinite input and wrong length',()=>{
 const [s,p]=pair('sprite-347'),plan=buildP052AudioPlan(s,p,p.decodedSamples),input=new Float32Array(p.decodedSamples);
 for(const mutate of [x=>x.segments[1].sourceStart++,x=>x.segments[1].sourceEnd--,x=>x.segments[1].outputStart=0,x=>x.totalSamples--]){const bad=structuredClone(plan);mutate(bad);assert.throws(()=>prepareP052CandidatePcm(bad,input));}
 assert.throws(()=>prepareP052CandidatePcm(plan,input.subarray(1)));
 input[100]=NaN;assert.throws(()=>prepareP052CandidatePcm(plan,input));
});
