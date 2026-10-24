export type CourseG04L03In006QuestionId =
  | "question-01"
  | "question-02"
  | "question-03"
  | "question-04"
  | "question-05"
  | "question-06"
  | "question-07"
  | "question-08";

export type CourseG04L03In006JumpMagnitude = 1 | 2 | 4 | 5;
export type CourseG04L03In006JumpDirection = "positive" | "negative";
export type CourseG04L03In006JumpId = `jump-${number}`;

export type CourseG04L03In006Outcome =
  | "ready"
  | "wrong"
  | "correct-feedback"
  | "complete";

export interface CourseG04L03In006Question {
  readonly id: CourseG04L03In006QuestionId;
  readonly sourceText: string;
  readonly start: number;
  readonly target: number;
}

export interface CourseG04L03In006Jump {
  readonly id: CourseG04L03In006JumpId;
  readonly magnitude: CourseG04L03In006JumpMagnitude;
  readonly direction: CourseG04L03In006JumpDirection;
  readonly signedDelta: number;
  readonly start: number;
  readonly end: number;
}

export interface CourseG04L03In006NumberLineJumpState {
  /** Stable unsigned seed used only by the current-JS deterministic cycle. */
  readonly seed: number;
  /** Zero-based number of accepted New Number actions since Replay. */
  readonly questionRevision: number;
  readonly currentQuestion: CourseG04L03In006Question;
  readonly start: number;
  readonly target: number;
  readonly currentValue: number;
  readonly jumps: readonly CourseG04L03In006Jump[];
  readonly lastJumpId: CourseG04L03In006JumpId | null;
  readonly nextJumpOrdinal: number;
  readonly equation: string | null;
  readonly outcome: CourseG04L03In006Outcome;
  readonly newNumberEnabled: boolean;
  readonly feedback: string | null;
  readonly locked: boolean;
}

export type CourseG04L03In006NumberLineJumpAction =
  | Readonly<{
      type: "place";
      magnitude: CourseG04L03In006JumpMagnitude;
    }>
  | Readonly<{type: "invalid-drop"}>
  | Readonly<{type: "reverse-last"}>
  | Readonly<{type: "close-wrong"}>
  | Readonly<{type: "feedback-complete"}>
  | Readonly<{type: "clear"}>
  | Readonly<{type: "new-number"}>
  | Readonly<{type: "replay"}>;

const freezeQuestion = (
  question: CourseG04L03In006Question,
): CourseG04L03In006Question => Object.freeze({...question});

/**
 * Exact source-local question strings from sprite-151 frame 1054. Their order
 * is evidence-bound; selection order in this module is a current-JS policy.
 */
export const COURSE_G04_L03_IN_006_QUESTIONS:
  readonly CourseG04L03In006Question[] = Object.freeze([
    freezeQuestion({
      id: "question-01",
      sourceText: "-11~-8",
      start: -11,
      target: -8,
    }),
    freezeQuestion({
      id: "question-02",
      sourceText: "-8~-15",
      start: -8,
      target: -15,
    }),
    freezeQuestion({
      id: "question-03",
      sourceText: "-15~-4",
      start: -15,
      target: -4,
    }),
    freezeQuestion({
      id: "question-04",
      sourceText: "-4~5",
      start: -4,
      target: 5,
    }),
    freezeQuestion({
      id: "question-05",
      sourceText: "5~9",
      start: 5,
      target: 9,
    }),
    freezeQuestion({
      id: "question-06",
      sourceText: "9~15",
      start: 9,
      target: 15,
    }),
    freezeQuestion({
      id: "question-07",
      sourceText: "15~1",
      start: 15,
      target: 1,
    }),
    freezeQuestion({
      id: "question-08",
      sourceText: "1~-6",
      start: 1,
      target: -6,
    }),
  ]);

/** Source tool values Mc1, Mc2, Mc3, and Mc4. */
export const COURSE_G04_L03_IN_006_JUMP_MAGNITUDES:
  readonly CourseG04L03In006JumpMagnitude[] = Object.freeze([1, 2, 4, 5]);

export const COURSE_G04_L03_IN_006_NUMBER_LINE_RANGE = Object.freeze({
  minimum: -15,
  maximum: 15,
});

export const COURSE_G04_L03_IN_006_INSTRUCTION =
  "Click and drag the jumps to the number line to jump from the first point to the target number using as few arrows as possible.";

/**
 * Modern recovery guidance for a source wrong-audio branch whose spoken words
 * have not been established. No source-text parity is claimed.
 */
export const COURSE_G04_L03_IN_006_WRONG_FEEDBACK =
  "The current point is outside the number line. Reverse the last jump, then try again.";

export const COURSE_G04_L03_IN_006_INVALID_DROP_FEEDBACK =
  "Drop the jump on the number line, then try again.";

/** Exact visible completion text recovered from the source feedback symbol. */
export const COURSE_G04_L03_IN_006_COMPLETION_FEEDBACK = "Correct!!!";

/**
 * Source Correct_FB reaches its terminal action at nested frame 25. This is a
 * current-JS projection at 12 FPS, not an original-runtime timing trace.
 */
export const COURSE_G04_L03_IN_006_CURRENT_JS_TIMING = Object.freeze({
  correctFeedbackMs: (23 * 1_000) / 12,
});

export const COURSE_G04_L03_IN_006_INTERACTION_AUTHORITY = Object.freeze({
  evidenceBasis:
    "hash-bound-fla-sprite-151-frame-1054-and-swf-avm1-number-line-handlers",
  implementationKind: "current-javascript-pure-state-candidate",
  questionSetSourceExact: true,
  jumpMagnitudesSourceExact: true,
  equationShapeSourceExact: true,
  wrongFeedbackTextDisposition: "modern-assistive-not-source-exact",
  wrongFeedbackTextSourceExact: false,
  correctFeedbackTextSourceExact: true,
  correctFeedbackTimerIsOriginalRuntimeTrace: false,
  newNumberSelectionDisposition: "current-javascript-deterministic-cycle",
  sourceRandomSelectionExecuted: false,
  sourceDragDropExecuted: false,
  embeddedFeedbackAudioModeled: false,
  associatedAudioModeled: false,
  audioParityEstablished: false,
  behaviorParityEstablished: false,
  replayParityEstablished: false,
  ownerAccepted: false,
  strictMigrationComplete: false,
  strictAcceptanceEffect: "none",
});

const freezeJump = (
  jump: CourseG04L03In006Jump,
): CourseG04L03In006Jump => Object.freeze({...jump});

const freezeState = (
  state: CourseG04L03In006NumberLineJumpState,
): CourseG04L03In006NumberLineJumpState => Object.freeze({
  ...state,
  jumps: Object.freeze(state.jumps.map(freezeJump)),
});

const normalizeSeed = (seed: number): number => {
  if (!Number.isFinite(seed)) return 0;
  return Math.trunc(seed) >>> 0;
};

const getQuestionForRevision = (
  seed: number,
  questionRevision: number,
): CourseG04L03In006Question => {
  const index = (seed + questionRevision)
    % COURSE_G04_L03_IN_006_QUESTIONS.length;
  const question = COURSE_G04_L03_IN_006_QUESTIONS[index];
  if (question === undefined) {
    throw new Error("IN006 deterministic question cycle is empty.");
  }
  return question;
};

const createQuestionState = (
  seed: number,
  questionRevision: number,
  newNumberEnabled = false,
): CourseG04L03In006NumberLineJumpState => {
  const currentQuestion = getQuestionForRevision(seed, questionRevision);
  return freezeState({
    seed,
    questionRevision,
    currentQuestion,
    start: currentQuestion.start,
    target: currentQuestion.target,
    currentValue: currentQuestion.start,
    jumps: [],
    lastJumpId: null,
    nextJumpOrdinal: 1,
    equation: null,
    outcome: "ready",
    newNumberEnabled,
    feedback: null,
    locked: false,
  });
};

const isKnownJumpMagnitude = (
  magnitude: number,
): magnitude is CourseG04L03In006JumpMagnitude =>
  COURSE_G04_L03_IN_006_JUMP_MAGNITUDES.some(
    (knownMagnitude) => knownMagnitude === magnitude,
  );

const isCurrentValueInRange = (value: number): boolean =>
  value >= COURSE_G04_L03_IN_006_NUMBER_LINE_RANGE.minimum
  && value <= COURSE_G04_L03_IN_006_NUMBER_LINE_RANGE.maximum;

const formatEquation = (
  start: number,
  signedDelta: number,
  end: number,
): string => `${start} + ${signedDelta} = ${end}`;

const getCumulativeSignedDelta = (
  state: CourseG04L03In006NumberLineJumpState,
  currentValue: number,
): number => currentValue - state.start;

const getOutcomeAfterMovement = (
  state: CourseG04L03In006NumberLineJumpState,
  currentValue: number,
): Pick<
  CourseG04L03In006NumberLineJumpState,
  "feedback" | "locked" | "outcome"
> => currentValue === state.target
  ? {
      outcome: "correct-feedback",
      locked: true,
      feedback: COURSE_G04_L03_IN_006_COMPLETION_FEEDBACK,
    }
  : {
      outcome: "ready",
      locked: false,
      feedback: null,
    };

export const createCourseG04L03In006NumberLineJumpState = (
  seed = 0,
): CourseG04L03In006NumberLineJumpState =>
  createQuestionState(normalizeSeed(seed), 0);

export const reduceCourseG04L03In006NumberLineJumpInteraction = (
  state: CourseG04L03In006NumberLineJumpState,
  action: CourseG04L03In006NumberLineJumpAction,
): CourseG04L03In006NumberLineJumpState => {
  switch (action.type) {
    case "place": {
      if (
        state.locked
        || state.outcome !== "ready"
        || !isKnownJumpMagnitude(action.magnitude)
      ) return state;

      /*
       * The AVM1 drop guard checks the current/pre-step position. A valid
       * placement can therefore land beyond -15 or 15; only the next Place
       * attempt enters the assistive wrong state.
       */
      if (!isCurrentValueInRange(state.currentValue)) {
        return freezeState({
          ...state,
          outcome: "wrong",
          locked: true,
          feedback: COURSE_G04_L03_IN_006_WRONG_FEEDBACK,
        });
      }

      const jumpId = `jump-${state.nextJumpOrdinal}` as const;
      const end = state.currentValue + action.magnitude;
      const jump = freezeJump({
        id: jumpId,
        magnitude: action.magnitude,
        direction: "positive",
        signedDelta: action.magnitude,
        start: state.currentValue,
        end,
      });
      const cumulativeSignedDelta = getCumulativeSignedDelta(state, end);

      return freezeState({
        ...state,
        currentValue: end,
        jumps: [...state.jumps, jump],
        lastJumpId: jumpId,
        nextJumpOrdinal: state.nextJumpOrdinal + 1,
        equation: formatEquation(state.start, cumulativeSignedDelta, end),
        ...getOutcomeAfterMovement(state, end),
      });
    }

    case "invalid-drop":
      if (state.locked || state.outcome !== "ready") return state;
      return freezeState({
        ...state,
        outcome: "wrong",
        locked: true,
        feedback: COURSE_G04_L03_IN_006_INVALID_DROP_FEEDBACK,
      });

    case "reverse-last": {
      if (
        state.locked
        || state.outcome !== "ready"
        || state.lastJumpId === null
      ) return state;

      const lastJumpIndex = state.jumps.findIndex(
        ({id}) => id === state.lastJumpId,
      );
      if (lastJumpIndex < 0 || lastJumpIndex !== state.jumps.length - 1) {
        return state;
      }

      const lastJump = state.jumps[lastJumpIndex];
      if (lastJump === undefined) return state;

      const direction = lastJump.direction === "positive"
        ? "negative"
        : "positive";
      const signedDelta = direction === "positive"
        ? lastJump.magnitude
        : -lastJump.magnitude;
      const end = lastJump.start + signedDelta;
      const reversedJump = freezeJump({
        ...lastJump,
        direction,
        signedDelta,
        end,
      });
      const jumps = [...state.jumps];
      jumps[lastJumpIndex] = reversedJump;
      const cumulativeSignedDelta = getCumulativeSignedDelta(state, end);

      return freezeState({
        ...state,
        currentValue: end,
        jumps,
        equation: formatEquation(state.start, cumulativeSignedDelta, end),
        ...getOutcomeAfterMovement(state, end),
      });
    }

    case "close-wrong":
      if (state.outcome !== "wrong") return state;
      return freezeState({
        ...state,
        outcome: "ready",
        locked: false,
        feedback: null,
      });

    case "feedback-complete":
      if (state.outcome !== "correct-feedback") return state;
      return freezeState({
        ...state,
        outcome: "complete",
        newNumberEnabled: true,
        feedback: COURSE_G04_L03_IN_006_COMPLETION_FEEDBACK,
        locked: true,
      });

    case "clear":
      /*
       * Source clearfun resets the current question and jump copies but does
       * not change ButtonNew.enabled. Preserve that enable bit exactly.
       */
      return createQuestionState(
        state.seed,
        state.questionRevision,
        state.newNumberEnabled,
      );

    case "new-number":
      if (!state.newNumberEnabled) return state;
      return createQuestionState(
        state.seed,
        state.questionRevision + 1,
      );

    case "replay":
      return createQuestionState(state.seed, 0);
  }
};
