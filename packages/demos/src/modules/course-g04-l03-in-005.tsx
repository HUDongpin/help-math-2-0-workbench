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
  COURSE_G04_L03_IN_005_ORDERING_CARDS,
  COURSE_G04_L03_IN_005_ORDERING_COMPLETION_FEEDBACK,
  COURSE_G04_L03_IN_005_ORDERING_CORRECT_FEEDBACK,
  COURSE_G04_L03_IN_005_ORDERING_CURRENT_JS_TIMING,
  COURSE_G04_L03_IN_005_ORDERING_INSTRUCTION,
  COURSE_G04_L03_IN_005_ORDERING_INTERACTION_AUTHORITY,
  COURSE_G04_L03_IN_005_ORDERING_SOURCE_GEOMETRY,
  COURSE_G04_L03_IN_005_ORDERING_WRONG_FEEDBACK,
  COURSE_G04_L03_IN_005_SORTED_TARGET_IDS,
  createCourseG04L03In005OrderingState,
  getCourseG04L03In005OrderingPlacementCount,
  reduceCourseG04L03In005OrderingInteraction,
  type CourseG04L03In005CardId,
  type CourseG04L03In005OrderingAction,
  type CourseG04L03In005OrderingState,
  type CourseG04L03In005TargetId,
} from "../timelines/course-g04-l03-in-005-ordering-interaction";
import {
  COURSE_G04_L03_IN_005_CONFIG,
  COURSE_G04_L03_IN_005_SOURCE,
} from "../timelines/course-g04-l03-in-005";

const candidate = createSourceStaticCanvasCandidate(
  COURSE_G04_L03_IN_005_CONFIG,
);
const SourceStaticRenderer = candidate.Renderer;

const SOURCE_INTERACTION_FRAME = 144;
const SOURCE_CLEAN_QUESTION_FRAME = 143;
const SOURCE_INTERACTION_DOMAIN = "sprite-80";
const SOURCE_INTERACTION_SCENARIO = "source-static-frame";
const SOURCE_STAGE_BACKGROUND = "#b8d8f7";
const SOURCE_FONT =
  '"Bauhaus Md BT", "Arial Rounded MT Bold", "Trebuchet MS", ui-rounded, sans-serif';
const RESPONSIVE_CONTROLS_MEDIA =
  "(max-width: 640px), (any-pointer: coarse)";
const SOURCE_GLOSSARY_HITS = Object.freeze([
  Object.freeze({buttonObjectId: 20, term: "Order"}),
  Object.freeze({buttonObjectId: 21, term: "Least"}),
  Object.freeze({buttonObjectId: 22, term: "Greatest"}),
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
  COURSE_G04_L03_IN_005_SORTED_TARGET_IDS.map((targetId) => {
    const card = COURSE_G04_L03_IN_005_ORDERING_CARDS.find(
      ({targetId: cardTargetId}) => cardTargetId === targetId,
    );
    if (!card) {
      throw new Error(`Missing IN005 source card for target ${targetId}`);
    }
    return card;
  }),
);

function leastToGreatestSlotNumber(
  targetId: CourseG04L03In005TargetId,
): number {
  return COURSE_G04_L03_IN_005_SORTED_TARGET_IDS.indexOf(targetId) + 1;
}

export const getCourseG04L03In005SourceCanvasRenderKey = (
  replay: number,
  seed: number,
  sourceVisualFrame: number,
): string => `source-in005-${replay}-${seed}-${sourceVisualFrame}`;

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
  interaction: CourseG04L03In005OrderingState,
  targetId: CourseG04L03In005TargetId,
) {
  return COURSE_G04_L03_IN_005_ORDERING_CARDS.find(
    ({id}) => interaction.placements[id] === targetId,
  );
}

interface SharedSurfaceProps {
  readonly canvasStatus: SourceCanvasStatus;
  readonly controlsReady: boolean;
  readonly dispatch: Dispatch<CourseG04L03In005OrderingAction>;
  readonly interaction: CourseG04L03In005OrderingState;
  readonly onCloseWrong: () => void;
  readonly wrongCloseRef: RefObject<HTMLButtonElement | null>;
}

function SourceGlossaryBoundary() {
  return (
    <div
      aria-label="Three source glossary actions are unavailable in this current JavaScript candidate."
      data-host-glossary-actions="safe-disabled"
      style={visuallyHiddenStyle}
    >
      {SOURCE_GLOSSARY_HITS.map(({buttonObjectId, term}, index) => (
        <span
          aria-disabled="true"
          data-source-button-object-id={buttonObjectId}
          data-source-glossary-term={term}
          key={term}
          role="link"
        >
          {term}
          {index < SOURCE_GLOSSARY_HITS.length - 1 ? ", " : ""}
        </span>
      ))}
    </div>
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
  const placementCount =
    getCourseG04L03In005OrderingPlacementCount(interaction);

  const startDrag = (
    event: DragEvent<HTMLButtonElement>,
    cardId: CourseG04L03In005CardId,
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
    targetId: CourseG04L03In005TargetId,
  ) => {
    event.preventDefault();
    const transferredId = event.dataTransfer.getData("text/plain");
    const cardId = COURSE_G04_L03_IN_005_ORDERING_CARDS.some(
      ({id}) => id === transferredId,
    )
      ? transferredId as CourseG04L03In005CardId
      : undefined;
    dispatch(cardId
      ? {type: "drop-card", cardId, targetId}
      : {type: "drop-card", targetId});
  };

  return (
    <svg
      aria-busy={!controlsReady}
      aria-label="Source-script-bound current JavaScript least-to-greatest ordering activity"
      className="course-g04-l03-in-005-stage-surface"
      data-audio-feedback="inventoried-unimplemented-unaccepted"
      data-behavior-parity-established="false"
      data-current-js-controls-ready={controlsReady ? "true" : "false"}
      data-current-js-functional-candidate="true"
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

          {COURSE_G04_L03_IN_005_ORDERING_CARDS.map((card) => {
            const placed = interaction.placements[card.id] !== null;
            const selected = interaction.selectedCardId === card.id;
            const hitWidth = Math.max(48, card.sourceSize.width + 16);
            const hitHeight = Math.max(48, card.sourceSize.height + 16);
            return placed ? (
              <span
                aria-hidden="true"
                data-card-hidden-after-correct={card.id}
                data-source-card-mask={card.id}
                key={card.id}
                style={{
                  background: SOURCE_STAGE_BACKGROUND,
                  height: card.sourceSize.height + 10,
                  left: card.sourceCenter.x - (card.sourceSize.width + 10) / 2,
                  position: "absolute",
                  top: card.sourceCenter.y - (card.sourceSize.height + 10) / 2,
                  width: card.sourceSize.width + 10,
                }}
              />
            ) : (
              <button
                aria-label={`Select ${card.accessibleLabel} to move`}
                aria-pressed={selected}
                data-in005-focus-control={`card-${card.id}`}
                data-source-card={card.id}
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
            const slotNumber =
              leastToGreatestSlotNumber(targetCard.targetId);
            const targetLocked = locked
              || interaction.selectedCardId === null
              || placedCard !== undefined;
            return (
              <button
                aria-label={placedCard
                  ? `${placedCard.accessibleLabel} placed in least-to-greatest slot ${slotNumber}`
                  : `Place selected card in least-to-greatest slot ${slotNumber}`}
                data-in005-focus-control={`target-${targetCard.targetId}`}
                data-source-target={targetCard.targetId}
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
                  alignItems: "center",
                  background: placedCard ? "#fff" : "transparent",
                  border: placedCard ? "1px solid #292929" : 0,
                  boxSizing: "border-box",
                  color: placedCard ? "#111" : "transparent",
                  cursor: targetLocked ? "default" : "pointer",
                  display: "flex",
                  font: "400 22px Arial, sans-serif",
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

          {interaction.outcome === "wrong" ? (
            <div
              aria-describedby="course-g04-l03-in-005-stage-wrong-copy"
              aria-label="Incorrect placement feedback"
              aria-modal="true"
              data-host-wrong-feedback="_global.WrongFeed-unresolved"
              data-source-copy="authored-fallback-host-global-unresolved"
              role="alertdialog"
              style={{
                alignItems: "center",
                background: "#ffffcc",
                border: "1px solid #6a6231",
                boxSizing: "border-box",
                color: "#000",
                display: "grid",
                gridTemplateColumns: "1fr 104px",
                minHeight: 104,
                left: 168,
                padding: 12,
                pointerEvents: "auto",
                position: "absolute",
                top: 286,
                width: 464,
                zIndex: 4,
              }}
            >
              <p
                id="course-g04-l03-in-005-stage-wrong-copy"
                style={{fontSize: 20, lineHeight: 1.2, margin: 0}}
              >
                {COURSE_G04_L03_IN_005_ORDERING_WRONG_FEEDBACK}
              </p>
              <button
                aria-label="Close feedback and try the same card again"
                data-in005-focus-control="close-wrong"
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
              {COURSE_G04_L03_IN_005_ORDERING_CORRECT_FEEDBACK}
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
                height: 132,
                justifyContent: "center",
                left: 244,
                position: "absolute",
                textShadow: "2px 2px 0 #73008e",
                top: 235,
                width: 320,
              }}
            >
              {COURSE_G04_L03_IN_005_ORDERING_COMPLETION_FEEDBACK}
            </div>
          ) : null}

          <span aria-live="polite" role="status" style={visuallyHiddenStyle}>
            {interaction.outcome === "correct-feedback"
              ? `${COURSE_G04_L03_IN_005_ORDERING_CORRECT_FEEDBACK} ${placementCount} of 7 cards placed.`
              : interaction.outcome === "complete"
                ? `${COURSE_G04_L03_IN_005_ORDERING_COMPLETION_FEEDBACK} Current JavaScript terminal state.`
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
  const selected = COURSE_G04_L03_IN_005_ORDERING_CARDS.find(
    ({id}) => id === interaction.selectedCardId,
  );
  const placementCount =
    getCourseG04L03In005OrderingPlacementCount(interaction);

  return (
    <section
      aria-label="Mobile controls for ordering number cards from least to greatest"
      className={
        "course-g04-l03-in-005-mobile-controls "
        + `course-g04-l03-in-005-mobile-controls--${placement}`
      }
      data-current-js-controls-ready={controlsReady ? "true" : "false"}
      data-interaction-companion-placement={placement}
      data-interaction-companion-surface="mobile"
      data-interaction-outcome={interaction.outcome}
      data-mobile-touch-target-min="48"
      data-source-canvas-status={canvasStatus}
    >
      <p className="course-g04-l03-in-005-mobile-instruction">
        {COURSE_G04_L03_IN_005_ORDERING_INSTRUCTION}
      </p>
      {!controlsReady ? (
        <p
          aria-live={canvasStatus === "error" ? "assertive" : "polite"}
          className="course-g04-l03-in-005-mobile-loading"
          role={canvasStatus === "error" ? "alert" : "status"}
        >
          {sourceCanvasStatusMessage(canvasStatus)}
        </p>
      ) : null}
      <p
        aria-live="polite"
        className="course-g04-l03-in-005-mobile-status"
      >
        {interaction.outcome === "correct-feedback"
          ? `${COURSE_G04_L03_IN_005_ORDERING_CORRECT_FEEDBACK} ${placementCount} of 7 cards placed.`
          : selected
            ? `${selected.accessibleLabel} selected. Choose its least-to-greatest slot.`
            : `${placementCount} of 7 cards placed.`}
      </p>

      <fieldset disabled={locked}>
        <legend>1. Choose a number card</legend>
        <div className="course-g04-l03-in-005-mobile-card-grid">
          {COURSE_G04_L03_IN_005_ORDERING_CARDS.map((card) => {
            const placed = interaction.placements[card.id] !== null;
            return (
              <button
                aria-label={`Select ${card.accessibleLabel}`}
                aria-pressed={interaction.selectedCardId === card.id}
                data-in005-focus-control={`card-${card.id}`}
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
        <div className="course-g04-l03-in-005-mobile-target-grid">
          {targetOrder.map((targetCard) => {
            const placed = placedCardForTarget(
              interaction,
              targetCard.targetId,
            );
            const slotNumber =
              leastToGreatestSlotNumber(targetCard.targetId);
            return (
              <button
                aria-label={placed
                  ? `${placed.accessibleLabel} placed in least-to-greatest slot ${slotNumber}`
                  : `Least-to-greatest slot ${slotNumber}`}
                data-in005-focus-control={`target-${targetCard.targetId}`}
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
                {placed ? `${placed.valueText} ✓` : `Slot ${slotNumber}`}
              </button>
            );
          })}
        </div>
      </fieldset>

      {interaction.outcome === "wrong" ? (
        <div
          aria-label="Incorrect placement feedback"
          aria-modal="true"
          className="course-g04-l03-in-005-mobile-dialog"
          data-host-wrong-feedback="_global.WrongFeed-unresolved"
          data-source-copy="authored-fallback-host-global-unresolved"
          role="alertdialog"
        >
          <strong>Incorrect placement</strong>
          <p>{COURSE_G04_L03_IN_005_ORDERING_WRONG_FEEDBACK}</p>
          <button
            aria-label="Close feedback and try the same card again"
            data-in005-focus-control="close-wrong"
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
          className="course-g04-l03-in-005-mobile-complete"
          data-current-js-terminal="persistent"
          data-original-runtime-terminal-parity="false"
          role="status"
        >
          <strong>
            {COURSE_G04_L03_IN_005_ORDERING_COMPLETION_FEEDBACK}
          </strong>
          <p>
            Current JavaScript terminal state. Use Replay to practice again.
          </p>
        </div>
      ) : null}
    </section>
  );
}

export function CourseG04L03In005Renderer(
  props: AnimationRendererProps,
) {
  const [interaction, dispatch] = useReducer(
    reduceCourseG04L03In005OrderingInteraction,
    undefined,
    createCourseG04L03In005OrderingState,
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
  const correctFeedbackRemainingMs = useRef(
    COURSE_G04_L03_IN_005_ORDERING_CURRENT_JS_TIMING.correctFeedbackMs,
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
  const sourceCanvasRenderKey = getCourseG04L03In005SourceCanvasRenderKey(
    props.replay ?? 0,
    props.seed,
    sourceVisualFrame,
  );
  const interactiveSourceVisualState = useMemo(
    () =>
      candidate.getFrameState(SOURCE_CLEAN_QUESTION_FRAME, {
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
          `[data-in005-focus-control="${focusControlKey}"]`,
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
    correctFeedbackRemainingMs.current =
      COURSE_G04_L03_IN_005_ORDERING_CURRENT_JS_TIMING.correctFeedbackMs;
  }, [interaction.lastPlacedCardId]);

  useEffect(() => {
    if (interaction.outcome !== "correct-feedback") return;
    if (props.reducedMotion) {
      const nextCard = COURSE_G04_L03_IN_005_ORDERING_CARDS.find(
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
        COURSE_G04_L03_IN_005_ORDERING_CURRENT_JS_TIMING.correctFeedbackMs;
      const nextCard = COURSE_G04_L03_IN_005_ORDERING_CARDS.find(
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
          ? active.dataset.in005FocusControl
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
      data-current-js-controls-enabled={interactionEnabled ? "true" : "false"}
      data-current-js-functional-candidate={interactionEnabled ? "true" : "false"}
      data-current-js-functional-scope="in005-ordering-drag-source-script-bound"
      data-current-js-source-visual-frame={sourceVisualFrame}
      data-deterministic-evidence-capture={
        deterministicEvidenceCapture ? "true" : "false"
      }
      data-host-wrong-feedback-resolved="false"
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
            ? event.target.dataset.in005FocusControl ?? null
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
        .course-g04-l03-in-005-mobile-fallback-slot,
        .course-g04-l03-in-005-mobile-controls {
          display: none;
        }

        .course-g04-l03-in-005-stage-surface button:focus-visible {
          outline: 4px solid #ffdd29;
          outline-offset: 3px;
        }

        @media ${RESPONSIVE_CONTROLS_MEDIA} {
          .course-g04-l03-in-005-stage-surface {
            display: none;
          }

          .course-g04-l03-in-005-mobile-fallback-slot {
            aspect-ratio: 4 / 3;
            display: block;
            inset: 0 0 auto;
            pointer-events: none;
            position: absolute;
            width: 100%;
            z-index: 4;
          }

          .course-g04-l03-in-005-mobile-controls {
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

          .course-g04-l03-in-005-mobile-controls--fallback {
            left: 3%;
            max-height: 92%;
            overflow: auto;
            pointer-events: auto;
            position: absolute;
            right: 3%;
            top: 4%;
          }

          .course-g04-l03-in-005-mobile-controls--portal {
            margin: 12px 0;
            max-width: 100%;
            pointer-events: auto;
            position: relative;
            width: 100%;
          }

          .course-g04-l03-in-005-mobile-instruction,
          .course-g04-l03-in-005-mobile-loading,
          .course-g04-l03-in-005-mobile-status {
            font-family: system-ui, sans-serif;
            font-size: 15px;
            line-height: 1.3;
            margin: 0;
          }

          .course-g04-l03-in-005-mobile-status {
            font-weight: 750;
          }

          .course-g04-l03-in-005-mobile-controls fieldset {
            border: 0;
            margin: 0;
            padding: 0;
          }

          .course-g04-l03-in-005-mobile-controls legend {
            font-size: 16px;
            font-weight: 850;
            margin-bottom: 7px;
          }

          .course-g04-l03-in-005-mobile-card-grid,
          .course-g04-l03-in-005-mobile-target-grid {
            display: grid;
            gap: 8px;
            grid-template-columns: repeat(3, minmax(48px, 1fr));
          }

          .course-g04-l03-in-005-mobile-controls button {
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

          .course-g04-l03-in-005-mobile-card-grid button {
            align-items: center;
            display: flex;
            gap: 6px;
            justify-content: center;
          }

          .course-g04-l03-in-005-mobile-controls button[aria-pressed="true"] {
            background: #ffdd29;
            box-shadow: inset 0 0 0 2px #082d86;
          }

          .course-g04-l03-in-005-mobile-controls button:focus-visible {
            box-shadow: 0 0 0 3px #fff200;
            outline: 3px solid #001d6d;
            outline-offset: 2px;
          }

          .course-g04-l03-in-005-mobile-controls button:disabled {
            cursor: default;
            opacity: .58;
          }

          .course-g04-l03-in-005-mobile-dialog,
          .course-g04-l03-in-005-mobile-complete {
            background: #ffffcc;
            border: 3px solid #224b8e;
            border-radius: 12px;
            display: grid;
            gap: 8px;
            padding: 12px;
          }

          .course-g04-l03-in-005-mobile-dialog p,
          .course-g04-l03-in-005-mobile-complete p {
            font-family: system-ui, sans-serif;
            line-height: 1.3;
            margin: 0;
          }

          .course-g04-l03-in-005-mobile-complete {
            background: #9900ff;
            color: #fff;
          }

          .course-g04-l03-in-005-mobile-complete strong {
            font-size: 24px;
          }
        }

        @media (max-width: 390px) {
          .course-g04-l03-in-005-mobile-card-grid,
          .course-g04-l03-in-005-mobile-target-grid {
            grid-template-columns: repeat(3, minmax(48px, 1fr));
          }
        }

        @media (min-width: 1280px) and (any-pointer: coarse) {
          .course-g04-l03-in-005-mobile-controls--portal {
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
                <div className="course-g04-l03-in-005-mobile-fallback-slot">
                  {mobileSurface}
                </div>
              )}
        </>
      ) : null}
    </div>
  );
}

export {COURSE_G04_L03_IN_005_SOURCE};
export const COURSE_G04_L03_IN_005_MOVIE = candidate.movie;
export const COURSE_G04_L03_IN_005_RUNTIME = candidate.runtime;
export const COURSE_G04_L03_IN_005_SOURCE_CONTRACT = Object.freeze({
  ...candidate.sourceContract,
  currentJavascriptInteractionStatus:
    "source-script-bound-functional-candidate",
  currentJavascriptInteractionScope: Object.freeze([
    "seven-source-bound-number-cards-and-exact-suffix-matched-ordering-slots",
    "html-drag-and-drop-and-select-then-target-keyboard-alternative",
    "authored-wrong-feedback-fallback-with-host-global-unresolved-and-close-retry",
    "source-target-reveal-and-card-hide",
    "per-card-correct-feedback-and-seven-card-persistent-current-js-terminal",
    "unfilled-slot-labels-do-not-disclose-source-answer-values",
    "three-source-glossary-callback-hits-safe-disabled",
    "host-pause-freezes-current-js-correct-feedback-delay",
    "reduced-motion-immediate-current-js-feedback-transition",
    "whole-renderer-replay-reset-and-source-canvas-remount",
    "responsive-mobile-and-coarse-pointer-touch-control-surface",
    "page-interaction-companion-portal-with-stage-fallback",
    "wide-coarse-companion-grid-row-seven",
    "desktop-mobile-focus-migration-and-wrong-close-focus-restore",
    "interactive-canvas-aria-inert-and-pointer-event-isolation",
    "answer-controls-fail-closed-until-source-canvas-ready",
    "clean-frame-143-source-visual-under-frame-144-functional-overlay",
    "deterministic-entry-state-capture-preserves-requested-frame-without-overlay",
    "no-local-help-clear-or-new-number-controls-invented",
  ]),
  currentJavascriptTiming:
    COURSE_G04_L03_IN_005_ORDERING_CURRENT_JS_TIMING,
  interactionAuthority:
    COURSE_G04_L03_IN_005_ORDERING_INTERACTION_AUTHORITY,
  wrongFeedbackTextStatus:
    "authored-fallback-host-global-unresolved",
  correctFeedbackTextStatus: "modern-assistive-not-source-exact",
  completionFeedbackTextStatus:
    "source-authored-exact-modern-persistent",
  sourceGlossaryActionStatus: "three-source-hits-safe-disabled",
  localControlStatus: "no-help-clear-or-new-number-controls",
  mainTimelineAudioStatus: "current-js-engineering-candidate-unaccepted",
  interactionFeedbackAudioStatus:
    "inventoried-unimplemented-unaccepted",
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
export const COURSE_G04_L03_IN_005_SCENARIOS = candidate.scenarios;
export const normalizeCourseG04L03In005Frame = candidate.normalizeFrame;
export const getCourseG04L03In005FrameState = candidate.getFrameState;
export const buildCourseG04L03In005CaptureAttributes =
  candidate.buildCaptureAttributes;

export default Object.freeze({
  ...candidate.module,
  reducedMotionFrame: SOURCE_INTERACTION_FRAME,
  Renderer: CourseG04L03In005Renderer,
});
