import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {P021_TIMELINE,p021TimelineState}
  from '../src/alg-l06-p021-timeline-v1';

test('six exact glossary instance gates match frozen source hit and ink audit',()=>{
 const root=new URL('../../../',import.meta.url);
 const raw=readFileSync(new URL(
  'output/alg-l06-p021-source-audit-v1/time-resolved-audit-v1.json',root));
 assert.equal(createHash('sha256').update(raw).digest('hex'),P021_TIMELINE.sourceAuditSha256);
 const audit=JSON.parse(raw.toString());
 assert.equal(P021_TIMELINE.sourceSwfSha256,
  '4e87aacf4c5f749f559817dc2c0ec8b023fba75652217b9ce2543728e06eb5eb');
 assert.equal(P021_TIMELINE.frameDomain,'sprite-43');
 assert.equal(P021_TIMELINE.mainFrameCount,377);
 assert.equal(P021_TIMELINE.rootEntryFrame,6);
 assert.equal(P021_TIMELINE.glossaryInstances.length,6);
 for(const source of audit.buttons){
  assert.equal(source.instances.length,1);
  const instance=source.instances[0];
  const timed=P021_TIMELINE.glossaryInstances.find(item=>
   item.key===source.keyAttribute&&item.buttonId===source.characterId);
  assert(timed);
  assert.equal(timed.instanceId,instance.instanceId);
  assert.equal(timed.sourceActionSha256,source.actionSha256);
  assert.equal(timed.sourcePlacementTagSha256,instance.sourcePlacementTagSha256);
  assert.deepEqual(timed.label,instance.sourceLabelBinding);
  assert.deepEqual(timed.availableSpans,
   instance.sourceReadyIntervals.map((row:{firstFrame:number;lastFrame:number})=>
    [row.firstFrame,row.lastFrame]));
  assert.equal(timed.availableSpans[0][0],instance.firstSourceReadyFrame);
  assert(instance.firstPlacementFrame<instance.firstSourceReadyFrame,
   'placement is not availability');
  const before=p021TimelineState(instance.firstSourceReadyFrame-1);
  const ready=p021TimelineState(instance.firstSourceReadyFrame);
  assert.equal(before.glossary[source.keyAttribute],false);
  assert.equal(ready.glossary[source.keyAttribute],true);
 }
});

test('source full-hit thresholds and replay frame stay bounded',()=>{
 assert.deepEqual(P021_TIMELINE.glossaryInstances.map(item=>
  [item.key,item.buttonId,item.availableSpans[0][0]]),[
  ['Set',8,12],['Input',9,69],['Ordered pair',10,62],
  ['Function',11,20],['Value',12,25],['Output',22,77]]);
 assert(Object.values(p021TimelineState(1).glossary).every(value=>value===false));
 assert(Object.values(p021TimelineState(377).glossary).every(value=>value===true));
 assert.throws(()=>p021TimelineState(0),/P021_FRAME_OUT_OF_RANGE/u);
 assert.throws(()=>p021TimelineState(378),/P021_FRAME_OUT_OF_RANGE/u);
});
