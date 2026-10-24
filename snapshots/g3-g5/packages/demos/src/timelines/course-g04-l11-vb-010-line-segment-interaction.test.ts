import assert from "node:assert/strict";
import test from "node:test";

import {
  COURSE_G04_L11_VB_010_STATIC_EVIDENCE,
  COURSE_G04_L11_VB_010_STATIC_SOURCE_FACTS,
} from "../source-static/g4-l11/course-g04-l11-vb-010-static";

import {
  COURSE_G04_L11_VB_010_INTERACTION_AUTHORITY,
  COURSE_G04_L11_VB_010_INTERACTION_SOURCE,
  COURSE_G04_L11_VB_010_TERMS,
  createCourseG04L11Vb010LineSegmentState,
  getCourseG04L11Vb010SelectedTerm,
  reduceCourseG04L11Vb010LineSegment,
} from "./course-g04-l11-vb-010-line-segment-interaction";

test("binds the frozen source-static evidence and product boundary", () => {
  assert.equal(COURSE_G04_L11_VB_010_STATIC_EVIDENCE.swf.bytes, 32_366);
  assert.equal(COURSE_G04_L11_VB_010_STATIC_EVIDENCE.swf.sha256,
    "a4b46ef4c0a5476ecfc35f63d4fb78f3fd4d9c6340e760443e4f7d078013d5d8");
  assert.equal(COURSE_G04_L11_VB_010_STATIC_EVIDENCE
    .frameDomainDisposition.sha256,
    "6832aaea36cb0a84b2649efbb2f6fa94aafa43caee15091440b959207cfcada2");
  assert.equal(COURSE_G04_L11_VB_010_STATIC_SOURCE_FACTS.release.ordinal, 13);
  assert.equal(COURSE_G04_L11_VB_010_STATIC_SOURCE_FACTS
    .productBoundary.legacyCourseShellNavigationAndPlayerChromeIncluded,
  false);
  assert.equal(COURSE_G04_L11_VB_010_STATIC_SOURCE_FACTS
    .principalTimeline.sourceTerminalBehaviorEstablished, false);
  assert.equal(Object.isFrozen(COURSE_G04_L11_VB_010_STATIC_SOURCE_FACTS), true);
});

test("binds the exact 66-frame line-segment source lesson", () => {
  assert.equal(COURSE_G04_L11_VB_010_INTERACTION_SOURCE.sourceTimelineId,
    "sprite-43");
  assert.equal(COURSE_G04_L11_VB_010_INTERACTION_SOURCE.sourceFrameCount, 66);
  assert.equal(COURSE_G04_L11_VB_010_INTERACTION_SOURCE
    .sourceTerminalStopFrame, null);
  assert.equal(COURSE_G04_L11_VB_010_INTERACTION_SOURCE
    .candidateTerminalHoldFrame, 66);
  assert.deepEqual(COURSE_G04_L11_VB_010_INTERACTION_SOURCE.lineSegment, {
    orientation: "vertical",
    upperEndpoint: {x: 2, y: 6, orderedPair: "(2,6)"},
    lowerEndpoint: {x: 2, y: 2, orderedPair: "(2,2)"},
  });
  assert.equal(COURSE_G04_L11_VB_010_INTERACTION_SOURCE
    .sourceTerminalBehaviorEstablished, false);
  assert.equal(COURSE_G04_L11_VB_010_INTERACTION_SOURCE
    .legacyCourseShellRequired, false);
});

test("preserves all three animation-internal glossary controls", () => {
  assert.deepEqual(COURSE_G04_L11_VB_010_TERMS.map((term) =>
    [term.sourceButtonObjectId, term.sourceKeyAttribute]), [
    ["10", "Line segment"],
    ["11", "Line"],
    ["12", "Point"],
  ]);
  for (const term of COURSE_G04_L11_VB_010_TERMS) {
    const selected = reduceCourseG04L11Vb010LineSegment(
      createCourseG04L11Vb010LineSegmentState(50),
      {type: "select-term", termId: term.id, frame: 50},
    );
    assert.equal(selected.playing, false);
    assert.equal(selected.panelOpen, true);
    assert.equal(selected.legacyHostCallCount, 0);
    assert.equal(selected.audioEnabled, false);
    assert.equal(getCourseG04L11Vb010SelectedTerm(selected)?.label, term.label);
  }
});

test("host synchronization freezes during glossary help and resumes exactly", () => {
  let state = createCourseG04L11Vb010LineSegmentState(40);
  state = reduceCourseG04L11Vb010LineSegment(state, {
    type: "select-term", termId: "line-segment", frame: 40,
  });
  const frozen = reduceCourseG04L11Vb010LineSegment(state,
    {type: "synchronize-frame", frame: 60});
  assert.equal(frozen, state);
  state = reduceCourseG04L11Vb010LineSegment(frozen, {type: "close-term"});
  assert.equal(state.frame, 40);
  assert.equal(state.playing, false);
  state = reduceCourseG04L11Vb010LineSegment(state,
    {type: "resume", frame: 60});
  assert.equal(state.frame, 60);
  assert.equal(state.playing, true);
});

test("candidate hold and modern Replay do not claim source terminal parity", () => {
  let state = createCourseG04L11Vb010LineSegmentState(65);
  state = reduceCourseG04L11Vb010LineSegment(state,
    {type: "synchronize-frame", frame: 66});
  assert.equal(state.frame, 66);
  assert.equal(state.playing, false);
  state = reduceCourseG04L11Vb010LineSegment(state, {type: "replay"});
  assert.deepEqual(state, createCourseG04L11Vb010LineSegmentState());
  assert.equal(COURSE_G04_L11_VB_010_INTERACTION_AUTHORITY
    .sourceTerminalBehaviorEstablished, false);
});

test("invalid frames and invented controls fail closed", () => {
  assert.throws(() => createCourseG04L11Vb010LineSegmentState(67),
    /invalid VB010 local frame/u);
  assert.throws(() => reduceCourseG04L11Vb010LineSegment(
    createCourseG04L11Vb010LineSegmentState(),
    {type: "select-term", termId: "old-shell" as "line", frame: 1},
  ), /unknown VB010 term/u);
});

test("candidate authority does not promote fidelity or release", () => {
  assert.equal(COURSE_G04_L11_VB_010_INTERACTION_AUTHORITY
    .sourceCanvasSequenceRetained, true);
  assert.equal(COURSE_G04_L11_VB_010_INTERACTION_AUTHORITY
    .animationInternalPedagogicalControlsPreserved, true);
  assert.equal(COURSE_G04_L11_VB_010_INTERACTION_AUTHORITY
    .modernLocalReplayProvided, true);
  for (const [key, value] of Object.entries(
    COURSE_G04_L11_VB_010_INTERACTION_AUTHORITY,
  )) {
    if (["implementationCandidateOnly", "sourceCanvasSequenceRetained",
      "animationInternalPedagogicalControlsPreserved",
      "modernLocalReplayProvided"].includes(key)) continue;
    if (key === "strictAcceptanceEffect") assert.equal(value, "none");
    else assert.equal(value, false, key);
  }
});
