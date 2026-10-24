"use client";

import React, {useEffect, useLayoutEffect, useRef, useState} from "react";
import {createPortal} from "react-dom";

import type {AnimationInteractiveStop, AnimationRendererProps} from
  "./contract";
import {
  ALG_L09_FQ02_ANSWER_KEY,
  assertAlgL09MatchingCards,
  assertAlgL09FinalAssessmentQuestions,
  createAlgL09FinalAssessmentState,
  createAlgL09GameControllerState,
  createAlgL09MatchingGameState,
  reduceAlgL09FinalAssessment,
  reduceAlgL09GameController,
  reduceAlgL09MatchingGame,
  type AlgL09GameLevel,
  type AlgL09FinalAssessmentQuestion,
  type AlgL09MatchingCard,
} from "./g678-alg-l09-game-assessment";
import {selectHostFeedback} from
  "./g678-advanced-manual/host-feedback-selector";
import {
  createSourceStaticCanvasCandidate,
  type SourceStaticCanvasCandidateConfig,
} from "./source-static-canvas-candidate";

const useClientLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

function CompanionPortal({children, targetId}: {
  readonly children: React.ReactNode;
  readonly targetId?: string;
}) {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  useClientLayoutEffect(() => {
    if (!targetId) return void setTarget(null);
    const element = document.getElementById(targetId);
    setTarget(element?.dataset.pageInteractionCompanionHost === "true"
      ? element : null);
  }, [targetId]);
  return target ? createPortal(children, target) : children;
}

function useCanvasReady(hostRef: React.RefObject<HTMLDivElement | null>,
  replay: number | undefined) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return void setReady(false);
    const update = () => {
      const surface = host.querySelector<HTMLElement>("[data-canvas-status]");
      setReady(surface?.dataset.canvasStatus === "ready" ||
        surface?.dataset.canvasStatus === "updating");
    };
    update();
    const observer = new MutationObserver(update);
    observer.observe(host, {attributes: true, childList: true, subtree: true,
      attributeFilter: ["data-canvas-status"]});
    return () => observer.disconnect();
  }, [hostRef, replay]);
  return ready;
}

function shell(children: React.ReactNode, props: AnimationRendererProps,
  hostRef: React.RefObject<HTMLDivElement | null>, calibrationId: string) {
  return <div data-audio-acceptance="pending"
    data-behavior-parity-established="false"
    data-calibration-id={calibrationId}
    data-complexity-lane="advanced-manual"
    data-private-current-js="true"
    data-source-actionscript-executed="false"
    data-strict-acceptance-effect="none" ref={hostRef}>
    {children}
  </div>;
}

function MaintainedTaskSurface({children, source}: {
  readonly children: React.ReactNode;
  readonly source: React.ReactNode;
}) {
  return <div data-maintained-source-task-surface="true"
    style={{minHeight: "100%", position: "relative", width: "100%"}}>
    <div aria-hidden="true" data-source-canvas-visibility="suppressed-because-actionscript-visibility-is-not-executed"
      style={{inset: 0, opacity: 0, pointerEvents: "none",
        position: "absolute"}}>{source}</div>
    <div style={{background: "#b8d8f7", boxSizing: "border-box",
      minHeight: "100%", padding: "clamp(16px, 4vw, 36px)",
      position: "relative", zIndex: 1}}>{children}</div>
  </div>;
}

const actionButtonStyle: React.CSSProperties = Object.freeze({
  background: "#ffffff", border: "2px solid #2459a9", borderRadius: 10,
  color: "#17325c", cursor: "pointer", fontSize: 17, fontWeight: 700,
  minHeight: 48, padding: "10px 14px", textAlign: "left",
});

const secondaryButtonStyle: React.CSSProperties = Object.freeze({
  ...actionButtonStyle, background: "#f4f8ff", minHeight: 42,
  padding: "8px 12px", textAlign: "center",
});

export function commitAlgL09GameNavigation({level, sourceAnimationId,
  targetAnimationId, onLessonHostRequest, onInteractiveStopResolved, stop}: {
  readonly level: AlgL09GameLevel;
  readonly sourceAnimationId: string;
  readonly targetAnimationId: string;
  readonly onLessonHostRequest:
    NonNullable<AnimationRendererProps["onLessonHostRequest"]>;
  readonly onInteractiveStopResolved:
    NonNullable<AnimationRendererProps["onInteractiveStopResolved"]>;
  readonly stop: AnimationInteractiveStop;
}) {
  const decision = onLessonHostRequest({type: "navigate", targetAnimationId,
    handoff: {kind: "game-level", sourceAnimationId, targetAnimationId,
      level}});
  if (decision?.status !== "allowed") return false;
  onInteractiveStopResolved({stopId: stop.id, frameDomain: stop.frameDomain,
    resolution: stop.resolution,
    source: "maintained-source-derived-interaction"});
  return true;
}

export interface AlgL09GameControllerCandidateOptions {
  readonly directions: readonly Readonly<{textId: number; text: string}>[];
}

export function createPrivateAlgL09GameControllerCandidate(
  config: SourceStaticCanvasCandidateConfig,
  options: AlgL09GameControllerCandidateOptions,
) {
  if (options.directions.length !== 4 || options.directions.some((item) =>
    !Number.isSafeInteger(item.textId) || item.textId < 1 ||
    item.text.trim().length === 0)) {
    throw new Error("ALG L9 game-controller directions are invalid");
  }
  const source = createSourceStaticCanvasCandidate(config);
  const SourceRenderer = source.Renderer;
  const stop: AnimationInteractiveStop = Object.freeze({
    id: `${config.animationId}-level-selected`,
    frameDomain: config.mainFrameDomain,
    stopFrame: 748,
    resumeFrame: 749,
    resolution: "explicit-source-control-finished",
    completionDisposition: "blocked-while-unresolved",
    requiresHostInteractiveStop: true,
    strictAcceptanceEffect: "none",
  });
  function Renderer(props: AnimationRendererProps) {
    const hostRef = useRef<HTMLDivElement>(null);
    const [state, setState] = useState(createAlgL09GameControllerState);
    const [requestBlocked, setRequestBlocked] = useState(false);
    const ready = useCanvasReady(hostRef, props.replay);
    const visible = props.frameDomain === config.mainFrameDomain &&
      props.frame >= stop.stopFrame;
    useEffect(() => {
      setState(createAlgL09GameControllerState());
      setRequestBlocked(false);
    }, [props.replay]);
    const selectLevel = (level: AlgL09GameLevel) => {
      setRequestBlocked(false);
      setState((current) => reduceAlgL09GameController(current,
        {type: "select-level", level, input: "mouse"}));
    };
    const start = () => {
      const next = reduceAlgL09GameController(state,
        {type: "start", input: "mouse"});
      setState(next);
      if (!next.startRequested || !next.level ||
        !props.onInteractiveStopResolved || !props.onLessonHostRequest) {
        setRequestBlocked(next.startRequested);
        return;
      }
      const targetAnimationId = "shared-alg001-l09-p031";
      setRequestBlocked(!commitAlgL09GameNavigation({level: next.level,
        sourceAnimationId: config.animationId, targetAnimationId,
        onLessonHostRequest: props.onLessonHostRequest,
        onInteractiveStopResolved: props.onInteractiveStopResolved, stop}));
    };
    const controls = visible ? <section aria-label="Matching game setup"
      data-game-controller-ready={ready && !props.paused ? "true" : "false"}
      data-selected-level={state.level ?? "none"}
      style={{color: "#13284c", display: "grid", gap: 16,
        margin: "0 auto", maxWidth: 720}}>
      <div><h3 style={{fontSize: 28, margin: "0 0 8px"}}>
        Ratio Match Game</h3>
        {options.directions.map((item) => <p data-source-text-id={item.textId}
          key={item.textId} style={{lineHeight: 1.45, margin: "6px 0"}}>{
          item.text}</p>)}
      </div>
      <div style={{display: "flex", flexWrap: "wrap", gap: 10}}>
      <button aria-pressed={state.level === 1} disabled={!ready || props.paused}
        style={secondaryButtonStyle}
        onClick={() => selectLevel(1)} type="button">Level 1</button>
      <button aria-pressed={state.level === 2} disabled={!ready || props.paused}
        style={secondaryButtonStyle}
        onClick={() => selectLevel(2)} type="button">Level 2</button>
      <button disabled={!ready || props.paused || state.level === null}
        onClick={start} style={actionButtonStyle}
        type="button">Start game</button></div>
      {state.blockedReason ? <p role="alert">Select a level first.</p> : null}
      {requestBlocked ? <p role="alert">The game page was not admitted; the
        source stop remains held.</p> : null}
    </section> : null;
    return shell(visible
      ? <MaintainedTaskSurface source={<SourceRenderer {...props} />}>
        {controls ? <CompanionPortal
        targetId={props.pageInteractionCompanionTargetId}>{controls}
        </CompanionPortal> : null}
      </MaintainedTaskSurface>
      : <SourceRenderer {...props} />, props, hostRef,
    "g678-alg-l09-game-controller-product-calibration-v1");
  }
  const module = Object.freeze({...source.module,
    interactiveStops: Object.freeze([stop]),
    lessonHost: Object.freeze({
      capabilities: Object.freeze(["navigation"] as const),
      legacyOperations: "blocked" as const,
      auditStorage: "memory-only" as const,
      storesPersonalData: false as const,
    }), maturity: "private-current-js" as const, Renderer});
  return Object.freeze({...source, interactiveStops: Object.freeze([stop]),
    module, Renderer});
}

export interface AlgL09MatchingGameCandidateOptions {
  readonly level1Cards: readonly AlgL09MatchingCard[];
  readonly level2Cards: readonly AlgL09MatchingCard[];
}

export function createPrivateAlgL09MatchingGameCandidate(
  config: SourceStaticCanvasCandidateConfig,
  options: AlgL09MatchingGameCandidateOptions,
) {
  assertAlgL09MatchingCards(options.level1Cards);
  assertAlgL09MatchingCards(options.level2Cards);
  const source = createSourceStaticCanvasCandidate(config);
  const SourceRenderer = source.Renderer;
  const stop: AnimationInteractiveStop = Object.freeze({
    id: `${config.animationId}-game-complete`,
    frameDomain: config.mainFrameDomain,
    stopFrame: 1, resumeFrame: 2,
    resolution: "explicit-source-control-finished",
    completionDisposition: "blocked-while-unresolved",
    requiresHostInteractiveStop: true,
    strictAcceptanceEffect: "none",
  });
  function Renderer(props: AnimationRendererProps) {
    const hostRef = useRef<HTMLDivElement>(null);
    const handedOffLevel: AlgL09GameLevel =
      props.lessonHostNavigationHandoff?.kind === "game-level" &&
      props.lessonHostNavigationHandoff.sourceAnimationId ===
        "shared-alg001-l09-p030" &&
      props.lessonHostNavigationHandoff.targetAnimationId ===
        config.animationId
        ? props.lessonHostNavigationHandoff.level
        : 1;
    const [level, setLevel] = useState<AlgL09GameLevel>(handedOffLevel);
    const [state, setState] = useState(() =>
      createAlgL09MatchingGameState(handedOffLevel));
    const [requestBlocked, setRequestBlocked] = useState(false);
    const ready = useCanvasReady(hostRef, props.replay);
    const cards = level === 1 ? options.level1Cards : options.level2Cards;
    useEffect(() => {
      setLevel(handedOffLevel);
      setState(createAlgL09MatchingGameState(handedOffLevel));
      setRequestBlocked(false);
      props.onLessonHostRequest?.({type: "reset-practice-feedback",
        interactionId: config.animationId});
    }, [handedOffLevel, props.onLessonHostRequest, props.replay]);
    const chooseLevel = (next: AlgL09GameLevel) => {
      if (!ready || props.paused || state.phase !== "choosing") return;
      setLevel(next);
      setState(createAlgL09MatchingGameState(next));
    };
    const selectCard = (cardId: string) => {
      if (!ready || props.paused) return;
      const next = reduceAlgL09MatchingGame(cards, state,
        {type: "select-card", cardId, input: "mouse"});
      if (next.phase !== state.phase &&
        (next.phase === "correct-feedback" ||
          next.phase === "wrong-feedback")) {
        const feedback = selectHostFeedback(next.phase === "correct-feedback"
          ? "right" : "wrong", props.seed + next.score);
        const decision = props.onLessonHostRequest?.({
          type: "record-practice-feedback",
          interactionId: config.animationId,
          outcome: next.phase === "correct-feedback" ? "correct" : "incorrect",
          branchIndex: feedback.branchIndex,
          branchCount: feedback.cardinality,
        });
        if (decision?.status !== "allowed") {
          setRequestBlocked(true);
          return;
        }
      }
      setRequestBlocked(false);
      setState(next);
    };
    const dismiss = () => {
      const decision = props.onLessonHostRequest?.({
        type: "reset-practice-feedback",
        interactionId: config.animationId});
      if (decision?.status !== "allowed") {
        setRequestBlocked(true);
        return;
      }
      setRequestBlocked(false);
      setState((current) => reduceAlgL09MatchingGame(cards, current,
        {type: "dismiss-feedback", input: "mouse"}));
    };
    const finish = () => props.onInteractiveStopResolved?.({stopId: stop.id,
      frameDomain: stop.frameDomain, resolution: stop.resolution,
      source: "maintained-source-derived-interaction"});
    const visualFrame = level === 1 ? 2 : 4;
    const controls = <section aria-label="Ratio matching game"
      data-game-level={level} data-game-phase={state.phase}
      data-game-score={state.score}
      data-matched-pair-count={state.matchedPairIds.length}
      style={{color: "#13284c", display: "grid", gap: 16,
        margin: "0 auto", maxWidth: 720}}>
      <div>
        <h3 style={{fontSize: 26, margin: "0 0 6px"}}>Ratio Match Game</h3>
        <p style={{margin: 0}}>Choose two mathematically equivalent ratios.
          Correct pairs add 10 points; an incorrect pair subtracts 2.</p>
      </div>
      <div style={{display: "flex", gap: 10}}><button
        aria-pressed={level === 1}
        disabled={!ready || props.paused || state.phase !== "choosing"}
        style={secondaryButtonStyle}
        onClick={() => chooseLevel(1)} type="button">Level 1</button>
      <button aria-pressed={level === 2}
        disabled={!ready || props.paused || state.phase !== "choosing"}
        onClick={() => chooseLevel(2)} style={secondaryButtonStyle}
        type="button">Level 2</button></div>
      <p aria-live="polite" style={{fontSize: 20, fontWeight: 800,
        margin: 0}}>Score: {state.score}</p>
      <div aria-label="Source game cards" style={{display: "grid",
        gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12}}>
        {cards.map((card) => <button
          aria-pressed={state.selectedCardId === card.id}
          data-card-id={card.id}
          data-source-character-id={card.sourceCharacterId}
          data-source-instance={card.sourceInstanceName}
          data-source-text-ids={card.sourceTextIds.join(",")}
          data-ratio-equivalence-key={card.equivalenceKey}
          disabled={!ready || props.paused ||
            state.matchedPairIds.includes(card.pairId) ||
            state.phase !== "choosing"}
          key={card.id} onClick={() => selectCard(card.id)}
          style={{...actionButtonStyle,
            background: state.selectedCardId === card.id
              ? "#fff1a8" : "#ffffff",
            textAlign: "center"}}
          type="button">
          {card.label}
        </button>)}
      </div>
      {state.phase === "correct-feedback" || state.phase === "wrong-feedback"
        ? <div aria-live="assertive" role="alert">
          <p>{state.phase === "correct-feedback" ? "Match! +10" :
            "Try another pair. −2"}</p>
          <button onClick={dismiss} style={secondaryButtonStyle}
            type="button">Continue</button>
        </div> : null}
      {state.phase === "complete" ? <button onClick={finish}
        style={{...actionButtonStyle, justifySelf: "start"}} type="button">
        Finish game</button> : null}
      {requestBlocked ? <p role="alert">Feedback request failed closed.</p>
        : null}
    </section>;
    return shell(<MaintainedTaskSurface
      source={<SourceRenderer {...props} frame={visualFrame} />}>
      <CompanionPortal targetId={props.pageInteractionCompanionTargetId}>
        {controls}
      </CompanionPortal>
    </MaintainedTaskSurface>, props, hostRef,
    "g678-alg-l09-matching-game-product-calibration-v1");
  }
  const module = Object.freeze({...source.module,
    interactiveStops: Object.freeze([stop]),
    playbackEndFrame: 2,
    playbackEndFrameByDomain: Object.freeze({[config.mainFrameDomain]: 2}),
    lessonHost: Object.freeze({
      capabilities: Object.freeze(["practice-feedback"] as const),
      legacyOperations: "blocked" as const,
      auditStorage: "memory-only" as const,
      storesPersonalData: false as const,
    }), maturity: "private-current-js" as const, Renderer});
  return Object.freeze({...source, interactiveStops: Object.freeze([stop]),
    module, Renderer});
}

export interface AlgL09FinalAssessmentCandidateOptions {
  readonly questions: readonly AlgL09FinalAssessmentQuestion[];
}

export function createPrivateAlgL09FinalAssessmentCandidate(
  config: SourceStaticCanvasCandidateConfig,
  options: AlgL09FinalAssessmentCandidateOptions,
) {
  assertAlgL09FinalAssessmentQuestions(options.questions);
  const source = createSourceStaticCanvasCandidate(config);
  const SourceRenderer = source.Renderer;
  const stop: AnimationInteractiveStop = Object.freeze({
    id: `${config.animationId}-assessment-complete`,
    frameDomain: config.mainFrameDomain,
    stopFrame: 1, resumeFrame: 2,
    resolution: "explicit-source-control-finished",
    completionDisposition: "blocked-while-unresolved",
    requiresHostInteractiveStop: true,
    strictAcceptanceEffect: "none",
  });
  function Renderer(props: AnimationRendererProps) {
    const hostRef = useRef<HTMLDivElement>(null);
    const [state, setState] = useState(() =>
      createAlgL09FinalAssessmentState(props.seed, options.questions));
    const [requestBlocked, setRequestBlocked] = useState(false);
    const ready = useCanvasReady(hostRef, props.replay);
    useEffect(() => {
      setState((current) => reduceAlgL09FinalAssessment(current,
        {type: "replay", input: "mouse"}, props.seed, options.questions));
      setRequestBlocked(false);
      props.onLessonHostRequest?.({type: "reset-fq-score"});
    }, [props.onLessonHostRequest, props.replay, props.seed]);
    const questionNumber = state.questionNumbers[state.currentIndex] ?? 1;
    const question = options.questions[questionNumber - 1]!;
    const answer = (option: 1 | 2 | 3 | 4) => {
      if (!ready || props.paused || state.phase !== "answering") return;
      const correct = question.correctOption === option;
      const decision = props.onLessonHostRequest?.({type: "record-fq-score",
        questionId: `alg-l09-fq02-q${questionNumber}`,
        correct, pointsAwarded: correct ? 1 : 0, pointsPossible: 1});
      if (decision?.status !== "allowed") {
        setRequestBlocked(true);
        return;
      }
      setRequestBlocked(false);
      setState((current) => reduceAlgL09FinalAssessment(current,
        {type: "answer", option, input: "mouse"}, props.seed,
        options.questions));
    };
    const beginReview = () => setState((current) =>
      reduceAlgL09FinalAssessment(current,
        {type: "begin-review", input: "mouse"}, props.seed,
        options.questions));
    const nextReview = () => setState((current) =>
      reduceAlgL09FinalAssessment(current,
        {type: "next-review", input: "mouse"}, props.seed,
        options.questions));
    const finishReview = () => {
      setState((current) => reduceAlgL09FinalAssessment(current,
        {type: "finish-review", input: "mouse"}, props.seed,
        options.questions));
      props.onInteractiveStopResolved?.({stopId: stop.id,
        frameDomain: stop.frameDomain, resolution: stop.resolution,
        source: "maintained-source-derived-interaction"});
    };
    const correct = state.responses.filter((response) => response.correct)
      .length;
    const review = state.responses[state.reviewIndex];
    const visualFrame = state.phase === "answering"
      ? questionNumber + 1
      : state.phase === "review" && review ? review.questionNumber + 25 : 44;
    const controls = <section aria-label="Final assessment"
      data-assessment-phase={state.phase}
      data-current-question-number={questionNumber}
      data-presented-question-count={state.questionNumbers.length}
      data-response-count={state.responses.length}
      style={{color: "#13284c", display: "grid", gap: 16,
        margin: "0 auto", maxWidth: 760}}>
      {state.phase === "answering" ? <>
        <p style={{fontWeight: 700, margin: 0}}>Question {
          state.currentIndex + 1} of 10 · source item {questionNumber}</p>
        <h3 data-source-question-content-bound="true"
          style={{fontSize: 24, lineHeight: 1.35, margin: 0}}>{
          question.prompt}</h3>
        {question.supportingData.length > 0 ? <ul
          aria-label="Question data" style={{background: "#eef6ff",
            border: "1px solid #6f9bd2", borderRadius: 10,
            display: "grid", gap: 6, margin: 0, padding: "14px 30px"}}>{
          question.supportingData.map((item) =>
            <li key={item}>{item}</li>)}</ul> : null}
        <div aria-label="Answer choices" data-choice-count={question.choices.length}
          style={{display: "grid", gap: 10,
            gridTemplateColumns: question.choices.length === 2
              ? "repeat(2, minmax(0, 1fr))"
              : "repeat(2, minmax(0, 1fr))"}}>
          {question.choices.map((choice, index) => {
            const option = (index + 1) as 1 | 2 | 3 | 4;
            return <button data-answer-option={option}
            disabled={!ready || props.paused} key={option}
            onClick={() => answer(option)} style={actionButtonStyle}
            type="button">
              {String.fromCharCode(64 + option)}. {choice}
            </button>;
          })}</div>
      </> : null}
      {state.phase === "results" && state.responses.length === 10 ? <>
        <p aria-live="polite">Score: {correct} of 10</p>
        <button onClick={beginReview} style={{...actionButtonStyle,
          justifySelf: "start"}} type="button">Review responses</button>
      </> : null}
      {state.phase === "review" && review ? <>
        {(() => {
          const reviewedQuestion = options.questions[
            review.questionNumber - 1]!;
          return <div data-reviewed-source-question={review.questionNumber}>
            <h3>{reviewedQuestion.prompt}</h3>
            {reviewedQuestion.supportingData.length > 0
              ? <p>{reviewedQuestion.supportingData.join("; ")}</p> : null}
          </div>;
        })()}
        <p>Review {state.reviewIndex + 1} of 10 · source item {review.questionNumber}</p>
        <p data-review-answer-comparison="true">Your answer: {
          String.fromCharCode(64 + review.selectedOption)}. {
          options.questions[review.questionNumber - 1]!
            .choices[review.selectedOption - 1]} · Correct answer: {
          String.fromCharCode(64 + review.correctOption)}. {
          options.questions[review.questionNumber - 1]!
            .choices[review.correctOption - 1]}</p>
        {state.reviewIndex < state.responses.length - 1
          ? <button onClick={nextReview} style={{...actionButtonStyle,
              justifySelf: "start"}} type="button">Next response</button>
          : <button onClick={finishReview} style={{...actionButtonStyle,
              justifySelf: "start"}} type="button">Finish review</button>}
      </> : null}
      {requestBlocked ? <p role="alert">Score request failed closed.</p>
        : null}
    </section>;
    return shell(<MaintainedTaskSurface
      source={<SourceRenderer {...props} frame={visualFrame} />}>
      <CompanionPortal targetId={props.pageInteractionCompanionTargetId}>
        {controls}
      </CompanionPortal>
    </MaintainedTaskSurface>, props, hostRef,
    "g678-alg-l09-final-assessment-product-calibration-v1");
  }
  const module = Object.freeze({...source.module,
    interactiveStops: Object.freeze([stop]),
    lessonHost: Object.freeze({
      capabilities: Object.freeze(["fq-scoring"] as const),
      legacyOperations: "blocked" as const,
      auditStorage: "memory-only" as const,
      storesPersonalData: false as const,
    }), maturity: "private-current-js" as const, Renderer});
  return Object.freeze({...source, interactiveStops: Object.freeze([stop]),
    module, Renderer});
}
