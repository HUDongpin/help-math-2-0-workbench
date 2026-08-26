import assert from "node:assert/strict";
import test from "node:test";

import {COURSE_G04_L11_TI_004_GLOSSARY, COURSE_G04_L11_TI_004_POINTS,
  COURSE_G04_L11_TI_004_STATIC_SOURCE_FACTS} from
  "../source-static/g4-l11/course-g04-l11-ti-004-static";
import {COURSE_G04_L11_TI_004_INTERACTION_AUTHORITY,
  createCourseG04L11Ti004PointEntryState,
  getCourseG04L11Ti004SelectedGlossary,
  reduceCourseG04L11Ti004PointEntry} from
  "./course-g04-l11-ti-004-point-entry-interaction";

const reduce = reduceCourseG04L11Ti004PointEntry;
const select = (id: "A" | "B" | "C" | "D" | "E") =>
  reduce(createCourseG04L11Ti004PointEntryState(274), {type: "select-point", pointId: id});
const enter = (state: ReturnType<typeof select>, x: string, y: string) =>
  reduce(reduce(state, {type: "set-field", axis: "x", value: x}),
    {type: "set-field", axis: "y", value: y});

test("locks TI004 source facts and the modern Lesson shell boundary", () => {
  assert.equal(COURSE_G04_L11_TI_004_STATIC_SOURCE_FACTS.principalTimeline.frameCount, 275);
  assert.equal(COURSE_G04_L11_TI_004_STATIC_SOURCE_FACTS.release.ordinal, 28);
  assert.deepEqual(COURSE_G04_L11_TI_004_POINTS.map(({id, x, y}) => ({id, x, y})), [
    {id: "A", x: 3, y: 5}, {id: "B", x: 9, y: 2},
    {id: "C", x: 1, y: 4}, {id: "D", x: 7, y: 8},
    {id: "E", x: 4, y: 9},
  ]);
  assert.equal(COURSE_G04_L11_TI_004_GLOSSARY.length, 12);
  assert.equal(COURSE_G04_L11_TI_004_INTERACTION_AUTHORITY.
    animationInternalPedagogicalControlsPreserved, true);
  assert.equal(COURSE_G04_L11_TI_004_INTERACTION_AUTHORITY.
    legacyCourseShellNavigationIncluded, false);
  assert.equal(COURSE_G04_L11_TI_004_INTERACTION_AUTHORITY.
    duplicateOldAndModernControlsIncluded, false);
});

test("maps the natural question stop to the clean modern interaction background", () => {
  const state = createCourseG04L11Ti004PointEntryState(274);
  assert.equal(state.phase, "selecting"); assert.equal(state.frame, 274);
  assert.equal(state.sourceCanvasFrame, 273); assert.equal(state.visiblePointIds.length, 5);
  assert.equal(state.sourceAudioEnabled, false);
});

test("selecting a point isolates it and enables its two coordinate fields", () => {
  const state = select("D");
  assert.equal(state.phase, "answering"); assert.equal(state.selectedPointId, "D");
  assert.deepEqual(state.visiblePointIds, ["D"]);
  assert.deepEqual(state.fields.D, {x: "", y: ""});
});

test("correct answers require canonical integers and pass through feedback to Clear", () => {
  const noncanonical = enter(select("A"), "03", "5");
  assert.throws(() => reduce(noncanonical, {type: "submit-answer"}),
    /requires two canonical integers/u);
  let state = enter(select("A"), "3", "5");
  state = reduce(state, {type: "submit-answer"});
  assert.equal(state.phase, "correct-feedback");
  assert.equal(state.answerOrigin, "learner-correct");
  state = reduce(state, {type: "close-feedback"});
  assert.equal(state.phase, "clearable");
});

test("the first wrong answer teaches and returns the learner to the same point", () => {
  let state = enter(select("B"), "8", "2");
  state = reduce(state, {type: "submit-answer"});
  assert.equal(state.phase, "wrong-feedback");
  assert.equal(state.wrongAttemptCountByPoint.B, 1);
  assert.match(state.feedbackMessage ?? "", /x-coordinate/u);
  state = reduce(state, {type: "close-feedback"});
  assert.equal(state.phase, "answering"); assert.equal(state.selectedPointId, "B");
});

for (const point of COURSE_G04_L11_TI_004_POINTS) test(
  `the second wrong answer reveals source point ${point.id} exactly`, () => {
    let state = enter(select(point.id), "0", "0");
    state = reduce(state, {type: "submit-answer"});
    state = reduce(state, {type: "close-feedback"});
    state = reduce(reduce(state, {type: "set-field", axis: "x", value: "0"}),
      {type: "set-field", axis: "y", value: "1"});
    state = reduce(state, {type: "submit-answer"});
    assert.equal(state.phase, "revealed");
    assert.equal(state.answerOrigin, "source-second-attempt-reveal");
    assert.deepEqual(state.fields[point.id], {x: String(point.x), y: String(point.y)});
  });

test("Clear applies only the disclosed modern selected-row reset", () => {
  let state = enter(select("C"), "1", "4");
  state = reduce(reduce(state, {type: "submit-answer"}), {type: "close-feedback"});
  state = reduce(state, {type: "clear-selected"});
  assert.equal(state.phase, "selecting"); assert.equal(state.selectedPointId, null);
  assert.deepEqual(state.visiblePointIds, ["A", "B", "C", "D", "E"]);
  assert.deepEqual(state.fields.C, {x: "", y: ""});
  assert.equal(state.sourceClearFieldResetEstablished, false);
  assert.equal(state.modernBoundedSelectedRowResetApplied, true);
});

test("help and glossary preserve the active mathematical work", () => {
  let state = enter(select("E"), "4", "");
  state = reduce(state, {type: "open-help"}); assert.equal(state.phase, "help");
  state = reduce(state, {type: "close-help"}); assert.equal(state.phase, "answering");
  assert.equal(state.fields.E.x, "4");
  state = reduce(state, {type: "open-glossary", glossaryId: "ordered-pair"});
  assert.equal(getCourseG04L11Ti004SelectedGlossary(state)?.label, "Ordered pair");
  state = reduce(state, {type: "close-glossary"}); assert.equal(state.phase, "answering");
});

test("Replay resets the activity without enabling legacy audio or authority", () => {
  const state = reduce(enter(select("A"), "3", "5"), {type: "replay"});
  assert.equal(state.phase, "instruction"); assert.equal(state.selectedPointId, null);
  assert.equal(state.sourceAudioAccepted, false);
  assert.equal(COURSE_G04_L11_TI_004_INTERACTION_AUTHORITY.strictMigrationComplete, false);
});

test("invalid frames, fields, and unavailable controls fail closed", () => {
  assert.throws(() => createCourseG04L11Ti004PointEntryState(0), /invalid TI004/u);
  assert.throws(() => reduce(createCourseG04L11Ti004PointEntryState(274),
    {type: "submit-answer"}), /Done is not available/u);
  assert.throws(() => reduce(select("A"), {type: "set-field", axis: "x", value: "11"}),
    /invalid TI004 coordinate/u);
});
