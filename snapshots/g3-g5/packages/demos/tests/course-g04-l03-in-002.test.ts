import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {loadAnimationModule} from "../src/animation-registry";
import courseIn002, {
  COURSE_G04_L03_IN_002_MOVIE,
  COURSE_G04_L03_IN_002_RUNTIME,
  COURSE_G04_L03_IN_002_SOURCE,
  COURSE_G04_L03_IN_002_SOURCE_CONTRACT,
  buildCourseG04L03In002CaptureAttributes,
  getCourseG04L03In002FrameState,
  normalizeCourseG04L03In002Frame,
} from "../src/modules/course-g04-l03-in-002";
import {matchPrototype} from "../src/prototype-manifest";
import {COURSE_G04_L03_IN_002_AUTHORITY} from "../src/timelines/course-g04-l03-in-002";

const repositoryRoot = fileURLToPath(new URL("../../../", import.meta.url));
const sha256 = (bytes: Uint8Array) =>
  createHash("sha256").update(bytes).digest("hex");

test("IN002 preserves the root and separate sprite-88 and sprite-5 timelines", async () => {
  assert.deepEqual(COURSE_G04_L03_IN_002_MOVIE.stage, {width: 800, height: 600});
  assert.equal(COURSE_G04_L03_IN_002_MOVIE.fps, 12);
  assert.equal(COURSE_G04_L03_IN_002_MOVIE.frameCount, 492);
  assert.equal(COURSE_G04_L03_IN_002_RUNTIME.frameCount, 10);
  assert.equal(COURSE_G04_L03_IN_002_RUNTIME.defaultFrameDomain, "sprite-88");
  assert.deepEqual(COURSE_G04_L03_IN_002_RUNTIME.frameDomains, [
    {id: "sprite-88", frameCount: 492, fps: 12, rootFrame: 6},
    {id: "sprite-5", frameCount: 1, fps: 12, rootFrame: 6},
  ]);
  assert.equal(courseIn002.runtime, COURSE_G04_L03_IN_002_RUNTIME);
  assert.deepEqual(courseIn002.playbackEndFrameByDomain, {root: 1, "sprite-5": 1});
  assert.equal(COURSE_G04_L03_IN_002_SOURCE.fla, null);
  assert.equal(
    sha256(await readFile(`${repositoryRoot}${COURSE_G04_L03_IN_002_SOURCE.swf}`)),
    COURSE_G04_L03_IN_002_SOURCE.swfSha256,
  );
});

test("IN002 exposes bounded one-indexed English sprite-88 drawings", () => {
  assert.equal(normalizeCourseG04L03In002Frame(Number.NaN), 1);
  assert.equal(normalizeCourseG04L03In002Frame(493), 492);
  assert.equal(normalizeCourseG04L03In002Frame(8, "root"), 8);
  for (const frame of [1, 246, 492]) {
    const state = getCourseG04L03In002FrameState(frame, {
      frameDomain: "sprite-88",
      scenario: "source-static-frame",
      lang: "en",
      seed: frame === 492 ? -1 : 0,
    });
    assert.equal(state.status, "ready");
    assert.equal(state.frame, frame);
    assert.equal(state.exportFrame, frame - 1);
    assert.deepEqual(state.visibleSourceMarkers, ["numbers-on-number-line"]);
    assert.equal(state.interactiveControlsEnabled, false);
    assert.equal(state.audioRendered, false);
    assert.equal(state.naturalRuntimeEstablished, false);
  }
});

test("IN002 fails closed for Spanish, root, companion, and mismatched requests", () => {
  const requests = [
    ["sprite-88", "source-static-frame", "es", "spanish-visual-and-audio-unvalidated"],
    ["root", "root-unavailable", "en", "root-baseline-unavailable"],
    ["sprite-5", "sprite-5-unavailable", "en", "companion-domain-unrendered"],
    ["root", "source-static-frame", "en", "frame-domain-scenario-mismatch"],
  ] as const;
  for (const [frameDomain, scenario, lang, blocker] of requests) {
    const state = getCourseG04L03In002FrameState(1, {
      frameDomain,
      scenario,
      lang,
      seed: 0,
    });
    assert.equal(state.blocker, blocker);
  }
});

test("IN002 capture identity remains deterministic and muted", () => {
  const state = getCourseG04L03In002FrameState(492, {
    frameDomain: "sprite-88",
    scenario: "source-static-frame",
    lang: "en",
    seed: 7,
  });
  const attributes = buildCourseG04L03In002CaptureAttributes({
    canvasStatus: "ready",
    entryStateSha256: "a".repeat(64),
    requirementId: "engineering-source-static-frame-492",
    state,
    traceId: "engineering-source-static",
  });
  assert.equal(attributes["data-capture-stage"], "true");
  assert.equal(attributes["data-flash-frame-domain"], "sprite-88");
  assert.equal(attributes["data-source-controls-enabled"], "false");
  assert.equal(attributes["data-source-marker-visuals"], "numbers-on-number-line");
});

test("IN002 remains prototype-only with every acceptance gate closed", async () => {
  const manifest = matchPrototype({animationId: "course-g04-l03-in-002"});
  assert.equal(manifest?.runtime.frameCount, 10);
  assert.equal(manifest?.movie.frameCount, 492);
  assert.equal(manifest?.title.en, "Numbers on the Number Line");
  assert.equal(matchPrototype({sourcePath: "/unknown/L3IN02.swf"}), undefined);
  const registered = await loadAnimationModule("course-g04-l03-in-002");
  assert.equal(registered?.maturity, "legacy-prototype");
  assert.equal(registered?.audioCues.length, 1);
  assert.equal(registered?.audioTracks?.length, 1);
  assert.equal(COURSE_G04_L03_IN_002_SOURCE_CONTRACT.ownerAccepted, false);
  for (const [name, value] of Object.entries(COURSE_G04_L03_IN_002_AUTHORITY)) {
    if (name === "registryIsPrototypeOnly" || name === "strictAcceptanceEffect") continue;
    assert.equal(value, false, name);
  }
  assert.equal(COURSE_G04_L03_IN_002_AUTHORITY.registryIsPrototypeOnly, true);
  const spanishMarkup = renderToStaticMarkup(
    createElement(courseIn002.Renderer, {
      frame: 1,
      frameDomain: "sprite-88",
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
