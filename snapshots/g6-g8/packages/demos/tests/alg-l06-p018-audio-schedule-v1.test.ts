import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {P018_AUDIO_ASSETS,P018_SA_ASSET,P018_AUDIO_DISPOSITION,
  P018_NATIVE_AUDIO_END_POSITION,P018_AUDIO_END_POSITION,p018AudioSlice}
  from '../src/alg-l06-p018-audio-schedule-v1';

test('P018 generated asset binds exact source and Headless Chrome PCM receipt',()=>{
 const root=new URL('../../../',import.meta.url);
 const plan=readFileSync(new URL('migrations/shared-alg001-l06-p018/audit/audio-plan-v1/audio-plan-v1.json',root));
 const parsed=JSON.parse(plan.toString());
 const main=P018_AUDIO_ASSETS[0];
 assert.deepEqual(parsed.mainAssets,[main]);
 assert.equal(P018_AUDIO_ASSETS.length,1);
 assert.equal(main.domain,'sprite-32');
 assert.equal(main.firstBlockFrame,2);assert.equal(main.lastBlockFrame,648);
 assert.equal(main.initialSeekSamples,1673);
 assert.equal(main.decodedSamples,1188288);
 assert.equal(main.pcmSha256,'ad9e674f5e3123ef4f50bdc79ea66163294b467b27d20295e02b2795299328cb');
 assert.equal(P018_SA_ASSET.decodedSamples,1056384);
 assert.equal(P018_SA_ASSET.pcmSha256,'0fb5b3fc9260275f86016478e73ac4edcc5eadab3d73bdfbed0747420446925e');
 const receipt=readFileSync(new URL(parsed.browserDecode.path,root));
 assert.equal(createHash('sha256').update(receipt).digest('hex'),parsed.browserDecode.sha256);
 assert.equal(parsed.disposition.audioAccepted,false);
 assert.equal(parsed.disposition.separateSaSpliced,false);
});

test('continuous source starts at frame 2 and measured EOF precedes visual 648',()=>{
 const start=p018AudioSlice('main-1',1);
 assert(start);assert.equal(start.firstDecodedSample,1673);
 assert.equal(start.delaySeconds,1/12);
 assert.equal(start.durationSeconds,(1188288-1673)/22050);
 assert(Math.abs(P018_NATIVE_AUDIO_END_POSITION-647.7768707482993)<1e-9);
 assert.equal(P018_AUDIO_END_POSITION,648);
 assert.equal(p018AudioSlice('main-1',648),null);
 assert.equal(p018AudioSlice('main-1',P018_NATIVE_AUDIO_END_POSITION),null);
 assert.deepEqual(P018_AUDIO_DISPOSITION.mainRanges,[[2,648]]);
 assert.equal(P018_AUDIO_DISPOSITION.syntheticSilenceAdded,false);
 assert.equal(P018_AUDIO_DISPOSITION.mainRangesConcatenated,false);
 assert.equal(P018_AUDIO_DISPOSITION.localeStartsAudio,false);
});

test('fractional pause seeks exact remaining sample and denies outside domain',()=>{
 const position=200.25;
 const slice=p018AudioSlice('main-1',position);
 assert(slice);assert.equal(slice.delaySeconds,0);
 assert(Math.abs(slice.firstDecodedSample-(1673+(position-2)*22050/12))<1e-8);
 assert.throws(()=>p018AudioSlice('main-1',0),/P018_INVALID_MAIN_AUDIO_POSITION/u);
 assert.throws(()=>p018AudioSlice('main-1',648.001),/P018_INVALID_MAIN_AUDIO_POSITION/u);
 assert.throws(()=>p018AudioSlice('main-1',Number.NaN),/P018_INVALID_MAIN_AUDIO_POSITION/u);
});
