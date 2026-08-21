import assert from "node:assert/strict";
import test from "node:test";

import {COURSE_G04_L11_IN_008_STATIC_EVIDENCE,
  COURSE_G04_L11_IN_008_STATIC_SOURCE_FACTS} from
  "../source-static/g4-l11/course-g04-l11-in-008-static";
import {COURSE_G04_L11_IN_008_PLAYBACK_AUTHORITY,
  COURSE_G04_L11_IN_008_PLAYBACK_SOURCE,
  createCourseG04L11In008PlaybackState, getCourseG04L11In008VisualPhase,
  reduceCourseG04L11In008Playback} from "./course-g04-l11-in-008-plot-line-playback";

test("binds the exact SWF-only source and ordinary evidence", () => {
  assert.equal(COURSE_G04_L11_IN_008_STATIC_EVIDENCE.swf.bytes, 580_167);
  assert.equal(COURSE_G04_L11_IN_008_STATIC_EVIDENCE.swf.sha256,
    "0b52735b2a6dcd67beb85f3cf9ca99d660cb92d7c27a3f280d664a51cf24c74a");
  assert.equal(COURSE_G04_L11_IN_008_STATIC_EVIDENCE.fla, null);
  assert.equal(COURSE_G04_L11_IN_008_STATIC_EVIDENCE.frameDomainDisposition.sha256,
    "cd46c73f853e333a9a822265891af745b721d1af335f4f265a79fefb6eb7f9ad");
  assert.equal(COURSE_G04_L11_IN_008_STATIC_SOURCE_FACTS.release.ordinal, 20);
});

test("binds all nine plotted points, seven source table rows, and equation", () => {
  assert.equal(COURSE_G04_L11_IN_008_PLAYBACK_SOURCE.sourceFrameCount, 1_478);
  assert.deepEqual(COURSE_G04_L11_IN_008_PLAYBACK_SOURCE.plottedPoints.map(
    (point) => point.orderedPair), ["(1,2)", "(2,3)", "(3,4)", "(4,5)",
    "(5,6)", "(6,7)", "(7,8)", "(8,9)", "(9,10)"]);
  assert.equal(COURSE_G04_L11_IN_008_PLAYBACK_SOURCE.sourceTableRows.length, 7);
  assert.equal(COURSE_G04_L11_IN_008_PLAYBACK_SOURCE.sourceEquation, "x + 1 = y");
});

test("maps the source-observed visual phase boundaries", () => {
  assert.equal(getCourseG04L11In008VisualPhase(1), "initial-grid");
  assert.equal(getCourseG04L11In008VisualPhase(11), "plot-and-connect-first-five");
  assert.equal(getCourseG04L11In008VisualPhase(382), "table-scaffold");
  assert.equal(getCourseG04L11In008VisualPhase(554), "table-values");
  assert.equal(getCourseG04L11In008VisualPhase(1_014), "equation");
  assert.equal(getCourseG04L11In008VisualPhase(1_148), "extend-pattern");
  assert.equal(getCourseG04L11In008VisualPhase(1_447), "final-source-visual");
});

test("modern pause holds locally and resume rejoins the host frame", () => {
  let state = createCourseG04L11In008PlaybackState(600);
  state = reduceCourseG04L11In008Playback(state, {type: "pause"});
  assert.equal(state.playing, false);
  assert.equal(reduceCourseG04L11In008Playback(state,
    {type: "synchronize-frame", frame: 900}), state);
  state = reduceCourseG04L11In008Playback(state, {type: "resume", frame: 900});
  assert.equal(state.frame, 900);
  assert.equal(state.playing, true);
  assert.equal(state.audioEnabled, false);
});

test("candidate holds frame 1478 and Replay resets without parity claims", () => {
  let state = createCourseG04L11In008PlaybackState(1_477);
  state = reduceCourseG04L11In008Playback(state,
    {type: "synchronize-frame", frame: 1_478});
  assert.equal(state.playing, false);
  state = reduceCourseG04L11In008Playback(state, {type: "replay"});
  assert.equal(state.frame, 1);
  assert.equal(state.modernLessonControl, "replay");
  assert.equal(COURSE_G04_L11_IN_008_PLAYBACK_AUTHORITY
    .sourceTerminalBehaviorEstablished, false);
});

test("invalid frames and authority expansion fail closed", () => {
  assert.throws(() => createCourseG04L11In008PlaybackState(1_479),
    /invalid IN008 local frame/u);
  assert.equal(COURSE_G04_L11_IN_008_PLAYBACK_AUTHORITY
    .animationInternalPedagogicalControlsInvented, false);
  assert.equal(COURSE_G04_L11_IN_008_PLAYBACK_AUTHORITY.registeredCurrentJavascript,
    false);
  assert.equal(COURSE_G04_L11_IN_008_PLAYBACK_AUTHORITY.strictAcceptanceEffect,
    "none");
});
