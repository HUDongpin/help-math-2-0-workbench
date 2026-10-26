import assert from'node:assert/strict';import test from'node:test';import fs from'node:fs';
import{p021InitialState,p021Reduce,p021Branch,p021CanClose,p021Visual,type P021State}from'./alg-l07-p021-state-v1';
const source='migrations/shared-alg001-l07-p021/source-v1/ffdec/scripts/';
const step=(s:P021State,e:Omit<Parameters<typeof p021Reduce>[1],'epoch'>)=>p021Reduce(s,{...e,epoch:s.epoch}as Parameters<typeof p021Reduce>[1]);
function quiz(){let s=p021InitialState();s=step(s,{type:'play'});return step(s,{type:'advance-main',frame:97}as never);}
function chosen(s:P021State,answer:1|2|3|4,seed:number){return step(s,{type:'choose',answer,seed}as never);}
function wrongExit(s:P021State){const b=p021Branch(s.feedback!.spriteId);assert(b.kind==='wrong');s=step(s,{type:'advance-feedback',frame:b.hold}as never);s=step(s,{type:'close-feedback'});return step(s,{type:'advance-feedback',frame:b.terminal}as never);}
test('all wrong feedback paths increment only at authored exit, retry once then resume97',()=>{
 for(const[seed,id,hold,jump,last]of[[0,183,23,24,29],[1,198,20,21,29],[2,213,21,22,28]]){
  const script=fs.readFileSync(source+`DefineSprite_${id}/frame_${last}/DoAction.as`,'utf8');assert(script.indexOf('quizTryCount++')<script.indexOf('quizTryCount >= 2'));
  let s=chosen(quiz(),2,seed);assert.equal(s.feedback?.spriteId,id);assert.equal(s.quizTryCount,0);assert.equal(s.wrongText,'Choose the graph that is a straight line. Try again.');assert(!p021CanClose(s));s=step(s,{type:'advance-feedback',frame:hold}as never);assert(!s.playing);assert.equal(s.quizTryCount,0);
  const epoch=s.epoch;s=step(s,{type:'close-feedback'});assert.equal(s.feedback?.frame,jump);assert.equal(s.quizTryCount,0);assert.strictEqual(p021Reduce(s,{type:'advance-feedback',frame:last,epoch}),s);s=step(s,{type:'advance-feedback',frame:last}as never);assert.equal(s.phase,'quiz-held');assert.equal(s.quizTryCount,1);assert(!s.playing);assert(s.quizButtonsEnabled);
  s=chosen(s,4,seed);assert.equal(s.wrongText,'Choose the graph that is a straight line. ');s=wrongExit(s);assert.equal(s.phase,'postquiz');assert.equal(s.quizTryCount,0);assert(s.playing&&!s.quizSection);assert.equal(s.mainFrame,97);
 }
});
test('B/C/D feedback strings and counter predicate are bound to exact button scripts',()=>{
 for(const[answer,character]of[[2,34],[3,34],[4,34]]as const){const script=fs.readFileSync(source+`DefineButton2_${character}/BUTTONCONDACTION on(release).as`,'utf8'),strings=[...script.matchAll(/_global.WrongFeed = "([^"]*)"/g)].map(m=>m[1]);assert.equal(strings.length,2);assert(!script.includes('quizTryCount++'));assert(script.includes('quizTryCount == 1'));
  let s=chosen(quiz(),answer,0);assert.equal(s.wrongText,strings[1]);s=wrongExit(s);s=chosen(s,answer,1);assert.equal(s.wrongText,strings[0]);
 }
});
test('every right branch belongs to A and returns automatically, preserving one prior wrong count',()=>{
 for(const[seed,id,last]of[[0,101,27],[1,67,25],[2,137,28],[3,109,27]]){let s=wrongExit(chosen(quiz(),3,2));s=chosen(s,1,seed);assert.equal(s.feedback?.spriteId,id);assert.equal(s.wrongText,null);assert.equal(s.quizTryCount,1);s=step(s,{type:'advance-feedback',frame:last}as never);assert.equal(s.phase,'postquiz');assert.equal(s.quizTryCount,1);assert(s.playing);assert.equal(s.feedback,null);assert(!s.quizButtonsEnabled);}
});
test('source97 resets attempts,98 clears quizSection,154 fully elapses before loop and Replay invalidates old events',()=>{
 let s=chosen(quiz(),1,0),b=p021Branch(s.feedback!.spriteId);s=step(s,{type:'advance-feedback',frame:b.terminal}as never);assert.equal(s.mainFrame,97);s=step(s,{type:'advance-main',frame:98}as never);assert(!s.quizSection);s=step(s,{type:'advance-main',frame:154}as never);assert.equal(s.mainFrame,154);assert.equal(s.cycle,0);s=step(s,{type:'advance-main',frame:155}as never);assert.equal(s.mainFrame,1);assert.equal(s.cycle,1);assert(s.playing);s=step(s,{type:'advance-main',frame:97}as never);assert.equal(s.phase,'quiz-held');assert.equal(s.quizTryCount,0);const old=s.epoch;s=step(s,{type:'replay'});assert.equal(s.mainFrame,1);assert.equal(s.replay,1);assert.strictEqual(p021Reduce(s,{type:'choose',answer:1,seed:0,epoch:old}),s);assert(!s.lessonCompleted);
});
test('source terms pause and close without resuming, and fifth right feedback is never naturally selected',()=>{
 for(const term of ['Linear function','Function','Graph','Line']as const){let s=quiz();s=step(s,{type:'open-glossary',term}as never);assert.equal(s.glossary,term);assert(!s.playing);s=step(s,{type:'close-glossary'});assert(!s.glossary&&!s.playing);assert.equal(s.mainFrame,97);}
 for(let seed=0;seed<128;seed++)assert.notEqual(chosen(quiz(),1,seed).feedback?.spriteId,158);
 assert.equal(p021Visual(154).aScale,1.5);assert.equal(p021Visual(154).aMove,1);
});
