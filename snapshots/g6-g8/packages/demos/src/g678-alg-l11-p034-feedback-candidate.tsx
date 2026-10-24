"use client";
import React,{useCallback,useEffect,useRef,useState} from "react";
import type {AnimationRendererProps} from "./contract";
import type {LessonHostDecision,LessonHostState} from "./lesson-host-contract";
import {G678_ALG_L11_D_INSTRUCTIONAL_P034_MODULE,ALG_L11_D_SOURCE_COMPLETION_STOPS} from "./g678-alg-l11-tranche-d-instructional-candidates";
import {createAlgL11Advanced3MatchingState,reduceAlgL11Advanced3Matching,
  type AlgL11Advanced3Level,type AlgL11Advanced3MatchingState} from "./g678-alg-l11-advanced3-tranche-d-state";
import {G678_ALG_L11_D_INSTRUCTIONAL_VISUALS as VISUALS} from "./generated/g678-alg-l11-tranche-d-instructional-visuals-v1";
import {G678_ALG_L11_P034_SOURCE_FEEDBACK as SOURCE} from "./generated/g678-alg-l11-p034-feedback-v1";
import {algL11P034FadeState,useAlgL11P034RevealClock} from "./g678-alg-l11-p034-source-fade";
import {algL11P034RevealedTile} from "./g678-alg-l11-p034-source-reveal";

const ID="shared-alg001-l11-p034";
type Feedback=NonNullable<LessonHostState["practiceFeedback"]>;
interface Controller {
  readonly game:AlgL11Advanced3MatchingState;
  readonly gate:"initializing"|"ready"|"blocked";
  readonly feedback:Feedback|null;
  readonly completedPairIds:readonly number[];
  readonly attempt:number;
  readonly cycle:number;
  readonly message:string|null;
}
export function algL11P034FeedbackHostMatches(decision:LessonHostDecision|void,expected:Feedback|null){
  return decision?.status==="allowed"&&decision.capability==="practice-feedback"&&
    decision.state?.currentAnimationId===ID&&decision.state.storage==="memory-only"&&decision.state.storesPersonalData===false&&
    JSON.stringify(decision.state.practiceFeedback)===JSON.stringify(expected);
}
export function algL11P034FeedbackFrame(outcome:"correct"|"incorrect",elapsedMs:number){
  if(!Number.isFinite(elapsedMs)||elapsedMs<0)throw Error("Invalid source feedback elapsed time");
  const source=SOURCE.feedback.find(item=>item.outcome===outcome)!;
  const frame=Math.min(source.terminalFrame,source.startFrame+Math.floor(elapsedMs*SOURCE.fps/1000+1e-9));
  return{frame,terminal:frame===source.terminalFrame,source};
}
function useFeedbackClock(identity:string|null,paused:boolean){
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
const buttonStyle:React.CSSProperties={minHeight:44,padding:"10px 14px",border:"2px solid #2459a9",borderRadius:8,background:"white",color:"#13284c",fontSize:16};
function Art({visual,label}:{visual:{readonly svg:string;readonly sha256:string};label:string}){
  return<span role="img" aria-label={label} data-source-vector-sha256={visual.sha256}
    style={{display:"block",pointerEvents:"none"}} dangerouslySetInnerHTML={{__html:visual.svg}}/>;
}
function initial(level:AlgL11Advanced3Level,cycle:number):Controller{return{game:createAlgL11Advanced3MatchingState(level),
  gate:"initializing",feedback:null,completedPairIds:[],attempt:0,cycle,message:null};}

export function AlgL11P034FeedbackRenderer(props:AnimationRendererProps){
  const handoff=props.lessonHostNavigationHandoff;
  const entryLevel=handoff?.kind==="game-level"&&handoff.sourceAnimationId==="shared-alg001-l11-p033"&&handoff.targetAnimationId===ID?handoff.level:1;
  const[controller,setController]=useState(()=>initial(entryLevel,0));const current=useRef(controller);
  const request=useRef(props.onLessonHostRequest);request.current=props.onLessonHostRequest;
  const completeSent=useRef(false);
  const publish=useCallback((next:Controller)=>{current.current=next;setController(next);},[]);
  useEffect(()=>{
    completeSent.current=false;const state=initial(entryLevel,0);
    const decision=request.current?.({type:"reset-practice-feedback"});
    const accepted=algL11P034FeedbackHostMatches(decision,null);
    publish({...state,gate:accepted?"ready":"blocked",message:accepted?null:"The lesson player could not reset feedback. Replay to retry."});
  },[entryLevel,props.replay,publish]);
  const locked=Boolean(props.paused)||controller.gate!=="ready";
  const identity=controller.feedback?.interactionId??null;
  const elapsed=useFeedbackClock(identity,locked);
  const feedbackFrame=controller.feedback?algL11P034FeedbackFrame(controller.feedback.outcome,elapsed):null;
  const reveal=useAlgL11P034RevealClock(`${props.replay??0}:${controller.cycle}:${controller.game.level}`,
    controller.game.matchedPairIds,locked,Boolean(props.reducedMotion));
  useEffect(()=>{
    if(!feedbackFrame?.terminal||locked)return;
    const before=current.current;if(!before.feedback||before.feedback.interactionId!==identity||before.gate!=="ready")return;
    const decision=request.current?.({type:"reset-practice-feedback",interactionId:before.feedback.interactionId});
    if(!algL11P034FeedbackHostMatches(decision,null)){
      publish({...before,gate:"blocked",message:"The lesson player could not close feedback. The game did not advance. Replay to restart."});return;
    }
    const game=reduceAlgL11Advanced3Matching(before.game,{type:"dismiss-feedback",input:"mouse"});
    publish({...before,game,feedback:null,completedPairIds:before.feedback.outcome==="correct"?game.matchedPairIds:before.completedPairIds});
  },[feedbackFrame?.terminal,identity,locked,publish]);
  const finished=controller.gate==="ready"&&controller.game.phase==="complete"&&controller.completedPairIds.length===6&&
    controller.game.matchedPairIds.every(pair=>algL11P034FadeState(reveal.elapsedByPair[pair]??0,true,Boolean(props.reducedMotion)).settled);
  useEffect(()=>{
    if(!finished||props.paused||completeSent.current||!props.onInteractiveStopResolved)return;
    completeSent.current=true;const stop=ALG_L11_D_SOURCE_COMPLETION_STOPS.p034;
    props.onInteractiveStopResolved({stopId:stop.id,frameDomain:stop.frameDomain,resolution:stop.resolution,source:"maintained-source-derived-interaction"});
  },[finished,props.paused,props.onInteractiveStopResolved]);

  function select(cardId:string){
    const before=current.current;if(props.paused||before.gate!=="ready"||before.game.phase!=="choosing")return;
    const next=reduceAlgL11Advanced3Matching(before.game,{type:"select-card",cardId,input:"mouse"});
    if(next.phase!=="correct-feedback"&&next.phase!=="wrong-feedback"){publish({...before,game:next});return;}
    const outcome=next.phase==="correct-feedback"?"correct":"incorrect";
    const source=SOURCE.feedback.find(item=>item.outcome===outcome)!;
    const feedback:Feedback={interactionId:`${ID}-l${before.game.level}-r${props.replay??0}-c${before.cycle}-a${before.attempt+1}`,
      outcome,branchIndex:source.branchIndex,branchCount:2};
    const decision=request.current?.({type:"record-practice-feedback",...feedback});
    if(!algL11P034FeedbackHostMatches(decision,feedback)){
      publish({...before,gate:"blocked",message:"The lesson player could not record feedback. Your pair and score did not advance. Replay to restart."});return;
    }
    // Source points and picture fade start on the acknowledged second click;
    // completed-pair count changes only at the correct child's final frame.
    publish({...before,game:{...next,selectedCardId:null},feedback,attempt:before.attempt+1});
  }
  function changeLevel(level:AlgL11Advanced3Level){
    const before=current.current;if(props.paused||before.gate!=="ready"||before.game.phase!=="choosing")return;
    const decision=request.current?.({type:"reset-practice-feedback"});
    if(!algL11P034FeedbackHostMatches(decision,null)){
      publish({...before,gate:"blocked",message:"The lesson player could not reset feedback. The level did not change. Replay to retry."});return;
    }
    publish({...initial(level,before.cycle+1),gate:"ready"});
  }
  const game=controller.game;
  const visualFrame=feedbackFrame?(props.reducedMotion?Math.floor((feedbackFrame.source.startFrame+feedbackFrame.source.terminalFrame)/2):feedbackFrame.frame):0;
  const feedbackVisual=feedbackFrame?.source.frames[visualFrame-1];
  return<section data-animation-id={ID} data-p034-feedback-successor="v1" data-source-level={game.level}
    data-host-feedback-gate={controller.gate} data-feedback-phase={game.phase} data-source-score={game.score}
    data-source-completed-pair-count={controller.completedPairIds.length} data-source-revealing-pair-count={game.matchedPairIds.length}
    data-source-feedback-frame={feedbackFrame?.frame??1} data-source-feedback-visual-frame={visualFrame||1}
    data-source-feedback-character={feedbackFrame?.source.characterId??""} data-source-feedback-elapsed={Math.floor(elapsed)}
    data-source-audio-disposition="exact-extracted-payload-unrouted" data-source-interaction-complete={String(finished)}
    style={{boxSizing:"border-box",maxWidth:800,minHeight:500,padding:20,background:"#eef7ff",color:"#13284c",margin:"0 auto"}}>
    <h2 style={{marginTop:0}}>Inequalities Match Game</h2><p>Match each inequality with its equivalent expression.</p>
    {controller.message?<p role="alert">{controller.message}</p>:null}
    <div style={{display:"flex",gap:8,alignItems:"center"}}>{([1,2]as const).map(level=><button key={level} type="button" style={buttonStyle}
      disabled={locked||game.phase!=="choosing"} aria-pressed={game.level===level} onClick={()=>changeLevel(level)}>Level {level}</button>)}
      <strong aria-live="polite">Score: {game.score}</strong><span>Pairs: {controller.completedPairIds.length} / 6</span></div>
    <div style={{position:"relative",marginTop:16}}>
      <div style={{display:"grid",gap:8,gridTemplateColumns:"repeat(3,minmax(0,1fr))"}}>
        {VISUALS.cards.filter(card=>card.level===game.level).map(card=>{
          const matched=game.matchedPairIds.includes(card.pairId);const tile=algL11P034RevealedTile(card.id,game.matchedPairIds);
          const fade=algL11P034FadeState(reveal.elapsedByPair[card.pairId]??0,matched,Boolean(props.reducedMotion));
          return<button key={card.id} type="button" aria-label={`Inequality card ${card.sourceInstanceName.replace("Mc","")}`}
            aria-pressed={game.selectedCardId===card.id} data-source-card-id={card.id} data-source-instance-name={card.sourceInstanceName}
            disabled={locked||game.phase!=="choosing"||matched} onClick={()=>select(card.id)}
            style={{...buttonStyle,padding:5,background:matched?"#d7f2df":game.selectedCardId===card.id?"#d3eaff":"white"}}>
            <span data-source-fade-tick={fade.tick} data-source-fade-alpha={fade.sourceAlpha}
              data-source-card-visible={String(fade.cardVisible)} data-source-tile-visible={String(fade.tileVisible)} style={{display:"block",position:"relative"}}>
              {tile?<span data-source-revealed-tile={tile.sourceInstanceName} style={{position:"absolute",inset:0,visibility:fade.tileVisible?"visible":"hidden"}}>
                <Art visual={tile.visual} label="Revealed source picture tile"/></span>:null}
              <span style={{display:"block",position:"relative",opacity:fade.opacity,visibility:fade.cardVisible?"visible":"hidden"}}>
                <Art visual={card.visual} label="Source inequality vector"/></span>
            </span></button>;
        })}
      </div>
      {feedbackVisual?<div aria-label={controller.feedback?.outcome==="correct"?"Correct match feedback":"Incorrect match feedback"}
        style={{position:"absolute",inset:0,pointerEvents:"none",display:"grid",placeItems:"center",background:"rgba(238,247,255,.88)"}}>
        <div style={{width:"90%",maxWidth:feedbackVisual.width}}><Art visual={feedbackVisual} label="Source feedback animation"/></div>
      </div>:null}
    </div>
    <p role="status" aria-live="polite">{game.phase==="correct-feedback"?"Correct match: +10":game.phase==="wrong-feedback"?"Try another pair: −2":game.phase==="complete"?"All six pairs matched!":"Select two cards."}</p>
    <button type="button" style={buttonStyle} disabled={props.paused||!props.onReplay} onClick={props.onReplay}>Replay</button>
  </section>;
}
export const G678_ALG_L11_P034_FEEDBACK_CANDIDATE_MODULE=Object.freeze({...G678_ALG_L11_D_INSTRUCTIONAL_P034_MODULE,
  Renderer:AlgL11P034FeedbackRenderer,lessonHost:Object.freeze({capabilities:Object.freeze(["practice-feedback" as const]),
    legacyOperations:"blocked" as const,auditStorage:"memory-only" as const,storesPersonalData:false as const})});
