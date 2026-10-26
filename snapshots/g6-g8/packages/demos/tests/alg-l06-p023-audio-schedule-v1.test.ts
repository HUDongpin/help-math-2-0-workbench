import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {P023_AUDIO_ASSETS,P023_SA_ASSET,P023_AUDIO_DISPOSITION,
  P023_AUDIO_BROWSER_RECEIPT_SHA256,P023_AUDIO_PLAN_V2_SHA256,P023_NATIVE_AUDIO_END_POSITION,
  P023_AUDIO_END_POSITION,p023AudioSlice}
  from '../src/alg-l06-p023-audio-schedule-v1';

const root=new URL('../../../',import.meta.url);
const bytes=(file:string)=>readFileSync(new URL(file,root));
const sha=(value:Uint8Array)=>createHash('sha256').update(value).digest('hex');

test('P023 one-range schedule matches physical MP3s and actual Chrome decode',()=>{
 const plan=JSON.parse(bytes('output/alg-l06-p023-audio-v1/audio-domain-plan-v1.json').toString());
 const main=P023_AUDIO_ASSETS[0];
 assert.equal(P023_AUDIO_ASSETS.length,1);
 assert.deepEqual(plan.main.blockRange,[main.firstBlockFrame,main.lastBlockFrame]);
 assert.equal(sha(bytes(main.sourcePath)),main.sourceSha256);
 assert.equal(bytes(main.sourcePath).length,main.sourceBytes);
 assert.equal(sha(bytes(P023_SA_ASSET.sourcePath)),P023_SA_ASSET.sourceSha256);
 const receiptBytes=bytes('output/alg-l06-p023-audio-v1/browser-decode-v1/decode-receipt.json');
 assert.equal(sha(receiptBytes),P023_AUDIO_BROWSER_RECEIPT_SHA256);
 assert.equal(sha(bytes('output/alg-l06-p023-audio-v1/audio-domain-plan-v2.json')),
   P023_AUDIO_PLAN_V2_SHA256);
 const receipt=JSON.parse(receiptBytes.toString());
 assert.deepEqual(receipt.results.map((row:{role:string;decodedSamples:number;pcmSha256:string})=>
   [row.role,row.decodedSamples,row.pcmSha256]),[
   ['main-1',main.decodedSamples,main.pcmSha256],
   ['separate-sa',P023_SA_ASSET.decodedSamples,P023_SA_ASSET.pcmSha256]]);
 assert(receipt.results.every((row:{playbackStarted:boolean})=>row.playbackStarted===false));
 assert.equal(receipt.sourceNodesCreated,0);
});

test('single contiguous source, empty frame 12, and measured EOF before visual 410',()=>{
 assert.deepEqual(P023_AUDIO_DISPOSITION.mainRanges,[[11,410]]);
 assert.deepEqual(P023_AUDIO_DISPOSITION.sourceZeroPayloadBlockFrames,[12]);
 assert.equal(P023_AUDIO_DISPOSITION.sourceHasNegativeSeek,false);
 assert.equal(P023_AUDIO_DISPOSITION.syntheticSilenceAdded,false);
 assert.equal(P023_AUDIO_DISPOSITION.separateSaSpliced,false);
 assert.equal(P023_AUDIO_DISPOSITION.localeStartsAudio,false);
 const start=p023AudioSlice('main-1',1);assert(start);
 assert.equal(start.firstDecodedSample,1673);
 assert.equal(start.delaySeconds,10/12);
 assert.equal(start.durationSeconds,(734400-1673)/22050);
 assert(Math.abs(P023_NATIVE_AUDIO_END_POSITION-409.76299319727894)<1e-9);
 assert.equal(P023_AUDIO_END_POSITION,410);
 assert.equal(p023AudioSlice('main-1',410),null);
 assert.equal(p023AudioSlice('main-1',P023_NATIVE_AUDIO_END_POSITION),null);
});

test('fractional pause maps to measured decoded sample without crossing the domain',()=>{
 const position=200.25,slice=p023AudioSlice('main-1',position);
 assert(slice);assert.equal(slice.delaySeconds,0);
 assert(Math.abs(slice.firstDecodedSample-(1673+(position-11)*22050/12))<1e-8);
 assert.throws(()=>p023AudioSlice('main-1',0),/P023_INVALID_MAIN_AUDIO_POSITION/u);
 assert.throws(()=>p023AudioSlice('main-1',410.001),/P023_INVALID_MAIN_AUDIO_POSITION/u);
 assert.throws(()=>p023AudioSlice('main-1',Number.NaN),/P023_INVALID_MAIN_AUDIO_POSITION/u);
});
