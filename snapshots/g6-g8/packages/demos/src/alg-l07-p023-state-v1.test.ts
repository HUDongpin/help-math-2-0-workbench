import assert from'node:assert/strict';import test from'node:test';import fs from'node:fs';
import{p023InitialState,p023Reduce,p023Branch,p023CanClose,p023Visual,type P023State}from'./alg-l07-p023-state-v1';
const source='migrations/shared-alg001-l07-p023/source-v1/ffdec/scripts/';
const step=(s:P023State,e:Omit<Parameters<typeof p023Reduce>[1],'epoch'>)=>p023Reduce(s,{...e,epoch:s.epoch}as Parameters<typeof p023Reduce>[1]);
function quiz(){return step(step(p023InitialState(),{type:'play'}),{type:'advance-main',frame:144}as never);}
const chosen=(s:P023State,answer:1|2|3|4,seed:number)=>step(s,{type:'choose',answer,seed}as never);
function exit(s:P023State){const b=p023Branch(s.feedback!.spriteId);assert(b.kind==='wrong');s=step(s,{type:'advance-feedback',frame:b.hold}as never);s=step(s,{type:'close-feedback'});return step(s,{type:'advance-feedback',frame:b.terminal}as never);}
test('three wrong branches increment on answer; first retries and second clears counter after Close exit',()=>{
 for(const[seed,id,hold,jump,last]of[[0,156,23,24,28],[1,137,20,21,28],[2,124,23,24,29]]){
  const script=fs.readFileSync(source+`DefineSprite_${id}/frame_${last}/DoAction.as`,'utf8');assert(!script.includes('quizTryCount++'));assert(script.includes('quizTryCount >= 2'));
  let s=chosen(quiz(),1,seed);assert.equal(s.feedback?.spriteId,id);assert.equal(s.quizTryCount,1);assert.equal(s.wrongText,'A linear function cannot have x² terms. Try again.');assert(!p023CanClose(s));assert.strictEqual(chosen(s,2,seed),s);
  s=step(s,{type:'advance-feedback',frame:hold}as never);assert(!s.playing);assert.equal(s.quizTryCount,1);const epoch=s.epoch;s=step(s,{type:'close-feedback'});assert.equal(s.feedback?.frame,jump);assert.equal(s.quizTryCount,1);assert.strictEqual(p023Reduce(s,{type:'advance-feedback',frame:last,epoch}),s);
  s=step(s,{type:'advance-feedback',frame:last}as never);assert.equal(s.phase,'quiz-held');assert.equal(s.quizTryCount,1);assert(!s.playing&&s.quizButtonsEnabled);s=chosen(s,3,seed);assert.equal(s.quizTryCount,2);assert.equal(s.wrongText,'A linear function cannot have x² terms.');s=exit(s);assert.equal(s.phase,'postquiz');assert.equal(s.quizTryCount,0);assert.equal(s.mainFrame,144);assert(s.playing&&!s.quizSection);
 }
});
test('A/B/C map to wrong button source increments before root dispatch; D is correct',()=>{
 for(const[answer,char]of[[1,28],[2,26],[3,26]]as const){const code=fs.readFileSync(source+`DefineButton2_${char}/BUTTONCONDACTION on(release).as`,'utf8');assert(code.indexOf('quizTryCount++')<code.indexOf('showWrongFeed'));assert.equal(chosen(quiz(),answer,0).quizTryCount,1);}
 const code=fs.readFileSync(source+'DefineButton2_27/BUTTONCONDACTION on(release).as','utf8');assert(code.includes('showRightFeed')&&!code.includes('quizTryCount'));
});
test('all four right branches return from D and preserve one prior wrong count',()=>{
 for(const[seed,id,last]of[[0,54,31],[1,83,28],[2,97,32],[3,66,27]]){let s=exit(chosen(quiz(),2,2));s=chosen(s,4,seed);assert.equal(s.feedback?.spriteId,id);assert.equal(s.quizTryCount,1);assert.equal(s.wrongText,null);s=step(s,{type:'advance-feedback',frame:last}as never);assert.equal(s.phase,'postquiz');assert.equal(s.quizTryCount,1);assert(s.playing&&!s.quizButtonsEnabled);}
});
test('144 holds,145 clears quiz,302 fully elapses before303 boundary wraps; Replay invalidates events',()=>{
 let s=chosen(quiz(),4,0);s=step(s,{type:'advance-feedback',frame:31}as never);s=step(s,{type:'advance-main',frame:145}as never);assert(!s.quizSection);s=step(s,{type:'advance-main',frame:302}as never);assert.equal(s.mainFrame,302);assert.equal(s.cycle,0);s=step(s,{type:'advance-main',frame:303}as never);assert.equal(s.mainFrame,1);assert.equal(s.cycle,1);assert(s.playing);s=step(s,{type:'advance-main',frame:144}as never);assert.equal(s.phase,'quiz-held');assert.equal(s.quizTryCount,0);const old=s.epoch;s=step(s,{type:'replay'});assert.equal(s.replay,1);assert.equal(s.mainFrame,1);assert.strictEqual(p023Reduce(s,{type:'choose',answer:4,seed:0,epoch:old}),s);assert(!s.lessonCompleted);
});
test('four exact glossary links pause and close held, unavailable links reject',()=>{
 assert.strictEqual(step(p023InitialState(),{type:'open-glossary',term:'Equation'}as never).glossary,null);
 for(const term of['Linear function','Term','Constant','Equation']as const){let s=quiz();s=step(s,{type:'open-glossary',term}as never);assert.equal(s.glossary,term);assert(!s.playing);assert.strictEqual(chosen(s,4,0),s);s=step(s,{type:'close-glossary'});assert(!s.glossary&&!s.playing);assert.equal(s.mainFrame,144);}
});
test('source glyph-derived reveal, removal and term emphasis preserve equation ownership',()=>{
 assert.equal(p023Visual(83).definition,'A linear function can only have x-terms, y-terms, and constant');assert.equal(p023Visual(84).definition,'A linear function can only have x-terms, y-terms, and constant terms.');
 assert.equal(p023Visual(132).answerAlpha.D,0);assert.equal(p023Visual(144).answerAlpha.A,1);assert.equal(p023Visual(160).answerAlpha.A,0);assert.equal(p023Visual(302).answerAlpha.D,1);
 for(const[id,first,last]of[[157,248,254],[158,264,270],[159,286,294]]){assert(!p023Visual(first-1).emphasisTerms.includes(id));for(let f=first;f<=last;f++)assert(p023Visual(f).emphasisTerms.includes(id));assert(!p023Visual(last+1).emphasisTerms.includes(id));assert(!p023Visual(first+1).emphasis.includes(id));}
});
