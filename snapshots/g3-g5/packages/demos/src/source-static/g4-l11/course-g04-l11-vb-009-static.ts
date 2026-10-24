/**
 * Acceptance-neutral source-static facts for G4 L11 VB009.
 *
 * This module does not execute AVM1, play audio, register a renderer, or
 * establish natural reachability, fidelity, review, completion, or release.
 */

export const COURSE_G04_L11_VB_009_STATIC_ANIMATION_ID =
  "course-g04-l11-vb-009" as const;

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

export const COURSE_G04_L11_VB_009_STATIC_EVIDENCE = deepFreeze({
  swf: {
    path: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/VB/L11VB09.swf",
    bytes: 91_516,
    sha256:
      "ef1b1c902cf362b5a75455033fb49d5ad04afa910c6d5612f851a54099677a7e",
    mode: "0500",
    nlink: 1,
  },
  fla: {
    path: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/VB/L11VB09.fla",
    bytes: 476_672,
    sha256:
      "71a0318c37399672580a69d40527e17800ab3c0453588aff36b50621955fe500",
    mode: "0500",
    nlink: 1,
  },
  scenarioInventory: {
    path: "migrations/course-g04-l11-vb-009/audit/scenario-inventory.json",
    bytes: 133_557,
    sha256:
      "9cade6f95cc4263645bc290d95cdfd228442ee54d571ae791da46321f0f94773",
  },
  frameDomainDisposition: {
    path: "migrations/course-g04-l11-vb-009/audit/frame-domain-disposition.json",
    bytes: 11_860,
    sha256:
      "df31bca2ca83e29d0249cabb5c1b8f53ffe17fd05560c9d1aad729900782b74e",
  },
  audioEvidence: {
    path: "migrations/course-g04-l11-vb-009/audit/audio-runtime-evidence.json",
    bytes: 9_815,
    sha256:
      "57c966ecdfcb89fa39a1c6c44fc9f10e13a0621cfbcac7b0d0a16abcf9d0f3d7",
  },
  frameDomainCandidates: {
    path:
      "migrations/course-g04-l11-vb-009/audit/machine/swf-frame-domain-candidates.json",
    bytes: 2_176,
    sha256:
      "69165e93df4bc2f9a66a0babdb7e31934626d221823563a61a29b39d2bead27c",
  },
  swfmillStructure: {
    path: "migrations/course-g04-l11-vb-009/audit/machine/swfmill.xml.gz",
    bytes: 101_539,
    sha256:
      "5cff16cfa55f95ba736fb06190e4104db5706704e4ba76e2ee45dd6d16a2fe65",
  },
} as const);

export const COURSE_G04_L11_VB_009_STATIC_SOURCE_FACTS = deepFreeze({
  animationId: COURSE_G04_L11_VB_009_STATIC_ANIMATION_ID,
  assetId:
    "swf-ef1b1c902cf362b5a75455033fb49d5ad04afa910c6d5612f851a54099677a7e",
  release: {
    releaseId: "lesson-g04-l11-coordinate-grid",
    ordinal: 12,
    releaseMemberCount: 44,
    activePageCount: 43,
    role: "active-xml-referenced-page",
    title: {en: "Point", es: "Punto"},
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
    childTimelineId: "sprite-60",
    sourceObjectId: 60,
    frame: 6,
    depth: 4,
    instanceName: "animation",
    translationTwips: {x: 8_026, y: 4_885},
    translationPixels: {x: 401.3, y: 244.25},
  },
  instruction: {
    definition:
      "A point is an exact location on a coordinate grid, named by an ordered pair.",
    point: {name: "Point A", x: 4, y: 3, orderedPair: "(4,3)"},
    projectionOrder: [
      {axis: "x", direction: "right", units: 4},
      {axis: "y", direction: "up", units: 3},
    ],
    structuralObservations: [
      {frame: 1, observation: "isolated-principal-visually-empty"},
      {frame: 40, observation: "partial-definition-and-grid-visible"},
      {frame: 80, observation: "definition-reveal-and-point-at-four-three-visible"},
      {frame: 120, observation: "full-definition-and-point-a-callout-visible"},
      {frame: 160, observation: "horizontal-axis-projection-in-progress"},
      {frame: 200, observation: "vertical-axis-projection-in-progress"},
      {frame: 217, observation: "both-projections-complete-and-terminal-stop"},
    ],
  },
  principalTimeline: {
    timelineId: "sprite-60",
    frameCount: 217,
    sourceDomainDisposition: "unresolved",
    structuralReachability: "reachable-from-root-placement-graph",
    placementEntryState: "unresolved",
    localStops: [217],
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
    {buttonObjectId: 11, term: "Point"},
    {buttonObjectId: 12, term: "Location"},
    {buttonObjectId: 13, term: "Coordinate grid"},
    {buttonObjectId: 9, term: "Ordered pair"},
  ],
  sourceHostCalls: [
    "_root.DoHyperLinks",
    "_root.animation_mc.animation.stop",
  ],
  audio: {
    embeddedStreamCount: 1,
    principalStream: {
      timelineId: "sprite-60",
      blockCount: 214,
      structuralDurationMs: 17_816,
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
