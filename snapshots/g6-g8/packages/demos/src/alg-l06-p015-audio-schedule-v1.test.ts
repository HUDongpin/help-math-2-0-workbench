import test from 'node:test';import assert from 'node:assert/strict';
import {P015_AUDIO_ASSETS,P015_SA_ASSET,P015_AUDIO_END_POSITION,p015AudioSlice} from './alg-l06-p015-audio-schedule-v1';
test('four source ranges keep their own start, seek and no invented gap audio',()=>{
 assert.deepEqual(P015_AUDIO_ASSETS.map(a=>[a.firstBlockFrame,a.lastBlockFrame,a.initialSeekSamples]),[[2,622,1673],[646,702,336],[712,849,42],[852,914,326]]);
 for(const asset of P015_AUDIO_ASSETS){const scheduled=p015AudioSlice(asset.id,1)!;assert.equal(scheduled.delaySeconds,(asset.firstBlockFrame-1)/12);assert.equal(scheduled.firstDecodedSample,asset.initialSeekSamples);assert.equal(p015AudioSlice(asset.id,asset.firstBlockFrame)!.delaySeconds,0);}
 assert.equal(p015AudioSlice('main-1',630),null);assert(p015AudioSlice('main-2',630)!.delaySeconds>0);
 assert.equal(p015AudioSlice('main-2',705),null);assert.equal(p015AudioSlice('main-3',850),null);
});
test('fractional terminal audio finishes after visual914 and invalid seeks fail',()=>{
 assert(P015_AUDIO_END_POSITION>914&&P015_AUDIO_END_POSITION<915);
 assert(p015AudioSlice('main-4',914)!.durationSeconds>0);
 assert.equal(p015AudioSlice('main-4',P015_AUDIO_END_POSITION),null);
 for(const frame of [0,NaN,Infinity,915])assert.throws(()=>p015AudioSlice('main-1',frame),/P015_INVALID/);
 assert.equal(P015_SA_ASSET.sampleRate,48000);assert.equal(P015_SA_ASSET.decodedSamples,1247616);
});
