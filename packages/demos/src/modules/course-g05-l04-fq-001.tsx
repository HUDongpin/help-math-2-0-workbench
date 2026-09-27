"use client";

import React, {useEffect, useMemo, useRef, useState} from "react";

import type {
  AnimationModule,
  AnimationRendererProps,
} from "../contract";
import {
  COURSE_G05_L04_FQ_001_ANIMATION_ID,
  COURSE_G05_L04_FQ_001_ASSET,
  COURSE_G05_L04_FQ_001_FIXED_COMPANION_DOMAIN,
  COURSE_G05_L04_FQ_001_MAIN_FRAME_DOMAIN,
  COURSE_G05_L04_FQ_001_MOVIE,
  COURSE_G05_L04_FQ_001_RUNTIME,
  COURSE_G05_L04_FQ_001_SCENARIO,
  COURSE_G05_L04_FQ_001_SCENARIOS,
  COURSE_G05_L04_FQ_001_SOURCE,
  COURSE_G05_L04_FQ_001_SOURCE_CONTRACT,
  COURSE_G05_L04_FQ_001_STAGE,
  getCourseG05L04Fq001FrameState,
  type CourseG05L04Fq001Blocker,
  type CourseG05L04Fq001FrameState,
} from "../timelines/course-g05-l04-fq-001";

interface Fq001CanvasAsset {
  readonly metadata: unknown;
  readonly ready: () => Promise<void>;
  readonly render: (
    canvas: HTMLCanvasElement,
    request: {
      readonly frame: number;
      readonly frameDomain: string;
      readonly scenario: string;
      readonly lang: string;
      readonly seed: number;
    },
  ) => unknown;
}

interface Fq001RuntimeState {
  readonly frameDomain: string;
  readonly localFrame: number;
  readonly exportFrame: number;
  readonly rootFrame: number;
  readonly scenario: string;
  readonly lang: string;
  readonly seed: number;
  readonly audioRendered: false;
}

type CanvasStatus = "idle" | "loading" | "ready" | "error";

const assetPromises = new Map<string, Promise<Fq001CanvasAsset>>();

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function sha256Integrity(hex: string) {
  let binary = "";
  for (let index = 0; index < hex.length; index += 2) {
    binary += String.fromCharCode(
      Number.parseInt(hex.slice(index, index + 2), 16),
    );
  }
  return `sha256-${btoa(binary)}`;
}

function canvasRegistry() {
  return (
    globalThis as typeof globalThis & {
      HELP_MATH_CANVAS_ASSETS?: Record<string, Fq001CanvasAsset>;
    }
  ).HELP_MATH_CANVAS_ASSETS;
}

function loadFq001Asset() {
  const asset = COURSE_G05_L04_FQ_001_ASSET;
  const key = `${COURSE_G05_L04_FQ_001_ANIMATION_ID}:${asset.sha256}`;
  const existingPromise = assetPromises.get(key);
  if (existingPromise) return existingPromise;

  const selector =
    `script[data-help-math-canvas-asset="${COURSE_G05_L04_FQ_001_ANIMATION_ID}"]` +
    `[data-help-math-canvas-sha256="${asset.sha256}"]`;
  const existing = document.querySelector<HTMLScriptElement>(selector);
  const source = `${asset.source}?sha256=${asset.sha256}`;
  const expectedAbsoluteSource = new URL(source, document.baseURI).href;
  const integrity = sha256Integrity(asset.sha256);
  if (
    existing &&
    (existing.src !== expectedAbsoluteSource ||
      existing.integrity !== integrity ||
      existing.crossOrigin !== "anonymous")
  ) {
    return Promise.reject(
      new Error("FQ001 Canvas asset has a mismatched integrity binding"),
    );
  }
  const registered = canvasRegistry()?.[COURSE_G05_L04_FQ_001_ANIMATION_ID];
  if (registered && existing) return Promise.resolve(registered);

  const promise = new Promise<Fq001CanvasAsset>((resolve, reject) => {
    const script = existing ?? document.createElement("script");
    const finish = () => {
      const loaded =
        canvasRegistry()?.[COURSE_G05_L04_FQ_001_ANIMATION_ID];
      if (loaded) resolve(loaded);
      else reject(new Error("FQ001 Canvas asset did not register"));
    };
    script.onload = finish;
    script.onerror = () =>
      reject(new Error("FQ001 local Canvas asset could not load"));
    if (!existing) {
      script.async = true;
      script.dataset.helpMathCanvasAsset =
        COURSE_G05_L04_FQ_001_ANIMATION_ID;
      script.dataset.helpMathCanvasSha256 = asset.sha256;
      script.integrity = integrity;
      script.crossOrigin = "anonymous";
      script.src = source;
      document.head.appendChild(script);
    } else if (registered) {
      finish();
    }
  }).catch((error) => {
    assetPromises.delete(key);
    throw error;
  });
  assetPromises.set(key, promise);
  return promise;
}

function isRuntimeState(value: unknown): value is Fq001RuntimeState {
  return Boolean(
    value &&
      typeof value === "object" &&
      "frameDomain" in value &&
      "localFrame" in value &&
      "scenario" in value &&
      "lang" in value,
  );
}

function verifyRuntimeState(
  canvas: HTMLCanvasElement,
  rendered: unknown,
  expected: CourseG05L04Fq001FrameState,
) {
  invariant(
    isRuntimeState(rendered) &&
      rendered.localFrame === expected.frame &&
      rendered.exportFrame === expected.frame - 1 &&
      rendered.frameDomain === COURSE_G05_L04_FQ_001_MAIN_FRAME_DOMAIN &&
      rendered.rootFrame === 6 &&
      rendered.scenario === COURSE_G05_L04_FQ_001_SCENARIO &&
      rendered.lang === "en" &&
      rendered.seed === expected.seed &&
      rendered.audioRendered === false,
    "FQ001 Canvas asset returned a mismatched deterministic identity",
  );
  const expectedAttributes = {
    "data-flash-frame": String(expected.frame),
    "data-flash-frame-domain": COURSE_G05_L04_FQ_001_MAIN_FRAME_DOMAIN,
    "data-flash-root-frame": "6",
    "data-flash-lang": "en",
    "data-flash-scenario": COURSE_G05_L04_FQ_001_SCENARIO,
    "data-flash-seed": String(expected.seed),
  };
  for (const [name, value] of Object.entries(expectedAttributes)) {
    invariant(
      canvas.getAttribute(name) === value,
      `FQ001 Canvas asset did not stamp ${name}`,
    );
  }
}

function hasCompleteCaptureIdentity(state: CourseG05L04Fq001FrameState) {
  return Boolean(
    /^[A-Za-z0-9][A-Za-z0-9._:-]*$/.test(state.requirementId) &&
      /^[A-Za-z0-9][A-Za-z0-9._:-]*$/.test(state.traceId) &&
      /^[a-f0-9]{64}$/.test(state.entryStateSha256),
  );
}

function blockerCopy(blocker: CourseG05L04Fq001Blocker | null) {
  if (blocker === "root-domain-disabled") {
    return {
      title: "Root timeline unavailable",
      detail:
        "The source root and InternalPreloader runtime are outside this deterministic engineering candidate.",
    };
  }
  if (blocker === "companion-standalone-disabled") {
    return {
      title: "Background companion is composite-only",
      detail:
        "Sprite-100 frame 1 is rendered only beneath the requested sprite-145 frame and cannot be requested independently.",
    };
  }
  if (blocker === "spanish-disabled") {
    return {
      title: "Spanish path unavailable",
      detail:
        "No source-proven Spanish visual or exact audio association is enabled.",
    };
  }
  if (blocker === "frame-out-of-range") {
    return {
      title: "Frame unavailable",
      detail: "This candidate exposes only sprite-145 frames 1 through 52.",
    };
  }
  return {
    title: "Unsupported deterministic request",
    detail:
      "The requested frame domain or scenario is outside the hash-bound FQ001 composite contract.",
  };
}

export function CourseG05L04Fq001Renderer({
  entryStateSha256,
  frame,
  frameDomain,
  lang,
  requirementId,
  scenario,
  seed,
  traceId,
}: AnimationRendererProps) {
  const deterministicState = useMemo(
    () =>
      getCourseG05L04Fq001FrameState(frame, {
        entryStateSha256,
        frameDomain,
        lang,
        requirementId,
        scenario,
        seed,
        traceId,
      }),
    [
      entryStateSha256,
      frame,
      frameDomain,
      lang,
      requirementId,
      scenario,
      seed,
      traceId,
    ],
  );
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
    loadFq001Asset()
      .then(async (asset) => {
        await asset.ready();
        if (cancelled) return;
        const rendered = asset.render(canvas, {
          frame: deterministicState.frame,
          frameDomain: COURSE_G05_L04_FQ_001_MAIN_FRAME_DOMAIN,
          scenario: COURSE_G05_L04_FQ_001_SCENARIO,
          lang: "en",
          seed: deterministicState.seed,
        });
        verifyRuntimeState(canvas, rendered, deterministicState);
        const traceAttributes = {
          "data-flash-entry-state-sha256":
            deterministicState.entryStateSha256,
          "data-flash-requirement-id": deterministicState.requirementId,
          "data-flash-trace-id": deterministicState.traceId,
        };
        for (const [name, value] of Object.entries(traceAttributes)) {
          if (value) canvas.setAttribute(name, value);
          else canvas.removeAttribute(name);
        }
        if (!cancelled) setCanvasStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setCanvasStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [deterministicState]);

  const blocked =
    deterministicState.status === "blocked"
      ? blockerCopy(deterministicState.blocker)
      : null;
  const captureReady =
    deterministicState.status === "ready" &&
    canvasStatus === "ready" &&
    hasCompleteCaptureIdentity(deterministicState);

  return (
    <section
      aria-label="Number Lines — Final Quiz introduction"
      data-audio-rendered="false"
      data-authoritative-runtime-validated="false"
      data-candidate-status="source-static-dual-sprite-composite-engineering-not-strict"
      data-canvas-status={blocked ? "blocked" : canvasStatus}
      data-human-visual-review-accepted="false"
      data-interactive-controls-enabled="false"
      data-owner-accepted="false"
      data-strict-migration-complete="false"
      style={{
        margin: "0 auto",
        maxWidth: COURSE_G05_L04_FQ_001_STAGE.width,
        width: "100%",
      }}
    >
      <div
        style={{
          aspectRatio:
            `${COURSE_G05_L04_FQ_001_STAGE.width} / ` +
            COURSE_G05_L04_FQ_001_STAGE.height,
          background: COURSE_G05_L04_FQ_001_STAGE.backgroundColor,
          overflow: "hidden",
          position: "relative",
          width: "100%",
        }}
      >
        {blocked ? (
          <div
            aria-live="polite"
            data-fail-closed-reason={
              deterministicState.blocker ?? undefined
            }
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
              aria-label={
                `Source-static sprite-145 frame ${deterministicState.frame} ` +
                "over fixed sprite-100 frame 1; source controls disabled"
              }
              className="faithful-stage-wrap"
              data-animation-id={COURSE_G05_L04_FQ_001_ANIMATION_ID}
              data-candidate-status="source-static-dual-sprite-composite-engineering-not-strict"
              data-capture-identity-status={
                hasCompleteCaptureIdentity(deterministicState)
                  ? "verified"
                  : "blocked"
              }
              data-capture-stage={captureReady ? "true" : undefined}
              data-course-canvas={COURSE_G05_L04_FQ_001_ANIMATION_ID}
              data-fixed-companion-domain={
                COURSE_G05_L04_FQ_001_FIXED_COMPANION_DOMAIN
              }
              data-fixed-companion-frame="1"
              data-render-state={
                canvasStatus === "ready" ? "ready" : canvasStatus
              }
              data-render-visual={
                canvasStatus === "ready" ? "true" : undefined
              }
              height={COURSE_G05_L04_FQ_001_STAGE.height}
              ref={canvasRef}
              role="img"
              style={{
                aspectRatio:
                  `${COURSE_G05_L04_FQ_001_STAGE.width} / ` +
                  COURSE_G05_L04_FQ_001_STAGE.height,
                display: canvasStatus === "ready" ? "block" : "none",
                height: "auto",
                pointerEvents: "none",
                width: "100%",
              }}
              width={COURSE_G05_L04_FQ_001_STAGE.width}
            />
            {canvasStatus === "loading" || canvasStatus === "idle" ? (
              <span aria-live="polite" role="status">
                Loading source-static composite…
              </span>
            ) : null}
            {canvasStatus === "error" ? (
              <p aria-live="assertive" role="alert">
                The local drawing asset failed safely. No legacy, audio, or
                remote fallback was executed.
              </p>
            ) : null}
          </>
        )}
      </div>
      <p data-source-replay-parity="unvalidated">
        Engineering preview only. Root runtime, source controls, audio,
        Spanish parity, Replay parity, original-runtime parity, RMSE, human
        review, Owner acceptance, strict completion, and publication are not
        claimed.
      </p>
    </section>
  );
}

const module: AnimationModule<CourseG05L04Fq001FrameState> = Object.freeze({
  key: COURSE_G05_L04_FQ_001_ANIMATION_ID,
  movie: COURSE_G05_L04_FQ_001_MOVIE,
  runtime: COURSE_G05_L04_FQ_001_RUNTIME,
  playbackMode: "once",
  playbackEndFrame: 52,
  playbackEndFrameByDomain: Object.freeze({
    root: 1,
    [COURSE_G05_L04_FQ_001_MAIN_FRAME_DOMAIN]: 52,
  }),
  reducedMotionFrame: 1,
  defaultScenarioByFrameDomain: Object.freeze({
    root: "root-unavailable",
    [COURSE_G05_L04_FQ_001_MAIN_FRAME_DOMAIN]:
      COURSE_G05_L04_FQ_001_SCENARIO,
    [COURSE_G05_L04_FQ_001_FIXED_COMPANION_DOMAIN]:
      "sprite-100-standalone-unavailable",
  }),
  scenarios: COURSE_G05_L04_FQ_001_SCENARIOS,
  audioCues: Object.freeze([]),
  maturity: "legacy-prototype",
  Renderer: CourseG05L04Fq001Renderer,
  getFrameState: getCourseG05L04Fq001FrameState,
});

export {
  COURSE_G05_L04_FQ_001_ASSET,
  COURSE_G05_L04_FQ_001_MOVIE,
  COURSE_G05_L04_FQ_001_RUNTIME,
  COURSE_G05_L04_FQ_001_SCENARIOS,
  COURSE_G05_L04_FQ_001_SOURCE,
  COURSE_G05_L04_FQ_001_SOURCE_CONTRACT,
  getCourseG05L04Fq001FrameState,
};

export default module;
