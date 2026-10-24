"use client";

import React, {useEffect, useLayoutEffect, useRef, useState} from "react";
import {createPortal} from "react-dom";

import type {
  AnimationInteractiveStop,
  AnimationRendererProps,
} from "./contract";
import {
  assertAlgL09GuidedTutorialBehavior,
  createAlgL09GuidedTutorialState,
  reduceAlgL09GuidedTutorial,
  type AlgL09GuidedTutorialBehavior,
  type AlgL09GuidedTutorialState,
} from "./g678-alg-l09-guided-tutorial";
import {selectHostFeedback} from
  "./g678-advanced-manual/host-feedback-selector";
import {
  createSourceStaticCanvasCandidate,
  type SourceStaticCanvasCandidateConfig,
} from "./source-static-canvas-candidate";

export interface AlgL09GuidedTutorialGlossaryTerm {
  readonly id: string;
  readonly sourceKeyAttribute: string;
  readonly sourceCharacterIds: readonly number[];
  readonly firstFrame: number;
  readonly labels: Readonly<{en: string; es: string}>;
}

export interface AlgL09GuidedTutorialHelpPrompt {
  readonly stopId: string;
  readonly text: Readonly<{en: string; es: string}>;
}

export interface AlgL09GuidedTutorialCandidateOptions {
  readonly calibrationId:
    "g678-alg-l09-guided-tutorial-product-calibration-v1";
  readonly companionSurfaceId: string;
  readonly behavior: AlgL09GuidedTutorialBehavior;
  readonly glossaryTerms: readonly AlgL09GuidedTutorialGlossaryTerm[];
  readonly helpPrompts: readonly AlgL09GuidedTutorialHelpPrompt[];
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

function phaseFeedback(state: AlgL09GuidedTutorialState, spanish: boolean) {
  if (state.phase === "right-feedback") {
    return spanish ? "Correcto." : "Correct!";
  }
  if (state.phase === "wrong-feedback-1") {
    return spanish
      ? "Aún no. Revisa el ejemplo e inténtalo otra vez."
      : "Not yet. Review the example and try again.";
  }
  if (state.phase === "wrong-feedback-2") {
    return spanish
      ? "Revisa la solución desarrollada y continúa."
      : "Review the worked solution, then continue.";
  }
  return null;
}

export function createPrivateSourceStaticAlgL09GuidedTutorialCandidate(
  config: SourceStaticCanvasCandidateConfig,
  options: AlgL09GuidedTutorialCandidateOptions,
) {
  const behavior = options.behavior;
  assertAlgL09GuidedTutorialBehavior(behavior);
  const sourceStops = behavior.stops.filter((stop) =>
    stop.kind !== "terminal");
  const interactiveStops: readonly AnimationInteractiveStop[] = Object.freeze(
    sourceStops.map((stop) => Object.freeze({
      id: `${behavior.animationId}-${stop.id}`,
      frameDomain: behavior.frameDomain,
      stopFrame: stop.frame,
      resumeFrame: stop.resumeFrame as number,
      resolution: stop.kind === "quiz"
        ? "explicit-source-feedback-finished"
        : "explicit-source-control-finished",
      completionDisposition: "blocked-while-unresolved",
      requiresHostInteractiveStop: true,
      strictAcceptanceEffect: "none",
    })),
  );
  const helpStops = sourceStops.filter((stop) =>
    stop.kind === "help-or-continue");
  invariant(config.animationId === behavior.animationId &&
    config.mainFrameDomain === behavior.frameDomain &&
    config.mainFrameCount === behavior.frameCount &&
    config.livePlaybackEndFrame === behavior.frameCount &&
    options.companionSurfaceId ===
      `${behavior.animationId}-guided-tutorial` &&
    options.helpPrompts.length === helpStops.length &&
    helpStops.every((stop) => options.helpPrompts.some((prompt) =>
      prompt.stopId === stop.id)) &&
    options.glossaryTerms.length > 0 &&
    new Set(options.glossaryTerms.map((term) => term.id)).size ===
      options.glossaryTerms.length &&
    options.glossaryTerms.every((term) =>
      term.sourceCharacterIds.length > 0 &&
      new Set(term.sourceCharacterIds).size === term.sourceCharacterIds.length &&
      term.firstFrame <= behavior.frameCount),
  "ALG L9 guided tutorial runtime identity is invalid");
  const sourceCandidate = createSourceStaticCanvasCandidate(config);
  const SourceRenderer = sourceCandidate.Renderer;

  function Renderer(props: AnimationRendererProps) {
    const visualHostRef = useRef<HTMLDivElement>(null);
    const sentResolutions = useRef(new Set<string>());
    const previousReplay = useRef(props.replay ?? 0);
    const [canvasReady, setCanvasReady] = useState(false);
    const [requestBlocked, setRequestBlocked] = useState(false);
    const [state, setState] = useState(() => reduceAlgL09GuidedTutorial(
      behavior,
      createAlgL09GuidedTutorialState(),
      {type: "observe-frame", frame: props.frame},
    ));

    useEffect(() => {
      setState((current) => reduceAlgL09GuidedTutorial(behavior, current,
        {type: "observe-frame", frame: props.frame}));
    }, [props.frame]);

    useEffect(() => {
      const replay = props.replay ?? 0;
      if (replay === previousReplay.current) return;
      previousReplay.current = replay;
      sentResolutions.current.clear();
      setRequestBlocked(false);
      setState((current) => reduceAlgL09GuidedTutorial(behavior, current,
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
      for (const resolvedId of state.resolvedStopIds) {
        if (sentResolutions.current.has(resolvedId) ||
          !props.onInteractiveStopResolved) continue;
        const contract = sourceStops.find((stop) => stop.id === resolvedId);
        if (!contract) continue;
        sentResolutions.current.add(resolvedId);
        props.onInteractiveStopResolved({
          stopId: `${behavior.animationId}-${resolvedId}`,
          frameDomain: behavior.frameDomain,
          resolution: contract.kind === "quiz"
            ? "explicit-source-feedback-finished"
            : "explicit-source-control-finished",
          source: "maintained-source-derived-interaction",
        });
      }
    }, [props.onInteractiveStopResolved, state.resolvedStopIds]);

    const activeStop = behavior.stops.find((stop) =>
      stop.id === state.activeStopId);
    const interactionVisible = Boolean(activeStop) &&
      props.frameDomain === behavior.frameDomain &&
      props.scenario === "source-static-frame";
    const visualProps = interactionVisible && activeStop
      ? {...props, frame: activeStop.frame}
      : props;
    const hostReady = interactionVisible && canvasReady &&
      Boolean(props.onLessonHostRequest) && !props.paused;
    const spanish = props.uiLanguage === "es";

    const advance = () => {
      if (!hostReady) return;
      setState((current) => reduceAlgL09GuidedTutorial(behavior, current,
        {type: "continue", input: "mouse"}));
    };
    const openHelp = () => {
      if (!hostReady) return;
      setState((current) => reduceAlgL09GuidedTutorial(behavior, current,
        {type: "open-help", input: "mouse"}));
    };
    const closeHelp = () => setState((current) =>
      reduceAlgL09GuidedTutorial(behavior, current,
        {type: "close-help", input: "mouse"}));
    const choose = (choiceId: string) => {
      if (!hostReady || state.phase !== "choosing") return;
      const choice = behavior.options.find((candidate) =>
        candidate.id === choiceId);
      if (!choice) return;
      if (choice.correct) {
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
      setState((current) => reduceAlgL09GuidedTutorial(behavior, current,
        {type: "choose", choiceId, input: "mouse", seed: props.seed}));
    };
    const finishFeedback = () => setState((current) =>
      current.phase === "right-feedback"
        ? reduceAlgL09GuidedTutorial(behavior, current,
          {type: "right-feedback-finished"})
        : reduceAlgL09GuidedTutorial(behavior, current,
          {type: "dismiss-wrong", input: "mouse"}));
    const openGlossary = (entryId: string, trigger: HTMLButtonElement) => {
      if (!hostReady) return;
      const decision = props.onLessonHostRequest?.(
        {type: "open-glossary", entryId}, {trigger});
      setRequestBlocked(decision?.status !== "allowed");
    };
    const prompt = options.helpPrompts.find((candidate) =>
      candidate.stopId === state.activeStopId);
    const feedbackText = phaseFeedback(state, spanish);

    const controls = interactionVisible ? (
      <section
        aria-label={spanish ? "Tutorial guiado" : "Guided tutorial"}
        data-current-js-controls-ready={hostReady ? "true" : "false"}
        data-guided-phase={state.phase}
        data-quiz-try-count={state.quizTryCount}
        data-right-feedback-branch={state.rightFeedbackBranch ?? "none"}
        data-source-stop-frame={activeStop?.frame}
        style={{background: "#f5fbf8", border: "1px solid #a4c5b4",
          borderRadius: 16, color: "#163e31", display: "grid", gap: 12,
          margin: "0 auto", maxWidth: 800, padding: 14}}
      >
        {state.phase === "continue-stop" ? (
          <button disabled={!hostReady} onClick={advance} type="button">
            {spanish ? "Continuar" : "Continue"}
          </button>
        ) : null}
        {state.phase === "help-choice" ? (
          <div style={{display: "flex", flexWrap: "wrap", gap: 8}}>
            <button disabled={!hostReady} onClick={advance} type="button">
              {spanish ? "Continuar" : "Continue"}
            </button>
            <button disabled={!hostReady} onClick={openHelp} type="button">
              {spanish ? "Necesito más ayuda" : "Need more help"}
            </button>
          </div>
        ) : null}
        {state.phase === "help-open" && prompt ? (
          <div aria-live="polite" role="status">
            <p>{prompt.text[spanish ? "es" : "en"]}</p>
            <button onClick={closeHelp} type="button">
              {spanish ? "Cerrar ayuda" : "Close help"}
            </button>
          </div>
        ) : null}
        {state.phase === "choosing" ? (
          <>
            <strong>{behavior.finalQuestion}</strong>
            <div aria-label={spanish ? "Opciones" : "Choices"}
              style={{display: "grid", gap: 8}}>
              {behavior.options.map((choice) => (
                <button data-choice-id={choice.id} disabled={!hostReady}
                  key={choice.id}
                  onClick={() => choose(choice.id)} type="button">
                  {choice.label}. {choice.value}
                </button>
              ))}
            </div>
          </>
        ) : null}
        {feedbackText ? (
          <div aria-live="assertive" role="alert">
            <p>{feedbackText}</p>
            <button onClick={finishFeedback} type="button">
              {state.phase === "wrong-feedback-1"
                ? (spanish ? "Intentar de nuevo" : "Try again")
                : (spanish ? "Continuar" : "Continue")}
            </button>
          </div>
        ) : null}
        <div aria-label={spanish ? "Glosario de la fuente" : "Source glossary"}
          style={{display: "flex", flexWrap: "wrap", gap: 8}}>
          {options.glossaryTerms.map((term) => (
            <button data-source-character-ids={term.sourceCharacterIds.join(",")}
              data-source-key-attribute={term.sourceKeyAttribute}
              disabled={!hostReady} key={term.id}
              onClick={(event) => openGlossary(term.id, event.currentTarget)}
              type="button">
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
      <div data-audio-acceptance="pending"
        data-behavior-parity-established="false"
        data-calibration-id={options.calibrationId}
        data-complexity-lane="advanced-manual"
        data-private-current-js="true"
        data-source-actionscript-executed="false"
        data-strict-acceptance-effect="none" ref={visualHostRef}
        style={{margin: "0 auto", maxWidth: sourceCandidate.movie.stage.width}}>
        <SourceRenderer {...visualProps} />
        {controls ? (
          <CompanionPortal targetId={props.pageInteractionCompanionTargetId}>
            {controls}
          </CompanionPortal>
        ) : null}
      </div>
    );
  }

  const module = Object.freeze({...sourceCandidate.module,
    interactiveStops,
    lessonHost: Object.freeze({
      capabilities: Object.freeze(["glossary", "practice-feedback"] as const),
      legacyOperations: "blocked" as const,
      auditStorage: "memory-only" as const,
      storesPersonalData: false as const,
    }),
    maturity: "private-current-js" as const,
    Renderer,
  });
  return Object.freeze({...sourceCandidate, interactiveStops, module,
    Renderer});
}
