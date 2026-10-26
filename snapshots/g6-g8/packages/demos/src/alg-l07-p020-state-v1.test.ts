import assert from'node:assert/strict';import test from'node:test';import fs from'node:fs';
import{p020InitialState,p020Reduce,p020Branch,p020CanClose,p020Visual,type P020State}from'./alg-l07-p020-state-v1';
const source='migrations/shared-alg001-l07-p020/source-v1/ffdec/scripts/';
const step=(s:P020State,e:Omit<Parameters<typeof p020Reduce>[1],'epoch'>)=>p020Reduce(s,{...e,epoch:s.epoch}as Parameters<typeof p020Reduce>[1]);
function quiz(){let s=p020InitialState();s=step(s,{type:'play'});return step(s,{type:'advance-main',frame:204}as never);}
function chosen(s:P020State,answer:1|2|3|4,seed:number){return step(s,{type:'choose',answer,seed}as never);}
function wrongExit(s:P020State){const b=p020Branch(s.feedback!.spriteId);assert(b.kind==='wrong');s=step(s,{type:'advance-feedback',frame:b.hold}as never);s=step(s,{type:'close-feedback'});return step(s,{type:'advance-feedback',frame:b.terminal}as never);}
test('all wrong feedback paths increment only at authored exit, retry once then resume204',()=>{
 for(const[seed,id,hold,jump,last]of[[0,181,22,23,28],[1,135,20,21,28],[2,150,21,22,28]]){
  const script=fs.readFileSync(source+`DefineSprite_${id}/frame_${last}/DoAction.as`,'utf8');assert(script.indexOf('quizTryCount++')<script.indexOf('quizTryCount >= 2'));
  let s=chosen(quiz(),2,seed);assert.equal(s.feedback?.spriteId,id);assert.equal(s.quizTryCount,0);assert.equal(s.wrongText,'The graph of a nonlinear function cannot be a straight line. Try again.');assert(!p020CanClose(s));s=step(s,{type:'advance-feedback',frame:hold}as never);assert(!s.playing);assert.equal(s.quizTryCount,0);
  const epoch=s.epoch;s=step(s,{type:'close-feedback'});assert.equal(s.feedback?.frame,jump);assert.equal(s.quizTryCount,0);assert.strictEqual(p020Reduce(s,{type:'advance-feedback',frame:last,epoch}),s);s=step(s,{type:'advance-feedback',frame:last}as never);assert.equal(s.phase,'quiz-held');assert.equal(s.quizTryCount,1);assert(!s.playing);assert(s.quizButtonsEnabled);
  s=chosen(s,4,seed);assert.equal(s.wrongText,'This is not the graph of a function, because the graph does not pass the vertical-line test. ');s=wrongExit(s);assert.equal(s.phase,'postquiz');assert.equal(s.quizTryCount,0);assert(s.playing&&!s.quizSection);assert.equal(s.mainFrame,204);
 }
});
test('B/C/D feedback strings and counter predicate are bound to exact button scripts',()=>{
 for(const[answer,character]of[[2,32],[3,30],[4,34]]as const){const script=fs.readFileSync(source+`DefineButton2_${character}/BUTTONCONDACTION on(release).as`,'utf8'),strings=[...script.matchAll(/_global.WrongFeed = "([^"]*)"/g)].map(m=>m[1]);assert.equal(strings.length,2);assert(!script.includes('quizTryCount++'));assert(script.includes('quizTryCount == 1'));
  let s=chosen(quiz(),answer,0);assert.equal(s.wrongText,strings[1]);s=wrongExit(s);s=chosen(s,answer,1);assert.equal(s.wrongText,strings[0]);
 }
});
test('every right branch belongs to A and returns automatically, preserving one prior wrong count',()=>{
 for(const[seed,id,last]of[[0,78,28],[1,62,28],[2,90,25],[3,111,33]]){let s=wrongExit(chosen(quiz(),3,2));s=chosen(s,1,seed);assert.equal(s.feedback?.spriteId,id);assert.equal(s.wrongText,null);assert.equal(s.quizTryCount,1);s=step(s,{type:'advance-feedback',frame:last}as never);assert.equal(s.phase,'postquiz');assert.equal(s.quizTryCount,1);assert(s.playing);assert.equal(s.feedback,null);assert(!s.quizButtonsEnabled);}
});
test('nested popup Close appears at the source child placement; duplicate answer and Close do nothing',()=>{
 for(const[seed,first]of[[0,15],[1,13],[2,14]]){let s=chosen(quiz(),2,seed);assert.strictEqual(chosen(s,1,0),s);s=step(s,{type:'advance-feedback',frame:first-1}as never);assert(!p020CanClose(s));s=step(s,{type:'advance-feedback',frame:first}as never);assert(p020CanClose(s));s=step(s,{type:'close-feedback'});assert.strictEqual(step(s,{type:'close-feedback'}),s);}
});
test('last296 is fully held before wrap297; next204 resets quiz, with no automatic lesson completion',()=>{
 let s=chosen(quiz(),1,0);s=step(s,{type:'advance-feedback',frame:28}as never);s=step(s,{type:'advance-main',frame:296}as never);assert.equal(s.mainFrame,296);assert.equal(s.cycle,0);s=step(s,{type:'advance-main',frame:297}as never);assert.equal(s.mainFrame,1);assert.equal(s.cycle,1);assert(s.playing);s=step(s,{type:'advance-main',frame:204}as never);assert.equal(s.phase,'quiz-held');assert.equal(s.quizTryCount,0);assert.equal(s.lessonCompleted,false);
});
test('Replay/leave retire branch, attempt, glossary and stale epoch',()=>{
 let s=wrongExit(chosen(quiz(),2,0));s=step(s,{type:'open-glossary',term:'Vertical-line test'}as never);assert.equal(s.glossary,'Vertical-line test');assert(!s.playing);s=step(s,{type:'close-glossary'});assert.equal(s.phase,'quiz-held');assert(!s.playing);s=chosen(s,1,3);const before=s;s=step(s,{type:'replay'});assert.equal(s.mainFrame,1);assert.equal(s.quizTryCount,0);assert.equal(s.feedback,null);assert.equal(s.replay,1);assert.strictEqual(p020Reduce(s,{type:'advance-feedback',epoch:before.epoch,frame:33}),s);s=step(s,{type:'leave'});assert.equal(s.phase,'left');assert.strictEqual(step(s,{type:'play'}),s);
});
test('source masks reveal three separate paragraphs, then four graphs fade to the enlarged A',()=>{
 assert.equal(p020Visual(1).definition,'');assert.equal(p020Visual(66).definition,'A nonlinear function is a function whose graph is not a straight line.');assert.equal(p020Visual(78).question,'');assert.equal(p020Visual(116).question,'Which of the following is the graph of a nonlinear function?');assert.equal(p020Visual(146).reminder,'');assert.equal(p020Visual(191).reminder,'The graph of a function must pass the vertical-line test.');assert.equal(p020Visual(197).graphAlpha.A,0);assert.equal(p020Visual(204).graphAlpha.A,1);assert.equal(p020Visual(230).graphAlpha.B,0);assert.equal(p020Visual(230).graphAlpha.A,1);assert.equal(p020Visual(296).aScale,1.80328369140625);assert.equal(p020Visual(296).aMove,1);
});
