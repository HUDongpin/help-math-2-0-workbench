import {useCallback,useEffect,useRef,useState} from "react";
import type {AnimationRendererProps} from "./contract";
import type {LessonHostState} from "./lesson-host-contract";
import type {ActivationInput} from "./g678-advanced-manual/contracts";
import {createAlgL11Advanced3MatchingState,reduceAlgL11Advanced3Matching,
  type AlgL11Advanced3Level,type AlgL11Advanced3MatchingState} from "./g678-alg-l11-advanced3-tranche-d-state";
import {algL11P034FeedbackFrame,algL11P034FeedbackHostMatches} from "./g678-alg-l11-p034-feedback-candidate";
import {ALG_L11_D_SOURCE_COMPLETION_STOPS} from "./g678-alg-l11-tranche-d-instructional-candidates";
import {algL11P034FadeState,useAlgL11P034RevealClock} from "./g678-alg-l11-p034-source-fade";

type Feedback=NonNullable<LessonHostState["practiceFeedback"]>;
export interface P034CompanionControllerState {
  readonly game:AlgL11Advanced3MatchingState;readonly gate:"initializing"|"ready"|"blocked";
  readonly feedback:Feedback|null;readonly completedPairIds:readonly number[];
  readonly attempt:number;readonly cycle:number;readonly message:string|null;
}
const initial=(level:AlgL11Advanced3Level,cycle:number):P034CompanionControllerState=>({game:createAlgL11Advanced3MatchingState(level),
  gate:"initializing",feedback:null,completedPairIds:[],attempt:0,cycle,message:null});
// The frozen predecessor's private clock is not edited. This maintained
// successor owns one instance, shared by source art and the portal presenter.
export function useP034CompanionFeedbackClock(identity:string|null,paused:boolean){
  const current=useRef({identity,elapsedMs:0});const[clock,setClock]=useState(current.current);
  useEffect(()=>{
    if(current.current.identity!==identity)current.current={identity,elapsedMs:0};
    setClock(current.current);if(!identity||paused)return;
    let last=performance.now(),handle=0,active=true;
    const tick=(now:number)=>{if(!active)return;current.current={identity,elapsedMs:current.current.elapsedMs+Math.max(0,now-last)};
      last=now;setClock(current.current);handle=requestAnimationFrame(tick);};
    handle=requestAnimationFrame(tick);
    return()=>{active=false;cancelAnimationFrame(handle);current.current={identity,elapsedMs:current.current.elapsedMs+Math.max(0,performance.now()-last)};};
  },[identity,paused]);
  return clock.identity===identity?clock.elapsedMs:0;
}
export function useP034CompanionController(props:AnimationRendererProps){
  const handoff=props.lessonHostNavigationHandoff;
  const entryLevel=handoff?.kind==="game-level"&&handoff.sourceAnimationId==="shared-alg001-l11-p033"&&handoff.targetAnimationId==="shared-alg001-l11-p034"?handoff.level:1;
  const[controller,setController]=useState(()=>initial(entryLevel,0));const current=useRef(controller);
  const request=useRef(props.onLessonHostRequest);request.current=props.onLessonHostRequest;
  const completeSent=useRef(false);const publish=useCallback((next:P034CompanionControllerState)=>{current.current=next;setController(next);},[]);
  useEffect(()=>{completeSent.current=false;const state=initial(entryLevel,0);
    const accepted=algL11P034FeedbackHostMatches(request.current?.({type:"reset-practice-feedback"}),null);
    publish({...state,gate:accepted?"ready":"blocked",message:accepted?null:"The lesson player could not reset feedback. Replay to retry."});
  },[entryLevel,props.replay,publish]);
  const locked=Boolean(props.paused)||controller.gate!=="ready",identity=controller.feedback?.interactionId??null;
  const elapsed=useP034CompanionFeedbackClock(identity,locked);
  const feedbackFrame=controller.feedback?algL11P034FeedbackFrame(controller.feedback.outcome,elapsed):null;
  const reveal=useAlgL11P034RevealClock(`${props.replay??0}:${controller.cycle}:${controller.game.level}`,
    controller.game.matchedPairIds,locked,Boolean(props.reducedMotion));
  useEffect(()=>{
    if(!feedbackFrame?.terminal||locked)return;const before=current.current;
    if(!before.feedback||before.feedback.interactionId!==identity||before.gate!=="ready")return;
    const decision=request.current?.({type:"reset-practice-feedback",interactionId:before.feedback.interactionId});
    if(!algL11P034FeedbackHostMatches(decision,null)){publish({...before,gate:"blocked",message:"The lesson player could not close feedback. The game did not advance. Replay to restart."});return;}
    const game=reduceAlgL11Advanced3Matching(before.game,{type:"dismiss-feedback",input:"mouse"});
    publish({...before,game,feedback:null,completedPairIds:before.feedback.outcome==="correct"?game.matchedPairIds:before.completedPairIds});
  },[feedbackFrame?.terminal,identity,locked,publish]);
  const finished=controller.gate==="ready"&&controller.game.phase==="complete"&&controller.completedPairIds.length===6&&
    controller.game.matchedPairIds.every(pair=>algL11P034FadeState(reveal.elapsedByPair[pair]??0,true,Boolean(props.reducedMotion)).settled);
  useEffect(()=>{if(!finished||props.paused||completeSent.current||!props.onInteractiveStopResolved)return;
    completeSent.current=true;const stop=ALG_L11_D_SOURCE_COMPLETION_STOPS.p034;
    props.onInteractiveStopResolved({stopId:stop.id,frameDomain:stop.frameDomain,resolution:stop.resolution,source:"maintained-source-derived-interaction"});
  },[finished,props.paused,props.onInteractiveStopResolved]);
  function select(cardId:string,input:ActivationInput="mouse"){
    const before=current.current;if(props.paused||before.gate!=="ready"||before.game.phase!=="choosing")return;
    const next=reduceAlgL11Advanced3Matching(before.game,{type:"select-card",cardId,input});
    if(next.phase!=="correct-feedback"&&next.phase!=="wrong-feedback"){publish({...before,game:next});return;}
    const outcome=next.phase==="correct-feedback"?"correct":"incorrect";
    const feedback:Feedback={interactionId:`shared-alg001-l11-p034-l${before.game.level}-r${props.replay??0}-c${before.cycle}-a${before.attempt+1}`,
      outcome,branchIndex:outcome==="incorrect"?1:2,branchCount:2};
    const decision=request.current?.({type:"record-practice-feedback",...feedback});
    if(!algL11P034FeedbackHostMatches(decision,feedback)){publish({...before,gate:"blocked",message:"The lesson player could not record feedback. Your pair and score did not advance. Replay to restart."});return;}
    publish({...before,game:{...next,selectedCardId:null},feedback,attempt:before.attempt+1});
  }
  function changeLevel(level:AlgL11Advanced3Level){const before=current.current;
    if(props.paused||before.gate!=="ready"||before.game.phase!=="choosing")return;
    if(!algL11P034FeedbackHostMatches(request.current?.({type:"reset-practice-feedback"}),null)){
      publish({...before,gate:"blocked",message:"The lesson player could not reset feedback. The level did not change. Replay to retry."});return;}
    publish({...initial(level,before.cycle+1),gate:"ready"});
  }
  return{controller,locked,elapsed,feedbackFrame,reveal,finished,select,changeLevel};
}
export type P034CompanionController=ReturnType<typeof useP034CompanionController>;
