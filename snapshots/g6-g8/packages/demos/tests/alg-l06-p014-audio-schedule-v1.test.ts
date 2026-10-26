import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {P014_AUDIO_ASSETS,P014_SA_ASSET,p014AudioSlice} from '../src/alg-l06-p014-audio-schedule-v1';
test('all playback assets bind exact tagged bytes and independently measured Chrome decode',()=>{
 const read=(file:string)=>readFileSync(new URL(`../../../${file}`,import.meta.url));
 const sha=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
 const receiptBytes=read('output/playwright/alg-l06-p014-browser-audio-v1/decode-receipt.json');
 const receipt=JSON.parse(receiptBytes.toString());
 for(const asset of [...P014_AUDIO_ASSETS,P014_SA_ASSET]){
  assert.equal(sha(receiptBytes),asset.receiptSha256);
  const bytes=read(asset.sourcePath);assert.equal(bytes.length,asset.sourceBytes);assert.equal(sha(bytes),asset.sourceSha256);
  const actual=receipt.results.find((r:{sourceSha256:string})=>r.sourceSha256===asset.sourceSha256);
  assert.equal(actual.decodedSamples,asset.decodedSamples);assert.equal(actual.pcmSha256,asset.pcmSha256);
 }
});
test('quiz hold and second stream start use separate decoded ranges',()=>{
 assert.equal(p014AudioSlice('main-1',120),null);
 assert.equal(p014AudioSlice('main-2',125)?.firstDecodedSample,571);
 assert.equal(p014AudioSlice('main-2',121)?.delaySeconds,4/12);
 assert.notEqual(p014AudioSlice('main-1',2)?.asset.sourceSha256,p014AudioSlice('main-2',125)?.asset.sourceSha256);
});
test('feedback frame offsets retain full source instead of prepending or deleting packets',()=>{
 assert.equal(p014AudioSlice('sprite-148',2)?.firstDecodedSample,1673+22050/12);
 assert.equal(p014AudioSlice('sprite-173',2)?.delaySeconds,1/12);
 assert.equal(p014AudioSlice('sprite-115',2)?.firstDecodedSample,1673);
 assert.throws(()=>p014AudioSlice('sprite-115',26),/INVALID_DOMAIN/);
 assert.throws(()=>p014AudioSlice('main-2',NaN),/INVALID_DOMAIN/);
});
test('main final frame may hold while its fractional decoded tail finishes without replay on resume',()=>{
 const first=p014AudioSlice('main-2',449)!;
 const resumed=p014AudioSlice('main-2',449.25)!;
 assert.equal(resumed.firstDecodedSample-first.firstDecodedSample,22050/48);
 assert(resumed.durationSeconds<first.durationSeconds);
 assert.throws(()=>p014AudioSlice('main-2',450),/INVALID_DOMAIN/);
});
