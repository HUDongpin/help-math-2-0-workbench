import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {loadAnimationModule} from "../src/animation-registry";
import courseRw004, {
  COURSE_G04_L03_RW_004_MOVIE,
  COURSE_G04_L03_RW_004_RUNTIME,
  COURSE_G04_L03_RW_004_SOURCE,
  COURSE_G04_L03_RW_004_SOURCE_CONTRACT,
  buildCourseG04L03Rw004CaptureAttributes,
  getCourseG04L03Rw004FrameState,
  normalizeCourseG04L03Rw004Frame,
} from "../src/modules/course-g04-l03-rw-004";
import {matchPrototype} from "../src/prototype-manifest";
import {COURSE_G04_L03_RW_004_AUTHORITY} from "../src/timelines/course-g04-l03-rw-004";

const repositoryRoot = fileURLToPath(new URL("../../../", import.meta.url));
const sha256 = (bytes: Uint8Array) =>
  createHash("sha256").update(bytes).digest("hex");

test("RW004 preserves the root, sprite-121, nested sprite-82, and title facts", async () => {
  assert.deepEqual(COURSE_G04_L03_RW_004_MOVIE.stage, {width: 800, height: 600});
  assert.equal(COURSE_G04_L03_RW_004_MOVIE.fps, 12);
  assert.equal(COURSE_G04_L03_RW_004_MOVIE.frameCount, 442);
  assert.equal(COURSE_G04_L03_RW_004_RUNTIME.frameCount, 10);
  assert.equal(COURSE_G04_L03_RW_004_RUNTIME.defaultFrameDomain, "sprite-121");
  assert.deepEqual(COURSE_G04_L03_RW_004_RUNTIME.frameDomains, [
    {id: "sprite-121", frameCount: 442, fps: 12, rootFrame: 6},
    {id: "sprite-125", frameCount: 1, fps: 12, rootFrame: 6},
  ]);
  assert.equal(COURSE_G04_L03_RW_004_SOURCE.nestedSpriteObjectId, 82);
  assert.equal(COURSE_G04_L03_RW_004_SOURCE.nestedSpritePlacementFrame, 204);
  assert.equal(courseRw004.runtime, COURSE_G04_L03_RW_004_RUNTIME);
  assert.deepEqual(courseRw004.playbackEndFrameByDomain, {root: 1, "sprite-125": 1});
  assert.equal(COURSE_G04_L03_RW_004_SOURCE.fla, null);
  assert.equal(
    sha256(await readFile(`${repositoryRoot}${COURSE_G04_L03_RW_004_SOURCE.swf}`)),
    COURSE_G04_L03_RW_004_SOURCE.swfSha256,
  );
});

test("RW004 exposes bounded one-indexed English sprite-121 drawings", () => {
  assert.equal(normalizeCourseG04L03Rw004Frame(Number.NaN), 1);
  assert.equal(normalizeCourseG04L03Rw004Frame(443), 442);
  assert.equal(normalizeCourseG04L03Rw004Frame(8, "root"), 8);
  assert.equal(normalizeCourseG04L03Rw004Frame(8, "sprite-125"), 1);
  for (const frame of [1, 221, 442]) {
    const state = getCourseG04L03Rw004FrameState(frame, {
      frameDomain: "sprite-121",
      scenario: "source-static-frame",
      lang: "en",
      seed: frame === 442 ? -1 : 0,
    });
    assert.equal(state.status, "ready");
    assert.equal(state.frame, frame);
    assert.equal(state.exportFrame, frame - 1);
    assert.deepEqual(state.visibleSourceMarkers, ["negative-numbers-number-line"]);
    assert.equal(state.interactiveControlsEnabled, false);
    assert.equal(state.audioRendered, false);
    assert.equal(state.naturalRuntimeEstablished, false);
  }
});

test("RW004 fails closed for Spanish, root, title, and mismatches", () => {
  const requests = [
    ["sprite-121", "source-static-frame", "es", "spanish-visual-and-audio-unvalidated"],
    ["root", "root-unavailable", "en", "root-baseline-unavailable"],
    ["sprite-125", "sprite-125-unavailable", "en", "companion-domain-unrendered"],
    ["root", "source-static-frame", "en", "frame-domain-scenario-mismatch"],
  ] as const;
  for (const [frameDomain, scenario, lang, blocker] of requests) {
    const state = getCourseG04L03Rw004FrameState(1, {
      frameDomain,
      scenario,
      lang,
      seed: 0,
    });
    assert.equal(state.blocker, blocker);
  }
});

test("RW004 capture identity remains deterministic and muted", () => {
  const state = getCourseG04L03Rw004FrameState(442, {
    frameDomain: "sprite-121",
    scenario: "source-static-frame",
    lang: "en",
    seed: 7,
  });
  const attributes = buildCourseG04L03Rw004CaptureAttributes({
    canvasStatus: "ready",
    entryStateSha256: "a".repeat(64),
    requirementId: "engineering-source-static-frame-442",
    state,
    traceId: "engineering-source-static",
  });
  assert.equal(attributes["data-capture-stage"], "true");
  assert.equal(attributes["data-flash-frame-domain"], "sprite-121");
  assert.equal(attributes["data-source-controls-enabled"], "false");
  assert.equal(attributes["data-source-marker-visuals"], "negative-numbers-number-line");
});

test("RW004 remains prototype-only with every acceptance gate closed", async () => {
  const manifest = matchPrototype({animationId: "course-g04-l03-rw-004"});
  assert.equal(manifest?.runtime.frameCount, 10);
  assert.equal(manifest?.movie.frameCount, 442);
  assert.equal(manifest?.title.en, "Page 3");
  assert.equal(matchPrototype({sourcePath: "/unknown/L3RW04.swf"}), undefined);
  const registered = await loadAnimationModule("course-g04-l03-rw-004");
  assert.equal(registered?.maturity, "legacy-prototype");
  assert.equal(registered?.audioCues.length, 1);
  assert.equal(registered?.audioTracks?.length, 1);
  assert.equal(COURSE_G04_L03_RW_004_SOURCE_CONTRACT.ownerAccepted, false);
  for (const [name, value] of Object.entries(COURSE_G04_L03_RW_004_AUTHORITY)) {
    if (name === "registryIsPrototypeOnly" || name === "strictAcceptanceEffect") continue;
    assert.equal(value, false, name);
  }
  assert.equal(COURSE_G04_L03_RW_004_AUTHORITY.registryIsPrototypeOnly, true);
  const spanishMarkup = renderToStaticMarkup(
    createElement(courseRw004.Renderer, {
      frame: 1,
      frameDomain: "sprite-121",
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
