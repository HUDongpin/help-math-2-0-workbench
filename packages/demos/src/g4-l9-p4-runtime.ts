"use client";

import React, {
  createElement,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type {
  AnimationModule,
  AnimationRendererProps,
  RuntimeContext,
} from "./contract";
import type {
  LessonHostDecision,
  LessonHostRequest,
} from "./lesson-host-contract";
import {
  createG4L9P4FeedbackHostRequest,
  createG4L9P4InteractionState,
  createG4L9P4ReplayHostRequests,
  expectedG4L9P4Option,
  g4L9P4DragOutcome,
  getG4L9P4FrameState,
  reduceG4L9P4Interaction,
  type G4L9P4PageConfig,
} from "./g4-l9-p4-state-machines";

interface CanvasAsset {
  readonly ready: () => Promise<void>;
  readonly render: (
    canvas: HTMLCanvasElement,
    request: Readonly<{
      frame: number;
      scenario: string;
      lang: string;
      seed: number;
    }>,
  ) => unknown;
}

type CanvasAssetWindow = Window & {
  HELP_MATH_CANVAS_ASSETS?: Record<string, CanvasAsset>;
};

const assetLoads = new Map<string, Promise<CanvasAsset>>();

function canvasSource(animationId: string): string {
  return `/flash-assets/courses/${animationId}/canvas-renderer.js`;
}

function loadCanvasAsset(animationId: string): Promise<CanvasAsset> {
  const canvasWindow = window as CanvasAssetWindow;
  const existingAsset = canvasWindow.HELP_MATH_CANVAS_ASSETS?.[animationId];
  if (existingAsset) return Promise.resolve(existingAsset);
  const pending = assetLoads.get(animationId);
  if (pending) return pending;
  const load = new Promise<CanvasAsset>((resolve, reject) => {
    const selector = `script[data-help-math-canvas-asset="${animationId}"]`;
    const existing = document.querySelector<HTMLScriptElement>(selector);
    const script = existing ?? document.createElement("script");
    script.onload = () => {
      const asset = canvasWindow.HELP_MATH_CANVAS_ASSETS?.[animationId];
      if (asset) resolve(asset);
      else reject(new Error(`Missing Canvas registration for ${animationId}`));
    };
    script.onerror = () =>
      reject(new Error(`Unable to load ${canvasSource(animationId)}`));
    if (!existing) {
      script.async = true;
      script.dataset.helpMathCanvasAsset = animationId;
      script.src = canvasSource(animationId);
      document.head.appendChild(script);
    }
  }).catch((error) => {
    assetLoads.delete(animationId);
    throw error;
  });
  assetLoads.set(animationId, load);
  return load;
}

function hostRequest(
  callback: AnimationRendererProps["onLessonHostRequest"],
  request: LessonHostRequest,
  trigger?: HTMLElement,
): LessonHostDecision | void {
  return callback?.(request, trigger ? { trigger } : undefined);
}

function rendererFor(config: G4L9P4PageConfig) {
  return function G4L9P4Renderer(props: AnimationRendererProps) {
    const replay = props.replay ?? 0;
    const [state, setState] = useState(() =>
      createG4L9P4InteractionState(config, props.seed, replay),
    );
    const [canvasStatus, setCanvasStatus] = useState<
      "loading" | "ready" | "error"
    >("loading");
    const [lastHostDecision, setLastHostDecision] = useState<string>("none");
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const replayHostStateRef = useRef({
      activeInteractiveAudioId: props.activeInteractiveAudioId ?? null,
      callback: props.onLessonHostRequest,
      state,
    });
    const replayHostClearedRef = useRef(false);
    replayHostStateRef.current = {
      activeInteractiveAudioId: props.activeInteractiveAudioId ?? null,
      callback: props.onLessonHostRequest,
      state,
    };
    const deterministicFrame = useMemo(
      () =>
        getG4L9P4FrameState(config, props.frame, {
          frameDomain: props.frameDomain,
          lang: props.lang,
          scenario: props.scenario,
          seed: props.seed,
          replay,
        }),
      [
        props.frame,
        props.frameDomain,
        props.lang,
        props.scenario,
        props.seed,
        replay,
      ],
    );

    useEffect(() => {
      setState(createG4L9P4InteractionState(config, props.seed, replay));
    }, [props.seed, replay]);

    const clearReplayHostState = () => {
      if (replayHostClearedRef.current) return undefined;
      const current = replayHostStateRef.current;
      let decision: LessonHostDecision | void = undefined;
      for (const request of createG4L9P4ReplayHostRequests(
        config,
        current.state,
        current.activeInteractiveAudioId,
      )) {
        decision = hostRequest(current.callback, request);
      }
      replayHostClearedRef.current = true;
      return decision;
    };

    useEffect(() => () => {
      // The modern My Lesson Replay control remounts this renderer. Clearing
      // the exact host channels here gives that outer control the same reset
      // semantics as the renderer-owned Replay button without broadening the
      // generic AnimationRuntime contract.
      clearReplayHostState();
    }, []);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      let active = true;
      setCanvasStatus("loading");
      loadCanvasAsset(config.animationId)
        .then(async (asset) => {
          await asset.ready();
          if (!active) return;
          asset.render(canvas, {
            frame: deterministicFrame.frame,
            scenario: deterministicFrame.scenario,
            lang: deterministicFrame.language,
            seed: deterministicFrame.seed,
          });
          setCanvasStatus("ready");
        })
        .catch(() => {
          if (active) setCanvasStatus("error");
        });
      return () => {
        active = false;
      };
    }, [deterministicFrame]);

    const spanish = props.uiLanguage === "es";
    const sourceControlsFlowLayout =
      config.animationId === "course-g04-l09-ti-004" &&
      config.sourceOccurrence === 29 &&
      config.randomCycle?.adapter ===
        "rndAudio-source-array-seeded-cycle-v1";
    const answer = (option: number) => {
      const correct =
        option ===
        expectedG4L9P4Option(config, state.questionIndex, state.seed);
      setState((value) =>
        reduceG4L9P4Interaction(config, value, { type: "answer", option }),
      );
      replayHostClearedRef.current = false;
      const request = createG4L9P4FeedbackHostRequest(config, state, correct);
      const decision = hostRequest(props.onLessonHostRequest, request);
      setLastHostDecision(decision?.status ?? "unhandled");
    };
    const begin = () =>
      setState((value) =>
        reduceG4L9P4Interaction(config, value, { type: "start" }),
      );
    const next = () => {
      const resetRequest: LessonHostRequest =
        config.randomCycle || config.behavior === "final-quiz"
          ? { type: "reset-practice-feedback" }
          : {
              type: "reset-practice-feedback",
              interactionId: `${config.animationId}-q${state.questionIndex + 1}`,
            };
      hostRequest(props.onLessonHostRequest, resetRequest);
      setState((value) =>
        reduceG4L9P4Interaction(config, value, { type: "next" }),
      );
    };
    const glossary = (
      entryId: string,
      event: React.MouseEvent<HTMLButtonElement>,
    ) => {
      const decision = hostRequest(
        props.onLessonHostRequest,
        { type: "open-glossary", entryId },
        event.currentTarget,
      );
      setLastHostDecision(decision?.status ?? "unhandled");
    };
    const drag = (sourceInstance: string) => {
      const outcome = g4L9P4DragOutcome(config, sourceInstance);
      if (!outcome || state.phase !== "question") return;
      if (config.randomCycle) {
        const correct = outcome === "correct";
        setState((value) =>
          reduceG4L9P4Interaction(config, value, {
            type: "drag",
            sourceInstance,
          }),
        );
        replayHostClearedRef.current = false;
        const request = createG4L9P4FeedbackHostRequest(
          config,
          state,
          correct,
        );
        const decision = hostRequest(props.onLessonHostRequest, request);
        setLastHostDecision(decision?.status ?? "unhandled");
        return;
      }
      const expected = expectedG4L9P4Option(
        config,
        state.questionIndex,
        state.seed,
      );
      answer(outcome === "correct" ? expected : (expected + 1) % 3);
    };
    const audio = () => {
      if (!config.audio || !props.audioEnabled) return;
      if (state.audioLifecycle !== "requested") {
        replayHostClearedRef.current = false;
      }
      const request: LessonHostRequest =
        state.audioLifecycle === "requested"
          ? { type: "stop-audio", cueId: `${config.animationId}-narration` }
          : { type: "play-audio", cueId: `${config.animationId}-narration` };
      const decision = hostRequest(props.onLessonHostRequest, request);
      setLastHostDecision(decision?.status ?? "unhandled");
      setState((value) =>
        reduceG4L9P4Interaction(config, value, {
          type:
            value.audioLifecycle === "requested"
              ? "audio-stop"
              : "audio-request",
        }),
      );
    };
    const blockLegacy = (operation: "getURL" | "report") => {
      const decision = hostRequest(props.onLessonHostRequest, {
        type: "legacy",
        operation,
      });
      // The renderer owns an unconditional deny boundary even when a host
      // runtime deliberately filters legacy intents before adapter dispatch.
      setLastHostDecision(decision?.status ?? "blocked");
      setState((value) =>
        reduceG4L9P4Interaction(config, value, { type: "legacy-intent" }),
      );
    };
    const course = () => {
      const decision = hostRequest(props.onLessonHostRequest, {
        type: "navigate",
        targetAnimationId: config.animationId,
      });
      setLastHostDecision(decision?.status ?? "unhandled");
    };
    const replayPage = () => {
      const decision = clearReplayHostState();
      setLastHostDecision(decision?.status ?? "unhandled");
      setState((value) =>
        reduceG4L9P4Interaction(config, value, {
          type: "replay",
          replay: value.replay + 1,
        }),
      );
      props.onReplay?.();
    };

    const questionControls =
      state.phase === "intro"
        ? createElement(
            "button",
            { onClick: begin, type: "button" },
            spanish ? "Comenzar" : "Start",
          )
        : state.phase === "question" && config.randomCycle
          ? createElement(
              "p",
              { "data-source-choice": state.choiceLabel },
              `${spanish ? "Elección de origen" : "Source choice"}: ${state.choiceLabel}`,
            )
          : state.phase === "question"
          ? createElement(
              "div",
              { className: "g4-l9-p4__answers" },
              [0, 1, 2].map((option) =>
                createElement(
                  "button",
                  {
                    key: option,
                    onClick: () => answer(option),
                    type: "button",
                  },
                  `${spanish ? "Opción" : "Option"} ${String.fromCharCode(65 + option)}`,
                ),
              ),
            )
          : state.phase === "feedback"
            ? createElement(
                React.Fragment,
                null,
                createElement(
                  "p",
                  {
                    "aria-live": "polite",
                    "data-feedback": state.feedback,
                  },
                  state.feedback === "correct"
                    ? spanish
                      ? "Correcto."
                      : "Correct."
                    : spanish
                      ? "Inténtalo de nuevo en la próxima pregunta."
                      : "Try the next question.",
                ),
                createElement(
                  "button",
                  { onClick: next, type: "button" },
                  spanish ? "Siguiente" : "Next",
                ),
              )
            : createElement(
                "div",
                { "data-final": "true" },
                createElement(
                  "strong",
                  null,
                  `${spanish ? "Final" : "Final"}: ${state.score}/${config.questionCount}`,
                ),
                createElement(
                  "button",
                  { onClick: replayPage, type: "button" },
                  spanish ? "Repetir" : "Repeat",
                ),
              );

    return createElement(
      "section",
      {
        className: "g4-l9-p4",
        "data-animation-id": config.animationId,
        "data-audio-acceptance": "not-established",
        "data-audio-lifecycle": state.audioLifecycle,
        "data-canvas-status": canvasStatus,
        "data-fidelity-accepted": "false",
        "data-host-decision": lastHostDecision,
        "data-host-symbol-count": config.hostContractSymbols?.length ?? 0,
        "data-lane": config.lane,
        "data-legacy-network-policy": config.legacyNetworkPolicy,
        "data-network-calls": state.networkCalls,
        "data-original-runtime-validated": "false",
        "data-private-current-js": "true",
        "data-product-layout": sourceControlsFlowLayout
          ? "source-controls-flow-v2"
          : undefined,
        "data-replay": state.replay,
        "data-question-index": state.questionIndex + 1,
        "data-score": state.score,
        "data-attempts": state.attempts,
        "data-try-count": state.tryCount,
        "data-choice-index": state.choiceIndex,
        "data-choice-label": state.choiceLabel,
        "data-choice-order": state.choiceOrder.join(","),
        "data-correct-placement-count": state.placedCorrect.length,
        "data-correct-placements": state.placedCorrect.join(","),
        "data-last-drag-source-instance": state.lastDragSourceInstance ?? "",
        "data-terminal": state.phase === "final" ? "true" : "false",
        "data-blocked-legacy-intents": state.blockedLegacyIntents,
        "data-do-get-rnd-quest-adapter": config.randomQuestionAdapter ?? "not-applicable",
        "data-random-cycle-adapter":
          config.randomCycle?.adapter ?? "not-applicable",
        "data-drag-correct": config.dragBindings
          ?.filter((binding) => binding.outcome === "correct")
          .map((binding) => binding.sourceInstance)
          .join(",") ?? "",
        "data-drag-incorrect": config.dragBindings
          ?.filter((binding) => binding.outcome === "incorrect")
          .map((binding) => binding.sourceInstance)
          .join(",") ?? "",
        "data-source-occurrence": config.sourceOccurrence,
      },
      createElement(
        "div",
        {
          className: "g4-l9-p4__stage",
          "data-source-controls-layout": sourceControlsFlowLayout
            ? "separate-flow-regions"
            : undefined,
        },
        createElement("canvas", {
          "aria-label": `${config.pageTitle} source-bound Current-JS candidate`,
          "data-source-safe-region": sourceControlsFlowLayout
            ? "true"
            : undefined,
          height: 600,
          ref: canvasRef,
          width: 800,
        }),
        createElement(
          "div",
          {
            className: "g4-l9-p4__card",
            "data-interaction-panel": sourceControlsFlowLayout
              ? "true"
              : undefined,
          },
          createElement(
            "p",
            null,
            `${config.sectionCode} · ${config.pageTitle}`,
          ),
          createElement(
            "p",
            null,
            config.randomCycle
              ? `${spanish ? "Elección" : "Choice"} ${state.choiceLabel} · ${spanish ? "Intentos" : "Tries"} ${state.tryCount}`
              : `${spanish ? "Pregunta" : "Question"} ${Math.min(state.questionIndex + 1, config.questionCount)} / ${config.questionCount}`,
          ),
          questionControls,
          state.phase === "question" && config.dragBindings
            ? createElement(
                "div",
                {
                  className: "g4-l9-p4__drags",
                  "aria-label": spanish
                    ? "Controles de arrastre de origen"
                    : "Source drag controls",
                },
                config.dragBindings.map((binding) =>
                  createElement(
                    "button",
                    {
                      key: binding.sourceInstance,
                      disabled: state.placedCorrect.includes(
                        binding.sourceInstance,
                      ),
                      onClick: () => drag(binding.sourceInstance),
                      type: "button",
                    },
                    `${spanish ? "Soltar" : "Drop"} ${binding.sourceInstance}`,
                  ),
                ),
              )
            : null,
        ),
      ),
      createElement(
        "nav",
        {
          "aria-label": spanish ? "Controles de página" : "Page controls",
          "data-required-control-surface": sourceControlsFlowLayout
            ? "true"
            : undefined,
        },
        (config.glossaryHandlers ?? [
          {
            handlerIndex: 1,
            sourceIntent: "Equation",
            resolvedKeyAttribute: "Equation",
            entryId: "equation",
            resolution: "exact-screen-key-term" as const,
          },
        ]).map((handler) =>
          createElement(
            "button",
            {
              "aria-label": `Glossary ${handler.handlerIndex}: ${handler.sourceIntent}`,
              "data-p5-1-required-control": sourceControlsFlowLayout
                ? `glossary-${String(handler.handlerIndex).padStart(2, "0")}`
                : undefined,
              key: handler.handlerIndex,
              onClick: (event: React.MouseEvent<HTMLButtonElement>) =>
                glossary(handler.entryId, event),
              type: "button",
            },
            `${spanish ? "Glosario" : "Glossary"} ${handler.handlerIndex}`,
          ),
        ),
        config.audio
          ? createElement(
              "button",
              {
                "data-p5-1-required-control": sourceControlsFlowLayout
                  ? "audio"
                  : undefined,
                disabled: !props.audioEnabled,
                onClick: audio,
                type: "button",
              },
              state.audioLifecycle === "requested"
                ? spanish
                  ? "Detener audio"
                  : "Stop audio"
                : spanish
                  ? "Reproducir audio"
                  : "Play audio",
            )
          : null,
        createElement(
          "button",
          {
            "data-p5-1-required-control": sourceControlsFlowLayout
              ? "replay"
              : undefined,
            onClick: replayPage,
            type: "button",
          },
          spanish ? "Repetir" : "Replay",
        ),
        config.sectionCode === "FQ" || config.randomQuestionAdapter
          ? createElement(
              "button",
              { onClick: () => blockLegacy("report"), type: "button" },
              spanish ? "Informe bloqueado" : "Blocked report",
            )
          : null,
        config.randomQuestionAdapter
          ? createElement(
              "button",
              { onClick: () => blockLegacy("getURL"), type: "button" },
              spanish ? "getURL bloqueado" : "Blocked getURL",
            )
          : null,
        config.randomQuestionAdapter
          ? createElement(
              "button",
              { onClick: course, type: "button" },
              spanish ? "Curso" : "Course",
            )
          : null,
      ),
      createElement(
        "style",
        null,
        `
        .g4-l9-p4{display:grid;gap:.65rem;color:#18365a;font:600 14px/1.35 system-ui,sans-serif}
        .g4-l9-p4__stage{aspect-ratio:4/3;border-radius:18px;overflow:hidden;position:relative;background:#eef8ff}
        .g4-l9-p4 canvas{display:block;width:100%;height:100%}
        .g4-l9-p4__card{position:absolute;inset:auto 7% 7%;padding:1rem;border:2px solid #154d78;border-radius:16px;background:rgba(255,255,255,.94);box-shadow:0 10px 30px #18365a24}
        .g4-l9-p4__answers,.g4-l9-p4__drags,.g4-l9-p4 nav{display:flex;flex-wrap:wrap;gap:.55rem}
        .g4-l9-p4 nav{max-height:9rem;overflow:auto;padding:.25rem}
        .g4-l9-p4 button{min-height:44px;padding:.55rem .9rem;border:0;border-radius:999px;background:#0b6da8;color:white;font:inherit;cursor:pointer}
        .g4-l9-p4 button:disabled{background:#789;cursor:not-allowed}
      `,
      ),
    );
  };
}

export function createG4L9P4Module(config: G4L9P4PageConfig): AnimationModule {
  const Renderer = rendererFor(config);
  const scenarioId = config.scenarioId ?? "p4-product-behavior";
  return Object.freeze({
    key: config.animationId,
    movie: Object.freeze({
      stage: Object.freeze({ width: 800, height: 600 }),
      fps: config.fps,
      frameCount: config.rootFrameCount,
      durationMs: Math.round((config.rootFrameCount / config.fps) * 1000),
    }),
    runtime: Object.freeze({
      stage: Object.freeze({ width: 800, height: 600 }),
      fps: config.fps,
      frameCount: config.rootFrameCount,
      durationMs: Math.round((config.rootFrameCount / config.fps) * 1000),
      defaultFrameDomain: config.frameDomain,
      frameDomains: Object.freeze([
        Object.freeze({
          id: "root",
          frameCount: config.rootFrameCount,
          fps: config.fps,
        }),
        Object.freeze({
          id: config.frameDomain,
          frameCount: config.frameCount,
          fps: config.fps,
          rootFrame: 1,
        }),
      ]),
    }),
    playbackMode: "once",
    playbackEndFrame: config.rootFrameCount,
    playbackEndFrameByDomain: Object.freeze({
      [config.frameDomain]: config.frameCount,
    }),
    reducedMotionFrame: 1,
    scenarios: Object.freeze([
      Object.freeze({
        id: scenarioId,
        label: config.scenarioLabel ?? (config.scenarioId
          ? "P5 bounded F08 occurrence-32 stress behavior"
          : "P4 deterministic product behavior"),
        description:
          "Maintained engineering state machine; original-runtime parity is not established.",
      }),
    ]),
    defaultScenarioByFrameDomain: Object.freeze({
      root: scenarioId,
      [config.frameDomain]: scenarioId,
    }),
    audioCues: Object.freeze([]),
    audioTracks: config.audio
      ? Object.freeze([
          Object.freeze({
            id: `${config.animationId}-narration`,
            language: "shared" as const,
            spokenLanguage: "undetermined" as const,
            label:
              "Exact source narration (language and listening acceptance undetermined)",
            source: config.audio.candidatePath,
            durationMs:
              config.audio.durationMs ??
              Math.round((config.frameCount / config.fps) * 1000),
            sha256: config.audio.sourceSha256,
            activation: "user" as const,
            visibleWhen: Object.freeze(["en", "es"] as const),
            frameDomains: Object.freeze([config.frameDomain]),
            timelineBehavior: "none" as const,
          }),
        ])
      : Object.freeze([]),
    interactiveAudioAssets:
      config.audio && (config.randomQuestionAdapter || config.randomCycle)
        ? Object.freeze([
            Object.freeze({
              id: `${config.animationId}-narration`,
              language: "en" as const,
              spokenLanguage: "undetermined" as const,
              source:
                `${config.audio.candidatePath}?sha256=${config.audio.sourceSha256}`,
              sha256: config.audio.sourceSha256,
            }),
            Object.freeze({
              id: `${config.animationId}-narration`,
              language: "es" as const,
              spokenLanguage: "undetermined" as const,
              source:
                `${config.audio.candidatePath}?sha256=${config.audio.sourceSha256}`,
              sha256: config.audio.sourceSha256,
            }),
          ])
        : undefined,
    lessonHost: Object.freeze({
      capabilities: config.randomQuestionAdapter || config.randomCycle
        ? Object.freeze([
            "audio",
            "glossary",
            "navigation",
            "fq-scoring",
            "practice-feedback",
          ] as const)
        : Object.freeze([
            "audio",
            "glossary",
            "fq-scoring",
            "practice-feedback",
          ] as const),
      legacyOperations: "blocked",
      auditStorage: "memory-only",
      storesPersonalData: false,
    }),
    maturity: "private-current-js",
    Renderer,
    getFrameState(frame: number, context: RuntimeContext) {
      return getG4L9P4FrameState(config, frame, context);
    },
  });
}
