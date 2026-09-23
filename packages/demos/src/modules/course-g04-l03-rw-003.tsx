"use client";

import React, {useEffect, useRef, useState} from "react";

import type {
  AnimationModule,
  AnimationRendererProps,
  RuntimeContext,
} from "../contract";
import {
  retainedCanvasStatus,
  sourceStaticCanvasVisualKey,
  type SourceStaticCanvasStatus,
} from "../source-static-canvas-candidate";
import {createCourseG04L03SourceGlossaryCandidate} from "./course-g04-l03-source-glossary-candidate";
import {
  COURSE_G04_L03_RW_003_GLOSSARY_CONFIG,
  COURSE_G04_L03_RW_003_GLOSSARY_HOTSPOTS,
  COURSE_G04_L03_RW_003_MOVIE,
  COURSE_G04_L03_RW_003_RUNTIME,
  COURSE_G04_L03_RW_003_SOURCE_CONTRACT as COURSE_G04_L03_RW_003_BASE_SOURCE_CONTRACT,
  getCourseG04L03Rw003FrameState,
  type CourseG04L03Rw003FrameState,
} from "../timelines/course-g04-l03-rw-003";

const ANIMATION_ID = "course-g04-l03-rw-003";
const ASSET_SOURCE =
  "/flash-assets/courses/course-g04-l03-rw-003/canvas-renderer.js";

interface CanvasRuntimeState {
  readonly frameDomain: string;
  readonly localFrame: number;
  readonly rootFrame: number;
  readonly scenario: string;
  readonly lang: string;
  readonly seed: number;
  readonly interactiveStateResolved: false;
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

function isFrameState(value: unknown): value is CourseG04L03Rw003FrameState {
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
  expected: CourseG04L03Rw003FrameState,
) {
  if (
    !isCanvasRuntimeState(rendered) ||
    rendered.localFrame !== expected.frame ||
    rendered.frameDomain !== expected.frameDomain ||
    rendered.rootFrame !== expected.rootFrame ||
    rendered.scenario !== expected.scenario ||
    rendered.lang !== expected.language ||
    rendered.seed !== expected.seed ||
    rendered.interactiveStateResolved !== false ||
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

function blockerCopy(state: CourseG04L03Rw003FrameState): {
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
  if (state.blocker === "companion-domain-unrendered") {
    return {
      title: "Companion timeline unavailable",
      detail:
        "The one-frame sprite-53 page-title companion is source-inventoried but has not been composited or validated, so this domain is intentionally disabled.",
    };
  }
  if (state.blocker === "spanish-visual-and-audio-unvalidated") {
    return {
      title: "Spanish path unavailable",
      detail:
        "The source-exact Spanish MP3 is available through a host audio control, but its original cue, synchronization, listening, and matching visual-language behavior are unvalidated, so the visual candidate fails closed.",
    };
  }
  if (state.blocker === "frame-domain-scenario-mismatch") {
    return {
      title: "Frame-domain scenario mismatch",
      detail:
        "Each source-static, root, and companion scenario belongs only to its declared source frame domain.",
    };
  }
  return {
    title: "Unsupported deterministic request",
    detail:
      "This frame-domain or scenario identity is outside the source-bound engineering contract, so rendering is intentionally disabled.",
  };
}

export function buildCourseG04L03Rw003CaptureAttributes({
  canvasStatus,
  entryStateSha256,
  requirementId,
  state,
  traceId,
}: {
  canvasStatus: SourceStaticCanvasStatus;
  entryStateSha256: string;
  requirementId: string;
  state: CourseG04L03Rw003FrameState;
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
    "data-source-button-visuals": state.visibleSourceButtonVisuals.join(","),
    "data-source-controls-enabled": "false",
  } as const;
}

function CourseG04L03Rw003SourceStaticRenderer({
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
    : getCourseG04L03Rw003FrameState(frame, {
        frameDomain,
        lang,
        scenario,
        seed,
      });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasStatus, setCanvasStatus] =
    useState<SourceStaticCanvasStatus>("idle");
  const [renderedVisualKey, setRenderedVisualKey] = useState<string | null>(
    null,
  );
  const requestedVisualKey = sourceStaticCanvasVisualKey({
    animationId: ANIMATION_ID,
    ...deterministicState,
  });
  const reportedCanvasStatus = retainedCanvasStatus({
    canvasStatus,
    renderedVisualKey,
    requestedVisualKey,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || deterministicState.status !== "ready") {
      setRenderedVisualKey(null);
      setCanvasStatus("idle");
      return;
    }
    let cancelled = false;
    // The first frame may use the blue loading plane, but an already-painted
    // frame must stay visible while the next deterministic frame is prepared.
    // Demoting `ready` to `loading` hid the Canvas on every 12 fps tick and
    // exposed that plane, producing a full-stage blue flash. `updating` also
    // withholds capture readiness, so the retained bitmap is never presented
    // as evidence for the requested frame before the atomic draw completes.
    setCanvasStatus((current) =>
      current === "ready" || current === "updating" ? "updating" : "loading",
    );
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
        if (!cancelled) {
          setRenderedVisualKey(requestedVisualKey);
          setCanvasStatus("ready");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRenderedVisualKey(null);
          setCanvasStatus("error");
        }
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
    requestedVisualKey,
  ]);

  const blocked =
    deterministicState.status === "blocked"
      ? blockerCopy(deterministicState)
      : null;

  return (
    <section
      aria-label="G4 L3 Your World, Page 2"
      data-audio-rendered="false"
      data-authoritative-runtime-validated="false"
      data-candidate-status="source-static-engineering-not-strict"
      data-canvas-status={blocked ? "blocked" : reportedCanvasStatus}
      data-human-visual-review-accepted="false"
      data-interactive-controls-enabled="false"
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
              {...buildCourseG04L03Rw003CaptureAttributes({
                canvasStatus: reportedCanvasStatus,
                entryStateSha256,
                requirementId,
                state: deterministicState,
                traceId,
              })}
              aria-label={`Source-static sprite-49 drawing, frame ${deterministicState.frame} of 278; Canvas button behavior disabled`}
              className="faithful-stage-wrap"
              data-course-canvas={ANIMATION_ID}
              height={600}
              ref={canvasRef}
              role="img"
              style={{
                aspectRatio: "4 / 3",
                display:
                  reportedCanvasStatus === "ready" ||
                    reportedCanvasStatus === "updating"
                    ? "block"
                    : "none",
                height: "auto",
                pointerEvents: "none",
                width: "100%",
              }}
              width={800}
            />
            {reportedCanvasStatus === "loading" ||
            reportedCanvasStatus === "idle" ? (
              <span
                aria-live="polite"
                role="status"
                style={{left: 12, position: "absolute", top: 12}}
              >
                Loading source-static drawing…
              </span>
            ) : null}
            {reportedCanvasStatus === "error" ? (
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
      <p data-source-interaction-parity="unvalidated">
        Engineering preview only. The Canvas button visuals remain inert; a
        modern host may layer source-bound controls. Accepted audio parity,
        Spanish visual parity, source Replay parity, original-runtime parity,
        visual review, and acceptance are not claimed.
      </p>
    </section>
  );
}

const animationModule: AnimationModule<CourseG04L03Rw003FrameState> =
  Object.freeze({
    key: ANIMATION_ID,
    movie: COURSE_G04_L03_RW_003_MOVIE,
    runtime: COURSE_G04_L03_RW_003_RUNTIME,
    playbackMode: "once",
    playbackEndFrameByDomain: Object.freeze({root: 1, "sprite-53": 1}),
    reducedMotionFrame: 1,
    defaultScenarioByFrameDomain: Object.freeze({
      root: "root-unavailable",
      "sprite-49": "source-static-frame",
      "sprite-53": "source-companion-unavailable",
    }),
    scenarios: Object.freeze([
      Object.freeze({
        id: "source-static-frame",
        label: "English source-static drawing",
        description:
          "Hash-bound FFDec drawing frames for sprite-49; source button actions and natural runtime behavior remain excluded. Source-exact audio is host-wired as an unaccepted engineering candidate.",
      }),
      Object.freeze({
        id: "root-unavailable",
        label: "Root timeline (blocked)",
        description:
          "Records the root-domain obligation while failing closed without an authoritative original-runtime baseline.",
      }),
      Object.freeze({
        id: "source-companion-unavailable",
        label: "Companion sprite-53 (blocked)",
        description:
          "Records the one-frame page-title companion while failing closed without validated root compositing.",
      }),
    ]),
    audioCues: Object.freeze([
      Object.freeze({
        id: "course-g04-l03-rw-003-embedded-stream-0001",
        sourceCueId: "embedded-stream-0001",
        frame: 8,
        endFrame: 279,
        frameDomain: "sprite-49",
        language: "en",
        scenario: "source-static-frame",
        source:
          "/flash-assets/courses/course-g04-l03-rw-003/audio/embedded-stream-0001.mp3",
        durationMs: 22_438,
        sha256:
          "aab5bc0e259d399db150b266423be6a25161533bc094d081ec5729ec234af8f2",
        spokenLanguage: "undetermined",
      }),
    ]),
    audioTracks: Object.freeze([
      Object.freeze({
        id: "course-g04-l03-rw-003-spanish-host-narration",
        language: "es",
        label: "Audio en español",
        source:
          "/flash-assets/courses/course-g04-l03-rw-003/audio/spanish-host-narration.mp3",
        durationMs: 17_952,
        sha256:
          "ea0a0922b90a9e612814a4b69ede2b687660b1e0adeadac91870e77f092f0975",
        activation: "user",
        visibleWhen: Object.freeze(["es"] as const),
        frameDomains: Object.freeze(["sprite-49"]),
        timelineBehavior: "pause-while-playing",
      }),
    ]),
    maturity: "legacy-prototype",
    Renderer: CourseG04L03Rw003SourceStaticRenderer,
    getFrameState: (frame: number, context: RuntimeContext) =>
      getCourseG04L03Rw003FrameState(frame, context),
  });

const candidate = createCourseG04L03SourceGlossaryCandidate(
  Object.freeze({
    Renderer: CourseG04L03Rw003SourceStaticRenderer,
    module: animationModule,
    movie: COURSE_G04_L03_RW_003_MOVIE,
    sourceContract: COURSE_G04_L03_RW_003_BASE_SOURCE_CONTRACT,
  }),
  COURSE_G04_L03_RW_003_GLOSSARY_CONFIG,
);

export {COURSE_G04_L03_RW_003_GLOSSARY_HOTSPOTS};
export const COURSE_G04_L03_RW_003_SOURCE_CONTRACT = candidate.sourceContract;
export const CourseG04L03Rw003Renderer = candidate.Renderer;
export default candidate.module;
