import {COURSE_G04_L11_IN_013_CHOICES} from
  "../source-static/g4-l11/course-g04-l11-in-013-static";
import {getCourseG04L11In013CandidateCanvasFrame} from "./course-g04-l11-in-013";

export const COURSE_G04_L11_IN_013_INTERACTION_SOURCE = Object.freeze({
  animationId: "course-g04-l11-in-013",
  sourceSwfSha256:
    "9565fafc4a24c57f2b122fe2cbba59bdab66f551e758c077929f0d01549e2c49",
  sourceTimelineId: "sprite-224", sourceFrameCount: 67,
  naturalQuizStopFrame: 49, postCorrectStartFrame: 50, terminalFrame: 67,
  prompt: "Click the length of this line segment.",
  endpoints: Object.freeze(["(3,5)", "(7,5)"]), equation: "7 − 3 = 4",
  exactWrongFeedback:
    "Subtract the x-coordinates 7 minus 3 to find the length. Try again.",
  sourceAnswerControlCount: 3, sourceGlossaryControlCount: 2,
  sourceEmbeddedStreamCount: 11, sourceAudioAccepted: false,
  legacyCourseShellRequired: false, spanishSourceVisualParityEstablished: false,
});

export const COURSE_G04_L11_IN_013_TERMS = Object.freeze([
  Object.freeze({id: "length", sourceButtonObjectId: "26",
    sourceKeyAttribute: "Length", label: "length",
    prompt: "Length tells the distance from one endpoint to the other."}),
  Object.freeze({id: "line-segment", sourceButtonObjectId: "27",
    sourceKeyAttribute: "Line segment", label: "line segment",
    prompt: "A line segment is the part of a line between two endpoints."}),
] as const);

export type CourseG04L11In013ChoiceId =
  (typeof COURSE_G04_L11_IN_013_CHOICES)[number]["id"];
export type CourseG04L11In013TermId =
  (typeof COURSE_G04_L11_IN_013_TERMS)[number]["id"];
export type CourseG04L11In013FeedbackVariant =
  | "wrong-1" | "wrong-2" | "wrong-3" | "wrong-4"
  | "right-1" | "right-2" | "right-3" | "right-4" | "right-5";
const WRONG_FEEDBACK_VARIANTS = Object.freeze([
  "wrong-1", "wrong-2", "wrong-3", "wrong-4",
] as const satisfies readonly CourseG04L11In013FeedbackVariant[]);
const RIGHT_FEEDBACK_VARIANTS = Object.freeze([
  "right-1", "right-2", "right-3", "right-4", "right-5",
] as const satisfies readonly CourseG04L11In013FeedbackVariant[]);

export interface CourseG04L11In013PracticeState {
  readonly frame: number; readonly sourceCanvasFrame: number;
  readonly phase: "instruction" | "quiz" | "wrong-feedback" |
    "correct-feedback" | "post-correct";
  readonly playing: boolean; readonly seed: number;
  readonly selectedChoiceId: CourseG04L11In013ChoiceId | null;
  readonly wrongAttemptCount: number;
  readonly feedbackVariant: CourseG04L11In013FeedbackVariant | null;
  readonly feedbackMessage: string | null; readonly popupOpen: boolean;
  readonly selectedTermId: CourseG04L11In013TermId | null;
  readonly glossaryOpen: boolean; readonly completed: boolean;
  readonly interactionRevision: number; readonly legacyHostCallCount: 0;
  readonly sourceAudioEnabled: false; readonly sourceAudioAccepted: false;
  readonly hostFeedbackSelectionEstablished: false;
  readonly feedbackAnimationTimingEstablished: false;
}

export type CourseG04L11In013PracticeEvent =
  | Readonly<{type: "synchronize-frame"; frame: number}>
  | Readonly<{type: "choose-answer"; choiceId: CourseG04L11In013ChoiceId}>
  | Readonly<{type: "close-wrong-feedback"}>
  | Readonly<{type: "continue-after-correct"}>
  | Readonly<{type: "select-term"; termId: CourseG04L11In013TermId}>
  | Readonly<{type: "close-term"}>
  | Readonly<{type: "replay"; seed?: number}>;

export const COURSE_G04_L11_IN_013_INTERACTION_AUTHORITY = Object.freeze({
  implementationCandidateOnly: true, sourceCanvasSequenceRetained: true,
  animationInternalPedagogicalControlsPreserved: true,
  answerChoiceControlsPreserved: 3, glossaryControlsPreserved: 2,
  wrongFeedbackCloseAndRetryPreserved: true,
  correctFeedbackContinuationProvidedAsModernTimingSubstitute: true,
  sourceFeedbackAnimationTimingEstablished: false,
  hostFeedbackVariantSelectionReplacedByDeterministicFixtureForQa: true,
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
  invariant(Number.isInteger(frame) && frame >= 1 && frame <= 67,
    `invalid IN013 local frame: ${frame}`);
  return frame;
}
function normalizeSeed(seed: number) {
  invariant(Number.isFinite(seed), "IN013 seed must be finite");
  return Math.trunc(seed) >>> 0;
}
const choiceById = (choiceId: string) =>
  COURSE_G04_L11_IN_013_CHOICES.find((choice) => choice.id === choiceId) ?? null;
const termById = (termId: string) =>
  COURSE_G04_L11_IN_013_TERMS.find((term) => term.id === termId) ?? null;
function variant(seed: number, selection: number, count: number) {
  let value = (seed + Math.imul(selection + 1, 0x9e3779b9)) >>> 0;
  value ^= value << 13; value ^= value >>> 17; value ^= value << 5;
  return (value >>> 0) % count;
}
const freezeState = (state: CourseG04L11In013PracticeState) => Object.freeze(state);

export function createCourseG04L11In013PracticeState(
  initialFrame = 1,
  seed = 0,
): CourseG04L11In013PracticeState {
  const requested = exactFrame(initialFrame); const frame = Math.min(requested, 49);
  return freezeState({frame,
    sourceCanvasFrame: getCourseG04L11In013CandidateCanvasFrame(frame),
    phase: frame >= 49 ? "quiz" : "instruction", playing: frame < 49,
    seed: normalizeSeed(seed), selectedChoiceId: null, wrongAttemptCount: 0,
    feedbackVariant: null, feedbackMessage: null, popupOpen: false,
    selectedTermId: null, glossaryOpen: false, completed: false,
    interactionRevision: 0, legacyHostCallCount: 0,
    sourceAudioEnabled: false, sourceAudioAccepted: false,
    hostFeedbackSelectionEstablished: false,
    feedbackAnimationTimingEstablished: false});
}

export function getCourseG04L11In013SelectedTerm(state: CourseG04L11In013PracticeState) {
  return state.selectedTermId ? termById(state.selectedTermId) : null;
}

export function reduceCourseG04L11In013Practice(
  state: CourseG04L11In013PracticeState,
  event: CourseG04L11In013PracticeEvent,
): CourseG04L11In013PracticeState {
  invariant(Object.isFrozen(state), "IN013 state must be frozen");
  switch (event.type) {
    case "synchronize-frame": {
      const requested = exactFrame(event.frame);
      if (state.completed) {
        const frame = Math.max(50, requested);
        return freezeState({...state, frame,
          sourceCanvasFrame: getCourseG04L11In013CandidateCanvasFrame(frame, true),
          phase: "post-correct", playing: frame < 67});
      }
      const frame = Math.min(requested, 49);
      return freezeState({...state, frame,
        sourceCanvasFrame: getCourseG04L11In013CandidateCanvasFrame(frame),
        phase: state.popupOpen ? state.phase : frame >= 49 ? "quiz" : "instruction",
        playing: frame < 49 && !state.popupOpen && !state.glossaryOpen});
    }
    case "choose-answer": {
      invariant(state.phase === "quiz" && !state.popupOpen && !state.glossaryOpen &&
        !state.completed, "IN013 answer choice is not available");
      const choice = choiceById(event.choiceId);
      invariant(choice, `unknown IN013 choice: ${event.choiceId}`);
      if (!choice.correct) {
        const wrongAttemptCount = state.wrongAttemptCount + 1;
        const feedbackVariant = WRONG_FEEDBACK_VARIANTS[
          variant(state.seed, wrongAttemptCount, WRONG_FEEDBACK_VARIANTS.length)];
        return freezeState({...state, selectedChoiceId: choice.id,
          wrongAttemptCount, feedbackVariant,
          feedbackMessage: COURSE_G04_L11_IN_013_INTERACTION_SOURCE.exactWrongFeedback,
          popupOpen: true, phase: "wrong-feedback", playing: false,
          interactionRevision: state.interactionRevision + 1});
      }
      const feedbackVariant = RIGHT_FEEDBACK_VARIANTS[
        variant(state.seed, state.wrongAttemptCount, RIGHT_FEEDBACK_VARIANTS.length)];
      return freezeState({...state, selectedChoiceId: choice.id,
        feedbackVariant,
        feedbackMessage: "Correct! The length of the line segment is 4 units.",
        popupOpen: true, phase: "correct-feedback", playing: false,
        interactionRevision: state.interactionRevision + 1});
    }
    case "close-wrong-feedback":
      invariant(state.phase === "wrong-feedback" && state.popupOpen,
        "IN013 wrong feedback is not open");
      return freezeState({...state, selectedChoiceId: null,
        feedbackVariant: null, feedbackMessage: null, popupOpen: false,
        phase: "quiz", playing: false,
        interactionRevision: state.interactionRevision + 1});
    case "continue-after-correct":
      invariant(state.phase === "correct-feedback" && state.popupOpen,
        "IN013 correct feedback is not open");
      return freezeState({...state, frame: 67, sourceCanvasFrame: 67,
        feedbackVariant: null, feedbackMessage: null, popupOpen: false,
        phase: "post-correct", playing: false, completed: true,
        interactionRevision: state.interactionRevision + 1});
    case "select-term":
      invariant(termById(event.termId), `unknown IN013 term: ${event.termId}`);
      invariant(!state.popupOpen, "IN013 glossary control is not available");
      return freezeState({...state, selectedTermId: event.termId,
        glossaryOpen: true, playing: false,
        interactionRevision: state.interactionRevision + 1});
    case "close-term":
      if (!state.glossaryOpen) return state;
      return freezeState({...state, selectedTermId: null, glossaryOpen: false,
        playing: state.phase === "instruction",
        interactionRevision: state.interactionRevision + 1});
    case "replay":
      return createCourseG04L11In013PracticeState(1,
        event.seed === undefined ? state.seed : event.seed);
    default: return event satisfies never;
  }
}
