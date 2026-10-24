import type {
  AnimationLanguage,
  AnimationRuntimeMetadata,
  MovieMetadata,
  RuntimeContext,
  RuntimeScenario,
} from "../contract";

export const COURSE_G05_L04_FQ_001_ANIMATION_ID =
  "course-g05-l04-fq-001";
export const COURSE_G05_L04_FQ_001_MAIN_FRAME_DOMAIN = "sprite-145";
export const COURSE_G05_L04_FQ_001_FIXED_COMPANION_DOMAIN = "sprite-100";
export const COURSE_G05_L04_FQ_001_SCENARIO =
  "source-static-composite-prefix";

export const COURSE_G05_L04_FQ_001_SOURCE = Object.freeze({
  swf:
    "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/FQ/L4FQ01.swf",
  swfBytes: 23_357,
  swfSha256:
    "b56e10b76b01b6626aba5d69b176d21262dfbe4db74a94b4afe2323aeb5b3e36",
  fla:
    "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/FQ/L4FQ01.fla",
  flaBytes: 806_912,
  flaSha256:
    "7d7934819db404845486d5fd0ea544bfcba21338d4e8a1de4006e395ffb99db3",
  associatedAudio: null,
});

export const COURSE_G05_L04_FQ_001_ASSET = Object.freeze({
  source:
    "/flash-assets/courses/course-g05-l04-fq-001/canvas-renderer.js",
  sha256:
    "539e66402e9d90d871a21a8e05dfe72fccaac631f484d2fc387d37df2da54d13",
});

export const COURSE_G05_L04_FQ_001_STAGE = Object.freeze({
  width: 800,
  height: 600,
  backgroundColor: "#b8d8f7",
});

export const COURSE_G05_L04_FQ_001_COMPOSITE = Object.freeze({
  rootFrame: 6,
  rootRendered: false,
  renderOrder: Object.freeze([
    "stage-background",
    COURSE_G05_L04_FQ_001_FIXED_COMPANION_DOMAIN,
    COURSE_G05_L04_FQ_001_MAIN_FRAME_DOMAIN,
  ]),
  primary: Object.freeze({
    frameDomain: COURSE_G05_L04_FQ_001_MAIN_FRAME_DOMAIN,
    frameCount: 52,
    requestedFrameRange: Object.freeze([1, 52] as const),
    placement: Object.freeze({
      depth: 10,
      name: "animation",
      objectId: 145,
      matrix: Object.freeze([1, 0, 0, 1, 412.4, 283.3] as const),
      stageAdapterMatrix: Object.freeze(
        [1, 0, 0, 1, 93.3, 88.7] as const,
      ),
      colorTransform: Object.freeze(
        [0, 0, 0, 0, 255, 255, 255, 255] as const,
      ),
    }),
  }),
  companion: Object.freeze({
    frameDomain: COURSE_G05_L04_FQ_001_FIXED_COMPANION_DOMAIN,
    frameCount: 1,
    fixedFrame: 1,
    standaloneRequestsEnabled: false,
    placement: Object.freeze({
      depth: 1,
      name: "Mc_BackText",
      objectId: 100,
      matrix: Object.freeze(
        [1, 0, 0, 0.999847412109375, 410.4, 286.3] as const,
      ),
      stageAdapterMatrix: Object.freeze(
        [
          1,
          0,
          0,
          0.999847412109375,
          41.75,
          123.82479553222657,
        ] as const,
      ),
      colorTransform: Object.freeze(
        [51, 51, 51, 0, 0, 0, 0, 23] as const,
      ),
    }),
  }),
});

export type CourseG05L04Fq001Blocker =
  | "root-domain-disabled"
  | "companion-standalone-disabled"
  | "unsupported-frame-domain"
  | "frame-domain-scenario-mismatch"
  | "spanish-disabled"
  | "frame-out-of-range";

export interface CourseG05L04Fq001FrameState {
  readonly animationId: typeof COURSE_G05_L04_FQ_001_ANIMATION_ID;
  readonly requestedFrame: number;
  readonly frame: number;
  readonly exportFrame: number | null;
  readonly frameDomain: string;
  readonly rootFrame: 6;
  readonly scenario: string;
  readonly language: AnimationLanguage;
  readonly seed: number;
  readonly requirementId: string;
  readonly traceId: string;
  readonly entryStateSha256: string;
  readonly status: "ready" | "blocked";
  readonly blocker: CourseG05L04Fq001Blocker | null;
  readonly sourceStaticCompositeReady: boolean;
  readonly primaryFrameDomain: typeof COURSE_G05_L04_FQ_001_MAIN_FRAME_DOMAIN;
  readonly fixedCompanionFrameDomain:
    typeof COURSE_G05_L04_FQ_001_FIXED_COMPANION_DOMAIN;
  readonly fixedCompanionFrame: 1;
  readonly legacyActionScriptExecuted: false;
  readonly interactiveControlsEnabled: false;
  readonly scrollEnabled: false;
  readonly quizEnabled: false;
  readonly textInputEnabled: false;
  readonly audioRendered: false;
  readonly networkEnabled: false;
  readonly naturalRuntimeEstablished: false;
  readonly sourceReplayEstablished: false;
  readonly sourceSwfSha256: string;
}

function normalizeSeed(seed: number) {
  return Number.isSafeInteger(seed) ? seed >>> 0 : 0;
}

function captureIdentity(value: string | undefined) {
  return value?.trim() ?? "";
}

export function getCourseG05L04Fq001FrameState(
  requestedFrame: number,
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
): CourseG05L04Fq001FrameState {
  const frameDomain =
    context.frameDomain ?? COURSE_G05_L04_FQ_001_MAIN_FRAME_DOMAIN;
  const language = context.lang === "es" ? "es" : "en";
  const frameValid =
    Number.isSafeInteger(requestedFrame) &&
    requestedFrame >= 1 &&
    requestedFrame <= 52;
  const frame = frameValid ? requestedFrame : 1;
  const blocker: CourseG05L04Fq001Blocker | null =
    frameDomain === "root"
      ? "root-domain-disabled"
      : frameDomain === COURSE_G05_L04_FQ_001_FIXED_COMPANION_DOMAIN
        ? "companion-standalone-disabled"
        : frameDomain !== COURSE_G05_L04_FQ_001_MAIN_FRAME_DOMAIN
          ? "unsupported-frame-domain"
          : context.scenario !== COURSE_G05_L04_FQ_001_SCENARIO
            ? "frame-domain-scenario-mismatch"
            : language === "es"
              ? "spanish-disabled"
              : !frameValid
                ? "frame-out-of-range"
                : null;
  return Object.freeze({
    animationId: COURSE_G05_L04_FQ_001_ANIMATION_ID,
    requestedFrame,
    frame,
    exportFrame: blocker === null ? frame - 1 : null,
    frameDomain,
    rootFrame: 6,
    scenario: context.scenario,
    language,
    seed: normalizeSeed(context.seed),
    requirementId: captureIdentity(context.requirementId),
    traceId: captureIdentity(context.traceId),
    entryStateSha256: captureIdentity(context.entryStateSha256),
    status: blocker === null ? "ready" : "blocked",
    blocker,
    sourceStaticCompositeReady: blocker === null,
    primaryFrameDomain: COURSE_G05_L04_FQ_001_MAIN_FRAME_DOMAIN,
    fixedCompanionFrameDomain:
      COURSE_G05_L04_FQ_001_FIXED_COMPANION_DOMAIN,
    fixedCompanionFrame: 1,
    legacyActionScriptExecuted: false,
    interactiveControlsEnabled: false,
    scrollEnabled: false,
    quizEnabled: false,
    textInputEnabled: false,
    audioRendered: false,
    networkEnabled: false,
    naturalRuntimeEstablished: false,
    sourceReplayEstablished: false,
    sourceSwfSha256: COURSE_G05_L04_FQ_001_SOURCE.swfSha256,
  });
}

export const COURSE_G05_L04_FQ_001_MOVIE: MovieMetadata = Object.freeze({
  stage: Object.freeze({
    width: COURSE_G05_L04_FQ_001_STAGE.width,
    height: COURSE_G05_L04_FQ_001_STAGE.height,
  }),
  fps: 12,
  frameCount: 52,
  durationMs: (52 * 1_000) / 12,
});

export const COURSE_G05_L04_FQ_001_RUNTIME: AnimationRuntimeMetadata =
  Object.freeze({
    stage: COURSE_G05_L04_FQ_001_MOVIE.stage,
    fps: 12,
    frameCount: 10,
    durationMs: (10 * 1_000) / 12,
    defaultFrameDomain: COURSE_G05_L04_FQ_001_MAIN_FRAME_DOMAIN,
    frameDomains: Object.freeze([
      Object.freeze({
        id: COURSE_G05_L04_FQ_001_MAIN_FRAME_DOMAIN,
        frameCount: 52,
        fps: 12,
        rootFrame: 6,
      }),
    ]),
  });

export const COURSE_G05_L04_FQ_001_SCENARIOS: readonly RuntimeScenario[] =
  Object.freeze([
    Object.freeze({
      id: COURSE_G05_L04_FQ_001_SCENARIO,
      label: "English source-static dual-sprite composite",
      description:
        "Hash-bound sprite-145 frames composed over fixed sprite-100 frame 1; no source behavior, audio, or natural-runtime claim.",
    }),
    Object.freeze({
      id: "root-unavailable",
      label: "Root timeline (blocked)",
      description:
        "The source root and InternalPreloader runtime are not executed by this candidate.",
    }),
    Object.freeze({
      id: "sprite-100-standalone-unavailable",
      label: "Background companion (standalone blocked)",
      description:
        "Sprite-100 is rendered only as the fixed source-proven companion beneath sprite-145.",
    }),
  ]);

export const COURSE_G05_L04_FQ_001_ACCEPTANCE_EFFECTS = Object.freeze({
  implementationAuthorized: false,
  authoritativeOriginalRuntime: false,
  naturalRuntimeReachabilityComplete: false,
  frameDomainDispositionComplete: false,
  bilingualVisualParityComplete: false,
  audioAccepted: false,
  replayParityComplete: false,
  fullFrameRmseComplete: false,
  behaviorComplete: false,
  productQaComplete: false,
  accessibilityQaComplete: false,
  engineeringReviewAccepted: false,
  humanVisualReviewAccepted: false,
  ownerAccepted: false,
  strictMigrationComplete: false,
  published: false,
});

export const COURSE_G05_L04_FQ_001_SOURCE_CONTRACT = Object.freeze({
  status:
    "source-static-dual-sprite-composite-current-javascript-engineering-candidate-only",
  primaryFrameDomain: COURSE_G05_L04_FQ_001_MAIN_FRAME_DOMAIN,
  primaryFrameRange: Object.freeze([1, 52] as const),
  fixedCompanionFrameDomain:
    COURSE_G05_L04_FQ_001_FIXED_COMPANION_DOMAIN,
  fixedCompanionFrame: 1,
  rootRuntimeStatus: "disabled-unrepresented",
  companionStandaloneStatus: "disabled",
  visualLanguages: Object.freeze(["en"] as const),
  spanishVisualStatus: "disabled-unvalidated",
  audioStatus: "no-exact-association-disabled",
  legacyActionScriptStatus: "not-executed",
  scrollQuizInputNetworkStatus: "disabled",
  sourceControlBehaviorStatus: "disabled",
  sourceReplayStatus: "unvalidated",
  canonicalFrameDomainDispositionStatus: "unresolved-unchanged",
  originalRuntimeBaselineStatus: "not-used",
  fullFrameRmseStatus: "not-performed",
  acceptanceEffects: COURSE_G05_L04_FQ_001_ACCEPTANCE_EFFECTS,
  strictAcceptanceEffect: "none",
});
