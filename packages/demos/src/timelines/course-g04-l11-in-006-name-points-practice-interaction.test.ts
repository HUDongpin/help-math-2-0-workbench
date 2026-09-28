import assert from "node:assert/strict";
import test from "node:test";

import {COURSE_G04_L11_IN_006_POINTS} from
  "../source-static/g4-l11/course-g04-l11-in-006-static";
import {COURSE_G04_L11_IN_006_INTERACTION_AUTHORITY,
  COURSE_G04_L11_IN_006_TERMS, createCourseG04L11In006PracticeState,
  reduceCourseG04L11In006Practice} from
  "./course-g04-l11-in-006-name-points-practice-interaction";

function enter(label: "A" | "B" | "C" | "D", x: string, y: string) {
  let state = createCourseG04L11In006PracticeState(275);
  state = reduceCourseG04L11In006Practice(state, {type: "select-point", label});
  state = reduceCourseG04L11In006Practice(state,
    {type: "update-field", label, axis: "x", value: x});
  return reduceCourseG04L11In006Practice(state,
    {type: "update-field", label, axis: "y", value: y});
}

test("binds four exact source points, eight fields, and six internal glossary controls", () => {
  assert.deepEqual(COURSE_G04_L11_IN_006_POINTS.map(({label, x, y}) => ({label, x, y})),
    [{label: "A", x: 6, y: 8}, {label: "B", x: 4, y: 2},
      {label: "C", x: 1, y: 4}, {label: "D", x: 9, y: 5}]);
  assert.equal(COURSE_G04_L11_IN_006_POINTS.flatMap((point) => point.sourceFields).length, 8);
  assert.deepEqual(COURSE_G04_L11_IN_006_TERMS.map((term) => term.sourceButtonObjectId),
    [8, 9, 10, 60, 61, 79]);
});
test("natural candidate playback stops at the name-points practice", () => {
  const state = createCourseG04L11In006PracticeState(287);
  assert.equal(state.frame, 275); assert.equal(state.phase, "name-points-practice");
  assert.equal(state.playing, false);
});
test("correct source pairs produce correct feedback with AS2 parseInt compatibility", () => {
  let state = enter("A", "6 apples", "08");
  state = reduceCourseG04L11In006Practice(state, {type: "submit"});
  assert.equal(state.feedback, "correct"); assert.equal(state.feedbackPoint, "A");
  assert.equal(state.controlsEnabled, false);
  state = reduceCourseG04L11In006Practice(state, {type: "dismiss-feedback"});
  assert.equal(state.selectedPoint, null); assert.equal(state.controlsEnabled, true);
});
test("first error requires a retry and the second error reveals the exact source pair", () => {
  let state = enter("B", "7", "7");
  state = reduceCourseG04L11In006Practice(state, {type: "submit"});
  assert.equal(state.feedback, "first-wrong"); assert.deepEqual(state.tryAgainPoints, ["B"]);
  assert.equal(state.controlsEnabled, false);
  state = reduceCourseG04L11In006Practice(state, {type: "dismiss-feedback"});
  assert.equal(state.selectedPoint, null); assert.deepEqual(state.tryAgainPoints, ["B"]);
  state = reduceCourseG04L11In006Practice(state, {type: "select-point", label: "B"});
  state = reduceCourseG04L11In006Practice(state, {type: "submit"});
  assert.equal(state.feedback, "second-wrong-reveal");
  assert.deepEqual(state.fields.B, {x: "4", y: "2"});
  assert.equal(state.selectedPoint, null); assert.deepEqual(state.tryAgainPoints, []);
});
test("Clear affects only the selected pair, or all eight fields when no point is selected", () => {
  let state = enter("C", "1", "4");
  state = reduceCourseG04L11In006Practice(state,
    {type: "update-field", label: "A", axis: "x", value: "6"});
  state = reduceCourseG04L11In006Practice(state, {type: "clear"});
  assert.deepEqual(state.fields.C, {x: "", y: ""}); assert.equal(state.fields.A.x, "6");
  state = reduceCourseG04L11In006Practice(state, {type: "submit"});
  assert.equal(state.feedback, "first-wrong");
  state = reduceCourseG04L11In006Practice(state, {type: "dismiss-feedback"});
  state = reduceCourseG04L11In006Practice(state, {type: "clear"});
  assert.ok(Object.values(state.fields).every((pair) => pair.x === "" && pair.y === ""));
});
test("glossary stays contained and Replay resets without expanding authority", () => {
  let state = createCourseG04L11In006PracticeState(100);
  state = reduceCourseG04L11In006Practice(state,
    {type: "select-term", termId: "ordered-pair"});
  assert.equal(state.playing, false); assert.equal(state.legacyHostCallCount, 0);
  state = reduceCourseG04L11In006Practice(state, {type: "replay"});
  assert.deepEqual(state, createCourseG04L11In006PracticeState(1));
  assert.equal(COURSE_G04_L11_IN_006_INTERACTION_AUTHORITY.registeredCurrentJavascript,
    false);
});
test("invalid or premature events fail closed", () => {
  assert.throws(() => createCourseG04L11In006PracticeState(0), /invalid IN006 frame/u);
  assert.throws(() => reduceCourseG04L11In006Practice(
    createCourseG04L11In006PracticeState(10), {type: "select-point", label: "A"}),
  /not enabled/u);
  assert.throws(() => reduceCourseG04L11In006Practice(
    createCourseG04L11In006PracticeState(275), {type: "submit"}), /selected point/u);
  assert.throws(() => reduceCourseG04L11In006Practice(
    createCourseG04L11In006PracticeState(275),
    {type: "select-point", label: "Z" as "A"}), /unknown IN006 point/u);
});
