import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {exactZeroNativeRemainder} from './g678-source-vm-audio-windows-v1.mjs';
import {exactZeroOutputTailWindow} from './g678-actual-audio-collector-v1.mjs';

function fixture(channels=1) {
  const samples=20000,bytes=Buffer.alloc(samples*channels*4);
  for(let i=0;i<19000*channels;i++)bytes.writeFloatLE(.2,i*4);
  const pin={path:'/private/native.f32le',bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')};
  const cue={id:'cue',source:{path:'/source.mp3',bytes:5,sha256:'a'.repeat(64)},sourcePCM:pin,sampleRate:48000,channels,sourceFirstDecodedSample:0,sourceEndDecodedSample:samples};
  const start={nodeId:'node1',contextId:'context1',offset:0,effectiveWhen:10,contextTime:10,atMs:100,unixMs:1000};
  const stop={nodeId:'node1',contextId:'context1',stopped:true,effectiveWhen:10+19800.9/48000,contextTime:11,atMs:900,unixMs:1800};
  return{cue,nativePcm:{pin,bytes},start,stops:[stop]};
}
function repin(f) {f.cue.sourcePCM.sha256=createHash('sha256').update(f.nativePcm.bytes).digest('hex');}
test('digital-silence remainder keeps full range and observed stop facts without causal acceptance',()=>{
  const f=fixture(),r=exactZeroNativeRemainder(f);
  assert.equal(r.firstOmittedDecodedSample,19800);assert.equal(r.endDecodedSample,20000);
  assert.equal(r.fullSourceRangeUnchanged,true);assert.equal(r.nativeSourceEndedNaturally,false);
  assert.equal(r.sourceStopCausality,'not-established-by-audio-output-comparison');assert.deepEqual(r.observedStops,f.stops);
});
test('partial boundary sample is included using floor',()=>{
  const f=fixture();f.nativePcm.bytes.writeFloatLE(.00000001,19800*4);repin(f);
  assert.throws(()=>exactZeroNativeRemainder(f),/NONZERO_REFERENCE_SAMPLE/);
});
test('any nonzero tail sample rejects without an RMS tolerance',()=>{
  const f=fixture();f.nativePcm.bytes.writeFloatLE(1e-40,19999*4);repin(f);
  assert.throws(()=>exactZeroNativeRemainder(f),/NONZERO_REFERENCE_SAMPLE/);
});
test('stereo channels are checked independently',()=>{
  const f=fixture(2);f.nativePcm.bytes.writeFloatLE(.1,(19999*2+1)*4);repin(f);
  assert.throws(()=>exactZeroNativeRemainder(f),/NONZERO_REFERENCE_SAMPLE/);
});
for(const value of [NaN,Infinity,-Infinity])test('nonfinite omitted PCM rejects '+value,()=>{
  const f=fixture();f.nativePcm.bytes.writeFloatLE(value,19999*4);repin(f);assert.throws(()=>exactZeroNativeRemainder(f),/NONZERO_REFERENCE_SAMPLE/);
});
test('changed PCM bytes cannot use a historical zero-tail pin',()=>{
  const f=fixture();f.nativePcm.bytes.writeFloatLE(.1,19999*4);assert.throws(()=>exactZeroNativeRemainder(f),/PINNED_NATIVE_PCM/);
});
test('a source subrange cannot masquerade as the complete cue',()=>{
  const f=fixture();f.cue.sourceFirstDecodedSample=1;assert.throws(()=>exactZeroNativeRemainder(f),/COMPLETE_NATIVE_SOURCE_RANGE/);
});
for(const mutation of [f=>f.stops[0].nodeId='foreign',f=>f.stops[0].contextId='foreign',f=>f.stops[0].atMs=99,f=>f.stops[0].effectiveWhen=9,f=>f.stops[0].effectiveWhen=12,f=>f.stops[0].unixMs+=10])test('unbound or unobserved stop rejects '+mutation,()=>{
  const f=fixture();mutation(f);assert.throws(()=>exactZeroNativeRemainder(f),/ACTUAL_SAME_NODE_STOP/);
});
test('earliest of multiple observed stops governs all omitted samples',()=>{
  const f=fixture();f.stops.push({...f.stops[0],effectiveWhen:10+18999/48000});assert.throws(()=>exactZeroNativeRemainder(f),/NONZERO_REFERENCE_SAMPLE/);
});
function outputFixture() {
  const f=fixture(),remainder=exactZeroNativeRemainder(f),declared={id:'complete',kind:'audible',startUnixMs:1000,mediaInstanceId:'player1',triggerEventId:'click1'};
  return{remainder,cue:f.cue,declared,afterUnixMs:2000,policy:{edgeTrimMs:0,maxAlignmentMs:250,minimumWindowMs:200},
    measured:{id:'complete',status:'PASS',startUnixMs:1000,sourceSha256:f.cue.source.sha256,sourceMatch:{passed:true,alignmentFrames:240,frames:20000,overlap:1,
      sourceWindow:{pcmSha256:f.cue.sourcePCM.sha256,firstDecodedSample:0,endDecodedSample:20000,sampleRate:48000,channels:1}}}};
}
test('actual tail window uses measured full-source alignment and covers the entire remainder',()=>{
  const f=outputFixture(),r=exactZeroOutputTailWindow(f);
  assert.equal(r.startUnixMs,1005+19800/48);assert.equal(r.endUnixMs,1005+20000/48+200);
  assert.equal(r.kind,'silent');assert.equal(r.mediaInstanceId,'player1');
});
for(const mutation of [f=>f.measured.sourceMatch.frames--,f=>f.measured.sourceMatch.overlap=.999,
  f=>f.measured.sourceMatch.alignmentFrames=12001,f=>f.policy.edgeTrimMs=1,
  f=>f.measured.sourceMatch.sourceWindow.firstDecodedSample=1,f=>f.measured.sourceMatch.sourceWindow.channels=2,
  f=>f.measured.status='FAIL',f=>f.measured.sourceMatch.passed=false])test('partial or changed full match cannot authorize tail '+mutation,()=>{
  const f=outputFixture();mutation(f);assert.throws(()=>exactZeroOutputTailWindow(f),/COMPLETE_UNTRIMMED_SOURCE_MATCH/);
});
test('tail beyond observed owner flow rejects',()=>{
  const f=outputFixture();f.afterUnixMs=1500;assert.throws(()=>exactZeroOutputTailWindow(f),/OBSERVED_OWNER_FLOW/);
});
