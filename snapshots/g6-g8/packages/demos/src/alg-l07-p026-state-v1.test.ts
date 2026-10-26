import assert from'node:assert/strict';import test from'node:test';import fs from'node:fs';
import{p026InitialState,p026Reduce,p026Branch,p026CanClose,p026Visual,type P026State}from'./alg-l07-p026-state-v1';
const source='migrations/shared-alg001-l07-p026/source-v1/ffdec/scripts/';
const step=(s:P026State,e:Omit<Parameters<typeof p026Reduce>[1],'epoch'>)=>p026Reduce(s,{...e,epoch:s.epoch}as Parameters<typeof p026Reduce>[1]);
function quiz(){let s=p026InitialState();s=step(s,{type:'play'});return step(s,{type:'advance-main',frame:253}as never);}
function chosen(s:P026State,answer:1|2|3|4,seed:number){return step(s,{type:'choose',answer,seed}as never);}
function wrongExit(s:P026State){const b=p026Branch(s.feedback!.spriteId);assert(b.kind==='wrong');s=step(s,{type:'advance-feedback',frame:b.hold}as never);s=step(s,{type:'close-feedback'});return step(s,{type:'advance-feedback',frame:b.terminal}as never);}
test('all wrong feedback paths increment only at authored exit, retry once then resume253',()=>{
 for(const[seed,id,hold,jump,last]of[[0,148,23,24,29],[1,176,20,21,29],[2,162,20,21,28]]){
  const script=fs.readFileSync(source+`DefineSprite_${id}/frame_${last}/DoAction.as`,'utf8');assert(script.indexOf('quizTryCount++')<script.indexOf('quizTryCount >= 2'));
  let s=chosen(quiz(),1,seed);assert.equal(s.feedback?.spriteId,id);assert.equal(s.quizTryCount,0);assert.equal(s.wrongText,'Select the coefficient of the x-term. Try again.');assert(!p026CanClose(s));s=step(s,{type:'advance-feedback',frame:hold}as never);assert(!s.playing);assert.equal(s.quizTryCount,0);
  const epoch=s.epoch;s=step(s,{type:'close-feedback'});assert.equal(s.feedback?.frame,jump);assert.equal(s.quizTryCount,0);assert.strictEqual(p026Reduce(s,{type:'advance-feedback',frame:last,epoch}),s);s=step(s,{type:'advance-feedback',frame:last}as never);assert.equal(s.phase,'quiz-held');assert.equal(s.quizTryCount,1);assert(!s.playing);assert(s.quizButtonsEnabled);
  s=chosen(s,4,seed);assert.equal(s.wrongText,'Select the coefficient of the x-term. ');s=wrongExit(s);assert.equal(s.phase,'postquiz');assert.equal(s.quizTryCount,0);assert(s.playing&&!s.quizSection);assert.equal(s.mainFrame,253);
 }
});
test('A/C/D feedback strings and counter predicate are bound to exact button scripts',()=>{
 for(const[answer,character]of[[1,30],[3,30],[4,30]]as const){const script=fs.readFileSync(source+`DefineButton2_${character}/BUTTONCONDACTION on(release).as`,'utf8'),strings=[...script.matchAll(/_global.WrongFeed = "([^"]*)"/g)].map(m=>m[1]);assert.equal(strings.length,2);assert(!script.includes('quizTryCount++'));assert(script.includes('quizTryCount == 1'));
  let s=chosen(quiz(),answer,0);assert.equal(s.wrongText,strings[1]);s=wrongExit(s);s=chosen(s,answer,1);assert.equal(s.wrongText,strings[0]);
 }
});
test('every right branch belongs to B and returns automatically, preserving one prior wrong count',()=>{
 for(const[seed,id,last]of[[0,90,27],[1,123,33],[2,102,25],[3,65,27]]){let s=wrongExit(chosen(quiz(),3,2));s=chosen(s,2,seed);assert.equal(s.feedback?.spriteId,id);assert.equal(s.wrongText,null);assert.equal(s.quizTryCount,1);s=step(s,{type:'advance-feedback',frame:last}as never);assert.equal(s.phase,'postquiz');assert.equal(s.quizTryCount,1);assert(s.playing);assert.equal(s.feedback,null);assert(!s.quizButtonsEnabled);}
});
test('source253 resets attempts,254 clears quizSection,332 fully elapses before loop and Replay invalidates old events',()=>{
 let s=chosen(quiz(),2,0),b=p026Branch(s.feedback!.spriteId);s=step(s,{type:'advance-feedback',frame:b.terminal}as never);assert.equal(s.mainFrame,253);s=step(s,{type:'advance-main',frame:254}as never);assert(!s.quizSection);s=step(s,{type:'advance-main',frame:332}as never);assert.equal(s.mainFrame,332);assert.equal(s.cycle,0);s=step(s,{type:'advance-main',frame:333}as never);assert.equal(s.mainFrame,1);assert.equal(s.cycle,1);assert(s.playing);s=step(s,{type:'advance-main',frame:253}as never);assert.equal(s.phase,'quiz-held');assert.equal(s.quizTryCount,0);const old=s.epoch;s=step(s,{type:'replay'});assert.equal(s.mainFrame,1);assert.equal(s.replay,1);assert.strictEqual(p026Reduce(s,{type:'choose',answer:1,seed:0,epoch:old}),s);assert(!s.lessonCompleted);
});
test('five source terms hold state, and coefficient emphasis follows authored frames',()=>{
 for(const term of ['Slope','Linear function','Coefficient','Term','Equation']as const){let s=quiz();s=step(s,{type:'open-glossary',term}as never);assert.equal(s.glossary,term);assert(!s.playing);s=step(s,{type:'close-glossary'});assert(!s.glossary&&!s.playing);assert.equal(s.mainFrame,253);}
 assert(!p026Visual(293).questionCoefficient);assert(p026Visual(294).questionCoefficient);assert(p026Visual(315).answerCoefficient);assert(!p026Visual(316).answerCoefficient);assert(!p026Visual(331).questionCoefficient);assert.equal(p026Visual(332).bMove,1);
});
