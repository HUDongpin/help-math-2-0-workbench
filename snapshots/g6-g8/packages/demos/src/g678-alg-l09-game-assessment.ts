import type {ActivationInput} from "./g678-advanced-manual/contracts";
import {isActivationInput} from "./g678-advanced-manual/contracts";

export type AlgL09GameLevel = 1 | 2;

export interface AlgL09GameControllerState {
  readonly level: AlgL09GameLevel | null;
  readonly startRequested: boolean;
  readonly replay: number;
  readonly blockedReason: string | null;
}

export type AlgL09GameControllerEvent =
  | Readonly<{type: "select-level"; level: AlgL09GameLevel;
      input: ActivationInput}>
  | Readonly<{type: "start"; input: ActivationInput}>
  | Readonly<{type: "replay"; input: ActivationInput}>;

export function createAlgL09GameControllerState(): AlgL09GameControllerState {
  return {level: null, startRequested: false, replay: 0,
    blockedReason: null};
}

export function reduceAlgL09GameController(
  state: AlgL09GameControllerState,
  event: AlgL09GameControllerEvent,
): AlgL09GameControllerState {
  if (!isActivationInput(event.input)) {
    return {...state, blockedReason: "activation-input-unsupported"};
  }
  if (event.type === "replay") {
    return {...createAlgL09GameControllerState(), replay: state.replay + 1};
  }
  if (event.type === "select-level") {
    return {...state, level: event.level, startRequested: false,
      blockedReason: null};
  }
  return state.level === null
    ? {...state, blockedReason: "level-required"}
    : {...state, startRequested: true, blockedReason: null};
}

export interface AlgL09MatchingCard {
  readonly id: string;
  readonly pairId: 1 | 2 | 3 | 4 | 5 | 6;
  readonly side: 1 | 2;
  readonly sourceCharacterId: number;
  readonly sourceInstanceName: string;
  readonly label: string;
  readonly equivalenceKey: string;
  readonly sourceTextIds: readonly number[];
}

export interface AlgL09MatchingGameState {
  readonly level: AlgL09GameLevel;
  readonly selectedCardId: string | null;
  readonly matchedPairIds: readonly number[];
  readonly score: number;
  readonly phase: "choosing" | "correct-feedback" | "wrong-feedback" |
    "complete";
  readonly replay: number;
  readonly blockedReason: string | null;
}

export type AlgL09MatchingGameEvent =
  | Readonly<{type: "select-card"; cardId: string; input: ActivationInput}>
  | Readonly<{type: "dismiss-feedback"; input: ActivationInput}>
  | Readonly<{type: "replay"; input: ActivationInput}>;

export function createAlgL09MatchingGameState(
  level: AlgL09GameLevel,
): AlgL09MatchingGameState {
  return {level, selectedCardId: null, matchedPairIds: Object.freeze([]),
    score: 0, phase: "choosing", replay: 0, blockedReason: null};
}

export function assertAlgL09MatchingCards(
  cards: readonly AlgL09MatchingCard[],
) {
  const ids = new Set(cards.map((card) => card.id));
  const characters = new Set(cards.map((card) => card.sourceCharacterId));
  if (cards.length !== 12 || ids.size !== 12 || characters.size !== 12 ||
    cards.some((card) => card.label.trim().length === 0 ||
      card.equivalenceKey.trim().length === 0 ||
      card.sourceTextIds.length < 1 ||
      card.sourceTextIds.some((textId) =>
        !Number.isSafeInteger(textId) || textId < 1)) ||
    [1, 2, 3, 4, 5, 6].some((pairId) =>
      cards.filter((card) => card.pairId === pairId).length !== 2 ||
      new Set(cards.filter((card) => card.pairId === pairId)
        .map((card) => card.side)).size !== 2 ||
      new Set(cards.filter((card) => card.pairId === pairId)
        .map((card) => card.equivalenceKey)).size !== 1)) {
    throw new Error("ALG L9 matching card contract is invalid");
  }
}

export function reduceAlgL09MatchingGame(
  cards: readonly AlgL09MatchingCard[],
  state: AlgL09MatchingGameState,
  event: AlgL09MatchingGameEvent,
): AlgL09MatchingGameState {
  assertAlgL09MatchingCards(cards);
  if (!isActivationInput(event.input)) {
    return {...state, blockedReason: "activation-input-unsupported"};
  }
  if (event.type === "replay") {
    return {...createAlgL09MatchingGameState(state.level),
      replay: state.replay + 1};
  }
  if (event.type === "dismiss-feedback") {
    return state.phase === "correct-feedback" || state.phase === "wrong-feedback"
      ? {...state, phase: state.matchedPairIds.length === 6
          ? "complete" : "choosing", selectedCardId: null,
        blockedReason: null}
      : {...state, blockedReason: "feedback-not-active"};
  }
  if (state.phase !== "choosing") {
    return {...state, blockedReason: "card-selection-disabled"};
  }
  const card = cards.find((candidate) => candidate.id === event.cardId);
  if (!card || state.matchedPairIds.includes(card.pairId)) {
    return {...state, blockedReason: "card-unavailable"};
  }
  if (state.selectedCardId === null) {
    return {...state, selectedCardId: card.id, blockedReason: null};
  }
  if (state.selectedCardId === card.id) {
    return {...state, blockedReason: "same-card-selected"};
  }
  const first = cards.find((candidate) =>
    candidate.id === state.selectedCardId);
  if (!first) return {...state, blockedReason: "selected-card-missing"};
  const correct = first.pairId === card.pairId && first.side !== card.side;
  const matchedPairIds = correct
    ? Object.freeze([...state.matchedPairIds, card.pairId].sort((a, b) => a - b))
    : state.matchedPairIds;
  return {...state, selectedCardId: correct ? null : state.selectedCardId,
    matchedPairIds, score: state.score + (correct ? 10 : -2),
    phase: correct ? "correct-feedback" : "wrong-feedback",
    blockedReason: null};
}

export const ALG_L09_FQ02_ANSWER_KEY = Object.freeze([
  1, 2, 3, 4, 3, 3, 4, 4, 3, 2, 4, 1,
  2, 2, 1, 1, 1, 1, 2, 2, 4, 3, 4, 3,
] as const);

export interface AlgL09FinalAssessmentQuestion {
  readonly questionNumber: number;
  readonly prompt: string;
  readonly supportingData: readonly string[];
  readonly choices: readonly string[];
  readonly correctOption: 1 | 2 | 3 | 4;
  readonly sourceTextIds: readonly number[];
}

export function assertAlgL09FinalAssessmentQuestions(
  questions: readonly AlgL09FinalAssessmentQuestion[],
) {
  if (questions.length !== 24 || questions.some((question, index) =>
    question.questionNumber !== index + 1 ||
    question.prompt.trim().length === 0 ||
    question.choices.length !== (index >= 12 && index <= 19 ? 2 : 4) ||
    question.choices.some((choice) => choice.trim().length === 0) ||
    question.correctOption !== ALG_L09_FQ02_ANSWER_KEY[index] ||
    question.correctOption > question.choices.length ||
    question.sourceTextIds.length < question.choices.length + 1 ||
    question.sourceTextIds.some((textId) =>
      !Number.isSafeInteger(textId) || textId < 1))) {
    throw new Error("ALG L9 final-assessment question contract is invalid");
  }
}

export interface AlgL09FinalAssessmentResponse {
  readonly questionNumber: number;
  readonly selectedOption: 1 | 2 | 3 | 4;
  readonly correctOption: 1 | 2 | 3 | 4;
  readonly correct: boolean;
}

export interface AlgL09FinalAssessmentState {
  readonly questionNumbers: readonly number[];
  readonly currentIndex: number;
  readonly responses: readonly AlgL09FinalAssessmentResponse[];
  readonly phase: "answering" | "results" | "review";
  readonly reviewIndex: number;
  readonly replay: number;
  readonly blockedReason: string | null;
}

export type AlgL09FinalAssessmentEvent =
  | Readonly<{type: "answer"; option: 1 | 2 | 3 | 4;
      input: ActivationInput}>
  | Readonly<{type: "begin-review"; input: ActivationInput}>
  | Readonly<{type: "next-review"; input: ActivationInput}>
  | Readonly<{type: "finish-review"; input: ActivationInput}>
  | Readonly<{type: "replay"; input: ActivationInput}>;

function nextRandom(state: number) {
  return (Math.imul(state, 1664525) + 1013904223) >>> 0;
}

export function selectAlgL09FinalAssessmentQuestions(seed: number) {
  const pool = Array.from({length: 24}, (_, index) => index + 1);
  let state = Number.isSafeInteger(seed) ? seed >>> 0 : 0;
  for (let index = pool.length - 1; index > 0; index -= 1) {
    state = nextRandom(state);
    const target = state % (index + 1);
    [pool[index], pool[target]] = [pool[target], pool[index]];
  }
  return Object.freeze(pool.slice(0, 10));
}

export function createAlgL09FinalAssessmentState(
  seed: number,
  questions: readonly AlgL09FinalAssessmentQuestion[],
): AlgL09FinalAssessmentState {
  assertAlgL09FinalAssessmentQuestions(questions);
  return {questionNumbers: selectAlgL09FinalAssessmentQuestions(seed),
    currentIndex: 0, responses: Object.freeze([]), phase: "answering",
    reviewIndex: 0, replay: 0, blockedReason: null};
}

export function reduceAlgL09FinalAssessment(
  state: AlgL09FinalAssessmentState,
  event: AlgL09FinalAssessmentEvent,
  seed: number,
  questions: readonly AlgL09FinalAssessmentQuestion[],
): AlgL09FinalAssessmentState {
  assertAlgL09FinalAssessmentQuestions(questions);
  if (!isActivationInput(event.input)) {
    return {...state, blockedReason: "activation-input-unsupported"};
  }
  if (event.type === "replay") {
    return {...createAlgL09FinalAssessmentState(seed, questions),
      replay: state.replay + 1};
  }
  if (event.type === "begin-review") {
    return state.phase === "results"
      ? {...state, phase: "review", reviewIndex: 0, blockedReason: null}
      : {...state, blockedReason: "results-not-ready"};
  }
  if (event.type === "next-review") {
    if (state.phase !== "review") {
      return {...state, blockedReason: "review-not-active"};
    }
    return {...state,
      reviewIndex: Math.min(state.reviewIndex + 1, state.responses.length - 1),
      blockedReason: null};
  }
  if (event.type === "finish-review") {
    return state.phase === "review" &&
      state.reviewIndex === state.responses.length - 1
      ? {...state, phase: "results", blockedReason: null}
      : {...state, blockedReason: "review-not-finished"};
  }
  if (state.phase !== "answering") {
    return {...state, blockedReason: "answering-complete"};
  }
  const questionNumber = state.questionNumbers[state.currentIndex];
  const question = questions[questionNumber - 1];
  const correctOption = question?.correctOption;
  if (!questionNumber || !correctOption || event.option < 1 ||
    event.option > question.choices.length) {
    return {...state, blockedReason: "answer-invalid"};
  }
  const response = Object.freeze({questionNumber,
    selectedOption: event.option, correctOption,
    correct: event.option === correctOption});
  const responses = Object.freeze([...state.responses, response]);
  const finished = responses.length === 10;
  return {...state, responses,
    currentIndex: finished ? state.currentIndex : state.currentIndex + 1,
    phase: finished ? "results" : "answering", blockedReason: null};
}
