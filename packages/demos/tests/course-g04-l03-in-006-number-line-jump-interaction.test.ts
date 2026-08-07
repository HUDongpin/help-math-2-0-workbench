import assert from "node:assert/strict";
import test from "node:test";

import {
  COURSE_G04_L03_IN_006_COMPLETION_FEEDBACK,
  COURSE_G04_L03_IN_006_CURRENT_JS_TIMING,
  COURSE_G04_L03_IN_006_INVALID_DROP_FEEDBACK,
  COURSE_G04_L03_IN_006_INSTRUCTION,
  COURSE_G04_L03_IN_006_INTERACTION_AUTHORITY,
  COURSE_G04_L03_IN_006_JUMP_MAGNITUDES,
  COURSE_G04_L03_IN_006_NUMBER_LINE_RANGE,
  COURSE_G04_L03_IN_006_QUESTIONS,
  COURSE_G04_L03_IN_006_WRONG_FEEDBACK,
  createCourseG04L03In006NumberLineJumpState,
  reduceCourseG04L03In006NumberLineJumpInteraction,
  type CourseG04L03In006JumpMagnitude,
  type CourseG04L03In006NumberLineJumpState,
} from "../src/timelines/course-g04-l03-in-006-number-line-jump-interaction";

const place = (
  state: CourseG04L03In006NumberLineJumpState,
  magnitude: CourseG04L03In006JumpMagnitude,
) => reduceCourseG04L03In006NumberLineJumpInteraction(state, {
  type: "place",
  magnitude,
});

const reverseLast = (
  state: CourseG04L03In006NumberLineJumpState,
) => reduceCourseG04L03In006NumberLineJumpInteraction(state, {
  type: "reverse-last",
});

const placeSigned = (
  state: CourseG04L03In006NumberLineJumpState,
  signedMagnitude: number,
): CourseG04L03In006NumberLineJumpState => {
  const placed = place(
    state,
    Math.abs(signedMagnitude) as CourseG04L03In006JumpMagnitude,
  );
  return signedMagnitude < 0 ? reverseLast(placed) : placed;
};

const solve = (
  state: CourseG04L03In006NumberLineJumpState,
  signedMagnitudes: readonly number[],
): CourseG04L03In006NumberLineJumpState => {
  let nextState = state;
  for (const signedMagnitude of signedMagnitudes) {
    nextState = placeSigned(nextState, signedMagnitude);
  }
  return nextState;
};

const SOLUTIONS: readonly (readonly number[])[] = Object.freeze([
  Object.freeze([1, 2]),
  Object.freeze([-2, -5]),
  Object.freeze([5, 5, 1]),
  Object.freeze([5, 4]),
  Object.freeze([4]),
  Object.freeze([5, 1]),
  Object.freeze([-5, -5, -4]),
  Object.freeze([-5, -2]),
]);

test("IN006 binds all eight exact source question pairs and four reusable jump values", () => {
  assert.deepEqual(
    COURSE_G04_L03_IN_006_QUESTIONS.map((question) => ({
      id: question.id,
      sourceText: question.sourceText,
      start: question.start,
      target: question.target,
    })),
    [
      {id: "question-01", sourceText: "-11~-8", start: -11, target: -8},
      {id: "question-02", sourceText: "-8~-15", start: -8, target: -15},
      {id: "question-03", sourceText: "-15~-4", start: -15, target: -4},
      {id: "question-04", sourceText: "-4~5", start: -4, target: 5},
      {id: "question-05", sourceText: "5~9", start: 5, target: 9},
      {id: "question-06", sourceText: "9~15", start: 9, target: 15},
      {id: "question-07", sourceText: "15~1", start: 15, target: 1},
      {id: "question-08", sourceText: "1~-6", start: 1, target: -6},
    ],
  );
  assert.deepEqual(COURSE_G04_L03_IN_006_JUMP_MAGNITUDES, [1, 2, 4, 5]);
  assert.deepEqual(COURSE_G04_L03_IN_006_NUMBER_LINE_RANGE, {
    minimum: -15,
    maximum: 15,
  });
  assert.equal(
    COURSE_G04_L03_IN_006_INSTRUCTION,
    "Click and drag the jumps to the number line to jump from the first point to the target number using as few arrows as possible.",
  );
  assert.equal(
    COURSE_G04_L03_IN_006_CURRENT_JS_TIMING.correctFeedbackMs,
    (23 * 1_000) / 12,
  );
});

test("IN006 creates a deterministic, immutable seed question state", () => {
  const initial = createCourseG04L03In006NumberLineJumpState();
  assert.deepEqual(initial, {
    seed: 0,
    questionRevision: 0,
    currentQuestion: COURSE_G04_L03_IN_006_QUESTIONS[0],
    start: -11,
    target: -8,
    currentValue: -11,
    jumps: [],
    lastJumpId: null,
    nextJumpOrdinal: 1,
    equation: null,
    outcome: "ready",
    newNumberEnabled: false,
    feedback: null,
    locked: false,
  });
  assert.equal(Object.isFrozen(initial), true);
  assert.equal(Object.isFrozen(initial.jumps), true);
  assert.equal(Object.isFrozen(initial.currentQuestion), true);

  for (let seed = 0; seed < COURSE_G04_L03_IN_006_QUESTIONS.length; seed++) {
    assert.equal(
      createCourseG04L03In006NumberLineJumpState(seed).currentQuestion,
      COURSE_G04_L03_IN_006_QUESTIONS[seed],
    );
  }
  assert.equal(
    createCourseG04L03In006NumberLineJumpState(8).currentQuestion.id,
    "question-01",
  );
  assert.equal(
    createCourseG04L03In006NumberLineJumpState(-1).currentQuestion.id,
    "question-08",
  );
  assert.equal(
    createCourseG04L03In006NumberLineJumpState(Number.NaN).seed,
    0,
  );
});

test("IN006 defaults every placed jump positive and reuses magnitudes without a limit", () => {
  let state = createCourseG04L03In006NumberLineJumpState(2);
  state = place(state, 5);
  state = place(state, 5);
  state = place(state, 1);

  assert.equal(state.outcome, "correct-feedback");
  assert.equal(state.currentValue, -4);
  assert.equal(state.equation, "-15 + 11 = -4");
  assert.deepEqual(
    state.jumps.map((jump) => ({
      id: jump.id,
      magnitude: jump.magnitude,
      direction: jump.direction,
      signedDelta: jump.signedDelta,
      start: jump.start,
      end: jump.end,
    })),
    [
      {
        id: "jump-1",
        magnitude: 5,
        direction: "positive",
        signedDelta: 5,
        start: -15,
        end: -10,
      },
      {
        id: "jump-2",
        magnitude: 5,
        direction: "positive",
        signedDelta: 5,
        start: -10,
        end: -5,
      },
      {
        id: "jump-3",
        magnitude: 1,
        direction: "positive",
        signedDelta: 1,
        start: -5,
        end: -4,
      },
    ],
  );
  assert.equal(Object.isFrozen(state.jumps), true);
  assert.equal(state.jumps.every(Object.isFrozen), true);
});

test("IN006 solves every source pair with signed, reversible jumps", () => {
  for (
    let questionIndex = 0;
    questionIndex < COURSE_G04_L03_IN_006_QUESTIONS.length;
    questionIndex++
  ) {
    const solution = SOLUTIONS[questionIndex];
    assert.ok(solution);

    let state = solve(
      createCourseG04L03In006NumberLineJumpState(questionIndex),
      solution,
    );
    assert.equal(state.currentValue, state.target);
    assert.equal(state.outcome, "correct-feedback");
    assert.equal(state.locked, true);
    assert.equal(state.newNumberEnabled, false);
    assert.equal(state.feedback, COURSE_G04_L03_IN_006_COMPLETION_FEEDBACK);

    state = reduceCourseG04L03In006NumberLineJumpInteraction(state, {
      type: "feedback-complete",
    });
    assert.equal(state.outcome, "complete");
    assert.equal(state.locked, true);
    assert.equal(state.newNumberEnabled, true);
    assert.equal(state.feedback, COURSE_G04_L03_IN_006_COMPLETION_FEEDBACK);
  }
});

test("IN006 reverse-last toggles only the latest stable jump", () => {
  let state = createCourseG04L03In006NumberLineJumpState(0);
  state = place(state, 1);
  state = place(state, 2);
  assert.equal(state.outcome, "correct-feedback");
  assert.equal(reverseLast(state), state);

  state = reduceCourseG04L03In006NumberLineJumpInteraction(state, {
    type: "clear",
  });
  state = place(state, 1);
  state = place(state, 4);
  const firstJump = state.jumps[0];
  const lastJumpId = state.lastJumpId;

  state = reverseLast(state);
  assert.deepEqual(state.jumps[0], firstJump);
  assert.equal(state.lastJumpId, lastJumpId);
  assert.deepEqual(state.jumps[1], {
    id: "jump-2",
    magnitude: 4,
    direction: "negative",
    signedDelta: -4,
    start: -10,
    end: -14,
  });
  assert.equal(state.currentValue, -14);
  assert.equal(state.equation, "-11 + -3 = -14");

  state = reverseLast(state);
  assert.equal(state.lastJumpId, lastJumpId);
  assert.deepEqual(state.jumps[1], {
    id: "jump-2",
    magnitude: 4,
    direction: "positive",
    signedDelta: 4,
    start: -10,
    end: -6,
  });
  assert.equal(state.currentValue, -6);
  assert.equal(state.equation, "-11 + 5 = -6");
});

test("IN006 permits an out-of-range endpoint, then offers Close and reverse recovery", () => {
  let state = createCourseG04L03In006NumberLineJumpState(6);
  state = place(state, 5);
  assert.equal(state.currentValue, 20);
  assert.equal(state.equation, "15 + 5 = 20");
  assert.equal(state.outcome, "ready");
  assert.equal(state.locked, false);
  assert.equal(state.jumps.length, 1);

  const beforeRejectedPlace = state;
  state = place(state, 1);
  assert.notEqual(state, beforeRejectedPlace);
  assert.equal(state.currentValue, 20);
  assert.equal(state.jumps.length, 1);
  assert.equal(state.nextJumpOrdinal, 2);
  assert.equal(state.outcome, "wrong");
  assert.equal(state.locked, true);
  assert.equal(state.feedback, COURSE_G04_L03_IN_006_WRONG_FEEDBACK);
  assert.equal(reverseLast(state), state);

  state = reduceCourseG04L03In006NumberLineJumpInteraction(state, {
    type: "close-wrong",
  });
  assert.equal(state.outcome, "ready");
  assert.equal(state.locked, false);
  assert.equal(state.feedback, null);

  state = reverseLast(state);
  assert.equal(state.currentValue, 10);
  assert.equal(state.equation, "15 + -5 = 10");
  assert.equal(state.jumps[0]?.direction, "negative");
  assert.equal(state.lastJumpId, "jump-1");
});

test("IN006 models a source invalid-drop branch with modern assistive text", () => {
  const initial = createCourseG04L03In006NumberLineJumpState(3);
  const wrong = reduceCourseG04L03In006NumberLineJumpInteraction(initial, {
    type: "invalid-drop",
  });
  assert.equal(wrong.outcome, "wrong");
  assert.equal(wrong.locked, true);
  assert.equal(wrong.feedback, COURSE_G04_L03_IN_006_INVALID_DROP_FEEDBACK);
  assert.deepEqual(wrong.jumps, []);
  assert.equal(wrong.currentValue, -4);

  const restored = reduceCourseG04L03In006NumberLineJumpInteraction(wrong, {
    type: "close-wrong",
  });
  assert.equal(restored.outcome, "ready");
  assert.equal(restored.locked, false);
  assert.equal(restored.feedback, null);
});

test("IN006 Clear retains its question and source New Number enable bit", () => {
  let state = solve(
    createCourseG04L03In006NumberLineJumpState(4),
    SOLUTIONS[4] ?? [],
  );
  state = reduceCourseG04L03In006NumberLineJumpInteraction(state, {
    type: "feedback-complete",
  });
  assert.equal(state.newNumberEnabled, true);

  const question = state.currentQuestion;
  state = reduceCourseG04L03In006NumberLineJumpInteraction(state, {
    type: "clear",
  });
  assert.equal(state.currentQuestion, question);
  assert.equal(state.start, 5);
  assert.equal(state.target, 9);
  assert.equal(state.currentValue, 5);
  assert.deepEqual(state.jumps, []);
  assert.equal(state.lastJumpId, null);
  assert.equal(state.nextJumpOrdinal, 1);
  assert.equal(state.equation, null);
  assert.equal(state.outcome, "ready");
  assert.equal(state.locked, false);
  assert.equal(state.feedback, null);
  assert.equal(state.newNumberEnabled, true);

  state = place(state, 1);
  assert.equal(state.jumps[0]?.id, "jump-1");
});

test("IN006 New Number follows an explicit deterministic cycle and Replay restores the seed question", () => {
  let state = createCourseG04L03In006NumberLineJumpState(7);
  assert.equal(state.currentQuestion.id, "question-08");
  assert.equal(
    reduceCourseG04L03In006NumberLineJumpInteraction(state, {
      type: "new-number",
    }),
    state,
  );

  state = solve(state, SOLUTIONS[7] ?? []);
  state = reduceCourseG04L03In006NumberLineJumpInteraction(state, {
    type: "feedback-complete",
  });
  state = reduceCourseG04L03In006NumberLineJumpInteraction(state, {
    type: "new-number",
  });
  assert.equal(state.questionRevision, 1);
  assert.equal(state.currentQuestion.id, "question-01");
  assert.equal(state.currentValue, -11);
  assert.equal(state.newNumberEnabled, false);

  state = place(state, 1);
  const replayed = reduceCourseG04L03In006NumberLineJumpInteraction(state, {
    type: "replay",
  });
  assert.equal(replayed.seed, 7);
  assert.equal(replayed.questionRevision, 0);
  assert.equal(replayed.currentQuestion.id, "question-08");
  assert.equal(replayed.currentValue, 1);
  assert.deepEqual(replayed.jumps, []);
  assert.equal(replayed.nextJumpOrdinal, 1);
  assert.equal(replayed.newNumberEnabled, false);
});

test("IN006 rejects unknown magnitudes and phase-incompatible actions", () => {
  const initial = createCourseG04L03In006NumberLineJumpState();
  const invalidMagnitude =
    reduceCourseG04L03In006NumberLineJumpInteraction(initial, {
      type: "place",
      magnitude: 3,
    } as never);
  assert.equal(invalidMagnitude, initial);
  assert.equal(reverseLast(initial), initial);
  assert.equal(
    reduceCourseG04L03In006NumberLineJumpInteraction(initial, {
      type: "close-wrong",
    }),
    initial,
  );
  assert.equal(
    reduceCourseG04L03In006NumberLineJumpInteraction(initial, {
      type: "feedback-complete",
    }),
    initial,
  );

  const correctFeedback = solve(initial, SOLUTIONS[0] ?? []);
  assert.equal(place(correctFeedback, 1), correctFeedback);
  assert.equal(reverseLast(correctFeedback), correctFeedback);
});

test("IN006 labels current-JS policy without expanding source parity", () => {
  assert.equal(
    COURSE_G04_L03_IN_006_INTERACTION_AUTHORITY.implementationKind,
    "current-javascript-pure-state-candidate",
  );
  assert.equal(
    COURSE_G04_L03_IN_006_INTERACTION_AUTHORITY
      .newNumberSelectionDisposition,
    "current-javascript-deterministic-cycle",
  );
  assert.equal(
    COURSE_G04_L03_IN_006_INTERACTION_AUTHORITY
      .sourceRandomSelectionExecuted,
    false,
  );
  assert.equal(
    COURSE_G04_L03_IN_006_INTERACTION_AUTHORITY.wrongFeedbackTextSourceExact,
    false,
  );
  assert.equal(
    COURSE_G04_L03_IN_006_INTERACTION_AUTHORITY
      .correctFeedbackTimerIsOriginalRuntimeTrace,
    false,
  );
  assert.equal(
    COURSE_G04_L03_IN_006_INTERACTION_AUTHORITY.behaviorParityEstablished,
    false,
  );
  assert.equal(
    COURSE_G04_L03_IN_006_INTERACTION_AUTHORITY.replayParityEstablished,
    false,
  );
  assert.equal(
    COURSE_G04_L03_IN_006_INTERACTION_AUTHORITY.ownerAccepted,
    false,
  );
  assert.equal(
    COURSE_G04_L03_IN_006_INTERACTION_AUTHORITY.strictMigrationComplete,
    false,
  );
  assert.equal(
    COURSE_G04_L03_IN_006_INTERACTION_AUTHORITY.strictAcceptanceEffect,
    "none",
  );
});
