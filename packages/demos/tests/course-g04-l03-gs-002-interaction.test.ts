import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import test from "node:test";

import gs002, {
  COURSE_G04_L03_GS_002_SOURCE_CONTRACT,
} from "../src/modules/course-g04-l03-gs-002";
import {
  COURSE_G04_L03_GS_002_ALLOWED_INITIAL_VIRUS_INDICES,
  COURSE_G04_L03_GS_002_CURRENT_JS_TIMING,
  COURSE_G04_L03_GS_002_FEEDBACK,
  COURSE_G04_L03_GS_002_HELP,
  COURSE_G04_L03_GS_002_INTERACTION_AUTHORITY,
  COURSE_G04_L03_GS_002_SHIP_Y,
  COURSE_G04_L03_GS_002_VIRUS_Y,
  courseG04L03Gs002ValueAtIndex,
  createCourseG04L03Gs002InteractionState,
  formatCourseG04L03Gs002Position,
  reduceCourseG04L03Gs002Interaction,
  type CourseG04L03Gs002InteractionState,
  type CourseG04L03Gs002Sign,
} from "../src/timelines/course-g04-l03-gs-002-interaction";
import {
  COURSE_G04_L03_GS_002_INTERACTION_BASE_CONFIG,
} from "../src/timelines/course-g04-l03-gs-002";

const sha256 = (value: Uint8Array | string) =>
  createHash("sha256").update(value).digest("hex");

const setSign = (
  state: CourseG04L03Gs002InteractionState,
  sign: CourseG04L03Gs002Sign,
) => reduceCourseG04L03Gs002Interaction(state, {type: "set-sign", sign});

const setDistance = (
  state: CourseG04L03Gs002InteractionState,
  value: string,
) => reduceCourseG04L03Gs002Interaction(state, {
  type: "set-distance",
  value,
});

const submit = (state: CourseG04L03Gs002InteractionState) =>
  reduceCourseG04L03Gs002Interaction(state, {type: "submit-move"});

const movementStep = (state: CourseG04L03Gs002InteractionState) =>
  reduceCourseG04L03Gs002Interaction(state, {type: "movement-step"});

const timerTick = (state: CourseG04L03Gs002InteractionState) =>
  reduceCourseG04L03Gs002Interaction(state, {type: "timer-tick"});

test("GS002 preserves the exact source arrays, copy, index direction, and nominal frame deductions", () => {
  assert.deepEqual(COURSE_G04_L03_GS_002_SHIP_Y, [
    -177.35, -154.35, -130.35, -106.35, -82.35,
    -58.35, -33.35, -7.35, 16.65, 42.65,
    67.65, 91.65, 117.65, 140.65, 166.65,
  ]);
  assert.deepEqual(COURSE_G04_L03_GS_002_VIRUS_Y, [
    -174.1, -151.1, -127.1, -103.1, -79.1,
    -55.1, -30.1, -4.1, 19.9, 45.9,
    70.9, 94.9, 120.9, 143.9, 169.9,
  ]);
  assert.deepEqual(COURSE_G04_L03_GS_002_ALLOWED_INITIAL_VIRUS_INDICES,
    [0, 1, 2, 3, 4, 5, 6, 8, 9, 10, 11, 12, 13, 14]);
  assert.deepEqual(COURSE_G04_L03_GS_002_FEEDBACK, {
    missingSign:
      "You need to choose whether the number is positive or negative.",
    missingNumber: "You need to enter the number in the number field.",
    zeroDistance: "Enter a number from 1 to 14. Zero does not move the ship.",
    lowerBoundary: "The ship can not go any lower.",
    upperBoundary: "The ship can not go any higher.",
  });
  assert.deepEqual(COURSE_G04_L03_GS_002_HELP, [
    "Positive numbers make the space coupe go up.",
    "Negative numbers make the space coupe go down.",
  ]);
  assert.equal(COURSE_G04_L03_GS_002_CURRENT_JS_TIMING.movementStepMs,
    750);
  assert.equal(COURSE_G04_L03_GS_002_CURRENT_JS_TIMING.hitResolutionMs,
    900);
  assert.equal(courseG04L03Gs002ValueAtIndex(0), 7);
  assert.equal(courseG04L03Gs002ValueAtIndex(7), 0);
  assert.equal(courseG04L03Gs002ValueAtIndex(14), -7);
  assert.equal(formatCourseG04L03Gs002Position(0), "+7");
  assert.equal(formatCourseG04L03Gs002Position(7), "0");
  assert.equal(formatCourseG04L03Gs002Position(14), "-7");
});

test("GS002 initial state keeps the existing seed-modulo-fourteen visual mapping", () => {
  for (const seed of [0, 1, 6, 7, 13, 14, 29]) {
    const state = createCourseG04L03Gs002InteractionState(seed);
    const expected = COURSE_G04_L03_GS_002_ALLOWED_INITIAL_VIRUS_INDICES[
      (seed >>> 0)
        % COURSE_G04_L03_GS_002_ALLOWED_INITIAL_VIRUS_INDICES.length
    ];
    assert.equal(state.seed, seed >>> 0);
    assert.equal(state.shipIndex, 7);
    assert.equal(state.virusIndex, expected);
    assert.equal(state.initialVirusIndex, expected);
    assert.equal(state.drawCount, 1);
    assert.equal(state.timerDisplay, "00:04:00");
    assert.equal(state.mode, "ready");
  }

  assert.equal(createCourseG04L03Gs002InteractionState(-1).seed,
    4_294_967_295);
  assert.equal(createCourseG04L03Gs002InteractionState(Number.NaN).seed, 0);
});

test("GS002 input is source-restricted to two digits and validation preserves exact feedback", () => {
  let state = createCourseG04L03Gs002InteractionState(0);
  state = setDistance(state, "a1-2b3");
  assert.equal(state.distanceInput, "12");
  state = setDistance(state, "");

  state = submit(state);
  assert.equal(state.mode, "feedback");
  assert.equal(state.feedbackText, COURSE_G04_L03_GS_002_FEEDBACK.missingSign);
  assert.equal(setSign(state, "+"), state);

  state = reduceCourseG04L03Gs002Interaction(state, {type: "close-feedback"});
  state = setSign(state, "+");
  state = submit(state);
  assert.equal(state.mode, "feedback");
  assert.equal(state.feedbackText,
    COURSE_G04_L03_GS_002_FEEDBACK.missingNumber);

  state = reduceCourseG04L03Gs002Interaction(state, {type: "close-feedback"});
  state = setDistance(state, "8");
  state = submit(state);
  assert.equal(state.feedbackText,
    COURSE_G04_L03_GS_002_FEEDBACK.upperBoundary);
  assert.equal(state.sign, "+");
  assert.equal(state.distanceInput, "8");

  state = reduceCourseG04L03Gs002Interaction(state, {type: "close-feedback"});
  state = setSign(state, "-");
  state = submit(state);
  assert.equal(state.feedbackText,
    COURSE_G04_L03_GS_002_FEEDBACK.lowerBoundary);
});

test("GS002 plus moves up, minus moves down, and a legal miss silently re-enables controls", () => {
  let plus = createCourseG04L03Gs002InteractionState(0);
  plus = setSign(plus, "+");
  plus = setDistance(plus, "2");
  plus = submit(plus);
  assert.equal(plus.plannedTargetIndex, 5);
  assert.equal(plus.remainingMoveCount, 2);
  plus = movementStep(plus);
  assert.equal(plus.shipIndex, 6);
  assert.equal(plus.mode, "moving");
  plus = movementStep(plus);
  assert.equal(plus.shipIndex, 5);
  assert.equal(plus.mode, "ready");
  assert.equal(plus.score, 0);
  assert.equal(plus.feedbackText, null);
  assert.equal(plus.sign, null);
  assert.equal(plus.distanceInput, "");

  let minus = createCourseG04L03Gs002InteractionState(0);
  minus = setSign(minus, "-");
  minus = setDistance(minus, "1");
  minus = movementStep(submit(minus));
  assert.equal(minus.shipIndex, 8);
  assert.equal(minus.mode, "ready");
});

test("GS002 rejects zero instead of moving the ship by a hidden extra step", () => {
  let state = createCourseG04L03Gs002InteractionState(0);
  state = setSign(state, "+");
  state = setDistance(state, "0");
  state = submit(state);
  assert.equal(state.plannedTargetIndex, null);
  assert.equal(state.remainingMoveCount, 0);
  assert.equal(state.shipIndex, 7);
  assert.equal(state.mode, "feedback");
  assert.equal(
    state.feedbackText,
    COURSE_G04_L03_GS_002_FEEDBACK.zeroDistance,
  );
  assert.equal(state.score, 0);
});

test("GS002 hit increments score exactly once and draws a reproducible target excluding the ship", () => {
  const run = () => {
    let state = createCourseG04L03Gs002InteractionState(0);
    state = setSign(state, "+");
    state = setDistance(state, "7");
    state = submit(state);
    for (let step = 0; step < 7; step += 1) state = movementStep(state);
    assert.equal(state.shipIndex, 0);
    assert.equal(state.mode, "hit-resolving");
    assert.equal(state.score, 1);
    assert.equal(state.drawCount, 1);
    state = reduceCourseG04L03Gs002Interaction(state, {type: "resolve-hit"});
    assert.equal(state.mode, "ready");
    assert.equal(state.score, 1);
    assert.equal(state.drawCount, 2);
    assert.notEqual(state.virusIndex, state.shipIndex);
    return state;
  };

  assert.deepEqual(run(), run());
});

test("GS002 pauses its product timer while the learner reads help", () => {
  let state = createCourseG04L03Gs002InteractionState(0);
  state = reduceCourseG04L03Gs002Interaction(state, {type: "open-help"});
  assert.equal(state.mode, "help");
  assert.equal(setDistance(state, "1"), state);
  state = timerTick(state);
  assert.equal(state.mode, "help");
  assert.equal(state.timerDisplay, "00:04:00");
  state = reduceCourseG04L03Gs002Interaction(state, {type: "close-help"});
  assert.equal(state.mode, "ready");
});

test("GS002 timer shows a standard four-minute countdown and expires on tick 240", () => {
  let state = createCourseG04L03Gs002InteractionState(0);
  assert.equal(state.timerDisplay, "00:04:00");
  state = timerTick(state);
  assert.equal(state.timerDisplay, "00:03:59");
  assert.equal(state.timerMinutes, 3);
  assert.equal(state.timerSeconds, 59);

  while (state.timerTickCount < 60) state = timerTick(state);
  assert.equal(state.timerDisplay, "00:03:00");
  assert.equal(state.timerSeconds, 0);
  state = timerTick(state);
  assert.equal(state.timerDisplay, "00:02:59");
  assert.equal(state.timerMinutes, 2);
  assert.equal(state.timerSeconds, 59);

  while (state.timerTickCount < 239) state = timerTick(state);
  assert.equal(state.timerDisplay, "00:00:01");
  assert.equal(state.mode, "ready");
  state = timerTick(state);
  assert.equal(state.timerTickCount, 240);
  assert.equal(state.timerDisplay, "00:00:00");
  assert.equal(state.mode, "expired");
  assert.equal(timerTick(state), state);
});

test("GS002 elapsed-time reducer advances concurrent nominal timer, movement, and hit resolution deterministically", () => {
  let state = createCourseG04L03Gs002InteractionState(0);
  state = setSign(state, "+");
  state = setDistance(state, "7");
  state = submit(state);
  state = reduceCourseG04L03Gs002Interaction(state, {
    type: "advance-time",
    elapsedMs:
      COURSE_G04_L03_GS_002_CURRENT_JS_TIMING.movementStepMs * 7,
  });
  assert.equal(state.shipIndex, 0);
  assert.equal(state.mode, "hit-resolving");
  assert.equal(state.score, 1);
  assert.equal(state.timerTickCount, 5);

  state = reduceCourseG04L03Gs002Interaction(state, {
    type: "advance-time",
    elapsedMs: COURSE_G04_L03_GS_002_CURRENT_JS_TIMING.hitResolutionMs,
  });
  assert.equal(state.mode, "ready");
  assert.equal(state.drawCount, 2);
  assert.equal(state.timerTickCount, 6);
});

test("GS002 New Game advances its target while host Replay remains seed-exact", () => {
  const initial = createCourseG04L03Gs002InteractionState(13);
  let changed = setSign(initial, "-");
  changed = setDistance(changed, "1");
  changed = movementStep(submit(changed));
  changed = timerTick(timerTick(changed));

  const newGame = reduceCourseG04L03Gs002Interaction(changed, {
    type: "new-game",
  });
  const replay = reduceCourseG04L03Gs002Interaction(changed, {type: "replay"});
  assert.equal(newGame.seed, initial.seed);
  assert.equal(newGame.shipIndex, 7);
  assert.equal(newGame.score, 0);
  assert.equal(newGame.timerDisplay, "00:04:00");
  assert.equal(newGame.mode, "ready");
  assert.equal(newGame.drawCount, initial.drawCount + 1);
  assert.notEqual(newGame.rngState, initial.rngState);
  assert.deepEqual(replay, initial);
  assert.deepEqual(
    reduceCourseG04L03Gs002Interaction(changed, {type: "replay", seed: 0}),
    createCourseG04L03Gs002InteractionState(0),
  );
});

test("GS002 state is immutable and every acceptance/audio/runtime claim remains false", () => {
  const state = createCourseG04L03Gs002InteractionState(0);
  const next = setSign(state, "+");
  assert.equal(Object.isFrozen(state), true);
  assert.equal(Object.isFrozen(next), true);
  assert.notEqual(next, state);
  assert.equal(
    COURSE_G04_L03_GS_002_INTERACTION_AUTHORITY.deterministicRandomExecutesAvm1Random,
    false,
  );
  assert.equal(
    COURSE_G04_L03_GS_002_INTERACTION_AUTHORITY.nominalTimingIsOriginalRuntimeTrace,
    false,
  );
  assert.equal(COURSE_G04_L03_GS_002_INTERACTION_AUTHORITY.audioModeled,
    false);
  assert.equal(COURSE_G04_L03_GS_002_INTERACTION_AUTHORITY.spanishImplemented,
    false);
  assert.equal(
    COURSE_G04_L03_GS_002_INTERACTION_AUTHORITY.terminalFrameReachabilityEstablished,
    false,
  );
  assert.equal(
    COURSE_G04_L03_GS_002_INTERACTION_AUTHORITY.behaviorParityEstablished,
    false,
  );
  assert.equal(
    COURSE_G04_L03_GS_002_INTERACTION_AUTHORITY.replayParityEstablished,
    false,
  );
  assert.equal(COURSE_G04_L03_GS_002_INTERACTION_AUTHORITY.ownerAccepted,
    false);
  assert.equal(
    COURSE_G04_L03_GS_002_INTERACTION_AUTHORITY.strictMigrationComplete,
    false,
  );
  assert.equal(
    COURSE_G04_L03_GS_002_INTERACTION_AUTHORITY.strictAcceptanceEffect,
    "none",
  );
});

test("GS002 interaction base successor preserves the hash-bound renderer and stops at source sprite321 case426", async () => {
  const publicDirectory = new URL(
    "../../../public/flash-assets/courses/course-g04-l03-gs-002/",
    import.meta.url,
  );
  const webPublicDirectory = new URL(
    "../../../apps/web/public/flash-assets/courses/course-g04-l03-gs-002/",
    import.meta.url,
  );
  const [
    preservedRenderer,
    preservedManifest,
    successorRenderer,
    successorWebMirror,
    successorManifestBytes,
  ] = await Promise.all([
    readFile(new URL("canvas-renderer.js", publicDirectory)),
    readFile(new URL("manifest.json", publicDirectory)),
    readFile(new URL("canvas-interaction-base-renderer.js", publicDirectory)),
    readFile(new URL("canvas-interaction-base-renderer.js", webPublicDirectory)),
    readFile(new URL("interaction-base-manifest.json", publicDirectory)),
  ]);

  assert.equal(
    sha256(preservedRenderer),
    "1c806e2fdeb026edb5b0109ab24bac3689918894b3d7e38fe17503dfbbc1bfb1",
  );
  assert.equal(
    sha256(preservedManifest),
    "9b86419df3759272b368e91b20e1ba459585f14749e5f90e978fbba4abbc585a",
  );
  assert.equal(
    sha256(successorRenderer),
    COURSE_G04_L03_GS_002_INTERACTION_BASE_CONFIG.assetSha256,
  );
  assert.deepEqual(successorWebMirror, successorRenderer);

  const source = successorRenderer.toString("utf8");
  assert.match(source, /frame !== 427/);
  assert.match(source, /sourceSpriteExportFrame: 426/);
  assert.match(source, /sourceLocalGameInitialStateDrawn: false/);
  const case426Start = source.indexOf("\t\tcase 426:");
  const case427Start = source.indexOf("\t\tcase 427:", case426Start);
  assert.ok(case426Start > 0);
  assert.ok(case427Start > case426Start);
  const case426 = source.slice(case426Start, case427Start);
  assert.doesNotMatch(case426, /place\("sprite48"/);
  assert.doesNotMatch(case426, /place\("sprite69"/);

  const renderStart = source.indexOf("function render(targetCanvas, request)");
  const registryStart = source.indexOf(
    'var registry = global["HELP_MATH_CANVAS_ASSETS"]',
    renderStart,
  );
  assert.ok(renderStart > 0);
  assert.ok(registryStart > renderStart);
  const renderFunction = source.slice(renderStart, registryStart);
  assert.match(
    renderFunction,
    /sprite321\(ctx, new cxform\([^\n]+state\.exportFrame/,
  );
  assert.doesNotMatch(renderFunction, /drawSourceLocalGameInitialState/);
  assert.match(
    renderFunction,
    /data-current-js-game-base", "source-sprite321-case426-clean-base"/,
  );

  const successorManifest = JSON.parse(
    successorManifestBytes.toString("utf8"),
  );
  assert.equal(successorManifest.successor.rendererSha256,
    sha256(successorRenderer));
  assert.equal(successorManifest.preservedPredecessor.rendererSha256,
    sha256(preservedRenderer));
  assert.equal(successorManifest.preservedPredecessor.modifiedBySuccessor,
    false);
  assert.equal(successorManifest.compositionContract.callsDrawSourceLocalGameInitialState,
    false);
  assert.equal(successorManifest.compositionContract.usesHeuristicPixelInterpolationOrActorErasure,
    false);
  assert.equal(successorManifest.acceptance.behaviorParityEstablished, false);
  assert.equal(successorManifest.acceptance.ownerAccepted, false);
  assert.equal(successorManifest.acceptance.strictMigrationComplete, false);
  assert.equal(successorManifest.acceptance.strictAcceptanceEffect, "none");
});

test("GS002 ordinary English frame-427 playback exposes one viewport-appropriate semantic control surface", () => {
  const markup = renderToStaticMarkup(createElement(gs002.Renderer, {
    frame: 427,
    frameDomain: "sprite-321",
    scenario: "source-static-frame",
    lang: "en",
    seed: 0,
    paused: false,
    reducedMotion: false,
  }));

  assert.match(markup, /data-current-js-controls-enabled="true"/);
  assert.match(
    markup,
    /data-course-canvas="course-g04-l03-gs-002-interaction-base"/,
  );
  assert.doesNotMatch(
    markup,
    /data-course-canvas="course-g04-l03-gs-002"/,
  );
  assert.match(markup, /data-current-js-functional-candidate="true"/);
  assert.match(markup, /aria-label="Move the space ship to the target"/);
  assert.match(markup, /type="radio"/);
  assert.match(markup, /aria-label="Positive"/);
  assert.match(markup, /aria-label="Negative"/);
  assert.match(markup, /aria-label="Number of spaces"/);
  assert.match(markup, /inputMode="numeric"|inputmode="numeric"/);
  assert.match(markup, /maxLength="2"|maxlength="2"/);
  assert.match(markup, /aria-label="Go"/);
  assert.match(markup, /aria-label="New Game"/);
  assert.match(markup, /aria-label="Need More Help"/);
  assert.match(markup,
    /aria-label="Mobile controls for moving the space ship to the target"/);
  assert.match(markup, /course-g04-l03-gs-002-mobile-controls/);
  assert.match(markup, /min-height:\s*48px/);
  assert.match(markup,
    /data-timing-authority="current-js-product-clock-and-source-informed-movement-not-original-runtime-trace"/);
  assert.doesNotMatch(markup, /data-source-sprite-mask=/);
  assert.match(markup, /course-g04-l03-gs-002-hit-feedback/);
  assert.match(markup,
    /data-source-sprite-sha256="06c707e65cfd9a9c8fd7b13cd1570c12ed9e2185f4c20fbb8e2c532ee00abeaa"/);
  assert.match(markup,
    /data-source-sprite-sha256="4e3f9ed24e5c1b637ef9a56089a58d9c2bdef55d71588825e80fd0efcb8404fe"/);
  const sourceSpriteImages = [
    ...markup.matchAll(
      /<img\b[^>]*data-source-sprite-sha256="[^"]+"[^>]*>/g,
    ),
  ].map(([tag]) => tag);
  assert.equal(sourceSpriteImages.length, 2);
  for (const tag of sourceSpriteImages) {
    const declaredSha256 = tag.match(
      /data-source-sprite-sha256="([a-f0-9]{64})"/,
    )?.[1];
    const base64 = tag.match(
      /src="data:image\/png;base64,([A-Za-z0-9+/=]+)"/,
    )?.[1];
    assert.ok(declaredSha256);
    assert.ok(base64);

    const png = Buffer.from(base64, "base64");
    assert.equal(png.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
    assert.equal(
      png.subarray(-12).toString("hex"),
      "0000000049454e44ae426082",
    );
    assert.equal(sha256(png), declaredSha256);
  }
  assert.equal(gs002.reducedMotionFrame, 427);
});

test("GS002 keeps standalone mobile controls but defers a declared companion until its client host resolves", () => {
  const standaloneMarkup = renderToStaticMarkup(createElement(gs002.Renderer, {
    frame: 427,
    frameDomain: "sprite-321",
    scenario: "source-static-frame",
    lang: "en",
    seed: 0,
  }));
  const hostedMarkup = renderToStaticMarkup(createElement(gs002.Renderer, {
    frame: 427,
    frameDomain: "sprite-321",
    scenario: "source-static-frame",
    lang: "en",
    seed: 0,
    pageInteractionCompanionTargetId: "g4-l3-page-interaction-companion",
  }));

  assert.match(
    standaloneMarkup,
    /data-page-interaction-companion-surface="gs002-mobile"/,
  );
  assert.doesNotMatch(
    hostedMarkup,
    /data-page-interaction-companion-surface="gs002-mobile"/,
  );
  assert.match(hostedMarkup, /data-current-js-controls-enabled="true"/);
});

test("GS002 hash-bound capture, Spanish, pre-game, and wrong-domain paths keep interaction absent", () => {
  for (const props of [
    {
      frame: 427,
      frameDomain: "sprite-321",
      scenario: "source-static-frame",
      lang: "en" as const,
      seed: 0,
      entryStateSha256: "a".repeat(64),
    },
    {
      frame: 427,
      frameDomain: "sprite-321",
      scenario: "source-static-frame",
      lang: "es" as const,
      seed: 0,
    },
    {
      frame: 426,
      frameDomain: "sprite-321",
      scenario: "source-static-frame",
      lang: "en" as const,
      seed: 0,
    },
    {
      frame: 1,
      frameDomain: "root",
      scenario: "root-unavailable",
      lang: "en" as const,
      seed: 0,
    },
  ]) {
    const markup = renderToStaticMarkup(createElement(gs002.Renderer, props));
    assert.match(markup, /data-current-js-controls-enabled="false"/);
    assert.doesNotMatch(markup, /data-current-js-functional-candidate="true"/);
    assert.doesNotMatch(markup,
      /aria-label="Move the space ship to the target"/);
  }

  const evidenceMarkup = renderToStaticMarkup(createElement(gs002.Renderer, {
    frame: 427,
    frameDomain: "sprite-321",
    scenario: "source-static-frame",
    lang: "en",
    seed: 0,
    entryStateSha256: "a".repeat(64),
  }));
  assert.match(
    evidenceMarkup,
    /data-course-canvas="course-g04-l03-gs-002"/,
  );
  assert.doesNotMatch(
    evidenceMarkup,
    /data-course-canvas="course-g04-l03-gs-002-interaction-base"/,
  );
});

test("GS002 functional scope advances current JS only and leaves every legacy acceptance boundary false", () => {
  assert.equal(
    COURSE_G04_L03_GS_002_SOURCE_CONTRACT.currentJavascriptInteractionStatus,
    "source-script-bound-functional-candidate",
  );
  assert.deepEqual(
    COURSE_G04_L03_GS_002_SOURCE_CONTRACT.currentJavascriptInteractionScope,
    [
      "positive-negative-direction-choice",
      "two-digit-source-restricted-input",
      "exact-source-validation-feedback",
      "nominal-source-frame-deduced-step-movement",
      "hit-scoring-and-deterministic-next-target",
      "current-javascript-standard-four-minute-timer-and-expiry",
      "current-javascript-crisp-single-actor-layer",
      "source-sprite321-case426-clean-base-without-pixel-interpolation",
      "current-javascript-visible-hit-and-score-feedback",
      "need-more-help-text-dialog",
      "whole-renderer-new-game-and-host-replay-reset",
      "host-pause-freezes-current-javascript-clock",
      "responsive-mobile-touch-control-surface",
    ],
  );
  assert.deepEqual(
    COURSE_G04_L03_GS_002_SOURCE_CONTRACT.interactionBaseSuccessor,
    {
      animationId: "course-g04-l03-gs-002-interaction-base",
      assetSource:
        "/flash-assets/courses/course-g04-l03-gs-002/canvas-interaction-base-renderer.js",
      assetSha256:
        "7e4d352d925c65b1ba1d3d1329d95c690e27be4e2ed01e6683b10c2c12cd4797",
      manifestSource:
        "public/flash-assets/courses/course-g04-l03-gs-002/interaction-base-manifest.json",
      manifestSha256:
        "c248508d8e8fc42fc533f90ff2746849c8456b377d2786cedc99a3742e688b7e",
      publicFrame: 427,
      sourceSpriteObjectId: 321,
      sourceSpriteExportFrame: 426,
      sourceLocalGameInitialStateDrawn: false,
      reactOwnsActorsTimerAndScore: true,
      preservedRendererAssetSha256:
        "1c806e2fdeb026edb5b0109ab24bac3689918894b3d7e38fe17503dfbbc1bfb1",
      acceptanceEffect: "none",
    },
  );
  assert.equal(
    COURSE_G04_L03_GS_002_SOURCE_CONTRACT.associatedAudioStatus,
    "inventoried-unimplemented-unaccepted",
  );
  assert.equal(
    COURSE_G04_L03_GS_002_SOURCE_CONTRACT.spanishInteractionStatus,
    "unimplemented-disabled",
  );
  assert.equal(
    COURSE_G04_L03_GS_002_SOURCE_CONTRACT.terminalFrameReachabilityEstablished,
    false,
  );
  assert.equal(
    COURSE_G04_L03_GS_002_SOURCE_CONTRACT.behaviorParityEstablished,
    false,
  );
  assert.equal(
    COURSE_G04_L03_GS_002_SOURCE_CONTRACT.humanVisualReviewAccepted,
    false,
  );
  assert.equal(COURSE_G04_L03_GS_002_SOURCE_CONTRACT.ownerAccepted, false);
  assert.equal(
    COURSE_G04_L03_GS_002_SOURCE_CONTRACT.strictAcceptanceEffect,
    "none",
  );
});
