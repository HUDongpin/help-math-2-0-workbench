import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import test from 'node:test';
import {p033InitialState,p033Reduce,P033_BEHAVIOR_SOURCE,type P033State,type P033Event} from './alg-l06-p033-state-v1';
const source='output/alg-l06-p033-source-planning-20261001-v1/';
const B=P033_BEHAVIOR_SOURCE.binding;
const apply=(s:P033State,event:Record<string,unknown>,seed=0)=>p033Reduce(s,{...event,epoch:s.epoch} as P033Event,seed);
function question(){let s=p033InitialState();s=apply(s,{type:'play'}).state;return apply(s,{type:'advance-main',frame:385}).state;}
function select(s:P033State,kind:'wrong'|'right',branch:number){
 s=apply(s,{type:'choose',answer:kind==='wrong'?2:1}).state;
 const max=kind==='wrong'?3:4,seed=(branch-1-(s.selectionSerial%max)+max)%max;
 s=apply(s,{type:'resolve-host-feedback'},seed).state;
 assert.equal(B.branches.find(b=>b.spriteId===s.feedback!.spriteId)!.index,branch);return s;
}
function complete(s:P033State,early=false){
 const b=B.branches.find(b=>b.spriteId===s.feedback!.spriteId)!;
 if(b.kind==='wrong'){
  s=apply(s,{type:'advance-feedback',frame:early?b.closePlacementFirst:b.hold,generation:s.feedback!.generation}).state;
  s=apply(s,{type:'close-wrong',generation:s.feedback!.generation}).state;
 }
 return apply(s,{type:'advance-feedback',frame:b.terminal,generation:s.feedback!.generation}).state;
}

test('page binding is pinned to actual source and source strings rather than answer-number guesses',()=>{
 assert.equal(createHash('sha256').update(fs.readFileSync(source+'source-plan-v1.json')).digest('hex'),P033_BEHAVIOR_SOURCE.sourcePlanSha256);
 const p=JSON.parse(fs.readFileSync(source+'source-plan-v1.json','utf8'));
 assert.equal(p.quiz.sourceCorrectButton,'AnsBtn1');assert.equal(p.quiz.answerTexts.A,'{(0, 9), (4, 8), (–1, 1), (2, –2)}');
 assert.equal(B.wrongFirst,'A set of ordered pairs is a function unless two or more pairs have the same x-coordinate. Try again.');
 assert.equal(B.wrongLater,'A set of ordered pairs is a function unless two or more pairs have the same x-coordinate.');
 assert.deepEqual(B.branches.map(b=>[b.spriteId,b.terminal]),[[78,25],[119,27],[46,31],[111,27],[147,31],[161,29],[175,28]]);
});
test('all nine two-wrong paths increment on release, retry first, and resume only after second terminal',()=>{
 for(const first of [1,2,3])for(const second of [1,2,3]){
  let s=question();assert.equal(s.mainFrame,52);assert.equal(apply(s,{type:'play'}).accepted,false);
  s=select(s,'wrong',first);assert.equal(s.quizTryCount,1);assert.equal(s.wrongFeedText,B.wrongFirst);assert.equal(s.quizButtonsEnabled,false);
  s=complete(s);assert.equal(s.phase,'quiz-held');assert.equal(s.mainFrame,52);assert.equal(s.quizTryCount,1);
  s=select(s,'wrong',second);assert.equal(s.quizTryCount,2);assert.equal(s.wrongFeedText,B.wrongLater);
  s=complete(s);assert.equal(s.phase,'postquiz-resume');assert.equal(s.mainFrame,52);assert.equal(s.quizTryCount,0);assert.equal(s.quizSection,false);
  assert.equal(apply(s,{type:'choose',answer:1}).accepted,false);
  s=apply(s,{type:'advance-main',frame:53}).state;assert.equal(s.mainFrame,53);
  s=apply(s,{type:'advance-main',frame:385}).state;assert.equal(s.phase,'engineering-end-held');assert.equal(s.lessonCompleted,false);
 }
});
test('four correct branches resume main and preserve a prior single wrong count',()=>{
 for(const right of [1,2,3,4])for(const afterWrong of [false,true]){
  let s=question();if(afterWrong)s=complete(select(s,'wrong',1));
  s=select(s,'right',right);s=complete(s);assert.equal(s.phase,'postquiz-resume');assert.equal(s.quizTryCount,afterWrong?1:0);assert.equal(s.quizButtonsEnabled,false);
 }
});
test('Close follows source placement windows including early Close, not an invented wait-only rule',()=>{
 for(const branch of [1,2,3]){
  let s=select(question(),'wrong',branch);const b=B.branches.find(b=>b.spriteId===s.feedback!.spriteId)!;assert(b.kind==='wrong');
  s=apply(s,{type:'advance-feedback',frame:b.closePlacementFirst-1,generation:s.feedback!.generation}).state;
  assert.equal(apply(s,{type:'close-wrong',generation:s.feedback!.generation}).accepted,false);
  s=complete(s,true);assert.equal(s.phase,'quiz-held');assert.equal(s.quizTryCount,1);
 }
});
test('Replay, selection and leave reject late callbacks and stale user/host events',()=>{
 let s=question();const oldEpoch=s.epoch;s=select(s,'wrong',1);const generation=s.feedback!.generation;
 assert.equal(p033Reduce(s,{type:'advance-main',frame:100,epoch:oldEpoch}).accepted,false);
 const replay=apply(s,{type:'replay'});s=replay.state;assert.equal(s.selectionSerial,0);assert.equal(s.mainFrame,1);assert.deepEqual(replay.cleanup,['abort-pending-work','retire-page-owned-media','reset-native-stage']);
 for(const e of [{type:'advance-feedback',frame:22,generation},{type:'resolve-host-feedback'},{type:'choose',answer:1},{type:'replay'}])assert.equal(p033Reduce(s,{...e,epoch:generation} as P033Event).accepted,false);
 s=apply(s,{type:'leave'}).state;assert.equal(apply(s,{type:'play'}).accepted,false);assert.equal(apply(s,{type:'replay'}).accepted,false);
});
test('pause prevents feedback/main advancement, while an authored question stop cannot be bypassed',()=>{
 let s=select(question(),'wrong',1);s=apply(s,{type:'pause'}).state;
 assert.equal(apply(s,{type:'advance-feedback',frame:22,generation:s.feedback!.generation}).accepted,false);
 s=apply(s,{type:'play'}).state;s=apply(s,{type:'advance-feedback',frame:31,generation:s.feedback!.generation}).state;
 assert.equal(s.phase,'wrong-feedback-held');assert.equal(s.feedback!.frame,22);assert.equal(apply(s,{type:'play'}).accepted,false);
 assert.throws(()=>p033Reduce(s,{type:'play',epoch:s.epoch},-1));
});
