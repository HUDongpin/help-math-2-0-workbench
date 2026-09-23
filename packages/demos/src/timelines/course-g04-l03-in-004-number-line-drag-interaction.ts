export type CourseG04L03In004CardId = "2" | "3" | "4" | "5" | "6";

export type CourseG04L03In004InteractionMode =
  | "ready"
  | "correct-feedback"
  | "wrong-feedback"
  | "completed";

export type CourseG04L03In004CorrectFeedbackPolicy =
  | "inactive"
  | "hold-while-paused"
  | "complete-immediately"
  | "schedule-delay";

export interface CourseG04L03In004Point {
  readonly x: number;
  readonly y: number;
}

export interface CourseG04L03In004Size {
  readonly height: number;
  readonly width: number;
}

export interface CourseG04L03In004NumberCard {
  readonly id: CourseG04L03In004CardId;
  readonly label: string;
  readonly numericValue: -6 | -4 | 0 | 6 | 8;
  readonly accessibleLabel: string;
  readonly sourceInstance: `Scr_${CourseG04L03In004CardId}`;
  readonly sourcePosition: CourseG04L03In004Point;
  readonly sourceSize: CourseG04L03In004Size;
  readonly targetInstance: `Mc_Tar_${CourseG04L03In004CardId}`;
  readonly targetPosition: CourseG04L03In004Point;
  readonly targetSize: CourseG04L03In004Size;
}

export interface CourseG04L03In004GlossaryEntry {
  readonly term: "Position" | "Number line";
  readonly definition: string;
}

export interface CourseG04L03In004NumberLineDragState {
  readonly mode: CourseG04L03In004InteractionMode;
  readonly placedCardIds: readonly CourseG04L03In004CardId[];
  readonly selectedCardId: CourseG04L03In004CardId | null;
  readonly lastPlacedCardId: CourseG04L03In004CardId | null;
  readonly attemptedTargetId: CourseG04L03In004CardId | null;
  readonly feedbackText: string | null;
}

export type CourseG04L03In004NumberLineDragAction =
  | Readonly<{
      type: "select-card";
      cardId: CourseG04L03In004CardId;
    }>
  | Readonly<{
      type: "place-card";
      cardId?: CourseG04L03In004CardId;
      targetId: CourseG04L03In004CardId;
    }>
  | Readonly<{type: "feedback-complete"}>
  | Readonly<{type: "close-wrong-feedback"}>
  | Readonly<{type: "reset"}>
  | Readonly<{type: "replay"}>;

const freezePoint = (
  point: CourseG04L03In004Point,
): CourseG04L03In004Point => Object.freeze({...point});

const freezeSize = (
  size: CourseG04L03In004Size,
): CourseG04L03In004Size => Object.freeze({...size});

/**
 * Sprite-160 frame-126 coordinates after applying the root placement. These
 * anchors come from the hash-bound authoring placement graph, not a screenshot
 * estimate. A future renderer may enlarge hit regions without moving them.
 */
export const COURSE_G04_L03_IN_004_SOURCE_GEOMETRY = Object.freeze({
  stage: Object.freeze({width: 800, height: 600}),
  rootPlacement: freezePoint({x: 413.4, y: 283.3}),
  frameDomain: "sprite-160" as const,
  interactionFrame: 126,
  cleanSourceVisualFrame: 125,
});

const freezeCard = (
  card: CourseG04L03In004NumberCard,
): CourseG04L03In004NumberCard => Object.freeze({...card});

export const COURSE_G04_L03_IN_004_NUMBER_CARDS:
  readonly CourseG04L03In004NumberCard[] = Object.freeze([
    freezeCard({
      id: "2",
      label: "−6",
      numericValue: -6,
      accessibleLabel: "negative 6",
      sourceInstance: "Scr_2",
      sourcePosition: freezePoint({x: 305, y: 420}),
      sourceSize: freezeSize({height: 32, width: 32}),
      targetInstance: "Mc_Tar_2",
      targetPosition: freezePoint({x: 228.55, y: 229}),
      targetSize: freezeSize({height: 34, width: 33}),
    }),
    freezeCard({
      id: "3",
      label: "0",
      numericValue: 0,
      accessibleLabel: "0",
      sourceInstance: "Scr_3",
      sourcePosition: freezePoint({x: 375, y: 420}),
      sourceSize: freezeSize({height: 32, width: 32}),
      targetInstance: "Mc_Tar_3",
      targetPosition: freezePoint({x: 402.55, y: 229}),
      targetSize: freezeSize({height: 34.25, width: 33.1}),
    }),
    freezeCard({
      id: "4",
      label: "6",
      numericValue: 6,
      accessibleLabel: "6",
      sourceInstance: "Scr_4",
      sourcePosition: freezePoint({x: 445, y: 420}),
      sourceSize: freezeSize({height: 32, width: 32}),
      targetInstance: "Mc_Tar_4",
      targetPosition: freezePoint({x: 572.5, y: 229}),
      targetSize: freezeSize({height: 34.25, width: 32.85}),
    }),
    freezeCard({
      id: "5",
      label: "8",
      numericValue: 8,
      accessibleLabel: "8",
      sourceInstance: "Scr_5",
      sourcePosition: freezePoint({x: 515, y: 420}),
      sourceSize: freezeSize({height: 32, width: 32}),
      targetInstance: "Mc_Tar_5",
      targetPosition: freezePoint({x: 628.5, y: 229}),
      targetSize: freezeSize({height: 34, width: 33}),
    }),
    freezeCard({
      id: "6",
      label: "−4",
      numericValue: -4,
      accessibleLabel: "negative 4",
      sourceInstance: "Scr_6",
      sourcePosition: freezePoint({x: 585, y: 420}),
      sourceSize: freezeSize({height: 32, width: 32}),
      targetInstance: "Mc_Tar_6",
      targetPosition: freezePoint({x: 288.55, y: 229}),
      targetSize: freezeSize({height: 34, width: 33}),
    }),
  ]);

export const COURSE_G04_L03_IN_004_FIXED_EXAMPLE = Object.freeze({
  label: "−1",
  numericValue: -1,
  targetInstance: "Mc_Tar_1" as const,
  targetPosition: freezePoint({x: 374.95, y: 228}),
  targetSize: freezeSize({height: 32, width: 32}),
});

export const COURSE_G04_L03_IN_004_INSTRUCTION =
  "Drag and drop each number to its correct position on the number line.";

/**
 * Exact visible authoring default. The child SWF assigns `_global.WrongFeed`
 * at runtime, so this constant does not resolve the missing host value.
 */
export const COURSE_G04_L03_IN_004_WRONG_FEEDBACK =
  "Number lines show numbers in order. Try again.";

export const COURSE_G04_L03_IN_004_COMPLETION_FEEDBACK = "Correct!!!";

export const COURSE_G04_L03_IN_004_GLOSSARY:
  readonly CourseG04L03In004GlossaryEntry[] = Object.freeze([
    Object.freeze({
      term: "Position",
      definition: "A position is a place or location.",
    }),
    Object.freeze({
      term: "Number line",
      definition: "A line for ordering numbers by their size.",
    }),
  ]);

/**
 * Coach_audio_2a enters at nested frame 2 and re-enables the cards at frame
 * 20. This is a deterministic current-JS projection of 19 frame intervals at
 * 12 FPS, not an original-runtime trace or accepted audio timing.
 */
export const COURSE_G04_L03_IN_004_CURRENT_JS_TIMING = Object.freeze({
  correctFeedbackMs: (19 * 1_000) / 12,
});

export const COURSE_G04_L03_IN_004_INTERACTION_AUTHORITY = Object.freeze({
  evidenceBasis:
    "exact-avm1-clip-handlers-and-hash-bound-authoring-placement-graph",
  implementationKind: "current-javascript-pure-state-candidate",
  wrongFeedbackTextDisposition:
    "visible-authoring-default-host-runtime-value-unresolved",
  sourceDragDropExecuted: false,
  correctFeedbackTimingIsOriginalRuntimeTrace: false,
  hostWrongFeedbackResolved: false,
  hostGlossaryActionsExecuted: false,
  embeddedCoachAudioModeled: false,
  postCompletionContinuationModeled: false,
  spanishImplemented: false,
  behaviorParityEstablished: false,
  replayParityEstablished: false,
  humanVisualReviewAccepted: false,
  ownerAccepted: false,
  strictMigrationComplete: false,
  strictAcceptanceEffect: "none",
});

export const getCourseG04L03In004CorrectFeedbackPolicy = ({
  mode,
  paused,
  reducedMotion,
}: Readonly<{
  mode: CourseG04L03In004InteractionMode;
  paused: boolean;
  reducedMotion: boolean;
}>): CourseG04L03In004CorrectFeedbackPolicy => {
  if (mode !== "correct-feedback") return "inactive";
  if (paused) return "hold-while-paused";
  if (reducedMotion) return "complete-immediately";
  return "schedule-delay";
};

const allCardIds = (): CourseG04L03In004CardId[] =>
  COURSE_G04_L03_IN_004_NUMBER_CARDS.map(({id}) => id);

const isKnownCardId = (
  cardId: string,
): cardId is CourseG04L03In004CardId =>
  COURSE_G04_L03_IN_004_NUMBER_CARDS.some(({id}) => id === cardId);

const freezeState = (
  state: Omit<CourseG04L03In004NumberLineDragState, "placedCardIds"> & {
    readonly placedCardIds: readonly CourseG04L03In004CardId[];
  },
): CourseG04L03In004NumberLineDragState => Object.freeze({
  ...state,
  placedCardIds: Object.freeze([...state.placedCardIds]),
});

export const getCourseG04L03In004PlacementCount = (
  state: CourseG04L03In004NumberLineDragState,
): number => state.placedCardIds.length;

export const createCourseG04L03In004NumberLineDragState =
  (): CourseG04L03In004NumberLineDragState => freezeState({
    mode: "ready",
    placedCardIds: [],
    selectedCardId: null,
    lastPlacedCardId: null,
    attemptedTargetId: null,
    feedbackText: null,
  });

export const reduceCourseG04L03In004NumberLineDrag = (
  state: CourseG04L03In004NumberLineDragState,
  action: CourseG04L03In004NumberLineDragAction,
): CourseG04L03In004NumberLineDragState => {
  switch (action.type) {
    case "select-card":
      if (
        state.mode !== "ready"
        || !isKnownCardId(action.cardId)
        || state.placedCardIds.includes(action.cardId)
        || state.selectedCardId === action.cardId
      ) return state;
      return freezeState({
        ...state,
        selectedCardId: action.cardId,
        attemptedTargetId: null,
        feedbackText: null,
      });

    case "place-card": {
      if (state.mode !== "ready") return state;

      const cardId = action.cardId ?? state.selectedCardId;
      if (
        cardId === null
        || !isKnownCardId(cardId)
        || !isKnownCardId(action.targetId)
        || state.placedCardIds.includes(cardId)
      ) return state;

      if (cardId !== action.targetId) {
        return freezeState({
          ...state,
          mode: "wrong-feedback",
          selectedCardId: null,
          lastPlacedCardId: null,
          attemptedTargetId: action.targetId,
          feedbackText: COURSE_G04_L03_IN_004_WRONG_FEEDBACK,
        });
      }

      return freezeState({
        ...state,
        mode: "correct-feedback",
        placedCardIds: [...state.placedCardIds, cardId],
        selectedCardId: null,
        lastPlacedCardId: cardId,
        attemptedTargetId: action.targetId,
        feedbackText: null,
      });
    }

    case "feedback-complete": {
      if (state.mode !== "correct-feedback") return state;
      const completed = state.placedCardIds.length >= allCardIds().length;
      return freezeState({
        ...state,
        mode: completed ? "completed" : "ready",
        attemptedTargetId: null,
        feedbackText: completed
          ? COURSE_G04_L03_IN_004_COMPLETION_FEEDBACK
          : null,
      });
    }

    case "close-wrong-feedback":
      if (state.mode !== "wrong-feedback") return state;
      return freezeState({
        ...state,
        mode: "ready",
        selectedCardId: null,
        attemptedTargetId: null,
        feedbackText: null,
      });

    case "reset":
    case "replay":
      return createCourseG04L03In004NumberLineDragState();
  }
};
