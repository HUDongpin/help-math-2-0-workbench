import type {
  AnimationLanguage,
  AnimationRuntimeMetadata,
  MovieMetadata,
  RuntimeContext,
} from "../contract";

export const COURSE_G04_L03_IN_003_SOURCE = Object.freeze({
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/IN/L3IN03.swf",
  swfSha256:
    "ae967172d85728e42e4338f5ed74710b9b10eeb447fa6c6d86668bd63cc0dc7f",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/IN/L3IN03.fla",
  flaSha256:
    "c960c1bef6638b6fa71c9e8016c7cd7f9d99594d99aae1f4af0724c2eb0d63f0",
  spriteObjectId: 84,
  rootBeginFrame: 6,
  rootPlacementPixels: Object.freeze({x: 413.4, y: 283.3}),
});

/**
 * This is an acceptance-neutral source-static drawing contract. The exact
 * embedded and associated MP3 bytes are host-wired as engineering candidates,
 * but neither audio path is accepted.
 */
export const COURSE_G04_L03_IN_003_SOURCE_CONTRACT = Object.freeze({
  status: "source-static-current-javascript-engineering-candidate-only",
  visualLanguages: Object.freeze(["en"] as const),
  spanishVisualStatus: "unvalidated-disabled",
  embeddedAudioStatus:
    "source-exact-host-cue-frame-5-listening-and-runtime-sync-pending",
  associatedSpanishAudioStatus:
    "source-exact-user-control-listening-and-cue-pending",
  rootRuntimeStatus: "authoritative-baseline-unavailable-disabled",
  replayStatus: "complete-source-reset-unvalidated",
  fullFrameRmseStatus: "not-performed",
  humanVisualReviewAccepted: false,
  ownerAccepted: false,
  strictAcceptanceEffect: "none",
});

/** Legacy/default-domain metadata retained for direct prototype callers. */
export const COURSE_G04_L03_IN_003_MOVIE: MovieMetadata = Object.freeze({
  stage: Object.freeze({width: 800, height: 600}),
  fps: 12,
  frameCount: 472,
  durationMs: (472 * 1_000) / 12,
});

/** `frameCount` remains the source root; sprite-84 is a separate domain. */
export const COURSE_G04_L03_IN_003_RUNTIME: AnimationRuntimeMetadata =
  Object.freeze({
    stage: COURSE_G04_L03_IN_003_MOVIE.stage,
    fps: 12,
    frameCount: 10,
    durationMs: (10 * 1_000) / 12,
    defaultFrameDomain: "sprite-84",
    frameDomains: Object.freeze([
      Object.freeze({id: "sprite-84", frameCount: 472, fps: 12, rootFrame: 6}),
    ]),
  });

export const COURSE_G04_L03_IN_003_SCENARIOS = Object.freeze([
  "source-static-frame",
  "root-unavailable",
] as const);

export type CourseG04L03In003Scenario =
  (typeof COURSE_G04_L03_IN_003_SCENARIOS)[number];
export type CourseG04L03In003FrameDomain = "root" | "sprite-84";
export type CourseG04L03In003Blocker =
  | "root-baseline-unavailable"
  | "spanish-visual-and-audio-unvalidated"
  | "frame-domain-scenario-mismatch"
  | "unsupported-runtime-request";

export interface CourseG04L03In003FrameState {
  readonly frame: number;
  readonly exportFrame: number | null;
  readonly frameDomain: CourseG04L03In003FrameDomain;
  readonly rootFrame: number;
  readonly rootState:
    | "authoritative-root-runtime-unavailable"
    | "stopped-at-begin-while-child-static-frame-is-inspected";
  readonly scenario: CourseG04L03In003Scenario;
  readonly language: AnimationLanguage;
  readonly seed: number;
  readonly status: "ready" | "blocked";
  readonly blocker: CourseG04L03In003Blocker | null;
  readonly sourceStaticVisualReady: boolean;
  readonly naturalRuntimeEstablished: false;
  readonly audioRendered: false;
  readonly sourceSwfSha256: typeof COURSE_G04_L03_IN_003_SOURCE.swfSha256;
}

export function normalizeCourseG04L03In003Frame(
  frame: number,
  frameDomain: CourseG04L03In003FrameDomain = "sprite-84",
): number {
  if (!Number.isFinite(frame)) return 1;
  const frameCount = frameDomain === "root" ? 10 : 472;
  return Math.min(frameCount, Math.max(1, Math.floor(frame)));
}

function resolveFrameDomain(value: string | undefined): {
  frameDomain: CourseG04L03In003FrameDomain;
  supported: boolean;
} {
  if (value === undefined || value === "sprite-84") {
    return {frameDomain: "sprite-84", supported: true};
  }
  if (value === "root") return {frameDomain: "root", supported: true};
  return {frameDomain: "sprite-84", supported: false};
}

function resolveScenario(value: string): {
  scenario: CourseG04L03In003Scenario;
  supported: boolean;
} {
  if (
    COURSE_G04_L03_IN_003_SCENARIOS.includes(
      value as CourseG04L03In003Scenario,
    )
  ) {
    return {scenario: value as CourseG04L03In003Scenario, supported: true};
  }
  return {scenario: "source-static-frame", supported: false};
}

export function getCourseG04L03In003FrameState(
  frame: number,
  context: Pick<RuntimeContext, "frameDomain" | "scenario" | "lang" | "seed">,
): CourseG04L03In003FrameState {
  const domainResolution = resolveFrameDomain(context.frameDomain);
  const scenarioResolution = resolveScenario(context.scenario);
  const {frameDomain} = domainResolution;
  const {scenario} = scenarioResolution;
  const normalizedFrame = normalizeCourseG04L03In003Frame(frame, frameDomain);
  const language = context.lang === "es" ? "es" : "en";
  const seed = Number.isSafeInteger(context.seed) ? context.seed >>> 0 : 0;
  const scenarioMatchesDomain =
    (frameDomain === "root" && scenario === "root-unavailable") ||
    (frameDomain === "sprite-84" && scenario === "source-static-frame");
  const blocker: CourseG04L03In003Blocker | null =
    !domainResolution.supported || !scenarioResolution.supported
      ? "unsupported-runtime-request"
      : !scenarioMatchesDomain
        ? "frame-domain-scenario-mismatch"
        : language === "es"
          ? "spanish-visual-and-audio-unvalidated"
          : frameDomain === "root"
            ? "root-baseline-unavailable"
            : null;

  return Object.freeze({
    frame: normalizedFrame,
    exportFrame: frameDomain === "sprite-84" ? normalizedFrame - 1 : null,
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
    naturalRuntimeEstablished: false,
    audioRendered: false,
    sourceSwfSha256: COURSE_G04_L03_IN_003_SOURCE.swfSha256,
  });
}
