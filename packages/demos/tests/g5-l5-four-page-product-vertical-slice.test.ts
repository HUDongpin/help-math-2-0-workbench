import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFileSync} from "node:fs";
import test from "node:test";
import {gunzipSync} from "node:zlib";

import {
  G5_L5_FOUR_PAGE_VERTICAL_SLICE_SOURCE_BINDINGS,
  G5_L5_FQ003_CORRECT_OPTIONS,
  G5_L5_FQ003_BEHAVIOR_COMPOSITE_CONTRACT_ID,
  G5_L5_FQ003_INITIAL_STATE,
  G5_L5_TS007_BEHAVIOR_COMPOSITE_CONTRACT_ID,
  G5_L5_TS007_INITIAL_STATE,
  G5_L5_TS007_STOP_FRAMES,
  G5_L5_VB012_BEHAVIOR_COMPOSITE_CONTRACT_ID,
  G5_L5_VB012_INITIAL_STATE,
  g5L5Fq003FrameForState,
  g5L5Fq003BehaviorCompositeStateForState,
  g5L5Ts007BehaviorCompositeStateForState,
  g5L5Ts007FrameForState,
  g5L5Vb012BehaviorCompositeStateForState,
  g5L5Vb012FrameForState,
  getG5L5Fq003CorrectCount,
  getG5L5Fq003Grade,
  reduceG5L5Fq003,
  reduceG5L5Ts007,
  reduceG5L5Vb012,
} from "../src/g5-l5-four-page-product-vertical-slice-state";

function projectFile(relativePath: string): Buffer {
  return readFileSync(new URL(`../../../${relativePath}`, import.meta.url));
}

function sha256(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

test("four-page slice is source-hash-bound across all complexity lanes", () => {
  assert.deepEqual(
    G5_L5_FOUR_PAGE_VERTICAL_SLICE_SOURCE_BINDINGS.map((binding) => [
      binding.animationId,
      binding.kind,
      binding.userEventPcodeFileCount,
      binding.initialProductStopFrame,
    ]),
    [
      ["course-g05-l05-rw-003", "linear", 0, 631],
      ["course-g05-l05-vb-012", "fixed-choice", 3, 81],
      ["course-g05-l05-ts-007", "multi-section", 40, 245],
      ["course-g05-l05-fq-003", "final-quiz", 109, 2],
    ],
  );
  for (const binding of G5_L5_FOUR_PAGE_VERTICAL_SLICE_SOURCE_BINDINGS) {
    assert.equal(
      sha256(projectFile(binding.ffdecScriptsArtifact)),
      binding.ffdecScriptsArtifactSha256,
      binding.animationId,
    );
    assert.equal(
      sha256(projectFile(binding.scenarioInventoryArtifact)),
      binding.scenarioInventoryArtifactSha256,
      binding.animationId,
    );
  }
  const compositeBindings = G5_L5_FOUR_PAGE_VERTICAL_SLICE_SOURCE_BINDINGS
    .filter((binding) => binding.behaviorCompositeContractId !== undefined);
  assert.deepEqual(
    compositeBindings.map(({animationId, behaviorCompositeContractId}) => [
      animationId,
      behaviorCompositeContractId,
    ]),
    [
      ["course-g05-l05-vb-012", "g5-l5-vb012-source-behavior-composite-v1"],
      ["course-g05-l05-ts-007", "g5-l5-ts007-source-behavior-composite-v1"],
      ["course-g05-l05-fq-003", "g5-l5-fq003-source-behavior-composite-v1"],
    ],
  );
  for (const binding of compositeBindings) {
    const behaviorIr = JSON.parse(
      projectFile(binding.behaviorCompositeIrArtifact!).toString("utf8"),
    );
    assert.equal(
      behaviorIr.artifactFingerprintSha256,
      binding.behaviorCompositeIrFingerprintSha256,
      binding.animationId,
    );
  }
});

test("VB012 preserves first/second wrong feedback and closes after correction", () => {
  let state = G5_L5_VB012_INITIAL_STATE;
  assert.equal(g5L5Vb012FrameForState(state, 20), 20);
  assert.equal(g5L5Vb012FrameForState(state, 120), 81);
  assert.equal(g5L5Vb012BehaviorCompositeStateForState(state, 20), "intro");
  assert.equal(
    g5L5Vb012BehaviorCompositeStateForState(state, 81),
    "question-idle",
  );
  assert.equal(
    G5_L5_VB012_BEHAVIOR_COMPOSITE_CONTRACT_ID,
    "g5-l5-vb012-source-behavior-composite-v1",
  );

  state = reduceG5L5Vb012(state, {type: "choose", choice: 1});
  assert.deepEqual(
    [state.attempts, state.feedback, state.controlsEnabled],
    [1, "wrong", false],
  );
  assert.equal(
    g5L5Vb012BehaviorCompositeStateForState(state, 81),
    "question-wrong-attempt1",
  );
  assert.equal(
    reduceG5L5Vb012(state, {type: "choose", choice: 2}),
    state,
    "disabled controls cannot record a second answer",
  );
  state = reduceG5L5Vb012(state, {type: "continue"});
  assert.deepEqual(
    [state.mode, state.feedback, state.controlsEnabled],
    ["question", "idle", true],
  );
  assert.equal(
    g5L5Vb012BehaviorCompositeStateForState(state, 81),
    "question-retry-attempt1",
  );
  state = reduceG5L5Vb012(state, {type: "choose", choice: 2});
  assert.deepEqual(
    [state.attempts, state.feedback, state.controlsEnabled],
    [2, "correct", false],
  );
  assert.equal(
    g5L5Vb012BehaviorCompositeStateForState(state, 81),
    "question-correct",
  );
  state = reduceG5L5Vb012(state, {type: "continue"});
  assert.equal(state.mode, "complete");
  assert.equal(g5L5Vb012FrameForState(state, 81), 196);
  assert.equal(g5L5Vb012BehaviorCompositeStateForState(state, 196), "complete");
  assert.equal(
    reduceG5L5Vb012(state, {type: "reset"}),
    G5_L5_VB012_INITIAL_STATE,
  );
});

test("TS007 traverses four source stops, help lock, two response cycles, and terminal", () => {
  assert.deepEqual(G5_L5_TS007_STOP_FRAMES, [245, 384, 510, 628, 671]);
  let state = G5_L5_TS007_INITIAL_STATE;
  assert.equal(g5L5Ts007FrameForState(state, 100), 100);
  assert.equal(g5L5Ts007BehaviorCompositeStateForState(state), "section-1");
  assert.equal(
    G5_L5_TS007_BEHAVIOR_COMPOSITE_CONTRACT_ID,
    "g5-l5-ts007-source-behavior-composite-v1",
  );
  state = reduceG5L5Ts007(state, {type: "advance"});
  assert.equal(g5L5Ts007FrameForState(state, 245), 384);
  assert.equal(g5L5Ts007BehaviorCompositeStateForState(state), "section-2-stop");
  state = reduceG5L5Ts007(state, {type: "advance"});
  assert.equal(state.sectionIndex, 2);
  state = reduceG5L5Ts007(state, {type: "reveal-explanation"});
  assert.equal(state.explanationVisible, true);
  assert.equal(
    g5L5Ts007BehaviorCompositeStateForState(state),
    "section-3-explanation",
  );
  state = reduceG5L5Ts007(state, {type: "advance"});
  assert.deepEqual([state.sectionIndex, state.explanationVisible], [3, false]);
  state = reduceG5L5Ts007(state, {type: "advance"});
  assert.equal(state.sectionIndex, 4);

  state = reduceG5L5Ts007(state, {type: "open-help"});
  assert.deepEqual([state.helpOpen, state.controlsEnabled], [true, false]);
  assert.equal(
    g5L5Ts007BehaviorCompositeStateForState(state),
    "question-help-open",
  );
  assert.equal(reduceG5L5Ts007(state, {type: "choose", choice: 2}), state);
  state = reduceG5L5Ts007(state, {type: "close-help"});
  assert.deepEqual([state.helpOpen, state.controlsEnabled], [false, true]);

  state = reduceG5L5Ts007(state, {type: "choose", choice: 1});
  assert.deepEqual([state.attempts, state.feedback], [1, "wrong"]);
  assert.equal(
    g5L5Ts007BehaviorCompositeStateForState(state),
    "question-wrong-attempt1",
  );
  state = reduceG5L5Ts007(state, {type: "continue-feedback"});
  assert.deepEqual([state.mode, state.controlsEnabled], ["sections", true]);
  state = reduceG5L5Ts007(state, {type: "choose", choice: 2});
  assert.deepEqual([state.attempts, state.feedback], [2, "correct"]);
  state = reduceG5L5Ts007(state, {type: "continue-feedback"});
  assert.equal(state.mode, "complete");
  assert.equal(g5L5Ts007FrameForState(state, 671), 690);
  assert.equal(g5L5Ts007BehaviorCompositeStateForState(state), "complete");
  assert.equal(
    reduceG5L5Ts007(state, {type: "reset"}),
    G5_L5_TS007_INITIAL_STATE,
  );
});

test("TS007 correct first response follows source right-feedback completion", () => {
  let state = G5_L5_TS007_INITIAL_STATE;
  for (let index = 0; index < 4; index += 1) {
    state = reduceG5L5Ts007(state, {type: "advance"});
  }
  state = reduceG5L5Ts007(state, {type: "choose", choice: 2});
  assert.deepEqual([state.attempts, state.feedback], [1, "correct"]);
  assert.equal(
    g5L5Ts007BehaviorCompositeStateForState(state),
    "question-correct",
  );
  state = reduceG5L5Ts007(state, {type: "continue-feedback"});
  assert.equal(state.mode, "complete");
});

test("FQ003 executes the exact 26-question sequence without legacy reporting", () => {
  const pcode = gunzipSync(projectFile(
    "migrations/course-g05-l05-fq-003/audit/machine/ffdec-scripts.txt.gz",
  )).toString("utf8");
  assert.match(
    pcode,
    /_global\.quizLabelArray = \["Q1","Q2".*"Q25","Q26"\];/,
  );
  assert.match(
    pcode,
    /_global\.arrayAnswer = \["A1Opt2","A2Opt4".*"A25Opt2","A26Opt2"\];/,
  );
  assert.equal(G5_L5_FQ003_CORRECT_OPTIONS.length, 26);

  let state = G5_L5_FQ003_INITIAL_STATE;
  assert.equal(g5L5Fq003BehaviorCompositeStateForState(state), "question-n1");
  for (const choice of G5_L5_FQ003_CORRECT_OPTIONS) {
    state = reduceG5L5Fq003(state, {type: "answer", choice});
  }
  assert.equal(state.mode, "result");
  assert.equal(state.responses.length, 26);
  assert.equal(state.reportingDisposition, "blocked-memory-only");
  assert.equal(getG5L5Fq003CorrectCount(state), 26);
  assert.equal(getG5L5Fq003Grade(26), "Advanced");
  assert.equal(g5L5Fq003FrameForState(state), 45);
  assert.equal(g5L5Fq003BehaviorCompositeStateForState(state), "result-score26");
  assert.equal(
    G5_L5_FQ003_BEHAVIOR_COMPOSITE_CONTRACT_ID,
    "g5-l5-fq003-source-behavior-composite-v1",
  );

  state = reduceG5L5Fq003(state, {type: "start-review"});
  assert.equal(g5L5Fq003FrameForState(state), 46);
  assert.equal(g5L5Fq003BehaviorCompositeStateForState(state), "review-q1-selected2");
  for (let index = 0; index < 26; index += 1) {
    state = reduceG5L5Fq003(state, {type: "next-review"});
  }
  assert.deepEqual(
    [state.mode, state.reviewComplete, state.reportingDisposition],
    ["result", true, "blocked-memory-only"],
  );
  assert.equal(
    reduceG5L5Fq003(state, {type: "reset"}),
    G5_L5_FQ003_INITIAL_STATE,
  );
});

test("FQ003 source grade thresholds stay exact even though the quiz has 26 items", () => {
  assert.equal(getG5L5Fq003Grade(0), "Unsatisfactory");
  assert.equal(getG5L5Fq003Grade(3), "Unsatisfactory");
  assert.equal(getG5L5Fq003Grade(4), "Partially Proficient");
  assert.equal(getG5L5Fq003Grade(6), "Partially Proficient");
  assert.equal(getG5L5Fq003Grade(7), "Proficient");
  assert.equal(getG5L5Fq003Grade(8), "Proficient");
  assert.equal(getG5L5Fq003Grade(9), "Advanced");
});
