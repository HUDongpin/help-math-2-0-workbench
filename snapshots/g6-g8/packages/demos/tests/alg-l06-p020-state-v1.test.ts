import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import test from 'node:test';
import {AlgL06P020QuizStateV1,P020_RIGHT_BRANCHES,P020_WRONG_BRANCHES} from '../src/alg-l06-p020-state-v1';

const auditBytes=fs.readFileSync(new URL('../../../output/alg-l06-p020-behavior-v1/source-behavior-audit-v1.json',import.meta.url));
const audit=JSON.parse(auditBytes.toString());
function quiz(){const s=new AlgL06P020QuizStateV1();s.play();s.advanceMain(172);return s;}
function finish(s:AlgL06P020QuizStateV1){const b=s.snapshot();s.advanceFeedback(b.feedbackTerminalFrame!,s.snapshot().feedbackToken!);return s.completeFeedback(b.feedbackToken!,b.feedbackTerminalFrame!);}

test('maintained branch map binds reviewed source actions, named instances and seven domains',()=>{
 assert.equal(createHash('sha256').update(auditBytes).digest('hex'),'c46706b5c6d7fc57af6ac4584b655d86d6b87d0395aed7ca35af4275287a8523');
 assert.equal(audit.main.quizStopFrame,58);assert.equal(audit.main.frameCount,172);
 for(const [kind,rows] of [['right',P020_RIGHT_BRANCHES],['wrong',P020_WRONG_BRANCHES]] as const)
  for(const row of rows){const src=audit.feedback.find((b:any)=>b.kind===kind&&b.ordinal===row.ordinal);for(const key of Object.keys(row))assert.equal(src[key],row[key as keyof typeof row],`${kind}:${row.ordinal}:${key}`);}
 assert.deepEqual(audit.answers.filter((r:any)=>r.outcome==='right').map((r:any)=>r.name),['AnsBtn2']);
});

test('natural main advance cannot cross58 before a feedback terminal, no early/duplicate answer',()=>{
 const s=new AlgL06P020QuizStateV1();assert.equal(s.snapshot().playing,false);
 s.answer('AnsBtn2',1);assert.equal(s.snapshot().feedbackToken,null);
 s.play();s.advanceMain(57);s.answer('AnsBtn2',1);assert.equal(s.snapshot().feedbackToken,null);
 const held=s.advanceMain(172);assert.equal(held.mainFrame,58);assert.equal(held.phase,'awaiting-answer');assert.equal(held.playing,false);
 s.play();s.advanceMain(172);assert.equal(s.snapshot().mainFrame,58);
 const active=s.answer('AnsBtn2',1);s.answer('AnsBtn1',2);assert.deepEqual(s.snapshot(),active);
});

test('all four right domains resume main only at their exact terminal; try count remains authored',()=>{
 for(const branch of P020_RIGHT_BRANCHES){const s=quiz();const chosen=s.answer('AnsBtn2',branch.ordinal);assert.equal(chosen.feedbackFrame,2);assert.equal(chosen.feedbackDomain,branch.domain);
  s.advanceFeedback(branch.terminalFrame-1,s.snapshot().feedbackToken!);s.completeFeedback(chosen.feedbackToken!,branch.terminalFrame);assert.equal(s.snapshot().phase,'feedback');
  const ended=finish(s);assert.equal(ended.phase,'post-quiz');assert.equal(ended.mainFrame,58);assert.equal(ended.tryCount,0);assert.equal(ended.playing,true);
  assert.equal(s.advanceMain(59).mainFrame,59);const final=s.advanceMain(172);assert.equal(final.playing,false);assert.equal(final.lessonCompleted,false);
 }
});

test('every wrong branch stops for its own Close; first wrong retries, second resumes after tail',()=>{
 for(const branch of P020_WRONG_BRANCHES)for(const answer of ['AnsBtn1','AnsBtn3','AnsBtn4'] as const){
  const s=quiz();
  for(const attempt of [0,1]){
   const b=s.answer(answer,branch.ordinal);assert.equal(b.feedbackDomain,branch.domain);assert.equal(b.feedbackText,attempt===0?audit.wrongFeedbackText.first:audit.wrongFeedbackText.repeat);
   s.acknowledgeFeedback(b.feedbackToken!);assert.equal(s.snapshot().feedbackFrame,2,'early Close rejected');
   s.advanceFeedback(branch.terminalFrame,s.snapshot().feedbackToken!);let current=s.snapshot();assert.equal(current.feedbackFrame,branch.holdFrame);assert.equal(current.feedbackPlaying,false);assert.equal(current.feedbackAwaitingAcknowledgment,true);
   s.completeFeedback(b.feedbackToken!,branch.terminalFrame);assert.equal(s.snapshot().tryCount,attempt);
   s.acknowledgeFeedback(b.feedbackToken!+1);assert.equal(s.snapshot().feedbackFrame,branch.holdFrame,'stale Close rejected');
   current=s.acknowledgeFeedback(b.feedbackToken!);assert.equal(current.feedbackFrame,branch.resumeFrame);assert.equal(current.phase,'feedback');assert.equal(current.tryCount,attempt);
   current=finish(s);assert.equal(current.tryCount,attempt===0?1:0);assert.equal(current.phase,attempt===0?'awaiting-answer':'post-quiz');assert.equal(current.playing,attempt!==0);assert.equal(current.mainFrame,58);
  }
 }
});

test('right after wrong preserves source tryCount; replay clears all branch and hold state',()=>{
 const s=quiz();let b=s.answer('AnsBtn1',2);s.advanceFeedback(20,s.snapshot().feedbackToken!);s.acknowledgeFeedback(b.feedbackToken!);finish(s);assert.equal(s.snapshot().tryCount,1);
 b=s.answer('AnsBtn2',4);finish(s);assert.equal(s.snapshot().tryCount,1);
 const reset=s.replay();assert.equal(reset.mainFrame,1);assert.equal(reset.tryCount,0);assert.equal(reset.phase,'before-quiz');assert.equal(reset.feedbackDomain,null);assert.equal(reset.playing,false);
 s.completeFeedback(b.feedbackToken!,28);s.acknowledgeFeedback(b.feedbackToken!);assert.deepEqual(s.snapshot(),reset);
});

test('glossary and explicit Pause hold main/branch clocks, navigation rejects old callbacks',()=>{
 const s=quiz();const b=s.answer('AnsBtn1',3);s.advanceFeedback(10,s.snapshot().feedbackToken!);s.openGlossary('Function');s.advanceFeedback(21,s.snapshot().feedbackToken!);assert.equal(s.snapshot().feedbackFrame,10);
 s.closeGlossary();assert.equal(s.snapshot().feedbackPlaying,false);s.play();s.advanceFeedback(21,s.snapshot().feedbackToken!);assert.equal(s.snapshot().feedbackAwaitingAcknowledgment,true);
 s.play();s.advanceFeedback(28,s.snapshot().feedbackToken!);assert.equal(s.snapshot().feedbackFrame,21,'Play cannot bypass authored Close');
 s.acknowledgeFeedback(b.feedbackToken!);s.pause();s.advanceFeedback(28,s.snapshot().feedbackToken!);assert.equal(s.snapshot().feedbackFrame,22);
 const exit=s.navigateAway();s.completeFeedback(b.feedbackToken!,28);s.acknowledgeFeedback(b.feedbackToken!);s.replay();assert.deepEqual(s.snapshot(),exit);assert.equal(exit.phase,'closed');
});

test('out-of-range frame and branch requests are rejected without altering source quiz state',()=>{
 const s=quiz(),before=s.snapshot();assert.throws(()=>s.answer('AnsBtn2',5),RangeError);assert.throws(()=>s.answer('AnsBtn1',4),RangeError);assert.throws(()=>s.advanceMain(173),RangeError);assert.throws(()=>s.advanceMain(57),RangeError);assert.deepEqual(s.snapshot(),before);
});

 test('stale feedback ticks cannot advance later retry or post-Replay branch',()=>{
 const s=quiz();const old=s.answer('AnsBtn1',1);s.advanceFeedback(23,old.feedbackToken!);s.acknowledgeFeedback(old.feedbackToken!);finish(s);
 const second=s.answer('AnsBtn2',3);s.advanceFeedback(32,old.feedbackToken!);assert.equal(s.snapshot().feedbackFrame,2);assert.equal(s.snapshot().feedbackToken,second.feedbackToken);
 s.replay();s.play();s.advanceMain(58);const fresh=s.answer('AnsBtn1',2);s.advanceFeedback(28,second.feedbackToken!);assert.equal(s.snapshot().feedbackFrame,2);assert.equal(s.snapshot().feedbackToken,fresh.feedbackToken);
 s.advanceFeedback(20,fresh.feedbackToken!);assert.equal(s.snapshot().feedbackAwaitingAcknowledgment,true);
 });
