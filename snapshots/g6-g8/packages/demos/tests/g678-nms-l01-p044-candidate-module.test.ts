import test from 'node:test';
import assert from 'node:assert/strict';
import {createP044CandidateModule,resolveP044CandidateFrame,P044_SCENARIO} from '../src/g678-nms-l01-p044-candidate-module';
import {P044_PRODUCT_STOPS} from '../src/g678-nms-l01-p044-product-clock';
import type {RuntimeContext} from '../src/contract';
const context=(frame:number):RuntimeContext=>({frame,frameDomain:'sprite-293',rootFrame:6,scenario:P044_SCENARIO,lang:'en',seed:0,replay:0});
test('all756 supported candidate frames keep source759 metadata and independent gates closed',()=>{
  const module=createP044CandidateModule(()=>null);
  assert.equal(module.runtime?.frameCount,10);assert.equal(module.runtime?.frameDomains?.[1].frameCount,759);
  assert.equal(module.playbackEndFrame,756);assert.equal(module.interactiveStops,P044_PRODUCT_STOPS);
  assert.deepEqual(module.audioCues,[]);assert.deepEqual(module.audioTracks,[]);assert.deepEqual(module.interactiveAudioAssets,[]);
  assert.deepEqual(module.lessonHost?.capabilities,['glossary','practice-feedback']);
  for(let frame=1;frame<=756;frame++){const state=resolveP044CandidateFrame(frame,context(frame));assert.equal(state.status,'ready');
    assert.equal(state.currentJavaScriptRegistered,false);assert.equal(state.productCalibrationPassed,false);assert.equal(state.audioIntegrated,false);assert.equal(state.originalRuntimeAccepted,false);}
});
test('undeclared domains/frames/scenario/language/seed/replay fail closed without source aliases',()=>{
  for(const frame of [-1,0,757,759,1.5,NaN])assert.equal(resolveP044CandidateFrame(frame,context(frame)).status,'blocked');
  for(const patch of [{frameDomain:'root'},{rootFrame:1},{lang:'es'},{scenario:'other'},{seed:-1},{seed:2**32},{replay:-1},{frame:3}])
    assert.equal(resolveP044CandidateFrame(1,{...context(1),...patch} as RuntimeContext).status,'blocked');
});
