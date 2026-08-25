import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import test from "node:test";

import {
  applyCanvasCapturePresentationStatus,
  buildCanvasAssetRequest,
  createLatestCanvasRenderCoordinator,
  createSourceStaticCanvasCandidate,
  retainedCanvasStatus,
  resolveSourceStaticCanvasProductionConfig,
  sourceStaticCanvasMayFallbackToK1,
  sourceStaticCanvasRenderKey,
  sourceStaticCanvasResolutionSelectionKey,
  sourceStaticCanvasVisualKey,
} from "../src/source-static-canvas-candidate";
import {selectAdaptiveCanvasResolution} from "../src/adaptive-canvas-resolution";
import {CanvasPresentationAllocationError} from "../src/adaptive-canvas-presenter";

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return {promise, reject, resolve};
}

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

const adaptiveCandidate = createSourceStaticCanvasCandidate({
  ...candidate.config,
  animationId: "course-g04-l03-test-003",
  assetSource: "/flash-assets/courses/course-g04-l03-test-003/canvas-renderer.js",
  assetSha256: "b".repeat(64),
  resolution: Object.freeze({
    schemaVersion: 1,
    mode: "adaptive-integer",
    nativeWidth: 800,
    nativeHeight: 600,
    supportedRenderScales: [1, 2],
  }),
});

test("production bindings opt historical candidates into one content-addressed adaptive runtime", () => {
  const historicalConfig = {
    ...candidate.config,
    assetSha256: "a".repeat(64),
    resolution: undefined,
  };
  assert.equal(
    resolveSourceStaticCanvasProductionConfig(historicalConfig, () => null),
    historicalConfig,
  );

  const binding = Object.freeze({
    animationId: historicalConfig.animationId,
    pageRenderer: true,
    assetPath: historicalConfig.assetSource,
    assetSha256: "d".repeat(64),
    resolution: Object.freeze({
      schemaVersion: 1,
      mode: "adaptive-integer",
      nativeWidth: 800,
      nativeHeight: 600,
      supportedRenderScales: Object.freeze([1, 2] as const),
    }),
    sourceBitmapResolutionBound: true,
  } as const);
  const resolved = resolveSourceStaticCanvasProductionConfig(
    historicalConfig,
    () => binding,
  );
  assert.equal(resolved.assetSha256, "d".repeat(64));
  assert.equal(resolved.assetSource, historicalConfig.assetSource);
  assert.equal(resolved.resolution, binding.resolution);
  assert.equal(resolved.sourceBitmapResolutionBound, true);
  assert.equal(historicalConfig.assetSha256, "a".repeat(64));
});

test("production binding mismatches fail closed before candidate construction", () => {
  const baseBinding = {
    animationId: candidate.config.animationId,
    pageRenderer: true,
    assetPath: candidate.config.assetSource,
    assetSha256: "d".repeat(64),
    resolution: {
      schemaVersion: 1,
      mode: "adaptive-integer",
      nativeWidth: 800,
      nativeHeight: 600,
      supportedRenderScales: [1, 2] as const,
    },
    sourceBitmapResolutionBound: false,
  } as const;
  assert.throws(
    () =>
      resolveSourceStaticCanvasProductionConfig(candidate.config, () => ({
        ...baseBinding,
        pageRenderer: false,
      })),
    /not a page renderer/,
  );
  assert.throws(
    () =>
      resolveSourceStaticCanvasProductionConfig(candidate.config, () => ({
        ...baseBinding,
        assetPath:
          "/flash-assets/courses/course-g04-l03-wrong/canvas-renderer.js",
      })),
    /asset path does not match/,
  );
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

  const adaptiveRequest = buildCanvasAssetRequest({
    animationId: "course-g05-l04-vb-002",
    assetSource:
      "/flash-assets/courses/course-g05-l04-vb-002/canvas-renderer.js",
    assetSha256: digest,
    resolution: {
      schemaVersion: 1,
      mode: "adaptive-integer",
      nativeWidth: 800,
      nativeHeight: 600,
      supportedRenderScales: [1, 2],
    },
  });
  assert.equal(
    adaptiveRequest.src,
    `/flash-assets/by-sha256/${digest}/courses/course-g05-l04-vb-002/canvas-renderer.js`,
  );
  assert.equal(adaptiveRequest.integrity, request.integrity);

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

test("Canvas loader delegates exact digest and object binding to the shared loader", async () => {
  const sourceStatic = await readFile(
    new URL("../src/source-static-canvas-candidate.tsx", import.meta.url),
    "utf8",
  );
  const presenter = await readFile(
    new URL("../src/adaptive-canvas-presenter.ts", import.meta.url),
    "utf8",
  );
  assert.match(sourceStatic, /loadExactCanvasRegistryScript<CanvasAsset>/);
  assert.match(sourceStatic, /assetSha256: config\.assetSha256 \?\? null/);
  assert.match(sourceStatic, /markerAttribute: "data-help-math-canvas-asset"/);
  assert.match(sourceStatic, /registeredAsset: \(\) =>[\s\S]*?HELP_MATH_CANVAS_ASSETS/);
  assert.doesNotMatch(sourceStatic, /const registered = window\.HELP_MATH_CANVAS_ASSETS/);

  const digestDataset = presenter.indexOf(
    "script.dataset.helpMathCanvasSha256 = assetSha256",
  );
  const integrity = presenter.indexOf(
    "script.integrity = request.integrity",
  );
  const crossOrigin = presenter.indexOf(
    "script.crossOrigin = request.crossOrigin",
  );
  const sourceAssignment = presenter.indexOf("script.src = request.src");
  const insertion = presenter.indexOf("document.head.appendChild(script)");
  assert.ok(digestDataset >= 0);
  assert.ok(integrity > digestDataset);
  assert.ok(crossOrigin > integrity);
  assert.ok(sourceAssignment > crossOrigin);
  assert.ok(insertion > sourceAssignment);
  assert.match(presenter, /exactCanvasScriptBindings\.set\(script, \{asset, loaderKey\}\)/);
  assert.match(presenter, /asset === registeredBeforeLoad/);
});

test("source-static fallback is limited to adaptive k2 allocation failures and keyed to the selection", () => {
  const retina = selectAdaptiveCanvasResolution({
    authoredStage: {width: 800, height: 600},
    cssStage: {width: 800, height: 600},
    devicePixelRatio: 2,
  });
  const allocationError = new CanvasPresentationAllocationError(
    "Canvas allocation denied at 2x",
  );
  assert.equal(sourceStaticCanvasMayFallbackToK1({
    adaptiveEnabled: true,
    error: allocationError,
    resolution: retina,
  }), true);
  assert.equal(sourceStaticCanvasMayFallbackToK1({
    adaptiveEnabled: false,
    error: allocationError,
    resolution: retina,
  }), false);
  assert.equal(sourceStaticCanvasMayFallbackToK1({
    adaptiveEnabled: true,
    error: new Error("renderer identity mismatch"),
    resolution: retina,
  }), false);

  const native = selectAdaptiveCanvasResolution({
    authoredStage: {width: 800, height: 600},
    cssStage: {width: 800, height: 600},
    devicePixelRatio: 1,
  });
  assert.equal(sourceStaticCanvasMayFallbackToK1({
    adaptiveEnabled: true,
    error: allocationError,
    resolution: native,
  }), false);
  assert.notEqual(
    sourceStaticCanvasResolutionSelectionKey(retina),
    sourceStaticCanvasResolutionSelectionKey(native),
  );
});

test("source-static fallback retries the latest coalesced request key and revokes capture", async () => {
  const source = await readFile(
    new URL("../src/source-static-canvas-candidate.tsx", import.meta.url),
    "utf8",
  );
  assert.match(source, /attemptedRequest = request/);
  assert.match(source, /resolution: failedRequest\.resolution/);
  assert.match(source, /selectionKey: failedRequest\.selectionKey/);
  assert.match(source, /stagingCanvasRef\.current = null/);
  assert.match(source, /data-resolution-status",[\s\S]*?"fallback-k1"/);
  assert.match(source, /captureReady: false/);
  assert.match(source, /data-resolution-fallback-reason/);
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

test("a retained bitmap is capture-ineligible as soon as a new frame is requested", () => {
  const rendered = candidate.getFrameState(31, {
    frameDomain: "sprite-44",
    scenario: "source-static-frame",
    lang: "en",
    seed: 7,
  });
  const requested = candidate.getFrameState(32, {
    frameDomain: "sprite-44",
    scenario: "source-static-frame",
    lang: "en",
    seed: 7,
  });
  const renderedVisualKey = sourceStaticCanvasVisualKey(rendered);
  const requestedVisualKey = sourceStaticCanvasVisualKey(requested);
  assert.notEqual(renderedVisualKey, requestedVisualKey);
  assert.equal(retainedCanvasStatus({
    canvasStatus: "ready",
    renderedVisualKey,
    requestedVisualKey,
  }), "updating");
  assert.equal(retainedCanvasStatus({
    canvasStatus: "ready",
    renderedVisualKey: requestedVisualKey,
    requestedVisualKey,
  }), "ready");
  assert.equal(retainedCanvasStatus({
    canvasStatus: "loading",
    renderedVisualKey,
    requestedVisualKey,
  }), "loading");
});

test("imperative Canvas presentation transitions restore and revoke the full capture contract", () => {
  const attributes = new Map<string, string>();
  const target = {
    removeAttribute(name: string) {
      attributes.delete(name);
    },
    setAttribute(name: string, value: string) {
      attributes.set(name, value);
    },
  };

  applyCanvasCapturePresentationStatus(target, {
    captureReady: true,
    status: "ready",
  });
  assert.deepEqual(Object.fromEntries(attributes), {
    "data-capture-stage": "true",
    "data-render-state": "ready",
    "data-render-visual": "true",
  });

  applyCanvasCapturePresentationStatus(target, {
    captureReady: true,
    status: "updating",
  });
  assert.deepEqual(Object.fromEntries(attributes), {
    "data-render-state": "updating",
  });

  applyCanvasCapturePresentationStatus(target, {
    captureReady: false,
    status: "ready",
  });
  assert.deepEqual(Object.fromEntries(attributes), {
    "data-render-state": "ready",
    "data-render-visual": "true",
  });

  applyCanvasCapturePresentationStatus(target, {
    captureReady: false,
    status: "error",
  });
  assert.deepEqual(Object.fromEntries(attributes), {
    "data-render-state": "error",
  });
});

test("Canvas rendering coalesces advancing frames while asset readiness is delayed", async () => {
  const readiness = deferred<{readonly asset: "ready"}>();
  const coordinator = createLatestCanvasRenderCoordinator<
    Readonly<{frame: number}>,
    Readonly<{asset: "ready"}>
  >();
  const renderedFrames: number[] = [];
  let prepareCalls = 0;

  coordinator.enqueue({frame: 1});
  const firstRun = coordinator.run(
    async () => {
      prepareCalls += 1;
      return readiness.promise;
    },
    (request) => renderedFrames.push(request.frame),
  );
  assert.equal(firstRun.started, true);

  for (let frame = 2; frame <= 20; frame += 1) {
    coordinator.enqueue({frame});
    const coalescedRun = coordinator.run(
      async () => {
        prepareCalls += 1;
        return {asset: "ready"};
      },
      (request) => renderedFrames.push(request.frame),
    );
    assert.equal(coalescedRun.started, false);
    assert.equal(coalescedRun.completion, firstRun.completion);
  }

  readiness.resolve({asset: "ready"});
  assert.deepEqual(await firstRun.completion, {frame: 20});
  assert.equal(prepareCalls, 1);
  assert.deepEqual(renderedFrames, [20]);

  coordinator.enqueue({frame: 21});
  const nextRun = coordinator.run(
    async () => ({asset: "ready"}),
    (request) => renderedFrames.push(request.frame),
  );
  assert.equal(nextRun.started, true);
  assert.deepEqual(await nextRun.completion, {frame: 21});
  assert.deepEqual(renderedFrames, [20, 21]);
});

test("Canvas rendering drops a late completion after lifecycle cancellation", async () => {
  const readiness = deferred<{readonly asset: "stale"}>();
  const coordinator = createLatestCanvasRenderCoordinator<
    Readonly<{frame: number}>,
    Readonly<{asset: "ready" | "stale"}>
  >();
  const renderedFrames: number[] = [];

  coordinator.enqueue({frame: 1});
  const staleRun = coordinator.run(
    async () => readiness.promise,
    (request) => renderedFrames.push(request.frame),
  );
  coordinator.cancel();

  coordinator.enqueue({frame: 2});
  const currentRun = coordinator.run(
    async () => ({asset: "ready"}),
    (request) => renderedFrames.push(request.frame),
  );
  assert.equal(currentRun.started, true);
  assert.deepEqual(await currentRun.completion, {frame: 2});
  readiness.resolve({asset: "stale"});
  assert.equal(await staleRun.completion, null);
  assert.deepEqual(renderedFrames, [2]);
});

test("Canvas render request keys are stable and include every deterministic trace identity field", () => {
  const identity = candidate.getFrameState(32, {
    frameDomain: "sprite-44",
    scenario: "source-static-frame",
    lang: "en",
    seed: 7,
    requirementId: "req-source-static-32",
    traceId: "trace-source-static-32",
    entryStateSha256: "d".repeat(64),
  });
  const key = sourceStaticCanvasRenderKey(identity);
  assert.equal(sourceStaticCanvasRenderKey({...identity}), key);

  for (const changed of [
    {...identity, animationId: "course-g04-l03-test-999"},
    {...identity, entryStateSha256: "e".repeat(64)},
    {...identity, frame: identity.frame + 1},
    {...identity, frameDomain: "sprite-5"},
    {...identity, language: "es" as const},
    {...identity, requirementId: "req-source-static-32-successor"},
    {...identity, rootFrame: identity.rootFrame + 1},
    {...identity, scenario: "source-static-frame-successor"},
    {...identity, seed: identity.seed + 1},
    {...identity, traceId: "trace-source-static-32-successor"},
    {...identity, renderScale: 2 as const},
  ]) {
    assert.notEqual(sourceStaticCanvasRenderKey(changed), key);
  }
});

test("adaptive metadata controls backing diagnostics without enlarging CSS layout", () => {
  assert.deepEqual(adaptiveCandidate.config.resolution, {
    schemaVersion: 1,
    mode: "adaptive-integer",
    nativeWidth: 800,
    nativeHeight: 600,
    supportedRenderScales: [1, 2],
  });
  const state = adaptiveCandidate.getFrameState(32, {
    frameDomain: "sprite-44",
    scenario: "source-static-frame",
    lang: "en",
    seed: 7,
    requirementId: "req-adaptive-32",
    traceId: "trace-adaptive-32",
    entryStateSha256: "a".repeat(64),
  });
  const resolution = selectAdaptiveCanvasResolution({
    authoredStage: {width: 800, height: 600},
    cssStage: {width: 800, height: 600},
    devicePixelRatio: 2,
  });
  const attributes = adaptiveCandidate.buildCaptureAttributes({
    canvasStatus: "ready",
    entryStateSha256: "a".repeat(64),
    frame: 32,
    frameDomain: "sprite-44",
    lang: "en",
    requirementId: "req-adaptive-32",
    scenario: "source-static-frame",
    seed: 7,
    resolution,
    state,
    traceId: "trace-adaptive-32",
  });
  assert.equal(attributes["data-render-scale"], 2);
  assert.equal(attributes["data-canvas-backing-width"], 1600);
  assert.equal(attributes["data-canvas-backing-height"], 1200);
  assert.equal(attributes["data-resolution-status"], "retina");
  assert.equal(attributes["data-resolution-ceiling-reached"], "false");

  const markup = renderToStaticMarkup(
    createElement(adaptiveCandidate.Renderer, {
      frame: 1,
      frameDomain: "sprite-44",
      scenario: "source-static-frame",
      lang: "en",
      seed: 0,
    }),
  );
  assert.match(markup, /data-render-scale="1"/);
  assert.match(markup, /data-resolution-status="fallback-k1"/);
  assert.match(markup, /width="800"/);
  assert.doesNotMatch(markup, /width="1600"/);
  assert.doesNotMatch(markup, /max-width:1600/);
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

  const updating = candidate.buildCaptureAttributes({
    canvasStatus: "updating",
    frame: 32,
    frameDomain: "sprite-44",
    lang: "en",
    scenario: "source-static-frame",
    seed: 7,
    state,
    ...identity,
  });
  assert.equal(updating["data-capture-stage"], undefined);
  assert.equal(updating["data-render-state"], "updating");
  assert.equal(updating["data-render-visual"], undefined);

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
  assert.throws(
    () =>
      createSourceStaticCanvasCandidate({
        ...candidate.config,
        assetSha256: "c".repeat(64),
        resolution: {
          schemaVersion: 1,
          mode: "adaptive-integer",
          nativeWidth: 1600,
          nativeHeight: 1200,
          supportedRenderScales: [1, 2],
        },
      }),
    /adaptive resolution contract is invalid/,
  );
  assert.throws(
    () =>
      createSourceStaticCanvasCandidate({
        ...candidate.config,
        resolution: {
          schemaVersion: 1,
          mode: "adaptive-integer",
          nativeWidth: 800,
          nativeHeight: 600,
          supportedRenderScales: [1, 2],
        },
      }),
    /requires an exact asset SHA-256/,
  );
});
