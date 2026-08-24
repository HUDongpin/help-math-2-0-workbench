/** Acceptance-neutral source-static facts for G4 L11 GS002. */

export const COURSE_G04_L11_GS_002_STATIC_ANIMATION_ID =
  "course-g04-l11-gs-002" as const;

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

export const COURSE_G04_L11_GS_002_LEVELS = deepFreeze([
  {id: "level-1", label: "Level 1", sourceInstanceName: "mcL1",
    sourceObjectId: 124, level: 1},
  {id: "level-2", label: "Level 2", sourceInstanceName: "mcL2",
    sourceObjectId: 128, level: 2},
] as const);

export const COURSE_G04_L11_GS_002_CONTROLS = deepFreeze([
  {id: "skip-directions", label: "Skip Directions", sourceInstanceName: "mcSkip",
    sourceObjectId: 117, function: "move-to-select-level"},
  {id: "repeat-directions", label: "Repeat Directions", sourceInstanceName: "mcRepeat",
    sourceObjectId: 223, function: "open-directions-popup"},
  {id: "level-1", label: "Level 1", sourceInstanceName: "mcL1",
    sourceObjectId: 124, function: "select-level-1"},
  {id: "level-2", label: "Level 2", sourceInstanceName: "mcL2",
    sourceObjectId: 128, function: "select-level-2"},
  {id: "start", label: "Start", sourceInstanceName: "mcStart",
    sourceObjectId: 134, function: "request-l11gs03-handoff"},
  {id: "close", label: "Close", sourceInstanceName: "BtnClose",
    sourceObjectId: 93, function: "close-directions-popup"},
  {id: "pair-glossary", label: "pair", sourceInstanceName: null,
    sourceObjectId: 99, function: "open-pair-glossary"},
] as const);

export const COURSE_G04_L11_GS_002_DIRECTIONS = deepFreeze({
  summary: "Find the matching pairs and correct answers will reveal a picture and music.",
  interaction:
    "Click one box then find the next box that matches and click it.",
  scoreRule:
    "For each correct match you get 10 points added to your score. For each incorrect match 2 points are subtracted from your score.",
  launch:
    "When you are ready to play, choose a level and then click Start to begin the Coordinate Grid Match Game.",
  repeat:
    "If you want to see the directions again after the game has started, click Repeat Directions.",
} as const);

export const COURSE_G04_L11_GS_002_STATIC_EVIDENCE = deepFreeze({
  swf: {path:
      "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/GS/L11GS02.swf",
    bytes: 253_569,
    sha256: "1ab04fa783eed441afdf386261bd6816e9084082db3b5cfce8fc63360f9167fd",
    mode: "0500", nlink: 1},
  pairedFla: {path:
      "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/GS/L11GS02.fla",
    status: "missing"},
  delegatedGameSwf: {path:
      "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/GS/L11GS03.swf",
    bytes: 891_569,
    sha256: "3dea7d98fe2cf38b880232743832dbd1b6a9219c1dca16f518045d76f18d7b3a",
    mode: "0500", nlink: 1, status: "separate-release-member"},
  scenarioInventory: {path:
      "migrations/course-g04-l11-gs-002/audit/scenario-inventory.json",
    bytes: 689_783,
    sha256: "4c6fcce15488d20b1b9088d8a1b6094636d446b4441ad43e41249f798b5d8d94"},
  frameDomainDisposition: {path:
      "migrations/course-g04-l11-gs-002/audit/frame-domain-disposition.json",
    bytes: 35_858,
    sha256: "b101dc59984c94c25f076fe5c5707a56eb36ce73f1307fb3a0acedbfd9f9b4d4"},
  audioEvidence: {path:
      "migrations/course-g04-l11-gs-002/audit/audio-runtime-evidence.json",
    bytes: 10_732,
    sha256: "3303709f5cde5069caa756e88343ca4b18e570200f094897a10e35469a549746"},
  frameDomainCandidates: {path:
      "migrations/course-g04-l11-gs-002/audit/machine/swf-frame-domain-candidates.json",
    bytes: 25_778,
    sha256: "7ba8780a3610e98ba778194aac86decc94802f569bfa656effd2ab1298608b2b"},
  swfmillStructure: {path:
      "migrations/course-g04-l11-gs-002/audit/machine/swfmill.xml.gz",
    bytes: 282_375,
    sha256: "ffc9f08d4fa70b138c47ab2338aaaf3f02711ab75f198ad716bac9da5aa26d2a"},
} as const);

export const COURSE_G04_L11_GS_002_STATIC_SOURCE_FACTS = deepFreeze({
  animationId: COURSE_G04_L11_GS_002_STATIC_ANIMATION_ID,
  assetId: "swf-1ab04fa783eed441afdf386261bd6816e9084082db3b5cfce8fc63360f9167fd",
  release: {releaseId: "lesson-g04-l11-coordinate-grid", ordinal: 32,
    releaseMemberCount: 44, activePageCount: 43,
    role: "active-xml-referenced-page", title: {en: "Game 1", es: null}},
  runtimeHeader: {signature: "CWS", swfVersion: 6,
    actionScriptVersion: "AS1/2", stage: {width: 800, height: 600,
      nativeWidth: 800, nativeHeight: 600, backgroundColor: "#b8d8f7"},
    fps: 12, rootFrameCount: 10},
  rootPlacement: {parentTimelineId: "root", childTimelineId: "sprite-227",
    sourceObjectId: 227, frame: 6, depth: 3, instanceName: "animation",
    translationTwips: {x: 8_248, y: 5_666},
    translationPixels: {x: 412.4, y: 283.3}},
  activity: {heading: "Coordinate Grid: Play It",
    directions: COURSE_G04_L11_GS_002_DIRECTIONS,
    levels: COURSE_G04_L11_GS_002_LEVELS,
    controls: COURSE_G04_L11_GS_002_CONTROLS,
    scoreRule: {correctDelta: 10, incorrectDelta: -2},
    candidatePairs: ["A ↔ (3,4)", "B ↔ (4,3)", "C ↔ (5,8)",
      "D ↔ (8,6)", "E ↔ (6,1)", "F ↔ (1,7)"],
    candidatePairsAccepted: false},
  principalTimeline: {timelineId: "sprite-227", frameCount: 729,
    repeatDirectionsLabelFrame: 4, selectLevelStopFrame: 728,
    terminalStructuralFrame: 729, modernDirectionsBackgroundFrame: 727,
    sourceDomainDisposition: "unresolved",
    structuralReachability: "reachable-from-root-placement-graph",
    placementEntryState: "unresolved",
    directSeekLimit:
      "Direct frame selection does not execute Skip, Repeat, level selection, Start, Close, glossary, host handoff, audio synchronization, or Replay."},
  reachableNestedTimelineCount: 11,
  dependency: {observedHostFunction: "doNeedMoreHelp",
    observedTargetBasename: "L11GS03", targetAnimationId: "course-g04-l11-gs-003",
    targetReleaseOrdinal: 33, observedArgumentCounts: [2, 3],
    hostSemanticsEstablished: false, delegatedGameImplementedHere: false},
  audio: {embeddedStreamCount: 2,
    streams: [{timelineId: "sprite-92", frameCount: 5, blockCount: 5,
      structuralDurationMs: 392},
    {timelineId: "sprite-227", frameCount: 729, blockCount: 646,
      structuralDurationMs: 53_734}], format: "mp3", sampleRateHz: 22_050,
    channels: 1, audibleContentAccepted: false,
    synchronizationAccepted: false, externalSpanishAudioAccepted: false},
  productBoundary: {modernLessonShellUsed: true,
    legacyCourseShellNavigationAndPlayerChromeIncluded: false,
    legacyPreloaderIncluded: false, duplicateOldAndModernControlsIncluded: false,
    directionsAndLaunchControlsRequired: 6, pairGlossaryControlRequired: 1,
    animationInternalPedagogicalControlCount: 7,
    modernReplayProvided: true, delegatedGameRemainsSeparateMember: true},
  authorityBoundary: {sourceStaticOnly: true, rendererRegistered: false,
    currentJavascriptRegistered: false, sourceDomainDeclared: false,
    originalRuntimeAccepted: false, audioAccepted: false,
    bilingualParityEstablished: false, behaviorParityEstablished: false,
    visualFidelityEstablished: false, humanReviewAccepted: false,
    ownerAccepted: false, strictCompletion: false, lessonRelease: false,
    publication: false}, acceptanceEffect: "none",
} as const);
