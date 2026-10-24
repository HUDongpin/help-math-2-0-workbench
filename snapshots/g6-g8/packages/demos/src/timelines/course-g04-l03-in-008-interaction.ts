import {COURSE_G04_L03_IN_008_SOURCE} from "./course-g04-l03-in-008";

export type CourseG04L03In008InteractionOutcome =
  | "ready"
  | "correct"
  | "wrong";

export type CourseG04L03In008AnswerField = "first" | "second";

export interface CourseG04L03In008Question {
  readonly index: number;
  readonly label: string;
  readonly answers: string;
  readonly decrement: number;
  readonly firstAnswer: string;
  readonly secondAnswer: string;
  readonly feedback: string;
}

export interface CourseG04L03In008InteractionState {
  readonly seed: number;
  readonly rngState: number;
  readonly drawCount: number;
  readonly poolCycle: number;
  readonly remainingQuestionIndices: readonly number[];
  readonly currentQuestionIndex: number;
  readonly currentQuestion: CourseG04L03In008Question;
  readonly answerFirst: string;
  readonly answerSecond: string;
  readonly outcome: CourseG04L03In008InteractionOutcome;
  readonly inputsLocked: boolean;
  readonly checkEnabled: boolean;
  readonly newProblemEnabled: boolean;
  readonly feedbackVisible: boolean;
  readonly feedbackText: string | null;
}

export type CourseG04L03In008InteractionAction =
  | Readonly<{
      type: "set-input";
      field: CourseG04L03In008AnswerField;
      value: string;
    }>
  | Readonly<{type: "check"}>
  | Readonly<{type: "close-feedback"}>
  | Readonly<{type: "new-problem"}>
  | Readonly<{type: "reset"}>
  | Readonly<{type: "replay"}>;

const SOURCE_FEEDBACK = Object.freeze([
  "Each number decreases by 5. Try again!",
  "Each number decreases by 9. Try again!",
  "Each number decreases by 2. Try again!",
  "Each number decreases by 10. Try again!",
  "Each number decreases by 4. Try again!",
] as const);

export const COURSE_G04_L03_IN_008_QUESTIONS: readonly CourseG04L03In008Question[] =
  Object.freeze(
    COURSE_G04_L03_IN_008_SOURCE.quizSourceData.map((sourceQuestion, index) => {
      const separatorIndex = sourceQuestion.answers.indexOf("~");
      const feedback = SOURCE_FEEDBACK[index];

      if (separatorIndex < 0 || feedback === undefined) {
        throw new Error("IN008 source question inventory is internally inconsistent");
      }

      const firstAnswer = sourceQuestion.answers.slice(0, separatorIndex);
      const secondAnswer = sourceQuestion.answers.slice(separatorIndex + 1);

      return Object.freeze({
        index,
        label: sourceQuestion.label,
        answers: sourceQuestion.answers,
        decrement: sourceQuestion.decrement,
        firstAnswer,
        secondAnswer,
        feedback,
      });
    }),
  );

export const COURSE_G04_L03_IN_008_INTERACTION_AUTHORITY = Object.freeze({
  evidenceBasis: "exact-avm1-source-script",
  implementationKind: "current-javascript-pure-state-candidate",
  deterministicQuestionOrderExecutesAvm1Random: false,
  feedbackAudioModeled: false,
  feedbackAudioParityEstablished: false,
  behaviorParityEstablished: false,
  replayParityEstablished: false,
  ownerAccepted: false,
  strictMigrationComplete: false,
  strictAcceptanceEffect: "none",
});

const UINT32_RANGE = 4_294_967_296;
const MULBERRY32_INCREMENT = 0x6d2b79f5;

const normalizeSeed = (seed: number): number =>
  Number.isSafeInteger(seed) ? seed >>> 0 : 0;

const allQuestionIndices = (): number[] =>
  COURSE_G04_L03_IN_008_QUESTIONS.map((question) => question.index);

const freezeState = (
  state: Omit<CourseG04L03In008InteractionState, "remainingQuestionIndices"> & {
    readonly remainingQuestionIndices: readonly number[];
  },
): CourseG04L03In008InteractionState =>
  Object.freeze({
    ...state,
    remainingQuestionIndices: Object.freeze([...state.remainingQuestionIndices]),
  });

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

const readyStateForQuestion = (
  sequence: Pick<
    CourseG04L03In008InteractionState,
    | "seed"
    | "rngState"
    | "drawCount"
    | "poolCycle"
    | "remainingQuestionIndices"
    | "currentQuestionIndex"
    | "currentQuestion"
  >,
): CourseG04L03In008InteractionState =>
  freezeState({
    ...sequence,
    answerFirst: "",
    answerSecond: "",
    outcome: "ready",
    inputsLocked: false,
    checkEnabled: true,
    newProblemEnabled: true,
    feedbackVisible: false,
    feedbackText: null,
  });

const drawNextQuestion = (
  state: CourseG04L03In008InteractionState,
): CourseG04L03In008InteractionState => {
  const refilled = state.remainingQuestionIndices.length === 0;
  const pool = refilled
    ? allQuestionIndices()
    : [...state.remainingQuestionIndices];
  const random = nextCurrentJsRandom(state.rngState);
  const selectedPoolIndex = Math.floor(random.value * pool.length);
  const [currentQuestionIndex] = pool.splice(selectedPoolIndex, 1);
  const currentQuestion = COURSE_G04_L03_IN_008_QUESTIONS[currentQuestionIndex];

  if (!currentQuestion) {
    throw new Error("IN008 current-JS question pool selected an invalid index");
  }

  return readyStateForQuestion({
    seed: state.seed,
    rngState: random.rngState,
    drawCount: state.drawCount + 1,
    poolCycle: state.poolCycle + (refilled ? 1 : 0),
    remainingQuestionIndices: pool,
    currentQuestionIndex,
    currentQuestion,
  });
};

export const createCourseG04L03In008InteractionState = (
  seed = 0,
): CourseG04L03In008InteractionState => {
  const normalizedSeed = normalizeSeed(seed);
  const initialQuestionIndex =
    normalizedSeed % COURSE_G04_L03_IN_008_QUESTIONS.length;
  const initialQuestion =
    COURSE_G04_L03_IN_008_QUESTIONS[initialQuestionIndex];

  if (!initialQuestion) {
    throw new Error("IN008 source question inventory must not be empty");
  }

  return readyStateForQuestion({
    seed: normalizedSeed,
    rngState: normalizedSeed,
    drawCount: 1,
    poolCycle: 1,
    remainingQuestionIndices: allQuestionIndices().filter(
      (questionIndex) => questionIndex !== initialQuestionIndex,
    ),
    currentQuestionIndex: initialQuestionIndex,
    currentQuestion: initialQuestion,
  });
};

export const reduceCourseG04L03In008Interaction = (
  state: CourseG04L03In008InteractionState,
  action: CourseG04L03In008InteractionAction,
): CourseG04L03In008InteractionState => {
  switch (action.type) {
    case "set-input":
      if (state.inputsLocked) return state;
      return freezeState({
        ...state,
        answerFirst:
          action.field === "first" ? action.value : state.answerFirst,
        answerSecond:
          action.field === "second" ? action.value : state.answerSecond,
      });

    case "check": {
      if (!state.checkEnabled) return state;
      const correct =
        state.answerFirst === state.currentQuestion.firstAnswer &&
        state.answerSecond === state.currentQuestion.secondAnswer;

      if (correct) {
        return freezeState({
          ...state,
          outcome: "correct",
          inputsLocked: true,
          checkEnabled: true,
          newProblemEnabled: true,
          feedbackVisible: false,
          feedbackText: null,
        });
      }

      return freezeState({
        ...state,
        outcome: "wrong",
        inputsLocked: true,
        checkEnabled: false,
        newProblemEnabled: false,
        feedbackVisible: true,
        feedbackText: state.currentQuestion.feedback,
      });
    }

    case "close-feedback":
      if (state.outcome !== "wrong") return state;
      return readyStateForQuestion({
        seed: state.seed,
        rngState: state.rngState,
        drawCount: state.drawCount,
        poolCycle: state.poolCycle,
        remainingQuestionIndices: state.remainingQuestionIndices,
        currentQuestionIndex: state.currentQuestionIndex,
        currentQuestion: state.currentQuestion,
      });

    case "new-problem":
      return state.newProblemEnabled ? drawNextQuestion(state) : state;

    case "reset":
    case "replay":
      return createCourseG04L03In008InteractionState(state.seed);
  }
};
