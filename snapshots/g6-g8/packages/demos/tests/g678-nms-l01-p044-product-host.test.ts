import assert from 'node:assert/strict';
import test from 'node:test';
import {createP044State,reduceP044,P044_CONFIG,type P044State,type P044Event,type P044Transition} from '../src/g678-nms-l01-p044-controller';
import {createMemoryOnlyLessonHost,type LessonHostState} from '../src/lesson-host-contract';
import {p044FeedbackRequest,p044FeedbackResetRequest,p044OwnedFeedbackResetRequest,p044HostMatches,p044HostSnapshotMatches,type P044FeedbackPayload} from '../src/g678-nms-l01-p044-product-host';
const ID='shared-nms002-l01-p044';
function atQuiz(seed=0){let state=createP044State({seed});for(const frame of [312,449,575,697,737]as const){
  let next=reduceP044(state,{type:'main-frame',epoch:state.epoch,clockToken:state.clockToken,frame});assert.equal(next.accepted,true);state=next.state;
  if(frame!==737){next=reduceP044(state,{type:'continue',epoch:state.epoch,stopFrame:frame,sourceTarget:43,input:'mouse'});assert.equal(next.accepted,true);state=next.state;}}
  return state;}
function choose(before:P044State,name:'AnsBtn1'|'AnsBtn2'|'AnsBtn3'|'AnsBtn4'='AnsBtn3'){
  return reduceP044(before,{type:'choose-answer',epoch:before.epoch,instanceName:name,input:'Enter'});}
function terminal(before:P044State){const f=P044_CONFIG.feedback.find(f=>f.name===before.activeFeedback)!;
  return reduceP044(before,{type:'nested-frame',epoch:before.epoch,clockToken:before.clockToken,sourceObjectId:f.sourceObjectId,frame:f.terminalFrame});}
function host(enabled=true,current=ID){return createMemoryOnlyLessonHost({releaseId:'p044-candidate-test',releaseMemberIds:[ID,'other-page'],currentAnimationId:current,
  enabledCapabilities:enabled?['practice-feedback']:[],mode:'audit'});}

test('all four correct and three wrong source branches use 1-based per-kind identities and no raw answer',()=>{
  for(const [name,count,outcome]of [['AnsBtn3',4,'correct'],['AnsBtn1',3,'incorrect']]as const)for(let seed=0;seed<count;seed++){
    const before=atQuiz(seed),transition=choose(before,name),request=p044FeedbackRequest(before,transition)!;
    assert.ok(request);assert.deepEqual(request,{type:'record-practice-feedback',interactionId:`${ID}:e0:attempt-1`,outcome,branchIndex:seed+1,branchCount:count});
    assert.deepEqual(Object.keys(request),['type','interactionId','outcome','branchIndex','branchCount']);assert.ok(Object.isFrozen(request));
  }
});
test('actual memory-only host acknowledges exact source request before a caller commits feedback state',()=>{
  let current=atQuiz();const proposed=choose(current),request=p044FeedbackRequest(current,proposed)!;
  const h=host();assert.equal(current.phase,'quiz');const decision=h.dispatch(request);assert.equal(p044HostMatches(decision,request),true);
  if(p044HostMatches(decision,request))current=proposed.state;assert.equal(current.phase,'feedback');
  assert.equal(p044HostSnapshotMatches(h.snapshot(),request),true);
});
test('blocked capability does not commit local choice, feedback or attempts',()=>{
  const current=atQuiz(),proposed=choose(current),request=p044FeedbackRequest(current,proposed)!;
  const decision=host(false).dispatch(request);assert.equal(decision.status,'blocked');assert.equal(p044HostMatches(decision,request),false);
  let after=current;if(p044HostMatches(decision,request))after=proposed.state;assert.equal(after,current);assert.equal(after.selectedAnswer,null);assert.equal(after.phase,'quiz');
});
test('forged transition/branch/source/counters/extra intents cannot produce a record request',()=>{
  const before=atQuiz(),proposed=choose(before);
  for(const bad of [{...proposed,accepted:false},{...proposed,state:{...proposed.state,activeFeedback:'Mc_Right_Feed4'}},
    {...proposed,state:{...proposed.state,epoch:9}},{...proposed,intents:[]},{...proposed,intents:[...proposed.intents,...proposed.intents]},
    {...proposed,state:{...proposed.state,selections:{right:2,wrong:0}}}])assert.equal(p044FeedbackRequest(before,bad as P044Transition),null);
  assert.equal(p044FeedbackRequest(createP044State(),proposed),null);
});
test('exact host match rejects wrong page/capability/privacy/audit status and every altered branch field',()=>{
  const before=atQuiz(),request=p044FeedbackRequest(before,choose(before))!,decision=host().dispatch(request);assert.equal(decision.status,'allowed');
  for(const bad of [null,{...decision,status:'blocked'},{...decision,capability:'fq-scoring'},{...decision,auditOnly:false},
    {...decision,rawAnswer:'answer'}, {...decision,state:{...decision.state,currentAnimationId:'other-page'}},
    {...decision,state:{...decision.state,storage:'localStorage'}},{...decision,state:{...decision.state,storesPersonalData:true}},
    {...decision,state:{...decision.state,learnerName:'injected'}},{...decision,state:{...decision.state,language:{toString:()=> 'en'}}}])assert.equal(p044HostMatches(bad,request),false);
  const actual=decision.state.practiceFeedback!;
  for(const changed of [{interactionId:`${ID}:e1:attempt-1`},{interactionId:'other-page:e0:attempt-1'},{outcome:'incorrect'},{branchIndex:0},{branchIndex:2},{branchCount:3},{rawAnswer:'injected'}])
    assert.equal(p044HostMatches({...decision,state:{...decision.state,practiceFeedback:{...actual,...changed}}},request),false);
});
test('exact feedback terminal resets only its current interaction; no early or forged terminal reset',()=>{
  const before=atQuiz(),proposed=choose(before),request=p044FeedbackRequest(before,proposed)!,h=host();assert.equal(p044HostMatches(h.dispatch(request),request),true);
  const active=proposed.state,done=terminal(active),reset=p044FeedbackResetRequest(active,done,request)!;
  assert.deepEqual(reset,{type:'reset-practice-feedback',interactionId:request.interactionId});assert.equal(p044HostMatches(h.dispatch(reset),null),true);
  const early=reduceP044(active,{type:'nested-frame',epoch:active.epoch,clockToken:active.clockToken,sourceObjectId:196,frame:2});
  assert.equal(p044FeedbackResetRequest(active,early,request),null);
  assert.equal(p044FeedbackResetRequest(active,{...done,intents:[]},request),null);
  assert.equal(p044FeedbackResetRequest(active,done,{...request,interactionId:`ID:e99:attempt-1`}),null);
});
test('first wrong resets and retries; second wrong resets before source main-resume request',()=>{
  let state=atQuiz(),h=host();for(let attempt=1;attempt<=2;attempt++){
    const proposed=choose(state,'AnsBtn2'),request=p044FeedbackRequest(state,proposed)!;assert.equal(request.interactionId,`${ID}:e0:attempt-${attempt}`);
    assert.equal(p044HostMatches(h.dispatch(request),request),true);state=proposed.state;
    const done=terminal(state),reset=p044FeedbackResetRequest(state,done,request)!;assert.ok(reset);assert.equal(p044HostMatches(h.dispatch(reset),null),true);
    state=done.state;assert.equal(state.phase,attempt===1?'quiz':'awaiting-main-resume');
  }
});
test('active feedback prevents new record; forged host allowance cannot hide branch mismatch',()=>{
  const state=atQuiz(),request=p044FeedbackRequest(state,choose(state))!,h=host();h.dispatch(request);
  assert.equal(p044HostMatches(h.dispatch(request),request),false);
  assert.equal(p044HostMatches({status:'allowed',capability:'practice-feedback',auditOnly:true,state:h.snapshot()},{...request,branchIndex:2}),false);
});
test('init/Replay cleanup is exact page-owned scope; empty host requires no reset and is distinguishable from invalid',()=>{
  const h=host();assert.equal(p044OwnedFeedbackResetRequest(h.snapshot()),null);assert.equal(p044HostSnapshotMatches(h.snapshot(),null),true);
  const state=atQuiz(),request=p044FeedbackRequest(state,choose(state))!;h.dispatch(request);
  const reset=p044OwnedFeedbackResetRequest(h.snapshot(),request.interactionId)!;assert.deepEqual(reset,{type:'reset-practice-feedback',interactionId:request.interactionId});
  assert.equal(p044OwnedFeedbackResetRequest(h.snapshot(),`${ID}:e1:attempt-1`),null);assert.equal(p044HostMatches(h.dispatch(reset),null),true);
  for(const bad of [null,{...h.snapshot(),currentAnimationId:'other-page'},{...h.snapshot(),practiceFeedback:{interactionId:'other-page:quiz',outcome:'correct',branchIndex:1,branchCount:4}}]){
    assert.equal(p044OwnedFeedbackResetRequest(bad),null);assert.equal(p044HostSnapshotMatches(bad,null),false);
  }
});
test('cross-page current state and cross-page active ID never get reset; existing other host state is untouched',()=>{
  const h=host(true,'other-page'),foreign={type:'record-practice-feedback',interactionId:'other-page:quiz',outcome:'incorrect',branchIndex:1,branchCount:3};
  h.dispatch(foreign);const before=h.snapshot();assert.equal(p044OwnedFeedbackResetRequest(before),null);assert.equal(h.snapshot(),before);
  assert.equal(p044HostSnapshotMatches(before,null),false);
});
test('replayed controller uses new epoch ID and old-terminal reset cannot erase new feedback',()=>{
  const before=atQuiz(),first=choose(before),old=p044FeedbackRequest(before,first)!;
  let replay=reduceP044(first.state,{type:'replay',epoch:0,input:'mouse'}).state;
  for(const frame of [312,449,575,697,737]as const){replay=reduceP044(replay,{type:'main-frame',epoch:replay.epoch,clockToken:replay.clockToken,frame}).state;
    if(frame!==737)replay=reduceP044(replay,{type:'continue',epoch:replay.epoch,stopFrame:frame,sourceTarget:43,input:'mouse'}).state;}
  const next=choose(replay),fresh=p044FeedbackRequest(replay,next)!;assert.equal(fresh.interactionId,`${ID}:e1:attempt-1`);
  const h=host();h.dispatch(fresh);assert.equal(p044HostMatches(h.dispatch({type:'reset-practice-feedback',interactionId:old.interactionId}),null),false);
  assert.equal(p044HostSnapshotMatches(h.snapshot(),fresh),true);assert.equal(p044FeedbackResetRequest(next.state,terminal(next.state),old),null);
});
