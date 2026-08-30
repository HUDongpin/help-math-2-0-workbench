/** Acceptance-neutral source-static facts for G4 L11 TI002. */

export const COURSE_G04_L11_TI_002_STATIC_ANIMATION_ID =
  "course-g04-l11-ti-002" as const;

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

export const COURSE_G04_L11_TI_002_MATCHES = deepFreeze([
  {id: "coordinate-grid", term: "coordinate grid", sourceObjectId: 68,
    sourceInstanceName: "Src_1", targetObjectId: 153, targetInstanceName: "Mc_Tar_1",
    targetRow: 3, definition:
      "a grid formed by two intersecting number lines; the horizontal x-axis and the vertical y-axis",
    pictureDescription: "a complete coordinate grid with horizontal and vertical axes"},
  {id: "coordinates", term: "coordinates", sourceObjectId: 70,
    sourceInstanceName: "Src_2", targetObjectId: 157, targetInstanceName: "Mc_Tar_2",
    targetRow: 1, definition:
      "a pair of numbers used to locate a point on a coordinate grid; also called an ordered pair",
    pictureDescription: "a coordinate grid showing an ordered-pair location"},
  {id: "plot", term: "plot", sourceObjectId: 72,
    sourceInstanceName: "Src_3", targetObjectId: 155, targetInstanceName: "Mc_Tar_3",
    targetRow: 2, definition:
      "to locate points on a coordinate grid using ordered pairs or coordinates",
    pictureDescription: "a coordinate grid with several plotted points"},
  {id: "x-axis", term: "x-axis", sourceObjectId: 75,
    sourceInstanceName: "Src_4", targetObjectId: 152, targetInstanceName: "Mc_Tar_4",
    targetRow: 5, definition: "the horizontal number line on a coordinate grid",
    pictureDescription: "a coordinate grid with the horizontal axis highlighted"},
  {id: "y-axis", term: "y-axis", sourceObjectId: 77,
    sourceInstanceName: "Src_5", targetObjectId: 150, targetInstanceName: "Mc_Tar_5",
    targetRow: 4, definition: "the vertical number line on a coordinate grid",
    pictureDescription: "a coordinate grid with the vertical axis highlighted"},
] as const);

export const COURSE_G04_L11_TI_002_TARGET_ROWS = deepFreeze([
  {row: 1, correctTermId: "coordinates", pictureButtonObjectId: 180},
  {row: 2, correctTermId: "plot", pictureButtonObjectId: 181},
  {row: 3, correctTermId: "coordinate-grid", pictureButtonObjectId: 182},
  {row: 4, correctTermId: "y-axis", pictureButtonObjectId: 183},
  {row: 5, correctTermId: "x-axis", pictureButtonObjectId: 184},
] as const);

export const COURSE_G04_L11_TI_002_GLOSSARY = deepFreeze([
  {id: "pair", label: "Pair", sourceButtonObjectId: 112},
  {id: "number", label: "Number", sourceButtonObjectId: 113},
  {id: "locate", label: "Locate", sourceButtonObjectId: 114},
  {id: "coordinate-grid", label: "Coordinate Grid", sourceButtonObjectId: 115},
  {id: "ordered-pair", label: "Ordered pair", sourceButtonObjectId: 116},
  {id: "point", label: "Point", sourceButtonObjectId: 117},
  {id: "coordinate", label: "Coordinate", sourceButtonObjectId: 121},
  {id: "grid", label: "Grid", sourceButtonObjectId: 125},
  {id: "number-line", label: "Number line", sourceButtonObjectId: 126},
  {id: "intersect", label: "Intersect", sourceButtonObjectId: 127},
  {id: "horizontal", label: "Horizontal", sourceButtonObjectId: 128},
  {id: "vertical", label: "Vertical", sourceButtonObjectId: 129},
  {id: "x-axis", label: "X-axis", sourceButtonObjectId: 130},
  {id: "y-axis", label: "Y-axis", sourceButtonObjectId: 131},
  {id: "form", label: "Form", sourceButtonObjectId: 132},
] as const);

export const COURSE_G04_L11_TI_002_STATIC_EVIDENCE = deepFreeze({
  fla: {path:
    "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/TI/L11TI02.fla",
    bytes: 1_983_488,
    sha256: "dfd919b45da3817828cfd3accbdf238c510f5e29753f76a8c16b90c1a53ccec3",
    mode: "0500", nlink: 1, inspectionStatus: "not-complete-legacy-conversion-dialog"},
  swf: {path:
    "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/TI/L11TI02.swf",
    bytes: 208_674,
    sha256: "80c3b4c7ab4f69e0f7cc9f41cf8a6ca310d4724865d270f235cc580a4ea7df22",
    mode: "0500", nlink: 1},
  externalSpanishAudio: {status: "missing"},
  scenarioInventory: {path:
    "migrations/course-g04-l11-ti-002/audit/scenario-inventory.json",
    bytes: 850_870,
    sha256: "4c849d7a27fa29de64df4dd793afd10d45adc206ca1b905b3ad095731c027688"},
  frameDomainDisposition: {path:
    "migrations/course-g04-l11-ti-002/audit/frame-domain-disposition.json",
    bytes: 92_391,
    sha256: "d3e7f97cee7b2fd05ac858f7daefdcb27a28eb3236a5ce8b315694c6061b7f57"},
  audioEvidence: {path:
    "migrations/course-g04-l11-ti-002/audit/audio-runtime-evidence.json",
    bytes: 17_465,
    sha256: "5c925a88089d9859c93e5785de26030fb27ee26706ef91aabc1fa7036520acd6"},
  frameDomainCandidates: {path:
    "migrations/course-g04-l11-ti-002/audit/machine/swf-frame-domain-candidates.json",
    bytes: 14_558,
    sha256: "e4916b3d2611e03a9b3cb0ac9797a1b32f609c8451817831f1bd554fc7b9fa35"},
  swfmillStructure: {path:
    "migrations/course-g04-l11-ti-002/audit/machine/swfmill.xml.gz",
    bytes: 277_307,
    sha256: "0ca80c77bdf047e40c6159487f0db1d3223154e995c19d212a0ce3302e6ac533"},
} as const);

export const COURSE_G04_L11_TI_002_STATIC_SOURCE_FACTS = deepFreeze({
  animationId: COURSE_G04_L11_TI_002_STATIC_ANIMATION_ID,
  assetId: "swf-80c3b4c7ab4f69e0f7cc9f41cf8a6ca310d4724865d270f235cc580a4ea7df22",
  release: {releaseId: "lesson-g04-l11-coordinate-grid", ordinal: 26,
    releaseMemberCount: 44, activePageCount: 43,
    role: "active-xml-referenced-page", title: {en: "Question 1", es: "Pregunta 1"}},
  runtimeHeader: {signature: "CWS", swfVersion: 6,
    actionScriptVersion: "AS1/2", stage: {width: 800, height: 600,
      backgroundColor: "#b8d8f7"}, fps: 12, rootFrameCount: 10},
  rootPlacement: {parentTimelineId: "root", childTimelineId: "sprite-325",
    sourceObjectId: 325, frame: 6, depth: 4, instanceName: "animation",
    translationTwips: {x: 8_248, y: 5_666},
    translationPixels: {x: 412.4, y: 283.3}},
  instruction: {prompt:
    "Match the key terms with the most correct definitions and pictures. Several of these definitions will have more than one correct answer. Choose the best answer. Click and drag the key terms to place them where they belong.",
    heading: "Coordinate Grid: Try It!", sourceTerms: COURSE_G04_L11_TI_002_MATCHES,
    targetRows: COURSE_G04_L11_TI_002_TARGET_ROWS, completionCount: 5},
  principalTimeline: {timelineId: "sprite-325", frameCount: 247,
    naturalQuizStopFrameFromScript: 230, sourceDomainDisposition: "unresolved",
    structuralReachability: "reachable-from-root-placement-graph",
    placementEntryState: "unresolved",
    directSeekLimit: "Direct frame selection does not execute drag branches, random feedback/audio selection, popup state, glossary interruption, completion, or terminal behavior."},
  reachableNestedTimelineCount: 35,
  rightFeedbackFamilies: [
    {timelineId: "sprite-216", frameCount: 25, visibleFamily: "Excellent!"},
    {timelineId: "sprite-241", frameCount: 27, visibleFamily: "YOU GOT IT!"},
    {timelineId: "sprite-281", frameCount: 27, visibleFamily: "Good Job!"},
    {timelineId: "sprite-312", frameCount: 26, visibleFamily: "Great Job!"},
  ],
  coachAudio: {timelineId: "sprite-314", frameCount: 55,
    sourceLabels: ["S1", "S2", "S3", "S4"], selection: "random(4)"},
  glossaryControls: COURSE_G04_L11_TI_002_GLOSSARY,
  audio: {embeddedStreamCount: 8,
    principalStream: {timelineId: "sprite-325", blockCount: 231,
      structuralDurationMs: 19_226, format: "mp3", sampleRateHz: 22_050,
      channels: 1}, audibleContentAccepted: false,
    feedbackVariantAudioAccepted: false, synchronizationAccepted: false},
  productBoundary: {modernLessonShellUsed: true,
    legacyCourseShellNavigationAndPlayerChromeIncluded: false,
    sourceTermCount: 5, sourceTargetCount: 5, pictureEnlargeControlsRequired: 5,
    glossaryVocabularyRequired: 15, modernReplayProvided: true,
    sourceFeedbackVariantSelectionEstablished: false},
  authorityBoundary: {sourceStaticOnly: true, rendererRegistered: false,
    currentJavascriptRegistered: false, sourceDomainDeclared: false,
    originalRuntimeAccepted: false, audioAccepted: false,
    bilingualParityEstablished: false, behaviorParityEstablished: false,
    visualFidelityEstablished: false, humanReviewAccepted: false,
    ownerAccepted: false, strictCompletion: false, lessonRelease: false,
    publication: false}, acceptanceEffect: "none",
} as const);
