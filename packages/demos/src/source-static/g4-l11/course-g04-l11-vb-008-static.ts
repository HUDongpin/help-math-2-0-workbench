/**
 * Acceptance-neutral source-static facts for G4 L11 VB008.
 *
 * This module does not execute AVM1, play audio, register a renderer, or
 * establish natural reachability, fidelity, review, completion, or release.
 */

export const COURSE_G04_L11_VB_008_STATIC_ANIMATION_ID =
  "course-g04-l11-vb-008" as const;

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

export const COURSE_G04_L11_VB_008_STATIC_EVIDENCE = deepFreeze({
  swf: {
    path: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/VB/L11VB08.swf",
    bytes: 42_929,
    sha256:
      "59dc96842caf162d103f3d2f0fcc14981eeaacb251b5757c4a0e5f39a56768c1",
    mode: "0500",
    nlink: 1,
  },
  fla: {
    path: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/VB/L11VB08.fla",
    bytes: 232_448,
    sha256:
      "c57a70d1a1a12c5795e79b210f30420955cc653cc2d6961bc7a52e98eddc3eb0",
    mode: "0500",
    nlink: 1,
  },
  scenarioInventory: {
    path: "migrations/course-g04-l11-vb-008/audit/scenario-inventory.json",
    bytes: 142_229,
    sha256:
      "3b68be4c4df8afbabad2ecef79776c63200ac431efdd846e7570e40b532f6d0c",
  },
  frameDomainDisposition: {
    path: "migrations/course-g04-l11-vb-008/audit/frame-domain-disposition.json",
    bytes: 11_380,
    sha256:
      "db03728e89646b0c204f9ef09e10f95fce157f5d808ff122601be5547c9cbf46",
  },
  audioEvidence: {
    path: "migrations/course-g04-l11-vb-008/audit/audio-runtime-evidence.json",
    bytes: 9_827,
    sha256:
      "25586b62aed18f4f298298475f4884ad91ea962e4f5212c1048ae866b75781ff",
  },
  frameDomainCandidates: {
    path:
      "migrations/course-g04-l11-vb-008/audit/machine/swf-frame-domain-candidates.json",
    bytes: 2_175,
    sha256:
      "1e5ff756704a1512058b83aab803637a921ac4c852b9092dc15d1f5d9e124a39",
  },
  swfmillStructure: {
    path: "migrations/course-g04-l11-vb-008/audit/machine/swfmill.xml.gz",
    bytes: 51_687,
    sha256:
      "1c18178d09dd7f5c62cb5235f2b728e2aa332dad5203d7fdb241dd90559e33af",
  },
} as const);

export const COURSE_G04_L11_VB_008_STATIC_SOURCE_FACTS = deepFreeze({
  animationId: COURSE_G04_L11_VB_008_STATIC_ANIMATION_ID,
  assetId:
    "swf-59dc96842caf162d103f3d2f0fcc14981eeaacb251b5757c4a0e5f39a56768c1",
  release: {
    releaseId: "lesson-g04-l11-coordinate-grid",
    ordinal: 11,
    releaseMemberCount: 44,
    activePageCount: 43,
    role: "active-xml-referenced-page",
    title: {en: "Plot", es: "Representación gráfica"},
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
    childTimelineId: "sprite-41",
    sourceObjectId: 41,
    frame: 6,
    depth: 4,
    instanceName: "animation",
    translationTwips: {x: 8_026, y: 4_885},
    translationPixels: {x: 401.3, y: 244.25},
  },
  instruction: {
    definition:
      "Plot means to locate points on a coordinate grid using ordered pairs or coordinates.",
    plottedPoint: {x: 1, y: 2, label: "(1,2)"},
    orderedConstruction: [
      {axis: "x", direction: "right", units: 1},
      {axis: "y", direction: "up", units: 2},
    ],
    structuralObservations: [
      {frame: 1, observation: "isolated-principal-visually-empty"},
      {frame: 20, observation: "definition-reveal-in-progress"},
      {frame: 40, observation: "horizontal-x-path-reaches-one"},
      {frame: 60, observation: "vertical-y-path-rises-toward-two"},
      {frame: 80, observation: "point-and-label-one-two-visible"},
      {frame: 95, observation: "complete-definition-and-terminal-stop"},
    ],
  },
  principalTimeline: {
    timelineId: "sprite-41",
    frameCount: 95,
    sourceDomainDisposition: "unresolved",
    structuralReachability: "reachable-from-root-placement-graph",
    placementEntryState: "unresolved",
    localStops: [95],
    directSeekLimit:
      "Direct local-frame selection does not establish natural entry, narration synchronization, glossary return, terminal host state, or Replay.",
  },
  otherNestedTimeline: {
    timelineId: "sprite-5",
    objectId: 5,
    frameCount: 1,
    rootPlacementName: "Mc_Page_Title",
    sourceDomainDisposition: "unresolved",
  },
  glossaryControls: [
    {buttonObjectId: 10, term: "Plot"},
    {buttonObjectId: 11, term: "Locate"},
    {buttonObjectId: 12, term: "Point"},
    {buttonObjectId: 13, term: "Coordinate grid"},
    {buttonObjectId: 14, term: "Ordered pair"},
    {buttonObjectId: 40, term: "Coordinate"},
  ],
  sourceHostCalls: [
    "_root.DoHyperLinks",
    "_root.animation_mc.animation.stop",
  ],
  audio: {
    embeddedStreamCount: 1,
    principalStream: {
      timelineId: "sprite-41",
      blockCount: 92,
      structuralDurationMs: 7_654,
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
    animationInternalReplayRequired: true,
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
