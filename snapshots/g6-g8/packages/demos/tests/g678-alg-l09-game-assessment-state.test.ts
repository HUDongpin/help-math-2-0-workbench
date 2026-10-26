import assert from "node:assert/strict";
import test from "node:test";

import {
  ALG_L09_FQ02_ANSWER_KEY,
  assertAlgL09MatchingCards,
  assertAlgL09FinalAssessmentQuestions,
  createAlgL09FinalAssessmentState,
  createAlgL09GameControllerState,
  createAlgL09MatchingGameState,
  reduceAlgL09FinalAssessment,
  reduceAlgL09GameController,
  reduceAlgL09MatchingGame,
  selectAlgL09FinalAssessmentQuestions,
  type AlgL09MatchingCard,
  type AlgL09FinalAssessmentQuestion,
} from "../src/g678-alg-l09-game-assessment";

const cards: readonly AlgL09MatchingCard[] = Object.freeze(
  Array.from({length: 6}, (_, index) => [1, 2].map((side) => Object.freeze({
    id: `pair-${index + 1}-${side}`,
    pairId: (index + 1) as 1 | 2 | 3 | 4 | 5 | 6,
    side: side as 1 | 2,
    sourceCharacterId: 100 + index * 2 + side,
    sourceInstanceName: `Mc${index + 1}_${side}`,
    label: `${index + 1}:${index + 2}`,
    equivalenceKey: `${index + 1}:${index + 2}`,
    sourceTextIds: [100 + index * 2 + side],
  }))).flat(),
);

const questions: readonly AlgL09FinalAssessmentQuestion[] = Object.freeze(
  Array.from({length: 24}, (_, index) => {
    const choiceCount = index >= 12 && index <= 19 ? 2 : 4;
    return Object.freeze({questionNumber: index + 1,
      prompt: `Source question ${index + 1}`,
      supportingData: Object.freeze([]),
      choices: Object.freeze(Array.from({length: choiceCount},
        (_item, choice) => `Choice ${choice + 1}`)),
      correctOption: ALG_L09_FQ02_ANSWER_KEY[index],
      sourceTextIds: Object.freeze(Array.from({length: choiceCount + 1},
        (_item, text) => 1_000 + index * 10 + text)),
    });
  }),
);

test("game controller requires one source level before typed navigation", () => {
  let state = createAlgL09GameControllerState();
  state = reduceAlgL09GameController(state, {type: "start", input: "mouse"});
  assert.equal(state.blockedReason, "level-required");
  state = reduceAlgL09GameController(state,
    {type: "select-level", level: 2, input: "Enter"});
  state = reduceAlgL09GameController(state, {type: "start", input: "mouse"});
  assert.deepEqual({level: state.level, start: state.startRequested},
    {level: 2, start: true});
  state = reduceAlgL09GameController(state, {type: "replay", input: "mouse"});
  assert.deepEqual({level: state.level, start: state.startRequested,
    replay: state.replay}, {level: null, start: false, replay: 1});
});

test("matching game preserves source +10/-2 scoring and exact pairs", () => {
  assert.doesNotThrow(() => assertAlgL09MatchingCards(cards));
  let state = createAlgL09MatchingGameState(1);
  state = reduceAlgL09MatchingGame(cards, state,
    {type: "select-card", cardId: "pair-1-1", input: "mouse"});
  state = reduceAlgL09MatchingGame(cards, state,
    {type: "select-card", cardId: "pair-2-2", input: "Enter"});
  assert.deepEqual({phase: state.phase, score: state.score},
    {phase: "wrong-feedback", score: -2});
  state = reduceAlgL09MatchingGame(cards, state,
    {type: "dismiss-feedback", input: "mouse"});
  state = reduceAlgL09MatchingGame(cards, state,
    {type: "select-card", cardId: "pair-1-1", input: "mouse"});
  state = reduceAlgL09MatchingGame(cards, state,
    {type: "select-card", cardId: "pair-1-2", input: "mouse"});
  assert.deepEqual({phase: state.phase, score: state.score,
    matched: state.matchedPairIds},
  {phase: "correct-feedback", score: 8, matched: [1]});
  state = reduceAlgL09MatchingGame(cards, state,
    {type: "replay", input: "mouse"});
  assert.deepEqual({phase: state.phase, score: state.score,
    matched: state.matchedPairIds, replay: state.replay},
  {phase: "choosing", score: 0, matched: [], replay: 1});
});

test("final assessment deterministically selects ten unique questions", () => {
  const first = selectAlgL09FinalAssessmentQuestions(17);
  assert.equal(first.length, 10);
  assert.equal(new Set(first).size, 10);
  assert.deepEqual(first, selectAlgL09FinalAssessmentQuestions(17));
  assert.notDeepEqual(first, selectAlgL09FinalAssessmentQuestions(18));
  assert.equal(ALG_L09_FQ02_ANSWER_KEY.length, 24);
  assert.doesNotThrow(() => assertAlgL09FinalAssessmentQuestions(questions));
});

test("final assessment scores ten responses and exposes source review", () => {
  const seed = 29;
  let state = createAlgL09FinalAssessmentState(seed, questions);
  for (const question of state.questionNumbers) {
    state = reduceAlgL09FinalAssessment(state, {type: "answer",
      option: ALG_L09_FQ02_ANSWER_KEY[question - 1], input: "Enter"}, seed,
    questions);
  }
  assert.equal(state.phase, "results");
  assert.equal(state.responses.length, 10);
  assert.equal(state.responses.every((response) => response.correct), true);
  state = reduceAlgL09FinalAssessment(state,
    {type: "begin-review", input: "mouse"}, seed, questions);
  assert.equal(state.phase, "review");
  state = reduceAlgL09FinalAssessment(state,
    {type: "next-review", input: "mouse"}, seed, questions);
  assert.equal(state.reviewIndex, 1);
  state = reduceAlgL09FinalAssessment(state,
    {type: "replay", input: "mouse"}, seed, questions);
  assert.deepEqual({phase: state.phase, responses: state.responses.length,
    replay: state.replay}, {phase: "answering", responses: 0, replay: 1});
});

test("two-choice source questions reject invented C/D answers", () => {
  let seed = 0;
  while (selectAlgL09FinalAssessmentQuestions(seed)[0] !== 13) seed += 1;
  const state = createAlgL09FinalAssessmentState(seed, questions);
  const blocked = reduceAlgL09FinalAssessment(state,
    {type: "answer", option: 3, input: "mouse"}, seed, questions);
  assert.equal(blocked.blockedReason, "answer-invalid");
  assert.equal(blocked.responses.length, 0);
});
