import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {P013_CONTINUOUS_AUDIO as plan,p013ContinuousAudioSlice as slice} from '../src/alg-l06-p013-audio-schedule-v1';
const root=new URL('../../../',import.meta.url);
test('P013 schedule binds exact measured source and exposes unresolved packet semantics',()=>{
 const bytes=readFileSync(new URL('migrations/shared-alg001-l06-p013/audit/audio-v1/audio-source-audit-v1.json',root));
 assert.equal(createHash('sha256').update(bytes).digest('hex'),plan.sourceAuditSha256);
 const audit=JSON.parse(bytes.toString());
 assert.equal(plan.sourceMp3Sha256,audit.embedded.extractedMp3.sha256);
 assert.equal(plan.decodedSamples,audit.decode.main.samples);
 assert.equal(plan.sourceSaDecodedSamples,audit.decode.separateSa.samples);
 assert.deepEqual(plan.negativeRawSeekFrames,audit.embedded.zeroPayloadBlocks.filter((x:{seek:number})=>x.seek<0).map((x:{frame:number})=>x.frame));
 assert.equal(plan.sourceHasNegativeSeek,true);assert.equal(plan.negativeSeekSemanticsResolved,false);
 assert.equal(plan.sourceStopActionPresent,false);assert.equal(plan.separateSaAutoplay,false);assert.equal(plan.separateSaSpliced,false);
});
test('P013 candidate starts one source stream after frame-one visual lead, at source latency',()=>{
 const first=slice(0)!;assert.equal(first.delaySeconds,1/12);assert.equal(first.firstDecodedSample,1673);
 assert.equal(first.durationSeconds,(672192-1673)/22050);
});
test('P013 zero/missing packet frames remain within continuous candidate without invented silence',()=>{
 for(const frame of [3,161,252,253,254,255,256]){
  const t=(frame-1)/12,r=slice(t)!;assert(r);assert.equal(r.delaySeconds,0);
  assert(Math.abs(r.firstDecodedSample-(1673+(frame-2)*22050/12))<1e-8);
  assert(Math.abs((r.firstDecodedSample+22050*r.durationSeconds)-672192)<1e-8);
 }
});
test('P013 decoder EOF holds visual tail; invalid source positions do not become seeks',()=>{
 assert.equal(slice(plan.audioEndSeconds),null);assert.equal(slice(371/12),null);
 for(const t of [-1,NaN,Infinity,372/12])assert.throws(()=>slice(t),/INVALID_AUDIO_POSITION/);
});
