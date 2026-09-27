import {
  COURSE_G04_L03_FQ_002_OPTION_IDS,
  type CourseG04L03Fq002DisabledIntegration,
  type CourseG04L03Fq002Grade,
  type CourseG04L03Fq002InteractionAction,
  type CourseG04L03Fq002InteractionState,
  type CourseG04L03Fq002Option,
  type CourseG04L03Fq002OptionId,
  type CourseG04L03Fq002OptionNumber,
  type CourseG04L03Fq002Question,
  type CourseG04L03Fq002Response,
  type CourseG04L03Fq002ReviewItem,
} from "./course-g04-l03-fq-002-quiz-interaction";

const SOURCE_QUESTION_COUNT = 26;

const SOURCE_QUESTION_SPECS = Object.freeze([
  ["Which point is located at (1,3)?", ["Point J", "Point K", "Point L", "Point M"], 1],
  ["Which point is located at (6,5)?", ["Point J", "Point K", "Point L", "Point M"], 2],
  ["Which point is located at (4,2)?", ["Point J", "Point K", "Point L", "Point M"], 3],
  ["Which point is located at (2,7)?", ["Point M", "Point N", "Point O", "Point P"], 1],
  ["Which point is located at (7,2)?", ["Point M", "Point N", "Point O", "Point P"], 2],
  ["Which point is located at (8,1)?", ["Point M", "Point N", "Point O", "Point Q"], 4],
  ["What are the coordinates for point A?", ["(5,9)", "(9,4)", "(9,5)", "(10,9)"], 3],
  ["What are the coordinates for point B?", ["(5,7)", "(5,8)", "(7,5)", "(7,8)"], 1],
  ["What are the coordinates for point C?", ["(3,4)", "(4,3)", "(4,4)", "(5,5)"], 2],
  ["What are the coordinates for point D?", ["(0,8)", "(0,7)", "(1,7)", "(1,8)"], 4],
  ["What are the coordinates for point E?", ["(1,5)", "(2,5)", "(5,1)", "(5,2)"], 2],
  ["What are the coordinates for point F?", ["(6,2)", "(7,2)", "(8,2)", "(9,2)"], 3],
  ["What is the length of this line segment?", ["6 units", "7 units", "8 units", "9 units"], 3],
  ["What is the length of this line segment?", ["2 units", "5 units", "6 units", "7 units"], 2],
  ["What is the length of this line segment?", ["3 units", "4 units", "7 units", "10 units"], 1],
  ["What is the length of this line segment?", ["2 units", "4 units", "6 units", "8 units"], 1],
  ["What is the length of this line segment?", ["3 units", "4 units", "5 units", "6 units"], 2],
  ["What is the length of this line segment?", ["7 units", "8 units", "9 units", "10 units"], 1],
  [
    "Point X is at (7,8). Point Y is at (7,3). How can you find the number of units from point X to point Y?",
    ["Add: 8 + 3", "Add: 7 + 7", "Subtract: 8 - 3", "Subtract: 8 - 7"],
    3,
  ],
  [
    "Point S is at (3,1). Point T is at (3,4). How can you find the number of units from point S to point T?",
    ["Add: 1 + 3", "Add: 1 + 4", "Subtract: 3 - 1", "Subtract: 4 - 1"],
    4,
  ],
  [
    "Point K is at (1,4). Point M is at (5,4). How can you find the number of units from point K to point M?",
    ["Add: 1 + 4", "Add: 1 + 5", "Subtract: 5 - 1", "Subtract: 5 - 4"],
    3,
  ],
  [
    "Point P is at (3,1). Point Q is at (9,1). How can you find the number of units from point P to point Q?",
    ["Add: 3 + 1", "Add: 3 + 9", "Subtract: 3 - 1", "Subtract: 9 - 3"],
    4,
  ],
  [
    "Andy used the equation x + 5 = y to plot these 3 points on a coordinate grid. The 3 points are all on a straight line. If he plots another point on the line, what could be its coordinates?",
    ["(1,5)", "(4,8)", "(5,10)", "(6,10)"],
    3,
  ],
  [
    "Shang used the equation 9 - x = y to plot these 3 points on a coordinate grid. The 3 points are all on a straight line. If he plots another point on the line, what could be its coordinates?",
    ["(2,6)", "(2,8)", "(4,4)", "(4,5)"],
    4,
  ],
  [
    "Rosa used the equation x - 2 = y to plot these 3 points on a coordinate grid. The 3 points are all on a straight line. If she plots another point on the line, what could be its coordinates?",
    ["(4,2)", "(5,2)", "(6,3)", "(7,6)"],
    1,
  ],
  [
    "Jennifer used the equation 2x + 2 = y to plot these 3 points on a coordinate grid. The 3 points are all on a straight line. If she plots another point on the line, what could be its coordinates?",
    ["(1,3)", "(1,4)", "(2,5)", "(3,6)"],
    2,
  ],
] as const);

const optionIdForNumber = (
  optionNumber: CourseG04L03Fq002OptionNumber,
): CourseG04L03Fq002OptionId =>
  COURSE_G04_L03_FQ_002_OPTION_IDS[optionNumber - 1];

const freezeQuestion = (
  id: number,
  spec: (typeof SOURCE_QUESTION_SPECS)[number],
): CourseG04L03Fq002Question => {
  const [questionText, optionTexts, correctOptionNumber] = spec;
  const correctOptionId = optionIdForNumber(correctOptionNumber);
  const options = optionTexts.map((sourceText, index) => {
    const optionNumber = (index + 1) as CourseG04L03Fq002OptionNumber;
    const idForOption = optionIdForNumber(optionNumber);
    return Object.freeze({
      id: idForOption,
      optionNumber,
      sourceInstance: `A${id}Opt${optionNumber}`,
      sourceText,
      label: sourceText,
      contentKind: "source-text",
      correct: idForOption === correctOptionId,
    }) as CourseG04L03Fq002Option;
  });

  return Object.freeze({
    id,
    questionLabel: `Q${id}`,
    reviewLabel: `R${id}`,
    questionFrame: id + 1,
    reviewFrame: id + 45,
    questionText,
    contextText: Object.freeze([]),
    options: Object.freeze(options),
    correctOptionId,
    correctOptionNumber,
  });
};

export const COURSE_G04_L11_FQ_003_QUESTIONS = Object.freeze(
  SOURCE_QUESTION_SPECS.map((spec, index) => freezeQuestion(index + 1, spec)),
);

export const COURSE_G04_L11_FQ_003_QUESTION_ORDER = Object.freeze(
  COURSE_G04_L11_FQ_003_QUESTIONS.map(({id}) => id),
);

export const COURSE_G04_L11_FQ_003_INTERACTION_SOURCE = Object.freeze({
  swf: Object.freeze({
    path: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/L11FQ03.swf",
    sha256: "d23b4731d38748f012d914fac027f1c79ab725f0f767138a47d9ac4c99463ad0",
  }),
  declaredTimeline: Object.freeze({
    id: "sprite-910",
    frameCount: 72,
    actionFrames: Object.freeze([1, 29, 45]),
    actionFrameSequenceSha256:
      "7095a44e6932286e17b87b6263eabeb07049991e15a87f567c280dff2c0af849",
  }),
  ffdecScripts: Object.freeze({
    path: "migrations/course-g04-l11-fq-003/audit/machine/ffdec-scripts.txt.gz",
    bytes: 3_826,
    sha256: "21ea324d1b2082f8334f2a8bc7868396453dea83f91d814f898afcc1ba76f3cf",
    script: "DefineSprite_910/frame_1/DoAction.as",
  }),
  independentFrameDomainEvidence: Object.freeze({
    path: "migrations/course-g04-l11-fq-003/audit/source-proven-independent-frame-domain-evidence.json",
    bytes: 6_592,
    sha256: "eb7572eacee0f99fe4c412ffdf5a9a9fd81db2e821ff11269297a2153a815ab4",
  }),
  questionCount: SOURCE_QUESTION_COUNT,
  questionFrames: "Q1-Q26 at sprite-910 frames 2-27",
  reviewFrames: "R1-R26 at sprite-910 frames 46-71",
  answerAdvanceShape:
    "source option on(release) records instance and immediately invokes doGetRandomQuiz",
});

export const COURSE_G04_L11_FQ_003_INTERACTION_AUTHORITY = Object.freeze({
  evidenceBasis:
    "hash-bound-source-local-avm1-and-declared-sprite-910-frame-domain",
  implementationKind: "current-javascript-pure-state-candidate",
  productCourseShellReimplemented: false,
  animationInternalPedagogicalControlsPreserved: true,
  questionSelectionMode: "source-sequential-Q1-through-Q26",
  sourceQuestionSelectionExecutesRandomness: false,
  sourceAtomicAnswerAndImmediateAdvanceImplemented: true,
  currentJavascriptSeparateSelectSubmitEnhancement: true,
  currentJavascriptReviewPreviousEnhancement: true,
  currentJavascriptWholeStateResetImplemented: true,
  sourceReplayTargetEstablished: false,
  sourceReplayParityEstablished: false,
  sourceQuestionVisualParityEstablished: false,
  sourceReviewVisualParityEstablished: false,
  sourceResultsVisualParityEstablished: false,
  lmsIntegrationEnabled: false,
  legacyGetUrlEnabled: false,
  hostCloseReportEnabled: false,
  audioEnabled: false,
  spanishEnabled: false,
  authoritativeOriginalRuntimeAccepted: false,
  naturalRuntimeTraceAccepted: false,
  humanVisualReviewAccepted: false,
  ownerAccepted: false,
  strictMigrationComplete: false,
  lessonPublished: false,
  strictAcceptanceEffect: "none",
});

const normalizeSeed = (seed: number): number =>
  Number.isSafeInteger(seed) ? seed >>> 0 : 0;

const questionForId = (id: number): CourseG04L03Fq002Question | null =>
  COURSE_G04_L11_FQ_003_QUESTIONS[id - 1] ?? null;

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

export const gradeCourseG04L11Fq003LegacyScore = (
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

export const createCourseG04L11Fq003InteractionState = (
  seed = 0,
): CourseG04L03Fq002InteractionState => {
  const firstQuestion = COURSE_G04_L11_FQ_003_QUESTIONS[0];
  if (firstQuestion === undefined) {
    throw new Error("FQ003 must contain a first source question");
  }
  const normalizedSeed = normalizeSeed(seed);
  return freezeState({
    seed: normalizedSeed,
    rngState: normalizedSeed,
    randomDrawCount: 0,
    questionOrder: COURSE_G04_L11_FQ_003_QUESTION_ORDER,
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
  expectedIdentity?: Readonly<{questionId: unknown; sequenceNumber: unknown}>,
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
    const grade = gradeCourseG04L11Fq003LegacyScore(score);
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
  const nextQuestion = nextQuestionId === undefined
    ? null
    : questionForId(nextQuestionId);
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

export const getCourseG04L11Fq003ReviewItem = (
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

export const reduceCourseG04L11Fq003Interaction = (
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
      return freezeState({...state, reviewIndex, reviewFrame: response.reviewFrame});
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
      return freezeState({...state, reviewIndex, reviewFrame: response.reviewFrame});
    }

    case "return-to-results":
      if (state.phase !== "review") return state;
      return freezeState({...state, phase: "results", reviewIndex: null, reviewFrame: null});

    case "reset":
    case "replay":
      return createCourseG04L11Fq003InteractionState(action.seed ?? state.seed);

    case "request-disabled-integration": {
      const disabled: readonly CourseG04L03Fq002DisabledIntegration[] = [
        "lms",
        "get-url",
        "host-close-report",
        "audio",
        "spanish",
      ];
      return disabled.includes(action.integration) ? state : state;
    }

    default:
      return state;
  }
};
