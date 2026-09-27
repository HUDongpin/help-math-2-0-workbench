"use client";

import React, {
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
} from "react";
import type {Dispatch, DragEvent} from "react";
import {createPortal} from "react-dom";

import type {AnimationRendererProps} from "../contract";
import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G04_L03_VB_003_COMPLETION_FEEDBACK,
  COURSE_G04_L03_VB_003_CURRENT_JS_TIMING,
  COURSE_G04_L03_VB_003_DRAG_ITEMS,
  COURSE_G04_L03_VB_003_INSTRUCTION,
  COURSE_G04_L03_VB_003_WRONG_FEEDBACK,
  createCourseG04L03Vb003InteractionState,
  getCourseG04L03Vb003CorrectFeedbackPolicy,
  reduceCourseG04L03Vb003Interaction,
  type CourseG04L03Vb003DragItem,
  type CourseG04L03Vb003InteractionAction,
  type CourseG04L03Vb003InteractionState,
  type CourseG04L03Vb003ItemId,
} from "../timelines/course-g04-l03-vb-003-interaction";
import {
  COURSE_G04_L03_VB_003_CONFIG,
  COURSE_G04_L03_VB_003_SOURCE,
} from "../timelines/course-g04-l03-vb-003";

const candidate = createSourceStaticCanvasCandidate(
  COURSE_G04_L03_VB_003_CONFIG,
);
const SourceStaticRenderer = candidate.Renderer;

const SOURCE_ACTIVITY_FRAME = 116;
const SOURCE_ACTIVITY_DOMAIN = "sprite-106";
const SOURCE_ACTIVITY_SCENARIO = "source-static-frame";
const SOURCE_STAGE_BACKGROUND = "#b8d8f7";
const SOURCE_FONT =
  '"Arial Rounded MT Bold", "Trebuchet MS", ui-rounded, sans-serif';

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
  [...COURSE_G04_L03_VB_003_DRAG_ITEMS].sort(
    (left, right) => left.numericValue - right.numericValue,
  ),
);

function isDeterministicEvidenceCapture({
  entryStateSha256,
}: AnimationRendererProps) {
  return Boolean(entryStateSha256);
}

function spokenNumber(item: CourseG04L03Vb003DragItem): string {
  return item.numericValue < 0
    ? `negative ${Math.abs(item.numericValue)}`
    : `${item.numericValue}`;
}

function isVisible(element: HTMLElement | null): element is HTMLElement {
  return Boolean(element && element.getClientRects().length > 0);
}

function StageInteractionSurface({
  dispatch,
  interaction,
}: {
  dispatch: Dispatch<CourseG04L03Vb003InteractionAction>;
  interaction: CourseG04L03Vb003InteractionState;
}) {
  const locked = interaction.mode !== "ready";
  const startDrag = (
    event: DragEvent<HTMLButtonElement>,
    itemId: CourseG04L03Vb003ItemId,
  ) => {
    if (locked) {
      event.preventDefault();
      return;
    }
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", itemId);
    dispatch({type: "select-item", itemId});
  };
  const dropOnTarget = (
    event: DragEvent<HTMLButtonElement>,
    targetId: CourseG04L03Vb003ItemId,
  ) => {
    event.preventDefault();
    const transferredId = event.dataTransfer.getData("text/plain");
    const itemId = COURSE_G04_L03_VB_003_DRAG_ITEMS.some(
      ({id}) => id === transferredId,
    )
      ? transferredId as CourseG04L03Vb003ItemId
      : undefined;
    dispatch(itemId
      ? {type: "drop-item", itemId, targetId}
      : {type: "drop-item", targetId});
  };

  return (
    <svg
      aria-label="Source-script-bound current JavaScript number-line drag and drop"
      className="course-g04-l03-vb-003-stage-surface"
      data-audio-feedback="unimplemented-unaccepted"
      data-behavior-parity-established="false"
      data-current-js-functional-candidate="true"
      data-interaction-mode={interaction.mode}
      data-legacy-actionscript-executed="false"
      data-source-script-bound="true"
      role="group"
      style={{
        height: "auto",
        left: 0,
        pointerEvents: "none",
        position: "absolute",
        top: 0,
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
          {COURSE_G04_L03_VB_003_DRAG_ITEMS.map((item) => {
            const placed = interaction.placedItemIds.includes(item.id);
            const selected = interaction.selectedItemId === item.id;
            return (
              <React.Fragment key={item.id}>
                {placed ? (
                  <span
                    aria-hidden="true"
                    data-source-item-mask={item.sourceInstance}
                    style={{
                      background: SOURCE_STAGE_BACKGROUND,
                      height: 41,
                      left: item.sourcePosition.x - 20,
                      position: "absolute",
                      top: item.sourcePosition.y - 21,
                      width: 40,
                    }}
                  />
                ) : (
                  <button
                    aria-label={`Select ${spokenNumber(item)} to move`}
                    aria-pressed={selected}
                    data-vb003-source-item-id={item.id}
                    data-source-instance={item.sourceInstance}
                    draggable={!locked}
                    onClick={() => dispatch({
                      type: "select-item",
                      itemId: item.id,
                    })}
                    onDragStart={(event) => startDrag(event, item.id)}
                    style={{
                      alignItems: "center",
                      background: "transparent",
                      border: 0,
                      color: "#000",
                      cursor: locked ? "default" : "grab",
                      display: "flex",
                      height: 48,
                      justifyContent: "center",
                      left: item.sourcePosition.x - 24,
                      margin: 0,
                      padding: 0,
                      pointerEvents: "auto",
                      position: "absolute",
                      top: item.sourcePosition.y - 24,
                      width: 48,
                    }}
                    type="button"
                  >
                    <span
                      aria-hidden="true"
                      style={{
                        alignItems: "center",
                        background: "#fff",
                        border: selected
                          ? "3px solid #082d86"
                          : "1px solid #666",
                        boxSizing: "border-box",
                        display: "flex",
                        fontSize: 22,
                        height: item.sourceSize.height,
                        justifyContent: "center",
                        lineHeight: 1,
                        width: item.sourceSize.width,
                      }}
                    >{item.label}</span>
                  </button>
                )}
              </React.Fragment>
            );
          })}

          {targetOrder.map((item) => {
            const placed = interaction.placedItemIds.includes(item.id);
            return (
              <button
                aria-label={`Place selected number at ${spokenNumber(item)} on the number line`}
                data-source-instance={item.targetInstance}
                disabled={locked || placed}
                key={item.id}
                onClick={() => dispatch({
                  type: "drop-item",
                  targetId: item.id,
                })}
                onDragOver={(event) => {
                  if (!locked && !placed) event.preventDefault();
                }}
                onDrop={(event) => dropOnTarget(event, item.id)}
                style={{
                  alignItems: "center",
                  background: "transparent",
                  border: 0,
                  boxSizing: "border-box",
                  color: "transparent",
                  cursor: locked || placed ? "default" : "pointer",
                  display: "flex",
                  height: 48,
                  justifyContent: "center",
                  left: item.targetPosition.x - 24,
                  lineHeight: 1,
                  margin: 0,
                  padding: 0,
                  pointerEvents: "auto",
                  position: "absolute",
                  top: item.targetPosition.y - 24,
                  width: 48,
                }}
                type="button"
              >
                {placed
                  ? (
                    <span
                      aria-hidden="true"
                      data-source-visual-bounds={`${item.targetSize.width}x${item.targetSize.height}`}
                      style={{
                        alignItems: "center",
                        background: "#fff",
                        border: "1px solid #666",
                        boxSizing: "border-box",
                        color: "#000",
                        display: "flex",
                        fontFamily: SOURCE_FONT,
                        fontSize: 22,
                        height: item.targetSize.height,
                        justifyContent: "center",
                        lineHeight: 1,
                        width: item.targetSize.width,
                      }}
                    >{item.label}</span>
                  )
                  : <span style={visuallyHiddenStyle}>Empty target</span>}
              </button>
            );
          })}

          {interaction.mode === "completed" ? (
            <div
              aria-live="polite"
              role="status"
              style={{
                alignItems: "center",
                background: "#9900ff",
                border: "3px solid #6a6231",
                borderRadius: 14,
                color: "#fff",
                display: "flex",
                fontFamily: SOURCE_FONT,
                fontSize: 52,
                fontWeight: 900,
                height: 286,
                justifyContent: "center",
                left: 49,
                position: "absolute",
                textShadow: "2px 2px 0 #4f007f",
                top: 141,
                width: 699,
              }}
            >{COURSE_G04_L03_VB_003_COMPLETION_FEEDBACK}</div>
          ) : null}

          <span aria-live="polite" style={visuallyHiddenStyle}>
            {interaction.mode === "correct-feedback"
              ? `Placement accepted. ${interaction.placedItemIds.length} of 5 placed.`
              : interaction.feedbackText}
          </span>
        </div>
      </foreignObject>
    </svg>
  );
}

function MobileInteractionSurface({
  dispatch,
  interaction,
}: {
  dispatch: Dispatch<CourseG04L03Vb003InteractionAction>;
  interaction: CourseG04L03Vb003InteractionState;
}) {
  const locked = interaction.mode !== "ready";
  const selected = COURSE_G04_L03_VB_003_DRAG_ITEMS.find(
    ({id}) => id === interaction.selectedItemId,
  );

  return (
    <section
      aria-label="Mobile number-line practice controls"
      className="course-g04-l03-vb-003-mobile-controls"
      data-current-js-functional-candidate="true"
      data-interaction-mode={interaction.mode}
      data-mobile-touch-target-min="48"
    >
      <p>{COURSE_G04_L03_VB_003_INSTRUCTION}</p>
      <p aria-live="polite" className="course-g04-l03-vb-003-mobile-status">
        {interaction.mode === "correct-feedback"
          ? `Placement accepted. ${interaction.placedItemIds.length} of 5 placed.`
          : selected
            ? `${spokenNumber(selected)} selected. Choose its number-line position.`
            : `${interaction.placedItemIds.length} of 5 numbers placed.`}
      </p>

      <fieldset disabled={locked}>
        <legend>1. Choose a number</legend>
        <div className="course-g04-l03-vb-003-mobile-grid">
          {COURSE_G04_L03_VB_003_DRAG_ITEMS.map((item) => {
            const placed = interaction.placedItemIds.includes(item.id);
            return (
              <button
                aria-pressed={interaction.selectedItemId === item.id}
                data-vb003-source-item-id={item.id}
                disabled={locked || placed}
                key={item.id}
                onClick={() => dispatch({
                  type: "select-item",
                  itemId: item.id,
                })}
                type="button"
              >{placed ? `${item.label} ✓` : item.label}</button>
            );
          })}
        </div>
      </fieldset>

      <fieldset disabled={locked || interaction.selectedItemId === null}>
        <legend>2. Choose its position</legend>
        <div className="course-g04-l03-vb-003-mobile-grid">
          {targetOrder.map((item) => (
            <button
              disabled={
                locked
                || interaction.selectedItemId === null
                || interaction.placedItemIds.includes(item.id)
              }
              key={item.id}
              onClick={() => dispatch({
                type: "drop-item",
                targetId: item.id,
              })}
              type="button"
            >{item.label}</button>
          ))}
        </div>
      </fieldset>

      {interaction.mode === "completed" ? (
        <div
          aria-live="polite"
          className="course-g04-l03-vb-003-mobile-complete"
          role="status"
        >
          <strong>{COURSE_G04_L03_VB_003_COMPLETION_FEEDBACK}</strong>
          <p>Use Replay to practice again or Next to continue.</p>
        </div>
      ) : null}
    </section>
  );
}

function WrongFeedbackCard({
  closeRef,
  onClose,
}: {
  closeRef: React.RefObject<HTMLButtonElement | null>;
  onClose: () => void;
}) {
  return (
    <section
      aria-describedby="course-g04-l03-vb-003-feedback-copy"
      aria-labelledby="course-g04-l03-vb-003-feedback-title"
      className="course-g04-l03-vb-003-feedback-card"
      data-current-js-feedback-placement="companion-outside-authored-stage"
      data-source-feedback-text="exact-define-text-character-98"
      data-strict-acceptance-effect="none"
      role="alertdialog"
    >
      <span aria-hidden="true" className="course-g04-l03-vb-003-feedback-icon">
        i
      </span>
      <div>
        <strong id="course-g04-l03-vb-003-feedback-title">Try again</strong>
        <p id="course-g04-l03-vb-003-feedback-copy">
          {COURSE_G04_L03_VB_003_WRONG_FEEDBACK}
        </p>
      </div>
      <button onClick={onClose} ref={closeRef} type="button">Close</button>
    </section>
  );
}

function CourseG04L03Vb003InteractionOverlay({
  pageInteractionCompanionTargetId,
  paused = false,
  reducedMotion = false,
  replay = 0,
  seed,
}: Pick<
  AnimationRendererProps,
  | "pageInteractionCompanionTargetId"
  | "paused"
  | "reducedMotion"
  | "replay"
  | "seed"
>) {
  const [interaction, dispatch] = useReducer(
    reduceCourseG04L03Vb003Interaction,
    undefined,
    createCourseG04L03Vb003InteractionState,
  );
  const [companionTarget, setCompanionTarget] =
    useState<HTMLElement | null>(null);
  const wrongCloseRef = useRef<HTMLButtonElement>(null);
  const lastAttemptedItemRef = useRef<CourseG04L03Vb003ItemId | null>(null);
  const correctFeedbackRemainingMs = useRef(
    COURSE_G04_L03_VB_003_CURRENT_JS_TIMING.correctFeedbackMs,
  );

  useEffect(() => {
    lastAttemptedItemRef.current = null;
    dispatch({type: "replay"});
  }, [replay, seed]);

  useEffect(() => {
    if (!pageInteractionCompanionTargetId) {
      setCompanionTarget(null);
      return;
    }
    setCompanionTarget(
      document.getElementById(pageInteractionCompanionTargetId),
    );
  }, [pageInteractionCompanionTargetId]);

  useEffect(() => {
    correctFeedbackRemainingMs.current =
      COURSE_G04_L03_VB_003_CURRENT_JS_TIMING.correctFeedbackMs;
  }, [interaction.lastPlacedItemId]);

  useEffect(() => {
    const policy = getCourseG04L03Vb003CorrectFeedbackPolicy({
      mode: interaction.mode,
      paused,
      reducedMotion,
    });
    if (policy === "inactive" || policy === "hold-while-paused") return;
    if (policy === "complete-immediately") {
      dispatch({type: "correct-feedback-finished"});
      return;
    }

    const startedAt = performance.now();
    const timeout = window.setTimeout(() => {
      correctFeedbackRemainingMs.current =
        COURSE_G04_L03_VB_003_CURRENT_JS_TIMING.correctFeedbackMs;
      dispatch({type: "correct-feedback-finished"});
    }, correctFeedbackRemainingMs.current);
    return () => {
      window.clearTimeout(timeout);
      correctFeedbackRemainingMs.current = Math.max(
        0,
        correctFeedbackRemainingMs.current - (performance.now() - startedAt),
      );
    };
  }, [interaction.mode, paused, reducedMotion]);

  useEffect(() => {
    if (interaction.mode !== "wrong-feedback") return;
    const frame = window.requestAnimationFrame(() => {
      wrongCloseRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [interaction.mode]);

  const dispatchInteraction = useCallback<
    Dispatch<CourseG04L03Vb003InteractionAction>
  >((action) => {
      if (action.type === "select-item") {
        lastAttemptedItemRef.current = action.itemId;
      } else if (action.type === "drop-item" && action.itemId) {
        lastAttemptedItemRef.current = action.itemId;
      }
      dispatch(action);
    }, []);

  const closeWrongFeedback = useCallback(() => {
    const attemptedItemId = lastAttemptedItemRef.current;
    dispatch({type: "close-wrong-feedback"});
    window.requestAnimationFrame(() => {
      const candidates = attemptedItemId
        ? document.querySelectorAll<HTMLButtonElement>(
            `[data-vb003-source-item-id="${attemptedItemId}"]`,
          )
        : document.querySelectorAll<HTMLButtonElement>(
            "[data-vb003-source-item-id]",
          );
      [...candidates].find((candidate) =>
        !candidate.disabled && isVisible(candidate))?.focus();
    });
  }, []);

  useEffect(() => {
    if (interaction.mode !== "wrong-feedback") return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      closeWrongFeedback();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [closeWrongFeedback, interaction.mode]);

  const mobileSurface = (
    <>
      <MobileInteractionSurface
        dispatch={dispatchInteraction}
        interaction={interaction}
      />
      {interaction.mode === "wrong-feedback" ? (
        <WrongFeedbackCard
          closeRef={wrongCloseRef}
          onClose={closeWrongFeedback}
        />
      ) : null}
    </>
  );

  return (
    <>
      <style>{`
        .course-g04-l03-vb-003-mobile-controls {
          display: none;
        }

        .course-g04-l03-vb-003-feedback-card {
          align-items: center;
          background: linear-gradient(135deg, #f8fbff, #edf5fc);
          border: 2px solid #8eabc7;
          border-inline-start: 7px solid #e7a21a;
          border-radius: 16px;
          box-shadow: 0 12px 26px rgba(16, 47, 99, .14);
          box-sizing: border-box;
          color: #17395f;
          display: grid;
          font-family: system-ui, sans-serif;
          gap: 14px;
          grid-template-columns: auto minmax(0, 1fr) auto;
          margin: 12px auto 0;
          max-width: 800px;
          padding: 16px;
          position: static;
          width: 100%;
        }

        .course-g04-l03-vb-003-feedback-icon {
          align-items: center;
          background: #fff2ce;
          border: 2px solid #d18a08;
          border-radius: 999px;
          color: #7b4b00;
          display: inline-flex;
          font: 900 20px/1 system-ui, sans-serif;
          height: 42px;
          justify-content: center;
          width: 42px;
        }

        .course-g04-l03-vb-003-feedback-card strong {
          display: block;
          font-size: 21px;
          line-height: 1.2;
          margin-bottom: 3px;
        }

        .course-g04-l03-vb-003-feedback-card p {
          font-size: 16px;
          line-height: 1.45;
          margin: 0;
        }

        .course-g04-l03-vb-003-feedback-card button {
          background: #173f73;
          border: 2px solid #173f73;
          border-radius: 999px;
          color: #fff;
          font: 800 16px/1 system-ui, sans-serif;
          min-height: 46px;
          min-width: 92px;
          padding: 10px 18px;
        }

        .course-g04-l03-vb-003-feedback-card button:hover {
          background: #0d2f5e;
        }

        .course-g04-l03-vb-003-feedback-card button:focus-visible {
          outline: 3px solid #ffcc00;
          outline-offset: 3px;
        }

        @media (max-width: 640px), (any-pointer: coarse) and (max-width: 1024px) {
          .course-g04-l03-vb-003-stage-surface {
            display: none;
          }

          .course-g04-l03-vb-003-mobile-controls {
            background: #e9f7ff;
            border: 2px solid #224b8e;
            border-radius: 12px;
            box-sizing: border-box;
            color: #111;
            display: grid;
            font-family: ${SOURCE_FONT};
            gap: 12px;
            margin: 12px 0 0;
            padding: 14px;
            width: 100%;
          }

          .course-g04-l03-vb-003-mobile-controls > p {
            font-family: system-ui, sans-serif;
            font-size: 16px;
            line-height: 1.35;
            margin: 0;
          }

          .course-g04-l03-vb-003-mobile-status {
            font-weight: 750;
          }

          .course-g04-l03-vb-003-mobile-controls fieldset {
            border: 0;
            margin: 0;
            padding: 0;
          }

          .course-g04-l03-vb-003-mobile-controls legend {
            font-size: 16px;
            font-weight: 850;
            margin-bottom: 7px;
          }

          .course-g04-l03-vb-003-mobile-grid {
            display: grid;
            gap: 8px;
            grid-template-columns: repeat(5, minmax(48px, 1fr));
          }

          .course-g04-l03-vb-003-mobile-controls button {
            background: #fff;
            border: 2px solid #224b8e;
            border-radius: 9px;
            color: #111;
            font: 800 18px ${SOURCE_FONT};
            min-height: 48px;
            min-width: 48px;
            padding: 7px;
          }

          .course-g04-l03-vb-003-mobile-controls button[aria-pressed="true"] {
            background: #ffdd29;
            box-shadow: inset 0 0 0 2px #082d86;
          }

          .course-g04-l03-vb-003-mobile-controls button:disabled {
            cursor: default;
            opacity: .58;
          }

          .course-g04-l03-vb-003-mobile-complete {
            background: #ffffcc;
            border: 3px solid #224b8e;
            border-radius: 12px;
            display: grid;
            gap: 8px;
            padding: 14px;
          }

          .course-g04-l03-vb-003-mobile-complete strong {
            font-size: 22px;
          }

          .course-g04-l03-vb-003-mobile-complete p {
            font-family: system-ui, sans-serif;
            font-size: 16px;
            line-height: 1.35;
            margin: 0;
          }

          .course-g04-l03-vb-003-mobile-complete {
            background: #9900ff;
            color: #fff;
          }
        }

        @media (max-width: 430px) {
          .course-g04-l03-vb-003-mobile-grid {
            grid-template-columns: repeat(3, minmax(48px, 1fr));
          }

          .course-g04-l03-vb-003-feedback-card {
            align-items: start;
            grid-template-columns: auto minmax(0, 1fr);
            padding: 14px;
          }

          .course-g04-l03-vb-003-feedback-card button {
            grid-column: 1 / -1;
            width: 100%;
          }
        }
      `}</style>
      <StageInteractionSurface
        dispatch={dispatchInteraction}
        interaction={interaction}
      />
      {companionTarget
        ? createPortal(mobileSurface, companionTarget)
        : mobileSurface}
    </>
  );
}

export function CourseG04L03Vb003Renderer(props: AnimationRendererProps) {
  const frameDomain = props.frameDomain ?? SOURCE_ACTIVITY_DOMAIN;
  const interactionEnabled =
    props.frame === SOURCE_ACTIVITY_FRAME
    && frameDomain === SOURCE_ACTIVITY_DOMAIN
    && props.scenario === SOURCE_ACTIVITY_SCENARIO
    && props.lang === "en"
    && !isDeterministicEvidenceCapture(props);

  return (
    <div
      data-behavior-parity-established="false"
      data-current-js-controls-enabled={interactionEnabled ? "true" : "false"}
      data-current-js-functional-scope="vb003-number-line-drag-match-source-script-bound"
      data-owner-accepted="false"
      data-strict-acceptance-effect="none"
      style={{
        margin: "0 auto",
        maxWidth: 800,
        position: "relative",
        width: "100%",
      }}
    >
      <div aria-hidden={interactionEnabled ? true : undefined}>
        <SourceStaticRenderer {...props} />
      </div>
      {interactionEnabled ? (
        <CourseG04L03Vb003InteractionOverlay
          pageInteractionCompanionTargetId={
            props.pageInteractionCompanionTargetId
          }
          paused={props.paused}
          reducedMotion={props.reducedMotion}
          replay={props.replay}
          seed={props.seed}
        />
      ) : null}
    </div>
  );
}

export {COURSE_G04_L03_VB_003_SOURCE};
export const COURSE_G04_L03_VB_003_MOVIE = candidate.movie;
export const COURSE_G04_L03_VB_003_RUNTIME = candidate.runtime;
export const COURSE_G04_L03_VB_003_SOURCE_CONTRACT = Object.freeze({
  ...candidate.sourceContract,
  currentJavascriptInteractionStatus:
    "source-script-bound-functional-candidate",
  currentJavascriptInteractionScope: Object.freeze([
    "five-source-bound-drag-items-and-targets",
    "pointer-drag-and-select-then-target-keyboard-alternative",
    "exact-source-wrong-feedback-and-close-retry",
    "non-occluding-modern-feedback-card-after-authored-stage",
    "source-target-reveal-and-item-hide",
    "five-item-completion-feedback",
    "host-pause-freezes-nominal-correct-feedback-delay",
    "whole-renderer-replay-reset",
    "responsive-mobile-touch-control-surface",
  ]),
  currentJavascriptTiming: COURSE_G04_L03_VB_003_CURRENT_JS_TIMING,
  associatedAudioStatus: "inventoried-unimplemented-unaccepted",
  spanishInteractionStatus: "unimplemented-disabled",
  naturalTerminalContinuationEstablished: false,
  behaviorParityEstablished: false,
  strictAcceptanceEffect: "none",
});
export const COURSE_G04_L03_VB_003_SCENARIOS = candidate.scenarios;
export const normalizeCourseG04L03Vb003Frame = candidate.normalizeFrame;
export const getCourseG04L03Vb003FrameState = candidate.getFrameState;
export const buildCourseG04L03Vb003CaptureAttributes =
  candidate.buildCaptureAttributes;

export default Object.freeze({
  ...candidate.module,
  reducedMotionFrame: SOURCE_ACTIVITY_FRAME,
  Renderer: CourseG04L03Vb003Renderer,
});
