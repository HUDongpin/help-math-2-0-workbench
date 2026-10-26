import assert from 'node:assert/strict';import {test} from 'node:test';
import {P047_TEXT_BINDING,p047TextSnapshot} from '../src/nms-l01-p047-text-v2';
import {P047_FEEDBACK_BINDINGS} from '../src/generated/nms-l01-p047-feedback-bindings-v1';
import {createP047Quiz,p047InputIdentity,reduceP047Quiz,type P047Choice} from '../src/nms-l01-p047-quiz-v1';
// Independently transcribed source arrayAnswer, retained from the source audit.
const answers=['A','A','B','C','A','C','C','B','A','D','D','C','B','C','B','D','C','C','A','D','B','B','A','D','D','B','B'];
test('all108 source feedback fields derive correct visibility and values from actual review state',()=>{
 assert.equal(P047_FEEDBACK_BINDINGS.length,108);assert.equal(P047_TEXT_BINDING.blocks.length,391);
 const seeds=new Map<number,number>();for(let seed=0;seed<10000&&seeds.size<27;seed++)seeds.set(p047InputIdentity(createP047Quiz(seed)).questionId!,seed);assert.equal(seeds.size,27);
 for(let question=1;question<=27;question++)for(const choice of ['A','B','C','D'] as P047Choice[]){
  let state=createP047Quiz(seeds.get(question)!);
  const initial=p047TextSnapshot(state,'en');assert.equal(initial.status,'ready');assert.equal(initial.blocks.filter(b=>b.id.includes('-feedback-')&&b.visible).length,0);
  for(let ordinal=0;ordinal<10;ordinal++)state=reduceP047Quiz(state,{type:'answer',identity:p047InputIdentity(state),choice:ordinal===0?choice:'A',elapsedMs:(ordinal+1)*1000});
  state=reduceP047Quiz(state,{type:'review',identity:p047InputIdentity(state)});assert.equal(p047InputIdentity(state).questionId,question);
  for(const language of ['en','es'] as const){const snapshot=p047TextSnapshot(state,language);assert.equal(snapshot.status,'ready');const feedback=snapshot.blocks.filter(b=>b.id.includes('-feedback-'));
   const expected=answers[question-1];assert.equal(feedback.filter(b=>b.visible).length,choice===expected?1:2);
   for(const field of P047_FEEDBACK_BINDINGS){const block=feedback.find(b=>b.id===field.blockId)!;const correct=field.question===question&&field.letter===expected,wrong=field.question===question&&field.letter===choice&&choice!==expected;
    assert.equal(block.visible,correct||wrong);assert.equal(block.text,correct?'Correct':wrong?'Incorrect':'');assert.equal(field.sourceFrame,field.question+46);assert.equal(field.sourceInstance,'TxtFeed'+('ABCD'.indexOf(field.letter)+1));}
  }
  state=reduceP047Quiz(state,{type:'replay',identity:p047InputIdentity(state)});assert.equal(p047TextSnapshot(state,'en').blocks.filter(b=>b.id.includes('-feedback-')&&b.visible).length,0);
 }
});
