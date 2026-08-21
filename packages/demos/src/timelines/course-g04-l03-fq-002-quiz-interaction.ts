import {COURSE_G04_L03_FQ_002_SOURCE} from "./course-g04-l03-fq-002";

export const COURSE_G04_L03_FQ_002_OPTION_IDS = Object.freeze([
  "A",
  "B",
  "C",
  "D",
] as const);

export type CourseG04L03Fq002OptionId =
  (typeof COURSE_G04_L03_FQ_002_OPTION_IDS)[number];

export type CourseG04L03Fq002OptionNumber = 1 | 2 | 3 | 4;

export type CourseG04L03Fq002Grade =
  | "Unsatisfactory"
  | "Partially Proficient"
  | "Proficient"
  | "Advanced";

export type CourseG04L03Fq002Phase = "question" | "results" | "review";

export type CourseG04L03Fq002DisabledIntegration =
  | "lms"
  | "get-url"
  | "host-close-report"
  | "audio"
  | "spanish";

export interface CourseG04L03Fq002Option {
  readonly id: CourseG04L03Fq002OptionId;
  readonly optionNumber: CourseG04L03Fq002OptionNumber;
  readonly sourceInstance: `A${number}Opt${CourseG04L03Fq002OptionNumber}`;
  readonly sourceText: string | null;
  readonly label: string;
  readonly contentKind: "source-text" | "source-symbol-only";
  readonly correct: boolean;
}

export interface CourseG04L03Fq002Question {
  readonly id: number;
  readonly questionLabel: `Q${number}`;
  readonly reviewLabel: `R${number}`;
  readonly questionFrame: number;
  readonly reviewFrame: number;
  readonly questionText: string;
  readonly contextText: readonly string[];
  readonly options: readonly CourseG04L03Fq002Option[];
  readonly correctOptionId: CourseG04L03Fq002OptionId;
  readonly correctOptionNumber: CourseG04L03Fq002OptionNumber;
}

export interface CourseG04L03Fq002Response {
  readonly sequenceNumber: number;
  readonly questionId: number;
  readonly questionLabel: `Q${number}`;
  readonly reviewLabel: `R${number}`;
  readonly questionFrame: number;
  readonly reviewFrame: number;
  readonly selectedOptionId: CourseG04L03Fq002OptionId;
  readonly selectedSourceInstance:
    `A${number}Opt${CourseG04L03Fq002OptionNumber}`;
  readonly correctOptionId: CourseG04L03Fq002OptionId;
  readonly correct: boolean;
}

export interface CourseG04L03Fq002Results {
  readonly score: number;
  readonly total: 10 | 25;
  readonly wrong: number;
  readonly grade: CourseG04L03Fq002Grade;
}

export interface CourseG04L03Fq002ReviewItem {
  readonly reviewIndex: number;
  readonly sequenceNumber: number;
  readonly reviewFrame: number;
  readonly question: CourseG04L03Fq002Question;
  readonly response: CourseG04L03Fq002Response;
}

export interface CourseG04L03Fq002InteractionState {
  readonly seed: number;
  readonly rngState: number;
  readonly randomDrawCount: number;
  readonly questionOrder: readonly number[];
  readonly phase: CourseG04L03Fq002Phase;
  readonly questionIndex: number | null;
  readonly sequenceNumber: number | null;
  readonly currentQuestion: CourseG04L03Fq002Question | null;
  readonly selectedOptionId: CourseG04L03Fq002OptionId | null;
  readonly responses: readonly CourseG04L03Fq002Response[];
  readonly score: number;
  readonly results: CourseG04L03Fq002Results | null;
  readonly reviewIndex: number | null;
  readonly reviewFrame: number | null;
}

export type CourseG04L03Fq002InteractionAction =
  | Readonly<{
      type: "select-option";
      optionId: CourseG04L03Fq002OptionId;
    }>
  | Readonly<{type: "submit"}>
  | Readonly<{
      type: "answer";
      optionId: CourseG04L03Fq002OptionId;
      questionId: number;
      sequenceNumber: number;
    }>
  | Readonly<{type: "start-review"}>
  | Readonly<{type: "review-previous"}>
  | Readonly<{type: "review-next"}>
  | Readonly<{type: "return-to-results"}>
  | Readonly<{type: "reset"; seed?: number}>
  | Readonly<{type: "replay"; seed?: number}>
  | Readonly<{
      type: "request-disabled-integration";
      integration: CourseG04L03Fq002DisabledIntegration;
    }>;

export const COURSE_G04_L03_FQ_002_TEXT_BINDING = Object.freeze({
  source:
    "work/animate/dependency-authoring-audits/course-g04-l03-fq-002/"
    + "runs/run-2lj30i/L3FQ02.fla-authoring-audit.json",
  sourceSha256:
    "7784f27f946e9b3ef78138c04138676d1d6f4acf09412c499d5fc7a9dbc4e05e",
  sourceLibraryItem: "Animation04",
  normalization:
    "outer authoring whitespace trimmed and CR normalized to LF; source Unicode and internal spacing retained",
  graphicalOptionPolicy:
    "Q7-Q12 have no authoring text inside A1-A4 option symbols; expose only Source symbol A-D labels",
});

export const COURSE_G04_L03_FQ_002_INTERACTION_AUTHORITY = Object.freeze({
  evidenceBasis:
    "hash-bound-source-local-quiz-contract-fla-authoring-audit-and-exact-avm1",
  implementationKind: "current-javascript-pure-state-candidate",
  questionSelectionMode:
    "seeded-current-javascript-ten-without-replacement",
  atomicAnswerEventBasis: "source-option-on-release-push-and-advance",
  separateSelectThenSubmitMode: "current-javascript-enhancement",
  textReviewNavigationMode: "current-javascript-previous-next-enhancement",
  questionSelectionExecutesAvm1Random: false,
  sourceRandomParityEstablished: false,
  sourceSeparateSelectSubmitParityEstablished: false,
  sourceReviewPreviousParityEstablished: false,
  sourceReviewVisualParityEstablished: false,
  sourceResultsVisualParityEstablished: false,
  sourceStaticDynamicVisibilityAndCounterParityEstablished: false,
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

export const COURSE_G04_L03_FQ_002_FUNCTIONAL_MASKING_POLICY = Object.freeze({
  sourceScriptMcFinishInitialVisibility: "hidden",
  sourceStaticCanvasFinishArtifact:
    "sprite-16-finish-artifact-is-always-drawn",
  sourceStaticCanvasQuestionCounters:
    "QuestNo-and-CQ-retain-source-question-id",
  sourceStaticDynamicVisibilityAndCounterParityEstablished: false,
  functionalPresentationMask:
    "opaque-modern-full-stage-backdrop-hides-source-canvas-visual-layer",
  functionalSequenceCounter: "selected-order-1-through-10",
  deterministicCaptureMask: "none",
  deterministicCaptureCanvas: "preserve-unmodified-source-static-drawing",
  canvasAssetMutation: "forbidden",
});

export const COURSE_G04_L03_FQ_002_DISABLED_INTEGRATIONS = Object.freeze({
  lms: Object.freeze({enabled: false}),
  getUrl: Object.freeze({enabled: false}),
  hostCloseReport: Object.freeze({enabled: false}),
  audio: Object.freeze({enabled: false}),
  spanish: Object.freeze({enabled: false}),
});

export const COURSE_G04_L03_FQ_002_CORRECT_OPTION_NUMBERS = Object.freeze([
  3, 3, 3, 1, 1,
  2, 1, 2, 1, 2,
  1, 2, 3, 1, 4,
  1, 3, 3, 2, 3,
  4, 1, 1, 1, 2,
] as const satisfies readonly CourseG04L03Fq002OptionNumber[]);

const SOURCE_QUESTION_TEXTS = Object.freeze([
  "The numbers in this pattern decrease by the same amount each time.  \n"
    + "What are the next three numbers in this pattern?",
  "The numbers in this pattern decrease by the same amount each time.  \n"
    + "What are the next three numbers in this pattern?",
  "The numbers in this pattern decrease by the same amount each time.  \n"
    + "What are the next three numbers in this pattern?",
  "The numbers in this pattern decrease by the same amount each time.  \n"
    + "What are the next three numbers in this pattern?",
  "The numbers in this pattern decrease by the same amount each time.  \n"
    + "What are the next three numbers in this pattern?",
  "The numbers in this pattern decrease by the same amount each time.  \n"
    + "What are the next three numbers in this pattern?",
  "Which symbol is located at  –4 on this number line?",
  "Which symbol is located at  –2 on this number line?",
  "Which symbol is located at  – 8 on this number line?",
  "Which symbol is located at  –1 on this number line?",
  "Which symbol is located at  –11 on this number line?",
  "Which symbol is located at –6 on this number line?",
  "Which list of numbers is shown in order from greatest to least?",
  "Which list of numbers is shown in order from least to greatest?",
  "Which list of numbers is shown in order from greatest to least?",
  "Which list of numbers is shown in order from least to greatest?",
  "Toni has $7.  Elvin has $3.  Susan owes $10.  Ricky owes $2.  \n"
    + "Who has the least amount of money?",
  "Grace has $3.  Luis has $5.  Maya owes $7.  Jason owes $12.  \n"
    + "Who has the most money?",
  "Grace has $3.  Luis has $5.  Maya owes $7.  Jason owes $12.  \n"
    + "Who has the least money?",
  "Christian has $2.  Patsy has $4.  Simon owes $5.  Mira owes $3.  \n"
    + "Who has the most money?",
  "Christian has $2.  Patsy has $4.  Simon owes $5.  Mira owes $3.  \n"
    + "Who has the least money?",
  "The table shows the lowest recorded temperatures in four states.  \n"
    + "Which state had the lowest low temperature?",
  "The table shows the lowest recorded temperatures in four states.  \n"
    + "Which state had the lowest low temperature?",
  "The table shows the lowest recorded temperatures in four states.  \n"
    + "Which state had the lowest low temperature?",
  "The table shows the lowest recorded temperatures in four states.  \n"
    + "Which state had the lowest low temperature?",
] as const);

const SOURCE_CONTEXT_TEXTS = Object.freeze([
  Object.freeze(["20, 16, 12, 8, 4, __, __, __"]),
  Object.freeze(["8, 6, 4, 2, 0, –2, __, __, __"]),
  Object.freeze(["15, 12, 9, 6, 3, __, __, __"]),
  Object.freeze(["54, 45, 36, 27, 18, __, __, __"]),
  Object.freeze(["15, 10, 5, 0, –5, __, __, __"]),
  Object.freeze(["50, 40, 30, 20, __, __, __"]),
  Object.freeze(["–5", "0", "5"]),
  Object.freeze(["–5", "0", "5"]),
  Object.freeze(["–10", "–5", "0", "5", "10"]),
  Object.freeze(["–10", "–5", "0", "5", "10"]),
  Object.freeze(["-15", "-10", "-5", "0", "5", "10", "15"]),
  Object.freeze(["-15", "-10", "-5", "0", "5", "10", "15"]),
  Object.freeze([]),
  Object.freeze([]),
  Object.freeze([]),
  Object.freeze([]),
  Object.freeze([]),
  Object.freeze([]),
  Object.freeze([]),
  Object.freeze([]),
  Object.freeze([]),
  Object.freeze([
    "State",
    "Lowest Recorded \nTemperature",
    "Alaska",
    "–80° F",
    "Maine",
    "–48° F",
    "Nebraska",
    "–47° F",
    "New York",
    "–52° F",
  ]),
  Object.freeze([
    "State",
    "Lowest Recorded \nTemperature",
    "Delaware",
    "–17° F",
    "Hawaii",
    "12° F",
    "California",
    "–45° F",
    "Illinois",
    "–36° F",
  ]),
  Object.freeze([
    "State",
    "Lowest Recorded \nTemperature",
    "Florida",
    "–2° F",
    "Louisiana",
    "–16° F",
    "Texas",
    "–23° F",
    "Arizona",
    "–40° F",
  ]),
  Object.freeze([
    "State",
    "Lowest Recorded \nTemperature",
    "Utah",
    "–69° F",
    "Montana",
    "–70° F",
    "Washington",
    "–48° F",
    "Idaho",
    "– 60° F",
  ]),
] as const);

type SourceOptionTextTuple = readonly [
  string | null,
  string | null,
  string | null,
  string | null,
];

const SOURCE_OPTION_TEXTS = Object.freeze([
  ["2, 0, –2", "0, –2, –4", "0, –4, –8", "2, –4, –8"],
  ["4, 6, 8", "0, –2, –4", "–4, –6, –8", "–4, –8, –12"],
  ["0, 3, 6", "6, 9, 12", "0, –3, –6", "–6, –9, –12"],
  ["9, 0, –9", "–9, 0,9", "0, –9, –18", "0, –9, –12"],
  ["–10, –15, –20", "–10, –20, –25", "–10, –20, –30", "–10, –15, –25"],
  ["10, 0, –20", "10, 0, –10", "0, –10, –20", "10, –10, –20"],
  [null, null, null, null],
  [null, null, null, null],
  [null, null, null, null],
  [null, null, null, null],
  [null, null, null, null],
  [null, null, null, null],
  ["–10, –6, 2, 8", "2, –6, 8, –10", "8, 2, –6, –10", "–10, 8, –6, 2"],
  ["–10, –6, 2, 8", "2, –6, 8, –10", "8, 2, –6, –10", "–10, 8, –6, 2"],
  ["–7, –1, 3, 5", "–1, 3, 5, –7", "–7, 5, 3, –1", "5, 3, –1, –7"],
  ["–7, –1, 3, 5", "–1, 3, 5, –7", "–7, 5, 3, –1", "5, 3, –1, –7"],
  ["Elvin", "Ricky", "Susan", "Toni"],
  ["Grace", "Jason", "Luis", "Maya"],
  ["Grace", "Jason", "Luis", "Maya"],
  ["Christian", "Mira", "Patsy", "Simon"],
  ["Christian", "Mira", "Patsy", "Simon"],
  ["Alaska", "Maine", "Nebraska", "New York"],
  ["California", "Delaware", "Hawaii", "Illinois"],
  ["Arizona", "Florida", "Louisiana", "Texas"],
  ["Idaho", "Montana", "Utah", "Washington"],
] as const satisfies readonly SourceOptionTextTuple[]);

const freezeOption = (
  option: CourseG04L03Fq002Option,
): CourseG04L03Fq002Option => Object.freeze({...option});

const buildQuestionInventory = (): readonly CourseG04L03Fq002Question[] => {
  if (
    SOURCE_QUESTION_TEXTS.length !== 25
    || SOURCE_CONTEXT_TEXTS.length !== 25
    || SOURCE_OPTION_TEXTS.length !== 25
    || COURSE_G04_L03_FQ_002_CORRECT_OPTION_NUMBERS.length !== 25
  ) {
    throw new Error("FQ002 source question inventory must contain 25 entries");
  }

  return Object.freeze(SOURCE_QUESTION_TEXTS.map((questionText, index) => {
    const id = index + 1;
    const correctOptionNumber =
      COURSE_G04_L03_FQ_002_CORRECT_OPTION_NUMBERS[index];
    const sourceOptionTexts = SOURCE_OPTION_TEXTS[index];
    const contextText = SOURCE_CONTEXT_TEXTS[index];

    if (
      correctOptionNumber === undefined
      || sourceOptionTexts === undefined
      || contextText === undefined
    ) {
      throw new Error(`FQ002 source question ${id} is incomplete`);
    }

    const correctOptionId =
      COURSE_G04_L03_FQ_002_OPTION_IDS[correctOptionNumber - 1];
    if (correctOptionId === undefined) {
      throw new Error(`FQ002 source question ${id} has an invalid answer`);
    }

    const options = Object.freeze(
      COURSE_G04_L03_FQ_002_OPTION_IDS.map((optionId, optionIndex) => {
        const optionNumber =
          (optionIndex + 1) as CourseG04L03Fq002OptionNumber;
        const sourceText = sourceOptionTexts[optionIndex] ?? null;
        return freezeOption({
          id: optionId,
          optionNumber,
          sourceInstance: `A${id}Opt${optionNumber}`,
          sourceText,
          label: sourceText ?? `Source symbol ${optionId}`,
          contentKind:
            sourceText === null ? "source-symbol-only" : "source-text",
          correct: optionNumber === correctOptionNumber,
        });
      }),
    );

    return Object.freeze({
      id,
      questionLabel: `Q${id}`,
      reviewLabel: `R${id}`,
      questionFrame: id + 1,
      reviewFrame: id + 43,
      questionText,
      contextText: Object.freeze([...contextText]),
      options,
      correctOptionId,
      correctOptionNumber,
    });
  }));
};

export const COURSE_G04_L03_FQ_002_QUESTIONS = buildQuestionInventory();

const UINT32_RANGE = 4_294_967_296;
const MULBERRY32_INCREMENT = 0x6d2b79f5;
const SELECTED_QUESTION_COUNT = 10;

const normalizeSeed = (seed: number): number =>
  Number.isSafeInteger(seed) ? seed >>> 0 : 0;

const nextCurrentJsRandom = (
  rngState: number,
): Readonly<{rngState: number; value: number}> => {
  const nextState = (rngState + MULBERRY32_INCREMENT) >>> 0;
  let value = nextState;
  value = Math.imul(value ^ (value >>> 15), value | 1);
  value ^= value + Math.imul(value ^ (value >>> 7), value | 61);

  return Object.freeze({
    rngState: nextState,
    value: ((value ^ (value >>> 14)) >>> 0) / UINT32_RANGE,
  });
};

const drawCurrentJsQuestionOrder = (
  seed: number,
): Readonly<{
  questionIds: readonly number[];
  rngState: number;
}> => {
  const pool = COURSE_G04_L03_FQ_002_QUESTIONS.map(({id}) => id);
  const questionIds: number[] = [];
  let rngState = seed;

  while (questionIds.length < SELECTED_QUESTION_COUNT) {
    const random = nextCurrentJsRandom(rngState);
    rngState = random.rngState;
    const poolIndex = Math.floor(random.value * pool.length);
    const [questionId] = pool.splice(poolIndex, 1);
    if (questionId === undefined) {
      throw new Error("FQ002 current-JS question draw exhausted its pool");
    }
    questionIds.push(questionId);
  }

  return Object.freeze({
    questionIds: Object.freeze(questionIds),
    rngState,
  });
};

export const selectCourseG04L03Fq002QuestionOrder = (
  seed = 0,
): readonly number[] =>
  drawCurrentJsQuestionOrder(normalizeSeed(seed)).questionIds;

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

export const gradeCourseG04L03Fq002Score = (
  score: number,
): CourseG04L03Fq002Grade | null => {
  if (!Number.isInteger(score) || score < 0 || score > 10) return null;
  if (score <= 3) return "Unsatisfactory";
  if (score <= 6) return "Partially Proficient";
  if (score <= 8) return "Proficient";
  return "Advanced";
};

export const createCourseG04L03Fq002InteractionState = (
  seed = 0,
): CourseG04L03Fq002InteractionState => {
  const normalizedSeed = normalizeSeed(seed);
  const selection = drawCurrentJsQuestionOrder(normalizedSeed);
  const firstQuestionId = selection.questionIds[0];
  const firstQuestion =
    firstQuestionId === undefined ? null : questionForId(firstQuestionId);

  if (firstQuestion === null) {
    throw new Error("FQ002 current-JS selection must contain a first question");
  }

  return freezeState({
    seed: normalizedSeed,
    rngState: selection.rngState,
    randomDrawCount: 10,
    questionOrder: selection.questionIds,
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

  if (nextQuestionIndex >= SELECTED_QUESTION_COUNT) {
    const grade = gradeCourseG04L03Fq002Score(score);
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
        total: 10,
        wrong: 10 - score,
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

export const getCourseG04L03Fq002ReviewItem = (
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

export const reduceCourseG04L03Fq002Interaction = (
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
        || state.responses.length !== SELECTED_QUESTION_COUNT
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
      return createCourseG04L03Fq002InteractionState(
        action.seed ?? state.seed,
      );

    case "request-disabled-integration":
      return state;

    default:
      return state;
  }
};

export const COURSE_G04_L03_FQ_002_INTERACTION_SOURCE = Object.freeze({
  animationId: "course-g04-l03-fq-002",
  swf: COURSE_G04_L03_FQ_002_SOURCE.swf,
  swfSha256: COURSE_G04_L03_FQ_002_SOURCE.swfSha256,
  fla: COURSE_G04_L03_FQ_002_SOURCE.fla,
  flaSha256: COURSE_G04_L03_FQ_002_SOURCE.flaSha256,
  frameDomain: "sprite-899",
  questionFrames: Object.freeze({first: 2, last: 26}),
  reviewFrames: Object.freeze({first: 44, last: 68}),
  selectedQuestionCount: 10,
  sourceQuestionCount: 25,
});
