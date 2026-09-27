export type CourseG04L03In012CardId =
  | "Scr_1"
  | "Scr_2"
  | "Scr_3"
  | "Scr_4"
  | "Scr_5";

export type CourseG04L03In012TargetId =
  | "Mc_Tar_1"
  | "Mc_Tar_2"
  | "Mc_Tar_3"
  | "Mc_Tar_4"
  | "Mc_Tar_5";

export type CourseG04L03In012Outcome =
  | "ready"
  | "wrong"
  | "correct-feedback"
  | "final-correct-feedback"
  | "complete";

export interface CourseG04L03In012Point {
  readonly x: number;
  readonly y: number;
}

export interface CourseG04L03In012Size {
  readonly height: number;
  readonly width: number;
}

export interface CourseG04L03In012Bounds extends CourseG04L03In012Size {
  readonly bottom: number;
  readonly left: number;
  readonly right: number;
  readonly top: number;
}

export interface CourseG04L03In012PositionedBounds
  extends CourseG04L03In012Point, CourseG04L03In012Size {}

export interface CourseG04L03In012Card {
  readonly id: CourseG04L03In012CardId;
  readonly person: "Josh" | "Ruben" | "Carrie" | "Monique" | "Van";
  readonly relation: "Has" | "Owes";
  readonly sourceText:
    | "Josh\rHas \r$7"
    | "Ruben\rOwes\r $5"
    | "Carrie\rHas \r$4"
    | "Monique\rOwes \r$2"
    | "Van\rHas \r$1";
  readonly amountText: "$7" | "$5" | "$4" | "$2" | "$1";
  readonly amount: 7 | 5 | 4 | 2 | 1;
  readonly signedValue: 7 | -5 | 4 | -2 | 1;
  readonly accessibleLabel: string;
  readonly sourceCenter: CourseG04L03In012Point;
  readonly sourceSize: CourseG04L03In012Size;
  readonly sourceBounds: CourseG04L03In012Bounds;
  readonly targetId: CourseG04L03In012TargetId;
  readonly targetCenter: CourseG04L03In012Point;
  readonly targetSize: CourseG04L03In012Size;
  readonly targetBounds: CourseG04L03In012Bounds;
}

export interface CourseG04L03In012GlossaryTerm {
  readonly id: "position" | "number-line" | "owes";
  readonly visibleText: "position" | "number line" | "owes";
  readonly keyAttribute: "Position" | "Number line" | "Owe";
  readonly bounds: CourseG04L03In012PositionedBounds;
  readonly hostAction: "DoHyperLinks";
  readonly hostContentResolved: false;
  readonly enabled: false;
  readonly status: "safe-disabled";
}

export type CourseG04L03In012Placements = Readonly<
  Record<CourseG04L03In012CardId, CourseG04L03In012TargetId | null>
>;

export interface CourseG04L03In012OwingDragState {
  readonly placements: CourseG04L03In012Placements;
  readonly selectedCardId: CourseG04L03In012CardId | null;
  readonly wrongCardId: CourseG04L03In012CardId | null;
  readonly lastPlacedCardId: CourseG04L03In012CardId | null;
  readonly attemptedTargetId: CourseG04L03In012TargetId | null;
  readonly outcome: CourseG04L03In012Outcome;
  readonly locked: boolean;
  readonly feedback: string | null;
}

export type CourseG04L03In012OwingDragAction =
  | Readonly<{
      type: "select-card";
      cardId: CourseG04L03In012CardId;
    }>
  | Readonly<{
      type: "drop-card";
      cardId?: CourseG04L03In012CardId;
      targetId: CourseG04L03In012TargetId;
    }>
  | Readonly<{type: "close-wrong"}>
  | Readonly<{type: "feedback-complete"}>
  | Readonly<{type: "final-feedback-complete"}>
  | Readonly<{type: "replay"}>;

const freezePoint = (
  point: CourseG04L03In012Point,
): CourseG04L03In012Point => Object.freeze({...point});

const freezeSize = (
  size: CourseG04L03In012Size,
): CourseG04L03In012Size => Object.freeze({...size});

const freezeBounds = (
  bounds: CourseG04L03In012Bounds,
): CourseG04L03In012Bounds => Object.freeze({...bounds});

const freezePositionedBounds = (
  bounds: CourseG04L03In012PositionedBounds,
): CourseG04L03In012PositionedBounds => Object.freeze({...bounds});

const CARD_GEOMETRY = Object.freeze({
  Scr_1: Object.freeze({
    center: freezePoint({x: 174.55, y: 413.95}),
    size: freezeSize({height: 79.05, width: 46.9497}),
    bounds: freezeBounds({
      left: 151.0496,
      top: 379.95,
      right: 197.9993,
      bottom: 459,
      width: 46.9497,
      height: 79.05,
    }),
  }),
  Scr_2: Object.freeze({
    center: freezePoint({x: 287.55, y: 413.95}),
    size: freezeSize({height: 79.0005, width: 62.9502}),
    bounds: freezeBounds({
      left: 256.0611,
      top: 380.0213,
      right: 319.0113,
      bottom: 459.0218,
      width: 62.9502,
      height: 79.0005,
    }),
  }),
  Scr_3: Object.freeze({
    center: freezePoint({x: 397.55, y: 413.95}),
    size: freezeSize({height: 79.05, width: 55.9499}),
    bounds: freezeBounds({
      left: 368.9905,
      top: 379.95,
      right: 424.9404,
      bottom: 459,
      width: 55.9499,
      height: 79.05,
    }),
  }),
  Scr_4: Object.freeze({
    center: freezePoint({x: 507.5, y: 413.95}),
    size: freezeSize({height: 79.0005, width: 77.9504}),
    bounds: freezeBounds({
      left: 469.0626,
      top: 380.0213,
      right: 547.0129,
      bottom: 459.0218,
      width: 77.9504,
      height: 79.0005,
    }),
  }),
  Scr_5: Object.freeze({
    center: freezePoint({x: 617.5, y: 413.95}),
    size: freezeSize({height: 79.05, width: 51.95}),
    bounds: freezeBounds({
      left: 592.05,
      top: 379.95,
      right: 644,
      bottom: 459,
      width: 51.95,
      height: 79.05,
    }),
  }),
});

const TARGET_GEOMETRY = Object.freeze({
  Mc_Tar_1: Object.freeze({
    center: freezePoint({x: 600.5, y: 212.95}),
    size: freezeSize({height: 83.95, width: 72.9}),
    bounds: freezeBounds({
      left: 564.05,
      top: 170.95,
      right: 636.95,
      bottom: 254.9,
      width: 72.9,
      height: 83.95,
    }),
  }),
  Mc_Tar_2: Object.freeze({
    center: freezePoint({x: 259.5, y: 212.95}),
    size: freezeSize({height: 83.95, width: 72.9}),
    bounds: freezeBounds({
      left: 223.05,
      top: 170.95,
      right: 295.95,
      bottom: 254.9,
      width: 72.9,
      height: 83.95,
    }),
  }),
  Mc_Tar_3: Object.freeze({
    center: freezePoint({x: 515.5, y: 212.95}),
    size: freezeSize({height: 83.95, width: 72.9}),
    bounds: freezeBounds({
      left: 479.05,
      top: 170.95,
      right: 551.95,
      bottom: 254.9,
      width: 72.9,
      height: 83.95,
    }),
  }),
  Mc_Tar_4: Object.freeze({
    center: freezePoint({x: 344.5, y: 212.95}),
    size: freezeSize({height: 83.95, width: 77.9001}),
    bounds: freezeBounds({
      left: 305.05,
      top: 170.95,
      right: 382.95,
      bottom: 254.9,
      width: 77.9001,
      height: 83.95,
    }),
  }),
  Mc_Tar_5: Object.freeze({
    center: freezePoint({x: 428.5, y: 212.95}),
    size: freezeSize({height: 83.95, width: 72.9}),
    bounds: freezeBounds({
      left: 392.05,
      top: 170.95,
      right: 464.95,
      bottom: 254.9,
      width: 72.9,
      height: 83.95,
    }),
  }),
});

/**
 * Stage-space geometry recovered from the hash-bound authoring/source audit.
 * The clean visual is frame 173 because frame 174 can expose an initialization
 * popup when the AVM1 host path has not run.
 */
export const COURSE_G04_L03_IN_012_SOURCE_GEOMETRY = Object.freeze({
  stage: Object.freeze({width: 800, height: 600}),
  backgroundColor: "#b8d8f7" as const,
  fps: 12,
  rootFrameCount: 10,
  rootPlacement: freezePoint({x: 413.4, y: 283.3}),
  frameDomain: "sprite-228" as const,
  frameCount: 215,
  interactionFrame: 174,
  cleanSourceVisualFrame: 173,
  terminalFrame: 215,
  cards: CARD_GEOMETRY,
  targets: TARGET_GEOMETRY,
});

const freezeCard = (
  card: CourseG04L03In012Card,
): CourseG04L03In012Card => Object.freeze({...card});

export const COURSE_G04_L03_IN_012_CARDS:
  readonly CourseG04L03In012Card[] = Object.freeze([
    freezeCard({
      id: "Scr_1",
      person: "Josh",
      relation: "Has",
      sourceText: "Josh\rHas \r$7",
      amountText: "$7",
      amount: 7,
      signedValue: 7,
      accessibleLabel: "Josh has 7 dollars, positive 7",
      sourceCenter: CARD_GEOMETRY.Scr_1.center,
      sourceSize: CARD_GEOMETRY.Scr_1.size,
      sourceBounds: CARD_GEOMETRY.Scr_1.bounds,
      targetId: "Mc_Tar_1",
      targetCenter: TARGET_GEOMETRY.Mc_Tar_1.center,
      targetSize: TARGET_GEOMETRY.Mc_Tar_1.size,
      targetBounds: TARGET_GEOMETRY.Mc_Tar_1.bounds,
    }),
    freezeCard({
      id: "Scr_2",
      person: "Ruben",
      relation: "Owes",
      sourceText: "Ruben\rOwes\r $5",
      amountText: "$5",
      amount: 5,
      signedValue: -5,
      accessibleLabel: "Ruben owes 5 dollars, negative 5",
      sourceCenter: CARD_GEOMETRY.Scr_2.center,
      sourceSize: CARD_GEOMETRY.Scr_2.size,
      sourceBounds: CARD_GEOMETRY.Scr_2.bounds,
      targetId: "Mc_Tar_2",
      targetCenter: TARGET_GEOMETRY.Mc_Tar_2.center,
      targetSize: TARGET_GEOMETRY.Mc_Tar_2.size,
      targetBounds: TARGET_GEOMETRY.Mc_Tar_2.bounds,
    }),
    freezeCard({
      id: "Scr_3",
      person: "Carrie",
      relation: "Has",
      sourceText: "Carrie\rHas \r$4",
      amountText: "$4",
      amount: 4,
      signedValue: 4,
      accessibleLabel: "Carrie has 4 dollars, positive 4",
      sourceCenter: CARD_GEOMETRY.Scr_3.center,
      sourceSize: CARD_GEOMETRY.Scr_3.size,
      sourceBounds: CARD_GEOMETRY.Scr_3.bounds,
      targetId: "Mc_Tar_3",
      targetCenter: TARGET_GEOMETRY.Mc_Tar_3.center,
      targetSize: TARGET_GEOMETRY.Mc_Tar_3.size,
      targetBounds: TARGET_GEOMETRY.Mc_Tar_3.bounds,
    }),
    freezeCard({
      id: "Scr_4",
      person: "Monique",
      relation: "Owes",
      sourceText: "Monique\rOwes \r$2",
      amountText: "$2",
      amount: 2,
      signedValue: -2,
      accessibleLabel: "Monique owes 2 dollars, negative 2",
      sourceCenter: CARD_GEOMETRY.Scr_4.center,
      sourceSize: CARD_GEOMETRY.Scr_4.size,
      sourceBounds: CARD_GEOMETRY.Scr_4.bounds,
      targetId: "Mc_Tar_4",
      targetCenter: TARGET_GEOMETRY.Mc_Tar_4.center,
      targetSize: TARGET_GEOMETRY.Mc_Tar_4.size,
      targetBounds: TARGET_GEOMETRY.Mc_Tar_4.bounds,
    }),
    freezeCard({
      id: "Scr_5",
      person: "Van",
      relation: "Has",
      sourceText: "Van\rHas \r$1",
      amountText: "$1",
      amount: 1,
      signedValue: 1,
      accessibleLabel: "Van has 1 dollar, positive 1",
      sourceCenter: CARD_GEOMETRY.Scr_5.center,
      sourceSize: CARD_GEOMETRY.Scr_5.size,
      sourceBounds: CARD_GEOMETRY.Scr_5.bounds,
      targetId: "Mc_Tar_5",
      targetCenter: TARGET_GEOMETRY.Mc_Tar_5.center,
      targetSize: TARGET_GEOMETRY.Mc_Tar_5.size,
      targetBounds: TARGET_GEOMETRY.Mc_Tar_5.bounds,
    }),
  ]);

export const COURSE_G04_L03_IN_012_INSTRUCTION =
  "Drag and drop each person’s card to the correct position on the number line based on the amount of money each one has or owes.";

/**
 * Exact source-glyph fallback. The child ActionScript assigns the unresolved
 * host global `_global.WrongFeed`, so this string is not runtime-causality
 * evidence.
 */
export const COURSE_G04_L03_IN_012_WRONG_FEEDBACK =
  "Having money means positive numbers and owing money means negative numbers. Try again.";

/** Modern assistive acknowledgement; no source-text parity is claimed. */
export const COURSE_G04_L03_IN_012_CORRECT_FEEDBACK = "Correct.";

/** Exact final text recovered from the source authoring structure. */
export const COURSE_G04_L03_IN_012_FINAL_CORRECT_FEEDBACK = "Correct!!!";

/**
 * Current-JavaScript projections from source timeline windows. They are not
 * authoritative original-runtime timing traces.
 */
export const COURSE_G04_L03_IN_012_CURRENT_JS_TIMING = Object.freeze({
  perCardCorrectFeedbackMs: 1_500,
  finalCorrectFeedbackMs: (23 * 1_000) / 12,
  perCardFrameDomain: "sprite-37" as const,
  perCardFirstFrame: 2,
  perCardLastFrame: 19,
  finalFrameDomain: "sprite-227" as const,
  finalFirstFrame: 2,
  finalLastFrame: 24,
});

const freezeGlossaryTerm = (
  term: CourseG04L03In012GlossaryTerm,
): CourseG04L03In012GlossaryTerm => Object.freeze({...term});

/**
 * The source hotspots call the unresolved host `DoHyperLinks` function. Their
 * source geometry and keys are retained, but current JavaScript keeps them
 * disabled until the host content contract is independently recovered.
 */
export const COURSE_G04_L03_IN_012_SOURCE_GLOSSARY_TERMS:
  readonly CourseG04L03In012GlossaryTerm[] = Object.freeze([
    freezeGlossaryTerm({
      id: "position",
      visibleText: "position",
      keyAttribute: "Position",
      bounds: freezePositionedBounds({
        x: 518,
        y: 89.4,
        width: 72.7,
        height: 18.6,
      }),
      hostAction: "DoHyperLinks",
      hostContentResolved: false,
      enabled: false,
      status: "safe-disabled",
    }),
    freezeGlossaryTerm({
      id: "number-line",
      visibleText: "number line",
      keyAttribute: "Number line",
      bounds: freezePositionedBounds({
        x: 62.55,
        y: 119.4,
        width: 109.65,
        height: 18.6,
      }),
      hostAction: "DoHyperLinks",
      hostContentResolved: false,
      enabled: false,
      status: "safe-disabled",
    }),
    freezeGlossaryTerm({
      id: "owes",
      visibleText: "owes",
      keyAttribute: "Owe",
      bounds: freezePositionedBounds({
        x: 634.5,
        y: 119.4,
        width: 51.15,
        height: 18.6,
      }),
      hostAction: "DoHyperLinks",
      hostContentResolved: false,
      enabled: false,
      status: "safe-disabled",
    }),
  ]);

export const COURSE_G04_L03_IN_012_INTERACTION_AUTHORITY = Object.freeze({
  evidenceBasis:
    "hash-bound-fla-instance-geometry-source-glyphs-and-swf-avm1-handlers",
  implementationKind: "current-javascript-pure-state-candidate",
  wrongFeedbackTextDisposition:
    "source-glyph-fallback-host-global-assignment-unresolved",
  correctFeedbackTextDisposition: "modern-assistive-not-source-exact",
  finalCorrectFeedbackTextDisposition:
    "source-authoring-text-without-original-runtime-causality",
  perCardFeedbackTimingDisposition:
    "current-javascript-source-window-projection",
  finalFeedbackTimingDisposition:
    "current-javascript-source-window-projection",
  glossaryDisposition:
    "source-hotspots-safe-disabled-host-content-unresolved",
  replayDisposition:
    "current-javascript-whole-state-reset-without-source-control-parity",
  wrongFeedbackTextSourceRuntimeEstablished: false,
  correctFeedbackTextSourceRuntimeEstablished: false,
  finalCorrectFeedbackTextSourceRuntimeEstablished: false,
  perCardCorrectFeedbackTimerIsOriginalRuntimeTrace: false,
  finalCorrectFeedbackTimerIsOriginalRuntimeTrace: false,
  sourceDragDropExecuted: false,
  sourceWrongFeedbackExecuted: false,
  sourceCorrectFeedbackExecuted: false,
  sourceFinalFeedbackExecuted: false,
  sourceGlossaryExecuted: false,
  sourceRandomExecuted: false,
  embeddedCoachAudioModeled: false,
  associatedAudioModeled: false,
  audioParityEstablished: false,
  hostWrongFeedbackResolved: false,
  hostGlossaryContentResolved: false,
  naturalTerminalContinuationEstablished: false,
  behaviorParityEstablished: false,
  replayParityEstablished: false,
  originalRuntimeAuthorityEstablished: false,
  fullFrameRmseEstablished: false,
  humanVisualReviewAccepted: false,
  ownerAccepted: false,
  strictMigrationComplete: false,
  strictAcceptanceEffect: "none",
});

const createEmptyPlacements = (): CourseG04L03In012Placements =>
  Object.freeze({
    Scr_1: null,
    Scr_2: null,
    Scr_3: null,
    Scr_4: null,
    Scr_5: null,
  });

const freezeState = (
  state: CourseG04L03In012OwingDragState,
): CourseG04L03In012OwingDragState => Object.freeze({
  ...state,
  placements: Object.freeze({...state.placements}),
});

const isKnownCardId = (
  cardId: string,
): cardId is CourseG04L03In012CardId =>
  COURSE_G04_L03_IN_012_CARDS.some(({id}) => id === cardId);

const isKnownTargetId = (
  targetId: string,
): targetId is CourseG04L03In012TargetId =>
  COURSE_G04_L03_IN_012_CARDS.some(({targetId: id}) => id === targetId);

const getCard = (
  cardId: CourseG04L03In012CardId,
): CourseG04L03In012Card | undefined =>
  COURSE_G04_L03_IN_012_CARDS.find(({id}) => id === cardId);

export const getCourseG04L03In012PlacementCount = (
  state: CourseG04L03In012OwingDragState,
): number => COURSE_G04_L03_IN_012_CARDS.reduce(
  (count, {id}) => count + (state.placements[id] === null ? 0 : 1),
  0,
);

export const createCourseG04L03In012OwingDragState =
  (): CourseG04L03In012OwingDragState => freezeState({
    placements: createEmptyPlacements(),
    selectedCardId: null,
    wrongCardId: null,
    lastPlacedCardId: null,
    attemptedTargetId: null,
    outcome: "ready",
    locked: false,
    feedback: null,
  });

export const reduceCourseG04L03In012OwingDrag = (
  state: CourseG04L03In012OwingDragState,
  action: CourseG04L03In012OwingDragAction,
): CourseG04L03In012OwingDragState => {
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
          feedback: COURSE_G04_L03_IN_012_WRONG_FEEDBACK,
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
        feedback: COURSE_G04_L03_IN_012_CORRECT_FEEDBACK,
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
      const allCardsPlaced = getCourseG04L03In012PlacementCount(state)
        === COURSE_G04_L03_IN_012_CARDS.length;
      return freezeState({
        ...state,
        selectedCardId: null,
        wrongCardId: null,
        attemptedTargetId: allCardsPlaced ? state.attemptedTargetId : null,
        outcome: allCardsPlaced ? "final-correct-feedback" : "ready",
        locked: allCardsPlaced,
        feedback: allCardsPlaced
          ? COURSE_G04_L03_IN_012_FINAL_CORRECT_FEEDBACK
          : null,
      });
    }

    case "final-feedback-complete":
      if (state.outcome !== "final-correct-feedback") return state;
      return freezeState({
        ...state,
        selectedCardId: null,
        wrongCardId: null,
        attemptedTargetId: null,
        outcome: "complete",
        locked: true,
        feedback: null,
      });

    case "replay":
      return createCourseG04L03In012OwingDragState();

    default:
      return state;
  }
};
