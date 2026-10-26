import assert from "node:assert/strict";
import test from "node:test";

import {
  ALG_L09_IN04_NUMERIC_BEHAVIOR_V1,
  createAlgL09In04State,
  reduceAlgL09In04,
} from "../src/g678-alg-l09-in04-numeric";

test("ALG L9 IN04 binds the exact frame-270 numeric response", () => {
  assert.equal(ALG_L09_IN04_NUMERIC_BEHAVIOR_V1.frameCount, 420);
  assert.equal(ALG_L09_IN04_NUMERIC_BEHAVIOR_V1.stopFrame, 270);
  assert.equal(ALG_L09_IN04_NUMERIC_BEHAVIOR_V1.resumeFrame, 271);
  assert.deepEqual(ALG_L09_IN04_NUMERIC_BEHAVIOR_V1.answer,
    {numerator: "7", denominator: "20"});

  let state = createAlgL09In04State();
  state = reduceAlgL09In04(state, {type: "observe-frame", frame: 269});
  assert.equal(state.phase, "before-stop");
  assert.equal(state.mainPlaying, true);
  state = reduceAlgL09In04(state, {type: "observe-frame", frame: 270});
  assert.equal(state.phase, "editing");
  assert.equal(state.mainPlaying, false);
  assert.equal(state.inputEnabled, true);
});

test("first wrong answer retries and second wrong answer resumes", () => {
  let state = reduceAlgL09In04(createAlgL09In04State(),
    {type: "observe-frame", frame: 270});
  state = reduceAlgL09In04(state,
    {type: "edit-field", field: "numerator", value: "20"});
  state = reduceAlgL09In04(state,
    {type: "edit-field", field: "denominator", value: "7"});
  assert.equal(state.submitEnabled, true);
  state = reduceAlgL09In04(state,
    {type: "submit", input: "Enter", seed: 0});
  assert.equal(state.phase, "wrong-feedback-1");
  assert.equal(state.quizTryCount, 1);
  state = reduceAlgL09In04(state,
    {type: "dismiss-wrong", input: " "});
  assert.equal(state.phase, "editing");
  assert.equal(state.numerator, "");
  assert.equal(state.denominator, "");

  state = reduceAlgL09In04(state,
    {type: "edit-field", field: "numerator", value: "1"});
  state = reduceAlgL09In04(state,
    {type: "edit-field", field: "denominator", value: "2"});
  state = reduceAlgL09In04(state,
    {type: "submit", input: "mouse", seed: 0});
  assert.equal(state.phase, "wrong-feedback-2");
  assert.equal(state.quizTryCount, 2);
  state = reduceAlgL09In04(state,
    {type: "dismiss-wrong", input: "mouse"});
  assert.equal(state.phase, "resumed");
  assert.equal(state.mainFrame, 271);
  assert.equal(state.mainPlaying, true);
});

test("7 over 20 uses the typed right-feedback path before resuming", () => {
  let state = reduceAlgL09In04(createAlgL09In04State(),
    {type: "observe-frame", frame: 270});
  state = reduceAlgL09In04(state,
    {type: "edit-field", field: "numerator", value: "7"});
  state = reduceAlgL09In04(state,
    {type: "edit-field", field: "denominator", value: "20"});
  state = reduceAlgL09In04(state,
    {type: "submit", input: "mouse", seed: 3});
  assert.equal(state.phase, "right-feedback");
  assert.equal(state.rightFeedbackBranch, 4);
  assert.equal(state.mainPlaying, false);
  state = reduceAlgL09In04(state, {type: "right-feedback-finished"});
  assert.equal(state.phase, "resumed");
  assert.equal(state.mainFrame, 271);
});

test("numeric input is digit-only and Replay resets the complete vector", () => {
  let state = reduceAlgL09In04(createAlgL09In04State(),
    {type: "observe-frame", frame: 270});
  state = reduceAlgL09In04(state,
    {type: "edit-field", field: "numerator", value: "7x"});
  assert.equal(state.blockedReason, "digits-only");
  state = reduceAlgL09In04(state,
    {type: "edit-field", field: "numerator", value: "7"});
  state = reduceAlgL09In04(state,
    {type: "edit-field", field: "denominator", value: "20"});
  state = reduceAlgL09In04(state,
    {type: "submit", input: "mouse", seed: 0});
  state = reduceAlgL09In04(state, {type: "replay", input: " "});
  assert.deepEqual(state, {...createAlgL09In04State(), replay: 1});
});
