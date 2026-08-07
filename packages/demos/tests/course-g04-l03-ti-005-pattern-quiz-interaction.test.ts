import assert from "node:assert/strict";
import test from "node:test";

import {
  COURSE_G04_L03_TI_005_INTERACTION_AUTHORITY,
  COURSE_G04_L03_TI_005_QUESTIONS,
  COURSE_G04_L03_TI_005_STAGE_GEOMETRY,
  createCourseG04L03Ti005InteractionState,
  reduceCourseG04L03Ti005Interaction,
  type CourseG04L03Ti005InteractionState,
} from "../src/timelines/course-g04-l03-ti-005-pattern-quiz-interaction";
import {COURSE_G04_L03_TI_005_SOURCE} from "../src/timelines/course-g04-l03-ti-005";

const setInput = (
  state: CourseG04L03Ti005InteractionState,
  field: "first" | "second",
  value: string,
) =>
  reduceCourseG04L03Ti005Interaction(state, {
    type: "set-input",
    field,
    value,
  });

const newProblem = (state: CourseG04L03Ti005InteractionState) =>
  reduceCourseG04L03Ti005Interaction(state, {type: "new-problem"});

const questionSequence = (seed: number, count: number): number[] => {
  let state = createCourseG04L03Ti005InteractionState(seed);
  const sequence = [state.currentQuestionIndex];
  while (sequence.length < count) {
    state = newProblem(state);
    sequence.push(state.currentQuestionIndex);
  }
  return sequence;
};

test("TI005 preserves all five exact source tuples and double-space feedback", () => {
  assert.equal(COURSE_G04_L03_TI_005_QUESTIONS.length, 5);
  assert.deepEqual(
    COURSE_G04_L03_TI_005_QUESTIONS.map(
      ({
        label,
        answers,
        decrement,
        firstAnswer,
        secondAnswer,
        feedback,
      }) => ({
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
        label: "-3, -5, -7, -9,",
        answers: "-11~-13",
        decrement: 2,
        firstAnswer: "-11",
        secondAnswer: "-13",
        feedback: "Each number decreases by 2.  Try again!",
      },
      {
        label: "16, 8, 0, -8,",
        answers: "-16~-24",
        decrement: 8,
        firstAnswer: "-16",
        secondAnswer: "-24",
        feedback: "Each number decreases by 8.  Try again!",
      },
      {
        label: "20, 10, 0, -10,",
        answers: "-20~-30",
        decrement: 10,
        firstAnswer: "-20",
        secondAnswer: "-30",
        feedback: "Each number decreases by 10.  Try again!",
      },
      {
        label: "-10, -15, -20, -25,",
        answers: "-30~-35",
        decrement: 5,
        firstAnswer: "-30",
        secondAnswer: "-35",
        feedback: "Each number decreases by 5.  Try again!",
      },
      {
        label: "9, 6, 3, 0,",
        answers: "-3~-6",
        decrement: 3,
        firstAnswer: "-3",
        secondAnswer: "-6",
        feedback: "Each number decreases by 3.  Try again!",
      },
    ],
  );
  assert.deepEqual(
    COURSE_G04_L03_TI_005_QUESTIONS.map(
      ({label, answers, decrement}) => ({label, answers, decrement}),
    ),
    COURSE_G04_L03_TI_005_SOURCE.quizSourceData,
  );
});

test("TI005 initial question uses the documented normalized-seed modulo-five mapping", () => {
  for (const seed of [0, 1, 2, 3, 4, 5, 7, 12]) {
    const state = createCourseG04L03Ti005InteractionState(seed);
    assert.equal(state.currentQuestionIndex, (seed >>> 0) % 5);
    assert.equal(state.drawCount, 1);
    assert.equal(state.poolCycle, 1);
    assert.equal(state.remainingQuestionIndices.length, 4);
  }

  const negative = createCourseG04L03Ti005InteractionState(-1);
  assert.equal(negative.seed, 4_294_967_295);
  assert.equal(negative.currentQuestionIndex, 0);
  assert.equal(createCourseG04L03Ti005InteractionState(Number.NaN).seed, 0);
});

test("TI005 seed gives reproducible without-replacement five-question cycles", () => {
  const firstRun = questionSequence(7, 10);
  const secondRun = questionSequence(7, 10);
  assert.deepEqual(firstRun, secondRun);
  assert.deepEqual([...new Set(firstRun.slice(0, 5))].sort(), [0, 1, 2, 3, 4]);
  assert.deepEqual([...new Set(firstRun.slice(5, 10))].sort(), [0, 1, 2, 3, 4]);
  assert.deepEqual(questionSequence(2, 6), [2, 3, 0, 1, 4, 4]);

  let state = createCourseG04L03Ti005InteractionState(7);
  for (let draw = 2; draw <= 5; draw += 1) state = newProblem(state);
  assert.equal(state.drawCount, 5);
  assert.equal(state.poolCycle, 1);
  assert.deepEqual(state.remainingQuestionIndices, []);

  state = newProblem(state);
  assert.equal(state.drawCount, 6);
  assert.equal(state.poolCycle, 2);
  assert.equal(state.remainingQuestionIndices.length, 4);
});

test("TI005 Check uses strict strings and wrong locks Check and New Problem until Close", () => {
  let state = createCourseG04L03Ti005InteractionState(7);
  assert.equal(state.currentQuestionIndex, 2);
  state = setInput(state, "first", "-20 ");
  state = setInput(state, "second", "-30");
  const sequenceBeforeCheck = {
    rngState: state.rngState,
    drawCount: state.drawCount,
    remainingQuestionIndices: state.remainingQuestionIndices,
  };

  state = reduceCourseG04L03Ti005Interaction(state, {type: "check"});
  assert.equal(state.outcome, "wrong");
  assert.equal(state.inputsLocked, true);
  assert.equal(state.checkEnabled, false);
  assert.equal(state.newProblemEnabled, false);
  assert.equal(state.feedbackVisible, true);
  assert.equal(
    state.feedbackText,
    "Each number decreases by 10.  Try again!",
  );
  assert.equal(setInput(state, "first", "-20"), state);
  assert.equal(newProblem(state), state);
  assert.equal(
    reduceCourseG04L03Ti005Interaction(state, {type: "check"}),
    state,
  );

  const closed = reduceCourseG04L03Ti005Interaction(state, {
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

test("TI005 correct locks inputs while Check and New Problem stay enabled", () => {
  let state = createCourseG04L03Ti005InteractionState(7);
  state = setInput(state, "first", "-20");
  state = setInput(state, "second", "-30");
  state = reduceCourseG04L03Ti005Interaction(state, {type: "check"});

  assert.equal(state.outcome, "correct");
  assert.equal(state.inputsLocked, true);
  assert.equal(state.checkEnabled, true);
  assert.equal(state.newProblemEnabled, true);
  assert.equal(state.feedbackVisible, false);
  assert.equal(state.feedbackText, null);
  assert.equal(setInput(state, "first", "changed"), state);
  assert.equal(
    reduceCourseG04L03Ti005Interaction(state, {type: "close-feedback"}),
    state,
  );

  const repeatedCheck = reduceCourseG04L03Ti005Interaction(state, {
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

test("TI005 Reset and Replay restore every field and may replace the seed", () => {
  const initial = createCourseG04L03Ti005InteractionState(12);
  let changed = newProblem(newProblem(initial));
  changed = setInput(changed, "first", "wrong");
  changed = reduceCourseG04L03Ti005Interaction(changed, {type: "check"});

  assert.deepEqual(
    reduceCourseG04L03Ti005Interaction(changed, {type: "reset"}),
    initial,
  );
  assert.deepEqual(
    reduceCourseG04L03Ti005Interaction(changed, {type: "replay"}),
    initial,
  );
  assert.deepEqual(
    reduceCourseG04L03Ti005Interaction(changed, {type: "reset", seed: 17}),
    createCourseG04L03Ti005InteractionState(17),
  );
  assert.deepEqual(
    reduceCourseG04L03Ti005Interaction(changed, {type: "replay", seed: 23}),
    createCourseG04L03Ti005InteractionState(23),
  );
});

test("TI005 state and question inventory are immutable", () => {
  const initial = createCourseG04L03Ti005InteractionState(7);
  const initialRemaining = [...initial.remainingQuestionIndices];
  const next = newProblem(initial);

  assert.equal(Object.isFrozen(COURSE_G04_L03_TI_005_QUESTIONS), true);
  assert.equal(Object.isFrozen(COURSE_G04_L03_TI_005_QUESTIONS[0]), true);
  assert.equal(Object.isFrozen(initial), true);
  assert.equal(Object.isFrozen(initial.remainingQuestionIndices), true);
  assert.equal(Object.isFrozen(COURSE_G04_L03_TI_005_STAGE_GEOMETRY), true);
  assert.equal(
    Object.isFrozen(COURSE_G04_L03_TI_005_STAGE_GEOMETRY.answerFirst),
    true,
  );
  assert.deepEqual(initial.remainingQuestionIndices, initialRemaining);
  assert.notEqual(next, initial);
});

test("TI005 keeps AVM1 random, audio, host, parity, owner, and strict gates closed", () => {
  const authority = COURSE_G04_L03_TI_005_INTERACTION_AUTHORITY;
  assert.equal(authority.sourceLocalContractHashChainCurrent, false);
  assert.equal(authority.deterministicQuestionOrderExecutesAvm1Random, false);
  assert.equal(authority.sourceRandomParityEstablished, false);
  assert.equal(authority.feedbackAudioModeled, false);
  assert.equal(authority.feedbackAudioParityEstablished, false);
  assert.equal(authority.hostHyperlinkModeled, false);
  assert.equal(authority.hostIntegrationParityEstablished, false);
  assert.equal(authority.behaviorParityEstablished, false);
  assert.equal(authority.replayParityEstablished, false);
  assert.equal(authority.authoritativeOriginalRuntimeAccepted, false);
  assert.equal(authority.ownerAccepted, false);
  assert.equal(authority.strictMigrationComplete, false);
  assert.equal(authority.strictAcceptanceEffect, "none");
});

test("TI005 preserves the authoring-derived stage geometry without calling it runtime parity", () => {
  assert.deepEqual(COURSE_G04_L03_TI_005_STAGE_GEOMETRY, {
    question: {left: 198.1, top: 285.75, width: 215.45, height: 33.95},
    answerFirst: {left: 417.75, top: 285.75, width: 40.7, height: 33.95},
    answerSecond: {left: 468.75, top: 285.75, width: 40.7, height: 33.95},
    checkAnswer: {left: 167.275, top: 367.225, width: 147.35, height: 27.75},
    newProblem: {left: 438.325, top: 367.925, width: 147.35, height: 27.75},
    wrongFeedback: {left: 151.925, top: 182.725, width: 515.15, height: 63.95},
    wrongFeedbackText: {left: 157.5, top: 187.7, width: 505.75, height: 55.05},
    closeWrong: {left: 570.625, top: 156.25, width: 96.45, height: 26.5},
  });
  assert.equal(
    COURSE_G04_L03_TI_005_INTERACTION_AUTHORITY.behaviorParityEstablished,
    false,
  );
});
