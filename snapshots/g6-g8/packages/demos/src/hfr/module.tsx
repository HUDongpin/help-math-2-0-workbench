"use client";

// HFR runtime · wraps one converted page as a renderer-clocked AnimationModule,
// so the lesson shell, the registry and the descriptor gates treat it like any
// other registered page while the page keeps its own ActionScript clock.
import React from "react";
import type { AnimationModule, AnimationRendererProps } from "../contract";
import type { LessonHostCapabilityDescriptor } from "../lesson-host-contract";
import {P009_NATIVE_BINDING,p009NativeSnapshot} from "./nms-l11-p009-native";
import {P009_NATIVE} from "./nms-l11-p009-native-binding";
import {P010_NATIVE_BINDING,p010NativeSnapshot} from "./nms-l11-p010-native";
import {P010_NATIVE} from "./nms-l11-p010-native-binding";
import { HfrRenderer } from "./renderer";
import {hfrLiveTextSnapshot, type HfrNativeTextOptions} from "./native-presentation";
import type { HfrPageMeta, PageFactory } from "./types";
import {withHfrCanvasGlossary} from './source-canvas-glossary';

const HFR_LESSON_HOST: LessonHostCapabilityDescriptor = Object.freeze({
  capabilities: Object.freeze(["navigation", "glossary", "practice-feedback", "audio"] as const),
  legacyOperations: "blocked",
  auditStorage: "memory-only",
  storesPersonalData: false,
});

export function createHfrAnimationModule(sourceMeta: HfrPageMeta, page: PageFactory, nativeText?: HfrNativeTextOptions): AnimationModule {
  const meta=nativeText ? sourceMeta : withHfrCanvasGlossary(sourceMeta);
  if (!Number.isSafeInteger(meta.sourceRootFrameCount) || meta.sourceRootFrameCount < 1 ||
      !Number.isSafeInteger(meta.progressFrameCount) || meta.progressFrameCount < 1 ||
      !Number.isSafeInteger(meta.progressTimeline) || meta.progressTimeline < 0 ||
      (meta.progressTimeline === 0 && meta.progressFrameCount !== meta.sourceRootFrameCount)) {
    throw new Error("HFR_SOURCE_RUNTIME_METADATA_INVALID");
  }
  const isP009=meta.key===P009_NATIVE.animationId;
  const isP010=meta.key===P010_NATIVE.animationId;
  if(isP010 && (meta.sourceSha256!==P010_NATIVE.sourceSha256 || meta.completionMode!=="activity"))throw Error("P010_MODULE_SOURCE_ACTIVITY_REQUIRED");
  if(isP009 && (meta.sourceSha256!==P009_NATIVE.sourceSha256 || meta.completionMode!=="activity"))throw Error("P009_MODULE_SOURCE_ACTIVITY_REQUIRED");
  const frameCount = meta.sourceRootFrameCount;
  const fps = meta.stage.fps;
  if (!Number.isFinite(fps) || fps <= 0 || !Number.isFinite(meta.stage.width) || meta.stage.width <= 0 || !Number.isFinite(meta.stage.height) || meta.stage.height <= 0) throw new Error("HFR_SOURCE_STAGE_METADATA_INVALID");
  const movie = Object.freeze({stage: Object.freeze({width: meta.stage.width, height: meta.stage.height}),
    fps, frameCount, durationMs: Math.round((frameCount / fps) * 1000)});
  const progressDomain = meta.progressTimeline === 0 ? "root" : `sprite-${meta.progressTimeline}`;
  function HfrPageRenderer(props: AnimationRendererProps) {
    return <HfrRenderer {...props} meta={meta} page={page} />;
  }
  HfrPageRenderer.displayName = `HfrPage(${meta.key})`;
  function HfrNativePageRenderer(props: AnimationRendererProps) {
    return <HfrRenderer {...props} meta={meta} page={page} nativeText={nativeText} />;
  }
  HfrNativePageRenderer.displayName = `HfrNativePage(${meta.key})`;
  const textPresentation = isP010 ? Object.freeze({schemaVersion:1 as const,binding:P010_NATIVE_BINDING,Renderer:HfrPageRenderer,reducedMotionFrameByDomain:Object.freeze({"sprite-204":47}),getSnapshot:p010NativeSnapshot}) : isP009 ? Object.freeze({schemaVersion:1 as const,binding:P009_NATIVE_BINDING,Renderer:HfrPageRenderer,reducedMotionFrameByDomain:Object.freeze({"sprite-221":64}),getSnapshot:p009NativeSnapshot}) : nativeText ? Object.freeze({schemaVersion: 1 as const,
    binding: nativeText.binding, Renderer: HfrNativePageRenderer,
    ...(nativeText.reducedMotionState ? {reducedMotionFrameByDomain: Object.freeze({[nativeText.reducedMotionState.frameDomain]: nativeText.reducedMotionState.frame})} : {}),
    prepare: async () => {
      if (nativeText.binding.animationId !== meta.key || nativeText.binding.sourceSwfSha256 !== meta.sourceSha256 ||
          nativeText.sourceCatalog.sourceSha256 !== meta.sourceSha256 ||
          (nativeText.sourceDecisions && nativeText.sourceDecisions.sourceSwfSha256 !== meta.sourceSha256) ||
          (nativeText.frameDomain !== "root" && nativeText.frameDomain !== progressDomain)) {
        throw new Error("HFR_NATIVE_TEXT_SOURCE_BINDING_MISMATCH");
      }
      if (nativeText.reducedMotionState && (meta.completionMode !== "timeline" ||
          nativeText.reducedMotionState.sourceSha256 !== meta.sourceSha256 ||
          nativeText.reducedMotionState.frameDomain !== nativeText.frameDomain)) {
        throw new Error("HFR_REDUCED_MOTION_SOURCE_BINDING_MISMATCH");
      }
      await nativeText.prepare?.();
    },
    getSnapshot: (state: unknown, context: import("../contract").RuntimeContext) => hfrLiveTextSnapshot(state, context, nativeText),
  }) : undefined;
  return Object.freeze({
    key: meta.key,
    clock: "renderer" as const,
    ...(textPresentation ? {textPresentation} : {}),
    movie,
    runtime: Object.freeze({...movie, defaultFrameDomain: progressDomain,
      frameDomains: Object.freeze(meta.progressTimeline === 0 ? [] : [Object.freeze({
        id: progressDomain, frameCount: meta.progressFrameCount, fps,
      })])}),
    defaultScenarioByFrameDomain: Object.freeze({root: "hfr", [progressDomain]: "hfr"}),
    scenarios: Object.freeze([Object.freeze({ id: "hfr", label: "Translated ActionScript" })]),
    audioCues: Object.freeze([]),
    lessonHost: HFR_LESSON_HOST,
    maturity: "private-current-js" as const,
    Renderer: HfrPageRenderer,
    getFrameState: (frame: number) => Object.freeze({ frame }),
  });
}
