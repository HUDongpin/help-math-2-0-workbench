import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {loadAnimationModule} from "../src/animation-registry";
import courseIn008, {
  COURSE_G04_L03_IN_008_MOVIE,
  COURSE_G04_L03_IN_008_RUNTIME,
  COURSE_G04_L03_IN_008_SOURCE,
  COURSE_G04_L03_IN_008_SOURCE_CONTRACT,
  buildCourseG04L03In008CaptureAttributes,
  getCourseG04L03In008FrameState,
  normalizeCourseG04L03In008Frame,
} from "../src/modules/course-g04-l03-in-008";
import {matchPrototype} from "../src/prototype-manifest";
import {COURSE_G04_L03_IN_008_AUTHORITY} from "../src/timelines/course-g04-l03-in-008";

const repositoryRoot = fileURLToPath(new URL("../../../", import.meta.url));
const sha256 = (bytes: Uint8Array) =>
  createHash("sha256").update(bytes).digest("hex");

const expectedCompanionDomains = [
  ["sprite-5", 1],
  ["sprite-52", 1],
  ["sprite-54", 55],
  ["sprite-56", 20],
] as const;

test("IN008 preserves the root, sprite-57, random quiz, and domain facts", async () => {
  assert.deepEqual(COURSE_G04_L03_IN_008_MOVIE.stage, {width: 800, height: 600});
  assert.equal(COURSE_G04_L03_IN_008_MOVIE.fps, 12);
  assert.equal(COURSE_G04_L03_IN_008_MOVIE.frameCount, 217);
  assert.equal(COURSE_G04_L03_IN_008_RUNTIME.frameCount, 10);
  assert.equal(COURSE_G04_L03_IN_008_RUNTIME.defaultFrameDomain, "sprite-57");
  assert.deepEqual(COURSE_G04_L03_IN_008_RUNTIME.frameDomains, [
    {id: "sprite-57", frameCount: 217, fps: 12, rootFrame: 6},
    ...expectedCompanionDomains.map(([id, frameCount]) =>
      ({id, frameCount, fps: 12, rootFrame: 6})),
  ]);
  assert.deepEqual(COURSE_G04_L03_IN_008_SOURCE.buttonObjectIds, [19, 35, 37, 49]);
  assert.equal(COURSE_G04_L03_IN_008_SOURCE.randomCalls.length, 2);
  assert.equal(COURSE_G04_L03_IN_008_SOURCE.quizSourceData.length, 5);
  assert.deepEqual(COURSE_G04_L03_IN_008_SOURCE.quizSourceData[0], {
    label: "10, 5, 0, -5,",
    answers: "-10~-15",
    decrement: 5,
  });
  assert.equal(COURSE_G04_L03_IN_008_SOURCE.embeddedAudioStreamSha256.length, 4);
  assert.equal(courseIn008.runtime, COURSE_G04_L03_IN_008_RUNTIME);
  assert.equal(courseIn008.reducedMotionFrame, 216);
  assert.equal(courseIn008.playbackEndFrameByDomain?.["sprite-57"], 216);
  assert.equal(courseIn008.playbackEndFrameByDomain?.root, 1);
  for (const [path, expected] of [
    [COURSE_G04_L03_IN_008_SOURCE.swf, COURSE_G04_L03_IN_008_SOURCE.swfSha256],
    [COURSE_G04_L03_IN_008_SOURCE.fla, COURSE_G04_L03_IN_008_SOURCE.flaSha256],
    [COURSE_G04_L03_IN_008_SOURCE.associatedAudio,
      COURSE_G04_L03_IN_008_SOURCE.associatedAudioSha256],
    [COURSE_G04_L03_IN_008_SOURCE.sourceLocalPatternQuizContract,
      COURSE_G04_L03_IN_008_SOURCE.sourceLocalPatternQuizContractSha256],
  ] as const) {
    assert.equal(sha256(await readFile(`${repositoryRoot}${path}`)), expected);
  }
});

test("IN008 exposes pre-quiz frames as source-static drawings", () => {
  assert.equal(normalizeCourseG04L03In008Frame(Number.NaN), 1);
  assert.equal(normalizeCourseG04L03In008Frame(218), 217);
  assert.equal(normalizeCourseG04L03In008Frame(6, "root"), 6);
  assert.equal(normalizeCourseG04L03In008Frame(56, "sprite-54"), 55);
  for (const [frame, seed] of [[1, 0], [215, -1]] as const) {
    const state = getCourseG04L03In008FrameState(frame, {
      frameDomain: "sprite-57",
      scenario: "source-static-frame",
      lang: "en",
      seed,
    });
    assert.equal(state.status, "ready");
    assert.equal(state.frame, frame);
    assert.equal(state.exportFrame, frame - 1);
    assert.deepEqual(state.visibleSourceMarkers,
      ["patterns-instruction-source-static-drawing"]);
    assert.equal(state.seed, seed === -1 ? 4_294_967_295 : 0);
    assert.equal(state.interactiveControlsEnabled, false);
    assert.equal(state.audioRendered, false);
  }
});

test("IN008 exposes the source-local initial quiz and post-stop inspection", () => {
  for (const frame of [216, 217]) {
    const state = getCourseG04L03In008FrameState(frame, {
      frameDomain: "sprite-57",
      scenario: "source-static-frame",
      lang: "en",
      seed: 7,
    });
    assert.equal(state.status, "ready");
    assert.equal(state.blocker, null);
    assert.deepEqual(state.visibleSourceMarkers, [frame === 216
      ? "patterns-quiz-source-local-initial-state"
      : "patterns-quiz-post-stop-static-inspection"]);
    assert.equal(state.seed, 7);
    assert.equal(state.interactiveControlsEnabled, false);
    assert.equal(state.audioRendered, false);
  }
  assert.equal(COURSE_G04_L03_IN_008_SOURCE_CONTRACT.blockedSourceBehaviorFrameCount, 0);
  assert.equal(COURSE_G04_L03_IN_008_SOURCE_CONTRACT.livePlaybackEndFrame, 216);
});

test("IN008 fails closed for Spanish, root, companions, and mismatches", () => {
  const requests = [
    ["sprite-57", "source-static-frame", "es", "spanish-visual-and-audio-unvalidated"],
    ["root", "root-unavailable", "en", "root-baseline-unavailable"],
    ["sprite-54", "sprite-54-unavailable", "en", "companion-domain-unrendered"],
    ["sprite-48", "sprite-48-unavailable", "en", "unsupported-runtime-request"],
    ["root", "source-static-frame", "en", "frame-domain-scenario-mismatch"],
  ] as const;
  for (const [frameDomain, scenario, lang, blocker] of requests) {
    const state = getCourseG04L03In008FrameState(1, {
      frameDomain,
      scenario,
      lang,
      seed: 0,
    });
    assert.equal(state.blocker, blocker);
  }
});

test("IN008 capture identity binds seed for the source-local quiz drawing", () => {
  const ready = getCourseG04L03In008FrameState(215, {
    frameDomain: "sprite-57",
    scenario: "source-static-frame",
    lang: "en",
    seed: 7,
  });
  const attributes = buildCourseG04L03In008CaptureAttributes({
    canvasStatus: "ready",
    entryStateSha256: "a".repeat(64),
    requirementId: "engineering-source-static-frame-215",
    state: ready,
    traceId: "engineering-source-static",
  });
  assert.equal(attributes["data-capture-stage"], "true");
  assert.equal(attributes["data-runtime-seed"], 7);
  assert.equal(attributes["data-source-controls-enabled"], "false");
  const quiz = getCourseG04L03In008FrameState(216, {
    frameDomain: "sprite-57",
    scenario: "source-static-frame",
    lang: "en",
    seed: 7,
  });
  const quizAttributes = buildCourseG04L03In008CaptureAttributes({
    canvasStatus: "ready",
    entryStateSha256: "a".repeat(64),
    requirementId: "engineering-source-static-frame-216",
    state: quiz,
    traceId: "engineering-source-static",
  });
  assert.equal(quizAttributes["data-capture-stage"], "true");
  assert.equal(quizAttributes["data-runtime-seed"], 7);
});

test("IN008 remains prototype-only with source-script-bound current-JS behavior and every acceptance gate closed", async () => {
  const rendererSource = await readFile(
    `${repositoryRoot}packages/demos/src/modules/course-g04-l03-in-008.tsx`,
    "utf8",
  );
  const manifest = matchPrototype({animationId: "course-g04-l03-in-008"});
  assert.equal(manifest?.runtime.frameCount, 10);
  assert.equal(manifest?.runtime.frameDomains?.length, 5);
  assert.equal(manifest?.movie.frameCount, 217);
  assert.equal(manifest?.title.en, "Patterns");
  assert.equal(matchPrototype({sourcePath: "/unknown/L3IN08.swf"}), undefined);
  const registered = await loadAnimationModule("course-g04-l03-in-008");
  assert.equal(registered?.maturity, "legacy-prototype");
  assert.equal(registered?.audioCues.length, 1);
  for (const [name, value] of Object.entries(COURSE_G04_L03_IN_008_AUTHORITY)) {
    if (name === "registryIsPrototypeOnly" || name === "strictAcceptanceEffect") continue;
    assert.equal(value, false, name);
  }
  assert.equal(COURSE_G04_L03_IN_008_AUTHORITY.registryIsPrototypeOnly, true);
  const quizMarkup = renderToStaticMarkup(
    createElement(courseIn008.Renderer, {
      frame: 216,
      frameDomain: "sprite-57",
      scenario: "source-static-frame",
      lang: "en",
      seed: 7,
      pageInteractionCompanionTargetId:
        "g4-l3-page-interaction-companion",
    }),
  );
  assert.match(quizMarkup, /data-render-state="idle"/);
  assert.match(quizMarkup, /data-audio-rendered="false"/);
  assert.match(quizMarkup, /data-owner-accepted="false"/);
  assert.match(quizMarkup, /data-current-js-controls-enabled="true"/);
  assert.match(quizMarkup, /data-current-js-functional-candidate="true"/);
  assert.match(quizMarkup, /data-behavior-parity-established="false"/);
  assert.match(quizMarkup, /aria-label="First missing number"/);
  assert.match(quizMarkup, /aria-label="Second missing number"/);
  assert.match(quizMarkup, /aria-label="Check Answer"/);
  assert.match(quizMarkup, /aria-label="New Problem"/);
  assert.match(quizMarkup, /data-interaction-companion-surface="mobile"/);
  assert.match(
    quizMarkup,
    /data-interaction-companion-placement="fallback"/,
  );
  assert.match(quizMarkup, /course-g04-l03-in-008-stage-controls/);
  assert.match(quizMarkup, /min-height:\s*48px/);
  assert.match(quizMarkup, /<canvas/);
  assert.equal((quizMarkup.match(/<input/g) ?? []).length, 4);
  assert.match(rendererSource, /createPortal\(mobileSurface, companionTarget\)/);
  assert.match(
    rendererSource,
    /canvas\.setAttribute\("aria-hidden", "true"\)/,
  );
  assert.doesNotMatch(rendererSource, /#e4f6d8/);
  assert.equal(
    COURSE_G04_L03_IN_008_SOURCE_CONTRACT.currentJavascriptInteractionStatus,
    "source-script-bound-functional-candidate",
  );
  assert.equal(
    COURSE_G04_L03_IN_008_SOURCE_CONTRACT.behaviorParityEstablished,
    false,
  );

  const captureMarkup = renderToStaticMarkup(
    createElement(courseIn008.Renderer, {
      entryStateSha256: "a".repeat(64),
      frame: 216,
      frameDomain: "sprite-57",
      requirementId: "engineering-source-static-frame-216",
      scenario: "source-static-frame",
      lang: "en",
      seed: 7,
      traceId: "engineering-source-static",
    }),
  );
  assert.match(captureMarkup, /data-current-js-controls-enabled="false"/);
  assert.doesNotMatch(captureMarkup, /<input/);
  assert.doesNotMatch(
    captureMarkup,
    /data-interaction-companion-surface="mobile"/,
  );

  const spanishMarkup = renderToStaticMarkup(
    createElement(courseIn008.Renderer, {
      frame: 216,
      frameDomain: "sprite-57",
      scenario: "source-static-frame",
      lang: "es",
      seed: 7,
    }),
  );
  assert.match(spanishMarkup, /data-current-js-controls-enabled="false"/);
  assert.doesNotMatch(spanishMarkup, /<input/);
});
