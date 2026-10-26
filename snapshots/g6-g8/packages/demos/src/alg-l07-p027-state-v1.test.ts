import assert from'node:assert/strict';import test from'node:test';import fs from'node:fs';
import{ALG_L07_P027_SOURCE as S,p027InitialState,p027Reduce,p027Branch,p027CanClose,p027Visual,type P027State,type P027Event}from'./alg-l07-p027-state-v1';
const base='migrations/shared-alg001-l07-p027/source-v1/ffdec/scripts/';
const step=(s:P027State,e:Omit<P027Event,'epoch'>)=>p027Reduce(s,{...e,epoch:s.epoch}as P027Event);
function quiz(){return step(step(p027InitialState(),{type:'play'}),{type:'advance-main',frame:162}as never);}
function wrongExit(s:P027State){const b=p027Branch(s.feedback!.spriteId);assert(b.kind==='wrong');s=step(s,{type:'advance-feedback',frame:b.hold}as never);s=step(s,{type:'close-feedback'});return step(s,{type:'advance-feedback',frame:b.terminal}as never);}
test('all P027 wrong branches retain source counter order, authored close spans, and second-exit resume',()=>{
 for(const[seed,id,hold,jump,last,first]of[[0,178,22,23,31,16],[1,212,23,24,28,17],[2,192,23,24,29,16]]){
  const script=fs.readFileSync(base+`DefineSprite_${id}/frame_${last}/DoAction.as`,'utf8');assert(script.indexOf('quizTryCount++')<script.indexOf('quizTryCount >= 2'));
  for(const answer of[1,3,4]as const){let s=step(quiz(),{type:'choose',answer,seed}as never);assert.equal(s.feedback?.spriteId,id);assert.equal(s.quizTryCount,0);assert.equal(s.wrongText,S.behavior.wrongFirst);assert(!p027CanClose(s));s=step(s,{type:'advance-feedback',frame:first}as never);assert(p027CanClose(s));s=step(s,{type:'advance-feedback',frame:hold}as never);assert(!s.playing);assert.equal(s.quizTryCount,0);
   const old=s.epoch;s=step(s,{type:'close-feedback'});assert.equal(s.feedback?.frame,jump);assert.equal(s.quizTryCount,0);assert.strictEqual(p027Reduce(s,{type:'advance-feedback',frame:last,epoch:old}),s);s=step(s,{type:'advance-feedback',frame:last}as never);assert.equal(s.phase,'quiz-held');assert.equal(s.quizTryCount,1);
   s=step(s,{type:'choose',answer,seed}as never);assert.equal(s.wrongText,S.behavior.wrongLater);s=wrongExit(s);assert.equal(s.phase,'postquiz');assert.equal(s.quizTryCount,0);assert.equal(s.mainFrame,162);assert(s.playing&&!s.quizSection);}
 }
});
test('source button38 defines all wrong answer text, button39 correct B, and host selector reaches exactly four right branches',()=>{
 const wrong=fs.readFileSync(base+'DefineButton2_38/BUTTONCONDACTION on(release).as','utf8'),right=fs.readFileSync(base+'DefineButton2_39/BUTTONCONDACTION on(release).as','utf8');assert(wrong.includes('quizTryCount == 1')&&!wrong.includes('quizTryCount++'));assert(right.includes('_root.showRightFeed();')&&right.includes('_root.disableQuizButton();'));
 const strings=[...wrong.matchAll(/_global.WrongFeed = "([^"]*)"/g)].map(m=>m[1]);assert.deepEqual(strings,[S.behavior.wrongLater,S.behavior.wrongFirst]);
 const seen=new Set<number>();for(let seed=0;seed<32;seed++){let s=wrongExit(step(quiz(),{type:'choose',answer:1,seed}as never));s=step(s,{type:'choose',answer:2,seed}as never);const b=p027Branch(s.feedback!.spriteId);assert.equal(b.kind,'right');seen.add(b.spriteId);assert.equal(s.quizTryCount,1);s=step(s,{type:'advance-feedback',frame:b.terminal}as never);assert.equal(s.phase,'postquiz');assert.equal(s.quizTryCount,1);assert(s.playing&&!s.quizButtonsEnabled);}
 assert.deepEqual([...seen].sort((a,b)=>a-b),[71,99,124,150]);assert.equal(S.branches.find(b=>b.spriteId===138)?.naturallySelected,false);
});
test('P027 source162/163 and full421-frame loop preserve source glossary and never complete lesson',()=>{
 let s=quiz();for(const term of['Y-intercept','Linear function','Y-coordinate','Graph','Y-axis']as const){s=step(s,{type:'open-glossary',term}as never);assert.equal(s.glossary,term);s=step(s,{type:'close-glossary'});assert(!s.glossary&&!s.playing);assert.equal(s.mainFrame,162);}
 s=step(s,{type:'choose',answer:2,seed:0}as never);s=step(s,{type:'advance-feedback',frame:p027Branch(s.feedback!.spriteId).terminal}as never);s=step(s,{type:'advance-main',frame:163}as never);assert(!s.quizSection);s=step(s,{type:'advance-main',frame:421}as never);assert.equal(s.mainFrame,421);assert.equal(s.cycle,0);s=step(s,{type:'advance-main',frame:422}as never);assert.equal(s.cycle,1);assert.equal(s.mainFrame,1);assert(!s.lessonCompleted);s=step(s,{type:'advance-main',frame:162}as never);assert.equal(s.quizTryCount,0);assert.equal(s.phase,'quiz-held');
});
test('P027 graph and coordinate emphasis follow source placements, including final frame withdrawal',()=>{
 assert.equal(p027Visual(79).definition,'The y-intercept of a linear function is the y-coordinate where the graph');assert.equal(p027Visual(143).question,'crosses the y-axis. What is the y-intercept of this linear function?');
 assert(!p027Visual(195).graph.some(g=>g.sourceShapeId===213));assert(p027Visual(196).graph.some(g=>g.sourceShapeId===213));assert(!p027Visual(197).graph.some(g=>g.sourceShapeId===213));
 assert(p027Visual(235).graph.some(g=>g.sourceShapeId===215&&g.alpha===1));assert.equal(p027Visual(262).annotation?.text,'(0,-1)');
 assert(p027Visual(285).coordinateXEmphasis&&!p027Visual(286).coordinateXEmphasis);assert(p027Visual(297).coordinateYEmphasis&&!p027Visual(298).coordinateYEmphasis);
 assert(p027Visual(347).coordinateYFinalEmphasis&&!p027Visual(421).coordinateYFinalEmphasis);assert(p027Visual(401).answerEmphasis&&!p027Visual(420).answerEmphasis);
 assert.deepEqual(S.answers.map(a=>a.value),['–2','–1','0','1']);assert.equal(S.graph.labels.length,14);assert.equal(S.graph.paths.length,6);
});
