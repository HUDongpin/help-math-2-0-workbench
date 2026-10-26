import assert from 'node:assert/strict';
import test from 'node:test';
import {getNmsL2P029FrameState as state,P029_ID} from '../src/nms-l02-p029-timeline-v1';
import {p029TextSnapshot,P029_TEXT_BINDING} from '../src/nms-l02-p029-text-v1';
import {createP029TermHost,p029SourceTerm} from '../src/nms-l02-p029-term-host-v1';
const context={lang:'en' as const,seed:0};
test('P029 all source frames produce native snapshots with distinct reused text instances',()=>{
  assert(P029_TEXT_BINDING.blocks.some(b=>b.role==='heading'&&b.sourceShapeIds?.includes(8)));
  assert(P029_TEXT_BINDING.blocks.some(b=>b.role==='title'&&b.sourceShapeIds?.includes(8)));
  for(const lang of['en','es']as const)for(let f=1;f<=383;f++){
    const snapshot=p029TextSnapshot(state(f,{...context,lang}));assert.equal(snapshot.status,'ready');
    assert.equal(new Set(snapshot.suppressedInstances.map(i=>i.id)).size,snapshot.suppressedInstances.length);
    const number=snapshot.blocks.find(b=>b.id==='number');assert.equal(number?.text,'0.15');assert.equal(number?.visible,f>=3);
  }
  const ones=p029TextSnapshot(state(230,context)).suppressedInstances.filter(i=>i.path.at(-1)?.characterId===11);
  assert.equal(ones.length,2);assert.deepEqual(ones.map(i=>i.path.at(-1)?.depth),[4,27]);assert.notEqual(ones[0].id,ones[1].id);
  assert.equal(p029TextSnapshot(state(1,{...context,frameDomain:'root'})).suppressedInstances.length,0);
});
test('P029 glossary opens only the three exact source terms at visible source frames',()=>{
  for(const [id,first]of[['ones-group',3],['decimal',3],['place-value',48]]as const){
    const host=createP029TermHost(),q={type:'open-keyterm' as const,entryId:id,sourceAnimationId:P029_ID,playbackDisposition:'source-stop-timeline-and-audio-until-explicit-resume' as const};
    assert(p029SourceTerm(id)?.definitions.en&&p029SourceTerm(id)?.definitions.es);
    assert.equal(host.dispatch(q,state(first-1,context)).status,'blocked');assert.equal(host.dispatch(q,state(first,context)).status,'allowed');
    assert.equal(host.dispatch({type:'close-keyterm'},state(first,context)).status,'allowed');
    assert.equal(host.dispatch({...q,sourceAnimationId:'shared-nms002-l02-p028'},state(383,context)).status,'blocked');
    assert.equal(host.dispatch({...q,entryId:'__proto__'},state(383,context)).status,'blocked');
    assert.equal(host.dispatch({...q,entryId:'decimal-point'},state(383,context)).status,'blocked');
    assert.equal(host.dispatch({...q,playbackDisposition:'reversible-support-pause'},state(383,context)).status,'blocked');
    assert.equal(host.dispatch(q,state(10,{...context,frameDomain:'root'})).status,'blocked');
    assert.equal(host.dispatch(q,state(1,{...context,replay:1})).status,'blocked');
  }
});
