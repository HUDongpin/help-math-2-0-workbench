"use client";

import React, {
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import type {Dispatch, KeyboardEvent} from "react";
import {createPortal} from "react-dom";

import type {AnimationRendererProps} from "../contract";
import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G04_L03_TS_008_CHOICES,
  COURSE_G04_L03_TS_008_DONOR_POLICY,
  COURSE_G04_L03_TS_008_GLOSSARY,
  COURSE_G04_L03_TS_008_INTERACTION_AUTHORITY,
  COURSE_G04_L03_TS_008_NEED_MORE_HELP,
  COURSE_G04_L03_TS_008_PLAYBACK_POLICY,
  COURSE_G04_L03_TS_008_QUESTION,
  COURSE_G04_L03_TS_008_WALKTHROUGH_STEPS,
  createCourseG04L03Ts008InteractionState,
  reduceCourseG04L03Ts008Interaction,
  type CourseG04L03Ts008Choice,
  type CourseG04L03Ts008DonorFrame,
  type CourseG04L03Ts008InteractionAction,
  type CourseG04L03Ts008InteractionState,
  type CourseG04L03Ts008WalkthroughStep,
} from "../timelines/course-g04-l03-ts-008-practice-question-interaction";
import {
  COURSE_G04_L03_TS_008_CONFIG,
  COURSE_G04_L03_TS_008_SOURCE,
} from "../timelines/course-g04-l03-ts-008";

const candidate = createSourceStaticCanvasCandidate(
  COURSE_G04_L03_TS_008_CONFIG,
);
const SourceStaticRenderer = candidate.Renderer;

const SOURCE_DOMAIN = "sprite-350";
const SOURCE_SCENARIO = "source-static-frame";
const FUNCTIONAL_ENTRY_FRAME = 328;
const RESPONSIVE_CONTROLS_MEDIA =
  "(max-width: 640px), (any-pointer: coarse)";
const SOURCE_FONT =
  '"Bauhaus Md BT", "Arial Rounded MT Bold", "Trebuchet MS", ui-rounded, sans-serif';
const SOURCE_COMPOSITE_UNSAFE_FRAMES = Object.freeze([592, 712, 770]);

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

function isDeterministicEvidenceCapture({
  entryStateSha256,
}: AnimationRendererProps) {
  return Boolean(entryStateSha256);
}

function sourceCanvasStatusMessage(status: SourceCanvasStatus) {
  if (status === "error") {
    return "The current-JavaScript source drawing could not load. Controls remain disabled.";
  }
  if (status === "blocked") {
    return "This source drawing is unavailable for the requested context. Controls remain disabled.";
  }
  return "Loading the current-JavaScript source drawing before controls are enabled…";
}

function donorFrameForInteraction(
  interaction: CourseG04L03Ts008InteractionState,
): CourseG04L03Ts008DonorFrame {
  const donor = COURSE_G04_L03_TS_008_DONOR_POLICY.functionalStateMap.find(
    ({sourceFrame}) => sourceFrame === interaction.frame,
  );
  return donor?.donorFrame ?? 328;
}

function completedStepCount(
  interaction: CourseG04L03Ts008InteractionState,
) {
  switch (interaction.frame) {
    case 328:
      return 0;
    case 465:
      return 1;
    case 592:
      return interaction.walkthroughBoxRevealed ? 3 : 2;
    case 712:
      return interaction.walkthroughBoxRevealed ? 4 : 3;
    case 770:
    case 789:
      return 4;
    default:
      return 0;
  }
}

function currentWalkthroughStep(
  interaction: CourseG04L03Ts008InteractionState,
) {
  if (interaction.walkthroughGate === null) return null;
  return COURSE_G04_L03_TS_008_WALKTHROUGH_STEPS[
    interaction.walkthroughGate
  ] ?? null;
}

function accessibleChoiceLabel(choice: CourseG04L03Ts008Choice) {
  return `${choice.id}. ${choice.person}`;
}

function feedbackExplanation(
  interaction: CourseG04L03Ts008InteractionState,
) {
  const feedback = interaction.feedback;
  if (!feedback) return "";
  if (feedback.kind === "right") {
    return "Toni has positive seven dollars, the greatest amount. Answer D is correct.";
  }
  return interaction.wrongTryCount === 0
    ? "This is the first incorrect attempt. Continue to return to the same answer choices."
    : "This is the second incorrect attempt. Continue to the source-script-derived terminal state.";
}

function formatRemainingMs(remainingMs: number | null) {
  if (remainingMs === null) return "";
  return `${Math.max(0, remainingMs / 1_000).toFixed(1)} seconds`;
}

function handleModalKeys(
  event: KeyboardEvent<HTMLElement>,
  close: () => void,
) {
  if (event.key === "Escape") {
    event.preventDefault();
    close();
    return;
  }
  if (event.key === "Tab") {
    event.preventDefault();
    event.currentTarget
      .querySelector<HTMLButtonElement>("button:not(:disabled)")
      ?.focus();
  }
}

function findVisibleFocusTarget(
  roots: readonly (HTMLElement | null)[],
  target: string,
) {
  return roots
    .filter((root): root is HTMLElement => root !== null)
    .flatMap((root) =>
      Array.from(
        root.querySelectorAll<HTMLElement>(
          `[data-ts008-focus-control="${target}"]`,
        ),
      ),
    )
    .find(
      (control) =>
        control.getClientRects().length > 0
        && !control.hasAttribute("disabled"),
    );
}

function StepText({
  compact = false,
  step,
}: {
  readonly compact?: boolean;
  readonly step: CourseG04L03Ts008WalkthroughStep;
}) {
  return (
    <>
      {step.visibleText.map((line, index) => (
        <p
          className={
            index === 0
              ? "course-g04-l03-ts-008-step-heading"
              : undefined
          }
          key={`${step.id}-${line}`}
          style={compact ? {margin: 0} : undefined}
        >
          {step.id === 2 && index > 0 && index < 5 ? "• " : null}
          {line}
        </p>
      ))}
    </>
  );
}

function SourceGlossaryBoundary() {
  return (
    <div
      aria-label="Three source glossary callbacks are unavailable in this current JavaScript candidate."
      data-host-glossary-actions="safe-disabled"
      data-host-glossary-function="DoHyperLinks-unresolved"
      style={visuallyHiddenStyle}
    >
      {COURSE_G04_L03_TS_008_GLOSSARY.map(({term}) => (
        <span aria-disabled="true" key={term} role="link">
          {term}
        </span>
      ))}
    </div>
  );
}

interface SharedSurfaceProps {
  readonly canvasStatus: SourceCanvasStatus;
  readonly controlsReady: boolean;
  readonly dispatch: Dispatch<CourseG04L03Ts008InteractionAction>;
  readonly feedbackRemainingMs: number | null;
  readonly interaction: CourseG04L03Ts008InteractionState;
  readonly onCloseNeedMoreHelp: () => void;
  readonly onFinishFeedback: () => void;
  readonly onFocusControl: (key: string | null) => void;
  readonly onReplay: () => void;
  readonly paused: boolean;
  readonly reducedMotion: boolean;
}

interface MobileSurfaceProps extends SharedSurfaceProps {
  readonly placement: "fallback" | "portal";
}

function NeedMoreHelpContent({
  close,
  controlsReady,
  focusPrefix,
}: {
  readonly close: () => void;
  readonly controlsReady: boolean;
  readonly focusPrefix: "stage" | "mobile";
}) {
  return (
    <>
      <strong>Need More Help</strong>
      <p>
        {COURSE_G04_L03_TS_008_NEED_MORE_HELP.text[0]}.{" "}
        {COURSE_G04_L03_TS_008_NEED_MORE_HELP.text[1]}.
      </p>
      <div
        aria-label="Number line from negative ten through positive ten"
        className="course-g04-l03-ts-008-help-number-line"
      >
        <span>−10</span>
        <span>−5</span>
        <span>0</span>
        <span>+5</span>
        <span>+10</span>
      </div>
      <div
        aria-label="Unavailable glossary links"
        className="course-g04-l03-ts-008-help-glossary"
        role="group"
      >
        {COURSE_G04_L03_TS_008_GLOSSARY.map(({term, visibleText}) => (
          <button
            aria-label={`${term} glossary is unavailable because the legacy host callback is unresolved`}
            data-source-glossary-term={term}
            disabled
            key={term}
            type="button"
          >
            {visibleText}
          </button>
        ))}
      </div>
      <button
        data-modal-surface={focusPrefix}
        data-ts008-focus-control="need-more-help-close"
        disabled={!controlsReady}
        onClick={close}
        type="button"
      >
        Close
      </button>
    </>
  );
}

function MobileSurface({
  canvasStatus,
  controlsReady,
  dispatch,
  feedbackRemainingMs,
  interaction,
  onCloseNeedMoreHelp,
  onFinishFeedback,
  onFocusControl,
  onReplay,
  paused,
  placement,
  reducedMotion,
}: MobileSurfaceProps) {
  const controlsDisabled = !controlsReady || paused;
  const completed = completedStepCount(interaction);
  const currentStep = currentWalkthroughStep(interaction);

  return (
    <section
      aria-label="Current-JavaScript question walkthrough and answer controls"
      className={
        "course-g04-l03-ts-008-mobile-controls "
        + `course-g04-l03-ts-008-mobile-controls--${placement}`
      }
      data-current-js-controls-ready={controlsReady ? "true" : "false"}
      data-current-js-modern-reconstruction="true"
      data-interaction-companion-placement={placement}
      data-interaction-companion-surface="mobile"
      data-interaction-phase={interaction.phase}
      data-source-canvas-status={canvasStatus}
      onFocusCapture={(event) => {
        onFocusControl(
          event.target instanceof HTMLElement
            ? event.target.dataset.ts008FocusControl ?? null
            : null,
        );
      }}
    >
      <p className="course-g04-l03-ts-008-modern-label">
        <strong>Modern reconstruction</strong>
        <span>
          Functional current-JavaScript controls; source composite and visual
          parity remain unestablished.
        </span>
      </p>

      {!controlsReady ? (
        <p
          aria-live={canvasStatus === "error" ? "assertive" : "polite"}
          className="course-g04-l03-ts-008-mobile-loading"
          role={canvasStatus === "error" ? "alert" : "status"}
        >
          {sourceCanvasStatusMessage(canvasStatus)}
        </p>
      ) : null}

      <p className="course-g04-l03-ts-008-mobile-question">
        {COURSE_G04_L03_TS_008_QUESTION.prompt}
      </p>

      {completed > 0 ? (
        <div
          aria-label={`${completed} completed reasoning steps`}
          className="course-g04-l03-ts-008-mobile-steps"
        >
          {COURSE_G04_L03_TS_008_WALKTHROUGH_STEPS
            .slice(0, completed)
            .map((step) => (
              <article key={step.id}>
                <strong>Step {step.id}</strong>
                <StepText step={step} />
              </article>
            ))}
        </div>
      ) : null}

      {interaction.phase === "walkthrough" && currentStep ? (
        <div className="course-g04-l03-ts-008-mobile-action">
          {!interaction.walkthroughBoxRevealed ? (
            <button
              data-ts008-focus-control={`walkthrough-step-${currentStep.id}`}
              disabled={controlsDisabled}
              onClick={() =>
                dispatch(
                  currentStep.revealThenClose
                    ? {type: "reveal-walkthrough-box"}
                    : {type: "continue-walkthrough"},
                )}
              type="button"
            >
              Reveal step {currentStep.id}
            </button>
          ) : (
            <>
              <button
                data-ts008-focus-control={
                  `walkthrough-box-${currentStep.id}-close`
                }
                disabled={controlsDisabled}
                onClick={() =>
                  dispatch({type: "close-walkthrough-box"})}
                type="button"
              >
                Close
              </button>
              <button
                data-ts008-focus-control="need-more-help"
                disabled={controlsDisabled}
                onClick={() =>
                  dispatch({type: "open-need-more-help"})}
                type="button"
              >
                Need More Help
              </button>
            </>
          )}
        </div>
      ) : null}

      {interaction.phase === "quiz" ? (
        <>
          <div
            aria-label="Answer choices"
            className="course-g04-l03-ts-008-mobile-choices"
            role="group"
          >
            {COURSE_G04_L03_TS_008_CHOICES.map((choice) => (
              <button
                aria-label={accessibleChoiceLabel(choice)}
                data-source-button-object-id={choice.sourceButtonObjectId}
                data-source-instance={choice.sourceInstance}
                data-ts008-focus-control={`choice-${choice.id}`}
                disabled={controlsDisabled}
                key={choice.id}
                onClick={() =>
                  dispatch({type: "choose", choiceId: choice.id})}
                type="button"
              >
                <strong>{choice.id}</strong>
                <span>{choice.person}</span>
              </button>
            ))}
          </div>
          <button
            data-ts008-focus-control="need-more-help"
            disabled={controlsDisabled}
            onClick={() => dispatch({type: "open-need-more-help"})}
            type="button"
          >
            Need More Help
          </button>
        </>
      ) : null}

      {interaction.phase === "feedback" && interaction.feedback ? (
        <div
          aria-atomic="true"
          aria-live="assertive"
          className="course-g04-l03-ts-008-mobile-feedback"
          data-feedback-branch={
            `${interaction.feedback.kind}${interaction.feedback.branch}`
          }
          data-feedback-source-visual-parity-established="false"
          data-ts008-focus-control="feedback-status"
          role="status"
          tabIndex={-1}
        >
          <strong>{interaction.feedback.copy}</strong>
          <p>{feedbackExplanation(interaction)}</p>
          <p>
            Current-JavaScript projection of source branch{" "}
            {interaction.feedback.kind}
            {interaction.feedback.branch}; feedback artwork and audio parity
            are not established.
          </p>
          <p>
            {paused
              ? `Paused with ${formatRemainingMs(feedbackRemainingMs)} remaining.`
              : reducedMotion
                ? "Reduced motion: static feedback is held until Continue."
                : `Source-window timing projection: approximately ${formatRemainingMs(feedbackRemainingMs)}.`}
          </p>
          <button
            disabled={!controlsReady || paused}
            onClick={onFinishFeedback}
            type="button"
          >
            Continue
          </button>
        </div>
      ) : null}

      {interaction.phase === "need-more-help" ? (
        <div
          aria-label="Need More Help"
          aria-modal="true"
          className="course-g04-l03-ts-008-mobile-dialog"
          onKeyDown={(event) =>
            handleModalKeys(event, onCloseNeedMoreHelp)}
          role="dialog"
        >
          <NeedMoreHelpContent
            close={onCloseNeedMoreHelp}
            controlsReady={controlsReady}
            focusPrefix="mobile"
          />
        </div>
      ) : null}

      {interaction.phase === "terminal" ? (
        <div
          aria-live="polite"
          className="course-g04-l03-ts-008-mobile-terminal"
          data-original-runtime-terminal-parity="false"
          data-ts008-focus-control="terminal"
          role="status"
          tabIndex={-1}
        >
          <strong>Question complete</strong>
          <p>D. Toni has the most money with $7.</p>
          <button
            disabled={controlsDisabled}
            onClick={onReplay}
            type="button"
          >
            Replay
          </button>
        </div>
      ) : null}
    </section>
  );
}

function StageStepContent({
  step,
}: {
  readonly step: CourseG04L03Ts008WalkthroughStep;
}) {
  const {hitBounds} = step;
  return (
    <div
      aria-hidden="true"
      className={
        "course-g04-l03-ts-008-stage-step-content "
        + `course-g04-l03-ts-008-stage-step-content--${step.id}`
      }
      data-modern-reconstructed-step={step.id}
      style={{
        height: hitBounds.height - 10,
        left: hitBounds.x + 10,
        top: hitBounds.y + 5,
        width: hitBounds.width - 15,
      }}
    >
      <StepText compact step={step} />
    </div>
  );
}

function StageWorksheetReconstruction({
  interaction,
}: {
  readonly interaction: CourseG04L03Ts008InteractionState;
}) {
  const overlaySteps: CourseG04L03Ts008WalkthroughStep[] = [];
  if (interaction.frame === 592) {
    const step2 = COURSE_G04_L03_TS_008_WALKTHROUGH_STEPS[1];
    const step3 = COURSE_G04_L03_TS_008_WALKTHROUGH_STEPS[2];
    if (step2) overlaySteps.push(step2);
    if (step3 && interaction.walkthroughBoxRevealed) {
      overlaySteps.push(step3);
    }
  }
  if (interaction.frame === 712) {
    const step2 = COURSE_G04_L03_TS_008_WALKTHROUGH_STEPS[1];
    const step3 = COURSE_G04_L03_TS_008_WALKTHROUGH_STEPS[2];
    const step4 = COURSE_G04_L03_TS_008_WALKTHROUGH_STEPS[3];
    if (step2) overlaySteps.push(step2);
    if (step3) overlaySteps.push(step3);
    if (step4 && interaction.walkthroughBoxRevealed) {
      overlaySteps.push(step4);
    }
  }

  return (
    <>
      {overlaySteps.map((step) => (
        <StageStepContent key={step.id} step={step} />
      ))}
    </>
  );
}

function StageSurface({
  canvasStatus,
  controlsReady,
  dispatch,
  feedbackRemainingMs,
  interaction,
  onCloseNeedMoreHelp,
  onFinishFeedback,
  onFocusControl: _onFocusControl,
  onReplay,
  paused,
  reducedMotion,
}: SharedSurfaceProps) {
  const controlsDisabled = !controlsReady || paused;
  const currentStep = currentWalkthroughStep(interaction);

  return (
    <svg
      aria-busy={!controlsReady}
      aria-label="Current-JavaScript reconstructed four-step reasoning and practice controls"
      className="course-g04-l03-ts-008-stage-surface"
      data-behavior-parity-established="false"
      data-current-js-controls-ready={controlsReady ? "true" : "false"}
      data-current-js-modern-reconstruction="true"
      data-interaction-phase={interaction.phase}
      data-source-canvas-status={canvasStatus}
      role="group"
      style={{
        height: "auto",
        inset: 0,
        pointerEvents: "none",
        position: "absolute",
        width: "100%",
        zIndex: 4,
      }}
      viewBox="0 0 800 600"
    >
      <foreignObject height="600" width="800" x="0" y="0">
        <div
          style={{
            fontFamily: SOURCE_FONT,
            height: 600,
            pointerEvents: "none",
            position: "relative",
            width: 800,
          }}
        >
          <p className="course-g04-l03-ts-008-stage-modern-label">
            <strong>Modern reconstruction</strong>
            <span>
              Frames 592, 712, and 770 have unresolved natural composites.
            </span>
          </p>

          <span style={visuallyHiddenStyle}>
            {COURSE_G04_L03_TS_008_QUESTION.prompt}
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

          <StageWorksheetReconstruction interaction={interaction} />

          {interaction.phase === "walkthrough" && currentStep ? (
            <>
              {!interaction.walkthroughBoxRevealed ? (
                <button
                  aria-label={`Reveal reasoning step ${currentStep.id}`}
                  className="course-g04-l03-ts-008-source-hit-button"
                  data-source-overlay-button-object-id={
                    currentStep.sourceOverlayButtonObjectId
                  }
                  data-source-underlay-object-id={
                    currentStep.sourceUnderlayObjectId
                  }
                  data-ts008-focus-control={
                    `walkthrough-step-${currentStep.id}`
                  }
                  disabled={controlsDisabled}
                  onClick={() =>
                    dispatch(
                      currentStep.revealThenClose
                        ? {type: "reveal-walkthrough-box"}
                        : {type: "continue-walkthrough"},
                    )}
                  style={{
                    height: currentStep.hitBounds.height,
                    left: currentStep.hitBounds.x,
                    top: currentStep.hitBounds.y,
                    width: currentStep.hitBounds.width,
                  }}
                  type="button"
                >
                  Reveal reasoning step {currentStep.id}
                </button>
              ) : (
                <>
                  <button
                    className="course-g04-l03-ts-008-stage-close"
                    data-source-close-button-object-id={
                      currentStep.sourceCloseButtonObjectId ?? undefined
                    }
                    data-ts008-focus-control={
                      `walkthrough-box-${currentStep.id}-close`
                    }
                    disabled={controlsDisabled}
                    onClick={() =>
                      dispatch({type: "close-walkthrough-box"})}
                    style={{
                      left:
                        currentStep.hitBounds.x
                        + currentStep.hitBounds.width
                        - 78,
                      top:
                        currentStep.hitBounds.y
                        + currentStep.hitBounds.height
                        - 39,
                    }}
                    type="button"
                  >
                    Close
                  </button>
                  <button
                    className="course-g04-l03-ts-008-stage-help-button"
                    data-source-button-object-id={
                      COURSE_G04_L03_TS_008_NEED_MORE_HELP
                        .sourceButtonObjectId
                    }
                    data-ts008-focus-control="need-more-help"
                    disabled={controlsDisabled}
                    onClick={() =>
                      dispatch({type: "open-need-more-help"})}
                    style={{
                      height:
                        COURSE_G04_L03_TS_008_NEED_MORE_HELP.buttonBounds
                          .height,
                      left:
                        COURSE_G04_L03_TS_008_NEED_MORE_HELP.buttonBounds.x,
                      top:
                        COURSE_G04_L03_TS_008_NEED_MORE_HELP.buttonBounds.y,
                      width:
                        COURSE_G04_L03_TS_008_NEED_MORE_HELP.buttonBounds
                          .width,
                    }}
                    type="button"
                  >
                    Need More Help
                  </button>
                </>
              )}
            </>
          ) : null}

          {interaction.phase === "quiz" ? (
            <>
              <div aria-label="Answer choices" role="group">
                {COURSE_G04_L03_TS_008_CHOICES.map((choice) => (
                  <button
                    aria-label={accessibleChoiceLabel(choice)}
                    className="course-g04-l03-ts-008-source-hit-button"
                    data-source-button-object-id={choice.sourceButtonObjectId}
                    data-source-instance={choice.sourceInstance}
                    data-ts008-focus-control={`choice-${choice.id}`}
                    disabled={controlsDisabled}
                    key={choice.id}
                    onClick={() =>
                      dispatch({type: "choose", choiceId: choice.id})}
                    style={{
                      height: choice.hitBounds.height,
                      left: choice.hitBounds.x,
                      top: choice.hitBounds.y,
                      width: choice.hitBounds.width,
                    }}
                    type="button"
                  >
                    {accessibleChoiceLabel(choice)}
                  </button>
                ))}
              </div>
              <button
                className="course-g04-l03-ts-008-stage-help-button"
                data-source-button-object-id={
                  COURSE_G04_L03_TS_008_NEED_MORE_HELP.sourceButtonObjectId
                }
                data-ts008-focus-control="need-more-help"
                disabled={controlsDisabled}
                onClick={() =>
                  dispatch({type: "open-need-more-help"})}
                style={{
                  height:
                    COURSE_G04_L03_TS_008_NEED_MORE_HELP.buttonBounds.height,
                  left: COURSE_G04_L03_TS_008_NEED_MORE_HELP.buttonBounds.x,
                  top: COURSE_G04_L03_TS_008_NEED_MORE_HELP.buttonBounds.y,
                  width:
                    COURSE_G04_L03_TS_008_NEED_MORE_HELP.buttonBounds.width,
                }}
                type="button"
              >
                Need More Help
              </button>
            </>
          ) : null}

          {interaction.phase === "feedback" && interaction.feedback ? (
            <div
              aria-atomic="true"
              aria-live="assertive"
              className="course-g04-l03-ts-008-stage-feedback"
              data-feedback-branch={
                `${interaction.feedback.kind}${interaction.feedback.branch}`
              }
              data-feedback-source-visual-parity-established="false"
              data-ts008-focus-control="feedback-status"
              role="status"
              tabIndex={-1}
            >
              <strong>{interaction.feedback.copy}</strong>
              <p>{feedbackExplanation(interaction)}</p>
              <p>
                Modern projection of source feedback branch{" "}
                {interaction.feedback.kind}
                {interaction.feedback.branch}; artwork and audio parity remain
                unestablished.
              </p>
              <p>
                {paused
                  ? `Paused with ${formatRemainingMs(feedbackRemainingMs)} remaining.`
                  : reducedMotion
                    ? "Reduced motion: static feedback is held until Continue."
                    : `Timing projection: ${formatRemainingMs(feedbackRemainingMs)}.`}
              </p>
              <button
                disabled={!controlsReady || paused}
                onClick={onFinishFeedback}
                type="button"
              >
                Continue
              </button>
            </div>
          ) : null}

          {interaction.phase === "need-more-help" ? (
            <div
              aria-label="Need More Help"
              aria-modal="true"
              className="course-g04-l03-ts-008-stage-dialog"
              data-source-popup-object-id={
                COURSE_G04_L03_TS_008_NEED_MORE_HELP.sourcePopupObjectId
              }
              onKeyDown={(event) =>
                handleModalKeys(event, onCloseNeedMoreHelp)}
              role="dialog"
              style={{
                height:
                  COURSE_G04_L03_TS_008_NEED_MORE_HELP.popupBounds.height,
                left: COURSE_G04_L03_TS_008_NEED_MORE_HELP.popupBounds.x,
                top: COURSE_G04_L03_TS_008_NEED_MORE_HELP.popupBounds.y,
                width:
                  COURSE_G04_L03_TS_008_NEED_MORE_HELP.popupBounds.width,
              }}
            >
              <NeedMoreHelpContent
                close={onCloseNeedMoreHelp}
                controlsReady={controlsReady}
                focusPrefix="stage"
              />
            </div>
          ) : null}

          {interaction.phase === "terminal" ? (
            <div
              aria-live="polite"
              className="course-g04-l03-ts-008-stage-terminal"
              data-original-runtime-terminal-parity="false"
              data-ts008-focus-control="terminal"
              role="status"
              tabIndex={-1}
            >
              <strong>D. Toni has the most money with $7.</strong>
              <span>Replay resets the complete reconstructed state.</span>
              <button
                disabled={controlsDisabled}
                onClick={onReplay}
                type="button"
              >
                Replay
              </button>
            </div>
          ) : null}
        </div>
      </foreignObject>
    </svg>
  );
}

export function CourseG04L03Ts008Renderer(
  props: AnimationRendererProps,
) {
  const [interaction, dispatch] = useReducer(
    reduceCourseG04L03Ts008Interaction,
    props.seed,
    createCourseG04L03Ts008InteractionState,
  );
  const [canvasStatus, setCanvasStatus] =
    useState<SourceCanvasStatus>("idle");
  const [companionTarget, setCompanionTarget] =
    useState<HTMLElement | null>(null);
  const [feedbackRemainingMs, setFeedbackRemainingMs] =
    useState<number | null>(null);
  const feedbackRemainingMsRef = useRef<number | null>(null);
  const rendererRef = useRef<HTMLDivElement>(null);
  const visualHostRef = useRef<HTMLDivElement>(null);
  const lastFocusedControlRef = useRef<string | null>(null);

  const requestedFrameDomain = props.frameDomain ?? SOURCE_DOMAIN;
  const deterministicEvidenceCapture =
    isDeterministicEvidenceCapture(props);
  const interactionEnabled =
    props.frame === FUNCTIONAL_ENTRY_FRAME
    && requestedFrameDomain === SOURCE_DOMAIN
    && props.scenario === SOURCE_SCENARIO
    && props.lang === "en"
    && !deterministicEvidenceCapture;
  const sourceVisualFrame = useMemo(
    () =>
      interactionEnabled
        ? donorFrameForInteraction(interaction)
        : props.frame,
    [interaction.frame, interactionEnabled, props.frame],
  );
  const donorSourceVisualState = useMemo(
    () =>
      candidate.getFrameState(sourceVisualFrame, {
        entryStateSha256: props.entryStateSha256,
        frameDomain: requestedFrameDomain,
        lang: props.lang,
        requirementId: props.requirementId,
        scenario: props.scenario,
        seed: props.seed,
        traceId: props.traceId,
      }),
    [
      props.entryStateSha256,
      props.lang,
      props.requirementId,
      props.scenario,
      props.seed,
      props.traceId,
      requestedFrameDomain,
      sourceVisualFrame,
    ],
  );
  const sourceVisualState = interactionEnabled
    ? donorSourceVisualState
    : props.state;
  const sourceCanvasRenderKey =
    `source-ts008-${props.replay ?? 0}-${props.seed}-${sourceVisualFrame}`;
  const controlsReady =
    interactionEnabled && canvasStatus === "ready";
  const feedbackIdentity = interaction.feedback
    ? `${interaction.feedback.kind}-${interaction.feedback.branch}-${interaction.feedback.choiceId}-${interaction.wrongTryCount}`
    : "";

  useEffect(() => {
    dispatch({type: "replay", seed: props.seed});
    feedbackRemainingMsRef.current = null;
    setFeedbackRemainingMs(null);
    setCanvasStatus(interactionEnabled ? "loading" : "idle");
  }, [interactionEnabled, props.replay, props.seed]);

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
    setCanvasStatus("loading");
    const update = () => {
      const sourceCandidate = host.querySelector<HTMLElement>(
        '[data-candidate-status="source-static-engineering-not-strict"]'
        + '[data-canvas-status]',
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
  }, [interactionEnabled, sourceCanvasRenderKey]);

  useEffect(() => {
    const feedback = interaction.feedback;
    if (!feedback) {
      feedbackRemainingMsRef.current = null;
      setFeedbackRemainingMs(null);
      return;
    }
    const duration = props.reducedMotion
      ? 0
      : feedback.sourceWindow.projectedDurationMs;
    feedbackRemainingMsRef.current = duration;
    setFeedbackRemainingMs(duration);
  }, [feedbackIdentity, props.reducedMotion]);

  useEffect(() => {
    if (
      interaction.phase !== "feedback"
      || !interaction.feedback
      || !controlsReady
      || props.paused
      || props.reducedMotion
    ) {
      return;
    }
    const remaining = feedbackRemainingMsRef.current;
    if (remaining === null) return;
    if (remaining <= 0) {
      dispatch({type: "feedback-complete"});
      return;
    }

    const startedAt = performance.now();
    let fired = false;
    const timeout = window.setTimeout(() => {
      fired = true;
      feedbackRemainingMsRef.current = null;
      setFeedbackRemainingMs(0);
      dispatch({type: "feedback-complete"});
    }, remaining);
    return () => {
      window.clearTimeout(timeout);
      if (fired) return;
      const nextRemaining = Math.max(
        0,
        (feedbackRemainingMsRef.current ?? 0)
          - (performance.now() - startedAt),
      );
      feedbackRemainingMsRef.current = nextRemaining;
      setFeedbackRemainingMs(nextRemaining);
    };
  }, [
    controlsReady,
    feedbackIdentity,
    interaction.feedback,
    interaction.phase,
    props.paused,
    props.reducedMotion,
  ]);

  useEffect(() => {
    if (!interactionEnabled || !controlsReady) return;
    const frame = window.requestAnimationFrame(() => {
      findVisibleFocusTarget(
        [rendererRef.current, companionTarget],
        interaction.focusTarget,
      )?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [
    companionTarget,
    controlsReady,
    interaction.focusTarget,
    interactionEnabled,
  ]);

  useEffect(() => {
    const media = window.matchMedia(RESPONSIVE_CONTROLS_MEDIA);
    const migrateFocus = () => {
      const active = document.activeElement;
      const focusTarget =
        active instanceof HTMLElement
          ? active.dataset.ts008FocusControl
            ?? lastFocusedControlRef.current
            ?? interaction.focusTarget
          : lastFocusedControlRef.current ?? interaction.focusTarget;
      window.requestAnimationFrame(() => {
        findVisibleFocusTarget(
          [rendererRef.current, companionTarget],
          focusTarget,
        )?.focus();
      });
    };
    media.addEventListener("change", migrateFocus);
    return () => media.removeEventListener("change", migrateFocus);
  }, [companionTarget, interaction.focusTarget]);

  const finishFeedback = () => {
    feedbackRemainingMsRef.current = null;
    setFeedbackRemainingMs(null);
    dispatch({type: "feedback-complete"});
  };
  const closeNeedMoreHelp = () => {
    dispatch({type: "close-need-more-help"});
  };
  const replay = () => {
    feedbackRemainingMsRef.current = null;
    setFeedbackRemainingMs(null);
    dispatch({type: "replay", seed: props.seed});
    props.onReplay?.();
  };
  const sharedSurfaceProps: SharedSurfaceProps = {
    canvasStatus,
    controlsReady,
    dispatch,
    feedbackRemainingMs,
    interaction,
    onCloseNeedMoreHelp: closeNeedMoreHelp,
    onFinishFeedback: finishFeedback,
    onFocusControl: (key) => {
      lastFocusedControlRef.current = key;
    },
    onReplay: replay,
    paused: props.paused ?? false,
    reducedMotion: props.reducedMotion ?? false,
  };
  const mobileSurface = (
    <MobileSurface
      {...sharedSurfaceProps}
      placement={companionTarget ? "portal" : "fallback"}
    />
  );

  return (
    <div
      data-associated-audio-modeled="false"
      data-authoritative-baseline-accepted="false"
      data-behavior-parity-established="false"
      data-current-js-controls-enabled={interactionEnabled ? "true" : "false"}
      data-current-js-controls-ready={controlsReady ? "true" : "false"}
      data-current-js-functional-entry={
        `${SOURCE_DOMAIN}:${FUNCTIONAL_ENTRY_FRAME}:${SOURCE_SCENARIO}:en`
      }
      data-current-js-modern-reconstruction={
        interactionEnabled ? "true" : "false"
      }
      data-current-js-overlay-count={interactionEnabled ? "1" : "0"}
      data-current-js-source-visual-frame={sourceVisualFrame}
      data-deterministic-evidence-capture={
        deterministicEvidenceCapture ? "true" : "false"
      }
      data-feedback-random-parity-established="false"
      data-glossary-host-resolved="false"
      data-human-visual-review-accepted="false"
      data-natural-composite-established="false"
      data-natural-composite-unsafe-frames={
        SOURCE_COMPOSITE_UNSAFE_FRAMES.join(",")
      }
      data-original-runtime-natural-trace-accepted="false"
      data-owner-accepted="false"
      data-source-composite-unsafe={
        interactionEnabled
        && SOURCE_COMPOSITE_UNSAFE_FRAMES.includes(interaction.frame)
          ? "true"
          : "false"
      }
      data-source-visual-parity-established="false"
      data-strict-acceptance-effect="none"
      data-strict-migration-complete="false"
      data-lesson-published="false"
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
            ? event.target.dataset.ts008FocusControl ?? null
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
        .course-g04-l03-ts-008-mobile-fallback-slot,
        .course-g04-l03-ts-008-mobile-controls {
          display: none;
        }

        .course-g04-l03-ts-008-stage-surface button {
          font-family: ${SOURCE_FONT};
        }

        .course-g04-l03-ts-008-stage-surface button:focus-visible,
        .course-g04-l03-ts-008-stage-surface
        [tabindex="-1"]:focus-visible {
          outline: 4px solid #ffdf00;
          outline-offset: 3px;
        }

        .course-g04-l03-ts-008-stage-modern-label {
          align-items: center;
          background: rgb(11 43 85 / 94%);
          border: 2px solid #fff;
          border-radius: 9px;
          color: #fff;
          display: flex;
          font-family: system-ui, sans-serif;
          font-size: 13px;
          gap: 9px;
          left: 176px;
          margin: 0;
          padding: 6px 11px;
          pointer-events: none;
          position: absolute;
          top: 10px;
          z-index: 8;
        }

        .course-g04-l03-ts-008-stage-modern-label strong {
          color: #ffe34e;
          white-space: nowrap;
        }

        .course-g04-l03-ts-008-stage-step-content {
          background: #fff8f5;
          box-sizing: border-box;
          color: #080808;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          line-height: 1.13;
          overflow: hidden;
          padding: 8px 9px;
          pointer-events: none;
          position: absolute;
          z-index: 2;
        }

        .course-g04-l03-ts-008-stage-step-content p {
          margin: 1px 0;
        }

        .course-g04-l03-ts-008-stage-step-content--2 {
          font-size: 13px;
        }

        .course-g04-l03-ts-008-stage-step-content--3,
        .course-g04-l03-ts-008-stage-step-content--4 {
          font-size: 9.5px;
        }

        .course-g04-l03-ts-008-step-heading {
          font-weight: 850;
        }

        .course-g04-l03-ts-008-source-hit-button {
          background: rgb(255 255 255 / 1%);
          border: 2px solid transparent;
          color: transparent;
          cursor: pointer;
          font-size: 1px;
          margin: 0;
          padding: 0;
          pointer-events: auto;
          position: absolute;
          z-index: 4;
        }

        .course-g04-l03-ts-008-source-hit-button:focus-visible {
          background: rgb(255 255 255 / 16%);
          border-color: #001d6d;
          box-shadow: 0 0 0 4px #ffdf00;
          outline: none !important;
        }

        .course-g04-l03-ts-008-stage-close,
        .course-g04-l03-ts-008-stage-help-button,
        .course-g04-l03-ts-008-stage-feedback button,
        .course-g04-l03-ts-008-stage-dialog button,
        .course-g04-l03-ts-008-stage-terminal button {
          background: linear-gradient(#fff36b, #48cbd2);
          border: 2px solid #173f80;
          border-radius: 999px;
          color: #111;
          cursor: pointer;
          font-weight: 850;
          pointer-events: auto;
        }

        .course-g04-l03-ts-008-stage-close {
          font-size: 13px;
          min-height: 32px;
          padding: 4px 13px;
          position: absolute;
          z-index: 6;
        }

        .course-g04-l03-ts-008-stage-help-button {
          box-sizing: border-box;
          font-size: 11px;
          padding: 2px 5px;
          position: absolute;
          z-index: 6;
        }

        .course-g04-l03-ts-008-stage-surface button:disabled {
          cursor: default;
          opacity: .55;
        }

        .course-g04-l03-ts-008-stage-feedback,
        .course-g04-l03-ts-008-stage-dialog {
          background: #fffde0;
          border: 4px solid #164986;
          border-radius: 16px;
          box-shadow: 0 10px 30px rgb(0 0 0 / 32%);
          box-sizing: border-box;
          color: #102b49;
          display: grid;
          font-family: system-ui, sans-serif;
          gap: 8px;
          padding: 16px 22px;
          pointer-events: auto;
          position: absolute;
          text-align: center;
          z-index: 9;
        }

        .course-g04-l03-ts-008-stage-feedback {
          left: 160px;
          top: 165px;
          width: 480px;
        }

        .course-g04-l03-ts-008-stage-feedback > *,
        .course-g04-l03-ts-008-stage-dialog > * {
          margin: 0;
        }

        .course-g04-l03-ts-008-stage-feedback strong,
        .course-g04-l03-ts-008-stage-dialog > strong {
          font-size: 23px;
        }

        .course-g04-l03-ts-008-stage-feedback button,
        .course-g04-l03-ts-008-stage-dialog > button {
          justify-self: center;
          min-height: 38px;
          padding: 5px 18px;
        }

        .course-g04-l03-ts-008-help-number-line {
          align-items: center;
          border-top: 3px solid #183d92;
          display: flex;
          justify-content: space-between;
          margin-top: 8px !important;
          padding-top: 4px;
        }

        .course-g04-l03-ts-008-help-number-line span:nth-child(n + 3) {
          color: #d11616;
        }

        .course-g04-l03-ts-008-help-glossary {
          display: flex;
          gap: 7px;
          justify-content: center;
        }

        .course-g04-l03-ts-008-help-glossary button {
          background: #eef3f9;
          border-radius: 7px;
          font-size: 11px;
          min-height: 28px;
          padding: 3px 7px;
        }

        .course-g04-l03-ts-008-stage-terminal {
          align-items: center;
          background: rgb(255 255 255 / 96%);
          border: 3px solid #164986;
          border-radius: 14px;
          bottom: 24px;
          box-shadow: 0 5px 16px rgb(0 0 0 / 24%);
          display: flex;
          font-family: system-ui, sans-serif;
          gap: 13px;
          justify-content: center;
          left: 154px;
          padding: 10px 16px;
          pointer-events: auto;
          position: absolute;
          right: 154px;
        }

        .course-g04-l03-ts-008-stage-terminal button {
          min-height: 38px;
          padding: 5px 16px;
        }

        @media ${RESPONSIVE_CONTROLS_MEDIA} {
          .course-g04-l03-ts-008-stage-surface {
            display: none;
          }

          .course-g04-l03-ts-008-mobile-fallback-slot {
            aspect-ratio: 4 / 3;
            display: block;
            inset: 0 0 auto;
            pointer-events: none;
            position: absolute;
            width: 100%;
            z-index: 5;
          }

          .course-g04-l03-ts-008-mobile-controls {
            background: #e9f7ff;
            border: 2px solid #224b8e;
            border-radius: 12px;
            box-sizing: border-box;
            color: #111;
            display: grid;
            font-family: system-ui, sans-serif;
            gap: 10px;
            padding: 12px;
          }

          .course-g04-l03-ts-008-mobile-controls--fallback {
            inset: 3%;
            max-height: 94%;
            overflow: auto;
            pointer-events: auto;
            position: absolute;
          }

          .course-g04-l03-ts-008-mobile-controls--portal {
            margin: 12px 0;
            max-width: 100%;
            pointer-events: auto;
            position: relative;
            width: 100%;
          }

          .course-g04-l03-ts-008-modern-label {
            display: grid;
            font-size: 13px;
            gap: 2px;
            margin: 0;
            text-align: center;
          }

          .course-g04-l03-ts-008-modern-label strong {
            color: #163f82;
          }

          .course-g04-l03-ts-008-mobile-loading,
          .course-g04-l03-ts-008-mobile-question {
            font-size: 15px;
            line-height: 1.32;
            margin: 0;
            text-align: center;
          }

          .course-g04-l03-ts-008-mobile-steps {
            display: grid;
            gap: 8px;
          }

          .course-g04-l03-ts-008-mobile-steps article {
            background: #fff8f5;
            border: 2px solid #ef9b6c;
            border-radius: 10px;
            display: grid;
            font-family: ${SOURCE_FONT};
            font-size: 13px;
            gap: 3px;
            padding: 9px;
          }

          .course-g04-l03-ts-008-mobile-steps article p {
            line-height: 1.25;
            margin: 0;
          }

          .course-g04-l03-ts-008-mobile-action,
          .course-g04-l03-ts-008-mobile-choices {
            display: grid;
            gap: 8px;
            grid-template-columns: repeat(2, minmax(48px, 1fr));
          }

          .course-g04-l03-ts-008-mobile-controls button {
            background: linear-gradient(#fff36b, #48cbd2);
            border: 2px solid #173f80;
            border-radius: 10px;
            box-sizing: border-box;
            color: #111;
            cursor: pointer;
            font-size: 16px;
            font-weight: 800;
            min-height: 48px;
            min-width: 48px;
            padding: 8px 10px;
          }

          .course-g04-l03-ts-008-mobile-choices button {
            align-items: center;
            display: flex;
            gap: 9px;
            justify-content: center;
          }

          .course-g04-l03-ts-008-mobile-choices button strong {
            background: #ffcf18;
            border-radius: 999px;
            display: grid;
            height: 30px;
            place-items: center;
            width: 30px;
          }

          .course-g04-l03-ts-008-mobile-controls button:focus-visible,
          .course-g04-l03-ts-008-mobile-controls
          [tabindex="-1"]:focus-visible {
            box-shadow: 0 0 0 3px #ffdf00;
            outline: 3px solid #001d6d;
            outline-offset: 2px;
          }

          .course-g04-l03-ts-008-mobile-controls button:disabled {
            cursor: default;
            opacity: .56;
          }

          .course-g04-l03-ts-008-mobile-feedback,
          .course-g04-l03-ts-008-mobile-dialog,
          .course-g04-l03-ts-008-mobile-terminal {
            background: #fffde0;
            border: 3px solid #164986;
            border-radius: 12px;
            display: grid;
            gap: 8px;
            padding: 12px;
            text-align: center;
          }

          .course-g04-l03-ts-008-mobile-feedback > *,
          .course-g04-l03-ts-008-mobile-dialog > *,
          .course-g04-l03-ts-008-mobile-terminal > * {
            margin: 0;
          }

          .course-g04-l03-ts-008-help-number-line {
            font-size: 13px;
          }

          .course-g04-l03-ts-008-help-glossary {
            display: grid;
            grid-template-columns: repeat(3, minmax(48px, 1fr));
          }
        }

        @media (max-width: 390px) {
          .course-g04-l03-ts-008-mobile-action,
          .course-g04-l03-ts-008-mobile-choices,
          .course-g04-l03-ts-008-help-glossary {
            grid-template-columns: 1fr;
          }
        }

        @media (min-width: 1280px) and (any-pointer: coarse) {
          .course-g04-l03-ts-008-mobile-controls--portal {
            grid-column: 1 / -1;
            grid-row: 7;
          }
        }
      `}</style>

      <div
        aria-hidden={interactionEnabled ? true : undefined}
        data-source-canvas-accessibility-isolated={
          interactionEnabled ? "true" : "false"
        }
        inert={interactionEnabled ? true : undefined}
        ref={visualHostRef}
        style={{pointerEvents: interactionEnabled ? "none" : undefined}}
      >
        <SourceStaticRenderer
          key={`${sourceCanvasRenderKey}-${
            interactionEnabled ? "interactive" : "source"
          }`}
          {...props}
          frame={sourceVisualFrame}
          state={sourceVisualState}
        />
      </div>

      {interactionEnabled ? (
        <>
          <SourceGlossaryBoundary />
          <StageSurface {...sharedSurfaceProps} />
          {companionTarget
            ? createPortal(mobileSurface, companionTarget)
            : (
                <div className="course-g04-l03-ts-008-mobile-fallback-slot">
                  {mobileSurface}
                </div>
              )}
          <p style={visuallyHiddenStyle}>
            This current-JavaScript functional overlay uses clean donor frames.
            Natural source composites at frames 592, 712, and 770; feedback
            artwork and audio; original-runtime parity; human review; owner
            acceptance; strict completion; and publication are not established.
          </p>
        </>
      ) : null}
    </div>
  );
}

export {COURSE_G04_L03_TS_008_SOURCE};
export const COURSE_G04_L03_TS_008_MOVIE = candidate.movie;
export const COURSE_G04_L03_TS_008_RUNTIME = candidate.runtime;
export const COURSE_G04_L03_TS_008_SOURCE_CONTRACT = Object.freeze({
  ...candidate.sourceContract,
  currentJavascriptInteractionStatus:
    "source-script-bound-modern-reconstruction-functional-candidate",
  currentJavascriptFunctionalEntry: Object.freeze({
    frameDomain: SOURCE_DOMAIN,
    frame: FUNCTIONAL_ENTRY_FRAME,
    scenario: SOURCE_SCENARIO,
    language: "en",
    deterministicCaptureOverlayEnabled: false,
  }),
  currentJavascriptInteractionScope: Object.freeze([
    "four-source-reasoning-steps-with-two-reveal-then-close-gates",
    "source-mapped-a-through-d-answer-controls-with-d-correct",
    "seeded-three-wrong-and-four-right-source-copy-projections",
    "first-wrong-retry-and-second-wrong-or-correct-terminal-projection",
    "source-number-line-need-more-help-popup-modern-reconstruction",
    "three-source-glossary-callbacks-safe-disabled",
    "pause-freezes-feedback-remaining-time",
    "reduced-motion-static-feedback-held-until-continue",
    "whole-state-replay-reset-and-source-canvas-remount",
    "responsive-mobile-and-coarse-pointer-companion-surface",
    "wide-coarse-companion-grid-row-seven",
    "desktop-mobile-focus-migration-and-modal-close-focus-return",
    "functional-source-canvas-aria-inert-and-pointer-event-isolated",
    "controls-fail-closed-until-donor-canvas-ready",
    "deterministic-entry-state-capture-preserves-requested-frame-with-zero-overlay",
  ]),
  currentJavascriptDonorPolicy: COURSE_G04_L03_TS_008_DONOR_POLICY,
  sourceCompositeUnsafeFrames: SOURCE_COMPOSITE_UNSAFE_FRAMES,
  sourceCompositeEstablished: false,
  sourceVisualParityEstablished: false,
  sourceFeedbackVisualParityEstablished: false,
  sourceRandomParityEstablished: false,
  sourceTimingParityEstablished: false,
  associatedAudioModeled: false,
  needMoreHelpSourceVisualAccepted: false,
  glossaryHostCallbacks: "safe-disabled-unresolved",
  pauseAndReducedMotionPolicy: COURSE_G04_L03_TS_008_PLAYBACK_POLICY,
  interactionAuthority: COURSE_G04_L03_TS_008_INTERACTION_AUTHORITY,
  behaviorParityEstablished: false,
  replayParityEstablished: false,
  ownerAccepted: false,
  strictMigrationComplete: false,
  lessonPublished: false,
  strictAcceptanceEffect: "none",
});
export const COURSE_G04_L03_TS_008_SCENARIOS = candidate.scenarios;
export const normalizeCourseG04L03Ts008Frame = candidate.normalizeFrame;
export const getCourseG04L03Ts008FrameState = candidate.getFrameState;
export const buildCourseG04L03Ts008CaptureAttributes =
  candidate.buildCaptureAttributes;

export default Object.freeze({
  ...candidate.module,
  reducedMotionFrame: FUNCTIONAL_ENTRY_FRAME,
  Renderer: CourseG04L03Ts008Renderer,
});
