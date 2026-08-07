"use client";

import React, {useEffect, useReducer, useRef, useState} from "react";
import type {Dispatch, FormEvent, RefObject} from "react";
import {createPortal} from "react-dom";

import type {AnimationRendererProps} from "../contract";
import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G04_L03_IN_008_QUESTIONS,
  createCourseG04L03In008InteractionState,
  reduceCourseG04L03In008Interaction,
  type CourseG04L03In008InteractionAction,
  type CourseG04L03In008InteractionState,
} from "../timelines/course-g04-l03-in-008-interaction";
import {
  COURSE_G04_L03_IN_008_CONFIG,
  COURSE_G04_L03_IN_008_SOURCE,
} from "../timelines/course-g04-l03-in-008";

const candidate = createSourceStaticCanvasCandidate(
  COURSE_G04_L03_IN_008_CONFIG,
);
const SourceStaticRenderer = candidate.Renderer;

const SOURCE_QUIZ_FRAME = 216;
const SOURCE_QUIZ_DOMAIN = "sprite-57";
const SOURCE_QUIZ_SCENARIO = "source-static-frame";
const SOURCE_STAGE_BACKGROUND = "#b8d8f7";
const SOURCE_FONT =
  '"Arial Rounded MT Bold", "Trebuchet MS", ui-rounded, sans-serif';
const CORRECT_STATUS = "Correct. Choose New Problem to continue.";

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
  // Product playback always receives synthetic requirement/trace labels. Only
  // a hash-bound entry state distinguishes deterministic evidence capture.
  return Boolean(entryStateSha256);
}

function focusRenderedControl(
  preferred: RefObject<HTMLElement | null>,
  fallback: RefObject<HTMLElement | null>,
) {
  requestAnimationFrame(() => {
    const preferredControl = preferred.current;
    const control = preferredControl?.getClientRects().length
      ? preferredControl
      : fallback.current;
    control?.focus();
  });
}

interface CourseG04L03In008MobileSurfaceProps {
  readonly closeButtonRef: RefObject<HTMLButtonElement | null>;
  readonly dispatch: Dispatch<CourseG04L03In008InteractionAction>;
  readonly firstInputRef: RefObject<HTMLInputElement | null>;
  readonly interaction: CourseG04L03In008InteractionState;
  readonly newProblemButtonRef: RefObject<HTMLButtonElement | null>;
  readonly onCloseFeedback: () => void;
  readonly onNewProblem: () => void;
  readonly placement: "fallback" | "portal";
}

function CourseG04L03In008MobileSurface({
  closeButtonRef,
  dispatch,
  firstInputRef,
  interaction,
  newProblemButtonRef,
  onCloseFeedback,
  onNewProblem,
  placement,
}: CourseG04L03In008MobileSurfaceProps) {
  const feedbackId = "course-g04-l03-in-008-mobile-feedback";
  const submitAnswer = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    dispatch({type: "check"});
  };

  return (
    <form
      aria-label="Mobile controls for completing the number pattern"
      className={`course-g04-l03-in-008-mobile-controls course-g04-l03-in-008-mobile-controls--${placement}`}
      data-interaction-companion-placement={placement}
      data-interaction-companion-surface="mobile"
      data-interaction-outcome={interaction.outcome}
      onSubmit={submitAnswer}
    >
      <p className="course-g04-l03-in-008-mobile-question">
        Complete the pattern: <strong>{interaction.currentQuestion.label}</strong>
      </p>
      <div className="course-g04-l03-in-008-mobile-inputs">
        <label>
          <span>First missing number</span>
          <input
            aria-describedby={feedbackId}
            aria-label="First missing number"
            autoCapitalize="none"
            autoComplete="off"
            enterKeyHint="next"
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
      <div className="course-g04-l03-in-008-mobile-actions">
        <button disabled={!interaction.checkEnabled} type="submit">
          Check Answer
        </button>
        <button
          disabled={!interaction.newProblemEnabled}
          onClick={onNewProblem}
          ref={newProblemButtonRef}
          type="button"
        >
          New Problem
        </button>
      </div>
      <span
        aria-live="polite"
        id={feedbackId}
        role="status"
        style={visuallyHiddenStyle}
      >
        {interaction.outcome === "correct" ? CORRECT_STATUS : ""}
      </span>
      {interaction.outcome === "wrong" ? (
        <div
          aria-label="Incorrect answer feedback"
          aria-describedby="course-g04-l03-in-008-mobile-feedback-copy"
          className="course-g04-l03-in-008-mobile-dialog"
          role="alertdialog"
        >
          <p id="course-g04-l03-in-008-mobile-feedback-copy">
            {interaction.feedbackText}
          </p>
          <button
            aria-label="Close feedback and try the same problem again"
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

function CourseG04L03In008InteractionOverlay({
  pageInteractionCompanionTargetId,
  replay = 0,
  seed,
}: Pick<
  AnimationRendererProps,
  "pageInteractionCompanionTargetId" | "replay" | "seed"
>) {
  const [interaction, dispatch] = useReducer(
    reduceCourseG04L03In008Interaction,
    seed,
    createCourseG04L03In008InteractionState,
  );
  const [companionTarget, setCompanionTarget] = useState<HTMLElement | null>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const newProblemButtonRef = useRef<HTMLButtonElement>(null);
  const mobileFirstInputRef = useRef<HTMLInputElement>(null);
  const mobileCloseButtonRef = useRef<HTMLButtonElement>(null);
  const mobileNewProblemButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    dispatch({type: "replay"});
  }, [replay, seed]);

  useEffect(() => {
    if (!pageInteractionCompanionTargetId) {
      setCompanionTarget(null);
      return;
    }
    setCompanionTarget(document.getElementById(
      pageInteractionCompanionTargetId,
    ));
  }, [pageInteractionCompanionTargetId]);

  useEffect(() => {
    if (interaction.outcome === "wrong") {
      focusRenderedControl(mobileCloseButtonRef, closeButtonRef);
    } else if (interaction.outcome === "correct") {
      focusRenderedControl(mobileNewProblemButtonRef, newProblemButtonRef);
    }
  }, [interaction.outcome]);

  const sourceInitialQuestionIndex =
    (seed >>> 0) % COURSE_G04_L03_IN_008_QUESTIONS.length;
  const questionNeedsRedraw =
    interaction.currentQuestion.index !== sourceInitialQuestionIndex;
  const focusFirstInput = () => {
    focusRenderedControl(mobileFirstInputRef, firstInputRef);
  };
  const submitAnswer = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    dispatch({type: "check"});
  };
  const closeFeedback = () => {
    dispatch({type: "close-feedback"});
    focusFirstInput();
  };
  const newProblem = () => {
    dispatch({type: "new-problem"});
    focusFirstInput();
  };
  const mobileSurface = (
    <CourseG04L03In008MobileSurface
      closeButtonRef={mobileCloseButtonRef}
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
    <>
    <style>{`
      .course-g04-l03-in-008-mobile-fallback-slot,
      .course-g04-l03-in-008-mobile-controls {
        display: none;
      }

      @media (max-width: 640px) {
        .course-g04-l03-in-008-stage-controls {
          display: none;
        }

        .course-g04-l03-in-008-mobile-fallback-slot {
          aspect-ratio: 4 / 3;
          display: block;
          inset: 0 0 auto;
          pointer-events: none;
          position: absolute;
          width: 100%;
          z-index: 4;
        }

        .course-g04-l03-in-008-mobile-controls {
          background: #e9f7ff;
          border: 2px solid #224b8e;
          border-radius: 12px;
          box-sizing: border-box;
          color: #111;
          display: grid;
          font-family: ${SOURCE_FONT};
          gap: 8px;
          padding: 10px;
        }

        .course-g04-l03-in-008-mobile-controls--fallback {
          left: 4%;
          max-height: 76%;
          overflow: auto;
          pointer-events: auto;
          position: absolute;
          right: 4%;
          top: 18%;
        }

        .course-g04-l03-in-008-mobile-controls--portal {
          margin: 12px 0;
          max-width: 100%;
          pointer-events: auto;
          position: relative;
          width: 100%;
        }

        .course-g04-l03-in-008-mobile-question {
          font-family: ${SOURCE_FONT};
          font-size: 16px;
          line-height: 1.2;
          margin: 0;
          text-align: center;
        }

        .course-g04-l03-in-008-mobile-inputs,
        .course-g04-l03-in-008-mobile-actions {
          display: grid;
          gap: 8px;
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .course-g04-l03-in-008-mobile-inputs label {
          display: grid;
          gap: 3px;
          min-width: 0;
        }

        .course-g04-l03-in-008-mobile-inputs label > span {
          font-family: system-ui, sans-serif;
          font-size: 13px;
          font-weight: 700;
          line-height: 1.15;
        }

        .course-g04-l03-in-008-mobile-inputs input {
          background: #fff;
          border: 2px solid #224b8e;
          border-radius: 8px;
          box-sizing: border-box;
          color: #000;
          font-family: ${SOURCE_FONT};
          font-size: 20px;
          min-height: 48px;
          padding: 6px 8px;
          text-align: center;
          width: 100%;
        }

        .course-g04-l03-in-008-mobile-controls button {
          background: linear-gradient(#fff06a, #42c9d0);
          border: 2px solid #224b8e;
          border-radius: 999px;
          box-sizing: border-box;
          color: #111;
          cursor: pointer;
          font-family: ${SOURCE_FONT};
          font-size: 16px;
          font-weight: 700;
          min-height: 48px;
          padding: 7px 10px;
        }

        .course-g04-l03-in-008-mobile-controls :is(input, button):focus-visible {
          box-shadow: 0 0 0 3px #fff200;
          outline: 3px solid #001d6d;
          outline-offset: 2px;
        }

        .course-g04-l03-in-008-mobile-controls button:disabled {
          cursor: not-allowed;
          opacity: .58;
        }

        .course-g04-l03-in-008-mobile-dialog {
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

        .course-g04-l03-in-008-mobile-dialog p {
          font-family: system-ui, sans-serif;
          font-size: 16px;
          line-height: 1.3;
          margin: 0;
        }
      }
    `}</style>
    <svg
      aria-label="Source-script-bound current JavaScript pattern quiz controls"
      className="course-g04-l03-in-008-stage-controls"
      data-audio-feedback="text-companion-audio-unvalidated"
      data-behavior-parity-established="false"
      data-current-js-functional-candidate="true"
      data-current-question-index={interaction.currentQuestion.index}
      data-interaction-outcome={interaction.outcome}
      data-legacy-actionscript-executed="false"
      data-source-script-bound="true"
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
            height: 600,
            margin: 0,
            pointerEvents: "none",
            position: "relative",
            width: 800,
          }}
        >
          {questionNeedsRedraw ? (
            <div
              aria-hidden="true"
              style={{
                alignItems: "center",
                background: SOURCE_STAGE_BACKGROUND,
                color: "#000",
                display: "flex",
                fontFamily: SOURCE_FONT,
                fontSize: 30,
                height: 42,
                justifyContent: "flex-end",
                left: 164,
                lineHeight: 1,
                overflow: "hidden",
                pointerEvents: "none",
                position: "absolute",
                textAlign: "right",
                top: 271,
                whiteSpace: "nowrap",
                width: 235,
              }}
            >
              {interaction.currentQuestion.label}
            </div>
          ) : null}

          <label
            style={{
              alignItems: "center",
              display: "flex",
              height: 60,
              justifyContent: "center",
              left: 393,
              pointerEvents: "auto",
              position: "absolute",
              top: 264,
              width: 82,
            }}
          >
            <span style={{position: "absolute", clip: "rect(0 0 0 0)"}}>
              First missing number
            </span>
            <input
              aria-describedby="course-g04-l03-in-008-stage-feedback"
              aria-label="First missing number"
              autoComplete="off"
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
                border: "1px solid #111",
                boxSizing: "border-box",
                color: "#000",
                fontFamily: SOURCE_FONT,
                fontSize: 30,
                height: 40.4,
                lineHeight: 1,
                margin: 0,
                outlineOffset: 2,
                padding: "0 2px",
                pointerEvents: "auto",
                textAlign: "center",
                width: 64.6,
              }}
              type="text"
              value={interaction.answerFirst}
            />
          </label>

          <label
            style={{
              alignItems: "center",
              display: "flex",
              height: 60,
              justifyContent: "center",
              left: 472,
              pointerEvents: "auto",
              position: "absolute",
              top: 264,
              width: 80,
            }}
          >
            <span style={{position: "absolute", clip: "rect(0 0 0 0)"}}>
              Second missing number
            </span>
            <input
              aria-describedby="course-g04-l03-in-008-stage-feedback"
              aria-label="Second missing number"
              autoComplete="off"
              onChange={(event) => dispatch({
                type: "set-input",
                field: "second",
                value: event.currentTarget.value,
              })}
              readOnly={interaction.inputsLocked}
              spellCheck={false}
              style={{
                background: "#fff",
                border: "1px solid #111",
                boxSizing: "border-box",
                color: "#000",
                fontFamily: SOURCE_FONT,
                fontSize: 30,
                height: 40,
                lineHeight: 1,
                margin: 0,
                outlineOffset: 2,
                padding: "0 2px",
                pointerEvents: "auto",
                textAlign: "center",
                width: 63.6,
              }}
              type="text"
              value={interaction.answerSecond}
            />
          </label>

          <button
            aria-label="Check Answer"
            disabled={!interaction.checkEnabled}
            style={{
              ...transparentSourceButtonStyle,
              height: 64,
              left: 180,
              top: 372,
              width: 190,
            }}
            type="submit"
          >
            Check Answer
          </button>
          <button
            aria-label="New Problem"
            disabled={!interaction.newProblemEnabled}
            onClick={newProblem}
            ref={newProblemButtonRef}
            style={{
              ...transparentSourceButtonStyle,
              height: 64,
              left: 442,
              top: 372,
              width: 190,
            }}
            type="button"
          >
            New Problem
          </button>

          {interaction.feedbackVisible ? (
            <>
              <div
                aria-live="polite"
                id="course-g04-l03-in-008-stage-feedback"
                role="status"
                style={{
                  alignItems: "center",
                  background: "#ffffcc",
                  border: "1px solid #6a6231",
                  boxSizing: "border-box",
                  color: "#000",
                  display: "flex",
                  fontFamily: SOURCE_FONT,
                  fontSize: 20,
                  height: 64,
                  left: 153,
                  lineHeight: 1.15,
                  padding: "6px 12px",
                  pointerEvents: "none",
                  position: "absolute",
                  top: 183,
                  width: 515,
                }}
              >
                {interaction.feedbackText}
              </div>
              <button
                aria-label="Close feedback and try the same problem again"
                onClick={closeFeedback}
                ref={closeButtonRef}
                style={{
                  background: "#fff",
                  border: "1px solid #929292",
                  borderRadius: 2,
                  color: "#000",
                  cursor: "pointer",
                  fontFamily: SOURCE_FONT,
                  fontSize: 18,
                  height: 32,
                  left: 568,
                  lineHeight: 1,
                  margin: 0,
                  padding: 0,
                  pointerEvents: "auto",
                  position: "absolute",
                  top: 153,
                  width: 100,
                }}
                type="button"
              >
                Close
              </button>
            </>
          ) : (
            <span
              aria-live="polite"
              id="course-g04-l03-in-008-stage-feedback"
              role="status"
              style={visuallyHiddenStyle}
            >
              {interaction.outcome === "correct" ? CORRECT_STATUS : ""}
            </span>
          )}
        </form>
      </foreignObject>
    </svg>
    {companionTarget
      ? createPortal(mobileSurface, companionTarget)
      : <div className="course-g04-l03-in-008-mobile-fallback-slot">
          {mobileSurface}
        </div>}
    </>
  );
}

export function CourseG04L03In008Renderer(props: AnimationRendererProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const frameDomain = props.frameDomain ?? SOURCE_QUIZ_DOMAIN;
  const interactionEnabled =
    props.frame === SOURCE_QUIZ_FRAME
    && frameDomain === SOURCE_QUIZ_DOMAIN
    && props.scenario === SOURCE_QUIZ_SCENARIO
    && props.lang === "en"
    && !isDeterministicEvidenceCapture(props);

  useEffect(() => {
    const canvas = wrapperRef.current?.querySelector<HTMLCanvasElement>(
      'canvas[data-course-canvas="course-g04-l03-in-008"]',
    );
    if (!canvas || !interactionEnabled) return;
    const previousAriaHidden = canvas.getAttribute("aria-hidden");
    canvas.setAttribute("aria-hidden", "true");
    return () => {
      if (previousAriaHidden === null) canvas.removeAttribute("aria-hidden");
      else canvas.setAttribute("aria-hidden", previousAriaHidden);
    };
  }, [interactionEnabled]);

  return (
    <div
      data-behavior-parity-established="false"
      data-current-js-controls-enabled={interactionEnabled ? "true" : "false"}
      data-current-js-functional-scope="in008-pattern-quiz-source-script-bound"
      data-owner-accepted="false"
      data-strict-acceptance-effect="none"
      ref={wrapperRef}
      style={{margin: "0 auto", maxWidth: 800, position: "relative", width: "100%"}}
    >
      <SourceStaticRenderer {...props} />
      {interactionEnabled ? (
        <CourseG04L03In008InteractionOverlay
          pageInteractionCompanionTargetId={
            props.pageInteractionCompanionTargetId
          }
          replay={props.replay}
          seed={props.seed}
        />
      ) : null}
    </div>
  );
}

export {COURSE_G04_L03_IN_008_SOURCE};
export const COURSE_G04_L03_IN_008_MOVIE = candidate.movie;
export const COURSE_G04_L03_IN_008_RUNTIME = candidate.runtime;
export const COURSE_G04_L03_IN_008_SOURCE_CONTRACT = Object.freeze({
  ...candidate.sourceContract,
  currentJavascriptInteractionStatus:
    "source-script-bound-functional-candidate",
  currentJavascriptInteractionScope: Object.freeze([
    "two-exact-string-inputs",
    "check-answer",
    "wrong-feedback-and-close-retry",
    "new-problem-without-replacement",
    "whole-renderer-replay-reset",
    "reduced-motion-interactive-stop",
    "responsive-mobile-touch-control-surface",
    "page-interaction-companion-portal-with-stage-fallback",
    "interactive-canvas-accessibility-isolation",
  ]),
  legacyCoachAudioStatus: "inventoried-unaccepted-text-companion-only",
  glossaryHostStatus: "source-bound-unimplemented",
  behaviorParityEstablished: false,
  strictAcceptanceEffect: "none",
});
export const COURSE_G04_L03_IN_008_SCENARIOS = candidate.scenarios;
export const normalizeCourseG04L03In008Frame = candidate.normalizeFrame;
export const getCourseG04L03In008FrameState = candidate.getFrameState;
export const buildCourseG04L03In008CaptureAttributes =
  candidate.buildCaptureAttributes;

export default Object.freeze({
  ...candidate.module,
  reducedMotionFrame: SOURCE_QUIZ_FRAME,
  Renderer: CourseG04L03In008Renderer,
});
