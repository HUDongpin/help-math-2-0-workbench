"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

import type { AnimationModule, AnimationRendererProps } from "../contract";
import type {
  LessonHostDecision,
  LessonHostRequest,
} from "../lesson-host-contract";
import {
  buildCourseG04L09Gs002QuestionOrder,
  COURSE_G04_L09_GS_002_MOVIE,
  COURSE_G04_L09_GS_002_RUNTIME,
  COURSE_G04_L09_GS_002_SCENARIOS,
  getCourseG04L09Gs002FrameState,
  type CourseG04L09Gs002FrameState,
} from "../timelines/course-g04-l09-gs-002";

const ANIMATION_ID = "course-g04-l09-gs-002";
const ASSET_SOURCE = `/flash-assets/courses/${ANIMATION_ID}/canvas-renderer.js`;

interface CanvasAsset {
  readonly ready: () => Promise<void>;
  readonly render: (
    canvas: HTMLCanvasElement,
    request: { frame: number; scenario: string; lang: string; seed: number },
  ) => unknown;
}

type CanvasAssetWindow = Window & {
  HELP_MATH_CANVAS_ASSETS?: Record<string, CanvasAsset>;
};

let assetLoadPromise: Promise<CanvasAsset> | null = null;
function loadCanvasAsset(): Promise<CanvasAsset> {
  const canvasWindow = window as CanvasAssetWindow;
  const registered = canvasWindow.HELP_MATH_CANVAS_ASSETS?.[ANIMATION_ID];
  if (registered) return Promise.resolve(registered);
  if (assetLoadPromise) return assetLoadPromise;
  assetLoadPromise = new Promise<CanvasAsset>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[data-help-math-canvas-asset="${ANIMATION_ID}"]`,
    );
    const script = existing ?? document.createElement("script");
    script.onload = () => {
      const asset = canvasWindow.HELP_MATH_CANVAS_ASSETS?.[ANIMATION_ID];
      if (asset) resolve(asset);
      else reject(new Error("GS002 Canvas asset did not register"));
    };
    script.onerror = () =>
      reject(new Error("GS002 Canvas asset failed to load"));
    if (!existing) {
      script.async = true;
      script.dataset.helpMathCanvasAsset = ANIMATION_ID;
      script.src = ASSET_SOURCE;
      document.head.appendChild(script);
    }
  }).catch((error) => {
    assetLoadPromise = null;
    throw error;
  });
  return assetLoadPromise;
}

interface GameState {
  readonly questionIndex: number;
  readonly score: number;
  readonly feedback: "idle" | "correct" | "incorrect";
  readonly final: boolean;
  readonly replay: number;
  readonly blockedLegacyIntents: number;
  readonly networkCalls: 0;
}

function initialGame(replay: number): GameState {
  return Object.freeze({
    questionIndex: 0,
    score: 0,
    feedback: "idle",
    final: false,
    replay,
    blockedLegacyIntents: 0,
    networkCalls: 0,
  });
}

function send(
  callback: AnimationRendererProps["onLessonHostRequest"],
  request: LessonHostRequest,
  trigger?: HTMLElement,
): LessonHostDecision | void {
  return callback?.(request, trigger ? { trigger } : undefined);
}

export function buildCourseG04L09Gs002CaptureAttributes({
  state,
  canvasStatus,
}: {
  state: CourseG04L09Gs002FrameState;
  canvasStatus: string;
}) {
  return {
    "data-animation-id": ANIMATION_ID,
    "data-render-state": state.status === "ready" ? canvasStatus : "blocked",
    "data-flash-frame": state.frame,
    "data-flash-frame-domain": state.frameDomain,
    "data-flash-root-frame": state.rootFrame,
    "data-original-runtime-baseline-complete": "false",
    "data-original-runtime-validated": "false",
    "data-fidelity-accepted": "false",
    "data-audio-acceptance": "not-established",
    "data-network-calls": state.networkCalls,
    "data-legacy-network-policy": state.legacyNetworkPolicy,
    "data-visual-localization-status": state.visualLocalizationStatus,
  } as const;
}

export function CourseG04L09Gs002Renderer(props: AnimationRendererProps) {
  const deterministic =
    props.state && typeof props.state === "object" && "phase" in props.state
      ? (props.state as CourseG04L09Gs002FrameState)
      : getCourseG04L09Gs002FrameState(props.frame, {
          frame: props.frame,
          frameDomain: props.frameDomain,
          scenario: props.scenario,
          lang: props.lang,
          seed: props.seed,
          replay: props.replay,
        });
  const [game, setGame] = useState(() => initialGame(props.replay ?? 0));
  const [canvasStatus, setCanvasStatus] = useState("idle");
  const [hostDecision, setHostDecision] = useState("none");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const questionOrder = useMemo(
    () => buildCourseG04L09Gs002QuestionOrder(props.seed + game.replay),
    [props.seed, game.replay],
  );

  useEffect(() => {
    setGame(initialGame(props.replay ?? 0));
  }, [props.replay, props.seed]);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (
      !canvas ||
      deterministic.status !== "ready" ||
      deterministic.frame > 641
    )
      return;
    let active = true;
    setCanvasStatus("loading");
    loadCanvasAsset()
      .then(async (asset) => {
        await asset.ready();
        if (!active) return;
        asset.render(canvas, {
          frame: deterministic.frame,
          scenario: "source-drawing-lead-in",
          lang: "en",
          seed: props.seed,
        });
        setCanvasStatus("ready");
      })
      .catch(() => {
        if (active) setCanvasStatus("error");
      });
    return () => {
      active = false;
    };
  }, [deterministic.frame, deterministic.status, props.seed]);

  const choose = (option: number) => {
    const expected = (questionOrder[game.questionIndex]! + props.seed) % 3;
    const correct = option === expected;
    const decision = send(props.onLessonHostRequest, {
      type: "record-practice-feedback",
      interactionId: `gs002-q${game.questionIndex + 1}`,
      outcome: correct ? "correct" : "incorrect",
      branchIndex: game.questionIndex,
      branchCount: 10,
    });
    setHostDecision(decision?.status ?? "unhandled");
    setGame((value) =>
      Object.freeze({
        ...value,
        score: value.score + (correct ? 1 : 0),
        feedback: correct ? "correct" : "incorrect",
      }),
    );
  };
  const next = () => {
    send(props.onLessonHostRequest, {
      type: "reset-practice-feedback",
      interactionId: `gs002-q${game.questionIndex + 1}`,
    });
    setGame((value) => {
      const final = value.questionIndex >= 9;
      return Object.freeze({
        ...value,
        questionIndex: final ? value.questionIndex : value.questionIndex + 1,
        feedback: "idle",
        final,
      });
    });
  };
  const replay = () => {
    setGame((value) => initialGame(value.replay + 1));
    props.onReplay?.();
  };
  const hostIntent = (request: LessonHostRequest, trigger?: HTMLElement) => {
    const decision = send(props.onLessonHostRequest, request, trigger);
    setHostDecision(decision?.status ?? "unhandled");
  };
  const blockLegacy = () => {
    const decision = send(props.onLessonHostRequest, {
      type: "legacy",
      operation: "report",
    });
    // Reporting remains blocked locally when the modern runtime filters a
    // legacy intent before it reaches the typed host adapter.
    setHostDecision(decision?.status ?? "blocked");
    setGame((value) =>
      Object.freeze({
        ...value,
        blockedLegacyIntents: value.blockedLegacyIntents + 1,
        networkCalls: 0,
      }),
    );
  };

  if (deterministic.status === "blocked") {
    return (
      <section
        {...buildCourseG04L09Gs002CaptureAttributes({
          state: deterministic,
          canvasStatus,
        })}
        data-fail-closed-reason={deterministic.blocker ?? undefined}
      >
        <h2>
          {props.uiLanguage === "es"
            ? "El modelo visual y de audio en español no está establecido"
            : "Unsupported GS002 runtime request"}
        </h2>
        <p>
          Engineering behavior remains available only under its exact
          fixed-English private scenario.
        </p>
      </section>
    );
  }

  return (
    <section
      {...buildCourseG04L09Gs002CaptureAttributes({
        state: deterministic,
        canvasStatus,
      })}
      className="gs002-advanced"
      data-blocked-legacy-intents={game.blockedLegacyIntents}
      data-host-decision={hostDecision}
      data-private-current-js="true"
      data-question-index={game.questionIndex + 1}
      data-score={game.score}
    >
      <div className="gs002-advanced__stage">
        <canvas
          aria-label="GS002 source drawing lead-in"
          height={600}
          ref={canvasRef}
          width={800}
        />
        <div className="gs002-advanced__game">
          <p>Game 1 · Q{game.questionIndex + 1} / Q10</p>
          {game.final ? (
            <>
              <h2 data-final="true">Final · {game.score}/10</h2>
              <button onClick={replay} type="button">
                Repeat
              </button>
            </>
          ) : game.feedback === "idle" ? (
            <>
              <h2>Seeded question {questionOrder[game.questionIndex]}</h2>
              <div>
                {[0, 1, 2].map((option) => (
                  <button
                    key={option}
                    onClick={() => choose(option)}
                    type="button"
                  >
                    Option {String.fromCharCode(65 + option)}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <p aria-live="polite" data-feedback={game.feedback}>
                {game.feedback === "correct"
                  ? "Correct."
                  : "That answer is not correct."}
              </p>
              <button onClick={next} type="button">
                Next
              </button>
            </>
          )}
        </div>
      </div>
      <nav aria-label="GS002 product controls">
        <button
          onClick={(event) =>
            hostIntent(
              { type: "open-glossary", entryId: "equation" },
              event.currentTarget,
            )
          }
          type="button"
        >
          Glossary
        </button>
        <button
          onClick={() =>
            hostIntent({ type: "navigate", targetAnimationId: ANIMATION_ID })
          }
          type="button"
        >
          Course
        </button>
        <button onClick={replay} type="button">
          Replay
        </button>
        <button onClick={blockLegacy} type="button">
          Blocked report
        </button>
      </nav>
      <style>{`
      .gs002-advanced{display:grid;gap:.65rem;color:#17324d;font:600 14px/1.35 system-ui,sans-serif}
      .gs002-advanced__stage{aspect-ratio:4/3;position:relative;overflow:hidden;border-radius:18px;background:#eaf7ff}
      .gs002-advanced canvas{display:block;width:100%;height:100%}
      .gs002-advanced__game{position:absolute;inset:auto 7% 7%;padding:1rem;border:2px solid #174f78;border-radius:16px;background:rgba(255,255,255,.95)}
      .gs002-advanced nav,.gs002-advanced__game div{display:flex;flex-wrap:wrap;gap:.55rem}
      .gs002-advanced button{min-height:44px;padding:.55rem .9rem;border:0;border-radius:999px;background:#0b6da8;color:white;font:inherit}
    `}</style>
    </section>
  );
}

const animationModule: AnimationModule<CourseG04L09Gs002FrameState> =
  Object.freeze({
    key: ANIMATION_ID,
    movie: COURSE_G04_L09_GS_002_MOVIE,
    runtime: COURSE_G04_L09_GS_002_RUNTIME,
    playbackMode: "once",
    playbackEndFrame: 653,
    playbackEndFrameByDomain: Object.freeze({ root: 10, "sprite-787": 653 }),
    reducedMotionFrame: 642,
    scenarios: Object.freeze(
      COURSE_G04_L09_GS_002_SCENARIOS.map((id) =>
        Object.freeze({
          id,
          label:
            id === "gs002-advanced-product"
              ? "GS002 advanced deterministic engineering product behavior"
              : id,
          description:
            "Original-runtime, Spanish, fidelity, audio, and acceptance gates remain unestablished.",
        }),
      ),
    ),
    defaultScenarioByFrameDomain: Object.freeze({
      root: "root-standalone",
      "sprite-787": "gs002-advanced-product",
    }),
    audioCues: Object.freeze([]),
    lessonHost: Object.freeze({
      capabilities: Object.freeze([
        "navigation",
        "glossary",
        "practice-feedback",
        "fq-scoring",
      ] as const),
      legacyOperations: "blocked",
      auditStorage: "memory-only",
      storesPersonalData: false,
    }),
    maturity: "private-current-js",
    Renderer: CourseG04L09Gs002Renderer,
    getFrameState: getCourseG04L09Gs002FrameState,
  });

export default animationModule;
