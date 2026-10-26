import assert from'node:assert/strict';import test from'node:test';import fs from'node:fs';
import{p007InitialState,p007Reduce,p007Branch,p007CanClose,p007Visual,type P007State}from'./alg-l07-p007-state-v1';
const old='migrations/shared-alg001-l07-p006/audit-v1/l7-p007-p009-compatibility-v1/p007/ffdec/scripts/';
const step=(s:P007State,e:Omit<Parameters<typeof p007Reduce>[1],'epoch'>)=>p007Reduce(s,{...e,epoch:s.epoch}as Parameters<typeof p007Reduce>[1]);
function quiz(){let s=p007InitialState();s=step(s,{type:'play'});return step(s,{type:'advance-main',frame:109}as never);}
function chosen(s:P007State,answer:1|2|3|4,seed:number){return step(s,{type:'choose',answer,seed}as never);}
function wrongExit(s:P007State){const b=p007Branch(s.feedback!.spriteId);assert(b.kind==='wrong');s=step(s,{type:'advance-feedback',frame:b.hold}as never);s=step(s,{type:'close-feedback'});return step(s,{type:'advance-feedback',frame:b.terminal}as never);}
test('source script increments only on terminal, and every wrong branch gives retry then continues after second',()=>{
 const button=fs.readFileSync(old+'DefineButton2_41/BUTTONCONDACTION on(release).as','utf8');assert(!button.includes('quizTryCount++'));
 for(const [seed,id,hold,jump,last]of [[0,119,23,24,28],[1,98,22,23,28],[2,67,20,21,29]]){
  const script=fs.readFileSync(old+`DefineSprite_${id}/frame_${last}/DoAction.as`,'utf8');assert(script.indexOf('quizTryCount++')<script.indexOf('quizTryCount >= 2'));
  let s=quiz();s=chosen(s,1,seed);assert.equal(s.feedback?.spriteId,id);assert.equal(s.quizTryCount,0);assert.equal(s.wrongText,'The graph of a linear function is a straight line. Try again.');
  assert.equal(p007CanClose(s),false);s=step(s,{type:'advance-feedback',frame:hold}as never);assert(!s.playing);assert.equal(s.quizTryCount,0);
  const oldEpoch=s.epoch;s=step(s,{type:'close-feedback'});assert.equal(s.feedback?.frame,jump);assert.equal(s.quizTryCount,0);assert.strictEqual(p007Reduce(s,{type:'advance-feedback',frame:last,epoch:oldEpoch}),s);
  s=step(s,{type:'advance-feedback',frame:last}as never);assert.equal(s.phase,'quiz-held');assert.equal(s.quizTryCount,1);assert(!s.playing);assert(s.quizButtonsEnabled);
  s=chosen(s,4,seed);assert.equal(s.quizTryCount,1);assert.equal(s.wrongText,'The graph of a linear function is a straight line. ');s=wrongExit(s);assert.equal(s.phase,'postquiz');assert.equal(s.quizTryCount,0);assert(s.playing&&!s.quizSection);assert.equal(s.mainFrame,109);
 }
});
test('all source right branches return automatically and preserve one prior wrong count',()=>{
 for(const[seed,id,last]of[[0,145,31],[1,177,25],[2,224,32],[3,210,27]]){let s=wrongExit(chosen(quiz(),3,2));s=chosen(s,2,seed);assert.equal(s.feedback?.spriteId,id);assert.equal(s.quizTryCount,1);s=step(s,{type:'advance-feedback',frame:last}as never);assert.equal(s.phase,'postquiz');assert.equal(s.quizTryCount,1);assert(s.playing);assert.equal(s.feedback,null);assert(!s.quizButtonsEnabled);}
});
test('Close is valid during nested popup intro; duplicate answer/Close and stale callbacks do not mutate state',()=>{
 for(const[seed,first]of[[0,17],[1,15],[2,13]]){let s=chosen(quiz(),1,seed);assert.strictEqual(chosen(s,2,0),s);s=step(s,{type:'advance-feedback',frame:first-1}as never);assert(!p007CanClose(s));s=step(s,{type:'advance-feedback',frame:first}as never);assert(p007CanClose(s));s=step(s,{type:'close-feedback'});assert.strictEqual(step(s,{type:'close-feedback'}),s);}
});
test('postquiz last frame remains queryable, wraps after a full frame, then re-enters quiz; no auto completion',()=>{
 let s=chosen(quiz(),2,0);s=step(s,{type:'advance-feedback',frame:31}as never);s=step(s,{type:'advance-main',frame:173}as never);assert.equal(s.mainFrame,173);assert.equal(s.cycle,0);s=step(s,{type:'advance-main',frame:174}as never);assert.equal(s.mainFrame,1);assert.equal(s.cycle,1);assert(s.playing);s=step(s,{type:'advance-main',frame:109}as never);assert.equal(s.phase,'quiz-held');assert.equal(s.quizTryCount,0);assert.equal(s.lessonCompleted,false);
});
test('Replay and leave discard selected branch, attempt, glossary and old callbacks',()=>{
 let s=wrongExit(chosen(quiz(),1,0));s=step(s,{type:'open-glossary',term:'Graph'}as never);assert.equal(s.glossary,'Graph');assert(!s.playing);s=step(s,{type:'close-glossary'});assert.equal(s.phase,'quiz-held');assert(!s.playing);s=chosen(s,2,3);const before=s;s=step(s,{type:'replay'});assert.equal(s.mainFrame,1);assert.equal(s.quizTryCount,0);assert.equal(s.feedback,null);assert.equal(s.replay,1);assert.strictEqual(p007Reduce(s,{type:'advance-feedback',epoch:before.epoch,frame:27}),s);s=step(s,{type:'leave'});assert.equal(s.phase,'left');assert.strictEqual(step(s,{type:'play'}),s);
});
test('native definition/question and graph reveal follow independent source mask and alpha boundaries',()=>{
 assert.equal(p007Visual(1).definition,'');assert.equal(p007Visual(53).definition,'A linear function is a function whose graph is a straight line.');assert.equal(p007Visual(63).question,'');assert.equal(p007Visual(104).question,'Which of the following is the graph of a linear function?');assert.equal(p007Visual(81).graphAlpha.A,0);assert.equal(p007Visual(86).graphAlpha.A,1);assert.equal(p007Visual(130).graphAlpha.A,0);assert.equal(p007Visual(130).graphAlpha.B,1);assert.equal(p007Visual(173).blueLine,1);
});
