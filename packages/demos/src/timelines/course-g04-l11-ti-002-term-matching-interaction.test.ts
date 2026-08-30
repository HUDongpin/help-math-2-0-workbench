import assert from "node:assert/strict";
import test from "node:test";

import {COURSE_G04_L11_TI_002_GLOSSARY, COURSE_G04_L11_TI_002_MATCHES,
  COURSE_G04_L11_TI_002_STATIC_SOURCE_FACTS,
  COURSE_G04_L11_TI_002_TARGET_ROWS} from
  "../source-static/g4-l11/course-g04-l11-ti-002-static";
import {COURSE_G04_L11_TI_002_INTERACTION_AUTHORITY,
  COURSE_G04_L11_TI_002_INTERACTION_SOURCE,
  createCourseG04L11Ti002MatchingState,
  getCourseG04L11Ti002SelectedGlossary,
  reduceCourseG04L11Ti002Matching} from
  "./course-g04-l11-ti-002-term-matching-interaction";

function start(seed = 0) {
  return createCourseG04L11Ti002MatchingState(230, seed);
}
function place(state: ReturnType<typeof start>, termId:
  (typeof COURSE_G04_L11_TI_002_MATCHES)[number]["id"], row: 1 | 2 | 3 | 4 | 5) {
  const selected = reduceCourseG04L11Ti002Matching(state,
    {type: "select-term", termId});
  return reduceCourseG04L11Ti002Matching(selected, {type: "choose-target", row});
}

test("binds exact TI002 five-match source contract and teaching controls", () => {
  assert.equal(COURSE_G04_L11_TI_002_STATIC_SOURCE_FACTS.release.ordinal, 26);
  assert.equal(COURSE_G04_L11_TI_002_INTERACTION_SOURCE.sourceTimelineId, "sprite-325");
  assert.equal(COURSE_G04_L11_TI_002_INTERACTION_SOURCE.sourceFrameCount, 247);
  assert.equal(COURSE_G04_L11_TI_002_INTERACTION_SOURCE.naturalQuizStopFrame, 230);
  assert.deepEqual(COURSE_G04_L11_TI_002_MATCHES.map((match) =>
    [match.sourceInstanceName, match.targetInstanceName, match.targetRow]), [
    ["Src_1", "Mc_Tar_1", 3], ["Src_2", "Mc_Tar_2", 1],
    ["Src_3", "Mc_Tar_3", 2], ["Src_4", "Mc_Tar_4", 5],
    ["Src_5", "Mc_Tar_5", 4],
  ]);
  assert.equal(COURSE_G04_L11_TI_002_TARGET_ROWS.length, 5);
  assert.equal(COURSE_G04_L11_TI_002_GLOSSARY.length, 15);
});

test("candidate playback enters and holds matching at the clean frame-229 background", () => {
  let state = createCourseG04L11Ti002MatchingState(1, 7);
  assert.equal(state.phase, "instruction"); assert.equal(state.playing, true);
  state = reduceCourseG04L11Ti002Matching(state,
    {type: "synchronize-frame", frame: 230});
  assert.equal(state.frame, 230); assert.equal(state.sourceCanvasFrame, 229);
  assert.equal(state.phase, "matching"); assert.equal(state.playing, false);
  const held = reduceCourseG04L11Ti002Matching(state,
    {type: "synchronize-frame", frame: 247});
  assert.equal(held.frame, 230); assert.equal(held.sourceCanvasFrame, 229);
});

test("all five exact matches accumulate in any valid order and complete once", () => {
  let state = start(9);
  for (const [termId, row] of [["x-axis", 5], ["coordinate-grid", 3],
    ["coordinates", 1], ["y-axis", 4], ["plot", 2]] as const) {
    state = place(state, termId, row);
    assert.equal(state.phase, "correct-feedback");
    assert.equal(state.popupOpen, true); assert.match(state.feedbackVariant ?? "",
      /^(excellent|you-got-it|good-job|great-job)$/u);
    state = reduceCourseG04L11Ti002Matching(state, {type: "close-feedback"});
  }
  assert.equal(state.completed, true); assert.equal(state.phase, "completed");
  assert.equal(state.frame, 247); assert.equal(state.sourceCanvasFrame, 247);
  assert.equal(state.placedTermIds.length, 5); assert.equal(state.filledTargetRows.length, 5);
});

test("wrong target preserves progress, returns the term, and opens clean retry", () => {
  let state = place(start(3), "coordinates", 1);
  state = reduceCourseG04L11Ti002Matching(state, {type: "close-feedback"});
  state = place(state, "plot", 4);
  assert.equal(state.phase, "wrong-feedback"); assert.equal(state.popupOpen, true);
  assert.equal(state.feedbackMessage, "Try Again!");
  assert.match(state.coachVariant ?? "", /^S[1-4]$/u);
  assert.deepEqual(state.placedTermIds, ["coordinates"]);
  assert.deepEqual(state.filledTargetRows, [1]); assert.equal(state.selectedTermId, null);
  state = reduceCourseG04L11Ti002Matching(state, {type: "close-feedback"});
  assert.equal(state.phase, "matching"); assert.equal(state.popupOpen, false);
});

test("placed terms and occupied targets cannot be double-counted", () => {
  let state = place(start(), "plot", 2);
  state = reduceCourseG04L11Ti002Matching(state, {type: "close-feedback"});
  const same = reduceCourseG04L11Ti002Matching(state,
    {type: "select-term", termId: "plot"});
  assert.equal(same, state);
  state = reduceCourseG04L11Ti002Matching(state,
    {type: "select-term", termId: "coordinates"});
  const occupied = reduceCourseG04L11Ti002Matching(state,
    {type: "choose-target", row: 2});
  assert.equal(occupied, state); assert.equal(occupied.placedTermIds.length, 1);
});

test("all five picture controls preserve matching progress and selection", () => {
  for (const row of [1, 2, 3, 4, 5] as const) {
    let state = place(start(), "coordinates", 1);
    state = reduceCourseG04L11Ti002Matching(state, {type: "close-feedback"});
    state = reduceCourseG04L11Ti002Matching(state,
      {type: "select-term", termId: "plot"});
    state = reduceCourseG04L11Ti002Matching(state, {type: "open-picture", row});
    assert.equal(state.phase, "picture"); assert.equal(state.enlargedPictureRow, row);
    assert.deepEqual(state.placedTermIds, ["coordinates"]);
    assert.equal(state.selectedTermId, "plot");
    state = reduceCourseG04L11Ti002Matching(state, {type: "close-picture"});
    assert.equal(state.phase, "matching"); assert.equal(state.selectedTermId, "plot");
  }
});

test("all fifteen glossary terms pause locally without losing matches", () => {
  for (const glossary of COURSE_G04_L11_TI_002_GLOSSARY) {
    let state = place(start(), "coordinate-grid", 3);
    state = reduceCourseG04L11Ti002Matching(state, {type: "close-feedback"});
    state = reduceCourseG04L11Ti002Matching(state,
      {type: "open-glossary", glossaryId: glossary.id});
    assert.equal(state.phase, "glossary"); assert.equal(state.playing, false);
    assert.equal(getCourseG04L11Ti002SelectedGlossary(state)?.label, glossary.label);
    assert.deepEqual(state.placedTermIds, ["coordinate-grid"]);
    state = reduceCourseG04L11Ti002Matching(state, {type: "close-glossary"});
    assert.equal(state.phase, "matching"); assert.equal(state.legacyHostCallCount, 0);
  }
});

test("feedback and coach variants are deterministic QA fixtures, not parity claims", () => {
  const first = place(start(11), "coordinates", 5);
  const second = place(start(11), "coordinates", 5);
  assert.equal(first.coachVariant, second.coachVariant);
  const correctFirst = place(start(11), "coordinates", 1);
  const correctSecond = place(start(11), "coordinates", 1);
  assert.equal(correctFirst.feedbackVariant, correctSecond.feedbackVariant);
  assert.equal(first.hostFeedbackSelectionEstablished, false);
  assert.equal(first.sourceAudioEnabled, false);
});

test("Replay and invalid events fail closed without authority expansion", () => {
  let state = place(start(8), "coordinates", 1);
  const replayed = reduceCourseG04L11Ti002Matching(state, {type: "replay"});
  assert.deepEqual(replayed, createCourseG04L11Ti002MatchingState(1, 8));
  assert.equal(Object.isFrozen(replayed), true);
  assert.equal(Object.isFrozen(replayed.placedTermIds), true);
  assert.throws(() => createCourseG04L11Ti002MatchingState(248), /invalid TI002/u);
  assert.throws(() => reduceCourseG04L11Ti002Matching(start(),
    {type: "choose-target", row: 1}), /not available/u);
  assert.throws(() => reduceCourseG04L11Ti002Matching(start(),
    {type: "open-glossary", glossaryId: "old-shell" as "pair"}), /unknown TI002/u);
  assert.equal(COURSE_G04_L11_TI_002_INTERACTION_AUTHORITY.sourceDomainDeclared, false);
  assert.equal(COURSE_G04_L11_TI_002_INTERACTION_AUTHORITY.sourceAudioAccepted, false);
  assert.equal(COURSE_G04_L11_TI_002_INTERACTION_AUTHORITY.strictAcceptanceEffect,
    "none");
});
