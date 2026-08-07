"use client";

import React, { useEffect, useState } from "react";

import type {
  AnimationModule,
  AnimationRendererProps,
  RuntimeContext,
} from "../contract";
import {getG4L3MainTimelineAudioCandidate} from "../g4-l3-main-timeline-audio.generated";
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

interface CanvasAsset {
  readonly ready: () => Promise<void>;
  readonly render: (
    canvas: HTMLCanvasElement,
    request: { frame: number; scenario: string; lang: string; seed: number },
  ) => unknown;
}

declare global {
  interface Window {
    HELP_MATH_CANVAS_ASSETS?: Record<string, CanvasAsset>;
  }
}

let assetLoadPromise: Promise<CanvasAsset> | null = null;

function loadCanvasAsset(): Promise<CanvasAsset> {
  const registered = window.HELP_MATH_CANVAS_ASSETS?.[ANIMATION_ID];
  if (registered) return Promise.resolve(registered);
  if (assetLoadPromise) return assetLoadPromise;
  assetLoadPromise = new Promise<CanvasAsset>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[data-help-math-canvas-asset="${ANIMATION_ID}"]`,
    );
    const script = existing ?? document.createElement("script");
    const finish = () => {
      const asset = window.HELP_MATH_CANVAS_ASSETS?.[ANIMATION_ID];
      if (asset) resolve(asset);
      else
        reject(
          new Error(
            "Canvas asset loaded without registering the expected animation",
          ),
        );
    };
    script.onload = finish;
    script.onerror = () =>
      reject(new Error("The local Canvas asset could not be loaded"));
    if (!existing) {
      script.async = true;
      script.dataset.helpMathCanvasAsset = ANIMATION_ID;
      script.src = ASSET_SOURCE;
      document.head.appendChild(script);
    } else if (window.HELP_MATH_CANVAS_ASSETS?.[ANIMATION_ID]) finish();
  }).catch((error) => {
    assetLoadPromise = null;
    throw error;
  });
  return assetLoadPromise;
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

type CanvasStatus = "idle" | "loading" | "ready" | "error";

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
}: AnimationRendererProps) {
  const deterministicState = isFrameState(state)
    ? state
    : getCourseG04L03In009FrameState(frame, {
        frameDomain,
        lang,
        scenario,
        seed,
      });
  const [canvasStatus, setCanvasStatus] = useState<CanvasStatus>("idle");

  useEffect(() => {
    const canvas = document.querySelector<HTMLCanvasElement>(
      `canvas[data-course-canvas="${ANIMATION_ID}"]`,
    );
    if (!canvas || deterministicState.status !== "ready") {
      setCanvasStatus("idle");
      return;
    }
    let cancelled = false;
    setCanvasStatus("loading");
    loadCanvasAsset()
      .then(async (asset) => {
        await asset.ready();
        if (cancelled) return;
        const renderRequest = {
          frame: deterministicState.frame,
          frameDomain: deterministicState.frameDomain,
          scenario: deterministicState.scenario,
          lang: deterministicState.language,
          seed: deterministicState.seed,
        };
        asset.render(canvas, renderRequest);
        setCanvasStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setCanvasStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [
    deterministicState.frame,
    deterministicState.frameDomain,
    deterministicState.language,
    deterministicState.scenario,
    deterministicState.seed,
    deterministicState.status,
  ]);

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
      style={{ margin: "0 auto", maxWidth: 800, width: "100%" }}
    >
      <div
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
              height={600}
              role="img"
              style={{
                aspectRatio: "4 / 3",
                display: canvasStatus === "ready" ? "block" : "none",
                height: "auto",
                width: "100%",
              }}
              width={800}
            />
            {canvasStatus === "loading" ? (
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
