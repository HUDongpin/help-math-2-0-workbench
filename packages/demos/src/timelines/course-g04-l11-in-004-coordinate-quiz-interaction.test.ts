import assert from "node:assert/strict";
import test from "node:test";

import {COURSE_G04_L11_IN_004_TARGETS} from "../source-static/g4-l11/course-g04-l11-in-004-static";
import {
  COURSE_G04_L11_IN_004_INTERACTION_AUTHORITY,
  COURSE_G04_L11_IN_004_INTERACTION_SOURCE,
  COURSE_G04_L11_IN_004_TERMS,
  buildCourseG04L11In004TargetOrder,
  createCourseG04L11In004QuizState,
  getCourseG04L11In004SelectedTerm,
  reduceCourseG04L11In004Quiz,
} from "./course-g04-l11-in-004-coordinate-quiz-interaction";

test("binds the exact source quiz domain, target set, grid, and controls", () => {
  assert.equal(COURSE_G04_L11_IN_004_INTERACTION_SOURCE.sourceFrameCount, 233);
  assert.equal(COURSE_G04_L11_IN_004_INTERACTION_SOURCE.naturalQuizStopFrame, 228);
  assert.equal(COURSE_G04_L11_IN_004_TARGETS.length, 18);
  assert.deepEqual(COURSE_G04_L11_IN_004_TARGETS[0], {x: 5, y: 4});
  assert.deepEqual(COURSE_G04_L11_IN_004_TARGETS.at(-1), {x: 10, y: 5});
  assert.equal(COURSE_G04_L11_IN_004_INTERACTION_SOURCE.sourceGridHitTargetCount, 121);
  assert.equal(COURSE_G04_L11_IN_004_TERMS.length, 8);
  assert.deepEqual(COURSE_G04_L11_IN_004_TERMS.map((term) => term.sourceButtonObjectId),
    ["74", "75", "76", "121", "122", "123", "124", "125"]);
});

test("maps every seed to a deterministic exact permutation", () => {
  const identity = buildCourseG04L11In004TargetOrder(0);
  assert.deepEqual(identity, [...Array(18).keys()]);
  const first = buildCourseG04L11In004TargetOrder(2_026);
  const second = buildCourseG04L11In004TargetOrder(2_026);
  assert.deepEqual(first, second);
  assert.equal(new Set(first).size, 18);
  assert.deepEqual([...first].sort((a, b) => a - b), [...Array(18).keys()]);
  assert.ok(Object.isFrozen(first));
});

test("natural candidate playback enters and holds the quiz at source frame 228", () => {
  let state = createCourseG04L11In004QuizState(1, 0);
  assert.equal(state.phase, "instruction");
  assert.equal(state.playing, true);
  state = reduceCourseG04L11In004Quiz(state,
    {type: "synchronize-frame", frame: 227});
  assert.equal(state.frame, 227);
  state = reduceCourseG04L11In004Quiz(state,
    {type: "synchronize-frame", frame: 233});
  assert.equal(state.frame, 228);
  assert.equal(state.phase, "quiz");
  assert.equal(state.playing, false);
  assert.equal(state.gridEnabled, true);
  assert.equal(state.target.orderedPair, "(5,4)");
});

test("correct grid selection enables the source Next Ordered Pair function", () => {
  let state = createCourseG04L11In004QuizState(228, 0);
  state = reduceCourseG04L11In004Quiz(state,
    {type: "select-coordinate", x: 5, y: 4});
  assert.equal(state.feedback, "correct");
  assert.equal(state.correctCount, 1);
  assert.equal(state.nextEnabled, true);
  assert.equal(state.gridEnabled, false);
  state = reduceCourseG04L11In004Quiz(state, {type: "next-target"});
  assert.equal(state.target.orderedPair, "(3,6)");
  assert.equal(state.feedback, "none");
  assert.equal(state.nextEnabled, false);
  assert.equal(state.gridEnabled, true);
});

test("wrong selection opens teaching feedback and Close restores the grid", () => {
  let state = createCourseG04L11In004QuizState(228, 0);
  state = reduceCourseG04L11In004Quiz(state,
    {type: "select-coordinate", x: 4, y: 4});
  assert.equal(state.feedback, "wrong");
  assert.equal(state.wrongPopupOpen, true);
  assert.equal(state.gridEnabled, false);
  assert.equal(state.nextEnabled, false);
  state = reduceCourseG04L11In004Quiz(state,
    {type: "close-wrong-feedback"});
  assert.equal(state.feedback, "none");
  assert.equal(state.wrongPopupOpen, false);
  assert.equal(state.gridEnabled, true);
  assert.equal(state.selectedCoordinate, null);
});

test("all eight animation-internal glossary controls pause locally", () => {
  for (const term of COURSE_G04_L11_IN_004_TERMS) {
    let state = createCourseG04L11In004QuizState(120, 0);
    state = reduceCourseG04L11In004Quiz(state,
      {type: "select-term", termId: term.id, frame: 120});
    assert.equal(state.playing, false);
    assert.equal(state.glossaryOpen, true);
    assert.equal(getCourseG04L11In004SelectedTerm(state)?.sourceButtonObjectId,
      term.sourceButtonObjectId);
    state = reduceCourseG04L11In004Quiz(state, {type: "close-term"});
    assert.equal(state.glossaryOpen, false);
    assert.equal(state.playing, false);
    state = reduceCourseG04L11In004Quiz(state,
      {type: "resume", frame: 120});
    assert.equal(state.playing, true);
  }
});

test("the modern bounded reset preserves all 18 targets after exhaustion", () => {
  let state = createCourseG04L11In004QuizState(228, 0);
  const firstCycle = [];
  for (let index = 0; index < 18; index += 1) {
    firstCycle.push(state.target.index);
    state = reduceCourseG04L11In004Quiz(state,
      {type: "select-coordinate", x: state.target.x, y: state.target.y});
    state = reduceCourseG04L11In004Quiz(state, {type: "next-target"});
  }
  assert.equal(new Set(firstCycle).size, 18);
  assert.equal(state.cycle, 1);
  assert.equal(new Set(state.targetOrder).size, 18);
  assert.equal(state.targetCursor, 0);
});

test("Replay resets the complete quiz vector without expanding authority", () => {
  let state = createCourseG04L11In004QuizState(228, 7);
  state = reduceCourseG04L11In004Quiz(state,
    {type: "select-coordinate", x: state.target.x, y: state.target.y});
  state = reduceCourseG04L11In004Quiz(state, {type: "replay"});
  assert.equal(state.frame, 1);
  assert.equal(state.phase, "instruction");
  assert.equal(state.attemptCount, 0);
  assert.equal(state.correctCount, 0);
  assert.equal(state.seed, 7);
  assert.equal(state.audioEnabled, false);
  assert.equal(state.legacyHostCallCount, 0);
  assert.equal(COURSE_G04_L11_IN_004_INTERACTION_AUTHORITY.registeredCurrentJavascript,
    false);
  assert.equal(COURSE_G04_L11_IN_004_INTERACTION_AUTHORITY.strictMigrationComplete,
    false);
});

test("invalid frames, coordinates, terms, and disabled actions fail closed", () => {
  assert.throws(() => createCourseG04L11In004QuizState(0),
    /invalid IN004 local frame/u);
  assert.throws(() => buildCourseG04L11In004TargetOrder(Number.NaN),
    /seed must be finite/u);
  const instruction = createCourseG04L11In004QuizState(1, 0);
  assert.throws(() => reduceCourseG04L11In004Quiz(instruction,
    {type: "select-coordinate", x: 5, y: 4}), /grid is not enabled/u);
  const quiz = createCourseG04L11In004QuizState(228, 0);
  assert.throws(() => reduceCourseG04L11In004Quiz(quiz,
    {type: "select-coordinate", x: 11, y: 4}), /x-coordinate/u);
  assert.throws(() => reduceCourseG04L11In004Quiz(quiz,
    {type: "next-target"}), /next target is not enabled/u);
  assert.throws(() => reduceCourseG04L11In004Quiz(quiz,
    {type: "select-term", termId: "invented" as never, frame: 228}),
  /unknown IN004 term/u);
});
