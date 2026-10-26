import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {buildP052AudioWindows,p052WrongBranch,p052WindowResume} from './nms-l02-p052-audio-windows-v1.mjs';
import {p052FrameSample,prepareP052CandidatePcm} from './nms-l02-p052-audio-plan-v1.mjs';
const root=new URL('../../',import.meta.url),audit=new URL('migrations/shared-nms002-l02-p052/audit/',root);
const plans=JSON.parse(fs.readFileSync(new URL('native-audio-plan-v1.json',audit))).plans;
const windows=buildP052AudioWindows(plans),get=id=>windows.find(w=>w.id===id);
test('main pause/resume partitions complete buffer without dropping stop-frame audio',()=>{
 const a=get('intro'),b=get('outro'),plan=plans.find(p=>p.domain==='sprite-350');
 assert.equal(a.startSample,0);assert.equal(a.endSample,p052FrameSample(115));assert.equal(a.endSample,b.startSample);
 assert.equal(b.endSample,plan.totalSamples);assert.equal(a.samples+b.samples,plan.totalSamples);
 assert.equal(a.visualEnd,115);assert.equal(b.visualStart,116);assert.equal(b.visualEnd,156);
});
test('four wrong branches partition from S1 through complete tail with no next-branch overlap',()=>{
 const branch=[1,2,3,4].map(n=>get(`wrong-S${n}`));
 assert.equal(branch[0].startSample,p052FrameSample(3));
 for(let i=0;i<3;i++)assert.equal(branch[i].endSample,branch[i+1].startSample);
 assert.equal(branch.at(-1).endSample,plans.find(p=>p.domain==='sprite-349').totalSamples);
 assert.deepEqual(branch.map(b=>b.sourceReturnFrame),[16,27,36,54]);
});
test('callbacks do not truncate nonzero correct/last-wrong tails',()=>{
 assert.ok(get('correct').endSample>p052FrameSample(20));assert.ok(get('wrong-S4').endSample>p052FrameSample(55));
});
test('real PCM: no post-latency main sample is lost across pause seam',()=>{
 const plan=plans.find(p=>p.domain==='sprite-350'),raw=fs.readFileSync(new URL(plan.input.path,root));
 const input=Float32Array.from({length:raw.length/4},(_,i)=>raw.readFloatLE(i*4));
 const out=prepareP052CandidatePcm(plan,input),a=get('intro'),b=get('outro');
 const rejoined=new Float32Array(out.length);rejoined.set(out.subarray(a.startSample,a.endSample));rejoined.set(out.subarray(b.startSample,b.endSample),a.samples);
 assert.deepEqual(rejoined,out);
});
test('resume and repeated pause never advance past cue end',()=>{
 for(const w of windows)for(const n of [0,1,w.samples-1,w.samples,w.samples+100]){
  const r=p052WindowResume(w,n);assert.equal(r.startSample,w.startSample+Math.min(n,w.samples));assert.equal(r.remainingSamples,Math.max(0,w.samples-n));assert.equal(r.ended,n>=w.samples);
 }
 for(const n of [-1,1.5,NaN,Infinity])assert.throws(()=>p052WindowResume(get('intro'),n));
});
test('seeded branches repeat on Replay and cover all four choices',()=>{
 const all=new Set();for(let seed=0;seed<128;seed++)for(let attempt=0;attempt<16;attempt++){
  const id=p052WrongBranch(seed,attempt);assert.equal(id,p052WrongBranch(seed,attempt));assert.ok(get(id));all.add(id);
 }
 assert.equal(all.size,4);for(const n of [-1,1.5,NaN,Infinity,0x100000000])assert.throws(()=>p052WrongBranch(n,0));
});
test('duplicate/missing domains and changed PCM lengths rejected',()=>{
 assert.throws(()=>buildP052AudioWindows(plans.slice(1)));
 assert.throws(()=>buildP052AudioWindows([...plans,plans[0]]));
 const bad=structuredClone(plans);bad[5].totalSamples++;assert.throws(()=>buildP052AudioWindows(bad));
});
