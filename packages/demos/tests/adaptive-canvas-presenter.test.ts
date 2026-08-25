import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";

import {selectAdaptiveCanvasResolution} from "../src/adaptive-canvas-resolution";
import {
  CanvasPresentationAllocationError,
  applyAdaptiveCanvasPresentationStatus,
  buildAdaptiveCanvasAssetRequest,
  createLatestAdaptiveCanvasRenderCoordinator,
  loadExactCanvasRegistryScript,
  prepareAdaptiveCanvasStaging,
  presentVerifiedAdaptiveCanvas,
  resolveAdaptiveCanvasPageAsset,
  retainedAdaptiveCanvasStatus,
  stampAdaptiveCanvasCaptureIdentity,
  verifyAdaptiveCanvasAssetResolution,
} from "../src/adaptive-canvas-presenter";
import {createK1CanvasAllocationFallback} from "../src/use-adaptive-canvas-presenter";

const RESOLUTION = Object.freeze({
  schemaVersion: 1 as const,
  mode: "adaptive-integer" as const,
  nativeWidth: 800,
  nativeHeight: 600,
  supportedRenderScales: [1, 2] as const,
});

class FakeCanvas {
  width = 300;
  height = 150;
  readonly values = new Map<string, string>();
  readonly operations: string[] = [];
  readonly context = {
    globalAlpha: 1,
    globalCompositeOperation: "source-over",
    setTransform: () => this.operations.push("setTransform"),
    drawImage: () => this.operations.push("drawImage"),
  };

  get attributes() {
    return [...this.values].map(([name, value]) => ({name, value}));
  }

  getAttribute(name: string) {
    return this.values.get(name) ?? null;
  }

  removeAttribute(name: string) {
    this.values.delete(name);
  }

  setAttribute(name: string, value: string) {
    this.values.set(name, value);
  }

  getContext(kind: string) {
    return kind === "2d" ? this.context : null;
  }
}

class FakeScriptElement {
  async = false;
  crossOrigin: string | null = null;
  readonly dataset: Record<string, string> = {};
  integrity = "";
  isConnected = false;
  onerror: (() => void) | null = null;
  onload: (() => void) | null = null;
  private source = "";

  constructor(private readonly owner: FakeDocument) {}

  get src() {
    return this.source;
  }

  set src(value: string) {
    this.source = new URL(value, this.owner.baseURI).href;
  }

  remove() {
    this.owner.remove(this);
  }
}

class FakeDocument {
  readonly baseURI = "https://canvas-loader.test/lesson";
  readonly scripts: FakeScriptElement[] = [];
  readonly head = {
    appendChild: (script: FakeScriptElement) => {
      script.isConnected = true;
      this.scripts.push(script);
      return script;
    },
  };

  createElement(name: string) {
    assert.equal(name, "script");
    return new FakeScriptElement(this);
  }

  querySelector(selector: string) {
    const marker = selector.match(
      /data-help-math-(canvas-asset|loaded-swf-host)="([^"]+)"/,
    );
    const digest = selector.match(
      /data-help-math-canvas-sha256="([^"]+)"/,
    )?.[1];
    if (!marker) return null;
    const datasetKey = marker[1] === "canvas-asset"
      ? "helpMathCanvasAsset"
      : "helpMathLoadedSwfHost";
    return this.scripts.find((script) =>
      script.isConnected &&
      script.dataset[datasetKey] === marker[2] &&
      (digest === undefined ||
        script.dataset.helpMathCanvasSha256 === digest)
    ) ?? null;
  }

  remove(script: FakeScriptElement) {
    script.isConnected = false;
    const index = this.scripts.indexOf(script);
    if (index >= 0) this.scripts.splice(index, 1);
  }
}

function asCanvas(canvas: FakeCanvas) {
  return canvas as unknown as HTMLCanvasElement;
}

test("adaptive asset requests require exact digest URLs and SRI", () => {
  const digest = "a".repeat(64);
  const legacy = buildAdaptiveCanvasAssetRequest({
    animationId: "course-g04-l03-in-003",
    assetPath:
      "/flash-assets/courses/course-g04-l03-in-003/canvas-renderer.js",
  });
  assert.equal(
    legacy.src,
    "/flash-assets/courses/course-g04-l03-in-003/canvas-renderer.js",
  );
  assert.equal(legacy.integrity, null);

  const fixedHash = buildAdaptiveCanvasAssetRequest({
    animationId: "course-g04-l03-in-003",
    assetPath:
      "/flash-assets/courses/course-g04-l03-in-003/canvas-renderer.js",
    assetSha256: digest,
  });
  assert.equal(fixedHash.src.endsWith(`?sha256=${digest}`), true);

  const adaptive = buildAdaptiveCanvasAssetRequest({
    animationId: "course-g04-l03-in-003",
    assetPath:
      "/flash-assets/courses/course-g04-l03-in-003/canvas-renderer.js",
    assetSha256: digest,
    resolution: RESOLUTION,
  });
  assert.equal(
    adaptive.src,
    `/flash-assets/by-sha256/${digest}/courses/course-g04-l03-in-003/canvas-renderer.js`,
  );
  assert.equal(
    adaptive.integrity,
    `sha256-${Buffer.from(digest, "hex").toString("base64")}`,
  );
  assert.equal(adaptive.crossOrigin, "anonymous");
  assert.throws(
    () => buildAdaptiveCanvasAssetRequest({
      animationId: "course-g04-l03-in-003",
      assetPath:
        "/flash-assets/courses/course-g04-l03-in-003/canvas-renderer.js",
      resolution: RESOLUTION,
    }),
    /requires an exact SHA-256 binding/,
  );
});

test("exact script loading binds each digest request to the object registered by that execution", async () => {
  const originalDocument = Object.getOwnPropertyDescriptor(
    globalThis,
    "document",
  );
  const fakeDocument = new FakeDocument();
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: fakeDocument,
  });
  const registryKey = "course-g04-l03-loader-binding-test";
  let registered: object | undefined;
  const request = (digest: string) => ({
    key: `${registryKey}:${digest}`,
    src: `/flash-assets/by-sha256/${digest}/courses/${registryKey}/canvas-renderer.js`,
    integrity: `sha256-${digest}`,
    crossOrigin: "anonymous" as const,
  });
  const load = (digest: string) =>
    loadExactCanvasRegistryScript<object>({
      assetSha256: digest,
      markerAttribute: "data-help-math-canvas-asset",
      markerDatasetKey: "helpMathCanvasAsset",
      registeredAsset: () => registered,
      registryKey,
      request: request(digest),
    });

  try {
    const digestA = "1".repeat(64);
    const assetA = Object.freeze({digest: digestA});
    const promiseA = load(digestA);
    const scriptA = fakeDocument.scripts.at(-1);
    assert.ok(scriptA);
    registered = assetA;
    scriptA.onload?.();
    assert.equal(await promiseA, assetA);

    const digestB = "2".repeat(64);
    const assetB = Object.freeze({digest: digestB});
    const promiseB = load(digestB);
    const scriptB = fakeDocument.scripts.at(-1);
    assert.ok(scriptB && scriptB !== scriptA);
    registered = assetB;
    scriptB.onload?.();
    assert.equal(await promiseB, assetB);

    // The mutable registry now points at B, but the exact A request remains
    // bound to the object captured from A's own script execution.
    assert.equal(await load(digestA), assetA);

    const digestC = "3".repeat(64);
    const promiseC = load(digestC);
    const scriptC = fakeDocument.scripts.at(-1);
    assert.ok(scriptC);
    // Leaving the old B object in the registry must not let C claim it.
    scriptC.onload?.();
    await assert.rejects(
      promiseC,
      /did not register a new exact request-key object/,
    );
  } finally {
    if (originalDocument) {
      Object.defineProperty(globalThis, "document", originalDocument);
    } else {
      delete (globalThis as {document?: unknown}).document;
    }
  }
});

test("different digest loads for one registry key cannot race through the mutable global", async () => {
  const originalDocument = Object.getOwnPropertyDescriptor(
    globalThis,
    "document",
  );
  const fakeDocument = new FakeDocument();
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: fakeDocument,
  });
  const registryKey = "course-g04-l03-loader-race-test";
  let registered: object | undefined;
  const load = (digest: string) =>
    loadExactCanvasRegistryScript<object>({
      assetSha256: digest,
      markerAttribute: "data-help-math-canvas-asset",
      markerDatasetKey: "helpMathCanvasAsset",
      registeredAsset: () => registered,
      registryKey,
      request: {
        key: `${registryKey}:${digest}`,
        src: `/flash-assets/by-sha256/${digest}/courses/${registryKey}/canvas-renderer.js`,
        integrity: `sha256-${digest}`,
        crossOrigin: "anonymous",
      },
    });

  try {
    const digestA = "4".repeat(64);
    const pendingA = load(digestA);
    await assert.rejects(
      load("5".repeat(64)),
      /different exact Canvas request is already loading/,
    );
    const scriptA = fakeDocument.scripts.at(-1);
    assert.ok(scriptA);
    registered = Object.freeze({digest: digestA});
    scriptA.onload?.();
    assert.equal(await pendingA, registered);
  } finally {
    if (originalDocument) {
      Object.defineProperty(globalThis, "document", originalDocument);
    } else {
      delete (globalThis as {document?: unknown}).document;
    }
  }
});

test("adaptive metadata is exact while metadata absence remains a valid k1 contract", () => {
  assert.doesNotThrow(() => verifyAdaptiveCanvasAssetResolution({}, undefined));
  assert.doesNotThrow(() => verifyAdaptiveCanvasAssetResolution({
    metadata: {resolution: RESOLUTION},
  }, RESOLUTION));
  assert.throws(
    () => verifyAdaptiveCanvasAssetResolution({
      metadata: {resolution: {...RESOLUTION, nativeWidth: 801}},
    }, RESOLUTION),
    /expected adaptive resolution contract/,
  );
});

test("page binding resolution fails closed on identity, path, or member-kind drift", () => {
  const legacy = {
    animationId: "course-g04-l03-in-003",
    assetPath:
      "/flash-assets/courses/course-g04-l03-in-003/canvas-renderer.js",
  } as const;
  assert.equal(resolveAdaptiveCanvasPageAsset({
    animationId: legacy.animationId,
    legacyAsset: legacy,
    productionBinding: null,
  }), legacy);
  assert.throws(() => resolveAdaptiveCanvasPageAsset({
    animationId: legacy.animationId,
    legacyAsset: legacy,
    productionBinding: {...legacy, pageRenderer: false},
  }), /not a page renderer/);
  assert.throws(() => resolveAdaptiveCanvasPageAsset({
    animationId: legacy.animationId,
    explicitBinding: {
      ...legacy,
      animationId: "course-g04-l03-in-009",
      assetSha256: "c".repeat(64),
      pageRenderer: true,
      resolution: RESOLUTION,
    },
    legacyAsset: legacy,
    productionBinding: null,
  }), /animationId mismatch/);
  assert.throws(() => resolveAdaptiveCanvasPageAsset({
    animationId: legacy.animationId,
    explicitBinding: {
      ...legacy,
      assetPath:
        "/flash-assets/courses/course-g04-l03-in-009/canvas-renderer.js",
      assetSha256: "c".repeat(64),
      pageRenderer: true,
      resolution: RESOLUTION,
    },
    legacyAsset: legacy,
    productionBinding: null,
  }), /assetPath mismatch/);

  const activeProduction = {
    ...legacy,
    assetSha256: "d".repeat(64),
    pageRenderer: true,
    resolution: RESOLUTION,
    sourceBitmapResolutionBound: false,
  } as const;
  assert.equal(resolveAdaptiveCanvasPageAsset({
    animationId: legacy.animationId,
    explicitBinding: {...activeProduction},
    legacyAsset: legacy,
    productionBinding: activeProduction,
  }), activeProduction);
  assert.throws(() => resolveAdaptiveCanvasPageAsset({
    animationId: legacy.animationId,
    explicitBinding: {
      ...activeProduction,
      assetSha256: "e".repeat(64),
    },
    legacyAsset: legacy,
    productionBinding: activeProduction,
  }), /does not match the active production binding/);
});

test("staging presentation is synchronous, copies identity, and stamps diagnostics", () => {
  const resolution = selectAdaptiveCanvasResolution({
    authoredStage: {width: 800, height: 600},
    cssStage: {width: 800, height: 600},
    devicePixelRatio: 2,
  });
  const staging = new FakeCanvas();
  prepareAdaptiveCanvasStaging(asCanvas(staging), resolution);
  stampAdaptiveCanvasCaptureIdentity(asCanvas(staging), {
    entryStateSha256: "b".repeat(64),
    frame: 27,
    frameDomain: "sprite-84",
    lang: "en",
    requirementId: "req-27",
    rootFrame: 6,
    scenario: "source-static-frame",
    seed: 7,
    traceId: "trace-27",
  });
  const visible = new FakeCanvas();
  presentVerifiedAdaptiveCanvas(
    asCanvas(visible),
    asCanvas(staging),
    resolution,
    true,
  );
  assert.equal(visible.width, 1600);
  assert.equal(visible.height, 1200);
  assert.deepEqual(visible.operations, ["setTransform", "drawImage"]);
  assert.equal(visible.getAttribute("data-flash-frame"), "27");
  assert.equal(visible.getAttribute("data-render-scale"), "2");
  assert.equal(visible.getAttribute("data-canvas-backing-width"), "1600");
  assert.equal(visible.getAttribute("data-resolution-status"), "retina");
  assert.equal(
    visible.getAttribute("data-resolution-ceiling-reached"),
    "false",
  );
  assert.equal(visible.getAttribute("data-capture-stage"), "true");
});

test("retained paint is updating and capture-ineligible until the swap", () => {
  assert.equal(retainedAdaptiveCanvasStatus({
    canvasStatus: "ready",
    renderedVisualKey: "frame-1-k1",
    requestedVisualKey: "frame-2-k1",
  }), "updating");
  const values = new Map<string, string>();
  const target = {
    removeAttribute: (name: string) => values.delete(name),
    setAttribute: (name: string, value: string) => values.set(name, value),
  };
  applyAdaptiveCanvasPresentationStatus(target, {
    captureReady: true,
    status: "updating",
  });
  assert.deepEqual(Object.fromEntries(values), {
    "data-render-state": "updating",
  });
});

test("a 2x allocation failure has a named k1 fallback and is never silent", () => {
  const resolution = selectAdaptiveCanvasResolution({
    authoredStage: {width: 800, height: 600},
    cssStage: {width: 800, height: 600},
    devicePixelRatio: 2,
  });
  const fallback = createK1CanvasAllocationFallback(resolution);
  assert.equal(fallback.renderScale, 1);
  assert.deepEqual(fallback.backingStage, {width: 800, height: 600});
  assert.equal(fallback.status, "fallback-k1");

  const failingCanvas = new FakeCanvas();
  Object.defineProperty(failingCanvas, "width", {
    get: () => 300,
    set: () => {
      throw new Error("allocation denied");
    },
  });
  assert.throws(
    () => prepareAdaptiveCanvasStaging(asCanvas(failingCanvas), resolution),
    (error: unknown) =>
      error instanceof CanvasPresentationAllocationError &&
      /2x/.test(error.message),
  );

  const staging = new FakeCanvas();
  prepareAdaptiveCanvasStaging(asCanvas(staging), resolution);
  const visible = new FakeCanvas();
  visible.context.drawImage = () => {
    throw new Error("GPU copy denied");
  };
  assert.throws(
    () => presentVerifiedAdaptiveCanvas(
      asCanvas(visible),
      asCanvas(staging),
      resolution,
      true,
    ),
    (error: unknown) =>
      error instanceof CanvasPresentationAllocationError &&
      /presentation failed at 2x/.test(error.message),
  );
  assert.equal(visible.getAttribute("data-capture-stage"), null);
});

test("latest-request coordination never presents a superseded frame", async () => {
  let resolveReady!: (value: "asset") => void;
  const ready = new Promise<"asset">((resolve) => {
    resolveReady = resolve;
  });
  const coordinator = createLatestAdaptiveCanvasRenderCoordinator<
    {frame: number},
    "asset"
  >();
  const rendered: number[] = [];
  coordinator.enqueue({frame: 1});
  const first = coordinator.run(() => ready, (request) => {
    rendered.push(request.frame);
  });
  coordinator.enqueue({frame: 2});
  const second = coordinator.run(async () => "asset", (request) => {
    rendered.push(request.frame);
  });
  assert.equal(second.started, false);
  resolveReady("asset");
  assert.deepEqual(await first.completion, {frame: 2});
  assert.deepEqual(rendered, [2]);
});

test("shared exceptional presenter keys k1 retry to the request that actually failed", async () => {
  const source = await readFile(
    new URL("../src/use-adaptive-canvas-presenter.ts", import.meta.url),
    "utf8",
  );
  assert.match(source, /attemptedPresentation = latest/);
  assert.match(source, /failedPresentation\.resolution\.renderScale === 2/);
  assert.match(source, /failedPresentation\.asset\.resolution !== undefined/);
  assert.match(source, /stagingCanvasRef\.current = null/);
  assert.match(source, /selectionKey: failedPresentation\.selectionKey/);
  assert.match(source, /captureReady: false/);
});
