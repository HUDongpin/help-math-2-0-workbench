import assert from "node:assert/strict";
import test from "node:test";

import {COURSE_G04_L11_TI_005_GLOSSARY, COURSE_G04_L11_TI_005_ROWS,
  COURSE_G04_L11_TI_005_STATIC_SOURCE_FACTS} from
  "../source-static/g4-l11/course-g04-l11-ti-005-static";
import {COURSE_G04_L11_TI_005_INTERACTION_AUTHORITY,
  createCourseG04L11Ti005EquationPlotState,
  getCourseG04L11Ti005SelectedGlossary,
  reduceCourseG04L11Ti005EquationPlot} from
  "./course-g04-l11-ti-005-equation-plot-interaction";

const reduce = reduceCourseG04L11Ti005EquationPlot;
const working = () => createCourseG04L11Ti005EquationPlotState(419);
const enter = (state: ReturnType<typeof working>, rowId: "row-1" | "row-2" |
  "row-3" | "row-4" | "row-5", value: string) =>
  reduce(state, {type: "set-row-input", rowId, value});

test("locks the exact x + 3 = y table and modern Lesson shell boundary", () => {
  assert.equal(COURSE_G04_L11_TI_005_STATIC_SOURCE_FACTS.release.ordinal, 29);
  assert.equal(COURSE_G04_L11_TI_005_STATIC_SOURCE_FACTS.principalTimeline.frameCount, 433);
  assert.deepEqual(COURSE_G04_L11_TI_005_ROWS.map(({x, y}) => ({x, y})), [
    {x: 1, y: 4}, {x: 2, y: 5}, {x: 3, y: 6}, {x: 4, y: 7}, {x: 5, y: 8},
  ]);
  assert.equal(COURSE_G04_L11_TI_005_GLOSSARY.length, 11);
  assert.equal(COURSE_G04_L11_TI_005_INTERACTION_AUTHORITY.
    legacyCourseShellNavigationIncluded, false);
  assert.equal(COURSE_G04_L11_TI_005_INTERACTION_AUTHORITY.
    animationInternalPedagogicalControlsPreserved, true);
});

test("maps source frame 419 to the clean modern interaction background", () => {
  const state = working(); assert.equal(state.phase, "working");
  assert.equal(state.sourceCanvasFrame, 418); assert.equal(state.completedRowIds.length, 0);
  assert.equal(state.drawLineVisible, false); assert.equal(state.sourceAudioEnabled, false);
});

test("each correct source row plots exactly once", () => {
  let state = working();
  for (const row of COURSE_G04_L11_TI_005_ROWS) {
    state = enter(state, row.id, String(row.y));
    state = reduce(state, {type: "plot-row", rowId: row.id});
    assert.equal(state.rows[row.id].completionOrigin, "learner-correct");
  }
  assert.equal(state.completedRowIds.length, 5); assert.equal(state.phase, "ready-line");
  assert.equal(state.drawLineVisible, true);
  assert.throws(() => reduce(state, {type: "plot-row", rowId: "row-1"}),
    /Plot Point is not available/u);
});

test("first wrong clears only its row and cleanly retries", () => {
  let state = enter(working(), "row-2", "4");
  state = reduce(state, {type: "plot-row", rowId: "row-2"});
  assert.equal(state.phase, "feedback"); assert.equal(state.feedbackKind, "retry");
  assert.equal(state.rows["row-2"].input, ""); assert.equal(state.rows["row-2"].wrongAttempts, 1);
  state = reduce(state, {type: "close-feedback"}); assert.equal(state.phase, "working");
});

for (const row of COURSE_G04_L11_TI_005_ROWS) test(
  `second wrong reveals and plots ${row.id}`, () => {
    let state = enter(working(), row.id, "0");
    state = reduce(state, {type: "plot-row", rowId: row.id});
    state = reduce(state, {type: "close-feedback"});
    state = enter(state, row.id, "1");
    state = reduce(state, {type: "plot-row", rowId: row.id});
    assert.equal(state.feedbackKind, "revealed");
    assert.equal(state.rows[row.id].input, String(row.y));
    assert.equal(state.rows[row.id].completionOrigin, "source-second-attempt-reveal");
    assert.deepEqual(state.completedRowIds, [row.id]);
  });

test("revealed rows count toward the exact five-point Draw Line threshold", () => {
  let state = working();
  for (const [index, row] of COURSE_G04_L11_TI_005_ROWS.entries()) {
    state = enter(state, row.id, index === 4 ? "0" : String(row.y));
    state = reduce(state, {type: "plot-row", rowId: row.id});
    if (state.phase === "feedback") state = reduce(state, {type: "close-feedback"});
  }
  state = enter(state, "row-5", "1");
  state = reduce(state, {type: "plot-row", rowId: "row-5"});
  state = reduce(state, {type: "close-feedback"});
  assert.equal(state.completedRowIds.length, 5); assert.equal(state.phase, "ready-line");
  state = reduce(state, {type: "draw-line"});
  assert.equal(state.phase, "line-drawn"); assert.equal(state.lineDrawn, true);
  assert.throws(() => reduce(state, {type: "draw-line"}), /not available/u);
});

test("help and glossary preserve table progress", () => {
  let state = enter(working(), "row-3", "6");
  state = reduce(state, {type: "open-help"}); state = reduce(state, {type: "close-help"});
  assert.equal(state.rows["row-3"].input, "6");
  state = reduce(state, {type: "open-glossary", glossaryId: "line-segment"});
  assert.equal(getCourseG04L11Ti005SelectedGlossary(state)?.label, "Line segment");
  state = reduce(state, {type: "close-glossary"}); assert.equal(state.phase, "working");
});

test("canonical integer input rejects legacy Number coercion ambiguity", () => {
  const state = enter(working(), "row-1", "04");
  assert.throws(() => reduce(state, {type: "plot-row", rowId: "row-1"}),
    /requires a canonical integer/u);
  assert.throws(() => enter(working(), "row-1", "11"), /invalid TI005 y-value/u);
});

test("Replay and invalid events fail closed without authority expansion", () => {
  const state = reduce(enter(working(), "row-1", "4"), {type: "replay"});
  assert.equal(state.phase, "instruction"); assert.equal(state.rows["row-1"].input, "");
  assert.equal(state.sourceAudioAccepted, false);
  assert.throws(() => createCourseG04L11Ti005EquationPlotState(0), /invalid TI005/u);
  assert.throws(() => reduce(working(), {type: "draw-line"}), /not available/u);
  assert.equal(COURSE_G04_L11_TI_005_INTERACTION_AUTHORITY.strictMigrationComplete, false);
});
