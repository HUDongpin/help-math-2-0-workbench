import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {loadAnimationModule} from "../src/animation-registry";
import courseTs003, {
  COURSE_G04_L03_TS_003_MOVIE,
  COURSE_G04_L03_TS_003_RUNTIME,
  COURSE_G04_L03_TS_003_SOURCE,
  COURSE_G04_L03_TS_003_SOURCE_CONTRACT,
  buildCourseG04L03Ts003CaptureAttributes,
  getCourseG04L03Ts003FrameState,
  normalizeCourseG04L03Ts003Frame,
} from "../src/modules/course-g04-l03-ts-003";
import {matchPrototype} from "../src/prototype-manifest";
import {COURSE_G04_L03_TS_003_AUTHORITY} from "../src/timelines/course-g04-l03-ts-003";

const repositoryRoot = fileURLToPath(new URL("../../../", import.meta.url));
const sha256 = (bytes: Uint8Array) =>
  createHash("sha256").update(bytes).digest("hex");

test("TS003 preserves the root and separate sprite-25 and title domains", async () => {
  assert.deepEqual(COURSE_G04_L03_TS_003_MOVIE.stage, {width: 800, height: 600});
  assert.equal(COURSE_G04_L03_TS_003_MOVIE.fps, 12);
  assert.equal(COURSE_G04_L03_TS_003_MOVIE.frameCount, 241);
  assert.equal(COURSE_G04_L03_TS_003_RUNTIME.frameCount, 10);
  assert.equal(COURSE_G04_L03_TS_003_RUNTIME.defaultFrameDomain, "sprite-25");
  assert.deepEqual(COURSE_G04_L03_TS_003_RUNTIME.frameDomains, [
    {id: "sprite-25", frameCount: 241, fps: 12, rootFrame: 6},
    {id: "sprite-3", frameCount: 1, fps: 12, rootFrame: 6},
  ]);
  assert.equal(courseTs003.runtime, COURSE_G04_L03_TS_003_RUNTIME);
  assert.deepEqual(courseTs003.playbackEndFrameByDomain, {root: 1, "sprite-3": 1});
  assert.equal(COURSE_G04_L03_TS_003_SOURCE.fla, null);
  assert.equal(
    sha256(await readFile(`${repositoryRoot}${COURSE_G04_L03_TS_003_SOURCE.swf}`)),
    COURSE_G04_L03_TS_003_SOURCE.swfSha256,
  );
});

test("TS003 exposes bounded one-indexed English sprite-25 drawings", () => {
  assert.equal(normalizeCourseG04L03Ts003Frame(Number.NaN), 1);
  assert.equal(normalizeCourseG04L03Ts003Frame(242), 241);
  assert.equal(normalizeCourseG04L03Ts003Frame(8, "root"), 8);
  assert.equal(normalizeCourseG04L03Ts003Frame(8, "sprite-3"), 1);
  for (const frame of [1, 121, 241]) {
    const state = getCourseG04L03Ts003FrameState(frame, {
      frameDomain: "sprite-25",
      scenario: "source-static-frame",
      lang: "en",
      seed: frame === 241 ? -1 : 0,
    });
    assert.equal(state.status, "ready");
    assert.equal(state.frame, frame);
    assert.equal(state.exportFrame, frame - 1);
    assert.deepEqual(state.visibleSourceMarkers, ["four-step-plan"]);
    assert.equal(state.interactiveControlsEnabled, false);
    assert.equal(state.audioRendered, false);
    assert.equal(state.naturalRuntimeEstablished, false);
  }
});

test("TS003 fails closed for Spanish, root, companion, and mismatches", () => {
  const requests = [
    ["sprite-25", "source-static-frame", "es", "spanish-visual-and-audio-unvalidated"],
    ["root", "root-unavailable", "en", "root-baseline-unavailable"],
    ["sprite-3", "sprite-3-unavailable", "en", "companion-domain-unrendered"],
    ["root", "source-static-frame", "en", "frame-domain-scenario-mismatch"],
  ] as const;
  for (const [frameDomain, scenario, lang, blocker] of requests) {
    const state = getCourseG04L03Ts003FrameState(1, {
      frameDomain,
      scenario,
      lang,
      seed: 0,
    });
    assert.equal(state.blocker, blocker);
  }
});

test("TS003 capture identity remains deterministic and muted", () => {
  const state = getCourseG04L03Ts003FrameState(241, {
    frameDomain: "sprite-25",
    scenario: "source-static-frame",
    lang: "en",
    seed: 7,
  });
  const attributes = buildCourseG04L03Ts003CaptureAttributes({
    canvasStatus: "ready",
    entryStateSha256: "a".repeat(64),
    requirementId: "engineering-source-static-frame-241",
    state,
    traceId: "engineering-source-static",
  });
  assert.equal(attributes["data-capture-stage"], "true");
  assert.equal(attributes["data-flash-frame-domain"], "sprite-25");
  assert.equal(attributes["data-source-controls-enabled"], "false");
  assert.equal(attributes["data-source-marker-visuals"], "four-step-plan");
});

test("TS003 remains prototype-only with every acceptance gate closed", async () => {
  const manifest = matchPrototype({animationId: "course-g04-l03-ts-003"});
  assert.equal(manifest?.runtime.frameCount, 10);
  assert.equal(manifest?.movie.frameCount, 241);
  assert.equal(manifest?.title.en, "4 - Step Plan");
  assert.equal(matchPrototype({sourcePath: "/unknown/L3TS03.swf"}), undefined);
  const registered = await loadAnimationModule("course-g04-l03-ts-003");
  assert.equal(registered?.maturity, "legacy-prototype");
  assert.equal(registered?.audioCues.length, 1);
  assert.equal(registered?.audioTracks?.length, 1);
  assert.equal(COURSE_G04_L03_TS_003_SOURCE_CONTRACT.ownerAccepted, false);
  for (const [name, value] of Object.entries(COURSE_G04_L03_TS_003_AUTHORITY)) {
    if (name === "registryIsPrototypeOnly" || name === "strictAcceptanceEffect") continue;
    assert.equal(value, false, name);
  }
  assert.equal(COURSE_G04_L03_TS_003_AUTHORITY.registryIsPrototypeOnly, true);
  const spanishMarkup = renderToStaticMarkup(
    createElement(courseTs003.Renderer, {
      frame: 1,
      frameDomain: "sprite-25",
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
});
