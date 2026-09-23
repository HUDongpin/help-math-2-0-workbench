import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {loadAnimationModule} from "../src/animation-registry";
import courseVb007, {
  COURSE_G04_L03_VB_007_MOVIE,
  COURSE_G04_L03_VB_007_RUNTIME,
  COURSE_G04_L03_VB_007_SOURCE,
  COURSE_G04_L03_VB_007_SOURCE_CONTRACT,
  buildCourseG04L03Vb007CaptureAttributes,
  getCourseG04L03Vb007FrameState,
  normalizeCourseG04L03Vb007Frame,
} from "../src/modules/course-g04-l03-vb-007";
import {matchPrototype} from "../src/prototype-manifest";
import {COURSE_G04_L03_VB_007_AUTHORITY} from "../src/timelines/course-g04-l03-vb-007";

const repositoryRoot = fileURLToPath(new URL("../../../", import.meta.url));
const sha256 = (bytes: Uint8Array) =>
  createHash("sha256").update(bytes).digest("hex");

const expectedCompanionDomains = [
  ["sprite-5", 1], ["sprite-42", 1], ["sprite-45", 28],
  ["sprite-63", 27], ["sprite-68", 1], ["sprite-77", 31],
  ["sprite-105", 28], ["sprite-114", 22], ["sprite-136", 26],
  ["sprite-142", 22], ["sprite-166", 19], ["sprite-176", 27],
  ["sprite-202", 31], ["sprite-234", 25], ["sprite-267", 27],
] as const;

test("VB007 preserves the root, sprite-271, quiz, and domain facts", async () => {
  assert.deepEqual(COURSE_G04_L03_VB_007_MOVIE.stage, {width: 800, height: 600});
  assert.equal(COURSE_G04_L03_VB_007_MOVIE.fps, 12);
  assert.equal(COURSE_G04_L03_VB_007_MOVIE.frameCount, 69);
  assert.equal(COURSE_G04_L03_VB_007_RUNTIME.frameCount, 10);
  assert.equal(COURSE_G04_L03_VB_007_RUNTIME.defaultFrameDomain, "sprite-271");
  assert.deepEqual(COURSE_G04_L03_VB_007_RUNTIME.frameDomains, [
    {id: "sprite-271", frameCount: 69, fps: 12, rootFrame: 6},
    ...expectedCompanionDomains.map(([id, frameCount]) =>
      ({id, frameCount, fps: 12, rootFrame: 6})),
  ]);
  assert.deepEqual(COURSE_G04_L03_VB_007_SOURCE.buttonObjectIds, [10, 21, 22, 41]);
  assert.equal(COURSE_G04_L03_VB_007_SOURCE.quizStopFrame, 31);
  assert.equal(COURSE_G04_L03_VB_007_SOURCE.interactionOperationCount, 4);
  assert.equal(COURSE_G04_L03_VB_007_SOURCE.timelineNavigationOccurrenceCount, 44);
  assert.equal(COURSE_G04_L03_VB_007_SOURCE.replayResetOperationCount, 9);
  assert.equal(COURSE_G04_L03_VB_007_SOURCE.maskCandidateCount, 5);
  assert.equal(COURSE_G04_L03_VB_007_SOURCE.morphDefinitionCount, 89);
  assert.equal(COURSE_G04_L03_VB_007_SOURCE.embeddedRasterDefinitionCount, 2);
  assert.equal(courseVb007.runtime, COURSE_G04_L03_VB_007_RUNTIME);
  assert.equal(Object.keys(courseVb007.playbackEndFrameByDomain ?? {}).length, 17);
  assert.equal(courseVb007.playbackEndFrameByDomain?.root, 1);
  assert.equal(courseVb007.playbackEndFrameByDomain?.["sprite-271"], 31);
  assert.equal(courseVb007.playbackEndFrameByDomain?.["sprite-45"], 1);
  for (const [path, expected] of [
    [COURSE_G04_L03_VB_007_SOURCE.swf, COURSE_G04_L03_VB_007_SOURCE.swfSha256],
    [COURSE_G04_L03_VB_007_SOURCE.fla, COURSE_G04_L03_VB_007_SOURCE.flaSha256],
    [COURSE_G04_L03_VB_007_SOURCE.associatedAudio,
      COURSE_G04_L03_VB_007_SOURCE.associatedAudioSha256],
  ] as const) {
    assert.equal(sha256(await readFile(`${repositoryRoot}${path}`)), expected);
  }
});

test("VB007 exposes bounded one-indexed English sprite-271 drawings", () => {
  assert.equal(normalizeCourseG04L03Vb007Frame(Number.NaN), 1);
  assert.equal(normalizeCourseG04L03Vb007Frame(70), 69);
  assert.equal(normalizeCourseG04L03Vb007Frame(8, "root"), 8);
  assert.equal(normalizeCourseG04L03Vb007Frame(32, "sprite-77"), 31);
  for (const frame of [1, 30, 31, 32, 69]) {
    const state = getCourseG04L03Vb007FrameState(frame, {
      frameDomain: "sprite-271",
      scenario: "source-static-frame",
      lang: "en",
      seed: frame === 31 ? -1 : 0,
    });
    assert.equal(state.status, "ready");
    assert.equal(state.frame, frame);
    assert.equal(state.exportFrame, frame - 1);
    assert.deepEqual(state.visibleSourceMarkers,
      frame < 31
        ? ["positive-numbers-practice"]
        : frame === 31
          ? ["positive-numbers-practice", "four-answer-quiz-stop-static-drawing"]
          : ["positive-numbers-practice", "post-quiz-static-drawing"]);
    assert.equal(state.interactiveControlsEnabled, false);
    assert.equal(state.audioRendered, false);
    assert.equal(state.naturalRuntimeEstablished, false);
  }
});

test("VB007 fails closed for Spanish, root, companions, and unsupported domains", () => {
  const requests = [
    ["sprite-271", "source-static-frame", "es", "spanish-visual-and-audio-unvalidated"],
    ["root", "root-unavailable", "en", "root-baseline-unavailable"],
    ["sprite-45", "sprite-45-unavailable", "en", "companion-domain-unrendered"],
    ["sprite-40", "sprite-40-unavailable", "en", "unsupported-runtime-request"],
    ["root", "source-static-frame", "en", "frame-domain-scenario-mismatch"],
  ] as const;
  for (const [frameDomain, scenario, lang, blocker] of requests) {
    const state = getCourseG04L03Vb007FrameState(1, {
      frameDomain,
      scenario,
      lang,
      seed: 0,
    });
    assert.equal(state.blocker, blocker);
  }
});

test("VB007 capture identity remains deterministic and muted", () => {
  const state = getCourseG04L03Vb007FrameState(31, {
    frameDomain: "sprite-271",
    scenario: "source-static-frame",
    lang: "en",
    seed: 7,
  });
  const attributes = buildCourseG04L03Vb007CaptureAttributes({
    canvasStatus: "ready",
    entryStateSha256: "a".repeat(64),
    requirementId: "engineering-source-static-frame-31",
    state,
    traceId: "engineering-source-static",
  });
  assert.equal(attributes["data-capture-stage"], "true");
  assert.equal(attributes["data-flash-frame-domain"], "sprite-271");
  assert.equal(attributes["data-source-controls-enabled"], "false");
  assert.equal(attributes["data-source-marker-visuals"],
    "positive-numbers-practice,four-answer-quiz-stop-static-drawing");
});

test("VB007 remains prototype-only with every acceptance gate closed", async () => {
  const manifest = matchPrototype({animationId: "course-g04-l03-vb-007"});
  assert.equal(manifest?.runtime.frameCount, 10);
  assert.equal(manifest?.runtime.frameDomains?.length, 16);
  assert.equal(manifest?.movie.frameCount, 69);
  assert.equal(manifest?.title.en, "Positive Numbers Practice");
  assert.equal(matchPrototype({sourcePath: "/unknown/L3VB07.swf"}), undefined);
  const registered = await loadAnimationModule("course-g04-l03-vb-007");
  assert.equal(registered?.maturity, "legacy-prototype");
  assert.equal(registered?.audioCues.length, 1);
  assert.equal(COURSE_G04_L03_VB_007_SOURCE_CONTRACT.ownerAccepted, false);
  for (const [name, value] of Object.entries(COURSE_G04_L03_VB_007_AUTHORITY)) {
    if (name === "registryIsPrototypeOnly" || name === "strictAcceptanceEffect") continue;
    assert.equal(value, false, name);
  }
  assert.equal(COURSE_G04_L03_VB_007_AUTHORITY.registryIsPrototypeOnly, true);
  assert.equal(courseVb007.reducedMotionFrame, 31);
  const activityMarkup = renderToStaticMarkup(
    createElement(courseVb007.Renderer, {
      frame: 31,
      frameDomain: "sprite-271",
      scenario: "source-static-frame",
      lang: "en",
      seed: 0,
    }),
  );
  assert.match(activityMarkup, /data-current-js-controls-enabled="true"/);
  assert.match(activityMarkup,
    /data-current-js-functional-scope="vb-sign-three-choice-source-script-bound"/);
  assert.match(activityMarkup, /Choose 0/);
  assert.match(activityMarkup, /Choose 7/);
  assert.match(activityMarkup, /Choose negative 7/);
  assert.match(activityMarkup, /data-current-js-controls-ready="false"/);
  assert.match(activityMarkup, /aria-label="Choose 0"[^>]*disabled=""/);
  assert.match(activityMarkup, /data-source-instance="AnsBtn1"/);
  assert.match(activityMarkup, /data-source-instance="AnsBtn2"/);
  assert.match(activityMarkup, /data-source-instance="AnsBtn3"/);
  assert.match(activityMarkup, /Mobile controls/);
  assert.match(activityMarkup, /data-mobile-touch-target-min="48"/);
  assert.equal(
    COURSE_G04_L03_VB_007_SOURCE_CONTRACT.currentJavascriptInteractionStatus,
    "source-script-bound-functional-candidate",
  );
  assert.equal(
    COURSE_G04_L03_VB_007_SOURCE_CONTRACT.behaviorParityEstablished,
    false,
  );
  const spanishMarkup = renderToStaticMarkup(
    createElement(courseVb007.Renderer, {
      frame: 1,
      frameDomain: "sprite-271",
      scenario: "source-static-frame",
      lang: "es",
      seed: 0,
    }),
  );
  assert.match(spanishMarkup,
    /data-fail-closed-reason="spanish-visual-and-audio-unvalidated"/);
  assert.match(spanishMarkup, /data-audio-rendered="false"/);
  assert.match(spanishMarkup, /data-owner-accepted="false"/);
  assert.match(spanishMarkup, /data-strict-migration-complete="false"/);
  assert.doesNotMatch(spanishMarkup, /<canvas/);

  const captureMarkup = renderToStaticMarkup(
    createElement(courseVb007.Renderer, {
      entryStateSha256: "a".repeat(64),
      frame: 31,
      frameDomain: "sprite-271",
      requirementId: "engineering-source-static-frame-31",
      scenario: "source-static-frame",
      lang: "en",
      seed: 0,
      traceId: "engineering-source-static",
    }),
  );
  assert.match(captureMarkup, /data-current-js-controls-enabled="false"/);
  assert.doesNotMatch(captureMarkup, /Choose negative 7/);
  assert.doesNotMatch(captureMarkup, /Mobile controls/);
});
