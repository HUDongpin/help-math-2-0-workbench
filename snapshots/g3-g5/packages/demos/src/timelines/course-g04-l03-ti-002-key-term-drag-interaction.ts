export type CourseG04L03Ti002CardId =
  | "Scr_1"
  | "Scr_2"
  | "Scr_3"
  | "Scr_4"
  | "Scr_5";

export type CourseG04L03Ti002TargetId =
  | "Mc_Tar_1"
  | "Mc_Tar_2"
  | "Mc_Tar_3"
  | "Mc_Tar_4"
  | "Mc_Tar_5";

export type CourseG04L03Ti002Outcome =
  | "ready"
  | "wrong"
  | "correct-feedback"
  | "complete";

export interface CourseG04L03Ti002Point {
  readonly x: number;
  readonly y: number;
}

export interface CourseG04L03Ti002Size {
  readonly height: number;
  readonly width: number;
}

export interface CourseG04L03Ti002Card {
  readonly id: CourseG04L03Ti002CardId;
  readonly term:
    | "number line"
    | "zero"
    | "decrease"
    | "negative"
    | "positive";
  readonly definition: string;
  readonly pictureKind:
    | "decrease"
    | "negative"
    | "number-line"
    | "positive"
    | "zero";
  readonly sourceText: string;
  readonly accessibleLabel: string;
  readonly sourceCenter: CourseG04L03Ti002Point;
  readonly sourceSize: CourseG04L03Ti002Size;
  readonly targetId: CourseG04L03Ti002TargetId;
  readonly targetCenter: CourseG04L03Ti002Point;
  readonly targetSize: CourseG04L03Ti002Size;
  readonly pictureCenter: CourseG04L03Ti002Point;
  readonly pictureSize: CourseG04L03Ti002Size;
}

export type CourseG04L03Ti002Placements = Readonly<
  Record<CourseG04L03Ti002CardId, CourseG04L03Ti002TargetId | null>
>;

export interface CourseG04L03Ti002KeyTermDragState {
  readonly placements: CourseG04L03Ti002Placements;
  readonly selectedCardId: CourseG04L03Ti002CardId | null;
  readonly wrongCardId: CourseG04L03Ti002CardId | null;
  readonly lastPlacedCardId: CourseG04L03Ti002CardId | null;
  readonly attemptedTargetId: CourseG04L03Ti002TargetId | null;
  readonly outcome: CourseG04L03Ti002Outcome;
  readonly locked: boolean;
  readonly feedback: string | null;
}

export type CourseG04L03Ti002KeyTermDragAction =
  | Readonly<{
      type: "select-card";
      cardId: CourseG04L03Ti002CardId;
    }>
  | Readonly<{
      type: "drop-card";
      cardId?: CourseG04L03Ti002CardId;
      targetId: CourseG04L03Ti002TargetId;
    }>
  | Readonly<{type: "close-wrong"}>
  | Readonly<{type: "feedback-complete"}>
  | Readonly<{type: "reset"}>
  | Readonly<{type: "replay"}>;

const freezePoint = (
  point: CourseG04L03Ti002Point,
): CourseG04L03Ti002Point => Object.freeze({...point});

const freezeSize = (
  size: CourseG04L03Ti002Size,
): CourseG04L03Ti002Size => Object.freeze({...size});

const CARD_GEOMETRY = Object.freeze({
  Scr_1: Object.freeze({
    center: freezePoint({x: 106.45, y: 206.7}),
    size: freezeSize({height: 23.15, width: 98.2}),
  }),
  Scr_2: Object.freeze({
    center: freezePoint({x: 78.25, y: 264.75}),
    size: freezeSize({height: 22, width: 39.3}),
  }),
  Scr_3: Object.freeze({
    center: freezePoint({x: 96.8, y: 322.8}),
    size: freezeSize({height: 23.55, width: 78.35}),
  }),
  Scr_4: Object.freeze({
    center: freezePoint({x: 94.95, y: 377.4}),
    size: freezeSize({height: 23.5, width: 72.15}),
  }),
  Scr_5: Object.freeze({
    center: freezePoint({x: 91.05, y: 437.1}),
    size: freezeSize({height: 26.85, width: 69}),
  }),
});

const TARGET_GEOMETRY = Object.freeze({
  Mc_Tar_1: Object.freeze({
    center: freezePoint({x: 206.05, y: 321}),
    size: freezeSize({height: 56.5, width: 108.25}),
  }),
  Mc_Tar_2: Object.freeze({
    center: freezePoint({x: 206.05, y: 439.7}),
    size: freezeSize({height: 80, width: 108}),
  }),
  Mc_Tar_3: Object.freeze({
    center: freezePoint({x: 206.05, y: 212.2}),
    size: freezeSize({height: 63.25, width: 108}),
  }),
  Mc_Tar_4: Object.freeze({
    center: freezePoint({x: 206.15, y: 266.4}),
    size: freezeSize({height: 53.55, width: 108.35}),
  }),
  Mc_Tar_5: Object.freeze({
    center: freezePoint({x: 206.9, y: 374.5}),
    size: freezeSize({height: 50.35, width: 108.35}),
  }),
});

const PICTURE_TARGET_GEOMETRY = Object.freeze({
  Scr_1: Object.freeze({
    center: freezePoint({x: 628.65, y: 319.55}),
    size: freezeSize({height: 55.6, width: 275.95}),
  }),
  Scr_2: Object.freeze({
    center: freezePoint({x: 629.5, y: 438.2}),
    size: freezeSize({height: 75.5, width: 275.95}),
  }),
  Scr_3: Object.freeze({
    center: freezePoint({x: 628.45, y: 206.65}),
    size: freezeSize({height: 63.3, width: 271.8}),
  }),
  Scr_4: Object.freeze({
    center: freezePoint({x: 628.45, y: 265.9}),
    size: freezeSize({height: 54.2, width: 275.95}),
  }),
  Scr_5: Object.freeze({
    center: freezePoint({x: 628.65, y: 374.85}),
    size: freezeSize({height: 48.5, width: 275.95}),
  }),
});

/**
 * Frame-238 stage geometry from the hash-bound Animate authoring audit. Each
 * coordinate is the source registration center after applying Animation03's
 * root placement (412.4, 283.3). Responsive controls may enlarge hit regions
 * without moving these evidence-bound anchors.
 */
export const COURSE_G04_L03_TI_002_SOURCE_GEOMETRY = Object.freeze({
  stage: Object.freeze({width: 800, height: 600}),
  rootPlacement: freezePoint({x: 412.4, y: 283.3}),
  frameDomain: "sprite-272" as const,
  interactionFrame: 238,
  cards: CARD_GEOMETRY,
  targets: TARGET_GEOMETRY,
  pictureTargets: PICTURE_TARGET_GEOMETRY,
});

const freezeCard = (
  card: CourseG04L03Ti002Card,
): CourseG04L03Ti002Card => Object.freeze({...card});

export const COURSE_G04_L03_TI_002_CARDS:
  readonly CourseG04L03Ti002Card[] = Object.freeze([
    freezeCard({
      id: "Scr_1",
      term: "number line",
      definition: "a line for ordering numbers by their value",
      pictureKind: "number-line",
      sourceText: "number line",
      accessibleLabel: "number line",
      sourceCenter: CARD_GEOMETRY.Scr_1.center,
      sourceSize: CARD_GEOMETRY.Scr_1.size,
      targetId: "Mc_Tar_1",
      targetCenter: TARGET_GEOMETRY.Mc_Tar_1.center,
      targetSize: TARGET_GEOMETRY.Mc_Tar_1.size,
      pictureCenter: PICTURE_TARGET_GEOMETRY.Scr_1.center,
      pictureSize: PICTURE_TARGET_GEOMETRY.Scr_1.size,
    }),
    freezeCard({
      id: "Scr_2",
      term: "zero",
      definition:
        "the number that has no value; zero is neither negative nor positive",
      pictureKind: "zero",
      sourceText: "zero",
      accessibleLabel: "zero",
      sourceCenter: CARD_GEOMETRY.Scr_2.center,
      sourceSize: CARD_GEOMETRY.Scr_2.size,
      targetId: "Mc_Tar_2",
      targetCenter: TARGET_GEOMETRY.Mc_Tar_2.center,
      targetSize: TARGET_GEOMETRY.Mc_Tar_2.size,
      pictureCenter: PICTURE_TARGET_GEOMETRY.Scr_2.center,
      pictureSize: PICTURE_TARGET_GEOMETRY.Scr_2.size,
    }),
    freezeCard({
      id: "Scr_3",
      term: "decrease",
      definition: "to get smaller in size or in value",
      pictureKind: "decrease",
      sourceText: "decrease",
      accessibleLabel: "decrease",
      sourceCenter: CARD_GEOMETRY.Scr_3.center,
      sourceSize: CARD_GEOMETRY.Scr_3.size,
      targetId: "Mc_Tar_3",
      targetCenter: TARGET_GEOMETRY.Mc_Tar_3.center,
      targetSize: TARGET_GEOMETRY.Mc_Tar_3.size,
      pictureCenter: PICTURE_TARGET_GEOMETRY.Scr_3.center,
      pictureSize: PICTURE_TARGET_GEOMETRY.Scr_3.size,
    }),
    freezeCard({
      id: "Scr_4",
      term: "negative",
      definition: "being less than zero",
      pictureKind: "negative",
      sourceText: "negative",
      accessibleLabel: "negative",
      sourceCenter: CARD_GEOMETRY.Scr_4.center,
      sourceSize: CARD_GEOMETRY.Scr_4.size,
      targetId: "Mc_Tar_4",
      targetCenter: TARGET_GEOMETRY.Mc_Tar_4.center,
      targetSize: TARGET_GEOMETRY.Mc_Tar_4.size,
      pictureCenter: PICTURE_TARGET_GEOMETRY.Scr_4.center,
      pictureSize: PICTURE_TARGET_GEOMETRY.Scr_4.size,
    }),
    freezeCard({
      id: "Scr_5",
      term: "positive",
      definition: "being greater than zero",
      pictureKind: "positive",
      sourceText: "positive",
      accessibleLabel: "positive",
      sourceCenter: CARD_GEOMETRY.Scr_5.center,
      sourceSize: CARD_GEOMETRY.Scr_5.size,
      targetId: "Mc_Tar_5",
      targetCenter: TARGET_GEOMETRY.Mc_Tar_5.center,
      targetSize: TARGET_GEOMETRY.Mc_Tar_5.size,
      pictureCenter: PICTURE_TARGET_GEOMETRY.Scr_5.center,
      pictureSize: PICTURE_TARGET_GEOMETRY.Scr_5.size,
    }),
  ]);

export const COURSE_G04_L03_TI_002_INSTRUCTION =
  "Match the key terms with the correct definitions and pictures. Click and drag the key terms to place them where they belong.";

/** Host-provided source wrong-feedback text is unresolved in this child SWF. */
export const COURSE_G04_L03_TI_002_WRONG_FEEDBACK = "Try again.";

/** Modern screen-reader acknowledgement; no source text parity is claimed. */
export const COURSE_G04_L03_TI_002_CORRECT_FEEDBACK = "Correct.";

/** Exact terminal text found in the FLA authoring structure. */
export const COURSE_G04_L03_TI_002_COMPLETION_FEEDBACK = "Correct!!!";

/**
 * Source correct feedback reaches its frame-20 re-enable beat after 19 frame
 * intervals. This is a current-JS projection, not an original-runtime trace.
 */
export const COURSE_G04_L03_TI_002_CURRENT_JS_TIMING = Object.freeze({
  correctFeedbackMs: (19 * 1_000) / 12,
});

export const COURSE_G04_L03_TI_002_INTERACTION_AUTHORITY = Object.freeze({
  evidenceBasis:
    "hash-bound-fla-frame-238-instance-transforms-and-swf-avm1-drag-handlers",
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

const createEmptyPlacements = (): CourseG04L03Ti002Placements =>
  Object.freeze({
    Scr_1: null,
    Scr_2: null,
    Scr_3: null,
    Scr_4: null,
    Scr_5: null,
  });

const freezeState = (
  state: CourseG04L03Ti002KeyTermDragState,
): CourseG04L03Ti002KeyTermDragState => Object.freeze({
  ...state,
  placements: Object.freeze({...state.placements}),
});

const isKnownCardId = (
  cardId: string,
): cardId is CourseG04L03Ti002CardId =>
  COURSE_G04_L03_TI_002_CARDS.some(({id}) => id === cardId);

const isKnownTargetId = (
  targetId: string,
): targetId is CourseG04L03Ti002TargetId =>
  COURSE_G04_L03_TI_002_CARDS.some(({targetId: id}) => id === targetId);

const getCard = (
  cardId: CourseG04L03Ti002CardId,
): CourseG04L03Ti002Card | undefined =>
  COURSE_G04_L03_TI_002_CARDS.find(({id}) => id === cardId);

export const getCourseG04L03Ti002PlacementCount = (
  state: CourseG04L03Ti002KeyTermDragState,
): number => COURSE_G04_L03_TI_002_CARDS.reduce(
  (count, {id}) => count + (state.placements[id] === null ? 0 : 1),
  0,
);

export const createCourseG04L03Ti002KeyTermDragState =
  (): CourseG04L03Ti002KeyTermDragState => freezeState({
    placements: createEmptyPlacements(),
    selectedCardId: null,
    wrongCardId: null,
    lastPlacedCardId: null,
    attemptedTargetId: null,
    outcome: "ready",
    locked: false,
    feedback: null,
  });

export const reduceCourseG04L03Ti002KeyTermDrag = (
  state: CourseG04L03Ti002KeyTermDragState,
  action: CourseG04L03Ti002KeyTermDragAction,
): CourseG04L03Ti002KeyTermDragState => {
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
          feedback: COURSE_G04_L03_TI_002_WRONG_FEEDBACK,
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
        feedback: COURSE_G04_L03_TI_002_CORRECT_FEEDBACK,
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
      const complete = getCourseG04L03Ti002PlacementCount(state)
        === COURSE_G04_L03_TI_002_CARDS.length;
      return freezeState({
        ...state,
        selectedCardId: null,
        wrongCardId: null,
        attemptedTargetId: null,
        outcome: complete ? "complete" : "ready",
        locked: complete,
        feedback: complete
          ? COURSE_G04_L03_TI_002_COMPLETION_FEEDBACK
          : null,
      });
    }

    case "reset":
    case "replay":
      return createCourseG04L03Ti002KeyTermDragState();
  }
};
