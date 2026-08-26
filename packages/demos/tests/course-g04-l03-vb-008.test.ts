import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {loadAnimationModule} from "../src/animation-registry";
import courseVb008, {
  COURSE_G04_L03_VB_008_MOVIE,
  COURSE_G04_L03_VB_008_RUNTIME,
  COURSE_G04_L03_VB_008_SOURCE,
  COURSE_G04_L03_VB_008_SOURCE_CONTRACT,
  buildCourseG04L03Vb008CaptureAttributes,
  getCourseG04L03Vb008FrameState,
  normalizeCourseG04L03Vb008Frame,
} from "../src/modules/course-g04-l03-vb-008";
import {matchPrototype} from "../src/prototype-manifest";
import {COURSE_G04_L03_VB_008_AUTHORITY} from "../src/timelines/course-g04-l03-vb-008";

const repositoryRoot = fileURLToPath(new URL("../../../", import.meta.url));
const sha256 = (bytes: Uint8Array) =>
  createHash("sha256").update(bytes).digest("hex");

const expectedCompanionDomains = [
  ["sprite-5", 1], ["sprite-54", 1], ["sprite-63", 28],
  ["sprite-74", 28], ["sprite-86", 29], ["sprite-98", 31],
  ["sprite-110", 27], ["sprite-138", 28], ["sprite-163", 27],
  ["sprite-169", 1], ["sprite-176", 1], ["sprite-179", 28],
  ["sprite-191", 25],
] as const;

test("VB008 preserves the root, sprite-195, quiz, and domain facts", async () => {
  assert.deepEqual(COURSE_G04_L03_VB_008_MOVIE.stage, {width: 800, height: 600});
  assert.equal(COURSE_G04_L03_VB_008_MOVIE.fps, 12);
  assert.equal(COURSE_G04_L03_VB_008_MOVIE.frameCount, 62);
  assert.equal(COURSE_G04_L03_VB_008_RUNTIME.frameCount, 10);
  assert.equal(COURSE_G04_L03_VB_008_RUNTIME.defaultFrameDomain, "sprite-195");
  assert.deepEqual(COURSE_G04_L03_VB_008_RUNTIME.frameDomains, [
    {id: "sprite-195", frameCount: 62, fps: 12, rootFrame: 6},
    ...expectedCompanionDomains.map(([id, frameCount]) =>
      ({id, frameCount, fps: 12, rootFrame: 6})),
  ]);
  assert.deepEqual(COURSE_G04_L03_VB_008_SOURCE.buttonObjectIds, [10, 21, 22, 53]);
  assert.equal(COURSE_G04_L03_VB_008_SOURCE.quizStopFrame, 29);
  assert.equal(COURSE_G04_L03_VB_008_SOURCE.interactionOperationCount, 4);
  assert.equal(COURSE_G04_L03_VB_008_SOURCE.timelineNavigationOccurrenceCount, 44);
  assert.equal(COURSE_G04_L03_VB_008_SOURCE.maskCandidateCount, 2);
  assert.equal(COURSE_G04_L03_VB_008_SOURCE.morphDefinitionCount, 52);
  assert.equal(COURSE_G04_L03_VB_008_SOURCE.embeddedRasterDefinitionCount, 13);
  assert.equal(courseVb008.runtime, COURSE_G04_L03_VB_008_RUNTIME);
  assert.equal(Object.keys(courseVb008.playbackEndFrameByDomain ?? {}).length, 15);
  assert.equal(courseVb008.playbackEndFrameByDomain?.root, 1);
  assert.equal(courseVb008.playbackEndFrameByDomain?.["sprite-195"], 29);
  assert.equal(courseVb008.playbackEndFrameByDomain?.["sprite-63"], 1);
  for (const [path, expected] of [
    [COURSE_G04_L03_VB_008_SOURCE.swf, COURSE_G04_L03_VB_008_SOURCE.swfSha256],
    [COURSE_G04_L03_VB_008_SOURCE.fla, COURSE_G04_L03_VB_008_SOURCE.flaSha256],
    [COURSE_G04_L03_VB_008_SOURCE.associatedAudio,
      COURSE_G04_L03_VB_008_SOURCE.associatedAudioSha256],
  ] as const) {
    assert.equal(sha256(await readFile(`${repositoryRoot}${path}`)), expected);
  }
});

test("VB008 exposes bounded one-indexed English sprite-195 drawings", () => {
  assert.equal(normalizeCourseG04L03Vb008Frame(Number.NaN), 1);
  assert.equal(normalizeCourseG04L03Vb008Frame(63), 62);
  assert.equal(normalizeCourseG04L03Vb008Frame(8, "root"), 8);
  assert.equal(normalizeCourseG04L03Vb008Frame(32, "sprite-98"), 31);
  for (const frame of [1, 28, 29, 30, 62]) {
    const state = getCourseG04L03Vb008FrameState(frame, {
      frameDomain: "sprite-195",
      scenario: "source-static-frame",
      lang: "en",
      seed: frame === 29 ? -1 : 0,
    });
    assert.equal(state.status, "ready");
    assert.equal(state.frame, frame);
    assert.equal(state.exportFrame, frame - 1);
    assert.deepEqual(state.visibleSourceMarkers,
      frame < 29
        ? ["negative-numbers-practice"]
        : frame === 29
          ? ["negative-numbers-practice", "four-answer-quiz-stop-static-drawing"]
          : ["negative-numbers-practice", "post-quiz-static-drawing"]);
    assert.equal(state.interactiveControlsEnabled, false);
    assert.equal(state.audioRendered, false);
    assert.equal(state.naturalRuntimeEstablished, false);
  }
});

test("VB008 fails closed for Spanish, root, companions, and unsupported domains", () => {
  const requests = [
    ["sprite-195", "source-static-frame", "es", "spanish-visual-and-audio-unvalidated"],
    ["root", "root-unavailable", "en", "root-baseline-unavailable"],
    ["sprite-63", "sprite-63-unavailable", "en", "companion-domain-unrendered"],
    ["sprite-52", "sprite-52-unavailable", "en", "unsupported-runtime-request"],
    ["root", "source-static-frame", "en", "frame-domain-scenario-mismatch"],
  ] as const;
  for (const [frameDomain, scenario, lang, blocker] of requests) {
    const state = getCourseG04L03Vb008FrameState(1, {
      frameDomain,
      scenario,
      lang,
      seed: 0,
    });
    assert.equal(state.blocker, blocker);
  }
});

test("VB008 capture identity remains deterministic and muted", () => {
  const state = getCourseG04L03Vb008FrameState(29, {
    frameDomain: "sprite-195",
    scenario: "source-static-frame",
    lang: "en",
    seed: 7,
  });
  const attributes = buildCourseG04L03Vb008CaptureAttributes({
    canvasStatus: "ready",
    entryStateSha256: "a".repeat(64),
    requirementId: "engineering-source-static-frame-29",
    state,
    traceId: "engineering-source-static",
  });
  assert.equal(attributes["data-capture-stage"], "true");
  assert.equal(attributes["data-flash-frame-domain"], "sprite-195");
  assert.equal(attributes["data-source-controls-enabled"], "false");
  assert.equal(attributes["data-source-marker-visuals"],
    "negative-numbers-practice,four-answer-quiz-stop-static-drawing");
});

test("VB008 remains prototype-only with every acceptance gate closed", async () => {
  const manifest = matchPrototype({animationId: "course-g04-l03-vb-008"});
  assert.equal(manifest?.runtime.frameCount, 10);
  assert.equal(manifest?.runtime.frameDomains?.length, 14);
  assert.equal(manifest?.movie.frameCount, 62);
  assert.equal(manifest?.title.en, "Negative Numbers Practice");
  assert.equal(matchPrototype({sourcePath: "/unknown/L3VB08.swf"}), undefined);
  const registered = await loadAnimationModule("course-g04-l03-vb-008");
  assert.equal(registered?.maturity, "legacy-prototype");
  assert.equal(registered?.audioCues.length, 1);
  assert.equal(COURSE_G04_L03_VB_008_SOURCE_CONTRACT.ownerAccepted, false);
  for (const [name, value] of Object.entries(COURSE_G04_L03_VB_008_AUTHORITY)) {
    if (name === "registryIsPrototypeOnly" || name === "strictAcceptanceEffect") continue;
    assert.equal(value, false, name);
  }
  assert.equal(COURSE_G04_L03_VB_008_AUTHORITY.registryIsPrototypeOnly, true);
  assert.equal(courseVb008.reducedMotionFrame, 29);
  const activityMarkup = renderToStaticMarkup(
    createElement(courseVb008.Renderer, {
      frame: 29,
      frameDomain: "sprite-195",
      scenario: "source-static-frame",
      lang: "en",
      seed: 0,
    }),
  );
  assert.match(activityMarkup, /data-current-js-controls-enabled="true"/);
  assert.match(activityMarkup,
    /data-current-js-functional-scope="vb-sign-three-choice-source-script-bound"/);
  assert.match(activityMarkup, /Choose 9/);
  assert.match(activityMarkup, /Choose negative 9/);
  assert.match(activityMarkup, /Choose 0/);
  assert.match(activityMarkup, /data-current-js-controls-ready="false"/);
  assert.match(activityMarkup, /aria-label="Choose 9"[^>]*disabled=""/);
  assert.match(activityMarkup, /data-source-instance="AnsBtn1"/);
  assert.match(activityMarkup, /data-source-instance="AnsBtn2"/);
  assert.match(activityMarkup, /data-source-instance="AnsBtn3"/);
  assert.match(activityMarkup, /Mobile controls/);
  assert.match(activityMarkup, /data-mobile-touch-target-min="48"/);
  assert.equal(
    COURSE_G04_L03_VB_008_SOURCE_CONTRACT.currentJavascriptInteractionStatus,
    "source-script-bound-functional-candidate",
  );
  assert.equal(
    COURSE_G04_L03_VB_008_SOURCE_CONTRACT.behaviorParityEstablished,
    false,
  );
  const spanishMarkup = renderToStaticMarkup(
    createElement(courseVb008.Renderer, {
      frame: 1,
      frameDomain: "sprite-195",
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
    createElement(courseVb008.Renderer, {
      entryStateSha256: "a".repeat(64),
      frame: 29,
      frameDomain: "sprite-195",
      requirementId: "engineering-source-static-frame-29",
      scenario: "source-static-frame",
      lang: "en",
      seed: 0,
      traceId: "engineering-source-static",
    }),
  );
  assert.match(captureMarkup, /data-current-js-controls-enabled="false"/);
  assert.doesNotMatch(captureMarkup, /Choose negative 9/);
  assert.doesNotMatch(captureMarkup, /Mobile controls/);
});
