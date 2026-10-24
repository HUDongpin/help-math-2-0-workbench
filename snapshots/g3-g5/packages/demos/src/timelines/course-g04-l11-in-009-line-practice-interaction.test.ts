import assert from "node:assert/strict";
import test from "node:test";

import {
  COURSE_G04_L11_IN_009_INTERACTION_AUTHORITY,
  COURSE_G04_L11_IN_009_INTERACTION_SOURCE,
  createCourseG04L11In009PracticeState,
  parseCourseG04L11In009As2Number,
  reduceCourseG04L11In009Practice,
} from "./course-g04-l11-in-009-line-practice-interaction";

function quiz(seed = 0) {
  return createCourseG04L11In009PracticeState(407, seed);
}
function setAndPlot(
  state: ReturnType<typeof quiz>,
  row: number,
  value: string,
) {
  const entered = reduceCourseG04L11In009Practice(state,
    {type: "set-input", row, value});
  return reduceCourseG04L11In009Practice(entered, {type: "plot-row", row});
}

test("binds the five source rows and all animation-internal controls", () => {
  assert.equal(COURSE_G04_L11_IN_009_INTERACTION_SOURCE.sourceFrameCount, 421);
  assert.equal(COURSE_G04_L11_IN_009_INTERACTION_SOURCE.naturalQuizStopFrame, 407);
  assert.equal(COURSE_G04_L11_IN_009_INTERACTION_SOURCE.sourcePlotPointControlCount, 5);
  assert.equal(COURSE_G04_L11_IN_009_INTERACTION_SOURCE.sourceDrawLineControlCount, 1);
  assert.equal(COURSE_G04_L11_IN_009_INTERACTION_SOURCE.sourceGlossaryControlCount, 4);
  assert.equal(COURSE_G04_L11_IN_009_INTERACTION_SOURCE.sourceEmbeddedStreamCount, 9);
  assert.equal(COURSE_G04_L11_IN_009_INTERACTION_AUTHORITY.legacyCourseShellNavigationIncluded, false);
  assert.equal(COURSE_G04_L11_IN_009_INTERACTION_AUTHORITY.registeredCurrentJavascript, false);
});

test("natural candidate playback stops at executed quiz frame 407", () => {
  let state = createCourseG04L11In009PracticeState(1, 9);
  state = reduceCourseG04L11In009Practice(state,
    {type: "synchronize-frame", frame: 406});
  assert.equal(state.phase, "instruction");
  assert.equal(state.playing, true);
  assert.equal(state.sourceCanvasFrame, 406);
  state = reduceCourseG04L11In009Practice(state,
    {type: "synchronize-frame", frame: 421});
  assert.equal(state.frame, 407);
  assert.equal(state.phase, "quiz");
  assert.equal(state.playing, false);
  assert.equal(state.sourceCanvasFrame, 406,
    "executed quiz must not use the misleading static frame-407 export");
  assert.deepEqual(state.rows.map((row) => row.completed),
    [false, false, false, false, false]);
});

test("models the source AS2 Number conversion boundary", () => {
  assert.equal(parseCourseG04L11In009As2Number(""), 0);
  assert.equal(parseCourseG04L11In009As2Number("   "), 0);
  assert.equal(parseCourseG04L11In009As2Number("03"), 3);
  assert.equal(parseCourseG04L11In009As2Number("3.0"), 3);
  assert.equal(parseCourseG04L11In009As2Number("3e0"), 3);
  assert.equal(parseCourseG04L11In009As2Number("0x3"), 3);
  assert.equal(Number.isNaN(parseCourseG04L11In009As2Number("three")), true);
  assert.equal(Number.isNaN(parseCourseG04L11In009As2Number("3px")), true);
});

test("correct Plot Point completes one row and prevents duplicate counting", () => {
  const state = setAndPlot(quiz(), 1, "3");
  assert.equal(state.rows[0].completed, true);
  assert.equal(state.rows[0].attemptCount, 1);
  assert.equal(state.completedCount, 1);
  assert.equal(state.feedback?.kind, "correct");
  assert.equal(state.drawLineVisible, false);
  assert.throws(() => reduceCourseG04L11In009Practice(state,
    {type: "plot-row", row: 1}), /row 1 is complete/);
});

test("every row preserves first-error retry and second-error autofill", () => {
  for (const [row, expected] of [3, 4, 5, 6, 7].entries()) {
    let state = setAndPlot(quiz(row), row + 1, "wrong");
    assert.equal(state.feedback?.kind, "first-wrong");
    assert.equal(state.feedback?.message, "Oops! Try again.");
    assert.equal(state.rows[row].input, "");
    assert.equal(state.rows[row].tryAgain, true);
    assert.match(state.coachBranch ?? "", /^S[1-4]$/);
    state = reduceCourseG04L11In009Practice(state, {type: "close-feedback"});
    state = setAndPlot(state, row + 1, "still wrong");
    assert.equal(state.feedback?.kind, "second-wrong");
    assert.equal(state.feedback?.message,
      `When x = ${row + 1}, y = ${expected}`);
    assert.equal(state.rows[row].input, String(expected));
    assert.equal(state.rows[row].completed, true);
    assert.equal(state.completedCount, 1);
  }
});

test("mixed-order completion reveals Draw Line at exactly five rows", () => {
  let state = quiz(42);
  for (const row of [5, 2, 4, 1]) {
    state = setAndPlot(state, row, String(row + 2));
    assert.equal(state.drawLineVisible, false);
  }
  state = setAndPlot(state, 3, "5");
  assert.equal(state.completedCount, 5);
  assert.equal(state.drawLineVisible, true);
  assert.equal(state.lineDrawn, false);
  state = reduceCourseG04L11In009Practice(state, {type: "draw-line"});
  assert.equal(state.phase, "line-complete");
  assert.equal(state.frame, 421);
  assert.equal(state.sourceCanvasFrame, 421);
  assert.equal(state.lineDrawn, true);
  assert.equal(state.feedback?.message, "YOU GOT IT!");
});

test("glossary controls stay contained and Replay resets the full state", () => {
  let state = quiz(3);
  state = reduceCourseG04L11In009Practice(state,
    {type: "select-term", termId: "point", frame: 407});
  assert.equal(state.glossaryOpen, true);
  assert.equal(state.selectedTermId, "point");
  assert.equal(state.legacyHostCallCount, 0);
  state = reduceCourseG04L11In009Practice(state, {type: "close-term"});
  state = setAndPlot(state, 2, "4");
  state = reduceCourseG04L11In009Practice(state, {type: "replay"});
  assert.equal(state.frame, 1);
  assert.equal(state.phase, "instruction");
  assert.equal(state.playing, true);
  assert.equal(state.completedCount, 0);
  assert.equal(state.rows.every((row) => row.input === "" && !row.completed), true);
});

test("invalid and premature events fail closed", () => {
  assert.throws(() => createCourseG04L11In009PracticeState(0), /invalid/);
  assert.throws(() => createCourseG04L11In009PracticeState(422), /invalid/);
  assert.throws(() => reduceCourseG04L11In009Practice(quiz(),
    {type: "set-input", row: 0, value: "3"}), /invalid/);
  assert.throws(() => reduceCourseG04L11In009Practice(
    createCourseG04L11In009PracticeState(100),
    {type: "plot-row", row: 1}), /not available/);
  assert.throws(() => reduceCourseG04L11In009Practice(quiz(),
    {type: "draw-line"}), /not available/);
  assert.throws(() => reduceCourseG04L11In009Practice(quiz(),
    {type: "select-term", termId: "shell" as "point", frame: 407}), /unknown/);
});
