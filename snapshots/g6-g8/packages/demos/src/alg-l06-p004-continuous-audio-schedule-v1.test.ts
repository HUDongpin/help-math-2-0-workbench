import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {P004_CONTINUOUS_AUDIO as plan,p004ContinuousAudioSlice as slice} from './alg-l06-p004-continuous-audio-schedule-v1';
const read=(file:string)=>readFileSync(new URL(`../../../${file}`,import.meta.url));
test('candidate stream alignment binds first authored packet and both browser decodes',()=>{
 const audit=JSON.parse(read('migrations/shared-alg001-l06-p004/audit/source-audit-v1.json').toString());
 const receiptBytes=read('output/alg-l06-p004-audio-alignment-20260928/browser-native-v1/main-02/result.json');
 assert.equal(createHash('sha256').update(receiptBytes).digest('hex'),plan.measuredPcmReceiptSha256);
 const receipt=JSON.parse(receiptBytes.toString());
 assert.equal(audit.source.sha256,plan.sourceSwfSha256);
 assert.equal(audit.stream.mp3.sha256,plan.sourceSha256);
 assert.equal(audit.stream.blocks[0].frame,1);assert.equal(audit.stream.blocks[0].seek,plan.initialSeekSamples);
 assert.equal(receipt.status,'technical-measurement-pass-not-audio-acceptance');
 for(const run of receipt.runs){assert.equal(run.sampleCount,plan.decodedSamples);assert.equal(run.sampleRate,plan.sampleRate);assert.equal(run.pcmF32leSha256,plan.measuredPcmSha256);}
 assert.equal(receipt.runs.length,2);
});
test('learner resume stays in the continuous decoded stream through empty packets and postroll',()=>{
 const audit=JSON.parse(read('migrations/shared-alg001-l06-p004/audit/source-audit-v1.json').toString());
 const start=slice(0)!;assert.equal(start.firstDecodedSample,1673);
 for(const block of audit.stream.blocks.filter((row:{mp3Bytes:number})=>row.mp3Bytes===0)){
  const seconds=(block.frame-1)/12;if(seconds>=plan.audioEndSeconds)continue;
  const actual=slice(seconds)!;assert(actual);assert.equal(actual.delaySeconds,0);
  assert.equal(actual.firstDecodedSample,1673+seconds*22050);
 }
 const resume=slice(20.25)!;assert.equal(resume.firstDecodedSample,start.firstDecodedSample+20.25*22050);
 assert.equal(slice(plan.audioEndSeconds),null);assert.equal(slice(830/12),null);
 for(const value of [-1,NaN,Infinity,831/12])assert.throws(()=>slice(value));
});
