import assert from "node:assert/strict";
import test from "node:test";

import {
  COURSE_G04_L11_VB_009_INTERACTION_AUTHORITY,
  COURSE_G04_L11_VB_009_INTERACTION_SOURCE,
  COURSE_G04_L11_VB_009_TERMS,
  createCourseG04L11Vb009PointState,
  getCourseG04L11Vb009SelectedTerm,
  reduceCourseG04L11Vb009Point,
} from "./course-g04-l11-vb-009-point-interaction";

test("binds the exact 217-frame Point A source lesson", () => {
  assert.equal(COURSE_G04_L11_VB_009_INTERACTION_SOURCE.sourceTimelineId,
    "sprite-60");
  assert.equal(COURSE_G04_L11_VB_009_INTERACTION_SOURCE.sourceFrameCount, 217);
  assert.equal(COURSE_G04_L11_VB_009_INTERACTION_SOURCE
    .sourceTerminalStopFrame, 217);
  assert.deepEqual(COURSE_G04_L11_VB_009_INTERACTION_SOURCE.point,
    {name: "Point A", x: 4, y: 3, orderedPair: "(4,3)"});
  assert.deepEqual(COURSE_G04_L11_VB_009_INTERACTION_SOURCE.projectionOrder, [
    {axis: "x", direction: "right", units: 4},
    {axis: "y", direction: "up", units: 3},
  ]);
  assert.equal(COURSE_G04_L11_VB_009_INTERACTION_SOURCE
    .legacyCourseShellRequired, false);
});

test("preserves all four animation-internal glossary controls", () => {
  assert.deepEqual(COURSE_G04_L11_VB_009_TERMS.map((term) =>
    [term.sourceButtonObjectId, term.sourceKeyAttribute]), [
    ["11", "Point"],
    ["12", "Location"],
    ["13", "Coordinate grid"],
    ["9", "Ordered pair"],
  ]);
  for (const term of COURSE_G04_L11_VB_009_TERMS) {
    const selected = reduceCourseG04L11Vb009Point(
      createCourseG04L11Vb009PointState(160),
      {type: "select-term", termId: term.id, frame: 160},
    );
    assert.equal(selected.playing, false);
    assert.equal(selected.panelOpen, true);
    assert.equal(selected.legacyHostCallCount, 0);
    assert.equal(selected.audioEnabled, false);
    assert.equal(getCourseG04L11Vb009SelectedTerm(selected)?.label, term.label);
  }
});

test("host synchronization freezes during glossary help and resumes exactly", () => {
  let state = createCourseG04L11Vb009PointState(120);
  state = reduceCourseG04L11Vb009Point(state, {
    type: "select-term", termId: "ordered-pair", frame: 120,
  });
  const frozen = reduceCourseG04L11Vb009Point(state,
    {type: "synchronize-frame", frame: 200});
  assert.equal(frozen, state);
  state = reduceCourseG04L11Vb009Point(frozen, {type: "close-term"});
  assert.equal(state.frame, 120);
  assert.equal(state.playing, false);
  state = reduceCourseG04L11Vb009Point(state,
    {type: "resume", frame: 200});
  assert.equal(state.frame, 200);
  assert.equal(state.playing, true);
});

test("terminal frame and Replay remain local animation behavior", () => {
  let state = createCourseG04L11Vb009PointState(216);
  state = reduceCourseG04L11Vb009Point(state,
    {type: "synchronize-frame", frame: 217});
  assert.equal(state.frame, 217);
  assert.equal(state.playing, false);
  state = reduceCourseG04L11Vb009Point(state, {type: "replay"});
  assert.deepEqual(state, createCourseG04L11Vb009PointState());
});

test("invalid frames and invented controls fail closed", () => {
  assert.throws(() => createCourseG04L11Vb009PointState(218),
    /invalid VB009 local frame/u);
  assert.throws(() => reduceCourseG04L11Vb009Point(
    createCourseG04L11Vb009PointState(),
    {type: "select-term", termId: "old-shell" as "point", frame: 1},
  ), /unknown VB009 term/u);
});

test("candidate authority does not promote fidelity or release", () => {
  assert.equal(COURSE_G04_L11_VB_009_INTERACTION_AUTHORITY
    .sourceCanvasSequenceRetained, true);
  assert.equal(COURSE_G04_L11_VB_009_INTERACTION_AUTHORITY
    .animationInternalPedagogicalControlsPreserved, true);
  for (const [key, value] of Object.entries(
    COURSE_G04_L11_VB_009_INTERACTION_AUTHORITY,
  )) {
    if (["implementationCandidateOnly", "sourceCanvasSequenceRetained",
      "animationInternalPedagogicalControlsPreserved"].includes(key)) continue;
    if (key === "strictAcceptanceEffect") assert.equal(value, "none");
    else assert.equal(value, false, key);
  }
});
