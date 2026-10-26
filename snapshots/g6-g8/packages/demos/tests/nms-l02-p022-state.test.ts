import assert from 'node:assert/strict';
import test from 'node:test';
import {P022_IR as IR} from '../src/generated/nms-l02-p022-source-ir-v1';
import {P022_BRANCHES,p022Initial,p022Advance,p022Tick,p022Answer,p022CloseFeedback,p022Feedback,p022OpenHelp,p022CloseHelp,p022Teaching} from '../src/nms-l02-p022-timeline-v1';
import {p022ModuleFrame} from '../src/nms-l02-p022-frame-v1';

test('P022 preserves the four source choices, three wrong branches and retry/assisted outcomes',()=>{
 for(let seed=0;seed<12;seed++) {
  let s=p022Advance(p022Initial(seed),1000);
  assert.equal(s.phase,'question');assert.equal(s.mainFrame,223);
  s=p022Answer(s,seed%2);const b=p022Feedback(s)!;
  assert.equal(b.domain,P022_BRANCHES.wrong[seed%3].domain);
  assert.equal(p022CloseFeedback(s),s);
  s=p022Advance(s,100);assert.equal(s.phase,'wrong-wait');
  s=p022Advance(p022CloseFeedback(s),100);assert.equal(s.phase,'question');assert.equal(s.quizTryCount,1);
  s=p022Answer(s,3);s=p022Advance(s,100);assert.equal(s.phase,'wrong-wait');
  s=p022Advance(p022CloseFeedback(s),1000);
  assert.equal(s.phase,'completed');assert.equal(s.outcome,'assisted');assert.equal(s.quizTryCount,0);
  assert.equal(s.mainFrame,501);assert.equal(p022Answer(s,2),s);
 }
});
test('P022 correct feedback covers all four branches and the final source interval',()=>{
 for(let seed=0;seed<4;seed++) {
  let s=p022Answer(p022Advance(p022Initial(seed),222),2);
  assert.equal(s.domain,P022_BRANCHES.right[seed].domain);
  while(s.phase==='right')s=p022Tick(s);
  assert.equal(s.mainFrame,224);assert.equal(s.outcome,'correct');
  s=p022Advance(s,277);assert.equal(s.mainFrame,501);assert.equal(s.phase,'outro');
  s=p022Tick(s);assert.equal(s.phase,'completed');assert.equal(p022OpenHelp(s),s);
 }
});
test('P022 popup opens only at visible source frames and help is a reversible pause',()=>{
 for(let seed=0;seed<3;seed++) {
  let s=p022Answer(p022Advance(p022Initial(seed),222),0);const b=P022_BRANCHES.wrong[seed];
  s=p022Advance(s,b.popup-3);assert.equal(s.localFrame,b.popup-1);assert.equal(p022CloseFeedback(s),s);
  s=p022Tick(s);assert.equal(p022CloseFeedback(s).localFrame,b.close);
 }
 const question=p022Advance(p022Initial(),222),help=p022OpenHelp(question);
 assert.equal(help.help,true);assert.equal(p022Answer(help,2),help);assert.equal(p022Advance(help,1000),help);
 assert.deepEqual(p022CloseHelp(help),question);assert.equal(p022OpenHelp(p022Initial()).help,false);
 const replay=p022Initial(12,3);assert.equal(replay.attempts,0);assert.equal(replay.help,false);assert.equal(replay.mainFrame,1);
});
test('P022 source mask, highlighted math and every local frame are queryable',()=>{
 assert.equal(IR.domains.root.frameCount,10);assert.equal(Object.keys(IR.domains).length,20);
 assert.equal(Object.values(IR.domains).reduce((n,d)=>n+d.frameCount,0),755);
 assert.equal(p022Teaching({...p022Initial(),mainFrame:75}).row.question.every(r=>r.complete),false);
 assert.equal(p022Teaching({...p022Initial(),mainFrame:76}).row.question.every(r=>r.complete),true);
 assert.equal(IR.teaching[265].selectedHighlight,true);assert.equal(IR.teaching[362].totalHighlight,true);
 for(const [domain,d] of Object.entries(IR.domains)) for(let f=1;f<=d.frameCount;f++) {
  const state=p022ModuleFrame(f,{frame:f,frameDomain:domain==='root'?'root':'sprite-'+domain,lang:'en',scenario:'source-fraction-quiz',seed:0});
  assert.equal(state.frame,f);assert.equal(state.domain,domain);
 }
 assert.throws(()=>p022ModuleFrame(0,{frame:0,lang:'en',scenario:'source-fraction-quiz',seed:0}));
});
