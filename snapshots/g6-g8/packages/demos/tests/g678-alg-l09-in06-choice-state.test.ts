import assert from "node:assert/strict";
import test from "node:test";

import {
  ALG_L09_IN06_CHOICE_BEHAVIOR_V1,
  createAlgL09In06State,
  feedbackForAlgL09In06,
  reduceAlgL09In06,
} from "../src/g678-alg-l09-in06-choice";

function atStop() {
  return reduceAlgL09In06(createAlgL09In06State(),
    {type: "observe-frame", frame: 188});
}

test("ALG L9 IN06 binds the authored choice stop and exact options", () => {
  assert.equal(ALG_L09_IN06_CHOICE_BEHAVIOR_V1.stopFrame, 188);
  assert.equal(ALG_L09_IN06_CHOICE_BEHAVIOR_V1.resumeFrame, 189);
  assert.equal(ALG_L09_IN06_CHOICE_BEHAVIOR_V1.correctChoice, "AnsBtn2");
  assert.deepEqual(ALG_L09_IN06_CHOICE_BEHAVIOR_V1.options.map((option) =>
    [option.id, option.ratio, option.sourceButtonCharacterId, option.correct]), [
    ["AnsBtn1", "1:2", 32, false],
    ["AnsBtn2", "2:3", 31, true],
    ["AnsBtn3", "32:48", 30, false],
    ["AnsBtn4", "64:96", 30, false],
  ]);
  assert.deepEqual(atStop(), {...createAlgL09In06State(), phase: "choosing",
    mainFrame: 188, mainPlaying: false, choicesEnabled: true});
});

test("calculation error retries once and the second wrong answer resumes", () => {
  let state = reduceAlgL09In06(atStop(),
    {type: "choose", choice: "AnsBtn1", input: "mouse", seed: 0});
  assert.equal(state.phase, "wrong-feedback-1");
  assert.equal(feedbackForAlgL09In06(state),
    "Your calculations are incorrect. Try again.");
  state = reduceAlgL09In06(state,
    {type: "dismiss-wrong", input: "Enter"});
  assert.equal(state.phase, "choosing");
  assert.equal(state.quizTryCount, 1);
  state = reduceAlgL09In06(state,
    {type: "choose", choice: "AnsBtn3", input: " ", seed: 0});
  assert.equal(feedbackForAlgL09In06(state),
    "Reduce the fraction to its simplest form.");
  state = reduceAlgL09In06(state,
    {type: "dismiss-wrong", input: "mouse"});
  assert.equal(state.phase, "resumed");
  assert.equal(state.mainFrame, 189);
  assert.equal(state.quizTryCount, 0);
});

test("correct answer waits for typed feedback completion before resume", () => {
  let state = reduceAlgL09In06(atStop(),
    {type: "choose", choice: "AnsBtn2", input: "Enter", seed: 3});
  assert.equal(state.phase, "right-feedback");
  assert.equal(state.rightFeedbackBranch, 4);
  assert.equal(feedbackForAlgL09In06(state), "Correct!");
  state = reduceAlgL09In06(state, {type: "right-feedback-finished"});
  assert.equal(state.phase, "resumed");
  assert.equal(state.mainFrame, 189);
});

test("Replay and invalid input reset or fail closed", () => {
  const wrong = reduceAlgL09In06(atStop(),
    {type: "choose", choice: "AnsBtn4", input: "mouse", seed: 0});
  const replayed = reduceAlgL09In06(wrong,
    {type: "replay", input: " "});
  assert.equal(replayed.phase, "before-stop");
  assert.equal(replayed.quizTryCount, 0);
  assert.equal(replayed.replay, 1);
  assert.equal(reduceAlgL09In06(atStop(),
    {type: "choose", choice: "AnsBtn2", input: "touch" as never, seed: 0})
    .blockedReason, "activation-input-unsupported");
});
