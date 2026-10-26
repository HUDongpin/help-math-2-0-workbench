import test from 'node:test';
import assert from 'node:assert/strict';
import {p033Initial,p033Tick,p033Advance,p033Answer,p033Feedback,p033CloseFeedback,p033CanHelp,p033OpenHelp,p033CloseHelp,p033Replay,p033WrongExplanation,P033_OPTIONS,type P033SessionState} from '../src/nms-l02-p033-state-v1';
function until(s:P033SessionState,condition:(s:P033SessionState)=>boolean):P033SessionState {
 for(let i=0;i<1000;i++){if(condition(s))return s;const next=p033Tick(s);assert.notEqual(next,s,'Unexpected waiting state');s=next;}
 throw Error('No bounded transition');
}
const question=(seed=0)=>p033Advance(p033Initial(seed),130);
test('exact choices and full question hold interval remain source-bound',()=>{
 assert.deepEqual(P033_OPTIONS,['0.20','0.24','0.25','0.26']);
 const last=p033Advance(p033Initial(),129);assert.equal(last.mainFrame,130);assert.equal(last.phase,'intro');
 const q=p033Tick(last);assert.equal(q.phase,'question');assert.equal(q.mainFrame,130);assert.equal(p033Tick(q),q);
 assert.equal(p033Answer(last,2),last);assert.equal(p033Answer(q,4),q);assert.equal(p033Answer(q,-1),q);
});
test('all qualified right branches start2, retain the full terminal interval and disable late help',()=>{
 const domains=new Set<string>();
 for(let seed=0;seed<128;seed++){
  let s=p033Answer(question(seed),2);assert.equal(s.phase,'right');assert.equal(s.localFrame,2);assert.equal(s.mainFrame,130);assert.equal(p033CanHelp(s),false);domains.add(s.domain);
  const branch=p033Feedback(s)!;s=until(s,v=>v.localFrame===branch.end);assert.equal(s.phase,'right');
  s=p033Tick(s);assert.equal(s.phase,'outro');assert.equal(s.mainFrame,131);assert.equal(s.outcome,'correct');assert.equal(p033CanHelp(s),false);
 }
 assert.deepEqual([...domains].sort(),['138','150','167','181']);
});
test('first wrong requires close/outro and preserves the retry counter; second wrong enables late help',()=>{
 const domains=new Set<string>();
 for(let seed=0;seed<128;seed++){
  let s=p033Answer(question(seed),0);domains.add(s.domain);assert.equal(s.quizTryCount,1);assert.match(p033WrongExplanation(s),/try again/);assert.equal(p033CloseFeedback(s),s);
  s=p033Advance(s,1000);assert.equal(s.phase,'wrong-wait');const branch=p033Feedback(s)!;assert('hold'in branch);assert.equal(s.localFrame,branch.hold);
  s=p033CloseFeedback(s);assert.equal(s.phase,'wrong-out');assert.equal(s.localFrame,branch.close);s=until(s,v=>v.phase==='question');assert.equal(s.quizTryCount,1);assert.equal(s.mainFrame,130);
  s=p033Answer(s,3);assert.equal(s.quizTryCount,2);assert.doesNotMatch(p033WrongExplanation(s),/try again/);
  s=p033Advance(s,1000);s=p033CloseFeedback(s);s=until(s,v=>v.phase==='outro');assert.equal(s.mainFrame,131);assert.equal(s.quizTryCount,0);assert.equal(s.outcome,'assisted');assert(p033CanHelp(s));
  const h=p033OpenHelp(s);assert.equal(p033Tick(h),h);assert.equal(p033CanHelp(h),false);assert.deepEqual(p033CloseHelp(h),s);
 }
 assert.deepEqual([...domains].sort(),['58','73','94']);assert(!domains.has('112'));
});
test('visible source close can interrupt entrance, but never before the popup exists',()=>{
 let s=p033Answer(question(),1);const branch=p033Feedback(s)!;assert('popup'in branch);
 s=p033Advance(s,branch.popup-2-1);assert.equal(p033CloseFeedback(s),s);
 s=p033Tick(s);assert.equal(s.localFrame,branch.popup);const closed=p033CloseFeedback(s);assert.equal(closed.phase,'wrong-out');assert.equal(closed.localFrame,branch.close);
});
test('help stops the page state and Replay resets all quiz, feedback and support state',()=>{
 const q=question(42),h=p033OpenHelp(q);assert.equal(h.help,true);assert.equal(p033Answer(h,2),h);assert.equal(p033Advance(h,100),h);assert.deepEqual(p033CloseHelp(h),q);
 let s=p033Answer(q,2);s=until(s,v=>v.phase==='outro');s=p033Advance(s,167);assert.equal(s.mainFrame,298);assert.equal(s.phase,'outro');s=p033Tick(s);assert.equal(s.phase,'completed');assert.equal(p033Tick(s),s);
 assert.deepEqual(p033Replay(s),p033Initial(42,1));assert.equal(p033CanHelp(s),false);
});
test('invalid state inputs fail and no advance mutates a prior snapshot',()=>{
 for(const seed of[-1,NaN,1.5,4294967296])assert.throws(()=>p033Initial(seed));assert.throws(()=>p033Initial(0,-1));assert.throws(()=>p033Advance(p033Initial(),100001));
 const s=p033Initial();const before=JSON.stringify(s);p033Advance(s,130);assert.equal(JSON.stringify(s),before);assert(Object.isFrozen(s));
});
