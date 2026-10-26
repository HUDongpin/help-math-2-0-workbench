import assert from 'node:assert/strict';
import {test} from 'node:test';
import {getNmsL2P002FrameState} from '../src/nms-l02-p002-timeline-v1';
import {p002TeachingState, p002TextSnapshot} from '../src/nms-l02-p002-text-v1';

const state = (frame:number, lang:'en'|'es'='en', replay=0) => getNmsL2P002FrameState(frame,{seed:41,lang,replay});
test('source-visible prose and repeated fraction instances keep distinct reveal boundaries', () => {
  const t = (frame:number) => p002TeachingState(state(frame));
  assert.equal(t(431).distance,'');
  assert.equal(t(432).distance,'4');
  assert.equal(t(438).distance,'4 kilometers');
  assert.equal(t(543).lowerFraction,false);
  assert.equal(t(544).lowerFraction,true);
  assert.equal(t(549).distanceRemainder,'out of 8 kilometers');
  assert.equal(t(658).definition,'');
  assert.equal(t(659).definition,'A ');
  assert.equal(t(740).definition,'A fraction is a way to write a number that represents part of a whole, or part of a group.');
  assert.equal(t(772).whole,'');
  assert.equal(t(773).whole,'8 kilometers whole');
  assert.equal(t(807).part,'');
  assert.equal(t(808).part,'4 kilometers part ');
  assert.equal(t(863).partOverWhole,false);
  assert.equal(t(864).partOverWhole,true);
  assert.equal(t(868).fourEighths,false);
  assert.equal(t(869).fourEighths,true);
  assert.equal(t(900).finalHalf,false);
  assert.equal(t(901).finalHalf,true);
});

test('all 910 frames have complete native snapshots and exact suppression identities across locale and Replay', () => {
  for (let frame=1;frame<=910;frame++) {
    const reference = p002TextSnapshot(state(frame));
    assert.equal(reference.status,'ready',`frame ${frame}`);
    assert.equal(new Set(reference.suppressedInstances.map(value=>value.id)).size,reference.suppressedInstances.length);
    for (const lang of ['en','es'] as const) for (const replay of [0,1]) {
      const candidate = p002TextSnapshot(state(frame,lang,replay));
      assert.deepEqual(candidate.blocks,reference.blocks);
      assert.deepEqual(candidate.suppressedInstances,reference.suppressedInstances);
      assert.equal(candidate.identity.language,lang);
      assert.equal(candidate.identity.replay,replay);
    }
    const definition = reference.blocks.find(block=>block.id==='definition')!;
    assert.equal(definition.visible,frame>=659);
    const equation = reference.blocks.find(block=>block.id==='part-whole')!;
    assert.equal(equation.text.includes('= 4/8'),frame>=869);
    assert.equal(equation.text.includes('= 1/2'),frame>=901);
  }
});

test('pre-entry root frames expose neither source title nor teaching values', () => {
  for (let frame=1;frame<=5;frame++) {
    const snapshot = p002TextSnapshot(getNmsL2P002FrameState(frame,{frameDomain:'root',seed:0,lang:'en'}));
    assert.equal(snapshot.status,'ready');
    assert.equal(snapshot.blocks.some(block=>block.visible),false);
    assert.equal(snapshot.suppressedInstances.length,0);
  }
});
