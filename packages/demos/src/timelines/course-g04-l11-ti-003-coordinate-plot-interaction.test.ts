import assert from "node:assert/strict";
import test from "node:test";

import {COURSE_G04_L11_TI_003_GLOSSARY,
  COURSE_G04_L11_TI_003_INITIAL_COORDINATE_POOL,
  COURSE_G04_L11_TI_003_REPLACEMENT_COORDINATE_POOL} from
  "../source-static/g4-l11/course-g04-l11-ti-003-static";
import {COURSE_G04_L11_TI_003_INTERACTION_AUTHORITY,
  COURSE_G04_L11_TI_003_INTERACTION_SOURCE, createCourseG04L11Ti003PlotState,
  getCourseG04L11Ti003ReplacementPool, reduceCourseG04L11Ti003Plot} from
  "./course-g04-l11-ti-003-coordinate-plot-interaction";

test("binds exact TI003 pools, grid, help, glossary, and source defect", () => {
  assert.equal(COURSE_G04_L11_TI_003_INTERACTION_SOURCE.sourceFrameCount, 236);
  assert.equal(COURSE_G04_L11_TI_003_INTERACTION_SOURCE.sourceGridPointCount, 121);
  assert.equal(COURSE_G04_L11_TI_003_INITIAL_COORDINATE_POOL.length, 14);
  assert.equal(COURSE_G04_L11_TI_003_REPLACEMENT_COORDINATE_POOL.length, 18);
  assert.equal(COURSE_G04_L11_TI_003_GLOSSARY.length, 12);
  assert.deepEqual(getCourseG04L11Ti003ReplacementPool(),
    COURSE_G04_L11_TI_003_REPLACEMENT_COORDINATE_POOL);
  assert.equal(COURSE_G04_L11_TI_003_INTERACTION_AUTHORITY
    .replacementPoolLenghtDefectSilentlyRepaired, false);
  assert.equal(COURSE_G04_L11_TI_003_INTERACTION_AUTHORITY
    .legacyCourseShellNavigationIncluded, false);
});

test("candidate playback enters plotting on the clean frame-230 background", () => {
  let state = createCourseG04L11Ti003PlotState(1, 0);
  assert.equal(state.phase, "instruction"); assert.equal(state.sourceCanvasFrame, 1);
  state = reduceCourseG04L11Ti003Plot(state, {type: "synchronize-frame", frame: 235});
  assert.equal(state.phase, "plotting"); assert.equal(state.frame, 235);
  assert.equal(state.sourceCanvasFrame, 230); assert.deepEqual(state.currentPair,
    {id: "2-1", x: 2, y: 1});
});

test("coordinate selection is deterministic and covers exactly the initial pool", () => {
  for (const seed of [0, 1, 7, 99, 0xffff_ffff]) {
    let state = createCourseG04L11Ti003PlotState(235, seed);
    const observed = [state.currentPair.id];
    while (state.remainingInitialPairIds.length > 0) {
      state = reduceCourseG04L11Ti003Plot(state,
        {type: "set-cursor", x: state.currentPair.x, y: state.currentPair.y});
      state = reduceCourseG04L11Ti003Plot(state, {type: "submit-point"});
      state = reduceCourseG04L11Ti003Plot(state, {type: "close-feedback"});
      state = reduceCourseG04L11Ti003Plot(state, {type: "next-ordered-pair"});
      observed.push(state.currentPair.id);
    }
    assert.equal(new Set(observed).size, 14);
    assert.deepEqual(new Set(observed),
      new Set(COURSE_G04_L11_TI_003_INITIAL_COORDINATE_POOL.map((pair) => pair.id)));
  }
});

test("wrong point preserves the pair and opens a clean retry", () => {
  let state = createCourseG04L11Ti003PlotState(235, 0);
  const before = state.currentPair;
  state = reduceCourseG04L11Ti003Plot(state, {type: "submit-point"});
  assert.equal(state.phase, "wrong-feedback"); assert.equal(state.popupOpen, true);
  assert.equal(state.wrongAttemptCount, 1); assert.equal(state.nextOrderedPairEnabled, false);
  assert.deepEqual(state.currentPair, before); assert.match(state.feedbackMessage ?? "", /first number/u);
  state = reduceCourseG04L11Ti003Plot(state, {type: "close-feedback"});
  assert.equal(state.phase, "plotting"); assert.equal(state.popupOpen, false);
});

test("correct point enables Next only after the correct-feedback continuation", () => {
  let state = createCourseG04L11Ti003PlotState(235, 0);
  state = reduceCourseG04L11Ti003Plot(state,
    {type: "set-cursor", x: state.currentPair.x, y: state.currentPair.y});
  state = reduceCourseG04L11Ti003Plot(state, {type: "submit-point"});
  assert.equal(state.phase, "correct-feedback");
  assert.equal(state.nextOrderedPairEnabled, false);
  assert.deepEqual(state.plottedPair, state.currentPair);
  state = reduceCourseG04L11Ti003Plot(state, {type: "close-feedback"});
  assert.equal(state.nextOrderedPairEnabled, true);
  state = reduceCourseG04L11Ti003Plot(state, {type: "next-ordered-pair"});
  assert.equal(state.nextOrderedPairEnabled, false); assert.equal(state.usedInitialPairIds.length, 2);
});

test("pool exhaustion exposes the source lenght defect instead of silently repairing it", () => {
  let state = createCourseG04L11Ti003PlotState(235, 0);
  for (let index = 0; index < 14; index += 1) {
    state = reduceCourseG04L11Ti003Plot(state,
      {type: "set-cursor", x: state.currentPair.x, y: state.currentPair.y});
    state = reduceCourseG04L11Ti003Plot(state, {type: "submit-point"});
    state = reduceCourseG04L11Ti003Plot(state, {type: "close-feedback"});
    state = reduceCourseG04L11Ti003Plot(state, {type: "next-ordered-pair"});
  }
  assert.equal(state.phase, "source-defect"); assert.equal(state.sourceDefectReached, true);
  assert.equal(state.sourceReplacementPoolEntered, false);
  assert.equal(state.sourceReplacementPoolRepairApplied, false);
  assert.match(state.feedbackMessage ?? "", /arr\.lenght/u);
});

test("help and every glossary control preserve pair, pool, and cursor state", () => {
  let state = createCourseG04L11Ti003PlotState(235, 4);
  state = reduceCourseG04L11Ti003Plot(state, {type: "set-cursor", x: 3, y: 5});
  const snapshot = {pair: state.currentPair, remaining: state.remainingInitialPairIds,
    cursor: state.cursor};
  state = reduceCourseG04L11Ti003Plot(state, {type: "open-help"});
  assert.equal(state.phase, "help");
  state = reduceCourseG04L11Ti003Plot(state, {type: "close-help"});
  for (const term of COURSE_G04_L11_TI_003_GLOSSARY) {
    state = reduceCourseG04L11Ti003Plot(state,
      {type: "open-glossary", glossaryId: term.id});
    assert.equal(state.selectedGlossaryId, term.id);
    state = reduceCourseG04L11Ti003Plot(state, {type: "close-glossary"});
  }
  assert.deepEqual(state.currentPair, snapshot.pair);
  assert.deepEqual(state.remainingInitialPairIds, snapshot.remaining);
  assert.deepEqual(state.cursor, snapshot.cursor);
  assert.equal(state.legacyHostCallCount, 0);
});

test("Replay and invalid events fail closed without authority expansion", () => {
  let state = createCourseG04L11Ti003PlotState(235, 7);
  assert.throws(() => reduceCourseG04L11Ti003Plot(state,
    {type: "set-cursor", x: 11, y: 0}), /invalid TI003 x-coordinate/u);
  assert.throws(() => reduceCourseG04L11Ti003Plot(state,
    {type: "open-glossary", glossaryId: "missing" as never}), /unknown TI003 glossary/u);
  assert.throws(() => reduceCourseG04L11Ti003Plot(state,
    {type: "next-ordered-pair"}), /Next Ordered Pair is not available/u);
  state = reduceCourseG04L11Ti003Plot(state, {type: "replay"});
  assert.equal(state.frame, 1); assert.equal(state.phase, "instruction");
  assert.equal(state.usedInitialPairIds.length, 1); assert.equal(state.sourceAudioEnabled, false);
  assert.equal(COURSE_G04_L11_TI_003_INTERACTION_AUTHORITY.registeredCurrentJavascript, false);
});
