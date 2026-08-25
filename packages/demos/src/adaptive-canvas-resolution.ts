export const ADAPTIVE_CANVAS_RESOLUTION_SCHEMA_VERSION = 1 as const;
export const MAX_CANVAS_RENDER_SCALE = 2 as const;
export const SUPPORTED_CANVAS_RENDER_SCALES = [1, 2] as const;

export type CanvasRenderScale =
  (typeof SUPPORTED_CANVAS_RENDER_SCALES)[number];

export type AdaptiveCanvasResolutionStatus =
  | "native"
  | "retina"
  | "capped"
  | "fallback-k1"
  | "source-bitmap-bound";

export interface CanvasDimensions {
  readonly width: number;
  readonly height: number;
}

export interface CanvasRenderRequest {
  readonly frame: number;
  readonly scenario: string;
  readonly lang: "en" | "es";
  readonly seed: number;
  readonly renderScale: CanvasRenderScale;
  readonly behaviorCompositeContractId?: string;
  readonly behaviorCompositeState?: string;
}

/**
 * The educational state of a render request. Resolution is presentation state,
 * so renderScale is deliberately absent from this identity.
 */
export type CanvasTeachingIdentity = Omit<CanvasRenderRequest, "renderScale">;

export interface SelectAdaptiveCanvasResolutionInput {
  /** Integer coordinate space used by the Canvas renderer. */
  readonly authoredStage: CanvasDimensions;
  /** Current CSS content-box size. Missing or invalid measurements fail safe. */
  readonly cssStage?: CanvasDimensions | null;
  /** Current browser DPR. Missing or invalid measurements fail safe. */
  readonly devicePixelRatio?: number | null;
  /** True when source bitmap detail, rather than backing density, is the limit. */
  readonly sourceBitmapBound?: boolean;
}

/**
 * Asset metadata contract. Renderers without this exact declaration remain
 * fixed at 1x; the host must never infer adaptive support from dimensions.
 */
export interface AdaptiveCanvasResolutionV1 {
  readonly schemaVersion: typeof ADAPTIVE_CANVAS_RESOLUTION_SCHEMA_VERSION;
  readonly mode: "adaptive-integer";
  readonly nativeWidth: number;
  readonly nativeHeight: number;
  readonly supportedRenderScales: typeof SUPPORTED_CANVAS_RENDER_SCALES;
}

export interface AdaptiveCanvasResolutionSelection
  extends AdaptiveCanvasResolutionV1 {
  readonly cssStage: CanvasDimensions | null;
  readonly devicePixelRatio: number | null;
  readonly maxRenderScale: typeof MAX_CANVAS_RENDER_SCALE;
  readonly renderScale: CanvasRenderScale;
  readonly backingStage: CanvasDimensions;
  /** Physical-pixel demand relative to the authored coordinate space. */
  readonly demand: number | null;
  /** Math.ceil(demand), before the 2x product ceiling is applied. */
  readonly requestedRenderScale: number;
  readonly status: AdaptiveCanvasResolutionStatus;
  /** The device reports a DPR above the supported 2x product ceiling. */
  readonly dprCeilingExceeded: boolean;
  /** The computed physical-pixel demand, not merely DPR, required over 2x. */
  readonly demandCapped: boolean;
  readonly sourceBitmapBound: boolean;
}

export type CanvasBackingValidationReason =
  | "exact"
  | "invalid-backing-dimensions"
  | "width-mismatch"
  | "height-mismatch"
  | "width-and-height-mismatch";

export interface CanvasBackingValidation {
  readonly exact: boolean;
  readonly expected: CanvasDimensions;
  readonly actual: CanvasDimensions | null;
  readonly reason: CanvasBackingValidationReason;
}

function isPositiveFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function isPositiveSafeInteger(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value > 0
  );
}

function assertAuthoredStage(stage: CanvasDimensions): void {
  if (
    !stage ||
    !isPositiveSafeInteger(stage.width) ||
    !isPositiveSafeInteger(stage.height)
  ) {
    throw new RangeError(
      "authoredStage width and height must be positive safe integers",
    );
  }
  if (
    stage.width > Number.MAX_SAFE_INTEGER / MAX_CANVAS_RENDER_SCALE ||
    stage.height > Number.MAX_SAFE_INTEGER / MAX_CANVAS_RENDER_SCALE
  ) {
    throw new RangeError(
      "authoredStage must remain a safe integer at the 2x backing size",
    );
  }
}

function copyDimensions(stage: CanvasDimensions): CanvasDimensions {
  return {height: stage.height, width: stage.width};
}

function isValidCssStage(
  stage: CanvasDimensions | null | undefined,
): stage is CanvasDimensions {
  return Boolean(
    stage &&
      isPositiveFiniteNumber(stage.width) &&
      isPositiveFiniteNumber(stage.height),
  );
}

function isCanvasRenderScale(value: unknown): value is CanvasRenderScale {
  return value === 1 || value === 2;
}

function backingStageFor(
  authoredStage: CanvasDimensions,
  renderScale: CanvasRenderScale,
): CanvasDimensions {
  return {
    height: authoredStage.height * renderScale,
    width: authoredStage.width * renderScale,
  };
}

/**
 * Selects a single 1x/2x backing scale without reading browser globals.
 *
 * Invalid authored dimensions are programmer errors and throw. A missing or
 * transiently invalid CSS/DPR measurement is expected during SSR and layout,
 * so it returns a deterministic `fallback-k1` result instead.
 */
export function selectAdaptiveCanvasResolution(
  input: SelectAdaptiveCanvasResolutionInput,
): AdaptiveCanvasResolutionSelection {
  assertAuthoredStage(input.authoredStage);
  if (
    input.sourceBitmapBound !== undefined &&
    typeof input.sourceBitmapBound !== "boolean"
  ) {
    throw new TypeError("sourceBitmapBound must be a boolean when provided");
  }

  const authoredStage = copyDimensions(input.authoredStage);
  const sourceBitmapBound = input.sourceBitmapBound === true;
  const validCssStage = isValidCssStage(input.cssStage);
  const validDpr = isPositiveFiniteNumber(input.devicePixelRatio);
  const normalizedDpr = validDpr ? input.devicePixelRatio : null;
  const dprCeilingExceeded =
    normalizedDpr !== null && normalizedDpr > MAX_CANVAS_RENDER_SCALE;

  if (!validCssStage || !validDpr) {
    return {
      schemaVersion: ADAPTIVE_CANVAS_RESOLUTION_SCHEMA_VERSION,
      mode: "adaptive-integer",
      nativeWidth: authoredStage.width,
      nativeHeight: authoredStage.height,
      cssStage: null,
      devicePixelRatio: normalizedDpr,
      supportedRenderScales: SUPPORTED_CANVAS_RENDER_SCALES,
      maxRenderScale: MAX_CANVAS_RENDER_SCALE,
      renderScale: 1,
      backingStage: backingStageFor(authoredStage, 1),
      demand: null,
      requestedRenderScale: 1,
      status: "fallback-k1",
      dprCeilingExceeded,
      demandCapped: false,
      sourceBitmapBound,
    };
  }

  const cssStage = copyDimensions(input.cssStage);
  const demand = Math.max(
    (cssStage.width * input.devicePixelRatio) / authoredStage.width,
    (cssStage.height * input.devicePixelRatio) / authoredStage.height,
  );
  const requestedRenderScale = Math.max(1, Math.ceil(demand));
  const demandCapped = requestedRenderScale > MAX_CANVAS_RENDER_SCALE;
  const renderScale: CanvasRenderScale = demandCapped
    ? MAX_CANVAS_RENDER_SCALE
    : requestedRenderScale === 2
      ? 2
      : 1;

  let status: AdaptiveCanvasResolutionStatus;
  if (sourceBitmapBound) {
    status = "source-bitmap-bound";
  } else if (demandCapped) {
    status = "capped";
  } else if (renderScale === 2) {
    status = "retina";
  } else {
    status = "native";
  }

  return {
    schemaVersion: ADAPTIVE_CANVAS_RESOLUTION_SCHEMA_VERSION,
    mode: "adaptive-integer",
    nativeWidth: authoredStage.width,
    nativeHeight: authoredStage.height,
    cssStage,
    devicePixelRatio: input.devicePixelRatio,
    supportedRenderScales: SUPPORTED_CANVAS_RENDER_SCALES,
    maxRenderScale: MAX_CANVAS_RENDER_SCALE,
    renderScale,
    backingStage: backingStageFor(authoredStage, renderScale),
    demand,
    requestedRenderScale,
    status,
    dprCeilingExceeded,
    demandCapped,
    sourceBitmapBound,
  };
}

export function validateCanvasRenderRequest(
  request: CanvasRenderRequest,
): CanvasRenderRequest {
  if (!Number.isSafeInteger(request.frame) || request.frame < 1) {
    throw new RangeError("frame must be a positive safe integer");
  }
  if (typeof request.scenario !== "string" || request.scenario.length === 0) {
    throw new TypeError("scenario must be a non-empty string");
  }
  if (request.lang !== "en" && request.lang !== "es") {
    throw new TypeError('lang must be exactly "en" or "es"');
  }
  if (!Number.isSafeInteger(request.seed)) {
    throw new RangeError("seed must be a safe integer");
  }
  if (!isCanvasRenderScale(request.renderScale)) {
    throw new RangeError("renderScale must be exactly 1 or 2");
  }
  return request;
}

export function canvasTeachingIdentity(
  request: CanvasRenderRequest,
): CanvasTeachingIdentity {
  validateCanvasRenderRequest(request);
  const {renderScale: _presentationOnly, ...teachingIdentity} = request;
  return teachingIdentity;
}

export function validateExactCanvasBackingDimensions(
  resolution: Pick<
    AdaptiveCanvasResolutionSelection,
    "nativeWidth" | "nativeHeight" | "renderScale"
  >,
  actualBackingStage: CanvasDimensions,
): CanvasBackingValidation {
  const authoredStage = {
    width: resolution.nativeWidth,
    height: resolution.nativeHeight,
  };
  assertAuthoredStage(authoredStage);
  if (!isCanvasRenderScale(resolution.renderScale)) {
    throw new RangeError("renderScale must be exactly 1 or 2");
  }

  const expected = backingStageFor(
    authoredStage,
    resolution.renderScale,
  );
  if (
    !actualBackingStage ||
    !isPositiveSafeInteger(actualBackingStage.width) ||
    !isPositiveSafeInteger(actualBackingStage.height)
  ) {
    return {
      exact: false,
      expected,
      actual: null,
      reason: "invalid-backing-dimensions",
    };
  }

  const actual = copyDimensions(actualBackingStage);
  const widthMatches = actual.width === expected.width;
  const heightMatches = actual.height === expected.height;
  const reason: CanvasBackingValidationReason =
    widthMatches && heightMatches
      ? "exact"
      : widthMatches
        ? "height-mismatch"
        : heightMatches
          ? "width-mismatch"
          : "width-and-height-mismatch";

  return {
    exact: widthMatches && heightMatches,
    expected,
    actual,
    reason,
  };
}

export function assertExactCanvasBackingDimensions(
  resolution: Pick<
    AdaptiveCanvasResolutionSelection,
    "nativeWidth" | "nativeHeight" | "renderScale"
  >,
  actualBackingStage: CanvasDimensions,
): void {
  const validation = validateExactCanvasBackingDimensions(
    resolution,
    actualBackingStage,
  );
  if (validation.exact) {
    return;
  }

  const actual = validation.actual
    ? `${validation.actual.width}x${validation.actual.height}`
    : "invalid";
  throw new RangeError(
    `Canvas backing store must be exactly ${validation.expected.width}x${validation.expected.height}; received ${actual}`,
  );
}
