import assert from "node:assert/strict";
import test from "node:test";

import {COURSE_G04_L11_GS_002_CONTROLS, COURSE_G04_L11_GS_002_LEVELS,
  COURSE_G04_L11_GS_002_STATIC_SOURCE_FACTS} from
  "../source-static/g4-l11/course-g04-l11-gs-002-static";
import {COURSE_G04_L11_GS_002_INTERACTION_AUTHORITY,
  COURSE_G04_L11_GS_002_INTERACTION_SOURCE, createCourseG04L11Gs002State,
  reduceCourseG04L11Gs002State} from
  "./course-g04-l11-gs-002-game-directions-interaction";

test("binds exact GS002 directions, score rule, levels, and seven controls", () => {
  assert.equal(COURSE_G04_L11_GS_002_STATIC_SOURCE_FACTS.release.ordinal, 32);
  assert.equal(COURSE_G04_L11_GS_002_INTERACTION_SOURCE.sourceTimelineId,
    "sprite-227");
  assert.equal(COURSE_G04_L11_GS_002_INTERACTION_SOURCE.sourceFrameCount, 729);
  assert.equal(COURSE_G04_L11_GS_002_INTERACTION_SOURCE.selectLevelStopFrame, 728);
  assert.deepEqual(COURSE_G04_L11_GS_002_INTERACTION_SOURCE.scoreRule,
    {correctDelta: 10, incorrectDelta: -2});
  assert.deepEqual(COURSE_G04_L11_GS_002_LEVELS.map((level) =>
    [level.sourceInstanceName, level.level]), [["mcL1", 1], ["mcL2", 2]]);
  assert.equal(COURSE_G04_L11_GS_002_CONTROLS.length, 7);
});

test("source playback reaches a clean modern level-selection state", () => {
  let state = createCourseG04L11Gs002State(1);
  assert.equal(state.phase, "directions"); assert.equal(state.playing, true);
  state = reduceCourseG04L11Gs002State(state,
    {type: "synchronize-frame", frame: 728});
  assert.equal(state.frame, 728); assert.equal(state.sourceCanvasFrame, 727);
  assert.equal(state.phase, "select-level"); assert.equal(state.playing, false);
});

test("Skip Directions enters level selection without a legacy host call", () => {
  let state = createCourseG04L11Gs002State(300);
  state = reduceCourseG04L11Gs002State(state, {type: "skip-directions"});
  assert.equal(state.phase, "select-level"); assert.equal(state.frame, 728);
  assert.equal(state.sourceCanvasFrame, 727); assert.equal(state.legacyHostCallCount, 0);
});

test("Start fails closed until a level is selected", () => {
  let state = createCourseG04L11Gs002State(728);
  state = reduceCourseG04L11Gs002State(state, {type: "start"});
  assert.equal(state.phase, "select-level");
  assert.equal(state.message, "Select Level 1 or Level 2, then choose Start.");
  assert.equal(state.launchRequestCount, 0);
});

test("both levels create a local GS003 request without executing doNeedMoreHelp", () => {
  for (const levelId of ["level-1", "level-2"] as const) {
    let state = createCourseG04L11Gs002State(728);
    state = reduceCourseG04L11Gs002State(state, {type: "select-level", levelId});
    state = reduceCourseG04L11Gs002State(state, {type: "start"});
    assert.equal(state.phase, "launch-requested");
    assert.equal(state.delegatedGameAnimationId, "course-g04-l11-gs-003");
    assert.equal(state.delegatedGameMounted, false);
    assert.equal(state.hostCallExecuted, false);
    assert.equal(state.hostCallSemanticsEstablished, false);
    assert.equal(state.legacyHostCallCount, 0);
  }
});

test("Repeat Directions and Pair glossary return to the selected level", () => {
  let state = createCourseG04L11Gs002State(728);
  state = reduceCourseG04L11Gs002State(state,
    {type: "select-level", levelId: "level-2"});
  state = reduceCourseG04L11Gs002State(state, {type: "repeat-directions"});
  assert.equal(state.phase, "directions-popup");
  state = reduceCourseG04L11Gs002State(state, {type: "close-directions"});
  assert.equal(state.phase, "select-level"); assert.equal(state.selectedLevelId, "level-2");
  state = reduceCourseG04L11Gs002State(state, {type: "open-pair-glossary"});
  assert.equal(state.phase, "pair-glossary");
  state = reduceCourseG04L11Gs002State(state, {type: "close-pair-glossary"});
  assert.equal(state.phase, "select-level"); assert.equal(state.selectedLevelId, "level-2");
});

test("Replay resets levels, messages, and launch requests", () => {
  let state = createCourseG04L11Gs002State(728);
  state = reduceCourseG04L11Gs002State(state,
    {type: "select-level", levelId: "level-1"});
  state = reduceCourseG04L11Gs002State(state, {type: "start"});
  const replayed = reduceCourseG04L11Gs002State(state, {type: "replay"});
  assert.deepEqual(replayed, createCourseG04L11Gs002State(1));
  assert.equal(Object.isFrozen(replayed), true);
});

test("invalid and premature events fail closed without authority expansion", () => {
  assert.throws(() => createCourseG04L11Gs002State(730), /invalid GS002/u);
  assert.throws(() => reduceCourseG04L11Gs002State(
    createCourseG04L11Gs002State(20), {type: "start"}), /unavailable/u);
  assert.throws(() => reduceCourseG04L11Gs002State(
    createCourseG04L11Gs002State(728),
    {type: "select-level", levelId: "level-3" as "level-1"}), /unknown/u);
  assert.equal(COURSE_G04_L11_GS_002_INTERACTION_AUTHORITY.sourceDomainDeclared, false);
  assert.equal(COURSE_G04_L11_GS_002_INTERACTION_AUTHORITY.sourceAudioAccepted, false);
  assert.equal(COURSE_G04_L11_GS_002_INTERACTION_AUTHORITY.strictAcceptanceEffect,
    "none");
});
