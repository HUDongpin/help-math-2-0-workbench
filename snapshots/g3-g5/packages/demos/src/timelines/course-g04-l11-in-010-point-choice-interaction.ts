import {COURSE_G04_L11_IN_010_CHOICES} from
  "../source-static/g4-l11/course-g04-l11-in-010-static";
import {getCourseG04L11In010CandidateCanvasFrame} from "./course-g04-l11-in-010";

export const COURSE_G04_L11_IN_010_INTERACTION_SOURCE = Object.freeze({
  animationId: "course-g04-l11-in-010",
  sourceSwfSha256:
    "8af2d73e85df5c68702ce37d2f233c64766434283d2fe6b419938e427c55a488",
  sourceTimelineId: "sprite-246", sourceFrameCount: 277,
  narratedBuildEndFrame: 190, naturalQuizStopFrame: 191,
  postCorrectStartFrame: 192, terminalDefinitionFrame: 277,
  equation: "2x = y", sourceAnswerControlCount: 3,
  sourceGlossaryControlCount: 4, sourceWrongCloseControlCount: 1,
  sourceEmbeddedStreamCount: 11, sourceAudioAccepted: false,
  legacyCourseShellRequired: false, spanishSourceVisualParityEstablished: false,
});

export const COURSE_G04_L11_IN_010_TERMS = Object.freeze([
  Object.freeze({id: "equation", sourceKeyAttribute: "Equation", label: "equation",
    prompt: "An equation shows that two mathematical expressions are equal."}),
  Object.freeze({id: "point", sourceKeyAttribute: "Point", label: "point",
    prompt: "A point marks one exact location on the coordinate grid."}),
  Object.freeze({id: "coordinate", sourceKeyAttribute: "Coordinate", label: "coordinate",
    prompt: "A coordinate pair names a point with an x-value and a y-value."}),
  Object.freeze({id: "line", sourceKeyAttribute: "Line", label: "line",
    prompt: "A line contains every point whose coordinates follow its equation."}),
] as const);

export type CourseG04L11In010ChoiceId =
  (typeof COURSE_G04_L11_IN_010_CHOICES)[number]["id"];
export type CourseG04L11In010TermId =
  (typeof COURSE_G04_L11_IN_010_TERMS)[number]["id"];
export type CourseG04L11In010FeedbackVariant =
  | "wrong-1" | "wrong-2" | "wrong-3" | "wrong-4"
  | "right-1" | "right-2" | "right-3" | "right-4" | "right-5";
const WRONG_FEEDBACK_VARIANTS = Object.freeze([
  "wrong-1", "wrong-2", "wrong-3", "wrong-4",
] as const satisfies readonly CourseG04L11In010FeedbackVariant[]);
const RIGHT_FEEDBACK_VARIANTS = Object.freeze([
  "right-1", "right-2", "right-3", "right-4", "right-5",
] as const satisfies readonly CourseG04L11In010FeedbackVariant[]);

export interface CourseG04L11In010PracticeState {
  readonly frame: number;
  readonly sourceCanvasFrame: number;
  readonly phase: "instruction" | "quiz" | "wrong-feedback" |
    "correct-feedback" | "post-correct";
  readonly playing: boolean;
  readonly seed: number;
  readonly selectedChoiceId: CourseG04L11In010ChoiceId | null;
  readonly wrongAttemptCount: number;
  readonly feedbackVariant: CourseG04L11In010FeedbackVariant | null;
  readonly feedbackMessage: string | null;
  readonly popupOpen: boolean;
  readonly selectedTermId: CourseG04L11In010TermId | null;
  readonly glossaryOpen: boolean;
  readonly completed: boolean;
  readonly interactionRevision: number;
  readonly legacyHostCallCount: 0;
  readonly sourceAudioEnabled: false;
  readonly sourceAudioAccepted: false;
  readonly hostFeedbackSelectionEstablished: false;
  readonly correctFeedbackTimingEstablished: false;
}

export type CourseG04L11In010PracticeEvent =
  | Readonly<{type: "synchronize-frame"; frame: number}>
  | Readonly<{type: "choose-answer"; choiceId: CourseG04L11In010ChoiceId}>
  | Readonly<{type: "close-wrong-feedback"}>
  | Readonly<{type: "continue-after-correct"}>
  | Readonly<{type: "select-term"; termId: CourseG04L11In010TermId}>
  | Readonly<{type: "close-term"}>
  | Readonly<{type: "replay"; seed?: number}>;

export const COURSE_G04_L11_IN_010_INTERACTION_AUTHORITY = Object.freeze({
  implementationCandidateOnly: true, sourceCanvasSequenceRetained: true,
  frame191StaticExportTreatedAsExecutedState: false,
  animationInternalPedagogicalControlsPreserved: true,
  answerChoiceControlsPreserved: 3, glossaryControlsPreserved: 4,
  wrongFeedbackCloseAndRetryPreserved: true,
  correctFeedbackContinuationProvidedAsModernTimingSubstitute: true,
  correctFeedbackAutomaticSourceTimingEstablished: false,
  hostFeedbackVariantSelectionReplacedByDeterministicFixtureForQa: true,
  legacyCourseShellNavigationIncluded: false, legacyPlayerChromeIncluded: false,
  legacyGlobalsExecuted: false, legacyDoHyperLinksExecuted: false,
  sourceAudioEnabled: false, sourceAudioAccepted: false,
  spanishSourceVisualParityEstablished: false, sourceDomainDeclared: true,
  registeredCurrentJavascript: true, authoritativeOriginalRuntimeAccepted: false,
  behaviorParityEstablished: false, visualFidelityEstablished: false,
  humanVisualReviewAccepted: false, ownerAccepted: false,
  strictMigrationComplete: false, lessonReleased: false, published: false,
  strictAcceptanceEffect: "none",
});

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
function exactFrame(frame: number) {
  invariant(Number.isInteger(frame) && frame >= 1 && frame <= 277,
    `invalid IN010 local frame: ${frame}`);
  return frame;
}
function normalizeSeed(seed: number) {
  invariant(Number.isFinite(seed), "IN010 seed must be finite");
  return Math.trunc(seed) >>> 0;
}
function choiceById(choiceId: string) {
  return COURSE_G04_L11_IN_010_CHOICES.find((choice) => choice.id === choiceId) ?? null;
}
function termById(termId: string) {
  return COURSE_G04_L11_IN_010_TERMS.find((term) => term.id === termId) ?? null;
}
function variant(seed: number, selection: number, count: number) {
  let value = (seed + Math.imul(selection + 1, 0x9e3779b9)) >>> 0;
  value ^= value << 13; value ^= value >>> 17; value ^= value << 5;
  return (value >>> 0) % count;
}
function freezeState(state: CourseG04L11In010PracticeState) {
  return Object.freeze(state);
}

export function createCourseG04L11In010PracticeState(
  initialFrame = 1,
  seed = 0,
): CourseG04L11In010PracticeState {
  const requested = exactFrame(initialFrame);
  const frame = Math.min(requested, 191);
  return freezeState({
    frame, sourceCanvasFrame: getCourseG04L11In010CandidateCanvasFrame(frame),
    phase: frame >= 191 ? "quiz" : "instruction", playing: frame < 191,
    seed: normalizeSeed(seed), selectedChoiceId: null, wrongAttemptCount: 0,
    feedbackVariant: null, feedbackMessage: null, popupOpen: false,
    selectedTermId: null, glossaryOpen: false, completed: false,
    interactionRevision: 0, legacyHostCallCount: 0,
    sourceAudioEnabled: false, sourceAudioAccepted: false,
    hostFeedbackSelectionEstablished: false,
    correctFeedbackTimingEstablished: false,
  });
}

export function getCourseG04L11In010SelectedTerm(
  state: CourseG04L11In010PracticeState,
) {
  return state.selectedTermId ? termById(state.selectedTermId) : null;
}

export function reduceCourseG04L11In010Practice(
  state: CourseG04L11In010PracticeState,
  event: CourseG04L11In010PracticeEvent,
): CourseG04L11In010PracticeState {
  switch (event.type) {
    case "synchronize-frame": {
      const requested = exactFrame(event.frame);
      if (state.completed) {
        const frame = Math.max(192, requested);
        return freezeState({...state, frame,
          sourceCanvasFrame: getCourseG04L11In010CandidateCanvasFrame(frame, true),
          phase: "post-correct", playing: frame < 277});
      }
      const frame = Math.min(requested, 191);
      return freezeState({...state, frame,
        sourceCanvasFrame: getCourseG04L11In010CandidateCanvasFrame(frame),
        phase: state.popupOpen ? state.phase : frame >= 191 ? "quiz" : "instruction",
        playing: frame < 191 && !state.popupOpen && !state.glossaryOpen});
    }
    case "choose-answer": {
      invariant(state.phase === "quiz" && !state.popupOpen && !state.glossaryOpen &&
        !state.completed, "IN010 answer choice is not available");
      const choice = choiceById(event.choiceId);
      invariant(choice, `unknown IN010 choice: ${event.choiceId}`);
      if (!choice.correct) {
        const wrongAttemptCount = state.wrongAttemptCount + 1;
        const feedbackVariant = WRONG_FEEDBACK_VARIANTS[
          variant(state.seed, wrongAttemptCount, WRONG_FEEDBACK_VARIANTS.length)];
        return freezeState({...state, selectedChoiceId: choice.id,
          wrongAttemptCount, feedbackVariant,
          feedbackMessage: "Which point belongs on the line? Try again.",
          popupOpen: true, phase: "wrong-feedback", playing: false,
          interactionRevision: state.interactionRevision + 1});
      }
      const feedbackVariant = RIGHT_FEEDBACK_VARIANTS[
        variant(state.seed, state.wrongAttemptCount, RIGHT_FEEDBACK_VARIANTS.length)];
      return freezeState({...state, selectedChoiceId: choice.id,
        feedbackVariant,
        feedbackMessage: "Correct! (4,8) belongs on the line 2x = y.",
        popupOpen: true, phase: "correct-feedback", playing: false,
        interactionRevision: state.interactionRevision + 1});
    }
    case "close-wrong-feedback":
      invariant(state.phase === "wrong-feedback" && state.popupOpen,
        "IN010 wrong feedback is not open");
      return freezeState({...state, selectedChoiceId: null,
        feedbackVariant: null, feedbackMessage: null, popupOpen: false,
        phase: "quiz", playing: false,
        interactionRevision: state.interactionRevision + 1});
    case "continue-after-correct":
      invariant(state.phase === "correct-feedback" && state.popupOpen,
        "IN010 correct feedback is not open");
      return freezeState({...state, frame: 277, sourceCanvasFrame: 277,
        feedbackVariant: null, feedbackMessage: null, popupOpen: false,
        phase: "post-correct", playing: false, completed: true,
        interactionRevision: state.interactionRevision + 1});
    case "select-term":
      invariant(termById(event.termId), `unknown IN010 term: ${event.termId}`);
      invariant(state.frame >= 6 && !state.popupOpen,
        "IN010 glossary control is not available");
      return freezeState({...state, selectedTermId: event.termId,
        glossaryOpen: true, playing: false,
        interactionRevision: state.interactionRevision + 1});
    case "close-term":
      if (!state.glossaryOpen) return state;
      return freezeState({...state, selectedTermId: null, glossaryOpen: false,
        playing: state.phase === "instruction",
        interactionRevision: state.interactionRevision + 1});
    case "replay":
      return createCourseG04L11In010PracticeState(1,
        event.seed === undefined ? state.seed : event.seed);
  }
}
