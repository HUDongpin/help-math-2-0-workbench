import type { SourceStaticCanvasCandidateConfig } from "../source-static-canvas-candidate";
import type { AnimationLanguage, RuntimeContext } from "../contract";

export const COURSE_G04_L03_TS_006_SOURCE = Object.freeze({
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/TS/L3TS06.swf",
  swfSha256: "fa8962a6ca72c0bb213605a9836b62600992cb5c1cf955f7c871e857e90ddf47",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/TS/L3TS06.fla",
  flaSha256: "3f500c60b73b735eb001993b31ff101bf1615384c86b6a28987a84feef5b70dd",
  associatedAudio:
    "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/SA/L3TS06.mp3",
  associatedAudioSha256:
    "c0ea9f1cede741945c763707ed89c5be76f651f761209880157bf0c45ded8688",
  embeddedAudioSha256:
    "4d50cee1ee64bec0919933132ec250212474f236c699cd007a40f9ff2dce3122",
  spriteObjectId: 23,
  companionSpriteObjectId: 3,
  rootBeginFrame: 6,
  rootPlacementTwips: Object.freeze({ x: 8_241, y: 5_668 }),
  rootPlacementPixels: Object.freeze({ x: 412.05, y: 283.4 }),
});

export const COURSE_G04_L03_TS_006_CONFIG = Object.freeze({
  animationId: "course-g04-l03-ts-006",
  title: "4 Step Plan — English source-static engineering candidate",
  sourceSwfSha256: COURSE_G04_L03_TS_006_SOURCE.swfSha256,
  assetSource: "/flash-assets/courses/course-g04-l03-ts-006/canvas-renderer.js",
  stage: Object.freeze({ width: 800, height: 600, backgroundColor: "#b8d8f7" }),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-23",
  mainFrameCount: 128,
  playbackMode: "once",
  strictCaptureIdentity: true,
  companionDomains: Object.freeze([
    Object.freeze({
      id: "sprite-3",
      frameCount: 1,
      label: "Page title companion",
    }),
  ]),
  visualMarkers: Object.freeze([
    Object.freeze({ id: "four-step-plan", firstFrame: 1, lastFrame: 128 }),
  ]),
  sourceControlBehaviorLabel:
    "Guide-layer language symbols, host navigation, and embedded stream audio remain disabled; the associated Spanish audio path is exposed only as a listening-unvalidated host candidate",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L03_TS_006_DIAGNOSTIC_COMPOSITE_SCENARIO =
  "manual-runtime-diagnostic-observation";

export const COURSE_G04_L03_TS_006_DIAGNOSTIC_COLOR_CALIBRATION = Object.freeze(
  {
    status: "diagnostic-srgb-gamma-projection-not-authoritative",
    scope: "diagnostic-composite-only",
    sourceBasis:
      "offline-v11-whole-stage-diagnostic-rmse-probe-not-runtime-color-telemetry",
    transferFunction: "C_out=C_in^(1/1.2)",
    inputGamma: 1.2,
    exponent: 5 / 6,
    amplitude: 1,
    offset: 0,
    colorInterpolationFilters: "sRGB",
    sourceStaticPathAffected: false,
    originalRuntimeColorPipelineEstablished: false,
    visualParityEstablished: false,
    strictAcceptanceEffect: "none",
  },
);

export const COURSE_G04_L03_TS_006_DIAGNOSTIC_SHELL_LAYOUT = Object.freeze({
  status:
    "acceptance-neutral-diagnostic-layout-fit-not-original-runtime-validated",
  scope: "diagnostic-composite-only",
  sourceStaticPathAffected: false,
  wholeFrameOrRegionAssetUsed: false,
  strictAcceptanceEffect: "none",
  pageTitle: Object.freeze({ x: 206, y: 67.25, width: 381, height: 24 }),
  map: Object.freeze({ x: 28, y: 548, width: 129, height: 40.5 }),
  keyTerms: Object.freeze({ x: 180, y: 548.5, width: 129, height: 40 }),
  calculator: Object.freeze({ x: 333, y: 548, width: 128, height: 40 }),
  rewind: Object.freeze({ x: 557, y: 531, width: 27, height: 26 }),
  forward: Object.freeze({ x: 708, y: 531.5, width: 27, height: 26 }),
  spanishPageAudio: Object.freeze({
    x: 631.25,
    y: 84.5,
    width: 134,
    height: 22,
  }),
  replay: Object.freeze({
    x: 563.78,
    y: 558.18,
    width: 27.22,
    height: 27.22,
  }),
  playback: Object.freeze({
    x: 716.7,
    y: 558.8,
    width: 27.22,
    height: 27.22,
  }),
  previous: Object.freeze({ x: 500.95, y: 536, width: 44, height: 44 }),
  next: Object.freeze({ x: 746.05, y: 536, width: 44, height: 44 }),
  volumeIcon: Object.freeze({
    x: 601.7,
    y: 561.9,
    width: 21,
    height: 21,
  }),
  volumeMutedIcon: Object.freeze({
    x: 598.08,
    y: 559.68,
    width: 27.24,
    height: 25.44,
  }),
  volumeSlider: Object.freeze({
    x: 618.6,
    y: 564,
    width: 83.88,
    height: 17,
  }),
});

export const COURSE_G04_L03_TS_006_DIAGNOSTIC_STATUS_STRIP = Object.freeze({
  status:
    "source-supported-exact-pid-diagnostic-observation-no-ordinal-authority",
  scope: "diagnostic-composite-only",
  sourceBasis:
    "same-eight-block-state-observed-at-all-ten-exact-pid-diagnostic-anchor-frames",
  geometry: Object.freeze({
    y: 529,
    height: 12,
    width: 14,
    edgeInsetPixels: 1,
  }),
  blocks: Object.freeze([
    Object.freeze({ x: 9, observedOutputSrgbColor: "#f97100" }),
    Object.freeze({ x: 49, observedOutputSrgbColor: "#f97100" }),
    Object.freeze({ x: 89, observedOutputSrgbColor: "#f97100" }),
    Object.freeze({ x: 129, observedOutputSrgbColor: "#f97100" }),
    Object.freeze({ x: 169, observedOutputSrgbColor: "#facd00" }),
    Object.freeze({ x: 209, observedOutputSrgbColor: "#ffffff" }),
    Object.freeze({ x: 249, observedOutputSrgbColor: "#ffffff" }),
    Object.freeze({ x: 289, observedOutputSrgbColor: "#ffffff" }),
  ]),
  blockOrdinalMeaning: "unresolved",
  activeOrdinal: null,
  ordinalAuthorityEstablished: false,
  sourceStaticPathAffected: false,
  wholeFrameOrRegionAssetUsed: false,
  strictAcceptanceEffect: "none",
});

export const COURSE_G04_L03_TS_006_DIAGNOSTIC_PROGRESS_COLOR_PROJECTION =
  Object.freeze({
    status: "acceptance-neutral-inverse-gamma-progress-input-not-authoritative",
    scope: "diagnostic-progress-rectangles-only",
    sourceBasis:
      "v15-exact-pid-fixed-registration-flat-progress-pixel-observation",
    filterExponent: 5 / 6,
    semanticOutputColors: Object.freeze({
      fill: "#28A4FF",
      track: "#717171",
    }),
    filterInputColors: Object.freeze({
      fill: "#1C96FF",
      track: "#606060",
    }),
    progressRectanglesRemainInsideFilter: true,
    progressThumbAffected: false,
    progressMappingAffected: false,
    sourceStaticPathAffected: false,
    originalRuntimeColorPipelineEstablished: false,
    strictAcceptanceEffect: "none",
  });

export const COURSE_G04_L03_TS_006_PROGRESS_THUMB_ASSET = Object.freeze({
  classification:
    "ffdec-source-structural-semantic-control-not-original-runtime-authority",
  sourceAnimationId: "shell-course-g04-l03-index-local",
  sourceFrameDomain: "sprite-112",
  sourceCharacterId: 112,
  sourceFrameCount: 2,
  manifest: Object.freeze({
    path: "public/flash-assets/courses/shell-course-g04-l03-index-local/sprite-112/manifest.json",
    bytes: 5_024,
    sha256: "2054628efcb661111b19fb68a84f59a69f745063c623279ac14b24b979690442",
  }),
  image: Object.freeze({
    path: "public/flash-assets/courses/shell-course-g04-l03-index-local/sprite-112/visual-001-0b930c4cdd4b.png",
    publicPath:
      "/flash-assets/courses/shell-course-g04-l03-index-local/sprite-112/visual-001-0b930c4cdd4b.png",
    bytes: 290,
    sha256: "0b930c4cdd4b0d5e99e8ef8b86cb7b1ff60bddabb324d3e9ea20bfd4286bfa34",
    width: 235,
    height: 32,
  }),
  sourceComposition: Object.freeze({
    x: 584.026031494127,
    y: 538.048429870606,
    scaleX: 1.000213623047,
    scaleY: 1.267807006836,
  }),
  authority: Object.freeze({
    originalRuntimeBaseline: false,
    sourcePlayheadMappingEstablished: false,
    actionScriptExecuted: false,
    behaviorParityEstablished: false,
    strictAcceptanceEffect: "none",
  }),
});

export const COURSE_G04_L03_TS_006_SHELL_STRUCTURAL_ASSETS = Object.freeze({
  manifest: Object.freeze({
    path: "public/flash-assets/courses/course-g04-l03-ts-006/diagnostic-composite-assets/manifest.json",
    publicPath:
      "/flash-assets/courses/course-g04-l03-ts-006/diagnostic-composite-assets/manifest.json",
    bytes: 24_235,
    sha256: "aa99f9637c17026d8f763579ed907b8c7a2933ad2c95cd867d6cf2a3f6ee2a0d",
  }),
  classification:
    "ffdec-structural-assets-for-diagnostic-engineering-candidate",
  sourceRootFrame: 49,
  controls: Object.freeze({
    spanishPageAudio: Object.freeze({
      role: "lesson-shell-spanish-page-audio-up",
      file: "lesson-shell-spanish-page-audio-up.png",
      bytes: 3_678,
      sha256:
        "166048633c189ba63c057aa00697f44216aab65d00a1f288af94f8b6a3dc58db",
      sourceCharacterId: 217,
      sourceState: "up",
      sourceAction: "_root.doPlaySpanishAudio()",
      layout: COURSE_G04_L03_TS_006_DIAGNOSTIC_SHELL_LAYOUT.spanishPageAudio,
    }),
    replay: Object.freeze({
      role: "lesson-shell-replay-up",
      file: "lesson-shell-replay-up.png",
      bytes: 3_056,
      sha256:
        "7079f2329ddd27617534201b6c945d4a65266bdc0b61dec1b735992481f74b56",
      sourceCharacterId: 252,
      sourceState: "up",
      layout: COURSE_G04_L03_TS_006_DIAGNOSTIC_SHELL_LAYOUT.replay,
    }),
    play: Object.freeze({
      role: "lesson-shell-play-up",
      file: "lesson-shell-play-up.png",
      bytes: 2_694,
      sha256:
        "358a2aaac6e7ba756c913de6b9e8e6468a9a6b9e0e0a290d896bced97e3e7063",
      sourceCharacterId: 256,
      sourceState: "up",
      layout: COURSE_G04_L03_TS_006_DIAGNOSTIC_SHELL_LAYOUT.playback,
    }),
    pause: Object.freeze({
      role: "lesson-shell-pause-up",
      file: "lesson-shell-pause-up.png",
      bytes: 2_396,
      sha256:
        "18c5e0e5da7e6c992a5c0bf0ae7dcd7f92d4dd47fb2b9769b0bf5f8d9217b2d5",
      sourceCharacterId: 260,
      sourceState: "up",
      layout: COURSE_G04_L03_TS_006_DIAGNOSTIC_SHELL_LAYOUT.playback,
    }),
    volume: Object.freeze({
      role: "lesson-shell-volume-icon-up",
      file: "lesson-shell-volume-icon-up.png",
      bytes: 2_646,
      sha256:
        "3cb9da43b2d5b1948905f2b974cc74384ffb53ac714414924c443cc664037c83",
      sourceCharacterId: 330,
      sourceState: "up",
      layout: COURSE_G04_L03_TS_006_DIAGNOSTIC_SHELL_LAYOUT.volumeIcon,
    }),
    volumeMuted: Object.freeze({
      role: "lesson-shell-volume-muted-icon-up",
      file: "lesson-shell-volume-muted-icon-up.png",
      bytes: 2_850,
      sha256:
        "742e70222227de4f64530337994f391a7884f5a6106b1a8ed9cff41a388164ee",
      sourceCharacterId: 333,
      sourceState: "up",
      layout: COURSE_G04_L03_TS_006_DIAGNOSTIC_SHELL_LAYOUT.volumeMutedIcon,
    }),
    next: Object.freeze({
      role: "lesson-shell-next-neutral-up",
      file: "lesson-shell-next-neutral-up.png",
      bytes: 4_324,
      sha256:
        "bdcc6b1de9f36fb0f2fe322a7dbf56a42b05c0f5675698fe031fafa4ca9ad886",
      sourceCharacterId: 340,
      sourceState: "up",
      layout: COURSE_G04_L03_TS_006_DIAGNOSTIC_SHELL_LAYOUT.next,
      mirrorX: false,
    }),
    previous: Object.freeze({
      role: "lesson-shell-previous-neutral-up",
      file: "lesson-shell-previous-neutral-up.png",
      bytes: 4_324,
      sha256:
        "bdcc6b1de9f36fb0f2fe322a7dbf56a42b05c0f5675698fe031fafa4ca9ad886",
      sourceCharacterId: 342,
      sourceState: "up",
      layout: COURSE_G04_L03_TS_006_DIAGNOSTIC_SHELL_LAYOUT.previous,
      mirrorX: true,
    }),
    volumeSlider: Object.freeze({
      role: "lesson-shell-volume-slider-source-static",
      file: "lesson-shell-volume-slider-source-static.png",
      bytes: 190,
      sha256:
        "e098126899d81da32e8cae04e1d363d7722a29eee2fec9e3b25c39a60e605986",
      sourceCharacterId: 185,
      sourceState: "frame-1",
      layout: COURSE_G04_L03_TS_006_DIAGNOSTIC_SHELL_LAYOUT.volumeSlider,
    }),
  }),
  authority: Object.freeze({
    originalRuntimeBaseline: false,
    sourceFrameMappingEstablished: false,
    structuralPlacementMetadataIncluded: true,
    sourceActionsExecuted: false,
    audioRendered: false,
    behaviorParityEstablished: false,
    strictAcceptanceEffect: "none",
  }),
});

export interface CourseG04L03Ts006ShellControlState {
  readonly manifestSha256: "aa99f9637c17026d8f763579ed907b8c7a2933ad2c95cd867d6cf2a3f6ee2a0d";
  readonly playbackVisual: "pause";
  readonly volumeVisual: "volume";
  readonly previousNextVisual: "neutral-up";
  readonly spanishPageAudioVisual: "up";
  readonly replayVisual: "up";
  readonly progressWidthPixels: number;
  readonly progressFillColor: "#28A4FF";
  readonly progressTrackColor: "#717171";
  readonly progressFillFilterInputColor: "#1C96FF";
  readonly progressTrackFilterInputColor: "#606060";
  readonly progressColorProjectionStatus: "acceptance-neutral-inverse-gamma-progress-input-not-authoritative";
  readonly progressThumbOffsetPixels: number;
  readonly progressMappingStatus: "diagnostic-piecewise-anchor-projection-not-authoritative";
  readonly statusStrip: typeof COURSE_G04_L03_TS_006_DIAGNOSTIC_STATUS_STRIP;
  readonly stateBasis: "deterministic-current-js-candidate-not-original-runtime-authority";
  readonly sourceActionsExecuted: false;
  readonly audioRendered: false;
  readonly strictAcceptanceEffect: "none";
}

export const COURSE_G04_L03_TS_006_DIAGNOSTIC_PROGRESS_ANCHORS = Object.freeze([
  Object.freeze({ frame: 1, widthPixels: 0 }),
  Object.freeze({ frame: 8, widthPixels: 4 }),
  Object.freeze({ frame: 13, widthPixels: 7 }),
  Object.freeze({ frame: 55, widthPixels: 41 }),
  Object.freeze({ frame: 58, widthPixels: 43 }),
  Object.freeze({ frame: 74, widthPixels: 55 }),
  Object.freeze({ frame: 77, widthPixels: 57 }),
  Object.freeze({ frame: 125, widthPixels: 94 }),
  Object.freeze({ frame: 127, widthPixels: 97 }),
  Object.freeze({ frame: 128, widthPixels: 98 }),
]);

export function getCourseG04L03Ts006DiagnosticProgressWidth(frame: number) {
  const normalizedFrame = Math.min(
    128,
    Math.max(1, Math.floor(Number.isFinite(frame) ? frame : 1)),
  );
  const anchors = COURSE_G04_L03_TS_006_DIAGNOSTIC_PROGRESS_ANCHORS;
  const exact = anchors.find((anchor) => anchor.frame === normalizedFrame);
  if (exact) return exact.widthPixels;
  const upperIndex = anchors.findIndex(
    (anchor) => anchor.frame > normalizedFrame,
  );
  if (upperIndex <= 0) return anchors[0].widthPixels;
  if (upperIndex === -1) return anchors[anchors.length - 1].widthPixels;
  const lower = anchors[upperIndex - 1];
  const upper = anchors[upperIndex];
  return (
    lower.widthPixels +
    Math.round(
      ((normalizedFrame - lower.frame) *
        (upper.widthPixels - lower.widthPixels)) /
        (upper.frame - lower.frame),
    )
  );
}

export function getCourseG04L03Ts006ShellControlState(
  frame: number,
): CourseG04L03Ts006ShellControlState {
  const normalizedFrame = Math.min(
    128,
    Math.max(1, Math.floor(Number.isFinite(frame) ? frame : 1)),
  );
  return Object.freeze({
    manifestSha256:
      "aa99f9637c17026d8f763579ed907b8c7a2933ad2c95cd867d6cf2a3f6ee2a0d",
    playbackVisual: "pause",
    volumeVisual: "volume",
    previousNextVisual: "neutral-up",
    spanishPageAudioVisual: "up",
    replayVisual: "up",
    progressWidthPixels:
      getCourseG04L03Ts006DiagnosticProgressWidth(normalizedFrame),
    progressFillColor:
      COURSE_G04_L03_TS_006_DIAGNOSTIC_PROGRESS_COLOR_PROJECTION
        .semanticOutputColors.fill,
    progressTrackColor:
      COURSE_G04_L03_TS_006_DIAGNOSTIC_PROGRESS_COLOR_PROJECTION
        .semanticOutputColors.track,
    progressFillFilterInputColor:
      COURSE_G04_L03_TS_006_DIAGNOSTIC_PROGRESS_COLOR_PROJECTION
        .filterInputColors.fill,
    progressTrackFilterInputColor:
      COURSE_G04_L03_TS_006_DIAGNOSTIC_PROGRESS_COLOR_PROJECTION
        .filterInputColors.track,
    progressColorProjectionStatus:
      COURSE_G04_L03_TS_006_DIAGNOSTIC_PROGRESS_COLOR_PROJECTION.status,
    progressThumbOffsetPixels:
      getCourseG04L03Ts006DiagnosticProgressWidth(normalizedFrame),
    progressMappingStatus:
      "diagnostic-piecewise-anchor-projection-not-authoritative",
    statusStrip: COURSE_G04_L03_TS_006_DIAGNOSTIC_STATUS_STRIP,
    stateBasis:
      "deterministic-current-js-candidate-not-original-runtime-authority",
    sourceActionsExecuted: false,
    audioRendered: false,
    strictAcceptanceEffect: "none",
  });
}

export const COURSE_G04_L03_TS_006_DIAGNOSTIC_CALIBRATION = Object.freeze({
  status: "diagnostic-piecewise-anchor-projection-not-authoritative",
  sourceFrameDomain: "sprite-23",
  sourceFirstFrame: 1,
  sourceLastFrame: 128,
  firstNaturalRunBaseCaptureOrdinal: 2032,
  firstNaturalRunTerminalCaptureOrdinal: 2272,
  captureOrdinalSpan: 240,
  sourceFrameSpan: 127,
  repeatedRuns: Object.freeze([
    Object.freeze({
      id: "first-natural-ts005-to-ts006-entry",
      baseCaptureOrdinal: 2032,
    }),
    Object.freeze({ id: "host-replay", baseCaptureOrdinal: 2354 }),
    Object.freeze({
      id: "previous-to-ts005-then-next-to-ts006",
      baseCaptureOrdinal: 2989,
    }),
  ]),
  firstNaturalRunAnchors: Object.freeze([
    Object.freeze({ sourceFrame: 1, captureOrdinal: 2032 }),
    Object.freeze({ sourceFrame: 8, captureOrdinal: 2045 }),
    Object.freeze({ sourceFrame: 13, captureOrdinal: 2054 }),
    Object.freeze({ sourceFrame: 55, captureOrdinal: 2134 }),
    Object.freeze({ sourceFrame: 58, captureOrdinal: 2140 }),
    Object.freeze({ sourceFrame: 74, captureOrdinal: 2170 }),
    Object.freeze({ sourceFrame: 77, captureOrdinal: 2176 }),
    Object.freeze({ sourceFrame: 125, captureOrdinal: 2267 }),
    Object.freeze({ sourceFrame: 127, captureOrdinal: 2271 }),
    Object.freeze({ sourceFrame: 128, captureOrdinal: 2272 }),
  ]),
  captureOrdinalProjection:
    "piecewise-interpolation-between-manual-diagnostic-anchors-not-source-frame-authority",
  inferredSourcePhases: Object.freeze({
    checkYourWork: Object.freeze({ firstVisible: 8, fullyVisible: 13 }),
    strategiesHeading: Object.freeze({ firstVisible: 55, fullyVisible: 58 }),
    strategyList: Object.freeze({ firstVisible: 74, fullyVisible: 77 }),
    showYourWorkPulse: Object.freeze({
      firstVisible: 125,
      firstPulseVariantA: 127,
      terminal: 128,
    }),
  }),
  sourceFrameMappingAuthority: "unresolved",
  strictAcceptanceEffect: "none",
});

export interface CourseG04L03Ts006DiagnosticCompositeState {
  readonly animationId: "course-g04-l03-ts-006";
  readonly frame: number;
  readonly frameDomain: "sprite-23";
  readonly rootFrame: 6;
  readonly scenario: typeof COURSE_G04_L03_TS_006_DIAGNOSTIC_COMPOSITE_SCENARIO;
  readonly language: AnimationLanguage;
  readonly seed: number;
  readonly status: "ready" | "blocked";
  readonly blocker:
    | "spanish-diagnostic-observation-unavailable"
    | "diagnostic-frame-domain-scenario-mismatch"
    | null;
  readonly calibrationStatus: "diagnostic-piecewise-anchor-projection-not-authoritative";
  readonly mappedFirstRunCaptureOrdinal: number;
  readonly checkYourWorkOpacity: number;
  readonly strategiesHeadingOpacity: number;
  readonly strategyListOpacity: number;
  readonly showYourWorkOpacity: number;
  readonly showYourWorkColor: "blue" | "magenta";
  readonly colorCalibration: typeof COURSE_G04_L03_TS_006_DIAGNOSTIC_COLOR_CALIBRATION;
  readonly shellControls: CourseG04L03Ts006ShellControlState;
  readonly replayResetObservationScope: "three-run-diagnostic-global-not-per-frame";
  readonly naturalRuntimeEstablished: false;
  readonly audioRendered: false;
  readonly strictAcceptanceEffect: "none";
}

function normalizeDiagnosticFrame(frame: number) {
  if (!Number.isFinite(frame)) return 1;
  return Math.min(128, Math.max(1, Math.floor(frame)));
}

function ramp(frame: number, firstVisible: number, fullyVisible: number) {
  if (frame < firstVisible) return 0;
  if (frame >= fullyVisible) return 1;
  return (frame - firstVisible + 1) / (fullyVisible - firstVisible + 1);
}

function projectFirstNaturalRunCaptureOrdinal(frame: number) {
  const anchors =
    COURSE_G04_L03_TS_006_DIAGNOSTIC_CALIBRATION.firstNaturalRunAnchors;
  const exact = anchors.find((anchor) => anchor.sourceFrame === frame);
  if (exact) return exact.captureOrdinal;
  const upperIndex = anchors.findIndex((anchor) => anchor.sourceFrame > frame);
  if (upperIndex <= 0) return anchors[0].captureOrdinal;
  if (upperIndex === -1) return anchors[anchors.length - 1].captureOrdinal;
  const lower = anchors[upperIndex - 1];
  const upper = anchors[upperIndex];
  return (
    lower.captureOrdinal +
    Math.round(
      ((frame - lower.sourceFrame) *
        (upper.captureOrdinal - lower.captureOrdinal)) /
        (upper.sourceFrame - lower.sourceFrame),
    )
  );
}

export function getCourseG04L03Ts006DiagnosticCompositeState(
  frame: number,
  context: Pick<RuntimeContext, "frameDomain" | "scenario" | "lang" | "seed">,
): CourseG04L03Ts006DiagnosticCompositeState {
  const normalizedFrame = normalizeDiagnosticFrame(frame);
  const language: AnimationLanguage = context.lang === "es" ? "es" : "en";
  const seed = Number.isSafeInteger(context.seed) ? context.seed >>> 0 : 0;
  const phases =
    COURSE_G04_L03_TS_006_DIAGNOSTIC_CALIBRATION.inferredSourcePhases;
  const identityMatches =
    context.frameDomain === "sprite-23" &&
    context.scenario === COURSE_G04_L03_TS_006_DIAGNOSTIC_COMPOSITE_SCENARIO;
  const blocker = !identityMatches
    ? "diagnostic-frame-domain-scenario-mismatch"
    : language === "es"
      ? "spanish-diagnostic-observation-unavailable"
      : null;
  return Object.freeze({
    animationId: "course-g04-l03-ts-006",
    frame: normalizedFrame,
    frameDomain: "sprite-23",
    rootFrame: 6,
    scenario: COURSE_G04_L03_TS_006_DIAGNOSTIC_COMPOSITE_SCENARIO,
    language,
    seed,
    status: blocker === null ? "ready" : "blocked",
    blocker,
    calibrationStatus:
      "diagnostic-piecewise-anchor-projection-not-authoritative",
    mappedFirstRunCaptureOrdinal:
      projectFirstNaturalRunCaptureOrdinal(normalizedFrame),
    checkYourWorkOpacity: ramp(
      normalizedFrame,
      phases.checkYourWork.firstVisible,
      phases.checkYourWork.fullyVisible,
    ),
    strategiesHeadingOpacity: ramp(
      normalizedFrame,
      phases.strategiesHeading.firstVisible,
      phases.strategiesHeading.fullyVisible,
    ),
    strategyListOpacity: ramp(
      normalizedFrame,
      phases.strategyList.firstVisible,
      phases.strategyList.fullyVisible,
    ),
    showYourWorkOpacity: ramp(
      normalizedFrame,
      phases.showYourWorkPulse.firstVisible,
      phases.showYourWorkPulse.firstPulseVariantA,
    ),
    showYourWorkColor:
      normalizedFrame === phases.showYourWorkPulse.firstPulseVariantA
        ? "magenta"
        : "blue",
    colorCalibration: COURSE_G04_L03_TS_006_DIAGNOSTIC_COLOR_CALIBRATION,
    shellControls: getCourseG04L03Ts006ShellControlState(normalizedFrame),
    replayResetObservationScope: "three-run-diagnostic-global-not-per-frame",
    naturalRuntimeEstablished: false,
    audioRendered: false,
    strictAcceptanceEffect: "none",
  });
}

export const COURSE_G04_L03_TS_006_AUTHORITY = Object.freeze({
  implementationAuthorized: false,
  registryIsPrototypeOnly: true,
  productRouteMayBeAdded: false,
  strictLedgerMayBeChanged: false,
  publicStrictLibraryAdmission: false,
  legacyActionScriptExecuted: false,
  embeddedAudioRendered: false,
  associatedAudioRendered: false,
  spanishVisualRuntimeEstablished: false,
  rootCompositionEstablished: false,
  companionCompositionEstablished: false,
  naturalRuntimeReachabilityEstablished: false,
  replayParityEstablished: false,
  behaviorParityEstablished: false,
  fullFrameRmseEstablished: false,
  humanVisualReviewAccepted: false,
  ownerAccepted: false,
  strictMigrationComplete: false,
  strictAcceptanceEffect: "none",
});
