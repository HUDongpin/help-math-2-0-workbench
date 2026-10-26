import assert from 'node:assert/strict';
import test from 'node:test';
import {P024_NATIVE_TEXT_SOURCE,p024NativeTextState,p024WrongFeedbackMessage}
 from '../src/alg-l06-p024-native-text-v1';

test('main native reading state waits for complete alpha and quiz stop',()=>{
 const source=P024_NATIVE_TEXT_SOURCE;
 assert.equal(source.inventory.staticTextDefinitions,40);
 assert.equal(source.inventory.dynamicFields,3);
 assert.equal(source.inventory.decodedRuns,54);
 const before=p024NativeTextState('sprite-208',6);
 assert.equal(before.table.available,false);
 assert.equal(before.answers.length,0);
 const entered=p024NativeTextState('sprite-208',7);
 assert.equal(entered.table.textCandidateReady,true);
 assert.equal(entered.table.geometryReady,false);
 assert.equal(entered.table.available,false);
 assert(entered.visibleText.some(item=>item.text===source.reading.definitionText));
 assert.equal(entered.answers.length,0);
 const quiz=p024NativeTextState('sprite-208',154,{quizActive:true});
 assert.deepEqual(quiz.answers.map(answer=>answer.label),['A','B','C','D']);
 assert.equal(p024NativeTextState('sprite-208',154).answers.length,0);
 assert.equal(p024NativeTextState('sprite-208',155,{quizActive:true}).answers.length,0);
 assert(!quiz.visibleText.some(item=>item.text===source.reading.questionText),
  'masked question requires separate full-ink proof');
});

test('glossary alpha candidates are not promoted to hit/ink readiness',()=>{
 const state=p024NativeTextState('sprite-208',7);
 assert.deepEqual(state.glossary.map(row=>[row.key,row.candidateAlphaReady]),
  [['Range',true],['Function',true],['Output',true],['Set',true],
   ['Function table',false]]);
 assert(state.glossary.every(row=>row.interactionReady===false));
 assert.equal(P024_NATIVE_TEXT_SOURCE.policy.translatedSpanishSourceAbsent,true);
 assert.equal(P024_NATIVE_TEXT_SOURCE.policy.canvasGlyphs,'preserved');
});

test('feedback and popup text remain branch-local and source English',()=>{
 assert.equal(p024WrongFeedbackMessage(198,0),
  'The range is the set of outputs. Try again.');
 assert.equal(p024WrongFeedbackMessage(198,1),
  'The range is the set of outputs.');
 assert.equal(p024WrongFeedbackMessage(199,0),
  'Since the range is a set, you must put braces around it. Try again.');
 assert.equal(p024NativeTextState('sprite-65',1,
  {wrongAnswerButtonId:198,quizTryCount:0}).dynamicText,
  'The range is the set of outputs. Try again.');
 assert.equal(p024NativeTextState('sprite-65',1).dynamicText,null);
 assert.throws(()=>p024NativeTextState('sprite-208',382),/P024_TEXT_FRAME_OUT_OF_RANGE/);
});
