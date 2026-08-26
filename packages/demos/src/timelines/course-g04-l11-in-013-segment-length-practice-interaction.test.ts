import assert from "node:assert/strict";
import test from "node:test";

import {COURSE_G04_L11_IN_013_CHOICES,
  COURSE_G04_L11_IN_013_STATIC_SOURCE_FACTS} from
  "../source-static/g4-l11/course-g04-l11-in-013-static";
import {COURSE_G04_L11_IN_013_INTERACTION_AUTHORITY,
  COURSE_G04_L11_IN_013_INTERACTION_SOURCE, COURSE_G04_L11_IN_013_TERMS,
  createCourseG04L11In013PracticeState, getCourseG04L11In013SelectedTerm,
  reduceCourseG04L11In013Practice} from
  "./course-g04-l11-in-013-segment-length-practice-interaction";

test("binds exact IN013 source exercise and five teaching controls", () => {
  assert.equal(COURSE_G04_L11_IN_013_STATIC_SOURCE_FACTS.release.ordinal, 25);
  assert.equal(COURSE_G04_L11_IN_013_INTERACTION_SOURCE.sourceTimelineId, "sprite-224");
  assert.equal(COURSE_G04_L11_IN_013_INTERACTION_SOURCE.sourceFrameCount, 67);
  assert.equal(COURSE_G04_L11_IN_013_INTERACTION_SOURCE.naturalQuizStopFrame, 49);
  assert.deepEqual(COURSE_G04_L11_IN_013_INTERACTION_SOURCE.endpoints,
    ["(3,5)", "(7,5)"]);
  assert.equal(COURSE_G04_L11_IN_013_INTERACTION_SOURCE.equation, "7 − 3 = 4");
  assert.deepEqual(COURSE_G04_L11_IN_013_CHOICES.map((choice) =>
    [choice.sourceInstanceName, choice.label, choice.correct]), [
    ["AnsBtn2", "3 units", false], ["AnsBtn1", "4 units", true],
    ["AnsBtn3", "5 units", false],
  ]);
  assert.equal(COURSE_G04_L11_IN_013_TERMS.length, 2);
});

test("candidate playback enters and holds the question at source frame 49", () => {
  let state = createCourseG04L11In013PracticeState(1, 7);
  assert.equal(state.playing, true); assert.equal(state.phase, "instruction");
  state = reduceCourseG04L11In013Practice(state,
    {type: "synchronize-frame", frame: 49});
  assert.equal(state.frame, 49); assert.equal(state.sourceCanvasFrame, 48);
  assert.equal(state.phase, "quiz"); assert.equal(state.playing, false);
  const held = reduceCourseG04L11In013Practice(state,
    {type: "synchronize-frame", frame: 67});
  assert.equal(held.frame, 49); assert.equal(held.sourceCanvasFrame, 48);
});

test("both distractors preserve exact source feedback and clean retry", () => {
  for (const choiceId of ["three-units", "five-units"] as const) {
    let state = createCourseG04L11In013PracticeState(49, 3);
    state = reduceCourseG04L11In013Practice(state, {type: "choose-answer", choiceId});
    assert.equal(state.phase, "wrong-feedback"); assert.equal(state.popupOpen, true);
    assert.equal(state.feedbackMessage,
      "Subtract the x-coordinates 7 minus 3 to find the length. Try again.");
    assert.match(state.feedbackVariant ?? "", /^wrong-[1-4]$/u);
    state = reduceCourseG04L11In013Practice(state, {type: "close-wrong-feedback"});
    assert.equal(state.phase, "quiz"); assert.equal(state.popupOpen, false);
    assert.equal(state.selectedChoiceId, null); assert.equal(state.completed, false);
  }
});

test("only 4 units completes through an explicit modern continuation", () => {
  let state = createCourseG04L11In013PracticeState(49, 2);
  state = reduceCourseG04L11In013Practice(state,
    {type: "choose-answer", choiceId: "four-units"});
  assert.equal(state.phase, "correct-feedback"); assert.equal(state.popupOpen, true);
  assert.match(state.feedbackVariant ?? "", /^right-[1-5]$/u);
  assert.equal(state.completed, false);
  state = reduceCourseG04L11In013Practice(state, {type: "continue-after-correct"});
  assert.equal(state.completed, true); assert.equal(state.phase, "post-correct");
  assert.equal(state.frame, 67); assert.equal(state.sourceCanvasFrame, 67);
  assert.equal(state.feedbackAnimationTimingEstablished, false);
});

test("Length and Line segment glossary controls pause locally", () => {
  for (const term of COURSE_G04_L11_IN_013_TERMS) {
    let state = createCourseG04L11In013PracticeState(49);
    state = reduceCourseG04L11In013Practice(state,
      {type: "select-term", termId: term.id});
    assert.equal(state.glossaryOpen, true); assert.equal(state.playing, false);
    assert.equal(state.legacyHostCallCount, 0);
    assert.equal(getCourseG04L11In013SelectedTerm(state)?.sourceKeyAttribute,
      term.sourceKeyAttribute);
    state = reduceCourseG04L11In013Practice(state, {type: "close-term"});
    assert.equal(state.glossaryOpen, false);
  }
});

test("Replay resets choices, feedback, completion, and deterministic seed", () => {
  let state = createCourseG04L11In013PracticeState(49, 8);
  state = reduceCourseG04L11In013Practice(state,
    {type: "choose-answer", choiceId: "three-units"});
  const replayed = reduceCourseG04L11In013Practice(state, {type: "replay"});
  assert.deepEqual(replayed, createCourseG04L11In013PracticeState(1, 8));
  assert.equal(Object.isFrozen(replayed), true);
});

test("invalid and premature events fail closed without authority expansion", () => {
  assert.throws(() => createCourseG04L11In013PracticeState(68),
    /invalid IN013 local frame/u);
  assert.throws(() => reduceCourseG04L11In013Practice(
    createCourseG04L11In013PracticeState(20),
    {type: "choose-answer", choiceId: "four-units"}), /not available/u);
  assert.throws(() => reduceCourseG04L11In013Practice(
    createCourseG04L11In013PracticeState(49),
    {type: "select-term", termId: "old-shell" as "length"}), /unknown IN013/u);
  assert.equal(COURSE_G04_L11_IN_013_INTERACTION_AUTHORITY.sourceDomainDeclared, false);
  assert.equal(COURSE_G04_L11_IN_013_INTERACTION_AUTHORITY.sourceAudioAccepted, false);
  assert.equal(COURSE_G04_L11_IN_013_INTERACTION_AUTHORITY.strictAcceptanceEffect,
    "none");
});
