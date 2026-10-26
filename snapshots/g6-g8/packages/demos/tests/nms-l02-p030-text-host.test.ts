import assert from 'node:assert/strict';
import test from 'node:test';
import {getNmsL2P030FrameState as state,P030_ID} from '../src/nms-l02-p030-timeline-v1';
import {p030TextSnapshot,P030_TEXT_BINDING} from '../src/nms-l02-p030-text-v1';
import {createP030TermHost,p030SourceTerm} from '../src/nms-l02-p030-term-host-v1';
const context={lang:'en' as const,seed:0};
test('P030 all source frames produce native snapshots with distinct reused text instances',()=>{
  assert(P030_TEXT_BINDING.blocks.some(b=>b.role==='heading'&&b.sourceShapeIds?.includes(8)));
  assert(P030_TEXT_BINDING.blocks.some(b=>b.role==='title'&&b.sourceShapeIds?.includes(8)));
  for(const lang of['en','es']as const)for(let f=1;f<=299;f++){
    const snapshot=p030TextSnapshot(state(f,{...context,lang}));assert.equal(snapshot.status,'ready');
    assert.equal(new Set(snapshot.suppressedInstances.map(i=>i.id)).size,snapshot.suppressedInstances.length);
    const number=snapshot.blocks.find(b=>b.id==='number');assert.equal(number?.visible,f>=8);if(f===299)assert.equal(number?.text,'0.5');
  }
  assert.equal(p030TextSnapshot(state(1,{...context,frameDomain:'root'})).suppressedInstances.length,0);
});
test('P030 glossary opens only the two exact source terms at visible source frames',()=>{
  for(const [id,first]of[['ones-group',11],['decimal',12]]as const){
    const host=createP030TermHost(),q={type:'open-keyterm' as const,entryId:id,sourceAnimationId:P030_ID,playbackDisposition:'source-stop-timeline-and-audio-until-explicit-resume' as const};
    assert(p030SourceTerm(id)?.definitions.en&&p030SourceTerm(id)?.definitions.es);
    assert.equal(host.dispatch(q,state(first-1,context)).status,'blocked');assert.equal(host.dispatch(q,state(first,context)).status,'allowed');
    assert.equal(host.dispatch({type:'close-keyterm'},state(first,context)).status,'allowed');
    assert.equal(host.dispatch({...q,sourceAnimationId:'shared-nms002-l02-p028'},state(299,context)).status,'blocked');
    assert.equal(host.dispatch({...q,entryId:'__proto__'},state(299,context)).status,'blocked');
    assert.equal(host.dispatch({...q,entryId:'decimal-point'},state(299,context)).status,'blocked');
    assert.equal(host.dispatch({...q,playbackDisposition:'reversible-support-pause'},state(299,context)).status,'blocked');
    assert.equal(host.dispatch(q,state(10,{...context,frameDomain:'root'})).status,'blocked');
    assert.equal(host.dispatch(q,state(1,{...context,replay:1})).status,'blocked');
  }
});
