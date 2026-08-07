"use client";

import React, {useEffect, useReducer, useRef, useState} from "react";
import type {Dispatch, PointerEvent as ReactPointerEvent} from "react";

import type {AnimationLanguage, AnimationRendererProps} from "../contract";
import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G05_L04_VB_004_CARDS,
  COURSE_G05_L04_VB_004_INPUT_METHODS,
  COURSE_G05_L04_VB_004_INTERACTION_AUTHORITY,
  COURSE_G05_L04_VB_004_INTERACTION_DOMAIN,
  COURSE_G05_L04_VB_004_INTERACTION_FRAME,
  COURSE_G05_L04_VB_004_INTERACTION_SCENARIO,
  COURSE_G05_L04_VB_004_SOURCE_CONTROL_FRAME,
  COURSE_G05_L04_VB_004_STAGE,
  COURSE_G05_L04_VB_004_TARGETS,
  createCourseG05L04Vb004InteractionState,
  getCourseG05L04Vb004AppOwnedCardLabel,
  getCourseG05L04Vb004AppOwnedTargetLabel,
  getCourseG05L04Vb004CardPlacement,
  getCourseG05L04Vb004FeedbackMessage,
  getCourseG05L04Vb004PlacedCount,
  getCourseG05L04Vb004SnapPoint,
  getCourseG05L04Vb004TargetAtPoint,
  projectClientPointToCourseG05L04Vb004Stage,
  reduceCourseG05L04Vb004Interaction,
  translateCourseG05L04Vb004CardCenter,
  type CourseG05L04Vb004Card,
  type CourseG05L04Vb004CardId,
  type CourseG05L04Vb004InteractionAction,
  type CourseG05L04Vb004InteractionState,
  type CourseG05L04Vb004Point,
  type CourseG05L04Vb004TargetId,
} from "../timelines/course-g05-l04-vb-004-integers-drag-interaction";
import {
  COURSE_G05_L04_VB_004_CONFIG,
  COURSE_G05_L04_VB_004_SOURCE,
} from "../timelines/course-g05-l04-vb-004";

const candidate = createSourceStaticCanvasCandidate(
  COURSE_G05_L04_VB_004_CONFIG,
);
const SourceStaticRenderer = candidate.Renderer;

type SourceCanvasStatus =
  | "idle"
  | "loading"
  | "ready"
  | "error"
  | "blocked";

interface ActiveDrag {
  readonly cardId: CourseG05L04Vb004CardId;
  readonly pointerId: number;
  readonly pointerStart: CourseG05L04Vb004Point;
  readonly sourceCenter: CourseG05L04Vb004Point;
  readonly cardCenter: CourseG05L04Vb004Point;
  readonly moved: boolean;
}

interface ActiveMobileDrag {
  readonly cardId: CourseG05L04Vb004CardId;
  readonly pointerId: number;
  readonly pointerStart: CourseG05L04Vb004Point;
  readonly sourceCenter: CourseG05L04Vb004Point;
  readonly cardCenter: CourseG05L04Vb004Point;
  readonly moved: boolean;
}

const SOURCE_FONT =
  '"Comic Sans MS", "Chalkboard SE", "Marker Felt", ui-rounded, cursive';
const RESPONSIVE_CONTROLS_MEDIA =
  "(max-width: 640px), (any-pointer: coarse)";
const DRAG_THRESHOLD_STAGE_PX = 6;

const visuallyHiddenStyle = {
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  height: 1,
  overflow: "hidden",
  position: "absolute",
  whiteSpace: "nowrap",
  width: 1,
} as const;

const mobileCardOrder = Object.freeze(
  [...COURSE_G05_L04_VB_004_CARDS].sort(
    (left, right) =>
      left.sourceCenter.y - right.sourceCenter.y ||
      left.sourceCenter.x - right.sourceCenter.x,
  ),
);

export const COURSE_G05_L04_VB_004_APP_OWNED_UI_COPY = Object.freeze({
  en: Object.freeze({
    stageLabel: "Classify each number as an integer or non-integer",
    responsiveLabel: "Responsive integer classification controls",
    instruction: "Choose a number, then choose its category.",
    cardsGroupLabel: "Numbers to classify",
    targetsGroupLabel: "Number categories",
    loading:
      "Loading the source question before classification controls are enabled…",
    error:
      "The source question could not load. Classification controls are unavailable.",
    blocked: "The source question is unavailable in this context.",
    candidateBoundary:
      "Current JavaScript functional candidate. Original-runtime, behavior, feedback audio, Replay, owner, strict-completion, and publication acceptance are not claimed.",
  }),
  es: Object.freeze({
    stageLabel: "Clasifica cada número como entero o no entero",
    responsiveLabel: "Controles responsivos para clasificar números enteros",
    instruction: "Elige un número y luego elige su categoría.",
    cardsGroupLabel: "Números para clasificar",
    targetsGroupLabel: "Categorías de números",
    loading:
      "Cargando la pregunta fuente antes de habilitar los controles de clasificación…",
    error:
      "No se pudo cargar la pregunta fuente. Los controles de clasificación no están disponibles.",
    blocked: "La pregunta fuente no está disponible en este contexto.",
    candidateBoundary:
      "Candidato funcional JavaScript actual. No se afirma equivalencia con el entorno original, comportamiento, audio de retroalimentación, Repetir, aceptación del propietario, finalización estricta ni autorización de publicación.",
  }),
} as const);

export function getCourseG05L04Vb004AppOwnedUiCopy(
  language: AnimationLanguage,
) {
  return COURSE_G05_L04_VB_004_APP_OWNED_UI_COPY[language];
}

function isDeterministicEvidenceCapture({
  entryStateSha256 = "",
}: AnimationRendererProps) {
  return /^[a-f0-9]{64}$/.test(entryStateSha256);
}

function sourceCanvasStatusMessage(
  status: SourceCanvasStatus,
  uiLanguage: AnimationLanguage,
) {
  const copy = getCourseG05L04Vb004AppOwnedUiCopy(uiLanguage);
  if (status === "error") {
    return copy.error;
  }
  if (status === "blocked") {
    return copy.blocked;
  }
  return copy.loading;
}

function CardCopy({card}: {readonly card: CourseG05L04Vb004Card}) {
  if (card.fraction) {
    return (
      <span
        aria-hidden="true"
        style={{
          alignItems: "center",
          display: "grid",
          fontFamily: SOURCE_FONT,
          fontSize: 23,
          justifyItems: "center",
          lineHeight: 1,
        }}
      >
        <span style={{borderBottom: "2px solid #111", padding: "0 3px 2px"}}>
          {card.fraction.numerator}
        </span>
        <span style={{paddingTop: 2}}>{card.fraction.denominator}</span>
      </span>
    );
  }
  return (
    <span
      aria-hidden="true"
      style={{
        fontFamily: SOURCE_FONT,
        fontSize: 25,
        lineHeight: 1,
        whiteSpace: "nowrap",
      }}
    >
      {card.visibleText}
    </span>
  );
}

function StageCardVisual({
  card,
  buttonRef,
  center,
  dragActive,
  enabled,
  interactive,
  selected,
  uiLanguage,
  visible,
  onClick,
  onLostPointerCapture,
  onPointerCancel,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: {
  readonly card: CourseG05L04Vb004Card;
  readonly buttonRef?: (element: HTMLButtonElement | null) => void;
  readonly center: CourseG05L04Vb004Point;
  readonly dragActive: boolean;
  readonly enabled: boolean;
  readonly interactive: boolean;
  readonly selected: boolean;
  readonly uiLanguage: AnimationLanguage;
  readonly visible: boolean;
  readonly onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  readonly onLostPointerCapture?: (
    event: ReactPointerEvent<HTMLButtonElement>,
  ) => void;
  readonly onPointerCancel?: (
    event: ReactPointerEvent<HTMLButtonElement>,
  ) => void;
  readonly onPointerDown?: (
    event: ReactPointerEvent<HTMLButtonElement>,
  ) => void;
  readonly onPointerMove?: (
    event: ReactPointerEvent<HTMLButtonElement>,
  ) => void;
  readonly onPointerUp?: (
    event: ReactPointerEvent<HTMLButtonElement>,
  ) => void;
}) {
  const cardLabel = getCourseG05L04Vb004AppOwnedCardLabel(
    card.id,
    uiLanguage,
  );
  const spanish = uiLanguage === "es";
  const visual = (
    <span
      data-card-visible-copy={card.id}
      style={{
        alignItems: "center",
        background: "#fff",
        boxSizing: "border-box",
        display: "flex",
        height: card.sourceCardSize.height,
        justifyContent: "center",
        width: card.sourceCardSize.width,
      }}
    >
      <CardCopy card={card} />
    </span>
  );
  const sharedStyle = {
    alignItems: "center",
    display: "flex",
    height: Math.max(48, card.sourceCardSize.height + 12),
    justifyContent: "center",
    left: center.x,
    margin: 0,
    padding: 0,
    position: "absolute",
    top: center.y,
    transform: "translate(-50%, -50%)",
    visibility: visible ? "visible" : "hidden",
    width: Math.max(48, card.sourceCardSize.width + 12),
    zIndex: dragActive ? 7 : 4,
  } as const;

  if (!interactive) {
    return (
      <span
        aria-label={spanish
          ? `${cardLabel} colocado correctamente`
          : `${cardLabel} placed correctly`}
        data-card-placed={card.id}
        role="img"
        style={{...sharedStyle, pointerEvents: "none"}}
      >
        {visual}
      </span>
    );
  }
  return (
    <button
      aria-label={spanish ? `Mover ${cardLabel}` : `Move ${cardLabel}`}
      aria-pressed={selected}
      data-card-input="pointer-and-keyboard"
      data-source-card={card.id}
      disabled={!enabled}
      onClick={onClick}
      onLostPointerCapture={onLostPointerCapture}
      onPointerCancel={onPointerCancel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      ref={buttonRef}
      style={{
        ...sharedStyle,
        background: selected ? "rgb(255 221 41 / 28%)" : "transparent",
        border: selected ? "3px solid #0a4ba5" : "1px solid transparent",
        boxSizing: "border-box",
        color: "#111",
        cursor: dragActive ? "grabbing" : "grab",
        pointerEvents: enabled ? "auto" : "none",
        touchAction: "none",
        userSelect: "none",
      }}
      type="button"
    >
      {visual}
    </button>
  );
}

interface SurfaceProps {
  readonly canvasStatus: SourceCanvasStatus;
  readonly controlsReady: boolean;
  readonly dispatch: Dispatch<CourseG05L04Vb004InteractionAction>;
  readonly interaction: CourseG05L04Vb004InteractionState;
  readonly uiLanguage: AnimationLanguage;
}

function StageSurface({
  canvasStatus,
  controlsReady,
  dispatch,
  interaction,
  uiLanguage,
}: SurfaceProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const activeDragRef = useRef<ActiveDrag | null>(null);
  const [activeDrag, setActiveDrag] = useState<ActiveDrag | null>(null);
  const cardRefs = useRef<
    Partial<Record<CourseG05L04Vb004CardId, HTMLButtonElement | null>>
  >({});
  const targetRefs = useRef<
    Partial<Record<CourseG05L04Vb004TargetId, HTMLButtonElement | null>>
  >({});
  const completionRef = useRef<HTMLDivElement>(null);

  const updateActiveDrag = (next: ActiveDrag | null) => {
    activeDragRef.current = next;
    setActiveDrag(next);
  };
  const pointerStagePoint = (
    event: ReactPointerEvent<HTMLButtonElement>,
  ) => {
    const rect = svgRef.current?.getBoundingClientRect();
    return rect
      ? projectClientPointToCourseG05L04Vb004Stage(
          {x: event.clientX, y: event.clientY},
          rect,
        )
      : null;
  };

  const beginDrag = (
    event: ReactPointerEvent<HTMLButtonElement>,
    card: CourseG05L04Vb004Card,
  ) => {
    if (
      !controlsReady ||
      !event.isPrimary ||
      (event.pointerType === "mouse" && event.button !== 0) ||
      activeDragRef.current
    ) {
      return;
    }
    const pointerStart = pointerStagePoint(event);
    if (!pointerStart) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    updateActiveDrag({
      cardId: card.id,
      pointerId: event.pointerId,
      pointerStart,
      sourceCenter: card.sourceCenter,
      cardCenter: card.sourceCenter,
      moved: false,
    });
  };

  const moveDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const current = activeDragRef.current;
    if (!current || current.pointerId !== event.pointerId) return;
    const pointerNow = pointerStagePoint(event);
    if (!pointerNow) return;
    const cardCenter = translateCourseG05L04Vb004CardCenter(
      current.sourceCenter,
      current.pointerStart,
      pointerNow,
    );
    if (!cardCenter) return;
    const moved =
      current.moved ||
      Math.hypot(
        pointerNow.x - current.pointerStart.x,
        pointerNow.y - current.pointerStart.y,
      ) >= DRAG_THRESHOLD_STAGE_PX;
    if (moved) event.preventDefault();
    updateActiveDrag({...current, cardCenter, moved});
  };

  const finishDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const current = activeDragRef.current;
    if (!current || current.pointerId !== event.pointerId) return;
    const pointerNow = pointerStagePoint(event);
    const cardCenter = pointerNow
      ? translateCourseG05L04Vb004CardCenter(
          current.sourceCenter,
          current.pointerStart,
          pointerNow,
        )
      : current.cardCenter;
    updateActiveDrag(null);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    const moved =
      current.moved ||
      Boolean(
        pointerNow &&
          Math.hypot(
            pointerNow.x - current.pointerStart.x,
            pointerNow.y - current.pointerStart.y,
          ) >= DRAG_THRESHOLD_STAGE_PX,
      );
    if (!moved) {
      dispatch({type: "select-card", cardId: current.cardId});
      return;
    }
    dispatch({
      type: "drop-card",
      cardId: current.cardId,
      targetId: getCourseG05L04Vb004TargetAtPoint(cardCenter),
      input: event.pointerType === "touch" ? "touch" : "pointer",
    });
  };

  const cancelDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const current = activeDragRef.current;
    if (!current || current.pointerId !== event.pointerId) return;
    updateActiveDrag(null);
  };

  const feedbackMessage = getCourseG05L04Vb004FeedbackMessage(
    interaction,
    uiLanguage,
  );
  const placedCount = getCourseG05L04Vb004PlacedCount(interaction);
  const copy = getCourseG05L04Vb004AppOwnedUiCopy(uiLanguage);
  const spanish = uiLanguage === "es";

  useEffect(() => {
    const feedback = interaction.feedback;
    const surface = svgRef.current;
    if (!feedback || !surface || surface.getClientRects().length === 0) return;
    const animationFrame = window.requestAnimationFrame(() => {
      if (feedback.kind === "wrong") {
        cardRefs.current[feedback.cardId]?.focus();
        return;
      }
      if (feedback.kind === "complete") {
        completionRef.current?.focus();
        return;
      }
      const nextCard = COURSE_G05_L04_VB_004_CARDS.find(
        ({id}) => getCourseG05L04Vb004CardPlacement(interaction, id) === null,
      );
      if (nextCard) cardRefs.current[nextCard.id]?.focus();
    });
    return () => window.cancelAnimationFrame(animationFrame);
  }, [interaction]);

  return (
    <svg
      aria-busy={!controlsReady}
      aria-label={copy.stageLabel}
      className="course-g05-l04-vb004-stage-surface"
      data-app-owned-ui-language={uiLanguage}
      data-current-js-controls-ready={controlsReady ? "true" : "false"}
      data-input-methods={COURSE_G05_L04_VB_004_INPUT_METHODS.join(",")}
      data-source-canvas-status={canvasStatus}
      data-surface="stage"
      focusable="false"
      lang={uiLanguage}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          updateActiveDrag(null);
          dispatch({type: "cancel-selection"});
        }
      }}
      ref={svgRef}
      role="group"
      style={{
        aspectRatio: "4 / 3",
        height: "auto",
        inset: "0 0 auto",
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
              {sourceCanvasStatusMessage(canvasStatus, uiLanguage)}
            </span>
          ) : null}

          <span
            aria-hidden="true"
            data-source-card-tray-mask="current-js"
            style={{
              background: "#b8d8f7",
              height: 260,
              left: 535,
              position: "absolute",
              top: 145,
              visibility: controlsReady ? "visible" : "hidden",
              width: 170,
              zIndex: 2,
            }}
          />

          {COURSE_G05_L04_VB_004_TARGETS.map((target) => {
            const selectedCardId = interaction.selectedCardId;
            const disabled = !controlsReady || !selectedCardId;
            const targetWidth = target.bounds.right - target.bounds.left;
            const targetHeight = target.bounds.bottom - target.bounds.top;
            const targetLabel =
              getCourseG05L04Vb004AppOwnedTargetLabel(target.id, uiLanguage);
            return (
              <button
                aria-label={spanish
                  ? `${targetLabel}, zona de destino; ${interaction.buckets[target.id].length} de 4 colocados`
                  : `${targetLabel} drop area; ${interaction.buckets[target.id].length} of 4 placed`}
                data-source-target={target.id}
                disabled={disabled}
                key={target.id}
                onClick={() => {
                  if (!selectedCardId) return;
                  dispatch({
                    type: "drop-card",
                    cardId: selectedCardId,
                    targetId: target.id,
                    input: "keyboard",
                  });
                }}
                ref={(element) => {
                  targetRefs.current[target.id] = element;
                }}
                style={{
                  background: selectedCardId
                    ? "rgb(255 221 41 / 10%)"
                    : "transparent",
                  border: selectedCardId
                    ? "3px dashed rgb(10 75 165 / 65%)"
                    : "1px solid transparent",
                  boxSizing: "border-box",
                  color: "transparent",
                  cursor: disabled ? "default" : "pointer",
                  height: targetHeight,
                  left: target.bounds.left,
                  margin: 0,
                  padding: 0,
                  pointerEvents: "auto",
                  position: "absolute",
                  top: target.bounds.top,
                  width: targetWidth,
                  zIndex: 3,
                }}
                type="button"
              >
                {targetLabel}
              </button>
            );
          })}

          {COURSE_G05_L04_VB_004_CARDS.map((card) => {
            const placement = getCourseG05L04Vb004CardPlacement(
              interaction,
              card.id,
            );
            const dragging = activeDrag?.cardId === card.id;
            const center = dragging
              ? activeDrag.cardCenter
              : placement
                ? getCourseG05L04Vb004SnapPoint(
                    placement.targetId,
                    placement.index,
                  ) ?? card.sourceCenter
                : card.sourceCenter;
            return (
              <StageCardVisual
                card={card}
                buttonRef={(element) => {
                  cardRefs.current[card.id] = element;
                }}
                center={center}
                dragActive={dragging}
                enabled={controlsReady}
                interactive={placement === null}
                key={card.id}
                onClick={(event) => {
                  if (event.detail === 0) {
                    dispatch({type: "select-card", cardId: card.id});
                    if (interaction.selectedCardId !== card.id) {
                      window.requestAnimationFrame(() =>
                        targetRefs.current.Mc_Tar_1?.focus(),
                      );
                    }
                  }
                }}
                onLostPointerCapture={cancelDrag}
                onPointerCancel={cancelDrag}
                onPointerDown={(event) => beginDrag(event, card)}
                onPointerMove={moveDrag}
                onPointerUp={finishDrag}
                selected={interaction.selectedCardId === card.id}
                uiLanguage={uiLanguage}
                visible={controlsReady}
              />
            );
          })}

          <div
            aria-live="polite"
            data-feedback-sequence={interaction.feedback?.sequence ?? 0}
            data-interaction-status={interaction.status}
            key={interaction.feedback?.sequence ?? 0}
            ref={completionRef}
            role="status"
            style={{
              background:
                interaction.feedback?.kind === "wrong"
                  ? "#fff0df"
                  : interaction.status === "complete"
                    ? "#e2f8e9"
                    : "rgb(255 255 255 / 88%)",
              border: "2px solid #174a8f",
              borderRadius: 8,
              bottom: 122,
              boxSizing: "border-box",
              color: "#122c51",
              fontFamily: "system-ui, sans-serif",
              fontSize: 13,
              fontWeight: 700,
              left: 520,
              lineHeight: 1.25,
              minHeight: 44,
              padding: "6px 9px",
              pointerEvents: "none",
              position: "absolute",
              visibility:
                controlsReady &&
                (interaction.feedback || interaction.selectedCardId)
                  ? "visible"
                  : "hidden",
              width: 190,
              zIndex: 8,
            }}
            tabIndex={interaction.status === "complete" ? -1 : undefined}
          >
            {feedbackMessage} ({placedCount}/8)
          </div>
        </div>
      </foreignObject>
    </svg>
  );
}

function MobileSurface({
  canvasStatus,
  controlsReady,
  dispatch,
  interaction,
  uiLanguage,
}: SurfaceProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const cardRefs = useRef<
    Partial<Record<CourseG05L04Vb004CardId, HTMLButtonElement | null>>
  >({});
  const targetRefs = useRef<
    Partial<Record<CourseG05L04Vb004TargetId, HTMLButtonElement | null>>
  >({});
  const completionRef = useRef<HTMLParagraphElement>(null);
  const activeDragRef = useRef<ActiveMobileDrag | null>(null);
  const [activeDrag, setActiveDrag] = useState<ActiveMobileDrag | null>(null);

  const updateActiveDrag = (next: ActiveMobileDrag | null) => {
    activeDragRef.current = next;
    setActiveDrag(next);
  };
  const beginDrag = (
    event: ReactPointerEvent<HTMLButtonElement>,
    cardId: CourseG05L04Vb004CardId,
  ) => {
    if (
      !controlsReady ||
      !event.isPrimary ||
      (event.pointerType === "mouse" && event.button !== 0) ||
      activeDragRef.current
    ) {
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    const sourceCenter = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    updateActiveDrag({
      cardId,
      pointerId: event.pointerId,
      pointerStart: {x: event.clientX, y: event.clientY},
      sourceCenter,
      cardCenter: sourceCenter,
      moved: false,
    });
  };
  const moveDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const current = activeDragRef.current;
    if (!current || current.pointerId !== event.pointerId) return;
    const pointerNow = {x: event.clientX, y: event.clientY};
    const distance = Math.hypot(
      pointerNow.x - current.pointerStart.x,
      pointerNow.y - current.pointerStart.y,
    );
    const moved = current.moved || distance >= DRAG_THRESHOLD_STAGE_PX;
    if (moved) event.preventDefault();
    updateActiveDrag({
      ...current,
      cardCenter: {
        x: current.sourceCenter.x + pointerNow.x - current.pointerStart.x,
        y: current.sourceCenter.y + pointerNow.y - current.pointerStart.y,
      },
      moved,
    });
  };
  const targetAtClientPoint = ({x, y}: CourseG05L04Vb004Point) => {
    const hits = COURSE_G05_L04_VB_004_TARGETS.filter((target) => {
      const rect = targetRefs.current[target.id]?.getBoundingClientRect();
      return Boolean(
        rect &&
          x >= rect.left &&
          x <= rect.right &&
          y >= rect.top &&
          y <= rect.bottom,
      );
    });
    return hits.length === 1 ? hits[0]!.id : null;
  };
  const finishDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const current = activeDragRef.current;
    if (!current || current.pointerId !== event.pointerId) return;
    const pointerNow = {x: event.clientX, y: event.clientY};
    const distance = Math.hypot(
      pointerNow.x - current.pointerStart.x,
      pointerNow.y - current.pointerStart.y,
    );
    const cardCenter = {
      x: current.sourceCenter.x + pointerNow.x - current.pointerStart.x,
      y: current.sourceCenter.y + pointerNow.y - current.pointerStart.y,
    };
    const moved = current.moved || distance >= DRAG_THRESHOLD_STAGE_PX;
    updateActiveDrag(null);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (!moved) {
      dispatch({type: "select-card", cardId: current.cardId});
      return;
    }
    dispatch({
      type: "drop-card",
      cardId: current.cardId,
      targetId: targetAtClientPoint(cardCenter),
      input: event.pointerType === "touch" ? "touch" : "pointer",
    });
  };
  const cancelDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const current = activeDragRef.current;
    if (!current || current.pointerId !== event.pointerId) return;
    updateActiveDrag(null);
  };

  useEffect(() => {
    const feedback = interaction.feedback;
    const surface = sectionRef.current;
    if (!feedback || !surface || surface.getClientRects().length === 0) return;
    const animationFrame = window.requestAnimationFrame(() => {
      if (feedback.kind === "wrong") {
        cardRefs.current[feedback.cardId]?.focus();
        return;
      }
      if (feedback.kind === "complete") {
        completionRef.current?.focus();
        return;
      }
      const nextCard = COURSE_G05_L04_VB_004_CARDS.find(
        ({id}) => getCourseG05L04Vb004CardPlacement(interaction, id) === null,
      );
      if (nextCard) cardRefs.current[nextCard.id]?.focus();
    });
    return () => window.cancelAnimationFrame(animationFrame);
  }, [interaction]);

  const feedbackMessage = getCourseG05L04Vb004FeedbackMessage(
    interaction,
    uiLanguage,
  );
  const copy = getCourseG05L04Vb004AppOwnedUiCopy(uiLanguage);
  const spanish = uiLanguage === "es";
  return (
    <section
      aria-busy={!controlsReady}
      aria-label={copy.responsiveLabel}
      className="course-g05-l04-vb004-mobile-surface"
      data-app-owned-ui-language={uiLanguage}
      data-current-js-controls-ready={controlsReady ? "true" : "false"}
      data-surface="responsive-touch"
      lang={uiLanguage}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          updateActiveDrag(null);
          dispatch({type: "cancel-selection"});
        }
      }}
      ref={sectionRef}
    >
      <strong>{copy.instruction}</strong>
      <div
        aria-label={copy.cardsGroupLabel}
        className="course-g05-l04-vb004-mobile-card-grid"
        role="group"
      >
        {mobileCardOrder.map((card) => {
          const placed = Boolean(
            getCourseG05L04Vb004CardPlacement(interaction, card.id),
          );
          const dragging = activeDrag?.cardId === card.id;
          const cardLabel = getCourseG05L04Vb004AppOwnedCardLabel(
            card.id,
            uiLanguage,
          );
          const translateX = dragging
            ? activeDrag.cardCenter.x - activeDrag.sourceCenter.x
            : 0;
          const translateY = dragging
            ? activeDrag.cardCenter.y - activeDrag.sourceCenter.y
            : 0;
          return (
            <button
              aria-label={placed
                ? spanish
                  ? `${cardLabel} colocado correctamente`
                  : `${cardLabel} placed correctly`
                : spanish
                  ? `Seleccionar ${cardLabel}`
                  : `Select ${cardLabel}`}
              aria-pressed={interaction.selectedCardId === card.id}
              data-mobile-source-card={card.id}
              disabled={!controlsReady || placed}
              key={card.id}
              onClick={(event) => {
                if (event.detail !== 0) return;
                dispatch({type: "select-card", cardId: card.id});
                if (interaction.selectedCardId !== card.id) {
                  window.requestAnimationFrame(() =>
                    targetRefs.current.Mc_Tar_1?.focus(),
                  );
                }
              }}
              onLostPointerCapture={cancelDrag}
              onPointerCancel={cancelDrag}
              onPointerDown={(event) => beginDrag(event, card.id)}
              onPointerMove={moveDrag}
              onPointerUp={finishDrag}
              ref={(element) => {
                cardRefs.current[card.id] = element;
              }}
              style={{
                position: "relative",
                touchAction: "none",
                transform: `translate(${translateX}px, ${translateY}px)`,
                zIndex: dragging ? 8 : 1,
              }}
              type="button"
            >
              {placed ? "✓ " : ""}{card.visibleText}
            </button>
          );
        })}
      </div>
      <div
        aria-label={copy.targetsGroupLabel}
        className="course-g05-l04-vb004-mobile-target-grid"
        role="group"
      >
        {COURSE_G05_L04_VB_004_TARGETS.map((target) => {
          const targetLabel = getCourseG05L04Vb004AppOwnedTargetLabel(
            target.id,
            uiLanguage,
          );
          return <button
            aria-label={spanish
              ? `Colocar en ${targetLabel}`
              : `Place in ${targetLabel}`}
            data-mobile-source-target={target.id}
            disabled={!controlsReady || !interaction.selectedCardId}
            key={target.id}
            onClick={() => {
              if (!interaction.selectedCardId) return;
              dispatch({
                type: "drop-card",
                cardId: interaction.selectedCardId,
                targetId: target.id,
                input: "touch",
              });
            }}
            ref={(element) => {
              targetRefs.current[target.id] = element;
            }}
            type="button"
          >
            {targetLabel}
          </button>
        })}
      </div>
      <p
        aria-live={canvasStatus === "error" ? "assertive" : "polite"}
        data-feedback-sequence={interaction.feedback?.sequence ?? 0}
        data-interaction-status={interaction.status}
        key={interaction.feedback?.sequence ?? 0}
        ref={completionRef}
        role={canvasStatus === "error" ? "alert" : "status"}
        tabIndex={interaction.status === "complete" ? -1 : undefined}
      >
        {controlsReady
          ? `${feedbackMessage} (${getCourseG05L04Vb004PlacedCount(interaction)}/8)`
          : sourceCanvasStatusMessage(canvasStatus, uiLanguage)}
      </p>
    </section>
  );
}

export function CourseG05L04Vb004Renderer(props: AnimationRendererProps) {
  const [interaction, dispatch] = useReducer(
    reduceCourseG05L04Vb004Interaction,
    undefined,
    createCourseG05L04Vb004InteractionState,
  );
  const [canvasStatus, setCanvasStatus] =
    useState<SourceCanvasStatus>("idle");
  const visualHostRef = useRef<HTMLDivElement>(null);
  const frameDomain =
    props.frameDomain ?? COURSE_G05_L04_VB_004_INTERACTION_DOMAIN;
  const uiLanguage = props.uiLanguage ?? props.lang;
  const uiCopy = getCourseG05L04Vb004AppOwnedUiCopy(uiLanguage);
  const deterministicEvidenceCapture = isDeterministicEvidenceCapture(props);
  const interactionEligible =
    props.frame === COURSE_G05_L04_VB_004_INTERACTION_FRAME &&
    frameDomain === COURSE_G05_L04_VB_004_INTERACTION_DOMAIN &&
    props.scenario === COURSE_G05_L04_VB_004_INTERACTION_SCENARIO &&
    props.lang === "en" &&
    !deterministicEvidenceCapture;
  const controlsReady = interactionEligible && canvasStatus === "ready";
  const sourceCanvasRenderKey =
    `source-vb004-${props.replay ?? 0}-${props.seed}-${props.frame}`;

  useEffect(() => {
    dispatch({type: "replay"});
  }, [interactionEligible, props.replay, props.seed]);

  useEffect(() => {
    const host = visualHostRef.current;
    if (!host || !interactionEligible) {
      setCanvasStatus("idle");
      return;
    }
    setCanvasStatus("loading");
    const update = () => {
      const sourceCandidate = host.querySelector<HTMLElement>(
        '[data-candidate-status="source-static-engineering-not-strict"]' +
          "[data-canvas-status]",
      );
      const nextStatus = sourceCandidate?.dataset.canvasStatus;
      if (
        nextStatus === "idle" ||
        nextStatus === "loading" ||
        nextStatus === "ready" ||
        nextStatus === "error" ||
        nextStatus === "blocked"
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
  }, [interactionEligible, props.replay, sourceCanvasRenderKey]);

  return (
    <div
      data-authoritative-original-runtime-evidence="false"
      data-behavior-parity-established="false"
      data-current-js-controls-enabled={controlsReady ? "true" : "false"}
      data-current-js-functional-candidate={
        interactionEligible ? "true" : "false"
      }
      data-current-js-functional-scope="vb004-integers-source-script-bound-classification"
      data-current-js-interaction-eligible={
        interactionEligible ? "true" : "false"
      }
      data-deterministic-evidence-capture={
        deterministicEvidenceCapture ? "true" : "false"
      }
      data-input-methods={COURSE_G05_L04_VB_004_INPUT_METHODS.join(",")}
      data-app-owned-ui-language={uiLanguage}
      data-modern-snap-behavior="current-js-fixed-slots-source-parity-false"
      data-owner-accepted="false"
      data-replay-parity-established="false"
      data-source-actionscript-executed="false"
      data-source-runtime-language={props.lang}
      data-strict-acceptance-effect="none"
      data-strict-migration-complete="false"
      style={{
        margin: "0 auto",
        maxWidth: COURSE_G05_L04_VB_004_STAGE.width,
        position: "relative",
        width: "100%",
      }}
    >
      <style>{`
        .course-g05-l04-vb004-mobile-surface {
          display: none;
        }

        .course-g05-l04-vb004-stage-surface button:focus-visible {
          outline: 5px solid #ffdd29;
          outline-offset: 2px;
        }

        @media ${RESPONSIVE_CONTROLS_MEDIA} {
          .course-g05-l04-vb004-stage-surface {
            display: none;
          }

          .course-g05-l04-vb004-mobile-surface {
            align-content: center;
            aspect-ratio: 4 / 3;
            background: rgb(232 246 255 / 98%);
            box-sizing: border-box;
            color: #102d55;
            display: grid;
            font-family: system-ui, sans-serif;
            gap: clamp(4px, 1.4vw, 10px);
            inset: 0 0 auto;
            overflow: auto;
            padding: clamp(7px, 2vw, 18px);
            position: absolute;
            width: 100%;
            z-index: 5;
          }

          .course-g05-l04-vb004-mobile-surface > strong {
            font-size: clamp(12px, 3.2vw, 19px);
            line-height: 1.15;
            text-align: center;
          }

          .course-g05-l04-vb004-mobile-card-grid {
            display: grid;
            gap: clamp(4px, 1.2vw, 8px);
            grid-template-columns: repeat(4, minmax(0, 1fr));
          }

          .course-g05-l04-vb004-mobile-target-grid {
            display: grid;
            gap: clamp(6px, 2vw, 12px);
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .course-g05-l04-vb004-mobile-surface button {
            background: #fff;
            border: 2px solid #1d5b9f;
            border-radius: 8px;
            color: #102d55;
            font-size: clamp(13px, 3.5vw, 20px);
            font-weight: 800;
            min-height: 44px;
            min-width: 0;
            padding: 4px;
          }

          .course-g05-l04-vb004-mobile-surface button[aria-pressed="true"] {
            background: #fff1a8;
            border-color: #9b5700;
          }

          .course-g05-l04-vb004-mobile-surface button:focus-visible {
            outline: 4px solid #ffbf00;
            outline-offset: 2px;
          }

          .course-g05-l04-vb004-mobile-surface p {
            font-size: clamp(11px, 2.9vw, 16px);
            font-weight: 700;
            line-height: 1.2;
            margin: 0;
            min-height: 1.2em;
            text-align: center;
          }
        }
      `}</style>
      <div
        aria-hidden={interactionEligible ? true : undefined}
        data-source-canvas-accessibility-isolated={
          interactionEligible ? "true" : "false"
        }
        inert={interactionEligible ? true : undefined}
        ref={visualHostRef}
        style={{pointerEvents: interactionEligible ? "none" : undefined}}
      >
        <SourceStaticRenderer
          key={sourceCanvasRenderKey}
          {...props}
        />
      </div>
      {interactionEligible ? (
        <>
          <p style={visuallyHiddenStyle}>
            <span lang={uiLanguage}>{uiCopy.candidateBoundary}</span>
          </p>
          <StageSurface
            canvasStatus={canvasStatus}
            controlsReady={controlsReady}
            dispatch={dispatch}
            interaction={interaction}
            key={`stage-${props.replay ?? 0}-${props.seed}`}
            uiLanguage={uiLanguage}
          />
          <MobileSurface
            canvasStatus={canvasStatus}
            controlsReady={controlsReady}
            dispatch={dispatch}
            interaction={interaction}
            uiLanguage={uiLanguage}
          />
        </>
      ) : null}
    </div>
  );
}

export {COURSE_G05_L04_VB_004_SOURCE};
export const COURSE_G05_L04_VB_004_MOVIE = candidate.movie;
export const COURSE_G05_L04_VB_004_RUNTIME = candidate.runtime;
export const COURSE_G05_L04_VB_004_SOURCE_CONTRACT = Object.freeze({
  ...candidate.sourceContract,
  currentJavascriptInteractionStatus:
    "source-script-bound-integers-classification-functional-candidate",
  currentJavascriptFunctionalEntry: Object.freeze({
    frameDomain: COURSE_G05_L04_VB_004_INTERACTION_DOMAIN,
    frame: COURSE_G05_L04_VB_004_INTERACTION_FRAME,
    sourceControlFrame: COURSE_G05_L04_VB_004_SOURCE_CONTROL_FRAME,
    scenario: COURSE_G05_L04_VB_004_INTERACTION_SCENARIO,
    language: "en",
    deterministicCaptureOverlayEnabled: false,
  }),
  currentJavascriptInteractionScope: Object.freeze([
    "eight-source-bound-number-cards",
    "two-swf-static-matrix-derived-target-bounds",
    "pointer-and-touch-drag-with-pointer-capture",
    "select-card-then-target-keyboard-and-touch-alternative",
    "wrong-drop-return-correct-lock-and-eight-card-completion",
    "whole-current-js-state-replay-reset",
    "responsive-in-stage-touch-control-surface",
    "canvas-ready-fail-closed-controls",
    "deterministic-capture-overlay-suppression",
    "bilingual-app-owned-ui-source-runtime-language-unchanged",
  ]),
  appOwnedUiLocalizationStatus:
    "en-es-source-runtime-language-and-source-evidence-unchanged",
  inputMethods: COURSE_G05_L04_VB_004_INPUT_METHODS,
  interactionAuthority: COURSE_G05_L04_VB_004_INTERACTION_AUTHORITY,
  sourceCanvasControlStatus: "disabled-preserved-visual-only",
  sourceActionScriptExecutionStatus: "never-executed",
  sourceFeedbackAudioStatus: "inventoried-unimplemented-unaccepted",
  associatedAudioStatus: "inventoried-unimplemented-unaccepted",
  modernSnapStatus: "fixed-slots-current-js-only-source-parity-false",
  spanishInteractionStatus: "unimplemented-disabled",
  naturalTerminalContinuationEstablished: false,
  behaviorParityEstablished: false,
  replayParityEstablished: false,
  originalRuntimeAuthorityEstablished: false,
  ownerAccepted: false,
  strictMigrationComplete: false,
  strictAcceptanceEffect: "none",
});
export const COURSE_G05_L04_VB_004_SCENARIOS = candidate.scenarios;
export const normalizeCourseG05L04Vb004Frame = candidate.normalizeFrame;
export const getCourseG05L04Vb004FrameState = candidate.getFrameState;
export const buildCourseG05L04Vb004CaptureAttributes =
  candidate.buildCaptureAttributes;

export default Object.freeze({
  ...candidate.module,
  reducedMotionFrame: COURSE_G05_L04_VB_004_INTERACTION_FRAME,
  Renderer: CourseG05L04Vb004Renderer,
});
