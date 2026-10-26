import assert from "node:assert/strict";
import test from "node:test";

import {
  ALG_L09_IN10_CHOICE_BEHAVIOR_V1,
  createAlgL09In10State,
  feedbackForAlgL09In10,
  reduceAlgL09In10,
} from "../src/g678-alg-l09-in10-choice";

function atStop() {
  return reduceAlgL09In10(createAlgL09In10State(),
    {type: "observe-frame", frame: 93});
}

test("ALG L9 IN10 binds the authored choice stop and exact options", () => {
  assert.equal(ALG_L09_IN10_CHOICE_BEHAVIOR_V1.stopFrame, 93);
  assert.equal(ALG_L09_IN10_CHOICE_BEHAVIOR_V1.resumeFrame, 94);
  assert.equal(ALG_L09_IN10_CHOICE_BEHAVIOR_V1.correctChoice, "AnsBtn2");
  assert.deepEqual(ALG_L09_IN10_CHOICE_BEHAVIOR_V1.options.map((option) =>
    [option.id, option.value, option.sourceButtonCharacterId, option.correct]), [
    ["AnsBtn1", "proportional relationship", 167, false],
    ["AnsBtn2", "non-proportional relationship", 166, true],
  ]);
  assert.deepEqual(atStop(), {...createAlgL09In10State(), phase: "choosing",
    mainFrame: 93, mainPlaying: false, choicesEnabled: true});
});

test("calculation error retries once and the second wrong answer resumes", () => {
  let state = reduceAlgL09In10(atStop(),
    {type: "choose", choice: "AnsBtn1", input: "mouse", seed: 0});
  assert.equal(state.phase, "wrong-feedback-1");
  assert.equal(feedbackForAlgL09In10(state),
    "Two quantities have a proportional relationship when every ratio of pairs of values is equal. Try again.");
  state = reduceAlgL09In10(state,
    {type: "dismiss-wrong", input: "Enter"});
  assert.equal(state.phase, "choosing");
  assert.equal(state.quizTryCount, 1);
  state = reduceAlgL09In10(state,
    {type: "choose", choice: "AnsBtn1", input: " ", seed: 0});
  assert.equal(feedbackForAlgL09In10(state),
    "Two quantities have a proportional relationship when every ratio of pairs of values is equal.");
  state = reduceAlgL09In10(state,
    {type: "dismiss-wrong", input: "mouse"});
  assert.equal(state.phase, "resumed");
  assert.equal(state.mainFrame, 94);
  assert.equal(state.quizTryCount, 0);
});

test("correct answer waits for typed feedback completion before resume", () => {
  let state = reduceAlgL09In10(atStop(),
    {type: "choose", choice: "AnsBtn2", input: "Enter", seed: 3});
  assert.equal(state.phase, "right-feedback");
  assert.equal(state.rightFeedbackBranch, 4);
  assert.equal(feedbackForAlgL09In10(state), "Correct!");
  state = reduceAlgL09In10(state, {type: "right-feedback-finished"});
  assert.equal(state.phase, "resumed");
  assert.equal(state.mainFrame, 94);
});

test("Replay and invalid input reset or fail closed", () => {
  const wrong = reduceAlgL09In10(atStop(),
    {type: "choose", choice: "AnsBtn1", input: "mouse", seed: 0});
  const replayed = reduceAlgL09In10(wrong,
    {type: "replay", input: " "});
  assert.equal(replayed.phase, "before-stop");
  assert.equal(replayed.quizTryCount, 0);
  assert.equal(replayed.replay, 1);
  assert.equal(reduceAlgL09In10(atStop(),
    {type: "choose", choice: "AnsBtn2", input: "touch" as never, seed: 0})
    .blockedReason, "activation-input-unsupported");
});
