/** Acceptance-neutral source-static facts for G4 L11 IN012. */

export const COURSE_G04_L11_IN_012_STATIC_ANIMATION_ID =
  "course-g04-l11-in-012" as const;

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

export const COURSE_G04_L11_IN_012_STATIC_EVIDENCE = deepFreeze({
  swf: {
    path: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/IN/L11IN12.swf",
    bytes: 176_194,
    sha256: "8c77afe6a63ff8254be0307f90b3e3f15dd9d1243fc370550af8c5049a341cb2",
    mode: "0444", nlink: 1,
  },
  pairedFla: {status: "missing"},
  externalSpanishAudio: {
    path: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/SA/L11IN12.mp3",
    bytes: 320_208,
    sha256: "4e152e75d4c5eb99bd29b20729c57b53c6f40bd946f33e3fe7bbb3ff914a619f",
    mode: "0444", nlink: 1,
  },
  scenarioInventory: {
    path: "migrations/course-g04-l11-in-012/audit/scenario-inventory.json",
    bytes: 102_000,
    sha256: "57e4d087b7956383a9f66bb4609e2472858ee668cb6e63916f755f87ec7ce305",
  },
  frameDomainDisposition: {
    path: "migrations/course-g04-l11-in-012/audit/frame-domain-disposition.json",
    bytes: 11_858,
    sha256: "655f13924d26c89da58ba1ed814089d4d44a7225f81164fbdaa33c4ee10d112a",
  },
  audioEvidence: {
    path: "migrations/course-g04-l11-in-012/audit/audio-runtime-evidence.json",
    bytes: 15_478,
    sha256: "3b7c98e6dc55bf966a0555b64bf89e793f3f1f366f5754523fd0c5b5e1913584",
  },
  frameDomainCandidates: {
    path: "migrations/course-g04-l11-in-012/audit/machine/swf-frame-domain-candidates.json",
    bytes: 2_176,
    sha256: "22dce94dea058a72cdabe8dd244d7ec99ee44e7ce9e861eba5c63c5c5251452b",
  },
  swfmillStructure: {
    path: "migrations/course-g04-l11-in-012/audit/machine/swfmill.xml.gz",
    bytes: 185_372,
    sha256: "b06a38f6e9688734a40bd32f40bec7a2e8f7dac3aae1926d989a024f696627d0",
  },
} as const);

export const COURSE_G04_L11_IN_012_STATIC_SOURCE_FACTS = deepFreeze({
  animationId: COURSE_G04_L11_IN_012_STATIC_ANIMATION_ID,
  assetId: "swf-8c77afe6a63ff8254be0307f90b3e3f15dd9d1243fc370550af8c5049a341cb2",
  release: {releaseId: "lesson-g04-l11-coordinate-grid", ordinal: 24,
    releaseMemberCount: 44, activePageCount: 43,
    role: "active-xml-referenced-page",
    title: {en: "Find the Length of Line Segments",
      es: "Determinar la longitud de segmentos de línea"}},
  runtimeHeader: {signature: "CWS", swfVersion: 6,
    actionScriptVersion: "AS1/2", stage: {width: 800, height: 600,
      backgroundColor: "#b8d8f7"}, fps: 12, rootFrameCount: 10},
  rootPlacement: {parentTimelineId: "root", childTimelineId: "sprite-68",
    sourceObjectId: 68, frame: 6, depth: 3, instanceName: "animation",
    translationTwips: {x: 8_268, y: 5_666},
    translationPixels: {x: 413.4, y: 283.3}},
  instruction: {
    definition: "A line segment is part of a line between two points.",
    orientation: "vertical",
    endpoints: [{x: 3, y: 1, orderedPair: "(3,1)"},
      {x: 3, y: 9, orderedPair: "(3,9)"}],
    sharedX: 3, subtraction: "9 − 1 = 8", conclusion: "length = 8 units",
    structuralObservations: [
      {frame: 1, observation: "principal-display-initially-empty"},
      {frame: 40, observation: "coordinate-grid-visible"},
      {frame: 120, observation: "definition-and-grid-visible"},
      {frame: 240, observation: "vertical-segment-construction-visible"},
      {frame: 280, observation: "coordinate-emphasis-active"},
      {frame: 360, observation: "subtraction-revealing"},
      {frame: 400, observation: "subtraction-and-conclusion-visible"},
      {frame: 440, observation: "complete-structural-final-frame"},
    ],
  },
  principalTimeline: {timelineId: "sprite-68", frameCount: 440,
    sourceDomainDisposition: "unresolved",
    structuralReachability: "reachable-from-root-placement-graph",
    placementEntryState: "unresolved", localStopFrames: [],
    sourceTerminalBehaviorEstablished: false,
    directSeekLimit: "Direct frame selection does not establish natural entry, narration synchronization, glossary return, terminal behavior, or Replay."},
  otherNestedTimeline: {timelineId: "sprite-3", objectId: 3, frameCount: 1,
    sourceDomainDisposition: "unresolved"},
  glossaryControls: [
    {buttonObjectId: 66, glossaryKey: "Length"},
    {buttonObjectId: 67, glossaryKey: "Unit"},
  ],
  sourceHostCalls: ["_level0.InternalPreloader.gotoAndPlay",
    "_root.DoHyperLinks", "_root.animation_mc.animation.stop"],
  audio: {embeddedStreamCount: 1,
    principalStream: {timelineId: "sprite-68", firstBlockFrame: 8,
      lastBlockFrame: 440, blockCount: 433, structuralDurationMs: 36_049,
      format: "mp3", sampleRateHz: 22_050, channels: 1},
    externalSpanish: {durationMs: 22_872, sampleRateHz: 48_000, channels: 1},
    embeddedAudibleContentAccepted: false, externalSpanishAccepted: false,
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
