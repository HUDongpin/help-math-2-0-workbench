import assert from "node:assert/strict";
import test from "node:test";

import {
  createAlgL09TiChoiceState,
  feedbackForAlgL09TiChoice,
  reduceAlgL09TiChoice,
  type AlgL09TiChoiceBehavior,
} from "../src/g678-alg-l09-ti-choice";
import {SHARED_ALG001_L09_P024_BEHAVIOR as p024} from
  "../src/modules/shared-alg001-l09-p024";
import {SHARED_ALG001_L09_P025_BEHAVIOR as p025} from
  "../src/modules/shared-alg001-l09-p025";
import {SHARED_ALG001_L09_P026_BEHAVIOR as p026} from
  "../src/modules/shared-alg001-l09-p026";
import {SHARED_ALG001_L09_P027_BEHAVIOR as p027} from
  "../src/modules/shared-alg001-l09-p027";
import {SHARED_ALG001_L09_P028_BEHAVIOR as p028} from
  "../src/modules/shared-alg001-l09-p028";
import {SHARED_ALG001_L09_P029_BEHAVIOR as p029} from
  "../src/modules/shared-alg001-l09-p029";

const behaviors = [p024, p025, p026, p027, p028, p029] satisfies
  readonly AlgL09TiChoiceBehavior[];

function atStop(behavior: AlgL09TiChoiceBehavior) {
  return reduceAlgL09TiChoice(behavior, createAlgL09TiChoiceState(),
    {type: "observe-frame", frame: behavior.stopFrame});
}

test("ALG L9 TI batch binds six distinct source stops and exact answers", () => {
  assert.deepEqual(behaviors.map((behavior) => [
    behavior.animationId,
    behavior.stopFrame,
    behavior.resumeFrame,
    behavior.options.length,
    behavior.options.find((option) => option.correct)?.label,
    behavior.options.find((option) => option.correct)?.value,
  ]), [
    ["shared-alg001-l09-p024", 132, 133, 4, "B", "3:2"],
    ["shared-alg001-l09-p025", 68, 69, 4, "C", "27 to 38"],
    ["shared-alg001-l09-p026", 84, 85, 4, "A", "x = 36"],
    ["shared-alg001-l09-p027", 134, 135, 2, "A",
      "non-proportional relationship"],
    ["shared-alg001-l09-p028", 177, 178, 2, "B",
      "proportional relationship"],
    ["shared-alg001-l09-p029", 231, 232, 4, "C", "15 miles"],
  ]);
  for (const behavior of behaviors) {
    const state = atStop(behavior);
    assert.equal(state.phase, "choosing");
    assert.equal(state.mainFrame, behavior.stopFrame);
    assert.equal(state.mainPlaying, false);
    assert.equal(state.choicesEnabled, true);
  }
});

test("each TI source hint retries once and the second wrong choice resumes", () => {
  for (const behavior of behaviors) {
    const wrong = behavior.options.find((option) => !option.correct);
    assert.ok(wrong?.wrong);
    let state = reduceAlgL09TiChoice(behavior, atStop(behavior),
      {type: "choose", choice: wrong.id, input: "mouse", seed: 0});
    assert.equal(state.phase, "wrong-feedback-1");
    assert.equal(feedbackForAlgL09TiChoice(behavior, state),
      wrong.wrong.first);
    state = reduceAlgL09TiChoice(behavior, state,
      {type: "dismiss-wrong", input: "Enter"});
    assert.equal(state.phase, "choosing");
    assert.equal(state.quizTryCount, 1);
    state = reduceAlgL09TiChoice(behavior, state,
      {type: "choose", choice: wrong.id, input: " ", seed: 0});
    assert.equal(state.phase, "wrong-feedback-2");
    assert.equal(feedbackForAlgL09TiChoice(behavior, state),
      wrong.wrong.second);
    state = reduceAlgL09TiChoice(behavior, state,
      {type: "dismiss-wrong", input: "mouse"});
    assert.equal(state.phase, "resumed");
    assert.equal(state.mainFrame, behavior.resumeFrame);
    assert.equal(state.quizTryCount, 0);
  }
});

test("each correct TI choice waits for typed feedback completion", () => {
  for (const behavior of behaviors) {
    const correct = behavior.options.find((option) => option.correct);
    assert.ok(correct);
    let state = reduceAlgL09TiChoice(behavior, atStop(behavior),
      {type: "choose", choice: correct.id, input: "Enter", seed: 3});
    assert.equal(state.phase, "right-feedback");
    assert.equal(state.rightFeedbackBranch, 4);
    assert.equal(feedbackForAlgL09TiChoice(behavior, state), "Correct!");
    state = reduceAlgL09TiChoice(behavior, state,
      {type: "right-feedback-finished"});
    assert.equal(state.phase, "resumed");
    assert.equal(state.mainFrame, behavior.resumeFrame);
  }
});

test("maintained attempt state records, but does not repeat, three source defects", () => {
  assert.deepEqual(behaviors.filter((behavior) =>
    behavior.maintainedAttemptCounterNormalizesKnownSourceVariantDefect)
    .map((behavior) => behavior.animationId), [
    "shared-alg001-l09-p025",
    "shared-alg001-l09-p027",
    "shared-alg001-l09-p029",
  ]);
  assert.equal(behaviors.filter((behavior) =>
    behavior.sourceWrongFeedbackAttemptIncrementComplete).length, 3);
  for (const behavior of behaviors) {
    const wrong = behavior.options.find((option) => !option.correct);
    assert.ok(wrong);
    const firstWrong = reduceAlgL09TiChoice(behavior, atStop(behavior),
      {type: "choose", choice: wrong.id, input: "mouse", seed: 0});
    const replayed = reduceAlgL09TiChoice(behavior, firstWrong,
      {type: "replay", input: " "});
    assert.equal(replayed.phase, "before-stop");
    assert.equal(replayed.quizTryCount, 0);
    assert.equal(replayed.replay, 1);
  }
});
