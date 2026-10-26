import assert from 'node:assert/strict';
import test from 'node:test';
import {P019_TEXT_STATE_SOURCE,p019TextState} from '../src/generated/alg-l06-p019-text-state-v1';

const prose=(frame:number,id:number)=>p019TextState(frame).prose
  .find(item=>item.sourceTextId===id)?.visibleText??null;

test('P019 state binds 15 exact text definitions and 38 placement identities',()=>{
  assert.equal(P019_TEXT_STATE_SOURCE.sourceSwfSha256,
    'df8be172fd738ec4fca7bca02b0f166c88676f062170e6cee7b3a1081a91adec');
  assert.equal(P019_TEXT_STATE_SOURCE.frameDomain,'sprite-37');
  assert.equal(P019_TEXT_STATE_SOURCE.frameCount,351);
  assert.equal(P019_TEXT_STATE_SOURCE.textDefinitions.length,15);
  assert.equal(P019_TEXT_STATE_SOURCE.textInstances.length,38);
  assert.equal(P019_TEXT_STATE_SOURCE.glossaryControls.length,6);
  assert.equal(P019_TEXT_STATE_SOURCE.policy.canvasGlyphs,'preserved');
  assert.equal(P019_TEXT_STATE_SOURCE.policy.originalRuntimeAccepted,false);
  const replaced=P019_TEXT_STATE_SOURCE.textInstances.filter(item=>item.depth===37);
  assert.deepEqual(replaced.map(item=>[item.instanceId,item.sourceTextId]),[
    ['sprite-37/depth-37/generation-1',31],
    ['sprite-37/depth-37/generation-2',30],
    ['sprite-37/depth-37/generation-3',26]]);
  for(const invalid of [0,352,10.5,NaN])
    assert.throws(()=>p019TextState(invalid),/P019_TEXT_FRAME_OUT_OF_RANGE/);
});

test('prose and four semantic table rows follow complete source ink gates',()=>{
  assert.equal(prose(3,6),null);
  assert.equal(prose(4,6),'A ');
  assert.equal(prose(21,6),'A function table');
  assert.equal(prose(57,6),'A function table is a table that shows pairs of inputs and ');
  assert.equal(prose(73,18),'outputs for the ');
  assert.equal(prose(74,18),'outputs for the function.');
  assert.deepEqual([170,171,174,175,177,178,181,182].map(frame=>
    p019TextState(frame).tableRows.filter(row=>row.available).length),
    [0,1,1,2,2,3,3,4]);
});

test('six source key controls wait for per-instance full blue ink and full hit',()=>{
  const gates=[['Function table',8,4,22],['Table',11,10,29],['Pair',10,8,47],
    ['Input',9,6,54],['Output',19,16,63],['Function',20,18,74]] as const;
  for(const [key,id,depth,frame] of gates){
    const get=(at:number)=>p019TextState(at).glossaryControls.find(item=>item.key===key);
    assert.equal(get(frame-1)?.available,false);
    assert.equal(get(frame)?.available,true);
    assert.equal(get(frame)?.sourceButtonId,id);
    assert.equal(get(frame)?.depth,depth);
    assert.equal(get(frame)?.firstFullHitFrame,frame);
    assert.equal(get(frame)?.firstCandidateFrame,frame);
    assert.equal(get(frame)?.originalClickObserved,false);
  }
});
