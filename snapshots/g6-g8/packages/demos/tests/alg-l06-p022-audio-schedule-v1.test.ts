import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {P022_AUDIO_ASSETS,P022_AUDIO_DISPOSITION,P022_AUDIO_END_POSITION,
  P022_SA_ASSET,p022AudioSlice,p022NativeAudioEndPosition}
  from '../src/alg-l06-p022-audio-schedule-v1';

test('P022 schedule binds two source ranges and browser PCM, with SA separate',()=>{
  const receipt=JSON.parse(readFileSync('output/alg-l06-p022-audio-v1/browser-decode-v1/decode-receipt.json','utf8'));
  assert.deepEqual(P022_AUDIO_ASSETS.map((asset,index)=>[
    asset.id,asset.sourceSha256,asset.decodedSamples,asset.pcmSha256]),
    receipt.results.slice(0,2).map((row:{role:string;sourceSha256:string;
      decodedSamples:number;pcmSha256:string})=>[
      row.role,row.sourceSha256,row.decodedSamples,row.pcmSha256]));
  assert.equal(P022_SA_ASSET.sourceSha256,receipt.results[2].sourceSha256);
  assert.equal(P022_SA_ASSET.decodedSamples,receipt.results[2].decodedSamples);
  assert.equal(P022_AUDIO_DISPOSITION.sourceNegativeSeek.samples,-2018);
  assert.deepEqual(P022_AUDIO_DISPOSITION.sourceMissingBlockFrames,
    Array.from({length:17},(_,i)=>133+i));
  assert.equal(P022_AUDIO_DISPOSITION.syntheticSilenceAdded,false);
  assert.equal(P022_AUDIO_DISPOSITION.mainRangesConcatenated,false);
  assert.equal(P022_AUDIO_DISPOSITION.separateSaSpliced,false);
  assert.equal(P022_AUDIO_DISPOSITION.localeStartsAudio,false);
});

test('P022 candidate slice preserves first seeks, future delay and the final fractional tail',()=>{
  assert.deepEqual([p022AudioSlice('main-1',1)?.firstDecodedSample,
    p022AudioSlice('main-1',1)?.delaySeconds],[1673,1/12]);
  assert.equal(p022AudioSlice('main-1',2)?.firstDecodedSample,1673);
  assert.equal(p022AudioSlice('main-1',131),null);
  const waiting=p022AudioSlice('main-2',132)!;
  assert.equal(waiting.firstDecodedSample,416);
  assert.equal(waiting.delaySeconds,18/12);
  assert.equal(p022AudioSlice('main-2',150)?.firstDecodedSample,416);
  assert.equal(p022AudioSlice('main-2',422.25)?.firstDecodedSample,
    416+(422.25-150)*22050/12);
  assert(Math.abs(p022NativeAudioEndPosition('main-1')-130.86585034013603)<1e-10);
  assert(Math.abs(P022_AUDIO_END_POSITION-422.80544217687077)<1e-10);
  assert.equal(p022AudioSlice('main-2',P022_AUDIO_END_POSITION),null);
  assert.throws(()=>p022AudioSlice('main-1',P022_AUDIO_END_POSITION+0.01));
});
