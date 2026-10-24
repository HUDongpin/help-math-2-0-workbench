import assert from "node:assert/strict";
import test from "node:test";

import {
  COURSE_G04_L11_VB_007_CHOICES,
  COURSE_G04_L11_VB_007_INTERACTION_AUTHORITY,
  COURSE_G04_L11_VB_007_INTERACTION_SOURCE,
  COURSE_G04_L11_VB_007_TERMS,
  createCourseG04L11Vb007InteractionState,
  getCourseG04L11Vb007SelectedTerm,
  reduceCourseG04L11Vb007Interaction,
} from "./course-g04-l11-vb-007-ordered-pair-practice";

test("binds Point B, the two source answers, and the 107-frame principal", () => {
  assert.equal(COURSE_G04_L11_VB_007_INTERACTION_SOURCE.sourceTimelineId,
    "sprite-254");
  assert.equal(COURSE_G04_L11_VB_007_INTERACTION_SOURCE.sourceFrameCount, 107);
  assert.equal(COURSE_G04_L11_VB_007_INTERACTION_SOURCE
    .sourcePromptStopFrame, 69);
  assert.deepEqual(COURSE_G04_L11_VB_007_INTERACTION_SOURCE.point,
    {name: "B", x: 2, y: 4});
  assert.deepEqual(COURSE_G04_L11_VB_007_CHOICES.map((choice) => [
    choice.sourceButtonObjectId, choice.label, choice.outcome,
  ]), [["40", "(2,4)", "correct"], ["39", "(4,2)", "incorrect"]]);
});

test("preserves seven unique glossary terms and duplicate source provenance", () => {
  assert.equal(COURSE_G04_L11_VB_007_TERMS.length, 7);
  assert.deepEqual(COURSE_G04_L11_VB_007_TERMS.find((term) =>
    term.id === "ordered-pair")?.sourceButtonObjectIds, ["9", "77"]);
  assert.deepEqual(COURSE_G04_L11_VB_007_TERMS.map((term) => term.label), [
    "Point", "Coordinate grid", "Ordered pair", "Number", "Unit",
    "X-axis", "Y-axis",
  ]);
});

test("first incorrect answer enables Try Again and preserves attempt count", () => {
  let state = createCourseG04L11Vb007InteractionState();
  state = reduceCourseG04L11Vb007Interaction(state,
    {type: "choose-answer", choiceId: "four-two"});
  assert.equal(state.phase, "feedback-incorrect");
  assert.equal(state.incorrectAttemptCount, 1);
  assert.equal(state.quizEnabled, false);
  state = reduceCourseG04L11Vb007Interaction(state, {type: "try-again"});
  assert.equal(state.phase, "prompt");
  assert.equal(state.incorrectAttemptCount, 1);
  assert.equal(state.quizEnabled, true);
});

test("second incorrect answer opens coordinate-order remediation", () => {
  let state = createCourseG04L11Vb007InteractionState();
  state = reduceCourseG04L11Vb007Interaction(state,
    {type: "choose-answer", choiceId: "four-two"});
  state = reduceCourseG04L11Vb007Interaction(state, {type: "try-again"});
  state = reduceCourseG04L11Vb007Interaction(state,
    {type: "choose-answer", choiceId: "four-two"});
  assert.equal(state.phase, "remediation");
  assert.equal(state.incorrectAttemptCount, 2);
  state = reduceCourseG04L11Vb007Interaction(state,
    {type: "review-coordinate-order"});
  assert.equal(state.phase, "prompt");
  assert.equal(state.incorrectAttemptCount, 0);
});

test("correct answer completes only through the explicit feedback path", () => {
  let state = createCourseG04L11Vb007InteractionState();
  assert.throws(() => reduceCourseG04L11Vb007Interaction(state,
    {type: "continue-correct"}), /requires a correct response/u);
  state = reduceCourseG04L11Vb007Interaction(state,
    {type: "choose-answer", choiceId: "two-four"});
  assert.equal(state.phase, "feedback-correct");
  state = reduceCourseG04L11Vb007Interaction(state,
    {type: "continue-correct"});
  assert.equal(state.phase, "completed");
});

test("glossary returns to the exact local phase and Replay resets all state", () => {
  let state = createCourseG04L11Vb007InteractionState();
  state = reduceCourseG04L11Vb007Interaction(state,
    {type: "choose-answer", choiceId: "four-two"});
  state = reduceCourseG04L11Vb007Interaction(state,
    {type: "open-term", termId: "x-axis"});
  assert.equal(getCourseG04L11Vb007SelectedTerm(state)?.label, "X-axis");
  state = reduceCourseG04L11Vb007Interaction(state, {type: "close-term"});
  assert.equal(state.phase, "feedback-incorrect");
  assert.equal(state.incorrectAttemptCount, 1);
  assert.deepEqual(reduceCourseG04L11Vb007Interaction(state, {type: "replay"}),
    createCourseG04L11Vb007InteractionState());
});

test("all fidelity, audio, review, acceptance, and release claims stay false", () => {
  for (const [key, value] of Object.entries(
    COURSE_G04_L11_VB_007_INTERACTION_AUTHORITY,
  )) {
    if (["implementationCandidateOnly", "sourceCanvasSequencePreserved",
      "pointAndAnswerSemanticsPreserved",
      "animationInternalPedagogicalControlsPreserved"].includes(key)) {
      assert.equal(value, true, key);
    } else if (key === "strictAcceptanceEffect") {
      assert.equal(value, "none");
    } else {
      assert.equal(value, false, key);
    }
  }
});
