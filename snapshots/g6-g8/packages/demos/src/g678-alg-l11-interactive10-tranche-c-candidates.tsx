"use client";

import type {ComponentType} from "react";

import type {
  AnimationModule,
  AnimationRendererProps,
  AnimationRuntimeMetadata,
  MovieMetadata,
  RuntimeContext,
  RuntimeScenario,
} from "./contract";
import {
  G678_ALG_L11_INTERACTIVE10_TRANCHE_C_PAGES,
  G678_ALG_L11_INTERACTIVE10_TRANCHE_C_SPEC,
  type AlgL11Interactive10Page,
} from "./g678-alg-l11-interactive10-tranche-c-core";
import {
  createAlgL11Interactive10ChoiceRenderer,
  createAlgL11Interactive10RandomRenderer,
  createAlgL11Interactive10TwoTryRenderer,
} from "./g678-alg-l11-interactive10-tranche-c-wrappers";

const SCENARIO = "interactive10-tranche-c-unregistered-engineering-candidate";
const SCENARIOS: readonly RuntimeScenario[] = Object.freeze([Object.freeze({
  id: SCENARIO,
  label: "ALG L11 interactive10 unregistered candidate",
  description: "Maintained source-bound DOM interaction; all product and acceptance gates remain false.",
})]);
const MOVIE: MovieMetadata = Object.freeze({stage: Object.freeze({width: 800,
  height: 600}), fps: 12, frameCount: 10, durationMs: 833});

function runtime(config: AlgL11Interactive10Page): AnimationRuntimeMetadata {
  const domain = `sprite-${config.mainTimeline.objectId}`;
  return Object.freeze({...MOVIE, frameDomains: Object.freeze([
    Object.freeze({id: "root", frameCount: 10, fps: 12}),
    Object.freeze({id: domain, frameCount: config.mainTimeline.frameCount,
      fps: 12, rootFrame: 6}),
  ]), defaultFrameDomain: domain});
}

function renderer(config: AlgL11Interactive10Page) {
  if (config.sourceContract.kind === "random-audio-label-timeline") {
    return createAlgL11Interactive10RandomRenderer(config);
  }
  if (config.sourceContract.kind === "choice-feedback-practice") {
    return createAlgL11Interactive10ChoiceRenderer(config);
  }
  return createAlgL11Interactive10TwoTryRenderer(config);
}

function createCandidate(config: AlgL11Interactive10Page) {
  const Renderer = renderer(config);
  const sourceRuntime = runtime(config);
  const frameDomain = `sprite-${config.mainTimeline.objectId}`;
  const module = Object.freeze({key: config.animationId, movie: MOVIE,
    runtime: sourceRuntime, playbackMode: "once" as const,
    playbackEndFrameByDomain: Object.freeze({root: 6,
      [frameDomain]: config.mainTimeline.frameCount}),
    reducedMotionFrame: 1, scenarios: SCENARIOS,
    defaultScenarioByFrameDomain: Object.freeze({[frameDomain]: SCENARIO}),
    audioCues: Object.freeze([]),
    lessonHost: Object.freeze({capabilities: Object.freeze(
      config.sourceContract.kind === "choice-feedback-practice"
        ? ["practice-feedback" as const] : []),
    legacyOperations: "blocked" as const, auditStorage: "memory-only" as const,
    storesPersonalData: false as const}),
    maturity: "private-current-js" as const, Renderer,
    getFrameState: (_frame: number, context: RuntimeContext) => {
      const requestedDomain = context.frameDomain ?? frameDomain;
      const ready = requestedDomain === frameDomain &&
        context.scenario === SCENARIO && context.frame >= 1 &&
        context.frame <= config.mainTimeline.frameCount;
      return Object.freeze({animationId: config.animationId,
        frame: context.frame, frameDomain: requestedDomain,
        rootFrame: context.rootFrame ?? 6, scenario: context.scenario,
        language: context.lang, seed: context.seed,
        status: ready ? "ready" as const : "blocked" as const,
        currentJavaScriptImplemented: true as const,
        currentJavaScriptRegistered: false as const,
        productCalibrationPassed: false as const,
        browserProductCalibrationPassed: false as const,
        authoritativeOriginalRuntime: false as const,
        visualFidelityAccepted: false as const, audioAccepted: false as const,
        strictAcceptanceEffect: "none" as const});
    },
  } satisfies AnimationModule);
  return Object.freeze({config, module, Renderer:
    Renderer as ComponentType<AnimationRendererProps>});
}

const candidates = G678_ALG_L11_INTERACTIVE10_TRANCHE_C_PAGES.map(
  createCandidate);

function candidate(animationId: string) {
  const value = candidates.find((entry) => entry.config.animationId ===
    animationId);
  if (!value) throw new Error(`${animationId}: interactive10 candidate missing`);
  return value;
}

export const G678_ALG_L11_INTERACTIVE10_TRANCHE_C_P006_CANDIDATE =
  candidate("shared-alg001-l11-p006");
export const G678_ALG_L11_INTERACTIVE10_TRANCHE_C_P008_CANDIDATE =
  candidate("shared-alg001-l11-p008");
export const G678_ALG_L11_INTERACTIVE10_TRANCHE_C_P009_CANDIDATE =
  candidate("shared-alg001-l11-p009");
export const G678_ALG_L11_INTERACTIVE10_TRANCHE_C_P010_CANDIDATE =
  candidate("shared-alg001-l11-p010");
export const G678_ALG_L11_INTERACTIVE10_TRANCHE_C_P011_CANDIDATE =
  candidate("shared-alg001-l11-p011");
export const G678_ALG_L11_INTERACTIVE10_TRANCHE_C_P014_CANDIDATE =
  candidate("shared-alg001-l11-p014");
export const G678_ALG_L11_INTERACTIVE10_TRANCHE_C_P019_CANDIDATE =
  candidate("shared-alg001-l11-p019");
export const G678_ALG_L11_INTERACTIVE10_TRANCHE_C_P020_CANDIDATE =
  candidate("shared-alg001-l11-p020");
export const G678_ALG_L11_INTERACTIVE10_TRANCHE_C_P021_CANDIDATE =
  candidate("shared-alg001-l11-p021");
export const G678_ALG_L11_INTERACTIVE10_TRANCHE_C_P025_CANDIDATE =
  candidate("shared-alg001-l11-p025");

export const G678_ALG_L11_INTERACTIVE10_TRANCHE_C_CANDIDATES =
  Object.freeze(candidates);
export const G678_ALG_L11_INTERACTIVE10_TRANCHE_C_CANDIDATE_MODULES =
  Object.freeze(candidates.map((entry) => entry.module));

if (G678_ALG_L11_INTERACTIVE10_TRANCHE_C_SPEC
  .registrationCandidatePlacementCount !== 0 ||
  G678_ALG_L11_INTERACTIVE10_TRANCHE_C_SPEC
    .currentJavaScriptRegisteredPlacementCount !== 0 ||
  G678_ALG_L11_INTERACTIVE10_TRANCHE_C_CANDIDATE_MODULES.some((module) =>
    module.maturity !== "private-current-js")) {
  throw new Error("interactive10 tranche-c candidates may not self-register");
}
