import assert from 'node:assert/strict';
import test from 'node:test';
import {P015_TEXT_STATE_SOURCE,p015TextState}
  from '../src/generated/alg-l06-p015-text-state-v1';

test('P015 source identity and three sentences wait for settled source masks',()=>{
  assert.equal(P015_TEXT_STATE_SOURCE.sourceSwfSha256,
    'd0f395f5410353733b42ae29198caa86fae6b6eebd0e2a71830a203d969868b1');
  assert.deepEqual([P015_TEXT_STATE_SOURCE.frameDomain,P015_TEXT_STATE_SOURCE.frameCount,
    P015_TEXT_STATE_SOURCE.fps,P015_TEXT_STATE_SOURCE.rootEntryFrame],
  ['sprite-270',914,12,6]);
  assert.equal(p015TextState(134).machineLabel.visible,false);
  assert.equal(p015TextState(135).machineLabel.visible,true);
  assert(P015_TEXT_STATE_SOURCE.machineLabel.stageBoundsTwips.top>5000);
  for(const [before,at,index] of [[248,249,0],[331,332,1],[391,392,2]]){
    assert.equal(p015TextState(before).sections[index].visible,false);
    assert.equal(p015TextState(at).sections[index].visible,true);
  }
  assert.deepEqual(P015_TEXT_STATE_SOURCE.sections.map(s=>s.sourceTextId),[34,44,51]);
  assert(P015_TEXT_STATE_SOURCE.sections.every(s=>s.rightClippedTwips>0&&
    s.rightClippedTwips<350));
});

test('six exact glossary keys use audited whole-hit reveal rather than placement',()=>{
  const expected:[string,number,number,number][]=[
    ['Function',36,164,172],['Relation',38,164,191],['Value',37,164,215],
    ['Rule',45,271,302],['Input',46,271,317],['Output',47,271,332]];
  assert.deepEqual(P015_TEXT_STATE_SOURCE.controls.map(c=>
    [c.key,c.buttonId,c.placedFrame,c.fullHitFrame]),expected);
  for(const c of P015_TEXT_STATE_SOURCE.controls){
    assert.equal(p015TextState(c.fullHitFrame-1).controls.find(x=>x.key===c.key)?.available,false);
    assert.equal(p015TextState(c.fullHitFrame).controls.find(x=>x.key===c.key)?.available,true);
    assert.equal(c.sourceVisualState,'hit-test-only');
    assert.equal(c.sourceActionSha256.length,64);
  }
  for(const frame of [0,915,1.5,NaN])
    assert.throws(()=>p015TextState(frame),/P015_TEXT_FRAME_OUT_OF_RANGE/);
});

test('numeric tokens are inventoried without claiming an unaudited mapping',()=>{
  assert.deepEqual(P015_TEXT_STATE_SOURCE.numeric.placements.map(p=>
    [p.sourceTextId,p.text,p.placedFrame]),[
    [262,'3',741],[264,'6',778],[262,'3',816],
    [265,'9',828],[268,'6',880],[269,'3',892]]);
  assert.deepEqual(P015_TEXT_STATE_SOURCE.numeric.masks.slice(-3).map(m=>
    [m.characterId,m.frame,m.depth,m.clipDepth]),[
    [260,732,77,80],[263,778,82,85],[267,873,82,85]]);
  assert.match(P015_TEXT_STATE_SOURCE.numeric.semanticDisposition,/visually audited/);
});
