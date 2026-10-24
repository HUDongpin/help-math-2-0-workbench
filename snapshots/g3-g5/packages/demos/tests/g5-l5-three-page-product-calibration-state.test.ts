import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFileSync} from "node:fs";
import test from "node:test";
import {gunzipSync} from "node:zlib";

import {
  G5_L5_FQ002_ADMINISTERED_QUESTION_COUNT,
  G5_L5_FQ002_BEHAVIOR_COMPOSITE_CONTRACT_ID,
  G5_L5_FQ002_CORRECT_OPTIONS,
  G5_L5_FQ002_DEFAULT_SEED,
  G5_L5_FQ002_INITIAL_STATE,
  G5_L5_FQ002_RANDOMIZATION_DISPOSITION,
  G5_L5_FQ002_SOURCE_ANSWER_ARRAY,
  G5_L5_THREE_PAGE_PRODUCT_CALIBRATION_SOURCE_BINDINGS,
  G5_L5_TS008_BEHAVIOR_COMPOSITE_CONTRACT_ID,
  G5_L5_TS008_INITIAL_STATE,
  G5_L5_TS008_STOP_FRAMES,
  G5_L5_VB013_BEHAVIOR_COMPOSITE_CONTRACT_ID,
  G5_L5_VB013_INITIAL_STATE,
  G5_L5_VB013_WRONG_FEEDBACK,
  createG5L5Fq002InitialState,
  createG5L5Fq002QuestionOrder,
  g5L5Fq002BehaviorCompositeStateForState,
  g5L5Fq002FrameForState,
  g5L5Ts008BehaviorCompositeStateForState,
  g5L5Ts008FrameForState,
  g5L5Vb013BehaviorCompositeStateForState,
  g5L5Vb013FrameForState,
  getG5L5Fq002Grade,
  reduceG5L5Fq002,
  reduceG5L5Ts008,
  reduceG5L5Vb013,
  type G5L5Fq002Action,
  type G5L5Ts008Action,
  type G5L5Ts008State,
  type G5L5Vb013Action,
  type G5L5Vb013State,
} from "../src/g5-l5-three-page-product-calibration-state";

function projectFile(relativePath: string): Buffer {
  return readFileSync(new URL(`../../../${relativePath}`, import.meta.url));
}

function sha256(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function assertRecursivelyFrozen(value: unknown, label = "state"): void {
  if (value === null || typeof value !== "object") return;
  assert.equal(Object.isFrozen(value), true, label);
  for (const [key, nested] of Object.entries(value)) {
    assertRecursivelyFrozen(nested, `${label}.${key}`);
  }
}

function pcode(animationId: string): string {
  return gunzipSync(projectFile(
    `migrations/${animationId}/audit/machine/ffdec-scripts.txt.gz`,
  )).toString("utf8");
}

function sourceArray(source: string, variable: string): readonly string[] {
  const match = source.match(new RegExp(
    `_global\\.${variable} = (\\[[^;]+\\]);`,
  ));
  assert.ok(match, `${variable} must exist in the FFDec bundle`);
  return JSON.parse(match[1]!);
}

function frozenVb013State(
  overrides: Readonly<Record<string, unknown>>,
): G5L5Vb013State {
  return Object.freeze({
    ...G5_L5_VB013_INITIAL_STATE,
    ...overrides,
  }) as unknown as G5L5Vb013State;
}

function assertVb013StateRejected(
  state: G5L5Vb013State,
  expected: RegExp,
): void {
  assert.throws(
    () => reduceG5L5Vb013(state, {type: "reset"}),
    expected,
    "VB013 reducer must reject a forged state",
  );
  assert.throws(
    () => g5L5Vb013FrameForState(state, 92),
    expected,
    "VB013 frame resolver must reject a forged state",
  );
  assert.throws(
    () => g5L5Vb013BehaviorCompositeStateForState(state, 92),
    expected,
    "VB013 composite resolver must reject a forged state",
  );
}

function frozenTs008State(
  overrides: Readonly<Record<string, unknown>>,
): G5L5Ts008State {
  return Object.freeze({
    ...G5_L5_TS008_INITIAL_STATE,
    ...overrides,
  }) as unknown as G5L5Ts008State;
}

function assertTs008StateRejected(
  state: G5L5Ts008State,
  expected: RegExp,
): void {
  assert.throws(
    () => reduceG5L5Ts008(state, {type: "reset"}),
    expected,
    "TS008 reducer must reject a forged state",
  );
  assert.throws(
    () => g5L5Ts008FrameForState(state, 247),
    expected,
    "TS008 frame resolver must reject a forged state",
  );
  assert.throws(
    () => g5L5Ts008BehaviorCompositeStateForState(state),
    expected,
    "TS008 composite resolver must reject a forged state",
  );
}

test("three-page contracts bind exact SWF, frame, FFDec, and scenario bytes", () => {
  assert.deepEqual(
    G5_L5_THREE_PAGE_PRODUCT_CALIBRATION_SOURCE_BINDINGS.map((binding) => [
      binding.animationId,
      binding.kind,
      binding.sourceFrameDomain,
      binding.sourceFrameCount,
      binding.initialProductStopFrame,
      binding.terminalProductFrame,
      binding.userEventPcodeFileCount,
      binding.behaviorCompositeContractId,
    ]),
    [
      [
        "course-g05-l05-vb-013",
        "fixed-choice",
        "sprite-225",
        201,
        92,
        201,
        3,
        "g5-l5-vb013-source-behavior-composite-v1",
      ],
      [
        "course-g05-l05-ts-008",
        "multi-section",
        "sprite-347",
        690,
        247,
        690,
        34,
        "g5-l5-ts008-source-behavior-composite-v1",
      ],
      [
        "course-g05-l05-fq-002",
        "randomized-final-quiz",
        "sprite-830",
        72,
        2,
        45,
        109,
        "g5-l5-fq002-source-behavior-composite-v1",
      ],
    ],
  );
  for (const binding of G5_L5_THREE_PAGE_PRODUCT_CALIBRATION_SOURCE_BINDINGS) {
    assert.equal(
      sha256(projectFile(binding.sourceSwfArtifact)),
      binding.sourceSwfSha256,
      `${binding.animationId} SWF`,
    );
    assert.equal(
      sha256(projectFile(binding.frameDomainArtifact)),
      binding.frameDomainArtifactSha256,
      `${binding.animationId} frame disposition`,
    );
    assert.equal(
      sha256(projectFile(binding.ffdecScriptsArtifact)),
      binding.ffdecScriptsArtifactSha256,
      `${binding.animationId} FFDec scripts`,
    );
    assert.equal(
      sha256(projectFile(binding.scenarioInventoryArtifact)),
      binding.scenarioInventoryArtifactSha256,
      `${binding.animationId} scenario inventory`,
    );
    const frameDisposition = JSON.parse(
      projectFile(binding.frameDomainArtifact).toString("utf8"),
    );
    const scenario = JSON.parse(
      projectFile(binding.scenarioInventoryArtifact).toString("utf8"),
    );
    assert.equal(frameDisposition.animationId, binding.animationId);
    assert.equal(scenario.animationId, binding.animationId);
    assert.equal(scenario.source.swfSha256, binding.sourceSwfSha256);
    assert.equal(
      frameDisposition.summary.highRiskIndependentCandidates[0].timelineId,
      binding.sourceFrameDomain,
    );
    assert.equal(
      frameDisposition.summary.highRiskIndependentCandidates[0].frameCount,
      binding.sourceFrameCount,
    );
  }
  assertRecursivelyFrozen(
    G5_L5_THREE_PAGE_PRODUCT_CALIBRATION_SOURCE_BINDINGS,
    "source bindings",
  );
  assert.equal(
    G5_L5_VB013_BEHAVIOR_COMPOSITE_CONTRACT_ID,
    "g5-l5-vb013-source-behavior-composite-v1",
  );
  assert.equal(
    G5_L5_TS008_BEHAVIOR_COMPOSITE_CONTRACT_ID,
    "g5-l5-ts008-source-behavior-composite-v1",
  );
  assert.equal(
    G5_L5_FQ002_BEHAVIOR_COMPOSITE_CONTRACT_ID,
    "g5-l5-fq002-source-behavior-composite-v1",
  );
});

test("source P-code locks VB013, TS008, and FQ002 behavior obligations", () => {
  const vb013 = pcode("course-g05-l05-vb-013");
  assert.match(vb013, /DefineSprite_225\/frame_92\/DoAction\.as/);
  assert.match(vb013, /DefineSprite_225\/frame_201\/DoAction\.as/);
  assert.match(vb013, /_global\.quizTryCount == 1/);
  assert.match(vb013, /negative two is positive two\..*Try again\./);
  assert.match(vb013, /_root\.showRightFeed\(\)/);
  assert.match(vb013, /_root\.showWrongFeed\(\)/);
  assert.deepEqual(
    G5_L5_VB013_WRONG_FEEDBACK.map((value) => value.endsWith("Try again.")),
    [true, false],
  );

  const ts008 = pcode("course-g05-l05-ts-008");
  for (const frame of [...G5_L5_TS008_STOP_FRAMES, 690]) {
    assert.match(ts008, new RegExp(`DefineSprite_347/frame_${frame}/DoAction\\.as`));
  }
  assert.match(ts008, /Mc_box1\._visible = true/);
  assert.match(ts008, /Mc_box2\._visible = true/);
  assert.match(ts008, /Mc_Popup\._visible = true/);
  assert.match(ts008, /_global\.quizTryCount >= 2/);
  assert.match(ts008, /_root\.showRightFeed\(\)/);
  assert.match(ts008, /_root\.showWrongFeed\(\)/);

  const fq002 = pcode("course-g05-l05-fq-002");
  const fq003 = pcode("course-g05-l05-fq-003");
  const fq002Answers = sourceArray(fq002, "arrayAnswer");
  const fq003Answers = sourceArray(fq003, "arrayAnswer");
  assert.deepEqual(fq002Answers, G5_L5_FQ002_SOURCE_ANSWER_ARRAY);
  assert.deepEqual(fq003Answers, G5_L5_FQ002_SOURCE_ANSWER_ARRAY);
  assert.deepEqual(fq002Answers, fq003Answers);
  assert.deepEqual(
    fq002Answers.map((answer) => Number(answer.match(/Opt([1-4])$/)![1])),
    G5_L5_FQ002_CORRECT_OPTIONS,
  );
  assert.equal(sourceArray(fq002, "quizLabelArray").length, 26);
  assert.match(fq002, /_global\.totalQuestionsCount = 10/);
  assert.match(fq002, /random\(_global\.quizLabelArray\.length\)/);
  assert.match(fq002, /_global\.quizLabelArray\.splice\(_global\.tempQNo,1\)/);
  assert.match(fq002, /getURL\(strURL,""\)/);
  assert.match(fq002, /Send_Quiz_Report_Mc\.gotoAndPlay\(2\)/);
  assert.equal(
    G5_L5_FQ002_RANDOMIZATION_DISPOSITION,
    "deterministic-mulberry32-product-seed-not-avm1-random-parity",
  );
});

test("VB013 preserves first and second wrong branches, terminal, and Replay", () => {
  let state = G5_L5_VB013_INITIAL_STATE;
  assertRecursivelyFrozen(state);
  assert.equal(g5L5Vb013FrameForState(state, 20), 20);
  assert.equal(g5L5Vb013FrameForState(state, 150), 92);
  assert.equal(g5L5Vb013BehaviorCompositeStateForState(state, 20), "intro");
  assert.equal(g5L5Vb013BehaviorCompositeStateForState(state, 92), "question-idle");

  state = reduceG5L5Vb013(state, {type: "choose", choice: 1});
  assert.deepEqual(
    [state.attempts, state.feedback, state.controlsEnabled],
    [1, "wrong-attempt1", false],
  );
  assertRecursivelyFrozen(state);
  assert.equal(
    reduceG5L5Vb013(state, {type: "choose", choice: 2}),
    state,
    "feedback lock must reject another choice",
  );
  state = reduceG5L5Vb013(state, {type: "continue-feedback"});
  assert.deepEqual(
    [state.mode, state.attempts, state.feedback, state.controlsEnabled],
    ["question", 1, "idle", true],
  );
  assert.equal(
    g5L5Vb013BehaviorCompositeStateForState(state, 92),
    "question-retry-attempt1",
  );
  state = reduceG5L5Vb013(state, {type: "choose", choice: 1});
  assert.equal(state.feedback, "wrong-attempt2");
  state = reduceG5L5Vb013(state, {type: "continue-feedback"});
  assert.deepEqual(
    [state.mode, state.attempts, state.feedback, state.controlsEnabled],
    ["complete", 2, "idle", false],
  );
  assert.equal(g5L5Vb013FrameForState(state, 92), 201);
  assert.equal(g5L5Vb013BehaviorCompositeStateForState(state, 201), "complete");
  state = reduceG5L5Vb013(state, {type: "reset"});
  assert.equal(state, G5_L5_VB013_INITIAL_STATE);
  assertRecursivelyFrozen(state);
});

test("VB013 correct choice closes on feedback continuation and invalid input fails closed", () => {
  let state = reduceG5L5Vb013(
    G5_L5_VB013_INITIAL_STATE,
    {type: "choose", choice: 2},
  );
  assert.deepEqual([state.attempts, state.feedback], [1, "correct"]);
  state = reduceG5L5Vb013(state, {type: "continue-feedback"});
  assert.equal(state.mode, "complete");
  assert.throws(
    () => reduceG5L5Vb013(
      G5_L5_VB013_INITIAL_STATE,
      {type: "choose", choice: 3} as unknown as G5L5Vb013Action,
    ),
    /VB013 choice/u,
  );
  assert.throws(
    () => reduceG5L5Vb013(
      G5_L5_VB013_INITIAL_STATE,
      {type: "unknown"} as unknown as G5L5Vb013Action,
    ),
    /unsupported/u,
  );
});

test("VB013 rejects exact-key, value, cross-field, and frozen-state mutations at every entry", () => {
  const mutations: readonly [G5L5Vb013State, RegExp][] = [
    [frozenVb013State({mode: "result"}), /unsupported mode/u],
    [frozenVb013State({attempts: 3}), /VB013 attempts/u],
    [frozenVb013State({feedback: "unexpected"}), /VB013 feedback/u],
    [
      frozenVb013State({
        attempts: 1,
        feedback: "correct",
        controlsEnabled: true,
      }),
      /feedback and controls/u,
    ],
    [
      frozenVb013State({
        mode: "complete",
        attempts: 0,
        controlsEnabled: false,
      }),
      /complete state/u,
    ],
    [frozenVb013State({unexpected: true}), /missing or unexpected fields/u],
    [
      {...G5_L5_VB013_INITIAL_STATE} as G5L5Vb013State,
      /must be deeply frozen/u,
    ],
  ];
  for (const [state, expected] of mutations) {
    assertVb013StateRejected(state, expected);
  }
});

test("TS008 traverses exact stops, explanation reveals, help lock, and terminal", () => {
  assert.deepEqual(G5_L5_TS008_STOP_FRAMES, [247, 385, 512, 627, 671]);
  let state = G5_L5_TS008_INITIAL_STATE;
  assert.equal(g5L5Ts008FrameForState(state, 100), 100);
  state = reduceG5L5Ts008(state, {type: "advance"});
  assert.equal(g5L5Ts008FrameForState(state, 247), 385);
  state = reduceG5L5Ts008(state, {type: "advance"});
  state = reduceG5L5Ts008(state, {type: "reveal-explanation"});
  assert.equal(state.explanationVisible, true);
  assert.equal(
    g5L5Ts008BehaviorCompositeStateForState(state),
    "section-3-explanation",
  );
  state = reduceG5L5Ts008(state, {type: "advance"});
  assert.equal(state.explanationVisible, false);
  state = reduceG5L5Ts008(state, {type: "reveal-explanation"});
  assert.equal(
    g5L5Ts008BehaviorCompositeStateForState(state),
    "section-4-explanation",
  );
  state = reduceG5L5Ts008(state, {type: "advance"});
  assert.equal(state.sectionIndex, 4);

  state = reduceG5L5Ts008(state, {type: "open-help"});
  assert.deepEqual([state.helpOpen, state.controlsEnabled], [true, false]);
  assert.equal(g5L5Ts008BehaviorCompositeStateForState(state), "question-help-open");
  assert.equal(reduceG5L5Ts008(state, {type: "choose", choice: 2}), state);
  state = reduceG5L5Ts008(state, {type: "close-help"});
  assert.deepEqual([state.helpOpen, state.controlsEnabled], [false, true]);

  state = reduceG5L5Ts008(state, {type: "choose", choice: 1});
  assert.equal(state.feedback, "wrong-attempt1");
  state = reduceG5L5Ts008(state, {type: "continue-feedback"});
  assert.deepEqual([state.attempts, state.feedback], [1, "idle"]);
  state = reduceG5L5Ts008(state, {type: "choose", choice: 2});
  assert.equal(state.feedback, "correct");
  state = reduceG5L5Ts008(state, {type: "continue-feedback"});
  assert.equal(state.mode, "complete");
  assert.equal(g5L5Ts008FrameForState(state, 671), 690);
  assert.equal(g5L5Ts008BehaviorCompositeStateForState(state), "complete");
  assertRecursivelyFrozen(state);
  assert.equal(
    reduceG5L5Ts008(state, {type: "reset"}),
    G5_L5_TS008_INITIAL_STATE,
  );
});

test("TS008 second wrong completes and unknown or malformed actions fail closed", () => {
  let state = G5_L5_TS008_INITIAL_STATE;
  for (let index = 0; index < 4; index += 1) {
    state = reduceG5L5Ts008(state, {type: "advance"});
  }
  state = reduceG5L5Ts008(state, {type: "choose", choice: 4});
  state = reduceG5L5Ts008(state, {type: "continue-feedback"});
  state = reduceG5L5Ts008(state, {type: "choose", choice: 3});
  assert.equal(state.feedback, "wrong-attempt2");
  state = reduceG5L5Ts008(state, {type: "continue-feedback"});
  assert.equal(state.mode, "complete");
  assert.throws(
    () => reduceG5L5Ts008(
      G5_L5_TS008_INITIAL_STATE,
      {type: "choose", choice: 5} as unknown as G5L5Ts008Action,
    ),
    /TS008 choice/u,
  );
  assert.throws(
    () => reduceG5L5Ts008(
      G5_L5_TS008_INITIAL_STATE,
      {type: "unknown"} as unknown as G5L5Ts008Action,
    ),
    /unsupported/u,
  );
});

test("TS008 rejects mode, attempt, section, help, cross-field, and frozen mutations at every entry", () => {
  const mutations: readonly [G5L5Ts008State, RegExp][] = [
    [frozenTs008State({mode: "question"}), /unsupported mode/u],
    [frozenTs008State({attempts: 3}), /TS008 attempts/u],
    [frozenTs008State({feedback: "unexpected"}), /TS008 feedback/u],
    [frozenTs008State({sectionIndex: 5}), /TS008 sectionIndex/u],
    [
      frozenTs008State({
        sectionIndex: 4,
        attempts: 1,
        feedback: "correct",
        controlsEnabled: true,
      }),
      /feedback and controls/u,
    ],
    [
      frozenTs008State({controlsEnabled: false, helpOpen: true}),
      /pre-question section state/u,
    ],
    [
      frozenTs008State({sectionIndex: 1, explanationVisible: true}),
      /explanation is not allowed/u,
    ],
    [frozenTs008State({unexpected: true}), /missing or unexpected fields/u],
    [
      {...G5_L5_TS008_INITIAL_STATE} as G5L5Ts008State,
      /must be deeply frozen/u,
    ],
  ];
  for (const [state, expected] of mutations) {
    assertTs008StateRejected(state, expected);
  }
});

test("FQ002 selects a deterministic unique 10-of-26 product order", () => {
  assert.equal(G5_L5_FQ002_ADMINISTERED_QUESTION_COUNT, 10);
  assert.equal(G5_L5_FQ002_DEFAULT_SEED, 5002);
  const first = createG5L5Fq002QuestionOrder(5002);
  const second = createG5L5Fq002QuestionOrder(5002);
  assert.deepEqual(first, [19, 7, 3, 16, 1, 23, 26, 24, 15, 11]);
  assert.deepEqual(second, first);
  assert.equal(new Set(first).size, 10);
  assert.notDeepEqual(createG5L5Fq002QuestionOrder(0), first);
  assertRecursivelyFrozen(first, "FQ002 question order");
  assert.throws(() => createG5L5Fq002QuestionOrder(-1), /FQ002 seed/u);
  assert.throws(
    () => createG5L5Fq002QuestionOrder(0x1_0000_0000),
    /FQ002 seed/u,
  );
});

test("FQ002 records responses, score, grade, result, review, and memory-only report", () => {
  let state = createG5L5Fq002InitialState(5002);
  assert.deepEqual(state, G5_L5_FQ002_INITIAL_STATE);
  assert.equal(state.randomizationDisposition, G5_L5_FQ002_RANDOMIZATION_DISPOSITION);
  assert.equal(state.host.reportingDisposition, "blocked-memory-only");
  assert.equal(state.host.networkRequestCount, 0);
  assert.equal(state.host.memoryReport, null);
  assert.equal(state.audio.enabled, false);
  assert.equal(state.audio.activeCue, null);
  assert.equal(g5L5Fq002FrameForState(state), state.questionOrder[0]! + 1);
  assert.equal(
    g5L5Fq002BehaviorCompositeStateForState(state),
    `question-q${state.questionOrder[0]}-position1`,
  );

  for (const questionNumber of state.questionOrder) {
    const choice = G5_L5_FQ002_CORRECT_OPTIONS[questionNumber - 1]!;
    state = reduceG5L5Fq002(state, {type: "answer", choice});
    assertRecursivelyFrozen(state);
  }
  assert.deepEqual(
    [state.mode, state.responses.length, state.score, state.grade],
    ["result", 10, 10, "Advanced"],
  );
  assert.equal(g5L5Fq002FrameForState(state), 45);
  assert.equal(g5L5Fq002BehaviorCompositeStateForState(state), "result-score10");
  assert.deepEqual(state.host.memoryReport, {
    total: 10,
    correct: 10,
    wrong: 0,
    grade: "Advanced",
  });
  assert.equal(state.host.networkRequestCount, 0);

  state = reduceG5L5Fq002(state, {type: "start-review"});
  assert.equal(state.mode, "review");
  assert.equal(g5L5Fq002FrameForState(state), state.questionOrder[0]! + 45);
  assert.match(
    g5L5Fq002BehaviorCompositeStateForState(state),
    /^review-q\d+-position1-selected[1-4]$/u,
  );
  for (let index = 0; index < 10; index += 1) {
    state = reduceG5L5Fq002(state, {type: "next-review"});
  }
  assert.deepEqual(
    [state.mode, state.reviewComplete, state.host.networkRequestCount],
    ["result", true, 0],
  );

  const replay = reduceG5L5Fq002(state, {type: "reset"});
  assert.deepEqual(replay, createG5L5Fq002InitialState(5002));
  assert.deepEqual(replay.questionOrder, [19, 7, 3, 16, 1, 23, 26, 24, 15, 11]);
  assert.deepEqual(
    [
      replay.responses.length,
      replay.score,
      replay.grade,
      replay.reviewPosition,
      replay.reviewComplete,
      replay.host.memoryReport,
      replay.host.networkRequestCount,
      replay.audio.activeCue,
    ],
    [0, 0, null, 0, false, null, 0, null],
  );
  assertRecursivelyFrozen(replay);

  const reseededReplay = reduceG5L5Fq002(state, {type: "reset", seed: 0});
  assert.equal(reseededReplay.seed, 0);
  assert.deepEqual(
    reseededReplay.questionOrder,
    [7, 1, 8, 5, 15, 17, 19, 20, 13, 16],
  );
  assert.notDeepEqual(reseededReplay.questionOrder, state.questionOrder);
  assert.deepEqual(
    [
      reseededReplay.mode,
      reseededReplay.responses.length,
      reseededReplay.score,
      reseededReplay.grade,
      reseededReplay.reviewPosition,
      reseededReplay.reviewComplete,
      reseededReplay.host.memoryReport,
      reseededReplay.host.networkRequestCount,
      reseededReplay.audio.enabled,
      reseededReplay.audio.activeCue,
    ],
    ["question", 0, 0, null, 0, false, null, 0, false, null],
  );
  assertRecursivelyFrozen(reseededReplay);
});

test("FQ002 source grade thresholds and fail-closed action boundary stay exact", () => {
  assert.equal(getG5L5Fq002Grade(0), "Unsatisfactory");
  assert.equal(getG5L5Fq002Grade(3), "Unsatisfactory");
  assert.equal(getG5L5Fq002Grade(4), "Partially Proficient");
  assert.equal(getG5L5Fq002Grade(6), "Partially Proficient");
  assert.equal(getG5L5Fq002Grade(7), "Proficient");
  assert.equal(getG5L5Fq002Grade(8), "Proficient");
  assert.equal(getG5L5Fq002Grade(9), "Advanced");
  assert.equal(getG5L5Fq002Grade(10), "Advanced");
  assert.throws(() => getG5L5Fq002Grade(11), /correct count/u);

  const initial = createG5L5Fq002InitialState(5002);
  assert.equal(
    reduceG5L5Fq002(initial, {type: "start-review"}),
    initial,
    "review cannot start before ten responses",
  );
  assert.throws(
    () => reduceG5L5Fq002(
      initial,
      {type: "answer", choice: 5} as unknown as G5L5Fq002Action,
    ),
    /answer choice/u,
  );
  assert.throws(
    () => reduceG5L5Fq002(
      initial,
      {type: "unknown"} as unknown as G5L5Fq002Action,
    ),
    /unsupported/u,
  );
  assert.throws(
    () => reduceG5L5Fq002(initial, {type: "reset", seed: -1}),
    /FQ002 seed/u,
  );
  const forged = Object.freeze({...initial, score: 99});
  assert.throws(
    () => g5L5Fq002FrameForState(forged),
    /score drifted/u,
  );
  assert.throws(
    () => g5L5Fq002BehaviorCompositeStateForState(forged),
    /score drifted/u,
  );
});
