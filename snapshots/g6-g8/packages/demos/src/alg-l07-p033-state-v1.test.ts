import assert from'node:assert/strict';import test from'node:test';import fs from'node:fs';
import{ALG_L07_P033_SOURCE as S,p033InitialState,p033Reduce,p033Branch,p033CanClose,p033Visual,type P033State,type P033Event}from'./alg-l07-p033-state-v1';
const base='migrations/shared-alg001-l07-p033/source-v1/ffdec/scripts/';
const step=(s:P033State,e:Omit<P033Event,'epoch'>)=>p033Reduce(s,{...e,epoch:s.epoch}as P033Event);
function quiz(){return step(step(p033InitialState(),{type:'play'}),{type:'advance-main',frame:176}as never);}
function wrongExit(s:P033State){const b=p033Branch(s.feedback!.spriteId);assert(b.kind==='wrong');s=step(s,{type:'advance-feedback',frame:b.hold}as never);s=step(s,{type:'close-feedback'});return step(s,{type:'advance-feedback',frame:b.terminal}as never);}
test('all P033 wrong branches count attempts only at source exit and retain the first and later source messages',()=>{
 for(const[seed,id,hold,jump,last,first]of[[0,143,22,23,31,16],[1,177,23,24,28,17],[2,157,23,24,29,16]]){
  const script=fs.readFileSync(base+`DefineSprite_${id}/frame_${last}/DoAction.as`,'utf8');assert(script.indexOf('quizTryCount++')<script.indexOf('quizTryCount >= 2'));
  for(const answer of[1,2,3]as const){let s=step(quiz(),{type:'choose',answer,seed}as never);assert.equal(s.feedback?.spriteId,id);assert.equal(s.quizTryCount,0);assert.equal(s.wrongText,S.answers[answer-1].wrongFirst);assert(!p033CanClose(s));s=step(s,{type:'advance-feedback',frame:first}as never);assert(p033CanClose(s));s=step(s,{type:'advance-feedback',frame:hold}as never);assert(!s.playing);assert.equal(s.quizTryCount,0);
   const old=s.epoch;s=step(s,{type:'close-feedback'});assert.equal(s.feedback?.frame,jump);assert.equal(s.quizTryCount,0);assert.strictEqual(p033Reduce(s,{type:'advance-feedback',frame:last,epoch:old}),s);s=step(s,{type:'advance-feedback',frame:last}as never);assert.equal(s.phase,'quiz-held');assert.equal(s.quizTryCount,1);
   s=step(s,{type:'choose',answer,seed}as never);assert.equal(s.wrongText,S.answers[answer-1].wrongLater);s=wrongExit(s);assert.equal(s.phase,'postquiz');assert.equal(s.quizTryCount,0);assert.equal(s.mainFrame,176);assert(s.playing&&!s.quizSection);
  }
 }
});
test('source button31 is correct D and button30 carries the exact first/second squaring hint',()=>{
 assert.deepEqual(S.answers.map(a=>a.characterId),[30,30,30,31]);
 const script=fs.readFileSync(base+'DefineButton2_30/BUTTONCONDACTION on(release).as','utf8');assert(script.includes('quizTryCount == 1')&&!script.includes('quizTryCount++'));
 for(const a of S.answers.slice(0,3)){assert.deepEqual([...script.matchAll(/_global.WrongFeed = "([^"]*)"/g)].map(m=>m[1]),[a.wrongLater,a.wrongFirst]);assert.equal(a.wrongFirst,'To square a number, multiply the number by itself. Try again.');assert.equal(a.wrongLater,'To square a number, multiply the number by itself. ');}
 assert(fs.readFileSync(base+'DefineButton2_31/BUTTONCONDACTION on(release).as','utf8').includes('_root.showRightFeed();'));
 const seen=new Set<number>();for(let seed=0;seed<32;seed++){let s=wrongExit(step(quiz(),{type:'choose',answer:1,seed}as never));s=step(s,{type:'choose',answer:4,seed}as never);const b=p033Branch(s.feedback!.spriteId);assert.equal(b.kind,'right');seen.add(b.spriteId);assert.equal(s.quizTryCount,1);s=step(s,{type:'advance-feedback',frame:b.terminal}as never);assert.equal(s.phase,'postquiz');assert.equal(s.quizTryCount,1);assert(s.playing&&!s.quizButtonsEnabled);}
 assert.deepEqual([...seen].sort((a,b)=>a-b),[57,90,102,115]);
});
test('source176/177 holds, exact seven glossary keys and complete374-frame loop never mark lesson complete',()=>{
 let s=quiz();for(const term of['Evaluate','Nonlinear function','Substitute','Value','Input','Variable','Function']as const){s=step(s,{type:'open-glossary',term}as never);assert.equal(s.glossary,term);s=step(s,{type:'close-glossary'});assert(!s.glossary&&!s.playing);assert.equal(s.mainFrame,176);}
 s=step(s,{type:'choose',answer:4,seed:0}as never);s=step(s,{type:'advance-feedback',frame:p033Branch(s.feedback!.spriteId).terminal}as never);s=step(s,{type:'advance-main',frame:177}as never);assert(!s.quizSection);s=step(s,{type:'advance-main',frame:374}as never);assert.equal(s.mainFrame,374);assert.equal(s.cycle,0);s=step(s,{type:'advance-main',frame:375}as never);assert.equal(s.cycle,1);assert.equal(s.mainFrame,1);assert(!s.lessonCompleted);s=step(s,{type:'advance-main',frame:176}as never);assert.equal(s.quizTryCount,0);assert.equal(s.phase,'quiz-held');
});
test('source-raised exponents and four worked steps retain their mathematical meaning and visibility',()=>{
 assert.equal(p033Visual(72).definition,'To evaluate a nonlinear function, first substitute a value for the input variable.');
 assert.equal(p033Visual(162).question,'Evaluate the function y = x² when x = 3.');assert.equal(p033Visual(162).rawSourceQuestion,'Evaluate the function y = x2 when x = 3.');
 assert.deepEqual(S.answers.map(a=>a.value),['1','3','6','9']);
 assert.deepEqual(S.steps.map(s=>s.text),['y = x²','y = 3²','y = 3 ∙ 3','y = 9']);
 for(const[id,first,full]of[[178,214,218],[179,250,255],[180,315,320],[181,323,327]]){const k=String(id)as keyof ReturnType<typeof p033Visual>['stepAlpha'];assert.equal(p033Visual(first-1).stepAlpha[k],0);assert(p033Visual(first).stepAlpha[k]>0);assert.equal(p033Visual(full).stepAlpha[k],1);}
 assert.equal(p033Visual(374).answerAlpha.D,1);for(const k of['A','B','C']as const)assert.equal(p033Visual(374).answerAlpha[k],0);assert.equal(p033Visual(374).dMove,1);
});
test('input and matching numeric result blink only at the exact authored placements',()=>{
 for(const[start,key]of[[336,'input'],[358,'answer'],[358,'result']]as const){for(let i=0;i<14;i++)assert.equal(p033Visual(start+i).emphasis[key],i%2===0);assert(!p033Visual(start-1).emphasis[key]);assert(!p033Visual(start+14).emphasis[key]);}
 assert.deepEqual(Object.values(p033Visual(374).emphasis),[false,false,false]);
});
