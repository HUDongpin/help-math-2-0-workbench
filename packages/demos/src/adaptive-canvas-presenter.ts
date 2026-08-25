"use client";

import type {
  AdaptiveCanvasResolutionSelection,
  AdaptiveCanvasResolutionV1,
  CanvasRenderRequest,
} from "./adaptive-canvas-resolution";
import {assertExactCanvasBackingDimensions} from "./adaptive-canvas-resolution";

export type AdaptiveCanvasPresentationStatus =
  | "idle"
  | "loading"
  | "updating"
  | "ready"
  | "error";

export interface AdaptiveCanvasAssetDescriptor {
  readonly animationId: string;
  readonly assetPath: string;
  readonly assetSha256?: string;
  readonly resolution?: Readonly<AdaptiveCanvasResolutionV1>;
  readonly sourceBitmapResolutionBound?: boolean;
}

export interface AdaptiveCanvasPageAssetBinding
  extends AdaptiveCanvasAssetDescriptor {
  readonly pageRenderer: true;
}

export interface AdaptiveCanvasRendererBindingProps {
  /**
   * Production integration supplies the generated hash-bound binding here.
   * Its absence is deliberate compatibility behavior: the historical runtime
   * stays at 1x and never has adaptive support inferred by the host.
   */
  readonly adaptiveCanvasBinding?: AdaptiveCanvasPageAssetBinding;
}

function sameAdaptiveCanvasResolution(
  left: Readonly<AdaptiveCanvasResolutionV1> | undefined,
  right: Readonly<AdaptiveCanvasResolutionV1> | undefined,
) {
  if (left === undefined || right === undefined) return left === right;
  return left.schemaVersion === right.schemaVersion &&
    left.mode === right.mode &&
    left.nativeWidth === right.nativeWidth &&
    left.nativeHeight === right.nativeHeight &&
    left.supportedRenderScales.length ===
      right.supportedRenderScales.length &&
    left.supportedRenderScales.every(
      (scale, index) => scale === right.supportedRenderScales[index],
    );
}

function sameAdaptiveCanvasPageBinding(
  left: AdaptiveCanvasPageAssetBinding,
  right: AdaptiveCanvasPageAssetBinding,
) {
  return left.pageRenderer === right.pageRenderer &&
    left.animationId === right.animationId &&
    left.assetPath === right.assetPath &&
    left.assetSha256 === right.assetSha256 &&
    left.sourceBitmapResolutionBound ===
      right.sourceBitmapResolutionBound &&
    sameAdaptiveCanvasResolution(left.resolution, right.resolution);
}

export function resolveAdaptiveCanvasPageAsset({
  animationId,
  explicitBinding,
  legacyAsset,
  productionBinding,
}: Readonly<{
  animationId: string;
  explicitBinding?: AdaptiveCanvasPageAssetBinding;
  legacyAsset: AdaptiveCanvasAssetDescriptor;
  productionBinding:
    | (AdaptiveCanvasAssetDescriptor & {readonly pageRenderer: boolean})
    | null;
}>): AdaptiveCanvasAssetDescriptor {
  if (productionBinding && productionBinding.pageRenderer !== true) {
    throw new Error(
      `${animationId}: generated adaptive binding is not a page renderer`,
    );
  }
  const selected = productionBinding ?? explicitBinding ?? legacyAsset;
  const expectedPath =
    `/flash-assets/courses/${animationId}/canvas-renderer.js`;
  invariant(
    selected.animationId === animationId,
    `${animationId}: adaptive binding animationId mismatch`,
  );
  invariant(
    selected.assetPath === expectedPath,
    `${animationId}: adaptive binding assetPath mismatch`,
  );
  // Also fail immediately on a missing/invalid adaptive digest rather than
  // waiting for a browser effect to attempt loading the runtime.
  buildAdaptiveCanvasAssetRequest(selected);
  if (productionBinding && explicitBinding) {
    invariant(
      sameAdaptiveCanvasPageBinding(
        explicitBinding,
        productionBinding as AdaptiveCanvasPageAssetBinding,
      ),
      `${animationId}: explicit adaptive binding does not match the active production binding`,
    );
  }
  return selected;
}

export interface AdaptiveCanvasAsset<
  TRequest extends CanvasRenderRequest = CanvasRenderRequest,
> {
  readonly metadata?: Readonly<{
    readonly resolution?: Readonly<AdaptiveCanvasResolutionV1>;
  }>;
  readonly ready: () => Promise<void>;
  readonly render: (
    canvas: HTMLCanvasElement,
    request: TRequest,
  ) => unknown;
}

export interface AdaptiveCanvasAssetRequest {
  readonly key: string;
  readonly src: string;
  readonly integrity: string | null;
  readonly crossOrigin: "anonymous" | null;
}

export interface CanvasCapturePresentationTarget {
  readonly removeAttribute: (name: string) => void;
  readonly setAttribute: (name: string, value: string) => void;
}

export interface AdaptiveCanvasCaptureIdentity {
  readonly entryStateSha256?: string;
  readonly frame: number;
  readonly frameDomain: string;
  readonly lang: "en" | "es";
  readonly requirementId?: string;
  readonly rootFrame: number;
  readonly scenario: string;
  readonly seed: number;
  readonly traceId?: string;
}

export class CanvasPresentationAllocationError extends Error {
  readonly code = "canvas-allocation-or-context-failure" as const;

  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "CanvasPresentationAllocationError";
  }
}

export interface ExactCanvasRegistryScriptRequest {
  readonly key: string;
  readonly src: string;
  readonly integrity: string | null;
  readonly crossOrigin: "anonymous" | null;
}

export interface ExactCanvasRegistryScriptLoaderOptions<TAsset> {
  readonly request: ExactCanvasRegistryScriptRequest;
  readonly registryKey: string;
  readonly assetSha256: string | null;
  readonly markerAttribute:
    | "data-help-math-canvas-asset"
    | "data-help-math-loaded-swf-host";
  readonly markerDatasetKey:
    | "helpMathCanvasAsset"
    | "helpMathLoadedSwfHost";
  readonly registeredAsset: () => TAsset | undefined;
}

interface ExactCanvasRegistryScriptBinding {
  readonly loaderKey: string;
  readonly asset: unknown;
}

const exactCanvasAssetPromises = new Map<string, Promise<unknown>>();
const exactCanvasRegistryKeyLoads = new Map<string, string>();
const exactCanvasScriptBindings = new WeakMap<
  HTMLScriptElement,
  ExactCanvasRegistryScriptBinding
>();

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function isLowerSha256(value: unknown): value is string {
  return typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
}

function sha256HexToIntegrity(sha256Hex: string) {
  let binary = "";
  for (let index = 0; index < sha256Hex.length; index += 2) {
    binary += String.fromCharCode(
      Number.parseInt(sha256Hex.slice(index, index + 2), 16),
    );
  }
  return `sha256-${btoa(binary)}`;
}

function canvasRegistry() {
  return (
    globalThis as typeof globalThis & {
      HELP_MATH_CANVAS_ASSETS?: Record<
        string,
        AdaptiveCanvasAsset<CanvasRenderRequest>
      >;
    }
  ).HELP_MATH_CANVAS_ASSETS;
}

function exactScriptBindingMatches(
  script: HTMLScriptElement,
  request: ExactCanvasRegistryScriptRequest,
  expectedAbsoluteSource: string,
) {
  return script.src === expectedAbsoluteSource &&
    script.integrity === (request.integrity ?? "") &&
    script.crossOrigin === request.crossOrigin;
}

/**
 * Loads one exact registry script and binds the object registered by that
 * execution to the script request key. The global registry is only a handoff
 * channel during `load`; it is never used later to infer that an older script
 * still represents the currently registered object.
 */
export function loadExactCanvasRegistryScript<TAsset>(
  options: ExactCanvasRegistryScriptLoaderOptions<TAsset>,
): Promise<TAsset> {
  const {
    assetSha256,
    markerAttribute,
    markerDatasetKey,
    registeredAsset,
    registryKey,
    request,
  } = options;
  invariant(
    /^course-[a-z0-9-]+$/.test(registryKey),
    "Canvas registry key is invalid",
  );
  invariant(
    assetSha256 === null || isLowerSha256(assetSha256),
    "Canvas registry script SHA-256 is invalid",
  );
  const loaderKey = `${markerAttribute}:${request.key}`;
  const digestSelector = assetSha256
    ? `[data-help-math-canvas-sha256="${assetSha256}"]`
    : "";
  const selector =
    `script[${markerAttribute}="${registryKey}"]${digestSelector}`;
  const existing = document.querySelector<HTMLScriptElement>(selector);
  const expectedAbsoluteSource = new URL(request.src, document.baseURI).href;
  if (
    existing &&
    !exactScriptBindingMatches(existing, request, expectedAbsoluteSource)
  ) {
    return Promise.reject(
      new Error("Existing Canvas asset has a mismatched integrity binding"),
    );
  }

  const cached = exactCanvasAssetPromises.get(loaderKey);
  if (cached) return cached as Promise<TAsset>;

  if (existing) {
    const binding = exactCanvasScriptBindings.get(existing);
    if (binding?.loaderKey === loaderKey) {
      const resolved = Promise.resolve(binding.asset as TAsset);
      exactCanvasAssetPromises.set(loaderKey, resolved);
      return resolved;
    }
    return Promise.reject(
      new Error(
        "Existing Canvas asset script has no exact request-key object binding",
      ),
    );
  }

  const pendingLoaderKey = exactCanvasRegistryKeyLoads.get(registryKey);
  if (pendingLoaderKey && pendingLoaderKey !== loaderKey) {
    return Promise.reject(
      new Error(
        "A different exact Canvas request is already loading this registry key",
      ),
    );
  }
  exactCanvasRegistryKeyLoads.set(registryKey, loaderKey);

  const registeredBeforeLoad = registeredAsset();
  let createdScript: HTMLScriptElement | null = null;
  const promise = new Promise<TAsset>((resolve, reject) => {
    const script = document.createElement("script");
    createdScript = script;
    const rejectAndRemove = (error: Error) => {
      script.remove();
      reject(error);
    };
    script.onload = () => {
      if (
        !exactScriptBindingMatches(script, request, expectedAbsoluteSource) ||
        script.dataset[markerDatasetKey] !== registryKey ||
        (assetSha256 !== null &&
          script.dataset.helpMathCanvasSha256 !== assetSha256)
      ) {
        rejectAndRemove(
          new Error("Canvas asset script request binding changed during load"),
        );
        return;
      }
      const asset = registeredAsset();
      if (!asset) {
        rejectAndRemove(
          new Error("Canvas asset did not register the expected ID"),
        );
        return;
      }
      if (registeredBeforeLoad && asset === registeredBeforeLoad) {
        rejectAndRemove(
          new Error(
            "Canvas asset load did not register a new exact request-key object",
          ),
        );
        return;
      }
      exactCanvasScriptBindings.set(script, {asset, loaderKey});
      resolve(asset);
    };
    script.onerror = () =>
      rejectAndRemove(new Error("The local Canvas asset could not be loaded"));
    script.async = true;
    script.dataset[markerDatasetKey] = registryKey;
    if (assetSha256) {
      script.dataset.helpMathCanvasSha256 = assetSha256;
    }
    if (request.integrity) script.integrity = request.integrity;
    if (request.crossOrigin) script.crossOrigin = request.crossOrigin;
    script.src = request.src;
    document.head.appendChild(script);
  }).catch((error) => {
    exactCanvasAssetPromises.delete(loaderKey);
    if (createdScript?.isConnected) createdScript.remove();
    throw error;
  });
  exactCanvasAssetPromises.set(loaderKey, promise);
  const clearPendingRegistryKey = () => {
    if (exactCanvasRegistryKeyLoads.get(registryKey) === loaderKey) {
      exactCanvasRegistryKeyLoads.delete(registryKey);
    }
  };
  void promise.then(clearPendingRegistryKey, clearPendingRegistryKey);
  return promise;
}

export function buildAdaptiveCanvasAssetRequest(
  descriptor: AdaptiveCanvasAssetDescriptor,
): AdaptiveCanvasAssetRequest {
  invariant(
    /^course-[a-z0-9-]+$/.test(descriptor.animationId),
    "Canvas asset animationId is invalid",
  );
  invariant(
    descriptor.assetPath.startsWith("/flash-assets/") &&
      !descriptor.assetPath.includes("..") &&
      !descriptor.assetPath.includes("?"),
    "Canvas asset path must be a query-free local flash-assets path",
  );
  invariant(
    descriptor.assetSha256 === undefined ||
      isLowerSha256(descriptor.assetSha256),
    "Canvas asset SHA-256 is invalid",
  );
  invariant(
    descriptor.resolution === undefined ||
      descriptor.assetSha256 !== undefined,
    "An adaptive Canvas asset requires an exact SHA-256 binding",
  );
  if (descriptor.resolution) {
    invariant(
      descriptor.resolution.schemaVersion === 1 &&
        descriptor.resolution.mode === "adaptive-integer" &&
        Number.isSafeInteger(descriptor.resolution.nativeWidth) &&
        descriptor.resolution.nativeWidth > 0 &&
        Number.isSafeInteger(descriptor.resolution.nativeHeight) &&
        descriptor.resolution.nativeHeight > 0 &&
        descriptor.resolution.supportedRenderScales.length === 2 &&
        descriptor.resolution.supportedRenderScales[0] === 1 &&
        descriptor.resolution.supportedRenderScales[1] === 2,
      "Canvas asset adaptive resolution metadata is invalid",
    );
  }
  invariant(
    descriptor.sourceBitmapResolutionBound === undefined ||
      typeof descriptor.sourceBitmapResolutionBound === "boolean",
    "Canvas asset bitmap resolution boundary must be boolean",
  );

  const digest = descriptor.assetSha256 ?? null;
  const adaptiveSource = descriptor.resolution && digest
    ? `/flash-assets/by-sha256/${digest}/${descriptor.assetPath.slice(
        "/flash-assets/".length,
      )}`
    : null;
  return Object.freeze({
    key:
      `${descriptor.animationId}:${digest ?? "unbound"}:` +
      descriptor.assetPath,
    src: adaptiveSource ?? (digest
      ? `${descriptor.assetPath}?sha256=${digest}`
      : descriptor.assetPath),
    integrity: digest ? sha256HexToIntegrity(digest) : null,
    crossOrigin: digest ? "anonymous" : null,
  });
}

/**
 * Loads one exact Canvas runtime. Adaptive assets always use the digest in the
 * URL and SRI; a previously registered runtime is reused only when its script
 * element proves the same URL and integrity binding.
 */
export function loadAdaptiveCanvasAsset<
  TRequest extends CanvasRenderRequest = CanvasRenderRequest,
>(
  descriptor: AdaptiveCanvasAssetDescriptor,
): Promise<AdaptiveCanvasAsset<TRequest>> {
  const request = buildAdaptiveCanvasAssetRequest(descriptor);
  return loadExactCanvasRegistryScript<AdaptiveCanvasAsset<TRequest>>({
    assetSha256: descriptor.assetSha256 ?? null,
    markerAttribute: "data-help-math-canvas-asset",
    markerDatasetKey: "helpMathCanvasAsset",
    registeredAsset: () =>
      canvasRegistry()?.[descriptor.animationId] as
        | AdaptiveCanvasAsset<TRequest>
        | undefined,
    registryKey: descriptor.animationId,
    request,
  });
}

/** Historical runtimes without exact resolution metadata remain fixed at 1x. */
export function verifyAdaptiveCanvasAssetResolution(
  asset: object,
  expected: Readonly<AdaptiveCanvasResolutionV1> | undefined,
) {
  if (!expected) return;
  const observed = (asset as Readonly<{
    readonly metadata?: Readonly<{
      readonly resolution?: Readonly<AdaptiveCanvasResolutionV1>;
    }>;
  }>).metadata?.resolution;
  invariant(
    observed?.schemaVersion === expected.schemaVersion &&
      observed.mode === expected.mode &&
      observed.nativeWidth === expected.nativeWidth &&
      observed.nativeHeight === expected.nativeHeight &&
      observed.supportedRenderScales.length === 2 &&
      observed.supportedRenderScales[0] === 1 &&
      observed.supportedRenderScales[1] === 2,
    "Canvas asset did not declare the expected adaptive resolution contract",
  );
}

export function stampAdaptiveCanvasCaptureIdentity(
  canvas: HTMLCanvasElement,
  identity: AdaptiveCanvasCaptureIdentity,
) {
  const values: Readonly<Record<string, string | null>> = {
    "data-flash-entry-state-sha256": identity.entryStateSha256 || null,
    "data-flash-frame": String(identity.frame),
    "data-flash-frame-domain": identity.frameDomain,
    "data-flash-lang": identity.lang,
    "data-flash-requirement-id": identity.requirementId || null,
    "data-flash-root-frame": String(identity.rootFrame),
    "data-flash-scenario": identity.scenario,
    "data-flash-seed": String(identity.seed),
    "data-flash-trace-id": identity.traceId || null,
    "data-runtime-language": identity.lang,
    "data-runtime-scenario": identity.scenario,
    "data-runtime-seed": String(identity.seed),
  };
  for (const [name, value] of Object.entries(values)) {
    if (value === null) canvas.removeAttribute(name);
    else canvas.setAttribute(name, value);
  }
}

export function isCanvasPresentationAllocationError(
  error: unknown,
): error is CanvasPresentationAllocationError {
  return error instanceof CanvasPresentationAllocationError;
}

export function prepareAdaptiveCanvasStaging(
  canvas: HTMLCanvasElement,
  resolution: AdaptiveCanvasResolutionSelection,
) {
  for (const attribute of [...canvas.attributes]) {
    if (attribute.name.startsWith("data-")) {
      canvas.removeAttribute(attribute.name);
    }
  }
  try {
    canvas.width = resolution.backingStage.width;
    canvas.height = resolution.backingStage.height;
    assertExactCanvasBackingDimensions(resolution, {
      width: canvas.width,
      height: canvas.height,
    });
  } catch (error) {
    throw new CanvasPresentationAllocationError(
      `Canvas backing allocation failed at ${resolution.renderScale}x`,
      {cause: error},
    );
  }
  let context: CanvasRenderingContext2D | null;
  try {
    context = canvas.getContext("2d");
  } catch (error) {
    throw new CanvasPresentationAllocationError(
      `Canvas 2D staging context failed at ${resolution.renderScale}x`,
      {cause: error},
    );
  }
  if (!context) {
    throw new CanvasPresentationAllocationError(
      `Canvas 2D staging context is unavailable at ${resolution.renderScale}x`,
    );
  }
}

/**
 * Keeps the imperative bitmap and capture-readiness attributes in one DOM
 * transition. Pending retained paint is visible but never capture-ready.
 */
export function applyAdaptiveCanvasPresentationStatus(
  target: CanvasCapturePresentationTarget,
  {
    captureReady,
    status,
  }: Readonly<{
    captureReady: boolean;
    status: AdaptiveCanvasPresentationStatus;
  }>,
) {
  const visualReady = status === "ready";
  target.setAttribute("data-render-state", status);
  if (visualReady) {
    target.setAttribute("data-render-visual", "true");
  } else {
    target.removeAttribute("data-render-visual");
  }
  if (visualReady && captureReady) {
    target.setAttribute("data-capture-stage", "true");
  } else {
    target.removeAttribute("data-capture-stage");
  }
}

/**
 * Copies a verified hidden backing surface to the stable connected Canvas in
 * one synchronous task. No asynchronous work occurs after visible resize.
 */
export function presentVerifiedAdaptiveCanvas(
  visibleCanvas: HTMLCanvasElement,
  stagingCanvas: HTMLCanvasElement,
  resolution: AdaptiveCanvasResolutionSelection,
  captureReady: boolean,
) {
  assertExactCanvasBackingDimensions(resolution, {
    width: stagingCanvas.width,
    height: stagingCanvas.height,
  });
  let context: CanvasRenderingContext2D | null;
  try {
    context = visibleCanvas.getContext("2d");
    if (!context) {
      throw new CanvasPresentationAllocationError(
        `Visible Canvas 2D context is unavailable at ${resolution.renderScale}x`,
      );
    }
    if (
      visibleCanvas.width !== stagingCanvas.width ||
      visibleCanvas.height !== stagingCanvas.height
    ) {
      visibleCanvas.width = stagingCanvas.width;
      visibleCanvas.height = stagingCanvas.height;
    }
    assertExactCanvasBackingDimensions(resolution, {
      width: visibleCanvas.width,
      height: visibleCanvas.height,
    });
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.globalAlpha = 1;
    context.globalCompositeOperation = "copy";
    context.drawImage(stagingCanvas, 0, 0);
    context.globalCompositeOperation = "source-over";
  } catch (error) {
    if (error instanceof CanvasPresentationAllocationError) throw error;
    throw new CanvasPresentationAllocationError(
      `Visible Canvas allocation or presentation failed at ${resolution.renderScale}x`,
      {cause: error},
    );
  }

  for (const attribute of [...visibleCanvas.attributes]) {
    if (
      attribute.name.startsWith("data-flash-") ||
      attribute.name.startsWith("data-runtime-") ||
      attribute.name.startsWith("data-visual-") ||
      attribute.name.startsWith("data-audio-")
    ) {
      visibleCanvas.removeAttribute(attribute.name);
    }
  }
  for (const attribute of [...stagingCanvas.attributes]) {
    if (attribute.name.startsWith("data-")) {
      visibleCanvas.setAttribute(attribute.name, attribute.value);
    }
  }
  visibleCanvas.setAttribute(
    "data-render-scale",
    String(resolution.renderScale),
  );
  visibleCanvas.setAttribute(
    "data-canvas-backing-width",
    String(visibleCanvas.width),
  );
  visibleCanvas.setAttribute(
    "data-canvas-backing-height",
    String(visibleCanvas.height),
  );
  visibleCanvas.setAttribute("data-resolution-status", resolution.status);
  visibleCanvas.setAttribute(
    "data-resolution-ceiling-reached",
    String(resolution.demandCapped),
  );
  applyAdaptiveCanvasPresentationStatus(visibleCanvas, {
    captureReady,
    status: "ready",
  });
}

export interface LatestAdaptiveCanvasRenderRun<TRequest> {
  readonly started: boolean;
  readonly completion: Promise<TRequest | null>;
}

export interface LatestAdaptiveCanvasRenderCoordinator<TRequest, TPrepared> {
  readonly enqueue: (request: TRequest) => void;
  readonly run: (
    prepare: () => Promise<TPrepared>,
    render: (request: TRequest, prepared: TPrepared) => void,
  ) => LatestAdaptiveCanvasRenderRun<TRequest>;
  readonly cancel: () => void;
}

export function createLatestAdaptiveCanvasRenderCoordinator<
  TRequest,
  TPrepared,
>(): LatestAdaptiveCanvasRenderCoordinator<TRequest, TPrepared> {
  let generation = 0;
  let latestRequest: TRequest | null = null;
  let activeCompletion: Promise<TRequest | null> | null = null;
  return Object.freeze({
    enqueue(request: TRequest) {
      latestRequest = request;
    },
    run(
      prepare: () => Promise<TPrepared>,
      render: (request: TRequest, prepared: TPrepared) => void,
    ) {
      if (activeCompletion) {
        return Object.freeze({
          started: false,
          completion: activeCompletion,
        });
      }
      const runGeneration = generation;
      const completion = (async () => {
        try {
          const prepared = await prepare();
          if (generation !== runGeneration) return null;
          const request = latestRequest;
          if (request === null) return null;
          render(request, prepared);
          return request;
        } catch (error) {
          if (generation !== runGeneration) return null;
          throw error;
        }
      })();
      activeCompletion = completion;
      const clearActive = () => {
        if (activeCompletion === completion) activeCompletion = null;
      };
      void completion.then(clearActive, clearActive);
      return Object.freeze({started: true, completion});
    },
    cancel() {
      generation += 1;
      latestRequest = null;
      activeCompletion = null;
    },
  });
}

export function retainedAdaptiveCanvasStatus({
  canvasStatus,
  renderedVisualKey,
  requestedVisualKey,
}: Readonly<{
  canvasStatus: AdaptiveCanvasPresentationStatus;
  renderedVisualKey: string | null;
  requestedVisualKey: string;
}>): AdaptiveCanvasPresentationStatus {
  return canvasStatus === "ready" && renderedVisualKey !== requestedVisualKey
    ? "updating"
    : canvasStatus;
}
