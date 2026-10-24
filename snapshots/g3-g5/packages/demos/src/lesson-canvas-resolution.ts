export const LESSON_CANVAS_SUPPORTED_SCALES = Object.freeze([1, 2] as const);
export type LessonCanvasRenderScale = 1 | 2;

export interface LessonCanvasDimensions {
  readonly width: number;
  readonly height: number;
}

/** Only an adapter with this explicit contract may receive a scaled backing. */
export interface LessonCanvasResolutionMetadata {
  readonly schemaVersion: 1;
  readonly mode: "adaptive-integer";
  readonly nativeWidth: number;
  readonly nativeHeight: number;
  readonly supportedScales: readonly [1, 2];
}

export interface LessonCanvasResolutionOptions {
  readonly nativeStage: LessonCanvasDimensions;
  readonly enabled?: boolean;
  readonly metadata?: LessonCanvasResolutionMetadata;
  readonly sourceBitmapBound?: boolean;
}

export interface LessonCanvasResolution extends LessonCanvasResolutionOptions {
  readonly enabled: boolean;
  readonly cssStage: LessonCanvasDimensions | null;
  readonly devicePixelRatio: number | null;
  readonly demand: number | null;
  readonly renderScale: LessonCanvasRenderScale;
  readonly requestedRenderScale: number;
  readonly backingStage: LessonCanvasDimensions;
  readonly status: "disabled" | "native" | "retina" | "capped" |
    "measurement-fallback" | "allocation-fallback";
  readonly demandCapped: boolean;
  readonly sourceBitmapBound: boolean;
  /** Expensive drawing depends on this key, not on every CSS measurement. */
  readonly renderKey: string;
}

function positive(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function validDimensions(value: LessonCanvasDimensions | null | undefined) {
  return value && positive(value.width) && positive(value.height);
}

function assertNativeStage(stage: LessonCanvasDimensions): void {
  if (!validDimensions(stage) ||
    !Number.isSafeInteger(Math.ceil(stage.width * 2)) ||
    !Number.isSafeInteger(Math.ceil(stage.height * 2))) {
    throw new RangeError("nativeStage must have positive finite dimensions safe at 2x");
  }
}

export function assertLessonCanvasResolutionMetadata(
  value: unknown,
  nativeStage: LessonCanvasDimensions,
): asserts value is LessonCanvasResolutionMetadata {
  assertNativeStage(nativeStage);
  const metadata = value as Partial<LessonCanvasResolutionMetadata> | null;
  if (!metadata || metadata.schemaVersion !== 1 ||
    metadata.mode !== "adaptive-integer" ||
    metadata.nativeWidth !== nativeStage.width ||
    metadata.nativeHeight !== nativeStage.height ||
    !Array.isArray(metadata.supportedScales) ||
    metadata.supportedScales.length !== 2 ||
    metadata.supportedScales[0] !== 1 || metadata.supportedScales[1] !== 2) {
    throw new TypeError("Canvas adapter must declare exact native dimensions and supportedScales [1,2]");
  }
}

function backingStage(nativeStage: LessonCanvasDimensions, scale: LessonCanvasRenderScale) {
  // Keep fractional twip-derived coordinates; only the physical buffer is integer.
  return Object.freeze({
    width: Math.ceil(nativeStage.width * scale),
    height: Math.ceil(nativeStage.height * scale),
  });
}

function renderKey(nativeStage: LessonCanvasDimensions, scale: LessonCanvasRenderScale) {
  return `${nativeStage.width}x${nativeStage.height}@${scale}`;
}

export function selectLessonCanvasResolution(
  options: LessonCanvasResolutionOptions & {
    readonly cssStage?: LessonCanvasDimensions | null;
    readonly devicePixelRatio?: number | null;
  },
): LessonCanvasResolution {
  assertNativeStage(options.nativeStage);
  const enabled = options.enabled === true;
  if (options.enabled !== undefined && typeof options.enabled !== "boolean") {
    throw new TypeError("enabled must be a boolean");
  }
  if (options.sourceBitmapBound !== undefined && typeof options.sourceBitmapBound !== "boolean") {
    throw new TypeError("sourceBitmapBound must be a boolean");
  }
  if (enabled || options.metadata !== undefined) {
    assertLessonCanvasResolutionMetadata(options.metadata, options.nativeStage);
  }
  const nativeStage = Object.freeze({...options.nativeStage});
  const cssStage = validDimensions(options.cssStage) ? Object.freeze({...options.cssStage!}) : null;
  const devicePixelRatio = positive(options.devicePixelRatio) ? options.devicePixelRatio : null;
  const demand = cssStage && devicePixelRatio
    ? Math.max(cssStage.width * devicePixelRatio / nativeStage.width,
      cssStage.height * devicePixelRatio / nativeStage.height)
    : null;
  const validDemand = demand !== null && Number.isFinite(demand);
  const requestedRenderScale = enabled && validDemand ? Math.max(1, Math.ceil(demand)) : 1;
  const renderScale: LessonCanvasRenderScale = requestedRenderScale > 1 ? 2 : 1;
  const demandCapped = enabled && requestedRenderScale > 2;
  const status = !enabled ? "disabled" : !validDemand ? "measurement-fallback" :
    demandCapped ? "capped" : renderScale === 2 ? "retina" : "native";
  return Object.freeze({
    nativeStage, enabled, cssStage, devicePixelRatio,
    demand: validDemand ? demand : null,
    renderScale, requestedRenderScale,
    backingStage: backingStage(nativeStage, renderScale),
    status, demandCapped, sourceBitmapBound: options.sourceBitmapBound === true,
    renderKey: renderKey(nativeStage, renderScale),
  });
}

export interface LessonCanvasSurface {
  readonly canvas: HTMLCanvasElement;
  readonly context: CanvasRenderingContext2D;
  readonly resolution: LessonCanvasResolution;
  /** Releases this staging surface when it is replaced or unmounted. */
  readonly dispose: () => void;
}

function fallbackResolution(resolution: LessonCanvasResolution): LessonCanvasResolution {
  return Object.freeze({...resolution,
    renderScale: 1,
    backingStage: backingStage(resolution.nativeStage, 1),
    status: "allocation-fallback",
    renderKey: renderKey(resolution.nativeStage, 1),
  });
}

/** Allocates a separate staging surface; it never resizes a learner-visible canvas. */
export function allocateLessonCanvasSurface(
  resolution: LessonCanvasResolution,
  options: {readonly createCanvas?: () => HTMLCanvasElement} = {},
): LessonCanvasSurface {
  const createCanvas = options.createCanvas ?? (() => document.createElement("canvas"));
  function allocate(candidate: LessonCanvasResolution): LessonCanvasSurface {
    const canvas = createCanvas();
    try {
      canvas.width = candidate.backingStage.width;
      canvas.height = candidate.backingStage.height;
      if (canvas.width !== candidate.backingStage.width || canvas.height !== candidate.backingStage.height) {
        throw new Error("Canvas backing allocation did not retain exact dimensions");
      }
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas 2D context allocation failed");
      return {canvas, context, resolution: candidate, dispose: () => {
        canvas.width = 0;
        canvas.height = 0;
      }};
    } catch (error) {
      canvas.width = 0;
      canvas.height = 0;
      throw error;
    }
  }
  try {
    return allocate(resolution);
  } catch (error) {
    if (resolution.renderScale !== 2) throw error;
    return allocate(fallbackResolution(resolution));
  }
}
