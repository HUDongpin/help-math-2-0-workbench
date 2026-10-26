import test from 'node:test';
import assert from 'node:assert/strict';
import {p035InitialState,p035Reduce} from './alg-l06-p035-state-v1';
import {p035CanResolveVariant,p035HostVariant,p035InteractionOwnerFor,
  p035ValidateHostVariants,p035VariantRequest} from './alg-l06-p035-player-model-v1';

const snapshot=(state=p035InitialState())=>({state,phase:'held' as const,
  mainAudioToken:9,feedbackEpoch:4,supplementalEpoch:6,generation:7,failure:null});
const atQuiz=()=>{
  let state=p035InitialState();
  state=p035Reduce(state,{type:'play-main'}).state;
  return p035Reduce(state,{type:'advance-main',frame:145}).state;
};

test('interaction gates follow the committed Canvas and source quiz hold',()=>{
  const q=atQuiz();
  assert.equal(q.mainFrame,145);
  assert.equal(p035InteractionOwnerFor(snapshot(q),false).canChoose,false);
  const owner=p035InteractionOwnerFor(snapshot(q),true);
  assert.equal(owner.canChoose,true);
  assert.equal(owner.mainAudioToken,9);
  assert.equal(owner.feedbackEpoch,4);
  assert.equal(owner.spanishEpoch,6);
  assert.equal(owner.interactionEpoch,7);
  assert.equal(p035InteractionOwnerFor({...snapshot(q),phase:'closed'},true).canChoose,false);
});

test('source feedback request requires host-selected compatible variant',()=>{
  const q=atQuiz();
  const wrong=p035Reduce(q,{type:'choose',choice:'A'}).state;
  const w=p035VariantRequest(wrong,'A');
  assert.ok(w);
  assert.equal(w.sourceHostCall,'_root.showWrongFeed()');
  assert.equal(p035CanResolveVariant(w,80),true);
  assert.equal(p035CanResolveVariant(w,154),false);
  const right=p035Reduce(q,{type:'choose',choice:'B'}).state;
  const r=p035VariantRequest(right,'B');
  assert.ok(r);
  assert.equal(r.sourceHostCall,'_root.showRightFeed()');
  assert.equal(p035CanResolveVariant(r,154),true);
  assert.equal(p035CanResolveVariant(r,179),false);
  assert.equal(p035VariantRequest(right,'A'),null);
  const variants={wrongFirst:80,wrongSecond:95,right:207} as const;
  assert.deepEqual(p035ValidateHostVariants(variants),[80,95,207]);
  assert.equal(p035HostVariant(w,variants),80);
  assert.equal(p035HostVariant(r,variants),207);
  assert.throws(()=>p035ValidateHostVariants({wrongFirst:80,wrongSecond:95,right:179}));
});

test('SA, feedback, and closed states lock native choice independently',()=>{
  const q=atQuiz();
  const sa=p035Reduce(q,{type:'start-supplemental'}).state;
  assert.equal(p035InteractionOwnerFor(snapshot(sa),true).canChoose,false);
  const chosen=p035Reduce(q,{type:'choose',choice:'C'}).state;
  assert.equal(p035InteractionOwnerFor(snapshot(chosen),true).canChoose,false);
  const playing=p035Reduce(chosen,{type:'resolve-feedback',characterId:95}).state;
  const owner=p035InteractionOwnerFor(snapshot(playing),true);
  assert.deepEqual(owner.feedback,{spriteId:95,frame:1});
  assert.equal(owner.wrongTryCount,0);
  assert.equal(owner.canChoose,false);
});

test('wrong popup exposes Close from source-visible alpha through hold and retry restores choices',()=>{
  const chosen=p035Reduce(atQuiz(),{type:'choose',choice:'D'}).state;
  const playing=p035Reduce(chosen,{type:'resolve-feedback',characterId:80}).state;
  assert.equal(p035InteractionOwnerFor(snapshot(playing),true).canCloseFeedback,false);
  const token=playing.feedback!.token;
  const invisible=p035Reduce(playing,{type:'advance-feedback',frame:13,token}).state;
  assert.equal(p035InteractionOwnerFor(snapshot(invisible),true).canCloseFeedback,false);
  const visible=p035Reduce(invisible,{type:'advance-feedback',frame:14,token}).state;
  assert.equal(p035InteractionOwnerFor(snapshot(visible),true).canCloseFeedback,true);
  assert.equal(p035InteractionOwnerFor({...snapshot(visible),phase:'paused'},true).canCloseFeedback,true);
  assert.equal(p035InteractionOwnerFor(snapshot(visible),false).canCloseFeedback,false);
  const held=p035Reduce(playing,{type:'advance-feedback',frame:20,token}).state;
  const close=p035InteractionOwnerFor(snapshot(held),true);
  assert.equal(close.canCloseFeedback,true);
  assert.equal(close.wrongTryCount,0);
  const resumed=p035Reduce(held,{type:'close-wrong',token}).state;
  const retry=p035Reduce(resumed,{type:'advance-feedback',frame:29,token}).state;
  assert.equal(retry.phase,'question');
  assert.equal(p035InteractionOwnerFor(snapshot(retry),true).canChoose,true);
  assert.equal(retry.quizTryCount,1);
});
