import assert from "node:assert/strict";
import test from "node:test";

import {
  COURSE_G04_L03_TI_004_CARDS,
  COURSE_G04_L03_TI_004_COMPLETION_FEEDBACK,
  COURSE_G04_L03_TI_004_CORRECT_FEEDBACK,
  COURSE_G04_L03_TI_004_CURRENT_JS_TIMING,
  COURSE_G04_L03_TI_004_INSTRUCTION,
  COURSE_G04_L03_TI_004_INTERACTION_AUTHORITY,
  COURSE_G04_L03_TI_004_SOURCE_GEOMETRY,
  COURSE_G04_L03_TI_004_WRONG_FEEDBACK,
  createCourseG04L03Ti004LeastToGreatestDragState,
  getCourseG04L03Ti004PlacementCount,
  reduceCourseG04L03Ti004LeastToGreatestDrag,
  type CourseG04L03Ti004CardId,
  type CourseG04L03Ti004LeastToGreatestDragState,
  type CourseG04L03Ti004TargetId,
} from "../src/timelines/course-g04-l03-ti-004-least-to-greatest-drag-interaction";

const select = (
  state: CourseG04L03Ti004LeastToGreatestDragState,
  cardId: CourseG04L03Ti004CardId,
) => reduceCourseG04L03Ti004LeastToGreatestDrag(state, {
  type: "select-card",
  cardId,
});

const drop = (
  state: CourseG04L03Ti004LeastToGreatestDragState,
  targetId: CourseG04L03Ti004TargetId,
  cardId?: CourseG04L03Ti004CardId,
) => cardId === undefined
  ? reduceCourseG04L03Ti004LeastToGreatestDrag(state, {
      type: "drop-card",
      targetId,
    })
  : reduceCourseG04L03Ti004LeastToGreatestDrag(state, {
      type: "drop-card",
      cardId,
      targetId,
    });

const finishFeedback = (
  state: CourseG04L03Ti004LeastToGreatestDragState,
) => reduceCourseG04L03Ti004LeastToGreatestDrag(state, {
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
  (): CourseG04L03Ti004LeastToGreatestDragState => {
    let state = createCourseG04L03Ti004LeastToGreatestDragState();
    for (const card of COURSE_G04_L03_TI_004_CARDS) {
      state = drop(state, card.targetId, card.id);
      state = finishFeedback(state);
    }
    return state;
  };

test("TI004 binds all seven exact card/value/target mappings", () => {
  assert.deepEqual(
    COURSE_G04_L03_TI_004_CARDS.map((card) => ({
      id: card.id,
      valueText: card.valueText,
      numericValue: card.numericValue,
      accessibleLabel: card.accessibleLabel,
      targetId: card.targetId,
    })),
    [
      {
        id: "Scr_1",
        valueText: "0",
        numericValue: 0,
        accessibleLabel: "0",
        targetId: "Mc_Tar_1",
      },
      {
        id: "Scr_2",
        valueText: "4",
        numericValue: 4,
        accessibleLabel: "4",
        targetId: "Mc_Tar_2",
      },
      {
        id: "Scr_3",
        valueText: "-11",
        numericValue: -11,
        accessibleLabel: "negative 11",
        targetId: "Mc_Tar_3",
      },
      {
        id: "Scr_4",
        valueText: "-1",
        numericValue: -1,
        accessibleLabel: "negative 1",
        targetId: "Mc_Tar_4",
      },
      {
        id: "Scr_5",
        valueText: "-4",
        numericValue: -4,
        accessibleLabel: "negative 4",
        targetId: "Mc_Tar_5",
      },
      {
        id: "Scr_6",
        valueText: "-10",
        numericValue: -10,
        accessibleLabel: "negative 10",
        targetId: "Mc_Tar_6",
      },
      {
        id: "Scr_7",
        valueText: "6",
        numericValue: 6,
        accessibleLabel: "6",
        targetId: "Mc_Tar_7",
      },
    ],
  );
  assert.equal(
    COURSE_G04_L03_TI_004_INSTRUCTION,
    "Drag and drop each number so that the numbers are in order from least to greatest.",
  );
});

test("TI004 preserves frame-124 source geometry and least-to-greatest order", () => {
  assert.deepEqual(
    COURSE_G04_L03_TI_004_CARDS.map((card) => ({
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
        sourceCenter: {x: 174.65, y: 336.95},
        sourceSize: {height: 44.1, width: 44.1},
        targetId: "Mc_Tar_1",
        targetCenter: {x: 454.1, y: 235.95},
        targetSize: {height: 43.75, width: 43.75},
      },
      {
        id: "Scr_2",
        sourceCenter: {x: 244.5, y: 336.95},
        sourceSize: {height: 44.1, width: 44.1},
        targetId: "Mc_Tar_2",
        targetCenter: {x: 525.1, y: 235.95},
        targetSize: {height: 44, width: 44.5},
      },
      {
        id: "Scr_3",
        sourceCenter: {x: 314.4, y: 336.95},
        sourceSize: {height: 44.1, width: 44.1},
        targetId: "Mc_Tar_3",
        targetCenter: {x: 174.6, y: 235.95},
        targetSize: {height: 44, width: 43.75},
      },
      {
        id: "Scr_4",
        sourceCenter: {x: 384.4, y: 336.95},
        sourceSize: {height: 44.1, width: 44.1},
        targetId: "Mc_Tar_4",
        targetCenter: {x: 384.6, y: 235.95},
        targetSize: {height: 43.75, width: 44.25},
      },
      {
        id: "Scr_5",
        sourceCenter: {x: 454.4, y: 336.95},
        sourceSize: {height: 44.1, width: 44.1},
        targetId: "Mc_Tar_5",
        targetCenter: {x: 315.1, y: 235.95},
        targetSize: {height: 44.5, width: 44},
      },
      {
        id: "Scr_6",
        sourceCenter: {x: 524.45, y: 336.95},
        sourceSize: {height: 44.1, width: 44.1},
        targetId: "Mc_Tar_6",
        targetCenter: {x: 244.1, y: 235.95},
        targetSize: {height: 44, width: 44.2},
      },
      {
        id: "Scr_7",
        sourceCenter: {x: 594.3, y: 336.95},
        sourceSize: {height: 44.1, width: 44.1},
        targetId: "Mc_Tar_7",
        targetCenter: {x: 594.6, y: 235.95},
        targetSize: {height: 44.75, width: 44.1},
      },
    ],
  );
  assert.deepEqual(
    [...COURSE_G04_L03_TI_004_CARDS]
      .sort((left, right) => left.targetCenter.x - right.targetCenter.x)
      .map(({id}) => id),
    ["Scr_3", "Scr_6", "Scr_5", "Scr_4", "Scr_1", "Scr_2", "Scr_7"],
  );
  assert.deepEqual(COURSE_G04_L03_TI_004_SOURCE_GEOMETRY, {
    stage: {width: 800, height: 600},
    rootPlacement: {x: 412.4, y: 283.3},
    frameDomain: "sprite-274",
    interactionFrame: 124,
    cleanSourceVisualFrame: 122,
    cards: {
      Scr_1: {
        center: {x: 174.65, y: 336.95},
        size: {height: 44.1, width: 44.1},
      },
      Scr_2: {
        center: {x: 244.5, y: 336.95},
        size: {height: 44.1, width: 44.1},
      },
      Scr_3: {
        center: {x: 314.4, y: 336.95},
        size: {height: 44.1, width: 44.1},
      },
      Scr_4: {
        center: {x: 384.4, y: 336.95},
        size: {height: 44.1, width: 44.1},
      },
      Scr_5: {
        center: {x: 454.4, y: 336.95},
        size: {height: 44.1, width: 44.1},
      },
      Scr_6: {
        center: {x: 524.45, y: 336.95},
        size: {height: 44.1, width: 44.1},
      },
      Scr_7: {
        center: {x: 594.3, y: 336.95},
        size: {height: 44.1, width: 44.1},
      },
    },
    targets: {
      Mc_Tar_1: {
        center: {x: 454.1, y: 235.95},
        size: {height: 43.75, width: 43.75},
      },
      Mc_Tar_2: {
        center: {x: 525.1, y: 235.95},
        size: {height: 44, width: 44.5},
      },
      Mc_Tar_3: {
        center: {x: 174.6, y: 235.95},
        size: {height: 44, width: 43.75},
      },
      Mc_Tar_4: {
        center: {x: 384.6, y: 235.95},
        size: {height: 43.75, width: 44.25},
      },
      Mc_Tar_5: {
        center: {x: 315.1, y: 235.95},
        size: {height: 44.5, width: 44},
      },
      Mc_Tar_6: {
        center: {x: 244.1, y: 235.95},
        size: {height: 44, width: 44.2},
      },
      Mc_Tar_7: {
        center: {x: 594.6, y: 235.95},
        size: {height: 44.75, width: 44.1},
      },
    },
    helpBounds: {
      x: 656.15,
      y: 169,
      width: 132.05,
      height: 30.5,
      left: 590.125,
      right: 722.175,
      top: 153.75,
      bottom: 184.25,
    },
  });
  assert.equal(
    COURSE_G04_L03_TI_004_CURRENT_JS_TIMING.correctFeedbackMs,
    (19 * 1_000) / 12,
  );
});

test("TI004 starts unlocked with no selection or placements", () => {
  const initial = createCourseG04L03Ti004LeastToGreatestDragState();
  assert.deepEqual(initial, {
    placements: {
      Scr_1: null,
      Scr_2: null,
      Scr_3: null,
      Scr_4: null,
      Scr_5: null,
      Scr_6: null,
      Scr_7: null,
    },
    selectedCardId: null,
    wrongCardId: null,
    lastPlacedCardId: null,
    attemptedTargetId: null,
    outcome: "ready",
    locked: false,
    feedback: null,
  });
  assert.equal(getCourseG04L03Ti004PlacementCount(initial), 0);
});

test("wrong drops return the card and lock interaction until Close", () => {
  const initial = createCourseG04L03Ti004LeastToGreatestDragState();
  const selected = select(initial, "Scr_1");
  assert.equal(selected.selectedCardId, "Scr_1");

  const wrong = drop(selected, "Mc_Tar_2");
  assert.equal(wrong.outcome, "wrong");
  assert.equal(wrong.locked, true);
  assert.equal(wrong.selectedCardId, null);
  assert.equal(wrong.wrongCardId, "Scr_1");
  assert.equal(wrong.lastPlacedCardId, null);
  assert.equal(wrong.attemptedTargetId, "Mc_Tar_2");
  assert.equal(wrong.feedback, COURSE_G04_L03_TI_004_WRONG_FEEDBACK);
  assert.equal(getCourseG04L03Ti004PlacementCount(wrong), 0);
  assert.deepEqual(wrong.placements, initial.placements);

  assert.equal(select(wrong, "Scr_2"), wrong);
  assert.equal(drop(wrong, "Mc_Tar_1", "Scr_1"), wrong);
  assert.equal(finishFeedback(wrong), wrong);

  const closed = reduceCourseG04L03Ti004LeastToGreatestDrag(wrong, {
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
  const initial = createCourseG04L03Ti004LeastToGreatestDragState();
  const accepted = drop(initial, "Mc_Tar_7", "Scr_7");
  assert.equal(accepted.outcome, "correct-feedback");
  assert.equal(accepted.locked, true);
  assert.equal(accepted.feedback, COURSE_G04_L03_TI_004_CORRECT_FEEDBACK);
  assert.equal(accepted.lastPlacedCardId, "Scr_7");
  assert.equal(accepted.attemptedTargetId, "Mc_Tar_7");
  assert.equal(accepted.placements.Scr_7, "Mc_Tar_7");
  assert.equal(getCourseG04L03Ti004PlacementCount(accepted), 1);

  assert.equal(drop(accepted, "Mc_Tar_7", "Scr_7"), accepted);
  assert.equal(select(accepted, "Scr_1"), accepted);

  const ready = finishFeedback(accepted);
  assert.equal(ready.outcome, "ready");
  assert.equal(ready.locked, false);
  assert.equal(ready.feedback, null);
  assert.equal(ready.placements.Scr_7, "Mc_Tar_7");
  assert.equal(select(ready, "Scr_7"), ready);
  assert.equal(drop(ready, "Mc_Tar_7", "Scr_7"), ready);
});

test("all 5040 card orders complete exactly once per card", () => {
  const orders = permutations(COURSE_G04_L03_TI_004_CARDS);
  assert.equal(orders.length, 5_040);

  for (const order of orders) {
    let state = createCourseG04L03Ti004LeastToGreatestDragState();
    for (const [index, card] of order.entries()) {
      state = index % 2 === 0
        ? drop(select(state, card.id), card.targetId)
        : drop(state, card.targetId, card.id);
      assert.equal(state.outcome, "correct-feedback");
      assert.equal(state.locked, true);
      assert.equal(getCourseG04L03Ti004PlacementCount(state), index + 1);
      assert.equal(drop(state, card.targetId, card.id), state);

      state = finishFeedback(state);
      assert.equal(
        state.outcome,
        index === COURSE_G04_L03_TI_004_CARDS.length - 1
          ? "complete"
          : "ready",
      );
    }

    assert.equal(state.locked, true);
    assert.equal(state.feedback, COURSE_G04_L03_TI_004_COMPLETION_FEEDBACK);
    assert.equal(getCourseG04L03Ti004PlacementCount(state), 7);
    for (const card of COURSE_G04_L03_TI_004_CARDS) {
      assert.equal(state.placements[card.id], card.targetId);
      assert.equal(drop(state, card.targetId, card.id), state);
    }
  }
});

test("Reset and Replay restore the initial vector from every outcome", () => {
  const initial = createCourseG04L03Ti004LeastToGreatestDragState();
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
      reduceCourseG04L03Ti004LeastToGreatestDrag(state, {type: "reset"}),
      initial,
    );
    assert.deepEqual(
      reduceCourseG04L03Ti004LeastToGreatestDrag(state, {type: "replay"}),
      initial,
    );
  }
});

test("unknown card and target identities fail closed", () => {
  const initial = createCourseG04L03Ti004LeastToGreatestDragState();
  assert.equal(
    reduceCourseG04L03Ti004LeastToGreatestDrag(initial, {
      type: "select-card",
      cardId: "Scr_8",
    } as never),
    initial,
  );
  assert.equal(
    reduceCourseG04L03Ti004LeastToGreatestDrag(initial, {
      type: "drop-card",
      cardId: "Scr_8",
      targetId: "Mc_Tar_1",
    } as never),
    initial,
  );
  assert.equal(
    reduceCourseG04L03Ti004LeastToGreatestDrag(initial, {
      type: "drop-card",
      cardId: "Scr_1",
      targetId: "Mc_Tar_8",
    } as never),
    initial,
  );
  assert.equal(drop(initial, "Mc_Tar_1"), initial);
});

test("cards, geometry, state, and placement records are immutable", () => {
  const initial = createCourseG04L03Ti004LeastToGreatestDragState();
  const selected = select(initial, "Scr_2");
  const accepted = drop(selected, "Mc_Tar_2");

  assert.equal(Object.isFrozen(COURSE_G04_L03_TI_004_CARDS), true);
  assert.equal(Object.isFrozen(COURSE_G04_L03_TI_004_CARDS[0]), true);
  assert.equal(
    Object.isFrozen(COURSE_G04_L03_TI_004_CARDS[0]?.sourceCenter),
    true,
  );
  assert.equal(
    Object.isFrozen(COURSE_G04_L03_TI_004_CARDS[0]?.targetSize),
    true,
  );
  assert.equal(Object.isFrozen(COURSE_G04_L03_TI_004_SOURCE_GEOMETRY), true);
  assert.equal(
    Object.isFrozen(COURSE_G04_L03_TI_004_SOURCE_GEOMETRY.cards),
    true,
  );
  assert.equal(
    Object.isFrozen(COURSE_G04_L03_TI_004_SOURCE_GEOMETRY.helpBounds),
    true,
  );
  assert.equal(Object.isFrozen(COURSE_G04_L03_TI_004_CURRENT_JS_TIMING), true);
  assert.equal(Object.isFrozen(COURSE_G04_L03_TI_004_INTERACTION_AUTHORITY), true);
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

test("runtime, audio, Help, Replay, owner, and strict gates stay closed", () => {
  const authority = COURSE_G04_L03_TI_004_INTERACTION_AUTHORITY;
  assert.equal(
    authority.wrongFeedbackTextDisposition,
    "modern-assistive-not-source-exact",
  );
  assert.equal(
    authority.helpCardLockingDisposition,
    "current-javascript-safety-lock-not-original-runtime-trace",
  );
  assert.equal(authority.wrongFeedbackTextSourceExact, false);
  assert.equal(authority.correctFeedbackTextSourceExact, false);
  assert.equal(authority.correctFeedbackTimerIsOriginalRuntimeTrace, false);
  assert.equal(authority.helpCardLockingIsOriginalRuntimeTrace, false);
  assert.equal(authority.sourceDragDropExecuted, false);
  assert.equal(authority.sourceHelpBehaviorExecuted, false);
  assert.equal(authority.sourceHelpHyperlinksExecuted, false);
  assert.equal(authority.sourceRandomExecuted, false);
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
