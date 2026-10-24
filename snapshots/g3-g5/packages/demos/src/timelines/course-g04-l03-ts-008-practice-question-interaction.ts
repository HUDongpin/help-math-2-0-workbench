export type CourseG04L03Ts008ChoiceId = "A" | "B" | "C" | "D";

export type CourseG04L03Ts008WalkthroughGate = 0 | 1 | 2 | 3;

export type CourseG04L03Ts008Frame =
  | 328
  | 465
  | 592
  | 712
  | 770
  | 789;

export type CourseG04L03Ts008DonorFrame = 328 | 465 | 769 | 789;

export type CourseG04L03Ts008Phase =
  | "walkthrough"
  | "quiz"
  | "feedback"
  | "need-more-help"
  | "terminal";

export type CourseG04L03Ts008FeedbackKind = "wrong" | "right";

export type CourseG04L03Ts008FocusTarget =
  | "walkthrough-step-1"
  | "walkthrough-step-2"
  | "walkthrough-step-3"
  | "walkthrough-step-4"
  | "walkthrough-box-3-close"
  | "walkthrough-box-4-close"
  | "choice-A"
  | "choice-B"
  | "choice-C"
  | "choice-D"
  | "need-more-help"
  | "need-more-help-close"
  | "feedback-status"
  | "terminal";

export interface CourseG04L03Ts008Bounds {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface CourseG04L03Ts008Choice {
  readonly id: CourseG04L03Ts008ChoiceId;
  readonly sourceInstance: "AnsBtn1" | "AnsBtn2" | "AnsBtn3" | "AnsBtn4";
  readonly sourceButtonObjectId: 156 | 157 | 158 | 159;
  readonly person: "Elvin" | "Ricky" | "Susan" | "Toni";
  readonly sourceStatement:
    | "Elvin has $3."
    | "Ricky owes $2."
    | "Susan owes $10."
    | "Toni has $7.";
  readonly signedValue: -10 | -2 | 3 | 7;
  readonly correct: boolean;
  readonly hitBounds: CourseG04L03Ts008Bounds;
}

export interface CourseG04L03Ts008WalkthroughStep {
  readonly id: 1 | 2 | 3 | 4;
  readonly sourceStopFrame: 328 | 465 | 592 | 712;
  readonly nextFrame: 465 | 592 | 712 | 770;
  readonly functionalDonorFrame: 328 | 465;
  readonly sourceOverlayButtonObjectId: 50;
  readonly sourceUnderlayObjectId: 48;
  readonly sourceOverlayDepth: 73 | 78;
  readonly sourceUnderlayDepth: 71 | 72;
  readonly revealThenClose: boolean;
  readonly sourceRevealSpriteId: "sprite-142" | "sprite-153" | null;
  readonly sourceCloseButtonObjectId: 141 | null;
  readonly hitBounds: CourseG04L03Ts008Bounds;
  readonly visibleText: readonly string[];
}

export interface CourseG04L03Ts008FeedbackWindow {
  readonly kind: CourseG04L03Ts008FeedbackKind;
  readonly branch: number;
  readonly copy:
    | "That's incorrect!"
    | "Incorrect!"
    | "Try Again!"
    | "YOU GOT IT!"
    | "Correct!"
    | "Great Job!";
  readonly sourceInstance:
    | "Mc_Wrong_Feed1"
    | "Mc_Wrong_Feed2"
    | "Mc_Wrong_Feed3"
    | "Mc_Right_Feed1"
    | "Mc_Right_Feed2"
    | "Mc_Right_Feed3"
    | "Mc_Right_Feed4";
  readonly sourceSpriteId:
    | "sprite-197"
    | "sprite-208"
    | "sprite-232"
    | "sprite-284"
    | "sprite-300"
    | "sprite-312"
    | "sprite-324";
  readonly sourceStartFrame: 2;
  readonly sourceEndFrame: 25 | 27 | 28 | 31;
  readonly fps: 12;
  readonly projectedDurationMs: number;
}

export interface CourseG04L03Ts008Feedback {
  readonly kind: CourseG04L03Ts008FeedbackKind;
  readonly branch: number;
  readonly copy: CourseG04L03Ts008FeedbackWindow["copy"];
  readonly choiceId: CourseG04L03Ts008ChoiceId;
  readonly sourceWindow: CourseG04L03Ts008FeedbackWindow;
}

export interface CourseG04L03Ts008InteractionState {
  readonly seed: number;
  readonly phase: CourseG04L03Ts008Phase;
  readonly walkthroughGate: CourseG04L03Ts008WalkthroughGate | null;
  readonly walkthroughBoxRevealed: boolean;
  readonly frame: CourseG04L03Ts008Frame;
  readonly wrongTryCount: 0 | 1;
  readonly selectedChoiceId: CourseG04L03Ts008ChoiceId | null;
  readonly feedback: CourseG04L03Ts008Feedback | null;
  readonly focusTarget: CourseG04L03Ts008FocusTarget;
  readonly needMoreHelpReturnPhase: "walkthrough" | "quiz" | null;
  readonly needMoreHelpReturnFocus: CourseG04L03Ts008FocusTarget | null;
}

export type CourseG04L03Ts008InteractionAction =
  | Readonly<{type: "continue-walkthrough"}>
  | Readonly<{type: "reveal-walkthrough-box"}>
  | Readonly<{type: "close-walkthrough-box"}>
  | Readonly<{type: "choose"; choiceId: CourseG04L03Ts008ChoiceId}>
  | Readonly<{type: "feedback-complete"}>
  | Readonly<{type: "open-need-more-help"}>
  | Readonly<{type: "close-need-more-help"}>
  | Readonly<{
      type: "open-glossary";
      term: "Positive number" | "Owe" | "Negative number";
    }>
  | Readonly<{type: "replay"; seed?: number}>;

const freezeBounds = (
  bounds: CourseG04L03Ts008Bounds,
): CourseG04L03Ts008Bounds => Object.freeze({...bounds});

const freezeChoice = (
  choice: CourseG04L03Ts008Choice,
): CourseG04L03Ts008Choice =>
  Object.freeze({
    ...choice,
    hitBounds: freezeBounds(choice.hitBounds),
  });

const freezeStep = (
  step: CourseG04L03Ts008WalkthroughStep,
): CourseG04L03Ts008WalkthroughStep =>
  Object.freeze({
    ...step,
    hitBounds: freezeBounds(step.hitBounds),
    visibleText: Object.freeze([...step.visibleText]),
  });

export const COURSE_G04_L03_TS_008_SOURCE = Object.freeze({
  swfPath:
    "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/TS/L3TS08.swf",
  swfSha256:
    "9c7288f67f764e02f4320655b64dbb57d3d690a75951b549ee5113f385e6b885",
  pairedFlaStatus: "missing" as const,
  stage: Object.freeze({width: 800, height: 600}),
  backgroundColor: "#b8d8f7" as const,
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  frameDomain: "sprite-350" as const,
  frameCount: 789,
  liveSourcePlaybackStopFrame: 328,
});

export const COURSE_G04_L03_TS_008_QUESTION = Object.freeze({
  prompt:
    "Toni has $7. Elvin has $3. Susan owes $10. Ricky owes $2. Who has the most money?",
  correctChoiceId: "D" as const,
  quizFrame: 770 as const,
  terminalFrame: 789 as const,
});

export const COURSE_G04_L03_TS_008_CHOICES:
  readonly CourseG04L03Ts008Choice[] = Object.freeze([
    freezeChoice({
      id: "A",
      sourceInstance: "AnsBtn1",
      sourceButtonObjectId: 159,
      person: "Elvin",
      sourceStatement: "Elvin has $3.",
      signedValue: 3,
      correct: false,
      hitBounds: {x: 574.7, y: 203.9, width: 90.7, height: 40},
    }),
    freezeChoice({
      id: "B",
      sourceInstance: "AnsBtn2",
      sourceButtonObjectId: 156,
      person: "Ricky",
      sourceStatement: "Ricky owes $2.",
      signedValue: -2,
      correct: false,
      hitBounds: {x: 575, y: 269.5, width: 95.1, height: 40},
    }),
    freezeChoice({
      id: "C",
      sourceInstance: "AnsBtn3",
      sourceButtonObjectId: 158,
      person: "Susan",
      sourceStatement: "Susan owes $10.",
      signedValue: -10,
      correct: false,
      hitBounds: {x: 573.4, y: 327.4, width: 106.3, height: 38},
    }),
    freezeChoice({
      id: "D",
      sourceInstance: "AnsBtn4",
      sourceButtonObjectId: 157,
      person: "Toni",
      sourceStatement: "Toni has $7.",
      signedValue: 7,
      correct: true,
      hitBounds: {x: 574.7, y: 386.4, width: 89.3, height: 41},
    }),
  ]);

export const COURSE_G04_L03_TS_008_WALKTHROUGH_STEPS:
  readonly CourseG04L03Ts008WalkthroughStep[] = Object.freeze([
    freezeStep({
      id: 1,
      sourceStopFrame: 328,
      nextFrame: 465,
      functionalDonorFrame: 328,
      sourceOverlayButtonObjectId: 50,
      sourceUnderlayObjectId: 48,
      sourceOverlayDepth: 73,
      sourceUnderlayDepth: 71,
      revealThenClose: false,
      sourceRevealSpriteId: null,
      sourceCloseButtonObjectId: null,
      hitBounds: {x: 70.3, y: 157.5, width: 219.7, height: 133.1},
      visibleText: ["Who has the most money?"],
    }),
    freezeStep({
      id: 2,
      sourceStopFrame: 465,
      nextFrame: 592,
      functionalDonorFrame: 465,
      sourceOverlayButtonObjectId: 50,
      sourceUnderlayObjectId: 48,
      sourceOverlayDepth: 78,
      sourceUnderlayDepth: 71,
      revealThenClose: false,
      sourceRevealSpriteId: null,
      sourceCloseButtonObjectId: null,
      hitBounds: {x: 70.3, y: 304.5, width: 219.7, height: 167.2},
      visibleText: [
        "Information given:",
        "Toni has $7.",
        "Elvin has $3.",
        "Susan owes $10.",
        "Ricky owes $2.",
        "Information needed: who has the most money?",
      ],
    }),
    freezeStep({
      id: 3,
      sourceStopFrame: 592,
      nextFrame: 712,
      functionalDonorFrame: 465,
      sourceOverlayButtonObjectId: 50,
      sourceUnderlayObjectId: 48,
      sourceOverlayDepth: 78,
      sourceUnderlayDepth: 72,
      revealThenClose: true,
      sourceRevealSpriteId: "sprite-142",
      sourceCloseButtonObjectId: 141,
      hitBounds: {x: 301.3, y: 161, width: 213.6, height: 126.1},
      visibleText: [
        "Use strategy: Draw a picture. Make a number line.",
        "Place each person's name on the number line based on the amount of money they have or owe:",
        "Susan −10; Ricky −2; Elvin +3; Toni +7.",
        "Toni has the most money with $7.",
        "The correct answer choice is D.",
      ],
    }),
    freezeStep({
      id: 4,
      sourceStopFrame: 712,
      nextFrame: 770,
      functionalDonorFrame: 465,
      sourceOverlayButtonObjectId: 50,
      sourceUnderlayObjectId: 48,
      sourceOverlayDepth: 78,
      sourceUnderlayDepth: 71,
      revealThenClose: true,
      sourceRevealSpriteId: "sprite-153",
      sourceCloseButtonObjectId: 141,
      hitBounds: {x: 298.3, y: 304.5, width: 219.7, height: 167.2},
      visibleText: [
        "Use strategy: Use Logical Reasoning",
        "Having money means you have a positive amount. Owing money means you have a negative amount.",
        "Toni has $7 = +7",
        "Elvin has $3 = +3",
        "Susan owes $10 = −10",
        "Ricky owes $2 = −2",
        "Toni has the most money with $7.",
        "The correct answer choice is D.",
      ],
    }),
  ]);

const feedbackWindow = (
  kind: CourseG04L03Ts008FeedbackKind,
  branch: number,
  copy: CourseG04L03Ts008FeedbackWindow["copy"],
  sourceInstance: CourseG04L03Ts008FeedbackWindow["sourceInstance"],
  sourceSpriteId: CourseG04L03Ts008FeedbackWindow["sourceSpriteId"],
  sourceEndFrame: CourseG04L03Ts008FeedbackWindow["sourceEndFrame"],
): CourseG04L03Ts008FeedbackWindow =>
  Object.freeze({
    kind,
    branch,
    copy,
    sourceInstance,
    sourceSpriteId,
    sourceStartFrame: 2,
    sourceEndFrame,
    fps: 12,
    projectedDurationMs: ((sourceEndFrame - 1) / 12) * 1_000,
  });

/**
 * The lesson-shell helper uses random(3) + 1. Mc_Wrong_Feed4 exists in the
 * SWF but is outside that natural selection pool.
 */
export const COURSE_G04_L03_TS_008_WRONG_FEEDBACK_WINDOWS = Object.freeze([
  feedbackWindow(
    "wrong",
    1,
    "That's incorrect!",
    "Mc_Wrong_Feed1",
    "sprite-197",
    28,
  ),
  feedbackWindow(
    "wrong",
    2,
    "Incorrect!",
    "Mc_Wrong_Feed2",
    "sprite-232",
    31,
  ),
  feedbackWindow(
    "wrong",
    3,
    "Try Again!",
    "Mc_Wrong_Feed3",
    "sprite-208",
    28,
  ),
]);

/**
 * The lesson-shell helper uses random(4) + 1. Mc_Right_Feed5 / "Good Job!"
 * exists in the SWF but is outside that natural selection pool.
 */
export const COURSE_G04_L03_TS_008_RIGHT_FEEDBACK_WINDOWS = Object.freeze([
  feedbackWindow(
    "right",
    1,
    "YOU GOT IT!",
    "Mc_Right_Feed1",
    "sprite-284",
    27,
  ),
  feedbackWindow(
    "right",
    2,
    "Correct!",
    "Mc_Right_Feed2",
    "sprite-300",
    28,
  ),
  feedbackWindow(
    "right",
    3,
    "Great Job!",
    "Mc_Right_Feed3",
    "sprite-324",
    28,
  ),
  feedbackWindow(
    "right",
    4,
    "Great Job!",
    "Mc_Right_Feed4",
    "sprite-312",
    25,
  ),
]);

export const COURSE_G04_L03_TS_008_GLOSSARY = Object.freeze([
  Object.freeze({
    term: "Positive number" as const,
    visibleText: "positive numbers",
    sourceButtonObjectId: 166,
    sourceHitBoundsResolved: false,
    hostAction: "DoHyperLinks" as const,
    hostContentResolved: false,
    enabled: false,
    mode: "safe-disabled-unresolved-host-callback" as const,
  }),
  Object.freeze({
    term: "Owe" as const,
    visibleText: "Owing",
    sourceButtonObjectId: 167,
    sourceHitBoundsResolved: false,
    hostAction: "DoHyperLinks" as const,
    hostContentResolved: false,
    enabled: false,
    mode: "safe-disabled-unresolved-host-callback" as const,
  }),
  Object.freeze({
    term: "Negative number" as const,
    visibleText: "negative numbers",
    sourceButtonObjectId: 168,
    sourceHitBoundsResolved: false,
    hostAction: "DoHyperLinks" as const,
    hostContentResolved: false,
    enabled: false,
    mode: "safe-disabled-unresolved-host-callback" as const,
  }),
]);

export const COURSE_G04_L03_TS_008_NEED_MORE_HELP = Object.freeze({
  sourceButtonObjectId: 14,
  sourcePopupObjectId: 169,
  sourceCloseButtonObjectId: 161,
  buttonBounds: freezeBounds({
    x: 601.4,
    y: 130.8,
    width: 118.5,
    height: 27.5,
  }),
  popupBounds: freezeBounds({
    x: 63.5,
    y: 157.9,
    width: 651,
    height: 181.5,
  }),
  text: Object.freeze([
    "Owing money means negative numbers",
    "Having money means positive numbers",
  ]),
  numberLineMinimum: -10,
  numberLineMaximum: 10,
  availability:
    "source-visible-after-box-3-or-box-4-reveal-and-at-quiz-frame-770",
  closeAndGlossaryHitBoundsStatus:
    "unresolved-use-accessible-current-js-controls-without-source-pixel-parity-claim",
});

export const COURSE_G04_L03_TS_008_DONOR_POLICY = Object.freeze({
  functionalStateMap: Object.freeze([
    Object.freeze({
      state: "walkthrough-step-1",
      sourceFrame: 328 as const,
      donorFrame: 328 as const,
    }),
    Object.freeze({
      state: "walkthrough-step-2",
      sourceFrame: 465 as const,
      donorFrame: 465 as const,
    }),
    Object.freeze({
      state: "walkthrough-step-3",
      sourceFrame: 592 as const,
      donorFrame: 465 as const,
    }),
    Object.freeze({
      state: "walkthrough-step-4",
      sourceFrame: 712 as const,
      donorFrame: 465 as const,
    }),
    Object.freeze({
      state: "quiz",
      sourceFrame: 770 as const,
      donorFrame: 769 as const,
    }),
    Object.freeze({
      state: "terminal",
      sourceFrame: 789 as const,
      donorFrame: 789 as const,
    }),
  ]),
  unsafeDirectSourceFrames: Object.freeze([
    Object.freeze({
      frame: 592 as const,
      reason:
        "The static Canvas advances newly placed nested timelines from global time and does not execute Mc_box1 visibility ActionScript.",
    }),
    Object.freeze({
      frame: 712 as const,
      reason:
        "The static Canvas can composite sprite-91 and Mc_box2 at a non-natural local playhead because placement-entry state and visibility ActionScript are not executed.",
    }),
    Object.freeze({
      frame: 770 as const,
      reason:
        "The static Canvas does not execute Mc_Popup._visible=false and therefore draws the Need More Help popup open.",
    }),
  ]),
  functionalPolicy:
    "Use the listed clean donor only in current-JS functional mode; render walkthrough text and controls as immutable semantic DOM overlays.",
  deterministicCapturePolicy:
    "Render the exact requested source frame with no donor remap and no current-JS interaction overlay.",
  sourceParityEstablished: false,
});

export const COURSE_G04_L03_TS_008_PLAYBACK_POLICY = Object.freeze({
  timingAuthority: "source-window-projection-only",
  pause: Object.freeze({
    policy:
      "renderer-must-freeze-walkthrough-and-feedback-remaining-time-without-dispatching-feedback-complete",
    sourceParityEstablished: false,
  }),
  reducedMotion: Object.freeze({
    policy:
      "show-static-reveal-or-feedback-state-before-explicit-completion",
    sourceParityEstablished: false,
  }),
  replay: Object.freeze({
    policy:
      "reset-frame-step-reveal-quiz-try-feedback-need-more-help-focus-and-seed-vector",
    sourceParityEstablished: false,
  }),
});

export const COURSE_G04_L03_TS_008_INTERACTION_AUTHORITY = Object.freeze({
  pairedFlaAvailable: false,
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
  choiceId: CourseG04L03Ts008ChoiceId,
): CourseG04L03Ts008FocusTarget => `choice-${choiceId}`;

const freezeState = (
  state: CourseG04L03Ts008InteractionState,
): CourseG04L03Ts008InteractionState =>
  Object.freeze({
    ...state,
    feedback: state.feedback
      ? Object.freeze({
          ...state.feedback,
          sourceWindow: state.feedback.sourceWindow,
        })
      : null,
  });

export const createCourseG04L03Ts008InteractionState = (
  seed = 0,
): CourseG04L03Ts008InteractionState =>
  freezeState({
    seed: normalizeSeed(seed),
    phase: "walkthrough",
    walkthroughGate: 0,
    walkthroughBoxRevealed: false,
    frame: 328,
    wrongTryCount: 0,
    selectedChoiceId: null,
    feedback: null,
    focusTarget: "walkthrough-step-1",
    needMoreHelpReturnPhase: null,
    needMoreHelpReturnFocus: null,
  });

const completeFeedback = (
  state: CourseG04L03Ts008InteractionState,
): CourseG04L03Ts008InteractionState => {
  const feedback = state.feedback;
  if (state.phase !== "feedback" || !feedback) return state;

  if (feedback.kind === "right" || state.wrongTryCount === 1) {
    return freezeState({
      ...state,
      phase: "terminal",
      walkthroughGate: null,
      walkthroughBoxRevealed: false,
      frame: 789,
      wrongTryCount: 0,
      selectedChoiceId: feedback.choiceId,
      feedback: null,
      focusTarget: "terminal",
      needMoreHelpReturnPhase: null,
      needMoreHelpReturnFocus: null,
    });
  }

  return freezeState({
    ...state,
    phase: "quiz",
    walkthroughGate: null,
    walkthroughBoxRevealed: false,
    frame: 770,
    wrongTryCount: 1,
    selectedChoiceId: null,
    feedback: null,
    focusTarget: focusForChoice(feedback.choiceId),
    needMoreHelpReturnPhase: null,
    needMoreHelpReturnFocus: null,
  });
};

const canOpenNeedMoreHelp = (
  state: CourseG04L03Ts008InteractionState,
): state is CourseG04L03Ts008InteractionState & {
  readonly phase: "walkthrough" | "quiz";
} =>
  state.phase === "quiz" ||
  (
    state.phase === "walkthrough" &&
    (state.walkthroughGate === 2 || state.walkthroughGate === 3) &&
    state.walkthroughBoxRevealed
  );

export const reduceCourseG04L03Ts008Interaction = (
  state: CourseG04L03Ts008InteractionState,
  action: CourseG04L03Ts008InteractionAction,
): CourseG04L03Ts008InteractionState => {
  switch (action.type) {
    case "continue-walkthrough": {
      if (
        state.phase !== "walkthrough" ||
        (state.walkthroughGate !== 0 && state.walkthroughGate !== 1) ||
        state.walkthroughBoxRevealed
      ) {
        return state;
      }

      if (state.walkthroughGate === 0) {
        return freezeState({
          ...state,
          walkthroughGate: 1,
          frame: 465,
          focusTarget: "walkthrough-step-2",
        });
      }

      return freezeState({
        ...state,
        walkthroughGate: 2,
        frame: 592,
        focusTarget: "walkthrough-step-3",
      });
    }

    case "reveal-walkthrough-box": {
      if (
        state.phase !== "walkthrough" ||
        (state.walkthroughGate !== 2 && state.walkthroughGate !== 3) ||
        state.walkthroughBoxRevealed
      ) {
        return state;
      }

      return freezeState({
        ...state,
        walkthroughBoxRevealed: true,
        focusTarget:
          state.walkthroughGate === 2
            ? "walkthrough-box-3-close"
            : "walkthrough-box-4-close",
      });
    }

    case "close-walkthrough-box": {
      if (
        state.phase !== "walkthrough" ||
        (state.walkthroughGate !== 2 && state.walkthroughGate !== 3) ||
        !state.walkthroughBoxRevealed
      ) {
        return state;
      }

      if (state.walkthroughGate === 2) {
        return freezeState({
          ...state,
          walkthroughGate: 3,
          walkthroughBoxRevealed: false,
          frame: 712,
          focusTarget: "walkthrough-step-4",
          needMoreHelpReturnPhase: null,
          needMoreHelpReturnFocus: null,
        });
      }

      return freezeState({
        ...state,
        phase: "quiz",
        walkthroughGate: null,
        walkthroughBoxRevealed: false,
        frame: 770,
        focusTarget: "choice-A",
        needMoreHelpReturnPhase: null,
        needMoreHelpReturnFocus: null,
      });
    }

    case "choose": {
      if (state.phase !== "quiz") return state;
      const choice = COURSE_G04_L03_TS_008_CHOICES.find(
        ({id}) => id === action.choiceId,
      );
      if (!choice) return state;

      const windows = choice.correct
        ? COURSE_G04_L03_TS_008_RIGHT_FEEDBACK_WINDOWS
        : COURSE_G04_L03_TS_008_WRONG_FEEDBACK_WINDOWS;
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
          copy: sourceWindow.copy,
          choiceId: choice.id,
          sourceWindow,
        },
        focusTarget: "feedback-status",
        needMoreHelpReturnPhase: null,
        needMoreHelpReturnFocus: null,
      });
    }

    case "feedback-complete":
      return completeFeedback(state);

    case "open-need-more-help":
      if (!canOpenNeedMoreHelp(state)) return state;
      return freezeState({
        ...state,
        phase: "need-more-help",
        focusTarget: "need-more-help-close",
        needMoreHelpReturnPhase: state.phase,
        needMoreHelpReturnFocus: "need-more-help",
      });

    case "close-need-more-help":
      if (
        state.phase !== "need-more-help" ||
        state.needMoreHelpReturnPhase === null
      ) {
        return state;
      }
      return freezeState({
        ...state,
        phase: state.needMoreHelpReturnPhase,
        focusTarget: state.needMoreHelpReturnFocus ?? "need-more-help",
        needMoreHelpReturnPhase: null,
        needMoreHelpReturnFocus: null,
      });

    case "open-glossary":
      return state;

    case "replay":
      return createCourseG04L03Ts008InteractionState(
        action.seed ?? state.seed,
      );

    default:
      return state;
  }
};
