import assert from 'node:assert/strict';
import test from 'node:test';
import {P021_TEXT_STATE_SOURCE,p021TextState} from '../src/generated/alg-l06-p021-text-state-v1';

test('P021 pure source state never reveals complete ordered pairs while digits still travel',()=>{
  assert.equal(p021TextState(1).prose.length,0);
  assert.equal(p021TextState(71).prose.length,0);
  assert.equal(p021TextState(72).prose.length,1);
  assert.equal(p021TextState(90).prose.length,1);
  assert.equal(p021TextState(91).prose.length,2);
  assert.equal(p021TextState(177).example.available,false);
  assert.equal(p021TextState(178).example.available,true);
  assert.equal(p021TextState(196).example.available,false);
  assert.equal(p021TextState(203).tableRows.filter(x=>x.available).length,0);
  assert.equal(p021TextState(204).tableRows.filter(x=>x.available).length,4);
  for(const [first,ordinal] of [[346,1],[356,2],[366,3],[376,4]] as const){
    assert.equal(p021TextState(first-1).orderedPairs[ordinal-1].available,false);
    assert.equal(p021TextState(first).orderedPairs[ordinal-1].available,true);
  }
  assert.equal(p021TextState(377).orderedPairs.filter(x=>x.available).length,4);
  assert.deepEqual(P021_TEXT_STATE_SOURCE.orderedPairs.map(x=>[x.inputText,x.outputText]),
    [['2','3'],['3','5'],['5','-2'],['7','1']]);
});

test('P021 six source buttons use distinct own-label full-ink and full-hit gates',()=>{
  for(const [key,frame] of [['Set',12],['Function',20],['Value',25],
    ['Ordered pair',62],['Input',69],['Output',77]] as const){
    assert.equal(p021TextState(frame-1).glossaryControls.find(x=>x.key===key)?.available,false);
    assert.equal(p021TextState(frame).glossaryControls.find(x=>x.key===key)?.available,true);
  }
  const controls=P021_TEXT_STATE_SOURCE.glossaryControls;
  assert.equal(new Set(controls.map(x=>x.sourceButtonInstanceId)).size,6);
  assert.deepEqual(controls.filter(x=>['Function','Value'].includes(x.key))
    .map(x=>[x.sourceLabelRunText,x.sourceLabelSegment]),
    [['function values','function'],['function values','values']]);
  assert.throws(()=>p021TextState(0),RangeError);
  assert.throws(()=>p021TextState(378),RangeError);
});
