"use client";

import React, {useEffect, useRef, useState} from "react";
import type {AnimationRendererProps} from "./contract";
import {
  G678_ALG_L11_ADVANCED3_TRANCHE_D_P034_CANDIDATE_MODULE,
  G678_ALG_L11_ADVANCED3_TRANCHE_D_P044_CANDIDATE_MODULE,
} from "./g678-alg-l11-advanced3-tranche-d-candidates";
import {
  createAlgL11Advanced3AssessmentState,
  createAlgL11Advanced3MatchingState,
  reduceAlgL11Advanced3Assessment,
  reduceAlgL11Advanced3Matching,
  type AlgL11Advanced3AssessmentEvent,
  type AlgL11Advanced3AssessmentState,
  type AlgL11Advanced3Level,
} from "./g678-alg-l11-advanced3-tranche-d-state";
import {G678_ALG_L11_D_INSTRUCTIONAL_VISUALS} from
  "./generated/g678-alg-l11-tranche-d-instructional-visuals-v1";
import {algL11P034RevealedTile} from "./g678-alg-l11-p034-source-reveal";
import {algL11P034FadeState,useAlgL11P034RevealClock} from "./g678-alg-l11-p034-source-fade";

const DATA = G678_ALG_L11_D_INSTRUCTIONAL_VISUALS;
// The maintained interaction owns the selected source level/question branch.
// Hold the host entry until that branch finishes; never let elapsed source
// frame count alone complete a game or an unanswered assessment.
export const ALG_L11_D_SOURCE_COMPLETION_STOPS = Object.freeze({
  p034:Object.freeze({id:"alg-l11-p034-six-source-pairs-finished",frameDomain:"sprite-225",
    stopFrame:1,resumeFrame:5,resolution:"explicit-source-control-finished" as const,
    completionDisposition:"blocked-while-unresolved" as const,requiresHostInteractiveStop:true as const,
    strictAcceptanceEffect:"none" as const,rendererStateOnResume:"preserve" as const}),
  p044:Object.freeze({id:"alg-l11-p044-ten-source-responses-finished",frameDomain:"sprite-1083",
    stopFrame:1,resumeFrame:69,resolution:"explicit-source-control-finished" as const,
    completionDisposition:"blocked-while-unresolved" as const,requiresHostInteractiveStop:true as const,
    strictAcceptanceEffect:"none" as const,rendererStateOnResume:"preserve" as const}),
});
function useSourceInteractionCompletion(props:AnimationRendererProps,finished:boolean,page:"p034"|"p044"){
  const sent=useRef({replay:props.replay??0,value:false});
  useEffect(()=>{
    if(sent.current.replay!==(props.replay??0)){sent.current={replay:props.replay??0,value:false};return;}
    if(!finished||props.paused||!props.onInteractiveStopResolved||sent.current.value)return;
    sent.current.value=true;
    const stop=ALG_L11_D_SOURCE_COMPLETION_STOPS[page];
    props.onInteractiveStopResolved({stopId:stop.id,frameDomain:stop.frameDomain,
      resolution:stop.resolution,source:"maintained-source-derived-interaction"});
  },[finished,page,props.replay,props.paused,props.onInteractiveStopResolved]);
}
const panel: React.CSSProperties = {boxSizing: "border-box", margin: "0 auto",
  maxWidth: 800, minHeight: 500, padding: 20, background: "#eef7ff", color: "#13284c"};
const control: React.CSSProperties = {padding: "10px 16px", minHeight: 44,
  border: "2px solid #2459a9", borderRadius: 8, background: "white",
  color: "#13284c", fontSize: 16, cursor: "pointer"};

function SourceVisual({visual, label, sourceCharacterId}: {
  visual: {readonly svg: string; readonly width: number; readonly sha256: string};
  label: string; sourceCharacterId?: number;
}) {
  return <span aria-label={label} data-source-character-id={sourceCharacterId}
    data-source-vector-sha256={visual.sha256} role="img"
    style={{display: "block", maxWidth: Math.max(visual.width, 240), width: "100%"}}
    dangerouslySetInnerHTML={{__html: visual.svg}} />;
}

function Boundary({children, page, paused,interactionComplete=false}: {children: React.ReactNode;
  page: string; paused?: boolean;interactionComplete?:boolean}) {
  return <section data-animation-id={`shared-alg001-l11-${page}`}
    data-instructional-source-art="layered-svg-glyph-paths"
    data-source-content-successor="g678-alg-l11-tranche-d-instructional-visuals-v1"
    data-source-interaction-complete={String(interactionComplete)}
    data-current-javascript-registered="false" data-product-calibration-passed="false"
    data-authoritative-original-runtime="false" data-visual-fidelity-accepted="false"
    data-audio-accepted="false" data-strict-complete="false"
    data-release-authorized="false" data-runtime-paused={String(Boolean(paused))}
    style={panel}>{children}</section>;
}

export function reduceAlgL11DInstructionalAssessment(
  state: AlgL11Advanced3AssessmentState, event: AlgL11Advanced3AssessmentEvent,
  seed: number, paused: boolean,
) {
  return paused ? state : reduceAlgL11Advanced3Assessment(state, event, seed);
}

export function AlgL11DInstructionalAssessmentView({state, paused, dispatch,
  replay}: {state: AlgL11Advanced3AssessmentState; paused: boolean;
  dispatch: (event: AlgL11Advanced3AssessmentEvent) => void; replay?: () => void}) {
  const review = state.phase === "review" ? state.responses[state.reviewIndex] : null;
  const questionNumber = review?.questionNumber ?? state.questionNumbers[state.currentIndex];
  const question = DATA.questions.find(item => item.number === questionNumber);
  const showingQuestion = state.phase === "answering" || Boolean(review);
  return <Boundary page="p044" paused={paused} interactionComplete={state.responses.length===10&&state.phase!=="answering"}>
    <h2 style={{marginTop: 0}}>Final Quiz</h2>
    <p aria-live="polite" data-question-pool-size="24"
      data-random-selection={state.questionNumbers.join(",")}>
      {review ? `Review ${state.reviewIndex + 1} of 10` : state.phase === "answering"
        ? `Question ${state.currentIndex + 1} of 10` : "Quiz results"}</p>
    {showingQuestion && question ? <div data-source-question={question.label}
      data-source-frame={question.sourceFrame}
      data-source-review-frame={review ? question.sourceReviewFrame : undefined}>
      <SourceVisual label={question.sourceText.map(item => item.text).join(" ")}
        visual={question.prompt} />
      <div aria-label={review ? "Question choices and review" : "Choose an answer"}
        style={{display: "grid", gap: 10, marginTop: 20}}>
        {question.choices.map(choice => {
          const selected = review?.selectedOption === choice.option;
          const correct = review?.correctOption === choice.option;
          return <button aria-label={`Answer ${String.fromCharCode(64 + choice.option)}`}
            data-source-instance-name={choice.sourceInstanceName}
            data-source-character-id={choice.sourceCharacterId}
            data-review-selected={String(Boolean(selected))}
            data-review-correct={String(Boolean(correct))}
            disabled={paused || Boolean(review)} key={choice.option}
            onClick={() => dispatch({type: "answer", option: choice.option as 1|2|3|4, input: "mouse"})}
            style={{...control, textAlign: "left", background: correct ? "#e2f5e8" : "white",
              borderColor: correct ? "#23713c" : selected ? "#b45309" : "#2459a9"}}
            type="button">
            <SourceVisual label={`Source answer ${String.fromCharCode(64 + choice.option)}`}
              sourceCharacterId={choice.sourceCharacterId} visual={choice.visual} />
            {review && (selected || correct) ? <strong style={{display: "block", marginTop: 5}}>
              {selected && correct ? "Your answer · Correct" : selected ? "Your answer" : "Correct answer"}
            </strong> : null}
          </button>;
        })}
      </div>
    </div> : null}
    {state.phase === "results" ? <div role="status">
      <p>Score: {state.responses.filter(response => response.correct).length} / 10</p>
      <p>{state.grade}</p>
      <button disabled={paused} style={control} type="button"
        onClick={() => dispatch({type: "begin-review", input: "mouse"})}>Review answers</button>
    </div> : null}
    {review ? <button disabled={paused} style={{...control, marginTop: 16}} type="button"
      onClick={() => dispatch({type: state.reviewIndex < state.responses.length - 1
        ? "next-review" : "finish-review", input: "mouse"})}>
      {state.reviewIndex < state.responses.length - 1 ? "Next review" : "Finish review"}
    </button> : null}
    <button disabled={paused || !replay} style={{...control, marginTop: 16, marginLeft: 8}}
      type="button" onClick={replay}>Replay</button>
  </Boundary>;
}

export function AlgL11DInstructionalAssessmentRenderer(props: AnimationRendererProps) {
  const [state, setState] = useState(() => createAlgL11Advanced3AssessmentState(props.seed, props.replay ?? 0));
  useEffect(() => setState(createAlgL11Advanced3AssessmentState(props.seed, props.replay ?? 0)), [props.seed, props.replay]);
  useSourceInteractionCompletion(props,state.phase==="results"&&state.responses.length===10&&state.grade!==null,"p044");
  return <AlgL11DInstructionalAssessmentView state={state} paused={Boolean(props.paused)}
    dispatch={event => setState(current => reduceAlgL11DInstructionalAssessment(current, event, props.seed, Boolean(props.paused)))}
    replay={props.onReplay} />;
}

function handoffLevel(props: AnimationRendererProps): AlgL11Advanced3Level {
  const value = props.lessonHostNavigationHandoff;
  return value?.kind === "game-level" && value.sourceAnimationId === "shared-alg001-l11-p033" &&
    value.targetAnimationId === "shared-alg001-l11-p034" ? value.level : 1;
}

export function AlgL11DInstructionalMatchingRenderer(props: AnimationRendererProps) {
  const level = handoffLevel(props);
  const [state, setState] = useState(() => createAlgL11Advanced3MatchingState(level));
  useEffect(() => setState(createAlgL11Advanced3MatchingState(level)), [level, props.replay]);
  const revealClock=useAlgL11P034RevealClock(`${props.replay??0}:${state.level}`,
    state.matchedPairIds,Boolean(props.paused),Boolean(props.reducedMotion));
  const matchingFinished=state.phase==="complete"&&state.matchedPairIds.length===6&&
    state.matchedPairIds.every(pair=>algL11P034FadeState(revealClock.elapsedByPair[pair]??0,true,Boolean(props.reducedMotion)).settled);
  useSourceInteractionCompletion(props,matchingFinished,"p034");
  return <Boundary page="p034" paused={props.paused} interactionComplete={matchingFinished}>
    <h2 style={{marginTop: 0}}>Inequalities Match Game</h2>
    <p>Match each inequality with its equivalent expression.</p>
    <div style={{display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap"}}>
      {([1, 2] as const).map(nextLevel => <button aria-pressed={state.level === nextLevel}
        disabled={props.paused || state.phase !== "choosing"} key={nextLevel} style={control} type="button"
        onClick={() => {if (!props.paused) setState(current => reduceAlgL11Advanced3Matching(current,
          {type: "switch-level", level: nextLevel, input: "mouse"}));}}>Level {nextLevel}</button>)}
      <strong aria-live="polite">Score: {state.score}</strong>
    </div>
    <div data-source-card-count="24" data-source-level={state.level}
      style={{display: "grid", gap: 8, gridTemplateColumns: "repeat(3,minmax(0,1fr))", marginTop: 16}}>
      {DATA.cards.filter(card => card.level === state.level).map(card => {
        const matched = state.matchedPairIds.includes(card.pairId as 1|2|3|4|5|6);
        const revealed = algL11P034RevealedTile(card.id,state.matchedPairIds);
        const fade=algL11P034FadeState(revealClock.elapsedByPair[card.pairId]??0,matched,Boolean(props.reducedMotion));
        return <button aria-label={`Inequality card ${card.sourceInstanceName.replace("Mc", "")}`}
          aria-pressed={state.selectedCardId === card.id} data-source-card-id={card.id}
          data-source-character-id={card.sourceCharacterId} data-source-instance-name={card.sourceInstanceName}
          disabled={props.paused || state.phase !== "choosing" || matched} key={card.id}
          onClick={() => {if (!props.paused) setState(current => reduceAlgL11Advanced3Matching(current,
            {type: "select-card", cardId: card.id, input: "mouse"}));}}
          style={{...control, padding: 5, background: matched ? "#d7f2df" : state.selectedCardId === card.id ? "#d3eaff" : "white"}}
          type="button"><span data-source-fade-tick={fade.tick} data-source-fade-alpha={fade.sourceAlpha}
            data-source-card-visible={String(fade.cardVisible)} data-source-tile-visible={String(fade.tileVisible)}
            style={{display:"block",position:"relative"}}>
            {revealed?<span data-source-revealed-tile={revealed.sourceInstanceName}
              data-source-revealed-pair={revealed.pairId}
              style={{position:"absolute",inset:0,visibility:fade.tileVisible?"visible":"hidden"}}>
              <SourceVisual visual={revealed.visual} label="Revealed source picture tile"
                sourceCharacterId={revealed.sourceCharacterId}/></span>:null}
            <span style={{display:"block",position:"relative",opacity:fade.opacity,
              visibility:fade.cardVisible?"visible":"hidden"}}>
              <SourceVisual visual={card.visual} label="Source inequality vector"
                sourceCharacterId={card.sourceCharacterId} /></span>
          </span></button>;
      })}
    </div>
    <p aria-live="polite" data-feedback-phase={state.phase} role="status">
      {state.phase === "correct-feedback" ? "Correct match: +10" : state.phase === "wrong-feedback"
        ? "Try another pair: −2" : state.phase === "complete" ? "All six pairs matched!" : "Select two cards."}</p>
    {state.phase === "correct-feedback" || state.phase === "wrong-feedback" ?
      <button disabled={props.paused} style={control} type="button" onClick={() => {
        if (!props.paused) setState(current => reduceAlgL11Advanced3Matching(current,
          {type: "dismiss-feedback", input: "mouse"}));}}>Continue</button> : null}
    <button disabled={props.paused || !props.onReplay} onClick={props.onReplay}
      style={{...control, marginLeft: 8}} type="button">Replay</button>
  </Boundary>;
}

export const G678_ALG_L11_D_INSTRUCTIONAL_P044_MODULE = Object.freeze({
  ...G678_ALG_L11_ADVANCED3_TRANCHE_D_P044_CANDIDATE_MODULE,
  Renderer: AlgL11DInstructionalAssessmentRenderer,
  interactiveStops:Object.freeze([ALG_L11_D_SOURCE_COMPLETION_STOPS.p044]),
  reducedMotionFrame:69,
});
export const G678_ALG_L11_D_INSTRUCTIONAL_P034_MODULE = Object.freeze({
  ...G678_ALG_L11_ADVANCED3_TRANCHE_D_P034_CANDIDATE_MODULE,
  Renderer: AlgL11DInstructionalMatchingRenderer,
  interactiveStops:Object.freeze([ALG_L11_D_SOURCE_COMPLETION_STOPS.p034]),
  reducedMotionFrame:5,
});
