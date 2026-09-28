export const COURSE_G04_L11_VB_007_INTERACTION_SOURCE = Object.freeze({
  animationId: "course-g04-l11-vb-007",
  sourceSwfSha256:
    "be59c2d00360e14088098482dafbc5d919b29d95ee1b4462c4077c9883ad076c",
  sourceTimelineId: "sprite-254",
  sourceFrameCount: 107,
  sourcePromptStopFrame: 69,
  sourceTerminalStopFrame: 107,
  point: Object.freeze({name: "B", x: 2, y: 4}),
  correctAnswer: "(2,4)",
  reversedCoordinateDistractor: "(4,2)",
  sourceAnswerButtonCount: 2,
  sourceGlossaryButtonDefinitionCount: 8,
  sourceUniqueGlossaryTermCount: 7,
  sourceEmbeddedStreamCount: 11,
  externalSpanishTrackPresent: true,
  sourceAudioAccepted: false,
  sourceBranchReachabilityEstablished: false,
  legacyCourseShellRequired: false,
  legacyPlayerChromeRequired: false,
  spanishRuntimeEstablished: false,
});

export const COURSE_G04_L11_VB_007_CHOICES = Object.freeze([
  Object.freeze({id: "two-four", label: "(2,4)", x: 2, y: 4,
    sourceButtonObjectId: "40", outcome: "correct" as const}),
  Object.freeze({id: "four-two", label: "(4,2)", x: 4, y: 2,
    sourceButtonObjectId: "39", outcome: "incorrect" as const}),
]);

export const COURSE_G04_L11_VB_007_TERMS = Object.freeze([
  Object.freeze({id: "point", label: "Point", sourceButtonObjectIds: ["7"]}),
  Object.freeze({id: "coordinate-grid", label: "Coordinate grid",
    sourceButtonObjectIds: ["8"]}),
  Object.freeze({id: "ordered-pair", label: "Ordered pair",
    sourceButtonObjectIds: ["9", "77"]}),
  Object.freeze({id: "number", label: "Number", sourceButtonObjectIds: ["78"]}),
  Object.freeze({id: "unit", label: "Unit", sourceButtonObjectIds: ["79"]}),
  Object.freeze({id: "x-axis", label: "X-axis", sourceButtonObjectIds: ["80"]}),
  Object.freeze({id: "y-axis", label: "Y-axis", sourceButtonObjectIds: ["81"]}),
]);

export type CourseG04L11Vb007ChoiceId =
  (typeof COURSE_G04_L11_VB_007_CHOICES)[number]["id"];
export type CourseG04L11Vb007TermId =
  (typeof COURSE_G04_L11_VB_007_TERMS)[number]["id"];
export type CourseG04L11Vb007Phase =
  "prompt" | "feedback-correct" | "feedback-incorrect" |
  "remediation" | "glossary" | "completed";
type NonGlossaryPhase = Exclude<CourseG04L11Vb007Phase, "glossary">;

export interface CourseG04L11Vb007InteractionState {
  readonly sourceFrame: 69;
  readonly phase: CourseG04L11Vb007Phase;
  readonly returnPhase: NonGlossaryPhase;
  readonly selectedChoiceId: CourseG04L11Vb007ChoiceId | null;
  readonly selectedTermId: CourseG04L11Vb007TermId | null;
  readonly incorrectAttemptCount: 0 | 1 | 2;
  readonly quizEnabled: boolean;
  readonly interactionRevision: number;
  readonly legacyHostCallCount: 0;
  readonly audioEnabled: false;
  readonly spanishRuntimeEnabled: false;
}

export type CourseG04L11Vb007InteractionEvent =
  | Readonly<{type: "choose-answer"; choiceId: CourseG04L11Vb007ChoiceId}>
  | Readonly<{type: "try-again"}>
  | Readonly<{type: "continue-correct"}>
  | Readonly<{type: "review-coordinate-order"}>
  | Readonly<{type: "open-term"; termId: CourseG04L11Vb007TermId}>
  | Readonly<{type: "close-term"}>
  | Readonly<{type: "replay"}>;

export const COURSE_G04_L11_VB_007_INTERACTION_AUTHORITY = Object.freeze({
  implementationCandidateOnly: true,
  sourceCanvasSequencePreserved: true,
  pointAndAnswerSemanticsPreserved: true,
  animationInternalPedagogicalControlsPreserved: true,
  legacyCourseShellNavigationIncluded: false,
  legacyPlayerChromeIncluded: false,
  legacyGlobalsExecuted: false,
  sourceAudioEnabled: false,
  sourceAudioAccepted: false,
  sourceBranchCausalityEstablished: false,
  sourceFeedbackVariantParityEstablished: false,
  sourceDomainDeclared: false,
  registeredCurrentJavascript: false,
  authoritativeOriginalRuntimeAccepted: false,
  behaviorParityEstablished: false,
  visualFidelityEstablished: false,
  spanishSourceParityEstablished: false,
  humanVisualReviewAccepted: false,
  ownerAccepted: false,
  strictMigrationComplete: false,
  lessonReleased: false,
  published: false,
  strictAcceptanceEffect: "none",
});

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function freezeState(
  state: CourseG04L11Vb007InteractionState,
): CourseG04L11Vb007InteractionState {
  return Object.freeze(state);
}

function choiceById(choiceId: string) {
  return COURSE_G04_L11_VB_007_CHOICES.find((choice) =>
    choice.id === choiceId) ?? null;
}

function termById(termId: string) {
  return COURSE_G04_L11_VB_007_TERMS.find((term) => term.id === termId) ?? null;
}

export function createCourseG04L11Vb007InteractionState():
CourseG04L11Vb007InteractionState {
  return freezeState({
    sourceFrame: 69,
    phase: "prompt",
    returnPhase: "prompt",
    selectedChoiceId: null,
    selectedTermId: null,
    incorrectAttemptCount: 0,
    quizEnabled: true,
    interactionRevision: 0,
    legacyHostCallCount: 0,
    audioEnabled: false,
    spanishRuntimeEnabled: false,
  });
}

export function getCourseG04L11Vb007SelectedChoice(
  state: CourseG04L11Vb007InteractionState,
) {
  return state.selectedChoiceId ? choiceById(state.selectedChoiceId) : null;
}

export function getCourseG04L11Vb007SelectedTerm(
  state: CourseG04L11Vb007InteractionState,
) {
  return state.selectedTermId ? termById(state.selectedTermId) : null;
}

export function reduceCourseG04L11Vb007Interaction(
  state: CourseG04L11Vb007InteractionState,
  event: CourseG04L11Vb007InteractionEvent,
): CourseG04L11Vb007InteractionState {
  invariant(Object.isFrozen(state), "VB007 interaction state must be frozen");
  switch (event.type) {
    case "choose-answer": {
      invariant(state.phase === "prompt" && state.quizEnabled,
        "VB007 answer controls are not currently enabled");
      const choice = choiceById(event.choiceId);
      invariant(choice, `unknown VB007 answer: ${event.choiceId}`);
      if (choice.outcome === "correct") {
        return freezeState({...state, phase: "feedback-correct",
          returnPhase: "feedback-correct", selectedChoiceId: choice.id,
          quizEnabled: false,
          interactionRevision: state.interactionRevision + 1});
      }
      const incorrectAttemptCount = Math.min(2,
        state.incorrectAttemptCount + 1) as 1 | 2;
      const phase = incorrectAttemptCount === 2
        ? "remediation" : "feedback-incorrect";
      return freezeState({...state, phase, returnPhase: phase,
        selectedChoiceId: choice.id, incorrectAttemptCount,
        quizEnabled: false,
        interactionRevision: state.interactionRevision + 1});
    }
    case "try-again":
      invariant(state.phase === "feedback-incorrect",
        "VB007 Try Again is available only after the first incorrect answer");
      return freezeState({...state, phase: "prompt", returnPhase: "prompt",
        selectedChoiceId: null, quizEnabled: true,
        interactionRevision: state.interactionRevision + 1});
    case "review-coordinate-order":
      invariant(state.phase === "remediation",
        "VB007 coordinate-order review requires the remediation state");
      return freezeState({...state, phase: "prompt", returnPhase: "prompt",
        selectedChoiceId: null, incorrectAttemptCount: 0, quizEnabled: true,
        interactionRevision: state.interactionRevision + 1});
    case "continue-correct":
      invariant(state.phase === "feedback-correct",
        "VB007 completion requires a correct response");
      return freezeState({...state, phase: "completed",
        returnPhase: "completed", quizEnabled: false,
        interactionRevision: state.interactionRevision + 1});
    case "open-term": {
      const term = termById(event.termId);
      invariant(term, `unknown VB007 term: ${event.termId}`);
      invariant(state.phase !== "glossary",
        "VB007 glossary is already open");
      return freezeState({...state, phase: "glossary",
        returnPhase: state.phase, selectedTermId: term.id,
        quizEnabled: false,
        interactionRevision: state.interactionRevision + 1});
    }
    case "close-term":
      invariant(state.phase === "glossary",
        "VB007 glossary is not open");
      return freezeState({...state, phase: state.returnPhase,
        selectedTermId: null, quizEnabled: state.returnPhase === "prompt",
        interactionRevision: state.interactionRevision + 1});
    case "replay":
      return createCourseG04L11Vb007InteractionState();
    default:
      return event satisfies never;
  }
}
