import {useCallback,useEffect,useRef,useState} from "react";
import type {AnimationRendererProps} from "./contract";
import {algL11P044HostQuestionId,algL11P044HostScoreMatches} from "./g678-alg-l11-p044-host-score-candidate";
import {ALG_L11_D_SOURCE_COMPLETION_STOPS} from "./g678-alg-l11-tranche-d-instructional-candidates";
import {createAlgL11Advanced3AssessmentState,reduceAlgL11Advanced3Assessment,
  type AlgL11Advanced3AssessmentState,type AlgL11Advanced3AssessmentEvent} from "./g678-alg-l11-advanced3-tranche-d-state";
interface Controller {readonly assessment:AlgL11Advanced3AssessmentState;readonly scoreGate:"initializing"|"ready"|"blocked";
  readonly acknowledgedSourceQuestionIds:readonly string[];readonly message:string|null;}
export function useP044CompanionController(props:AnimationRendererProps){
  const[controller,setController]=useState<Controller>(()=>({assessment:createAlgL11Advanced3AssessmentState(props.seed,props.replay??0),
    scoreGate:"initializing",acknowledgedSourceQuestionIds:[],message:null}));
  const current=useRef(controller),request=useRef(props.onLessonHostRequest);request.current=props.onLessonHostRequest;
  const completionSent=useRef(false),publish=useCallback((value:Controller)=>{current.current=value;setController(value);},[]);
  useEffect(()=>{const assessment=createAlgL11Advanced3AssessmentState(props.seed,props.replay??0);completionSent.current=false;
    const accepted=algL11P044HostScoreMatches(request.current?.({type:"reset-fq-score"}),assessment);
    publish({assessment,scoreGate:accepted?"ready":"blocked",acknowledgedSourceQuestionIds:[],
      message:accepted?null:"The lesson player could not reset the quiz score. Replay to retry."});
  },[props.seed,props.replay,publish]);
  function dispatch(event:AlgL11Advanced3AssessmentEvent){
    const before=current.current;if(props.paused||before.scoreGate!=="ready")return;
    if(event.type!=="answer"){if(event.type==="replay")return;
      publish({...before,assessment:reduceAlgL11Advanced3Assessment(before.assessment,event,props.seed)});return;}
    if(before.assessment.phase!=="answering"||![1,2,3,4].includes(event.option))return;
    const after=reduceAlgL11Advanced3Assessment(before.assessment,event,props.seed);if(after.responses.length!==before.assessment.responses.length+1)return;
    const response=after.responses.at(-1)!,questionId=algL11P044HostQuestionId(response.questionNumber);
    const decision=request.current?.({type:"record-fq-score",questionId,correct:response.correct,pointsAwarded:response.correct?1:0,pointsPossible:1});
    if(!algL11P044HostScoreMatches(decision,after)){
      publish({...before,scoreGate:"blocked",message:"The lesson player could not record this score. Your quiz did not advance. Replay to restart."});return;}
    publish({assessment:after,scoreGate:"ready",acknowledgedSourceQuestionIds:[...before.acknowledgedSourceQuestionIds,questionId],message:null});
  }
  const finished=controller.scoreGate==="ready"&&controller.assessment.phase==="results"&&controller.assessment.responses.length===10&&
    controller.acknowledgedSourceQuestionIds.length===10&&controller.acknowledgedSourceQuestionIds.every((id,index)=>id===algL11P044HostQuestionId(controller.assessment.questionNumbers[index]));
  useEffect(()=>{if(!finished||props.paused||!props.onInteractiveStopResolved||completionSent.current)return;
    completionSent.current=true;const stop=ALG_L11_D_SOURCE_COMPLETION_STOPS.p044;
    props.onInteractiveStopResolved({stopId:stop.id,frameDomain:stop.frameDomain,resolution:stop.resolution,source:"maintained-source-derived-interaction"});
  },[finished,props.paused,props.onInteractiveStopResolved]);
  return{controller,finished,dispatch,locked:Boolean(props.paused)||controller.scoreGate!=="ready"};
}
export type P044CompanionController=ReturnType<typeof useP044CompanionController>;
