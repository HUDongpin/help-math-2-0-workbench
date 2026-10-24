/**
 * Acceptance-neutral source-static facts for G4 L11 IN002.
 *
 * This module does not execute AVM1, play audio, register a renderer, or
 * establish natural reachability, fidelity, review, completion, or release.
 */

export const COURSE_G04_L11_IN_002_STATIC_ANIMATION_ID =
  "course-g04-l11-in-002" as const;

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

export const COURSE_G04_L11_IN_002_STATIC_EVIDENCE = deepFreeze({
  swf: {
    path: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/IN/L11IN02.swf",
    bytes: 122_192,
    sha256:
      "a87ccf50c6291e27d2de4a0fac3e959ec6f426cb6e4dcd828eef08ed3dab6894",
    mode: "0444",
    nlink: 1,
  },
  fla: {
    path: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/IN/L11IN02.fla",
    bytes: 527_872,
    sha256:
      "74d31a919e7d1f139e67574b57a2490f03b0895d6833aee2cf5678258718bee3",
    mode: "0500",
    nlink: 1,
  },
  scenarioInventory: {
    path: "migrations/course-g04-l11-in-002/audit/scenario-inventory.json",
    bytes: 204_130,
    sha256:
      "d149f5e6156035d10a049a37e4c42d5eca3df9ba8280afd6ea70a6f959ddb7d0",
  },
  frameDomainDisposition: {
    path: "migrations/course-g04-l11-in-002/audit/frame-domain-disposition.json",
    bytes: 11_858,
    sha256:
      "81255977cb7a27a7b9e6b7a221520a05fabbd6bb5dca4858f2da6b8c08a0d833",
  },
  audioEvidence: {
    path: "migrations/course-g04-l11-in-002/audit/audio-runtime-evidence.json",
    bytes: 15_699,
    sha256:
      "cfb872823dc87bc82313ef3c8e3033e7f8c72c95947c0bfc8ec6a494474a2c4b",
  },
  frameDomainCandidates: {
    path:
      "migrations/course-g04-l11-in-002/audit/machine/swf-frame-domain-candidates.json",
    bytes: 2_176,
    sha256:
      "7b585043d335b808ab81baf80beeede29e2bcfba5337ead8ed4ffef78f6ff7df",
  },
  swfmillStructure: {
    path: "migrations/course-g04-l11-in-002/audit/machine/swfmill.xml.gz",
    bytes: 133_572,
    sha256:
      "e1492edaea3690bbaadb7b48d9d45622b00716b7d83166079d1b050b15197bdf",
  },
} as const);

export const COURSE_G04_L11_IN_002_STATIC_SOURCE_FACTS = deepFreeze({
  animationId: COURSE_G04_L11_IN_002_STATIC_ANIMATION_ID,
  assetId:
    "swf-a87ccf50c6291e27d2de4a0fac3e959ec6f426cb6e4dcd828eef08ed3dab6894",
  release: {
    releaseId: "lesson-g04-l11-coordinate-grid",
    ordinal: 14,
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
    childTimelineId: "sprite-80",
    sourceObjectId: 80,
    frame: 6,
    depth: 3,
    instanceName: "animation",
    translationTwips: {x: 8_026, y: 4_885},
    translationPixels: {x: 401.3, y: 244.25},
  },
  instruction: {
    definition:
      "A coordinate grid is a grid formed by two intersecting number lines, the horizontal x-axis and the vertical y-axis.",
    relation: "y = x + 4",
    points: [
      {x: 1, y: 5, orderedPair: "(1,5)"},
      {x: 2, y: 6, orderedPair: "(2,6)"},
      {x: 3, y: 7, orderedPair: "(3,7)"},
      {x: 4, y: 8, orderedPair: "(4,8)"},
    ],
    structuralObservations: [
      {frame: 1, observation: "isolated-principal-visually-empty"},
      {frame: 60, observation: "definition-terms-and-axis-arrows-revealing"},
      {frame: 120, observation: "horizontal-x-axis-language-visible"},
      {frame: 180, observation: "vertical-y-axis-language-and-grid-visible"},
      {frame: 240, observation: "point-1-5-and-projections-visible"},
      {frame: 300, observation: "all-four-points-and-projections-visible"},
      {frame: 331, observation: "grid-points-and-function-table-visible-under-direct-selection"},
    ],
  },
  principalTimeline: {
    timelineId: "sprite-80",
    frameCount: 331,
    sourceDomainDisposition: "unresolved",
    structuralReachability: "reachable-from-root-placement-graph",
    placementEntryState: "unresolved",
    localStopFrames: [],
    sourceTerminalBehaviorEstablished: false,
    directSeekLimit:
      "Direct local-frame selection does not establish natural entry, narration synchronization, glossary return, terminal hold or loop behavior, or Replay.",
  },
  otherNestedTimeline: {
    timelineId: "sprite-3",
    objectId: 3,
    frameCount: 1,
    sourceDomainDisposition: "unresolved",
  },
  glossaryControls: [
    {buttonObjectId: 9, glossaryKey: "Coordinate grid"},
    {buttonObjectId: 10, glossaryKey: "Grid"},
    {buttonObjectId: 11, glossaryKey: "Form"},
    {buttonObjectId: 12, glossaryKey: "Intersect"},
    {buttonObjectId: 13, glossaryKey: "Number line"},
    {buttonObjectId: 41, glossaryKey: "Horizontal"},
    {buttonObjectId: 42, glossaryKey: "X-axis"},
    {buttonObjectId: 43, glossaryKey: "Vertical"},
    {buttonObjectId: 44, glossaryKey: "Y-axis"},
  ],
  sourceHostCalls: [
    "_root.DoHyperLinks",
    "_root.animation_mc.animation.stop",
  ],
  audio: {
    embeddedStreamCount: 1,
    principalStream: {
      timelineId: "sprite-80",
      firstBlockFrame: 4,
      lastBlockFrame: 331,
      blockCount: 328,
      structuralDurationMs: 27_298,
      format: "mp3",
      sampleRateHz: 22_050,
      channels: 1,
    },
    externalSpanish: {
      path: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/SA/L11IN02.mp3",
      bytes: 547_680,
      sha256:
        "94308a860d2d29abe19ea12e7490ffc3cb54931c5ca68bafee81984c9f402c02",
      structuralDurationMs: 39_120,
      hostRouteLanguage: "es",
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
