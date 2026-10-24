export type CourseG04L03Ts007ChoiceId = "A" | "B" | "C" | "D";

export type CourseG04L03Ts007Phase =
  | "walkthrough"
  | "quiz"
  | "feedback"
  | "need-more-help"
  | "terminal";

export type CourseG04L03Ts007FeedbackKind = "wrong" | "right";

export type CourseG04L03Ts007FocusTarget =
  | "walkthrough-continue"
  | "choice-A"
  | "choice-B"
  | "choice-C"
  | "choice-D"
  | "need-more-help"
  | "need-more-help-close"
  | "feedback-status"
  | "terminal";

export interface CourseG04L03Ts007Choice {
  readonly id: CourseG04L03Ts007ChoiceId;
  readonly sourceInstance: "AnsBtn1" | "AnsBtn2" | "AnsBtn3" | "AnsBtn4";
  readonly sourceButtonObjectId: 133 | 134 | 135 | 136;
  readonly symbol: string;
  readonly numberLineLocation: -4 | -2 | 2 | 4;
  readonly correct: boolean;
  readonly hitBounds: Readonly<{
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
}

export interface CourseG04L03Ts007FeedbackWindow {
  readonly kind: CourseG04L03Ts007FeedbackKind;
  readonly branch: number;
  readonly sourceSpriteId: string;
  readonly sourceHeading: string;
  readonly sourceTextIds: readonly number[];
  readonly sourceStartFrame: 2;
  readonly sourceEndFrame: number;
  readonly fps: 12;
  readonly projectedDurationMs: number;
}

export interface CourseG04L03Ts007Feedback {
  readonly kind: CourseG04L03Ts007FeedbackKind;
  readonly branch: number;
  readonly choiceId: CourseG04L03Ts007ChoiceId;
  readonly sourceWindow: CourseG04L03Ts007FeedbackWindow;
}

export interface CourseG04L03Ts007InteractionState {
  readonly seed: number;
  readonly phase: CourseG04L03Ts007Phase;
  readonly walkthroughGate: 0 | 1 | 2 | 3 | null;
  readonly frame: 235 | 373 | 500 | 617 | 679 | 696;
  readonly wrongTryCount: 0 | 1;
  readonly selectedChoiceId: CourseG04L03Ts007ChoiceId | null;
  readonly feedback: CourseG04L03Ts007Feedback | null;
  readonly focusTarget: CourseG04L03Ts007FocusTarget;
  readonly needMoreHelpReturnFocus: CourseG04L03Ts007FocusTarget | null;
}

export type CourseG04L03Ts007InteractionAction =
  | Readonly<{type: "continue-walkthrough"}>
  | Readonly<{type: "choose"; choiceId: CourseG04L03Ts007ChoiceId}>
  | Readonly<{type: "feedback-complete"}>
  | Readonly<{type: "open-need-more-help"}>
  | Readonly<{type: "close-need-more-help"}>
  | Readonly<{type: "open-glossary"; term: "Symbol" | "Number line"}>
  | Readonly<{type: "replay"; seed?: number}>;

const freezeChoice = (
  choice: CourseG04L03Ts007Choice,
): CourseG04L03Ts007Choice =>
  Object.freeze({
    ...choice,
    hitBounds: Object.freeze({...choice.hitBounds}),
  });

export const COURSE_G04_L03_TS_007_WALKTHROUGH_FRAMES = Object.freeze([
  235,
  373,
  500,
  617,
] as const);

export const COURSE_G04_L03_TS_007_QUESTION = Object.freeze({
  prompt: "Which symbol is located at \u22122 on the number line?",
  correctChoiceId: "B" as const,
  quizFrame: 679 as const,
  terminalFrame: 696 as const,
  textEvidenceNote:
    "The visible minus is a separately drawn source vector; the prompt is normalized for accessibility.",
});

export const COURSE_G04_L03_TS_007_WALKTHROUGH_COPY = Object.freeze([
  Object.freeze({
    sourceFrame: 235,
    sourceTextIds: Object.freeze([14]),
    paragraphs: Object.freeze([COURSE_G04_L03_TS_007_QUESTION.prompt]),
  }),
  Object.freeze({
    sourceFrame: 373,
    sourceTextIds: Object.freeze([50]),
    paragraphs: Object.freeze(["Where is −2?"]),
  }),
  Object.freeze({
    sourceFrame: 500,
    sourceTextIds: Object.freeze([92, 91]),
    paragraphs: Object.freeze([
      "Information given: number line with symbols.",
      "Information needed: where is −2?",
    ]),
  }),
  Object.freeze({
    sourceFrame: 617,
    sourceTextIds: Object.freeze([94, 95, 96]),
    paragraphs: Object.freeze([
      "Use strategy: Draw a picture.",
      "Label the number line to see where −2 is.",
      "The correct answer choice is B.",
    ]),
  }),
]);

export const COURSE_G04_L03_TS_007_QUIZ_STRATEGY = Object.freeze({
  sourceFrame: COURSE_G04_L03_TS_007_QUESTION.quizFrame,
  sourceTextIds: Object.freeze([117, 118]),
  lines: Object.freeze([
    "Use strategy: Guess and Check",
    "Where is each symbol located?",
  ]),
});

export const COURSE_G04_L03_TS_007_HELP = Object.freeze({
  sourceSpriteId: "sprite-183",
  sourceDescriptionTextId: 141,
  sourceExampleTextId: 140,
  sourceNegativeTitleTextId: 146,
  sourcePositiveTitleTextId: 147,
  sourceAxisMinusShapeId: 174,
  description: "A number line is a line for ordering numbers by their value.",
  example: "Example: −5 is 5 units to the left of 0 on the number line.",
  negativeTitle: "Negative Numbers",
  positiveTitle: "Positive Numbers",
});

export const COURSE_G04_L03_TS_007_HELP_AXIS = Object.freeze(
  Array.from({length: 21}, (_, index) => {
    const value = index - 10;
    return Object.freeze({
      value,
      sourceTextId: value < 0 ? 163 - value : 153 + value,
    });
  }),
);

export const COURSE_G04_L03_TS_007_CHOICES:
  readonly CourseG04L03Ts007Choice[] = Object.freeze([
    freezeChoice({
      id: "A",
      sourceInstance: "AnsBtn1",
      sourceButtonObjectId: 136,
      symbol: "green circle",
      numberLineLocation: -4,
      correct: false,
      hitBounds: {x: 550.759, y: 208.914, width: 98.642, height: 43.772},
    }),
    freezeChoice({
      id: "B",
      sourceInstance: "AnsBtn2",
      sourceButtonObjectId: 135,
      symbol: "orange-red heart",
      numberLineLocation: -2,
      correct: true,
      hitBounds: {x: 549.569, y: 281.818, width: 106.892, height: 51.564},
    }),
    freezeChoice({
      id: "C",
      sourceInstance: "AnsBtn3",
      sourceButtonObjectId: 133,
      symbol: "pink square",
      numberLineLocation: 2,
      correct: false,
      hitBounds: {x: 550.342, y: 364.948, width: 98.069, height: 41.603},
    }),
    freezeChoice({
      id: "D",
      sourceInstance: "AnsBtn4",
      sourceButtonObjectId: 134,
      symbol: "cyan triangle",
      numberLineLocation: 4,
      correct: false,
      hitBounds: {x: 549.735, y: 437.6, width: 96.483, height: 47.1},
    }),
  ]);

const feedbackWindow = (
  kind: CourseG04L03Ts007FeedbackKind,
  branch: number,
  sourceSpriteId: string,
  sourceEndFrame: number,
  sourceHeading: string,
  sourceTextIds: readonly number[],
): CourseG04L03Ts007FeedbackWindow =>
  Object.freeze({
    kind,
    branch,
    sourceSpriteId,
    sourceHeading,
    sourceTextIds: Object.freeze([...sourceTextIds]),
    sourceStartFrame: 2,
    sourceEndFrame,
    fps: 12,
    projectedDurationMs: ((sourceEndFrame - 1) / 12) * 1_000,
  });

export const COURSE_G04_L03_TS_007_WRONG_FEEDBACK_WINDOWS = Object.freeze([
  feedbackWindow("wrong", 1, "sprite-225", 31, "OH! NO", [220, 221]),
  feedbackWindow("wrong", 2, "sprite-211", 27, "OH! NO", [197, 198]),
  feedbackWindow("wrong", 3, "sprite-193", 28, "incorrect!", [187, 188, 190]),
]);

export const COURSE_G04_L03_TS_007_RIGHT_FEEDBACK_WINDOWS = Object.freeze([
  feedbackWindow("right", 1, "sprite-284", 26, "Great Job!", [280, 281, 283]),
  feedbackWindow("right", 2, "sprite-324", 27, "Good Job!", [319, 320]),
  feedbackWindow("right", 3, "sprite-382", 25, "Excellent!", [379, 380]),
  feedbackWindow("right", 4, "sprite-350", 31, "YOU GOT IT!", [339, 340]),
]);

export const COURSE_G04_L03_TS_007_GLOSSARY = Object.freeze([
  Object.freeze({
    term: "Symbol" as const,
    sourceButtonObjectId: 20,
    mode: "safe-disabled-unresolved-host-callback" as const,
  }),
  Object.freeze({
    term: "Number line" as const,
    sourceButtonObjectId: 21,
    mode: "safe-disabled-unresolved-host-callback" as const,
  }),
]);

export const COURSE_G04_L03_TS_007_PLAYBACK_POLICY = Object.freeze({
  timingAuthority: "source-window-projection-only",
  pause: Object.freeze({
    policy: "renderer-must-freeze-parent-and-feedback-remaining-time",
    sourceParityEstablished: false,
  }),
  reducedMotion: Object.freeze({
    policy: "show-static-feedback-before-explicit-completion",
    sourceParityEstablished: false,
  }),
});

export const COURSE_G04_L03_TS_007_INTERACTION_AUTHORITY = Object.freeze({
  sourceLocalContractHashChainCurrent: false,
  sourceHandlersExecuted: false,
  sourceRandomParityEstablished: false,
  sourceTimingParityEstablished: false,
  originalRuntimeNaturalTraceAccepted: false,
  authoritativeBaselineAccepted: false,
  fullFrameRmseAccepted: false,
  associatedAudioModeled: false,
  audioAccepted: false,
  spanishAccepted: false,
  needMoreHelpVisualAccepted: false,
  glossaryHostResolved: false,
  keyboardParityEstablished: false,
  behaviorParityEstablished: false,
  replayParityEstablished: false,
  humanVisualReviewAccepted: false,
  ownerAccepted: false,
  strictMigrationComplete: false,
  lessonPublished: false,
  strictAcceptanceEffect: "none",
});

const normalizeSeed = (seed: number): number =>
  Number.isSafeInteger(seed) ? seed >>> 0 : 0;

const focusForChoice = (
  choiceId: CourseG04L03Ts007ChoiceId,
): CourseG04L03Ts007FocusTarget => `choice-${choiceId}`;

const freezeState = (
  state: CourseG04L03Ts007InteractionState,
): CourseG04L03Ts007InteractionState =>
  Object.freeze({
    ...state,
    feedback: state.feedback
      ? Object.freeze({
          ...state.feedback,
          sourceWindow: state.feedback.sourceWindow,
        })
      : null,
  });

export const createCourseG04L03Ts007InteractionState = (
  seed = 0,
): CourseG04L03Ts007InteractionState =>
  freezeState({
    seed: normalizeSeed(seed),
    phase: "walkthrough",
    walkthroughGate: 0,
    frame: 235,
    wrongTryCount: 0,
    selectedChoiceId: null,
    feedback: null,
    focusTarget: "walkthrough-continue",
    needMoreHelpReturnFocus: null,
  });

const completeFeedback = (
  state: CourseG04L03Ts007InteractionState,
): CourseG04L03Ts007InteractionState => {
  const feedback = state.feedback;
  if (state.phase !== "feedback" || !feedback) return state;

  if (feedback.kind === "right" || state.wrongTryCount === 1) {
    return freezeState({
      ...state,
      phase: "terminal",
      walkthroughGate: null,
      frame: 696,
      selectedChoiceId: feedback.choiceId,
      feedback: null,
      focusTarget: "terminal",
      needMoreHelpReturnFocus: null,
    });
  }

  return freezeState({
    ...state,
    phase: "quiz",
    walkthroughGate: null,
    frame: 679,
    wrongTryCount: 1,
    selectedChoiceId: null,
    feedback: null,
    focusTarget: focusForChoice(feedback.choiceId),
    needMoreHelpReturnFocus: null,
  });
};

export const reduceCourseG04L03Ts007Interaction = (
  state: CourseG04L03Ts007InteractionState,
  action: CourseG04L03Ts007InteractionAction,
): CourseG04L03Ts007InteractionState => {
  switch (action.type) {
    case "continue-walkthrough": {
      if (state.phase !== "walkthrough" || state.walkthroughGate === null) {
        return state;
      }

      const nextGate = state.walkthroughGate + 1;
      const nextFrame = COURSE_G04_L03_TS_007_WALKTHROUGH_FRAMES[nextGate];
      if (nextFrame !== undefined && nextGate <= 3) {
        return freezeState({
          ...state,
          walkthroughGate: nextGate as 1 | 2 | 3,
          frame: nextFrame,
        });
      }

      return freezeState({
        ...state,
        phase: "quiz",
        walkthroughGate: null,
        frame: 679,
        focusTarget: "choice-A",
      });
    }

    case "choose": {
      if (state.phase !== "quiz") return state;
      const choice = COURSE_G04_L03_TS_007_CHOICES.find(
        ({id}) => id === action.choiceId,
      );
      if (!choice) return state;

      const windows = choice.correct
        ? COURSE_G04_L03_TS_007_RIGHT_FEEDBACK_WINDOWS
        : COURSE_G04_L03_TS_007_WRONG_FEEDBACK_WINDOWS;
      const branch = (state.seed % windows.length) + 1;
      const sourceWindow = windows[branch - 1];
      if (!sourceWindow) return state;

      return freezeState({
        ...state,
        phase: "feedback",
        selectedChoiceId: choice.id,
        feedback: {
          kind: choice.correct ? "right" : "wrong",
          branch,
          choiceId: choice.id,
          sourceWindow,
        },
        focusTarget: "feedback-status",
        needMoreHelpReturnFocus: null,
      });
    }

    case "feedback-complete":
      return completeFeedback(state);

    case "open-need-more-help":
      if (state.phase !== "quiz") return state;
      return freezeState({
        ...state,
        phase: "need-more-help",
        focusTarget: "need-more-help-close",
        needMoreHelpReturnFocus: "need-more-help",
      });

    case "close-need-more-help":
      if (state.phase !== "need-more-help") return state;
      return freezeState({
        ...state,
        phase: "quiz",
        focusTarget: state.needMoreHelpReturnFocus ?? "need-more-help",
        needMoreHelpReturnFocus: null,
      });

    case "open-glossary":
      return state;

    case "replay":
      return createCourseG04L03Ts007InteractionState(
        action.seed ?? state.seed,
      );

    default:
      return state;
  }
};
