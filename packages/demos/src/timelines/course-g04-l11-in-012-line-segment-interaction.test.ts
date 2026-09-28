import assert from "node:assert/strict";
import test from "node:test";

import {COURSE_G04_L11_IN_012_STATIC_EVIDENCE,
  COURSE_G04_L11_IN_012_STATIC_SOURCE_FACTS} from
  "../source-static/g4-l11/course-g04-l11-in-012-static";
import {COURSE_G04_L11_IN_012_INTERACTION_AUTHORITY,
  COURSE_G04_L11_IN_012_INTERACTION_SOURCE, COURSE_G04_L11_IN_012_TERMS,
  createCourseG04L11In012LineSegmentState,
  getCourseG04L11In012SelectedTerm,
  reduceCourseG04L11In012LineSegment} from
  "./course-g04-l11-in-012-line-segment-interaction";

test("binds exact IN012 evidence and the 440-frame source timeline", () => {
  assert.equal(COURSE_G04_L11_IN_012_STATIC_EVIDENCE.swf.bytes, 176_194);
  assert.equal(COURSE_G04_L11_IN_012_STATIC_EVIDENCE.externalSpanishAudio.bytes,
    320_208);
  assert.equal(COURSE_G04_L11_IN_012_STATIC_EVIDENCE.frameDomainDisposition.sha256,
    "655f13924d26c89da58ba1ed814089d4d44a7225f81164fbdaa33c4ee10d112a");
  assert.equal(COURSE_G04_L11_IN_012_STATIC_SOURCE_FACTS.release.ordinal, 24);
  assert.equal(COURSE_G04_L11_IN_012_INTERACTION_SOURCE.sourceTimelineId, "sprite-68");
  assert.equal(COURSE_G04_L11_IN_012_INTERACTION_SOURCE.sourceFrameCount, 440);
  assert.equal(COURSE_G04_L11_IN_012_INTERACTION_SOURCE.sourceTerminalStopFrame, null);
  assert.equal(Object.isFrozen(COURSE_G04_L11_IN_012_STATIC_SOURCE_FACTS), true);
});

test("preserves the exact vertical example and conclusion", () => {
  assert.equal(COURSE_G04_L11_IN_012_INTERACTION_SOURCE.orientation, "vertical");
  assert.deepEqual(COURSE_G04_L11_IN_012_INTERACTION_SOURCE.endpoints,
    [{x: 3, y: 1, orderedPair: "(3,1)"}, {x: 3, y: 9, orderedPair: "(3,9)"}]);
  assert.equal(COURSE_G04_L11_IN_012_INTERACTION_SOURCE.subtraction, "9 − 1 = 8");
  assert.equal(COURSE_G04_L11_IN_012_INTERACTION_SOURCE.conclusion,
    "length = 8 units");
});

test("both internal glossary controls pause without old host calls", () => {
  assert.deepEqual(COURSE_G04_L11_IN_012_TERMS.map((term) =>
    [term.sourceButtonObjectId, term.sourceKeyAttribute]), [
    ["66", "Length"], ["67", "Unit"],
  ]);
  for (const term of COURSE_G04_L11_IN_012_TERMS) {
    const selected = reduceCourseG04L11In012LineSegment(
      createCourseG04L11In012LineSegmentState(240),
      {type: "select-term", termId: term.id, frame: 240});
    assert.equal(selected.playing, false); assert.equal(selected.panelOpen, true);
    assert.equal(selected.legacyHostCallCount, 0); assert.equal(selected.audioEnabled, false);
    assert.equal(selected.externalSpanishAudioEnabled, false);
    assert.equal(getCourseG04L11In012SelectedTerm(selected)?.label, term.label);
  }
});

test("modern pause, resume, and Replay are deterministic but acceptance-neutral", () => {
  let state = createCourseG04L11In012LineSegmentState(200);
  state = reduceCourseG04L11In012LineSegment(state, {type: "pause", frame: 200});
  assert.equal(state.playing, false);
  assert.equal(reduceCourseG04L11In012LineSegment(state,
    {type: "synchronize-frame", frame: 240}), state);
  state = reduceCourseG04L11In012LineSegment(state, {type: "resume", frame: 240});
  assert.equal(state.playing, true); assert.equal(state.frame, 240);
  state = reduceCourseG04L11In012LineSegment(state,
    {type: "synchronize-frame", frame: 440});
  assert.equal(state.playing, false);
  assert.deepEqual(reduceCourseG04L11In012LineSegment(state, {type: "replay"}),
    createCourseG04L11In012LineSegmentState());
  assert.equal(COURSE_G04_L11_IN_012_INTERACTION_AUTHORITY
    .sourceTerminalBehaviorEstablished, false);
});

test("invalid frames and invented controls fail closed", () => {
  assert.throws(() => createCourseG04L11In012LineSegmentState(441),
    /invalid IN012 local frame/u);
  assert.throws(() => reduceCourseG04L11In012LineSegment(
    createCourseG04L11In012LineSegmentState(),
    {type: "select-term", termId: "old-shell" as "length", frame: 1}),
  /unknown IN012 term/u);
});

test("candidate authority excludes shell, audio, fidelity, and release", () => {
  assert.equal(COURSE_G04_L11_IN_012_INTERACTION_AUTHORITY
    .animationInternalPedagogicalControlsPreserved, true);
  assert.equal(COURSE_G04_L11_IN_012_INTERACTION_AUTHORITY
    .legacyCourseShellNavigationIncluded, false);
  assert.equal(COURSE_G04_L11_IN_012_INTERACTION_AUTHORITY.sourceAudioEnabled, false);
  assert.equal(COURSE_G04_L11_IN_012_INTERACTION_AUTHORITY
    .externalSpanishAudioEnabled, false);
  assert.equal(COURSE_G04_L11_IN_012_INTERACTION_AUTHORITY
    .registeredCurrentJavascript, false);
  assert.equal(COURSE_G04_L11_IN_012_INTERACTION_AUTHORITY.strictAcceptanceEffect,
    "none");
});
