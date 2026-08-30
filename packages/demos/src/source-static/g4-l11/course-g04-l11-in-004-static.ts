/**
 * Acceptance-neutral source-static facts for G4 L11 IN004.
 *
 * This module does not execute AVM1, play audio, register a renderer, or
 * establish natural reachability, fidelity, review, completion, or release.
 */

export const COURSE_G04_L11_IN_004_STATIC_ANIMATION_ID =
  "course-g04-l11-in-004" as const;

const deepFreeze = <T>(value: T, seen = new Set<object>()): Readonly<T> => {
  if (value !== null && typeof value === "object") {
    const object = value as Record<PropertyKey, unknown>;
    if (!seen.has(object)) {
      seen.add(object);
      for (const key of Reflect.ownKeys(object)) deepFreeze(object[key], seen);
      Object.freeze(object);
    }
  }
  return value as Readonly<T>;
};

export const COURSE_G04_L11_IN_004_STATIC_EVIDENCE = deepFreeze({
  swf: {
    path: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/IN/L11IN04.swf",
    bytes: 121_123,
    sha256:
      "b987be3902c3937a7c1e010aa241d5a87e569eac056f897c8c223b12a9e65641",
    mode: "0500",
    nlink: 1,
  },
  fla: null,
  pairedFlaStatus: "missing",
  scenarioInventory: {
    path: "migrations/course-g04-l11-in-004/audit/scenario-inventory.json",
    bytes: 392_994,
    sha256:
      "23386b4d767c3e25b0f7d30aeab96bb69b20a24745792a05a99d10911936186e",
  },
  frameDomainDisposition: {
    path: "migrations/course-g04-l11-in-004/audit/frame-domain-disposition.json",
    bytes: 41_399,
    sha256:
      "a76429e9b26d402fc375461829699d52e4826ee05751bf5f21ee5f7d99452177",
  },
  audioEvidence: {
    path: "migrations/course-g04-l11-in-004/audit/audio-runtime-evidence.json",
    bytes: 18_833,
    sha256:
      "f627a24c521764b34f71b324c92116bd31c9acc7fa848d7abaec72656354b691",
  },
  frameDomainCandidates: {
    path:
      "migrations/course-g04-l11-in-004/audit/machine/swf-frame-domain-candidates.json",
    bytes: 6_725,
    sha256:
      "bc703aec0f1a3d253af6026010c29c47443b2ea9765541ca5a79c5fb26d1d459",
  },
  swfmillStructure: {
    path: "migrations/course-g04-l11-in-004/audit/machine/swfmill.xml.gz",
    bytes: 141_406,
    sha256:
      "3b594af4472bf1ff89a0f892a902ba19eed62b669be22e473d46512778d25424",
  },
  generatedCanvasManifest: {
    path: "public/flash-assets/courses/course-g04-l11-in-004/manifest.json",
    bytes: 11_429,
    sha256:
      "f2f4c402479f3195fe438f7a7d2a976162bbcef50f216e4141952fabb2e4b559",
  },
} as const);

export const COURSE_G04_L11_IN_004_TARGETS = deepFreeze([
  {x: 5, y: 4}, {x: 3, y: 6}, {x: 7, y: 1}, {x: 6, y: 3},
  {x: 2, y: 0}, {x: 0, y: 6}, {x: 2, y: 9}, {x: 8, y: 5},
  {x: 6, y: 10}, {x: 1, y: 2}, {x: 7, y: 7}, {x: 4, y: 3},
  {x: 5, y: 8}, {x: 9, y: 1}, {x: 2, y: 4}, {x: 9, y: 8},
  {x: 4, y: 1}, {x: 10, y: 5},
] as const);

export const COURSE_G04_L11_IN_004_STATIC_SOURCE_FACTS = deepFreeze({
  animationId: COURSE_G04_L11_IN_004_STATIC_ANIMATION_ID,
  assetId:
    "swf-b987be3902c3937a7c1e010aa241d5a87e569eac056f897c8c223b12a9e65641",
  release: {
    releaseId: "lesson-g04-l11-coordinate-grid",
    ordinal: 16,
    releaseMemberCount: 44,
    activePageCount: 43,
    role: "active-xml-referenced-page",
    title: {en: "Coordinate Grid", es: "Cuadrícula de coordenadas"},
  },
  runtimeHeader: {
    signature: "CWS",
    swfVersion: 6,
    actionScriptVersion: "AS1/2",
    stage: {width: 800, height: 600, backgroundColor: "#b8d8f7"},
    fps: 12,
    rootFrameCount: 10,
  },
  rootPlacement: {
    parentTimelineId: "root",
    childTimelineId: "sprite-127",
    sourceObjectId: 127,
    frame: 6,
    depth: 3,
    instanceName: "animation",
    translationTwips: {x: 8_248, y: 5_666},
    translationPixels: {x: 412.4, y: 283.3},
  },
  principalTimeline: {
    timelineId: "sprite-127",
    frameCount: 233,
    naturalQuizStopFrame: 228,
    terminalDefinitionFrame: 233,
    sourceDomainDisposition: "unresolved",
    structuralReachability: "reachable-from-root-placement-graph",
    placementEntryState: "unresolved",
    localStopFrames: [228, 233],
    frame233NaturalReachabilityEstablished: false,
    directSeekLimit:
      "Direct local-frame selection does not execute the frame-228 AVM1 quiz initializer or establish random order, feedback timing, coach audio, terminal behavior, or Replay.",
  },
  instruction: {
    sentence:
      "Click the exact location of the ordered pair on the coordinate grid. Click Next Ordered Pair as many times as you like to plot different ordered pairs.",
    firstStructuralExample: {x: 5, y: 4, label: "(5,4)"},
    coordinateRange: {xMin: 0, xMax: 10, yMin: 0, yMax: 10},
    gridStepPixels: {x: 26, y: 26},
    sourceTargetCount: 18,
    sourceHitTargetCount: 121,
    sourceTargetSequenceRandomized: true,
    sourceNoRepeatIntentBeforeReset: true,
    sourcePostExhaustionTypo: "arr.lenght",
    modernPostExhaustionBehavior: "reset-complete-source-target-set",
    structuralObservations: [
      {frame: 1, observation: "instruction-grid-and-next-control-visible"},
      {frame: 80, observation: "example-pointer-enters-grid"},
      {frame: 120, observation: "ordered-pair-five-four-and-example-point-visible"},
      {frame: 160, observation: "example-point-five-four-plotted"},
      {frame: 227, observation: "example-point-holds-before-quiz-initializer"},
      {frame: 228, observation: "static-export-shows-unexecuted-popup-placement"},
    ],
  },
  quizScript: {
    initializationFrame: 228,
    correctRule: "clicked x/y must equal current ordered-pair target",
    correctEffect: [
      "plot selected point label",
      "play Correct_FB from local frame 2",
      "enable Next Ordered Pair after feedback timeline",
    ],
    wrongEffect: [
      "show Pop1_mc teaching popup",
      "start Coach_audio_1 from local frame 2",
      "disable all 121 grid hit targets until popup closes",
    ],
    nextEffect: "select and consume another source target",
    modernRandomContract:
      "seed-derived deterministic permutation of the exact 18 source targets",
  },
  glossaryControls: [
    {buttonObjectId: 74, glossaryKey: "Location", context: "instruction"},
    {buttonObjectId: 75, glossaryKey: "Ordered pair", context: "instruction"},
    {buttonObjectId: 76, glossaryKey: "Coordinate grid", context: "instruction"},
    {buttonObjectId: 121, glossaryKey: "Ordered pair", context: "wrong-feedback"},
    {buttonObjectId: 122, glossaryKey: "Number", context: "wrong-feedback"},
    {buttonObjectId: 123, glossaryKey: "Unit", context: "wrong-feedback"},
    {buttonObjectId: 124, glossaryKey: "Zero", context: "wrong-feedback"},
    {buttonObjectId: 125, glossaryKey: "X-axis", context: "wrong-feedback"},
  ],
  sourceHostCalls: [
    "_root.DoHyperLinks",
    "_root.animation_mc.animation.stop",
    "_root.enableQuizButton",
  ],
  nestedTimelines: {
    structurallyReachableCount: 12,
    unresolvedDispositionCount: 12,
    highRiskIndependentCandidates: [
      {timelineId: "sprite-127", frameCount: 233, role: "principal-quiz"},
      {timelineId: "sprite-108", frameCount: 55, role: "random-coach-audio"},
    ],
  },
  audio: {
    embeddedStreams: [
      {timelineId: "sprite-106", role: "correct-feedback", frameCount: 25,
        structuralDurationMs: 1_907},
      {timelineId: "sprite-108", role: "random-coach-feedback", frameCount: 55,
        labels: ["S1", "S2", "S3", "S4"], structuralDurationMs: 4_389},
      {timelineId: "sprite-116", role: "short-feedback", frameCount: 5,
        structuralDurationMs: 392},
      {timelineId: "sprite-127", role: "principal-instruction", frameCount: 233,
        structuralDurationMs: 18_887},
    ],
    externalSpanish: {
      path: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/SA/L11IN04.mp3",
      bytes: 341_376,
      sha256:
        "102fa1685be3496b53dd42f90c9aff7b2160cb44a8a2381fed5470c01f9ff3fb",
      structuralDurationMs: 24_384,
      hostRouteLanguage: "es",
    },
    audibleContentAccepted: false,
    synchronizationAccepted: false,
  },
  productBoundary: {
    modernLessonShellUsed: true,
    legacyCourseShellNavigationAndPlayerChromeIncluded: false,
    animationInternalGlossaryControlsRequired: true,
    animationInternalGridAndNextControlsRequired: true,
    modernLocalReplayProvided: true,
    sourceReplayBehaviorEstablished: false,
  },
  authorityBoundary: {
    sourceStaticOnly: true,
    rendererRegistered: false,
    currentJavascriptRegistered: false,
    sourceDomainDeclared: false,
    originalRuntimeAccepted: false,
    audioAccepted: false,
    bilingualParityEstablished: false,
    behaviorParityEstablished: false,
    visualFidelityEstablished: false,
    humanReviewAccepted: false,
    ownerAccepted: false,
    strictCompletion: false,
    lessonRelease: false,
    publication: false,
  },
  acceptanceEffect: "none",
} as const);
