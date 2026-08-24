/** Acceptance-neutral source-static facts for G4 L11 TI005. */

export const COURSE_G04_L11_TI_005_STATIC_ANIMATION_ID =
  "course-g04-l11-ti-005" as const;

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

export const COURSE_G04_L11_TI_005_ROWS = deepFreeze([
  {id: "row-1", x: 1, y: 4, sourcePlotButtonObjectId: 129},
  {id: "row-2", x: 2, y: 5, sourcePlotButtonObjectId: 136},
  {id: "row-3", x: 3, y: 6, sourcePlotButtonObjectId: 137},
  {id: "row-4", x: 4, y: 7, sourcePlotButtonObjectId: 138},
  {id: "row-5", x: 5, y: 8, sourcePlotButtonObjectId: 139},
] as const);

export const COURSE_G04_L11_TI_005_GLOSSARY = deepFreeze([
  {id: "value", label: "Value", sourceButtonObjectIds: [171]},
  {id: "equation", label: "Equation", sourceButtonObjectIds: [172]},
  {id: "connected", label: "Connected", sourceButtonObjectIds: [173]},
  {id: "line-segment", label: "Line segment", sourceButtonObjectIds: [174]},
  {id: "coordinate", label: "Coordinate", sourceButtonObjectIds: [175]},
  {id: "grid", label: "Grid", sourceButtonObjectIds: [176]},
  {id: "ordered-pair", label: "Ordered pair", sourceButtonObjectIds: [177]},
  {id: "plot", label: "Plot", sourceButtonObjectIds: [178, 69]},
  {id: "column", label: "Column", sourceButtonObjectIds: [68]},
  {id: "line", label: "Line", sourceButtonObjectIds: [70]},
  {id: "point", label: "Point", sourceButtonObjectIds: [71]},
] as const);

export const COURSE_G04_L11_TI_005_STATIC_EVIDENCE = deepFreeze({
  fla: {path:
    "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/TI/L11TI05.fla",
    bytes: 2_377_216,
    sha256: "166e659fbe37346ea7d4c2a8f437361471487f49a8fa3c4508b71455aa85c3f7",
    mode: "0500", nlink: 1, inspectionStatus: "not-complete-legacy-conversion-dialog"},
  swf: {path:
    "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/TI/L11TI05.swf",
    bytes: 276_773,
    sha256: "43c21cec5b8e67b8af70aca374aec4f2f46c43490e9a19c472798e606467362a",
    mode: "0500", nlink: 1},
  externalSpanishAudio: {status: "missing"},
  scenarioInventory: {path:
    "migrations/course-g04-l11-ti-005/audit/scenario-inventory.json",
    bytes: 657_119,
    sha256: "e330391cca70561e9d66934cbbca8f2cbbb19d39f983b7672b48bd9dd2dd8b0d"},
  frameDomainDisposition: {path:
    "migrations/course-g04-l11-ti-005/audit/frame-domain-disposition.json",
    bytes: 59_429,
    sha256: "708c4a222f7eb763dc9726b2cf0770c8a51972447c43d4fbdc9fa3af2ed12ae5"},
  audioEvidence: {path:
    "migrations/course-g04-l11-ti-005/audit/audio-runtime-evidence.json",
    bytes: 17_468,
    sha256: "ed3df1114521e2b9ada2aa2bd1c8da4a8fb8bf64a928cd854d160e1a5ce71f9f"},
  frameDomainCandidates: {path:
    "migrations/course-g04-l11-ti-005/audit/machine/swf-frame-domain-candidates.json",
    bytes: 9_683,
    sha256: "ed8fecfc8ca4e8723cb255f1211bdedc7116dc53ac19fdb179cf9ac13e4e8484"},
  swfmillStructure: {path:
    "migrations/course-g04-l11-ti-005/audit/machine/swfmill.xml.gz",
    bytes: 344_446,
    sha256: "d0c9aa5793622671c8815a0e65d35e578699395f65758258cf50b7d3c7cd0f0a"},
} as const);

export const COURSE_G04_L11_TI_005_STATIC_SOURCE_FACTS = deepFreeze({
  animationId: COURSE_G04_L11_TI_005_STATIC_ANIMATION_ID,
  assetId: "swf-43c21cec5b8e67b8af70aca374aec4f2f46c43490e9a19c472798e606467362a",
  release: {releaseId: "lesson-g04-l11-coordinate-grid", ordinal: 29,
    releaseMemberCount: 44, activePageCount: 43,
    role: "active-xml-referenced-page", title: {en: "Question 4", es: ""}},
  runtimeHeader: {signature: "CWS", swfVersion: 6,
    actionScriptVersion: "AS1/2", nativeStage: {width: 799.9, height: 599.75,
      backgroundColor: "#b8d8f7"}, backingStage: {width: 800, height: 600},
    fps: 12, rootFrameCount: 10},
  rootPlacement: {parentTimelineId: "root", childTimelineId: "sprite-342",
    sourceObjectId: 342, frame: 6, depth: 4, instanceName: "animation",
    translationTwips: {x: 8_248, y: 5_666},
    translationPixels: {x: 412.4, y: 283.3}},
  instruction: {heading: "Coordinate Grid: Try It!", prompt:
    "Click the text box in the y column, type the correct value for y, and then click Plot Point for each point. When you have plotted all of the points, click Draw Line to connect the points that you plotted.",
    equation: "x + 3 = y", rowCount: 5, rows: COURSE_G04_L11_TI_005_ROWS},
  principalTimeline: {timelineId: "sprite-342", frameCount: 433,
    naturalQuestionStopFrameFromScript: 419, candidateCleanBackgroundFrame: 418,
    structuralTerminalFrame: 433, sourceDomainDisposition: "unresolved",
    structuralReachability: "reachable-from-root-placement-graph",
    placementEntryState: "unresolved",
    directSeekLimit:
      "Direct frame selection does not execute row entry, Plot Point, feedback, five-point threshold, Draw Line, help, glossary, coach audio, or Replay."},
  sourceControls: {plotPointButtonObjectIds: [129, 136, 137, 138, 139],
    drawLineButtonObjectId: 130, needMoreHelpButtonObjectId: 56,
    retryCloseButtonObjectId: 336, glossaryControlCount: 11},
  answerContract: {sourceEquation: "x + 3 = y",
    firstWrongAttemptClearsInputAndRetries: true,
    secondWrongAttemptRevealsAndPlotsExactPoint: true,
    automaticallyRevealedRowCountsTowardThreshold: true,
    drawLineThreshold: 5, sourceUsesNumberCoercion: true,
    candidateUsesCanonicalIntegerInput: true},
  help: {sourceButtonObjectId: 56, exampleEquation: "x + 1 = y",
    examplePairs: ["(1,2)", "(2,3)", "(3,4)", "(4,5)", "(5,6)"],
    explanation:
      "The x and y values in an equation are ordered pairs plotted on a coordinate grid, and when connected, form a line segment."},
  glossaryControls: COURSE_G04_L11_TI_005_GLOSSARY,
  coachAudio: {firstWrongTimelineId: "sprite-335", correctTimelineId: "sprite-341",
    firstWrongLabels: ["S1", "S2", "S3", "S4"]},
  genericFeedbackRemnants: [
    {timelineId: "sprite-237", frameCount: 25},
    {timelineId: "sprite-262", frameCount: 27},
    {timelineId: "sprite-302", frameCount: 27},
    {timelineId: "sprite-333", frameCount: 26},
  ],
  audio: {embeddedStreamCount: 8,
    principalStream: {timelineId: "sprite-342", blockCount: 424,
      structuralDurationMs: 35_291, format: "mp3", sampleRateHz: 22_050,
      channels: 1}, audibleContentAccepted: false,
    feedbackVariantAudioAccepted: false, synchronizationAccepted: false},
  productBoundary: {modernLessonShellUsed: true,
    legacyCourseShellNavigationAndPlayerChromeIncluded: false,
    oldPreloaderIncluded: false, animationInternalPedagogicalControlsPreserved: true,
    yInputsRequired: 5, plotPointControlsRequired: 5,
    drawLineControlRequired: true, helpControlRequired: true,
    glossaryVocabularyRequired: 11, modernReplayProvided: true,
    duplicateOldAndModernControlsAllowed: false},
  authorityBoundary: {sourceStaticOnly: true, rendererRegistered: false,
    currentJavascriptRegistered: false, sourceDomainDeclared: false,
    originalRuntimeAccepted: false, audioAccepted: false,
    bilingualParityEstablished: false, behaviorParityEstablished: false,
    visualFidelityEstablished: false, humanReviewAccepted: false,
    ownerAccepted: false, strictCompletion: false, lessonRelease: false,
    publication: false}, acceptanceEffect: "none",
} as const);
