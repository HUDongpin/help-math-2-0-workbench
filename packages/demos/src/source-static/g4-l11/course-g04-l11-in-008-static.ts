/** Acceptance-neutral source-static facts for G4 L11 IN008. */

export const COURSE_G04_L11_IN_008_STATIC_ANIMATION_ID =
  "course-g04-l11-in-008" as const;

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

export const COURSE_G04_L11_IN_008_POINTS = deepFreeze([
  {x: 1, y: 2, orderedPair: "(1,2)"},
  {x: 2, y: 3, orderedPair: "(2,3)"},
  {x: 3, y: 4, orderedPair: "(3,4)"},
  {x: 4, y: 5, orderedPair: "(4,5)"},
  {x: 5, y: 6, orderedPair: "(5,6)"},
  {x: 6, y: 7, orderedPair: "(6,7)"},
  {x: 7, y: 8, orderedPair: "(7,8)"},
  {x: 8, y: 9, orderedPair: "(8,9)"},
  {x: 9, y: 10, orderedPair: "(9,10)"},
] as const);

export const COURSE_G04_L11_IN_008_SOURCE_TABLE_ROWS =
  deepFreeze(COURSE_G04_L11_IN_008_POINTS.slice(0, 7));

export const COURSE_G04_L11_IN_008_STATIC_EVIDENCE = deepFreeze({
  swf: {
    path: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/IN/L11IN08.swf",
    bytes: 580_167,
    sha256: "0b52735b2a6dcd67beb85f3cf9ca99d660cb92d7c27a3f280d664a51cf24c74a",
    mode: "0500", nlink: 1,
  },
  fla: null,
  scenarioInventory: {path: "migrations/course-g04-l11-in-008/audit/scenario-inventory.json",
    bytes: 87_291,
    sha256: "91a205fdbf139ef7f58216cf38b8b09cb6381fbedf6f0a740c399e080c4f814b"},
  frameDomainDisposition: {
    path: "migrations/course-g04-l11-in-008/audit/frame-domain-disposition.json",
    bytes: 11_869,
    sha256: "cd46c73f853e333a9a822265891af745b721d1af335f4f265a79fefb6eb7f9ad"},
  audioEvidence: {path: "migrations/course-g04-l11-in-008/audit/audio-runtime-evidence.json",
    bytes: 9_891,
    sha256: "5a8c8922b5ae1c5ca6c1eb0c08a9a843de853a9be976e034eec9304367f3784f"},
  frameDomainCandidates: {
    path: "migrations/course-g04-l11-in-008/audit/machine/swf-frame-domain-candidates.json",
    bytes: 2_180,
    sha256: "375218f5a98650da10ee25cccb76485dc49520319cc5ac5c9ad9058155150e89"},
  swfmillStructure: {path: "migrations/course-g04-l11-in-008/audit/machine/swfmill.xml.gz",
    bytes: 595_091,
    sha256: "a976f6316920ab595ef11fcc54d0df3de515b1468890bd7a44155204283d063b"},
  generatedCanvasManifest: {bytes: 13_081,
    sha256: "47461cec4c873aa95fc3ac47b454f6e2a9cd69ce3f3a98c1126f619ae52dbaaf"},
} as const);

export const COURSE_G04_L11_IN_008_STATIC_SOURCE_FACTS = deepFreeze({
  animationId: COURSE_G04_L11_IN_008_STATIC_ANIMATION_ID,
  assetId: "swf-0b52735b2a6dcd67beb85f3cf9ca99d660cb92d7c27a3f280d664a51cf24c74a",
  release: {releaseId: "lesson-g04-l11-coordinate-grid", ordinal: 20,
    releaseMemberCount: 44, activePageCount: 43,
    role: "active-xml-referenced-page"},
  runtimeHeader: {signature: "CWS", swfVersion: 6,
    actionScriptVersion: "AS1/2",
    stage: {width: 800, height: 600, backgroundColor: "#b8d8f7"},
    fps: 12, rootFrameCount: 10},
  rootPlacement: {parentTimelineId: "root", childTimelineId: "sprite-129",
    sourceObjectId: 129, frame: 6, depth: 3, instanceName: "animation",
    translationTwips: {x: 8_268, y: 5_666},
    translationPixels: {x: 413.4, y: 283.3}},
  principalTimeline: {timelineId: "sprite-129", frameCount: 1_478,
    sourceDomainDisposition: "unresolved",
    structuralReachability: "reachable-from-root-placement-graph",
    placementEntryState: "unresolved", sourceTerminalBehaviorEstablished: false,
    finalSourceVisualFirstFrame: 1_447, finalSourceVisualLastFrame: 1_478},
  structuralObservations: [
    {frame: 1, observation: "empty-coordinate-grid"},
    {frame: 50, observation: "points-one-two-through-five-six-visible"},
    {frame: 100, observation: "connecting-line-in-progress"},
    {frame: 200, observation: "first-five-points-and-line-visible"},
    {frame: 500, observation: "right-side-table-scaffold-visible"},
    {frame: 600, observation: "x-y-table-headers-and-initial-rows-visible"},
    {frame: 1_000, observation: "table-one-two-through-five-six-visible"},
    {frame: 1_100, observation: "equation-x-plus-one-equals-y-visible"},
    {frame: 1_200, observation: "point-six-seven-and-table-row-visible"},
    {frame: 1_400, observation: "point-seven-eight-and-table-row-visible"},
    {frame: 1_478, observation: "points-through-nine-ten-and-table-through-seven-eight-visible"},
  ],
  relationship: {sourceEquation: "x + 1 = y", equivalentRule: "y = x + 1",
    plottedPoints: COURSE_G04_L11_IN_008_POINTS,
    sourceTableRows: COURSE_G04_L11_IN_008_SOURCE_TABLE_ROWS},
  ffdecFreshExport: {tool: "JPEXS Free Flash Decompiler v.26.2.1",
    helperBytes: 52_872,
    helperSha256: "78256220d01fba044341283703c3923a1ff8ff29499c51f65ab4e6ac825ccb93",
    framesHtmlBytes: 7_645_995,
    framesHtmlSha256: "689c57e69c8971839ba0150c228cbe9b80c0ade1d3fbf9620e738f736be22be7",
    exportCanvas: {width: 646, height: 302},
    internalTranslation: {x: 331.4, y: 112.25},
    placedFunctionCount: 123,
    placedFunctionsSha256: "61abb9360f6ff44a3c0551c3ea5ae6b2e1fe0d9e681708f888783a445489e1f8",
    embeddedImageCount: 0, fontFunctionCount: 2},
  audio: {embeddedStreamCount: 1, timelineId: "sprite-129",
    firstBlockFrame: 5, lastBlockFrame: 1_478, blockCount: 1_474,
    structuralDurationMs: 122_776, sampleRateHz: 22_050, channels: 1,
    enabled: false, audibleContentAccepted: false, synchronizationAccepted: false},
  sourceInteraction: {animationInternalPedagogicalControlCount: 0,
    sourceAuthoredBranches: 0, sourceReplayHandlerPresent: false},
  productBoundary: {modernLessonShellUsed: true,
    legacyCourseShellNavigationAndPlayerChromeIncluded: false,
    modernLessonPlaybackControlsPermitted: true,
    animationInternalPedagogicalControlsRequired: false},
  authorityBoundary: {registeredCurrentJavascript: false,
    sourceDomainDeclared: false, originalRuntimeAccepted: false,
    audioAccepted: false, bilingualParityEstablished: false,
    behaviorParityEstablished: false, visualFidelityEstablished: false,
    humanReviewAccepted: false, ownerAccepted: false,
    strictCompletion: false, lessonRelease: false, publication: false},
  acceptanceEffect: "none",
} as const);
