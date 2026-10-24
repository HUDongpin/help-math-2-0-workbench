import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {loadAnimationModule} from "../src/animation-registry";
import courseVb006, {
  COURSE_G04_L03_VB_006_GLOSSARY_HOTSPOTS,
  COURSE_G04_L03_VB_006_MOVIE,
  COURSE_G04_L03_VB_006_RUNTIME,
  COURSE_G04_L03_VB_006_SOURCE,
  COURSE_G04_L03_VB_006_SOURCE_CONTRACT,
  buildCourseG04L03Vb006CaptureAttributes,
  getCourseG04L03Vb006FrameState,
  normalizeCourseG04L03Vb006Frame,
} from "../src/modules/course-g04-l03-vb-006";
import {matchPrototype} from "../src/prototype-manifest";
import {COURSE_G04_L03_VB_006_AUTHORITY} from "../src/timelines/course-g04-l03-vb-006";

const repositoryRoot = fileURLToPath(new URL("../../../", import.meta.url));
const sha256 = (bytes: Uint8Array) =>
  createHash("sha256").update(bytes).digest("hex");

test("VB006 keeps the 10-frame root and both nested source domains separate", async () => {
  assert.deepEqual(COURSE_G04_L03_VB_006_MOVIE.stage, {width: 800, height: 600});
  assert.equal(COURSE_G04_L03_VB_006_MOVIE.fps, 12);
  assert.equal(COURSE_G04_L03_VB_006_MOVIE.frameCount, 163);
  assert.equal(COURSE_G04_L03_VB_006_RUNTIME.frameCount, 10);
  assert.equal(COURSE_G04_L03_VB_006_RUNTIME.defaultFrameDomain, "sprite-44");
  assert.deepEqual(COURSE_G04_L03_VB_006_RUNTIME.frameDomains, [
    {id: "sprite-44", frameCount: 163, fps: 12, rootFrame: 6},
    {id: "sprite-5", frameCount: 1, fps: 12, rootFrame: 6},
  ]);
  assert.equal(courseVb006.runtime, COURSE_G04_L03_VB_006_RUNTIME);
  assert.deepEqual(courseVb006.playbackEndFrameByDomain, {root: 1, "sprite-5": 1});
  assert.equal(
    sha256(
      await readFile(`${repositoryRoot}${COURSE_G04_L03_VB_006_SOURCE.swf}`),
    ),
    COURSE_G04_L03_VB_006_SOURCE.swfSha256,
  );
});

test("VB006 exposes only English source-static sprite-44 frames", () => {
  assert.equal(normalizeCourseG04L03Vb006Frame(Number.NaN), 1);
  assert.equal(normalizeCourseG04L03Vb006Frame(164), 163);
  assert.equal(normalizeCourseG04L03Vb006Frame(8, "root"), 8);
  assert.equal(normalizeCourseG04L03Vb006Frame(8, "sprite-5"), 1);

  const early = getCourseG04L03Vb006FrameState(1, {
    frameDomain: "sprite-44",
    scenario: "source-static-frame",
    lang: "en",
    seed: 0,
  });
  assert.equal(early.status, "ready");
  assert.deepEqual(early.visibleSourceMarkers, ["zero", "value"]);
  assert.equal(early.interactiveControlsEnabled, false);
  assert.equal(early.sourceHostBehaviorResolved, false);
  assert.equal(early.audioRendered, false);

  const later = getCourseG04L03Vb006FrameState(116, {
    frameDomain: "sprite-44",
    scenario: "source-static-frame",
    lang: "en",
    seed: -1,
  });
  assert.equal(later.frame, 116);
  assert.equal(later.exportFrame, 115);
  assert.equal(later.seed, 4_294_967_295);
  assert.deepEqual(later.visibleSourceMarkers, [
    "zero",
    "value",
    "positive-number",
    "negative-number",
  ]);
  assert.deepEqual(
    COURSE_G04_L03_VB_006_GLOSSARY_HOTSPOTS.map((hotspot) => [
      hotspot.characterId,
      hotspot.firstFrame,
      hotspot.lastFrame,
      hotspot.depth,
    ]),
    [
      [11, 1, 163, 5],
      [12, 1, 163, 7],
      [42, 116, 163, 67],
      [43, 116, 163, 69],
    ],
  );
});

test("VB006 fails closed for Spanish, root, companion, and mismatched requests", () => {
  const spanish = getCourseG04L03Vb006FrameState(1, {
    frameDomain: "sprite-44",
    scenario: "source-static-frame",
    lang: "es",
    seed: 0,
  });
  assert.equal(spanish.blocker, "spanish-visual-and-audio-unvalidated");
  const root = getCourseG04L03Vb006FrameState(10, {
    frameDomain: "root",
    scenario: "root-unavailable",
    lang: "en",
    seed: 0,
  });
  assert.equal(root.blocker, "root-baseline-unavailable");
  assert.equal(root.exportFrame, null);
  const companion = getCourseG04L03Vb006FrameState(1, {
    frameDomain: "sprite-5",
    scenario: "sprite-5-unavailable",
    lang: "en",
    seed: 0,
  });
  assert.equal(companion.blocker, "companion-domain-unrendered");
  const mismatch = getCourseG04L03Vb006FrameState(1, {
    frameDomain: "root",
    scenario: "source-static-frame",
    lang: "en",
    seed: 0,
  });
  assert.equal(mismatch.blocker, "frame-domain-scenario-mismatch");
});

test("VB006 capture attributes expose disabled source controls", () => {
  const state = getCourseG04L03Vb006FrameState(116, {
    frameDomain: "sprite-44",
    scenario: "source-static-frame",
    lang: "en",
    seed: 7,
  });
  const attributes = buildCourseG04L03Vb006CaptureAttributes({
    canvasStatus: "ready",
    entryStateSha256: "a".repeat(64),
    requirementId: "engineering-source-static-frame-116",
    state,
    traceId: "engineering-source-static",
  });
  assert.equal(attributes["data-capture-stage"], "true");
  assert.equal(attributes["data-flash-frame-domain"], "sprite-44");
  assert.equal(attributes["data-source-controls-enabled"], "false");
  assert.equal(
    attributes["data-source-marker-visuals"],
    "zero,value,positive-number,negative-number",
  );
});

test("VB006 remains prototype-only with every authority and acceptance gate closed", async () => {
  const manifest = matchPrototype({animationId: "course-g04-l03-vb-006"});
  assert.equal(manifest?.runtime.frameCount, 10);
  assert.equal(manifest?.movie.frameCount, 163);
  assert.equal(manifest?.title.en, "Zero");
  assert.equal(
    manifest?.title.es,
    "Versión en español pendiente de validación",
  );
  assert.equal(matchPrototype({sourcePath: "/unknown/L3VB06.swf"}), undefined);

  const registered = await loadAnimationModule("course-g04-l03-vb-006");
  assert.equal(registered?.maturity, "legacy-prototype");
  assert.equal(registered?.audioCues.length, 1);
  assert.equal(registered?.audioTracks?.length, 1);
  assert.equal(COURSE_G04_L03_VB_006_SOURCE_CONTRACT.ownerAccepted, false);
  assert.equal(COURSE_G04_L03_VB_006_SOURCE_CONTRACT.strictAcceptanceEffect, "none");
  assert.deepEqual(
    COURSE_G04_L03_VB_006_SOURCE_CONTRACT.currentJavascriptFunctionalEntry,
    {
      frameDomain: "sprite-44",
      frame: 1,
      scenario: "source-static-frame",
      language: "en",
      deterministicCaptureOverlayEnabled: false,
    },
  );
  for (const [name, value] of Object.entries(COURSE_G04_L03_VB_006_AUTHORITY)) {
    if (
      name === "registryIsPrototypeOnly" ||
      name === "currentJavascriptFunctionalCandidateImplemented" ||
      name === "strictAcceptanceEffect"
    ) continue;
    assert.equal(value, false, name);
  }
  assert.equal(COURSE_G04_L03_VB_006_AUTHORITY.registryIsPrototypeOnly, true);
  assert.equal(
    COURSE_G04_L03_VB_006_AUTHORITY.currentJavascriptFunctionalCandidateImplemented,
    true,
  );

  const frame115Markup = renderToStaticMarkup(
    createElement(courseVb006.Renderer, {
      frame: 115,
      frameDomain: "sprite-44",
      scenario: "source-static-frame",
      lang: "en",
      seed: 0,
      onLessonHostRequest: () => undefined,
    }),
  );
  assert.match(frame115Markup, /data-source-key-attribute="Zero"/);
  assert.match(frame115Markup, /data-source-key-attribute="Value"/);
  assert.doesNotMatch(frame115Markup, /data-source-key-attribute="Positive number"/);

  const frame116Markup = renderToStaticMarkup(
    createElement(courseVb006.Renderer, {
      frame: 116,
      frameDomain: "sprite-44",
      scenario: "source-static-frame",
      lang: "en",
      seed: 0,
      onLessonHostRequest: () => undefined,
    }),
  );
  assert.match(frame116Markup, /data-source-key-attribute="Positive number"/);
  assert.match(frame116Markup, /data-source-key-attribute="Negative number"/);
  assert.match(frame116Markup, /data-current-js-functional-candidate="true"/);

  const captureMarkup = renderToStaticMarkup(
    createElement(courseVb006.Renderer, {
      entryStateSha256: "b".repeat(64),
      frame: 116,
      frameDomain: "sprite-44",
      requirementId: "source-static-vb006-frame-116",
      scenario: "source-static-frame",
      lang: "en",
      seed: 0,
      traceId: "source-static-vb006",
      onLessonHostRequest: () => undefined,
    }),
  );
  assert.doesNotMatch(captureMarkup, /data-source-hotspot-surface=/);

  const spanishMarkup = renderToStaticMarkup(
    createElement(courseVb006.Renderer, {
      frame: 1,
      frameDomain: "sprite-44",
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
