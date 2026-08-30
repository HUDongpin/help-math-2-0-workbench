import assert from "node:assert/strict";
import test from "node:test";

import {
  COURSE_G04_L03_IN_008_INTERACTION_AUTHORITY,
  COURSE_G04_L03_IN_008_QUESTIONS,
  createCourseG04L03In008InteractionState,
  reduceCourseG04L03In008Interaction,
  type CourseG04L03In008InteractionState,
} from "../src/timelines/course-g04-l03-in-008-interaction";
import {COURSE_G04_L03_IN_008_SOURCE} from "../src/timelines/course-g04-l03-in-008";

const setInput = (
  state: CourseG04L03In008InteractionState,
  field: "first" | "second",
  value: string,
) => reduceCourseG04L03In008Interaction(state, {type: "set-input", field, value});

const newProblem = (state: CourseG04L03In008InteractionState) =>
  reduceCourseG04L03In008Interaction(state, {type: "new-problem"});

const questionSequence = (seed: number, count: number): number[] => {
  let state = createCourseG04L03In008InteractionState(seed);
  const sequence = [state.currentQuestionIndex];
  while (sequence.length < count) {
    state = newProblem(state);
    sequence.push(state.currentQuestionIndex);
  }
  return sequence;
};

test("IN008 interaction questions preserve all five exact source tuples and feedback strings", () => {
  assert.equal(COURSE_G04_L03_IN_008_QUESTIONS.length, 5);
  assert.deepEqual(
    COURSE_G04_L03_IN_008_QUESTIONS.map(
      ({label, answers, decrement, firstAnswer, secondAnswer, feedback}) => ({
        label,
        answers,
        decrement,
        firstAnswer,
        secondAnswer,
        feedback,
      }),
    ),
    [
      {
        label: "10, 5, 0, -5,",
        answers: "-10~-15",
        decrement: 5,
        firstAnswer: "-10",
        secondAnswer: "-15",
        feedback: "Each number decreases by 5. Try again!",
      },
      {
        label: "18, 9, 0, -9,",
        answers: "-18~-27",
        decrement: 9,
        firstAnswer: "-18",
        secondAnswer: "-27",
        feedback: "Each number decreases by 9. Try again!",
      },
      {
        label: "7, 5, 3, 1,",
        answers: "-1~-3",
        decrement: 2,
        firstAnswer: "-1",
        secondAnswer: "-3",
        feedback: "Each number decreases by 2. Try again!",
      },
      {
        label: "0, -10, -20, -30,",
        answers: "-40~-50",
        decrement: 10,
        firstAnswer: "-40",
        secondAnswer: "-50",
        feedback: "Each number decreases by 10. Try again!",
      },
      {
        label: "16, 12, 8, 4,",
        answers: "0~-4",
        decrement: 4,
        firstAnswer: "0",
        secondAnswer: "-4",
        feedback: "Each number decreases by 4. Try again!",
      },
    ],
  );
  assert.deepEqual(
    COURSE_G04_L03_IN_008_QUESTIONS.map(({label, answers, decrement}) => ({
      label,
      answers,
      decrement,
    })),
    COURSE_G04_L03_IN_008_SOURCE.quizSourceData,
  );
});

test("IN008 initial question keeps the existing normalized-seed modulo-five mapping", () => {
  for (const seed of [0, 1, 2, 3, 4, 5, 7, 12]) {
    const state = createCourseG04L03In008InteractionState(seed);
    assert.equal(state.currentQuestionIndex, (seed >>> 0) % 5);
    assert.equal(state.drawCount, 1);
    assert.equal(state.poolCycle, 1);
    assert.equal(state.remainingQuestionIndices.length, 4);
  }

  const negative = createCourseG04L03In008InteractionState(-1);
  assert.equal(negative.seed, 4_294_967_295);
  assert.equal(negative.currentQuestionIndex, 0);
  assert.equal(createCourseG04L03In008InteractionState(Number.NaN).seed, 0);
});

test("IN008 seed produces a reproducible without-replacement order and refills an empty pool", () => {
  const firstRun = questionSequence(7, 10);
  const secondRun = questionSequence(7, 10);
  assert.deepEqual(firstRun, secondRun);
  assert.deepEqual([...new Set(firstRun.slice(0, 5))].sort(), [0, 1, 2, 3, 4]);
  assert.deepEqual([...new Set(firstRun.slice(5, 10))].sort(), [0, 1, 2, 3, 4]);

  let state = createCourseG04L03In008InteractionState(7);
  for (let draw = 2; draw <= 5; draw += 1) state = newProblem(state);
  assert.equal(state.drawCount, 5);
  assert.equal(state.poolCycle, 1);
  assert.deepEqual(state.remainingQuestionIndices, []);

  state = newProblem(state);
  assert.equal(state.drawCount, 6);
  assert.equal(state.poolCycle, 2);
  assert.equal(state.remainingQuestionIndices.length, 4);
});

test("IN008 check uses strict strings and wrong locks both actions until Close", () => {
  let state = createCourseG04L03In008InteractionState(7);
  assert.equal(state.currentQuestionIndex, 2);
  state = setInput(state, "first", "-1 ");
  state = setInput(state, "second", "-3");
  const sequenceBeforeCheck = {
    rngState: state.rngState,
    drawCount: state.drawCount,
    remainingQuestionIndices: state.remainingQuestionIndices,
  };

  state = reduceCourseG04L03In008Interaction(state, {type: "check"});
  assert.equal(state.outcome, "wrong");
  assert.equal(state.inputsLocked, true);
  assert.equal(state.checkEnabled, false);
  assert.equal(state.newProblemEnabled, false);
  assert.equal(state.feedbackVisible, true);
  assert.equal(state.feedbackText, "Each number decreases by 2. Try again!");
  assert.equal(setInput(state, "first", "-1"), state);
  assert.equal(newProblem(state), state);
  assert.equal(
    reduceCourseG04L03In008Interaction(state, {type: "check"}),
    state,
  );

  const closed = reduceCourseG04L03In008Interaction(state, {
    type: "close-feedback",
  });
  assert.equal(closed.currentQuestionIndex, 2);
  assert.equal(closed.answerFirst, "");
  assert.equal(closed.answerSecond, "");
  assert.equal(closed.outcome, "ready");
  assert.equal(closed.inputsLocked, false);
  assert.equal(closed.checkEnabled, true);
  assert.equal(closed.newProblemEnabled, true);
  assert.equal(closed.feedbackVisible, false);
  assert.equal(closed.feedbackText, null);
  assert.equal(closed.rngState, sequenceBeforeCheck.rngState);
  assert.equal(closed.drawCount, sequenceBeforeCheck.drawCount);
  assert.deepEqual(
    closed.remainingQuestionIndices,
    sequenceBeforeCheck.remainingQuestionIndices,
  );
});

test("IN008 correct locks only inputs while Check and New Problem remain available", () => {
  let state = createCourseG04L03In008InteractionState(7);
  state = setInput(state, "first", "-1");
  state = setInput(state, "second", "-3");
  state = reduceCourseG04L03In008Interaction(state, {type: "check"});

  assert.equal(state.outcome, "correct");
  assert.equal(state.inputsLocked, true);
  assert.equal(state.checkEnabled, true);
  assert.equal(state.newProblemEnabled, true);
  assert.equal(state.feedbackVisible, false);
  assert.equal(state.feedbackText, null);
  assert.equal(setInput(state, "first", "changed"), state);
  assert.equal(
    reduceCourseG04L03In008Interaction(state, {type: "close-feedback"}),
    state,
  );

  const repeatedCheck = reduceCourseG04L03In008Interaction(state, {
    type: "check",
  });
  assert.equal(repeatedCheck.outcome, "correct");
  assert.equal(repeatedCheck.checkEnabled, true);

  const next = newProblem(state);
  assert.notEqual(next.currentQuestionIndex, state.currentQuestionIndex);
  assert.equal(next.drawCount, 2);
  assert.equal(next.answerFirst, "");
  assert.equal(next.answerSecond, "");
  assert.equal(next.outcome, "ready");
  assert.equal(next.inputsLocked, false);
});

test("IN008 Reset and Replay restore the full seed-bound state and sequence", () => {
  const initial = createCourseG04L03In008InteractionState(12);
  let changed = newProblem(newProblem(initial));
  changed = setInput(changed, "first", "wrong");
  changed = reduceCourseG04L03In008Interaction(changed, {type: "check"});

  const reset = reduceCourseG04L03In008Interaction(changed, {type: "reset"});
  const replay = reduceCourseG04L03In008Interaction(changed, {type: "replay"});
  assert.deepEqual(reset, initial);
  assert.deepEqual(replay, initial);

  const afterReset = questionSequence(reset.seed, 10);
  const fresh = questionSequence(initial.seed, 10);
  assert.deepEqual(afterReset, fresh);
});

test("IN008 interaction model is immutable and does not promote acceptance or audio claims", () => {
  const initial = createCourseG04L03In008InteractionState(7);
  const initialRemaining = [...initial.remainingQuestionIndices];
  const next = newProblem(initial);

  assert.equal(Object.isFrozen(initial), true);
  assert.equal(Object.isFrozen(initial.remainingQuestionIndices), true);
  assert.deepEqual(initial.remainingQuestionIndices, initialRemaining);
  assert.notEqual(next, initial);
  assert.equal(
    COURSE_G04_L03_IN_008_INTERACTION_AUTHORITY.deterministicQuestionOrderExecutesAvm1Random,
    false,
  );
  assert.equal(
    COURSE_G04_L03_IN_008_INTERACTION_AUTHORITY.feedbackAudioModeled,
    false,
  );
  assert.equal(
    COURSE_G04_L03_IN_008_INTERACTION_AUTHORITY.feedbackAudioParityEstablished,
    false,
  );
  assert.equal(
    COURSE_G04_L03_IN_008_INTERACTION_AUTHORITY.behaviorParityEstablished,
    false,
  );
  assert.equal(
    COURSE_G04_L03_IN_008_INTERACTION_AUTHORITY.replayParityEstablished,
    false,
  );
  assert.equal(COURSE_G04_L03_IN_008_INTERACTION_AUTHORITY.ownerAccepted, false);
  assert.equal(
    COURSE_G04_L03_IN_008_INTERACTION_AUTHORITY.strictMigrationComplete,
    false,
  );
  assert.equal(
    COURSE_G04_L03_IN_008_INTERACTION_AUTHORITY.strictAcceptanceEffect,
    "none",
  );
});
