import type {ActivationInput} from "./g678-advanced-manual/contracts";
import {isActivationInput} from "./g678-advanced-manual/contracts";
import {
  selectHostFeedback,
  type HostFeedbackKind,
} from "./g678-advanced-manual/host-feedback-selector";

export type Ts07AnswerOrdinal = 1 | 2 | 3 | 4;
export type Ts07AnswerInstanceName = `AnsBtn${Ts07AnswerOrdinal}`;
export type Ts07WrongFeedbackName = `Mc_Wrong_Feed${1 | 2 | 3}`;
export type Ts07RightFeedbackName = `Mc_Right_Feed${1 | 2 | 3 | 4}`;
export type Ts07FeedbackName = Ts07WrongFeedbackName | Ts07RightFeedbackName;

export interface Ts07AnswerConfig {
  readonly ordinal: Ts07AnswerOrdinal;
  readonly instanceName: Ts07AnswerInstanceName;
  readonly sourceVisualOrder: Ts07AnswerOrdinal;
  readonly sourceCharacterId: number;
  readonly label: Readonly<{en: string; es: string}>;
  readonly result: "right" | "wrong";
}

export interface Ts07FeedbackDomainConfig {
  readonly instanceName: Ts07FeedbackName;
  readonly sourceObjectId: number;
  readonly frameDomain: string;
  readonly frameCount: number;
  readonly terminalFrame: number;
  readonly activeAtQuizStop: boolean;
  readonly kind: HostFeedbackKind;
}

export interface Ts07AssessmentConfig {
  readonly animationId: string;
  readonly quizStopFrame: number;
  readonly resumeFrame: number;
  readonly terminalFrame: number;
  readonly answers: readonly Ts07AnswerConfig[];
  readonly feedbackDomains: readonly Ts07FeedbackDomainConfig[];
}

export interface Ts07ActiveFeedback {
  readonly instanceName: Ts07FeedbackName;
  readonly kind: HostFeedbackKind;
  readonly branchIndex: number;
  readonly branchCount: 3 | 4;
  readonly frameDomain: string;
  readonly frameCount: number;
  readonly terminalFrame: number;
  readonly authoritativeAdobeRandomStateAccepted: false;
}

export interface Ts07AssessmentState {
  readonly phase: "selecting" | "hint-open" | "feedback-active" | "resumed";
  readonly quizTryCount: 0 | 1;
  readonly quizSection: boolean;
  readonly mainFrame: number;
  readonly mainPlaying: boolean;
  readonly selectedAnswer: Ts07AnswerOrdinal | null;
  readonly activeFeedback: Ts07ActiveFeedback | null;
  readonly answerControlsEnabled: boolean;
  readonly hintControlEnabled: boolean;
  readonly replay: number;
  readonly blockedReason: string | null;
}

export type Ts07AssessmentEvent =
  | Readonly<{
      type: "choose-answer";
      answerOrdinal: Ts07AnswerOrdinal;
      input: ActivationInput;
      seed: number;
    }>
  | Readonly<{type: "feedback-finished"}>
  | Readonly<{type: "open-hint"; input: ActivationInput}>
  | Readonly<{type: "close-hint"; input: ActivationInput}>
  | Readonly<{type: "replay"; input: ActivationInput}>;

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function validPositiveInteger(value: number) {
  return Number.isSafeInteger(value) && value > 0;
}

export function validateTs07AssessmentConfig(
  config: Ts07AssessmentConfig,
): Readonly<Ts07AssessmentConfig> {
  invariant(
    /^shared-(?:nms002|geo001|alg001|dat001)-l\d{2}-p\d{3}$/.test(
      config.animationId,
    ),
    "TS07 assessment animation ID is invalid",
  );
  invariant(
    validPositiveInteger(config.quizStopFrame) &&
      config.resumeFrame === config.quizStopFrame + 1 &&
      config.terminalFrame >= config.resumeFrame,
    `${config.animationId} has an invalid quiz stop/resume domain`,
  );
  invariant(
    config.answers.length === 4 &&
      new Set(config.answers.map((answer) => answer.sourceVisualOrder)).size === 4 &&
      config.answers.every(
        (answer, index) =>
          answer.ordinal === index + 1 &&
          answer.instanceName === `AnsBtn${answer.ordinal}` &&
          validPositiveInteger(answer.sourceVisualOrder) &&
          answer.sourceVisualOrder <= 4 &&
          validPositiveInteger(answer.sourceCharacterId) &&
          answer.label.en.trim().length > 0 &&
          answer.label.es.trim().length > 0,
      ) &&
      config.answers.filter((answer) => answer.result === "right").length === 1,
    `${config.animationId} must define four ordered answers and one right outcome`,
  );
  const wrong = config.feedbackDomains.filter((domain) => domain.kind === "wrong");
  const right = config.feedbackDomains.filter((domain) => domain.kind === "right");
  invariant(
    config.feedbackDomains.length === 7 &&
      wrong.length === 3 &&
      right.length === 4 &&
      wrong.every(
        (domain, index) => domain.instanceName === `Mc_Wrong_Feed${index + 1}`,
      ) &&
      right.every(
        (domain, index) => domain.instanceName === `Mc_Right_Feed${index + 1}`,
      ) &&
      config.feedbackDomains.every(
        (domain) =>
          validPositiveInteger(domain.sourceObjectId) &&
          /^sprite-\d+$/.test(domain.frameDomain) &&
          validPositiveInteger(domain.frameCount) &&
          validPositiveInteger(domain.terminalFrame) &&
          domain.terminalFrame <= domain.frameCount,
      ),
    `${config.animationId} must bind exact 3-wrong/4-right source domains`,
  );
  return Object.freeze({
    ...config,
    answers: Object.freeze(config.answers.map((answer) => Object.freeze({
      ...answer,
      label: Object.freeze({...answer.label}),
    }))),
    feedbackDomains: Object.freeze(
      config.feedbackDomains.map((domain) => Object.freeze({...domain})),
    ),
  });
}

export function createTs07AssessmentState(
  config: Ts07AssessmentConfig,
): Ts07AssessmentState {
  const checked = validateTs07AssessmentConfig(config);
  return {
    phase: "selecting",
    quizTryCount: 0,
    quizSection: true,
    mainFrame: checked.quizStopFrame,
    mainPlaying: false,
    selectedAnswer: null,
    activeFeedback: null,
    answerControlsEnabled: true,
    hintControlEnabled: true,
    replay: 0,
    blockedReason: null,
  };
}

function blocked(
  state: Ts07AssessmentState,
  blockedReason: string,
): Ts07AssessmentState {
  return {...state, blockedReason};
}

export function reduceTs07Assessment(
  config: Ts07AssessmentConfig,
  state: Ts07AssessmentState,
  event: Ts07AssessmentEvent,
): Ts07AssessmentState {
  const checked = validateTs07AssessmentConfig(config);
  switch (event.type) {
    case "open-hint":
      if (!isActivationInput(event.input)) {
        return blocked(state, "activation-input-unsupported");
      }
      if (state.phase !== "selecting" || !state.hintControlEnabled) {
        return blocked(state, "hint-control-disabled");
      }
      return {...state, phase: "hint-open", answerControlsEnabled: false,
        hintControlEnabled: false, blockedReason: null};
    case "close-hint":
      if (!isActivationInput(event.input)) {
        return blocked(state, "activation-input-unsupported");
      }
      if (state.phase !== "hint-open") return blocked(state, "hint-not-open");
      return {...state, phase: "selecting", answerControlsEnabled: true,
        hintControlEnabled: true, blockedReason: null};
    case "choose-answer": {
      if (!isActivationInput(event.input)) {
        return blocked(state, "activation-input-unsupported");
      }
      if (state.phase !== "selecting" || !state.answerControlsEnabled) {
        return blocked(state, "answer-controls-disabled");
      }
      const answer = checked.answers.find(
        (candidate) => candidate.ordinal === event.answerOrdinal,
      );
      if (!answer) return blocked(state, "answer-ordinal-unknown");
      const kind: HostFeedbackKind =
        answer.result === "right" ? "right" : "wrong";
      const selection = selectHostFeedback(kind, event.seed);
      const domain = checked.feedbackDomains.find(
        (candidate) => candidate.instanceName === selection.instanceName,
      );
      if (!domain) return blocked(state, "feedback-domain-unknown");
      if (!domain.activeAtQuizStop) {
        return blocked(state, "feedback-domain-inactive-at-quiz-stop");
      }
      return {
        ...state,
        phase: "feedback-active",
        selectedAnswer: answer.ordinal,
        activeFeedback: {
          instanceName: domain.instanceName,
          kind,
          branchIndex: selection.branchIndex,
          branchCount: selection.cardinality,
          frameDomain: domain.frameDomain,
          frameCount: domain.frameCount,
          terminalFrame: domain.terminalFrame,
          authoritativeAdobeRandomStateAccepted: false,
        },
        answerControlsEnabled: false,
        hintControlEnabled: false,
        blockedReason: null,
      };
    }
    case "feedback-finished": {
      if (state.phase !== "feedback-active" || !state.activeFeedback) {
        return blocked(state, "feedback-not-active");
      }
      if (state.activeFeedback.kind === "right" || state.quizTryCount === 1) {
        return {
          ...state,
          phase: "resumed",
          quizTryCount: 0,
          quizSection: false,
          mainFrame: checked.resumeFrame,
          mainPlaying: true,
          activeFeedback: null,
          answerControlsEnabled: false,
          hintControlEnabled: false,
          blockedReason: null,
        };
      }
      return {
        ...state,
        phase: "selecting",
        quizTryCount: 1,
        selectedAnswer: null,
        activeFeedback: null,
        answerControlsEnabled: true,
        hintControlEnabled: true,
        blockedReason: null,
      };
    }
    case "replay":
      if (!isActivationInput(event.input)) {
        return blocked(state, "activation-input-unsupported");
      }
      return {...createTs07AssessmentState(checked), replay: state.replay + 1};
  }
}
