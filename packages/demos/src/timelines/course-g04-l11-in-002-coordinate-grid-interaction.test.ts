import assert from "node:assert/strict";
import test from "node:test";

import {
  COURSE_G04_L11_IN_002_STATIC_EVIDENCE,
  COURSE_G04_L11_IN_002_STATIC_SOURCE_FACTS,
} from "../source-static/g4-l11/course-g04-l11-in-002-static";
import {
  COURSE_G04_L11_IN_002_INTERACTION_AUTHORITY,
  COURSE_G04_L11_IN_002_INTERACTION_SOURCE,
  COURSE_G04_L11_IN_002_TERMS,
  createCourseG04L11In002CoordinateGridState,
  getCourseG04L11In002SelectedTerm,
  reduceCourseG04L11In002CoordinateGrid,
} from "./course-g04-l11-in-002-coordinate-grid-interaction";

test("binds the frozen IN002 source-static evidence and product boundary", () => {
  assert.equal(COURSE_G04_L11_IN_002_STATIC_EVIDENCE.swf.bytes, 122_192);
  assert.equal(COURSE_G04_L11_IN_002_STATIC_EVIDENCE.swf.sha256,
    "a87ccf50c6291e27d2de4a0fac3e959ec6f426cb6e4dcd828eef08ed3dab6894");
  assert.equal(COURSE_G04_L11_IN_002_STATIC_EVIDENCE
    .frameDomainDisposition.sha256,
  "81255977cb7a27a7b9e6b7a221520a05fabbd6bb5dca4858f2da6b8c08a0d833");
  assert.equal(COURSE_G04_L11_IN_002_STATIC_SOURCE_FACTS.release.ordinal, 14);
  assert.equal(COURSE_G04_L11_IN_002_STATIC_SOURCE_FACTS
    .productBoundary.legacyCourseShellNavigationAndPlayerChromeIncluded,
  false);
  assert.equal(COURSE_G04_L11_IN_002_STATIC_SOURCE_FACTS
    .principalTimeline.sourceTerminalBehaviorEstablished, false);
  assert.equal(Object.isFrozen(COURSE_G04_L11_IN_002_STATIC_SOURCE_FACTS), true);
});

test("binds the exact 331-frame coordinate-grid lesson", () => {
  assert.equal(COURSE_G04_L11_IN_002_INTERACTION_SOURCE.sourceTimelineId,
    "sprite-80");
  assert.equal(COURSE_G04_L11_IN_002_INTERACTION_SOURCE.sourceFrameCount, 331);
  assert.equal(COURSE_G04_L11_IN_002_INTERACTION_SOURCE
    .candidateTerminalHoldFrame, 331);
  assert.equal(COURSE_G04_L11_IN_002_INTERACTION_SOURCE.relation, "y = x + 4");
  assert.deepEqual(COURSE_G04_L11_IN_002_INTERACTION_SOURCE.points, [
    {x: 1, y: 5, orderedPair: "(1,5)"},
    {x: 2, y: 6, orderedPair: "(2,6)"},
    {x: 3, y: 7, orderedPair: "(3,7)"},
    {x: 4, y: 8, orderedPair: "(4,8)"},
  ]);
  assert.equal(COURSE_G04_L11_IN_002_INTERACTION_SOURCE
    .sourceTerminalBehaviorEstablished, false);
  assert.equal(COURSE_G04_L11_IN_002_INTERACTION_SOURCE
    .legacyCourseShellRequired, false);
});

test("preserves all nine animation-internal glossary controls", () => {
  assert.deepEqual(COURSE_G04_L11_IN_002_TERMS.map((term) =>
    [term.sourceButtonObjectId, term.sourceKeyAttribute]), [
    ["9", "Coordinate grid"], ["10", "Grid"], ["11", "Form"],
    ["12", "Intersect"], ["13", "Number line"],
    ["41", "Horizontal"], ["42", "X-axis"], ["43", "Vertical"],
    ["44", "Y-axis"],
  ]);
  for (const term of COURSE_G04_L11_IN_002_TERMS) {
    const selected = reduceCourseG04L11In002CoordinateGrid(
      createCourseG04L11In002CoordinateGridState(240),
      {type: "select-term", termId: term.id, frame: 240},
    );
    assert.equal(selected.playing, false);
    assert.equal(selected.panelOpen, true);
    assert.equal(selected.legacyHostCallCount, 0);
    assert.equal(selected.audioEnabled, false);
    assert.equal(getCourseG04L11In002SelectedTerm(selected)?.label, term.label);
  }
});

test("host synchronization freezes during glossary help and resumes exactly", () => {
  let state = createCourseG04L11In002CoordinateGridState(180);
  state = reduceCourseG04L11In002CoordinateGrid(state, {
    type: "select-term", termId: "coordinate-grid", frame: 180,
  });
  const frozen = reduceCourseG04L11In002CoordinateGrid(state,
    {type: "synchronize-frame", frame: 240});
  assert.equal(frozen, state);
  state = reduceCourseG04L11In002CoordinateGrid(frozen, {type: "close-term"});
  assert.equal(state.frame, 180);
  assert.equal(state.playing, false);
  state = reduceCourseG04L11In002CoordinateGrid(state,
    {type: "resume", frame: 240});
  assert.equal(state.frame, 240);
  assert.equal(state.playing, true);
});

test("candidate hold and modern Replay do not claim source terminal parity", () => {
  let state = createCourseG04L11In002CoordinateGridState(330);
  state = reduceCourseG04L11In002CoordinateGrid(state,
    {type: "synchronize-frame", frame: 331});
  assert.equal(state.frame, 331);
  assert.equal(state.playing, false);
  state = reduceCourseG04L11In002CoordinateGrid(state, {type: "replay"});
  assert.deepEqual(state, createCourseG04L11In002CoordinateGridState());
  assert.equal(COURSE_G04_L11_IN_002_INTERACTION_AUTHORITY
    .sourceTerminalBehaviorEstablished, false);
});

test("invalid frames and invented controls fail closed", () => {
  assert.throws(() => createCourseG04L11In002CoordinateGridState(332),
    /invalid IN002 local frame/u);
  assert.throws(() => reduceCourseG04L11In002CoordinateGrid(
    createCourseG04L11In002CoordinateGridState(),
    {type: "select-term", termId: "old-shell" as "grid", frame: 1},
  ), /unknown IN002 term/u);
});

test("candidate authority does not promote fidelity or release", () => {
  assert.equal(COURSE_G04_L11_IN_002_INTERACTION_AUTHORITY
    .sourceCanvasSequenceRetained, true);
  assert.equal(COURSE_G04_L11_IN_002_INTERACTION_AUTHORITY
    .animationInternalPedagogicalControlsPreserved, true);
  assert.equal(COURSE_G04_L11_IN_002_INTERACTION_AUTHORITY
    .modernLocalReplayProvided, true);
  for (const [key, value] of Object.entries(
    COURSE_G04_L11_IN_002_INTERACTION_AUTHORITY,
  )) {
    if (["implementationCandidateOnly", "sourceCanvasSequenceRetained",
      "animationInternalPedagogicalControlsPreserved",
      "modernLocalReplayProvided"].includes(key)) continue;
    if (key === "strictAcceptanceEffect") assert.equal(value, "none");
    else assert.equal(value, false, key);
  }
});
