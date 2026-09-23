import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {loadAnimationModule} from "../src/animation-registry";
import courseRw002, {
  COURSE_G04_L03_RW_002_MOVIE,
  COURSE_G04_L03_RW_002_RUNTIME,
  COURSE_G04_L03_RW_002_SOURCE,
  COURSE_G04_L03_RW_002_SOURCE_CONTRACT,
  buildCourseG04L03Rw002CaptureAttributes,
  getCourseG04L03Rw002FrameState,
  normalizeCourseG04L03Rw002Frame,
} from "../src/modules/course-g04-l03-rw-002";
import {matchPrototype} from "../src/prototype-manifest";
import {COURSE_G04_L03_RW_002_AUTHORITY} from "../src/timelines/course-g04-l03-rw-002";

const repositoryRoot = fileURLToPath(new URL("../../../", import.meta.url));
const sha256 = (bytes: Uint8Array) =>
  createHash("sha256").update(bytes).digest("hex");

test("RW002 preserves the root, sprite-421, source buttons, and title facts", async () => {
  assert.deepEqual(COURSE_G04_L03_RW_002_MOVIE.stage, {width: 800, height: 600});
  assert.equal(COURSE_G04_L03_RW_002_MOVIE.fps, 12);
  assert.equal(COURSE_G04_L03_RW_002_MOVIE.frameCount, 1289);
  assert.equal(COURSE_G04_L03_RW_002_RUNTIME.frameCount, 10);
  assert.equal(COURSE_G04_L03_RW_002_RUNTIME.defaultFrameDomain, "sprite-421");
  assert.deepEqual(COURSE_G04_L03_RW_002_RUNTIME.frameDomains, [
    {id: "sprite-421", frameCount: 1289, fps: 12, rootFrame: 6},
    {id: "sprite-425", frameCount: 1, fps: 12, rootFrame: 6},
  ]);
  assert.deepEqual(COURSE_G04_L03_RW_002_SOURCE.buttonObjectIds, [377, 378, 379]);
  assert.equal(COURSE_G04_L03_RW_002_SOURCE.sourceButtonPlacementFrame, 1099);
  assert.equal(courseRw002.runtime, COURSE_G04_L03_RW_002_RUNTIME);
  assert.deepEqual(courseRw002.playbackEndFrameByDomain, {root: 1, "sprite-425": 1});
  assert.equal(COURSE_G04_L03_RW_002_SOURCE.fla, null);
  assert.equal(
    sha256(await readFile(`${repositoryRoot}${COURSE_G04_L03_RW_002_SOURCE.swf}`)),
    COURSE_G04_L03_RW_002_SOURCE.swfSha256,
  );
  assert.equal(
    sha256(await readFile(`${repositoryRoot}${COURSE_G04_L03_RW_002_SOURCE.associatedAudio}`)),
    COURSE_G04_L03_RW_002_SOURCE.associatedAudioSha256,
  );
  assert.equal(
    sha256(
      await readFile(
        `${repositoryRoot}public/flash-assets/courses/course-g04-l03-rw-002/audio/embedded-stream-0001.mp3`,
      ),
    ),
    COURSE_G04_L03_RW_002_SOURCE.embeddedAudioStreamSha256,
  );
  assert.equal(
    sha256(
      await readFile(
        `${repositoryRoot}public/flash-assets/courses/course-g04-l03-rw-002/audio/spanish-host-narration.mp3`,
      ),
    ),
    COURSE_G04_L03_RW_002_SOURCE.associatedAudioSha256,
  );
});

test("RW002 exposes bounded one-indexed English sprite-421 drawings", () => {
  assert.equal(normalizeCourseG04L03Rw002Frame(Number.NaN), 1);
  assert.equal(normalizeCourseG04L03Rw002Frame(1290), 1289);
  assert.equal(normalizeCourseG04L03Rw002Frame(8, "root"), 8);
  assert.equal(normalizeCourseG04L03Rw002Frame(8, "sprite-425"), 1);
  for (const frame of [1, 645, 1289]) {
    const state = getCourseG04L03Rw002FrameState(frame, {
      frameDomain: "sprite-421",
      scenario: "source-static-frame",
      lang: "en",
      seed: frame === 1289 ? -1 : 0,
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

test("RW002 fails closed for Spanish, root, title, and mismatches", () => {
  const requests = [
    ["sprite-421", "source-static-frame", "es", "spanish-visual-and-audio-unvalidated"],
    ["root", "root-unavailable", "en", "root-baseline-unavailable"],
    ["sprite-425", "sprite-425-unavailable", "en", "companion-domain-unrendered"],
    ["root", "source-static-frame", "en", "frame-domain-scenario-mismatch"],
  ] as const;
  for (const [frameDomain, scenario, lang, blocker] of requests) {
    const state = getCourseG04L03Rw002FrameState(1, {
      frameDomain,
      scenario,
      lang,
      seed: 0,
    });
    assert.equal(state.blocker, blocker);
  }
});

test("RW002 capture identity remains deterministic while audio acceptance stays separate", () => {
  const state = getCourseG04L03Rw002FrameState(1289, {
    frameDomain: "sprite-421",
    scenario: "source-static-frame",
    lang: "en",
    seed: 7,
  });
  const attributes = buildCourseG04L03Rw002CaptureAttributes({
    canvasStatus: "ready",
    entryStateSha256: "a".repeat(64),
    requirementId: "engineering-source-static-frame-1289",
    state,
    traceId: "engineering-source-static",
  });
  assert.equal(attributes["data-capture-stage"], "true");
  assert.equal(attributes["data-flash-frame-domain"], "sprite-421");
  assert.equal(attributes["data-source-controls-enabled"], "false");
  assert.equal(attributes["data-source-marker-visuals"], "negative-numbers-number-line");
});

test("RW002 remains prototype-only with every acceptance gate closed", async () => {
  const manifest = matchPrototype({animationId: "course-g04-l03-rw-002"});
  assert.equal(manifest?.runtime.frameCount, 10);
  assert.equal(manifest?.movie.frameCount, 1289);
  assert.equal(manifest?.title.en, "Page 1");
  assert.equal(matchPrototype({sourcePath: "/unknown/L3RW02.swf"}), undefined);
  const registered = await loadAnimationModule("course-g04-l03-rw-002");
  assert.equal(registered?.maturity, "legacy-prototype");
  assert.deepEqual(registered?.audioCues, [
    {
      id: "course-g04-l03-rw-002-embedded-stream-0001",
      sourceCueId: "embedded-stream-0001",
      frame: 1,
      frameDomain: "sprite-421",
      language: "en",
      scenario: "source-static-frame",
      source:
        "/flash-assets/courses/course-g04-l03-rw-002/audio/embedded-stream-0001.mp3",
      durationMs: 106_522,
      sha256:
        "7616d349bf0b7e8122a3e82fb35da28fca538aa2907326ce5299b1e6b42ac46c",
      spokenLanguage: "undetermined",
    },
  ]);
  assert.deepEqual(registered?.audioTracks, [
    {
      id: "course-g04-l03-rw-002-spanish-host-narration",
      language: "es",
      label: "Audio en español",
      source:
        "/flash-assets/courses/course-g04-l03-rw-002/audio/spanish-host-narration.mp3",
      durationMs: 28_992,
      sha256:
        "79d0b6504a0d8bb66e3a7a19a5156ab35a49271fdbaab40033c0dda5600a627e",
      activation: "user",
      visibleWhen: ["es"],
      frameDomains: ["sprite-421"],
      timelineBehavior: "pause-while-playing",
    },
  ]);
  assert.equal(COURSE_G04_L03_RW_002_SOURCE_CONTRACT.ownerAccepted, false);
  for (const [name, value] of Object.entries(COURSE_G04_L03_RW_002_AUTHORITY)) {
    if (name === "registryIsPrototypeOnly" || name === "strictAcceptanceEffect") continue;
    assert.equal(value, false, name);
  }
  assert.equal(COURSE_G04_L03_RW_002_AUTHORITY.registryIsPrototypeOnly, true);
  const spanishMarkup = renderToStaticMarkup(
    createElement(courseRw002.Renderer, {
      frame: 1,
      frameDomain: "sprite-421",
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
