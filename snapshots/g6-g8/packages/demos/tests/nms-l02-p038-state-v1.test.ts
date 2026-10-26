import assert from 'node:assert/strict';
import test from 'node:test';
import {p038Initial,p038Advance,p038OpenTerm,p038CloseTerm,p038Replay,p038TermAvailable,type P038TermId} from '../src/nms-l02-p038-state-v1';
import {p038Teaching} from '../src/nms-l02-p038-teaching-v1';
test('each source glossary activates only after its complete word is contained',()=>{
 for(const [term,frame] of Object.entries({percent:45,ratio:122,compare:135,quantity:143})){
  const before=p038Advance(p038Initial(),frame-2),at=p038Advance(before,1);
  assert(!p038TermAvailable(before,term as P038TermId));assert.equal(p038OpenTerm(before,term as P038TermId),before);
  const open=p038OpenTerm(at,term as P038TermId);assert.equal(open.term,term);
  assert.equal(p038Advance(open,100),open);assert.equal(p038CloseTerm(open).mainFrame,frame);
 }
});
test('complete467frame interval is retained before qualified native terminal hold',()=>{
 const end=p038Advance(p038Initial(123,2),466);assert.equal(end.mainFrame,467);assert.equal(end.phase,'explanation');
 const held=p038Advance(end,1);assert.equal(held.phase,'terminal');assert.equal(p038Advance(held,20),held);
 assert.deepEqual(p038Replay(held),p038Initial(123,3));
});
test('source reveal and mathematical stages stay independent',()=>{
 assert(p038Teaching(34).runs.every(r=>r.text===''));
 assert.equal(p038Teaching(64).runs.filter(r=>r.sourceTextId.startsWith('character-7/')).map(r=>r.text).join(''),'The word percent means “per hundred,”');
 assert.equal(p038Teaching(125).runs.filter(r=>r.sourceTextId.startsWith('character-10/')).map(r=>r.text).join(''),'or out of 100. So a percent is a ratio that ');
 assert.equal(p038Teaching(149).runs.filter(r=>r.sourceTextId.startsWith('character-13/')).map(r=>r.text).join(''),'compares a quantity to 100.');
 assert(!p038Teaching(325).fractionVisible);assert(p038Teaching(326).fractionVisible);
 assert(!p038Teaching(421).decimalVisible);assert(p038Teaching(422).decimalVisible);
 assert.equal(p038Teaching(446).gridEmphasis,'filled');assert.equal(p038Teaching(447).gridEmphasis,'none');
 assert.equal(p038Teaching(447,true).gridEmphasis,'filled');assert.equal(p038Teaching(453).gridEmphasis,'all');assert.equal(p038Teaching(467).gridEmphasis,'none');
 assert.equal(p038Teaching(326).fractionAlpha,0);assert.equal(p038Teaching(328).fractionAlpha,.5);assert.equal(p038Teaching(330).fractionAlpha,1);
 assert.equal(p038Teaching(422).decimalAlpha,0);assert.equal(p038Teaching(426).decimalAlpha,1);
});
