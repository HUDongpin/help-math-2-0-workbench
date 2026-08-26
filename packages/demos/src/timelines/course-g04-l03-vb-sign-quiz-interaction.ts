export type CourseG04L03VbSignQuizChoiceId = "left" | "middle" | "right";

export type CourseG04L03VbSignQuizMode =
  | "ready"
  | "wrong-feedback"
  | "completed";

export interface CourseG04L03VbSignQuizChoice {
  readonly id: CourseG04L03VbSignQuizChoiceId;
  readonly sourceInstance: "AnsBtn1" | "AnsBtn2" | "AnsBtn3";
  readonly label: string;
  readonly numericValue: number;
  readonly correct: boolean;
  readonly sourceBounds: Readonly<{
    centerX: number;
    centerY: number;
    height: number;
    width: number;
  }>;
}

export interface CourseG04L03VbSignQuizConfig {
  readonly animationId:
    | "course-g04-l03-vb-007"
    | "course-g04-l03-vb-008";
  readonly sourceSwfSha256: string;
  readonly sourceFlaSha256: string;
  readonly frameDomain: "sprite-271" | "sprite-195";
  readonly activityFrame: 31 | 29;
  readonly instruction: string;
  readonly choices: readonly CourseG04L03VbSignQuizChoice[];
  readonly wrongExplanation: string;
  readonly wrongHeadings: readonly string[];
  readonly correctHeadings: readonly string[];
  readonly postCorrectStartFrame: 32 | 30;
  readonly postCorrectEndFrame: 69 | 62;
}

export interface CourseG04L03VbSignQuizState {
  readonly animationId: CourseG04L03VbSignQuizConfig["animationId"];
  readonly seed: number;
  readonly rngState: number;
  readonly drawCount: number;
  readonly mode: CourseG04L03VbSignQuizMode;
  readonly choice: CourseG04L03VbSignQuizChoice | null;
  readonly attempts: number;
  readonly feedbackVariantIndex: number | null;
  readonly feedbackHeading: string | null;
  readonly feedbackText: string | null;
}

export type CourseG04L03VbSignQuizAction =
  | Readonly<{
      type: "choose";
      choiceId: CourseG04L03VbSignQuizChoiceId;
    }>
  | Readonly<{type: "close-wrong"}>
  | Readonly<{type: "reset"; seed?: number}>
  | Readonly<{type: "replay"; seed?: number}>;

const freezeChoice = (
  choice: CourseG04L03VbSignQuizChoice,
): CourseG04L03VbSignQuizChoice =>
  Object.freeze({
    ...choice,
    sourceBounds: Object.freeze({...choice.sourceBounds}),
  });

const freezeConfig = (
  config: CourseG04L03VbSignQuizConfig,
): CourseG04L03VbSignQuizConfig =>
  Object.freeze({
    ...config,
    choices: Object.freeze(config.choices.map(freezeChoice)),
    wrongHeadings: Object.freeze([...config.wrongHeadings]),
    correctHeadings: Object.freeze([...config.correctHeadings]),
  });

const SHARED_CHOICE_GEOMETRY = Object.freeze({
  left: Object.freeze({
    centerX: 315.65,
    centerY: 296.95,
    height: 61.3,
    width: 38.1,
  }),
  middle: Object.freeze({
    centerX: 412.3,
    centerY: 297.45,
    height: 61.4,
    width: 38.7,
  }),
  right: Object.freeze({
    centerX: 509.75,
    centerY: 297.2,
    height: 61.6,
    width: 38.2,
  }),
});

export const COURSE_G04_L03_VB_007_SIGN_QUIZ = freezeConfig({
  animationId: "course-g04-l03-vb-007",
  sourceSwfSha256:
    "e3e6c45a56f343b3a8baf8a65dd34b615327029f808eec0c5f9cfee2dd2c1450",
  sourceFlaSha256:
    "b4eb0a360733817b164356149bae97b11b21d9554a2a0a365a01a9ec69c4147c",
  frameDomain: "sprite-271",
  activityFrame: 31,
  instruction: "Click the positive number.",
  choices: [
    {
      id: "left",
      sourceInstance: "AnsBtn1",
      label: "0",
      numericValue: 0,
      correct: false,
      sourceBounds: SHARED_CHOICE_GEOMETRY.left,
    },
    {
      id: "middle",
      sourceInstance: "AnsBtn2",
      label: "7",
      numericValue: 7,
      correct: true,
      sourceBounds: SHARED_CHOICE_GEOMETRY.middle,
    },
    {
      id: "right",
      sourceInstance: "AnsBtn3",
      label: "-7",
      numericValue: -7,
      correct: false,
      sourceBounds: SHARED_CHOICE_GEOMETRY.right,
    },
  ],
  wrongExplanation: "Positive numbers are greater than\u00a0zero. Try again.",
  wrongHeadings: ["incorrect!", "That's incorrect!", "OH! NO"],
  correctHeadings: ["Great Job!", "Good Job!", "Excellent!", "YOU GOT IT!"],
  postCorrectStartFrame: 32,
  postCorrectEndFrame: 69,
});

export const COURSE_G04_L03_VB_008_SIGN_QUIZ = freezeConfig({
  animationId: "course-g04-l03-vb-008",
  sourceSwfSha256:
    "3c61fd04bbaf6b316438691fd59222623bbb1d11a36c731ae7ed9fb862245bcf",
  sourceFlaSha256:
    "25b7f4acc1128d4b8a06df89d52b9f372b4af00b77d2053fbccfaa24dba53922",
  frameDomain: "sprite-195",
  activityFrame: 29,
  instruction: "Click the negative number.",
  choices: [
    {
      id: "left",
      sourceInstance: "AnsBtn2",
      label: "9",
      numericValue: 9,
      correct: false,
      sourceBounds: SHARED_CHOICE_GEOMETRY.left,
    },
    {
      id: "middle",
      sourceInstance: "AnsBtn1",
      label: "-9",
      numericValue: -9,
      correct: true,
      sourceBounds: SHARED_CHOICE_GEOMETRY.middle,
    },
    {
      id: "right",
      sourceInstance: "AnsBtn3",
      label: "0",
      numericValue: 0,
      correct: false,
      sourceBounds: SHARED_CHOICE_GEOMETRY.right,
    },
  ],
  wrongExplanation: "Negative numbers are less than\u00a0zero. Try again.",
  wrongHeadings: ["That's incorrect!", "Incorrect!", "Try Again!"],
  correctHeadings: ["YOU GOT IT!", "Correct!", "Excellent!", "Great Job!"],
  postCorrectStartFrame: 30,
  postCorrectEndFrame: 62,
});

export const COURSE_G04_L03_VB_SIGN_QUIZ_INTERACTION_AUTHORITY = Object.freeze({
  evidenceBasis:
    "exact-fla-instance-bindings-and-hash-bound-swf-avm1-handlers",
  implementationKind: "current-javascript-pure-state-candidate",
  deterministicFeedbackVariantsExecuteAvm1Random: false,
  sourceChoiceHandlersExecuted: false,
  embeddedFeedbackAudioModeled: false,
  associatedAudioModeled: false,
  audioParityEstablished: false,
  glossaryCallbackModeled: false,
  feedbackVariantParityEstablished: false,
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

const freezeState = (
  state: CourseG04L03VbSignQuizState,
): CourseG04L03VbSignQuizState => Object.freeze({...state});

export const createCourseG04L03VbSignQuizState = (
  config: CourseG04L03VbSignQuizConfig,
  seed = 0,
): CourseG04L03VbSignQuizState => {
  const normalizedSeed = normalizeSeed(seed);
  return freezeState({
    animationId: config.animationId,
    seed: normalizedSeed,
    rngState: normalizedSeed,
    drawCount: 0,
    mode: "ready",
    choice: null,
    attempts: 0,
    feedbackVariantIndex: null,
    feedbackHeading: null,
    feedbackText: null,
  });
};

export const reduceCourseG04L03VbSignQuiz = (
  config: CourseG04L03VbSignQuizConfig,
  state: CourseG04L03VbSignQuizState,
  action: CourseG04L03VbSignQuizAction,
): CourseG04L03VbSignQuizState => {
  switch (action.type) {
    case "choose": {
      if (
        state.animationId !== config.animationId
        || state.mode !== "ready"
      ) return state;

      const choice = config.choices.find(({id}) => id === action.choiceId);
      if (!choice) return state;

      const headings = choice.correct
        ? config.correctHeadings
        : config.wrongHeadings;
      if (headings.length === 0) return state;

      const random = nextCurrentJsRandom(state.rngState);
      const feedbackVariantIndex = Math.floor(random.value * headings.length);
      const feedbackHeading = headings[feedbackVariantIndex];
      if (feedbackHeading === undefined) return state;

      return freezeState({
        ...state,
        rngState: random.rngState,
        drawCount: state.drawCount + 1,
        mode: choice.correct ? "completed" : "wrong-feedback",
        choice,
        attempts: state.attempts + 1,
        feedbackVariantIndex,
        feedbackHeading,
        feedbackText: choice.correct ? null : config.wrongExplanation,
      });
    }

    case "close-wrong":
      if (
        state.animationId !== config.animationId
        || state.mode !== "wrong-feedback"
      ) return state;
      return freezeState({
        ...state,
        mode: "ready",
        choice: null,
        feedbackVariantIndex: null,
        feedbackHeading: null,
        feedbackText: null,
      });

    case "reset":
    case "replay":
      return createCourseG04L03VbSignQuizState(
        config,
        action.seed ?? state.seed,
      );
  }
};
