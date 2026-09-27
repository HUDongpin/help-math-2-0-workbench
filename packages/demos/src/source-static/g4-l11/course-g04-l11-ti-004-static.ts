/** Acceptance-neutral source-static facts for G4 L11 TI004. */

export const COURSE_G04_L11_TI_004_STATIC_ANIMATION_ID =
  "course-g04-l11-ti-004" as const;

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

export const COURSE_G04_L11_TI_004_POINTS = deepFreeze([
  {id: "A", x: 3, y: 5, sourceTimelineId: "sprite-161"},
  {id: "B", x: 9, y: 2, sourceTimelineId: "sprite-165"},
  {id: "C", x: 1, y: 4, sourceTimelineId: "sprite-168"},
  {id: "D", x: 7, y: 8, sourceTimelineId: "sprite-171"},
  {id: "E", x: 4, y: 9, sourceTimelineId: "sprite-292"},
] as const);

export const COURSE_G04_L11_TI_004_GLOSSARY = deepFreeze([
  {id: "ordered-pair", label: "Ordered pair", sourceButtonObjectIds: [133, 312]},
  {id: "x-coordinate", label: "X-coordinate", sourceButtonObjectIds: [134]},
  {id: "y-coordinate", label: "Y-coordinate", sourceButtonObjectIds: [138]},
  {id: "point", label: "Point", sourceButtonObjectIds: [306, 67]},
  {id: "coordinate-grid", label: "Coordinate grid", sourceButtonObjectIds: [307, 68]},
  {id: "zero", label: "Zero", sourceButtonObjectIds: [308, 418]},
  {id: "x-axis", label: "X-axis", sourceButtonObjectIds: [309, 419]},
  {id: "locate", label: "Locate", sourceButtonObjectIds: [310]},
  {id: "unit", label: "Unit", sourceButtonObjectIds: [311, 417]},
  {id: "y-axis", label: "Y-axis", sourceButtonObjectIds: [313]},
  {id: "coordinate", label: "Coordinate", sourceButtonObjectIds: [315, 69]},
  {id: "number", label: "Number", sourceButtonObjectIds: [316, 416]},
] as const);

export const COURSE_G04_L11_TI_004_STATIC_EVIDENCE = deepFreeze({
  fla: {path:
    "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/TI/L11TI04.fla",
    bytes: 3_747_328,
    sha256: "f093747b59dbc2f2c095e00f8ebd883899a4a4c7c448058a6773cc76369ab357",
    mode: "0500", nlink: 1, inspectionStatus: "not-complete-legacy-conversion-dialog"},
  swf: {path:
    "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/TI/L11TI04.swf",
    bytes: 481_090,
    sha256: "84b1c705d5f6799b09ceb295f52219c9d2bf7c39cfbe88ca6330be8fa5dd0511",
    mode: "0500", nlink: 1},
  externalSpanishAudio: {status: "missing"},
  scenarioInventory: {path:
    "migrations/course-g04-l11-ti-004/audit/scenario-inventory.json",
    bytes: 956_678,
    sha256: "a926008ab92d9d700cda1978f83d2708dea2c735a34e6455af7724a89f145d7d"},
  frameDomainDisposition: {path:
    "migrations/course-g04-l11-ti-004/audit/frame-domain-disposition.json",
    bytes: 61_881,
    sha256: "f6a3379bdc7f79ec6ec23528011ececc2b7663e07e8f872f7715f5862524366e"},
  audioEvidence: {path:
    "migrations/course-g04-l11-ti-004/audit/audio-runtime-evidence.json",
    bytes: 21_966,
    sha256: "8084bfcce22e7ac7c080bb6e66fc7d1bc75c3e62c4a6f6789604bb280562a444"},
  frameDomainCandidates: {path:
    "migrations/course-g04-l11-ti-004/audit/machine/swf-frame-domain-candidates.json",
    bytes: 10_334,
    sha256: "673833c9b7b9e9e9349ab5db47676b85e9f2b2bb858bdfaedd2c84ee3b8b0299"},
  swfmillStructure: {path:
    "migrations/course-g04-l11-ti-004/audit/machine/swfmill.xml.gz",
    bytes: 1_026_091,
    sha256: "fc71e77a636e7f4ff293d24ad6b9d24651825728a4763ea3408f5204971b80ec"},
} as const);

export const COURSE_G04_L11_TI_004_STATIC_SOURCE_FACTS = deepFreeze({
  animationId: COURSE_G04_L11_TI_004_STATIC_ANIMATION_ID,
  assetId: "swf-84b1c705d5f6799b09ceb295f52219c9d2bf7c39cfbe88ca6330be8fa5dd0511",
  release: {releaseId: "lesson-g04-l11-coordinate-grid", ordinal: 28,
    releaseMemberCount: 44, activePageCount: 43,
    role: "active-xml-referenced-page", title: {en: "Question 3", es: ""}},
  runtimeHeader: {signature: "CWS", swfVersion: 6,
    actionScriptVersion: "AS1/2", nativeStage: {width: 799.9, height: 599.75,
      backgroundColor: "#b8d8f7"}, backingStage: {width: 800, height: 600},
    fps: 12, rootFrameCount: 10},
  rootPlacement: {parentTimelineId: "root", childTimelineId: "sprite-423",
    sourceObjectId: 423, frame: 6, depth: 4, instanceName: "animation",
    translationTwips: {x: 8_248, y: 5_666},
    translationPixels: {x: 412.4, y: 283.3}},
  instruction: {heading: "Coordinate Grid: Try It!", prompt:
    "Click a point on the coordinate grid, then click the text boxes, type the coordinates, and click the Done button. When you get the correct answer, click the Clear button to try another point.",
    pointCount: 5, inputFieldCount: 10, points: COURSE_G04_L11_TI_004_POINTS},
  principalTimeline: {timelineId: "sprite-423", frameCount: 275,
    naturalQuestionStopFrameFromScript: 274, candidateCleanBackgroundFrame: 273,
    structuralTerminalFrame: 275, sourceDomainDisposition: "unresolved",
    structuralReachability: "reachable-from-root-placement-graph",
    placementEntryState: "unresolved",
    directSeekLimit:
      "Direct frame selection does not execute point selection, text entry, Done, Clear, feedback, help, glossary, coach audio, or Replay."},
  sourceControls: {doneButtonObjectId: 154, clearButtonObjectId: 153,
    needMoreHelpButtonObjectId: 56, wrongFeedbackCloseButtonObjectId: 407,
    glossaryControlCount: 12},
  answerContract: {firstWrongAttemptShowsCoachAndRetry: true,
    secondWrongAttemptRevealsExactCoordinates: true,
    correctAttemptEnablesClearAfterFeedback: true,
    sourceUsesParseIntComparison: true,
    candidateUsesCanonicalIntegerInput: true,
    sourceClearFieldResetEstablished: false,
    modernBoundedSelectedRowResetApplied: true},
  help: {sourceButtonObjectId: 56, examplePoint: "M", example: "(4,3)",
    explanation: "Move 4 units over on the x-axis, then 3 units up on the y-axis."},
  glossaryControls: COURSE_G04_L11_TI_004_GLOSSARY,
  feedback: {rightTimelineId: "sprite-400", rightTerminalFrame: 25,
    wrongTimelineId: "sprite-410", wrongTerminalFrame: 15,
    firstWrongCoachTimelineId: "sprite-412", correctCoachTimelineId: "sprite-422"},
  genericFeedbackRemnants: [
    {timelineId: "sprite-241", frameCount: 48},
    {timelineId: "sprite-289", frameCount: 83},
    {timelineId: "sprite-352", frameCount: 76},
    {timelineId: "sprite-396", frameCount: 70},
  ],
  audio: {embeddedStreamCount: 12,
    principalStream: {timelineId: "sprite-423", blockCount: 268,
      structuralDurationMs: 22_309, format: "mp3", sampleRateHz: 22_050,
      channels: 1}, audibleContentAccepted: false,
    feedbackVariantAudioAccepted: false, synchronizationAccepted: false},
  productBoundary: {modernLessonShellUsed: true,
    legacyCourseShellNavigationAndPlayerChromeIncluded: false,
    oldPreloaderIncluded: false, animationInternalPedagogicalControlsPreserved: true,
    pointSelectionRequired: 5, coordinateInputsRequired: 10,
    doneControlRequired: true, clearControlRequired: true,
    helpControlRequired: true, glossaryVocabularyRequired: 12,
    modernReplayProvided: true, duplicateOldAndModernControlsAllowed: false},
  authorityBoundary: {sourceStaticOnly: true, rendererRegistered: false,
    currentJavascriptRegistered: false, sourceDomainDeclared: false,
    originalRuntimeAccepted: false, audioAccepted: false,
    bilingualParityEstablished: false, behaviorParityEstablished: false,
    visualFidelityEstablished: false, humanReviewAccepted: false,
    ownerAccepted: false, strictCompletion: false, lessonRelease: false,
    publication: false}, acceptanceEffect: "none",
} as const);
