import assert from "node:assert/strict";
import test from "node:test";

import {
  COURSE_G04_L11_VB_005_AXIS_TOKENS,
  COURSE_G04_L11_VB_005_INTERACTION_AUTHORITY,
  COURSE_G04_L11_VB_005_INTERACTION_SOURCE,
  COURSE_G04_L11_VB_005_KEY_TERMS,
  createCourseG04L11Vb005AxisPracticeState,
  reduceCourseG04L11Vb005AxisPractice,
} from "./course-g04-l11-vb-005-axis-practice-interaction";

test("binds the source drag pairs and excludes the old course shell", () => {
  assert.equal(COURSE_G04_L11_VB_005_INTERACTION_SOURCE.sourceTimelineId,
    "sprite-101");
  assert.equal(COURSE_G04_L11_VB_005_INTERACTION_SOURCE.sourceInteractionFrame,
    102);
  assert.deepEqual(COURSE_G04_L11_VB_005_AXIS_TOKENS.map((axis) => [
    axis.sourceObjectId, axis.sourceInstanceName, axis.sourceTargetInstanceName,
  ]), [["67", "Scr_1", "Tar_1"], ["68", "Scr_2", "Tar_2"]]);
  assert.equal(COURSE_G04_L11_VB_005_INTERACTION_SOURCE
    .legacyCourseShellRequired, false);
});

test("preserves all five source key-term buttons as local controls", () => {
  assert.deepEqual(COURSE_G04_L11_VB_005_KEY_TERMS.map((term) =>
    [term.sourceButtonObjectId, term.sourceKey]), [
    ["54", "X-axis"], ["55", "Y-axis"], ["56", "Position"],
    ["57", "Coordinate grid"], ["89", "Number"],
  ]);
  let state = createCourseG04L11Vb005AxisPracticeState();
  for (const term of COURSE_G04_L11_VB_005_KEY_TERMS) {
    state = reduceCourseG04L11Vb005AxisPractice(state,
      {type: "open-term", term: term.id});
    assert.equal(state.openTerm, term.id);
    assert.equal(state.legacyHostCallCount, 0);
    state = reduceCourseG04L11Vb005AxisPractice(state, {type: "close-term"});
  }
});

test("wrong placement returns the label and exposes bounded feedback", () => {
  let state = createCourseG04L11Vb005AxisPracticeState();
  state = reduceCourseG04L11Vb005AxisPractice(state,
    {type: "select-axis", axis: "x-axis"});
  state = reduceCourseG04L11Vb005AxisPractice(state, {
    type: "place-axis", axis: "x-axis", target: "vertical-axis",
  });
  assert.equal(state.placed["x-axis"], false);
  assert.deepEqual(state.feedback, {
    kind: "wrong", axis: "x-axis", target: "vertical-axis",
  });
  assert.equal(state.selectedAxis, "x-axis");
  assert.equal(state.audioEnabled, false);
});

test("pointer and keyboard-equivalent placements share the exact reducer", () => {
  let state = createCourseG04L11Vb005AxisPracticeState();
  state = reduceCourseG04L11Vb005AxisPractice(state, {
    type: "place-axis", axis: "x-axis", target: "horizontal-axis",
  });
  assert.equal(state.placed["x-axis"], true);
  assert.equal(state.completed, false);
  state = reduceCourseG04L11Vb005AxisPractice(state, {
    type: "place-axis", axis: "y-axis", target: "vertical-axis",
  });
  assert.equal(state.placed["y-axis"], true);
  assert.equal(state.completed, true);
  assert.equal(state.attempts, 2);
});

test("Replay resets the complete local state vector", () => {
  let state = createCourseG04L11Vb005AxisPracticeState();
  state = reduceCourseG04L11Vb005AxisPractice(state, {
    type: "place-axis", axis: "x-axis", target: "horizontal-axis",
  });
  state = reduceCourseG04L11Vb005AxisPractice(state,
    {type: "open-term", term: "coordinate-grid"});
  assert.deepEqual(
    reduceCourseG04L11Vb005AxisPractice(state, {type: "replay"}),
    createCourseG04L11Vb005AxisPracticeState(),
  );
});

test("unknown controls fail closed and downstream authority remains false", () => {
  assert.throws(() => reduceCourseG04L11Vb005AxisPractice(
    createCourseG04L11Vb005AxisPracticeState(),
    {type: "open-term", term: "old-shell" as "number"},
  ), /unknown VB005 term/u);
  for (const [key, value] of Object.entries(
    COURSE_G04_L11_VB_005_INTERACTION_AUTHORITY,
  )) {
    if (["implementationCandidateOnly",
      "animationInternalPedagogicalControlsPreserved",
      "pointerDragEquivalentImplemented",
      "keyboardPlacementEquivalentImplemented"].includes(key)) {
      assert.equal(value, true, key);
    } else if (key === "strictAcceptanceEffect") {
      assert.equal(value, "none");
    } else {
      assert.equal(value, false, key);
    }
  }
});
