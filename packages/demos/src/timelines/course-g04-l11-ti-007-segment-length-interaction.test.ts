import assert from "node:assert/strict";
import test from "node:test";

import {COURSE_G04_L11_TI_007_CHOICES, COURSE_G04_L11_TI_007_GLOSSARY,
  COURSE_G04_L11_TI_007_STATIC_SOURCE_FACTS} from
  "../source-static/g4-l11/course-g04-l11-ti-007-static";
import {COURSE_G04_L11_TI_007_INTERACTION_AUTHORITY,
  COURSE_G04_L11_TI_007_INTERACTION_SOURCE, createCourseG04L11Ti007State,
  getCourseG04L11Ti007SelectedGlossary, reduceCourseG04L11Ti007State} from
  "./course-g04-l11-ti-007-segment-length-interaction";

test("binds exact TI007 exercise and twelve internal teaching controls", () => {
  assert.equal(COURSE_G04_L11_TI_007_STATIC_SOURCE_FACTS.release.ordinal, 31);
  assert.equal(COURSE_G04_L11_TI_007_INTERACTION_SOURCE.sourceTimelineId,
    "sprite-258");
  assert.equal(COURSE_G04_L11_TI_007_INTERACTION_SOURCE.sourceFrameCount, 143);
  assert.equal(COURSE_G04_L11_TI_007_INTERACTION_SOURCE.naturalQuizStopFrame, 119);
  assert.deepEqual(COURSE_G04_L11_TI_007_INTERACTION_SOURCE.endpoints,
    ["(9,1)", "(4,1)"]);
  assert.equal(COURSE_G04_L11_TI_007_INTERACTION_SOURCE.equation, "9 − 4 = 5");
  assert.deepEqual(COURSE_G04_L11_TI_007_CHOICES.map((choice) =>
    [choice.sourceInstanceName, choice.label, choice.correct]), [
    ["AnsBtn2", "3 units", false], ["AnsBtn1", "4 units", false],
    ["AnsBtn3", "5 units", true],
  ]);
  assert.equal(COURSE_G04_L11_TI_007_GLOSSARY.length, 8);
  assert.equal(3 + 1 + COURSE_G04_L11_TI_007_GLOSSARY.length, 12);
});

test("candidate playback enters and holds the question on a clean source frame", () => {
  let state = createCourseG04L11Ti007State(1, 7);
  assert.equal(state.playing, true); assert.equal(state.phase, "instruction");
  state = reduceCourseG04L11Ti007State(state, {type: "synchronize-frame", frame: 119});
  assert.equal(state.frame, 119); assert.equal(state.sourceCanvasFrame, 118);
  assert.equal(state.phase, "quiz"); assert.equal(state.playing, false);
  const held = reduceCourseG04L11Ti007State(state,
    {type: "synchronize-frame", frame: 143});
  assert.equal(held.frame, 119); assert.equal(held.sourceCanvasFrame, 118);
});

test("both distractors preserve exact source feedback and clean retry", () => {
  for (const choiceId of ["three-units", "four-units"] as const) {
    let state = createCourseG04L11Ti007State(119, 3);
    state = reduceCourseG04L11Ti007State(state, {type: "choose-answer", choiceId});
    assert.equal(state.phase, "wrong-feedback");
    assert.equal(state.feedbackMessage,
      "Read the second part of the rule. Try again.");
    assert.match(state.feedbackVariant ?? "", /^wrong-[1-4]$/u);
    state = reduceCourseG04L11Ti007State(state, {type: "close-wrong-feedback"});
    assert.equal(state.phase, "quiz"); assert.equal(state.selectedChoiceId, null);
    assert.equal(state.completed, false);
  }
});

test("only 5 units completes through an explicit modern continuation", () => {
  let state = createCourseG04L11Ti007State(119, 2);
  state = reduceCourseG04L11Ti007State(state,
    {type: "choose-answer", choiceId: "five-units"});
  assert.equal(state.phase, "correct-feedback");
  assert.match(state.feedbackVariant ?? "", /^right-[1-4]$/u);
  assert.equal(state.completed, false);
  state = reduceCourseG04L11Ti007State(state, {type: "continue-after-correct"});
  assert.equal(state.completed, true); assert.equal(state.phase, "post-correct");
  assert.equal(state.frame, 143); assert.equal(state.sourceCanvasFrame, 143);
  assert.equal(state.feedbackAnimationTimingEstablished, false);
});

test("Need More Help preserves the mathematical explanation without legacy shell", () => {
  let state = createCourseG04L11Ti007State(119);
  state = reduceCourseG04L11Ti007State(state, {type: "open-help"});
  assert.equal(state.phase, "help"); assert.equal(state.legacyHostCallCount, 0);
  state = reduceCourseG04L11Ti007State(state, {type: "close-help"});
  assert.equal(state.phase, "quiz");
});

test("all eight glossary controls open and close locally", () => {
  for (const term of COURSE_G04_L11_TI_007_GLOSSARY) {
    let state = createCourseG04L11Ti007State(119);
    state = reduceCourseG04L11Ti007State(state,
      {type: "open-glossary", glossaryId: term.id});
    assert.equal(state.phase, "glossary"); assert.equal(state.playing, false);
    assert.equal(state.legacyHostCallCount, 0);
    assert.equal(getCourseG04L11Ti007SelectedGlossary(state)?.sourceKeyAttribute,
      term.sourceKeyAttribute);
    state = reduceCourseG04L11Ti007State(state, {type: "close-glossary"});
    assert.equal(state.phase, "quiz");
  }
});

test("Replay resets choices, feedback, completion, and deterministic seed", () => {
  let state = createCourseG04L11Ti007State(119, 8);
  state = reduceCourseG04L11Ti007State(state,
    {type: "choose-answer", choiceId: "three-units"});
  const replayed = reduceCourseG04L11Ti007State(state, {type: "replay"});
  assert.deepEqual(replayed, createCourseG04L11Ti007State(1, 8));
  assert.equal(Object.isFrozen(replayed), true);
});

test("invalid and premature events fail closed without authority expansion", () => {
  assert.throws(() => createCourseG04L11Ti007State(144),
    /invalid TI007 local frame/u);
  assert.throws(() => reduceCourseG04L11Ti007State(
    createCourseG04L11Ti007State(20),
    {type: "choose-answer", choiceId: "five-units"}), /not available/u);
  assert.throws(() => reduceCourseG04L11Ti007State(
    createCourseG04L11Ti007State(119),
    {type: "open-glossary", glossaryId: "old-shell" as "number"}),
  /unknown or unavailable TI007/u);
  assert.equal(COURSE_G04_L11_TI_007_INTERACTION_AUTHORITY.sourceDomainDeclared, false);
  assert.equal(COURSE_G04_L11_TI_007_INTERACTION_AUTHORITY.sourceAudioAccepted, false);
  assert.equal(COURSE_G04_L11_TI_007_INTERACTION_AUTHORITY.strictAcceptanceEffect,
    "none");
});
