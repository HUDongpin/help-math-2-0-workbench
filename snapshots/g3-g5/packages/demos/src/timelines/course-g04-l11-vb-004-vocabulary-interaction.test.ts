import assert from "node:assert/strict";
import test from "node:test";

import {
  COURSE_G04_L11_VB_004_INTERACTION_AUTHORITY,
  COURSE_G04_L11_VB_004_INTERACTION_SOURCE,
  COURSE_G04_L11_VB_004_TERMS,
  createCourseG04L11Vb004VocabularyState,
  getCourseG04L11Vb004SelectedTerm,
  getCourseG04L11Vb004VisualEmphasis,
  reduceCourseG04L11Vb004Vocabulary,
} from "./course-g04-l11-vb-004-vocabulary-interaction";

test("binds the exact source terms without importing the old course shell", () => {
  assert.equal(COURSE_G04_L11_VB_004_INTERACTION_SOURCE.sourceTimelineId,
    "sprite-71");
  assert.equal(COURSE_G04_L11_VB_004_INTERACTION_SOURCE.sourceFrameCount, 157);
  assert.equal(COURSE_G04_L11_VB_004_INTERACTION_SOURCE
    .legacyCourseShellRequired, false);
  assert.deepEqual(COURSE_G04_L11_VB_004_TERMS.map((term) =>
    [term.sourceButtonObjectId, term.sourceKeyAttribute]), [
    ["46", "Y-axis"],
    ["47", "Vertical"],
    ["48", "Number line"],
    ["49", "Coordinate grid"],
  ]);
});
test("selecting each source control pauses locally and never calls legacy hosts", () => {
  for (const term of COURSE_G04_L11_VB_004_TERMS) {
    const selected = reduceCourseG04L11Vb004Vocabulary(
      createCourseG04L11Vb004VocabularyState(),
      {type: "select-term", termId: term.id, frame: 64},
    );
    assert.equal(selected.playing, false);
    assert.equal(selected.panelOpen, true);
    assert.equal(selected.selectedTermId, term.id);
    assert.equal(selected.legacyHostCallCount, 0);
    assert.equal(selected.audioEnabled, false);
    assert.equal(selected.frame, 64);
    assert.equal(getCourseG04L11Vb004SelectedTerm(selected)?.label, term.label);
  }
});

test("term selection drives bounded local mathematical emphasis", () => {
  const select = (termId: (typeof COURSE_G04_L11_VB_004_TERMS)[number]["id"]) =>
    getCourseG04L11Vb004VisualEmphasis(
      reduceCourseG04L11Vb004Vocabulary(
        createCourseG04L11Vb004VocabularyState(),
        {type: "select-term", termId, frame: 9},
      ),
    );
  assert.deepEqual(select("y-axis"), {
    showFullGrid: false,
    emphasizeYAxis: true,
    showYAxisNumbers: false,
    showVerticalDirection: false,
  });
  assert.equal(select("vertical").showVerticalDirection, true);
  assert.equal(select("number-line").showYAxisNumbers, true);
  assert.equal(select("coordinate-grid").showFullGrid, true);
});

test("the source-local playhead stops at frame 157", () => {
  let state = createCourseG04L11Vb004VocabularyState();
  for (let frame = 1; frame < 157; frame += 1) {
    state = reduceCourseG04L11Vb004Vocabulary(state, {type: "advance"});
  }
  assert.equal(state.frame, 157);
  assert.equal(state.playing, false);
  assert.equal(reduceCourseG04L11Vb004Vocabulary(state, {type: "advance"}),
    state);
});

test("close, resume, and Replay stay inside the animation interaction", () => {
  let state = createCourseG04L11Vb004VocabularyState();
  state = reduceCourseG04L11Vb004Vocabulary(state, {type: "advance"});
  state = reduceCourseG04L11Vb004Vocabulary(state,
    {type: "select-term", termId: "vertical", frame: 2});
  state = reduceCourseG04L11Vb004Vocabulary(state, {type: "close-term"});
  assert.equal(state.frame, 2);
  assert.equal(state.playing, false);
  assert.equal(state.panelOpen, false);
  state = reduceCourseG04L11Vb004Vocabulary(state,
    {type: "resume", frame: 2});
  assert.equal(state.playing, true);
  state = reduceCourseG04L11Vb004Vocabulary(state, {type: "replay"});
  assert.deepEqual(state, createCourseG04L11Vb004VocabularyState());
});

test("unknown controls fail closed and all downstream authority remains false", () => {
  assert.throws(() => reduceCourseG04L11Vb004Vocabulary(
    createCourseG04L11Vb004VocabularyState(),
    {type: "select-term", termId: "legacy-shell" as "vertical", frame: 9},
  ), /unknown VB004 term/u);
  assert.equal(COURSE_G04_L11_VB_004_INTERACTION_AUTHORITY
    .animationInternalPedagogicalControlsPreserved, true);
  for (const [key, value] of Object.entries(
    COURSE_G04_L11_VB_004_INTERACTION_AUTHORITY,
  )) {
    if (["implementationCandidateOnly",
      "animationInternalPedagogicalControlsPreserved"].includes(key)) continue;
    if (key === "strictAcceptanceEffect") assert.equal(value, "none");
    else assert.equal(value, false, key);
  }
});

test("host frames synchronize while playing and freeze while a term is open", () => {
  let state = createCourseG04L11Vb004VocabularyState(8);
  state = reduceCourseG04L11Vb004Vocabulary(state,
    {type: "synchronize-frame", frame: 9});
  assert.equal(state.frame, 9);
  state = reduceCourseG04L11Vb004Vocabulary(state,
    {type: "select-term", termId: "y-axis", frame: 9});
  const frozen = reduceCourseG04L11Vb004Vocabulary(state,
    {type: "synchronize-frame", frame: 64});
  assert.equal(frozen, state);
  assert.equal(frozen.frame, 9);
  const resumed = reduceCourseG04L11Vb004Vocabulary(frozen,
    {type: "resume", frame: 64});
  assert.equal(resumed.frame, 64);
  assert.equal(resumed.playing, true);
  assert.throws(() => createCourseG04L11Vb004VocabularyState(0),
    /invalid VB004 local frame/u);
});
