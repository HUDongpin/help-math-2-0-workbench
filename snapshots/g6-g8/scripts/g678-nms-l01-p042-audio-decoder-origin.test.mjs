import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,symlink,link,readFile} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {METHOD,SOURCE,assertSource,parseArgs,physicalBinding,pcmFromBytes,alignedMetrics,findOrigin,assertMeasuredOrigin} from './g678-nms-l01-p042-audio-decoder-origin.mjs';

const samples=(length,seed=1234567)=>{const result=new Float32Array(length);for(let i=0;i<length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;result[i]=(seed/2**32-.5)*.5;}return result;};
test('one exact bounded CLI run; reject path escapes, duplicates and unsupported options',()=>{
  assert.equal(parseArgs(['--run','v1']),'v1');for(const args of [[],['--run','../v1'],['--run','v0'],['--output','v1'],['--run','v1','--run','v2']])assert.throws(()=>parseArgs(args));
});
test('measurement pins preserve source latency without applying it as decoder trim',()=>{
  assert.equal(SOURCE.bytes,48880);assert.equal(METHOD.sourceLatencyField,1673);assert.equal(METHOD.primingAdjustmentApplied,0);
  assert.match(METHOD.equation,/positive lag/);assert.equal(METHOD.lagRadiusNativeSamples,4096);
});
test('actual source pin and altered/truncated/extended bytes fail closed',async()=>{
  const bytes=await readFile(path.resolve(SOURCE.path));assertSource(bytes);
  const altered=Buffer.from(bytes);altered[300]^=1;
  for(const b of [altered,bytes.subarray(1),Buffer.concat([bytes,Buffer.from([0])])])assert.throws(()=>assertSource(b));
});
test('canonical ordinary-file guard rejects symlinks and hardlinks',async()=>{
  const root=await mkdtemp(path.join(os.tmpdir(),'p042-audio-origin-test-')),file=path.join(root,'plain');
  await writeFile(file,'test',{flag:'wx'});assert.equal((await physicalBinding(await import('node:fs/promises').then(m=>m.realpath(file)))).bytes,4);
  await symlink(file,path.join(root,'alias'));await assert.rejects(physicalBinding(path.join(root,'alias')));
  await link(file,path.join(root,'hard'));await assert.rejects(physicalBinding(file));
});
test('float32 decoder rejects empty, partial, NaN and Infinity payloads',()=>{
  for(const bytes of [Buffer.alloc(0),Buffer.alloc(3)])assert.throws(()=>pcmFromBytes(bytes));
  for(const value of [NaN,Infinity]){const b=Buffer.alloc(4);b.writeFloatLE(value);assert.throws(()=>pcmFromBytes(b));}
  const b=Buffer.alloc(4);b.writeFloatLE(.125);assert.equal(pcmFromBytes(b)[0],.125);
});
test('same PCM maps zero exactly and records full extent',()=>{
  const ref=samples(8000),result=findOrigin(ref,ref,22050,{radius:64,stride:7});assertMeasuredOrigin(result,0);
  assert.equal(result.fullOverlap.rmse,0);assert.equal(result.fullOverlap.sampleCount,8000);
  assert.deepEqual(result.fullOverlap.excluded,{referencePrefix:0,referenceSuffix:0,candidatePrefix:0,candidateSuffix:0});
});
test('positive origin means browser starts later, negative means browser prefix; exclusions explicit',()=>{
  const ref=samples(8000),later=ref.slice(17),positive=findOrigin(ref,later,22050,{radius:64,stride:7});assertMeasuredOrigin(positive,17);
  assert.deepEqual(positive.fullOverlap.excluded,{referencePrefix:17,referenceSuffix:0,candidatePrefix:0,candidateSuffix:0});
  const prefixed=new Float32Array(8023);prefixed.set(ref,23);
  const negative=findOrigin(ref,prefixed,22050,{radius:64,stride:7});assertMeasuredOrigin(negative,-23);
  assert.equal(negative.fullOverlap.excluded.candidatePrefix,23);
  assert.throws(()=>assertMeasuredOrigin(positive,-17));assert.throws(()=>alignedMetrics(ref,later,1.25));
});
test('prefix/suffix exclusion cannot be hidden by perfect overlap',()=>{
  const ref=samples(8000),short=ref.slice(10,-25),m=alignedMetrics(ref,short,10);
  assert.equal(m.rmse,0);assert.equal(m.excluded.referencePrefix,10);assert.equal(m.excluded.referenceSuffix,25);
});
test('wrong signal, flat silence and gain difference cannot claim resolved mapping',()=>{
  const ref=samples(8000);
  for(const candidate of [samples(8000,98765),new Float32Array(8000),Float32Array.from(ref,x=>x*2)]){
    const result=findOrigin(ref,candidate,22050,{radius:64,stride:7});assert.equal(result.status,'unresolved');assert.throws(()=>assertMeasuredOrigin(result,result.lagSamples));
  }
});
test('a match at search boundary is unresolved, not evidence for an unbounded origin',()=>{
  const ref=samples(8000),result=findOrigin(ref,ref.slice(64),22050,{radius:64,stride:7});
  assert.equal(result.lagSamples,64);assert.equal(result.status,'unresolved');
});
test('native/device search radii preserve at least the declared physical interval',()=>{
  const ref=samples(24000),m=findOrigin(ref,ref,48000);
  assertMeasuredOrigin(m,0);assert.equal(m.search.maximumLag,Math.ceil(4096*48000/22050));
  assert.ok(m.physicalRadiusMs>=4096/22050*1000);assert.ok(m.physicalRadiusMs<4096/22050*1000+1000/48000);
});
test('too-short or invalid-rate/radius inputs reject before origin calculation',()=>{
  for(const rate of [0,NaN,22050.5,500000])assert.throws(()=>findOrigin(samples(8000),samples(8000),rate));
  assert.throws(()=>findOrigin(samples(300),samples(300),22050,{radius:64}));
  for(const radius of [0,-1,.5,50000])assert.throws(()=>findOrigin(samples(8000),samples(8000),22050,{radius}));
});
