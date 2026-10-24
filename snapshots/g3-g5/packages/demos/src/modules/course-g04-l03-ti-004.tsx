"use client";

import React, {
  useEffect,
  useReducer,
  useRef,
  useState,
} from "react";
import type {Dispatch, DragEvent, RefObject} from "react";
import questionSource from "../modern-lessons/generated/g4-l3-ti004-question.json";
import {Ti004Introduction} from "../modern-lessons/g4-l3-ti004-introduction";
import {Ti004SourceText,TI004_KEY_TERMS,type Ti004OpenTerm} from "../modern-lessons/g4-l3-ti004-keyterms";
import {getTi004TextSnapshot} from "../modern-lessons/g4-l3-ti004-text";
import {Ti004HelpNumberLine} from "../modern-lessons/g4-l3-ti004-help";

import type {AnimationRendererProps} from "../contract";
import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G04_L03_TI_004_CARDS,
  COURSE_G04_L03_TI_004_COMPLETION_FEEDBACK,
  COURSE_G04_L03_TI_004_CORRECT_FEEDBACK,
  COURSE_G04_L03_TI_004_CURRENT_JS_TIMING,
  COURSE_G04_L03_TI_004_INSTRUCTION,
  COURSE_G04_L03_TI_004_INTERACTION_AUTHORITY,
  COURSE_G04_L03_TI_004_SOURCE_GEOMETRY,
  COURSE_G04_L03_TI_004_WRONG_FEEDBACK,
  createCourseG04L03Ti004LeastToGreatestDragState,
  getCourseG04L03Ti004PlacementCount,
  reduceCourseG04L03Ti004LeastToGreatestDrag,
  type CourseG04L03Ti004CardId,
  type CourseG04L03Ti004LeastToGreatestDragAction,
  type CourseG04L03Ti004LeastToGreatestDragState,
  type CourseG04L03Ti004TargetId,
} from "../timelines/course-g04-l03-ti-004-least-to-greatest-drag-interaction";
import {
  COURSE_G04_L03_TI_004_CONFIG,
  COURSE_G04_L03_TI_004_SOURCE,
} from "../timelines/course-g04-l03-ti-004";

const candidate = createSourceStaticCanvasCandidate(
  COURSE_G04_L03_TI_004_CONFIG,
);
const SourceStaticRenderer = candidate.Renderer;

const SOURCE_INTERACTION_FRAME = 124;
const SOURCE_CLEAN_QUESTION_FRAME = 122;
const SOURCE_INTERACTION_DOMAIN = "sprite-274";
const SOURCE_INTERACTION_SCENARIO = "source-static-frame";
const SOURCE_STAGE_BACKGROUND = "#b8d8f7";
const SOURCE_FONT =
  '"Bauhaus Md BT", "Arial Rounded MT Bold", "Trebuchet MS", ui-rounded, sans-serif';
const RESPONSIVE_CONTROLS_MEDIA =
  "(max-width: 640px), (any-pointer: coarse)";
const HELP_NEGATIVE_BODY = questionSource.texts["240"];
const HELP_POSITIVE_BODY = questionSource.texts["241"];
const SOURCE_GLOSSARY_TERMS = Object.freeze([
  "Value",
  "Negative number",
  "Decrease",
  "Positive number",
  "Increase",
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
  [...COURSE_G04_L03_TI_004_CARDS].sort(
    (left, right) => left.numericValue - right.numericValue,
  ),
);

function leastToGreatestSlotNumber(
  targetId: CourseG04L03Ti004TargetId,
): number {
  return targetOrder.findIndex(({targetId: id}) => id === targetId) + 1;
}

export const getCourseG04L03Ti004SourceCanvasRenderKey = (
  replay: number,
  seed: number,
  sourceVisualFrame: number,
): string => `source-ti004-${replay}-${seed}-${sourceVisualFrame}`;

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
  interaction: CourseG04L03Ti004LeastToGreatestDragState,
  targetId: CourseG04L03Ti004TargetId,
) {
  return COURSE_G04_L03_TI_004_CARDS.find(
    ({id}) => interaction.placements[id] === targetId,
  );
}

interface SharedSurfaceProps {
  readonly canvasStatus: SourceCanvasStatus;
  readonly controlsReady: boolean;
  readonly dispatch: Dispatch<CourseG04L03Ti004LeastToGreatestDragAction>;
  readonly helpButtonRef: RefObject<HTMLButtonElement | null>;
  readonly helpCloseRef: RefObject<HTMLButtonElement | null>;
  readonly helpOpen: boolean;
  readonly interaction: CourseG04L03Ti004LeastToGreatestDragState;
  readonly onCloseHelp: () => void;
  readonly onCloseWrong: () => void;
  readonly onOpenHelp: () => void;
  readonly wrongCloseRef: RefObject<HTMLButtonElement | null>;
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
          key={`${term}-${index}`}
          role="link"
        >
          {term}
          {index < SOURCE_GLOSSARY_TERMS.length - 1 ? ", " : ""}
        </span>
      ))}
    </div>
  );
}

function HelpNumberLine() {
  return (
    <div
      aria-hidden="true"
      style={{
        display: "grid",
        gap: 8,
        margin: "16px 10px 0",
        textAlign: "center",
      }}
    >
      <div
        style={{
          alignItems: "end",
          display: "grid",
          fontFamily: "Arial, sans-serif",
          fontSize: 14,
          gridTemplateColumns: "repeat(21, minmax(0, 1fr))",
          lineHeight: 1,
          paddingTop: 8,
          position: "relative",
        }}
      >
        <span
          style={{
            background: "#111",
            height: 2,
            left: 0,
            position: "absolute",
            right: 0,
            top: 0,
          }}
        />
        {Array.from({length: 21}, (_, index) => index - 10).map((value) => (
          <span
            key={value}
            style={{
              color: value < 0 ? "#ef101b" : value > 0 ? "#071cff" : "#111",
              paddingTop: 4,
              position: "relative",
            }}
          >
            <span
              style={{
                background: "#111",
                height: 6,
                left: "50%",
                position: "absolute",
                top: -5,
                width: 1,
              }}
            />
            {value}
          </span>
        ))}
      </div>
    </div>
  );
}

function StageSurface({
  canvasStatus,
  controlsReady,
  dispatch,
  helpButtonRef,
  helpCloseRef,
  helpOpen,
  interaction,
  onCloseHelp,
  onCloseWrong,
  onOpenHelp,
  wrongCloseRef,
}: SharedSurfaceProps) {
  const locked = !controlsReady || interaction.locked || helpOpen;
  const placementCount = getCourseG04L03Ti004PlacementCount(interaction);
  const helpBounds = COURSE_G04_L03_TI_004_SOURCE_GEOMETRY.helpBounds;

  const startDrag = (
    event: DragEvent<HTMLButtonElement>,
    cardId: CourseG04L03Ti004CardId,
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
    targetId: CourseG04L03Ti004TargetId,
  ) => {
    event.preventDefault();
    const transferredId = event.dataTransfer.getData("text/plain");
    const cardId = COURSE_G04_L03_TI_004_CARDS.some(
      ({id}) => id === transferredId,
    )
      ? transferredId as CourseG04L03Ti004CardId
      : undefined;
    dispatch(cardId
      ? {type: "drop-card", cardId, targetId}
      : {type: "drop-card", targetId});
  };

  return (
    <svg
      aria-busy={!controlsReady}
      aria-label="Source-script-bound current JavaScript least-to-greatest card activity"
      className="course-g04-l03-ti-004-stage-surface"
      data-audio-feedback="inventoried-unimplemented-unaccepted"
      data-behavior-parity-established="false"
      data-current-js-controls-ready={controlsReady ? "true" : "false"}
      data-current-js-functional-candidate="true"
      data-help-open={helpOpen ? "true" : "false"}
      data-interaction-outcome={interaction.outcome}
      data-legacy-actionscript-executed="false"
      data-original-runtime-authority="false"
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

          {COURSE_G04_L03_TI_004_CARDS.map((card) => {
            const placed = interaction.placements[card.id] !== null;
            const selected = interaction.selectedCardId === card.id;
            const hitWidth = Math.max(48, card.sourceSize.width + 8);
            const hitHeight = Math.max(48, card.sourceSize.height + 8);
            return placed ? (
              <span
                aria-hidden="true"
                data-source-card-mask={card.id}
                key={card.id}
                style={{
                  background: SOURCE_STAGE_BACKGROUND,
                  height: card.sourceSize.height + 8,
                  left: card.sourceCenter.x - (card.sourceSize.width + 8) / 2,
                  position: "absolute",
                  top: card.sourceCenter.y - (card.sourceSize.height + 8) / 2,
                  width: card.sourceSize.width + 8,
                }}
              />
            ) : (
              <button
                aria-label={`Select ${card.accessibleLabel} to move`}
                aria-pressed={selected}
                data-source-card={card.id}
                data-ti004-focus-control={`card-${card.id}`}
                disabled={locked}
                draggable={!locked}
                key={card.id}
                onClick={() => dispatch({type: "select-card", cardId: card.id})}
                onDragStart={(event) => startDrag(event, card.id)}
                style={{
                  background: selected ? "rgb(255 221 41 / 24%)" : "transparent",
                  border: selected ? "3px solid #082d86" : "1px solid transparent",
                  boxSizing: "border-box",
                  color: "transparent",
                  cursor: locked ? "default" : "grab",
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
                {card.valueText}
              </button>
            );
          })}

          {targetOrder.map((targetCard) => {
            const placedCard = placedCardForTarget(
              interaction,
              targetCard.targetId,
            );
            const slotNumber = leastToGreatestSlotNumber(targetCard.targetId);
            const targetLocked = locked
              || interaction.selectedCardId === null
              || placedCard !== undefined;
            return (
              <button
                aria-label={placedCard
                  ? `${placedCard.accessibleLabel} placed in least-to-greatest slot ${slotNumber}`
                  : `Place selected card in least-to-greatest slot ${slotNumber}`}
                data-source-target={targetCard.targetId}
                data-ti004-focus-control={`target-${targetCard.targetId}`}
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
                  background: placedCard ? "#fff" : "transparent",
                  border: placedCard ? "1px solid #292929" : 0,
                  boxSizing: "border-box",
                  color: placedCard ? "#111" : "transparent",
                  cursor: targetLocked ? "default" : "pointer",
                  display: "flex",
                  font: `400 22px Arial, sans-serif`,
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
                {placedCard?.valueText ?? "Empty target"}
              </button>
            );
          })}

          <button
            aria-haspopup="dialog"
            aria-label="Open Need More Help"
            data-ti004-focus-control="help"
            disabled={!controlsReady || interaction.locked || helpOpen}
            onClick={onOpenHelp}
            ref={helpButtonRef}
            style={{
              background: "linear-gradient(#d9f6ff, #4ebddd)",
              border: "2px solid #4b6f89",
              borderRadius: 10,
              boxSizing: "border-box",
              color: "#113560",
              cursor: "pointer",
              font: `700 13px ${SOURCE_FONT}`,
              height: helpBounds.height,
              left: helpBounds.left,
              margin: 0,
              padding: "0 7px",
              pointerEvents: "auto",
              position: "absolute",
              top: helpBounds.top,
              width: helpBounds.width,
            }}
            type="button"
          >
            Need More Help
          </button>

          {helpOpen ? (
            <div
              aria-describedby="course-g04-l03-ti-004-stage-help-negative course-g04-l03-ti-004-stage-help-positive"
              aria-label="Need More Help"
              aria-modal="true"
              data-host-hyperlinks="safe-disabled"
              role="dialog"
              style={{
                background: "#fff",
                border: "2px solid #a8a8a8",
                borderRadius: 26,
                boxShadow: "0 3px 7px rgb(0 0 0 / 28%)",
                boxSizing: "border-box",
                color: "#111",
                height: 225,
                left: 60,
                padding: "9px 20px 16px",
                pointerEvents: "auto",
                position: "absolute",
                top: 191,
                width: 682,
                zIndex: 4,
              }}
            >
              <button
                aria-label="Close Need More Help"
                data-ti004-focus-control="close-help"
                onClick={onCloseHelp}
                ref={helpCloseRef}
                style={{
                  background: "linear-gradient(#ffad17, #e95c00)",
                  border: "2px solid #fff1cb",
                  borderRadius: 4,
                  color: "#fff",
                  float: "right",
                  font: `700 15px ${SOURCE_FONT}`,
                  height: 48,
                  margin: "-4px -8px 0 8px",
                  minWidth: 64,
                  padding: "0 8px",
                }}
                type="button"
              >
                Close
              </button>
              <p
                id="course-g04-l03-ti-004-stage-help-negative"
                style={{
                  color: "#111",
                  fontSize: 20,
                  lineHeight: 1.25,
                  margin: "2px 52px 4px 0",
                }}
              >
                {HELP_NEGATIVE_BODY}
              </p>
              <p
                id="course-g04-l03-ti-004-stage-help-positive"
                style={{
                  color: "#111",
                  fontSize: 20,
                  lineHeight: 1.25,
                  margin: "0 52px 0 0",
                }}
              >
                {HELP_POSITIVE_BODY}
              </p>
              <HelpNumberLine />
              <SourceGlossaryBoundary />
            </div>
          ) : null}

          {interaction.outcome === "wrong" ? (
            <div
              aria-describedby="course-g04-l03-ti-004-stage-wrong-copy"
              aria-label="Incorrect placement feedback"
              aria-modal="true"
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
                top: 290,
                width: 464,
                zIndex: 4,
              }}
            >
              <p
                id="course-g04-l03-ti-004-stage-wrong-copy"
                style={{fontSize: 22, lineHeight: 1.2, margin: 0}}
              >
                {COURSE_G04_L03_TI_004_WRONG_FEEDBACK}
              </p>
              <button
                aria-label="Close feedback and try the same card again"
                data-ti004-focus-control="close-wrong"
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
              Correct.
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
              {COURSE_G04_L03_TI_004_COMPLETION_FEEDBACK}
            </div>
          ) : null}

          <span aria-live="polite" role="status" style={visuallyHiddenStyle}>
            {interaction.outcome === "correct-feedback"
              ? `${COURSE_G04_L03_TI_004_CORRECT_FEEDBACK} ${placementCount} of 7 cards placed.`
              : interaction.outcome === "complete"
                ? COURSE_G04_L03_TI_004_COMPLETION_FEEDBACK
                : interaction.feedback ?? ""}
          </span>
        </div>
      </foreignObject>
    </svg>
  );
}

interface MobileSurfaceProps extends SharedSurfaceProps {
  readonly onKeyTerm?:Ti004OpenTerm;
  readonly placement: "fallback" | "portal" | "inline";
}

function MobileSurface({
  onKeyTerm,
  canvasStatus,
  controlsReady,
  dispatch,
  helpButtonRef,
  helpCloseRef,
  helpOpen,
  interaction,
  onCloseHelp,
  onCloseWrong,
  onOpenHelp,
  placement,
  wrongCloseRef,
}: MobileSurfaceProps) {
  const locked = !controlsReady || interaction.locked || helpOpen;
  const selected = COURSE_G04_L03_TI_004_CARDS.find(
    ({id}) => id === interaction.selectedCardId,
  );
  const placementCount = getCourseG04L03Ti004PlacementCount(interaction);

  return (
    <section
      aria-label="Order number cards from least to greatest"
      lang="en"
      data-ti004-native-question="true"
      className={
        "course-g04-l03-ti-004-mobile-controls "
        + `course-g04-l03-ti-004-mobile-controls--${placement}`
      }
      data-current-js-controls-ready={controlsReady ? "true" : "false"}
      data-interaction-companion-placement={placement}
      data-interaction-companion-surface="mobile"
      data-interaction-outcome={interaction.outcome}
      data-mobile-touch-target-min="48"
      data-source-canvas-status={canvasStatus}
    >
      <p className="course-g04-l03-ti-004-mobile-instruction">
        <span data-lesson-text-block="instruction-first"><Ti004SourceText text={questionSource.texts["161"]} onKeyTerm={onKeyTerm}/></span><span data-lesson-text-block="instruction-ending"><Ti004SourceText text={questionSource.texts["177"]} onKeyTerm={onKeyTerm}/></span>
      </p>
      {!controlsReady ? (
        <p
          aria-live={canvasStatus === "error" ? "assertive" : "polite"}
          className="course-g04-l03-ti-004-mobile-loading"
          role={canvasStatus === "error" ? "alert" : "status"}
        >
          {sourceCanvasStatusMessage(canvasStatus)}
        </p>
      ) : null}
      <p aria-live="polite" className="course-g04-l03-ti-004-mobile-status">
        {interaction.outcome === "correct-feedback"
          ? `${COURSE_G04_L03_TI_004_CORRECT_FEEDBACK} ${placementCount} of 7 cards placed.`
          : selected
            ? `${selected.accessibleLabel} selected. Choose its least-to-greatest slot.`
            : `${placementCount} of 7 cards placed.`}
      </p>

      <button
        aria-haspopup="dialog"
        className="course-g04-l03-ti-004-mobile-help"
        data-ti004-focus-control="help"
        data-lesson-text-block="help-button"
        disabled={!controlsReady || interaction.locked || helpOpen}
        onClick={onOpenHelp}
        ref={helpButtonRef}
        type="button"
      >
        Need More Help
      </button>

      <fieldset disabled={locked}>
        <legend>1. Choose a number card</legend>
        <div className="course-g04-l03-ti-004-mobile-card-grid">
          {COURSE_G04_L03_TI_004_CARDS.map((card) => {
            const placed = interaction.placements[card.id] !== null;
            return (
              <button
                aria-label={`Select ${card.accessibleLabel}`}
                aria-pressed={interaction.selectedCardId === card.id}
                data-ti004-focus-control={`card-${card.id}`}
                draggable={!locked && !placed}
                onDragStart={event => {event.dataTransfer.effectAllowed="move";event.dataTransfer.setData("text/plain",card.id);}}
                disabled={locked || placed}
                key={card.id}
                onClick={() => dispatch({type: "select-card", cardId: card.id})}
                type="button"
              >
                <span data-lesson-text-block={`card-${card.id}`}>{card.valueText.replace("-","−")}</span>
                {placed ? <strong aria-label="placed">✓</strong> : null}
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset disabled={locked} style={{minWidth:0}}>
        <legend>2. Choose its position</legend>
        <div className="course-g04-l03-ti-004-target-scroll" tabIndex={0} role="group" aria-label="Seven positions from least on the left to greatest on the right. Scroll horizontally to explore all positions.">
        <div style={{display:"flex",justifyContent:"space-between",gap:"1rem",minWidth:"42rem"}}><strong data-lesson-text-block="least">{questionSource.texts["172"]}</strong><strong data-lesson-text-block="greatest">{questionSource.texts["173"]}</strong></div>
        <div className="course-g04-l03-ti-004-mobile-target-grid">
          {targetOrder.map((targetCard) => {
            const placed = placedCardForTarget(
              interaction,
              targetCard.targetId,
            );
            const slotNumber = leastToGreatestSlotNumber(targetCard.targetId);
            return (
              <button
                aria-label={placed
                  ? `${placed.accessibleLabel} placed in least-to-greatest slot ${slotNumber}`
                  : `Least-to-greatest slot ${slotNumber}`}
                data-ti004-focus-control={`target-${targetCard.targetId}`}
                disabled={
                  locked
                  || placed !== undefined
                }
                key={targetCard.targetId}
                onDragOver={event=>{if(!locked&&!placed)event.preventDefault();}}
                onDrop={event=>{event.preventDefault();const card=COURSE_G04_L03_TI_004_CARDS.find(c=>c.id===event.dataTransfer.getData("text/plain"));if(!locked&&!placed&&card)dispatch({type:"drop-card",cardId:card.id,targetId:targetCard.targetId});}}
                onClick={() => dispatch({
                  type: "drop-card",
                  targetId: targetCard.targetId,
                })}
                type="button"
              >
                {placed ? `${placed.valueText.replace("-","−")} ✓` : `Slot ${slotNumber}`}
              </button>
            );
          })}
        </div></div>
      </fieldset>

      {helpOpen ? (
        <div
          aria-describedby="course-g04-l03-ti-004-mobile-help-negative course-g04-l03-ti-004-mobile-help-positive"
          aria-label="Need More Help"
          aria-modal="true"
          className="course-g04-l03-ti-004-mobile-dialog"
          data-host-hyperlinks={onKeyTerm?"source-bound":"safe-disabled"}
          role="dialog"
        >
          <strong>Need More Help</strong>
          <p id="course-g04-l03-ti-004-mobile-help-negative">
            <span data-lesson-text-block="help-negative"><Ti004SourceText text={HELP_NEGATIVE_BODY} onKeyTerm={onKeyTerm}/></span>
          </p>
          <p id="course-g04-l03-ti-004-mobile-help-positive">
            <span data-lesson-text-block="help-positive"><Ti004SourceText text={HELP_POSITIVE_BODY} onKeyTerm={onKeyTerm}/></span>
          </p>
          <Ti004HelpNumberLine/>
          <button
            aria-label="Close Need More Help"
            data-ti004-focus-control="close-help" data-lesson-text-block="close"
            onClick={onCloseHelp}
            ref={helpCloseRef}
            type="button"
          >
            Close
          </button>
        </div>
      ) : null}

      {interaction.outcome === "wrong" ? (
        <div
          aria-label="Incorrect placement feedback"
          aria-modal="true"
          className="course-g04-l03-ti-004-mobile-dialog"
          data-source-copy="source-static-text-222"
          role="alertdialog"
        >
          <strong>Incorrect placement</strong>
          <p data-lesson-text-block="wrong-feedback">{COURSE_G04_L03_TI_004_WRONG_FEEDBACK}</p>
          <button
            aria-label="Close feedback and try the same card again"
            data-ti004-focus-control="close-wrong" data-lesson-text-block="close"
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
          className="course-g04-l03-ti-004-mobile-complete"
          role="status"
        >
          <strong data-lesson-text-block="complete-feedback">{COURSE_G04_L03_TI_004_COMPLETION_FEEDBACK}</strong>
          <p>Use Replay to practice again or Next to continue.</p>
        </div>
      ) : null}
    </section>
  );
}

export function CourseG04L03Ti004Renderer(
  props: AnimationRendererProps,
) {
  const [interaction, dispatch] = useReducer(
    reduceCourseG04L03Ti004LeastToGreatestDrag,
    undefined,
    createCourseG04L03Ti004LeastToGreatestDragState,
  );
  const [helpOpen, setHelpOpen] = useState(false);
  const [companionTarget, setCompanionTarget] =
    useState<HTMLElement | null>(null);
  const [canvasStatus, setCanvasStatus] =
    useState<SourceCanvasStatus>("idle");
  const rendererRef = useRef<HTMLDivElement>(null);
  const visualHostRef = useRef<HTMLDivElement>(null);
  const lastFocusedControlRef = useRef<string | null>(null);
  const stageWrongCloseRef = useRef<HTMLButtonElement>(null);
  const mobileWrongCloseRef = useRef<HTMLButtonElement>(null);
  const stageHelpButtonRef = useRef<HTMLButtonElement>(null);
  const mobileHelpButtonRef = useRef<HTMLButtonElement>(null);
  const stageHelpCloseRef = useRef<HTMLButtonElement>(null);
  const mobileHelpCloseRef = useRef<HTMLButtonElement>(null);
  const correctFeedbackRemainingMs = useRef(
    COURSE_G04_L03_TI_004_CURRENT_JS_TIMING.correctFeedbackMs,
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
  const nativeIntroduction=props.frame<SOURCE_INTERACTION_FRAME&&frameDomain===SOURCE_INTERACTION_DOMAIN&&props.scenario===SOURCE_INTERACTION_SCENARIO&&props.lang==="en"&&!deterministicEvidenceCapture;
  const nativeSnapshot=nativeIntroduction||interactionEnabled?getTi004TextSnapshot(props.state,props,interaction,helpOpen):null;
  const openKeyTerm:Ti004OpenTerm=(entryId,trigger)=>{
    if(!TI004_KEY_TERMS.entryIds.includes(entryId))return;
    props.onLessonHostRequest?.({type:"open-keyterm",entryId,sourceAnimationId:"course-g04-l03-ti-004",playbackDisposition:"source-stop-timeline-and-audio-until-explicit-resume"},{trigger,keyTermIndexLanguage:"en"});
  };
  const sourceVisualFrame = interactionEnabled
    ? SOURCE_CLEAN_QUESTION_FRAME
    : props.frame;
  const sourceCanvasRenderKey = getCourseG04L03Ti004SourceCanvasRenderKey(
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
          `[data-ti004-focus-control="${focusControlKey}"]`,
        )))
        .find((element) =>
          isVisible(element) && !element.hasAttribute("disabled")
        );
      control?.focus();
    });
  };

  useEffect(() => {
    dispatch({type: "replay"});
    setHelpOpen(false);
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
    correctFeedbackRemainingMs.current =
      COURSE_G04_L03_TI_004_CURRENT_JS_TIMING.correctFeedbackMs;
  }, [interaction.lastPlacedCardId]);

  useEffect(() => {
    if (interaction.outcome !== "correct-feedback") return;
    if (props.reducedMotion) {
      const nextCard = COURSE_G04_L03_TI_004_CARDS.find(
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
        COURSE_G04_L03_TI_004_CURRENT_JS_TIMING.correctFeedbackMs;
      const nextCard = COURSE_G04_L03_TI_004_CARDS.find(
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
    if (!helpOpen) return;
    focusRenderedControl(mobileHelpCloseRef, stageHelpCloseRef);
  }, [helpOpen]);

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
          ? active.dataset.ti004FocusControl
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
  const openHelp = () => {
    setHelpOpen(true);
  };
  const closeHelp = () => {
    setHelpOpen(false);
    focusControl("help");
  };

  const mobileSurface = (
    <MobileSurface
      onKeyTerm={openKeyTerm}
      canvasStatus={canvasStatus}
      controlsReady={controlsReady}
      dispatch={dispatch}
      helpButtonRef={mobileHelpButtonRef}
      helpCloseRef={mobileHelpCloseRef}
      helpOpen={helpOpen}
      interaction={interaction}
      onCloseHelp={closeHelp}
      onCloseWrong={closeWrong}
      onOpenHelp={openHelp}
      placement="inline"
      wrongCloseRef={mobileWrongCloseRef}
    />
  );

  return (
    <div
      data-ti004-native-surface={interactionEnabled||nativeIntroduction ? "true" : undefined}
      data-modern-text-page={nativeSnapshot?.status==="ready"?"course-g04-l03-ti-004":undefined}
      data-ti004-text-status={nativeSnapshot?.status}
      data-authoritative-original-runtime-evidence="false"
      data-behavior-parity-established="false"
      data-current-js-controls-enabled={interactionEnabled ? "true" : "false"}
      data-current-js-functional-candidate={interactionEnabled ? "true" : "false"}
      data-current-js-functional-scope="ti004-least-to-greatest-drag-source-script-bound"
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
            ? event.target.dataset.ti004FocusControl ?? null
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
        .course-g04-l03-ti-004-mobile-fallback-slot,
        .course-g04-l03-ti-004-mobile-controls {
          display: none;
        }

        .course-g04-l03-ti-004-stage-surface button:focus-visible {
          outline: 4px solid #ffdd29;
          outline-offset: 3px;
        }

        .lesson-shell2 .lesson-shell2__legacy-stage:has([data-ti004-native-surface="true"]),
        .lesson-shell2 .lesson-shell2__legacy-stage:has([data-ti004-native-surface="true"]) > .lesson-shell2__stage,
        .lesson-shell2 .runtime-shell:has([data-ti004-native-surface="true"]),
        .lesson-shell2 .runtime-stage:has([data-ti004-native-surface="true"]) {
          height:auto;min-height:0;max-height:none;aspect-ratio:auto;overflow:visible;position:relative;
        }
        .lesson-shell2 .lesson-shell2__legacy-stage:has([data-ti004-native-surface="true"]) > .lesson-shell2__source-background-text {display:none}
        .lesson-shell2[data-host-presentation="modern-wide"] .lesson-shell2__legacy-stage:has([data-ti004-native-surface="true"]) .runtime-shell:has([data-ti004-native-surface="true"]) {top:auto}
        @media all {
          .course-g04-l03-ti-004-stage-surface {
            display: none;
          }

          .course-g04-l03-ti-004-mobile-fallback-slot {
            aspect-ratio: 4 / 3;
            display: block;
            inset: 0 0 auto;
            pointer-events: none;
            position: absolute;
            width: 100%;
            z-index: 4;
          }

          .course-g04-l03-ti-004-mobile-controls {
            background: #e9f7ff;
            border: 2px solid #224b8e;
            border-radius: 12px;
            box-sizing: border-box;
            color: #111;
            display: grid;
            font-family: var(--lesson-font-body,system-ui,sans-serif);
            font-size:1.125rem;line-height:1.5;
            gap: 10px;
            padding: 12px;
          }

          .course-g04-l03-ti-004-mobile-controls--fallback {
            left: 3%;
            max-height: 92%;
            overflow: auto;
            pointer-events: auto;
            position: absolute;
            right: 3%;
            top: 4%;
          }

          .course-g04-l03-ti-004-mobile-controls--portal {
            margin: 12px 0;
            max-width: 100%;
            pointer-events: auto;
            position: relative;
            width: 100%;
          }

          .course-g04-l03-ti-004-mobile-instruction,
          .course-g04-l03-ti-004-mobile-loading,
          .course-g04-l03-ti-004-mobile-status {
            font-family: var(--lesson-font-body,system-ui,sans-serif);
            font-size: 1.125rem;
            line-height: 1.6;
            margin: 0;
          }

          .course-g04-l03-ti-004-mobile-status {
            font-weight: 750;
          }

          .course-g04-l03-ti-004-mobile-controls fieldset {
            border: 0;
            margin: 0;
            padding: 0;
          }

          .course-g04-l03-ti-004-mobile-controls legend {
            font-size: 1rem;
            font-weight: 850;
            margin-bottom: 7px;
          }

          .course-g04-l03-ti-004-mobile-card-grid,
          .course-g04-l03-ti-004-mobile-target-grid {
            display: grid;
            gap: 8px;
            grid-template-columns: repeat(auto-fit,minmax(min(100%,4rem),1fr));
          }

          .course-g04-l03-ti-004-mobile-controls button {
            background: #fff;
            border: 2px solid #224b8e;
            border-radius: 9px;
            box-sizing: border-box;
            color: #111;
            font: 800 1.125rem var(--lesson-font-body,system-ui,sans-serif);
            min-height: 48px;
            min-width: 48px;
            padding: 7px;
          }

          .course-g04-l03-ti-004-mobile-card-grid button {
            align-items: center;
            display: flex;
            gap: 6px;
            justify-content: center;
          }

          .course-g04-l03-ti-004-mobile-controls button[aria-pressed="true"] {
            background: #ffdd29;
            box-shadow: inset 0 0 0 2px #082d86;
          }

          .course-g04-l03-ti-004-mobile-controls button:focus-visible {
            box-shadow: 0 0 0 3px #fff200;
            outline: 3px solid #001d6d;
            outline-offset: 2px;
          }

          .course-g04-l03-ti-004-mobile-controls button:disabled {
            cursor: default;
            opacity: .58;
          }

          .course-g04-l03-ti-004-mobile-help {
            justify-self: start;
          }

          .course-g04-l03-ti-004-mobile-dialog,
          .course-g04-l03-ti-004-mobile-complete {
            background: #ffffcc;
            border: 3px solid #224b8e;
            border-radius: 12px;
            display: grid;
            gap: 8px;
            padding: 12px;
          }

          .course-g04-l03-ti-004-mobile-dialog p,
          .course-g04-l03-ti-004-mobile-dialog small,
          .course-g04-l03-ti-004-mobile-complete p {
            font-family: var(--lesson-font-body,system-ui,sans-serif);
            line-height: 1.6;
            margin: 0;
          }

          .course-g04-l03-ti-004-mobile-complete {
            background: #9900ff;
            color: #fff;
          }

          .course-g04-l03-ti-004-mobile-complete strong {
            font-size: 1.5rem;
          }
        }

        @media (max-width: 390px) {
          .course-g04-l03-ti-004-mobile-card-grid,
          .course-g04-l03-ti-004-mobile-target-grid {
            grid-template-columns: repeat(auto-fit,minmax(min(100%,4rem),1fr));
          }
        }

        @media (min-width: 1280px) and (any-pointer: coarse) {
          .course-g04-l03-ti-004-mobile-controls--portal {
            grid-column: 1 / -1;
            grid-row: 7;
          }
        }
        .course-g04-l03-ti-004-mobile-controls--inline {position:relative;width:100%;font-size:1.125rem;line-height:1.5}
        .course-g04-l03-ti-004-mobile-controls fieldset {min-width:0}
        .course-g04-l03-ti-004-target-scroll {max-width:100%;overflow-x:auto;padding:.5rem .25rem 1rem}
        .course-g04-l03-ti-004-mobile-target-grid {grid-template-columns:repeat(7,minmax(6rem,1fr));min-width:42rem}
        [data-ti004-native-surface="true"] {--ti004-prose-size:1.125rem}
        .course-g04-l03-ti-004-mobile-instruction,
        .course-g04-l03-ti-004-mobile-loading,
        .course-g04-l03-ti-004-mobile-status,
        .course-g04-l03-ti-004-mobile-dialog p,
        .course-g04-l03-ti-004-mobile-complete p {font-size:var(--ti004-prose-size);line-height:1.6;font-family:var(--lesson-font-body,system-ui,sans-serif)}
        @media (min-width:768px) {[data-ti004-native-surface="true"] {--ti004-prose-size:1.25rem}}
      `}</style>
      <div
        aria-hidden={interactionEnabled||nativeIntroduction ? true : undefined}
        data-source-canvas-accessibility-isolated={
          interactionEnabled||nativeIntroduction ? "true" : "false"
        }
        inert={interactionEnabled||nativeIntroduction ? true : undefined}
        ref={visualHostRef}
        style={{pointerEvents: interactionEnabled ? "none" : undefined,height:controlsReady||nativeIntroduction?0:undefined,overflow:controlsReady||nativeIntroduction?"hidden":undefined}}
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
      {nativeIntroduction?<Ti004Introduction frame={props.frame} onKeyTerm={openKeyTerm}/>:null}
      {interactionEnabled ? (
        <>
          <StageSurface
            canvasStatus={canvasStatus}
            controlsReady={controlsReady}
            dispatch={dispatch}
            helpButtonRef={stageHelpButtonRef}
            helpCloseRef={stageHelpCloseRef}
            helpOpen={helpOpen}
            interaction={interaction}
            onCloseHelp={closeHelp}
            onCloseWrong={closeWrong}
            onOpenHelp={openHelp}
            wrongCloseRef={stageWrongCloseRef}
          />
          {mobileSurface}
        </>
      ) : null}
    </div>
  );
}

export {COURSE_G04_L03_TI_004_SOURCE};
export const COURSE_G04_L03_TI_004_MOVIE = candidate.movie;
export const COURSE_G04_L03_TI_004_RUNTIME = candidate.runtime;
export const COURSE_G04_L03_TI_004_SOURCE_CONTRACT = Object.freeze({
  ...candidate.sourceContract,
  currentJavascriptInteractionStatus:
    "source-script-bound-functional-candidate",
  currentJavascriptInteractionScope: Object.freeze([
    "seven-source-bound-number-cards-and-least-to-greatest-slots",
    "html-drag-and-drop-and-select-then-target-keyboard-alternative",
    "source-static-text-222-wrong-feedback-and-close-retry",
    "source-target-reveal-and-card-hide",
    "seven-card-correct-completion-feedback",
    "unfilled-slot-labels-do-not-disclose-source-answer-values",
    "source-exact-help-copy-and-bounded-dictionary-glossary-adapter",
    "help-card-locking-is-current-js-safety-behavior-not-source-runtime-trace",
    "host-pause-freezes-current-js-correct-feedback-delay",
    "reduced-motion-immediate-current-js-feedback-transition",
    "whole-renderer-replay-reset-and-source-canvas-remount",
    "responsive-native-question-for-desktop-and-narrow-layouts",
    "inline-native-question-with-existing-source-canvas-introduction",
    "desktop-mobile-focus-migration",
    "interactive-canvas-aria-and-inert-isolation",
    "answer-controls-fail-closed-until-source-canvas-ready",
    "clean-frame-122-source-visual-under-frame-124-functional-overlay",
    "deterministic-evidence-capture-preserves-requested-frame-without-overlay",
  ]),
  currentJavascriptTiming: COURSE_G04_L03_TI_004_CURRENT_JS_TIMING,
  interactionAuthority: COURSE_G04_L03_TI_004_INTERACTION_AUTHORITY,
  wrongFeedbackTextStatus: "modern-assistive-not-source-exact",
  helpTextStatus: "source-exact-copy-host-links-safe-disabled",
  mainTimelineAudioStatus: "current-js-engineering-candidate-unaccepted",
  interactionFeedbackAudioStatus: "inventoried-unimplemented-unaccepted",
  associatedAudioStatus: "current-js-engineering-candidate-unaccepted",
  spanishInteractionStatus: "unimplemented-disabled",
  naturalTerminalContinuationEstablished: false,
  behaviorParityEstablished: false,
  replayParityEstablished: false,
  originalRuntimeAuthorityEstablished: false,
  ownerAccepted: false,
  strictMigrationComplete: false,
  strictAcceptanceEffect: "none",
});
export const COURSE_G04_L03_TI_004_SCENARIOS = candidate.scenarios;
export const normalizeCourseG04L03Ti004Frame = candidate.normalizeFrame;
export const getCourseG04L03Ti004FrameState = candidate.getFrameState;
export const buildCourseG04L03Ti004CaptureAttributes = candidate.buildCaptureAttributes;

export default Object.freeze({
  ...candidate.module,
  reducedMotionFrame: SOURCE_INTERACTION_FRAME,
  Renderer: CourseG04L03Ti004Renderer,
});
