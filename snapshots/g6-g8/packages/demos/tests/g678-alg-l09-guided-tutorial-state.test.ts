import assert from "node:assert/strict";
import test from "node:test";

import {
  assertAlgL09GuidedTutorialBehavior,
  createAlgL09GuidedTutorialState,
  reduceAlgL09GuidedTutorial,
  type AlgL09GuidedTutorialBehavior,
} from "../src/g678-alg-l09-guided-tutorial";

const behavior: AlgL09GuidedTutorialBehavior = Object.freeze({
  animationId: "shared-alg001-l09-p037",
  source: Object.freeze({path: "G6-G8-shared/ALG001/L9/TS/L9TS07.swf",
    bytes: 562427,
    sha256: "29bfe39a4c2ffd7b163b5c03925efad55ae86b4533a19c278e1abf8dbb91cd35"}),
  frameDomain: "sprite-307",
  frameCount: 942,
  stops: Object.freeze([
    Object.freeze({id: "step-1", frame: 396, resumeFrame: 397,
      kind: "continue" as const}),
    Object.freeze({id: "step-2", frame: 564, resumeFrame: 565,
      kind: "continue" as const}),
    Object.freeze({id: "help-1", frame: 712, resumeFrame: 713,
      kind: "help-or-continue" as const}),
    Object.freeze({id: "help-2", frame: 869, resumeFrame: 870,
      kind: "help-or-continue" as const}),
    Object.freeze({id: "quiz", frame: 925, resumeFrame: 926,
      kind: "quiz" as const}),
    Object.freeze({id: "terminal", frame: 942, resumeFrame: null,
      kind: "terminal" as const}),
  ]),
  finalQuestion: "What is the ratio of socks to shoes?",
  options: Object.freeze([
    Object.freeze({id: "choice-a", label: "A", value: "1 to 4",
      correct: false}),
    Object.freeze({id: "choice-b", label: "B", value: "2 to 9",
      correct: false}),
    Object.freeze({id: "choice-c", label: "C", value: "9 to 2",
      correct: true}),
    Object.freeze({id: "choice-d", label: "D", value: "18 to 4",
      correct: false}),
  ]),
  correctChoiceId: "choice-c",
  maximumWrongAttempts: 2,
  sourceFeedbackDomainCount: 8,
});

test("guided tutorial contract requires exact ordered stops and one answer", () => {
  assert.doesNotThrow(() => assertAlgL09GuidedTutorialBehavior(behavior));
  assert.throws(() => assertAlgL09GuidedTutorialBehavior({...behavior,
    stops: behavior.stops.slice(0, 5)}), /behavior invalid/u);
  assert.throws(() => assertAlgL09GuidedTutorialBehavior({...behavior,
    correctChoiceId: "choice-a"}), /behavior invalid/u);
});

test("guided stops pause, resolve individually, and expose both help branches", () => {
  let state = createAlgL09GuidedTutorialState();
  state = reduceAlgL09GuidedTutorial(behavior, state,
    {type: "observe-frame", frame: 396});
  assert.equal(state.phase, "continue-stop");
  state = reduceAlgL09GuidedTutorial(behavior, state,
    {type: "continue", input: "Enter"});
  assert.deepEqual(state.resolvedStopIds, ["step-1"]);
  assert.equal(state.mainFrame, 397);

  state = reduceAlgL09GuidedTutorial(behavior, state,
    {type: "observe-frame", frame: 564});
  state = reduceAlgL09GuidedTutorial(behavior, state,
    {type: "continue", input: "mouse"});
  state = reduceAlgL09GuidedTutorial(behavior, state,
    {type: "observe-frame", frame: 712});
  assert.equal(state.phase, "help-choice");
  state = reduceAlgL09GuidedTutorial(behavior, state,
    {type: "open-help", input: "Enter"});
  assert.equal(state.phase, "help-open");
  state = reduceAlgL09GuidedTutorial(behavior, state,
    {type: "close-help", input: "mouse"});
  state = reduceAlgL09GuidedTutorial(behavior, state,
    {type: "continue", input: "Enter"});
  assert.deepEqual(state.resolvedStopIds, ["step-1", "step-2", "help-1"]);
});

test("first wrong retries and second wrong explicitly resumes the source", () => {
  let state = createAlgL09GuidedTutorialState();
  for (const [frame, type] of [[396, "continue"], [564, "continue"],
    [712, "continue"], [869, "continue"]] as const) {
    state = reduceAlgL09GuidedTutorial(behavior, state,
      {type: "observe-frame", frame});
    state = reduceAlgL09GuidedTutorial(behavior, state,
      {type, input: "mouse"});
  }
  state = reduceAlgL09GuidedTutorial(behavior, state,
    {type: "observe-frame", frame: 925});
  state = reduceAlgL09GuidedTutorial(behavior, state,
    {type: "choose", choiceId: "choice-a", input: "mouse", seed: 0});
  assert.equal(state.phase, "wrong-feedback-1");
  assert.equal(state.quizTryCount, 1);
  state = reduceAlgL09GuidedTutorial(behavior, state,
    {type: "dismiss-wrong", input: "Enter"});
  state = reduceAlgL09GuidedTutorial(behavior, state,
    {type: "choose", choiceId: "choice-b", input: "mouse", seed: 0});
  assert.equal(state.phase, "wrong-feedback-2");
  state = reduceAlgL09GuidedTutorial(behavior, state,
    {type: "dismiss-wrong", input: "mouse"});
  assert.equal(state.phase, "playing");
  assert.equal(state.mainFrame, 926);
  assert.equal(state.resolvedStopIds.at(-1), "quiz");
});

test("correct feedback resumes, terminal does not resume, and Replay resets", () => {
  let state = createAlgL09GuidedTutorialState();
  for (const [frame, type] of [[396, "continue"], [564, "continue"],
    [712, "continue"], [869, "continue"]] as const) {
    state = reduceAlgL09GuidedTutorial(behavior, state,
      {type: "observe-frame", frame});
    state = reduceAlgL09GuidedTutorial(behavior, state,
      {type, input: "Enter"});
  }
  state = reduceAlgL09GuidedTutorial(behavior, state,
    {type: "observe-frame", frame: 925});
  state = reduceAlgL09GuidedTutorial(behavior, state,
    {type: "choose", choiceId: "choice-c", input: "Enter", seed: 3});
  assert.equal(state.phase, "right-feedback");
  assert.equal(state.rightFeedbackBranch, 4);
  state = reduceAlgL09GuidedTutorial(behavior, state,
    {type: "right-feedback-finished"});
  state = reduceAlgL09GuidedTutorial(behavior, state,
    {type: "observe-frame", frame: 942});
  assert.equal(state.phase, "terminal");
  assert.equal(state.mainPlaying, false);
  const terminal = state;
  state = reduceAlgL09GuidedTutorial(behavior, state,
    {type: "continue", input: "mouse"});
  assert.equal(state.blockedReason, "continue-disabled");
  state = reduceAlgL09GuidedTutorial(behavior, terminal,
    {type: "replay", input: "Enter"});
  assert.deepEqual(state, {...createAlgL09GuidedTutorialState(), replay: 1});
});
