import assert from "node:assert/strict";
import test from "node:test";

import {
  ALG_L09_IN08_CHOICE_BEHAVIOR_V1,
  createAlgL09In08State,
  feedbackForAlgL09In08,
  reduceAlgL09In08,
} from "../src/g678-alg-l09-in08-choice";

function atStop() {
  return reduceAlgL09In08(createAlgL09In08State(),
    {type: "observe-frame", frame: 607});
}

test("ALG L9 IN08 binds the authored choice stop and exact options", () => {
  assert.equal(ALG_L09_IN08_CHOICE_BEHAVIOR_V1.stopFrame, 607);
  assert.equal(ALG_L09_IN08_CHOICE_BEHAVIOR_V1.resumeFrame, 608);
  assert.equal(ALG_L09_IN08_CHOICE_BEHAVIOR_V1.correctChoice, "AnsBtn4");
  assert.deepEqual(ALG_L09_IN08_CHOICE_BEHAVIOR_V1.options.map((option) =>
    [option.id, option.value, option.sourceButtonCharacterId, option.correct]), [
    ["AnsBtn1", "3", 170, false],
    ["AnsBtn2", "4", 170, false],
    ["AnsBtn3", "6", 170, false],
    ["AnsBtn4", "7", 171, true],
  ]);
  assert.deepEqual(atStop(), {...createAlgL09In08State(), phase: "choosing",
    mainFrame: 607, mainPlaying: false, choicesEnabled: true});
});

test("calculation error retries once and the second wrong answer resumes", () => {
  let state = reduceAlgL09In08(atStop(),
    {type: "choose", choice: "AnsBtn1", input: "mouse", seed: 0});
  assert.equal(state.phase, "wrong-feedback-1");
  assert.equal(feedbackForAlgL09In08(state),
    "Follow each of the steps shown. Try again.");
  state = reduceAlgL09In08(state,
    {type: "dismiss-wrong", input: "Enter"});
  assert.equal(state.phase, "choosing");
  assert.equal(state.quizTryCount, 1);
  state = reduceAlgL09In08(state,
    {type: "choose", choice: "AnsBtn3", input: " ", seed: 0});
  assert.equal(feedbackForAlgL09In08(state),
    "Follow each of the steps shown.");
  state = reduceAlgL09In08(state,
    {type: "dismiss-wrong", input: "mouse"});
  assert.equal(state.phase, "resumed");
  assert.equal(state.mainFrame, 608);
  assert.equal(state.quizTryCount, 0);
});

test("correct answer waits for typed feedback completion before resume", () => {
  let state = reduceAlgL09In08(atStop(),
    {type: "choose", choice: "AnsBtn4", input: "Enter", seed: 3});
  assert.equal(state.phase, "right-feedback");
  assert.equal(state.rightFeedbackBranch, 4);
  assert.equal(feedbackForAlgL09In08(state), "Correct!");
  state = reduceAlgL09In08(state, {type: "right-feedback-finished"});
  assert.equal(state.phase, "resumed");
  assert.equal(state.mainFrame, 608);
});

test("Replay and invalid input reset or fail closed", () => {
  const wrong = reduceAlgL09In08(atStop(),
    {type: "choose", choice: "AnsBtn1", input: "mouse", seed: 0});
  const replayed = reduceAlgL09In08(wrong,
    {type: "replay", input: " "});
  assert.equal(replayed.phase, "before-stop");
  assert.equal(replayed.quizTryCount, 0);
  assert.equal(replayed.replay, 1);
  assert.equal(reduceAlgL09In08(atStop(),
    {type: "choose", choice: "AnsBtn4", input: "touch" as never, seed: 0})
    .blockedReason, "activation-input-unsupported");
});
