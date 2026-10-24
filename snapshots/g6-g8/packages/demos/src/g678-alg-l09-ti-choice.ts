import type {ActivationInput} from "./g678-advanced-manual/contracts";
import {isActivationInput} from "./g678-advanced-manual/contracts";
import {selectHostFeedback} from
  "./g678-advanced-manual/host-feedback-selector";

export interface AlgL09TiChoiceOption {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly sourceButtonCharacterId: number;
  readonly sourceButtonDepth: number;
  readonly sourceInstanceName: string;
  readonly correct: boolean;
  readonly wrong: Readonly<{
    first: string;
    second: string;
  }> | null;
}

export interface AlgL09TiChoiceBehavior {
  readonly animationId: string;
  readonly source: Readonly<{
    path: string;
    bytes: number;
    sha256: string;
  }>;
  readonly frameDomain: string;
  readonly frameCount: number;
  readonly stopFrame: number;
  readonly resumeFrame: number;
  readonly sourceTerminalStopPresent: boolean;
  readonly correctChoice: string;
  readonly options: readonly AlgL09TiChoiceOption[];
  readonly maximumWrongAttempts: 2;
  readonly sourceText: Readonly<{
    question: string;
    correct: "Correct!";
  }>;
  readonly sourceFeedbackDomainCount: 8;
  readonly sourceWrongFeedbackAttemptIncrementComplete: boolean;
  readonly maintainedAttemptCounterNormalizesKnownSourceVariantDefect: boolean;
}

export type AlgL09TiChoicePhase =
  | "before-stop"
  | "choosing"
  | "wrong-feedback-1"
  | "wrong-feedback-2"
  | "right-feedback"
  | "resumed";

export interface AlgL09TiChoiceState {
  readonly phase: AlgL09TiChoicePhase;
  readonly selectedChoice: string | null;
  readonly quizTryCount: 0 | 1 | 2;
  readonly mainFrame: number;
  readonly mainPlaying: boolean;
  readonly choicesEnabled: boolean;
  readonly rightFeedbackBranch: 1 | 2 | 3 | 4 | null;
  readonly replay: number;
  readonly blockedReason: string | null;
}

export type AlgL09TiChoiceEvent =
  | Readonly<{type: "observe-frame"; frame: number}>
  | Readonly<{
      type: "choose";
      choice: string;
      input: ActivationInput;
      seed: number;
    }>
  | Readonly<{type: "dismiss-wrong"; input: ActivationInput}>
  | Readonly<{type: "right-feedback-finished"}>
  | Readonly<{type: "replay"; input: ActivationInput}>;

function blocked(
  state: AlgL09TiChoiceState,
  reason: string,
): AlgL09TiChoiceState {
  return {...state, blockedReason: reason};
}

function validFrame(
  behavior: AlgL09TiChoiceBehavior,
  frame: number,
) {
  return Number.isSafeInteger(frame) && frame >= 1 &&
    frame <= behavior.frameCount;
}

function choosingState(
  behavior: AlgL09TiChoiceBehavior,
  state: AlgL09TiChoiceState,
  quizTryCount: 0 | 1,
): AlgL09TiChoiceState {
  return {
    ...state,
    phase: "choosing",
    selectedChoice: null,
    quizTryCount,
    mainFrame: behavior.stopFrame,
    mainPlaying: false,
    choicesEnabled: true,
    rightFeedbackBranch: null,
    blockedReason: null,
  };
}

function resumedState(
  behavior: AlgL09TiChoiceBehavior,
  state: AlgL09TiChoiceState,
): AlgL09TiChoiceState {
  return {
    ...state,
    phase: "resumed",
    selectedChoice: null,
    quizTryCount: 0,
    mainFrame: behavior.resumeFrame,
    mainPlaying: true,
    choicesEnabled: false,
    rightFeedbackBranch: null,
    blockedReason: null,
  };
}

export function createAlgL09TiChoiceState(): AlgL09TiChoiceState {
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

export function feedbackForAlgL09TiChoice(
  behavior: AlgL09TiChoiceBehavior,
  state: AlgL09TiChoiceState,
): string | null {
  if (state.phase === "right-feedback") return behavior.sourceText.correct;
  if (state.phase !== "wrong-feedback-1" &&
    state.phase !== "wrong-feedback-2") return null;
  const selected = behavior.options.find((option) =>
    option.id === state.selectedChoice);
  if (!selected?.wrong) return null;
  return state.phase === "wrong-feedback-1"
    ? selected.wrong.first
    : selected.wrong.second;
}

export function reduceAlgL09TiChoice(
  behavior: AlgL09TiChoiceBehavior,
  state: AlgL09TiChoiceState,
  event: AlgL09TiChoiceEvent,
): AlgL09TiChoiceState {
  switch (event.type) {
    case "observe-frame":
      if (!validFrame(behavior, event.frame)) {
        return blocked(state, "frame-invalid");
      }
      if (state.phase === "resumed") {
        return {...state, mainFrame: event.frame, mainPlaying: true,
          blockedReason: null};
      }
      if (event.frame >= behavior.stopFrame) {
        return state.phase === "before-stop"
          ? choosingState(behavior, state, 0)
          : state;
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
      const selected = behavior.options.find((option) =>
        option.id === event.choice);
      if (!selected) return blocked(state, "choice-unknown");
      if (selected.correct) {
        const feedback = selectHostFeedback("right", event.seed);
        return {...state, phase: "right-feedback",
          selectedChoice: selected.id, choicesEnabled: false,
          rightFeedbackBranch: feedback.branchIndex as 1 | 2 | 3 | 4,
          blockedReason: null};
      }
      const second = state.quizTryCount >= 1;
      return {...state,
        phase: second ? "wrong-feedback-2" : "wrong-feedback-1",
        selectedChoice: selected.id,
        quizTryCount: second ? 2 : 1,
        choicesEnabled: false,
        rightFeedbackBranch: null,
        blockedReason: null};
    }
    case "dismiss-wrong":
      if (!isActivationInput(event.input)) {
        return blocked(state, "activation-input-unsupported");
      }
      if (state.phase === "wrong-feedback-1") {
        return choosingState(behavior, state, 1);
      }
      if (state.phase === "wrong-feedback-2") {
        return resumedState(behavior, state);
      }
      return blocked(state, "wrong-feedback-not-active");
    case "right-feedback-finished":
      return state.phase === "right-feedback"
        ? resumedState(behavior, state)
        : blocked(state, "right-feedback-not-active");
    case "replay":
      if (!isActivationInput(event.input)) {
        return blocked(state, "activation-input-unsupported");
      }
      return {...createAlgL09TiChoiceState(), replay: state.replay + 1};
  }
}
