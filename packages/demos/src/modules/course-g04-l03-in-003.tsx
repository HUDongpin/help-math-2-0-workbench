"use client";

import React, {useEffect, useRef, useState} from "react";

import type {
  AnimationModule,
  AnimationRendererProps,
  RuntimeContext,
} from "../contract";
import {getG4L3MainTimelineAudioCandidate} from "../g4-l3-main-timeline-audio.generated";
import {
  COURSE_G04_L03_IN_003_MOVIE,
  COURSE_G04_L03_IN_003_RUNTIME,
  COURSE_G04_L03_IN_003_SOURCE_CONTRACT,
  getCourseG04L03In003FrameState,
  type CourseG04L03In003FrameState,
} from "../timelines/course-g04-l03-in-003";

const ANIMATION_ID = "course-g04-l03-in-003";
const ASSET_SOURCE =
  "/flash-assets/courses/course-g04-l03-in-003/canvas-renderer.js";
const AUDIO_CANDIDATE =
  getG4L3MainTimelineAudioCandidate(ANIMATION_ID);

interface CanvasRuntimeState {
  readonly frameDomain: string;
  readonly localFrame: number;
  readonly rootFrame: number;
  readonly scenario: string;
  readonly lang: string;
  readonly seed: number;
  readonly audioRendered: false;
}

interface CanvasAsset {
  readonly ready: () => Promise<void>;
  readonly render: (
    canvas: HTMLCanvasElement,
    request: {
      frame: number;
      scenario: string;
      lang: string;
      seed: number;
    },
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

function isFrameState(value: unknown): value is CourseG04L03In003FrameState {
  return Boolean(
    value &&
      typeof value === "object" &&
      "frame" in value &&
      "status" in value &&
      "frameDomain" in value,
  );
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
  expected: CourseG04L03In003FrameState,
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
    throw new Error("Canvas asset returned a mismatched deterministic identity");
  }
  const expectedAttributes = {
    "data-flash-frame": String(expected.frame),
    "data-flash-frame-domain": expected.frameDomain,
    "data-flash-root-frame": String(expected.rootFrame),
    "data-runtime-scenario": expected.scenario,
    "data-runtime-seed": String(expected.seed),
  };
  for (const [name, expectedValue] of Object.entries(expectedAttributes)) {
    if (canvas.getAttribute(name) !== expectedValue) {
      throw new Error(`Canvas asset did not stamp the expected ${name}`);
    }
  }
  canvas.setAttribute("data-runtime-language", expected.language);
}

function blockerCopy(state: CourseG04L03In003FrameState): {
  title: string;
  detail: string;
} {
  if (state.blocker === "root-baseline-unavailable") {
    return {
      title: "Root timeline unavailable",
      detail:
        "The 10-frame source root and InternalPreloader entry do not yet have an authoritative original-runtime baseline, so this domain is intentionally disabled.",
    };
  }
  if (state.blocker === "spanish-visual-and-audio-unvalidated") {
    return {
      title: "Spanish path unavailable",
      detail:
        "The associated Spanish MP3 is hash-bound but its cue, synchronization, listening, and matching visual-language behavior are unvalidated, so this candidate fails closed.",
    };
  }
  if (state.blocker === "frame-domain-scenario-mismatch") {
    return {
      title: "Frame-domain scenario mismatch",
      detail:
        "The source-static scenario belongs only to sprite-84; the root-unavailable scenario belongs only to the source root.",
    };
  }
  return {
    title: "Unsupported deterministic request",
    detail:
      "This frame-domain or scenario identity is outside the source-bound engineering contract, so rendering is intentionally disabled.",
  };
}

type CanvasStatus = "idle" | "loading" | "ready" | "error";

export function buildCourseG04L03In003CaptureAttributes({
  canvasStatus,
  entryStateSha256,
  requirementId,
  state,
  traceId,
}: {
  canvasStatus: CanvasStatus;
  entryStateSha256: string;
  requirementId: string;
  state: CourseG04L03In003FrameState;
  traceId: string;
}) {
  const visualReady = state.status === "ready" && canvasStatus === "ready";
  const captureReady =
    visualReady && Boolean(entryStateSha256 && requirementId && traceId);
  return {
    "data-animation-id": ANIMATION_ID,
    "data-candidate-status": "source-static-engineering-not-strict",
    "data-capture-stage": captureReady ? "true" : undefined,
    "data-render-state": visualReady ? "ready" : canvasStatus,
    "data-render-visual": visualReady ? "true" : undefined,
    "data-flash-entry-state-sha256": entryStateSha256 || undefined,
    "data-flash-frame": state.frame,
    "data-flash-frame-domain": state.frameDomain,
    "data-flash-requirement-id": requirementId || undefined,
    "data-flash-root-frame": state.rootFrame,
    "data-flash-trace-id": traceId || undefined,
    "data-runtime-language": state.language,
    "data-runtime-scenario": state.scenario,
    "data-runtime-seed": state.seed,
  } as const;
}

export function CourseG04L03In003Renderer({
  entryStateSha256 = "",
  frame,
  frameDomain,
  lang,
  requirementId = "",
  scenario,
  seed,
  state,
  traceId = "",
}: AnimationRendererProps) {
  const deterministicState = isFrameState(state)
    ? state
    : getCourseG04L03In003FrameState(frame, {
        frameDomain,
        lang,
        scenario,
        seed,
      });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasStatus, setCanvasStatus] = useState<CanvasStatus>("idle");

  useEffect(() => {
    const canvas = canvasRef.current;
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
        const rendered = asset.render(canvas, {
          frame: deterministicState.frame,
          scenario: deterministicState.scenario,
          lang: deterministicState.language,
          seed: deterministicState.seed,
        });
        verifyRenderedIdentity(canvas, rendered, deterministicState);
        if (!cancelled) setCanvasStatus("ready");
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
    deterministicState.rootFrame,
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
      aria-label="Numbers on the Number Line"
      data-audio-rendered="false"
      data-authoritative-runtime-validated="false"
      data-candidate-status="source-static-engineering-not-strict"
      data-canvas-status={blocked ? "blocked" : canvasStatus}
      data-human-visual-review-accepted="false"
      data-owner-accepted="false"
      data-strict-migration-complete="false"
      style={{margin: "0 auto", maxWidth: 800, width: "100%"}}
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
              {...buildCourseG04L03In003CaptureAttributes({
                canvasStatus,
                entryStateSha256,
                requirementId,
                state: deterministicState,
                traceId,
              })}
              aria-label={`Source-static sprite-84 drawing, frame ${deterministicState.frame} of 472`}
              className="faithful-stage-wrap"
              data-course-canvas={ANIMATION_ID}
              height={600}
              ref={canvasRef}
              role="img"
              style={{
                aspectRatio: "4 / 3",
                display: canvasStatus === "ready" ? "block" : "none",
                height: "auto",
                width: "100%",
              }}
              width={800}
            />
            {canvasStatus === "loading" || canvasStatus === "idle" ? (
              <span
                aria-live="polite"
                role="status"
                style={{left: 12, position: "absolute", top: 12}}
              >
                Loading source-static drawing…
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
      <p data-source-replay-parity="unvalidated">
        Engineering preview only. Source-exact audio is host-wired as an
        unaccepted candidate; Spanish visual parity, source Replay parity,
        original-runtime synchronization, visual review, and acceptance are
        not claimed.
      </p>
    </section>
  );
}

const animationModule: AnimationModule<CourseG04L03In003FrameState> =
  Object.freeze({
    key: ANIMATION_ID,
    movie: COURSE_G04_L03_IN_003_MOVIE,
    runtime: COURSE_G04_L03_IN_003_RUNTIME,
    playbackMode: "loop",
    playbackEndFrameByDomain: Object.freeze({root: 1, "sprite-84": 472}),
    reducedMotionFrame: 1,
    defaultScenarioByFrameDomain: Object.freeze({
      root: "root-unavailable",
      "sprite-84": "source-static-frame",
    }),
    scenarios: Object.freeze([
      Object.freeze({
        id: "source-static-frame",
        label: "English source-static drawing",
        description:
          "Hash-bound FFDec drawing frames for sprite-84 with source-exact host audio candidate; accepted audio parity and natural runtime behavior remain excluded.",
      }),
      Object.freeze({
        id: "root-unavailable",
        label: "Root timeline (blocked)",
        description:
          "Records the root-domain obligation while failing closed without an authoritative original-runtime baseline.",
      }),
    ]),
    audioCues: AUDIO_CANDIDATE?.audioCues ?? Object.freeze([]),
    ...(AUDIO_CANDIDATE
      ? {audioTracks: AUDIO_CANDIDATE.audioTracks}
      : {}),
    maturity: "legacy-prototype",
    Renderer: CourseG04L03In003Renderer,
    getFrameState: (frame: number, context: RuntimeContext) =>
      getCourseG04L03In003FrameState(frame, context),
  });

export {COURSE_G04_L03_IN_003_SOURCE_CONTRACT};
export default animationModule;
