"use client";

import React, {
  useEffect,
  useReducer,
  useRef,
  useState,
} from "react";
import type {DragEvent, RefObject} from "react";
import {createPortal} from "react-dom";

import type {AnimationRendererProps} from "../contract";
import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G04_L03_IN_006_CURRENT_JS_TIMING,
  COURSE_G04_L03_IN_006_JUMP_MAGNITUDES,
  createCourseG04L03In006NumberLineJumpState,
  reduceCourseG04L03In006NumberLineJumpInteraction,
} from "../timelines/course-g04-l03-in-006-number-line-jump-interaction";
import {
  COURSE_G04_L03_IN_006_CONFIG,
  COURSE_G04_L03_IN_006_SOURCE,
} from "../timelines/course-g04-l03-in-006";

const candidate = createSourceStaticCanvasCandidate(
  COURSE_G04_L03_IN_006_CONFIG,
);
const SourceStaticRenderer = candidate.Renderer;

const SOURCE_QUIZ_FRAME = 1_054;
const SOURCE_QUIZ_DOMAIN = "sprite-151";
const SOURCE_QUIZ_SCENARIO = "source-static-frame";
const SOURCE_PANEL_BACKGROUND = "#e9f3fd";
const SOURCE_FONT =
  '"Arial Rounded MT Bold", "Trebuchet MS", ui-rounded, sans-serif';
const RESPONSIVE_CONTROLS_MEDIA =
  "(max-width: 640px), (any-pointer: coarse)";
const NUMBER_LINE_MIN = -15;
const NUMBER_LINE_MAX = 15;
const NUMBER_LINE_FIRST_TICK_X = 64;
const NUMBER_LINE_TICK_SPACING = 22.5;

type CanvasStatus = "idle" | "loading" | "ready" | "error" | "blocked";
type InteractionState = ReturnType<
  typeof createCourseG04L03In006NumberLineJumpState
>;
type JumpMagnitude = (typeof COURSE_G04_L03_IN_006_JUMP_MAGNITUDES)[number];

const visuallyHiddenStyle = {
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  height: 1,
  overflow: "hidden",
  position: "absolute",
  whiteSpace: "nowrap",
  width: 1,
} as const;

const sourceHitRegionStyle = {
  background: "transparent",
  border: "2px solid transparent",
  boxSizing: "border-box",
  color: "transparent",
  cursor: "pointer",
  fontSize: 1,
  margin: 0,
  padding: 0,
  pointerEvents: "auto",
  position: "absolute",
} as const;

const JUMP_SOURCE_HIT_REGIONS = Object.freeze({
  1: Object.freeze({left: 255, top: 383, width: 44, height: 44}),
  2: Object.freeze({left: 298, top: 379, width: 62, height: 44}),
  4: Object.freeze({left: 359, top: 369, width: 113, height: 54}),
  5: Object.freeze({left: 469, top: 356, width: 135, height: 67}),
}) satisfies Readonly<Record<JumpMagnitude, Readonly<{
  left: number;
  top: number;
  width: number;
  height: number;
}>>>;

function isDeterministicEvidenceCapture({
  entryStateSha256,
}: AnimationRendererProps) {
  return Boolean(entryStateSha256);
}

function isVisible(element: HTMLElement) {
  return element.getClientRects().length > 0
    && window.getComputedStyle(element).visibility !== "hidden";
}

function focusRenderedControl(
  preferred: RefObject<HTMLElement | null>,
  fallback: RefObject<HTMLElement | null>,
) {
  window.requestAnimationFrame(() => {
    const preferredControl = preferred.current;
    const control = preferredControl && isVisible(preferredControl)
      ? preferredControl
      : fallback.current;
    control?.focus();
  });
}

function numberLineX(value: number) {
  return NUMBER_LINE_FIRST_TICK_X
    + (value - NUMBER_LINE_MIN) * NUMBER_LINE_TICK_SPACING;
}

function formatSigned(value: number) {
  return value >= 0 ? `+${value}` : `${value}`;
}

interface JumpHistoryProps {
  readonly interaction: InteractionState;
}

function JumpHistory({interaction}: JumpHistoryProps) {
  if (interaction.jumps.length === 0) {
    return <span>No jumps placed yet.</span>;
  }
  return (
    <span>
      {interaction.jumps.map((jump) => (
        <span key={jump.id}>
          {jump.id === interaction.jumps[0]?.id ? "" : " · "}
          {jump.start} {formatSigned(jump.signedDelta)} = {jump.end}
        </span>
      ))}
    </span>
  );
}

interface MobileSurfaceProps {
  readonly canvasStatus: CanvasStatus;
  readonly closeWrongRef: RefObject<HTMLButtonElement | null>;
  readonly controlsReady: boolean;
  readonly interaction: InteractionState;
  readonly newNumberRef: RefObject<HTMLButtonElement | null>;
  readonly onClear: () => void;
  readonly onCloseWrong: () => void;
  readonly onNewNumber: () => void;
  readonly onPlace: () => void;
  readonly onReverse: () => void;
  readonly onSelectMagnitude: (magnitude: JumpMagnitude) => void;
  readonly placement: "fallback" | "portal";
  readonly selectedMagnitude: JumpMagnitude | null;
}

function MobileSurface({
  canvasStatus,
  closeWrongRef,
  controlsReady,
  interaction,
  newNumberRef,
  onClear,
  onCloseWrong,
  onNewNumber,
  onPlace,
  onReverse,
  onSelectMagnitude,
  placement,
  selectedMagnitude,
}: MobileSurfaceProps) {
  const controlsLocked = !controlsReady || interaction.locked;
  const dialogOpen = interaction.outcome === "wrong";
  const currentOutOfRange =
    interaction.currentValue < NUMBER_LINE_MIN
    || interaction.currentValue > NUMBER_LINE_MAX;

  return (
    <section
      aria-label="Number-line jump controls"
      className={`course-g04-l03-in-006-mobile-controls course-g04-l03-in-006-mobile-controls--${placement}`}
      data-current-question-id={interaction.currentQuestion.id}
      data-interaction-companion-placement={placement}
      data-interaction-companion-surface="mobile"
      data-interaction-outcome={interaction.outcome}
      data-source-script-bound="true"
    >
      <p className="course-g04-l03-in-006-mobile-instruction">
        Click and drag the jumps to the number line to jump from the first
        point to the target number using as few arrows as possible.
      </p>
      <div className="course-g04-l03-in-006-mobile-summary">
        <p>
          <span>Question</span>
          <strong>{interaction.start} to {interaction.target}</strong>
        </p>
        <p>
          <span>Current position</span>
          <strong>{interaction.currentValue}</strong>
        </p>
        <p>
          <span>Equation</span>
          <strong>{interaction.equation || "—"}</strong>
        </p>
      </div>
      <fieldset disabled={controlsLocked || dialogOpen}>
        <legend>Select a reusable jump</legend>
        <div className="course-g04-l03-in-006-mobile-jump-grid">
          {COURSE_G04_L03_IN_006_JUMP_MAGNITUDES.map((magnitude) => (
            <button
              aria-label={`Select jump ${magnitude} to the right`}
              aria-pressed={selectedMagnitude === magnitude}
              data-in006-focus-control={`jump-${magnitude}`}
              key={magnitude}
              onClick={() => onSelectMagnitude(magnitude)}
              type="button"
            >
              +{magnitude}
            </button>
          ))}
        </div>
      </fieldset>
      <div className="course-g04-l03-in-006-mobile-primary-actions">
        <button
          data-in006-focus-control="place"
          disabled={
            controlsLocked || dialogOpen || selectedMagnitude === null
          }
          onClick={onPlace}
          type="button"
        >
          {selectedMagnitude === null
            ? "Select a jump"
            : `Place +${selectedMagnitude} jump`}
        </button>
        <button
          data-in006-focus-control="reverse"
          disabled={
            controlsLocked
            || dialogOpen
            || interaction.lastJumpId === null
          }
          onClick={onReverse}
          type="button"
        >
          Reverse last jump
        </button>
      </div>
      <p
        aria-live="polite"
        className="course-g04-l03-in-006-mobile-history"
        role="status"
      >
        <JumpHistory interaction={interaction} />
        {currentOutOfRange ? (
          <strong>
            {" "}The current position is outside the source number line.
            Reverse the last jump before placing another.
          </strong>
        ) : null}
      </p>
      <div className="course-g04-l03-in-006-mobile-secondary-actions">
        <button
          data-in006-focus-control="clear"
          disabled={!controlsReady || dialogOpen}
          onClick={onClear}
          type="button"
        >
          Clear
        </button>
        <button
          data-in006-focus-control="new-number"
          disabled={
            !controlsReady
            || dialogOpen
            || !interaction.newNumberEnabled
          }
          onClick={onNewNumber}
          ref={newNumberRef}
          type="button"
        >
          New Number
        </button>
      </div>
      {!controlsReady ? (
        <p aria-live="polite" className="course-g04-l03-in-006-mobile-loading">
          {canvasStatus === "error" || canvasStatus === "blocked"
            ? "The source visual is unavailable, so answer controls remain disabled."
            : "Loading the source visual…"}
        </p>
      ) : null}
      {interaction.outcome === "correct-feedback" ? (
        <div
          aria-live="assertive"
          className="course-g04-l03-in-006-mobile-correct"
          role="status"
        >
          <strong>Correct!!!</strong>
        </div>
      ) : null}
      {interaction.outcome === "complete" ? (
        <span aria-live="polite" role="status" style={visuallyHiddenStyle}>
          Correct. Choose New Number to continue, or Clear to try this
          question again.
        </span>
      ) : null}
      {dialogOpen ? (
        <div
          aria-describedby="course-g04-l03-in-006-mobile-wrong-copy"
          aria-label="Invalid jump placement feedback"
          className="course-g04-l03-in-006-mobile-dialog"
          role="alertdialog"
        >
          <p id="course-g04-l03-in-006-mobile-wrong-copy">
            {interaction.feedback || "Try again."}
          </p>
          <small>
            This text is a modern accessible companion; the source used audio
            for an invalid drop.
          </small>
          <button
            aria-label="Close feedback and try the same jump again"
            data-in006-focus-control="close-wrong"
            onClick={onCloseWrong}
            ref={closeWrongRef}
            type="button"
          >
            Close
          </button>
        </div>
      ) : null}
    </section>
  );
}

interface StageSurfaceProps {
  readonly canvasStatus: CanvasStatus;
  readonly closeWrongRef: RefObject<HTMLButtonElement | null>;
  readonly controlsReady: boolean;
  readonly dragAcceptedRef: RefObject<boolean>;
  readonly interaction: InteractionState;
  readonly newNumberRef: RefObject<HTMLButtonElement | null>;
  readonly onClear: () => void;
  readonly onCloseWrong: () => void;
  readonly onInvalidDrop: () => void;
  readonly onNewNumber: () => void;
  readonly onPlace: (magnitude?: JumpMagnitude) => void;
  readonly onReverse: () => void;
  readonly onSelectMagnitude: (magnitude: JumpMagnitude) => void;
  readonly selectedMagnitude: JumpMagnitude | null;
}

function StageSurface({
  canvasStatus,
  closeWrongRef,
  controlsReady,
  dragAcceptedRef,
  interaction,
  newNumberRef,
  onClear,
  onCloseWrong,
  onInvalidDrop,
  onNewNumber,
  onPlace,
  onReverse,
  onSelectMagnitude,
  selectedMagnitude,
}: StageSurfaceProps) {
  const controlsLocked = !controlsReady || interaction.locked;
  const dialogOpen = interaction.outcome === "wrong";
  const markerId = "course-g04-l03-in-006-jump-arrowhead";

  const startDrag = (
    event: DragEvent<HTMLButtonElement>,
    magnitude: JumpMagnitude,
  ) => {
    dragAcceptedRef.current = false;
    onSelectMagnitude(magnitude);
    event.dataTransfer.effectAllowed = "copy";
    event.dataTransfer.setData("text/plain", String(magnitude));
  };
  const finishDrag = () => {
    if (!dragAcceptedRef.current) onInvalidDrop();
    dragAcceptedRef.current = false;
  };
  const acceptDrop = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    const parsed = Number(event.dataTransfer.getData("text/plain"));
    const magnitude = COURSE_G04_L03_IN_006_JUMP_MAGNITUDES.find(
      (candidateMagnitude) => candidateMagnitude === parsed,
    );
    if (magnitude === undefined) {
      onInvalidDrop();
      return;
    }
    dragAcceptedRef.current = true;
    onPlace(magnitude);
  };

  return (
    <div
      aria-label="Source-script-bound current JavaScript number-line jump controls"
      className="course-g04-l03-in-006-stage-surface"
      data-audio-feedback="inventoried-unimplemented-unaccepted"
      data-behavior-parity-established="false"
      data-current-js-functional-candidate="true"
      data-current-question-id={interaction.currentQuestion.id}
      data-interaction-outcome={interaction.outcome}
      data-legacy-actionscript-executed="false"
      data-source-script-bound="true"
      role="group"
      style={{
        inset: 0,
        pointerEvents: "none",
        position: "absolute",
        zIndex: 3,
      }}
    >
      <svg
        aria-hidden="true"
        height="100%"
        style={{
          inset: 0,
          overflow: "hidden",
          pointerEvents: "none",
          position: "absolute",
          width: "100%",
        }}
        viewBox="0 0 800 600"
        width="100%"
      >
        <defs>
          <marker
            id={markerId}
            markerHeight="7"
            markerUnits="strokeWidth"
            markerWidth="8"
            orient="auto"
            refX="7"
            refY="3.5"
            viewBox="0 0 8 7"
          >
            <path d="M0 0 L8 3.5 L0 7 Z" fill="#b90000" />
          </marker>
        </defs>
        {interaction.jumps.map((jump, index) => {
          const x1 = numberLineX(jump.start);
          const x2 = numberLineX(jump.end);
          const lift = 21 + jump.magnitude * 4 + (index % 3) * 7;
          const midpoint = (x1 + x2) / 2;
          return (
            <g data-jump-id={jump.id} key={jump.id}>
              <path
                d={`M ${x1} 310 Q ${midpoint} ${310 - lift} ${x2} 310`}
                fill="none"
                markerEnd={`url(#${markerId})`}
                stroke="#b90000"
                strokeLinecap="round"
                strokeWidth="2.4"
              />
              <circle cx={x1} cy="310" fill="#fff" r="5.5" stroke="#b90000" strokeWidth="2" />
            </g>
          );
        })}
      </svg>

      {interaction.questionRevision > 0 ? (
        <div
          aria-hidden="true"
          data-dynamic-question-overlay="true"
          style={{
            alignItems: "center",
            background: SOURCE_PANEL_BACKGROUND,
            color: "#111",
            display: "flex",
            fontFamily: SOURCE_FONT,
            fontSize: 20,
            height: 52.05,
            justifyContent: "center",
            left: 75.35,
            lineHeight: 1,
            pointerEvents: "none",
            position: "absolute",
            top: 198,
            width: 194,
          }}
        >
          {interaction.start} to {interaction.target}
        </div>
      ) : null}
      {interaction.equation ? (
        <div
          aria-hidden="true"
          data-dynamic-equation-overlay="true"
          style={{
            alignItems: "center",
            background: SOURCE_PANEL_BACKGROUND,
            color: "#111",
            display: "flex",
            fontFamily: SOURCE_FONT,
            fontSize: 18,
            height: 52.05,
            justifyContent: "center",
            left: 535.35,
            lineHeight: 1,
            pointerEvents: "none",
            position: "absolute",
            top: 198,
            width: 194,
          }}
        >
          {interaction.equation}
        </div>
      ) : null}

      {COURSE_G04_L03_IN_006_JUMP_MAGNITUDES.map((magnitude) => {
        const region = JUMP_SOURCE_HIT_REGIONS[magnitude];
        const disabled = controlsLocked || dialogOpen;
        return (
          <button
            aria-label={`Jump ${magnitude} to the right. Drag it to the number line or select it, then choose the number line.`}
            aria-pressed={selectedMagnitude === magnitude}
            data-in006-focus-control={`jump-${magnitude}`}
            disabled={disabled}
            draggable={!disabled}
            key={magnitude}
            onClick={() => onSelectMagnitude(magnitude)}
            onDragEnd={finishDrag}
            onDragStart={(event) => startDrag(event, magnitude)}
            style={{
              ...sourceHitRegionStyle,
              borderColor:
                selectedMagnitude === magnitude ? "#ffdd29" : "transparent",
              height: region.height,
              left: region.left,
              outlineOffset: 2,
              top: region.top,
              width: region.width,
            }}
            type="button"
          >
            Jump {magnitude}
          </button>
        );
      })}

      <button
        aria-label={
          selectedMagnitude === null
            ? "Number line drop target. Select a jump first."
            : `Place selected jump ${selectedMagnitude} on the number line`
        }
        data-in006-focus-control="place"
        disabled={
          controlsLocked || dialogOpen || selectedMagnitude === null
        }
        onClick={() => onPlace()}
        onDragOver={(event) => {
          if (!controlsLocked && !dialogOpen) event.preventDefault();
        }}
        onDrop={acceptDrop}
        style={{
          ...sourceHitRegionStyle,
          height: 91,
          left: 51.625,
          outlineOffset: -4,
          top: 245,
          width: 708.25,
        }}
        type="button"
      >
        Place selected jump on the number line
      </button>
      <button
        aria-label="Reverse the most recently placed jump"
        data-in006-focus-control="reverse"
        disabled={
          controlsLocked || dialogOpen || interaction.lastJumpId === null
        }
        onClick={onReverse}
        style={{
          ...sourceHitRegionStyle,
          height: 52,
          left: 363,
          outlineOffset: 2,
          top: 425,
          width: 77,
        }}
        type="button"
      >
        Reverse last jump
      </button>
      <button
        aria-label="New Number"
        data-in006-focus-control="new-number"
        disabled={
          !controlsReady
          || dialogOpen
          || !interaction.newNumberEnabled
        }
        onClick={onNewNumber}
        ref={newNumberRef}
        style={{
          ...sourceHitRegionStyle,
          height: 48,
          left: 165.225,
          outlineOffset: 2,
          top: 433,
          width: 147.35,
        }}
        type="button"
      >
        New Number
      </button>
      <button
        aria-label="Clear"
        data-in006-focus-control="clear"
        disabled={!controlsReady || dialogOpen}
        onClick={onClear}
        style={{
          ...sourceHitRegionStyle,
          height: 48,
          left: 488,
          outlineOffset: 2,
          top: 433,
          width: 81,
        }}
        type="button"
      >
        Clear
      </button>

      <span aria-live="polite" role="status" style={visuallyHiddenStyle}>
        Question {interaction.start} to {interaction.target}. Current position{" "}
        {interaction.currentValue}. {interaction.equation}
        {interaction.outcome === "complete"
          ? " Correct. Choose New Number to continue."
          : ""}
      </span>

      {interaction.outcome === "correct-feedback" ? (
        <div
          aria-live="assertive"
          data-source-correct-copy="true"
          role="status"
          style={{
            alignItems: "center",
            background: "#ffffc8",
            border: "4px solid #7d178e",
            borderRadius: 14,
            boxShadow: "0 7px 20px rgb(0 0 0 / 20%)",
            boxSizing: "border-box",
            color: "#111",
            display: "flex",
            fontFamily: SOURCE_FONT,
            fontSize: 36,
            height: 130.5,
            justifyContent: "center",
            left: 244.725,
            pointerEvents: "none",
            position: "absolute",
            top: 258.1,
            width: 360.65,
            zIndex: 5,
          }}
        >
          Correct!!!
        </div>
      ) : null}

      {dialogOpen ? (
        <div
          aria-describedby="course-g04-l03-in-006-stage-wrong-copy"
          aria-label="Invalid jump placement feedback"
          role="alertdialog"
          style={{
            alignContent: "center",
            background: "#ffffcc",
            border: "4px solid #224b8e",
            borderRadius: 12,
            boxShadow: "0 8px 24px rgb(0 0 0 / 28%)",
            boxSizing: "border-box",
            display: "grid",
            gap: 9,
            left: 244.725,
            minHeight: 130.5,
            padding: 16,
            pointerEvents: "auto",
            position: "absolute",
            textAlign: "center",
            top: 258.1,
            width: 360.65,
            zIndex: 6,
          }}
        >
          <p
            id="course-g04-l03-in-006-stage-wrong-copy"
            style={{
              font: `700 18px/1.25 system-ui, sans-serif`,
              margin: 0,
            }}
          >
            {interaction.feedback || "Try again."}
          </p>
          <small style={{font: "13px/1.25 system-ui, sans-serif"}}>
            Modern accessible text companion; the source used audio.
          </small>
          <button
            aria-label="Close feedback and try the same jump again"
            data-in006-focus-control="close-wrong"
            onClick={onCloseWrong}
            ref={closeWrongRef}
            style={{
              background: "#fff",
              border: "2px solid #224b8e",
              borderRadius: 8,
              color: "#111",
              font: `800 16px ${SOURCE_FONT}`,
              minHeight: 44,
            }}
            type="button"
          >
            Close
          </button>
        </div>
      ) : null}

      {!controlsReady ? (
        <span aria-live="polite" role="status" style={visuallyHiddenStyle}>
          {canvasStatus === "error" || canvasStatus === "blocked"
            ? "The source visual is unavailable. Answer controls are disabled."
            : "Loading the source visual. Answer controls are disabled."}
        </span>
      ) : null}
    </div>
  );
}

export function CourseG04L03In006Renderer(props: AnimationRendererProps) {
  const [interaction, dispatch] = useReducer(
    reduceCourseG04L03In006NumberLineJumpInteraction,
    props.seed,
    createCourseG04L03In006NumberLineJumpState,
  );
  const [canvasStatus, setCanvasStatus] = useState<CanvasStatus>("idle");
  const [companionTarget, setCompanionTarget] =
    useState<HTMLElement | null>(null);
  const [selectedMagnitude, setSelectedMagnitude] =
    useState<JumpMagnitude | null>(null);
  const rendererRef = useRef<HTMLDivElement>(null);
  const visualHostRef = useRef<HTMLDivElement>(null);
  const dragAcceptedRef = useRef(false);
  const lastFocusedControlRef = useRef<string | null>(null);
  const stageWrongCloseRef = useRef<HTMLButtonElement>(null);
  const mobileWrongCloseRef = useRef<HTMLButtonElement>(null);
  const stageNewNumberRef = useRef<HTMLButtonElement>(null);
  const mobileNewNumberRef = useRef<HTMLButtonElement>(null);
  const correctFeedbackRemainingMs = useRef(
    COURSE_G04_L03_IN_006_CURRENT_JS_TIMING.correctFeedbackMs,
  );

  const frameDomain = props.frameDomain ?? SOURCE_QUIZ_DOMAIN;
  const deterministicEvidenceCapture =
    isDeterministicEvidenceCapture(props);
  const interactionEnabled =
    props.frame === SOURCE_QUIZ_FRAME
    && frameDomain === SOURCE_QUIZ_DOMAIN
    && props.scenario === SOURCE_QUIZ_SCENARIO
    && props.lang === "en"
    && !deterministicEvidenceCapture;
  const controlsReady =
    interactionEnabled && canvasStatus === "ready";
  const sourceCanvasRenderKey = [
    props.replay ?? 0,
    props.seed,
    props.frame,
    deterministicEvidenceCapture ? "capture" : "product",
  ].join("-");

  const focusControl = (focusControlKey: string) => {
    window.requestAnimationFrame(() => {
      const roots = companionTarget
        ? [rendererRef.current, companionTarget]
        : [rendererRef.current];
      const control = roots
        .filter((root): root is HTMLElement => root !== null)
        .flatMap((root) => Array.from(root.querySelectorAll<HTMLElement>(
          `[data-in006-focus-control="${focusControlKey}"]`,
        )))
        .find((element) =>
          isVisible(element) && !element.hasAttribute("disabled")
        );
      control?.focus();
    });
  };

  useEffect(() => {
    dispatch({type: "replay"});
    setSelectedMagnitude(null);
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
  }, [interactionEnabled, props.replay, props.seed]);

  useEffect(() => {
    correctFeedbackRemainingMs.current =
      COURSE_G04_L03_IN_006_CURRENT_JS_TIMING.correctFeedbackMs;
  }, [interaction.currentValue, interaction.questionRevision]);

  useEffect(() => {
    if (interaction.outcome !== "correct-feedback") return;
    if (props.reducedMotion) {
      dispatch({type: "feedback-complete"});
      focusControl("new-number");
      return;
    }
    if (props.paused) return;

    const startedAt = performance.now();
    const timeout = window.setTimeout(() => {
      correctFeedbackRemainingMs.current =
        COURSE_G04_L03_IN_006_CURRENT_JS_TIMING.correctFeedbackMs;
      dispatch({type: "feedback-complete"});
      focusControl("new-number");
    }, correctFeedbackRemainingMs.current);
    return () => {
      window.clearTimeout(timeout);
      correctFeedbackRemainingMs.current = Math.max(
        0,
        correctFeedbackRemainingMs.current - (performance.now() - startedAt),
      );
    };
  }, [interaction.outcome, props.paused, props.reducedMotion]);

  useEffect(() => {
    if (interaction.outcome === "wrong") {
      focusRenderedControl(mobileWrongCloseRef, stageWrongCloseRef);
    } else if (interaction.outcome === "correct-feedback") {
      setSelectedMagnitude(null);
      focusControl("clear");
    } else if (interaction.outcome === "complete") {
      focusRenderedControl(mobileNewNumberRef, stageNewNumberRef);
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
        && (root.contains(active) || companionTarget?.contains(active) === true);
      const focusControlKey =
        activeWithinInteraction && active instanceof HTMLElement
          ? active.dataset.in006FocusControl
          : lastFocusedControlRef.current;
      if (focusControlKey) focusControl(focusControlKey);
    };

    media.addEventListener("change", moveFocusToVisibleSurface);
    return () => media.removeEventListener("change", moveFocusToVisibleSurface);
  }, [companionTarget]);

  const selectMagnitude = (magnitude: JumpMagnitude) => {
    setSelectedMagnitude(magnitude);
  };
  const place = (magnitude = selectedMagnitude ?? undefined) => {
    if (magnitude === undefined) return;
    dispatch({type: "place", magnitude});
  };
  const invalidDrop = () => {
    dispatch({type: "invalid-drop"});
  };
  const reverse = () => {
    dispatch({type: "reverse-last"});
  };
  const clear = () => {
    dispatch({type: "clear"});
    setSelectedMagnitude(null);
    focusControl("jump-1");
  };
  const closeWrong = () => {
    dispatch({type: "close-wrong"});
    focusControl(
      selectedMagnitude === null ? "jump-1" : `jump-${selectedMagnitude}`,
    );
  };
  const newNumber = () => {
    dispatch({type: "new-number"});
    setSelectedMagnitude(null);
    focusControl("jump-1");
  };

  const mobileSurface = (
    <MobileSurface
      canvasStatus={canvasStatus}
      closeWrongRef={mobileWrongCloseRef}
      controlsReady={controlsReady}
      interaction={interaction}
      newNumberRef={mobileNewNumberRef}
      onClear={clear}
      onCloseWrong={closeWrong}
      onNewNumber={newNumber}
      onPlace={() => place()}
      onReverse={reverse}
      onSelectMagnitude={selectMagnitude}
      placement={companionTarget ? "portal" : "fallback"}
      selectedMagnitude={selectedMagnitude}
    />
  );

  return (
    <div
      data-behavior-parity-established="false"
      data-current-js-controls-enabled={interactionEnabled ? "true" : "false"}
      data-current-js-controls-ready={controlsReady ? "true" : "false"}
      data-current-js-functional-candidate={
        interactionEnabled ? "true" : "false"
      }
      data-current-js-functional-scope="in006-number-line-jumps-source-script-bound"
      data-current-js-source-visual-frame={props.frame}
      data-deterministic-evidence-capture={
        deterministicEvidenceCapture ? "true" : "false"
      }
      data-owner-accepted="false"
      data-replay-parity-established="false"
      data-source-contract-descriptor-current="false"
      data-strict-acceptance-effect="none"
      data-strict-migration-complete="false"
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
            ? event.target.dataset.in006FocusControl ?? null
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
        .course-g04-l03-in-006-mobile-fallback-slot,
        .course-g04-l03-in-006-mobile-controls {
          display: none;
        }

        .course-g04-l03-in-006-stage-surface button:focus-visible {
          border-color: #001d6d !important;
          box-shadow: 0 0 0 4px #ffdd29;
          outline: 2px solid #fff;
          outline-offset: 2px;
        }

        @media ${RESPONSIVE_CONTROLS_MEDIA} {
          .course-g04-l03-in-006-stage-surface {
            display: none;
          }

          .course-g04-l03-in-006-mobile-fallback-slot {
            aspect-ratio: 4 / 3;
            display: block;
            inset: 0 0 auto;
            pointer-events: none;
            position: absolute;
            width: 100%;
            z-index: 4;
          }

          .course-g04-l03-in-006-mobile-controls {
            background: #e9f7ff;
            border: 2px solid #224b8e;
            border-radius: 12px;
            box-sizing: border-box;
            color: #111;
            display: grid;
            font-family: ${SOURCE_FONT};
            gap: 10px;
            padding: 12px;
          }

          .course-g04-l03-in-006-mobile-controls--fallback {
            left: 3%;
            max-height: 94%;
            overflow: auto;
            pointer-events: auto;
            position: absolute;
            right: 3%;
            top: 3%;
          }

          .course-g04-l03-in-006-mobile-controls--portal {
            margin: 12px 0;
            max-width: 100%;
            pointer-events: auto;
            position: relative;
            width: 100%;
          }

          .course-g04-l03-in-006-mobile-instruction,
          .course-g04-l03-in-006-mobile-history,
          .course-g04-l03-in-006-mobile-loading {
            font-family: system-ui, sans-serif;
            font-size: 14px;
            line-height: 1.3;
            margin: 0;
          }

          .course-g04-l03-in-006-mobile-summary {
            display: grid;
            gap: 7px;
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }

          .course-g04-l03-in-006-mobile-summary p {
            background: #fff;
            border: 1px solid #99b4d8;
            border-radius: 8px;
            display: grid;
            gap: 3px;
            margin: 0;
            min-width: 0;
            padding: 7px;
            text-align: center;
          }

          .course-g04-l03-in-006-mobile-summary span {
            font: 700 12px/1.1 system-ui, sans-serif;
          }

          .course-g04-l03-in-006-mobile-summary strong {
            overflow-wrap: anywhere;
          }

          .course-g04-l03-in-006-mobile-controls fieldset {
            border: 0;
            margin: 0;
            padding: 0;
          }

          .course-g04-l03-in-006-mobile-controls legend {
            font-size: 16px;
            font-weight: 850;
            margin-bottom: 7px;
          }

          .course-g04-l03-in-006-mobile-jump-grid,
          .course-g04-l03-in-006-mobile-primary-actions,
          .course-g04-l03-in-006-mobile-secondary-actions {
            display: grid;
            gap: 8px;
          }

          .course-g04-l03-in-006-mobile-jump-grid {
            grid-template-columns: repeat(4, minmax(48px, 1fr));
          }

          .course-g04-l03-in-006-mobile-primary-actions,
          .course-g04-l03-in-006-mobile-secondary-actions {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .course-g04-l03-in-006-mobile-controls button {
            background: #fff;
            border: 2px solid #224b8e;
            border-radius: 9px;
            box-sizing: border-box;
            color: #111;
            font: 800 16px ${SOURCE_FONT};
            min-height: 48px;
            min-width: 48px;
            padding: 7px;
          }

          .course-g04-l03-in-006-mobile-controls button[aria-pressed="true"] {
            background: #ffdd29;
            box-shadow: inset 0 0 0 2px #082d86;
          }

          .course-g04-l03-in-006-mobile-controls button:focus-visible {
            box-shadow: 0 0 0 3px #fff200;
            outline: 3px solid #001d6d;
            outline-offset: 2px;
          }

          .course-g04-l03-in-006-mobile-controls button:disabled {
            cursor: default;
            opacity: .58;
          }

          .course-g04-l03-in-006-mobile-history {
            background: #fff;
            border-radius: 8px;
            display: grid;
            gap: 5px;
            padding: 8px;
          }

          .course-g04-l03-in-006-mobile-dialog,
          .course-g04-l03-in-006-mobile-correct {
            background: #ffffcc;
            border: 3px solid #224b8e;
            border-radius: 12px;
            display: grid;
            gap: 8px;
            padding: 12px;
            text-align: center;
          }

          .course-g04-l03-in-006-mobile-dialog p,
          .course-g04-l03-in-006-mobile-dialog small {
            font-family: system-ui, sans-serif;
            line-height: 1.3;
            margin: 0;
          }

          .course-g04-l03-in-006-mobile-correct {
            border-color: #7d178e;
            font-size: 28px;
          }
        }

        @media (max-width: 430px) {
          .course-g04-l03-in-006-mobile-summary {
            grid-template-columns: 1fr;
          }
        }

        @media (min-width: 900px) and (any-pointer: coarse) {
          .course-g04-l03-in-006-mobile-controls--portal {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .course-g04-l03-in-006-mobile-instruction,
          .course-g04-l03-in-006-mobile-summary,
          .course-g04-l03-in-006-mobile-history,
          .course-g04-l03-in-006-mobile-dialog,
          .course-g04-l03-in-006-mobile-correct,
          .course-g04-l03-in-006-mobile-loading {
            grid-column: 1 / -1;
          }
        }

        @media (min-width: 1280px) and (any-pointer: coarse) {
          .course-g04-l03-in-006-mobile-controls--portal {
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
          key={sourceCanvasRenderKey}
          {...props}
          frame={props.frame}
        />
      </div>
      {interactionEnabled ? (
        <>
          <StageSurface
            canvasStatus={canvasStatus}
            closeWrongRef={stageWrongCloseRef}
            controlsReady={controlsReady}
            dragAcceptedRef={dragAcceptedRef}
            interaction={interaction}
            newNumberRef={stageNewNumberRef}
            onClear={clear}
            onCloseWrong={closeWrong}
            onInvalidDrop={invalidDrop}
            onNewNumber={newNumber}
            onPlace={place}
            onReverse={reverse}
            onSelectMagnitude={selectMagnitude}
            selectedMagnitude={selectedMagnitude}
          />
          {companionTarget
            ? createPortal(mobileSurface, companionTarget)
            : (
                <div className="course-g04-l03-in-006-mobile-fallback-slot">
                  {mobileSurface}
                </div>
              )}
        </>
      ) : null}
    </div>
  );
}

export {COURSE_G04_L03_IN_006_SOURCE};
export const COURSE_G04_L03_IN_006_MOVIE = candidate.movie;
export const COURSE_G04_L03_IN_006_RUNTIME = candidate.runtime;
export const COURSE_G04_L03_IN_006_SOURCE_CONTRACT = Object.freeze({
  ...candidate.sourceContract,
  currentJavascriptInteractionStatus:
    "source-script-bound-functional-candidate",
  currentJavascriptInteractionScope: Object.freeze([
    "eight-source-question-pairs-with-seed-bound-initial-selection",
    "reusable-one-two-four-five-jumps-defaulting-positive",
    "pointer-drag-and-select-then-number-line-keyboard-alternative",
    "source-start-boundary-check-with-temporary-endpoint-overflow",
    "reverse-most-recent-jump",
    "source-cumulative-delta-equation-format",
    "clear-current-question",
    "correct-feedback-and-new-number-enable",
    "current-javascript-deterministic-new-number-cycle",
    "modern-assistive-invalid-drop-feedback-and-close-retry",
    "host-pause-freezes-current-js-correct-feedback-delay",
    "whole-renderer-replay-reset",
    "responsive-mobile-and-coarse-pointer-touch-control-surface",
    "page-interaction-companion-portal-with-stage-fallback",
    "desktop-mobile-focus-migration",
    "interactive-canvas-accessibility-isolation",
    "answer-controls-fail-closed-until-source-canvas-ready",
    "frame-1054-source-visual-under-functional-overlay",
    "deterministic-evidence-capture-preserves-requested-frame-without-overlay",
  ]),
  currentJavascriptTiming: COURSE_G04_L03_IN_006_CURRENT_JS_TIMING,
  currentJavascriptQuestionSelection:
    "seed-modulo-eight-initial-and-deterministic-cycle-not-avm1-random-parity",
  sourceLocalQuizContractDescriptorStatus:
    "stale-source-audit-sha-no-strict-effect",
  wrongFeedbackTextStatus: "modern-assistive-not-source-exact",
  jumpOverlayStatus:
    "source-script-and-geometry-bound-modern-svg-not-pixel-parity",
  embeddedCoachAudioStatus: "inventoried-unimplemented-unaccepted",
  associatedAudioStatus: "inventoried-unimplemented-unaccepted",
  spanishInteractionStatus: "unimplemented-disabled",
  naturalTerminalContinuationEstablished: false,
  sourceRandomParityEstablished: false,
  behaviorParityEstablished: false,
  replayParityEstablished: false,
  originalRuntimeAuthorityEstablished: false,
  ownerAccepted: false,
  strictMigrationComplete: false,
  strictAcceptanceEffect: "none",
});
export const COURSE_G04_L03_IN_006_SCENARIOS = candidate.scenarios;
export const normalizeCourseG04L03In006Frame = candidate.normalizeFrame;
export const getCourseG04L03In006FrameState = candidate.getFrameState;
export const buildCourseG04L03In006CaptureAttributes =
  candidate.buildCaptureAttributes;

export default Object.freeze({
  ...candidate.module,
  reducedMotionFrame: SOURCE_QUIZ_FRAME,
  Renderer: CourseG04L03In006Renderer,
});
