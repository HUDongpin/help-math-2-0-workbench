import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {P008_CONTINUOUS_AUDIO as plan,p008ContinuousAudioSlice as slice}
 from '../src/alg-l06-p008-audio-schedule-v1';

const read=(file:string)=>readFileSync(new URL(`../../../${file}`,import.meta.url));
const sha=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');

test('schedule is bound to exact extracted source and measured decoder facts',()=>{
 const bytes=read('migrations/shared-alg001-l06-p008/audit/audio-v1/audio-source-audit-v1.json');
 assert.equal(sha(bytes),plan.sourceAuditSha256);
 const audit=JSON.parse(bytes.toString());
 const mp3=read('migrations/shared-alg001-l06-p008/audit/audio-v1/continuous-source-v1.mp3');
 assert.equal(mp3.length,plan.sourceMp3Bytes);assert.equal(sha(mp3),plan.sourceMp3Sha256);
 assert.equal(audit.source.swf.sha256,plan.sourceSwfSha256);
 assert.equal(audit.embedded.firstBlockFrame,plan.firstBlockFrame);
 assert.equal(audit.embedded.lastBlockFrame,plan.lastFrame);
 assert.equal(audit.embedded.packets[0].rawSeekSamples,plan.initialSeekSamples);
 assert.equal(audit.decode.main.samples,plan.decodedSamples);
 assert.equal(audit.decode.main.sha256,plan.measuredPcmSha256);
 assert.equal(audit.source.separateSa.sha256,plan.sourceSaSha256);
 assert.equal(audit.source.separateSa.bytes,plan.sourceSaBytes);
 assert.deepEqual(audit.embedded.absentBlockFrames,[...plan.absentBlockFrames]);
 assert.deepEqual(audit.embedded.zeroPayloadBlocks.map((b:{frame:number})=>b.frame),
  [...plan.zeroPayloadFrames]);
 assert.equal(audit.embedded.zeroPayloadBlocks[1].frame,plan.negativeRawSeekFrame);
 assert.equal(audit.embedded.zeroPayloadBlocks[1].seek,-2185);
 assert.equal(audit.decode.mainWindowsByVisualFrameCandidate.find((w:{frame:number})=>w.frame===573)
  .nonzeroSamples>0,true,'decoded signal crosses the absent-packet interval');
 assert.equal(audit.limits.audioAccepted,false);
});

test('owned elapsed time maps one continuous stream across delayed start and packet gap',()=>{
 const initial=slice(0)!;
 assert.equal(initial.delaySeconds,1.5);
 assert.equal(initial.firstDecodedSample,1673);
 assert.equal(slice(plan.audioStartSeconds)!.delaySeconds,0);
 assert.equal(slice(plan.audioStartSeconds)!.firstDecodedSample,1673);
 const atFrame=(frame:number)=>slice((frame-1)/plan.fps)!;
 for(const frame of [568,569,573,577,578]){
  const actual=atFrame(frame);
  assert.equal(actual.delaySeconds,0);
  assert.equal(actual.firstDecodedSample,
   1673+((frame-1)/12-plan.audioStartSeconds)*22050);
 }
 assert(Math.abs(atFrame(578).firstDecodedSample-atFrame(568).firstDecodedSample-
  10*22050/12)<1e-6,'no synthetic pause or second start at packet gap');
 assert.equal(slice(plan.audioEndSeconds),null);
 assert.equal(slice((plan.lastFrame-1)/plan.fps),null);
 for(const value of [-1,NaN,Infinity,(plan.lastFrame-1)/plan.fps+1/12])
  assert.throws(()=>slice(value));
 assert.equal(plan.separateSaTriggerVerified,false);
});
