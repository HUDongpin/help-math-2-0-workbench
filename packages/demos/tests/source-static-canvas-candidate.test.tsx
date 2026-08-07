import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import test from "node:test";

import {
  buildCanvasAssetRequest,
  createSourceStaticCanvasCandidate,
} from "../src/source-static-canvas-candidate";

const candidate = createSourceStaticCanvasCandidate({
  animationId: "course-g04-l03-test-001",
  title: "Source-static test candidate",
  sourceSwfSha256: "a".repeat(64),
  assetSource: "/flash-assets/courses/course-g04-l03-test-001/canvas-renderer.js",
  stage: {width: 800, height: 600, backgroundColor: "#b8d8f7"},
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-44",
  mainFrameCount: 163,
  companionDomains: [{id: "sprite-5", frameCount: 1, label: "Page title"}],
  visualMarkers: [
    {id: "zero", firstFrame: 1, lastFrame: 31},
    {id: "opposite", firstFrame: 32},
  ],
});

const behaviorBoundedCandidate = createSourceStaticCanvasCandidate({
  ...candidate.config,
  animationId: "course-g04-l03-test-002",
  assetSource: "/flash-assets/courses/course-g04-l03-test-002/canvas-renderer.js",
  blockedFrameRanges: [
    {firstFrame: 160, lastFrame: 163, reason: "random-dependent-state-unvalidated"},
  ],
  livePlaybackEndFrame: 159,
});

test("generic source-static factory keeps root and nested frame domains separate", () => {
  assert.equal(candidate.movie.frameCount, 163);
  assert.equal(candidate.runtime.frameCount, 10);
  assert.equal(candidate.runtime.defaultFrameDomain, "sprite-44");
  assert.deepEqual(candidate.runtime.frameDomains, [
    {id: "sprite-44", frameCount: 163, fps: 12, rootFrame: 6},
    {id: "sprite-5", frameCount: 1, fps: 12, rootFrame: 6},
  ]);
  assert.equal(candidate.normalizeFrame(164), 163);
  assert.equal(candidate.normalizeFrame(7, "sprite-5"), 1);
  assert.equal(candidate.module.maturity, "legacy-prototype");
  assert.deepEqual(candidate.module.transport, {
    mode: "visual-frame-inspector",
    frameDomains: ["sprite-44"],
    stepFrames: 20,
    stateReconstruction: "renderer-remount-on-seek",
    audioDisposition: "disabled-while-inspecting",
    legacyBehaviorParity: false,
    strictAcceptanceEffect: "none",
  });
  assert.equal(candidate.sourceContract.strictAcceptanceEffect, "none");
  assert.deepEqual(candidate.sourceContract.nativeStage, {
    width: 800,
    height: 600,
    backgroundColor: "#b8d8f7",
  });
  assert.deepEqual(candidate.sourceContract.backingStage, {
    width: 800,
    height: 600,
  });
});

test("generic source-static factory preserves an exact fractional native stage with an integer backing stage", () => {
  const fractional = createSourceStaticCanvasCandidate({
    ...candidate.config,
    stage: {
      width: 799.9,
      height: 599.75,
      backgroundColor: "#b8d8f7",
    },
    nativeStage: {
      width: 799.9,
      height: 599.75,
      backgroundColor: "#b8d8f7",
    },
    backingStage: {width: 800, height: 600},
  });
  assert.deepEqual(fractional.movie.stage, {width: 799.9, height: 599.75});
  assert.deepEqual(fractional.runtime.stage, {width: 799.9, height: 599.75});
  assert.deepEqual(fractional.config.backingStage, {width: 800, height: 600});
  const state = fractional.getFrameState(1, {
    frameDomain: "sprite-44",
    scenario: "source-static-frame",
    lang: "en",
    seed: 0,
    requirementId: "req-fractional-stage",
    traceId: "trace-fractional-stage",
    entryStateSha256: "c".repeat(64),
  });
  const attributes = fractional.buildCaptureAttributes({
    canvasStatus: "ready",
    entryStateSha256: "c".repeat(64),
    frame: 1,
    frameDomain: "sprite-44",
    lang: "en",
    requirementId: "req-fractional-stage",
    scenario: "source-static-frame",
    seed: 0,
    state,
    traceId: "trace-fractional-stage",
  });
  assert.equal(attributes["data-flash-native-stage-width"], 799.9);
  assert.equal(attributes["data-flash-native-stage-height"], 599.75);
  assert.equal(attributes["data-canvas-backing-width"], 800);
  assert.equal(attributes["data-canvas-backing-height"], 600);
  const markup = renderToStaticMarkup(
    createElement(fractional.Renderer, {
      frame: 1,
      frameDomain: "sprite-44",
      scenario: "source-static-frame",
      lang: "en",
      seed: 0,
    }),
  );
  assert.match(markup, /width="800"/);
  assert.match(markup, /height="600"/);
  assert.match(markup, /aspect-ratio:799\.9 \/ 599\.75/);
});

test("hash-bound Canvas requests use digest-specific URL, promise key, and SRI", () => {
  const digest =
    "0c7ec104381d5b5a27e99015a1bd2f2ff7053be27bb5977af4e8fa75168e4d50";
  const request = buildCanvasAssetRequest({
    animationId: "course-g05-l04-vb-002",
    assetSource:
      "/flash-assets/courses/course-g05-l04-vb-002/canvas-renderer.js",
    assetSha256: digest,
  });
  assert.equal(
    request.src,
    `/flash-assets/courses/course-g05-l04-vb-002/canvas-renderer.js?sha256=${digest}`,
  );
  assert.equal(
    request.integrity,
    `sha256-${Buffer.from(digest, "hex").toString("base64")}`,
  );
  assert.equal(request.crossOrigin, "anonymous");
  assert.match(request.key, new RegExp(`course-g05-l04-vb-002:${digest}`));

  const changed = buildCanvasAssetRequest({
    animationId: "course-g05-l04-vb-002",
    assetSource:
      "/flash-assets/courses/course-g05-l04-vb-002/canvas-renderer.js",
    assetSha256: "f".repeat(64),
  });
  assert.notEqual(changed.key, request.key);
  assert.throws(
    () => buildCanvasAssetRequest({
      animationId: "course-g05-l04-vb-002",
      assetSource:
        "/flash-assets/courses/course-g05-l04-vb-002/canvas-renderer.js",
      assetSha256: "INVALID",
    }),
    /asset SHA-256 is invalid/,
  );
});

test("Canvas loader assigns digest identity before inserting the script", async () => {
  const source = await readFile(
    new URL("../src/source-static-canvas-candidate.tsx", import.meta.url),
    "utf8",
  );
  const digestDataset = source.indexOf(
    "script.dataset.helpMathCanvasSha256 = config.assetSha256",
  );
  const integrity = source.indexOf(
    "script.integrity = request.integrity",
  );
  const crossOrigin = source.indexOf(
    "script.crossOrigin = request.crossOrigin",
  );
  const sourceAssignment = source.indexOf("script.src = request.src");
  const insertion = source.indexOf("document.head.appendChild(script)");
  assert.ok(digestDataset >= 0);
  assert.ok(integrity > digestDataset);
  assert.ok(crossOrigin > integrity);
  assert.ok(sourceAssignment > crossOrigin);
  assert.ok(insertion > sourceAssignment);
  assert.match(source, /assetPromises\.get\(request\.key\)/);
  assert.match(source, /data-help-math-canvas-sha256/);
});

test("generic source-static state exposes visual markers but never host behavior", () => {
  const early = candidate.getFrameState(20, {
    frameDomain: "sprite-44",
    scenario: "source-static-frame",
    lang: "en",
    seed: 0,
  });
  assert.equal(early.status, "ready");
  assert.deepEqual(early.visibleSourceMarkers, ["zero"]);
  const later = candidate.getFrameState(32, {
    frameDomain: "sprite-44",
    scenario: "source-static-frame",
    lang: "en",
    seed: -1,
  });
  assert.equal(later.status, "ready");
  assert.deepEqual(later.visibleSourceMarkers, ["opposite"]);
  assert.equal(later.seed, 4_294_967_295);
  assert.equal(later.interactiveControlsEnabled, false);
  assert.equal(later.sourceHostBehaviorResolved, false);
  assert.equal(later.audioRendered, false);
});

test("generic source-static factory fails closed for Spanish, root, companion, and mismatches", () => {
  const spanish = candidate.getFrameState(1, {
    frameDomain: "sprite-44",
    scenario: "source-static-frame",
    lang: "es",
    seed: 0,
  });
  assert.equal(spanish.blocker, "spanish-visual-and-audio-unvalidated");
  const root = candidate.getFrameState(10, {
    frameDomain: "root",
    scenario: "root-unavailable",
    lang: "en",
    seed: 0,
  });
  assert.equal(root.blocker, "root-baseline-unavailable");
  assert.equal(root.rootFrame, 10);
  const companion = candidate.getFrameState(1, {
    frameDomain: "sprite-5",
    scenario: "sprite-5-unavailable",
    lang: "en",
    seed: 0,
  });
  assert.equal(companion.blocker, "companion-domain-unrendered");
  const mismatch = candidate.getFrameState(1, {
    frameDomain: "root",
    scenario: "source-static-frame",
    lang: "en",
    seed: 0,
  });
  assert.equal(mismatch.blocker, "frame-domain-scenario-mismatch");
  const unknown = candidate.getFrameState(1, {
    frameDomain: "sprite-999",
    scenario: "source-static-frame",
    lang: "en",
    seed: 0,
  });
  assert.equal(unknown.blocker, "unsupported-runtime-request");
});

test("generic capture attributes require full trace identity and disclose disabled controls", () => {
  const incompleteState = candidate.getFrameState(32, {
    frameDomain: "sprite-44",
    scenario: "source-static-frame",
    lang: "en",
    seed: 7,
  });
  const incomplete = candidate.buildCaptureAttributes({
    canvasStatus: "ready",
    entryStateSha256: "",
    frame: 32,
    frameDomain: "sprite-44",
    lang: "en",
    requirementId: "",
    scenario: "source-static-frame",
    seed: 7,
    state: incompleteState,
    traceId: "",
  });
  assert.equal(incomplete["data-capture-stage"], undefined);
  assert.equal(incomplete["data-capture-identity-status"], "blocked");
  const identity = {
    entryStateSha256: "b".repeat(64),
    requirementId: "req-32",
    traceId: "trace-32",
  };
  const state = candidate.getFrameState(32, {
    frameDomain: "sprite-44",
    scenario: "source-static-frame",
    lang: "en",
    seed: 7,
    ...identity,
  });
  assert.equal(state.requirementId, identity.requirementId);
  assert.equal(state.traceId, identity.traceId);
  assert.equal(state.entryStateSha256, identity.entryStateSha256);
  const complete = candidate.buildCaptureAttributes({
    canvasStatus: "ready",
    frame: 32,
    frameDomain: "sprite-44",
    lang: "en",
    scenario: "source-static-frame",
    seed: 7,
    state,
    ...identity,
  });
  assert.equal(complete["data-capture-stage"], "true");
  assert.equal(complete["data-capture-identity-status"], "verified");
  assert.equal(complete["data-flash-frame-domain"], "sprite-44");
  assert.equal(complete["data-source-marker-visuals"], "opposite");
  assert.equal(complete["data-source-controls-enabled"], "false");

  const mismatched = candidate.buildCaptureAttributes({
    canvasStatus: "ready",
    frame: 31,
    frameDomain: "sprite-44",
    lang: "en",
    scenario: "source-static-frame",
    seed: 7,
    state,
    ...identity,
  });
  assert.equal(mismatched["data-capture-stage"], undefined);
  assert.equal(mismatched["data-capture-identity-status"], "blocked");
});

test("generic blocked renderer exposes the precise blocker without a canvas", () => {
  const markup = renderToStaticMarkup(
    createElement(candidate.Renderer, {
      frame: 1,
      frameDomain: "sprite-44",
      scenario: "source-static-frame",
      lang: "es",
      seed: 0,
    }),
  );
  assert.match(
    markup,
    /data-fail-closed-reason="spanish-visual-and-audio-unvalidated"/,
  );
  assert.match(markup, /data-interactive-controls-enabled="false"/);
  assert.match(markup, /data-strict-migration-complete="false"/);
  assert.doesNotMatch(markup, /<canvas/);
});

test("generic source-static factory binds seed identity but blocks behavior-dependent frames", () => {
  const ready = behaviorBoundedCandidate.getFrameState(159, {
    frameDomain: "sprite-44",
    scenario: "source-static-frame",
    lang: "en",
    seed: -1,
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.seed, 4_294_967_295);
  const blocked = behaviorBoundedCandidate.getFrameState(160, {
    frameDomain: "sprite-44",
    scenario: "source-static-frame",
    lang: "en",
    seed: 7,
  });
  assert.equal(blocked.status, "blocked");
  assert.equal(
    blocked.blocker,
    "source-behavior-dependent-frame-unvalidated",
  );
  assert.deepEqual(blocked.visibleSourceMarkers, []);
  assert.equal(
    behaviorBoundedCandidate.sourceContract.blockedSourceBehaviorFrameCount,
    4,
  );
  assert.equal(
    behaviorBoundedCandidate.module.playbackEndFrameByDomain?.["sprite-44"],
    159,
  );
  const markup = renderToStaticMarkup(
    createElement(behaviorBoundedCandidate.Renderer, {
      frame: 163,
      frameDomain: "sprite-44",
      scenario: "source-static-frame",
      lang: "en",
      seed: 7,
    }),
  );
  assert.match(
    markup,
    /data-fail-closed-reason="source-behavior-dependent-frame-unvalidated"/,
  );
  assert.doesNotMatch(markup, /<canvas/);
});

test("generic factory rejects unsafe or internally inconsistent configurations", () => {
  assert.throws(
    () =>
      createSourceStaticCanvasCandidate({
        ...candidate.config,
        assetSource: "https://legacy.example/animation.js",
      }),
    /asset path must be local/,
  );
  assert.throws(
    () =>
      createSourceStaticCanvasCandidate({
        ...candidate.config,
        companionDomains: [
          {id: "sprite-44", frameCount: 1, label: "duplicate"},
        ],
      }),
    /frame domains must be unique/,
  );
  assert.throws(
    () =>
      createSourceStaticCanvasCandidate({
        ...candidate.config,
        companionDomains: [{id: "sprite-9", frameCount: 0, label: "bad"}],
      }),
    /companion sprite-9 frame count is invalid/,
  );
  assert.throws(
    () =>
      createSourceStaticCanvasCandidate({
        ...candidate.config,
        blockedFrameRanges: [
          {firstFrame: 160, lastFrame: 163, reason: "first"},
          {firstFrame: 163, lastFrame: 163, reason: "overlap"},
        ],
      }),
    /sorted and non-overlapping/,
  );
  assert.throws(
    () =>
      createSourceStaticCanvasCandidate({
        ...behaviorBoundedCandidate.config,
        livePlaybackEndFrame: 160,
      }),
    /live playback end frame must be renderable/,
  );
  assert.throws(
    () =>
      createSourceStaticCanvasCandidate({
        ...candidate.config,
        stage: {
          width: 799.9,
          height: 599.75,
          backgroundColor: "#b8d8f7",
        },
        nativeStage: {
          width: 799.9,
          height: 599.75,
          backgroundColor: "#b8d8f7",
        },
        backingStage: undefined,
      }),
    /backing stage is required with native stage/,
  );
  assert.throws(
    () =>
      createSourceStaticCanvasCandidate({
        ...candidate.config,
        stage: {
          width: 799.9,
          height: 599.75,
          backgroundColor: "#b8d8f7",
        },
        nativeStage: {
          width: 799.9,
          height: 599.75,
          backgroundColor: "#b8d8f7",
        },
        backingStage: {width: 799, height: 600},
      }),
    /ceil-positive-native-stage-dimensions/,
  );
});
