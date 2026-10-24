import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {loadAnimationModule} from "../src/animation-registry";
import ti002, {
  COURSE_G04_L03_TI_002_MOVIE,
  COURSE_G04_L03_TI_002_RUNTIME,
  COURSE_G04_L03_TI_002_SOURCE,
  COURSE_G04_L03_TI_002_SOURCE_CONTRACT,
  getCourseG04L03Ti002SourceCanvasRenderKey,
  getCourseG04L03Ti002FrameState,
} from "../src/modules/course-g04-l03-ti-002";
import ti003, {
  COURSE_G04_L03_TI_003_MOVIE,
  COURSE_G04_L03_TI_003_RUNTIME,
  COURSE_G04_L03_TI_003_SOURCE,
  COURSE_G04_L03_TI_003_SOURCE_CONTRACT,
  getCourseG04L03Ti003SourceCanvasRenderKey,
  getCourseG04L03Ti003FrameState,
} from "../src/modules/course-g04-l03-ti-003";
import ti004, {
  COURSE_G04_L03_TI_004_MOVIE,
  COURSE_G04_L03_TI_004_RUNTIME,
  COURSE_G04_L03_TI_004_SOURCE,
  COURSE_G04_L03_TI_004_SOURCE_CONTRACT,
  getCourseG04L03Ti004SourceCanvasRenderKey,
  getCourseG04L03Ti004FrameState,
} from "../src/modules/course-g04-l03-ti-004";
import ti005, {
  COURSE_G04_L03_TI_005_MOVIE,
  COURSE_G04_L03_TI_005_RUNTIME,
  COURSE_G04_L03_TI_005_SOURCE,
  COURSE_G04_L03_TI_005_SOURCE_CONTRACT,
  getCourseG04L03Ti005SourceCanvasRenderKey,
  getCourseG04L03Ti005FrameState,
} from "../src/modules/course-g04-l03-ti-005";
import ti006, {
  COURSE_G04_L03_TI_006_MOVIE,
  COURSE_G04_L03_TI_006_RUNTIME,
  COURSE_G04_L03_TI_006_SOURCE,
  COURSE_G04_L03_TI_006_SOURCE_CONTRACT,
  getCourseG04L03Ti006SourceCanvasRenderKey,
  getCourseG04L03Ti006FrameState,
} from "../src/modules/course-g04-l03-ti-006";
import {matchPrototype} from "../src/prototype-manifest";
import {COURSE_G04_L03_TI_002_AUTHORITY} from "../src/timelines/course-g04-l03-ti-002";
import {COURSE_G04_L03_TI_003_AUTHORITY} from "../src/timelines/course-g04-l03-ti-003";
import {COURSE_G04_L03_TI_004_AUTHORITY} from "../src/timelines/course-g04-l03-ti-004";
import {COURSE_G04_L03_TI_005_AUTHORITY} from "../src/timelines/course-g04-l03-ti-005";
import {COURSE_G04_L03_TI_006_AUTHORITY} from "../src/timelines/course-g04-l03-ti-006";

const repositoryRoot = fileURLToPath(new URL("../../../", import.meta.url));
const sha256 = (bytes: Uint8Array) =>
  createHash("sha256").update(bytes).digest("hex");

const pages = [
  {id: "course-g04-l03-ti-002", title: "Question 1", domain: "sprite-272",
    frameCount: 254, companionCount: 33, marker: "question-1-source-static-drawing",
    source: COURSE_G04_L03_TI_002_SOURCE, movie: COURSE_G04_L03_TI_002_MOVIE,
    runtime: COURSE_G04_L03_TI_002_RUNTIME, module: ti002,
    state: getCourseG04L03Ti002FrameState, authority: COURSE_G04_L03_TI_002_AUTHORITY},
  {id: "course-g04-l03-ti-003", title: "Question 2", domain: "sprite-126",
    frameCount: 140, companionCount: 19, marker: "question-2-source-static-drawing",
    source: COURSE_G04_L03_TI_003_SOURCE, movie: COURSE_G04_L03_TI_003_MOVIE,
    runtime: COURSE_G04_L03_TI_003_RUNTIME, module: ti003,
    state: getCourseG04L03Ti003FrameState, authority: COURSE_G04_L03_TI_003_AUTHORITY},
  {id: "course-g04-l03-ti-004", title: "Question 3", domain: "sprite-274",
    frameCount: 125, companionCount: 24, marker: "question-3-source-static-drawing",
    source: COURSE_G04_L03_TI_004_SOURCE, movie: COURSE_G04_L03_TI_004_MOVIE,
    runtime: COURSE_G04_L03_TI_004_RUNTIME, module: ti004,
    state: getCourseG04L03Ti004FrameState, authority: COURSE_G04_L03_TI_004_AUTHORITY},
  {id: "course-g04-l03-ti-005", title: "Question 4", domain: "sprite-208",
    frameCount: 210, companionCount: 6, marker: "question-4-source-static-drawing",
    source: COURSE_G04_L03_TI_005_SOURCE, movie: COURSE_G04_L03_TI_005_MOVIE,
    runtime: COURSE_G04_L03_TI_005_RUNTIME, module: ti005,
    state: getCourseG04L03Ti005FrameState, authority: COURSE_G04_L03_TI_005_AUTHORITY},
  {id: "course-g04-l03-ti-006", title: "Question 5", domain: "sprite-269",
    frameCount: 167, companionCount: 18, marker: "question-5-source-static-drawing",
    source: COURSE_G04_L03_TI_006_SOURCE, movie: COURSE_G04_L03_TI_006_MOVIE,
    runtime: COURSE_G04_L03_TI_006_RUNTIME, module: ti006,
    state: getCourseG04L03Ti006FrameState, authority: COURSE_G04_L03_TI_006_AUTHORITY},
] as const;

test("TI002 through TI006 preserve source hashes, timelines, and inert seed state", async () => {
  for (const page of pages) {
    assert.deepEqual(page.movie.stage, {width: 800, height: 600}, page.id);
    assert.equal(page.movie.frameCount, page.frameCount, page.id);
    assert.equal(page.runtime.frameCount, 10, page.id);
    assert.equal(page.runtime.defaultFrameDomain, page.domain, page.id);
    assert.equal(page.runtime.frameDomains?.length, page.companionCount + 1, page.id);
    for (const [path, expected] of [
      [page.source.swf, page.source.swfSha256],
      [page.source.fla, page.source.flaSha256],
      [page.source.associatedAudio, page.source.associatedAudioSha256],
    ] as const) {
      assert.equal(sha256(await readFile(`${repositoryRoot}${path}`)), expected, path);
    }
    const readyFrames = page.id === "course-g04-l03-ti-005"
      ? [[1, page.marker], [208, page.marker],
        [209, "question-4-quiz-source-local-initial-state"],
        [210, "question-4-quiz-post-stop-static-inspection"]] as const
      : [[1, page.marker], [page.frameCount, page.marker]] as const;
    for (const [frame, marker] of readyFrames) {
      const state = page.state(frame, {frameDomain: page.domain,
        scenario: "source-static-frame", lang: "en", seed: -1});
      assert.equal(state.status, "ready", `${page.id}:${frame}`);
      assert.equal(state.seed, 4_294_967_295, `${page.id}:${frame}`);
      assert.deepEqual(state.visibleSourceMarkers, [marker], `${page.id}:${frame}`);
      assert.equal(state.interactiveControlsEnabled, false, page.id);
      assert.equal(state.audioRendered, false, page.id);
    }
  }
});

test("TI005 exposes its source-local initial quiz and post-stop inspection", async () => {
  for (const frame of [209, 210]) {
    const state = getCourseG04L03Ti005FrameState(frame, {frameDomain: "sprite-208",
      scenario: "source-static-frame", lang: "en", seed: 7});
    assert.equal(state.status, "ready");
    assert.equal(state.blocker, null);
    assert.deepEqual(state.visibleSourceMarkers, [frame === 209
      ? "question-4-quiz-source-local-initial-state"
      : "question-4-quiz-post-stop-static-inspection"]);
    assert.equal(state.interactiveControlsEnabled, false);
    assert.equal(state.audioRendered, false);
  }
  assert.equal(COURSE_G04_L03_TI_005_SOURCE_CONTRACT.blockedSourceBehaviorFrameCount, 0);
  assert.equal(COURSE_G04_L03_TI_005_SOURCE_CONTRACT.livePlaybackEndFrame, 209);
  assert.equal(ti005.playbackEndFrameByDomain?.["sprite-208"], 209);
  assert.equal(COURSE_G04_L03_TI_005_SOURCE.quizSourceData.length, 5);
  assert.equal(sha256(await readFile(`${repositoryRoot}${
    COURSE_G04_L03_TI_005_SOURCE.sourceLocalPatternQuizContract}`)),
  COURSE_G04_L03_TI_005_SOURCE.sourceLocalPatternQuizContractSha256);
  const markup = renderToStaticMarkup(createElement(ti005.Renderer, {
    frame: 209, frameDomain: "sprite-208", scenario: "source-static-frame",
    lang: "en", seed: 7,
  }));
  assert.doesNotMatch(markup, /data-fail-closed-reason/);
  assert.match(markup, /<canvas/);
  assert.match(markup, /data-current-js-controls-enabled="true"/);
  assert.match(markup,
    /data-current-js-functional-scope="ti005-pattern-quiz-source-script-bound"/);
  assert.match(markup, /data-current-js-controls-ready="false"/);
  assert.match(markup, /data-source-canvas-status="idle"/);
  assert.match(markup, /aria-label="First missing number"[^>]*disabled=""/);
  assert.match(markup, /aria-label="Second missing number"[^>]*disabled=""/);
  assert.match(markup, /aria-label="Check Answer"[^>]*disabled=""/);
  assert.match(markup, /aria-label="New Problem"[^>]*disabled=""/);
  assert.match(markup, /inputMode="text"|inputmode="text"/);
  for (const focusControl of [
    "first-answer",
    "second-answer",
    "check-answer",
    "new-problem",
  ]) {
    assert.match(markup, new RegExp(
      `data-ti005-focus-control="${focusControl}"`,
    ));
  }
  assert.doesNotMatch(markup, /enterKeyHint="next"|enterkeyhint="next"/);
  assert.match(markup, /data-interaction-companion-surface="mobile"/);
  assert.notEqual(
    getCourseG04L03Ti005SourceCanvasRenderKey(0, 2, 5, 4),
    getCourseG04L03Ti005SourceCanvasRenderKey(0, 2, 6, 4),
  );
  assert.notEqual(
    getCourseG04L03Ti005SourceCanvasRenderKey(0, 2, 1, 2),
    getCourseG04L03Ti005SourceCanvasRenderKey(1, 2, 1, 2),
  );
  assert.notEqual(
    getCourseG04L03Ti005SourceCanvasRenderKey(0, 0, 1, 0),
    getCourseG04L03Ti005SourceCanvasRenderKey(0, 5, 1, 0),
  );
  assert.equal(ti005.reducedMotionFrame, 209);
  assert.equal(
    COURSE_G04_L03_TI_005_SOURCE_CONTRACT.currentJavascriptInteractionStatus,
    "source-script-bound-functional-candidate",
  );
  assert.equal(
    COURSE_G04_L03_TI_005_SOURCE_CONTRACT
      .sourceLocalPatternQuizContractHashChainStatus,
    "stale-source-audit-binding-not-strict",
  );
  assert.equal(
    COURSE_G04_L03_TI_005_SOURCE_CONTRACT.behaviorParityEstablished,
    false,
  );

  const captureMarkup = renderToStaticMarkup(createElement(ti005.Renderer, {
    entryStateSha256: "a".repeat(64),
    frame: 209,
    frameDomain: "sprite-208",
    requirementId: "engineering-source-static-frame-209",
    scenario: "source-static-frame",
    lang: "en",
    seed: 7,
    traceId: "engineering-source-static",
  }));
  assert.match(captureMarkup, /data-current-js-controls-enabled="false"/);
  assert.doesNotMatch(captureMarkup, /First missing number/);
  assert.doesNotMatch(captureMarkup,
    /data-interaction-companion-surface="mobile"/);
});

test("TI002 adds fail-closed key-term matching without changing capture evidence", () => {
  const wholeLessonHostState = getCourseG04L03Ti002FrameState(238, {
    frameDomain: "sprite-272",
    scenario: "source-static-frame",
    lang: "en",
    seed: 0,
  });
  const markup = renderToStaticMarkup(createElement(ti002.Renderer, {
    frame: 238,
    frameDomain: "sprite-272",
    scenario: "source-static-frame",
    lang: "en",
    seed: 0,
    state: wholeLessonHostState,
  }));
  assert.doesNotMatch(markup, /data-fail-closed-reason/);
  assert.match(markup, /<canvas/);
  assert.match(markup, /data-current-js-controls-enabled="true"/);
  assert.match(markup,
    /data-current-js-functional-scope="ti002-key-term-drag-source-script-bound"/);
  assert.match(markup, /data-current-js-source-visual-frame="237"/);
  assert.match(markup, /data-flash-frame="237"/);
  assert.match(markup, /aria-hidden="true"/);
  assert.match(markup, /data-current-js-controls-ready="false"/);
  assert.match(markup, /data-source-canvas-status="idle"/);
  assert.match(markup,
    /aria-label="Select number line to move"[^>]*disabled=""/);
  assert.match(markup,
    /aria-label="Place selected key term with to get smaller in size or in value"[^>]*disabled=""/);
  assert.match(markup,
    /aria-label="Enlarge picture for to get smaller in size or in value"[^>]*disabled=""/);
  assert.equal(markup.match(/data-source-card="/g)?.length, 5);
  assert.equal(markup.match(/data-source-card-origin-mask="/g)?.length, 5);
  assert.equal(markup.match(/data-source-target="/g)?.length, 5);
  assert.equal(markup.match(/data-source-picture="/g)?.length, 5);
  assert.match(markup, /data-interaction-companion-surface="mobile"/);
  assert.match(markup, /data-interaction-companion-placement="fallback"/);

  assert.notEqual(
    getCourseG04L03Ti002SourceCanvasRenderKey(0, 0, 237),
    getCourseG04L03Ti002SourceCanvasRenderKey(1, 0, 237),
  );
  assert.notEqual(
    getCourseG04L03Ti002SourceCanvasRenderKey(0, 0, 237),
    getCourseG04L03Ti002SourceCanvasRenderKey(0, 0, 238),
  );
  assert.equal(ti002.reducedMotionFrame, 238);
  assert.equal(
    COURSE_G04_L03_TI_002_SOURCE_CONTRACT
      .currentJavascriptInteractionStatus,
    "source-script-bound-functional-candidate",
  );
  assert.equal(
    COURSE_G04_L03_TI_002_SOURCE_CONTRACT.pictureEnlargementStatus,
    "source-script-bound-modern-svg-representation-not-pixel-parity",
  );
  assert.equal(
    COURSE_G04_L03_TI_002_SOURCE_CONTRACT.sourceGlossaryActionStatus,
    "safe-disabled",
  );
  assert.ok(
    COURSE_G04_L03_TI_002_SOURCE_CONTRACT.currentJavascriptInteractionScope
      .includes("five-source-picture-click-targets-with-modern-enlargement-dialogs"),
  );
  assert.ok(
    COURSE_G04_L03_TI_002_SOURCE_CONTRACT.currentJavascriptInteractionScope
      .includes("source-geturl-glossary-actions-safe-disabled"),
  );
  assert.ok(
    COURSE_G04_L03_TI_002_SOURCE_CONTRACT.currentJavascriptInteractionScope
      .includes(
        "frame-237-source-visual-with-key-term-origin-masks-under-frame-238-functional-overlay",
      ),
  );
  assert.ok(
    COURSE_G04_L03_TI_002_SOURCE_CONTRACT.currentJavascriptInteractionScope
      .includes(
        "deterministic-evidence-capture-preserves-requested-frame-without-overlay",
      ),
  );
  assert.equal(
    COURSE_G04_L03_TI_002_SOURCE_CONTRACT.behaviorParityEstablished,
    false,
  );
  assert.equal(
    COURSE_G04_L03_TI_002_SOURCE_CONTRACT.replayParityEstablished,
    false,
  );
  assert.equal(
    COURSE_G04_L03_TI_002_SOURCE_CONTRACT.strictAcceptanceEffect,
    "none",
  );

  const captureMarkup = renderToStaticMarkup(createElement(ti002.Renderer, {
    entryStateSha256: "d".repeat(64),
    frame: 238,
    frameDomain: "sprite-272",
    requirementId: "engineering-source-static-frame-238",
    scenario: "source-static-frame",
    lang: "en",
    seed: 0,
    state: wholeLessonHostState,
    traceId: "engineering-source-static",
  }));
  assert.match(captureMarkup, /data-current-js-controls-enabled="false"/);
  assert.match(captureMarkup, /data-current-js-source-visual-frame="238"/);
  assert.match(captureMarkup, /data-flash-frame="238"/);
  assert.doesNotMatch(captureMarkup,
    /aria-label="Source-script-bound current JavaScript key-term matching activity"/);
  assert.doesNotMatch(captureMarkup, /data-source-card="/);
  assert.doesNotMatch(captureMarkup, /data-source-target="/);
  assert.doesNotMatch(captureMarkup, /data-source-picture="/);
  assert.doesNotMatch(captureMarkup,
    /data-interaction-companion-surface="mobile"/);
});

test("TI003 adds a fail-closed functional overlay without changing capture evidence", () => {
  const wholeLessonHostState = getCourseG04L03Ti003FrameState(139, {
    frameDomain: "sprite-126",
    scenario: "source-static-frame",
    lang: "en",
    seed: 0,
  });
  const markup = renderToStaticMarkup(createElement(ti003.Renderer, {
    frame: 139,
    frameDomain: "sprite-126",
    scenario: "source-static-frame",
    lang: "en",
    seed: 0,
    state: wholeLessonHostState,
  }));
  assert.doesNotMatch(markup, /data-fail-closed-reason/);
  assert.match(markup, /<canvas/);
  assert.match(markup, /data-current-js-controls-enabled="true"/);
  assert.match(markup,
    /data-current-js-functional-scope="ti003-number-line-drag-source-script-bound"/);
  assert.match(markup, /data-current-js-source-visual-frame="138"/);
  assert.match(markup, /data-flash-frame="138"/);
  assert.match(markup, /aria-hidden="true"/);
  assert.match(markup, /data-current-js-controls-ready="false"/);
  assert.match(markup, /data-source-canvas-status="idle"/);
  assert.match(markup,
    /aria-label="Select negative 10 to move"[^>]*disabled=""/);
  assert.match(markup,
    /aria-label="Place selected card at negative 10 on the number line"[^>]*disabled=""/);
  assert.match(markup,
    /aria-label="Open Need More Help"[^>]*disabled=""/);
  assert.match(markup, /data-interaction-companion-surface="mobile"/);
  assert.match(markup, /data-interaction-companion-placement="fallback"/);

  assert.notEqual(
    getCourseG04L03Ti003SourceCanvasRenderKey(0, 0, 138),
    getCourseG04L03Ti003SourceCanvasRenderKey(1, 0, 138),
  );
  assert.notEqual(
    getCourseG04L03Ti003SourceCanvasRenderKey(0, 0, 138),
    getCourseG04L03Ti003SourceCanvasRenderKey(0, 0, 139),
  );
  assert.equal(ti003.reducedMotionFrame, 139);
  assert.equal(
    COURSE_G04_L03_TI_003_SOURCE_CONTRACT
      .currentJavascriptInteractionStatus,
    "source-script-bound-functional-candidate",
  );
  assert.equal(
    COURSE_G04_L03_TI_003_SOURCE_CONTRACT.behaviorParityEstablished,
    false,
  );
  assert.equal(
    COURSE_G04_L03_TI_003_SOURCE_CONTRACT.replayParityEstablished,
    false,
  );
  assert.equal(
    COURSE_G04_L03_TI_003_SOURCE_CONTRACT.strictAcceptanceEffect,
    "none",
  );

  const captureMarkup = renderToStaticMarkup(createElement(ti003.Renderer, {
    entryStateSha256: "a".repeat(64),
    frame: 139,
    frameDomain: "sprite-126",
    requirementId: "engineering-source-static-frame-139",
    scenario: "source-static-frame",
    lang: "en",
    seed: 0,
    state: wholeLessonHostState,
    traceId: "engineering-source-static",
  }));
  assert.match(captureMarkup, /data-current-js-controls-enabled="false"/);
  assert.match(captureMarkup, /data-current-js-source-visual-frame="139"/);
  assert.match(captureMarkup, /data-flash-frame="139"/);
  assert.doesNotMatch(captureMarkup,
    /aria-label="Source-script-bound current JavaScript number-line card activity"/);
  assert.doesNotMatch(captureMarkup,
    /data-interaction-companion-surface="mobile"/);
});

test("TI004 adds a fail-closed least-to-greatest overlay without changing capture evidence", () => {
  const wholeLessonHostState = getCourseG04L03Ti004FrameState(124, {
    frameDomain: "sprite-274",
    scenario: "source-static-frame",
    lang: "en",
    seed: 0,
  });
  const markup = renderToStaticMarkup(createElement(ti004.Renderer, {
    frame: 124,
    frameDomain: "sprite-274",
    scenario: "source-static-frame",
    lang: "en",
    seed: 0,
    state: wholeLessonHostState,
  }));
  assert.doesNotMatch(markup, /data-fail-closed-reason/);
  assert.match(markup, /<canvas/);
  assert.match(markup, /data-current-js-controls-enabled="true"/);
  assert.match(markup,
    /data-current-js-functional-scope="ti004-least-to-greatest-drag-source-script-bound"/);
  assert.match(markup, /data-current-js-source-visual-frame="122"/);
  assert.match(markup, /data-flash-frame="122"/);
  assert.match(markup, /aria-hidden="true"/);
  assert.match(markup, /data-current-js-controls-ready="false"/);
  assert.match(markup, /data-source-canvas-status="idle"/);
  assert.match(markup,
    /aria-label="Select 0 to move"[^>]*disabled=""/);
  assert.match(markup,
    /aria-label="Place selected card in least-to-greatest slot 1"[^>]*disabled=""/);
  assert.match(markup,
    /aria-label="Open Need More Help"[^>]*disabled=""/);
  assert.match(markup, /data-interaction-companion-surface="mobile"/);
  assert.match(markup, /data-interaction-companion-placement="fallback"/);

  assert.notEqual(
    getCourseG04L03Ti004SourceCanvasRenderKey(0, 0, 122),
    getCourseG04L03Ti004SourceCanvasRenderKey(1, 0, 122),
  );
  assert.notEqual(
    getCourseG04L03Ti004SourceCanvasRenderKey(0, 0, 122),
    getCourseG04L03Ti004SourceCanvasRenderKey(0, 0, 124),
  );
  assert.equal(ti004.reducedMotionFrame, 124);
  assert.equal(
    COURSE_G04_L03_TI_004_SOURCE_CONTRACT
      .currentJavascriptInteractionStatus,
    "source-script-bound-functional-candidate",
  );
  assert.equal(
    COURSE_G04_L03_TI_004_SOURCE_CONTRACT.behaviorParityEstablished,
    false,
  );
  assert.equal(
    COURSE_G04_L03_TI_004_SOURCE_CONTRACT.replayParityEstablished,
    false,
  );
  assert.equal(
    COURSE_G04_L03_TI_004_SOURCE_CONTRACT.strictAcceptanceEffect,
    "none",
  );

  const captureMarkup = renderToStaticMarkup(createElement(ti004.Renderer, {
    entryStateSha256: "c".repeat(64),
    frame: 124,
    frameDomain: "sprite-274",
    requirementId: "engineering-source-static-frame-124",
    scenario: "source-static-frame",
    lang: "en",
    seed: 0,
    state: wholeLessonHostState,
    traceId: "engineering-source-static",
  }));
  assert.match(captureMarkup, /data-current-js-controls-enabled="false"/);
  assert.match(captureMarkup, /data-current-js-source-visual-frame="124"/);
  assert.match(captureMarkup, /data-flash-frame="124"/);
  assert.doesNotMatch(captureMarkup,
    /aria-label="Source-script-bound current JavaScript least-to-greatest card activity"/);
  assert.doesNotMatch(captureMarkup,
    /data-interaction-companion-surface="mobile"/);
});

test("TI006 adds a fail-closed functional overlay without changing capture evidence", () => {
  const wholeLessonHostState = getCourseG04L03Ti006FrameState(166, {
    frameDomain: "sprite-269",
    scenario: "source-static-frame",
    lang: "en",
    seed: 0,
  });
  const markup = renderToStaticMarkup(createElement(ti006.Renderer, {
    frame: 166,
    frameDomain: "sprite-269",
    scenario: "source-static-frame",
    lang: "en",
    seed: 0,
    state: wholeLessonHostState,
  }));
  assert.doesNotMatch(markup, /data-fail-closed-reason/);
  assert.match(markup, /<canvas/);
  assert.match(markup, /data-current-js-controls-enabled="true"/);
  assert.match(markup,
    /data-current-js-functional-scope="ti006-number-line-drag-source-script-bound"/);
  assert.match(markup, /data-current-js-source-visual-frame="165"/);
  assert.match(markup, /data-flash-frame="165"/);
  assert.match(markup, /aria-hidden="true"/);
  assert.match(markup, /data-current-js-controls-ready="false"/);
  assert.match(markup, /data-source-canvas-status="idle"/);
  assert.match(markup,
    /aria-label="Select Sapna Has \$5 to move"[^>]*disabled=""/);
  assert.match(markup,
    /aria-label="Place selected card at negative 6 on the number line"[^>]*disabled=""/);
  assert.match(markup,
    /aria-label="Open Need More Help"[^>]*disabled=""/);
  assert.match(markup, /data-interaction-companion-surface="mobile"/);
  assert.match(markup, /data-interaction-companion-placement="fallback"/);

  assert.notEqual(
    getCourseG04L03Ti006SourceCanvasRenderKey(0, 0, 165),
    getCourseG04L03Ti006SourceCanvasRenderKey(1, 0, 165),
  );
  assert.notEqual(
    getCourseG04L03Ti006SourceCanvasRenderKey(0, 0, 165),
    getCourseG04L03Ti006SourceCanvasRenderKey(0, 0, 166),
  );
  assert.equal(ti006.reducedMotionFrame, 166);
  assert.equal(
    COURSE_G04_L03_TI_006_SOURCE_CONTRACT
      .currentJavascriptInteractionStatus,
    "source-script-bound-functional-candidate",
  );
  assert.equal(
    COURSE_G04_L03_TI_006_SOURCE_CONTRACT.behaviorParityEstablished,
    false,
  );
  assert.equal(
    COURSE_G04_L03_TI_006_SOURCE_CONTRACT.replayParityEstablished,
    false,
  );
  assert.equal(
    COURSE_G04_L03_TI_006_SOURCE_CONTRACT.strictAcceptanceEffect,
    "none",
  );

  const captureMarkup = renderToStaticMarkup(createElement(ti006.Renderer, {
    entryStateSha256: "b".repeat(64),
    frame: 166,
    frameDomain: "sprite-269",
    requirementId: "engineering-source-static-frame-166",
    scenario: "source-static-frame",
    lang: "en",
    seed: 0,
    state: wholeLessonHostState,
    traceId: "engineering-source-static",
  }));
  assert.match(captureMarkup, /data-current-js-controls-enabled="false"/);
  assert.match(captureMarkup, /data-current-js-source-visual-frame="166"/);
  assert.match(captureMarkup, /data-flash-frame="166"/);
  assert.doesNotMatch(captureMarkup,
    /aria-label="Source-script-bound current JavaScript number-line card activity"/);
  assert.doesNotMatch(captureMarkup,
    /data-interaction-companion-surface="mobile"/);
});

test("TI002 through TI006 reject unsupported contexts and remain prototype-only", async () => {
  for (const page of pages) {
    const spanish = page.state(1, {frameDomain: page.domain,
      scenario: "source-static-frame", lang: "es", seed: 0});
    assert.equal(spanish.blocker, "spanish-visual-and-audio-unvalidated", page.id);
    const root = page.state(1, {frameDomain: "root",
      scenario: "root-unavailable", lang: "en", seed: 0});
    assert.equal(root.blocker, "root-baseline-unavailable", page.id);
    const manifest = matchPrototype({animationId: page.id});
    assert.equal(manifest?.movie.frameCount, page.frameCount, page.id);
    assert.equal(manifest?.title.en, page.title, page.id);
    const registered = await loadAnimationModule(page.id);
    assert.equal(registered?.maturity, "legacy-prototype", page.id);
    assert.equal(
      registered?.audioCues.length,
      1,
      page.id,
    );
    for (const [name, value] of Object.entries(page.authority)) {
      if (name === "registryIsPrototypeOnly" || name === "strictAcceptanceEffect") continue;
      assert.equal(value, false, `${page.id}:${name}`);
    }
  }
});
