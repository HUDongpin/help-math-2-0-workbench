import assert from 'node:assert/strict';
import test from 'node:test';
import {P013_TEXT_STATE_SOURCE, p013TextState}
  from '../src/generated/alg-l06-p013-text-state-v1';

test('source formula placement and fraction preserve the teaching meaning', () => {
  assert.equal(P013_TEXT_STATE_SOURCE.sourceSwfSha256,
    '1be47750557385ef91c648fb87fdcde642d342caadc35da7a1f7a2d1fdb11d35');
  assert.equal(p013TextState(1).formulas.fahrenheit.semanticVisible,false);
  const frame2=p013TextState(2);
  assert.equal(frame2.formulas.fahrenheit.semanticVisible,true);
  assert.equal(frame2.formulas.fahrenheit.text,'F = (9/5) × C + 32');
  assert.deepEqual(frame2.formulas.fahrenheit.sourceTextIds,['character-4','character-5']);
  assert.equal(frame2.formulas.area.text,'A = l × w');
  assert(P013_TEXT_STATE_SOURCE.visibleGeometry.filter(g=>[4,5,7].includes(g.characterId))
    .every(g=>g.firstFrame===2&&g.initialAlpha===256));
});

test('Input and Output controls wait for fully uncovered hit regions', () => {
  assert.equal(p013TextState(257).input.control.available,false);
  assert.equal(p013TextState(258).input.control.available,false);
  assert.equal(p013TextState(292).input.control.available,false);
  assert.equal(p013TextState(295).input.control.available,false);
  assert.equal(p013TextState(296).input.control.available,true);
  assert.equal(p013TextState(296).output.control.available,false);
  assert.equal(p013TextState(297).output.control.available,false);
  assert.equal(p013TextState(360).output.control.available,false);
  assert.equal(p013TextState(365).output.control.available,true);
  assert.equal(p013TextState(372).output.control.available,true);
  assert.deepEqual(P013_TEXT_STATE_SOURCE.controls.map(c=>
    [c.sourceKey,c.characterId,c.firstFrame,c.firstPartialHitFrame,c.firstFullHitFrame]),
  [['Input',131,258,292,296],['Output',137,297,360,365]]);
  assert(P013_TEXT_STATE_SOURCE.controls.every(c=>c.visualState==='hit-test-only'));
});

test('native sentences wait for settled masks and labels respect alpha-zero placements', () => {
  assert.equal(p013TextState(258).input.sentencePlaced,true);
  assert.equal(p013TextState(258).input.sentenceVisible,false);
  assert.equal(p013TextState(288).input.labelVisible,false);
  assert.equal(p013TextState(289).input.labelVisible,true);
  assert.equal(p013TextState(295).input.sentenceVisible,false);
  assert.equal(p013TextState(296).input.sentenceVisible,true);
  assert.equal(p013TextState(297).output.sentencePlaced,true);
  assert.equal(p013TextState(297).output.sentenceVisible,false);
  assert.equal(p013TextState(360).output.labelVisible,false);
  assert.equal(p013TextState(361).output.labelVisible,true);
  assert.equal(p013TextState(364).output.sentenceVisible,false);
  assert.equal(p013TextState(365).output.sentenceVisible,true);
  assert.equal(p013TextState(372).output.sentence,
    'The number that comes out is called the output.');
});

test('Replay resets all semantic state and invalid frames fail closed', () => {
  const initial=p013TextState(1);
  p013TextState(372);
  assert.deepEqual(p013TextState(1),initial);
  assert.equal(initial.input.control.available,false);
  assert.equal(initial.output.control.available,false);
  for(const frame of [0,373,1.5,Number.NaN])
    assert.throws(()=>p013TextState(frame),/P013_TEXT_FRAME_OUT_OF_RANGE/);
});
