/** Acceptance-neutral source-static facts for G4 L11 TI003. */

export const COURSE_G04_L11_TI_003_STATIC_ANIMATION_ID =
  "course-g04-l11-ti-003" as const;

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

export const COURSE_G04_L11_TI_003_INITIAL_COORDINATE_POOL = deepFreeze([
  {id: "2-1", x: 2, y: 1}, {id: "1-6", x: 1, y: 6},
  {id: "5-10", x: 5, y: 10}, {id: "8-4", x: 8, y: 4},
  {id: "6-3", x: 6, y: 3}, {id: "2-4", x: 2, y: 4},
  {id: "10-1", x: 10, y: 1}, {id: "0-2", x: 0, y: 2},
  {id: "3-9", x: 3, y: 9}, {id: "9-8", x: 9, y: 8},
  {id: "8-0", x: 8, y: 0}, {id: "5-7", x: 5, y: 7},
  {id: "7-8", x: 7, y: 8}, {id: "4-5", x: 4, y: 5},
] as const);

export const COURSE_G04_L11_TI_003_REPLACEMENT_COORDINATE_POOL = deepFreeze([
  {id: "5-4", x: 5, y: 4}, {id: "3-6", x: 3, y: 6},
  {id: "7-1", x: 7, y: 1}, {id: "6-3", x: 6, y: 3},
  {id: "2-0", x: 2, y: 0}, {id: "0-6", x: 0, y: 6},
  {id: "2-9", x: 2, y: 9}, {id: "8-5", x: 8, y: 5},
  {id: "6-10", x: 6, y: 10}, {id: "1-2", x: 1, y: 2},
  {id: "7-7", x: 7, y: 7}, {id: "4-3", x: 4, y: 3},
  {id: "5-8", x: 5, y: 8}, {id: "9-1", x: 9, y: 1},
  {id: "2-4", x: 2, y: 4}, {id: "9-8", x: 9, y: 8},
  {id: "4-1", x: 4, y: 1}, {id: "10-5", x: 10, y: 5},
] as const);

export const COURSE_G04_L11_TI_003_GLOSSARY = deepFreeze([
  {id: "ordered-pair", label: "Ordered pair", sourceButtonObjectIds: [126, 72]},
  {id: "number", label: "Number", sourceButtonObjectIds: [127, 139]},
  {id: "unit", label: "Unit", sourceButtonObjectIds: [128, 140]},
  {id: "zero", label: "Zero", sourceButtonObjectIds: [129, 141]},
  {id: "x-axis", label: "X-axis", sourceButtonObjectIds: [130, 142]},
  {id: "coordinates", label: "Coordinates", sourceButtonObjectIds: [135]},
  {id: "point", label: "Point", sourceButtonObjectIds: [136]},
  {id: "coordinate", label: "Coordinate", sourceButtonObjectIds: [137]},
  {id: "grid", label: "Grid", sourceButtonObjectIds: [138]},
  {id: "location", label: "Location", sourceButtonObjectIds: [71]},
  {id: "coordinate-grid", label: "Coordinate grid", sourceButtonObjectIds: [73]},
  {id: "plot", label: "Plot", sourceButtonObjectIds: [74]},
] as const);

export const COURSE_G04_L11_TI_003_STATIC_EVIDENCE = deepFreeze({
  fla: {path:
    "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/TI/L11TI03.fla",
    bytes: 3_131_904,
    sha256: "6197a41fd60bd1f18a2f54b911e0498c0c57dffb4091d46e6253747752a387d0",
    mode: "0500", nlink: 1, inspectionStatus: "not-complete-legacy-conversion-dialog"},
  swf: {path:
    "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/TI/L11TI03.swf",
    bytes: 442_966,
    sha256: "83b37fa15719e6e50b328ea8621a19a9d362351a706be333b48b2d6730ecc987",
    mode: "0500", nlink: 1},
  externalSpanishAudio: {status: "missing"},
  scenarioInventory: {path:
    "migrations/course-g04-l11-ti-003/audit/scenario-inventory.json",
    bytes: 625_895,
    sha256: "33202b06c443a4501816f01742a990bf716f3497952ba382a76155acbf70adf3"},
  frameDomainDisposition: {path:
    "migrations/course-g04-l11-ti-003/audit/frame-domain-disposition.json",
    bytes: 57_898,
    sha256: "ea123ffa988c5fde27baf31461d3f366e9731e04f2d7e249dde63a6598663f89"},
  audioEvidence: {path:
    "migrations/course-g04-l11-ti-003/audit/audio-runtime-evidence.json",
    bytes: 17_478,
    sha256: "faab66283a7078388baf060d2817251e89c68130e9a5fde37dd5f36ac02a52cf"},
  frameDomainCandidates: {path:
    "migrations/course-g04-l11-ti-003/audit/machine/swf-frame-domain-candidates.json",
    bytes: 9_020,
    sha256: "0c7169c9db5c958a0b59716b684d942ee484bc680b097fd977a2951013a0a189"},
  swfmillStructure: {path:
    "migrations/course-g04-l11-ti-003/audit/machine/swfmill.xml.gz",
    bytes: 978_340,
    sha256: "c9425dcd36a927a457499457deb369d525c408b000445e930665e62962038885"},
} as const);

export const COURSE_G04_L11_TI_003_STATIC_SOURCE_FACTS = deepFreeze({
  animationId: COURSE_G04_L11_TI_003_STATIC_ANIMATION_ID,
  assetId: "swf-83b37fa15719e6e50b328ea8621a19a9d362351a706be333b48b2d6730ecc987",
  release: {releaseId: "lesson-g04-l11-coordinate-grid", ordinal: 27,
    releaseMemberCount: 44, activePageCount: 43,
    role: "active-xml-referenced-page", title: {en: "Question 2", es: ""}},
  runtimeHeader: {signature: "CWS", swfVersion: 6,
    actionScriptVersion: "AS1/2", nativeStage: {width: 799.9, height: 599.75,
      backgroundColor: "#b8d8f7"}, backingStage: {width: 800, height: 600},
    fps: 12, rootFrameCount: 10},
  rootPlacement: {parentTimelineId: "root", childTimelineId: "sprite-346",
    sourceObjectId: 346, frame: 6, depth: 4, instanceName: "animation",
    translationTwips: {x: 8_248, y: 5_666},
    translationPixels: {x: 412.4, y: 283.3}},
  instruction: {heading: "Coordinate Grid: Try It!", prompt:
    "Click the exact location of the ordered pair on the coordinate grid. Click Next Ordered Pair as many times as you like to plot different ordered pairs.",
    promptTemplate: "Plot (x,y) on the coordinate grid.",
    firstQuadrantRange: {minimum: 0, maximum: 10}, gridPointCount: 121,
    initialCoordinatePool: COURSE_G04_L11_TI_003_INITIAL_COORDINATE_POOL,
    replacementCoordinatePool: COURSE_G04_L11_TI_003_REPLACEMENT_COORDINATE_POOL},
  principalTimeline: {timelineId: "sprite-346", frameCount: 236,
    naturalQuizStopFrameFromScript: 235, candidateCleanBackgroundFrame: 230,
    sourceDomainDisposition: "unresolved",
    structuralReachability: "reachable-from-root-placement-graph",
    placementEntryState: "unresolved",
    directSeekLimit:
      "Direct frame selection does not execute pool selection, point handlers, feedback, retry, help, glossary, coach audio, the misspelled replacement branch, or Replay."},
  exactPoint: {timelineId: "sprite-108", pointButtonObjectId: 59,
    scalePixelsPerUnit: {x: 21.8, y: -21.8}, successFeedbackTimelineId: "sprite-115",
    successFeedbackTerminalFrame: 25, nextButtonEnabledAfterFeedback: true},
  wrongTargets: {createdCount: 121, names: {first: "wrong0", last: "wrong120"},
    sourceEnableDisableLoopUpperBoundExclusive: 122,
    sourceOffByOneAttemptsNonexistentWrong121: true},
  poolExhaustionDefect: {sourceExpression: "random(_loc1_.arr.lenght)",
    misspelledProperty: "lenght", naturalRuntimeConsequenceEstablished: false,
    candidateRepairAuthorized: false},
  help: {sourceButtonObjectId: 55, popupTimelineId: "sprite-156", example: "(3,5)",
    explanation:
      "The first number tells how many units over from zero on the x-axis and the second tells how many units up."},
  glossaryControls: COURSE_G04_L11_TI_003_GLOSSARY,
  genericFeedbackRemnants: [
    {timelineId: "sprite-226", frameCount: 48},
    {timelineId: "sprite-252", frameCount: 76},
    {timelineId: "sprite-299", frameCount: 83},
    {timelineId: "sprite-343", frameCount: 70},
  ],
  coachAudio: {timelineId: "sprite-345", frameCount: 55,
    sourceLabels: ["S1", "S2", "S3", "S4"], selection: "random(4)"},
  audio: {embeddedStreamCount: 8,
    principalStream: {timelineId: "sprite-346", blockCount: 213,
      structuralDurationMs: 17_737, format: "mp3", sampleRateHz: 22_050,
      channels: 1}, audibleContentAccepted: false,
    feedbackVariantAudioAccepted: false, synchronizationAccepted: false},
  productBoundary: {modernLessonShellUsed: true,
    legacyCourseShellNavigationAndPlayerChromeIncluded: false,
    coordinatePickerRequired: true, gridPointCount: 121,
    nextOrderedPairRequired: true, helpControlRequired: true,
    glossaryVocabularyRequired: 12, modernReplayProvided: true,
    replacementPoolRepairAuthorized: false, sourceFeedbackSelectionEstablished: false},
  authorityBoundary: {sourceStaticOnly: true, rendererRegistered: false,
    currentJavascriptRegistered: false, sourceDomainDeclared: false,
    originalRuntimeAccepted: false, audioAccepted: false,
    bilingualParityEstablished: false, behaviorParityEstablished: false,
    visualFidelityEstablished: false, humanReviewAccepted: false,
    ownerAccepted: false, strictCompletion: false, lessonRelease: false,
    publication: false}, acceptanceEffect: "none",
} as const);
