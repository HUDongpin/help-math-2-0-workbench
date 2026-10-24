"use client";

import React, {
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import type {Dispatch, DragEvent, RefObject} from "react";
import {createPortal} from "react-dom";

import type {AnimationRendererProps} from "../contract";
import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G04_L03_IN_010_ASSISTIVE_CORRECT_FEEDBACK,
  COURSE_G04_L03_IN_010_CARDS,
  COURSE_G04_L03_IN_010_CURRENT_JS_TIMING,
  COURSE_G04_L03_IN_010_FINAL_CORRECT_FEEDBACK,
  COURSE_G04_L03_IN_010_INPUT_METHODS,
  COURSE_G04_L03_IN_010_INSTRUCTION,
  COURSE_G04_L03_IN_010_INTERACTION_AUTHORITY,
  COURSE_G04_L03_IN_010_SOURCE_GLOSSARY_TERMS,
  COURSE_G04_L03_IN_010_WRONG_FEEDBACK,
  createCourseG04L03In010TemperatureDragState,
  getCourseG04L03In010PlacementCount,
  reduceCourseG04L03In010TemperatureDrag,
  type CourseG04L03In010CardId,
  type CourseG04L03In010TargetId,
  type CourseG04L03In010TemperatureDragAction,
  type CourseG04L03In010TemperatureDragState,
} from "../timelines/course-g04-l03-in-010-temperature-drag-interaction";
import {
  COURSE_G04_L03_IN_010_CONFIG,
  COURSE_G04_L03_IN_010_SOURCE,
} from "../timelines/course-g04-l03-in-010";

const candidate = createSourceStaticCanvasCandidate(
  COURSE_G04_L03_IN_010_CONFIG,
);
const SourceStaticRenderer = candidate.Renderer;

const SOURCE_INTERACTION_FRAME = 264;
const SOURCE_INITIAL_DONOR_FRAME = 263;
const SOURCE_INTERACTION_DOMAIN = "sprite-90";
const SOURCE_INTERACTION_SCENARIO = "source-static-frame";
const SOURCE_FONT =
  '"Helvetica", "Arial", system-ui, sans-serif';
const RESPONSIVE_CONTROLS_MEDIA =
  "(max-width: 640px), (any-pointer: coarse)";

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

const targetOrder = Object.freeze(
  [...COURSE_G04_L03_IN_010_CARDS].sort(
    (left, right) => left.targetCenter.y - right.targetCenter.y,
  ),
);

function thermometerPosition(
  targetId: CourseG04L03In010TargetId,
): number {
  return targetOrder.findIndex(({targetId: id}) => id === targetId) + 1;
}

export const getCourseG04L03In010SourceCanvasRenderKey = (
  replay: number,
  seed: number,
  sourceVisualFrame: number,
): string => `source-in010-${replay}-${seed}-${sourceVisualFrame}`;

function isDeterministicEvidenceCapture({
  entryStateSha256,
}: AnimationRendererProps) {
  return Boolean(entryStateSha256);
}

function isVisible(element: HTMLElement | null): element is HTMLElement {
  return Boolean(element && element.getClientRects().length > 0);
}

function focusRenderedControl(
  preferred: RefObject<HTMLElement | null>,
  fallback: RefObject<HTMLElement | null>,
) {
  window.requestAnimationFrame(() => {
    const control = isVisible(preferred.current)
      ? preferred.current
      : fallback.current;
    control?.focus();
  });
}

function sourceCanvasStatusMessage(status: SourceCanvasStatus) {
  if (status === "error") {
    return "The source temperature question could not load. Answer controls are unavailable.";
  }
  if (status === "blocked") {
    return "The source temperature question is unavailable in this context.";
  }
  return "Loading the source temperature question before answer controls are enabled…";
}

function placedCardForTarget(
  interaction: CourseG04L03In010TemperatureDragState,
  targetId: CourseG04L03In010TargetId,
) {
  return COURSE_G04_L03_IN_010_CARDS.find(
    ({id}) => interaction.placements[id] === targetId,
  );
}

/**
 * The authored 33°F and 34°F target bounds overlap. The fine-pointer surface
 * keeps their source-derived region while splitting their hit areas left/right.
 * Coarse-pointer layouts use the non-overlapping companion grid instead.
 */
function stageTargetHitBounds(
  card: (typeof COURSE_G04_L03_IN_010_CARDS)[number],
) {
  if (card.targetId === "Mc_Tar_6") {
    return Object.freeze({
      x: 86.1,
      y: card.targetCenter.y - 24,
      width: 70.85,
      height: 48,
    });
  }
  if (card.targetId === "Mc_Tar_5") {
    return Object.freeze({
      x: 156.95,
      y: card.targetCenter.y - 24,
      width: 70.85,
      height: 48,
    });
  }
  return Object.freeze({
    x: card.targetBounds.left,
    y: card.targetCenter.y - 24,
    width: Math.max(48, card.targetBounds.width),
    height: 48,
  });
}

interface SharedSurfaceProps {
  readonly canvasStatus: SourceCanvasStatus;
  readonly controlsReady: boolean;
  readonly dispatch: Dispatch<CourseG04L03In010TemperatureDragAction>;
  readonly interaction: CourseG04L03In010TemperatureDragState;
  readonly onCloseWrong: () => void;
  readonly wrongCloseRef: RefObject<HTMLButtonElement | null>;
}

function SourceGlossaryBoundary() {
  return (
    <div
      aria-label="Two source glossary actions are unavailable in this current JavaScript candidate."
      data-host-glossary-actions="safe-disabled"
      data-host-glossary-function="DoHyperLinks-unresolved"
      style={visuallyHiddenStyle}
    >
      {COURSE_G04_L03_IN_010_SOURCE_GLOSSARY_TERMS.map((term, index) => (
        <span
          aria-disabled="true"
          data-source-glossary-height={term.bounds.height}
          data-source-glossary-key={term.keyAttribute}
          data-source-glossary-term={term.visibleText}
          data-source-glossary-width={term.bounds.width}
          data-source-glossary-x={term.bounds.x}
          data-source-glossary-y={term.bounds.y}
          key={term.id}
          role="link"
        >
          {term.visibleText}
          {index
            < COURSE_G04_L03_IN_010_SOURCE_GLOSSARY_TERMS.length - 1
            ? ", "
            : ""}
        </span>
      ))}
    </div>
  );
}

function StageTargetCopy({
  text,
}: {
  readonly text: string;
}) {
  return (
    <span
      aria-hidden="true"
      style={{
        alignItems: "center",
        background: "#fff",
        color: "#000",
        display: "flex",
        fontFamily: SOURCE_FONT,
        fontSize: 12,
        height: "100%",
        justifyContent: "center",
        lineHeight: 1,
        overflow: "hidden",
        padding: "0 2px",
        textAlign: "center",
        whiteSpace: "nowrap",
        width: "100%",
      }}
    >
      {text}
    </span>
  );
}

function StageSurface({
  canvasStatus,
  controlsReady,
  dispatch,
  interaction,
  onCloseWrong,
  wrongCloseRef,
}: SharedSurfaceProps) {
  const locked = !controlsReady || interaction.locked;
  const placementCount = getCourseG04L03In010PlacementCount(interaction);

  const startDrag = (
    event: DragEvent<HTMLButtonElement>,
    cardId: CourseG04L03In010CardId,
  ) => {
    if (locked) {
      event.preventDefault();
      return;
    }
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", cardId);
    dispatch({type: "select-card", cardId});
  };

  const dropOnTarget = (
    event: DragEvent<HTMLButtonElement>,
    targetId: CourseG04L03In010TargetId,
  ) => {
    event.preventDefault();
    const transferredId = event.dataTransfer.getData("text/plain");
    const cardId = COURSE_G04_L03_IN_010_CARDS.some(
      ({id}) => id === transferredId,
    )
      ? transferredId as CourseG04L03In010CardId
      : undefined;
    dispatch(cardId
      ? {type: "drop-card", cardId, targetId}
      : {type: "drop-card", targetId});
  };

  return (
    <svg
      aria-busy={!controlsReady}
      aria-label="Source-script-bound current JavaScript temperature placement activity"
      className="course-g04-l03-in-010-stage-surface"
      data-audio-feedback="inventoried-unimplemented-unaccepted"
      data-behavior-parity-established="false"
      data-current-js-controls-ready={controlsReady ? "true" : "false"}
      data-current-js-functional-candidate="true"
      data-interaction-outcome={interaction.outcome}
      data-legacy-actionscript-executed="false"
      data-original-runtime-authority="false"
      data-post-drop-visual-parity-established="false"
      data-source-canvas-status={canvasStatus}
      data-source-script-bound="true"
      data-source-visual-hide-parity-established="false"
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
        <div
          style={{
            fontFamily: SOURCE_FONT,
            height: 600,
            margin: 0,
            pointerEvents: "none",
            position: "relative",
            width: 800,
          }}
        >
          {!controlsReady ? (
            <span
              aria-live={canvasStatus === "error" ? "assertive" : "polite"}
              role={canvasStatus === "error" ? "alert" : "status"}
              style={visuallyHiddenStyle}
            >
              {sourceCanvasStatusMessage(canvasStatus)}
            </span>
          ) : null}

          {COURSE_G04_L03_IN_010_CARDS.map((card) => {
            const placed = interaction.placements[card.id] !== null;
            const selected = interaction.selectedCardId === card.id;
            const hitWidth = Math.max(48, card.sourceBounds.width + 16);
            const hitHeight = Math.max(48, card.sourceBounds.height + 16);
            return (
              <button
                aria-label={placed
                  ? `${card.accessibleLabel} placed`
                  : `Select ${card.accessibleLabel} to move`}
                aria-pressed={placed ? undefined : selected}
                data-current-js-card-state={placed ? "placed" : "available"}
                data-in010-focus-control={`card-${card.id}`}
                data-source-card={card.id}
                data-source-visual-retained-after-logical-placement={
                  placed ? "true" : "false"
                }
                disabled={locked || placed}
                draggable={!locked && !placed}
                key={card.id}
                onClick={() => dispatch({type: "select-card", cardId: card.id})}
                onDragStart={(event) => startDrag(event, card.id)}
                style={{
                  background: selected ? "rgb(255 221 41 / 24%)" : "transparent",
                  border: selected ? "3px solid #082d86" : "1px solid transparent",
                  boxSizing: "border-box",
                  color: "transparent",
                  cursor: locked || placed ? "default" : "grab",
                  height: hitHeight,
                  left: card.sourceCenter.x - hitWidth / 2,
                  margin: 0,
                  padding: 0,
                  pointerEvents: "auto",
                  position: "absolute",
                  top: card.sourceCenter.y - hitHeight / 2,
                  width: hitWidth,
                }}
                type="button"
              >
                {card.displayText}
              </button>
            );
          })}

          {targetOrder.map((targetCard) => {
            const placedCard = placedCardForTarget(
              interaction,
              targetCard.targetId,
            );
            const position = thermometerPosition(targetCard.targetId);
            const hitBounds = stageTargetHitBounds(targetCard);
            const targetLocked = locked
              || interaction.selectedCardId === null
              || placedCard !== undefined;
            return (
              <button
                aria-label={placedCard
                  ? `${placedCard.accessibleLabel} placed at thermometer position ${position}`
                  : `Place selected city at thermometer position ${position}`}
                data-current-js-target-state={
                  placedCard ? "revealed" : "unfilled"
                }
                data-hit-target-height={hitBounds.height}
                data-hit-target-minimum="48"
                data-hit-target-width={hitBounds.width}
                data-in010-focus-control={`target-${targetCard.targetId}`}
                data-source-target={targetCard.targetId}
                data-target-answer-disclosure="position-only-before-placement"
                data-target-overlap-adaptation={
                  targetCard.targetId === "Mc_Tar_5"
                  || targetCard.targetId === "Mc_Tar_6"
                    ? "split-horizontal-hit-regions"
                    : "source-centered-minimum-48"
                }
                data-target-revealed-after-correct={
                  placedCard ? "true" : "false"
                }
                disabled={targetLocked}
                key={targetCard.targetId}
                onClick={() => dispatch({
                  type: "drop-card",
                  targetId: targetCard.targetId,
                })}
                onDragOver={(event) => {
                  if (!locked && placedCard === undefined) {
                    event.preventDefault();
                  }
                }}
                onDrop={(event) => dropOnTarget(event, targetCard.targetId)}
                style={{
                  background: "transparent",
                  border: 0,
                  boxSizing: "border-box",
                  color: "transparent",
                  cursor: targetLocked ? "default" : "pointer",
                  height: hitBounds.height,
                  left: hitBounds.x,
                  margin: 0,
                  overflow: "visible",
                  padding: 0,
                  pointerEvents: "auto",
                  position: "absolute",
                  top: hitBounds.y,
                  width: hitBounds.width,
                }}
                type="button"
              >
                <span style={visuallyHiddenStyle}>
                  Thermometer position {position}
                </span>
                {placedCard ? (
                  <span
                    style={{
                      height: targetCard.targetBounds.height,
                      left: targetCard.targetBounds.left - hitBounds.x,
                      pointerEvents: "none",
                      position: "absolute",
                      top: targetCard.targetBounds.top - hitBounds.y,
                      width: targetCard.targetBounds.width,
                    }}
                  >
                    <StageTargetCopy text={placedCard.displayText} />
                  </span>
                ) : null}
              </button>
            );
          })}

          {interaction.outcome === "wrong" ? (
            <div
              aria-describedby="course-g04-l03-in-010-stage-wrong-copy"
              aria-label="Incorrect placement feedback"
              aria-modal="true"
              data-host-wrong-feedback="_global.WrongFeed-unresolved"
              data-source-copy="canvas-static-glyph-fallback-host-global-unresolved"
              role="alertdialog"
              style={{
                alignItems: "center",
                background: "#ffffcc",
                border: "1px solid #6a6231",
                boxSizing: "border-box",
                color: "#000",
                display: "grid",
                gap: 10,
                gridTemplateRows: "1fr 48px",
                left: 283.825,
                minHeight: 139.1,
                padding: 12,
                pointerEvents: "auto",
                position: "absolute",
                top: 196.85,
                width: 248.65,
                zIndex: 4,
              }}
            >
              <p
                id="course-g04-l03-in-010-stage-wrong-copy"
                style={{
                  fontFamily: SOURCE_FONT,
                  fontSize: 22,
                  fontWeight: 700,
                  lineHeight: 1.1,
                  margin: 0,
                  textAlign: "center",
                }}
              >
                {COURSE_G04_L03_IN_010_WRONG_FEEDBACK.canvasStaticGlyph}
              </p>
              <button
                aria-label="Close feedback and try the same city again"
                data-in010-focus-control="close-wrong"
                onClick={onCloseWrong}
                ref={wrongCloseRef}
                style={{
                  background: "linear-gradient(#ffad17, #e95c00)",
                  border: "2px solid #fff1cb",
                  borderRadius: 4,
                  color: "#fff",
                  font: `700 17px ${SOURCE_FONT}`,
                  height: 48,
                  margin: 0,
                  padding: 0,
                }}
                type="button"
              >
                {COURSE_G04_L03_IN_010_WRONG_FEEDBACK.closeLabel}
              </button>
            </div>
          ) : null}

          {interaction.outcome === "correct-feedback" ? (
            <div
              aria-hidden="true"
              data-current-js-feedback-phase="per-card"
              data-source-copy="modern-assistive-not-source-exact"
              style={{
                alignItems: "center",
                background: "linear-gradient(#ffd934, #a46b00)",
                border: "3px solid #6d4100",
                borderRadius: 8,
                color: "#5e1800",
                display: "flex",
                fontSize: 28,
                fontWeight: 900,
                height: 48,
                justifyContent: "center",
                left: 276,
                position: "absolute",
                textShadow: "1px 1px 0 #fff1a0",
                top: 286,
                width: 248,
              }}
            >
              {COURSE_G04_L03_IN_010_ASSISTIVE_CORRECT_FEEDBACK}
            </div>
          ) : null}

          {interaction.outcome === "final-correct-feedback" ? (
            <div
              aria-hidden="true"
              data-current-js-feedback-phase="final"
              data-original-runtime-terminal-parity="false"
              data-source-copy="source-authoring-text-without-original-runtime-causality"
              style={{
                alignItems: "center",
                background: "linear-gradient(#bd00e9, #8e00c0)",
                border: "5px solid #7b007c",
                borderRadius: 22,
                boxSizing: "border-box",
                color: "#fff",
                display: "flex",
                fontSize: 46,
                fontWeight: 900,
                height: 131.4,
                justifyContent: "center",
                left: 258.6,
                position: "absolute",
                textShadow: "2px 2px 0 #73008e",
                top: 213.55,
                width: 309.6,
              }}
            >
              {COURSE_G04_L03_IN_010_FINAL_CORRECT_FEEDBACK}
            </div>
          ) : null}

          {interaction.outcome === "complete" ? (
            <div
              aria-hidden="true"
              data-current-js-terminal="persistent"
              data-original-runtime-terminal-parity="false"
              style={{
                alignItems: "center",
                background: "linear-gradient(#bd00e9, #8e00c0)",
                border: "5px solid #7b007c",
                borderRadius: 22,
                boxSizing: "border-box",
                color: "#fff",
                display: "flex",
                fontSize: 46,
                fontWeight: 900,
                height: 131.4,
                justifyContent: "center",
                left: 258.6,
                position: "absolute",
                textShadow: "2px 2px 0 #73008e",
                top: 213.55,
                width: 309.6,
              }}
            >
              {COURSE_G04_L03_IN_010_FINAL_CORRECT_FEEDBACK}
            </div>
          ) : null}

          <span aria-live="polite" role="status" style={visuallyHiddenStyle}>
            {interaction.outcome === "correct-feedback"
              ? `${COURSE_G04_L03_IN_010_ASSISTIVE_CORRECT_FEEDBACK} ${placementCount} of 6 cities placed.`
              : interaction.outcome === "final-correct-feedback"
                ? COURSE_G04_L03_IN_010_FINAL_CORRECT_FEEDBACK
                : interaction.outcome === "complete"
                  ? `${COURSE_G04_L03_IN_010_FINAL_CORRECT_FEEDBACK} Current JavaScript terminal state.`
                  : interaction.feedback ?? ""}
          </span>
        </div>
      </foreignObject>
    </svg>
  );
}

interface MobileSurfaceProps extends SharedSurfaceProps {
  readonly placement: "fallback" | "portal";
}

function MobileSurface({
  canvasStatus,
  controlsReady,
  dispatch,
  interaction,
  onCloseWrong,
  placement,
  wrongCloseRef,
}: MobileSurfaceProps) {
  const locked = !controlsReady || interaction.locked;
  const selected = COURSE_G04_L03_IN_010_CARDS.find(
    ({id}) => id === interaction.selectedCardId,
  );
  const placementCount = getCourseG04L03In010PlacementCount(interaction);

  return (
    <section
      aria-label="Mobile controls for placing cities on the thermometer"
      className={
        "course-g04-l03-in-010-mobile-controls "
        + `course-g04-l03-in-010-mobile-controls--${placement}`
      }
      data-current-js-controls-ready={controlsReady ? "true" : "false"}
      data-interaction-companion-placement={placement}
      data-interaction-companion-surface="mobile"
      data-interaction-outcome={interaction.outcome}
      data-mobile-target-overlap-adaptation="separate-grid-controls"
      data-mobile-touch-target-min="48"
      data-source-canvas-status={canvasStatus}
    >
      <p className="course-g04-l03-in-010-mobile-instruction">
        {COURSE_G04_L03_IN_010_INSTRUCTION}
      </p>
      {!controlsReady ? (
        <p
          aria-live={canvasStatus === "error" ? "assertive" : "polite"}
          className="course-g04-l03-in-010-mobile-loading"
          role={canvasStatus === "error" ? "alert" : "status"}
        >
          {sourceCanvasStatusMessage(canvasStatus)}
        </p>
      ) : null}
      <p
        aria-live="polite"
        className="course-g04-l03-in-010-mobile-status"
      >
        {interaction.outcome === "correct-feedback"
          ? `${COURSE_G04_L03_IN_010_ASSISTIVE_CORRECT_FEEDBACK} ${placementCount} of 6 cities placed.`
          : interaction.outcome === "final-correct-feedback"
            ? COURSE_G04_L03_IN_010_FINAL_CORRECT_FEEDBACK
            : interaction.outcome === "complete"
              ? `${COURSE_G04_L03_IN_010_FINAL_CORRECT_FEEDBACK} Current JavaScript terminal state.`
              : selected
                ? `${selected.accessibleLabel} selected. Choose its thermometer position.`
                : `${placementCount} of 6 cities placed.`}
      </p>

      <fieldset disabled={locked}>
        <legend>1. Choose a city and temperature</legend>
        <div className="course-g04-l03-in-010-mobile-card-grid">
          {COURSE_G04_L03_IN_010_CARDS.map((card) => {
            const placed = interaction.placements[card.id] !== null;
            return (
              <button
                aria-label={`Select ${card.accessibleLabel}`}
                aria-pressed={interaction.selectedCardId === card.id}
                data-current-js-card-state={placed ? "placed" : "available"}
                data-in010-focus-control={`card-${card.id}`}
                disabled={locked || placed}
                key={card.id}
                onClick={() => dispatch({type: "select-card", cardId: card.id})}
                type="button"
              >
                <span>{card.displayText}</span>
                {placed ? <strong aria-label="placed">✓</strong> : null}
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset disabled={locked || interaction.selectedCardId === null}>
        <legend>2. Choose its thermometer position</legend>
        <div className="course-g04-l03-in-010-mobile-target-grid">
          {targetOrder.map((targetCard) => {
            const placedCard = placedCardForTarget(
              interaction,
              targetCard.targetId,
            );
            const position = thermometerPosition(targetCard.targetId);
            return (
              <button
                aria-label={placedCard
                  ? `${placedCard.accessibleLabel} placed at thermometer position ${position}`
                  : `Thermometer position ${position}`}
                data-in010-focus-control={`target-${targetCard.targetId}`}
                data-target-answer-disclosure="position-only-before-placement"
                disabled={
                  locked
                  || interaction.selectedCardId === null
                  || placedCard !== undefined
                }
                key={targetCard.targetId}
                onClick={() => dispatch({
                  type: "drop-card",
                  targetId: targetCard.targetId,
                })}
                type="button"
              >
                {placedCard
                  ? `${placedCard.displayText} ✓`
                  : `Position ${position}`}
              </button>
            );
          })}
        </div>
      </fieldset>

      {interaction.outcome === "wrong" ? (
        <div
          aria-label="Incorrect placement feedback"
          aria-modal="true"
          className="course-g04-l03-in-010-mobile-dialog"
          data-host-wrong-feedback="_global.WrongFeed-unresolved"
          data-source-copy="canvas-static-glyph-fallback-host-global-unresolved"
          role="alertdialog"
        >
          <strong>
            {COURSE_G04_L03_IN_010_WRONG_FEEDBACK.canvasStaticGlyph}
          </strong>
          <button
            aria-label="Close feedback and try the same city again"
            data-in010-focus-control="close-wrong"
            onClick={onCloseWrong}
            ref={wrongCloseRef}
            type="button"
          >
            {COURSE_G04_L03_IN_010_WRONG_FEEDBACK.closeLabel}
          </button>
        </div>
      ) : null}

      {interaction.outcome === "final-correct-feedback" ? (
        <div
          aria-live="polite"
          className="course-g04-l03-in-010-mobile-complete"
          data-current-js-feedback-phase="final"
          data-original-runtime-terminal-parity="false"
          role="status"
        >
          <strong>{COURSE_G04_L03_IN_010_FINAL_CORRECT_FEEDBACK}</strong>
          <p>Final current JavaScript feedback is playing.</p>
        </div>
      ) : null}

      {interaction.outcome === "complete" ? (
        <div
          aria-live="polite"
          className="course-g04-l03-in-010-mobile-complete"
          data-current-js-terminal="persistent"
          data-original-runtime-terminal-parity="false"
          role="status"
        >
          <strong>{COURSE_G04_L03_IN_010_FINAL_CORRECT_FEEDBACK}</strong>
          <p>
            Current JavaScript terminal state. Use Replay to practice again.
          </p>
        </div>
      ) : null}
    </section>
  );
}

export function CourseG04L03In010Renderer(
  props: AnimationRendererProps,
) {
  const [interaction, dispatch] = useReducer(
    reduceCourseG04L03In010TemperatureDrag,
    undefined,
    createCourseG04L03In010TemperatureDragState,
  );
  const [companionTarget, setCompanionTarget] =
    useState<HTMLElement | null>(null);
  const [canvasStatus, setCanvasStatus] =
    useState<SourceCanvasStatus>("idle");
  const rendererRef = useRef<HTMLDivElement>(null);
  const visualHostRef = useRef<HTMLDivElement>(null);
  const lastFocusedControlRef = useRef<string | null>(null);
  const stageWrongCloseRef = useRef<HTMLButtonElement>(null);
  const mobileWrongCloseRef = useRef<HTMLButtonElement>(null);
  const perCardFeedbackRemainingMs = useRef<number>(
    COURSE_G04_L03_IN_010_CURRENT_JS_TIMING.perCardCorrectFeedbackMs,
  );
  const finalFeedbackRemainingMs = useRef(
    COURSE_G04_L03_IN_010_CURRENT_JS_TIMING.finalCorrectFeedbackMs,
  );

  const frameDomain = props.frameDomain ?? SOURCE_INTERACTION_DOMAIN;
  const deterministicEvidenceCapture =
    isDeterministicEvidenceCapture(props);
  const interactionEnabled =
    props.frame === SOURCE_INTERACTION_FRAME
    && frameDomain === SOURCE_INTERACTION_DOMAIN
    && props.scenario === SOURCE_INTERACTION_SCENARIO
    && props.lang === "en"
    && !deterministicEvidenceCapture;
  const sourceVisualFrame = interactionEnabled
    ? SOURCE_INITIAL_DONOR_FRAME
    : props.frame;
  const sourceCanvasRenderKey = getCourseG04L03In010SourceCanvasRenderKey(
    props.replay ?? 0,
    props.seed,
    sourceVisualFrame,
  );
  const interactiveSourceVisualState = useMemo(
    () =>
      candidate.getFrameState(SOURCE_INITIAL_DONOR_FRAME, {
        entryStateSha256: props.entryStateSha256,
        frameDomain,
        lang: props.lang,
        requirementId: props.requirementId,
        scenario: props.scenario,
        seed: props.seed,
        traceId: props.traceId,
      }),
    [
      frameDomain,
      props.entryStateSha256,
      props.lang,
      props.requirementId,
      props.scenario,
      props.seed,
      props.traceId,
    ],
  );
  const sourceVisualState = interactionEnabled
    ? interactiveSourceVisualState
    : props.state;
  const controlsReady =
    interactionEnabled && canvasStatus === "ready";

  const focusControl = (focusControlKey: string) => {
    window.requestAnimationFrame(() => {
      const roots = companionTarget
        ? [rendererRef.current, companionTarget]
        : [rendererRef.current];
      const control = roots
        .filter((root): root is HTMLElement => root !== null)
        .flatMap((root) => Array.from(root.querySelectorAll<HTMLElement>(
          `[data-in010-focus-control="${focusControlKey}"]`,
        )))
        .find((element) =>
          isVisible(element) && !element.hasAttribute("disabled")
        );
      control?.focus();
    });
  };

  useEffect(() => {
    dispatch({type: "replay"});
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
  }, [interactionEnabled, props.replay, sourceCanvasRenderKey]);

  useEffect(() => {
    perCardFeedbackRemainingMs.current =
      COURSE_G04_L03_IN_010_CURRENT_JS_TIMING.perCardCorrectFeedbackMs;
    finalFeedbackRemainingMs.current =
      COURSE_G04_L03_IN_010_CURRENT_JS_TIMING.finalCorrectFeedbackMs;
  }, [interaction.lastPlacedCardId]);

  useEffect(() => {
    if (interaction.outcome !== "correct-feedback") return;
    if (props.reducedMotion) {
      const nextCard = COURSE_G04_L03_IN_010_CARDS.find(
        ({id}) => interaction.placements[id] === null,
      );
      dispatch({type: "feedback-complete"});
      if (nextCard) focusControl(`card-${nextCard.id}`);
      return;
    }
    if (props.paused) return;

    const startedAt = performance.now();
    const timeout = window.setTimeout(() => {
      perCardFeedbackRemainingMs.current =
        COURSE_G04_L03_IN_010_CURRENT_JS_TIMING.perCardCorrectFeedbackMs;
      const nextCard = COURSE_G04_L03_IN_010_CARDS.find(
        ({id}) => interaction.placements[id] === null,
      );
      dispatch({type: "feedback-complete"});
      if (nextCard) focusControl(`card-${nextCard.id}`);
    }, perCardFeedbackRemainingMs.current);
    return () => {
      window.clearTimeout(timeout);
      perCardFeedbackRemainingMs.current = Math.max(
        0,
        perCardFeedbackRemainingMs.current
          - (performance.now() - startedAt),
      );
    };
  }, [
    interaction.outcome,
    props.paused,
    props.reducedMotion,
  ]);

  useEffect(() => {
    if (interaction.outcome !== "final-correct-feedback") return;
    if (props.reducedMotion) {
      dispatch({type: "final-feedback-complete"});
      return;
    }
    if (props.paused) return;

    const startedAt = performance.now();
    const timeout = window.setTimeout(() => {
      finalFeedbackRemainingMs.current =
        COURSE_G04_L03_IN_010_CURRENT_JS_TIMING.finalCorrectFeedbackMs;
      dispatch({type: "final-feedback-complete"});
    }, finalFeedbackRemainingMs.current);
    return () => {
      window.clearTimeout(timeout);
      finalFeedbackRemainingMs.current = Math.max(
        0,
        finalFeedbackRemainingMs.current - (performance.now() - startedAt),
      );
    };
  }, [
    interaction.outcome,
    props.paused,
    props.reducedMotion,
  ]);

  useEffect(() => {
    if (interaction.outcome !== "wrong") return;
    focusRenderedControl(mobileWrongCloseRef, stageWrongCloseRef);
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
      const focusControlKey =
        activeWithinInteraction && active instanceof HTMLElement
          ? active.dataset.in010FocusControl
          : lastFocusedControlRef.current;
      if (focusControlKey) focusControl(focusControlKey);
    };

    media.addEventListener("change", moveFocusToVisibleSurface);
    return () => media.removeEventListener("change", moveFocusToVisibleSurface);
  }, [companionTarget]);

  const closeWrong = () => {
    const wrongCardId = interaction.wrongCardId;
    dispatch({type: "close-wrong"});
    if (wrongCardId) focusControl(`card-${wrongCardId}`);
  };

  const mobileSurface = (
    <MobileSurface
      canvasStatus={canvasStatus}
      controlsReady={controlsReady}
      dispatch={dispatch}
      interaction={interaction}
      onCloseWrong={closeWrong}
      placement={companionTarget ? "portal" : "fallback"}
      wrongCloseRef={mobileWrongCloseRef}
    />
  );

  return (
    <div
      data-authoritative-original-runtime-evidence="false"
      data-behavior-parity-established="false"
      data-current-js-controls-enabled={controlsReady ? "true" : "false"}
      data-current-js-functional-candidate={interactionEnabled ? "true" : "false"}
      data-current-js-functional-scope="in010-temperature-drag-source-script-bound"
      data-current-js-input-methods={COURSE_G04_L03_IN_010_INPUT_METHODS.join(",")}
      data-current-js-interaction-eligible={
        interactionEnabled ? "true" : "false"
      }
      data-current-js-source-label-rendering="donor-retained-logical-button-disabled"
      data-current-js-source-visual-frame={sourceVisualFrame}
      data-deterministic-evidence-capture={
        deterministicEvidenceCapture ? "true" : "false"
      }
      data-human-visual-review-accepted="false"
      data-host-glossary-content-resolved="false"
      data-host-wrong-feedback-resolved="false"
      data-lesson-published="false"
      data-original-runtime-authority="false"
      data-owner-accepted="false"
      data-post-drop-visual-parity-established="false"
      data-publication-authorized="false"
      data-replay-parity-established="false"
      data-source-visual-hide-parity-established="false"
      data-strict-acceptance-effect="none"
      data-strict-migration-complete="false"
      data-visual-parity-established="false"
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
            ? event.target.dataset.in010FocusControl ?? null
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
        .course-g04-l03-in-010-mobile-fallback-slot,
        .course-g04-l03-in-010-mobile-controls {
          display: none;
        }

        .course-g04-l03-in-010-stage-surface button:focus-visible {
          outline: 4px solid #ffdd29;
          outline-offset: 3px;
        }

        @media ${RESPONSIVE_CONTROLS_MEDIA} {
          .course-g04-l03-in-010-stage-surface {
            display: none;
          }

          .course-g04-l03-in-010-mobile-fallback-slot {
            aspect-ratio: 4 / 3;
            display: block;
            inset: 0 0 auto;
            pointer-events: none;
            position: absolute;
            width: 100%;
            z-index: 4;
          }

          .course-g04-l03-in-010-mobile-controls {
            background: rgb(233 247 255 / 96%);
            border: 2px solid #224b8e;
            border-radius: 12px;
            box-sizing: border-box;
            color: #111;
            display: grid;
            font-family: ${SOURCE_FONT};
            gap: 10px;
            max-width: 100%;
            min-width: 0;
            padding: 12px;
          }

          .course-g04-l03-in-010-mobile-controls--fallback {
            left: 3%;
            max-height: 92%;
            overflow: auto;
            pointer-events: auto;
            position: absolute;
            right: 3%;
            top: 4%;
          }

          .course-g04-l03-in-010-mobile-controls--portal {
            margin: 12px 0;
            max-width: 100%;
            pointer-events: auto;
            position: relative;
            width: 100%;
          }

          .course-g04-l03-in-010-mobile-instruction,
          .course-g04-l03-in-010-mobile-loading,
          .course-g04-l03-in-010-mobile-status {
            font-family: system-ui, sans-serif;
            font-size: 15px;
            line-height: 1.3;
            margin: 0;
          }

          .course-g04-l03-in-010-mobile-status {
            font-weight: 750;
          }

          .course-g04-l03-in-010-mobile-controls fieldset {
            border: 0;
            margin: 0;
            min-width: 0;
            padding: 0;
          }

          .course-g04-l03-in-010-mobile-controls legend {
            font-size: 16px;
            font-weight: 850;
            margin-bottom: 7px;
          }

          .course-g04-l03-in-010-mobile-card-grid,
          .course-g04-l03-in-010-mobile-target-grid {
            display: grid;
            gap: 8px;
            grid-template-columns: repeat(3, minmax(48px, 1fr));
            min-width: 0;
          }

          .course-g04-l03-in-010-mobile-controls button {
            background: #fff;
            border: 2px solid #224b8e;
            border-radius: 9px;
            box-sizing: border-box;
            color: #111;
            font: 800 14px ${SOURCE_FONT};
            min-height: 48px;
            min-width: 48px;
            overflow-wrap: anywhere;
            padding: 7px;
          }

          .course-g04-l03-in-010-mobile-card-grid button {
            align-items: center;
            display: flex;
            gap: 6px;
            justify-content: center;
          }

          .course-g04-l03-in-010-mobile-controls button[aria-pressed="true"] {
            background: #ffdd29;
            box-shadow: inset 0 0 0 2px #082d86;
          }

          .course-g04-l03-in-010-mobile-controls button:focus-visible {
            box-shadow: 0 0 0 3px #fff200;
            outline: 3px solid #001d6d;
            outline-offset: 2px;
          }

          .course-g04-l03-in-010-mobile-controls button:disabled {
            cursor: default;
            opacity: .58;
          }

          .course-g04-l03-in-010-mobile-dialog,
          .course-g04-l03-in-010-mobile-complete {
            background: #ffffcc;
            border: 3px solid #224b8e;
            border-radius: 12px;
            display: grid;
            gap: 8px;
            padding: 12px;
          }

          .course-g04-l03-in-010-mobile-dialog button {
            min-height: 48px;
          }

          .course-g04-l03-in-010-mobile-complete {
            background: #9900ff;
            color: #fff;
          }

          .course-g04-l03-in-010-mobile-complete p {
            font-family: system-ui, sans-serif;
            line-height: 1.3;
            margin: 0;
          }

          .course-g04-l03-in-010-mobile-complete strong {
            font-size: 24px;
          }
        }

        @media (max-width: 390px) {
          .course-g04-l03-in-010-mobile-card-grid,
          .course-g04-l03-in-010-mobile-target-grid {
            grid-template-columns: repeat(2, minmax(48px, 1fr));
          }
        }

        @media (min-width: 1280px) and (any-pointer: coarse) {
          .course-g04-l03-in-010-mobile-controls--portal {
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
          <StageSurface
            canvasStatus={canvasStatus}
            controlsReady={controlsReady}
            dispatch={dispatch}
            interaction={interaction}
            onCloseWrong={closeWrong}
            wrongCloseRef={stageWrongCloseRef}
          />
          {companionTarget
            ? createPortal(mobileSurface, companionTarget)
            : (
                <div className="course-g04-l03-in-010-mobile-fallback-slot">
                  {mobileSurface}
                </div>
              )}
        </>
      ) : null}
    </div>
  );
}

export {COURSE_G04_L03_IN_010_SOURCE};
export const COURSE_G04_L03_IN_010_MOVIE = candidate.movie;
export const COURSE_G04_L03_IN_010_RUNTIME = candidate.runtime;
export const COURSE_G04_L03_IN_010_SOURCE_CONTRACT = Object.freeze({
  ...candidate.sourceContract,
  currentJavascriptInteractionStatus:
    "source-script-bound-functional-candidate",
  currentJavascriptInteractionScope: Object.freeze([
    "six-source-bound-city-temperature-cards-and-exact-suffix-targets",
    "html-drag-and-drop-and-select-then-target-keyboard-alternative",
    "canvas-static-glyph-wrong-fallback-with-host-global-unresolved-and-close-retry",
    "source-target-label-reveal-after-logical-correct-placement",
    "source-buttons-disabled-after-placement-with-f263-source-visual-retained",
    "no-source-hide-or-post-drop-visual-parity-claim",
    "per-card-1500ms-feedback-before-sixth-card-final-feedback",
    "sixth-card-two-stage-23-over-12-second-feedback-and-persistent-current-js-terminal",
    "unfilled-target-controls-disclose-position-only",
    "two-source-glossary-callback-hits-safe-disabled",
    "host-pause-freezes-current-js-per-card-and-final-feedback-delays",
    "reduced-motion-immediate-current-js-feedback-transitions",
    "whole-renderer-replay-reset-and-source-canvas-remount",
    "responsive-mobile-and-coarse-pointer-touch-control-surface",
    "page-interaction-companion-portal-with-stage-fallback",
    "non-overlapping-mobile-target-grid-for-33-and-34-degree-targets",
    "wide-coarse-companion-grid-row-seven",
    "desktop-mobile-focus-migration-and-wrong-close-focus-restore",
    "interactive-canvas-aria-inert-and-pointer-event-isolation",
    "answer-controls-fail-closed-until-source-canvas-ready",
    "memoized-frame-263-initial-donor-under-frame-264-functional-overlay",
    "deterministic-entry-state-capture-preserves-requested-frame-without-overlay",
    "no-local-help-clear-or-new-controls-invented",
  ]),
  currentJavascriptTiming: COURSE_G04_L03_IN_010_CURRENT_JS_TIMING,
  interactionAuthority: COURSE_G04_L03_IN_010_INTERACTION_AUTHORITY,
  wrongFeedbackTextStatus:
    "canvas-static-glyph-fallback-host-global-unresolved",
  correctFeedbackTextStatus: "modern-assistive-not-source-exact",
  finalCorrectFeedbackTextStatus:
    "source-authoring-text-without-original-runtime-causality",
  sourceGlossaryActionStatus: "two-source-hits-safe-disabled",
  localControlStatus: "no-help-clear-or-new-controls",
  sourceVisualHideParityEstablished: false,
  postDropVisualParityEstablished: false,
  visualParityEstablished: false,
  mainTimelineAudioStatus: "current-js-engineering-candidate-unaccepted",
  interactionFeedbackAudioStatus:
    "inventoried-unimplemented-unaccepted",
  associatedAudioStatus: "current-js-engineering-candidate-unaccepted",
  spanishInteractionStatus: "unimplemented-disabled",
  naturalTerminalContinuationEstablished: false,
  behaviorParityEstablished: false,
  replayParityEstablished: false,
  originalRuntimeAuthorityEstablished: false,
  fullFrameRmseEstablished: false,
  humanVisualReviewAccepted: false,
  ownerAccepted: false,
  strictMigrationComplete: false,
  publicationAuthorized: false,
  lessonPublished: false,
  strictAcceptanceEffect: "none",
});
export const COURSE_G04_L03_IN_010_SCENARIOS = candidate.scenarios;
export const normalizeCourseG04L03In010Frame = candidate.normalizeFrame;
export const getCourseG04L03In010FrameState = candidate.getFrameState;
export const buildCourseG04L03In010CaptureAttributes =
  candidate.buildCaptureAttributes;

export default Object.freeze({
  ...candidate.module,
  reducedMotionFrame: SOURCE_INTERACTION_FRAME,
  Renderer: CourseG04L03In010Renderer,
});
