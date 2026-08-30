import assert from "node:assert/strict";
import test from "node:test";

import {
  COURSE_G04_L03_VB_003_COMPLETION_FEEDBACK,
  COURSE_G04_L03_VB_003_CURRENT_JS_TIMING,
  COURSE_G04_L03_VB_003_DRAG_ITEMS,
  COURSE_G04_L03_VB_003_FIXED_EXAMPLE,
  COURSE_G04_L03_VB_003_INTERACTION_AUTHORITY,
  COURSE_G04_L03_VB_003_WRONG_FEEDBACK,
  createCourseG04L03Vb003InteractionState,
  getCourseG04L03Vb003CorrectFeedbackPolicy,
  reduceCourseG04L03Vb003Interaction,
  type CourseG04L03Vb003InteractionState,
  type CourseG04L03Vb003ItemId,
} from "../src/timelines/course-g04-l03-vb-003-interaction";

const select = (
  state: CourseG04L03Vb003InteractionState,
  itemId: CourseG04L03Vb003ItemId,
) => reduceCourseG04L03Vb003Interaction(state, {
  type: "select-item",
  itemId,
});

const drop = (
  state: CourseG04L03Vb003InteractionState,
  targetId: CourseG04L03Vb003ItemId,
) => reduceCourseG04L03Vb003Interaction(state, {
  type: "drop-item",
  targetId,
});

const finishCorrectFeedback = (
  state: CourseG04L03Vb003InteractionState,
) => reduceCourseG04L03Vb003Interaction(state, {
  type: "correct-feedback-finished",
});

test("VB003 binds the five exact source suffix mappings and placement coordinates", () => {
  assert.deepEqual(
    COURSE_G04_L03_VB_003_DRAG_ITEMS.map((item) => ({
      id: item.id,
      label: item.label,
      sourceInstance: item.sourceInstance,
      sourcePosition: item.sourcePosition,
      sourceSize: item.sourceSize,
      targetInstance: item.targetInstance,
      targetPosition: item.targetPosition,
      targetSize: item.targetSize,
    })),
    [
      {
        id: "2",
        label: "–2",
        sourceInstance: "Scr_2",
        sourcePosition: {x: 316.1, y: 386.05},
        sourceSize: {height: 35.1, width: 31.5},
        targetInstance: "Mc_Tar_2",
        targetPosition: {x: 350.95, y: 250.55},
        targetSize: {height: 40.05, width: 36.25},
      },
      {
        id: "3",
        label: "2",
        sourceInstance: "Scr_3",
        sourcePosition: {x: 387.1, y: 386.05},
        sourceSize: {height: 35.1, width: 31.5},
        targetInstance: "Mc_Tar_3",
        targetPosition: {x: 485.95, y: 250.55},
        targetSize: {height: 39.85, width: 35.5},
      },
      {
        id: "4",
        label: "0",
        sourceInstance: "Scr_4",
        sourcePosition: {x: 458.1, y: 386.05},
        sourceSize: {height: 35.1, width: 31.5},
        targetInstance: "Mc_Tar_4",
        targetPosition: {x: 419.95, y: 250.55},
        targetSize: {height: 40.25, width: 35.55},
      },
      {
        id: "5",
        label: "–5",
        sourceInstance: "Scr_5",
        sourcePosition: {x: 531.1, y: 386.05},
        sourceSize: {height: 35.1, width: 31.5},
        targetInstance: "Mc_Tar_5",
        targetPosition: {x: 247.95, y: 250.55},
        targetSize: {height: 39.8, width: 35.2},
      },
      {
        id: "6",
        label: "5",
        sourceInstance: "Scr_6",
        sourcePosition: {x: 602.1, y: 386.05},
        sourceSize: {height: 35.1, width: 31.5},
        targetInstance: "Mc_Tar_6",
        targetPosition: {x: 590.95, y: 250.55},
        targetSize: {height: 40.4, width: 35.2},
      },
    ],
  );
  assert.deepEqual(COURSE_G04_L03_VB_003_FIXED_EXAMPLE, {
    label: "–7",
    targetInstance: "Mc_Tar_1",
    targetPosition: {x: 180.95, y: 250.55},
    targetSize: {height: 39.8, width: 35},
  });
  assert.equal(
    COURSE_G04_L03_VB_003_CURRENT_JS_TIMING.correctFeedbackMs,
    (19 * 1_000) / 12,
  );
});

test("VB003 wrong drop restores the item logically and locks until exact Close", () => {
  const initial = createCourseG04L03Vb003InteractionState();
  const selected = select(initial, "2");
  assert.equal(selected.selectedItemId, "2");

  const wrong = drop(selected, "3");
  assert.equal(wrong.mode, "wrong-feedback");
  assert.equal(wrong.feedbackText, COURSE_G04_L03_VB_003_WRONG_FEEDBACK);
  assert.equal(wrong.attemptedTargetId, "3");
  assert.equal(wrong.selectedItemId, null);
  assert.deepEqual(wrong.placedItemIds, []);
  assert.equal(select(wrong, "2"), wrong);
  assert.equal(drop(wrong, "2"), wrong);
  assert.equal(finishCorrectFeedback(wrong), wrong);

  const closed = reduceCourseG04L03Vb003Interaction(wrong, {
    type: "close-wrong-feedback",
  });
  assert.equal(closed.mode, "ready");
  assert.equal(closed.feedbackText, null);
  assert.equal(closed.attemptedTargetId, null);
  assert.deepEqual(closed.placedItemIds, []);
});

test("VB003 correct drop hides one source item, reveals its target, then re-enables", () => {
  const initial = createCourseG04L03Vb003InteractionState();
  const accepted = drop(select(initial, "5"), "5");
  assert.equal(accepted.mode, "correct-feedback");
  assert.deepEqual(accepted.placedItemIds, ["5"]);
  assert.equal(accepted.lastPlacedItemId, "5");
  assert.equal(accepted.attemptedTargetId, "5");
  assert.equal(select(accepted, "2"), accepted);

  const ready = finishCorrectFeedback(accepted);
  assert.equal(ready.mode, "ready");
  assert.deepEqual(ready.placedItemIds, ["5"]);
  assert.equal(ready.feedbackText, null);
  assert.equal(select(ready, "5"), ready);
});

test("VB003 completes only after all five exact matches", () => {
  let state = createCourseG04L03Vb003InteractionState();
  for (const item of COURSE_G04_L03_VB_003_DRAG_ITEMS) {
    state = select(state, item.id);
    state = drop(state, item.id);
    assert.equal(state.mode, "correct-feedback");
    state = finishCorrectFeedback(state);
  }

  assert.equal(state.mode, "completed");
  assert.equal(state.feedbackText, COURSE_G04_L03_VB_003_COMPLETION_FEEDBACK);
  assert.deepEqual(state.placedItemIds, ["2", "3", "4", "5", "6"]);
  assert.equal(select(state, "2"), state);
  assert.equal(
    reduceCourseG04L03Vb003Interaction(state, {
      type: "close-wrong-feedback",
    }),
    state,
  );
});

test("VB003 explicit item drop supports pointer transfer without prior selection", () => {
  const state = reduceCourseG04L03Vb003Interaction(
    createCourseG04L03Vb003InteractionState(),
    {type: "drop-item", itemId: "6", targetId: "6"},
  );
  assert.equal(state.mode, "correct-feedback");
  assert.deepEqual(state.placedItemIds, ["6"]);
});

test("VB003 Reset and Replay restore every interaction field", () => {
  let changed = drop(
    select(createCourseG04L03Vb003InteractionState(), "2"),
    "2",
  );
  changed = finishCorrectFeedback(changed);
  changed = select(changed, "3");
  changed = drop(changed, "4");

  const initial = createCourseG04L03Vb003InteractionState();
  assert.deepEqual(
    reduceCourseG04L03Vb003Interaction(changed, {type: "reset"}),
    initial,
  );
  assert.deepEqual(
    reduceCourseG04L03Vb003Interaction(changed, {type: "replay"}),
    initial,
  );
});

test("VB003 pause holds correct feedback even when reduced motion is requested", () => {
  assert.equal(
    getCourseG04L03Vb003CorrectFeedbackPolicy({
      mode: "correct-feedback",
      paused: true,
      reducedMotion: true,
    }),
    "hold-while-paused",
  );
  assert.equal(
    getCourseG04L03Vb003CorrectFeedbackPolicy({
      mode: "correct-feedback",
      paused: false,
      reducedMotion: true,
    }),
    "complete-immediately",
  );
  assert.equal(
    getCourseG04L03Vb003CorrectFeedbackPolicy({
      mode: "correct-feedback",
      paused: false,
      reducedMotion: false,
    }),
    "schedule-delay",
  );
  assert.equal(
    getCourseG04L03Vb003CorrectFeedbackPolicy({
      mode: "ready",
      paused: false,
      reducedMotion: false,
    }),
    "inactive",
  );
});

test("VB003 interaction is immutable and keeps every acceptance gate closed", () => {
  const initial = createCourseG04L03Vb003InteractionState();
  const next = select(initial, "2");
  assert.equal(Object.isFrozen(initial), true);
  assert.equal(Object.isFrozen(initial.placedItemIds), true);
  assert.equal(Object.isFrozen(COURSE_G04_L03_VB_003_DRAG_ITEMS), true);
  assert.notEqual(next, initial);
  assert.deepEqual(initial.placedItemIds, []);
  assert.equal(
    COURSE_G04_L03_VB_003_INTERACTION_AUTHORITY.sourceDragDropExecuted,
    false,
  );
  assert.equal(
    COURSE_G04_L03_VB_003_INTERACTION_AUTHORITY
      .correctFeedbackTimingIsOriginalRuntimeTrace,
    false,
  );
  assert.equal(
    COURSE_G04_L03_VB_003_INTERACTION_AUTHORITY.embeddedCoachAudioModeled,
    false,
  );
  assert.equal(
    COURSE_G04_L03_VB_003_INTERACTION_AUTHORITY.behaviorParityEstablished,
    false,
  );
  assert.equal(
    COURSE_G04_L03_VB_003_INTERACTION_AUTHORITY.replayParityEstablished,
    false,
  );
  assert.equal(COURSE_G04_L03_VB_003_INTERACTION_AUTHORITY.ownerAccepted, false);
  assert.equal(
    COURSE_G04_L03_VB_003_INTERACTION_AUTHORITY.strictMigrationComplete,
    false,
  );
  assert.equal(
    COURSE_G04_L03_VB_003_INTERACTION_AUTHORITY.strictAcceptanceEffect,
    "none",
  );
});
