import {COURSE_G04_L11_TI_003_GLOSSARY,
  COURSE_G04_L11_TI_003_INITIAL_COORDINATE_POOL,
  COURSE_G04_L11_TI_003_REPLACEMENT_COORDINATE_POOL} from
  "../source-static/g4-l11/course-g04-l11-ti-003-static";
import {getCourseG04L11Ti003CandidateCanvasFrame} from "./course-g04-l11-ti-003";

export const COURSE_G04_L11_TI_003_INTERACTION_SOURCE = Object.freeze({
  animationId: "course-g04-l11-ti-003",
  sourceSwfSha256:
    "83b37fa15719e6e50b328ea8621a19a9d362351a706be333b48b2d6730ecc987",
  sourceFlaSha256:
    "6197a41fd60bd1f18a2f54b911e0498c0c57dffb4091d46e6253747752a387d0",
  sourceTimelineId: "sprite-346", sourceFrameCount: 236,
  naturalQuizStopFrame: 235, modernInteractionBackgroundFrame: 230,
  prompt:
    "Click the exact location of the ordered pair on the coordinate grid. Click Next Ordered Pair as many times as you like to plot different ordered pairs.",
  gridMinimum: 0, gridMaximum: 10, sourceGridPointCount: 121,
  sourceInitialPoolCount: 14, sourceReplacementPoolCount: 18,
  sourceGlossaryVocabularyCount: 12, sourceHelpControlCount: 1,
  sourceEmbeddedStreamCount: 8, sourceAudioAccepted: false,
  sourceReplacementPoolLenghtDefectResolved: false,
  sourceReplacementPoolRepairAuthorized: false,
  legacyCourseShellRequired: false, spanishSourceVisualParityEstablished: false,
});

export type CourseG04L11Ti003GlossaryId =
  (typeof COURSE_G04_L11_TI_003_GLOSSARY)[number]["id"];
export type CourseG04L11Ti003CoachVariant = "S1" | "S2" | "S3" | "S4";
export interface CourseG04L11Ti003Coordinate {readonly id: string;
  readonly x: number; readonly y: number;}
export interface CourseG04L11Ti003PlotState {
  readonly frame: number; readonly sourceCanvasFrame: number;
  readonly phase: "instruction" | "plotting" | "wrong-feedback" |
    "correct-feedback" | "help" | "glossary" | "source-defect";
  readonly playing: boolean; readonly seed: number; readonly selectionIndex: number;
  readonly currentPair: CourseG04L11Ti003Coordinate;
  readonly remainingInitialPairIds: readonly string[];
  readonly usedInitialPairIds: readonly string[];
  readonly cursor: Readonly<{x: number; y: number}>;
  readonly plottedPair: CourseG04L11Ti003Coordinate | null;
  readonly nextOrderedPairEnabled: boolean; readonly popupOpen: boolean;
  readonly feedbackMessage: string | null;
  readonly coachVariant: CourseG04L11Ti003CoachVariant | null;
  readonly wrongAttemptCount: number; readonly helpOpen: boolean;
  readonly selectedGlossaryId: CourseG04L11Ti003GlossaryId | null;
  readonly sourceReplacementPoolEntered: false;
  readonly sourceReplacementPoolRepairApplied: false;
  readonly sourceDefectReached: boolean; readonly interactionRevision: number;
  readonly legacyHostCallCount: 0; readonly sourceAudioEnabled: false;
  readonly sourceAudioAccepted: false; readonly sourcePointHitGeometryEstablished: false;
  readonly hostFeedbackSelectionEstablished: false;
}
export type CourseG04L11Ti003PlotEvent =
  | Readonly<{type: "synchronize-frame"; frame: number}>
  | Readonly<{type: "set-cursor"; x: number; y: number}>
  | Readonly<{type: "submit-point"}>
  | Readonly<{type: "close-feedback"}>
  | Readonly<{type: "next-ordered-pair"}>
  | Readonly<{type: "open-help"}>
  | Readonly<{type: "close-help"}>
  | Readonly<{type: "open-glossary"; glossaryId: CourseG04L11Ti003GlossaryId}>
  | Readonly<{type: "close-glossary"}>
  | Readonly<{type: "replay"; seed?: number}>;

export const COURSE_G04_L11_TI_003_INTERACTION_AUTHORITY = Object.freeze({
  implementationCandidateOnly: true, sourceCanvasSequenceRetained: true,
  animationInternalPedagogicalControlsPreserved: true,
  source121HitTargetsReplacedByAccessibleTwoAxisCoordinatePicker: true,
  sourcePointHitGeometryEstablished: false, initialCoordinatePoolPreserved: 14,
  replacementCoordinatePoolRecorded: 18,
  replacementPoolLenghtDefectSilentlyRepaired: false,
  replacementPoolProductRepairAuthorized: false,
  correctFeedbackThenNextGatePreserved: true, wrongFeedbackRetryPreserved: true,
  helpFunctionPreserved: true, glossaryVocabularyPreserved: 12,
  hostFeedbackAndCoachSelectionReplacedByDeterministicFixtureForQa: true,
  legacyCourseShellNavigationIncluded: false, legacyPlayerChromeIncluded: false,
  legacyGlobalsExecuted: false, legacyDoHyperLinksExecuted: false,
  sourceAudioEnabled: false, sourceAudioAccepted: false,
  spanishSourceVisualParityEstablished: false, sourceDomainDeclared: false,
  registeredCurrentJavascript: false, authoritativeOriginalRuntimeAccepted: false,
  behaviorParityEstablished: false, visualFidelityEstablished: false,
  humanVisualReviewAccepted: false, ownerAccepted: false,
  strictMigrationComplete: false, lessonReleased: false, published: false,
  strictAcceptanceEffect: "none",
});

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
function exactFrame(frame: number) {
  invariant(Number.isInteger(frame) && frame >= 1 && frame <= 236,
    `invalid TI003 local frame: ${frame}`); return frame;
}
function exactCoordinate(value: number, axis: "x" | "y") {
  invariant(Number.isInteger(value) && value >= 0 && value <= 10,
    `invalid TI003 ${axis}-coordinate: ${value}`); return value;
}
function normalizeSeed(seed: number) {
  invariant(Number.isFinite(seed), "TI003 seed must be finite");
  return Math.trunc(seed) >>> 0;
}
function selection(seed: number, index: number, count: number) {
  invariant(Number.isSafeInteger(index) && index >= 0 && count > 0,
    "TI003 deterministic selection input is invalid");
  let value = (seed ^ Math.imul(index, 0x9e3779b9)) >>> 0;
  value ^= value << 13; value ^= value >>> 17; value ^= value << 5;
  return (value >>> 0) % count;
}
const COACH_VARIANTS = Object.freeze(["S1", "S2", "S3", "S4"] as const);
const initialById = (id: string) =>
  COURSE_G04_L11_TI_003_INITIAL_COORDINATE_POOL.find((pair) => pair.id === id) ?? null;
const glossaryById = (id: string) =>
  COURSE_G04_L11_TI_003_GLOSSARY.find((term) => term.id === id) ?? null;
function freezeState(state: Omit<CourseG04L11Ti003PlotState,
  "remainingInitialPairIds" | "usedInitialPairIds" | "cursor"> & {
  remainingInitialPairIds: readonly string[]; usedInitialPairIds: readonly string[];
  cursor: Readonly<{x: number; y: number}>;
}): CourseG04L11Ti003PlotState {
  return Object.freeze({...state,
    currentPair: Object.freeze({...state.currentPair}),
    remainingInitialPairIds: Object.freeze([...state.remainingInitialPairIds]),
    usedInitialPairIds: Object.freeze([...state.usedInitialPairIds]),
    cursor: Object.freeze({...state.cursor}),
    plottedPair: state.plottedPair ? Object.freeze({...state.plottedPair}) : null});
}
function selectInitialPair(seed: number, selectionIndex: number, ids: readonly string[]) {
  invariant(ids.length > 0, "TI003 initial coordinate pool is exhausted");
  const offset = selection(seed, selectionIndex, ids.length); const id = ids[offset];
  const pair = initialById(id); invariant(pair, `unknown TI003 initial pair: ${id}`);
  return Object.freeze({pair, remaining: Object.freeze(ids.filter((_, index) => index !== offset))});
}

export function createCourseG04L11Ti003PlotState(initialFrame = 1, seed = 0):
CourseG04L11Ti003PlotState {
  const requested = exactFrame(initialFrame); const normalizedSeed = normalizeSeed(seed);
  const all = COURSE_G04_L11_TI_003_INITIAL_COORDINATE_POOL.map((pair) => pair.id);
  const selected = selectInitialPair(normalizedSeed, 0, all);
  const frame = Math.min(requested, 235);
  return freezeState({frame,
    sourceCanvasFrame: getCourseG04L11Ti003CandidateCanvasFrame(frame),
    phase: frame >= 235 ? "plotting" : "instruction", playing: frame < 235,
    seed: normalizedSeed, selectionIndex: 0, currentPair: selected.pair,
    remainingInitialPairIds: selected.remaining,
    usedInitialPairIds: [selected.pair.id], cursor: {x: 0, y: 0}, plottedPair: null,
    nextOrderedPairEnabled: false, popupOpen: false, feedbackMessage: null,
    coachVariant: null, wrongAttemptCount: 0, helpOpen: false,
    selectedGlossaryId: null, sourceReplacementPoolEntered: false,
    sourceReplacementPoolRepairApplied: false, sourceDefectReached: false,
    interactionRevision: 0, legacyHostCallCount: 0, sourceAudioEnabled: false,
    sourceAudioAccepted: false, sourcePointHitGeometryEstablished: false,
    hostFeedbackSelectionEstablished: false});
}

export function getCourseG04L11Ti003SelectedGlossary(state: CourseG04L11Ti003PlotState) {
  return state.selectedGlossaryId ? glossaryById(state.selectedGlossaryId) : null;
}
export function getCourseG04L11Ti003ReplacementPool() {
  return COURSE_G04_L11_TI_003_REPLACEMENT_COORDINATE_POOL;
}

export function reduceCourseG04L11Ti003Plot(state: CourseG04L11Ti003PlotState,
  event: CourseG04L11Ti003PlotEvent): CourseG04L11Ti003PlotState {
  invariant(Object.isFrozen(state) && Object.isFrozen(state.remainingInitialPairIds) &&
    Object.isFrozen(state.usedInitialPairIds) && Object.isFrozen(state.cursor),
  "TI003 state must be frozen");
  switch (event.type) {
    case "synchronize-frame": {
      const requested = exactFrame(event.frame); const frame = Math.min(requested, 235);
      return freezeState({...state, frame,
        sourceCanvasFrame: getCourseG04L11Ti003CandidateCanvasFrame(frame),
        phase: state.popupOpen || state.helpOpen || state.selectedGlossaryId ||
          state.sourceDefectReached ? state.phase : frame >= 235 ? "plotting" : "instruction",
        playing: frame < 235 && !state.popupOpen && !state.helpOpen &&
          !state.selectedGlossaryId});
    }
    case "set-cursor": {
      const x = exactCoordinate(event.x, "x"); const y = exactCoordinate(event.y, "y");
      invariant(state.phase === "plotting" && !state.popupOpen &&
        !state.nextOrderedPairEnabled, "TI003 coordinate picker is not available");
      return freezeState({...state, cursor: {x, y},
        interactionRevision: state.interactionRevision + 1});
    }
    case "submit-point": {
      invariant(state.phase === "plotting" && !state.popupOpen &&
        !state.nextOrderedPairEnabled, "TI003 point submission is not available");
      const correct = state.cursor.x === state.currentPair.x &&
        state.cursor.y === state.currentPair.y;
      if (!correct) {
        const wrongAttemptCount = state.wrongAttemptCount + 1;
        return freezeState({...state, phase: "wrong-feedback", popupOpen: true,
          wrongAttemptCount,
          coachVariant: COACH_VARIANTS[selection(state.seed, wrongAttemptCount, 4)],
          feedbackMessage:
            "The first number tells how many units over on the x-axis, and the second tells how many units up. Try again!",
          interactionRevision: state.interactionRevision + 1});
      }
      return freezeState({...state, phase: "correct-feedback", popupOpen: true,
        plottedPair: state.currentPair, coachVariant: null,
        feedbackMessage: `Correct! (${state.currentPair.x},${state.currentPair.y}) is plotted.`,
        interactionRevision: state.interactionRevision + 1});
    }
    case "close-feedback": {
      invariant(state.popupOpen && (state.phase === "wrong-feedback" ||
        state.phase === "correct-feedback"), "TI003 feedback is not open");
      return freezeState({...state, phase: "plotting", popupOpen: false,
        feedbackMessage: null, coachVariant: null,
        nextOrderedPairEnabled: state.phase === "correct-feedback",
        interactionRevision: state.interactionRevision + 1});
    }
    case "next-ordered-pair": {
      invariant(state.phase === "plotting" && state.nextOrderedPairEnabled &&
        !state.popupOpen, "TI003 Next Ordered Pair is not available");
      if (state.remainingInitialPairIds.length === 0) {
        return freezeState({...state, phase: "source-defect",
          nextOrderedPairEnabled: false, sourceDefectReached: true,
          feedbackMessage:
            "The source replacement-pool branch uses arr.lenght. Its Adobe runtime result is unresolved, so this candidate does not silently repair it.",
          interactionRevision: state.interactionRevision + 1});
      }
      const selectionIndex = state.selectionIndex + 1;
      const selected = selectInitialPair(state.seed, selectionIndex,
        state.remainingInitialPairIds);
      return freezeState({...state, selectionIndex, currentPair: selected.pair,
        remainingInitialPairIds: selected.remaining,
        usedInitialPairIds: [...state.usedInitialPairIds, selected.pair.id],
        cursor: {x: 0, y: 0}, plottedPair: null,
        nextOrderedPairEnabled: false, feedbackMessage: null,
        interactionRevision: state.interactionRevision + 1});
    }
    case "open-help":
      invariant(state.phase === "plotting" && !state.popupOpen,
        "TI003 help is not available");
      return freezeState({...state, phase: "help", helpOpen: true,
        interactionRevision: state.interactionRevision + 1});
    case "close-help":
      if (state.phase !== "help" || !state.helpOpen) return state;
      return freezeState({...state, phase: "plotting", helpOpen: false,
        interactionRevision: state.interactionRevision + 1});
    case "open-glossary":
      invariant(glossaryById(event.glossaryId),
        `unknown TI003 glossary term: ${event.glossaryId}`);
      invariant(state.phase === "plotting" && !state.popupOpen,
        "TI003 glossary is not available");
      return freezeState({...state, phase: "glossary",
        selectedGlossaryId: event.glossaryId,
        interactionRevision: state.interactionRevision + 1});
    case "close-glossary":
      if (state.phase !== "glossary" || !state.selectedGlossaryId) return state;
      return freezeState({...state, phase: "plotting", selectedGlossaryId: null,
        interactionRevision: state.interactionRevision + 1});
    case "replay":
      return createCourseG04L11Ti003PlotState(1,
        event.seed === undefined ? state.seed : event.seed);
    default: return event satisfies never;
  }
}
