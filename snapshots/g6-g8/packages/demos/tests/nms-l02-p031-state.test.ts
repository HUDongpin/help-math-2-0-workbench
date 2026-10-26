import test from'node:test';import assert from'node:assert/strict';
import{p031Initial,p031Answer,p031Advance,p031Tick,p031Feedback,p031CloseFeedback,p031OpenHelp,p031CloseHelp,p031Replay,p031WrongExplanation,P031_OPTIONS}from'../src/nms-l02-p031-state-v1';
test('source C0.7 answer maps to four qualified right feedback branches and full outro',()=>{
 const seen=new Set<string>();assert.deepEqual(P031_OPTIONS,['0.007','0.07','0.7','7.0']);
 for(let seed=0;seed<12;seed++){
  let s=p031Initial(seed);assert.equal(p031Answer(s,2),s);s=p031Advance(s,146);assert.equal(s.phase,'question');assert.equal(s.mainFrame,147);assert.equal(p031Tick(s),s);
  s=p031Answer(s,2);seen.add(s.domain);assert.equal(s.phase,'right');assert.equal(s.quizTryCount,0);assert.equal(p031Answer(s,0),s);s=p031Advance(s,1000);assert.equal(s.phase,'completed');assert.equal(s.mainFrame,339);assert.equal(s.outcome,'correct');assert.equal(p031Tick(s),s);
  const replay=p031Replay(s);assert.equal(replay.seed,seed);assert.equal(replay.replay,1);assert.equal(replay.mainFrame,1);assert.equal(replay.attempts,0);assert.equal(replay.outcome,'unanswered');
 }
 assert.deepEqual([...seen].sort(),['108','132','68','80']);assert(!seen.has('120'));
});
test('wrong response must close the source popup and finish its outro before second-wrong continuation',()=>{
 const seen=new Set<string>();
 for(let seed=0;seed<6;seed++){
  let s=p031Advance(p031Initial(seed),146);
  for(let attempt=1;attempt<=2;attempt++){
   s=p031Answer(s,attempt===1?0:3);seen.add(s.domain);assert.equal(s.quizTryCount,attempt);assert.equal(s.mainFrame,147);assert.equal(p031CloseFeedback(s),s);assert.equal(p031OpenHelp(s),s);
   assert.equal(p031WrongExplanation(s),attempt===1?'Whoops, try again! Click Need More Help if you are stuck.':'Whoops! Click Need More Help if you are stuck.');
   s=p031Advance(s,100);assert.equal(s.phase,'wrong-wait');const b=p031Feedback(s)!;assert('close'in b);assert.equal(p031Tick(s),s);
   s=p031CloseFeedback(s);assert.equal(s.phase,'wrong-out');assert.equal(s.localFrame,b.close);assert.equal(s.mainFrame,147);
   s=p031Advance(s,b.end-b.close-1);assert.equal(s.phase,'wrong-out');s=p031Tick(s);
   assert.equal(s.phase,attempt===1?'question':'outro');assert.equal(s.mainFrame,attempt===1?147:148);
  }
  assert.equal(s.quizTryCount,0);assert.equal(s.outcome,'assisted');const help=p031OpenHelp(s);assert(help.help);assert.equal(p031Tick(help),help);s=p031CloseHelp(help);s=p031Advance(s,191);assert.equal(s.mainFrame,339);assert.equal(s.phase,'outro');assert.equal(p031Tick(s).phase,'completed');
 }
 assert.deepEqual([...seen].sort(),['157','173','188']);assert(!seen.has('202'));
});
test('help pauses question without changing attempts and Replay cancels nested state',()=>{
 let s=p031Advance(p031Initial(4294967295),146);s=p031OpenHelp(s);assert(s.help);assert.equal(p031Answer(s,2),s);assert.equal(p031Advance(s,100),s);s=p031CloseHelp(s);assert.equal(s.phase,'question');assert.equal(s.attempts,0);
 const wrong=p031Answer(s,1);const reset=p031Replay(wrong);assert.equal(reset.feedback,null);assert.equal(reset.branch,null);assert.equal(reset.help,false);assert.equal(reset.quizTryCount,0);assert.equal(reset.domain,'242');
 for(const value of[-1,4,NaN,1.5])assert.equal(p031Answer(s,value),s);
 assert.throws(()=>p031Initial(-1));assert.throws(()=>p031Initial(4294967296));assert.throws(()=>p031Advance(s,Infinity));
});
