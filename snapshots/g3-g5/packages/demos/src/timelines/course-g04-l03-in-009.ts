import type {
  AnimationLanguage,
  AnimationRuntimeMetadata,
  MovieMetadata,
  RuntimeContext,
} from "../contract";

export const COURSE_G04_L03_IN_009_SOURCE = Object.freeze({
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/IN/L3IN09.swf",
  swfSha256: "766b6ab686bbaf8ab1dacc30a7ffb96f33735102a1dff7df6b7a97976e3ab25c",
  spriteObjectId: 200,
  rootBeginFrame: 6,
  rootPlacementPixels: Object.freeze({ x: 413.4, y: 283.3 }),
});

/**
 * Static source contract recovered from the exhaustive child ActionScript
 * export, the hash-bound same-lesson shell export, owner XML, and owner MP3.
 * These facts intentionally do not make the currently omitted host behavior
 * renderable or advance strict acceptance.
 */
export const COURSE_G04_L03_IN_009_SOURCE_CONTRACT = Object.freeze({
  visualLocalization: Object.freeze({
    status: "source-shared-untranslated-visual",
    childActionScriptLanguageBranch: false,
    authoritativeRuntimeValidated: false,
  }),
  externalSpanishAudio: Object.freeze({
    status: "exact-owner-file-and-host-routing-proven-runtime-unvalidated",
    source:
      "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/SA/L3IN09.mp3",
    publicAsset: "/flash-assets/audio/courses/course-g04-l03-in-009/es.mp3",
    candidatePublicAsset:
      "/flash-assets/courses/course-g04-l03-in-009/audio/spanish-host-narration.mp3",
    sha256: "1d2370d59a6400dbd666a3f049fd4222a54d664e62055a1fb5f93596b9a2ea4b",
    durationMs: 40_344,
    activation: "host-user-activated",
    authoritativeListeningComplete: false,
    synchronizationComplete: false,
    implemented: true,
  }),
  embeddedAudio: Object.freeze({
    status:
      "source-exact-host-cue-frame-7-listening-and-runtime-sync-pending",
    publicAsset:
      "/flash-assets/courses/course-g04-l03-in-009/audio/embedded-stream-0001.mp3",
    sha256:
      "f8f48409ed9b3a3abf31ce5b50f4fae9911746e90401218deed93b68cdef09a5",
    durationMs: 48_672,
    originalRuntimeSynchronizationComplete: false,
    listeningAccepted: false,
  }),
  hostInteractions: Object.freeze({
    glossaryKeys: Object.freeze(["Temperature", "Measure"]),
    glossaryStatus: "source-destination-intent-proven-host-runtime-unvalidated",
    replayStatus: "source-reload-intent-proven-complete-reset-unvalidated",
    terminalStatus: "source-stop-intent-proven-runtime-ordering-unvalidated",
  }),
  strictAcceptanceEffect: "none",
});

/**
 * Legacy/default-domain metadata retained for direct prototype callers. The
 * source SWF root timeline is declared separately in RUNTIME below.
 */
export const COURSE_G04_L03_IN_009_MOVIE: MovieMetadata = Object.freeze({
  stage: Object.freeze({ width: 800, height: 600 }),
  fps: 12,
  frameCount: 637,
  durationMs: (637 * 1_000) / 12,
});

export const COURSE_G04_L03_IN_009_RUNTIME: AnimationRuntimeMetadata =
  Object.freeze({
    stage: COURSE_G04_L03_IN_009_MOVIE.stage,
    fps: 12,
    frameCount: 10,
    durationMs: (10 * 1_000) / 12,
    defaultFrameDomain: "sprite-200",
    frameDomains: Object.freeze([
      Object.freeze({
        id: "sprite-200",
        frameCount: 637,
        fps: 12,
        rootFrame: 6,
      }),
    ]),
  });

export const COURSE_G04_L03_IN_009_SCENARIOS = Object.freeze([
  "default",
  "root-standalone",
  "glossary-temperature-unavailable",
  "glossary-measure-unavailable",
] as const);

export type CourseG04L03In009Scenario =
  (typeof COURSE_G04_L03_IN_009_SCENARIOS)[number];
export type CourseG04L03In009FrameDomain = "root" | "sprite-200";
export type CourseG04L03In009Blocker =
  | "temperature-glossary-host-contract-unresolved"
  | "measure-glossary-host-contract-unresolved"
  | "frame-domain-scenario-mismatch"
  | "unsupported-runtime-request";

export interface CourseG04L03In009FrameState {
  readonly frame: number;
  readonly exportFrame: number | null;
  readonly frameDomain: CourseG04L03In009FrameDomain;
  readonly rootFrame: number;
  readonly rootState:
    "direct-frame-accurate-only" | "stopped-at-begin-while-child-plays";
  readonly scenario: CourseG04L03In009Scenario;
  readonly language: AnimationLanguage;
  readonly seed: number;
  readonly status: "ready" | "blocked";
  readonly blocker: CourseG04L03In009Blocker | null;
  readonly visualBranchIndependent: true;
  readonly audioRendered: false;
  readonly sourceSwfSha256: typeof COURSE_G04_L03_IN_009_SOURCE.swfSha256;
}

export function normalizeCourseG04L03In009Frame(
  frame: number,
  frameDomain: CourseG04L03In009FrameDomain = "sprite-200",
): number {
  if (!Number.isFinite(frame)) return 1;
  const frameCount = frameDomain === "root" ? 10 : 637;
  return Math.min(frameCount, Math.max(1, Math.floor(frame)));
}

function resolveFrameDomain(value: string | undefined): {
  frameDomain: CourseG04L03In009FrameDomain;
  supported: boolean;
} {
  if (value === undefined || value === "sprite-200") {
    return { frameDomain: "sprite-200", supported: true };
  }
  if (value === "root") return { frameDomain: "root", supported: true };
  return { frameDomain: "sprite-200", supported: false };
}

function resolveScenario(value: string): {
  scenario: CourseG04L03In009Scenario;
  supported: boolean;
} {
  if (
    COURSE_G04_L03_IN_009_SCENARIOS.includes(value as CourseG04L03In009Scenario)
  ) {
    return { scenario: value as CourseG04L03In009Scenario, supported: true };
  }
  return { scenario: "default", supported: false };
}

export function getCourseG04L03In009FrameState(
  frame: number,
  context: Pick<RuntimeContext, "frameDomain" | "scenario" | "lang" | "seed">,
): CourseG04L03In009FrameState {
  const domainResolution = resolveFrameDomain(context.frameDomain);
  const scenarioResolution = resolveScenario(context.scenario);
  const { frameDomain } = domainResolution;
  const { scenario } = scenarioResolution;
  const normalizedFrame = normalizeCourseG04L03In009Frame(frame, frameDomain);
  const language = context.lang === "es" ? "es" : "en";
  const seed = Number.isSafeInteger(context.seed) ? context.seed >>> 0 : 0;
  const scenarioMatchesDomain =
    (frameDomain === "root" && scenario === "root-standalone") ||
    (frameDomain === "sprite-200" && scenario !== "root-standalone");
  const blocker: CourseG04L03In009Blocker | null =
    !domainResolution.supported || !scenarioResolution.supported
      ? "unsupported-runtime-request"
      : !scenarioMatchesDomain
        ? "frame-domain-scenario-mismatch"
        : scenario === "glossary-temperature-unavailable"
          ? "temperature-glossary-host-contract-unresolved"
          : scenario === "glossary-measure-unavailable"
            ? "measure-glossary-host-contract-unresolved"
            : null;

  return Object.freeze({
    frame: normalizedFrame,
    exportFrame: frameDomain === "sprite-200" ? normalizedFrame - 1 : null,
    frameDomain,
    rootFrame: frameDomain === "root" ? normalizedFrame : 6,
    rootState:
      frameDomain === "root"
        ? "direct-frame-accurate-only"
        : "stopped-at-begin-while-child-plays",
    scenario,
    language,
    seed,
    status: blocker ? "blocked" : "ready",
    blocker,
    visualBranchIndependent: true,
    audioRendered: false,
    sourceSwfSha256: COURSE_G04_L03_IN_009_SOURCE.swfSha256,
  });
}
