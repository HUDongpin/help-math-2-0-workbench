import assert from 'node:assert/strict';
import test from 'node:test';
import {P016_TEXT_STATE_SOURCE,p016TextState} from '../src/generated/alg-l06-p016-text-state-v1';

const ids=(frame:number)=>p016TextState(frame).completeInk.map(item=>item.sourceTextId);

test('source-locked instance spans honor replacements and mask-complete ink',()=>{
  assert.equal(P016_TEXT_STATE_SOURCE.sourceSwfSha256,
    '2fdeba5b4dcfcfe7d1b575ab30d76a98fca802d6be670a679a54378f32aa4ae9');
  assert.equal(P016_TEXT_STATE_SOURCE.textDefinitions.length,19);
  assert.equal(P016_TEXT_STATE_SOURCE.textInstances.length,39);
  assert.deepEqual(ids(40),[]);
  assert.deepEqual(ids(41),[4]);
  assert(ids(62).includes(6));
  assert(!ids(63).includes(6));
  assert(ids(71).includes(4));
  assert(!ids(72).includes(4));
  assert(ids(72).includes(8));
  assert(!ids(113).includes(11));
  assert(ids(114).includes(11));
  assert(!ids(120).includes(12));
  assert(ids(121).includes(12));
});

test('input, output and equation use exact source words at source reveal frames',()=>{
  for(const [id,frame] of [[120,372],[122,411],[123,421],[124,439],[125,472],[127,614]]){
    assert(!ids(frame-1).includes(id),`text ${id} before reveal`);
    assert(ids(frame).includes(id),`text ${id} reveal`);
  }
  const state=p016TextState(614);
  assert.deepEqual(state.inputOutput.map(item=>item.sourceTextId),[120,122,123,124,125,127]);
  assert.equal(state.inputOutput.find(item=>item.sourceTextId===120)?.text,'Inputs');
  assert.equal(state.inputOutput.find(item=>item.sourceTextId===127)?.text,
    '1 banana split = 2 bananas + 1 pint ice cream');
});

test('late replacement fragments remain source-timed, unresolved and nonpermanent',()=>{
  assert.deepEqual(p016TextState(747).unresolvedLateFragments,[]);
  assert.deepEqual(p016TextState(748).unresolvedLateFragments.map(item=>item.sourceTextId),[128,130]);
  assert.deepEqual(p016TextState(749).unresolvedLateFragments.map(item=>item.sourceTextId),[130]);
  assert(p016TextState(759).unresolvedLateFragments.some(item=>item.sourceTextId===134));
  assert(!p016TextState(777).unresolvedLateFragments.some(item=>item.sourceTextId===134));
  assert(p016TextState(790).unresolvedLateFragments.some(item=>item.sourceTextId===138));
  assert.deepEqual(p016TextState(815).unresolvedLateFragments,[]);
  assert.equal(P016_TEXT_STATE_SOURCE.policy.lateFragments,
    'retain source drawing; semantic role unresolved');
});

test('Function control is a source-timed accessible candidate, not a full-hit or original-click claim',()=>{
  assert.equal(p016TextState(71).functionControl.available,false);
  assert.equal(p016TextState(72).functionControl.available,true);
  assert.equal(p016TextState(815).functionControl.available,true);
  assert.equal(P016_TEXT_STATE_SOURCE.functionControl.firstFullHitFrame,null);
  assert.equal(P016_TEXT_STATE_SOURCE.functionControl.originalClickObserved,false);
  assert.equal(P016_TEXT_STATE_SOURCE.functionControl.firstHitAreaRatio,0.985);
  assert.throws(()=>p016TextState(0),/P016_TEXT_FRAME_OUT_OF_RANGE/);
  assert.throws(()=>p016TextState(816),/P016_TEXT_FRAME_OUT_OF_RANGE/);
  assert.throws(()=>p016TextState(72.5),/P016_TEXT_FRAME_OUT_OF_RANGE/);
});
