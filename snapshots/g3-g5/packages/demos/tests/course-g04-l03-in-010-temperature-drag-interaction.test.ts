import assert from "node:assert/strict";
import test from "node:test";

import {
  COURSE_G04_L03_IN_010_ASSISTIVE_CORRECT_FEEDBACK,
  COURSE_G04_L03_IN_010_CARDS,
  COURSE_G04_L03_IN_010_CURRENT_JS_TIMING,
  COURSE_G04_L03_IN_010_FINAL_CORRECT_FEEDBACK,
  COURSE_G04_L03_IN_010_FIXED_REFERENCE,
  COURSE_G04_L03_IN_010_INPUT_METHODS,
  COURSE_G04_L03_IN_010_INSTRUCTION,
  COURSE_G04_L03_IN_010_INTERACTION_AUTHORITY,
  COURSE_G04_L03_IN_010_SOURCE_GEOMETRY,
  COURSE_G04_L03_IN_010_SOURCE_GLOSSARY_TERMS,
  COURSE_G04_L03_IN_010_WRONG_FEEDBACK,
  createCourseG04L03In010TemperatureDragState,
  getCourseG04L03In010PlacementCount,
  reduceCourseG04L03In010TemperatureDrag,
  type CourseG04L03In010CardId,
  type CourseG04L03In010TargetId,
  type CourseG04L03In010TemperatureDragState,
} from "../src/timelines/course-g04-l03-in-010-temperature-drag-interaction";

const select = (
  state: CourseG04L03In010TemperatureDragState,
  cardId: CourseG04L03In010CardId,
) => reduceCourseG04L03In010TemperatureDrag(state, {
  type: "select-card",
  cardId,
});

const drop = (
  state: CourseG04L03In010TemperatureDragState,
  targetId: CourseG04L03In010TargetId,
  cardId?: CourseG04L03In010CardId,
) => cardId === undefined
  ? reduceCourseG04L03In010TemperatureDrag(state, {
      type: "drop-card",
      targetId,
    })
  : reduceCourseG04L03In010TemperatureDrag(state, {
      type: "drop-card",
      cardId,
      targetId,
    });

const closeWrong = (
  state: CourseG04L03In010TemperatureDragState,
) => reduceCourseG04L03In010TemperatureDrag(state, {
  type: "close-wrong",
});

const finishPerCardFeedback = (
  state: CourseG04L03In010TemperatureDragState,
) => reduceCourseG04L03In010TemperatureDrag(state, {
  type: "feedback-complete",
});

const finishFinalFeedback = (
  state: CourseG04L03In010TemperatureDragState,
) => reduceCourseG04L03In010TemperatureDrag(state, {
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
  (): CourseG04L03In010TemperatureDragState => {
    let state = createCourseG04L03In010TemperatureDragState();
    for (const card of COURSE_G04_L03_IN_010_CARDS) {
      state = drop(state, card.targetId, card.id);
      state = finishPerCardFeedback(state);
    }
    return state;
  };

test("IN010 binds the six exact SWF suffix mappings and fixed reference", () => {
  assert.deepEqual(
    COURSE_G04_L03_IN_010_CARDS.map((card) => ({
      id: card.id,
      suffix: card.suffix,
      city: card.city,
      temperature: card.temperature,
      displayText: card.displayText,
      sourceAuthoringText: card.sourceAuthoringText,
      sourceTextDisposition: card.sourceTextDisposition,
      sourceObjectId: card.sourceObjectId,
      sourceDepth: card.sourceDepth,
      targetId: card.targetId,
      targetObjectId: card.targetObjectId,
      targetDepth: card.targetDepth,
      targetText: card.targetText,
    })),
    [
      {
        id: "Src_1",
        suffix: 1,
        city: "Seattle",
        temperature: 51,
        displayText: "Seattle, WA: 51° F",
        sourceAuthoringText: "Seattle, WA: 51° F",
        sourceTextDisposition: "direct-authoring-text",
        sourceObjectId: 70,
        sourceDepth: 83,
        targetId: "Mc_Tar_1",
        targetObjectId: 63,
        targetDepth: 71,
        targetText: "Seattle, WA: 51° F",
      },
      {
        id: "Src_2",
        suffix: 2,
        city: "Chicago",
        temperature: -4,
        displayText: "Chicago, IL: -4° F",
        sourceAuthoringText: "Chicago, IL:  4° F",
        sourceTextDisposition: "authoring-text-plus-separate-minus-glyph",
        sourceObjectId: 75,
        sourceDepth: 99,
        targetId: "Mc_Tar_2",
        targetObjectId: 58,
        targetDepth: 63,
        targetText: "Chicago, IL: -4° F",
      },
      {
        id: "Src_4",
        suffix: 4,
        city: "Fraser",
        temperature: -18,
        displayText: "Fraser, CO -18°F",
        sourceAuthoringText: "Fraser, CO  18°F",
        sourceTextDisposition: "authoring-text-plus-separate-minus-glyph",
        sourceObjectId: 71,
        sourceDepth: 86,
        targetId: "Mc_Tar_4",
        targetObjectId: 61,
        targetDepth: 67,
        targetText: "Fraser, CO -18°F",
      },
      {
        id: "Src_5",
        suffix: 5,
        city: "Reno",
        temperature: 33,
        displayText: "Reno, NV: 33° F",
        sourceAuthoringText: "Reno, NV: 33° F",
        sourceTextDisposition: "direct-authoring-text",
        sourceObjectId: 72,
        sourceDepth: 90,
        targetId: "Mc_Tar_5",
        targetObjectId: 55,
        targetDepth: 59,
        targetText: "Reno, NV: 33° F",
      },
      {
        id: "Src_6",
        suffix: 6,
        city: "Pittsburgh",
        temperature: 34,
        displayText: "Pittsburgh, PA: 34° F",
        sourceAuthoringText: "Pittsburgh, PA: 34° F",
        sourceTextDisposition: "direct-authoring-text",
        sourceObjectId: 73,
        sourceDepth: 93,
        targetId: "Mc_Tar_6",
        targetObjectId: 69,
        targetDepth: 79,
        targetText: "Pittsburgh, PA: 34° F",
      },
      {
        id: "Src_7",
        suffix: 7,
        city: "Houston",
        temperature: 80,
        displayText: "Houston, TX: 80° F",
        sourceAuthoringText: "Houston, TX: 80° F",
        sourceTextDisposition: "direct-authoring-text",
        sourceObjectId: 74,
        sourceDepth: 96,
        targetId: "Mc_Tar_7",
        targetObjectId: 66,
        targetDepth: 75,
        targetText: "Houston, TX: 80° F",
      },
    ],
  );
  assert.deepEqual(
    COURSE_G04_L03_IN_010_CARDS.map(({suffix}) => suffix),
    [1, 2, 4, 5, 6, 7],
  );
  assert.deepEqual(COURSE_G04_L03_IN_010_FIXED_REFERENCE, {
    text: "New York, NY: 43° F",
    temperature: 43,
    role: "fixed-non-draggable-reference",
    draggableSuffix: null,
  });
});

test("IN010 preserves exact instruction, unresolved wrong copy, and final copy", () => {
  assert.equal(
    COURSE_G04_L03_IN_010_INSTRUCTION,
    "Drag and drop each city and temperature to the correct degree on the thermometer.",
  );
  assert.deepEqual(COURSE_G04_L03_IN_010_WRONG_FEEDBACK, {
    hostVariable: "_global.WrongFeed",
    resolvedHostText: null,
    canvasStaticGlyph: "Try Again!",
    canvasStaticGlyphMaySubstituteForHostText: false,
    closeLabel: "Close",
    dismissal: "explicit-close",
  });
  assert.equal(
    COURSE_G04_L03_IN_010_ASSISTIVE_CORRECT_FEEDBACK,
    "Correct.",
  );
  assert.equal(
    COURSE_G04_L03_IN_010_FINAL_CORRECT_FEEDBACK,
    "Correct!!!",
  );
});

test("IN010 retains FLA-derived candidate bounds without promoting frame 263", () => {
  assert.deepEqual(
    COURSE_G04_L03_IN_010_CARDS.map((card) => ({
      id: card.id,
      sourceCenter: card.sourceCenter,
      sourceBounds: card.sourceBounds,
      targetId: card.targetId,
      targetCenter: card.targetCenter,
      targetBounds: card.targetBounds,
    })),
    [
      {
        id: "Src_1",
        sourceCenter: {x: 236.6, y: 155.9},
        sourceBounds: {
          left: 174.075, top: 143.725, right: 299.125, bottom: 168.075,
          width: 125.05, height: 24.35,
        },
        targetId: "Mc_Tar_1",
        targetCenter: {x: 155.45, y: 245.45},
        targetBounds: {
          left: 86.525, top: 237.45, right: 224.375, bottom: 253.45,
          width: 137.85, height: 16,
        },
      },
      {
        id: "Src_2",
        sourceCenter: {x: 518.9, y: 263.35},
        sourceBounds: {
          left: 463.15, top: 254.675, right: 574.65, bottom: 272.025,
          width: 111.5, height: 17.35,
        },
        targetId: "Mc_Tar_2",
        targetCenter: {x: 144.55, y: 393},
        targetBounds: {
          left: 80.95, top: 383.825, right: 208.15, bottom: 402.175,
          width: 127.2, height: 18.35,
        },
      },
      {
        id: "Src_4",
        sourceCenter: {x: 362, y: 276.85},
        sourceBounds: {
          left: 306.25, top: 268.175, right: 417.75, bottom: 285.525,
          width: 111.5, height: 17.35,
        },
        targetId: "Mc_Tar_4",
        targetCenter: {x: 147.8, y: 431},
        targetBounds: {
          left: 87.825, top: 422.95, right: 207.775, bottom: 439.05,
          width: 119.95, height: 16.1,
        },
      },
      {
        id: "Src_5",
        sourceCenter: {x: 240.9, y: 246.8},
        sourceBounds: {
          left: 185.15, top: 238.125, right: 296.65, bottom: 255.475,
          width: 111.5, height: 17.35,
        },
        targetId: "Mc_Tar_5",
        targetCenter: {x: 144.45, y: 297.85},
        targetBounds: {
          left: 86.65, top: 289.85, right: 202.25, bottom: 305.85,
          width: 115.6, height: 16,
        },
      },
      {
        id: "Src_6",
        sourceCenter: {x: 622.825, y: 247.325},
        sourceBounds: {
          left: 564.9, top: 238.65, right: 680.75, bottom: 256,
          width: 115.85, height: 17.35,
        },
        targetId: "Mc_Tar_6",
        targetCenter: {x: 156.95, y: 285},
        targetBounds: {
          left: 86.1, top: 274.825, right: 227.8, bottom: 295.175,
          width: 141.7, height: 20.35,
        },
      },
      {
        id: "Src_7",
        sourceCenter: {x: 431.7, y: 368.6},
        sourceBounds: {
          left: 375.95, top: 359.925, right: 487.45, bottom: 377.275,
          width: 111.5, height: 17.35,
        },
        targetId: "Mc_Tar_7",
        targetCenter: {x: 152.9, y: 164.45},
        targetBounds: {
          left: 86.975, top: 156.45, right: 218.825, bottom: 172.45,
          width: 131.85, height: 16,
        },
      },
    ],
  );

  const geometry = COURSE_G04_L03_IN_010_SOURCE_GEOMETRY;
  assert.deepEqual(geometry.stage, {width: 800, height: 600});
  assert.deepEqual(geometry.rootPlacement, {x: 413.4, y: 283.3});
  assert.equal(geometry.frameDomain, "sprite-90");
  assert.equal(geometry.frameCount, 264);
  assert.equal(geometry.interactionFrame, 264);
  assert.equal(geometry.initialInteractionDonorFrame, 263);
  assert.equal(geometry.postDropVisualDonorFrame, null);
  assert.equal(
    geometry.postDropVisualDisposition,
    "frame-263-is-initial-only-object-filtered-or-reconstructed-underlay-required",
  );
  assert.deepEqual(geometry.instructionBounds, {
    left: 60.9,
    top: 83.65,
    right: 730.4,
    bottom: 105.65,
    width: 669.5,
    height: 22,
  });

  const reno = geometry.targets.Mc_Tar_5.bounds;
  const pittsburgh = geometry.targets.Mc_Tar_6.bounds;
  assert.ok(
    Math.abs(
      (
        Math.min(reno.bottom, pittsburgh.bottom)
        - Math.max(reno.top, pittsburgh.top)
      ) - 5.325
    ) < Number.EPSILON * 100,
  );
});

test("IN010 retains disabled glossary hotspots and projected timing windows", () => {
  assert.deepEqual(
    COURSE_G04_L03_IN_010_SOURCE_GLOSSARY_TERMS.map((term) => ({
      id: term.id,
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
        id: "temperature",
        visibleText: "temperature",
        keyAttribute: "Temperature",
        bounds: {x: 286.45, y: 90.4, width: 94.55, height: 15.7},
        hostAction: "DoHyperLinks",
        hostContentResolved: false,
        enabled: false,
        status: "safe-disabled",
      },
      {
        id: "thermometer",
        visibleText: "thermometer",
        keyAttribute: "Thermometer",
        bounds: {x: 606, y: 90.4, width: 99.45, height: 15.7},
        hostAction: "DoHyperLinks",
        hostContentResolved: false,
        enabled: false,
        status: "safe-disabled",
      },
    ],
  );
  assert.deepEqual(COURSE_G04_L03_IN_010_CURRENT_JS_TIMING, {
    perCardCorrectFeedbackMs: 1_500,
    perCardFrameDomain: "sprite-89",
    perCardFirstFrame: 2,
    perCardLastVisualFrame: 19,
    perCardEnableButtonFrame: 20,
    wrongFrameDomain: "sprite-87",
    wrongFirstFrame: 2,
    wrongStopFrame: 15,
    wrongDismissal: "explicit-close",
    finalCorrectFeedbackMs: (23 * 1_000) / 12,
    finalFrameDomain: "sprite-52",
    finalFirstFrame: 2,
    finalLastVisualFrame: 24,
    finalTerminalScriptFrame: 25,
  });
  assert.deepEqual(COURSE_G04_L03_IN_010_INPUT_METHODS, [
    "html-drag",
    "select-card-then-target",
  ]);
});

test("IN010 starts unlocked with no selection, placement, or feedback", () => {
  const initial = createCourseG04L03In010TemperatureDragState();
  assert.deepEqual(initial, {
    placements: {
      Src_1: null,
      Src_2: null,
      Src_4: null,
      Src_5: null,
      Src_6: null,
      Src_7: null,
    },
    selectedCardId: null,
    wrongCardId: null,
    lastPlacedCardId: null,
    attemptedTargetId: null,
    outcome: "ready",
    locked: false,
    feedback: null,
  });
  assert.equal(getCourseG04L03In010PlacementCount(initial), 0);
});

test("all 6 by 6 card-target pairs use exact suffix matching in both input modes", () => {
  let pairCount = 0;
  for (const card of COURSE_G04_L03_IN_010_CARDS) {
    for (const target of COURSE_G04_L03_IN_010_CARDS) {
      pairCount++;
      for (const inputMode of COURSE_G04_L03_IN_010_INPUT_METHODS) {
        const initial = createCourseG04L03In010TemperatureDragState();
        const attempted = inputMode === "html-drag"
          ? drop(initial, target.targetId, card.id)
          : drop(select(initial, card.id), target.targetId);

        if (card.targetId === target.targetId) {
          assert.equal(attempted.outcome, "correct-feedback");
          assert.equal(attempted.locked, true);
          assert.equal(
            attempted.feedback,
            COURSE_G04_L03_IN_010_ASSISTIVE_CORRECT_FEEDBACK,
          );
          assert.equal(attempted.placements[card.id], card.targetId);
          assert.equal(getCourseG04L03In010PlacementCount(attempted), 1);
        } else {
          assert.equal(attempted.outcome, "wrong");
          assert.equal(attempted.locked, true);
          assert.equal(attempted.wrongCardId, card.id);
          assert.equal(attempted.attemptedTargetId, target.targetId);
          assert.equal(attempted.feedback, null);
          assert.deepEqual(attempted.placements, initial.placements);

          const closed = closeWrong(attempted);
          assert.equal(closed.outcome, "ready");
          assert.equal(closed.locked, false);
          assert.equal(closed.wrongCardId, null);
          assert.deepEqual(closed.placements, initial.placements);
        }
      }
    }
  }
  assert.equal(pairCount, 36);
});

test("wrong feedback locks every mutation until the explicit Close action", () => {
  const initial = createCourseG04L03In010TemperatureDragState();
  const firstCorrect = drop(initial, "Mc_Tar_5", "Src_5");
  const readyWithPlacement = finishPerCardFeedback(firstCorrect);
  const wrong = drop(
    select(readyWithPlacement, "Src_1"),
    "Mc_Tar_2",
  );

  assert.equal(wrong.outcome, "wrong");
  assert.equal(wrong.locked, true);
  assert.equal(wrong.feedback, null);
  assert.deepEqual(wrong.placements, readyWithPlacement.placements);
  assert.equal(select(wrong, "Src_2"), wrong);
  assert.equal(drop(wrong, "Mc_Tar_1", "Src_1"), wrong);
  assert.equal(finishPerCardFeedback(wrong), wrong);
  assert.equal(finishFinalFeedback(wrong), wrong);

  const closed = closeWrong(wrong);
  assert.equal(closed.outcome, "ready");
  assert.equal(closed.locked, false);
  assert.equal(closed.wrongCardId, null);
  assert.equal(closed.attemptedTargetId, null);
  assert.deepEqual(closed.placements, readyWithPlacement.placements);

  const retried = drop(closed, "Mc_Tar_1", "Src_1");
  assert.equal(retried.outcome, "correct-feedback");
  assert.equal(retried.placements.Src_1, "Mc_Tar_1");
});

test("all 720 orders preserve the sixth-card two-stage completion", () => {
  const orders = permutations(COURSE_G04_L03_IN_010_CARDS);
  assert.equal(orders.length, 720);

  for (const order of orders) {
    let state = createCourseG04L03In010TemperatureDragState();
    for (const [index, card] of order.entries()) {
      state = index % 2 === 0
        ? drop(state, card.targetId, card.id)
        : drop(select(state, card.id), card.targetId);
      assert.equal(state.outcome, "correct-feedback");
      assert.equal(state.locked, true);
      assert.equal(
        state.feedback,
        COURSE_G04_L03_IN_010_ASSISTIVE_CORRECT_FEEDBACK,
      );
      assert.equal(getCourseG04L03In010PlacementCount(state), index + 1);

      state = finishPerCardFeedback(state);
      const isSixthCard = index === COURSE_G04_L03_IN_010_CARDS.length - 1;
      assert.equal(
        state.outcome,
        isSixthCard ? "final-correct-feedback" : "ready",
      );
      assert.equal(state.locked, isSixthCard);
      assert.equal(
        state.feedback,
        isSixthCard ? COURSE_G04_L03_IN_010_FINAL_CORRECT_FEEDBACK : null,
      );
    }

    assert.equal(getCourseG04L03In010PlacementCount(state), 6);
    assert.equal(finishPerCardFeedback(state), state);
    state = finishFinalFeedback(state);
    assert.equal(state.outcome, "complete");
    assert.equal(state.locked, true);
    assert.equal(state.feedback, null);
    assert.equal(state.attemptedTargetId, null);
    for (const card of COURSE_G04_L03_IN_010_CARDS) {
      assert.equal(state.placements[card.id], card.targetId);
    }
  }
});

test("the sixth card cannot skip either feedback phase", () => {
  let state = createCourseG04L03In010TemperatureDragState();
  for (const card of COURSE_G04_L03_IN_010_CARDS.slice(0, 5)) {
    state = finishPerCardFeedback(drop(state, card.targetId, card.id));
  }
  const sixth = COURSE_G04_L03_IN_010_CARDS[5];
  assert.ok(sixth);

  state = drop(state, sixth.targetId, sixth.id);
  assert.equal(state.outcome, "correct-feedback");
  assert.equal(
    state.feedback,
    COURSE_G04_L03_IN_010_ASSISTIVE_CORRECT_FEEDBACK,
  );
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

test("the current-JS terminal is persistent until Replay", () => {
  const complete = finishFinalFeedback(reachFinalFeedback());
  assert.equal(complete.outcome, "complete");
  assert.equal(complete.locked, true);

  for (const action of [
    {type: "select-card", cardId: "Src_1"},
    {type: "drop-card", cardId: "Src_1", targetId: "Mc_Tar_1"},
    {type: "close-wrong"},
    {type: "feedback-complete"},
    {type: "final-feedback-complete"},
  ] as const) {
    assert.equal(
      reduceCourseG04L03In010TemperatureDrag(complete, action),
      complete,
    );
  }

  const replayed = reduceCourseG04L03In010TemperatureDrag(complete, {
    type: "replay",
  });
  assert.deepEqual(
    replayed,
    createCourseG04L03In010TemperatureDragState(),
  );
});

test("Replay restores the complete initial vector from every reachable phase", () => {
  const initial = createCourseG04L03In010TemperatureDragState();
  const selected = select(initial, "Src_4");
  const wrong = drop(selected, "Mc_Tar_5");
  const correctFeedback = drop(initial, "Mc_Tar_4", "Src_4");
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
    const replayed = reduceCourseG04L03In010TemperatureDrag(state, {
      type: "replay",
    });
    assert.deepEqual(replayed, initial);
    assert.notEqual(replayed, state);
  }
});

test("unknown identities, malformed actions, and wrong-phase actions fail closed", () => {
  const initial = createCourseG04L03In010TemperatureDragState();
  for (const action of [
    null,
    {},
    [],
    {type: "reset"},
    {type: "select-card", cardId: "Src_3"},
    {type: "select-card", cardId: 1},
    {type: "drop-card", cardId: "Src_3", targetId: "Mc_Tar_1"},
    {type: "drop-card", cardId: "Src_1", targetId: "Mc_Tar_3"},
    {type: "drop-card", cardId: null, targetId: "Mc_Tar_1"},
  ]) {
    assert.equal(
      reduceCourseG04L03In010TemperatureDrag(initial, action as never),
      initial,
    );
  }
  assert.equal(drop(initial, "Mc_Tar_1"), initial);
  assert.equal(closeWrong(initial), initial);
  assert.equal(finishPerCardFeedback(initial), initial);
  assert.equal(finishFinalFeedback(initial), initial);

  const selected = select(initial, "Src_1");
  assert.equal(
    reduceCourseG04L03In010TemperatureDrag(selected, {
      type: "select-card",
      cardId: "Src_1",
    }),
    selected,
  );
});

test("cards, geometry, contracts, authority, and reducer states are immutable", () => {
  const initial = createCourseG04L03In010TemperatureDragState();
  const selected = select(initial, "Src_6");
  const accepted = drop(selected, "Mc_Tar_6");

  assert.equal(Object.isFrozen(COURSE_G04_L03_IN_010_CARDS), true);
  assert.equal(Object.isFrozen(COURSE_G04_L03_IN_010_CARDS[0]), true);
  assert.equal(Object.isFrozen(COURSE_G04_L03_IN_010_CARDS[0]?.sourceCenter), true);
  assert.equal(Object.isFrozen(COURSE_G04_L03_IN_010_CARDS[0]?.sourceBounds), true);
  assert.equal(Object.isFrozen(COURSE_G04_L03_IN_010_CARDS[0]?.targetSize), true);
  assert.equal(Object.isFrozen(COURSE_G04_L03_IN_010_SOURCE_GEOMETRY), true);
  assert.equal(Object.isFrozen(COURSE_G04_L03_IN_010_SOURCE_GEOMETRY.stage), true);
  assert.equal(Object.isFrozen(COURSE_G04_L03_IN_010_SOURCE_GEOMETRY.cards), true);
  assert.equal(Object.isFrozen(COURSE_G04_L03_IN_010_SOURCE_GEOMETRY.targets), true);
  assert.equal(Object.isFrozen(COURSE_G04_L03_IN_010_SOURCE_GLOSSARY_TERMS), true);
  assert.equal(Object.isFrozen(COURSE_G04_L03_IN_010_SOURCE_GLOSSARY_TERMS[0]), true);
  assert.equal(
    Object.isFrozen(COURSE_G04_L03_IN_010_SOURCE_GLOSSARY_TERMS[0]?.bounds),
    true,
  );
  assert.equal(Object.isFrozen(COURSE_G04_L03_IN_010_FIXED_REFERENCE), true);
  assert.equal(Object.isFrozen(COURSE_G04_L03_IN_010_WRONG_FEEDBACK), true);
  assert.equal(Object.isFrozen(COURSE_G04_L03_IN_010_CURRENT_JS_TIMING), true);
  assert.equal(Object.isFrozen(COURSE_G04_L03_IN_010_INPUT_METHODS), true);
  assert.equal(Object.isFrozen(COURSE_G04_L03_IN_010_INTERACTION_AUTHORITY), true);
  assert.equal(Object.isFrozen(initial), true);
  assert.equal(Object.isFrozen(initial.placements), true);
  assert.equal(Object.isFrozen(selected), true);
  assert.equal(Object.isFrozen(accepted), true);
  assert.equal(Object.isFrozen(accepted.placements), true);
  assert.notEqual(selected, initial);
  assert.notEqual(accepted, selected);
  assert.notEqual(accepted.placements, initial.placements);
  assert.equal(initial.selectedCardId, null);
  assert.equal(initial.placements.Src_6, null);
});

test("every runtime, visual, audio, replay, owner, and strict gate stays false", () => {
  const authority = COURSE_G04_L03_IN_010_INTERACTION_AUTHORITY;
  assert.equal(
    authority.implementationKind,
    "current-javascript-pure-state-candidate",
  );
  assert.equal(
    authority.mappingDisposition,
    "exact-swf-suffix-identity-mapping",
  );
  assert.equal(
    authority.wrongFeedbackTextDisposition,
    "host-global-unresolved-canvas-glyph-not-promoted",
  );
  assert.equal(
    authority.postDropVisualDisposition,
    "frame-263-initial-only-not-post-drop-source-hide-parity",
  );
  assert.equal(
    authority.terminalDisposition,
    "two-feedback-phases-then-persistent-current-javascript-terminal",
  );
  assert.equal(authority.strictAcceptanceEffect, "none");

  for (const [name, value] of Object.entries(authority)) {
    if (typeof value === "boolean") assert.equal(value, false, name);
  }
  assert.equal(
    COURSE_G04_L03_IN_010_SOURCE_GLOSSARY_TERMS.every(
      ({enabled, hostContentResolved, status}) =>
        !enabled && !hostContentResolved && status === "safe-disabled",
    ),
    true,
  );
});
