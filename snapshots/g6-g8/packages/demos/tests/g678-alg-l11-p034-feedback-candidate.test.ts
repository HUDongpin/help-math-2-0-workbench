import assert from "node:assert/strict";
import test from "node:test";
import {algL11P034FeedbackFrame,algL11P034FeedbackHostMatches,G678_ALG_L11_P034_FEEDBACK_CANDIDATE_MODULE} from "../src/g678-alg-l11-p034-feedback-candidate";
import {createMemoryOnlyLessonHost} from "../src/lesson-host-contract";
import {G678_ALG_L11_P034_SOURCE_FEEDBACK as SOURCE} from "../src/generated/g678-alg-l11-p034-feedback-v1";
import {G678_ALG_L11_D_INSTRUCTIONAL_P034_MODULE} from "../src/g678-alg-l11-tranche-d-instructional-candidates";
const ID="shared-alg001-l11-p034";
const host=()=>createMemoryOnlyLessonHost({releaseId:"p034-test",releaseMemberIds:[ID],currentAnimationId:ID,
  enabledCapabilities:["practice-feedback"],mode:"audit",releasePublished:false});
test("source feedback child frames start at2 and finish only at105:28 /118:27",()=>{
  for(const outcome of["correct","incorrect"]as const){const last=outcome==="correct"?27:28,duration=(last-2)*1000/12;
    assert.equal(algL11P034FeedbackFrame(outcome,0).frame,2);
    assert.equal(algL11P034FeedbackFrame(outcome,duration-0.01).terminal,false);
    assert.equal(algL11P034FeedbackFrame(outcome,duration).frame,last);
    assert.equal(algL11P034FeedbackFrame(outcome,duration).terminal,true);
    assert.equal(algL11P034FeedbackFrame(outcome,duration+10000).frame,last);
  }
  assert.throws(()=>algL11P034FeedbackFrame("correct",-1));
});
test("real host acknowledges both source branches and requires reset between outcomes",()=>{
  const h=host();assert.equal(algL11P034FeedbackHostMatches(h.dispatch({type:"reset-practice-feedback"}),null),true);
  for(const source of SOURCE.feedback){const expected={interactionId:`${ID}-l1-r0-c0-a${source.branchIndex}`,outcome:source.outcome,branchIndex:source.branchIndex,branchCount:2};
    const decision=h.dispatch({type:"record-practice-feedback",...expected});assert.equal(algL11P034FeedbackHostMatches(decision,expected),true);
    assert.equal(algL11P034FeedbackHostMatches(h.dispatch({type:"record-practice-feedback",...expected}),expected),false);
    assert.equal(algL11P034FeedbackHostMatches(h.dispatch({type:"reset-practice-feedback",interactionId:"other"}),null),false);
    assert.equal(algL11P034FeedbackHostMatches(h.dispatch({type:"reset-practice-feedback",interactionId:expected.interactionId}),null),true);
  }
});
test("missing, wrong scope and invalid branch acknowledgments fail closed",()=>{
  const h=host(),expected={interactionId:"test-pair",outcome:"correct" as const,branchIndex:2,branchCount:2};
  assert.equal(algL11P034FeedbackHostMatches(undefined,null),false);
  assert.equal(algL11P034FeedbackHostMatches(h.dispatch({type:"record-practice-feedback",...expected,branchCount:0}),expected),false);
  const decision=h.dispatch({type:"record-practice-feedback",...expected});assert.equal(decision.status,"allowed");
  if(decision.status!=="allowed")throw Error("unreachable");
  assert.equal(algL11P034FeedbackHostMatches({...decision,state:{...decision.state,currentAnimationId:"other"}},expected),false);
  assert.equal(algL11P034FeedbackHostMatches(decision,{...expected,branchIndex:1}),false);
});
test("55 source frames and two unmodified MP3 streams retain source clock metadata without inventing delivery",()=>{
  assert.equal(SOURCE.feedback.reduce((sum,item)=>sum+item.frames.length,0),55);
  for(const item of SOURCE.feedback){assert.equal(item.audioAsset.bytes,11050);assert.equal(item.blocks.length,27);
    assert.equal(item.head.latencySeek,1673);assert.equal(item.sampleCount,48960);assert.equal(item.audioDelivery.url,null);
    assert.equal(item.frames[0].svg.includes("<use"),false);assert.equal(item.frames.at(-1)!.svg.includes("<use"),false);
  }
  assert.equal(SOURCE.feedback[0].blocks[0].frame,2);assert.equal(SOURCE.feedback[1].blocks[0].frame,1);
  assert.deepEqual(G678_ALG_L11_P034_FEEDBACK_CANDIDATE_MODULE.lessonHost.capabilities,["practice-feedback"]);
  assert.deepEqual(G678_ALG_L11_D_INSTRUCTIONAL_P034_MODULE.lessonHost?.capabilities,[]);
});
