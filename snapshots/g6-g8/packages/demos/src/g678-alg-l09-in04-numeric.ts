import type {ActivationInput} from "./g678-advanced-manual/contracts";
import {isActivationInput} from "./g678-advanced-manual/contracts";
import {selectHostFeedback} from
  "./g678-advanced-manual/host-feedback-selector";

export type AlgL09In04Field = "numerator" | "denominator";
export type AlgL09In04Phase =
  | "before-stop"
  | "editing"
  | "wrong-feedback-1"
  | "wrong-feedback-2"
  | "right-feedback"
  | "resumed";

export interface AlgL09In04State {
  readonly phase: AlgL09In04Phase;
  readonly numerator: string;
  readonly denominator: string;
  readonly quizTryCount: 0 | 1 | 2;
  readonly mainFrame: number;
  readonly mainPlaying: boolean;
  readonly inputEnabled: boolean;
  readonly submitEnabled: boolean;
  readonly rightFeedbackBranch: 1 | 2 | 3 | 4 | null;
  readonly replay: number;
  readonly blockedReason: string | null;
}

export type AlgL09In04Event =
  | Readonly<{type: "observe-frame"; frame: number}>
  | Readonly<{
      type: "edit-field";
      field: AlgL09In04Field;
      value: string;
    }>
  | Readonly<{type: "submit"; input: ActivationInput; seed: number}>
  | Readonly<{type: "dismiss-wrong"; input: ActivationInput}>
  | Readonly<{type: "right-feedback-finished"}>
  | Readonly<{type: "replay"; input: ActivationInput}>;

export const ALG_L09_IN04_NUMERIC_BEHAVIOR_V1 = Object.freeze({
  animationId: "shared-alg001-l09-p016",
  source: Object.freeze({
    path: "G6-G8-shared/ALG001/L9/IN/L9IN04.swf",
    bytes: 167475,
    sha256:
      "ced5bd922a1f475c2296b77a547e4db3ef015704c98dbcf5ee10feda4a34dc66",
  }),
  frameDomain: "sprite-81",
  frameCount: 420,
  stopFrame: 270,
  resumeFrame: 271,
  answer: Object.freeze({numerator: "7", denominator: "20"}),
  maximumWrongAttempts: 2,
  sourceText: Object.freeze({
    context: "Spark has 20 fiction books and 7 nonfiction books on a bookcase.",
    question:
      "What is the ratio of nonfiction books to fiction books in Spark’s bookcase?",
    firstWrong: "Enter nonfiction : fiction. Try again",
    secondWrong: "Enter nonfiction : fiction.",
    correct: "Correct!",
  }),
  sourceScripts: Object.freeze({
    stop:
      "1e41aee2e4fc0a780d3badb9bad570b382748085182f692bf4ee36af27dc4842",
    submit:
      "2eb5b453c25edc775700626e376a3783b2d3fd5666bf0e16d064c1d1b67d04d0",
    retry:
      "8394f531164e2111a0b5aa7a6bafbce9941ca46e04abb71a86599475dc34d5ac",
    secondWrongResume:
      "c8963f66e762ead7429378e021a68cbe5b8e8ca6e47b36472a73148b3ace529a",
  }),
});

function blocked(
  state: AlgL09In04State,
  reason: string,
): AlgL09In04State {
  return {...state, blockedReason: reason};
}

function validFrame(frame: number) {
  return Number.isSafeInteger(frame) && frame >= 1 &&
    frame <= ALG_L09_IN04_NUMERIC_BEHAVIOR_V1.frameCount;
}

function validDigits(value: string) {
  return /^\d{0,3}$/.test(value);
}

export function createAlgL09In04State(): AlgL09In04State {
  return {
    phase: "before-stop",
    numerator: "",
    denominator: "",
    quizTryCount: 0,
    mainFrame: 1,
    mainPlaying: true,
    inputEnabled: false,
    submitEnabled: false,
    rightFeedbackBranch: null,
    replay: 0,
    blockedReason: null,
  };
}

function editingState(
  state: AlgL09In04State,
  quizTryCount: 0 | 1,
): AlgL09In04State {
  return {
    ...state,
    phase: "editing",
    numerator: "",
    denominator: "",
    quizTryCount,
    mainFrame: ALG_L09_IN04_NUMERIC_BEHAVIOR_V1.stopFrame,
    mainPlaying: false,
    inputEnabled: true,
    submitEnabled: false,
    rightFeedbackBranch: null,
    blockedReason: null,
  };
}

function resumedState(state: AlgL09In04State): AlgL09In04State {
  return {
    ...state,
    phase: "resumed",
    numerator: "",
    denominator: "",
    mainFrame: ALG_L09_IN04_NUMERIC_BEHAVIOR_V1.resumeFrame,
    mainPlaying: true,
    inputEnabled: false,
    submitEnabled: false,
    rightFeedbackBranch: null,
    blockedReason: null,
  };
}

export function reduceAlgL09In04(
  state: AlgL09In04State,
  event: AlgL09In04Event,
): AlgL09In04State {
  switch (event.type) {
    case "observe-frame":
      if (!validFrame(event.frame)) return blocked(state, "frame-invalid");
      if (state.phase === "resumed") {
        return {...state, mainFrame: event.frame, mainPlaying: true,
          blockedReason: null};
      }
      if (event.frame >= ALG_L09_IN04_NUMERIC_BEHAVIOR_V1.stopFrame) {
        return state.phase === "before-stop" ? editingState(state, 0) : state;
      }
      return {...state, phase: "before-stop", mainFrame: event.frame,
        mainPlaying: true, blockedReason: null};
    case "edit-field": {
      if (state.phase !== "editing" || !state.inputEnabled) {
        return blocked(state, "numeric-input-disabled");
      }
      if (!validDigits(event.value)) return blocked(state, "digits-only");
      const next = {...state, [event.field]: event.value, blockedReason: null};
      return {...next,
        submitEnabled: next.numerator.length > 0 && next.denominator.length > 0};
    }
    case "submit": {
      if (!isActivationInput(event.input)) {
        return blocked(state, "activation-input-unsupported");
      }
      if (state.phase !== "editing" || !state.submitEnabled) {
        return blocked(state, "submit-disabled");
      }
      const correct = state.numerator ===
        ALG_L09_IN04_NUMERIC_BEHAVIOR_V1.answer.numerator &&
        state.denominator ===
        ALG_L09_IN04_NUMERIC_BEHAVIOR_V1.answer.denominator;
      if (correct) {
        const feedback = selectHostFeedback("right", event.seed);
        return {...state, phase: "right-feedback", inputEnabled: false,
          submitEnabled: false, rightFeedbackBranch: feedback.branchIndex as
            1 | 2 | 3 | 4, blockedReason: null};
      }
      const second = state.quizTryCount >= 1;
      return {...state,
        phase: second ? "wrong-feedback-2" : "wrong-feedback-1",
        quizTryCount: second ? 2 : 1,
        inputEnabled: false,
        submitEnabled: false,
        rightFeedbackBranch: null,
        blockedReason: null};
    }
    case "dismiss-wrong":
      if (!isActivationInput(event.input)) {
        return blocked(state, "activation-input-unsupported");
      }
      if (state.phase === "wrong-feedback-1") return editingState(state, 1);
      if (state.phase === "wrong-feedback-2") return resumedState(state);
      return blocked(state, "wrong-feedback-not-active");
    case "right-feedback-finished":
      return state.phase === "right-feedback"
        ? resumedState(state)
        : blocked(state, "right-feedback-not-active");
    case "replay":
      if (!isActivationInput(event.input)) {
        return blocked(state, "activation-input-unsupported");
      }
      return {...createAlgL09In04State(), replay: state.replay + 1};
  }
}
