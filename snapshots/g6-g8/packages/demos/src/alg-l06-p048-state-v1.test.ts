import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import model from '../../../migrations/shared-alg001-l06-p048/native-v1/source-model-v1.json';
import {initialP048State,reduceP048,P048_CHOICES,
  type P048State,type P048Event,type P048Choice} from './alg-l06-p048-state-v1';

function act(state:P048State,type:string,fields:Partial<P048Event>={}){
  const result=reduceP048(state,{type,epoch:state.epoch,quizGeneration:state.quizGeneration,...fields});
  assert.ok(result.accepted,result.reason);return result;
}
function quiz(){return act(act(initialP048State(),'start-main').state,'advance-main',{frame:224}).state;}
function choose(s:P048State,choice:P048Choice){return act(s,'choose',{choice}).state;}
function feedback(s:P048State,frame:number){return act(s,'advance-feedback',{token:s.feedback!.token,frame}).state;}
function wrong(s:P048State,choice:P048Choice){
  const priorCount=s.quizTryCount;
  s=choose(s,choice);s=feedback(s,31);assert.equal(s.feedback!.frame,22);
  assert.equal(s.quizTryCount,priorCount);
  assert.equal(reduceP048(s,{type:'advance-feedback',epoch:s.epoch,token:s.feedback!.token,frame:31}).accepted,false);
  s=act(s,'close-wrong',{token:s.feedback!.token}).state;
  assert.equal(s.feedback!.frame,23);
  return feedback(s,31);
}

test('P048 answer labels come from source hit geometry, not AnsBtn numbering',()=>{
  assert.equal(model.assetId,'swf-03a8334e6349a9e80b47bdea4d2c5ada40f635570be5d63f70e8706a03761780');
  assert.deepEqual(model.answerPlacements.map(x=>[x.letter,x.instance,x.buttonId,x.textId,x.branch]),[
    ['A','AnsBtn2',175,167,'right4'],['B','AnsBtn1',174,169,'wrong4'],
    ['C','AnsBtn3',174,171,'wrong4'],['D','AnsBtn4',174,173,'wrong4']]);
  assert.equal(P048_CHOICES.A.text,'The efficiency is at its highest.  ');
  assert.ok(model.answerPlacements.every(x=>x.textOverlap>=.5));
  const script=readFileSync(new URL('../../../migrations/shared-alg001-l06-p048/audit-v1/ffdec-export/scripts/DefineButton2_175/BUTTONCONDACTION on(release).as',import.meta.url),'utf8');
  assert.match(script,/Mc_Right_Feed4\.gotoAndPlay\(2\)/);
});

test('source main clamps at quiz224; natural end327 is not lesson completion',()=>{
  let s=act(initialP048State(),'start-main').state;
  s=act(s,'advance-main',{frame:327}).state;
  assert.equal(s.mainFrame,224);assert.equal(s.phase,'quiz-held');
  s=feedback(choose(s,'A'),25);
  assert.equal(s.mainFrame,225);assert.equal(s.phase,'postquiz');
  s=act(s,'advance-main',{frame:327}).state;
  assert.equal(s.phase,'engineering-end-held');assert.equal(s.lessonCompleted,false);
});

test('all nine wrong-answer pairs require Close and count only at tail31',()=>{
  for(const first of ['B','C','D'] as const)for(const second of ['B','C','D'] as const){
    const q=quiz();let s=choose(q,first);
    assert.equal(s.wrongFeedText,'Study the graph carefully.Try again.');
    assert.equal(s.quizTryCount,0);
    assert.equal(reduceP048(s,{type:'close-wrong',epoch:s.epoch,token:s.feedback!.token}).accepted,false);
    s=feedback(s,16);assert.equal(s.wrongFeedbackPopupVisible,true);
    s=feedback(s,22);assert.equal(s.quizTryCount,0);
    s=act(s,'close-wrong',{token:s.feedback!.token}).state;assert.equal(s.quizTryCount,0);
    s=feedback(s,30);assert.equal(s.quizTryCount,0);
    s=feedback(s,31);assert.equal(s.phase,'quiz-held');assert.equal(s.quizTryCount,1);
    assert.equal(s.quizGeneration,q.quizGeneration+1);
    const chosen=choose(s,second);assert.equal(chosen.wrongFeedText,'Study the graph carefully.');
    s=wrong(s,second);assert.equal(s.phase,'postquiz');assert.equal(s.mainFrame,225);
    assert.equal(s.quizTryCount,0);assert.equal(s.quizButtonsEnabled,false);
  }
});

test('right after any first wrong preserves source count and does not choose a random variant',()=>{
  for(const choice of ['B','C','D'] as const){
    const retried=wrong(quiz(),choice);const right=choose(retried,'A');
    assert.equal(right.feedback!.spriteId,217);
    const next=feedback(right,25);assert.equal(next.mainFrame,225);
    assert.equal(next.quizTryCount,1);assert.equal(next.quizSection,false);
  }
});

test('paused main/head/tail cannot advance until explicitly resumed',()=>{
  let s=act(initialP048State(),'start-main').state;
  s=act(s,'advance-main',{frame:40}).state;
  s=act(s,'pause-clock').state;
  assert.equal(reduceP048(s,{type:'advance-main',epoch:0,frame:50}).accepted,false);
  s=act(s,'resume-clock').state;s=act(s,'advance-main',{frame:224}).state;
  s=choose(s,'B');s=feedback(s,15);s=act(s,'pause-clock').state;
  assert.equal(reduceP048(s,{type:'advance-feedback',epoch:0,token:s.feedback!.token,frame:22}).accepted,false);
  s=act(s,'resume-clock').state;s=feedback(s,22);
  s=act(s,'close-wrong',{token:s.feedback!.token}).state;
  s=act(s,'pause-clock').state;
  assert.equal(s.quizTryCount,0);s=act(s,'resume-clock').state;
  assert.equal(feedback(s,31).quizTryCount,1);
});

test('help -> host glossary -> help -> quiz retains attempt and selection',()=>{
  let s=wrong(quiz(),'C');const count=s.quizTryCount;
  s=act(s,'open-nmh').state;
  assert.equal(reduceP048(s,{type:'choose',choice:'A',epoch:0,quizGeneration:s.quizGeneration}).accepted,false);
  assert.equal(reduceP048(s,{type:'glossary',buttonId:158,epoch:0,quizGeneration:s.quizGeneration}).accepted,false);
  s=act(s,'glossary',{buttonId:137}).state;
  assert.equal(s.glossaryTerm,'Graph');assert.equal(s.nmhPopupVisible,true);
  s=act(s,'close-glossary').state;
  assert.equal(s.phase,'nmh-popup');assert.equal(s.quizButtonsEnabled,false);
  s=act(s,'close-nmh').state;
  assert.equal(s.quizTryCount,count);assert.equal(s.selected,'C');assert.equal(s.quizButtonsEnabled,true);
});

test('all four main glossary terms are unavailable at frame1 and return held',()=>{
  for(const buttonId of [158,159,160,161]){
    assert.equal(reduceP048(initialP048State(),{type:'glossary',epoch:0,quizGeneration:0,buttonId}).accepted,false);
    let s=act(initialP048State(),'start-main').state;s=act(s,'advance-main',{frame:2}).state;
    s=act(s,'glossary',{buttonId}).state;s=act(s,'close-glossary').state;
    assert.equal(s.mainFrame,2);assert.equal(s.mainPlaying,false);
    s=act(s,'resume-clock').state;assert.equal(s.mainPlaying,true);
  }
});

test('Replay and leave invalidate stale generation, feedback and audio callbacks',()=>{
  const first=choose(quiz(),'B'),token=first.feedback!.token,owner=first.audioOwner!;
  const reset=act(first,'replay').state;
  assert.deepEqual(reset,initialP048State(1));
  for(const event of [{type:'advance-feedback',token,frame:22},{type:'audio-complete',owner},
    {type:'choose',choice:'A' as const,quizGeneration:first.quizGeneration}])
    assert.equal(reduceP048(reset,{...event,epoch:0}).accepted,false);
  const left=act(first,'leave');assert.equal(left.state.phase,'left');
  assert.ok(left.effects.some(x=>x.type==='host:cleanup'));
  assert.equal(reduceP048(left.state,{type:'start-main',epoch:1}).accepted,false);
});

test('old feedback token and old retry generation cannot alter the new attempt',()=>{
  const initial=choose(quiz(),'D'),oldToken=initial.feedback!.token;
  const retried=wrong(quiz(),'D');
  assert.equal(reduceP048(retried,{type:'choose',choice:'A',epoch:0,quizGeneration:1}).accepted,false);
  const current=choose(retried,'B');
  assert.equal(reduceP048(current,{type:'advance-feedback',epoch:0,token:oldToken,frame:22}).accepted,false);
});
