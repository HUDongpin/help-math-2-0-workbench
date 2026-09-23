import {
  COURSE_G04_L03_FQ_002_OPTION_IDS,
  COURSE_G04_L03_FQ_002_QUESTIONS,
  type CourseG04L03Fq002Grade,
  type CourseG04L03Fq002InteractionAction,
  type CourseG04L03Fq002InteractionState,
  type CourseG04L03Fq002OptionId,
  type CourseG04L03Fq002Question,
  type CourseG04L03Fq002Response,
  type CourseG04L03Fq002ReviewItem,
} from "./course-g04-l03-fq-002-quiz-interaction";
import {COURSE_G04_L03_FQ_003_SOURCE} from "./course-g04-l03-fq-003";

const SOURCE_QUESTION_COUNT = 25;

const normalizeSeed = (seed: number): number =>
  Number.isSafeInteger(seed) ? seed >>> 0 : 0;

const questionForId = (
  questionId: number,
): CourseG04L03Fq002Question | null =>
  COURSE_G04_L03_FQ_002_QUESTIONS[questionId - 1] ?? null;

const isOptionId = (value: unknown): value is CourseG04L03Fq002OptionId =>
  typeof value === "string"
  && COURSE_G04_L03_FQ_002_OPTION_IDS.some((optionId) => optionId === value);

const freezeResponse = (
  response: CourseG04L03Fq002Response,
): CourseG04L03Fq002Response => Object.freeze({...response});

const freezeState = (
  state: CourseG04L03Fq002InteractionState,
): CourseG04L03Fq002InteractionState => Object.freeze({
  ...state,
  questionOrder: Object.freeze([...state.questionOrder]),
  responses: Object.freeze(state.responses.map(freezeResponse)),
  results: state.results === null ? null : Object.freeze({...state.results}),
});

/**
 * The shipped FQ003 AVM1 keeps the same legacy score bands used by the
 * random-ten placement even though this placement asks all 25 questions.
 * Preserve that source fact explicitly; do not silently normalize to a
 * percentage-based modern grade.
 */
export const gradeCourseG04L03Fq003LegacyScore = (
  score: number,
): CourseG04L03Fq002Grade | null => {
  if (!Number.isInteger(score) || score < 0 || score > SOURCE_QUESTION_COUNT) {
    return null;
  }
  if (score <= 3) return "Unsatisfactory";
  if (score <= 6) return "Partially Proficient";
  if (score <= 8) return "Proficient";
  return "Advanced";
};

export const COURSE_G04_L03_FQ_003_QUESTION_ORDER = Object.freeze(
  COURSE_G04_L03_FQ_002_QUESTIONS.map(({id}) => id),
);

export const createCourseG04L03Fq003InteractionState = (
  seed = 0,
): CourseG04L03Fq002InteractionState => {
  const firstQuestionId = COURSE_G04_L03_FQ_003_QUESTION_ORDER[0];
  const firstQuestion =
    firstQuestionId === undefined ? null : questionForId(firstQuestionId);

  if (firstQuestion === null) {
    throw new Error("FQ003 source order must contain a first question");
  }

  const normalizedSeed = normalizeSeed(seed);
  return freezeState({
    seed: normalizedSeed,
    rngState: normalizedSeed,
    randomDrawCount: 0,
    questionOrder: COURSE_G04_L03_FQ_003_QUESTION_ORDER,
    phase: "question",
    questionIndex: 0,
    sequenceNumber: 1,
    currentQuestion: firstQuestion,
    selectedOptionId: null,
    responses: [],
    score: 0,
    results: null,
    reviewIndex: null,
    reviewFrame: null,
  });
};

const answerCurrentQuestion = (
  state: CourseG04L03Fq002InteractionState,
  optionId: unknown,
  expectedIdentity?: Readonly<{
    questionId: unknown;
    sequenceNumber: unknown;
  }>,
): CourseG04L03Fq002InteractionState => {
  if (
    state.phase !== "question"
    || state.questionIndex === null
    || state.sequenceNumber === null
    || state.currentQuestion === null
    || !isOptionId(optionId)
  ) return state;

  if (
    expectedIdentity !== undefined
    && (
      expectedIdentity.questionId !== state.currentQuestion.id
      || expectedIdentity.sequenceNumber !== state.sequenceNumber
    )
  ) return state;

  const selectedOption = state.currentQuestion.options.find(
    ({id}) => id === optionId,
  );
  if (selectedOption === undefined) return state;

  const correct = optionId === state.currentQuestion.correctOptionId;
  const response = freezeResponse({
    sequenceNumber: state.sequenceNumber,
    questionId: state.currentQuestion.id,
    questionLabel: state.currentQuestion.questionLabel,
    reviewLabel: state.currentQuestion.reviewLabel,
    questionFrame: state.currentQuestion.questionFrame,
    reviewFrame: state.currentQuestion.reviewFrame,
    selectedOptionId: optionId,
    selectedSourceInstance: selectedOption.sourceInstance,
    correctOptionId: state.currentQuestion.correctOptionId,
    correct,
  });
  const responses = [...state.responses, response];
  const score = state.score + (correct ? 1 : 0);
  const nextQuestionIndex = state.questionIndex + 1;

  if (nextQuestionIndex >= SOURCE_QUESTION_COUNT) {
    const grade = gradeCourseG04L03Fq003LegacyScore(score);
    if (grade === null) return state;

    return freezeState({
      ...state,
      phase: "results",
      questionIndex: null,
      sequenceNumber: null,
      currentQuestion: null,
      selectedOptionId: null,
      responses,
      score,
      results: {
        score,
        total: SOURCE_QUESTION_COUNT,
        wrong: SOURCE_QUESTION_COUNT - score,
        grade,
      },
      reviewIndex: null,
      reviewFrame: null,
    });
  }

  const nextQuestionId = state.questionOrder[nextQuestionIndex];
  const nextQuestion =
    nextQuestionId === undefined ? null : questionForId(nextQuestionId);
  if (nextQuestion === null) return state;

  return freezeState({
    ...state,
    questionIndex: nextQuestionIndex,
    sequenceNumber: nextQuestionIndex + 1,
    currentQuestion: nextQuestion,
    selectedOptionId: null,
    responses,
    score,
  });
};

export const getCourseG04L03Fq003ReviewItem = (
  state: CourseG04L03Fq002InteractionState,
): CourseG04L03Fq002ReviewItem | null => {
  if (state.phase !== "review" || state.reviewIndex === null) return null;
  const response = state.responses[state.reviewIndex];
  if (response === undefined) return null;
  const question = questionForId(response.questionId);
  if (question === null || question.reviewFrame !== state.reviewFrame) {
    return null;
  }

  return Object.freeze({
    reviewIndex: state.reviewIndex,
    sequenceNumber: response.sequenceNumber,
    reviewFrame: question.reviewFrame,
    question,
    response,
  });
};

export const reduceCourseG04L03Fq003Interaction = (
  state: CourseG04L03Fq002InteractionState,
  action: CourseG04L03Fq002InteractionAction,
): CourseG04L03Fq002InteractionState => {
  switch (action.type) {
    case "select-option":
      if (
        state.phase !== "question"
        || !isOptionId(action.optionId)
        || state.selectedOptionId === action.optionId
      ) return state;
      return freezeState({...state, selectedOptionId: action.optionId});

    case "submit":
      return state.selectedOptionId === null
        ? state
        : answerCurrentQuestion(state, state.selectedOptionId);

    case "answer":
      return answerCurrentQuestion(state, action.optionId, {
        questionId: action.questionId,
        sequenceNumber: action.sequenceNumber,
      });

    case "start-review": {
      if (
        state.phase !== "results"
        || state.results === null
        || state.responses.length !== SOURCE_QUESTION_COUNT
      ) return state;
      const firstResponse = state.responses[0];
      if (firstResponse === undefined) return state;
      return freezeState({
        ...state,
        phase: "review",
        reviewIndex: 0,
        reviewFrame: firstResponse.reviewFrame,
      });
    }

    case "review-previous": {
      if (
        state.phase !== "review"
        || state.reviewIndex === null
        || state.reviewIndex <= 0
      ) return state;
      const reviewIndex = state.reviewIndex - 1;
      const response = state.responses[reviewIndex];
      if (response === undefined) return state;
      return freezeState({
        ...state,
        reviewIndex,
        reviewFrame: response.reviewFrame,
      });
    }

    case "review-next": {
      if (
        state.phase !== "review"
        || state.reviewIndex === null
        || state.reviewIndex >= state.responses.length - 1
      ) return state;
      const reviewIndex = state.reviewIndex + 1;
      const response = state.responses[reviewIndex];
      if (response === undefined) return state;
      return freezeState({
        ...state,
        reviewIndex,
        reviewFrame: response.reviewFrame,
      });
    }

    case "return-to-results":
      if (state.phase !== "review" || state.results === null) return state;
      return freezeState({
        ...state,
        phase: "results",
        reviewIndex: null,
        reviewFrame: null,
      });

    case "reset":
    case "replay":
      return createCourseG04L03Fq003InteractionState(
        action.seed ?? state.seed,
      );

    case "request-disabled-integration":
      return state;

    default:
      return state;
  }
};

export const COURSE_G04_L03_FQ_003_INTERACTION_AUTHORITY = Object.freeze({
  evidenceBasis:
    "hash-bound-fq003-avm1-sequential-question-arrays-and-fq002-fq003-shared-visual-definitions",
  implementationKind: "current-javascript-pure-state-candidate",
  questionSelectionMode: "source-sequential-twenty-five",
  sourceTotalQuestionsCount: SOURCE_QUESTION_COUNT,
  sourceRandomCallCount: 0,
  sourceLegacyGradeBandsPreserved: true,
  sourceLegacyGradeBandsFitTwentyFiveQuestionTotal: false,
  questionVisualInventoryReusedFromEquivalentFq002Definitions: true,
  lmsIntegrationEnabled: false,
  legacyGetUrlEnabled: false,
  hostCloseReportEnabled: false,
  audioEnabled: false,
  spanishEnabled: false,
  behaviorParityEstablished: false,
  replayParityEstablished: false,
  authoritativeOriginalRuntimeAccepted: false,
  naturalRuntimeTraceAccepted: false,
  humanVisualReviewAccepted: false,
  ownerAccepted: false,
  strictMigrationComplete: false,
  strictAcceptanceEffect: "none",
});

export const COURSE_G04_L03_FQ_003_INTERACTION_SOURCE = Object.freeze({
  animationId: "course-g04-l03-fq-003",
  swf: COURSE_G04_L03_FQ_003_SOURCE.swf,
  swfSha256: COURSE_G04_L03_FQ_003_SOURCE.swfSha256,
  fla: COURSE_G04_L03_FQ_003_SOURCE.fla,
  flaSha256: COURSE_G04_L03_FQ_003_SOURCE.flaSha256,
  frameDomain: "sprite-899",
  questionFrames: Object.freeze({first: 2, last: 26}),
  reviewFrames: Object.freeze({first: 44, last: 68}),
  questionCount: SOURCE_QUESTION_COUNT,
  selectionMode: "source-sequential",
  mainScript: Object.freeze({
    path: "DefineSprite_899/frame_1/DoAction.as",
    sha256: "ea7d8027281fd28b100b15117522e2103b97799120d84b19ff64fcf41411db78",
  }),
  sourceTotalQuestionsExpression: "_global.totalQuestionsCount = 25",
  disabledIntegrations: Object.freeze([
    "lms",
    "quiz-report-url",
    "get-url",
    "host-close-report",
    "audio",
    "spanish",
  ]),
});
