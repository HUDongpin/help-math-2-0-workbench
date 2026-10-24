"use client";

import React, {useEffect, useMemo, useState} from "react";

import type {
  AnimationModule,
  AnimationRendererProps,
  AnimationRuntimeMetadata,
  MovieMetadata,
  RuntimeContext,
  RuntimeScenario,
} from "./contract";
import {
  G678_ALG_L11_ADVANCED3_TRANCHE_D_MATCHING_CARDS,
  G678_ALG_L11_ADVANCED3_TRANCHE_D_SPEC,
  buildAlgL11Advanced3NavigationIntent,
  createAlgL11Advanced3AssessmentState,
  createAlgL11Advanced3ControllerState,
  createAlgL11Advanced3MatchingState,
  reduceAlgL11Advanced3Assessment,
  reduceAlgL11Advanced3Controller,
  reduceAlgL11Advanced3Matching,
  type AlgL11Advanced3ControllerPhase,
  type AlgL11Advanced3Level,
} from "./g678-alg-l11-advanced3-tranche-d-state";

const SCENARIO = "advanced3-tranche-d-unregistered-engineering-candidate";
const SCENARIOS: readonly RuntimeScenario[] = Object.freeze([Object.freeze({
  id: SCENARIO,
  label: "Unregistered source-behavior engineering candidate",
  description: "Static-source behavior only; no product or acceptance effect.",
})]);

const MOVIE: MovieMetadata = Object.freeze({stage: Object.freeze({width: 800,
  height: 600}), fps: 12, frameCount: 10, durationMs: 833});

const panelStyle: React.CSSProperties = Object.freeze({
  background: "#e8f4ff", border: "2px solid #2459a9", borderRadius: 12,
  boxSizing: "border-box", color: "#13284c", display: "grid", gap: 14,
  margin: "0 auto", maxWidth: 760, minHeight: 420, padding: 24,
});

const buttonStyle: React.CSSProperties = Object.freeze({
  background: "#fff", border: "2px solid #2459a9", borderRadius: 8,
  color: "#13284c", cursor: "pointer", fontSize: 16, minHeight: 44,
  padding: "8px 12px",
});

function CandidateBoundary({children, animationId, paused, replay}: {
  readonly children: React.ReactNode;
  readonly animationId: string;
  readonly paused?: boolean;
  readonly replay?: number;
}) {
  return <div data-acceptance-passed="false"
    data-animation-id={animationId}
    data-authoritative-original-runtime="false"
    data-current-javascript-registered="false"
    data-product-calibration-passed="false"
    data-private-current-js="true"
    data-runtime-paused={paused ? "true" : "false"}
    data-runtime-replay={replay ?? 0}
    data-release-authorized="false"
    data-source-actionscript-executed="false"
    data-strict-complete="false"
    data-tranche="g678-alg-l11-advanced3-tranche-d"
    data-whole-lesson-engineering-preview-ready="false"
    style={{background: "#b8d8f7", boxSizing: "border-box", minHeight: "100%",
      padding: 20, width: "100%"}}>{children}</div>;
}

function runtime(mainFrameDomain: string,
  mainFrameCount: number): AnimationRuntimeMetadata {
  return Object.freeze({...MOVIE, frameDomains: Object.freeze([
    Object.freeze({id: "root", frameCount: 10, fps: 12}),
    Object.freeze({id: mainFrameDomain, frameCount: mainFrameCount, fps: 12,
      rootFrame: 6}),
  ]), defaultFrameDomain: mainFrameDomain});
}

function frameState(animationId: string, mainFrameDomain: string,
  mainFrameCount: number, context: RuntimeContext) {
  const frameDomain = context.frameDomain ?? mainFrameDomain;
  const supported = frameDomain === mainFrameDomain && context.frame >= 1 &&
    context.frame <= mainFrameCount && context.scenario === SCENARIO;
  return Object.freeze({animationId, frame: context.frame, frameDomain,
    rootFrame: context.rootFrame ?? 6, scenario: context.scenario,
    language: context.lang, seed: context.seed,
    status: supported ? "ready" as const : "blocked" as const,
    sourceBehaviorCandidateReady: supported,
    currentJavaScriptRegistered: false as const,
    productCalibrationPassed: false as const,
    authoritativeOriginalRuntime: false as const,
    visualFidelityAccepted: false as const,
    audioAccepted: false as const,
    strictAcceptanceEffect: "none" as const});
}

export function resolveAlgL11Advanced3ControllerPhase(
  frame: number,
): AlgL11Advanced3ControllerPhase {
  return frame >= 605 ? "terminal" : "initial";
}

function ControllerRenderer(props: AnimationRendererProps) {
  const phase = resolveAlgL11Advanced3ControllerPhase(props.frame);
  const [state, setState] = useState(() =>
    createAlgL11Advanced3ControllerState(phase));
  const [navigationStatus, setNavigationStatus] = useState<
    "idle" | "allowed" | "blocked">("idle");
  useEffect(() => {
    setState(createAlgL11Advanced3ControllerState(phase));
    setNavigationStatus("idle");
  }, [phase, props.replay]);
  const selectLevel = (level: AlgL11Advanced3Level) => setState((current) =>
    reduceAlgL11Advanced3Controller(current,
      {type: "select-level", level, input: "mouse"}));
  const start = () => {
    const next = reduceAlgL11Advanced3Controller(state,
      {type: "start", input: "mouse"});
    setState(next);
    const intent = buildAlgL11Advanced3NavigationIntent(next);
    if (!intent || !props.onLessonHostRequest) {
      setNavigationStatus("blocked");
      return;
    }
    const result = props.onLessonHostRequest(intent.request);
    setNavigationStatus(result?.status === "allowed" ? "allowed" : "blocked");
  };
  return <CandidateBoundary animationId="shared-alg001-l11-p033"
    paused={props.paused} replay={props.replay}>
    <section aria-label="Inequalities Match Game controller"
      data-handoff-target="shared-alg001-l11-p034"
      data-legacy-handoff-target="L11GS03" style={panelStyle}>
      <h2 style={{margin: 0}}>Inequalities Match Game</h2>
      <p>Choose Level 1 or Level 2, then start the matching page.</p>
      <p data-source-handoff-arity={phase === "initial" ? 2 : 3}>
        Source controller phase: {phase}.</p>
      <div style={{display: "flex", flexWrap: "wrap", gap: 10}}>
        {[1, 2].map((level) => <button
          aria-pressed={state.level === level}
          disabled={props.paused}
          key={level}
          onClick={() => selectLevel(level as AlgL11Advanced3Level)}
          style={buttonStyle} type="button">Level {level}</button>)}
        <button disabled={props.paused || state.level === null}
          onClick={start} style={buttonStyle} type="button">Start</button>
        <button disabled={props.paused || !props.onReplay}
          onClick={props.onReplay} style={buttonStyle}
          type="button">Replay</button>
      </div>
      {state.blockedReason ? <p role="alert">Select a level first.</p> : null}
      {navigationStatus === "blocked" ? <p role="alert">The unregistered target
        was not admitted; no legacy cross-page call was executed.</p> : null}
    </section>
  </CandidateBoundary>;
}

function exactHandoffLevel(props: AnimationRendererProps): AlgL11Advanced3Level {
  const handoff = props.lessonHostNavigationHandoff;
  return handoff?.kind === "game-level" &&
    handoff.sourceAnimationId === "shared-alg001-l11-p033" &&
    handoff.targetAnimationId === "shared-alg001-l11-p034"
    ? handoff.level : 1;
}

function MatchingRenderer(props: AnimationRendererProps) {
  const handoffLevel = exactHandoffLevel(props);
  const [state, setState] = useState(() =>
    createAlgL11Advanced3MatchingState(handoffLevel));
  useEffect(() => {
    setState(createAlgL11Advanced3MatchingState(handoffLevel));
  }, [handoffLevel, props.replay]);
  const cards = useMemo(() =>
    G678_ALG_L11_ADVANCED3_TRANCHE_D_MATCHING_CARDS.filter((card) =>
      card.level === state.level), [state.level]);
  return <CandidateBoundary animationId="shared-alg001-l11-p034"
    paused={props.paused} replay={props.replay}>
    <section aria-label="Inequalities matching state-machine candidate"
      data-source-card-count="24" data-source-level-count="2"
      style={panelStyle}>
      <div style={{display: "flex", justifyContent: "space-between"}}>
        <h2 style={{margin: 0}}>Level {state.level}</h2>
        <strong>Score: {state.score}</strong>
      </div>
      <div aria-label="Matching game levels"
        style={{display: "flex", gap: 10}}>
        {[1, 2].map((level) => <button
          aria-pressed={state.level === level}
          disabled={props.paused || state.phase !== "choosing"}
          key={level}
          onClick={() => setState((current) =>
            reduceAlgL11Advanced3Matching(current, {type: "switch-level",
              level: level as AlgL11Advanced3Level, input: "mouse"}))}
          style={buttonStyle} type="button">Level {level}</button>)}
        <button disabled={props.paused || !props.onReplay}
          onClick={props.onReplay} style={buttonStyle}
          type="button">Replay</button>
      </div>
      <p>Pair identity follows the source instance names Mc1–Mc6. Text tokens
        below are diagnostic evidence and are not a visual-fidelity claim.</p>
      <div style={{display: "grid", gap: 8,
        gridTemplateColumns: "repeat(3, minmax(0, 1fr))"}}>
        {cards.map((card) => <button
          aria-pressed={state.selectedCardId === card.id}
          data-source-character-id={card.sourceCharacterId}
          data-source-instance-name={card.sourceInstanceName}
          disabled={props.paused || state.phase !== "choosing" ||
            state.matchedPairIds.includes(card.pairId)}
          key={card.id}
          onClick={() => setState((current) =>
            reduceAlgL11Advanced3Matching(current,
              {type: "select-card", cardId: card.id, input: "mouse"}))}
          style={buttonStyle} type="button">
          <span>{card.sourceTextTokens.join(" ")}</span>
          <small style={{display: "block"}}>{card.sourceInstanceName}</small>
        </button>)}
      </div>
      <div aria-live="polite" data-feedback-phase={state.phase}
        role="status"><strong>{state.phase === "correct-feedback"
          ? "Correct match: +10" : state.phase === "wrong-feedback"
            ? "Incorrect match: −2" : "Select two source-identified cards."}</strong>
          <button disabled={props.paused || (state.phase !== "correct-feedback" &&
            state.phase !== "wrong-feedback")}
          onClick={() => setState((current) =>
            reduceAlgL11Advanced3Matching(current,
              {type: "dismiss-feedback", input: "mouse"}))}
          style={buttonStyle} type="button">Continue</button></div>
      {state.phase === "complete" ? <p role="status">Six source-identified
        pairs matched. Product completion remains false.</p> : null}
    </section>
  </CandidateBoundary>;
}

function AssessmentRenderer(props: AnimationRendererProps) {
  const [state, setState] = useState(() =>
    createAlgL11Advanced3AssessmentState(props.seed, props.replay ?? 0));
  useEffect(() => {
    setState(createAlgL11Advanced3AssessmentState(props.seed,
      props.replay ?? 0));
  }, [props.replay, props.seed]);
  const questionNumber = state.questionNumbers[state.currentIndex];
  const response = state.responses[state.reviewIndex];
  return <CandidateBoundary animationId="shared-alg001-l11-p044"
    paused={props.paused} replay={props.replay}>
    <section aria-label="Random final assessment state-machine candidate"
      data-choice-count-per-question="4" data-question-pool-size="24"
      data-review-enabled="true"
      style={panelStyle}>
      <h2 style={{margin: 0}}>Final assessment engineering candidate</h2>
      <p data-random-selection={state.questionNumbers.join(",")}>
        Deterministic source-equivalent selection: 10 unique questions from
        the exact 24-question pool.</p>
      <p data-question-pool={Array.from({length: 24}, (_, index) =>
        `Q${index + 1}`).join(",")}>
        Available source question identities: {Array.from({length: 24},
          (_, index) => `Q${index + 1}`).join(", ")}.</p>
      {state.phase === "answering" ? <>
        <h3>Source question Q{questionNumber}</h3>
        <p>The source-authored text, equations, graphs, and audio are not
          presented by this unregistered behavior candidate.</p>
        <div style={{display: "grid", gap: 8,
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))"}}>
          {[1, 2, 3, 4].map((option) => <button
            disabled={props.paused} key={option}
            onClick={() => setState((current) =>
              reduceAlgL11Advanced3Assessment(current, {type: "answer",
                option: option as 1 | 2 | 3 | 4, input: "mouse"}, props.seed))}
            style={buttonStyle} type="button">Option {
              String.fromCharCode(64 + option)}</button>)}
        </div>
      </> : null}
      {state.phase === "results" ? <>
        <p role="status">Score: {state.responses.filter((item) =>
          item.correct).length} / 10 — {state.grade}</p>
      </> : null}
      <button disabled={props.paused || state.phase !== "results"}
        onClick={() => setState((current) =>
          reduceAlgL11Advanced3Assessment(current,
            {type: "begin-review", input: "mouse"}, props.seed))}
        style={buttonStyle} type="button">Review answers</button>
      {state.phase === "review" && response ? <>
        <h3>Review {state.reviewIndex + 1} of 10: Q{
          response.questionNumber}</h3>
        <p>Selected {response.selectedOption}; correct option {
          response.correctOption}.</p>
        {state.reviewIndex < state.responses.length - 1
          ? <button onClick={() => setState((current) =>
            reduceAlgL11Advanced3Assessment(current,
              {type: "next-review", input: "mouse"}, props.seed))}
          style={buttonStyle} type="button">Next review</button>
          : <button onClick={() => setState((current) =>
            reduceAlgL11Advanced3Assessment(current,
              {type: "finish-review", input: "mouse"}, props.seed))}
          style={buttonStyle} type="button">Finish review</button>}
      </> : null}
      <p data-grade={state.grade ?? "pending"}>Grade: {
        state.grade ?? "pending"}</p>
      <button disabled={props.paused || !props.onReplay}
        onClick={props.onReplay} style={buttonStyle}
        type="button">Replay</button>
      <p>Legacy report, bookmark, close, and audio host calls: recorded by the
        audit, never executed here.</p>
    </section>
  </CandidateBoundary>;
}

function candidateModule(animationId: string, title: string,
  mainFrameDomain: string, mainFrameCount: number,
  Renderer: React.ComponentType<AnimationRendererProps>,
  navigation = false): AnimationModule {
  const sourceRuntime = runtime(mainFrameDomain, mainFrameCount);
  return Object.freeze({key: animationId, movie: MOVIE, runtime: sourceRuntime,
    playbackMode: "once" as const, playbackEndFrameByDomain: Object.freeze({
      root: 6, [mainFrameDomain]: mainFrameCount,
    }), reducedMotionFrame: 1, scenarios: SCENARIOS, audioCues: Object.freeze([]),
    lessonHost: Object.freeze({capabilities: Object.freeze(navigation
      ? ["navigation" as const] : []), legacyOperations: "blocked" as const,
      auditStorage: "memory-only" as const, storesPersonalData: false as const}),
    maturity: "private-current-js" as const, Renderer,
    getFrameState: (_frame: number, context: RuntimeContext) =>
      frameState(animationId, mainFrameDomain, mainFrameCount, context),
    title,
  } as AnimationModule & Readonly<{title: string}>);
}

export const G678_ALG_L11_ADVANCED3_TRANCHE_D_P033_CANDIDATE_MODULE =
  candidateModule("shared-alg001-l11-p033", "Game 1",
    "sprite-116", 606, ControllerRenderer, true);

export const G678_ALG_L11_ADVANCED3_TRANCHE_D_P034_CANDIDATE_MODULE =
  candidateModule("shared-alg001-l11-p034", "Game 2",
    "sprite-225", 5, MatchingRenderer);

export const G678_ALG_L11_ADVANCED3_TRANCHE_D_P044_CANDIDATE_MODULE =
  candidateModule("shared-alg001-l11-p044", "Final assessment",
    "sprite-1083", 69, AssessmentRenderer);

export const G678_ALG_L11_ADVANCED3_TRANCHE_D_CANDIDATE_MODULES = Object.freeze([
  G678_ALG_L11_ADVANCED3_TRANCHE_D_P033_CANDIDATE_MODULE,
  G678_ALG_L11_ADVANCED3_TRANCHE_D_P034_CANDIDATE_MODULE,
  G678_ALG_L11_ADVANCED3_TRANCHE_D_P044_CANDIDATE_MODULE,
]);

if (G678_ALG_L11_ADVANCED3_TRANCHE_D_SPEC.registrationCandidatePlacementCount !==
  0) {
  throw new Error("advanced3 tranche-d candidates may not self-register");
}
