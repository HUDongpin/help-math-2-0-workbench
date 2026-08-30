import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {loadAnimationModule} from "../src/animation-registry";
import courseIn011, {
  COURSE_G04_L03_IN_011_MOVIE,
  COURSE_G04_L03_IN_011_RUNTIME,
  COURSE_G04_L03_IN_011_SOURCE,
  COURSE_G04_L03_IN_011_SOURCE_CONTRACT,
  buildCourseG04L03In011CaptureAttributes,
  getCourseG04L03In011FrameState,
  normalizeCourseG04L03In011Frame,
} from "../src/modules/course-g04-l03-in-011";
import {matchPrototype} from "../src/prototype-manifest";
import {COURSE_G04_L03_IN_011_AUTHORITY} from "../src/timelines/course-g04-l03-in-011";

const repositoryRoot = fileURLToPath(new URL("../../../", import.meta.url));
const sha256 = (bytes: Uint8Array) =>
  createHash("sha256").update(bytes).digest("hex");

test("IN011 preserves the root and separate sprite-51 timeline", async () => {
  assert.deepEqual(COURSE_G04_L03_IN_011_MOVIE.stage, {width: 800, height: 600});
  assert.equal(COURSE_G04_L03_IN_011_MOVIE.fps, 12);
  assert.equal(COURSE_G04_L03_IN_011_MOVIE.frameCount, 441);
  assert.equal(COURSE_G04_L03_IN_011_RUNTIME.frameCount, 10);
  assert.equal(COURSE_G04_L03_IN_011_RUNTIME.defaultFrameDomain, "sprite-51");
  assert.deepEqual(COURSE_G04_L03_IN_011_RUNTIME.frameDomains, [
    {id: "sprite-51", frameCount: 441, fps: 12, rootFrame: 6},
  ]);
  assert.equal(courseIn011.runtime, COURSE_G04_L03_IN_011_RUNTIME);
  assert.deepEqual(courseIn011.playbackEndFrameByDomain, {root: 1});
  assert.equal(COURSE_G04_L03_IN_011_SOURCE.fla, null);
  assert.equal(
    sha256(await readFile(`${repositoryRoot}${COURSE_G04_L03_IN_011_SOURCE.swf}`)),
    COURSE_G04_L03_IN_011_SOURCE.swfSha256,
  );
});

test("IN011 exposes bounded one-indexed English sprite-51 drawings", () => {
  assert.equal(normalizeCourseG04L03In011Frame(Number.NaN), 1);
  assert.equal(normalizeCourseG04L03In011Frame(442), 441);
  assert.equal(normalizeCourseG04L03In011Frame(8, "root"), 8);
  for (const frame of [1, 221, 441]) {
    const state = getCourseG04L03In011FrameState(frame, {
      frameDomain: "sprite-51",
      scenario: "source-static-frame",
      lang: "en",
      seed: frame === 441 ? -1 : 0,
    });
    assert.equal(state.status, "ready");
    assert.equal(state.frame, frame);
    assert.equal(state.exportFrame, frame - 1);
    assert.deepEqual(state.visibleSourceMarkers, ["owing-situation"]);
    assert.equal(state.interactiveControlsEnabled, false);
    assert.equal(state.audioRendered, false);
    assert.equal(state.naturalRuntimeEstablished, false);
  }
});

test("IN011 fails closed for Spanish, root, and mismatched requests", () => {
  const requests = [
    ["sprite-51", "source-static-frame", "es", "spanish-visual-and-audio-unvalidated"],
    ["root", "root-unavailable", "en", "root-baseline-unavailable"],
    ["root", "source-static-frame", "en", "frame-domain-scenario-mismatch"],
  ] as const;
  for (const [frameDomain, scenario, lang, blocker] of requests) {
    const state = getCourseG04L03In011FrameState(1, {
      frameDomain,
      scenario,
      lang,
      seed: 0,
    });
    assert.equal(state.blocker, blocker);
  }
});

test("IN011 capture identity remains deterministic and muted", () => {
  const state = getCourseG04L03In011FrameState(441, {
    frameDomain: "sprite-51",
    scenario: "source-static-frame",
    lang: "en",
    seed: 7,
  });
  const attributes = buildCourseG04L03In011CaptureAttributes({
    canvasStatus: "ready",
    entryStateSha256: "a".repeat(64),
    requirementId: "engineering-source-static-frame-441",
    state,
    traceId: "engineering-source-static",
  });
  assert.equal(attributes["data-capture-stage"], "true");
  assert.equal(attributes["data-flash-frame-domain"], "sprite-51");
  assert.equal(attributes["data-source-controls-enabled"], "false");
  assert.equal(attributes["data-source-marker-visuals"], "owing-situation");
});

test("IN011 remains prototype-only with every acceptance gate closed", async () => {
  const manifest = matchPrototype({animationId: "course-g04-l03-in-011"});
  assert.equal(manifest?.runtime.frameCount, 10);
  assert.equal(manifest?.movie.frameCount, 441);
  assert.equal(manifest?.title.en, "Situations with Negative Numbers: Owing");
  assert.equal(matchPrototype({sourcePath: "/unknown/L3IN11.swf"}), undefined);
  const registered = await loadAnimationModule("course-g04-l03-in-011");
  assert.equal(registered?.maturity, "legacy-prototype");
  assert.equal(registered?.audioCues.length, 1);
  assert.equal(registered?.audioTracks?.length, 1);
  assert.equal(COURSE_G04_L03_IN_011_SOURCE_CONTRACT.ownerAccepted, false);
  for (const [name, value] of Object.entries(COURSE_G04_L03_IN_011_AUTHORITY)) {
    if (name === "registryIsPrototypeOnly" || name === "strictAcceptanceEffect") continue;
    assert.equal(value, false, name);
  }
  assert.equal(COURSE_G04_L03_IN_011_AUTHORITY.registryIsPrototypeOnly, true);
  const spanishMarkup = renderToStaticMarkup(
    createElement(courseIn011.Renderer, {
      frame: 1,
      frameDomain: "sprite-51",
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
