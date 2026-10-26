import assert from 'node:assert/strict';
import test from 'node:test';
import {P023_TIMELINE,p023TimelineState} from '../src/alg-l06-p023-timeline-v1';

test('P023 glossary timeline admits only each source ready frame',()=>{
 assert.equal(P023_TIMELINE.frameDomain,'sprite-38');
 assert.equal(P023_TIMELINE.mainFrameCount,410);
 assert.equal(P023_TIMELINE.fps,12);
 assert.deepEqual(P023_TIMELINE.glossaryInstances.map(x=>[x.key,x.availableSpans[0][0]]),
  [['Domain',21],['Function',30],['Set',47],['Input',68]]);
 for(const item of P023_TIMELINE.glossaryInstances){
  const ready=item.availableSpans[0][0];
  assert.equal(p023TimelineState(ready-1).glossary[item.key],false);
  assert.equal(p023TimelineState(ready).glossary[item.key],true);
  assert.equal(p023TimelineState(410).glossary[item.key],true);
 }
 assert.equal(p023TimelineState(13).glossary.Domain,false);
 assert.equal(p023TimelineState(21).elapsedSeconds,20/12);
 assert.throws(()=>p023TimelineState(0),/P023_FRAME_OUT_OF_RANGE/);
 assert.throws(()=>p023TimelineState(411),/P023_FRAME_OUT_OF_RANGE/);
});
