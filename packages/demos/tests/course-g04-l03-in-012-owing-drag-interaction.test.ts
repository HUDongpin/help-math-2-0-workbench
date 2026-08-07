import assert from "node:assert/strict";
import test from "node:test";

import {
  COURSE_G04_L03_IN_012_CARDS,
  COURSE_G04_L03_IN_012_CORRECT_FEEDBACK,
  COURSE_G04_L03_IN_012_CURRENT_JS_TIMING,
  COURSE_G04_L03_IN_012_FINAL_CORRECT_FEEDBACK,
  COURSE_G04_L03_IN_012_INSTRUCTION,
  COURSE_G04_L03_IN_012_INTERACTION_AUTHORITY,
  COURSE_G04_L03_IN_012_SOURCE_GEOMETRY,
  COURSE_G04_L03_IN_012_SOURCE_GLOSSARY_TERMS,
  COURSE_G04_L03_IN_012_WRONG_FEEDBACK,
  createCourseG04L03In012OwingDragState,
  getCourseG04L03In012PlacementCount,
  reduceCourseG04L03In012OwingDrag,
  type CourseG04L03In012CardId,
  type CourseG04L03In012OwingDragState,
  type CourseG04L03In012TargetId,
} from "../src/timelines/course-g04-l03-in-012-owing-drag-interaction";

const select = (
  state: CourseG04L03In012OwingDragState,
  cardId: CourseG04L03In012CardId,
) => reduceCourseG04L03In012OwingDrag(state, {
  type: "select-card",
  cardId,
});

const drop = (
  state: CourseG04L03In012OwingDragState,
  targetId: CourseG04L03In012TargetId,
  cardId?: CourseG04L03In012CardId,
) => cardId === undefined
  ? reduceCourseG04L03In012OwingDrag(state, {
      type: "drop-card",
      targetId,
    })
  : reduceCourseG04L03In012OwingDrag(state, {
      type: "drop-card",
      cardId,
      targetId,
    });

const finishPerCardFeedback = (
  state: CourseG04L03In012OwingDragState,
) => reduceCourseG04L03In012OwingDrag(state, {
  type: "feedback-complete",
});

const finishFinalFeedback = (
  state: CourseG04L03In012OwingDragState,
) => reduceCourseG04L03In012OwingDrag(state, {
  type: "final-feedback-complete",
});

const permutations = <T>(values: readonly T[]): T[][] => {
  if (values.length <= 1) return [[...values]];
  return values.flatMap((value, index) => permutations([
    ...values.slice(0, index),
    ...values.slice(index + 1),
  ]).map((tail) => [value, ...tail]));
};

const reachFinalFeedback =
  (): CourseG04L03In012OwingDragState => {
    let state = createCourseG04L03In012OwingDragState();
    for (const card of COURSE_G04_L03_IN_012_CARDS) {
      state = drop(state, card.targetId, card.id);
      state = finishPerCardFeedback(state);
    }
    return state;
  };

test("IN012 binds the five exact people, source strings, values, and targets", () => {
  assert.deepEqual(
    COURSE_G04_L03_IN_012_CARDS.map((card) => ({
      id: card.id,
      person: card.person,
      relation: card.relation,
      sourceText: card.sourceText,
      amountText: card.amountText,
      amount: card.amount,
      signedValue: card.signedValue,
      targetId: card.targetId,
    })),
    [
      {
        id: "Scr_1",
        person: "Josh",
        relation: "Has",
        sourceText: "Josh\rHas \r$7",
        amountText: "$7",
        amount: 7,
        signedValue: 7,
        targetId: "Mc_Tar_1",
      },
      {
        id: "Scr_2",
        person: "Ruben",
        relation: "Owes",
        sourceText: "Ruben\rOwes\r $5",
        amountText: "$5",
        amount: 5,
        signedValue: -5,
        targetId: "Mc_Tar_2",
      },
      {
        id: "Scr_3",
        person: "Carrie",
        relation: "Has",
        sourceText: "Carrie\rHas \r$4",
        amountText: "$4",
        amount: 4,
        signedValue: 4,
        targetId: "Mc_Tar_3",
      },
      {
        id: "Scr_4",
        person: "Monique",
        relation: "Owes",
        sourceText: "Monique\rOwes \r$2",
        amountText: "$2",
        amount: 2,
        signedValue: -2,
        targetId: "Mc_Tar_4",
      },
      {
        id: "Scr_5",
        person: "Van",
        relation: "Has",
        sourceText: "Van\rHas \r$1",
        amountText: "$1",
        amount: 1,
        signedValue: 1,
        targetId: "Mc_Tar_5",
      },
    ],
  );
  assert.equal(
    COURSE_G04_L03_IN_012_INSTRUCTION,
    "Drag and drop each person’s card to the correct position on the number line based on the amount of money each one has or owes.",
  );
});

test("IN012 preserves source geometry, timing projections, and disabled glossary keys", () => {
  assert.deepEqual(
    COURSE_G04_L03_IN_012_CARDS.map((card) => ({
      id: card.id,
      sourceCenter: card.sourceCenter,
      sourceSize: card.sourceSize,
      sourceBounds: card.sourceBounds,
      targetId: card.targetId,
      targetCenter: card.targetCenter,
      targetSize: card.targetSize,
      targetBounds: card.targetBounds,
    })),
    [
      {
        id: "Scr_1",
        sourceCenter: {x: 174.55, y: 413.95},
        sourceSize: {height: 79.05, width: 46.9497},
        sourceBounds: {
          left: 151.0496, top: 379.95, right: 197.9993, bottom: 459,
          width: 46.9497, height: 79.05,
        },
        targetId: "Mc_Tar_1",
        targetCenter: {x: 600.5, y: 212.95},
        targetSize: {height: 83.95, width: 72.9},
        targetBounds: {
          left: 564.05, top: 170.95, right: 636.95, bottom: 254.9,
          width: 72.9, height: 83.95,
        },
      },
      {
        id: "Scr_2",
        sourceCenter: {x: 287.55, y: 413.95},
        sourceSize: {height: 79.0005, width: 62.9502},
        sourceBounds: {
          left: 256.0611, top: 380.0213, right: 319.0113,
          bottom: 459.0218, width: 62.9502, height: 79.0005,
        },
        targetId: "Mc_Tar_2",
        targetCenter: {x: 259.5, y: 212.95},
        targetSize: {height: 83.95, width: 72.9},
        targetBounds: {
          left: 223.05, top: 170.95, right: 295.95, bottom: 254.9,
          width: 72.9, height: 83.95,
        },
      },
      {
        id: "Scr_3",
        sourceCenter: {x: 397.55, y: 413.95},
        sourceSize: {height: 79.05, width: 55.9499},
        sourceBounds: {
          left: 368.9905, top: 379.95, right: 424.9404, bottom: 459,
          width: 55.9499, height: 79.05,
        },
        targetId: "Mc_Tar_3",
        targetCenter: {x: 515.5, y: 212.95},
        targetSize: {height: 83.95, width: 72.9},
        targetBounds: {
          left: 479.05, top: 170.95, right: 551.95, bottom: 254.9,
          width: 72.9, height: 83.95,
        },
      },
      {
        id: "Scr_4",
        sourceCenter: {x: 507.5, y: 413.95},
        sourceSize: {height: 79.0005, width: 77.9504},
        sourceBounds: {
          left: 469.0626, top: 380.0213, right: 547.0129,
          bottom: 459.0218, width: 77.9504, height: 79.0005,
        },
        targetId: "Mc_Tar_4",
        targetCenter: {x: 344.5, y: 212.95},
        targetSize: {height: 83.95, width: 77.9001},
        targetBounds: {
          left: 305.05, top: 170.95, right: 382.95, bottom: 254.9,
          width: 77.9001, height: 83.95,
        },
      },
      {
        id: "Scr_5",
        sourceCenter: {x: 617.5, y: 413.95},
        sourceSize: {height: 79.05, width: 51.95},
        sourceBounds: {
          left: 592.05, top: 379.95, right: 644, bottom: 459,
          width: 51.95, height: 79.05,
        },
        targetId: "Mc_Tar_5",
        targetCenter: {x: 428.5, y: 212.95},
        targetSize: {height: 83.95, width: 72.9},
        targetBounds: {
          left: 392.05, top: 170.95, right: 464.95, bottom: 254.9,
          width: 72.9, height: 83.95,
        },
      },
    ],
  );
  assert.equal(COURSE_G04_L03_IN_012_SOURCE_GEOMETRY.frameDomain, "sprite-228");
  assert.equal(COURSE_G04_L03_IN_012_SOURCE_GEOMETRY.interactionFrame, 174);
  assert.equal(COURSE_G04_L03_IN_012_SOURCE_GEOMETRY.cleanSourceVisualFrame, 173);
  assert.equal(COURSE_G04_L03_IN_012_SOURCE_GEOMETRY.terminalFrame, 215);
  assert.equal(
    COURSE_G04_L03_IN_012_CURRENT_JS_TIMING.perCardCorrectFeedbackMs,
    1_500,
  );
  assert.equal(
    COURSE_G04_L03_IN_012_CURRENT_JS_TIMING.finalCorrectFeedbackMs,
    (23 * 1_000) / 12,
  );
  assert.deepEqual(
    COURSE_G04_L03_IN_012_SOURCE_GLOSSARY_TERMS.map((term) => ({
      visibleText: term.visibleText,
      keyAttribute: term.keyAttribute,
      bounds: term.bounds,
      hostAction: term.hostAction,
      hostContentResolved: term.hostContentResolved,
      enabled: term.enabled,
      status: term.status,
    })),
    [
      {
        visibleText: "position",
        keyAttribute: "Position",
        bounds: {x: 518, y: 89.4, width: 72.7, height: 18.6},
        hostAction: "DoHyperLinks",
        hostContentResolved: false,
        enabled: false,
        status: "safe-disabled",
      },
      {
        visibleText: "number line",
        keyAttribute: "Number line",
        bounds: {x: 62.55, y: 119.4, width: 109.65, height: 18.6},
        hostAction: "DoHyperLinks",
        hostContentResolved: false,
        enabled: false,
        status: "safe-disabled",
      },
      {
        visibleText: "owes",
        keyAttribute: "Owe",
        bounds: {x: 634.5, y: 119.4, width: 51.15, height: 18.6},
        hostAction: "DoHyperLinks",
        hostContentResolved: false,
        enabled: false,
        status: "safe-disabled",
      },
    ],
  );
});

test("IN012 starts unlocked with no selection, placement, or feedback", () => {
  const initial = createCourseG04L03In012OwingDragState();
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
  assert.equal(getCourseG04L03In012PlacementCount(initial), 0);
});

test("wrong drops preserve every placement and lock until Close", () => {
  const initial = createCourseG04L03In012OwingDragState();
  const firstCorrect = drop(initial, "Mc_Tar_5", "Scr_5");
  const readyWithPlacement = finishPerCardFeedback(firstCorrect);
  const selected = select(readyWithPlacement, "Scr_1");
  const wrong = drop(selected, "Mc_Tar_2");

  assert.equal(wrong.outcome, "wrong");
  assert.equal(wrong.locked, true);
  assert.equal(wrong.selectedCardId, null);
  assert.equal(wrong.wrongCardId, "Scr_1");
  assert.equal(wrong.lastPlacedCardId, null);
  assert.equal(wrong.attemptedTargetId, "Mc_Tar_2");
  assert.equal(wrong.feedback, COURSE_G04_L03_IN_012_WRONG_FEEDBACK);
  assert.deepEqual(wrong.placements, readyWithPlacement.placements);
  assert.equal(getCourseG04L03In012PlacementCount(wrong), 1);

  assert.equal(select(wrong, "Scr_2"), wrong);
  assert.equal(drop(wrong, "Mc_Tar_1", "Scr_1"), wrong);
  assert.equal(finishPerCardFeedback(wrong), wrong);
  assert.equal(finishFinalFeedback(wrong), wrong);

  const closed = reduceCourseG04L03In012OwingDrag(wrong, {
    type: "close-wrong",
  });
  assert.equal(closed.outcome, "ready");
  assert.equal(closed.locked, false);
  assert.equal(closed.wrongCardId, null);
  assert.equal(closed.attemptedTargetId, null);
  assert.equal(closed.feedback, null);
  assert.deepEqual(closed.placements, readyWithPlacement.placements);

  const retried = drop(closed, "Mc_Tar_1", "Scr_1");
  assert.equal(retried.outcome, "correct-feedback");
  assert.equal(retried.placements.Scr_1, "Mc_Tar_1");
});

test("correct drops are single-use and lock for the 1500 ms per-card phase", () => {
  const initial = createCourseG04L03In012OwingDragState();
  const accepted = drop(select(initial, "Scr_2"), "Mc_Tar_2");

  assert.equal(accepted.outcome, "correct-feedback");
  assert.equal(accepted.locked, true);
  assert.equal(accepted.feedback, COURSE_G04_L03_IN_012_CORRECT_FEEDBACK);
  assert.equal(accepted.lastPlacedCardId, "Scr_2");
  assert.equal(accepted.attemptedTargetId, "Mc_Tar_2");
  assert.equal(accepted.placements.Scr_2, "Mc_Tar_2");
  assert.equal(getCourseG04L03In012PlacementCount(accepted), 1);
  assert.equal(drop(accepted, "Mc_Tar_2", "Scr_2"), accepted);
  assert.equal(select(accepted, "Scr_1"), accepted);

  const ready = finishPerCardFeedback(accepted);
  assert.equal(ready.outcome, "ready");
  assert.equal(ready.locked, false);
  assert.equal(ready.feedback, null);
  assert.equal(ready.placements.Scr_2, "Mc_Tar_2");
  assert.equal(select(ready, "Scr_2"), ready);
  assert.equal(drop(ready, "Mc_Tar_2", "Scr_2"), ready);
});

test("all 120 card orders preserve the two-stage fifth-card completion", () => {
  const orders = permutations(COURSE_G04_L03_IN_012_CARDS);
  assert.equal(orders.length, 120);

  for (const order of orders) {
    let state = createCourseG04L03In012OwingDragState();
    for (const [index, card] of order.entries()) {
      state = index % 2 === 0
        ? drop(select(state, card.id), card.targetId)
        : drop(state, card.targetId, card.id);
      assert.equal(state.outcome, "correct-feedback");
      assert.equal(state.locked, true);
      assert.equal(state.feedback, COURSE_G04_L03_IN_012_CORRECT_FEEDBACK);
      assert.equal(getCourseG04L03In012PlacementCount(state), index + 1);
      assert.equal(drop(state, card.targetId, card.id), state);

      state = finishPerCardFeedback(state);
      const isFifthCard = index === COURSE_G04_L03_IN_012_CARDS.length - 1;
      assert.equal(
        state.outcome,
        isFifthCard ? "final-correct-feedback" : "ready",
      );
      assert.equal(state.locked, isFifthCard);
      assert.equal(
        state.feedback,
        isFifthCard ? COURSE_G04_L03_IN_012_FINAL_CORRECT_FEEDBACK : null,
      );
    }

    assert.equal(getCourseG04L03In012PlacementCount(state), 5);
    assert.equal(finishPerCardFeedback(state), state);
    state = finishFinalFeedback(state);
    assert.equal(state.outcome, "complete");
    assert.equal(state.locked, true);
    assert.equal(state.feedback, null);
    assert.equal(state.attemptedTargetId, null);
    for (const card of COURSE_G04_L03_IN_012_CARDS) {
      assert.equal(state.placements[card.id], card.targetId);
      assert.equal(drop(state, card.targetId, card.id), state);
    }
  }
});

test("the fifth card cannot skip either correct-feedback phase", () => {
  let state = createCourseG04L03In012OwingDragState();
  for (const card of COURSE_G04_L03_IN_012_CARDS.slice(0, 4)) {
    state = finishPerCardFeedback(drop(state, card.targetId, card.id));
  }
  const fifth = COURSE_G04_L03_IN_012_CARDS[4];
  assert.ok(fifth);

  state = drop(state, fifth.targetId, fifth.id);
  assert.equal(state.outcome, "correct-feedback");
  assert.equal(state.feedback, "Correct.");
  assert.equal(finishFinalFeedback(state), state);

  state = finishPerCardFeedback(state);
  assert.equal(state.outcome, "final-correct-feedback");
  assert.equal(state.feedback, "Correct!!!");
  assert.equal(state.locked, true);

  state = finishFinalFeedback(state);
  assert.equal(state.outcome, "complete");
  assert.equal(state.feedback, null);
  assert.equal(state.locked, true);
});

test("Replay restores the complete initial vector from every reachable phase", () => {
  const initial = createCourseG04L03In012OwingDragState();
  const selected = select(initial, "Scr_3");
  const wrong = drop(selected, "Mc_Tar_4");
  const correctFeedback = drop(initial, "Mc_Tar_3", "Scr_3");
  const readyWithPlacement = finishPerCardFeedback(correctFeedback);
  const finalCorrectFeedback = reachFinalFeedback();
  const complete = finishFinalFeedback(finalCorrectFeedback);

  for (const state of [
    initial,
    selected,
    wrong,
    correctFeedback,
    readyWithPlacement,
    finalCorrectFeedback,
    complete,
  ]) {
    const replayed = reduceCourseG04L03In012OwingDrag(state, {type: "replay"});
    assert.deepEqual(replayed, initial);
    assert.notEqual(replayed, state);
  }
});

test("unknown identities, actions, and phase-inappropriate actions fail closed", () => {
  const initial = createCourseG04L03In012OwingDragState();
  assert.equal(
    reduceCourseG04L03In012OwingDrag(initial, {
      type: "select-card",
      cardId: "Scr_6",
    } as never),
    initial,
  );
  assert.equal(
    reduceCourseG04L03In012OwingDrag(initial, {
      type: "drop-card",
      cardId: "Scr_6",
      targetId: "Mc_Tar_1",
    } as never),
    initial,
  );
  assert.equal(
    reduceCourseG04L03In012OwingDrag(initial, {
      type: "drop-card",
      cardId: "Scr_1",
      targetId: "Mc_Tar_6",
    } as never),
    initial,
  );
  assert.equal(
    reduceCourseG04L03In012OwingDrag(initial, {type: "reset"} as never),
    initial,
  );
  assert.equal(drop(initial, "Mc_Tar_1"), initial);
  assert.equal(
    reduceCourseG04L03In012OwingDrag(initial, {type: "close-wrong"}),
    initial,
  );
  assert.equal(finishPerCardFeedback(initial), initial);
  assert.equal(finishFinalFeedback(initial), initial);
});

test("cards, geometry, glossary records, timing, authority, and state are immutable", () => {
  const initial = createCourseG04L03In012OwingDragState();
  const selected = select(initial, "Scr_4");
  const accepted = drop(selected, "Mc_Tar_4");

  assert.equal(Object.isFrozen(COURSE_G04_L03_IN_012_CARDS), true);
  assert.equal(Object.isFrozen(COURSE_G04_L03_IN_012_CARDS[0]), true);
  assert.equal(Object.isFrozen(COURSE_G04_L03_IN_012_CARDS[0]?.sourceCenter), true);
  assert.equal(Object.isFrozen(COURSE_G04_L03_IN_012_CARDS[0]?.sourceBounds), true);
  assert.equal(Object.isFrozen(COURSE_G04_L03_IN_012_CARDS[0]?.targetSize), true);
  assert.equal(Object.isFrozen(COURSE_G04_L03_IN_012_SOURCE_GEOMETRY), true);
  assert.equal(Object.isFrozen(COURSE_G04_L03_IN_012_SOURCE_GEOMETRY.cards), true);
  assert.equal(Object.isFrozen(COURSE_G04_L03_IN_012_SOURCE_GEOMETRY.targets), true);
  assert.equal(Object.isFrozen(COURSE_G04_L03_IN_012_SOURCE_GLOSSARY_TERMS), true);
  assert.equal(Object.isFrozen(COURSE_G04_L03_IN_012_SOURCE_GLOSSARY_TERMS[0]), true);
  assert.equal(
    Object.isFrozen(COURSE_G04_L03_IN_012_SOURCE_GLOSSARY_TERMS[0]?.bounds),
    true,
  );
  assert.equal(Object.isFrozen(COURSE_G04_L03_IN_012_CURRENT_JS_TIMING), true);
  assert.equal(Object.isFrozen(COURSE_G04_L03_IN_012_INTERACTION_AUTHORITY), true);
  assert.equal(Object.isFrozen(initial), true);
  assert.equal(Object.isFrozen(initial.placements), true);
  assert.equal(Object.isFrozen(selected), true);
  assert.equal(Object.isFrozen(accepted), true);
  assert.equal(Object.isFrozen(accepted.placements), true);
  assert.notEqual(selected, initial);
  assert.notEqual(accepted, selected);
  assert.notEqual(accepted.placements, initial.placements);
  assert.equal(initial.selectedCardId, null);
  assert.equal(initial.placements.Scr_4, null);
});

test("current-JS implementation keeps every evidence and acceptance gate closed", () => {
  const authority = COURSE_G04_L03_IN_012_INTERACTION_AUTHORITY;
  assert.equal(
    authority.implementationKind,
    "current-javascript-pure-state-candidate",
  );
  assert.equal(
    authority.wrongFeedbackTextDisposition,
    "source-glyph-fallback-host-global-assignment-unresolved",
  );
  assert.equal(
    authority.glossaryDisposition,
    "source-hotspots-safe-disabled-host-content-unresolved",
  );
  assert.equal(authority.strictAcceptanceEffect, "none");
  for (const [name, value] of Object.entries(authority)) {
    if (typeof value === "boolean") assert.equal(value, false, name);
  }
  assert.equal(
    COURSE_G04_L03_IN_012_SOURCE_GLOSSARY_TERMS.every(
      ({enabled, hostContentResolved, status}) =>
        !enabled && !hostContentResolved && status === "safe-disabled",
    ),
    true,
  );
});
