import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {loadAnimationModule} from "../src/animation-registry";
import courseIn007, {
  COURSE_G04_L03_IN_007_MOVIE,
  COURSE_G04_L03_IN_007_RUNTIME,
  COURSE_G04_L03_IN_007_SOURCE,
  COURSE_G04_L03_IN_007_SOURCE_CONTRACT,
  buildCourseG04L03In007CaptureAttributes,
  getCourseG04L03In007FrameState,
  normalizeCourseG04L03In007Frame,
} from "../src/modules/course-g04-l03-in-007";
import {matchPrototype} from "../src/prototype-manifest";
import {COURSE_G04_L03_IN_007_AUTHORITY} from "../src/timelines/course-g04-l03-in-007";

const repositoryRoot = fileURLToPath(new URL("../../../", import.meta.url));
const sha256 = (bytes: Uint8Array) =>
  createHash("sha256").update(bytes).digest("hex");

test("IN007 preserves the root and separate sprite-98 and sprite-5 timelines", async () => {
  assert.deepEqual(COURSE_G04_L03_IN_007_MOVIE.stage, {width: 800, height: 600});
  assert.equal(COURSE_G04_L03_IN_007_MOVIE.fps, 12);
  assert.equal(COURSE_G04_L03_IN_007_MOVIE.frameCount, 555);
  assert.equal(COURSE_G04_L03_IN_007_RUNTIME.frameCount, 10);
  assert.equal(COURSE_G04_L03_IN_007_RUNTIME.defaultFrameDomain, "sprite-98");
  assert.deepEqual(COURSE_G04_L03_IN_007_RUNTIME.frameDomains, [
    {id: "sprite-98", frameCount: 555, fps: 12, rootFrame: 6},
    {id: "sprite-5", frameCount: 1, fps: 12, rootFrame: 6},
  ]);
  assert.equal(courseIn007.runtime, COURSE_G04_L03_IN_007_RUNTIME);
  assert.deepEqual(courseIn007.playbackEndFrameByDomain, {root: 1, "sprite-5": 1});
  assert.equal(COURSE_G04_L03_IN_007_SOURCE.fla, null);
  assert.equal(
    sha256(await readFile(`${repositoryRoot}${COURSE_G04_L03_IN_007_SOURCE.swf}`)),
    COURSE_G04_L03_IN_007_SOURCE.swfSha256,
  );
});

test("IN007 exposes bounded one-indexed English sprite-98 drawings", () => {
  assert.equal(normalizeCourseG04L03In007Frame(Number.NaN), 1);
  assert.equal(normalizeCourseG04L03In007Frame(556), 555);
  assert.equal(normalizeCourseG04L03In007Frame(8, "root"), 8);
  for (const frame of [1, 278, 555]) {
    const state = getCourseG04L03In007FrameState(frame, {
      frameDomain: "sprite-98",
      scenario: "source-static-frame",
      lang: "en",
      seed: frame === 555 ? -1 : 0,
    });
    assert.equal(state.status, "ready");
    assert.equal(state.frame, frame);
    assert.equal(state.exportFrame, frame - 1);
    assert.deepEqual(state.visibleSourceMarkers, ["negative-number-patterns"]);
    assert.equal(state.interactiveControlsEnabled, false);
    assert.equal(state.audioRendered, false);
    assert.equal(state.naturalRuntimeEstablished, false);
  }
});

test("IN007 fails closed for Spanish, root, companion, and mismatched requests", () => {
  const requests = [
    ["sprite-98", "source-static-frame", "es", "spanish-visual-and-audio-unvalidated"],
    ["root", "root-unavailable", "en", "root-baseline-unavailable"],
    ["sprite-5", "sprite-5-unavailable", "en", "companion-domain-unrendered"],
    ["root", "source-static-frame", "en", "frame-domain-scenario-mismatch"],
  ] as const;
  for (const [frameDomain, scenario, lang, blocker] of requests) {
    const state = getCourseG04L03In007FrameState(1, {
      frameDomain,
      scenario,
      lang,
      seed: 0,
    });
    assert.equal(state.blocker, blocker);
  }
});

test("IN007 capture identity remains deterministic and muted", () => {
  const state = getCourseG04L03In007FrameState(555, {
    frameDomain: "sprite-98",
    scenario: "source-static-frame",
    lang: "en",
    seed: 7,
  });
  const attributes = buildCourseG04L03In007CaptureAttributes({
    canvasStatus: "ready",
    entryStateSha256: "a".repeat(64),
    requirementId: "engineering-source-static-frame-555",
    state,
    traceId: "engineering-source-static",
  });
  assert.equal(attributes["data-capture-stage"], "true");
  assert.equal(attributes["data-flash-frame-domain"], "sprite-98");
  assert.equal(attributes["data-source-controls-enabled"], "false");
  assert.equal(attributes["data-source-marker-visuals"], "negative-number-patterns");
});

test("IN007 remains prototype-only with every acceptance gate closed", async () => {
  const manifest = matchPrototype({animationId: "course-g04-l03-in-007"});
  assert.equal(manifest?.runtime.frameCount, 10);
  assert.equal(manifest?.movie.frameCount, 555);
  assert.equal(manifest?.title.en, "Patterns");
  assert.equal(matchPrototype({sourcePath: "/unknown/L3IN07.swf"}), undefined);
  const registered = await loadAnimationModule("course-g04-l03-in-007");
  assert.equal(registered?.maturity, "legacy-prototype");
  assert.equal(registered?.audioCues.length, 1);
  assert.equal(registered?.audioTracks?.length, 1);
  assert.equal(COURSE_G04_L03_IN_007_SOURCE_CONTRACT.ownerAccepted, false);
  for (const [name, value] of Object.entries(COURSE_G04_L03_IN_007_AUTHORITY)) {
    if (name === "registryIsPrototypeOnly" || name === "strictAcceptanceEffect") continue;
    assert.equal(value, false, name);
  }
  assert.equal(COURSE_G04_L03_IN_007_AUTHORITY.registryIsPrototypeOnly, true);
  const spanishMarkup = renderToStaticMarkup(
    createElement(courseIn007.Renderer, {
      frame: 1,
      frameDomain: "sprite-98",
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
