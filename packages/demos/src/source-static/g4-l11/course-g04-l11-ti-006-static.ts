/** Acceptance-neutral source-static facts for G4 L11 TI006. */

export const COURSE_G04_L11_TI_006_STATIC_ANIMATION_ID =
  "course-g04-l11-ti-006" as const;

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

export const COURSE_G04_L11_TI_006_CHOICES = deepFreeze([
  {id: "two-units", label: "2 units", sourceButtonObjectId: 100,
    sourceInstanceName: "AnsBtn3", correct: false},
  {id: "three-units", label: "3 units", sourceButtonObjectId: 99,
    sourceInstanceName: "AnsBtn1", correct: true},
  {id: "five-units", label: "5 units", sourceButtonObjectId: 101,
    sourceInstanceName: "AnsBtn2", correct: false},
] as const);

export const COURSE_G04_L11_TI_006_GLOSSARY = deepFreeze([
  {id: "number", label: "number", sourceButtonObjectId: 66,
    sourceKeyAttribute: "Number",
    prompt: "A number tells how many or how much."},
  {id: "unit", label: "unit", sourceButtonObjectId: 67,
    sourceKeyAttribute: "Unit",
    prompt: "A unit is the fixed amount used to measure length."},
  {id: "length", label: "length", sourceButtonObjectId: 111,
    sourceKeyAttribute: "Length",
    prompt: "Length tells the distance from one endpoint to the other."},
  {id: "line-segment", label: "line segment", sourceButtonObjectId: 115,
    sourceKeyAttribute: "Line segment",
    prompt: "A line segment is the part of a line between two endpoints."},
  {id: "vertical", label: "vertical", sourceButtonObjectId: 112,
    sourceKeyAttribute: "Vertical",
    prompt: "A vertical segment goes straight up and down."},
  {id: "subtract", label: "subtract", sourceButtonObjectId: 113,
    sourceKeyAttribute: "Subtract",
    prompt: "Subtract to find the difference between two values."},
  {id: "y-coordinate", label: "y-coordinate", sourceButtonObjectId: 114,
    sourceKeyAttribute: "Y-coordinate",
    prompt: "The y-coordinate tells a point's vertical position."},
  {id: "coordinate-grid", label: "coordinate grid", sourceButtonObjectId: 116,
    sourceKeyAttribute: "Coordinate grid",
    prompt: "A coordinate grid locates points with x- and y-coordinates."},
] as const);

export const COURSE_G04_L11_TI_006_STATIC_EVIDENCE = deepFreeze({
  swf: {
    path: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/TI/L11TI06.swf",
    bytes: 136_756,
    sha256: "78b289bf76bf28941755bc30a96d0131bb3b804c115c85b75e187b085515f33e",
    mode: "0500", nlink: 1,
  },
  pairedFla: {
    path: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/TI/L11TI06.fla",
    bytes: 1_498_624,
    sha256: "56d683bc918652b7f520a8b94922b3d27cfe85636984ba9ec95853b48a326e42",
    mode: "0500", nlink: 1, status: "present-partially-inspected",
  },
  externalSpanishAudio: {
    path: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/SA/L11TI06.mp3",
    bytes: 89_376,
    sha256: "6878b4a31c66498c957a453ca29b0d0ac89aa6801cd2baea5fa4c6190ba3edcd",
    status: "present-unaccepted",
  },
  scenarioInventory: {
    path: "migrations/course-g04-l11-ti-006/audit/scenario-inventory.json",
    bytes: 501_974,
    sha256: "d0e682ee58decfe14a07309d9dfeea438a7dba617343b36ac0cdee9872f07984",
  },
  frameDomainDisposition: {
    path: "migrations/course-g04-l11-ti-006/audit/frame-domain-disposition.json",
    bytes: 36_234,
    sha256: "e2e61ffe59e999f44abe135d4dd0b6257707a6fe37f225aa196fa083ddb64c37",
  },
  audioEvidence: {
    path: "migrations/course-g04-l11-ti-006/audit/audio-runtime-evidence.json",
    bytes: 22_177,
    sha256: "2b52ba2618b16a3def10ce075ff837f2c33a049e8306fba24f3b050edd6458a2",
  },
  frameDomainCandidates: {
    path: "migrations/course-g04-l11-ti-006/audit/machine/swf-frame-domain-candidates.json",
    bytes: 6_745,
    sha256: "f7a65c995f88d4985af830724c56516c17fa41f4419db657e1b302a25ef74c46",
  },
  swfmillStructure: {
    path: "migrations/course-g04-l11-ti-006/audit/machine/swfmill.xml.gz",
    bytes: 198_400,
    sha256: "277ffad091728b8d3f6275857e50d4008f262fe665caf7a7eadd98e438bbeb9b",
  },
} as const);

export const COURSE_G04_L11_TI_006_STATIC_SOURCE_FACTS = deepFreeze({
  animationId: COURSE_G04_L11_TI_006_STATIC_ANIMATION_ID,
  assetId: "swf-78b289bf76bf28941755bc30a96d0131bb3b804c115c85b75e187b085515f33e",
  release: {releaseId: "lesson-g04-l11-coordinate-grid", ordinal: 30,
    releaseMemberCount: 44, activePageCount: 43,
    role: "active-xml-referenced-page",
    title: {en: "Question 5", es: null}},
  runtimeHeader: {signature: "CWS", swfVersion: 6,
    actionScriptVersion: "AS1/2", stage: {width: 800, height: 600,
      nativeWidth: 799.9, nativeHeight: 599.75, backgroundColor: "#b8d8f7"},
    fps: 12, rootFrameCount: 10},
  rootPlacement: {parentTimelineId: "root", childTimelineId: "sprite-259",
    sourceObjectId: 259, frame: 6, depth: 4, instanceName: "animation",
    translationTwips: {x: 8_248, y: 5_666},
    translationPixels: {x: 412.4, y: 283.3}},
  instruction: {
    prompt: "Click the number of units for the length of this line segment.",
    orientation: "vertical",
    endpoints: [{x: 2, y: 5, orderedPair: "(2,5)"},
      {x: 2, y: 8, orderedPair: "(2,8)"}],
    sharedX: 2, subtraction: "8 − 5 = 3",
    choices: COURSE_G04_L11_TI_006_CHOICES,
    sourceWrongFeedback: "Read the second part of the rule. Try again.",
    visibleCoaching:
      "Subtract the y-coordinates 8 minus 5 to find the length. Try again.",
  },
  principalTimeline: {timelineId: "sprite-259", frameCount: 95,
    naturalQuizStopFrameFromScript: 76, postCorrectStartFrame: 77,
    terminalFrame: 95, sourceDomainDisposition: "unresolved",
    structuralReachability: "reachable-from-root-placement-graph",
    placementEntryState: "unresolved",
    directSeekLimit: "Direct frame selection does not execute answer branches, feedback selection, help, glossary, host pause/resume, audio synchronization, or terminal behavior."},
  reachableNestedTimelineCount: 12,
  rightFeedbackFamilies: [
    {instance: "Mc_Right_Feed4", timelineId: "sprite-155", frameCount: 25},
    {instance: "Mc_Right_Feed1", timelineId: "sprite-180", frameCount: 27},
    {instance: "Mc_Right_Feed3", timelineId: "sprite-220", frameCount: 27},
    {instance: "Mc_Right_Feed2", timelineId: "sprite-251", frameCount: 26},
  ],
  help: {sourceInstanceName: "NMHBtn", sourceObjectId: 55,
    popupTimelineId: "sprite-123", popupFrameCount: 1,
    coachTimelineId: "sprite-253", coachFrameCount: 55},
  glossary: COURSE_G04_L11_TI_006_GLOSSARY,
  audio: {embeddedStreamCount: 7, principalTimelineBlockCount: 72,
    principalStructuralDurationMs: 5_982, coachBlockCount: 53,
    coachStructuralDurationMs: 4_389, format: "mp3", sampleRateHz: 22_050,
    channels: 1, audibleContentAccepted: false,
    feedbackVariantAudioAccepted: false, synchronizationAccepted: false,
    externalSpanishAudioAccepted: false},
  productBoundary: {modernLessonShellUsed: true,
    legacyCourseShellNavigationAndPlayerChromeIncluded: false,
    legacyPreloaderIncluded: false, duplicateOldAndModernControlsIncluded: false,
    answerChoiceControlsRequired: 3, helpControlRequired: 1,
    animationInternalGlossaryControlsRequired: 8,
    animationInternalPedagogicalControlCount: 12,
    modernReplayProvided: true, sourceFeedbackVariantSelectionEstablished: false},
  authorityBoundary: {sourceStaticOnly: true, rendererRegistered: false,
    currentJavascriptRegistered: false, sourceDomainDeclared: false,
    originalRuntimeAccepted: false, audioAccepted: false,
    bilingualParityEstablished: false, behaviorParityEstablished: false,
    visualFidelityEstablished: false, humanReviewAccepted: false,
    ownerAccepted: false, strictCompletion: false, lessonRelease: false,
    publication: false}, acceptanceEffect: "none",
} as const);
