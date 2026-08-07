export type CourseG04L03In005CardId =
  | "Scr_1"
  | "Scr_2"
  | "Scr_3"
  | "Scr_4"
  | "Scr_5"
  | "Scr_6"
  | "Scr_7";

export type CourseG04L03In005TargetId =
  | "Mc_Tar_1"
  | "Mc_Tar_2"
  | "Mc_Tar_3"
  | "Mc_Tar_4"
  | "Mc_Tar_5"
  | "Mc_Tar_6"
  | "Mc_Tar_7";

export type CourseG04L03In005OrderingOutcome =
  | "ready"
  | "wrong"
  | "correct-feedback"
  | "complete";

export interface CourseG04L03In005Point {
  readonly x: number;
  readonly y: number;
}

export interface CourseG04L03In005Size {
  readonly height: number;
  readonly width: number;
}

export interface CourseG04L03In005OrderingCard {
  readonly id: CourseG04L03In005CardId;
  readonly valueText: "0" | "9" | "-6" | "4" | "1" | "-5" | "-1";
  readonly numericValue: 0 | 9 | -6 | 4 | 1 | -5 | -1;
  readonly accessibleLabel: string;
  readonly sourceCenter: CourseG04L03In005Point;
  readonly sourceSize: CourseG04L03In005Size;
  readonly targetId: CourseG04L03In005TargetId;
  readonly targetCenter: CourseG04L03In005Point;
  readonly targetSize: CourseG04L03In005Size;
}

export type CourseG04L03In005OrderingPlacements = Readonly<
  Record<CourseG04L03In005CardId, CourseG04L03In005TargetId | null>
>;

export interface CourseG04L03In005OrderingState {
  readonly placements: CourseG04L03In005OrderingPlacements;
  readonly selectedCardId: CourseG04L03In005CardId | null;
  readonly wrongCardId: CourseG04L03In005CardId | null;
  readonly lastPlacedCardId: CourseG04L03In005CardId | null;
  readonly attemptedTargetId: CourseG04L03In005TargetId | null;
  readonly outcome: CourseG04L03In005OrderingOutcome;
  readonly locked: boolean;
  readonly feedback: string | null;
}

export type CourseG04L03In005OrderingAction =
  | Readonly<{
      type: "select-card";
      cardId: CourseG04L03In005CardId;
    }>
  | Readonly<{
      type: "drop-card";
      /**
       * Present for a real drag/drop adapter. When omitted, the reducer places
       * the keyboard/click-selected card.
       */
      cardId?: CourseG04L03In005CardId;
      targetId: CourseG04L03In005TargetId;
    }>
  | Readonly<{type: "close-wrong"}>
  | Readonly<{type: "feedback-complete"}>
  | Readonly<{type: "reset"}>
  | Readonly<{type: "replay"}>;

const freezePoint = (
  point: CourseG04L03In005Point,
): CourseG04L03In005Point => Object.freeze({...point});

const freezeSize = (
  size: CourseG04L03In005Size,
): CourseG04L03In005Size => Object.freeze({...size});

const CARD_GEOMETRY = Object.freeze({
  Scr_1: Object.freeze({
    center: freezePoint({x: 172, y: 360}),
    size: freezeSize({height: 32, width: 32}),
  }),
  Scr_2: Object.freeze({
    center: freezePoint({x: 244.15, y: 360}),
    size: freezeSize({height: 32, width: 32}),
  }),
  Scr_3: Object.freeze({
    center: freezePoint({x: 316.3, y: 360}),
    size: freezeSize({height: 32, width: 32}),
  }),
  Scr_4: Object.freeze({
    center: freezePoint({x: 388.45, y: 360}),
    size: freezeSize({height: 32, width: 32}),
  }),
  Scr_5: Object.freeze({
    center: freezePoint({x: 460.6, y: 360}),
    size: freezeSize({height: 32, width: 32}),
  }),
  Scr_6: Object.freeze({
    center: freezePoint({x: 532.75, y: 360}),
    size: freezeSize({height: 32, width: 32}),
  }),
  Scr_7: Object.freeze({
    center: freezePoint({x: 604.9, y: 360}),
    size: freezeSize({height: 32, width: 32}),
  }),
});

const TARGET_GEOMETRY = Object.freeze({
  Mc_Tar_1: Object.freeze({
    center: freezePoint({x: 383, y: 233.1}),
    size: freezeSize({height: 48, width: 52}),
  }),
  Mc_Tar_2: Object.freeze({
    center: freezePoint({x: 600.95, y: 233.1}),
    size: freezeSize({height: 48.2, width: 52.2}),
  }),
  Mc_Tar_3: Object.freeze({
    center: freezePoint({x: 167, y: 233.1}),
    size: freezeSize({height: 48.5, width: 52}),
  }),
  Mc_Tar_4: Object.freeze({
    center: freezePoint({x: 526.95, y: 233.1}),
    size: freezeSize({height: 48, width: 52.2}),
  }),
  Mc_Tar_5: Object.freeze({
    center: freezePoint({x: 454.95, y: 233.1}),
    size: freezeSize({height: 48, width: 51.8}),
  }),
  Mc_Tar_6: Object.freeze({
    center: freezePoint({x: 237, y: 233.1}),
    size: freezeSize({height: 48, width: 51.75}),
  }),
  Mc_Tar_7: Object.freeze({
    center: freezePoint({x: 310, y: 233.1}),
    size: freezeSize({height: 48.2, width: 51.8}),
  }),
});

/**
 * Sprite-80 frame-144 geometry from the hash-bound FLA authoring audit.
 * Frame 143 is the clean donor drawing because source-static frame 144 cannot
 * execute the ActionScript side effects that normally control sprite-79.
 */
export const COURSE_G04_L03_IN_005_ORDERING_SOURCE_GEOMETRY = Object.freeze({
  stage: Object.freeze({width: 800, height: 600}),
  rootPlacement: freezePoint({x: 413.4, y: 283.3}),
  frameDomain: "sprite-80" as const,
  interactionFrame: 144,
  cleanSourceVisualFrame: 143,
  cards: CARD_GEOMETRY,
  targets: TARGET_GEOMETRY,
});

const freezeCard = (
  card: CourseG04L03In005OrderingCard,
): CourseG04L03In005OrderingCard => Object.freeze({...card});

export const COURSE_G04_L03_IN_005_ORDERING_CARDS:
  readonly CourseG04L03In005OrderingCard[] = Object.freeze([
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
      valueText: "-6",
      numericValue: -6,
      accessibleLabel: "negative 6",
      sourceCenter: CARD_GEOMETRY.Scr_3.center,
      sourceSize: CARD_GEOMETRY.Scr_3.size,
      targetId: "Mc_Tar_3",
      targetCenter: TARGET_GEOMETRY.Mc_Tar_3.center,
      targetSize: TARGET_GEOMETRY.Mc_Tar_3.size,
    }),
    freezeCard({
      id: "Scr_4",
      valueText: "4",
      numericValue: 4,
      accessibleLabel: "4",
      sourceCenter: CARD_GEOMETRY.Scr_4.center,
      sourceSize: CARD_GEOMETRY.Scr_4.size,
      targetId: "Mc_Tar_4",
      targetCenter: TARGET_GEOMETRY.Mc_Tar_4.center,
      targetSize: TARGET_GEOMETRY.Mc_Tar_4.size,
    }),
    freezeCard({
      id: "Scr_5",
      valueText: "1",
      numericValue: 1,
      accessibleLabel: "1",
      sourceCenter: CARD_GEOMETRY.Scr_5.center,
      sourceSize: CARD_GEOMETRY.Scr_5.size,
      targetId: "Mc_Tar_5",
      targetCenter: TARGET_GEOMETRY.Mc_Tar_5.center,
      targetSize: TARGET_GEOMETRY.Mc_Tar_5.size,
    }),
    freezeCard({
      id: "Scr_6",
      valueText: "-5",
      numericValue: -5,
      accessibleLabel: "negative 5",
      sourceCenter: CARD_GEOMETRY.Scr_6.center,
      sourceSize: CARD_GEOMETRY.Scr_6.size,
      targetId: "Mc_Tar_6",
      targetCenter: TARGET_GEOMETRY.Mc_Tar_6.center,
      targetSize: TARGET_GEOMETRY.Mc_Tar_6.size,
    }),
    freezeCard({
      id: "Scr_7",
      valueText: "-1",
      numericValue: -1,
      accessibleLabel: "negative 1",
      sourceCenter: CARD_GEOMETRY.Scr_7.center,
      sourceSize: CARD_GEOMETRY.Scr_7.size,
      targetId: "Mc_Tar_7",
      targetCenter: TARGET_GEOMETRY.Mc_Tar_7.center,
      targetSize: TARGET_GEOMETRY.Mc_Tar_7.size,
    }),
  ]);

export const COURSE_G04_L03_IN_005_SORTED_TARGET_IDS:
  readonly CourseG04L03In005TargetId[] = Object.freeze([
    "Mc_Tar_3",
    "Mc_Tar_6",
    "Mc_Tar_7",
    "Mc_Tar_1",
    "Mc_Tar_5",
    "Mc_Tar_4",
    "Mc_Tar_2",
  ]);

export const COURSE_G04_L03_IN_005_ORDERING_INSTRUCTION =
  "Drag and drop each number in order from least to greatest.";

/**
 * Authoring fallback found in sprite-79. The source handler overwrites it with
 * `_global.WrongFeed`, whose host value remains unresolved.
 */
export const COURSE_G04_L03_IN_005_ORDERING_WRONG_FEEDBACK =
  "Order these numbers from least to greatest. Try again.";

/** Modern assistive acknowledgement; source text parity is not claimed. */
export const COURSE_G04_L03_IN_005_ORDERING_CORRECT_FEEDBACK = "Correct.";

/** Exact final text found in the FLA authoring structure. */
export const COURSE_G04_L03_IN_005_ORDERING_COMPLETION_FEEDBACK =
  "Correct!!!";

/**
 * Sprite-47 reaches its frame-20 re-enable beat after 19 frame intervals.
 * This is a current-JavaScript projection, not an original-runtime trace.
 */
export const COURSE_G04_L03_IN_005_ORDERING_CURRENT_JS_TIMING =
  Object.freeze({
    correctFeedbackMs: (19 * 1_000) / 12,
  });

export const COURSE_G04_L03_IN_005_ORDERING_INTERACTION_AUTHORITY =
  Object.freeze({
    evidenceBasis:
      "hash-bound-fla-frame-144-instance-transforms-and-swf-avm1-drag-handlers",
    implementationKind: "current-javascript-pure-state-candidate",
    wrongFeedbackTextDisposition:
      "authored-fallback-host-global-unresolved",
    correctFeedbackTextDisposition:
      "modern-assistive-not-source-exact",
    completionFeedbackTextDisposition:
      "source-authored-exact-modern-persistent",
    correctFeedbackTimerDisposition:
      "current-javascript-projection-not-original-runtime-trace",
    replayDisposition: "modern-full-reset-not-original-runtime-parity",
    implementationAuthorized: false,
    originalRuntimeAuthorityEstablished: false,
    wrongFeedbackHostRuntimeResolved: false,
    correctFeedbackTimerIsOriginalRuntimeTrace: false,
    completionPersistenceIsOriginalRuntimeTrace: false,
    sourceDragDropExecuted: false,
    sourceRandomExecuted: false,
    clearControlModeled: false,
    newNumberControlModeled: false,
    helpControlModeled: false,
    embeddedCoachAudioModeled: false,
    associatedAudioModeled: false,
    audioParityEstablished: false,
    hostWrongFeedbackResolved: false,
    hostKeyTermLinksResolved: false,
    hostContinuationParityEstablished: false,
    behaviorParityEstablished: false,
    replayParityEstablished: false,
    humanVisualReviewAccepted: false,
    ownerAccepted: false,
    strictMigrationComplete: false,
    strictAcceptanceEffect: "none",
  });

const createEmptyPlacements = (): CourseG04L03In005OrderingPlacements =>
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
  state: CourseG04L03In005OrderingState,
): CourseG04L03In005OrderingState => Object.freeze({
  ...state,
  placements: Object.freeze({...state.placements}),
});

const isKnownCardId = (
  cardId: string,
): cardId is CourseG04L03In005CardId =>
  COURSE_G04_L03_IN_005_ORDERING_CARDS.some(({id}) => id === cardId);

const isKnownTargetId = (
  targetId: string,
): targetId is CourseG04L03In005TargetId =>
  COURSE_G04_L03_IN_005_ORDERING_CARDS.some(
    ({targetId: id}) => id === targetId,
  );

const getCard = (
  cardId: CourseG04L03In005CardId,
): CourseG04L03In005OrderingCard | undefined =>
  COURSE_G04_L03_IN_005_ORDERING_CARDS.find(({id}) => id === cardId);

export const getCourseG04L03In005OrderingPlacementCount = (
  state: CourseG04L03In005OrderingState,
): number => COURSE_G04_L03_IN_005_ORDERING_CARDS.reduce(
  (count, {id}) => count + (state.placements[id] === null ? 0 : 1),
  0,
);

export const createCourseG04L03In005CardSelectAction = (
  cardId: CourseG04L03In005CardId,
): CourseG04L03In005OrderingAction => Object.freeze({
  type: "select-card",
  cardId,
});

export const createCourseG04L03In005SelectedPlaceAction = (
  targetId: CourseG04L03In005TargetId,
): CourseG04L03In005OrderingAction => Object.freeze({
  type: "drop-card",
  targetId,
});

export const createCourseG04L03In005RealDragPlaceAction = (
  cardId: CourseG04L03In005CardId,
  targetId: CourseG04L03In005TargetId,
): CourseG04L03In005OrderingAction => Object.freeze({
  type: "drop-card",
  cardId,
  targetId,
});

export const createCourseG04L03In005OrderingState =
  (): CourseG04L03In005OrderingState => freezeState({
    placements: createEmptyPlacements(),
    selectedCardId: null,
    wrongCardId: null,
    lastPlacedCardId: null,
    attemptedTargetId: null,
    outcome: "ready",
    locked: false,
    feedback: null,
  });

export const reduceCourseG04L03In005OrderingInteraction = (
  state: CourseG04L03In005OrderingState,
  action: CourseG04L03In005OrderingAction,
): CourseG04L03In005OrderingState => {
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
          feedback: COURSE_G04_L03_IN_005_ORDERING_WRONG_FEEDBACK,
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
        feedback: COURSE_G04_L03_IN_005_ORDERING_CORRECT_FEEDBACK,
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
      const complete = getCourseG04L03In005OrderingPlacementCount(state)
        === COURSE_G04_L03_IN_005_ORDERING_CARDS.length;
      return freezeState({
        ...state,
        selectedCardId: null,
        wrongCardId: null,
        attemptedTargetId: null,
        outcome: complete ? "complete" : "ready",
        locked: complete,
        feedback: complete
          ? COURSE_G04_L03_IN_005_ORDERING_COMPLETION_FEEDBACK
          : null,
      });
    }

    case "reset":
    case "replay":
      return createCourseG04L03In005OrderingState();

    default:
      return state;
  }
};
