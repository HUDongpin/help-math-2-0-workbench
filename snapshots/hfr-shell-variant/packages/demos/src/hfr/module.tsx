"use client";

// HFR runtime · wraps one converted page as a renderer-clocked AnimationModule,
// so the lesson shell, the registry and the descriptor gates treat it like any
// other registered page while the page keeps its own ActionScript clock.
import type { AnimationModule, AnimationRendererProps } from "../contract";
import type { LessonHostCapabilityDescriptor } from "../lesson-host-contract";
import { HfrRenderer } from "./renderer";
import type { HfrPageMeta, PageFactory } from "./types";

const HFR_LESSON_HOST: LessonHostCapabilityDescriptor = Object.freeze({
  capabilities: Object.freeze(["navigation", "glossary", "practice-feedback", "audio"] as const),
  legacyOperations: "blocked",
  auditStorage: "memory-only",
  storesPersonalData: false,
});

export function createHfrAnimationModule(meta: HfrPageMeta, page: PageFactory): AnimationModule {
  const frameCount = Math.max(1, meta.progressFrameCount);
  const fps = meta.stage.fps;
  function HfrPageRenderer(props: AnimationRendererProps) {
    return <HfrRenderer {...props} meta={meta} page={page} />;
  }
  HfrPageRenderer.displayName = `HfrPage(${meta.key})`;
  return Object.freeze({
    key: meta.key,
    clock: "renderer" as const,
    movie: Object.freeze({
      stage: Object.freeze({ width: meta.stage.width, height: meta.stage.height }),
      fps,
      frameCount,
      durationMs: Math.round((frameCount / fps) * 1000),
    }),
    scenarios: Object.freeze([Object.freeze({ id: "hfr", label: "Translated ActionScript" })]),
    audioCues: Object.freeze([]),
    lessonHost: HFR_LESSON_HOST,
    maturity: "private-current-js" as const,
    Renderer: HfrPageRenderer,
    getFrameState: (frame: number) => Object.freeze({ frame }),
  });
}
