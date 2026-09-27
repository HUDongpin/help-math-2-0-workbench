import assert from "node:assert/strict";
import test from "node:test";

import {
  COURSE_G04_L11_VB_008_INTERACTION_AUTHORITY,
  COURSE_G04_L11_VB_008_INTERACTION_SOURCE,
  COURSE_G04_L11_VB_008_TERMS,
  createCourseG04L11Vb008PlotState,
  getCourseG04L11Vb008SelectedTerm,
  reduceCourseG04L11Vb008Plot,
} from "./course-g04-l11-vb-008-plot-interaction";

test("binds the exact 95-frame source lesson without the legacy course shell", () => {
  assert.equal(COURSE_G04_L11_VB_008_INTERACTION_SOURCE.sourceTimelineId,
    "sprite-41");
  assert.equal(COURSE_G04_L11_VB_008_INTERACTION_SOURCE.sourceFrameCount, 95);
  assert.equal(COURSE_G04_L11_VB_008_INTERACTION_SOURCE
    .sourceTerminalStopFrame, 95);
  assert.equal(COURSE_G04_L11_VB_008_INTERACTION_SOURCE
    .legacyCourseShellRequired, false);
  assert.deepEqual(COURSE_G04_L11_VB_008_INTERACTION_SOURCE
    .orderedConstruction, [
    {axis: "x", direction: "right", units: 1},
    {axis: "y", direction: "up", units: 2},
  ]);
});

test("preserves all six animation-internal teaching controls", () => {
  assert.deepEqual(COURSE_G04_L11_VB_008_TERMS.map((term) =>
    [term.sourceButtonObjectId, term.sourceKeyAttribute]), [
    ["10", "Plot"],
    ["11", "Locate"],
    ["12", "Point"],
    ["13", "Coordinate grid"],
    ["14", "Ordered pair"],
    ["40", "Coordinate"],
  ]);
  for (const term of COURSE_G04_L11_VB_008_TERMS) {
    const selected = reduceCourseG04L11Vb008Plot(
      createCourseG04L11Vb008PlotState(60),
      {type: "select-term", termId: term.id, frame: 60},
    );
    assert.equal(selected.frame, 60);
    assert.equal(selected.playing, false);
    assert.equal(selected.panelOpen, true);
    assert.equal(selected.legacyHostCallCount, 0);
    assert.equal(selected.audioEnabled, false);
    assert.equal(getCourseG04L11Vb008SelectedTerm(selected)?.label, term.label);
  }
});

test("the glossary panel freezes host synchronization until Resume", () => {
  let state = createCourseG04L11Vb008PlotState(40);
  state = reduceCourseG04L11Vb008Plot(state, {
    type: "select-term", termId: "coordinate-grid", frame: 40,
  });
  const frozen = reduceCourseG04L11Vb008Plot(state,
    {type: "synchronize-frame", frame: 80});
  assert.equal(frozen, state);
  state = reduceCourseG04L11Vb008Plot(frozen, {type: "close-term"});
  assert.equal(state.frame, 40);
  assert.equal(state.playing, false);
  state = reduceCourseG04L11Vb008Plot(state,
    {type: "resume", frame: 80});
  assert.equal(state.frame, 80);
  assert.equal(state.playing, true);
});

test("terminal frame and Replay stay inside the modern animation", () => {
  let state = createCourseG04L11Vb008PlotState(94);
  state = reduceCourseG04L11Vb008Plot(state,
    {type: "synchronize-frame", frame: 95});
  assert.equal(state.frame, 95);
  assert.equal(state.playing, false);
  state = reduceCourseG04L11Vb008Plot(state, {type: "replay"});
  assert.deepEqual(state, createCourseG04L11Vb008PlotState());
});

test("invalid frames and invented controls fail closed", () => {
  assert.throws(() => createCourseG04L11Vb008PlotState(0),
    /invalid VB008 local frame/u);
  assert.throws(() => reduceCourseG04L11Vb008Plot(
    createCourseG04L11Vb008PlotState(),
    {type: "select-term", termId: "legacy-shell" as "plot", frame: 1},
  ), /unknown VB008 term/u);
});

test("candidate authority preserves controls without expanding acceptance", () => {
  assert.equal(COURSE_G04_L11_VB_008_INTERACTION_AUTHORITY
    .sourceCanvasSequenceRetained, true);
  assert.equal(COURSE_G04_L11_VB_008_INTERACTION_AUTHORITY
    .animationInternalPedagogicalControlsPreserved, true);
  for (const [key, value] of Object.entries(
    COURSE_G04_L11_VB_008_INTERACTION_AUTHORITY,
  )) {
    if (["implementationCandidateOnly", "sourceCanvasSequenceRetained",
      "animationInternalPedagogicalControlsPreserved"].includes(key)) continue;
    if (key === "strictAcceptanceEffect") assert.equal(value, "none");
    else assert.equal(value, false, key);
  }
});
