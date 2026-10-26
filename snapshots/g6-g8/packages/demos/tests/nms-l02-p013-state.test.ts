import assert from 'node:assert/strict';
import test from 'node:test';
import {p013Initial,p013Advance,p013Pick,p013Drop,p013Place,p013Cancel,p013ClosePress,p013CloseRelease,p013Elapse,p013Teaching,P013_WRONG,P013_ZERO_FRACTIONS,P013_ITEMS} from '../src/nms-l02-p013-timeline-v1';
import {p013Voices} from '../src/nms-l02-p013-audio-v1';
const question=()=>p013Advance(p013Initial(),152);
test('source stop153 holds for interaction; each ordered triple of unique sixths yields one half',()=>{
 const q=question();assert.equal(q.phase,'exercise');assert.equal(q.mainFrame,153);assert.strictEqual(p013Advance(q,10000),q);
 for(const a of P013_ITEMS)for(const b of P013_ITEMS)for(const c of P013_ITEMS){if(new Set([a.id,b.id,c.id]).size!==3)continue;
  const first=p013Place(q,a.id);assert.equal(first.phase,'exercise');assert.strictEqual(p013Place(first,a.id),first);
  const two=p013Place(first,b.id);assert.equal(two.phase,'exercise');const three=p013Place(two,c.id);assert.equal(three.phase,'correct');assert.equal(three.correctFrame,2);assert.deepEqual(three.used,[a.id,b.id,c.id]);assert.deepEqual(p013Teaching(three).targetColors,[a.color,b.color,c.color]);
  assert.equal(p013Advance(three,22).correctFrame,24);const resume=p013Advance(three,23);assert.equal(resume.phase,'outro');assert.equal(resume.mainFrame,153);const terminal=p013Advance(resume,90);assert.equal(terminal.mainFrame,243);assert.equal(terminal.phase,'completed');assert.strictEqual(p013Place(terminal,4),terminal);
 }
});
test('wrong release restores without consuming; close leaves wrong coach playing and preserves placed colors',()=>{
 let q=p013Place(question(),2);const cancel=p013Cancel(p013Pick(q,4,'keyboard'));assert.deepEqual(cancel,q);
 const bad=p013Drop(p013Pick(q,4,'pointer'),false);assert.deepEqual(bad.used,[2]);assert.equal(bad.wrongOpen,true);assert.strictEqual(p013Pick(bad,1,'pointer'),bad);
 const press=p013ClosePress(bad);assert.equal(press.closeFrame,1);const outside=p013CloseRelease(press,false);assert.equal(outside.wrongOpen,true);assert.equal(outside.closeFrame,null);
 const closed=p013CloseRelease(p013ClosePress(outside),true);assert.equal(closed.wrongOpen,false);assert.equal(closed.wrongFrame,bad.wrongFrame);assert.equal(closed.mainFrame,153);
 const three=p013Place(p013Place(closed,4),6);assert.deepEqual(p013Voices(three,P013_ZERO_FRACTIONS).map(v=>v.domain),['107','111']);
 const done=p013Advance(bad,P013_WRONG[bad.wrongBranch!].end-bad.wrongFrame!);assert.equal(done.wrongFrame,null);assert.equal(done.wrongOpen,true);
});
test('independent source clip clocks retain their fractional offsets across another clip start',()=>{
 let q=p013Drop(p013Pick(question(),1,'pointer'),false),elapsed=p013Elapse(q,P013_ZERO_FRACTIONS,.037);q=p013CloseRelease(elapsed.state,true);q=p013Place(p013Place(p013Place(q,1),2),3);
 const partial={...elapsed.fractions,correct:0};const once=p013Elapse(q,partial,2.013);let split={state:q,fractions:partial};for(let i=0;i<13;i++)split=p013Elapse(split.state,split.fractions,2.013/13);
 assert.deepEqual(once.state,split.state);for(const k of['main','wrong','correct','close'] as const)assert(Math.abs(once.fractions[k]-split.fractions[k])<1e-6);
 assert.equal(p013Elapse(q,partial,23/12).state.mainFrame,153);assert.equal(p013Elapse(q,partial,24/12).state.mainFrame,154);
});
test('teaching demonstration and final formula follow source first-visible frames',()=>{
 for(let frame=1;frame<=243;frame++){const s={...question(),mainFrame:frame},t=p013Teaching(s);assert.equal(t.promptOpacity>0,frame>=6);assert.equal(t.demoMoving,frame>=77&&frame<=86);assert.equal(t.demoDeposited,frame>=87&&frame<=94);assert.equal(t.threeSixthsOpacity>0,frame>=180);assert.equal(t.halfOpacity>0,frame>=202);}
});
