import assert from "node:assert/strict";
import test from "node:test";

import {COURSE_G04_L11_IN_007_CHOICES, COURSE_G04_L11_IN_007_POINT} from
  "../source-static/g4-l11/course-g04-l11-in-007-static";
import {COURSE_G04_L11_IN_007_INTERACTION_AUTHORITY,
  COURSE_G04_L11_IN_007_TERMS, createCourseG04L11In007ChoiceState,
  reduceCourseG04L11In007Choice} from "./course-g04-l11-in-007-point-z-choice-interaction";

test("binds point Z, source choice order, answer identity, and internal terms", () => {
  assert.deepEqual(COURSE_G04_L11_IN_007_POINT, {label: "Z", x: 7, y: 5});
  assert.deepEqual(COURSE_G04_L11_IN_007_CHOICES.map(({label, correct}) =>
    ({label, correct})), [{label: "(5,7)", correct: false},
    {label: "(7,5)", correct: true}, {label: "(7,7)", correct: false}]);
  assert.deepEqual(COURSE_G04_L11_IN_007_TERMS.filter((term) => term.principal)
    .map((term) => term.sourceButtonObjectId), [25, 26, 27]);
  assert.deepEqual(COURSE_G04_L11_IN_007_TERMS.filter((term) => !term.principal)
    .map((term) => term.label), ["Number", "Unit", "Zero", "X-axis"]);
});
test("natural candidate playback stops at the source question boundary", () => {
  const state = createCourseG04L11In007ChoiceState(137);
  assert.equal(state.frame, 66); assert.equal(state.phase, "point-z-question");
  assert.equal(state.playing, false);
});
test("either wrong source choice locks controls and Close enables a clean retry", () => {
  for (const choiceId of ["five-seven", "seven-seven"] as const) {
    let state = createCourseG04L11In007ChoiceState(66);
    state = reduceCourseG04L11In007Choice(state, {type: "choose", choiceId});
    assert.equal(state.feedback, "wrong"); assert.equal(state.controlsEnabled, false);
    assert.equal(state.wrongAttemptCount, 1); assert.equal(state.completed, false);
    state = reduceCourseG04L11In007Choice(state, {type: "dismiss-feedback"});
    assert.equal(state.feedback, "none"); assert.equal(state.selectedChoice, null);
    assert.equal(state.controlsEnabled, true);
  }
});
test("the exact (7,5) choice produces completion and remains locked until Replay", () => {
  let state = createCourseG04L11In007ChoiceState(66);
  state = reduceCourseG04L11In007Choice(state,
    {type: "choose", choiceId: "seven-five"});
  assert.equal(state.feedback, "correct"); assert.equal(state.completed, true);
  state = reduceCourseG04L11In007Choice(state, {type: "dismiss-feedback"});
  assert.equal(state.feedback, "none"); assert.equal(state.controlsEnabled, false);
  assert.throws(() => reduceCourseG04L11In007Choice(state,
    {type: "choose", choiceId: "five-seven"}), /locked/u);
  state = reduceCourseG04L11In007Choice(state, {type: "replay"});
  assert.deepEqual(state, createCourseG04L11In007ChoiceState(1));
});
test("principal and wrong-feedback glossary terms remain contained", () => {
  let state = createCourseG04L11In007ChoiceState(66);
  for (const termId of ["ordered-pair", "point", "coordinate-grid", "number", "unit",
    "zero", "x-axis"] as const) {
    state = reduceCourseG04L11In007Choice(state, {type: "select-term", termId});
    assert.equal(state.selectedTermId, termId); assert.equal(state.legacyHostCallCount, 0);
    state = reduceCourseG04L11In007Choice(state, {type: "close-term"});
  }
  assert.equal(COURSE_G04_L11_IN_007_INTERACTION_AUTHORITY.registeredCurrentJavascript,
    false);
});
test("invalid frames, early choices, and unknown choices or terms fail closed", () => {
  assert.throws(() => createCourseG04L11In007ChoiceState(0), /invalid IN007 frame/u);
  assert.throws(() => reduceCourseG04L11In007Choice(
    createCourseG04L11In007ChoiceState(20), {type: "choose", choiceId: "seven-five"}),
  /not enabled/u);
  assert.throws(() => reduceCourseG04L11In007Choice(
    createCourseG04L11In007ChoiceState(66),
    {type: "choose", choiceId: "bad" as "seven-five"}), /unknown IN007 choice/u);
  assert.throws(() => reduceCourseG04L11In007Choice(
    createCourseG04L11In007ChoiceState(66),
    {type: "select-term", termId: "bad" as "point"}), /unknown IN007 term/u);
});
