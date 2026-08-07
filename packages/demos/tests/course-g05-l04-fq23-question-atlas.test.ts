import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import test from "node:test";
import {fileURLToPath} from "node:url";
import {gunzipSync} from "node:zlib";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";

import {
  G5_L4_FQ23_ATLAS_FRAME_DOMAIN,
  G5_L4_FQ23_SCENARIO,
  G5_L4_FQ23_SOURCE_FRAME_DOMAIN,
} from "../src/g5-l4-fq23-question-atlas-candidate";
import fq002, {
  COURSE_G05_L04_FQ_002_MOVIE,
  COURSE_G05_L04_FQ_002_RUNTIME,
  COURSE_G05_L04_FQ_002_SOURCE,
  COURSE_G05_L04_FQ_002_SOURCE_CONTRACT,
  getCourseG05L04Fq002FrameState,
} from "../src/modules/course-g05-l04-fq-002";
import fq003, {
  COURSE_G05_L04_FQ_003_MOVIE,
  COURSE_G05_L04_FQ_003_RUNTIME,
  COURSE_G05_L04_FQ_003_SOURCE,
  COURSE_G05_L04_FQ_003_SOURCE_CONTRACT,
  getCourseG05L04Fq003FrameState,
} from "../src/modules/course-g05-l04-fq-003";
import {
  COURSE_G05_L04_FQ_002_ACCEPTANCE_EFFECTS,
  COURSE_G05_L04_FQ_002_CONFIG,
} from "../src/timelines/course-g05-l04-fq-002";
import {
  COURSE_G05_L04_FQ_003_ACCEPTANCE_EFFECTS,
  COURSE_G05_L04_FQ_003_CONFIG,
} from "../src/timelines/course-g05-l04-fq-003";
import {
  G5_L4_FQ23_CORRECT_OPTIONS,
  G5_L4_FQ23_SOURCE_SCRIPT_EVIDENCE,
  buildG5L4Fq23QuestionOrder,
  createG5L4Fq23QuestionSequenceState,
  getG5L4Fq23ActiveQuestionNumber,
  getG5L4Fq23ActiveReviewResponse,
  gradeG5L4Fq23Score,
  reduceG5L4Fq23QuestionSequence,
  type G5L4Fq23AnswerOption,
  type G5L4Fq23QuestionSequenceState,
} from "../src/timelines/course-g05-l04-fq23-question-sequence";

const ROOT = fileURLToPath(new URL("../../../", import.meta.url));
const rendererSourceUrl = new URL(
  "../src/g5-l4-fq23-question-atlas-candidate.tsx",
  import.meta.url,
);
const sha256 = (bytes: Uint8Array) =>
  createHash("sha256").update(bytes).digest("hex");
const cases = [
  {
    id: "course-g05-l04-fq-002",
    module: fq002,
    movie: COURSE_G05_L04_FQ_002_MOVIE,
    runtime: COURSE_G05_L04_FQ_002_RUNTIME,
    source: COURSE_G05_L04_FQ_002_SOURCE,
    sourceContract: COURSE_G05_L04_FQ_002_SOURCE_CONTRACT,
    config: COURSE_G05_L04_FQ_002_CONFIG,
    acceptance: COURSE_G05_L04_FQ_002_ACCEPTANCE_EFFECTS,
    getFrameState: getCourseG05L04Fq002FrameState,
    selectionKind: "random-without-replacement",
    presentedQuestionCount: 10,
  },
  {
    id: "course-g05-l04-fq-003",
    module: fq003,
    movie: COURSE_G05_L04_FQ_003_MOVIE,
    runtime: COURSE_G05_L04_FQ_003_RUNTIME,
    source: COURSE_G05_L04_FQ_003_SOURCE,
    sourceContract: COURSE_G05_L04_FQ_003_SOURCE_CONTRACT,
    config: COURSE_G05_L04_FQ_003_CONFIG,
    acceptance: COURSE_G05_L04_FQ_003_ACCEPTANCE_EFFECTS,
    getFrameState: getCourseG05L04Fq003FrameState,
    selectionKind: "sequential",
    presentedQuestionCount: 18,
  },
] as const;

function readyContext(seed = 0) {
  return {
    frameDomain: G5_L4_FQ23_ATLAS_FRAME_DOMAIN,
    scenario: G5_L4_FQ23_SCENARIO,
    lang: "en" as const,
    seed,
    requirementId: "req-fq23-atlas",
    traceId: "trace-fq23-atlas",
    entryStateSha256: "a".repeat(64),
  };
}

test("FQ002/FQ003 modules preserve root metadata and the derived atlas boundary", async () => {
  for (const item of cases) {
    assert.equal(item.module.key, item.id);
    assert.deepEqual(item.movie.stage, {width: 800, height: 600});
    assert.equal(item.movie.fps, 12);
    assert.equal(item.movie.frameCount, 18);
    assert.equal(item.movie.durationMs, 1_500);
    assert.equal(item.runtime.frameCount, 10);
    assert.equal(item.runtime.defaultFrameDomain, G5_L4_FQ23_ATLAS_FRAME_DOMAIN);
    assert.deepEqual(item.runtime.frameDomains, [{
      id: G5_L4_FQ23_ATLAS_FRAME_DOMAIN,
      frameCount: 18,
      fps: 12,
      rootFrame: 6,
    }]);
    assert.equal(item.module.playbackMode, "once");
    assert.equal(item.module.playbackEndFrame, 1);
    assert.deepEqual(item.module.playbackEndFrameByDomain, {
      root: 1,
      [G5_L4_FQ23_ATLAS_FRAME_DOMAIN]: 1,
    });
    assert.equal(item.module.transport?.mode, "visual-frame-inspector");
    assert.equal(item.module.transport?.legacyBehaviorParity, false);
    assert.equal(item.module.transport?.strictAcceptanceEffect, "none");
    assert.equal(item.module.maturity, "legacy-prototype");
    assert.deepEqual(item.module.audioCues, []);
    assert.equal(item.sourceContract.livePlaybackEndFrame, 1);
    assert.equal(item.sourceContract.sequentialPlaybackPermitted, false);
    assert.equal(item.sourceContract.sourceSelection.kind, item.selectionKind);
    assert.equal(
      item.sourceContract.sourceSelection.sourcePresentedQuestionCount,
      item.presentedQuestionCount,
    );
    assert.equal(item.sourceContract.sourceSelection.executedByCandidate, false);
    assert.equal(
      item.sourceContract.currentJavascriptBehavior.questionSequenceEnabled,
      true,
    );
    assert.equal(
      item.sourceContract.currentJavascriptBehavior.answerSubmissionEnabled,
      true,
    );
    assert.equal(
      item.sourceContract.currentJavascriptBehavior.scoringEnabled,
      true,
    );
    assert.equal(
      item.sourceContract.currentJavascriptBehavior.textReviewEnabled,
      true,
    );
    assert.equal(
      item.sourceContract.currentJavascriptBehavior.replayResetEnabled,
      true,
    );
    assert.equal(
      item.sourceContract.currentJavascriptBehavior.executesLegacyActionScript,
      false,
    );
    assert.equal(item.sourceContract.strictAcceptanceEffect, "none");
    assert.ok(Object.values(item.acceptance).every((value) => value === false));
    assert.ok(
      Object.values(item.sourceContract.acceptanceEffects)
        .every((value) => value === false),
    );

    for (const [sourcePath, expectedHash] of [
      [item.source.swf, item.source.swfSha256],
      [item.source.fla, item.source.flaSha256],
      [`public${item.config.asset.source}`, item.config.asset.sha256],
    ] as const) {
      assert.equal(sha256(await readFile(`${ROOT}${sourcePath}`)), expectedHash);
    }
  }
});

test("each module maps all 18 public pages to source Q1..Q18 drawings", () => {
  for (const item of cases) {
    for (let frame = 1; frame <= 18; frame += 1) {
      const state = item.getFrameState(frame, readyContext(frame));
      assert.equal(state.status, "ready");
      assert.equal(state.blocker, null);
      assert.equal(state.frame, frame);
      assert.equal(state.frameDomain, G5_L4_FQ23_ATLAS_FRAME_DOMAIN);
      assert.equal(state.sourceFrame, frame + 1);
      assert.equal(state.sourceExportFrame, frame);
      assert.equal(state.sourceFrameDomain, G5_L4_FQ23_SOURCE_FRAME_DOMAIN);
      assert.equal(state.rootFrame, 6);
      assert.equal(state.questionLabel, `Q${frame}`);
      assert.equal(state.sourceStaticQuestionDrawingReady, true);
      assert.equal(state.sourceSelectionKind, item.selectionKind);
      assert.equal(state.sourcePresentedQuestionCount, item.presentedQuestionCount);
      assert.equal(state.livePlaybackEndFrame, 1);
      assert.equal(state.sequentialPlaybackPermitted, false);
      for (const disabled of [
        state.legacyActionScriptExecuted,
        state.naturalQuestionSelectionEnabled,
        state.answerControlsEnabled,
        state.scoringEnabled,
        state.reviewEnabled,
        state.audioRendered,
        state.timingEnabled,
        state.reportingNetworkEnabled,
        state.sourceReplayEstablished,
        state.naturalRuntimeEstablished,
      ]) assert.equal(disabled, false);
      assert.equal(state.currentJavascriptQuestionSequenceEnabled, true);
      assert.equal(state.currentJavascriptAnswerSubmissionEnabled, true);
      assert.equal(state.currentJavascriptScoringEnabled, true);
      assert.equal(state.currentJavascriptTextReviewEnabled, true);
      assert.equal(state.currentJavascriptReplayResetEnabled, true);
      assert.equal(state.exactAvm1RandomOrderEstablished, false);
      assert.equal(state.sourceReviewVisualParityEstablished, false);
    }
  }
});

test("module requests outside the public English atlas fail closed", () => {
  const blocked = [
    {frame: 1, context: {...readyContext(), frameDomain: "root"}, reason: "root-domain-disabled"},
    {frame: 1, context: {...readyContext(), frameDomain: G5_L4_FQ23_SOURCE_FRAME_DOMAIN}, reason: "source-domain-internal-only"},
    {frame: 1, context: {...readyContext(), frameDomain: "sprite-999"}, reason: "unsupported-frame-domain"},
    {frame: 1, context: {...readyContext(), scenario: "default"}, reason: "frame-domain-scenario-mismatch"},
    {frame: 1, context: {...readyContext(), lang: "es" as const}, reason: "spanish-disabled"},
    {frame: 0, context: readyContext(), reason: "frame-out-of-range"},
    {frame: 19, context: readyContext(), reason: "frame-out-of-range"},
  ] as const;
  for (const item of cases) {
    for (const request of blocked) {
      const state = item.getFrameState(request.frame, request.context);
      assert.equal(state.status, "blocked");
      assert.equal(state.blocker, request.reason);
      assert.equal(state.sourceFrame, null);
      assert.equal(state.sourceExportFrame, null);
      assert.equal(state.questionLabel, null);
      assert.equal(state.sourceStaticQuestionDrawingReady, false);
      const markup = renderToStaticMarkup(createElement(item.module.Renderer, {
        frame: request.frame,
        ...request.context,
      }));
      assert.match(markup, new RegExp(`data-fail-closed-reason="${request.reason}"`));
      assert.doesNotMatch(markup, /<canvas/);
      assert.match(markup, /data-strict-migration-complete="false"/);
      assert.match(markup, /data-owner-accepted="false"/);
    }
  }
});

test("atlas modules do not promote quiz behavior, product QA, owner, or strict acceptance", () => {
  for (const item of cases) {
    assert.equal(item.config.acceptanceEffects.productQaComplete, false);
    assert.equal(item.config.acceptanceEffects.humanVisualReviewAccepted, false);
    assert.equal(item.config.acceptanceEffects.ownerAccepted, false);
    assert.equal(item.config.acceptanceEffects.strictMigrationComplete, false);
    assert.equal(item.config.acceptanceEffects.published, false);
    assert.equal(item.sourceContract.originalRuntimeBaselineStatus, "not-used");
    assert.equal(item.sourceContract.fullFrameRmseStatus, "not-performed");
    assert.equal(
      item.sourceContract.canonicalFrameDomainDispositionStatus,
      "unresolved-unchanged",
    );
    assert.equal(item.sourceContract.answerScoringReviewTimerReportStatus,
      "current-js-answer-scoring-and-text-review-enabled-source-review-visuals-timer-and-report-disabled");
    assert.equal(item.sourceContract.sourceReplayStatus, "unvalidated");
    assert.equal(
      item.sourceContract.currentJavascriptReplayStatus,
      "complete-seed-bound-whole-state-reset",
    );
    assert.equal(
      item.sourceContract.sourceScriptEvidence.strictMigrationComplete,
      false,
    );
  }
});

test("FQ002 seed deterministically selects 10 unique questions while FQ003 stays sequential", () => {
  const fq002Seed7 = buildG5L4Fq23QuestionOrder(
    COURSE_G05_L04_FQ_002_CONFIG,
    7,
  );
  const fq002Seed7Again = buildG5L4Fq23QuestionOrder(
    COURSE_G05_L04_FQ_002_CONFIG,
    7,
  );
  const fq002Seed8 = buildG5L4Fq23QuestionOrder(
    COURSE_G05_L04_FQ_002_CONFIG,
    8,
  );
  assert.deepEqual(fq002Seed7, fq002Seed7Again);
  assert.notDeepEqual(fq002Seed7.questionOrder, fq002Seed8.questionOrder);
  assert.equal(fq002Seed7.questionOrder.length, 10);
  assert.equal(new Set(fq002Seed7.questionOrder).size, 10);
  assert.ok(fq002Seed7.questionOrder.every(
    (questionNumber) => questionNumber >= 1 && questionNumber <= 18,
  ));

  const sequential = Array.from({length: 18}, (_, index) => index + 1);
  assert.deepEqual(
    buildG5L4Fq23QuestionOrder(COURSE_G05_L04_FQ_003_CONFIG, 7)
      .questionOrder,
    sequential,
  );
  assert.deepEqual(
    buildG5L4Fq23QuestionOrder(COURSE_G05_L04_FQ_003_CONFIG, 8)
      .questionOrder,
    sequential,
  );
});

function chooseAndSubmit(
  config: typeof COURSE_G05_L04_FQ_002_CONFIG |
    typeof COURSE_G05_L04_FQ_003_CONFIG,
  state: G5L4Fq23QuestionSequenceState,
  option: G5L4Fq23AnswerOption,
) {
  const selected = reduceG5L4Fq23QuestionSequence(config, state, {
    type: "select-answer",
    option,
  });
  return reduceG5L4Fq23QuestionSequence(config, selected, {
    type: "submit-answer",
  });
}

test("source-bound A-D submission, scoring, grade bands, and text review are deterministic", () => {
  for (const item of cases) {
    let state = createG5L4Fq23QuestionSequenceState(item.config, 17);
    const initial = state;
    assert.equal(state.mode, "question");
    assert.equal(state.responses.length, 0);
    assert.equal(state.networkReportingEnabled, false);
    assert.equal(state.legacyActionScriptExecuted, false);
    assert.equal(state.exactAvm1RandomOrderEstablished, false);
    assert.equal(state.sourceReviewVisualParityEstablished, false);

    for (const questionNumber of state.questionOrder) {
      const correctOption = G5_L4_FQ23_CORRECT_OPTIONS[questionNumber - 1];
      assert.ok(correctOption);
      state = chooseAndSubmit(item.config, state, correctOption);
    }

    assert.equal(state.mode, "results");
    assert.equal(state.completed, true);
    assert.equal(state.correctCount, item.presentedQuestionCount);
    assert.equal(state.wrongCount, 0);
    assert.equal(state.responses.length, item.presentedQuestionCount);
    assert.equal(state.grade, "Advanced");
    assert.equal(getG5L4Fq23ActiveQuestionNumber(state), null);
    assert.ok(state.responses.every((response) =>
      response.correct &&
      response.responseInstanceName === response.correctInstanceName));

    state = reduceG5L4Fq23QuestionSequence(item.config, state, {
      type: "begin-review",
    });
    assert.equal(state.mode, "review");
    assert.deepEqual(
      getG5L4Fq23ActiveReviewResponse(state),
      state.responses[0],
    );
    const firstReview = state;
    state = reduceG5L4Fq23QuestionSequence(item.config, state, {
      type: "review-next",
    });
    assert.equal(state.reviewPosition, 1);
    state = reduceG5L4Fq23QuestionSequence(item.config, state, {
      type: "review-previous",
    });
    assert.deepEqual(state, firstReview);

    assert.deepEqual(
      reduceG5L4Fq23QuestionSequence(item.config, state, {type: "replay"}),
      initial,
    );
    assert.deepEqual(
      reduceG5L4Fq23QuestionSequence(item.config, state, {
        type: "reset",
        seed: 23,
      }),
      createG5L4Fq23QuestionSequenceState(item.config, 23),
    );
  }

  assert.equal(gradeG5L4Fq23Score(0), "Unsatisfactory");
  assert.equal(gradeG5L4Fq23Score(3), "Unsatisfactory");
  assert.equal(gradeG5L4Fq23Score(4), "Partially Proficient");
  assert.equal(gradeG5L4Fq23Score(6), "Partially Proficient");
  assert.equal(gradeG5L4Fq23Score(7), "Proficient");
  assert.equal(gradeG5L4Fq23Score(8), "Proficient");
  assert.equal(gradeG5L4Fq23Score(9), "Advanced");
});

test("answer state is immutable and a missing selection cannot advance", () => {
  const initial = createG5L4Fq23QuestionSequenceState(
    COURSE_G05_L04_FQ_002_CONFIG,
    Number.NaN,
  );
  assert.equal(initial.seed, 0);
  assert.equal(
    reduceG5L4Fq23QuestionSequence(
      COURSE_G05_L04_FQ_002_CONFIG,
      initial,
      {type: "submit-answer"},
    ),
    initial,
  );
  assert.equal(Object.isFrozen(initial), true);
  assert.equal(Object.isFrozen(initial.questionOrder), true);
  const answered = chooseAndSubmit(
    COURSE_G05_L04_FQ_002_CONFIG,
    initial,
    "A",
  );
  assert.equal(Object.isFrozen(answered.responses), true);
  assert.equal(Object.isFrozen(answered.responses[0]), true);
});

test("live renderer exposes keyboard-native radio/submit/replay controls while deterministic capture stays an atlas", () => {
  for (const item of cases) {
    const liveMarkup = renderToStaticMarkup(createElement(item.module.Renderer, {
      frame: 1,
      ...readyContext(17),
      entryStateSha256: "",
    }));
    assert.match(liveMarkup, /data-interactive-controls-enabled="true"/);
    assert.match(liveMarkup, /data-current-javascript-question-controls="true"/);
    assert.equal((liveMarkup.match(/type="radio"/g) ?? []).length, 4);
    assert.match(liveMarkup, /Submit answer and continue/);
    assert.match(liveMarkup, /Replay quiz/);
    assert.match(liveMarkup, /data-network-reporting-enabled="false"/);
    assert.match(liveMarkup, /data-exact-avm1-random-order-established="false"/);

    const captureMarkup = renderToStaticMarkup(createElement(
      item.module.Renderer,
      {frame: 1, ...readyContext(17)},
    ));
    assert.match(captureMarkup, /data-interactive-controls-enabled="false"/);
    assert.doesNotMatch(captureMarkup, /type="radio"/);
    assert.match(captureMarkup, /data-capture-identity-status="verified"/);
  }
});

test("live FQ controls expose a shell companion and retain an inline fallback", async () => {
  const rendererSource = await readFile(rendererSourceUrl, "utf8");
  assert.match(
    rendererSource,
    /document\.getElementById\(props\.pageInteractionCompanionTargetId\)/,
  );
  assert.match(
    rendererSource,
    /return companionTarget\s*\? createPortal\(companion, companionTarget\)\s*: companion;/,
  );

  for (const item of cases) {
    const markup = renderToStaticMarkup(createElement(item.module.Renderer, {
      frame: 1,
      ...readyContext(17),
      entryStateSha256: "",
      pageInteractionCompanionTargetId: "g5-l4-fq23-question-controls",
    }));
    assert.match(
      markup,
      /data-current-javascript-question-companion="true"/,
    );
    assert.match(
      markup,
      /data-current-javascript-question-controls="true"/,
    );
    assert.equal((markup.match(/type="radio"/g) ?? []).length, 4);
  }
});

test("behavior evidence binds exact FFDec inventories and swfmill option-name structures", async () => {
  for (const item of cases) {
    const evidence = G5_L4_FQ23_SOURCE_SCRIPT_EVIDENCE[item.id];
    for (const binding of [
      evidence.ffdecScriptBundle,
      evidence.scriptInventory,
      evidence.swfmillStructure,
    ]) {
      assert.equal(
        sha256(await readFile(`${ROOT}${binding.path}`)),
        binding.sha256,
      );
    }
    assert.equal(evidence.correctOptionReleaseHandler.count, 18);
    assert.equal(evidence.wrongOptionReleaseHandler.count, 54);
    assert.equal(evidence.optionInstanceCount, 72);
    assert.equal(evidence.currentJavascriptExecutesLegacyActionScript, false);
    assert.equal(evidence.reportingNetworkEnabled, false);
    const ffdecScripts = gunzipSync(
      await readFile(`${ROOT}${evidence.ffdecScriptBundle.path}`),
    ).toString("utf8");
    assert.ok(ffdecScripts.includes(
      `_global.arrayAnswer = ["${evidence.correctAnswerInstanceNames.join('","')}"];`,
    ));
    assert.ok(ffdecScripts.includes(evidence.sourceSelectionExpression));
    assert.ok(ffdecScripts.includes(
      `_global.totalQuestionsCount = ${item.presentedQuestionCount};`,
    ));
    const scriptInventory = JSON.parse(
      await readFile(`${ROOT}${evidence.scriptInventory.path}`, "utf8"),
    );
    assert.equal(scriptInventory.scripts.filter(
      (script: {sha256?: string}) =>
        script.sha256 === evidence.correctOptionReleaseHandler.sha256,
    ).length, 18);
    assert.equal(scriptInventory.scripts.filter(
      (script: {sha256?: string}) =>
        script.sha256 === evidence.wrongOptionReleaseHandler.sha256,
    ).length, 54);
    const swfmill = gunzipSync(
      await readFile(`${ROOT}${evidence.swfmillStructure.path}`),
    ).toString("utf8");
    const optionInstances = new Set(
      [...swfmill.matchAll(/name="(A\d+Opt[1-4])"/g)]
        .map((match) => match[1]),
    );
    assert.equal(optionInstances.size, 72);
    for (const correctInstanceName of evidence.correctAnswerInstanceNames) {
      assert.equal(optionInstances.has(correctInstanceName), true);
    }
    assert.equal(
      item.sourceContract.sourceScriptEvidence.selectionAndAnswerScript.sha256,
      evidence.selectionAndAnswerScript.sha256,
    );
  }
});
