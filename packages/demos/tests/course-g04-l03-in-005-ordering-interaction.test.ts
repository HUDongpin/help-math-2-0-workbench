import assert from "node:assert/strict";
import test from "node:test";

import {
  COURSE_G04_L03_IN_005_ORDERING_CARDS,
  COURSE_G04_L03_IN_005_ORDERING_COMPLETION_FEEDBACK,
  COURSE_G04_L03_IN_005_ORDERING_CORRECT_FEEDBACK,
  COURSE_G04_L03_IN_005_ORDERING_CURRENT_JS_TIMING,
  COURSE_G04_L03_IN_005_ORDERING_INSTRUCTION,
  COURSE_G04_L03_IN_005_ORDERING_INTERACTION_AUTHORITY,
  COURSE_G04_L03_IN_005_ORDERING_SOURCE_GEOMETRY,
  COURSE_G04_L03_IN_005_ORDERING_WRONG_FEEDBACK,
  COURSE_G04_L03_IN_005_SORTED_TARGET_IDS,
  createCourseG04L03In005CardSelectAction,
  createCourseG04L03In005OrderingState,
  createCourseG04L03In005RealDragPlaceAction,
  createCourseG04L03In005SelectedPlaceAction,
  getCourseG04L03In005OrderingPlacementCount,
  reduceCourseG04L03In005OrderingInteraction,
  type CourseG04L03In005CardId,
  type CourseG04L03In005OrderingCard,
  type CourseG04L03In005OrderingState,
  type CourseG04L03In005TargetId,
} from "../src/timelines/course-g04-l03-in-005-ordering-interaction";

const select = (
  state: CourseG04L03In005OrderingState,
  cardId: CourseG04L03In005CardId,
) => reduceCourseG04L03In005OrderingInteraction(
  state,
  createCourseG04L03In005CardSelectAction(cardId),
);

const placeSelected = (
  state: CourseG04L03In005OrderingState,
  targetId: CourseG04L03In005TargetId,
) => reduceCourseG04L03In005OrderingInteraction(
  state,
  createCourseG04L03In005SelectedPlaceAction(targetId),
);

const realDrag = (
  state: CourseG04L03In005OrderingState,
  cardId: CourseG04L03In005CardId,
  targetId: CourseG04L03In005TargetId,
) => reduceCourseG04L03In005OrderingInteraction(
  state,
  createCourseG04L03In005RealDragPlaceAction(cardId, targetId),
);

const finishFeedback = (
  state: CourseG04L03In005OrderingState,
) => reduceCourseG04L03In005OrderingInteraction(state, {
  type: "feedback-complete",
});

const permutations = <T>(values: readonly T[]): T[][] => {
  if (values.length <= 1) return [[...values]];
  return values.flatMap((value, index) => permutations([
    ...values.slice(0, index),
    ...values.slice(index + 1),
  ]).map((tail) => [value, ...tail]));
};

const completeInSourceOrder = (): CourseG04L03In005OrderingState => {
  let state = createCourseG04L03In005OrderingState();
  for (const card of COURSE_G04_L03_IN_005_ORDERING_CARDS) {
    state = realDrag(state, card.id, card.targetId);
    state = finishFeedback(state);
  }
  return state;
};

test("IN005 binds all seven exact source card/value/target mappings", () => {
  assert.deepEqual(
    COURSE_G04_L03_IN_005_ORDERING_CARDS.map((card) => ({
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
        valueText: "9",
        numericValue: 9,
        accessibleLabel: "9",
        targetId: "Mc_Tar_2",
      },
      {
        id: "Scr_3",
        valueText: "-6",
        numericValue: -6,
        accessibleLabel: "negative 6",
        targetId: "Mc_Tar_3",
      },
      {
        id: "Scr_4",
        valueText: "4",
        numericValue: 4,
        accessibleLabel: "4",
        targetId: "Mc_Tar_4",
      },
      {
        id: "Scr_5",
        valueText: "1",
        numericValue: 1,
        accessibleLabel: "1",
        targetId: "Mc_Tar_5",
      },
      {
        id: "Scr_6",
        valueText: "-5",
        numericValue: -5,
        accessibleLabel: "negative 5",
        targetId: "Mc_Tar_6",
      },
      {
        id: "Scr_7",
        valueText: "-1",
        numericValue: -1,
        accessibleLabel: "negative 1",
        targetId: "Mc_Tar_7",
      },
    ],
  );
  assert.equal(
    COURSE_G04_L03_IN_005_ORDERING_INSTRUCTION,
    "Drag and drop each number in order from least to greatest.",
  );
});

test("IN005 preserves frame-144 geometry and the exact sorted target slots", () => {
  assert.deepEqual(
    COURSE_G04_L03_IN_005_ORDERING_CARDS.map((card) => ({
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
        sourceCenter: {x: 172, y: 360},
        sourceSize: {height: 32, width: 32},
        targetId: "Mc_Tar_1",
        targetCenter: {x: 383, y: 233.1},
        targetSize: {height: 48, width: 52},
      },
      {
        id: "Scr_2",
        sourceCenter: {x: 244.15, y: 360},
        sourceSize: {height: 32, width: 32},
        targetId: "Mc_Tar_2",
        targetCenter: {x: 600.95, y: 233.1},
        targetSize: {height: 48.2, width: 52.2},
      },
      {
        id: "Scr_3",
        sourceCenter: {x: 316.3, y: 360},
        sourceSize: {height: 32, width: 32},
        targetId: "Mc_Tar_3",
        targetCenter: {x: 167, y: 233.1},
        targetSize: {height: 48.5, width: 52},
      },
      {
        id: "Scr_4",
        sourceCenter: {x: 388.45, y: 360},
        sourceSize: {height: 32, width: 32},
        targetId: "Mc_Tar_4",
        targetCenter: {x: 526.95, y: 233.1},
        targetSize: {height: 48, width: 52.2},
      },
      {
        id: "Scr_5",
        sourceCenter: {x: 460.6, y: 360},
        sourceSize: {height: 32, width: 32},
        targetId: "Mc_Tar_5",
        targetCenter: {x: 454.95, y: 233.1},
        targetSize: {height: 48, width: 51.8},
      },
      {
        id: "Scr_6",
        sourceCenter: {x: 532.75, y: 360},
        sourceSize: {height: 32, width: 32},
        targetId: "Mc_Tar_6",
        targetCenter: {x: 237, y: 233.1},
        targetSize: {height: 48, width: 51.75},
      },
      {
        id: "Scr_7",
        sourceCenter: {x: 604.9, y: 360},
        sourceSize: {height: 32, width: 32},
        targetId: "Mc_Tar_7",
        targetCenter: {x: 310, y: 233.1},
        targetSize: {height: 48.2, width: 51.8},
      },
    ],
  );
  assert.deepEqual(COURSE_G04_L03_IN_005_SORTED_TARGET_IDS, [
    "Mc_Tar_3",
    "Mc_Tar_6",
    "Mc_Tar_7",
    "Mc_Tar_1",
    "Mc_Tar_5",
    "Mc_Tar_4",
    "Mc_Tar_2",
  ]);
  assert.deepEqual(
    [...COURSE_G04_L03_IN_005_ORDERING_CARDS]
      .sort((left, right) => left.targetCenter.x - right.targetCenter.x)
      .map(({targetId}) => targetId),
    COURSE_G04_L03_IN_005_SORTED_TARGET_IDS,
  );
  assert.deepEqual(COURSE_G04_L03_IN_005_ORDERING_SOURCE_GEOMETRY, {
    stage: {width: 800, height: 600},
    rootPlacement: {x: 413.4, y: 283.3},
    frameDomain: "sprite-80",
    interactionFrame: 144,
    cleanSourceVisualFrame: 143,
    cards: {
      Scr_1: {
        center: {x: 172, y: 360},
        size: {height: 32, width: 32},
      },
      Scr_2: {
        center: {x: 244.15, y: 360},
        size: {height: 32, width: 32},
      },
      Scr_3: {
        center: {x: 316.3, y: 360},
        size: {height: 32, width: 32},
      },
      Scr_4: {
        center: {x: 388.45, y: 360},
        size: {height: 32, width: 32},
      },
      Scr_5: {
        center: {x: 460.6, y: 360},
        size: {height: 32, width: 32},
      },
      Scr_6: {
        center: {x: 532.75, y: 360},
        size: {height: 32, width: 32},
      },
      Scr_7: {
        center: {x: 604.9, y: 360},
        size: {height: 32, width: 32},
      },
    },
    targets: {
      Mc_Tar_1: {
        center: {x: 383, y: 233.1},
        size: {height: 48, width: 52},
      },
      Mc_Tar_2: {
        center: {x: 600.95, y: 233.1},
        size: {height: 48.2, width: 52.2},
      },
      Mc_Tar_3: {
        center: {x: 167, y: 233.1},
        size: {height: 48.5, width: 52},
      },
      Mc_Tar_4: {
        center: {x: 526.95, y: 233.1},
        size: {height: 48, width: 52.2},
      },
      Mc_Tar_5: {
        center: {x: 454.95, y: 233.1},
        size: {height: 48, width: 51.8},
      },
      Mc_Tar_6: {
        center: {x: 237, y: 233.1},
        size: {height: 48, width: 51.75},
      },
      Mc_Tar_7: {
        center: {x: 310, y: 233.1},
        size: {height: 48.2, width: 51.8},
      },
    },
  });
  assert.equal(
    COURSE_G04_L03_IN_005_ORDERING_CURRENT_JS_TIMING.correctFeedbackMs,
    (19 * 1_000) / 12,
  );
});

test("IN005 starts as an immutable, unlocked seven-card state", () => {
  const initial = createCourseG04L03In005OrderingState();
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
  assert.equal(getCourseG04L03In005OrderingPlacementCount(initial), 0);
  assert.equal(Object.isFrozen(initial), true);
  assert.equal(Object.isFrozen(initial.placements), true);
});

test("frozen card-select, selected-place, and real-drag adapters share one reducer", () => {
  const selectAction = createCourseG04L03In005CardSelectAction("Scr_1");
  const selectedPlaceAction =
    createCourseG04L03In005SelectedPlaceAction("Mc_Tar_1");
  const realDragAction =
    createCourseG04L03In005RealDragPlaceAction("Scr_2", "Mc_Tar_2");

  assert.deepEqual(selectAction, {type: "select-card", cardId: "Scr_1"});
  assert.deepEqual(selectedPlaceAction, {
    type: "drop-card",
    targetId: "Mc_Tar_1",
  });
  assert.deepEqual(realDragAction, {
    type: "drop-card",
    cardId: "Scr_2",
    targetId: "Mc_Tar_2",
  });
  assert.equal(Object.isFrozen(selectAction), true);
  assert.equal(Object.isFrozen(selectedPlaceAction), true);
  assert.equal(Object.isFrozen(realDragAction), true);

  let state = createCourseG04L03In005OrderingState();
  state = reduceCourseG04L03In005OrderingInteraction(state, selectAction);
  state = reduceCourseG04L03In005OrderingInteraction(
    state,
    selectedPlaceAction,
  );
  assert.equal(state.placements.Scr_1, "Mc_Tar_1");
  state = finishFeedback(state);
  state = reduceCourseG04L03In005OrderingInteraction(state, realDragAction);
  assert.equal(state.placements.Scr_2, "Mc_Tar_2");
});

test("wrong placement preserves placements and locks until Close", () => {
  const initial = createCourseG04L03In005OrderingState();
  const selected = select(initial, "Scr_1");
  const wrong = placeSelected(selected, "Mc_Tar_2");

  assert.equal(wrong.outcome, "wrong");
  assert.equal(wrong.locked, true);
  assert.equal(wrong.selectedCardId, null);
  assert.equal(wrong.wrongCardId, "Scr_1");
  assert.equal(wrong.lastPlacedCardId, null);
  assert.equal(wrong.attemptedTargetId, "Mc_Tar_2");
  assert.equal(
    wrong.feedback,
    "Order these numbers from least to greatest. Try again.",
  );
  assert.equal(
    wrong.feedback,
    COURSE_G04_L03_IN_005_ORDERING_WRONG_FEEDBACK,
  );
  assert.deepEqual(wrong.placements, initial.placements);
  assert.equal(getCourseG04L03In005OrderingPlacementCount(wrong), 0);

  assert.equal(select(wrong, "Scr_2"), wrong);
  assert.equal(realDrag(wrong, "Scr_1", "Mc_Tar_1"), wrong);
  assert.equal(finishFeedback(wrong), wrong);

  const closed = reduceCourseG04L03In005OrderingInteraction(wrong, {
    type: "close-wrong",
  });
  assert.equal(closed.outcome, "ready");
  assert.equal(closed.locked, false);
  assert.equal(closed.wrongCardId, null);
  assert.equal(closed.attemptedTargetId, null);
  assert.equal(closed.feedback, null);
  assert.deepEqual(closed.placements, initial.placements);

  const retried = realDrag(closed, "Scr_1", "Mc_Tar_1");
  assert.equal(retried.outcome, "correct-feedback");
  assert.equal(retried.placements.Scr_1, "Mc_Tar_1");
});

test("every correct card is single-use and locks until feedback completes", () => {
  const initial = createCourseG04L03In005OrderingState();
  const accepted = realDrag(initial, "Scr_7", "Mc_Tar_7");

  assert.equal(accepted.outcome, "correct-feedback");
  assert.equal(accepted.locked, true);
  assert.equal(
    accepted.feedback,
    COURSE_G04_L03_IN_005_ORDERING_CORRECT_FEEDBACK,
  );
  assert.equal(accepted.lastPlacedCardId, "Scr_7");
  assert.equal(accepted.attemptedTargetId, "Mc_Tar_7");
  assert.equal(accepted.placements.Scr_7, "Mc_Tar_7");
  assert.equal(getCourseG04L03In005OrderingPlacementCount(accepted), 1);
  assert.equal(realDrag(accepted, "Scr_7", "Mc_Tar_7"), accepted);
  assert.equal(select(accepted, "Scr_1"), accepted);

  const ready = finishFeedback(accepted);
  assert.equal(ready.outcome, "ready");
  assert.equal(ready.locked, false);
  assert.equal(ready.feedback, null);
  assert.equal(ready.placements.Scr_7, "Mc_Tar_7");
  assert.equal(select(ready, "Scr_7"), ready);
  assert.equal(realDrag(ready, "Scr_7", "Mc_Tar_7"), ready);
});

test("all 5040 arbitrary card orders complete by suffix mapping", () => {
  const orders = permutations(COURSE_G04_L03_IN_005_ORDERING_CARDS);
  assert.equal(orders.length, 5_040);

  for (const order of orders) {
    let state = createCourseG04L03In005OrderingState();
    for (const [index, card] of order.entries()) {
      state = index % 2 === 0
        ? placeSelected(select(state, card.id), card.targetId)
        : realDrag(state, card.id, card.targetId);
      assert.equal(state.outcome, "correct-feedback");
      assert.equal(state.locked, true);
      assert.equal(
        getCourseG04L03In005OrderingPlacementCount(state),
        index + 1,
      );
      assert.equal(realDrag(state, card.id, card.targetId), state);

      state = finishFeedback(state);
      assert.equal(
        state.outcome,
        index === COURSE_G04_L03_IN_005_ORDERING_CARDS.length - 1
          ? "complete"
          : "ready",
      );
    }

    assert.equal(state.locked, true);
    assert.equal(
      state.feedback,
      COURSE_G04_L03_IN_005_ORDERING_COMPLETION_FEEDBACK,
    );
    assert.equal(getCourseG04L03In005OrderingPlacementCount(state), 7);
    for (const card of COURSE_G04_L03_IN_005_ORDERING_CARDS) {
      assert.equal(state.placements[card.id], card.targetId);
      assert.equal(realDrag(state, card.id, card.targetId), state);
    }
  }
});

test("the seventh card enters exact persistent Correct!!! completion", () => {
  let state = createCourseG04L03In005OrderingState();
  for (const card of COURSE_G04_L03_IN_005_ORDERING_CARDS.slice(0, -1)) {
    state = realDrag(state, card.id, card.targetId);
    state = finishFeedback(state);
  }

  const seventh = COURSE_G04_L03_IN_005_ORDERING_CARDS.at(-1);
  assert.ok(seventh);
  state = realDrag(state, seventh.id, seventh.targetId);
  assert.equal(state.outcome, "correct-feedback");
  assert.equal(
    state.feedback,
    COURSE_G04_L03_IN_005_ORDERING_CORRECT_FEEDBACK,
  );

  const complete = finishFeedback(state);
  assert.equal(complete.outcome, "complete");
  assert.equal(complete.locked, true);
  assert.equal(complete.feedback, "Correct!!!");
  assert.equal(
    complete.feedback,
    COURSE_G04_L03_IN_005_ORDERING_COMPLETION_FEEDBACK,
  );
  assert.equal(
    reduceCourseG04L03In005OrderingInteraction(complete, {
      type: "feedback-complete",
    }),
    complete,
  );
  assert.equal(
    reduceCourseG04L03In005OrderingInteraction(complete, {
      type: "close-wrong",
    }),
    complete,
  );
});

test("Replay fully resets every state vector without claiming parity", () => {
  const initial = createCourseG04L03In005OrderingState();
  const selected = select(initial, "Scr_3");
  const wrong = placeSelected(selected, "Mc_Tar_4");
  const correctFeedback = realDrag(initial, "Scr_3", "Mc_Tar_3");
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
      reduceCourseG04L03In005OrderingInteraction(state, {type: "replay"}),
      initial,
    );
    assert.deepEqual(
      reduceCourseG04L03In005OrderingInteraction(state, {type: "reset"}),
      initial,
    );
  }
});

test("unknown identities and unsupported local controls fail closed", () => {
  const initial = createCourseG04L03In005OrderingState();
  assert.equal(
    reduceCourseG04L03In005OrderingInteraction(initial, {
      type: "select-card",
      cardId: "Scr_8",
    } as never),
    initial,
  );
  assert.equal(
    reduceCourseG04L03In005OrderingInteraction(initial, {
      type: "drop-card",
      cardId: "Scr_8",
      targetId: "Mc_Tar_1",
    } as never),
    initial,
  );
  assert.equal(
    reduceCourseG04L03In005OrderingInteraction(initial, {
      type: "drop-card",
      cardId: "Scr_1",
      targetId: "Mc_Tar_8",
    } as never),
    initial,
  );
  assert.equal(placeSelected(initial, "Mc_Tar_1"), initial);
  for (const type of ["clear", "new-number", "help"]) {
    assert.equal(
      reduceCourseG04L03In005OrderingInteraction(initial, {type} as never),
      initial,
    );
  }
});

test("cards, geometry, states, placements, and adapters stay immutable", () => {
  const initial = createCourseG04L03In005OrderingState();
  const selected = select(initial, "Scr_2");
  const accepted = placeSelected(selected, "Mc_Tar_2");

  assert.equal(Object.isFrozen(COURSE_G04_L03_IN_005_ORDERING_CARDS), true);
  assert.equal(Object.isFrozen(COURSE_G04_L03_IN_005_ORDERING_CARDS[0]), true);
  assert.equal(
    Object.isFrozen(
      COURSE_G04_L03_IN_005_ORDERING_CARDS[0]?.sourceCenter,
    ),
    true,
  );
  assert.equal(
    Object.isFrozen(
      COURSE_G04_L03_IN_005_ORDERING_CARDS[0]?.targetSize,
    ),
    true,
  );
  assert.equal(
    Object.isFrozen(COURSE_G04_L03_IN_005_SORTED_TARGET_IDS),
    true,
  );
  assert.equal(
    Object.isFrozen(COURSE_G04_L03_IN_005_ORDERING_SOURCE_GEOMETRY),
    true,
  );
  assert.equal(
    Object.isFrozen(COURSE_G04_L03_IN_005_ORDERING_SOURCE_GEOMETRY.cards),
    true,
  );
  assert.equal(
    Object.isFrozen(COURSE_G04_L03_IN_005_ORDERING_CURRENT_JS_TIMING),
    true,
  );
  assert.equal(
    Object.isFrozen(
      COURSE_G04_L03_IN_005_ORDERING_INTERACTION_AUTHORITY,
    ),
    true,
  );
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

test("current-JS, runtime, audio, Replay, owner, and strict gates stay closed", () => {
  const authority =
    COURSE_G04_L03_IN_005_ORDERING_INTERACTION_AUTHORITY;

  assert.equal(
    authority.implementationKind,
    "current-javascript-pure-state-candidate",
  );
  assert.equal(
    authority.wrongFeedbackTextDisposition,
    "authored-fallback-host-global-unresolved",
  );
  assert.equal(
    authority.completionFeedbackTextDisposition,
    "source-authored-exact-modern-persistent",
  );
  assert.equal(
    authority.correctFeedbackTimerDisposition,
    "current-javascript-projection-not-original-runtime-trace",
  );
  assert.equal(
    authority.replayDisposition,
    "modern-full-reset-not-original-runtime-parity",
  );

  for (const [name, value] of Object.entries(authority)) {
    if (
      name === "evidenceBasis"
      || name === "implementationKind"
      || name.endsWith("Disposition")
      || name === "strictAcceptanceEffect"
    ) continue;
    assert.equal(value, false, name);
  }
  assert.equal(authority.strictAcceptanceEffect, "none");
});

test("ordering is bound by authored suffix identities, not action sequence", () => {
  const byId = new Map<CourseG04L03In005CardId,
    CourseG04L03In005OrderingCard>(
    COURSE_G04_L03_IN_005_ORDERING_CARDS.map((card) => [card.id, card]),
  );
  const actionOrder: readonly CourseG04L03In005CardId[] = [
    "Scr_2",
    "Scr_5",
    "Scr_3",
    "Scr_7",
    "Scr_1",
    "Scr_6",
    "Scr_4",
  ];

  let state = createCourseG04L03In005OrderingState();
  for (const cardId of actionOrder) {
    const card = byId.get(cardId);
    assert.ok(card);
    state = realDrag(state, card.id, card.targetId);
    state = finishFeedback(state);
  }

  assert.equal(state.outcome, "complete");
  assert.deepEqual(
    COURSE_G04_L03_IN_005_SORTED_TARGET_IDS.map((targetId) => {
      const card = COURSE_G04_L03_IN_005_ORDERING_CARDS.find(
        ({targetId: cardTargetId}) => cardTargetId === targetId,
      );
      return card?.numericValue;
    }),
    [-6, -5, -1, 0, 1, 4, 9],
  );
});
