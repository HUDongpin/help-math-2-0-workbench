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
import {createCourseG04L03SourceGlossaryCandidate} from "./course-g04-l03-source-glossary-candidate";
import {createCourseG04L03SourceGlossaryOpenResult} from "../timelines/course-g04-l03-source-glossary-interaction";
import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G04_L03_TI_003_CARDS,
  COURSE_G04_L03_TI_003_COMPLETION_FEEDBACK,
  COURSE_G04_L03_TI_003_CORRECT_FEEDBACK,
  COURSE_G04_L03_TI_003_CURRENT_JS_TIMING,
  COURSE_G04_L03_TI_003_SOURCE_GEOMETRY,
  COURSE_G04_L03_TI_003_WRONG_FEEDBACK,
  createCourseG04L03Ti003NumberLineDragState,
  getCourseG04L03Ti003PlacementCount,
  reduceCourseG04L03Ti003NumberLineDrag,
  type CourseG04L03Ti003Card,
  type CourseG04L03Ti003CardId,
  type CourseG04L03Ti003NumberLineDragAction,
  type CourseG04L03Ti003NumberLineDragState,
  type CourseG04L03Ti003TargetId,
} from "../timelines/course-g04-l03-ti-003-number-line-drag-interaction";
import {
  COURSE_G04_L03_TI_003_CONFIG,
  COURSE_G04_L03_TI_003_GLOSSARY_CONFIG,
  COURSE_G04_L03_TI_003_HELP_GLOSSARY_CONFIG,
  COURSE_G04_L03_TI_003_SOURCE,
} from "../timelines/course-g04-l03-ti-003";

const audioCandidate = Object.freeze({
  audioCues: Object.freeze([
    Object.freeze({
      id: "course-g04-l03-ti-003-embedded-event-sound-0014",
      sourceCueId: "sprite-126-start-sound-14",
      frame: 1,
      frameDomain: "sprite-126",
      language: "en" as const,
      scenario: "source-static-frame",
      source:
        "/flash-assets/courses/course-g04-l03-ti-003/audio/embedded-event-sound-0014.mp3",
      durationMs: 11_458,
      sha256:
        "b7912a56f852d5d8c61dfbaa3fb5e875d9495622c2388e07e5cb5e1d2de6573f",
      spokenLanguage: "undetermined" as const,
    }),
  ]),
  audioTracks: Object.freeze([
    Object.freeze({
      id: "course-g04-l03-ti-003-spanish-host-narration",
      language: "es" as const,
      label: "Audio en español",
      source:
        "/flash-assets/courses/course-g04-l03-ti-003/audio/spanish-host-narration.mp3",
      durationMs: 15_336,
      sha256:
        "063887f58c7ab3b45bd62320cbb4bd95a90db93214e987ffbc001e9c4cb80799",
      activation: "user" as const,
      visibleWhen: Object.freeze(["es" as const]),
      frameDomains: Object.freeze(["sprite-126"]),
      timelineBehavior: "pause-while-playing" as const,
    }),
  ]),
});

const candidate = createSourceStaticCanvasCandidate(
  COURSE_G04_L03_TI_003_CONFIG,
  audioCandidate,
);
const SourceStaticRenderer = candidate.Renderer;

const SOURCE_INTERACTION_FRAME = 139;
const SOURCE_CLEAN_QUESTION_FRAME = 138;
const SOURCE_INTERACTION_DOMAIN = "sprite-126";
const SOURCE_INTERACTION_SCENARIO = "source-static-frame";
const SOURCE_STAGE_BACKGROUND = "#bddbf7";
const SOURCE_FONT =
  '"Bauhaus Md BT", "Arial Rounded MT Bold", "Trebuchet MS", ui-rounded, sans-serif';
const RESPONSIVE_CONTROLS_MEDIA =
  "(max-width: 640px), (any-pointer: coarse)";
const HELP_BODY =
  "A number line is a line for ordering numbers by their value.";
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
  [...COURSE_G04_L03_TI_003_CARDS].sort(
    (left, right) => left.numericValue - right.numericValue,
  ),
);

export const getCourseG04L03Ti003SourceCanvasRenderKey = (
  replay: number,
  seed: number,
  sourceVisualFrame: number,
): string => `source-ti003-${replay}-${seed}-${sourceVisualFrame}`;

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

function spokenPosition(card: CourseG04L03Ti003Card): string {
  if (card.numericValue < 0) {
    return `negative ${Math.abs(card.numericValue)}`;
  }
  if (card.numericValue > 0) {
    return `positive ${card.numericValue}`;
  }
  return "zero";
}

function placedCardForTarget(
  interaction: CourseG04L03Ti003NumberLineDragState,
  targetId: CourseG04L03Ti003TargetId,
) {
  return COURSE_G04_L03_TI_003_CARDS.find(
    ({id}) => interaction.placements[id] === targetId,
  );
}

interface SharedSurfaceProps {
  readonly canvasStatus: SourceCanvasStatus;
  readonly controlsReady: boolean;
  readonly dispatch: Dispatch<CourseG04L03Ti003NumberLineDragAction>;
  readonly helpButtonRef: RefObject<HTMLButtonElement | null>;
  readonly helpCloseRef: RefObject<HTMLButtonElement | null>;
  readonly helpOpen: boolean;
  readonly interaction: CourseG04L03Ti003NumberLineDragState;
  readonly onCloseHelp: () => void;
  readonly onCloseWrong: () => void;
  readonly onOpenHelp: () => void;
  readonly onLessonHostRequest: AnimationRendererProps["onLessonHostRequest"];
  readonly wrongCloseRef: RefObject<HTMLButtonElement | null>;
}

function handleDialogKeys(event: React.KeyboardEvent<HTMLDivElement>, close: () => void) {
  if (event.key === "Escape") {
    event.preventDefault();
    event.stopPropagation();
    close();
    return;
  }
  if (event.key !== "Tab") return;
  const controls = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>("button:not(:disabled)"))
    .filter((button) => button.getClientRects().length > 0);
  const first = controls[0];
  const last = controls.at(-1);
  if (!first || !last) return;
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function HelpKeyTerms({onLessonHostRequest, controlsReady}: {
  readonly onLessonHostRequest: AnimationRendererProps["onLessonHostRequest"];
  readonly controlsReady: boolean;
}) {
  const [blocked, setBlocked] = useState(false);
  return (
    <div className="course-g04-l03-ti-003-help-keyterms" aria-label="Key Terms in Need More Help" role="group">
      {COURSE_G04_L03_TI_003_HELP_GLOSSARY_CONFIG.terms.map((term) => (
        <button key={term.id} type="button" data-source-key-attribute={term.keyAttribute}
          disabled={!controlsReady || !onLessonHostRequest}
          onClick={(event) => {
            if (!controlsReady || !onLessonHostRequest) return;
            const result = createCourseG04L03SourceGlossaryOpenResult({
              config: COURSE_G04_L03_TI_003_HELP_GLOSSARY_CONFIG,
              frame: SOURCE_INTERACTION_FRAME, lang: "en", termId: term.id,
            });
            if (!result) { setBlocked(true); return; }
            const decision = onLessonHostRequest(result.request, {trigger: event.currentTarget});
            setBlocked(Boolean(decision && decision.status === "blocked"));
          }}>{term.labels.en}</button>
      ))}
      {blocked ? <p role="alert">The Key Terms request could not open.</p> : null}
    </div>
  );
}

function HelpNumberLine() {
  return (
    <figure className="course-g04-l03-ti-003-help-number-line">
      <svg viewBox="0 0 520 138" role="img"
        aria-label="Number line from negative 10 to positive 10. Zero is in the middle. Numbers increase to the right.">
        <text x="133" y="25" textAnchor="middle" fill="#a31d37" fontSize="20">Negative numbers</text>
        <text x="387" y="25" textAnchor="middle" fill="#124ca1" fontSize="20">Positive numbers</text>
        <path d="M8 66H512 M8 66l12 -8 M8 66l12 8 M512 66l-12 -8 M512 66l-12 8" stroke="#142f4c" strokeWidth="2" fill="none" />
        {Array.from({length: 21}, (_, index) => index - 10).map((value) => (
          <g key={value} data-help-tick={value}>
            <path d={`M${260 + value * 23} 57v18`} stroke={value < 0 ? "#a31d37" : value > 0 ? "#124ca1" : "#142f4c"} strokeWidth={value === 0 ? 3 : 2} />
            {value % 5 === 0 ? <text x={260 + value * 23} y="105" textAnchor="middle" fontSize="27" fill="#142f4c">{value < 0 ? `−${Math.abs(value)}` : value}</text> : null}
          </g>
        ))}
      </svg>
      <figcaption>Zero is neither negative nor positive. Numbers increase to the right.</figcaption>
    </figure>
  );
}

function MobileAnswerPreview({interaction}: {readonly interaction: CourseG04L03Ti003NumberLineDragState}) {
  return (
    <svg aria-hidden="true" className="course-g04-l03-ti-003-mobile-answers"
      data-ti003-preview-count={getCourseG04L03Ti003PlacementCount(interaction)}
      style={{height: "auto", inset: 0, pointerEvents: "none", position: "absolute", width: "100%", zIndex: 2}}
      viewBox="0 0 800 600">
      {COURSE_G04_L03_TI_003_CARDS.filter((card) => interaction.placements[card.id] !== null).map((card) => (
        <g key={card.id} data-ti003-placed-card={card.id}>
          <rect x={card.sourceCenter.x - card.sourceSize.width / 2 - 4} y={card.sourceCenter.y - card.sourceSize.height / 2 - 4}
            width={card.sourceSize.width + 8} height={card.sourceSize.height + 8} fill={SOURCE_STAGE_BACKGROUND} />
          <rect x={card.targetCenter.x - card.targetSize.width / 2} y={card.targetCenter.y - card.targetSize.height / 2}
            width={card.targetSize.width} height={card.targetSize.height} fill="#fff" stroke="#292929" />
          <text x={card.targetCenter.x} y={card.targetCenter.y + 8} textAnchor="middle" fill="#111" fontFamily="Arial, sans-serif" fontSize="22">{card.valueText}</text>
        </g>
      ))}
    </svg>
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
  onLessonHostRequest,
  wrongCloseRef,
}: SharedSurfaceProps) {
  const locked = !controlsReady || interaction.locked || helpOpen;
  const placementCount = getCourseG04L03Ti003PlacementCount(interaction);
  const helpBounds = COURSE_G04_L03_TI_003_SOURCE_GEOMETRY.helpBounds;

  const startDrag = (
    event: DragEvent<HTMLButtonElement>,
    cardId: CourseG04L03Ti003CardId,
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
    targetId: CourseG04L03Ti003TargetId,
  ) => {
    event.preventDefault();
    const transferredId = event.dataTransfer.getData("text/plain");
    const cardId = COURSE_G04_L03_TI_003_CARDS.some(
      ({id}) => id === transferredId,
    )
      ? transferredId as CourseG04L03Ti003CardId
      : undefined;
    dispatch(cardId
      ? {type: "drop-card", cardId, targetId}
      : {type: "drop-card", targetId});
  };

  return (
    <svg
      aria-busy={!controlsReady}
      aria-label="Place number cards on the number line"
      className="course-g04-l03-ti-003-stage-surface"
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

          {COURSE_G04_L03_TI_003_CARDS.map((card) => {
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
                data-ti003-focus-control={`card-${card.id}`}
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
            const targetLocked = locked
              || interaction.selectedCardId === null
              || placedCard !== undefined;
            return (
              <button
                aria-label={placedCard
                  ? `${placedCard.accessibleLabel} placed at ${spokenPosition(targetCard)} on the number line`
                  : `Place selected card at ${spokenPosition(targetCard)} on the number line`}
                data-source-target={targetCard.targetId}
                data-ti003-focus-control={`target-${targetCard.targetId}`}
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
                  background: placedCard ? "#fff" : interaction.selectedCardId ? "rgb(255 221 41 / 24%)" : "transparent",
                  border: placedCard ? "1px solid #292929" : interaction.selectedCardId ? "2px dashed #224b8e" : 0,
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
            data-ti003-focus-control="help"
            disabled={!controlsReady || (interaction.locked && interaction.outcome !== "complete") || helpOpen}
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
              aria-describedby="course-g04-l03-ti-003-stage-help-copy"
              aria-label="Need More Help"
              aria-modal="true"
              onKeyDown={(event) => handleDialogKeys(event, onCloseHelp)}
              data-host-hyperlinks="typed-keyterm-host-integrated"
              role="dialog"
              style={{
                background: "#fff",
                border: "2px solid #a8a8a8",
                borderRadius: 26,
                boxShadow: "0 3px 7px rgb(0 0 0 / 28%)",
                boxSizing: "border-box",
                color: "#111",
                height: 360,
                left: 92,
                padding: "9px 20px 16px",
                pointerEvents: "auto",
                position: "absolute",
                top: 128,
                width: 600,
                zIndex: 4,
              }}
            >
              <button
                aria-label="Close Need More Help"
                data-ti003-focus-control="close-help"
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
                id="course-g04-l03-ti-003-stage-help-copy"
                style={{
                  color: "#111",
                  fontSize: 20,
                  lineHeight: 1.25,
                  margin: "2px 52px 0 0",
                }}
              >
                {HELP_BODY}
              </p>
              <HelpNumberLine />
              <HelpKeyTerms controlsReady={controlsReady} onLessonHostRequest={onLessonHostRequest} />
            </div>
          ) : null}

          {interaction.outcome === "wrong" ? (
            <div
              aria-describedby="course-g04-l03-ti-003-stage-wrong-copy"
              aria-label="Incorrect placement feedback"
              aria-modal="true"
              onKeyDown={(event) => handleDialogKeys(event, onCloseWrong)}
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
                id="course-g04-l03-ti-003-stage-wrong-copy"
                style={{fontSize: 22, lineHeight: 1.2, margin: 0}}
              >
                {COURSE_G04_L03_TI_003_WRONG_FEEDBACK}
              </p>
              <button
                aria-label="Close feedback and try the same card again"
                data-ti003-focus-control="close-wrong"
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

          <span aria-live="polite" role="status" style={visuallyHiddenStyle}>
            {interaction.outcome === "correct-feedback"
              ? `${COURSE_G04_L03_TI_003_CORRECT_FEEDBACK} ${placementCount} of 6 cards placed.`
              : interaction.outcome === "complete"
                ? COURSE_G04_L03_TI_003_COMPLETION_FEEDBACK
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
  helpButtonRef,
  helpCloseRef,
  helpOpen,
  interaction,
  onCloseHelp,
  onCloseWrong,
  onOpenHelp,
  onLessonHostRequest,
  placement,
  wrongCloseRef,
}: MobileSurfaceProps) {
  const locked = !controlsReady || interaction.locked || helpOpen;
  const selected = COURSE_G04_L03_TI_003_CARDS.find(
    ({id}) => id === interaction.selectedCardId,
  );
  const placementCount = getCourseG04L03Ti003PlacementCount(interaction);

  return (
    <section
      aria-label="Mobile controls for placing number cards on the number line"
      className={
        "course-g04-l03-ti-003-mobile-controls "
        + `course-g04-l03-ti-003-mobile-controls--${placement}`
      }
      data-current-js-controls-ready={controlsReady ? "true" : "false"}
      data-interaction-companion-placement={placement}
      data-interaction-companion-surface="mobile"
      data-interaction-outcome={interaction.outcome}
      data-mobile-touch-target-min="48"
      data-source-canvas-status={canvasStatus}
    >
      <p className="course-g04-l03-ti-003-mobile-instruction">
        Choose a number card, then choose its position on the number line.
      </p>
      {!controlsReady ? (
        <p
          aria-live={canvasStatus === "error" ? "assertive" : "polite"}
          className="course-g04-l03-ti-003-mobile-loading"
          role={canvasStatus === "error" ? "alert" : "status"}
        >
          {sourceCanvasStatusMessage(canvasStatus)}
        </p>
      ) : null}
      <p aria-live="polite" className="course-g04-l03-ti-003-mobile-status">
        {interaction.outcome === "correct-feedback"
          ? `${COURSE_G04_L03_TI_003_CORRECT_FEEDBACK} ${placementCount} of 6 cards placed.`
          : selected
            ? `${selected.accessibleLabel} selected. Choose its number-line position.`
            : `${placementCount} of 6 cards placed.`}
      </p>

      <button
        aria-haspopup="dialog"
        className="course-g04-l03-ti-003-mobile-help"
        data-ti003-focus-control="help"
        disabled={!controlsReady || (interaction.locked && interaction.outcome !== "complete") || helpOpen}
        onClick={onOpenHelp}
        ref={helpButtonRef}
        type="button"
      >
        Need More Help
      </button>

      <fieldset disabled={locked}>
        <legend>1. Choose a number card</legend>
        <div className="course-g04-l03-ti-003-mobile-card-grid">
          {COURSE_G04_L03_TI_003_CARDS.map((card) => {
            const placed = interaction.placements[card.id] !== null;
            return (
              <button
                aria-label={`Select ${card.accessibleLabel}`}
                aria-pressed={interaction.selectedCardId === card.id}
                data-ti003-focus-control={`card-${card.id}`}
                disabled={locked || placed}
                key={card.id}
                onClick={() => dispatch({type: "select-card", cardId: card.id})}
                type="button"
              >
                <span>{card.valueText}</span>
                {placed ? <strong aria-label="placed">✓</strong> : null}
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset disabled={locked || interaction.selectedCardId === null}>
        <legend>2. Choose its position</legend>
        <div className="course-g04-l03-ti-003-mobile-target-grid">
          {targetOrder.map((targetCard) => {
            const placed = placedCardForTarget(
              interaction,
              targetCard.targetId,
            );
            return (
              <button
                aria-label={`Position ${spokenPosition(targetCard)}`}
                data-ti003-focus-control={`target-${targetCard.targetId}`}
                disabled={
                  locked
                  || interaction.selectedCardId === null
                  || placed !== undefined
                }
                key={targetCard.targetId}
                onClick={() => dispatch({
                  type: "drop-card",
                  targetId: targetCard.targetId,
                })}
                type="button"
              >
                {targetCard.numericValue > 0
                  ? `+${targetCard.numericValue}`
                  : targetCard.numericValue}
                {placed ? " ✓" : ""}
              </button>
            );
          })}
        </div>
      </fieldset>

      {helpOpen ? (
        <div
          aria-describedby="course-g04-l03-ti-003-mobile-help-copy"
          aria-label="Need More Help"
          aria-modal="true"
          onKeyDown={(event) => handleDialogKeys(event, onCloseHelp)}
          className="course-g04-l03-ti-003-mobile-dialog"
          data-host-hyperlinks="typed-keyterm-host-integrated"
          role="dialog"
        >
          <strong>Need More Help</strong>
          <p id="course-g04-l03-ti-003-mobile-help-copy">{HELP_BODY}</p>
          <HelpNumberLine />
          <HelpKeyTerms controlsReady={controlsReady} onLessonHostRequest={onLessonHostRequest} />
          <button
            aria-label="Close Need More Help"
            data-ti003-focus-control="close-help"
            onClick={onCloseHelp}
            ref={helpCloseRef}
            type="button"
          >
            Close Help
          </button>
        </div>
      ) : null}

      {interaction.outcome === "wrong" ? (
        <div
          aria-label="Incorrect placement feedback"
          aria-modal="true"
          onKeyDown={(event) => handleDialogKeys(event, onCloseWrong)}
          className="course-g04-l03-ti-003-mobile-dialog"
          data-source-copy="modern-assistive-not-source-exact"
          role="alertdialog"
        >
          <strong>Incorrect placement</strong>
          <p>{COURSE_G04_L03_TI_003_WRONG_FEEDBACK}</p>
          <button
            aria-label="Close feedback and try the same card again"
            data-ti003-focus-control="close-wrong"
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
          className="course-g04-l03-ti-003-mobile-complete"
          role="status"
        >
          <strong>{COURSE_G04_L03_TI_003_COMPLETION_FEEDBACK}</strong>
          <p>Use Replay to practice again or Next to continue.</p>
        </div>
      ) : null}
    </section>
  );
}

function CourseG04L03Ti003ActivityRenderer(
  props: AnimationRendererProps,
) {
  const [interaction, dispatch] = useReducer(
    reduceCourseG04L03Ti003NumberLineDrag,
    undefined,
    createCourseG04L03Ti003NumberLineDragState,
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
    COURSE_G04_L03_TI_003_CURRENT_JS_TIMING.correctFeedbackMs,
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
  const sourceCanvasRenderKey = getCourseG04L03Ti003SourceCanvasRenderKey(
    props.replay ?? 0,
    props.seed,
    sourceVisualFrame,
  );
  const cleanSourceVisualState = useMemo(() => candidate.getFrameState(
    SOURCE_CLEAN_QUESTION_FRAME,
    {entryStateSha256: props.entryStateSha256, frameDomain, lang: props.lang,
      requirementId: props.requirementId, scenario: props.scenario, seed: props.seed,
      traceId: props.traceId},
  ), [frameDomain, props.entryStateSha256, props.lang, props.requirementId,
    props.scenario, props.seed, props.traceId]);
  const sourceVisualState = interactionEnabled ? cleanSourceVisualState : props.state;
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
          `[data-ti003-focus-control="${focusControlKey}"]`,
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
    if (interactionEnabled && interaction.outcome === "complete") props.onActivityComplete?.();
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
      COURSE_G04_L03_TI_003_CURRENT_JS_TIMING.correctFeedbackMs;
  }, [interaction.lastPlacedCardId]);

  useEffect(() => {
    if (interaction.outcome !== "correct-feedback") return;
    if (props.reducedMotion) {
      const nextCard = COURSE_G04_L03_TI_003_CARDS.find(
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
        COURSE_G04_L03_TI_003_CURRENT_JS_TIMING.correctFeedbackMs;
      const nextCard = COURSE_G04_L03_TI_003_CARDS.find(
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
          ? active.dataset.ti003FocusControl
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

  const desktopNotice = (
    <div className="course-g04-l03-ti-003-desktop-notice" role={interaction.outcome === "complete" ? "status" : undefined}
      data-complete={interaction.outcome === "complete" ? "true" : "false"}>
      {interaction.outcome === "complete"
        ? "Correct!!! All 6 numbers placed. Use Replay to practice again."
        : "Drag a card onto the line, or select a card and then its highlighted position."}
    </div>
  );

  const mobileSurface = (
    <MobileSurface
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
      onLessonHostRequest={props.onLessonHostRequest}
      placement={companionTarget ? "portal" : "fallback"}
      wrongCloseRef={mobileWrongCloseRef}
    />
  );

  return (
    <div
      data-authoritative-original-runtime-evidence="false"
      data-behavior-parity-established="false"
      data-current-js-controls-enabled={interactionEnabled ? "true" : "false"}
      data-current-js-functional-candidate={interactionEnabled ? "true" : "false"}
      data-current-js-functional-scope="ti003-number-line-drag-source-script-bound"
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
            ? event.target.dataset.ti003FocusControl ?? null
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
        .course-g04-l03-ti-003-mobile-answers,
        .course-g04-l03-ti-003-mobile-fallback-slot,
        .course-g04-l03-ti-003-mobile-controls {
          display: none;
        }

        .course-g04-l03-ti-003-stage-surface button:focus-visible {
          outline: 4px solid #ffdd29;
          outline-offset: 3px;
        }

        .course-g04-l03-ti-003-help-number-line { margin: 12px 0; font-family: system-ui, sans-serif; }
        .course-g04-l03-ti-003-help-number-line svg { width: 100%; display: block; }
        .course-g04-l03-ti-003-help-number-line figcaption { font-size: 16px; line-height: 1.35; }
        .course-g04-l03-ti-003-help-keyterms { display: grid; gap: 6px; grid-template-columns: repeat(3, minmax(0, 1fr)); }
        .course-g04-l03-ti-003-help-keyterms button { background: #edf5ff; border: 1px solid #315e9d; border-radius: 8px; color: #174985; font: 700 16px/1.2 system-ui, sans-serif; min-height: 42px; padding: 6px; }
        .course-g04-l03-ti-003-desktop-notice { font: 16px/1.4 system-ui, sans-serif; margin: 8px 0; color: #183d62; }
        .course-g04-l03-ti-003-desktop-notice[data-complete="true"] { background: #e4f5df; border: 2px solid #28743b; border-radius: 12px; color: #17572a; padding: 12px; font-weight: 700; }
        @media ${RESPONSIVE_CONTROLS_MEDIA} {
          .course-g04-l03-ti-003-mobile-answers { display: block; }
          .course-g04-l03-ti-003-desktop-notice { display: none; }
          .course-g04-l03-ti-003-help-keyterms { grid-template-columns: repeat(2, minmax(0, 1fr)); }

          .course-g04-l03-ti-003-stage-surface {
            display: none;
          }

          .course-g04-l03-ti-003-mobile-fallback-slot {
            aspect-ratio: 4 / 3;
            display: block;
            inset: 0 0 auto;
            pointer-events: none;
            position: absolute;
            width: 100%;
            z-index: 4;
          }

          .course-g04-l03-ti-003-mobile-controls {
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

          .course-g04-l03-ti-003-mobile-controls--fallback {
            left: 3%;
            max-height: 92%;
            overflow: auto;
            pointer-events: auto;
            position: absolute;
            right: 3%;
            top: 4%;
          }

          .course-g04-l03-ti-003-mobile-controls--portal {
            margin: 12px 0;
            max-width: 100%;
            pointer-events: auto;
            position: relative;
            width: 100%;
          }

          .course-g04-l03-ti-003-mobile-instruction,
          .course-g04-l03-ti-003-mobile-loading,
          .course-g04-l03-ti-003-mobile-status {
            font-family: system-ui, sans-serif;
            font-size: 16px;
            line-height: 1.3;
            margin: 0;
          }

          .course-g04-l03-ti-003-mobile-status {
            font-weight: 750;
          }

          .course-g04-l03-ti-003-mobile-controls fieldset {
            border: 0;
            margin: 0;
            padding: 0;
          }

          .course-g04-l03-ti-003-mobile-controls legend {
            font-size: 16px;
            font-weight: 850;
            margin-bottom: 7px;
          }

          .course-g04-l03-ti-003-mobile-card-grid,
          .course-g04-l03-ti-003-mobile-target-grid {
            display: grid;
            gap: 8px;
            grid-template-columns: repeat(3, minmax(48px, 1fr));
          }

          .course-g04-l03-ti-003-mobile-controls button {
            background: #fff;
            border: 2px solid #224b8e;
            border-radius: 9px;
            box-sizing: border-box;
            color: #111;
            font: 800 17px ${SOURCE_FONT};
            min-height: 48px;
            min-width: 48px;
            padding: 7px;
          }

          .course-g04-l03-ti-003-mobile-card-grid button {
            align-items: center;
            display: flex;
            gap: 6px;
            justify-content: center;
          }

          .course-g04-l03-ti-003-mobile-controls button[aria-pressed="true"] {
            background: #ffdd29;
            box-shadow: inset 0 0 0 2px #082d86;
          }

          .course-g04-l03-ti-003-mobile-controls button:focus-visible {
            box-shadow: 0 0 0 3px #fff200;
            outline: 3px solid #001d6d;
            outline-offset: 2px;
          }

          .course-g04-l03-ti-003-mobile-controls button:disabled {
            cursor: default;
            opacity: .58;
          }

          .course-g04-l03-ti-003-mobile-help {
            justify-self: start;
          }

          .course-g04-l03-ti-003-mobile-dialog,
          .course-g04-l03-ti-003-mobile-complete {
            background: #ffffcc;
            border: 3px solid #224b8e;
            border-radius: 12px;
            display: grid;
            gap: 8px;
            padding: 12px;
          }

          .course-g04-l03-ti-003-mobile-dialog p,
          .course-g04-l03-ti-003-mobile-dialog small,
          .course-g04-l03-ti-003-mobile-complete p {
            font-family: system-ui, sans-serif;
            line-height: 1.3;
            margin: 0;
          }

          .course-g04-l03-ti-003-mobile-complete {
            background: #e4f5df;
            color: #17572a;
          }

          .course-g04-l03-ti-003-mobile-complete strong {
            font-size: 24px;
          }
        }

        @media (max-width: 390px) {
          .course-g04-l03-ti-003-mobile-card-grid,
          .course-g04-l03-ti-003-mobile-target-grid {
            grid-template-columns: repeat(3, minmax(48px, 1fr));
          }
        }

        @media (min-width: 1280px) and (any-pointer: coarse) {
          .course-g04-l03-ti-003-mobile-controls--portal {
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
          {controlsReady ? <MobileAnswerPreview interaction={interaction} /> : null}
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
            onLessonHostRequest={props.onLessonHostRequest}
            wrongCloseRef={stageWrongCloseRef}
          />
          {companionTarget ? createPortal(desktopNotice, companionTarget) : desktopNotice}
          {companionTarget
            ? createPortal(mobileSurface, companionTarget)
            : (
                <div className="course-g04-l03-ti-003-mobile-fallback-slot">
                  {mobileSurface}
                </div>
              )}
        </>
      ) : null}
    </div>
  );
}

export {COURSE_G04_L03_TI_003_SOURCE};
export const COURSE_G04_L03_TI_003_MOVIE = candidate.movie;
export const COURSE_G04_L03_TI_003_RUNTIME = candidate.runtime;
const INTERACTION_SOURCE_CONTRACT = Object.freeze({
  currentJavascriptInteractionStatus:
    "source-script-bound-functional-candidate",
  currentJavascriptInteractionScope: Object.freeze([
    "six-source-bound-number-cards-and-number-line-targets",
    "html-drag-and-drop-and-select-then-target-keyboard-alternative",
    "modern-assistive-wrong-feedback-and-close-retry",
    "source-target-reveal-and-card-hide",
    "six-card-correct-completion-feedback",
    "source-exact-help-copy-with-state-bound-typed-keyterm-host-links",
    "host-pause-freezes-current-js-correct-feedback-delay",
    "reduced-motion-immediate-current-js-feedback-transition",
    "whole-renderer-replay-reset-and-source-canvas-remount",
    "responsive-mobile-and-coarse-pointer-touch-control-surface",
    "page-interaction-companion-portal-with-stage-fallback",
    "desktop-mobile-focus-migration",
    "help-and-wrong-dialog-escape-close-and-tab-focus-containment",
    "interactive-canvas-aria-and-inert-isolation",
    "answer-controls-fail-closed-until-source-canvas-ready",
    "clean-frame-138-source-visual-under-frame-139-functional-overlay",
    "deterministic-evidence-capture-preserves-requested-frame-without-overlay",
  ]),
  currentJavascriptTiming: COURSE_G04_L03_TI_003_CURRENT_JS_TIMING,
  wrongFeedbackTextStatus: "modern-assistive-not-source-exact",
  helpTextStatus: "source-exact-copy-with-modern-zero-inclusive-number-line-and-typed-host-links",
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
export const COURSE_G04_L03_TI_003_SCENARIOS = candidate.scenarios;
export const normalizeCourseG04L03Ti003Frame = candidate.normalizeFrame;
export const getCourseG04L03Ti003FrameState = candidate.getFrameState;
export const buildCourseG04L03Ti003CaptureAttributes = candidate.buildCaptureAttributes;

const activityModule = Object.freeze({
  ...candidate.module,
  completionMode: "activity" as const,
  reducedMotionFrame: SOURCE_INTERACTION_FRAME,
  Renderer: CourseG04L03Ti003ActivityRenderer,
});

const glossaryCandidate = createCourseG04L03SourceGlossaryCandidate(
  {...candidate, Renderer: CourseG04L03Ti003ActivityRenderer, module: activityModule},
  COURSE_G04_L03_TI_003_GLOSSARY_CONFIG,
  {scenario: "source-static-frame", canvasCandidateStatus: "source-static-engineering-not-strict", surfacePlacement: "companion"},
);
export const CourseG04L03Ti003Renderer = glossaryCandidate.Renderer;
export const COURSE_G04_L03_TI_003_SOURCE_CONTRACT = Object.freeze({
  ...glossaryCandidate.sourceContract,
  ...INTERACTION_SOURCE_CONTRACT,
});
export default glossaryCandidate.module;
