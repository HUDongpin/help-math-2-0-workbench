import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {P019_TIMELINE,p019TimelineState}
  from '../src/alg-l06-p019-timeline-v1';

test('six exact glossary instance gates match frozen source hit and ink audit',()=>{
 const root=new URL('../../../',import.meta.url);
 const raw=readFileSync(new URL(
  'output/alg-l06-p019-source-audit-v1/time-resolved-audit-v1.json',root));
 assert.equal(createHash('sha256').update(raw).digest('hex'),P019_TIMELINE.sourceAuditSha256);
 const audit=JSON.parse(raw.toString());
 assert.equal(P019_TIMELINE.sourceSwfSha256,
  'df8be172fd738ec4fca7bca02b0f166c88676f062170e6cee7b3a1081a91adec');
 assert.equal(P019_TIMELINE.frameDomain,'sprite-37');
 assert.equal(P019_TIMELINE.mainFrameCount,351);
 assert.equal(P019_TIMELINE.rootEntryFrame,6);
 assert.equal(P019_TIMELINE.glossaryInstances.length,6);
 for(const source of audit.buttons){
  assert.equal(source.instances.length,1);
  const instance=source.instances[0];
  const timed=P019_TIMELINE.glossaryInstances.find(item=>
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
  const before=p019TimelineState(instance.firstSourceReadyFrame-1);
  const ready=p019TimelineState(instance.firstSourceReadyFrame);
  assert.equal(before.glossary[source.keyAttribute],false);
  assert.equal(ready.glossary[source.keyAttribute],true);
 }
});

test('source full-hit thresholds and replay frame stay bounded',()=>{
 assert.deepEqual(P019_TIMELINE.glossaryInstances.map(item=>
  [item.key,item.buttonId,item.availableSpans[0][0]]),[
  ['Function table',8,22],['Input',9,54],['Pair',10,47],
  ['Table',11,29],['Output',19,63],['Function',20,74]]);
 assert(Object.values(p019TimelineState(1).glossary).every(value=>value===false));
 assert(Object.values(p019TimelineState(351).glossary).every(value=>value===true));
 assert.throws(()=>p019TimelineState(0),/P019_FRAME_OUT_OF_RANGE/u);
 assert.throws(()=>p019TimelineState(352),/P019_FRAME_OUT_OF_RANGE/u);
});
