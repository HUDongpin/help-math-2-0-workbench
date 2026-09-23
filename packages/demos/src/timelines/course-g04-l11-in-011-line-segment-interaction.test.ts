import assert from "node:assert/strict";
import test from "node:test";

import {COURSE_G04_L11_IN_011_STATIC_EVIDENCE,
  COURSE_G04_L11_IN_011_STATIC_SOURCE_FACTS} from
  "../source-static/g4-l11/course-g04-l11-in-011-static";
import {COURSE_G04_L11_IN_011_INTERACTION_AUTHORITY,
  COURSE_G04_L11_IN_011_INTERACTION_SOURCE, COURSE_G04_L11_IN_011_TERMS,
  createCourseG04L11In011LineSegmentState,
  getCourseG04L11In011SelectedTerm,
  reduceCourseG04L11In011LineSegment} from
  "./course-g04-l11-in-011-line-segment-interaction";

test("binds exact IN011 evidence and the 835-frame source timeline", () => {
  assert.equal(COURSE_G04_L11_IN_011_STATIC_EVIDENCE.swf.bytes, 333_535);
  assert.equal(COURSE_G04_L11_IN_011_STATIC_EVIDENCE.frameDomainDisposition.sha256,
    "d6072dc42acf4d63b0b7f86d97bd14720f673457c5b9f4803b7e3caf692b02cc");
  assert.equal(COURSE_G04_L11_IN_011_STATIC_SOURCE_FACTS.release.ordinal, 23);
  assert.equal(COURSE_G04_L11_IN_011_INTERACTION_SOURCE.sourceTimelineId, "sprite-57");
  assert.equal(COURSE_G04_L11_IN_011_INTERACTION_SOURCE.sourceFrameCount, 835);
  assert.equal(COURSE_G04_L11_IN_011_INTERACTION_SOURCE.sourceTerminalStopFrame, null);
  assert.equal(Object.isFrozen(COURSE_G04_L11_IN_011_STATIC_SOURCE_FACTS), true);
});

test("preserves the exact definition, endpoints, subtraction, and conclusion", () => {
  assert.equal(COURSE_G04_L11_IN_011_INTERACTION_SOURCE.definition,
    "A line segment is part of a line between two points.");
  assert.deepEqual(COURSE_G04_L11_IN_011_INTERACTION_SOURCE.endpoints,
    [{x: 2, y: 4, orderedPair: "(2,4)"}, {x: 8, y: 4, orderedPair: "(8,4)"}]);
  assert.equal(COURSE_G04_L11_IN_011_INTERACTION_SOURCE.subtraction, "8 − 2 = 6");
  assert.equal(COURSE_G04_L11_IN_011_INTERACTION_SOURCE.conclusion,
    "length = 6 units");
});

test("all five internal glossary controls pause without old host calls", () => {
  assert.deepEqual(COURSE_G04_L11_IN_011_TERMS.map((term) =>
    [term.sourceButtonObjectId, term.sourceKeyAttribute]), [
    ["24", "Line segment"], ["25", "Line"], ["26", "Point"],
    ["55", "Length"], ["56", "Unit"],
  ]);
  for (const term of COURSE_G04_L11_IN_011_TERMS) {
    const selected = reduceCourseG04L11In011LineSegment(
      createCourseG04L11In011LineSegmentState(250),
      {type: "select-term", termId: term.id, frame: 250});
    assert.equal(selected.playing, false); assert.equal(selected.panelOpen, true);
    assert.equal(selected.legacyHostCallCount, 0); assert.equal(selected.audioEnabled, false);
    assert.equal(getCourseG04L11In011SelectedTerm(selected)?.label, term.label);
  }
});

test("modern pause, resume, and Replay are deterministic but acceptance-neutral", () => {
  let state = createCourseG04L11In011LineSegmentState(200);
  state = reduceCourseG04L11In011LineSegment(state, {type: "pause", frame: 200});
  assert.equal(state.playing, false);
  assert.equal(reduceCourseG04L11In011LineSegment(state,
    {type: "synchronize-frame", frame: 250}), state);
  state = reduceCourseG04L11In011LineSegment(state, {type: "resume", frame: 250});
  assert.equal(state.playing, true); assert.equal(state.frame, 250);
  state = reduceCourseG04L11In011LineSegment(state,
    {type: "synchronize-frame", frame: 835});
  assert.equal(state.playing, false);
  assert.deepEqual(reduceCourseG04L11In011LineSegment(state, {type: "replay"}),
    createCourseG04L11In011LineSegmentState());
  assert.equal(COURSE_G04_L11_IN_011_INTERACTION_AUTHORITY
    .sourceTerminalBehaviorEstablished, false);
});

test("invalid frames and invented controls fail closed", () => {
  assert.throws(() => createCourseG04L11In011LineSegmentState(836),
    /invalid IN011 local frame/u);
  assert.throws(() => reduceCourseG04L11In011LineSegment(
    createCourseG04L11In011LineSegmentState(),
    {type: "select-term", termId: "old-shell" as "line", frame: 1}),
  /unknown IN011 term/u);
});

test("candidate authority excludes shell, audio, fidelity, and release", () => {
  assert.equal(COURSE_G04_L11_IN_011_INTERACTION_AUTHORITY
    .animationInternalPedagogicalControlsPreserved, true);
  assert.equal(COURSE_G04_L11_IN_011_INTERACTION_AUTHORITY
    .legacyCourseShellNavigationIncluded, false);
  assert.equal(COURSE_G04_L11_IN_011_INTERACTION_AUTHORITY.sourceAudioEnabled, false);
  assert.equal(COURSE_G04_L11_IN_011_INTERACTION_AUTHORITY
    .registeredCurrentJavascript, false);
  assert.equal(COURSE_G04_L11_IN_011_INTERACTION_AUTHORITY.strictAcceptanceEffect,
    "none");
});
