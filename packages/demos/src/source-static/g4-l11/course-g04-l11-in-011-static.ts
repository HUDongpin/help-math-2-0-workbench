/** Acceptance-neutral source-static facts for G4 L11 IN011. */

export const COURSE_G04_L11_IN_011_STATIC_ANIMATION_ID =
  "course-g04-l11-in-011" as const;

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

export const COURSE_G04_L11_IN_011_STATIC_EVIDENCE = deepFreeze({
  swf: {
    path: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/IN/L11IN11.swf",
    bytes: 333_535,
    sha256: "94d7cb372e19e6f641eb5e51633e86b57ceb818b5a7a148fe02925e141252364",
    mode: "0500", nlink: 1,
  },
  pairedFla: {status: "missing"},
  externalSpanishAudio: {status: "missing"},
  scenarioInventory: {
    path: "migrations/course-g04-l11-in-011/audit/scenario-inventory.json",
    bytes: 140_189,
    sha256: "9edd88f067d74286c363c9db26be51f2e681bf28a4a74487abc53e22cc46cd68",
  },
  frameDomainDisposition: {
    path: "migrations/course-g04-l11-in-011/audit/frame-domain-disposition.json",
    bytes: 11_858,
    sha256: "d6072dc42acf4d63b0b7f86d97bd14720f673457c5b9f4803b7e3caf692b02cc",
  },
  audioEvidence: {
    path: "migrations/course-g04-l11-in-011/audit/audio-runtime-evidence.json",
    bytes: 9_912,
    sha256: "c0025fe484cabe9da1a2bbc9ee3987cdc145159fd7666158bd1c7517116dbcde",
  },
  frameDomainCandidates: {
    path: "migrations/course-g04-l11-in-011/audit/machine/swf-frame-domain-candidates.json",
    bytes: 2_176,
    sha256: "17c49c4ee359a30f02c55cd87f84d77da143d337886b8b98c7e92daed20c64f0",
  },
  swfmillStructure: {
    path: "migrations/course-g04-l11-in-011/audit/machine/swfmill.xml.gz",
    bytes: 345_745,
    sha256: "476aff0e95d86a5a075ba7cbd8096dd433639e56e51c19b9c5a5d9627d5cb6c4",
  },
} as const);

export const COURSE_G04_L11_IN_011_STATIC_SOURCE_FACTS = deepFreeze({
  animationId: COURSE_G04_L11_IN_011_STATIC_ANIMATION_ID,
  assetId: "swf-94d7cb372e19e6f641eb5e51633e86b57ceb818b5a7a148fe02925e141252364",
  release: {releaseId: "lesson-g04-l11-coordinate-grid", ordinal: 23,
    releaseMemberCount: 44, activePageCount: 43,
    role: "active-xml-referenced-page",
    title: {en: "Find the Length of Line Segments",
      es: "Determinar la longitud de segmentos de línea"}},
  runtimeHeader: {signature: "CWS", swfVersion: 6,
    actionScriptVersion: "AS1/2", stage: {width: 800, height: 600,
      backgroundColor: "#b8d8f7"}, fps: 12, rootFrameCount: 10},
  rootPlacement: {parentTimelineId: "root", childTimelineId: "sprite-57",
    sourceObjectId: 57, frame: 6, depth: 3, instanceName: "animation",
    translationTwips: {x: 8_268, y: 5_666},
    translationPixels: {x: 413.4, y: 283.3}},
  instruction: {
    definition: "A line segment is part of a line between two points.",
    endpoints: [{x: 2, y: 4, orderedPair: "(2,4)"},
      {x: 8, y: 4, orderedPair: "(8,4)"}],
    sharedY: 4, subtraction: "8 − 2 = 6", conclusion: "length = 6 units",
    structuralObservations: [
      {frame: 1, observation: "principal-display-initially-empty"},
      {frame: 50, observation: "coordinate-grid-visible"},
      {frame: 100, observation: "definition-begins-revealing"},
      {frame: 150, observation: "definition-and-grid-visible"},
      {frame: 200, observation: "first-endpoint-2-4-visible"},
      {frame: 250, observation: "second-endpoint-and-segment-visible"},
      {frame: 450, observation: "coordinate-emphasis-active"},
      {frame: 700, observation: "subtraction-begins-revealing"},
      {frame: 750, observation: "subtraction-and-conclusion-visible"},
      {frame: 835, observation: "complete-structural-final-frame"},
    ],
  },
  principalTimeline: {timelineId: "sprite-57", frameCount: 835,
    sourceDomainDisposition: "unresolved",
    structuralReachability: "reachable-from-root-placement-graph",
    placementEntryState: "unresolved", localStopFrames: [],
    sourceTerminalBehaviorEstablished: false,
    directSeekLimit: "Direct frame selection does not establish natural entry, narration synchronization, glossary return, terminal behavior, or Replay."},
  otherNestedTimeline: {timelineId: "sprite-3", objectId: 3, frameCount: 1,
    sourceDomainDisposition: "unresolved"},
  glossaryControls: [
    {buttonObjectId: 24, glossaryKey: "Line segment"},
    {buttonObjectId: 25, glossaryKey: "Line"},
    {buttonObjectId: 26, glossaryKey: "Point"},
    {buttonObjectId: 55, glossaryKey: "Length"},
    {buttonObjectId: 56, glossaryKey: "Unit"},
  ],
  sourceHostCalls: ["_level0.InternalPreloader.gotoAndPlay",
    "_root.DoHyperLinks", "_root.animation_mc.animation.stop"],
  audio: {embeddedStreamCount: 1,
    principalStream: {timelineId: "sprite-57", firstBlockFrame: 1,
      lastBlockFrame: 835, blockCount: 835, structuralDurationMs: 69_538,
      format: "mp3", sampleRateHz: 22_050, channels: 1},
    externalSpanishStatus: "missing", audibleContentAccepted: false,
    synchronizationAccepted: false},
  productBoundary: {modernLessonShellUsed: true,
    legacyCourseShellNavigationAndPlayerChromeIncluded: false,
    animationInternalGlossaryControlsRequired: true,
    modernLocalPlaybackControlsProvided: true,
    sourceReplayBehaviorEstablished: false},
  authorityBoundary: {sourceStaticOnly: true, rendererRegistered: false,
    currentJavascriptRegistered: false, sourceDomainDeclared: false,
    originalRuntimeAccepted: false, audioAccepted: false,
    bilingualParityEstablished: false, behaviorParityEstablished: false,
    visualFidelityEstablished: false, humanReviewAccepted: false,
    ownerAccepted: false, strictCompletion: false, lessonRelease: false,
    publication: false}, acceptanceEffect: "none",
} as const);
