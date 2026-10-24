import {COURSE_G04_L11_TI_007_CHOICES, COURSE_G04_L11_TI_007_GLOSSARY} from
  "../source-static/g4-l11/course-g04-l11-ti-007-static";
import {getCourseG04L11Ti007CandidateCanvasFrame} from "./course-g04-l11-ti-007";

export const COURSE_G04_L11_TI_007_INTERACTION_SOURCE = Object.freeze({
  animationId: "course-g04-l11-ti-007",
  sourceSwfSha256:
    "b358b553e11311b7b2576e293ec9a587dd618969d009ed1c5639eafe3feb6a0b",
  sourceFlaSha256:
    "857891e9c56d2f998cf5954ec243e226c3ccd283da3fdde65308d5d61cb2e568",
  sourceTimelineId: "sprite-258", sourceFrameCount: 143,
  naturalQuizStopFrame: 119, modernInteractionBackgroundFrame: 118,
  postCorrectStartFrame: 120, terminalFrame: 143,
  prompt: "Click the number of units for the length of this line segment.",
  endpoints: Object.freeze(["(9,1)", "(4,1)"]), equation: "9 − 4 = 5",
  sourceWrongFeedback: "Read the second part of the rule. Try again.",
  visibleCoaching:
    "Subtract the x-coordinates 9 minus 4 to find the length. Try again.",
  sourceAnswerControlCount: 3, sourceHelpControlCount: 1,
  sourceGlossaryControlCount: 8, sourceEmbeddedStreamCount: 7,
  sourceAudioAccepted: false, externalSpanishAudioAccepted: false,
  legacyCourseShellRequired: false, spanishSourceVisualParityEstablished: false,
});

export type CourseG04L11Ti007ChoiceId =
  (typeof COURSE_G04_L11_TI_007_CHOICES)[number]["id"];
export type CourseG04L11Ti007GlossaryId =
  (typeof COURSE_G04_L11_TI_007_GLOSSARY)[number]["id"];
export type CourseG04L11Ti007FeedbackVariant =
  | "wrong-1" | "wrong-2" | "wrong-3" | "wrong-4"
  | "right-1" | "right-2" | "right-3" | "right-4";
const WRONG_FEEDBACK_VARIANTS = Object.freeze([
  "wrong-1", "wrong-2", "wrong-3", "wrong-4",
] as const satisfies readonly CourseG04L11Ti007FeedbackVariant[]);
const RIGHT_FEEDBACK_VARIANTS = Object.freeze([
  "right-1", "right-2", "right-3", "right-4",
] as const satisfies readonly CourseG04L11Ti007FeedbackVariant[]);

export interface CourseG04L11Ti007State {
  readonly frame: number; readonly sourceCanvasFrame: number;
  readonly phase: "instruction" | "quiz" | "wrong-feedback" |
    "correct-feedback" | "help" | "glossary" | "post-correct";
  readonly playing: boolean; readonly seed: number;
  readonly selectedChoiceId: CourseG04L11Ti007ChoiceId | null;
  readonly wrongAttemptCount: number;
  readonly feedbackVariant: CourseG04L11Ti007FeedbackVariant | null;
  readonly feedbackMessage: string | null;
  readonly selectedGlossaryId: CourseG04L11Ti007GlossaryId | null;
  readonly completed: boolean; readonly interactionRevision: number;
  readonly legacyHostCallCount: 0; readonly sourceAudioEnabled: false;
  readonly sourceAudioAccepted: false; readonly externalSpanishAudioAccepted: false;
  readonly hostFeedbackSelectionEstablished: false;
  readonly feedbackAnimationTimingEstablished: false;
}

export type CourseG04L11Ti007Event =
  | Readonly<{type: "synchronize-frame"; frame: number}>
  | Readonly<{type: "choose-answer"; choiceId: CourseG04L11Ti007ChoiceId}>
  | Readonly<{type: "close-wrong-feedback"}>
  | Readonly<{type: "continue-after-correct"}>
  | Readonly<{type: "open-help"}>
  | Readonly<{type: "close-help"}>
  | Readonly<{type: "open-glossary"; glossaryId: CourseG04L11Ti007GlossaryId}>
  | Readonly<{type: "close-glossary"}>
  | Readonly<{type: "replay"; seed?: number}>;

export const COURSE_G04_L11_TI_007_INTERACTION_AUTHORITY = Object.freeze({
  implementationCandidateOnly: true, sourceCanvasSequenceRetained: true,
  animationInternalPedagogicalControlsPreserved: true,
  answerChoiceControlsPreserved: 3, helpControlPreserved: true,
  glossaryControlsPreserved: 8, wrongFeedbackCloseAndRetryPreserved: true,
  correctFeedbackContinuationProvidedAsModernTimingSubstitute: true,
  sourceFeedbackAnimationTimingEstablished: false,
  hostFeedbackVariantSelectionReplacedByDeterministicFixtureForQa: true,
  legacyCourseShellNavigationIncluded: false, legacyPlayerChromeIncluded: false,
  legacyPreloaderIncluded: false, duplicateOldAndModernControlsIncluded: false,
  legacyGlobalsExecuted: false, legacyDoHyperLinksExecuted: false,
  sourceAudioEnabled: false, sourceAudioAccepted: false,
  externalSpanishAudioAccepted: false,
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
  invariant(Number.isInteger(frame) && frame >= 1 && frame <= 143,
    `invalid TI007 local frame: ${frame}`);
  return frame;
}
function normalizeSeed(seed: number) {
  invariant(Number.isFinite(seed), "TI007 seed must be finite");
  return Math.trunc(seed) >>> 0;
}
const choiceById = (id: string) => COURSE_G04_L11_TI_007_CHOICES.find((choice) =>
  choice.id === id) ?? null;
const glossaryById = (id: string) => COURSE_G04_L11_TI_007_GLOSSARY.find((term) =>
  term.id === id) ?? null;
function variant(seed: number, selection: number, count: number) {
  let value = (seed + Math.imul(selection + 1, 0x9e3779b9)) >>> 0;
  value ^= value << 13; value ^= value >>> 17; value ^= value << 5;
  return (value >>> 0) % count;
}
const freezeState = (state: CourseG04L11Ti007State) => Object.freeze(state);

export function createCourseG04L11Ti007State(initialFrame = 1, seed = 0):
CourseG04L11Ti007State {
  const requested = exactFrame(initialFrame); const frame = Math.min(requested, 119);
  return freezeState({frame,
    sourceCanvasFrame: getCourseG04L11Ti007CandidateCanvasFrame(frame),
    phase: frame >= 119 ? "quiz" : "instruction", playing: frame < 119,
    seed: normalizeSeed(seed), selectedChoiceId: null, wrongAttemptCount: 0,
    feedbackVariant: null, feedbackMessage: null, selectedGlossaryId: null,
    completed: false, interactionRevision: 0, legacyHostCallCount: 0,
    sourceAudioEnabled: false, sourceAudioAccepted: false,
    externalSpanishAudioAccepted: false,
    hostFeedbackSelectionEstablished: false,
    feedbackAnimationTimingEstablished: false});
}

export function getCourseG04L11Ti007SelectedGlossary(state: CourseG04L11Ti007State) {
  return state.selectedGlossaryId ? glossaryById(state.selectedGlossaryId) : null;
}

export function reduceCourseG04L11Ti007State(state: CourseG04L11Ti007State,
  event: CourseG04L11Ti007Event): CourseG04L11Ti007State {
  invariant(Object.isFrozen(state), "TI007 state must be frozen");
  switch (event.type) {
    case "synchronize-frame": {
      const requested = exactFrame(event.frame);
      if (state.completed) {
        const frame = Math.max(120, requested);
        return freezeState({...state, frame,
          sourceCanvasFrame: getCourseG04L11Ti007CandidateCanvasFrame(frame, true),
          phase: "post-correct", playing: frame < 143});
      }
      const frame = Math.min(requested, 119);
      const modal = state.phase === "wrong-feedback" ||
        state.phase === "correct-feedback" || state.phase === "help" ||
        state.phase === "glossary";
      return freezeState({...state, frame,
        sourceCanvasFrame: getCourseG04L11Ti007CandidateCanvasFrame(frame),
        phase: modal ? state.phase : frame >= 119 ? "quiz" : "instruction",
        playing: frame < 119 && !modal});
    }
    case "choose-answer": {
      invariant(state.phase === "quiz" && !state.completed,
        "TI007 answer choice is not available");
      const choice = choiceById(event.choiceId);
      invariant(choice, `unknown TI007 choice: ${event.choiceId}`);
      if (!choice.correct) {
        const wrongAttemptCount = state.wrongAttemptCount + 1;
        const feedbackVariant = WRONG_FEEDBACK_VARIANTS[
          variant(state.seed, wrongAttemptCount, WRONG_FEEDBACK_VARIANTS.length)];
        return freezeState({...state, selectedChoiceId: choice.id,
          wrongAttemptCount, feedbackVariant,
          feedbackMessage: COURSE_G04_L11_TI_007_INTERACTION_SOURCE.sourceWrongFeedback,
          phase: "wrong-feedback", playing: false,
          interactionRevision: state.interactionRevision + 1});
      }
      const feedbackVariant = RIGHT_FEEDBACK_VARIANTS[
        variant(state.seed, state.wrongAttemptCount, RIGHT_FEEDBACK_VARIANTS.length)];
      return freezeState({...state, selectedChoiceId: choice.id, feedbackVariant,
        feedbackMessage: "Correct! The length of the line segment is 5 units.",
        phase: "correct-feedback", playing: false,
        interactionRevision: state.interactionRevision + 1});
    }
    case "close-wrong-feedback":
      invariant(state.phase === "wrong-feedback", "TI007 wrong feedback is not open");
      return freezeState({...state, selectedChoiceId: null,
        feedbackVariant: null, feedbackMessage: null, phase: "quiz", playing: false,
        interactionRevision: state.interactionRevision + 1});
    case "continue-after-correct":
      invariant(state.phase === "correct-feedback",
        "TI007 correct feedback is not open");
      return freezeState({...state, frame: 143, sourceCanvasFrame: 143,
        feedbackVariant: null, feedbackMessage: null, phase: "post-correct",
        playing: false, completed: true,
        interactionRevision: state.interactionRevision + 1});
    case "open-help":
      invariant(state.phase === "quiz", "TI007 help is not available");
      return freezeState({...state, phase: "help", playing: false,
        interactionRevision: state.interactionRevision + 1});
    case "close-help":
      invariant(state.phase === "help", "TI007 help is not open");
      return freezeState({...state, phase: "quiz",
        interactionRevision: state.interactionRevision + 1});
    case "open-glossary":
      invariant(state.phase === "quiz" && glossaryById(event.glossaryId),
        `unknown or unavailable TI007 glossary term: ${event.glossaryId}`);
      return freezeState({...state, phase: "glossary",
        selectedGlossaryId: event.glossaryId, playing: false,
        interactionRevision: state.interactionRevision + 1});
    case "close-glossary":
      invariant(state.phase === "glossary" && state.selectedGlossaryId,
        "TI007 glossary is not open");
      return freezeState({...state, phase: "quiz", selectedGlossaryId: null,
        interactionRevision: state.interactionRevision + 1});
    case "replay":
      return createCourseG04L11Ti007State(1,
        event.seed === undefined ? state.seed : event.seed);
  }
}
