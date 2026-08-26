import assert from "node:assert/strict";
import test from "node:test";

import {
  COURSE_G04_L03_TI_003_CARDS,
  COURSE_G04_L03_TI_003_COMPLETION_FEEDBACK,
  COURSE_G04_L03_TI_003_CORRECT_FEEDBACK,
  COURSE_G04_L03_TI_003_CURRENT_JS_TIMING,
  COURSE_G04_L03_TI_003_INSTRUCTION,
  COURSE_G04_L03_TI_003_INTERACTION_AUTHORITY,
  COURSE_G04_L03_TI_003_SOURCE_GEOMETRY,
  COURSE_G04_L03_TI_003_WRONG_FEEDBACK,
  createCourseG04L03Ti003NumberLineDragState,
  getCourseG04L03Ti003PlacementCount,
  reduceCourseG04L03Ti003NumberLineDrag,
  type CourseG04L03Ti003CardId,
  type CourseG04L03Ti003NumberLineDragState,
  type CourseG04L03Ti003TargetId,
} from "../src/timelines/course-g04-l03-ti-003-number-line-drag-interaction";

const select = (
  state: CourseG04L03Ti003NumberLineDragState,
  cardId: CourseG04L03Ti003CardId,
) => reduceCourseG04L03Ti003NumberLineDrag(state, {
  type: "select-card",
  cardId,
});

const drop = (
  state: CourseG04L03Ti003NumberLineDragState,
  targetId: CourseG04L03Ti003TargetId,
  cardId?: CourseG04L03Ti003CardId,
) => cardId === undefined
  ? reduceCourseG04L03Ti003NumberLineDrag(state, {
      type: "drop-card",
      targetId,
    })
  : reduceCourseG04L03Ti003NumberLineDrag(state, {
      type: "drop-card",
      cardId,
      targetId,
    });

const finishFeedback = (
  state: CourseG04L03Ti003NumberLineDragState,
) => reduceCourseG04L03Ti003NumberLineDrag(state, {
  type: "feedback-complete",
});

const permutations = <T>(values: readonly T[]): T[][] => {
  if (values.length <= 1) return [[...values]];
  return values.flatMap((value, index) => permutations([
    ...values.slice(0, index),
    ...values.slice(index + 1),
  ]).map((tail) => [value, ...tail]));
};

const completeInSourceOrder = (): CourseG04L03Ti003NumberLineDragState => {
  let state = createCourseG04L03Ti003NumberLineDragState();
  for (const card of COURSE_G04_L03_TI_003_CARDS) {
    state = drop(state, card.targetId, card.id);
    state = finishFeedback(state);
  }
  return state;
};

test("TI003 binds all six exact card/value/target mappings", () => {
  assert.deepEqual(
    COURSE_G04_L03_TI_003_CARDS.map((card) => ({
      id: card.id,
      valueText: card.valueText,
      numericValue: card.numericValue,
      accessibleLabel: card.accessibleLabel,
      targetId: card.targetId,
    })),
    [
      {
        id: "Scr_1",
        valueText: "-10",
        numericValue: -10,
        accessibleLabel: "negative 10",
        targetId: "Mc_Tar_1",
      },
      {
        id: "Scr_2",
        valueText: "9",
        numericValue: 9,
        accessibleLabel: "9",
        targetId: "Mc_Tar_2",
      },
      {
        id: "Scr_3",
        valueText: "1",
        numericValue: 1,
        accessibleLabel: "1",
        targetId: "Mc_Tar_3",
      },
      {
        id: "Scr_4",
        valueText: "-2",
        numericValue: -2,
        accessibleLabel: "negative 2",
        targetId: "Mc_Tar_4",
      },
      {
        id: "Scr_5",
        valueText: "-7",
        numericValue: -7,
        accessibleLabel: "negative 7",
        targetId: "Mc_Tar_5",
      },
      {
        id: "Scr_6",
        valueText: "5",
        numericValue: 5,
        accessibleLabel: "5",
        targetId: "Mc_Tar_6",
      },
    ],
  );
  assert.equal(
    COURSE_G04_L03_TI_003_INSTRUCTION,
    "Drag and drop each number to its correct position on the number line.",
  );
});

test("TI003 preserves the frame-139 source centers, sizes, and Help bounds", () => {
  assert.deepEqual(
    COURSE_G04_L03_TI_003_CARDS.map((card) => ({
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
        sourceCenter: {x: 184.8, y: 374.95},
        sourceSize: {height: 44.15, width: 44.15},
        targetId: "Mc_Tar_1",
        targetCenter: {x: 158, y: 215.8},
        targetSize: {height: 44, width: 44.8},
      },
      {
        id: "Scr_2",
        sourceCenter: {x: 275.75, y: 374.95},
        sourceSize: {height: 44.15, width: 44.15},
        targetId: "Mc_Tar_2",
        targetCenter: {x: 616.75, y: 215.6},
        targetSize: {height: 44, width: 44.2},
      },
      {
        id: "Scr_3",
        sourceCenter: {x: 366.7, y: 374.95},
        sourceSize: {height: 44.15, width: 44.15},
        targetId: "Mc_Tar_3",
        targetCenter: {x: 424.95, y: 215.8},
        targetSize: {height: 44.2, width: 44.2},
      },
      {
        id: "Scr_4",
        sourceCenter: {x: 457.6, y: 374.95},
        sourceSize: {height: 44.15, width: 44.15},
        targetId: "Mc_Tar_4",
        targetCenter: {x: 348, y: 215.8},
        targetSize: {height: 44.45, width: 44.15},
      },
      {
        id: "Scr_5",
        sourceCenter: {x: 548.6, y: 374.95},
        sourceSize: {height: 44.15, width: 44.15},
        targetId: "Mc_Tar_5",
        targetCenter: {x: 228, y: 215.8},
        targetSize: {height: 44.2, width: 44.6},
      },
      {
        id: "Scr_6",
        sourceCenter: {x: 639.55, y: 374.95},
        sourceSize: {height: 44.15, width: 44.15},
        targetId: "Mc_Tar_6",
        targetCenter: {x: 522.3, y: 216},
        targetSize: {height: 44.4, width: 44},
      },
    ],
  );
  assert.deepEqual(COURSE_G04_L03_TI_003_SOURCE_GEOMETRY, {
    stage: {width: 800, height: 600},
    rootPlacement: {x: 412.4, y: 283.3},
    frameDomain: "sprite-126",
    interactionFrame: 139,
    cleanSourceVisualFrame: 138,
    cards: {
      Scr_1: {
        center: {x: 184.8, y: 374.95},
        size: {height: 44.15, width: 44.15},
      },
      Scr_2: {
        center: {x: 275.75, y: 374.95},
        size: {height: 44.15, width: 44.15},
      },
      Scr_3: {
        center: {x: 366.7, y: 374.95},
        size: {height: 44.15, width: 44.15},
      },
      Scr_4: {
        center: {x: 457.6, y: 374.95},
        size: {height: 44.15, width: 44.15},
      },
      Scr_5: {
        center: {x: 548.6, y: 374.95},
        size: {height: 44.15, width: 44.15},
      },
      Scr_6: {
        center: {x: 639.55, y: 374.95},
        size: {height: 44.15, width: 44.15},
      },
    },
    targets: {
      Mc_Tar_1: {
        center: {x: 158, y: 215.8},
        size: {height: 44, width: 44.8},
      },
      Mc_Tar_2: {
        center: {x: 616.75, y: 215.6},
        size: {height: 44, width: 44.2},
      },
      Mc_Tar_3: {
        center: {x: 424.95, y: 215.8},
        size: {height: 44.2, width: 44.2},
      },
      Mc_Tar_4: {
        center: {x: 348, y: 215.8},
        size: {height: 44.45, width: 44.15},
      },
      Mc_Tar_5: {
        center: {x: 228, y: 215.8},
        size: {height: 44.2, width: 44.6},
      },
      Mc_Tar_6: {
        center: {x: 522.3, y: 216},
        size: {height: 44.4, width: 44},
      },
    },
    helpBounds: {
      x: 656.15,
      y: 143,
      width: 132.05,
      height: 30.5,
      left: 590.125,
      right: 722.175,
      top: 127.75,
      bottom: 158.25,
    },
  });
  assert.equal(
    COURSE_G04_L03_TI_003_CURRENT_JS_TIMING.correctFeedbackMs,
    (20 * 1_000) / 12,
  );
});

test("TI003 starts unlocked with no selection or placements", () => {
  const initial = createCourseG04L03Ti003NumberLineDragState();
  assert.deepEqual(initial, {
    placements: {
      Scr_1: null,
      Scr_2: null,
      Scr_3: null,
      Scr_4: null,
      Scr_5: null,
      Scr_6: null,
    },
    selectedCardId: null,
    wrongCardId: null,
    lastPlacedCardId: null,
    attemptedTargetId: null,
    outcome: "ready",
    locked: false,
    feedback: null,
  });
  assert.equal(getCourseG04L03Ti003PlacementCount(initial), 0);
});

test("wrong drops return the card and lock interaction until Close", () => {
  const initial = createCourseG04L03Ti003NumberLineDragState();
  const selected = select(initial, "Scr_1");
  assert.equal(selected.selectedCardId, "Scr_1");

  const wrong = drop(selected, "Mc_Tar_2");
  assert.equal(wrong.outcome, "wrong");
  assert.equal(wrong.locked, true);
  assert.equal(wrong.selectedCardId, null);
  assert.equal(wrong.wrongCardId, "Scr_1");
  assert.equal(wrong.lastPlacedCardId, null);
  assert.equal(wrong.attemptedTargetId, "Mc_Tar_2");
  assert.equal(wrong.feedback, COURSE_G04_L03_TI_003_WRONG_FEEDBACK);
  assert.equal(getCourseG04L03Ti003PlacementCount(wrong), 0);
  assert.deepEqual(wrong.placements, initial.placements);

  assert.equal(select(wrong, "Scr_2"), wrong);
  assert.equal(drop(wrong, "Mc_Tar_1", "Scr_1"), wrong);
  assert.equal(finishFeedback(wrong), wrong);

  const closed = reduceCourseG04L03Ti003NumberLineDrag(wrong, {
    type: "close-wrong",
  });
  assert.equal(closed.outcome, "ready");
  assert.equal(closed.locked, false);
  assert.equal(closed.wrongCardId, null);
  assert.equal(closed.attemptedTargetId, null);
  assert.equal(closed.feedback, null);

  const retried = drop(closed, "Mc_Tar_1", "Scr_1");
  assert.equal(retried.outcome, "correct-feedback");
  assert.equal(retried.placements.Scr_1, "Mc_Tar_1");
});

test("correct drops count once and stay locked until feedback completes", () => {
  const initial = createCourseG04L03Ti003NumberLineDragState();
  const accepted = drop(initial, "Mc_Tar_6", "Scr_6");
  assert.equal(accepted.outcome, "correct-feedback");
  assert.equal(accepted.locked, true);
  assert.equal(accepted.feedback, COURSE_G04_L03_TI_003_CORRECT_FEEDBACK);
  assert.equal(accepted.lastPlacedCardId, "Scr_6");
  assert.equal(accepted.attemptedTargetId, "Mc_Tar_6");
  assert.equal(accepted.placements.Scr_6, "Mc_Tar_6");
  assert.equal(getCourseG04L03Ti003PlacementCount(accepted), 1);

  assert.equal(drop(accepted, "Mc_Tar_6", "Scr_6"), accepted);
  assert.equal(select(accepted, "Scr_1"), accepted);

  const ready = finishFeedback(accepted);
  assert.equal(ready.outcome, "ready");
  assert.equal(ready.locked, false);
  assert.equal(ready.feedback, null);
  assert.equal(ready.placements.Scr_6, "Mc_Tar_6");
  assert.equal(select(ready, "Scr_6"), ready);
  assert.equal(drop(ready, "Mc_Tar_6", "Scr_6"), ready);
});

test("all 720 card orders complete exactly once per card", () => {
  const orders = permutations(COURSE_G04_L03_TI_003_CARDS);
  assert.equal(orders.length, 720);

  for (const order of orders) {
    let state = createCourseG04L03Ti003NumberLineDragState();
    for (const [index, card] of order.entries()) {
      state = index % 2 === 0
        ? drop(select(state, card.id), card.targetId)
        : drop(state, card.targetId, card.id);
      assert.equal(state.outcome, "correct-feedback");
      assert.equal(state.locked, true);
      assert.equal(getCourseG04L03Ti003PlacementCount(state), index + 1);
      assert.equal(drop(state, card.targetId, card.id), state);

      state = finishFeedback(state);
      assert.equal(
        state.outcome,
        index === COURSE_G04_L03_TI_003_CARDS.length - 1
          ? "complete"
          : "ready",
      );
    }

    assert.equal(state.locked, true);
    assert.equal(state.feedback, COURSE_G04_L03_TI_003_COMPLETION_FEEDBACK);
    assert.equal(getCourseG04L03Ti003PlacementCount(state), 6);
    for (const card of COURSE_G04_L03_TI_003_CARDS) {
      assert.equal(state.placements[card.id], card.targetId);
      assert.equal(drop(state, card.targetId, card.id), state);
    }
  }
});

test("Reset and Replay restore the initial vector from every outcome", () => {
  const initial = createCourseG04L03Ti003NumberLineDragState();
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
      reduceCourseG04L03Ti003NumberLineDrag(state, {type: "reset"}),
      initial,
    );
    assert.deepEqual(
      reduceCourseG04L03Ti003NumberLineDrag(state, {type: "replay"}),
      initial,
    );
  }
});

test("unknown card and target identities fail closed", () => {
  const initial = createCourseG04L03Ti003NumberLineDragState();
  assert.equal(
    reduceCourseG04L03Ti003NumberLineDrag(initial, {
      type: "select-card",
      cardId: "Scr_7",
    } as never),
    initial,
  );
  assert.equal(
    reduceCourseG04L03Ti003NumberLineDrag(initial, {
      type: "drop-card",
      cardId: "Scr_7",
      targetId: "Mc_Tar_1",
    } as never),
    initial,
  );
  assert.equal(
    reduceCourseG04L03Ti003NumberLineDrag(initial, {
      type: "drop-card",
      cardId: "Scr_1",
      targetId: "Mc_Tar_7",
    } as never),
    initial,
  );
  assert.equal(drop(initial, "Mc_Tar_1"), initial);
});

test("cards, geometry, state, and placement records are immutable", () => {
  const initial = createCourseG04L03Ti003NumberLineDragState();
  const selected = select(initial, "Scr_2");
  const accepted = drop(selected, "Mc_Tar_2");

  assert.equal(Object.isFrozen(COURSE_G04_L03_TI_003_CARDS), true);
  assert.equal(Object.isFrozen(COURSE_G04_L03_TI_003_CARDS[0]), true);
  assert.equal(
    Object.isFrozen(COURSE_G04_L03_TI_003_CARDS[0]?.sourceCenter),
    true,
  );
  assert.equal(
    Object.isFrozen(COURSE_G04_L03_TI_003_CARDS[0]?.targetSize),
    true,
  );
  assert.equal(Object.isFrozen(COURSE_G04_L03_TI_003_SOURCE_GEOMETRY), true);
  assert.equal(
    Object.isFrozen(COURSE_G04_L03_TI_003_SOURCE_GEOMETRY.cards),
    true,
  );
  assert.equal(
    Object.isFrozen(COURSE_G04_L03_TI_003_SOURCE_GEOMETRY.helpBounds),
    true,
  );
  assert.equal(Object.isFrozen(COURSE_G04_L03_TI_003_CURRENT_JS_TIMING), true);
  assert.equal(Object.isFrozen(COURSE_G04_L03_TI_003_INTERACTION_AUTHORITY), true);
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

test("runtime, audio, host, Replay, owner, and strict gates stay closed", () => {
  const authority = COURSE_G04_L03_TI_003_INTERACTION_AUTHORITY;
  assert.equal(
    authority.wrongFeedbackTextDisposition,
    "modern-assistive-not-source-exact",
  );
  assert.equal(authority.wrongFeedbackTextSourceExact, false);
  assert.equal(authority.correctFeedbackTextSourceExact, false);
  assert.equal(authority.correctFeedbackTimerIsOriginalRuntimeTrace, false);
  assert.equal(authority.sourceDragDropExecuted, false);
  assert.equal(authority.sourceHelpHyperlinksExecuted, false);
  assert.equal(authority.embeddedCoachAudioModeled, false);
  assert.equal(authority.associatedAudioModeled, false);
  assert.equal(authority.audioParityEstablished, false);
  assert.equal(authority.hostWrongFeedbackResolved, false);
  assert.equal(authority.hostKeyTermLinksResolved, false);
  assert.equal(authority.hostContinuationParityEstablished, false);
  assert.equal(authority.behaviorParityEstablished, false);
  assert.equal(authority.replayParityEstablished, false);
  assert.equal(authority.ownerAccepted, false);
  assert.equal(authority.strictMigrationComplete, false);
  assert.equal(authority.strictAcceptanceEffect, "none");
});
