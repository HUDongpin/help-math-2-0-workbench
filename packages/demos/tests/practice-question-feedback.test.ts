import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizePracticeQuestionSeed,
  selectPracticeQuestionFeedback,
  twoAttemptFeedbackDestination,
} from "../src/timelines/practice-question-feedback";

test("feedback seed normalization preserves unsigned replay identity", () => {
  for (const [input, expected] of [
    [-1, 4294967295], [4294967296, 0], [7, 7],
    [NaN, 0], [Infinity, 0], [1.5, 0], [Number.MAX_SAFE_INTEGER + 1, 0],
  ]) {
    assert.equal(normalizePracticeQuestionSeed(input), expected);
  }
});

test("feedback selection preserves source windows and rejects unresolved choices or pools", () => {
  const choices = Object.freeze([
    Object.freeze({id: "A", correct: false}),
    Object.freeze({id: "B", correct: true}),
  ]);
  const right = Object.freeze(["right-1", "right-2", "right-3", "right-4"]);
  const wrong = Object.freeze(["wrong-1", "wrong-2", "wrong-3"]);
  assert.deepEqual(selectPracticeQuestionFeedback(choices, "A", 5, right, wrong), {
    choice: choices[0], branch: 3, sourceWindow: "wrong-3",
  });
  const result = selectPracticeQuestionFeedback(choices, "B", 5, right, wrong);
  assert.deepEqual(result, {choice: choices[1], branch: 2, sourceWindow: "right-2"});
  assert.ok(Object.isFrozen(result));
  assert.equal(selectPracticeQuestionFeedback(choices, "missing", 0, right, wrong), null);
  assert.equal(selectPracticeQuestionFeedback(choices, "A", 0, right, []), null);
  assert.equal(selectPracticeQuestionFeedback(choices, "B", 0, [], wrong), null);
});

test("two-attempt policy retries only the first wrong response", () => {
  assert.equal(twoAttemptFeedbackDestination("wrong", 0), "quiz");
  assert.equal(twoAttemptFeedbackDestination("wrong", 1), "terminal");
  assert.equal(twoAttemptFeedbackDestination("right", 0), "terminal");
  assert.equal(twoAttemptFeedbackDestination("right", 1), "terminal");
});
