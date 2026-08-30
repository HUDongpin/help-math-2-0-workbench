import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {loadAnimationModule} from "../src/animation-registry";
import courseVb004, {
  COURSE_G04_L03_VB_004_MOVIE,
  COURSE_G04_L03_VB_004_RUNTIME,
  COURSE_G04_L03_VB_004_SOURCE,
  COURSE_G04_L03_VB_004_SOURCE_CONTRACT,
  buildCourseG04L03Vb004CaptureAttributes,
  getCourseG04L03Vb004FrameState,
  normalizeCourseG04L03Vb004Frame,
} from "../src/modules/course-g04-l03-vb-004";
import {matchPrototype} from "../src/prototype-manifest";
import {COURSE_G04_L03_VB_004_AUTHORITY} from "../src/timelines/course-g04-l03-vb-004";

const repositoryRoot = fileURLToPath(new URL("../../../", import.meta.url));
const sha256 = (bytes: Uint8Array) =>
  createHash("sha256").update(bytes).digest("hex");

test("G4 VB004 preserves the root and separate sprite-53 and title domains", async () => {
  assert.deepEqual(COURSE_G04_L03_VB_004_MOVIE.stage, {width: 800, height: 600});
  assert.equal(COURSE_G04_L03_VB_004_MOVIE.fps, 12);
  assert.equal(COURSE_G04_L03_VB_004_MOVIE.frameCount, 245);
  assert.equal(COURSE_G04_L03_VB_004_RUNTIME.frameCount, 10);
  assert.equal(COURSE_G04_L03_VB_004_RUNTIME.defaultFrameDomain, "sprite-53");
  assert.deepEqual(COURSE_G04_L03_VB_004_RUNTIME.frameDomains, [
    {id: "sprite-53", frameCount: 245, fps: 12, rootFrame: 6},
    {id: "sprite-5", frameCount: 1, fps: 12, rootFrame: 6},
  ]);
  assert.equal(courseVb004.runtime, COURSE_G04_L03_VB_004_RUNTIME);
  assert.deepEqual(courseVb004.playbackEndFrameByDomain, {root: 1, "sprite-5": 1});
  assert.equal(
    sha256(await readFile(`${repositoryRoot}${COURSE_G04_L03_VB_004_SOURCE.swf}`)),
    COURSE_G04_L03_VB_004_SOURCE.swfSha256,
  );
  assert.equal(
    sha256(await readFile(`${repositoryRoot}${COURSE_G04_L03_VB_004_SOURCE.fla}`)),
    COURSE_G04_L03_VB_004_SOURCE.flaSha256,
  );
});

test("G4 VB004 exposes bounded one-indexed English sprite-53 drawings", () => {
  assert.equal(normalizeCourseG04L03Vb004Frame(Number.NaN), 1);
  assert.equal(normalizeCourseG04L03Vb004Frame(246), 245);
  assert.equal(normalizeCourseG04L03Vb004Frame(8, "root"), 8);
  assert.equal(normalizeCourseG04L03Vb004Frame(8, "sprite-5"), 1);
  for (const frame of [1, 123, 245]) {
    const state = getCourseG04L03Vb004FrameState(frame, {
      frameDomain: "sprite-53",
      scenario: "source-static-frame",
      lang: "en",
      seed: frame === 245 ? -1 : 0,
    });
    assert.equal(state.status, "ready");
    assert.equal(state.frame, frame);
    assert.equal(state.exportFrame, frame - 1);
    assert.deepEqual(state.visibleSourceMarkers, ["positive-numbers"]);
    assert.equal(state.interactiveControlsEnabled, false);
    assert.equal(state.audioRendered, false);
    assert.equal(state.naturalRuntimeEstablished, false);
  }
});

test("G4 VB004 fails closed for Spanish, root, companion, and mismatches", () => {
  const requests = [
    ["sprite-53", "source-static-frame", "es", "spanish-visual-and-audio-unvalidated"],
    ["root", "root-unavailable", "en", "root-baseline-unavailable"],
    ["sprite-5", "sprite-5-unavailable", "en", "companion-domain-unrendered"],
    ["root", "source-static-frame", "en", "frame-domain-scenario-mismatch"],
  ] as const;
  for (const [frameDomain, scenario, lang, blocker] of requests) {
    const state = getCourseG04L03Vb004FrameState(1, {
      frameDomain,
      scenario,
      lang,
      seed: 0,
    });
    assert.equal(state.blocker, blocker);
  }
});

test("G4 VB004 capture identity remains deterministic and muted", () => {
  const state = getCourseG04L03Vb004FrameState(245, {
    frameDomain: "sprite-53",
    scenario: "source-static-frame",
    lang: "en",
    seed: 7,
  });
  const attributes = buildCourseG04L03Vb004CaptureAttributes({
    canvasStatus: "ready",
    entryStateSha256: "a".repeat(64),
    requirementId: "engineering-source-static-frame-245",
    state,
    traceId: "engineering-source-static",
  });
  assert.equal(attributes["data-capture-stage"], "true");
  assert.equal(attributes["data-flash-frame-domain"], "sprite-53");
  assert.equal(attributes["data-source-controls-enabled"], "false");
  assert.equal(attributes["data-source-marker-visuals"], "positive-numbers");
});

test("G4 VB004 remains placement-bound and acceptance-neutral", async () => {
  const manifest = matchPrototype({animationId: "course-g04-l03-vb-004"});
  assert.equal(manifest?.runtime.frameCount, 10);
  assert.equal(manifest?.movie.frameCount, 245);
  assert.equal(manifest?.title.en, "Positive Numbers");
  assert.equal(matchPrototype({sourcePath: "/unknown/L3VB04.swf"}), undefined);
  const registered = await loadAnimationModule("course-g04-l03-vb-004");
  assert.equal(registered?.maturity, "legacy-prototype");
  assert.equal(registered?.audioCues.length, 1);
  assert.equal(registered?.audioTracks?.length, 1);
  assert.equal(COURSE_G04_L03_VB_004_SOURCE_CONTRACT.ownerAccepted, false);
  for (const [name, value] of Object.entries(COURSE_G04_L03_VB_004_AUTHORITY)) {
    if (name === "registryIsPrototypeOnly" || name === "strictAcceptanceEffect") continue;
    assert.equal(value, false, name);
  }
  assert.equal(COURSE_G04_L03_VB_004_AUTHORITY.registryIsPrototypeOnly, true);
  const spanishMarkup = renderToStaticMarkup(
    createElement(courseVb004.Renderer, {
      frame: 1,
      frameDomain: "sprite-53",
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
