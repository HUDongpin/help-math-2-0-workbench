import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import test from "node:test";
import {fileURLToPath} from "node:url";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";

import {FQ_NUMBER_LINES, FQ_SYMBOL_NAMES} from "../src/timelines/course-g04-l03-fq-number-lines";
import {COURSE_G04_L03_FQ_002_QUESTIONS} from "../src/timelines/course-g04-l03-fq-002-quiz-interaction";

import {loadAnimationModule} from "../src/animation-registry";
import animationModule, {
  COURSE_G04_L03_FQ_002_MOVIE,
  COURSE_G04_L03_FQ_002_RUNTIME,
  COURSE_G04_L03_FQ_002_SOURCE,
  COURSE_G04_L03_FQ_002_SOURCE_CONTRACT,
  CourseG04L03Fq002Renderer,
  getCourseG04L03Fq002FrameState,
} from "../src/modules/course-g04-l03-fq-002";
import {
  COURSE_G04_L03_FQ_002_FUNCTIONAL_MASKING_POLICY,
  COURSE_G04_L03_FQ_002_INTERACTION_AUTHORITY,
} from "../src/timelines/course-g04-l03-fq-002-quiz-interaction";

const repositoryRoot = fileURLToPath(new URL("../../../", import.meta.url));
const ENTRY_SHA = "a".repeat(64);

const sha256 = (bytes: Uint8Array) =>
  createHash("sha256").update(bytes).digest("hex");

const render = (
  overrides: Partial<Parameters<typeof CourseG04L03Fq002Renderer>[0]> = {},
) =>
  renderToStaticMarkup(
    createElement(CourseG04L03Fq002Renderer, {
      frame: 1,
      frameDomain: "sprite-899",
      scenario: "source-static-frame",
      lang: "en",
      seed: 0,
      ...overrides,
    }),
  );

test("FQ002 retains exact source, root, nested-domain, and registry identity", async () => {
  assert.deepEqual(COURSE_G04_L03_FQ_002_MOVIE.stage, {
    width: 800,
    height: 600,
  });
  assert.equal(COURSE_G04_L03_FQ_002_MOVIE.fps, 12);
  assert.equal(COURSE_G04_L03_FQ_002_MOVIE.frameCount, 68);
  assert.equal(COURSE_G04_L03_FQ_002_RUNTIME.frameCount, 10);
  assert.equal(
    COURSE_G04_L03_FQ_002_RUNTIME.defaultFrameDomain,
    "sprite-899",
  );
  assert.equal(
    COURSE_G04_L03_FQ_002_RUNTIME.frameDomains?.find(
      ({id}) => id === "sprite-899",
    )?.frameCount,
    68,
  );
  assert.equal(animationModule.key, "course-g04-l03-fq-002");
  assert.equal(animationModule.maturity, "legacy-prototype");
  assert.equal(animationModule.reducedMotionFrame, 1);
  assert.equal(animationModule.completionMode, "activity");
  assert.equal(animationModule.playbackEndFrameByDomain?.["sprite-899"], 1);
  assert.equal(animationModule.Renderer, CourseG04L03Fq002Renderer);
  assert.equal(
    (await loadAnimationModule("course-g04-l03-fq-002"))?.Renderer,
    CourseG04L03Fq002Renderer,
  );
  assert.equal(
    sha256(
      await readFile(
        `${repositoryRoot}${COURSE_G04_L03_FQ_002_SOURCE.swf}`,
      ),
    ),
    COURSE_G04_L03_FQ_002_SOURCE.swfSha256,
  );
  assert.equal(
    sha256(
      await readFile(
        `${repositoryRoot}${COURSE_G04_L03_FQ_002_SOURCE.fla}`,
      ),
    ),
    COURSE_G04_L03_FQ_002_SOURCE.flaSha256,
  );
});

test("functional entry binds seeded question 7 to source frame 8 and one modern overlay", () => {
  const markup = render();

  assert.match(
    markup,
    /data-current-js-functional-entry="sprite-899:1:source-static-frame:en"/,
  );
  assert.match(markup, /data-current-js-controls-enabled="true"/);
  assert.match(markup, /data-current-js-overlay-count="1"/);
  assert.match(markup, /data-current-js-sequence-number="1"/);
  assert.match(markup, /data-current-js-source-visual-frame="8"/);
  assert.match(
    markup,
    /data-current-js-functional-overlay="course-g04-l03-fq-002-quiz"/,
  );
  assert.match(
    markup,
    /data-functional-canvas-artifact-mask="Mc_Finish-QuestNo-CQ"/,
  );
  assert.match(markup, /data-functional-mask-phase="question"/);
  assert.match(
    markup,
    /data-modern-source-visual-cover="full-stage-opaque"/,
  );
  assert.match(
    markup,
    /<rect fill="#b8d8f7" height="600" width="800" x="0" y="0"/,
  );
  assert.match(
    markup,
    /course-g04-l03-fq-002-stage-panel--wide/,
  );
  assert.match(markup, /data-source-canvas-accessibility-isolated="true"/);
  assert.match(
    markup,
    /data-source-canvas-visual-exposure="hidden-behind-modern-backdrop"/,
  );
  assert.match(markup, /data-answer-transition-locked="false"/);
  assert.match(
    markup,
    /data-source-symbol-projection="source-bound-semantic-number-line-and-shapes"/,
  );
  assert.doesNotMatch(markup, /data-source-symbol-crop="target"|Target shown/);
  assert.match(markup, /data-number-line-question="7"/);
  assert.match(markup, /inert=""/);
  assert.match(markup, /data-flash-frame="8"/);
  assert.match(markup, /Question 1 of 10/);
  assert.match(
    markup,
    /Which symbol is located at\s+–4 on this number line\?/,
  );
  for (const [optionId, optionNumber] of [
    ["A", 1],
    ["B", 2],
    ["C", 3],
    ["D", 4],
  ] as const) {
    assert.match(markup, new RegExp(`aria-label="${optionId}\\. ${{A: "Square", B: "Circle", C: "Triangle", D: "Heart"}[optionId]}"`));
    assert.match(
      markup,
      new RegExp(`data-source-option-instance="A7Opt${optionNumber}"`),
    );
    assert.match(
      markup,
      new RegExp(`data-number-line-symbol="${{A: "Square", B: "Circle", C: "Triangle", D: "Heart"}[optionId]}"`),
    );
  }
  assert.match(
    markup,
    /data-source-host-close-report-enabled="false"/,
  );
  assert.match(markup, /data-source-audio-enabled="false"/);
});

test("deterministic entry-state capture preserves requested source frame with zero mask or controls", () => {
  const markup = render({
    entryStateSha256: ENTRY_SHA,
    frame: 44,
    requirementId: "req-fq002-review-44",
    traceId: "trace-fq002-review-44",
    seed: 7,
  });

  assert.match(markup, /data-deterministic-evidence-capture="true"/);
  assert.match(markup, /data-current-js-controls-enabled="false"/);
  assert.match(markup, /data-current-js-overlay-count="0"/);
  assert.match(markup, /data-current-js-source-visual-frame="44"/);
  assert.match(markup, /data-flash-frame="44"/);
  assert.match(
    markup,
    /data-flash-entry-state-sha256="aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"/,
  );
  assert.match(
    markup,
    /data-flash-requirement-id="req-fq002-review-44"/,
  );
  assert.match(
    markup,
    /data-flash-trace-id="trace-fq002-review-44"/,
  );
  assert.doesNotMatch(markup, /data-current-js-functional-overlay/);
  assert.doesNotMatch(markup, /data-functional-canvas-artifact-mask/);
  assert.doesNotMatch(markup, /data-interaction-companion-surface/);
  assert.doesNotMatch(markup, /data-source-symbol-projection=/);
  assert.doesNotMatch(markup, /Modern reconstruction/);
});

test("non-entry, Spanish, wrong-domain, and capture requests fail closed to source-only rendering", () => {
  for (const markup of [
    render({frame: 2}),
    render({lang: "es"}),
    render({frameDomain: "root", scenario: "root-unavailable"}),
    render({entryStateSha256: ENTRY_SHA}),
  ]) {
    assert.match(markup, /data-current-js-controls-enabled="false"/);
    assert.match(markup, /data-current-js-overlay-count="0"/);
    assert.doesNotMatch(markup, /data-current-js-functional-overlay/);
    assert.doesNotMatch(markup, /data-functional-canvas-artifact-mask/);
    assert.match(markup, /data-source-canvas-visual-exposure="source-only"/);
  }
});

test("pause and reduced motion remain explicit host states without changing evidence gates", () => {
  const markup = render({paused: true, reducedMotion: true});

  assert.match(markup, /data-host-paused="true"/);
  assert.match(markup, /data-reduced-motion="true"/);
  assert.match(markup, /data-behavior-parity-established="false"/);
  assert.match(markup, /data-owner-accepted="false"/);
  assert.match(markup, /data-strict-migration-complete="false"/);
  assert.match(markup, /data-lesson-published="false"/);
});

test("pure source-static frame state remains available across the branch atlas", () => {
  for (const frame of [1, 2, 26, 43, 44, 68]) {
    const state = getCourseG04L03Fq002FrameState(frame, {
      frameDomain: "sprite-899",
      scenario: "source-static-frame",
      lang: "en",
      seed: 7,
    });
    assert.equal(state.status, "ready");
    assert.equal(state.frame, frame);
    assert.equal(state.frameDomain, "sprite-899");
    assert.equal(state.interactiveControlsEnabled, false);
    assert.equal(state.naturalRuntimeEstablished, false);
    assert.equal(state.audioRendered, false);
  }
});

test("functional contract records masking and modern enhancements while every acceptance gate stays false", () => {
  assert.deepEqual(
    COURSE_G04_L03_FQ_002_SOURCE_CONTRACT.currentJavascriptFunctionalEntry,
    {
      frameDomain: "sprite-899",
      frame: 1,
      scenario: "source-static-frame",
      language: "en",
      deterministicCaptureOverlayEnabled: false,
    },
  );
  assert.equal(
    COURSE_G04_L03_FQ_002_SOURCE_CONTRACT.livePlaybackEndFrame,
    1,
  );
  assert.equal(
    COURSE_G04_L03_FQ_002_SOURCE_CONTRACT
      .sourceStaticDynamicVisibilityAndCounterParityEstablished,
    false,
  );
  assert.equal(
    COURSE_G04_L03_FQ_002_SOURCE_CONTRACT
      .sourceQuestionSelectionParityEstablished,
    false,
  );
  assert.equal(
    COURSE_G04_L03_FQ_002_SOURCE_CONTRACT
      .sourceReviewVisualParityEstablished,
    false,
  );
  assert.equal(
    COURSE_G04_L03_FQ_002_SOURCE_CONTRACT
      .sourceResultsVisualParityEstablished,
    false,
  );
  assert.equal(
    COURSE_G04_L03_FQ_002_SOURCE_CONTRACT
      .authoritativeOriginalRuntimeAccepted,
    false,
  );
  assert.equal(
    COURSE_G04_L03_FQ_002_SOURCE_CONTRACT.naturalRuntimeTraceAccepted,
    false,
  );
  assert.equal(
    COURSE_G04_L03_FQ_002_SOURCE_CONTRACT.humanVisualReviewAccepted,
    false,
  );
  assert.equal(COURSE_G04_L03_FQ_002_SOURCE_CONTRACT.ownerAccepted, false);
  assert.equal(
    COURSE_G04_L03_FQ_002_SOURCE_CONTRACT.strictMigrationComplete,
    false,
  );
  assert.equal(COURSE_G04_L03_FQ_002_SOURCE_CONTRACT.lessonPublished, false);
  assert.equal(
    COURSE_G04_L03_FQ_002_SOURCE_CONTRACT.strictAcceptanceEffect,
    "none",
  );
  assert.equal(
    COURSE_G04_L03_FQ_002_FUNCTIONAL_MASKING_POLICY
      .deterministicCaptureMask,
    "none",
  );
  assert.equal(
    COURSE_G04_L03_FQ_002_INTERACTION_AUTHORITY
      .sourceRandomParityEstablished,
    false,
  );
  assert.ok(
    COURSE_G04_L03_FQ_002_SOURCE_CONTRACT.currentJavascriptInteractionScope
      .includes("physical-double-click-answer-transition-lock"),
  );
  assert.ok(
    COURSE_G04_L03_FQ_002_SOURCE_CONTRACT.currentJavascriptInteractionScope
      .includes(
        "Q7-Q12-source-bound-complete-number-lines-and-named-shape-choices",
      ),
  );
  assert.doesNotMatch(
    JSON.stringify(
      COURSE_G04_L03_FQ_002_SOURCE_CONTRACT.currentJavascriptInteractionScope,
    ),
    /TS007|cross-placement/,
  );
});


test("the six number-line questions keep all source symbols and correct integer positions", () => {
  assert.deepEqual(FQ_SYMBOL_NAMES, {A: "Square", B: "Circle", C: "Triangle", D: "Heart"});
  const targets = [-4, -2, -8, -1, -11, -6];
  for (let index = 0; index < targets.length; index++) {
    const question = COURSE_G04_L03_FQ_002_QUESTIONS[index + 6]!;
    const line = FQ_NUMBER_LINES[question.id]!;
    assert.equal(Object.keys(line.positions).length, 4);
    assert.equal(line.positions[question.correctOptionId], targets[index]);
    assert.ok(Object.values(line.positions).every(value => Number.isInteger(value) && value >= line.min && value <= line.max));
  }
  assert.deepEqual(FQ_NUMBER_LINES[9]!.positions, {A: -8, B: -1, C: 4, D: 8});
  assert.deepEqual(FQ_NUMBER_LINES[11]!.positions, {A: -11, B: -6, C: 6, D: 11});
});
