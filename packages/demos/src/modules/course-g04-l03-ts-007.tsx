"use client";

import React, {
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import type {Dispatch, KeyboardEvent, RefObject} from "react";
import {createPortal} from "react-dom";

import type {AnimationRendererProps} from "../contract";
import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G04_L03_TS_007_CHOICES,
  COURSE_G04_L03_TS_007_GLOSSARY,
  COURSE_G04_L03_TS_007_INTERACTION_AUTHORITY,
  COURSE_G04_L03_TS_007_PLAYBACK_POLICY,
  COURSE_G04_L03_TS_007_QUESTION,
  createCourseG04L03Ts007InteractionState,
  reduceCourseG04L03Ts007Interaction,
  type CourseG04L03Ts007Choice,
  type CourseG04L03Ts007InteractionAction,
  type CourseG04L03Ts007InteractionState,
} from "../timelines/course-g04-l03-ts-007-practice-question-interaction";
import {
  COURSE_G04_L03_TS_007_CONFIG,
  COURSE_G04_L03_TS_007_SOURCE,
} from "../timelines/course-g04-l03-ts-007";

const candidate = createSourceStaticCanvasCandidate(
  COURSE_G04_L03_TS_007_CONFIG,
);
const SourceStaticRenderer = candidate.Renderer;

const SOURCE_DOMAIN = "sprite-441";
const SOURCE_SCENARIO = "source-static-frame";
const FUNCTIONAL_ENTRY_FRAME = 235;
const QUIZ_DONOR_FRAME = 680;
const RESPONSIVE_CONTROLS_MEDIA =
  "(max-width: 640px), (any-pointer: coarse)";
const SOURCE_FONT =
  '"Bauhaus Md BT", "Arial Rounded MT Bold", "Trebuchet MS", ui-rounded, sans-serif';

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

const SOURCE_VISUAL_DONOR_MAP = Object.freeze({
  walkthrough0: 235,
  walkthrough1: 373,
  walkthrough2: 500,
  walkthrough3: 617,
  quiz: QUIZ_DONOR_FRAME,
  feedback: QUIZ_DONOR_FRAME,
  needMoreHelp: QUIZ_DONOR_FRAME,
  terminal: 696,
});

const NATURAL_COMPOSITE_UNRESOLVED_FRAMES = Object.freeze([
  373,
  500,
  617,
  679,
]);

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
  interaction: CourseG04L03Ts007InteractionState,
) {
  if (
    interaction.phase === "walkthrough"
    && interaction.walkthroughGate !== null
  ) {
    return SOURCE_VISUAL_DONOR_MAP[
      `walkthrough${interaction.walkthroughGate}` as
        | "walkthrough0"
        | "walkthrough1"
        | "walkthrough2"
        | "walkthrough3"
    ];
  }
  if (interaction.phase === "terminal") {
    return SOURCE_VISUAL_DONOR_MAP.terminal;
  }
  return SOURCE_VISUAL_DONOR_MAP.quiz;
}

function accessibleChoiceLabel(choice: CourseG04L03Ts007Choice) {
  const location =
    choice.numberLineLocation < 0
      ? `negative ${Math.abs(choice.numberLineLocation)}`
      : String(choice.numberLineLocation);
  return `${choice.id}. ${choice.symbol}, located at ${location}`;
}

function feedbackCopy(
  interaction: CourseG04L03Ts007InteractionState,
) {
  const feedback = interaction.feedback;
  if (!feedback) return "";
  if (feedback.kind === "right") {
    return "Correct. The heart, answer B, is located at negative two.";
  }
  return interaction.wrongTryCount === 0
    ? "That answer is not correct. After this feedback, try the question again."
    : "That answer is not correct. This is the second try; the activity will continue to its terminal state.";
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
    event.currentTarget.querySelector<HTMLButtonElement>("button")?.focus();
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
          `[data-ts007-focus-control="${target}"]`,
        ),
      ),
    )
    .find(
      (control) =>
        control.getClientRects().length > 0
        && !control.hasAttribute("disabled"),
    );
}

interface SharedSurfaceProps {
  readonly canvasStatus: SourceCanvasStatus;
  readonly controlsReady: boolean;
  readonly dispatch: Dispatch<CourseG04L03Ts007InteractionAction>;
  readonly feedbackRemainingMs: number | null;
  readonly interaction: CourseG04L03Ts007InteractionState;
  readonly onCloseNeedMoreHelp: () => void;
  readonly onFinishFeedback: () => void;
  readonly onReplay: () => void;
  readonly paused: boolean;
  readonly reducedMotion: boolean;
}

interface MobileSurfaceProps extends SharedSurfaceProps {
  readonly placement: "fallback" | "portal";
}

function MobileSurface({
  canvasStatus,
  controlsReady,
  dispatch,
  feedbackRemainingMs,
  interaction,
  onCloseNeedMoreHelp,
  onFinishFeedback,
  onReplay,
  paused,
  placement,
  reducedMotion,
}: MobileSurfaceProps) {
  const controlsDisabled = !controlsReady || paused;
  return (
    <section
      aria-label="Current-JavaScript practice question controls"
      className={
        "course-g04-l03-ts-007-mobile-controls " +
        `course-g04-l03-ts-007-mobile-controls--${placement}`
      }
      data-current-js-modern-reconstruction="true"
      data-interaction-companion-placement={placement}
      data-interaction-companion-surface="mobile"
      data-interaction-phase={interaction.phase}
      data-source-canvas-status={canvasStatus}
    >
      <p className="course-g04-l03-ts-007-modern-label">
        <strong>Modern reconstruction</strong>
        <span>
          Current-JavaScript controls; source natural composite and visual
          parity are not established.
        </span>
      </p>

      {!controlsReady ? (
        <p
          aria-live={canvasStatus === "error" ? "assertive" : "polite"}
          className="course-g04-l03-ts-007-loading"
          role={canvasStatus === "error" ? "alert" : "status"}
        >
          {sourceCanvasStatusMessage(canvasStatus)}
        </p>
      ) : null}

      {interaction.phase === "walkthrough" ? (
        <>
          <p>
            Walkthrough checkpoint{" "}
            {(interaction.walkthroughGate ?? 0) + 1} of 4.
          </p>
          <button
            data-ts007-focus-control="walkthrough-continue"
            disabled={controlsDisabled}
            onClick={() => dispatch({type: "continue-walkthrough"})}
            type="button"
          >
            Continue
          </button>
        </>
      ) : null}

      {interaction.phase === "quiz" ? (
        <>
          <p className="course-g04-l03-ts-007-question">
            {COURSE_G04_L03_TS_007_QUESTION.prompt}
          </p>
          <div
            aria-label="Answer choices"
            className="course-g04-l03-ts-007-mobile-choices"
            role="group"
          >
            {COURSE_G04_L03_TS_007_CHOICES.map((choice) => (
              <button
                aria-label={accessibleChoiceLabel(choice)}
                data-ts007-focus-control={`choice-${choice.id}`}
                disabled={controlsDisabled}
                key={choice.id}
                onClick={() =>
                  dispatch({type: "choose", choiceId: choice.id})}
                type="button"
              >
                <strong>{choice.id}</strong>
                <span>{choice.symbol}</span>
              </button>
            ))}
          </div>
          <button
            data-ts007-focus-control="need-more-help"
            disabled={controlsDisabled}
            onClick={() => dispatch({type: "open-need-more-help"})}
            type="button"
          >
            Need More Help
          </button>
          <div
            aria-label="Unavailable glossary links"
            className="course-g04-l03-ts-007-mobile-glossary"
            role="group"
          >
            {COURSE_G04_L03_TS_007_GLOSSARY.map(({term}) => (
              <button
                aria-label={`${term} glossary is unavailable because the legacy host callback is unresolved`}
                disabled
                key={term}
                type="button"
              >
                {term} glossary unavailable
              </button>
            ))}
          </div>
        </>
      ) : null}

      {interaction.phase === "feedback" && interaction.feedback ? (
        <div
          aria-atomic="true"
          aria-live="assertive"
          className="course-g04-l03-ts-007-mobile-feedback"
          data-feedback-branch={`${interaction.feedback.kind}${interaction.feedback.branch}`}
          data-feedback-source-visual-parity-established="false"
          data-ts007-focus-control="feedback-status"
          role="status"
          tabIndex={-1}
        >
          <strong>{interaction.feedback.kind === "right" ? "Correct" : "Try again"}</strong>
          <p>{feedbackCopy(interaction)}</p>
          <p>
            Accessible current-JavaScript feedback branch{" "}
            {interaction.feedback.kind}
            {interaction.feedback.branch}; source feedback artwork is not
            reproduced.
          </p>
          <p>
            {paused
              ? `Paused with ${formatRemainingMs(feedbackRemainingMs)} remaining.`
              : reducedMotion
                ? "Motion is reduced; feedback is held until Continue."
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
          aria-describedby="course-g04-l03-ts-007-mobile-help-copy"
          aria-label="Need More Help"
          aria-modal="true"
          className="course-g04-l03-ts-007-mobile-dialog"
          onKeyDown={(event) => handleModalKeys(event, onCloseNeedMoreHelp)}
          role="dialog"
        >
          <strong>Need More Help</strong>
          <p id="course-g04-l03-ts-007-mobile-help-copy">
            Think about where negative two appears between negative four and
            zero. This is accessible modern guidance; source popup visual
            parity is not established.
          </p>
          <button
            data-ts007-focus-control="need-more-help-close"
            disabled={!controlsReady}
            onClick={onCloseNeedMoreHelp}
            type="button"
          >
            Close
          </button>
        </div>
      ) : null}

      {interaction.phase === "terminal" ? (
        <div
          aria-live="polite"
          className="course-g04-l03-ts-007-mobile-complete"
          data-ts007-focus-control="terminal"
          role="status"
          tabIndex={-1}
        >
          <strong>Question complete</strong>
          <p>Use Replay to restart the complete walkthrough and quiz state.</p>
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

function StageSurface({
  canvasStatus,
  controlsReady,
  dispatch,
  feedbackRemainingMs,
  interaction,
  onCloseNeedMoreHelp,
  onFinishFeedback,
  onReplay,
  paused,
  reducedMotion,
}: SharedSurfaceProps) {
  const controlsDisabled = !controlsReady || paused;
  return (
    <svg
      aria-label="Current-JavaScript reconstructed walkthrough and practice controls"
      className="course-g04-l03-ts-007-stage-surface"
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
          <p className="course-g04-l03-ts-007-stage-modern-label">
            <strong>Modern reconstruction</strong>
            <span>
              Source natural composite and visual parity are not established.
            </span>
          </p>

          {!controlsReady ? (
            <span
              aria-live={canvasStatus === "error" ? "assertive" : "polite"}
              role={canvasStatus === "error" ? "alert" : "status"}
              style={visuallyHiddenStyle}
            >
              {sourceCanvasStatusMessage(canvasStatus)}
            </span>
          ) : null}

          {interaction.phase === "walkthrough" ? (
            <div className="course-g04-l03-ts-007-stage-walkthrough">
              <span>
                Checkpoint {(interaction.walkthroughGate ?? 0) + 1} of 4
              </span>
              <button
                data-ts007-focus-control="walkthrough-continue"
                disabled={controlsDisabled}
                onClick={() => dispatch({type: "continue-walkthrough"})}
                type="button"
              >
                Continue
              </button>
            </div>
          ) : null}

          {interaction.phase === "quiz" ? (
            <>
              <span style={visuallyHiddenStyle}>
                {COURSE_G04_L03_TS_007_QUESTION.prompt}
              </span>
              <div aria-label="Answer choices" role="group">
                {COURSE_G04_L03_TS_007_CHOICES.map((choice) => (
                  <button
                    aria-label={accessibleChoiceLabel(choice)}
                    className="course-g04-l03-ts-007-source-hit-button"
                    data-source-button-object-id={choice.sourceButtonObjectId}
                    data-source-instance={choice.sourceInstance}
                    data-ts007-focus-control={`choice-${choice.id}`}
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
              <div className="course-g04-l03-ts-007-stage-utilities">
                <button
                  data-ts007-focus-control="need-more-help"
                  disabled={controlsDisabled}
                  onClick={() => dispatch({type: "open-need-more-help"})}
                  type="button"
                >
                  Need More Help
                </button>
                {COURSE_G04_L03_TS_007_GLOSSARY.map(({term}) => (
                  <button
                    aria-label={`${term} glossary is unavailable because the legacy host callback is unresolved`}
                    disabled
                    key={term}
                    type="button"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </>
          ) : null}

          {interaction.phase === "feedback" && interaction.feedback ? (
            <div
              aria-atomic="true"
              aria-live="assertive"
              className="course-g04-l03-ts-007-stage-feedback"
              data-feedback-branch={`${interaction.feedback.kind}${interaction.feedback.branch}`}
              data-feedback-source-visual-parity-established="false"
              data-ts007-focus-control="feedback-status"
              role="status"
              tabIndex={-1}
            >
              <strong>
                {interaction.feedback.kind === "right"
                  ? "Correct"
                  : "Try again"}
              </strong>
              <p>{feedbackCopy(interaction)}</p>
              <p>
                Modern accessible feedback{" "}
                {interaction.feedback.kind}
                {interaction.feedback.branch}; source feedback artwork is not
                shown.
              </p>
              <p>
                {paused
                  ? `Paused with ${formatRemainingMs(feedbackRemainingMs)} remaining.`
                  : reducedMotion
                    ? "Reduced motion: held until Continue."
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
              aria-describedby="course-g04-l03-ts-007-stage-help-copy"
              aria-label="Need More Help"
              aria-modal="true"
              className="course-g04-l03-ts-007-stage-dialog"
              onKeyDown={(event) =>
                handleModalKeys(event, onCloseNeedMoreHelp)}
              role="dialog"
            >
              <strong>Need More Help</strong>
              <p id="course-g04-l03-ts-007-stage-help-copy">
                Find negative two between negative four and zero. This is
                accessible modern guidance; source popup visual parity is not
                established.
              </p>
              <button
                data-ts007-focus-control="need-more-help-close"
                disabled={!controlsReady}
                onClick={onCloseNeedMoreHelp}
                type="button"
              >
                Close
              </button>
            </div>
          ) : null}

          {interaction.phase === "terminal" ? (
            <div
              aria-live="polite"
              className="course-g04-l03-ts-007-stage-terminal"
              data-ts007-focus-control="terminal"
              role="status"
              tabIndex={-1}
            >
              <strong>Question complete</strong>
              <span>Replay resets the full reconstructed state.</span>
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

export function CourseG04L03Ts007Renderer(props: AnimationRendererProps) {
  const [interaction, dispatch] = useReducer(
    reduceCourseG04L03Ts007Interaction,
    props.seed,
    createCourseG04L03Ts007InteractionState,
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
  const interactionEnabled =
    props.frame === FUNCTIONAL_ENTRY_FRAME
    && requestedFrameDomain === SOURCE_DOMAIN
    && props.scenario === SOURCE_SCENARIO
    && props.lang === "en"
    && !isDeterministicEvidenceCapture(props);
  const sourceVisualFrame = interactionEnabled
    ? donorFrameForInteraction(interaction)
    : props.frame;
  const sourceVisualState = useMemo(
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
  const controlsReady = interactionEnabled && canvasStatus === "ready";
  const feedbackIdentity = interaction.feedback
    ? `${interaction.feedback.kind}-${interaction.feedback.branch}-${interaction.feedback.choiceId}-${interaction.wrongTryCount}`
    : "";

  useEffect(() => {
    dispatch({type: "replay", seed: props.seed});
    feedbackRemainingMsRef.current = null;
    setFeedbackRemainingMs(null);
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
  }, [interactionEnabled, props.replay, sourceVisualFrame]);

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
      const root = rendererRef.current;
      if (!root) return;
      const active = document.activeElement;
      const focusTarget =
        active instanceof HTMLElement
          ? active.dataset.ts007FocusControl
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
      data-current-js-functional-entry={
        `${SOURCE_DOMAIN}:${FUNCTIONAL_ENTRY_FRAME}:${SOURCE_SCENARIO}:en`
      }
      data-current-js-modern-reconstruction={
        interactionEnabled ? "true" : "false"
      }
      data-current-js-source-visual-frame={sourceVisualFrame}
      data-feedback-random-parity-established="false"
      data-human-visual-review-accepted="false"
      data-natural-composite-established="false"
      data-natural-composite-unresolved-frames={
        NATURAL_COMPOSITE_UNRESOLVED_FRAMES.join(",")
      }
      data-original-runtime-natural-trace-accepted="false"
      data-owner-accepted="false"
      data-source-visual-parity-established="false"
      data-strict-acceptance-effect="none"
      data-strict-migration-complete="false"
      data-lesson-published="false"
      onFocusCapture={(event) => {
        lastFocusedControlRef.current =
          event.target instanceof HTMLElement
            ? event.target.dataset.ts007FocusControl ?? null
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
        .course-g04-l03-ts-007-mobile-fallback-slot,
        .course-g04-l03-ts-007-mobile-controls {
          display: none;
        }

        .course-g04-l03-ts-007-stage-surface button {
          font-family: ${SOURCE_FONT};
        }

        .course-g04-l03-ts-007-stage-surface
        button:focus-visible,
        .course-g04-l03-ts-007-stage-surface
        [tabindex="-1"]:focus-visible {
          outline: 4px solid #ffdf00;
          outline-offset: 3px;
        }

        .course-g04-l03-ts-007-stage-modern-label {
          align-items: center;
          background: rgb(11 43 85 / 94%);
          border: 2px solid #fff;
          border-radius: 9px;
          color: #fff;
          display: flex;
          font-family: system-ui, sans-serif;
          font-size: 14px;
          gap: 10px;
          left: 184px;
          margin: 0;
          padding: 7px 12px;
          pointer-events: none;
          position: absolute;
          top: 12px;
          z-index: 5;
        }

        .course-g04-l03-ts-007-stage-modern-label strong {
          color: #ffe34e;
          white-space: nowrap;
        }

        .course-g04-l03-ts-007-stage-walkthrough,
        .course-g04-l03-ts-007-stage-terminal {
          align-items: center;
          background: rgb(255 255 255 / 96%);
          border: 3px solid #164986;
          border-radius: 14px;
          bottom: 28px;
          box-shadow: 0 5px 16px rgb(0 0 0 / 24%);
          display: flex;
          gap: 16px;
          justify-content: center;
          left: 210px;
          padding: 10px 16px;
          pointer-events: auto;
          position: absolute;
          right: 210px;
        }

        .course-g04-l03-ts-007-stage-walkthrough button,
        .course-g04-l03-ts-007-stage-terminal button,
        .course-g04-l03-ts-007-stage-feedback button,
        .course-g04-l03-ts-007-stage-dialog button,
        .course-g04-l03-ts-007-stage-utilities button {
          background: linear-gradient(#fff36b, #48cbd2);
          border: 2px solid #173f80;
          border-radius: 999px;
          color: #111;
          cursor: pointer;
          font-size: 17px;
          font-weight: 800;
          min-height: 42px;
          padding: 6px 16px;
        }

        .course-g04-l03-ts-007-stage-surface button:disabled {
          cursor: default;
          opacity: .55;
        }

        .course-g04-l03-ts-007-source-hit-button {
          background: rgb(255 255 255 / 1%);
          border: 2px solid transparent;
          color: transparent;
          cursor: pointer;
          font-size: 1px;
          margin: 0;
          padding: 0;
          pointer-events: auto;
          position: absolute;
        }

        .course-g04-l03-ts-007-source-hit-button:focus-visible {
          background: rgb(255 255 255 / 14%);
          border-color: #001d6d;
          box-shadow: 0 0 0 4px #ffdf00;
          outline: none !important;
        }

        .course-g04-l03-ts-007-stage-utilities {
          bottom: 18px;
          display: flex;
          gap: 8px;
          left: 24px;
          pointer-events: auto;
          position: absolute;
        }

        .course-g04-l03-ts-007-stage-utilities button {
          font-family: system-ui, sans-serif;
          font-size: 13px;
          min-height: 40px;
          padding-inline: 12px;
        }

        .course-g04-l03-ts-007-stage-feedback,
        .course-g04-l03-ts-007-stage-dialog {
          background: #fffde0;
          border: 4px solid #164986;
          border-radius: 16px;
          box-shadow: 0 10px 30px rgb(0 0 0 / 32%);
          color: #102b49;
          display: grid;
          font-family: system-ui, sans-serif;
          gap: 9px;
          left: 160px;
          padding: 20px 24px;
          pointer-events: auto;
          position: absolute;
          text-align: center;
          top: 160px;
          width: 432px;
          z-index: 7;
        }

        .course-g04-l03-ts-007-stage-feedback > *,
        .course-g04-l03-ts-007-stage-dialog > * {
          margin: 0;
        }

        .course-g04-l03-ts-007-stage-feedback strong,
        .course-g04-l03-ts-007-stage-dialog strong {
          font-size: 24px;
        }

        .course-g04-l03-ts-007-stage-feedback button,
        .course-g04-l03-ts-007-stage-dialog button {
          justify-self: center;
        }

        @media ${RESPONSIVE_CONTROLS_MEDIA} {
          .course-g04-l03-ts-007-stage-surface {
            display: none;
          }

          .course-g04-l03-ts-007-mobile-fallback-slot {
            aspect-ratio: 4 / 3;
            display: block;
            inset: 0 0 auto;
            pointer-events: none;
            position: absolute;
            width: 100%;
            z-index: 5;
          }

          .course-g04-l03-ts-007-mobile-controls {
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

          .course-g04-l03-ts-007-mobile-controls--fallback {
            inset: 3%;
            max-height: 94%;
            overflow: auto;
            pointer-events: auto;
            position: absolute;
          }

          .course-g04-l03-ts-007-mobile-controls--portal {
            margin: 12px 0;
            max-width: 100%;
            pointer-events: auto;
            position: relative;
            width: 100%;
          }

          .course-g04-l03-ts-007-modern-label {
            display: grid;
            font-size: 13px;
            gap: 2px;
            margin: 0;
            text-align: center;
          }

          .course-g04-l03-ts-007-modern-label strong {
            color: #163f82;
          }

          .course-g04-l03-ts-007-loading,
          .course-g04-l03-ts-007-question,
          .course-g04-l03-ts-007-mobile-controls > p {
            font-size: 16px;
            line-height: 1.3;
            margin: 0;
            text-align: center;
          }

          .course-g04-l03-ts-007-mobile-choices,
          .course-g04-l03-ts-007-mobile-glossary {
            display: grid;
            gap: 9px;
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .course-g04-l03-ts-007-mobile-controls button {
            background: linear-gradient(#fff36b, #48cbd2);
            border: 2px solid #173f80;
            border-radius: 12px;
            box-sizing: border-box;
            color: #111;
            cursor: pointer;
            font-size: 16px;
            font-weight: 800;
            min-height: 48px;
            min-width: 48px;
            padding: 8px 10px;
          }

          .course-g04-l03-ts-007-mobile-choices button {
            display: grid;
            gap: 2px;
          }

          .course-g04-l03-ts-007-mobile-choices button span {
            font-size: 13px;
            font-weight: 600;
          }

          .course-g04-l03-ts-007-mobile-controls
          button:focus-visible,
          .course-g04-l03-ts-007-mobile-controls
          [tabindex="-1"]:focus-visible {
            box-shadow: 0 0 0 3px #ffdf00;
            outline: 3px solid #001d6d;
            outline-offset: 2px;
          }

          .course-g04-l03-ts-007-mobile-controls button:disabled {
            cursor: default;
            opacity: .56;
          }

          .course-g04-l03-ts-007-mobile-feedback,
          .course-g04-l03-ts-007-mobile-dialog,
          .course-g04-l03-ts-007-mobile-complete {
            background: #fffde0;
            border: 3px solid #164986;
            border-radius: 12px;
            display: grid;
            gap: 8px;
            padding: 12px;
            text-align: center;
          }

          .course-g04-l03-ts-007-mobile-feedback > *,
          .course-g04-l03-ts-007-mobile-dialog > *,
          .course-g04-l03-ts-007-mobile-complete > * {
            margin: 0;
          }
        }

        @media (min-width: 1280px) and (any-pointer: coarse) {
          .course-g04-l03-ts-007-mobile-controls--portal {
            grid-column: 1 / -1;
            grid-row: 7;
          }
        }
      `}</style>

      <div
        aria-hidden={interactionEnabled ? true : undefined}
        inert={interactionEnabled ? true : undefined}
        ref={visualHostRef}
        style={{pointerEvents: "none"}}
      >
        <SourceStaticRenderer
          {...props}
          frame={sourceVisualFrame}
          state={sourceVisualState}
        />
      </div>

      {interactionEnabled ? (
        <>
          <StageSurface {...sharedSurfaceProps} />
          {companionTarget
            ? createPortal(mobileSurface, companionTarget)
            : (
                <div className="course-g04-l03-ts-007-mobile-fallback-slot">
                  {mobileSurface}
                </div>
              )}
          <p style={visuallyHiddenStyle}>
            This is an accessibility and interaction reconstruction over
            current-JavaScript donor frames. Natural source composites at
            frames 373, 500, 617, and 679; source feedback visuals; random
            parity; audio; original-runtime parity; human review; owner
            acceptance; strict completion; and publication are not established.
          </p>
        </>
      ) : null}
    </div>
  );
}

export {COURSE_G04_L03_TS_007_SOURCE};
export const COURSE_G04_L03_TS_007_MOVIE = candidate.movie;
export const COURSE_G04_L03_TS_007_RUNTIME = candidate.runtime;
export const COURSE_G04_L03_TS_007_SOURCE_CONTRACT = Object.freeze({
  ...candidate.sourceContract,
  currentJavascriptInteractionStatus:
    "modern-reconstruction-functional-candidate",
  currentJavascriptFunctionalEntry: Object.freeze({
    frameDomain: SOURCE_DOMAIN,
    frame: FUNCTIONAL_ENTRY_FRAME,
    scenario: SOURCE_SCENARIO,
    language: "en",
    entryStateCaptureOverlayEnabled: false,
  }),
  currentJavascriptSourceVisualDonors: SOURCE_VISUAL_DONOR_MAP,
  naturalCompositeUnresolvedFrames: NATURAL_COMPOSITE_UNRESOLVED_FRAMES,
  naturalCompositeEstablished: false,
  sourceVisualParityEstablished: false,
  sourceFeedbackVisualParityEstablished: false,
  sourceRandomParityEstablished: false,
  sourceTimingParityEstablished: false,
  associatedAudioModeled: false,
  needMoreHelpSourceVisualAccepted: false,
  glossaryHostCallbacks: "safe-disabled-unresolved",
  pauseAndReducedMotionPolicy: COURSE_G04_L03_TS_007_PLAYBACK_POLICY,
  interactionAuthority: COURSE_G04_L03_TS_007_INTERACTION_AUTHORITY,
  behaviorParityEstablished: false,
  replayParityEstablished: false,
  ownerAccepted: false,
  strictMigrationComplete: false,
  lessonPublished: false,
  strictAcceptanceEffect: "none",
});
export const getCourseG04L03Ts007FrameState = candidate.getFrameState;

export default Object.freeze({
  ...candidate.module,
  reducedMotionFrame: FUNCTIONAL_ENTRY_FRAME,
  Renderer: CourseG04L03Ts007Renderer,
});
