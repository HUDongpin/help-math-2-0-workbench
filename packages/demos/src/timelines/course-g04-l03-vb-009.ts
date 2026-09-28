import type {CourseG04L03SourceGlossaryConfig} from "./course-g04-l03-source-glossary-interaction";
import type {
  AnimationLanguage,
  AnimationRuntimeMetadata,
  MovieMetadata,
  RuntimeContext,
} from "../contract";
import type {
  SourceStaticCanvasBlocker,
  SourceStaticCanvasCandidateConfig,
  SourceStaticCanvasFrameState,
} from "../source-static-canvas-candidate";

export const COURSE_G04_L03_VB_009_SOURCE = Object.freeze({
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/VB/L3VB09.swf",
  swfSha256:
    "5a6532c1635ecbf29cf1b4bda6727ce3bc858b1a5771223fd629ee3a65df96f8",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/VB/L3VB09.fla",
  flaSha256:
    "fc6a5819a64d1051bf9d8c8f750bca45d237526a72ae3891eca21c77ba766c08",
  associatedAudio:
    "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/SA/L3VB09.mp3",
  associatedAudioSha256:
    "e2896cb3b7b1816b1f48f5df451d3663736344b052ca8d096db96e2c692cb094",
  spriteObjectId: 24,
  companionSpriteObjectId: 5,
  rootBeginFrame: 6,
  rootPlacementPixels: Object.freeze({x: 401.3, y: 244.25}),
});

/** Acceptance-neutral source-static contract. No legacy behavior is executed. */
export const COURSE_G04_L03_VB_009_SOURCE_CONTRACT = Object.freeze({
  status: "source-static-current-javascript-engineering-candidate-only",
  visualLanguages: Object.freeze(["en"] as const),
  spanishVisualStatus: "unvalidated-disabled",
  embeddedAudioStatus: "inventoried-unmapped-disabled",
  associatedAudioStatus: "hash-bound-language-cue-listening-unvalidated-disabled",
  rootRuntimeStatus: "authoritative-baseline-unavailable-disabled",
  companionSpriteStatus: "inventoried-unrendered",
  buttonBehaviorStatus: "four-source-host-callbacks-unresolved-disabled",
  replayStatus: "complete-source-reset-unvalidated",
  fullFrameRmseStatus: "not-performed",
  humanVisualReviewAccepted: false,
  ownerAccepted: false,
  strictAcceptanceEffect: "none",
});

// Source-locked glossary placements; geometry remains audit metadata.
export const COURSE_G04_L03_VB_009_GLOSSARY_HOTSPOTS = Object.freeze([
  Object.freeze({
    id: "pattern",
    characterId: 11,
    keyAttribute: "Pattern",
    firstFrame: 1,
    lastFrame: 175,
    depth: 5,
    sourceBounds: Object.freeze({left: 94.40733032226562, right: 167.03249969482422, top: 120.41440429687499, bottom: 142.92681655883788}),
    entryIds: Object.freeze({en: "en-0459-b510b9647e1c", es: "es-0481-73e819571a77"}),
    labels: Object.freeze({en: "Pattern", es: "Patrón"}),
  }),
  Object.freeze({
    id: "symbol",
    characterId: 12,
    keyAttribute: "Symbol",
    firstFrame: 1,
    lastFrame: 175,
    depth: 7,
    sourceBounds: Object.freeze({left: 429.34779052734376, right: 510.9845733642578, top: 120.41440429687499, bottom: 142.92681655883788}),
    entryIds: Object.freeze({en: "en-0677-bff39ce92c9e", es: "es-0655-871afa316e73"}),
    labels: Object.freeze({en: "Symbol", es: "Símbolo"}),
  }),
  Object.freeze({
    id: "set",
    characterId: 13,
    keyAttribute: "Set",
    firstFrame: 1,
    lastFrame: 175,
    depth: 9,
    sourceBounds: Object.freeze({left: 206.647314453125, right: 242.02337646484375, top: 120.41440429687499, bottom: 142.92681655883788}),
    entryIds: Object.freeze({en: "en-0612-bf9e68924be1", es: "es-0083-7cd0c12afef8"}),
    labels: Object.freeze({en: "Set", es: "Conjunto"}),
  }),
  Object.freeze({
    id: "rule",
    characterId: 16,
    keyAttribute: "Rule",
    firstFrame: 73,
    lastFrame: 175,
    depth: 15,
    sourceBounds: Object.freeze({left: 291.5784515380859, right: 328.990552520752, top: 147.014404296875, bottom: 169.5268165588379}),
    entryIds: Object.freeze({en: "en-0594-2fc559859c42", es: "es-0581-1e43802cd308"}),
    labels: Object.freeze({en: "Rule", es: "Regla"}),
  }),
] as const);

export const COURSE_G04_L03_VB_009_GLOSSARY_CONFIG = Object.freeze({
  animationId: "course-g04-l03-vb-009",
  frameDomain: "sprite-24",
  terms: COURSE_G04_L03_VB_009_GLOSSARY_HOTSPOTS,
  learnerPrompt: "A pattern follows a rule.",
  playbackDisposition: "reversible-support-pause",
  sourceAction: "DoHyperLinks",
  sourceStopTarget: "_root.animation_mc.animation.stop()",
  glossaryAuthority: "grade-wide-shell-keyterms-static-candidate",
  glossarySourceDisposition: "unresolved-lesson-vs-grade-wide",
} satisfies CourseG04L03SourceGlossaryConfig);

export const COURSE_G04_L03_VB_009_CANDIDATE_CONFIG = Object.freeze({
  animationId: "course-g04-l03-vb-009",
  title: "G4 L3 Important Words, Pattern",
  sourceSwfSha256: COURSE_G04_L03_VB_009_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g04-l03-vb-009/canvas-renderer.js",
  stage: Object.freeze({
    width: 800,
    height: 600,
    backgroundColor: "#b8d8f7",
  }),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-24",
  mainFrameCount: 175,
  playbackMode: "once",
  companionDomains: Object.freeze([
    Object.freeze({id: "sprite-5", frameCount: 1, label: "Page title sprite-5"}),
  ]),
  visualMarkers: Object.freeze([
    Object.freeze({id: "pattern", firstFrame: 1, lastFrame: 175}),
    Object.freeze({id: "symbol", firstFrame: 1, lastFrame: 175}),
    Object.freeze({id: "set", firstFrame: 1, lastFrame: 175}),
    Object.freeze({id: "rule", firstFrame: 73, lastFrame: 175}),
  ]),
  sourceControlBehaviorLabel:
    "The four glossary button visuals are non-interactive; KeyAttribute, DoHyperLinks, and host stop dispatch are disabled",
}) satisfies SourceStaticCanvasCandidateConfig;

/** Compatibility metadata for the only renderer-addressable drawing domain. */
export const COURSE_G04_L03_VB_009_MOVIE: MovieMetadata = Object.freeze({
  stage: Object.freeze({width: 800, height: 600}),
  fps: 12,
  frameCount: 175,
  durationMs: (175 * 1_000) / 12,
});

/** `frameCount` remains the 10-frame SWF root; nested domains stay separate. */
export const COURSE_G04_L03_VB_009_RUNTIME: AnimationRuntimeMetadata =
  Object.freeze({
    stage: COURSE_G04_L03_VB_009_MOVIE.stage,
    fps: 12,
    frameCount: 10,
    durationMs: (10 * 1_000) / 12,
    defaultFrameDomain: "sprite-24",
    frameDomains: Object.freeze([
      Object.freeze({id: "sprite-24", frameCount: 175, fps: 12, rootFrame: 6}),
      Object.freeze({id: "sprite-5", frameCount: 1, fps: 12, rootFrame: 6}),
    ]),
  });

export const COURSE_G04_L03_VB_009_SCENARIOS = Object.freeze([
  "source-static-frame",
  "root-unavailable",
  "sprite-5-unavailable",
] as const);

export type CourseG04L03Vb009Scenario =
  (typeof COURSE_G04_L03_VB_009_SCENARIOS)[number];
export type CourseG04L03Vb009FrameDomain = "root" | "sprite-24" | "sprite-5";
export type CourseG04L03Vb009SourceMarker =
  | "pattern"
  | "symbol"
  | "set"
  | "rule";
export interface CourseG04L03Vb009FrameState
  extends SourceStaticCanvasFrameState {
  readonly animationId: "course-g04-l03-vb-009";
  readonly frameDomain: CourseG04L03Vb009FrameDomain;
  readonly scenario: CourseG04L03Vb009Scenario;
  readonly blocker: SourceStaticCanvasBlocker | null;
  readonly visibleSourceMarkers: readonly CourseG04L03Vb009SourceMarker[];
  readonly sourceSwfSha256: typeof COURSE_G04_L03_VB_009_SOURCE.swfSha256;
}

const FRAME_COUNTS = Object.freeze({
  root: 10,
  "sprite-24": 175,
  "sprite-5": 1,
});

const DEFAULT_SCENARIO_BY_DOMAIN = Object.freeze({
  root: "root-unavailable",
  "sprite-24": "source-static-frame",
  "sprite-5": "sprite-5-unavailable",
}) satisfies Readonly<Record<CourseG04L03Vb009FrameDomain, CourseG04L03Vb009Scenario>>;

export function normalizeCourseG04L03Vb009Frame(
  frame: number,
  frameDomain: CourseG04L03Vb009FrameDomain = "sprite-24",
): number {
  if (!Number.isFinite(frame)) return 1;
  return Math.min(
    FRAME_COUNTS[frameDomain],
    Math.max(1, Math.floor(frame)),
  );
}

function resolveFrameDomain(value: string | undefined): {
  frameDomain: CourseG04L03Vb009FrameDomain;
  supported: boolean;
} {
  if (value === undefined || value === "sprite-24") {
    return {frameDomain: "sprite-24", supported: true};
  }
  if (value === "root" || value === "sprite-5") {
    return {frameDomain: value, supported: true};
  }
  return {frameDomain: "sprite-24", supported: false};
}

function resolveScenario(value: string): {
  scenario: CourseG04L03Vb009Scenario;
  supported: boolean;
} {
  if (
    COURSE_G04_L03_VB_009_SCENARIOS.includes(
      value as CourseG04L03Vb009Scenario,
    )
  ) {
    return {scenario: value as CourseG04L03Vb009Scenario, supported: true};
  }
  return {scenario: "source-static-frame", supported: false};
}

function visibleSourceMarkers(
  frame: number,
  frameDomain: CourseG04L03Vb009FrameDomain,
): readonly CourseG04L03Vb009SourceMarker[] {
  if (frameDomain !== "sprite-24") return Object.freeze([]);
  const markers: CourseG04L03Vb009SourceMarker[] = ["pattern", "symbol", "set"];
  if (frame >= 73) markers.push("rule");
  return Object.freeze(markers);
}

/** Pure, deterministic and one-indexed. Unsupported evidence paths fail closed. */
export function getCourseG04L03Vb009FrameState(
  frame: number,
  context: Pick<RuntimeContext, "frameDomain" | "scenario" | "lang" | "seed">,
): CourseG04L03Vb009FrameState {
  const domainResolution = resolveFrameDomain(context.frameDomain);
  const scenarioResolution = resolveScenario(context.scenario);
  const {frameDomain} = domainResolution;
  const {scenario} = scenarioResolution;
  const normalizedFrame = normalizeCourseG04L03Vb009Frame(frame, frameDomain);
  const language: AnimationLanguage = context.lang === "es" ? "es" : "en";
  const seed = Number.isSafeInteger(context.seed) ? context.seed >>> 0 : 0;
  const blocker: SourceStaticCanvasBlocker | null =
    !domainResolution.supported || !scenarioResolution.supported
      ? "unsupported-runtime-request"
      : scenario !== DEFAULT_SCENARIO_BY_DOMAIN[frameDomain]
        ? "frame-domain-scenario-mismatch"
        : language === "es"
          ? "spanish-visual-and-audio-unvalidated"
          : frameDomain === "root"
            ? "root-baseline-unavailable"
            : frameDomain === "sprite-5"
              ? "companion-domain-unrendered"
              : null;

  return Object.freeze({
    animationId: "course-g04-l03-vb-009",
    frame: normalizedFrame,
    exportFrame: frameDomain === "sprite-24" ? normalizedFrame - 1 : null,
    frameDomain,
    rootFrame: frameDomain === "root" ? normalizedFrame : 6,
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
    visibleSourceMarkers: visibleSourceMarkers(normalizedFrame, frameDomain),
    interactiveControlsEnabled: false,
    sourceHostBehaviorResolved: false,
    naturalRuntimeEstablished: false,
    audioRendered: false,
    sourceSwfSha256: COURSE_G04_L03_VB_009_SOURCE.swfSha256,
  });
}
