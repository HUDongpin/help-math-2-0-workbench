"use client";

import React, {useEffect, useMemo, useRef, useState} from "react";

import type {
  AnimationLanguage,
  AnimationModule,
  AnimationPlaybackMode,
  AnimationRendererProps,
  AnimationRuntimeMetadata,
  MovieMetadata,
  RuntimeContext,
  RuntimeScenario,
} from "./contract";
import {
  getG4L3MainTimelineAudioCandidate,
  type G4L3MainTimelineAudioCandidate,
} from "./g4-l3-main-timeline-audio.generated";
import {
  getG5L4PageAudioCandidate,
  type G5L4PageAudioCandidate,
} from "./g5-l4-audio.generated";

export interface SourceStaticVisualMarker {
  readonly id: string;
  readonly firstFrame: number;
  readonly lastFrame?: number;
}

export interface SourceStaticCompanionDomain {
  readonly id: string;
  readonly frameCount: number;
  readonly label: string;
}

export interface SourceStaticBlockedFrameRange {
  readonly firstFrame: number;
  readonly lastFrame: number;
  readonly reason: string;
}

export interface SourceStaticStage {
  readonly width: number;
  readonly height: number;
  readonly backgroundColor: string;
}

export interface SourceStaticBackingStage {
  readonly width: number;
  readonly height: number;
}

export interface SourceStaticCanvasCandidateConfig {
  readonly animationId: string;
  readonly title: string;
  readonly sourceSwfSha256: string;
  readonly assetSource: string;
  readonly assetSha256?: string;
  /**
   * Legacy integer-stage declaration. Existing candidates may keep using this
   * field; it resolves to identical native and backing dimensions.
   */
  readonly stage: Readonly<SourceStaticStage>;
  /** Exact source SWF stage metadata, including fractional twip-derived sizes. */
  readonly nativeStage?: Readonly<SourceStaticStage>;
  /** Integer Canvas backing dimensions. Required with `nativeStage`. */
  readonly backingStage?: Readonly<SourceStaticBackingStage>;
  readonly fps: number;
  readonly rootFrameCount: number;
  readonly rootBeginFrame: number;
  readonly mainFrameDomain: string;
  readonly mainFrameCount: number;
  readonly livePlaybackEndFrame?: number;
  readonly playbackMode?: AnimationPlaybackMode;
  /** Require the pure frame state itself to carry the exact trace identity. */
  readonly strictCaptureIdentity?: boolean;
  readonly companionDomains?: readonly SourceStaticCompanionDomain[];
  readonly blockedFrameRanges?: readonly SourceStaticBlockedFrameRange[];
  readonly visualMarkers?: readonly SourceStaticVisualMarker[];
  readonly sourceControlBehaviorLabel?: string;
}

interface ResolvedSourceStaticCanvasCandidateConfig
  extends Omit<
    SourceStaticCanvasCandidateConfig,
    "stage" | "nativeStage" | "backingStage"
  > {
  readonly stage: Readonly<SourceStaticStage>;
  readonly nativeStage: Readonly<SourceStaticStage>;
  readonly backingStage: Readonly<SourceStaticBackingStage>;
  readonly companionDomains: readonly SourceStaticCompanionDomain[];
  readonly blockedFrameRanges: readonly SourceStaticBlockedFrameRange[];
  readonly visualMarkers: readonly SourceStaticVisualMarker[];
}

export type SourceStaticCanvasBlocker =
  | "root-baseline-unavailable"
  | "companion-domain-unrendered"
  | "spanish-visual-and-audio-unvalidated"
  | "source-behavior-dependent-frame-unvalidated"
  | "frame-domain-scenario-mismatch"
  | "unsupported-runtime-request";

export interface SourceStaticCanvasFrameState {
  readonly animationId: string;
  readonly frame: number;
  readonly exportFrame: number | null;
  readonly frameDomain: string;
  readonly requirementId?: string;
  readonly traceId?: string;
  readonly entryStateSha256?: string;
  readonly rootFrame: number;
  readonly rootState:
    | "authoritative-root-runtime-unavailable"
    | "stopped-at-begin-while-child-static-frame-is-inspected";
  readonly scenario: string;
  readonly language: AnimationLanguage;
  readonly seed: number;
  readonly status: "ready" | "blocked";
  readonly blocker: SourceStaticCanvasBlocker | null;
  readonly sourceStaticVisualReady: boolean;
  readonly visibleSourceMarkers: readonly string[];
  readonly interactiveControlsEnabled: false;
  readonly sourceHostBehaviorResolved: false;
  readonly naturalRuntimeEstablished: false;
  readonly audioRendered: false;
  readonly sourceSwfSha256: string;
}

export interface TraceCaptureIdentity {
  readonly requirementId: string;
  readonly traceId: string;
  readonly entryStateSha256: string;
}

type TraceCaptureContext = Pick<
  RuntimeContext,
  "requirementId" | "traceId" | "entryStateSha256"
>;

export function bindTraceCaptureIdentity<T extends object>(
  state: T,
  context: TraceCaptureContext,
): Readonly<T & TraceCaptureIdentity> {
  return Object.freeze({
    ...state,
    requirementId: context.requirementId?.trim() ?? "",
    traceId: context.traceId?.trim() ?? "",
    entryStateSha256: context.entryStateSha256?.trim() ?? "",
  });
}

export function isCompleteTraceCaptureIdentity(
  identity: Partial<TraceCaptureIdentity>,
) {
  return Boolean(
    /^[A-Za-z0-9][A-Za-z0-9._:-]*$/.test(identity.requirementId ?? "")
      && /^[A-Za-z0-9][A-Za-z0-9._:-]*$/.test(identity.traceId ?? "")
      && /^[a-f0-9]{64}$/.test(identity.entryStateSha256 ?? ""),
  );
}

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

export interface LatestCanvasRenderRun<TRequest> {
  readonly started: boolean;
  readonly completion: Promise<TRequest | null>;
}

export interface LatestCanvasRenderCoordinator<TRequest, TPrepared> {
  readonly enqueue: (request: TRequest) => void;
  readonly run: (
    prepare: () => Promise<TPrepared>,
    render: (request: TRequest, prepared: TPrepared) => void,
  ) => LatestCanvasRenderRun<TRequest>;
  readonly cancel: () => void;
}

/**
 * Coalesces advancing playback frames while an asynchronous Canvas asset is
 * loading. A slow `asset.ready()` must not let every playback tick cancel its
 * predecessor before any frame can paint; the one active preparation instead
 * renders the latest request that it owns.
 */
export function createLatestCanvasRenderCoordinator<
  TRequest,
  TPrepared,
>(): LatestCanvasRenderCoordinator<TRequest, TPrepared> {
  let latestRequest: TRequest | null = null;
  let activeCompletion: Promise<TRequest | null> | null = null;
  let generation = 0;

  return Object.freeze({
    enqueue(request: TRequest) {
      latestRequest = request;
    },
    run(
      prepare: () => Promise<TPrepared>,
      render: (request: TRequest, prepared: TPrepared) => void,
    ) {
      if (activeCompletion) {
        return Object.freeze({
          started: false,
          completion: activeCompletion,
        });
      }
      const runGeneration = generation;
      const completion = (async () => {
        try {
          const prepared = await prepare();
          if (generation !== runGeneration) return null;
          const request = latestRequest;
          if (request === null) return null;
          render(request, prepared);
          return request;
        } catch (error) {
          // Lifecycle cancellation makes a late readiness failure stale. A
          // current failure remains fail-closed and reaches the renderer.
          if (generation !== runGeneration) return null;
          throw error;
        }
      })();
      activeCompletion = completion;
      const clearActive = () => {
        if (activeCompletion === completion) activeCompletion = null;
      };
      void completion.then(clearActive, clearActive);
      return Object.freeze({started: true, completion});
    },
    cancel() {
      generation += 1;
      latestRequest = null;
      activeCompletion = null;
    },
  });
}

interface PendingCanvasRenderRequest {
  readonly canvas: HTMLCanvasElement;
  readonly renderKey: string;
  readonly visualKey: string;
  readonly identity: Readonly<
    Pick<
      SourceStaticCanvasFrameState,
      | "entryStateSha256"
      | "frame"
      | "frameDomain"
      | "language"
      | "requirementId"
      | "rootFrame"
      | "scenario"
      | "seed"
      | "traceId"
    >
  >;
}

declare global {
  interface Window {
    HELP_MATH_CANVAS_ASSETS?: Record<string, CanvasAsset>;
  }
}

export type SourceStaticCanvasStatus =
  | "idle"
  | "loading"
  | "updating"
  | "ready"
  | "error";

export function sourceStaticCanvasVisualKey(state: Readonly<{
  animationId: string;
  frame: number;
  frameDomain: string;
  rootFrame: number;
  scenario: string;
  language: string;
  seed: number;
}>): string {
  return JSON.stringify([
    state.animationId,
    state.frame,
    state.frameDomain,
    state.rootFrame,
    state.scenario,
    state.language,
    state.seed,
  ]);
}

export function sourceStaticCanvasRenderKey(state: Readonly<{
  animationId: string;
  entryStateSha256?: string;
  frame: number;
  frameDomain: string;
  language: string;
  requirementId?: string;
  rootFrame: number;
  scenario: string;
  seed: number;
  traceId?: string;
}>): string {
  return JSON.stringify([
    state.animationId,
    state.entryStateSha256 ?? "",
    state.frame,
    state.frameDomain,
    state.language,
    state.requirementId ?? "",
    state.rootFrame,
    state.scenario,
    state.seed,
    state.traceId ?? "",
  ]);
}

export function retainedCanvasStatus({
  canvasStatus,
  renderedVisualKey,
  requestedVisualKey,
}: Readonly<{
  canvasStatus: SourceStaticCanvasStatus;
  renderedVisualKey: string | null;
  requestedVisualKey: string;
}>): SourceStaticCanvasStatus {
  return canvasStatus === "ready" && renderedVisualKey !== requestedVisualKey
    ? "updating"
    : canvasStatus;
}

const assetPromises = new Map<string, Promise<CanvasAsset>>();

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

export interface CanvasAssetRequest {
  readonly key: string;
  readonly src: string;
  readonly integrity: string | null;
  readonly crossOrigin: "anonymous" | null;
}

function sha256HexToIntegrity(sha256Hex: string) {
  let binary = "";
  for (let index = 0; index < sha256Hex.length; index += 2) {
    binary += String.fromCharCode(
      Number.parseInt(sha256Hex.slice(index, index + 2), 16),
    );
  }
  return `sha256-${btoa(binary)}`;
}

export function buildCanvasAssetRequest(
  config: Pick<
    SourceStaticCanvasCandidateConfig,
    "animationId" | "assetSource" | "assetSha256"
  >,
): CanvasAssetRequest {
  invariant(
    config.assetSha256 === undefined ||
      /^[a-f0-9]{64}$/.test(config.assetSha256),
    "source-static candidate asset SHA-256 is invalid",
  );
  const digest = config.assetSha256 ?? null;
  const separator = config.assetSource.includes("?") ? "&" : "?";
  return Object.freeze({
    key: `${config.animationId}:${digest ?? "unbound"}:${config.assetSource}`,
    src: digest
      ? `${config.assetSource}${separator}sha256=${digest}`
      : config.assetSource,
    integrity: digest ? sha256HexToIntegrity(digest) : null,
    crossOrigin: digest ? "anonymous" : null,
  });
}

function validateConfig(
  config: SourceStaticCanvasCandidateConfig,
): ResolvedSourceStaticCanvasCandidateConfig {
  invariant(
    /^course-[a-z0-9-]+$/.test(config.animationId),
    "source-static candidate animationId is invalid",
  );
  invariant(
    /^[a-f0-9]{64}$/.test(config.sourceSwfSha256),
    "source-static candidate SWF SHA-256 is invalid",
  );
  invariant(
    config.assetSource.startsWith("/flash-assets/") &&
      !config.assetSource.includes(".."),
    "source-static candidate asset path must be local",
  );
  invariant(
    config.assetSha256 === undefined ||
      /^[a-f0-9]{64}$/.test(config.assetSha256),
    "source-static candidate asset SHA-256 is invalid",
  );
  const explicitNativeStage = config.nativeStage;
  const legacyStage = config.stage;
  invariant(
    explicitNativeStage === undefined || config.backingStage !== undefined,
    "source-static candidate backing stage is required with native stage",
  );
  const nativeStage = explicitNativeStage ?? legacyStage;
  const backingStage = config.backingStage ?? {
    width: nativeStage.width,
    height: nativeStage.height,
  };
  for (const [label, value] of [
    ["native stage width", nativeStage.width],
    ["native stage height", nativeStage.height],
  ] as const) {
    invariant(
      Number.isFinite(value) && value > 0,
      `source-static candidate ${label} must be a positive finite number`,
    );
  }
  invariant(
    /^#[a-fA-F0-9]{6}$/.test(nativeStage.backgroundColor),
    "source-static candidate native stage background color is invalid",
  );
  for (const [label, value] of [
    ["backing stage width", backingStage.width],
    ["backing stage height", backingStage.height],
    ["fps", config.fps],
    ["root frame count", config.rootFrameCount],
    ["root begin frame", config.rootBeginFrame],
    ["main frame count", config.mainFrameCount],
  ] as const) {
    invariant(
      Number.isSafeInteger(value) && value > 0,
      `source-static candidate ${label} must be a positive safe integer`,
    );
  }
  invariant(
    backingStage.width === Math.ceil(nativeStage.width) &&
      backingStage.height === Math.ceil(nativeStage.height),
    "source-static candidate backing stage must use ceil-positive-native-stage-dimensions",
  );
  if (explicitNativeStage) {
    invariant(
      legacyStage.width === nativeStage.width &&
        legacyStage.height === nativeStage.height &&
        legacyStage.backgroundColor === nativeStage.backgroundColor,
      "source-static candidate legacy and native stage declarations disagree",
    );
  }
  invariant(
    config.rootBeginFrame <= config.rootFrameCount,
    "source-static candidate root begin frame is outside the root timeline",
  );
  invariant(
    config.mainFrameDomain !== "root" && config.mainFrameDomain.length > 0,
    "source-static candidate main frame domain is invalid",
  );
  invariant(
    config.strictCaptureIdentity === undefined
      || typeof config.strictCaptureIdentity === "boolean",
    "source-static candidate strict capture identity flag is invalid",
  );
  const domains = [
    "root",
    config.mainFrameDomain,
    ...(config.companionDomains ?? []).map((domain) => domain.id),
  ];
  invariant(
    new Set(domains).size === domains.length,
    "source-static candidate frame domains must be unique",
  );
  for (const domain of config.companionDomains ?? []) {
    invariant(
      domain.id.length > 0 && domain.id !== "root",
      "source-static companion domain id is invalid",
    );
    invariant(
      Number.isSafeInteger(domain.frameCount) && domain.frameCount > 0,
      `source-static companion ${domain.id} frame count is invalid`,
    );
  }
  let priorBlockedLastFrame = 0;
  for (const range of config.blockedFrameRanges ?? []) {
    invariant(
      Number.isSafeInteger(range.firstFrame) &&
        Number.isSafeInteger(range.lastFrame) &&
        range.firstFrame >= 1 &&
        range.firstFrame <= range.lastFrame &&
        range.lastFrame <= config.mainFrameCount,
      "source-static blocked frame range is invalid",
    );
    invariant(
      range.firstFrame > priorBlockedLastFrame,
      "source-static blocked frame ranges must be sorted and non-overlapping",
    );
    invariant(
      range.reason.length > 0,
      "source-static blocked frame range reason is required",
    );
    priorBlockedLastFrame = range.lastFrame;
  }
  if (config.livePlaybackEndFrame !== undefined) {
    invariant(
      Number.isSafeInteger(config.livePlaybackEndFrame) &&
        config.livePlaybackEndFrame >= 1 &&
        config.livePlaybackEndFrame <= config.mainFrameCount,
      "source-static live playback end frame is invalid",
    );
    invariant(
      !(config.blockedFrameRanges ?? []).some(
        (range) =>
          config.livePlaybackEndFrame! >= range.firstFrame &&
          config.livePlaybackEndFrame! <= range.lastFrame,
      ),
      "source-static live playback end frame must be renderable",
    );
  }
  invariant(
    new Set((config.visualMarkers ?? []).map((marker) => marker.id)).size ===
      (config.visualMarkers ?? []).length,
    "source-static marker ids must be unique",
  );
  for (const marker of config.visualMarkers ?? []) {
    invariant(marker.id.length > 0, "source-static marker id is required");
    invariant(
      Number.isSafeInteger(marker.firstFrame) &&
        marker.firstFrame >= 1 &&
        marker.firstFrame <= config.mainFrameCount,
      `source-static marker ${marker.id} first frame is invalid`,
    );
    if (marker.lastFrame !== undefined) {
      invariant(
        Number.isSafeInteger(marker.lastFrame) &&
          marker.lastFrame >= marker.firstFrame &&
          marker.lastFrame <= config.mainFrameCount,
        `source-static marker ${marker.id} last frame is invalid`,
      );
    }
  }
  return Object.freeze({
    ...config,
    stage: Object.freeze({...nativeStage}),
    nativeStage: Object.freeze({...nativeStage}),
    backingStage: Object.freeze({...backingStage}),
    companionDomains: Object.freeze([...(config.companionDomains ?? [])]),
    blockedFrameRanges: Object.freeze([...(config.blockedFrameRanges ?? [])]),
    visualMarkers: Object.freeze([...(config.visualMarkers ?? [])]),
  });
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

function loadCanvasAsset(config: ResolvedSourceStaticCanvasCandidateConfig) {
  const request = buildCanvasAssetRequest(config);
  const selector = config.assetSha256
    ? `script[data-help-math-canvas-asset="${config.animationId}"][data-help-math-canvas-sha256="${config.assetSha256}"]`
    : `script[data-help-math-canvas-asset="${config.animationId}"]`;
  const existing = document.querySelector<HTMLScriptElement>(selector);
  const expectedAbsoluteSource =
    new URL(request.src, document.baseURI).href;
  const exactExisting = existing
    ? existing.src === expectedAbsoluteSource &&
      existing.integrity === (request.integrity ?? "") &&
      existing.crossOrigin === request.crossOrigin
    : false;
  if (existing && !exactExisting) {
    return Promise.reject(
      new Error("Existing Canvas asset script has a mismatched integrity binding"),
    );
  }
  const registered = window.HELP_MATH_CANVAS_ASSETS?.[config.animationId];
  if (registered && (!config.assetSha256 || exactExisting)) {
    return Promise.resolve(registered);
  }
  const existingPromise = assetPromises.get(request.key);
  if (existingPromise) return existingPromise;
  const promise = new Promise<CanvasAsset>((resolve, reject) => {
    const script = existing ?? document.createElement("script");
    const finish = () => {
      const asset = window.HELP_MATH_CANVAS_ASSETS?.[config.animationId];
      if (asset) resolve(asset);
      else reject(new Error("Canvas asset did not register the expected animation"));
    };
    script.onload = finish;
    script.onerror = () => reject(new Error("Local Canvas asset could not load"));
    if (!existing) {
      script.async = true;
      script.dataset.helpMathCanvasAsset = config.animationId;
      if (config.assetSha256) {
        script.dataset.helpMathCanvasSha256 = config.assetSha256;
      }
      if (request.integrity) script.integrity = request.integrity;
      if (request.crossOrigin) script.crossOrigin = request.crossOrigin;
      script.src = request.src;
      document.head.appendChild(script);
    } else if (window.HELP_MATH_CANVAS_ASSETS?.[config.animationId]) finish();
  }).catch((error) => {
    assetPromises.delete(request.key);
    throw error;
  });
  assetPromises.set(request.key, promise);
  return promise;
}

function verifyRenderedIdentity(
  canvas: HTMLCanvasElement,
  rendered: unknown,
  expected: Pick<
    SourceStaticCanvasFrameState,
    | "entryStateSha256"
    | "frame"
    | "frameDomain"
    | "language"
    | "requirementId"
    | "rootFrame"
    | "scenario"
    | "seed"
    | "traceId"
  >,
) {
  invariant(
    isCanvasRuntimeState(rendered) &&
      rendered.localFrame === expected.frame &&
      rendered.frameDomain === expected.frameDomain &&
      rendered.rootFrame === expected.rootFrame &&
      rendered.scenario === expected.scenario &&
      rendered.lang === expected.language &&
      rendered.seed === expected.seed &&
      rendered.audioRendered === false,
    "Canvas asset returned a mismatched deterministic identity",
  );
  const expectedAttributes = {
    "data-flash-entry-state-sha256": expected.entryStateSha256 || null,
    "data-flash-frame": String(expected.frame),
    "data-flash-frame-domain": expected.frameDomain,
    "data-flash-lang": expected.language,
    "data-flash-requirement-id": expected.requirementId || null,
    "data-flash-root-frame": String(expected.rootFrame),
    "data-flash-scenario": expected.scenario,
    "data-flash-seed": String(expected.seed),
    "data-flash-trace-id": expected.traceId || null,
    "data-runtime-language": expected.language,
    "data-runtime-scenario": expected.scenario,
    "data-runtime-seed": String(expected.seed),
  };
  for (const [name, expectedValue] of Object.entries(expectedAttributes)) {
    invariant(
      canvas.getAttribute(name) === expectedValue,
      `Canvas asset did not stamp the expected ${name}`,
    );
  }
}

function blockerCopy(blocker: SourceStaticCanvasBlocker | null) {
  if (blocker === "root-baseline-unavailable") {
    return {
      title: "Root timeline unavailable",
      detail:
        "The source root and InternalPreloader entry lack an authoritative original-runtime baseline, so this domain is disabled.",
    };
  }
  if (blocker === "companion-domain-unrendered") {
    return {
      title: "Companion timeline unavailable",
      detail:
        "This separate source domain is inventoried but has no accepted compositing disposition, so it is disabled.",
    };
  }
  if (blocker === "spanish-visual-and-audio-unvalidated") {
    return {
      title: "Spanish path unavailable",
      detail:
        "Spanish visual behavior and audio cue, synchronization, and listening evidence are unvalidated, so this candidate fails closed.",
    };
  }
  if (blocker === "source-behavior-dependent-frame-unvalidated") {
    return {
      title: "Source behavior-dependent frame unavailable",
      detail:
        "This source frame depends on random, input, host, or other ActionScript state that has not been faithfully reconstructed, so rendering is disabled.",
    };
  }
  if (blocker === "frame-domain-scenario-mismatch") {
    return {
      title: "Frame-domain scenario mismatch",
      detail:
        "The requested scenario belongs to a different source timeline, so rendering is disabled.",
    };
  }
  return {
    title: "Unsupported deterministic request",
    detail:
      "This frame-domain or scenario is outside the source-bound engineering contract, so rendering is disabled.",
  };
}

export function createSourceStaticCanvasCandidate(
  suppliedConfig: SourceStaticCanvasCandidateConfig,
  suppliedAudioCandidate?:
    | G4L3MainTimelineAudioCandidate
    | G5L4PageAudioCandidate,
) {
  const config = validateConfig(suppliedConfig);
  const mainTimelineAudioCandidate =
    suppliedAudioCandidate ??
    getG4L3MainTimelineAudioCandidate(config.animationId) ??
    getG5L4PageAudioCandidate(config.animationId);
  const rootScenario = "root-unavailable";
  const mainScenario = "source-static-frame";
  const companionScenario = (id: string) => `${id}-unavailable`;
  const frameCounts = new Map<string, number>([
    ["root", config.rootFrameCount],
    [config.mainFrameDomain, config.mainFrameCount],
    ...config.companionDomains.map(
      (domain) => [domain.id, domain.frameCount] as const,
    ),
  ]);
  const defaultScenarioByFrameDomain = Object.freeze({
    root: rootScenario,
    [config.mainFrameDomain]: mainScenario,
    ...Object.fromEntries(
      config.companionDomains.map((domain) => [
        domain.id,
        companionScenario(domain.id),
      ]),
    ),
  });
  const allowedScenarios = new Set(Object.values(defaultScenarioByFrameDomain));

  const normalizeFrame = (frame: number, frameDomain = config.mainFrameDomain) => {
    const frameCount = frameCounts.get(frameDomain) ?? config.mainFrameCount;
    if (!Number.isFinite(frame)) return 1;
    return Math.min(frameCount, Math.max(1, Math.floor(frame)));
  };

  const getFrameState = (
    frame: number,
    context: Pick<
      RuntimeContext,
      | "frameDomain"
      | "scenario"
      | "lang"
      | "seed"
      | "requirementId"
      | "traceId"
      | "entryStateSha256"
    >,
  ): SourceStaticCanvasFrameState => {
    const requestedDomain = context.frameDomain ?? config.mainFrameDomain;
    const domainSupported = frameCounts.has(requestedDomain);
    const frameDomain = domainSupported
      ? requestedDomain
      : config.mainFrameDomain;
    const fallbackScenario = defaultScenarioByFrameDomain[frameDomain];
    const scenarioSupported = allowedScenarios.has(context.scenario);
    const scenario = scenarioSupported ? context.scenario : fallbackScenario;
    const expectedScenario = defaultScenarioByFrameDomain[frameDomain];
    const language = context.lang === "es" ? "es" : "en";
    const seed = Number.isSafeInteger(context.seed) ? context.seed >>> 0 : 0;
    const normalizedFrame = normalizeFrame(frame, frameDomain);
    const behaviorDependentFrame =
      frameDomain === config.mainFrameDomain &&
      config.blockedFrameRanges.some(
        (range) =>
          normalizedFrame >= range.firstFrame &&
          normalizedFrame <= range.lastFrame,
      );
    const blocker: SourceStaticCanvasBlocker | null =
      !domainSupported || !scenarioSupported
        ? "unsupported-runtime-request"
        : scenario !== expectedScenario
          ? "frame-domain-scenario-mismatch"
          : language === "es"
            ? "spanish-visual-and-audio-unvalidated"
            : frameDomain === "root"
              ? "root-baseline-unavailable"
              : frameDomain !== config.mainFrameDomain
                ? "companion-domain-unrendered"
                : behaviorDependentFrame
                  ? "source-behavior-dependent-frame-unvalidated"
                  : null;
    const visibleSourceMarkers =
      frameDomain === config.mainFrameDomain && blocker === null
        ? config.visualMarkers
            .filter(
              (marker) =>
                normalizedFrame >= marker.firstFrame &&
                normalizedFrame <= (marker.lastFrame ?? config.mainFrameCount),
            )
            .map((marker) => marker.id)
        : [];
    return bindTraceCaptureIdentity({
      animationId: config.animationId,
      frame: normalizedFrame,
      exportFrame:
        frameDomain === config.mainFrameDomain ? normalizedFrame - 1 : null,
      frameDomain,
      rootFrame: frameDomain === "root" ? normalizedFrame : config.rootBeginFrame,
      rootState:
        frameDomain === "root"
          ? "authoritative-root-runtime-unavailable"
          : "stopped-at-begin-while-child-static-frame-is-inspected",
      scenario,
      language,
      seed,
      status: blocker ? "blocked" : "ready",
      blocker,
      sourceStaticVisualReady: blocker === null,
      visibleSourceMarkers: Object.freeze(visibleSourceMarkers),
      interactiveControlsEnabled: false,
      sourceHostBehaviorResolved: false,
      naturalRuntimeEstablished: false,
      audioRendered: false,
      sourceSwfSha256: config.sourceSwfSha256,
    }, context);
  };

  const buildCaptureAttributes = ({
    canvasStatus,
    entryStateSha256,
    frame,
    frameDomain,
    lang,
    requirementId,
    scenario,
    seed,
    state,
    traceId,
  }: {
    canvasStatus: SourceStaticCanvasStatus;
    entryStateSha256: string;
    frame?: number;
    frameDomain?: string;
    lang?: AnimationLanguage;
    requirementId: string;
    scenario?: string;
    seed?: number;
    state: SourceStaticCanvasFrameState;
    traceId: string;
  }) => {
    const visualReady = state.status === "ready" && canvasStatus === "ready";
    const requestedFrame = frame ?? state.frame;
    const requestedFrameDomain = frameDomain ?? state.frameDomain;
    const requestedLanguage = lang ?? state.language;
    const requestedScenario = scenario ?? state.scenario;
    const requestedSeed = seed ?? state.seed;
    const stateDeclaresTraceIdentity = Boolean(
      state.requirementId || state.traceId || state.entryStateSha256,
    );
    const traceIdentity = stateDeclaresTraceIdentity
      ? {
          requirementId: state.requirementId ?? "",
          traceId: state.traceId ?? "",
          entryStateSha256: state.entryStateSha256 ?? "",
        }
      : {requirementId, traceId, entryStateSha256};
    const traceIdentityMatches =
      !stateDeclaresTraceIdentity
      || (
        state.requirementId === requirementId
        && state.traceId === traceId
        && state.entryStateSha256 === entryStateSha256
      );
    const identityMatches =
      state.frame === requestedFrame
      && state.frameDomain === requestedFrameDomain
      && state.scenario === requestedScenario
      && state.language === requestedLanguage
      && state.seed === requestedSeed
      && traceIdentityMatches;
    const identityReady =
      identityMatches
      && isCompleteTraceCaptureIdentity(traceIdentity)
      && (!config.strictCaptureIdentity || stateDeclaresTraceIdentity);
    const captureReady =
      visualReady && identityReady;
    return {
      "data-animation-id": config.animationId,
      "data-candidate-status": "source-static-engineering-not-strict",
      "data-capture-identity-status": identityReady ? "verified" : "blocked",
      "data-capture-stage": captureReady ? "true" : undefined,
      "data-render-state": visualReady ? "ready" : canvasStatus,
      "data-render-visual": visualReady ? "true" : undefined,
      "data-flash-entry-state-sha256": traceIdentity.entryStateSha256 || undefined,
      "data-flash-frame": state.frame,
      "data-flash-frame-domain": state.frameDomain,
      "data-flash-lang": state.language,
      "data-flash-native-stage-height": config.nativeStage.height,
      "data-flash-native-stage-width": config.nativeStage.width,
      "data-flash-requirement-id": traceIdentity.requirementId || undefined,
      "data-flash-root-frame": state.rootFrame,
      "data-flash-scenario": state.scenario,
      "data-flash-seed": state.seed,
      "data-flash-trace-id": traceIdentity.traceId || undefined,
      "data-runtime-language": state.language,
      "data-runtime-scenario": state.scenario,
      "data-runtime-seed": state.seed,
      "data-canvas-backing-height": config.backingStage.height,
      "data-canvas-backing-width": config.backingStage.width,
      "data-source-marker-visuals": state.visibleSourceMarkers.join(","),
      "data-source-controls-enabled": "false",
    } as const;
  };

  function Renderer({
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
    const suppliedState =
      state &&
      typeof state === "object" &&
      "animationId" in state &&
      state.animationId === config.animationId
        ? (state as SourceStaticCanvasFrameState)
        : null;
    const deterministicState = useMemo(
      () =>
        suppliedState
          ? config.strictCaptureIdentity
            ? suppliedState
            : bindTraceCaptureIdentity(suppliedState, {
                entryStateSha256,
                requirementId,
                traceId,
              })
          : getFrameState(frame, {
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
        suppliedState,
        traceId,
      ],
    );
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const canvasHostRef = useRef<HTMLElement>(null);
    const canvasStatusRef = useRef<SourceStaticCanvasStatus>("idle");
    const canvasPresentationRef = useRef<"pending" | "painted" | "error">(
      "pending",
    );
    const [, setCanvasPresentation] = useState<
      "pending" | "painted" | "error"
    >("pending");
    const renderedVisualKeyRef = useRef<string | null>(null);
    const requestedVisualKey = sourceStaticCanvasVisualKey(deterministicState);
    const requestedRenderKey = sourceStaticCanvasRenderKey(deterministicState);
    const renderedRequestKeyRef = useRef<string | null>(null);
    const renderEntryStateSha256 = deterministicState.entryStateSha256;
    const renderFrame = deterministicState.frame;
    const renderFrameDomain = deterministicState.frameDomain;
    const renderLanguage = deterministicState.language;
    const renderRequirementId = deterministicState.requirementId;
    const renderRootFrame = deterministicState.rootFrame;
    const renderScenario = deterministicState.scenario;
    const renderSeed = deterministicState.seed;
    const renderStatus = deterministicState.status;
    const renderTraceId = deterministicState.traceId;
    const [renderCoordinator] = useState(() =>
      createLatestCanvasRenderCoordinator<
        PendingCanvasRenderRequest,
        CanvasAsset
      >(),
    );
    const reportedCanvasStatus = retainedCanvasStatus({
      canvasStatus: canvasStatusRef.current,
      renderedVisualKey: renderedVisualKeyRef.current,
      requestedVisualKey,
    });

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas || renderStatus !== "ready") {
        renderCoordinator.cancel();
        renderedRequestKeyRef.current = null;
        renderedVisualKeyRef.current = null;
        canvasStatusRef.current = "idle";
        if (canvasPresentationRef.current !== "pending") {
          canvasPresentationRef.current = "pending";
          setCanvasPresentation("pending");
        }
        return;
      }
      const renderRequest = Object.freeze({
        canvas,
        renderKey: requestedRenderKey,
        visualKey: requestedVisualKey,
        identity: Object.freeze({
          entryStateSha256: renderEntryStateSha256,
          frame: renderFrame,
          frameDomain: renderFrameDomain,
          language: renderLanguage,
          requirementId: renderRequirementId,
          rootFrame: renderRootFrame,
          scenario: renderScenario,
          seed: renderSeed,
          traceId: renderTraceId,
        }),
      });
      // Enqueue before the idempotence check so an in-flight preparation also
      // observes a request that returns to the currently painted frame.
      renderCoordinator.enqueue(renderRequest);
      // A parent may supply a freshly allocated frame-state object on every
      // render. The exact primitive request key keeps those equivalent renders
      // idempotent while still redrawing for any visual or trace identity
      // change required by deterministic capture.
      if (renderedRequestKeyRef.current === requestedRenderKey) {
        return;
      }
      const run = renderCoordinator.run(
        async () => {
          const asset = await loadCanvasAsset(config);
          await asset.ready();
          return asset;
        },
        (request, asset) => {
          const rendered = asset.render(request.canvas, {
            frame: request.identity.frame,
            scenario: request.identity.scenario,
            lang: request.identity.language,
            seed: request.identity.seed,
          });
          verifyRenderedIdentity(request.canvas, rendered, request.identity);
        },
      );
      if (!run.started) return;
      // Keep the last successfully painted bitmap visible while the next
      // deterministic frame is prepared. Demoting an already-ready Canvas to
      // `loading` hid it on every playback tick and exposed the stage's blue
      // background, producing a rapid full-frame flash. `updating` remains
      // capture-ineligible, so the retained bitmap cannot be mistaken for
      // evidence of the requested frame before the new draw completes.
      const pendingStatus =
        canvasStatusRef.current === "ready" ||
        canvasStatusRef.current === "updating"
          ? "updating"
          : "loading";
      canvasStatusRef.current = pendingStatus;
      canvasHostRef.current?.setAttribute("data-canvas-status", pendingStatus);
      void run.completion
        .then((completedRequest) => {
          if (completedRequest) {
            renderedRequestKeyRef.current = completedRequest.renderKey;
            renderedVisualKeyRef.current = completedRequest.visualKey;
            canvasStatusRef.current = "ready";
            // Canvas painting is imperative and runs at the movie frame rate.
            // Keep its readiness marker on that same imperative surface;
            // scheduling React state for every frame creates a passive-effect
            // update loop on slower runners even when each paint succeeds.
            canvasHostRef.current?.setAttribute("data-canvas-status", "ready");
            if (canvasPresentationRef.current !== "painted") {
              canvasPresentationRef.current = "painted";
              // One transition render exposes the initially hidden Canvas and
              // removes its loading copy. Later movie frames stay imperative.
              setCanvasPresentation("painted");
            }
          }
        })
        .catch(() => {
          renderedRequestKeyRef.current = null;
          renderedVisualKeyRef.current = null;
          canvasStatusRef.current = "error";
          canvasHostRef.current?.setAttribute("data-canvas-status", "error");
          if (canvasPresentationRef.current !== "error") {
            canvasPresentationRef.current = "error";
            setCanvasPresentation("error");
          }
        });
    }, [
      renderEntryStateSha256,
      renderFrame,
      renderFrameDomain,
      renderLanguage,
      renderRequirementId,
      renderRootFrame,
      renderScenario,
      renderSeed,
      renderStatus,
      renderTraceId,
      renderCoordinator,
      requestedRenderKey,
      requestedVisualKey,
    ]);

    useEffect(() => () => renderCoordinator.cancel(), [renderCoordinator]);

    const blocked =
      deterministicState.status === "blocked"
        ? blockerCopy(deterministicState.blocker)
        : null;
    return (
      <section
        aria-label={config.title}
        data-audio-rendered="false"
        data-authoritative-runtime-validated="false"
        data-candidate-status="source-static-engineering-not-strict"
        data-canvas-status={blocked ? "blocked" : reportedCanvasStatus}
        data-human-visual-review-accepted="false"
        data-interactive-controls-enabled="false"
        data-owner-accepted="false"
        ref={canvasHostRef}
        data-strict-migration-complete="false"
        style={{
          margin: "0 auto",
          maxWidth: config.nativeStage.width,
          width: "100%",
        }}
      >
        <div
          style={{
            aspectRatio: `${config.nativeStage.width} / ${config.nativeStage.height}`,
            background: config.nativeStage.backgroundColor,
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
                {...buildCaptureAttributes({
                  canvasStatus: reportedCanvasStatus,
                  entryStateSha256,
                  frame,
                  frameDomain,
                  lang,
                  requirementId,
                  scenario,
                  seed,
                  state: deterministicState,
                  traceId,
                })}
                aria-label={`Source-static ${config.mainFrameDomain} drawing, frame ${deterministicState.frame} of ${config.mainFrameCount}; source control behavior disabled`}
                className="faithful-stage-wrap"
                data-course-canvas={config.animationId}
                height={config.backingStage.height}
                ref={canvasRef}
                role="img"
                style={{
                  aspectRatio: `${config.nativeStage.width} / ${config.nativeStage.height}`,
                  display:
                    reportedCanvasStatus === "ready" ||
                      reportedCanvasStatus === "updating"
                      ? "block"
                      : "none",
                  height: "auto",
                  pointerEvents: "none",
                  width: "100%",
                }}
                width={config.backingStage.width}
              />
              {reportedCanvasStatus === "loading" ||
              reportedCanvasStatus === "idle" ? (
                <span aria-live="polite" role="status">
                  Loading source-static drawing…
                </span>
              ) : null}
              {reportedCanvasStatus === "error" ? (
                <p aria-live="assertive" role="alert">
                  The local drawing asset failed safely. No legacy or remote
                  fallback was executed.
                </p>
              ) : null}
            </>
          )}
        </div>
        <p data-source-replay-parity="unvalidated">
          Engineering preview only.{" "}
          {mainTimelineAudioCandidate
            ? "Source-exact main-timeline audio is host-wired as an unaccepted candidate; source controls and behavior"
            : config.sourceControlBehaviorLabel ?? "Source control behavior and audio"}
          , Spanish visual parity, Replay parity, original-runtime parity,
          visual review, and acceptance are not claimed.
        </p>
      </section>
    );
  }

  const movie: MovieMetadata = Object.freeze({
    stage: Object.freeze({
      width: config.nativeStage.width,
      height: config.nativeStage.height,
    }),
    fps: config.fps,
    frameCount: config.mainFrameCount,
    durationMs: (config.mainFrameCount * 1_000) / config.fps,
  });
  const runtime: AnimationRuntimeMetadata = Object.freeze({
    stage: movie.stage,
    fps: config.fps,
    frameCount: config.rootFrameCount,
    durationMs: (config.rootFrameCount * 1_000) / config.fps,
    defaultFrameDomain: config.mainFrameDomain,
    frameDomains: Object.freeze([
      Object.freeze({
        id: config.mainFrameDomain,
        frameCount: config.mainFrameCount,
        fps: config.fps,
        rootFrame: config.rootBeginFrame,
      }),
      ...config.companionDomains.map((domain) =>
        Object.freeze({
          id: domain.id,
          frameCount: domain.frameCount,
          fps: config.fps,
          rootFrame: config.rootBeginFrame,
        }),
      ),
    ]),
  });
  const scenarios: readonly RuntimeScenario[] = Object.freeze([
    Object.freeze({
      id: mainScenario,
      label: "English source-static drawing",
      description:
        mainTimelineAudioCandidate
          ? "Hash-bound drawing frames with source-exact host audio candidate; source behavior, accepted audio parity, and natural runtime remain excluded."
          : "Hash-bound drawing frames only; source behavior, audio, and natural runtime are excluded.",
    }),
    Object.freeze({
      id: rootScenario,
      label: "Root timeline (blocked)",
      description:
        "Records the root-domain obligation without inferring original runtime behavior.",
    }),
    ...config.companionDomains.map((domain) =>
      Object.freeze({
        id: companionScenario(domain.id),
        label: `${domain.label} (blocked)`,
        description:
          "Records a separate source domain without inferring its compositing disposition.",
      }),
    ),
  ]);
  const playbackEndFrameByDomain = Object.freeze({
    root: 1,
    ...(config.livePlaybackEndFrame === undefined
      ? {}
      : {[config.mainFrameDomain]: config.livePlaybackEndFrame}),
    ...Object.fromEntries(config.companionDomains.map((domain) => [domain.id, 1])),
  });
  const animationModule: AnimationModule<SourceStaticCanvasFrameState> = Object.freeze({
    key: config.animationId,
    movie,
    runtime,
    playbackMode: config.playbackMode ?? "once",
    playbackEndFrameByDomain,
    reducedMotionFrame: 1,
    defaultScenarioByFrameDomain,
    scenarios,
    audioCues:
      mainTimelineAudioCandidate?.audioCues ?? Object.freeze([]),
    ...(mainTimelineAudioCandidate
      ? {audioTracks: mainTimelineAudioCandidate.audioTracks}
      : {}),
    transport: Object.freeze({
      mode: "visual-frame-inspector",
      frameDomains: Object.freeze([config.mainFrameDomain]),
      stepFrames: 20,
      stateReconstruction: "renderer-remount-on-seek",
      audioDisposition: "disabled-while-inspecting",
      legacyBehaviorParity: false,
      strictAcceptanceEffect: "none",
    }),
    maturity: "legacy-prototype",
    Renderer,
    getFrameState: (frame: number, context: RuntimeContext) =>
      getFrameState(frame, context),
  });

  const sourceContract = Object.freeze({
    status: "source-static-current-javascript-engineering-candidate-only",
    nativeStage: config.nativeStage,
    backingStage: config.backingStage,
    rasterizationRule: "ceil-positive-native-stage-dimensions",
    visualLanguages: Object.freeze(["en"] as const),
    spanishVisualStatus: "unvalidated-disabled",
    audioStatus: mainTimelineAudioCandidate
      ? "source-exact-host-candidate-listening-and-runtime-sync-pending"
      : "inventoried-unmapped-disabled",
    rootRuntimeStatus: "authoritative-baseline-unavailable-disabled",
    sourceControlBehaviorStatus: "source-bound-host-callback-unresolved-disabled",
    sourceBehaviorDependentFrameStatus:
      config.blockedFrameRanges.length > 0
        ? "declared-ranges-disabled"
        : "none-declared",
    blockedSourceBehaviorFrameCount: config.blockedFrameRanges.reduce(
      (count, range) => count + range.lastFrame - range.firstFrame + 1,
      0,
    ),
    livePlaybackEndFrame:
      config.livePlaybackEndFrame ?? config.mainFrameCount,
    replayStatus: "complete-source-reset-unvalidated",
    fullFrameRmseStatus: "not-performed",
    humanVisualReviewAccepted: false,
    ownerAccepted: false,
    strictAcceptanceEffect: "none",
  });

  return Object.freeze({
    config,
    movie,
    runtime,
    scenarios,
    sourceContract,
    normalizeFrame,
    getFrameState,
    buildCaptureAttributes,
    Renderer,
    module: animationModule,
  });
}
