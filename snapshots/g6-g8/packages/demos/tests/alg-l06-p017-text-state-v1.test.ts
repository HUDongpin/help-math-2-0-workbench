import assert from 'node:assert/strict';
import test from 'node:test';
import {P017_TEXT_STATE_SOURCE,p017TextState} from '../src/generated/alg-l06-p017-text-state-v1';

const ids=(frame:number)=>p017TextState(frame).completeInk.map(item=>item.sourceTextId);
const available=(frame:number)=>p017TextState(frame).glossaryControls
  .filter(control=>control.available).map(control=>control.key);

test('P017 generated text is pinned to this exact source and per-instance glyph spans',()=>{
  assert.equal(P017_TEXT_STATE_SOURCE.sourceSwfSha256,
    '7010ecfee54a80298e3bba09400a712cfed65dad983811d9a470bf017156ffb3');
  assert.equal(P017_TEXT_STATE_SOURCE.frameDomain,'sprite-42');
  assert.equal(P017_TEXT_STATE_SOURCE.frameCount,721);
  assert.equal(P017_TEXT_STATE_SOURCE.textDefinitions.length,20);
  assert.equal(P017_TEXT_STATE_SOURCE.textInstances.length,44);
  assert.deepEqual(ids(10).includes(10),false);
  assert(ids(11).includes(10));
  assert(!ids(12).includes(10),'source highlight is a one-frame instance');
  assert(ids(20).includes(11));
  assert(!ids(21).includes(11),'replacement is not made permanent');
  assert(!ids(63).includes(5));
  assert(ids(64).includes(5));
});

test('source prose and equation wait for full glyph hull; late fragments stay separate',()=>{
  for(const [id,frame] of [[15,79],[18,132],[22,195],[25,266]] as const){
    assert(!ids(frame-1).includes(id),`text ${id} before complete ink`);
    assert(ids(frame).includes(id),`text ${id} full glyph`);
  }
  const state=p017TextState(266);
  assert.deepEqual(state.prose.map(item=>item.sourceTextId),[5,15,18,22]);
  assert.deepEqual(state.equation.map(item=>item.text),['y = 5x – 8']);
  assert.equal(p017TextState(316).unresolvedLateFragments.length,0);
  assert(p017TextState(317).unresolvedLateFragments.some(item=>item.sourceTextId===27));
  assert(!p017TextState(357).unresolvedLateFragments.some(item=>item.sourceTextId===27));
  assert.deepEqual(p017TextState(505).unresolvedLateFragments
    .filter(item=>[38,39].includes(item.sourceTextId)).map(item=>item.text),['_','8']);
  assert.equal(P017_TEXT_STATE_SOURCE.policy.canvasGlyphs,'preserved');
  assert.match(P017_TEXT_STATE_SOURCE.policy.lateFragments,/separate timed source instances/);
});

test('six exact glossary controls require full hit and complete blue source glyph',()=>{
  assert.deepEqual(P017_TEXT_STATE_SOURCE.glossaryControls.map(control=>
    [control.key,control.firstCandidateFrame]),[
    ['Equation',11],['Function',20],['Sentence',54],['Rule',68],
    ['Output variable',108],['Input variable',173]]);
  assert.deepEqual(available(10),[]);
  assert.deepEqual(available(11),['Equation']);
  assert.deepEqual(available(19),['Equation']);
  assert.deepEqual(available(20),['Equation','Function']);
  assert(!available(53).includes('Sentence'));
  assert(available(54).includes('Sentence'));
  assert(!available(107).includes('Output variable'));
  assert(available(108).includes('Output variable'));
  assert(!available(172).includes('Input variable'));
  assert(available(173).includes('Input variable'));
  assert.equal(available(721).length,6);
  assert(P017_TEXT_STATE_SOURCE.glossaryControls.every(control=>
    control.firstFullHitFrame===control.firstCandidateFrame&&!control.originalClickObserved));
  for(const invalid of [0,722,20.5,NaN])
    assert.throws(()=>p017TextState(invalid),/P017_TEXT_FRAME_OUT_OF_RANGE/);
});
