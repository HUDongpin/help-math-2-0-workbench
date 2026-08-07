import assert from "node:assert/strict";
import test from "node:test";

import {
  COURSE_G04_L03_TS_007_CHOICES,
  COURSE_G04_L03_TS_007_GLOSSARY,
  COURSE_G04_L03_TS_007_INTERACTION_AUTHORITY,
  COURSE_G04_L03_TS_007_PLAYBACK_POLICY,
  COURSE_G04_L03_TS_007_QUESTION,
  COURSE_G04_L03_TS_007_RIGHT_FEEDBACK_WINDOWS,
  COURSE_G04_L03_TS_007_WALKTHROUGH_FRAMES,
  COURSE_G04_L03_TS_007_WRONG_FEEDBACK_WINDOWS,
  createCourseG04L03Ts007InteractionState,
  reduceCourseG04L03Ts007Interaction,
  type CourseG04L03Ts007ChoiceId,
  type CourseG04L03Ts007InteractionState,
} from "../src/timelines/course-g04-l03-ts-007-practice-question-interaction";

const reachQuiz = (seed = 0): CourseG04L03Ts007InteractionState => {
  let state = createCourseG04L03Ts007InteractionState(seed);
  for (let gate = 0; gate < 4; gate += 1) {
    state = reduceCourseG04L03Ts007Interaction(state, {
      type: "continue-walkthrough",
    });
  }
  return state;
};

const choose = (
  state: CourseG04L03Ts007InteractionState,
  choiceId: CourseG04L03Ts007ChoiceId,
) =>
  reduceCourseG04L03Ts007Interaction(state, {
    type: "choose",
    choiceId,
  });

const completeFeedback = (state: CourseG04L03Ts007InteractionState) =>
  reduceCourseG04L03Ts007Interaction(state, {type: "feedback-complete"});

test("TS007 preserves the four walkthrough gates, exact choices, answer B, and hit bounds", () => {
  assert.deepEqual(COURSE_G04_L03_TS_007_WALKTHROUGH_FRAMES, [
    235,
    373,
    500,
    617,
  ]);
  assert.equal(
    COURSE_G04_L03_TS_007_QUESTION.prompt,
    "Which symbol is located at \u22122 on the number line?",
  );
  assert.equal(COURSE_G04_L03_TS_007_QUESTION.correctChoiceId, "B");
  assert.deepEqual(
    COURSE_G04_L03_TS_007_CHOICES.map(
      ({id, symbol, numberLineLocation, correct, hitBounds}) => ({
        id,
        symbol,
        numberLineLocation,
        correct,
        hitBounds,
      }),
    ),
    [
      {
        id: "A",
        symbol: "green circle",
        numberLineLocation: -4,
        correct: false,
        hitBounds: {x: 550.759, y: 208.914, width: 98.642, height: 43.772},
      },
      {
        id: "B",
        symbol: "orange-red heart",
        numberLineLocation: -2,
        correct: true,
        hitBounds: {x: 549.569, y: 281.818, width: 106.892, height: 51.564},
      },
      {
        id: "C",
        symbol: "pink square",
        numberLineLocation: 2,
        correct: false,
        hitBounds: {x: 550.342, y: 364.948, width: 98.069, height: 41.603},
      },
      {
        id: "D",
        symbol: "cyan triangle",
        numberLineLocation: 4,
        correct: false,
        hitBounds: {x: 549.735, y: 437.6, width: 96.483, height: 47.1},
      },
    ],
  );
});

test("TS007 advances gate 0..3 into quiz and then fails closed on Continue", () => {
  let state = createCourseG04L03Ts007InteractionState(9);
  for (const [gate, frame] of COURSE_G04_L03_TS_007_WALKTHROUGH_FRAMES.entries()) {
    assert.equal(state.phase, "walkthrough");
    assert.equal(state.walkthroughGate, gate);
    assert.equal(state.frame, frame);
    state = reduceCourseG04L03Ts007Interaction(state, {
      type: "continue-walkthrough",
    });
  }

  assert.equal(state.phase, "quiz");
  assert.equal(state.walkthroughGate, null);
  assert.equal(state.frame, 679);
  assert.equal(state.focusTarget, "choice-A");
  assert.equal(
    reduceCourseG04L03Ts007Interaction(state, {
      type: "continue-walkthrough",
    }),
    state,
  );
});

test("TS007 exhausts A-D outcomes and uses seed modulo source branch counts", () => {
  for (const choiceId of ["A", "B", "C", "D"] as const) {
    const feedback = choose(reachQuiz(5), choiceId);
    assert.equal(feedback.phase, "feedback");
    assert.equal(feedback.feedback?.choiceId, choiceId);
    assert.equal(feedback.feedback?.kind, choiceId === "B" ? "right" : "wrong");
    assert.equal(
      feedback.feedback?.branch,
      choiceId === "B" ? (5 % 4) + 1 : (5 % 3) + 1,
    );
  }

  for (let seed = 0; seed < 3; seed += 1) {
    const feedback = choose(reachQuiz(seed), "A");
    assert.equal(feedback.feedback?.branch, seed + 1);
    assert.equal(
      feedback.feedback?.sourceWindow,
      COURSE_G04_L03_TS_007_WRONG_FEEDBACK_WINDOWS[seed],
    );
  }
  for (let seed = 0; seed < 4; seed += 1) {
    const feedback = choose(reachQuiz(seed), "B");
    assert.equal(feedback.feedback?.branch, seed + 1);
    assert.equal(
      feedback.feedback?.sourceWindow,
      COURSE_G04_L03_TS_007_RIGHT_FEEDBACK_WINDOWS[seed],
    );
  }
});

test("TS007 first wrong returns to the same option and second wrong reaches terminal", () => {
  let state = choose(reachQuiz(2), "C");
  state = completeFeedback(state);
  assert.equal(state.phase, "quiz");
  assert.equal(state.wrongTryCount, 1);
  assert.equal(state.focusTarget, "choice-C");
  assert.equal(state.selectedChoiceId, null);

  state = choose(state, "D");
  state = completeFeedback(state);
  assert.equal(state.phase, "terminal");
  assert.equal(state.frame, 696);
  assert.equal(state.wrongTryCount, 1);
  assert.equal(state.selectedChoiceId, "D");
  assert.equal(state.focusTarget, "terminal");
});

test("TS007 correct feedback reaches terminal for answer B", () => {
  const feedback = choose(reachQuiz(3), "B");
  assert.equal(feedback.feedback?.kind, "right");
  const terminal = completeFeedback(feedback);
  assert.equal(terminal.phase, "terminal");
  assert.equal(terminal.frame, 696);
  assert.equal(terminal.selectedChoiceId, "B");
  assert.equal(terminal.wrongTryCount, 0);
});

test("TS007 Need More Help traps then returns focus without changing quiz state", () => {
  const quiz = reachQuiz(7);
  const open = reduceCourseG04L03Ts007Interaction(quiz, {
    type: "open-need-more-help",
  });
  assert.equal(open.phase, "need-more-help");
  assert.equal(open.focusTarget, "need-more-help-close");
  assert.equal(open.needMoreHelpReturnFocus, "need-more-help");
  assert.equal(choose(open, "B"), open);

  const closed = reduceCourseG04L03Ts007Interaction(open, {
    type: "close-need-more-help",
  });
  assert.equal(closed.phase, "quiz");
  assert.equal(closed.frame, 679);
  assert.equal(closed.focusTarget, "need-more-help");
  assert.equal(closed.needMoreHelpReturnFocus, null);
});

test("TS007 Replay resets the complete state vector and may replace the seed", () => {
  const initial = createCourseG04L03Ts007InteractionState(8);
  let changed = choose(reachQuiz(8), "A");
  changed = completeFeedback(changed);
  changed = reduceCourseG04L03Ts007Interaction(changed, {
    type: "open-need-more-help",
  });

  assert.deepEqual(
    reduceCourseG04L03Ts007Interaction(changed, {type: "replay"}),
    initial,
  );
  assert.deepEqual(
    reduceCourseG04L03Ts007Interaction(changed, {
      type: "replay",
      seed: 11,
    }),
    createCourseG04L03Ts007InteractionState(11),
  );
  assert.equal(createCourseG04L03Ts007InteractionState(Number.NaN).seed, 0);
});

test("TS007 unknown actions, choices, and unresolved glossary callbacks fail closed", () => {
  const quiz = reachQuiz(4);
  assert.equal(
    reduceCourseG04L03Ts007Interaction(quiz, {
      type: "choose",
      choiceId: "Z",
    } as never),
    quiz,
  );
  assert.equal(
    reduceCourseG04L03Ts007Interaction(quiz, {
      type: "open-glossary",
      term: "Symbol",
    }),
    quiz,
  );
  assert.equal(
    reduceCourseG04L03Ts007Interaction(quiz, {
      type: "open-glossary",
      term: "Unknown",
    } as never),
    quiz,
  );
  assert.equal(
    reduceCourseG04L03Ts007Interaction(quiz, {type: "unknown"} as never),
    quiz,
  );
  assert.equal(
    reduceCourseG04L03Ts007Interaction(quiz, {type: "feedback-complete"}),
    quiz,
  );
});

test("TS007 constants, nested values, and reducer states are frozen with every authority gate false", () => {
  const initial = createCourseG04L03Ts007InteractionState(1);
  const feedback = choose(reachQuiz(1), "A");

  assert.equal(Object.isFrozen(COURSE_G04_L03_TS_007_CHOICES), true);
  assert.equal(Object.isFrozen(COURSE_G04_L03_TS_007_CHOICES[0]), true);
  assert.equal(
    Object.isFrozen(COURSE_G04_L03_TS_007_CHOICES[0]?.hitBounds),
    true,
  );
  assert.equal(Object.isFrozen(COURSE_G04_L03_TS_007_GLOSSARY), true);
  assert.equal(Object.isFrozen(COURSE_G04_L03_TS_007_PLAYBACK_POLICY), true);
  assert.equal(Object.isFrozen(initial), true);
  assert.equal(Object.isFrozen(feedback), true);
  assert.equal(Object.isFrozen(feedback.feedback), true);
  assert.equal(Object.isFrozen(feedback.feedback?.sourceWindow), true);

  for (const value of Object.values(
    COURSE_G04_L03_TS_007_INTERACTION_AUTHORITY,
  )) {
    if (typeof value === "boolean") assert.equal(value, false);
  }
  assert.equal(
    COURSE_G04_L03_TS_007_INTERACTION_AUTHORITY.strictAcceptanceEffect,
    "none",
  );
});
