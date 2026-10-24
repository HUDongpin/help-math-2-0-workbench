"use client";

import React, {useEffect, useLayoutEffect, useRef, useState} from "react";
import {createPortal} from "react-dom";

import type {
  AnimationInteractiveStop,
  AnimationRendererProps,
} from "./contract";
import {
  createAlgL09TiChoiceState,
  feedbackForAlgL09TiChoice,
  reduceAlgL09TiChoice,
  type AlgL09TiChoiceBehavior,
} from "./g678-alg-l09-ti-choice";
import {selectHostFeedback} from
  "./g678-advanced-manual/host-feedback-selector";
import {
  createSourceStaticCanvasCandidate,
  type SourceStaticCanvasCandidateConfig,
} from "./source-static-canvas-candidate";

export interface AlgL09TiChoiceGlossaryTerm {
  readonly id: string;
  readonly sourceKeyAttribute: string;
  readonly sourceCharacterIds: readonly number[];
  readonly firstFrame: number;
  readonly labels: Readonly<{en: string; es: string}>;
}

export interface AlgL09TiChoiceCandidateOptions {
  readonly calibrationId: "g678-alg-l09-ti-choice-product-calibration-v1";
  readonly companionSurfaceId: string;
  readonly behavior: AlgL09TiChoiceBehavior;
  readonly glossaryTerms: readonly AlgL09TiChoiceGlossaryTerm[];
}

const useClientLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function CompanionPortal({children, targetId}: {
  readonly children: React.ReactNode;
  readonly targetId?: string;
}) {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  useClientLayoutEffect(() => {
    if (!targetId) return void setTarget(null);
    const element = document.getElementById(targetId);
    setTarget(element?.dataset.pageInteractionCompanionHost === "true"
      ? element
      : null);
  }, [targetId]);
  return target ? createPortal(children, target) : children;
}

export function createPrivateSourceStaticAlgL09TiChoiceCandidate(
  config: SourceStaticCanvasCandidateConfig,
  options: AlgL09TiChoiceCandidateOptions,
) {
  const behavior = options.behavior;
  const STOP: AnimationInteractiveStop = Object.freeze({
    id: `${behavior.animationId}-choice-quiz`,
    frameDomain: behavior.frameDomain,
    stopFrame: behavior.stopFrame,
    resumeFrame: behavior.resumeFrame,
    resolution: "explicit-source-feedback-finished",
    completionDisposition: "blocked-while-unresolved",
    requiresHostInteractiveStop: true,
    strictAcceptanceEffect: "none",
  });
  invariant(config.animationId === behavior.animationId &&
    config.mainFrameDomain === behavior.frameDomain &&
    config.mainFrameCount === behavior.frameCount &&
    config.livePlaybackEndFrame === behavior.frameCount &&
    behavior.options.length >= 2 && behavior.options.length <= 4 &&
    behavior.options.filter((choice) => choice.correct).length === 1 &&
    behavior.correctChoice ===
      behavior.options.find((choice) => choice.correct)?.id,
  "ALG L9 TI runtime identity is invalid");
  invariant(options.companionSurfaceId ===
      `${behavior.animationId}-ti-choice-quiz` &&
    options.glossaryTerms.length > 0 &&
    new Set(options.glossaryTerms.map((term) => term.id)).size ===
      options.glossaryTerms.length &&
    options.glossaryTerms.every((term) =>
      term.sourceCharacterIds.length > 0 &&
      new Set(term.sourceCharacterIds).size === term.sourceCharacterIds.length &&
      term.firstFrame <= behavior.stopFrame),
  "ALG L9 TI glossary identity is invalid");
  const sourceCandidate = createSourceStaticCanvasCandidate(config);
  const SourceRenderer = sourceCandidate.Renderer;

  function Renderer(props: AnimationRendererProps) {
    const visualHostRef = useRef<HTMLDivElement>(null);
    const resolutionSent = useRef(false);
    const previousReplay = useRef(props.replay ?? 0);
    const [canvasReady, setCanvasReady] = useState(false);
    const [requestBlocked, setRequestBlocked] = useState(false);
    const [state, setState] = useState(createAlgL09TiChoiceState);

    useEffect(() => {
      setState((current) => reduceAlgL09TiChoice(behavior, current,
        {type: "observe-frame", frame: props.frame}));
    }, [props.frame]);

    useEffect(() => {
      const replay = props.replay ?? 0;
      if (replay === previousReplay.current) return;
      previousReplay.current = replay;
      resolutionSent.current = false;
      setRequestBlocked(false);
      setState((current) => reduceAlgL09TiChoice(behavior, current,
        {type: "replay", input: "mouse"}));
      props.onLessonHostRequest?.({type: "reset-practice-feedback",
        interactionId: config.animationId});
    }, [props.onLessonHostRequest, props.replay]);

    useEffect(() => {
      const host = visualHostRef.current;
      if (!host) return void setCanvasReady(false);
      const update = () => {
        const surface = host.querySelector<HTMLElement>(
          '[data-candidate-status="source-static-engineering-not-strict"]' +
          "[data-canvas-status]",
        );
        setCanvasReady(surface?.dataset.canvasStatus === "ready" ||
          surface?.dataset.canvasStatus === "updating");
      };
      update();
      const observer = new MutationObserver(update);
      observer.observe(host, {attributes: true, childList: true,
        subtree: true, attributeFilter: ["data-canvas-status"]});
      return () => observer.disconnect();
    }, [props.replay]);

    useEffect(() => {
      if (state.phase !== "resumed") {
        resolutionSent.current = false;
        return;
      }
      if (resolutionSent.current || !props.onInteractiveStopResolved) return;
      resolutionSent.current = true;
      props.onInteractiveStopResolved({
        stopId: STOP.id,
        frameDomain: STOP.frameDomain,
        resolution: STOP.resolution,
        source: "maintained-source-derived-interaction",
      });
    }, [props.onInteractiveStopResolved, state.phase]);

    const frameDomain = props.frameDomain ?? config.mainFrameDomain;
    const interactionVisible = frameDomain === config.mainFrameDomain &&
      props.scenario === "source-static-frame" &&
      props.frame >= STOP.stopFrame && state.phase !== "resumed";
    const glossaryReady = interactionVisible && canvasReady &&
      Boolean(props.onLessonHostRequest);
    const controlsReady = glossaryReady && !props.paused;
    const visualProps = interactionVisible
      ? {...props, frame: STOP.stopFrame}
      : props;
    const spanish = props.uiLanguage === "es";

    const choose = (choice: string) => {
      if (!controlsReady || state.phase !== "choosing") return;
      const next = reduceAlgL09TiChoice(behavior, state,
        {type: "choose", choice, input: "mouse", seed: props.seed});
      if (next.phase === "right-feedback") {
        const feedback = selectHostFeedback("right", props.seed);
        const decision = props.onLessonHostRequest?.({
          type: "record-practice-feedback",
          interactionId: config.animationId,
          outcome: "correct",
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

    const openGlossary = (entryId: string, trigger: HTMLButtonElement) => {
      if (!glossaryReady) return;
      const decision = props.onLessonHostRequest?.(
        {type: "open-glossary", entryId}, {trigger});
      setRequestBlocked(decision?.status !== "allowed");
    };

    const feedbackText = feedbackForAlgL09TiChoice(behavior, state);
    const feedbackDone = () => setState((current) =>
      current.phase === "right-feedback"
        ? reduceAlgL09TiChoice(behavior, current,
          {type: "right-feedback-finished"})
        : reduceAlgL09TiChoice(behavior, current,
          {type: "dismiss-wrong", input: "mouse"}));

    const controls = interactionVisible ? (
      <section
        aria-label={spanish ? "Pregunta de opción múltiple" :
          "Multiple-choice question"}
        data-choice-phase={state.phase}
        data-current-js-controls-ready={controlsReady ? "true" : "false"}
        data-quiz-try-count={state.quizTryCount}
        data-right-feedback-branch={state.rightFeedbackBranch ?? "none"}
        data-source-stop-frame={STOP.stopFrame}
        style={{background: "#f5fbf8", border: "1px solid #a4c5b4",
          borderRadius: 16, color: "#163e31", display: "grid", gap: 12,
          margin: "0 auto", maxWidth: 800, padding: 14}}
      >
        <strong>{behavior.sourceText.question}</strong>
        <div aria-label={spanish ? "Opciones" : "Choices"}
          style={{display: "grid", gap: 8}}>
          {behavior.options.map((choice) => (
            <button
              aria-pressed={state.selectedChoice === choice.id}
              data-choice-id={choice.id}
              data-source-button-character-id={choice.sourceButtonCharacterId}
              disabled={!controlsReady || !state.choicesEnabled}
              key={choice.id}
              onClick={() => choose(choice.id)}
              type="button"
            >
              {choice.label}. {choice.value}
            </button>
          ))}
        </div>
        {feedbackText ? (
          <div aria-live="assertive" role="alert">
            <p>{feedbackText}</p>
            <button onClick={feedbackDone} type="button">
              {state.phase === "wrong-feedback-1"
                ? (spanish ? "Intentar de nuevo" : "Try again")
                : (spanish ? "Continuar" : "Continue")}
            </button>
          </div>
        ) : null}
        <div aria-label={spanish ? "Glosario de la fuente" : "Source glossary"}
          style={{display: "flex", flexWrap: "wrap", gap: 8}}>
          {options.glossaryTerms.map((term) => (
            <button
              data-source-character-id={term.sourceCharacterIds[0]}
              data-source-character-ids={term.sourceCharacterIds.join(",")}
              data-source-key-attribute={term.sourceKeyAttribute}
              disabled={!glossaryReady}
              key={term.id}
              onClick={(event) => openGlossary(term.id, event.currentTarget)}
              type="button"
            >
              {term.labels[spanish ? "es" : "en"]}
            </button>
          ))}
        </div>
        {requestBlocked ? (
          <p aria-live="assertive" role="alert">
            {spanish ? "La solicitud se cerró de forma segura." :
              "The page request failed closed."}
          </p>
        ) : null}
      </section>
    ) : null;

    return (
      <div
        data-audio-acceptance="pending"
        data-behavior-parity-established="false"
        data-calibration-id={options.calibrationId}
        data-complexity-lane="interactive-understood"
        data-private-current-js="true"
        data-right-feedback-host="typed-practice-feedback"
        data-source-actionscript-executed="false"
        data-source-wrong-attempt-increment-complete={
          behavior.sourceWrongFeedbackAttemptIncrementComplete
            ? "true"
            : "false"
        }
        data-maintained-attempt-counter-normalizes-source-defect={
          behavior.maintainedAttemptCounterNormalizesKnownSourceVariantDefect
            ? "true"
            : "false"
        }
        data-strict-acceptance-effect="none"
        ref={visualHostRef}
        style={{margin: "0 auto", maxWidth: sourceCandidate.movie.stage.width}}
      >
        <SourceRenderer {...visualProps} />
        {controls ? (
          <CompanionPortal targetId={props.pageInteractionCompanionTargetId}>
            {controls}
          </CompanionPortal>
        ) : null}
      </div>
    );
  }

  const module = Object.freeze({
    ...sourceCandidate.module,
    interactiveStops: Object.freeze([STOP]),
    lessonHost: Object.freeze({
      capabilities: Object.freeze(["glossary", "practice-feedback"] as const),
      legacyOperations: "blocked" as const,
      auditStorage: "memory-only" as const,
      storesPersonalData: false as const,
    }),
    maturity: "private-current-js" as const,
    Renderer,
  });

  return Object.freeze({...sourceCandidate, Renderer, module,
    interactiveStop: STOP});
}
