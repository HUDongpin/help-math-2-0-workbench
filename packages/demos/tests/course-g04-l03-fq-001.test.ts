import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {loadAnimationModule} from "../src/animation-registry";
import courseFq001, {
  COURSE_G04_L03_FQ_001_MOVIE,
  COURSE_G04_L03_FQ_001_RUNTIME,
  COURSE_G04_L03_FQ_001_SOURCE,
  COURSE_G04_L03_FQ_001_SOURCE_CONTRACT,
  buildCourseG04L03Fq001CaptureAttributes,
  getCourseG04L03Fq001FrameState,
  normalizeCourseG04L03Fq001Frame,
} from "../src/modules/course-g04-l03-fq-001";
import {matchPrototype} from "../src/prototype-manifest";
import {COURSE_G04_L03_FQ_001_AUTHORITY} from "../src/timelines/course-g04-l03-fq-001";

const repositoryRoot = fileURLToPath(new URL("../../../", import.meta.url));
const sha256 = (bytes: Uint8Array) =>
  createHash("sha256").update(bytes).digest("hex");

test("FQ001 preserves the root, sprite-41, terminal stop, and source boundaries", async () => {
  assert.deepEqual(COURSE_G04_L03_FQ_001_MOVIE.stage, {width: 800, height: 600});
  assert.equal(COURSE_G04_L03_FQ_001_MOVIE.fps, 12);
  assert.equal(COURSE_G04_L03_FQ_001_MOVIE.frameCount, 52);
  assert.equal(COURSE_G04_L03_FQ_001_RUNTIME.frameCount, 10);
  assert.equal(COURSE_G04_L03_FQ_001_RUNTIME.defaultFrameDomain, "sprite-41");
  assert.deepEqual(COURSE_G04_L03_FQ_001_RUNTIME.frameDomains, [
    {id: "sprite-41", frameCount: 52, fps: 12, rootFrame: 6},
    {id: "sprite-22", frameCount: 1, fps: 12, rootFrame: 6},
  ]);
  assert.equal(COURSE_G04_L03_FQ_001_SOURCE.terminalStopFrame, 52);
  assert.equal(COURSE_G04_L03_FQ_001_SOURCE.inputAndKeyboardSignalCount, 40);
  assert.equal(COURSE_G04_L03_FQ_001_SOURCE.inputOperationCount, 13);
  assert.equal(COURSE_G04_L03_FQ_001_SOURCE.timelineNavigationOccurrenceCount, 19);
  assert.equal(COURSE_G04_L03_FQ_001_SOURCE.replayResetOperationCount, 4);
  assert.equal(COURSE_G04_L03_FQ_001_SOURCE.sharedCatalogAudioAssociationCount, 108);
  assert.equal(COURSE_G04_L03_FQ_001_SOURCE.embeddedAudioStreamCount, 0);
  assert.equal(courseFq001.runtime, COURSE_G04_L03_FQ_001_RUNTIME);
  assert.deepEqual(courseFq001.playbackEndFrameByDomain, {root: 1, "sprite-22": 1});
  for (const [path, expected] of [
    [COURSE_G04_L03_FQ_001_SOURCE.swf, COURSE_G04_L03_FQ_001_SOURCE.swfSha256],
    [COURSE_G04_L03_FQ_001_SOURCE.fla, COURSE_G04_L03_FQ_001_SOURCE.flaSha256],
  ] as const) {
    assert.equal(sha256(await readFile(`${repositoryRoot}${path}`)), expected);
  }
});

test("FQ001 exposes bounded English source-static introduction drawings", () => {
  assert.equal(normalizeCourseG04L03Fq001Frame(Number.NaN), 1);
  assert.equal(normalizeCourseG04L03Fq001Frame(53), 52);
  assert.equal(normalizeCourseG04L03Fq001Frame(8, "root"), 8);
  assert.equal(normalizeCourseG04L03Fq001Frame(2, "sprite-22"), 1);
  for (const frame of [1, 26, 51, 52]) {
    const state = getCourseG04L03Fq001FrameState(frame, {
      frameDomain: "sprite-41",
      scenario: "source-static-frame",
      lang: "en",
      seed: frame,
    });
    assert.equal(state.status, "ready");
    assert.equal(state.frame, frame);
    assert.equal(state.exportFrame, frame - 1);
    assert.deepEqual(state.visibleSourceMarkers,
      frame === 52
        ? ["final-quiz-introduction", "terminal-stop-static-drawing"]
        : ["final-quiz-introduction"]);
    assert.equal(state.interactiveControlsEnabled, false);
    assert.equal(state.audioRendered, false);
    assert.equal(state.naturalRuntimeEstablished, false);
  }
});

test("FQ001 fails closed for Spanish, root, companion, and unreachable components", () => {
  const requests = [
    ["sprite-41", "source-static-frame", "es", "spanish-visual-and-audio-unvalidated"],
    ["root", "root-unavailable", "en", "root-baseline-unavailable"],
    ["sprite-22", "sprite-22-unavailable", "en", "companion-domain-unrendered"],
    ["sprite-1", "sprite-1-unavailable", "en", "unsupported-runtime-request"],
    ["root", "source-static-frame", "en", "frame-domain-scenario-mismatch"],
  ] as const;
  for (const [frameDomain, scenario, lang, blocker] of requests) {
    const state = getCourseG04L03Fq001FrameState(1, {
      frameDomain,
      scenario,
      lang,
      seed: 0,
    });
    assert.equal(state.blocker, blocker);
  }
});

test("FQ001 capture identity remains deterministic, muted, and noninteractive", () => {
  const state = getCourseG04L03Fq001FrameState(52, {
    frameDomain: "sprite-41",
    scenario: "source-static-frame",
    lang: "en",
    seed: 7,
  });
  const attributes = buildCourseG04L03Fq001CaptureAttributes({
    canvasStatus: "ready",
    entryStateSha256: "a".repeat(64),
    requirementId: "engineering-source-static-frame-52",
    state,
    traceId: "engineering-source-static",
  });
  assert.equal(attributes["data-capture-stage"], "true");
  assert.equal(attributes["data-flash-frame-domain"], "sprite-41");
  assert.equal(attributes["data-source-controls-enabled"], "false");
  assert.equal(attributes["data-source-marker-visuals"],
    "final-quiz-introduction,terminal-stop-static-drawing");
});

test("FQ001 remains prototype-only with every acceptance gate closed", async () => {
  const manifest = matchPrototype({animationId: "course-g04-l03-fq-001"});
  assert.equal(manifest?.runtime.frameCount, 10);
  assert.equal(manifest?.runtime.frameDomains?.length, 2);
  assert.equal(manifest?.movie.frameCount, 52);
  assert.equal(manifest?.title.en, "Final Quiz Introduction");
  assert.equal(matchPrototype({sourcePath: "/unknown/L3FQ01.swf"}), undefined);
  const registered = await loadAnimationModule("course-g04-l03-fq-001");
  assert.equal(registered?.maturity, "legacy-prototype");
  assert.equal(registered?.audioCues.length, 0);
  assert.equal(COURSE_G04_L03_FQ_001_SOURCE_CONTRACT.ownerAccepted, false);
  for (const [name, value] of Object.entries(COURSE_G04_L03_FQ_001_AUTHORITY)) {
    if (name === "registryIsPrototypeOnly" || name === "strictAcceptanceEffect") continue;
    assert.equal(value, false, name);
  }
  assert.equal(COURSE_G04_L03_FQ_001_AUTHORITY.registryIsPrototypeOnly, true);
  const spanishMarkup = renderToStaticMarkup(
    createElement(courseFq001.Renderer, {
      frame: 1,
      frameDomain: "sprite-41",
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
