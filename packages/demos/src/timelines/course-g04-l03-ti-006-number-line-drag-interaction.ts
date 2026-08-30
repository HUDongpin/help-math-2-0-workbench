export type CourseG04L03Ti006CardId =
  | "Scr_1"
  | "Scr_2"
  | "Scr_3"
  | "Scr_4"
  | "Scr_5";

export type CourseG04L03Ti006TargetId =
  | "Mc_Tar_1"
  | "Mc_Tar_2"
  | "Mc_Tar_3"
  | "Mc_Tar_4"
  | "Mc_Tar_5";

export type CourseG04L03Ti006Outcome =
  | "ready"
  | "wrong"
  | "correct-feedback"
  | "complete";

export interface CourseG04L03Ti006Point {
  readonly x: number;
  readonly y: number;
}

export interface CourseG04L03Ti006Size {
  readonly height: number;
  readonly width: number;
}

export interface CourseG04L03Ti006Bounds
  extends CourseG04L03Ti006Point, CourseG04L03Ti006Size {
  readonly bottom: number;
  readonly left: number;
  readonly right: number;
  readonly top: number;
}

export interface CourseG04L03Ti006Card {
  readonly id: CourseG04L03Ti006CardId;
  readonly name: "Sapna" | "Alex" | "Lola" | "Nestor" | "Sue";
  readonly relationship: "Has" | "Owes";
  readonly amountText: "$3" | "$5" | "$6" | "$8";
  readonly numericValue: -6 | -3 | 3 | 5 | 8;
  readonly sourceText: string;
  readonly accessibleLabel: string;
  readonly sourceCenter: CourseG04L03Ti006Point;
  readonly sourceSize: CourseG04L03Ti006Size;
  readonly targetId: CourseG04L03Ti006TargetId;
  readonly targetCenter: CourseG04L03Ti006Point;
  readonly targetSize: CourseG04L03Ti006Size;
}

export type CourseG04L03Ti006Placements = Readonly<
  Record<CourseG04L03Ti006CardId, CourseG04L03Ti006TargetId | null>
>;

export interface CourseG04L03Ti006NumberLineDragState {
  readonly placements: CourseG04L03Ti006Placements;
  readonly selectedCardId: CourseG04L03Ti006CardId | null;
  readonly wrongCardId: CourseG04L03Ti006CardId | null;
  readonly lastPlacedCardId: CourseG04L03Ti006CardId | null;
  readonly attemptedTargetId: CourseG04L03Ti006TargetId | null;
  readonly outcome: CourseG04L03Ti006Outcome;
  readonly locked: boolean;
  readonly feedback: string | null;
}

export type CourseG04L03Ti006NumberLineDragAction =
  | Readonly<{
      type: "select-card";
      cardId: CourseG04L03Ti006CardId;
    }>
  | Readonly<{
      type: "drop-card";
      cardId?: CourseG04L03Ti006CardId;
      targetId: CourseG04L03Ti006TargetId;
    }>
  | Readonly<{type: "close-wrong"}>
  | Readonly<{type: "feedback-complete"}>
  | Readonly<{type: "reset"}>
  | Readonly<{type: "replay"}>;

const freezePoint = (
  point: CourseG04L03Ti006Point,
): CourseG04L03Ti006Point => Object.freeze({...point});

const freezeSize = (
  size: CourseG04L03Ti006Size,
): CourseG04L03Ti006Size => Object.freeze({...size});

const CARD_GEOMETRY = Object.freeze({
  Scr_1: Object.freeze({
    center: freezePoint({x: 184.3, y: 370.65}),
    size: freezeSize({height: 52.45, width: 44.5}),
  }),
  Scr_2: Object.freeze({
    center: freezePoint({x: 290.6, y: 370.65}),
    size: freezeSize({height: 53.4, width: 43.7}),
  }),
  Scr_3: Object.freeze({
    center: freezePoint({x: 402.5, y: 370.65}),
    size: freezeSize({height: 53.4, width: 32.9}),
  }),
  Scr_4: Object.freeze({
    center: freezePoint({x: 507.95, y: 371.65}),
    size: freezeSize({height: 51.95, width: 45.3}),
  }),
  Scr_5: Object.freeze({
    center: freezePoint({x: 615.05, y: 369.15}),
    size: freezeSize({height: 52.4, width: 32.9}),
  }),
});

const TARGET_GEOMETRY = Object.freeze({
  Mc_Tar_1: Object.freeze({
    center: freezePoint({x: 581.5, y: 241.05}),
    size: freezeSize({height: 74, width: 50}),
  }),
  Mc_Tar_2: Object.freeze({
    center: freezePoint({x: 191.5, y: 241.05}),
    size: freezeSize({height: 73.25, width: 49.25}),
  }),
  Mc_Tar_3: Object.freeze({
    center: freezePoint({x: 693.5, y: 241.05}),
    size: freezeSize({height: 74.4, width: 49.8}),
  }),
  Mc_Tar_4: Object.freeze({
    center: freezePoint({x: 292.5, y: 241.05}),
    size: freezeSize({height: 74, width: 48.8}),
  }),
  Mc_Tar_5: Object.freeze({
    center: freezePoint({x: 512.5, y: 241.05}),
    size: freezeSize({height: 74.4, width: 50.2}),
  }),
});

/**
 * Frame-166 stage geometry from the hash-bound Animate authoring audit. Each
 * card and target coordinate is its source registration center after applying
 * Animation03's root placement (412.4, 283.3). The Help bounds are derived
 * from NMHBtn's source center and size; responsive controls may enlarge their
 * hit regions without moving these source anchors.
 */
export const COURSE_G04_L03_TI_006_SOURCE_GEOMETRY = Object.freeze({
  stage: Object.freeze({width: 800, height: 600}),
  rootPlacement: freezePoint({x: 412.4, y: 283.3}),
  frameDomain: "sprite-269" as const,
  interactionFrame: 166,
  cards: CARD_GEOMETRY,
  targets: TARGET_GEOMETRY,
  helpBounds: Object.freeze({
    x: 665.65,
    y: 174.7,
    width: 132.05,
    height: 30.5,
    left: 599.625,
    right: 731.675,
    top: 159.45,
    bottom: 189.95,
  } satisfies CourseG04L03Ti006Bounds),
});

const freezeCard = (
  card: CourseG04L03Ti006Card,
): CourseG04L03Ti006Card => Object.freeze({...card});

export const COURSE_G04_L03_TI_006_CARDS:
  readonly CourseG04L03Ti006Card[] = Object.freeze([
    freezeCard({
      id: "Scr_1",
      name: "Sapna",
      relationship: "Has",
      amountText: "$5",
      numericValue: 5,
      sourceText: "Sapna\rHas \r$5",
      accessibleLabel: "Sapna Has $5",
      sourceCenter: CARD_GEOMETRY.Scr_1.center,
      sourceSize: CARD_GEOMETRY.Scr_1.size,
      targetId: "Mc_Tar_1",
      targetCenter: TARGET_GEOMETRY.Mc_Tar_1.center,
      targetSize: TARGET_GEOMETRY.Mc_Tar_1.size,
    }),
    freezeCard({
      id: "Scr_2",
      name: "Alex",
      relationship: "Owes",
      amountText: "$6",
      numericValue: -6,
      sourceText: "Alex\rOwes \r$6",
      accessibleLabel: "Alex Owes $6",
      sourceCenter: CARD_GEOMETRY.Scr_2.center,
      sourceSize: CARD_GEOMETRY.Scr_2.size,
      targetId: "Mc_Tar_2",
      targetCenter: TARGET_GEOMETRY.Mc_Tar_2.center,
      targetSize: TARGET_GEOMETRY.Mc_Tar_2.size,
    }),
    freezeCard({
      id: "Scr_3",
      name: "Lola",
      relationship: "Has",
      amountText: "$8",
      numericValue: 8,
      sourceText: "Lola\rHas \r$8",
      accessibleLabel: "Lola Has $8",
      sourceCenter: CARD_GEOMETRY.Scr_3.center,
      sourceSize: CARD_GEOMETRY.Scr_3.size,
      targetId: "Mc_Tar_3",
      targetCenter: TARGET_GEOMETRY.Mc_Tar_3.center,
      targetSize: TARGET_GEOMETRY.Mc_Tar_3.size,
    }),
    freezeCard({
      id: "Scr_4",
      name: "Nestor",
      relationship: "Owes",
      amountText: "$3",
      numericValue: -3,
      sourceText: "Nestor\rOwes \r$3",
      accessibleLabel: "Nestor Owes $3",
      sourceCenter: CARD_GEOMETRY.Scr_4.center,
      sourceSize: CARD_GEOMETRY.Scr_4.size,
      targetId: "Mc_Tar_4",
      targetCenter: TARGET_GEOMETRY.Mc_Tar_4.center,
      targetSize: TARGET_GEOMETRY.Mc_Tar_4.size,
    }),
    freezeCard({
      id: "Scr_5",
      name: "Sue",
      relationship: "Has",
      amountText: "$3",
      numericValue: 3,
      sourceText: "Sue\rHas \r$3",
      accessibleLabel: "Sue Has $3",
      sourceCenter: CARD_GEOMETRY.Scr_5.center,
      sourceSize: CARD_GEOMETRY.Scr_5.size,
      targetId: "Mc_Tar_5",
      targetCenter: TARGET_GEOMETRY.Mc_Tar_5.center,
      targetSize: TARGET_GEOMETRY.Mc_Tar_5.size,
    }),
  ]);

export const COURSE_G04_L03_TI_006_INSTRUCTION =
  "Drag and drop each person’s card to the correct position on the number line based on the amount of money each one has or owes.";

/** Host-provided source wrong-feedback text is unresolved in this child SWF. */
export const COURSE_G04_L03_TI_006_WRONG_FEEDBACK = "Try again.";

/** Modern screen-reader acknowledgement; no source text parity is claimed. */
export const COURSE_G04_L03_TI_006_CORRECT_FEEDBACK = "Correct.";

/** Exact terminal text found in the FLA's Symbol 21 authoring structure. */
export const COURSE_G04_L03_TI_006_COMPLETION_FEEDBACK = "Correct!!!";

/**
 * Source Coach_audio_2a re-enables interaction at nested frame 20. This is a
 * current-JS projection of 19 frames at 12 FPS, not an original-runtime trace.
 */
export const COURSE_G04_L03_TI_006_CURRENT_JS_TIMING = Object.freeze({
  correctFeedbackMs: (19 * 1_000) / 12,
});

export const COURSE_G04_L03_TI_006_INTERACTION_AUTHORITY = Object.freeze({
  evidenceBasis:
    "hash-bound-fla-frame-166-instance-transforms-and-swf-avm1-drag-handlers",
  implementationKind: "current-javascript-pure-state-candidate",
  wrongFeedbackTextDisposition: "modern-assistive-not-source-exact",
  wrongFeedbackTextSourceExact: false,
  correctFeedbackTextSourceExact: false,
  correctFeedbackTimerIsOriginalRuntimeTrace: false,
  sourceDragDropExecuted: false,
  sourceRandomExecuted: false,
  embeddedCoachAudioModeled: false,
  associatedAudioModeled: false,
  audioParityEstablished: false,
  hostWrongFeedbackResolved: false,
  hostContinuationParityEstablished: false,
  behaviorParityEstablished: false,
  replayParityEstablished: false,
  ownerAccepted: false,
  strictMigrationComplete: false,
  strictAcceptanceEffect: "none",
});

const createEmptyPlacements = (): CourseG04L03Ti006Placements =>
  Object.freeze({
    Scr_1: null,
    Scr_2: null,
    Scr_3: null,
    Scr_4: null,
    Scr_5: null,
  });

const freezeState = (
  state: CourseG04L03Ti006NumberLineDragState,
): CourseG04L03Ti006NumberLineDragState => Object.freeze({
  ...state,
  placements: Object.freeze({...state.placements}),
});

const isKnownCardId = (
  cardId: string,
): cardId is CourseG04L03Ti006CardId =>
  COURSE_G04_L03_TI_006_CARDS.some(({id}) => id === cardId);

const isKnownTargetId = (
  targetId: string,
): targetId is CourseG04L03Ti006TargetId =>
  COURSE_G04_L03_TI_006_CARDS.some(({targetId: id}) => id === targetId);

const getCard = (
  cardId: CourseG04L03Ti006CardId,
): CourseG04L03Ti006Card | undefined =>
  COURSE_G04_L03_TI_006_CARDS.find(({id}) => id === cardId);

export const getCourseG04L03Ti006PlacementCount = (
  state: CourseG04L03Ti006NumberLineDragState,
): number => COURSE_G04_L03_TI_006_CARDS.reduce(
  (count, {id}) => count + (state.placements[id] === null ? 0 : 1),
  0,
);

export const createCourseG04L03Ti006NumberLineDragState =
  (): CourseG04L03Ti006NumberLineDragState => freezeState({
    placements: createEmptyPlacements(),
    selectedCardId: null,
    wrongCardId: null,
    lastPlacedCardId: null,
    attemptedTargetId: null,
    outcome: "ready",
    locked: false,
    feedback: null,
  });

export const reduceCourseG04L03Ti006NumberLineDrag = (
  state: CourseG04L03Ti006NumberLineDragState,
  action: CourseG04L03Ti006NumberLineDragAction,
): CourseG04L03Ti006NumberLineDragState => {
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
          feedback: COURSE_G04_L03_TI_006_WRONG_FEEDBACK,
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
        feedback: COURSE_G04_L03_TI_006_CORRECT_FEEDBACK,
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
      const complete = getCourseG04L03Ti006PlacementCount(state)
        === COURSE_G04_L03_TI_006_CARDS.length;
      return freezeState({
        ...state,
        selectedCardId: null,
        wrongCardId: null,
        attemptedTargetId: null,
        outcome: complete ? "complete" : "ready",
        locked: complete,
        feedback: complete
          ? COURSE_G04_L03_TI_006_COMPLETION_FEEDBACK
          : null,
      });
    }

    case "reset":
    case "replay":
      return createCourseG04L03Ti006NumberLineDragState();
  }
};
