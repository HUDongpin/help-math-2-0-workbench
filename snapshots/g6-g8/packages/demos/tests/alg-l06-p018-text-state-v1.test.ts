import assert from 'node:assert/strict';
import test from 'node:test';
import {P018_TEXT_STATE_SOURCE,p018TextState} from '../src/generated/alg-l06-p018-text-state-v1';

const text=(frame:number,id:number)=>p018TextState(frame).visibleText
  .find(item=>item.sourceTextId===id)?.visibleText??null;
const control=(frame:number,key:string,depth:number)=>p018TextState(frame).glossaryControls
  .find(item=>item.key===key&&item.depth===depth);

test('P018 state binds exact SWF, 17 definitions and replacement-corrected 38 text instances',()=>{
  assert.equal(P018_TEXT_STATE_SOURCE.sourceSwfSha256,
    '400f0cdcb574864c7e9e2208f986e91f26e10f796623b6ea41d80a59310e167a');
  assert.equal(P018_TEXT_STATE_SOURCE.frameDomain,'sprite-32');
  assert.equal(P018_TEXT_STATE_SOURCE.frameCount,648);
  assert.equal(P018_TEXT_STATE_SOURCE.textDefinitions.length,17);
  assert.equal(P018_TEXT_STATE_SOURCE.textInstances.length,38);
  assert.equal(P018_TEXT_STATE_SOURCE.glossaryControls.length,7);
  assert.equal(P018_TEXT_STATE_SOURCE.policy.canvasGlyphs,'preserved');
  assert.equal(P018_TEXT_STATE_SOURCE.policy.originalRuntimeAccepted,false);
  assert(P018_TEXT_STATE_SOURCE.textInstances.some(item=>
    item.instanceId==='sprite-32/depth-13/generation-13'&&
    item.sourceTextId===16&&item.firstPlacementFrame===64));
  assert(!P018_TEXT_STATE_SOURCE.textInstances.some(item=>
    item.instanceId==='sprite-32/depth-13/generation-12'&&item.sourceTextId===16));
  for(const invalid of [0,649,11.5,NaN])
    assert.throws(()=>p018TextState(invalid),/P018_TEXT_FRAME_OUT_OF_RANGE/);
});

test('source words build progressively and complete source sentences/equations never arrive early',()=>{
  assert.equal(text(3,6),null);
  assert.equal(text(4,6),'To ');
  assert.equal(text(10,6),'To ');
  assert.equal(text(11,6),'To evaluate');
  assert.equal(text(64,6),'To evaluate a function, first substitute a number for the ');
  assert.equal(text(65,6),P018_TEXT_STATE_SOURCE.textDefinitions.find(item=>item.sourceTextId===6)?.text);
  assert.equal(text(101,19),'Then evaluate the ');
  assert.equal(text(102,19),'Then evaluate the result.');
  assert.equal(text(152,22),null);
  assert.equal(text(153,22),'D = 55T');
  assert.equal(text(323,27),null);
  assert.equal(text(324,27),'Evaluate');
  assert.equal(text(381,27),'Evaluate the function');
  assert.equal(text(382,27),P018_TEXT_STATE_SOURCE.textDefinitions.find(item=>item.sourceTextId===27)?.text);
  assert.equal(text(398,28),null);
  assert.equal(text(399,28),'would go in 3 hours.');
  assert.equal(text(456,29),null);
  assert.equal(text(457,29),'D = 55(3)');
  assert.equal(text(545,30),null);
  assert.equal(text(546,30),'D = 165');
  assert.equal(text(583,31),null);
  assert.equal(text(584,31),'165');
  assert.equal(text(585,31),null,'magenta emphasis remains transient');
});

test('seven source buttons have independently gated own blue labels and exact keys',()=>{
  const gates=[['Evaluate',4,6,11],['Function',10,6,18],['Substitute',8,6,43],
    ['Input variable',6,6,65],['Result',16,19,102],
    ['Evaluate',22,27,324],['Function',24,27,333]] as const;
  for(const [key,depth,textId,frame] of gates){
    const before=control(frame-1,key,depth),at=control(frame,key,depth);
    assert(before&&!before.available,`${key} depth ${depth} premature`);
    assert(at?.available,`${key} depth ${depth} at gate`);
    assert.equal(at.sourceLabelTextId,textId);
    assert.equal(at.firstFullHitFrame,frame);
    assert.equal(at.firstCandidateFrame,frame);
    assert.equal(at.originalClickObserved,false);
  }
  assert(control(323,'Evaluate',4)?.available);
  assert(!control(323,'Evaluate',22)?.available,'second button cannot borrow first blue label');
  assert(control(332,'Function',10)?.available);
  assert(!control(332,'Function',24)?.available,'second Function waits for its own full hit');
});
