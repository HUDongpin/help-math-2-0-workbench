export type CourseG04L03Ti003CardId =
  | "Scr_1"
  | "Scr_2"
  | "Scr_3"
  | "Scr_4"
  | "Scr_5"
  | "Scr_6";

export type CourseG04L03Ti003TargetId =
  | "Mc_Tar_1"
  | "Mc_Tar_2"
  | "Mc_Tar_3"
  | "Mc_Tar_4"
  | "Mc_Tar_5"
  | "Mc_Tar_6";

export type CourseG04L03Ti003Outcome =
  | "ready"
  | "wrong"
  | "correct-feedback"
  | "complete";

export interface CourseG04L03Ti003Point {
  readonly x: number;
  readonly y: number;
}

export interface CourseG04L03Ti003Size {
  readonly height: number;
  readonly width: number;
}

export interface CourseG04L03Ti003Bounds
  extends CourseG04L03Ti003Point, CourseG04L03Ti003Size {
  readonly bottom: number;
  readonly left: number;
  readonly right: number;
  readonly top: number;
}

export interface CourseG04L03Ti003Card {
  readonly id: CourseG04L03Ti003CardId;
  readonly valueText: "-10" | "9" | "1" | "-2" | "-7" | "5";
  readonly numericValue: -10 | 9 | 1 | -2 | -7 | 5;
  readonly accessibleLabel: string;
  readonly sourceCenter: CourseG04L03Ti003Point;
  readonly sourceSize: CourseG04L03Ti003Size;
  readonly targetId: CourseG04L03Ti003TargetId;
  readonly targetCenter: CourseG04L03Ti003Point;
  readonly targetSize: CourseG04L03Ti003Size;
}

export type CourseG04L03Ti003Placements = Readonly<
  Record<CourseG04L03Ti003CardId, CourseG04L03Ti003TargetId | null>
>;

export interface CourseG04L03Ti003NumberLineDragState {
  readonly placements: CourseG04L03Ti003Placements;
  readonly selectedCardId: CourseG04L03Ti003CardId | null;
  readonly wrongCardId: CourseG04L03Ti003CardId | null;
  readonly lastPlacedCardId: CourseG04L03Ti003CardId | null;
  readonly attemptedTargetId: CourseG04L03Ti003TargetId | null;
  readonly outcome: CourseG04L03Ti003Outcome;
  readonly locked: boolean;
  readonly feedback: string | null;
}

export type CourseG04L03Ti003NumberLineDragAction =
  | Readonly<{
      type: "select-card";
      cardId: CourseG04L03Ti003CardId;
    }>
  | Readonly<{
      type: "drop-card";
      cardId?: CourseG04L03Ti003CardId;
      targetId: CourseG04L03Ti003TargetId;
    }>
  | Readonly<{type: "close-wrong"}>
  | Readonly<{type: "feedback-complete"}>
  | Readonly<{type: "reset"}>
  | Readonly<{type: "replay"}>;

const freezePoint = (
  point: CourseG04L03Ti003Point,
): CourseG04L03Ti003Point => Object.freeze({...point});

const freezeSize = (
  size: CourseG04L03Ti003Size,
): CourseG04L03Ti003Size => Object.freeze({...size});

const CARD_GEOMETRY = Object.freeze({
  Scr_1: Object.freeze({
    center: freezePoint({x: 184.8, y: 374.95}),
    size: freezeSize({height: 44.15, width: 44.15}),
  }),
  Scr_2: Object.freeze({
    center: freezePoint({x: 275.75, y: 374.95}),
    size: freezeSize({height: 44.15, width: 44.15}),
  }),
  Scr_3: Object.freeze({
    center: freezePoint({x: 366.7, y: 374.95}),
    size: freezeSize({height: 44.15, width: 44.15}),
  }),
  Scr_4: Object.freeze({
    center: freezePoint({x: 457.6, y: 374.95}),
    size: freezeSize({height: 44.15, width: 44.15}),
  }),
  Scr_5: Object.freeze({
    center: freezePoint({x: 548.6, y: 374.95}),
    size: freezeSize({height: 44.15, width: 44.15}),
  }),
  Scr_6: Object.freeze({
    center: freezePoint({x: 639.55, y: 374.95}),
    size: freezeSize({height: 44.15, width: 44.15}),
  }),
});

const TARGET_GEOMETRY = Object.freeze({
  Mc_Tar_1: Object.freeze({
    center: freezePoint({x: 158, y: 215.8}),
    size: freezeSize({height: 44, width: 44.8}),
  }),
  Mc_Tar_2: Object.freeze({
    center: freezePoint({x: 616.75, y: 215.6}),
    size: freezeSize({height: 44, width: 44.2}),
  }),
  Mc_Tar_3: Object.freeze({
    center: freezePoint({x: 424.95, y: 215.8}),
    size: freezeSize({height: 44.2, width: 44.2}),
  }),
  Mc_Tar_4: Object.freeze({
    center: freezePoint({x: 348, y: 215.8}),
    size: freezeSize({height: 44.45, width: 44.15}),
  }),
  Mc_Tar_5: Object.freeze({
    center: freezePoint({x: 228, y: 215.8}),
    size: freezeSize({height: 44.2, width: 44.6}),
  }),
  Mc_Tar_6: Object.freeze({
    center: freezePoint({x: 522.3, y: 216}),
    size: freezeSize({height: 44.4, width: 44}),
  }),
});

/**
 * Frame-139 stage geometry from the hash-bound Animate authoring audit. Each
 * coordinate is the source registration center after applying Animation03's
 * root placement (412.4, 283.3). Responsive controls may enlarge hit regions
 * without moving these evidence-bound anchors.
 */
export const COURSE_G04_L03_TI_003_SOURCE_GEOMETRY = Object.freeze({
  stage: Object.freeze({width: 800, height: 600}),
  rootPlacement: freezePoint({x: 412.4, y: 283.3}),
  frameDomain: "sprite-126" as const,
  interactionFrame: 139,
  cleanSourceVisualFrame: 138,
  cards: CARD_GEOMETRY,
  targets: TARGET_GEOMETRY,
  helpBounds: Object.freeze({
    x: 656.15,
    y: 143,
    width: 132.05,
    height: 30.5,
    left: 590.125,
    right: 722.175,
    top: 127.75,
    bottom: 158.25,
  } satisfies CourseG04L03Ti003Bounds),
});

const freezeCard = (
  card: CourseG04L03Ti003Card,
): CourseG04L03Ti003Card => Object.freeze({...card});

export const COURSE_G04_L03_TI_003_CARDS:
  readonly CourseG04L03Ti003Card[] = Object.freeze([
    freezeCard({
      id: "Scr_1",
      valueText: "-10",
      numericValue: -10,
      accessibleLabel: "negative 10",
      sourceCenter: CARD_GEOMETRY.Scr_1.center,
      sourceSize: CARD_GEOMETRY.Scr_1.size,
      targetId: "Mc_Tar_1",
      targetCenter: TARGET_GEOMETRY.Mc_Tar_1.center,
      targetSize: TARGET_GEOMETRY.Mc_Tar_1.size,
    }),
    freezeCard({
      id: "Scr_2",
      valueText: "9",
      numericValue: 9,
      accessibleLabel: "9",
      sourceCenter: CARD_GEOMETRY.Scr_2.center,
      sourceSize: CARD_GEOMETRY.Scr_2.size,
      targetId: "Mc_Tar_2",
      targetCenter: TARGET_GEOMETRY.Mc_Tar_2.center,
      targetSize: TARGET_GEOMETRY.Mc_Tar_2.size,
    }),
    freezeCard({
      id: "Scr_3",
      valueText: "1",
      numericValue: 1,
      accessibleLabel: "1",
      sourceCenter: CARD_GEOMETRY.Scr_3.center,
      sourceSize: CARD_GEOMETRY.Scr_3.size,
      targetId: "Mc_Tar_3",
      targetCenter: TARGET_GEOMETRY.Mc_Tar_3.center,
      targetSize: TARGET_GEOMETRY.Mc_Tar_3.size,
    }),
    freezeCard({
      id: "Scr_4",
      valueText: "-2",
      numericValue: -2,
      accessibleLabel: "negative 2",
      sourceCenter: CARD_GEOMETRY.Scr_4.center,
      sourceSize: CARD_GEOMETRY.Scr_4.size,
      targetId: "Mc_Tar_4",
      targetCenter: TARGET_GEOMETRY.Mc_Tar_4.center,
      targetSize: TARGET_GEOMETRY.Mc_Tar_4.size,
    }),
    freezeCard({
      id: "Scr_5",
      valueText: "-7",
      numericValue: -7,
      accessibleLabel: "negative 7",
      sourceCenter: CARD_GEOMETRY.Scr_5.center,
      sourceSize: CARD_GEOMETRY.Scr_5.size,
      targetId: "Mc_Tar_5",
      targetCenter: TARGET_GEOMETRY.Mc_Tar_5.center,
      targetSize: TARGET_GEOMETRY.Mc_Tar_5.size,
    }),
    freezeCard({
      id: "Scr_6",
      valueText: "5",
      numericValue: 5,
      accessibleLabel: "5",
      sourceCenter: CARD_GEOMETRY.Scr_6.center,
      sourceSize: CARD_GEOMETRY.Scr_6.size,
      targetId: "Mc_Tar_6",
      targetCenter: TARGET_GEOMETRY.Mc_Tar_6.center,
      targetSize: TARGET_GEOMETRY.Mc_Tar_6.size,
    }),
  ]);

export const COURSE_G04_L03_TI_003_INSTRUCTION =
  "Drag and drop each number to its correct position on the number line.";

/** Host-provided source wrong-feedback text is unresolved in this child SWF. */
export const COURSE_G04_L03_TI_003_WRONG_FEEDBACK = "Try again.";

/** Modern screen-reader acknowledgement; no source text parity is claimed. */
export const COURSE_G04_L03_TI_003_CORRECT_FEEDBACK = "Correct.";

/** Exact terminal text found in the FLA authoring structure. */
export const COURSE_G04_L03_TI_003_COMPLETION_FEEDBACK = "Correct!!!";

/**
 * Source Coach_audio_2 re-enables interaction at nested frame 20. This is a
 * current-JS projection of 20 frames at 12 FPS, not an original-runtime trace.
 */
export const COURSE_G04_L03_TI_003_CURRENT_JS_TIMING = Object.freeze({
  correctFeedbackMs: (20 * 1_000) / 12,
});

export const COURSE_G04_L03_TI_003_INTERACTION_AUTHORITY = Object.freeze({
  evidenceBasis:
    "hash-bound-fla-frame-139-instance-transforms-and-swf-avm1-drag-handlers",
  implementationKind: "current-javascript-pure-state-candidate",
  wrongFeedbackTextDisposition: "modern-assistive-not-source-exact",
  wrongFeedbackTextSourceExact: false,
  correctFeedbackTextSourceExact: false,
  correctFeedbackTimerIsOriginalRuntimeTrace: false,
  sourceDragDropExecuted: false,
  sourceHelpHyperlinksExecuted: false,
  embeddedCoachAudioModeled: false,
  associatedAudioModeled: false,
  audioParityEstablished: false,
  hostWrongFeedbackResolved: false,
  hostKeyTermLinksResolved: false,
  hostContinuationParityEstablished: false,
  behaviorParityEstablished: false,
  replayParityEstablished: false,
  ownerAccepted: false,
  strictMigrationComplete: false,
  strictAcceptanceEffect: "none",
});

const createEmptyPlacements = (): CourseG04L03Ti003Placements =>
  Object.freeze({
    Scr_1: null,
    Scr_2: null,
    Scr_3: null,
    Scr_4: null,
    Scr_5: null,
    Scr_6: null,
  });

const freezeState = (
  state: CourseG04L03Ti003NumberLineDragState,
): CourseG04L03Ti003NumberLineDragState => Object.freeze({
  ...state,
  placements: Object.freeze({...state.placements}),
});

const isKnownCardId = (
  cardId: string,
): cardId is CourseG04L03Ti003CardId =>
  COURSE_G04_L03_TI_003_CARDS.some(({id}) => id === cardId);

const isKnownTargetId = (
  targetId: string,
): targetId is CourseG04L03Ti003TargetId =>
  COURSE_G04_L03_TI_003_CARDS.some(({targetId: id}) => id === targetId);

const getCard = (
  cardId: CourseG04L03Ti003CardId,
): CourseG04L03Ti003Card | undefined =>
  COURSE_G04_L03_TI_003_CARDS.find(({id}) => id === cardId);

export const getCourseG04L03Ti003PlacementCount = (
  state: CourseG04L03Ti003NumberLineDragState,
): number => COURSE_G04_L03_TI_003_CARDS.reduce(
  (count, {id}) => count + (state.placements[id] === null ? 0 : 1),
  0,
);

export const createCourseG04L03Ti003NumberLineDragState =
  (): CourseG04L03Ti003NumberLineDragState => freezeState({
    placements: createEmptyPlacements(),
    selectedCardId: null,
    wrongCardId: null,
    lastPlacedCardId: null,
    attemptedTargetId: null,
    outcome: "ready",
    locked: false,
    feedback: null,
  });

export const reduceCourseG04L03Ti003NumberLineDrag = (
  state: CourseG04L03Ti003NumberLineDragState,
  action: CourseG04L03Ti003NumberLineDragAction,
): CourseG04L03Ti003NumberLineDragState => {
  switch (action.type) {
    case "select-card":
      if (
        state.locked
        || !isKnownCardId(action.cardId)
        || state.placements[action.cardId] !== null
        || state.selectedCardId === action.cardId
      ) return state;
      return freezeState({
        ...state,
        selectedCardId: action.cardId,
        wrongCardId: null,
        attemptedTargetId: null,
        feedback: null,
      });

    case "drop-card": {
      if (state.locked) return state;

      const cardId = action.cardId ?? state.selectedCardId;
      if (
        cardId === null
        || !isKnownCardId(cardId)
        || !isKnownTargetId(action.targetId)
        || state.placements[cardId] !== null
      ) return state;

      const card = getCard(cardId);
      if (card === undefined) return state;

      if (card.targetId !== action.targetId) {
        return freezeState({
          ...state,
          selectedCardId: null,
          wrongCardId: cardId,
          lastPlacedCardId: null,
          attemptedTargetId: action.targetId,
          outcome: "wrong",
          locked: true,
          feedback: COURSE_G04_L03_TI_003_WRONG_FEEDBACK,
        });
      }

      return freezeState({
        ...state,
        placements: {
          ...state.placements,
          [cardId]: action.targetId,
        },
        selectedCardId: null,
        wrongCardId: null,
        lastPlacedCardId: cardId,
        attemptedTargetId: action.targetId,
        outcome: "correct-feedback",
        locked: true,
        feedback: COURSE_G04_L03_TI_003_CORRECT_FEEDBACK,
      });
    }

    case "close-wrong":
      if (state.outcome !== "wrong") return state;
      return freezeState({
        ...state,
        selectedCardId: null,
        wrongCardId: null,
        attemptedTargetId: null,
        outcome: "ready",
        locked: false,
        feedback: null,
      });

    case "feedback-complete": {
      if (state.outcome !== "correct-feedback") return state;
      const complete = getCourseG04L03Ti003PlacementCount(state)
        === COURSE_G04_L03_TI_003_CARDS.length;
      return freezeState({
        ...state,
        selectedCardId: null,
        wrongCardId: null,
        attemptedTargetId: null,
        outcome: complete ? "complete" : "ready",
        locked: complete,
        feedback: complete
          ? COURSE_G04_L03_TI_003_COMPLETION_FEEDBACK
          : null,
      });
    }

    case "reset":
    case "replay":
      return createCourseG04L03Ti003NumberLineDragState();
  }
};
