"use client";

import React, {
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import type {Dispatch, FormEvent, RefObject} from "react";
import {createPortal} from "react-dom";

import type {AnimationRendererProps} from "../contract";
import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  isSourceStaticParentCompositeCaptureRequest,
  SourceStaticParentCompositeCapture,
} from "../source-static-parent-composite-capture";
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
  COURSE_G04_L03_TI_005_SPRITE_179_CAPTURE,
} from "../timelines/course-g04-l03-ti-005";

const candidate = createSourceStaticCanvasCandidate(
  COURSE_G04_L03_TI_005_CONFIG,
);
const SourceStaticRenderer = candidate.Renderer;

const SOURCE_QUIZ_FRAME = 209;
const SOURCE_QUIZ_DOMAIN = "sprite-208";
const SOURCE_QUIZ_SCENARIO = "source-static-frame";
const SOURCE_STATIC_REACHABLE_SCENARIO = "source-static-reachable-domain";
const SOURCE_FONT =
  '"Bauhaus Md BT", "Arial Rounded MT Bold", "Trebuchet MS", ui-rounded, sans-serif';
const CORRECT_STATUS = "Correct! Choose New Problem for more practice, or Next to continue.";
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

type Ti005FrameContext = Parameters<typeof candidate.getFrameState>[1];

export function getCourseG04L03Ti005FrameState(
  frame: number,
  context: Ti005FrameContext,
) {
  const base = candidate.getFrameState(frame, context);
  if (!isSourceStaticParentCompositeCaptureRequest({
    entryStateSha256: context.entryStateSha256,
    frame,
    frameDomain: context.frameDomain,
    lang: context.lang,
    requirementId: context.requirementId,
    scenario: context.scenario,
    traceId: context.traceId,
  }, COURSE_G04_L03_TI_005_SPRITE_179_CAPTURE)) return base;
  return Object.freeze({
    ...base,
    blocker: null,
    exportFrame: null,
    frame,
    frameDomain: COURSE_G04_L03_TI_005_SPRITE_179_CAPTURE.frameDomain,
    language: COURSE_G04_L03_TI_005_SPRITE_179_CAPTURE.language,
    rootFrame: COURSE_G04_L03_TI_005_SPRITE_179_CAPTURE.rootEntryFrame,
    scenario: COURSE_G04_L03_TI_005_SPRITE_179_CAPTURE.scenario,
    sourceStaticVisualReady: true,
    status: "ready" as const,
    visibleSourceMarkers: Object.freeze([
      `sprite-179-source-parent-composite-frame-${
        COURSE_G04_L03_TI_005_SPRITE_179_CAPTURE.sourceParentFirstFrame + frame - 1
      }`,
    ]),
  });
}

function Sprite179EvidenceRenderer(props: AnimationRendererProps) {
  const sourceParentFrame =
    COURSE_G04_L03_TI_005_SPRITE_179_CAPTURE.sourceParentFirstFrame
    + props.frame - 1;
  const sourceState = useMemo(() => candidate.getFrameState(
    sourceParentFrame,
    {
      frameDomain: COURSE_G04_L03_TI_005_SPRITE_179_CAPTURE.sourceParentFrameDomain,
      scenario: SOURCE_QUIZ_SCENARIO,
      lang: "en",
      seed: props.seed,
    },
  ), [props.seed, sourceParentFrame]);
  return (
    <SourceStaticParentCompositeCapture
      mapping={COURSE_G04_L03_TI_005_SPRITE_179_CAPTURE}
      props={props}
      sourceState={sourceState}
      SourceRenderer={SourceStaticRenderer}
    />
  );
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

function handleFeedbackKeys(event: React.KeyboardEvent<HTMLDivElement>, close: () => void) {
  if (event.key === "Escape") {
    event.preventDefault(); event.stopPropagation(); close();
  } else if (event.key === "Tab") {
    const closeButton = event.currentTarget.querySelector<HTMLButtonElement>("button:not(:disabled)");
    if (closeButton) { event.preventDefault(); closeButton.focus(); }
  }
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
      aria-label="Mobile controls for completing the number pattern"
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
      <p className="course-g04-l03-ti-005-mobile-question">
        Complete the pattern:{" "}
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
            type="text"
            value={interaction.answerFirst}
          />
        </label>
        <label>
          <span>Second missing number</span>
          <input
            aria-describedby={feedbackId}
            aria-label="Second missing number"
            autoCapitalize="none"
            autoComplete="off"
            data-ti005-focus-control="second-answer"
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
        </label>
      </div>
      <div className="course-g04-l03-ti-005-mobile-actions">
        <button
          data-ti005-focus-control="check-answer"
          disabled={!controlsReady || !interaction.checkEnabled}
          type="submit"
        >
          Check Answer
        </button>
        <button
          data-ti005-focus-control="new-problem"
          disabled={!controlsReady || !interaction.newProblemEnabled}
          onClick={onNewProblem}
          ref={newProblemButtonRef}
          type="button"
        >
          New Problem
        </button>
      </div>
      <p aria-live="polite" id={feedbackId} role="status"
        className="course-g04-l03-ti-005-success"
        style={interaction.outcome === "correct" ? undefined : visuallyHiddenStyle}>
        {interaction.outcome === "correct" ? CORRECT_STATUS : ""}
      </p>
      {interaction.outcome === "wrong" ? (
        <div
          aria-describedby="course-g04-l03-ti-005-mobile-feedback-copy"
          aria-label="Incorrect answer feedback"
          aria-modal="true"
          onKeyDown={(event) => handleFeedbackKeys(event, onCloseFeedback)}
          className="course-g04-l03-ti-005-mobile-dialog"
          role="alertdialog"
        >
          <p id="course-g04-l03-ti-005-mobile-feedback-copy">
            {interaction.feedbackText}
          </p>
          <button
            aria-label="Close feedback and try the same problem again"
            data-ti005-focus-control="close-feedback"
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
      aria-label="Complete the number pattern"
      className="course-g04-l03-ti-005-stage-controls"
      data-audio-feedback="inventoried-unimplemented-unaccepted"
      data-behavior-parity-established="false"
      data-current-js-controls-ready={controlsReady ? "true" : "false"}
      data-current-js-functional-candidate="true"
      data-current-question-index={interaction.currentQuestion.index}
      data-pattern-question={interaction.currentQuestion.label}
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

          <span aria-hidden="true" style={{background: "#b8d8f7", height: 54,
            left: 160, position: "absolute", top: 276, width: 440}} />
          <span aria-hidden="true" data-visible-pattern={interaction.currentQuestion.label}
            style={{alignItems: "center", display: "flex", fontSize: 24, height: 48,
              justifyContent: "flex-end", left: 166, lineHeight: 1, position: "absolute",
              top: 278.725, whiteSpace: "nowrap", width: 244}}>{interaction.currentQuestion.label}</span>
          <span aria-hidden="true" style={{fontSize: 25, left: 474,
            lineHeight: 1, position: "absolute", top: 292}}>,</span>
          <span aria-hidden="true" style={{fontSize: 25, left: 535,
            lineHeight: 1, position: "absolute", top: 292}}>, …</span>

          <label
            style={{
              height: 48,
              left: geometry.answerFirst.left + geometry.answerFirst.width / 2 - 14,
              pointerEvents: "auto",
              position: "absolute",
              top: geometry.answerFirst.top + geometry.answerFirst.height / 2 - 24,
              width: 48,
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
                background: "#fff",
                border: "2px solid #224b8e",
                borderRadius: 6,
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
              height: 48,
              left: geometry.answerSecond.left + geometry.answerSecond.width / 2 - 4,
              pointerEvents: "auto",
              position: "absolute",
              top: geometry.answerSecond.top + geometry.answerSecond.height / 2 - 24,
              width: 48,
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
                background: "#fff",
                border: "2px solid #224b8e",
                borderRadius: 6,
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
              background: "linear-gradient(#fff6bd, #ffe080)",
              border: "2px solid #846518", borderRadius: 10,
              color: "#153b6a", font: `700 19px ${SOURCE_FONT}`,
              height: 48,
              left: geometry.checkAnswer.left + geometry.checkAnswer.width / 2 - 85,
              top: geometry.checkAnswer.top + geometry.checkAnswer.height / 2 - 24,
              width: 170,
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
              background: "linear-gradient(#fff6bd, #ffe080)",
              border: "2px solid #846518", borderRadius: 10,
              color: "#153b6a", font: `700 19px ${SOURCE_FONT}`,
              height: 48,
              left: geometry.newProblem.left + geometry.newProblem.width / 2 - 85,
              top: geometry.newProblem.top + geometry.newProblem.height / 2 - 24,
              width: 170,
            }}
            type="button"
          >
            New Problem
          </button>

          <span
            id={feedbackId}
            style={visuallyHiddenStyle}
          >
            {interaction.outcome === "correct" ? CORRECT_STATUS : ""}
          </span>

          {interaction.feedbackVisible ? (
            <div aria-describedby="course-g04-l03-ti-005-stage-feedback-copy"
              aria-label="Incorrect answer feedback" aria-modal="true" role="alertdialog"
              onKeyDown={(event) => handleFeedbackKeys(event, onCloseFeedback)}
              style={{background: "#ffffcc", border: "2px solid #8a731d", borderRadius: 12,
                boxSizing: "border-box", color: "#111", display: "grid", alignItems: "center",
                gridTemplateColumns: "1fr 100px", gap: 12, padding: 12,
                left: geometry.wrongFeedback.left, top: 160, width: geometry.wrongFeedback.width,
                minHeight: 108, pointerEvents: "auto", position: "absolute"}}>
              <p id="course-g04-l03-ti-005-stage-feedback-copy"
                style={{font: `20px/1.3 ${SOURCE_FONT}`, margin: 0, whiteSpace: "pre-wrap"}}>{interaction.feedbackText}</p>
              <button aria-label="Close feedback and try the same problem again" data-ti005-focus-control="close-feedback"
                onClick={onCloseFeedback} ref={closeButtonRef} type="button"
                style={{background: "#fff", border: "2px solid #224b8e", borderRadius: 8,
                  color: "#153b6a", font: `700 18px ${SOURCE_FONT}`, height: 48}}>Close</button>
            </div>
          ) : null}
        </form>
      </foreignObject>
    </svg>
  );
}

function MainRenderer(props: AnimationRendererProps) {
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
  const sourceVisualState = useMemo(() => interactionEnabled
    ? candidate.getFrameState(SOURCE_QUIZ_FRAME, {
        entryStateSha256: props.entryStateSha256,
        frameDomain,
        lang: props.lang,
        requirementId: props.requirementId,
        scenario: props.scenario,
        seed: sourceVisualSeed,
        traceId: props.traceId,
      })
    : props.state,
  [interactionEnabled, frameDomain, props.entryStateSha256, props.lang,
    props.requirementId, props.scenario, props.state, props.traceId, sourceVisualSeed]);
  const controlsReady = interactionEnabled && canvasStatus === "ready";

  useEffect(() => {
    if (interactionEnabled) setCanvasStatus("loading");
    dispatch({type: "replay", seed: props.seed});
  }, [interactionEnabled, props.replay, props.seed]);

  useEffect(() => {
    if (interactionEnabled && interaction.outcome === "correct") props.onActivityComplete?.();
  }, [interactionEnabled, interaction.outcome, props.onActivityComplete]);

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
  }, [interactionEnabled]);

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
  }, [controlsReady]);

  const focusFirstInput = () => {
    focusRenderedControl(mobileFirstInputRef, firstInputRef);
  };
  const closeFeedback = () => {
    dispatch({type: "close-feedback"});
    focusFirstInput();
  };
  const newProblem = () => {
    pendingFirstInputFocusRef.current = true;
    setCanvasStatus("loading");
    dispatch({type: "new-problem"});
  };
  const desktopSuccess = interaction.outcome === "correct" ? (
    <p className="course-g04-l03-ti-005-success course-g04-l03-ti-005-desktop-success" role="status">{CORRECT_STATUS}</p>
  ) : null;
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
      placement={companionTarget ? "portal" : "fallback"}
    />
  );

  return (
    <div
      data-behavior-parity-established="false"
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
        .course-g04-l03-ti-005-mobile-answers,
        .course-g04-l03-ti-005-mobile-fallback-slot,
        .course-g04-l03-ti-005-mobile-controls {
          display: none;
        }

        .course-g04-l03-ti-005-stage-controls
        :is(input, button):focus-visible {
          outline: 4px solid #ffdd29;
          outline-offset: 3px;
        }

        .course-g04-l03-ti-005-success {
          background: #e4f5df; border: 2px solid #28743b; border-radius: 12px;
          color: #17572a; font: 700 17px/1.4 system-ui, sans-serif; padding: 12px; margin: 10px 0;
        }
        @media ${RESPONSIVE_CONTROLS_MEDIA} {
          .course-g04-l03-ti-005-mobile-answers { display: block; }
          .course-g04-l03-ti-005-desktop-success { display: none; }
          .course-g04-l03-ti-005-stage-controls {
            display: none;
          }

          .course-g04-l03-ti-005-mobile-fallback-slot {
            aspect-ratio: 4 / 3;
            display: block;
            inset: 0 0 auto;
            pointer-events: none;
            position: absolute;
            width: 100%;
            z-index: 4;
          }

          .course-g04-l03-ti-005-mobile-controls {
            background: #e9f7ff;
            border: 2px solid #224b8e;
            border-radius: 12px;
            box-sizing: border-box;
            color: #111;
            display: grid;
            font-family: "Bauhaus Md BT", "Arial Rounded MT Bold",
              "Trebuchet MS", ui-rounded, sans-serif;
            gap: 10px;
            padding: 12px;
          }

          .course-g04-l03-ti-005-mobile-controls--fallback {
            left: 4%;
            max-height: 78%;
            overflow: auto;
            pointer-events: auto;
            position: absolute;
            right: 4%;
            top: 13%;
          }

          .course-g04-l03-ti-005-mobile-controls--portal {
            margin: 12px 0;
            max-width: 100%;
            pointer-events: auto;
            position: relative;
            width: 100%;
          }

          .course-g04-l03-ti-005-mobile-question,
          .course-g04-l03-ti-005-mobile-loading {
            font-size: 16px;
            line-height: 1.25;
            margin: 0;
            text-align: center;
          }

          .course-g04-l03-ti-005-mobile-loading {
            font-family: system-ui, sans-serif;
            font-size: 14px;
          }

          .course-g04-l03-ti-005-mobile-inputs,
          .course-g04-l03-ti-005-mobile-actions {
            display: grid;
            gap: 9px;
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .course-g04-l03-ti-005-mobile-inputs label {
            display: grid;
            gap: 4px;
            min-width: 0;
          }

          .course-g04-l03-ti-005-mobile-inputs label > span {
            font-family: system-ui, sans-serif;
            font-size: 13px;
            font-weight: 700;
            line-height: 1.15;
          }

          .course-g04-l03-ti-005-mobile-inputs input {
            background: #fff;
            border: 2px solid #224b8e;
            border-radius: 8px;
            box-sizing: border-box;
            color: #000;
            font: 800 20px "Arial Rounded MT Bold", "Trebuchet MS",
              ui-rounded, sans-serif;
            min-height: 48px;
            padding: 6px 8px;
            text-align: center;
            width: 100%;
          }

          .course-g04-l03-ti-005-mobile-controls button {
            background: linear-gradient(#fff06a, #42c9d0);
            border: 2px solid #224b8e;
            border-radius: 999px;
            box-sizing: border-box;
            color: #111;
            cursor: pointer;
            font: 800 16px "Arial Rounded MT Bold", "Trebuchet MS",
              ui-rounded, sans-serif;
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
            inset: 6px;
            padding: 12px;
            position: absolute;
            text-align: center;
            z-index: 2;
          }

          .course-g04-l03-ti-005-mobile-dialog p {
            font-family: system-ui, sans-serif;
            font-size: 16px;
            line-height: 1.3;
            margin: 0;
            white-space: pre-wrap;
          }
        }

        @media (min-width: 1280px) and (any-pointer: coarse) {
          .course-g04-l03-ti-005-mobile-controls--portal {
            grid-column: 1 / -1;
            grid-row: 7;
          }
        }
      `}</style>
      <div
        aria-hidden={interactionEnabled ? true : undefined}
        inert={interactionEnabled ? true : undefined}
        data-source-canvas-accessibility-isolated={interactionEnabled ? "true" : "false"}
        style={{pointerEvents: interactionEnabled ? "none" : undefined}}
        ref={visualHostRef}
      >
        <SourceStaticRenderer
          key={sourceCanvasRenderKey}
          {...props}
          seed={sourceVisualSeed}
          state={sourceVisualState}
        />
      </div>
      {interactionEnabled ? (
        <>
          {controlsReady && interaction.outcome === "correct" ? (
            <svg className="course-g04-l03-ti-005-mobile-answers" aria-hidden="true" viewBox="0 0 800 600"
              data-ti005-answer-preview-index={interaction.currentQuestionIndex}
              style={{height: "auto", inset: 0, pointerEvents: "none", position: "absolute", width: "100%", zIndex: 2}}>
              {[{bounds: COURSE_G04_L03_TI_005_STAGE_GEOMETRY.answerFirst, value: interaction.answerFirst},
                {bounds: COURSE_G04_L03_TI_005_STAGE_GEOMETRY.answerSecond, value: interaction.answerSecond}].map(({bounds, value}, index) => (
                <text key={index} x={bounds.left + bounds.width - 3} y={bounds.top + 25}
                  textAnchor="end" fontFamily={SOURCE_FONT} fontSize="24" fill="#111">{value}</text>
              ))}
            </svg>
          ) : null}
          <StageSurface
            canvasStatus={canvasStatus}
            closeButtonRef={closeButtonRef}
            controlsReady={controlsReady}
            dispatch={dispatch}
            firstInputRef={firstInputRef}
            interaction={interaction}
            newProblemButtonRef={newProblemButtonRef}
            onCloseFeedback={closeFeedback}
            onNewProblem={newProblem}
          />
          {companionTarget ? createPortal(desktopSuccess, companionTarget) : desktopSuccess}
          {companionTarget
            ? createPortal(mobileSurface, companionTarget)
            : (
                <div className="course-g04-l03-ti-005-mobile-fallback-slot">
                  {mobileSurface}
                </div>
              )}
        </>
      ) : null}
    </div>
  );
}

function Renderer(props: AnimationRendererProps) {
  return isSourceStaticParentCompositeCaptureRequest(
    props,
    COURSE_G04_L03_TI_005_SPRITE_179_CAPTURE,
  )
    ? <Sprite179EvidenceRenderer {...props} />
    : <MainRenderer {...props} />;
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
    "source-frame-state-and-canvas-seed-match-current-question",
    "activity-completes-after-one-correct-pair-optional-new-problem-preserves-page-progress",
    "visible-correct-feedback-and-mobile-answer-preview",
    "wrong-feedback-escape-close-and-tab-containment",
    "whole-renderer-replay-reset",
    "reduced-motion-interactive-stop",
    "responsive-mobile-and-coarse-pointer-touch-control-surface",
    "page-interaction-companion-portal-with-stage-fallback",
    "interactive-canvas-accessibility-isolation",
    "answer-controls-fail-closed-until-source-canvas-ready",
    "sprite-179-frames-1-5-source-static-parent-composite-frames-75-79-diagnostic",
  ]),
  sourceQuestionOrderStatus:
    "seeded-current-js-without-replacement-not-avm1-random-trace",
  sourceLocalPatternQuizContractHashChainStatus:
    "stale-source-audit-binding-not-strict",
  legacyCoachAudioStatus: "inventoried-unimplemented-unaccepted",
  associatedAudioStatus: "inventoried-unimplemented-unaccepted",
  sprite179CaptureStatus:
    "source-static-parent-composite-frame-diagnostic-not-original-runtime-or-fidelity",
  sprite179EmbeddedSoundStatus: "source-sound-stream-not-rendered-or-accepted",
  sprite179PlacementPathAudit: Object.freeze({
    path: COURSE_G04_L03_TI_005_SPRITE_179_CAPTURE.placementPathAudit,
    sha256:
      COURSE_G04_L03_TI_005_SPRITE_179_CAPTURE.placementPathAuditSha256,
  }),
  sourceDeviceFontRuntimeStatus:
    "source-drawing-subsets-used-device-font-runtime-unestablished",
  sourceHostHyperlinkStatus: "unimplemented-safe-disabled",
  behaviorParityEstablished: false,
  replayParityEstablished: false,
  strictAcceptanceEffect: "none",
});
export const COURSE_G04_L03_TI_005_SCENARIOS = Object.freeze([
  ...candidate.scenarios,
  Object.freeze({
    id: SOURCE_STATIC_REACHABLE_SCENARIO,
    label: "Source-static reachable companion diagnostic",
    description:
      "English-only source-parent composite inspection with source sound disabled; not original runtime or fidelity acceptance.",
  }),
]);
export const normalizeCourseG04L03Ti005Frame = candidate.normalizeFrame;
export const buildCourseG04L03Ti005CaptureAttributes =
  candidate.buildCaptureAttributes;

export default Object.freeze({
  ...candidate.module,
  completionMode: "activity" as const,
  defaultScenarioByFrameDomain: Object.freeze({
    ...candidate.module.defaultScenarioByFrameDomain,
    [COURSE_G04_L03_TI_005_SPRITE_179_CAPTURE.frameDomain]:
      SOURCE_STATIC_REACHABLE_SCENARIO,
  }),
  scenarios: COURSE_G04_L03_TI_005_SCENARIOS,
  getFrameState: getCourseG04L03Ti005FrameState,
  reducedMotionFrame: SOURCE_QUIZ_FRAME,
  Renderer,
});
