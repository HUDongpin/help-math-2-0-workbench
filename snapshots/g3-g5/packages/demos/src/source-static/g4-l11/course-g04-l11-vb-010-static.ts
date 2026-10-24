/**
 * Acceptance-neutral source-static facts for G4 L11 VB010.
 *
 * This module does not execute AVM1, play audio, register a renderer, or
 * establish natural reachability, fidelity, review, completion, or release.
 */

export const COURSE_G04_L11_VB_010_STATIC_ANIMATION_ID =
  "course-g04-l11-vb-010" as const;

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

export const COURSE_G04_L11_VB_010_STATIC_EVIDENCE = deepFreeze({
  swf: {
    path: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/VB/L11VB10.swf",
    bytes: 32_366,
    sha256:
      "a4b46ef4c0a5476ecfc35f63d4fb78f3fd4d9c6340e760443e4f7d078013d5d8",
    mode: "0500",
    nlink: 1,
  },
  fla: {
    path: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/VB/L11VB10.fla",
    bytes: 181_760,
    sha256:
      "185e22a067bc27d57801f35022ff76ced79c11b7e5eda61e847e0e327a97ef9b",
    mode: "0500",
    nlink: 1,
  },
  scenarioInventory: {
    path: "migrations/course-g04-l11-vb-010/audit/scenario-inventory.json",
    bytes: 106_598,
    sha256:
      "deccd5c45e7ecd844e80091c1a54e00c6b59294df89f7bc039e4494b779810ca",
  },
  frameDomainDisposition: {
    path: "migrations/course-g04-l11-vb-010/audit/frame-domain-disposition.json",
    bytes: 11_380,
    sha256:
      "6832aaea36cb0a84b2649efbb2f6fa94aafa43caee15091440b959207cfcada2",
  },
  audioEvidence: {
    path: "migrations/course-g04-l11-vb-010/audit/audio-runtime-evidence.json",
    bytes: 9_836,
    sha256:
      "a81a906f546a7ab409bb6b650309db15ff2ef15cca663246fb1cca5102377a20",
  },
  frameDomainCandidates: {
    path:
      "migrations/course-g04-l11-vb-010/audit/machine/swf-frame-domain-candidates.json",
    bytes: 2_175,
    sha256:
      "03f7b52d9be4d7db680f14801d09261b15d565274053f7f763a204cd5326cbea",
  },
  swfmillStructure: {
    path: "migrations/course-g04-l11-vb-010/audit/machine/swfmill.xml.gz",
    bytes: 41_149,
    sha256:
      "e80d0f5940c693cd2eb296d9045e1b066e42ecf045f33d116c17087e56b12209",
  },
} as const);
export const COURSE_G04_L11_VB_010_STATIC_SOURCE_FACTS = deepFreeze({
  animationId: COURSE_G04_L11_VB_010_STATIC_ANIMATION_ID,
  assetId:
    "swf-a4b46ef4c0a5476ecfc35f63d4fb78f3fd4d9c6340e760443e4f7d078013d5d8",
  release: {
    releaseId: "lesson-g04-l11-coordinate-grid",
    ordinal: 13,
    releaseMemberCount: 44,
    activePageCount: 43,
    role: "active-xml-referenced-page",
    title: {en: "Line Segment", es: "Segmento de línea"},
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
    childTimelineId: "sprite-43",
    sourceObjectId: 43,
    frame: 6,
    depth: 4,
    instanceName: "animation",
    translationTwips: {x: 8_026, y: 4_885},
    translationPixels: {x: 401.3, y: 244.25},
  },
  instruction: {
    definition: "A line segment is part of a line between two points.",
    endpoints: [
      {role: "upper", x: 2, y: 6, orderedPair: "(2,6)"},
      {role: "lower", x: 2, y: 2, orderedPair: "(2,2)"},
    ],
    segment: {orientation: "vertical", x: 2, yFrom: 2, yTo: 6},
    structuralObservations: [
      {frame: 1, observation: "isolated-principal-visually-empty"},
      {frame: 10, observation: "partial-line-segment-term-reveal"},
      {frame: 20, observation: "grid-and-both-blue-endpoints-visible"},
      {frame: 30, observation: "definition-reveal-in-progress"},
      {frame: 40, observation: "definition-through-part-of-line-visible"},
      {frame: 50, observation: "red-vertical-segment-visible"},
      {frame: 60, observation: "both-coordinate-labels-visible"},
      {frame: 66, observation: "complete-definition-segment-and-labels-visible"},
    ],
  },
  principalTimeline: {
    timelineId: "sprite-43",
    frameCount: 66,
    sourceDomainDisposition: "unresolved",
    structuralReachability: "reachable-from-root-placement-graph",
    placementEntryState: "unresolved",
    localStopFrames: [],
    sourceTerminalBehaviorEstablished: false,
    directSeekLimit:
      "Direct local-frame selection does not establish natural entry, narration synchronization, glossary return, terminal hold or loop behavior, or Replay.",
  },
  otherNestedTimeline: {
    timelineId: "sprite-5",
    objectId: 5,
    frameCount: 1,
    rootPlacementName: "Mc_Page_Title",
    sourceDomainDisposition: "unresolved",
  },
  glossaryControls: [
    {buttonObjectId: 10, visibleTerm: "line segment", glossaryKey: "Line segment"},
    {buttonObjectId: 11, visibleTerm: "line", glossaryKey: "Line"},
    {buttonObjectId: 12, visibleTerm: "points", glossaryKey: "Point"},
  ],
  sourceHostCalls: [
    "_root.DoHyperLinks",
    "_root.animation_mc.animation.stop",
  ],
  audio: {
    embeddedStreamCount: 1,
    principalStream: {
      timelineId: "sprite-43",
      blockCount: 63,
      structuralDurationMs: 5_224,
      format: "mp3",
      sampleRateHz: 22_050,
      channels: 1,
    },
    audibleContentAccepted: false,
    synchronizationAccepted: false,
  },
  productBoundary: {
    modernLessonShellUsed: true,
    legacyCourseShellNavigationAndPlayerChromeIncluded: false,
    animationInternalGlossaryControlsRequired: true,
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
