import assert from "node:assert/strict";
import test from "node:test";
import {algL11P044HostQuestionId,algL11P044HostScoreMatches,G678_ALG_L11_P044_HOST_SCORE_CANDIDATE_MODULE} from "../src/g678-alg-l11-p044-host-score-candidate";
import {createMemoryOnlyLessonHost} from "../src/lesson-host-contract";
import {createAlgL11Advanced3AssessmentState,reduceAlgL11Advanced3Assessment,
  G678_ALG_L11_ADVANCED3_TRANCHE_D_ANSWER_KEY} from "../src/g678-alg-l11-advanced3-tranche-d-state";
import {G678_ALG_L11_D_INSTRUCTIONAL_P044_MODULE} from "../src/g678-alg-l11-tranche-d-instructional-candidates";

const ID="shared-alg001-l11-p044";
const makeHost=()=>createMemoryOnlyLessonHost({releaseId:"p044-score-candidate-test",releaseMemberIds:[ID],
  currentAnimationId:ID,enabledCapabilities:["fq-scoring"],mode:"audit",releasePublished:false});

test("ten source-selected aggregate records match the real host exactly, and real reset clears every score field",()=>{
  const host=makeHost();let state=createAlgL11Advanced3AssessmentState(31);
  assert.equal(algL11P044HostScoreMatches(host.dispatch({type:"reset-fq-score"}),state),true);
  for(let i=0;i<10;i++){
    const q=state.questionNumbers[i];const correct=G678_ALG_L11_ADVANCED3_TRANCHE_D_ANSWER_KEY[q-1];
    state=reduceAlgL11Advanced3Assessment(state,{type:"answer",option:i%2?correct:(correct%4+1) as 1|2|3|4,input:"mouse"},31);
    const response=state.responses.at(-1)!;
    const payload={type:"record-fq-score" as const,questionId:algL11P044HostQuestionId(q),correct:response.correct,
      pointsAwarded:response.correct?1:0,pointsPossible:1};
    assert.deepEqual(Object.keys(payload),["type","questionId","correct","pointsAwarded","pointsPossible"]);
    assert.equal(algL11P044HostScoreMatches(host.dispatch(payload),state),true);
  }
  assert.equal(state.phase,"results");assert.equal(host.snapshot().fqScore.correct,5);
  assert.equal(host.snapshot().fqScore.attempted,10);
  const reset=host.dispatch({type:"reset-fq-score"});
  assert.equal(algL11P044HostScoreMatches(reset,createAlgL11Advanced3AssessmentState(31,1)),true);
});

test("blocked, duplicate, wrong-source, out-of-order, and inconsistent aggregate acknowledgments fail closed",()=>{
  const host=makeHost();const initial=createAlgL11Advanced3AssessmentState(31);
  const next=reduceAlgL11Advanced3Assessment(initial,{type:"answer",option:1,input:"mouse"},31);
  const q=initial.questionNumbers[0],correct=next.responses[0].correct;
  const invalid=host.dispatch({type:"record-fq-score",questionId:algL11P044HostQuestionId(q),correct,pointsAwarded:0,pointsPossible:0});
  assert.equal(algL11P044HostScoreMatches(invalid,next),false);assert.equal(host.snapshot().fqScore.attempted,0);
  const payload={type:"record-fq-score" as const,questionId:algL11P044HostQuestionId(q),correct,pointsAwarded:correct?1:0,pointsPossible:1};
  const allowed=host.dispatch(payload);assert.equal(allowed.status,"allowed");
  assert.equal(algL11P044HostScoreMatches(host.dispatch(payload),next),false);
  if(allowed.status!=="allowed")throw Error("unreachable");
  assert.equal(algL11P044HostScoreMatches({...allowed,state:{...allowed.state,currentAnimationId:"other-page"}},next),false);
  assert.equal(algL11P044HostScoreMatches({...allowed,state:{...allowed.state,fqScore:{...allowed.state.fqScore,attempted:2}}},next),false);
  assert.equal(algL11P044HostScoreMatches({...allowed,state:{...allowed.state,fqScore:{...allowed.state.fqScore,scoredQuestionIds:["foreign-question"]}}},next),false);
  assert.equal(algL11P044HostScoreMatches(undefined,next),false);
  assert.throws(()=>algL11P044HostQuestionId(0));assert.throws(()=>algL11P044HostQuestionId(25));
});

test("scoring adapter is a separate capability-scoped module and does not mutate frozen v1 visuals",()=>{
  assert.deepEqual(G678_ALG_L11_P044_HOST_SCORE_CANDIDATE_MODULE.lessonHost.capabilities,["fq-scoring"]);
  assert.deepEqual(G678_ALG_L11_D_INSTRUCTIONAL_P044_MODULE.lessonHost?.capabilities,[]);
  assert.equal(G678_ALG_L11_P044_HOST_SCORE_CANDIDATE_MODULE.lessonHost.storesPersonalData,false);
  assert.equal(G678_ALG_L11_P044_HOST_SCORE_CANDIDATE_MODULE.maturity,"private-current-js");
  assert.equal(G678_ALG_L11_P044_HOST_SCORE_CANDIDATE_MODULE.interactiveStops[0].rendererStateOnResume,"preserve");
});
