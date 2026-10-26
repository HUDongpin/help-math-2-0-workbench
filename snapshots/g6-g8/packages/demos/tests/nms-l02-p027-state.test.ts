import assert from'node:assert/strict';import test from'node:test';
import{p027Initial,p027Advance,p027Tick,p027Answer,p027Feedback,p027CloseFeedback,p027OpenHelp,p027CloseHelp,p027CanHelp,p027WrongExplanation,p027Replay,P027_BRANCHES,P027_OPTIONS,type P027SessionState}from'../src/nms-l02-p027-state-v1';
const question=(seed=0)=>p027Advance(p027Initial(seed),263);
function finishWrong(s:P027SessionState){const b=p027Feedback(s)!;assert('popup'in b);s=p027Advance(s,b.hold-s.localFrame);assert.equal(s.phase,'wrong-wait');assert.equal(p027Tick(s),s);s=p027CloseFeedback(s);assert.equal(s.localFrame,b.close);return p027Advance(s,b.end-b.close);}
test('source A is correct despite AnsBtn2 name; intro and final intervals are exact',()=>{
 assert.deepEqual(P027_OPTIONS,[[1,5],[3,9],[1,2],[4,6]]);assert.deepEqual(P027_OPTIONS.map(([n,d])=>2*d===10*n),[true,false,false,false]);
 const before=p027Advance(p027Initial(),262);assert.equal(before.mainFrame,263);assert.equal(before.phase,'intro');assert.equal(p027Answer(before,0),before);
 const q=p027Tick(before);assert.equal(q.mainFrame,264);assert.equal(q.phase,'question');assert.equal(p027Advance(q,1000),q);
 let s=p027Answer(q,0);assert.equal(s.phase,'right');assert.equal(s.localFrame,2);assert.equal(s.outcome,'correct');assert.equal(p027Answer(s,1),s);assert.equal(p027OpenHelp(s),s);
 s=p027Advance(s,p027Feedback(s)!.end-2);assert.equal(s.mainFrame,265);assert.equal(s.phase,'outro');s=p027Advance(s,119);assert.equal(s.mainFrame,384);assert.equal(s.phase,'outro');assert.equal(p027Tick(s).phase,'completed');assert.equal(p027CanHelp(p027Tick(s)),false);
});
test('all wrong branches hold for close and only second completed wrong feedback advances main',()=>{
 const branches=new Set<number>();
 for(let seed=0;seed<64;seed++)for(const index of[1,2,3]){
  const q=question(seed);let s=p027Answer(q,index);branches.add(s.branch!);assert.equal(s.phase,'wrong-in');assert.equal(s.quizTryCount,1);assert.equal(p027WrongExplanation(s),'Whoops try again! Click Need More Help if you are stuck.');assert.equal(p027CloseFeedback(s),s);
  const b=p027Feedback(s)!;assert('popup'in b);s=p027Advance(s,b.popup-s.localFrame-1);assert.equal(p027CloseFeedback(s),s);s=p027Tick(s);assert.notEqual(p027CloseFeedback(s),s);
  s=finishWrong(s);assert.equal(s.phase,'question');assert.equal(s.mainFrame,264);assert.equal(s.quizTryCount,1);assert.equal(s.outcome,'unanswered');
  s=p027Answer(s,index);assert.equal(s.quizTryCount,2);assert.equal(p027WrongExplanation(s),'Whoops! Click Need More Help if you are stuck.');s=finishWrong(s);assert.equal(s.phase,'outro');assert.equal(s.mainFrame,265);assert.equal(s.quizTryCount,0);assert.equal(s.outcome,'assisted');assert.equal(s.attempts,2);assert(p027CanHelp(s));
 }
 assert.deepEqual([...branches].sort(),[1,2,3]);assert.equal(P027_BRANCHES.wrong.length,3);
});
test('four correct source feedback variants are reachable, deterministic and close independently',()=>{
 const branches=new Set<number>();for(let seed=0;seed<64;seed++){const a=p027Answer(question(seed),0),b=p027Answer(question(seed),0);assert.deepEqual(a,b);branches.add(a.branch!);assert.equal(p027CloseFeedback(a),a);const done=p027Advance(a,p027Feedback(a)!.end-2);assert.equal(done.mainFrame,265);assert.equal(done.outcome,'correct');}
 assert.deepEqual([...branches].sort(),[1,2,3,4]);
});
test('help freezes state and guards choices; Replay restores every semantic field',()=>{
 let s=question(42);const held=p027OpenHelp(s);assert(held.help);assert.equal(p027Tick(held),held);assert.equal(p027Answer(held,0),held);assert.deepEqual(p027CloseHelp(held),s);
 s=finishWrong(p027Answer(s,1));s=p027Answer(s,0);const replay=p027Replay(s);assert.deepEqual(replay,p027Initial(42,1));assert.deepEqual(p027Replay(held),p027Initial(42,1));assert(Object.isFrozen(P027_OPTIONS[0]));assert(Object.isFrozen(P027_BRANCHES.wrong[0]));
});
test('malformed identity and inputs fail closed',()=>{for(const seed of[-1,1.2,NaN,0x100000000])assert.throws(()=>p027Initial(seed));for(const replay of[-1,Infinity,Number.MAX_SAFE_INTEGER+1])assert.throws(()=>p027Initial(0,replay));const q=question();for(const i of[-1,4,1.5,NaN])assert.equal(p027Answer(q,i),q);for(const n of[-1,1.5,100001])assert.throws(()=>p027Advance(q,n));});

test('correct feedback preserves an earlier wrong count until Replay, as source right helpers do',()=>{let s=finishWrong(p027Answer(question(9),1));assert.equal(s.quizTryCount,1);s=p027Answer(s,0);s=p027Advance(s,p027Feedback(s)!.end-2);assert.equal(s.phase,'outro');assert.equal(s.quizTryCount,1);assert.equal(s.attempts,2);assert.equal(s.outcome,'correct');assert.equal(p027Replay(s).quizTryCount,0);});
