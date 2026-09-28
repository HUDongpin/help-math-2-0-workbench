"use client";
import {SourceQuestionAudioControls} from "./source-question-audio-controls";

import React, {useEffect, useMemo, useReducer, useRef, useState} from "react";
import {createPortal} from "react-dom";

import type {AnimationModule, AnimationRendererProps} from "./contract";
import type {G5L5PrivateCandidateMetadata} from "./g5-l5-private-current-js-candidate";
import {
  G5_L5_FQ003_CORRECT_OPTIONS,
  G5_L5_FQ003_BEHAVIOR_COMPOSITE_CONTRACT_ID,
  G5_L5_FQ003_INITIAL_STATE,
  G5_L5_TS007_BEHAVIOR_COMPOSITE_CONTRACT_ID,
  G5_L5_TS007_INITIAL_STATE,
  G5_L5_VB012_BEHAVIOR_COMPOSITE_CONTRACT_ID,
  G5_L5_VB012_INITIAL_STATE,
  G5_L5_VB012_WRONG_FEEDBACK,
  g5L5Fq003FrameForState,
  g5L5Fq003BehaviorCompositeStateForState,
  g5L5Ts007BehaviorCompositeStateForState,
  g5L5Ts007FrameForState,
  g5L5Vb012BehaviorCompositeStateForState,
  g5L5Vb012FrameForState,
  getG5L5Fq003CorrectCount,
  getG5L5Fq003Grade,
  getG5L5VerticalSliceSourceBinding,
  reduceG5L5Fq003,
  reduceG5L5Ts007,
  reduceG5L5Vb012,
  type G5L5Fq003Option,
  type G5L5VerticalSlicePageKind,
} from "./g5-l5-four-page-product-vertical-slice-state";
import {
  G5_L5_FQ002_ADMINISTERED_QUESTION_COUNT,
  G5_L5_FQ002_BEHAVIOR_COMPOSITE_CONTRACT_ID,
  G5_L5_FQ002_CORRECT_OPTIONS,
  G5_L5_TS008_BEHAVIOR_COMPOSITE_CONTRACT_ID,
  G5_L5_TS008_INITIAL_STATE,
  G5_L5_VB013_BEHAVIOR_COMPOSITE_CONTRACT_ID,
  G5_L5_VB013_INITIAL_STATE,
  G5_L5_VB013_WRONG_FEEDBACK,
  createG5L5Fq002InitialState,
  g5L5Fq002BehaviorCompositeStateForState,
  g5L5Fq002FrameForState,
  g5L5Ts008BehaviorCompositeStateForState,
  g5L5Ts008FrameForState,
  g5L5Vb013BehaviorCompositeStateForState,
  g5L5Vb013FrameForState,
  getG5L5ThreePageProductCalibrationSourceBinding,
  reduceG5L5Fq002,
  reduceG5L5Ts008,
  reduceG5L5Vb013,
  type G5L5Fq002Option,
} from "./g5-l5-three-page-product-calibration-state";
import {FAIL_CLOSED_LESSON_HOST_DEFAULTS} from "./lesson-host-contract";
import {
  createSourceStaticCanvasCandidate,
  type SourceStaticCanvasCandidateConfig,
} from "./source-static-canvas-candidate";

type SourceStaticCandidate = ReturnType<
  typeof createSourceStaticCanvasCandidate
>;

type SliceLocale = "en" | "es";

type G5L5ProductSlicePageKind =
  | G5L5VerticalSlicePageKind
  | "randomized-final-quiz";

const G5_L5_P4_THREE_PAGE_IDS = new Set([
  "course-g05-l05-vb-013",
  "course-g05-l05-ts-008",
  "course-g05-l05-fq-002",
]);

const OPTION_LABELS = Object.freeze(["A", "B", "C", "D"] as const);

const UI_COPY = Object.freeze({
  en: Object.freeze({
    answerPrompt: "Choose an answer option shown in the source visual.",
    audioUnavailable:
      "Audio is unavailable because cue ownership and synchronization are not established.",
    complete: "This product interaction is complete. Use Replay to reset it.",
    continue: "Continue",
    correct: "Correct.",
    explanation: "Show the source explanation state",
    finalQuiz: "Final quiz",
    help: "Need math help",
    helpClose: "Close math help",
    helpCopy:
      "The source opens a help panel and disables the answer choices until it closes.",
    interaction: "Page interaction",
    nextReview: "Next review",
    questionAudio: "Question audio unavailable",
    reportBoundary:
      "Results stay in this page only. The legacy report URL is blocked.",
    response: "Your answer",
    result: "Quiz result",
    returnResult: "Return to result",
    review: "Review answers",
    reviewComplete: "All 26 answers have been reviewed.",
    reviewProgress: "Review",
    score: "Score",
    sectionProgress: "Source section stop",
    sourceCorrect: "Correct answer",
    tryAgain: "Try the question once more.",
    wrong: "Not correct.",
  }),
  es: Object.freeze({
    answerPrompt: "Elige una opción que aparece en la imagen de la fuente.",
    audioUnavailable:
      "El audio no está disponible porque la propiedad de las pistas y la sincronización aún no están establecidas.",
    complete: "Esta interacción del producto está completa. Usa Repetir para reiniciarla.",
    continue: "Continuar",
    correct: "Correcto.",
    explanation: "Mostrar el estado de explicación de la fuente",
    finalQuiz: "Prueba final",
    help: "Necesito ayuda matemática",
    helpClose: "Cerrar la ayuda matemática",
    helpCopy:
      "La fuente abre un panel de ayuda y desactiva las respuestas hasta que se cierre.",
    interaction: "Interacción de la página",
    nextReview: "Siguiente revisión",
    questionAudio: "Audio de la pregunta no disponible",
    reportBoundary:
      "Los resultados permanecen solo en esta página. El informe heredado está bloqueado.",
    response: "Tu respuesta",
    result: "Resultado de la prueba",
    returnResult: "Volver al resultado",
    review: "Revisar respuestas",
    reviewComplete: "Se revisaron las 26 respuestas.",
    reviewProgress: "Revisión",
    score: "Puntuación",
    sectionProgress: "Pausa de sección de la fuente",
    sourceCorrect: "Respuesta correcta",
    tryAgain: "Intenta la pregunta una vez más.",
    wrong: "No es correcto.",
  }),
});

function localeFor(props: AnimationRendererProps): SliceLocale {
  return props.uiLanguage === "es" ? "es" : "en";
}

function hasCaptureIdentity(props: AnimationRendererProps): boolean {
  return Boolean(
    props.requirementId && props.traceId && props.entryStateSha256,
  );
}

function AudioBoundary({locale}: Readonly<{locale: SliceLocale}>) {
  return <p
    className="g5-l5-slice__audio-boundary"
    data-audio-cue-status="unresolved-disabled"
  >
    <button aria-describedby="g5-l5-slice-audio-boundary" disabled type="button">
      {UI_COPY[locale].questionAudio}
    </button>
    <span id="g5-l5-slice-audio-boundary">{UI_COPY[locale].audioUnavailable}</span>
  </p>;
}

function Companion({
  children,
  targetId,
}: Readonly<{
  children: React.ReactNode;
  targetId?: string;
}>) {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  useEffect(() => {
    setTarget(targetId ? document.getElementById(targetId) : null);
  }, [targetId]);
  const content = <div
    className={target
      ? "g5-l5-slice__companion g5-l5-slice__companion--portaled"
      : "g5-l5-slice__companion g5-l5-slice__companion--fallback"}
    data-g5-l5-slice-companion="true"
    data-portaled={target ? "true" : "false"}
  >{children}</div>;
  return target ? createPortal(content, target) : content;
}

function SourceVisual({
  behaviorComposite,
  candidate,
  frame,
  props,
}: Readonly<{
  behaviorComposite?: Readonly<{contractId: string; stateId: string}>;
  candidate: SourceStaticCandidate;
  frame: number;
  props: AnimationRendererProps;
}>) {
  const visualState = useMemo(() => {
    if (!behaviorComposite) return undefined;
    if (
      candidate.config.sourceBehaviorCompositeContractId !==
      behaviorComposite.contractId
    ) {
      throw new Error("Product behavior-composite contract differs from the source-static candidate");
    }
    const sourceState = candidate.getFrameState(frame, {
      entryStateSha256: props.entryStateSha256,
      frameDomain: props.frameDomain,
      lang: props.lang,
      requirementId: props.requirementId,
      scenario: props.scenario,
      seed: props.seed,
      traceId: props.traceId,
    });
    // A locale or deterministic request outside the source-static contract
    // remains a normal fail-closed candidate surface. Product state must not
    // turn that evidence boundary into a React render failure.
    if (sourceState.status !== "ready") return undefined;
    return Object.freeze({
      ...sourceState,
      behaviorCompositeContractId: behaviorComposite.contractId,
      behaviorCompositeState: behaviorComposite.stateId,
    });
  }, [
    behaviorComposite?.contractId,
    behaviorComposite?.stateId,
    candidate,
    frame,
    props.entryStateSha256,
    props.frameDomain,
    props.lang,
    props.requirementId,
    props.scenario,
    props.seed,
    props.traceId,
  ]);
  return <div className="g5-l5-slice__source-visual">
    <candidate.Renderer {...props} frame={frame} state={visualState} />
  </div>;
}

function LinearRenderer({
  candidate,
  metadata,
  props,
}: Readonly<{
  candidate: SourceStaticCandidate;
  metadata: G5L5PrivateCandidateMetadata;
  props: AnimationRendererProps;
}>) {
  return <SliceRoot
    behaviorState="linear-playback"
    kind="linear"
    metadata={metadata}
    props={props}
  >
    <SourceVisual candidate={candidate} frame={props.frame} props={props} />
  </SliceRoot>;
}

function FixedChoiceRenderer({
  candidate,
  metadata,
  props,
}: Readonly<{
  candidate: SourceStaticCandidate;
  metadata: G5L5PrivateCandidateMetadata;
  props: AnimationRendererProps;
}>) {
  const [state, dispatch] = useReducer(
    reduceG5L5Vb012,
    G5_L5_VB012_INITIAL_STATE,
  );
  const firstChoiceRef = useRef<HTMLButtonElement>(null);
  const completeStatusRef = useRef<HTMLParagraphElement>(null);
  const feedbackContinueFocusRef = useRef<"retry" | "complete" | null>(null);
  useEffect(() => {
    feedbackContinueFocusRef.current = null;
    dispatch({type: "reset"});
  }, [props.replay, props.seed]);
  useEffect(() => {
    if (
      feedbackContinueFocusRef.current === "retry" &&
      state.mode === "question" &&
      state.feedback === "idle" &&
      state.controlsEnabled
    ) {
      feedbackContinueFocusRef.current = null;
      firstChoiceRef.current?.focus();
    } else if (
      feedbackContinueFocusRef.current === "complete" &&
      state.mode === "complete"
    ) {
      feedbackContinueFocusRef.current = null;
      completeStatusRef.current?.focus();
    }
  }, [state.controlsEnabled, state.feedback, state.mode]);
  const continueFeedback = () => {
    feedbackContinueFocusRef.current =
      state.feedback === "wrong" && state.attempts < 2
        ? "retry"
        : "complete";
    dispatch({type: "continue"});
  };
  const locale = localeFor(props);
  const copy = UI_COPY[locale];
  const capture = hasCaptureIdentity(props);
  const frame = capture
    ? props.frame
    : g5L5Vb012FrameForState(state, props.frame);
  const behaviorComposite = capture
    ? undefined
    : Object.freeze({
        contractId: G5_L5_VB012_BEHAVIOR_COMPOSITE_CONTRACT_ID,
        stateId: g5L5Vb012BehaviorCompositeStateForState(state, frame),
      });

  const companion = capture ? null : <Companion
    targetId={props.pageInteractionCompanionTargetId}
  >
    <section
      aria-label={copy.interaction}
      data-attempt-count={state.attempts}
      data-behavior-state={state.mode}
      data-controls-enabled={state.controlsEnabled ? "true" : "false"}
      data-feedback-state={state.feedback}
      data-g5-l5-vb012-controls="true"
    >
      {state.mode === "complete"
        ? <p
            aria-live="polite"
            data-slice-complete="true"
            ref={completeStatusRef}
            role="status"
            tabIndex={-1}
          >{copy.complete}</p>
        : <>
            <fieldset>
              <legend>{copy.answerPrompt}</legend>
              <div className="g5-l5-slice__choice-grid g5-l5-slice__choice-grid--two">
                <button
                  data-choice="1"
                  disabled={!state.controlsEnabled}
                  onClick={() => dispatch({type: "choose", choice: 1})}
                  ref={firstChoiceRef}
                  type="button"
                >−8</button>
                <button
                  data-choice="2"
                  disabled={!state.controlsEnabled}
                  onClick={() => dispatch({type: "choose", choice: 2})}
                  type="button"
                >+8</button>
              </div>
            </fieldset>
            <p aria-live="polite" data-slice-feedback={state.feedback}>
              {state.feedback === "correct"
                ? copy.correct
                : state.feedback === "wrong"
                  ? <span lang="en">{
                      G5_L5_VB012_WRONG_FEEDBACK[
                        Math.min(1, Math.max(0, state.attempts - 1))
                      ]
                    }</span>
                  : null}
            </p>
            {state.feedback !== "idle"
              ? <button
                  autoFocus
                  data-slice-action="continue-feedback"
                  onClick={continueFeedback}
                  type="button"
                >{copy.continue}</button>
              : null}
          </>}
      <AudioBoundary locale={locale} />
    </section>
  </Companion>;

  return <SliceRoot
    behaviorState={state.mode}
    kind="fixed-choice"
    metadata={metadata}
    props={props}
  >
    <SourceVisual
      behaviorComposite={behaviorComposite}
      candidate={candidate}
      frame={frame}
      props={props}
    />
    {companion}
  </SliceRoot>;
}

function MultiSectionRenderer({
  candidate,
  metadata,
  props,
}: Readonly<{
  candidate: SourceStaticCandidate;
  metadata: G5L5PrivateCandidateMetadata;
  props: AnimationRendererProps;
}>) {
  const [state, dispatch] = useReducer(
    reduceG5L5Ts007,
    G5_L5_TS007_INITIAL_STATE,
  );
  const firstChoiceRef = useRef<HTMLButtonElement>(null);
  const completeStatusRef = useRef<HTMLParagraphElement>(null);
  const feedbackContinueFocusRef = useRef<"retry" | "complete" | null>(null);
  const helpButtonRef = useRef<HTMLButtonElement>(null);
  const restoreHelpFocusRef = useRef(false);
  useEffect(() => {
    feedbackContinueFocusRef.current = null;
    restoreHelpFocusRef.current = false;
    dispatch({type: "reset"});
  }, [props.replay, props.seed]);
  useEffect(() => {
    if (
      feedbackContinueFocusRef.current === "retry" &&
      state.mode === "sections" &&
      state.feedback === "idle" &&
      state.controlsEnabled
    ) {
      feedbackContinueFocusRef.current = null;
      firstChoiceRef.current?.focus();
    } else if (
      feedbackContinueFocusRef.current === "complete" &&
      state.mode === "complete"
    ) {
      feedbackContinueFocusRef.current = null;
      completeStatusRef.current?.focus();
    }
  }, [state.controlsEnabled, state.feedback, state.mode]);
  useEffect(() => {
    if (!state.helpOpen && restoreHelpFocusRef.current) {
      restoreHelpFocusRef.current = false;
      helpButtonRef.current?.focus();
    }
  }, [state.helpOpen]);
  const locale = localeFor(props);
  const copy = UI_COPY[locale];
  const capture = hasCaptureIdentity(props);
  const frame = capture
    ? props.frame
    : g5L5Ts007FrameForState(state, props.frame);
  const behaviorComposite = capture
    ? undefined
    : Object.freeze({
        contractId: G5_L5_TS007_BEHAVIOR_COMPOSITE_CONTRACT_ID,
        stateId: g5L5Ts007BehaviorCompositeStateForState(state),
      });
  const atQuestion = state.mode === "sections" && state.sectionIndex === 4;
  const revealAvailable = state.mode === "sections" &&
    (state.sectionIndex === 2 || state.sectionIndex === 3);
  const closeHelp = () => {
    restoreHelpFocusRef.current = true;
    dispatch({type: "close-help"});
  };
  const continueFeedback = () => {
    feedbackContinueFocusRef.current =
      state.feedback === "wrong" && state.attempts < 2
        ? "retry"
        : "complete";
    dispatch({type: "continue-feedback"});
  };

  const companion = capture ? null : <Companion
    targetId={props.pageInteractionCompanionTargetId}
  >
    <section
      aria-label={copy.interaction}
      data-attempt-count={state.attempts}
      data-behavior-state={state.mode}
      data-controls-enabled={state.controlsEnabled ? "true" : "false"}
      data-explanation-visible={state.explanationVisible ? "true" : "false"}
      data-feedback-state={state.feedback}
      data-g5-l5-ts007-controls="true"
      data-help-open={state.helpOpen ? "true" : "false"}
      data-source-section-index={state.sectionIndex}
    >
      {state.mode === "complete"
        ? <p
            aria-live="polite"
            data-slice-complete="true"
            ref={completeStatusRef}
            role="status"
            tabIndex={-1}
          >{copy.complete}</p>
        : <>
            <p>{copy.sectionProgress} {state.sectionIndex + 1} / 5</p>
            {!atQuestion
              ? <div className="g5-l5-slice__action-row">
                  {revealAvailable
                    ? <button
                        aria-pressed={state.explanationVisible}
                        data-slice-action="reveal-explanation"
                        disabled={!state.controlsEnabled}
                        onClick={() => dispatch({type: "reveal-explanation"})}
                        type="button"
                      >{copy.explanation}</button>
                    : null}
                  <button
                    data-slice-action="advance-section"
                    disabled={!state.controlsEnabled}
                    onClick={() => dispatch({type: "advance"})}
                    type="button"
                  >{copy.continue}</button>
                </div>
              : <>
                  <fieldset>
                    <legend>{copy.answerPrompt}</legend>
                    <div className="g5-l5-slice__choice-grid">
                      {OPTION_LABELS.map((label, index) => <button
                        data-choice={index + 1}
                        disabled={!state.controlsEnabled}
                        key={label}
                        onClick={() => dispatch({
                          type: "choose",
                          choice: (index + 1) as 1 | 2 | 3 | 4,
                        })}
                        ref={index === 0 ? firstChoiceRef : undefined}
                        type="button"
                      >{label}</button>)}
                    </div>
                  </fieldset>
                  <div className="g5-l5-slice__action-row">
                    <button
                      data-slice-action="open-help"
                      disabled={!state.controlsEnabled}
                      onClick={() => dispatch({type: "open-help"})}
                      ref={helpButtonRef}
                      type="button"
                    >{copy.help}</button>
                    {state.feedback !== "idle"
                      ? <button
                          autoFocus
                          data-slice-action="continue-feedback"
                          onClick={continueFeedback}
                          type="button"
                        >{copy.continue}</button>
                      : null}
                  </div>
                  <p aria-live="polite" data-slice-feedback={state.feedback}>
                    {state.feedback === "correct"
                      ? copy.correct
                      : state.feedback === "wrong"
                        ? `${copy.wrong} ${state.attempts < 2 ? copy.tryAgain : ""}`
                        : null}
                  </p>
                </>}
            {state.helpOpen
              ? <div aria-label={copy.help} className="g5-l5-slice__help" role="dialog">
                  <p>{copy.helpCopy}</p>
                  <button
                    autoFocus
                    data-slice-action="close-help"
                    onClick={closeHelp}
                    type="button"
                  >{copy.helpClose}</button>
                </div>
              : null}
          </>}
      <AudioBoundary locale={locale} />
    </section>
  </Companion>;

  return <SliceRoot
    behaviorState={state.mode}
    kind="multi-section"
    metadata={metadata}
    props={props}
  >
    <SourceVisual
      behaviorComposite={behaviorComposite}
      candidate={candidate}
      frame={frame}
      props={props}
    />
    {companion}
  </SliceRoot>;
}

function FinalQuizRenderer({
  candidate,
  metadata,
  props,
}: Readonly<{
  candidate: SourceStaticCandidate;
  metadata: G5L5PrivateCandidateMetadata;
  props: AnimationRendererProps;
}>) {
  const [state, dispatch] = useReducer(
    reduceG5L5Fq003,
    G5_L5_FQ003_INITIAL_STATE,
  );
  useEffect(() => {if (props.paused) props.onLessonHostRequest?.({type:"stop-audio"});}, [props.paused, props.onLessonHostRequest]);
  const resultRef = useRef<HTMLDivElement>(null);
  const reviewRef = useRef<HTMLDivElement>(null);
  const reviewFocusPendingRef = useRef(false);
  useEffect(() => {
    reviewFocusPendingRef.current = false;
    dispatch({type: "reset"});
  }, [props.replay, props.seed]);
  useEffect(() => {
    if (state.mode === "review" && reviewFocusPendingRef.current) {
      reviewFocusPendingRef.current = false;
      reviewRef.current?.focus();
    } else if (state.mode === "result") {
      reviewFocusPendingRef.current = false;
      resultRef.current?.focus();
    }
  }, [state.mode, state.reviewComplete]);
  const startReview = () => {
    reviewFocusPendingRef.current = true;
    dispatch({type: "start-review"});
  };
  const locale = localeFor(props);
  const copy = UI_COPY[locale];
  const capture = hasCaptureIdentity(props);
  const frame = capture ? props.frame : g5L5Fq003FrameForState(state);
  const correctCount = getG5L5Fq003CorrectCount(state);
  const response = state.responses[state.reviewIndex];
  const correct = G5_L5_FQ003_CORRECT_OPTIONS[state.reviewIndex];
  const behaviorComposite = capture
    ? undefined
    : Object.freeze({
        contractId: G5_L5_FQ003_BEHAVIOR_COMPOSITE_CONTRACT_ID,
        stateId: g5L5Fq003BehaviorCompositeStateForState(state),
      });

  const companion = capture ? null : <Companion
    targetId={props.pageInteractionCompanionTargetId}
  >
    <section
      aria-label={copy.finalQuiz}
      data-behavior-state={state.mode}
      data-g5-l5-fq003-controls="true"
      data-legacy-reporting={state.reportingDisposition}
      data-question-index={state.questionIndex}
      data-response-count={state.responses.length}
      data-review-complete={state.reviewComplete ? "true" : "false"}
      data-review-index={state.reviewIndex}
    >
      {state.mode === "question"
        ? <fieldset>
            <legend>
              {copy.finalQuiz}: {state.questionIndex + 1} / 26. {copy.answerPrompt}
            </legend>
            <div className="g5-l5-slice__choice-grid">
              {OPTION_LABELS.map((label, index) => <button
                aria-label={`${label}, ${state.questionIndex + 1} / 26`}
                data-choice={index + 1}
                key={label}
                onClick={() => dispatch({
                  type: "answer",
                  choice: (index + 1) as G5L5Fq003Option,
                })}
                type="button"
              >{label}</button>)}
            </div>
          </fieldset>
        : state.mode === "review"
          ? <div
              aria-live="polite"
              data-review-surface="true"
              ref={reviewRef}
              tabIndex={-1}
            >
              <p>{copy.reviewProgress} {state.reviewIndex + 1} / 26</p>
              <p>{copy.response}: <strong>{
                response ? OPTION_LABELS[response - 1] : "—"
              }</strong></p>
              <p>{copy.sourceCorrect}: <strong>{
                OPTION_LABELS[correct - 1]
              }</strong></p>
              <div className="g5-l5-slice__action-row">
                <button
                  data-slice-action="return-result"
                  onClick={() => dispatch({type: "return-to-result"})}
                  type="button"
                >{copy.returnResult}</button>
                <button
                  data-slice-action="next-review"
                  onClick={() => dispatch({type: "next-review"})}
                  type="button"
                >{state.reviewIndex === 25 ? copy.result : copy.nextReview}</button>
              </div>
            </div>
          : <div
              aria-live="polite"
              data-quiz-result="true"
              ref={resultRef}
              tabIndex={-1}
            >
              <h2>{copy.result}</h2>
              <p>{copy.score}: <strong>{correctCount} / 26</strong></p>
              <p lang="en">{getG5L5Fq003Grade(correctCount)}</p>
              <p data-reporting-boundary="blocked-memory-only">{
                copy.reportBoundary
              }</p>
              {state.reviewComplete ? <p>{copy.reviewComplete}</p> : null}
              <button
                data-slice-action="start-review"
                onClick={startReview}
                type="button"
              >{copy.review}</button>
            </div>}
      <SourceQuestionAudioControls animationId="course-g05-l05-fq-003" questionNumber={state.mode === "question" ? state.questionIndex + 1 : null} enabled runtime={{...props,paused:false}} />
    </section>
  </Companion>;

  return <SliceRoot
    behaviorState={state.mode}
    kind="final-quiz"
    metadata={metadata}
    props={props}
  >
    <SourceVisual
      behaviorComposite={behaviorComposite}
      candidate={candidate}
      frame={frame}
      props={props}
    />
    {companion}
  </SliceRoot>;
}

function Vb013CalibrationRenderer({
  candidate,
  metadata,
  props,
}: Readonly<{
  candidate: SourceStaticCandidate;
  metadata: G5L5PrivateCandidateMetadata;
  props: AnimationRendererProps;
}>) {
  const [state, dispatch] = useReducer(
    reduceG5L5Vb013,
    G5_L5_VB013_INITIAL_STATE,
  );
  const firstChoiceRef = useRef<HTMLButtonElement>(null);
  const completeStatusRef = useRef<HTMLParagraphElement>(null);
  const feedbackContinueFocusRef = useRef<"retry" | "complete" | null>(null);
  useEffect(() => {
    feedbackContinueFocusRef.current = null;
    dispatch({type: "reset"});
  }, [props.replay, props.seed]);
  useEffect(() => {
    if (
      feedbackContinueFocusRef.current === "retry" &&
      state.mode === "question" &&
      state.feedback === "idle" &&
      state.controlsEnabled
    ) {
      feedbackContinueFocusRef.current = null;
      firstChoiceRef.current?.focus();
    } else if (
      feedbackContinueFocusRef.current === "complete" &&
      state.mode === "complete"
    ) {
      feedbackContinueFocusRef.current = null;
      completeStatusRef.current?.focus();
    }
  }, [state.controlsEnabled, state.feedback, state.mode]);
  const continueFeedback = () => {
    feedbackContinueFocusRef.current = state.feedback === "wrong-attempt1"
      ? "retry"
      : "complete";
    dispatch({type: "continue-feedback"});
  };
  const locale = localeFor(props);
  const copy = UI_COPY[locale];
  const capture = hasCaptureIdentity(props);
  const frame = capture
    ? props.frame
    : g5L5Vb013FrameForState(state, props.frame);
  const behaviorComposite = capture
    ? undefined
    : Object.freeze({
        contractId: G5_L5_VB013_BEHAVIOR_COMPOSITE_CONTRACT_ID,
        stateId: g5L5Vb013BehaviorCompositeStateForState(state, frame),
      });

  const companion = capture ? null : <Companion
    targetId={props.pageInteractionCompanionTargetId}
  >
    <section
      aria-label={copy.interaction}
      data-attempt-count={state.attempts}
      data-behavior-state={state.mode}
      data-controls-enabled={state.controlsEnabled ? "true" : "false"}
      data-feedback-state={state.feedback}
      data-g5-l5-vb013-controls="true"
    >
      {state.mode === "complete"
        ? <p
            aria-live="polite"
            data-slice-complete="true"
            ref={completeStatusRef}
            role="status"
            tabIndex={-1}
          >{copy.complete}</p>
        : <>
            <fieldset>
              <legend>{copy.answerPrompt}</legend>
              <div className="g5-l5-slice__choice-grid g5-l5-slice__choice-grid--two">
                <button
                  data-choice="1"
                  disabled={!state.controlsEnabled}
                  onClick={() => dispatch({type: "choose", choice: 1})}
                  ref={firstChoiceRef}
                  type="button"
                >−2</button>
                <button
                  data-choice="2"
                  disabled={!state.controlsEnabled}
                  onClick={() => dispatch({type: "choose", choice: 2})}
                  type="button"
                >+2</button>
              </div>
            </fieldset>
            <p aria-live="polite" data-slice-feedback={state.feedback}>
              {state.feedback === "correct"
                ? copy.correct
                : state.feedback === "wrong-attempt1" ||
                    state.feedback === "wrong-attempt2"
                  ? <span lang="en">{
                      G5_L5_VB013_WRONG_FEEDBACK[
                        state.feedback === "wrong-attempt1" ? 0 : 1
                      ]
                    }</span>
                  : null}
            </p>
            {state.feedback !== "idle"
              ? <button
                  autoFocus
                  data-slice-action="continue-feedback"
                  onClick={continueFeedback}
                  type="button"
                >{copy.continue}</button>
              : null}
          </>}
      <AudioBoundary locale={locale} />
    </section>
  </Companion>;

  return <SliceRoot
    behaviorState={state.mode}
    kind="fixed-choice"
    metadata={metadata}
    props={props}
  >
    <SourceVisual
      behaviorComposite={behaviorComposite}
      candidate={candidate}
      frame={frame}
      props={props}
    />
    {companion}
  </SliceRoot>;
}

function Ts008CalibrationRenderer({
  candidate,
  metadata,
  props,
}: Readonly<{
  candidate: SourceStaticCandidate;
  metadata: G5L5PrivateCandidateMetadata;
  props: AnimationRendererProps;
}>) {
  const [state, dispatch] = useReducer(
    reduceG5L5Ts008,
    G5_L5_TS008_INITIAL_STATE,
  );
  const firstChoiceRef = useRef<HTMLButtonElement>(null);
  const completeStatusRef = useRef<HTMLParagraphElement>(null);
  const feedbackContinueFocusRef = useRef<"retry" | "complete" | null>(null);
  const helpButtonRef = useRef<HTMLButtonElement>(null);
  const restoreHelpFocusRef = useRef(false);
  useEffect(() => {
    feedbackContinueFocusRef.current = null;
    restoreHelpFocusRef.current = false;
    dispatch({type: "reset"});
  }, [props.replay, props.seed]);
  useEffect(() => {
    if (
      feedbackContinueFocusRef.current === "retry" &&
      state.mode === "sections" &&
      state.feedback === "idle" &&
      state.controlsEnabled
    ) {
      feedbackContinueFocusRef.current = null;
      firstChoiceRef.current?.focus();
    } else if (
      feedbackContinueFocusRef.current === "complete" &&
      state.mode === "complete"
    ) {
      feedbackContinueFocusRef.current = null;
      completeStatusRef.current?.focus();
    }
  }, [state.controlsEnabled, state.feedback, state.mode]);
  useEffect(() => {
    if (!state.helpOpen && restoreHelpFocusRef.current) {
      restoreHelpFocusRef.current = false;
      helpButtonRef.current?.focus();
    }
  }, [state.helpOpen]);
  const locale = localeFor(props);
  const copy = UI_COPY[locale];
  const capture = hasCaptureIdentity(props);
  const frame = capture
    ? props.frame
    : g5L5Ts008FrameForState(state, props.frame);
  const behaviorComposite = capture
    ? undefined
    : Object.freeze({
        contractId: G5_L5_TS008_BEHAVIOR_COMPOSITE_CONTRACT_ID,
        stateId: g5L5Ts008BehaviorCompositeStateForState(state),
      });
  const atQuestion = state.mode === "sections" && state.sectionIndex === 4;
  const revealAvailable = state.mode === "sections" &&
    (state.sectionIndex === 2 || state.sectionIndex === 3);
  const closeHelp = () => {
    restoreHelpFocusRef.current = true;
    dispatch({type: "close-help"});
  };
  const continueFeedback = () => {
    feedbackContinueFocusRef.current = state.feedback === "wrong-attempt1"
      ? "retry"
      : "complete";
    dispatch({type: "continue-feedback"});
  };

  const companion = capture ? null : <Companion
    targetId={props.pageInteractionCompanionTargetId}
  >
    <section
      aria-label={copy.interaction}
      data-attempt-count={state.attempts}
      data-behavior-state={state.mode}
      data-controls-enabled={state.controlsEnabled ? "true" : "false"}
      data-explanation-visible={state.explanationVisible ? "true" : "false"}
      data-feedback-state={state.feedback}
      data-g5-l5-ts008-controls="true"
      data-help-open={state.helpOpen ? "true" : "false"}
      data-source-section-index={state.sectionIndex}
    >
      {state.mode === "complete"
        ? <p
            aria-live="polite"
            data-slice-complete="true"
            ref={completeStatusRef}
            role="status"
            tabIndex={-1}
          >{copy.complete}</p>
        : <>
            <p>{copy.sectionProgress} {state.sectionIndex + 1} / 5</p>
            {!atQuestion
              ? <div className="g5-l5-slice__action-row">
                  {revealAvailable
                    ? <button
                        aria-pressed={state.explanationVisible}
                        data-slice-action="reveal-explanation"
                        disabled={!state.controlsEnabled}
                        onClick={() => dispatch({type: "reveal-explanation"})}
                        type="button"
                      >{copy.explanation}</button>
                    : null}
                  <button
                    data-slice-action="advance-section"
                    disabled={!state.controlsEnabled}
                    onClick={() => dispatch({type: "advance"})}
                    type="button"
                  >{copy.continue}</button>
                </div>
              : <>
                  <fieldset>
                    <legend>{copy.answerPrompt}</legend>
                    <div className="g5-l5-slice__choice-grid">
                      {OPTION_LABELS.map((label, index) => <button
                        data-choice={index + 1}
                        disabled={!state.controlsEnabled}
                        key={label}
                        onClick={() => dispatch({
                          type: "choose",
                          choice: (index + 1) as 1 | 2 | 3 | 4,
                        })}
                        ref={index === 0 ? firstChoiceRef : undefined}
                        type="button"
                      >{label}</button>)}
                    </div>
                  </fieldset>
                  <div className="g5-l5-slice__action-row">
                    <button
                      data-slice-action="open-help"
                      disabled={!state.controlsEnabled}
                      onClick={() => dispatch({type: "open-help"})}
                      ref={helpButtonRef}
                      type="button"
                    >{copy.help}</button>
                    {state.feedback !== "idle"
                      ? <button
                          autoFocus
                          data-slice-action="continue-feedback"
                          onClick={continueFeedback}
                          type="button"
                        >{copy.continue}</button>
                      : null}
                  </div>
                  <p aria-live="polite" data-slice-feedback={state.feedback}>
                    {state.feedback === "correct"
                      ? copy.correct
                      : state.feedback === "wrong-attempt1"
                        ? `${copy.wrong} ${copy.tryAgain}`
                        : state.feedback === "wrong-attempt2"
                          ? copy.wrong
                          : null}
                  </p>
                </>}
            {state.helpOpen
              ? <div
                  aria-label={copy.help}
                  className="g5-l5-slice__help"
                  role="dialog"
                >
                  <p>{copy.helpCopy}</p>
                  <button
                    autoFocus
                    data-slice-action="close-help"
                    onClick={closeHelp}
                    type="button"
                  >{copy.helpClose}</button>
                </div>
              : null}
          </>}
      <AudioBoundary locale={locale} />
    </section>
  </Companion>;

  return <SliceRoot
    behaviorState={state.mode}
    kind="multi-section"
    metadata={metadata}
    props={props}
  >
    <SourceVisual
      behaviorComposite={behaviorComposite}
      candidate={candidate}
      frame={frame}
      props={props}
    />
    {companion}
  </SliceRoot>;
}

function Fq002CalibrationRenderer({
  candidate,
  metadata,
  props,
}: Readonly<{
  candidate: SourceStaticCandidate;
  metadata: G5L5PrivateCandidateMetadata;
  props: AnimationRendererProps;
}>) {
  const [state, dispatch] = useReducer(
    reduceG5L5Fq002,
    props.seed,
    createG5L5Fq002InitialState,
  );
  useEffect(() => {if (props.paused) props.onLessonHostRequest?.({type:"stop-audio"});}, [props.paused, props.onLessonHostRequest]);
  const resultRef = useRef<HTMLDivElement>(null);
  const reviewRef = useRef<HTMLDivElement>(null);
  const reviewFocusPendingRef = useRef(false);
  useEffect(() => {
    reviewFocusPendingRef.current = false;
    dispatch({type: "reset", seed: props.seed});
  }, [props.replay, props.seed]);
  useEffect(() => {
    if (state.mode === "review" && reviewFocusPendingRef.current) {
      reviewFocusPendingRef.current = false;
      reviewRef.current?.focus();
    } else if (state.mode === "result") {
      reviewFocusPendingRef.current = false;
      resultRef.current?.focus();
    }
  }, [state.mode, state.reviewComplete]);
  const startReview = () => {
    reviewFocusPendingRef.current = true;
    dispatch({type: "start-review"});
  };
  const locale = localeFor(props);
  const copy = UI_COPY[locale];
  const capture = hasCaptureIdentity(props);
  const frame = capture ? props.frame : g5L5Fq002FrameForState(state);
  const response = state.responses[state.reviewPosition];
  const correctOption = response
    ? G5_L5_FQ002_CORRECT_OPTIONS[response.questionNumber - 1]
    : undefined;
  const currentQuestion = state.questionOrder[state.questionPosition];
  const behaviorComposite = capture
    ? undefined
    : Object.freeze({
        contractId: G5_L5_FQ002_BEHAVIOR_COMPOSITE_CONTRACT_ID,
        stateId: g5L5Fq002BehaviorCompositeStateForState(state),
      });

  const companion = capture ? null : <Companion
    targetId={props.pageInteractionCompanionTargetId}
  >
    <section
      aria-label={copy.finalQuiz}
      data-behavior-state={state.mode}
      data-g5-l5-fq002-controls="true"
      data-legacy-reporting={state.host.reportingDisposition}
      data-network-request-count={state.host.networkRequestCount}
      data-question-index={state.questionPosition}
      data-random-order-parity="not-established"
      data-randomization-disposition={state.randomizationDisposition}
      data-response-count={state.responses.length}
      data-review-complete={state.reviewComplete ? "true" : "false"}
      data-review-index={state.reviewPosition}
      data-seed={state.seed}
    >
      {state.mode === "question"
        ? <fieldset>
            <legend>
              {copy.finalQuiz}: {state.questionPosition + 1} / {
                G5_L5_FQ002_ADMINISTERED_QUESTION_COUNT
              }. {copy.answerPrompt}
            </legend>
            <div
              className="g5-l5-slice__choice-grid"
              data-source-question-number={currentQuestion}
            >
              {OPTION_LABELS.map((label, index) => <button
                aria-label={`${label}, ${state.questionPosition + 1} / ${
                  G5_L5_FQ002_ADMINISTERED_QUESTION_COUNT
                }`}
                data-choice={index + 1}
                key={label}
                onClick={() => dispatch({
                  type: "answer",
                  choice: (index + 1) as G5L5Fq002Option,
                })}
                type="button"
              >{label}</button>)}
            </div>
          </fieldset>
        : state.mode === "review" && response && correctOption
          ? <div
              aria-live="polite"
              data-review-surface="true"
              ref={reviewRef}
              tabIndex={-1}
            >
              <p>{copy.reviewProgress} {state.reviewPosition + 1} / {
                G5_L5_FQ002_ADMINISTERED_QUESTION_COUNT
              }</p>
              <p data-source-question-number={response.questionNumber}>
                Q{response.questionNumber}
              </p>
              <p>{copy.response}: <strong>{
                OPTION_LABELS[response.choice - 1]
              }</strong></p>
              <p>{copy.sourceCorrect}: <strong>{
                OPTION_LABELS[correctOption - 1]
              }</strong></p>
              <div className="g5-l5-slice__action-row">
                <button
                  data-slice-action="return-result"
                  onClick={() => dispatch({type: "return-to-result"})}
                  type="button"
                >{copy.returnResult}</button>
                <button
                  data-slice-action="next-review"
                  onClick={() => dispatch({type: "next-review"})}
                  type="button"
                >{state.reviewPosition === 9 ? copy.result : copy.nextReview}</button>
              </div>
            </div>
          : <div
              aria-live="polite"
              data-quiz-result="true"
              ref={resultRef}
              tabIndex={-1}
            >
              <h2>{copy.result}</h2>
              <p>{copy.score}: <strong>{state.score} / {
                G5_L5_FQ002_ADMINISTERED_QUESTION_COUNT
              }</strong></p>
              <p lang="en">{state.grade}</p>
              <p data-reporting-boundary="blocked-memory-only">{
                copy.reportBoundary
              }</p>
              {state.reviewComplete
                ? <p>{locale === "es"
                    ? "Se revisaron las 10 respuestas."
                    : "All 10 answers have been reviewed."}</p>
                : null}
              <button
                data-slice-action="start-review"
                onClick={startReview}
                type="button"
              >{copy.review}</button>
            </div>}
      <SourceQuestionAudioControls animationId="course-g05-l05-fq-002" questionNumber={state.mode === "question" ? currentQuestion : null} enabled runtime={{...props,paused:false}} />
    </section>
  </Companion>;

  return <SliceRoot
    behaviorState={state.mode}
    kind="randomized-final-quiz"
    metadata={metadata}
    props={props}
  >
    <SourceVisual
      behaviorComposite={behaviorComposite}
      candidate={candidate}
      frame={frame}
      props={props}
    />
    {companion}
  </SliceRoot>;
}

function SliceRoot({
  behaviorState,
  children,
  kind,
  metadata,
  props,
}: Readonly<{
  behaviorState: string;
  children: React.ReactNode;
  kind: G5L5ProductSlicePageKind;
  metadata: G5L5PrivateCandidateMetadata;
  props: AnimationRendererProps;
}>) {
  const productBehaviorClosure = kind === "final-quiz" ||
      kind === "randomized-final-quiz" ||
      kind === "fixed-choice" || kind === "multi-section"
    ? "state-machine-and-source-script-behavior-composite-current-js-candidate"
    : kind === "linear"
      ? "linear-transport-only-visual-composite-unvalidated"
      : "state-machine-implemented-visual-composite-unvalidated";
  return <section
    className="g5-l5-slice"
    data-audio-acceptance="not-established"
    data-avm1-executed="false"
    data-behavior-parity-established="false"
    data-behavior-state={behaviorState}
    data-calibration-id={metadata.calibrationId}
    data-complexity-lane={metadata.complexityLane}
    data-g5-l5-product-vertical-slice={kind}
    data-natural-trace-validated="false"
    data-product-behavior-closure={productBehaviorClosure}
    data-product-replay-reset="complete-state-reset"
    data-product-scale-decision="no-go-unattended-factory-scale-out"
    data-replay-count={props.replay ?? 0}
    data-source-static-visibility-risk={kind === "linear"
      ? "unvalidated"
      : kind === "final-quiz" || kind === "randomized-final-quiz" ||
          kind === "fixed-choice" || kind === "multi-section"
      ? "source-script-composite-active-original-runtime-unvalidated"
      : "unvalidated"}
    data-source-user-event-pcode-files={metadata.sourceUserEventPcodeFileCount}
    data-strict-acceptance-effect="none"
  >{children}</section>;
}

export function createG5L5ProductVerticalSliceCandidate(
  config: SourceStaticCanvasCandidateConfig,
  metadata: G5L5PrivateCandidateMetadata,
  kind: G5L5ProductSlicePageKind,
) {
  const binding = G5_L5_P4_THREE_PAGE_IDS.has(config.animationId)
    ? getG5L5ThreePageProductCalibrationSourceBinding(config.animationId)
    : getG5L5VerticalSliceSourceBinding(config.animationId);
  if (
    binding.kind !== kind ||
    binding.sourceSwfSha256 !== config.sourceSwfSha256 ||
    binding.sourceFrameDomain !== config.mainFrameDomain ||
    binding.sourceFrameCount !== config.mainFrameCount ||
    binding.userEventPcodeFileCount !== metadata.sourceUserEventPcodeFileCount ||
    binding.behaviorCompositeContractId !==
      config.sourceBehaviorCompositeContractId
  ) {
    throw new Error(
      `${config.animationId} does not match the frozen product-slice source binding`,
    );
  }
  const candidate = createSourceStaticCanvasCandidate({
    ...config,
    showEngineeringDisclosure: false,
  });

  function ProductRenderer(props: AnimationRendererProps) {
    if (kind === "linear") {
      return <LinearRenderer candidate={candidate} metadata={metadata} props={props} />;
    }
    if (kind === "fixed-choice") {
      if (config.animationId === "course-g05-l05-vb-013") {
        return <Vb013CalibrationRenderer
          candidate={candidate}
          metadata={metadata}
          props={props}
        />;
      }
      return <FixedChoiceRenderer candidate={candidate} metadata={metadata} props={props} />;
    }
    if (kind === "multi-section") {
      if (config.animationId === "course-g05-l05-ts-008") {
        return <Ts008CalibrationRenderer
          candidate={candidate}
          metadata={metadata}
          props={props}
        />;
      }
      return <MultiSectionRenderer candidate={candidate} metadata={metadata} props={props} />;
    }
    if (kind === "randomized-final-quiz") {
      return <Fq002CalibrationRenderer
        candidate={candidate}
        metadata={metadata}
        props={props}
      />;
    }
    return <FinalQuizRenderer candidate={candidate} metadata={metadata} props={props} />;
  }

  const module: AnimationModule = Object.freeze({
    ...candidate.module,
    maturity: "private-current-js" as const,
    reducedMotionFrame: binding.initialProductStopFrame,
    playbackEndFrameByDomain: Object.freeze({
      ...candidate.module.playbackEndFrameByDomain,
      [binding.sourceFrameDomain]: binding.initialProductStopFrame,
    }),
    lessonHost: FAIL_CLOSED_LESSON_HOST_DEFAULTS,
    transport: undefined,
    Renderer: ProductRenderer,
  });
  const sourceContract = Object.freeze({
    ...candidate.sourceContract,
    status:
      "source-script-bound-product-behavior-current-javascript-candidate-only",
    sourceControlBehaviorStatus:
      "maintained-javascript-state-machine-pcode-bound-original-runtime-unvalidated",
    replayStatus:
      "product-complete-state-reset-original-runtime-replay-parity-unvalidated",
    productVisualCompositeStatus: kind === "final-quiz" ||
        kind === "randomized-final-quiz"
      ? "source-script-assignment-composite-generated-original-runtime-and-fidelity-unvalidated"
      : kind === "fixed-choice" || kind === "multi-section"
        ? "source-script-behavior-composite-generated-original-runtime-and-fidelity-unvalidated"
        : "not-established",
    audioStatus:
      "fail-closed-cue-ownership-synchronization-and-listening-not-established",
    legacyNetworkReporting: "blocked-memory-only",
    factoryScaleDecision: "no-go-unattended-scale-out",
  });

  return Object.freeze({
    ...candidate,
    module,
    Renderer: ProductRenderer,
    sourceContract,
    privateMetadata: Object.freeze(metadata),
    verticalSliceBinding: binding,
  });
}
