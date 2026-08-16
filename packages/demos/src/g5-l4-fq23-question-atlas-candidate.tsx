"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import {createPortal} from "react-dom";

import type {
  AnimationModule,
  AnimationRendererProps,
  AnimationRuntimeMetadata,
  MovieMetadata,
  RuntimeContext,
  RuntimeScenario,
} from "./contract";
import {
  G5_L4_FQ_INTERACTIVE_AUDIO_ASSETS,
  getG5L4FqInteractiveAudioAsset,
  type G5L4FqInteractiveAudioAsset,
} from "./g5-l4-audio.generated";
import {
  G5_L4_FQ23_ANSWER_OPTIONS,
  G5_L4_FQ23_SOURCE_SCRIPT_EVIDENCE,
  createG5L4Fq23QuestionSequenceState,
  getG5L4Fq23ActiveQuestionNumber,
  getG5L4Fq23ActiveReviewResponse,
  reduceG5L4Fq23QuestionSequence,
  type G5L4Fq23AnswerOption,
  type G5L4Fq23QuestionSequenceAction,
  type G5L4Fq23QuestionSequenceState,
} from "./timelines/course-g05-l04-fq23-question-sequence";

export const G5_L4_FQ23_ATLAS_FRAME_DOMAIN =
  "sprite-694-question-atlas";
export const G5_L4_FQ23_SOURCE_FRAME_DOMAIN = "sprite-694";
export const G5_L4_FQ23_SCENARIO =
  "source-static-question-atlas-inspection";

export interface G5L4Fq23QuestionAtlasConfig {
  readonly animationId:
    | "course-g05-l04-fq-002"
    | "course-g05-l04-fq-003";
  readonly title: string;
  readonly source: Readonly<{
    swf: string;
    swfBytes: number;
    swfSha256: string;
    fla: string;
    flaBytes: number;
    flaSha256: string;
  }>;
  readonly asset: Readonly<{
    source: string;
    sha256: string;
  }>;
  readonly sourceSelection: Readonly<{
    kind: "random-without-replacement" | "sequential";
    sourceQuestionCount: 18;
    sourcePresentedQuestionCount: 10 | 18;
    sourceExpression: string;
    executedByCandidate: false;
  }>;
  readonly currentJavascriptBehavior: Readonly<{
    questionSequenceEnabled: true;
    answerSubmissionEnabled: true;
    scoringEnabled: true;
    textReviewEnabled: true;
    replayResetEnabled: true;
    executesLegacyActionScript: false;
    exactAvm1RandomOrderEstablished: false;
    sourceReviewVisualParityEstablished: false;
    reportingNetworkEnabled: false;
  }>;
  readonly acceptanceEffects: Readonly<Record<string, false>>;
}

export type G5L4Fq23QuestionAtlasBlocker =
  | "root-domain-disabled"
  | "source-domain-internal-only"
  | "unsupported-frame-domain"
  | "frame-domain-scenario-mismatch"
  | "spanish-disabled"
  | "frame-out-of-range";

export interface G5L4Fq23QuestionAtlasFrameState {
  readonly animationId: string;
  readonly requestedFrame: number;
  readonly frame: number;
  readonly frameDomain: typeof G5_L4_FQ23_ATLAS_FRAME_DOMAIN | string;
  readonly sourceFrame: number | null;
  readonly sourceExportFrame: number | null;
  readonly sourceFrameDomain: typeof G5_L4_FQ23_SOURCE_FRAME_DOMAIN;
  readonly rootFrame: 6;
  readonly questionLabel: string | null;
  readonly scenario: string;
  readonly language: "en" | "es";
  readonly seed: number;
  readonly requirementId: string;
  readonly traceId: string;
  readonly entryStateSha256: string;
  readonly status: "ready" | "blocked";
  readonly blocker: G5L4Fq23QuestionAtlasBlocker | null;
  readonly sourceStaticQuestionDrawingReady: boolean;
  readonly sourceSelectionKind: "random-without-replacement" | "sequential";
  readonly sourceQuestionCount: 18;
  readonly sourcePresentedQuestionCount: 10 | 18;
  readonly livePlaybackEndFrame: 1;
  readonly sequentialPlaybackPermitted: false;
  readonly legacyActionScriptExecuted: false;
  readonly naturalQuestionSelectionEnabled: false;
  readonly answerControlsEnabled: false;
  readonly scoringEnabled: false;
  readonly reviewEnabled: false;
  readonly audioRendered: false;
  readonly timingEnabled: false;
  readonly reportingNetworkEnabled: false;
  readonly sourceReplayEstablished: false;
  readonly currentJavascriptQuestionSequenceEnabled: boolean;
  readonly currentJavascriptAnswerSubmissionEnabled: boolean;
  readonly currentJavascriptScoringEnabled: boolean;
  readonly currentJavascriptTextReviewEnabled: boolean;
  readonly currentJavascriptReplayResetEnabled: boolean;
  readonly exactAvm1RandomOrderEstablished: false;
  readonly sourceReviewVisualParityEstablished: false;
  readonly naturalRuntimeEstablished: false;
  readonly sourceSwfSha256: string;
}

interface CanvasAsset {
  readonly ready: () => Promise<void>;
  readonly render: (
    canvas: HTMLCanvasElement,
    request: {
      readonly frame: number;
      readonly scenario: string;
      readonly lang: string;
      readonly seed: number;
    },
  ) => unknown;
}

interface CanvasRuntimeState {
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
const assetPromises = new Map<string, Promise<CanvasAsset>>();

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function validateConfig(config: G5L4Fq23QuestionAtlasConfig) {
  invariant(
    config.animationId === "course-g05-l04-fq-002" ||
      config.animationId === "course-g05-l04-fq-003",
    "G5 L4 FQ question-atlas animationId is not allowlisted",
  );
  invariant(
    /^[a-f0-9]{64}$/.test(config.source.swfSha256) &&
      /^[a-f0-9]{64}$/.test(config.source.flaSha256) &&
      /^[a-f0-9]{64}$/.test(config.asset.sha256),
    `${config.animationId}: invalid source or asset SHA-256`,
  );
  invariant(
    config.asset.source ===
      `/flash-assets/courses/${config.animationId}/canvas-renderer.js`,
    `${config.animationId}: local asset path changed`,
  );
  invariant(
    config.sourceSelection.sourceQuestionCount === 18 &&
      config.sourceSelection.executedByCandidate === false &&
      ((config.sourceSelection.kind === "random-without-replacement" &&
        config.sourceSelection.sourcePresentedQuestionCount === 10) ||
        (config.sourceSelection.kind === "sequential" &&
          config.sourceSelection.sourcePresentedQuestionCount === 18)),
    `${config.animationId}: source selection boundary changed`,
  );
  invariant(
    config.currentJavascriptBehavior.questionSequenceEnabled === true &&
      config.currentJavascriptBehavior.answerSubmissionEnabled === true &&
      config.currentJavascriptBehavior.scoringEnabled === true &&
      config.currentJavascriptBehavior.textReviewEnabled === true &&
      config.currentJavascriptBehavior.replayResetEnabled === true &&
      config.currentJavascriptBehavior.executesLegacyActionScript === false &&
      config.currentJavascriptBehavior.exactAvm1RandomOrderEstablished === false &&
      config.currentJavascriptBehavior.sourceReviewVisualParityEstablished === false &&
      config.currentJavascriptBehavior.reportingNetworkEnabled === false,
    `${config.animationId}: current-JavaScript behavior boundary changed`,
  );
  invariant(
    Object.keys(config.acceptanceEffects).length >= 20 &&
      Object.values(config.acceptanceEffects).every((value) => value === false),
    `${config.animationId}: acceptance effects must remain false`,
  );
  return config;
}

function normalizeSeed(seed: number) {
  return Number.isSafeInteger(seed) ? seed >>> 0 : 0;
}

function captureIdentity(value: string | undefined) {
  return value?.trim() ?? "";
}

function hasCompleteCaptureIdentity(state: G5L4Fq23QuestionAtlasFrameState) {
  return Boolean(
    /^[A-Za-z0-9][A-Za-z0-9._:-]*$/.test(state.requirementId) &&
      /^[A-Za-z0-9][A-Za-z0-9._:-]*$/.test(state.traceId) &&
      /^[a-f0-9]{64}$/.test(state.entryStateSha256),
  );
}

function sha256Integrity(hex: string) {
  let binary = "";
  for (let index = 0; index < hex.length; index += 2) {
    binary += String.fromCharCode(Number.parseInt(hex.slice(index, index + 2), 16));
  }
  return `sha256-${btoa(binary)}`;
}

function canvasRegistry() {
  return (
    globalThis as typeof globalThis & {
      HELP_MATH_CANVAS_ASSETS?: Record<string, CanvasAsset>;
    }
  ).HELP_MATH_CANVAS_ASSETS;
}

function loadCanvasAsset(config: G5L4Fq23QuestionAtlasConfig) {
  const key = `${config.animationId}:${config.asset.sha256}`;
  const cached = assetPromises.get(key);
  if (cached) return cached;
  const selector =
    `script[data-help-math-canvas-asset="${config.animationId}"]` +
    `[data-help-math-canvas-sha256="${config.asset.sha256}"]`;
  const existing = document.querySelector<HTMLScriptElement>(selector);
  const source = `${config.asset.source}?sha256=${config.asset.sha256}`;
  const expectedSource = new URL(source, document.baseURI).href;
  const integrity = sha256Integrity(config.asset.sha256);
  if (
    existing &&
    (existing.src !== expectedSource ||
      existing.integrity !== integrity ||
      existing.crossOrigin !== "anonymous")
  ) {
    return Promise.reject(new Error("Question-atlas asset integrity binding changed"));
  }
  const registered = canvasRegistry()?.[config.animationId];
  if (registered && existing) return Promise.resolve(registered);
  const promise = new Promise<CanvasAsset>((resolve, reject) => {
    const script = existing ?? document.createElement("script");
    const finish = () => {
      const loaded = canvasRegistry()?.[config.animationId];
      if (loaded) resolve(loaded);
      else reject(new Error("Question-atlas Canvas asset did not register"));
    };
    script.onload = finish;
    script.onerror = () =>
      reject(new Error("Question-atlas local Canvas asset could not load"));
    if (!existing) {
      script.async = true;
      script.dataset.helpMathCanvasAsset = config.animationId;
      script.dataset.helpMathCanvasSha256 = config.asset.sha256;
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

function isCanvasRuntimeState(value: unknown): value is CanvasRuntimeState {
  return Boolean(
    value && typeof value === "object" && "localFrame" in value &&
      "frameDomain" in value && "scenario" in value && "lang" in value,
  );
}

function verifyInternalAssetState(
  canvas: HTMLCanvasElement,
  rendered: unknown,
  expected: G5L4Fq23QuestionAtlasFrameState,
) {
  invariant(
    isCanvasRuntimeState(rendered) &&
      rendered.localFrame === expected.sourceFrame &&
      rendered.exportFrame === expected.sourceExportFrame &&
      rendered.frameDomain === G5_L4_FQ23_SOURCE_FRAME_DOMAIN &&
      rendered.rootFrame === 6 &&
      rendered.scenario === G5_L4_FQ23_SCENARIO &&
      rendered.lang === "en" && rendered.seed === expected.seed &&
      rendered.audioRendered === false,
    "Question-atlas Canvas asset returned a mismatched source-frame identity",
  );
  invariant(
    canvas.getAttribute("data-flash-frame") === String(expected.sourceFrame) &&
      canvas.getAttribute("data-flash-frame-domain") ===
        G5_L4_FQ23_SOURCE_FRAME_DOMAIN,
    "Question-atlas Canvas asset did not stamp its internal source-frame identity",
  );
}

function stampAtlasIdentity(
  canvas: HTMLCanvasElement,
  state: G5L4Fq23QuestionAtlasFrameState,
) {
  const attributes: Record<string, string> = {
    "data-animation-id": state.animationId,
    "data-flash-frame": String(state.frame),
    "data-flash-frame-domain": G5_L4_FQ23_ATLAS_FRAME_DOMAIN,
    "data-flash-root-frame": "6",
    "data-flash-lang": "en",
    "data-flash-scenario": G5_L4_FQ23_SCENARIO,
    "data-flash-seed": String(state.seed),
    "data-runtime-language": "en",
    "data-runtime-scenario": G5_L4_FQ23_SCENARIO,
    "data-runtime-seed": String(state.seed),
    "data-source-frame-domain": G5_L4_FQ23_SOURCE_FRAME_DOMAIN,
    "data-source-local-frame": String(state.sourceFrame),
    "data-source-question-label": state.questionLabel ?? "",
  };
  if (state.requirementId) {
    attributes["data-flash-requirement-id"] = state.requirementId;
  }
  if (state.traceId) attributes["data-flash-trace-id"] = state.traceId;
  if (state.entryStateSha256) {
    attributes["data-flash-entry-state-sha256"] = state.entryStateSha256;
  }
  for (const [name, value] of Object.entries(attributes)) {
    canvas.setAttribute(name, value);
  }
}

function blockerCopy(blocker: G5L4Fq23QuestionAtlasBlocker | null) {
  if (blocker === "root-domain-disabled") {
    return ["Root timeline unavailable",
      "The source root and InternalPreloader runtime are outside this inspection-only atlas."];
  }
  if (blocker === "source-domain-internal-only") {
    return ["Raw source timeline unavailable",
      "Sprite-694 source frames are internal inputs; request the derived 18-page question-atlas domain."];
  }
  if (blocker === "spanish-disabled") {
    return ["Spanish path unavailable",
      "Spanish visual parity and exact audio routing are not established for this candidate."];
  }
  if (blocker === "frame-out-of-range") {
    return ["Atlas page unavailable", "This inspection atlas exposes only pages 1 through 18."];
  }
  if (blocker === "frame-domain-scenario-mismatch") {
    return ["Frame-domain scenario mismatch",
      "The requested scenario is outside the question-atlas inspection contract."];
  }
  return ["Unsupported deterministic request",
    "This frame domain is outside the hash-bound question-atlas engineering contract."];
}

export function createG5L4Fq23QuestionAtlasCandidate(
  suppliedConfig: G5L4Fq23QuestionAtlasConfig,
) {
  const config = validateConfig(suppliedConfig);
  const stage = Object.freeze({width: 800, height: 600});
  const movie: MovieMetadata = Object.freeze({
    stage,
    fps: 12,
    frameCount: 18,
    durationMs: 1_500,
  });
  const runtime: AnimationRuntimeMetadata = Object.freeze({
    stage,
    fps: 12,
    frameCount: 10,
    durationMs: (10 * 1_000) / 12,
    defaultFrameDomain: G5_L4_FQ23_ATLAS_FRAME_DOMAIN,
    frameDomains: Object.freeze([
      Object.freeze({
        id: G5_L4_FQ23_ATLAS_FRAME_DOMAIN,
        frameCount: 18,
        fps: 12,
        rootFrame: 6,
      }),
    ]),
  });
  const scenarios: readonly RuntimeScenario[] = Object.freeze([
    Object.freeze({
      id: G5_L4_FQ23_SCENARIO,
      label: "English source-bound current-JavaScript question flow",
      description:
        "The hash-bound 18-page atlas supports a deterministic current-JavaScript question order, answer submission, scoring, text review, Replay/reset, and only the source-exact interactive audio assets currently present; listening and synchronization acceptance, AVM1 random parity, source review visuals, Spanish visual parity, and reporting remain unresolved or disabled.",
    }),
    Object.freeze({
      id: "root-unavailable",
      label: "Root timeline (blocked)",
      description: "The source root and InternalPreloader runtime are not executed.",
    }),
  ]);

  const getFrameState = (
    requestedFrame: number,
    context: Pick<
      RuntimeContext,
      | "frameDomain" | "scenario" | "lang" | "seed"
      | "requirementId" | "traceId" | "entryStateSha256"
    >,
  ): G5L4Fq23QuestionAtlasFrameState => {
    const frameDomain = context.frameDomain ?? G5_L4_FQ23_ATLAS_FRAME_DOMAIN;
    const language = context.lang === "es" ? "es" : "en";
    const frameValid = Number.isSafeInteger(requestedFrame) &&
      requestedFrame >= 1 && requestedFrame <= 18;
    const frame = frameValid ? requestedFrame : 1;
    const blocker: G5L4Fq23QuestionAtlasBlocker | null =
      frameDomain === "root" ? "root-domain-disabled"
        : frameDomain === G5_L4_FQ23_SOURCE_FRAME_DOMAIN
          ? "source-domain-internal-only"
          : frameDomain !== G5_L4_FQ23_ATLAS_FRAME_DOMAIN
            ? "unsupported-frame-domain"
            : context.scenario !== G5_L4_FQ23_SCENARIO
              ? "frame-domain-scenario-mismatch"
              : language === "es" ? "spanish-disabled"
                : !frameValid ? "frame-out-of-range" : null;
    const ready = blocker === null;
    const sourceFrame = ready ? frame + 1 : null;
    return Object.freeze({
      animationId: config.animationId,
      requestedFrame,
      frame,
      frameDomain,
      sourceFrame,
      sourceExportFrame: sourceFrame === null ? null : sourceFrame - 1,
      sourceFrameDomain: G5_L4_FQ23_SOURCE_FRAME_DOMAIN,
      rootFrame: 6,
      questionLabel: ready ? `Q${frame}` : null,
      scenario: context.scenario,
      language,
      seed: normalizeSeed(context.seed),
      requirementId: captureIdentity(context.requirementId),
      traceId: captureIdentity(context.traceId),
      entryStateSha256: captureIdentity(context.entryStateSha256),
      status: ready ? "ready" : "blocked",
      blocker,
      sourceStaticQuestionDrawingReady: ready,
      sourceSelectionKind: config.sourceSelection.kind,
      sourceQuestionCount: 18,
      sourcePresentedQuestionCount:
        config.sourceSelection.sourcePresentedQuestionCount,
      livePlaybackEndFrame: 1,
      sequentialPlaybackPermitted: false,
      legacyActionScriptExecuted: false,
      naturalQuestionSelectionEnabled: false,
      answerControlsEnabled: false,
      scoringEnabled: false,
      reviewEnabled: false,
      audioRendered: false,
      timingEnabled: false,
      reportingNetworkEnabled: false,
      sourceReplayEstablished: false,
      currentJavascriptQuestionSequenceEnabled: ready,
      currentJavascriptAnswerSubmissionEnabled: ready,
      currentJavascriptScoringEnabled: ready,
      currentJavascriptTextReviewEnabled: ready,
      currentJavascriptReplayResetEnabled: ready,
      exactAvm1RandomOrderEstablished: false,
      sourceReviewVisualParityEstablished: false,
      naturalRuntimeEstablished: false,
      sourceSwfSha256: config.source.swfSha256,
    });
  };

  const sequenceReducer = (
    state: G5L4Fq23QuestionSequenceState,
    action: G5L4Fq23QuestionSequenceAction,
  ) => reduceG5L4Fq23QuestionSequence(config, state, action);

  function Renderer(props: AnimationRendererProps) {
    const atlasState = useMemo(
      () => getFrameState(props.frame, props),
      [
        props.entryStateSha256, props.frame, props.frameDomain, props.lang,
        props.requirementId, props.scenario, props.seed, props.traceId,
      ],
    );
    const [questionSequence, dispatch] = useReducer(
      sequenceReducer,
      props.seed,
      (seed) => createG5L4Fq23QuestionSequenceState(config, seed),
    );
    const [companionTarget, setCompanionTarget] =
      useState<HTMLElement | null>(null);
    useEffect(() => {
      dispatch({type: "reset", seed: props.seed});
    }, [props.replay, props.seed]);
    useEffect(() => {
      if (!props.pageInteractionCompanionTargetId) {
        setCompanionTarget(null);
        return;
      }
      setCompanionTarget(
        document.getElementById(props.pageInteractionCompanionTargetId),
      );
    }, [props.pageInteractionCompanionTargetId]);
    const captureInspection = hasCompleteCaptureIdentity(atlasState);
    const blocked = atlasState.status === "blocked"
      ? blockerCopy(atlasState.blocker)
      : null;
    const interactionEnabled = blocked === null && !captureInspection;
    const activeQuestionNumber = captureInspection
      ? atlasState.frame
      : getG5L4Fq23ActiveQuestionNumber(questionSequence);
    const audioLanguage = props.uiLanguage ?? props.lang;
    const audioPublicationEnabled = props.audioEnabled === true;
    const questionAudioAsset = !audioPublicationEnabled || activeQuestionNumber === null
      ? undefined
      : getG5L4FqInteractiveAudioAsset(
          audioLanguage,
          activeQuestionNumber,
          null,
        );
    const answerAudioAssets = useMemo(() => Object.freeze(
      Object.fromEntries(G5_L4_FQ23_ANSWER_OPTIONS.map((option) => [
        option,
        !audioPublicationEnabled || activeQuestionNumber === null
          ? undefined
          : getG5L4FqInteractiveAudioAsset(
              audioLanguage,
              activeQuestionNumber,
              option,
            ),
      ])) as Readonly<Record<
        G5L4Fq23AnswerOption,
        G5L4FqInteractiveAudioAsset | undefined
      >>,
    ), [activeQuestionNumber, audioLanguage, audioPublicationEnabled]);
    const interactiveAudioPresentCount =
      (questionAudioAsset ? 1 : 0) +
      G5_L4_FQ23_ANSWER_OPTIONS.filter(
        (option) => answerAudioAssets[option] !== undefined,
      ).length;
    useEffect(() => {
      const activeId = props.activeInteractiveAudioId;
      if (!activeId || !props.onLessonHostRequest) return;
      const belongsToCurrentQuestion =
        questionAudioAsset?.id === activeId ||
        G5_L4_FQ23_ANSWER_OPTIONS.some(
          (option) => answerAudioAssets[option]?.id === activeId,
        );
      if (!belongsToCurrentQuestion) {
        props.onLessonHostRequest({type: "stop-audio", cueId: activeId});
      }
    }, [
      answerAudioAssets,
      props.activeInteractiveAudioId,
      props.onLessonHostRequest,
      questionAudioAsset,
    ]);
    const requestInteractiveAudio = useCallback((
      asset: G5L4FqInteractiveAudioAsset,
      trigger: HTMLButtonElement,
    ) => {
      if (!props.onLessonHostRequest) return;
      const request = props.activeInteractiveAudioId === asset.id
        ? {type: "stop-audio" as const, cueId: asset.id}
        : {type: "play-audio" as const, cueId: asset.id};
      props.onLessonHostRequest(request, {trigger});
    }, [props.activeInteractiveAudioId, props.onLessonHostRequest]);
    const visualState = useMemo(() => {
      if (atlasState.status === "blocked" || activeQuestionNumber === null) {
        return atlasState.status === "blocked" ? atlasState : null;
      }
      if (captureInspection && activeQuestionNumber === atlasState.frame) {
        return atlasState;
      }
      return getFrameState(activeQuestionNumber, props);
    }, [activeQuestionNumber, atlasState, captureInspection, props]);
    const reviewResponse = getG5L4Fq23ActiveReviewResponse(questionSequence);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [canvasStatus, setCanvasStatus] = useState<CanvasStatus>("idle");
    useEffect(() => {
      const canvas = canvasRef.current;
      if (
        !canvas || visualState === null || visualState.status !== "ready" ||
        visualState.sourceFrame === null
      ) {
        setCanvasStatus("idle");
        return;
      }
      let cancelled = false;
      setCanvasStatus("loading");
      loadCanvasAsset(config).then(async (asset) => {
        await asset.ready();
        if (cancelled) return;
        const rendered = asset.render(canvas, {
          frame: visualState.sourceFrame!,
          scenario: G5_L4_FQ23_SCENARIO,
          lang: "en",
          seed: visualState.seed,
        });
        verifyInternalAssetState(canvas, rendered, visualState);
        stampAtlasIdentity(canvas, visualState);
        if (!cancelled) setCanvasStatus("ready");
      }).catch(() => {
        if (!cancelled) setCanvasStatus("error");
      });
      return () => { cancelled = true; };
    }, [visualState]);
    const captureReady = visualState?.status === "ready" &&
      canvasStatus === "ready" && captureInspection;
    const replay = useCallback(() => {
      dispatch({type: "replay", seed: props.seed});
      props.onReplay?.();
    }, [props.onReplay, props.seed]);
    const submitAnswer = useCallback(() => {
      dispatch({type: "submit-answer"});
    }, []);
    const controlButtonStyle = {
      background: "#174f82",
      border: 0,
      borderRadius: 6,
      color: "white",
      cursor: "pointer",
      font: "600 0.95rem/1.2 system-ui, sans-serif",
      minHeight: 42,
      padding: "0.65rem 1rem",
    } as const;
    const audioButton = (
      asset: G5L4FqInteractiveAudioAsset | undefined,
      subject: string,
    ) => {
      const active = asset !== undefined &&
        props.activeInteractiveAudioId === asset.id;
      const available = asset !== undefined &&
        Boolean(props.onLessonHostRequest) &&
        !props.paused;
      const action = !asset
        ? audioLanguage === "es" ? "Audio no disponible" : "Audio unavailable"
        : active
          ? audioLanguage === "es" ? "Detener audio" : "Stop audio"
          : audioLanguage === "es" ? "Reproducir audio" : "Play audio";
      return <button
        aria-label={`${subject}: ${action}`}
        aria-pressed={asset ? active : undefined}
        data-interactive-audio-asset-id={asset?.id}
        data-interactive-audio-status={asset ? "available" : "missing"}
        disabled={!available}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          if (asset) requestInteractiveAudio(asset, event.currentTarget);
        }}
        style={{
          ...controlButtonStyle,
          background: asset ? "#174f82" : "#6c7a86",
          cursor: available ? "pointer" : "not-allowed",
          minHeight: 36,
          opacity: available ? 1 : 0.68,
          padding: "0.45rem 0.65rem",
        }}
        type="button"
      >
        <span aria-hidden="true">{asset ? active ? "■" : "🔊" : "🔇"}</span>{" "}
        {action}
      </button>;
    };
    return (
      <section
        aria-label={config.title}
        data-audio-rendered="false"
        data-authoritative-runtime-validated="false"
        data-answer-behavior-parity-established="false"
        data-candidate-status="source-bound-current-javascript-question-flow-not-strict"
        data-canvas-status={blocked ? "blocked" : canvasStatus}
        data-current-javascript-answer-submission-enabled={
          interactionEnabled ? "true" : "false"
        }
        data-current-javascript-question-order={
          config.sourceSelection.kind === "random-without-replacement"
            ? "seeded-without-replacement-not-avm1-order-parity"
            : "source-sequential-order"
        }
        data-current-javascript-replay-reset-enabled={
          interactionEnabled ? "true" : "false"
        }
        data-current-javascript-scoring-enabled={
          interactionEnabled ? "true" : "false"
        }
        data-current-javascript-text-review-enabled={
          interactionEnabled ? "true" : "false"
        }
        data-exact-avm1-random-order-established="false"
        data-human-visual-review-accepted="false"
        data-interactive-controls-enabled={interactionEnabled ? "true" : "false"}
        data-interactive-audio-coverage={audioPublicationEnabled
          ? "partial-source-exact"
          : "publication-gated-off"}
        data-natural-question-selection-enabled="false"
        data-network-reporting-enabled="false"
        data-owner-accepted="false"
        data-sequential-playback-permitted="false"
        data-source-review-visual-parity-established="false"
        data-source-replay-established="false"
        data-strict-migration-complete="false"
        style={{margin: "0 auto", maxWidth: 800, width: "100%"}}
      >
        <div style={{
          aspectRatio: "800 / 600",
          background: "#b8d8f7",
          overflow: "hidden",
          position: "relative",
          width: "100%",
        }}>
          {blocked ? (
            <div
              aria-live="polite"
              data-fail-closed-reason={atlasState.blocker ?? undefined}
              role="status"
              style={{
                alignItems: "center", background: "#eaf4fb", color: "#17344c",
                display: "flex", flexDirection: "column", height: "100%",
                justifyContent: "center", padding: "8%", textAlign: "center",
              }}
            >
              <strong>{blocked[0]}</strong><p>{blocked[1]}</p>
            </div>
          ) : questionSequence.mode === "results" && interactionEnabled ? (
            <div
              aria-live="polite"
              data-current-javascript-results="true"
              role="status"
              style={{
                alignContent: "center",
                background: "#eaf4fb",
                color: "#17344c",
                display: "grid",
                gap: 14,
                height: "100%",
                justifyItems: "center",
                padding: "8%",
                textAlign: "center",
              }}
            >
              <h2 style={{margin: 0}}>Quiz complete</h2>
              <p style={{fontSize: "1.35rem", margin: 0}}>
                Score: {questionSequence.correctCount} / {questionSequence.responses.length}
              </p>
              <p style={{fontSize: "1.1rem", margin: 0}}>
                Source grade: {questionSequence.grade}
              </p>
              <div style={{display: "flex", flexWrap: "wrap", gap: 10}}>
                <button
                  onClick={() => dispatch({type: "begin-review"})}
                  style={controlButtonStyle}
                  type="button"
                >
                  Review answers
                </button>
                <button onClick={replay} style={controlButtonStyle} type="button">
                  Replay quiz
                </button>
              </div>
            </div>
          ) : visualState !== null ? (
            <>
              <canvas
                aria-label={captureInspection
                  ? `Source-static ${visualState.questionLabel} drawing; capture inspection`
                  : `Source-static ${visualState.questionLabel} question drawing`}
                className="faithful-stage-wrap"
                data-animation-id={config.animationId}
                data-candidate-status="source-bound-current-javascript-question-flow-not-strict"
                data-capture-identity-status={
                  captureInspection ? "verified" : "not-capture"
                }
                data-capture-stage={captureReady ? "true" : undefined}
                data-course-canvas={config.animationId}
                data-render-state={canvasStatus}
                data-render-visual={canvasStatus === "ready" ? "true" : undefined}
                height={600}
                ref={canvasRef}
                role="img"
                style={{
                  aspectRatio: "800 / 600",
                  display: canvasStatus === "ready" ? "block" : "none",
                  height: "auto", pointerEvents: "none", width: "100%",
                }}
                width={800}
              />
              {canvasStatus === "idle" || canvasStatus === "loading" ? (
                <span aria-live="polite" role="status">Loading source-static question drawing…</span>
              ) : null}
              {canvasStatus === "error" ? (
                <p aria-live="assertive" role="alert">
                  The local drawing asset failed safely. No legacy, audio, network,
                  or remote fallback was executed.
                </p>
              ) : null}
            </>
          ) : null}
        </div>
        {(() => {
          const companion = <div
            className="g5-l4-fq23-question-companion"
            data-current-javascript-question-companion="true"
          >
          {interactionEnabled && questionSequence.mode === "question" ? (
          <form
            data-current-javascript-question-controls="true"
            data-interactive-audio-missing-count={
              5 - interactiveAudioPresentCount
            }
            data-interactive-audio-present-count={interactiveAudioPresentCount}
            onSubmit={(event) => {
              event.preventDefault();
              submitAnswer();
            }}
            style={{
              background: "#f7fbff",
              border: "1px solid #9db8cf",
              display: "grid",
              gap: 12,
              padding: 16,
            }}
          >
            <div style={{
              alignItems: "center",
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
              justifyContent: "space-between",
            }}>
              <strong>
                {audioLanguage === "es" ? "Pregunta" : "Question"}{" "}
                {questionSequence.questionPosition + 1}{" "}
                {audioLanguage === "es" ? "de" : "of"}{" "}
                {questionSequence.sourcePresentedQuestionCount}
              </strong>
              {audioButton(
                questionAudioAsset,
                audioLanguage === "es" ? "Audio de la pregunta" : "Question audio",
              )}
            </div>
            <fieldset
              style={{
                border: 0,
                display: "grid",
                gap: 10,
                gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                margin: 0,
                padding: 0,
              }}
            >
              <legend style={{font: "600 1rem/1.4 system-ui, sans-serif"}}>
                {audioLanguage === "es"
                  ? "Elige A, B, C o D"
                  : "Choose A, B, C, or D"}
              </legend>
              {G5_L4_FQ23_ANSWER_OPTIONS.map((option) => {
                const answerAudioAsset = answerAudioAssets[option];
                return <div
                  key={option}
                  style={{
                    background: questionSequence.selectedOption === option
                      ? "#dceeff"
                      : "white",
                    border: "1px solid #7d9db8",
                    borderRadius: 6,
                    display: "grid",
                    gap: 8,
                    padding: 8,
                  }}
                >
                  <label style={{
                    alignItems: "center",
                    display: "flex",
                    font: "600 1rem/1.2 system-ui, sans-serif",
                    gap: 8,
                    justifyContent: "center",
                    minHeight: 36,
                  }}>
                    <input
                      checked={questionSequence.selectedOption === option}
                      name={`${config.animationId}-answer`}
                      onChange={() => dispatch({
                        type: "select-answer",
                        option: option as G5L4Fq23AnswerOption,
                      })}
                      type="radio"
                      value={option}
                    />
                    {option}
                  </label>
                  {audioButton(
                    answerAudioAsset,
                    audioLanguage === "es"
                      ? `Audio de la respuesta ${option}`
                      : `Answer ${option} audio`,
                  )}
                </div>;
              })}
            </fieldset>
            <div style={{display: "flex", flexWrap: "wrap", gap: 10}}>
              <button
                disabled={questionSequence.selectedOption === null}
                style={{
                  ...controlButtonStyle,
                  cursor: questionSequence.selectedOption === null
                    ? "not-allowed"
                    : "pointer",
                  opacity: questionSequence.selectedOption === null ? 0.55 : 1,
                }}
                type="submit"
              >
                {questionSequence.questionPosition + 1 ===
                  questionSequence.sourcePresentedQuestionCount
                  ? "Submit answer and show results"
                  : "Submit answer and continue"}
              </button>
              <button onClick={replay} style={controlButtonStyle} type="button">
                Replay quiz
              </button>
            </div>
          </form>
          ) : null}
          {interactionEnabled && questionSequence.mode === "review" && reviewResponse ? (
          <div
            data-current-javascript-text-review="true"
            style={{
              background: "#f7fbff",
              border: "1px solid #9db8cf",
              display: "grid",
              gap: 10,
              padding: 16,
            }}
          >
            <p aria-live="polite" style={{margin: 0}}>
              Review {questionSequence.reviewPosition + 1} of {questionSequence.responses.length}: {reviewResponse.questionLabel}. Your answer: {reviewResponse.selectedOption}. Correct answer: {reviewResponse.correctOption}. {reviewResponse.correct ? "Correct." : "Incorrect."}
            </p>
            <div style={{display: "flex", flexWrap: "wrap", gap: 10}}>
              <button
                disabled={questionSequence.reviewPosition === 0}
                onClick={() => dispatch({type: "review-previous"})}
                style={controlButtonStyle}
                type="button"
              >
                Previous review
              </button>
              <button
                disabled={
                  questionSequence.reviewPosition ===
                    questionSequence.responses.length - 1
                }
                onClick={() => dispatch({type: "review-next"})}
                style={controlButtonStyle}
                type="button"
              >
                Next review
              </button>
              <button
                onClick={() => dispatch({type: "show-results"})}
                style={controlButtonStyle}
                type="button"
              >
                Back to results
              </button>
              <button onClick={replay} style={controlButtonStyle} type="button">
                Replay quiz
              </button>
            </div>
          </div>
          ) : null}
          <p
            data-current-javascript-replay-reset="seed-bound-complete"
            data-source-replay-parity="unvalidated"
          >
            The current-JavaScript candidate implements the source-script-bound
            question count/order rule, A–D submission, scoring, grade bands,
            text review, and whole-state Replay/reset. It does not execute AVM1;
            FQ002&apos;s deterministic seed does not establish the original
            Player&apos;s random order. Exact source-bound question/answer audio
            assets are exposed only where present; listening, synchronization,
            source review visuals, timer, reports, Spanish visual parity,
            original-runtime parity, RMSE, human review, Owner acceptance,
            strict completion, and publication remain unclaimed.
          </p>
          </div>;
          return companionTarget
            ? createPortal(companion, companionTarget)
            : companion;
        })()}
      </section>
    );
  }

  const sourceContract = Object.freeze({
    status:
      "source-static-question-atlas-inspection-current-javascript-engineering-candidate-only",
    atlasFrameDomain: G5_L4_FQ23_ATLAS_FRAME_DOMAIN,
    atlasFrameRange: Object.freeze([1, 18] as const),
    sourceFrameDomain: G5_L4_FQ23_SOURCE_FRAME_DOMAIN,
    sourceFrameRange: Object.freeze([2, 19] as const),
    sourceFrameMapping: "source-frame-equals-atlas-frame-plus-one",
    sourceStructure: Object.freeze({
      sourceFrameCount: 56,
      doActionFrames: Object.freeze([1, 21, 37] as const),
      placeObject2Count: 861,
      removeObject2Count: 637,
    }),
    sourceSelection: config.sourceSelection,
    livePlaybackEndFrame: 1,
    sequentialPlaybackPermitted: false,
    sourceHiddenFinishSuppression: Object.freeze({
      instanceName: "Mc_Finish",
      objectId: 16,
      sourceStatement: "Mc_Finish._visible = false;",
      suppressedPlacementCount: 55,
    }),
    visualLanguages: Object.freeze(["en"] as const),
    spanishVisualStatus: "disabled-unvalidated",
    audioStatus:
      "source-exact-interactive-assets-current-js-host-wired-listening-and-sync-pending",
    legacyActionScriptStatus: "not-executed",
    currentJavascriptBehavior: config.currentJavascriptBehavior,
    currentJavascriptBehaviorStatus:
      "source-script-bound-question-order-answer-scoring-text-review-and-replay-reset-candidate",
    currentJavascriptSeedDisposition:
      config.sourceSelection.kind === "random-without-replacement"
        ? "mulberry32-deterministic-order-not-avm1-random-parity"
        : "seed-recorded-order-source-sequential-and-seed-independent",
    sourceScriptEvidence:
      G5_L4_FQ23_SOURCE_SCRIPT_EVIDENCE[config.animationId],
    answerScoringReviewTimerReportStatus:
      "current-js-answer-scoring-and-text-review-enabled-source-review-visuals-timer-and-report-disabled",
    sourceReplayStatus: "unvalidated",
    currentJavascriptReplayStatus: "complete-seed-bound-whole-state-reset",
    originalRuntimeBaselineStatus: "not-used",
    fullFrameRmseStatus: "not-performed",
    canonicalFrameDomainDispositionStatus: "unresolved-unchanged",
    acceptanceEffects: config.acceptanceEffects,
    strictAcceptanceEffect: "none",
  });

  const module: AnimationModule<G5L4Fq23QuestionAtlasFrameState> = Object.freeze({
    key: config.animationId,
    movie,
    runtime,
    playbackMode: "once",
    playbackEndFrame: 1,
    playbackEndFrameByDomain: Object.freeze({
      root: 1,
      [G5_L4_FQ23_ATLAS_FRAME_DOMAIN]: 1,
    }),
    reducedMotionFrame: 1,
    defaultScenarioByFrameDomain: Object.freeze({
      root: "root-unavailable",
      [G5_L4_FQ23_ATLAS_FRAME_DOMAIN]: G5_L4_FQ23_SCENARIO,
    }),
    scenarios,
    audioCues: Object.freeze([]),
    interactiveAudioAssets: G5_L4_FQ_INTERACTIVE_AUDIO_ASSETS,
    lessonHost: Object.freeze({
      capabilities: Object.freeze(["audio"] as const),
      legacyOperations: "blocked",
      auditStorage: "memory-only",
      storesPersonalData: false,
    }),
    transport: Object.freeze({
      mode: "visual-frame-inspector",
      frameDomains: Object.freeze([G5_L4_FQ23_ATLAS_FRAME_DOMAIN]),
      stepFrames: 1,
      stateReconstruction: "renderer-remount-on-seek",
      audioDisposition: "disabled-while-inspecting",
      legacyBehaviorParity: false,
      strictAcceptanceEffect: "none",
    }),
    maturity: "legacy-prototype",
    Renderer,
    getFrameState,
  });
  return Object.freeze({movie, runtime, scenarios, sourceContract, getFrameState,
    Renderer, module});
}
