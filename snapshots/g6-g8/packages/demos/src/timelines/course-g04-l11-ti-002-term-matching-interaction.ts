import {COURSE_G04_L11_TI_002_GLOSSARY, COURSE_G04_L11_TI_002_MATCHES,
  COURSE_G04_L11_TI_002_TARGET_ROWS} from
  "../source-static/g4-l11/course-g04-l11-ti-002-static";
import {getCourseG04L11Ti002CandidateCanvasFrame} from "./course-g04-l11-ti-002";

export const COURSE_G04_L11_TI_002_INTERACTION_SOURCE = Object.freeze({
  animationId: "course-g04-l11-ti-002",
  sourceSwfSha256:
    "80c3b4c7ab4f69e0f7cc9f41cf8a6ca310d4724865d270f235cc580a4ea7df22",
  sourceFlaSha256:
    "dfd919b45da3817828cfd3accbdf238c510f5e29753f76a8c16b90c1a53ccec3",
  sourceTimelineId: "sprite-325", sourceFrameCount: 247,
  naturalQuizStopFrame: 230, terminalFrame: 247,
  modernInteractionBackgroundFrame: 229,
  prompt:
    "Match the key terms with the most correct definitions and pictures. Several of these definitions will have more than one correct answer. Choose the best answer. Click and drag the key terms to place them where they belong.",
  sourceTermCount: 5, sourceTargetCount: 5, sourcePictureControlCount: 5,
  sourceGlossaryVocabularyCount: 15, sourceEmbeddedStreamCount: 8,
  sourceAudioAccepted: false, legacyCourseShellRequired: false,
  spanishSourceVisualParityEstablished: false,
});

export type CourseG04L11Ti002TermId =
  (typeof COURSE_G04_L11_TI_002_MATCHES)[number]["id"];
export type CourseG04L11Ti002GlossaryId =
  (typeof COURSE_G04_L11_TI_002_GLOSSARY)[number]["id"];
export type CourseG04L11Ti002TargetRow = 1 | 2 | 3 | 4 | 5;
export type CourseG04L11Ti002RightVariant =
  "excellent" | "you-got-it" | "good-job" | "great-job";
export type CourseG04L11Ti002CoachVariant = "S1" | "S2" | "S3" | "S4";

export interface CourseG04L11Ti002MatchingState {
  readonly frame: number; readonly sourceCanvasFrame: number;
  readonly phase: "instruction" | "matching" | "wrong-feedback" |
    "correct-feedback" | "picture" | "glossary" | "completed";
  readonly playing: boolean; readonly seed: number;
  readonly selectedTermId: CourseG04L11Ti002TermId | null;
  readonly placedTermIds: readonly CourseG04L11Ti002TermId[];
  readonly filledTargetRows: readonly CourseG04L11Ti002TargetRow[];
  readonly wrongAttemptCount: number;
  readonly feedbackVariant: CourseG04L11Ti002RightVariant | null;
  readonly coachVariant: CourseG04L11Ti002CoachVariant | null;
  readonly feedbackMessage: string | null; readonly popupOpen: boolean;
  readonly pendingCompletion: boolean;
  readonly enlargedPictureRow: CourseG04L11Ti002TargetRow | null;
  readonly selectedGlossaryId: CourseG04L11Ti002GlossaryId | null;
  readonly completed: boolean; readonly interactionRevision: number;
  readonly legacyHostCallCount: 0; readonly sourceAudioEnabled: false;
  readonly sourceAudioAccepted: false;
  readonly hostFeedbackSelectionEstablished: false;
  readonly sourceDragGeometryEstablished: false;
}

export type CourseG04L11Ti002MatchingEvent =
  | Readonly<{type: "synchronize-frame"; frame: number}>
  | Readonly<{type: "select-term"; termId: CourseG04L11Ti002TermId}>
  | Readonly<{type: "choose-target"; row: CourseG04L11Ti002TargetRow}>
  | Readonly<{type: "close-feedback"}>
  | Readonly<{type: "open-picture"; row: CourseG04L11Ti002TargetRow}>
  | Readonly<{type: "close-picture"}>
  | Readonly<{type: "open-glossary"; glossaryId: CourseG04L11Ti002GlossaryId}>
  | Readonly<{type: "close-glossary"}>
  | Readonly<{type: "replay"; seed?: number}>;

export const COURSE_G04_L11_TI_002_INTERACTION_AUTHORITY = Object.freeze({
  implementationCandidateOnly: true, sourceCanvasSequenceRetained: true,
  animationInternalPedagogicalControlsPreserved: true,
  sourceDragControlsReplacedByAccessiblePickThenPlace: true,
  sourceDragGeometryEstablished: false, matchingContractPreserved: 5,
  pictureEnlargementFunctionsPreserved: 5, glossaryVocabularyPreserved: 15,
  wrongFeedbackCloseAndRetryPreserved: true,
  sourceFeedbackAnimationTimingEstablished: false,
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
  invariant(Number.isInteger(frame) && frame >= 1 && frame <= 247,
    `invalid TI002 local frame: ${frame}`);
  return frame;
}
function exactTargetRow(row: number): CourseG04L11Ti002TargetRow {
  invariant(Number.isInteger(row) && row >= 1 && row <= 5,
    `invalid TI002 target row: ${row}`);
  return row as CourseG04L11Ti002TargetRow;
}
function normalizeSeed(seed: number) {
  invariant(Number.isFinite(seed), "TI002 seed must be finite");
  return Math.trunc(seed) >>> 0;
}
function variant(seed: number, selection: number, count: number) {
  let value = (seed + Math.imul(selection + 1, 0x9e3779b9)) >>> 0;
  value ^= value << 13; value ^= value >>> 17; value ^= value << 5;
  return (value >>> 0) % count;
}
const RIGHT_VARIANTS = Object.freeze([
  "excellent", "you-got-it", "good-job", "great-job",
] as const);
const COACH_VARIANTS = Object.freeze(["S1", "S2", "S3", "S4"] as const);
const matchById = (id: string) =>
  COURSE_G04_L11_TI_002_MATCHES.find((match) => match.id === id) ?? null;
const rowByNumber = (row: number) =>
  COURSE_G04_L11_TI_002_TARGET_ROWS.find((target) => target.row === row) ?? null;
const glossaryById = (id: string) =>
  COURSE_G04_L11_TI_002_GLOSSARY.find((term) => term.id === id) ?? null;
function freezeState(state: Omit<CourseG04L11Ti002MatchingState,
  "placedTermIds" | "filledTargetRows"> & {
  placedTermIds: readonly CourseG04L11Ti002TermId[];
  filledTargetRows: readonly CourseG04L11Ti002TargetRow[];
}): CourseG04L11Ti002MatchingState {
  const placedTermIds = Object.freeze([...state.placedTermIds]);
  const filledTargetRows = Object.freeze([...state.filledTargetRows]);
  return Object.freeze({...state, placedTermIds, filledTargetRows});
}

export function createCourseG04L11Ti002MatchingState(
  initialFrame = 1,
  seed = 0,
): CourseG04L11Ti002MatchingState {
  const requested = exactFrame(initialFrame); const frame = Math.min(requested, 230);
  return freezeState({frame,
    sourceCanvasFrame: getCourseG04L11Ti002CandidateCanvasFrame(frame),
    phase: frame >= 230 ? "matching" : "instruction", playing: frame < 230,
    seed: normalizeSeed(seed), selectedTermId: null, placedTermIds: [],
    filledTargetRows: [], wrongAttemptCount: 0, feedbackVariant: null,
    coachVariant: null, feedbackMessage: null, popupOpen: false,
    pendingCompletion: false, enlargedPictureRow: null,
    selectedGlossaryId: null, completed: false, interactionRevision: 0,
    legacyHostCallCount: 0, sourceAudioEnabled: false, sourceAudioAccepted: false,
    hostFeedbackSelectionEstablished: false, sourceDragGeometryEstablished: false});
}

export function getCourseG04L11Ti002SelectedMatch(
  state: CourseG04L11Ti002MatchingState,
) {
  return state.selectedTermId ? matchById(state.selectedTermId) : null;
}

export function getCourseG04L11Ti002SelectedGlossary(
  state: CourseG04L11Ti002MatchingState,
) {
  return state.selectedGlossaryId ? glossaryById(state.selectedGlossaryId) : null;
}

export function reduceCourseG04L11Ti002Matching(
  state: CourseG04L11Ti002MatchingState,
  event: CourseG04L11Ti002MatchingEvent,
): CourseG04L11Ti002MatchingState {
  invariant(Object.isFrozen(state) && Object.isFrozen(state.placedTermIds) &&
    Object.isFrozen(state.filledTargetRows), "TI002 state must be frozen");
  switch (event.type) {
    case "synchronize-frame": {
      const requested = exactFrame(event.frame);
      if (state.completed) {
        return freezeState({...state, frame: 247, sourceCanvasFrame: 247,
          phase: "completed", playing: false});
      }
      const frame = Math.min(requested, 230);
      return freezeState({...state, frame,
        sourceCanvasFrame: getCourseG04L11Ti002CandidateCanvasFrame(frame),
        phase: state.popupOpen || state.enlargedPictureRow || state.selectedGlossaryId
          ? state.phase : frame >= 230 ? "matching" : "instruction",
        playing: frame < 230 && !state.popupOpen && !state.enlargedPictureRow &&
          !state.selectedGlossaryId});
    }
    case "select-term": {
      const match = matchById(event.termId);
      invariant(match, `unknown TI002 term: ${event.termId}`);
      invariant(state.phase === "matching" && !state.popupOpen && !state.completed,
        "TI002 term selection is not available");
      if (state.placedTermIds.includes(match.id)) return state;
      return freezeState({...state, selectedTermId: match.id,
        interactionRevision: state.interactionRevision + 1});
    }
    case "choose-target": {
      const row = exactTargetRow(event.row); const target = rowByNumber(row);
      invariant(target, `unknown TI002 target row: ${row}`);
      invariant(state.phase === "matching" && state.selectedTermId &&
        !state.popupOpen && !state.completed, "TI002 target selection is not available");
      if (state.filledTargetRows.includes(row)) return state;
      const match = matchById(state.selectedTermId);
      invariant(match, "TI002 selected term is missing");
      if (match.targetRow !== row) {
        const wrongAttemptCount = state.wrongAttemptCount + 1;
        return freezeState({...state, selectedTermId: null, wrongAttemptCount,
          coachVariant: COACH_VARIANTS[variant(state.seed, wrongAttemptCount, 4)],
          feedbackVariant: null, feedbackMessage: "Try Again!",
          popupOpen: true, phase: "wrong-feedback", playing: false,
          interactionRevision: state.interactionRevision + 1});
      }
      const placedTermIds = [...state.placedTermIds, match.id];
      const filledTargetRows = [...state.filledTargetRows, row];
      const pendingCompletion = placedTermIds.length === 5;
      return freezeState({...state, selectedTermId: null, placedTermIds,
        filledTargetRows, coachVariant: null,
        feedbackVariant: RIGHT_VARIANTS[variant(state.seed, placedTermIds.length, 4)],
        feedbackMessage: `${match.term} is matched correctly.`, popupOpen: true,
        pendingCompletion, phase: "correct-feedback", playing: false,
        interactionRevision: state.interactionRevision + 1});
    }
    case "close-feedback": {
      invariant(state.popupOpen && (state.phase === "wrong-feedback" ||
        state.phase === "correct-feedback"), "TI002 feedback is not open");
      if (state.pendingCompletion) {
        return freezeState({...state, frame: 247, sourceCanvasFrame: 247,
          feedbackVariant: null, coachVariant: null, feedbackMessage: null,
          popupOpen: false, pendingCompletion: false, phase: "completed",
          playing: false, completed: true,
          interactionRevision: state.interactionRevision + 1});
      }
      return freezeState({...state, feedbackVariant: null, coachVariant: null,
        feedbackMessage: null, popupOpen: false, pendingCompletion: false,
        phase: "matching", playing: false,
        interactionRevision: state.interactionRevision + 1});
    }
    case "open-picture": {
      const row = exactTargetRow(event.row);
      invariant(rowByNumber(row) && state.phase === "matching" && !state.popupOpen,
        "TI002 picture control is not available");
      return freezeState({...state, enlargedPictureRow: row, phase: "picture",
        playing: false, interactionRevision: state.interactionRevision + 1});
    }
    case "close-picture":
      if (state.phase !== "picture" || !state.enlargedPictureRow) return state;
      return freezeState({...state, enlargedPictureRow: null, phase: "matching",
        interactionRevision: state.interactionRevision + 1});
    case "open-glossary": {
      invariant(glossaryById(event.glossaryId),
        `unknown TI002 glossary term: ${event.glossaryId}`);
      invariant(state.phase === "matching" && !state.popupOpen,
        "TI002 glossary control is not available");
      return freezeState({...state, selectedGlossaryId: event.glossaryId,
        phase: "glossary", playing: false,
        interactionRevision: state.interactionRevision + 1});
    }
    case "close-glossary":
      if (state.phase !== "glossary" || !state.selectedGlossaryId) return state;
      return freezeState({...state, selectedGlossaryId: null, phase: "matching",
        interactionRevision: state.interactionRevision + 1});
    case "replay":
      return createCourseG04L11Ti002MatchingState(1,
        event.seed === undefined ? state.seed : event.seed);
    default: return event satisfies never;
  }
}
