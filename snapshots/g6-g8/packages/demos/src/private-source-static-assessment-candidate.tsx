"use client";

import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {createPortal} from "react-dom";

import type {AnimationRendererProps} from "./contract";
import type {PrivateSourceStaticGlossaryTerm} from
  "./private-source-static-glossary-candidate";
import {
  createSourceStaticCanvasCandidate,
  type SourceStaticCanvasCandidateConfig,
} from "./source-static-canvas-candidate";
import {
  createTs07AssessmentState,
  reduceTs07Assessment,
  validateTs07AssessmentConfig,
  type Ts07AssessmentConfig,
  type Ts07FeedbackName,
} from "./g678-ts07-assessment";
import {selectHostFeedback} from
  "./g678-advanced-manual/host-feedback-selector";

export interface PrivateTs07FeedbackLabel {
  readonly instanceName: Ts07FeedbackName;
  readonly labels: Readonly<{en: string; es: string}>;
}

export interface PrivateTs07HintContent {
  readonly title: Readonly<{en: string; es: string}>;
  readonly lines: Readonly<{en: readonly string[]; es: readonly string[]}>;
}

export interface PrivateSourceStaticAssessmentOptions {
  readonly calibrationId: string;
  readonly companionSurfaceId: string;
  readonly assessment: Ts07AssessmentConfig;
  readonly glossaryTerms: readonly PrivateSourceStaticGlossaryTerm[];
  readonly feedbackLabels: readonly PrivateTs07FeedbackLabel[];
  readonly hint: PrivateTs07HintContent;
  readonly sourceTextLanguage: "en";
  readonly spanishTextParityAccepted: false;
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

function validateOptions(
  config: SourceStaticCanvasCandidateConfig,
  options: PrivateSourceStaticAssessmentOptions,
) {
  invariant(
    /^g678-ts07-[a-z0-9-]+-product-calibration-v1$/.test(
      options.calibrationId,
    ) && /^[a-z0-9-]+$/.test(options.companionSurfaceId),
    `${config.animationId} has invalid TS07 product identifiers`,
  );
  const assessment = validateTs07AssessmentConfig(options.assessment);
  invariant(assessment.animationId === config.animationId &&
    assessment.terminalFrame === config.mainFrameCount,
  `${config.animationId} assessment/frame-domain binding drifted`);
  const feedbackNames = new Set(assessment.feedbackDomains.map((domain) =>
    domain.instanceName));
  invariant(options.feedbackLabels.length === 7 &&
    new Set(options.feedbackLabels.map((label) => label.instanceName)).size === 7 &&
    options.feedbackLabels.every((label) =>
      feedbackNames.has(label.instanceName) &&
      label.labels.en.trim().length > 0 && label.labels.es.trim().length > 0),
  `${config.animationId} feedback labels are incomplete`);
  invariant(options.glossaryTerms.length > 0 &&
    new Set(options.glossaryTerms.map((term) => term.id)).size ===
      options.glossaryTerms.length &&
    options.glossaryTerms.every((term) =>
      term.sourceKeyAttribute.trim().length > 0 &&
      term.labels.en.trim().length > 0 && term.labels.es.trim().length > 0),
  `${config.animationId} glossary controls are incomplete`);
  invariant(options.hint.title.en.trim().length > 0 &&
    options.hint.title.es.trim().length > 0 &&
    options.hint.lines.en.length > 0 && options.hint.lines.es.length > 0,
  `${config.animationId} hint content is incomplete`);
  invariant(options.sourceTextLanguage === "en" &&
    options.spanishTextParityAccepted === false,
  `${config.animationId} TS07 source-language boundary drifted`);
  return Object.freeze({
    assessment,
    feedbackLabels: Object.freeze(options.feedbackLabels.map((label) =>
      Object.freeze({...label, labels: Object.freeze({...label.labels})}))),
    glossaryTerms: Object.freeze(options.glossaryTerms.map((term) =>
      Object.freeze({...term, labels: Object.freeze({...term.labels})}))),
    hint: Object.freeze({
      title: Object.freeze({...options.hint.title}),
      lines: Object.freeze({
        en: Object.freeze([...options.hint.lines.en]),
        es: Object.freeze([...options.hint.lines.es]),
      }),
    }),
  });
}

export function createPrivateSourceStaticAssessmentCandidate(
  config: SourceStaticCanvasCandidateConfig,
  options: PrivateSourceStaticAssessmentOptions,
) {
  const checked = validateOptions(config, options);
  const candidate = createSourceStaticCanvasCandidate(config);
  const interactiveStop = Object.freeze({
    id: `${config.animationId}-quiz-stop`,
    frameDomain: config.mainFrameDomain,
    stopFrame: checked.assessment.quizStopFrame,
    resumeFrame: checked.assessment.resumeFrame,
    resolution: "explicit-source-feedback-finished" as const,
    completionDisposition: "blocked-while-unresolved" as const,
    requiresHostInteractiveStop: true as const,
    strictAcceptanceEffect: "none" as const,
  });

  function PrivateTs07AssessmentRenderer(props: AnimationRendererProps) {
    const visualHostRef = useRef<HTMLDivElement>(null);
    const resolutionPublished = useRef(false);
    const [canvasReady, setCanvasReady] = useState(false);
    const [requestBlocked, setRequestBlocked] = useState(false);
    const [state, setState] = useState(() =>
      createTs07AssessmentState(checked.assessment));
    const spanish = props.uiLanguage === "es";
    const activeFrameDomain = props.frameDomain ?? config.mainFrameDomain;
    const interactionVisible = activeFrameDomain === config.mainFrameDomain &&
      props.scenario === "source-static-frame" && !props.entryStateSha256;
    const controlsReady = interactionVisible && canvasReady &&
      Boolean(props.onLessonHostRequest) && !props.paused;
    const questionReached = props.frame >= checked.assessment.quizStopFrame;
    const answerReady = controlsReady && questionReached &&
      state.phase === "selecting";
    const visualFrame = questionReached && state.phase !== "resumed"
      ? checked.assessment.resumeFrame
      : props.frame;

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
      resolutionPublished.current = false;
      setRequestBlocked(false);
      setState({...createTs07AssessmentState(checked.assessment),
        replay: props.replay ?? 0});
      props.onLessonHostRequest?.({type: "reset-practice-feedback",
        interactionId: config.animationId});
    }, [props.onLessonHostRequest, props.replay]);

    useEffect(() => {
      if (state.phase !== "feedback-active" || !state.activeFeedback ||
        props.paused) return;
      const duration = Math.max(0,
        (state.activeFeedback.terminalFrame - 2) / config.fps * 1000);
      const timer = window.setTimeout(() => {
        props.onLessonHostRequest?.({type: "reset-practice-feedback",
          interactionId: config.animationId});
        setState((current) => reduceTs07Assessment(
          checked.assessment, current, {type: "feedback-finished"}));
      }, duration);
      return () => window.clearTimeout(timer);
    }, [props.onLessonHostRequest, props.paused, state.activeFeedback,
      state.phase]);

    useEffect(() => {
      if (state.phase !== "resumed") {
        resolutionPublished.current = false;
        return;
      }
      if (resolutionPublished.current || !props.onInteractiveStopResolved) return;
      resolutionPublished.current = true;
      props.onInteractiveStopResolved({
        stopId: interactiveStop.id,
        frameDomain: interactiveStop.frameDomain,
        resolution: interactiveStop.resolution,
        source: "maintained-source-derived-interaction",
      });
    }, [props.onInteractiveStopResolved, state.phase]);

    const chooseAnswer = useCallback((ordinal: 1 | 2 | 3 | 4) => {
      if (!answerReady || !props.onLessonHostRequest) return;
      const answer = checked.assessment.answers[ordinal - 1];
      const outcome = answer.result === "right" ? "correct" : "incorrect";
      const branch = selectHostFeedback(answer.result, props.seed);
      const decision = props.onLessonHostRequest({
        type: "record-practice-feedback",
        interactionId: config.animationId,
        outcome,
        branchIndex: branch.branchIndex,
        branchCount: branch.cardinality,
      });
      if (decision?.status !== "allowed") {
        setRequestBlocked(true);
        return;
      }
      setRequestBlocked(false);
      setState((current) => reduceTs07Assessment(checked.assessment, current, {
        type: "choose-answer",
        answerOrdinal: ordinal,
        input: "mouse",
        seed: props.seed,
      }));
    }, [answerReady, props.onLessonHostRequest, props.seed]);

    const openGlossary = useCallback((entryId: string,
      trigger: HTMLButtonElement) => {
      if (!controlsReady || !props.onLessonHostRequest) return;
      const decision = props.onLessonHostRequest(
        {type: "open-glossary", entryId}, {trigger});
      setRequestBlocked(decision?.status !== "allowed");
    }, [controlsReady, props.onLessonHostRequest]);

    const activeFeedbackLabel = state.activeFeedback
      ? checked.feedbackLabels.find((label) =>
        label.instanceName === state.activeFeedback?.instanceName)
      : null;
    const controls = interactionVisible ? (
      <section
        aria-label={spanish ? "Pregunta de práctica" : "Practice question"}
        data-answer-controls-ready={answerReady ? "true" : "false"}
        data-current-js-controls-ready={controlsReady ? "true" : "false"}
        data-feedback-instance={state.activeFeedback?.instanceName ?? "none"}
        data-page-interaction-companion-surface={options.companionSurfaceId}
        data-practice-phase={state.phase}
        data-source-quiz-stop-frame={checked.assessment.quizStopFrame}
        style={{background: "#f5fbf8", border: "1px solid #a4c5b4",
          borderRadius: 16, color: "#163e31", display: "grid", gap: 12,
          margin: "0 auto", maxWidth: 800, padding: 14}}
      >
        <div style={{alignItems: "center", display: "flex", flexWrap: "wrap",
          gap: 8}}>
          <strong>{spanish ? "Palabras clave" : "Key words"}</strong>
          {checked.glossaryTerms.map((term) => (
            <button
              data-source-character-id={term.sourceCharacterId}
              data-source-key-attribute={term.sourceKeyAttribute}
              disabled={!controlsReady}
              key={term.id}
              onClick={(event) => openGlossary(term.id, event.currentTarget)}
              style={{background: "#fff4c7", border: "2px solid #86660e",
                borderRadius: 999, color: "#163e31", minHeight: 44,
                padding: "8px 14px"}}
              type="button"
            >
              {term.labels[spanish ? "es" : "en"]}
            </button>
          ))}
        </div>
        {questionReached ? (
          <fieldset disabled={!answerReady}>
            <legend>{spanish ? "Selecciona una respuesta" : "Select an answer"}</legend>
            <div style={{display: "grid", gap: 8,
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))"}}>
              {[...checked.assessment.answers]
                .sort((left, right) =>
                  left.sourceVisualOrder - right.sourceVisualOrder)
                .map((answer) => (
                <button
                  data-source-button-character-id={answer.sourceCharacterId}
                  data-source-instance={answer.instanceName}
                  key={answer.instanceName}
                  onClick={() => chooseAnswer(answer.ordinal)}
                  style={{background: "white", border: "2px solid #315d4d",
                    borderRadius: 12, minHeight: 48, padding: "10px 14px"}}
                  type="button"
                >
                  {answer.label[spanish ? "es" : "en"]}
                </button>
              ))}
            </div>
          </fieldset>
        ) : (
          <p aria-live="polite" style={{margin: 0}}>
            {spanish
              ? "La explicación continúa hasta la pregunta."
              : "The explanation continues to the question."}
          </p>
        )}
        {questionReached && state.phase === "selecting" ? (
          <button
            disabled={!controlsReady}
            onClick={() => setState((current) => reduceTs07Assessment(
              checked.assessment, current, {type: "open-hint", input: "mouse"}))}
            type="button"
          >
            {spanish ? "Necesito más ayuda" : "Need More Help"}
          </button>
        ) : null}
        {state.phase === "hint-open" ? (
          <aside aria-label={checked.hint.title[spanish ? "es" : "en"]}>
            <strong>{checked.hint.title[spanish ? "es" : "en"]}</strong>
            {checked.hint.lines[spanish ? "es" : "en"].map((line) =>
              <p key={line}>{line}</p>)}
            <button onClick={() => setState((current) => reduceTs07Assessment(
              checked.assessment, current, {type: "close-hint", input: "mouse"}))}
              type="button">
              {spanish ? "Cerrar ayuda" : "Close help"}
            </button>
          </aside>
        ) : null}
        {state.phase === "feedback-active" && activeFeedbackLabel ? (
          <p aria-live="assertive" role="alert" style={{fontWeight: 700,
            margin: 0}}>
            {activeFeedbackLabel.labels[spanish ? "es" : "en"]}
          </p>
        ) : null}
        {requestBlocked ? (
          <p aria-live="assertive" role="alert">
            {spanish
              ? "La solicitud se cerró de forma segura."
              : "The page request failed closed."}
          </p>
        ) : null}
        {spanish && !options.spanishTextParityAccepted ? (
          <p data-source-text-language={options.sourceTextLanguage}
            style={{margin: 0}}>
            El texto de evaluación proviene de la fuente en inglés; la paridad
            textual en español sigue pendiente.
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
        data-random-branch-gate="maintained-seed-3-wrong-4-right"
        data-source-actionscript-executed="false"
        data-source-quiz-visual-frame={visualFrame}
        data-source-text-language={options.sourceTextLanguage}
        data-spanish-text-parity-accepted={
          options.spanishTextParityAccepted ? "true" : "false"}
        data-spoken-language-accepted="false"
        data-strict-acceptance-effect="none"
        ref={visualHostRef}
        style={{margin: "0 auto", maxWidth: candidate.movie.stage.width}}
      >
        <candidate.Renderer {...props} frame={visualFrame} state={undefined} />
        {controls ? (
          <CompanionPortal targetId={props.pageInteractionCompanionTargetId}>
            {controls}
          </CompanionPortal>
        ) : null}
      </div>
    );
  }

  const module = Object.freeze({
    ...candidate.module,
    playbackEndFrame: checked.assessment.terminalFrame,
    lessonHost: Object.freeze({
      capabilities: Object.freeze(["glossary", "practice-feedback"] as const),
      legacyOperations: "blocked" as const,
      auditStorage: "memory-only" as const,
      storesPersonalData: false as const,
    }),
    interactiveStops: Object.freeze([interactiveStop]),
    maturity: "private-current-js" as const,
    Renderer: PrivateTs07AssessmentRenderer,
  });

  return Object.freeze({...candidate, module,
    Renderer: PrivateTs07AssessmentRenderer, interactiveStop});
}
