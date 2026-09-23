import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {loadAnimationModule} from "../src/animation-registry";
import courseVb005, {
  COURSE_G04_L03_VB_005_GLOSSARY_HOTSPOTS,
  COURSE_G04_L03_VB_005_MOVIE,
  COURSE_G04_L03_VB_005_RUNTIME,
  COURSE_G04_L03_VB_005_SOURCE,
  COURSE_G04_L03_VB_005_SOURCE_CONTRACT,
  buildCourseG04L03Vb005CaptureAttributes,
  getCourseG04L03Vb005FrameState,
  normalizeCourseG04L03Vb005Frame,
} from "../src/modules/course-g04-l03-vb-005";
import {matchPrototype} from "../src/prototype-manifest";
import {COURSE_G04_L03_VB_005_AUTHORITY} from "../src/timelines/course-g04-l03-vb-005";

const repositoryRoot = fileURLToPath(new URL("../../../", import.meta.url));
const sha256 = (bytes: Uint8Array) =>
  createHash("sha256").update(bytes).digest("hex");

test("VB005 keeps the 10-frame root and both nested source domains separate", async () => {
  assert.deepEqual(COURSE_G04_L03_VB_005_MOVIE.stage, {width: 800, height: 600});
  assert.equal(COURSE_G04_L03_VB_005_MOVIE.fps, 12);
  assert.equal(COURSE_G04_L03_VB_005_MOVIE.frameCount, 180);
  assert.equal(COURSE_G04_L03_VB_005_RUNTIME.frameCount, 10);
  assert.equal(COURSE_G04_L03_VB_005_RUNTIME.defaultFrameDomain, "sprite-53");
  assert.deepEqual(COURSE_G04_L03_VB_005_RUNTIME.frameDomains, [
    {id: "sprite-53", frameCount: 180, fps: 12, rootFrame: 6},
    {id: "sprite-5", frameCount: 1, fps: 12, rootFrame: 6},
  ]);
  assert.equal(courseVb005.runtime, COURSE_G04_L03_VB_005_RUNTIME);
  assert.deepEqual(courseVb005.playbackEndFrameByDomain, {root: 1, "sprite-5": 1});
  assert.equal(
    sha256(
      await readFile(`${repositoryRoot}${COURSE_G04_L03_VB_005_SOURCE.swf}`),
    ),
    COURSE_G04_L03_VB_005_SOURCE.swfSha256,
  );
});

test("VB005 exposes only English source-static sprite-53 frames", () => {
  assert.equal(normalizeCourseG04L03Vb005Frame(Number.NaN), 1);
  assert.equal(normalizeCourseG04L03Vb005Frame(181), 180);
  assert.equal(normalizeCourseG04L03Vb005Frame(8, "root"), 8);
  assert.equal(normalizeCourseG04L03Vb005Frame(8, "sprite-5"), 1);

  for (const frame of [1, 90, 180]) {
    const state = getCourseG04L03Vb005FrameState(frame, {
      frameDomain: "sprite-53",
      scenario: "source-static-frame",
      lang: "en",
      seed: frame === 180 ? -1 : 0,
    });
    assert.equal(state.status, "ready");
    assert.equal(state.frame, frame);
    assert.equal(state.exportFrame, frame - 1);
    assert.deepEqual(state.visibleSourceMarkers, [
      "negative-number",
      "less-than",
      "zero",
    ]);
    assert.equal(state.interactiveControlsEnabled, false);
    assert.equal(state.sourceHostBehaviorResolved, false);
    assert.equal(state.audioRendered, false);
    assert.equal(state.naturalRuntimeEstablished, false);
  }

  assert.deepEqual(
    COURSE_G04_L03_VB_005_GLOSSARY_HOTSPOTS.map((hotspot) => [
      hotspot.characterId,
      hotspot.firstFrame,
      hotspot.lastFrame,
      hotspot.depth,
    ]),
    [
      [11, 1, 180, 5],
      [12, 1, 180, 7],
      [13, 1, 180, 9],
    ],
  );
});

test("VB005 fails closed for Spanish, root, companion, and mismatched requests", () => {
  const spanish = getCourseG04L03Vb005FrameState(1, {
    frameDomain: "sprite-53",
    scenario: "source-static-frame",
    lang: "es",
    seed: 0,
  });
  assert.equal(spanish.blocker, "spanish-visual-and-audio-unvalidated");
  const root = getCourseG04L03Vb005FrameState(10, {
    frameDomain: "root",
    scenario: "root-unavailable",
    lang: "en",
    seed: 0,
  });
  assert.equal(root.blocker, "root-baseline-unavailable");
  assert.equal(root.exportFrame, null);
  const companion = getCourseG04L03Vb005FrameState(1, {
    frameDomain: "sprite-5",
    scenario: "sprite-5-unavailable",
    lang: "en",
    seed: 0,
  });
  assert.equal(companion.blocker, "companion-domain-unrendered");
  const mismatch = getCourseG04L03Vb005FrameState(1, {
    frameDomain: "root",
    scenario: "source-static-frame",
    lang: "en",
    seed: 0,
  });
  assert.equal(mismatch.blocker, "frame-domain-scenario-mismatch");
});

test("VB005 capture attributes expose disabled source controls", () => {
  const state = getCourseG04L03Vb005FrameState(180, {
    frameDomain: "sprite-53",
    scenario: "source-static-frame",
    lang: "en",
    seed: 7,
  });
  const attributes = buildCourseG04L03Vb005CaptureAttributes({
    canvasStatus: "ready",
    entryStateSha256: "a".repeat(64),
    requirementId: "engineering-source-static-frame-180",
    state,
    traceId: "engineering-source-static",
  });
  assert.equal(attributes["data-capture-stage"], "true");
  assert.equal(attributes["data-flash-frame-domain"], "sprite-53");
  assert.equal(attributes["data-source-controls-enabled"], "false");
  assert.equal(
    attributes["data-source-marker-visuals"],
    "negative-number,less-than,zero",
  );
});

test("VB005 remains prototype-only with every authority and acceptance gate closed", async () => {
  const manifest = matchPrototype({animationId: "course-g04-l03-vb-005"});
  assert.equal(manifest?.runtime.frameCount, 10);
  assert.equal(manifest?.movie.frameCount, 180);
  assert.equal(manifest?.title.en, "Negative Numbers");
  assert.equal(
    manifest?.title.es,
    "Versión en español pendiente de validación",
  );
  assert.equal(matchPrototype({sourcePath: "/unknown/L3VB05.swf"}), undefined);

  const registered = await loadAnimationModule("course-g04-l03-vb-005");
  assert.equal(registered?.maturity, "legacy-prototype");
  assert.equal(registered?.audioCues.length, 1);
  assert.equal(registered?.audioTracks?.length, 1);
  assert.equal(COURSE_G04_L03_VB_005_SOURCE_CONTRACT.ownerAccepted, false);
  assert.equal(COURSE_G04_L03_VB_005_SOURCE_CONTRACT.strictAcceptanceEffect, "none");
  assert.deepEqual(
    COURSE_G04_L03_VB_005_SOURCE_CONTRACT.currentJavascriptFunctionalEntry,
    {
      frameDomain: "sprite-53",
      frame: 1,
      scenario: "source-static-frame",
      language: "en",
      deterministicCaptureOverlayEnabled: false,
    },
  );
  for (const [name, value] of Object.entries(COURSE_G04_L03_VB_005_AUTHORITY)) {
    if (
      name === "registryIsPrototypeOnly" ||
      name === "currentJavascriptFunctionalCandidateImplemented" ||
      name === "strictAcceptanceEffect"
    ) continue;
    assert.equal(value, false, name);
  }
  assert.equal(COURSE_G04_L03_VB_005_AUTHORITY.registryIsPrototypeOnly, true);
  assert.equal(
    COURSE_G04_L03_VB_005_AUTHORITY.currentJavascriptFunctionalCandidateImplemented,
    true,
  );

  const liveMarkup = renderToStaticMarkup(
    createElement(courseVb005.Renderer, {
      frame: 1,
      frameDomain: "sprite-53",
      scenario: "source-static-frame",
      lang: "en",
      seed: 0,
      onLessonHostRequest: () => undefined,
    }),
  );
  assert.match(liveMarkup, /data-current-js-functional-candidate="true"/);
  assert.match(liveMarkup, /data-source-host-action="DoHyperLinks"/);
  assert.match(liveMarkup, /data-source-key-attribute="Negative number"/);
  assert.match(liveMarkup, /data-glossary-source-disposition="unresolved-lesson-vs-grade-wide"/);
  assert.match(liveMarkup, /data-behavior-parity-established="false"/);

  const captureMarkup = renderToStaticMarkup(
    createElement(courseVb005.Renderer, {
      entryStateSha256: "a".repeat(64),
      frame: 1,
      frameDomain: "sprite-53",
      requirementId: "source-static-vb005-frame-1",
      scenario: "source-static-frame",
      lang: "en",
      seed: 0,
      traceId: "source-static-vb005",
      onLessonHostRequest: () => undefined,
    }),
  );
  assert.doesNotMatch(captureMarkup, /data-source-hotspot-surface=/);
  assert.doesNotMatch(captureMarkup, /data-page-interaction-companion-surface=/);

  const spanishMarkup = renderToStaticMarkup(
    createElement(courseVb005.Renderer, {
      frame: 1,
      frameDomain: "sprite-53",
      scenario: "source-static-frame",
      lang: "es",
      seed: 0,
    }),
  );
  assert.match(
    spanishMarkup,
    /data-fail-closed-reason="spanish-visual-and-audio-unvalidated"/,
  );
  assert.match(spanishMarkup, /data-audio-rendered="false"/);
  assert.match(spanishMarkup, /data-interactive-controls-enabled="false"/);
  assert.match(spanishMarkup, /data-owner-accepted="false"/);
  assert.match(spanishMarkup, /data-strict-migration-complete="false"/);
  assert.doesNotMatch(spanishMarkup, /<canvas/);
});
