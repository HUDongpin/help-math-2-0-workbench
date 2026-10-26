import assert from'node:assert/strict';import test from'node:test';import fs from'node:fs';
import{ALG_L07_P030_SOURCE as S,p030InitialState,p030Reduce,p030Branch,p030CanClose,p030Visual,type P030State,type P030Event}from'./alg-l07-p030-state-v1';
import{p030MathText}from'./alg-l07-p030-frame-v1';
const base='migrations/shared-alg001-l07-p030/source-v1/ffdec/scripts/';
const step=(s:P030State,e:Omit<P030Event,'epoch'>)=>p030Reduce(s,{...e,epoch:s.epoch}as P030Event);
function quiz(){return step(step(p030InitialState(),{type:'play'}),{type:'advance-main',frame:368}as never);}
function wrongExit(s:P030State){const b=p030Branch(s.feedback!.spriteId);assert(b.kind==='wrong');s=step(s,{type:'advance-feedback',frame:b.hold}as never);s=step(s,{type:'close-feedback'});return step(s,{type:'advance-feedback',frame:b.terminal}as never);}
test('all P030 wrong branches retain source counter order, authored close spans, and second-exit resume',()=>{
 for(const[seed,id,hold,jump,last,first]of[[0,250,23,24,28,17],[1,229,22,23,28,15],[2,198,20,21,29,13]]){
  const script=fs.readFileSync(base+`DefineSprite_${id}/frame_${last}/DoAction.as`,'utf8');assert(script.indexOf('quizTryCount++')<script.indexOf('quizTryCount >= 2'));
  for(const answer of[1,3,4]as const){let s=step(quiz(),{type:'choose',answer,seed}as never);assert.equal(s.feedback?.spriteId,id);assert.equal(s.quizTryCount,0);assert.equal(s.wrongText,S.behavior.wrongFirst);assert(!p030CanClose(s));s=step(s,{type:'advance-feedback',frame:first}as never);assert(p030CanClose(s));s=step(s,{type:'advance-feedback',frame:hold}as never);assert(!s.playing);assert.equal(s.quizTryCount,0);
   const old=s.epoch;s=step(s,{type:'close-feedback'});assert.equal(s.feedback?.frame,jump);assert.equal(s.quizTryCount,0);assert.strictEqual(p030Reduce(s,{type:'advance-feedback',frame:last,epoch:old}),s);s=step(s,{type:'advance-feedback',frame:last}as never);assert.equal(s.phase,'quiz-held');assert.equal(s.quizTryCount,1);
   s=step(s,{type:'choose',answer,seed}as never);assert.equal(s.wrongText,S.behavior.wrongLater);s=wrongExit(s);assert.equal(s.phase,'postquiz');assert.equal(s.quizTryCount,0);assert.equal(s.mainFrame,368);assert(s.playing&&!s.quizSection);}
 }
});
test('source button49 defines all wrong answer text, button50 correct B, and host selector reaches exactly four right branches',()=>{
 const wrong=fs.readFileSync(base+'DefineButton2_49/BUTTONCONDACTION on(release).as','utf8'),right=fs.readFileSync(base+'DefineButton2_50/BUTTONCONDACTION on(release).as','utf8');assert(wrong.includes('quizTryCount == 1')&&!wrong.includes('quizTryCount++'));assert(right.includes('_root.showRightFeed();')&&right.includes('_root.disableQuizButton();'));
 const strings=[...wrong.matchAll(/_global.WrongFeed = "([^"]*)"/g)].map(m=>m[1]);assert.deepEqual(strings,[S.behavior.wrongLater,S.behavior.wrongFirst]);
 const seen=new Set<number>();for(let seed=0;seed<32;seed++){let s=wrongExit(step(quiz(),{type:'choose',answer:1,seed}as never));s=step(s,{type:'choose',answer:2,seed}as never);const b=p030Branch(s.feedback!.spriteId);assert.equal(b.kind,'right');seen.add(b.spriteId);assert.equal(s.quizTryCount,1);s=step(s,{type:'advance-feedback',frame:b.terminal}as never);assert.equal(s.phase,'postquiz');assert.equal(s.quizTryCount,1);assert(s.playing&&!s.quizButtonsEnabled);}
 assert.deepEqual([...seen].sort((a,b)=>a-b),[82,135,151,172]);assert.equal(S.branches.find(b=>b.spriteId===110)?.naturallySelected,false);
});
test('P030 source368/369 and full1109-frame loop preserve source glossary and never complete lesson',()=>{
 let s=quiz();for(const term of['Graph','Function','Slope','Line']as const){s=step(s,{type:'open-glossary',term}as never);assert.equal(s.glossary,term);s=step(s,{type:'close-glossary'});assert(!s.glossary&&!s.playing);assert.equal(s.mainFrame,368);}
 s=step(s,{type:'choose',answer:2,seed:0}as never);s=step(s,{type:'advance-feedback',frame:p030Branch(s.feedback!.spriteId).terminal}as never);s=step(s,{type:'advance-main',frame:369}as never);assert(!s.quizSection);s=step(s,{type:'advance-main',frame:1109}as never);assert.equal(s.mainFrame,1109);assert.equal(s.cycle,0);s=step(s,{type:'advance-main',frame:1110}as never);assert.equal(s.cycle,1);assert.equal(s.mainFrame,1);assert(!s.lessonCompleted);s=step(s,{type:'advance-main',frame:368}as never);assert.equal(s.quizTryCount,0);assert.equal(s.phase,'quiz-held');
});
test('source graph, question and retained correct answer show the authored distance/time interpretation',()=>{
 assert.equal(p030Visual(63).definition,'The graph shows the distance a car will travel as a function of time.');
 assert.equal(p030Visual(297).question,'The car travels at 45 miles per hour. What is the slope of the line?');
 assert.deepEqual(S.answers.map(a=>a.value),['40','45','50','60']);assert.equal(S.graph.labels.length,16);assert.deepEqual(S.graph.paths.map(p=>p.sourceShapeId),[3,32]);
 assert.deepEqual(p030Visual(368).coordinates.map(c=>c.text),['(0,0)','(5,225)']);assert.equal(p030Visual(1109).answerAlpha.B,1);for(const k of ['A','C','D']as const)assert.equal(p030Visual(1109).answerAlpha[k],0);
});
test('source row reveals precede unit reveals; distance over time uses a documented source correction',()=>{
 const early=p030Visual(600),late=p030Visual(800);assert.equal(p030MathText(early,'slope'),'Slope = 225 ÷ 5 = 45');assert.equal(p030MathText(late,'vertical'),'Vertical change = 225 mi – 0 mi = 225 mi');assert.equal(p030MathText(late,'horizontal'),'Horizontal change = 5 hr – 0 hr = 5 hr');assert.equal(p030MathText(late,'slope'),'Slope = 225 mi ÷ 5 hr = 45 mi/hr');
 assert.equal(S.sourceTexts.find(t=>t.characterId===295)?.text,'mi');assert.deepEqual([S.unitCorrection.sourceTextId,S.unitCorrection.sourceDepth,S.unitCorrection.rawSourceText,S.unitCorrection.productText],['character-295',121,'mi','hr']);
 assert.equal(p030Visual(398).mathAlpha.vertical,0);assert.equal(p030Visual(405).mathAlpha.vertical,1);assert.equal(p030Visual(641).unitAlpha.vertical,0);assert.equal(p030Visual(648).unitAlpha.vertical,1);assert.equal(p030Visual(1031).fractionAlpha,0);assert.equal(p030Visual(1038).fractionAlpha,1);
});
test('source numeric blinks preserve equation roles and withdraw after each emphasis interval',()=>{
 for(const[f,k]of [[95,'distance'],[122,'time'],[425,'vertical225'],[468,'horizontal5'],[513,'slope225'],[534,'divide'],[542,'slope5'],[575,'result45'],[756,'rateUnit']]as const){assert(p030Visual(f).emphasis[k]);assert(!p030Visual(f+1).emphasis[k]);}
 for(const k of ['question45','answer45']as const){assert(p030Visual(834).emphasis[k]);assert(p030Visual(853).emphasis[k]);assert(!p030Visual(854).emphasis[k]);}
 assert.equal(p030Visual(948).conclusion,'Slope is a measure of the rate of change.  The slope of a line is also described');assert.equal(p030Visual(1003).conclusionEnd,'as the ratio of the vertical change to the horizontal change.');assert.equal(p030Visual(1109).terms.length,10);
});
