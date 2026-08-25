"use client";

import React, {useCallback, useMemo, useRef} from "react";

import type {
  AnimationModule,
  AnimationRendererProps,
  RuntimeContext,
} from "../contract";
import {getG4L3MainTimelineAudioCandidate} from "../g4-l3-main-timeline-audio.generated";
import {getAdaptiveCanvasProductionBinding} from "../adaptive-canvas-production-bindings.generated";
import {
  resolveAdaptiveCanvasPageAsset,
  stampAdaptiveCanvasCaptureIdentity,
  type AdaptiveCanvasAssetDescriptor,
  type AdaptiveCanvasPresentationStatus,
  type AdaptiveCanvasRendererBindingProps,
} from "../adaptive-canvas-presenter";
import {useAdaptiveCanvasPresenter} from "../use-adaptive-canvas-presenter";
import {
  COURSE_G04_L03_IN_009_MOVIE,
  COURSE_G04_L03_IN_009_RUNTIME,
  COURSE_G04_L03_IN_009_SOURCE_CONTRACT,
  getCourseG04L03In009FrameState,
  type CourseG04L03In009FrameState,
} from "../timelines/course-g04-l03-in-009";

const ANIMATION_ID = "course-g04-l03-in-009";
const ASSET_SOURCE =
  "/flash-assets/courses/course-g04-l03-in-009/canvas-renderer.js";
const AUDIO_CANDIDATE =
  getG4L3MainTimelineAudioCandidate(ANIMATION_ID);
const LEGACY_CANVAS_ASSET: AdaptiveCanvasAssetDescriptor = Object.freeze({
  animationId: ANIMATION_ID,
  assetPath: ASSET_SOURCE,
});
const PRODUCTION_CANVAS_BINDING =
  getAdaptiveCanvasProductionBinding(ANIMATION_ID);

interface CanvasRuntimeState {
  readonly frameDomain: string;
  readonly localFrame: number;
  readonly rootFrame: number;
  readonly scenario: string;
  readonly lang: string;
  readonly seed: number;
  readonly audioRendered: false;
}

function isFrameState(value: unknown): value is CourseG04L03In009FrameState {
  return Boolean(
    value &&
    typeof value === "object" &&
    "frame" in value &&
    "status" in value &&
    "frameDomain" in value,
  );
}

function blockerCopy(state: CourseG04L03In009FrameState): {
  title: string;
  detail: string;
} {
  if (state.blocker === "unsupported-runtime-request") {
    return {
      title: "Unsupported deterministic request",
      detail:
        "This frame-domain or scenario identity is not declared by the source-bound migration contract, so rendering is intentionally disabled.",
    };
  }
  if (state.blocker === "frame-domain-scenario-mismatch") {
    return {
      title: "Frame-domain scenario mismatch",
      detail:
        "The root-standalone scenario belongs only to the 10-frame root timeline; the default and glossary scenarios belong only to sprite-200.",
    };
  }
  const term =
    state.blocker === "temperature-glossary-host-contract-unresolved"
      ? "Temperature"
      : "Measure";
  return {
    title: `${term} glossary action unavailable`,
    detail:
      "The source calls its parent HELP Math glossary host and stops a parent-owned animation. That host contract and exact hit geometry remain unresolved, so this action is intentionally disabled.",
  };
}

function isCanvasRuntimeState(value: unknown): value is CanvasRuntimeState {
  return Boolean(
    value &&
      typeof value === "object" &&
      "localFrame" in value &&
      "frameDomain" in value &&
      "scenario" in value &&
      "lang" in value,
  );
}

function verifyRenderedIdentity(
  canvas: HTMLCanvasElement,
  rendered: unknown,
  expected: CourseG04L03In009FrameState,
) {
  if (
    !isCanvasRuntimeState(rendered) ||
    rendered.localFrame !== expected.frame ||
    rendered.frameDomain !== expected.frameDomain ||
    rendered.rootFrame !== expected.rootFrame ||
    rendered.scenario !== expected.scenario ||
    rendered.lang !== expected.language ||
    rendered.seed !== expected.seed ||
    rendered.audioRendered !== false
  ) {
    throw new Error("IN009 Canvas returned a mismatched deterministic identity");
  }
  const expectedAttributes = {
    "data-flash-frame": String(expected.frame),
    "data-flash-frame-domain": expected.frameDomain,
    "data-flash-root-frame": String(expected.rootFrame),
    "data-runtime-language": expected.language,
    "data-runtime-scenario": expected.scenario,
    "data-runtime-seed": String(expected.seed),
  };
  for (const [name, value] of Object.entries(expectedAttributes)) {
    if (canvas.getAttribute(name) !== value) {
      throw new Error(`IN009 Canvas did not stamp the expected ${name}`);
    }
  }
}

type CanvasStatus = AdaptiveCanvasPresentationStatus;

export function buildCourseG04L03In009CaptureAttributes({
  canvasStatus,
  entryStateSha256,
  requirementId,
  state,
  traceId,
}: {
  canvasStatus: CanvasStatus;
  entryStateSha256: string;
  requirementId: string;
  state: CourseG04L03In009FrameState;
  traceId: string;
}) {
  const visualReady = state.status === "ready" && canvasStatus === "ready";
  const captureReady =
    visualReady && Boolean(entryStateSha256 && requirementId && traceId);
  return {
    "data-animation-id": ANIMATION_ID,
    "data-capture-stage": captureReady ? "true" : undefined,
    "data-render-state": visualReady ? "ready" : canvasStatus,
    "data-render-visual": visualReady ? "true" : undefined,
    "data-flash-entry-state-sha256": entryStateSha256 || undefined,
    "data-flash-frame": state.frame,
    "data-flash-frame-domain": state.frameDomain,
    "data-flash-lang": state.language,
    "data-flash-requirement-id": requirementId || undefined,
    "data-flash-root-frame": state.rootFrame,
    "data-flash-scenario": state.scenario,
    "data-flash-seed": state.seed,
    "data-flash-trace-id": traceId || undefined,
    "data-runtime-language": state.language,
    "data-runtime-scenario": state.scenario,
    "data-runtime-seed": state.seed,
  } as const;
}

export function CourseG04L03In009Renderer({
  adaptiveCanvasBinding,
  entryStateSha256 = "",
  frame,
  frameDomain,
  lang,
  onReplay,
  requirementId = "",
  scenario,
  seed,
  state,
  traceId = "",
}: AnimationRendererProps & AdaptiveCanvasRendererBindingProps) {
  const deterministicState = isFrameState(state)
    ? state
    : getCourseG04L03In009FrameState(frame, {
        frameDomain,
        lang,
        scenario,
        seed,
      });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasHostRef = useRef<HTMLElement>(null);
  const canvasStageRef = useRef<HTMLDivElement>(null);
  const canvasAsset = resolveAdaptiveCanvasPageAsset({
    animationId: ANIMATION_ID,
    explicitBinding: adaptiveCanvasBinding,
    legacyAsset: LEGACY_CANVAS_ASSET,
    productionBinding: PRODUCTION_CANVAS_BINDING,
  });
  const renderRequest = useMemo(() => Object.freeze({
    frame: deterministicState.frame,
    frameDomain: deterministicState.frameDomain,
    scenario: deterministicState.scenario,
    lang: deterministicState.language,
    seed: deterministicState.seed,
  }), [
    deterministicState.frame,
    deterministicState.frameDomain,
    deterministicState.language,
    deterministicState.scenario,
    deterministicState.seed,
  ]);
  const visualKey = JSON.stringify([
    ANIMATION_ID,
    deterministicState.frame,
    deterministicState.frameDomain,
    deterministicState.rootFrame,
    deterministicState.scenario,
    deterministicState.language,
    deterministicState.seed,
  ]);
  const requestKey = JSON.stringify([
    visualKey,
    entryStateSha256,
    requirementId,
    traceId,
  ]);
  const captureIdentityComplete = Boolean(
    entryStateSha256 && requirementId && traceId,
  );
  const verifyPresentedIdentity = useCallback((
    canvas: HTMLCanvasElement,
    rendered: unknown,
  ) => {
    verifyRenderedIdentity(canvas, rendered, deterministicState);
    stampAdaptiveCanvasCaptureIdentity(canvas, {
      entryStateSha256,
      frame: deterministicState.frame,
      frameDomain: deterministicState.frameDomain,
      lang: deterministicState.language,
      requirementId,
      rootFrame: deterministicState.rootFrame,
      scenario: deterministicState.scenario,
      seed: deterministicState.seed,
      traceId,
    });
  }, [deterministicState, entryStateSha256, requirementId, traceId]);
  const canvasPresentation = useAdaptiveCanvasPresenter({
    active: deterministicState.status === "ready",
    asset: canvasAsset,
    captureReady: captureIdentityComplete,
    hostRef: canvasHostRef,
    nativeHeight: 600,
    nativeWidth: 800,
    renderRequest,
    requestKey,
    sourceBitmapBound: canvasAsset.sourceBitmapResolutionBound,
    stageRef: canvasStageRef,
    verifyRendered: verifyPresentedIdentity,
    visibleCanvasRef: canvasRef,
    visualKey,
  });
  const canvasStatus = canvasPresentation.status;

  const blocked =
    deterministicState.status === "blocked"
      ? blockerCopy(deterministicState)
      : null;

  return (
    <section
      aria-label="Situations with Negative Numbers: Temperature"
      data-audio-rendered="false"
      data-candidate-status="engineering-not-strict"
      data-canvas-status={blocked ? "blocked" : canvasStatus}
      data-flash-frame={deterministicState.frame}
      data-flash-frame-domain={deterministicState.frameDomain}
      data-flash-root-frame={deterministicState.rootFrame}
      data-runtime-language={deterministicState.language}
      data-runtime-scenario={deterministicState.scenario}
      data-runtime-seed={deterministicState.seed}
      data-spanish-audio-status={
        COURSE_G04_L03_IN_009_SOURCE_CONTRACT.externalSpanishAudio.status
      }
      data-visual-localization-status={
        COURSE_G04_L03_IN_009_SOURCE_CONTRACT.visualLocalization.status
      }
      ref={canvasHostRef}
      style={{margin: "0 auto", maxWidth: 800, width: "100%"}}
    >
      <div
        ref={canvasStageRef}
        style={{
          aspectRatio: "4 / 3",
          background: "#b8d8f7",
          overflow: "hidden",
          position: "relative",
          width: "100%",
        }}
      >
        {blocked ? (
          <div
            aria-live="polite"
            data-fail-closed-reason={deterministicState.blocker ?? undefined}
            role="status"
            style={{
              alignItems: "center",
              background: "#eaf4fb",
              color: "#17344c",
              display: "flex",
              flexDirection: "column",
              height: "100%",
              justifyContent: "center",
              padding: "8%",
              textAlign: "center",
            }}
          >
            <strong>{blocked.title}</strong>
            <p>{blocked.detail}</p>
          </div>
        ) : (
          <>
            <canvas
              {...buildCourseG04L03In009CaptureAttributes({
                canvasStatus,
                entryStateSha256,
                requirementId,
                state: deterministicState,
                traceId,
              })}
              aria-label={`Source-derived ${deterministicState.frameDomain} animation, frame ${deterministicState.frame} of ${deterministicState.frameDomain === "root" ? 10 : 637}`}
              className="faithful-stage-wrap"
              data-course-canvas={ANIMATION_ID}
              data-flash-frame={deterministicState.frame}
              data-flash-frame-domain={deterministicState.frameDomain}
              data-flash-root-frame={deterministicState.rootFrame}
              data-runtime-language={deterministicState.language}
              data-runtime-scenario={deterministicState.scenario}
              data-runtime-seed={deterministicState.seed}
              data-canvas-backing-height={
                canvasPresentation.resolution.backingStage.height
              }
              data-canvas-backing-width={
                canvasPresentation.resolution.backingStage.width
              }
              data-render-scale={canvasPresentation.resolution.renderScale}
              data-resolution-ceiling-reached={
                String(canvasPresentation.resolution.demandCapped)
              }
              data-resolution-status={canvasPresentation.resolution.status}
              height={600}
              ref={canvasRef}
              role="img"
              style={{
                aspectRatio: "4 / 3",
                display: canvasPresentation.hasPresentedFrame
                  ? "block"
                  : "none",
                height: "auto",
                width: "100%",
              }}
              width={800}
            />
            {canvasStatus === "loading" || canvasStatus === "idle" ? (
              <span
                aria-live="polite"
                role="status"
                style={{ left: 12, position: "absolute", top: 12 }}
              >
                Loading source-derived drawing…
              </span>
            ) : null}
            {canvasStatus === "error" ? (
              <p
                aria-live="assertive"
                role="alert"
                style={{
                  background: "#fff",
                  inset: 0,
                  margin: 0,
                  padding: "10%",
                  position: "absolute",
                }}
              >
                The local drawing asset failed safely. No legacy or remote
                fallback was executed.
              </p>
            ) : null}
          </>
        )}
      </div>
      <div
        aria-label="Candidate controls and limitations"
        style={{
          alignItems: "center",
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          paddingTop: 10,
        }}
      >
        <button onClick={onReplay} type="button">
          Replay
        </button>
        <span>
          Modern candidate reset control only; source reload intent is known,
          but complete audio and overlay reset parity remains unresolved.
        </span>
      </div>
    </section>
  );
}

const animationModule: AnimationModule<CourseG04L03In009FrameState> =
  Object.freeze({
    key: ANIMATION_ID,
    movie: COURSE_G04_L03_IN_009_MOVIE,
    runtime: COURSE_G04_L03_IN_009_RUNTIME,
    playbackMode: "loop",
    playbackEndFrameByDomain: Object.freeze({ root: 1, "sprite-200": 637 }),
    reducedMotionFrame: 1,
    defaultScenarioByFrameDomain: Object.freeze({ root: "root-standalone", "sprite-200": "default" }),
    scenarios: Object.freeze([
      Object.freeze({
        id: "default",
        label: "Default source-shared untranslated linear visual",
        description:
          "Source-derived sprite-200 frame domain shared by English and Spanish routes; the visual is untranslated, source-exact audio is host-wired as an unaccepted candidate, and host interactions remain disabled.",
      }),
      Object.freeze({
        id: "root-standalone",
        label: "Standalone root frame-accurate source-shared visual",
        description:
          "Direct frame addressing for the shared untranslated visual, backed by the 10-frame Adobe standalone baseline; natural preloader playback and Spanish audio are not claimed.",
      }),
      Object.freeze({
        id: "glossary-temperature-unavailable",
        label: "Temperature glossary (blocked)",
        description:
          "Preserves the source obligation while failing closed on unresolved host behavior.",
      }),
      Object.freeze({
        id: "glossary-measure-unavailable",
        label: "Measure glossary (blocked)",
        description:
          "Preserves the source obligation while failing closed on unresolved host behavior.",
      }),
    ]),
    audioCues: AUDIO_CANDIDATE?.audioCues ?? Object.freeze([]),
    ...(AUDIO_CANDIDATE
      ? {audioTracks: AUDIO_CANDIDATE.audioTracks}
      : {}),
    maturity: "legacy-prototype",
    Renderer: CourseG04L03In009Renderer,
    getFrameState: (frame: number, context: RuntimeContext) =>
      getCourseG04L03In009FrameState(frame, context),
  });

export default animationModule;
