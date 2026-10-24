import assert from "node:assert/strict";
import test from "node:test";

import {
  COURSE_G04_L03_IN_004_COMPLETION_FEEDBACK,
  COURSE_G04_L03_IN_004_CURRENT_JS_TIMING,
  COURSE_G04_L03_IN_004_FIXED_EXAMPLE,
  COURSE_G04_L03_IN_004_GLOSSARY,
  COURSE_G04_L03_IN_004_INSTRUCTION,
  COURSE_G04_L03_IN_004_INTERACTION_AUTHORITY,
  COURSE_G04_L03_IN_004_NUMBER_CARDS,
  COURSE_G04_L03_IN_004_SOURCE_GEOMETRY,
  COURSE_G04_L03_IN_004_WRONG_FEEDBACK,
  createCourseG04L03In004NumberLineDragState,
  getCourseG04L03In004CorrectFeedbackPolicy,
  getCourseG04L03In004PlacementCount,
  reduceCourseG04L03In004NumberLineDrag,
  type CourseG04L03In004CardId,
  type CourseG04L03In004NumberLineDragState,
} from "../src/timelines/course-g04-l03-in-004-number-line-drag-interaction";

const select = (
  state: CourseG04L03In004NumberLineDragState,
  cardId: CourseG04L03In004CardId,
) => reduceCourseG04L03In004NumberLineDrag(state, {
  type: "select-card",
  cardId,
});

const place = (
  state: CourseG04L03In004NumberLineDragState,
  targetId: CourseG04L03In004CardId,
  cardId?: CourseG04L03In004CardId,
) => cardId === undefined
  ? reduceCourseG04L03In004NumberLineDrag(state, {
      type: "place-card",
      targetId,
    })
  : reduceCourseG04L03In004NumberLineDrag(state, {
      type: "place-card",
      cardId,
      targetId,
    });

const finishFeedback = (
  state: CourseG04L03In004NumberLineDragState,
) => reduceCourseG04L03In004NumberLineDrag(state, {
  type: "feedback-complete",
});

const permutations = <T>(values: readonly T[]): T[][] => {
  if (values.length <= 1) return [[...values]];
  return values.flatMap((value, index) => permutations([
    ...values.slice(0, index),
    ...values.slice(index + 1),
  ]).map((tail) => [value, ...tail]));
};

const completeInSourceOrder =
  (): CourseG04L03In004NumberLineDragState => {
    let state = createCourseG04L03In004NumberLineDragState();
    for (const card of COURSE_G04_L03_IN_004_NUMBER_CARDS) {
      state = place(state, card.id, card.id);
      state = finishFeedback(state);
    }
    return state;
  };

test("IN004 binds the five exact card/value/target mappings", () => {
  assert.deepEqual(
    COURSE_G04_L03_IN_004_NUMBER_CARDS.map((card) => ({
      id: card.id,
      label: card.label,
      numericValue: card.numericValue,
      accessibleLabel: card.accessibleLabel,
      sourceInstance: card.sourceInstance,
      targetInstance: card.targetInstance,
    })),
    [
      {
        id: "2",
        label: "−6",
        numericValue: -6,
        accessibleLabel: "negative 6",
        sourceInstance: "Scr_2",
        targetInstance: "Mc_Tar_2",
      },
      {
        id: "3",
        label: "0",
        numericValue: 0,
        accessibleLabel: "0",
        sourceInstance: "Scr_3",
        targetInstance: "Mc_Tar_3",
      },
      {
        id: "4",
        label: "6",
        numericValue: 6,
        accessibleLabel: "6",
        sourceInstance: "Scr_4",
        targetInstance: "Mc_Tar_4",
      },
      {
        id: "5",
        label: "8",
        numericValue: 8,
        accessibleLabel: "8",
        sourceInstance: "Scr_5",
        targetInstance: "Mc_Tar_5",
      },
      {
        id: "6",
        label: "−4",
        numericValue: -4,
        accessibleLabel: "negative 4",
        sourceInstance: "Scr_6",
        targetInstance: "Mc_Tar_6",
      },
    ],
  );
  assert.equal(
    COURSE_G04_L03_IN_004_INSTRUCTION,
    "Drag and drop each number to its correct position on the number line.",
  );
});

test("IN004 preserves frame-126 card and target geometry", () => {
  assert.deepEqual(
    COURSE_G04_L03_IN_004_NUMBER_CARDS.map((card) => ({
      id: card.id,
      sourcePosition: card.sourcePosition,
      sourceSize: card.sourceSize,
      targetPosition: card.targetPosition,
      targetSize: card.targetSize,
    })),
    [
      {
        id: "2",
        sourcePosition: {x: 305, y: 420},
        sourceSize: {height: 32, width: 32},
        targetPosition: {x: 228.55, y: 229},
        targetSize: {height: 34, width: 33},
      },
      {
        id: "3",
        sourcePosition: {x: 375, y: 420},
        sourceSize: {height: 32, width: 32},
        targetPosition: {x: 402.55, y: 229},
        targetSize: {height: 34.25, width: 33.1},
      },
      {
        id: "4",
        sourcePosition: {x: 445, y: 420},
        sourceSize: {height: 32, width: 32},
        targetPosition: {x: 572.5, y: 229},
        targetSize: {height: 34.25, width: 32.85},
      },
      {
        id: "5",
        sourcePosition: {x: 515, y: 420},
        sourceSize: {height: 32, width: 32},
        targetPosition: {x: 628.5, y: 229},
        targetSize: {height: 34, width: 33},
      },
      {
        id: "6",
        sourcePosition: {x: 585, y: 420},
        sourceSize: {height: 32, width: 32},
        targetPosition: {x: 288.55, y: 229},
        targetSize: {height: 34, width: 33},
      },
    ],
  );
  assert.deepEqual(COURSE_G04_L03_IN_004_SOURCE_GEOMETRY, {
    stage: {width: 800, height: 600},
    rootPlacement: {x: 413.4, y: 283.3},
    frameDomain: "sprite-160",
    interactionFrame: 126,
    cleanSourceVisualFrame: 125,
  });
  assert.deepEqual(COURSE_G04_L03_IN_004_FIXED_EXAMPLE, {
    label: "−1",
    numericValue: -1,
    targetInstance: "Mc_Tar_1",
    targetPosition: {x: 374.95, y: 228},
    targetSize: {height: 32, width: 32},
  });
  assert.deepEqual(
    [...COURSE_G04_L03_IN_004_NUMBER_CARDS]
      .sort((left, right) => left.targetPosition.x - right.targetPosition.x)
      .map(({numericValue}) => numericValue),
    [-6, -4, 0, 6, 8],
  );
});

test("IN004 keeps exact visible feedback and glossary copy", () => {
  assert.equal(
    COURSE_G04_L03_IN_004_WRONG_FEEDBACK,
    "Number lines show numbers in order. Try again.",
  );
  assert.equal(
    COURSE_G04_L03_IN_004_COMPLETION_FEEDBACK,
    "Correct!!!",
  );
  assert.deepEqual(COURSE_G04_L03_IN_004_GLOSSARY, [
    {
      term: "Position",
      definition: "A position is a place or location.",
    },
    {
      term: "Number line",
      definition: "A line for ordering numbers by their size.",
    },
  ]);
});

test("IN004 starts ready with an immutable empty state", () => {
  const initial = createCourseG04L03In004NumberLineDragState();
  assert.deepEqual(initial, {
    mode: "ready",
    placedCardIds: [],
    selectedCardId: null,
    lastPlacedCardId: null,
    attemptedTargetId: null,
    feedbackText: null,
  });
  assert.equal(getCourseG04L03In004PlacementCount(initial), 0);
  assert.equal(Object.isFrozen(initial), true);
  assert.equal(Object.isFrozen(initial.placedCardIds), true);
});

test("all 25 card/target combinations accept only the exact mapping", () => {
  for (const card of COURSE_G04_L03_IN_004_NUMBER_CARDS) {
    for (const target of COURSE_G04_L03_IN_004_NUMBER_CARDS) {
      const initial = createCourseG04L03In004NumberLineDragState();
      const result = place(initial, target.id, card.id);
      if (card.id === target.id) {
        assert.equal(result.mode, "correct-feedback");
        assert.deepEqual(result.placedCardIds, [card.id]);
        assert.equal(result.lastPlacedCardId, card.id);
        assert.equal(result.attemptedTargetId, target.id);
        assert.equal(result.feedbackText, null);
      } else {
        assert.equal(result.mode, "wrong-feedback");
        assert.deepEqual(result.placedCardIds, []);
        assert.equal(result.lastPlacedCardId, null);
        assert.equal(result.attemptedTargetId, target.id);
        assert.equal(result.feedbackText, COURSE_G04_L03_IN_004_WRONG_FEEDBACK);
      }
    }
  }
});

test("wrong placement preserves prior work and locks until Close", () => {
  const initial = createCourseG04L03In004NumberLineDragState();
  const firstCorrect = place(initial, "2", "2");
  const readyWithOne = finishFeedback(firstCorrect);
  const selected = select(readyWithOne, "3");
  const wrong = place(selected, "4");

  assert.equal(wrong.mode, "wrong-feedback");
  assert.deepEqual(wrong.placedCardIds, ["2"]);
  assert.equal(wrong.selectedCardId, null);
  assert.equal(wrong.lastPlacedCardId, null);
  assert.equal(wrong.attemptedTargetId, "4");
  assert.equal(wrong.feedbackText, COURSE_G04_L03_IN_004_WRONG_FEEDBACK);
  assert.equal(getCourseG04L03In004PlacementCount(wrong), 1);

  assert.equal(select(wrong, "4"), wrong);
  assert.equal(place(wrong, "3", "3"), wrong);
  assert.equal(finishFeedback(wrong), wrong);

  const closed = reduceCourseG04L03In004NumberLineDrag(wrong, {
    type: "close-wrong-feedback",
  });
  assert.equal(closed.mode, "ready");
  assert.deepEqual(closed.placedCardIds, ["2"]);
  assert.equal(closed.attemptedTargetId, null);
  assert.equal(closed.feedbackText, null);

  const retried = place(select(closed, "3"), "3");
  assert.equal(retried.mode, "correct-feedback");
  assert.deepEqual(retried.placedCardIds, ["2", "3"]);
});

test("correct placement counts once and locks through per-card feedback", () => {
  const initial = createCourseG04L03In004NumberLineDragState();
  const selected = select(initial, "6");
  assert.equal(selected.selectedCardId, "6");

  const accepted = place(selected, "6");
  assert.equal(accepted.mode, "correct-feedback");
  assert.deepEqual(accepted.placedCardIds, ["6"]);
  assert.equal(accepted.lastPlacedCardId, "6");
  assert.equal(getCourseG04L03In004PlacementCount(accepted), 1);
  assert.equal(place(accepted, "6", "6"), accepted);
  assert.equal(select(accepted, "2"), accepted);

  const ready = finishFeedback(accepted);
  assert.equal(ready.mode, "ready");
  assert.deepEqual(ready.placedCardIds, ["6"]);
  assert.equal(select(ready, "6"), ready);
  assert.equal(place(ready, "6", "6"), ready);
});

test("all 120 card orders end in persistent Correct!!! completion", () => {
  const orders = permutations(COURSE_G04_L03_IN_004_NUMBER_CARDS);
  assert.equal(orders.length, 120);

  for (const order of orders) {
    let state = createCourseG04L03In004NumberLineDragState();
    for (const [index, card] of order.entries()) {
      state = index % 2 === 0
        ? place(select(state, card.id), card.id)
        : place(state, card.id, card.id);
      assert.equal(state.mode, "correct-feedback");
      assert.equal(getCourseG04L03In004PlacementCount(state), index + 1);

      state = finishFeedback(state);
      assert.equal(
        state.mode,
        index === COURSE_G04_L03_IN_004_NUMBER_CARDS.length - 1
          ? "completed"
          : "ready",
      );
    }

    assert.equal(state.feedbackText, COURSE_G04_L03_IN_004_COMPLETION_FEEDBACK);
    assert.equal(getCourseG04L03In004PlacementCount(state), 5);
    for (const card of COURSE_G04_L03_IN_004_NUMBER_CARDS) {
      assert.equal(state.placedCardIds.includes(card.id), true);
      assert.equal(select(state, card.id), state);
      assert.equal(place(state, card.id, card.id), state);
    }
    assert.equal(finishFeedback(state), state);
    assert.equal(
      reduceCourseG04L03In004NumberLineDrag(state, {
        type: "close-wrong-feedback",
      }),
      state,
    );
  }
});

test("Reset and Replay restore the full state vector from every phase", () => {
  const initial = createCourseG04L03In004NumberLineDragState();
  const selected = select(initial, "2");
  const wrong = place(selected, "3");
  const correctFeedback = place(initial, "2", "2");
  const readyWithPlacement = finishFeedback(correctFeedback);
  const completed = completeInSourceOrder();

  for (const state of [
    initial,
    selected,
    wrong,
    correctFeedback,
    readyWithPlacement,
    completed,
  ]) {
    assert.deepEqual(
      reduceCourseG04L03In004NumberLineDrag(state, {type: "reset"}),
      initial,
    );
    assert.deepEqual(
      reduceCourseG04L03In004NumberLineDrag(state, {type: "replay"}),
      initial,
    );
  }
});

test("unknown identities and missing selection fail closed", () => {
  const initial = createCourseG04L03In004NumberLineDragState();
  assert.equal(
    reduceCourseG04L03In004NumberLineDrag(initial, {
      type: "select-card",
      cardId: "7",
    } as never),
    initial,
  );
  assert.equal(
    reduceCourseG04L03In004NumberLineDrag(initial, {
      type: "place-card",
      cardId: "7",
      targetId: "2",
    } as never),
    initial,
  );
  assert.equal(
    reduceCourseG04L03In004NumberLineDrag(initial, {
      type: "place-card",
      cardId: "2",
      targetId: "7",
    } as never),
    initial,
  );
  assert.equal(place(initial, "2"), initial);
});

test("constants and every newly produced vector remain immutable", () => {
  const initial = createCourseG04L03In004NumberLineDragState();
  const selected = select(initial, "2");
  const accepted = place(selected, "2");

  assert.equal(Object.isFrozen(COURSE_G04_L03_IN_004_NUMBER_CARDS), true);
  assert.equal(Object.isFrozen(COURSE_G04_L03_IN_004_NUMBER_CARDS[0]), true);
  assert.equal(
    Object.isFrozen(COURSE_G04_L03_IN_004_NUMBER_CARDS[0]?.sourcePosition),
    true,
  );
  assert.equal(
    Object.isFrozen(COURSE_G04_L03_IN_004_NUMBER_CARDS[0]?.targetSize),
    true,
  );
  assert.equal(Object.isFrozen(COURSE_G04_L03_IN_004_SOURCE_GEOMETRY), true);
  assert.equal(Object.isFrozen(COURSE_G04_L03_IN_004_FIXED_EXAMPLE), true);
  assert.equal(Object.isFrozen(COURSE_G04_L03_IN_004_GLOSSARY), true);
  assert.equal(Object.isFrozen(COURSE_G04_L03_IN_004_GLOSSARY[0]), true);
  assert.equal(Object.isFrozen(COURSE_G04_L03_IN_004_CURRENT_JS_TIMING), true);
  assert.equal(
    Object.isFrozen(COURSE_G04_L03_IN_004_INTERACTION_AUTHORITY),
    true,
  );
  assert.equal(Object.isFrozen(selected), true);
  assert.equal(Object.isFrozen(selected.placedCardIds), true);
  assert.equal(Object.isFrozen(accepted), true);
  assert.equal(Object.isFrozen(accepted.placedCardIds), true);
  assert.notEqual(selected, initial);
  assert.notEqual(accepted, selected);
  assert.notEqual(accepted.placedCardIds, initial.placedCardIds);
  assert.deepEqual(initial.placedCardIds, []);
});

test("timer policy is deterministic and every authority gate stays closed", () => {
  assert.equal(
    COURSE_G04_L03_IN_004_CURRENT_JS_TIMING.correctFeedbackMs,
    (19 * 1_000) / 12,
  );
  assert.equal(
    getCourseG04L03In004CorrectFeedbackPolicy({
      mode: "ready",
      paused: false,
      reducedMotion: false,
    }),
    "inactive",
  );
  assert.equal(
    getCourseG04L03In004CorrectFeedbackPolicy({
      mode: "correct-feedback",
      paused: true,
      reducedMotion: true,
    }),
    "hold-while-paused",
  );
  assert.equal(
    getCourseG04L03In004CorrectFeedbackPolicy({
      mode: "correct-feedback",
      paused: false,
      reducedMotion: true,
    }),
    "complete-immediately",
  );
  assert.equal(
    getCourseG04L03In004CorrectFeedbackPolicy({
      mode: "correct-feedback",
      paused: false,
      reducedMotion: false,
    }),
    "schedule-delay",
  );

  const authority = COURSE_G04_L03_IN_004_INTERACTION_AUTHORITY;
  assert.equal(
    authority.implementationKind,
    "current-javascript-pure-state-candidate",
  );
  assert.equal(
    authority.wrongFeedbackTextDisposition,
    "visible-authoring-default-host-runtime-value-unresolved",
  );
  for (const [name, value] of Object.entries(authority)) {
    if (typeof value === "boolean") assert.equal(value, false, name);
  }
  assert.equal(authority.strictAcceptanceEffect, "none");
});
