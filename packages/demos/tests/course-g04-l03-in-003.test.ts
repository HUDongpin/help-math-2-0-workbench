import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import test from "node:test";
import {fileURLToPath} from "node:url";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";

import {loadAnimationModule} from "../src/animation-registry";
import courseIn003, {
  buildCourseG04L03In003CaptureAttributes,
} from "../src/modules/course-g04-l03-in-003";
import {matchPrototype} from "../src/prototype-manifest";
import {
  COURSE_G04_L03_IN_003_MOVIE,
  COURSE_G04_L03_IN_003_RUNTIME,
  COURSE_G04_L03_IN_003_SOURCE,
  COURSE_G04_L03_IN_003_SOURCE_CONTRACT,
  getCourseG04L03In003FrameState,
  normalizeCourseG04L03In003Frame,
} from "../src/timelines/course-g04-l03-in-003";

const repositoryRoot = fileURLToPath(new URL("../../../", import.meta.url));

function sha256(value: Buffer | string): string {
  return createHash("sha256").update(value).digest("hex");
}

test("IN003 preserves source identity and separates root from sprite-84", async () => {
  assert.deepEqual(COURSE_G04_L03_IN_003_MOVIE.stage, {width: 800, height: 600});
  assert.equal(COURSE_G04_L03_IN_003_MOVIE.fps, 12);
  assert.equal(COURSE_G04_L03_IN_003_MOVIE.frameCount, 472);
  assert.equal(COURSE_G04_L03_IN_003_RUNTIME.frameCount, 10);
  assert.equal(COURSE_G04_L03_IN_003_RUNTIME.defaultFrameDomain, "sprite-84");
  assert.deepEqual(COURSE_G04_L03_IN_003_RUNTIME.frameDomains, [
    {id: "sprite-84", frameCount: 472, fps: 12, rootFrame: 6},
  ]);
  assert.equal(courseIn003.runtime, COURSE_G04_L03_IN_003_RUNTIME);
  assert.equal(courseIn003.playbackMode, "loop");
  assert.deepEqual(courseIn003.playbackEndFrameByDomain, {
    root: 1,
    "sprite-84": 472,
  });
  assert.equal(
    sha256(await readFile(`${repositoryRoot}${COURSE_G04_L03_IN_003_SOURCE.swf}`)),
    COURSE_G04_L03_IN_003_SOURCE.swfSha256,
  );
});

test("IN003 exposes only one-indexed English source-static sprite frames", () => {
  assert.equal(normalizeCourseG04L03In003Frame(Number.NaN), 1);
  assert.equal(normalizeCourseG04L03In003Frame(0), 1);
  assert.equal(normalizeCourseG04L03In003Frame(236.9), 236);
  assert.equal(normalizeCourseG04L03In003Frame(473), 472);
  assert.equal(normalizeCourseG04L03In003Frame(11, "root"), 10);

  const english = getCourseG04L03In003FrameState(472, {
    frameDomain: "sprite-84",
    scenario: "source-static-frame",
    lang: "en",
    seed: -1,
  });
  assert.equal(english.status, "ready");
  assert.equal(english.blocker, null);
  assert.equal(english.frame, 472);
  assert.equal(english.exportFrame, 471);
  assert.equal(english.rootFrame, 6);
  assert.equal(english.seed, 4_294_967_295);
  assert.equal(english.naturalRuntimeEstablished, false);
  assert.equal(english.audioRendered, false);

  const spanish = getCourseG04L03In003FrameState(1, {
    frameDomain: "sprite-84",
    scenario: "source-static-frame",
    lang: "es",
    seed: 0,
  });
  assert.equal(spanish.status, "blocked");
  assert.equal(spanish.blocker, "spanish-visual-and-audio-unvalidated");
  assert.equal(spanish.sourceStaticVisualReady, false);
});

test("IN003 fails closed for root, mismatched, and unsupported requests", () => {
  const root = getCourseG04L03In003FrameState(10, {
    frameDomain: "root",
    scenario: "root-unavailable",
    lang: "en",
    seed: 0,
  });
  assert.equal(root.status, "blocked");
  assert.equal(root.blocker, "root-baseline-unavailable");
  assert.equal(root.exportFrame, null);
  assert.equal(root.rootFrame, 10);

  const mismatch = getCourseG04L03In003FrameState(1, {
    frameDomain: "root",
    scenario: "source-static-frame",
    lang: "en",
    seed: 0,
  });
  assert.equal(mismatch.blocker, "frame-domain-scenario-mismatch");

  const unsupported = getCourseG04L03In003FrameState(1, {
    frameDomain: "sprite-unknown",
    scenario: "source-static-frame",
    lang: "en",
    seed: 0,
  });
  assert.equal(unsupported.blocker, "unsupported-runtime-request");
});

test("IN003 capture readiness requires rendered identity and all trace bindings", () => {
  const state = getCourseG04L03In003FrameState(27, {
    frameDomain: "sprite-84",
    scenario: "source-static-frame",
    lang: "en",
    seed: 7,
  });
  const incomplete = buildCourseG04L03In003CaptureAttributes({
    canvasStatus: "ready",
    entryStateSha256: "",
    requirementId: "",
    state,
    traceId: "",
  });
  assert.equal(incomplete["data-capture-stage"], undefined);
  const complete = buildCourseG04L03In003CaptureAttributes({
    canvasStatus: "ready",
    entryStateSha256: "a".repeat(64),
    requirementId: "engineering-source-static-frame-27",
    state,
    traceId: "engineering-source-static",
  });
  assert.equal(complete["data-capture-stage"], "true");
  assert.equal(complete["data-flash-frame"], 27);
  assert.equal(complete["data-flash-frame-domain"], "sprite-84");
  assert.equal(complete["data-runtime-language"], "en");
});

test("IN003 module is prototype-only and blocked UI states disclose the boundary", async () => {
  const manifest = matchPrototype({animationId: "course-g04-l03-in-003"});
  assert.equal(manifest?.runtime.frameCount, 10);
  assert.equal(manifest?.movie.frameCount, 472);
  assert.equal(manifest?.title.en, "Numbers on the Number Line");
  assert.equal(manifest?.title.es, "Versión en español pendiente de validación");
  assert.equal(matchPrototype({sourcePath: "/unknown/L3IN03.swf"}), undefined);

  const registered = await loadAnimationModule("course-g04-l03-in-003");
  assert.equal(registered?.key, "course-g04-l03-in-003");
  assert.equal(registered?.maturity, "legacy-prototype");
  assert.equal(registered?.audioCues.length, 1);
  assert.equal(registered?.audioTracks?.length, 1);
  assert.equal(COURSE_G04_L03_IN_003_SOURCE_CONTRACT.ownerAccepted, false);
  assert.equal(COURSE_G04_L03_IN_003_SOURCE_CONTRACT.strictAcceptanceEffect, "none");

  const spanishMarkup = renderToStaticMarkup(
    createElement(courseIn003.Renderer, {
      frame: 1,
      frameDomain: "sprite-84",
      scenario: "source-static-frame",
      lang: "es",
      seed: 0,
    }),
  );
  assert.match(spanishMarkup, /data-fail-closed-reason="spanish-visual-and-audio-unvalidated"/);
  assert.match(spanishMarkup, /data-audio-rendered="false"/);
  assert.match(spanishMarkup, /data-owner-accepted="false"/);
  assert.match(spanishMarkup, /data-strict-migration-complete="false"/);
  assert.doesNotMatch(spanishMarkup, /<canvas/);
});
