"use client";

import React, {
  useEffect,
  useReducer,
  useRef,
  useState,
} from "react";
import type {Dispatch, DragEvent, RefObject} from "react";
import {createPortal} from "react-dom";

import type {AnimationRendererProps} from "../contract";
import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G04_L03_TI_002_CARDS,
  COURSE_G04_L03_TI_002_COMPLETION_FEEDBACK,
  COURSE_G04_L03_TI_002_CORRECT_FEEDBACK,
  COURSE_G04_L03_TI_002_CURRENT_JS_TIMING,
  COURSE_G04_L03_TI_002_INSTRUCTION,
  COURSE_G04_L03_TI_002_INTERACTION_AUTHORITY,
  COURSE_G04_L03_TI_002_WRONG_FEEDBACK,
  createCourseG04L03Ti002KeyTermDragState,
  getCourseG04L03Ti002PlacementCount,
  reduceCourseG04L03Ti002KeyTermDrag,
  type CourseG04L03Ti002Card,
  type CourseG04L03Ti002CardId,
  type CourseG04L03Ti002KeyTermDragAction,
  type CourseG04L03Ti002KeyTermDragState,
  type CourseG04L03Ti002TargetId,
} from "../timelines/course-g04-l03-ti-002-key-term-drag-interaction";
import {
  COURSE_G04_L03_TI_002_CONFIG,
  COURSE_G04_L03_TI_002_SOURCE,
} from "../timelines/course-g04-l03-ti-002";

const candidate = createSourceStaticCanvasCandidate(
  COURSE_G04_L03_TI_002_CONFIG,
);
const SourceStaticRenderer = candidate.Renderer;

const SOURCE_INTERACTION_FRAME = 238;
const SOURCE_CLEAN_QUESTION_FRAME = 237;
const SOURCE_INTERACTION_DOMAIN = "sprite-272";
const SOURCE_INTERACTION_SCENARIO = "source-static-frame";
const SOURCE_FONT =
  '"Bauhaus Md BT", "Arial Rounded MT Bold", "Trebuchet MS", ui-rounded, sans-serif';
const RESPONSIVE_CONTROLS_MEDIA =
  "(max-width: 640px), (any-pointer: coarse)";
const SOURCE_GLOSSARY_TERMS = Object.freeze([
  "Order",
  "Less than",
  "Zero",
  "Value",
  "Line",
  "Ordering",
  "Greater than",
  "Negative",
  "Positive",
]);

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
  [...COURSE_G04_L03_TI_002_CARDS].sort(
    (left, right) => left.targetCenter.y - right.targetCenter.y,
  ),
);

export const getCourseG04L03Ti002SourceCanvasRenderKey = (
  replay: number,
  seed: number,
  sourceVisualFrame: number,
): string => `source-ti002-${replay}-${seed}-${sourceVisualFrame}`;

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
    return "The source question could not load. Answer controls are unavailable.";
  }
  if (status === "blocked") {
    return "The source question is unavailable in this context.";
  }
  return "Loading the source question before answer controls are enabled…";
}

function placedCardForTarget(
  interaction: CourseG04L03Ti002KeyTermDragState,
  targetId: CourseG04L03Ti002TargetId,
) {
  return COURSE_G04_L03_TI_002_CARDS.find(
    ({id}) => interaction.placements[id] === targetId,
  );
}

function sourceTableFillColor(x: number, y: number) {
  const red = Math.round(227.7 - (0.1314 * x) - (0.035 * y));
  const green = Math.round(248.28 - (0.04 * x) - (0.01167 * y));
  const blue = Math.round(243.32 - (0.05714 * x) - (0.01556 * y));
  return `rgb(${red} ${green} ${blue})`;
}

function sourceCardOriginMaskBackground(
  card: CourseG04L03Ti002Card,
  left: number,
  right: number,
) {
  return `linear-gradient(90deg, ${
    sourceTableFillColor(left, card.sourceCenter.y)
  }, ${sourceTableFillColor(right, card.sourceCenter.y)})`;
}

function SourceGlossaryBoundary() {
  return (
    <div
      aria-label="Source glossary links are unavailable in this current JavaScript candidate."
      data-host-hyperlinks="safe-disabled"
      style={visuallyHiddenStyle}
    >
      {SOURCE_GLOSSARY_TERMS.map((term, index) => (
        <span
          aria-disabled="true"
          data-source-glossary-term={term}
          key={term}
          role="link"
        >
          {term}
          {index < SOURCE_GLOSSARY_TERMS.length - 1 ? ", " : ""}
        </span>
      ))}
    </div>
  );
}

function TermPicture({card}: {readonly card: CourseG04L03Ti002Card}) {
  if (card.pictureKind === "decrease") {
    return (
      <svg
        aria-label="A large circle followed by a smaller circle"
        role="img"
        viewBox="0 0 420 140"
      >
        <circle cx="145" cy="70" fill="#c8ffcb" r="52" stroke="#000" strokeWidth="3" />
        <circle cx="285" cy="70" fill="#c8ffcb" r="32" stroke="#000" strokeWidth="3" />
      </svg>
    );
  }

  return (
    <svg
      aria-label={`Number-line picture for ${card.term}`}
      role="img"
      viewBox="0 0 520 120"
    >
      <line x1="26" x2="494" y1="48" y2="48" stroke="#111" strokeWidth="3" />
      <path d="M 18 48 L 29 42 L 29 54 Z" fill="#111" />
      <path d="M 502 48 L 491 42 L 491 54 Z" fill="#111" />
      {Array.from({length: 17}, (_, index) => index - 8).map((value, index) => {
        const x = 44 + (index * 27);
        const highlighted =
          card.pictureKind === "negative"
            ? value < 0
            : card.pictureKind === "positive"
              ? value > 0
              : card.pictureKind === "zero"
                ? value === 0
                : false;
        return (
          <g key={value}>
            <line x1={x} x2={x} y1="38" y2="58" stroke="#111" strokeWidth="2" />
            <text
              fill={highlighted ? "#f20d19" : "#111"}
              fontFamily="Arial, sans-serif"
              fontSize="18"
              textAnchor="middle"
              x={x}
              y="83"
            >
              {value > 0 ? `+${value}` : value}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

interface StageSurfaceProps {
  readonly canvasStatus: SourceCanvasStatus;
  readonly controlsReady: boolean;
  readonly dispatch: Dispatch<CourseG04L03Ti002KeyTermDragAction>;
  readonly expandedTargetId: CourseG04L03Ti002TargetId | null;
  readonly interaction: CourseG04L03Ti002KeyTermDragState;
  readonly onClosePicture: () => void;
  readonly onCloseWrong: () => void;
  readonly onOpenPicture: (targetId: CourseG04L03Ti002TargetId) => void;
  readonly pictureCloseRef: RefObject<HTMLButtonElement | null>;
  readonly wrongCloseRef: RefObject<HTMLButtonElement | null>;
}

function StageSurface({
  canvasStatus,
  controlsReady,
  dispatch,
  expandedTargetId,
  interaction,
  onClosePicture,
  onCloseWrong,
  onOpenPicture,
  pictureCloseRef,
  wrongCloseRef,
}: StageSurfaceProps) {
  const locked =
    !controlsReady || interaction.locked || expandedTargetId !== null;
  const startDrag = (
    event: DragEvent<HTMLButtonElement>,
    cardId: CourseG04L03Ti002CardId,
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
    targetId: CourseG04L03Ti002TargetId,
  ) => {
    event.preventDefault();
    const transferredId = event.dataTransfer.getData("text/plain");
    const cardId = COURSE_G04_L03_TI_002_CARDS.some(
      ({id}) => id === transferredId,
    )
      ? transferredId as CourseG04L03Ti002CardId
      : undefined;
    dispatch(cardId
      ? {type: "drop-card", cardId, targetId}
      : {type: "drop-card", targetId});
  };
  const placementCount = getCourseG04L03Ti002PlacementCount(interaction);
  const expandedCard = COURSE_G04_L03_TI_002_CARDS.find(
    ({targetId}) => targetId === expandedTargetId,
  );

  return (
    <svg
      aria-label="Source-script-bound current JavaScript key-term matching activity"
      className="course-g04-l03-ti-002-stage-surface"
      data-audio-feedback="inventoried-unimplemented-unaccepted"
      data-behavior-parity-established="false"
      data-current-js-controls-ready={controlsReady ? "true" : "false"}
      data-current-js-functional-candidate="true"
      data-picture-enlargement-open={expandedTargetId ? "true" : "false"}
      data-interaction-outcome={interaction.outcome}
      data-legacy-actionscript-executed="false"
      data-source-canvas-status={canvasStatus}
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

          {COURSE_G04_L03_TI_002_CARDS.map((card) => {
            const placed = interaction.placements[card.id] !== null;
            const selected = interaction.selectedCardId === card.id;
            const hitWidth = Math.max(48, card.sourceSize.width + 8);
            const hitHeight = Math.max(56, card.sourceSize.height + 4);
            const unclampedMaskWidth = card.sourceSize.width + 6;
            const maskLeft = Math.max(
              60,
              card.sourceCenter.x - (unclampedMaskWidth / 2),
            );
            const maskRight =
              card.sourceCenter.x + (unclampedMaskWidth / 2);
            const maskWidth = maskRight - maskLeft;
            const maskHeight = card.sourceSize.height + 6;
            return (
              <React.Fragment key={card.id}>
                <span
                  aria-hidden="true"
                  data-source-card-origin-mask={card.id}
                  style={{
                    background: sourceCardOriginMaskBackground(
                      card,
                      maskLeft,
                      maskRight,
                    ),
                    height: maskHeight,
                    left: maskLeft,
                    pointerEvents: "none",
                    position: "absolute",
                    top: card.sourceCenter.y - (maskHeight / 2),
                    width: maskWidth,
                  }}
                />
                {placed ? null : (
                  <button
                    aria-label={`Select ${card.accessibleLabel} to move`}
                    aria-pressed={selected}
                    data-source-card={card.id}
                    data-ti002-focus-control={`card-${card.id}`}
                    disabled={locked}
                    draggable={!locked}
                    onClick={() => dispatch({
                      type: "select-card",
                      cardId: card.id,
                    })}
                    onDragStart={(event) => startDrag(event, card.id)}
                    style={{
                      background: selected
                        ? "rgb(255 221 41 / 22%)"
                        : "transparent",
                      border: selected
                        ? "3px solid #082d86"
                        : "1px solid transparent",
                      boxSizing: "border-box",
                      color: "#111",
                      cursor: locked ? "default" : "grab",
                      font: `400 16px ${SOURCE_FONT}`,
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
                    {card.sourceText}
                  </button>
                )}
              </React.Fragment>
            );
          })}

          {targetOrder.map((targetCard) => {
            const placedCard = placedCardForTarget(
              interaction,
              targetCard.targetId,
            );
            const targetLocked = locked
              || interaction.selectedCardId === null
              || placedCard !== undefined;
            return (
              <button
                aria-label={placedCard
                  ? `${placedCard.accessibleLabel} matched with ${targetCard.definition}`
                  : `Place selected key term with ${targetCard.definition}`}
                data-source-target={targetCard.targetId}
                data-ti002-focus-control={`target-${targetCard.targetId}`}
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
                  alignItems: "center",
                  background: "transparent",
                  border: 0,
                  boxSizing: "border-box",
                  color: placedCard ? "#111" : "transparent",
                  cursor: targetLocked ? "default" : "pointer",
                  display: "flex",
                  height: targetCard.targetSize.height,
                  justifyContent: "center",
                  left: targetCard.targetCenter.x - targetCard.targetSize.width / 2,
                  margin: 0,
                  padding: 0,
                  pointerEvents: "auto",
                  position: "absolute",
                  top: targetCard.targetCenter.y - targetCard.targetSize.height / 2,
                  width: targetCard.targetSize.width,
                }}
                type="button"
              >
                {placedCard ? (
                  <span
                    aria-hidden="true"
                    data-source-target-reveal={targetCard.targetId}
                    style={{
                      alignItems: "center",
                      color: "#000",
                      display: "flex",
                      fontFamily: SOURCE_FONT,
                      fontSize: 16,
                      height: placedCard.sourceSize.height,
                      justifyContent: "center",
                      lineHeight: 1.05,
                      textAlign: "center",
                      whiteSpace: "pre-line",
                      width: placedCard.sourceSize.width,
                    }}
                  >
                    {placedCard.sourceText}
                  </span>
                ) : (
                  <span style={visuallyHiddenStyle}>Empty target</span>
                )}
              </button>
            );
          })}

          {targetOrder.map((card) => (
            <button
              aria-haspopup="dialog"
              aria-label={`Enlarge picture for ${card.definition}`}
              data-source-picture={card.targetId}
              data-ti002-focus-control={`picture-${card.targetId}`}
              disabled={locked}
              key={card.targetId}
              onClick={() => onOpenPicture(card.targetId)}
              style={{
                background: "transparent",
                border: 0,
                color: "transparent",
                cursor: locked ? "default" : "zoom-in",
                height: card.pictureSize.height,
                left: card.pictureCenter.x - card.pictureSize.width / 2,
                margin: 0,
                padding: 0,
                pointerEvents: "auto",
                position: "absolute",
                top: card.pictureCenter.y - card.pictureSize.height / 2,
                width: card.pictureSize.width,
              }}
              type="button"
            >
              Enlarge picture
            </button>
          ))}

          {expandedCard ? (
            <div
              aria-describedby="course-g04-l03-ti-002-stage-picture-copy"
              aria-label={`Enlarged picture for ${expandedCard.term}`}
              aria-modal="true"
              data-picture-enlargement="current-js-source-script-bound"
              role="dialog"
              style={{
                background: "#fff",
                border: "3px solid #224b8e",
                borderRadius: 18,
                boxShadow: "0 4px 16px rgb(0 0 0 / 35%)",
                boxSizing: "border-box",
                color: "#111",
                left: 125,
                minHeight: 250,
                padding: "16px 20px",
                pointerEvents: "auto",
                position: "absolute",
                top: 170,
                width: 550,
                zIndex: 5,
              }}
            >
              <button
                aria-label="Close enlarged picture"
                data-ti002-focus-control="close-picture"
                onClick={onClosePicture}
                ref={pictureCloseRef}
                style={{
                  background: "linear-gradient(#ffad17, #e95c00)",
                  border: "2px solid #fff1cb",
                  borderRadius: 4,
                  color: "#fff",
                  float: "right",
                  font: `700 15px ${SOURCE_FONT}`,
                  height: 48,
                  minWidth: 64,
                }}
                type="button"
              >
                Close
              </button>
              <strong id="course-g04-l03-ti-002-stage-picture-copy">
                {expandedCard.definition}
              </strong>
              <TermPicture card={expandedCard} />
            </div>
          ) : null}

          <SourceGlossaryBoundary />

          {interaction.outcome === "wrong" ? (
            <div
              aria-describedby="course-g04-l03-ti-002-stage-wrong-copy"
              aria-label="Incorrect placement feedback"
              data-source-copy="modern-assistive-not-source-exact"
              role="alertdialog"
              style={{
                alignItems: "center",
                background: "#ffffcc",
                border: "1px solid #6a6231",
                boxSizing: "border-box",
                color: "#000",
                display: "grid",
                gridTemplateColumns: "1fr 104px",
                height: 96,
                left: 181,
                padding: 12,
                pointerEvents: "auto",
                position: "absolute",
                top: 226,
                width: 464,
              }}
            >
              <p
                id="course-g04-l03-ti-002-stage-wrong-copy"
                style={{fontSize: 22, lineHeight: 1.2, margin: 0}}
              >
                {COURSE_G04_L03_TI_002_WRONG_FEEDBACK}
              </p>
              <button
                aria-label="Close feedback and try the same card again"
                data-ti002-focus-control="close-wrong"
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
                Close
              </button>
            </div>
          ) : null}

          {interaction.outcome === "correct-feedback" ? (
            <div
              aria-hidden="true"
              data-source-copy="modern-assistive-not-source-exact"
              style={{
                alignItems: "center",
                background: "linear-gradient(#ffd934, #a46b00)",
                border: "3px solid #6d4100",
                color: "#5e1800",
                display: "flex",
                fontSize: 34,
                fontWeight: 900,
                height: 48,
                justifyContent: "center",
                left: 252,
                position: "absolute",
                textShadow: "1px 1px 0 #fff1a0",
                top: 142,
                width: 296,
              }}
            >
              Correct!
            </div>
          ) : null}

          {interaction.outcome === "complete" ? (
            <div
              aria-hidden="true"
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
                height: 132,
                justifyContent: "center",
                left: 244,
                position: "absolute",
                textShadow: "2px 2px 0 #73008e",
                top: 235,
                width: 320,
              }}
            >
              {COURSE_G04_L03_TI_002_COMPLETION_FEEDBACK}
            </div>
          ) : null}

          <span aria-live="polite" role="status" style={visuallyHiddenStyle}>
            {interaction.outcome === "correct-feedback"
              ? `${COURSE_G04_L03_TI_002_CORRECT_FEEDBACK} ${placementCount} of 5 cards placed.`
              : interaction.outcome === "complete"
                ? COURSE_G04_L03_TI_002_COMPLETION_FEEDBACK
                : interaction.feedback ?? ""}
          </span>
        </div>
      </foreignObject>
    </svg>
  );
}

interface MobileSurfaceProps extends StageSurfaceProps {
  readonly placement: "fallback" | "portal";
}

function MobileSurface({
  canvasStatus,
  controlsReady,
  dispatch,
  expandedTargetId,
  interaction,
  onClosePicture,
  onCloseWrong,
  onOpenPicture,
  placement,
  pictureCloseRef,
  wrongCloseRef,
}: MobileSurfaceProps) {
  const locked =
    !controlsReady || interaction.locked || expandedTargetId !== null;
  const selected = COURSE_G04_L03_TI_002_CARDS.find(
    ({id}) => id === interaction.selectedCardId,
  );
  const expandedCard = COURSE_G04_L03_TI_002_CARDS.find(
    ({targetId}) => targetId === expandedTargetId,
  );
  const placementCount = getCourseG04L03Ti002PlacementCount(interaction);

  return (
    <section
      aria-label="Mobile controls for matching key terms with definitions and pictures"
      className={
        "course-g04-l03-ti-002-mobile-controls "
        + `course-g04-l03-ti-002-mobile-controls--${placement}`
      }
      data-current-js-controls-ready={controlsReady ? "true" : "false"}
      data-interaction-companion-placement={placement}
      data-interaction-companion-surface="mobile"
      data-interaction-outcome={interaction.outcome}
      data-mobile-touch-target-min="48"
      data-source-canvas-status={canvasStatus}
    >
      <p className="course-g04-l03-ti-002-mobile-instruction">
        {COURSE_G04_L03_TI_002_INSTRUCTION}
      </p>
      {!controlsReady ? (
        <p
          aria-live={canvasStatus === "error" ? "assertive" : "polite"}
          className="course-g04-l03-ti-002-mobile-loading"
          role={canvasStatus === "error" ? "alert" : "status"}
        >
          {sourceCanvasStatusMessage(canvasStatus)}
        </p>
      ) : null}
      <p aria-live="polite" className="course-g04-l03-ti-002-mobile-status">
        {interaction.outcome === "correct-feedback"
          ? `${COURSE_G04_L03_TI_002_CORRECT_FEEDBACK} ${placementCount} of 5 cards placed.`
          : selected
            ? `${selected.accessibleLabel} selected. Choose its matching definition and picture.`
            : `${placementCount} of 5 cards placed.`}
      </p>

      <fieldset disabled={locked}>
        <legend>1. Choose a key term</legend>
        <div className="course-g04-l03-ti-002-mobile-card-grid">
          {COURSE_G04_L03_TI_002_CARDS.map((card) => {
            const placed = interaction.placements[card.id] !== null;
            return (
              <button
                aria-pressed={interaction.selectedCardId === card.id}
                data-ti002-focus-control={`card-${card.id}`}
                disabled={locked || placed}
                key={card.id}
                onClick={() => dispatch({type: "select-card", cardId: card.id})}
                type="button"
              >
                <span>{card.term}</span>
                {placed ? <strong aria-label="placed">✓</strong> : null}
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset disabled={locked}>
        <legend>2. Choose the matching definition and picture</legend>
        <div className="course-g04-l03-ti-002-mobile-target-grid">
          {targetOrder.map((targetCard) => {
            const placed = placedCardForTarget(
              interaction,
              targetCard.targetId,
            );
            return (
              <div
                className="course-g04-l03-ti-002-mobile-target-row"
                key={targetCard.targetId}
              >
                <button
                  aria-label={placed
                    ? `${placed.accessibleLabel} matched with ${targetCard.definition}`
                    : `Match selected key term with ${targetCard.definition}`}
                  data-ti002-focus-control={`target-${targetCard.targetId}`}
                  disabled={
                    locked
                    || interaction.selectedCardId === null
                    || placed !== undefined
                  }
                  onClick={() => dispatch({
                    type: "drop-card",
                    targetId: targetCard.targetId,
                  })}
                  type="button"
                >
                  <span>{targetCard.definition}</span>
                  {placed ? <strong>{placed.term} ✓</strong> : null}
                </button>
                <button
                  aria-haspopup="dialog"
                  aria-label={`Enlarge picture for ${targetCard.definition}`}
                  data-ti002-focus-control={`picture-${targetCard.targetId}`}
                  disabled={locked}
                  onClick={() => onOpenPicture(targetCard.targetId)}
                  type="button"
                >
                  Enlarge picture
                </button>
              </div>
            );
          })}
        </div>
      </fieldset>

      {expandedCard ? (
        <div
          aria-describedby="course-g04-l03-ti-002-mobile-picture-copy"
          aria-label={`Enlarged picture for ${expandedCard.term}`}
          aria-modal="true"
          className="course-g04-l03-ti-002-mobile-dialog"
          data-picture-enlargement="current-js-source-script-bound"
          role="dialog"
        >
          <strong id="course-g04-l03-ti-002-mobile-picture-copy">
            {expandedCard.definition}
          </strong>
          <TermPicture card={expandedCard} />
          <button
            aria-label="Close enlarged picture"
            data-ti002-focus-control="close-picture"
            onClick={onClosePicture}
            ref={pictureCloseRef}
            type="button"
          >
            Close picture
          </button>
        </div>
      ) : null}

      <SourceGlossaryBoundary />

      {interaction.outcome === "wrong" ? (
        <div
          aria-label="Incorrect placement feedback"
          className="course-g04-l03-ti-002-mobile-dialog"
          data-source-copy="modern-assistive-not-source-exact"
          role="alertdialog"
        >
          <strong>Incorrect placement</strong>
          <p>{COURSE_G04_L03_TI_002_WRONG_FEEDBACK}</p>
          <button
            aria-label="Close feedback and try the same card again"
            data-ti002-focus-control="close-wrong"
            onClick={onCloseWrong}
            ref={wrongCloseRef}
            type="button"
          >
            Close
          </button>
        </div>
      ) : null}

      {interaction.outcome === "complete" ? (
        <div
          aria-live="polite"
          className="course-g04-l03-ti-002-mobile-complete"
          role="status"
        >
          <strong>{COURSE_G04_L03_TI_002_COMPLETION_FEEDBACK}</strong>
          <p>Use Replay to practice again or Next to continue.</p>
        </div>
      ) : null}
    </section>
  );
}

export function CourseG04L03Ti002Renderer(props: AnimationRendererProps) {
  const [interaction, dispatch] = useReducer(
    reduceCourseG04L03Ti002KeyTermDrag,
    undefined,
    createCourseG04L03Ti002KeyTermDragState,
  );
  const [expandedTargetId, setExpandedTargetId] =
    useState<CourseG04L03Ti002TargetId | null>(null);
  const [companionTarget, setCompanionTarget] =
    useState<HTMLElement | null>(null);
  const [canvasStatus, setCanvasStatus] =
    useState<SourceCanvasStatus>("idle");
  const rendererRef = useRef<HTMLDivElement>(null);
  const visualHostRef = useRef<HTMLDivElement>(null);
  const lastFocusedControlRef = useRef<string | null>(null);
  const stageWrongCloseRef = useRef<HTMLButtonElement>(null);
  const mobileWrongCloseRef = useRef<HTMLButtonElement>(null);
  const stagePictureCloseRef = useRef<HTMLButtonElement>(null);
  const mobilePictureCloseRef = useRef<HTMLButtonElement>(null);
  const correctFeedbackRemainingMs = useRef(
    COURSE_G04_L03_TI_002_CURRENT_JS_TIMING.correctFeedbackMs,
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
    ? SOURCE_CLEAN_QUESTION_FRAME
    : props.frame;
  const sourceCanvasRenderKey = getCourseG04L03Ti002SourceCanvasRenderKey(
    props.replay ?? 0,
    props.seed,
    sourceVisualFrame,
  );
  const sourceVisualState = interactionEnabled
    ? candidate.getFrameState(sourceVisualFrame, {
        entryStateSha256: props.entryStateSha256,
        frameDomain,
        lang: props.lang,
        requirementId: props.requirementId,
        scenario: props.scenario,
        seed: props.seed,
        traceId: props.traceId,
      })
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
          `[data-ti002-focus-control="${focusControlKey}"]`,
        )))
        .find((element) =>
          isVisible(element) && !element.hasAttribute("disabled")
        );
      control?.focus();
    });
  };

  useEffect(() => {
    dispatch({type: "replay"});
    setExpandedTargetId(null);
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
  }, [interactionEnabled, props.replay, sourceVisualFrame]);

  useEffect(() => {
    correctFeedbackRemainingMs.current =
      COURSE_G04_L03_TI_002_CURRENT_JS_TIMING.correctFeedbackMs;
  }, [interaction.lastPlacedCardId]);

  useEffect(() => {
    if (interaction.outcome !== "correct-feedback") return;
    if (props.reducedMotion) {
      const nextCard = COURSE_G04_L03_TI_002_CARDS.find(
        ({id}) => interaction.placements[id] === null,
      );
      dispatch({type: "feedback-complete"});
      if (nextCard) focusControl(`card-${nextCard.id}`);
      return;
    }
    if (props.paused) return;

    const startedAt = performance.now();
    const timeout = window.setTimeout(() => {
      correctFeedbackRemainingMs.current =
        COURSE_G04_L03_TI_002_CURRENT_JS_TIMING.correctFeedbackMs;
      const nextCard = COURSE_G04_L03_TI_002_CARDS.find(
        ({id}) => interaction.placements[id] === null,
      );
      dispatch({type: "feedback-complete"});
      if (nextCard) focusControl(`card-${nextCard.id}`);
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
    if (interaction.outcome !== "wrong") return;
    focusRenderedControl(mobileWrongCloseRef, stageWrongCloseRef);
  }, [interaction.outcome]);

  useEffect(() => {
    if (expandedTargetId === null) return;
    focusRenderedControl(mobilePictureCloseRef, stagePictureCloseRef);
  }, [expandedTargetId]);

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
          ? active.dataset.ti002FocusControl
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
  const openPicture = (targetId: CourseG04L03Ti002TargetId) => {
    setExpandedTargetId(targetId);
  };
  const closePicture = () => {
    const targetId = expandedTargetId;
    setExpandedTargetId(null);
    if (targetId) focusControl(`picture-${targetId}`);
  };

  const mobileSurface = (
    <MobileSurface
      canvasStatus={canvasStatus}
      controlsReady={controlsReady}
      dispatch={dispatch}
      expandedTargetId={expandedTargetId}
      interaction={interaction}
      onClosePicture={closePicture}
      onCloseWrong={closeWrong}
      onOpenPicture={openPicture}
      placement={companionTarget ? "portal" : "fallback"}
      pictureCloseRef={mobilePictureCloseRef}
      wrongCloseRef={mobileWrongCloseRef}
    />
  );

  return (
    <div
      data-behavior-parity-established="false"
      data-current-js-controls-enabled={interactionEnabled ? "true" : "false"}
      data-current-js-functional-candidate={interactionEnabled ? "true" : "false"}
      data-current-js-functional-scope="ti002-key-term-drag-source-script-bound"
      data-current-js-source-visual-frame={sourceVisualFrame}
      data-deterministic-evidence-capture={
        deterministicEvidenceCapture ? "true" : "false"
      }
      data-owner-accepted="false"
      data-replay-parity-established="false"
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
            ? event.target.dataset.ti002FocusControl ?? null
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
        .course-g04-l03-ti-002-mobile-fallback-slot,
        .course-g04-l03-ti-002-mobile-controls {
          display: none;
        }

        .course-g04-l03-ti-002-stage-surface
        :is(button):focus-visible {
          outline: 4px solid #ffdd29;
          outline-offset: 3px;
        }

        @media ${RESPONSIVE_CONTROLS_MEDIA} {
          .course-g04-l03-ti-002-stage-surface {
            display: none;
          }

          .course-g04-l03-ti-002-mobile-fallback-slot {
            aspect-ratio: 4 / 3;
            display: block;
            inset: 0 0 auto;
            pointer-events: none;
            position: absolute;
            width: 100%;
            z-index: 4;
          }

          .course-g04-l03-ti-002-mobile-controls {
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

          .course-g04-l03-ti-002-mobile-controls--fallback {
            left: 3%;
            max-height: 92%;
            overflow: auto;
            pointer-events: auto;
            position: absolute;
            right: 3%;
            top: 4%;
          }

          .course-g04-l03-ti-002-mobile-controls--portal {
            margin: 12px 0;
            max-width: 100%;
            pointer-events: auto;
            position: relative;
            width: 100%;
          }

          .course-g04-l03-ti-002-mobile-instruction,
          .course-g04-l03-ti-002-mobile-loading,
          .course-g04-l03-ti-002-mobile-status {
            font-family: system-ui, sans-serif;
            font-size: 15px;
            line-height: 1.3;
            margin: 0;
          }

          .course-g04-l03-ti-002-mobile-status {
            font-weight: 750;
          }

          .course-g04-l03-ti-002-mobile-controls fieldset {
            border: 0;
            margin: 0;
            padding: 0;
          }

          .course-g04-l03-ti-002-mobile-controls legend {
            font-size: 16px;
            font-weight: 850;
            margin-bottom: 7px;
          }

          .course-g04-l03-ti-002-mobile-card-grid {
            display: grid;
            gap: 8px;
            grid-template-columns: repeat(5, minmax(48px, 1fr));
          }

          .course-g04-l03-ti-002-mobile-target-grid {
            display: grid;
            gap: 8px;
            grid-template-columns: 1fr;
          }

          .course-g04-l03-ti-002-mobile-target-row {
            display: grid;
            gap: 8px;
            grid-template-columns: minmax(0, 1fr) minmax(112px, auto);
          }

          .course-g04-l03-ti-002-mobile-controls button {
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

          .course-g04-l03-ti-002-mobile-card-grid button {
            display: grid;
            gap: 2px;
          }

          .course-g04-l03-ti-002-mobile-target-row > button:first-child {
            align-items: start;
            display: grid;
            gap: 4px;
            text-align: left;
          }

          .course-g04-l03-ti-002-mobile-target-row strong {
            color: #0c4e30;
          }

          .course-g04-l03-ti-002-mobile-dialog svg {
            max-height: 180px;
            width: 100%;
          }

          .course-g04-l03-ti-002-mobile-controls button[aria-pressed="true"] {
            background: #ffdd29;
            box-shadow: inset 0 0 0 2px #082d86;
          }

          .course-g04-l03-ti-002-mobile-controls button:focus-visible {
            box-shadow: 0 0 0 3px #fff200;
            outline: 3px solid #001d6d;
            outline-offset: 2px;
          }

          .course-g04-l03-ti-002-mobile-controls button:disabled {
            cursor: default;
            opacity: .58;
          }

          .course-g04-l03-ti-002-mobile-dialog,
          .course-g04-l03-ti-002-mobile-complete {
            background: #ffffcc;
            border: 3px solid #224b8e;
            border-radius: 12px;
            display: grid;
            gap: 8px;
            padding: 12px;
          }

          .course-g04-l03-ti-002-mobile-dialog p,
          .course-g04-l03-ti-002-mobile-dialog small,
          .course-g04-l03-ti-002-mobile-complete p {
            font-family: system-ui, sans-serif;
            line-height: 1.3;
            margin: 0;
          }

          .course-g04-l03-ti-002-mobile-complete {
            background: #9900ff;
            color: #fff;
          }

          .course-g04-l03-ti-002-mobile-complete strong {
            font-size: 24px;
          }
        }

        @media (max-width: 520px) {
          .course-g04-l03-ti-002-mobile-card-grid {
            grid-template-columns: repeat(2, minmax(48px, 1fr));
          }

        }

        @media (min-width: 900px) and (any-pointer: coarse) {
          .course-g04-l03-ti-002-mobile-target-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (min-width: 1280px) and (any-pointer: coarse) {
          .course-g04-l03-ti-002-mobile-controls--portal {
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
          <StageSurface
            canvasStatus={canvasStatus}
            controlsReady={controlsReady}
            dispatch={dispatch}
            expandedTargetId={expandedTargetId}
            interaction={interaction}
            onClosePicture={closePicture}
            onCloseWrong={closeWrong}
            onOpenPicture={openPicture}
            pictureCloseRef={stagePictureCloseRef}
            wrongCloseRef={stageWrongCloseRef}
          />
          {companionTarget
            ? createPortal(mobileSurface, companionTarget)
            : (
                <div className="course-g04-l03-ti-002-mobile-fallback-slot">
                  {mobileSurface}
                </div>
              )}
        </>
      ) : null}
    </div>
  );
}

export {COURSE_G04_L03_TI_002_SOURCE};
export const COURSE_G04_L03_TI_002_MOVIE = candidate.movie;
export const COURSE_G04_L03_TI_002_RUNTIME = candidate.runtime;
export const COURSE_G04_L03_TI_002_SOURCE_CONTRACT = Object.freeze({
  ...candidate.sourceContract,
  currentJavascriptInteractionStatus:
    "source-script-bound-functional-candidate",
  currentJavascriptInteractionScope: Object.freeze([
    "five-source-bound-key-term-cards-and-definition-picture-targets",
    "pointer-drag-and-select-then-target-keyboard-alternative",
    "modern-assistive-wrong-feedback-and-close-retry",
    "source-target-reveal-and-card-hide",
    "five-card-completion-feedback",
    "five-source-picture-click-targets-with-modern-enlargement-dialogs",
    "source-geturl-glossary-actions-safe-disabled",
    "host-pause-freezes-current-js-correct-feedback-delay",
    "whole-renderer-replay-reset",
    "responsive-mobile-and-coarse-pointer-touch-control-surface",
    "page-interaction-companion-portal-with-stage-fallback",
    "desktop-mobile-focus-migration",
    "interactive-canvas-accessibility-isolation",
    "answer-controls-fail-closed-until-source-canvas-ready",
    "frame-237-source-visual-with-key-term-origin-masks-under-frame-238-functional-overlay",
    "deterministic-evidence-capture-preserves-requested-frame-without-overlay",
  ]),
  currentJavascriptTiming: COURSE_G04_L03_TI_002_CURRENT_JS_TIMING,
  interactionAuthority: COURSE_G04_L03_TI_002_INTERACTION_AUTHORITY,
  wrongFeedbackTextStatus: "modern-assistive-not-source-exact",
  pictureEnlargementStatus:
    "source-script-bound-modern-svg-representation-not-pixel-parity",
  sourceGlossaryActionStatus: "safe-disabled",
  embeddedCoachAudioStatus: "inventoried-unimplemented-unaccepted",
  associatedAudioStatus: "inventoried-unimplemented-unaccepted",
  spanishInteractionStatus: "unimplemented-disabled",
  naturalTerminalContinuationEstablished: false,
  behaviorParityEstablished: false,
  replayParityEstablished: false,
  originalRuntimeAuthorityEstablished: false,
  ownerAccepted: false,
  strictMigrationComplete: false,
  strictAcceptanceEffect: "none",
});
export const COURSE_G04_L03_TI_002_SCENARIOS = candidate.scenarios;
export const normalizeCourseG04L03Ti002Frame = candidate.normalizeFrame;
export const getCourseG04L03Ti002FrameState = candidate.getFrameState;
export const buildCourseG04L03Ti002CaptureAttributes =
  candidate.buildCaptureAttributes;

export default Object.freeze({
  ...candidate.module,
  reducedMotionFrame: SOURCE_INTERACTION_FRAME,
  Renderer: CourseG04L03Ti002Renderer,
});
