import assert from "node:assert/strict";
import test from "node:test";

import {
  COURSE_G04_L03_TI_002_CARDS,
  COURSE_G04_L03_TI_002_COMPLETION_FEEDBACK,
  COURSE_G04_L03_TI_002_CORRECT_FEEDBACK,
  COURSE_G04_L03_TI_002_CURRENT_JS_TIMING,
  COURSE_G04_L03_TI_002_INSTRUCTION,
  COURSE_G04_L03_TI_002_INTERACTION_AUTHORITY,
  COURSE_G04_L03_TI_002_SOURCE_GEOMETRY,
  COURSE_G04_L03_TI_002_WRONG_FEEDBACK,
  createCourseG04L03Ti002KeyTermDragState,
  getCourseG04L03Ti002PlacementCount,
  reduceCourseG04L03Ti002KeyTermDrag,
  type CourseG04L03Ti002CardId,
  type CourseG04L03Ti002KeyTermDragState,
  type CourseG04L03Ti002TargetId,
} from "../src/timelines/course-g04-l03-ti-002-key-term-drag-interaction";

const select = (
  state: CourseG04L03Ti002KeyTermDragState,
  cardId: CourseG04L03Ti002CardId,
) => reduceCourseG04L03Ti002KeyTermDrag(state, {
  type: "select-card",
  cardId,
});

const drop = (
  state: CourseG04L03Ti002KeyTermDragState,
  targetId: CourseG04L03Ti002TargetId,
  cardId?: CourseG04L03Ti002CardId,
) => cardId === undefined
  ? reduceCourseG04L03Ti002KeyTermDrag(state, {
      type: "drop-card",
      targetId,
    })
  : reduceCourseG04L03Ti002KeyTermDrag(state, {
      type: "drop-card",
      cardId,
      targetId,
    });

const finishFeedback = (
  state: CourseG04L03Ti002KeyTermDragState,
) => reduceCourseG04L03Ti002KeyTermDrag(state, {
  type: "feedback-complete",
});

const permutations = <T>(values: readonly T[]): T[][] => {
  if (values.length <= 1) return [[...values]];
  return values.flatMap((value, index) => permutations([
    ...values.slice(0, index),
    ...values.slice(index + 1),
  ]).map((tail) => [value, ...tail]));
};

const completeInSourceOrder = (): CourseG04L03Ti002KeyTermDragState => {
  let state = createCourseG04L03Ti002KeyTermDragState();
  for (const card of COURSE_G04_L03_TI_002_CARDS) {
    state = drop(state, card.targetId, card.id);
    state = finishFeedback(state);
  }
  return state;
};

test("TI002 binds all five exact key-term definitions and suffix targets", () => {
  assert.deepEqual(
    COURSE_G04_L03_TI_002_CARDS.map((card) => ({
      id: card.id,
      term: card.term,
      definition: card.definition,
      pictureKind: card.pictureKind,
      sourceText: card.sourceText,
      accessibleLabel: card.accessibleLabel,
      targetId: card.targetId,
    })),
    [
      {
        id: "Scr_1",
        term: "number line",
        definition: "a line for ordering numbers by their value",
        pictureKind: "number-line",
        sourceText: "number line",
        accessibleLabel: "number line",
        targetId: "Mc_Tar_1",
      },
      {
        id: "Scr_2",
        term: "zero",
        definition:
          "the number that has no value; zero is neither negative nor positive",
        pictureKind: "zero",
        sourceText: "zero",
        accessibleLabel: "zero",
        targetId: "Mc_Tar_2",
      },
      {
        id: "Scr_3",
        term: "decrease",
        definition: "to get smaller in size or in value",
        pictureKind: "decrease",
        sourceText: "decrease",
        accessibleLabel: "decrease",
        targetId: "Mc_Tar_3",
      },
      {
        id: "Scr_4",
        term: "negative",
        definition: "being less than zero",
        pictureKind: "negative",
        sourceText: "negative",
        accessibleLabel: "negative",
        targetId: "Mc_Tar_4",
      },
      {
        id: "Scr_5",
        term: "positive",
        definition: "being greater than zero",
        pictureKind: "positive",
        sourceText: "positive",
        accessibleLabel: "positive",
        targetId: "Mc_Tar_5",
      },
    ],
  );
  assert.equal(
    COURSE_G04_L03_TI_002_INSTRUCTION,
    "Match the key terms with the correct definitions and pictures. Click and drag the key terms to place them where they belong.",
  );
});

test("TI002 preserves frame-238 source centers, sizes, and visual row order", () => {
  assert.deepEqual(
    COURSE_G04_L03_TI_002_CARDS.map((card) => ({
      id: card.id,
      sourceCenter: card.sourceCenter,
      sourceSize: card.sourceSize,
      targetId: card.targetId,
      targetCenter: card.targetCenter,
      targetSize: card.targetSize,
      pictureCenter: card.pictureCenter,
      pictureSize: card.pictureSize,
    })),
    [
      {
        id: "Scr_1",
        sourceCenter: {x: 106.45, y: 206.7},
        sourceSize: {height: 23.15, width: 98.2},
        targetId: "Mc_Tar_1",
        targetCenter: {x: 206.05, y: 321},
        targetSize: {height: 56.5, width: 108.25},
        pictureCenter: {x: 628.65, y: 319.55},
        pictureSize: {height: 55.6, width: 275.95},
      },
      {
        id: "Scr_2",
        sourceCenter: {x: 78.25, y: 264.75},
        sourceSize: {height: 22, width: 39.3},
        targetId: "Mc_Tar_2",
        targetCenter: {x: 206.05, y: 439.7},
        targetSize: {height: 80, width: 108},
        pictureCenter: {x: 629.5, y: 438.2},
        pictureSize: {height: 75.5, width: 275.95},
      },
      {
        id: "Scr_3",
        sourceCenter: {x: 96.8, y: 322.8},
        sourceSize: {height: 23.55, width: 78.35},
        targetId: "Mc_Tar_3",
        targetCenter: {x: 206.05, y: 212.2},
        targetSize: {height: 63.25, width: 108},
        pictureCenter: {x: 628.45, y: 206.65},
        pictureSize: {height: 63.3, width: 271.8},
      },
      {
        id: "Scr_4",
        sourceCenter: {x: 94.95, y: 377.4},
        sourceSize: {height: 23.5, width: 72.15},
        targetId: "Mc_Tar_4",
        targetCenter: {x: 206.15, y: 266.4},
        targetSize: {height: 53.55, width: 108.35},
        pictureCenter: {x: 628.45, y: 265.9},
        pictureSize: {height: 54.2, width: 275.95},
      },
      {
        id: "Scr_5",
        sourceCenter: {x: 91.05, y: 437.1},
        sourceSize: {height: 26.85, width: 69},
        targetId: "Mc_Tar_5",
        targetCenter: {x: 206.9, y: 374.5},
        targetSize: {height: 50.35, width: 108.35},
        pictureCenter: {x: 628.65, y: 374.85},
        pictureSize: {height: 48.5, width: 275.95},
      },
    ],
  );
  assert.deepEqual(
    [...COURSE_G04_L03_TI_002_CARDS]
      .sort((left, right) => left.targetCenter.y - right.targetCenter.y)
      .map(({id}) => id),
    ["Scr_3", "Scr_4", "Scr_1", "Scr_5", "Scr_2"],
  );
  assert.deepEqual(COURSE_G04_L03_TI_002_SOURCE_GEOMETRY, {
    stage: {width: 800, height: 600},
    rootPlacement: {x: 412.4, y: 283.3},
    frameDomain: "sprite-272",
    interactionFrame: 238,
    cards: {
      Scr_1: {
        center: {x: 106.45, y: 206.7},
        size: {height: 23.15, width: 98.2},
      },
      Scr_2: {
        center: {x: 78.25, y: 264.75},
        size: {height: 22, width: 39.3},
      },
      Scr_3: {
        center: {x: 96.8, y: 322.8},
        size: {height: 23.55, width: 78.35},
      },
      Scr_4: {
        center: {x: 94.95, y: 377.4},
        size: {height: 23.5, width: 72.15},
      },
      Scr_5: {
        center: {x: 91.05, y: 437.1},
        size: {height: 26.85, width: 69},
      },
    },
    targets: {
      Mc_Tar_1: {
        center: {x: 206.05, y: 321},
        size: {height: 56.5, width: 108.25},
      },
      Mc_Tar_2: {
        center: {x: 206.05, y: 439.7},
        size: {height: 80, width: 108},
      },
      Mc_Tar_3: {
        center: {x: 206.05, y: 212.2},
        size: {height: 63.25, width: 108},
      },
      Mc_Tar_4: {
        center: {x: 206.15, y: 266.4},
        size: {height: 53.55, width: 108.35},
      },
      Mc_Tar_5: {
        center: {x: 206.9, y: 374.5},
        size: {height: 50.35, width: 108.35},
      },
    },
    pictureTargets: {
      Scr_1: {
        center: {x: 628.65, y: 319.55},
        size: {height: 55.6, width: 275.95},
      },
      Scr_2: {
        center: {x: 629.5, y: 438.2},
        size: {height: 75.5, width: 275.95},
      },
      Scr_3: {
        center: {x: 628.45, y: 206.65},
        size: {height: 63.3, width: 271.8},
      },
      Scr_4: {
        center: {x: 628.45, y: 265.9},
        size: {height: 54.2, width: 275.95},
      },
      Scr_5: {
        center: {x: 628.65, y: 374.85},
        size: {height: 48.5, width: 275.95},
      },
    },
  });
  assert.equal(
    COURSE_G04_L03_TI_002_CURRENT_JS_TIMING.correctFeedbackMs,
    (19 * 1_000) / 12,
  );
});

test("TI002 starts unlocked with no selection or placements", () => {
  const initial = createCourseG04L03Ti002KeyTermDragState();
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
  assert.equal(getCourseG04L03Ti002PlacementCount(initial), 0);
});

test("wrong drops return the card and lock interaction until Close", () => {
  const initial = createCourseG04L03Ti002KeyTermDragState();
  const selected = select(initial, "Scr_1");
  assert.equal(selected.selectedCardId, "Scr_1");

  const wrong = drop(selected, "Mc_Tar_2");
  assert.equal(wrong.outcome, "wrong");
  assert.equal(wrong.locked, true);
  assert.equal(wrong.selectedCardId, null);
  assert.equal(wrong.wrongCardId, "Scr_1");
  assert.equal(wrong.lastPlacedCardId, null);
  assert.equal(wrong.attemptedTargetId, "Mc_Tar_2");
  assert.equal(wrong.feedback, COURSE_G04_L03_TI_002_WRONG_FEEDBACK);
  assert.equal(getCourseG04L03Ti002PlacementCount(wrong), 0);
  assert.deepEqual(wrong.placements, initial.placements);

  assert.equal(select(wrong, "Scr_2"), wrong);
  assert.equal(drop(wrong, "Mc_Tar_1", "Scr_1"), wrong);
  assert.equal(finishFeedback(wrong), wrong);

  const closed = reduceCourseG04L03Ti002KeyTermDrag(wrong, {
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
  const initial = createCourseG04L03Ti002KeyTermDragState();
  const accepted = drop(initial, "Mc_Tar_5", "Scr_5");
  assert.equal(accepted.outcome, "correct-feedback");
  assert.equal(accepted.locked, true);
  assert.equal(accepted.feedback, COURSE_G04_L03_TI_002_CORRECT_FEEDBACK);
  assert.equal(accepted.lastPlacedCardId, "Scr_5");
  assert.equal(accepted.attemptedTargetId, "Mc_Tar_5");
  assert.equal(accepted.placements.Scr_5, "Mc_Tar_5");
  assert.equal(getCourseG04L03Ti002PlacementCount(accepted), 1);

  assert.equal(drop(accepted, "Mc_Tar_5", "Scr_5"), accepted);
  assert.equal(select(accepted, "Scr_1"), accepted);

  const ready = finishFeedback(accepted);
  assert.equal(ready.outcome, "ready");
  assert.equal(ready.locked, false);
  assert.equal(ready.feedback, null);
  assert.equal(ready.placements.Scr_5, "Mc_Tar_5");
  assert.equal(select(ready, "Scr_5"), ready);
  assert.equal(drop(ready, "Mc_Tar_5", "Scr_5"), ready);
});

test("all 120 card orders complete exactly once per card", () => {
  const orders = permutations(COURSE_G04_L03_TI_002_CARDS);
  assert.equal(orders.length, 120);

  for (const order of orders) {
    let state = createCourseG04L03Ti002KeyTermDragState();
    for (const [index, card] of order.entries()) {
      state = index % 2 === 0
        ? drop(select(state, card.id), card.targetId)
        : drop(state, card.targetId, card.id);
      assert.equal(state.outcome, "correct-feedback");
      assert.equal(state.locked, true);
      assert.equal(getCourseG04L03Ti002PlacementCount(state), index + 1);
      assert.equal(drop(state, card.targetId, card.id), state);

      state = finishFeedback(state);
      assert.equal(
        state.outcome,
        index === COURSE_G04_L03_TI_002_CARDS.length - 1
          ? "complete"
          : "ready",
      );
    }

    assert.equal(state.locked, true);
    assert.equal(state.feedback, COURSE_G04_L03_TI_002_COMPLETION_FEEDBACK);
    assert.equal(getCourseG04L03Ti002PlacementCount(state), 5);
    for (const card of COURSE_G04_L03_TI_002_CARDS) {
      assert.equal(state.placements[card.id], card.targetId);
      assert.equal(drop(state, card.targetId, card.id), state);
    }
  }
});

test("Reset and Replay restore the initial vector from every outcome", () => {
  const initial = createCourseG04L03Ti002KeyTermDragState();
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
      reduceCourseG04L03Ti002KeyTermDrag(state, {type: "reset"}),
      initial,
    );
    assert.deepEqual(
      reduceCourseG04L03Ti002KeyTermDrag(state, {type: "replay"}),
      initial,
    );
  }
});

test("unknown card and target identities fail closed", () => {
  const initial = createCourseG04L03Ti002KeyTermDragState();
  assert.equal(
    reduceCourseG04L03Ti002KeyTermDrag(initial, {
      type: "select-card",
      cardId: "Scr_6",
    } as never),
    initial,
  );
  assert.equal(
    reduceCourseG04L03Ti002KeyTermDrag(initial, {
      type: "drop-card",
      cardId: "Scr_6",
      targetId: "Mc_Tar_1",
    } as never),
    initial,
  );
  assert.equal(
    reduceCourseG04L03Ti002KeyTermDrag(initial, {
      type: "drop-card",
      cardId: "Scr_1",
      targetId: "Mc_Tar_6",
    } as never),
    initial,
  );
  assert.equal(drop(initial, "Mc_Tar_1"), initial);
});

test("cards, geometry, state, and placement records are immutable", () => {
  const initial = createCourseG04L03Ti002KeyTermDragState();
  const selected = select(initial, "Scr_2");
  const accepted = drop(selected, "Mc_Tar_2");

  assert.equal(Object.isFrozen(COURSE_G04_L03_TI_002_CARDS), true);
  assert.equal(Object.isFrozen(COURSE_G04_L03_TI_002_CARDS[0]), true);
  assert.equal(
    Object.isFrozen(COURSE_G04_L03_TI_002_CARDS[0]?.sourceCenter),
    true,
  );
  assert.equal(
    Object.isFrozen(COURSE_G04_L03_TI_002_CARDS[0]?.targetSize),
    true,
  );
  assert.equal(
    Object.isFrozen(COURSE_G04_L03_TI_002_CARDS[0]?.pictureCenter),
    true,
  );
  assert.equal(Object.isFrozen(COURSE_G04_L03_TI_002_SOURCE_GEOMETRY), true);
  assert.equal(
    Object.isFrozen(COURSE_G04_L03_TI_002_SOURCE_GEOMETRY.cards),
    true,
  );
  assert.equal(Object.isFrozen(COURSE_G04_L03_TI_002_CURRENT_JS_TIMING), true);
  assert.equal(Object.isFrozen(COURSE_G04_L03_TI_002_INTERACTION_AUTHORITY), true);
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

test("runtime, audio, Replay, owner, and strict gates stay closed", () => {
  const authority = COURSE_G04_L03_TI_002_INTERACTION_AUTHORITY;
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
