"use client";

import {useLayoutEffect, useState, type RefObject} from "react";
import {
  selectLessonCanvasResolution,
  type LessonCanvasResolution,
  type LessonCanvasResolutionOptions,
} from "./lesson-canvas-resolution";

/** Browser observer kept independent of React so cleanup/coalescing can be tested. */
export function observeLessonCanvasResolution(
  target: HTMLElement,
  options: LessonCanvasResolutionOptions,
  onChange: (resolution: LessonCanvasResolution) => void,
): () => void {
  const initial = selectLessonCanvasResolution(options);
  const view = target.ownerDocument.defaultView;
  if (!initial.enabled || !view) {
    onChange(initial);
    return () => {};
  }
  let disposed = false;
  let pendingFrame: number | null = null;
  let query: MediaQueryList | null = null;
  let previous = "";
  const update = () => {
    if (disposed) return;
    pendingFrame = null;
    const bounds = target.getBoundingClientRect();
    const resolution = selectLessonCanvasResolution({...options,
      cssStage: {width: bounds.width, height: bounds.height},
      devicePixelRatio: view.devicePixelRatio,
    });
    const identity = JSON.stringify(resolution);
    if (identity !== previous) {
      previous = identity;
      onChange(resolution);
    }
  };
  const schedule = () => {
    if (!disposed && pendingFrame === null) pendingFrame = view.requestAnimationFrame(update);
  };
  const watchDpr = () => {
    query?.removeEventListener("change", onDprChange);
    query = typeof view.matchMedia === "function"
      ? view.matchMedia(`(resolution: ${view.devicePixelRatio}dppx)`)
      : null;
    query?.addEventListener("change", onDprChange);
  };
  function onDprChange() {
    schedule();
    watchDpr();
  }
  const ResizeObserverClass = (view as Window & {ResizeObserver?: typeof ResizeObserver}).ResizeObserver;
  const observer = ResizeObserverClass ? new ResizeObserverClass(schedule) : null;
  observer?.observe(target);
  view.addEventListener("resize", schedule);
  view.visualViewport?.addEventListener("resize", schedule);
  watchDpr();
  update();
  return () => {
    disposed = true;
    if (pendingFrame !== null) view.cancelAnimationFrame(pendingFrame);
    observer?.disconnect();
    view.removeEventListener("resize", schedule);
    view.visualViewport?.removeEventListener("resize", schedule);
    query?.removeEventListener("change", onDprChange);
  };
}

/** Does not own a playhead, random seed, audio clock, or interaction state. */
export function useLessonCanvasResolution(
  options: LessonCanvasResolutionOptions & {readonly targetRef: RefObject<HTMLElement | null>},
): LessonCanvasResolution {
  const initial = selectLessonCanvasResolution(options);
  const metadataKey = JSON.stringify(options.metadata ?? null);
  const [resolution, setResolution] = useState(initial);
  useLayoutEffect(() => {
    const update = (next: LessonCanvasResolution) => setResolution((current) =>
      JSON.stringify(current) === JSON.stringify(next) ? current : next);
    const target = options.targetRef.current;
    if (!target) {
      update(selectLessonCanvasResolution(options));
      return;
    }
    return observeLessonCanvasResolution(target, options, update);
  }, [options.targetRef, options.nativeStage.width, options.nativeStage.height,
    options.enabled, options.sourceBitmapBound, metadataKey]);
  return resolution;
}
