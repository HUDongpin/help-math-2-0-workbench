import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {loadAnimationModule} from "../src/animation-registry";
import {
  buildCourseG04L03Vb009CaptureAttributes,
  default as courseVb009,
} from "../src/modules/course-g04-l03-vb-009";
import {matchPrototype} from "../src/prototype-manifest";
import {
  COURSE_G04_L03_VB_009_CANDIDATE_CONFIG,
  COURSE_G04_L03_VB_009_MOVIE,
  COURSE_G04_L03_VB_009_RUNTIME,
  COURSE_G04_L03_VB_009_SOURCE,
  COURSE_G04_L03_VB_009_SOURCE_CONTRACT,
  getCourseG04L03Vb009FrameState,
  normalizeCourseG04L03Vb009Frame,
} from "../src/timelines/course-g04-l03-vb-009";

const repositoryRoot = fileURLToPath(new URL("../../../", import.meta.url));
const sha256 = (bytes: Uint8Array) =>
  createHash("sha256").update(bytes).digest("hex");

test("VB009 preserves root and nested source frame domains", async () => {
  assert.deepEqual(COURSE_G04_L03_VB_009_MOVIE.stage, {width: 800, height: 600});
  assert.equal(COURSE_G04_L03_VB_009_MOVIE.fps, 12);
  assert.equal(COURSE_G04_L03_VB_009_MOVIE.frameCount, 175);
  assert.equal(COURSE_G04_L03_VB_009_RUNTIME.frameCount, 10);
  assert.equal(COURSE_G04_L03_VB_009_RUNTIME.defaultFrameDomain, "sprite-24");
  assert.deepEqual(COURSE_G04_L03_VB_009_RUNTIME.frameDomains, [
    {id: "sprite-24", frameCount: 175, fps: 12, rootFrame: 6},
    {id: "sprite-5", frameCount: 1, fps: 12, rootFrame: 6},
  ]);
  assert.equal(courseVb009.playbackMode, "once");
  assert.deepEqual(courseVb009.playbackEndFrameByDomain, {
    root: 1,
    "sprite-5": 1,
  });
  assert.equal(
    sha256(await readFile(`${repositoryRoot}${COURSE_G04_L03_VB_009_SOURCE.swf}`)),
    COURSE_G04_L03_VB_009_SOURCE.swfSha256,
  );
  assert.equal(COURSE_G04_L03_VB_009_CANDIDATE_CONFIG.mainFrameDomain, "sprite-24");
});

test("VB009 exposes exactly 175 English source-static frames with pixel-only markers", () => {
  assert.equal(normalizeCourseG04L03Vb009Frame(Number.NaN), 1);
  assert.equal(normalizeCourseG04L03Vb009Frame(0), 1);
  assert.equal(normalizeCourseG04L03Vb009Frame(72.9), 72);
  assert.equal(normalizeCourseG04L03Vb009Frame(176), 175);
  assert.equal(normalizeCourseG04L03Vb009Frame(11, "root"), 10);
  assert.equal(normalizeCourseG04L03Vb009Frame(5, "sprite-5"), 1);

  for (let frame = 1; frame <= 175; frame += 1) {
    const state = getCourseG04L03Vb009FrameState(frame, {
      frameDomain: "sprite-24",
      scenario: "source-static-frame",
      lang: "en",
      seed: frame,
    });
    assert.equal(state.status, "ready");
    assert.equal(state.frame, frame);
    assert.equal(state.exportFrame, frame - 1);
    assert.equal(state.rootFrame, 6);
    assert.deepEqual(
      state.visibleSourceMarkers,
      frame < 73 ? ["pattern", "symbol", "set"] : ["pattern", "symbol", "set", "rule"],
    );
    assert.equal(state.interactiveControlsEnabled, false);
    assert.equal(state.sourceHostBehaviorResolved, false);
    assert.equal(state.naturalRuntimeEstablished, false);
    assert.equal(state.audioRendered, false);
  }
});

test("VB009 fails closed for Spanish, root, companion, and mismatched requests", () => {
  const spanish = getCourseG04L03Vb009FrameState(1, {
    frameDomain: "sprite-24",
    scenario: "source-static-frame",
    lang: "es",
    seed: 0,
  });
  assert.equal(spanish.status, "blocked");
  assert.equal(spanish.blocker, "spanish-visual-and-audio-unvalidated");
  assert.equal(spanish.sourceStaticVisualReady, false);

  const root = getCourseG04L03Vb009FrameState(10, {
    frameDomain: "root",
    scenario: "root-unavailable",
    lang: "en",
    seed: 0,
  });
  assert.equal(root.status, "blocked");
  assert.equal(root.blocker, "root-baseline-unavailable");
  assert.equal(root.exportFrame, null);
  assert.equal(root.rootFrame, 10);

  const companion = getCourseG04L03Vb009FrameState(1, {
    frameDomain: "sprite-5",
    scenario: "sprite-5-unavailable",
    lang: "en",
    seed: 0,
  });
  assert.equal(companion.status, "blocked");
  assert.equal(companion.blocker, "companion-domain-unrendered");

  const mismatch = getCourseG04L03Vb009FrameState(1, {
    frameDomain: "root",
    scenario: "source-static-frame",
    lang: "en",
    seed: 0,
  });
  assert.equal(mismatch.blocker, "frame-domain-scenario-mismatch");

  const unsupported = getCourseG04L03Vb009FrameState(1, {
    frameDomain: "sprite-unknown",
    scenario: "source-static-frame",
    lang: "en",
    seed: 0,
  });
  assert.equal(unsupported.blocker, "unsupported-runtime-request");
});

test("VB009 capture readiness requires the complete identity and disables controls", () => {
  const state = getCourseG04L03Vb009FrameState(73, {
    frameDomain: "sprite-24",
    scenario: "source-static-frame",
    lang: "en",
    seed: 9,
  });
  const incomplete = buildCourseG04L03Vb009CaptureAttributes({
    canvasStatus: "ready",
    entryStateSha256: "",
    requirementId: "",
    state,
    traceId: "",
  });
  assert.equal(incomplete["data-capture-stage"], undefined);
  const complete = buildCourseG04L03Vb009CaptureAttributes({
    canvasStatus: "ready",
    entryStateSha256: "a".repeat(64),
    requirementId: "engineering-source-static-frame-73",
    state,
    traceId: "engineering-source-static",
  });
  assert.equal(complete["data-capture-stage"], "true");
  assert.equal(complete["data-flash-frame"], 73);
  assert.equal(complete["data-flash-frame-domain"], "sprite-24");
  assert.equal(complete["data-runtime-language"], "en");
  assert.equal(complete["data-source-marker-visuals"], "pattern,symbol,set,rule");
  assert.equal(complete["data-source-controls-enabled"], "false");
});

test("VB009 remains prototype-only and its Spanish UI has no Canvas", async () => {
  const manifest = matchPrototype({animationId: "course-g04-l03-vb-009"});
  assert.equal(manifest?.runtime.frameCount, 10);
  assert.equal(manifest?.movie.frameCount, 175);
  assert.equal(manifest?.title.en, "Pattern");
  assert.equal(manifest?.title.es, "Versión en español pendiente de validación");
  assert.equal(matchPrototype({sourcePath: "/unknown/L3VB09.swf"}), undefined);

  const registered = await loadAnimationModule("course-g04-l03-vb-009");
  assert.equal(registered?.key, "course-g04-l03-vb-009");
  assert.equal(registered?.maturity, "legacy-prototype");
  assert.equal(registered?.audioCues.length, 1);
  assert.equal(registered?.audioTracks?.length, 1);
  assert.equal(COURSE_G04_L03_VB_009_SOURCE_CONTRACT.ownerAccepted, false);
  assert.equal(COURSE_G04_L03_VB_009_SOURCE_CONTRACT.strictAcceptanceEffect, "none");

  const spanishMarkup = renderToStaticMarkup(
    createElement(courseVb009.Renderer, {
      frame: 1,
      frameDomain: "sprite-24",
      scenario: "source-static-frame",
      lang: "es",
      seed: 0,
    }),
  );
  assert.match(
    spanishMarkup,
    /data-fail-closed-reason="spanish-visual-and-audio-unvalidated"/,
  );
  assert.match(spanishMarkup, /data-audio-rendered="false"/);
  assert.match(spanishMarkup, /data-interactive-controls-enabled="false"/);
  assert.match(spanishMarkup, /data-owner-accepted="false"/);
  assert.match(spanishMarkup, /data-strict-migration-complete="false"/);
  assert.doesNotMatch(spanishMarkup, /<canvas/);
});
