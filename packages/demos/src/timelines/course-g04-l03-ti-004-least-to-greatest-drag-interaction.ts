export type CourseG04L03Ti004CardId =
  | "Scr_1"
  | "Scr_2"
  | "Scr_3"
  | "Scr_4"
  | "Scr_5"
  | "Scr_6"
  | "Scr_7";

export type CourseG04L03Ti004TargetId =
  | "Mc_Tar_1"
  | "Mc_Tar_2"
  | "Mc_Tar_3"
  | "Mc_Tar_4"
  | "Mc_Tar_5"
  | "Mc_Tar_6"
  | "Mc_Tar_7";

export type CourseG04L03Ti004Outcome =
  | "ready"
  | "wrong"
  | "correct-feedback"
  | "complete";

export interface CourseG04L03Ti004Point {
  readonly x: number;
  readonly y: number;
}

export interface CourseG04L03Ti004Size {
  readonly height: number;
  readonly width: number;
}

export interface CourseG04L03Ti004Bounds
  extends CourseG04L03Ti004Point, CourseG04L03Ti004Size {
  readonly bottom: number;
  readonly left: number;
  readonly right: number;
  readonly top: number;
}

export interface CourseG04L03Ti004Card {
  readonly id: CourseG04L03Ti004CardId;
  readonly valueText: "0" | "4" | "-11" | "-1" | "-4" | "-10" | "6";
  readonly numericValue: 0 | 4 | -11 | -1 | -4 | -10 | 6;
  readonly accessibleLabel: string;
  readonly sourceCenter: CourseG04L03Ti004Point;
  readonly sourceSize: CourseG04L03Ti004Size;
  readonly targetId: CourseG04L03Ti004TargetId;
  readonly targetCenter: CourseG04L03Ti004Point;
  readonly targetSize: CourseG04L03Ti004Size;
}

export type CourseG04L03Ti004Placements = Readonly<
  Record<CourseG04L03Ti004CardId, CourseG04L03Ti004TargetId | null>
>;

export interface CourseG04L03Ti004LeastToGreatestDragState {
  readonly placements: CourseG04L03Ti004Placements;
  readonly selectedCardId: CourseG04L03Ti004CardId | null;
  readonly wrongCardId: CourseG04L03Ti004CardId | null;
  readonly lastPlacedCardId: CourseG04L03Ti004CardId | null;
  readonly attemptedTargetId: CourseG04L03Ti004TargetId | null;
  readonly outcome: CourseG04L03Ti004Outcome;
  readonly locked: boolean;
  readonly feedback: string | null;
}

export type CourseG04L03Ti004LeastToGreatestDragAction =
  | Readonly<{
      type: "select-card";
      cardId: CourseG04L03Ti004CardId;
    }>
  | Readonly<{
      type: "drop-card";
      cardId?: CourseG04L03Ti004CardId;
      targetId: CourseG04L03Ti004TargetId;
    }>
  | Readonly<{type: "close-wrong"}>
  | Readonly<{type: "feedback-complete"}>
  | Readonly<{type: "reset"}>
  | Readonly<{type: "replay"}>;

const freezePoint = (
  point: CourseG04L03Ti004Point,
): CourseG04L03Ti004Point => Object.freeze({...point});

const freezeSize = (
  size: CourseG04L03Ti004Size,
): CourseG04L03Ti004Size => Object.freeze({...size});

const CARD_GEOMETRY = Object.freeze({
  Scr_1: Object.freeze({
    center: freezePoint({x: 174.65, y: 336.95}),
    size: freezeSize({height: 44.1, width: 44.1}),
  }),
  Scr_2: Object.freeze({
    center: freezePoint({x: 244.5, y: 336.95}),
    size: freezeSize({height: 44.1, width: 44.1}),
  }),
  Scr_3: Object.freeze({
    center: freezePoint({x: 314.4, y: 336.95}),
    size: freezeSize({height: 44.1, width: 44.1}),
  }),
  Scr_4: Object.freeze({
    center: freezePoint({x: 384.4, y: 336.95}),
    size: freezeSize({height: 44.1, width: 44.1}),
  }),
  Scr_5: Object.freeze({
    center: freezePoint({x: 454.4, y: 336.95}),
    size: freezeSize({height: 44.1, width: 44.1}),
  }),
  Scr_6: Object.freeze({
    center: freezePoint({x: 524.45, y: 336.95}),
    size: freezeSize({height: 44.1, width: 44.1}),
  }),
  Scr_7: Object.freeze({
    center: freezePoint({x: 594.3, y: 336.95}),
    size: freezeSize({height: 44.1, width: 44.1}),
  }),
});

const TARGET_GEOMETRY = Object.freeze({
  Mc_Tar_1: Object.freeze({
    center: freezePoint({x: 454.1, y: 235.95}),
    size: freezeSize({height: 43.75, width: 43.75}),
  }),
  Mc_Tar_2: Object.freeze({
    center: freezePoint({x: 525.1, y: 235.95}),
    size: freezeSize({height: 44, width: 44.5}),
  }),
  Mc_Tar_3: Object.freeze({
    center: freezePoint({x: 174.6, y: 235.95}),
    size: freezeSize({height: 44, width: 43.75}),
  }),
  Mc_Tar_4: Object.freeze({
    center: freezePoint({x: 384.6, y: 235.95}),
    size: freezeSize({height: 43.75, width: 44.25}),
  }),
  Mc_Tar_5: Object.freeze({
    center: freezePoint({x: 315.1, y: 235.95}),
    size: freezeSize({height: 44.5, width: 44}),
  }),
  Mc_Tar_6: Object.freeze({
    center: freezePoint({x: 244.1, y: 235.95}),
    size: freezeSize({height: 44, width: 44.2}),
  }),
  Mc_Tar_7: Object.freeze({
    center: freezePoint({x: 594.6, y: 235.95}),
    size: freezeSize({height: 44.75, width: 44.1}),
  }),
});

/**
 * Frame-124 stage geometry from the hash-bound Animate authoring audit. Each
 * coordinate is the source registration center after applying Animation03's
 * root placement (412.4, 283.3). Responsive controls may enlarge hit regions
 * without moving these evidence-bound anchors.
 */
export const COURSE_G04_L03_TI_004_SOURCE_GEOMETRY = Object.freeze({
  stage: Object.freeze({width: 800, height: 600}),
  rootPlacement: freezePoint({x: 412.4, y: 283.3}),
  frameDomain: "sprite-274" as const,
  interactionFrame: 124,
  cleanSourceVisualFrame: 122,
  cards: CARD_GEOMETRY,
  targets: TARGET_GEOMETRY,
  helpBounds: Object.freeze({
    x: 656.15,
    y: 169,
    width: 132.05,
    height: 30.5,
    left: 590.125,
    right: 722.175,
    top: 153.75,
    bottom: 184.25,
  } satisfies CourseG04L03Ti004Bounds),
});

const freezeCard = (
  card: CourseG04L03Ti004Card,
): CourseG04L03Ti004Card => Object.freeze({...card});

export const COURSE_G04_L03_TI_004_CARDS:
  readonly CourseG04L03Ti004Card[] = Object.freeze([
    freezeCard({
      id: "Scr_1",
      valueText: "0",
      numericValue: 0,
      accessibleLabel: "0",
      sourceCenter: CARD_GEOMETRY.Scr_1.center,
      sourceSize: CARD_GEOMETRY.Scr_1.size,
      targetId: "Mc_Tar_1",
      targetCenter: TARGET_GEOMETRY.Mc_Tar_1.center,
      targetSize: TARGET_GEOMETRY.Mc_Tar_1.size,
    }),
    freezeCard({
      id: "Scr_2",
      valueText: "4",
      numericValue: 4,
      accessibleLabel: "4",
      sourceCenter: CARD_GEOMETRY.Scr_2.center,
      sourceSize: CARD_GEOMETRY.Scr_2.size,
      targetId: "Mc_Tar_2",
      targetCenter: TARGET_GEOMETRY.Mc_Tar_2.center,
      targetSize: TARGET_GEOMETRY.Mc_Tar_2.size,
    }),
    freezeCard({
      id: "Scr_3",
      valueText: "-11",
      numericValue: -11,
      accessibleLabel: "negative 11",
      sourceCenter: CARD_GEOMETRY.Scr_3.center,
      sourceSize: CARD_GEOMETRY.Scr_3.size,
      targetId: "Mc_Tar_3",
      targetCenter: TARGET_GEOMETRY.Mc_Tar_3.center,
      targetSize: TARGET_GEOMETRY.Mc_Tar_3.size,
    }),
    freezeCard({
      id: "Scr_4",
      valueText: "-1",
      numericValue: -1,
      accessibleLabel: "negative 1",
      sourceCenter: CARD_GEOMETRY.Scr_4.center,
      sourceSize: CARD_GEOMETRY.Scr_4.size,
      targetId: "Mc_Tar_4",
      targetCenter: TARGET_GEOMETRY.Mc_Tar_4.center,
      targetSize: TARGET_GEOMETRY.Mc_Tar_4.size,
    }),
    freezeCard({
      id: "Scr_5",
      valueText: "-4",
      numericValue: -4,
      accessibleLabel: "negative 4",
      sourceCenter: CARD_GEOMETRY.Scr_5.center,
      sourceSize: CARD_GEOMETRY.Scr_5.size,
      targetId: "Mc_Tar_5",
      targetCenter: TARGET_GEOMETRY.Mc_Tar_5.center,
      targetSize: TARGET_GEOMETRY.Mc_Tar_5.size,
    }),
    freezeCard({
      id: "Scr_6",
      valueText: "-10",
      numericValue: -10,
      accessibleLabel: "negative 10",
      sourceCenter: CARD_GEOMETRY.Scr_6.center,
      sourceSize: CARD_GEOMETRY.Scr_6.size,
      targetId: "Mc_Tar_6",
      targetCenter: TARGET_GEOMETRY.Mc_Tar_6.center,
      targetSize: TARGET_GEOMETRY.Mc_Tar_6.size,
    }),
    freezeCard({
      id: "Scr_7",
      valueText: "6",
      numericValue: 6,
      accessibleLabel: "6",
      sourceCenter: CARD_GEOMETRY.Scr_7.center,
      sourceSize: CARD_GEOMETRY.Scr_7.size,
      targetId: "Mc_Tar_7",
      targetCenter: TARGET_GEOMETRY.Mc_Tar_7.center,
      targetSize: TARGET_GEOMETRY.Mc_Tar_7.size,
    }),
  ]);

export const COURSE_G04_L03_TI_004_INSTRUCTION =
  "Drag and drop each number so that the numbers are in order from least to greatest.";

/** Host-provided source wrong-feedback text is unresolved in this child SWF. */
export const COURSE_G04_L03_TI_004_WRONG_FEEDBACK = "Try again.";

/** Modern screen-reader acknowledgement; no source text parity is claimed. */
export const COURSE_G04_L03_TI_004_CORRECT_FEEDBACK = "Correct.";

/** Exact terminal text found in the FLA authoring structure. */
export const COURSE_G04_L03_TI_004_COMPLETION_FEEDBACK = "Correct!!!";

/**
 * Source Coach frame 2 reaches its frame-20 re-enable beat after 19 frame
 * intervals. This is a current-JS projection, not an original-runtime trace.
 */
export const COURSE_G04_L03_TI_004_CURRENT_JS_TIMING = Object.freeze({
  correctFeedbackMs: (19 * 1_000) / 12,
});

export const COURSE_G04_L03_TI_004_INTERACTION_AUTHORITY = Object.freeze({
  evidenceBasis:
    "hash-bound-fla-frame-124-instance-transforms-and-swf-avm1-drag-handlers",
  implementationKind: "current-javascript-pure-state-candidate",
  wrongFeedbackTextDisposition: "modern-assistive-not-source-exact",
  helpCardLockingDisposition:
    "current-javascript-safety-lock-not-original-runtime-trace",
  wrongFeedbackTextSourceExact: false,
  correctFeedbackTextSourceExact: false,
  correctFeedbackTimerIsOriginalRuntimeTrace: false,
  helpCardLockingIsOriginalRuntimeTrace: false,
  sourceDragDropExecuted: false,
  sourceHelpBehaviorExecuted: false,
  sourceHelpHyperlinksExecuted: false,
  sourceRandomExecuted: false,
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

const createEmptyPlacements = (): CourseG04L03Ti004Placements =>
  Object.freeze({
    Scr_1: null,
    Scr_2: null,
    Scr_3: null,
    Scr_4: null,
    Scr_5: null,
    Scr_6: null,
    Scr_7: null,
  });

const freezeState = (
  state: CourseG04L03Ti004LeastToGreatestDragState,
): CourseG04L03Ti004LeastToGreatestDragState => Object.freeze({
  ...state,
  placements: Object.freeze({...state.placements}),
});

const isKnownCardId = (
  cardId: string,
): cardId is CourseG04L03Ti004CardId =>
  COURSE_G04_L03_TI_004_CARDS.some(({id}) => id === cardId);

const isKnownTargetId = (
  targetId: string,
): targetId is CourseG04L03Ti004TargetId =>
  COURSE_G04_L03_TI_004_CARDS.some(({targetId: id}) => id === targetId);

const getCard = (
  cardId: CourseG04L03Ti004CardId,
): CourseG04L03Ti004Card | undefined =>
  COURSE_G04_L03_TI_004_CARDS.find(({id}) => id === cardId);

export const getCourseG04L03Ti004PlacementCount = (
  state: CourseG04L03Ti004LeastToGreatestDragState,
): number => COURSE_G04_L03_TI_004_CARDS.reduce(
  (count, {id}) => count + (state.placements[id] === null ? 0 : 1),
  0,
);

export const createCourseG04L03Ti004LeastToGreatestDragState =
  (): CourseG04L03Ti004LeastToGreatestDragState => freezeState({
    placements: createEmptyPlacements(),
    selectedCardId: null,
    wrongCardId: null,
    lastPlacedCardId: null,
    attemptedTargetId: null,
    outcome: "ready",
    locked: false,
    feedback: null,
  });

export const reduceCourseG04L03Ti004LeastToGreatestDrag = (
  state: CourseG04L03Ti004LeastToGreatestDragState,
  action: CourseG04L03Ti004LeastToGreatestDragAction,
): CourseG04L03Ti004LeastToGreatestDragState => {
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
          feedback: COURSE_G04_L03_TI_004_WRONG_FEEDBACK,
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
        feedback: COURSE_G04_L03_TI_004_CORRECT_FEEDBACK,
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
      const complete = getCourseG04L03Ti004PlacementCount(state)
        === COURSE_G04_L03_TI_004_CARDS.length;
      return freezeState({
        ...state,
        selectedCardId: null,
        wrongCardId: null,
        attemptedTargetId: null,
        outcome: complete ? "complete" : "ready",
        locked: complete,
        feedback: complete
          ? COURSE_G04_L03_TI_004_COMPLETION_FEEDBACK
          : null,
      });
    }

    case "reset":
    case "replay":
      return createCourseG04L03Ti004LeastToGreatestDragState();
  }
};
