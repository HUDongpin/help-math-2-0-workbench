import type {ActivationInput} from "./g678-advanced-manual/contracts";
import {isActivationInput} from "./g678-advanced-manual/contracts";
import {selectHostFeedback} from
  "./g678-advanced-manual/host-feedback-selector";

export type AlgL09In10ChoiceId =
  | "AnsBtn1"
  | "AnsBtn2";

export type AlgL09In10Phase =
  | "before-stop"
  | "choosing"
  | "wrong-feedback-1"
  | "wrong-feedback-2"
  | "right-feedback"
  | "resumed";

export interface AlgL09In10State {
  readonly phase: AlgL09In10Phase;
  readonly selectedChoice: AlgL09In10ChoiceId | null;
  readonly quizTryCount: 0 | 1 | 2;
  readonly mainFrame: number;
  readonly mainPlaying: boolean;
  readonly choicesEnabled: boolean;
  readonly rightFeedbackBranch: 1 | 2 | 3 | 4 | null;
  readonly replay: number;
  readonly blockedReason: string | null;
}

export type AlgL09In10Event =
  | Readonly<{type: "observe-frame"; frame: number}>
  | Readonly<{
      type: "choose";
      choice: AlgL09In10ChoiceId;
      input: ActivationInput;
      seed: number;
    }>
  | Readonly<{type: "dismiss-wrong"; input: ActivationInput}>
  | Readonly<{type: "right-feedback-finished"}>
  | Readonly<{type: "replay"; input: ActivationInput}>;

export const ALG_L09_IN10_CHOICE_BEHAVIOR_V1 = Object.freeze({
  animationId: "shared-alg001-l09-p022",
  source: Object.freeze({
    path: "G6-G8-shared/ALG001/L9/IN/L9IN10.swf",
    bytes: 494767,
    sha256:
      "257ef18c7bbca00e0e28781b12eb6ccf27b4ad3cd210d8c0a0fa4b0248f397dc",
  }),
  frameDomain: "sprite-190",
  frameCount: 436,
  stopFrame: 93,
  resumeFrame: 94,
  correctChoice: "AnsBtn2" as const,
  options: Object.freeze([
    Object.freeze({id: "AnsBtn1" as const, label: "A",
      value: "proportional relationship",
      sourceButtonCharacterId: 167, correct: false}),
    Object.freeze({id: "AnsBtn2" as const, label: "B",
      value: "non-proportional relationship",
      sourceButtonCharacterId: 166, correct: true}),
  ]),
  maximumWrongAttempts: 2,
  sourceText: Object.freeze({
    context: "y = 2x + 1",
    question:
      "Is this equation shown a proportional relationship or a non-proportional relationship?",
    instruction:
      "A proportional relationship has equal ratios for every pair of values.",
    correct: "Correct!",
    wrong: Object.freeze({
      first:
        "Two quantities have a proportional relationship when every ratio of pairs of values is equal. Try again.",
      second:
        "Two quantities have a proportional relationship when every ratio of pairs of values is equal.",
    }),
  }),
  sourceScripts: Object.freeze({
    stop:
      "1c5ee973c2576fdd6e33a3a2cf1acd334b9fddb906b45d7b2e4d0a7874fd546f",
    resume:
      "97f40c5a1237941dde9cb53b208b3c2a293ae7b1de706239e6fe5d60301f947e",
    wrong:
      "012417251abd412a48472f73833672f170571cc6dcf5ad074ea6370d84eae740",
    correct:
      "91fddc130bddd9456227b9bbd9139c44ebcf7e51db046176f2f810e5e073db02",
  }),
});

function blocked(
  state: AlgL09In10State,
  reason: string,
): AlgL09In10State {
  return {...state, blockedReason: reason};
}

function validFrame(frame: number) {
  return Number.isSafeInteger(frame) && frame >= 1 &&
    frame <= ALG_L09_IN10_CHOICE_BEHAVIOR_V1.frameCount;
}

function choosingState(
  state: AlgL09In10State,
  quizTryCount: 0 | 1,
): AlgL09In10State {
  return {
    ...state,
    phase: "choosing",
    selectedChoice: null,
    quizTryCount,
    mainFrame: ALG_L09_IN10_CHOICE_BEHAVIOR_V1.stopFrame,
    mainPlaying: false,
    choicesEnabled: true,
    rightFeedbackBranch: null,
    blockedReason: null,
  };
}

function resumedState(state: AlgL09In10State): AlgL09In10State {
  return {
    ...state,
    phase: "resumed",
    selectedChoice: null,
    quizTryCount: 0,
    mainFrame: ALG_L09_IN10_CHOICE_BEHAVIOR_V1.resumeFrame,
    mainPlaying: true,
    choicesEnabled: false,
    rightFeedbackBranch: null,
    blockedReason: null,
  };
}

export function createAlgL09In10State(): AlgL09In10State {
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

export function feedbackForAlgL09In10(
  state: AlgL09In10State,
): string | null {
  if (state.phase === "right-feedback") {
    return ALG_L09_IN10_CHOICE_BEHAVIOR_V1.sourceText.correct;
  }
  if (state.phase !== "wrong-feedback-1" &&
    state.phase !== "wrong-feedback-2") return null;
  const attempt = state.phase === "wrong-feedback-1" ? "first" : "second";
  return ALG_L09_IN10_CHOICE_BEHAVIOR_V1.sourceText.wrong[attempt];
}

export function reduceAlgL09In10(
  state: AlgL09In10State,
  event: AlgL09In10Event,
): AlgL09In10State {
  switch (event.type) {
    case "observe-frame":
      if (!validFrame(event.frame)) return blocked(state, "frame-invalid");
      if (state.phase === "resumed") {
        return {...state, mainFrame: event.frame, mainPlaying: true,
          blockedReason: null};
      }
      if (event.frame >= ALG_L09_IN10_CHOICE_BEHAVIOR_V1.stopFrame) {
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
      if (event.choice === ALG_L09_IN10_CHOICE_BEHAVIOR_V1.correctChoice) {
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
      return {...createAlgL09In10State(), replay: state.replay + 1};
  }
}
