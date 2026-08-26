import assert from "node:assert/strict";
import test from "node:test";

import {
  COURSE_G04_L03_TI_006_CARDS,
  COURSE_G04_L03_TI_006_COMPLETION_FEEDBACK,
  COURSE_G04_L03_TI_006_CORRECT_FEEDBACK,
  COURSE_G04_L03_TI_006_CURRENT_JS_TIMING,
  COURSE_G04_L03_TI_006_INSTRUCTION,
  COURSE_G04_L03_TI_006_INTERACTION_AUTHORITY,
  COURSE_G04_L03_TI_006_SOURCE_GEOMETRY,
  COURSE_G04_L03_TI_006_WRONG_FEEDBACK,
  createCourseG04L03Ti006NumberLineDragState,
  getCourseG04L03Ti006PlacementCount,
  reduceCourseG04L03Ti006NumberLineDrag,
  type CourseG04L03Ti006CardId,
  type CourseG04L03Ti006NumberLineDragState,
  type CourseG04L03Ti006TargetId,
} from "../src/timelines/course-g04-l03-ti-006-number-line-drag-interaction";

const select = (
  state: CourseG04L03Ti006NumberLineDragState,
  cardId: CourseG04L03Ti006CardId,
) => reduceCourseG04L03Ti006NumberLineDrag(state, {
  type: "select-card",
  cardId,
});

const drop = (
  state: CourseG04L03Ti006NumberLineDragState,
  targetId: CourseG04L03Ti006TargetId,
  cardId?: CourseG04L03Ti006CardId,
) => cardId === undefined
  ? reduceCourseG04L03Ti006NumberLineDrag(state, {
      type: "drop-card",
      targetId,
    })
  : reduceCourseG04L03Ti006NumberLineDrag(state, {
      type: "drop-card",
      cardId,
      targetId,
    });

const finishFeedback = (
  state: CourseG04L03Ti006NumberLineDragState,
) => reduceCourseG04L03Ti006NumberLineDrag(state, {
  type: "feedback-complete",
});

const permutations = <T>(values: readonly T[]): T[][] => {
  if (values.length <= 1) return [[...values]];
  return values.flatMap((value, index) => permutations([
    ...values.slice(0, index),
    ...values.slice(index + 1),
  ]).map((tail) => [value, ...tail]));
};

const completeInSourceOrder = (): CourseG04L03Ti006NumberLineDragState => {
  let state = createCourseG04L03Ti006NumberLineDragState();
  for (const card of COURSE_G04_L03_TI_006_CARDS) {
    state = drop(state, card.targetId, card.id);
    state = finishFeedback(state);
  }
  return state;
};

test("TI006 binds all five exact person/value/target mappings", () => {
  assert.deepEqual(
    COURSE_G04_L03_TI_006_CARDS.map((card) => ({
      id: card.id,
      name: card.name,
      relationship: card.relationship,
      amountText: card.amountText,
      numericValue: card.numericValue,
      sourceText: card.sourceText,
      accessibleLabel: card.accessibleLabel,
      targetId: card.targetId,
    })),
    [
      {
        id: "Scr_1",
        name: "Sapna",
        relationship: "Has",
        amountText: "$5",
        numericValue: 5,
        sourceText: "Sapna\rHas \r$5",
        accessibleLabel: "Sapna Has $5",
        targetId: "Mc_Tar_1",
      },
      {
        id: "Scr_2",
        name: "Alex",
        relationship: "Owes",
        amountText: "$6",
        numericValue: -6,
        sourceText: "Alex\rOwes \r$6",
        accessibleLabel: "Alex Owes $6",
        targetId: "Mc_Tar_2",
      },
      {
        id: "Scr_3",
        name: "Lola",
        relationship: "Has",
        amountText: "$8",
        numericValue: 8,
        sourceText: "Lola\rHas \r$8",
        accessibleLabel: "Lola Has $8",
        targetId: "Mc_Tar_3",
      },
      {
        id: "Scr_4",
        name: "Nestor",
        relationship: "Owes",
        amountText: "$3",
        numericValue: -3,
        sourceText: "Nestor\rOwes \r$3",
        accessibleLabel: "Nestor Owes $3",
        targetId: "Mc_Tar_4",
      },
      {
        id: "Scr_5",
        name: "Sue",
        relationship: "Has",
        amountText: "$3",
        numericValue: 3,
        sourceText: "Sue\rHas \r$3",
        accessibleLabel: "Sue Has $3",
        targetId: "Mc_Tar_5",
      },
    ],
  );
  assert.equal(
    COURSE_G04_L03_TI_006_INSTRUCTION,
    "Drag and drop each person’s card to the correct position on the number line based on the amount of money each one has or owes.",
  );
});

test("TI006 preserves the exact frame-166 source centers, sizes, and Help bounds", () => {
  assert.deepEqual(
    COURSE_G04_L03_TI_006_CARDS.map((card) => ({
      id: card.id,
      sourceCenter: card.sourceCenter,
      sourceSize: card.sourceSize,
      targetId: card.targetId,
      targetCenter: card.targetCenter,
      targetSize: card.targetSize,
    })),
    [
      {
        id: "Scr_1",
        sourceCenter: {x: 184.3, y: 370.65},
        sourceSize: {height: 52.45, width: 44.5},
        targetId: "Mc_Tar_1",
        targetCenter: {x: 581.5, y: 241.05},
        targetSize: {height: 74, width: 50},
      },
      {
        id: "Scr_2",
        sourceCenter: {x: 290.6, y: 370.65},
        sourceSize: {height: 53.4, width: 43.7},
        targetId: "Mc_Tar_2",
        targetCenter: {x: 191.5, y: 241.05},
        targetSize: {height: 73.25, width: 49.25},
      },
      {
        id: "Scr_3",
        sourceCenter: {x: 402.5, y: 370.65},
        sourceSize: {height: 53.4, width: 32.9},
        targetId: "Mc_Tar_3",
        targetCenter: {x: 693.5, y: 241.05},
        targetSize: {height: 74.4, width: 49.8},
      },
      {
        id: "Scr_4",
        sourceCenter: {x: 507.95, y: 371.65},
        sourceSize: {height: 51.95, width: 45.3},
        targetId: "Mc_Tar_4",
        targetCenter: {x: 292.5, y: 241.05},
        targetSize: {height: 74, width: 48.8},
      },
      {
        id: "Scr_5",
        sourceCenter: {x: 615.05, y: 369.15},
        sourceSize: {height: 52.4, width: 32.9},
        targetId: "Mc_Tar_5",
        targetCenter: {x: 512.5, y: 241.05},
        targetSize: {height: 74.4, width: 50.2},
      },
    ],
  );
  assert.deepEqual(COURSE_G04_L03_TI_006_SOURCE_GEOMETRY, {
    stage: {width: 800, height: 600},
    rootPlacement: {x: 412.4, y: 283.3},
    frameDomain: "sprite-269",
    interactionFrame: 166,
    cards: {
      Scr_1: {
        center: {x: 184.3, y: 370.65},
        size: {height: 52.45, width: 44.5},
      },
      Scr_2: {
        center: {x: 290.6, y: 370.65},
        size: {height: 53.4, width: 43.7},
      },
      Scr_3: {
        center: {x: 402.5, y: 370.65},
        size: {height: 53.4, width: 32.9},
      },
      Scr_4: {
        center: {x: 507.95, y: 371.65},
        size: {height: 51.95, width: 45.3},
      },
      Scr_5: {
        center: {x: 615.05, y: 369.15},
        size: {height: 52.4, width: 32.9},
      },
    },
    targets: {
      Mc_Tar_1: {
        center: {x: 581.5, y: 241.05},
        size: {height: 74, width: 50},
      },
      Mc_Tar_2: {
        center: {x: 191.5, y: 241.05},
        size: {height: 73.25, width: 49.25},
      },
      Mc_Tar_3: {
        center: {x: 693.5, y: 241.05},
        size: {height: 74.4, width: 49.8},
      },
      Mc_Tar_4: {
        center: {x: 292.5, y: 241.05},
        size: {height: 74, width: 48.8},
      },
      Mc_Tar_5: {
        center: {x: 512.5, y: 241.05},
        size: {height: 74.4, width: 50.2},
      },
    },
    helpBounds: {
      x: 665.65,
      y: 174.7,
      width: 132.05,
      height: 30.5,
      left: 599.625,
      right: 731.675,
      top: 159.45,
      bottom: 189.95,
    },
  });
  assert.equal(
    COURSE_G04_L03_TI_006_CURRENT_JS_TIMING.correctFeedbackMs,
    (19 * 1_000) / 12,
  );
});

test("TI006 starts from one exact unlocked and empty state vector", () => {
  const initial = createCourseG04L03Ti006NumberLineDragState();
  assert.deepEqual(initial, {
    placements: {
      Scr_1: null,
      Scr_2: null,
      Scr_3: null,
      Scr_4: null,
      Scr_5: null,
    },
    selectedCardId: null,
    wrongCardId: null,
    lastPlacedCardId: null,
    attemptedTargetId: null,
    outcome: "ready",
    locked: false,
    feedback: null,
  });
  assert.equal(getCourseG04L03Ti006PlacementCount(initial), 0);
});

test("wrong drops place nothing, clear selection, and lock until Close", () => {
  const initial = createCourseG04L03Ti006NumberLineDragState();
  const selected = select(initial, "Scr_1");
  assert.equal(selected.selectedCardId, "Scr_1");

  const wrong = drop(selected, "Mc_Tar_2");
  assert.equal(wrong.outcome, "wrong");
  assert.equal(wrong.locked, true);
  assert.equal(wrong.selectedCardId, null);
  assert.equal(wrong.wrongCardId, "Scr_1");
  assert.equal(wrong.lastPlacedCardId, null);
  assert.equal(wrong.attemptedTargetId, "Mc_Tar_2");
  assert.equal(wrong.feedback, COURSE_G04_L03_TI_006_WRONG_FEEDBACK);
  assert.equal(getCourseG04L03Ti006PlacementCount(wrong), 0);
  assert.deepEqual(wrong.placements, initial.placements);

  assert.equal(select(wrong, "Scr_2"), wrong);
  assert.equal(drop(wrong, "Mc_Tar_1", "Scr_1"), wrong);
  assert.equal(finishFeedback(wrong), wrong);

  const closed = reduceCourseG04L03Ti006NumberLineDrag(wrong, {
    type: "close-wrong",
  });
  assert.equal(closed.outcome, "ready");
  assert.equal(closed.locked, false);
  assert.equal(closed.selectedCardId, null);
  assert.equal(closed.wrongCardId, null);
  assert.equal(closed.attemptedTargetId, null);
  assert.equal(closed.feedback, null);
  assert.equal(getCourseG04L03Ti006PlacementCount(closed), 0);

  const retried = drop(closed, "Mc_Tar_1", "Scr_1");
  assert.equal(retried.outcome, "correct-feedback");
  assert.equal(retried.placements.Scr_1, "Mc_Tar_1");
});

test("correct drops count once and stay locked until feedback completes", () => {
  const initial = createCourseG04L03Ti006NumberLineDragState();
  const accepted = drop(initial, "Mc_Tar_5", "Scr_5");
  assert.equal(accepted.outcome, "correct-feedback");
  assert.equal(accepted.locked, true);
  assert.equal(accepted.feedback, COURSE_G04_L03_TI_006_CORRECT_FEEDBACK);
  assert.equal(accepted.selectedCardId, null);
  assert.equal(accepted.wrongCardId, null);
  assert.equal(accepted.lastPlacedCardId, "Scr_5");
  assert.equal(accepted.attemptedTargetId, "Mc_Tar_5");
  assert.equal(accepted.placements.Scr_5, "Mc_Tar_5");
  assert.equal(getCourseG04L03Ti006PlacementCount(accepted), 1);

  assert.equal(drop(accepted, "Mc_Tar_5", "Scr_5"), accepted);
  assert.equal(select(accepted, "Scr_1"), accepted);
  assert.equal(
    reduceCourseG04L03Ti006NumberLineDrag(accepted, {
      type: "close-wrong",
    }),
    accepted,
  );

  const ready = finishFeedback(accepted);
  assert.equal(ready.outcome, "ready");
  assert.equal(ready.locked, false);
  assert.equal(ready.feedback, null);
  assert.equal(ready.placements.Scr_5, "Mc_Tar_5");
  assert.equal(getCourseG04L03Ti006PlacementCount(ready), 1);
  assert.equal(select(ready, "Scr_5"), ready);
  assert.equal(drop(ready, "Mc_Tar_5", "Scr_5"), ready);
});

test("all 120 card orders complete exactly once per card", () => {
  const orders = permutations(COURSE_G04_L03_TI_006_CARDS);
  assert.equal(orders.length, 120);

  for (const order of orders) {
    let state = createCourseG04L03Ti006NumberLineDragState();
    for (const [index, card] of order.entries()) {
      state = index % 2 === 0
        ? drop(select(state, card.id), card.targetId)
        : drop(state, card.targetId, card.id);
      assert.equal(state.outcome, "correct-feedback");
      assert.equal(state.locked, true);
      assert.equal(getCourseG04L03Ti006PlacementCount(state), index + 1);

      const duplicateWhileLocked = drop(state, card.targetId, card.id);
      assert.equal(duplicateWhileLocked, state);
      assert.equal(
        getCourseG04L03Ti006PlacementCount(duplicateWhileLocked),
        index + 1,
      );

      state = finishFeedback(state);
      assert.equal(
        state.outcome,
        index === COURSE_G04_L03_TI_006_CARDS.length - 1
          ? "complete"
          : "ready",
      );
    }

    assert.equal(state.locked, true);
    assert.equal(state.feedback, COURSE_G04_L03_TI_006_COMPLETION_FEEDBACK);
    assert.equal(getCourseG04L03Ti006PlacementCount(state), 5);
    for (const card of COURSE_G04_L03_TI_006_CARDS) {
      assert.equal(state.placements[card.id], card.targetId);
      assert.equal(drop(state, card.targetId, card.id), state);
    }
  }
});

test("Reset and Replay restore the exact initial vector from every reachable outcome", () => {
  const initial = createCourseG04L03Ti006NumberLineDragState();
  const selected = select(initial, "Scr_3");
  const wrong = drop(selected, "Mc_Tar_4");
  const correctFeedback = drop(initial, "Mc_Tar_3", "Scr_3");
  const readyWithPlacement = finishFeedback(correctFeedback);
  const complete = completeInSourceOrder();

  for (const state of [
    initial,
    selected,
    wrong,
    correctFeedback,
    readyWithPlacement,
    complete,
  ]) {
    assert.deepEqual(
      reduceCourseG04L03Ti006NumberLineDrag(state, {type: "reset"}),
      initial,
    );
    assert.deepEqual(
      reduceCourseG04L03Ti006NumberLineDrag(state, {type: "replay"}),
      initial,
    );
  }
});

test("unknown card and target identities fail closed", () => {
  const initial = createCourseG04L03Ti006NumberLineDragState();
  assert.equal(
    reduceCourseG04L03Ti006NumberLineDrag(initial, {
      type: "select-card",
      cardId: "Scr_6",
    } as never),
    initial,
  );
  assert.equal(
    reduceCourseG04L03Ti006NumberLineDrag(initial, {
      type: "drop-card",
      cardId: "Scr_6",
      targetId: "Mc_Tar_1",
    } as never),
    initial,
  );
  assert.equal(
    reduceCourseG04L03Ti006NumberLineDrag(initial, {
      type: "drop-card",
      cardId: "Scr_1",
      targetId: "Mc_Tar_6",
    } as never),
    initial,
  );
  assert.equal(drop(initial, "Mc_Tar_1"), initial);
});

test("cards, geometry, state, and nested placement records are immutable", () => {
  const initial = createCourseG04L03Ti006NumberLineDragState();
  const selected = select(initial, "Scr_2");
  const accepted = drop(selected, "Mc_Tar_2");

  assert.equal(Object.isFrozen(COURSE_G04_L03_TI_006_CARDS), true);
  assert.equal(Object.isFrozen(COURSE_G04_L03_TI_006_CARDS[0]), true);
  assert.equal(
    Object.isFrozen(COURSE_G04_L03_TI_006_CARDS[0]?.sourceCenter),
    true,
  );
  assert.equal(
    Object.isFrozen(COURSE_G04_L03_TI_006_CARDS[0]?.targetSize),
    true,
  );
  assert.equal(Object.isFrozen(COURSE_G04_L03_TI_006_SOURCE_GEOMETRY), true);
  assert.equal(
    Object.isFrozen(COURSE_G04_L03_TI_006_SOURCE_GEOMETRY.cards),
    true,
  );
  assert.equal(
    Object.isFrozen(COURSE_G04_L03_TI_006_SOURCE_GEOMETRY.cards.Scr_1.center),
    true,
  );
  assert.equal(
    Object.isFrozen(COURSE_G04_L03_TI_006_SOURCE_GEOMETRY.helpBounds),
    true,
  );
  assert.equal(Object.isFrozen(COURSE_G04_L03_TI_006_CURRENT_JS_TIMING), true);
  assert.equal(Object.isFrozen(COURSE_G04_L03_TI_006_INTERACTION_AUTHORITY), true);
  assert.equal(Object.isFrozen(initial), true);
  assert.equal(Object.isFrozen(initial.placements), true);
  assert.equal(Object.isFrozen(selected), true);
  assert.equal(Object.isFrozen(accepted), true);
  assert.equal(Object.isFrozen(accepted.placements), true);
  assert.notEqual(selected, initial);
  assert.notEqual(accepted, selected);
  assert.notEqual(accepted.placements, initial.placements);
  assert.equal(initial.selectedCardId, null);
  assert.equal(initial.placements.Scr_2, null);
});

test("authority keeps runtime, feedback, audio, host, Replay, owner, and strict gates closed", () => {
  const authority = COURSE_G04_L03_TI_006_INTERACTION_AUTHORITY;
  assert.equal(
    authority.wrongFeedbackTextDisposition,
    "modern-assistive-not-source-exact",
  );
  assert.equal(authority.wrongFeedbackTextSourceExact, false);
  assert.equal(authority.correctFeedbackTextSourceExact, false);
  assert.equal(authority.correctFeedbackTimerIsOriginalRuntimeTrace, false);
  assert.equal(authority.sourceDragDropExecuted, false);
  assert.equal(authority.sourceRandomExecuted, false);
  assert.equal(authority.embeddedCoachAudioModeled, false);
  assert.equal(authority.associatedAudioModeled, false);
  assert.equal(authority.audioParityEstablished, false);
  assert.equal(authority.hostWrongFeedbackResolved, false);
  assert.equal(authority.hostContinuationParityEstablished, false);
  assert.equal(authority.behaviorParityEstablished, false);
  assert.equal(authority.replayParityEstablished, false);
  assert.equal(authority.ownerAccepted, false);
  assert.equal(authority.strictMigrationComplete, false);
  assert.equal(authority.strictAcceptanceEffect, "none");
});
