import assert from "node:assert/strict";
import test from "node:test";

import {
  COURSE_G04_L11_VB_006_INTERACTION_AUTHORITY,
  COURSE_G04_L11_VB_006_INTERACTION_SOURCE,
  COURSE_G04_L11_VB_006_TERMS,
  createCourseG04L11Vb006InteractionState,
  getCourseG04L11Vb006CoordinateButtonAlpha,
  reduceCourseG04L11Vb006Interaction,
} from "./course-g04-l11-vb-006-ordered-pair-interaction";

test("binds the 439-frame source child and seven internal term controls", () => {
  assert.equal(COURSE_G04_L11_VB_006_INTERACTION_SOURCE.sourceTimelineId,
    "sprite-85");
  assert.equal(COURSE_G04_L11_VB_006_INTERACTION_SOURCE.sourceFrameCount, 439);
  assert.equal(COURSE_G04_L11_VB_006_INTERACTION_SOURCE
    .legacyCourseShellRequired, false);
  assert.deepEqual(COURSE_G04_L11_VB_006_TERMS.map((term) => [
    term.sourceButtonObjectId, term.label, term.sourcePlacementFrame,
  ]), [
    ["10", "Ordered pair", 1], ["11", "Pair", 1],
    ["12", "Number", 1], ["13", "Locate", 1],
    ["14", "Point", 1], ["55", "Coordinate grid", 64],
    ["78", "Coordinate", 425],
  ]);
});

test("preserves the exact source Coordinate fade progression", () => {
  assert.equal(getCourseG04L11Vb006CoordinateButtonAlpha(424), 0);
  assert.equal(getCourseG04L11Vb006CoordinateButtonAlpha(425), 0);
  assert.equal(getCourseG04L11Vb006CoordinateButtonAlpha(426), 51 / 256);
  assert.equal(getCourseG04L11Vb006CoordinateButtonAlpha(427), 102 / 256);
  assert.equal(getCourseG04L11Vb006CoordinateButtonAlpha(428), 154 / 256);
  assert.equal(getCourseG04L11Vb006CoordinateButtonAlpha(429), 205 / 256);
  assert.equal(getCourseG04L11Vb006CoordinateButtonAlpha(430), 1);
  assert.equal(getCourseG04L11Vb006CoordinateButtonAlpha(439), 1);
});

test("term availability follows source placement frames and pauses locally", () => {
  let state = createCourseG04L11Vb006InteractionState(63);
  assert.throws(() => reduceCourseG04L11Vb006Interaction(state,
    {type: "select-term", termId: "coordinate-grid"}),
  /not source-visible/u);
  state = reduceCourseG04L11Vb006Interaction(state,
    {type: "synchronize-frame", frame: 64});
  state = reduceCourseG04L11Vb006Interaction(state,
    {type: "select-term", termId: "coordinate-grid"});
  assert.equal(state.playing, false);
  assert.equal(state.panelOpen, true);
  assert.equal(state.frame, 64);
  assert.equal(state.legacyHostCallCount, 0);
  assert.equal(state.audioEnabled, false);
  assert.equal(reduceCourseG04L11Vb006Interaction(state,
    {type: "synchronize-frame", frame: 425}), state);
});

test("close, resume, terminal stop, and Replay remain animation-local", () => {
  let state = createCourseG04L11Vb006InteractionState(425);
  state = reduceCourseG04L11Vb006Interaction(state,
    {type: "select-term", termId: "coordinate"});
  state = reduceCourseG04L11Vb006Interaction(state, {type: "close-term"});
  assert.equal(state.playing, false);
  state = reduceCourseG04L11Vb006Interaction(state,
    {type: "resume", frame: 439});
  assert.equal(state.frame, 439);
  assert.equal(state.playing, false);
  assert.deepEqual(reduceCourseG04L11Vb006Interaction(state, {type: "replay"}),
    createCourseG04L11Vb006InteractionState());
});

test("all downstream fidelity, review, acceptance, and release claims stay false", () => {
  for (const [key, value] of Object.entries(
    COURSE_G04_L11_VB_006_INTERACTION_AUTHORITY,
  )) {
    if (["implementationCandidateOnly", "sourceCanvasSequencePreserved",
      "animationInternalPedagogicalControlsPreserved"].includes(key)) {
      assert.equal(value, true, key);
    } else if (key === "strictAcceptanceEffect") {
      assert.equal(value, "none");
    } else {
      assert.equal(value, false, key);
    }
  }
});
