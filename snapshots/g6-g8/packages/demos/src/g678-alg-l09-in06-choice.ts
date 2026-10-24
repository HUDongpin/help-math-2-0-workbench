import type {ActivationInput} from "./g678-advanced-manual/contracts";
import {isActivationInput} from "./g678-advanced-manual/contracts";
import {selectHostFeedback} from
  "./g678-advanced-manual/host-feedback-selector";

export type AlgL09In06ChoiceId =
  | "AnsBtn1"
  | "AnsBtn2"
  | "AnsBtn3"
  | "AnsBtn4";

export type AlgL09In06Phase =
  | "before-stop"
  | "choosing"
  | "wrong-feedback-1"
  | "wrong-feedback-2"
  | "right-feedback"
  | "resumed";

export interface AlgL09In06State {
  readonly phase: AlgL09In06Phase;
  readonly selectedChoice: AlgL09In06ChoiceId | null;
  readonly quizTryCount: 0 | 1 | 2;
  readonly mainFrame: number;
  readonly mainPlaying: boolean;
  readonly choicesEnabled: boolean;
  readonly rightFeedbackBranch: 1 | 2 | 3 | 4 | null;
  readonly replay: number;
  readonly blockedReason: string | null;
}

export type AlgL09In06Event =
  | Readonly<{type: "observe-frame"; frame: number}>
  | Readonly<{
      type: "choose";
      choice: AlgL09In06ChoiceId;
      input: ActivationInput;
      seed: number;
    }>
  | Readonly<{type: "dismiss-wrong"; input: ActivationInput}>
  | Readonly<{type: "right-feedback-finished"}>
  | Readonly<{type: "replay"; input: ActivationInput}>;

export const ALG_L09_IN06_CHOICE_BEHAVIOR_V1 = Object.freeze({
  animationId: "shared-alg001-l09-p018",
  source: Object.freeze({
    path: "G6-G8-shared/ALG001/L9/IN/L9IN06.swf",
    bytes: 544774,
    sha256:
      "da5717b3f89a31869125193f91ebd081f4b49737a763b61954affd68777269e0",
  }),
  frameDomain: "sprite-189",
  frameCount: 667,
  stopFrame: 188,
  resumeFrame: 189,
  correctChoice: "AnsBtn2" as const,
  options: Object.freeze([
    Object.freeze({id: "AnsBtn1" as const, label: "A", ratio: "1:2",
      sourceButtonCharacterId: 32, correct: false}),
    Object.freeze({id: "AnsBtn2" as const, label: "B", ratio: "2:3",
      sourceButtonCharacterId: 31, correct: true}),
    Object.freeze({id: "AnsBtn3" as const, label: "C", ratio: "32:48",
      sourceButtonCharacterId: 30, correct: false}),
    Object.freeze({id: "AnsBtn4" as const, label: "D", ratio: "64:96",
      sourceButtonCharacterId: 30, correct: false}),
  ]),
  maximumWrongAttempts: 2,
  sourceText: Object.freeze({
    context:
      "64 seventh graders and 96 eighth graders play in the school band.",
    question:
      "What is the ratio of seventh graders to eighth graders in the school band?",
    instruction: "Simplify the ratio to its simplest form.",
    correct: "Correct!",
    wrongCalculation: Object.freeze({
      first: "Your calculations are incorrect. Try again.",
      second: "Your calculations are incorrect.",
    }),
    wrongSimplestForm: Object.freeze({
      first: "Reduce the fraction to its simplest form. Try again.",
      second: "Reduce the fraction to its simplest form.",
    }),
  }),
  sourceScripts: Object.freeze({
    stop:
      "1c5ee973c2576fdd6e33a3a2cf1acd334b9fddb906b45d7b2e4d0a7874fd546f",
    resume:
      "97f40c5a1237941dde9cb53b208b3c2a293ae7b1de706239e6fe5d60301f947e",
    wrongSimplestForm:
      "566c654d29eef71b8cc90fdf6060e63c4bd801c062e0d0f8f1ed74e0da01f3c3",
    correct:
      "91fddc130bddd9456227b9bbd9139c44ebcf7e51db046176f2f810e5e073db02",
    wrongCalculation:
      "799cd745028cbd4793e58afe2b124c35672e9510527cbd3fda372dee7ed6d7c7",
  }),
});

function blocked(
  state: AlgL09In06State,
  reason: string,
): AlgL09In06State {
  return {...state, blockedReason: reason};
}

function validFrame(frame: number) {
  return Number.isSafeInteger(frame) && frame >= 1 &&
    frame <= ALG_L09_IN06_CHOICE_BEHAVIOR_V1.frameCount;
}

function choosingState(
  state: AlgL09In06State,
  quizTryCount: 0 | 1,
): AlgL09In06State {
  return {
    ...state,
    phase: "choosing",
    selectedChoice: null,
    quizTryCount,
    mainFrame: ALG_L09_IN06_CHOICE_BEHAVIOR_V1.stopFrame,
    mainPlaying: false,
    choicesEnabled: true,
    rightFeedbackBranch: null,
    blockedReason: null,
  };
}

function resumedState(state: AlgL09In06State): AlgL09In06State {
  return {
    ...state,
    phase: "resumed",
    selectedChoice: null,
    quizTryCount: 0,
    mainFrame: ALG_L09_IN06_CHOICE_BEHAVIOR_V1.resumeFrame,
    mainPlaying: true,
    choicesEnabled: false,
    rightFeedbackBranch: null,
    blockedReason: null,
  };
}

export function createAlgL09In06State(): AlgL09In06State {
  return {
    phase: "before-stop",
    selectedChoice: null,
    quizTryCount: 0,
    mainFrame: 1,
    mainPlaying: true,
    choicesEnabled: false,
    rightFeedbackBranch: null,
    replay: 0,
    blockedReason: null,
  };
}

export function feedbackForAlgL09In06(
  state: AlgL09In06State,
): string | null {
  if (state.phase === "right-feedback") {
    return ALG_L09_IN06_CHOICE_BEHAVIOR_V1.sourceText.correct;
  }
  if (state.phase !== "wrong-feedback-1" &&
    state.phase !== "wrong-feedback-2") return null;
  const attempt = state.phase === "wrong-feedback-1" ? "first" : "second";
  return state.selectedChoice === "AnsBtn1"
    ? ALG_L09_IN06_CHOICE_BEHAVIOR_V1.sourceText.wrongCalculation[attempt]
    : ALG_L09_IN06_CHOICE_BEHAVIOR_V1.sourceText.wrongSimplestForm[attempt];
}

export function reduceAlgL09In06(
  state: AlgL09In06State,
  event: AlgL09In06Event,
): AlgL09In06State {
  switch (event.type) {
    case "observe-frame":
      if (!validFrame(event.frame)) return blocked(state, "frame-invalid");
      if (state.phase === "resumed") {
        return {...state, mainFrame: event.frame, mainPlaying: true,
          blockedReason: null};
      }
      if (event.frame >= ALG_L09_IN06_CHOICE_BEHAVIOR_V1.stopFrame) {
        return state.phase === "before-stop" ? choosingState(state, 0) : state;
      }
      return {...state, phase: "before-stop", mainFrame: event.frame,
        mainPlaying: true, blockedReason: null};
    case "choose": {
      if (!isActivationInput(event.input)) {
        return blocked(state, "activation-input-unsupported");
      }
      if (state.phase !== "choosing" || !state.choicesEnabled) {
        return blocked(state, "choice-disabled");
      }
      if (event.choice === ALG_L09_IN06_CHOICE_BEHAVIOR_V1.correctChoice) {
        const feedback = selectHostFeedback("right", event.seed);
        return {...state, phase: "right-feedback",
          selectedChoice: event.choice, choicesEnabled: false,
          rightFeedbackBranch: feedback.branchIndex as 1 | 2 | 3 | 4,
          blockedReason: null};
      }
      const second = state.quizTryCount >= 1;
      return {...state,
        phase: second ? "wrong-feedback-2" : "wrong-feedback-1",
        selectedChoice: event.choice,
        quizTryCount: second ? 2 : 1,
        choicesEnabled: false,
        rightFeedbackBranch: null,
        blockedReason: null};
    }
    case "dismiss-wrong":
      if (!isActivationInput(event.input)) {
        return blocked(state, "activation-input-unsupported");
      }
      if (state.phase === "wrong-feedback-1") return choosingState(state, 1);
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
      return {...createAlgL09In06State(), replay: state.replay + 1};
  }
}
