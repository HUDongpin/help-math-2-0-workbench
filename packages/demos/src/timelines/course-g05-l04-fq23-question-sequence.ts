export type G5L4Fq23AnimationId =
  | "course-g05-l04-fq-002"
  | "course-g05-l04-fq-003";

export type G5L4Fq23QuestionSelectionKind =
  | "random-without-replacement"
  | "sequential";

export type G5L4Fq23AnswerOption = "A" | "B" | "C" | "D";

export type G5L4Fq23QuestionSequenceMode =
  | "question"
  | "results"
  | "review";

export interface G5L4Fq23QuestionSequenceConfig {
  readonly animationId: G5L4Fq23AnimationId;
  readonly sourceSelection: Readonly<{
    kind: G5L4Fq23QuestionSelectionKind;
    sourceQuestionCount: 18;
    sourcePresentedQuestionCount: 10 | 18;
    sourceExpression: string;
  }>;
}

export interface G5L4Fq23QuestionResponse {
  readonly sequencePosition: number;
  readonly questionNumber: number;
  readonly questionLabel: string;
  readonly selectedOption: G5L4Fq23AnswerOption;
  readonly correctOption: G5L4Fq23AnswerOption;
  readonly responseInstanceName: string;
  readonly correctInstanceName: string;
  readonly correct: boolean;
}

export interface G5L4Fq23QuestionSequenceState {
  readonly animationId: G5L4Fq23AnimationId;
  readonly seed: number;
  readonly rngState: number;
  readonly selectionKind: G5L4Fq23QuestionSelectionKind;
  readonly sourceQuestionCount: 18;
  readonly sourcePresentedQuestionCount: 10 | 18;
  readonly questionOrder: readonly number[];
  readonly mode: G5L4Fq23QuestionSequenceMode;
  readonly questionPosition: number;
  readonly reviewPosition: number;
  readonly selectedOption: G5L4Fq23AnswerOption | null;
  readonly responses: readonly G5L4Fq23QuestionResponse[];
  readonly correctCount: number;
  readonly wrongCount: number;
  readonly grade: G5L4Fq23Grade | null;
  readonly completed: boolean;
  readonly legacyActionScriptExecuted: false;
  readonly exactAvm1RandomOrderEstablished: false;
  readonly sourceReviewVisualParityEstablished: false;
  readonly networkReportingEnabled: false;
  readonly audioEnabled: false;
  readonly spanishEnabled: false;
}

export type G5L4Fq23QuestionSequenceAction =
  | Readonly<{type: "select-answer"; option: G5L4Fq23AnswerOption}>
  | Readonly<{type: "submit-answer"}>
  | Readonly<{type: "begin-review"}>
  | Readonly<{type: "review-previous"}>
  | Readonly<{type: "review-next"}>
  | Readonly<{type: "show-results"}>
  | Readonly<{type: "reset"; seed?: number}>
  | Readonly<{type: "replay"; seed?: number}>;

export type G5L4Fq23Grade =
  | "Unsatisfactory"
  | "Partially Proficient"
  | "Proficient"
  | "Advanced";

export const G5_L4_FQ23_ANSWER_OPTIONS = Object.freeze([
  "A",
  "B",
  "C",
  "D",
] as const);

export const G5_L4_FQ23_CORRECT_OPTIONS = Object.freeze([
  "C", "B", "D", "B", "C", "D", "A", "B", "C",
  "A", "B", "C", "A", "D", "D", "A", "A", "D",
] as const satisfies readonly G5L4Fq23AnswerOption[]);

export const G5_L4_FQ23_SOURCE_CORRECT_INSTANCE_NAMES = Object.freeze(
  G5_L4_FQ23_CORRECT_OPTIONS.map(
    (option, index) =>
      `A${index + 1}Opt${G5_L4_FQ23_ANSWER_OPTIONS.indexOf(option) + 1}`,
  ),
);

const COMMON_SCRIPT_EVIDENCE = Object.freeze({
  finishScoringScript: Object.freeze({
    sourcePath: "DefineSprite_16/frame_2/DoAction.as",
    bytes: 1_404,
    lineCount: 32,
    sha256:
      "a70277f4ebda931496985a3eaf625b364307c92a232cc8782d3e0b8d6d5cd1e4",
  }),
  reviewButtonScript: Object.freeze({
    sourcePath: "DefineButton2_430/BUTTONCONDACTION on(release).as",
    bytes: 33,
    lineCount: 4,
    sha256:
      "72d24c2abe6e195108cb73512551b772f777f500c5ab74e1b04d2447aed8ed8b",
  }),
  correctOptionReleaseHandler: Object.freeze({
    count: 18,
    sha256:
      "65cc4f3523d257858c07f5b493408c85cb78783245d8e7b477892fcdb26258c0",
  }),
  wrongOptionReleaseHandler: Object.freeze({
    count: 54,
    sha256:
      "ed1078a5a92d62124378d2d6644b4eabdc88738314b5bfeb15607f26cd4b60fe",
  }),
  optionInstanceCount: 72,
  correctAnswerInstanceNames: G5_L4_FQ23_SOURCE_CORRECT_INSTANCE_NAMES,
  currentJavascriptExecutesLegacyActionScript: false,
  exactAvm1RandomOrderEstablished: false,
  sourceReviewVisualParityEstablished: false,
  reportingNetworkEnabled: false,
  audioEnabled: false,
  spanishEnabled: false,
  authoritativeOriginalRuntimeAccepted: false,
  humanVisualReviewAccepted: false,
  ownerAccepted: false,
  strictMigrationComplete: false,
  published: false,
  strictAcceptanceEffect: "none",
});

export const G5_L4_FQ23_SOURCE_SCRIPT_EVIDENCE = Object.freeze({
  "course-g05-l04-fq-002": Object.freeze({
    ...COMMON_SCRIPT_EVIDENCE,
    ffdecScriptBundle: Object.freeze({
      path:
        "migrations/course-g05-l04-fq-002/audit/machine/ffdec-scripts.txt.gz",
      sha256:
        "a4ca2b87942667325f5b3376f11a1a1ab433f00b9956a73e4186f201aa442e84",
    }),
    scriptInventory: Object.freeze({
      path: "migrations/course-g05-l04-fq-002/audit/script-inventory.json",
      sha256:
        "cc22fa6afc5d08f64f24a0ec322176aecff9eafac635cf8c8e04969ce1d8bb48",
    }),
    swfmillStructure: Object.freeze({
      path:
        "migrations/course-g05-l04-fq-002/audit/machine/swfmill.xml.gz",
      sha256:
        "1f5583ae0df757044affafc1f9e2d88e9d08ec30d447317ad2418dda5a807f5b",
    }),
    selectionAndAnswerScript: Object.freeze({
      sourcePath: "DefineSprite_694/frame_1/DoAction.as",
      bytes: 8_678,
      lineCount: 246,
      sha256:
        "22bc3140515d9da4efe7d08c8353b36e449747c87947556a82f1fc119ea9bd3f",
    }),
    sourceSelectionExpression: "random(_global.quizLabelArray.length)",
    sourceSelectionDisposition:
      "ten-of-eighteen-random-without-replacement",
  }),
  "course-g05-l04-fq-003": Object.freeze({
    ...COMMON_SCRIPT_EVIDENCE,
    ffdecScriptBundle: Object.freeze({
      path:
        "migrations/course-g05-l04-fq-003/audit/machine/ffdec-scripts.txt.gz",
      sha256:
        "2a71710468aed9bd2923dc14f8e21f8f1977084fedbe288224d8d8e322a12763",
    }),
    scriptInventory: Object.freeze({
      path: "migrations/course-g05-l04-fq-003/audit/script-inventory.json",
      sha256:
        "291e58a6704e14a3fe63713433fed1f1814931303aa65a72dec8682b684b8c0b",
    }),
    swfmillStructure: Object.freeze({
      path:
        "migrations/course-g05-l04-fq-003/audit/machine/swfmill.xml.gz",
      sha256:
        "a3c0e872397a4705f370755ea29b7171c1b964e92b3edd7c42c653973f6ad8ee",
    }),
    selectionAndAnswerScript: Object.freeze({
      sourcePath: "DefineSprite_694/frame_1/DoAction.as",
      bytes: 7_552,
      lineCount: 225,
      sha256:
        "e8d3a112f9825c355e5744c85a7d478c7acea3f6d9585d0834cfb45ec1e80550",
    }),
    sourceSelectionExpression:
      "_global.quizLabelArray[_global.totQuizCount - 1]",
    sourceSelectionDisposition: "eighteen-of-eighteen-sequential",
  }),
});

const UINT32_RANGE = 4_294_967_296;
const MULBERRY32_INCREMENT = 0x6d2b79f5;

export const normalizeG5L4Fq23Seed = (seed: number): number =>
  Number.isSafeInteger(seed) ? seed >>> 0 : 0;

const nextCurrentJavascriptRandom = (
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

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function validateConfig(config: G5L4Fq23QuestionSequenceConfig) {
  const fq002 = config.animationId === "course-g05-l04-fq-002";
  invariant(
    fq002 || config.animationId === "course-g05-l04-fq-003",
    "FQ23 question-sequence animationId is not allowlisted",
  );
  invariant(
    config.sourceSelection.sourceQuestionCount === 18 &&
      (fq002
        ? config.sourceSelection.kind === "random-without-replacement" &&
          config.sourceSelection.sourcePresentedQuestionCount === 10 &&
          config.sourceSelection.sourceExpression ===
            "random(_global.quizLabelArray.length)"
        : config.sourceSelection.kind === "sequential" &&
          config.sourceSelection.sourcePresentedQuestionCount === 18 &&
          config.sourceSelection.sourceExpression ===
            "_global.quizLabelArray[_global.totQuizCount - 1]"),
    `${config.animationId}: source question-selection contract changed`,
  );
}

const allQuestionNumbers = () =>
  Array.from({length: G5_L4_FQ23_CORRECT_OPTIONS.length}, (_, index) => index + 1);

export function buildG5L4Fq23QuestionOrder(
  config: G5L4Fq23QuestionSequenceConfig,
  seed = 0,
) {
  validateConfig(config);
  const normalizedSeed = normalizeG5L4Fq23Seed(seed);
  if (config.sourceSelection.kind === "sequential") {
    return Object.freeze({
      seed: normalizedSeed,
      rngState: normalizedSeed,
      questionOrder: Object.freeze(allQuestionNumbers()),
    });
  }

  const pool = allQuestionNumbers();
  const questionOrder: number[] = [];
  let rngState = normalizedSeed;
  while (
    questionOrder.length <
      config.sourceSelection.sourcePresentedQuestionCount
  ) {
    const random = nextCurrentJavascriptRandom(rngState);
    rngState = random.rngState;
    const poolIndex = Math.floor(random.value * pool.length);
    const [questionNumber] = pool.splice(poolIndex, 1);
    invariant(
      questionNumber !== undefined,
      `${config.animationId}: deterministic question pool underflowed`,
    );
    questionOrder.push(questionNumber);
  }
  return Object.freeze({
    seed: normalizedSeed,
    rngState,
    questionOrder: Object.freeze(questionOrder),
  });
}

const freezeResponse = (
  response: G5L4Fq23QuestionResponse,
): G5L4Fq23QuestionResponse => Object.freeze({...response});

const freezeState = (
  state: Omit<G5L4Fq23QuestionSequenceState, "questionOrder" | "responses"> & {
    readonly questionOrder: readonly number[];
    readonly responses: readonly G5L4Fq23QuestionResponse[];
  },
): G5L4Fq23QuestionSequenceState => Object.freeze({
  ...state,
  questionOrder: Object.freeze([...state.questionOrder]),
  responses: Object.freeze(state.responses.map(freezeResponse)),
});

export const gradeG5L4Fq23Score = (correctCount: number): G5L4Fq23Grade => {
  if (correctCount <= 3) return "Unsatisfactory";
  if (correctCount <= 6) return "Partially Proficient";
  if (correctCount <= 8) return "Proficient";
  return "Advanced";
};

export const createG5L4Fq23QuestionSequenceState = (
  config: G5L4Fq23QuestionSequenceConfig,
  seed = 0,
): G5L4Fq23QuestionSequenceState => {
  const order = buildG5L4Fq23QuestionOrder(config, seed);
  return freezeState({
    animationId: config.animationId,
    seed: order.seed,
    rngState: order.rngState,
    selectionKind: config.sourceSelection.kind,
    sourceQuestionCount: 18,
    sourcePresentedQuestionCount:
      config.sourceSelection.sourcePresentedQuestionCount,
    questionOrder: order.questionOrder,
    mode: "question",
    questionPosition: 0,
    reviewPosition: 0,
    selectedOption: null,
    responses: [],
    correctCount: 0,
    wrongCount: 0,
    grade: null,
    completed: false,
    legacyActionScriptExecuted: false,
    exactAvm1RandomOrderEstablished: false,
    sourceReviewVisualParityEstablished: false,
    networkReportingEnabled: false,
    audioEnabled: false,
    spanishEnabled: false,
  });
};

export const getG5L4Fq23ActiveQuestionNumber = (
  state: G5L4Fq23QuestionSequenceState,
): number | null => {
  if (state.mode === "results") return null;
  if (state.mode === "review") {
    return state.responses[state.reviewPosition]?.questionNumber ?? null;
  }
  return state.questionOrder[state.questionPosition] ?? null;
};

export const getG5L4Fq23ActiveReviewResponse = (
  state: G5L4Fq23QuestionSequenceState,
): G5L4Fq23QuestionResponse | null =>
  state.mode === "review"
    ? state.responses[state.reviewPosition] ?? null
    : null;

function optionNumber(option: G5L4Fq23AnswerOption) {
  return G5_L4_FQ23_ANSWER_OPTIONS.indexOf(option) + 1;
}

export const reduceG5L4Fq23QuestionSequence = (
  config: G5L4Fq23QuestionSequenceConfig,
  state: G5L4Fq23QuestionSequenceState,
  action: G5L4Fq23QuestionSequenceAction,
): G5L4Fq23QuestionSequenceState => {
  validateConfig(config);
  if (state.animationId !== config.animationId) return state;

  switch (action.type) {
    case "select-answer":
      if (state.mode !== "question") return state;
      return freezeState({...state, selectedOption: action.option});

    case "submit-answer": {
      if (state.mode !== "question" || state.selectedOption === null) {
        return state;
      }
      const questionNumber = state.questionOrder[state.questionPosition];
      const correctOption = questionNumber === undefined
        ? undefined
        : G5_L4_FQ23_CORRECT_OPTIONS[questionNumber - 1];
      invariant(
        questionNumber !== undefined && correctOption !== undefined,
        `${config.animationId}: active question is outside the source inventory`,
      );
      const correct = state.selectedOption === correctOption;
      const response = freezeResponse({
        sequencePosition: state.questionPosition + 1,
        questionNumber,
        questionLabel: `Q${questionNumber}`,
        selectedOption: state.selectedOption,
        correctOption,
        responseInstanceName:
          `A${questionNumber}Opt${optionNumber(state.selectedOption)}`,
        correctInstanceName:
          `A${questionNumber}Opt${optionNumber(correctOption)}`,
        correct,
      });
      const responses = [...state.responses, response];
      const correctCount = state.correctCount + (correct ? 1 : 0);
      const wrongCount = state.wrongCount + (correct ? 0 : 1);
      const completed = responses.length === state.questionOrder.length;
      return freezeState({
        ...state,
        mode: completed ? "results" : "question",
        questionPosition: completed
          ? state.questionPosition
          : state.questionPosition + 1,
        reviewPosition: 0,
        selectedOption: null,
        responses,
        correctCount,
        wrongCount,
        grade: completed ? gradeG5L4Fq23Score(correctCount) : null,
        completed,
      });
    }

    case "begin-review":
      if (!state.completed || state.responses.length === 0) return state;
      return freezeState({...state, mode: "review", reviewPosition: 0});

    case "review-previous":
      if (state.mode !== "review" || state.reviewPosition === 0) return state;
      return freezeState({...state, reviewPosition: state.reviewPosition - 1});

    case "review-next":
      if (
        state.mode !== "review" ||
        state.reviewPosition >= state.responses.length - 1
      ) return state;
      return freezeState({...state, reviewPosition: state.reviewPosition + 1});

    case "show-results":
      if (!state.completed) return state;
      return freezeState({...state, mode: "results"});

    case "reset":
    case "replay":
      return createG5L4Fq23QuestionSequenceState(
        config,
        action.seed ?? state.seed,
      );
  }
};
