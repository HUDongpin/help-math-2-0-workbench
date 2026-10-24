"use client";

import React, {
  useEffect,
  useReducer,
  useRef,
  useState,
} from "react";
import type {Dispatch, FormEvent, RefObject} from "react";
import {TI005_QUESTION_COPY} from "../modern-lessons/g4-l3-ti005-question";
import {Ti005Introduction} from "../modern-lessons/g4-l3-ti005-introduction";
import {getTi005TextSnapshot} from "../modern-lessons/g4-l3-ti005-text";
import nativeSource from "../modern-lessons/generated/g4-l3-ti005-introduction.json";

import type {AnimationRendererProps} from "../contract";
import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G04_L03_TI_005_STAGE_GEOMETRY,
  createCourseG04L03Ti005InteractionState,
  reduceCourseG04L03Ti005Interaction,
  type CourseG04L03Ti005InteractionAction,
  type CourseG04L03Ti005InteractionState,
} from "../timelines/course-g04-l03-ti-005-pattern-quiz-interaction";
import {
  COURSE_G04_L03_TI_005_CONFIG,
  COURSE_G04_L03_TI_005_SOURCE,
} from "../timelines/course-g04-l03-ti-005";

const candidate = createSourceStaticCanvasCandidate(
  COURSE_G04_L03_TI_005_CONFIG,
);
const SourceStaticRenderer = candidate.Renderer;

const SOURCE_QUIZ_FRAME = 209;
const SOURCE_QUIZ_DOMAIN = "sprite-208";
const SOURCE_QUIZ_SCENARIO = "source-static-frame";
const SOURCE_FONT =
  '"Bauhaus Md BT", "Arial Rounded MT Bold", "Trebuchet MS", ui-rounded, sans-serif';
const CORRECT_STATUS = "Correct. Choose New Problem to continue.";
const RESPONSIVE_CONTROLS_MEDIA =
  "(max-width: 640px), (any-pointer: coarse)";

export const getCourseG04L03Ti005SourceCanvasRenderKey = (
  replay: number,
  interactionSeed: number,
  drawCount: number,
  sourceVisualSeed: number,
): string =>
  `source-question-${replay}-${interactionSeed}-${drawCount}-${sourceVisualSeed}`;
type SourceCanvasStatus =
  | "idle"
  | "loading"
  | "ready"
  | "error"
  | "blocked";

const visuallyHiddenStyle = {
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  height: 1,
  overflow: "hidden",
  position: "absolute",
  whiteSpace: "nowrap",
  width: 1,
} as const;

const transparentSourceButtonStyle = {
  background: "transparent",
  border: 0,
  color: "transparent",
  cursor: "pointer",
  fontSize: 1,
  margin: 0,
  padding: 0,
  pointerEvents: "auto",
  position: "absolute",
} as const;

function isDeterministicEvidenceCapture({
  entryStateSha256,
}: AnimationRendererProps) {
  return Boolean(entryStateSha256);
}

function focusRenderedControl(
  preferred: RefObject<HTMLElement | null>,
  fallback: RefObject<HTMLElement | null>,
) {
  window.requestAnimationFrame(() => {
    const preferredControl = preferred.current;
    const control = preferredControl?.getClientRects().length
      ? preferredControl
      : fallback.current;
    control?.focus();
  });
}

function sourceCanvasStatusMessage(status: SourceCanvasStatus) {
  if (status === "error") {
    return "The source question could not load. Answer controls are unavailable.";
  }
  if (status === "blocked") {
    return "The source question is unavailable in this context.";
  }
  return "Loading the source question before answer controls are enabled…";
}

interface MobileSurfaceProps {
  readonly closeButtonRef: RefObject<HTMLButtonElement | null>;
  readonly canvasStatus: SourceCanvasStatus;
  readonly controlsReady: boolean;
  readonly dispatch: Dispatch<CourseG04L03Ti005InteractionAction>;
  readonly firstInputRef: RefObject<HTMLInputElement | null>;
  readonly interaction: CourseG04L03Ti005InteractionState;
  readonly newProblemButtonRef: RefObject<HTMLButtonElement | null>;
  readonly onCloseFeedback: () => void;
  readonly onNewProblem: () => void;
  readonly placement: "fallback" | "portal";
}

function MobileSurface({
  closeButtonRef,
  canvasStatus,
  controlsReady,
  dispatch,
  firstInputRef,
  interaction,
  newProblemButtonRef,
  onCloseFeedback,
  onNewProblem,
  placement,
}: MobileSurfaceProps) {
  const feedbackId = "course-g04-l03-ti-005-mobile-feedback";
  const submitAnswer = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (controlsReady) dispatch({type: "check"});
  };

  return (
    <form
      aria-label="Complete the number pattern"
      data-ti005-native-question="true"
      data-current-question-index={interaction.currentQuestionIndex}
      data-current-question-draw-count={interaction.drawCount}
      lang="en"
      className={
        "course-g04-l03-ti-005-mobile-controls " +
        "course-g04-l03-ti-005-mobile-controls--" +
        placement
      }
      data-current-js-controls-ready={controlsReady ? "true" : "false"}
      data-source-canvas-status={canvasStatus}
      data-interaction-companion-placement={placement}
      data-interaction-companion-surface="mobile"
      data-interaction-outcome={interaction.outcome}
      onSubmit={submitAnswer}
    >
      <p className="course-g04-l03-ti-005-mobile-question" data-source-text-id="158" data-lesson-text-block="number">
        {TI005_QUESTION_COPY.questionNumber}
      </p>
      <h2 data-source-text-id="159" data-lesson-text-block="instruction">{TI005_QUESTION_COPY.prompt}</h2>
      <p data-source-text-id="172 180"><span data-lesson-text-block="answerInstruction">{nativeSource.texts['172']}</span><span data-lesson-text-block="answerEnding">{nativeSource.texts['180']}</span></p>
      <p className="course-g04-l03-ti-005-mobile-pattern" data-source-text-id="184" data-lesson-text-block="question-pattern">
        <strong>{interaction.currentQuestion.label}</strong>
      </p>
      {!controlsReady ? (
        <p
          aria-live={canvasStatus === "error" ? "assertive" : "polite"}
          className="course-g04-l03-ti-005-mobile-loading"
          role={canvasStatus === "error" ? "alert" : "status"}
        >
          {sourceCanvasStatusMessage(canvasStatus)}
        </p>
      ) : null}
      <div className="course-g04-l03-ti-005-mobile-inputs">
        <label>
          <span>First missing number</span>
          <span className="course-g04-l03-ti-005-answer-cell">
          <input
            aria-describedby={feedbackId}
            aria-label="First missing number"
            autoCapitalize="none"
            autoComplete="off"
            data-ti005-focus-control="first-answer"
            data-lesson-text-block="first-answer"
            disabled={!controlsReady}
            inputMode="text"
            onChange={(event) => dispatch({
              type: "set-input",
              field: "first",
              value: event.currentTarget.value,
            })}
            readOnly={interaction.inputsLocked}
            ref={firstInputRef}
            spellCheck={false}
            type="text"
            value={interaction.answerFirst}
          />
          <span data-lesson-text-block="pattern-separator" aria-hidden="true">{nativeSource.texts['165']}</span>
          </span>
        </label>
        <label>
          <span>Second missing number</span>
          <span className="course-g04-l03-ti-005-answer-cell">
          <input
            aria-describedby={feedbackId}
            aria-label="Second missing number"
            autoCapitalize="none"
            autoComplete="off"
            data-ti005-focus-control="second-answer"
            data-lesson-text-block="second-answer"
            disabled={!controlsReady}
            enterKeyHint="done"
            inputMode="text"
            onChange={(event) => dispatch({
              type: "set-input",
              field: "second",
              value: event.currentTarget.value,
            })}
            readOnly={interaction.inputsLocked}
            spellCheck={false}
            type="text"
            value={interaction.answerSecond}
          />
          <span data-lesson-text-block="pattern-ending">{nativeSource.texts['166']}</span>
          </span>
        </label>
      </div>
      <div className="course-g04-l03-ti-005-mobile-actions">
        <button
          data-ti005-focus-control="check-answer"
          data-lesson-text-block="checkLabel"
          disabled={!controlsReady || !interaction.checkEnabled}
          type="submit"
        >
          Check Answer
        </button>
        <button
          data-ti005-focus-control="new-problem"
          data-lesson-text-block="newProblemLabel"
          disabled={!controlsReady || !interaction.newProblemEnabled}
          onClick={onNewProblem}
          ref={newProblemButtonRef}
          type="button"
        >
          New Problem
        </button>
      </div>
      <p data-source-text-id="182 183"><span data-lesson-text-block="newProblemInstruction">{nativeSource.texts['182']}</span><span data-lesson-text-block="newProblemEnding">{nativeSource.texts['183']}</span></p>
      <span
        aria-live="polite"
        id={feedbackId}
        role="status"
        data-ti005-modern-assistive-label="correct-status"
      >
        {interaction.outcome === "correct" ? CORRECT_STATUS : ""}
      </span>
      {interaction.outcome === "wrong" ? (
        <div
          aria-describedby="course-g04-l03-ti-005-mobile-feedback-copy"
          aria-label="Incorrect answer feedback"
          className="course-g04-l03-ti-005-mobile-dialog"
          role="alertdialog"
        >
          <p id="course-g04-l03-ti-005-mobile-feedback-copy" data-lesson-text-block="wrong-feedback">
            {interaction.feedbackText}
          </p>
          <button
            aria-label="Close feedback and try the same problem again"
            data-ti005-focus-control="close-feedback"
            data-lesson-text-block="close-feedback"
            onClick={onCloseFeedback}
            ref={closeButtonRef}
            type="button"
          >
            Close
          </button>
        </div>
      ) : null}
    </form>
  );
}

interface StageSurfaceProps {
  readonly closeButtonRef: RefObject<HTMLButtonElement | null>;
  readonly canvasStatus: SourceCanvasStatus;
  readonly controlsReady: boolean;
  readonly dispatch: Dispatch<CourseG04L03Ti005InteractionAction>;
  readonly firstInputRef: RefObject<HTMLInputElement | null>;
  readonly interaction: CourseG04L03Ti005InteractionState;
  readonly newProblemButtonRef: RefObject<HTMLButtonElement | null>;
  readonly onCloseFeedback: () => void;
  readonly onNewProblem: () => void;
}

function StageSurface({
  closeButtonRef,
  canvasStatus,
  controlsReady,
  dispatch,
  firstInputRef,
  interaction,
  newProblemButtonRef,
  onCloseFeedback,
  onNewProblem,
}: StageSurfaceProps) {
  const geometry = COURSE_G04_L03_TI_005_STAGE_GEOMETRY;
  const feedbackId = "course-g04-l03-ti-005-stage-feedback";
  const submitAnswer = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (controlsReady) dispatch({type: "check"});
  };

  return (
    <svg
      aria-label="Source-script-bound current JavaScript pattern quiz controls"
      className="course-g04-l03-ti-005-stage-controls"
      data-audio-feedback="inventoried-unimplemented-unaccepted"
      data-behavior-parity-established="false"
      data-current-js-controls-ready={controlsReady ? "true" : "false"}
      data-current-js-functional-candidate="true"
      data-current-question-index={interaction.currentQuestion.index}
      data-interaction-outcome={interaction.outcome}
      data-legacy-actionscript-executed="false"
      data-source-script-bound="true"
      data-source-canvas-status={canvasStatus}
      role="group"
      style={{
        height: "auto",
        inset: 0,
        pointerEvents: "none",
        position: "absolute",
        width: "100%",
        zIndex: 3,
      }}
      viewBox="0 0 800 600"
    >
      <foreignObject height="600" width="800" x="0" y="0">
        <form
          aria-label="Complete the number pattern"
          onSubmit={submitAnswer}
          style={{
            fontFamily: SOURCE_FONT,
            height: 600,
            margin: 0,
            pointerEvents: "none",
            position: "relative",
            width: 800,
          }}
        >
          <span style={visuallyHiddenStyle}>
            Complete the pattern: {interaction.currentQuestion.label}
          </span>
          {!controlsReady ? (
            <span
              aria-live={canvasStatus === "error" ? "assertive" : "polite"}
              role={canvasStatus === "error" ? "alert" : "status"}
              style={visuallyHiddenStyle}
            >
              {sourceCanvasStatusMessage(canvasStatus)}
            </span>
          ) : null}

          <label
            style={{
              height: geometry.answerFirst.height,
              left: geometry.answerFirst.left,
              pointerEvents: "auto",
              position: "absolute",
              top: geometry.answerFirst.top,
              width: geometry.answerFirst.width,
            }}
          >
            <span style={visuallyHiddenStyle}>First missing number</span>
            <input
              aria-describedby={feedbackId}
              aria-label="First missing number"
              autoCapitalize="none"
              autoComplete="off"
              data-ti005-focus-control="first-answer"
              disabled={!controlsReady}
              inputMode="text"
              onChange={(event) => dispatch({
                type: "set-input",
                field: "first",
                value: event.currentTarget.value,
              })}
              readOnly={interaction.inputsLocked}
              ref={firstInputRef}
              spellCheck={false}
              style={{
                background: "transparent",
                border: "1px solid transparent",
                borderRadius: 0,
                boxSizing: "border-box",
                color: "#000",
                fontFamily: SOURCE_FONT,
                fontSize: 25,
                height: "100%",
                lineHeight: 1,
                margin: 0,
                outlineOffset: 2,
                padding: "0 2px",
                pointerEvents: "auto",
                textAlign: "right",
                width: "100%",
              }}
              type="text"
              value={interaction.answerFirst}
            />
          </label>

          <label
            style={{
              height: geometry.answerSecond.height,
              left: geometry.answerSecond.left,
              pointerEvents: "auto",
              position: "absolute",
              top: geometry.answerSecond.top,
              width: geometry.answerSecond.width,
            }}
          >
            <span style={visuallyHiddenStyle}>Second missing number</span>
            <input
              aria-describedby={feedbackId}
              aria-label="Second missing number"
              autoCapitalize="none"
              autoComplete="off"
              data-ti005-focus-control="second-answer"
              disabled={!controlsReady}
              inputMode="text"
              onChange={(event) => dispatch({
                type: "set-input",
                field: "second",
                value: event.currentTarget.value,
              })}
              readOnly={interaction.inputsLocked}
              spellCheck={false}
              style={{
                background: "transparent",
                border: "1px solid transparent",
                borderRadius: 0,
                boxSizing: "border-box",
                color: "#000",
                fontFamily: SOURCE_FONT,
                fontSize: 25,
                height: "100%",
                lineHeight: 1,
                margin: 0,
                outlineOffset: 2,
                padding: "0 2px",
                pointerEvents: "auto",
                textAlign: "right",
                width: "100%",
              }}
              type="text"
              value={interaction.answerSecond}
            />
          </label>

          <button
            aria-label="Check Answer"
            data-ti005-focus-control="check-answer"
            disabled={!controlsReady || !interaction.checkEnabled}
            style={{
              ...transparentSourceButtonStyle,
              height: geometry.checkAnswer.height,
              left: geometry.checkAnswer.left,
              top: geometry.checkAnswer.top,
              width: geometry.checkAnswer.width,
            }}
            type="submit"
          >
            Check Answer
          </button>
          <button
            aria-label="New Problem"
            data-ti005-focus-control="new-problem"
            disabled={!controlsReady || !interaction.newProblemEnabled}
            onClick={onNewProblem}
            ref={newProblemButtonRef}
            style={{
              ...transparentSourceButtonStyle,
              height: geometry.newProblem.height,
              left: geometry.newProblem.left,
              top: geometry.newProblem.top,
              width: geometry.newProblem.width,
            }}
            type="button"
          >
            New Problem
          </button>

          <span
            aria-live="polite"
            id={feedbackId}
            role="status"
            style={visuallyHiddenStyle}
          >
            {interaction.outcome === "correct" ? CORRECT_STATUS : ""}
          </span>

          {interaction.feedbackVisible ? (
            <div
              aria-describedby="course-g04-l03-ti-005-stage-feedback-copy"
              aria-label="Incorrect answer feedback"
              role="alertdialog"
              style={{
                height:
                  geometry.wrongFeedback.top +
                  geometry.wrongFeedback.height -
                  geometry.closeWrong.top,
                left: geometry.wrongFeedback.left,
                pointerEvents: "auto",
                position: "absolute",
                top: geometry.closeWrong.top,
                width: geometry.wrongFeedback.width,
              }}
            >
              <div
                aria-hidden="true"
                style={{
                  background: "#ffffcc",
                  border: "1px solid #6a6231",
                  boxSizing: "border-box",
                  height: geometry.wrongFeedback.height,
                  left: 0,
                  position: "absolute",
                  top: geometry.wrongFeedback.top - geometry.closeWrong.top,
                  width: geometry.wrongFeedback.width,
                }}
              />
              <p
                id="course-g04-l03-ti-005-stage-feedback-copy"
                style={{
                  alignItems: "center",
                  color: "#000",
                  display: "flex",
                  fontFamily: SOURCE_FONT,
                  fontSize: 20,
                  height: geometry.wrongFeedbackText.height,
                  left:
                    geometry.wrongFeedbackText.left -
                    geometry.wrongFeedback.left,
                  lineHeight: 1.15,
                  margin: 0,
                  overflow: "hidden",
                  padding: 0,
                  pointerEvents: "none",
                  position: "absolute",
                  top:
                    geometry.wrongFeedbackText.top -
                    geometry.closeWrong.top,
                  whiteSpace: "pre-wrap",
                  width: geometry.wrongFeedbackText.width,
                }}
              >
                {interaction.feedbackText}
              </p>
              <button
                aria-label="Close feedback and try the same problem again"
                data-ti005-focus-control="close-feedback"
                onClick={onCloseFeedback}
                ref={closeButtonRef}
                style={{
                  background: "#fff",
                  border: "1px solid #929292",
                  borderRadius: 2,
                  color: "#000",
                  cursor: "pointer",
                  fontFamily: SOURCE_FONT,
                  fontSize: 18,
                  height: geometry.closeWrong.height,
                  left: geometry.closeWrong.left - geometry.wrongFeedback.left,
                  lineHeight: 1,
                  margin: 0,
                  padding: 0,
                  pointerEvents: "auto",
                  position: "absolute",
                  top: 0,
                  width: geometry.closeWrong.width,
                }}
                type="button"
              >
                Close
              </button>
            </div>
          ) : null}
        </form>
      </foreignObject>
    </svg>
  );
}

export function CourseG04L03Ti005Renderer(props: AnimationRendererProps) {
  const [interaction, dispatch] = useReducer(
    reduceCourseG04L03Ti005Interaction,
    props.seed,
    createCourseG04L03Ti005InteractionState,
  );
  const [companionTarget, setCompanionTarget] =
    useState<HTMLElement | null>(null);
  const [canvasStatus, setCanvasStatus] =
    useState<SourceCanvasStatus>("idle");
  const rendererRef = useRef<HTMLDivElement>(null);
  const lastFocusedControlRef = useRef<string | null>(null);
  const visualHostRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const newProblemButtonRef = useRef<HTMLButtonElement>(null);
  const mobileFirstInputRef = useRef<HTMLInputElement>(null);
  const mobileCloseButtonRef = useRef<HTMLButtonElement>(null);
  const mobileNewProblemButtonRef = useRef<HTMLButtonElement>(null);
  const pendingFirstInputFocusRef = useRef(false);

  const frameDomain = props.frameDomain ?? SOURCE_QUIZ_DOMAIN;
  const nativeContext = props.frame >= 1 && props.frame <= SOURCE_QUIZ_FRAME
    && frameDomain === SOURCE_QUIZ_DOMAIN
    && props.scenario === SOURCE_QUIZ_SCENARIO && props.lang === "en"
    && !isDeterministicEvidenceCapture(props);
  const nativeSnapshot = nativeContext
    ? getTi005TextSnapshot(props.state, props, interaction) : null;
  const nativeReady = nativeSnapshot?.status === "ready";
  const nativeIntroduction = nativeReady && props.frame < SOURCE_QUIZ_FRAME;
  const interactionEnabled =
    props.frame === SOURCE_QUIZ_FRAME
    && frameDomain === SOURCE_QUIZ_DOMAIN
    && props.scenario === SOURCE_QUIZ_SCENARIO
    && props.lang === "en"
    && !isDeterministicEvidenceCapture(props);
  const sourceVisualSeed = interactionEnabled
    ? interaction.currentQuestionIndex
    : props.seed;
  const sourceCanvasRenderKey = getCourseG04L03Ti005SourceCanvasRenderKey(
    props.replay ?? 0,
    props.seed,
    interaction.drawCount,
    sourceVisualSeed,
  );
  const controlsReady = nativeContext ? nativeReady : canvasStatus === "ready";

  useEffect(() => {
    if (interactionEnabled && !nativeContext) setCanvasStatus("loading");
    dispatch({type: "replay", seed: props.seed});
  }, [interactionEnabled, nativeContext, props.replay, props.seed]);

  useEffect(() => {
    if (!props.pageInteractionCompanionTargetId) {
      setCompanionTarget(null);
      return;
    }
    setCompanionTarget(
      document.getElementById(props.pageInteractionCompanionTargetId),
    );
  }, [props.pageInteractionCompanionTargetId]);

  useEffect(() => {
    const host = visualHostRef.current;
    if (nativeContext) {
      setCanvasStatus(nativeReady ? "ready" : "blocked");
      return;
    }
    if (!host || !interactionEnabled) {
      setCanvasStatus("idle");
      return;
    }
    const update = () => {
      const sourceCandidate = host.querySelector<HTMLElement>(
        '[data-candidate-status="source-static-engineering-not-strict"]' +
        '[data-canvas-status]',
      );
      const nextStatus = sourceCandidate?.dataset.canvasStatus;
      if (
        nextStatus === "idle"
        || nextStatus === "loading"
        || nextStatus === "ready"
        || nextStatus === "error"
        || nextStatus === "blocked"
      ) {
        setCanvasStatus(nextStatus);
      } else {
        setCanvasStatus("idle");
      }
    };
    update();
    const observer = new MutationObserver(update);
    observer.observe(host, {
      attributeFilter: ["data-canvas-status"],
      attributes: true,
      childList: true,
      subtree: true,
    });
    return () => observer.disconnect();
  }, [interactionEnabled, nativeContext, nativeReady]);

  useEffect(() => {
    if (interaction.outcome === "wrong") {
      focusRenderedControl(mobileCloseButtonRef, closeButtonRef);
    } else if (interaction.outcome === "correct") {
      focusRenderedControl(
        mobileNewProblemButtonRef,
        newProblemButtonRef,
      );
    }
  }, [interaction.outcome]);

  useEffect(() => {
    const media = window.matchMedia(RESPONSIVE_CONTROLS_MEDIA);
    const moveFocusToVisibleSurface = () => {
      const root = rendererRef.current;
      if (!root) return;
      const active = document.activeElement;
      const activeWithinInteraction =
        active instanceof HTMLElement
        && (
          root.contains(active)
          || companionTarget?.contains(active) === true
        );
      const focusControl =
        activeWithinInteraction && active instanceof HTMLElement
          ? active.dataset.ti005FocusControl
          : lastFocusedControlRef.current;
      if (!focusControl) return;

      window.requestAnimationFrame(() => {
        const searchRoots = companionTarget
          ? [root, companionTarget]
          : [root];
        const visibleControl = searchRoots
          .flatMap((searchRoot) => Array.from(
            searchRoot.querySelectorAll<HTMLElement>(
              `[data-ti005-focus-control="${focusControl}"]`,
            ),
          ))
          .find((control) =>
          control.getClientRects().length > 0
          && !control.hasAttribute("disabled")
        );
        visibleControl?.focus();
      });
    };

    media.addEventListener("change", moveFocusToVisibleSurface);
    return () => media.removeEventListener("change", moveFocusToVisibleSurface);
  }, [companionTarget]);

  useEffect(() => {
    if (!controlsReady || !pendingFirstInputFocusRef.current) return;
    pendingFirstInputFocusRef.current = false;
    focusRenderedControl(mobileFirstInputRef, firstInputRef);
  }, [controlsReady, interaction.drawCount]);

  const focusFirstInput = () => {
    focusRenderedControl(mobileFirstInputRef, firstInputRef);
  };
  const closeFeedback = () => {
    dispatch({type: "close-feedback"});
    focusFirstInput();
  };
  const newProblem = () => {
    pendingFirstInputFocusRef.current = true;
    if (!nativeContext) setCanvasStatus("loading");
    dispatch({type: "new-problem"});
  };
  const mobileSurface = (
    <MobileSurface
      canvasStatus={canvasStatus}
      closeButtonRef={mobileCloseButtonRef}
      controlsReady={controlsReady}
      dispatch={dispatch}
      firstInputRef={mobileFirstInputRef}
      interaction={interaction}
      newProblemButtonRef={mobileNewProblemButtonRef}
      onCloseFeedback={closeFeedback}
      onNewProblem={newProblem}
      placement="fallback"
    />
  );

  return (
    <div
      data-behavior-parity-established="false"
      data-ti005-native-surface={nativeContext ? "true" : undefined}
      data-modern-text-page={nativeReady ? "course-g04-l03-ti-005" : undefined}
      data-ti005-text-status={nativeSnapshot?.status}
      data-current-js-controls-enabled={interactionEnabled ? "true" : "false"}
      data-current-js-functional-scope="ti005-pattern-quiz-source-script-bound"
      data-current-js-source-visual-seed={sourceVisualSeed}
      data-owner-accepted="false"
      data-strict-acceptance-effect="none"
      onBlurCapture={(event) => {
        const nextTarget = event.relatedTarget;
        if (
          nextTarget instanceof Node
          && !rendererRef.current?.contains(nextTarget)
          && !companionTarget?.contains(nextTarget)
        ) {
          lastFocusedControlRef.current = null;
        }
      }}
      onFocusCapture={(event) => {
        lastFocusedControlRef.current =
          event.target instanceof HTMLElement
            ? event.target.dataset.ti005FocusControl ?? null
            : null;
      }}
      ref={rendererRef}
      style={{
        margin: "0 auto",
        maxWidth: 800,
        position: "relative",
        width: "100%",
      }}
    >
      <style>{`
        [data-ti005-native-surface="true"] {
          --lesson-font-body: 'HELP Math Nunito Sans', 'Avenir Next', Avenir, 'Segoe UI', system-ui, sans-serif;
          --ti005-prose-size:1.125rem;
        }
        @media (min-width:768px) {[data-ti005-native-surface="true"] {--ti005-prose-size:1.25rem}}
        .course-g04-l03-ti-005-mobile-fallback-slot,
        .course-g04-l03-ti-005-mobile-controls {
          display: none;
        }

        .course-g04-l03-ti-005-stage-controls
        :is(input, button):focus-visible {
          outline: 4px solid #ffdd29;
          outline-offset: 3px;
        }

         .lesson-shell2 .lesson-shell2__legacy-stage:has([data-ti005-native-surface="true"]),
        .lesson-shell2 .lesson-shell2__legacy-stage:has([data-ti005-native-surface="true"]) > .lesson-shell2__stage,
        .lesson-shell2 .runtime-shell:has([data-ti005-native-surface="true"]),
        .lesson-shell2 .runtime-stage:has([data-ti005-native-surface="true"]) {
          height:auto;min-height:0;max-height:none;aspect-ratio:auto;overflow:visible;position:relative;
        }
        .lesson-shell2 .lesson-shell2__legacy-stage:has([data-ti005-native-surface="true"]) > .lesson-shell2__source-background-text {display:none}
        .lesson-shell2[data-host-presentation="modern-wide"] .lesson-shell2__legacy-stage:has([data-ti005-native-surface="true"]) .runtime-shell:has([data-ti005-native-surface="true"]) {top:auto}
        @media all {
          .course-g04-l03-ti-005-stage-controls {
            display: none;
          }

          .course-g04-l03-ti-005-mobile-fallback-slot {
            display: block;
            position: relative;
            width: 100%;
          }

          .course-g04-l03-ti-005-mobile-controls {
            --lesson-font-body: 'HELP Math Nunito Sans', 'Avenir Next', Avenir, 'Segoe UI', system-ui, sans-serif;
            background: #e9f7ff;
            border: 2px solid #224b8e;
            border-radius: 12px;
            box-sizing: border-box;
            color: #111;
            display: grid;
            font-family: var(--lesson-font-body, system-ui, sans-serif);
            gap: 10px;
            padding: 12px;
          }

          .course-g04-l03-ti-005-mobile-controls--fallback {
            position: relative;
            width: 100%;
            min-width: 0;
            font-size: var(--ti005-prose-size,1.25rem);
            line-height: 1.6;
          }
          .course-g04-l03-ti-005-mobile-controls p {margin:0;overflow-wrap:anywhere}
          .course-g04-l03-ti-005-mobile-controls h2 {margin:0;font-size:1.375rem}
          .course-g04-l03-ti-005-mobile-pattern {font-size:1.5rem;font-variant-numeric:tabular-nums}
          .course-g04-l03-ti-005-mobile-controls--portal {
            margin: 12px 0;
            max-width: 100%;
            pointer-events: auto;
            position: relative;
            width: 100%;
          }

          .course-g04-l03-ti-005-mobile-question,
          .course-g04-l03-ti-005-mobile-loading {
            font-size: 1.125rem;
            line-height: 1.25;
            margin: 0;
            text-align: center;
          }

          .course-g04-l03-ti-005-mobile-loading {
            font-family: inherit;
            font-size: inherit;
            line-height: 1.6;
          }

          .course-g04-l03-ti-005-mobile-inputs,
          .course-g04-l03-ti-005-mobile-actions {
            display: grid;
            gap: 9px;
            grid-template-columns: repeat(auto-fit, minmax(min(100%, 11rem), 1fr));
          }

          .course-g04-l03-ti-005-mobile-inputs label {
            display: grid;
            gap: 4px;
            min-width: 0;
          }

          .course-g04-l03-ti-005-mobile-inputs label > span {
            font-family: inherit;
            font-size: 1.125rem;
            font-weight: 700;
            line-height: 1.15;
          }

          .course-g04-l03-ti-005-mobile-inputs input {
            background: #fff;
            border: 2px solid #224b8e;
            border-radius: 8px;
            box-sizing: border-box;
            color: #000;
            font: 800 1.25rem var(--lesson-font-body, sans-serif);
            min-height: 48px;
            padding: 6px 8px;
            text-align: center;
            width: 100%;
            min-width: 0;
          }
          .course-g04-l03-ti-005-answer-cell {display:flex;align-items:center;gap:.35rem}
          .course-g04-l03-ti-005-answer-cell > span {white-space:nowrap;font-size:1.25rem}

          .course-g04-l03-ti-005-mobile-controls button {
            background: linear-gradient(#fff06a, #42c9d0);
            border: 2px solid #224b8e;
            border-radius: 999px;
            box-sizing: border-box;
            color: #111;
            cursor: pointer;
            font: 800 1.125rem var(--lesson-font-body, sans-serif);
            min-height: 48px;
            min-width: 48px;
            padding: 7px 10px;
          }

          .course-g04-l03-ti-005-mobile-controls
          :is(input, button):focus-visible {
            box-shadow: 0 0 0 3px #fff200;
            outline: 3px solid #001d6d;
            outline-offset: 2px;
          }

          .course-g04-l03-ti-005-mobile-controls
          :is(input, button):disabled {
            cursor: default;
            opacity: .58;
          }

          .course-g04-l03-ti-005-mobile-dialog {
            align-content: center;
            background: #ffffcc;
            border: 3px solid #224b8e;
            border-radius: 10px;
            box-shadow: 0 8px 22px rgb(0 0 0 / 28%);
            display: grid;
            gap: 8px;
            padding: 12px;
            position: relative;
            text-align: center;
            z-index: 2;
          }

          .course-g04-l03-ti-005-mobile-dialog p {
            font-family: inherit;
            font-size: inherit;
            line-height: 1.6;
            margin: 0;
            white-space: pre-wrap;
          }
        }

        @media (max-width: 640px) {
          .course-g04-l03-ti-005-mobile-controls--fallback {font-size:1.125rem}
        }

        @media (min-width: 1280px) and (any-pointer: coarse) {
          .course-g04-l03-ti-005-mobile-controls--portal {
            grid-column: 1 / -1;
            grid-row: 7;
          }
        }
      `}</style>
      {nativeContext ? null : <div
        aria-hidden={interactionEnabled ? true : undefined}
        ref={visualHostRef}
        style={interactionEnabled && controlsReady ? {height: 0, overflow: "hidden"} : undefined}
      >
        <SourceStaticRenderer
          key={sourceCanvasRenderKey}
          {...props}
          seed={sourceVisualSeed}
        />
      </div>}
      {nativeContext && !nativeReady ? <p role="alert">The source-bound teaching content is unavailable.</p> : null}
      {nativeIntroduction ? <Ti005Introduction frame={props.frame} /> : null}
      {interactionEnabled && controlsReady ? (
        <>
          {nativeContext ? null : <StageSurface
            canvasStatus={canvasStatus}
            closeButtonRef={closeButtonRef}
            controlsReady={controlsReady}
            dispatch={dispatch}
            firstInputRef={firstInputRef}
            interaction={interaction}
            newProblemButtonRef={newProblemButtonRef}
            onCloseFeedback={closeFeedback}
            onNewProblem={newProblem}
          />}
          <div className="course-g04-l03-ti-005-mobile-fallback-slot">
            {mobileSurface}
          </div>
        </>
      ) : null}
    </div>
  );
}

export {COURSE_G04_L03_TI_005_SOURCE};
export const COURSE_G04_L03_TI_005_MOVIE = candidate.movie;
export const COURSE_G04_L03_TI_005_RUNTIME = candidate.runtime;
export const COURSE_G04_L03_TI_005_SOURCE_CONTRACT = Object.freeze({
  ...candidate.sourceContract,
  currentJavascriptInteractionStatus:
    "source-script-bound-functional-candidate",
  currentJavascriptInteractionScope: Object.freeze([
    "two-exact-string-inputs",
    "check-answer",
    "wrong-feedback-and-close-retry",
    "new-problem-without-replacement",
    "source-drawing-question-redraw-by-current-js-question-index",
    "whole-renderer-replay-reset",
    "reduced-motion-interactive-stop",
    "responsive-native-question-for-desktop-and-narrow-layouts",
    "source-bound-native-introduction-and-question",
    "interactive-canvas-accessibility-isolation",
    "answer-controls-fail-closed-until-source-snapshot-ready",
  ]),
  sourceQuestionOrderStatus:
    "seeded-current-js-without-replacement-not-avm1-random-trace",
  sourceLocalPatternQuizContractHashChainStatus:
    "stale-source-audit-binding-not-strict",
  legacyCoachAudioStatus: "inventoried-unimplemented-unaccepted",
  associatedAudioStatus: "inventoried-unimplemented-unaccepted",
  sourceDeviceFontRuntimeStatus:
    "source-drawing-subsets-used-device-font-runtime-unestablished",
  sourceHostHyperlinkStatus: "unimplemented-safe-disabled",
  behaviorParityEstablished: false,
  replayParityEstablished: false,
  strictAcceptanceEffect: "none",
});
export const COURSE_G04_L03_TI_005_SCENARIOS = candidate.scenarios;
export const normalizeCourseG04L03Ti005Frame = candidate.normalizeFrame;
export const getCourseG04L03Ti005FrameState = candidate.getFrameState;
export const buildCourseG04L03Ti005CaptureAttributes =
  candidate.buildCaptureAttributes;

export default Object.freeze({
  ...candidate.module,
  reducedMotionFrame: SOURCE_QUIZ_FRAME,
  Renderer: CourseG04L03Ti005Renderer,
});
