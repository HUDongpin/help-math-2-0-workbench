import assert from "node:assert/strict";
import test from "node:test";

import {COURSE_G04_L11_IN_005_POINTS} from
  "../source-static/g4-l11/course-g04-l11-in-005-static";
import {COURSE_G04_L11_IN_005_INTERACTION_AUTHORITY,
  COURSE_G04_L11_IN_005_TERMS, createCourseG04L11In005HoverState,
  reduceCourseG04L11In005Hover} from "./course-g04-l11-in-005-point-hover-interaction";

test("binds the six exact source points and three internal glossary controls", () => {
  assert.deepEqual(COURSE_G04_L11_IN_005_POINTS.map(({label, x, y}) => ({label, x, y})),
    [{label: "A", x: 2, y: 3}, {label: "B", x: 5, y: 2},
      {label: "C", x: 8, y: 1}, {label: "D", x: 10, y: 7},
      {label: "E", x: 5, y: 5}, {label: "F", x: 1, y: 8}]);
  assert.deepEqual(COURSE_G04_L11_IN_005_TERMS.map((term) => term.sourceButtonObjectId),
    [67, 68, 106]);
});
test("natural candidate playback stops at the hover practice", () => {
  const state = createCourseG04L11In005HoverState(661);
  assert.equal(state.frame, 647); assert.equal(state.phase, "hover-practice");
  assert.equal(state.playing, false);
});
test("hover, focus, or click reveals exact coordinates cumulatively", () => {
  let state = createCourseG04L11In005HoverState(647);
  state = reduceCourseG04L11In005Hover(state, {type: "reveal-point", label: "A"});
  state = reduceCourseG04L11In005Hover(state, {type: "reveal-point", label: "F"});
  assert.deepEqual(state.revealedPoints, ["A", "F"]);
  assert.equal(state.selectedPoint, "F");
});
test("glossary pauses locally without invoking legacy host calls", () => {
  let state = createCourseG04L11In005HoverState(300);
  state = reduceCourseG04L11In005Hover(state,
    {type: "select-term", termId: "coordinate-grid"});
  assert.equal(state.playing, false); assert.equal(state.legacyHostCallCount, 0);
  state = reduceCourseG04L11In005Hover(state, {type: "close-term"});
  assert.equal(state.selectedTermId, null);
});
test("Replay resets all modern interaction state without expanding authority", () => {
  let state = createCourseG04L11In005HoverState(647);
  state = reduceCourseG04L11In005Hover(state, {type: "reveal-point", label: "D"});
  state = reduceCourseG04L11In005Hover(state, {type: "replay"});
  assert.deepEqual(state, createCourseG04L11In005HoverState(1));
  assert.equal(COURSE_G04_L11_IN_005_INTERACTION_AUTHORITY.registeredCurrentJavascript,
    false);
});
test("invalid frames, labels, terms, and early point reveals fail closed", () => {
  assert.throws(() => createCourseG04L11In005HoverState(0), /invalid IN005 frame/u);
  assert.throws(() => reduceCourseG04L11In005Hover(
    createCourseG04L11In005HoverState(10), {type: "reveal-point", label: "A"}),
  /not enabled/u);
  assert.throws(() => reduceCourseG04L11In005Hover(
    createCourseG04L11In005HoverState(647),
    {type: "reveal-point", label: "Z" as "A"}), /unknown IN005 point/u);
});
