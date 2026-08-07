import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {loadAnimationModule} from "../src/animation-registry";
import courseTs002, {
  COURSE_G04_L03_TS_002_MOVIE,
  COURSE_G04_L03_TS_002_RUNTIME,
  COURSE_G04_L03_TS_002_SOURCE,
  COURSE_G04_L03_TS_002_SOURCE_CONTRACT,
  buildCourseG04L03Ts002CaptureAttributes,
  getCourseG04L03Ts002FrameState,
  normalizeCourseG04L03Ts002Frame,
} from "../src/modules/course-g04-l03-ts-002";
import {matchPrototype} from "../src/prototype-manifest";
import {COURSE_G04_L03_TS_002_AUTHORITY} from "../src/timelines/course-g04-l03-ts-002";

const repositoryRoot = fileURLToPath(new URL("../../../", import.meta.url));
const sha256 = (bytes: Uint8Array) =>
  createHash("sha256").update(bytes).digest("hex");

test("TS002 preserves the root and separate sprite-27 and title domains", async () => {
  assert.deepEqual(COURSE_G04_L03_TS_002_MOVIE.stage, {width: 800, height: 600});
  assert.equal(COURSE_G04_L03_TS_002_MOVIE.fps, 12);
  assert.equal(COURSE_G04_L03_TS_002_MOVIE.frameCount, 355);
  assert.equal(COURSE_G04_L03_TS_002_RUNTIME.frameCount, 10);
  assert.equal(COURSE_G04_L03_TS_002_RUNTIME.defaultFrameDomain, "sprite-27");
  assert.deepEqual(COURSE_G04_L03_TS_002_RUNTIME.frameDomains, [
    {id: "sprite-27", frameCount: 355, fps: 12, rootFrame: 6},
    {id: "sprite-3", frameCount: 1, fps: 12, rootFrame: 6},
  ]);
  assert.equal(courseTs002.runtime, COURSE_G04_L03_TS_002_RUNTIME);
  assert.deepEqual(courseTs002.playbackEndFrameByDomain, {root: 1, "sprite-3": 1});
  assert.equal(
    sha256(await readFile(`${repositoryRoot}${COURSE_G04_L03_TS_002_SOURCE.swf}`)),
    COURSE_G04_L03_TS_002_SOURCE.swfSha256,
  );
  assert.equal(
    sha256(await readFile(`${repositoryRoot}${COURSE_G04_L03_TS_002_SOURCE.fla}`)),
    COURSE_G04_L03_TS_002_SOURCE.flaSha256,
  );
});

test("TS002 exposes bounded one-indexed English sprite-27 drawings", () => {
  assert.equal(normalizeCourseG04L03Ts002Frame(Number.NaN), 1);
  assert.equal(normalizeCourseG04L03Ts002Frame(356), 355);
  assert.equal(normalizeCourseG04L03Ts002Frame(8, "root"), 8);
  assert.equal(normalizeCourseG04L03Ts002Frame(8, "sprite-3"), 1);
  for (const frame of [1, 178, 355]) {
    const state = getCourseG04L03Ts002FrameState(frame, {
      frameDomain: "sprite-27",
      scenario: "source-static-frame",
      lang: "en",
      seed: frame === 355 ? -1 : 0,
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

test("TS002 fails closed for Spanish, root, companion, and mismatches", () => {
  const requests = [
    ["sprite-27", "source-static-frame", "es", "spanish-visual-and-audio-unvalidated"],
    ["root", "root-unavailable", "en", "root-baseline-unavailable"],
    ["sprite-3", "sprite-3-unavailable", "en", "companion-domain-unrendered"],
    ["root", "source-static-frame", "en", "frame-domain-scenario-mismatch"],
  ] as const;
  for (const [frameDomain, scenario, lang, blocker] of requests) {
    const state = getCourseG04L03Ts002FrameState(1, {
      frameDomain,
      scenario,
      lang,
      seed: 0,
    });
    assert.equal(state.blocker, blocker);
  }
});

test("TS002 capture identity remains deterministic and muted", () => {
  const state = getCourseG04L03Ts002FrameState(355, {
    frameDomain: "sprite-27",
    scenario: "source-static-frame",
    lang: "en",
    seed: 7,
  });
  const attributes = buildCourseG04L03Ts002CaptureAttributes({
    canvasStatus: "ready",
    entryStateSha256: "a".repeat(64),
    requirementId: "engineering-source-static-frame-355",
    state,
    traceId: "engineering-source-static",
  });
  assert.equal(attributes["data-capture-stage"], "true");
  assert.equal(attributes["data-flash-frame-domain"], "sprite-27");
  assert.equal(attributes["data-source-controls-enabled"], "false");
  assert.equal(attributes["data-source-marker-visuals"], "four-step-plan");
});

test("TS002 remains prototype-only with every acceptance gate closed", async () => {
  const manifest = matchPrototype({animationId: "course-g04-l03-ts-002"});
  assert.equal(manifest?.runtime.frameCount, 10);
  assert.equal(manifest?.movie.frameCount, 355);
  assert.equal(manifest?.title.en, "4 - Step Plan");
  assert.equal(matchPrototype({sourcePath: "/unknown/L3TS02.swf"}), undefined);
  const registered = await loadAnimationModule("course-g04-l03-ts-002");
  assert.equal(registered?.maturity, "legacy-prototype");
  assert.equal(registered?.audioCues.length, 1);
  assert.equal(registered?.audioTracks?.length, 1);
  assert.equal(COURSE_G04_L03_TS_002_SOURCE_CONTRACT.ownerAccepted, false);
  for (const [name, value] of Object.entries(COURSE_G04_L03_TS_002_AUTHORITY)) {
    if (name === "registryIsPrototypeOnly" || name === "strictAcceptanceEffect") continue;
    assert.equal(value, false, name);
  }
  assert.equal(COURSE_G04_L03_TS_002_AUTHORITY.registryIsPrototypeOnly, true);
  const spanishMarkup = renderToStaticMarkup(
    createElement(courseTs002.Renderer, {
      frame: 1,
      frameDomain: "sprite-27",
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
