import type {
  AnimationLanguage,
  AnimationRuntimeMetadata,
  MovieMetadata,
  RuntimeContext,
} from "../contract";
import type {CourseG04L03SourceGlossaryConfig} from "./course-g04-l03-source-glossary-interaction";

export const COURSE_G04_L03_RW_003_SOURCE = Object.freeze({
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/RW/L3RW03.swf",
  swfSha256:
    "783b74b036a7af4031f17ce9e1aab7536665c84a73400b3a980cfa3e89a9a335",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/RW/L3RW03.fla",
  flaSha256:
    "16fb7b49f0d11ee93d58f46c97c80901d9356a76454daccd09c4401c59bfd5c5",
  spriteObjectId: 49,
  companionSpriteObjectId: 53,
  rootBeginFrame: 6,
  rootPlacementPixels: Object.freeze({x: 360.95, y: 273}),
});

/** Acceptance-neutral source-static drawing contract; no source behavior runs. */
export const COURSE_G04_L03_RW_003_SOURCE_CONTRACT = Object.freeze({
  status: "source-static-current-javascript-engineering-candidate-only",
  visualLanguages: Object.freeze(["en"] as const),
  spanishVisualStatus: "unvalidated-disabled",
  embeddedAudioStatus:
    "source-exact-host-cue-frame-8-listening-and-runtime-sync-pending",
  associatedSpanishAudioStatus:
    "source-exact-user-control-listening-and-cue-pending",
  rootRuntimeStatus: "authoritative-baseline-unavailable-disabled",
  companionSpriteStatus: "inventoried-unrendered",
  buttonBehaviorStatus: "source-bound-host-callback-unresolved-disabled",
  replayStatus: "complete-source-reset-unvalidated",
  fullFrameRmseStatus: "not-performed",
  humanVisualReviewAccepted: false,
  ownerAccepted: false,
  strictAcceptanceEffect: "none",
});

/** Legacy/default-domain metadata retained for direct prototype callers. */
export const COURSE_G04_L03_RW_003_MOVIE: MovieMetadata = Object.freeze({
  stage: Object.freeze({width: 800, height: 600}),
  fps: 12,
  frameCount: 278,
  durationMs: (278 * 1_000) / 12,
});

/** `frameCount` remains the SWF root; each nested sprite is a separate domain. */
export const COURSE_G04_L03_RW_003_RUNTIME: AnimationRuntimeMetadata =
  Object.freeze({
    stage: COURSE_G04_L03_RW_003_MOVIE.stage,
    fps: 12,
    frameCount: 10,
    durationMs: (10 * 1_000) / 12,
    defaultFrameDomain: "sprite-49",
    frameDomains: Object.freeze([
      Object.freeze({id: "sprite-49", frameCount: 278, fps: 12, rootFrame: 6}),
      Object.freeze({id: "sprite-53", frameCount: 1, fps: 12, rootFrame: 6}),
    ]),
  });

export const COURSE_G04_L03_RW_003_SCENARIOS = Object.freeze([
  "source-static-frame",
  "root-unavailable",
  "source-companion-unavailable",
] as const);

export const COURSE_G04_L03_RW_003_GLOSSARY_HOTSPOTS = Object.freeze([
  Object.freeze({
    id: "positive",
    keyAttribute: "Positive",
    characterId: 33,
    firstFrame: 120,
    lastFrame: 278,
    depth: 27,
    sourceBounds: Object.freeze({
      left: 199.95,
      right: 274.0833389282227,
      top: 100,
      bottom: 121.49234771728516,
    }),
    entryIds: Object.freeze({
      en: "en-0496-498b59d01013",
      es: "es-0516-f7f20d429054",
    }),
    labels: Object.freeze({en: "Positive", es: "Positivo"}),
  }),
  Object.freeze({
    id: "negative",
    keyAttribute: "Negative",
    characterId: 46,
    firstFrame: 159,
    lastFrame: 278,
    depth: 31,
    sourceBounds: Object.freeze({
      left: 206.35,
      right: 285.4177108764648,
      top: 369.3,
      bottom: 390.79234771728516,
    }),
    entryIds: Object.freeze({
      en: "en-0408-196ea5a45df3",
      es: "es-0439-b0dd8041f713",
    }),
    labels: Object.freeze({en: "Negative", es: "Negativo"}),
  }),
] as const);

export const COURSE_G04_L03_RW_003_GLOSSARY_CONFIG = Object.freeze({
  animationId: "course-g04-l03-rw-003",
  frameDomain: "sprite-49",
  terms: COURSE_G04_L03_RW_003_GLOSSARY_HOTSPOTS,
  playbackDisposition:
    "source-stop-timeline-and-audio-until-explicit-resume",
  sourceAction: "DoHyperLinks",
  sourceStopTarget: "_root.animation_mc.animation.stop()",
  glossaryAuthority: "grade-wide-shell-keyterms-static-candidate",
  glossarySourceDisposition: "unresolved-lesson-vs-grade-wide",
} satisfies CourseG04L03SourceGlossaryConfig);

export type CourseG04L03Rw003Scenario =
  (typeof COURSE_G04_L03_RW_003_SCENARIOS)[number];
export type CourseG04L03Rw003FrameDomain = "root" | "sprite-49" | "sprite-53";
export type CourseG04L03Rw003Blocker =
  | "root-baseline-unavailable"
  | "companion-domain-unrendered"
  | "spanish-visual-and-audio-unvalidated"
  | "frame-domain-scenario-mismatch"
  | "unsupported-runtime-request";
export type CourseG04L03Rw003SourceButton = "positive" | "negative";

export interface CourseG04L03Rw003FrameState {
  readonly frame: number;
  readonly exportFrame: number | null;
  readonly frameDomain: CourseG04L03Rw003FrameDomain;
  readonly rootFrame: number;
  readonly rootState:
    | "authoritative-root-runtime-unavailable"
    | "stopped-at-begin-while-child-static-frame-is-inspected";
  readonly scenario: CourseG04L03Rw003Scenario;
  readonly language: AnimationLanguage;
  readonly seed: number;
  readonly status: "ready" | "blocked";
  readonly blocker: CourseG04L03Rw003Blocker | null;
  readonly sourceStaticVisualReady: boolean;
  readonly visibleSourceButtonVisuals: readonly CourseG04L03Rw003SourceButton[];
  readonly interactiveControlsEnabled: false;
  readonly sourceHostBehaviorResolved: false;
  readonly naturalRuntimeEstablished: false;
  readonly audioRendered: false;
  readonly sourceSwfSha256: typeof COURSE_G04_L03_RW_003_SOURCE.swfSha256;
}

export function normalizeCourseG04L03Rw003Frame(
  frame: number,
  frameDomain: CourseG04L03Rw003FrameDomain = "sprite-49",
): number {
  if (!Number.isFinite(frame)) return 1;
  const frameCount =
    frameDomain === "root" ? 10 : frameDomain === "sprite-49" ? 278 : 1;
  return Math.min(frameCount, Math.max(1, Math.floor(frame)));
}

function resolveFrameDomain(value: string | undefined): {
  frameDomain: CourseG04L03Rw003FrameDomain;
  supported: boolean;
} {
  if (value === undefined || value === "sprite-49") {
    return {frameDomain: "sprite-49", supported: true};
  }
  if (value === "root" || value === "sprite-53") {
    return {frameDomain: value, supported: true};
  }
  return {frameDomain: "sprite-49", supported: false};
}

function resolveScenario(value: string): {
  scenario: CourseG04L03Rw003Scenario;
  supported: boolean;
} {
  if (
    COURSE_G04_L03_RW_003_SCENARIOS.includes(
      value as CourseG04L03Rw003Scenario,
    )
  ) {
    return {scenario: value as CourseG04L03Rw003Scenario, supported: true};
  }
  return {scenario: "source-static-frame", supported: false};
}

function visibleSourceButtonVisuals(
  frame: number,
  frameDomain: CourseG04L03Rw003FrameDomain,
): readonly CourseG04L03Rw003SourceButton[] {
  if (frameDomain !== "sprite-49" || frame < 120) return Object.freeze([]);
  if (frame < 159) return Object.freeze(["positive"] as const);
  return Object.freeze(["positive", "negative"] as const);
}

export function getCourseG04L03Rw003FrameState(
  frame: number,
  context: Pick<RuntimeContext, "frameDomain" | "scenario" | "lang" | "seed">,
): CourseG04L03Rw003FrameState {
  const domainResolution = resolveFrameDomain(context.frameDomain);
  const scenarioResolution = resolveScenario(context.scenario);
  const {frameDomain} = domainResolution;
  const {scenario} = scenarioResolution;
  const normalizedFrame = normalizeCourseG04L03Rw003Frame(frame, frameDomain);
  const language = context.lang === "es" ? "es" : "en";
  const seed = Number.isSafeInteger(context.seed) ? context.seed >>> 0 : 0;
  const scenarioMatchesDomain =
    (frameDomain === "root" && scenario === "root-unavailable") ||
    (frameDomain === "sprite-49" && scenario === "source-static-frame") ||
    (frameDomain === "sprite-53" &&
      scenario === "source-companion-unavailable");
  const blocker: CourseG04L03Rw003Blocker | null =
    !domainResolution.supported || !scenarioResolution.supported
      ? "unsupported-runtime-request"
      : !scenarioMatchesDomain
        ? "frame-domain-scenario-mismatch"
        : language === "es"
          ? "spanish-visual-and-audio-unvalidated"
          : frameDomain === "root"
            ? "root-baseline-unavailable"
            : frameDomain === "sprite-53"
              ? "companion-domain-unrendered"
              : null;

  return Object.freeze({
    frame: normalizedFrame,
    exportFrame: frameDomain === "sprite-49" ? normalizedFrame - 1 : null,
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
    visibleSourceButtonVisuals: visibleSourceButtonVisuals(
      normalizedFrame,
      frameDomain,
    ),
    interactiveControlsEnabled: false,
    sourceHostBehaviorResolved: false,
    naturalRuntimeEstablished: false,
    audioRendered: false,
    sourceSwfSha256: COURSE_G04_L03_RW_003_SOURCE.swfSha256,
  });
}
