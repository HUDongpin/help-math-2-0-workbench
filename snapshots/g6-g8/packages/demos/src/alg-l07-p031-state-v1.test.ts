import assert from'node:assert/strict';import test from'node:test';import fs from'node:fs';
import{ALG_L07_P031_SOURCE as S,p031InitialState,p031Reduce,p031Branch,p031CanClose,p031Visual,type P031State,type P031Event}from'./alg-l07-p031-state-v1';
const base='migrations/shared-alg001-l07-p031/source-v1/ffdec/scripts/';
const step=(s:P031State,e:Omit<P031Event,'epoch'>)=>p031Reduce(s,{...e,epoch:s.epoch}as P031Event);
function quiz(){return step(step(p031InitialState(),{type:'play'}),{type:'advance-main',frame:420}as never);}
function wrongExit(s:P031State){const b=p031Branch(s.feedback!.spriteId);assert(b.kind==='wrong');s=step(s,{type:'advance-feedback',frame:b.hold}as never);s=step(s,{type:'close-feedback'});return step(s,{type:'advance-feedback',frame:b.terminal}as never);}
test('all P031 wrong branches count attempts only at source exit and retain the two different answer messages',()=>{
 for(const[seed,id,hold,jump,last,first]of[[0,131,23,24,29,16],[1,144,20,21,28,13],[2,159,21,22,28,14]]){
  const script=fs.readFileSync(base+`DefineSprite_${id}/frame_${last}/DoAction.as`,'utf8');assert(script.indexOf('quizTryCount++')<script.indexOf('quizTryCount >= 2'));
  for(const answer of[1,2,4]as const){let s=step(quiz(),{type:'choose',answer,seed}as never);assert.equal(s.feedback?.spriteId,id);assert.equal(s.quizTryCount,0);assert.equal(s.wrongText,S.answers[answer-1].wrongFirst);assert(!p031CanClose(s));s=step(s,{type:'advance-feedback',frame:first}as never);assert(p031CanClose(s));s=step(s,{type:'advance-feedback',frame:hold}as never);assert(!s.playing);assert.equal(s.quizTryCount,0);
   const old=s.epoch;s=step(s,{type:'close-feedback'});assert.equal(s.feedback?.frame,jump);assert.equal(s.quizTryCount,0);assert.strictEqual(p031Reduce(s,{type:'advance-feedback',frame:last,epoch:old}),s);s=step(s,{type:'advance-feedback',frame:last}as never);assert.equal(s.phase,'quiz-held');assert.equal(s.quizTryCount,1);
   s=step(s,{type:'choose',answer,seed}as never);assert.equal(s.wrongText,S.answers[answer-1].wrongLater);s=wrongExit(s);assert.equal(s.phase,'postquiz');assert.equal(s.quizTryCount,0);assert.equal(s.mainFrame,420);assert(s.playing&&!s.quizSection);
  }
 }
});
test('source button33 is correct C; A35 and B/D34 preserve exact source first/second text',()=>{
 assert.deepEqual(S.answers.map(a=>a.characterId),[35,34,33,34]);
 for(const answer of[1,2,4]){const a=S.answers[answer-1],script=fs.readFileSync(base+`DefineButton2_${a.characterId}/BUTTONCONDACTION on(release).as`,'utf8');assert(script.includes('quizTryCount == 1')&&!script.includes('quizTryCount++'));assert.deepEqual([...script.matchAll(/_global.WrongFeed = "([^"]*)"/g)].map(m=>m[1]),[a.wrongLater,a.wrongFirst]);}
 assert.notEqual(S.answers[0].wrongFirst,S.answers[1].wrongFirst);assert.equal(S.answers[1].wrongFirst,S.answers[3].wrongFirst);
 assert(fs.readFileSync(base+'DefineButton2_33/BUTTONCONDACTION on(release).as','utf8').includes('_root.showRightFeed();'));
 const seen=new Set<number>();for(let seed=0;seed<32;seed++){let s=wrongExit(step(quiz(),{type:'choose',answer:1,seed}as never));s=step(s,{type:'choose',answer:3,seed}as never);const b=p031Branch(s.feedback!.spriteId);assert.equal(b.kind,'right');seen.add(b.spriteId);assert.equal(s.quizTryCount,1);s=step(s,{type:'advance-feedback',frame:b.terminal}as never);assert.equal(s.phase,'postquiz');assert.equal(s.quizTryCount,1);assert(s.playing&&!s.quizButtonsEnabled);}
 assert.deepEqual([...seen].sort((a,b)=>a-b),[69,81,93,106]);
});
test('source420/421 holds, exact three glossary keys and complete572-frame loop never mark lesson complete',()=>{
 let s=quiz();for(const term of['Linear function','Function','Variable']as const){s=step(s,{type:'open-glossary',term}as never);assert.equal(s.glossary,term);s=step(s,{type:'close-glossary'});assert(!s.glossary&&!s.playing);assert.equal(s.mainFrame,420);}
 s=step(s,{type:'choose',answer:3,seed:0}as never);s=step(s,{type:'advance-feedback',frame:p031Branch(s.feedback!.spriteId).terminal}as never);s=step(s,{type:'advance-main',frame:421}as never);assert(!s.quizSection);s=step(s,{type:'advance-main',frame:572}as never);assert.equal(s.mainFrame,572);assert.equal(s.cycle,0);s=step(s,{type:'advance-main',frame:573}as never);assert.equal(s.cycle,1);assert.equal(s.mainFrame,1);assert(!s.lessonCompleted);s=step(s,{type:'advance-main',frame:420}as never);assert.equal(s.quizTryCount,0);assert.equal(s.phase,'quiz-held');
});
test('the authored problem and money-versus-sunglasses formulas retain source roles',()=>{
 assert.equal(p031Visual(171).problem,'Nicky sells sunglasses in the mall on the weekend. Each weekend, she earns 50 cents for each pair of sunglasses she sells, minus an additional 25 dollars she has to pay for her booth.');
 assert.equal(p031Visual(409).question,'Write a linear function to describe how much money Nicky earns in a weekend as a function of the number of sunglasses she sells. Use the variable M for the amount of money Nicky earns and the variable S for the number of sunglasses she sells.');
 assert.deepEqual(S.answers.map(a=>a.value),['M = 50S – 25','S = 50M – 25','M = 0.50S – 25','S = 0.50M – 25']);assert.equal(p031Visual(572).answerAlpha.C,1);for(const k of ['A','B','D']as const)assert.equal(p031Visual(572).answerAlpha[k],0);
});
test('postquiz equation role emphasis blinks at the exact source placements',()=>{
 for(const[start,key]of [[468,'money'],[497,'rate'],[520,'sunglasses'],[558,'booth']]as const){for(let i=0;i<8;i++)assert.equal(p031Visual(start+i).emphasis[key],i%2===0);assert(!p031Visual(start-1).emphasis[key]);assert(!p031Visual(start+8).emphasis[key]);}
 assert.equal(p031Visual(440).cMove,1);assert.deepEqual(Object.values(p031Visual(572).emphasis),[false,false,false,false]);
});
