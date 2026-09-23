import assert from "node:assert/strict";
import test from "node:test";

import {
  COURSE_G04_L11_IN_010_INTERACTION_AUTHORITY,
  COURSE_G04_L11_IN_010_INTERACTION_SOURCE,
  createCourseG04L11In010PracticeState,
  reduceCourseG04L11In010Practice,
} from "./course-g04-l11-in-010-point-choice-interaction";

const quiz = (seed = 0) => createCourseG04L11In010PracticeState(191, seed);

test("binds the three exact choices and all animation-internal controls", () => {
  assert.equal(COURSE_G04_L11_IN_010_INTERACTION_SOURCE.sourceFrameCount, 277);
  assert.equal(COURSE_G04_L11_IN_010_INTERACTION_SOURCE.naturalQuizStopFrame, 191);
  assert.equal(COURSE_G04_L11_IN_010_INTERACTION_SOURCE.sourceAnswerControlCount, 3);
  assert.equal(COURSE_G04_L11_IN_010_INTERACTION_SOURCE.sourceGlossaryControlCount, 4);
  assert.equal(COURSE_G04_L11_IN_010_INTERACTION_SOURCE.sourceEmbeddedStreamCount, 11);
  assert.equal(COURSE_G04_L11_IN_010_INTERACTION_AUTHORITY.legacyCourseShellNavigationIncluded, false);
  assert.equal(COURSE_G04_L11_IN_010_INTERACTION_AUTHORITY.registeredCurrentJavascript, true);
});

test("candidate playback stops at the executed quiz boundary", () => {
  let state = createCourseG04L11In010PracticeState(1, 9);
  state = reduceCourseG04L11In010Practice(state,
    {type: "synchronize-frame", frame: 190});
  assert.equal(state.phase, "instruction");
  assert.equal(state.sourceCanvasFrame, 190);
  state = reduceCourseG04L11In010Practice(state,
    {type: "synchronize-frame", frame: 277});
  assert.equal(state.frame, 191);
  assert.equal(state.phase, "quiz");
  assert.equal(state.playing, false);
  assert.equal(state.sourceCanvasFrame, 190);
});

test("both distractors preserve Close and retry without advancement", () => {
  for (const choiceId of ["left", "middle"] as const) {
    let state = reduceCourseG04L11In010Practice(quiz(7),
      {type: "choose-answer", choiceId});
    assert.equal(state.phase, "wrong-feedback");
    assert.equal(state.frame, 191);
    assert.equal(state.popupOpen, true);
    assert.match(state.feedbackVariant ?? "", /^wrong-[1-4]$/u);
    assert.equal(state.feedbackMessage, "Which point belongs on the line? Try again.");
    state = reduceCourseG04L11In010Practice(state,
      {type: "close-wrong-feedback"});
    assert.equal(state.phase, "quiz");
    assert.equal(state.selectedChoiceId, null);
    assert.equal(state.popupOpen, false);
  }
});

test("only right choice (4,8) continues to the post-correct definition", () => {
  let state = reduceCourseG04L11In010Practice(quiz(3),
    {type: "choose-answer", choiceId: "right"});
  assert.equal(state.phase, "correct-feedback");
  assert.equal(state.selectedChoiceId, "right");
  assert.match(state.feedbackVariant ?? "", /^right-[1-5]$/u);
  state = reduceCourseG04L11In010Practice(state,
    {type: "continue-after-correct"});
  assert.equal(state.completed, true);
  assert.equal(state.phase, "post-correct");
  assert.equal(state.frame, 277);
  assert.equal(state.sourceCanvasFrame, 277);
  assert.equal(state.correctFeedbackTimingEstablished, false);
});

test("glossary is contained and Replay resets the complete state", () => {
  let state = reduceCourseG04L11In010Practice(quiz(),
    {type: "select-term", termId: "coordinate"});
  assert.equal(state.glossaryOpen, true);
  assert.equal(state.selectedTermId, "coordinate");
  assert.equal(state.legacyHostCallCount, 0);
  state = reduceCourseG04L11In010Practice(state, {type: "close-term"});
  state = reduceCourseG04L11In010Practice(state,
    {type: "choose-answer", choiceId: "left"});
  state = reduceCourseG04L11In010Practice(state, {type: "replay"});
  assert.equal(state.frame, 1);
  assert.equal(state.phase, "instruction");
  assert.equal(state.wrongAttemptCount, 0);
  assert.equal(state.selectedChoiceId, null);
  assert.equal(state.popupOpen, false);
});

test("invalid or premature events fail closed", () => {
  assert.throws(() => createCourseG04L11In010PracticeState(0), /invalid/u);
  assert.throws(() => createCourseG04L11In010PracticeState(278), /invalid/u);
  assert.throws(() => reduceCourseG04L11In010Practice(
    createCourseG04L11In010PracticeState(100),
    {type: "choose-answer", choiceId: "right"}), /not available/u);
  assert.throws(() => reduceCourseG04L11In010Practice(quiz(),
    {type: "choose-answer", choiceId: "shell" as "right"}), /unknown/u);
  assert.throws(() => reduceCourseG04L11In010Practice(quiz(),
    {type: "continue-after-correct"}), /not open/u);
});
