import test from 'node:test';import assert from 'node:assert/strict';import{readFileSync}from'node:fs';
import{P062_ANSWER_KEY,p062InitialState,p062Reduce,p062Grade,p062SourceReview,p062Random,p062Time,type P062Option}from'./alg-l07-p062-state-v1';
const source=JSON.parse(readFileSync('migrations/shared-alg001-l07-p062/audit-v1/source-behavior-v1.json','utf8'));
test('P062 all thirty score bindings match independently extracted 120 release handlers and review table',()=>{
 assert.deepEqual(P062_ANSWER_KEY,source.questions.map((q:{scoringCorrectOption:number})=>q.scoringCorrectOption));
 for(let q=1;q<=30;q++)for(const option of[1,2,3,4]as const){let s=p062InitialState(q-1);s=p062Reduce(s,{type:'choose',epoch:s.epoch,questionId:q,option,nextIndex:0});assert.equal(s.responses[0]?.correct,option===P062_ANSWER_KEY[q-1]);assert.equal(s.responses[0]?.instance,`A${q}Opt${option}`);assert.notEqual(s.currentQuestionId,q);}
});
test('P062 ten draws are interleaved with responses, without replacement; tenth response retains question and invokes Finish only',()=>{
 for(let seed=0;seed<40;seed++){const draw=p062Random(seed);let s=p062InitialState(draw(30));for(let n=0;n<10;n++){const old=s,question=s.currentQuestionId;s=p062Reduce(s,{type:'choose',epoch:s.epoch,questionId:question,option:1,...(n<9?{nextIndex:draw(s.remaining.length)}:{})});assert.equal(s.responses.length,n+1);assert.equal(s.phase,n===9?'finish':'question');assert.equal(s.selectedQuestionIds.length,Math.min(n+2,10));assert.equal(new Set(s.selectedQuestionIds).size,s.selectedQuestionIds.length);if(n===9){assert.equal(s.currentQuestionId,question);assert.equal(s.quizCount,11);assert.equal(s.reportDispatchCount,2);assert.equal(p062Reduce(s,{type:'choose',epoch:old.epoch,questionId:question,option:1}),s);}}
 assert.equal(s.remaining.length,20);const exited=p062Reduce(s,{type:'continue',epoch:s.epoch});assert.equal(exited.phase,'exited');assert.equal(exited.lessonCompleted,false);}
});
test('P062 stale/double input and leave are inert; Replay resets source arrays and count',()=>{
 let s=p062InitialState(29);assert.equal(p062Reduce(s,{type:'continue',epoch:0}),s);const old=s;s=p062Reduce(s,{type:'choose',epoch:0,questionId:30,option:1,nextIndex:0});assert.equal(p062Reduce(s,{type:'choose',epoch:0,questionId:30,option:4,nextIndex:0}),s);s=p062Reduce(s,{type:'replay',epoch:0,firstIndex:29});assert.deepEqual(s.responses,[]);assert.equal(s.currentQuestionId,30);assert.equal(s.replay,1);assert.equal(s.quizCount,1);assert.equal(p062Reduce(s,{type:'choose',epoch:old.epoch,questionId:30,option:1,nextIndex:0}),s);s=p062Reduce(s,{type:'leave',epoch:s.epoch});assert.equal(p062Reduce(s,{type:'replay',epoch:s.epoch,firstIndex:0}),s);
});
test('P062 grade intervals and elapsed hundredths preserve source thresholds',()=>{
 assert.deepEqual(Array.from({length:11},(_,i)=>p062Grade(i)),['Unsatisfactory','Unsatisfactory','Unsatisfactory','Unsatisfactory','Partially Proficient','Partially Proficient','Partially Proficient','Proficient','Proficient','Advanced','Advanced']);assert.equal(p062Time(3_661_999),'01:01:01:99');assert.equal(p062Time(0),'00:00:00:00');assert.throws(()=>p062Time(-1));assert.throws(()=>p062InitialState(30));
});
test('P062 dormant review writes actual correct answer last, irrespective of mismatched ordinal comparison',()=>{
 let s=p062InitialState(29);for(let n=0;n<10;n++){const option=P062_ANSWER_KEY[s.currentQuestionId-1]!;s=p062Reduce(s,{type:'choose',epoch:s.epoch,questionId:s.currentQuestionId,option,...(n<9?{nextIndex:0}:{})});}
 const r=p062SourceReview(s.responses,1);assert.equal(r.kind,'review');if(r.kind==='review'){assert.equal(r.questionId,30);assert.equal(r.firstComparison,false);assert.equal(r.feedback[0],'Correct');assert.deepEqual(r.feedback,['Correct',null,null,null]);}
 const wrong=s.responses.map((r,i)=>i===0?{...r,option:2 as P062Option,instance:'A30Opt2',correct:false}:r);const w=p062SourceReview(wrong,1);if(w.kind==='review')assert.deepEqual(w.feedback,['Correct','Incorrect',null,null]);const tenth=p062SourceReview(s.responses,10);assert.equal(tenth.kind==='review'&&tenth.resultWriteTargetsMissing,true);assert.equal(p062SourceReview(s.responses,11).kind,'exit');assert.equal(s.phase,'finish');
});
