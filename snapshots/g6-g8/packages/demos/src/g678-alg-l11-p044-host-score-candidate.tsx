"use client";
import React,{useCallback,useEffect,useRef,useState} from "react";
import type {AnimationRendererProps} from "./contract";
import type {LessonHostDecision} from "./lesson-host-contract";
import {AlgL11DInstructionalAssessmentView,ALG_L11_D_SOURCE_COMPLETION_STOPS,
  G678_ALG_L11_D_INSTRUCTIONAL_P044_MODULE} from "./g678-alg-l11-tranche-d-instructional-candidates";
import {createAlgL11Advanced3AssessmentState,reduceAlgL11Advanced3Assessment,
  type AlgL11Advanced3AssessmentState,type AlgL11Advanced3AssessmentEvent} from "./g678-alg-l11-advanced3-tranche-d-state";

const ID="shared-alg001-l11-p044";
export function algL11P044HostQuestionId(question:number){
  if(!Number.isSafeInteger(question)||question<1||question>24)throw new Error("p044 source question is outside Q1-Q24");
  return `${ID}-q${question}`;
}
export function algL11P044HostScoreMatches(decision:LessonHostDecision|void,state:AlgL11Advanced3AssessmentState){
  if(decision?.status!=="allowed"||decision.capability!=="fq-scoring"||
    decision.state?.currentAnimationId!==ID||decision.state.storage!=="memory-only"||decision.state.storesPersonalData!==false)return false;
  const correct=state.responses.filter(response=>response.correct).length;
  const expectedIds=state.responses.map(response=>algL11P044HostQuestionId(response.questionNumber));
  const score=decision.state.fqScore;
  if(!score||!Array.isArray(score.scoredQuestionIds))return false;
  return score.attempted===state.responses.length&&score.correct===correct&&score.pointsAwarded===correct&&
    score.pointsPossible===state.responses.length&&JSON.stringify(score.scoredQuestionIds)===JSON.stringify(expectedIds)&&
    expectedIds.every((id,index)=>id===algL11P044HostQuestionId(state.questionNumbers[index]));
}

interface Controller {
  readonly assessment:AlgL11Advanced3AssessmentState;
  readonly scoreGate:"initializing"|"ready"|"blocked";
  readonly acknowledgedSourceQuestionIds:readonly string[];
  readonly message:string|null;
}

export function AlgL11P044HostScoreRenderer(props:AnimationRendererProps){
  const [controller,setController]=useState<Controller>(()=>({assessment:createAlgL11Advanced3AssessmentState(props.seed,props.replay??0),
    scoreGate:"initializing",acknowledgedSourceQuestionIds:[],message:null}));
  const current=useRef(controller);
  const request=useRef(props.onLessonHostRequest);request.current=props.onLessonHostRequest;
  const completionSent=useRef(false);
  const publish=useCallback((value:Controller)=>{current.current=value;setController(value);},[]);
  useEffect(()=>{
    const assessment=createAlgL11Advanced3AssessmentState(props.seed,props.replay??0);
    completionSent.current=false;
    const decision=request.current?.({type:"reset-fq-score"});
    const accepted=algL11P044HostScoreMatches(decision,assessment);
    publish({assessment,scoreGate:accepted?"ready":"blocked",acknowledgedSourceQuestionIds:[],
      message:accepted?null:"The lesson player could not reset the quiz score. Replay to retry."});
  },[props.seed,props.replay,publish]);

  function dispatch(event:AlgL11Advanced3AssessmentEvent){
    const before=current.current;
    if(props.paused||before.scoreGate!=="ready")return;
    if(event.type!=="answer"){
      if(event.type==="replay")return; // Runtime Replay owns both identities and host reset.
      publish({...before,assessment:reduceAlgL11Advanced3Assessment(before.assessment,event,props.seed)});return;
    }
    if(before.assessment.phase!=="answering"||![1,2,3,4].includes(event.option))return;
    const after=reduceAlgL11Advanced3Assessment(before.assessment,event,props.seed);
    if(after.responses.length!==before.assessment.responses.length+1)return;
    const response=after.responses.at(-1)!;
    const questionId=algL11P044HostQuestionId(response.questionNumber);
    // Raw selections remain only in local source-review state. The host sees
    // one source question identity and bounded aggregate credit, never an answer.
    const decision=request.current?.({type:"record-fq-score",questionId,correct:response.correct,
      pointsAwarded:response.correct?1:0,pointsPossible:1});
    if(!algL11P044HostScoreMatches(decision,after)){
      publish({...before,scoreGate:"blocked",message:"The lesson player could not record this score. Your quiz did not advance. Replay to restart."});return;
    }
    publish({assessment:after,scoreGate:"ready",acknowledgedSourceQuestionIds:[...before.acknowledgedSourceQuestionIds,questionId],message:null});
  }

  const finished=controller.scoreGate==="ready"&&controller.assessment.phase==="results"&&
    controller.assessment.responses.length===10&&controller.acknowledgedSourceQuestionIds.length===10&&
    controller.acknowledgedSourceQuestionIds.every((id,index)=>id===algL11P044HostQuestionId(controller.assessment.questionNumbers[index]));
  useEffect(()=>{
    if(!finished||props.paused||!props.onInteractiveStopResolved||completionSent.current)return;
    completionSent.current=true;
    const stop=ALG_L11_D_SOURCE_COMPLETION_STOPS.p044;
    props.onInteractiveStopResolved({stopId:stop.id,frameDomain:stop.frameDomain,resolution:stop.resolution,
      source:"maintained-source-derived-interaction"});
  },[finished,props.paused,props.onInteractiveStopResolved]);

  return <div data-host-score-successor="g678-alg-l11-p044-host-score-v1"
    data-host-score-gate={controller.scoreGate}
    data-host-acknowledged-source-questions={controller.acknowledgedSourceQuestionIds.join(",")}
    data-host-score-completion-eligible={String(finished)}>
    {controller.message?<p role="alert">{controller.message}</p>:null}
    <AlgL11DInstructionalAssessmentView state={controller.assessment}
      paused={Boolean(props.paused)||controller.scoreGate!=="ready"} dispatch={dispatch} replay={props.onReplay}/>
    {controller.scoreGate!=="ready"?<button disabled={props.paused||!props.onReplay}
      onClick={props.onReplay} style={{minHeight:44,padding:"8px 16px",fontSize:16}}
      type="button">Replay quiz and reset score</button>:null}
  </div>;
}

export const G678_ALG_L11_P044_HOST_SCORE_CANDIDATE_MODULE=Object.freeze({
  ...G678_ALG_L11_D_INSTRUCTIONAL_P044_MODULE,
  Renderer:AlgL11P044HostScoreRenderer,
  lessonHost:Object.freeze({capabilities:Object.freeze(["fq-scoring" as const]),legacyOperations:"blocked" as const,
    auditStorage:"memory-only" as const,storesPersonalData:false as const}),
});
