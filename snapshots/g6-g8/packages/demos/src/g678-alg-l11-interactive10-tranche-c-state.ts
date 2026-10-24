import {isActivationInput, type ActivationInput} from
  "./g678-advanced-manual/contracts";
import {selectHostFeedback} from
  "./g678-advanced-manual/host-feedback-selector";
import type {LessonHostDecision, LessonHostRequest} from
  "./lesson-host-contract";
import {
  G678_ALG_L11_INTERACTIVE10_TRANCHE_C_CHOICE_HELP,
  type AlgL11Interactive10ChoicePage,
} from "./g678-alg-l11-interactive10-tranche-c-core";

export type AlgL11Interactive10ChoiceSlot = "A" | "B" | "C" | "D";

export interface AlgL11Interactive10ChoiceState {
  readonly selected: AlgL11Interactive10ChoiceSlot | null;
  readonly wrongAttempt: 0 | 1 | 2;
  readonly sourceTryCount: number;
  readonly phase: "choosing" | "right-feedback" | "wrong-feedback" |
    "complete";
  readonly feedbackText: string | null;
  readonly feedbackBranchIndex: number | null;
  readonly feedbackBranchCount: 3 | 4 | null;
  readonly hostFeedbackStatus: "idle" | "allowed" | "blocked";
  readonly hostResetStatus: "idle" | "allowed" | "blocked";
  readonly helpOpen: boolean;
  readonly replay: number;
  readonly blockedReason: string | null;
}

export type AlgL11Interactive10ChoiceEvent =
  | Readonly<{type: "select"; slot: AlgL11Interactive10ChoiceSlot;
      input: ActivationInput; seed: number}>
  | Readonly<{type: "dismiss-feedback"; input: ActivationInput;
      resetStatus: "allowed" | "blocked"}>
  | Readonly<{type: "open-help"; input: ActivationInput}>
  | Readonly<{type: "close-help"; input: ActivationInput}>
  | Readonly<{type: "host-result"; status: "allowed" | "blocked"}>
  | Readonly<{type: "replay"; input: ActivationInput}>;

export function createAlgL11Interactive10ChoiceState(
  replay = 0,
): AlgL11Interactive10ChoiceState {
  return {selected: null, wrongAttempt: 0, sourceTryCount: 0,
    phase: "choosing", feedbackText: null, feedbackBranchIndex: null,
    feedbackBranchCount: null, hostFeedbackStatus: "idle", replay,
    hostResetStatus: "idle", helpOpen: false, blockedReason: null};
}

export function buildAlgL11Interactive10PracticeFeedbackRequest(
  animationId: string,
  outcome: "correct" | "incorrect",
  branchIndex: number,
  branchCount: 3 | 4,
): Extract<LessonHostRequest, {type: "record-practice-feedback"}> {
  if (!/^shared-alg001-l11-p\d{3}$/u.test(animationId) ||
    !Number.isSafeInteger(branchIndex) || branchIndex < 1 ||
    branchIndex > branchCount) {
    throw new Error("ALG L11 practice feedback request is invalid");
  }
  return Object.freeze({type: "record-practice-feedback" as const,
    interactionId: animationId, outcome, branchIndex, branchCount});
}

export function buildAlgL11Interactive10PracticeFeedbackResetRequest(
  animationId: string,
): Extract<LessonHostRequest, {type: "reset-practice-feedback"}> {
  if (!/^shared-alg001-l11-p\d{3}$/u.test(animationId)) {
    throw new Error("ALG L11 practice feedback reset request is invalid");
  }
  return Object.freeze({type: "reset-practice-feedback" as const,
    interactionId: animationId});
}

export function resolveAlgL11Interactive10PracticeFeedbackResetStatus(
  decision: Readonly<{status: LessonHostDecision["status"]}> | undefined | void,
): "allowed" | "blocked" {
  return decision?.status === "allowed" ? "allowed" : "blocked";
}

export function reduceAlgL11Interactive10Choice(
  config: AlgL11Interactive10ChoicePage,
  state: AlgL11Interactive10ChoiceState,
  event: AlgL11Interactive10ChoiceEvent,
): AlgL11Interactive10ChoiceState {
  if (event.type === "host-result") {
    return state.phase === "right-feedback" || state.phase === "wrong-feedback"
      ? {...state, hostFeedbackStatus: event.status, blockedReason: null}
      : {...state, hostFeedbackStatus: "blocked",
        blockedReason: "feedback-not-active"};
  }
  if (!isActivationInput(event.input)) {
    return {...state, blockedReason: "activation-input-unsupported"};
  }
  if (event.type === "replay") {
    return createAlgL11Interactive10ChoiceState(state.replay + 1);
  }
  if (event.type === "open-help") {
    const sourceHelpAvailable = Object.hasOwn(
      G678_ALG_L11_INTERACTIVE10_TRANCHE_C_CHOICE_HELP,
      config.animationId);
    return sourceHelpAvailable && state.phase === "choosing" && !state.helpOpen
      ? {...state, helpOpen: true, blockedReason: null}
      : {...state, blockedReason: "help-unavailable"};
  }
  if (event.type === "close-help") {
    return state.helpOpen
      ? {...state, helpOpen: false, blockedReason: null}
      : {...state, blockedReason: "help-not-open"};
  }
  if (event.type === "dismiss-feedback") {
    if (event.resetStatus !== "allowed") {
      return {...state, hostFeedbackStatus: "blocked",
        hostResetStatus: "blocked",
        blockedReason: "practice-feedback-reset-blocked"};
    }
    if (state.phase === "right-feedback") {
      return {...state, phase: "complete", feedbackText: null,
        sourceTryCount: 0, hostFeedbackStatus: "idle",
        hostResetStatus: "allowed", blockedReason: null};
    }
    if (state.phase !== "wrong-feedback" || state.wrongAttempt < 1) {
      return {...state, blockedReason: "feedback-not-active"};
    }
    const sourceAttempt = config.sourceContract.literalTwoAttemptSequence[
      state.wrongAttempt - 1];
    return sourceAttempt.resumesParent
      ? {...state, phase: "complete", feedbackText: null,
        sourceTryCount: sourceAttempt.afterFeedbackEndpoint,
        hostFeedbackStatus: "idle", hostResetStatus: "allowed",
        blockedReason: null}
      : {...state, phase: "choosing", selected: null, feedbackText: null,
        sourceTryCount: sourceAttempt.afterFeedbackEndpoint,
        hostFeedbackStatus: "idle", hostResetStatus: "allowed",
        blockedReason: null};
  }
  if (state.phase !== "choosing" || state.helpOpen) {
    return {...state, blockedReason: "choice-disabled-during-feedback"};
  }
  const option = config.sourceContract.optionSlots.find((candidate) =>
    candidate.slot === event.slot);
  if (!option?.present) {
    return {...state, blockedReason: "source-option-absent"};
  }
  const feedback = selectHostFeedback(option.correct ? "right" : "wrong",
    event.seed + state.replay + state.wrongAttempt);
  if (option.correct) {
    return {...state, selected: event.slot, phase: "right-feedback",
      feedbackText: "Correct.", feedbackBranchIndex: feedback.branchIndex,
      feedbackBranchCount: feedback.cardinality, hostFeedbackStatus: "idle",
      hostResetStatus: "idle",
      blockedReason: null};
  }
  const wrongAttempt = Math.min(2, state.wrongAttempt + 1) as 1 | 2;
  const sourceAttempt = config.sourceContract.literalTwoAttemptSequence[
    wrongAttempt - 1];
  return {...state, selected: event.slot, wrongAttempt,
    sourceTryCount: sourceAttempt.afterSelection, phase: "wrong-feedback",
    feedbackText: sourceAttempt.text,
    feedbackBranchIndex: feedback.branchIndex,
    feedbackBranchCount: feedback.cardinality, hostFeedbackStatus: "idle",
    hostResetStatus: "idle",
    blockedReason: null};
}

export interface AlgL11Interactive10RandomState {
  readonly selectedLabel: "S1" | "S2" | "S3" | "S4";
  readonly selectedAnswer: "Opt_1" | "Opt_2" | null;
  readonly phase: "choosing" | "right-feedback" | "wrong-feedback";
  readonly replay: number;
  readonly audioPlayed: false;
  readonly blockedReason: string | null;
}

function deterministicRandomIndex(seed: number, replay: number) {
  const value = (Math.imul(Number.isSafeInteger(seed) ? seed : 0, 1664525) +
    Math.imul(replay + 1, 1013904223)) >>> 0;
  return value % 4;
}

export function createAlgL11Interactive10RandomState(seed: number,
  replay = 0): AlgL11Interactive10RandomState {
  const labels = ["S1", "S2", "S3", "S4"] as const;
  return {selectedLabel: labels[deterministicRandomIndex(seed, replay)],
    selectedAnswer: null, phase: "choosing", replay, audioPlayed: false,
    blockedReason: null};
}

export function reduceAlgL11Interactive10Random(
  state: AlgL11Interactive10RandomState,
  event: Readonly<{type: "select"; option: "Opt_1" | "Opt_2";
    input: ActivationInput}> | Readonly<{type: "replay";
      input: ActivationInput; seed: number}>,
): AlgL11Interactive10RandomState {
  if (!isActivationInput(event.input)) {
    return {...state, blockedReason: "activation-input-unsupported"};
  }
  if (event.type === "replay") {
    return createAlgL11Interactive10RandomState(event.seed, state.replay + 1);
  }
  return {...state, selectedAnswer: event.option,
    phase: event.option === "Opt_1" ? "right-feedback" : "wrong-feedback",
    audioPlayed: false, blockedReason: null};
}

export interface AlgL11Interactive10TwoTryState {
  readonly phase: "ready" | "feedback-stopped" | "parent-transition" |
    "complete" | "help-open";
  readonly nestedFrame: 1 | 64 | 65 | 70;
  readonly tryCount: 0 | 1 | 2;
  readonly replay: number;
  readonly helpReturnPhase: "ready" | "feedback-stopped" | "complete" | null;
  readonly originalRuntimeParentBindingEstablished: false;
  readonly maintainedLocalParentTransition: true;
  readonly blockedReason: string | null;
}

export function createAlgL11Interactive10TwoTryState(
  replay = 0,
): AlgL11Interactive10TwoTryState {
  return {phase: "ready", nestedFrame: 1, tryCount: 0, replay,
    helpReturnPhase: null, originalRuntimeParentBindingEstablished: false,
    maintainedLocalParentTransition: true, blockedReason: null};
}

export type AlgL11Interactive10TwoTryEvent =
  | Readonly<{type: "open-feedback"; input: ActivationInput}>
  | Readonly<{type: "close-popup"; input: ActivationInput}>
  | Readonly<{type: "advance-local-parent"; input: ActivationInput}>
  | Readonly<{type: "open-help"; input: ActivationInput}>
  | Readonly<{type: "close-help"; input: ActivationInput}>
  | Readonly<{type: "replay"; input: ActivationInput}>;

export function reduceAlgL11Interactive10TwoTry(
  state: AlgL11Interactive10TwoTryState,
  event: AlgL11Interactive10TwoTryEvent,
): AlgL11Interactive10TwoTryState {
  if (!isActivationInput(event.input)) {
    return {...state, blockedReason: "activation-input-unsupported"};
  }
  if (event.type === "replay") {
    return createAlgL11Interactive10TwoTryState(state.replay + 1);
  }
  if (event.type === "open-help") {
    if (state.phase === "parent-transition" || state.phase === "help-open") {
      return {...state, blockedReason: "help-unavailable"};
    }
    return {...state, phase: "help-open",
      helpReturnPhase: state.phase as "ready" | "feedback-stopped" | "complete",
      blockedReason: null};
  }
  if (event.type === "close-help") {
    return state.phase === "help-open" && state.helpReturnPhase
      ? {...state, phase: state.helpReturnPhase, helpReturnPhase: null,
        blockedReason: null}
      : {...state, blockedReason: "help-not-open"};
  }
  if (event.type === "open-feedback") {
    return state.phase === "ready"
      ? {...state, phase: "feedback-stopped", nestedFrame: 64,
        blockedReason: null}
      : {...state, blockedReason: "feedback-unavailable"};
  }
  if (event.type === "close-popup") {
    return state.phase === "feedback-stopped"
      ? {...state, phase: "parent-transition", nestedFrame: 65,
        blockedReason: null}
      : {...state, blockedReason: "feedback-not-stopped"};
  }
  if (state.phase !== "parent-transition") {
    return {...state, blockedReason: "local-parent-transition-not-requested"};
  }
  const nextTry = Math.min(2, state.tryCount + 1) as 1 | 2;
  return nextTry === 2
    ? {...state, phase: "complete", nestedFrame: 70, tryCount: 2,
      blockedReason: null}
    : {...state, phase: "ready", nestedFrame: 1, tryCount: 1,
      blockedReason: null};
}
