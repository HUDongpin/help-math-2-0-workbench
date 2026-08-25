'use client';

import {useEffect, useLayoutEffect, useMemo, useRef, useState} from 'react';

import {
  assertExactCanvasBackingDimensions,
  type AdaptiveCanvasResolutionSelection,
  type AdaptiveCanvasResolutionV1,
  type CanvasRenderRequest,
  type CanvasRenderScale,
} from '../../../packages/demos/src/adaptive-canvas-resolution';
import {
  useAdaptiveCanvasResolution,
} from '../../../packages/demos/src/use-adaptive-canvas-resolution';
import {
  getAdaptiveLoadedSwfHostProductionBinding,
  type AdaptiveCanvasProductionBinding,
} from '../../../packages/demos/src/adaptive-canvas-production-bindings.generated';
import {
  loadExactCanvasRegistryScript,
} from '../../../packages/demos/src/adaptive-canvas-presenter';

const LOADED_SWF_HOST_STAGE = Object.freeze({height: 600, width: 800});
export const G4_L3_IR001_LOADED_SWF_HOST_LOGICAL_PATH =
  'courses/shell-course-g04-l03-index-local/host-composite-assets/course-g04-l03-ir-001-loaded-swf-canvas-renderer.js';
const G4_L3_IR001_LOADED_SWF_HOST_ASSET_SOURCE =
  `/flash-assets/${G4_L3_IR001_LOADED_SWF_HOST_LOGICAL_PATH}`;

export interface LoadedSwfHostAsset {
  readonly registryKey: string;
  /** Historical logical path; an active generated binding supersedes it. */
  readonly assetSource: string;
  readonly assetSha256: string;
  readonly sourceProvenLanguage: 'en' | 'es';
  readonly backgroundDisposition:
    'ignore-loaded-child-swf-standalone-stage-background';
}

interface LoadedSwfCanvasAsset {
  readonly metadata?: Readonly<{
    readonly resolution?: Readonly<AdaptiveCanvasResolutionV1>;
  }>;
  readonly ready: () => Promise<void>;
  readonly render: (
    canvas: HTMLCanvasElement,
    request: LoadedSwfCanvasRenderRequest,
  ) => unknown;
}

interface LoadedSwfLegacyRenderRequest {
  readonly frame: number;
  readonly scenario: string;
  readonly lang: 'en' | 'es';
  readonly seed: number;
}

type LoadedSwfCanvasRenderRequest = Readonly<
  LoadedSwfLegacyRenderRequest | CanvasRenderRequest
>;

interface LoadedSwfRenderIdentity {
  readonly localFrame: number;
  readonly frameDomain: string;
  readonly rootFrame: number;
  readonly scenario: string;
  readonly lang: 'en' | 'es';
  readonly seed: number;
  readonly audioRendered: false;
}

interface LoadedSwfPresentationIdentity {
  readonly entryStateSha256: string;
  readonly frame: number;
  readonly frameDomain: string;
  readonly lang: 'en' | 'es';
  readonly requirementId: string;
  readonly rootFrame: number;
  readonly scenario: string;
  readonly seed: number;
  readonly traceId: string;
}

type LoadedSwfCanvasStatus = 'loading' | 'updating' | 'ready' | 'error';

interface LoadedSwfCanvasPresentation {
  readonly fallbackReason: string | null;
  readonly identity: LoadedSwfPresentationIdentity;
  readonly resolution: AdaptiveCanvasResolutionSelection;
  readonly status: LoadedSwfCanvasStatus;
}

interface LoadedSwfRegistryWindow {
  readonly HELP_MATH_CANVAS_ASSETS?: Record<string, LoadedSwfCanvasAsset>;
}

interface LoadedSwfHostScriptRequest {
  readonly integrity: string;
  readonly src: string;
}

interface ResolvedLoadedSwfHostAsset extends LoadedSwfHostAsset {
  readonly resolution: Readonly<AdaptiveCanvasResolutionV1> | null;
  readonly resolutionMode: 'legacy-fixed-k1' | 'adaptive-v1';
  readonly sourceBitmapResolutionBound: boolean;
}

function canvasAssetRegistry() {
  return (window as unknown as LoadedSwfRegistryWindow)
    .HELP_MATH_CANVAS_ASSETS;
}

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function sha256HexToIntegrity(sha256Hex: string) {
  let binary = '';
  for (let index = 0; index < sha256Hex.length; index += 2) {
    binary += String.fromCharCode(
      Number.parseInt(sha256Hex.slice(index, index + 2), 16),
    );
  }
  return `sha256-${btoa(binary)}`;
}

function hasExactAdaptiveResolutionV1(
  resolution: Readonly<AdaptiveCanvasResolutionV1> | undefined,
): resolution is Readonly<AdaptiveCanvasResolutionV1> {
  return resolution?.schemaVersion === 1 &&
    resolution.mode === 'adaptive-integer' &&
    resolution.nativeWidth === LOADED_SWF_HOST_STAGE.width &&
    resolution.nativeHeight === LOADED_SWF_HOST_STAGE.height &&
    resolution.supportedRenderScales.length === 2 &&
    resolution.supportedRenderScales[0] === 1 &&
    resolution.supportedRenderScales[1] === 2;
}

function validateLegacyAsset(asset: LoadedSwfHostAsset) {
  invariant(
    /^course-[a-z0-9-]+$/.test(asset.registryKey),
    'loaded-SWF host registry key is invalid',
  );
  invariant(
    asset.assetSource === G4_L3_IR001_LOADED_SWF_HOST_ASSET_SOURCE,
    'loaded-SWF host asset path is not the exact IR001 host runtime',
  );
  invariant(
    /^[a-f0-9]{64}$/.test(asset.assetSha256),
    'loaded-SWF host asset SHA-256 is invalid',
  );
  invariant(
    asset.sourceProvenLanguage === 'en' ||
      asset.sourceProvenLanguage === 'es',
    'loaded-SWF host source-proven language is invalid',
  );
  invariant(
    asset.backgroundDisposition ===
      'ignore-loaded-child-swf-standalone-stage-background',
    'loaded-SWF host background disposition is invalid',
  );
  return asset;
}

export function resolveLoadedSwfHostAsset(
  asset: LoadedSwfHostAsset,
  productionBinding: AdaptiveCanvasProductionBinding | null,
): ResolvedLoadedSwfHostAsset {
  const legacy = validateLegacyAsset(asset);
  if (productionBinding === null) {
    return Object.freeze({
      ...legacy,
      resolution: null,
      resolutionMode: 'legacy-fixed-k1' as const,
      sourceBitmapResolutionBound: false,
    });
  }
  invariant(
    productionBinding.animationId === legacy.registryKey,
    'adaptive loaded-SWF host binding has a mismatched registry key',
  );
  invariant(
    productionBinding.pageRenderer === false,
    'adaptive loaded-SWF host binding must not identify a page renderer',
  );
  invariant(
    productionBinding.assetPath === G4_L3_IR001_LOADED_SWF_HOST_ASSET_SOURCE,
    'adaptive loaded-SWF host binding has a mismatched asset path',
  );
  invariant(
    /^[a-f0-9]{64}$/.test(productionBinding.assetSha256),
    'adaptive loaded-SWF host binding SHA-256 is invalid',
  );
  invariant(
    hasExactAdaptiveResolutionV1(productionBinding.resolution),
    'adaptive loaded-SWF host binding lacks the exact adaptive-v1 resolution',
  );
  return Object.freeze({
    ...legacy,
    assetSource: productionBinding.assetPath,
    assetSha256: productionBinding.assetSha256,
    resolution: productionBinding.resolution,
    resolutionMode: 'adaptive-v1' as const,
    sourceBitmapResolutionBound:
      productionBinding.sourceBitmapResolutionBound,
  });
}

function scriptRequestForResolvedAsset(
  asset: ResolvedLoadedSwfHostAsset,
): LoadedSwfHostScriptRequest {
  const legacySource = `${asset.assetSource}?sha256=${asset.assetSha256}`;
  return Object.freeze({
    integrity: sha256HexToIntegrity(asset.assetSha256),
    src: asset.resolutionMode === 'adaptive-v1'
      ? `/flash-assets/by-sha256/${asset.assetSha256}/${
          asset.assetSource.slice('/flash-assets/'.length)
        }`
      : legacySource,
  });
}

export function loadedSwfHostScriptRequest(
  asset: LoadedSwfHostAsset,
  productionBinding: AdaptiveCanvasProductionBinding | null =
    getAdaptiveLoadedSwfHostProductionBinding(),
): LoadedSwfHostScriptRequest {
  return scriptRequestForResolvedAsset(
    resolveLoadedSwfHostAsset(asset, productionBinding),
  );
}

function loadAsset(asset: ResolvedLoadedSwfHostAsset) {
  const request = scriptRequestForResolvedAsset(asset);
  return loadExactCanvasRegistryScript<LoadedSwfCanvasAsset>({
    assetSha256: asset.assetSha256,
    markerAttribute: 'data-help-math-loaded-swf-host',
    markerDatasetKey: 'helpMathLoadedSwfHost',
    registeredAsset: () => canvasAssetRegistry()?.[asset.registryKey],
    registryKey: asset.registryKey,
    request: {
      crossOrigin: 'anonymous',
      integrity: request.integrity,
      key: `${asset.registryKey}:${asset.assetSha256}:${request.src}`,
      src: request.src,
    },
  });
}

function isLoadedSwfRenderIdentity(
  value: unknown,
): value is LoadedSwfRenderIdentity {
  return Boolean(
    value &&
      typeof value === 'object' &&
      'localFrame' in value &&
      'frameDomain' in value &&
      'rootFrame' in value &&
      'scenario' in value &&
      'lang' in value &&
      'seed' in value &&
      'audioRendered' in value,
  );
}

function verifyResolutionContract(
  asset: LoadedSwfCanvasAsset,
  expected: Readonly<AdaptiveCanvasResolutionV1> | null,
) {
  if (expected === null) return;
  const observed = asset.metadata?.resolution;
  invariant(
    hasExactAdaptiveResolutionV1(observed) &&
      observed.schemaVersion === expected.schemaVersion &&
      observed.mode === expected.mode &&
      observed.nativeWidth === expected.nativeWidth &&
      observed.nativeHeight === expected.nativeHeight &&
      observed.supportedRenderScales[0] ===
        expected.supportedRenderScales[0] &&
      observed.supportedRenderScales[1] ===
        expected.supportedRenderScales[1],
    'loaded-SWF host asset lacks the exact adaptive-v1 resolution contract',
  );
}

const IDENTITY_ATTRIBUTES = Object.freeze([
  'data-flash-entry-state-sha256',
  'data-flash-frame',
  'data-flash-frame-domain',
  'data-flash-lang',
  'data-flash-requirement-id',
  'data-flash-root-frame',
  'data-flash-scenario',
  'data-flash-seed',
  'data-flash-trace-id',
  'data-runtime-language',
  'data-runtime-scenario',
  'data-runtime-seed',
] as const);

function identityAttributeValues(identity: LoadedSwfPresentationIdentity) {
  return Object.freeze({
    'data-flash-entry-state-sha256': identity.entryStateSha256 || null,
    'data-flash-frame': String(identity.frame),
    'data-flash-frame-domain': identity.frameDomain,
    'data-flash-lang': identity.lang,
    'data-flash-requirement-id': identity.requirementId || null,
    'data-flash-root-frame': String(identity.rootFrame),
    'data-flash-scenario': identity.scenario,
    'data-flash-seed': String(identity.seed),
    'data-flash-trace-id': identity.traceId || null,
    'data-runtime-language': identity.lang,
    'data-runtime-scenario': identity.scenario,
    'data-runtime-seed': String(identity.seed),
  } satisfies Readonly<Record<typeof IDENTITY_ATTRIBUTES[number], string | null>>);
}

function stampIdentity(
  canvas: HTMLCanvasElement,
  identity: LoadedSwfPresentationIdentity,
) {
  const values = identityAttributeValues(identity);
  for (const name of IDENTITY_ATTRIBUTES) {
    const value = values[name];
    if (value === null) canvas.removeAttribute(name);
    else canvas.setAttribute(name, value);
  }
}

function verifyRenderedIdentity(
  canvas: HTMLCanvasElement,
  rendered: unknown,
  expected: LoadedSwfPresentationIdentity,
) {
  invariant(
    isLoadedSwfRenderIdentity(rendered) &&
      rendered.localFrame === expected.frame &&
      rendered.frameDomain === expected.frameDomain &&
      rendered.rootFrame === expected.rootFrame &&
      rendered.scenario === expected.scenario &&
      rendered.lang === expected.lang &&
      rendered.seed === expected.seed &&
      rendered.audioRendered === false,
    'loaded-SWF host asset returned a mismatched identity',
  );
  const expectedAttributes = identityAttributeValues(expected);
  for (const name of IDENTITY_ATTRIBUTES) {
    invariant(
      canvas.getAttribute(name) === expectedAttributes[name],
      `loaded-SWF host asset did not preserve ${name}`,
    );
  }
}

export class LoadedSwfCanvasAllocationError extends Error {
  readonly renderScale: CanvasRenderScale;

  constructor(
    message: string,
    renderScale: CanvasRenderScale,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = 'LoadedSwfCanvasAllocationError';
    this.renderScale = renderScale;
  }
}

export function loadedSwfCanvasMayFallbackToK1({
  adaptiveEnabled,
  error,
}: Readonly<{
  adaptiveEnabled: boolean;
  error: unknown;
}>): boolean {
  return adaptiveEnabled &&
    error instanceof LoadedSwfCanvasAllocationError &&
    error.renderScale === 2;
}

function fallbackK1Resolution(
  resolution: AdaptiveCanvasResolutionSelection,
): AdaptiveCanvasResolutionSelection {
  return Object.freeze({
    ...resolution,
    backingStage: Object.freeze({...LOADED_SWF_HOST_STAGE}),
    renderScale: 1,
    status: 'fallback-k1',
  });
}

function allocateExactStagingCanvas(
  resolution: AdaptiveCanvasResolutionSelection,
  existing: HTMLCanvasElement | null,
) {
  let canvas: HTMLCanvasElement;
  try {
    canvas = existing ?? document.createElement('canvas');
    canvas.width = resolution.backingStage.width;
    canvas.height = resolution.backingStage.height;
  } catch (cause) {
    throw new LoadedSwfCanvasAllocationError(
      `loaded-SWF host Canvas backing allocation failed at ${resolution.renderScale}x`,
      resolution.renderScale,
      {cause},
    );
  }
  if (
    canvas.width !== resolution.backingStage.width ||
    canvas.height !== resolution.backingStage.height
  ) {
    throw new LoadedSwfCanvasAllocationError(
      `loaded-SWF host Canvas backing allocation was not exact at ${resolution.renderScale}x`,
      resolution.renderScale,
    );
  }
  let context: CanvasRenderingContext2D | null;
  try {
    context = canvas.getContext('2d');
    if (context) {
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.clearRect(0, 0, canvas.width, canvas.height);
    }
  } catch (cause) {
    throw new LoadedSwfCanvasAllocationError(
      `loaded-SWF host Canvas 2D allocation failed at ${resolution.renderScale}x`,
      resolution.renderScale,
      {cause},
    );
  }
  if (!context) {
    throw new LoadedSwfCanvasAllocationError(
      `loaded-SWF host Canvas 2D allocation failed at ${resolution.renderScale}x`,
      resolution.renderScale,
    );
  }
  assertExactCanvasBackingDimensions(resolution, {
    height: canvas.height,
    width: canvas.width,
  });
  return canvas;
}

export function prepareLoadedSwfStagingCanvas(
  resolution: AdaptiveCanvasResolutionSelection,
  existing: HTMLCanvasElement | null,
) {
  try {
    return Object.freeze({
      canvas: allocateExactStagingCanvas(resolution, existing),
      fallbackReason: null,
      resolution,
    });
  } catch (error) {
    if (
      !loadedSwfCanvasMayFallbackToK1({
        adaptiveEnabled: resolution.renderScale === 2,
        error,
      })
    ) {
      throw error;
    }
    const allocationError = error as LoadedSwfCanvasAllocationError;
    const fallback = fallbackK1Resolution(resolution);
    return Object.freeze({
      canvas: allocateExactStagingCanvas(fallback, null),
      fallbackReason: allocationError.message,
      resolution: fallback,
    });
  }
}

function markVisibleCanvasPending(
  canvas: HTMLCanvasElement,
  status: 'loading' | 'updating',
) {
  canvas.removeAttribute('data-capture-stage');
  canvas.setAttribute('data-capture-identity-status', 'pending');
  canvas.setAttribute('data-render-state', status);
  canvas.removeAttribute('data-render-visual');
}

export function presentVerifiedLoadedSwfStagingCanvas(
  visibleCanvas: HTMLCanvasElement,
  stagingCanvas: HTMLCanvasElement,
  resolution: AdaptiveCanvasResolutionSelection,
  fallbackReason: string | null,
) {
  assertExactCanvasBackingDimensions(resolution, {
    height: stagingCanvas.height,
    width: stagingCanvas.width,
  });
  try {
    const context = visibleCanvas.getContext('2d');
    if (!context) {
      throw new LoadedSwfCanvasAllocationError(
        `visible loaded-SWF host 2D Canvas is unavailable at ${resolution.renderScale}x`,
        resolution.renderScale,
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
      height: visibleCanvas.height,
      width: visibleCanvas.width,
    });
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.globalAlpha = 1;
    context.globalCompositeOperation = 'copy';
    context.drawImage(stagingCanvas, 0, 0);
    context.globalCompositeOperation = 'source-over';
  } catch (error) {
    if (error instanceof LoadedSwfCanvasAllocationError) throw error;
    throw new LoadedSwfCanvasAllocationError(
      `visible loaded-SWF host allocation or presentation failed at ${resolution.renderScale}x`,
      resolution.renderScale,
      {cause: error},
    );
  }

  for (const attribute of [...stagingCanvas.attributes]) {
    if (
      attribute.name.startsWith('data-flash-') ||
      attribute.name.startsWith('data-runtime-')
    ) {
      visibleCanvas.setAttribute(attribute.name, attribute.value);
    }
  }
  visibleCanvas.setAttribute(
    'data-canvas-backing-height',
    String(visibleCanvas.height),
  );
  visibleCanvas.setAttribute(
    'data-canvas-backing-width',
    String(visibleCanvas.width),
  );
  visibleCanvas.setAttribute(
    'data-render-scale',
    String(resolution.renderScale),
  );
  visibleCanvas.setAttribute('data-resolution-status', resolution.status);
  visibleCanvas.setAttribute(
    'data-resolution-ceiling-reached',
    String(resolution.demandCapped),
  );
  if (fallbackReason) {
    visibleCanvas.setAttribute(
      'data-resolution-fallback-reason',
      fallbackReason,
    );
  } else {
    visibleCanvas.removeAttribute('data-resolution-fallback-reason');
  }
  visibleCanvas.setAttribute(
    'data-capture-identity-status',
    'host-bound-current-js-candidate',
  );
  visibleCanvas.setAttribute('data-render-state', 'ready');
  visibleCanvas.setAttribute('data-render-visual', 'true');
  visibleCanvas.setAttribute('data-capture-stage', 'true');
}

function resolutionIdentity(resolution: AdaptiveCanvasResolutionSelection) {
  return JSON.stringify([
    resolution.cssStage?.width ?? null,
    resolution.cssStage?.height ?? null,
    resolution.devicePixelRatio,
    resolution.renderScale,
    resolution.status,
    resolution.demandCapped,
    resolution.dprCeilingExceeded,
  ]);
}

export function LoadedSwfHostCanvas({
  animationId,
  asset,
  entryStateSha256,
  frame,
  frameDomain,
  height,
  lang,
  requirementId,
  rootFrame,
  scenario,
  seed,
  traceId,
  width,
}: {
  animationId: string;
  asset: LoadedSwfHostAsset;
  entryStateSha256: string;
  frame: number;
  frameDomain: string;
  height: number;
  lang: 'en' | 'es';
  requirementId: string;
  rootFrame: number;
  scenario: string;
  seed: number;
  traceId: string;
  width: number;
}) {
  const productionBinding = getAdaptiveLoadedSwfHostProductionBinding();
  const resolvedAsset = useMemo(
    () => resolveLoadedSwfHostAsset(asset, productionBinding),
    [asset, productionBinding],
  );
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasStageRef = useRef<HTMLDivElement>(null);
  const stagingCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const presentedRequestKeyRef = useRef<string | null>(null);
  const adaptiveResolution = useAdaptiveCanvasResolution({
    adaptiveEnabled: resolvedAsset.resolutionMode === 'adaptive-v1',
    nativeHeight: LOADED_SWF_HOST_STAGE.height,
    nativeWidth: LOADED_SWF_HOST_STAGE.width,
    sourceBitmapBound: resolvedAsset.sourceBitmapResolutionBound,
    targetRef: canvasStageRef,
  });
  const requestedIdentity = useMemo<LoadedSwfPresentationIdentity>(() => ({
    entryStateSha256,
    frame,
    frameDomain,
    lang,
    requirementId,
    rootFrame,
    scenario,
    seed,
    traceId,
  }), [
    entryStateSha256,
    frame,
    frameDomain,
    lang,
    requirementId,
    rootFrame,
    scenario,
    seed,
    traceId,
  ]);
  const requestedKey = JSON.stringify([
    resolvedAsset.registryKey,
    resolvedAsset.assetSource,
    resolvedAsset.assetSha256,
    resolvedAsset.resolutionMode,
    entryStateSha256,
    frame,
    frameDomain,
    lang,
    requirementId,
    rootFrame,
    scenario,
    seed,
    traceId,
    resolutionIdentity(adaptiveResolution),
  ]);
  const [presentation, setPresentation] = useState<LoadedSwfCanvasPresentation>(
    () => ({
      fallbackReason: null,
      identity: requestedIdentity,
      resolution: adaptiveResolution,
      status: 'loading',
    }),
  );

  useLayoutEffect(() => {
    if (presentedRequestKeyRef.current === requestedKey) return;
    const nextStatus = presentedRequestKeyRef.current
      ? 'updating'
      : 'loading';
    if (canvasRef.current) {
      markVisibleCanvasPending(canvasRef.current, nextStatus);
    }
    setPresentation((current) => current.status === nextStatus
      ? current
      : {...current, status: nextStatus});
  }, [requestedKey]);

  useEffect(() => {
    const visibleCanvas = canvasRef.current;
    if (!visibleCanvas) return;
    let cancelled = false;
    const assetPromise =
      width !== LOADED_SWF_HOST_STAGE.width ||
      height !== LOADED_SWF_HOST_STAGE.height
        ? Promise.reject(new Error(
            'loaded-SWF host stage must remain exactly 800x600',
          ))
        : loadAsset(resolvedAsset);

    void assetPromise
      .then(async (loadedAsset) => {
        await loadedAsset.ready();
        if (cancelled) return;
        verifyResolutionContract(loadedAsset, resolvedAsset.resolution);
        const renderAndPresent = (
          resolution: AdaptiveCanvasResolutionSelection,
          existing: HTMLCanvasElement | null,
          inheritedFallbackReason: string | null = null,
        ) => {
          const candidate = prepareLoadedSwfStagingCanvas(
            resolution,
            existing,
          );
          const fallbackReason =
            candidate.fallbackReason ?? inheritedFallbackReason;
          stampIdentity(candidate.canvas, requestedIdentity);
          const legacyRenderRequest: LoadedSwfLegacyRenderRequest =
            Object.freeze({
              frame: requestedIdentity.frame,
              scenario: requestedIdentity.scenario,
              lang: requestedIdentity.lang,
              seed: requestedIdentity.seed,
            });
          const renderRequest: LoadedSwfCanvasRenderRequest =
            resolvedAsset.resolutionMode === 'adaptive-v1'
              ? Object.freeze({
                  ...legacyRenderRequest,
                  renderScale: candidate.resolution.renderScale,
                } satisfies CanvasRenderRequest)
              : legacyRenderRequest;
          const rendered = loadedAsset.render(candidate.canvas, renderRequest);
          verifyRenderedIdentity(
            candidate.canvas,
            rendered,
            requestedIdentity,
          );
          if (cancelled) return null;
          presentVerifiedLoadedSwfStagingCanvas(
            visibleCanvas,
            candidate.canvas,
            candidate.resolution,
            fallbackReason,
          );
          return Object.freeze({...candidate, fallbackReason});
        };
        let prepared: ReturnType<typeof renderAndPresent>;
        try {
          prepared = renderAndPresent(
            adaptiveResolution,
            stagingCanvasRef.current,
          );
        } catch (error) {
          if (
            !loadedSwfCanvasMayFallbackToK1({
              adaptiveEnabled: resolvedAsset.resolutionMode === 'adaptive-v1',
              error,
            })
          ) {
            throw error;
          }
          const allocationError = error as LoadedSwfCanvasAllocationError;
          prepared = renderAndPresent(
            fallbackK1Resolution(adaptiveResolution),
            null,
            allocationError.message,
          );
        }
        if (cancelled || !prepared) return;
        stagingCanvasRef.current = prepared.canvas;
        presentedRequestKeyRef.current = requestedKey;
        setPresentation({
          fallbackReason: prepared.fallbackReason,
          identity: requestedIdentity,
          resolution: prepared.resolution,
          status: 'ready',
        });
      })
      .catch(() => {
        if (cancelled) return;
        presentedRequestKeyRef.current = null;
        visibleCanvas.removeAttribute('data-capture-stage');
        visibleCanvas.removeAttribute('data-resolution-fallback-reason');
        visibleCanvas.setAttribute('data-capture-identity-status', 'blocked');
        visibleCanvas.setAttribute('data-render-state', 'error');
        visibleCanvas.removeAttribute('data-render-visual');
        setPresentation((current) => ({
          ...current,
          fallbackReason: null,
          status: 'error',
        }));
      });
    return () => {
      cancelled = true;
    };
  }, [
    adaptiveResolution,
    entryStateSha256,
    frame,
    frameDomain,
    height,
    lang,
    requestedKey,
    requestedIdentity,
    requirementId,
    resolvedAsset,
    rootFrame,
    scenario,
    seed,
    traceId,
    width,
  ]);

  return <section
    aria-label={`Loaded child SWF drawing for ${animationId}`}
    className="faithful-conversion loaded-swf-host-canvas"
    data-animation-id={animationId}
    data-candidate-status="source-static-host-composite-not-strict"
    data-canvas-background-mode="transparent-over-shell-underlay"
    data-canvas-resolution-mode={resolvedAsset.resolutionMode}
    data-canvas-status={presentation.status}
    data-loaded-swf-background-disposition={asset.backgroundDisposition}
    data-original-runtime-accepted="false"
    data-owner-accepted="false"
    data-strict-migration-complete="false"
    style={{
      marginInline: 'auto',
      maxWidth: `${LOADED_SWF_HOST_STAGE.width}px`,
      width: '100%',
    }}
  >
    <div
      ref={canvasStageRef}
      style={{
        aspectRatio:
          `${LOADED_SWF_HOST_STAGE.width} / ${LOADED_SWF_HOST_STAGE.height}`,
        width: '100%',
      }}
    >
      <canvas
        aria-label={`Source-static ${presentation.identity.frameDomain} drawing, frame ${presentation.identity.frame}`}
        className="faithful-stage-wrap"
        data-canvas-backing-height={presentation.resolution.backingStage.height}
        data-canvas-backing-width={presentation.resolution.backingStage.width}
        data-capture-stage={presentation.status === 'ready'
          ? 'true'
          : undefined}
        data-capture-identity-status={presentation.status === 'ready'
          ? 'host-bound-current-js-candidate'
          : presentation.status === 'error'
            ? 'blocked'
            : 'pending'}
        data-flash-entry-state-sha256={
          presentation.identity.entryStateSha256 || undefined
        }
        data-flash-frame={presentation.identity.frame}
        data-flash-frame-domain={presentation.identity.frameDomain}
        data-flash-lang={presentation.identity.lang}
        data-flash-requirement-id={
          presentation.identity.requirementId || undefined
        }
        data-flash-root-frame={presentation.identity.rootFrame}
        data-flash-scenario={presentation.identity.scenario}
        data-flash-seed={presentation.identity.seed}
        data-flash-trace-id={presentation.identity.traceId || undefined}
        data-course-canvas={animationId}
        data-render-scale={presentation.resolution.renderScale}
        data-render-state={presentation.status}
        data-render-visual={presentation.status === 'ready' ? 'true' : undefined}
        data-resolution-ceiling-reached={String(
          presentation.resolution.demandCapped,
        )}
        data-resolution-fallback-reason={presentation.fallbackReason ?? undefined}
        data-resolution-status={presentation.resolution.status}
        data-runtime-language={presentation.identity.lang}
        data-runtime-scenario={presentation.identity.scenario}
        data-runtime-seed={presentation.identity.seed}
        height={LOADED_SWF_HOST_STAGE.height}
        ref={canvasRef}
        role="img"
        style={{
          aspectRatio:
            `${LOADED_SWF_HOST_STAGE.width} / ${LOADED_SWF_HOST_STAGE.height}`,
          display: presentation.status === 'error' ? 'none' : 'block',
          height: 'auto',
          maxWidth: `${LOADED_SWF_HOST_STAGE.width}px`,
          pointerEvents: 'none',
          width: '100%',
        }}
        width={LOADED_SWF_HOST_STAGE.width}
      />
    </div>
    {presentation.status === 'loading' || presentation.status === 'updating'
      ? <span aria-live="polite" className="sr-only" role="status">
          Loading source-bound host composite…
        </span>
      : null}
    {presentation.status === 'error'
      ? <p aria-live="assertive" role="alert">
          The local loaded-SWF host drawing failed safely.
        </p>
      : null}
  </section>;
}
