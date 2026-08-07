import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {loadAnimationModule} from "../src/animation-registry";
import {
  buildCourseG04L03Rw003CaptureAttributes,
  COURSE_G04_L03_RW_003_GLOSSARY_HOTSPOTS,
  COURSE_G04_L03_RW_003_SOURCE_CONTRACT,
  default as courseRw003,
} from "../src/modules/course-g04-l03-rw-003";
import {matchPrototype} from "../src/prototype-manifest";
import {
  COURSE_G04_L03_RW_003_GLOSSARY_CONFIG,
  COURSE_G04_L03_RW_003_MOVIE,
  COURSE_G04_L03_RW_003_RUNTIME,
  COURSE_G04_L03_RW_003_SOURCE,
  getCourseG04L03Rw003FrameState,
  normalizeCourseG04L03Rw003Frame,
} from "../src/timelines/course-g04-l03-rw-003";
import {
  createCourseG04L03SourceGlossaryOpenResult,
  visibleCourseG04L03SourceGlossaryTerms,
} from "../src/timelines/course-g04-l03-source-glossary-interaction";

const repositoryRoot = fileURLToPath(new URL("../../../", import.meta.url));
const sha256 = (bytes: Uint8Array) =>
  createHash("sha256").update(bytes).digest("hex");

test("RW003 preserves the root and both nested source frame domains", async () => {
  assert.deepEqual(COURSE_G04_L03_RW_003_MOVIE.stage, {width: 800, height: 600});
  assert.equal(COURSE_G04_L03_RW_003_MOVIE.fps, 12);
  assert.equal(COURSE_G04_L03_RW_003_MOVIE.frameCount, 278);
  assert.equal(COURSE_G04_L03_RW_003_RUNTIME.frameCount, 10);
  assert.equal(COURSE_G04_L03_RW_003_RUNTIME.defaultFrameDomain, "sprite-49");
  assert.deepEqual(COURSE_G04_L03_RW_003_RUNTIME.frameDomains, [
    {id: "sprite-49", frameCount: 278, fps: 12, rootFrame: 6},
    {id: "sprite-53", frameCount: 1, fps: 12, rootFrame: 6},
  ]);
  assert.equal(courseRw003.runtime, COURSE_G04_L03_RW_003_RUNTIME);
  assert.equal(courseRw003.playbackMode, "once");
  assert.deepEqual(courseRw003.playbackEndFrameByDomain, {
    root: 1,
    "sprite-53": 1,
  });
  assert.equal(
    sha256(await readFile(`${repositoryRoot}${COURSE_G04_L03_RW_003_SOURCE.swf}`)),
    COURSE_G04_L03_RW_003_SOURCE.swfSha256,
  );
  assert.equal(
    sha256(
      await readFile(
        `${repositoryRoot}public/flash-assets/courses/course-g04-l03-rw-003/audio/embedded-stream-0001.mp3`,
      ),
    ),
    "aab5bc0e259d399db150b266423be6a25161533bc094d081ec5729ec234af8f2",
  );
  assert.equal(
    sha256(
      await readFile(
        `${repositoryRoot}public/flash-assets/courses/course-g04-l03-rw-003/audio/spanish-host-narration.mp3`,
      ),
    ),
    "ea0a0922b90a9e612814a4b69ede2b687660b1e0adeadac91870e77f092f0975",
  );
});

test("RW003 exposes English source-static frames without enabling button behavior", () => {
  assert.equal(normalizeCourseG04L03Rw003Frame(Number.NaN), 1);
  assert.equal(normalizeCourseG04L03Rw003Frame(0), 1);
  assert.equal(normalizeCourseG04L03Rw003Frame(139.9), 139);
  assert.equal(normalizeCourseG04L03Rw003Frame(279), 278);
  assert.equal(normalizeCourseG04L03Rw003Frame(11, "root"), 10);
  assert.equal(normalizeCourseG04L03Rw003Frame(5, "sprite-53"), 1);

  const beforeButtons = getCourseG04L03Rw003FrameState(119, {
    frameDomain: "sprite-49",
    scenario: "source-static-frame",
    lang: "en",
    seed: 0,
  });
  assert.equal(beforeButtons.status, "ready");
  assert.deepEqual(beforeButtons.visibleSourceButtonVisuals, []);

  const positive = getCourseG04L03Rw003FrameState(120, {
    frameDomain: "sprite-49",
    scenario: "source-static-frame",
    lang: "en",
    seed: 7,
  });
  assert.equal(positive.status, "ready");
  assert.deepEqual(positive.visibleSourceButtonVisuals, ["positive"]);
  assert.equal(positive.interactiveControlsEnabled, false);
  assert.equal(positive.sourceHostBehaviorResolved, false);

  const both = getCourseG04L03Rw003FrameState(278, {
    frameDomain: "sprite-49",
    scenario: "source-static-frame",
    lang: "en",
    seed: -1,
  });
  assert.equal(both.frame, 278);
  assert.equal(both.exportFrame, 277);
  assert.equal(both.rootFrame, 6);
  assert.equal(both.seed, 4_294_967_295);
  assert.deepEqual(both.visibleSourceButtonVisuals, ["positive", "negative"]);
  assert.equal(both.naturalRuntimeEstablished, false);
  assert.equal(both.audioRendered, false);
});

test("RW003 source KeyAttribute hotspots retain exact frame windows, bounds, and glossary identities", () => {
  assert.deepEqual(COURSE_G04_L03_RW_003_GLOSSARY_HOTSPOTS, [
    {
      id: "positive",
      keyAttribute: "Positive",
      characterId: 33,
      firstFrame: 120,
      lastFrame: 278,
      depth: 27,
      sourceBounds: {
        left: 199.95,
        right: 274.0833389282227,
        top: 100,
        bottom: 121.49234771728516,
      },
      entryIds: {
        en: "en-0496-498b59d01013",
        es: "es-0516-f7f20d429054",
      },
      labels: {en: "Positive", es: "Positivo"},
    },
    {
      id: "negative",
      keyAttribute: "Negative",
      characterId: 46,
      firstFrame: 159,
      lastFrame: 278,
      depth: 31,
      sourceBounds: {
        left: 206.35,
        right: 285.4177108764648,
        top: 369.3,
        bottom: 390.79234771728516,
      },
      entryIds: {
        en: "en-0408-196ea5a45df3",
        es: "es-0439-b0dd8041f713",
      },
      labels: {en: "Negative", es: "Negativo"},
    },
  ]);
  assert.deepEqual(
    visibleCourseG04L03SourceGlossaryTerms(
      COURSE_G04_L03_RW_003_GLOSSARY_CONFIG,
      119,
    ),
    [],
  );
  assert.deepEqual(
    visibleCourseG04L03SourceGlossaryTerms(
      COURSE_G04_L03_RW_003_GLOSSARY_CONFIG,
      120,
    ).map(({id}) => id),
    ["positive"],
  );
  assert.deepEqual(
    visibleCourseG04L03SourceGlossaryTerms(
      COURSE_G04_L03_RW_003_GLOSSARY_CONFIG,
      159,
    ).map(({id}) => id),
    ["positive", "negative"],
  );
  assert.deepEqual(
    createCourseG04L03SourceGlossaryOpenResult({
      config: COURSE_G04_L03_RW_003_GLOSSARY_CONFIG,
      frame: 120,
      lang: "en",
      termId: "positive",
    })?.request,
    {
      type: "open-keyterm",
      entryId: "en-0496-498b59d01013",
      sourceAnimationId: "course-g04-l03-rw-003",
      playbackDisposition:
        "source-stop-timeline-and-audio-until-explicit-resume",
    },
  );
});

test("RW003 fails closed for Spanish, root, companion, and mismatched requests", () => {
  const spanish = getCourseG04L03Rw003FrameState(1, {
    frameDomain: "sprite-49",
    scenario: "source-static-frame",
    lang: "es",
    seed: 0,
  });
  assert.equal(spanish.status, "blocked");
  assert.equal(spanish.blocker, "spanish-visual-and-audio-unvalidated");
  assert.equal(spanish.sourceStaticVisualReady, false);

  const root = getCourseG04L03Rw003FrameState(10, {
    frameDomain: "root",
    scenario: "root-unavailable",
    lang: "en",
    seed: 0,
  });
  assert.equal(root.status, "blocked");
  assert.equal(root.blocker, "root-baseline-unavailable");
  assert.equal(root.exportFrame, null);
  assert.equal(root.rootFrame, 10);

  const companion = getCourseG04L03Rw003FrameState(1, {
    frameDomain: "sprite-53",
    scenario: "source-companion-unavailable",
    lang: "en",
    seed: 0,
  });
  assert.equal(companion.status, "blocked");
  assert.equal(companion.blocker, "companion-domain-unrendered");

  const mismatch = getCourseG04L03Rw003FrameState(1, {
    frameDomain: "root",
    scenario: "source-static-frame",
    lang: "en",
    seed: 0,
  });
  assert.equal(mismatch.blocker, "frame-domain-scenario-mismatch");

  const unsupported = getCourseG04L03Rw003FrameState(1, {
    frameDomain: "sprite-unknown",
    scenario: "source-static-frame",
    lang: "en",
    seed: 0,
  });
  assert.equal(unsupported.blocker, "unsupported-runtime-request");
});

test("RW003 capture readiness binds trace identity and discloses disabled controls", () => {
  const state = getCourseG04L03Rw003FrameState(159, {
    frameDomain: "sprite-49",
    scenario: "source-static-frame",
    lang: "en",
    seed: 7,
  });
  const incomplete = buildCourseG04L03Rw003CaptureAttributes({
    canvasStatus: "ready",
    entryStateSha256: "",
    requirementId: "",
    state,
    traceId: "",
  });
  assert.equal(incomplete["data-capture-stage"], undefined);
  const complete = buildCourseG04L03Rw003CaptureAttributes({
    canvasStatus: "ready",
    entryStateSha256: "a".repeat(64),
    requirementId: "engineering-source-static-frame-159",
    state,
    traceId: "engineering-source-static",
  });
  assert.equal(complete["data-capture-stage"], "true");
  assert.equal(complete["data-flash-frame"], 159);
  assert.equal(complete["data-flash-frame-domain"], "sprite-49");
  assert.equal(complete["data-runtime-language"], "en");
  assert.equal(complete["data-source-button-visuals"], "positive,negative");
  assert.equal(complete["data-source-controls-enabled"], "false");
});

test("RW003 module remains prototype-only and blocked UI states are explicit", async () => {
  const manifest = matchPrototype({animationId: "course-g04-l03-rw-003"});
  assert.equal(manifest?.runtime.frameCount, 10);
  assert.equal(manifest?.movie.frameCount, 278);
  assert.equal(manifest?.title.en, "Page 2");
  assert.equal(manifest?.title.es, "Versión en español pendiente de validación");
  assert.equal(matchPrototype({sourcePath: "/unknown/L3RW03.swf"}), undefined);

  const registered = await loadAnimationModule("course-g04-l03-rw-003");
  assert.equal(registered?.key, "course-g04-l03-rw-003");
  assert.equal(registered?.maturity, "legacy-prototype");
  assert.deepEqual(registered?.audioCues, [
    {
      id: "course-g04-l03-rw-003-embedded-stream-0001",
      sourceCueId: "embedded-stream-0001",
      frame: 8,
      endFrame: 279,
      frameDomain: "sprite-49",
      language: "en",
      scenario: "source-static-frame",
      source:
        "/flash-assets/courses/course-g04-l03-rw-003/audio/embedded-stream-0001.mp3",
      durationMs: 22_438,
      sha256:
        "aab5bc0e259d399db150b266423be6a25161533bc094d081ec5729ec234af8f2",
      spokenLanguage: "undetermined",
    },
  ]);
  assert.deepEqual(registered?.audioTracks, [
    {
      id: "course-g04-l03-rw-003-spanish-host-narration",
      language: "es",
      label: "Audio en español",
      source:
        "/flash-assets/courses/course-g04-l03-rw-003/audio/spanish-host-narration.mp3",
      durationMs: 17_952,
      sha256:
        "ea0a0922b90a9e612814a4b69ede2b687660b1e0adeadac91870e77f092f0975",
      activation: "user",
      visibleWhen: ["es"],
      frameDomains: ["sprite-49"],
      timelineBehavior: "pause-while-playing",
    },
  ]);
  assert.equal(COURSE_G04_L03_RW_003_SOURCE_CONTRACT.ownerAccepted, false);
  assert.equal(COURSE_G04_L03_RW_003_SOURCE_CONTRACT.strictAcceptanceEffect, "none");
  assert.equal(
    COURSE_G04_L03_RW_003_SOURCE_CONTRACT.currentJavascriptFunctionalEntry.frame,
    120,
  );
  assert.equal(
    COURSE_G04_L03_RW_003_SOURCE_CONTRACT.currentJavascriptFunctionalEntry
      .deterministicCaptureOverlayEnabled,
    false,
  );
  assert.equal(
    COURSE_G04_L03_RW_003_SOURCE_CONTRACT.currentJavascriptInteractionScope.includes(
      "source-stop-timeline-and-audio-until-explicit-resume",
    ),
    true,
  );
  assert.equal(
    COURSE_G04_L03_RW_003_SOURCE_CONTRACT.behaviorParityEstablished,
    false,
  );
  assert.equal(
    COURSE_G04_L03_RW_003_SOURCE_CONTRACT.sourceGlossaryRuntimeParityEstablished,
    false,
  );
  assert.deepEqual(courseRw003.lessonHost, {
    capabilities: ["keyterm"],
    legacyOperations: "blocked",
    auditStorage: "memory-only",
    storesPersonalData: false,
  });

  const spanishMarkup = renderToStaticMarkup(
    createElement(courseRw003.Renderer, {
      frame: 1,
      frameDomain: "sprite-49",
      scenario: "source-static-frame",
      lang: "es",
      seed: 0,
    }),
  );
  assert.match(spanishMarkup, /data-fail-closed-reason="spanish-visual-and-audio-unvalidated"/);
  assert.match(spanishMarkup, /data-audio-rendered="false"/);
  assert.match(spanishMarkup, /data-interactive-controls-enabled="false"/);
  assert.match(spanishMarkup, /data-owner-accepted="false"/);
  assert.match(spanishMarkup, /data-strict-migration-complete="false"/);
  assert.doesNotMatch(spanishMarkup, /<canvas/);
});

test("RW003 live rendering exposes source-bound terms while deterministic capture remains visual-only", () => {
  const common = {
    frameDomain: "sprite-49",
    scenario: "source-static-frame",
    lang: "en" as const,
    seed: 0,
    onLessonHostRequest: () => undefined,
  };
  const before = renderToStaticMarkup(
    createElement(courseRw003.Renderer, {...common, frame: 119}),
  );
  assert.doesNotMatch(before, /data-source-key-attribute=/);

  const positive = renderToStaticMarkup(
    createElement(courseRw003.Renderer, {...common, frame: 120}),
  );
  assert.match(positive, /data-current-js-functional-candidate="true"/);
  assert.match(
    positive,
    /data-source-animation-stop-modeled="source-stop-timeline-and-audio-until-explicit-resume"/,
  );
  assert.match(positive, /data-source-key-attribute="Positive"/);
  assert.doesNotMatch(positive, /data-source-key-attribute="Negative"/);

  const both = renderToStaticMarkup(
    createElement(courseRw003.Renderer, {...common, frame: 159}),
  );
  assert.match(both, /data-source-key-attribute="Positive"/);
  assert.match(both, /data-source-key-attribute="Negative"/);

  const deterministicCapture = renderToStaticMarkup(
    createElement(courseRw003.Renderer, {
      ...common,
      frame: 159,
      entryStateSha256: "a".repeat(64),
      requirementId: "engineering-source-static-frame-159",
      traceId: "engineering-source-static",
    }),
  );
  assert.doesNotMatch(deterministicCapture, /data-source-key-attribute=/);
  assert.doesNotMatch(
    deterministicCapture,
    /data-page-interaction-companion-surface="source-glossary"/,
  );
});
