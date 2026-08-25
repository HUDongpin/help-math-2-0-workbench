"use client";

import {
  useLayoutEffect,
  useState,
  type RefObject,
} from "react";

import {
  selectAdaptiveCanvasResolution,
  type AdaptiveCanvasResolutionSelection,
} from "./adaptive-canvas-resolution";

export interface UseAdaptiveCanvasResolutionOptions {
  readonly targetRef: RefObject<HTMLElement | null>;
  readonly nativeWidth: number;
  readonly nativeHeight: number;
  /** Historical assets without adaptive-v1 metadata remain fixed at 1x. */
  readonly adaptiveEnabled: boolean;
  readonly sourceBitmapBound?: boolean;
}

function initialResolution({
  adaptiveEnabled,
  nativeHeight,
  nativeWidth,
  sourceBitmapBound,
}: Omit<UseAdaptiveCanvasResolutionOptions, "targetRef">) {
  return selectAdaptiveCanvasResolution({
    authoredStage: {width: nativeWidth, height: nativeHeight},
    cssStage: adaptiveEnabled
      ? null
      : {width: nativeWidth, height: nativeHeight},
    devicePixelRatio: adaptiveEnabled ? null : 1,
    sourceBitmapBound,
  });
}

function selectionIdentity(value: AdaptiveCanvasResolutionSelection) {
  return JSON.stringify([
    value.nativeWidth,
    value.nativeHeight,
    value.cssStage?.width ?? null,
    value.cssStage?.height ?? null,
    value.devicePixelRatio,
    value.renderScale,
    value.status,
    value.dprCeilingExceeded,
    value.demandCapped,
    value.sourceBitmapBound,
  ]);
}

/**
 * Tracks CSS size, browser zoom, device-pixel-ratio changes, and display moves.
 * The returned scale remains an integer 1 or 2; callers key expensive Canvas
 * rendering on `renderScale`, not on every measurement update.
 */
export function useAdaptiveCanvasResolution(
  options: UseAdaptiveCanvasResolutionOptions,
): AdaptiveCanvasResolutionSelection {
  const {
    adaptiveEnabled,
    nativeHeight,
    nativeWidth,
    sourceBitmapBound = false,
    targetRef,
  } = options;
  const [resolution, setResolution] = useState(() =>
    initialResolution({
      adaptiveEnabled,
      nativeHeight,
      nativeWidth,
      sourceBitmapBound,
    }),
  );

  useLayoutEffect(() => {
    if (!adaptiveEnabled) {
      const fixed = initialResolution({
        adaptiveEnabled: false,
        nativeHeight,
        nativeWidth,
        sourceBitmapBound,
      });
      setResolution((current) =>
        selectionIdentity(current) === selectionIdentity(fixed)
          ? current
          : fixed,
      );
      return;
    }

    const target = targetRef.current;
    if (!target || typeof window === "undefined") return;

    let disposed = false;
    let dprQuery: MediaQueryList | null = null;

    const update = () => {
      if (disposed) return;
      const bounds = target.getBoundingClientRect();
      const next = selectAdaptiveCanvasResolution({
        authoredStage: {width: nativeWidth, height: nativeHeight},
        cssStage: {width: bounds.width, height: bounds.height},
        devicePixelRatio: window.devicePixelRatio,
        sourceBitmapBound,
      });
      setResolution((current) =>
        selectionIdentity(current) === selectionIdentity(next)
          ? current
          : next,
      );
    };

    const removeDprQuery = () => {
      dprQuery?.removeEventListener("change", handleDprChange);
      dprQuery = null;
    };
    const registerDprQuery = () => {
      removeDprQuery();
      if (typeof window.matchMedia !== "function") return;
      dprQuery = window.matchMedia(
        `(resolution: ${window.devicePixelRatio}dppx)`,
      );
      dprQuery.addEventListener("change", handleDprChange);
    };
    function handleDprChange() {
      update();
      registerDprQuery();
    }

    const resizeObserver =
      typeof ResizeObserver === "function"
        ? new ResizeObserver(update)
        : null;
    resizeObserver?.observe(target);
    window.addEventListener("resize", update);
    window.visualViewport?.addEventListener("resize", update);
    registerDprQuery();
    update();

    return () => {
      disposed = true;
      resizeObserver?.disconnect();
      window.removeEventListener("resize", update);
      window.visualViewport?.removeEventListener("resize", update);
      removeDprQuery();
    };
  }, [
    adaptiveEnabled,
    nativeHeight,
    nativeWidth,
    sourceBitmapBound,
    targetRef,
  ]);

  return resolution;
}

