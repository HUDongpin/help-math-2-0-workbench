import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {P010_CONTINUOUS_AUDIO as P,p010ContinuousAudioSlice}
 from '../src/alg-l06-p010-audio-schedule-v1';

const root=new URL('../../../',import.meta.url);
const auditPath=new URL('migrations/shared-alg001-l06-p010/audit/audio-v1/audio-source-audit-v1.json',root);
const auditBytes=readFileSync(fileURLToPath(auditPath));
const audit=JSON.parse(auditBytes.toString());

test('schedule is bound to exact source extraction and measured decode',()=>{
 assert.equal(P.sourceSwfSha256,audit.source.swf.sha256);
 assert.equal(P.sourceAuditSha256,createHash('sha256').update(auditBytes).digest('hex'));
 assert.equal(P.sourceMp3Sha256,audit.embedded.extractedMp3.sha256);
 assert.equal(P.sourceMp3Bytes,audit.embedded.extractedMp3.bytes);
 assert.equal(P.sourceSaSha256,audit.decode.separateSaCopy.sha256);
 assert.equal(P.sourceSaDecodedSamples,audit.decode.separateSa.samples);
 assert.equal(P.measuredPcmSha256,audit.decode.main.sha256);
 assert.equal(P.decodedSamples,audit.decode.main.samples);
 assert.equal(P.initialSeekSamples,audit.swf.streamHead.initialLatencySamples);
 assert.equal(P.firstBlockFrame,audit.embedded.firstBlockFrame);
 assert.equal(P.lastBlockFrame,audit.embedded.lastBlockFrame);
 assert.equal(P.sourceCycleFrames,audit.swf.mainFrames);
 assert.deepEqual(P.zeroPayloadFrames,[5]);
 assert.deepEqual(P.absentBlockFramesWithinStream,[]);
 assert.equal(P.sourceStopActionPresent,false);
 assert.equal(P.visualWrapPolicyResolved,false);
 assert.equal(audit.scheduleCandidate.visualWrapPolicy,'unresolved-separate-source-audit');
});

test('all 300 packet starts and seeks account for the 550656 decoded samples',()=>{
 const packets=audit.embedded.packets;
 assert.equal(packets.length,300);
 let start=0;
 for(let i=0;i<packets.length;i++){
  const packet=packets[i];
  assert.equal(packet.frame,i+4);
  assert.equal(packet.declaredSampleStart,start);
  if(packet.frame>=6)
   assert.equal(packet.declaredSampleStart+packet.rawSeekSamples-
    (packet.frame-4)*audit.swf.streamHead.averageSamplesPerFrame,-164);
  start+=packet.declaredSamples;
 }
 assert.equal(start,P.decodedSamples);
 assert.equal(packets[1].mp3Bytes,0);
 assert.equal(packets[1].declaredSamples,0);
 assert.equal(packets.at(-1).frame,303);
});

test('one-cycle slices preserve initial seek, explicit preroll, resume and natural EOF',()=>{
 const first=p010ContinuousAudioSlice(0)!;
 assert.equal(first.delaySeconds,3/12);
 assert.equal(first.firstDecodedSample,1673);
 assert.equal(first.durationSeconds,(550656-1673)/22050);
 const atBlock=p010ContinuousAudioSlice(3/12)!;
 assert.equal(atBlock.delaySeconds,0);
 assert.equal(atBlock.firstDecodedSample,1673);
 const resumed=p010ContinuousAudioSlice(5/12)!;
 assert.equal(resumed.firstDecodedSample,1673+2/12*22050);
 assert(Math.abs(P.audioEndSeconds-(0.25+(550656-1673)/22050))<1e-12);
 assert(P.audioEndSeconds<P.lastFrameStartSeconds);
 assert.equal(p010ContinuousAudioSlice(P.audioEndSeconds),null);
 assert.equal(p010ContinuousAudioSlice(P.sourceCycleSeconds),null);
 assert.equal(P.sourceCycleSeconds,303/12);
});

test('invalid positions cannot imply a second loop or arbitrary source-frame seek',()=>{
 for(const position of [-1,Number.NaN,Number.POSITIVE_INFINITY,P.sourceCycleSeconds+1e-4])
  assert.throws(()=>p010ContinuousAudioSlice(position),/P010_INVALID_AUDIO_POSITION/);
 assert.equal(P.arbitrarySourceFrameSeekSupported,false);
 assert.equal(P.separateSaAutoplay,false);
 assert.equal(P.separateSaSpliced,false);
});
