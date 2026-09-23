import assert from "node:assert/strict";
import test from "node:test";

import {
  COURSE_G04_L03_VB_007_SIGN_QUIZ,
  COURSE_G04_L03_VB_008_SIGN_QUIZ,
  COURSE_G04_L03_VB_SIGN_QUIZ_INTERACTION_AUTHORITY,
  createCourseG04L03VbSignQuizState,
  reduceCourseG04L03VbSignQuiz,
  type CourseG04L03VbSignQuizConfig,
  type CourseG04L03VbSignQuizState,
} from "../src/timelines/course-g04-l03-vb-sign-quiz-interaction";

const choose = (
  config: CourseG04L03VbSignQuizConfig,
  state: CourseG04L03VbSignQuizState,
  choiceId: "left" | "middle" | "right",
) => reduceCourseG04L03VbSignQuiz(config, state, {type: "choose", choiceId});

test("VB007 preserves the exact positive-number source question and authoring geometry", () => {
  assert.deepEqual(
    {
      animationId: COURSE_G04_L03_VB_007_SIGN_QUIZ.animationId,
      frameDomain: COURSE_G04_L03_VB_007_SIGN_QUIZ.frameDomain,
      activityFrame: COURSE_G04_L03_VB_007_SIGN_QUIZ.activityFrame,
      instruction: COURSE_G04_L03_VB_007_SIGN_QUIZ.instruction,
      wrongExplanation:
        COURSE_G04_L03_VB_007_SIGN_QUIZ.wrongExplanation,
      wrongHeadings: COURSE_G04_L03_VB_007_SIGN_QUIZ.wrongHeadings,
      correctHeadings: COURSE_G04_L03_VB_007_SIGN_QUIZ.correctHeadings,
      postCorrectStartFrame:
        COURSE_G04_L03_VB_007_SIGN_QUIZ.postCorrectStartFrame,
      postCorrectEndFrame:
        COURSE_G04_L03_VB_007_SIGN_QUIZ.postCorrectEndFrame,
    },
    {
      animationId: "course-g04-l03-vb-007",
      frameDomain: "sprite-271",
      activityFrame: 31,
      instruction: "Click the positive number.",
      wrongExplanation: "Positive numbers are greater than\u00a0zero. Try again.",
      wrongHeadings: ["incorrect!", "That's incorrect!", "OH! NO"],
      correctHeadings: ["Great Job!", "Good Job!", "Excellent!", "YOU GOT IT!"],
      postCorrectStartFrame: 32,
      postCorrectEndFrame: 69,
    },
  );
  assert.deepEqual(
    COURSE_G04_L03_VB_007_SIGN_QUIZ.choices.map((choice) => ({
      id: choice.id,
      sourceInstance: choice.sourceInstance,
      label: choice.label,
      numericValue: choice.numericValue,
      correct: choice.correct,
      sourceBounds: choice.sourceBounds,
    })),
    [
      {
        id: "left",
        sourceInstance: "AnsBtn1",
        label: "0",
        numericValue: 0,
        correct: false,
        sourceBounds: {
          centerX: 315.65,
          centerY: 296.95,
          height: 61.3,
          width: 38.1,
        },
      },
      {
        id: "middle",
        sourceInstance: "AnsBtn2",
        label: "7",
        numericValue: 7,
        correct: true,
        sourceBounds: {
          centerX: 412.3,
          centerY: 297.45,
          height: 61.4,
          width: 38.7,
        },
      },
      {
        id: "right",
        sourceInstance: "AnsBtn3",
        label: "-7",
        numericValue: -7,
        correct: false,
        sourceBounds: {
          centerX: 509.75,
          centerY: 297.2,
          height: 61.6,
          width: 38.2,
        },
      },
    ],
  );
});

test("VB008 preserves the exact negative-number source question and authoring geometry", () => {
  assert.deepEqual(
    {
      animationId: COURSE_G04_L03_VB_008_SIGN_QUIZ.animationId,
      frameDomain: COURSE_G04_L03_VB_008_SIGN_QUIZ.frameDomain,
      activityFrame: COURSE_G04_L03_VB_008_SIGN_QUIZ.activityFrame,
      instruction: COURSE_G04_L03_VB_008_SIGN_QUIZ.instruction,
      wrongExplanation:
        COURSE_G04_L03_VB_008_SIGN_QUIZ.wrongExplanation,
      wrongHeadings: COURSE_G04_L03_VB_008_SIGN_QUIZ.wrongHeadings,
      correctHeadings: COURSE_G04_L03_VB_008_SIGN_QUIZ.correctHeadings,
      postCorrectStartFrame:
        COURSE_G04_L03_VB_008_SIGN_QUIZ.postCorrectStartFrame,
      postCorrectEndFrame:
        COURSE_G04_L03_VB_008_SIGN_QUIZ.postCorrectEndFrame,
    },
    {
      animationId: "course-g04-l03-vb-008",
      frameDomain: "sprite-195",
      activityFrame: 29,
      instruction: "Click the negative number.",
      wrongExplanation: "Negative numbers are less than\u00a0zero. Try again.",
      wrongHeadings: ["That's incorrect!", "Incorrect!", "Try Again!"],
      correctHeadings: ["YOU GOT IT!", "Correct!", "Excellent!", "Great Job!"],
      postCorrectStartFrame: 30,
      postCorrectEndFrame: 62,
    },
  );
  assert.deepEqual(
    COURSE_G04_L03_VB_008_SIGN_QUIZ.choices.map((choice) => ({
      id: choice.id,
      sourceInstance: choice.sourceInstance,
      label: choice.label,
      numericValue: choice.numericValue,
      correct: choice.correct,
      sourceBounds: choice.sourceBounds,
    })),
    [
      {
        id: "left",
        sourceInstance: "AnsBtn2",
        label: "9",
        numericValue: 9,
        correct: false,
        sourceBounds: {
          centerX: 315.65,
          centerY: 296.95,
          height: 61.3,
          width: 38.1,
        },
      },
      {
        id: "middle",
        sourceInstance: "AnsBtn1",
        label: "-9",
        numericValue: -9,
        correct: true,
        sourceBounds: {
          centerX: 412.3,
          centerY: 297.45,
          height: 61.4,
          width: 38.7,
        },
      },
      {
        id: "right",
        sourceInstance: "AnsBtn3",
        label: "0",
        numericValue: 0,
        correct: false,
        sourceBounds: {
          centerX: 509.75,
          centerY: 297.2,
          height: 61.6,
          width: 38.2,
        },
      },
    ],
  );
});

test("wrong answers increment attempts and lock choices until close-wrong", () => {
  const config = COURSE_G04_L03_VB_007_SIGN_QUIZ;
  const initial = createCourseG04L03VbSignQuizState(config, 7);
  const wrong = choose(config, initial, "left");

  assert.equal(wrong.mode, "wrong-feedback");
  assert.equal(wrong.choice, config.choices[0]);
  assert.equal(wrong.attempts, 1);
  assert.equal(wrong.drawCount, 1);
  assert.equal(wrong.feedbackText, config.wrongExplanation);
  assert.equal(config.wrongHeadings.includes(wrong.feedbackHeading ?? ""), true);
  assert.equal(choose(config, wrong, "middle"), wrong);
  assert.equal(
    reduceCourseG04L03VbSignQuiz(config, wrong, {type: "replay"}).mode,
    "ready",
  );

  const closed = reduceCourseG04L03VbSignQuiz(config, wrong, {
    type: "close-wrong",
  });
  assert.equal(closed.mode, "ready");
  assert.equal(closed.choice, null);
  assert.equal(closed.attempts, 1);
  assert.equal(closed.drawCount, 1);
  assert.equal(closed.feedbackVariantIndex, null);
  assert.equal(closed.feedbackHeading, null);
  assert.equal(closed.feedbackText, null);
});

test("correct answers enter the completed post-correct boundary and remain locked", () => {
  for (const config of [
    COURSE_G04_L03_VB_007_SIGN_QUIZ,
    COURSE_G04_L03_VB_008_SIGN_QUIZ,
  ]) {
    const initial = createCourseG04L03VbSignQuizState(config, 12);
    const completed = choose(config, initial, "middle");

    assert.equal(completed.mode, "completed");
    assert.equal(completed.choice?.correct, true);
    assert.equal(completed.attempts, 1);
    assert.equal(completed.feedbackText, null);
    assert.equal(
      config.correctHeadings.includes(completed.feedbackHeading ?? ""),
      true,
    );
    assert.equal(choose(config, completed, "left"), completed);
    assert.equal(
      reduceCourseG04L03VbSignQuiz(config, completed, {
        type: "close-wrong",
      }),
      completed,
    );
    assert.ok(config.postCorrectStartFrame > config.activityFrame);
    assert.ok(config.postCorrectEndFrame >= config.postCorrectStartFrame);
  }
});

test("seeded current-JS feedback variants are reproducible without claiming AVM1 parity", () => {
  const run = (seed: number) => {
    const config = COURSE_G04_L03_VB_008_SIGN_QUIZ;
    let state = createCourseG04L03VbSignQuizState(config, seed);
    const variants: Array<number | null> = [];

    for (const choiceId of ["left", "right", "left"] as const) {
      state = choose(config, state, choiceId);
      variants.push(state.feedbackVariantIndex);
      state = reduceCourseG04L03VbSignQuiz(config, state, {
        type: "close-wrong",
      });
    }
    state = choose(config, state, "middle");
    variants.push(state.feedbackVariantIndex);
    return variants;
  };

  assert.deepEqual(run(7), run(7));
  assert.notDeepEqual(run(7), run(8));
  assert.equal(
    COURSE_G04_L03_VB_SIGN_QUIZ_INTERACTION_AUTHORITY
      .deterministicFeedbackVariantsExecuteAvm1Random,
    false,
  );
  assert.equal(
    COURSE_G04_L03_VB_SIGN_QUIZ_INTERACTION_AUTHORITY
      .feedbackVariantParityEstablished,
    false,
  );
});

test("Reset and Replay restore every seed-bound state field", () => {
  const config = COURSE_G04_L03_VB_008_SIGN_QUIZ;
  const initial = createCourseG04L03VbSignQuizState(config, -1);
  let changed = choose(config, initial, "left");
  changed = reduceCourseG04L03VbSignQuiz(config, changed, {
    type: "close-wrong",
  });
  changed = choose(config, changed, "middle");

  assert.equal(initial.seed, 4_294_967_295);
  assert.deepEqual(
    reduceCourseG04L03VbSignQuiz(config, changed, {type: "reset"}),
    initial,
  );
  assert.deepEqual(
    reduceCourseG04L03VbSignQuiz(config, changed, {type: "replay"}),
    initial,
  );
  assert.deepEqual(
    reduceCourseG04L03VbSignQuiz(config, changed, {
      type: "reset",
      seed: 17,
    }),
    createCourseG04L03VbSignQuizState(config, 17),
  );
  assert.deepEqual(
    reduceCourseG04L03VbSignQuiz(config, changed, {
      type: "replay",
      seed: 23,
    }),
    createCourseG04L03VbSignQuizState(config, 23),
  );
  assert.equal(
    createCourseG04L03VbSignQuizState(config, Number.NaN).seed,
    0,
  );
});

test("state, configs, nested arrays, choices, and geometry are immutable", () => {
  const config = COURSE_G04_L03_VB_007_SIGN_QUIZ;
  const initial = createCourseG04L03VbSignQuizState(config, 7);
  const next = choose(config, initial, "left");

  assert.equal(Object.isFrozen(config), true);
  assert.equal(Object.isFrozen(config.choices), true);
  assert.equal(Object.isFrozen(config.wrongHeadings), true);
  assert.equal(Object.isFrozen(config.correctHeadings), true);
  assert.equal(Object.isFrozen(config.choices[0]), true);
  assert.equal(Object.isFrozen(config.choices[0]?.sourceBounds), true);
  assert.equal(Object.isFrozen(initial), true);
  assert.equal(Object.isFrozen(next), true);
  assert.notEqual(next, initial);
  assert.equal(initial.mode, "ready");
  assert.equal(initial.attempts, 0);
});

test("unknown choices and mismatched page states fail closed at reducer boundaries", () => {
  const vb007 = COURSE_G04_L03_VB_007_SIGN_QUIZ;
  const vb008 = COURSE_G04_L03_VB_008_SIGN_QUIZ;
  const state = createCourseG04L03VbSignQuizState(vb007, 3);

  assert.equal(
    reduceCourseG04L03VbSignQuiz(vb007, state, {
      type: "choose",
      choiceId: "unknown",
    } as never),
    state,
  );
  assert.equal(
    reduceCourseG04L03VbSignQuiz(vb008, state, {
      type: "choose",
      choiceId: "middle",
    }),
    state,
  );
  assert.equal(
    reduceCourseG04L03VbSignQuiz(vb008, state, {type: "close-wrong"}),
    state,
  );
});

test("interaction authority keeps strict, parity, audio, and glossary gates closed", () => {
  const authority = COURSE_G04_L03_VB_SIGN_QUIZ_INTERACTION_AUTHORITY;
  assert.equal(authority.sourceChoiceHandlersExecuted, false);
  assert.equal(authority.embeddedFeedbackAudioModeled, false);
  assert.equal(authority.associatedAudioModeled, false);
  assert.equal(authority.audioParityEstablished, false);
  assert.equal(authority.glossaryCallbackModeled, false);
  assert.equal(authority.feedbackVariantParityEstablished, false);
  assert.equal(authority.behaviorParityEstablished, false);
  assert.equal(authority.replayParityEstablished, false);
  assert.equal(authority.ownerAccepted, false);
  assert.equal(authority.strictMigrationComplete, false);
  assert.equal(authority.strictAcceptanceEffect, "none");
});
