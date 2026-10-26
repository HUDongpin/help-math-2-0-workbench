import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {P019_AUDIO_ASSETS,P019_SA_ASSET,P019_AUDIO_DISPOSITION,
  P019_NATIVE_AUDIO_END_POSITION,P019_AUDIO_END_POSITION,p019AudioSlice}
  from '../src/alg-l06-p019-audio-schedule-v1';

const root=new URL('../../../',import.meta.url);
const bytes=(file:string)=>readFileSync(new URL(file,root));
const sha=(value:Uint8Array)=>createHash('sha256').update(value).digest('hex');

test('P019 maintained schedule matches independently extracted source and Chrome PCM',()=>{
 const plan=JSON.parse(bytes('output/alg-l06-p019-audio-v1/audio-plan-v1.json').toString());
 assert.equal(plan.kind,'alg-l06-p019-maintained-audio-plan-v1');
 assert.deepEqual(plan.mainAssets,P019_AUDIO_ASSETS);
 assert.deepEqual(plan.optionalSpanishAudio,P019_SA_ASSET);
 assert.equal(P019_AUDIO_ASSETS.length,1);
 const main=P019_AUDIO_ASSETS[0];
 assert.equal(sha(bytes(main.sourcePath)),main.sourceSha256);
 assert.equal(bytes(main.sourcePath).length,main.sourceBytes);
 assert.equal(sha(bytes(P019_SA_ASSET.sourcePath)),P019_SA_ASSET.sourceSha256);
 const receiptBytes=bytes(plan.browserDecode.path);
 assert.equal(sha(receiptBytes),plan.browserDecode.sha256);
 assert.equal(plan.browserDecode.sha256,main.receiptSha256);
 const receipt=JSON.parse(receiptBytes.toString());
 assert.deepEqual(receipt.results.map((r:{decodedSamples:number;pcmSha256:string})=>
  [r.decodedSamples,r.pcmSha256]),[
  [main.decodedSamples,main.pcmSha256],
  [P019_SA_ASSET.decodedSamples,P019_SA_ASSET.pcmSha256]]);
 assert(receipt.results.every((r:{playbackStarted:boolean})=>r.playbackStarted===false));
});

test('one contiguous source and measured EOF before last visual frame 351',()=>{
 assert.deepEqual(P019_AUDIO_DISPOSITION.mainRanges,[[2,351]]);
 assert.deepEqual(P019_AUDIO_DISPOSITION.sourceZeroPayloadBlockFrames,[3]);
 assert.equal(P019_AUDIO_DISPOSITION.sourceHasNegativeSeek,false);
 assert.equal(P019_AUDIO_DISPOSITION.syntheticSilenceAdded,false);
 assert.equal(P019_AUDIO_DISPOSITION.separateSaSpliced,false);
 assert.equal(P019_AUDIO_DISPOSITION.localeStartsAudio,false);
 const start=p019AudioSlice('main-1',1);assert(start);
 assert.equal(start.firstDecodedSample,1673);
 assert.equal(start.delaySeconds,1/12);
 assert.equal(start.durationSeconds,(642240-1673)/22050);
 assert(Math.abs(P019_NATIVE_AUDIO_END_POSITION-350.6078911564626)<1e-9);
 assert.equal(P019_AUDIO_END_POSITION,351);
 assert.equal(p019AudioSlice('main-1',351),null);
 assert.equal(p019AudioSlice('main-1',P019_NATIVE_AUDIO_END_POSITION),null);
});

test('fractional pause seeks measured sample and refuses outside source visual domain',()=>{
 const position=200.25,slice=p019AudioSlice('main-1',position);
 assert(slice);assert.equal(slice.delaySeconds,0);
 assert(Math.abs(slice.firstDecodedSample-(1673+(position-2)*22050/12))<1e-8);
 assert.throws(()=>p019AudioSlice('main-1',0),/P019_INVALID_MAIN_AUDIO_POSITION/u);
 assert.throws(()=>p019AudioSlice('main-1',351.001),/P019_INVALID_MAIN_AUDIO_POSITION/u);
 assert.throws(()=>p019AudioSlice('main-1',Number.NaN),/P019_INVALID_MAIN_AUDIO_POSITION/u);
});
