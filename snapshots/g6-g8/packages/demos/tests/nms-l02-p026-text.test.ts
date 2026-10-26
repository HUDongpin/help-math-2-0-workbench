import assert from 'node:assert/strict';import test from 'node:test';
import {p026ModuleFrame,P026_TRACE_FRAME_COUNTS,P026_SCENARIOS} from '../src/nms-l02-p026-timeline-v1';
import {p026TextSnapshot} from '../src/nms-l02-p026-text-v1';
test('text snapshots follow live event state without exposing dormant text or stale cards',()=>{
 for(const scenario of P026_SCENARIOS)for(const lang of ['en','es']as const){
  for(let frame=1;frame<=P026_TRACE_FRAME_COUNTS[scenario];frame++){
   const state=p026ModuleFrame(frame,{frame,scenario,lang,seed:42});const snap=p026TextSnapshot(state);
   assert.equal(snap.status,'ready');assert.equal(snap.identity.frame,frame);assert.deepEqual(snap.suppressedInstances,[]);
   assert.ok(!snap.blocks.some(b=>b.text.includes('Got It')));
   if(state.game!.phase!=='intro'){
    const expected=state.game!.cards.filter(c=>c.kind==='number'&&!c.removed).map(c=>`${c.numerator}/${c.denominator}`).join('; ');
    assert.equal(snap.blocks.find(b=>b.id==='number-cards')!.text,expected);
   }
  }
 }
});
test('intro numbers differ from round one and invisible roots contain no visible text',()=>{
 const at=(frame:number,domain='sprite-82')=>p026TextSnapshot(p026ModuleFrame(frame,{frame,frameDomain:domain,scenario:'correct-pairs',lang:'en',seed:0}));
 assert.ok(at(50).blocks.find(b=>b.id==='number-cards')!.text.includes('1/4'));
 assert.ok(!at(392).blocks.find(b=>b.id==='number-cards')!.text.includes('1/4'));
 assert.ok(at(392).blocks.find(b=>b.id==='number-cards')!.text.includes('3/4'));
 for(let f=1;f<6;f++)assert.ok(at(f,'root').blocks.every(b=>!b.visible));
});
