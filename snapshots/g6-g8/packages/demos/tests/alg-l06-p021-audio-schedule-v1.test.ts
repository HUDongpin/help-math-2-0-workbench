import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {P021_AUDIO_ASSETS,P021_SA_ASSET,P021_AUDIO_DISPOSITION,
  P021_NATIVE_AUDIO_END_POSITION,P021_AUDIO_END_POSITION,p021AudioSlice}
  from '../src/alg-l06-p021-audio-schedule-v1';

const root=new URL('../../../',import.meta.url);
const bytes=(file:string)=>readFileSync(new URL(file,root));
const sha=(value:Uint8Array)=>createHash('sha256').update(value).digest('hex');

test('P021 maintained schedule matches independently extracted source and Chrome PCM',()=>{
 const plan=JSON.parse(bytes('output/alg-l06-p021-audio-v1/audio-plan-v1.json').toString());
 assert.equal(plan.kind,'alg-l06-p021-maintained-audio-plan-v1');
 assert.deepEqual(plan.mainAssets,P021_AUDIO_ASSETS);
 assert.deepEqual(plan.optionalSpanishAudio,P021_SA_ASSET);
 assert.equal(P021_AUDIO_ASSETS.length,1);
 const main=P021_AUDIO_ASSETS[0];
 assert.equal(sha(bytes(main.sourcePath)),main.sourceSha256);
 assert.equal(bytes(main.sourcePath).length,main.sourceBytes);
 assert.equal(sha(bytes(P021_SA_ASSET.sourcePath)),P021_SA_ASSET.sourceSha256);
 const receiptBytes=bytes(plan.browserDecode.path);
 assert.equal(sha(receiptBytes),plan.browserDecode.sha256);
 assert.equal(plan.browserDecode.sha256,main.receiptSha256);
 const receipt=JSON.parse(receiptBytes.toString());
 assert.deepEqual(receipt.results.map((r:{decodedSamples:number;pcmSha256:string})=>
  [r.decodedSamples,r.pcmSha256]),[
  [main.decodedSamples,main.pcmSha256],
  [P021_SA_ASSET.decodedSamples,P021_SA_ASSET.pcmSha256]]);
 assert(receipt.results.every((r:{playbackStarted:boolean})=>r.playbackStarted===false));
});

test('one contiguous source and measured EOF before last visual frame 377',()=>{
 assert.deepEqual(P021_AUDIO_DISPOSITION.mainRanges,[[7,377]]);
 assert.deepEqual(P021_AUDIO_DISPOSITION.sourceZeroPayloadBlockFrames,[8]);
 assert.equal(P021_AUDIO_DISPOSITION.sourceHasNegativeSeek,false);
 assert.equal(P021_AUDIO_DISPOSITION.syntheticSilenceAdded,false);
 assert.equal(P021_AUDIO_DISPOSITION.separateSaSpliced,false);
 assert.equal(P021_AUDIO_DISPOSITION.localeStartsAudio,false);
 const start=p021AudioSlice('main-1',1);assert(start);
 assert.equal(start.firstDecodedSample,1673);
 assert.equal(start.delaySeconds,6/12);
 assert.equal(start.durationSeconds,(680832-1673)/22050);
 assert(Math.abs(P021_NATIVE_AUDIO_END_POSITION-376.6103401360544)<1e-9);
 assert.equal(P021_AUDIO_END_POSITION,377);
 assert.equal(p021AudioSlice('main-1',377),null);
 assert.equal(p021AudioSlice('main-1',P021_NATIVE_AUDIO_END_POSITION),null);
});

test('fractional pause seeks measured sample and refuses outside source visual domain',()=>{
 const position=200.25,slice=p021AudioSlice('main-1',position);
 assert(slice);assert.equal(slice.delaySeconds,0);
 assert(Math.abs(slice.firstDecodedSample-(1673+(position-7)*22050/12))<1e-8);
 assert.throws(()=>p021AudioSlice('main-1',0),/P021_INVALID_MAIN_AUDIO_POSITION/u);
 assert.throws(()=>p021AudioSlice('main-1',377.001),/P021_INVALID_MAIN_AUDIO_POSITION/u);
 assert.throws(()=>p021AudioSlice('main-1',Number.NaN),/P021_INVALID_MAIN_AUDIO_POSITION/u);
});
