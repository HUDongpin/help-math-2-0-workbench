import test from 'node:test';import assert from 'node:assert/strict';
import {initialP049State,reduceP049,type P049State,type P049Event} from './alg-l06-p049-state-v1';
import {createFixedFeedbackQuiz,type FixedQuizState,type FixedQuizEvent} from './source-fixed-feedback-quiz-v1';
import {initialP048State,reduceP048} from './alg-l06-p048-state-v1';
import p048 from '../../../migrations/shared-alg001-l06-p048/native-v1/native-bindings-v2.json';
import p049 from '../../../migrations/shared-alg001-l06-p049/native-v1/native-bindings-v3.json';
function step(s:P049State,type:string,fields:Partial<P049Event>={}){const t=reduceP049(s,{type,epoch:s.epoch,quizGeneration:s.quizGeneration,...fields});assert(t.accepted,t.reason);return t.state;}
function quiz(){return step(step(initialP049State(),'start-main'),'advance-main',{frame:159});}
function wrong(s:P049State){s=step(s,'choose',{choice:'A'});s=step(s,'advance-feedback',{frame:22,token:s.feedback!.token});s=step(s,'close-wrong',{token:s.feedback!.token});return step(s,'advance-feedback',{frame:28,token:s.feedback!.token});}
test('P049 B is correct; authored 159/160/401 and right4 192/25',()=>{
 let s=quiz();s=step(s,'choose',{choice:'B'});assert.equal(s.feedback?.spriteId,192);
 s=step(s,'advance-feedback',{frame:25,token:s.feedback!.token});assert.equal(s.mainFrame,160);assert.equal(s.quizTryCount,0);
 s=step(s,'advance-main',{frame:401});assert.equal(s.phase,'engineering-end-held');assert.equal(s.lessonCompleted,false);
});
test('P049 wrong popup15, stop22, Close23 and attempt increment only at28',()=>{
 let s=quiz();s=step(s,'choose',{choice:'D'});assert.equal(s.feedback?.spriteId,302);assert.equal(s.quizTryCount,0);
 s=step(s,'advance-feedback',{frame:14,token:s.feedback!.token});assert.equal(s.wrongFeedbackPopupVisible,false);
 s=step(s,'advance-feedback',{frame:15,token:s.feedback!.token});assert.equal(s.wrongFeedbackPopupVisible,true);
 s=step(s,'advance-feedback',{frame:28,token:s.feedback!.token});assert.equal(s.feedback?.frame,22);assert.equal(s.quizTryCount,0);
 assert.equal(reduceP049(s,{type:'advance-feedback',epoch:s.epoch,frame:28,token:s.feedback!.token}).accepted,false);
 s=step(s,'close-wrong',{token:s.feedback!.token});assert.equal(s.feedback?.frame,23);
 s=step(s,'advance-feedback',{frame:27,token:s.feedback!.token});assert.equal(s.quizTryCount,0);
 s=step(s,'advance-feedback',{frame:28,token:s.feedback!.token});assert.equal(s.quizTryCount,1);assert.equal(s.phase,'quiz-held');
 s=wrong(s);assert.equal(s.mainFrame,160);assert.equal(s.quizTryCount,0);
});
test('P049 help Convert glossary retains retry; right after one wrong preserves count',()=>{
 let s=wrong(quiz());assert.equal(s.quizTryCount,1);s=step(s,'open-nmh');s=step(s,'glossary',{buttonId:137});assert.equal(s.glossaryTerm,'Convert');
 s=step(s,'close-glossary');assert(s.nmhPopupVisible);s=step(s,'close-nmh');assert.equal(s.quizTryCount,1);
 s=step(s,'choose',{choice:'B'});s=step(s,'advance-feedback',{frame:25,token:s.feedback!.token});assert.equal(s.quizTryCount,1);assert.equal(s.mainFrame,160);
});
test('P049 Replay and leave reject stale answer, feedback and audio callbacks',()=>{
 let s=quiz(),generation=s.quizGeneration;s=step(s,'choose',{choice:'A'});const old=s,token=s.feedback!.token;s=step(s,'replay');
 assert.deepEqual(s,initialP049State(1));assert.equal(reduceP049(s,{type:'advance-feedback',epoch:old.epoch,token,frame:22}).accepted,false);
 s=step(step(s,'start-main'),'advance-main',{frame:159});assert.equal(reduceP049(s,{type:'choose',epoch:s.epoch,quizGeneration:generation+2,choice:'A'}).accepted,false);
 s=step(s,'leave');assert.equal(s.phase,'left');assert.equal(reduceP049(s,{type:'start-main',epoch:s.epoch}).accepted,false);
});
test('source contract rejects random selection and wrong reset semantics',()=>{
 assert.throws(()=>createFixedFeedbackQuiz({...p049,behavior:{...p049.behavior,randomFeedbackCalled:true}}));
 assert.throws(()=>createFixedFeedbackQuiz({...p049,behavior:{...p049.behavior,right4:{...p049.behavior.right4,preservesPriorWrongCount:false}}}));
});
test('shared core preserves actual frozen P048 reducer across both answer paths and lifecycle',()=>{
 const core=createFixedFeedbackQuiz(p048);
 for(const choices of [['A'],['B','A'],['B','D']] as const){
  let a=initialP048State(),b:FixedQuizState=core.initialState();
  const event=(type:string,fields:Partial<FixedQuizEvent>={})=>{const e={type,epoch:a.epoch,quizGeneration:a.quizGeneration,...fields};const x=reduceP048(a,e),y=core.reduce(b,e);assert.deepEqual(y,x);a=x.state;b=y.state;};
  event('start-main');event('advance-main',{frame:20});event('pause-clock');event('resume-clock');event('advance-main',{frame:224});
  event('open-nmh');event('glossary',{buttonId:137});event('close-glossary');event('close-nmh');
  for(const choice of choices){event('choose',{choice});const token=a.feedback!.token;if(choice==='A')event('advance-feedback',{frame:25,token});else {event('advance-feedback',{frame:16,token});event('advance-feedback',{frame:22,token});event('close-wrong',{token});event('advance-feedback',{frame:31,token});}}
  event('advance-main',{frame:327});event('replay');event('leave');
 }
});
