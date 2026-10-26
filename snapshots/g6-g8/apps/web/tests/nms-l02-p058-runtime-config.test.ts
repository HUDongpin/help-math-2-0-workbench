import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {P058_MAIN_AUDIO,P058_RUNTIME_CONFIG} from '../components/nms-l02-p058-lesson-runtime-v1';
import {P058_SOURCE_TERMS} from '../../../packages/demos/src/generated/nms-l02-p058-terms-v1';
import {sourceGlossaryControlsAtFrame} from '../../../packages/demos/src/source-glossary-controls';
import {SourceLinearAudioController} from '../../../packages/demos/src/source-linear-audio';

const sha=(bytes:Uint8Array)=>createHash('sha256').update(bytes).digest('hex');
const audioIndexBytes=readFileSync(new URL(
 '../../../output/nms-l02-p058-audio-20260927/raw-index-v1.json',import.meta.url));
const audioIndex=JSON.parse(audioIndexBytes.toString('utf8'));

test('P058 runtime loads a callable teaching module with a ready first frame',async()=>{
 const module=await P058_RUNTIME_CONFIG.loadModule();
 assert(module&&module.key==='shared-nms002-l02-p058');
 assert.equal(typeof module.Renderer,'function');
 const state=module.getFrameState(1,{frame:1,frameDomain:'sprite-37',rootFrame:6,
  scenario:'source-static-frame',lang:'en',seed:0,replay:0}) as {status:string};
 assert.equal(state.status,'ready');
});

test('P058 audio configuration binds independently extracted sprite-37 stream, not separate SA',()=>{
 assert.equal(sha(audioIndexBytes),
  '16ebe7ff8d0ba39cb976a20e12f24b698d623024e44fdcf3236a6fdca45a9690');
 assert.equal(audioIndex.source.sha256,P058_RUNTIME_CONFIG.page.sourceSha256);
 assert.equal(audioIndex.stream.frameDomain,'sprite-37');
 assert.deepEqual(audioIndex.stream.blockFrameRange,{first:10,last:274,inclusive:true});
 assert.equal(audioIndex.stream.blockCount,265);
 assert.deepEqual(audioIndex.stream.emptyPayloadFrames,[11]);
 assert.equal(audioIndex.stream.header.mp3LatencySeek,1673);
 assert.equal(audioIndex.stream.declaredBlockSamples,486144);
 assert.equal(audioIndex.decode.decodedSamples,486144);
 assert.equal(audioIndex.decode.sampleRateHz,22050);
 assert.equal(audioIndex.decode.channels,1);
 assert.equal(audioIndex.decode.decodedDurationSeconds,486144/22050);
 assert.equal(audioIndex.decode.auditFfprobeDurationSeconds,21.944);
 const payload=readFileSync(new URL(
  '../../../output/nms-l02-p058-audio-20260927/embedded-source-stream-v1.mp3',import.meta.url));
 assert.equal(payload.length,109720);
 assert.equal(sha(payload),audioIndex.stream.payload.sha256);
 assert.equal(P058_MAIN_AUDIO.sha256,audioIndex.stream.payload.sha256);
 assert.equal(P058_MAIN_AUDIO.bytes,payload.length);
 assert.equal(P058_MAIN_AUDIO.sampleRate,22050);
 assert.equal(P058_MAIN_AUDIO.channels,1);
 assert.equal(P058_MAIN_AUDIO.decodedSamples,486144);
 assert(P058_MAIN_AUDIO.path.includes(P058_MAIN_AUDIO.sha256));
 assert(!P058_MAIN_AUDIO.path.includes('/SA/'));
 assert.notEqual(P058_MAIN_AUDIO.sha256,audioIndex.separateLessonSa.source.sha256);
});

test('P058 full-opacity control policy retains the one-frame second Show occurrence',()=>{
 const controls=(frame:number)=>sourceGlossaryControlsAtFrame(P058_RUNTIME_CONFIG.page,frame,'sprite-37');
 assert.equal(P058_RUNTIME_CONFIG.page.animationId,'shared-nms002-l02-p058');
 assert.equal(P058_RUNTIME_CONFIG.page.frameCount,274);
 assert.deepEqual([109,110,145,146,241,242,243,274].map(frame=>controls(frame).length),
  [0,1,1,5,5,7,6,6]);
 const at242=controls(242),at243=controls(243);
 assert.deepEqual(at242.filter(control=>control.entryId==='show').map(control=>control.characterId),[33,36]);
 assert.deepEqual(at243.filter(control=>control.entryId==='show').map(control=>control.characterId),[33]);
 assert.equal(new Set(at242.map(control=>control.id)).size,7,'two Show buttons retain distinct occurrence IDs');
 for(const control of at242){
  const matches=P058_SOURCE_TERMS.filter(term=>term.id===control.entryId);
  assert.equal(matches.length,1);
  assert.equal(matches[0]!.sourceKeyAttribute,control.sourceKeyAttribute);
 }
 const show=P058_SOURCE_TERMS.find(term=>term.id==='show');
 assert.deepEqual(show?.spanishLabelCollisionWith,['Display']);
 assert.equal(show?.labels.es,'Mostrar');
 assert.throws(()=>sourceGlossaryControlsAtFrame(P058_RUNTIME_CONFIG.page,242,'root'));
 assert.throws(()=>controls(275));
 assert.equal(P058_RUNTIME_CONFIG.createSpanish,undefined);
});

test('P058 transport has a source-length terminal schedule and no implicit audio work',async()=>{
 // Construction, seek, and Replay reset must work without WebAudio or fetch in Node.
 const transport=P058_RUNTIME_CONFIG.createTransport('http://127.0.0.1:3331');
 assert(transport instanceof SourceLinearAudioController);
 assert.equal(transport.snapshot().phase,'paused');
 assert.equal(transport.snapshot().frame,1);
 assert.equal(transport.config.frameCount,274);
 assert.equal(transport.config.audioStartFrame,10);
 assert.equal(transport.config.decodedSamples,audioIndex.decode.decodedSamples);
 assert.equal(transport.config.originalBlockHeaderSamples,audioIndex.stream.declaredBlockSamples);
 assert.equal(transport.config.sourceSwfSha256,audioIndex.source.sha256);
 assert.equal(transport.config.mp3Sha256,audioIndex.stream.payload.sha256);
 assert.equal(transport.config.audioStartTimelineSample,9*22050/12);
 assert.equal(transport.config.audioEndTimelineSample,9*22050/12+486144);
 assert.equal(transport.config.terminalTimelineSample,274*22050/12);
 assert(transport.config.audioEndTimelineSample<transport.config.terminalTimelineSample,
  'source-bound full buffer ends before the proposed terminal hold');
 transport.seekFrame(274);
 assert.equal(transport.snapshot().frame,274);
 assert.equal(transport.snapshot().phase,'paused');
 transport.reset();
 assert.equal(transport.snapshot().frame,1);
 assert.throws(()=>transport.seekFrame(275));
 await transport.close();
 assert.equal(transport.snapshot().phase,'closed');
});
