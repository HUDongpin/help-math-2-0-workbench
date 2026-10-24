/**
 * Acceptance-neutral source-static facts for G4 L11 VB007.
 *
 * Nothing in this module executes AVM1, plays audio, registers a renderer, or
 * establishes runtime reachability, fidelity, review, completion, or release.
 */

export const COURSE_G04_L11_VB_007_STATIC_ANIMATION_ID =
  "course-g04-l11-vb-007" as const;

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

export const COURSE_G04_L11_VB_007_STATIC_EVIDENCE = deepFreeze({
  swf: {
    path: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/VB/L11VB07.swf",
    bytes: 130_697,
    sha256:
      "be59c2d00360e14088098482dafbc5d919b29d95ee1b4462c4077c9883ad076c",
    mode: "0500",
    nlink: 1,
  },
  fla: {
    path: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/VB/L11VB07.fla",
    bytes: 875_520,
    sha256:
      "5fca080932418462ec5996f44333335a55a223a338ab3937f759d06806d0d1ac",
    mode: "0500",
    nlink: 1,
  },
  scenarioInventory: {
    path: "migrations/course-g04-l11-vb-007/audit/scenario-inventory.json",
    bytes: 451_835,
    sha256:
      "93e5e2c28760c6da191ca008ff81a2592f63ff09dcedab3fe791d69131f1ed7b",
  },
  audioEvidence: {
    path: "migrations/course-g04-l11-vb-007/audit/audio-runtime-evidence.json",
    bytes: 26_941,
    sha256:
      "8aae4077cd9d587191daa408c45ef734189f1c163c78b0ee87d802f9ffd70eb6",
  },
  frameDomainCandidates: {
    path:
      "migrations/course-g04-l11-vb-007/audit/machine/swf-frame-domain-candidates.json",
    bytes: 6_750,
    sha256:
      "9a0283548a60f950b2282a99638189a26d787721ed2c8032c515b681eac81076",
  },
  swfmillStructure: {
    path: "migrations/course-g04-l11-vb-007/audit/machine/swfmill.xml.gz",
    bytes: 189_537,
    sha256:
      "d9e4d02564e1c21f37e507a470d2d718b757003ec045f7fe8fb0f37abc6430de",
  },
} as const);

export const COURSE_G04_L11_VB_007_STATIC_SOURCE_FACTS = deepFreeze({
  animationId: COURSE_G04_L11_VB_007_STATIC_ANIMATION_ID,
  assetId:
    "swf-be59c2d00360e14088098482dafbc5d919b29d95ee1b4462c4077c9883ad076c",
  release: {
    releaseId: "lesson-g04-l11-coordinate-grid",
    ordinal: 10,
    releaseMemberCount: 44,
    activePageCount: 43,
    role: "active-xml-referenced-page",
    title: {en: "Ordered Pair Practice", es: "Práctica de pares ordenados"},
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
    childTimelineId: "sprite-254",
    sourceObjectId: 254,
    frame: 6,
    depth: 3,
    instanceName: "animation",
    translationTwips: {x: 8_248, y: 5_666},
    translationPixels: {x: 412.4, y: 283.3},
  },
  instruction: {
    prompt:
      "Click the ordered pair that names Point B on this coordinate grid.",
    point: {name: "B", x: 2, y: 4},
    choices: [
      {buttonObjectId: 40, value: "(2,4)", outcome: "correct"},
      {buttonObjectId: 39, value: "(4,2)", outcome: "incorrect"},
    ],
    correctChoice: "(2,4)",
    distractorMeaning: "reverses-x-and-y",
    answerControlsPlacedAtPrincipalFrame: 69,
  },
  principalTimeline: {
    timelineId: "sprite-254",
    frameCount: 107,
    sourceDomainDisposition: "unresolved",
    structuralReachability: "unresolved",
    placementEntryState: "unresolved",
    localStops: [69, 107],
    quizSectionTransitions: [
      {frame: 69, value: true},
      {frame: 70, value: false},
    ],
    directSeekLimit:
      "Direct local-frame selection does not establish branch entry state, feedback causality, attempt state, terminal behavior, or Replay.",
  },
  nestedDefinitions: [
    [89, 5], [91, 1], [94, 28], [99, 1], [108, 31], [119, 28],
    [131, 31], [163, 25], [188, 27], [194, 1], [202, 1], [205, 28],
    [217, 25], [226, 22], [248, 26], [254, 107],
  ].map(([objectId, frameCount]) => ({
    timelineId: `sprite-${objectId}`,
    objectId,
    frameCount,
    disposition: "structural-candidate-only",
    runtimeReachabilityEstablished: false,
  })),
  glossaryControls: [
    {buttonObjectId: 7, term: "Point", timelineId: "sprite-254"},
    {buttonObjectId: 8, term: "Coordinate grid", timelineId: "sprite-254"},
    {buttonObjectId: 9, term: "Ordered pair", timelineId: "sprite-254"},
    {buttonObjectId: 77, term: "Ordered pair", timelineId: "sprite-91"},
    {buttonObjectId: 78, term: "Number", timelineId: "sprite-91"},
    {buttonObjectId: 79, term: "Unit", timelineId: "sprite-91"},
    {buttonObjectId: 80, term: "X-axis", timelineId: "sprite-91"},
    {buttonObjectId: 81, term: "Y-axis", timelineId: "sprite-91"},
  ],
  sourceHostCalls: [
    "_root.DoHyperLinks",
    "_root.animation_mc.animation.stop",
    "_root.disableQuizButton",
    "_root.enableQuizButton",
    "_root.showRightFeed",
    "_root.showWrongFeed",
  ],
  audio: {
    embeddedStreamCount: 11,
    principalStream: {
      timelineId: "sprite-254",
      blockCount: 100,
      structuralDurationMs: 8_307,
    },
    externalSpanishTrack: {
      path:
        "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/SA/L11VB07.mp3",
      bytes: 195_552,
      sha256:
        "029b4c3c7cf8e1abdb5afbe74598b1d3dfacc3c52fab23e6f7c7e9ca966f1bc1",
      structuralDurationMs: 13_968,
    },
    audibleContentAccepted: false,
    synchronizationAccepted: false,
  },
  productBoundary: {
    modernLessonShellUsed: true,
    legacyCourseShellNavigationAndPlayerChromeIncluded: false,
    animationInternalAnswerControlsRequired: true,
    animationInternalGlossaryControlsRequired: true,
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
