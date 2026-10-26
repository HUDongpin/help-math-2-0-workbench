import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import {P024_ANSWERS,P024_FEEDBACK,p024InitialState,p024Reduce,p024AudioIntent,
 type P024State,type P024Answer} from '../src/alg-l06-p024-state-v1';
const tick=(s:P024State,n=1000)=>p024Reduce(s,{type:'tick',frames:n});
const quiz=()=>tick(p024Reduce(p024InitialState(),{type:'play'}));
const answer=(s:P024State,a:P024Answer,v:number)=>p024Reduce(s,{type:'answer',answer:a,variant:v});

test('natural main holds154; Play and additional ticks cannot bypass quiz',()=>{
 const s=quiz();assert.equal(s.phase,'quiz');assert.equal(s.mainFrame,154);
 assert.equal(s.quizSection,true);assert.equal(p024AudioIntent(s),null);
 assert.deepEqual(tick(p024Reduce(s,{type:'play'})),s);
 assert.equal(p024InitialState('es').sa,'idle');assert.equal(p024InitialState('es').playing,false);
 assert.throws(()=>tick(s,-1),/INVALID_TICK/);
});
test('all three wrong variants hold their source popup, first retry, then resume only after second terminal',()=>{
 for(const a of ['A','B','D'] as const)for(let v=1;v<=3;v++){
  let s=quiz();
  for(let attempt=0;attempt<2;attempt++){
   s=answer(s,a,v);assert.equal(s.mainFrame,154);
   assert.equal(s.wrongText.endsWith('Try again.'),attempt===0);
   const id=s.feedback!,spec=P024_FEEDBACK[id];assert.equal(spec.kind,'wrong');
   assert.equal(p024AudioIntent(s)?.owner,id);
   assert.deepEqual(p024Reduce(s,{type:'answer',answer:'C',variant:1}),s,'no double answer');
   s=tick(s);assert.equal(s.phase,'popup');assert.equal(s.feedbackFrame,spec.stop);
   assert.equal(p024AudioIntent(s),null);assert.deepEqual(tick(s),s);
   s=p024Reduce(s,{type:'close-wrong'});assert.equal(s.feedbackFrame,spec.close);
   s=tick(s);assert.equal(s.mainFrame,154);assert.equal(s.feedback,null);
   assert.equal(s.phase,attempt===0?'quiz':'main');assert.equal(s.wrongCount,attempt===0?1:0);
  }
  s=tick(s,1);assert.equal(s.mainFrame,155);s=tick(s);assert.equal(s.phase,'ended');
  assert.equal(s.mainFrame,381);assert.equal(p024AudioIntent(s),null);
 }
});
test('host named right1/2/3/4 chooses155/196/123/188; all terminals resume main',()=>{
 for(const [i,id] of ['sprite-155','sprite-196','sprite-123','sprite-188'].entries()){
  const chosen=answer(quiz(),'C',i+1);assert.equal(chosen.feedback,id);
  const end=tick(chosen);assert.equal(end.phase,'main');assert.equal(end.mainFrame,154);
  assert.equal(end.quizSection,false);assert.equal(end.playing,true);
 }
 let s=answer(quiz(),'A',1);s=tick(s);s=tick(p024Reduce(s,{type:'close-wrong'}));
 assert.equal(s.wrongCount,1);s=tick(answer(s,'C',3));assert.equal(s.wrongCount,1,
  'right terminal source does not reset quizTryCount');
 assert.throws(()=>answer(quiz(),'C',5),/INVALID_FEEDBACK_VARIANT/);
});
test('Pause and glossary freeze independent main/feedback playheads without inventing quiz continuation',()=>{
 const s=answer(quiz(),'D',2);const paused=p024Reduce(s,{type:'pause'});
 assert.deepEqual(tick(paused),paused);assert.equal(p024AudioIntent(paused),null);
 const opened=p024Reduce(s,{type:'glossary-open',key:'Range',nativeReady:true});
 assert.deepEqual(tick(opened),opened);assert.equal(p024AudioIntent(opened),null);
 const closed=p024Reduce(opened,{type:'glossary-close'});assert.equal(closed.playing,true);
 assert.equal(closed.feedback,s.feedback);assert.equal(closed.feedbackFrame,s.feedbackFrame);
 assert.equal(tick(closed,1).feedbackFrame,s.feedbackFrame+1);assert.equal(closed.mainFrame,154);
 const q=p024Reduce(quiz(),{type:'glossary-open',key:'Range',nativeReady:true});
 assert.equal(p024Reduce(q,{type:'glossary-close'}).playing,false);
 assert.deepEqual(p024Reduce(s,{type:'glossary-open',key:'Range',nativeReady:false}),s);
});
test('explicit SA pauses active domain, EOF remains held, Return restores it; locale and Replay never start SA',()=>{
 for(const s of [p024Reduce(p024InitialState(),{type:'play'}),answer(quiz(),'D',3),quiz()]){
  const spanish=p024Reduce(s,{type:'sa-start'});assert.equal(p024AudioIntent(spanish)?.owner,'separate-sa');
  assert.equal(spanish.mainFrame,s.mainFrame);assert.deepEqual(tick(spanish),spanish);
  const eof=p024Reduce(spanish,{type:'sa-ended'});assert.equal(p024AudioIntent(eof),null);
  assert.deepEqual(tick(eof),eof);const returned=p024Reduce(eof,{type:'sa-return'});
  assert.equal(returned.mainFrame,s.mainFrame);assert.equal(returned.feedbackFrame,s.feedbackFrame);
  assert.equal(returned.playing,s.playing);assert.equal(returned.sa,'idle');
  const locale=p024Reduce(s,{type:'locale',locale:'es'});assert.equal(locale.sa,'idle');
  assert.equal(locale.playing,s.playing);const replay=p024Reduce(spanish,{type:'replay'});
  assert.deepEqual(replay,p024InitialState(s.locale));
 }
});
test('answer identities and branch endpoints remain bound to actual AS, not suffix or label guesses',()=>{
 const audit=JSON.parse(fs.readFileSync('output/alg-l06-p024-behavior-audit-v1/behavior-audit-v1.json','utf8'));
 for(const r of audit.feedback){const spec=P024_FEEDBACK[`sprite-${r.id}` as keyof typeof P024_FEEDBACK];
  assert.equal(spec.end,r.end);assert.equal(spec.kind,r.kind);assert.equal(spec.stop,r.stop??null);}
 const source='output/alg-l06-p024-intake-recon-v1/source-export/scripts/';
 assert.match(fs.readFileSync(source+'DefineButton2_197/BUTTONCONDACTION on(release).as','utf8'),/showRightFeed/);
 assert.match(fs.readFileSync(source+'DefineButton2_199/BUTTONCONDACTION on(release).as','utf8'),/braces around it/);
 assert.equal(P024_ANSWERS.C.button,197);assert.equal(P024_ANSWERS.C.depth,143);
});
