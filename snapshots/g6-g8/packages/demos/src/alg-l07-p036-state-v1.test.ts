import assert from'node:assert/strict';import test from'node:test';import fs from'node:fs';
import{ALG_L07_P036_SOURCE as S,p036InitialState,p036Reduce,p036Branch,p036CanClose,p036Visual,type P036State,type P036Event}from'./alg-l07-p036-state-v1';
const base='migrations/shared-alg001-l07-p036/source-v1/ffdec/scripts/';
const step=(s:P036State,e:Omit<P036Event,'epoch'>)=>p036Reduce(s,{...e,epoch:s.epoch}as P036Event);
function quiz(){return step(step(p036InitialState(),{type:'play'}),{type:'advance-main',frame:94}as never);}
function wrongExit(s:P036State){const b=p036Branch(s.feedback!.spriteId);assert(b.kind==='wrong');s=step(s,{type:'advance-feedback',frame:b.hold}as never);s=step(s,{type:'close-feedback'});return step(s,{type:'advance-feedback',frame:b.terminal}as never);}
test('all P036 wrong branches increment attempts on source answer release and retain the first and later source messages',()=>{
 for(const[seed,id,hold,jump,last,first]of[[0,114,20,21,28,13],[1,159,22,23,28,15],[2,128,20,21,29,13]]){
  const script=fs.readFileSync(base+`DefineSprite_${id}/frame_${last}/DoAction.as`,'utf8');assert(!script.includes('quizTryCount++')&&script.includes('quizTryCount >= 2'));
  for(const answer of[1,3,4]as const){let s=step(quiz(),{type:'choose',answer,seed}as never);assert.equal(s.feedback?.spriteId,id);assert.equal(s.quizTryCount,1);assert.equal(s.wrongText,S.answers[answer-1].wrongFirst);assert(!p036CanClose(s));s=step(s,{type:'advance-feedback',frame:first}as never);assert(p036CanClose(s));s=step(s,{type:'advance-feedback',frame:hold}as never);assert(!s.playing);assert.equal(s.quizTryCount,1);
   const old=s.epoch;s=step(s,{type:'close-feedback'});assert.equal(s.feedback?.frame,jump);assert.equal(s.quizTryCount,1);assert.strictEqual(p036Reduce(s,{type:'advance-feedback',frame:last,epoch:old}),s);s=step(s,{type:'advance-feedback',frame:last}as never);assert.equal(s.phase,'quiz-held');assert.equal(s.quizTryCount,1);
   s=step(s,{type:'choose',answer,seed}as never);assert.equal(s.wrongText,S.answers[answer-1].wrongLater);s=wrongExit(s);assert.equal(s.phase,'postquiz');assert.equal(s.quizTryCount,0);assert.equal(s.mainFrame,94);assert(s.playing&&!s.quizSection);
  }
 }
});
test('source button25 selects B and button24 increments count before choosing exact cubic feedback',()=>{
 assert.deepEqual(S.answers.map(a=>a.characterId),[24,25,24,24]);
 const script=fs.readFileSync(base+'DefineButton2_24/BUTTONCONDACTION on(release).as','utf8');assert(script.includes('quizTryCount++')&&script.includes('quizTryCount == 1'));
 for(const a of S.answers.filter(a=>a.answer!==2)){assert.deepEqual([...script.matchAll(/_global.WrongFeed = "([^"]*)"/g)].map(m=>m[1].replace(/\s+/g,' ')),[a.wrongFirst,a.wrongLater]);assert.equal(a.wrongFirst,'To cube a number, multiply the number by itself, then multiply the result by the number as well. Try again.');}
 assert(fs.readFileSync(base+'DefineButton2_25/BUTTONCONDACTION on(release).as','utf8').includes('_root.showRightFeed();'));
 const seen=new Set<number>();for(let seed=0;seed<32;seed++){let s=wrongExit(step(quiz(),{type:'choose',answer:1,seed}as never));s=step(s,{type:'choose',answer:2,seed}as never);const b=p036Branch(s.feedback!.spriteId);assert.equal(b.kind,'right');seen.add(b.spriteId);assert.equal(s.quizTryCount,1);s=step(s,{type:'advance-feedback',frame:b.terminal}as never);assert.equal(s.phase,'postquiz');assert.equal(s.quizTryCount,1);assert(s.playing&&!s.quizButtonsEnabled);}
 assert.deepEqual([...seen].sort((a,b)=>a-b),[51,63,75,89]);
});
test('source94/95 holds, exact two glossary keys and complete320-frame loop never mark lesson complete',()=>{
 let s=quiz();for(const term of['Evaluate','Function']as const){s=step(s,{type:'open-glossary',term}as never);assert.equal(s.glossary,term);s=step(s,{type:'close-glossary'});assert(!s.glossary&&!s.playing);assert.equal(s.mainFrame,94);}
 s=step(s,{type:'choose',answer:2,seed:0}as never);s=step(s,{type:'advance-feedback',frame:p036Branch(s.feedback!.spriteId).terminal}as never);s=step(s,{type:'advance-main',frame:95}as never);assert(!s.quizSection);s=step(s,{type:'advance-main',frame:320}as never);assert.equal(s.mainFrame,320);assert.equal(s.cycle,0);s=step(s,{type:'advance-main',frame:321}as never);assert.equal(s.cycle,1);assert.equal(s.mainFrame,1);assert(!s.lessonCompleted);s=step(s,{type:'advance-main',frame:94}as never);assert.equal(s.quizTryCount,0);assert.equal(s.phase,'quiz-held');
});
test('source-raised cubic exponents, plain minus23 answer, five glyph-prefix steps and source loop are distinct',()=>{
 assert.equal(p036Visual(74).rawSourceQuestion,'Evaluate the function y = x3 at x = –2.');
 assert.deepEqual(S.answers.map(a=>a.value),['– 23','– 8','– 6','8']);
 assert.deepEqual(S.steps.map(s=>s.text),['y = x³','y = (–2)³','y = (–2) ∙ (–2) ∙ (–2)','y = (4) ∙ (–2)','y = – 8']);
 for(const[id,first,full]of[[11,125,134],[161,169,183],[163,210,262],[164,267,279],[166,295,312]]){const k=String(id)as keyof ReturnType<typeof p036Visual>['stepText'],source=S.steps.find(s=>s.characterId===id)!.text;assert.equal(p036Visual(first-1).stepText[k],'');assert(p036Visual(first).stepText[k]);assert.equal(p036Visual(full).stepText[k],source);for(let f=first;f<=320;f++)assert(source.startsWith(p036Visual(f).stepText[k]));}
 assert.equal(p036Visual(320).answerAlpha.B,1);for(const k of['A','C','D']as const)assert.equal(p036Visual(320).answerAlpha[k],0);assert.equal(p036Visual(320).bMove,1);
});
