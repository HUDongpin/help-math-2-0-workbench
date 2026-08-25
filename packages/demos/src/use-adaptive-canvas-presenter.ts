"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from "react";

import {
  type AdaptiveCanvasResolutionSelection,
  type CanvasRenderRequest,
  validateCanvasRenderRequest,
} from "./adaptive-canvas-resolution";
import {
  applyAdaptiveCanvasPresentationStatus,
  createLatestAdaptiveCanvasRenderCoordinator,
  isCanvasPresentationAllocationError,
  loadAdaptiveCanvasAsset,
  prepareAdaptiveCanvasStaging,
  presentVerifiedAdaptiveCanvas,
  retainedAdaptiveCanvasStatus,
  verifyAdaptiveCanvasAssetResolution,
  type AdaptiveCanvasAsset,
  type AdaptiveCanvasAssetDescriptor,
  type AdaptiveCanvasPresentationStatus,
} from "./adaptive-canvas-presenter";
import {useAdaptiveCanvasResolution} from "./use-adaptive-canvas-resolution";

export interface UseAdaptiveCanvasPresenterOptions<
  TRequest extends CanvasRenderRequest,
> {
  readonly active: boolean;
  readonly asset: AdaptiveCanvasAssetDescriptor;
  readonly captureReady: boolean;
  readonly hostRef?: RefObject<HTMLElement | null>;
  readonly nativeHeight: number;
  readonly nativeWidth: number;
  readonly renderRequest: Omit<TRequest, "renderScale">;
  /** Includes teaching identity, but deliberately excludes renderScale. */
  readonly requestKey: string;
  readonly sourceBitmapBound?: boolean;
  readonly stageRef: RefObject<HTMLElement | null>;
  readonly verifyRendered: (
    canvas: HTMLCanvasElement,
    rendered: unknown,
  ) => void;
  readonly visibleCanvasRef: RefObject<HTMLCanvasElement | null>;
  /** Includes visual teaching state, but deliberately excludes renderScale. */
  readonly visualKey: string;
}

export interface AdaptiveCanvasPresenterState {
  readonly hasPresentedFrame: boolean;
  readonly requestedRenderKey: string;
  readonly requestedVisualKey: string;
  readonly resolution: AdaptiveCanvasResolutionSelection;
  readonly status: AdaptiveCanvasPresentationStatus;
}

interface ForcedK1Fallback {
  readonly selectionKey: string;
  readonly reason: string;
}

interface PendingPresentation<TRequest extends CanvasRenderRequest> {
  readonly asset: AdaptiveCanvasAssetDescriptor;
  readonly captureReady: boolean;
  readonly fallbackReason: string | null;
  readonly renderKey: string;
  readonly renderRequest: TRequest;
  readonly resolution: AdaptiveCanvasResolutionSelection;
  readonly selectionKey: string;
  readonly stagingCanvas: HTMLCanvasElement;
  readonly verifyRendered: (
    canvas: HTMLCanvasElement,
    rendered: unknown,
  ) => void;
  readonly visibleCanvas: HTMLCanvasElement;
  readonly visualKey: string;
}

function selectionKey(resolution: AdaptiveCanvasResolutionSelection) {
  return JSON.stringify([
    resolution.nativeWidth,
    resolution.nativeHeight,
    resolution.cssStage?.width ?? null,
    resolution.cssStage?.height ?? null,
    resolution.devicePixelRatio,
    resolution.renderScale,
    resolution.requestedRenderScale,
    resolution.demandCapped,
    resolution.sourceBitmapBound,
  ]);
}

export function createK1CanvasAllocationFallback(
  resolution: AdaptiveCanvasResolutionSelection,
): AdaptiveCanvasResolutionSelection {
  return Object.freeze({
    ...resolution,
    renderScale: 1,
    backingStage: Object.freeze({
      width: resolution.nativeWidth,
      height: resolution.nativeHeight,
    }),
    status: "fallback-k1" as const,
  });
}

/**
 * Shared adaptive presenter for exceptional Canvas modules. It keeps one
 * connected visible Canvas, renders the latest request on a detached staging
 * surface, verifies identity, then synchronously swaps the bitmap. Canvas
 * allocation/context failure at 2x is the only automatic k1 fallback path and
 * is exposed through `fallback-k1` diagnostics.
 */
export function useAdaptiveCanvasPresenter<
  TRequest extends CanvasRenderRequest,
>(
  options: UseAdaptiveCanvasPresenterOptions<TRequest>,
): AdaptiveCanvasPresenterState {
  if (
    options.asset.resolution &&
    (options.asset.resolution.nativeWidth !== options.nativeWidth ||
      options.asset.resolution.nativeHeight !== options.nativeHeight)
  ) {
    throw new Error(
      `${options.asset.animationId}: adaptive metadata does not match the native Canvas stage`,
    );
  }
  const selectedResolution = useAdaptiveCanvasResolution({
    targetRef: options.stageRef,
    nativeWidth: options.nativeWidth,
    nativeHeight: options.nativeHeight,
    adaptiveEnabled: options.asset.resolution !== undefined,
    sourceBitmapBound: options.sourceBitmapBound,
  });
  const selectedKey = selectionKey(selectedResolution);
  const [forcedFallback, setForcedFallback] =
    useState<ForcedK1Fallback | null>(null);
  const fallbackActive = forcedFallback?.selectionKey === selectedKey;
  const resolution = fallbackActive
    ? createK1CanvasAllocationFallback(selectedResolution)
    : selectedResolution;
  const fallbackReason = fallbackActive ? forcedFallback.reason : null;
  const requestedRenderKey = JSON.stringify([
    options.requestKey,
    resolution.renderScale,
  ]);
  const requestedVisualKey = JSON.stringify([
    options.visualKey,
    resolution.renderScale,
  ]);

  const stagingCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasStatusRef = useRef<AdaptiveCanvasPresentationStatus>("idle");
  const renderedRequestKeyRef = useRef<string | null>(null);
  const renderedVisualKeyRef = useRef<string | null>(null);
  const presentationRef = useRef<"pending" | "painted" | "error">(
    "pending",
  );
  const [presentation, setPresentation] = useState<
    "pending" | "painted" | "error"
  >("pending");
  const [, refreshPresentedStatus] = useState(0);
  const [renderCoordinator] = useState(() =>
    createLatestAdaptiveCanvasRenderCoordinator<
      PendingPresentation<TRequest>,
      AdaptiveCanvasAsset<TRequest>
    >(),
  );

  const reportedStatus = retainedAdaptiveCanvasStatus({
    canvasStatus: canvasStatusRef.current,
    renderedVisualKey: renderedVisualKeyRef.current,
    requestedVisualKey,
  });

  useLayoutEffect(() => {
    const canvas = options.visibleCanvasRef.current;
    if (!canvas || !options.active) return;
    if (renderedRequestKeyRef.current === requestedRenderKey) {
      canvasStatusRef.current = "ready";
      canvas.setAttribute("data-render-scale", String(resolution.renderScale));
      canvas.setAttribute(
        "data-canvas-backing-width",
        String(canvas.width),
      );
      canvas.setAttribute(
        "data-canvas-backing-height",
        String(canvas.height),
      );
      canvas.setAttribute("data-resolution-status", resolution.status);
      canvas.setAttribute(
        "data-resolution-ceiling-reached",
        String(resolution.demandCapped),
      );
      if (fallbackReason) {
        canvas.setAttribute("data-resolution-fallback-reason", fallbackReason);
      } else {
        canvas.removeAttribute("data-resolution-fallback-reason");
      }
      applyAdaptiveCanvasPresentationStatus(canvas, {
        captureReady: options.captureReady,
        status: "ready",
      });
      options.hostRef?.current?.setAttribute("data-canvas-status", "ready");
      return;
    }
    const pendingStatus =
      canvasStatusRef.current === "ready" ||
      canvasStatusRef.current === "updating"
        ? "updating"
        : "loading";
    canvasStatusRef.current = pendingStatus;
    applyAdaptiveCanvasPresentationStatus(canvas, {
      captureReady: false,
      status: pendingStatus,
    });
    options.hostRef?.current?.setAttribute(
      "data-canvas-status",
      pendingStatus,
    );
  }, [
    fallbackReason,
    options.active,
    options.captureReady,
    options.hostRef,
    options.visibleCanvasRef,
    requestedRenderKey,
    resolution.demandCapped,
    resolution.renderScale,
    resolution.status,
  ]);

  useEffect(() => {
    const visibleCanvas = options.visibleCanvasRef.current;
    if (!visibleCanvas || !options.active) {
      renderCoordinator.cancel();
      renderedRequestKeyRef.current = null;
      renderedVisualKeyRef.current = null;
      canvasStatusRef.current = "idle";
      if (presentationRef.current !== "pending") {
        presentationRef.current = "pending";
        setPresentation("pending");
      }
      return;
    }

    const stagingCanvas =
      stagingCanvasRef.current ?? document.createElement("canvas");
    stagingCanvasRef.current = stagingCanvas;
    const request = Object.freeze({
      asset: options.asset,
      captureReady: options.captureReady,
      fallbackReason,
      renderKey: requestedRenderKey,
      renderRequest: Object.freeze({
        ...options.renderRequest,
        renderScale: resolution.renderScale,
      }) as TRequest,
      resolution,
      selectionKey: selectedKey,
      stagingCanvas,
      verifyRendered: options.verifyRendered,
      visibleCanvas,
      visualKey: requestedVisualKey,
    });
    renderCoordinator.enqueue(request);
    if (renderedRequestKeyRef.current === requestedRenderKey) return;

    let attemptedPresentation: PendingPresentation<TRequest> | null = null;
    const run = renderCoordinator.run(
      async () => {
        const asset = await loadAdaptiveCanvasAsset<TRequest>(options.asset);
        await asset.ready();
        verifyAdaptiveCanvasAssetResolution(
          asset,
          options.asset.resolution,
        );
        return asset;
      },
      (latest, asset) => {
        attemptedPresentation = latest;
        prepareAdaptiveCanvasStaging(
          latest.stagingCanvas,
          latest.resolution,
        );
        validateCanvasRenderRequest(latest.renderRequest);
        const rendered = asset.render(
          latest.stagingCanvas,
          latest.renderRequest,
        );
        latest.verifyRendered(latest.stagingCanvas, rendered);
        presentVerifiedAdaptiveCanvas(
          latest.visibleCanvas,
          latest.stagingCanvas,
          latest.resolution,
          latest.captureReady,
        );
        if (latest.fallbackReason) {
          latest.visibleCanvas.setAttribute(
            "data-resolution-fallback-reason",
            latest.fallbackReason,
          );
        } else {
          latest.visibleCanvas.removeAttribute(
            "data-resolution-fallback-reason",
          );
        }
      },
    );
    if (!run.started) return;
    void run.completion
      .then((completed) => {
        if (!completed) return;
        renderedRequestKeyRef.current = completed.renderKey;
        renderedVisualKeyRef.current = completed.visualKey;
        canvasStatusRef.current = "ready";
        applyAdaptiveCanvasPresentationStatus(completed.visibleCanvas, {
          captureReady: completed.captureReady,
          status: "ready",
        });
        options.hostRef?.current?.setAttribute("data-canvas-status", "ready");
        if (presentationRef.current !== "painted") {
          presentationRef.current = "painted";
          setPresentation("painted");
        } else {
          // The connected Canvas was retained while a newer visual was staged.
          // Its refs now say ready, so force the declarative host diagnostics to
          // leave `updating` even though the painted/not-painted state did not
          // otherwise change.
          refreshPresentedStatus((revision) => revision + 1);
        }
      })
      .catch((error: unknown) => {
        const failedPresentation = attemptedPresentation;
        if (
          failedPresentation &&
          isCanvasPresentationAllocationError(error) &&
          failedPresentation.resolution.renderScale === 2 &&
          failedPresentation.asset.resolution !== undefined
        ) {
          const reason = error.message;
          canvasStatusRef.current = presentationRef.current === "painted"
            ? "updating"
            : "loading";
          failedPresentation.visibleCanvas.setAttribute(
            "data-resolution-status",
            "fallback-k1",
          );
          failedPresentation.visibleCanvas.setAttribute(
            "data-resolution-fallback-reason",
            reason,
          );
          applyAdaptiveCanvasPresentationStatus(
            failedPresentation.visibleCanvas,
            {
              captureReady: false,
              status: canvasStatusRef.current,
            },
          );
          options.hostRef?.current?.setAttribute(
            "data-canvas-status",
            canvasStatusRef.current,
          );
          stagingCanvasRef.current = null;
          setForcedFallback({
            selectionKey: failedPresentation.selectionKey,
            reason,
          });
          return;
        }
        renderedRequestKeyRef.current = null;
        renderedVisualKeyRef.current = null;
        canvasStatusRef.current = "error";
        visibleCanvas.removeAttribute("data-resolution-fallback-reason");
        applyAdaptiveCanvasPresentationStatus(visibleCanvas, {
          captureReady: false,
          status: "error",
        });
        options.hostRef?.current?.setAttribute("data-canvas-status", "error");
        if (presentationRef.current !== "error") {
          presentationRef.current = "error";
          setPresentation("error");
        }
      });
  }, [
    fallbackReason,
    options.active,
    options.asset,
    options.captureReady,
    options.hostRef,
    options.renderRequest,
    options.verifyRendered,
    options.visibleCanvasRef,
    renderCoordinator,
    requestedRenderKey,
    requestedVisualKey,
    resolution,
    selectedKey,
  ]);

  useEffect(() => () => renderCoordinator.cancel(), [renderCoordinator]);

  return Object.freeze({
    hasPresentedFrame: presentation === "painted",
    requestedRenderKey,
    requestedVisualKey,
    resolution,
    status: reportedStatus,
  });
}
