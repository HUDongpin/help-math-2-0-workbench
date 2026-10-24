import type {ActivationInput} from "./g678-advanced-manual/contracts";
import {isActivationInput} from "./g678-advanced-manual/contracts";
import {selectHostFeedback} from
  "./g678-advanced-manual/host-feedback-selector";

export type AlgL09GuidedStopKind =
  | "continue"
  | "help-or-continue"
  | "quiz"
  | "terminal";

export interface AlgL09GuidedStop {
  readonly id: string;
  readonly frame: number;
  readonly resumeFrame: number | null;
  readonly kind: AlgL09GuidedStopKind;
}

export interface AlgL09GuidedOption {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly correct: boolean;
}

export interface AlgL09GuidedTutorialBehavior {
  readonly animationId: string;
  readonly source: Readonly<{
    path: string;
    bytes: number;
    sha256: string;
  }>;
  readonly frameDomain: string;
  readonly frameCount: number;
  readonly stops: readonly AlgL09GuidedStop[];
  readonly finalQuestion: string;
  readonly options: readonly AlgL09GuidedOption[];
  readonly correctChoiceId: string;
  readonly maximumWrongAttempts: 2;
  readonly sourceFeedbackDomainCount: 8;
}

export type AlgL09GuidedPhase =
  | "playing"
  | "continue-stop"
  | "help-choice"
  | "help-open"
  | "choosing"
  | "wrong-feedback-1"
  | "wrong-feedback-2"
  | "right-feedback"
  | "terminal";

export interface AlgL09GuidedTutorialState {
  readonly phase: AlgL09GuidedPhase;
  readonly activeStopId: string | null;
  readonly resolvedStopIds: readonly string[];
  readonly selectedChoiceId: string | null;
  readonly quizTryCount: 0 | 1 | 2;
  readonly mainFrame: number;
  readonly mainPlaying: boolean;
  readonly rightFeedbackBranch: 1 | 2 | 3 | 4 | null;
  readonly replay: number;
  readonly blockedReason: string | null;
}

export type AlgL09GuidedTutorialEvent =
  | Readonly<{type: "observe-frame"; frame: number}>
  | Readonly<{type: "continue"; input: ActivationInput}>
  | Readonly<{type: "open-help"; input: ActivationInput}>
  | Readonly<{type: "close-help"; input: ActivationInput}>
  | Readonly<{
      type: "choose";
      choiceId: string;
      input: ActivationInput;
      seed: number;
    }>
  | Readonly<{type: "dismiss-wrong"; input: ActivationInput}>
  | Readonly<{type: "right-feedback-finished"}>
  | Readonly<{type: "replay"; input: ActivationInput}>;

function blocked(
  state: AlgL09GuidedTutorialState,
  reason: string,
): AlgL09GuidedTutorialState {
  return {...state, blockedReason: reason};
}

function validFrame(
  behavior: AlgL09GuidedTutorialBehavior,
  frame: number,
) {
  return Number.isSafeInteger(frame) && frame >= 1 &&
    frame <= behavior.frameCount;
}

function activeStop(
  behavior: AlgL09GuidedTutorialBehavior,
  state: AlgL09GuidedTutorialState,
) {
  return behavior.stops.find((stop) => stop.id === state.activeStopId);
}

function resolved(
  state: AlgL09GuidedTutorialState,
  stopId: string,
) {
  return state.resolvedStopIds.includes(stopId)
    ? state.resolvedStopIds
    : Object.freeze([...state.resolvedStopIds, stopId]);
}

function resumeFromStop(
  behavior: AlgL09GuidedTutorialBehavior,
  state: AlgL09GuidedTutorialState,
): AlgL09GuidedTutorialState {
  const stop = activeStop(behavior, state);
  if (!stop || stop.resumeFrame === null) {
    return blocked(state, "active-stop-not-resumable");
  }
  return {
    ...state,
    phase: "playing",
    activeStopId: null,
    resolvedStopIds: resolved(state, stop.id),
    selectedChoiceId: null,
    quizTryCount: 0,
    mainFrame: stop.resumeFrame,
    mainPlaying: true,
    rightFeedbackBranch: null,
    blockedReason: null,
  };
}

export function assertAlgL09GuidedTutorialBehavior(
  behavior: AlgL09GuidedTutorialBehavior,
) {
  const stopFrames = behavior.stops.map((stop) => stop.frame);
  const terminal = behavior.stops.at(-1);
  if (behavior.stops.length !== 6 ||
    new Set(behavior.stops.map((stop) => stop.id)).size !== 6 ||
    stopFrames.some((frame, index) => !Number.isSafeInteger(frame) ||
      frame < 1 || frame > behavior.frameCount ||
      (index > 0 && frame <= stopFrames[index - 1])) ||
    behavior.stops.slice(0, -1).some((stop) =>
      stop.resumeFrame !== stop.frame + 1) ||
    terminal?.kind !== "terminal" || terminal.frame !== behavior.frameCount ||
    terminal.resumeFrame !== null ||
    behavior.stops.filter((stop) => stop.kind === "help-or-continue").length !==
      2 ||
    behavior.stops.filter((stop) => stop.kind === "quiz").length !== 1 ||
    behavior.options.length < 2 || behavior.options.length > 4 ||
    new Set(behavior.options.map((option) => option.id)).size !==
      behavior.options.length ||
    behavior.options.filter((option) => option.correct).length !== 1 ||
    behavior.options.find((option) => option.correct)?.id !==
      behavior.correctChoiceId) {
    throw new Error(`${behavior.animationId}: guided tutorial behavior invalid`);
  }
}

export function createAlgL09GuidedTutorialState():
AlgL09GuidedTutorialState {
  return {
    phase: "playing",
    activeStopId: null,
    resolvedStopIds: Object.freeze([]),
    selectedChoiceId: null,
    quizTryCount: 0,
    mainFrame: 1,
    mainPlaying: true,
    rightFeedbackBranch: null,
    replay: 0,
    blockedReason: null,
  };
}

export function reduceAlgL09GuidedTutorial(
  behavior: AlgL09GuidedTutorialBehavior,
  state: AlgL09GuidedTutorialState,
  event: AlgL09GuidedTutorialEvent,
): AlgL09GuidedTutorialState {
  switch (event.type) {
    case "observe-frame": {
      if (!validFrame(behavior, event.frame)) {
        return blocked(state, "frame-invalid");
      }
      if (state.phase !== "playing") return state;
      const stop = behavior.stops.find((candidate) =>
        candidate.frame === event.frame &&
        !state.resolvedStopIds.includes(candidate.id));
      if (!stop) return {...state, mainFrame: event.frame, mainPlaying: true,
        blockedReason: null};
      const phase: AlgL09GuidedPhase = stop.kind === "continue"
        ? "continue-stop"
        : stop.kind === "help-or-continue"
          ? "help-choice"
          : stop.kind === "quiz" ? "choosing" : "terminal";
      return {...state, phase, activeStopId: stop.id,
        mainFrame: stop.frame, mainPlaying: false, blockedReason: null};
    }
    case "continue":
      if (!isActivationInput(event.input)) {
        return blocked(state, "activation-input-unsupported");
      }
      return state.phase === "continue-stop" || state.phase === "help-choice"
        ? resumeFromStop(behavior, state)
        : blocked(state, "continue-disabled");
    case "open-help":
      if (!isActivationInput(event.input)) {
        return blocked(state, "activation-input-unsupported");
      }
      return state.phase === "help-choice"
        ? {...state, phase: "help-open", mainPlaying: false,
          blockedReason: null}
        : blocked(state, "help-disabled");
    case "close-help":
      if (!isActivationInput(event.input)) {
        return blocked(state, "activation-input-unsupported");
      }
      return state.phase === "help-open"
        ? {...state, phase: "help-choice", mainPlaying: false,
          blockedReason: null}
        : blocked(state, "help-not-open");
    case "choose": {
      if (!isActivationInput(event.input)) {
        return blocked(state, "activation-input-unsupported");
      }
      if (state.phase !== "choosing") {
        return blocked(state, "choice-disabled");
      }
      const choice = behavior.options.find((option) =>
        option.id === event.choiceId);
      if (!choice) return blocked(state, "choice-unknown");
      if (choice.correct) {
        const feedback = selectHostFeedback("right", event.seed);
        return {...state, phase: "right-feedback",
          selectedChoiceId: choice.id, mainPlaying: false,
          rightFeedbackBranch: feedback.branchIndex as 1 | 2 | 3 | 4,
          blockedReason: null};
      }
      const second = state.quizTryCount >= 1;
      return {...state,
        phase: second ? "wrong-feedback-2" : "wrong-feedback-1",
        selectedChoiceId: choice.id, quizTryCount: second ? 2 : 1,
        mainPlaying: false, rightFeedbackBranch: null, blockedReason: null};
    }
    case "dismiss-wrong":
      if (!isActivationInput(event.input)) {
        return blocked(state, "activation-input-unsupported");
      }
      if (state.phase === "wrong-feedback-1") {
        return {...state, phase: "choosing", selectedChoiceId: null,
          mainPlaying: false, blockedReason: null};
      }
      return state.phase === "wrong-feedback-2"
        ? resumeFromStop(behavior, state)
        : blocked(state, "wrong-feedback-not-active");
    case "right-feedback-finished":
      return state.phase === "right-feedback"
        ? resumeFromStop(behavior, state)
        : blocked(state, "right-feedback-not-active");
    case "replay":
      if (!isActivationInput(event.input)) {
        return blocked(state, "activation-input-unsupported");
      }
      return {...createAlgL09GuidedTutorialState(), replay: state.replay + 1};
  }
}
