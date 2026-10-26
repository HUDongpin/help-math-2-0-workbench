import assert from'node:assert/strict';import test from'node:test';import fs from'node:fs';import{createHash}from'node:crypto';
import{ALG_L07_P038_SOURCE as S,p038InitialState,p038Reduce,p038Branch,p038CanClose,p038Visual,type P038State,type P038Event}from'./alg-l07-p038-state-v1';
const base='migrations/shared-alg001-l07-p038/source-v1/ffdec/scripts/';
const step=(s:P038State,e:Omit<P038Event,'epoch'>)=>p038Reduce(s,{...e,epoch:s.epoch}as P038Event);
function quiz(){return step(step(p038InitialState(),{type:'play'}),{type:'advance-main',frame:117}as never);}
function wrongExit(s:P038State){const b=p038Branch(s.feedback!.spriteId);assert(b.kind==='wrong');s=step(s,{type:'advance-feedback',frame:b.hold}as never);s=step(s,{type:'close-feedback'});return step(s,{type:'advance-feedback',frame:b.terminal}as never);}
test('every wrong graph selection uses source release count, first/later hint, exact branch Close and second-attempt continuation',()=>{
 for(const[seed,id,hold,jump,last,first]of[[0,231,22,23,28,15],[1,185,20,21,29,13],[2,200,21,22,28,14]])for(const answer of[2,3,4]as const){
  const terminal=fs.readFileSync(base+`DefineSprite_${id}/frame_${last}/DoAction.as`,'utf8');assert(!terminal.includes('quizTryCount++')&&terminal.includes('quizTryCount >= 2'));
  let s=step(quiz(),{type:'choose',answer,seed}as never);assert.equal(s.feedback?.spriteId,id);assert.equal(s.quizTryCount,1);assert.equal(s.wrongText,S.answers[answer-1].wrongFirst);assert(!p038CanClose(s));s=step(s,{type:'advance-feedback',frame:first}as never);assert(p038CanClose(s));s=step(s,{type:'advance-feedback',frame:hold}as never);assert(!s.playing);const epoch=s.epoch;s=step(s,{type:'close-feedback'});assert.equal(s.feedback?.frame,jump);assert.strictEqual(p038Reduce(s,{type:'advance-feedback',frame:last,epoch}),s);s=step(s,{type:'advance-feedback',frame:last}as never);assert.equal(s.phase,'quiz-held');assert.equal(s.quizTryCount,1);s=step(s,{type:'choose',answer,seed}as never);assert.equal(s.wrongText,S.answers[answer-1].wrongLater);s=wrongExit(s);assert.equal(s.phase,'postquiz');assert.equal(s.quizTryCount,0);assert.equal(s.mainFrame,117);assert(s.playing&&!s.quizSection);
 }
});
test('A selects all four original right branches; B/C/D match the two source wrong-button scripts',()=>{
 assert.deepEqual(S.answers.map(a=>a.characterId),[71,70,70,72]);
 for(const a of S.answers.filter(a=>a.answer!==1)){const script=fs.readFileSync(base+`DefineButton2_${a.characterId}/BUTTONCONDACTION on(release).as`,'utf8');assert(script.includes('quizTryCount++'));assert.deepEqual([...script.matchAll(/_global.WrongFeed = "([^"]*)"/g)].map(m=>m[1]),[a.wrongFirst,a.wrongLater]);assert.equal(a.wrongLater,'Make ordered pairs from the table. Then choose the graph that contains all those pairs.');}
 const seen=new Set<number>();for(let seed=0;seed<32;seed++){let s=wrongExit(step(quiz(),{type:'choose',answer:2,seed}as never));s=step(s,{type:'choose',answer:1,seed}as never);const b=p038Branch(s.feedback!.spriteId);assert.equal(b.kind,'right');seen.add(b.spriteId);s=step(s,{type:'advance-feedback',frame:b.terminal}as never);assert.equal(s.phase,'postquiz');assert.equal(s.quizTryCount,1);assert(!s.quizButtonsEnabled&&s.playing);}
 assert.deepEqual([...seen].sort((a,b)=>a-b),[104,138,146,160]);
});
test('all three source glossary keys preserve the held quiz and source509 wraps only after a complete final frame',()=>{
 let s=quiz();for(const term of['Graph','Table','Value']as const){s=step(s,{type:'open-glossary',term}as never);assert.equal(s.glossary,term);s=step(s,{type:'close-glossary'});assert(!s.glossary&&!s.playing);assert.equal(s.mainFrame,117);}
 s=step(s,{type:'choose',answer:1,seed:0}as never);s=step(s,{type:'advance-feedback',frame:p038Branch(s.feedback!.spriteId).terminal}as never);s=step(s,{type:'advance-main',frame:118}as never);assert(!s.quizSection);s=step(s,{type:'advance-main',frame:509}as never);assert.equal(s.mainFrame,509);assert.equal(s.cycle,0);s=step(s,{type:'advance-main',frame:510}as never);assert.equal(s.cycle,1);assert.equal(s.mainFrame,1);assert(!s.lessonCompleted);s=step(s,{type:'advance-main',frame:117}as never);assert.equal(s.quizTryCount,0);assert.equal(s.phase,'quiz-held');
});
test('glyph-derived prefixes retain two cubic instructions and exact source term availability',()=>{
 assert.equal(p038Visual(43).paragraphs[0],'Which is the graph of the table y = x3?');assert.equal(p038Visual(112).paragraphs[1],'Use the table of function values to help you identify the correct graph.');
 for(const[term,first]of[['Graph',25],['Table',74],['Value',86]]as const){assert(!p038Visual(first-1).terms.includes(term));assert(p038Visual(first).terms.includes(term));}
 for(let frame=1;frame<=509;frame++){const v=p038Visual(frame);assert(p038Visual(117).paragraphs.every((p,i)=>p.startsWith(v.paragraphs[i])));}
});
test('ten source movements assemble coordinates in x-then-y order and only then add parentheses',()=>{
 assert.deepEqual(S.table.map(p=>[p.x,p.y]),[['–2','–8'],['–1','–1'],['0','0'],['1','1'],['2','8']]);
 for(const[i,p]of S.table.entries()){
  for(const[j,m]of p.movement.entries()){assert.equal(p038Visual(m.first-1).pairs[i].progress[j],0);assert(p038Visual(m.first).pairs[i].progress[j]>0);assert.equal(p038Visual(m.arrive).pairs[i].progress[j],1);}
  assert(p.movement[1].first>p.movement[0].arrive);const bracket=[203,219,236,249,264][i];assert(!p038Visual(bracket-1).pairs[i].bracket);assert(p038Visual(bracket).pairs[i].bracket);assert(bracket>p.movement[1].arrive);
 }
 for(const[i,frame]of [313,324,334,344,355].entries()){assert.equal(p038Visual(frame-1).points[i].alpha,0);assert(p038Visual(frame+1).points[i].alpha>0);}
 assert.deepEqual(p038Visual(509).points.map(p=>p.labelAlpha),[1,1,1,1,1]);assert.deepEqual(p038Visual(509).answerAlpha,{A:1,B:0,C:0,D:0});
});
test('all four authored curve/grid exports are bound byte-for-byte, with native source axis and five source coordinate labels',()=>{
 for(const g of S.graphs){assert.equal(g.labels.length,17);assert.equal(g.paths.flatMap(p=>p.paths).filter(p=>p.stroke==='#cc0000').length,1);for(const shape of g.paths){const b=fs.readFileSync(`migrations/shared-alg001-l07-p038/source-v1/ffdec/shapes/${shape.sourceShapeId}.svg`);assert.equal(createHash('sha256').update(b).digest('hex'),shape.sourceSvgSha256);}}
 assert.deepEqual(S.graphs[0].points.map(p=>p.text),['(–2, –8)','(–1, –1)','(0,0)','(1,1)','(2,8)']);assert(S.graphs.slice(1).every(g=>g.labels.some(l=>l.text==='2-')));
});
