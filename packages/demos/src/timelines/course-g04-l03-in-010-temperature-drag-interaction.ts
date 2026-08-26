export type CourseG04L03In010CardId =
  | "Src_1"
  | "Src_2"
  | "Src_4"
  | "Src_5"
  | "Src_6"
  | "Src_7";

export type CourseG04L03In010TargetId =
  | "Mc_Tar_1"
  | "Mc_Tar_2"
  | "Mc_Tar_4"
  | "Mc_Tar_5"
  | "Mc_Tar_6"
  | "Mc_Tar_7";

export type CourseG04L03In010Outcome =
  | "ready"
  | "wrong"
  | "correct-feedback"
  | "final-correct-feedback"
  | "complete";

export interface CourseG04L03In010Point {
  readonly x: number;
  readonly y: number;
}

export interface CourseG04L03In010Size {
  readonly height: number;
  readonly width: number;
}

export interface CourseG04L03In010Bounds extends CourseG04L03In010Size {
  readonly bottom: number;
  readonly left: number;
  readonly right: number;
  readonly top: number;
}

export interface CourseG04L03In010PositionedBounds
  extends CourseG04L03In010Point, CourseG04L03In010Size {}

export interface CourseG04L03In010Geometry {
  readonly bounds: CourseG04L03In010Bounds;
  readonly center: CourseG04L03In010Point;
  readonly size: CourseG04L03In010Size;
}

export interface CourseG04L03In010Card {
  readonly id: CourseG04L03In010CardId;
  readonly suffix: 1 | 2 | 4 | 5 | 6 | 7;
  readonly city:
    | "Seattle"
    | "Chicago"
    | "Fraser"
    | "Reno"
    | "Pittsburgh"
    | "Houston";
  readonly stateAbbreviation: "WA" | "IL" | "CO" | "NV" | "PA" | "TX";
  readonly temperature: 51 | -4 | -18 | 33 | 34 | 80;
  readonly displayText: string;
  readonly sourceAuthoringText: string;
  readonly sourceTextDisposition:
    | "direct-authoring-text"
    | "authoring-text-plus-separate-minus-glyph";
  readonly targetText: string;
  readonly accessibleLabel: string;
  readonly sourceObjectId: 70 | 71 | 72 | 73 | 74 | 75;
  readonly sourceDepth: 83 | 86 | 90 | 93 | 96 | 99;
  readonly sourceCenter: CourseG04L03In010Point;
  readonly sourceSize: CourseG04L03In010Size;
  readonly sourceBounds: CourseG04L03In010Bounds;
  readonly targetId: CourseG04L03In010TargetId;
  readonly targetObjectId: 55 | 58 | 61 | 63 | 66 | 69;
  readonly targetDepth: 59 | 63 | 67 | 71 | 75 | 79;
  readonly targetCenter: CourseG04L03In010Point;
  readonly targetSize: CourseG04L03In010Size;
  readonly targetBounds: CourseG04L03In010Bounds;
}

export interface CourseG04L03In010GlossaryTerm {
  readonly id: "temperature" | "thermometer";
  readonly visibleText: "temperature" | "thermometer";
  readonly keyAttribute: "Temperature" | "Thermometer";
  readonly bounds: CourseG04L03In010PositionedBounds;
  readonly hostAction: "DoHyperLinks";
  readonly hostContentResolved: false;
  readonly enabled: false;
  readonly status: "safe-disabled";
}

export type CourseG04L03In010Placements = Readonly<
  Record<CourseG04L03In010CardId, CourseG04L03In010TargetId | null>
>;

export interface CourseG04L03In010TemperatureDragState {
  readonly placements: CourseG04L03In010Placements;
  readonly selectedCardId: CourseG04L03In010CardId | null;
  readonly wrongCardId: CourseG04L03In010CardId | null;
  readonly lastPlacedCardId: CourseG04L03In010CardId | null;
  readonly attemptedTargetId: CourseG04L03In010TargetId | null;
  readonly outcome: CourseG04L03In010Outcome;
  readonly locked: boolean;
  readonly feedback: string | null;
}

/**
 * Supplying `cardId` models a direct HTML drag/drop. Omitting it uses the
 * selected card and therefore supports the select-card-then-target path.
 */
export type CourseG04L03In010TemperatureDragAction =
  | Readonly<{
      type: "select-card";
      cardId: CourseG04L03In010CardId;
    }>
  | Readonly<{
      type: "drop-card";
      cardId?: CourseG04L03In010CardId;
      targetId: CourseG04L03In010TargetId;
    }>
  | Readonly<{type: "close-wrong"}>
  | Readonly<{type: "feedback-complete"}>
  | Readonly<{type: "final-feedback-complete"}>
  | Readonly<{type: "replay"}>;

const freezePoint = (
  point: CourseG04L03In010Point,
): CourseG04L03In010Point => Object.freeze({...point});

const freezeSize = (
  size: CourseG04L03In010Size,
): CourseG04L03In010Size => Object.freeze({...size});

const freezeBounds = (
  bounds: CourseG04L03In010Bounds,
): CourseG04L03In010Bounds => Object.freeze({...bounds});

const freezePositionedBounds = (
  bounds: CourseG04L03In010PositionedBounds,
): CourseG04L03In010PositionedBounds => Object.freeze({...bounds});

const freezeGeometry = (
  center: CourseG04L03In010Point,
  bounds: CourseG04L03In010Bounds,
): CourseG04L03In010Geometry => Object.freeze({
  center: freezePoint(center),
  size: freezeSize({width: bounds.width, height: bounds.height}),
  bounds: freezeBounds(bounds),
});

/**
 * Candidate stage-space bounds derived from the hash-bound FLA authoring
 * structure. They have not been measured in an authoritative original runtime.
 */
const CARD_GEOMETRY = Object.freeze({
  Src_1: freezeGeometry(
    {x: 236.6, y: 155.9},
    {
      left: 174.075,
      top: 143.725,
      right: 299.125,
      bottom: 168.075,
      width: 125.05,
      height: 24.35,
    },
  ),
  Src_2: freezeGeometry(
    {x: 518.9, y: 263.35},
    {
      left: 463.15,
      top: 254.675,
      right: 574.65,
      bottom: 272.025,
      width: 111.5,
      height: 17.35,
    },
  ),
  Src_4: freezeGeometry(
    {x: 362, y: 276.85},
    {
      left: 306.25,
      top: 268.175,
      right: 417.75,
      bottom: 285.525,
      width: 111.5,
      height: 17.35,
    },
  ),
  Src_5: freezeGeometry(
    {x: 240.9, y: 246.8},
    {
      left: 185.15,
      top: 238.125,
      right: 296.65,
      bottom: 255.475,
      width: 111.5,
      height: 17.35,
    },
  ),
  Src_6: freezeGeometry(
    {x: 622.825, y: 247.325},
    {
      left: 564.9,
      top: 238.65,
      right: 680.75,
      bottom: 256,
      width: 115.85,
      height: 17.35,
    },
  ),
  Src_7: freezeGeometry(
    {x: 431.7, y: 368.6},
    {
      left: 375.95,
      top: 359.925,
      right: 487.45,
      bottom: 377.275,
      width: 111.5,
      height: 17.35,
    },
  ),
});

const TARGET_GEOMETRY = Object.freeze({
  Mc_Tar_1: freezeGeometry(
    {x: 155.45, y: 245.45},
    {
      left: 86.525,
      top: 237.45,
      right: 224.375,
      bottom: 253.45,
      width: 137.85,
      height: 16,
    },
  ),
  Mc_Tar_2: freezeGeometry(
    {x: 144.55, y: 393},
    {
      left: 80.95,
      top: 383.825,
      right: 208.15,
      bottom: 402.175,
      width: 127.2,
      height: 18.35,
    },
  ),
  Mc_Tar_4: freezeGeometry(
    {x: 147.8, y: 431},
    {
      left: 87.825,
      top: 422.95,
      right: 207.775,
      bottom: 439.05,
      width: 119.95,
      height: 16.1,
    },
  ),
  Mc_Tar_5: freezeGeometry(
    {x: 144.45, y: 297.85},
    {
      left: 86.65,
      top: 289.85,
      right: 202.25,
      bottom: 305.85,
      width: 115.6,
      height: 16,
    },
  ),
  Mc_Tar_6: freezeGeometry(
    {x: 156.95, y: 285},
    {
      left: 86.1,
      top: 274.825,
      right: 227.8,
      bottom: 295.175,
      width: 141.7,
      height: 20.35,
    },
  ),
  Mc_Tar_7: freezeGeometry(
    {x: 152.9, y: 164.45},
    {
      left: 86.975,
      top: 156.45,
      right: 218.825,
      bottom: 172.45,
      width: 131.85,
      height: 16,
    },
  ),
});

export const COURSE_G04_L03_IN_010_SOURCE_GEOMETRY = Object.freeze({
  stage: Object.freeze({width: 800, height: 600}),
  backgroundColor: "#b8d8f7" as const,
  fps: 12,
  rootFrameCount: 10,
  rootPlacement: freezePoint({x: 413.4, y: 283.3}),
  frameDomain: "sprite-90" as const,
  frameCount: 264,
  interactionFrame: 264,
  initialInteractionDonorFrame: 263,
  postDropVisualDonorFrame: null,
  postDropVisualDisposition:
    "frame-263-is-initial-only-object-filtered-or-reconstructed-underlay-required",
  instructionBounds: freezeBounds({
    left: 60.9,
    top: 83.65,
    right: 730.4,
    bottom: 105.65,
    width: 669.5,
    height: 22,
  }),
  cards: CARD_GEOMETRY,
  targets: TARGET_GEOMETRY,
});

const freezeCard = (
  card: CourseG04L03In010Card,
): CourseG04L03In010Card => Object.freeze({...card});

export const COURSE_G04_L03_IN_010_CARDS:
  readonly CourseG04L03In010Card[] = Object.freeze([
    freezeCard({
      id: "Src_1",
      suffix: 1,
      city: "Seattle",
      stateAbbreviation: "WA",
      temperature: 51,
      displayText: "Seattle, WA: 51° F",
      sourceAuthoringText: "Seattle, WA: 51° F",
      sourceTextDisposition: "direct-authoring-text",
      targetText: "Seattle, WA: 51° F",
      accessibleLabel: "Seattle, Washington, 51 degrees Fahrenheit",
      sourceObjectId: 70,
      sourceDepth: 83,
      sourceCenter: CARD_GEOMETRY.Src_1.center,
      sourceSize: CARD_GEOMETRY.Src_1.size,
      sourceBounds: CARD_GEOMETRY.Src_1.bounds,
      targetId: "Mc_Tar_1",
      targetObjectId: 63,
      targetDepth: 71,
      targetCenter: TARGET_GEOMETRY.Mc_Tar_1.center,
      targetSize: TARGET_GEOMETRY.Mc_Tar_1.size,
      targetBounds: TARGET_GEOMETRY.Mc_Tar_1.bounds,
    }),
    freezeCard({
      id: "Src_2",
      suffix: 2,
      city: "Chicago",
      stateAbbreviation: "IL",
      temperature: -4,
      displayText: "Chicago, IL: -4° F",
      sourceAuthoringText: "Chicago, IL:  4° F",
      sourceTextDisposition: "authoring-text-plus-separate-minus-glyph",
      targetText: "Chicago, IL: -4° F",
      accessibleLabel: "Chicago, Illinois, negative 4 degrees Fahrenheit",
      sourceObjectId: 75,
      sourceDepth: 99,
      sourceCenter: CARD_GEOMETRY.Src_2.center,
      sourceSize: CARD_GEOMETRY.Src_2.size,
      sourceBounds: CARD_GEOMETRY.Src_2.bounds,
      targetId: "Mc_Tar_2",
      targetObjectId: 58,
      targetDepth: 63,
      targetCenter: TARGET_GEOMETRY.Mc_Tar_2.center,
      targetSize: TARGET_GEOMETRY.Mc_Tar_2.size,
      targetBounds: TARGET_GEOMETRY.Mc_Tar_2.bounds,
    }),
    freezeCard({
      id: "Src_4",
      suffix: 4,
      city: "Fraser",
      stateAbbreviation: "CO",
      temperature: -18,
      displayText: "Fraser, CO -18°F",
      sourceAuthoringText: "Fraser, CO  18°F",
      sourceTextDisposition: "authoring-text-plus-separate-minus-glyph",
      targetText: "Fraser, CO -18°F",
      accessibleLabel: "Fraser, Colorado, negative 18 degrees Fahrenheit",
      sourceObjectId: 71,
      sourceDepth: 86,
      sourceCenter: CARD_GEOMETRY.Src_4.center,
      sourceSize: CARD_GEOMETRY.Src_4.size,
      sourceBounds: CARD_GEOMETRY.Src_4.bounds,
      targetId: "Mc_Tar_4",
      targetObjectId: 61,
      targetDepth: 67,
      targetCenter: TARGET_GEOMETRY.Mc_Tar_4.center,
      targetSize: TARGET_GEOMETRY.Mc_Tar_4.size,
      targetBounds: TARGET_GEOMETRY.Mc_Tar_4.bounds,
    }),
    freezeCard({
      id: "Src_5",
      suffix: 5,
      city: "Reno",
      stateAbbreviation: "NV",
      temperature: 33,
      displayText: "Reno, NV: 33° F",
      sourceAuthoringText: "Reno, NV: 33° F",
      sourceTextDisposition: "direct-authoring-text",
      targetText: "Reno, NV: 33° F",
      accessibleLabel: "Reno, Nevada, 33 degrees Fahrenheit",
      sourceObjectId: 72,
      sourceDepth: 90,
      sourceCenter: CARD_GEOMETRY.Src_5.center,
      sourceSize: CARD_GEOMETRY.Src_5.size,
      sourceBounds: CARD_GEOMETRY.Src_5.bounds,
      targetId: "Mc_Tar_5",
      targetObjectId: 55,
      targetDepth: 59,
      targetCenter: TARGET_GEOMETRY.Mc_Tar_5.center,
      targetSize: TARGET_GEOMETRY.Mc_Tar_5.size,
      targetBounds: TARGET_GEOMETRY.Mc_Tar_5.bounds,
    }),
    freezeCard({
      id: "Src_6",
      suffix: 6,
      city: "Pittsburgh",
      stateAbbreviation: "PA",
      temperature: 34,
      displayText: "Pittsburgh, PA: 34° F",
      sourceAuthoringText: "Pittsburgh, PA: 34° F",
      sourceTextDisposition: "direct-authoring-text",
      targetText: "Pittsburgh, PA: 34° F",
      accessibleLabel: "Pittsburgh, Pennsylvania, 34 degrees Fahrenheit",
      sourceObjectId: 73,
      sourceDepth: 93,
      sourceCenter: CARD_GEOMETRY.Src_6.center,
      sourceSize: CARD_GEOMETRY.Src_6.size,
      sourceBounds: CARD_GEOMETRY.Src_6.bounds,
      targetId: "Mc_Tar_6",
      targetObjectId: 69,
      targetDepth: 79,
      targetCenter: TARGET_GEOMETRY.Mc_Tar_6.center,
      targetSize: TARGET_GEOMETRY.Mc_Tar_6.size,
      targetBounds: TARGET_GEOMETRY.Mc_Tar_6.bounds,
    }),
    freezeCard({
      id: "Src_7",
      suffix: 7,
      city: "Houston",
      stateAbbreviation: "TX",
      temperature: 80,
      displayText: "Houston, TX: 80° F",
      sourceAuthoringText: "Houston, TX: 80° F",
      sourceTextDisposition: "direct-authoring-text",
      targetText: "Houston, TX: 80° F",
      accessibleLabel: "Houston, Texas, 80 degrees Fahrenheit",
      sourceObjectId: 74,
      sourceDepth: 96,
      sourceCenter: CARD_GEOMETRY.Src_7.center,
      sourceSize: CARD_GEOMETRY.Src_7.size,
      sourceBounds: CARD_GEOMETRY.Src_7.bounds,
      targetId: "Mc_Tar_7",
      targetObjectId: 66,
      targetDepth: 75,
      targetCenter: TARGET_GEOMETRY.Mc_Tar_7.center,
      targetSize: TARGET_GEOMETRY.Mc_Tar_7.size,
      targetBounds: TARGET_GEOMETRY.Mc_Tar_7.bounds,
    }),
  ]);

export const COURSE_G04_L03_IN_010_FIXED_REFERENCE = Object.freeze({
  text: "New York, NY: 43° F",
  temperature: 43,
  role: "fixed-non-draggable-reference" as const,
  draggableSuffix: null,
});

export const COURSE_G04_L03_IN_010_INSTRUCTION =
  "Drag and drop each city and temperature to the correct degree on the thermometer.";

/**
 * `_global.WrongFeed` is assigned at runtime by an unresolved host. The Canvas
 * glyph is retained as evidence metadata, never promoted to resolved host copy.
 */
export const COURSE_G04_L03_IN_010_WRONG_FEEDBACK = Object.freeze({
  hostVariable: "_global.WrongFeed" as const,
  resolvedHostText: null,
  canvasStaticGlyph: "Try Again!" as const,
  canvasStaticGlyphMaySubstituteForHostText: false,
  closeLabel: "Close" as const,
  dismissal: "explicit-close" as const,
});

/** Modern assistive acknowledgement; source text parity is not claimed. */
export const COURSE_G04_L03_IN_010_ASSISTIVE_CORRECT_FEEDBACK = "Correct.";

/** Exact final text recovered from the source authoring structure. */
export const COURSE_G04_L03_IN_010_FINAL_CORRECT_FEEDBACK = "Correct!!!";

/**
 * Current-JavaScript projections from source timeline windows. These values are
 * not authoritative original-runtime timing traces.
 */
export const COURSE_G04_L03_IN_010_CURRENT_JS_TIMING = Object.freeze({
  perCardCorrectFeedbackMs: 1_500,
  perCardFrameDomain: "sprite-89" as const,
  perCardFirstFrame: 2,
  perCardLastVisualFrame: 19,
  perCardEnableButtonFrame: 20,
  wrongFrameDomain: "sprite-87" as const,
  wrongFirstFrame: 2,
  wrongStopFrame: 15,
  wrongDismissal: "explicit-close" as const,
  finalCorrectFeedbackMs: (23 * 1_000) / 12,
  finalFrameDomain: "sprite-52" as const,
  finalFirstFrame: 2,
  finalLastVisualFrame: 24,
  finalTerminalScriptFrame: 25,
});

const freezeGlossaryTerm = (
  term: CourseG04L03In010GlossaryTerm,
): CourseG04L03In010GlossaryTerm => Object.freeze({...term});

/**
 * The two source hotspots call the unresolved host `DoHyperLinks` function.
 * Their keys and FLA-derived candidate bounds are retained but safe-disabled.
 */
export const COURSE_G04_L03_IN_010_SOURCE_GLOSSARY_TERMS:
  readonly CourseG04L03In010GlossaryTerm[] = Object.freeze([
    freezeGlossaryTerm({
      id: "temperature",
      visibleText: "temperature",
      keyAttribute: "Temperature",
      bounds: freezePositionedBounds({
        x: 286.45,
        y: 90.4,
        width: 94.55,
        height: 15.7,
      }),
      hostAction: "DoHyperLinks",
      hostContentResolved: false,
      enabled: false,
      status: "safe-disabled",
    }),
    freezeGlossaryTerm({
      id: "thermometer",
      visibleText: "thermometer",
      keyAttribute: "Thermometer",
      bounds: freezePositionedBounds({
        x: 606,
        y: 90.4,
        width: 99.45,
        height: 15.7,
      }),
      hostAction: "DoHyperLinks",
      hostContentResolved: false,
      enabled: false,
      status: "safe-disabled",
    }),
  ]);

export const COURSE_G04_L03_IN_010_INPUT_METHODS = Object.freeze([
  "html-drag",
  "select-card-then-target",
] as const);

/**
 * Every boolean is an evidence/acceptance gate and remains false. The pure
 * reducer is authorized as an engineering candidate, not as runtime parity.
 */
export const COURSE_G04_L03_IN_010_INTERACTION_AUTHORITY = Object.freeze({
  evidenceBasis:
    "hash-bound-fla-authoring-geometry-and-swf-avm1-suffix-drop-handlers",
  implementationKind: "current-javascript-pure-state-candidate",
  mappingDisposition: "exact-swf-suffix-identity-mapping",
  boundsDisposition:
    "fla-authoring-derived-stage-candidates-not-original-runtime-measurements",
  wrongFeedbackTextDisposition:
    "host-global-unresolved-canvas-glyph-not-promoted",
  perCardCorrectFeedbackTextDisposition:
    "modern-assistive-not-source-exact",
  finalCorrectFeedbackTextDisposition:
    "source-authoring-text-modern-persistent",
  timingDisposition:
    "current-javascript-source-window-projections",
  glossaryDisposition:
    "source-hotspots-safe-disabled-host-content-unresolved",
  inputAdaptationDisposition:
    "html-drag-and-select-card-then-target-current-javascript",
  wrongLockDisposition:
    "explicit-close-current-javascript-projection-of-source-popup",
  postDropVisualDisposition:
    "frame-263-initial-only-not-post-drop-source-hide-parity",
  terminalDisposition:
    "two-feedback-phases-then-persistent-current-javascript-terminal",
  replayDisposition:
    "current-javascript-whole-state-reset-without-source-control-parity",
  unknownInputDisposition: "fail-closed-identity-action-and-phase",
  naturalInteractionReachabilityEstablished: false,
  sourceDragDropExecuted: false,
  sourceDropTargetHitBoundsMeasured: false,
  sourceWrongFeedbackExecuted: false,
  sourceCorrectFeedbackExecuted: false,
  sourceFinalFeedbackExecuted: false,
  sourceGlossaryExecuted: false,
  hostWrongFeedbackResolved: false,
  hostGlossaryContentResolved: false,
  hostEnableButtonResolved: false,
  hostMc1SideEffectResolved: false,
  sourceHideVisualParityEstablished: false,
  frame263PostDropVisualParityEstablished: false,
  perCardCorrectFeedbackTimerIsOriginalRuntimeTrace: false,
  finalCorrectFeedbackTimerIsOriginalRuntimeTrace: false,
  embeddedCoachAudioModeled: false,
  associatedAudioModeled: false,
  audioParityEstablished: false,
  spanishInteractionEstablished: false,
  naturalTerminalContinuationEstablished: false,
  persistentTerminalIsOriginalRuntimeTrace: false,
  sourceReplayControlEstablished: false,
  behaviorParityEstablished: false,
  replayParityEstablished: false,
  originalRuntimeAuthorityEstablished: false,
  fullFrameRmseEstablished: false,
  humanVisualReviewAccepted: false,
  ownerAccepted: false,
  strictMigrationComplete: false,
  strictAcceptanceEffect: "none",
});

const createEmptyPlacements = (): CourseG04L03In010Placements =>
  Object.freeze({
    Src_1: null,
    Src_2: null,
    Src_4: null,
    Src_5: null,
    Src_6: null,
    Src_7: null,
  });

const freezeState = (
  state: CourseG04L03In010TemperatureDragState,
): CourseG04L03In010TemperatureDragState => Object.freeze({
  ...state,
  placements: Object.freeze({...state.placements}),
});

const isKnownCardId = (
  cardId: unknown,
): cardId is CourseG04L03In010CardId =>
  typeof cardId === "string"
  && COURSE_G04_L03_IN_010_CARDS.some(({id}) => id === cardId);

const isKnownTargetId = (
  targetId: unknown,
): targetId is CourseG04L03In010TargetId =>
  typeof targetId === "string"
  && COURSE_G04_L03_IN_010_CARDS.some(({targetId: id}) => id === targetId);

const getCard = (
  cardId: CourseG04L03In010CardId,
): CourseG04L03In010Card | undefined =>
  COURSE_G04_L03_IN_010_CARDS.find(({id}) => id === cardId);

export const getCourseG04L03In010PlacementCount = (
  state: CourseG04L03In010TemperatureDragState,
): number => COURSE_G04_L03_IN_010_CARDS.reduce(
  (count, {id}) => count + (state.placements[id] === null ? 0 : 1),
  0,
);

export const createCourseG04L03In010TemperatureDragState =
  (): CourseG04L03In010TemperatureDragState => freezeState({
    placements: createEmptyPlacements(),
    selectedCardId: null,
    wrongCardId: null,
    lastPlacedCardId: null,
    attemptedTargetId: null,
    outcome: "ready",
    locked: false,
    feedback: null,
  });

export const reduceCourseG04L03In010TemperatureDrag = (
  state: CourseG04L03In010TemperatureDragState,
  action: CourseG04L03In010TemperatureDragAction,
): CourseG04L03In010TemperatureDragState => {
  if (action === null || typeof action !== "object") return state;

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
          feedback: COURSE_G04_L03_IN_010_WRONG_FEEDBACK.resolvedHostText,
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
        feedback: COURSE_G04_L03_IN_010_ASSISTIVE_CORRECT_FEEDBACK,
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
      const allCardsPlaced = getCourseG04L03In010PlacementCount(state)
        === COURSE_G04_L03_IN_010_CARDS.length;
      return freezeState({
        ...state,
        selectedCardId: null,
        wrongCardId: null,
        attemptedTargetId: allCardsPlaced ? state.attemptedTargetId : null,
        outcome: allCardsPlaced ? "final-correct-feedback" : "ready",
        locked: allCardsPlaced,
        feedback: allCardsPlaced
          ? COURSE_G04_L03_IN_010_FINAL_CORRECT_FEEDBACK
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
      return createCourseG04L03In010TemperatureDragState();

    default:
      return state;
  }
};
