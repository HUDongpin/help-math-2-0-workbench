import assert from "node:assert/strict";
import test from "node:test";

import {COURSE_G04_L11_TI_006_CHOICES, COURSE_G04_L11_TI_006_GLOSSARY,
  COURSE_G04_L11_TI_006_STATIC_SOURCE_FACTS} from
  "../source-static/g4-l11/course-g04-l11-ti-006-static";
import {COURSE_G04_L11_TI_006_INTERACTION_AUTHORITY,
  COURSE_G04_L11_TI_006_INTERACTION_SOURCE, createCourseG04L11Ti006State,
  getCourseG04L11Ti006SelectedGlossary, reduceCourseG04L11Ti006State} from
  "./course-g04-l11-ti-006-segment-length-interaction";

test("binds exact TI006 exercise and twelve internal teaching controls", () => {
  assert.equal(COURSE_G04_L11_TI_006_STATIC_SOURCE_FACTS.release.ordinal, 30);
  assert.equal(COURSE_G04_L11_TI_006_INTERACTION_SOURCE.sourceTimelineId,
    "sprite-259");
  assert.equal(COURSE_G04_L11_TI_006_INTERACTION_SOURCE.sourceFrameCount, 95);
  assert.equal(COURSE_G04_L11_TI_006_INTERACTION_SOURCE.naturalQuizStopFrame, 76);
  assert.deepEqual(COURSE_G04_L11_TI_006_INTERACTION_SOURCE.endpoints,
    ["(2,5)", "(2,8)"]);
  assert.equal(COURSE_G04_L11_TI_006_INTERACTION_SOURCE.equation, "8 − 5 = 3");
  assert.deepEqual(COURSE_G04_L11_TI_006_CHOICES.map((choice) =>
    [choice.sourceInstanceName, choice.label, choice.correct]), [
    ["AnsBtn3", "2 units", false], ["AnsBtn1", "3 units", true],
    ["AnsBtn2", "5 units", false],
  ]);
  assert.equal(COURSE_G04_L11_TI_006_GLOSSARY.length, 8);
  assert.equal(3 + 1 + COURSE_G04_L11_TI_006_GLOSSARY.length, 12);
});

test("candidate playback enters and holds the question on a clean source frame", () => {
  let state = createCourseG04L11Ti006State(1, 7);
  assert.equal(state.playing, true); assert.equal(state.phase, "instruction");
  state = reduceCourseG04L11Ti006State(state, {type: "synchronize-frame", frame: 76});
  assert.equal(state.frame, 76); assert.equal(state.sourceCanvasFrame, 75);
  assert.equal(state.phase, "quiz"); assert.equal(state.playing, false);
  const held = reduceCourseG04L11Ti006State(state,
    {type: "synchronize-frame", frame: 95});
  assert.equal(held.frame, 76); assert.equal(held.sourceCanvasFrame, 75);
});

test("both distractors preserve exact source feedback and clean retry", () => {
  for (const choiceId of ["two-units", "five-units"] as const) {
    let state = createCourseG04L11Ti006State(76, 3);
    state = reduceCourseG04L11Ti006State(state, {type: "choose-answer", choiceId});
    assert.equal(state.phase, "wrong-feedback");
    assert.equal(state.feedbackMessage,
      "Read the second part of the rule. Try again.");
    assert.match(state.feedbackVariant ?? "", /^wrong-[1-4]$/u);
    state = reduceCourseG04L11Ti006State(state, {type: "close-wrong-feedback"});
    assert.equal(state.phase, "quiz"); assert.equal(state.selectedChoiceId, null);
    assert.equal(state.completed, false);
  }
});

test("only 3 units completes through an explicit modern continuation", () => {
  let state = createCourseG04L11Ti006State(76, 2);
  state = reduceCourseG04L11Ti006State(state,
    {type: "choose-answer", choiceId: "three-units"});
  assert.equal(state.phase, "correct-feedback");
  assert.match(state.feedbackVariant ?? "", /^right-[1-4]$/u);
  assert.equal(state.completed, false);
  state = reduceCourseG04L11Ti006State(state, {type: "continue-after-correct"});
  assert.equal(state.completed, true); assert.equal(state.phase, "post-correct");
  assert.equal(state.frame, 95); assert.equal(state.sourceCanvasFrame, 95);
  assert.equal(state.feedbackAnimationTimingEstablished, false);
});

test("Need More Help preserves the mathematical explanation without legacy shell", () => {
  let state = createCourseG04L11Ti006State(76);
  state = reduceCourseG04L11Ti006State(state, {type: "open-help"});
  assert.equal(state.phase, "help"); assert.equal(state.legacyHostCallCount, 0);
  state = reduceCourseG04L11Ti006State(state, {type: "close-help"});
  assert.equal(state.phase, "quiz");
});

test("all eight glossary controls open and close locally", () => {
  for (const term of COURSE_G04_L11_TI_006_GLOSSARY) {
    let state = createCourseG04L11Ti006State(76);
    state = reduceCourseG04L11Ti006State(state,
      {type: "open-glossary", glossaryId: term.id});
    assert.equal(state.phase, "glossary"); assert.equal(state.playing, false);
    assert.equal(state.legacyHostCallCount, 0);
    assert.equal(getCourseG04L11Ti006SelectedGlossary(state)?.sourceKeyAttribute,
      term.sourceKeyAttribute);
    state = reduceCourseG04L11Ti006State(state, {type: "close-glossary"});
    assert.equal(state.phase, "quiz");
  }
});

test("Replay resets choices, feedback, completion, and deterministic seed", () => {
  let state = createCourseG04L11Ti006State(76, 8);
  state = reduceCourseG04L11Ti006State(state,
    {type: "choose-answer", choiceId: "two-units"});
  const replayed = reduceCourseG04L11Ti006State(state, {type: "replay"});
  assert.deepEqual(replayed, createCourseG04L11Ti006State(1, 8));
  assert.equal(Object.isFrozen(replayed), true);
});

test("invalid and premature events fail closed without authority expansion", () => {
  assert.throws(() => createCourseG04L11Ti006State(96),
    /invalid TI006 local frame/u);
  assert.throws(() => reduceCourseG04L11Ti006State(
    createCourseG04L11Ti006State(20),
    {type: "choose-answer", choiceId: "three-units"}), /not available/u);
  assert.throws(() => reduceCourseG04L11Ti006State(
    createCourseG04L11Ti006State(76),
    {type: "open-glossary", glossaryId: "old-shell" as "number"}),
  /unknown or unavailable TI006/u);
  assert.equal(COURSE_G04_L11_TI_006_INTERACTION_AUTHORITY.sourceDomainDeclared, false);
  assert.equal(COURSE_G04_L11_TI_006_INTERACTION_AUTHORITY.sourceAudioAccepted, false);
  assert.equal(COURSE_G04_L11_TI_006_INTERACTION_AUTHORITY.strictAcceptanceEffect,
    "none");
});
